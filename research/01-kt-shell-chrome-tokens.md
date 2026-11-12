# 01 — KohakuTerrarium: app shell, chrome, design-system enforcement

Source root: `<clones>/KohakuTerrarium/src/kohakuterrarium-frontend` (abbrev. `FE/`).
All paths below are relative to `FE/src/` unless they start with `FE/`, `packaging/`, or `docs/`.
Git hashes come from the KohakuTerrarium repo (`git log` over style.css, uno.config.js, chrome/, layout/, shell/, common/, settings/ui, theme/density).

Labels: **[STRONG]** = a rule that recurs across many files, or one a test enforces. **[ONE-OFF]** = local or inconsistent; do not generalize it.

uno.config.js and style.css are summarized elsewhere. This file covers how the tests enforce the rules, the surface model, shell structure, interaction conventions, and the reasons given in commits.

---

## 0. TL;DR principles (what to reproduce)

1. **Tests enforce the palette.** A vitest scan fails the build on any stock Tailwind colour, any off-palette rgb, or any gem shade that doesn't exist (`style.palette-guard.test.js`). The theme is also exported as CSS variables, and a second test keeps hard-coded fallbacks in sync with it (`style.gem-tokens.test.js`).
2. **Tokens are named by role, not by look.** Font sizes use `--kt-fs-micro…h1`, each named for what the text does. Surfaces use the v2 levels `chrome / canvas / panel / card / float`. Shell framing uses `--kt-shell-rail / -strip / -tab-active`.
3. **The active tab takes the colour of the page under it.** Rail is darkest, strip is mid, and the active tab equals `--color-bg`, so the tab and its content read as one surface (`style.css:47-51`, `session-v2/surfaces.css:2-12,89-120`).
4. **Density is one module-level signal.** It is `compact <768 / regular <1280 / expansive`, and the user can override it. The shell branches on it rather than on scattered media queries (`composables/useDensity.js`). CSS uses `(pointer: coarse)` for touch and `max-width: 767px` for dialogs, matching the same 768 threshold.
5. **Dark mode is a class on `<html>`, and the whole Element Plus variable set is remapped once, globally** (`style.css:412-453`, commit a7279e7b). Light mode gets its own fixes: muted greys are re-tuned for contrast on stone surfaces.
6. **Hover-only actions must stay visible on touch.** The rule is the `hover-only-action` utility plus `group`, with focus-within support built in (`style.css:293-321`).
7. **Status is shown by colour, never by motion.** A dot uses aquamarine, amber, coral, or warm-400. Continuous animation is banned on repeated elements for GPU-cost reasons (`style.css:508-535`).
8. **Zoom and reading size are two separate preferences.** CSS `zoom` goes on `<html>` so teleported overlays scale too. Reading size sets the root font size to 14, 16 or 18px (`stores/theme.js`).
9. **Every pref uses "hybrid" storage.** It reads synchronously from localStorage and writes to the backend debounced (`utils/uiPrefs.js`). One keystroke must never become one request.
10. **Chrome follows the OS where possible.** Native context menus fall back to in-page menus. The window caption colour is sampled from the page. Mica translucency appears only on the rail.

---

## 1. Design-system enforcement by tests

### 1.1 `style.palette-guard.test.js` (introduced 012546b6, 2026-09-30) [STRONG]

The test walks every `.vue/.js/.css` file under `src/` except `*.test.js`, `node_modules` and `locales`. It fails with a `file:line match (reason)` list. Banned patterns, with the reason string written for each:

| Pattern | Reason (verbatim) |
|---|---|
| `(text\|bg\|border\|ring\|from\|to\|via\|fill\|stroke\|divide\|outline\|placeholder\|accent)-<gem>-(dark\|deep\|darker)` | "gem colours only have light / DEFAULT / shadow shades" |
| `<utility>-(teal\|emerald)(-x)?` | "colour name is not in the gem theme" |
| `<utility>-(red\|blue\|green\|yellow\|orange\|purple\|pink\|indigo\|violet\|gray\|grey\|slate\|zinc\|stone\|neutral\|cyan\|sky\|lime\|rose\|fuchsia\|amber\|emerald\|teal)-\d{2,3}` | "default Tailwind palette scale instead of gem / warm colours" |
| `rgba?(90,140,200` / `#5a8cc8` | "off-palette blue; the primary accent is iolite" |
| `rgba?(231,76,60` | "off-palette red; danger is the coral gem" |
| `rgba?(120,109,98` | "ad-hoc warm grey; use the warm-500 theme variable" |

- The `amber-\d{2,3}` entry bans the *Tailwind* amber scale. The gem `amber` has only `light/DEFAULT/shadow`, so `text-amber`, `bg-amber/15` and `text-amber-shadow` are all legal.
- **Allowlist with a reason is required:** `ALLOWED = new Map([["composables/useAttentionEffects.js", "favicon SVG data URLs cannot use utility classes"]])`. A third test asserts that every allowlist entry still points at a real file, so stale exemptions fail.
- **Shortcut existence check:** every `btn-[a-z-]+` token used anywhere must be a defined key in `unoConfig.shortcuts`. This stops someone writing `btn-danger` and getting silently unstyled output.
- Why the test exists (da92f6c9): *"Several recent additions used stock Tailwind colours (stone, gray, slate, purple, ...) instead of the gem theme."* The concrete offenders were `text-red-500` for error lines in settings, PresetEditor and UpdatesPanel. They became `text-coral`.

**Gem shade vocabulary (from uno.config.js:52-87):** each gem has exactly `light` (a pale tint used for fills and badges), `DEFAULT`, and `shadow` (the dark shade used for text on a light tint and for hover on solid buttons). There is no 100-900 scale for gems. Only `warm` has a 50-950 scale.

### 1.2 `style.gem-tokens.test.js` [STRONG]

- uno.config.js has a **preflight** that emits `:root { --kt-color-<name>[-shade]: <hex>; }` for every theme colour (`FE/uno.config.js:31-47`). The test asserts one variable per flattened colour, and that the CSS starts with `:root {`.
- **Fallback-drift guard:** the shared chat CSS (`components/chat/shared/conversation-message.css`, `chat-transcript-section.css`, `chat/chat-panel.css`, `public/chat/chat-composer.css`) may write `var(--kt-color-iolite, #5a4fcf)`. The fallback hex must equal the theme value ("fallback drift for X"). An unknown colour name also fails.
- **No raw hex outside a `var()` fallback** in those files, except `#fff`/`#ffffff`.
- **No custom `rgb()`** in `MessageRow.vue` styles or in shared chat CSS. The exceptions are `rgb(0 0 0 …)` (shadows) and two pinned image-border values (`rgb(231 223 211 / 1)`, `rgb(89 75 61 / 1)`), and the comment says why: "Production image-border fallbacks pinned by mediaImageParity.test.js".
- Why the test exists: the chat CSS is shared with hosts that do not run UnoCSS, such as the VS Code webview. Plain CSS can consume the palette only through `--kt-color-*`, and the fallbacks keep it rendering when the variables are missing (`docs/en/dev/frontend.md:246-249`: "The shared transcript component inherits its host's tokens… VS Code supplies its own scope").

### 1.3 `style.hint-tooltip.test.js` (b7f5fce3 + fd90a836) [STRONG for docs tooltips]

- Every documentation `<el-tooltip>` in ModulesPanel and ModuleEditForm must carry `popper-class="kt-hint-tooltip"`. The test counts exactly 3 tags.
- `.el-popper.kt-hint-tooltip` must contain `box-sizing: border-box; max-width: min(28rem, calc(100vw - 24px)); white-space: normal; overflow-wrap: anywhere; word-break: break-word;`.
- Rationale (`style.css:323-329`): *"Element Plus poppers have no default maximum width… Scope the constraint to documentation hints so menus, selects, and other popper-based controls keep their own sizing behaviour."* The lesson is to fix library defaults with an **opt-in class**, not a global override that could break other poppers.

### 1.4 `style.reading-size.test.js` (7c539514, aaf1e18e, a94e2ff8) [STRONG]

