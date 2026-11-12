// Theme preference: system | light | dark, stored under leafpack.theme.
// index.html applies it before first paint; this module keeps it in sync
// afterwards (toggle, system changes, other tabs).
import { ref, watch } from "vue"

const KEY = "leafpack.theme"
const ORDER = ["system", "light", "dark"]
const media = window.matchMedia("(prefers-color-scheme: dark)")

function read() {
  try {
    const v = localStorage.getItem(KEY)
    return ORDER.includes(v) ? v : "system"
  } catch {
    return "system" // private window or blocked storage: keep changes for this visit only
  }
}

export const themePref = ref(read())

function apply() {
  const dark = themePref.value === "dark" || (themePref.value === "system" && media.matches)
  document.documentElement.classList.toggle("dark", dark)
}

watch(themePref, (v) => {
  try {
    localStorage.setItem(KEY, v)
  } catch {}
  apply()
})
media.addEventListener("change", apply)
window.addEventListener("storage", (e) => {
  if (e.key === KEY) themePref.value = ORDER.includes(e.newValue) ? e.newValue : "system"
})

export function cycleTheme() {
  themePref.value = ORDER[(ORDER.indexOf(themePref.value) + 1) % ORDER.length]
}

export const themeMeta = {
  system: { icon: "i-carbon-contrast", label: "Theme: follows the system. Click to switch to light." },
  light: { icon: "i-carbon-sun", label: "Theme: light. Click to switch to dark." },
  dark: { icon: "i-carbon-moon", label: "Theme: dark. Click to follow the system." },
}
