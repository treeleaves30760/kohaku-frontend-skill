<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { DOC_GROUPS, DOC_PAGES } from "../docs/pages.js"

const props = defineProps({ page: { type: String, default: "" } })
const route = useRoute()
const router = useRouter()

const current = computed(() => DOC_PAGES.find((p) => p.id === props.page) || DOC_PAGES[0])
const idx = computed(() => DOC_PAGES.indexOf(current.value))
const prev = computed(() => DOC_PAGES[idx.value - 1])
const next = computed(() => DOC_PAGES[idx.value + 1])
const body = computed(() => defineAsyncComponent(current.value.load))

// Sidebar search over page titles and summaries.
const filter = ref("")
const groups = computed(() => {
  const t = filter.value.trim().toLowerCase()
  if (!t) return DOC_GROUPS
  return DOC_GROUPS.map((g) => ({ ...g, pages: g.pages.filter((p) => (p.title + " " + p.summary).toLowerCase().includes(t)) })).filter((g) => g.pages.length)
})

const drawer = ref(route.query.drawer === "1")
const article = ref(null)
const toc = shallowRef([])
const activeId = ref("")

function refreshToc() {
  nextTick(() => {
    const hs = [...(article.value?.querySelectorAll(".kt-prose h2[id], .kt-prose h3[id]") || [])]
    for (const h of hs) {
      if (!h.querySelector(".anchor")) {
        const a = document.createElement("button")
        a.type = "button"
        a.className = "anchor"
        a.textContent = "#"
        a.setAttribute("aria-label", `Link to “${h.textContent}”`)
        h.appendChild(a)
      }
    }
    toc.value = hs.map((h) => ({ id: h.id, text: h.childNodes[0].textContent, level: h.tagName === "H3" ? 3 : 2 }))
    onScroll()
    const at = route.query.at
    if (at) document.getElementById(String(at))?.scrollIntoView({ block: "start" })
  })
}

function goTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })
  router.replace({ query: { ...route.query, at: id } })
  activeId.value = id
}
function onArticleClick(e) {
  const a = e.target.closest?.(".anchor")
  if (a) goTo(a.parentElement.id)
}

// Scroll spy: a heading counts as passed once it is within 96px of the top.
let raf = 0
function onScroll() {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    let cur = toc.value[0]?.id || ""
    for (const t of toc.value) {
      const el = document.getElementById(t.id)
      if (el && el.getBoundingClientRect().top < 96) cur = t.id
    }
    activeId.value = cur
  })
}
function onKey(e) {
  if (e.key === "Escape" && drawer.value) drawer.value = false
}
onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addEventListener("keydown", onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll)
  window.removeEventListener("keydown", onKey)
  cancelAnimationFrame(raf)
  document.body.style.overflow = ""
})
watch(drawer, (v) => { document.body.style.overflow = v ? "hidden" : "" })
// The drawer closes on the outcome (a different page opened), not on any click.
document.title = `${current.value.title} · Leafpack docs`
watch(() => current.value.id, () => {
  drawer.value = false
  toc.value = []
  document.title = `${current.value.title} · Leafpack docs`
  if (!route.query.at) window.scrollTo(0, 0)
})
</script>

