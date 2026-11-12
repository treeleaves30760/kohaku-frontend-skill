// Mock registry. Icon and gradient classes are literal strings on purpose:
// the atomic CSS engine only sees class names that appear in source text.

export const CATEGORIES = [
  { id: "tools", label: "Tools", icon: "i-carbon-tools", tile: "from-iolite to-taaffeite", blurb: "Give an agent hands: search, shell, files." },
  { id: "memory", label: "Memory", icon: "i-carbon-data-base", tile: "from-aquamarine to-sapphire", blurb: "Keep facts and context between runs." },
  { id: "models", label: "Models", icon: "i-carbon-machine-learning-model", tile: "from-sapphire to-iolite", blurb: "Connect hosted or local model backends." },
  { id: "channels", label: "Channels", icon: "i-carbon-chat", tile: "from-taaffeite to-aquamarine", blurb: "Talk to agents from chat apps." },
  { id: "observability", label: "Observability", icon: "i-carbon-chart-line-smooth", tile: "from-aquamarine to-iolite", blurb: "Traces, costs and run history." },
  { id: "safety", label: "Safety", icon: "i-carbon-security", tile: "from-taaffeite to-sapphire", blurb: "Guard inputs, outputs and secrets." },
]
export const categoryById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

// Permission vocabulary: level "attention" marks the non-default (needs a look before install).
export const PERMISSIONS = {
  "net.fetch": { label: "Network access", hint: "Makes outbound HTTPS requests to the hosts listed in the manifest.", level: "attention", icon: "i-carbon-wifi" },
  "net.listen": { label: "Open a local port", hint: "Starts a server on localhost while the agent runs.", level: "attention", icon: "i-carbon-port-input" },
  "fs.read": { label: "Read files", hint: "Reads files inside the agent workspace only.", level: "default", icon: "i-carbon-document" },
  "fs.write": { label: "Write files", hint: "Creates and edits files inside the agent workspace.", level: "attention", icon: "i-carbon-edit" },
  "shell.exec": { label: "Run commands", hint: "Starts processes on the host. Review the sandbox settings before enabling.", level: "attention", icon: "i-carbon-terminal" },
  "memory.rw": { label: "Read and write memory", hint: "Stores and recalls entries in the agent memory store.", level: "default", icon: "i-carbon-data-base" },
  "secrets.read": { label: "Read secrets", hint: "Reads API tokens that you place in the agent keychain.", level: "attention", icon: "i-carbon-password" },
  "events.emit": { label: "Emit run events", hint: "Publishes trace and usage events to the run log.", level: "default", icon: "i-carbon-event" },
}

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()

