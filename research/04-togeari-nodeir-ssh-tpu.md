# 04 · Togeari dashboard, KohakuNodeIR (kir-editor + kir-graph), KohakuSSHManager, KohakuTPU docs-web

Slice: Kohaku's newest frontends (Jul–Nov 2026). Everything here was read-only from
`<clones>/`. Paths below are relative to that root. Line numbers are from the
checked-out tree on 2026-11-12.

## 0. Dating and provenance (read first)

| Project | Frontend path | Commits touching it | Date range | Notes |
|---|---|---|---|---|
| Togeari dashboard | `Togeari/apps/dashboard` | 4 | 2026-10-25 → 2026-10-27 | Newest *app*. Full history, long commit bodies with the reasoning |
| kir-graph (library) | `KohakuNodeIR/packages/kir-graph` | 4 | 2026-10-25 | The graph renderer that Togeari and kir-editor both use |
| kir-editor | `KohakuNodeIR/apps/kir-editor/frontend` | 3 | 2026-10-20 → 2026-10-25 | A rewrite. An older March 2026 editor (WASM/Pyodide) existed and was replaced |
| KohakuSSHManager | `KohakuSSHManager/frontend` | **1** (`26bedfe "bug fix"`) | **2026-07-24** | Squashed. Older than the brief suggests (July, not Oct–Nov). Treat it as *mid-2026 Terrarium-classic* |
| KohakuTPU docs-web | `KohakuTPU/docs-web` | **1** (`a305c6f`) | 2026-11-11 | Squashed, so there is no per-change rationale. It does carry `AGENTS.md`, an explicit design contract |
| KohakuGBC demo | `KohakuGBC/scripts/demo/compare.html` | 1 | 2026-11-08 | A one-off HTML report. **Off-brand** (see §6) |
| KohakuHPO webpage | `KohakuHPO/webpage` | – | 2026-07-09 | Static explainer. **Off-brand** slate/cyan |
| Kohaku-NAI | `Kohaku-NAI/client.css` | – | 2026-08 | A 41-line Gradio layout patch. No design content |

**Every Oct–Nov commit body ends `Co-Authored-By: Claude Opus 5.5`.** The code is agent-written
under Kohaku's direction. What stays the same across projects is the spec: the palette, the surfaces,
the comment voice, the AGENTS.md rules. Ad-hoc styling choices vary more from project to project. The TPU `AGENTS.md` makes this explicit: "The design language is not yours to change".

---

## 1. Togeari dashboard (Oct 2026): a live dataflow-machine dashboard

### 1.1 Stack
- Vue 3.5, Pinia 4, vue-router 4 with **file routes** (`unplugin-vue-router`, `src/pages`).
  `unplugin-auto-import` covers vue, pinia and vue-router. `unplugin-vue-components` covers `src/components`.
  (`Togeari/apps/dashboard/vite.config.js:21-27`.)
- **No Element Plus.** UnoCSS `presetWind` + `presetIcons` (Carbon only) + `transformerDirectives`
  (`uno.config.js:1-18`).
- Charts use **uPlot** 1.6 for time series and hand-rolled SVG for sparklines and phase bars. Graphs use
  `@kohaku/kir-graph` (Vue Flow + elkjs), aliased to the KIR checkout's source
  (`vite.config.js:14-19,31-33`).
- Prettier: `semi:false`, double quotes, `printWidth:100`, **`printWidth: 9999` for `*.vue`**, so
  every template element stays on one line (`.prettierrc.json`). The same file appears in
  KohakuSSHManager and is described as "Prettier and ESLint as KohakuTerrarium configures them"
  (commit `7acacb8`).
- Dev tooling: `npm run shots` drives headless Edge through Playwright and screenshots "every view,
  both themes, recorded and live", plus a phone viewport of 390×844. It fails if the page logs
  an error (`scripts/shots.mjs:1-6,18`).

### 1.2 Tokens and theme
**Uno theme = the gem palette + warm scale, byte-identical to Terrarium** (`uno.config.js:35-55`):
```
sapphire  #D6E3F8 / #0F52BA / #082567     iolite  #DDD0F0 / #5A4FCF / #312A7A
aquamarine #D4EDE8 / #4C9989 / #1B6B5A    amber   #F5E6C8 / #D4920A / #8B5E00
taaffeite #E8D5ED / #A57EAE / #6B4670     coral   #F5D5D5 / #D46B6B / #8B3A3A
sage      #D5E8DA / #5A9E6F / #3A6B48
warm 50 #F7F5F2 · 100 #EFECE7 · 200 #E0DBD4 · 300 #C5BFB7 · 400 #A09A92 · 500 #8A8480
     600 #6A645F · 700 #4A4540 · 800 #3A3632 · 900 #2A2724 · 950 #1A1816
```
Header comment (`uno.config.js:3-4`):
> "The KohakuTerrarium gem palette: warm surfaces, gem accents, iolite for focus; sage, amber and
> coral are status colours only."

**New: a preflight emits every theme colour as a CSS variable** `--kt-color-<gem>[-shade]`
(`uno.config.js:19-33`). Hand-written CSS can then use `color-mix(in srgb, var(--kt-color-iolite) 9%, transparent)`
without restating hex values (`surfaces.css:115,122`).

**Base surfaces** (`src/styles/base.css:3-22`). These are Terrarium's current "stone" values:

| token | light | dark |
|---|---|---|
| `--color-bg` | `#f2eee8` | `#1a1816` |
| `--color-surface` | `#ffffff` | `#252220` |
| `--color-border` | `#e5dfd7` | `#3d3835` |
| `--color-text` | `#2e2a26` | `#e8e0d8` |
| `--color-text-muted` | `#6c655d` | `#8a8078` |
| `--color-text-faint` | `#8f8880` | `#5a5550` |

**Contrast fix for light mode**, copied from Terrarium (`base.css:62-67`). In light mode only,
`text-warm-400` is pulled to `#77706a` and `text-warm-500` to `#655e57`. Terrarium's comment
explains it: "warm-400 / warm-500 are too pale on stone surfaces"
(`KohakuTerrarium/src/kohakuterrarium-frontend/src/style.css:52-56`).

**The v2 surface system: five levels, each a job** (`src/styles/surfaces.css:1-39`). This is a
port of Terrarium's `components/session-v2/surfaces.css`:
```
chrome  the tab strip; the active tab is the canvas colour, so tab and page read as one;
canvas  what a tab shows;
panel   side regions (the rail, the side panel), edged by a strong line;
card    grouped content on a canvas;
float   things above the page (tooltips, menus), with a shadow.
Region boundaries use --v2-line-strong; rows inside a region use --v2-line.
```
| var | light | dark |
|---|---|---|
| `--v2-chrome` | `#e3ddd5` | `#1a1816` |
| `--v2-rail` | `#dcd5cb` | `#161412` |
| `--v2-canvas` | `#fbfaf8` | `#221f1d` |
| `--v2-panel` | `#f2eee8` | `#2a2724` |
| `--v2-card` | `#ffffff` | `#2a2724` |
| `--v2-card-shadow` | `0 1px 2px rgb(40 34 28 / .05)` | `none` |
| `--v2-float` | `#ffffff` + `0 6px 20px rgb(30 24 18 / .14)` | `#2e2b28` |
| `--v2-line` / `--v2-line-strong` | `#e5dfd7` / `#cdc5ba` | `#3a3632` / `#4a4540` |
| `--v2-tab-hover` | `rgb(36 33 29 / .07)` | `rgb(255 255 255 / .05)` |
| `--v2-ink` / `-2` / `-3` | `#24211d` / `#6c655d` / `#8f8880` | `#f3efe9` / `#a39a91` / `#6f6760` |

