# Examples

Pages produced **by an agent following this skill** during its GREEN test, then reviewed with `scripts/check-palette.mjs` and `scripts/shots.mjs`. Every page is a self-contained file: open it directly or serve the folder.

| example | stack | shows |
|---|---|---|
| [`job-runner/`](job-runner/index.html) | Vue 3 (CDN), plain CSS from `assets/` | workspace shell (rail with stone frame, header, status bar), KPI tiles, a job table with container-query columns, a detail pane with a loss chart and log tail, the new-job dialog, empty/error/reconnecting states, and a phone layout with tap rows → detail page. Light, dark and system themes |

| [`local-chat/`](local-chat/index.html) | React 18 + Tailwind Play CDN + the preset | chat app: conversation rail, streaming markdown reply (code, table), tool calls (one ✓ and one ✗), composer with Send→Stop and context ring, empty-state hero, settings in Group > Card > Row layout (list → page on phones), en/zh-TW. URL hooks: `?view=settings\|new`, `?demo=stream`, `?drawer=1`, `?lang=zh-TW` |

Under "Demo controls" in the job-runner rail you can trigger a dropped connection or clear all jobs to see the empty and error states.

The `tokens.css` and `base.css` inlined in each example are snapshots from the day it was generated. For new work, always copy from `skills/kohaku-frontend/assets/`.
