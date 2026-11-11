# Streaming, chat and LLM/agent surfaces

Read this when building a chat transcript, an agent console, a log tail, or anything that renders content while it arrives.

## Transcript hierarchy

- Text size: a transcript inside an app uses the **app body tier** (`--kt-fs-body`, 0.875rem; markdown line-height ~1.65) so it matches the surrounding chrome. Readers who want bigger text change the reading-size preference (root 14/16/18px), which scales everything together. Don't hard-code 16px in one pane. The reading preset is for docs pages.

- **Muted chrome, loud content.** IDs, models, token counts, timestamps: `text-[10px]/[11px] font-mono text-warm-400/500`. The user's content and the answer are the darkest text on the page ("near black" `#24211d` light / `#f3efe9` dark).
- **User** turn: right-aligned soft bubble (`bg-warm-50`/conversation surface, `rounded-xl`, `max-w: min(80%, 46rem)`), small muted author label above.
- **Assistant** turn: **no bubble**, left, text directly on the canvas (`max-w: min(92%, 52rem)`). The model's output *is* the page.
- Centre a reading column (~58rem) and align the composer to the same width; resizing a pane changes the margins before it reflows text.
- Group chat: sender header (gem-coloured 5×5 rounded square with initial + name in that gem + 10px timestamp) **only when the sender changes**; the sender→gem map is module-scoped so a person keeps one colour app-wide.
- System notes: centred, muted, 0.75rem. Out-of-band events (context cleared, background result arrived) are **dashed dividers with a label**, not messages.
- Non-conversational events (triggered by X, inbound from Y): a one-line tinted strip (gem 6% fill, 15% border) with an icon and an explanation, expandable when there is a payload.

## Tool calls, reasoning, batches

```
┌ border sapphire/20 (sub-agent: taaffeite/25) · rounded-lg
│ header bg sapphire/8 · text-xs · px-3 py-1.5 · role=button aria-expanded
│   [✓ ✗ ○ ⚙] [name mono semibold iolite] [k=v args mono warm-400 truncate flex-1] [1.2s mono 10px] [chevron]
│ pinned product (image/file the tool made) — always visible
│ expanded: output mono xs, pre-wrap, max-h-64 scroll  ·  "Output truncated · 12,345 bytes omitted" (amber-shadow)
└
```
- Status glyphs are text: running `⚙` amber, error `✗` coral, interrupted `○` amber, done `✓` sage. Batch header precedence: running > error > interrupted > done. If the transcript already has a pulsing "working now" line, keep the running glyph static (one pulse per concern).
- Failed call, collapsed: the header keeps glyph · name · elapsed, and the args slot is replaced by the **error's first line** (coral, mono, truncated to ~80 chars, full text in `title`). If the args matter too, add a second coral line under the header. Full output appears on expand.
- Args summary: `k=v` pairs, values cut at 50 chars, raw string args at 80.
- ≥3 consecutive plain tool calls fold into one batch row ("N tool calls · read ×3, bash, +2 more" + per-status count chips); batch id derives from the first call so expansion survives streaming.
- Reasoning: native `<details>` with an iolite tint; summary = "Thinking" + a **240-char single-line preview** (surrogate-safe); the full text mounts only while open (`max-height: 15rem; overflow-y: auto`).
- Sub-agents auto-expand **once** when their first child appears, then never fight the user.
- Nested children sit on a recessed warm background so the sapphire tool rows pop.

## Streaming performance (these are UX rules)

- Throttle markdown rendering to ~80ms (≈12fps; "user eye can't tell") with a guaranteed trailing render; first mount renders synchronously.
- Render incrementally: split at blank lines, cache finished blocks, re-render only the changed tail (fences and `$$` swallow blank lines).
- Key streamed rows by **origin event id**, never by position (positional keys remount the whole tail on resync).
- `shallowRef`/non-reactive containers for render output and cached histories; never deep-reactive arrays of samples or messages.
- `content-visibility: auto; contain-intrinsic-size: auto 6rem` on message bodies (inner wrappers only).
- Bound the mounted window by an estimated render cost ("units" = 1 + parts + children), not message count; expand in steps; preserve the reader's line with a semantic anchor (first visible row key + pixel offset) when prepending history.
- Long fixed-row lists (logs, events, file trees): fixed-row windowing (24–28px rows, overscan 8, rAF-throttled scroll, ResizeObserver). Variable-height: a virtualizer (`@tanstack/virtual`) with measured rows and stable keys.

