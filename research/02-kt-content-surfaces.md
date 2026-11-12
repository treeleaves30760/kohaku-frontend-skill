# 02 — KohakuTerrarium: content & conversation surfaces, data-heavy views

Source: `<clones>/KohakuTerrarium/src/kohakuterrarium-frontend` (Vue 3 + UnoCSS + Element Plus, JS).
All paths below are relative to `src/` unless they start with `uno.config.js` / repo root.
Scope: chat, session-v2, sessions (trace/cost), subagents, panels (canvas/debug/logs), editor, graph,
lab, studio (light), drives, admin/auth/host-picker, `public/chat` (shared chat-ui package), `ext` (HUD / SDK UI).
Out of scope (covered in 01): app chrome, layout, settings shell, the base palette/shortcuts/type tiers.

Legend: **[STRONG]** = recurring rule seen in 3+ places or defended in commits/tests.
**[ONE-OFF]** = local choice, don't over-generalize. **[INCONSISTENT]** = the codebase disagrees with itself.

---

## 0. The ten principles (TL;DR)

1. **Scope the conversation palette with CSS variables on a host class**, never hard-code colors inside
   shared chat leaves. `.kt-conversation-host` defines `--kt-conversation-*`; leaves only read them with a
   fallback chain `var(--kt-conversation-x, var(--kt-color-y, #hex))`. [STRONG]
2. **Streaming must cost O(changed tail)**: throttle markdown to 80 ms, cache finished blocks, coalesce scroll
   to one rAF per DOM commit, `content-visibility:auto` on message bodies, bounded render window. [STRONG]
3. **Never flash half-built rich content while streaming**: unclosed fences render un-highlighted, Mermaid only
   renders closed fences, a partial `<ui` line is held back, inline UI shows its *last valid* render. [STRONG]
4. **Follow-the-tail is opt-out by gesture**: auto-scroll only when within 80 px (outer) / 32 px (inner
   boxes) of the bottom; any upward scroll suspends it; returning to the bottom resumes it. [STRONG]
5. **Collapse by default, summarize in the header**: tool calls, tool batches (≥3), reasoning, errors,
   triggers, compaction banners are one-line accordions whose header carries status glyph + name + truncated
   args/preview + elapsed. Details mount lazily only when open. [STRONG]
6. **Color = semantic role from the gem palette, plus a text/icon label**: sapphire = tool, taaffeite =
   sub-agent, iolite = accent/focus/user-ish, amber = attention/running/queued, coral = error/danger,
   sage = done, aquamarine = live/success/channel. "Status color alone is insufficient." [STRONG]
7. **Muted chrome, loud content**: identifiers, timestamps, model names, token counts are `text-warm-400/500`
   + `font-mono` + `text-[10px]/[11px]`; the user's content (summary, message text) is the darkest text. [STRONG]
8. **Every async surface has four states in fixed order**: error (coral, `role="alert"`, Retry) → loading
   ("Loading…" text or pulse skeleton only when truly empty) → empty (icon + one sentence, keeps card shape) →
   content. [STRONG]
9. **No idle animation**: only things the user wants to see moving pulse (processing line, reconnect banner,
   compacting dot); graph motion is one-shot; all pulses honor `prefers-reduced-motion`. [STRONG]
10. **Microcopy is plain, specific, and says why**: "Generating — earlier messages load when this turn
    finishes", "Clear conversation context? Chat history will be preserved in the session.", errors as
    "Could not X: {error}". One playful exception: the processing label "KohakUwUing...". [STRONG]

---

## 1. Conversation palette scoping (`kt-conversation-host`)

### 1.1 The token block [STRONG]
`components/chat/shared/conversation-message.css:1-31`

```css
.kt-conversation-host {
  --kt-conversation-text: var(--kt-color-warm-700, #4a4540);
  --kt-conversation-muted: var(--kt-color-warm-500, #8a8480);
  --kt-conversation-surface: var(--kt-color-warm-50, #f7f5f2);
  --kt-conversation-surface-raised: #ffffff;
  --kt-conversation-border: var(--kt-color-warm-200, #e0dbd4);
  --kt-conversation-accent: var(--kt-color-iolite, #5a4fcf);
  --kt-conversation-accent-tint: var(--kt-color-iolite, #5a4fcf);
  --kt-conversation-warning: var(--kt-color-amber, #d4920a);
  --kt-conversation-warning-text: var(--kt-color-amber-shadow, #8b5e00);
  --kt-conversation-attention: var(--kt-color-amber, #d4920a);
  --kt-conversation-error: var(--kt-color-coral, #d46b6b);
  --kt-conversation-success: var(--kt-color-aquamarine, #4c9989);
  --kt-conversation-code: var(--kt-color-warm-900, #2a2724);
  --kt-conversation-reasoning-text: var(--kt-color-warm-700, #4a4540);
}
.dark .kt-conversation-host { --kt-conversation-accent: var(--kt-color-iolite-light, #ddd0f0); /* … */ }
```

- Leaves (`.kt-transcript-*`, `.kt-conversation-*`) only consume these with **triple fallback**:
  `var(--kt-conversation-accent, var(--kt-color-iolite, #5a4fcf))` (`chat-transcript-section.css:54`).
  Reason: the same leaves run inside the Dashboard *and* a VS Code webview ("host seams"), so they must
  render sanely without the app stylesheet.
- In dark mode the *accent swaps to the `-light` gem shade* (iolite-light, coral-light…) instead of a
  darker shade — gems only have `light / DEFAULT / shadow` (palette guard test bans `-dark/-deep`,
  `style.palette-guard.test.js:17-21`).
- Tints are made with `color-mix(in srgb, var(--token) N%, transparent)` rather than new tokens:
  reasoning 5%/20% border (dark 10%/25%), error banner 8%/35%, compaction 6%/25%
  (`conversation-message.css:86-96, 223-234`). [STRONG: same 5–10% fill / 20–35% border ratios everywhere]

### 1.2 Per-shell override, not per-component [STRONG]
The v2 shell raises transcript contrast by overriding the *same variables* under its root, not by touching
components (`components/session-v2/surfaces.css:37-47`):

```css
/* Transcript text reads at the contrast of the active tab's label: near black (light), near white (dark). */
.kt-v2 .kt-conversation-host { --kt-conversation-text: #24211d; --kt-conversation-reasoning-text: #4a4540; --color-text: #24211d; }
html.dark .kt-v2 .kt-conversation-host { --kt-conversation-text: #f3efe9; … }
```