In light mode the canvas is near-white and panels step *darker*. In dark mode each level steps *lighter*.
Dark mode drops card shadows completely.

**Fused tabs** (`surfaces.css:79-107`). The active tab takes the canvas colour. Two 0.625rem
`radial-gradient` pseudo-elements draw outward-curving corners, so the tab flows into the page,
Chrome-style. "Tabs fused by colour alone; the outward corner curves join the active tab to the bar."

**Selection and toggles** (`surfaces.css:109-135`):
- Row hover uses `--v2-tab-hover`. The selected row `.kt-row--on` is iolite at 9%.
- Category toggle `.kt-cat`: on is a filled iolite chip (10% fill, 35% border). **Off is
  `line-through` + opacity 0.55** with a transparent fill. The commit adds "a filled chip when on,
  struck through when off" (`d6cf48b`).
- `:focus-visible` gives a `2px solid iolite` outline with offset 1px.
- `.kt-input`: 1.5rem tall, 11px, card fill, strong-line border. Focus is an iolite border plus a
  `0 0 0 2px` iolite-22% ring (`:137-154`).
- `.kt-switch`: 1.75×1rem. Off uses the line colour and on uses iolite, with a 0.15s transition (`:156-184`).

### 1.3 Shortcuts: the dense app-shell vocabulary (`uno.config.js:58-83`)
| shortcut | value (abridged) |
|---|---|
| `btn-primary` | `h-7 px-3 rounded-lg bg-iolite text-white hover:bg-iolite-shadow text-xs font-medium`, disabled 50% |
| `btn-ghost` | `h-7 px-2.5 rounded-lg text-xs text-warm-600 hover:bg-warm-200/60 dark:hover:bg-warm-700/40` |
| `btn-icon` | `w-7 h-7 rounded-lg` square, same hover, disabled 40% |
| `chip-{warm,iolite,sage,amber,coral}` | `px-1.5 py-0.5 rounded-full text-[11px] leading-none border border-<gem>/40 bg-<gem>/10 text-<gem>-shadow dark:text-<gem>-light` |
| `section-title` | `text-[10px] uppercase tracking-wider font-medium text-warm-500` |
| `card-head` | `flex items-center gap-2 h-10 px-4 border-b` |
| `card-title` | `text-sm font-semibold` |
| `num` | `font-mono tabular-nums` |
| `seg-btn` / `seg-btn-on` | `px-2 h-6 rounded-md text-[11px]` / `bg-[var(--v2-card)] shadow-sm` |

Chip recipe: **gem at 10% fill, 40% border, `-shadow` text in light mode, `-light` text in dark mode.**
The same recipe appears in kir-editor (`kir-editor/frontend/uno.config.js:65-74`).

### 1.4 Typography
- Inter 400/500/600/700 and JetBrains Mono 400/500 from Google Fonts (`index.html:7-9`). Root is
  **14px / 1.5**, antialiased (`base.css:40-48`).
- **The `kt-text-*` tiers are not used.** Sizes are arbitrary px values chosen by role. Observed
  scale: 10px (section titles, counts), 10.5px (block sub-notes), 11px (chips, hints, table
  annotations, tooltips), 11.5–12.5px (row titles), 13px (tab labels), 15px (logo, card icons),
  **22px/28px semibold mono for headline numbers** (`components/ui/StatTile.vue:32`).
- Every number is `num` (mono + tabular). Tables right-align numeric columns
  (`OverviewView.vue:51-60`).
- Wordmark: `<b class="font-bold text-amber">Toge</b><span class="font-light text-iolite">ari</span>`
  in two weights and two gems, with a lowercase "dashboard" muted next to it (`RunRail.vue:24-26`).

### 1.5 Layout
`App.vue:1-17`: `RunRail | (TabStrip / main.kt-v2-canvas)`.
- **RunRail** (`components/shell/RunRail.vue`). Default 240px, clamp 180–420, resizable from its
  right edge. **It collapses to a 48px icon strip** showing one 2-letter monogram per run with a
  state dot (`:2-19,90`). The footer holds the run path and the theme toggle.
- **TabStrip**: `h-11`. View tabs on the left are `RouterLink`s with Carbon icon + label
  (`TabStrip.vue:2-10`). The right side holds status chips (`live`, `unreachable`), the range clock in
  mono, a **segmented range preset** (`1m 5m 15m 1h 6h all`, from `stores/range.js:5-12`), a
  resolution `<select>` and a refresh icon.
- **SidePane** (`components/shell/SidePane.vue`). This is a reusable right or left region, default 380–400px,
  clamp 260–720. Collapsed it becomes a **36px strip with a vertical-writing label**
  (`[writing-mode:vertical-rl]`, `:16`). A 1.5px drag handle sits on the inner edge, highlighted
  `iolite/30` on hover and `iolite/50` while dragging. A **20px round float button** straddles the
  edge to hide the pane (`:21-24`).
- `usePane` persists `{width, collapsed}` per name in localStorage as `togeari.dash.pane.<name>`. Drag uses
  pointer events with `pointercancel` and sets `body.style.cursor = col-resize`. **Double-click resets the width**
  (`composables/usePane.js`). Every handle has the tooltip "Drag to resize · double-click to reset".
- Content pages: `p-3 md:p-5 flex flex-col gap-4 max-w-[1600px] mx-auto`. The KPI grid is
  `grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3`, and chart rows use `xl:grid-cols-5` with a 3/2 split
  (`OverviewView.vue:2-19`).

### 1.6 Responsive: an explicit "compact" mode
`composables/useCompact.js:1-21` uses one `matchMedia("(max-width: 767px)")` ref:
> "Whether the window is phone-sized (below Tailwind's `md`, 768 px): the run rail becomes a
> drawer and side panels stack under the content."
- Phone: the rail is teleported into a `fixed inset-0` drawer (`w-72 max-w-[85vw]`, `bg-black/40` scrim)
  (`App.vue:4-9`). Tabs show **an icon only, except the active tab**, which keeps its label (`TabStrip.vue:7`).
- SidePanes become **foldable sections under the content** with a 36px title bar and chevron, `max-h-[55vh]`
  (`SidePane.vue:1-8`).
- The Machine picture keeps its desktop drawing and scrolls sideways (`min-w-[860px]`) instead of
  reflowing (`MachineView.vue:4-6`).

### 1.7 Component patterns
- **SectionCard** (`components/ui/SectionCard.vue`): "A KohakuTerrarium section card: a 40px header
  (icon, title, mono count, actions), a body." Props are `title icon count hint flush`. The header row is
  icon · title · mono count · muted hint · `ml-auto` actions. `flush` drops the `p-4` body padding for
  tables and lists.
- **StatTile** (`components/ui/StatTile.vue`) is a headline number: a 10px uppercase label with icon,
  a 22px mono value with a muted unit, an 11px note, an optional status chip with an icon, and an optional
  220×26 sparkline.
- **Segmented** (`components/ui/Segmented.vue`): `p-0.5 rounded-lg bg-warm-200/50` track. The selected
  `seg-btn` gets the card colour and `shadow-sm`, a macOS-style segmented control.
- **ConfirmDialog** (`components/ui/ConfirmDialog.vue`). **Every live change goes behind a confirm step**
  that shows a table of old→new values: old struck through, an arrow icon, new in semibold mono. Below it the
  literal command and JSON body appear in mono, then the machine's answer in a sage chip or its error in a coral chip.
  Danger actions recolour the primary button coral. Esc closes it. Focus moves to the dialog
  (`:1-50`). The docs restate this: "Every change goes through a confirm step that shows the old value, the new one and the
  command sent, then the machine's answer or its error" (`Togeari/docs/guides/dashboard.md`).
