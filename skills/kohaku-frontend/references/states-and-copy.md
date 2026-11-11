# States, feedback, microcopy, i18n

## Contents
- The four states, in order
- Loading without flicker
- Empty states
- Errors
- Connection and liveness
- Busy and progress
- Microcopy rules
- i18n

## The four states, in order

Every async surface renders exactly one of these, checked in this order:

```vue
<div v-if="error" role="alert" class="kt-banner">Could not load runs: {{ error }} <button class="btn-ghost">Retry</button></div>
<div v-else-if="loading && !rows.length" class="text-sm text-warm-400 text-center py-8">Loading…</div>
<div v-else-if="!rows.length" class="text-center py-8"> <!-- empty: icon + one sentence + next action --> </div>
<List v-else :rows="rows" />
```

- Errors win over stale content only when there is no content; otherwise keep the content and show the error inline above it ("Showing the last snapshot from 12:03. Refresh failed.").
- The container keeps its shape across states (a section card stays a section card).

## Loading without flicker

- Default loading indicator is text: "Loading…" (real `…` character), muted, centred. Skeletons only when a grid is **truly empty** on first load (6 pulse cards in a catalog; `h-9 rounded-lg bg-warm-100 animate-pulse` bars with staggered widths 100/92/96/88% and `aria-busy`).
- **Data views never blank on refresh.** Keep the previous picture, update in place (`chart.setData`), stream partial results newest-first, commit at most once per animation frame. A load slower than the polling tick must not be dropped — let the tick wait for the in-flight load.
- Spinners (`i-carbon-circle-dash animate-spin`) only on in-flight *commands* (a button, a row being started), not on data panes.
- Rich content that is still streaming: render the incomplete part as plain text (unclosed code fence without highlighting; Mermaid only after the fence closes; hold back a partial tag); show the last valid render of embedded UI rather than a broken one.
- Don't flash actions that will disappear instantly: show "move to background" only after 1s of running; show elapsed time only after 1s.

## Empty states

- Structure: icon (muted, 60% opacity, or a 3rem tile with a glyph) · one sentence naming **the subject and the scope** · the next action if there is one.
  - "No tool or sub-agent calls in this conversation yet."
  - "No failed attempts in this range." (with a sage ✓ — positive when emptiness is good news)
  - "No machines registered" / "Ask an admin to register machines."
- First-run/hero empty state: brand mark · title question ("What should {name} work on?") · one-line hint `max-w-[46ch]` · one primary button · quick-start chips from recent configs.
- Empty states can **teach the interaction**: "Select a node to see its ports, types, hints and meta." / "Drag from an output port to an input port of the same kind to wire them; Del removes the selection."
- Filtered-to-nothing is different from empty: "No pages match "q"." + a way to clear the filter.
- Use "yet" when the list will fill on its own; a trailing period on full sentences only.

## Errors

- **Inline, near the thing that failed**: section banners (`role="alert"`, coral 10% fill / 30% border), field messages under inputs, errors inside the widget/message that failed (error boundary — one broken block never breaks the page), a dismissable coral line above a composer.
- Copy: "Could not {verb} {object}: {error}" or "{Verb} failed: {message}". Add the next step when there is one ("Check the connection and try again."). Say what did **not** happen when that matters ("The keys could not be moved. Nothing was changed.").
- Surface the backend's own detail in mono; never replace it with "Something went wrong".
- Transcript/log errors collapse to one line: `✗ ErrorType` + first line truncated to ~80 chars; full text (mono, `pre-wrap`) on expand.
- Parse errors in user/model content (KaTeX, Mermaid): show the raw source in a subdued code style, log details to the console — no red error blocks for content.
- App-level failure (backend down): one fixed top banner with inline recovery actions ("Restart", "Logs"), amber while recovering, coral when failed.

## Connection and liveness