<template>
  <div class="max-w-[1600px] mx-auto lg:grid lg:grid-cols-[260px_minmax(0,1fr)_220px] xl:grid-cols-[280px_minmax(0,1fr)_240px]">
    <!-- phone / tablet: sidebar behind a button -->
    <div class="lg:hidden px-3 pt-3">
      <button type="button" class="btn-secondary !h-10 w-full justify-start" aria-haspopup="dialog" :aria-expanded="drawer" @click="drawer = true">
        <span class="i-carbon-menu" aria-hidden="true" /> Browse docs
        <span class="ml-auto muted font-normal truncate">{{ current.title }}</span>
      </button>
    </div>
    <div v-if="drawer" class="lg:hidden fixed inset-0 z-40 bg-black/40" @click="drawer = false" />

    <aside
      class="kt-v2-panel border-0 border-r border-solid border-[var(--v2-line-strong)] flex flex-col gap-3 p-3 overflow-y-auto
             fixed inset-y-0 left-0 z-50 w-[88%] max-w-80 transition-transform duration-200 pb-6
             lg:sticky lg:top-11 lg:z-0 lg:w-auto lg:max-w-none lg:h-[calc(100vh-2.75rem)] lg:translate-x-0"
      :class="drawer ? 'translate-x-0' : '-translate-x-full'"
      aria-label="Documentation pages"
    >
      <div class="flex items-center gap-2 lg:hidden">
        <span class="text-sm font-semibold flex-1">Docs</span>
        <button type="button" class="btn-icon !w-10 !h-10" aria-label="Close menu" @click="drawer = false"><span class="i-carbon-close" aria-hidden="true" /></button>
      </div>
      <div class="relative">
        <span class="i-carbon-search absolute left-2.5 top-1/2 -translate-y-1/2 muted pointer-events-none" aria-hidden="true" />
        <input v-model="filter" type="search" class="input-field pl-8 !h-10 md:!h-8" placeholder="Search pages…" aria-label="Search docs pages" @keydown.esc="filter = ''" />
      </div>
      <nav class="flex flex-col gap-4" aria-label="Pages">
        <div v-for="g in groups" :key="g.id">
          <div class="section-title px-2 mb-1">{{ g.label }}</div>
          <div class="flex flex-col gap-0.5 border-0 border-l border-solid border-[var(--v2-line-strong)] ml-2">
            <RouterLink
              v-for="p in g.pages"
              :key="p.id"
              :to="{ name: 'docs', params: { page: p.id } }"
              class="block px-3 py-2 md:py-1.5 -ml-px text-sm rounded-r-lg border-0 border-l-2 border-solid transition-colors"
              :class="p.id === current.id ? 'lp-active border-l-iolite font-medium' : 'border-l-transparent muted hover:text-[var(--v2-ink)] hover:bg-[var(--v2-hover)]'"
              :aria-current="p.id === current.id ? 'page' : undefined"
            >{{ p.title }}</RouterLink>
          </div>
        </div>
        <p v-if="!groups.length" class="text-sm muted px-2">No pages match “{{ filter }}”.</p>
      </nav>
    </aside>

    <article ref="article" class="kt-reading min-w-0 px-4 md:px-8 py-5 md:py-8" @click="onArticleClick">
      <div class="max-w-[78ch] mx-auto lg:mx-0">
        <nav class="text-xs muted flex items-center gap-1.5" aria-label="Breadcrumb">
          <RouterLink to="/docs" class="hover:text-iolite dark:hover:text-iolite-light">Docs</RouterLink>
          <span class="i-carbon-chevron-right kt-text-micro" aria-hidden="true" />
          <span>{{ current.group }}</span>
        </nav>
        <p class="mt-4 text-[.8rem] font-semibold uppercase tracking-[.16em] accent-text">{{ current.group }}</p>
        <h1 class="mt-1 text-[clamp(1.9rem,3vw,2.5rem)] font-bold tracking-tight leading-[1.1] text-balance">{{ current.title }}</h1>
        <p class="mt-3 text-lg leading-7 muted">{{ current.summary }}</p>
        <p class="mt-3 text-xs muted"><span class="chip-warm">{{ current.group.toLowerCase() }}</span> · Updated Nov 2026</p>

        <!-- phone: table of contents drops down inline -->
        <details v-if="toc.length" class="lg:hidden mt-5 kt-v2-card">
          <summary class="flex items-center gap-2 min-h-12 px-4 cursor-pointer text-sm font-medium list-none focus-visible:outline-2 focus-visible:outline-iolite">
            <span class="i-carbon-list" aria-hidden="true" /> On this page
            <span class="num text-xs muted ml-auto">{{ toc.length }}</span>
          </summary>
          <ul class="m-0 px-4 pb-3 list-none max-h-[45dvh] overflow-y-auto">
            <li v-for="t in toc" :key="t.id">
              <button type="button" class="w-full text-left py-2 text-sm muted hover:text-iolite dark:hover:text-iolite-light" :class="t.level === 3 ? 'pl-4' : ''" @click="goTo(t.id)">{{ t.text }}</button>
            </li>
          </ul>
        </details>

        <div class="mt-6">
          <component :is="body" :key="current.id" @vue:mounted="refreshToc" />
        </div>

        <div class="mt-12 pt-6 border-0 border-t border-solid border-[var(--v2-line)] grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RouterLink v-if="prev" :to="{ name: 'docs', params: { page: prev.id } }" class="lp-card-link kt-v2-card p-3 min-h-14">
            <span class="block kt-text-micro uppercase tracking-wider muted">Previous</span>
            <span class="block text-sm font-medium mt-0.5">{{ prev.title }}</span>
          </RouterLink>
          <span v-else class="hidden sm:block" />
          <RouterLink v-if="next" :to="{ name: 'docs', params: { page: next.id } }" class="lp-card-link kt-v2-card p-3 min-h-14 sm:text-right">
            <span class="block kt-text-micro uppercase tracking-wider muted">Next</span>
            <span class="block text-sm font-medium mt-0.5">{{ next.title }}</span>
          </RouterLink>
        </div>
      </div>
    </article>

    <!-- desktop: on-page table of contents -->
    <aside class="hidden lg:block sticky top-11 h-[calc(100vh-2.75rem)] overflow-y-auto py-8 pr-4" aria-label="On this page">
      <template v-if="toc.length">
        <div class="section-title mb-2">On this page</div>
        <ul class="m-0 p-0 list-none border-0 border-l border-solid border-[var(--v2-line)]">
          <li v-for="t in toc" :key="t.id">
            <button
              type="button"
              class="block w-full text-left -ml-px py-1 pr-2 text-[0.88rem] leading-snug border-0 border-l-2 border-solid transition-colors"
              :class="[t.level === 3 ? 'pl-6' : 'pl-3', activeId === t.id ? 'border-l-iolite text-iolite dark:text-iolite-light font-medium' : 'border-l-transparent muted hover:text-[var(--v2-ink)]']"
              :aria-current="activeId === t.id ? 'location' : undefined"
              @click="goTo(t.id)"
            >{{ t.text }}</button>
          </li>
        </ul>
      </template>
    </aside>
  </div>
</template>
