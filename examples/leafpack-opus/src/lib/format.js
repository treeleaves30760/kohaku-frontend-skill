// One formatter module for numbers and times; Intl objects are created once.
const compactFmt = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
const intFmt = new Intl.NumberFormat("en")
const dateFmt = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" })
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

export const compact = (n) => (Number.isFinite(n) ? compactFmt.format(n) : "—")
export const int = (n) => (Number.isFinite(n) ? intFmt.format(n) : "—")

export function absDate(iso) {
  if (!iso) return "—"
  return dateFmt.format(new Date(iso + "T00:00:00"))
}

/** "3 days ago", "last month"; the absolute date belongs in a title. */
export function relDate(iso) {
  if (!iso) return "never"
  const days = Math.round((new Date(iso + "T00:00:00") - new Date()) / 86400000)
  if (Math.abs(days) < 1) return "today"
  if (Math.abs(days) < 30) return rtf.format(days, "day")
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), "month")
  return rtf.format(Math.round(days / 365), "year")
}
