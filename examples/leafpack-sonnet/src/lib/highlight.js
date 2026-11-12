// Tiny tokenizer for the few languages the docs and readmes use. Colours come from
// the --kt-syntax-* vars, so both themes follow the tokens.
export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const KEYWORDS = /^(?:import|from|export|const|let|var|function|return|await|async|new|if|else|for|of|in|true|false|null|default)$/
const BASH_CMDS = /^(?:leaf|npm|git|cd|mkdir|echo)$/
const RULES = [
  ["c", /^(?:#[^\n]*|\/\/[^\n]*)/],
  ["s", /^(?:"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/],
  ["n", /^\b\d[\d._]*\b/],
  ["w", /^[A-Za-z_$][\w$-]*/],
  ["p", /^[\s\S]/],
]

export function highlight(code, lang = "") {
  if (lang === "text") return esc(code)
  let out = ""
  let rest = code
  while (rest) {
    for (const [kind, re] of RULES) {
      const m = rest.match(re)
      if (!m) continue
      const t = m[0]
      rest = rest.slice(t.length)
      if (kind === "w") {
        if (lang === "bash") out += BASH_CMDS.test(t) ? `<span class="tok-f">${esc(t)}</span>` : esc(t)
        else if (KEYWORDS.test(t)) out += `<span class="tok-k">${esc(t)}</span>`
        else if (rest[0] === "(") out += `<span class="tok-f">${esc(t)}</span>`
        else out += esc(t)
      } else if (kind === "s" && lang === "json" && rest.trimStart().startsWith(":")) {
        out += `<span class="tok-v">${esc(t)}</span>`
      } else if (kind === "p") out += esc(t)
      else out += `<span class="tok-${kind}">${esc(t)}</span>`
      break
    }
  }
  return out
}
