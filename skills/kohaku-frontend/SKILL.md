---
name: kohaku-frontend
description: Use when building, restyling, or reviewing any web UI, dashboard, admin console, chat/agent interface, node editor, docs site, marketplace, landing page, or terminal UI for a Kohaku / Kohaku-Lab / KohakuBlueleaf project, or whenever the user asks for the "Kohaku style", gemstone palette, KohakuTerrarium look, or wants a project's UI/UX raised to that standard (palette, dark mode, density, mobile/touch, empty/error states, microcopy).
---

# Kohaku frontend design language

## Overview

The UI language of KohakuBlueleaf's projects (KohakuTerrarium, Togeari, KohakuNodeIR, TerrariumMarket, Kohaku-Docs, KohakuTUI…), distilled from their source, tests and commit history with the author's consent. **Gem accents on warm stone, quiet chrome and loud content, colour that always means something, nothing that moves unless work is happening, and a phone layout designed rather than shrunk.** Most rules exist because a specific bug or complaint happened. The skill keeps those reasons so you can apply the rules with judgment.

## When to use

- New UI in a Kohaku project, or porting an old one (Tailwind blue/slate, Element defaults) to the current identity.
- Any project whose owner wants "Kohaku-level" UX: apply the **behavioural rules** (states, density, touch, motion, copy, performance) even if the project keeps its own brand colours. In that case map the roles (accent / live / ok / attention / danger / info / entity / neutral) onto the brand palette and keep everything else.
- Reviewing a UI against this standard: go to `references/review-checklist.md`.
- Not for one-off generated research reports or Gradio patches; the author doesn't use the gem system there either.

## Core principles

1. **Palette grammar.** Seven gems × `light / DEFAULT / shadow` plus `warm-50…950`, and nothing else. No stock Tailwind hues, cool greys, `-dark` shades or loose hexes. A script enforces this (see Verify).
2. **Colour = role.** Iolite is the only accent (primary, focus, selection, links). Aquamarine = live/running. Sage = done/ok. Amber = needs you/warning. Coral = error/destructive. Sapphire = tool/info/magnitude. Taaffeite = secondary entity. Warm = neutral/default. Status colours are never used for identity, and every status also has an icon, glyph or word.
3. **Stone frame, quiet chrome.** In light mode the rail and tab strip are darker than a near-white canvas, and the active tab *is* the canvas colour. Dark mode lifts each level lighter and drops card shadows. Hairline borders, almost no shadows, no gradients in app chrome. IDs, timestamps and metadata are small, mono and muted. User content is the darkest text.
4. **Name sizes by role.** Use the `kt-fs-*` tiers (micro…h1) for chrome, with an app preset (body 14px) and a reading preset (body 16px, 78ch). Inter for UI, JetBrains Mono for every number, id and path in text, tiles and tables, and numbers are always tabular (chart axes stay Inter with `tabular-nums`). Muted text for metadata; faint text only for placeholders and disabled items.
5. **Motion means "working".** Use 150–200ms colour/opacity transitions. At most one pulse per concern: the focused item's "working now" line (never one per running row), plus the reconnect banner while it shows. Spinners only on in-flight commands. Status dots never animate. Honour reduced motion.
6. **Four states, fixed order.** Error → loading → empty → content, and the container keeps its shape. Refresh never blanks data. Empty states name the subject and scope and offer the next step. Errors sit inline next to the failure and show the real message.
7. **Phone is its own design.** One density signal (`<768 compact`, `<1280 regular`). On phones: rail → drawer, tables → tap rows → sheets, settings → list → page, dialogs fullscreen. Use `pointer: coarse` for touch: inputs ≥16px, targets ≥40px, and hover-only actions always visible.
8. **Keyboard and focus.** Ctrl/⌘+K palette; global shortcuts ignore text fields; Esc exits the innermost layer; visible iolite `:focus-visible` everywhere; IME-safe Enter.
9. **Plain, specific copy.** Sentence case, verbs on buttons, `…` while in progress, `—` for missing values, `·` to join facts, tooltips as full sentences. Confirms state the consequence and are labelled with the verb. zh-TW and zh-CN are localised properly, not converted.
10. **Performance is UX.** Pause polls when the page is hidden and never let them overlap. Window long lists, key streamed rows by stable id, throttle expensive renders, and never send one network write per keystroke.
11. **Tokens, not literals.** Emit colours as CSS vars (`--kt-color-*`), use `color-mix` tints in hand CSS, keep embeddable components on scoped vars with fallbacks, and remap any component library's variables once, globally.
12. **Verify by looking.** Screenshot light and dark at desktop and phone width before claiming done.

## Workflow

