<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import PluginCard from "../components/PluginCard.vue"
import SkeletonCard from "../components/SkeletonCard.vue"
import ErrorCard from "../components/ErrorCard.vue"
import { categories } from "../data/categories.js"
import { listPlugins, simOpts } from "../lib/api.js"

const route = useRoute()
const router = useRouter()
const q = ref("")
const plugins = ref([])
const loading = ref(true)
const error = ref("")
let ctrl = null

async function load() {
  ctrl?.abort()
  ctrl = new AbortController()
  loading.value = true
  error.value = ""
  try {
    plugins.value = await listPlugins({ ...simOpts(route.query), signal: ctrl.signal })
  } catch (e) {
    if (e.name !== "AbortError") error.value = e.message
  } finally {
    loading.value = false
  }
}
watch(() => route.query.fail, load, { immediate: true })
onBeforeUnmount(() => ctrl?.abort())

// Featured: verified and not deprecated, most downloaded first.
const featured = computed(() =>
  plugins.value
    .filter((p) => p.verified && !p.deprecated)
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 3),
)
const counts = computed(() => Object.fromEntries(categories.map((c) => [c.id, plugins.value.filter((p) => p.category === c.id).length])))

function search() {
  router.push({ name: "browse", query: q.value.trim() ? { q: q.value.trim() } : {} })
}
function retry() {
  if (route.query.fail) router.replace({ query: { ...route.query, fail: undefined } })
  else load()
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 flex flex-col gap-8 sm:gap-10">
    <!-- Hero: one bordered panel, not a full-bleed splash. -->
    <section class="card px-5 py-7 sm:px-10 sm:py-10" aria-labelledby="hero-title">
      <p class="lp-kicker">Plugin marketplace</p>
      <h1 id="hero-title" class="lp-doc-title mt-3 text-warm-900 dark:text-warm-50">Give your agents new tools, memory and channels</h1>
      <p class="mt-4 text-base sm:text-lg leading-7 max-w-[60ch] text-warm-700 dark:text-warm-300">
        Leafpack is where plugins for the Terrarium agent framework are published. Each one lists the
        <strong class="font-semibold text-warm-900 dark:text-warm-100">permissions it asks for</strong> before you install it, and installs with one command.
      </p>
      <form class="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl" role="search" @submit.prevent="search">
        <label for="home-search" class="sr-only">Search plugins</label>
        <div class="relative flex-1">
          <span class="i-carbon-search absolute left-3 top-1/2 -translate-y-1/2 text-warm-500 pointer-events-none" aria-hidden="true" />
          <input
            id="home-search"
            v-model="q"
            data-search
            type="search"
            class="input-field lp-input !h-10 !pl-9 !text-base"
            :placeholder="plugins.length ? `Search ${plugins.length} plugins…` : 'Search plugins…'"
            enterkeyhint="search"
            @keydown.esc="q = ''"
          />
        </div>
        <button type="submit" class="btn-primary !h-10 !px-4">Search</button>
      </form>
      <p class="mt-3 kt-text-caption text-warm-600 dark:text-warm-400">
        Or <RouterLink :to="{ name: 'browse' }" class="text-iolite dark:text-iolite-light underline underline-offset-3">browse the full catalog</RouterLink> ·
        <RouterLink :to="{ name: 'docs', params: { page: 'publishing' } }" class="text-iolite dark:text-iolite-light underline underline-offset-3">publish your own</RouterLink>
      </p>
    </section>

    <section aria-labelledby="featured-title">
      <div class="flex items-baseline gap-3 mb-3">
        <h2 id="featured-title" class="kt-text-title font-semibold text-warm-900 dark:text-warm-50">Featured</h2>
        <p class="kt-text-caption text-warm-600 dark:text-warm-400">Verified plugins, most installed first</p>
      </div>
      <ErrorCard v-if="error" title="Could not load featured plugins" :message="error" @retry="retry" />
      <div v-else-if="loading && !plugins.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
        <span class="sr-only" role="status">Loading…</span>
        <SkeletonCard v-for="i in 3" :key="i" />
      </div>
      <p v-else-if="!featured.length" class="card p-6 text-center kt-text-body text-warm-600 dark:text-warm-400">No verified plugins yet.</p>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PluginCard v-for="p in featured" :key="p.id" :plugin="p" @tag="(t) => router.push({ name: 'browse', query: { tag: t } })" />
      </div>
    </section>

    <section aria-labelledby="cat-title">
      <h2 id="cat-title" class="kt-text-title font-semibold text-warm-900 dark:text-warm-50 mb-3">Categories</h2>
      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <li v-for="c in categories" :key="c.id">
          <RouterLink :to="{ name: 'browse', query: { cat: c.id } }" class="card lp-card-link flex items-center gap-3 p-3 sm:p-4 h-full">
            <span class="w-10 h-10 rounded-lg grid place-items-center text-white shrink-0" :class="c.tile" aria-hidden="true">
              <span :class="c.icon" class="kt-text-title" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-baseline gap-2">
                <span class="kt-text-body font-semibold text-warm-900 dark:text-warm-50">{{ c.label }}</span>
                <span class="num text-[11px] text-warm-500">{{ loading && !plugins.length ? "—" : counts[c.id] }}</span>
              </span>
              <span class="block kt-text-caption text-warm-600 dark:text-warm-400 leading-snug mt-0.5">{{ c.blurb }}</span>
            </span>
            <span class="i-carbon-chevron-right text-warm-400 shrink-0" aria-hidden="true" />
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>