- Under `(pointer: coarse)`, inputs get `font-size: max(16px, 1rem) !important`, and the test asserts the plain `16px !important` is **not** used. The reason (aaf1e18e) is *"Let touch inputs grow beyond the 16px floor"*: with reading size "larger" (18px root), inputs must follow it up rather than clamp at 16.
- `SettingsRow.vue` must use `kt-text-body` / `kt-text-caption` and must **not** match `text-[\d+px]`. The test pins that settings text scales with the reading size.
- The root is `font-size: var(--kt-reading-root-size, 16px)`. `smaller` is 14px, the default is 16px, and `larger` is 18px. a94e2ff8: *"The earlier scale's stored 'large' is read as the default, so its users keep what they see."* This is a migration rule: when a scale is redefined, map old stored values so that nobody's UI changes under them (`stores/theme.js:13-20`, `LEGACY_READING_SIZES = { large: "default" }`).
- At the default and larger sizes, Element Plus sizes are re-expressed in `rem` so they scale with the root (`--el-font-size-base: 1rem; --el-component-size: 2.286rem…`). At "smaller", EP keeps its own pixel sizes (`style.css:104-131`).

### 1.5 Other test-backed conventions

- `data-test="…"` hooks are everywhere (≈163 .vue files). Examples are `rail-collapse`, `rail-strip-new`, `popout-return`, `backend-banner` and `desktop-chip-dot`. Tests query by `data-test`, never by class. [STRONG]
- `data-settings-nav`, `data-section`, `data-badge` and `data-row-status` are semantic data attributes on settings, used by tests (`components/settings/layout/SettingsLayout.vue`).
- i18n tests check translations and fallback per locale (`utils/i18n.test.js`). One example is "describes every user-facing panel in every locale". v2 strings have a test that "every used key exists and none is unused" (commit 7e7dff79).
- UnoCSS scan scope is extended to `src/components/**/*.js` (non-test), because *"Class names also live in component .js modules (icon and accent tables), not only in templates"* (`FE/uno.config.js:10-17`). Icon classes are deliberately kept as **static string literals** in registries: `builtinSections.js:15` says *"Icon classes live here so the icon scan sees them."* **Don't** build class names by string concatenation (`'i-carbon-' + name`), because the extractor cannot see them.

---

## 2. Token layers beyond the uno.config summary

### 2.1 Shell frame tokens (light mode), from `style.css:38-52`

```css
--color-bg: #f2eee8;          /* stone page */
--color-surface: #ffffff;     /* cards */
--color-surface-alt: #efebe5;
--color-border: #e5dfd7;
--color-text: #2e2a26; --color-text-muted: #6c655d; --color-text-faint: #8f8880;
/* Light shell frame: sidebar, tab strip, active tab. Dark mode uses its own dark: classes.
   The active tab is the page tone, so it flows into the page under it. */
--kt-shell-rail: #dcd5cb;
--kt-shell-strip: #e3ddd5;
--kt-shell-tab-active: var(--color-bg);
```
In dark mode (`style.css:133-141`), `--color-bg` is `#1a1816` (= warm-950), the surface is `#252220`, surface-alt is `#1e1c1a`, the border is `#3d3835`, the text is `#e8e0d8`, and muted text is `#8a8078`. In dark mode the shell uses `dark:` utilities instead of the shell vars: rail `dark:bg-warm-800/40`, strip `dark:bg-warm-900`, active tab `dark:bg-warm-950`.

**Light-mode contrast patch** (`style.css:54-68`) [STRONG]:
```css
/* Light-mode muted greys at readable contrast (warm-400 / warm-500 are too pale on stone
 * surfaces). Same specificity as the utilities and loaded after them, so hover, group and
 * dark variants still win. */
:where(html:not(.dark)) .text-warm-400 { color: #77706a; }
:where(html:not(.dark)) .text-warm-500 { color: #655e57; }
:where(html:not(.dark)) .bg-warm-50 { background-color: var(--color-bg); }
```
Technique: `:where()` keeps specificity at zero for the html part, so the rule ties with the utility and wins only by source order. Hover, group and dark variants still override it. The same commit (e58d1cc6) also bumped shortcuts from `text-warm-500` to `text-warm-600` (`nav-item`, `btn-icon`, `text-secondary`) and `placeholder-warm-400` to `placeholder-warm-500`. Lesson: **the first light theme's muted greys were too pale. Muted text on light surfaces should be warm-600, or warm-400/500 patched darker.**

### 2.2 v2 surface model, from `components/session-v2/surfaces.css` [STRONG in v2 and settings; this is the current direction]

KohakuTerrarium's own definition (lines 1-12):
> v2 surfaces. Five levels, each a job:
> chrome — the session bar; equals the shell's active tab (warm-50 / warm-950), so that tab flows into the bar;
> canvas — what a tab shows (chat, pages); the active session tab shares this color;
> panel — side regions (rails, member list, side view, workspace columns, settings nav), always edged by a strong line;
> card — grouped content on a canvas (status cards);
> float — things above the page (dock, widgets, floating buttons), with a shadow.
> Light mode ("stone frame") steps panels darker than a near-white canvas under a stone shell frame; dark mode lifts each level lighter.
> Region boundaries use `--v2-line-strong`; rows inside a region use `--v2-line`.

| var | light | dark |
|---|---|---|
| `--v2-chrome` | `var(--kt-shell-tab-active, #eeeae4)` | `#1a1816` |
| `--v2-canvas` | `#fbfaf8` | `#221f1d` |
| `--v2-panel` | `#f2eee8` | `#2a2724` |
| `--v2-card` | `#ffffff` (+ `0 1px 2px rgb(40 34 28 / 0.05)`) | `#2a2724` (shadow `none`) |
| `--v2-float` | `#ffffff` | `#2e2b28` |
| `--v2-line` | `#e5dfd7` | `#3a3632` |
| `--v2-line-strong` | `#cdc5ba` | `#4a4540` |
| `--v2-tab-hover` | `rgb(36 33 29 / 0.07)` | `rgb(255 255 255 / 0.05)` |

Key ideas:
- **Light mode steps panels darker than the canvas. Dark mode lifts each level lighter.** The ordering is asymmetric on purpose. Dark cards have no shadow; elevation comes from lightness alone.
- Classes: `.kt-v2-chrome/-canvas/-panel/-card/-float`, plus line classes `.kt-v2-line` (soft), `.kt-v2-edge` (strong) and `.kt-v2-b` (style-only, colour from a utility). Line classes reset `border-width: 0` via `:where()`, so they draw **only on the sides a width utility names**: `kt-v2-edge border-r`. The note at line 66 explains: *"The app has no border reset"*. Another note, *"Class weight, so the global `button { border: none }` cannot drop the line of a v2 button"*, explains why the global button reset (`style.css:150-159`) needs this.
- `.kt-v2-card` is `border 1px var(--v2-line); border-radius: 0.75rem; box-shadow: var(--v2-card-shadow)`.
- **Tabs fused by colour alone** (lines 86-120): *"the active tab is the canvas color and the bar has no bottom line, so tab and page read as one surface; the outward corner curves join the tab to the bar."* Top radius is `0.625rem`. `::before`/`::after` use 0.625rem radial-gradient pseudo-elements to draw the inverted corners.
- **Grip visible before hover** (`.kt-v2-grip`): a 9px hit area holds a 3×36px pill in `--v2-line-strong`. On hover or drag it turns iolite and grows to 56px tall. Compare the v1 split handles, which are invisible until hover (§4.5).
- Transcript text contrast: *"Transcript text reads at the contrast of the active tab's label: near black (light), near white (dark)"*. That is `#24211d` / `#f3efe9`, with reasoning text one step softer (`#4a4540` / `#d6d0c8`).

### 2.3 Element Plus bridge, from `style.css:412-478` [STRONG]
- `--el-color-primary: #5a4fcf` (iolite) with a hand-computed light-3/5/7/9 and dark-2 ramp.
- EP's bg, fill, border and text variables are all mapped onto `--color-*`. In `html.dark` they are re-declared with literal hexes. The mask is `rgba(0,0,0,.5)` in light and `.7` in dark.
- Commit a7279e7b: *"Global style.css now overrides ALL Element Plus color variables for dark mode… Previous approach (per-component overrides) was incomplete and missed dialog titles, dropdown backgrounds, select panels, etc."* → **Don't** theme a component library one component at a time. Remap its variable layer once.
- Known gap: the d490d91c body says *"using the codebase's `input-field` UnoCSS shortcut (not el-input — its inner background is theme-inconsistent inside dialogs in dark mode)"*. Inside dialogs the custom `input-field` shortcut is preferred over `el-input`.

