// Kohaku UnoCSS config (Vue 3 + UnoCSS, Carbon icons).
// The gem palette: warm surfaces, gem accents, iolite for focus; sage, amber and
// coral are status colours only. Do not add hues, gem shades, or a size scale here.
import {
  defineConfig,
  presetWind3,
  presetAttributify,
  presetIcons,
  transformerDirectives,
} from "unocss"

const gems = {
  sapphire: { light: "#D6E3F8", DEFAULT: "#0F52BA", shadow: "#082567" },
  aquamarine: { light: "#D4EDE8", DEFAULT: "#4C9989", shadow: "#1B6B5A" },
  taaffeite: { light: "#E8D5ED", DEFAULT: "#A57EAE", shadow: "#6B4670" },
  iolite: { light: "#DDD0F0", DEFAULT: "#5A4FCF", shadow: "#312A7A" },
  amber: { light: "#F5E6C8", DEFAULT: "#D4920A", shadow: "#8B5E00" },
  coral: { light: "#F5D5D5", DEFAULT: "#D46B6B", shadow: "#8B3A3A" },
  sage: { light: "#D5E8DA", DEFAULT: "#5A9E6F", shadow: "#3A6B48" },
}
const warm = {
  50: "#F7F5F2", 100: "#EFECE7", 200: "#E0DBD4", 300: "#C5BFB7", 400: "#A09A92",
  500: "#8A8480", 600: "#6A645F", 700: "#4A4540", 800: "#3A3632", 900: "#2A2724",
  950: "#1A1816",
}

// chip-<gem>: 10% fill, 40% border, -shadow text in light, -light text in dark.
const chip = (g) =>
  `inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] leading-none border border-solid border-${g}/40 bg-${g}/10 text-${g}-shadow dark:text-${g}-light`

export default defineConfig({
  // Class names also live in .js modules (icon and tone tables), not only in
  // templates. Keep icon classes as literal strings there — never 'i-carbon-' + name.
  content: {
    pipeline: {
      include: [/\.(vue|svelte|[jt]sx?|mdx?|astro|html)($|\?)/],
    },
  },
  // presetWind3 resolves `dark:` against a .dark class on an ancestor (its
  // default), which is what tokens.css keys on (html.dark). UnoCSS ships no
  // reset: base.css is the reset, so do not add @unocss/reset.
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      extraProperties: { display: "inline-block", "vertical-align": "middle" },
    }),
  ],
  transformers: [transformerDirectives()],
  // Emit every theme colour as --kt-color-<name>[-shade] so hand-written CSS can
  // use var() and color-mix() without restating hex values.
  preflights: [
    {
      getCSS: ({ theme }) => {
        const out = []
        for (const [name, value] of Object.entries(theme.colors)) {
          if (!["sapphire", "aquamarine", "taaffeite", "iolite", "amber", "coral", "sage", "warm"].includes(name)) continue
          for (const [shade, hex] of Object.entries(value)) {
            out.push(`--kt-color-${name}${shade === "DEFAULT" ? "" : `-${shade}`}: ${hex};`)
          }
        }
        return `:root {\n  ${out.join("\n  ")}\n}`
      },
    },
  ],
  theme: {
    colors: { ...gems, warm },
    fontFamily: {
      sans: '"Inter", system-ui, -apple-system, "Segoe UI", "Noto Sans TC", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", ui-monospace, Consolas, monospace',
    },
  },
  rules: [
    // Semantic size tiers: pick by what the text does.
    [/^kt-text-(micro|caption|body|emphasis|title|h2|h1)$/, ([, t]) => ({ "font-size": `var(--kt-fs-${t})` })],
  ],
  shortcuts: {
    // ── buttons (dense app chrome: h-7/h-8) ──
    "btn-primary":
      "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-iolite text-white hover:bg-iolite-shadow text-sm font-medium border-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-iolite focus-visible:outline-offset-2",
    "btn-danger":
      "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-coral text-white hover:bg-coral-shadow text-sm font-medium border-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
    "btn-secondary":
      "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium border border-solid bg-[var(--v2-panel)] border-[var(--v2-line-strong)] text-warm-700 dark:text-warm-200 hover:border-iolite/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
    "btn-ghost":
      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-sm text-warm-600 dark:text-warm-300 hover:bg-warm-200/60 dark:hover:bg-warm-700/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
    "btn-icon":
      "inline-flex items-center justify-center w-7 h-7 rounded-lg text-warm-600 dark:text-warm-400 hover:bg-warm-200/60 hover:text-warm-800 dark:hover:bg-warm-700/40 dark:hover:text-warm-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",

    // ── chips & badges ──
    "chip-warm":
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] leading-none border border-solid border-warm-200 dark:border-warm-700 bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300",
    "chip-iolite": "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] leading-none border border-solid border-iolite/40 bg-iolite/10 text-iolite dark:text-iolite-light",
    "chip-aquamarine": chip("aquamarine"),
    "chip-aqua": chip("aquamarine"), // short alias
    "chip-sage": chip("sage"),
    "chip-amber": chip("amber"),
    "chip-coral": chip("coral"),
    "chip-sapphire": chip("sapphire"),
    "chip-taaffeite": chip("taaffeite"),
    // Solid-tint badge: shape only. Add the colour where you use it, e.g.
    // "gem-badge bg-sage-light text-sage-shadow dark:bg-sage-shadow/30 dark:text-sage-light".
    "gem-badge": "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",

    // ── surfaces ──
    card: "bg-white dark:bg-warm-900 rounded-xl border border-solid border-warm-200/60 dark:border-warm-700/60",
    "card-hover": "card hover:border-warm-300/80 dark:hover:border-warm-600/60 hover:shadow-sm transition-all cursor-pointer",
    "card-head": "flex items-center gap-2 h-10 px-4 border-b border-solid border-[var(--v2-line)]",
    "card-title": "text-sm font-semibold text-warm-800 dark:text-warm-100",

    // ── text ──
    "section-title": "text-[10px] uppercase tracking-wider font-medium text-warm-500",
    "text-body": "text-sm text-warm-800 dark:text-warm-200",
    "text-secondary": "text-sm text-warm-600 dark:text-warm-400",
    num: "font-mono tabular-nums",

    // ── controls ──
    "input-field":
      "w-full h-8 px-2.5 rounded-lg bg-white dark:bg-warm-900 border border-solid border-warm-300 dark:border-warm-700 text-sm text-warm-800 dark:text-warm-200 placeholder-warm-500 dark:placeholder-warm-600 focus:outline-none focus:border-iolite dark:focus:border-iolite-light transition-colors",
    "seg-track": "inline-flex p-0.5 gap-0.5 rounded-lg bg-warm-200/50 dark:bg-warm-800/70",
    "seg-btn": "px-2 h-6 rounded-md text-[11px] text-warm-600 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200 transition-colors",
    "seg-btn-on": "seg-btn !bg-[var(--v2-card)] !text-warm-800 dark:!text-warm-100 font-medium shadow-sm",

    // ── layout ──
    "container-page": "max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6",
  },
})
