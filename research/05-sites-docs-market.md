# 05 — Public sites, docs, marketplace, and older projects

Scope: `kohaku-lab-home` (2025-10 → 2026-03), `kohaku-lab-homepage` (2025-04), `Kohaku-Docs` (2026-06),
`TerrariumMarket/site` (2026-05 → 2026-11), `KohakuTerrarium/docs` + `extensions/vscode`,
`weekly` (2023), `PixelGen/frontend` (2022–2024), `ProjectTemplate-Vue` (2022), `KohakuBlueleaf` profile README.
All paths are relative to `<clones>/`. Line numbers are from the files as of 2026-11-12.

The short version: there are two visual families in his public work.

1. **Gem/warm family** (2026, current): `Kohaku-Docs`, `TerrariumMarket`, the KT docs site, and through
   them the KT app. It uses warm stone neutrals with gem accents and iolite as the primary. It is quiet,
   bordered, and has almost no shadows.
2. **Slate/gradient family** (`kohaku-lab-home`, 2025-10): dark-only Tailwind slate, sky→pink gradient
   text, blurred glow blobs and the standard "SaaS landing" sections. It is the lab's marketing site. It
   predates the gem system and was never migrated. Treat it as the **legacy marketing look**, not the
   target.

Before that came template-adopt phases (AstroWind in 2025, Bootstrap + Element Plus in 2022). They show
what he dropped.

---

## 1. kohaku-lab-home (Astro 5 + Vue islands + UnoCSS) — current lab homepage

### 1.1 Stack and history
- `package.json`: astro ^5.15, @astrojs/vue, element-plus ^2.11 (installed but barely used), vue ^3.5,
  UnoCSS ^66 with `presetUno + presetAttributify + presetIcons` (collections `ep` + `carbon`, `scale: 1.2`)
  (`uno.config.js:1-22`). `injectReset: true` (`astro.config.mjs:9`).
- 22 commits. First commit 2025-10-30 ("first commit", "basic template implemented", "add blog template",
  "improve layout designs"). Most of the work happened in one night (2025-10-30/31). A 2026-03-28
  refresh was co-authored with Claude Opus 4.6.
- Content is config-driven. `src/config/{projects,members,collaborators,site,theme}.config.js` hold
  JSDoc-typed arrays, and pages map over them. This is the same "data in config, UI maps it" pattern
  as `Kohaku-Docs`' `docs.config.js` and Market's `config.js`.

### 1.2 Tokens (`src/config/theme.js`)
- Primary is Tailwind blue (`#3b82f6` at 500), defined as a 50–900 ramp (`theme.js:24-35`).
- Tag colours are 12 Tailwind pastel bg + dark text pairs, e.g. `yellow {bg:#fef08a,text:#854d0e}`,
  `fuchsia {#f0abfc,#701a75}` (`theme.js:41-102`).
- Gradients: `hero: from-sky-500 via-blue-500 to-pink-300`, `text: from-sky-500 to-pink-300`
  (`theme.js:108-114`).
- Backgrounds use the slate scale: base `#0f172a`, card `#1e293b`, section `#020617` (`theme.js:120-125`).
- Radius: sm 2 / md 6 / lg 8 / xl 12 / 2xl 16. Transitions: 150/300/500 ms (`theme.js:178-195`).
- The theme file is a single source that UnoCSS reads (`uno.config.js:2,77`). This "tokens in a JS
  module, imported by the uno config" habit carries into Kohaku-Docs, where the `gems` object lives in
  `uno.config.js`.

### 1.3 UnoCSS shortcuts (`uno.config.js:24-73`)
```
btn          px-4 py-2 rounded-md transition-all duration-300 font-medium inline-flex items-center gap-2
btn-primary  btn bg-blue-600 text-white hover:bg-blue-700 active:scale-95
btn-outline  btn border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white
card         bg-slate-800 rounded-lg shadow-md border border-slate-700 p-6
card-interactive  card-hover cursor-pointer hover:-translate-y-1
container-base    max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
container-narrow  max-w-3xl ...
section           py-12 sm:py-16
section-title     text-3xl sm:text-4xl font-bold text-slate-100 mb-8
gradient-text     bg-gradient-to-br from-sky-500 to-pink-300 bg-clip-text text-transparent
tag               px-3 py-1 rounded-full text-sm font-medium inline-block
```
The vocabulary (`btn-primary`, `btn-secondary`, `card`, `card-hover`, `section-title`, `text-muted`,
`input`, `flex-center`, `flex-between`) is the same shortcut naming he reuses everywhere. Only the
values change between projects.

### 1.4 Typography
- Inter 300–900 is loaded from Google Fonts (`src/layouts/Base.astro:58-63`). The stack is `'Inter',
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...` (`Base.astro:93-103`).
- Hero H1 is `text-5xl sm:text-6xl md:text-7xl font-bold` with gradient text (`Hero.vue:15-17`). The
  subtitle is `text-xl sm:text-2xl md:text-3xl text-slate-200 font-medium` and the body is `text-lg
  text-slate-400 max-w-3xl leading-relaxed`.
- No mono or display font.

### 1.5 Hero / landing composition (`src/components/Hero.vue`, `src/pages/index.astro`)
- The hero is centred and `py-20 sm:py-32`. Two blurred glow orbs (`w-96 h-96 bg-blue-500/20` and
  `bg-pink-500/20`, `blur-3xl`) sit behind it with a 4 s `pulse-slow` opacity animation (0.3↔0.5),
  the second offset by 2 s (`Hero.vue:3-11, 102-118`).
- Order: gradient H1 "Kohaku Lab" → tagline "Virtual Open Source AI Research Lab" → paragraph → 3 CTAs
  (primary, outline, secondary/GitHub), each with a Carbon icon on the left (`Hero.vue:32-50`) → a
  2×2 / 1×4 stats grid (`7K+ Github Stars of Members`, `2M+ HuggingFace Downloads`, `18+ Active
  Projects`, `100% Open Access`). The stats are glassy tiles: `rgba(30,41,59,.5)` with
  `backdrop-filter: blur(4px)` (`Hero.vue:53-74, 120-128`).
- Page section rhythm (`index.astro:46-239`):
  Hero → Featured Projects (`bg-slate-950/50`, 3-col grid of 6) → About (2-col: copy + 2×2 icon
  "key point" cards) → Team (alternating `bg-slate-950/50`, a hairline divider labelled "CORE TEAM" in
  `text-sm uppercase tracking-wider`, then members) → Blog (3-col) → CTA band
  (`bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-y border-blue-500/20`) → Footer.
- Section bands alternate a transparent background with `bg-slate-950/50`. Every section header is
  centred `section-title` + `section-subtitle`, and every section ends with a centred "View All X"
  `btn-primary`.

