#!/usr/bin/env node
// Screenshot a page in light + dark at desktop and phone size, with real touch
// emulation on the phone run (so `pointer: coarse` rules apply), and report
// anything animating on an idle page.
//
//   npx -y -p playwright node shots.mjs <url> [outDir] [--wait 800] [--full]
//       [--states '?view=settings,?drawer=1'] [--theme-key app.theme]
//   (first run may need: npx playwright install chromium)
//
// --states takes a comma-separated list. Each entry is one of:
//   ?a=1        query params (added inside the hash when the base URL is a
//               hash route such as http://host/#/)
//   #/docs?x=1  a hash route, for hash-mode routers
//   /browse?x=1 a path, for history-mode routers
// --full also saves a full-page PNG (<size>-<theme>-full.png) for long pages.
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
const opt = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : fallback
}
const FLAGS = new Set(["--full"]) // options that take no value
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && !FLAGS.has(args[i - 1])))
const url = positional[0]
if (!url) {
  console.error("usage: node shots.mjs <url> [outDir] [--wait ms] [--states '?view=settings,#/new'] [--theme-key myapp.theme]")
  process.exit(2)
}
const outDir = positional[1] || "shots"
const wait = Number(opt("--wait", 800))
const fullPage = args.includes("--full")
const themeKeys = ["theme", opt("--theme-key", null)].filter(Boolean)
// Extra states reached by URL (query or hash). Give the app URL hooks for
// non-initial states (?view=settings, ?drawer=1, ?demo=stream) — the KIR
// editor does the same: URL params override saved prefs for one load.
const states = ["", ...String(opt("--states", "")).split(",").map((s) => s.trim()).filter(Boolean)]

const sizes = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  { name: "phone", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
]

const withState = (base, st) => {
  if (!st) return base
  if (st.startsWith("#")) return base.replace(/#.*$/, "") + st
  if (st.startsWith("/")) return new URL(st, base).toString()
  const u = new URL(base)
  const params = new URLSearchParams(st.replace(/^\?/, ""))
  if (u.hash.startsWith("#/")) {
    // Hash router: it only reads the query that sits after the #.
    const [route, q = ""] = u.hash.split("?")
    const merged = new URLSearchParams(q)
    for (const [k, v] of params) merged.set(k, v)
    u.hash = `${route}?${merged}`
    return u.toString()
  }
  for (const [k, v] of params) u.searchParams.set(k, v)
  return u.toString()
}
const slug = (st) => st.replace(/^[?#/]+/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "default"

const browser = await chromium.launch()
let problems = 0
for (const st of states) {
  const dir = st ? join(outDir, slug(st)) : outDir
  mkdirSync(dir, { recursive: true })
  for (const size of sizes) {
    for (const theme of ["light", "dark"]) {
      const ctx = await browser.newContext({ ...size, colorScheme: theme })
      await ctx.addInitScript(
        ([t, keys]) => {
          try {
            for (const k of keys) localStorage.setItem(k, t)
          } catch {}
          const apply = () => document.documentElement?.classList.toggle("dark", t === "dark")
          if (document.documentElement) apply()
          else new MutationObserver((_, obs) => document.documentElement && (apply(), obs.disconnect())).observe(document, { childList: true })
        },
        [theme, themeKeys],
      )
      const page = await ctx.newPage()
      const errors = []
      page.on("pageerror", (e) => errors.push(e.message))
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
      await page.goto(withState(url, st), { waitUntil: "networkidle" })
      await page.waitForTimeout(wait)
      const file = join(dir, `${size.name}-${theme}.png`)
      await page.screenshot({ path: file, fullPage: false })
      if (fullPage) await page.screenshot({ path: file.replace(/\.png$/, "-full.png"), fullPage: true })

      const report = await page.evaluate(() => {
        const infinite = document
          .getAnimations()
          .filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity)
          .map((a) => {
            const el = a.effect.target
            const r = el.getBoundingClientRect()
            const cls = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : ""
            return { name: el.tagName.toLowerCase() + cls, small: r.width <= 16 && r.height <= 16, visible: r.width > 0 && r.height > 0 }
          })
          .filter((a) => a.visible)
        const sideways = document.documentElement.scrollWidth > window.innerWidth + 1
        // <body> scrolling instead of the window: scrollY stays 0, so router
        // scroll restore and scroll-spy silently do nothing.
        const b = document.body
        const bodyScrolls = b.scrollHeight > b.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(b).overflowY)
        const visible = (el) => el.getClientRects().length > 0
        // Browser-default link blue means no reset is loaded.
        const rawLinks = [...document.querySelectorAll("a[href]")].filter((a) => visible(a) && getComputedStyle(a).color === "rgb(0, 0, 238)").length
        // A leftover default border width: one side set on purpose, the others at 3px.
        const fatBorders = [...document.querySelectorAll("button, [role=tab], a")].filter((el) => {
          if (!visible(el)) return false
          const c = getComputedStyle(el)
          const w = [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth]
          return w.filter((x) => x === "3px").length >= 2 && new Set(w).size > 1
        }).length
        return { infinite, sideways, bodyScrolls, rawLinks, fatBorders }
      })
      const notes = []
      // Allowed: one "working now" pulse, plus a spinner on an in-flight command.
      // Flagged: repeated small animated indicators (pulsing dots), or more than 3 loops at once.
      const smallLoops = report.infinite.filter((a) => a.small)
      if (smallLoops.length >= 3) notes.push(`${smallLoops.length} small indicators animating (pulsing dots?): ${[...new Set(smallLoops.map((a) => a.name))].slice(0, 4).join(", ")}`)
      else if (report.infinite.length > 3) notes.push(`${report.infinite.length} infinite animations: ${[...new Set(report.infinite.map((a) => a.name))].slice(0, 5).join(", ")}`)
      if (report.sideways) notes.push("page scrolls sideways")
      if (report.bodyScrolls) notes.push("<body> is the scroll container (window.scrollY stays 0); use overflow-x: clip, not hidden, on html and body")
      if (report.rawLinks) notes.push(`${report.rawLinks} link(s) in browser-default blue (no reset loaded?)`)
      if (report.fatBorders) notes.push(`${report.fatBorders} control(s) with a 3px default border on some sides (reset border-width to 0)`)
      if (errors.length) notes.push(`${errors.length} console error(s): ${errors[0]}`)
      problems += notes.length
      const info = report.infinite.length && !notes.length ? `  (${report.infinite.length} loop(s): ${report.infinite.map((a) => a.name).join(", ")})` : ""
      console.log(`${notes.length ? "!" : "✓"} ${file}${notes.length ? "  — " + notes.join(" · ") : info}`)
      await ctx.close()
    }
  }
}
await browser.close()
console.log(problems ? `\n${problems} thing(s) to look at. Open the PNGs either way.` : "\nNo automatic findings. Open the PNGs and look.")
