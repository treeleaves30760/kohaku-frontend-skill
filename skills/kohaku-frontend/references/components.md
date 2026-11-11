# Component recipes

Class strings are UnoCSS/Tailwind (with the Kohaku preset). Plain-CSS equivalents are in `assets/base.css` (`.kt-btn--*`, `.kt-chip--*`, `.kt-dot--*`, `.kt-seg`, `.kt-input`, `.kt-banner`, `.kt-dialog*`).

Icons are **Carbon** everywhere:
- UnoCSS: `i-carbon-*` (scale 1.2, `inline-block; vertical-align: middle`).
- React/Vue/plain: `@iconify/react` / `@iconify/vue`, or the `<iconify-icon icon="carbon:checkmark">` web component, sized with CSS `font-size: 1.2em; vertical-align: middle`.
- Lucide only if Carbon is unavailable.
- Icon-only controls always get `aria-label`, and decorative icons get `aria-hidden="true"`.

**What a small app needs.**
- Required: the tokens, both themes, the four states, the phone layout, visible focus, a status line/bar when there is live state, and the review checklist.
- Optional, add when the app grows: rail resize/collapse, the command palette (until then `Ctrl/⌘+K` can focus search), tab strips, split panes, density override, reading-size preference, render-cost windowing.

## Contents
- Buttons · Icon buttons · Segmented control
- Chips, badges, status dot
- Inputs and forms
- Cards and section cards · Stat tile / metric
- Nav rail · Tab strip · Header bar · Status bar · Side pane
- Settings (group > card > row)
- Dialogs, confirms, menus, command palette, toasts
- Tables and lists
- Accordions / disclosure rows

## Buttons

| variant | recipe | use |
|---|---|---|
| primary | `h-8 px-3 rounded-lg bg-iolite text-white hover:bg-iolite-shadow text-sm font-medium` | one per view region; the main verb |
| danger | `bg-coral text-white hover:bg-coral-shadow` | confirm-a-destructive-action only |
| secondary | `border bg-[var(--v2-panel)] border-[var(--v2-line-strong)] text-warm-700 hover:border-iolite/50` | **hover tints the border, not the fill** |
| ghost | `h-7 px-2.5 rounded-lg text-warm-600 hover:bg-warm-200/60 dark:hover:bg-warm-700/40` | toolbar text actions |
| icon | `w-7 h-7 rounded-lg text-warm-600 hover:bg-warm-200/60` + `title` + `aria-label` | every icon-only action |