1. **Classify the surface**, then open only the matching reference:

   | building… | read |
   |---|---|
   | any UI (always) | `references/tokens-and-theme.md`, `references/components.md` |
   | app shell, panes, mobile, shortcuts, prefs | `references/layout-density-touch.md` |
   | anything async: loading/empty/error, toasts, confirms, copy, i18n | `references/states-and-copy.md` |
   | chat, agent console, log tail, streaming markdown | `references/streaming-and-chat.md` |
   | charts, dashboards, tables of metrics, node/graph editors, docs figures | `references/dataviz-and-canvas.md` |
   | docs site, landing page, README hero, marketplace/catalog | `references/docs-and-sites.md` |
   | CLI output, TUI, terminal dashboards | `references/terminal-ui.md` |
   | review / before shipping | `references/review-checklist.md` |

2. **Install the tokens** for the project's stack (copy from `assets/`, don't retype):
   - Vue + UnoCSS (the author's stack): `assets/uno.config.js` + `assets/tokens.css` + `assets/base.css`. Use Carbon icons (`@iconify-json/carbon`).
   - Tailwind: `assets/tailwind.preset.js` (it replaces the default palette) + `tokens.css` + `base.css`.
   - Plain CSS / other frameworks: `tokens.css` + `base.css`, then use the `.kt-btn--*`, `.kt-chip--*`, `.kt-dot--*`, `.kt-seg`, `.kt-input`, `.kt-banner`, `.kt-v2-*` classes.
   - Load Inter and JetBrains Mono. Add an inline `<head>` script that applies `html.dark` from the stored preference or the system setting before first paint.
   - Existing project with its own brand: keep its hues, but map them onto the roles in `tokens.css` and adopt everything else.

3. **Build with the recipes.** Pick the shell archetype, use SectionCard/StatTile/StatusDot/chip/segmented/settings-row recipes, and write the four states for every async region.

4. **Verify** (required):
   ```bash
   node <skill-dir>/scripts/check-palette.mjs <project-src>   # must report 0 errors
   ```
   Then screenshot each touched view in light and dark at about 1440px and about 390px wide, with touch emulated on the phone run:
   ```bash
   npx -y -p playwright node <skill-dir>/scripts/shots.mjs http://localhost:5173/ shots/
   ```
   The script also flags infinite animations on an idle page, sideways scrolling and console errors. Open the PNGs and look at them, tab through the page with the keyboard, then walk `references/review-checklist.md`.

## Quick reference

| thing | value |
|---|---|
| accent | iolite `#5A4FCF` (hover `#312A7A`; dark text `#DDD0F0`) |
| light page / card / border / text | `#f2eee8` / `#ffffff` / `#e5dfd7` / `#2e2a26`; canvas `#fbfaf8` |
| dark page / card / border / text | `#1a1816` / `#252220` (v2 card `#2a2724`) / `#3d3835` / `#e8e0d8` |
| status | live aquamarine `#4C9989` · ok sage `#5A9E6F` · attention amber `#D4920A` · danger coral `#D46B6B` · neutral warm-400 `#A09A92` |
| chip | gem 10% fill, 40% border, `-shadow` text (light) / `-light` text (dark), `text-[11px] rounded-full` |
| selected row | `bg-iolite/10` |
| radii | control 8px · card 12px · chip full |
| controls | buttons `h-8` (dense `h-7`), icon buttons 28px (40px on touch) |
| section label | `text-[10px] uppercase tracking-wider font-medium text-warm-500` |
| bars | tab strip `h-8`, app header `h-11`, phone header `h-12`, status bar `h-6 text-[10px] font-mono` |
| rail | 240px (180–480), collapses to a 48px icon strip; drawer `w-72 max-w-[85vw]` on phones |
| breakpoints | compact <768 · regular <1280 · expansive |
| thresholds | fill/context calm <60%, amber 60–80%, coral >80% |
| streaming | markdown throttle 80ms · follow tail within 80px · batch ≥3 tool calls · preview 240 chars |
| motion | 150ms colour, 200ms fade/slide, pulse 1.5s opacity .4↔1 only for "working" |

## Common mistakes

These came from a no-skill baseline that built a "polished" dashboard:
- Cool slate greys and Tailwind blue/red/green/amber status hues. Use warm stone and the gem roles instead.
- A pulsing "running" dot, a blinking "Live" label and flashing new log lines. Remove all of them; keep colour plus label, and at most one pulse on the single "working now" line.
- A separate hand-picked hex for every status in every mode. Use the triad tokens and the tint recipes.
- Hard-coded px font sizes everywhere. Use tiers for chrome.
- A pinned always-dark log panel with its own palette. Use theme tokens; only code blocks may stay dark.

Others seen in the author's own history:
- Theming a component library one component at a time.
- Dialogs that overflow on phones.
- `user-scalable=no`.
- Emoji used as icons.
- Duplicate CTAs for the same destination.
- One key bound to two actions.
- Positional keys on streamed rows.
- Hand-maintained nav lists.

See the rationalization table in `references/review-checklist.md`.
