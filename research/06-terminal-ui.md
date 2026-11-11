# 06 — Terminal / CLI UI design language

Slice: Kohaku's terminal UI work and how it maps to his web language.
Primary sources:

- `KohakuTUI` (Rust engine `src/kohakutui-rust/`, Python SDK `src/kohakutui/`, `docs/`), v0.2.0, 2026-11-07. The repo has a single squashed commit (`7e16346 chore(release): 0.2.0`), so the reasoning comes from code comments and docs, not from history.
- `KohakuTerrarium/src/kohakuterrarium/builtins/ktui/` (KT's KohakuTUI front end, commits from 2026-11-06 on)
- Older KT terminal front ends, useful as a record of how the style changed: `builtins/cli_rich/` (prompt_toolkit + Rich, inline), `builtins/tui/` (Textual, full screen), `builtins/kt_ui/fallback.py` (plain text)
- Quick look at CLI output in Togeari, KohakuBench, KohakuEngine and KohakuBoard

Paths below are relative to `<clones>/`.

---

## 0. TL;DR: the rules

1. **The terminal uses the same gem palette as the web, through semantic roles.** Components ask for roles (`accent`, `tool`, `agent`, `running`, `attention`, `danger`, `ok`, `muted`, `faint`), never raw colours. Roles map to gems: accent/user = iolite, assistant/running = aquamarine, tool = sapphire, agent = taaffeite, attention/code = amber, danger = coral, ok = sage.
2. **On dark backgrounds the gems are lifted for contrast.** The terminal uses brighter versions of each gem on dark (iolite `#9D94F0`, not `#5A4FCF`). The web's light/default/shadow triads are also kept as `gem-light`, `gem-default` and `gem-shadow`.
3. **Neutrals are warm stone greys,** the same family as the web: text `#E8E0D8`, muted `#8A8078`, faint `#5A5550`, border `#3D3835` (dark scheme).
4. **One glyph per status, and the glyph replaces the word.** `✓` ok, `✗` error, `○` interrupted, `⚙` waiting/busy, braille spinner while running. The status text is hidden when the icon already says it.
5. **Chrome is thin, single-line and rounded.** Boxes use `╭─╮ │ ╰─╯`; rules use `─`; column separators use ` │ ` and `─┼─`. Heavy box-drawing is never used, except `━` for the filled part of a bar or slider.
6. **Hints are muted, `·`-separated, and verb-led.** For example `↑↓ move · enter select · esc cancel` and `q quit · ctrl+t inline · pgup/pgdn scroll`. The hint names only the keys of the focused area.
7. **Inline-first.** Finished output goes to the terminal's real scrollback. Only what is happening now (the live region) and the input are redrawn. Full screen is an opt-in mode (`ctrl+t`) built from the same code.
8. **Nothing traps the user.** Dialogs dock where the input is, typing keeps working, esc always gets out, and a click elsewhere is never swallowed.
9. **Animation only means "work is happening".** The braille spinner runs at 80 ms per frame only while a node is unsealed and `running`. When nothing animates, the engine sleeps (it wakes at least every 500 ms). This is the terminal version of the web's "no continuous decorative animation" rule.
10. **Degrade gracefully, step by step:** truecolor, then the nearest xterm-256 colour, then the `terminal` scheme (the terminal's own 16 colours, no background bands), then plain stdout (no colour, links as `text (url)`, dialogs closed with reason `no_tty`). Layouts collapse on narrow widths instead of breaking.
11. **Density:** one line per item. Numbers are compacted (`1.2k`, `3.4M`, `m:ss`). Long runs of similar items fold into one summary line (`✓ 5 tool calls  read ×2, grep, bash ×2  ▸`).
12. **No emoji in his recent terminal output.** The older KohakuBoard CLI (Jan 2026) uses 🚀📁❌✅. Everything after mid-2026 uses Unicode geometric glyphs and plain text instead.

---

## 1. Colour: the gem palette in the terminal

### 1.1 Palette source (`KohakuTUI/src/kohakutui-rust/text/theme.rs:133-164`)

The triads are `light / default / shadow`. They match the web's `utils/colors.js` (`iolite: { light: "#DDD0F0", main: "#5A4FCF", shadow: "#312A7A" }`, at `KohakuTerrarium/src/kohakuterrarium-frontend/src/utils/colors.js:10`).

```rust
const GEMS: &[(&str, &str, &str, &str)] = &[
    ("iolite", "#DDD0F0", "#5A4FCF", "#312A7A"),
    ("sapphire", "#D6E3F8", "#0F52BA", "#082567"),
    ("taaffeite", "#E8D5ED", "#A57EAE", "#6B4670"),
    ("aquamarine", "#D4EDE8", "#4C9989", "#1B6B5A"),
    ("amber", "#F5E6C8", "#D4920A", "#8B5E00"),
    ("coral", "#F5D5D5", "#D46B6B", "#8B3A3A"),
    ("sage", "#D5E8DA", "#5A9E6F", "#3A6B48"),
];

/// Gem glyph colours for a dark background: the web's DEFAULT shade, lifted for contrast.
const DARK_GEMS: &[(&str, &str)] = &[
    ("iolite", "#9D94F0"), ("sapphire", "#6F9BE6"), ("taaffeite", "#C9A4D2"),
    ("aquamarine", "#73C2B1"), ("amber", "#E6A92A"), ("coral", "#E48A8A"), ("sage", "#7CC493"),
];
```

The web's dark mode uses the `-light` shade for text and `color-mix` for tints. The terminal has no alpha blending, and the `-light` shades are too pale for small glyphs, so it uses this separate "lifted default" set. **Rule for the skill:** for small coloured glyphs on a dark background, use a mid-lightness version of the gem. Do not use the web's pastel `-light` shade.

### 1.2 Role → gem (`theme.rs:155-166`)

| Role | Gem | Used for |
|---|---|---|
| `accent` | iolite | focus, prompt mark `›`, selected items, progress fill, sparkline, tool-cell icon `◆` |
| `user` | iolite (bold) | user message icon `›` |
| `assistant` | aquamarine | assistant icon `●` |
| `tool` | sapphire | tool-cell titles (commands, steps) |
| `agent` | taaffeite | sub-agents / delegated work (`◆ name … background sub-agent`) |
| `running` | aquamarine | spinners, "working…", "moved to background" |
| `attention` | amber | warnings, waiting, interrupted `○`, tab badges, shell-mode composer border |
| `danger` | coral | errors `✗`, NaN gaps in sparklines/charts |
| `ok` | sage | `✓`, success toasts |
| `code` | amber | inline code |

This matches the web status-by-colour language (running = aquamarine). One difference: **"idle/ready" in the TUI rail is `●` in sage (`success`), not amber** (`ktui/chrome.py:114-120`). Amber `!` is reserved for "waiting on you" (a pending approval):

```python
def _status(self, entry):
    if any(p.view is entry.view for p in shell.interactions.items):
        return "!", "warn"
    if shell.is_busy(entry):
        return "⚙", "info"
    return "●", "success"
```

Also note that `info` is an alias for `accent` (iolite) in `theme::tone` (`theme.rs:431-442`). Busy rail entries are therefore iolite `⚙`, and the aquamarine spinner is reserved for the actively animating status row. Legacy aliases kept in `tone()`: `info→accent`, `dim→muted`, `success→ok`, `warn|warning→attention`, `error→danger`.

### 1.3 Neutrals: warm stone (`theme.rs:184-232`)

| Token | kohaku-dark | kohaku-light |
|---|---|---|
| text | `#E8E0D8` | `#2E2A26` |
| muted | `#8A8078` | `#6C655D` |
| faint | `#5A5550` | `#8F8880` |
| border | `#3D3835` | `#E5DFD7` |
| selection_fg / bg | `#DDD0F0` / `#312A7A` (iolite light on iolite shadow) | `#312A7A` / `#DDD0F0` (inverted) |
| user_bg (band behind the user's own messages) | `#2A2640` | `#EEE9F7` |
| focus_bg (tint of the dialog area that has the keys) | `#1E1A2E` | `#F4F0FA` |

Three text tiers (`text` / `muted` / `faint`) are the terminal's version of semantic size tiers. A terminal has one font size, so hierarchy comes from **colour tier and bold**. Titles are bold; details, stats and trailers are muted; hints and separators are faint.

The selection and focus tints are iolite-tinted darks (`#312A7A`, `#2A2640`, `#1E1A2E`). These are the web's "iolite at low opacity" washes, pre-blended because the terminal cannot blend.

### 1.4 Schemes (`docs/themes.md`, `theme.rs:15-24`)

`kohaku-dark` (default), `kohaku-light`, `terminal`, `colorblind-dark`, `colorblind-light`, `solarized-dark`, `solarized-light`, `tokyo-night`. Every scheme sets the seven gem names, so roles still resolve. Third-party schemes are mapped onto gem slots (for example Tokyo Night iolite = `#BB9AF7`, coral = `#F7768E`).

- **Colourblind** (`theme.rs:201-205`, `225-229`) keeps the Kohaku layout but swaps in Okabe–Ito colours: sage → `#56B4E9` (blue), coral → `#E69F00` (orange), amber → `#F0E442`. Doc rationale: "success is blue and errors orange, so they never depend on telling red from green." It is a first-class built-in scheme, not an afterthought.
- **terminal** (`theme.rs:271-292`) uses only ANSI 16 colours: iolite=Magenta, sapphire=Blue, taaffeite=LightMagenta, aquamarine=Cyan, amber=Yellow, coral=Red, sage=Green, muted/faint/border=DarkGray, text=Reset. `user_bg`/`focus_bg` = Reset, with the comment `// inherit the terminal's background: no band`. **Rule:** where only basic colours are available, drop background fills entirely rather than guess.

### 1.5 Overrides

`app.set_theme("kohaku-dark", {"accent": "#ff8fb1", "tool": "sapphire"})`. An override value can be a hex code or another palette or role name (`theme.rs:303-313`). A component's `tone` prop takes the same vocabulary: a role, a gem name, or `#rrggbb`.

### 1.6 Truecolor detection and fallback (`theme.rs:78-130`)

- Truecolor if `COLORTERM` contains `truecolor`/`24bit`, `WT_SESSION` is set (Windows Terminal), or `TERM_PROGRAM` ∈ {vscode, iTerm.app, WezTerm, ghostty}.
- Otherwise every RGB colour is reduced to the **nearest xterm-256 entry**: the 6×6×6 cube `[0,95,135,175,215,255]` or the 24-step grey ramp, whichever is closer by squared RGB distance. This means warm greys land on the grey ramp and gems land on cube colours.
- `truecolor=True/False` forces either mode.

### 1.7 Gaps in palette use (worth knowing, not copying)

- `widgets/chart.rs:18-25` and `widgets/bars.rs:19-26`: series colours are raw ANSI `Cyan, Magenta, Yellow, Green, Blue, Red`, not themed gems. This is the one place where the role system is bypassed.
- Legacy Textual TUI (`builtins/tui/widgets/blocks.py:45-51`, `bus_blocks.py:13-18`) used `#E74C3C` (flat-UI red) for "coral/danger" instead of the real coral `#D46B6B`. The legacy TUI also used running = amber and done = iolite. ktui fixed both and lined up with the web (running = aquamarine, ok = sage, danger = coral).

### 1.8 How the status colours changed

| Surface | Era | running | done | error | user | assistant |
|---|---|---|---|---|---|---|
| `cli_rich/theme.py:50-62` | Apr–Oct 2026 | `yellow` | `green` | `red` | `cyan` | `magenta` |
| `tui/` (Textual) | 2026 | amber `#D4920A` | iolite `#5A4FCF` | `#E74C3C` | — | — |
| ktui / KohakuTUI | Nov 2026 | aquamarine (spinner) | sage `✓` | coral `✗` | iolite `›` | aquamarine `●` |
| KT logging `utils/logging.py:39-45` | all | — | INFO `\033[92m` green | ERROR `\033[91m` red; WARNING `93m` yellow; DEBUG `90m` gray; CRITICAL `95m` magenta | | |

Over time the terminal moved from ANSI names to the same semantic gem roles the web uses. Plain log lines still use classic ANSI level colours, and only when `isatty()` is true (`logging.py:49-66`). On Windows, ANSI is enabled through `SetConsoleMode(..., 7)`.

---

## 2. Glyph vocabulary

### 2.1 Status and role icons (`widgets/cell.rs:92-112`, `view/render.rs:520-541`)

| Glyph | Meaning | Tone |
|---|---|---|
| `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` | running (braille spinner, 80 ms/frame; `theme.rs:445-447`) | running (aquamarine); `Status` widget uses accent |
| `⚙` | waiting… / busy | attention (amber); rail busy = info (iolite) |
| `○` | interrupted | attention |
| `✓` | ok / done / success / `current` item in a picker | ok (sage) |
| `✗` | error / failed | danger (coral) |
| `!` | toast warn; rail "waiting on you" | attention |
| `ℹ` | toast info | accent |
| `›` | user cell; picker cursor; prompt mark | user/accent (bold) |
| `●` | assistant cell; tab status dot; rail idle | assistant / tone |
| `◆` | tool cell; sub-agent | accent / agent |
| `•` | system cell; secret-input mask | muted |
| `▸` / `▾` | folded / open (always muted, two spaces before) | muted |
| `◂` / `▸` | pane collapse direction on its title/divider; `◂` also marks "current" in the rail | faint |
| `‹` / `›` | tab strip scrolled off left/right | faint |
| `↑` / `↓` | scroll position in a pane; `↓ N new · ctrl+end` | faint / selection |
| `└` | sealed cell trailer (`  └ 1.2s`) | muted |
| `⎿` | folded summary gutter (`  ⎿  3 matches  (ctrl+o to expand)`) | muted |
| `⏵` | moved to / running in background | running |
| `■` | stop action (`■ stop`); legend swatch in charts | warn / series |
| `×` | closable tab; count multiplier (`read ×2`) | faint |
| `☐ ☑` | multi-select / checkbox | muted / ok |
| `★ ☆` | rating field | accent / faint |
| `[⎘ name]` | attachment chip | accent |
| `·` | universal separator; also NaN gap in sparklines (danger) | faint/muted |
| `…` | truncation (always one char, never `...`) | — |
| `+ add` | "create" rows in lists | muted/info |
| `‹ back` | back action | info |

KT-specific additions: `ui_map.py:51-58` tone icons `neutral •`, `info ℹ`, `tip ✦`, `success ✓`, `warning ⚠`, `danger ✗`; quote bar `▌ ` (`ui_map.py:200`). The older `cli_rich/theme.py:3-11` vocabulary was close but not the same: `● running`, `◆ AI`, `↳ subagent`, `⏳ bg`, `⟳ compact`, `⎿ ` gutter. The Textual TUI used rotating `◐◓◑◒` with "KohakUwUing…" (`tui/app.py:30-37`).

**Personality string:** the busy label is `kohakUwUing · esc to interrupt` (`ktui/view.py:48`), also `KohakUwUing` in `cli_rich/theme.py:15`. There is exactly one playful token, and it always comes with a functional hint.

### 2.2 Box drawing and rules

- Rounded single-line frames for the boxed composer and for overlays: `╭─╮ │ … │ ╰─╯` (`view/layout.rs:100-131`, `widgets/composer.rs:489-512`). Content has a one-cell pad inside the border (`│ ` … ` │`). The frame is accent (iolite) when the dialog has the keys and muted when it is blurred; a blurred frame also gets the hint `tab returns to this dialog` (`layout.rs:96`).
- The composer border is muted at rest and **amber when in a mode**. Example: `!` shell mode adds a label to the top border, `╭─ shell command ───╮` (`composer.rs:489-501`).
- Dividers: `── label ───────` (muted). The label is used only if `width ≥ label+6`; otherwise a bare rule is drawn (`widgets/layout.rs:62-73`). Conversation switches inline write `── name ──` (`ktui/view.py:221`).
- Tables: header bold, ` │ ` between columns, header separator `───┼───` muted, no outer frame (`widgets/data.rs:150-205`). Markdown tables are the same (`text/markdown.rs:447-449`). Markdown `---` becomes a muted `─` rule capped at 40 cells (`markdown.rs:232`).
- Pane dividers: a vertical `│` muted; tab separators `│` faint.
- KohakuBench plain tables use ASCII instead (` | ` and `-+-`, `KohakuBench/src/kohakubench/report.py:43-50`). This is the same table pattern, written for plain output.

### 2.3 Bars, charts, sparklines

- Progress: `label ━━━━━━━━──────── 120/300  40% · 12.3 step/s · eta 0:15`. The fill `━` is accent, the rest `─` is muted, the label is bold, and the stats are muted (`widgets/status.rs:150-190`). The bar is dropped when it would be under 4 cells.
- Slider field: `━━━●─────` (accent fill, a `●` thumb, faint track; `widgets/field.rs:218-220`).
- Horizontal bars: `█` plus eighth blocks `▏▎▍▌▋▊▉` for sub-cell precision, **capped at 48 cells**. The comment says `// bars past ~48 cells read worse, not better, on a wide terminal` (`widgets/bars.rs:30-46`, `175-176`).
- Sparkline: `▁▂▃▄▅▆▇█` scaled to min/max, accent colour, NaN as a coral `·`, last value shown at the end (`status.rs:270-300`).
- Chart: a multi-row braille line chart (U+2800 dots, 2×4 per cell) that keeps **the whole run**, downsampled to the width, not a sliding window (`widgets/chart.rs:1`). Legend `■ name value`, `(N nan)` in coral, axis ticks `┤`, empty state `  no data yet` muted.
- Images: half-block `▀`/`▄` with fg/bg = two pixels per cell (`widgets/image.rs:109-111`).
- Plain fallback: `#`×filled + `-` over 20 cells, steps `[x] [>] [ ]` (`kt_ui/fallback.py:18-20,297-298`).

---

## 3. Layout model

### 3.1 Five regions (`docs/concepts.md`, README)

| Region | Inline | Full screen |
|---|---|---|
| `transcript` | sealed nodes → real scrollback | scrollable main pane |
| `live` | what is happening now: spinners, progress, charts | under the main pane |
| `bottom` | input, button rows, footer, always at the bottom | bottom |
| `panels` | **hidden** | side panes (`Pane` columns) |
| `head` | **hidden** | top row, usually a `TabStrip` of pages |
| `overlays` | docked at the input, or just above it | docked, or a centred box |

The model's key idea: **past, present and controls are separate regions.** The transcript holds what happened, live holds what is happening, and bottom holds what you can do. Full-screen-only chrome (panels, head) is drawn only in full screen, "so an inline app can build them and lose nothing" (`docs/components.md`).

Inline frame order: unflushed transcript lines, then live, toasts, the dialog, and the bottom. "The bottom always keeps one blank line from what is above it" (`concepts.md`).

### 3.2 The ktui screen (KT agent shell)

Inline (hybrid is the default renderer, `ktui/config.py:36`):

```
… scrollback (sealed cells) …
● assistant reply, streamed Markdown
◆ 5 tool calls  read ×2, grep, bash ×2  ▸  ctrl+o expands
⠹ kohakUwUing · esc to interrupt  (12s)                 ← live
  queued · fix the test  (ctrl+x cancels the last)      ← faint
╭──────────────────────────────────────────────╮
│ > message · / commands · @ files and agents · ? keys │  ← boxed composer
╰──────────────────────────────────────────────╯
[ 2 sub-agents · 1 job · 1 waiting ]                    ← active row (segments)
kohaku · claude-x                 ctx 41% · in 12.3k (cache 8.1k) out 2.1k · $0.12
```

- The composer placeholder is itself the help: `message · / commands · @ files and agents · ? keys` (`ktui/shell.py:313`).
- Footer: left = `name · model` (or `#channel · you send as human`), right = `ctx N% · in … (cache …) out … · cost` joined with ` · `. Empty parts are omitted (`shell.py:456-482`). The footer is muted and its right side is truncated to half the width (`widgets/data.rs:220-235`).
- Active row: one segment per kind (sub-agents, jobs, queued, waiting), reached by ↓ from the input, with focused hint `  ←→ choose · enter opens · ↑ back to the input` (`shell.py:484`).

Full screen (`ktui/chrome.py`, commit `f94c476f` "full screen after the web's v2 session view"):

- `head`: page tabs **Chat · Graph · Status · Debug · Settings** (alt+1…5). Tabs carry a `badge` count in amber; the Debug badge "counts errors and stray stderr, not warnings" (commit `6422d7f2`).
- Left rail "Chats": `agents  N` group (each agent with a status icon, an unread count as `detail`, and `  ◂` on the current one), then a `channels  N` group (`#name`), each group ending with `+ add`.
- Right side panel "Activity": **only sections with content** (members, jobs, sub-agents, drives, widgets, scratchpad; `ktui/README.md`, `side.py`).
- The input, spinner row and notices sit inside the chat column. On non-chat pages the input is hidden (commit `4ad9571e`).
- Panel widths and collapsed state persist in `ktui.json`.

The full-screen terminal layout is a **deliberate port of the web v2 session view**: tabs on top, a conversation rail, and a context panel that shows only non-empty sections. Pages are the same set, but Workspace was dropped in the terminal (`8717acea`). Other web conventions ported explicitly: the "N tool calls" batch ("like a web chat's tool batch", `cell.rs:10-12`), multi-select answers ("as the web does"), and attention settings ("as the web's notification settings", `config.py:40`).

### 3.3 Transcript cells

A `Cell` is `icon title  detail  status  ▸`, with children indented 2 and a muted `└ trailer` on seal (`cell.rs:121-185`):

- The title is bold, or tinted by `tone` (tool cells: `tone="tool"` sapphire, sub-agents `tone="agent"` taaffeite).
- `detail` (e.g. a tool's key argument) follows in muted text after two spaces. ktui picks **the one argument that identifies the call**: `bash→command`, `read/write/edit→path`, `grep/glob→pattern`, `web_fetch→url`, cut to 72 chars (`ktui/format.py:7-42`).
- Status words are omitted when the icon says them: `// statuses the icon already says are not repeated as text` (`cell.rs:146-150`).
- Folded: header plus `  ⎿  summary  (ctrl+o to expand)`. The summary defaults to the trailer, then `done`, then `running…` (`cell.rs:199-212`). Tool result summaries are `N lines`, or the single line itself cut to 60 chars, or `no output` (`format.py:45-51`).
- Batch: below `batch` children the wrapper is invisible. From that many on, they fold under `✓ 5 tool calls  read ×2, grep, bash ×2, +3 more  1 ✗  ▸`: the top 4 names sorted by frequency, a `×N` count, and running/failed/interrupted counts appended in their colours (`render.rs:490-551`). ktui folds at 3+ consecutive calls; `verbosity: high` disables this. Opened tool output is a scroll box of the **last 12 lines** (`ktui/README.md`).
- `user` cells sit on a full-width tinted band (`user_bg`). The band is set per span, "so the background survives being written to scrollback" (`render.rs:556-558`).
- Cell actions in navigation: hint `c copy · e edit` (`cell.rs:159-171`); KT adds `r retry`, `[` `]` versions.

### 3.4 Panes, columns, tables: width rules

- `Pane` (full screen): `width` with a `min`. **When the main pane would be narrower than 30 columns, panes collapse for that frame, right ones first** (`docs/components.md`; `view/panes.rs:27 MIN_MAIN = 30`). A collapsed pane is a one-column strip. You can drag the divider, double-click to collapse, or use alt+←/→ when the pane has the keys. The pane's title row shows `◂`/`▸`.
- The row above the input is reserved for live rows, "so a spinner coming and going does not move the transcript" (`components.md`, Pane). **This is a layout-stability rule: reserve space for transient status.**
- `Columns`: default `gap=3`, `min_width=16`. Below `min_width` the children **stack**. `pack=True` wraps a badge/button row (`widgets/layout.rs:82-104`).
- Picker sidebar: section column on the left, which becomes **a tab row when narrow** (`components.py:304`).
- Table: when too wide, the widest column shrinks one cell at a time down to 3, and cells are truncated with `…`. `max_rows` keeps the tail with `… N earlier rows` (`data.rs:166-201`).
- TabStrip: when wider than its row, it scrolls by whole tabs behind `‹`/`›`. Closable tabs **always** carry `×` "so tabs keep their width when the active one moves" (`pane.rs:119-121`). **This is a layout-stability rule.**
- Any line that would overflow is truncated as a whole, with `…` (progress, status, footer). Lines are never wrapped mid-widget.

---

## 4. Information density

- **Compact numbers everywhere.** KohakuTUI `short()`: integers as-is, `≥1e4 → 12.3k`, `≥1e6 → 1.2M`, otherwise 2 decimals (`status.rs:190-205`). KT `tokens()`: `≥1000 → 1.2k` (`format.py:61-63`). cli_rich adds `M` (`blocks/footer.py:25-30`). KohakuBench uses `T/G/M/K` with 2 decimals and `/s` rates, and `n/a` for missing (`report.py:61-95`).
- **Durations:** KohakuTUI `clock()` gives `Ns`, `m:ss`, `h:mm:ss` (`status.rs:80-86`), and the elapsed time appears only after ≥1 s, as `  (12s)`. KT `duration()` gives `12.3s`, `1m05s`. cli_rich `fmt_elapsed_compact` gives `1.2s`/`12s`/`1m 05s`/`1h 02m 03s` and says "stable precision" (`cli_rich/theme.py:24-40`).
- **One line per item**, with `·` between facts: `epoch 3 done · FID 4.71`, `in 12.3k (cache 8.1k) out 2.1k`.
- **Counts instead of lists:** `5 tool calls`, `+3 more`, `… 12 more`, `N of M` in picker hints, `↓ N new`.
- **Show only what has content:** the side panel lists only sections with content, and the footer omits empty parts.
- The `Progress` stat format is `value/total pct% · rate unit/s · eta clock`, with the percentage right-aligned to 3 characters (`{pct:>3.0}%`) so it does not jitter.

---

## 5. Streaming and progress conventions

- **Seal, then flush.** Scrollback cannot be edited, so only sealed (final) cells are written to it, in order and once. An open cell holds back every transcript line after it, "so the scrollback never interleaves" (`concepts.md`). Guidance: "keep open cells short-lived: seal a step when it ends, and keep long-running state (progress, live charts) in `app.live`, moving or summarising it into the transcript when it is done."
- **Streamed Markdown flushes by stable block:** with `stream_flush=True` a long answer reaches scrollback paragraph by paragraph, before the cell seals.
- **Live then frozen.** In the README quick start the chart lives in `app.live` during training, then `chart.move(app.transcript); chart.seal()` leaves the final curve in scrollback. KT `<ui>` blocks work the same way: "building UI…" while streaming, then live (`tab to use`), then frozen with their final values on the next turn or esc (`ktui/README.md`, D26). Tool widgets do the same.
- **Batching:** `with app.batch():` sends a group of changes as one frame. The renderer caps at `max_fps` 60 and draws only when dirty. Sealed cells are cached per width.
- **Stdio capture:** `print`/`logging` output goes into the transcript (`app.capture_stdio()`/`capture_logging()`) "instead of tearing the screen". ktui routes stray output and warnings to the Debug → Logs tab with a badge (`logtail.py`, commit `6207cc50`).
- **`\r` progress lines work** in `Log` (`\r` rewrites the current line), so third-party tqdm-style output still renders.
- **Queued input** while busy is shown greyed (faint) with its cancel key: `  queued · <text>  (ctrl+x cancels the last)` (`ktui/view.py:330`).
- **Toasts**: one line above the bottom region, icon plus text in the level colour, default `ttl=3.0` s (`app/control.py:59`); `level` ∈ info/success/warn/error. Used for things like `grad norm spike: 3.21` (warn) and `training finished · press q` (success, ttl 30).
- **Attention when the window is away:** terminal title follows the session, plus an OS notification and a bell when a turn ends or an approval waits (`shell_extras.py:1-3`, `config.py:21-26`). This mirrors the web's notification settings.

### Animation policy

- Only `Status` (always animating) and `Cell(status="running")` without a custom icon animate (`cell.rs:268-270`, `status.rs:70-72`). The engine checks `animating()` only over unsealed nodes in live/doc/overlays/bottom (`runtime/engine.rs:197-209`). With nothing animating, the loop sleeps (wakes ≤ 500 ms).
- One spinner frame every 80 ms (`TICK`, `engine.rs:20`; `theme.rs:445-447`). cli_rich used 5 fps.
- Batches show a spinner while any member runs. Otherwise they show a static result glyph.
- No blinking, marquee, pulsing, or decorative motion. The spinner is the terminal's equivalent of the web's minimal "running" indicator.

---

## 6. Keybindings and help hints

### 6.1 Hint style rules

- Format: `key verb`, separated by ` · `, muted, often indented by two spaces. Arrows are written as glyphs (`↑↓`, `←/→`). Keys are lowercase with `+` (`ctrl+o`, `alt+1`, `shift+enter`).
- **Only the keys of the focused area.** Picker hint (`widgets/picker.rs:484-521`): `  3 of 40 · ↑↓ move · → options · enter select · esc cancel`. It names the neighbouring areas by name (`← sections`, `→ options`).
- **Inline hints exactly where the action is:** `  (ctrl+o to expand)` on folded summaries, `  ctrl+o expands` on folded batches, `↓ 4 new · ctrl+end` on the scroll indicator, `esc to interrupt` in the busy label, `(ctrl+x cancels the last)` on queued messages, `· running in background (ctrl+b)`.
- Footers in demos: `q quit · ctrl+t inline · pgup/pgdn scroll` (`demo/dashboard.py`).
- Full key help is on `?` / F1. It is a Markdown list in the format `- keys — what`, with ` · ` pairing parallel keys and actions, and a separate **full screen** section shown only in full screen (`ktui/shell_extras.py:18-47`):

```
- esc · ctrl+c — interrupt · twice on an idle prompt: exit
- ctrl+t · ctrl+o — full screen on / off · open every folded call
```

### 6.2 Built-in key map (KohakuTUI `docs/dialogs.md`)

| Key | Does |
|---|---|
| ctrl+t | inline ↔ full screen |
| ctrl+o | open every fold; from inline, an expanded full-screen view, then back |
| esc | close top dialog; else `action:escape` (KT: interrupt) |
| ctrl+c | `interrupt=` raise/signal/event/exit/auto; double press within 1 s window (`engine.rs:22`); KT: twice on idle exits |
| ↓ from composer | onto the button/active row; ↑ back |
| pgup/pgdn, ctrl+home/end | scroll / jump; ctrl+end resumes following |
| ctrl+↑ | navigate foldable headers (↑↓ or j/k, enter/space toggle, esc leaves) |
| F6 / shift+F6 | cycle focus areas: document, head, panes, bottom |
| alt+←/→ | resize focused pane |
| tab / esc | return to a dialog you typed away from |
| enter / shift+enter, alt+enter, ctrl+j, `\`+enter | submit / newline |

KT additions (`ktui/shell.py:51-65`): ctrl+b jobs, alt+j next approval, ctrl+k approve oldest, ctrl+x unqueue, alt+v paste image, f1 help, alt+r/alt+s toggle rail/side, ctrl+pgup/pgdn conversations, alt+1…5 pages, ctrl+s/ctrl+enter interrupt-and-send (ctrl+s "for terminals that send ctrl+enter as a plain enter"), ctrl+g `$EDITOR`, ctrl+f find, `!cmd` shell, `@` completion.

Patterns: **fallback chords for terminal limitations** (ctrl+s for ctrl+enter; several newline chords; `links: text` for tmux without OSC 8). **Vim keys as a secondary** option (j/k). **Mouse in full screen only.** Inline leaves wheel and selection to the terminal. In full screen, drag copies via OSC 52, and shift+drag gives the terminal's own selection back.

### 6.3 Dialog principles ("Dialogs never trap", `docs/dialogs.md`)

- `dock="input"` draws the dialog where the input box is, "so the eyes stay where the user just typed". Esc gives the input back.
- With a non-docked dialog open, typing still reaches the composer.
- In full screen, a click away from the dialog closes it **and then reaches what it landed on**: "a click on another list entry or a tab is never swallowed".
- Approvals hidden with esc keep the agent waiting and come back with alt+j. Esc never answers "no" by accident.
- Pickers have focus areas (sections / list / options). "The focused area is tinted and its selected element is a solid bar." Typing always filters and moves focus to the list. While filtering, the sidebar shows match counts per section. Unavailable items are greyed with an amber `unavailable` tag; the current one is marked `✓`.

---

## 7. Inline vs full screen

| | Inline (default in KohakuTUI) | Full screen |
|---|---|---|
| Output | real terminal scrollback: scroll, search, copy like any command | alternate screen, own scrolling |
| Chrome | transcript + live + bottom only | + head tabs, side panes, mouse |
| Mouse | terminal's own | captured: wheel, click, hover, drag-copy |
| Dialogs | docked at input or above it | docked or centred box |
| Use for | training scripts, CLIs, chat; anything whose output should outlive the program | dashboards, multi-agent sessions, monitoring |

- The rationale (README "Why"): "Inline mode keeps a small live area at the bottom and writes everything finished into scrollback, as `pip`, `cargo` or a training script would, only it can redraw." Full screen is the same code, switched at runtime with `ctrl+t`.
- KT ships three renderers: `inline`, `hybrid` (default: inline chat, full-screen panels), and `fullscreen` (`ktui/config.py:18,36`). Remembered preferences live in `ktui.json`, and CLI flags override them for one run.
- The full-screen dashboard demo uses the main pane for the hero content (progress + loss chart height 12, LR and grad charts height 4) and the right panel for reference data (KV run info, dividers `speed`/`eval`/`gpu`/`events`, a table, a log of height 6). Charts are sized by importance.
- Interactive `<ui>` blocks stay live in full screen ("full screen freezes nothing until you go back inline") because full screen can redraw everything. Inline must freeze, because scrollback is append-only.

---

## 8. Degradation

1. **Colour depth:** truecolor → nearest xterm-256 (§1.6) → `terminal` scheme with ANSI 16 and no background bands.
2. **No TTY** (`Backend::Auto` falls back to `Plain`, `term/screen.rs:71-100`): finished lines are printed as plain text without styling (`term/history.rs:30-32`). Width comes from `$COLUMNS`, default 100. There is no live region and no mode switch (`engine.rs:374`). Any dialog closes at once with reason `no_tty`, and the comment says "with no terminal, nobody can answer a dialog" (`engine.rs:362-365`). Links are written as `text (url)`.
3. **Links:** OSC 8 hyperlinks only for http/https/mailto/file. Anything else, or URLs with control characters, stays text with the URL written after it. `links="text"` is for multiplexers that drop OSC 8.
4. **Narrow terminal:** panes collapse below a 30-column main area; Columns stack below `min_width` 16; the picker sidebar becomes a tab row; tables shrink their widest column; divider labels drop below label+6; progress bars drop below 4 cells; frames clamp to width ≥ 5; lines truncate with `…`.
5. **Plain-text renderer for rich widgets:** `kt_ui/fallback.py` renders any `kt.ui` spec as text, using ASCII bars `#`/`-` over 20 cells, `[x] [>] [ ]` steps, and caps (4000 chars, 50 items, 20 table rows). `kt_ui/terminal.py` turns a widget into a card, selection or prompt that older front ends can show.
6. **Legacy fallback:** `kt-cli`/`kt-tui` open ktui when kohakutui is installed, otherwise the old front ends (renamed `legacy-cli`/`legacy-tui`, commit `d59296f9`). Missing features are explained with install instructions rather than causing a crash (`bef22001`).
7. **Logging colour** only when `stdout.isatty()` (`utils/logging.py:49-66`). Unicode encode errors on cp1252 consoles are handled so CJK or emoji output cannot crash a request (`logging.py:72-77`).
8. A `python -m kohakutui reset` command "fixes a terminal left in raw mode". Recovery is part of the UX.

There is **no explicit `NO_COLOR` support** in KohakuTUI (grep found none). No-colour handling comes from the plain backend and the `terminal` scheme. A skill reproducing his style should add `NO_COLOR` handling, mapped to the plain/`terminal` behaviour.

---

## 9. Plain CLI output in other repos

- **Togeari** (`togeari/cli/commands/doctor.py:118-130`, `dash.py`): no colour and no library. argparse subcommands write to an injected `out: TextIO`. Labels are left-aligned in fixed columns (`f"{name:<12} {v or '-'}"`, `python   3.12  (path)`), with two spaces between facts and `-` for missing values. A missing optional dependency is explained: `togeari dash needs the telemetry extra: …`, return code 2. The serve line is one plain line, `togeari dash on http://127.0.0.1:8787`.
- **KohakuBench** (`report.py`): an aligned ASCII table with ` | ` and `-+-`, ljust columns, SI units, `n/a`. Preset listing uses `f"{key:12s} ({count} cases)"`.
- **KohakuEngine** (`cli.py:170-240`): sentence-style status lines (`Sequential workflow completed (3 executions)`), and `--- Config i/N ---` separators with two-space-indented key/values.
- **KohakuBoard** (`kohakuboard/cli.py`, last touched 2026-01-09): click with **emoji prefixes** (`🚀 Starting…`, `📁 Board directory:`, `❌ Error:`, `✅ Sync completed successfully!`) and a three-space indent for sub-lines. This is the older style. KohakuTUI's README says KohakuTUI "is planned for the CLI of KohakuBoard", which signals that this will be replaced.

General conventions across plain CLIs:

- Errors go to stderr with a non-zero code.
- Details are indented under a headline.
- Columns are aligned with format widths.
- Lowercase labels are used (`python`, `os`, `core`).
- Missing values are written as `-` or `n/a`, never left blank.

---

## 10. Where terminal and web connect

| Concept | Web | Terminal |
|---|---|---|
| Accent / primary | iolite `#5A4FCF` | iolite (lifted `#9D94F0` on dark) for focus, prompt, selection, progress fill |
| Running | aquamarine | aquamarine braille spinner |
| Waiting on user / warning | amber | amber `!` / `⚙` / `○`, amber composer border in shell mode, amber tab badges |
| Error | coral | coral `✗` |
| Success | sage (with aquamarine as a "positive" accent) | sage `✓` |
| Tools / sub-agents | sapphire / taaffeite | sapphire tool titles, taaffeite `◆` sub-agents |
| Neutrals | warm stone greys | `#E8E0D8 / #8A8078 / #5A5550 / #3D3835` |
| Low-opacity iolite washes | `color-mix` tints | pre-blended `user_bg #2A2640`, `focus_bg #1E1A2E`, `selection_bg #312A7A` |
| Size tiers | font-size scale | text / muted / faint + bold |
| Tool batch | "N tool calls" collapsible | `✓ N tool calls  names ×k  ▸` |
| Session layout | v2: tabs, rail, context panel | head TabStrip, left Pane "Chats", right Pane "Activity" |
| Notifications | browser notification settings | terminal title, OS notification, bell (`attention` config) |
| No continuous animation | — | spinner only while running; engine idles otherwise |
| Accessibility | — | colourblind schemes (Okabe–Ito), glyph and colour always used together |

Colour is **never the only signal**: every status has a distinct glyph shape (`✓ ✗ ○ ⚙ !` plus the spinner), so the `terminal` scheme, plain output, and colourblind users all keep the meaning.

---

## 11. Engineering and doc conventions that affect the UI

- KohakuTUI `CLAUDE.md`: "Comment, code and docstring all say **what**. *How* and *why* live in `docs/` and `plans/`." Comments are ≤ 2 lines, which is why UI rationale appears as one-line comments such as `// statuses the icon already says are not repeated as text` and `// bars past ~48 cells read worse…`.
- UI text style in docs and hints: short, lowercase, verb-first, no trailing periods, and `·` as the separator. Product prose uses plain declaratives ("Nothing traps the user.", "Live output never flickers").
- Every screenshot in the README is "real output: the demos run headless and `scripts/screenshots.py` paints the emulated terminal's cells". UI claims are tested on an emulated terminal (`App(backend="test")`), which "reads exactly what a user would see".
- Python never sees raw keys, only semantic events (`submit`, `select`, `close`, `action`, `change`). The UI is driven by meaning, not keycodes.

---

## 12. Checklist for the skill (terminal surfaces)

- [ ] Define roles (`text muted faint accent user assistant tool agent running attention danger ok code border selection_* user_bg focus_bg`) and map them to gems. Components ask only for roles.
- [ ] Ship dark (lifted gems, warm stone neutrals), light (web default gems), `terminal` (ANSI 16, no bands) and colourblind (Okabe–Ito) schemes. Detect truecolor and fall back to the nearest of 256 colours.
- [ ] Status = glyph + colour: spinner aquamarine, `✓` sage, `✗` coral, `○`/`⚙`/`!` amber. Do not repeat the status as text.
- [ ] Rounded thin frames `╭─╮`, muted at rest and accent when focused. Tables use ` │ ` and `─┼─` with no outer box. Rules are `── label ───`.
- [ ] Bars: `━` accent fill on a `─` muted track; eighth blocks for precision; cap at about 48 cells.
- [ ] Inline-first: seal finished output into scrollback, keep transient state in a live region above the input, and offer full screen as a toggle.
- [ ] Footer: muted, `left` identity / `right` metrics joined with ` · `, empty parts omitted.
- [ ] Hints: muted, `key verb · key verb`, focused-area-only, placed next to the thing they act on. Full help on `?`/F1.
- [ ] Dialogs dock at the input; esc always exits; typing and clicks are never swallowed.
- [ ] Fold repetitive work into one summary line with counts. Show the last N lines (12) of output.
- [ ] Compact numbers (`k`/`M`, `m:ss`). Use a fixed-width percentage. Show elapsed time only after 1 s.
- [ ] Animate only while running (about 80 ms braille). Idle means a static screen.
- [ ] Reserve rows for transient status so content never jumps. Give tabs a stable width.
- [ ] Narrow width: collapse side panes below a 30-column main area, stack columns below 16, truncate with `…`.
- [ ] No TTY: plain text, links as `text (url)`, no prompts (fail closed). Add `NO_COLOR`.
- [ ] No emoji in status output; use the geometric glyph set. One playful token at most (`kohakUwUing`), always paired with a functional hint.
