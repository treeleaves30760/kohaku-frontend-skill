<script setup>
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { CATEGORIES, categoryById } from "../data/plugins.js"
import { usePluginList } from "../composables.js"
import SearchBox from "../components/SearchBox.vue"
import PluginCard from "../components/PluginCard.vue"
import LoadStates from "../components/LoadStates.vue"
import { fmtAgo, fmtDateTime } from "../lib/format.js"

const route = useRoute()
const router = useRouter()
const { plugins, loading, error, loadedAt, reload } = usePluginList()

const SORTS = [
  { id: "popular", label: "Most popular" },
  { id: "updated", label: "Recently updated" },
  { id: "name", label: "Name (A–Z)" },
]
const sort = computed(() => (SORTS.some((s) => s.id === route.query.sort) ? route.query.sort : "popular"))
const cat = computed(() => (categoryById[route.query.cat] ? String(route.query.cat) : ""))
// The input keeps its own copy so typing is never fought by the router; the URL follows.
const q = ref(String(route.query.q || ""))
watch(() => route.query.q, (v) => { if (String(v || "") !== q.value) q.value = String(v || "") })

function setQuery(patch) {
  const next = { ...route.query, ...patch }
  for (const k of Object.keys(next)) if (next[k] === "" || next[k] == null || (k === "sort" && next[k] === "popular")) delete next[k]
  router.replace({ query: next })
}
watch(q, (v) => setQuery({ q: v.trim() }))

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  let list = plugins.value.filter((p) => {
    if (cat.value && p.category !== cat.value) return false
    if (!term) return true
    const hay = [p.name, p.summary, p.publisher, categoryById[p.category].label, p.tags.join(" "), p.verified ? "verified" : "", p.deprecated ? "deprecated" : ""].join(" ").toLowerCase()
    return term.split(/\s+/).every((t) => hay.includes(t))
  })
  const by = {
    popular: (a, b) => b.downloads - a.downloads,
    updated: (a, b) => new Date(b.updated) - new Date(a.updated),
    name: (a, b) => a.name.localeCompare(b.name),
  }[sort.value]
  return [...list].sort(by)
})
const filtersOn = computed(() => !!(q.value.trim() || cat.value))
function clearFilters() {
  q.value = ""
  router.replace({ query: route.query.fail ? { fail: route.query.fail } : {} })
}
</script>

<template>
  <div class="max-w-[1100px] mx-auto px-3 md:px-5 py-4 md:py-6 flex flex-col gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Browse plugins</h1>
      <p class="text-sm muted mt-1">
        Tools, memory, models and channels for Leaf agents. Want yours here?
        <RouterLink to="/docs" class="accent-text underline underline-offset-2">Share your own</RouterLink>.
      </p>
    </div>

    <div class="kt-v2-card p-3 flex flex-col gap-3 md:sticky md:top-14 md:z-20">
      <div class="flex flex-col sm:flex-row gap-2">
        <SearchBox v-model="q" :placeholder="plugins.length ? `Search ${plugins.length} plugins…` : 'Search plugins…'" />
        <div class="flex gap-2 shrink-0">
          <label class="sr-only" for="sort">Sort by</label>
          <select
            id="sort"
            :value="sort"
            class="input-field !w-auto flex-1 sm:flex-none pr-7 !h-10 md:!h-8"
            @change="setQuery({ sort: $event.target.value })"
          >
            <option v-for="s in SORTS" :key="s.id" :value="s.id">{{ s.label }}</option>
          </select>
          <button
            type="button"
            class="btn-secondary !w-10 !h-10 md:!w-8 md:!h-8 !px-0"
            :disabled="loading"
            aria-label="Refresh registry"
            title="Refresh the plugin list"
            @click="reload"
          >
            <span :class="loading && plugins.length ? 'i-carbon-circle-dash animate-spin' : 'i-carbon-renew'" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div class="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1" role="group" aria-label="Category">
        <button
          type="button"
          class="shrink-0 inline-flex items-center h-9 md:h-7 px-3 rounded-full text-xs border border-solid transition-colors"
          :class="!cat ? 'border-iolite/40 bg-iolite/10 text-iolite dark:text-iolite-light font-medium' : 'border-[var(--v2-line)] bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:border-iolite/40'"
          :aria-pressed="!cat"
          @click="setQuery({ cat: '' })"
        >All</button>
        <button
          v-for="c in CATEGORIES"
          :key="c.id"
          type="button"
          class="shrink-0 inline-flex items-center gap-1.5 h-9 md:h-7 px-3 rounded-full text-xs border border-solid transition-colors"
          :class="cat === c.id ? 'border-iolite/40 bg-iolite/10 text-iolite dark:text-iolite-light font-medium' : 'border-[var(--v2-line)] bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:border-iolite/40'"
          :aria-pressed="cat === c.id"
          @click="setQuery({ cat: c.id })"
        ><span :class="c.icon" aria-hidden="true" />{{ c.label }}</button>
      </div>
    </div>

    <p v-if="plugins.length" class="text-xs muted" role="status" aria-live="polite">
      Showing <strong class="num ink">{{ filtered.length }}</strong> of <span class="num">{{ plugins.length }}</span> plugins
      <template v-if="cat"> in {{ categoryById[cat].label }}</template>
      <template v-if="q.trim()"> matching “{{ q.trim() }}”</template>
      · Index updated <span :title="fmtDateTime(loadedAt)">{{ fmtAgo(loadedAt) }}</span>
    </p>

    <LoadStates :error="error" :loading="loading" :count="filtered.length" :has-data="plugins.length > 0" @retry="reload">
      <template #skeleton>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          <div v-for="i in 6" :key="i" class="kt-v2-card p-4 flex flex-col gap-3" style="min-height: 9.5rem">
            <div class="flex gap-3"><div class="lp-skel w-10 h-10" /><div class="flex-1 flex flex-col gap-2"><div class="lp-skel h-4" style="width: 60%" /><div class="lp-skel h-3" style="width: 40%" /></div></div>
            <div class="lp-skel h-3" style="width: 100%" /><div class="lp-skel h-3" style="width: 80%" />
          </div>
        </div>
      </template>
      <template #empty>
        <div class="kt-v2-card py-10 px-4 text-center">
          <span class="i-carbon-search text-4xl muted opacity-60" aria-hidden="true" />
          <h2 class="mt-2 text-base font-semibold">No plugins match</h2>
          <p class="mt-1 text-sm muted max-w-[50ch] mx-auto">
            <template v-if="q.trim()">Nothing in {{ cat ? categoryById[cat].label : "the registry" }} matches “{{ q.trim() }}”. Try a shorter word, such as <RouterLink :to="{ name: 'browse', query: { q: 'memory' } }" class="accent-text underline underline-offset-2">memory</RouterLink>.</template>
            <template v-else>There are no plugins in this category yet.</template>
          </p>
          <button v-if="filtersOn" type="button" class="btn-secondary mt-4 !h-10 md:!h-8" @click="clearFilters">Clear filters</button>
        </div>
      </template>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PluginCard v-for="p in filtered" :key="p.id" :plugin="p" />
      </div>
    </LoadStates>
  </div>
</template>