### 1.6 Cards
- `ProjectCard.vue` is a whole-card `<a>` with `card-interactive group` (hover lifts `-translate-y-1`).
  - It has an optional 2.4:1 thumbnail with `group-hover:scale-105` and a dark gradient overlay that
    fades in on hover (`ProjectCard.vue:9-37`).
  - Without an image, it shows a **4 px accent bar** whose gradient comes from the first two tag
    colours (`ProjectCard.vue:39-44, 102-129`). Commit `c0de153`: *"ProjectCard shows a colored accent
    bar (derived from tag colors) when no image is provided. BlogPostCard no longer renders
    thumbnails."* This is the first appearance of the **"category → gradient" mapping** that
    TerrariumMarket later formalises (tag → `from-X to-Y` gem gradient).
  - The title turns into gradient text on hover. The description uses `line-clamp-3`. Tags are pill
    badges. The footer row has live GitHub stars and forks (fetched client-side, `9d0ef5a`) plus a
    "View Details →" link whose arrow moves `translate-x-1` on hover.
- `MemberCard.vue` is an accordion card. The header has a 64 px round avatar with `border-2
  border-slate-600`, name, role in `text-blue-400`, and location with an icon. On the right is a
  chevron with a tiny caption, "Details"/"Close" (`text-[10px] uppercase tracking-wide`). The
  expansion uses a `max-h-0 → max-h-[1000px]` transition (`MemberCard.vue:1-68`). It is
  keyboard-accessible (`role=button`, Enter/Space).