### 2.4 Typography tiers [STRONG as a rule, partially followed]
- `--kt-fs-*` lives in `style.css:26-36`, and `.kt-text-*` utilities in `style.css:245-278`. The rule as written: *"Every chrome surface (rail items, header titles, settings tabs, chat tab strip, bottom tab labels, etc.) must derive its font-size from one of these vars — NOT from a one-off `text-[Npx]` or `text-sm` literal… pick by what the text DOES, not by what looks right at one viewport."*
- **Practice:** `kt-text-*` appears in about 18 .vue files: the rail (`RailNav`, `RailItem`, `RailPane` brand and settings), `CompactHeader`, `CompactTabBar`, and the settings rows and groups. Pixel literals are still everywhere: ≈565 occurrences of `text-[11px]`, ≈307 of `text-[10px]`, 188 of `text-[12px]`, 74 of `text-[13px]`, 57 of `text-[9px]`. So the tier rule is **enforced for navigation chrome and settings, and aspirational elsewhere.** Commit ce31abd5 ("a full frontend audit and fix about mobile frontend") is where rail and compact chrome were moved from `text-[9px]`/`text-[10px]`/`text-sm` to `kt-text-caption`/`kt-text-body`.
- De-facto micro scale in dense chrome: 9px for the shortcut hint and palette description, 10px for status bar, panel header, section labels and locale code, 11px for icons in header buttons, captions and toasts' close icon, 12px for the app switch, 13px for the primary rail CTA, and 15px for phone settings rows.
- Section header idiom: `text-[10px|11px] uppercase tracking-wider text-warm-400|500` (≈145 occurrences of `uppercase tracking-wider`) [STRONG].
- Fonts: Inter (`--font-sans`), JetBrains Mono (`--font-mono`), and a Nerd-Font stack for terminals (`style.css:5-9`). c9d2e700 says to use the system Consolas NF and drop a broken bundled font.
- Body `line-height: 1.6`, with antialiasing on (`style.css:161-170`).
- Numbers: `tabular-nums` on metrics (`common/Metric.vue`); `font-mono` for ids, model names and session ids.

---

## 3. App shell structure

### 3.1 Tree (`App.vue`, `shell/MacroShell.vue`)
```
App.vue  (h-full overflow-hidden bg-warm-50 dark:bg-warm-950)
├─ AuthGate > MacroShell
│   ├─ isCompact → CompactShell (header + TabContent + slide-in RailPane drawer)
│   └─ else .kt-macro-shell flex: RailPane | (StudioApp | TabGroupContainer)
│                                         TabGroupContainer = SplitTreeNode of TabGroup leaves
│                                         TabGroup = TabStrip + TabContent (+ drag-split overlay)
└─ global overlays, all mounted once at root: CommandPalette, ShortcutHelp, OverlayLayer, DesktopOpenHost,
   DesktopFirstRun, DesktopBackendBanner, DeepLinkInstallDialog, ToastCenter, HostPickerModal,
   WorkspaceResumeDialog, AdminTokenModal, LoginPromptModal
```
- **Global modals mount once at the root and open through window events**, not prop threading. `App.vue:120-122` says *"Host picker state — accessed by `HostStatusChip` via a global event so we don't have to thread a prop through every shell component."* Event names are namespaced: `kt-open-host-picker`, `kt:open-saved-session-history`, `kt:overlay-settings`, `kt:desktop-backend-state`, `kt:modal:escape`. Layout events use `utils/layoutEvents.js` (`firePaletteOpen`, `fireLayoutEditRequested`, `onLayoutEvent(LAYOUT_EVENTS.X)` returns an unsubscribe function) [STRONG].
- App-wide composables are all invoked once in `App.vue:104-117`: `useKeyboardShortcuts`, `useWindowChrome`, `useDesktopMenu`, `useDocumentAttention`, `useAttentionEffects`, and others.
- An older generation (v1 NavRail, `/mobile/*` pages) was retired. *"v2 macro shell only — handles every viewport size via density auto-detect… bookmarks to the old URLs are caught by the router guard in main.js and rewritten to canonical equivalents"* (`App.vue:2-6`). Lesson: **one shell that adapts by density, not parallel mobile routes.**

### 3.2 Nav rail (`shell/RailPane.vue`, `composables/useRailWidth.js`) [STRONG]
- Width defaults to 240, clamped to 180-480, and is persisted as `kt.rail.width`. It collapses to a **48px icon strip** (`COLLAPSED_RAIL_WIDTH`), persisted as `kt.rail.collapsed` and synced across browser tabs (753649a2).
- Resize handle: `absolute top-0 right-0 h-full w-[4px] cursor-col-resize hover:bg-iolite/30`, turning `bg-iolite/50` while dragging. Double-click resets the width, and the title says so: *"Drag to resize · double-click to reset"* (`RailPane.vue:67`).
- Expanded layout, top to bottom: the brand row (`BrandMark w-7 h-7 rounded-full`, then the wordmark `<b class="text-amber">Kohaku</b><light class="text-iolite">Terrarium</light>`, the site pill, a search icon and a collapse icon); then a segmented Terrarium/Studio switch; a scrolling middle (`flex-1 min-h-0 overflow-y-auto`) with nav, divider, running sessions and extension groups; then a footer with a divider, Settings/Admin, the host chip, and theme plus locale.
- The collapsed strip carries **the same actions** as the expanded rail. Commit 0adbc090: *"the collapsed strip carries the same set."* Every collapsed button is `w-8 h-8 rounded-md` with a `title` tooltip. The primary "new" button is the only filled one: `bg-iolite text-white hover:bg-iolite-shadow`.
- Rail item hover/active: `hover:bg-warm-300/50 dark:hover:bg-warm-700/50`, with active `bg-warm-300/50 … font-medium text-warm-800`. Strip icons show active by colour only, as `text-iolite`.
- Dividers are `mx-2 border-t border-warm-200 dark:border-warm-700`, or `w-6 my-1 border-t` in the strip.
- The phone drawer reuses the same `RailPane` with `collapsible=false` (`CompactRailDrawer.vue`). It is `w-72 max-w-[85vw]` over a `bg-black/40` backdrop and locks body scroll. It **closes when the active tab changes, not on any click**, because *"no eager click-to-close… without unmounting modal-spawning rail items (e.g. '+ Creature') before their modal has a chance to render"* (`CompactRailDrawer.vue:7-11`).
- Rail session row (`RailItem.vue`): a status dot, a truncating name, and two **5×5 monospace letter toggles "C" and "I"** for Chat and Inspector. They show `bg-iolite text-white` when that surface is open and muted otherwise. A resuming row gets `opacity-70` and `disabled:cursor-wait`. Right-click tries a native OS menu first, then falls back to the in-page `RailContextMenu`.

