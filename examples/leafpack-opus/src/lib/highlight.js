// Syntax highlighting for docs and readme code blocks. Colours come from the
// --kt-syntax-* tokens (see app.css), not from a highlight.js theme.
import hljs from "highlight.js/lib/core"
import bash from "highlight.js/lib/languages/bash"
import ini from "highlight.js/lib/languages/ini"
import json from "highlight.js/lib/languages/json"
import python from "highlight.js/lib/languages/python"

hljs.registerLanguage("bash", bash)
hljs.registerLanguage("toml", ini)
hljs.registerLanguage("json", json)
hljs.registerLanguage("python", python)

export function highlight(code, lang) {
  if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value
  return escapeHtml(code)
}

export function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