- Image fallbacks are everywhere: an `onerror` swaps to an icon placeholder (commit `a321b94` "add
  image fallback").

### 1.7 Navigation
- The navbar is sticky with `bg-slate-900/95 backdrop-blur-sm border-b border-slate-800`.
  - The logo is a 40 px gradient square (`from-sky-500 to-pink-300`, `rounded-lg`) with a white "K",
    followed by the gradient wordmark (`Navbar.vue:2-14`).
  - Desktop links are `text-slate-300 hover:text-white`. GitHub appears as an icon.
  - Mobile has a hamburger that toggles to a close icon. The dropdown sheet slides in `opacity-0
    -translate-y-4 → 0` over 300 ms ease-out and leaves over 200 ms ease-in (`Navbar.vue:53-90`). An
    outside click closes it.
- The projects page has client-side tag filter pills. The active pill is `bg-blue-600 text-white`, the
  rest are `bg-slate-700` (`pages/projects/index.astro:65-112`). There is an empty state with an icon,
  "No projects found" and a "Try adjusting your filters" message.
- Accessibility basics: a skip link, `:focus-visible` with a 2 px `#3b82f6` outline and 2 px offset,
  a selection colour of `rgba(59,130,246,.3)`, and a custom 10 px dark scrollbar (`Base.astro:66-160`).

### 1.8 Dark mode, responsive, motion
- **Dark only** (`<html class="dark">`, `Base.astro:24`). There is no toggle.
- Grids are `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`. CTAs stack `flex-col sm:flex-row`.
- Motion is generous here compared with his later work: pulsing blobs, lift on hover, image zoom,
  `active:scale-95`, and a tag `hover:scale-105`.

### 1.9 Copy tone (EN only)
- Self-deprecating, plain and anti-corporate. Examples: *"No grand mission. Just people building things
  they want to exist, sharing them openly, and having fun in the process."* and *"Simple as that —
  **scratch your own itch**."* (`index.astro:92-96`).
- From the About page diff (`f0ad74e`): *"Need a cluster manager without enterprise bloat?
  KohakuRiver. Want a single-file database? KohakuVault. Scratch your own itch."* and *"Not bad for
  solving our own problems."*
- The blog uses the same voice: *"We're not your typical research lab. There's no physical building, no
  corporate backing, and no formal hierarchy."* (`content/posts/introducing-kohaku-lab.md`).
- Bold `text-white` is used inside muted paragraphs to pick out the key phrase.

---

## 2. kohaku-lab-homepage (2025-04, AstroWind fork) — the abandoned first attempt

- One commit, "Template updates for Lab website" (2025-04-09). `package.json` still has the name
  `@onwidget/astrowind` and the README is the stock AstroWind README.
- Customisation was minimal, all in `src/components/CustomStyles.astro:22-62`:
  - Font: `'Inter Variable'` from `@fontsource-variable/inter`. A commented list of candidates sits
    above it: DM Sans, Nunito, Outfit, IBM Plex Sans, Space Grotesk, Urbanist… (`CustomStyles.astro:4-19`).
    He tried several and kept **Inter**.
  - Colours: primary `rgb(1 97 239)`, secondary `rgb(1 84 207)`, accent `rgb(109 40 217)` (violet).
    Dark page background `rgb(3 6 32)` (near-black navy). The selection colour is `lavender`.
- The copy is generic consultancy text ("Pioneering AI Research and Development", "Shaping the Future
  with Artificial Intelligence", research areas such as "AI Ethics & Safety",
  "Project 'Amber'", in `src/pages/index.astro:19-120`). None of it matches his voice.
- **Lesson**: he abandoned a full-featured third-party template (Tailwind, `@astrolib/seo`, RSS,
  widgets such as Pricing and Testimonials) six months later. The replacement was a hand-rolled
  Astro + Vue + UnoCSS site with config files and his own shortcuts, and a voice that says what the
  lab actually does. He prefers owning a small, legible stack to configuring a big one.

---

## 3. Kohaku-Docs (2026-06) — his docs-site generator, canonical gem theme

### 3.1 Stack
- `package.json`: Vue 3.5, `vite: npm:rolldown-vite`, UnoCSS 66 (`presetWind3({dark:'class'})`,
  `presetAttributify`, `presetIcons` with Carbon only), Element Plus 2.13, Pinia 3,
  `unplugin-vue-router` (file-based routing), `unplugin-vue-components`, @vueuse/core, markdown-it with
  anchor, attrs, container, footnote, katex, task-lists and toc-done-right, highlight.js, minisearch,
  DOMPurify and gray-matter.
- It ships as an npm CLI (`kohaku-docs gen|dev|build|preview <docsDir>`, README). The README describes
  it this way: *"Ships a CLI and a warm neutral + gem-accent theme. Build output is a single-page app
  that deploys to any static host."*
- `docs/en/theme.md:11`: *"The default look is a warm earthy neutral palette accented by jewel tones.
  It originated in KohakuTerrarium's frontend and was ported to `kohaku-docs` for visual consistency
  across the Kohaku stack."*
- The repo has a single squashed commit (2026-06-13), so there is no style history.

### 3.2 Tokens — the gem system in full (`uno.config.js:17-40`, `src/styles/main.css:13-95`)
Each gem has a `light / DEFAULT / shadow` triplet:

| gem | light | DEFAULT | shadow |
|---|---|---|---|
| sapphire | #D6E3F8 | #0F52BA | #082567 |
| aquamarine | #D4EDE8 | #4C9989 | #1B6B5A |
| taaffeite | #E8D5ED | #A57EAE | #6B4670 |
| **iolite** (primary) | #DDD0F0 | #5A4FCF | #312A7A |
| amber | #F5E6C8 | #D4920A | #8B5E00 |
| coral | #F5D5D5 | #D46B6B | #8B3A3A |
| sage | #D5E8DA | #5A9E6F | #3A6B48 |

Warm neutrals (`uno.config.js:28-40`): 50 `#F7F5F2`, 100 `#EFECE7`, 200 `#E0DBD4`, 300 `#C9C2B9`,
400 `#A8A098`, 500 `#8A8480`, 600 `#6B6560`, 700 `#4D4845`, 800 `#3A3632`, 900 `#252220`, 950 `#1A1816`.
A `brand` 50–900 ramp is synthesised around iolite (`uno.config.js:79-90`).

> Drift: TerrariumMarket's "verbatim port" uses warm-300 `#C5BFB7`, 400 `#A09A92`, 600 `#6A645F`,
> 700 `#4A4540`, 900 `#2A2724` (`TerrariumMarket/site/uno.config.js:109-121`). These are slightly
> different from Kohaku-Docs. A skill should pick one canonical scale. The Market values claim to
> mirror the KT frontend.

Semantic CSS variables (`main.css:35-75`, `:root` light / `html.dark`):
```
--app-bg #f7f5f2 / #1a1816        --app-surface #fff / #252220
--app-surface-hover #efece7 / #3a3632
--app-border rgba(58,54,50,.16) / rgba(232,224,216,.12)   (translucent warm, not grey)
--app-text #3a3632 / #e0dbd4     --app-text-strong #252220 / #f7f5f2
--app-heading #1a1816 / #fff     --app-text-muted #6b6560 / #8a8478
--app-link iolite / iolite-light  --app-accent iolite / iolite-light
--app-code-bg #efece7 / #1e1c1a   --app-tag-bg rgba(58,54,50,.06) / rgba(247,245,242,.08)
```
- Element Plus is re-skinned through its variables: `--el-color-primary: var(--gem-iolite)` plus a
  light-3/5/7/8/9 ramp, `--el-bg-color: var(--app-surface)`, and `--el-border-color-hover:
  var(--app-accent)` (`main.css:51-74`). In addition `.app-shell .el-button { border-radius: 9999px }`
  (`main.css:225-237`), so EP buttons become pills.
- Semantic mapping, documented in `docs/en/theme.md:49-58`: primary/link → iolite, tip → sage,
  warning → amber, danger → coral, details → iolite, decorative → sapphire/taaffeite.
- Dark-mode accent swap rule: in dark mode, links, accents and token colours use the gem's
  **light** variant. In light mode they use DEFAULT or **shadow**. This holds throughout `main.css`.

### 3.3 Typography (`main.css:1-11`, `docs/en/theme.md:119-129`)
- Sans: `Inter, ui-sans-serif, system-ui, ...`. **Inter is named but never loaded.** There is no font
  link or import in `index.html` or `main.js`, so most users get the system UI font. Market does the
  same (`site/src/style.css:4`).
- Mono: `"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
  (`main.css:678-694`).
- Root font size is **15.5px** on desktop and 16.5px below 1024px (`main.css:11, 1002-1005`). Body
  line-height is 1.6. Prose line-height is **1.78** (1.8 on mobile).
- Page title: `clamp(1.9rem, 3vw, 2.9rem)`, weight 700, line-height 1.08, `letter-spacing: -0.02em`
  (`main.css:491-496`). `text-balance` is applied on H1s.
- **Kicker**: `uppercase, letter-spacing .16em, .8rem, 600, color: accent` (`main.css:483-489`). Every
  page header is kicker → H1 → summary → tags → meta bar (`DocsView.vue:47-59`). The kicker is a
  signature element.
- Prose measure is `max-width: 72ch`, but code blocks, callouts, tables and KaTeX break out to
  `min(100%, 1100px)` (`main.css:573-591`).

### 3.4 Layout / IA
- The header has a 4.25rem minimum height, `border-bottom: 1px var(--app-border)`, and the same
  background as the page (no elevation). It holds the title in 1.1rem/700/-0.01em, then the site
  description (desktop only, muted), then search, locale switcher, and a circle EP button for the theme
  toggle with a sun/moon icon (`App.vue:3-18`, `main.css:159-203`).
- **Three panel columns** (`main.css:294-374`): sidebar `260px` (280 at ≥1440), article flexible, TOC
  `220px` (240 at ≥1440). Each is an `.app-panel`: 1 px border, `0.875rem` radius, surface background.
  The gutters are `1.25rem 1.5rem` and the maximum width is 1600 px.
  - Desktop locks the viewport and gives each column its own scroll pane (`html, body, #app {height:
    100%; overflow: hidden}` at ≥1024px).
  - Below 1024 px the document scrolls naturally. The comment explains why: *"so mobile browser chrome,
    momentum scrolling, and pull-to-refresh keep working"* (`main.css:108-118`).
- The article pane padding is `2.25rem 2.5rem` on desktop and `1.5rem 1.75rem` on mobile.
- Mobile replaces the side columns with a toolbar of two EP plain buttons ("Browse docs" and "On this
  page"). The sidebar opens in a left `el-drawer` at 88 % width, and the TOC drops down inline with a
  45dvh scroll (`DocsView.vue:12-29`).
- **Sidebar**:
  - Groups have a chevron that rotates 90°, `0.75rem` radius buttons and 600 weight
    (`SidebarGroup.vue`, `main.css:250-272`). Open/closed state persists through `useSidebarState`.
  - Children sit on a `border-left` rail (`.sidebar-children`).
  - The active link is `color-mix(iolite 14%, transparent)` with iolite text and weight 500
    (`main.css:923-932`).
  - Entries can be a filename string, `{text, file}`, or `{text, autoDir, recursive}` (README).
- **TOC**: there is a 1 px left rail, and each link has a 2 px left border that turns accent when
  active. The text is 0.88rem muted. Depth is indented by `0.8 + depth*0.75 rem`
  (`DocToc.vue:20-23`). Scroll-spy runs on rAF with a "heading passed when within 48 px of pane top"
  threshold. A click smooth-scrolls and calls `history.replaceState` for the hash (`DocToc.vue:25-55`).
- **Breadcrumbs** sit above the page header. **Prev/Next** are two `app-panel app-card-link` tiles
  with an uppercase xs "Previous"/"Next" label and the title; Next is right-aligned
  (`PrevNextNav.vue`).
- **Meta bar**: "Updated {date}" plus an "Edit this page" link, in xs muted text (`PageMetaBar.vue`).
- **Search**: minisearch over title, summary and body.
  - Desktop has an inline EP input (w-64/72) with a `Ctrl K` hint suffix and a popover of results
    below it.
  - Mobile has a circle button that opens a teleported overlay sheet: max-width 40rem,
    `color-mix(bg 50%)` backdrop with `blur(2px)`, results capped at 60dvh.
  - Arrow-key navigation and Enter work (`DocSearch.vue`, `main.css:455-475`).
  - Results from the fallback locale are tagged "(from English)".
- **i18n**: per-locale sidebar, home and editBaseUrl, with URLs like `/zh-TW/docs/...`. The
  `missingTranslation` policy can be `fallback`, `banner` or `home`.
  - A fallback page shows a warning callout: "Translation not available — showing original content."
  - The banner policy shows a tip callout instead: "This page is still being translated."
    (`DocsView.vue:40-45`, `locales/en.js`).
  - Six UI dictionaries ship: en, zh-TW, zh-CN, ja, de, ko.
- The page title strips a duplicated leading `# Title` from the markdown when it matches the
  frontmatter title (`stripTitleHeading`, `lib/markdown.js:96-110`).

