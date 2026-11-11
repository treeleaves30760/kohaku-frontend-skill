# Tokens and theme

The canonical values live in `assets/tokens.css` (plain CSS vars), `assets/uno.config.js` (UnoCSS) and `assets/tailwind.preset.js` (Tailwind). This file explains how to *use* them.

## Contents
- Palette grammar
- Role → gem mapping
- Surfaces (stone frame + v2 five levels)
- Dark mode
- Typography
- Shape, elevation, motion
- Theming third-party components
- Scoped palettes (embeds, libraries, per-domain gems)

## Palette grammar

Seven gems × exactly three shades, plus one warm neutral ramp.

| gem | light | DEFAULT | shadow |
|---|---|---|---|
| sapphire | `#D6E3F8` | `#0F52BA` | `#082567` |
| aquamarine | `#D4EDE8` | `#4C9989` | `#1B6B5A` |
| taaffeite | `#E8D5ED` | `#A57EAE` | `#6B4670` |
| **iolite** (primary) | `#DDD0F0` | `#5A4FCF` | `#312A7A` |
| amber | `#F5E6C8` | `#D4920A` | `#8B5E00` |
| coral | `#F5D5D5` | `#D46B6B` | `#8B3A3A` |
| sage | `#D5E8DA` | `#5A9E6F` | `#3A6B48` |

warm: 50 `#F7F5F2` · 100 `#EFECE7` · 200 `#E0DBD4` · 300 `#C5BFB7` · 400 `#A09A92` · 500 `#8A8480` · 600 `#6A645F` · 700 `#4A4540` · 800 `#3A3632` · 900 `#2A2724` · 950 `#1A1816`

What each shade is for:
- **light**: pale fill (badge background, callout tint, selection wash in light mode); text colour on dark backgrounds.
- **DEFAULT**: solid fills (primary button, dot, bar), icons, links in light mode.
- **shadow**: text on a light tint, hover state of a solid button, badge fill at 30% in dark mode.

