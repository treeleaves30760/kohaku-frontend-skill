// Plugin categories: the one ordered list that the home tiles, the browse
// chips and the card tiles all read. Class strings are literal so UnoCSS can
// see them (a runtime "from-" + gem would be purged).
// Tiles are the one place gradients are allowed (marketplace category tiles),
// and they use non-status gems only.
export const categories = [
  {
    id: "tools",
    label: "Tools",
    blurb: "Let agents act: fetch pages, run commands, work with git.",
    icon: "i-carbon-tools",
    tile: "bg-gradient-to-br from-iolite to-sapphire",
  },
  {
    id: "memory",
    label: "Memory",
    blurb: "Long-term recall backed by SQLite or a vector index.",
    icon: "i-carbon-data-base",
    tile: "bg-gradient-to-br from-taaffeite to-iolite",
  },
  {
    id: "channels",
    label: "Channels",
    blurb: "Talk to agents from Discord, Slack and other chat apps.",
    icon: "i-carbon-chat",
    tile: "bg-gradient-to-br from-aquamarine to-sapphire",
  },
  {
    id: "models",
    label: "Model providers",
    blurb: "Route turns to hosted APIs or a model on your own machine.",
    icon: "i-carbon-machine-learning-model",
    tile: "bg-gradient-to-br from-sapphire to-iolite",
  },
  {
    id: "observability",
    label: "Observability",
    blurb: "Traces, token counts and cost for every run.",
    icon: "i-carbon-activity",
    tile: "bg-gradient-to-br from-aquamarine to-iolite",
  },
  {
    id: "sandbox",
    label: "Sandboxes",
    blurb: "Run untrusted tool code in a container or WebAssembly.",
    icon: "i-carbon-security",
    tile: "bg-gradient-to-br from-taaffeite to-sapphire",
  },
]

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))
