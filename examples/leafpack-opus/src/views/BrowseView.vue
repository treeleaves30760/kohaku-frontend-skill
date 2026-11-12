<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import PluginCard from "../components/PluginCard.vue"
import SkeletonCard from "../components/SkeletonCard.vue"
import ErrorCard from "../components/ErrorCard.vue"
import { categories, categoryById } from "../data/categories.js"
import { listPlugins, simOpts } from "../lib/api.js"

const route = useRoute()
const router = useRouter()

const SORTS = [
  { id: "popular", label: "Most popular" },
  { id: "updated", label: "Recently updated" },
  { id: "name", label: "Name" },
]

// ── data: error → loading → empty → content ──
const plugins = ref([])
const loading = ref(true)
const error = ref("")
const loadedAt = ref(null)
let ctrl = null

async function load() {
  ctrl?.abort()
  ctrl = new AbortController()
  loading.value = true
  error.value = ""
  try {
    plugins.value = await listPlugins({ ...simOpts(route.query), signal: ctrl.signal })
    loadedAt.value = new Date()
  } catch (e) {
    if (e.name !== "AbortError") error.value = e.message
  } finally {
    loading.value = false
  }
}
// Reload only when the simulation params change (a string key: an array
// getter would fire on every filter change and blank the count to "Refreshing…").
watch(() => `${route.query.fail}|${route.query.delay}`, load, { immediate: true })
onBeforeUnmount(() => ctrl?.abort())

// The simulated failure applies to the load it was linked with; Retry drops it.
function retry() {
  if (route.query.fail) router.replace({ query: { ...route.query, fail: undefined } })
  else load()
}

// ── filters live in the URL: ?q=&cat=&tag=&sort= ──
const q = ref(String(route.query.q || ""))
const cat = computed(() => (categoryById[route.query.cat] ? route.query.cat : ""))
const tag = computed(() => String(route.query.tag || ""))
const sort = computed(() => (SORTS.some((s) => s.id === route.query.sort) ? route.query.sort : "popular"))

const setQuery = (patch) => router.replace({ query: { ...route.query, ...patch } })
let qTimer = null
watch(q, (v) => {
  clearTimeout(qTimer)
  qTimer = setTimeout(() => setQuery({ q: v.trim() || undefined }), 200)
})
watch(
  () => route.query.q,
  (v) => {
    if ((v || "") !== q.value.trim()) q.value = String(v || "")
  },
)

const results = computed(() => {
  const needle = String(route.query.q || "").toLowerCase()
  const list = plugins.value.filter(
    (p) =>
      (!cat.value || p.category === cat.value) &&
      (!tag.value || p.tags.includes(tag.value)) &&
      (!needle || [p.name, p.description, p.publisher, ...p.tags].some((s) => s.toLowerCase().includes(needle))),
  )
  const by = {
    popular: (a, b) => b.downloads - a.downloads,
    updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    name: (a, b) => a.name.localeCompare(b.name),
  }[sort.value]
  return list.sort(by)
})
const filtered = computed(() => !!(route.query.q || cat.value || tag.value))
const scopeText = computed(() => {
  const parts = []
  if (cat.value) parts.push(`in ${categoryById[cat.value].label}`)
  if (tag.value) parts.push(`tagged ${tag.value}`)
  return parts.join(" ")
})

function clearFilters() {
  q.value = ""
  router.replace({ query: { sort: route.query.sort } })
}

