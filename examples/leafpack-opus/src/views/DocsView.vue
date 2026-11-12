<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import DocsSidebar from "../components/DocsSidebar.vue"
import SideDrawer from "../components/SideDrawer.vue"
import CodeBlock from "../components/CodeBlock.vue"
import { docs, docById } from "../data/docs.js"
import { absDate } from "../lib/format.js"

const route = useRoute()
const router = useRouter()

const pageId = computed(() => String(route.params.page || docs[0].id))
const page = computed(() => docById[pageId.value])
const index = computed(() => docs.findIndex((d) => d.id === pageId.value))
const prev = computed(() => docs[index.value - 1])
const next = computed(() => docs[index.value + 1])
const toc = computed(() => (page.value?.blocks ?? []).filter((b) => b.type === "h2" || b.type === "h3"))

watch(page, (p) => p && (document.title = `${p.title} · Leafpack docs`), { immediate: true })

// Phone: sidebar lives in a drawer behind "Browse docs"; ?drawer=docs opens it.
const drawer = ref(route.query.drawer === "docs")
watch(pageId, () => (drawer.value = false))

const CALLOUT = {
  note: { icon: "i-carbon-information", label: "Note" },
  tip: { icon: "i-carbon-idea", label: "Tip" },
  warning: { icon: "i-carbon-warning-alt", label: "Warning" },
  danger: { icon: "i-carbon-error", label: "Danger" },
}

// ── TOC scroll-spy (rAF-coalesced). A heading counts as passed within 48px
// of the top of the reading area (below the 44px sticky header). ──
const active = ref("")
let raf = 0
function spy() {
  raf = 0
  let current = toc.value[0]?.id ?? ""
  for (const h of toc.value) {
    const el = document.getElementById(h.id)
    if (el && el.getBoundingClientRect().top <= 44 + 48) current = h.id
  }
  active.value = current
}
const onScroll = () => (raf ||= requestAnimationFrame(spy))
onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true })
  scrollToHash(false)
  spy()
})
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll)
  cancelAnimationFrame(raf)
})
watch(pageId, () => nextTick(spy))

function goTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  router.replace({ hash: `#${id}`, query: route.query })
  active.value = id
  tocOpen.value = false
}
function scrollToHash(smooth) {
  const id = route.hash?.slice(1)
  if (id) nextTick(() => document.getElementById(id)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" }))
}
const tocOpen = ref(false)
</script>

<template>
  <div v-if="!page" class="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
    <span class="i-carbon-document-blank text-[40px] text-warm-400 opacity-60" aria-hidden="true" />
    <h1 class="mt-2 kt-text-title font-semibold text-warm-900 dark:text-warm-50">No docs page called “<span class="font-mono">{{ pageId }}</span>”</h1>
    <p class="mt-1 kt-text-body text-warm-600 dark:text-warm-400">It may have moved. Start from the overview instead.</p>
    <RouterLink :to="{ name: 'docs' }" class="btn-primary mt-4">Open the docs overview</RouterLink>
  </div>

  <div v-else class="max-w-[1600px] mx-auto lg:grid lg:grid-cols-[260px_minmax(0,1fr)_220px] 2xl:grid-cols-[280px_minmax(0,1fr)_240px]">
    <!-- Sidebar (desktop) -->
    <aside class="hidden lg:block sticky top-11 h-[calc(100dvh-2.75rem)] overflow-y-auto bg-[var(--color-bg)] border-r border-solid border-[var(--v2-line)]" aria-label="Docs navigation">
      <DocsSidebar :current="pageId" />
    </aside>

    <!-- Article (reading density) -->
    <article class="kt-reading min-w-0 px-4 sm:px-8 lg:px-12 pt-4 lg:pt-8 pb-12">
      <div class="lg:hidden flex items-center gap-2 mb-4">
        <button type="button" class="btn-secondary" @click="drawer = true">
          <span class="i-carbon-book" aria-hidden="true" />Browse docs
        </button>
      </div>

      <nav aria-label="Breadcrumb" class="kt-text-caption text-warm-600 dark:text-warm-400 flex items-center gap-1.5">
        <RouterLink :to="{ name: 'docs' }" class="hover:text-iolite dark:hover:text-iolite-light">Docs</RouterLink>
        <span class="i-carbon-chevron-right text-warm-400" aria-hidden="true" />
        <span>{{ page.group }}</span>
      </nav>
      <p class="lp-kicker mt-5">{{ page.group }}</p>
      <h1 class="lp-doc-title mt-2 text-[var(--v2-ink)]">{{ page.title }}</h1>
      <p class="mt-3 kt-text-emphasis leading-relaxed text-warm-700 dark:text-warm-300 max-w-[var(--kt-measure)]">{{ page.summary }}</p>
      <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 kt-text-caption text-warm-600 dark:text-warm-400">
        <span class="flex gap-1.5">
          <span v-for="t in page.tags" :key="t" class="chip-warm">{{ t }}</span>
        </span>
        <span>Updated <time :datetime="page.updated" class="num">{{ absDate(page.updated) }}</time></span>
        <span class="max-sm:hidden" aria-hidden="true">·</span>
        <a href="https://example.invalid/leafpack-docs" class="hover:text-iolite dark:hover:text-iolite-light inline-flex items-center gap-1" title="Suggest a change to this page (opens the docs repository)">
          <span class="i-carbon-edit" aria-hidden="true" />Edit this page
        </a>
      </div>

      <!-- On this page (below lg: inline, collapsible) -->
      <div v-if="toc.length" class="lg:hidden mt-5 card">
        <button type="button" class="w-full flex items-center gap-2 px-4 min-h-11 kt-text-body font-medium text-warm-800 dark:text-warm-200" :aria-expanded="tocOpen" aria-controls="toc-inline" @click="tocOpen = !tocOpen">
          <span class="i-carbon-list" aria-hidden="true" />On this page
          <span class="i-carbon-chevron-down ml-auto transition-transform duration-150" :class="tocOpen ? 'rotate-180' : ''" aria-hidden="true" />
        </button>
        <nav v-show="tocOpen" id="toc-inline" class="lp-toc max-h-[45dvh] overflow-y-auto px-4 pb-3 border-t border-solid border-[var(--v2-line)] pt-2" aria-label="On this page">
          <div class="border-l border-solid border-[var(--v2-line-strong)]">
            <a v-for="h in toc" :key="h.id" :href="`#/docs/${pageId}#${h.id}`" :class="{ 'is-sub': h.type === 'h3', 'is-active': active === h.id }" @click.prevent="goTo(h.id)">{{ h.text }}</a>
          </div>
        </nav>
      </div>

      <div class="lp-prose mt-8">
        <template v-for="(b, i) in page.blocks" :key="i">
          <p v-if="b.type === 'p'" v-html="b.html" />
          <ul v-else-if="b.type === 'ul'">
            <li v-for="(it, j) in b.items" :key="j" v-html="it" />
          </ul>
          <component :is="b.type" v-else-if="b.type === 'h2' || b.type === 'h3'" :id="b.id">
            {{ b.text
            }}<a :href="`#/docs/${pageId}#${b.id}`" class="lp-anchor" :aria-label="`Link to ${b.text}`" @click.prevent="goTo(b.id)">#</a>
          </component>
          <CodeBlock v-else-if="b.type === 'code'" :code="b.code" :lang="b.lang" />
          <table v-else-if="b.type === 'table'" class="lp-table">
            <thead>
              <tr>
                <th v-for="h in b.head" :key="h" scope="col">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, r) in b.rows" :key="r">
                <td v-for="(cell, c) in row" :key="c" v-html="cell" />
              </tr>
            </tbody>
          </table>
          <aside v-else-if="b.type === 'callout'" class="lp-callout" :class="`lp-callout--${b.tone}`" :aria-label="CALLOUT[b.tone].label">
            <p class="lp-callout__title">
              <span :class="CALLOUT[b.tone].icon" aria-hidden="true" />
              <span class="sr-only">{{ CALLOUT[b.tone].label }}:</span>{{ b.title }}
            </p>
            <p class="mt-1" v-html="b.html" />
          </aside>
        </template>
      </div>

      <!-- Prev / next -->
      <nav class="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[var(--kt-measure)]" aria-label="Previous and next page">
        <RouterLink v-if="prev" :to="{ name: 'docs', params: { page: prev.id } }" class="card lp-card-link p-4 block">
          <span class="block text-xs uppercase tracking-wider text-warm-500">Previous</span>
          <span class="block mt-1 kt-text-body font-semibold text-warm-900 dark:text-warm-50">{{ prev.title }}</span>
        </RouterLink>
        <span v-else class="max-sm:hidden" />
        <RouterLink v-if="next" :to="{ name: 'docs', params: { page: next.id } }" class="card lp-card-link p-4 block sm:text-right">
          <span class="block text-xs uppercase tracking-wider text-warm-500">Next</span>
          <span class="block mt-1 kt-text-body font-semibold text-warm-900 dark:text-warm-50">{{ next.title }}</span>
        </RouterLink>
      </nav>
    </article>

    <!-- TOC (desktop) -->
    <aside class="hidden lg:block sticky top-11 h-[calc(100dvh-2.75rem)] overflow-y-auto py-8 pr-4" aria-label="On this page">
      <template v-if="toc.length">
        <p class="section-title mb-3">On this page</p>
        <nav class="lp-toc border-l border-solid border-[var(--v2-line-strong)]">
          <a v-for="h in toc" :key="h.id" :href="`#/docs/${pageId}#${h.id}`" :class="{ 'is-sub': h.type === 'h3', 'is-active': active === h.id }" :aria-current="active === h.id ? 'location' : undefined" @click.prevent="goTo(h.id)">{{ h.text }}</a>
        </nav>
      </template>
    </aside>
  </div>

  <SideDrawer v-model:open="drawer" label="Docs">
    <DocsSidebar :current="pageId" />
  </SideDrawer>
</template>
