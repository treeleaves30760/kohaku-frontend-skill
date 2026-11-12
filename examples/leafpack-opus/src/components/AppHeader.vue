<script setup>
import { useRoute } from "vue-router"
import BrandMark from "./BrandMark.vue"
import ThemeButton from "./ThemeButton.vue"
import { navItems, isActive } from "./nav.js"

defineEmits(["open-menu"])
const route = useRoute()
const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
</script>

<template>
  <!-- Same background as the page, bottom hairline, no elevation. -->
  <header class="sticky top-0 z-30 h-11 max-md:h-12 bg-[var(--color-bg)] border-b border-solid border-[var(--v2-line)]">
    <div class="max-w-[1600px] mx-auto h-full px-2 sm:px-5 flex items-center gap-1 sm:gap-3">
      <button type="button" class="md:hidden btn-icon !w-10 !h-10" aria-label="Open menu" title="Open menu" @click="$emit('open-menu')">
        <span class="i-carbon-menu" aria-hidden="true" />
      </button>
      <RouterLink :to="{ name: 'home' }" class="rounded-lg px-1" aria-label="Leafpack home">
        <BrandMark />
      </RouterLink>
      <nav class="hidden md:flex items-center gap-1 ml-3" aria-label="Main">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="px-2.5 py-1 rounded-md kt-text-caption font-medium transition-colors"
          :class="
            isActive(item, route.name)
              ? 'bg-iolite/10 text-iolite dark:text-iolite-light'
              : 'text-warm-600 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200 hover:bg-warm-200/60 dark:hover:bg-warm-700/40'
          "
          :aria-current="isActive(item, route.name) ? 'page' : undefined"
          >{{ item.label }}</RouterLink
        >
      </nav>
      <div class="flex-1" />
      <RouterLink
        v-if="route.name !== 'browse' && route.name !== 'home'"
        :to="{ name: 'browse', query: { focus: '1' } }"
        class="hidden md:inline-flex items-center gap-2 h-7 pl-2 pr-1 rounded-lg border border-solid border-[var(--v2-line-strong)] bg-[var(--v2-card)] kt-text-caption text-warm-500 hover:border-iolite/50 transition-colors"
        title="Search plugins (Ctrl+K)"
      >
        <span class="i-carbon-search" aria-hidden="true" />
        <span class="pr-4">Search plugins…</span>
        <kbd class="px-1.5 py-0.5 rounded bg-warm-100 dark:bg-warm-800 border border-solid border-warm-200 dark:border-warm-700 font-mono kt-text-micro leading-none">{{ isMac ? "⌘" : "Ctrl" }} K</kbd>
      </RouterLink>
      <ThemeButton />
    </div>
  </header>
</template>
