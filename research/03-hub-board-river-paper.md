# 03 — KohakuHub / KohakuBoard / KohakuRiver / KohakuPaper frontends

Slice: six Vue apps outside KohakuTerrarium. Everything here was read from `<clones>/` (read-only).
All paths below are relative to that root unless they are absolute.

| App | Path | Product | Era (git) | Main UI author(s) |
|---|---|---|---|---|
| Hub UI | `KohakuHub/src/kohaku-hub-ui` | self-hosted HuggingFace Hub | 2025-10 to 2026-05 | Kohaku (~114 commits), then a contributor (narugo1992) (~50, all 2026-04) |
| Hub Admin | `KohakuHub/src/kohaku-hub-admin` | Admin portal for Hub | 2025-10 (redo 945b542) | Kohaku (29), narugo1992 (8) |
| Board UI | `KohakuBoard/src/kohaku-board-ui` | ML experiment tracker | 2026-01-09 (single squashed commit) | Kohaku (`kblueleaf`) |
| River Manager | `KohakuRiver/src/kohakuriver-manager` | cluster/VPS/task manager + web IDE | 2025-11 to 2026-02 | `shiori` (28) |
| River Doc | `KohakuRiver/src/kohakuriver-doc` | docs site framework | 2026-02-09/10 | `shiori` (5) |
| Paper | `KohakuPaper/src/kohaku-paper-web` | OpenReview conference stats | 2025-11-28 (single commit) | Kohaku |

**Authorship note (important for "his taste" vs. others):** `shiori` uses the
same email as `KohakuBlueleaf` and `kblueleaf` (Board). It is Kohaku's own
alias on another machine, so River Manager and River Doc count as his work. In KohakuHub,
the April 2026 conventional-commit wave (`feat(ui/...)`, `test(ui/...)`, tar browser, `ErrorState.vue`,
`http-errors.js`, the long `vite.config.js` `optimizeDeps` comment) was written by **a contributor
(narugo1992)**, not Kohaku. Treat those parts as a contributor's style that Kohaku accepted, not as his own default.

Also: Board and Paper each ship as a single squashed commit, so they have no design history to mine.

---

## 1. Stack per app

### 1.1 Shared skeleton (identical in all six apps)

- **Vue 3 `<script setup>`, plain JavaScript, no TypeScript.** Types go in JSDoc. This is written down as a rule in
  `KohakuHub/CONTRIBUTING.md:331` and `KohakuBoard/CONTRIBUTING.md:179`, and River's
  `kohakuriver-doc/docs/dev/frontend/conventions.md:3` says "JavaScript-only policy".
- **Vite = `rolldown-vite`.** Every package aliases `vite@npm:rolldown-vite@7.x` (Hub/Board/Paper 7.1–7.2.5, River ^7.2.7, Terrarium `latest`).
- **File-based routing via `unplugin-vue-router`** (`routes` from `vue-router/auto-routes`) in every app. Board lists it in dependencies.
- **`unplugin-auto-import` + `unplugin-vue-components` with `ElementPlusResolver`**, so `ref`, `computed`, `useRoute` and `el-*` are never imported by hand
  (example: `KohakuHub/src/kohaku-hub-ui/vite.config.js` AutoImport/Components blocks).
- **Element Plus is the component library** everywhere (`^2.11.x`). Its dark theme is pulled in with
  `import "element-plus/theme-chalk/dark/css-vars.css"` (Hub `src/main.js:15`, Board `src/main.js:13`, River `src/main.js:12`).
  Paper is the exception: it calls `app.use(ElementPlus)` globally and never imports the dark vars.
- **UnoCSS** for utilities, with Iconify **carbon** (primary) and **ep** icon sets. River Manager adds `mdi`.
- **Pinia** for state. axios for HTTP. dayjs for time (Hub, Admin, River).
- This is a long-lived habit. `ProjectTemplate-Vue` (2022-08) already had Vue 3 + Element Plus + auto-import + `vite-plugin-pages` file routing (with Bootstrap at that time).

### 1.2 Differences between apps

| | Hub UI | Hub Admin | Board | River Mgr | River Doc | Paper |
|---|---|---|---|---|---|---|
| Uno preset | `presetWind` (wind3) | `presetUno` | `presetUno` | `presetUno` | `presetWind` (wind3) | `presetUno` |
| attributify | yes | yes | **no** | yes | yes | yes |
| icons | carbon+ep, scale 1.2 | carbon+ep, scale 1.2 | default (ep used as `i-ep-*`) | carbon+ep+mdi, scale 1.2, `inline-block; vertical-align: middle` | carbon+ep, scale 1.2 | default, scale 1.2, inline-block |
| reset | `@unocss/reset/tailwind.css` | own `* {margin:0}` | tailwind reset | own reset in main.css | own reset | none |
| Charts | — | chart.js + vue-chartjs | **plotly.js-dist-min 2.35** | plotly.js-dist-min 3.3 | — | plotly.js-dist-min 2.35 |
| Code view | CodeMirror 6 + highlight.js | — | highlight.js | **Monaco** + **xterm** | highlight.js | — |
| Markdown | markdown-it + DOMPurify + mermaid + panzoom | — | same | — | same + minisearch | — |
| Tests | vitest + msw + testing-library | same | — | — | — | — |
| Prettier | default | default | default | `semi:false, singleQuote, printWidth:120, singleAttributePerLine` | same as Mgr | default |

The `scale: 1.2` + `warn: false` icon config, the `ep`/`carbon` lazy JSON import, and the
safelist of dynamically bound `i-carbon-*` classes appear in every config
(`kohaku-hub-admin/uno.config.js` "safelist: Explicitly safelist icons used in dynamic contexts";
`kohakuriver-doc/uno.config.js` "All frontmatter icons (dynamic :class, must be safelisted)"; River Manager safelists file-tree icons and colors).

The markdown stack (`MarkdownViewer.vue` with mermaid, panzoom zoom controls and a fullscreen button, plus a custom
`highlight-theme.css` built on GitHub light colors `#24292e / #cf222e / #0969da / #6a737d`) is **copy-pasted** between Hub,
Board and River Doc. The copies differ slightly; the md5s of the three `highlight-theme.css` files all differ. Mermaid uses its
built-in `dark`/`default` themes, as the comment in `kohaku-hub-ui/src/components/common/MarkdownViewer.vue:74` explains:
"Use Mermaid's built-in themes - they're designed properly".

---

## 2. Color tokens and theme approach

### 2.1 Summary: none of these apps use the gemstone palette

Every app in this slice uses **stock Tailwind blue (`#3b82f6` / `#2563eb`) as the primary color, on cool gray or slate neutrals**.
None of them uses Terrarium's sapphire/iolite/warm-stone system.

- Hub UI `uno.config.js`: `primary` = the Tailwind blue scale `#eff6ff … #1e3a8a`. Element Plus is re-pointed to it in
  `src/style.css:16-23`:
  ```css
  --el-color-primary: #2563eb;
  --el-color-primary-light-3: #3b82f6;
  ...
  --el-color-primary-dark-2: #1d4ed8;
  ```
  Dark mode shifts the primary one step lighter (`style.css:26-38`: `--el-color-primary: #3b82f6`).
  The same file still has Vite-template leftovers: `a { color: #646cff }`, `h1 { font-size: 3.2em }`, `.card { padding: 2em }`
  (`style.css:40-47, 60-63, 85-87`).
