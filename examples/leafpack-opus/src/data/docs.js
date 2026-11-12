// Docs pages: ONE ordered list. The sidebar, prev/next tiles and the router
// all derive from it, so the nav can never point at a page that doesn't exist.
// Blocks: p · ul · h2/h3 (with id → TOC) · code · table · callout.

const code = (lang, src) => ({ type: "code", lang, code: src.trim() })

export const docGroups = ["Getting started", "Guides", "Concepts", "Reference"]

export const docs = [
  {
    id: "overview",
    group: "Getting started",
    title: "What is Leafpack",
    summary: "Leafpack is the plugin registry and installer for the Terrarium agent framework.",
    tags: ["intro"],
    updated: "2026-10-30",
    blocks: [
      { type: "p", html: "A Leafpack plugin adds tools, memory, chat channels, model providers or sandboxes to an agent. Each plugin declares the permissions it needs, and the installer shows them before anything is written to disk." },
      { type: "h2", id: "how-it-works", text: "How it works" },
      { type: "ul", items: ["The <code>leafpack</code> CLI resolves a plugin and its version from the registry.", "It prints the plugin's permissions and asks you to confirm.", "It writes the plugin into your agent's <code>plugins/</code> folder and adds a section to <code>agent.toml</code>."] },
      { type: "h2", id: "next", text: "Where next" },
      { type: "p", html: 'Install the CLI, then <a href="#/browse">browse the catalog</a>. To share your own plugin, read <a href="#/docs/publishing">Publishing a plugin</a>.' },
    ],
  },
  {
    id: "install-cli",
    group: "Getting started",
    title: "Install the CLI",
    summary: "Get the leafpack command on your machine in under a minute.",
    tags: ["cli"],
    updated: "2026-09-12",
    blocks: [
      { type: "h2", id: "install", text: "Install" },
      code("bash", "pipx install leafpack\nleafpack --version"),
      { type: "h2", id: "verify", text: "Check it works" },
      code("bash", "leafpack search memory"),
      { type: "p", html: "You should see a list of memory plugins with their versions and download counts." },
    ],
  },
  {
    id: "publishing",
    group: "Guides",
    title: "Publishing a plugin",
    summary: "Package a plugin, describe its permissions and publish the first version to the registry.",
    tags: ["publishing", "manifest", "cli"],
    updated: "2026-11-08",
    blocks: [
      { type: "p", html: "<strong>Problem:</strong> you have a working plugin in a local folder and want other people to install it with one command." },
      { type: "p", html: "<strong>End state:</strong> <code>leafpack add your-plugin</code> works for anyone, and its page in the catalog shows your readme, versions and permissions." },
      { type: "p", html: "<strong>Prerequisites:</strong> the <code>leafpack</code> CLI 0.14 or newer, a Leafpack account, and a plugin that loads with <code>leafpack dev</code>." },

      { type: "h2", id: "step-1", text: "Step 1: Write the manifest" },
      { type: "p", html: "Goal: describe the plugin so the registry knows what it is and what it may touch. Create <code>leafpack.toml</code> at the root of the plugin folder." },
      code(
        "toml",
        `
[plugin]
name = "git-tools"
version = "0.4.2"
description = "Structured git status, diff, log and commit tools."
category = "tools"
license = "MIT"
entry = "git_tools:plugin"

[permissions]
process = ["git"]
fs-write = ["$REPO/.git"]
`,
      ),
      { type: "p", html: "Every field is listed in the table below. Unknown fields are rejected, so a typo fails early instead of being ignored." },
      {
        type: "table",
        head: ["Field", "Required", "What it does"],
        rows: [
          ["<code>name</code>", "yes", "Lowercase, digits and dashes. Becomes the install name and the URL. Cannot change after the first publish."],
          ["<code>version</code>", "yes", "Semantic version. Each publish must be higher than the last."],
          ["<code>description</code>", "yes", "One sentence, shown on cards. 140 characters at most."],
          ["<code>category</code>", "yes", "One of <code>tools</code>, <code>memory</code>, <code>channels</code>, <code>models</code>, <code>observability</code>, <code>sandbox</code>."],
          ["<code>license</code>", "no", "An SPDX identifier. Shown as “—” when missing."],
          ["<code>entry</code>", "yes", "<code>module:attribute</code> that returns the plugin object."],
        ],
      },
      { type: "p", html: "Verify: <code>leafpack check</code> prints <code>manifest ok</code>." },

      { type: "h2", id: "step-2", text: "Step 2: Declare permissions" },
      { type: "p", html: "Goal: list everything the plugin can reach, as narrowly as you can. Users see this list before they install, and the runtime blocks anything that isn't on it." },
      {
        type: "callout",
        tone: "warning",
        title: "Undeclared access fails at runtime, not at publish",
        html: "The registry cannot tell what your code does. If a tool opens a host that is not in <code>network</code>, the call fails on the user's machine with <code>PermissionDenied: network api.example.com</code>. Run your test suite under <code>leafpack dev --enforce</code> before publishing.",
      },
      { type: "h3", id: "scopes", text: "Narrow scopes" },
      { type: "ul", items: ["Prefer exact hosts (<code>api.github.com</code>) over wildcards. A <code>*</code> host is shown as <strong>broad</strong> on your plugin page.", "Use <code>$AGENT</code> and <code>$REPO</code> instead of absolute paths.", "Name environment variables one by one; there is no wildcard for <code>env</code>."] },

      { type: "h2", id: "step-3", text: "Step 3: Publish" },
      { type: "p", html: "Goal: upload the first version." },
      code("bash", "leafpack login\nleafpack publish --dry-run   # shows exactly what will be uploaded\nleafpack publish"),
      {
        type: "callout",
        tone: "tip",
        title: "Get the verified badge",
        html: 'Publish from a CI job with a signed tag (<code>leafpack publish --provenance</code>). Plugins whose releases all carry provenance are marked <strong>verified</strong> after a short review.',
      },
      { type: "p", html: "Verify: open <code>https://leafpack.dev/plugin/&lt;name&gt;</code>. The page shows your readme and the version you just published." },

      { type: "h2", id: "updating", text: "Publishing updates" },
      { type: "p", html: "Bump <code>version</code> and run <code>leafpack publish</code> again. To withdraw a broken release, run <code>leafpack yank 0.4.1</code>: existing installs keep working, new installs skip it." },
      {
        type: "callout",
        tone: "note",
        title: "Deprecating a plugin",
        html: "Run <code>leafpack deprecate --replacement other-plugin</code>. The plugin stays installable, and its page points people to the replacement.",
      },
    ],
  },
  {
    id: "permissions",
    group: "Concepts",
    title: "How permissions work",
    summary: "What a plugin can reach, how users approve it, and how the runtime enforces it.",
    tags: ["security"],
    updated: "2026-10-02",
    blocks: [
      { type: "p", html: "Permissions are declared in the manifest, shown before install, and enforced by the agent runtime on every call." },
      { type: "h2", id: "kinds", text: "Kinds" },
      {
        type: "table",
        head: ["Kind", "Scope example", "Shown as broad when"],
        rows: [
          ["<code>network</code>", "<code>api.github.com</code>", "a host is <code>*</code>"],
          ["<code>fs-read</code> / <code>fs-write</code>", "<code>$AGENT/cache</code>", "a path is outside the agent or repository"],
          ["<code>shell</code>", "any command", "always"],
          ["<code>env</code>", "<code>GITHUB_TOKEN</code>", "never (variables are always named)"],
          ["<code>process</code>", "<code>git</code>", "an executable is <code>*</code>"],
        ],
      },
    ],
  },
  {
    id: "manifest",
    group: "Reference",
    title: "Manifest reference",
    summary: "Every field in leafpack.toml.",
    tags: ["manifest"],
    updated: "2026-11-08",
    blocks: [
      { type: "p", html: 'The field table lives in <a href="#/docs/publishing">Publishing a plugin</a> for now. This page will list the full schema, including <code>[dependencies]</code> and <code>[config]</code>.' },
      { type: "callout", tone: "note", title: "Work in progress", html: "This reference is being written. The CLI's <code>leafpack check --explain</code> prints the schema meanwhile." },
    ],
  },
]

export const docById = Object.fromEntries(docs.map((d) => [d.id, d]))
