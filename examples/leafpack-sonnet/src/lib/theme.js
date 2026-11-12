import { ref } from "vue"

const KEY = "leafpack.theme"
export const themePref = ref("system") // system | light | dark
const order = ["system", "light", "dark"]

function read() {
  try {
    const v = localStorage.getItem(KEY)
    return order.includes(v) ? v : "system"
  } catch {
    return "system"
  }
}
function apply() {
  const dark = themePref.value === "dark" || (themePref.value === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
}
export function initTheme() {
  themePref.value = read()
  apply()
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", apply)
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      themePref.value = read()
      apply()
    }
  })
}
export function cycleTheme() {
  themePref.value = order[(order.indexOf(themePref.value) + 1) % order.length]
  try {
    localStorage.setItem(KEY, themePref.value)
  } catch {}
  apply()
}
export const nextTheme = () => order[(order.indexOf(themePref.value) + 1) % order.length]