- Hub Admin: `primary: '#409EFF'`, which is Element Plus default blue (`uno.config.js`). The menu active color is hard-coded `'#409EFF'`
  (`src/components/AdminLayout.vue:87`).
- Board: `primary: { DEFAULT: '#3b82f6', dark: '#2563eb' }`.
- River Manager: the Tailwind blue scale **plus a named surface-layer system** (see 2.3).
- River Doc: the Tailwind blue scale, with a blue-tinted sidebar (`bg-blue-50 dark:bg-gray-950`, `border-blue-100`).
- Paper: the Tailwind blue scale in Uno, but in practice it relies on Element Plus CSS vars (`var(--el-color-primary)`, `var(--el-bg-color)`).

### 2.2 Semantic entity colors (recurring idea)

He gives each domain entity a fixed hue and reuses that hue for icons, column rules and menus:

- Hub: **model = blue, dataset = green, space = purple, organization = orange**.
  - `kohaku-hub-ui/src/components/repo/RepoList.vue:98-104`:
    ```js
    model: "i-carbon-model text-blue-500",
    dataset: "i-carbon-data-table text-green-500",
    space: "i-carbon-application text-purple-500",
    ```
  - Header create menu, `TheHeader.vue:74-92` (`i-carbon-group text-orange-500` for org).
  - Landing page column heads: `border-b-2 border-blue-500` / `border-green-500` (`pages/index.vue:61, 120`).
  - Visibility radios: public = `i-carbon-unlocked text-green-500`, private = `i-carbon-locked text-orange-500` (`pages/new.vue:104-117`).
- Hub Admin `src/styles/colors.css:25-30` writes the entity colors down as CSS vars, with dark variants one step lighter:
  ```css
  --color-user: #3b82f6;   --color-repo: #10b981;  --color-commit: #f59e0b;
  --color-org: #8b5cf6;    --color-lfs: #ef4444;
  /* dark */ --color-user: #60a5fa; --color-repo: #34d399; ...
  ```
- River Doc `site.config.js`: guide = `text-blue-600 dark:text-blue-400`, dev = purple, tech-report = green.
- River GPU page: Total GPUs = purple chip icon, usage = blue, memory = green, temperature = orange, power = yellow (`pages/gpu/index.vue:160-226`).

This is the same instinct as Terrarium's gemstone accents (one accent hue per concept). Here it is expressed with Tailwind hue names instead of a custom palette.

### 2.3 Layered surface tokens (River Manager): the forerunner of Terrarium's `warm-*`

`kohakuriver-manager/uno.config.js` theme.colors has comments that explain the reasoning:

```js
// Custom app colors for distinct UI layers (flat naming for UnoCSS)
// Light mode: white cards on light gray page - use DARKER inset colors
'app-sidebar': '#1e293b',      // slate-800 - darkest
'app-page': '#f1f5f9',         // slate-100 - main background
'app-card': '#ffffff',         // white - cards
'app-surface': '#f1f5f9',      // slate-100 - surfaces inside cards (darker than card)
'app-inset': '#e2e8f0',        // slate-200 - inset elements (progress bg, panels)
// Dark mode: dark cards on darker page - use BRIGHTER inset colors for contrast
'app-sidebar-dark': '#0f172a',  // slate-900
'app-page-dark': '#1e293b',     // slate-800
'app-card-dark': '#334155',     // slate-700
'app-surface-dark': '#475569',  // slate-600 - surfaces inside cards (brighter than card)
'app-inset-dark': '#64748b',    // slate-500 - inset elements (brighter for contrast)
```

Each pair is wrapped in a shortcut, so templates never write `dark:` for surfaces:

```js
'bg-app-page': 'bg-app-page dark:bg-app-page-dark',
'bg-app-card': 'bg-app-card dark:bg-app-card-dark',
'bg-app-inset': 'bg-app-inset dark:bg-app-inset-dark',
```

**The design rule here: in light mode nested layers get darker; in dark mode they get brighter.** As a result River Manager has
only 34 `dark:` occurrences in its .vue files, compared with 785 in Hub UI. Terrarium generalizes this with the `warm-50…950` scale
and CSS-var emission. River Manager is where he first named surfaces semantically instead of writing gray-N everywhere.

### 2.4 Hub Admin: a CSS-variable token sheet

`kohaku-hub-admin/src/styles/colors.css` is a small design-token file: bg-base/elevated/card/hover/active,
text-primary/secondary/tertiary/inverse, border-default/light/strong, entity colors, status colors, and three shadows.
Each has a `html.dark` override:

```css
:root     { --bg-base: #f5f5f5; --bg-elevated: #ffffff; --text-secondary: #6c757d; --shadow-md: 0 4px 6px -1px rgba(0,0,0,.1); }
html.dark { --bg-base: #0a0a0a; --bg-elevated: #1a1a1a; --bg-card: #1f1f1f; --shadow-md: 0 4px 6px -1px rgba(0,0,0,.4); }
```

Dark-mode shadows are made heavier (0.3/0.4/0.5 instead of 0.05/0.1/0.1), which matches the River dropdown shadow
(`0 10px 40px rgba(0,0,0,.15)` light vs `.4` dark, `kohakuriver-manager/src/styles/main.css:362-372`).
The neutrals are Bootstrap greys (`#6c757d`, `#dee2e6`, `#adb5bd`), and dark mode is pure neutral `#0a0a0a/#1a1a1a`, not warm.

### 2.5 Status color conventions (all apps)

- Status traffic light in River `utils/constants.js:22-54`: pending/paused = warning, assigning = info, running/completed/online = success,
  failed/killed/killed_oom/lost/offline = danger, stopped = gray. These map onto `badge-*` shortcuts
  (`bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`, `uno.config.js` badges).
- Threshold coloring: `ResourceBar.vue` `color="auto"` uses ≥90% red, ≥70% yellow, else green.
  GPU utilization uses <30 green, <70 yellow, else red, and temperature uses <60 / <80 (`pages/gpu/index.vue:95-107`). A negative value means "unknown" and renders gray-400.
- Hub ErrorState (contributor work): amber for errors the user can act on (gated/forbidden/CORS), muted gray for ones they cannot (not-found / upstream down).
  The comment at `components/common/ErrorState.vue:69-73` gives the reasoning: "Gated / forbidden / CORS all surface as amber — they are actionable by the user."
  Terrarium's amber-as-actionable-warning lines up with this.

### 2.6 The blue→purple gradient motif (early-era signature, later dropped)