Composer gets its own prefix `--kc-*` mapped from gem tokens at the host boundary
(`components/chat/chat-panel.css` `:deep(.kt-chat-composer){ --kc-iolite…; --kc-focus: color-mix(… 40%) }`),
and the package CSS (`public/chat/chat-composer.css`) uses only `currentColor` defaults so it is themeable.
Commit `b61d03db fix(studio): restore dark chat colors at the host boundary` and `012546b6 restore the gem
look of the chat, composer and thinking blocks` show the failure mode: when the host boundary forgets the
mapping, the package falls back to neutral colors — fix at the boundary, never inside the leaf.

### 1.3 Pattern to reproduce
- Shared conversation package = class-based CSS with BEM-ish names (`kt-conversation-banner is-error`,
  `kt-conversation-compact__chevron is-expanded`) and only variable colors.
- App host = one wrapper class that maps the design system onto those variables, plus dark-mode variant.
- Shell variant = override a few variables under a shell root class.

---

## 2. Transcript layout & information hierarchy

### 2.1 Message geometry [STRONG]
`conversation-message.css:33-74`, `MessageRow.vue:73,151,190`
- List: flex column, `gap: 0.75rem`; body text `0.875rem / 1.55`; markdown `line-height: 1.65`.
- **User**: right-aligned (`align-self:flex-end` / `ml-auto`), `max-w-[80%]` (`min(80%, 46rem)`), a soft
  bubble `background: var(--kt-conversation-surface)` (warm-50), radius 0.75rem, small muted author label
  "You" above the text. (Commit `a78aaa2e style: distinguish user message bubble from chat background`.)
- **Assistant**: *no bubble*, left, `max-w-[90%]` (`min(92%, 52rem)`); text sits directly on the canvas.
  Hierarchy: the model's output is the page; only the user's turn is boxed.