### 3.3 Tab strip (`shell/TabStrip.vue`, `TabItem.vue`, `TabContextMenu.vue`) [STRONG]
- Strip: `h-8`, `bg-[var(--kt-shell-strip)] dark:bg-warm-900`, `border-b`, horizontally scrollable, with a trailing `w-8 h-8` "+" new-tab menu button.
- Tab: `h-8 pl-3 pr-1.5 text-xs border-r`, label `truncate max-w-32`. **Active tab:** `bg-[var(--kt-shell-tab-active)] dark:bg-warm-950 text-warm-800 border-b-2 border-b-iolite`. **Inactive:** `text-warm-600 hover:bg-warm-300/40`.
- Refresh and close icons use `hover-only-action`. The Dashboard/Lab tab has no close button and cannot be closed by middle-click (`TabItem.vue:121-126`: *"Dashboard never closes. Other tabs use middle-click as a quick close gesture (matches every browser tab strip)."*).
- Attention badge on a tab: `!` means input needed and `●` means completed. Both are user-toggleable (`attentionPrefs`).
- Tab labels mix i18n chrome with raw user data. `TabItem.vue:168-171` says *"The chrome bits go through i18n; the user data stays raw because translating 'alice' makes no sense."* Suffix format: `${name} · ${t('…suffix')}`.
- Context menu: a `fixed inset-0 z-40` click-catcher holds a `w-48 rounded shadow-lg py-1 text-xs` menu. The header row is the tab id (`text-[10px] uppercase tracking-wider text-warm-400`). Items are `px-3 py-1.5 flex gap-2` with a leading icon, and section dividers are `my-1 border-t`. Disabled items get `opacity-40 cursor-not-allowed` plus an explanatory `title`, e.g. "dashboardLocked". Extension actions append after a divider.
- Drag: tabs reorder within a strip. Dragging to the edge of another group splits it, shown by an overlay of `bg-iolite/25 border-iolite/50` that covers the left, right, top or bottom half, or the centre (`TabGroup.vue:61-77`). In the desktop shell, dragging a chat tab **outside the window** pops it into its own OS window (`TabItem.vue:79-82`).
- A focused group gets `outline outline-1 -outline-offset-1 outline-iolite/40`, **only when there is more than one group**: *"a solo group is visually identical to the old single strip"* (`TabGroup.vue:41-43`).

### 3.4 Workspace / layout system (`components/layout/*`)
- Panels live in a **binary split tree**. bd71aa19 replaced a zone grid with it, and `SplitTreeNode.vue` renders it recursively. There are presets, an edit mode (amber banner), panel pop-out to `/detached/<inst>--<panel>`, and a panel picker.
- The `AppHeader` instance bar is `h-8 text-xs bg-white dark:bg-warm-900 border-b`. It holds a StatusDot, a name (`truncate max-w-48`), graph counts, small 5×5 icon buttons, a `seg-sep`, a preset dropdown, a `Ctrl+K` hint button, and a stop button that hovers coral.
- `.seg-sep` is a scoped 1px vertical separator: `width:1px; height:14px (header) / 12px (status bar); background: currentColor; opacity: .12/.15`. **Separators take currentColor at low opacity, so they work in both themes without tokens** [recurring idiom].
- The panel header shows only in edit mode: `h-6 text-[10px] bg-warm-100/60 dark:bg-warm-900/60 border-b border-warm-200/70`. If a panel sits in a zone it doesn't prefer, it shows an amber "prefers X" warning.
- The edit-mode banner is `h-9 text-xs bg-amber/15 border-b border-amber/40 text-amber-shadow dark:text-amber-light`. A dirty state shows `● unsaved`, and Esc exits. Built-in presets can't be overwritten, so Save becomes "Save as..." (`EditModeBanner.vue:32-40`). **Mode banners use the amber gem.**
- Self-healing: if no preset is active, the shell switches to the default *"rather than stranding the user on the 'No layout preset active' empty state"* (`WorkspaceShell.vue:232-236`).
- Split CSS rules, written in comments because they were learned from bugs (`SplitTreeNode.vue:8-30`, `TabGroup.vue:9-17`, `CompactShell.vue:4-8`):
  - *"Single root element… multi-root v-if/v-else templates can emit Vue fragment comment placeholders that confuse `h-full` / flex sizing in deeply-nested split trees (the 'split has a hole' bug)."*
  - *"NO `min-h-0` / `min-w-0` here [on the % sized split child] — flex-shrink would otherwise collapse the wrapper below its stated %."*
  - *"`flex flex-col` is load-bearing: TabContent uses `flex-1` to claim the remaining height… `min-h-0` lets the flex child shrink so its own `overflow` can scroll."*
  - The `useSplitResize` hook takes a **getter**, not the node itself: *"Vue reuses the same SplitTreeNode instance when a leaf becomes a split (setup does not re-run), so a frozen value would apply the wrong axis."*
- A generic `SplitPane.vue` has a 3px splitter in `--color-border` that turns `--color-text-muted` on hover. It uses `touch-action: none` and pointer capture, and persists to the `kt.splitPane` hybrid pref. Tree split handles are `w-[3px] hover:bg-iolite/30 active:bg-iolite/50` (`composables/useSplitResize.js:61-64`).

### 3.5 Status bar (`chrome/StatusBar.vue`) [STRONG pattern for a dense footer]
- `h-6 px-3 gap-2 text-[10px] font-mono bg-warm-100 dark:bg-warm-950 border-t text-warm-500`.
- Segments are `.status-seg` (`user-select:none`) separated by `.seg-sep`. From left: StatusDot (`scale-75`) and name, ModelSwitcher, session id (truncated to 12 chars + "…", click copies, full id in `title`), extension `StatusItems side=left`, a `flex-1` spacer, `StatusItems side=right`, the desktop chip, a running-jobs count (turns `text-amber` when non-zero), and runtime (`3h 4m` / `7m 3s` / `12s`).
- Empty values render as an em dash `—`. That convention holds across chrome: `instanceName || "—"`, `presetLabel "—"`, `"--"` in the status dashboard.
- The runtime ticks through `useVisibilityInterval`, which pauses while the page is hidden: *"the runtime-elapsed label only matters when the user can see the status bar."* **All polling and ticking goes through visibility-aware intervals** [STRONG] (6faeb640, 90a70ce7 *"skip visibility-interval ticks while a poll is in flight"*, d22c41d8 *"guard … polling against overlap"*).

### 3.6 Compact shell (`shell/Compact*.vue`) [STRONG for mobile]
- Header: `h-12 px-2 bg-white dark:bg-warm-900 border-b`. The hamburger is a **`w-10 h-10` touch target**, the title is `kt-text-body font-medium truncate flex-1`, and the host chip is icon-only.
- Bottom tab bar: `flex-1 flex-col items-center py-2` buttons with a `text-lg` icon and a `kt-text-caption` label. Active is `text-iolite`. `padding-bottom: env(safe-area-inset-bottom)`. At most **5 inline tabs** (`MAX_INLINE_PANELS`); the rest go into a "More" popover that is `max-h-[60vh] overflow-y-auto`. *"If the active panel would otherwise live in the overflow menu, hoist it into the visible bar so the user always sees what's selected"* (`CompactTabBar.vue:62-71`).
- `KeepAlive` around the active panel keeps terminal connections and chat scroll alive across tab switches (`CompactWorkspaceShell.vue:3-6`).
- **Removed trap** (d490d91c): *"replaces the old 'force desktop mode' laptop-icon button — a one-way trap on Android (no way back once activated, density auto-detect was the canonical signal)"*. **Don't** offer a mode switch the user can't undo from the same screen.
- Tabs that are too big for the current density render `UnderDensityPlaceholder` instead of a broken layout. It shows a screen icon, the title "needs larger screen", a message naming the panel, and one primary button, "Use desktop mode", which pins the override (`shell/UnderDensityPlaceholder.vue`). Tab kinds declare `minDensity` (`stores/tabKindRegistry.js:41-48`; e.g. `studio-editor` requires `regular`).

### 3.7 Detached / popout windows
- Web detached panel (`pages/detached/[key].vue`, from 18734fae, "phase 11"): `h-screen w-screen`, with a minimal `h-7` top bar showing the panel icon, label, `·` and instance name, and a "Reattach" button. Unknown panels get a centred warning icon (`opacity-40`) and a message. Pop-out uses `window.open(url, "kt-<inst>-<panel>", "width=720,height=520,menubar=no,toolbar=no")`; the slot is removed and the panel marked detached only if the popup actually opened (`layout/ZoneSlot.vue:109-119`).
- Desktop session popout (`shell/PopoutApp.vue`): an `h-8` bar with a chat icon, the title, and "← Return to main". It runs its own `ToastCenter` and `useWindowChrome()`, and the content is an `AttachTab` scoped with `acquireScope/releaseScope`. **Every top-level window gets its own toast host and chrome sync.**