Tint recipes (use these ratios, don't invent new tokens):
- chip: gem 10% fill, 40% border (Market/Docs use 20% border on larger chips), text `-shadow` light / `-light` dark — except iolite and sapphire, whose DEFAULT is already dark enough to be the light-mode text
- solid fills (bars, meters, sparklines) in dark mode: lift the deep gems — `--kt-fill-accent` (#8b83db) and `--kt-fill-info` (#6f9be0); aquamarine/sage/amber/coral DEFAULT read fine on dark
- solid badge: `bg-<gem>-light text-<gem>-shadow dark:bg-<gem>-shadow/30 dark:text-<gem>-light`
- selected row: iolite 9–10% (`bg-iolite/10`); nested "related" highlight iolite 5%
- banner / event strip: 5–10% fill, 20–35% border; `color-mix(in srgb, var(--kt-color-x) 8%, transparent)` in hand CSS
- callout (docs): 4px left bar in the gem; fill `color-mix(gem-light 55%, surface)` light / `color-mix(gem-shadow 30%, surface)` dark

Hard bans (the guard script and the author's test enforce them): stock Tailwind hues (`blue-500`, `gray-100`, `slate-*`, `zinc-*`, `stone-*`, `emerald`, `teal`…), invented gem shades (`iolite-dark`, `coral-500`), cool greys, and ad-hoc hexes in shared CSS.

## Role → gem mapping

Pick colour by **meaning**. One mapping per product; write it down in the code (a `tones.js` map or CSS vars) and never reuse a status colour for identity.

| meaning | gem | notes |
|---|---|---|
| primary action, focus, selection, links, active nav, "accent" | **iolite** | the only accent; dark mode text uses `iolite-light` |
| live / running / connected / busy-and-healthy | **aquamarine** | the canonical `StatusDot` "running" |
| done / success / passed / tip / "copied" | **sage** | always with ✓ or an icon |
| needs you / waiting / warning / queued / edit-mode banner / "official" | **amber** | small amber dot = needs attention |
| error / destructive / stop / failed | **coral** | coral DEFAULT is readable as text |
| tool / informational / magnitude (heat) | **sapphire** | "heat is a magnitude, not a status: its own hue" |
| secondary entity (sub-agent, category, channel member) | **taaffeite** | |
| stopped / unknown / metadata / disabled | **warm-400/500** | neutral is the default; gem marks the non-default |

Small iolite dot = "unseen new thing". Small amber dot = "needs attention". A gem on a chip marks a *non-default* state (remote host, official package); the default state is neutral warm.

Context/fill thresholds: calm below 60%, amber 60–80%, coral above 80%.

## Surfaces

### Base ("stone") tokens
| token | light | dark |
|---|---|---|
| `--color-bg` | `#f2eee8` | `#1a1816` |
| `--color-surface` | `#ffffff` | `#252220` |
| `--color-surface-alt` | `#efebe5` | `#1e1c1a` |
| `--color-border` | `#e5dfd7` | `#3d3835` |
| `--color-text` | `#2e2a26` | `#e8e0d8` |
| `--color-text-muted` | `#6c655d` | `#8a8078` |
| `--color-text-faint` | `#8f8880` | `#5a5550` |

Text roles: **text** for content; **muted** for metadata, labels, captions, section titles; **faint** only for placeholders, disabled items and decorative separators (it fails body-text contrast — never put information there).

**Light-mode contrast patch** — warm-400/500 are too pale as text on stone (`base.css` ships this patch). Either use warm-600 for muted text, or patch the utilities (UnoCSS/Tailwind):
```css
:where(html:not(.dark)) .text-warm-400 { color: #77706a; }
:where(html:not(.dark)) .text-warm-500 { color: #655e57; }
```
`:where()` keeps specificity at zero so hover/dark variants still win.

### v2 five-level surfaces (app shells)
"Five levels, each a job":
- **rail/chrome** — the frame: nav rail (darkest), tab strip/header. The *active tab* equals the canvas colour so tab and page read as one surface.
- **canvas** — what a tab shows (chat, page). Near-white in light mode.
- **panel** — side regions (rails, inspectors, settings nav), **always edged by a strong line** (`--v2-line-strong`).
- **card** — grouped content on a canvas; 1px `--v2-line` border, `rounded-xl`, tiny shadow in light only.
- **float** — above the page (menus, popovers, docks, tooltips) with a soft 6/20 shadow.

Region boundaries use `--v2-line-strong`; rows inside a region use `--v2-line`. **Light mode steps panels darker than a near-white canvas; dark mode lifts each level lighter and drops card shadows** (elevation by lightness alone). Translucency (Mica/acrylic/backdrop-blur) belongs to the frame only; content stays opaque.

Separators inside dense bars: `width:1px; height:12–14px; background: currentColor; opacity: .12–.15` — works in both themes with no token.

## Dark mode

- Class-based: `html.dark`. Default preference is **system**; an explicit toggle stores `light|dark` (three-state: system/light/dark). Persist in localStorage wrapped in try/catch, and **apply before first paint** (inline script in `<head>`), so there is no flash.
- Write every colour utility with its `dark:` twin, inline. Typical pairs: page `bg-warm-50` / `dark:bg-warm-950`; bars `bg-white` / `dark:bg-warm-900`; borders `border-warm-200` / `dark:border-warm-700`; primary text `text-warm-800` / `dark:text-warm-200`; secondary `text-warm-600` / `dark:text-warm-400`.
- Gem text flips shade: `text-<gem>-shadow` → `dark:text-<gem>-light`; accent `text-iolite` → `dark:text-iolite-light`.
- Light and dark are not mirror images (see surfaces). Design both; screenshot both.
- Third-party widgets (charts, xterm, editors, Mermaid) must re-theme on toggle: watch the `<html>` class with a MutationObserver (coalesce in rAF) and call their theme API / re-render.
- Vue scoped styles: keep the whole selector inside `:global(html.dark .my-thing)`; `:global(.dark) :deep(...)` can compile to a bare `.dark` rule.
- Some products default to dark (hardware docs); that is a per-product choice, still with a toggle.

## Typography

- **Inter** for UI, **JetBrains Mono** for code, ids, paths, hashes, model names, and every number in text, tiles and tables (chart axis tick labels are the exception: 11px Inter with `tabular-nums`). Actually load them (Google Fonts `Inter:wght@400;500;600;700` and `JetBrains+Mono:wght@400;500`); some of the author's sites forgot to, and fell back to system UI. Add CJK fallbacks (`Noto Sans TC`, `PingFang TC`, `Microsoft JhengHei`) when the product has Chinese UI.
- Root line-height 1.5–1.6; prose 1.65–1.78; antialiased.
- **Semantic size tiers** — name by what the text *does*, not how big it looks:

| tier | app shell | reading (docs) | role |
|---|---|---|---|
| `micro` | 0.65rem | 0.75rem | badge counters |
| `caption` | 0.75rem | 0.875rem | section labels, tab labels, hints |
| `body` | 0.875rem | 1rem | default text, rail items, header titles |
| `emphasis` | 1rem | 1.125rem | prominent body, summaries |
| `title` | 1.125rem | 1.375rem | card title |
| `h2` | 1.25rem | 1.75rem | |
| `h1` | 1.5rem | 2.5rem | |

  Touch (`pointer: coarse`) bumps every tier (body → 1rem). Chrome (rail, tabs, headers, settings) must use the tiers, never `text-[13px]`. Dense data views may use the de-facto micro scale (10px section labels, 11px chips/hints, 12–13px rows) — but keep it consistent and never below 10px.
- User-adjustable **reading size** (14/16/18px root) and **zoom** (CSS `zoom` on `<html>`, not `#app`, so teleported overlays scale too) are separate preferences.
- Section label idiom: `text-[10px] uppercase tracking-wider font-medium text-warm-500`. In CJK locales (no letter case), use `text-[11px] font-semibold tracking-normal` instead. `base.css` does this through `:lang(zh|ja|ko)`, so set `<html lang>` correctly when the locale changes.
- Headline numbers: 20–28px semibold **mono tabular**, unit in muted smaller text beside it.
- Docs page titles: weight 700, `letter-spacing: -0.02em`, line-height ~1.08, `text-wrap: balance`. Kicker above the H1: uppercase, `.16em` tracking, .8rem/600, accent colour.
- Chat/markdown headings are small (h1 1.3em, h2 1.15em, h3 1.05em, weight 600) — content headings must not shout.

## Shape, elevation, motion

- Radii: controls `rounded-lg` (0.5rem), cards/panels/dialogs `rounded-xl` (0.75rem), chips/badges `rounded-full`, segmented inner `rounded-md`. Docs CTAs may be pills; app CTAs are `rounded-lg`.
- Borders: 1px warm, often at 60% alpha (`border-warm-200/60`). Hairlines over shadows.
- Shadows: nearly absent. `shadow-sm` on hover or on the raised segmented chip; floats get one soft `0 6px 20px rgb(30 24 18 / .14)`. No shadows on dark cards.
- No gradients in app UI. (Exception: the mascot/brand tile and category tiles in a marketplace.)
- Motion vocabulary: 150ms colour/opacity/border transitions, 200ms fade/slide (10px translate), chevron rotate on expand, 1px hover lift (+accent glow) on clickable cards in docs/marketing. Nothing else.
- Continuous animation only for "work is happening right now": `.kohaku-pulse` (opacity 0.4↔1, 1.5s) on a processing line, reconnect banner, compaction marker. Budget: **one pulsing element per concern** — the focused item's "working now" line (never one per running row in a list) plus the reconnect banner while it is shown; spinners (`i-carbon-circle-dash animate-spin`) only on in-flight *commands/busy rows*, a few per screen. Never on repeated status dots. Graph/event motion is one-shot. Honour `prefers-reduced-motion` (and optionally a user toggle).

## Theming third-party components

- Prefer **no component library** for new work: buttons, inputs, chips, segmented controls, tables are a handful of shortcuts/classes. The author's newest apps dropped Element Plus entirely.
- If a library is used (Element Plus, Naive UI, MUI…), **remap its CSS variable layer once, globally**, in both modes — never theme it component by component (that missed dialogs, dropdowns and select panels). Element Plus bridge: `--el-color-primary: #5a4fcf` with ramp light-3 `#8b83db`, light-5 `#ada8e7`, light-7 `#cec9f0`, light-9 `#eeedfa`, dark-2 `#4840a6`; map `--el-bg-color*`, `--el-fill-color*`, `--el-border-color*`, `--el-text-color-*` onto `--color-*`; mask `rgba(0,0,0,.5)` light / `.7` dark.
- Fix library defaults with **opt-in classes** (e.g. a `kt-hint-tooltip` popper class with `max-width: min(28rem, calc(100vw - 24px))`), not global overrides that break other instances.
- Strip library chrome you don't want (Vue Flow node bg/border/focus box-shadow, Plotly modebar, uPlot legend) and redraw it in tokens.

## Scoped palettes

- **Embeddable components** (a chat transcript reused in a VS Code webview, a graph library): leaves read only from component-scoped vars with a fallback chain, e.g. `var(--kt-conversation-accent, var(--kt-color-iolite, #5a4fcf))`. One host class maps the design system onto them; a shell variant overrides a few vars under its root. Fix colour bugs at that host boundary, never inside the leaf. Fallback hexes must equal the theme values exactly.
- **Libraries**: put every colour in one tokens file (`--kg-*`), "no colour is written outside this file", light by default, dark under `html.dark` or a `.lib-dark` class.
- **Per-domain gem**: bind a generic `gem` colour to CSS vars (`gem: { light: var(--gem-light), DEFAULT: var(--gem-main), shadow: var(--gem-shadow) }`) and set the vars once per page/section. A page declares its domain once; never hard-code a gem name in a page.
- **Code syntax colours** from the gems, via the `--kt-syntax-*` vars in `tokens.css`: keyword taaffeite, string sage, function/title iolite, number coral, variable amber, type sapphire, comment muted italic. On light backgrounds use the `-shadow` shades. On dark backgrounds use **lifted** gems (`color-mix(gem 70%, white)`), not the `-light` pastels. The same "lifted" rule makes any gem legible as a small glyph or line on warm-950 (iolite lifted ≈ `#8b83db`, the author's own value).