### 3.5 Code blocks and callouts
- Code blocks:
  - The block is a bordered `0.75rem`-radius box on `--app-code-bg`.
  - A `::before` header shows `data-language` in **0.7rem uppercase with .08em tracking**, muted,
    separated by a hairline (`main.css:687-745`).
  - Code is 0.88rem with line-height 1.6 and 0.95rem padding, and scrolls horizontally with
    `width: max-content`.
  - A copy button sits at the top-right as a 1.7rem ghost square. On success it turns **sage**
    (`main.css:697-734`).
- **Gem-tinted highlight.js** (`main.css:761-844`):
  | token | light | dark |
  |---|---|---|
  | keyword/type/built_in | taaffeite-shadow | taaffeite-light |
  | string/attr/regexp | sage-shadow | sage-light |
  | title/function/name | iolite | iolite-light |
  | number/symbol/meta | coral-shadow | coral-light |
  | variable/selector | amber-shadow | amber-light |
  | comment | text-muted, italic | same |
- **Callouts** (`main.css:846-888`): 1 px border with a **4 px left border** in the gem colour and
  `0.75rem` radius.
  - Light-mode background: `color-mix(in srgb, gem-light 55%, surface)`. Details uses 45 %.
  - Dark-mode background: `color-mix(gem-shadow 30%, surface)`.
  - Only `:::tip`, `:::warning` and `:::details` containers are registered (`lib/markdown.js:76-78`).
    `.danger` CSS exists but has no container, which is a gap.
- Blockquote: a 3 px left border of `color-mix(accent 55%, transparent)` in soft text colour.
- Inline code: `--app-tag-bg` chip, 0.375rem radius, `0.15rem .4rem` padding.
- Links: accent colour, underline with `text-underline-offset: .18em` and 1 px thickness. The heading
  anchor `#` sits **after** the heading at 0.6 opacity and goes to 1 on heading hover.
- Tables: `display:block; overflow-x:auto`, 1 px warm borders, header row on surface-hover with
  weight 600.

### 3.6 Home page (`views/HomeView.vue`)
- There is no marketing hero. The home is one **app-panel** (`p-6 sm:p-8 lg:p-10`, max-w-4xl text)
  containing a kicker, an H1, a description in `text-base sm:text-lg leading-7`, and pill actions.
  - Primary actions are iolite-filled pills, `0.55rem 1.1rem`, .92rem, weight 500.
  - Secondary actions are surface pills with a border.
- Below it is a **card grid** (`md:grid-cols-2 xl:grid-cols-3 gap-4`) of `app-panel app-card-link`
  cards with a title and a muted description.
- Card hover: the border mixes 45 % accent, a soft accent glow appears (`0 6px 24px -18px
  color-mix(accent 60%)`), and the card moves `translateY(-1px)`. All of it runs at 160 ms ease
  (`main.css:410-424`). This is the **entire motion vocabulary**: 160 ms colour, border and opacity
  transitions plus a 1 px lift.
- Focus: `outline: 2px solid var(--app-accent); outline-offset: 2px` (`main.css:991-994`).

### 3.7 Dark mode
- A Pinia `theme` store stores `kohaku-docs-theme` in localStorage, honours `prefers-color-scheme` on
  first load, toggles `html.dark` and sets `data-theme` (`stores/theme.js`). Unlike Market, there is no
  pre-paint script.

---

## 4. KohakuTerrarium/docs — how he writes docs (content IA)

- The site is built with **kohaku-docs** (`docs/docs.config.js`), live at `terrarium.kohaku-lab.org`
  (commit `3cb3e5d0`, "Add docs site link to README files"). It has its own favicon in
  `docs/docs-assets/favicon.png`.
- **Diátaxis IA**. `docs/en/README.md`: *"These docs are split into four stacks: tutorials (guided),
  guides (task-oriented), concepts (mental models), and reference (exhaustive lookup). Pick whichever
  matches where you are."* The sidebar order is Overview → Tutorials → Guides → Concepts (with nested
  groups Foundations / Modules / Multi-agent / Python-native / Implementation notes) → Reference →
  Development (`docs.config.js:17-148`).
- `sidebarStructure` is a single shared ordered file list. Each locale only translates the `text`
  labels, for example `教學 / 使用指南 / 核心概念 / 參考 / 開發` in zh-TW and `教程 / ... / 开发` in zh-CN
  (`docs.config.js:154-191`). Missing pages fall back to English. Around 101 English pages exist, plus
  zh-TW and zh-CN mirrors.
- Every page has frontmatter with `title`, `summary` and `tags`. The summary becomes the lead paragraph
  under the H1.
- The README home has a **"Pick a path" table** that maps *"You are... → Start here"* (Evaluating /
  Operating / Building / Embedding / Contributing) to 2–3 links each.
- **Tutorial template** (`tutorials/first-creature.md:1-30`): a bold **Problem:** / **End state:** /
  **Prerequisites:** block, then `## Step N: <verb phrase>`, each opening with "Goal: ...", then a
  command, an explanation, and a "Verify:" block.
- Code fences by frequency: yaml 151, python 140, bash 120, then js/text/powershell. Callouts are
  written as `> **Bold lead sentence.** explanation` blockquotes instead of `:::` containers. No
  `:::` containers are used in the English docs.
- Home config:
  - EN kicker: *"Framework for agents, not another agent"*. Title "KohakuTerrarium Docs".
  - zh-TW kicker: *"框架是用來建 agent 的,而不是又一個 agent"*. zh-CN: *"框架是用来建 agent 的，不是又一个 agent"*.
  - Actions: "Getting started" (primary), then GitHub and "kt-biome (showcase pack)" as secondary.
    The cards point at the concept, tutorial, guide and reference entry points and ROADMAP
    (`docs.config.js:355-380`).
- **Terminology care in ZH** (commit `c96148f9`): *"The literal '生物' (organism) reads as too abstract
  for the agent concept in this framework. '智能体' matches how the term is used in mainstream
  Simplified Chinese AI literature..."*. zh-CN therefore uses 智能体 while zh-TW keeps 生物. He localises
  per region rather than transliterating.