### 3.8 Desktop (Tauri) integration
- **Mica/Acrylic** (`packaging/desktop/src-tauri/src/material.rs`): only on Windows build ≥ 22621. The shell injects `document.documentElement.dataset.ktMaterial = 'mica'|'acrylic'`. CSS (`style.css:70-85`): *"the page behind the shell is transparent and only the rail is translucent, so the material shows in the sidebar while every content surface stays opaque."* The rail becomes `rgba(220,213,203,.55)` in light and `rgba(38,34,31,.45)` in dark. **Translucency belongs on the frame only; content stays opaque.**
- **Window caption colour follows the page** (`composables/useWindowChrome.js`, 7dcd1360). It samples `elementFromPoint(innerWidth/2, 1)`, walks up to the first background with alpha ≥ 0.5, and sends the RGB to the shell. A MutationObserver on `<html class>` repaints when the theme toggles, coalesced with rAF. The Rust side chooses black or white caption text by contrast (`chrome.rs:30 text_for`, tested e.g. `[227,221,213] → black`, `[98,80,213] → white`).
- **Native menus first, in-page fallback** (`TabItem.vue:106-119`, `RailItem.vue:296-308`; b24683f8 *"built from the same model as the in-page one… the page falls back to its own menu when the shell shows nothing"*). Menu models live in pure modules (`shell/tabMenu.js`, `shell/railMenu.js`) so both renderers share them.
- `DesktopBackendBanner`: a fixed top strip, `text-xs py-1.5 border-b`. Restarting shows amber (`bg-amber/15 border-amber/40`), failed shows coral (`bg-coral/15 border-coral/40 text-coral`), and failed also offers inline underlined "Restart" and "Logs" actions. It uses `role="alert"`.
- `DesktopStatusChip` in the status bar: a multi-line `title` tooltip summarizing the tray, restore and summon shortcut. A `w-1.5 h-1.5 rounded-full bg-iolite` "new" dot shows until first-run is dismissed. **A small iolite dot means "unseen new thing", and a small amber dot means "needs attention".** Settings nav badges use `bg-amber` (`SettingsLayout.vue:17,35`).
- External links: *"the pywebview shell has no back button, so a same-window external navigation is a dead end"* (`App.vue:140-142`), so a guard opens them outside.
- Print stylesheet (`src/print.css`, b24683f8): *"drops the app chrome and lets scroll areas grow, so printing the page prints the conversation"*.

---

## 4. Recurring component patterns (common/)

### 4.1 StatusDot (`common/StatusDot.vue`) [STRONG]
```vue
<span class="inline-block w-2 h-2 rounded-full" :class="dotClass" :title="statusLabel" role="img" :aria-label="statusLabel" />
<span class="sr-only">{{ statusLabel }}</span>
```
- Mapping: `running|processing → bg-aquamarine`, `idle|done → bg-amber`, `error → bg-coral`, `stopped|default → bg-warm-400`.
- Accessible: it has `role="img"`, an aria-label, a title, and an sr-only copy. Labels come from i18n `common.status.<x>`, falling back to the raw status string.
- **Inconsistency [ONE-OFF]:** `RailItem.vue:267-276` uses `running → bg-iolite`, `paused → bg-amber`, `errored → bg-coral`. Coral = error and warm-400 = stopped hold everywhere. Running is aquamarine in the canonical component and iolite in the rail. When reproducing, follow StatusDot: aquamarine means alive/running.

### 4.2 GemBadge (`common/GemBadge.vue`) [STRONG idiom]
The tinted-pill formula for any gem:
```
bg-<gem>-light text-<gem>-shadow dark:bg-<gem>-shadow/30 dark:text-<gem>-light
```
Light mode uses the pale tint as fill with the dark shade as text. Dark mode uses the dark shade at 30% as fill with the pale tint as text. The base class is the `gem-badge` shortcut (`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium`).

The **alpha-tint** variant appears more often in chrome and chips: `bg-<gem>/10 border-<gem>/30|40 text-<gem>[-shadow] dark:text-<gem>-light`. Examples are `chip-iolite/aqua/amber`, HostStatusChip remote, and toast borders. `bg-iolite/10` alone appears ≈74 times, mostly as the **selected/highlighted row** background (command palette highlight, settings nav active, compact overflow active `bg-iolite/5`).

### 4.3 Buttons [STRONG; two near-duplicates exist]
- `common/ActionButton.vue` (imported as `KButton`, the "v2 button") has sizes `sm` = `px-2 py-1 text-xs h-7` and `md` = `px-3 py-1.5 text-sm h-8`, with icon `text-sm/text-base` and a `gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors select-none` base. Variants:
  - primary `rounded-lg bg-iolite text-white hover:bg-iolite-shadow`
  - danger `rounded-lg bg-coral text-white hover:bg-coral-shadow`
  - ghost `bg-transparent text-warm-600 hover:bg-warm-200/60 dark:hover:bg-warm-800/60`
  - secondary `kt-v2-edge kt-v2-panel border text-warm-700 hover:border-iolite/50`. **The secondary hover is a border tint, not a fill.**
  - Disabled is `opacity-50 cursor-not-allowed`.
- `common/PickerButton.vue` is the older twin, with secondary as `bg-warm-100 border-warm-200`. [ONE-OFF duplication]
- Hover rule for solid gem buttons: **go to the `-shadow` shade**. Ghost and icon buttons hover with a warm alpha fill (`warm-200/60`, `warm-300/50` on the rail, `warm-700/40-50` in dark).
- Hover for "danger-adjacent" icon buttons: muted until hover, then `hover:text-coral` (AppHeader stop). Neutral info actions use `hover:text-iolite`.
- In dialogs, primary controls are often shared **class-string constants** instead of components, e.g. `const INPUT = "kt-v2-edge kt-v2-panel px-3 rounded-lg border … focus:outline-none focus:border-iolite"` and `const BUTTON = "kt-v2-edge kt-v2-panel h-9 px-3 rounded-lg border text-xs …"` (`shell/newSession/NewSessionDialog.vue:87-88`, `session-v2/add/AddDialog.vue:142-143`, `shell/history/HistoryPage.vue:122`).

### 4.4 Modal shell (`common/ModalShell.vue`)
`fixed inset-0 z-50 bg-black/40 p-4` holds a `bg-warm-50 dark:bg-warm-950 rounded-lg shadow-xl border max-w-2xl max-h-[90vh] flex flex-col`. The header is `px-4 py-3 border-b`, the body `flex-1 overflow-y-auto p-4`, and the optional footer `border-t`. The close button is a **`w-9 h-9` touch target on mobile that shrinks to `sm:w-5 sm:h-5`**, a responsive tap-target trick that also appears on the rail theme toggle (`RailPane.vue:124`). Esc dispatches `kt:modal:escape`.

### 4.5 Split / resize handles
- 3-4px wide, invisible or border-coloured until hover, then an iolite tint at 30% (hover) or 50% (drag). `touch-action: none`, pointer capture, double-click reset where it applies.
- v2 replaces this with the always-visible grip pill (§2.2). Choose the v2 grip for discoverability.

### 4.6 Metric (`common/Metric.vue`)
A label (`text-[10px] uppercase tracking-wider text-warm-500`), a value (`text-xl font-medium tabular-nums`), and an optional hint (`text-[10px] text-warm-400`).

### 4.7 Segmented switch (`shell/rail/RailAppSwitch.vue`)
`grid grid-cols-2 rounded-lg border border-warm-300 p-0.5 text-[12px]`, with `role="radiogroup"` and `role="radio" aria-checked`. ON is `bg-white dark:bg-warm-700 shadow-sm font-medium text-warm-800`; OFF is `text-warm-600 hover:text-warm-800`. **The selected segment is a raised white chip, not a coloured fill.** Element Plus `el-segmented` is used for the same purpose in settings.

### 4.8 Chips (`HostStatusChip.vue`)
`h-7 px-2 rounded text-[11px] border`. Remote shows the iolite tint; local shows a neutral bordered chip whose icon is `text-warm-400`. **Gem colour marks "non-default / remote / special" state; neutral warm marks the default.**

---

## 5. Settings layout (`components/settings/*`, 32f4b09f) [STRONG; latest conventions]

