# Review checklist and anti-patterns

Run before calling a UI done. Each line is a defect the author shipped, found, and wrote a rule (or test) against.

## Automated

- [ ] `node <skill>/scripts/check-palette.mjs <src>` → 0 errors (allowlist only files that cannot use tokens, e.g. favicon SVG data URLs, terminal emulator themes, each with a reason).
- [ ] Lint/format clean; no framework warnings in the console (Vue warnings, unmatched-utility warnings).
- [ ] Screenshots in **light and dark**, at desktop (~1440) and phone (~390) width, of every view touched: `npx -y -p playwright node <skill>/scripts/shots.mjs <url> shots/` (the phone run emulates touch, so `pointer: coarse` rules apply; it also flags infinite animations, sideways scroll and console errors). Without Playwright: browser DevTools device mode with touch emulation; an iframe only checks width, not touch. Open every PNG and look.

## Colour and theme

- [ ] Only gem (light/DEFAULT/shadow) and warm colours; no stock Tailwind hues, cool greys, invented shades, or loose hexes.
- [ ] Iolite is the only accent; status colours (sage/amber/coral, aquamarine for live) are used only for status and always with an icon/glyph/text.
- [ ] Every surface/text/border has its dark twin; dark mode looked at, not assumed. Accents switch to `-light` in dark.
- [ ] Muted text in light mode is warm-600 (or patched warm-400/500), not pale warm-400 on stone.
- [ ] Theme applied before first paint; system default; persisted with try/catch.
- [ ] Third-party widgets (charts, editor, terminal, Mermaid) re-theme on toggle.
- [ ] No gradients in app chrome; no glow blobs; shadows only on floats (and a hairline on light cards).

## Typography and density

- [ ] Inter + JetBrains Mono actually loaded (with CJK fallbacks if needed).
- [ ] Chrome text uses the semantic tiers; nothing below 10px.
- [ ] Every number that changes or is compared is `font-mono tabular-nums`; ids/paths/models mono.
- [ ] One density per view (app chrome vs reading).

## Motion

- [ ] No continuous animation on repeated elements (status dots, list rows, badges). No `animate-ping`. Pulse only on the one "working now" indicator.
- [ ] Spinners only on in-flight commands.
- [ ] Transitions ≤ 200ms, colour/opacity/transform only; `prefers-reduced-motion` honoured.
- [ ] No animation runs on an idle page (check DevTools performance for an idle second).

## States and copy

- [ ] Each async region: error → loading → empty → content, and the container keeps its shape.
- [ ] Refresh never blanks existing data; partial data streams in.
- [ ] Empty states name subject + scope and offer the next action.
- [ ] Errors inline near the failure, with the real message and a Retry; toasts only for action results.
- [ ] Destructive confirms: question + consequence, verb button in coral; reversible actions don't confirm.
- [ ] Sentence case, `…` for in-progress, `—` for missing, `·` separators, no exclamation marks, no "Something went wrong".
- [ ] Truncated strings have `title`; long unbroken strings, wide tables and images cannot push the layout sideways.
- [ ] Check with every side pane and drawer **open** at desktop width. Primary names stay readable, and low-priority columns drop first (container queries).

## Touch, phone, keyboard, a11y

- [ ] Phone layout is a different design (drawer, tap rows, sheets, list → page), not a shrunk desktop; no horizontal page scroll at 390px.
- [ ] Inputs ≥ 16px on touch; tap targets ≥ 40px; no `user-scalable=no`.
- [ ] Hover-only actions are visible on touch and reachable by keyboard (focus-within), and don't overlap neighbours.
- [ ] Dialogs fullscreen on phones; bottom bars respect safe-area insets.
- [ ] Visible `:focus-visible` ring (iolite) on every interactive element, including custom buttons and `role="button"` divs.
- [ ] Icon buttons have `title` + `aria-label`; status dots have a label; live regions use `role="status"`/`aria-live="polite"`; alerts `role="alert"`.
- [ ] Global shortcuts ignore text fields (except Ctrl/⌘+K); one key does one thing; Esc exits the innermost layer.
- [ ] IME-safe Enter on every submit-on-Enter input.

## Performance-as-UX

- [ ] Polling pauses while hidden and never overlaps; superseded loads are aborted.
- [ ] Long lists are windowed; streamed rows keyed by stable ids; large sample arrays not deeply reactive.
- [ ] Expensive renders (markdown, charts) throttled/incremental; work deferred for off-screen content.
- [ ] Preferences never write to the network per keystroke.

## Rationalizations to reject

| Thought | Reality in this design language |
|---|---|
| "A pulsing dot makes 'running' feel alive" | Removed on purpose: 10–30 animated dots kept the GPU busy and added no information. Colour + label say running. |
| "Tailwind blue / slate is a safe professional default" | It is exactly what the author migrated *away* from in 2026. Use iolite on warm stone. |
| "Each status gets its own nice colour" | Status hues are a reserved vocabulary (sage/aquamarine/amber/coral); identity uses iolite/aquamarine, then small multiples. |
| "Skeletons everywhere look modern" | Text "Loading…" by default; keep the previous data on refresh; skeletons only for a truly empty first load. |
| "Hover to reveal actions keeps it clean" | Only with `hover-only-action`: always visible on touch, reachable by focus. |
| "Shrink the desktop layout for mobile" | Phones get their own interaction model. |
| "A toast is enough for errors" | Errors that need action live next to the failure. Toasts are for results. |
| "I'll add dark mode later" | Light and dark are designed and screenshotted together, always. |
| "Emoji are friendlier icons" | Carbon icons and the glyph set ✓ ✗ ○ ⚙ !; one personality token per product, max. |
| "Confirm everything to be safe" | Confirm only destructive/irreversible actions; label the button with the verb. |
| "Theme the component library per component" | Remap its CSS variables once, globally, both modes. |
| "text-[13px] just this once" | Chrome uses tiers so zoom, reading size and touch retunes reach everything. |