- Hub hero: `bg-gradient-to-r from-blue-500 to-purple-600 text-white` (`pages/index.vue:5`).
- Board wordmark: `bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent` (`components/layout/TheHeader.vue:54`).
- Hub Admin sidebar header: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` with white title (`AdminLayout.vue:157`).
- Hub Admin StatsCard: a solid gradient tile per color (`from-blue-500 to-blue-600` etc.), white `text-5xl font-bold` number, and `translateY(-4px)` on hover
  (`components/StatsCard.vue:38-46, 66-83`).

River (late 2025/2026) and Terrarium have no gradient fills. Accents there are flat. Treat the gradients as an early habit he abandoned, not as current taste.

---

## 3. Typography

There are no custom webfonts anywhere. All apps use system stacks:

- Hub UI `style.css:2`: `system-ui, Avenir, Helvetica, Arial, sans-serif; line-height: 1.5` (Vite template default).
- Hub Admin `style.css:8-16`: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`, `line-height: 1.6`.
- River Manager `main.css:9`: **`Inter`**, system-ui, … (Inter is listed first but never loaded, so it only applies if installed locally).
- River Doc `main.css:31-38`: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`, `line-height: 1.6`.
- Paper `style.css:2-8`: same system stack, with `font-synthesis: none; text-rendering: optimizeLegibility`.
- Every app sets `-webkit-font-smoothing: antialiased`.

**Size hierarchy.** There is no named font-size tier system like Terrarium's. Sizes come from Uno shortcuts:

| Role | Value | Where |
|---|---|---|
| Page title | `text-2xl font-bold` (Paper/River `page-title`), Hub `text-2xl md:text-3xl font-bold` | `kohakuriver-manager/uno.config.js` `page-title`; `kohaku-hub-ui/src/pages/new.vue:5` |
| Admin page h1 | `1.875rem bold` (= text-3xl) | `kohaku-hub-admin/src/styles/admin-common.css:17-22` |
| Section title | `text-lg font-semibold mb-4` (River, Board `card-title`), `text-xl` in Paper | uno shortcuts |
| Body / meta | `text-sm`, with secondary meta in `text-xs text-gray-500` | throughout |
| Stat value | `text-3xl font-bold` + `text-sm text-gray-500` label (River `stat-value/stat-label`); Admin `text-5xl` | River uno, `StatsCard.vue:53` |
| Overline label | `text-xs ... uppercase tracking-wider` (table header), "CREATE NEW" in caps | River `table-header`; Hub `TheHeader.vue:235` |

Responsive type is done by stepping sizes per breakpoint: `text-3xl md:text-4xl lg:text-5xl` for hero h1
(`kohaku-hub-ui/src/pages/index.vue:7`), `text-3xl sm:text-4xl lg:text-5xl` in River Doc (`pages/index.vue:7`),
`text-xl sm:text-2xl lg:text-3xl` for the repo title (`RepoViewer.vue:74`), and `text-xs sm:text-sm` for meta rows (`RepoList.vue:29`).
Monospace (`font-mono text-xs`) is used for commit hashes, error detail lines and the terminal.

---

## 4. Layout shells

There are three shell archetypes, chosen to fit the product.

### 4.1 Public "site" shell: sticky top nav + centered container + footer (Hub UI, Board, Paper, River Doc)

Hub UI `App.vue`:
```html
<div class="min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors flex flex-col">
  <TheHeader /> <main class="flex-1"> <RouterView .../> </main> <TheFooter />