- **Block** (`components/machine/Block.vue`) is a clickable card (`role=button`, `tabindex=0`,
  `aria-pressed`, Enter selects). An accent variant tints the border `color-mix(iolite 55%)` and
  the fill to iolite 4%.

### 1.8 Data-dense views and dataviz rules
**`utils/palette.js:1-10` is the clearest statement of his chart-colour discipline:**
> "Chart colours, by the job each does (checked with the dataviz validator against the card
> surface of each mode).
> - categorical (identity): iolite, then aquamarine; every pair separates under colour-vision
>   deficiency in both modes. **A third series is drawn as a small multiple, never a new hue**;
> - phases of a call: wait is a stone neutral (… it fails the chroma floor on purpose and is
>   always labelled), queue iolite, service aquamarine;
> - **status (state) is reserved: sage good, amber warning, coral bad, always with an icon.**"

Chart hexes are *tuned per mode* and are not the raw gems (`palette.js:12-25`):
```
CATEGORICAL light [#5A4FCF, #1F9A80]   dark [#8076E6, #25A88E]
PHASE  wait #C4BBB0 / #5F5852 · queue = cat[0] · service = cat[1]
STATUS light good #3A8A55 warn #B87A00 bad #C24A4A idle #A09A92
       dark  good #6DB585 warn #D9A23A bad #E07A7A idle #6A645F
chrome light axis #77706a grid rgba(36,33,29,.07) tick .14 · dark axis #8a8078 grid rgba(255,255,255,.06)
```
- **TimeChart** (`components/charts/TimeChart.vue:19-31,120-166`): uPlot with its built-in legend hidden. The app
  draws its own `ChartLegend`, and only when there are 2+ series (`ChartLegend.vue:2`). A crosshair
  is shared across charts via `cursor.sync`. **Dragging on a chart sets the dashboard-wide range ("brush")
  and double-click goes back one zoom.** The selection fill is iolite 12%. Lines are 2px with no points and an optional
  `${color}1f` fill and `${color}22` min/max band. Event marks are dashed vertical rules and are
  listed in the tooltip within 5px. Axis font is `11px Inter`. y max gets 8% headroom. Empty state:
  "No data in this range".
- **Tooltips** `.kt-tip` (`styles/charts.css:13-39`): float surface, 11px, 8×8 swatch with 2px radius,
  value right-aligned in mono tabular.
- **Spark** (`charts/Spark.vue`): 96×22 by default with a 1.5px non-scaling stroke and a `${stroke}22` area. **Min/max
  per pixel column** when values exceed 2×width, which preserves spikes.
- **PhaseBar** (`charts/PhaseBar.vue:94-121`): a stacked bar of wait/queue/service. Its width is the row's
  share of the largest row (minimum 1.5%), segments sit 2px apart and only the outer ends are rounded (4px).
  Hover shows a float tooltip.
- **FillBar** (`charts/FillBar.vue`): a 6px (`h-1.5`) rounded track in `--v2-line` with a fill that
  animates width over 300ms and a mono 10px label in a fixed `w-9` right column.
- Queue depth is drawn as **a row of 10×10 squares with 2px radius**, filled up to the queued count
  (`MachineView.vue:74-75`).
- Tables (`OverviewView.vue:47-81`): `text-xs`, header `text-warm-400 font-medium h-8`, rows `h-10`,
  `kt-v2-line border-b last:border-b-0 kt-row`. Missing values are "—". Error counts are coral only when
  non-zero, otherwise faint "—".
- The Machine view (`MachineView.vue:1-60`) is drawn **as a schematic, not a dashboard grid**:
  columns "many jobs → Dispatcher → lanes → units" with arrow glyphs. Each block holds its
  own mini-stats. A one-line explanation sits at the bottom of a block: "A statement issues once its
  inputs are filled, in any order; results still retire in program order."
- Program view: KirGraph with a **heat overlay** and a floating legend at bottom-left, "low → high" gradient bar plus
  status icons (`ProgramView.vue:26-33`). Heat uses sapphire, "a magnitude, not a status: its own hue, never a status
  colour" (`kir-graph/src/styles/tokens.css:72-73`).

### 1.9 Live status, loading, empty, error
- Live polling runs every 1s, **paused while `document.hidden`**, and resumes on `visibilitychange` (`stores/live.js:25,85,152`).
  It keeps the last 200 rare events.
- Live chip: `chip-sage` with `i-carbon-dot-mark animate-pulse` and the text "live". Unreachable uses a
  `chip-amber` warning icon. Rail dots: live `bg-sage animate-pulse`, unreachable `bg-amber`,
  stopped `bg-warm-400` (`RunRail.vue:82`).
