# Examples

Pages an agent built while following this skill during the GREEN test, then checked with `scripts/check-palette.mjs` and `scripts/shots.mjs`. The first two are self-contained files, so you can open them directly or serve the folder.

| example | stack | shows |
|---|---|---|
| [`job-runner/`](job-runner/index.html) | Vue 3 (CDN), plain CSS from `assets/` | workspace shell (rail with stone frame, header, status bar), KPI tiles, a job table with container-query columns, a detail pane with a loss chart and log tail, the new-job dialog, empty/error/reconnecting states, and a phone layout with tap rows → detail page. Light, dark and system themes |
| [`local-chat/`](local-chat/index.html) | React 18 + Tailwind Play CDN + the preset | chat app: conversation rail, streaming markdown reply (code, table), tool calls (one ✓ and one ✗), composer with Send→Stop and context ring, empty-state hero, settings in Group > Card > Row layout (list → page on phones), en/zh-TW. URL hooks: `?view=settings\|new`, `?demo=stream`, `?drawer=1`, `?lang=zh-TW` |
| [`leafpack-opus/`](leafpack-opus/) | Vite + Vue 3 + UnoCSS, built by Opus 5.5 | plugin marketplace: home, browse (search, category and tag filters, sort, all four states), plugin detail (install command, Readme / Versions / Permissions tabs, verified and deprecated states), and a docs page with sidebar and table of contents. `npm install && npm run dev`, then `http://localhost:5181/`. URL hooks: `#/browse?fail=1`, `#/browse?delay=60000`, `#/plugin/<id>?tab=versions`, `?drawer=1` |
| [`leafpack-sonnet/`](leafpack-sonnet/) | Vite + Vue 3 + UnoCSS, built by Sonnet 5.5 | the same brief built independently. `npm install && npm run dev`, then `http://localhost:5182/`. URL hooks: `#/browse?fail=1`, `#/plugin/<id>?tab=permissions`, `#/docs/publishing?drawer=1` |

Under "Demo controls" in the job-runner rail you can trigger a dropped connection or clear all jobs to see the empty and error states.

The `tokens.css` and `base.css` in each example are snapshots from when it was generated. `leafpack-opus` has the current assets; `leafpack-sonnet` keeps the older ones plus its own workarounds in `src/styles/app.css`. For new work, copy from `skills/kohaku-frontend/assets/`.
