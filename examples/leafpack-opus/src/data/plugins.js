// Mock plugin index. Stands in for the registry API; src/lib/api.js adds the
// latency and the simulated failure.

const v = (version, date, notes, extra = {}) => ({ version, date, notes, ...extra })

const readme = (name, summary, body) => `# ${name}

${summary}

${body}`

export const plugins = [
  {
    id: "web-fetch",
    name: "web-fetch",
    description: "Fetch a URL and hand the agent clean readable text, with redirects, robots.txt and size limits handled for you.",
    category: "tools",
    publisher: "kohaku-lab",
    license: "MIT",
    downloads: 48210,
    verified: true,
    tags: ["http", "scraping"],
    versions: [
      v("2.3.1", "2026-11-04", "Fix charset detection on pages that only declare it in a meta tag."),
      v("2.3.0", "2026-10-18", "Add `max_bytes` option. Default limit is now 2 MB."),
      v("2.2.0", "2026-08-30", "Respect robots.txt by default; opt out with `obey_robots = false`."),
      v("2.1.4", "2026-07-02", "Retry once on connection reset."),
      v("2.0.0", "2026-04-11", "New readable-text extractor. Breaking: `html` output field renamed to `raw`."),
    ],
    permissions: [
      { kind: "network", scope: "*:443, *:80", reason: "Fetches whatever URL the agent asks for.", broad: true },
      { kind: "fs-write", scope: "~/.cache/leafpack/web-fetch", reason: "Caches responses for 10 minutes." },
    ],
    readme: readme(
      "web-fetch",
      "Give your agent a `fetch` tool that returns readable text instead of raw HTML.",
      `## Usage

\`\`\`toml
[plugins.web-fetch]
max_bytes = 2_000_000
obey_robots = true
\`\`\`

The tool returns the page title, the extracted text and the final URL after redirects.

## Limits

- Pages larger than \`max_bytes\` are cut off, and the result says so.
- JavaScript is not executed. Use a browser plugin for single-page apps.`,
    ),
  },
  {
    id: "shell-runner",
    name: "shell-runner",
    description: "Run shell commands with a timeout, a working-directory allowlist and streamed output.",
    category: "tools",
    publisher: "kohaku-lab",
    license: "Apache-2.0",
    downloads: 39102,
    verified: true,
    tags: ["shell", "process"],
    versions: [
      v("1.8.0", "2026-10-29", "Stream stdout and stderr as separate channels."),
      v("1.7.2", "2026-09-12", "Kill the whole process group on timeout."),
      v("1.7.0", "2026-07-21", "Add `allowed_dirs`."),
      v("1.6.0", "2026-05-03", "Windows support through PowerShell."),
    ],
    permissions: [
      { kind: "shell", scope: "any command", reason: "This is the point of the plugin. Pair it with a sandbox plugin for untrusted agents.", broad: true },
      { kind: "fs-read", scope: "allowed_dirs", reason: "Commands run inside the directories you list." },
    ],
    readme: readme(
      "shell-runner",
      "A `run` tool for agents that need a terminal.",
      `## Usage

\`\`\`toml
[plugins.shell-runner]
allowed_dirs = ["~/projects/demo"]
timeout_s = 120
\`\`\`

Output is streamed back to the agent as it arrives. Commands that exceed \`timeout_s\` are killed together with their children.`,
    ),
  },
  {
    id: "vector-memory",
    name: "vector-memory",
    description: "Long-term memory in a local vector index, so agents can recall notes from earlier sessions.",
    category: "memory",
    publisher: "mossbank",
    license: "MIT",
    downloads: 27450,
    tags: ["embeddings", "recall"],
    versions: [
      v("0.9.4", "2026-11-09", "Batch embedding requests; indexing is about 4× faster."),
      v("0.9.3", "2026-10-02", "Fix a crash when the index directory is on a network drive."),
      v("0.9.2", "2026-09-14", "Broken migration for indexes created before 0.9.", { yanked: true }),
      v("0.9.0", "2026-08-20", "Switch the default embedding model."),
    ],
    permissions: [
      { kind: "fs-write", scope: "~/.local/share/leafpack/vector-memory", reason: "Stores the index." },
      { kind: "network", scope: "embedding provider", reason: "Sends note text to the embedding model you configure." },
    ],
    readme: readme(
      "vector-memory",
      "Adds `remember` and `recall` tools backed by an on-disk index.",
      `## Usage

\`\`\`toml
[plugins.vector-memory]
top_k = 6
\`\`\`

Notes are embedded with the model provider you already use, so no extra key is needed.`,
    ),
  },
  {
    id: "sqlite-memory",
    name: "sqlite-memory",
    description: "Plain key-value and journal memory in a single SQLite file. No embeddings, no network.",
    category: "memory",
    publisher: "kohaku-lab",
    license: "MIT",
    downloads: 18800,
    verified: true,
    tags: ["sqlite", "offline"],
    versions: [
      v("1.3.0", "2026-10-11", "Add full-text search over the journal."),
      v("1.2.1", "2026-08-01", "WAL mode on by default."),
      v("1.0.0", "2026-03-15", "First stable release."),
    ],
    permissions: [{ kind: "fs-write", scope: "./.agent/memory.db", reason: "One database file inside the agent's folder." }],
    readme: readme(
      "sqlite-memory",
      "The simplest memory plugin: everything lives in one SQLite file next to your agent.",
      `## Usage

\`\`\`toml
[plugins.sqlite-memory]
path = ".agent/memory.db"
\`\`\``,
    ),
  },
  {
    id: "discord-channel",
    name: "discord-channel",
    description: "Run an agent as a Discord bot. Threads map to sessions, and slash commands map to agent commands.",
    category: "channels",
    publisher: "fernworks",
    license: "MIT",
    downloads: 22340,
    tags: ["discord", "bot"],
    versions: [
      v("3.1.0", "2026-10-25", "Thread-per-session mode."),
      v("3.0.2", "2026-09-03", "Fix duplicate replies after a reconnect."),
      v("3.0.0", "2026-06-17", "Rewrite on the new gateway client."),
    ],
    permissions: [
      { kind: "network", scope: "discord.com, gateway.discord.gg", reason: "Connects to the Discord gateway." },
      { kind: "env", scope: "DISCORD_TOKEN", reason: "Reads the bot token." },
    ],
    readme: readme(
      "discord-channel",
      "Put your agent in a Discord server.",
      `## Usage

\`\`\`bash
export DISCORD_TOKEN=...
leafpack add discord-channel
\`\`\``,
    ),
  },
  {
    id: "slack-bridge",
    name: "slack-bridge",
    description: "Connect an agent to Slack channels and direct messages. Replaced by chat-bridge.",
    category: "channels",
    publisher: "fernworks",
    license: "MIT",
    downloads: 15020,
    deprecated: { replacement: "chat-bridge", reason: "Slack's legacy RTM API shuts down in March 2027." },
    tags: ["slack"],
    versions: [
      v("1.2.2", "2026-05-14", "Final release. Use chat-bridge for new agents."),
      v("1.2.0", "2026-02-02", "Direct messages."),
      v("1.0.0", "2025-10-20", "First release."),
    ],
    permissions: [
      { kind: "network", scope: "slack.com", reason: "Connects to Slack's RTM API." },
      { kind: "env", scope: "SLACK_BOT_TOKEN", reason: "Reads the bot token." },
    ],
    readme: readme(
      "slack-bridge",
      "Deprecated. New agents should use chat-bridge, which supports Slack through the Events API.",
      `## Migrating

\`\`\`bash
leafpack remove slack-bridge
leafpack add chat-bridge
\`\`\`

Your channel mapping in \`[plugins.slack-bridge]\` can be moved to \`[plugins.chat-bridge.slack]\` unchanged.`,
    ),
  },
  {
    id: "chat-bridge",
    name: "chat-bridge",
    description: "One plugin for Slack, Matrix and Telegram, with the same session model on all three.",
    category: "channels",
    publisher: "fernworks",
    license: "MIT",
    downloads: 6120,
    tags: ["slack", "matrix", "telegram"],
    versions: [
      v("2.0.0", "2026-11-01", "Matrix support. Slack moved to the Events API."),
      v("1.1.0", "2026-08-08", "Telegram support."),
    ],
    permissions: [
      { kind: "network", scope: "slack.com, matrix homeserver, api.telegram.org", reason: "Connects to each chat service you enable." },
      { kind: "env", scope: "SLACK_BOT_TOKEN, MATRIX_TOKEN, TELEGRAM_TOKEN", reason: "Reads the token for each enabled service." },
    ],
    readme: readme("chat-bridge", "Talk to your agent from the chat app your team already uses.", "## Usage\n\nEnable one or more services under `[plugins.chat-bridge]`."),
  },
  {
    id: "openrouter-provider",
    name: "openrouter-provider",
    description: "Use any model on OpenRouter, with per-agent model routing and a spending cap.",
    category: "models",
    publisher: "lichen-labs",
    license: "MIT",
    downloads: 30115,
    tags: ["llm", "routing"],
    versions: [
      v("1.4.0", "2026-11-10", "Per-agent spending cap."),
      v("1.3.1", "2026-10-05", "Retry on 429 with the provider's `retry-after`."),
      v("1.3.0", "2026-08-27", "Model routing rules."),
    ],
    permissions: [
      { kind: "network", scope: "openrouter.ai", reason: "Sends prompts to the OpenRouter API." },
      { kind: "env", scope: "OPENROUTER_API_KEY", reason: "Reads your API key." },
    ],
    readme: readme("openrouter-provider", "A model provider for OpenRouter.", "## Usage\n\n```toml\n[plugins.openrouter-provider]\nmodel = \"anthropic/claude-sonnet\"\nmonthly_cap_usd = 40\n```"),
  },
  {
    id: "local-llama",
    name: "local-llama",
    description: "Serve a GGUF model from your own machine through llama.cpp. Nothing leaves the computer.",
    category: "models",
    publisher: "mossbank",
    license: "Apache-2.0",
    downloads: 12880,
    tags: ["offline", "gguf"],
    versions: [
      v("0.6.1", "2026-10-21", "Detect Apple Metal and CUDA automatically."),
      v("0.6.0", "2026-09-09", "Tool calling for models that support it."),
    ],
    permissions: [
      { kind: "process", scope: "llama-server", reason: "Starts and stops a local llama.cpp server." },
      { kind: "fs-read", scope: "~/models", reason: "Loads model files." },
    ],
    readme: readme("local-llama", "Run your agent on a local model.", "## Usage\n\n```toml\n[plugins.local-llama]\nmodel_path = \"~/models/qwen3-8b-q4_k_m.gguf\"\n```"),
  },
  {
    id: "trace-viewer",
    name: "trace-viewer",
    description: "Record every turn, tool call and token count, and browse runs in a local web viewer.",
    category: "observability",
    publisher: "kohaku-lab",
    license: "Apache-2.0",
    downloads: 9400,
    verified: true,
    tags: ["tracing", "debugging"],
    versions: [
      v("0.8.0", "2026-11-06", "Cost column and per-model breakdown."),
      v("0.7.0", "2026-09-30", "Search across runs."),
    ],
    permissions: [
      { kind: "fs-write", scope: "./.agent/traces", reason: "Writes one trace file per run." },
      { kind: "network", scope: "localhost:7420", reason: "Serves the viewer on your machine only." },
    ],
    readme: readme("trace-viewer", "See what your agent did and what it cost.", "## Usage\n\n```bash\nleafpack add trace-viewer\nleafpack run trace-viewer\n```"),
  },
  {
    id: "token-meter",
    name: "token-meter",
    description: "Counts tokens per run and warns when a session passes a budget. Folded into trace-viewer.",
    category: "observability",
    publisher: "quillsoft",
    license: "MIT",
    downloads: 7720,
    deprecated: { replacement: "trace-viewer", reason: "trace-viewer 0.8 counts tokens and cost per run." },
    tags: ["tokens", "budget"],
    versions: [
      v("1.0.3", "2026-03-22", "Final release."),
      v("1.0.0", "2025-12-01", "First release."),
    ],
    permissions: [{ kind: "fs-write", scope: "./.agent/token-meter.json", reason: "Stores running totals." }],
    readme: readme("token-meter", "Deprecated in favour of trace-viewer.", "## Migrating\n\nInstall trace-viewer; it reads token-meter totals on first start."),
  },
  {
    id: "docker-sandbox",
    name: "docker-sandbox",
    description: "Run tool calls inside a throwaway Docker container with no network unless you allow it.",
    category: "sandbox",
    publisher: "kohaku-lab",
    license: "Apache-2.0",
    downloads: 14400,
    verified: true,
    tags: ["docker", "isolation"],
    versions: [
      v("1.5.0", "2026-10-30", "Reuse a warm container between calls in the same session."),
      v("1.4.0", "2026-08-12", "Per-tool network allowlist."),
      v("1.0.0", "2026-02-19", "First stable release."),
    ],
    permissions: [
      { kind: "process", scope: "docker", reason: "Talks to the local Docker daemon to start containers." },
      { kind: "fs-read", scope: "workspace (read-only mount)", reason: "Mounts the agent's workspace into the container." },
    ],
    readme: readme("docker-sandbox", "Wrap shell-runner and other tools in a container.", "## Usage\n\n```toml\n[plugins.docker-sandbox]\nimage = \"python:3.12-slim\"\nnetwork = \"none\"\n```"),
  },
  {
    id: "wasm-sandbox",
    name: "wasm-sandbox",
    description: "Execute small Python or JavaScript snippets in a WebAssembly sandbox with memory and time limits.",
    category: "sandbox",
    publisher: "quillsoft",
    license: "MPL-2.0",
    downloads: 2210,
    tags: ["wasm", "python"],
    versions: [
      v("0.3.0", "2026-10-14", "JavaScript runtime."),
      v("0.2.0", "2026-07-07", "Memory limit option."),
    ],
    permissions: [],
    readme: readme("wasm-sandbox", "A code-execution tool that cannot touch your files or network.", "## Usage\n\n```toml\n[plugins.wasm-sandbox]\nmemory_mb = 256\ntimeout_s = 10\n```"),
  },
  {
    id: "git-tools",
    name: "git-tools",
    description: "Status, diff, log, branch and commit tools that return structured results instead of terminal text.",
    category: "tools",
    publisher: "lichen-labs",
    license: "MIT",
    downloads: 11390,
    tags: ["git", "vcs"],
    versions: [
      v("0.4.2", "2026-11-07", "Handle repositories with no commits yet."),
      v("0.4.0", "2026-09-19", "Structured diff hunks."),
      v("0.3.0", "2026-06-02", "Commit tool asks for confirmation by default."),
    ],
    permissions: [
      { kind: "process", scope: "git", reason: "Runs the git executable." },
      { kind: "fs-write", scope: "the current repository", reason: "Commits and branch changes write to .git." },
    ],
    readme: readme("git-tools", "Git for agents, with structured output.", "## Usage\n\n```bash\nleafpack add git-tools\n```"),
  },
]

// Every plugin's current version is its newest non-yanked release.
for (const p of plugins) {
  p.version = p.versions.find((x) => !x.yanked).version
  p.updatedAt = p.versions[0].date
}