- **Progressive loading** (`composables/useLoad.js:89-102`). Data streams in chunks, newest first, and
  "the previous picture kept for time not read yet". Partial values commit at most once per animation
  frame. Only one load is in flight, and new run/range/deps abort it. A live tick during a load waits for it. Commit `d6cf48b`
  explains why: "a load slower than the 2 s tick used to be dropped every time, leaving panels empty".
  Data goes in a `shallowRef`, with "no reactive proxies over sample arrays". The commit reports performance numbers
  ("main-thread time per 10 s of live ticks 1,720 -> 157 ms … no task over 50 ms; first numbers
  0.7 s after navigation").
- There are **no spinners or skeletons on data views**. Charts keep their last data and update in place
  (`plot.setData`). They rebuild only when series or theme change (`TimeChart.vue:73-81`). Spinners
  (`i-carbon-circle-dash animate-spin`) appear only on in-flight *commands* (`ConfirmDialog.vue:29`).
- **Empty states are positive and specific**, written as a sage check icon plus a full sentence:
  "No failed attempts in this range." (`OverviewView.vue:90`), "No unit, lane, plugin or machine
  event since the page opened." (`EventFeed.vue:8`), "No calls in this range.", "No runs found."
- Errors use a `chip-coral` block containing the raw message (`ProgramView.vue:35`).

### 1.10 Microcopy voice
- Lowercase status words: `live`, `unreachable`, `brushed`, `stopped`.
- **Tooltips are full explanatory sentences** with a colon: "the run has no stop time and its
  inspector does not answer: killed, or run without one" (`TabStrip.vue:15`); "Rate charts'
  buckets: Auto one per screen pixel, Full every stored row (1 s), or a fixed step" (`:24`);
  "Back to the preset range (double-click a chart: back one zoom)".
- Middle-dot `·` separators throughout ("p90 … · p99 …", "core · ring"). A `→` marks flow ("results from
  every unit → the dispatcher's inbox → writeback"). En dash marks ranges.
- Phase notes define their terms: `wait: "fetched → issued (inputs, gates, admission)"`
  (`palette.js:35-39`).
- Format helpers (`utils/format.js`): µs-based durations ("870 µs", "12.4 ms", "3.21 s",
  "4m 05s"), counts with thousands separators or "1.20 M", rates to 3 significant figures, `—` for anything
  non-finite. **Intl formatters are created once and reused**, because "`toLocale*String` builds a new one on every call".
- Preferences (`utils/prefs.js`) use the localStorage prefix `togeari.dash.` and every access is wrapped in try/catch: "A
  private window or blocked storage reads the fallback and keeps changes for the visit only."
- Theme (`stores/theme.js`) follows the system until the user picks one, then saves it. A `dark` class goes on `<html>`.

---

## 2. KohakuNodeIR: kir-graph library + kir-editor (Oct 2026)

### 2.1 Stack
- **kir-graph** is a standalone Vue component library (`packages/kir-graph`) built on Vue Flow
  (core/background/controls/minimap) and elkjs as **peer deps**, shipped as an ES module plus one CSS file
  (`README.md`, commit `8b42f12`). Togeari consumes it too.
- **kir-editor** (`apps/kir-editor/frontend`) uses Vue 3.5, Pinia 4, UnoCSS (same config as Togeari minus
  the v2 shortcuts), CodeMirror 6 with a custom KIR language, and Playwright e2e against installed Edge. **No router and no
  Element Plus.**
- History: the March 2026 editor (WASM, Pyodide, radial auto-layout; commits `f282faa`, `9ff27db`)
  was **replaced** on 2026-10-20 by "an example node editor for KIR v2 … a client of the
  toolchain, not part of it" (`34057c8`). Then on 10-25 the editor's own layout and render code was
  deleted in favour of the library (`37f5259`).

### 2.2 Graph theme tokens: one file, namespaced `--kg-*`
`kir-graph/src/styles/tokens.css:1-7`:
> "Theme of every kir-graph view: the KohakuTerrarium gem palette and warm neutrals. Light by
> default; dark under `html.dark` (unless the graph is `.kg-light`) or with `.kg-dark`. **No colour
> is written outside this file.** `.kg-theme` carries the same variables for a host's own
> elements…"

- It repeats the gem triplets as `--kg-<gem>`, `-light` and `-shadow` (`:11-31`), so the library carries no Uno dependency.
- Surfaces use the same stone values (`--kg-bg #f2eee8`, `--kg-border-strong #cdc5ba`, `--kg-grid #d8d1c7`,
  `--kg-shadow: 0 1px 2px rgb(42 39 36/.08), 0 2px 8px rgb(42 39 36/.08)`) (`:33-44`).
- **Semantic mapping of gems to the domain** (`:46-79`):
  - control flow = iolite (`--kg-ctrl`); untyped data = `#a09a92`
  - **type colours**: int→sapphire, float→aquamarine, str→amber, bool→coral, list→taaffeite,
    dict→sage; nominal types 0–7 use the `-shadow` variants plus two extras `#7a6fd8`, `#b0784a`
  - status: idle `#a09a92`, ok sage, waiting amber, running aquamarine, warn amber, error coral
  - heat: sapphire
  - Retro sub-palettes for homage views: ROBO Pro flow `#1f5fd0` and data `#e08a10`. EV3 number `#e8b600`,
    bool `#3fa34d`, text `#ee7a1f`.
- Dark mode (`:96-134`) **brightens each type colour by hand** (int `#6f9be0`, float `#6fb8a8`, str
  `#e0aa3e`, bool `#e08c8c`, ctrl `#8b83db`) and flips nominal types to the `-light` variants. It does not reuse the
  light hexes.
- Fonts: `--kg-font-sans: Inter…`, `--kg-font-mono: "JetBrains Mono"…`. The root size is 12px.

### 2.3 Canvas interaction conventions (`render/flow/FlowView.vue`, `styles/flow.css`)
| concern | value | evidence |
|---|---|---|
| zoom range | `min-zoom 0.03`, `max-zoom 2.5` | `FlowView.vue:21-22` |
| background | dot grid, `gap 22`, `size 1.1`, colour `--kg-grid` | `:33` |
| controls | Vue Flow Controls bottom-left, interactive lock hidden. Restyled with 1px border, 0.5rem radius, surface fill | `:34`, `flow.css:31-42` |
| minimap | `pannable zoomable`, **160×110**, node colour `--kg-minimap-node`, mask `--kg-minimap-mask`, rounded 0.5rem. On by default in the library, **off** in the Togeari Program view (`:minimap="false"`) and default-off in the editor canvas | `:35`, `flow.css:43-48` |
| virtualisation | `only-render-visible-elements` when nodes > **600** | `:20,96` |
| level of detail | zoom < 0.22 → `far`, < 0.5 → `mid`. Mid hides port rows and badges. Far hides all text and handles and draws wires at 3px | `:84,118`, `flow.css:307-327` |
| selection | iolite border + `0 0 0 2px iolite 45%` ring. Hover border `iolite 60%` mixed into the strong border | `nodes.css:311-335` |
| "same variable" | every element of the focused variable gets a 3px iolite ring (`.is-same`) | `nodes.css:319-330` |
| node focus outline | Vue Flow's default selected and focus box-shadow is removed and replaced by the above | `flow.css:22-27` |
| delete | `Delete`/`Backspace` on the focused canvas, **ignored inside input/textarea/select/contenteditable**. Emits an event and never mutates | `FlowView.vue:352-366` |
| undo | `Ctrl/⌘+Z`, `Ctrl+Shift+Z` / `Ctrl+Y`, skipped inside text fields and `.cm-editor` | `kir-editor/src/App.vue:73-83` |
| double-click | `open`: the host enters the called `@def` graph. Togeari shows a breadcrumb of opened frames | `FlowView.vue:24`, commit `0e63fab`, `ProgramView.vue:13-18` |
| drag from palette | HTML5 DnD with a custom MIME `application/x-kir-node`. The drop resolves the innermost region box | `PalettePanel.vue:67`, `FlowView.vue:368-382` |
| layout status | an **on-canvas chip** top-left: "laying out N elements" with a spinner, or a coral "layout failed: …" | `FlowView.vue:37-40` |

**Pins** (`flow.css:83-129`): data pins are **10px circles** with a 2px border in the type colour and a surface fill.
**Control pins are chevrons** made with `clip-path: polygon(0 0,55% 0,100% 50%,55% 100%,0 100%)`
(UE exec-pin style). `any`-typed pins sit at opacity 0.6. While editing, a pin gets a `crosshair` cursor, a
**6px invisible hit-ring** (`::after inset:-6px`), and fills solid when hovered or offered as valid.

**Wires** (`render/flow/WireEdge.vue:18-27,62-70`, `flow.css:150-200`):
> "In the 'rail' wire style **control is a hollow double line and data a thin single one, so the
> two read apart by shape, not by colour alone**; 'plain' draws both as solid lines of their colour."
- Widths: rail control 4.4 (core 40% in the background colour, which makes it hollow), data 1.3. Plain uses
  ctrl 2.2 and data 1.6. Overlay weight adds up to +4px.
- Orthogonal routes with rounded corners, radius 5 for control and 10 for data (`WireEdge.vue:64`).
- A 12px transparent hit path sits under each wire.
- Back-edges (loops) are dashed `7 4`. **Active wires animate a marching dash** (`8 6`, 0.9s)
  (`flow.css:180-190`).
- Selected wires get width 3.2 and an iolite drop-shadow glow.
- Labels and arm names (`tail`) are 10px mono with a **3px halo stroke in `--kg-bg`** (`paint-order: stroke`)
  so they stay legible over the grid.
- The connection being drawn is iolite, 2.2px, dashed `6 4` (`flow.css:134-138`).
- Arrowheads are SVG markers coloured by kind (`FlowView.vue:97-102`).

**Cards** (`styles/nodes.css:3-60`): 8px radius, surface fill, strong border, `--kg-shadow`. The **head is
a 4px solid accent stripe plus the accent's light tint**
(`linear-gradient(90deg, accent 0 4px, accent-soft 4px)`). In dark mode the tint is `color-mix(accent 30%, surface)`.
Titles and port labels are mono 12px and 11px. `@def` call cards get a double ring (`0 0 0 3px surface, 0 0 0 4.5px taaffeite`).
Pills: variables use aquamarine (dashed border for `set`), literals amber, params sage with 4px radius.

**Regions** (`flow.css:200-300`): 10px radius, 1.5px border at 38% of the region colour, 5% fill, and a
dashed separator under a mono 11px head. Colours follow the construct: default iolite, loop/each/collect
amber, try/except coral (except dashed), dataflow aquamarine dashed, parallel taaffeite. A collapsed
region becomes a solid card (60% border, 10% fill, shadow) with a toggle button.

**Heat overlay** (`nodes.css:337-370`): "a meter inside the bottom edge of a box (a track, filled as
far as the heat) and a glow that grows with it". A 3px bar sits at the bottom inset 8px and the outer glow is
`calc(heat*4px)`. **Overlay changes never re-layout**, and positions are remembered across edits (commit
`9169449`: "A graph change keeps every element where it was drawn").

**Six projections of one program** (`render/KirGraph.vue:46-51`, `kir-editor/src/stores/ui.js:26-32`):
Nodes ("ComfyUI / Blender style"), Flowchart ("ROBO Pro style"), Sequence ("LEGO EV3 style"),
Blocks ("Scratch style"), plus Text and Split. "Text stays the source of truth; every view is a
projection that writes back through the toolchain" (`4cbc894`).

**Library API design** (`KirGraph.vue:53-89`): the component **never mutates the document**. Every
edit comes out as an event (`connect`, `delete`, `drop`, `edit`, `move`), and the host applies it.
`theme: "inherit"|"light"|"dark"`, plus a default slot "drawn over the view, inside the theme (a legend, a toolbar)".

### 2.4 kir-editor shell (an IDE layout)
`apps/kir-editor/frontend/src/App.vue:1-21`:
```
AppHeader      h-11  (strip #e3ddd5 / warm-950)
Palette w-56 | views (split with 1px divider) / BottomPanel h-52 | Inspector w-72
StatusBar      h-6, 11px (rail #dcd5cb / warm-950)
```
- Header (`components/chrome/AppHeader.vue:1-44`) runs left to right: logo (`i-carbon-flow-data` iolite + "KIR Editor"
  semibold sm), file icon buttons, compact selects, **a segmented view switcher** (labels are cut to 5 chars below 2xl),
  a spacer, a sync spinner, undo/redo with shortcut hints in their titles, an `@meta` checkbox, ghost
  `Check` and `Lower` buttons, the primary `Run` (whose icon becomes a spinner while busy), and the theme toggle.
- Segmented: `.kir-seg` is 1.5rem tall and 0.375rem radius. On, it has a surface fill, **iolite text** and
  `shadow 0 1px 2px rgb(0 0 0/.08)` (`AppHeader.vue:114-128`). Bottom tabs: on state is iolite text on
  `rgb(90 79 207/.08)` (`BottomPanel.vue:109-112`). Count badges are coral when errors exist, otherwise amber.
- `panel-head`: `h-8 px-3 border-b` with gem icon + `text-xs font-semibold` title + spacer + icon actions
  (`uno.config.js:79-80`). Palette and Inspector use `bg-warm-100 dark:bg-warm-950`.
- `input-field` here is denser than SSH's: `px-2 py-1 rounded-md text-xs font-mono`, with focus as an
  iolite border and no ring (`uno.config.js:77-78`).
- Palette (`PalettePanel.vue:1-58`) has a filter input ("filter nodes…"), 10px uppercase section titles,
  a 2-column grid of builtins, collapsible libraries with `runs`/`sig` chips, and a **`n→m` port count** on
  each node. Every item can be both clicked and dragged.
- Inspector empty state (`InspectorPanel.vue:10-18`) **teaches the interaction**: "Select a node to see
  its ports, types, hints and meta." / "drag from an output port to an input port of the same kind
  (control or data) to wire them; Del removes the selection." It then lists graph stats in mono.
- InspectorField commits on Enter or blur. Errors appear inline in coral 10.5px under a coral-bordered input
  (`inspector/InspectorField.vue`).
- Bottom panel: Problems shows a code in mono semibold, the message, and "line N". Clicking a problem
  reveals the line in the text view and opens a split if needed (`stores/ui.js:104-111`). Empty: sage check + "No problems.".
  Run: "(nothing printed)". Transport failure: "backend unreachable: …".
- StatusBar: file name in mono, error/warning counts with icons, "N nodes · M edges", `@use` list.
- **State in the URL**: `?view=&split=&data=&control=&lanes=&theme=` override saved prefs for one load and
  are not persisted (`stores/ui.js:1-6,89-97`). Theme preference is three-state (`system` default) (`:113-120`).
- CodeMirror theme (`styles/code.css:3-36`) maps KIR tokens onto gem shades: numbers sapphire, strings
  amber-shadow, builtins iolite, labels aquamarine, `@def` aquamarine-shadow, comments `#8f8880`. Selection is iolite 18%.
  Dark mode uses hand-lightened values.

---

## 3. KohakuSSHManager (Jul 2026): Element Plus admin app, Terrarium-classic

### 3.1 Stack
Vue 3.5, Pinia 3, vue-router (file routes), **Element Plus 2.13 used only for dialogs, tabs,
dropdowns and `ElMessage`**, axios, dayjs. UnoCSS with `presetAttributify`. Carbon + `ep` icon sets.
`uno.config.js:103`:
> "Data tables — warm-themed plain tables (Element Plus reserved for dialogs)"

Element usage counts: `el-dialog` ×8, `el-tab-pane` ×6, `el-dropdown` ×1, `el-tabs` ×1. **No `el-table`,
`el-button` or `el-input`.** Buttons, inputs and selects are thin wrappers (`KButton`, `KInput`, `KSelect`, `KField`)
over Uno shortcuts.

### 3.2 Tokens
- The gem palette and warm scale match the others exactly (`uno.config.js:22-76`). It has **no `--kt-color-*`
  preflight**, which suggests it predates that addition.
- **Older surface values** (`src/style.css:7-25`): light `--color-bg #f7f5f2` (= warm-50), border `#e0dbd4`,
  text `#3a3632`, muted `#8a8480`, faint `#b5b0aa`. Dark is identical to the others. The newer projects use the
  warmer, darker "stone" `#f2eee8` / `#2e2a26`. Root line-height is **1.6** here vs 1.5 in the October apps.
- **Element Plus is re-skinned through its CSS variables** (`style.css:90-155`): primary = iolite
  `#5a4fcf` with a hand-made light ladder (`-light-3 #8b83db`, `-5 #ada8e7`, `-7 #cec9f0`, `-9 #eeedfa`,
  `-dark-2 #4840a6`). `--el-bg-color`, fill, border and text all point at the warm surface vars. A dark block repeats them,
  with the mask at 0.5 light and 0.7 dark.
- `.kohaku-pulse`: an `amber-pulse` keyframe (opacity 0.4↔1, 1.5s) for pending and running badges (`:168-181`).

### 3.3 Shortcuts (roomier than the Oct apps) (`uno.config.js:77-114`)
| shortcut | value |
|---|---|
| `nav-rail` / `nav-item` | `w-14` icon rail, `w-10 h-10 rounded-lg` items. *Defined but unused*: the app uses a labelled 224px sidebar instead |
| `card` | `bg-white dark:bg-warm-900 rounded-xl border border-warm-200/60 dark:border-warm-700/60` |
| `card-hover` | `card` + `hover:border-warm-300/80 hover:shadow-sm transition-all cursor-pointer` |
| `btn-primary` | **`px-4 py-2 rounded-lg text-sm`** iolite → iolite-shadow |
| `btn-secondary` | warm-100 fill, warm-200/50 border |
| `btn-danger` | coral → coral-shadow |
| `btn-ghost` | `px-2.5 py-1.5 text-xs` **with a border** (unlike the Oct ghost) |
| `gem-badge` | `px-2 py-0.5 rounded-full text-xs font-medium` |
| `container-page` | `max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6` |
| `page-title` / `section-title` | `text-xl font-semibold` / `text-lg font-semibold mb-4` |
| `input-field` | `px-3 py-2 rounded-lg bg-warm-50 border-warm-200 text-sm`, focus iolite border |
| `table-wrap` / `th-cell` / `td-cell` | `rounded-xl` bordered wrapper. th `bg-warm-50 text-warm-500 font-medium px-3 py-2`. td `px-3 py-2 border-b border-warm-100` |
| `mono-chip` | `font-mono text-xs bg-warm-100 rounded px-1.5 py-0.5` |

### 3.4 Layout and components
- `AppShell` = `NavRail` (**w-56 labelled sidebar**, `bg-warm-100 dark:bg-warm-950`) + scrolling main
  (`components/layout/NavRail.vue:1-41`). The brand block is a server icon in iolite, "Kohaku SSH" semibold, and a
  10px uppercase "Access Manager". The active item is `bg-warm-200/80` with **iolite text**. The footer holds a theme
  toggle that reads "Light mode"/"Dark mode", the user with a 10px uppercase role, and a "Sign out" whose hover turns coral.
- Nav items are role-gated with a comment (`:56-72`).
- Page header pattern: `page-title` + one `text-secondary` subtitle sentence ("Fleet health, pending
  work, and recent activity."), with actions on the right (`AdminDashboard.vue:3-12`).
- **SectionCard** here has `title + subtitle + icon (iolite)` and a body padding of `p-4 sm:p-5`
  (`components/common/SectionCard.vue`). Compare Togeari's 40px bordered header.
- Status tiles: `grid-cols-2 md:grid-cols-3 xl:grid-cols-5`, a 12px uppercase label, a 2xl semibold value and a
  sub-line. Tiles become `router-link` with `card-hover` when they lead somewhere.
- **StatusBadge** (`components/common/StatusBadge.vue:11-16`) puts the whole status vocabulary in one map:
  > "aquamarine = active / online / succeeded / ok / managed; amber = pending / running / new / stale /
  > approved; coral = failed / error / offline / rejected / absent; warm = revoked / unmanaged /
  > no_owner / interrupted (neutral/inactive); sapphire = adopted (informational)"
  Light mode uses a `-light` fill with `-shadow` text. Dark uses `-shadow/30` with `-light` text. There is an optional dot, and pending/running states
  pulse. **Note: "good" is aquamarine here, but sage in Togeari, kir-graph and TPU.**
- **LoadingBlock** is a skeleton of `h-9 rounded-lg bg-warm-100` bars with staggered widths (100/92/96/88%),
  `animate-pulse` and `aria-busy`. **EmptyState** is a 3xl warm-300 icon, a sm message, an xs hint and an optional action slot
  ("No machines registered" / "Ask an admin to register machines.").
- **ConfirmModal** guards destructive actions **by requiring the user to type a word** ("Type “name” to confirm").
  The typed value resets every time the dialog opens, and the modal cannot be closed by clicking outside while loading.
- **CopyButton** swaps to an aquamarine check and "Copied" for 1.5s. On failure it shows "Copy failed — select and copy manually".
- Time: dayjs relative ("3 minutes ago") **with the absolute time in `title`**, "never" for null and "—" fallback
  (`utils/format.js`). Staleness is a computed `stale` badge after 30 min.
- Polling: `useActionPoll` checks every 1.5s until the action reaches a terminal state, one in flight at a time, and clears on unmount.
- Theme is applied before mount "so first paint matches the persisted preference" (`main.js:42`).
- Login is a centred `max-w-sm` card with the brand above it. It explains the admin path in prose with an inline
  `mono-chip`.

---

## 4. KohakuTPU docs-web (Nov 2026): a reading surface for hardware docs

### 4.1 Stack and contract
Vue 3.5, rolldown-vite, file routes, UnoCSS (`presetWind`/`wind3`, attributify, icons), `panzoom`, `mermaid`.
**Dark is the default**: `<html class="dark">` (`index.html:2`). `AGENTS.md` is a **design and authoring
contract for coding agents**. Key lines:
> "mirroring `KohakuHub`'s UI, styled in `KohakuTerrarium`'s gemstone design language."
> "`uno.config.js` and `src/style.css` are a faithful copy of KohakuTerrarium's. **Do not add
> colours, fonts or a size scale.**"
> "**Size tiers** — `kt-text-micro|caption|body|emphasis|title|h2|h1`. Never write `text-[13px]`
> or `text-sm` on chrome."
> "every colour must be written as a `light dark:` pair, exactly as the shortcuts do."
> "One gem per domain … A page declares its domain **once** … Never hardcode a gem name in a page."

### 4.2 Tokens
- Gem palette and warm scale are the standard ones, plus a **`gem` colour bound to CSS vars**
  (`uno.config.js:84-90`): `gem: { light: var(--gem-light), DEFAULT: var(--gem-main), shadow: var(--gem-shadow) }`.
  `bg-gem` and `text-gem` therefore retint per subtree.
- Domain → gem (`src/utils/colors.js:16-23`): framework→sapphire, tpu→amber, cpu→aquamarine,
  dsp→taaffeite, gpu→iolite. `gemVars(domain)` returns an inline style that rebinds `--gem-*`. The sidebar
  applies it per link, so **each nav dot carries its section's gem** (`App.vue:148-152,212,227`).
- Maturity → functional gems (`colors.js:39-54`, `StatusChip.vue`): shipped/measured = sage,
  building/planned/projected = amber, broken/retired = coral.
- A Uno `blocklist` exists because "Signal bit ranges collide with Uno syntax: `p[31:0]` is read as padding"
  (`uno.config.js:22-24`).
- Surfaces use the older `#f7f5f2` / `#3a3632` set, the same as SSH (`style.css:19-26`).

### 4.3 Typography: the semantic tiers, retuned for reading
`style.css:7-48`:
> "Semantic size scale - SINGLE SOURCE OF TRUTH. Chrome derives its font-size from a tier, never
> from a one-off text-[Npx]. **Terrarium's values are app-shell density; a reading surface needs
> body at 16px, so the tiers are retuned around that.**"

| tier | Terrarium (app) | TPU docs (desktop) | TPU docs (`pointer: coarse`) |
|---|---|---|---|
| micro | 0.65rem | 0.75rem | 0.8rem |
| caption | 0.75rem | 0.875rem | 0.9rem |
| body | 0.875rem | **1rem** | 1.0625rem |
| emphasis | 1rem | 1.125rem | 1.1875rem |
| title | 1.125rem | 1.375rem | 1.375rem |
| h2 | 1.25rem | 1.75rem | 1.625rem |
| h1 | 1.5rem | 2.5rem | 2rem |

(Terrarium values are from `KohakuTerrarium/src/kohakuterrarium-frontend/src/style.css:27-33`.) Touch devices
get a **bigger** body and **smaller** headings, which compresses the scale on small screens. The tiers are exposed both as Uno
rules (`uno.config.js:25-30`) and as plain classes. Root is 16px / 1.65, with `text-size-adjust:100%`
and `touch-action: manipulation`, which removes the double-tap zoom delay (`style.css:77-90`).

Doc shortcuts (`uno.config.js:114-130`):
- `doc-h1`: tier h1, semibold, `tracking-tight`, warm-900/100.
- `doc-h2`: tier h2, `mt-12 mb-4 scroll-mt-20`.
- `doc-h3`: tier title, `mt-8 mb-3`.
- `doc-p`: tier body, `text-warm-700 dark:text-warm-300 leading-7 my-4`, capped at the measure.
- `doc-link`: iolite, no underline, `underline-offset-2` on hover.
- `doc-fig`: `card my-6`.
- `doc-cap`: caption tier, warm-500, `px-4 py-2.5`, top border, `bg-warm-50 dark:bg-warm-950/40`.
- `doc-th`: semibold warm-600 with a stronger bottom border.
- `chip`: mono gem-badge on warm-100.

### 4.4 Layout and reading experience
- Shell (`App.vue:71-247`): an **`h-14` header** with a hamburger below md, a gem dot plus the "KohakuAccel" wordmark,
  section tabs as pills (active `bg-warm-200/80`), and a theme toggle. Below it, a **`w-64` sidebar** and the
  content pane. **Only the content pane scrolls**, while header and sidebar stay pinned (`style.css:97-101`). Route changes scroll
  the pane manually: "The window never scrolls, so the router's scrollBehavior cannot help here" (`App.vue:55-68`).
  Pages fade 0.2s between routes.
- Sidebar: a sticky search box ("Search pages…", focus border `gem`), then a flat result list with section labels.
  The empty result reads "No pages match “q”.". Without a query, the tree is section → collapsible sub-topic → page. **The group containing
  the current page opens itself** ("so a deep link always shows its neighbours"). Children hang off a
  left border rule with a 1.5px gem dot.
- **The nav is derived from the file routes** (`site.js:1-11`): "Hand-maintaining this list is how a
  nav entry once pointed at a page that did not exist, which renders as a blank pane and reports
  nothing anywhere."
- **Measure**: `--doc-measure: min(78ch, 100%)` covers "One measure for prose AND figures. A diagram wider
  than the column it explains reads as a separate artefact" (`style.css:28-30`). `wide` figures break
  out symmetrically using container query units: `width: min(72rem, calc(100cqw - 4rem)); margin-left:50%;
  transform: translateX(-50%)`. The comment explains why: "vw ignores the sidebar, so a 1200px window spilled the figure 96px
  off BOTH edges" (`style.css:154-173`).
- **DocPage header** (`components/DocPage.vue`) stacks a gem dot, the domain as a micro uppercase semibold
  label, and a StatusChip. Below come the `doc-h1` title, a summary in the emphasis tier (`max-w-[72ch]`), and the source path in micro mono
  faint, all above a bottom border. The page has `pb-24`.
- **Callout** (`components/Callout.vue`) has a **4px left colour bar** with an icon and label. Kinds: note=sapphire,
  rule=iolite, **trap=coral**, measured=sage, open=amber. The body is warm-600 body tier, `leading-6`, inside a
  `rounded-xl` warm-50/warm-900 box.
- **Fig + zoom** (`components/Fig.vue`). Inline pan needs **Ctrl/Alt/⌘ held**, so the page still
  scrolls (`beforeMouseDown`, `:25`). A reset button sits in the top-right corner. Fullscreen (Teleport) offers drag to pan, wheel
  to zoom, `0` fit, `1` actual size, `+`/`-`, `Esc`, a live zoom % in mono, and `cursor-grab`. The drawing is laid out at its
  viewBox size so that "100 % is the size the page renders it at".
- Diagrams are drawn in their own SVG components (`BlockDiagram`, `WaveTrace`, `BitField`, `StateMachine`,
  `LaneGrid`, `StepPlayer`, `SpecTable`, `ResourceBars`). The `.dgm` classes inherit the theme via
  `currentColor` and `--gem-*`, so "one class flip retints every figure on the site" (`style.css:175-219`).
  Accent boxes fill with `--gem-light` and use a 1.5px `--gem-main` stroke. In dark mode they become `color-mix(gem 22%, transparent)`.
- **BlockDiagram router rules** are written as hard rules (`AGENTS.md`, `BlockDiagram.vue:44-51,134-138`):
  no overlapping wires, no wire along a box edge, every arrow meets its box at a right angle, lanes at least
  `SEP=10`px apart, `CLR=12` clearance around boxes, bends and crossings penalised (`BEND=14`, `CROSS=45`),
  and any unavoidable crossing drawn as a **5px jump arc**. A tag chip bar filters the diagram: click dims a tag, double-click shows only that tag, and
  "Dimming never re-routes, so the layout … stays what you audited."
- **WaveTrace** replaces ASCII timing tables. `variant: broken|fixed` tints the frame `coral/40` or `sage/40`.
  The name column is sticky. Text is 13px mono. "repeats merge visually" (`WaveTrace.vue:1-40`).
- **StepPlayer**: prev / play-pause / next as `nav-item w-7 h-7`, an `accent-iolite` range scrubber, and a mono
  tabular `i / n` counter.
- **Content rules from AGENTS.md** that apply beyond docs:
  - "Prose is the caption to the picture, not the other way round. If a paragraph restates the
    diagram, delete the paragraph."
  - "Traps get their own `<Callout kind="trap">`, titled with the *claim*, not the topic … A reader
    scanning titles learns the design." "Every trap says what the symptom looks like."
  - "Every number carries its origin." Projections are marked `PROJECTED`.
  - The quality bar: "could someone build the thing after reading it."
  - The fixed page order: what it owns (≤4 cards) → what it costs (diagram + knobs table) → protocol as
    broken/fixed waveforms → bit layout → message table → proofs → deployment → conventions → "what this does
    not own".
- Verification is scripted: `overlap.mjs`, `crossings.mjs`, `shots.mjs`, `peek.mjs` (Playwright), and the build
  must produce "Zero UnoCSS 'unmatched utility' warnings, zero Vue warnings."

---

## 5. Microcopy and comment voice (shared across all four)
- **Doc comments define the thing in one declarative sentence and then give its rules.** No "This
  component…" filler: "A thin fill gauge: `value` in 0..1 (null draws empty), its label to the
  right." (`FillBar.vue`), "A command behind a confirm step: what changes (old to new), the command
  it sends, then the machine's answer or its error." The colon-heavy, article-light style also shows up
  in UI tooltips.
- Comments explain *why*, often by naming a past failure: the pane-cursor note, "a load slower than the 2 s tick
  used to be dropped every time", "vw ignores the sidebar…", "That has already cost an hour once."
- UI text is sentence case and terse. Status words are lowercase. Empty states are full sentences with a period.
  Separators are `·`. `→` marks flow. `—` marks missing values. `…` ends placeholders.
- Buttons are verbs: Apply, Cancel/Close (Close once the action is done), Check, Lower, Run, Refresh, Reload, Approve,
  Reject, Sign out.

---

## 6. Glance projects: not part of the Kohaku design language
- **KohakuGBC `scripts/demo/compare.html`** (2026-11-08): IBM Plex Sans/Mono/Condensed, cool greys (`--bg #f4f5f7`, ink
  `#1a1e24`), accent `#2a55b8`, `prefers-color-scheme` with a `data-theme` override, 16px safe-area gutters, and
  `<meta name="claude:viewport-fit-sides">`. This is a Claude-artifact-style generated report, not his system.
  Two things carry over anyway: `font-variant-numeric: tabular-nums` on tables, and uppercase 12px muted table headers.
- **KohakuHPO `webpage`** (2026-07): a dark slate/cyan Tailwind-default palette (`#0f172a`, `#22d3ee`,
  `#a855f7`), system fonts, `--maxw 880px`, a TOC shown at ≥1120px, KaTeX. A research explainer page with no gems.
- **Kohaku-NAI `client.css`**: 41 lines of Gradio flex fixes, plus `footer {display:none}`.
- Conclusion: **the gem system applies to Kohaku's Vue product UIs.** One-off research pages and generated reports
  use other styles.

---

## 7. Cross-project comparison vs KohakuTerrarium

### 7.1 Shared DNA (consistent in all four Vue projects)
1. **The exact palette.** Seven gems × `light / DEFAULT / shadow` plus `warm-50…950`, byte-identical in
   all four `uno.config.js` files and in `kir-graph/tokens.css`. Nobody added a hue. TPU forbids it outright.
2. **Iolite = primary, selection and focus.** It is used for primary buttons, the active nav/segment text, the selected row
   (9%), the selected node ring, focus borders, scrubber accents, brush selection fill and the dashed connection being drawn.
3. **Status trio sage/amber/coral, always paired with an icon or dot.** Light mode uses a `-light` fill with `-shadow` text. Dark mode uses
   a `-shadow/30–40` fill with `-light` text, or a 10% gem fill with a 40% border.
4. **The warm dark mode is identical everywhere**: bg `#1a1816`, surface `#252220`, alt `#1e1c1a`,
   border `#3d3835`, text `#e8e0d8`. Dark mode is class-based (`html.dark`), follows the system until the user chooses,
   persists to localStorage inside try/catch, and is applied before first paint.
5. **Inter + JetBrains Mono.** Mono is used *semantically* for numbers, ids, paths, code, hashes and graph labels,
   always tabular for figures.
6. **UnoCSS shortcuts as the component layer**: `btn-primary/ghost/icon`, `chip-*`/`gem-badge`,
   `section-title`, `card`, `input-field`, all with `light dark:` pairs. Carbon icons via `i-carbon-*` with
   `scale 1.2` and `inline-block; vertical-align: middle`.
7. **Base reset**: `* {margin:0;padding:0;box-sizing:border-box}`, unstyled `button`, `select {font:inherit}`,
   6px (or 8px) thin scrollbars with a transparent track and a `--color-border` thumb.
8. **Rounded geometry**: `rounded-lg` (0.5rem) controls, `rounded-xl` (0.75rem) cards, `rounded-full` chips,
   1px warm borders at 60% alpha. Shadows are nearly absent (`shadow-sm` on hover or the active segment). Floats get one
   soft 6/20 shadow.
9. **Segmented controls** on a `warm-200/50` track, with the active segment raised in surface colour plus a tiny shadow.
10. **Persisted, resizable, collapsible panels**, with pointer-event drags and double-click to reset.
11. **Empty states with a reason, errors in a coral chip/box showing the raw message, spinners only for actions.**
12. **Screenshot-driven verification in both themes** (Togeari `shots.mjs`, kir-graph `inspect/shots.mjs`,
    TPU `shots.mjs`), and in Togeari a phone viewport too.

### 7.2 Differences
| axis | Terrarium (baseline) | SSHManager (Jul) | TPU docs (Nov) | Togeari / kir-editor (Oct) |
|---|---|---|---|---|
| light bg / text | `#f2eee8` / `#2e2a26` "stone" | `#f7f5f2` / `#3a3632` (older) | `#f7f5f2` / `#3a3632` | `#f2eee8` / `#2e2a26` |
| default theme | system | system | **dark** | system |
| component lib | Element Plus + custom | EP *only* for dialog/tabs/dropdown/message, re-skinned via `--el-*` | none | **none** (Vue Flow, uPlot, CodeMirror) |
| size scale | `kt-text-*` tiers | Tailwind `text-xs/sm/lg/xl` | `kt-text-*` retuned to 16px body | **arbitrary px** 10–15, 22 (dense) |
| button size | – | `px-4 py-2 text-sm` | same | **`h-7 px-3 text-xs`** |
| ghost button | – | bordered | – | borderless |
| surfaces | v2 five-level system in session-v2 | flat `card` on `warm-50` | flat `card` | v2 five levels + `--kt-color-*` vars |
| nav | rail + tabs | 224px labelled sidebar | h-14 top tabs + 256px tree | resizable rail ↔ 48px monogram strip + fused tabs |
| "good" colour | sage | **aquamarine** (StatusBadge) | sage | sage (aquamarine = "service"/categorical/running) |
| loading | – | skeleton bars `animate-pulse` | – | streamed partial data, previous picture kept, no skeleton |
| destructive confirm | – | type-the-word guard | – | diff table old → new + raw command + answer |
| charts | – | none | SVG figures | uPlot + validated categorical palette |
| line-height | – | 1.6 | 1.65 | 1.5 |

### 7.3 How the design language changed (Jul → Nov 2026)
1. **Element Plus is being dropped.** In July it was confined to dialogs. By October it is gone, and every
   control is a Uno shortcut or a small `.kt-*` CSS class. Expect new work to have no EP dependency.
2. **The colour system moved from Tailwind class names to CSS variables.** `--kt-color-*` preflights (Togeari, kir-editor),
   `--kg-*` with "No colour is written outside this file" (kir-graph), and `--gem-*` scoping (TPU) all point the same way.
   `color-mix(in srgb, <gem> N%, transparent)` replaces `/10`-style alpha utilities in hand CSS.
   Theming became **semantic and scoped** (by domain, by kind, by job).
3. **Semantics over decoration.** Each gem now has a *meaning per domain*: type colours in KIR, construct
   colours for regions, domain gems in the docs, phase colours in Togeari. "Heat is a magnitude, not a status: its own hue."
   Status colours are reserved and never reused for identity.
4. **Dataviz rigour.** Two categorical hues at most, small multiples instead of a third hue, CVD validation in both modes,
   per-mode tuned hexes, no default chart legends, shared crosshairs, brush-to-range.
5. **Encoding by shape, not colour alone.** Hollow vs thin wires, chevron vs round pins, struck-through
   off-toggles, dashed back-edges, icons on every status.
6. **Denser app chrome, larger reading type.** Apps went to `h-7` controls, 11px chips and 10px section
   titles. The docs went the other way, to a 16px body and 78ch measure. One system, two density presets, and the retune is
   documented as deliberate.
7. **The surface model matured** from a flat "card on warm-50" (July) to the **five-level v2 surfaces**
   (chrome/canvas/panel/card/float) with fused tabs, a darker stone frame around a near-white canvas in light mode,
   and shadowless dark cards.
8. **Performance is treated as UX.** Partial frames at rAF, `shallowRef` for samples, min/max per-pixel
   decimation, render virtualisation over 600 nodes, LOD by zoom, no re-layout on overlay ticks, and commit
   messages that report main-thread milliseconds.
9. **Explicit phone mode** (`useCompact` at 767px: drawer, stacked folding panes, icon-only inactive tabs)
   replaces implicit Tailwind breakpoints alone. Touch tiers (`pointer: coarse`) and `touch-action: manipulation`
   show up in the docs.
10. **Specs for agents.** `AGENTS.md` and the long comments are written as *contracts*: what must never be
    done, why (usually a past bug), and the scripts that check it. The design language is held stable by
    rules and audits.

### 7.4 Implications for the skill (recommended defaults, newest-first)
- Use the palette verbatim. Emit the Uno theme colours as `--kt-color-*` vars and write hand CSS with `color-mix`.
- Use the stone light surfaces (`#f2eee8` bg, `#2e2a26` text, `#e5dfd7` border) and the identical warm dark mode, plus the
  light-mode `warm-400/500` contrast fix.
- For app UIs, use the v2 five-level surfaces and dense shortcuts (`h-7` buttons, 11px chips, 10px uppercase
  section titles, `num` for every figure). For reading UIs, use `kt-text-*` tiers at 16px body and a 78ch measure.
- Iolite for focus and selection. Sage/amber/coral reserved for status and always paired with an icon. Pick a gem per domain
  through a CSS var, never hardcoded in pages.
- No Element Plus in new projects. If it is unavoidable, re-skin it through `--el-*` vars as SSHManager does.
- Write empty states as positive sentences, tooltips as full explanatory sentences, `—` for missing values, `·` as separator.
- Put mutations behind a confirm step that shows the diff. Put destructive deletes behind a typed word.
- For canvas work, follow §2.3: zoom 0.03–2.5, 22px dot grid, 160×110 minimap, LOD at 0.22/0.5, 10px round data
  pins and chevron control pins, hollow control wires, iolite selection ring, Delete ignored in inputs,
  edits emitted as events.
