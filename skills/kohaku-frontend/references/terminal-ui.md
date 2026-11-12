# Terminal / CLI / TUI surfaces

The terminal uses the same design language through semantic roles. Components ask for roles, not raw colours.

## Roles and palette

| role | gem | dark-scheme hex (lifted for contrast) |
|---|---|---|
| accent, user, focus, prompt, selection, progress fill | iolite | `#9D94F0` |
| running, assistant, live | aquamarine | `#73C2B1` |
| tool | sapphire | lifted sapphire |
| agent / sub-agent | taaffeite | lifted taaffeite |
| attention, waiting on you, code | amber | lifted amber |
| danger, error | coral | lifted coral |
| ok, done | sage | lifted sage |
| text / muted / faint / border | warm stone | `#E8E0D8` / `#8A8078` / `#5A5550` / `#3D3835` |

- Pre-blend washes instead of alpha: `user_bg #2A2640`, `focus_bg #1E1A2E`, `selection_bg #312A7A`.
- Light scheme uses the web DEFAULT gems. Ship a `terminal` scheme (ANSI 16 only, no background bands) and colour-blind schemes (Okabe–Ito: success blue, error orange).
- Detect truecolor; fall back to the nearest xterm-256 colour; honour `NO_COLOR` (plain output) and non-TTY (no colour, links as `text (url)`, no prompts — fail closed).
- Logs: ERROR coral, WARN amber, INFO normal text (or sage), DEBUG faint. Avoid raw ANSI yellow/green/red when the gem roles are available.

## Glyphs

- Status = glyph + colour, and the glyph replaces the word: braille spinner (aquamarine, 80ms/frame) running · `✓` sage ok · `✗` coral error · `○` amber interrupted · `⚙` amber busy/waiting · `!` amber needs you · `◆` taaffeite sub-agent · `●` / `○` live/idle dots.
- No emoji in status output.
- Frames: thin rounded `╭─╮ │ ╰─╯`, muted at rest, accent when focused. Rules `── label ───`. Tables with ` │ ` and `─┼─`, no outer box. Never heavy box drawing except `━` for the filled part of a bar.
- Bars: `━` accent fill on a `─` muted track, eighth blocks for precision, capped at ~48 cells ("bars past ~48 cells read worse"); fixed-width percentage.

## Layout

- **Inline-first**: finished output is sealed into the terminal's real scrollback; only the live region (what is happening now) and the input redraw. Full screen is an opt-in toggle (`ctrl+t`) built from the same components.
- Five regions: transcript (sealed), live, bottom (input/footer), panels, head (tabs).
- Footer: muted, left = identity, right = metrics joined with ` · `, empty parts omitted.
- Reserve rows for transient status so content never jumps; tabs keep a stable width.
- Narrow terminals: collapse side panes below a 30-column main area; stack columns below 16; truncate with `…`.

## Density and streaming

- One line per item; `·` between facts; compact numbers (`1.2k`, `3.4M`, `m:ss`); elapsed only after 1s.
- Fold runs of ≥3 similar items into one summary line: `✓ 5 tool calls  read ×2, grep, bash ×2  ▸`.
- Show the last ~12 lines of a running command's output; full output on expand.
- Animate only while something is running; when idle the screen is static and the render loop sleeps.

## Keys and dialogs

- Hints: muted, `key verb · key verb` (`↑↓ move · enter select · esc cancel`), lowercase, only the focused area's keys, placed next to what they act on. Full key help on `?`/F1.
- **Dialogs never trap**: they dock where the input is, typing keeps working, esc always exits, a click elsewhere is never swallowed.
- Drive the UI by semantic events (`submit`, `select`, `close`, `action`, `change`), not raw keycodes.
- Verify UI claims on an emulated terminal and generate README screenshots from real headless runs.