- The project README pitch is *"The machine for building agents, so you stop rebuilding the machine
  every time you want a new one."* It is followed by badges, a language switcher (`English · 繁體中文 ·
  简体中文`, with the current one bold), a Documentation link, and then **"See it run (60
  seconds)"**: four commented shell commands (`KohakuTerrarium/README.md:1-30`). The banner image
  comes first, then a one-line bold value proposition.

## 5. KohakuTerrarium/extensions/vscode — webview UI

- A sidebar webview (`viewsContainers.activitybar`) built with Vite as an IIFE lib. It **reuses the
  Dashboard's real components and UnoCSS config**: `UnoCSS({ configFile:
  '../../src/kohakuterrarium-frontend/uno.config.js' })`. Stores, i18n, Element Plus and the chat UI
  are aliased to the production frontend, with shims for host-only seams
  (`extensions/vscode/vite.config.mjs:53-170`). The comment explains: *"Reuse the Dashboard's real
  utility + Carbon icon atoms so shared components ... keep their production styling instead of a
  second hand-rolled stylesheet."*
- **Theming defers to the host.** `hostTheme.mjs` mirrors VS Code's `vscode-dark` /
  `vscode-high-contrast` body classes onto `html.dark`, with a special case for `vscode-high-contrast-light`.
  `style.css:32-46` maps the conversation tokens onto VS Code variables:
  `--kt-conversation-accent: var(--vscode-textLink-foreground)`, `--kt-conversation-surface:
  var(--vscode-editorWidget-background)`, `--font-mono: var(--vscode-editor-font-family)`, and so on.
  The gem palette is **not** forced inside VS Code.
- Pattern: shared components read a **scoped token layer** (`--kt-conversation-*`), and each host
  (Studio, VS Code) supplies values. `docs/en/dev/frontend.md:240-258`: *"VS Code supplies its own
  scope and maps tokens to editor theme variables."*
- The README tone is precise and operational: bounded behaviours, explicit failure modes, and no
  marketing language.

---

## 6. TerrariumMarket/site (2026-05 → 2026-06) — the marketplace

### 6.1 Stack and rationale
- Vue 3 + Vite 6 + UnoCSS 0.65 (`presetWind`, attributify, icons, `transformerDirectives`), Element
  Plus, Pinia, vue-router in **hash mode**, fuse.js search, marked + DOMPurify, js-yaml and Octokit.
  It has no backend: it reads `registry.yaml` over raw HTTPS, uses GitHub Discussions as the forum and
  GitHub Device Flow for auth (README diagram).
- Commit `042db48` (scaffold): *"Visual identity is a verbatim port of the KohakuTerrarium framework
  frontend — same gem palette (iolite / taaffeite / aquamarine / amber / sage / coral), same
  warm-{50..950} surface scale, same Element Plus warm-theme overrides, same dark / light system ...
  Pre-paint inline script in index.html sets the dark class before Vue mounts so dark-system users
  never see a white flash. Routing is hash-mode so Cloudflare Pages serves deep links ... without any
  rewrite rule wrangling."*
- `uno.config.js:9-11`: *"Mirrors src/kohakuterrarium-frontend/uno.config.js so the TerrariumMarket
  site shares the framework's visual identity. Keep these palettes in sync if either side changes."*

### 6.2 Tokens and shortcuts (`site/uno.config.js:124-168`, `site/src/style.css`)
```
container-page  max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6
section-title   text-lg font-semibold text-warm-800 dark:text-warm-200 mb-4
text-body       text-sm text-warm-800 dark:text-warm-200
text-secondary  text-sm text-warm-500 dark:text-warm-400
text-faint      text-xs text-warm-400 dark:text-warm-500
card            bg-white dark:bg-warm-900 rounded-xl border border-warm-200/60 dark:border-warm-700/60
card-hover      card hover:border-iolite/40 dark:hover:border-iolite-light/40 hover:shadow-sm transition-all
btn-primary     px-4 py-2 rounded-lg bg-iolite text-white hover:bg-iolite-shadow font-medium text-sm disabled:opacity-50
btn-secondary   px-4 py-2 rounded-lg bg-warm-100 dark:bg-warm-800 text-warm-700 ... border border-warm-200/50
btn-ghost       px-3 py-1.5 rounded-lg text-warm-600 hover:bg-warm-100 ...
btn-icon        w-8 h-8 inline-flex items-center justify-center rounded-lg text-warm-500 hover:bg-warm-100
input-field     w-full px-3 py-2 rounded-lg bg-warm-50 dark:bg-warm-950 border border-warm-200 ... focus:border-iolite text-sm
input-icon      absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none
gem-badge       inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
chip            inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium
chip-<gem>      chip bg-<gem>/10 text-<gem> dark:text-<gem>-light border border-<gem>/20
chip-warm       chip bg-warm-100 dark:bg-warm-800 text-warm-600 ... border border-warm-200
```
- Chip formula: **10 % gem fill, 20 % gem border, gem text in light mode and gem-light text in dark
  mode.** This is the most reusable atom in the system.
- Buttons are `rounded-lg` (8 px) here, while Kohaku-Docs uses full pills. The app family uses lg and
  the docs home uses pills.
- Root `font-size: 14px` with line-height 1.6 (`style.css:44-53`). The app is dense: text sizes are
  given in px (`text-[11px]`, `text-[12px]`, `text-[13px]`, `text-[15px]`).
- Surfaces (`style.css:3-25`): light bg `#f7f5f2`, surface `#fff`, alt `#efece7`, border `#e0dbd4`,
  text `#3a3632`, muted `#8a8480`, faint `#b5b0aa`. Dark: `#1a1816`, `#252220`, `#1e1c1a`, `#3d3835`,
  `#e8e0d8`, `#8a8078`, `#5a5550`.
- The scrollbar is 6 px, with a transparent track and a border-coloured thumb with 3 px radius
  (`style.css:77-94`). That is "same as the framework" (compare the lab-home 10 px slate scrollbar).
- EP dialogs are clamped to `max-width: calc(100vw - 2rem)` (commit `803b41e`).
- Motion: a `.fade` transition (opacity .2 s) and **`kohaku-pulse`**, an `amber-pulse` keyframe
  0.4↔1 opacity over 1.5 s used as a loading and activity indicator on icons (`style.css:249-275`).
  Skeleton cards use `animate-pulse` with `bg-warm-200 dark:bg-warm-800` bars (`Browse.vue:55-69`).

### 6.3 Header and brand mark
- Commit `f212dd2` rewrote the header to match the framework exactly. Quote: *"The original header had a
  fat `py-3` shell with a gem-gradient div + cube icon as the brand mark — it looked completely unlike
  the framework's own chrome. Rewrite to match ... `CompactHeader.vue` exactly: `h-11` compact bar,
  `bg-white dark:bg-warm-900` with `border-warm-200/700` ... Buttons + nav links get the framework's
  smaller padding + tighter spacing too."*
  The same commit removed a duplicate CTA: *"Two paths to the same page, competing for attention. Drop
  the standalone button — nav link is the single source."*
- `AppHeader.vue:1-47` layout:
  - A 44 px (`h-11`) sticky bar.
  - The 28 px BrandMark, then the site name (hidden on xs, `text-sm font-semibold`).
  - Nav pills: `px-2.5 py-1 rounded text-[12px] font-medium`. Active is `bg-iolite/10 text-iolite`,
    inactive is `text-warm-600 hover:bg-warm-100`. The nav scrolls horizontally with the scrollbar
    hidden on very narrow screens.
  - A spacer, then a 28 px theme icon button and the auth chip (avatar + login) or an iolite "Sign
    in" button with the GitHub icon.
- **BrandMark** (`BrandMark.vue`): `bg-gradient-to-br from-amber via-iolite-light to-iolite` with the
  **bubble-tea Kohaku character PNG** on top. The gradient remains as a fallback if the image fails.
  Commit `12f0890`: *"The header logo + footer mark were placeholder gem-gradient div+icon-font
  compositions. Swap in the bubble-tea Kohaku PNG (the same artwork the framework desktop app ships ...
  the variant where Kohaku is holding the bubble tea, not the empty-handed one)."* Imagery is the
  mascot, not abstract shapes.
- The footer is quiet: `border-t border-warm-200/60 bg-warm-50/50`. It has the mascot icon, the name and
  tagline in 12 px, a spacer, then text links (Source, Contribute, Framework, About) that hover to
  iolite.

### 6.4 Listing (Browse) UX (`pages/Browse.vue`)
- The "hero" is just an H1 (`text-2xl sm:text-3xl font-semibold`) and a one-line tagline with an
  inline iolite link, "share your own". There are no glow blobs, gradients or stats.
