# Data views, charts, node/canvas editors

If a general `dataviz` skill is available, use it for chart *method* (form choice, accessibility, a values/table view for charts that carry decisions); this file takes precedence on palette, density and look: keep the Kohaku chart colours below and the quiet card styling rather than that skill's placeholder palette. In dashboards the adjacent table (or a "values" toggle on the card) is the table view.

## Chart colour discipline

From Togeari's `palette.js`, "chart colours, by the job each does":
- **Categorical (identity): iolite, then aquamarine.** The pair separates under colour-vision deficiency in both modes. A third series is drawn as a small multiple, never a new hue.
- **Status is reserved**: good sage, warning amber, bad coral, always with an icon. Never use a status colour for identity.
- **Magnitude/heat** is its own hue (sapphire), "a magnitude, not a status".
- Phases of one process: neutral stone (always labelled) → iolite → aquamarine.
- Chart hexes are tuned per mode, not the raw gems (`--kt-chart-*` in `tokens.css`):
  - light: cat `#5A4FCF #1F9A80`; good `#3A8A55`, warn `#B87A00`, bad `#C24A4A`, idle `#A09A92`; axis `#77706a`, grid `rgba(36,33,29,.07)`
  - dark: cat `#8076E6 #25A88E`; good `#6DB585`, warn `#D9A23A`, bad `#E07A7A`, idle `#6A645F`; axis `#8a8078`, grid `rgba(255,255,255,.06)`
- Many-run experiment views (unbounded series): deterministic colour per series id (hash → hue with lightness/saturation guard rails) so a run keeps its colour across sessions; cap visible series (~10) and let users override per series.

## Chart conventions

- Library: **uPlot** for live time series (fast, small), **Plotly** (`scattergl`) for analysis views with zoom/hover-heavy needs. Either way: transparent backgrounds so the card shows through; the library's own legend/modebar hidden and redrawn in tokens.
- Lines 1.5–2px, no point markers; optional area fill at ~12% (`${color}1f`) and a min/max band at ~13%.
- Legend only when there are 2+ series; custom legend with 8×8 swatches (2px radius).
- Tooltip (`float` surface, 11px): swatch · name · value right-aligned `num`; unified-x hover with a crosshair; never truncate series names.
- **Shared crosshair** across charts on one page (`cursor.sync` / hover sync).
- **Brush to range**: drag on a chart sets the dashboard-wide time range; double-click goes back one zoom; a segmented preset (`1m 5m 15m 1h 6h all`) sits in the header.
- y-axis 8% headroom; axis font 11px Inter; event marks as dashed vertical rules listed in the tooltip.
- Keep zoom/pan across data updates (Plotly `uirevision`, uPlot `setData` without rebuild); rebuild only when series or theme change; re-render on theme toggle.
- Downsample adaptively (~5000 points per series) and min/max per pixel column in sparklines so spikes survive.
- Smoothing (training curves): EMA by default (debiased ramp), raw line underneath at 30% alpha and half width, hover shows `smoothed (raw)`.
- **NaN/±Inf are shown, not dropped**: markers on a hidden [0,1] secondary axis (NaN circle at top, +inf ▲, −inf ▼, white 1.5px outline); split the line at bad values instead of interpolating.
- Honest tooltips: half-open bins `[start, end)`, cumulative `count (pct%)`, units always.
- Empty chart: "No data in this range" inside the plot area; keep axes.
- Small inline encodings beat charts in tables: fill bars (6px track + mono % in a fixed column), queue depth as a row of 10×10 squares, stacked phase bars (2px gaps, only outer ends rounded), sparklines 96×22.
- Respect reduced motion; no chart entrance animations; width transitions ≤300ms for fill bars only.

## Dashboards

- A dashboard is a set of SectionCards and StatTiles in a grid (see `components.md`); headline numbers mono tabular.
- System views can be drawn as a schematic instead of a grid of cards: columns of blocks with arrows showing flow, each block carrying its own mini-stats and a one-line explanation of how it behaves.
- Every live mutation (changing a running system's setting) goes through a confirm step showing old → new, the exact command, then the answer or error.
- Polling every 1–2s pauses while hidden; partial data commits per frame; the previous picture stays until new data replaces it.

## Node / canvas editors (Vue Flow / React Flow style)

| concern | convention |
|---|---|
| zoom | 0.03–2.5 |
| background | dot grid, 22px gap, ~1.1px dots in a warm grid colour |
| controls | bottom-left, re-skinned with 1px border, 0.5rem radius, surface fill |
| minimap | 160×110, pannable/zoomable, rounded; optional (off in focused views) |
| level of detail | far (< 0.22–0.45): dot + big name, wires 3px · mid (< 0.5–0.8): name + status line, no ports/badges · near: everything |
| virtualisation | render only visible elements above ~600 nodes |
| selection | iolite border + `0 0 0 2px iolite/45%` ring; hover border iolite 60%; related items iolite/60; unfocused items opacity .25, edges .12 |
| ports | data pins: 10px circles, 2px border in the type colour; control pins: chevrons (`clip-path`); 6px invisible hit ring; ports/menus appear on hover/selection |
| wires | orthogonal with rounded corners; control vs data distinguished by shape (hollow double line vs thin single line), not colour alone; back-edges dashed `7 4`; 12px invisible hit path; labels 10px mono with a 3px halo in the background colour; the connection being drawn is iolite dashed `6 4` |
| active flow | marching dash (~0.9s) only on wires that are actually active; node/edge event motion one-shot (700–900ms); nothing animates when idle |
| node card | 8px radius, surface fill, strong border, soft shadow; head = 4px accent stripe + the accent's light tint; mono titles |
| regions/groups | 10px radius, 1.5px border at ~38% of the construct colour, 5% fill, mono 11px head |
| keyboard | Delete/Backspace on the canvas (ignored in text fields), Ctrl+Z / Ctrl+Shift+Z, double-click to open/enter |
| status | per-node glyph + colour (busy ● aquamarine, idle ○ amber, paused ‖ amber, stopped ■ warm, error ! coral) |
| layout work | an on-canvas chip "laying out N elements" with spinner; coral chip on failure; overlays never re-layout; positions persist across edits |
| destructive | confirm inline in a dock card, not a modal |

- Library API: the canvas component never mutates the document; it emits `connect / delete / drop / edit / move` events and the host applies them. Accept `theme: "inherit" | "light" | "dark"` and a slot for legends/toolbars inside the theme.
- Type colours map gems to domain types consistently (e.g. int sapphire, float aquamarine, str amber, bool coral, list taaffeite, dict sage, control iolite) with hand-brightened dark variants.
- Inspector empty state teaches the gestures; palette items can be both clicked and dragged; show `n→m` port counts.
- Code editors (CodeMirror/Monaco) get a gem-mapped theme: numbers sapphire, strings amber-shadow, builtins iolite, labels aquamarine, comments `#8f8880`, selection iolite 18%.

## Figures in docs

- Diagrams are SVG components that inherit `currentColor` and `--gem-*`, so one class flip retints every figure.
- Fixed router rules for block diagrams: no overlapping wires, no wire along a box edge, arrows meet boxes at right angles, lanes ≥10px apart, 12px clearance, unavoidable crossings drawn as a 5px jump arc. Tag filters dim, never re-route.
- Pan/zoom figures: inline pan needs a modifier key held (so the page still scrolls); fullscreen viewer with drag, wheel, `0` fit, `1` actual size, `+/-`, Esc, live zoom % in mono.
- Timing/protocol: waveform components with broken/fixed variants (coral/40 vs sage/40 frame) instead of ASCII tables.
