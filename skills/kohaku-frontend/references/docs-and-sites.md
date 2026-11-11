# Docs sites, landing pages, marketplaces

Same tokens, reading-density tiers (`.kt-reading`: 16px body, 78ch measure). Avoid the author's 2025 look (dark-only slate, sky→pink gradient text, glow blobs, blue-600 buttons) — it was abandoned; port anything like it to warm + gem.

## Brand mark and wordmark

- Kohaku-Lab products: the round mascot mark (bubble-tea Kohaku art over an `amber → iolite-light → iolite` gradient fallback) + a **two-tone wordmark**: `<b class="font-bold text-amber">Kohaku</b><span class="font-light text-iolite">Name</span>` (Togeari does the same split: `Toge` amber bold / `ari` iolite light), optional muted lowercase descriptor ("dashboard").
- Other projects: the project's own mascot/character if it has one; otherwise a round 28px iolite mark with a white Carbon icon for the domain + the name in `text-sm font-semibold`. Split a compound name into two tones only if it reads naturally. No gradient-div logos, no cube icons, no emoji.

## Landing / project home

- Compact header (`h-11` app-like, or ~4.25rem for docs): same background as the page, a bottom hairline, no elevation. Mascot mark (round or rounded-lg, 28px; the bubble-tea Kohaku art for Kohaku-Lab products, the project's own mascot otherwise) + name `text-sm font-semibold` (hidden on xs) + nav pills (`px-2.5 py-1 rounded text-[12px] font-medium`, active `bg-iolite/10 text-iolite`) + spacer + theme icon button + one action. Never two CTAs that go to the same page.
- Hero = **one bordered panel**, not a full-bleed splash: kicker (uppercase, `.16em` tracking, .8rem/600, accent) → H1 (700, `-0.02em`, `text-wrap: balance`, `clamp(1.9rem, 3vw, 2.9rem)`) → 1–2 sentence lead (`text-base sm:text-lg leading-7`, `max-w-[60ch]`) → one primary + 1–2 secondary actions.
- For a tool, **the tool is the hero** (the marketplace's home is the browse view with a one-line tagline).
- Then a card grid of entry points (`md:grid-cols-2 xl:grid-cols-3 gap-4`): title + one muted sentence; hover = border mixes 45% accent + soft accent glow + 1px lift, 160ms.
- Above the fold of a README/landing: banner, one bold value line, language switcher (`English · 繁體中文 · 简体中文`, current bold), docs link, then "See it run (60 seconds)" with 3–4 commented shell commands.
- Imagery is the mascot/character art and real screenshots — not abstract gradients, blobs or stock illustration. Category tiles may use a two-gem gradient (`from-taaffeite to-iolite`, `aquamarine→sapphire`) behind a white Carbon icon.
- Footer: quiet `border-t border-warm-200/60 bg-warm-50/50`, mascot icon + name + 12px tagline, text links hovering to iolite.
- Motion: 160ms colour/border transitions and the 1px card lift. No parallax, scroll-triggered animation, or animated backgrounds.

## Docs information architecture

- **Diátaxis**: Tutorials (guided) · Guides (task) · Concepts (mental models) · Reference (lookup) · Development. The docs home has a "Pick a path" table: *You are… → Start here* (Evaluating / Operating / Building / Embedding / Contributing → 2–3 links each).
- Every page has frontmatter `title`, `summary`, `tags`; the summary renders as the lead under the H1. Strip a duplicate leading `# Title` that matches the frontmatter.
- Page header order: breadcrumbs → kicker (section) → H1 → summary → tag chips → meta bar ("Updated {date} · Edit this page", xs muted). Bottom: Prev/Next tiles (uppercase xs label + title; Next right-aligned).
- Tutorial template: **Problem:** / **End state:** / **Prerequisites:** block, then `## Step N: <verb phrase>`, each opening with "Goal: …" and ending with a "Verify:" block.
- Reference/hardware pages follow a fixed order so readers learn where things are (what it owns → what it costs → protocol → layout → tables → proofs → deployment → "what this does not own").
- Content rules worth stealing: "Prose is the caption to the picture" (delete a paragraph that restates the diagram); a trap gets its own callout **titled with the claim**, plus what the symptom looks like; every number carries its origin; projections are labelled `PROJECTED`; the quality bar is "could someone build the thing after reading it".
- Derive the nav from the file routes / one shared ordered list; hand-maintained nav lists point at pages that don't exist and render a blank pane.

## Docs layout

- Desktop: three columns — sidebar 260px (280 ≥1440), article, TOC 220px (240 ≥1440) — max width 1600px; each column scrolls independently (`html, body, #app { height: 100%; overflow: hidden }` at ≥1024px).
- Below 1024px the **document scrolls naturally** so mobile browser chrome, momentum scroll and pull-to-refresh keep working. The sidebar becomes a left drawer (88% width) behind a "Browse docs" button; the TOC drops down inline ("On this page", 45dvh scroll).
- Sidebar: collapsible groups (chevron rotates 90°, open state persisted), children on a left border rail, active link iolite text on iolite 14% wash. The group containing the current page opens itself so a deep link shows its neighbours. Sticky search at the top ("Search pages…"), flat results with section labels, "No pages match "q"."
- TOC: 1px left rail, 2px left border turns accent on the active heading, 0.88rem muted text, scroll-spy in rAF (heading counts as passed within 48px of the pane top), click smooth-scrolls and `replaceState`s the hash.
- Prose: `max-width: 72–78ch`, line-height 1.65–1.78; code blocks, tables, callouts and figures may break out to `min(100%, 1100px)`.
- Headings: anchor `#` **after** the heading at 0.6 opacity, 1 on hover; `scroll-margin-top` for the sticky header.
- Search: Ctrl+K hint on the input; on phones a circle button opens an overlay sheet (max 40rem, blurred 50% backdrop, results 60dvh), ↑/↓/Enter; results from a fallback locale tagged "(from English)".

## Docs components

- Code block: bordered 0.75rem box on the code background; `::before` header shows the language in 0.7rem uppercase `.08em` tracking; copy button top-right as a 1.7rem ghost square that turns sage; code 0.88rem / 1.6; horizontal scroll.
- Syntax colours from the gems (keyword taaffeite, string sage, function iolite, number coral, variable amber, comment muted italic; `-shadow` light / `-light` dark).
- Callouts: 1px border + **4px left bar** in the gem, 0.75rem radius, icon + label; note sapphire · tip/measured sage · rule/details iolite · warning/open amber · danger/trap coral. Fill `color-mix(gem-light 55%, surface)` light / `color-mix(gem-shadow 30%, surface)` dark.
- Inline code: tag-background chip, 0.375rem radius, `.15rem .4rem` padding. Links: accent, underline offset `.18em`, 1px.
- Tables: `display: block; overflow-x: auto`; header row on surface-hover, weight 600.
- Missing translation policy: fallback (warning callout "Translation not available — showing original content."), banner ("This page is still being translated."), or redirect home.

## Marketplace / catalog

- Browse: H1 + one-line tagline with an inline link ("share your own"). Filter bar card: search with a left icon and a live placeholder ("Search 7 packages…"), tag chips (`all` + tags; active takes its gem, inactive `chip-warm`), sort select, refresh icon. Sticky **only from md** (on phones a pinned stacked bar eats the viewport). Filters sync to the URL (`?q=&tag=&sort=`).
- States: error card (coral border, warning icon, "Could not load registry", message, Retry); loading = 6-card skeleton; empty = 40px search icon + "No matches" + a suggestion link + "Clear filters".
- Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`; footer line "Showing **N** of M packages · Index updated <time>" at 12px.
- Card: 40px category tile (gem gradient + white icon) · name 15px semibold · mono 11px version · `official` amber chip with check · 11px meta (author · license · date) · 13px description `line-clamp-2 min-h-[2.5rem]` (aligned heights) · clickable tag chips that filter (don't repeat a tag the badge already shows).
- Detail: "← Back to Browse" link; header card (64px tile, H1 2xl, version, chips, description, icon+text meta row); **install column** (`lg:w-72`, beside the header only from lg; `border-t` above it on smaller screens): "INSTALL" label, version select, mono command box with hover copy, full-width primary "Open in app" deep link + 10px footnote; then README, Versions (mono iolite tag, date, coral "yanked" chip, release-notes link), and ghost footer actions (Suggest edit, Discuss, Report issue).
- Runtime-computed class names (gradients, icons, chip variants) get purged by atomic CSS engines: safelist them or branch with `v-if` on literal classes.