Minimal fixed-row window (no dependencies; log lines must not wrap — use `white-space: pre` + horizontal scroll, or truncate with `title`):
```js
const ROW = 22, OVERSCAN = 8
// state: lines (array), scrollTop, viewportH (from ResizeObserver)
const start = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN)
const end = Math.min(lines.length, Math.ceil((scrollTop + viewportH) / ROW) + OVERSCAN)
// render: <div :style="{height: lines.length*ROW+'px', position:'relative'}">
//           <div :style="{transform:`translateY(${start*ROW}px)`}"> rows start..end </div></div>
// on scroll: requestAnimationFrame-coalesce scrollTop reads; follow the tail only if within 80px of the bottom.
```
Cap retained history (e.g. last 5,000 lines) and say so ("showing the last 5,000 lines").

## Scrolling

- Follow the tail only within **80px** of the bottom (32px for inner boxes). Any upward scroll suspends following; returning to the bottom resumes it.
- One scroll per DOM commit, scheduled in rAF, scoped per tab; a generation counter discards stale frames.
- Tail-follow is instant; only "jump to the pending request" uses smooth scroll (`block: "center"`).
- When new items arrive while the user reads history: a "↓ N new" pill (aquamarine/15, rounded-full) that appears only when not at the bottom.
- Save and restore scroll per tab; a tab without a saved position lands on the tail.
- If older history cannot load right now, say why ("Generating — earlier messages load when this turn finishes") instead of silently dropping the gesture.

## Markdown, code, math, media

- `html: false`, `linkify: true`; links open outside the app; links from model output ask "Open this link?" in embedded UIs.
- Code blocks: header row with lowercase language label + "Copy" (→ "Copied!" in sage for 1.5s) + optional "Open in canvas"; mono at a dedicated size token (~0.95rem, line-height 1.55); horizontal scroll inside the block. Chat code blocks may stay dark in both themes (`.kt-code-dark`: warm-950 background, and the `--kt-syntax-*` vars switch to lifted gems). Docs code blocks use the warm code background. Never colour syntax on a dark background with the `-light` shades; they're pastels and keywords blur together.
- Tables that are still streaming: render the rows received so far as a table once the header and separator lines have arrived, and hold back a partial last row. Don't show raw `| … |` text.
- On load and on switching conversations, land on the newest message. Scroll after the content settles (a ResizeObserver or a second rAF), because markdown and images keep growing after the first paint.
- Tables and KaTeX display blocks scroll horizontally on their own; inline code wraps (`overflow-wrap: anywhere`).
- LaTeX robustness: normalise CRLF, strip invisible format chars, convert `\( \)`→`$ $` and `\[ \]`→`$$ $$`; on parse failure show raw LaTeX in a subdued dashed code style, details to the console.
- Mermaid: render only closed, non-empty fences; lazy-load; cache SVG per (theme, source); `securityLevel: "strict"`; fall back to the code block.
- `breaks: true` only for user-typed text; assistant text stays strict CommonMark.
- Images: clamp to the column (`max-width: min(65%, 42vw); max-height: 35vh`), click to open full size.

## Composer

- Shell: `rounded-xl`, conversation surface, warm-200 border; focus = border turns iolite/40, no glow ring. Auto-grow textarea capped at ~128px.
- Left: attach actions; right: secondary actions (each hovers to its semantic hue), then the primary 2rem iolite square that **becomes Stop (coral) in the same slot** while running. Disabled send = transparent with a warm-300 icon.
- Placeholder: "Message …" / "Send to {channel}…". Empty hero above a centred composer: "What should {name} work on?" + hint "Enter to send · Shift+Enter for a new line · / for commands" (hint hidden on phones).
- Enter-to-send: never during IME composition, never on touch, never with modifiers.
- Drafts persist per conversation/tab locally (never synced per keystroke).
- Drag files: ring-iolite/40 on the shell + centred floating pill "Drop files to attach" over a `backdrop-blur-sm` iolite/5 veil.
- Slash menu above the input: grouped headings (10px uppercase), `/name` mono + description, loading/error/"No matching commands" states, full combobox ARIA (`aria-activedescendant`).
- Context meter: a small SVG ring coloured by the 60/80 thresholds, with figures next to it (`660 / 8.2K`) hidden by `@container (max-width: 30rem)` on the composer.
- Message actions: 22×22 bordered icon buttons under the bubble, `hover-only-action`, static flow on touch. One button per action (no "Retry" next to "Regenerate"). Branch navigator `‹ 2/3 ›` only when siblings exist. Inline edit with "Ctrl/Cmd+Enter to rerun · Esc to cancel".

## Embedding the same transcript elsewhere

One renderer, many hosts: shared leaves read only `--x-conversation-*` variables with a fallback chain and receive platform behaviour through small injected seams (open link, resolve media, message actions). Never fork the leaf per host — forks silently drop features.
