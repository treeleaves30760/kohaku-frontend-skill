// One formatter module, reused everywhere.
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
const full = new Intl.NumberFormat("en")
const dateFmt = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" })
const dateTimeFmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" })

export const fmtCompact = (n) => (Number.isFinite(n) ? compact.format(n) : "—")
export const fmtFull = (n) => (Number.isFinite(n) ? full.format(n) : "—")
export const fmtDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : "—")
export const fmtDateTime = (iso) => (iso ? dateTimeFmt.format(new Date(iso)) : "—")

export function fmtAgo(iso) {
  if (!iso) return "never"
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  const units = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Infinity, "year"],
  ]
  let v = s
  for (const [step, name] of units) {
    if (v < step || step === Infinity) {
      const n = Math.floor(v)
      if (name === "second" && n < 45) return "just now"
      return `${n} ${name}${n === 1 ? "" : "s"} ago`
    }
    v /= step
  }
}