- A **filter bar card** (`card p-3`) holds a search input with a left icon and a live placeholder
  (`Search 7 packages…`), then tag chips (`all` plus each tag; the active chip takes its gem colour,
  inactive ones are `chip-warm`), then a Sort `<select>` (Newest / Name A→Z) and a refresh `btn-icon`
  that pulses while loading.
  - It is sticky **only from md** at `top-[2.75rem]` (the header height). The rationale from
    `803b41e`: *"the stacked search + chips bar ate most of a phone viewport when pinned"*.
- Filters sync to the URL query (`?q=&tag=&sort=`, `Browse.vue:131-149`).
- States are always designed:
  - Error: a card with a coral border, warning icon, coral title "Could not load registry", message
    and a Retry button.
  - Loading: a 6-card skeleton.
  - Empty: a centred card with a 40 px `search-locate` icon, "No matches", a suggestion with a link to
    "publishing it yourself", and a "Clear filters" button.
- The grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`. The footer line reads "Showing **N**
  of M packages" and "Index updated <time>" at 12 px.
- **PackageCard** (`components/PackageCard.vue`):
  - A 40 px rounded-lg icon tile with a **gem gradient chosen by category**: terrariums
    `from-taaffeite to-iolite`, plugins `aquamarine→sapphire`, tools `sage→aquamarine`, creatures
    `iolite→taaffeite`, default `warm-500→warm-700`. A white Carbon icon matches (network-3, plug,
    tools, bot, cube).
  - Name at 15 px semibold, then the version in `font-mono 11px`, then an `official` amber chip with a
    check icon.
  - A meta row in 11 px: author · license · date.
  - Description in 13 px with `line-clamp-2 min-h-[2.5rem]` so card heights stay aligned.
  - Tag chips are clickable and filter the list (`@click.stop.prevent`). The "official" tag is dropped
    from the chips because the badge already covers it.
- Tag → colour map in `config.js:55-62`: creatures→iolite, terrariums→taaffeite, plugins→aqua,
  tools→sage, official→amber, examples→warm.
- **Safelist lesson** (`f212dd2`, `uno.config.js:26-68`): runtime-computed class names such as
  gradient `from-X`, icon classes and `chip-*` get purged, so he either safelists every one or uses
  `v-if`/`v-else` with literal classes.

### 6.5 Detail page (`pages/PackageDetail.vue`)
- A "← Back to Browse" 12 px link sits above everything.
- The **header card** (`p-4 sm:p-6`):
  - A 64 px gradient icon tile with `shadow-sm`.
  - H1 at 2xl semibold, plus the mono version and the official chip.
  - The description.
  - A meta row of icon + text pairs (author link, license, framework constraint, Source, Homepage).
  - Tag chips.
- The **install column** (`lg:w-72`) is separated by `border-t` on mobile and `border-l` from `lg`.
  - It is labelled "INSTALL" in 11 px uppercase tracking-wider.
  - A version `<select>` appears if there are several versions.
  - A mono command box (`bg-warm-100 dark:bg-warm-950`, border, rounded-lg) with a hover-revealed
    copy button whose icon swaps to a checkmark.
  - A full-width primary "Open in app" deep link (`kt://install/@name@ver`) with a 10 px faint
    footnote explaining it.
  - `803b41e`: *"install column sits beside the header only from lg; at 640-1024px the fixed 18rem
    side column squeezed title + description"*.
- A README card renders the markdown. A Versions card lists rows of a mono iolite tag, date ·
  framework, a coral "yanked" chip, and notes with a "Release notes ↗" link.
- The footer has `btn-ghost` actions: Suggest edit, Discuss, Report issue.

### 6.6 Forum and Submit
- Forum threads (`ThreadComment.vue`, commit `fc026aa`):
  - Recursive comments with a **gradient rail** (`w-0.5 bg-gradient-to-b from-iolite/35 to-iolite/5`).
  - Indentation stops after depth 3 so threads stay readable on phones.
  - An aquamarine "Marked as answer" banner, an `OP` iolite chip and upvote counts.
  - An uppercase "N replies" label.
  - Reply opens an inline composer box (`bg-warm-50/50`, mono textarea).
  The commit explains the earlier problem: *"rendered nested replies as a flat list under a bare
  border-t — no hierarchy, no context."*
- Submit (`pages/Submit.vue`):
  - A 2/3 + 1/3 grid.
  - Pasting a repo URL probes `kohaku.yaml` and autofills the form. Success shows an aquamarine 8 %
    tinted note ("Found ... — autofilled **fields**"). Errors show a coral 8 % note.
  - Inputs with errors get a `!border-coral` override, and valid ones get `!border-aquamarine/60`.
  - Section dividers use an uppercase 12 px label ("First version").
  - The copy explains the whole pipeline in one paragraph so there is no hidden magic.
- Copy tone on the About page: *"The registry is just a single YAML file ... No database, no backend
  service. ... You can fork the data repo and run a competing registry — point the KohakuTerrarium
  client at your fork's `registry.yaml` URL and it just works."* It is transparent, technical and
  slightly dry, with em-dashes used heavily.

---

## 7. Older projects (baseline conventions)

### 7.1 ProjectTemplate-Vue (2022-08) — his Vue starter
- Vue 3.2 + Vite 3, **`vite-plugin-pages` (auto routing) + `vite-plugin-vue-layouts` (Nuxt-like
  layouts)**, `unplugin-auto-import` and `unplugin-vue-components` with `ElementPlusResolver`,
  `vite-plugin-compression`, `vite-plugin-pwa` and commonjs shims. It also pulled in jQuery and
  Bootstrap 5 (README lists "Addons: jQuery, Element Plus, Bootstrap5").
  `main.js` builds the router from `setupLayouts(generatedRoutes)` (`src/main.js:9-17`).
- The default layout is an `el-menu` sidebar 200 px wide plus `<router-view>` in a Bootstrap
  `container-fluid d-flex h-100` (`src/layouts/default.vue`).
- The Bootstrap theme override in `scss/custom.scss` is an early colour fingerprint:
  ```
  primary #19448a (deep sapphire-ish blue)   secondary #3b6ea0   info #509edb
  accent1 #3304cf (violet → iolite ancestor)  accent2 #9b6dbd (mauve → taaffeite ancestor)
  accent3 #a89fbe   light #d5e1e6   dark #000201   success #03a45e  warning #e3cb03  danger #f21601
  ```
  He already had a deep-blue primary with violet and mauve accents in 2022. Those became
  sapphire, iolite and taaffeite in 2026.
- The PWA `theme_color` is `#1d2630` and the icons are "haku-river" artwork (character branding from
  the start).
- Utility code has Chinese comments (`//月份`, `//小時`), the `Date.prototype.format` monkeypatch
  style.

### 7.2 PixelGen/frontend (Astro 1 + Vue + Element Plus + Bootstrap, ~2022-09; repo snapshot 2024-03)
- `astro.config.mjs`: Astro 1, `@astrojs/vue`, auto-import plus `ElementPlusResolver` (the same plugin
  set as the template), `astro-compress`, sitemap and robots-txt. This is the first use of the
  **Astro shell + Vue islands** pattern that lab-home repeats in 2025 (`client:load`, `client:only`).
