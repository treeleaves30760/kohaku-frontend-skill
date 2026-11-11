# Layout, density, touch

## Contents
- Shell archetypes
- Density: one signal, different designs
- Touch and phone rules
- Overflow discipline
- Flex/split layout pitfalls
- Preferences and persistence
- Keyboard model
- Desktop-shell integration

## Shell archetypes

Pick by product type; all share the same tokens.

| archetype | structure | examples |
|---|---|---|
| **Workspace app** | resizable rail (240 ↔ 48px strip) · fused tab strip · canvas · optional side pane · `h-6` status bar | KohakuTerrarium, Togeari dashboard |
| **IDE / editor** | `h-11` header (logo · file actions · segmented view switch · spacer · undo/redo · primary Run · theme) · palette `w-56` · views with 1px dividers / bottom panel `h-52` · inspector `w-72` · `h-6` status bar | KIR editor |
| **Admin console** | labelled sidebar `w-56` (brand block, role-gated items, footer with theme + user + sign out) · page with title + subtitle + right actions · `container-page` | SSH manager, River manager |
| **Reading / docs** | `h-14` header (hamburger < md, wordmark, section pills, search, theme) · `w-64` sidebar tree · content pane that alone scrolls · optional `220px` TOC | Kohaku-Docs, TPU docs |
| **Public site / market** | compact `h-11` header (mascot mark + wordmark + nav + actions, same bg as page, bottom hairline) · hero panel · card grid · footer | TerrariumMarket, lab home |

Shell rules:
- One shell that adapts by density — no parallel `/mobile/*` routes (the author retired those).
- The frame (rail, strip, header, status bar) is visually quieter and darker (light mode) than the canvas.
- Only the content region scrolls; header/sidebar stay pinned. If the window never scrolls, restore scroll per route manually (router `scrollBehavior` cannot help).
- Global overlays (palette, toasts, modals, shortcut help) mount once at the root.
- A view that cannot work at the current density renders a placeholder ("Needs a larger screen" + one button to switch mode that can be undone from the same screen) instead of a broken layout.

## Density: one signal, different designs

- One reactive module-level signal: `compact < 768px ≤ regular < 1280px ≤ expansive`, plus a user override (`auto|compact|regular|expansive`) persisted and synced across tabs (`storage` event). Lazy-init so importing it has no side effects. A minimal version is `matchMedia("(max-width: 767px)")` as `useCompact()`.
- CSS-only rules use the same breakpoint: `@media (max-width: 767px)` / `max-md:`.
- Branch the **design**, not just the sizes: **phones get a different interaction model, not a squeezed desktop.**
  - rail → drawer; tab strip → icon tabs or bottom tab bar
  - tables → tap rows → detail sheet/page
  - settings two-pane → list → page
  - side panes → foldable sections under the content
  - popovers → sheets/drawers; dialogs → fullscreen
  - keyboard hints hidden; Enter inserts a newline
  - a wide schematic keeps its drawing and scrolls sideways (`min-w-[860px]`) rather than reflowing into nonsense
- Degrade **detail**, not text size: level-of-detail by zoom or by available space (full / brief / compact tiles; grouped previews when a box gets too small).
- Two density presets in one system: **app chrome** (dense: `h-7`/`h-8` controls, 11px chips, 10px section labels, body 0.875rem) and **reading surfaces** (body 16px, 78ch measure, larger headings). The retune is deliberate; don't mix them in one view.

## Touch and phone rules