const raw = [
  {
    id: "web-search", publisher: "leafworks", category: "tools", version: "2.4.1", downloads: 1240000, updatedDays: 3, license: "MIT",
    verified: true, featured: true, tags: ["search", "web"],
    summary: "Search the web and read result pages, with per-domain allow and block lists.",
    perms: ["net.fetch", "events.emit"], hosts: "api.search.example, *.wikipedia.org",
    usage: 'agent.use("web-search", { provider: "brave", maxResults: 5 })',
  },
  {
    id: "shell-sandbox", publisher: "leafworks", category: "tools", version: "1.9.0", downloads: 640000, updatedDays: 11, license: "Apache-2.0",
    verified: true, featured: true, tags: ["shell", "sandbox"],
    summary: "Run shell commands in a throwaway container with CPU, memory and time limits.",
    perms: ["shell.exec", "fs.read", "fs.write"], hosts: "",
    usage: 'agent.use("shell-sandbox", { image: "debian:12-slim", timeoutMs: 30000 })',
  },
  {
    id: "vector-memory", publisher: "mnemo", category: "memory", version: "0.12.3", downloads: 418000, updatedDays: 6, license: "MIT",
    verified: true, featured: true, tags: ["embeddings", "recall"],
    summary: "Long-term memory backed by a local vector index. Recall by meaning, not by keyword.",
    perms: ["memory.rw", "fs.write"], hosts: "",
    usage: 'agent.use("vector-memory", { path: ".leaf/memory", topK: 6 })',
  },
  {
    id: "sqlite-memory", publisher: "mnemo", category: "memory", version: "1.3.0", downloads: 96500, updatedDays: 40, license: "MIT",
    verified: false, featured: false, tags: ["sqlite", "structured"],
    summary: "Structured notes and key-value facts in a single SQLite file you can inspect.",
    perms: ["memory.rw", "fs.write"], hosts: "",
    usage: 'agent.use("sqlite-memory", { file: "notes.db" })',
  },
  {
    id: "discord-channel", publisher: "relay-labs", category: "channels", version: "3.0.2", downloads: 287000, updatedDays: 2, license: "MIT",
    verified: true, featured: true, tags: ["chat", "bot"],
    summary: "Run an agent as a Discord bot with threads, slash commands and attachments.",
    perms: ["net.fetch", "secrets.read"], hosts: "discord.com, gateway.discord.gg",
    usage: 'agent.use("discord-channel", { tokenRef: "DISCORD_TOKEN" })',
  },
  {
    id: "slack-channel", publisher: "relay-labs", category: "channels", version: "2.2.0", downloads: 174000, updatedDays: 19, license: "MIT",
    verified: false, featured: false, tags: ["chat", "workspace"],
    summary: "Answer in Slack channels and direct messages, with approval buttons for risky steps.",
    perms: ["net.fetch", "secrets.read", "net.listen"], hosts: "slack.com, *.slack-edge.com",
    usage: 'agent.use("slack-channel", { tokenRef: "SLACK_BOT_TOKEN" })',
  },
  {
    id: "telegram-bridge", publisher: "hana", category: "channels", version: "0.8.5", downloads: 52300, updatedDays: 310, license: "GPL-3.0",
    verified: false, featured: false, tags: ["chat", "bot"],
    deprecated: "Superseded by relay-labs/telegram-channel, which supports the 2026 Bot API. This package gets no further fixes.",
    summary: "Forward Telegram messages to an agent. Long polling only.",
    perms: ["net.fetch", "secrets.read"], hosts: "api.telegram.org",
    usage: 'agent.use("telegram-bridge", { tokenRef: "TG_TOKEN" })',
  },
  {
    id: "openai-compat", publisher: "leafworks", category: "models", version: "4.1.0", downloads: 905000, updatedDays: 5, license: "Apache-2.0",
    verified: true, featured: false, tags: ["chat-completions", "streaming"],
    summary: "Talk to any endpoint that speaks the OpenAI chat-completions protocol, with streaming and tool calls.",
    perms: ["net.fetch", "secrets.read"], hosts: "configured per provider",
    usage: 'agent.use("openai-compat", { baseUrl: "https://llm.example/v1" })',
  },
  {
    id: "ollama-local", publisher: "kitsune", category: "models", version: "0.6.1", downloads: 131000, updatedDays: 24, license: "MIT",
    verified: false, featured: false, tags: ["local", "gpu"],
    summary: "Use models served by a local Ollama instance. Detects installed models on startup.",
    perms: ["net.fetch"], hosts: "localhost:11434",
    usage: 'agent.use("ollama-local", { model: "llama3.2" })',
  },
  {
    id: "trace-viewer", publisher: "lanternio", category: "observability", version: "1.5.4", downloads: 203000, updatedDays: 8, license: "Apache-2.0",
    verified: true, featured: true, tags: ["traces", "ui"],
    summary: "A local web UI that replays every run as a timeline of model calls and tool calls.",
    perms: ["events.emit", "net.listen"], hosts: "",
    usage: 'agent.use("trace-viewer", { port: 4318 })',
  },
  {
    id: "cost-meter", publisher: "lanternio", category: "observability", version: "0.9.0", downloads: 68800, updatedDays: 33, license: "MIT",
    verified: false, featured: false, tags: ["usage", "budget"],
    summary: "Count tokens and estimate spend per run, with a hard budget that stops the agent.",
    perms: ["events.emit"], hosts: "",
    usage: 'agent.use("cost-meter", { budgetUsd: 2.5 })',
  },
  {
    id: "prompt-guard", publisher: "aegis", category: "safety", version: "2.0.0", downloads: 355000, updatedDays: 1, license: "Apache-2.0",
    verified: true, featured: true, tags: ["injection", "filter"],
    summary: "Screen tool output and web pages for prompt-injection patterns before the model sees them.",
    perms: ["events.emit"], hosts: "",
    usage: 'agent.use("prompt-guard", { mode: "block" })',
  },
  {
    id: "pii-redactor", publisher: "aegis", category: "safety", version: "1.1.2", downloads: 89400, updatedDays: 57, license: "MIT",
    verified: true, featured: false, tags: ["privacy", "redaction"],
    summary: "Replace emails, phone numbers and card numbers with stable placeholders in logs and prompts.",
    perms: ["events.emit", "memory.rw"], hosts: "",
    usage: 'agent.use("pii-redactor", { kinds: ["email", "phone", "card"] })',
  },
  {
    id: "html-scraper", publisher: "sugi", category: "tools", version: "0.4.0", downloads: 27100, updatedDays: 520, license: "BSD-3-Clause",
    verified: false, featured: false, tags: ["scraping", "html"],
    deprecated: "Use web-search, which now reads pages directly. html-scraper does not handle JavaScript-rendered sites.",
    summary: "Fetch a URL and extract text with CSS selectors.",
    perms: ["net.fetch"], hosts: "any host you pass in",
    usage: 'agent.use("html-scraper")',
  },
]