- Layout: Bootstrap grid `col-lg-4 / col-lg-5 / col-lg-3` (form | viewer | palette) with max-width
  1320 px (`src/pages/index.astro`). It is a tool page, so the tool is the hero.
- Fonts: **DotGothic16** (`@fontsource/dotgothic16`) for the "PixelGen" wordmark only
  (`navbar.vue:15-19`), with `system-ui` for the rest. The display font matches the subject.
- Tokens are fluid `clamp()` font sizes (`--font-size-base: clamp(1rem, .34vw + .91rem, 1.19rem)`) on a
  **warm off-white `hsl(10, 21%, 95%)`** background with `hsl(12,5%,4%)` text (`Layout.astro:43-52`).
  The warm-neutral preference shows up early.
- Feedback uses `ElMessage` toasts ("You should choose a file!", "Generating...").
- The About page is markdown with `---` rules and a "built with" list. The signature reads
  *"KohakuBlueleaf a.k.a KBlueLeaf / 琥珀青葉"*. The markdown CSS is a GitHub-markdown clone full of
  `!important` and slate-blue `#657697` headings (`styles/markdown.css`).

### 7.3 weekly (2023, React course project, NTHU Software Studio)
- React 18 + webpack + MUI + react-bootstrap + styled-components + Redux + AWS Amplify, with Express and
  Sequelize behind it. It was a kitchen-sink student stack, and he has not used React since.
- The palette already leans warm: body `#FFF7E8`, cards `#FFF8F0`, offcanvas `#EAE1D7` (cream and
  latte), navy `#17385B` as the default tag colour, and **dusty coral `#BE6464`** for add and accent
  icons (`style/index.css`, `style/navbar.css`, `EventList.jsx`).
  - Cream bg + navy + coral is a recognisable ancestor of warm-50 + sapphire + coral `#D46B6B`.
  - Tag text contrast is computed automatically: `brightness(color) > 127 ? 'black' : 'white'`
    (`EventList.jsx:95`). He was already thinking about legible user-chosen colours.
- Fonts: `@fontsource/roboto` (the MUI default).

### 7.4 KohakuBlueleaf profile README (personal brand)
- The H1 is *"Here is KohakuBlueLeaf UwU"*, followed by `### Kohaku: A cute dragon girl` /
  `### BlueLeaf: A graduate student in Taiwan`. The name is a character plus a person. The
  mascot (the Kohaku dragon girl, later the bubble-tea Kohaku icon) is the brand.
- A right-aligned link bar with emoji labels (Portfolio, Blog, LinkedIn, Resume, Google Scholar,
  Discord). The profile-view badge colour is `798BF0` (periwinkle, in the iolite family).
- Expertise is a terse bullet list (PEFT: LyCORIS; Generative: TIPO, Kohaku-XL, HDM; Full stack:
  KohakuHub, KohakuBoard; DB: KohakuVault; Chess AI; logic circuits HakuTPU...). It is playful at the
  top and factual underneath. The "Join QQ" and "Join Discord" lines show a CN/TW community.
- The "sponsor me!" section is collapsed in `<details>`, so asking for money stays out of the way.

---

## 8. Cross-cutting observations (marketing/docs-specific)

1. **Config-driven pages.** Landing content (hero kicker, actions, cards, sidebar, projects, members,
   tag→colour maps) always lives in a plain JS config, and components only render it.
   Examples: `docs.config.js`, `site.config.js`/`projects.config.js`, Market `config.js`.
2. **Kicker → H1 → lead → pill actions → card grid** is the default landing skeleton for docs and
   product homes (Kohaku-Docs HomeView, KT docs home). The marketing site adds stats and section bands.
3. **Hairline borders over shadows.** In the gem family, cards are `1px border-warm-200/60` or
   `rgba(58,54,50,.16)` with radius 12–14 px. Shadow appears only as `shadow-sm` on hover, or as an
   accent-tinted glow `0 6px 24px -18px color-mix(accent 60%)`.
4. **color-mix tinting** gives every semantic surface: active sidebar (iolite 14 %), callouts (gem-light
   55 % / gem-shadow 30 %), hover borders (accent 45 %), search scrim (bg 50 %).
5. **Gem gradients for category identity** (PackageCard tiles, BrandMark backdrop, forum rails, and the
   tag-derived bar on lab-home). He does not use gradient text in the gem family.
6. **Mono for identifiers**: versions, install commands, repo slugs, package names in forms, and
   registry stats numbers (`font-mono text-2xl`).
7. **Designed empty, loading and error states** in every listing: a 40 px Carbon icon, a short
   title, one helpful sentence with a link, and a recovery button.
8. **Carbon icons via UnoCSS `i-carbon-*`** everywhere since 2025, with `ep` icons as a secondary set.
   Commits record the safelist and dynamic-class purge lessons.
9. **Responsive rules are explicit and justified in comments**: sticky only from md, side columns only
   from lg, viewport-locked panes only from 1024 px, `100dvh`, dialogs clamped to `100vw - 2rem`, and
   nav strips that scroll horizontally.
10. **Dark mode**: `html.dark` class, a localStorage key, `prefers-color-scheme` default, and a
    pre-paint inline script in Market. Light/dark parity is required. The dark-only lab site is the
    exception.
11. **i18n is first class**: EN, zh-TW and zh-CN for KT docs, six UI dictionaries in Kohaku-Docs,
    per-region terminology choices, and a README language switcher with the current one bold.

---

## (a) The "marketing / docs" design language — summary for the skill

**Foundation (use this, the 2026 gem/warm system):**
- **Surfaces**:
  - Light: warm stone, page `#F7F5F2`, panel `#FFFFFF`, hover `#EFECE7`.
  - Dark: page `#1A1816`, panel `#252220`, hover `#3A3632`.
  - Borders are translucent warm (`rgba(58,54,50,.16)` / `rgba(232,224,216,.12)`) or `warm-200/60`.
  - Text runs `#3A3632` body → `#252220` strong → `#1A1816` heading, with muted `#6B6560`. Never use
    cool slate.
- **Accent**: iolite `#5A4FCF` for primary, links, focus, active nav and the TOC indicator. In dark
  mode switch to `iolite-light #DDD0F0` for text and accents.
- **Semantics**: sage = success/tip/copied, amber = warning/official/activity pulse, coral =
  error/danger/yanked, aquamarine = answered/validated, taaffeite/sapphire = decorative and category.
  - Chips: 10 % fill, 20 % border, gem text.
  - Callouts: 4 px left border, gem-light 55 % mix (light mode) or gem-shadow 30 % (dark mode).
- **Type**:
  - Inter → system stack. JetBrains Mono → Fira Code for code. Actually load Inter, which
    Docs and Market forget to do.
  - Docs root 15.5px; app/market root 14px with px-sized micro-text (11–13 px).
  - H1 700 weight, -0.02em tracking, line-height ~1.08, `text-balance`.
  - Kicker: uppercase, .16em tracking, .8rem/600, accent colour.
  - Prose 72ch at line-height 1.78.
- **Shape**: panels `rounded-xl` (12–14 px), controls `rounded-lg` (8 px), pills/badges
  `rounded-full`. Docs CTAs are pill-shaped; app and market CTAs are `rounded-lg`.
