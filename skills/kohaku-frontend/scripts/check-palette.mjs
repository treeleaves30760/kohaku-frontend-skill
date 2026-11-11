#!/usr/bin/env node
// Kohaku palette guard — a portable version of KohakuTerrarium's
// style.palette-guard.test.js. Scans a source tree and fails on colours
// outside the gem + warm system.
//
//   node check-palette.mjs <src-dir> [--allow file1,file2] [--strict] [--json]
//
// Errors (exit 1):
//   - stock Tailwind palette scales (text-red-500, bg-gray-100, slate-*, ...)
//   - invented gem shades (iolite-dark, coral-500, amber-deep, ...)
//   - hex colours that are not in the palette (outside an allowlisted token file)
//   - continuously animated status indicators (animate-ping, animate-pulse on dots)
// Warnings (exit 0 unless --strict):
//   - text-[Npx] literals (chrome should use the kt-text-* tiers)
//   - emoji used as status/icons

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, extname } from "node:path"

const args = process.argv.slice(2)
const root = args.find((a) => !a.startsWith("--")) || "src"
const strict = args.includes("--strict")
const asJson = args.includes("--json")
const allowIdx = args.indexOf("--allow")
const allow = new Set(allowIdx >= 0 ? args[allowIdx + 1].split(",") : [])

const EXT = new Set([".vue", ".js", ".jsx", ".ts", ".tsx", ".svelte", ".astro", ".css", ".scss", ".html"])
const SKIP_DIR = new Set(["node_modules", "dist", "build", ".git", ".nuxt", ".next", ".output", "coverage", "locales"])

const GEMS = ["sapphire", "aquamarine", "taaffeite", "iolite", "amber", "coral", "sage"]
const PALETTE_HEX = new Set(
  [
    "#D6E3F8", "#0F52BA", "#082567", "#D4EDE8", "#4C9989", "#1B6B5A", "#E8D5ED", "#A57EAE", "#6B4670",
    "#DDD0F0", "#5A4FCF", "#312A7A", "#F5E6C8", "#D4920A", "#8B5E00", "#F5D5D5", "#D46B6B", "#8B3A3A",
    "#D5E8DA", "#5A9E6F", "#3A6B48",
    "#F7F5F2", "#EFECE7", "#E0DBD4", "#C5BFB7", "#A09A92", "#8A8480", "#6A645F", "#4A4540", "#3A3632",
    "#2A2724", "#1A1816",
    // surfaces / ink (tokens.css)
    "#F2EEE8", "#FFFFFF", "#FFF", "#EFEBE5", "#E5DFD7", "#2E2A26", "#6C655D", "#8F8880", "#DCD5CB",
    "#E3DDD5", "#FBFAF8", "#CDC5BA", "#24211D", "#252220", "#1E1C1A", "#3D3835", "#E8E0D8", "#8A8078",
    "#5A5550", "#161412", "#221F1D", "#2E2B28", "#F3EFE9", "#A39A91", "#6F6760", "#77706A", "#655E57",
    "#000", "#000000",
    // chart hues (tuned per mode)
    "#1F9A80", "#8076E6", "#25A88E", "#3A8A55", "#B87A00", "#C24A4A", "#6DB585", "#D9A23A", "#E07A7A",
    // Element Plus primary ramp derived from iolite
    "#8B83DB", "#6F9BE0", "#ADA8E7", "#CEC9F0", "#EEEDFA", "#4840A6",
  ].map((h) => h.toUpperCase()),
)

const UTIL = "(?:text|bg|border|ring|from|to|via|fill|stroke|divide|outline|placeholder|accent|decoration|caret|shadow)"
const TW_HUES =
  "red|blue|green|yellow|orange|purple|pink|indigo|violet|gray|grey|slate|zinc|stone|neutral|cyan|sky|lime|rose|fuchsia|emerald|teal"
const RULES = [
  {
    level: "error",
    re: new RegExp(`\\b${UTIL}-(?:${TW_HUES}|amber)-\\d{2,3}\\b`, "g"),
    why: "stock Tailwind palette scale; use a gem (light/DEFAULT/shadow) or warm-50..950",
  },
  {
    level: "error",
    re: new RegExp(`\\b${UTIL}-(?:${GEMS.join("|")})-(?:dark|deep|darker|lighter|\\d{2,3})\\b`, "g"),
    why: "gems only have light / DEFAULT / shadow shades",
  },
  {
    level: "error",
    re: /\banimate-ping\b/g,
    why: "continuous halo animation; status is shown by colour + label, not motion",
  },
  {
    level: "error",
    re: /\b(?:rounded-full[^"'`]*animate-pulse|animate-pulse[^"'`]*rounded-full)\b/g,
    why: "pulsing status dot; dots never animate (use .kohaku-pulse only on a 'Processing…' line or reconnect banner)",
  },
  {
    level: "warn",
    re: /\btext-\[\d+(?:\.\d+)?px\]/g,
    why: "pixel font-size literal; chrome text should use a kt-text-* tier",
  },
  {
    level: "warn",
    re: /[\u{1F300}-\u{1FAFF}\u{2705}\u{274C}\u{26A0}]/gu,
    why: "emoji as status/icon; use Carbon icons or the glyph set ✓ ✗ ○ ⚙ !",
  },
]
const HEX_RE = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) yield* walk(p)
    else if (EXT.has(extname(name)) && !/\.(test|spec)\.[jt]sx?$/.test(name)) yield p
  }
}

const findings = []
for (const file of walk(root)) {
  const rel = relative(root, file).replaceAll("\\", "/")
  if (allow.has(rel)) continue
  const lines = readFileSync(file, "utf8").split(/\r?\n/)
  lines.forEach((line, i) => {
    for (const r of RULES) {
      for (const m of line.matchAll(r.re)) findings.push({ level: r.level, file: rel, line: i + 1, match: m[0], why: r.why })
    }
    if (/^\s*(\/\/|\*|<!--)/.test(line)) return // comments may cite hexes
    for (const m of line.matchAll(HEX_RE)) {
      if (!PALETTE_HEX.has(m[0].toUpperCase())) {
        findings.push({ level: "error", file: rel, line: i + 1, match: m[0], why: "hex not in the gem/warm palette; use a token or var(--kt-color-*)" })
      }
    }
  })
}

const errors = findings.filter((f) => f.level === "error")
const warns = findings.filter((f) => f.level === "warn")
if (asJson) {
  console.log(JSON.stringify({ errors, warnings: warns }, null, 2))
} else {
  for (const f of findings) console.log(`${f.level === "error" ? "✗" : "!"} ${f.file}:${f.line}  ${f.match}  — ${f.why}`)
  console.log(`\n${errors.length} error(s) · ${warns.length} warning(s)`)
}
process.exit(errors.length || (strict && warns.length) ? 1 : 0)
