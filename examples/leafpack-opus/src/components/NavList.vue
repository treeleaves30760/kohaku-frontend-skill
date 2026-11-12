<script setup>
import { useRoute } from "vue-router"
import { navItems, isActive } from "./nav.js"
import { categories } from "../data/categories.js"
import { themePref } from "../lib/theme.js"

const route = useRoute()
const themes = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
]
</script>

<template>
  <nav class="p-2 flex flex-col gap-0.5" aria-label="Main">
    <RouterLink
      v-for="item in navItems"
      :key="item.name"
      :to="item.to"
      class="flex items-center gap-3 min-h-12 px-3 rounded-lg kt-text-body active:bg-warm-200/60 dark:active:bg-warm-700/40"
      :class="isActive(item, route.name) ? 'bg-iolite/10 text-iolite dark:text-iolite-light font-medium' : 'text-warm-700 dark:text-warm-200'"
      :aria-current="isActive(item, route.name) ? 'page' : undefined"
    >
      <span :class="item.icon" aria-hidden="true" />
      {{ item.label }}
    </RouterLink>
  </nav>
  <div class="px-5 pt-3 pb-1 section-title">Categories</div>
  <div class="px-2 flex flex-col gap-0.5">
    <RouterLink
      v-for="c in categories"
      :key="c.id"
      :to="{ name: 'browse', query: { cat: c.id } }"
      class="flex items-center gap-3 min-h-11 px-3 rounded-lg kt-text-body text-warm-700 dark:text-warm-200 active:bg-warm-200/60 dark:active:bg-warm-700/40"
    >
      <span :class="c.icon" class="text-warm-500" aria-hidden="true" />
      {{ c.label }}
    </RouterLink>
  </div>
  <div class="px-5 pt-5 pb-2 section-title">Theme</div>
  <div class="px-4 pb-4">
    <div class="seg-track w-full" role="radiogroup" aria-label="Theme">
      <button
        v-for="t in themes"
        :key="t.id"
        type="button"
        role="radio"
        :aria-checked="themePref === t.id"
        class="flex-1 !h-9"
        :class="themePref === t.id ? 'seg-btn-on' : 'seg-btn'"
        @click="themePref = t.id"
      >
        {{ t.label }}
      </button>
    </div>
  </div>
</template>
