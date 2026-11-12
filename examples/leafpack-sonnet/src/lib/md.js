// Minimal markdown for plugin readmes: headings, paragraphs, lists, fenced code,
// inline code and bold. Input is escaped first, so mock content cannot inject HTML.
import { esc, highlight } from "./highlight.js"

const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

export function renderMd(src) {
  const lines = src.split("\n")
  const out = []
  let i = 0
  while (i < lines.length) {
    const l = lines[i]
    if (l.startsWith("```")) {
      const lang = l.slice(3).trim()
      const buf = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++])
      i++
      out.push(`<pre class="kt-code" data-lang="${esc(lang || "text")}" tabindex="0"><code>${highlight(buf.join("\n"), lang)}</code></pre>`)
    } else if (/^#{1,3} /.test(l)) {
      const n = l.match(/^#+/)[0].length
      out.push(`<h${n}>${inline(l.replace(/^#+ /, ""))}</h${n}>`)
      i++
    } else if (l.startsWith("- ")) {
      const items = []
      while (i < lines.length && lines[i].startsWith("- ")) items.push(`<li>${inline(lines[i++].slice(2))}</li>`)
      out.push(`<ul>${items.join("")}</ul>`)
    } else if (l.trim() === "") i++
    else {
      const buf = []
      while (i < lines.length && lines[i].trim() !== "" && !/^(```|#{1,3} |- )/.test(lines[i])) buf.push(lines[i++])
      out.push(`<p>${inline(buf.join(" "))}</p>`)
    }
  }
  return out.join("\n")
}
