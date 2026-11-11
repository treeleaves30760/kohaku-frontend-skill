// Kohaku Tailwind preset (Tailwind v3 `presets: [require(...)]`, or import in v4
// via `@config`). For Tailwind v4 CSS-first projects, use tokens.css + an @theme
// block mapping the same names instead.
//
// Replaces the default palette entirely so stock hues (blue-500, gray-100, slate-*)
// cannot be used by accident. Only gems (light/DEFAULT/shadow) and warm 50-950.

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff",
      black: "#000000",
      sapphire: { light: "#D6E3F8", DEFAULT: "#0F52BA", shadow: "#082567" },
      aquamarine: { light: "#D4EDE8", DEFAULT: "#4C9989", shadow: "#1B6B5A" },
      taaffeite: { light: "#E8D5ED", DEFAULT: "#A57EAE", shadow: "#6B4670" },
      iolite: { light: "#DDD0F0", DEFAULT: "#5A4FCF", shadow: "#312A7A" },
      amber: { light: "#F5E6C8", DEFAULT: "#D4920A", shadow: "#8B5E00" },
      coral: { light: "#F5D5D5", DEFAULT: "#D46B6B", shadow: "#8B3A3A" },
      sage: { light: "#D5E8DA", DEFAULT: "#5A9E6F", shadow: "#3A6B48" },
      warm: {
        50: "#F7F5F2", 100: "#EFECE7", 200: "#E0DBD4", 300: "#C5BFB7", 400: "#A09A92",
        500: "#8A8480", 600: "#6A645F", 700: "#4A4540", 800: "#3A3632", 900: "#2A2724",
        950: "#1A1816",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Noto Sans TC", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "Consolas", "monospace"],
      },
      fontSize: {
        // Semantic tiers (backed by CSS vars from tokens.css so touch/reading retunes apply).
        "kt-micro": "var(--kt-fs-micro)",
        "kt-caption": "var(--kt-fs-caption)",
        "kt-body": "var(--kt-fs-body)",
        "kt-emphasis": "var(--kt-fs-emphasis)",
        "kt-title": "var(--kt-fs-title)",
        "kt-h2": "var(--kt-fs-h2)",
        "kt-h1": "var(--kt-fs-h1)",
      },
      backgroundColor: {
        "v2-rail": "var(--v2-rail)",
        "v2-chrome": "var(--v2-chrome)",
        "v2-canvas": "var(--v2-canvas)",
        "v2-panel": "var(--v2-panel)",
        "v2-card": "var(--v2-card)",
        "v2-float": "var(--v2-float)",
      },
      borderColor: {
        "v2-line": "var(--v2-line)",
        "v2-edge": "var(--v2-line-strong)",
      },
      transitionDuration: { DEFAULT: "150ms" },
    },
  },
}