- The settings page went from *"one tab strip of eleven tabs with the panes written inline"* to a **grouped section nav**. Sections register as `{ id, labelKey, descriptionKey, icon, group, order, keywords, visible(), scope, width:'fill' }` (`settings/builtinSections.js`). Groups are General, AI, Agents, Account, System and Extensions, with order 10…90 in gaps of 10 so extensions can slot in between.
- **Wide layout** (`settings/layout/SettingsLayout.vue:25-41`): the nav is `kt-v2-panel kt-v2-edge w-56 border-r p-3`. A search `el-input size=small` sits on top, with Esc clearing it. Group captions are `text-[11px] uppercase tracking-wider text-warm-400`. Items are `h-9 px-3 rounded-lg gap-2.5 text-sm`; active is `bg-iolite/10 text-iolite font-medium` with `aria-current="page"`, inactive hover is `bg-warm-200/60`. The content column scrolls unless the section is `width:'fill'`, which manages its own scroll.
- **Phone layout:** list-to-page navigation. The list rows are `min-h-14 px-4 gap-3 border-b` (`kt-v2-line`), with a `text-lg` icon, a `text-[15px]` label, an optional amber dot and a chevron-right. They use `active:bg-warm-200/60` for touch feedback (`:active`, not hover). A section opens as a `PhonePage` with a back button. *"On a phone the section list is the first screen, unless a section was opened on purpose"* (`SettingsLayout.vue:62`).
- Search matches the label, group and `keywords` (`builtinSections`: appearance → "theme, dark, language, zoom, font"). An empty result shows a centred `text-warm-400` message.
- `SectionShell` (`session-v2/settings/SectionShell.vue`): `max-w-4xl mx-auto px-8 py-6 gap-5` (phone `px-3 py-3 gap-3`). Header is an `h2 text-lg font-semibold` (hidden on phone because *"the page bar carries the title"*) plus a hint `text-sm text-warm-500 leading-relaxed`. Error and status lines are inline banners: `rounded-lg border border-coral/30 bg-coral/10 text-coral role=alert`, or the aquamarine equivalent with `role=status`. The body is a `kt-v2-card p-5`, or `bare` for sections made of their own cards. The optional sticky footer save bar is `kt-v2-canvas kt-v2-line sticky bottom-0 border-t`.
- `SettingsGroup`: a caption (`kt-text-caption uppercase tracking-wider text-warm-500`) over a `kt-v2-card divide-y divide-[var(--v2-line)]`.
- `SettingsRow`: `px-4 py-3 flex gap-4`. Title is `kt-text-body font-medium`, hint is `kt-text-caption text-warm-500`, and an optional status line uses tone `muted|ok|warn|error`, mapping to `text-warm-500 | text-aquamarine-shadow dark:text-aquamarine-light | text-amber-shadow dark:text-amber-light | text-coral`. **On phones (`max-md:`) the control drops under the text unless `inline`** (*"a switch is small enough to stay"*).
- **Tone vocabulary [STRONG]:** ok = aquamarine, warn = amber, error = coral, info/primary = iolite, neutral = warm. Text on a light background uses the gem's `-shadow` shade in light mode and `-light` in dark mode, because the DEFAULT tone is too low-contrast as text. Coral DEFAULT is used directly as error text.
- Appearance section: the zoom row is `[−] range [+] 100% [Reset]` using ghost KButtons with `aria-label`s and `accent-iolite` on the range. Zoom is shown **per device class**: *"Zoom is kept per device class; the row shows the one this screen uses."* Reading size is an `el-segmented`.

---

## 6. Interaction conventions

### 6.1 Keyboard [STRONG]
- Global handler (`composables/useKeyboardShortcuts.js`): `Ctrl/⌘+K` opens the palette; `Ctrl+Shift+L` enters layout edit; `Ctrl+Shift+>` / `<` / `0` change zoom by ±0.05 or reset; `Ctrl+1..6` select presets.
- **Editable-target guard:** shortcuts are ignored in `INPUT/TEXTAREA/SELECT/contentEditable`, **except Ctrl+K, which always wins** (*"matching Slack / Linear / VS Code palette conventions"*).
- **Layered claiming:** `TabGroupContainer` binds in the **capture phase** and calls `preventDefault`, and the global handler skips keys that are already `defaultPrevented`. A focused chat surface keeps its own `Ctrl+\`, `Ctrl+W` and `Ctrl+Tab` (*"We yield those to it"*). The result is that **one keypress does one thing** (835eba34: *"Ctrl+1..9 both switched the layout preset and focused the Nth chat/tab group. With two or more groups the matching digits now focus the group; otherwise they switch presets."*).
- VS Code-style groups: `Ctrl+\` splits horizontally, `Ctrl+Alt+\` splits vertically, `Ctrl+Shift+W` closes a group (only when more than one exists), `Ctrl+Tab` cycles, and `Ctrl+1..9` focuses group N (only while split).
- Command palette (`chrome/CommandPalette.vue`): `el-dialog` `520px`, `align-center`, no close button, closes on outside click. The header is a borderless input with prefix sigils (`> @ # /`); the parsed prefix is echoed on the right in `text-[10px] uppercase font-mono`. Results are `max-h-80 overflow-y-auto`. ↑/↓ wrap around, Enter runs, Esc closes, mouseenter moves the highlight, and the highlight resets to 0 whenever results change. Highlight style is `bg-iolite/10 text-iolite`. Each row has an icon, a label, a 9px description, and a right-aligned mono shortcut. Empty state: `text-center py-6 italic text-warm-400` "No matches". Focus moves to the input on `nextTick` after opening.
- Shortcut help (`chrome/ShortcutHelp.vue`): grouped rows with `<kbd>` keycaps (`px-1.5 py-0.5 rounded bg-warm-100 border font-mono text-[11px]`). The modifier label is platform-aware: `⌘` on Mac/iOS, `Ctrl` elsewhere.
- Shortcuts are **advertised in the UI**: the `Ctrl+K` pill in AppHeader, shortcut text in preset dropdown items, and `title="Exit edit mode (Esc)"`.

### 6.2 Hover / focus
- `hover-only-action` + `group` appears in 11 files. Its comment (`style.css:293-308`) asks you to *"Always pair with an explicit non-overlay layout fallback — the action group should not depend on absolute positioning to avoid stealing tap targets from the underlying card on mobile."* It also reveals on `:focus-within`, so keyboard users can reach the actions.
- Focus styling for text inputs is `focus:outline-none focus:border-iolite` (≈22 occurrences), **a border colour change instead of a ring**. `focus-visible` is rare (≈5). **Gap:** custom buttons mostly have no visible focus style. Don't copy that; add `focus-visible:ring-2 ring-iolite/40` when reproducing.
- `transition-colors` (≈128 occurrences) is the default; `0.15s ease` for opacity reveals and handle colour; `0.2s` for fade/slide transitions (`style.css:480-506`; the slide is a 10px translateX plus opacity).
- Tooltips: native `title` on almost every icon button [STRONG]. Element Plus tooltips are used only for long docs (`kt-hint-tooltip`).

### 6.3 Touch
- `(pointer: coarse)` is the touch switch. It targets phones and tablets and leaves touch-screen laptops alone (`style.css:205-216`).
- Inputs are ≥16px on touch to stop iOS focus zoom. `.btn-primary/.btn-secondary` get `min-height: 40px` and extra vertical padding (*"meet the 44px minimum tap target on touch"*). `.el-tabs__item` moves onto `--kt-fs-body`.
- `touch-action: manipulation` on html prevents double-tap zoom; `-webkit-text-size-adjust: 100%` stops Android font boosting (explained in a long comment: the chat input otherwise rendered at *"~32-40px on a 360-414px phone"*); `overflow-x: hidden` on html prevents sideways page pan (`style.css:161-201`).
- Long-press replaces right-click (`composables/useLongPress.js`): 500ms delay, cancelled by more than 8px of movement, PointerEvents only.
- Soft keyboard: `useSoftKeyboard` combines the Android bridge with `visualViewport` and exposes CSS vars. Dialog bodies are `max-height: calc(100dvh - 120px)` so actions stay above the keyboard.
- Safe area: `env(safe-area-inset-bottom)` on the bottom tab bar and its overflow popover.
- Mobile dialogs go fullscreen through one global CSS rule at `max-width: 767px` (*"saves us from sprinkling `:fullscreen="isCompact"` across 20+ dialog templates"*). Message boxes are `calc(100% - 32px)`. bc4ba65b turned the model selection popover into a drawer *"to avoid layout issue"*. **On small screens, prefer drawers or sheets to popovers.**

---

