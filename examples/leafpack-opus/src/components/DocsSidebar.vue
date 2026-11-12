<script setup>
// Docs page tree: collapsible groups (open state persisted, the current page's
// group always opens), sticky search with flat results.
import { computed, ref, useId, watch } from "vue"
import { docs, docGroups } from "../data/docs.js"

const props = defineProps({ current: { type: String, required: true } })
const KEY = "leafpack.docs.groups"
const searchId = useId() // the sidebar can be mounted twice (column + phone drawer)
const q = ref("")

function readOpen() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}
const open = ref(readOpen())
const currentGroup = computed(() => docs.find((d) => d.id === props.current)?.group)
watch(currentGroup, (g) => g && (open.value[g] = true), { immediate: true })
watch(
  open,
  (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
    } catch {}
  },
  { deep: true },
)

const groups = computed(() => docGroups.map((g) => ({ name: g, pages: docs.filter((d) => d.group === g) })))
const results = computed(() => {
  const n = q.value.trim().toLowerCase()
  if (!n) return null
  return docs.filter((d) => [d.title, d.summary, ...d.tags].some((s) => s.toLowerCase().includes(n)))
})
const linkClass = (id) =>
  id === props.current
    ? "bg-iolite/14 text-iolite dark:text-iolite-light font-medium"
    : "text-warm-700 dark:text-warm-300 hover:bg-[var(--v2-hover)] hover:text-warm-900 dark:hover:text-warm-100"
</script>

<template>
  <div class="flex flex-col bg-inherit">
    <div class="sticky top-0 z-1 p-3 bg-inherit">
      <label :for="searchId" class="sr-only">Search pages</label>
      <div class="relative">
        <span class="i-carbon-search absolute left-2.5 top-1/2 -translate-y-1/2 text-warm-500 pointer-events-none" aria-hidden="true" />
        <input :id="searchId" v-model="q" type="search" class="input-field lp-input !pl-8" placeholder="Search pages…" @keydown.esc="q = ''" />
      </div>
    </div>

    <nav class="px-3 pb-6" aria-label="Docs pages">
      <template v-if="results">
        <p v-if="!results.length" class="px-2 py-3 kt-text-caption text-warm-600 dark:text-warm-400">No pages match “{{ q }}”.</p>
        <RouterLink
          v-for="d in results"
          :key="d.id"
          :to="{ name: 'docs', params: { page: d.id } }"
          class="block px-2.5 py-2 rounded-lg transition-colors"
          :class="linkClass(d.id)"
          :aria-current="d.id === current ? 'page' : undefined"
        >
          <span class="block section-title">{{ d.group }}</span>
          <span class="block kt-text-body">{{ d.title }}</span>
        </RouterLink>
      </template>

      <div v-for="g in groups" v-else :key="g.name" class="mt-1">
        <button
          type="button"
          class="w-full flex items-center gap-1.5 h-8 px-2 rounded-lg kt-text-caption font-semibold text-warm-800 dark:text-warm-200 hover:bg-[var(--v2-hover)] max-lg:min-h-11"
          :aria-expanded="!!open[g.name]"
          @click="open[g.name] = !open[g.name]"
        >
          <span class="i-carbon-chevron-right text-warm-500 transition-transform duration-150" :class="open[g.name] ? 'rotate-90' : ''" aria-hidden="true" />
          {{ g.name }}
          <span class="ml-auto num text-[11px] font-normal text-warm-500">{{ g.pages.length }}</span>
        </button>
        <ul v-show="open[g.name]" class="ml-4 pl-2 border-l border-solid border-[var(--v2-line-strong)] flex flex-col gap-0.5 py-1">
          <li v-for="d in g.pages" :key="d.id">
            <RouterLink
              :to="{ name: 'docs', params: { page: d.id } }"
              class="block px-2.5 py-1.5 rounded-lg kt-text-body transition-colors max-lg:min-h-11 max-lg:flex max-lg:items-center"
              :class="linkClass(d.id)"
              :aria-current="d.id === current ? 'page' : undefined"
              >{{ d.title }}</RouterLink
            >
          </li>
        </ul>
      </div>
    </nav>
  </div>
</template>
