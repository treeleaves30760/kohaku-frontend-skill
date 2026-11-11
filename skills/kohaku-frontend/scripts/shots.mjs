#!/usr/bin/env node
// Screenshot a page in light + dark at desktop and phone size, with real touch
// emulation on the phone run (so `pointer: coarse` rules apply), and report
// anything animating on an idle page.
//
//   npx -y -p playwright node shots.mjs <url> [outDir] [--wait 800]
//   (first run may need: npx playwright install chromium)
//
// Theme is forced by setting localStorage "theme" and the html.dark class
// before load, and by emulating prefers-color-scheme, so pages that follow the
// system or a stored preference both switch.

import { mkdirSync, existsSync } from "node:fs"
import { join, delimiter } from "node:path"
import { createRequire } from "node:module"

// ESM ignores NODE_PATH, so `npx -p playwright` alone does not make it
// importable from this file. Try: normal import, the cwd's node_modules, then
// any node_modules/.bin on PATH (that is where npx puts its temp install).
async function loadPlaywright() {
  try {
    return await import("playwright")
  } catch {}
  const bases = [process.cwd()]
  for (const p of (process.env.PATH || "").split(delimiter)) {
    if (/node_modules[\\/]\.bin[\\/]?$/.test(p)) bases.push(join(p, "..", ".."))
  }
  for (const base of bases) {
    try {
      const req = createRequire(join(base, "noop.js"))
      if (existsSync(join(base, "node_modules", "playwright")) || base === process.cwd()) return req("playwright")
    } catch {}
  }
  return null
}

const pw = await loadPlaywright()
if (!pw) {
  console.error("playwright not found. Run: npx -y -p playwright node shots.mjs <url>  (or npm i -D playwright)")
  process.exit(2)
}
const { chromium } = pw

const args = process.argv.slice(2)
const url = args.find((a) => !a.startsWith("--"))
if (!url) {
  console.error("usage: node shots.mjs <url> [outDir] [--wait ms]")
  process.exit(2)
}
const outDir = args.filter((a) => !a.startsWith("--"))[1] || "shots"
const waitIdx = args.indexOf("--wait")
const wait = waitIdx >= 0 ? Number(args[waitIdx + 1]) : 800
mkdirSync(outDir, { recursive: true })

const sizes = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  { name: "phone", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
]

const browser = await chromium.launch()
let problems = 0
for (const size of sizes) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ ...size, colorScheme: theme })
    await ctx.addInitScript((t) => {
      try {
        localStorage.setItem("theme", t)
      } catch {}
      const apply = () => document.documentElement?.classList.toggle("dark", t === "dark")
      if (document.documentElement) apply()
      else new MutationObserver((_, obs) => document.documentElement && (apply(), obs.disconnect())).observe(document, { childList: true })
    }, theme)
    const page = await ctx.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(e.message))
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
    await page.goto(url, { waitUntil: "networkidle" })
    await page.waitForTimeout(wait)
    const file = join(outDir, `${size.name}-${theme}.png`)
    await page.screenshot({ path: file, fullPage: false })

    const report = await page.evaluate(() => {
      const running = document
        .getAnimations()
        .filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity)
        .map((a) => {
          const el = a.effect.target
          return `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : ""}`
        })
      const sideways = document.documentElement.scrollWidth > window.innerWidth + 1
      return { running, sideways }
    })
    const notes = []
    if (report.running.length > 1) notes.push(`${report.running.length} infinite animations running: ${[...new Set(report.running)].slice(0, 6).join(", ")}`)
    if (report.sideways) notes.push("page scrolls sideways")
    if (errors.length) notes.push(`${errors.length} console error(s): ${errors[0]}`)
    problems += notes.length
    console.log(`${notes.length ? "!" : "✓"} ${file}${notes.length ? "  — " + notes.join(" · ") : ""}`)
    await ctx.close()
  }
}
await browser.close()
console.log(problems ? `\n${problems} thing(s) to look at. Open the PNGs either way.` : "\nNo automatic findings. Open the PNGs and look.")