## 7. Density & responsive strategy [STRONG]

- **One reactive signal** (`composables/useDensity.js`): `density ∈ compact|regular|expansive`, with `isCompact`, `meetsDensity(current, required)` and `densityRank`. The thresholds are `COMPACT_MAX = 768` and `REGULAR_MAX = 1280`. The user override (`auto|compact|regular|expansive`) is stored as the hybrid pref `kt-density-override` and synced across tabs through the `storage` event. The composable is a module-level singleton with lazy init, *"so `import` [stays] side-effect-free, which matters for tests"*.
- The shell branches on density: `MacroShell` renders `CompactShell` when compact. Settings switch between nav-and-content and list-to-page. Session v2 has a separate phone layout (e53e9dd4: *"At compact density the v2 session no longer shrinks the desktop layout"*. Instead it uses phone-native sheets, a model chip, full-screen side views, and "phones have no Workspace tab"). **Phones get a different interaction model, not a squeezed desktop.**
- CSS-only responsive rules use the same breakpoint: `max-width: 767px` for dialogs, and `max-md:` (≈49 uses) and `sm:` for row stacking and tap-target sizing.
- `theme.setMobileMode(isCompact)` picks the zoom slot (`App.vue:87-91`).
- **Zoom** is CSS `zoom` on `<html>`, clamped to 0.6-2.0 and rounded to 0.01, with separate desktop and mobile values (both default 1.0 now; earlier defaults were 115% and 125%, 2b7dbc8e). It was moved from `#app` to `<html>` in ce31abd5: *"Scoping zoom to #app left those teleported surfaces at 1.0× while the rest of the UI scaled, producing the 'navbar super small / dropdown overflows on mobile' mismatch."* 2b7dbc8e used an `html/body/#app` `height:100%` chain *"instead of 100vh so CSS zoom works without viewport overflow"*.
- **Overflow discipline:** `truncate` (≈408 uses) plus `max-w-NN` on every label inside chrome; `min-w-0` on flex children; scoped scrollers only (`overflow-x: auto` opted in per container, with `scrollbar-none` on horizontal tab strips).

---

## 8. Dark-mode strategy [STRONG]

- Theme store (`stores/theme.js`): the default pref `"system"` follows `prefers-color-scheme` on init. An explicit toggle stores `light`/`dark` and toggles `html.dark`. Toggle UI: a sun/moon icon in the rail footer and collapsed strip (the icon shows the **target** mode), an `el-switch` in Appearance, and `title` text "Switch to light/dark".
- **Pairing rule:** every surface, text and border utility is written with its `dark:` twin inline. Typical pairs:
  - page `bg-warm-50` / `dark:bg-warm-950`
  - bars and headers `bg-white` / `dark:bg-warm-900`
  - borders `border-warm-200` / `dark:border-warm-700`
  - primary text `text-warm-800` / `dark:text-warm-200`
  - secondary text `text-warm-600` / `dark:text-warm-400`
  - hover fill `warm-100|200/60|300/50` / `dark: warm-800|800/60|700/50`
- **Gem text adapts:** `text-<gem>-shadow` (light) becomes `dark:text-<gem>-light`. Iolite as accent text uses `text-iolite dark:text-iolite-light`.
- Light and dark aren't mirror images. Light uses a stone frame (rail darker than strip, strip darker than page, cards white). Dark lifts each surface level lighter, and cards lose their shadow.
- Scoped-style pitfall (`docs/en/dev/frontend.md:251-255`): *"keep the complete selector inside `:global(...)`, e.g. `:global(html.dark .kt-chat-composer__shell)`. Combining `:global(.dark) :deep(...)` can compile to a bare `.dark` rule and lose the target component selector."*
- Third-party widgets (Vditor, xterm) watch `themeStore.dark` and call their own theme APIs.

---

## 9. State & feedback patterns

| Situation | Pattern | Evidence |
|---|---|---|
| Live status | 2×2 dot (aquamarine/amber/coral/warm-400), with **no** animation | `common/StatusDot.vue`, `style.css:508-535` |
| Active processing | `.kohaku-pulse`: an opacity pulse from 0.4 to 1, 1.5s. Only on "Processing…" text, the reconnect banner, and the compaction marker (16 files) | `style.css:508-535` |
| Toast | bottom-right `fixed z-[9999]`, max 6 visible, `min-w-64 max-w-96 rounded-lg border px-3 py-2 text-xs shadow-lg backdrop-blur bg-white/95 dark:bg-warm-900/95`. Level shows as a **tinted border plus a coloured icon**, not a coloured fill (info iolite, ok aquamarine, warn amber, error coral). 6s auto-dismiss; history kept (200) | `chrome/ToastCenter.vue`, `stores/notifications.js` |
| Quick result | `ElMessage.error(t(...))` (47 files) is more common than the notifications store (6 files) | grep counts |
| Confirm | `ElMessageBox.confirm` (24 files), `el-popconfirm` for inline deletes, and `window.confirm` in a few places (5, e.g. `RailItem.vue:353`) [ONE-OFF] | grep |
| Inline section error/status | coral or aquamarine tinted banner with `role=alert/status` | `SectionShell.vue:10-11` |
| Row status | `SettingsRow` `status` + `tone` | `settings/ui/SettingsRow.vue` |
| App-level failure | fixed top banner with inline recovery actions (Restart, Logs) | `chrome/DesktopBackendBanner.vue` |
| Mode in progress | amber banner (edit mode) with `● unsaved` | `layout/EditModeBanner.vue` |
| Loading | centred `text-warm-400 text-sm` text ("Loading layout…", "Loading panel…"); Element Plus `:loading` on selects. No skeletons in chrome | `WorkspaceShell.vue:182`, `CompactWorkspaceShell.vue:12-15` |
| Empty | centred muted text, sometimes italic ("No matches"), or an icon at `opacity-40/60` plus a message | `CommandPalette.vue:321`, `detached/[key].vue:19-24`, `UnderDensityPlaceholder.vue` |
| Busy row | `opacity-70`, `disabled:cursor-wait`, clicks ignored | `RailItem.vue` |
| Disabled menu item | `opacity-40 cursor-not-allowed` + `title` giving the reason | `TabContextMenu.vue:92-95` |
| Connection | `useNetworkStatus` merges three signals (`navigator.onLine`, the Android bridge, `/healthz`) into `online/host-only/offline` | `composables/useNetworkStatus.js:1-21` |
| Host identity | HostStatusChip is neutral for same-origin and iolite for remote | `host-picker/HostStatusChip.vue` |
| Attention | tab badges (`!` pending / `●` completed), the document title, and a favicon drawn as an SVG data URL (the allowlisted palette exception) | `TabItem.vue:53-60`, `composables/useAttentionEffects.js` |
| Missing value | `—` (em dash) | StatusBar, AppHeader |

**The no-glow rule, verbatim** (`style.css:515-522`):
> We used to ship a `.kohaku-glow` class (pulsing halo on status dots) — it got removed. A terrarium view can have 10-30 status dots on screen at once, and *any* continuous animation on each one was enough to saturate the compositor and keep the GPU busy even when the page was idle. The dot's colour already tells you "running" (aquamarine) vs "idle" (amber) vs "error" (coral); animation added no information.

---

## 10. Naming conventions