const NOTES = [
  "Fix a retry loop when the host closes the connection early.",
  "Add timeoutMs option. Default stays at 30000.",
  "Faster startup: lazy-load optional dependencies.",
  "Document the permissions this plugin asks for.",
  "Rename max_results to maxResults. The old name still works and logs a warning.",
  "Internal refactor. No behaviour change.",
]

function versionsFor(p) {
  const [maj, min, pat] = p.version.split(".").map(Number)
  const list = [p.version]
  let a = maj, b = min, c = pat
  for (let i = 0; i < 4; i++) {
    if (c > 0) c--
    else if (b > 0) { b--; c = 2 }
    else if (a > 0) { a--; b = 4; c = 1 }
    else break
    list.push(`${a}.${b}.${c}`)
  }
  return list.map((v, i) => ({
    v,
    date: daysAgo(p.updatedDays + i * 23 + (i ? 9 : 0)),
    notes: NOTES[(p.id.length + i) % NOTES.length],
    yanked: i === 2 && p.id === "web-search" ? "Crashed on empty result pages." : "",
  }))
}

function readmeFor(p) {
  const cat = categoryById[p.category].label.toLowerCase()
  const n = p.perms.length
  return [
    `# ${p.id}`,
    "",
    p.summary,
    "",
    "## Install",
    "",
    "```bash",
    `leaf plugin add @${p.publisher}/${p.id}`,
    "```",
    "",
    "## Use it",
    "",
    "```js",
    'import { agent } from "./agent.js"',
    "",
    p.usage,
    "```",
    "",
    "## What it does",
    "",
    `- Registers itself as a ${cat} plugin when the agent starts.`,
    "- Reports what it is doing to the run log, so you can review it later.",
    "- Reads its options from the object you pass to `agent.use`.",
    "",
    "## Permissions",
    "",
    `This plugin asks for ${n} permission${n === 1 ? "" : "s"}. The Permissions tab lists each one and why it is needed. Leaf shows them before install and again if a later version asks for more.`,
    "",
    "## Licence",
    "",
    `${p.license}. Published by @${p.publisher}.`,
  ].join("\n")
}

export const plugins = raw.map((r) => ({
  ...r,
  name: r.id,
  scope: `@${r.publisher}`,
  install: `leaf plugin add @${r.publisher}/${r.id}`,
  updated: daysAgo(r.updatedDays),
  deprecated: r.deprecated || "",
  permissions: r.perms.map((id) => ({ id, ...PERMISSIONS[id] })),
  versions: versionsFor(r),
  readme: readmeFor(r),
}))

// Fake network. ?fail=1 fails the first load of each page visit (Retry then succeeds);
// ?fail=always fails every attempt. The delay is long enough that loading states are real.
const failedOnce = new Set()
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

async function gate(failParam, key) {
  await delay(450 + Math.random() * 450)
  if (failParam === "always" || (failParam && !failedOnce.has(key))) {
    failedOnce.add(key)
    throw new Error("GET /v1/plugins responded 503 Service Unavailable (registry replica is restarting)")
  }
}

export async function fetchPlugins({ fail = "" } = {}) {
  await gate(fail, "list")
  return plugins
}

export async function fetchPlugin(id, { fail = "" } = {}) {
  await gate(fail, "detail:" + id)
  return plugins.find((p) => p.id === id) || null
}