```
- Header `TheHeader.vue:3-7`: `bg-white dark:bg-gray-800 border-b ... sticky top-0`, height `h-12 md:h-16`, using `container-main` = `max-w-7xl mx-auto px-4 sm:px-6 py-6`.
  On the left is a logo (`h-8 w-8 md:h-10 md:w-10`) + bold wordmark, in the center text links (`gap-6`, hover → `text-blue-500`),
  and on the right a theme toggle, a circular primary "+" dropdown (create menu), and an avatar dropdown.
- River Doc header (`components/layout/TheHeader.vue:3`): **`sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur`**, `h-14`.
  This is the most modern header in the slice: a frosted bar with a search pill (`Ctrl+K` / `⌘K` `<kbd>`), a docs link, GitHub, and a theme toggle.
- Board: `px-6 py-3 shadow-sm` nav with an `el-breadcrumb` (Projects / project / run) next to the logo. Main area is `max-w-full px-6 py-6`, full width because charts need room.
- Paper: scoped-CSS header, `height: 60px; max-width: 1400px`, and **global conference/year `el-select`s in the header** (`TheHeader.vue:30-61`).
  The active nav link uses `var(--el-color-primary-light-9)` as a pill background.
- Footer (Hub): `bg-gray-100 dark:bg-gray-800 border-t`, a 5-column link grid `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5`.

### 4.2 "Console" shell: fixed dark sidebar + content (River Manager, Hub Admin)

River Manager `App.vue:34-52` + `TheSidebar.vue`:
- `h-screen overflow-hidden bg-app-page`. Only `<main>` scrolls (`h-full overflow-auto p-4 md:p-6`).
- The sidebar is **always dark** (`bg-app-sidebar` = slate-800/900 in both themes). It is `w-64`, collapses to `w-16` icon rail, and is fixed-left with `transition-all duration-300`.
  Content offsets via `ml-0 | ml-16 | ml-64`.
- Nav items: `px-3 py-2.5 rounded-lg`. Active = `bg-blue-600 text-white`, idle = `text-gray-400 hover:bg-gray-800 hover:text-white` (`TheSidebar.vue:124-127`).
  Menu items are **filtered by role** (`allMenuItems` with `role: 'anony'|'viewer'|'operator'`).
- The footer cluster in the sidebar holds user + role, login/logout, a **theme cycle button (light → dark → system)**, a refresh button, and Collapse.
- Collapsed mode hides labels and adds `:title` tooltips on the remaining icon buttons.

Hub Admin `AdminLayout.vue`: Element Plus `el-container / el-aside width="250px" / el-header / el-main` with `el-menu router`.
It carries a gradient sidebar header, a "KohakuHub Administration" title, a **Ctrl+K global search** button (with an `el-tag` "Ctrl+K" hint shown only at `md`+),
a circular theme toggle, and a red Logout button. Menu colors are passed as props from `themeStore.isDark` (`AdminLayout.vue:84-88`).

### 4.3 Workspace shell: resizable sidebar + card canvas (Board project page)

`kohaku-board-ui/src/pages/projects/[project]/index.vue`:
- Left run-list sidebar is **drag-resizable** (default `sidebarWidth = 300`, stored with the layout, `:158, 1709-1735`) through a 6px invisible handle that tints
  `rgba(64,158,255,.3)` on hover (`:2110-2124`).
- Charts are **user-arranged cards**. Each `ConfigurableChartCard` is drag-sortable (vue-draggable-plus, `card-drag-handle cursor-move` with an `i-ep-rank` grip).
  They resize via bottom/right/corner handles, and width **snaps to fractions** 1/8, 1/6, 1/5, 1/4, 1/3, 1/2, 2/3, Full
  (`ConfigurableChartCard.vue:747-756`), with a dashed-blue preview overlay showing the fraction label (`:1450-1473`).
  **Holding Shift applies the resize to all cards** (`syncAll: true`, `:773-781`). A global Shift listener in `composables/useSliderSync.js` likewise syncs sliders across charts.
- The layout (card configs, sidebar width, custom run colors) persists per project.

River Manager's web IDE (`components/ide/*`) is another workspace layout: `SplitPane`, a file tree, Monaco tabs, and an xterm terminal.
It has VS Code shortcuts (`Ctrl+B` toggles the tree, ``Ctrl+` `` toggles the terminal, `Ctrl+S` saves, `IdeLayout.vue:93-109`), with `#1e1e1e` terminal and `vs-dark` Monaco.

### 4.4 Docs shell (River Doc)

`framework/components/DocLayout.vue`: a fixed left tree sidebar (`w-64`, `bg-blue-50 dark:bg-gray-950`, `border-r border-blue-100`).
The content is `lg:ml-64` with `doc-content = flex-1 min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-12`, plus breadcrumbs and prev/next `doc-nav-link` cards.
Sidebar items have three states defined as shortcuts: `sidebar-item-idle`, `sidebar-item-ancestor` (`bg-blue-100/50 font-medium`), and `sidebar-item-active`.
Child branches get a guide line, `sidebar-branch = ml-3 border-l border-blue-200 pl-1`. A comment on the sidebar explains why it is fixed:
"Sidebar: fixed positioning so footer can never push it" (`DocLayout.vue:20`).

The docs framework is **config-driven**. `site.config.js` declares the name, tagline, sections (each with key, title, description, carbon icon, and color class) and links,
and the framework renders the landing cards from it.

---

## 5. Component patterns

### 5.1 Cards

The `card` shortcut exists in every app, but the definition drifts:

| App | `card` |
|---|---|
| Hub UI | `bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4` |
| Hub Admin | `bg-white dark:bg-gray-800 rounded-lg shadow p-6` |
| Board / Paper | `bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-800` |
| River Mgr | `bg-app-card rounded-lg shadow-md p-2 border border-gray-200 dark:border-gray-600` (+ `card-hover` = `hover:shadow-lg transition-shadow duration-200`) |
| River Doc | same as Hub + `card-hover … cursor-pointer` |
| Terrarium (ref) | `bg-white dark:bg-warm-900 rounded-xl border border-warm-200/60` (no shadow) |

What stays constant: a white or near-white card, a 1px gray border, `rounded-lg`, a shadow that grows on hover for clickable cards
(`hover:shadow-md transition-shadow cursor-pointer`, `RepoList.vue:7`), and a blue border on hover for project tiles
(`hover:border-blue-400 dark:hover:border-blue-600`, Board `pages/index.vue:67`).
Terrarium moves to `rounded-xl` with **border only, no shadow**. Shadow-heavy cards belong to the older apps.

**Repo/list card anatomy (Hub `RepoList.vue`):** colored type icon → blue link title (`break-all`, `hover:underline`) → `el-tag` "Private"
(warning) → meta row "by X · Updated 3 days ago" → up to 3 `el-tag effect="plain"` tags. On the right are download and like counts
with `i-carbon-download` / `i-carbon-favorite`. On mobile it stacks: `flex-col sm:flex-row`, with the stats row `w-full sm:w-auto justify-end`.

**Stat tiles:** River `card` + `flex items-center gap-3` + a `text-2xl` colored icon + `text-xs text-muted` label + `text-xl font-semibold` value,
laid out in `grid-cols-2 md:grid-cols-4 lg:grid-cols-6` (`pages/gpu/index.vue:156-230`). This is quieter than Admin's gradient tiles and is the more recent pattern.

### 5.2 Tabs

- Hub repo page uses hand-rolled underline tabs, not `el-tabs` (`RepoViewer.vue:208-283`):
  ```js
  'px-4 py-2 font-medium transition-colors',
  active ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
         : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
  ```
  The tab strip sits in `-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto` with `min-w-max sm:min-w-0`, so it scrolls edge-to-edge on phones.
  Disabled tabs get `opacity-50 cursor-not-allowed` plus an explanatory `:title` ("Commits not available for HuggingFace repos").
- River restyles `el-tabs` globally: the bottom divider is hidden, the active bar is a **2px `linear-gradient(90deg,#3b82f6,#60a5fa)`**,
  items use `padding 0 20px; font-weight 500`, and the active item turns `#3b82f6`, weight 600 (`main.css:137-192`).

### 5.3 File browsers

- **Hub file list** (`RepoViewer.vue:486-600`): a CSS grid row, `grid-cols-[auto_1fr] md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,2fr)_120px_110px]`
  (icon | name | last commit | updated | size). On mobile, the commit message, date and size collapse under the filename (`md:hidden` blocks, `·` separator).
  The **whole row is an `<a>` overlay** (`absolute inset-0 z-10` RouterLink) so middle-click and right-click "open in new tab" work. Inner controls are lifted
  to `relative z-20` with `@click.stop`. This was contributed in "make file list rows right-click-open-in-new-tab-able (#32)".
  Folder icon = `i-carbon-folder text-blue-500`, file icon = `i-carbon-document text-gray-500`. A "Load More" button replaced numbered pagination,
  "HuggingFace-style" (commit 2515891).
- **River IDE file tree** (`components/ide/file-tree/*`, `utils/fileIcons.js`): an extension → carbon logo map (`i-carbon-logo-python`, `-typescript`, `-logo-vue`, …),
  colored per type (amber/cyan/yellow/blue/green/orange/pink/purple, all safelisted), with a right-click context menu (new file/folder/rename/delete/copy/refresh).
- **Hub Admin FileTree.vue**: an Element Plus tree for storage browsing.

### 5.4 Tables

- Element Plus `el-table` is the default everywhere (Admin pages, ErrorState sources table `size="small" :border="true"`, Paper paper list).
- River also defines a hand-made table vocabulary (`table-container` rounded bordered overflow-x-auto, `table-header` `bg-app-surface text-xs uppercase tracking-wider`,
  `table-row` hover `bg-app-surface`, `table-cell px-4 py-3`). For dark mode River overrides `el-table` vars to its grays (`main.css:101-108`).
- Paper colors numeric deltas: `diff-positive` (`--el-color-success`) / `diff-negative` (`--el-color-danger`) when |Δ|>0.1. Correlation cells get color only when |r|>0.5
  (`pages/conference.vue:372-411`), so color is used only when the value is significant.

### 5.5 Forms and dialogs

- Forms: `el-form label-position="top"` inside a `card`, centered at `max-w-3xl mx-auto`, with an h1 + one-sentence explainer above
  ("A repository contains all project files, including revision history.", `pages/new.vue:5-9`). Choices are `el-radio-button` for type and rich `el-radio`s with icon +
  bold title + `text-xs` gray description for visibility (`new.vue:101-125`), which mirrors GitHub's new-repo page.
- Danger zone: `card border-2 border-red-500` with an `text-red-600` heading "Danger Zone" (`pages/[type]s/[namespace]/[name]/settings.vue:177-178`).
- Destructive confirms use `ElMessageBox.confirm(message, title, {type:'warning'|'error'})`, and the message states the consequence:
  "This will clear all commit history for X and optimize storage. Only the current state will be preserved. This action cannot be undone!" (`settings.vue:803-807`).
  Hub Admin wraps these in `utils/dialogs.js` (`showSuccess/showError/confirmDialog`) for testability.
- River restyles Element Plus dialogs: **`border-radius: 12px`**, header `20px 24px 16px`, body `0 24px 24px`, footer `16px 24px 20px`, and in dark mode a 1px `#374151`
  divider under the header (`main.css:391-412`). Message boxes get 12px radius, dropdowns and popovers 8px radius, and **borderless with a big soft shadow `0 10px 40px rgba(0,0,0,.15)`**.
- River buttons: **all Element Plus button borders are removed**, `border-radius: 8px`, `font-weight: 500`, solid fills
  (default = `#e5e7eb` light / `#4b5563` dark with "MORE contrast" comment, primary `#3b82f6→#2563eb`, success `#10b981`, warning `#f59e0b`, danger `#ef4444`).
  Text buttons hover `rgba(59,130,246,.1)` (`main.css:199-355`). This is the **closest ancestor to Terrarium's flat, borderless, `rounded-lg` button language.**
- Board's chart settings modal is hand-rolled rather than `el-dialog`: `rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto` with a sticky header.
  It closes on backdrop click only when **both mousedown and mouseup** land on the backdrop (`LinePlot.vue` `handleModalMouseDown/Up`), so a drag-select that ends outside the panel does not dismiss it.
- The `el-button + el-button` margin hack. Hub repeatedly inserts `<div class="w-0 h-0 p-0 m-0"></div>` between stacked buttons with the comment "Avoid el-button+el-button spacing"
  (`TheHeader.vue:369-370`, `pages/index.vue:22`, `RepoViewer.vue:175,185`). Because of the hack, buttons on mobile stack as `w-full` with no stray left margin.

### 5.6 Misc patterns worth reusing

- **Copy-to-clipboard micro buttons** next to IDs: `p-1 hover:bg-gray-100 rounded` with an `i-carbon-copy text-sm text-gray-500` (`RepoViewer.vue:91-95`).
- **Status badge with a dot** (River `StatusBadge.vue`): `rounded-full font-medium inline-flex items-center gap-1`, a `w-1.5 h-1.5 rounded-full bg-current opacity-75` dot,
  and the label title-cased from snake_case (`killed_oom` → "Killed Oom").
- **Progress/resource bar** (`ResourceBar.vue`): label + `xx.x%` on top in `text-xs`, an `h-2 bg-app-inset rounded-full` track, and a fill animating `transition-all duration-300`.
- **Global loading toast** (River `GlobalLoading.vue` + `stores/loading.js`): a non-blocking bottom-right pill (`bottom: 24px; right: 24px`, `pointer-events: none`,
  `rgba(30,41,59,.95)` + `backdrop-filter: blur(8px)`, 12px radius) that **lists every in-flight operation message**. It is driven by
  `loadingStore.withLoading(id, message, fn)`. This is a deliberate alternative to full-screen spinners.
- **Friendly random names** for new VPS/tasks (`utils/randomName.js`, "sunny-meadow" via `friendly-words`).
- **Keyboard-first touches**: Ctrl+K search (Hub Admin, River Doc), Enter submits login (Hub commit eaa83cd), double-click to rename a chart card title
  (Esc cancels, Enter saves, `ConfigurableChartCard.vue:866-880`).

---

## 6. Data visualization

### 6.1 Library choice

- **Plotly (`plotly.js-dist-min`) is his chart library** in Board, River and Paper, all written by Kohaku.
- Chart.js (`vue-chartjs`) appears only in Hub Admin (`components/ChartCard.vue`), with Element default colors `#409EFF #67C23A #E6A23C #F56C6C` (`pages/index.vue:77-142`).

### 6.2 KohakuBoard `LinePlot.vue`: the most developed chart in the slice

Rendering and performance:
- Traces use `type: "scattergl"` (WebGL) with `plotGlPixelRatio: 2` (`LinePlot.vue:885-890`).
- **Adaptive downsampling** keeps roughly 5000 points per series (`downsampleRate: -1` means adaptive, `:347-368`).
- Updates go through `Plotly.react`, and `uirevision: props.chartId` "Preserve user's zoom/pan state across data updates (prevents range flickering)" (`:864-865`).
  `transition.duration: 0`.
- A `ResizeObserver` on the parent calls `Plotly.Plots.resize`, and a `MutationObserver` on `<html class>` **re-renders on theme toggle** (`:960-983`).

Smoothing (TensorBoard/W&B style):
- Modes: disabled / **EMA** (debiased: `decay = min(i/k, value)` ramps in, `:288-296`) / gaussian kernel / moving average. Default EMA value 0.9.
- When smoothing is on, the raw series is drawn underneath at **30% alpha and half line width**, with no legend entry and no hover (`:589-610`).
  The smoothed line goes on top, and the hover shows **`smoothed (original)`**: `"<b>%{fullData.name}</b>: %{y:.4f} (%{customdata.originalY:.4f})"` (`:661-667`).
- Trace order is explicit: original (bottom), smoothed (top), special markers (overlay) (`:780-781`).

NaN/Inf handling (a careful touch):
- NaN, +inf and −inf points are not dropped silently. They are drawn on a **hidden secondary y-axis fixed to [0,1]** (`yaxis2`, `:827-835`), so the main axis range is not affected.
  NaN is a circle at y=1, +inf a triangle-up at 0.95, −inf a triangle-down at 0.05. Each is size 8–10 in the series color with a **white 1.5px outline** (`:700-778`).
  Series are split into segments at the bad values instead of being interpolated across them.

Axes, hover and look:
- `hovermode: "x unified"`, `hoverdistance: -1`, `spikedistance: -1`. Spikes on both axes are `spikemode: "across"`, `spikesnap: "cursor"`, 1.5px solid,
  `#888` in dark and `#666` in light (`:798-822`).
- Transparent `paper_bgcolor`/`plot_bgcolor`, so the card color shows through. Gridlines `rgba(156,163,175,.3)` light / `.2` dark, zeroline `.4/.3`,
  text `#1f2937` / `#e5e7eb` (`:509-515`). Hover label bg is `rgba(255,255,255,.95)` / `rgba(31,41,55,.95)`, left-aligned, `namelength: -1`, which never truncates series names.
- Legend is horizontal below the plot (`orientation: "h", y: -0.15`). Margins are tight: `{t:10, r:20, b:30, l:50}`. **The modebar is hidden** (`displayModeBar: false`) and
  replaced by small custom buttons (`p-1.5 rounded bg-white dark:bg-gray-800 border ...`) for reset view, export PNG (1200 wide, scale 2) and settings.
- Axis formats depend on the x type: step → integer hover; timestamp/walltime → `date` axis with `%Y-%m-%d %H:%M:%S`; relative walltime → auto-picked unit with `ticksuffix`; otherwise `.4f`.
- Multi-run mode lowers line alpha to 0.6 when more than one series is shown (`:618-619`).

Color assignment:
- The single-run palette is **Plotly/D3 category10 with the first color swapped to Tailwind blue**:
  `["#3b82f6","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"]` (`:535-546`).
- **Multi-run colors are deterministic per run_id** (`pages/projects/[project]/index.vue:48-80`). An FNV-1a hash of the run_id picks the hue, with ±30° hue jitter,
  saturation `0.65 ± 0.15` clamped to [0.5, 0.95], and lightness `0.55 ± 0.125` clamped to [0.35, 0.7]. The docblock states the goal:
  "Same run_id ALWAYS gets same color, regardless of run order/deletion" and "brightness guard rails so colors stay vivid".
  Users can override per run, and the overrides are saved with the layout.
- At most 10 runs are displayed at once (the most recently updated selected runs, `:288-298`).

Cross-chart interaction:
- **Hover sync** (`composables/useHoverSync.js`): hovering one chart shows tooltips at the same x on every registered chart in the same tab, keyed by x-axis type.
  It can be toggled, and `window.__hoverSyncDebug()` exposes a debug hook.
- **Shift-sync** for sliders and card resizing (`useSliderSync.js`).
- Histograms: `HistogramViewer` / `HistogramSurfaceMini` use a 3D surface with **`colorscale: "Turbo"`** over steps (`HistogramSurfaceMini.vue:161`).

Motion preference:
- `useAnimationPreference.js` honors `prefers-reduced-motion` by default, lets the user override it with a header toggle (persisted as `animations-enabled`), and applies a
  global `.no-animations` class that forces `animation-duration: .01ms; transition-duration: .01ms` (`App.vue:65-86`). This is unusual and worth keeping.

### 6.3 River and Paper charts

- River `pages/stats/index.vue`: Plotly area lines with `line #3b82f6 width 2` + `fillcolor rgba(59,130,246,.1)` and `#10b981` with `rgba(16,185,129,.1)`,
  transparent backgrounds, and dark-aware grid `#374151`/`#e5e7eb` and font `#e5e7eb`/`#374151` (`:69-172`).
  The look is "thin colored line over a 10% tint of the same color".
- Paper: Plotly bars and lines in **Element Plus default colors** (`#409eff, #e6a23c, #67c23a, #f56c6c, #909399`, then `#9c27b0` …, `HistogramChart.vue:25-36`),
  gridcolor `#e4e7ed` (Element border), transparent backgrounds, no dark awareness. Hover text is built by hand with explicit math:
  bins written as half-open intervals `[start, end)` and cumulative `count (pct%)` with "top k%" semantics (`HistogramChart.vue:40-80`).
  Precision and honesty in tooltips take priority over looks.

---

## 7. Dark mode

| App | Mechanism | Default | Storage key | FOUC guard |
|---|---|---|---|---|
| Hub UI | `html.dark` class + Pinia `theme` store | light | `theme` | inline script in `index.html:10-16` |
| Hub Admin | same store copy | light | `theme` | inline script |
| Board | local `ref` in `App.vue`, `.dark` class | **system (`prefers-color-scheme`)** if unset | `theme` | none (set in `onMounted`) |
| River Mgr | Pinia `ui` store, **3-way light/dark/system**, live `matchMedia` listener | system | `kohakuriver-theme` | none |
| River Doc | inline script + tiny store | system if unset | `theme` | inline script (`index.html`) |
| Paper | **none** | light only | — | — |

Observations:
- The mechanism is always the Tailwind `class` strategy on `<html>`, together with Element Plus `dark/css-vars.css`.
- Defaults moved over time: **light by default (Hub, Oct 2025) → follow system (Board Jan 2026, River 2025-11+)**, and River added an explicit
  "System" option (sun / moon / laptop icons, `TheSidebar.vue:38-53`).
- Icon choice for the toggle varies: Hub shows `i-carbon-moon` / `i-carbon-asleep`, River Doc shows `i-carbon-sun` while dark (the action you would take), and Board uses **emoji** (☀️/🌙 for theme, 🎬/⏸️ for animations, `TheHeader.vue:120-136`).
  The Board emoji look like a quick-build shortcut. Carbon icons are the norm.
- Rule from CONTRIBUTING: "**Always** implement dark/light mode together using `dark:` classes" (`KohakuHub/CONTRIBUTING.md:334`). Hub UI follows it heavily (785 `dark:` uses).
- Dark-mode surfaces are **cool grays** everywhere (gray-800/900/950, slate-700/800/900, `#0a0a0a/#1a1a1a/#1f1f1f`), not warm.
  In dark mode he raises contrast deliberately: River's default button comment "Default button in dark mode - MORE contrast" (`main.css:230`),
  inset colors get *brighter* in dark, and entity/status colors move up one Tailwind step (500 → 400).
- Git history shows dark mode was retrofitted: Hub `294f1e3` "Add dark mode, fix some rendering issue" (2025-10-04, 21 files), followed by `391b2d6`
  "fix light/dark mode things" and `78ff7c4`/`232a300` "fix ui light mode problem".

---

## 8. Responsive and mobile

### 8.1 Breakpoint usage (counts of prefixes in .vue)

| App | `sm:` | `md:` | `lg:` | `@media` | Verdict |
|---|---|---|---|---|---|
| Hub UI | 84 | 75 | 35 | 13 | serious mobile pass (`8d2a22c`, `79cc2e0` "support mobile", `2cee3ce` "mobile support improvements" 2025-10-04/05) |
| Hub Admin | 1 | 4 | 0 | 2 | desktop-only (fixed 250px `el-aside`) |
| Board | 3 | 6 | 2 | 4 | JS-driven: `isMobile = innerWidth <= 900` via `matchMedia` |
| River Mgr | 38 | 9 | 6 | 3 | JS `isMobile < 768` + global Element dialog CSS |
| River Doc | 39 | 2 | 10 | 8 | most careful (commit `da28d2c` "mobile", 2026-02-10) |
| Paper | 0 | 0 | 0 | 0 | desktop-only |

### 8.2 Techniques he reuses

- **Header collapses into a right-side drawer** on mobile (Hub `el-drawer direction="rtl" size="280px"`, `TheHeader.vue:171-177`). The drawer repeats the nav with colored
  icons, a "CREATE NEW" overline group, and full-width large Login / Sign Up buttons.
- **44px touch targets**: `@media (max-width: 768px) { :deep(.el-button) { min-height: 44px } }` with the comment "Ensure mobile menu buttons have proper touch targets"
  (`TheHeader.vue:424-430`), and the hamburger `!min-w-10 !min-h-10`. River Doc uses `min-w-[36px] min-h-[36px]` on icon links. Its sidebar items grow from
  `py-1.5` to `py-2` below `lg`, with the comment "min-h for touch targets" (`uno.config.js`).
- **Off-canvas sidebars + backdrop**: River Manager (`-translate-x-full` ↔ `translate-x-0`, `bg-black/50` overlay with fade), Board (`position: fixed; top: 57px`, `rgba(0,0,0,.5)` backdrop,
  sidebar `80%` max `400px`), and River Doc (drawer `w-[85vw] max-w-80`, `bg-black/40` backdrop). All of them close on navigation (`watch(route.path)` in `DocLayout.vue:51-56`; `navigateTo` in River sidebar).
- **Floating action button for the docs tree on mobile**: `fixed bottom-4 right-4 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg active:scale-95` (`DocLayout.vue:4-10`).
  The control sits within thumb reach rather than in the header.
- **Stack on mobile, row on desktop**: `flex flex-col sm:flex-row`, buttons `w-full sm:w-auto`, selects `w-full md:w-80` (Hub everywhere).
- **Collapse grid columns into sub-lines** (Hub file list, §5.3) instead of horizontal-scrolling tables. Element tables still scroll (`overflow-x: auto`).
- **Tab strips bleed and scroll** (`-mx-4 px-4 overflow-x-auto min-w-max`).
- **Global Element Plus dialog sizing** (River `main.css:528-617`): `92vw` under 768px and `96vw` under 480px, with tighter paddings,
  `max-height: 70vh` scrolling body, a wrapping footer with `gap: 8px`, and full-width `el-select`/`el-input`.
- **Charts on mobile** (Board): cards are forced to 100% width (`flex: 0 0 100% !important`), card padding goes to 8px, default card height drops from 400 to 280,
  only 2 charts per page are shown, and resize is disabled (`[project]/index.vue:1269-1271, 1709`; `ConfigurableChartCard.vue:1384-1393`).
- **Touch/gesture hygiene** (River Doc `main.css:81-92`): `-webkit-tap-highlight-color: transparent` under `@media (hover: none)`, a `.touch-none` utility,
  `-webkit-overflow-scrolling: touch` for code blocks, and `touch-action: pan-x pan-y` on mermaid diagrams so page scroll still works (`MarkdownViewer.vue:232, 479`).
- Hub's viewport meta includes `maximum-scale=1.0, user-scalable=no` (`index.html:7`). This prevents iOS input zoom but also blocks pinch zoom, which is an accessibility cost. River and Board do not do this.

### 8.3 A mobile gap

River Manager's `components/layout/TheHeader.vue` contains the only mobile hamburger (`uiStore.toggleMobileMenu`), but `App.vue` never mounts `TheHeader`.
`grep toggleMobileMenu` finds no other caller, so below 768px the sidebar is hidden (`-translate-x-full`) and nothing on screen can open it.
Mobile there is half-wired. River Doc, built a few months later, fixes the equivalent problem with the FAB. A skill should copy the FAB pattern and not River Manager's header.

---

## 9. Loading, empty and error states

- **Loading** has three tiers:
  1. In-place centered spinner + caption: `text-center py-12/py-20`, `<el-icon class="is-loading" :size="40"><div class="i-carbon-loading"/></el-icon>`, then
     `<p class="mt-4 text-gray-500">Loading README...</p>` (`RepoViewer.vue:39-44, 288-293`). River uses `i-carbon-renew` + `text-muted` "Loading nodes...".
  2. `v-loading` directive on chart/table containers (Paper `conference.vue:481, 599`).
  3. River's non-blocking bottom-right operation toast (§5.6).
  He does not use skeleton screens.
- **Empty**: a big faint icon (`text-6xl text-gray-300 dark:text-gray-600`), a `text-lg font-medium` title, an optional `text-sm max-w-md` description and an action slot
  (River `components/common/EmptyState.vue`). Hub inlines the same anatomy (`i-carbon-document-blank text-6xl mb-4` + "No README.md found" + a primary "Create README" action).
  Board's empty state teaches the next step: "No projects found" / "Start tracking your ML experiments with KohakuBoard client library." (`pages/index.vue:53-60`).
- **Error**: Hub's original form is `i-carbon-warning text-6xl text-red-500` + "Repository Not Found" h2 + the error message (`RepoViewer.vue:45-48`).
  The newer contributor `ErrorState.vue` adds classified errors (gated / forbidden / not-found / upstream / CORS / generic), each with its own icon, title and *remediation hint*,
  an opt-in Retry button, and a collapsed `<details>` "Fallback sources tried (n)" table for power users (`ErrorState.vue:1-23, 148-160`).
- **Toasts**: `ElMessage.success/error` for every mutation, with the backend's `detail` preferred over generic text:
  `ElMessage.error(err.response?.data?.detail || 'Failed to approve task')` (`kohakuriver-manager/src/pages/admin/components/ApprovalsTab.vue:41`).
- NaN/Inf markers in charts (§6.2) are part of the same honesty: missing or invalid data is shown, not hidden.

---

## 10. Microcopy tone

- **Plain, short, sentence-case, developer-to-developer.** Examples: "Logged out successfully", "Task approved", "Invitation URL copied to clipboard",
  ``Updated ${user.username}'s role to ${newRole}``, "Loading projects...", "No repositories found", "View all models ->" (ASCII arrow, `pages/index.vue:110`).
- Product copy is borrowed from GitHub/HF conventions: "Create New Repository / A repository contains all project files, including revision history.",
  "Anyone on the internet can see this repository", "You choose who can see and commit to this repository", "Danger Zone", "Model Card / Dataset Card".
- Destructive confirmations state the concrete consequence and end with "This action cannot be undone!".
- Error hints (contributor work) are longer and procedural. They tell the user what to do and where to look:
  "This repository gates access — attach a Hugging Face token in your account settings, then retry." (`utils/http-errors.js:59`).
- Tooltips explain disabled states ("Commits not available for ${source} repos", "Drag to resize sidebar", "Show runs sidebar").
- No marketing fluff and no exclamation-heavy celebration. Emoji appear only in Board's header toggles and in CONTRIBUTING section headings.
  Terrarium uses the same register.

---

## 11. Design-decision comments found in code (verbatim)

- `kohakuriver-manager/uno.config.js`: "Light mode: white cards on light gray page - use DARKER inset colors" / "Dark mode: dark cards on darker page - use BRIGHTER inset colors for contrast".
- `kohakuriver-manager/src/styles/main.css:230`: "Default button in dark mode - MORE contrast". `:198`: "Remove all borders from buttons".
- `kohakuriver-doc/uno.config.js`: "Sidebar container — fixed position, solid bg"; "Mobile sidebar: full-width drawer capped at 20rem"; "all use bg-transparent as base, min-h for touch targets".
- `kohakuriver-doc/src/styles/main.css`: "Reset browser defaults that cause ghost backgrounds"; "Touch-friendly: prevent text selection during swipe"; "Mobile tap highlight removal".
- `kohaku-hub-ui/src/App.vue:49-53`: route keying "Same repo = same key = reuse component (no flicker)", along with `keep-alive :include="['RepoViewer']"`, which keeps tab switches inside a repo flicker-free.
- `kohaku-hub-ui/index.html:9`: "Apply theme immediately to prevent flash".
- `kohaku-hub-ui/src/components/layout/TheHeader.vue:425`: "Ensure mobile menu buttons have proper touch targets".
- `kohaku-hub-ui/src/style.css:177`: "Fix Element Plus buttons being invisible due to Tailwind reset in production builds" (the reason for the `!important` primary button rules).
- `kohaku-board-ui/.../LinePlot.vue:864`: "Preserve user's zoom/pan state across data updates (prevents range flickering)".
- `kohaku-board-ui/.../[project]/index.vue:48-55`: run color determinism docblock (§6.2).
- `kohaku-board-ui/src/composables/useAnimationPreference.js:7-13`: "Respects prefers-reduced-motion media query / Provides user toggle override / Persists preference".
- `kohaku-hub-ui/src/components/common/ErrorState.vue:69-73` (contributor): amber = actionable, gray = not actionable.

The recurring themes in these comments are **no flicker, no flash, contrast in dark mode, touch targets, and user state persisted**.

---

## 12. Git-history signals

- KohakuHub (602 commits). The UI timeline:
  - `14d88a2` "Update ui design" (2025-10-03, +1267 lines: profile, index, new-repo)
  - `294f1e3` "Add dark mode" (10-04)
  - `79cc2e0`/`8d2a22c` "support mobile" (10-04) and `2cee3ce` "mobile support improvements" (10-05, header +82 lines)
  - `5067319` "fix layout" and `375b849` "fix docs build and some button design" (10-05)
  - `391b2d6` "fix light/dark mode things" (10-06)
  - `945b542` "Redo the Admin portal for better UI/UX" (10-18, +3.5k lines: colors.css, ChartCard, GlobalSearch, DatabaseViewer)

  So the order was: build the feature, then within 48 hours a dark-mode pass, then a mobile pass, then polish.
  Kohaku writes terse messages ("fix ui bug", "update UI"). The `feat(ui/...)` conventional commits from 2026-04 are narugo1992's.
- KohakuRiver (379 commits). UI work: `909aef6` "update icon usage" (2025-11-27), `6c1edfc` "improve UI" (2026-01-29), `c3bf3cd` "improve GPU card design and fix flickering issue" (2026-01-29, again about flicker),
  `8bf2e3a` "fix gpu selector style", `ccb664e`/`ed62e66` doc site + search (02-09/10), and `da28d2c` "mobile" (02-10; padding scale-down, 85vw drawer, touch targets, mermaid touch).
- KohakuBoard and KohakuPaper: one squashed commit each, so there is no history to mine.

---

## 13. Cross-project comparison vs. KohakuTerrarium

### 13.1 Shared with Terrarium (= his stable taste and defaults)

1. **Stack**: Vue 3 `<script setup>` in JS (no TS) + Element Plus + UnoCSS with Iconify carbon/ep + Pinia + `unplugin-vue-router` file routes + auto-import/components resolvers + `rolldown-vite`.
   It appears in every app in this slice and in the 2022 template.
2. **Carbon icons as the main visual vocabulary**, `scale: 1.2`, rendered as `<div class="i-carbon-x">` / `<span>`, with dynamic icon classes explicitly safelisted.
3. **Utility-first templates plus a small set of named Uno shortcuts** (`card`, `card-hover`, `btn-primary`, `btn-secondary`, `input`, `page-title`, `section-title`, `text-muted`).
   Terrarium keeps the same naming idea (`card`, `card-hover`, `section-title`, `text-secondary`, `btn-*`).
4. **Dark mode is first-class** via the `html.dark` class + Element `dark/css-vars.css`, persisted in localStorage, with an inline pre-mount script to avoid flash where he remembered it.
5. **One accent hue per domain concept** (model = blue, dataset = green, space = purple, org = orange; River's per-metric icon hues). Terrarium formalizes this as the gemstone accents.
6. **Semantic status colors** (green/yellow/red/gray plus soft `*-100` badge fills with `dark:*-900/50`), and amber as "needs attention / actionable".
7. **Named surface layers instead of raw grays**: River's `app-page / app-card / app-surface / app-inset` is the direct ancestor of Terrarium's `warm-*` surface scale and CSS-var emission.
8. **Flat, borderless Element Plus restyle**: River removes button borders and uses 8px-radius buttons, 12px-radius dialogs and big soft popover shadows. Terrarium's buttons (`rounded-lg … border-none`) continue that direction.
9. **Mobile is a deliberate second pass**: drawers, backdrops, 36–44px touch targets, close-on-navigate, stack-on-mobile, `hover:none` tap-highlight removal. Terrarium's "careful touch/mobile handling" is the mature version.
10. **Anti-flicker obsession**: keyed route reuse + keep-alive, Plotly `uirevision`, no-flash theme script, the "fix flickering issue" commit.
11. **Persist user layout and preferences** (sidebar width, chart cards, run colors, animation toggle, theme, sort preference in Hub `utils/repoSortPreference.js`, tar listing prefs).
12. **Plain, sentence-case developer microcopy**, with backend `detail` surfaced in toasts and consequence-stating destructive confirms.
13. **JS-only + JSDoc + prettier + "always dark+light" written into CONTRIBUTING**.

### 13.2 What differs (= evolution or per-product choice)

| Aspect | Hub/Board/River/Paper | Terrarium | Read as |
|---|---|---|---|
| Accent palette | stock Tailwind blue `#3b82f6`/`#2563eb` (Admin/Paper: Element `#409EFF`) | custom gemstones, iolite `#5A4FCF` primary | **evolution**: from defaults to a designed identity |
| Neutrals | cool gray/slate, Bootstrap greys in Admin | warm stone `warm-50…950` (`#F7F5F2 … #1A1816`) | **evolution** |
| Card | `rounded-lg` + border + `shadow-sm/md`, hover shadow | `rounded-xl` + translucent border, no shadow | **evolution** toward flatter, quieter cards |
| Gradients | blue→purple hero/wordmark/admin header, gradient stat tiles | none | early habit, **dropped** |
| Type scale | ad-hoc Tailwind sizes per breakpoint | semantic font-size tiers | **evolution** |
| Theme default | light (Hub 2025-10) → system (Board, River) → 3-way toggle (River) | — | evolution toward respecting the OS |
| Tokens | Uno `theme.colors` (River) or a separate `colors.css` var sheet (Admin) | Uno theme + preflight emitting `--kt-color-*` vars | Terrarium merges both approaches |
| Charts | Plotly (Board/River/Paper), Chart.js only in Hub Admin | (see other slices) | Plotly = his default for data apps |
| Shell | top-nav site (Hub, Paper, Docs) vs dark fixed sidebar console (River, Admin) vs resizable workspace (Board) | icon-rail `w-14` nav (`nav-rail` shortcut) | per-product. Terrarium's rail is River's collapsed `w-16` sidebar made permanent and warm |
| Mobile completeness | Hub good, River Doc best, River Mgr half-wired, Admin/Paper none | careful | improved over time |
| Prettier | default (Hub/Board/Paper) vs no-semi/singleQuote/120 (River) | no-semi/doubleQuote/100, `.vue` printWidth 9999 | per-repo, no fixed preference |
| Motion | Board: reduced-motion + user toggle | — | Board-specific, worth adopting |

### 13.3 Which choices look like his deliberate defaults

**Strong defaults (keep in the skill):**
- The full stack in 13.1 (1–3). It never varies.
- Dark + light implemented together on every surface, a no-flash inline theme script, Element dark css-vars imported, and charts re-rendered on theme change (MutationObserver on `<html>`).
- Semantic layering of surfaces (page < card < surface < inset). In dark mode inner layers get **brighter** and contrast is pushed up.
- One hue per entity type, applied consistently across icon, rule line, menu and badge.
- Element Plus restyled to be flat: no borders, `rounded-lg` (8px) buttons, `rounded-xl` (12px) dialogs, soft large shadows on floating layers.
- Mobile pass: drawer/off-canvas with backdrop, close on navigate, 36–44px targets, `flex-col sm:flex-row`, full-width buttons, Element dialogs at 92vw/96vw, horizontal-scroll tab strips, grid rows that fold into sub-lines.
- For data viz: Plotly with transparent background, faint gray grid at 0.2–0.3 alpha, `x unified` hover with cross-axis spikes, hidden modebar replaced by own buttons,
  `uirevision` to keep zoom, scattergl + adaptive downsampling, EMA smoothing with a faded raw line underneath and "smoothed (raw)" hover,
  explicit NaN/±Inf markers, deterministic hash-based series colors with lightness/saturation guard rails, and hover sync across charts.
- Non-blocking feedback: toasts for mutations, an operation pill instead of full-page blocking, centered icon + caption for empty and loading states, and the backend's own error detail surfaced.
- Persisting user-tuned layout in localStorage.

**Weak or accidental (do NOT copy):**
- Tailwind default blue as the brand color, blue→purple gradients, gradient stat tiles, `#667eea→#764ba2`. Terrarium's gemstones supersede them.
- Vite-template leftovers in Hub `style.css` (`#646cff` links, `h1 3.2em`, `.card { padding: 2em }`).
- The `<div class="w-0 h-0 p-0 m-0">` spacer hack. Fix `.el-button + .el-button { margin-left: 0 }` or use `gap` instead.
- `user-scalable=no` in the viewport.
- Emoji as icons (Board header).
- Debug `console.log` everywhere in chart code.
- The Paper and Admin approach of no dark mode and no mobile.
