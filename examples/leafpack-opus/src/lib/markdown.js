// Tiny markdown renderer for plugin readmes: headings, paragraphs, lists,
// fenced code and inline code/bold. Input is escaped first, so readme text can
// never inject markup. Returns blocks so code fences can use <CodeBlock>.
import { escapeHtml } from "./highlight.js"

const inline = (s) =>
  escapeHtml(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

export function parseMarkdown(src) {
  const blocks = []
  const lines = src.split("\n")
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const fence = /^```(\w*)/.exec(line)
    if (fence) {
      const code = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++])
      i++
      blocks.push({ type: "code", lang: fence[1], code: code.join("\n") })
      continue
    }
    const h = /^(#{1,3})\s+(.*)/.exec(line)
    if (h) {
      blocks.push({ type: "h", level: h[1].length, html: inline(h[2]) })
      i++
      continue
    }
    if (/^- /.test(line)) {
      const items = []
      while (i < lines.length && /^- /.test(lines[i])) items.push(inline(lines[i++].slice(2)))
      blocks.push({ type: "ul", items })
      continue
    }
    if (!line.trim()) {
      i++
      continue
    }
    const para = []
    while (i < lines.length && lines[i].trim() && !/^(#|- |```)/.test(lines[i])) para.push(lines[i++])
    blocks.push({ type: "p", html: inline(para.join(" ")) })
  }
  return blocks
}