// ── search focus: ?focus=1 (from Ctrl+K elsewhere) ──
const searchEl = ref(null)
onMounted(async () => {
  if (route.query.focus === "1") {
    await nextTick()
    searchEl.value?.focus()
    setQuery({ focus: undefined })
  }
})
const updatedLabel = computed(() =>
  loadedAt.value ? loadedAt.value.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "—",
)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 flex flex-col gap-4">
    <header>
      <h1 class="kt-text-h1 font-bold tracking-tight text-warm-900 dark:text-warm-50">Browse plugins</h1>
      <p class="mt-1 kt-text-body text-warm-600 dark:text-warm-400">
        Tools, memory, channels and more for your agents. Built something?
        <RouterLink :to="{ name: 'docs', params: { page: 'publishing' } }" class="text-iolite dark:text-iolite-light underline underline-offset-3">Share your own</RouterLink>.
      </p>
    </header>

    <!-- Filter bar: sticky from md only; on phones a pinned stacked bar eats the viewport. -->
    <section class="card p-3 flex flex-col gap-3 md:sticky md:top-13 z-20" aria-label="Filters">
      <div class="flex flex-col sm:flex-row gap-2">
        <div class="relative flex-1 min-w-0">
          <label for="browse-search" class="sr-only">Search plugins</label>
          <span class="i-carbon-search absolute left-2.5 top-1/2 -translate-y-1/2 text-warm-500 pointer-events-none" aria-hidden="true" />
          <input
            id="browse-search"
            ref="searchEl"
            v-model="q"
            data-search
            type="search"
            enterkeyhint="search"
            class="input-field lp-input !pl-8"
            :placeholder="plugins.length ? `Search ${plugins.length} plugins…` : 'Search plugins…'"
            @keydown.esc="q = ''"
          />
        </div>
        <div class="flex items-center gap-2">
          <label for="browse-sort" class="kt-text-caption text-warm-600 dark:text-warm-400 shrink-0">Sort</label>
          <select
            id="browse-sort"
            :value="sort"
            class="input-field lp-input !w-auto flex-1 sm:flex-none pr-7"
            @change="setQuery({ sort: $event.target.value === 'popular' ? undefined : $event.target.value })"
          >
            <option v-for="s in SORTS" :key="s.id" :value="s.id">{{ s.label }}</option>
          </select>
          <button type="button" class="btn-icon" title="Reload the plugin index" aria-label="Reload the plugin index" :disabled="loading" @click="load">
            <span :class="loading && plugins.length ? 'i-carbon-circle-dash animate-spin' : 'i-carbon-renew'" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div class="flex gap-1.5 overflow-x-auto scrollbar-none -mx-3 px-3 sm:flex-wrap sm:overflow-visible" role="group" aria-label="Category">
        <button
          type="button"
          class="touch-target shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-full kt-text-caption border border-solid transition-colors"
          :class="!cat ? 'border-iolite/35 bg-iolite/10 text-iolite dark:text-iolite-light font-medium' : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-300 hover:border-iolite/40'"
          :aria-pressed="!cat"
          @click="setQuery({ cat: undefined })"
        >
          All
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          type="button"
          class="touch-target shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-full kt-text-caption border border-solid transition-colors"
          :class="cat === c.id ? 'border-iolite/35 bg-iolite/10 text-iolite dark:text-iolite-light font-medium' : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-300 hover:border-iolite/40'"
          :aria-pressed="cat === c.id"
          @click="setQuery({ cat: cat === c.id ? undefined : c.id })"
        >
          <span :class="c.icon" aria-hidden="true" />{{ c.label }}
        </button>
      </div>
      <div v-if="tag" class="flex items-center gap-2 kt-text-caption text-warm-600 dark:text-warm-400">
        Tag
        <button type="button" class="chip-iolite touch-target" :title="`Remove the ${tag} tag filter`" @click="setQuery({ tag: undefined })">
          {{ tag }} <span class="i-carbon-close" aria-hidden="true" /><span class="sr-only">remove</span>
        </button>
      </div>
    </section>

    <!-- Result line: count + freshness. Refresh keeps the grid on screen. -->
    <div class="flex flex-wrap items-center gap-x-2 text-xs text-warm-600 dark:text-warm-400 empty:hidden" role="status" aria-live="polite">
      <template v-if="error && !plugins.length" />
      <template v-else-if="loading && !plugins.length">Loading plugins…</template>
      <template v-else>
        <span>
          Showing <b class="num font-semibold text-warm-800 dark:text-warm-200">{{ results.length }}</b> of
          <span class="num">{{ plugins.length }}</span> plugins
          <template v-if="scopeText">{{ " " + scopeText }}</template>
        </span>
        <span aria-hidden="true">·</span>
        <span>{{ loading ? "Refreshing…" : `Index loaded ${updatedLabel}` }}</span>
      </template>
    </div>

    <ErrorCard
      v-if="error && !plugins.length"
      title="Could not load the plugin index"
      :message="error"
      hint="The registry did not answer. Your filters are kept; try again in a moment."
      @retry="retry"
    />
    <div v-else-if="error" role="alert" class="kt-banner">
      <span class="i-carbon-warning-alt text-coral shrink-0 mt-0.5" aria-hidden="true" />
      <span class="flex-1">Refresh failed: <span class="font-mono text-xs">{{ error }}</span>. Showing the plugins loaded earlier.</span>
      <button type="button" class="btn-ghost shrink-0" @click="retry">Retry</button>
    </div>

    <div v-if="!error && loading && !plugins.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
      <SkeletonCard v-for="i in 6" :key="i" />
    </div>
    <div v-else-if="plugins.length && !results.length" class="card py-12 px-6 flex flex-col items-center text-center gap-2">
      <span class="i-carbon-search text-[40px] text-warm-400 opacity-60" aria-hidden="true" />
      <p class="kt-text-emphasis font-semibold text-warm-800 dark:text-warm-100">No matches</p>
      <p class="kt-text-body text-warm-600 dark:text-warm-400 max-w-[46ch]">
        No plugins match
        <template v-if="route.query.q">“<span class="font-medium text-warm-800 dark:text-warm-200">{{ route.query.q }}</span>”</template>
        <template v-else>these filters</template>
        <template v-if="scopeText">{{ " " + scopeText }}</template>.
        <template v-if="cat && route.query.q"> Try searching every category.</template>
      </p>
      <div class="flex gap-2 mt-2 flex-wrap justify-center">
        <button v-if="cat && route.query.q" type="button" class="btn-secondary" @click="setQuery({ cat: undefined })">Search all categories</button>
        <button type="button" class="btn-primary" @click="clearFilters">Clear filters</button>
      </div>
    </div>
    <div v-else-if="!error && !plugins.length && !loading" class="card py-12 px-6 text-center kt-text-body text-warm-600 dark:text-warm-400">
      No plugins have been published yet.
      <RouterLink :to="{ name: 'docs', params: { page: 'publishing' } }" class="text-iolite dark:text-iolite-light underline">Publish the first one</RouterLink>.
    </div>
    <ul v-else-if="results.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <li v-for="p in results" :key="p.id" class="flex">
        <PluginCard class="flex-1" :plugin="p" @tag="(t) => setQuery({ tag: t })" />
      </li>
    </ul>
    <p v-if="filtered && results.length" class="text-xs text-warm-600 dark:text-warm-400">
      <button type="button" class="underline underline-offset-3 hover:text-iolite dark:hover:text-iolite-light" @click="clearFilters">Clear filters</button>
      to see all <span class="num">{{ plugins.length }}</span> plugins.
    </p>
  </div>
</template>