- Detect touch with `@media (pointer: coarse)` (phones/tablets; touch laptops keep `fine`). Use `(hover: none)` only to remove tap highlights.
- Inputs ≥ 16px on touch (`font-size: max(16px, 1rem) !important`) or iOS zooms on focus.
- Tap targets: ≥ 40px tall buttons, 40×40 icon buttons (`w-10 h-10` hamburger), `min-h-14` list rows.
- `hover-only-action`: hover/focus-within reveals on desktop, always visible on touch, and the actions sit in normal flow (not absolutely positioned over a neighbour's tap area).
- Long-press (500ms, cancelled by > 8px movement, pointer events) replaces right-click.
- `html { touch-action: manipulation; -webkit-text-size-adjust: 100%; overflow-x: hidden }` — no double-tap zoom, no Android font boosting, no sideways page pan.
- Do **not** set `user-scalable=no` / `maximum-scale=1` — pinch-zoom must keep working.
- Safe areas: `padding-bottom: env(safe-area-inset-bottom)` on bottom bars and their popovers.
- Soft keyboard: size dialog bodies with `dvh` (`max-height: calc(100dvh - 120px)`); track `visualViewport` if a composer must stay above the keyboard.
- `:active` feedback on touch rows (`active:bg-warm-200/60`), since hover never fires.
- No one-way traps: any mode switch (e.g. "desktop mode") must be undoable from the same screen.

## Overflow discipline

Every element that can receive user data must survive long, unbroken, or wide content:
- `truncate` + `min-w-0` on flex children, `title` with the full value.
- Wide markdown tables / KaTeX / code: `display:block; overflow-x:auto; max-width:100%` on the element itself.
- Inline code and message text: `overflow-wrap: anywhere` (plus `word-break: break-word` for inline code).
- Images in content: clamp (`max-width: min(65%, 42vw); max-height: 35vh`, or container units `65cqw / 50cqh`).
- Centred rows that may overflow: `justify-content: safe center`.
- Scoped scrollers only; horizontal tab strips get `overflow-x:auto` + `scrollbar-none`.
- Figures wider than the reading column: break out with container-query units (`width: min(72rem, calc(100cqw - 4rem)); margin-left: 50%; transform: translateX(-50%)`) — `vw` ignores the sidebar.
- Use a container query (`@container (max-width: 280px)`) when a component lives in panes of unknown width (it may also live in a webview).

## Flex/split layout pitfalls (learned from bugs)

- Recursive split views: single root element per node (fragments break `h-full`/flex sizing — "the split has a hole"); no `min-h-0`/`min-w-0` on the %-sized split child; `flex flex-col` + `min-h-0` on the column that must let its child scroll.
- Hooks that read a reused component's props take a **getter**, not a captured value (Vue reuses instances when a leaf becomes a split).
- `content-visibility: auto` only on inner wrappers, never on roots that carry absolutely positioned children (paint containment clips them).
- Size the app with an `html/body/#app { height: 100% }` chain, not `100vh`, so CSS zoom doesn't overflow.

## Preferences and persistence

- localStorage is the primary store: synchronous reads, local-first writes, wrapped in try/catch ("a private window or blocked storage reads the fallback and keeps changes for the visit only"). Prefix keys per app (`kt.rail.width`, `togeari.dash.pane.<name>`).
- If preferences also sync to a backend: debounce/coalesce (flush after ~1.5s idle, max wait 10s, back off on failure). One keystroke must never become one request. Ephemeral state (drafts, scroll) stays local only.
- Persist user-tuned layout: rail width/collapsed, pane sizes, chart card sizes, sort orders, per-tab scroll positions, composer drafts.
- When redefining a preference scale, map legacy stored values so nobody's UI changes under them.
- URL query params may override saved prefs for one load (`?view=&theme=`) without persisting.
- Apply theme and zoom before mount so the first paint matches.

## Keyboard model

- `Ctrl/⌘+K` opens the palette and always wins, even inside inputs. Every other global shortcut is ignored in `input/textarea/select/[contenteditable]` (and in code editors like `.cm-editor`).
- One keypress does one thing: inner surfaces claim keys in the capture phase and `preventDefault`; the global handler skips `defaultPrevented` events.
- Advertise shortcuts in the UI: a `Ctrl+K` pill in the header, shortcut text in menu items, `title="Exit edit mode (Esc)"`, a `?`/F1 shortcut sheet with `<kbd>` keycaps, inline hints joined with ` · ` ("Enter to send · Shift+Enter for a new line · / for commands").
- Esc always exits the innermost thing (menu → dialog → mode). Delete/Backspace on canvases is ignored inside text fields. Undo `Ctrl+Z`, redo `Ctrl+Shift+Z`/`Ctrl+Y`.
- Every clickable non-button (`div` headers, cards) gets `role="button" tabindex="0"`, Enter/Space handlers, `aria-expanded`/`aria-pressed` as appropriate.

## Desktop-shell integration (Tauri/Electron/pywebview)

- Native context menus first, in-page fallback built from the same pure menu model.
- Colour the window caption from the page (sample the top-centre background; pick black/white caption text by contrast); repaint on theme toggle.
- Mica/acrylic: page behind the shell transparent, only the rail translucent; content stays opaque.
- External links open outside the app (a webview has no back button; same-window navigation is a dead end).
- Each top-level window (pop-outs) runs its own toast host and chrome sync.
- Print stylesheet drops the app chrome and lets scroll areas grow, so printing prints the content.
