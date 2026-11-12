<script setup>
import { onMounted, onBeforeUnmount, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import { themePref, cycleTheme, nextTheme } from "./lib/theme.js"

const route = useRoute()
const router = useRouter()

const nav = [
  { name: "home", label: "Home", icon: "i-carbon-home", to: "/" },
  { name: "browse", label: "Browse", icon: "i-carbon-search", to: "/browse" },
  { name: "docs", label: "Docs", icon: "i-carbon-book", to: "/docs" },
]
const themeIcon = { system: "i-carbon-laptop", light: "i-carbon-sun", dark: "i-carbon-moon" }
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
const active = (n) => route.name === n.name || (n.name === "browse" && route.name === "plugin")

// Ctrl/Cmd+K focuses the search box (until there is a palette). It wins inside inputs too.
async function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault()
    let el = document.querySelector("[data-search]")
    if (!el) {
      await router.push({ name: "browse" })
      await nextTick()
      el = document.querySelector("[data-search]")
    }
    el?.focus()
    el?.select?.()
  }
}
onMounted(() => window.addEventListener("keydown", onKey))
onBeforeUnmount(() => window.removeEventListener("keydown", onKey))
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn-primary" @click.prevent="$refs.main?.focus()">Skip to content</a>

    <header class="sticky top-0 z-30 h-12 md:h-11 border-0 border-b border-solid border-[var(--v2-line)] bg-[var(--v2-canvas)]">
      <div class="h-full max-w-[1600px] mx-auto px-3 md:px-5 flex items-center gap-3">
        <RouterLink to="/" class="flex items-center gap-2 shrink-0" aria-label="Leafpack home">
          <span class="w-7 h-7 rounded-full bg-iolite text-white flex items-center justify-center" aria-hidden="true">
            <span class="i-carbon-package" />
          </span>
          <span class="text-sm font-semibold">Leafpack</span>
        </RouterLink>

        <nav class="hidden md:flex items-center gap-1 ml-2" aria-label="Main">
          <RouterLink
            v-for="n in nav"
            :key="n.name"
            :to="n.to"
            class="px-2.5 py-1 rounded kt-text-caption font-medium transition-colors"
            :class="active(n) ? 'bg-iolite/10 text-iolite dark:text-iolite-light' : 'muted hover:bg-[var(--v2-hover)]'"
            :aria-current="active(n) ? 'page' : undefined"
          >{{ n.label }}</RouterLink>
        </nav>

        <div class="flex-1" />

        <RouterLink
          to="/browse"
          class="hidden md:inline-flex items-center gap-2 h-7 px-2 rounded-lg border border-solid border-[var(--v2-line-strong)] muted kt-text-caption hover:border-iolite/50 transition-colors"
          title="Search plugins"
        >
          <span class="i-carbon-search" aria-hidden="true" />
          <span>Search plugins…</span>
          <kbd class="px-1.5 py-0.5 rounded bg-warm-100 dark:bg-warm-800 border border-solid border-[var(--v2-line)] font-mono kt-text-caption">{{ isMac ? "⌘" : "Ctrl" }} K</kbd>
        </RouterLink>

        <button
          type="button"
          class="btn-icon !w-10 !h-10 md:!w-7 md:!h-7"
          :aria-label="`Theme: ${themePref}. Switch to ${nextTheme()}.`"
          :title="`Theme: ${themePref}. Select to switch to ${nextTheme()}.`"
          @click="cycleTheme"
        >
          <span :class="themeIcon[themePref]" aria-hidden="true" />
        </button>
      </div>
    </header>

    <main id="main" ref="main" tabindex="-1" class="flex-1 min-w-0 outline-none">
      <RouterView :key="route.name === 'docs' ? 'docs' : route.path" />
    </main>

    <footer class="hidden md:block border-0 border-t border-solid border-[var(--v2-line)] bg-warm-50/50 dark:bg-warm-950/30">
      <div class="max-w-[1600px] mx-auto px-5 py-4 flex items-center gap-3 text-xs muted">
        <span class="w-5 h-5 rounded-full bg-iolite text-white flex items-center justify-center kt-text-caption" aria-hidden="true"><span class="i-carbon-package" /></span>
        <span class="font-medium ink">Leafpack</span>
        <span>The plugin registry for Leaf agents. Demo data only.</span>
        <span class="flex-1" />
        <RouterLink to="/docs" class="hover:text-iolite dark:hover:text-iolite-light">Publish a plugin</RouterLink>
        <RouterLink to="/browse" class="hover:text-iolite dark:hover:text-iolite-light">Browse</RouterLink>
      </div>
    </footer>

    <nav
      class="md:hidden fixed bottom-0 inset-x-0 z-30 flex border-0 border-t border-solid border-[var(--v2-line-strong)] bg-[var(--v2-chrome)] safe-bottom"
      aria-label="Main"
    >
      <RouterLink
        v-for="n in nav"
        :key="n.name"
        :to="n.to"
        class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-14 active:bg-warm-200/60 dark:active:bg-warm-700/40"
        :class="active(n) ? 'text-iolite dark:text-iolite-light' : 'muted'"
        :aria-current="active(n) ? 'page' : undefined"
      >
        <span :class="n.icon" class="text-lg" aria-hidden="true" />
        <span class="kt-text-caption">{{ n.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