- **One primary per region, one path per destination**: don't put two controls that do the same thing side by side or in the same bar (the author removed a header button that duplicated a nav link). A rail "+ New" and an empty-state CTA are fine together — they live in different regions; make the empty-state one primary only when the rail's is hidden (phones) or absent.
- Solid gem buttons hover to their `-shadow` shade. Ghost/icon buttons hover with a warm alpha fill.
- Disabled = `opacity-50 cursor-not-allowed` (+ a `title` saying why when it isn't obvious).
- Busy = the icon becomes `i-carbon-circle-dash animate-spin` in place, label becomes "Starting…"; never block the whole page.
- A primary that toggles during work changes **in the same slot** (Send → Stop, iolite → coral).
- Danger-adjacent icon buttons stay neutral until hover, then `hover:text-coral` (stop, clear, delete). Info actions hover `text-iolite`. In a composer, each icon hovers to its own semantic hue at 10% bg.
- Touch: min height 40px, icon buttons 40×40 (`w-9 h-9 sm:w-7 sm:h-7` trick).
- Every button gets `focus-visible:outline-2 outline-iolite outline-offset-2` (the source app lacked this; don't copy the gap).

## Segmented control
Track `inline-flex p-0.5 gap-0.5 rounded-lg bg-warm-200/50 dark:bg-warm-800/70`; segment `px-2 h-6 rounded-md text-[11px]`; selected = **raised surface chip** (`bg-[var(--v2-card)] shadow-sm font-medium text-warm-800`), not a coloured fill. `role="radiogroup"` / `role="radio" aria-checked`. Use for 2–6 mutually exclusive presets (time range `1m 5m 15m 1h 6h all`, view mode, reading size).

Toggle chips for filters: on = iolite 10% fill + 35% border; **off = struck through + opacity .55** (encodes state by shape, not colour alone).

## Chips, badges, status dot

- `chip-<gem>`: `px-1.5 py-0.5 rounded-full text-[11px] leading-none border border-<gem>/40 bg-<gem>/10 text-<gem>-shadow dark:text-<gem>-light`. Neutral `chip-warm` for defaults.
- `gem-badge` (bigger, solid tint): `px-2 py-0.5 rounded-full text-xs font-medium bg-<gem>-light text-<gem>-shadow dark:bg-<gem>-shadow/30 dark:text-<gem>-light`.
- Status badge: dot + lowercase/sentence-case word inside the chip ("● interrupted"). Put the whole status vocabulary in **one map** (`status → {gem, icon, label}`), e.g. ok/succeeded/online → sage; running/live/connected → aquamarine; pending/waiting/stale → amber; failed/error/offline → coral; revoked/stopped/unknown → warm.
- Status dot: `inline-block w-2 h-2 rounded-full bg-<gem>`, `role="img" :aria-label :title` + `sr-only` label. **Never animated.** Next to a name in lists, rails, cards.
- Count badges: hide when zero; coral when errors > 0, amber for warnings, otherwise warm.
- Keyboard keys: `<kbd class="px-1.5 py-0.5 rounded bg-warm-100 border font-mono text-[11px]">` — `⌘` on Mac, `Ctrl` elsewhere.

## Inputs and forms

- Input: `h-8 px-2.5 rounded-lg bg-white dark:bg-warm-900 border border-warm-300 dark:border-warm-700 text-sm placeholder-warm-500 focus:outline-none focus:border-iolite` (+ optional `0 0 0 2px iolite/22%` ring). Dense editors: `h-6 text-[11px] font-mono rounded-md`.
- Invalid: coral border + coral 10.5–12px message directly under the field; focus jumps to the first invalid field on submit.
- Labels above fields (`text-xs font-medium text-warm-700`), hint under in warm-500. On phones, stack control under the text; switches can stay inline.
- Commit-on-Enter-or-blur for inspector fields; Esc reverts.
- Placeholders end with `…` ("Search pages…", "filter nodes…"). Search inputs: Esc clears.
- Selects/textarea inherit `font: inherit`. Textareas auto-grow to a cap (128px in a composer).
- IME-safe Enter: never submit while `event.isComposing || keyCode === 229`; on touch, Enter inserts a newline.

## Cards

- `card`: `bg-white dark:bg-warm-900 rounded-xl border border-warm-200/60 dark:border-warm-700/60`. Clickable: `card-hover` = + `hover:border-warm-300/80 hover:shadow-sm` (docs/marketing add a 1px lift + accent glow).
- **SectionCard**: 40px header row `flex items-center gap-2 h-10 px-4 border-b` = muted icon · `text-sm font-semibold` title · mono count · muted hint · `ml-auto` actions; body `p-4`, or `flush` (no padding) for tables/lists. With nothing to show, **the card stays and says so** so the page keeps its shape.
- **StatTile / Metric**: label `text-[10px] uppercase tracking-wider text-warm-500` (+ icon) · value `text-[22px] font-semibold num` with muted unit · 11px note · optional status chip · optional sparkline (96–220 × 22–26). Make the tile a link (`card-hover`) when it leads somewhere.
- KPI grid: `grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3`; page container `p-3 md:p-5 max-w-[1600px] mx-auto flex flex-col gap-4`.

## Nav rail

- Width 240 (clamp 180–480), resizable from its right edge (4px handle, `hover:bg-iolite/30`, `bg-iolite/50` while dragging, title "Drag to resize · double-click to reset", double-click resets). Persist width + collapsed.
- Collapses to a **48px icon strip carrying the same actions** (`w-8 h-8 rounded-md` buttons with `title`; monogram + status dot for list items).
- Top → bottom: brand row (round mascot mark `w-7 h-7` + two-tone wordmark: `<b class="text-amber">Kohaku</b><span class="font-light text-iolite">Name</span>`, search + collapse icons) → optional segmented app switch → primary "+ New" button (the only filled button) → scrolling middle (`flex-1 min-h-0 overflow-y-auto`: nav, divider, live items) → footer (divider, settings, host/user chip, theme + locale).
- Items: `h-9 px-3 rounded-lg gap-2.5`; hover `bg-warm-300/50 dark:bg-warm-700/50`; active `bg-warm-300/50 font-medium text-warm-800` (or `bg-iolite/10 text-iolite` in settings-style navs) with `aria-current="page"`.
- Group captions: `text-[10px]/[11px] uppercase tracking-wider text-warm-400` with a count on the right.
- Phone: the same rail component in a drawer (`w-72 max-w-[85vw]`, `bg-black/40` scrim, body scroll lock). Close it on the **outcome** (route/tab changed), not on any click — modals spawned from rail items must survive.

## Tab strip

- `h-8` strip in `--v2-chrome`; tab `h-8 pl-3 pr-1.5 text-xs`, label `truncate max-w-32`; active = canvas colour (fused; optional inverted-corner pseudo-elements) or `border-b-2 border-b-iolite`; inactive `text-warm-600 hover:bg-[var(--v2-hover)]`. Horizontally scrollable with `scrollbar-none`; trailing `+` button.
- Close/refresh icons are `hover-only-action`. Middle-click closes. The home/dashboard tab has no close.
- Attention badges on tabs: `!` needs input (amber), `●` completed. Chrome strings translate; user data in labels never does (`${name} · ${t('suffix')}`).
- Context menu: `w-48 rounded-lg shadow-lg py-1 text-xs` float, header row = id in `text-[10px] uppercase`, items `px-3 py-1.5 flex gap-2` with icon, dividers `my-1 border-t`, disabled = `opacity-40 cursor-not-allowed` + `title` with the reason. In a desktop shell try a native menu first and fall back to this.
- Phone: icon-only tabs except the active one keeps its label; or a bottom tab bar (`flex-1 flex-col items-center py-2`, `text-lg` icon + caption label, active `text-iolite`, `padding-bottom: env(safe-area-inset-bottom)`), max 5 + "More" popover, and hoist the active item into the visible bar.

## Header bar / status bar / side pane

- Instance header: `h-8 text-xs bg-white dark:bg-warm-900 border-b` — status dot · name (`truncate max-w-48`) · small counts · icon buttons · separator · selects · `Ctrl+K` hint pill · stop button (hover coral). Page-level header for admin-style pages: `text-xl font-semibold` title + one-sentence subtitle in `text-secondary`, actions right.
- **Status bar** (dense footer): `h-6 px-3 gap-2 text-[10px] font-mono bg-warm-100 dark:bg-warm-950 border-t text-warm-500`. Segments separated by currentColor separators: dot + name · model · short id (click copies, full id in `title`) · flex spacer · counts (amber when non-zero) · elapsed (`3h 4m`). Empty value = `—`.
- **Side pane**: default 380–400px, clamp 260–720, 1.5px drag handle on the inner edge, collapses to a 36px strip with a vertical label (`[writing-mode:vertical-rl]`), a 20px round float button straddling the edge to hide it. Persist `{width, collapsed}` per pane name. On phones panes become foldable sections under the content (36px title bar + chevron, `max-h-[55vh]`).
- Resize handles in general: pointer events + capture + `pointercancel`, `touch-action: none`, `body.style.cursor = col-resize` while dragging; prefer an always-visible grip pill (3×36px in `--v2-line-strong`, iolite + taller on hover) over an invisible-until-hover line.

## Settings

- Registry of sections `{ id, labelKey, descriptionKey, icon, group, order (10,20…), keywords, visible() }`; groups like General / Appearance / Account / System.
- Wide: left nav `w-56 p-3` panel with search on top (matches label, group, keywords; Esc clears) and group captions; content column `max-w-4xl mx-auto px-8 py-6 gap-5` with `h2 text-lg font-semibold` + hint `text-sm text-warm-500 leading-relaxed`.
- **Group > Card > Row**: caption (`kt-text-caption uppercase tracking-wider text-warm-500`) over a `kt-v2-card divide-y`; row `px-4 py-3 flex gap-4` — title `kt-text-body font-medium`, hint `kt-text-caption text-warm-500`, optional status line with tone ok/warn/error/muted, control on the right.
- Phone: list → page. Rows `min-h-14 px-4 gap-3 border-b`, `text-lg` icon, 15px label, optional amber dot, chevron; `active:bg-warm-200/60` (`:active`, not hover). Section opens as a page with a back button; the page bar carries the title.
- Save: auto-apply where safe; otherwise a sticky footer save bar on the canvas colour. Inline section errors = coral banner `role="alert"`.

## Dialogs, confirms, menus, palette, toasts

- **Modal shell**: `fixed inset-0 z-50 bg-black/40 p-4` → panel `bg-[var(--v2-float)] rounded-xl shadow-xl border max-w-2xl max-h-[90vh] flex flex-col`; header `px-4 py-3 border-b` (title + close `w-9 h-9 sm:w-7 sm:h-7`), body `flex-1 overflow-y-auto p-4`, footer `border-t` with Cancel (ghost) + primary on the right. Esc closes; focus moves into the dialog and returns to the opener. **Phones: fullscreen via one global CSS rule** (`max-width: 767px`), body `max-height: calc(100dvh - 120px)`. Prefer sheets/drawers over popovers on phones.
- Mount global modals once at the root and open them with namespaced window events (`app:open-x`) instead of threading props.
- **Confirm** only destructive or irreversible actions (reversible ones just run). Title = question, body = consequence + reassurance ("Clear conversation context? Chat history will be preserved in the session." / "Delete user "alice"? This cannot be undone."). Confirm button is **the verb** in coral ("Delete", "Revoke"), never "OK". Cancel is swallowed silently.
  - Live changes to a running system: confirm card shows a **diff table** (old struck-through → new semibold mono), the exact command/body in mono, then the system's answer (sage chip) or error (coral chip).
  - Very destructive (delete a machine/repo): **type-the-name guard**; the typed value resets each open; no outside-click close while busy.
  - In spatial editors, confirm **inline** (a coral/8 card with `role="alertdialog"`, consequence lines, auto-focused verb button) rather than a modal.
- **Command palette** (`Ctrl/⌘+K`, always wins even inside inputs): 520px centred, borderless input with prefix sigils (`>` commands, `@` items…), results `max-h-80`, ↑/↓ wrap, Enter runs, Esc closes, mouse moves highlight, highlight `bg-iolite/10 text-iolite`, rows = icon · label · 9–10px description · right-aligned mono shortcut. Empty: "No matches".
- **Toasts**: bottom-right, max 6, `min-w-64 max-w-96 rounded-lg border px-3 py-2 text-xs shadow-lg backdrop-blur bg-white/95 dark:bg-warm-900/95`; level = **tinted border + coloured icon**, not a coloured fill (info iolite, ok sage/aquamarine, warn amber, error coral); 6s auto-dismiss; keep a history. Use toasts for action results ("Copied", "{Verb} failed: {message}"), never for state the user must act on.
- Copy buttons: icon swaps to a sage/aquamarine check + "Copied" for 1.5s; failure "Copy failed — select and copy manually".
- Floating widgets close via their button, Esc, or the dock — **not** on any outside press (that fired on scroll and chat clicks).

## Tables and lists

- Plain warm tables beat a component-library grid: `text-xs`; header `h-8 text-warm-400 font-medium` (uppercase 10–12px muted in report-style tables); rows `h-10 border-b border-[var(--v2-line)] last:border-b-0 hover:bg-[var(--v2-hover)]`; numeric columns right-aligned `num`; missing = `—`; error counts coral only when non-zero.
- Row selection: `bg-iolite/10` (+ `ring-1 ring-iolite/30` for focus in dense event lists); out-of-focus rows `opacity-40` instead of hidden.
- Fixed-width leading columns in a flex row (`w-16 mono time · icon · w-32 mono type · flex-1 truncate summary · mono tokens · duration`) give table alignment without a table.
- Row actions: small outlined buttons in semantic colour (Stop coral/30 border, Start aquamarine/40), or `hover-only-action` icons.
- **Columns respond to the table's container, not the viewport.** A 1440px window with a side pane open still leaves a ~700px card, and with fixed-width meta columns the name column collapses to "e5-e…". Make the wrapper `container-type: inline-size` and drop columns by priority with `@container (max-width: …)`. The identity column (name) is never the one that gives way: give it a `min-width` of about 12rem and keep its secondary line (id · meta). Whatever a dropped column showed must still be reachable in the detail view.
- **Phone: never a squeezed table.** Tap rows `min-h-14`: dot · name + badges, second line mono meta, trailing chevron → detail sheet/page.
- Truncation: `truncate` + `:title="full"` on every user/entity string; flex recipe parent `flex min-w-0`, child `truncate flex-1 min-w-0`, siblings `shrink-0`. Two-line clamp at normal density, one line at compact.
- Lists of N: show 5 + "+N more" / "Show fewer". Name summaries: top 4 + "+N more" (`read ×3, bash, edit, +2 more`).
- Times: relative ("3 minutes ago") with the absolute timestamp in `title`; "never" for null.
- Live elapsed timers tick once per second from **one shared, visibility-aware interval** (paused while the tab is hidden), formatted `12s` → `7m 3s` → `3h 4m`; finished items show a fixed value. Never one `setInterval` per row.
- Queues: queued items sort after running ones, show their position or what they wait on in the meta line ("waiting · 0 of 2 GPUs free"), amber `queued` chip, empty progress track, `—` for elapsed. A queue that lives next to a live stream sits *outside* the stream (above the input / in its own card), never interleaved with output.

## Accordions / disclosure rows

One density for every disclosure: a single `text-xs` line, collapsed by default. Header = status glyph (`✓` sage, `✗` coral, `○` amber interrupted, `⚙`/spinner running) · mono name (iolite/semibold) · truncated args/preview (warm-400 mono, `flex-1`) · elapsed (10px mono) · chevron (rotates, iolite when open). Body mounts **only when open** and scrolls inside a cap (`max-h-32`…`max-h-72`). `role="button" tabindex="0" aria-expanded`, Enter/Space toggle. Group ≥3 consecutive similar rows into one batch row ("5 tool calls · read ×2, grep, bash ×2" + per-status count chips), with a stable id so expansion survives streaming.