- **Channel (group chat)**: sender header (5×5 rounded-md gem square with initial + name in the same gem
  color + timestamp `text-[10px] text-warm-400`), shown **only when sender changes** (`showSenderHeader`,
  `MessageRow.vue:391-395`); body indented `pl-7`. Sender colors cycle a module-scoped gem list so a sender
  keeps one color app-wide (`MessageRow.vue:261-275`, comment: "If this were declared inside `<script setup>`,
  each message would have its own cache and the same sender would cycle through colors.").
- **System**: centered muted `0.75rem` (`.kt-conversation-system`).
- **Context cleared / dividers**: dashed rule both sides with label in the middle
  (`.kt-conversation-divider::before/::after { border-top: 1px dashed }`).
- **Background result delivered**: same dashed-divider idiom in iolite/20 with `i-carbon-arrow-down-left`
  (`MessageRow.vue:13-17`) — out-of-band events are dividers, not messages.
- v2 shell centers a reading column: `--kt-v2-read-width: 58rem`, list `margin-inline:auto`, composer
  aligned to the same width (`session-v2/chat/ChatColumn.vue:178-195`).

### 2.2 Event rows as tinted accordions [STRONG]
Non-conversational events get a 1-line rounded tinted strip with an icon/dot, an explanation, and an
optional chevron when there is a payload:
- Trigger: amber/6 bg, amber/15 border, amber dot, "Triggered by **name**" (`MessageRow.vue:59-70`).
- Wire inbound: iolite/6 bg, `i-carbon-connect`, "Inbound from **name**" + "· ping (no content)" at
  opacity-60 (`MessageRow.vue:41-57`). The template comment states the *why*: "Rendered as a compact
  accordion so the user knows why this creature suddenly started processing without typing anything in this tab."
- Expanded payload: `max-h-32 overflow-y-auto`, rendered as markdown.
- `role="button" tabindex="0" :aria-expanded` + Enter/Space handlers on every clickable div header
  (commit `0a77bc16` added keyboard nav to all interactive divs).

### 2.3 Errors in the transcript [STRONG]
`MessageRow.vue:20-34`: coral banner, collapsed by default. Header = `✗` + `errorType || "Processing Error"`
(semibold coral) + **first line of the message truncated to 80 chars** in mono `max-w-[60%]` + chevron.
Expanded body = full text mono `whitespace-pre-wrap`. Rule: an error shows *what* (type) and *a hint*
(first line) at a glance, full stack only on demand.

### 2.4 Header strip of the chat (v1) [ONE-OFF but instructive]
`ChatPanel.vue:32-47`: model name + `| in: 12.3K (cache 4K) out: 1.2K | context: 63%` in
`text-[10px] font-mono text-warm-400`; cached figure in aquamarine; context % turns amber ≥60, coral ≥80.
Same thresholds as `contextTone()` in `session-v2/model/status/statusModel.js:40-44` ("calm below 60, warn
below 80, bad above") [STRONG: 60/80 thresholds].

---

## 3. Streaming rendering

### 3.1 Markdown throttle + incremental blocks [STRONG]
`public/chat/MarkdownRenderer.vue:318-380`

```js
/* `md.render` + `hljs.highlight` is expensive and grows with content length — running it on every
 * streaming chunk (~30 fps) saturates both CPU and GPU (the latter because `v-html` swaps the whole
 * subtree, invalidating every code-block compositor layer). We coalesce rapid updates: the last-requested
 * render runs at most once per THROTTLE_MS, plus a guaranteed trailing render so the final content is
 * always correct. A brand-new mount / cleared content renders synchronously to avoid a flicker of empty
 * output. `shallowRef` avoids deep reactivity on a value that's always replaced whole. */
const THROTTLE_MS = 80 // ~12 fps during streaming; user eye can't tell
```

- `IncrementalMarkdownRenderer` (`public/chat/markdownIncremental.js:1-28`): splits at blank lines, caches
  finished block HTML, re-renders only the tail; fences/`$$` swallow blank lines; adjacent same-marker lists
  merge; reference-link defs → full render fallback. Commit `f80cd066`: "each window costs O(changed tail)
  instead of O(total). Equivalence against whole-document markdown-it output is pinned by tests."
- Stable ids from event ids, not positions (same commit): "positional ids … shifted every later id and
  remounted the whole conversation tail on each post-turn resync." → **Rule: key streamed rows by origin
  event id; positional keys remount the tail.**

### 3.2 Don't render half-built constructs [STRONG]
- Unclosed code fence: a custom fence rule marks `unclosedFence` and renders it **without highlight**
  (`MarkdownRenderer.vue:124-168`).
- Mermaid: only when the fence is closed and non-empty; until the lazy SVG is ready the code block is shown;
  failures fall back to the code block; SVG cached per (theme, source), LRU 100, `securityLevel:"strict"`,
  loaded on first use (`public/chat/mermaidRender.js:1-40`).
- Inline `<ui>` blocks: `splitMarkup(text, { holdPartial: streaming })` — "a last line that may grow into
  `<ui` is left out, so the tag never flashes as text" (`chat/widgets/ktui/markup.js:359-364`).
- `InlineUiBlock.vue:2-7`: "While the reply streams it shows the last version that converted and validated;
  a block that fails shows an error box with its source, never breaking the rest of the message." Pending
  copy: "Building UI…"; failure: "This UI block could not be shown: {err}" + `<details>` "Source".
- Reasoning fragments from two provider fields are merged into one block (commit `bd080711`: the transcript
  "alternate[d] 'Thinking' / 'Thinking details' accordions").

### 3.3 Robust math [STRONG for anything rendering LLM LaTeX]
`MarkdownRenderer.vue:224-312`: normalize CRLF, strip `\p{Cf}` + listed invisible chars that split KaTeX
control sequences, convert `\( \)`→`$ $`, `\[ \]`→`$$ $$` with blank lines. KaTeX errors are **not shown
red**: replaced with `<code class="katex-fallback">` (dashed taaffeite-ish border, muted text) and the error
goes to `console.warn` with char codes. CSS comment: "show raw LaTeX in a subdued tone so the user isn't
confronted with a red parse-error block. Real errors go to the dev console."
Also `markdown-it-cjk-friendly` because "CJK text puts punctuation right inside emphasis ("**重點：**正文")".
`html: false`, `linkify: true`, `typographer: false`; model links are routed so they "must not navigate the
shell away from the app" (`applyExternalLinkRule`).

### 3.4 Processing / status line [STRONG]
`ChatTranscriptSection.js:229-245` + `chat-transcript-section.css:102-131`: after the last message, a
`role="status" aria-live="polite"` row: amber dot + amber/80 label, both pulsing opacity 0.4↔1 over 1.5 s;
disabled under `prefers-reduced-motion`. Label composition (`ChatPanel.vue:439-452`), most specific wins:
recovering/retrying model → "Writing {tool} arguments… 12.5 KB" (streamed tool-arg byte progress,
`toolArgsProgress.js`) → "(streaming + N background)" → "(waiting on N background)" → "KohakUwUing...".
**Rule: the busy indicator names what is actually happening, with live size/count.**
Reconnect: one amber strip at the top "↻ Disconnected — reconnecting…" (commit `012546b6`: "the reconnect
banner is shown once instead of twice").

---

## 4. Tool-call blocks

### 4.1 Anatomy (`components/chat/ToolCallBlock.vue`) [STRONG]
```
┌ border sapphire/20 (sub-agent: taaffeite/25), rounded-lg, overflow-hidden
│ header  bg sapphire/8 · text-xs · px-3 py-1.5 · role=button aria-expanded
│   [status glyph] [name: mono semibold iolite]  [args: mono warm-400 truncate flex-1]  [elapsed 10px mono] [→ bg] [chevron]
│ pinned media strip (always visible, sapphire/4)          ← the tool's *product* stays above the fold
│ expanded: output (mono xs warm-500, pre-wrap, max-h-64 scroll, sapphire/4) | extension renderer
│ "Output truncated · 12,345 bytes omitted" strip (amber-shadow text, 10px mono)
│ "Saved artifacts" link list (10px mono, iolite, truncate + title)
└
```
- Status glyphs are text, not icons: running `⚙` amber + `kohaku-pulse`, error `✗` coral, interrupted `○`
  amber, done `✓` sage (`ToolCallBlock.vue:252-257`); batch header "mirrors ToolCallBlock so the visual
  language is consistent: running > error > interrupted > done" (`ToolCallBatch.vue:73-81`).
- Args summary: `k=v` pairs, string values cut at 50 chars + "...", raw string args cut at 80, drops empty
  `info` (`formatArgs`, :259-269).
- Name prefix `[sub] name` for sub-agents; `· model: X` appended to args.
- Elapsed ticks every second from a store tick while running; `toFixed(1)s` once done.
- "→ bg" promote button appears only after 1 s of running (`canPromote`, :240-250) — avoid flashing an action
  for fast tools. [ONE-OFF but good]
- Running sub-agents auto-expand **once** when their first child appears (`_didAutoExpand`), never fight
  the user afterwards (:228-238).
- Media policy: tool metadata decides `pinned` vs collapsible media (comment :18-19: "a file the creature
  merely looked at folds away").
- Inner scrollers (children list, result) follow the bottom while streaming unless the user scrolled up;
  `NEAR_BOTTOM_PX = 32` (:175-218).
- Sub-agent result box gets a bottom fade mask removed on hover (`.sa-result`, :295-303) — a "there is
  more" hint without a button. [ONE-OFF]
- Sub-agent stats strip: solid taaffeite/15 bar, 10px mono "3 turns  12,345 tokens  (10k in / 2k out)  4.2s".
- Nested child tools sit on a **warm recessed bg** (`bg-warm-100 dark:bg-warm-800/80`) so "sapphire tool
  items pop against it" (comment :30).

### 4.2 Batching [STRONG]
`public/chat/chatToolGrouping.js`: ≥3 consecutive plain tool calls → one `ToolCallBatch` accordion, collapsed.
Sub-agents, text and images break the run; batch id = `batch_${firstTool.id}` "so the batch ID stays stable
as streaming appends later tool calls and the renderer can preserve expansion state".
Header: "N tool calls" + name summary `read ×3, bash, edit, +2 more` (top 4, never wraps) + per-status count
chips (`bg-amber/15 … 2 ⚙`, `bg-coral/15 … 1 ✗`).

### 4.3 Builtin/extension tool bodies
`toolRenderers.get(name) || builtinToolBody(tc)` (:137) — a tool can own its body (e.g. `FilePreviewBody`);
default stays the raw mono output. Extensions render *inside* the standard frame/header.

---

## 5. Reasoning ("Thinking") disclosure [STRONG]
`components/chat/shared/ConversationMessage.js:110-165`, css `:86-138`
- Native `<details>` with iolite tint; summary row = "Thinking · {source}" + **240-char single-line preview**
  (mono, warm-600, `truncate`), surrogate-pair-safe slice. Preview hides when open.
- Full text (`pre.reasoning-full`, mono 0.75rem, `max-height: 15rem; overflow-y:auto`) is **mounted only
  while open** (commit `5a0af9fd perf: lazy-render full reasoning text — Bound collapsed previews so long
  reasoning is not duplicated in the DOM`).
- Commit `3aa7851b`: "Keep reasoning rows aligned with tool and sub-agent density by showing a truncated
  single-line summary before expansion." → **All disclosure rows share one density: one line, ~text-xs.**

---

## 6. Markdown, code, tables, images

`public/chat/MarkdownRenderer.vue:391-621`
- Headings small: h1 1.3em, h2 1.15em, h3 1.05em, weight 600 — chat headings must not shout.
- Code blocks: always dark (`#1a1a2e`, dark mode `#0d0d1a`), header row with lowercase language label +
  "Open in canvas" + "Copy" ghost buttons; copy flips to "Copied!" green for 1.5 s. Font size from
  `--kt-chat-code-size` tier.
- Inline code: `word-break: break-word; overflow-wrap:anywhere` — "Without word-break the chat bubble
  pushes its parent layout sideways on mobile."
- Tables: `display:block; overflow-x:auto; max-width:100%` — "a wide markdown table never pushes the chat
  bubble (and the rest of the layout) sideways on a narrow viewport."
- KaTeX display: own `overflow-x:auto`.
- Images (markdown, tool media, attachments): `max-width: min(65%, 42vw); max-height: 35vh`, then container
  units `65cqw / 50cqh` under `@supports` (viewport is `container-type: size`). Same rule duplicated in 3 files
  [STRONG intent, DRY violation]. Commit `37e2f80f Clamp chat image preview size`.
- Blockquote 3px taaffeite-ish left border, muted text. Links iolite, no underline until hover.
- `breaks: true` only for user/channel text ("a single newline becomes a `<br>` … so user-typed messages
  preserve their line breaks"); assistant text stays strict CommonMark.
- Canvas `CodeViewer.vue`: separate line-number gutter column, 11px mono, `leading-[1.4]`, warm-50 bg.

---

## 7. Composer

`public/chat/ChatComposer.vue`, `public/chat/chat-composer.css`, `components/chat/chat-panel.css`,
`session-v2/chat/ChatComposerBar.vue`
- Shell: rounded-xl, warm-50 surface, warm-200 border; **focus = border turns iolite/40**, no glow ring.
- Auto-grow textarea, capped at 128 px (`resize()` :100-104).
- Left: attach file (hover aquamarine) + attach image (hover iolite); right: compact (hover iolite), clear
  (hover **coral**), primary. Each icon button hovers to its *own hue* at 10% bg (`--kc-hue`). [STRONG idiom:
  action hue = action semantics]
- Primary: 2rem iolite square, white icon; while processing it **becomes Stop** (coral 90%) in the same slot.
  Disabled send = transparent + warm-300 icon (no ghost filled button).
- Compact mode (phone, or when active): secondary actions collapse into a "+" menu.
- Enter-to-send rules (`public/chat/chatInput.js`): never during IME composition (`isComposing || keyCode 229`),
  never on compact/touch (Enter = newline on phones), never with modifiers. [STRONG for CJK authors]
- Coarse pointer: buttons min 2.5rem, primary 2.75rem.
- v2 toolbar row under the input: model pill, extension action buttons, flex spacer, **context ring meter**
  (SVG donut, tone by 60/80 thresholds, figures hidden via `@container (max-width:30rem)`;
  `ComposerContextMeter.vue`).
- Placeholder: "Message ..." / "Send to {channel} channel..." (commit `b2341577 Simplify chat input
  placeholder text`). Empty hero above a centered composer: "What should {name} work on?" + hint
  "Enter to send · Shift+Enter for a new line · / for commands" (hint dropped on phones).
- Drafts persist per instance+tab(+group) in local prefs (`ChatPanel.vue:312-334`).
- Drag files: whole bubble gets `ring-iolite/40` + centered floating pill "Drop files to attach" over a
  `backdrop-blur-sm iolite/5` veil.
- Slash menu: popover above input, `max-h-80`, grouped headings ("Commands" / "Skills" uppercase 10px),
  `/name` mono + description or "No description"; states loading / error(alert) / "No matching commands or
  skills"; full combobox ARIA (`aria-activedescendant`).

### 7.1 Queue and pending requests [STRONG]
- Queued user messages are **not** in the transcript; they sit above the composer as amber/5 rows with
  clock icon, truncated text, "queued", edit (→ iolite) and cancel (→ coral) icons; first 5 + "+N more
  queued" (commit `e43f3aa2`: pushing them into the transcript "caused them to appear between streaming
  assistant chunks").
- Pending interactive requests: amber banner "1 pending request needs your reply" + "show" that scrolls to
  it. v1 shows it only while the user is typing (they're about to bypass it).

### 7.2 Message actions [STRONG]
- Floating 22×22 bordered icon buttons below the bubble (`absolute -bottom-5`, right for user, left for
  assistant), `hover-only-action` (opacity 0 → 1 on group hover/focus-within; **always visible on
  `pointer: coarse`**).
- On coarse pointers they switch to static flow (`MessageRow.vue:505-535`) because the negative offset
  "overlaps the next message — stealing tap targets the user is trying to hit."
- User: copy, "Edit & rerun"; assistant: copy, "Regenerate" (comment: the old duplicate "Retry" "was
  identical and only hid the affordance…" → don't ship two buttons for one action).
- Branch navigator `‹ 2/3 ›` (10px tabular-nums) shown only when siblings exist.
- Inline edit: textarea 6–16 rows, footer hint "Ctrl/Cmd+Enter to rerun · Esc to cancel", buttons
  "Cancel" / "Save & Rerun" (→ "Starting..."). Edit row uses a size container and stacks below 280 px
  (`@container (max-width: 280px)`) — keyed to the form's *actual* width because the component lives in a
  narrow pane and a webview too.

---

## 8. Scrolling, windowing & performance rules

### 8.1 Bounded render window (chat) [STRONG]
`components/chat/chatRenderWindow.js`
- Budget by **render units**, not message count: `units = 1 + parts + children + resultParts`; tail budget
  1000 units / 200 messages, min 2 messages. Auto (scroll) expansion steps 500/100, button 1000/200:
  "so the mount cost never lands on the interaction path all at once."
- History reading mode: scrolling up freezes the window start; returning to the tail re-bounds it.
- Expansion preserves the reader's line via a **semantic anchor** (first visible row's physical record key +
  pixel offset), restored after DOM commit (`chatHistoryExpand.js`).
- Auto-expand when within 48 px of top (`CHAT_AUTO_EXPAND_TOP_PX`) plus an idle lookahead one step ahead
  (commit `c28c4b6c`).
- While a turn is generating, older-page fetch is refused **and the UI says why** ("Generating — earlier
  messages load when this turn finishes"), commit `c5a6fdda`: "previously spent a head refresh on every
  upward gesture and then dropped the result silently."
- Width change: "The reading column has a fixed maximum width, so resizing a panel changes the empty margins
  before it reflows the text. When the width does change, the line at the top of the view is restored (or
  the tail stays pinned)." (commit `9a3c057f`)

### 8.2 Scroll scheduling [STRONG]
`components/chat/chatScrollScheduler.js`: one scroll per DOM commit + rAF, scoped to (instance, tab, group),
generation counter invalidates stale frames, `suppress()` on user upward scroll, `resume()` at bottom.
`isNearBottom` threshold 80 px (commit `b2c6f2b1`: "If the user has scrolled up to read earlier messages,
auto-scroll is suppressed"). Scroll state reads coalesced into one rAF (test: "coalesces native scroll state
reads into one animation frame"). Per-tab scroll positions saved/restored on tab switch; a tab without saved
position lands on the tail. Jump-to-pending uses `scrollIntoView({behavior:"smooth", block:"center"})` — the
only smooth scroll; tail-follow is instant.

### 8.3 Skip off-screen work [STRONG]
`components/chat/chat-panel.css` `.chat-cv { content-visibility:auto; contain-intrinsic-size:auto 6rem }`
— "Applied to inner content wrappers (never to roots carrying the absolutely-positioned hover action rows):
paint containment clips descendants to the element's box." Also on `.kt-conversation-message`.
Cached event histories kept **outside Vue deep reactivity** (`c6632680`); `shallowRef` for render output.

### 8.4 Other lists
- **Fixed-row windowing** for debug event lists: 28 px rows, overscan 8, spacer divs, rAF-throttled scroll
  measure, `ResizeObserver` (`session-v2/model/debug/windowing.js`, `debug/EventList.vue`). `tail` prop keeps
  a growing list pinned (near-end = 4 rows).
- **File tree**: flatten → window, 24 px rows, indent `depth*14+8`, `translateY` slice
  (`session-v2/workspace/FileTreeView.vue`). Expanded folders persisted per root in a module-level Map.
- **Variable-height**: `@tanstack/vue-virtual` for trace turns (estimate 46, overscan 10, measured rows,
  `getItemKey` stable) (`sessions/tabs/TraceTab.vue:225-238`).
- **Trace timeline**: rasterized to pixel columns, hover line moved by `transform` on a single element
  (`will-change-transform`), pointer/wheel batched per rAF, tooltip metadata computed only for the pointed
  lane/column (commits `6798b562`, `7d879374`, `a062d137`: "Move the hover marker with an element-local
  transform so pointer movement does not invalidate every timeline span").
- **Pollers**: `createVisibilityInterval` stops while the tab is hidden, runs once on resume, and skips ticks
  while the previous promise is in flight (`composables/useVisibilityInterval*`, commit `52b43030`: "a
  backend answering slower than 1.5 s stacked one duplicate read per tick").
- Raw log views (ServerLogsModal, LogsTab) are *not* virtualized and use index keys [ONE-OFF / legacy].

### 8.5 Animation budget [STRONG]
`style.css:508-535`:
> "`.kohaku-pulse` — opacity animation … Compositor-friendly, no paint cost. Apply it only to things the user
> genuinely wants to see moving: the "Processing..." text, the WebSocket reconnect banner, an
> actively-compacting context marker. We used to ship a `.kohaku-glow` class (pulsing halo on status dots) —
> it got removed. A terrarium view can have 10-30 status dots on screen at once, and *any* continuous
> animation on each one was enough to saturate the compositor and keep the GPU busy even when the page was
> idle. The dot's colour already tells you "running" … animation added no information."

Graph (`graph/graph.css:324`): "One-shot event motion only; nothing animates while the graph is idle."
(node pulse 700 ms, edge dash 900 ms, both `1` iteration, reduced-motion off). Spinners
(`i-carbon-circle-dash animate-spin`) are allowed for *busy rows* (status tables, Lab tile) — a few per
screen.
Transitions are short and functional: 150 ms color/opacity/transform (chevron rotate-180).

---

## 9. Data-heavy views (tables, lists, timelines, metrics)

### 9.1 Status cards (v2) [STRONG]
`session-v2/status/StatusSection.vue`: card = header h-10 (muted icon, semibold title, mono count,
spacer, actions slot) + body. Empty: icon at 60% opacity + one short line, `py-8`, and the card stays —
"with nothing to show it stays in place and says so, so the page keeps its shape."
`AgentsTable.vue`: desktop = `<table class="text-xs">`, header `text-warm-400 font-medium`, rows
`border-b last:border-b-0 hover:bg-warm-50`, numbers right-aligned mono, "—" for missing, state chip
(running = aquamarine/10 + aquamarine-shadow text; else warm-100 + warm-500), row actions as small outlined
buttons in semantic color (Stop coral/30 border, Start aquamarine/40). **Phone = `min-h-14` tap rows instead of a squeezed table:** status dot, name + badges, second line mono model + tokens, trailing chevron → sheet.

### 9.2 Context bars
`session-v2/status/ContextBar.vue`: label row (name, privileged shield, `used / max · pct%` mono colored by
tone), 1.5 px-high rounded track warm-100, fill aquamarine/amber/coral, plus a 1 px amber tick at the
compaction threshold with title "compacts at {pct}%".

### 9.3 Event/trace rows [STRONG]
- `sessions/trace/TraceEventRow.vue`: `[time 16w mono warm-400] [icon] [type 32w mono, tone by type]
  [summary flex-1 truncate] [tokens mono taaffeite] [⏱ duration mono warm-400]`. Fixed-width leading columns
  in a flex row give table alignment without a table. Selected = `bg-iolite/10 ring-1 ring-iolite/30`;
  out-of-focus = `opacity-40` ("events outside it stay visible but dimmed — the turn chrome keeps its context").
- Type→tone map: user = sage, tool_call = warm-700, tool_result = warm-500, *_error = coral, subagent =
  iolite, token usage = taaffeite, compaction = amber, hook timing = aquamarine.
- Turn group header: chevron (iolite when open) `#12` mono, agent, duration, tokens, cost, `sub×2` chip,
  "N tool calls", right-aligned `error` (coral/15) / `compact` (amber/15) chips. Expand-all / Collapse-all
  text buttons in warm-500. "Load earlier turns", per-turn "Load more" paging, live "↓ N new" pill
  (aquamarine/15, rounded-full, appears only when not at bottom).
- v2 debug list chips per kind (`debug/EventList.vue:99-109`): user/subagent iolite, assistant/info
  aquamarine, channel taaffeite, error coral, warning amber, debug/tool warm.
- Logs: level colors ERROR coral, WARN amber-shadow, DEBUG warm-400, INFO warm-700
  (`diagnostics/ServerLogsModal.vue:61-66`); connection indicator text iolite vs amber.

### 9.4 Timeline
`sessions/trace/TraceTimeline.vue`: 4 lanes (input/model/tools/agents) × 18 px, lane colors sage / iolite /
aquamarine / taaffeite at /70, errors coral/80, min bar width 2 px, dashed turn boundaries with `#n` labels
only when they fit, minimap 4 px lanes, selection = iolite/15 fill + iolite/60 edges, mode toggle as tiny
mono bordered segmented buttons, "truncated" amber chip with tooltip. Interactions: drag to focus, wheel
zoom around cursor, pan, dblclick resets, right-click clears, keyboard focusable, each with a `title` hint.

### 9.5 Metrics & cost
- `common/Metric.vue`: uppercase 10px tracking-wider warm-500 label, `text-xl font-medium tabular-nums`
  value, 10px hint.
- `sessions/tabs/CostTab.vue`: totals grid; per-turn bar chart = flex of buttons with `min-w-[3px]`, `gap-px`,
  height ∝ value, `title` tooltip, click toggles; per-turn grid table
  `grid-cols-[3rem_1fr_5rem_5rem_5rem_5rem_2rem]` with right-aligned numerics; "no cost" text instead of $0.
- Token formatting `950 / 12.3K / 1M` — implemented 3× (`ChatPanel.vue:362`, `statusModel.js:12`,
  `ext/hud/hudModel.js:6`) with slightly different rules [INCONSISTENT; reuse one].

### 9.6 Admin tables (Element Plus) [ONE-OFF style]
`admin/UsersPane.vue`: subtitle line warm-400 12px, Refresh (plain) + primary Create on the right,
`el-table size=small stripe`, usernames mono, `you` plain tag, inline role select & active switch,
timestamps 12px warm-400. Loading/empty are plain 12px muted lines ("No users." italic).

---

## 10. Graph / node editor (Vue Flow)

`components/graph/graphTheme.js`, `graph.css`, `canvas/nodes/CreatureNode.vue`
- **Role colors** (comment :1-7): "channel = aquamarine, direct creature → creature reach = sage, output wire
  = sapphire, sub-agent = taaffeite, focus/selection and the control plane (privileged nodes, their channel
  links) = iolite, status per StatusDot semantics, lineage = warm."
- Status style table with glyphs: busy `●` aquamarine, idle `○` amber, paused `‖` amber, stopped `■`
  warm-400, error `!` coral (each has text/ring/dot classes).
- **Level of detail by zoom**: `far < 0.45 ≤ mid < 0.8 ≤ near`. Far = dot + big name only; mid = name row +
  status·model line; near adds sub-agent/tool count chips.
- Node frame: white/warm-900 rounded-xl, warm-200 border, shadow-sm; selected = iolite border + `ring-2
  ring-iolite/40` + shadow-md; lit (related) = iolite/60; privileged = iolite/40; non-focused = `opacity-25`;
  dimmed edges `opacity: .12`.
- Vue Flow defaults are stripped (no node bg/border/shadow, no focus outline), controls re-skinned with
  warm panel tokens; grid/minimap use `--kt-graph-*` variables with dark variants.
- Ports: in = warm, send = aquamarine circle, wire = sapphire diamond; ports and the per-node "⋯" menu appear
  on hover/selection only. Channels are "a filled aquamarine pill, never confused with a label."
- Destructive confirm **inline in the dock** (`dock/details/ConfirmCard.vue`): coral/8 card,
  `role="alertdialog"`, title in coral, consequence lines (`·`-prefixed lines in mono), Cancel + coral
  primary labeled with the verb, confirm button auto-focused, busy-disabled.
- Lab thumbnails (`lab/model/miniGraph.js`): pure layout; "A session too big for a readable box each gets
  the grouped preview: one column per channel with its workers folded into a group of status dots."
  → **degrade detail instead of shrinking text** (same idea as zoom LOD and Lab tile levels full/brief/compact).

---

## 11. Status color semantics (consolidated)

| Meaning | Color | Evidence |
|---|---|---|
| Tool / tool output | sapphire tint, iolite name | ToolCallBlock |
| Sub-agent | taaffeite | ToolCallBlock, CreatureNode chips |
| Accent, focus, selection, links, user-side, primary button | iolite | everywhere |
| Running tool / attention / queued / warning / compaction | amber (+ pulse only for running) | ToolCallBlock, queue, trace |
| Error / danger / destructive / clear | coral | banners, Stop, clear hover |
| Done (tool) | sage `✓` | ToolCallBlock |
| Live / connected / busy creature / success / channel / cached tokens | aquamarine | StatusDot, LogsTab dot, ContextBar ok |
| Token usage numbers | taaffeite | TraceEventRow |
| Neutral / stopped / metadata | warm-400/500 | everywhere |

Drives make it explicit (`utils/driveStatus.js:1-6`): "status color alone is insufficient; every state has
a text + icon label, and recovery/blocked/failure never read as ordinary success". Tone maps `TONE_TEXT /
TONE_CHIP (bg 15%) / TONE_BORDER (border-l)` for good/info/warn/bad/neutral; zero-count badges hidden by
default (`drives/DriveCountBadges.vue`).
`StatusDot.vue` has `role="img"`, `aria-label`, `title`, and an sr-only label; falls back to the raw status
string if a locale misses the key.

[INCONSISTENT] "running" is aquamarine on creature dots (StatusDot, graph busy) but amber `⚙` on tool calls,
iolite on the HUD (`ext/hud/HudOverlay.vue`); "idle/done" is amber on dots but sage on tools. Reproduce the
*principle* (per-surface consistent mapping, text label always present) — pick one mapping per domain.

---

## 12. Empty, loading, error, skeleton states

Canonical order (seen in SlashCommandMenu, FileTreeView, TraceTab, CostTab, HudOverlay, AdminPanes,
ExtensionContribution, WidgetBlock) [STRONG]:
```vue
<div v-if="error" role="alert" class="text-coral">{{ t('ws.treeFailed', { error }) }} <button>Retry</button></div>
<div v-else-if="loading">{{ t('loading') }}</div>          <!-- "Loading…" (real ellipsis char) -->
<div v-else-if="!rows.length" class="text-warm-400 text-center">{{ t('ws.empty') }}</div>
<List v-else />
```
- **Empty transcript**: `◇` glyph in a 3rem rounded-2xl warm-50 tile (iolite), "No messages yet" /
  "Send a message to get started" (`chat-transcript-section.css:40-72`). v2 replaces it with a hero: brand
  mark + "What should {name} work on?" with the composer pulled to the middle.
- **Lab empty**: brand mark, title, `max-w-[46ch]` hint, one primary iolite button, quick-start chips from
  recently used configs (`lab/shared/LabEmptyHero.vue`) → empty states offer the next action.
- **Catalog**: pulse skeleton of 6 cards "only when truly empty" (`panels/catalog/CatalogTab.vue:52`);
  otherwise empty = 36px search icon + 12px semibold title + 11px hint `max-w-xs`. Settings usage cards use
  `data-skeleton aria-hidden`. Skeletons are rare; text "Loading…" is the default.
- **Stale-while-refresh**: "Showing the last Codex snapshot from {value}. Refresh failed." — keep last data
  and say it is stale rather than blanking.
- **Errors inline, near the thing**: history error above the composer as a dismissable coral line
  (`ChatColumn.vue:11-14`); extension failures inside their slot ("{label} ({pkg}) failed" + pre + Retry);
  widget/inline UI failures inside the message ("This widget failed to render: …"), never crashing the
  transcript (`onErrorCaptured` boundaries). Toasts (`ElMessage.error`, ~109 uses) for action failures with
  "{Verb} failed: {message}".
- Partial data flagged in place: "Loaded history — usage figures are partial", "Newer messages are waiting —
  refresh", "History changed — reload" (sentinel rows in the transcript, `ChatTranscriptSection.js:98-136`).

---

## 13. Confirmations & destructive actions [STRONG]

- `ElMessageBox.confirm(message, title, { type:"warning", confirmButtonText: <the verb>, cancelButtonText:
  t("common.cancel") })` (~25 uses). Confirm label is the action ("Clear", "Delete", "Revoke"), never "OK".
- Message states the consequence and the reassurance:
  "Clear conversation context? Chat history will be preserved in the session." /
  "Delete user "{username}"? This cannot be undone." /
  "Revoke this invitation? It can no longer be used to register."
- Non-destructive/reversible actions don't confirm: compact runs immediately; clear confirms
  (`ChatPanel.vue:1033-1101`).
- Cancel is swallowed silently (`catch { return }` with `// user cancelled`).
- In spatial editors, confirm inline (graph `ConfirmCard`) instead of a modal.
- Show-once secrets: "Invitation created — copy the token now" + "Shown only once."
- Model-link safety: inline UI asks "Open this link?" before navigating.

---

## 14. Truncation & long text [STRONG]

- Every `truncate` on user/entity data is paired with `:title="fullValue"` (Lab tile name/summary, file
  tree rows `:title="row.node.path"`, artifact links, restore banner rows, `TraceEventRow`).
- Flex truncation recipe: parent `flex min-w-0`, truncating child `truncate flex-1 min-w-0`, siblings
  `shrink-0` (ToolCallBlock header, all row layouts).
- Clamp summaries `line-clamp-2` at normal density, `truncate` at compact (`LabSessionTile.vue`).
- Character caps with ellipsis for derived previews: error first line 80, tool arg values 50 / raw 80,
  reasoning preview 240 (surrogate-safe).
- Scroll caps for bodies: `max-h-32` (trigger payload), `max-h-48` (sub-agent children/result), `max-h-64`
  (tool output), `max-h-72` (batch), `15rem` (reasoning), `12rem` (compaction summary), `max-h-80` (slash menu).
- Server-side truncation surfaced explicitly: "Output truncated · N bytes omitted"; timeline "truncated" chip.
- Long unbroken tokens: `overflow-wrap:anywhere` on message text, inline code, ktui; `break-all` for raw
  tool output; `white-space: pre-wrap` scoped to text leaves only (commit `a78aaa2e`: "stop
  whitespace-pre-wrap from leaking into markdown content").
- Overflowing centered chip rows: `justify-content: safe center` (commit `7108c66d`: "A centered chip row that
  overflows clipped its start out of reach").
- Lists of N: show 5 + "+N more queued" / "Show fewer"; batch names top 4 + "+N more".

---

## 15. Extension / HUD UI (`src/ext`)

- Contributions render in a host frame with an error boundary + loading state: "Loading {label}…" with
  `i-carbon-renew kohaku-pulse`; failure "{label} ({pkg}) failed" + message + Retry; owner-gated panels are
  hidden (not errored) when the plugin is absent (`ext/ExtensionContribution.vue`).
- Inline kinds (`tool-renderer`, `message-renderer`, `message-decorator`, `graph-badge`, `graph-panel`) are
  `min-w-0` inline; others fill `h-full w-full overflow-auto`.
- Extensions get a **public theme token list** (`ext/sdk/theme.js`): `--color-bg/surface/surface-alt/border/
  text/text-muted/text-faint` and the `--kt-fs-*` type tiers — the contract for third-party UI.
- `isolation: "frame"` → sandboxed iframe host (`FrameHost.vue`).
- HUD overlay (`ext/hud/HudOverlay.vue`): compact list, session row (dot, body-tier name, caption-tier mono
  tokens), indented creature rows (`pl-4`, 1.5 dot), working sessions first, max 8, poll 4 s skipped when
  `document.hidden` or busy; empty/failed lines centered caption. Uses `kt-text-body / kt-text-caption`
  classes instead of raw sizes.
- Overlays: host-drawn title bar with hide button + optional resize grip, or chromeless click-through;
  position/size remembered per host (commit `6ef4a3ef`).

---

## 16. Microcopy & i18n

### 16.1 Locales
`utils/i18n/locales/`: en (2248 lines, source of truth), zh-CN (1817), zh-TW (1737), ja, ko, de (partial).
Missing keys fall back to English, then to the key (`utils/i18n.js:60-62`). Feature tables are split into
domain files merged per locale (`media`, `links`, `slash`, `messageActions`, `lab`, `studioApp`,
`settingsModels`…; `locales/index.js`). The v2 shell keeps **its own** dictionaries per area
(`session-v2/model/strings/*.js`, each `{en, "zh-TW", "zh-CN"}`) "while v2 is a draft"
(`session-v2/model/v2Strings.js:1-7`). Values may be functions for plurals:
`"chat.pendingBanner": ({count}) => count === 1 ? "1 pending request needs your reply" : \`${count} pending requests need your reply\``.
zh-TW and zh-CN are genuinely localized (工作階段/訊息 vs 会话/消息), not character-converted.
Tests guard panel labels/descriptions in every locale (`utils/i18n.test.js`).
[INCONSISTENT] Older surfaces still hard-code English ("No log lines yet", "filter text...", "Output
truncated", "Thinking", "Save & Rerun", "Triggered by", `chat.subagent.empty: "(no messages)"`).

### 16.2 Tone rules [STRONG]
- **Sentence case**, short, no exclamation marks; a trailing period only on full sentences
  ("This folder is empty.", "No drives in this session.") while labels/chips have none ("No agents").
- Real ellipsis `…` for in-progress and "opens more UI" ("Loading…", "Starting…", "Browse…", "Rename…",
  "Resume a saved session instead…"); some legacy strings use `...`.
- **Empty states name the subject and the scope**: "No tool or sub-agent calls in this conversation yet.",
  "{name} has written nothing to its scratchpad.", "No creature posts to or listens on this channel.",
  "Nothing running.", "No tokens spent yet." — prefer "yet" when it will fill on its own.
- **Errors**: "Could not {verb} {object}: {error}" / "{Verb} failed: {message}"; add the next step when
  there is one: "Could not check credentials. Check the connection and try again.", "The keys could not be
  moved. Nothing was changed." (states what did *not* happen).
- **Explain waits and refusals**: "Generating — earlier messages load when this turn finishes", "This
  button's message starts with '/', like a command, so it was not sent.", "A channel has no model of its own —
  open a creature's chat to switch it.", "Read-only — this sub-agent run has finished."
- **Status words are human**: lab history `crashed → "cut off"`, `shutdown → "server stopped"` with hints
  "The server went down while this session was running"; graph `busy → "working"`. Summary provenance:
  "written by you / written by the model / from the compaction summary / from the first prompt".
- Em dash ` — ` joins a state and its consequence ("Disconnected — reconnecting…", "Newer messages are
  waiting — refresh").
- Keyboard hints inline with ` · ` separators: "Enter to send · Shift+Enter for a new line · / for commands".
- Personality budget = one joke: `"chat.processing": "KohakUwUing..."` (kept untranslated in zh).
- Hero questions in second person about the agent: "What should {name} work on?"; button labels are verbs
  ("Start", "Resume with inspector", "Add & activate").

---

## 17. Explicit "don'ts" (with the rationale from the source)

1. Don't animate status dots / idle elements — "any continuous animation on each one was enough to saturate
   the compositor … animation added no information." (`style.css:510-522`)
2. Don't re-render whole markdown per chunk — "saturates both CPU and GPU … `v-html` swaps the whole subtree,
   invalidating every code-block compositor layer." (`MarkdownRenderer.vue:318-333`)
3. Don't key streamed rows by position — remounts the whole tail on resync (commit `f80cd066`).
4. Don't put queued messages into the transcript — they interleave with streaming chunks (`e43f3aa2`).
5. Don't show KaTeX parse errors in red to users — raw LaTeX in a subdued code style; console gets details.
6. Don't let wide content push the layout: tables, inline code, katex, images each get their own overflow
   rule (mobile rationale quoted in §6).
7. Don't absolutely position action rows on touch — "overlaps the next message — stealing tap targets"
   (`MessageRow.vue:505-520`); always pair hover-only actions with a non-overlay fallback (`style.css:306-308`).
8. Don't apply `content-visibility` to a root with absolutely positioned children — paint containment clips
   them (`chat-panel.css`).
9. Don't silently drop work — say why ("Generating — earlier messages load…", commit `c5a6fdda`).
10. Don't stack polls — skip ticks while in flight and while hidden (`useVisibilityInterval`).
11. Don't fork the shared chat leaf per host — sub-agent transcripts "hand-rolled [their] own message markup
    … Everything that leaf owns was silently dropped" (commit `50e1f6e7`). One renderer, host seams.
12. Don't center an overflowing row with plain `center` — use `safe center` (`7108c66d`).
13. Don't close a floating widget on any outside press — it fired on scroll/chat clicks; close via its
    button, the dock or Esc (`6f7d2652`).
14. Don't use stock Tailwind palette, `-dark` gem shades, off-palette blue/red hexes — enforced by
    `style.palette-guard.test.js`.
15. Don't ship duplicate affordances (the removed "Retry" next to "Regenerate").
16. Don't show an action that will vanish instantly ("→ bg" only after 1 s of running).

---

## 18. Code organization that shapes the UI [STRONG]

- **Pure model modules + thin components**: `session-v2/model/**`, `lab/model/**`, `sessions/trace/
  traceTimeline.js`, `chat/chatRenderWindow.js`, `chatToolGrouping.js`, `debug/windowing.js` hold layout math,
  formatting, tones and thresholds as pure functions with colocated tests; `.vue` files bind them.
- **One-sentence docblock above `defineProps`** describing what the component *shows* and its states, in
  plain language, e.g. `StatusSection.vue`: "A whole-width Status card; with nothing to show it stays in
  place and says so, so the page keeps its shape."
- **Host seams** (`useMessageActions`, `usePlatformOrigin`, `useMediaResolver`, `usePlatformLinkOpener`):
  shared chat leaves stay host-neutral; the Dashboard leaves seams uninstalled (browser defaults), the VS Code
  webview installs its own.
- **Tests pin UI contracts**: scroll races, render-window budgets, truncation strip, bubble layout, reading
  size tiers, palette guard, i18n coverage; `data-test` attributes on every meaningful node.
- **Phone is a different layout, not a squeezed one** (commit `e53e9dd4`: "At compact density the v2
  session no longer shrinks the desktop layout"): tables → tap rows → sheets; workspace tab removed on phones;
  keyboard hints hidden; Enter inserts newline.

---

## 19. Strong vs one-off summary

| Pattern | Strength |
|---|---|
| Variable-scoped conversation palette w/ fallback chain | STRONG |
| Collapsed one-line accordions with status glyph headers | STRONG |
| Tool batch ≥3, stable id from first tool | STRONG |
| 80 ms markdown throttle + incremental blocks | STRONG |
| Hold/raw-render incomplete streaming constructs | STRONG |
| Near-bottom follow (80 / 32 px), rAF scroll scheduler | STRONG |
| Render-unit budgeted window + semantic anchors | STRONG (chat-specific) |
| content-visibility on message bodies | STRONG |
| Fixed-row windowing for logs/trees; tanstack for variable rows | STRONG |
| No idle animation, reduced-motion respected | STRONG |
| Error → loading → empty → content order | STRONG |
| Truncate + title, min-w-0 flex recipe | STRONG |
| Verb-labeled confirms with consequence text | STRONG |
| Semantic gem roles + text/icon labels | STRONG (mapping per domain INCONSISTENT) |
| 60/80 % context thresholds | STRONG |
| Desktop table → phone tap rows | STRONG (v2) |
| Zoom/size level-of-detail instead of smaller text | STRONG (graph, lab) |
| Fade-mask "more" hint on sub-agent result | ONE-OFF |
| "→ bg" after 1 s | ONE-OFF |
| Dark always-on code blocks (#1a1a2e) | ONE-OFF hexes, intent STRONG |
| Element Plus tables in admin | ONE-OFF (v2 uses hand tables) |
| KohakUwUing playful copy | ONE-OFF (brand signature) |
| formatTokens triplicated, image clamp triplicated | INCONSISTENT |
| Legacy hard-coded English strings | INCONSISTENT |