- Merge signals (`navigator.onLine`, a health ping, platform bridges) into `online | host-only | offline`.
- Reconnecting: a single amber strip "↻ Disconnected — reconnecting…" (`.kohaku-pulse` allowed here). Show it once, not per panel.
- Live chips: `live` (sage/aquamarine), `unreachable` (amber + warning icon), `stopped` (warm). Lowercase status words are fine in dense chrome.
- Poll with visibility-aware intervals: pause while `document.hidden`, run once on resume, skip a tick while the previous request is in flight, abort superseded loads. Create `Intl` formatters once and reuse them.
- Stale data gets a `stale` chip after a threshold (e.g. 30 min) and an "Updated 2m ago" label with the absolute time in `title`.

## Busy and progress

- The busy indicator **names what is actually happening**, with live size/count: "Writing bash arguments… 12.5 KB", "(streaming + 2 background)", "Generating — earlier messages load when this turn finishes". One personality token is allowed per product (KohakuTerrarium's processing label is "KohakUwUing…"), always next to functional information.
- Progress bars: 6px (`h-1.5`) rounded track in `--v2-line`, fill in the status/accent colour, mono 10px value in a fixed-width right column. Threshold ticks (1px amber) with a `title` ("compacts at 80%").
- Queued work is shown **outside** the main stream (e.g. queued messages above the composer, amber/5 rows with edit/cancel), not interleaved with live output.
- Refused or deferred actions say why, in place ("Read-only — this sub-agent run has finished.").

## Microcopy rules

- **Sentence case**, short, plain, no exclamation marks, no marketing words. Buttons are verbs: Start, Run, Apply, Retry, Refresh, Approve, Revoke, Sign out; "Close" once an action is done.
- Real ellipsis `…` for "in progress" and "opens more UI" (Loading…, Rename…, Browse…).
- `—` for missing values; `·` to join facts and hints; `→` for flow or old → new; en dash for ranges; em dash joins a state and its consequence ("Disconnected — reconnecting…").
- Tooltips are **full explanatory sentences**, not labels: "the run has no stop time and its inspector does not answer: killed, or run without one". Every icon button still gets a short `title`/`aria-label`.
- Human status words: crashed → "cut off", shutdown → "server stopped", busy → "working".
- Confirms state consequence + reassurance; confirm button is the verb.
- Show-once secrets: "Invitation created — copy the token now" + "Shown only once."
- Numbers: compact (`950 / 12.3K / 1.2M`), durations by scale (`870 µs`, `12.4 ms`, `3.21 s`, `4m 05s`, `3h 4m`), thousands separators in tables, `—` for non-finite. Write one formatter module and reuse it.
- Docs/landing voice: candid and specific ("scratch your own itch", "it just works"), explains how the thing works, a 60-second quickstart early, bold for the key phrase.
- Code comments and component docblocks: one declarative sentence defining the thing, then its rules; explain *why* by naming the past failure ("a load slower than the 2 s tick used to be dropped every time").

## i18n

- English is the source; ship zh-TW and zh-CN as **genuinely localised** tables (工作階段/訊息 vs 会话/消息; region-specific terms), not character conversion. Full-width punctuation in Chinese strings.
- A dependency-free `t(key, params)` is enough: locale table → English → the key itself. `{name}` interpolation; a value may be a function for plurals (`({count}) => count === 1 ? … : …`).
- Split dictionaries by feature (`settings.js`, `chat.js`…) each `{ en, "zh-TW", "zh-CN" }`; dotted keys `area.sub.leaf`. A test asserts every used key exists and none is unused.
- Translate chrome; **never translate user data** (names, ids, file paths).
- Locale switcher shows each language in its own script (繁體中文, 简体中文, 日本語). BCP-47 tags fall back to the primary subtag.
- CJK-aware input and rendering: IME-safe Enter; `markdown-it-cjk-friendly` (or equivalent) so `**重點：**正文` emphasis works; CJK font fallbacks in `--font-sans`.