- **CSS classes:** `kt-` prefix for app-owned global classes (`kt-text-body`, `kt-hint-tooltip`, `kt-macro-shell`, `kt-rail-pane`, `kt-conversation-host`); `kt-v2-` for the v2 surface system (`kt-v2-card`, `kt-v2-edge`, `kt-v2-tab--active`, `kt-v2-grip`); BEM-ish `block__element--modifier` in component CSS (`split-pane__splitter--active`, `layout-split__handle`, `kt-chat-composer__shell`); plain-English shortcuts in uno (`card`, `btn-primary`, `chip-iolite`, `nav-item-active`, `input-field`); the legacy `kohaku-pulse`.
- **CSS variables:** `--kt-fs-*` (type tiers), `--kt-color-<gem>[-light|-shadow]` (generated palette), `--kt-shell-*` (frame), `--kt-reading-root-size`, `--color-*` (semantic surfaces/text), `--v2-*` (v2 surfaces), and Element Plus's own `--el-*`.
- **Pref keys:** `kt-…` or `kt.…` (`kt-density-override`, `kt-reading-size`, `kt-desktop-zoom`, `kt.rail.width`, `kt.rail.collapsed`, `kt.splitPane`). The two separators coexist [ONE-OFF inconsistency].
- **Events:** `kt-…` / `kt:…` window CustomEvents; layout events go through the `layoutEvents` helpers.
- **Data attributes:** `data-test` for tests; `data-kt-material`, `data-reading-size` and `data-zone-id` for styling or state hooks on `<html>` or containers.
- **i18n keys:** dotted namespaces, `area.sub.leaf` (`shell.rail.collapse`, `shell.tab.closeLeft`, `settings.desc.appearance`, `common.status.running`, `density.needsLargerScreen.title`).
- **Icons:** Carbon only (`i-carbon-*`, ≈1224 uses, no other icon set). `presetIcons({ scale: 1.2, display: inline-block, vertical-align: middle })`. Icons are often rendered directly as the button element: `<button class="i-carbon-search w-4 h-4 …">`.

---

## 11. i18n approach (`utils/i18n.js`, `stores/locale.js`) [STRONG]

- A home-grown, dependency-free `translate(locale, key, params)`: look up the locale table, fall back to English, then fall back to the key itself. Interpolation is `{name}`, and a message may be a function `(params) => string`. `useI18n()` returns `t`, `panelLabel`, `panelDescription`, `presetLabel` and `statusLabel`, each a registry lookup with a fallback.
- Locales: `en, zh-TW, zh-CN, ja, de, ko`, with display names in their own script (`繁體中文`, `日本語`). BCP-47 tags fall back to the primary subtag (`stores/locale.js:14-25`).
- Dictionaries are split **by feature** (`lab.js`, `studioApp.js`, `settingsModels.js`, `media.js`, `links.js`, `slash.js`, `messageActions.js`). Each feature file is `{ en:{…}, "zh-TW":{…}, "zh-CN":{…} }`, merged per locale in `locales/index.js`. Smaller locales (ja/de/ko) get only the core table and fall back to English for feature strings.
- Draft subsystems keep their own string tables until they stabilize (`session-v2/model/v2Strings.js`: *"Strings of the v2 session shell, kept apart from the shared locale files while v2 is a draft"*), with a used/unused-key test.
- The locale cycle button in the rail footer is tiny (`text-[10px] uppercase tracking-wider`) and shows the code (`en`, `zh-TW`); the full selector is in Settings → Appearance. Both read the same `SUPPORTED_LOCALES` list.
- Policy: chrome strings are translated; user data (names, ids) is never translated (§3.3). [ONE-OFF gaps] Some chrome literals are still in English: `"No matches"`, `"Reattach"`, `"Layout edit mode"`, `"More"`, the `"Drag to resize · double-click to reset"` title, `"Dismiss"`.

---

## 12. Preferences persistence (`utils/uiPrefs.js`) [STRONG]

> localStorage is ALWAYS the primary store: reads are synchronous and writes land locally first, so no user-visible path ever waits on the network. The backend copy (`/settings/ui-prefs`) exists only so real UI *settings* (theme, zoom, layout, locale…) survive a fresh browser profile. It is written fire-and-forget, coalesced, and debounced. High-frequency ephemeral state (chat input drafts, per-instance tab state) must NOT go through the hybrid setters… One keystroke must never become one HTTP request.

Flush happens after 1500ms idle, with a 10s max wait, and backs off on failure. When the backend copy loads late, `theme.init` only applies it if the user hasn't changed the setting in the meantime (the `_readingSizeChanged` flag): *"Preserve late-loaded reading preferences without expanding the global UI preference sync behavior"* (aaf1e18e).

---

## 13. Explicit "don'ts" (consolidated)

1. **Don't use stock Tailwind palette scales** (`text-red-500`, `bg-gray-100`, `stone-*`) or invented gem shades (`iolite-dark`). The test fails on them. Use gem `light/DEFAULT/shadow` + `warm-50..950` (palette guard; da92f6c9).
2. **Don't hard-code hex or rgb in shared CSS.** Use `var(--kt-color-x, <exact theme hex>)` (gem-tokens test).
3. **Don't apply continuous animation to repeated indicators** (removed `.kohaku-glow`; GPU saturation).
4. **Don't hide actions behind hover without a touch fallback.** Use `hover-only-action` (`style.css:293-321`).
5. **Don't use `text-[Npx]` for chrome or settings text.** Use the `kt-text-*` tiers (`style.css:11-25`; reading-size test).
6. **Don't apply zoom to `#app`.** Teleported overlays escape it (ce31abd5; `stores/theme.js:379-388`).
7. **Don't theme Element Plus per component.** Remap its CSS variables globally (a7279e7b).
8. **Don't let library poppers grow unbounded.** Use an opt-in max-width class, not a global override (`kt-hint-tooltip`).
9. **Don't sprinkle `:fullscreen` across dialogs.** One media rule handles phones (`style.css:338-387`).
10. **Don't ship one-way mode traps** (the "force desktop mode" button on Android; d490d91c).
11. **Don't close a drawer on any click.** Close it on the outcome (the active tab changed), so modals spawned from it survive (`CompactRailDrawer.vue`).
12. **Don't bind one key to two actions.** Claim keys in the capture phase and respect `defaultPrevented` (835eba34).
13. **Don't use multi-root templates or `min-h-0` on %-sized split children** (the "split has a hole" bug; `SplitTreeNode.vue`).
14. **Don't build icon or class names dynamically.** Keep literal strings where UnoCSS scans (`uno.config.js:10`; `builtinSections.js:15`).
15. **Don't write prefs to the network per keystroke.** Use the hybrid, debounced setters (`uiPrefs.js`).
16. **Don't poll while hidden or overlap polls** (`useVisibilityInterval`; 90a70ce7, d22c41d8).
17. **Don't translate user data** (`TabItem.vue:168-171`).
18. **Don't leave the light theme's muted greys at warm-400/500.** They fail contrast on stone (e58d1cc6, `style.css:54-64`).
19. **Don't use `el-input` inside dark dialogs.** Its inner background is inconsistent; use the `input-field` shortcut (d490d91c).
20. **Don't shrink the desktop UI for phones.** Build phone-native sheets and list-to-page flows (e53e9dd4; 32f4b09f).
21. **Don't break a stored preference when redefining a scale.** Map legacy values (a94e2ff8).

---

## 14. Strong vs one-off summary

**Strong / reproduce:**
- gem + warm palette under test
- the `light/DEFAULT/shadow` shade grammar and the tinted-badge formula
- iolite = primary/selection, aquamarine = ok/running, amber = idle/warn/mode/attention, coral = error/danger, warm = neutral
- inline `dark:` twins
- the stone frame (rail < strip < page = active tab)
- the v2 five-level surface model with edge vs line borders
- `h-8` tab strip with an iolite bottom border on the active tab, `h-6` mono status bar, `h-8` instance header, `h-12` compact header
- `.seg-sep` currentColor separators
- `uppercase tracking-wider` micro section labels
- `truncate` + `min-w-0` everywhere
- `title` on icon buttons, `data-test` hooks
- `hover-only-action`
- the density singleton with shell branching
- `(pointer: coarse)` touch rules
- global EP variable remap
- visibility-aware polling
- hybrid prefs
- native-menu-first desktop integration
- settings as grouped nav / phone list-to-page with Group > Card > Row

**One-offs / inconsistencies, not to copy:**
- RailItem running = iolite (StatusDot says aquamarine)
- `ActionButton` vs `PickerButton` duplication
- the mix of `window.confirm`, `ElMessageBox` and `el-popconfirm`
- English literals in some chrome
- heavy `text-[10-11px]` usage outside the tiered surfaces
- the `kt-` vs `kt.` pref-key separators
- the near-absence of `focus-visible` styling on custom buttons
- `SplitTreeNode`'s fallback `var(--color-iolite, #6366f1)`, which names a variable that doesn't exist (`--color-iolite`, not `--kt-color-iolite`) and a non-gem fallback (`common/SplitTreeNode.vue:36`). The palette guard misses it because it is neither a Tailwind class nor a banned rgb.