- **Motion**: 160 ms colour, border and opacity transitions, a 1 px hover lift with an accent-glow
  shadow, an opacity pulse for loading (`kohaku-pulse`, 1.5 s) and skeletons. No parallax, blobs or
  scroll animations.
- **Landing composition**: compact header (44 px app, about 68 px docs) → one bordered hero panel (kicker,
  H1, 1–2 sentence lead, 1 primary + 1–2 secondary pill actions) → 2/3-column card grid of entry
  points. Use the mascot (Kohaku bubble-tea icon over an `amber → iolite-light → iolite` gradient)
  for brand imagery. For tools, the tool is the hero (PixelGen, Market Browse).
- **Docs IA**:
  - Diátaxis (Tutorials / Guides / Concepts / Reference / Development) with a "Pick a path" table.
  - Every page has frontmatter `title/summary/tags`, and the summary is the lead.
  - Three bordered columns (260/220 px rails) with independent scroll on desktop and drawer + inline
    TOC on mobile.
  - Breadcrumbs, then kicker, then H1, then summary, then tags, then "Updated · Edit this page".
  - Prev/next tiles at the bottom.
  - Ctrl-K search with a mobile overlay sheet.
  - Code blocks have an uppercase language header, a copy button that turns sage, and gem-tinted
    syntax colours.
  - Tutorials start with Problem / End state / Prerequisites, then "Step N" sections that each open
    with "Goal:" and end with "Verify:".
- **Marketplace UX**:
  - Sticky (md+) filter card: search with a live count, tag chips, sort and refresh. Filters sync to
    the URL.
  - Cards: gradient category tile, name, mono version, official badge, meta line, 2-line clamp,
    clickable tags.
  - Detail: header card with an install column (copy box + deep-link CTA + footnote), then README,
    Versions and ghost actions.
  - Every list has designed loading, empty and error states.
- **Copy voice**:
  - EN is plain, candid, a little wry ("scratch your own itch", "it just works", "Not bad for solving
    our own problems"). It explains how the thing actually works and avoids buzzwords.
  - It uses heavy em-dashes, bold for the key phrase, and a 60-second quickstart early.
  - ZH is localised per region (zh-TW 生物 vs zh-CN 智能体), with full-width punctuation in zh-CN and
    labels translated idiomatically (教學/教程, 參考/参考).
- **Legacy look (avoid unless asked)**: kohaku-lab-home's dark-only slate, sky→pink gradient text,
  blur orbs and blue-600 buttons. It is his 2025 marketing look and is not consistent with the gem
  system. If you redo the lab site, port it to warm and gem.

## (b) Evolution timeline 2022 → 2026

| when | project | stack | look | what it shows |
|---|---|---|---|---|
| 2022-08 | ProjectTemplate-Vue | Vue 3 + Vite + **vite-plugin-pages auto-routing + layouts** + auto-import/EP resolver + Bootstrap 5 + jQuery + PWA | Bootstrap theme: primary `#19448a`, violet `#3304cf`, mauve `#9b6dbd` | Baseline: file-based routing, auto-imports, Element Plus, deep blue with violet/mauve accents, character artwork icons |
| 2022-09 (snapshot 2024-03) | PixelGen | Astro 1 + Vue islands + EP + Bootstrap grid | warm off-white `hsl(10 21% 95%)`, DotGothic16 wordmark, fluid clamp type | Astro shell + Vue islands, tool-as-hero, themed display font, warm background |
| 2023 | weekly | React + MUI + react-bootstrap + Redux (course team project) | cream `#FFF7E8` + navy `#17385B` + coral `#BE6464`, Roboto | Warm cream + navy + coral palette appears; React abandoned afterwards |
| 2025-04 | kohaku-lab-homepage | AstroWind template (Astro 5 + Tailwind) | stock blue `rgb(1 97 239)` + violet, Inter Variable | Tried a big template with corporate copy and abandoned it after 1 commit |
| 2025-10 → 2026-03 | kohaku-lab-home | Astro 5 + Vue + **UnoCSS** (shortcuts, Carbon icons), config-driven | dark-only slate + sky→pink gradient, glow blobs | Switched from Tailwind to UnoCSS, adopted the shortcut vocabulary and data configs, and found his own voice ("scratch your own itch"); visuals still generic SaaS |
| 2026-05 | TerrariumMarket | Vue 3 + Vite + UnoCSS + EP + Pinia, hash router, no backend | **verbatim KT gem/warm port**, h-11 compact header, mascot BrandMark | The gem system becomes the cross-product identity: "keep these palettes in sync" |
| 2026-06 | Kohaku-Docs | Vue 3 + rolldown-vite + UnoCSS + EP + **unplugin-vue-router** (file routing returns), npm CLI | gem/warm with CSS-var semantic layer, pills, three-panel docs | The theme is documented as a product ("Theme" page with tables), and the docs IA is standardised |
| 2026-04 → 11 | KT docs + VS Code ext | kohaku-docs builder, Diátaxis, EN/zh-TW/zh-CN; webview reuses Dashboard uno config, host-mapped tokens | gem in browser, VS Code variables inside the editor | Token scoping (`--kt-conversation-*`) lets one component set adopt a host theme |

**Abandoned**:
- Bootstrap grid and theme SCSS, jQuery, React/MUI.
- Full third-party site templates (AstroWind) and their corporate copy.
- Tailwind proper, replaced by UnoCSS.
- Cool slate greys and sky→pink gradient text.
- Decorative glow blobs and pulsing backgrounds.
- Thumbnails on blog cards (`c0de153`).
- Gem-gradient-div placeholder logos, replaced by the mascot PNG (`12f0890`).
- "Fat" `py-3` headers, replaced by the 44 px compact bar (`f212dd2`).
- Duplicate CTAs (`f212dd2`).
- `!important`-heavy GitHub-markdown CSS clones, replaced by a small tokenised `.doc-prose`.

**Kept throughout**:
- Vue 3 + Vite + Element Plus (2022 → 2026).
- Auto-import and component resolvers.
- **File-based routing** (vite-plugin-pages in 2022, then unplugin-vue-router in Kohaku-Docs; Market is
  the exception with hand-written hash routes).
- Astro + Vue islands for content sites.
- Inter as the UI sans; it was the winner of the 2025 font shortlist.
- Deep blue + violet + mauve accents. The 2022 `#19448a/#3304cf/#9b6dbd` became 2026
  sapphire/iolite/taaffeite.
- Warm off-white backgrounds (PixelGen 2022, weekly 2023, and the 2026 warm scale) and dusty coral.
- The mascot and character branding (haku-river icons in 2022, the bubble-tea Kohaku in 2026, and the
  "cute dragon girl" profile).
- The shortcut names `btn-primary`, `btn-secondary`, `card`, `card-hover`, `section-title`,
  `input-field`.
- Designed fallbacks and empty states.
- Bilingual and Chinese-aware authoring.

**Process shift**: since 2026 the design commits are AI co-authored (Claude Opus 4.6/4.7, Fable 5).
They have long rationale bodies, and each one fixes a concrete RWD or UX defect found by "poking the
running site for real" (`12f0890`). The style moved from template adoption to **one identity ported
verbatim and kept in sync across products**.
