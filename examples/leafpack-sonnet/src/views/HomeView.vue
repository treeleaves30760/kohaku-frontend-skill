<script setup>
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { CATEGORIES } from "../data/plugins.js"
import { usePluginList } from "../composables.js"
import SearchBox from "../components/SearchBox.vue"
import PluginCard from "../components/PluginCard.vue"
import LoadStates from "../components/LoadStates.vue"
import { fmtCompact } from "../lib/format.js"

const router = useRouter()
const { plugins, loading, error, reload } = usePluginList()
const q = ref("")
const featured = computed(() => plugins.value.filter((p) => p.featured).slice(0, 6))
const counts = computed(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, plugins.value.filter((p) => p.category === c.id).length])))
const totalDownloads = computed(() => plugins.value.reduce((n, p) => n + p.downloads, 0))
const go = () => router.push({ name: "browse", query: q.value.trim() ? { q: q.value.trim() } : {} })
</script>

<template>
  <div class="max-w-[1100px] mx-auto px-3 md:px-5 py-4 md:py-8 flex flex-col gap-8">
    <section class="kt-v2-card p-5 md:p-8" aria-labelledby="hero-title">
      <p class="text-[.8rem] font-semibold uppercase tracking-[.16em] accent-text">Plugin registry for Leaf agents</p>
      <h1 id="hero-title" class="mt-2 font-bold tracking-tight leading-[1.1] text-balance text-[clamp(1.9rem,3vw,2.9rem)]">Add abilities to your agent in one command</h1>
      <p class="mt-3 text-base sm:text-lg leading-7 max-w-[60ch] muted">
        Leafpack lists tools, memory stores, model connectors and chat channels for the Leaf agent framework. Every listing shows the permissions it asks for <strong class="font-semibold ink">before</strong> you install it.
      </p>
      <form class="mt-5 flex flex-col sm:flex-row gap-2 max-w-2xl" role="search" @submit.prevent="go">
        <SearchBox v-model="q" big placeholder="Search plugins…" @submit="go" />
        <button type="submit" class="btn-primary !h-11 px-5 shrink-0">Search</button>
      </form>
      <p class="mt-3 text-xs muted">
        Try
        <RouterLink :to="{ name: 'browse', query: { q: 'memory' } }" class="underline underline-offset-2 hover:text-iolite dark:hover:text-iolite-light">memory</RouterLink> ·
        <RouterLink :to="{ name: 'browse', query: { q: 'search' } }" class="underline underline-offset-2 hover:text-iolite dark:hover:text-iolite-light">search</RouterLink> ·
        <RouterLink :to="{ name: 'browse', query: { q: 'guard' } }" class="underline underline-offset-2 hover:text-iolite dark:hover:text-iolite-light">guard</RouterLink>
        <template v-if="plugins.length"> · <span class="num">{{ plugins.length }}</span> plugins · <span class="num">{{ fmtCompact(totalDownloads) }}</span> downloads</template>
      </p>
    </section>

    <section aria-labelledby="featured-title">
      <div class="flex items-baseline gap-3 mb-3">
        <h2 id="featured-title" class="text-lg font-semibold">Featured plugins</h2>
        <RouterLink :to="{ name: 'browse' }" class="ml-auto text-sm accent-text hover:underline underline-offset-2">Browse all →</RouterLink>
      </div>
      <LoadStates :error="error" :loading="loading" :count="featured.length" :has-data="plugins.length > 0" noun="featured plugins" @retry="reload">
        <template #skeleton>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            <div v-for="i in 6" :key="i" class="kt-v2-card p-4 flex flex-col gap-3" style="min-height: 9.5rem">
              <div class="flex gap-3"><div class="lp-skel w-10 h-10" /><div class="flex-1 flex flex-col gap-2"><div class="lp-skel h-4" style="width: 60%" /><div class="lp-skel h-3" style="width: 40%" /></div></div>
              <div class="lp-skel h-3" style="width: 100%" /><div class="lp-skel h-3" style="width: 80%" />
            </div>
          </div>
        </template>
        <template #empty><p class="text-sm muted py-6 text-center">No featured plugins yet.</p></template>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PluginCard v-for="p in featured" :key="p.id" :plugin="p" />
        </div>
      </LoadStates>
    </section>

    <section aria-labelledby="cats-title">
      <h2 id="cats-title" class="text-lg font-semibold mb-3">Categories</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <RouterLink
          v-for="c in CATEGORIES"
          :key="c.id"
          :to="{ name: 'browse', query: { cat: c.id } }"
          class="lp-card-link kt-v2-card flex items-center gap-3 p-3 min-h-14 focus-visible:outline-2 focus-visible:outline-iolite focus-visible:outline-offset-2"
        >
          <span class="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xl" :class="c.tile" aria-hidden="true"><span :class="c.icon" /></span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold">{{ c.label }}</span>
            <span class="block text-xs muted truncate" :title="c.blurb">{{ c.blurb }}</span>
          </span>
          <span class="num text-xs muted shrink-0">{{ plugins.length ? counts[c.id] : "—" }}</span>
          <span class="i-carbon-chevron-right muted md:hidden" aria-hidden="true" />
        </RouterLink>
      </div>
    </section>

    <section class="kt-v2-card p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <span class="i-carbon-add-alt text-2xl accent-text shrink-0" aria-hidden="true" />
      <div class="flex-1 min-w-0">
        <h2 class="text-sm font-semibold">Built something for Leaf?</h2>
        <p class="text-sm muted">Publishing takes a manifest, a build and one command. The guide covers versions, permissions and deprecation.</p>
      </div>
      <RouterLink to="/docs" class="btn-secondary shrink-0 !h-10 md:!h-8">Read the publishing guide</RouterLink>
    </section>
  </div>
</template>
