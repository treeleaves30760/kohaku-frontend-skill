# kohaku-frontend-skill

把 [KohakuBlueleaf](https://github.com/KohakuBlueleaf) / [Kohaku-Lab](https://github.com/Kohaku-Lab) 各專案的前端設計邏輯整理成一個 Agent Skill，讓之後的專案（不論是不是 Kohaku 系列）都能直接套用同一套 UI/UX 水準。內容經作者本人同意整理。

*English: an Agent Skill that packages the frontend design language of KohakuBlueleaf's projects (KohakuTerrarium, Togeari, KohakuNodeIR, TerrariumMarket, Kohaku-Docs, KohakuTUI, …) — gemstone accents on warm stone, role-based colour, quiet chrome, no idle motion, designed phone layouts, plain copy — distilled from source, tests and commit history with the author's consent.*

## 內容

```
.claude-plugin/              Claude Code plugin + marketplace manifest
skills/kohaku-frontend/
  SKILL.md                   核心原則、工作流程、速查表（agent 的入口）
  references/
    tokens-and-theme.md      色票文法、角色對應、stone/v2 五層 surface、dark mode、字級 tier
    components.md            按鈕、chip、狀態點、卡片、rail、tab、status bar、設定頁、對話框、表格…
    layout-density-touch.md  殼層類型、density 訊號、手機/觸控規則、overflow、快捷鍵、偏好儲存
    states-and-copy.md       錯誤→載入→空→內容、空狀態、錯誤、連線、文案規則、i18n
    streaming-and-chat.md    聊天/agent 介面、串流 markdown、工具呼叫、捲動、composer
    dataviz-and-canvas.md    圖表配色紀律、儀表板、節點編輯器、文件圖
    docs-and-sites.md        文件站 IA、landing、市集
    terminal-ui.md           CLI / TUI 的同一套語言
    review-checklist.md      交付前檢查表 + 常見藉口對照
  assets/
    tokens.css               與框架無關的 CSS 變數（唯一真實來源）
    base.css                 reset、觸控規則、v2 surface、純 CSS 元件 class
    uno.config.js            UnoCSS 設定（作者自己的技術棧）
    tailwind.preset.js       Tailwind preset（取代預設色票）
  scripts/check-palette.mjs  色票守門員：掃出 Tailwind 預設色、非法 gem shade、散落的 hex、會一直動的狀態點
research/                    六份原始研究筆記（每條規則的出處：檔案:行號、commit）
```

## 安裝

**Claude Code（plugin）**

```
/plugin marketplace add treeleaves30760/kohaku-frontend-skill
/plugin install kohaku-frontend@kohaku-frontend-skill
```

**直接複製（任何支援 Agent Skills 的工具）**

```bash
git clone https://github.com/treeleaves30760/kohaku-frontend-skill
# 個人層級
cp -r kohaku-frontend-skill/skills/kohaku-frontend ~/.claude/skills/
# 或專案層級
cp -r kohaku-frontend-skill/skills/kohaku-frontend <your-project>/.claude/skills/
# Codex / 其他 runtime 也可以放在 ~/.agents/skills/
```

安裝後，只要請 agent 做 UI（「幫這個專案做一個 dashboard」、「照 Kohaku 風格重做設定頁」、「review 這個前端」），skill 會自動被觸發。

## 單獨使用 assets

```bash
# 檢查任何專案的色票是否合規
node skills/kohaku-frontend/scripts/check-palette.mjs path/to/src
node skills/kohaku-frontend/scripts/check-palette.mjs path/to/src --allow src/favicon.js --strict
```

- Vue + UnoCSS：複製 `uno.config.js`，並引入 `tokens.css` + `base.css`
- Tailwind：`presets: [require("./tailwind.preset.js")]`，並引入 `tokens.css` + `base.css`
- 其他：`tokens.css` + `base.css`，使用 `.kt-btn--primary`、`.kt-chip--sage`、`.kt-dot--live`、`.kt-v2-card`…

## 一眼看懂

| | |
|---|---|
| 主色 | iolite `#5A4FCF`：唯一的 accent（主要按鈕、焦點、選取、連結） |
| 狀態 | live aquamarine · ok sage · 需要你 amber · 錯誤 coral · 中性 warm，永遠搭配圖示或文字 |
| 表面 | light：stone 外框 `#f2eee8` 包住近白 canvas；dark：`#1a1816` 起逐層變亮、卡片無陰影 |
| 字 | Inter + JetBrains Mono；數字一律 mono tabular；字級依「用途」命名 |
| 動畫 | 只有「正在工作」才會動；狀態點永遠不動 |
| 手機 | 另一套設計（drawer、tap row、sheet、list→page），不是縮小版桌面 |
| 文案 | 句首大寫、動詞按鈕、`…` 進行中、`—` 缺值、`·` 分隔、確認框寫出後果 |

## 來源

| 專案 | 用途 |
|---|---|
| [KohakuTerrarium](https://github.com/Kohaku-Lab/KohakuTerrarium) frontend | 主要來源：token、殼層、聊天/串流、設定頁、色票測試、2700+ commits 的設計理由 |
| Togeari dashboard、KohakuNodeIR kir-editor | 最新方向：v2 surface、圖表配色紀律、節點編輯器互動 |
| KohakuSSHManager、KohakuTPU docs-web | 管理後台模式、閱讀型字級 tier、AGENTS.md 設計契約 |
| TerrariumMarket、Kohaku-Docs、kohaku-lab-home | 市集、文件站、landing 與品牌 |
| KohakuHub、KohakuBoard、KohakuRiver、KohakuPaper | 演化脈絡、資料視覺化（Board） |
| KohakuTUI、KT cli/tui | 終端機語言 |

各規則的檔案:行號與 commit 出處都在 `research/`。

## 驗證方式與前後對照

這個 skill 是用 writing-skills 的 RED → GREEN → REFACTOR 流程做出來的。同一個題目（一個「GPU job runner」dashboard，要有導覽、job 列表、詳細面板、log、表單 dialog、空狀態、斷線狀態、深淺色、手機版）分別交給兩個 agent：

| | 沒有 skill（baseline） | 有 skill（GREEN） |
|---|---|---|
| `check-palette.mjs` | **51 個錯誤**（Tailwind 藍/紅/綠、冷色 slate） | **0 個錯誤、0 個警告** |
| `shots.mjs` 閒置頁面的無限動畫 | **5 個**（會脈動的狀態點、閃爍的 "Live"） | 0 |
| 表面 | 冷灰、全頁同一層 | stone 外框 + 近白 canvas + 卡片，dark mode 逐層變亮 |
| 手機 | 縮小版表格 | tap rows → 詳細頁、全螢幕 dialog、觸控尺寸 |

**有 skill：**

![job runner, light](docs/images/job-runner-desktop-light.png)
![job runner, dark](docs/images/job-runner-desktop-dark.png)

<p>
<img src="docs/images/job-runner-phone-light.png" width="260" alt="phone, light">
<img src="docs/images/job-runner-phone-dark.png" width="260" alt="phone, dark">
</p>

**沒有 skill（baseline）：**

![baseline, light](docs/images/baseline-desktop-light.png)

REFACTOR 階段根據測試 agent 回報的模糊之處修補了 skill，包括：

- 脈動動畫的預算
- muted 和 faint 文字的分工
- chip 文字色的例外
- 圖表座標軸的字體
- 重複 CTA 的界線
- 計時器與佇列的呈現
- 純 CSS 的 dialog 與小按鈕
- 觸控模擬截圖工具
- 以容器寬度決定表格欄位，而不是用 viewport

最後一項來自截圖：側邊面板打開時，job 名稱被擠成 "e5-e…"。

範例原始碼在 [`examples/`](examples/)。

## 授權與致謝

設計語言屬於 KohakuBlueleaf / Kohaku-Lab，經作者同意整理。本 repo 收錄整理後的規則、token 與工具。`assets/` 裡的 token 值和 shortcut 改寫自 KohakuTerrarium、Togeari 的 `uno.config.js` / `style.css`，其餘專案原始碼沒有收錄。
