<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import CategoryTile from "../components/CategoryTile.vue"
import PluginBadges from "../components/PluginBadges.vue"
import CopyButton from "../components/CopyButton.vue"
import CodeBlock from "../components/CodeBlock.vue"
import ErrorCard from "../components/ErrorCard.vue"
import { categoryById } from "../data/categories.js"
import { getPlugin, simOpts } from "../lib/api.js"
import { compact, int, relDate, absDate } from "../lib/format.js"
import { parseMarkdown } from "../lib/markdown.js"

const route = useRoute()
const router = useRouter()

const plugin = ref(null)
const loading = ref(true)
const error = ref("")
const missing = ref(false)
let ctrl = null

async function load() {
  ctrl?.abort()
  ctrl = new AbortController()
  loading.value = true
  error.value = ""
  missing.value = false
  try {
    const p = await getPlugin(route.params.id, { ...simOpts(route.query), signal: ctrl.signal })
    plugin.value = p
    missing.value = !p
    if (p) {
      selectedVersion.value = p.version
      document.title = `${p.name} · Leafpack`
    }
  } catch (e) {
    if (e.name !== "AbortError") error.value = e.message
  } finally {
    loading.value = false
  }
}
// String key so switching tabs (?tab=) does not refetch.
watch(
  () => `${route.params.id}|${route.query.fail}|${route.query.delay}`,
  (key, old) => {
    if (old && old.split("|")[0] !== key.split("|")[0]) plugin.value = null // a different plugin: don't show the old one
    if (route.name === "plugin") load()
  },
  { immediate: true },
)
onBeforeUnmount(() => ctrl?.abort())
function retry() {
  if (route.query.fail) router.replace({ query: { ...route.query, fail: undefined } })
  else load()
}

// ── install ──
const selectedVersion = ref("")
const installable = computed(() => plugin.value?.versions.filter((v) => !v.yanked) ?? [])
const installCmd = computed(() =>
  !plugin.value
    ? ""
    : selectedVersion.value === plugin.value.version
      ? `leafpack add ${plugin.value.id}`
      : `leafpack add ${plugin.value.id}@${selectedVersion.value}`,
)

// ── tabs: ?tab=readme|versions|permissions ──
const tabs = computed(() => [
  { id: "readme", label: "Readme", icon: "i-carbon-document" },
  { id: "versions", label: "Versions", icon: "i-carbon-recently-viewed", count: plugin.value?.versions.length },
  { id: "permissions", label: "Permissions", icon: "i-carbon-locked", count: plugin.value?.permissions.length },
])
const tab = computed(() => (tabs.value.some((t) => t.id === route.query.tab) ? route.query.tab : "readme"))
const tabEls = ref([])
function selectTab(id, focus = false) {
  router.replace({ query: { ...route.query, tab: id === "readme" ? undefined : id } })
  if (focus) nextTick(() => tabEls.value.find((el) => el.dataset.tab === id)?.focus())
}
function onTabKey(e) {
  const ids = tabs.value.map((t) => t.id)
  const i = ids.indexOf(tab.value)
  const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[e.key]
  if (next == null) return
  e.preventDefault()
  selectTab(ids[(next + ids.length) % ids.length], true)
}

// The readme's leading "# name" duplicates the page H1, so drop it.
const readme = computed(() =>
  plugin.value ? parseMarkdown(plugin.value.readme).filter((b, i) => !(i === 0 && b.type === "h" && b.level === 1)) : [],
)

const PERM = {
  network: { icon: "i-carbon-network-3", label: "Network access" },
  "fs-read": { icon: "i-carbon-folder", label: "Read files" },
  "fs-write": { icon: "i-carbon-edit", label: "Write files" },
  shell: { icon: "i-carbon-terminal", label: "Run shell commands" },
  env: { icon: "i-carbon-password", label: "Read environment variables" },
  process: { icon: "i-carbon-application", label: "Start processes" },
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex flex-col gap-4">
    <RouterLink
      :to="{ name: 'browse' }"
      class="self-start inline-flex items-center gap-1.5 kt-text-caption text-warm-600 dark:text-warm-400 hover:text-iolite dark:hover:text-iolite-light transition-colors touch-target"
    >
      <span class="i-carbon-arrow-left" aria-hidden="true" />Back to browse
    </RouterLink>

    <!-- error → loading → not found → content; the header card keeps its shape. -->
    <ErrorCard v-if="error && !plugin" :title="`Could not load ${route.params.id}`" :message="error" @retry="retry" />

    <div v-else-if="loading && !plugin" class="card p-5 sm:p-6 min-h-[11rem] flex items-center justify-center" aria-busy="true">
      <p class="kt-text-body text-warm-600 dark:text-warm-400" role="status">Loading plugin…</p>
    </div>

    <div v-else-if="missing" class="card py-12 px-6 flex flex-col items-center text-center gap-2">
      <span class="i-carbon-search text-[40px] text-warm-400 opacity-60" aria-hidden="true" />
      <p class="kt-text-emphasis font-semibold text-warm-800 dark:text-warm-100">No plugin named “<span class="font-mono">{{ route.params.id }}</span>”</p>
      <p class="kt-text-body text-warm-600 dark:text-warm-400">It may have been renamed or unpublished.</p>
      <RouterLink :to="{ name: 'browse', query: { q: route.params.id } }" class="btn-primary mt-2">Search for “{{ route.params.id }}”</RouterLink>
    </div>

    <template v-else-if="plugin">
      <div v-if="plugin.deprecated" role="status" class="kt-banner">
        <span class="i-carbon-warning-alt text-coral shrink-0 mt-0.5" aria-hidden="true" />
        <span class="flex-1 min-w-0">
          <b class="font-semibold">This plugin is deprecated.</b> {{ plugin.deprecated.reason }} Use
          <RouterLink :to="{ name: 'plugin', params: { id: plugin.deprecated.replacement } }" class="font-mono text-iolite dark:text-iolite-light underline underline-offset-2">{{ plugin.deprecated.replacement }}</RouterLink>
          for new agents.
        </span>
      </div>

      <!-- Header card + install column (beside from lg, below with a border-t before that). -->
      <section class="card flex flex-col lg:flex-row" aria-labelledby="plugin-title">
        <div class="flex-1 min-w-0 p-4 sm:p-6 flex gap-4">
          <CategoryTile :category="plugin.category" size="lg" class="max-sm:!w-12 max-sm:!h-12" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-x-2.5 gap-y-1 flex-wrap">
              <h1 id="plugin-title" class="text-2xl font-bold tracking-tight text-warm-900 dark:text-warm-50 break-all">{{ plugin.name }}</h1>
              <span class="num text-sm text-warm-600 dark:text-warm-400">v{{ plugin.version }}</span>
              <PluginBadges :plugin="plugin" />
            </div>
            <p class="mt-2 kt-text-body text-warm-700 dark:text-warm-300 max-w-[70ch]">{{ plugin.description }}</p>
            <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 kt-text-caption text-warm-600 dark:text-warm-400">
              <li class="inline-flex items-center gap-1.5"><span class="i-carbon-user" aria-hidden="true" /><span class="sr-only">Publisher</span><span class="font-mono">{{ plugin.publisher }}</span></li>
              <li class="inline-flex items-center gap-1.5">
                <span :class="categoryById[plugin.category].icon" aria-hidden="true" />
                <RouterLink :to="{ name: 'browse', query: { cat: plugin.category } }" class="hover:text-iolite dark:hover:text-iolite-light">{{ categoryById[plugin.category].label }}</RouterLink>
              </li>
              <li v-for="t in plugin.tags" :key="t">
                <RouterLink :to="{ name: 'browse', query: { tag: t } }" class="chip-warm hover:border-iolite/50">{{ t }}</RouterLink>
              </li>
            </ul>
          </div>
        </div>
        <aside class="lg:w-96 shrink-0 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-solid border-[var(--v2-line)] flex flex-col gap-2" aria-label="Install">
          <div class="flex items-center gap-2">
            <h2 class="section-title flex-1">Install</h2>
            <label for="version-select" class="sr-only">Version</label>
            <select id="version-select" v-model="selectedVersion" class="input-field lp-input !w-auto !h-7 !text-xs font-mono">
              <option v-for="(ver, i) in installable" :key="ver.version" :value="ver.version">{{ ver.version }}{{ i === 0 ? " (latest)" : "" }}</option>
            </select>
          </div>
          <div class="flex items-center gap-1 rounded-lg border border-solid border-[var(--v2-line-strong)] bg-[var(--color-surface-alt)] pl-3 pr-1 min-h-10">
            <code class="flex-1 min-w-0 font-mono text-[13px] leading-5 text-warm-800 dark:text-warm-100 [overflow-wrap:anywhere] py-2">{{ installCmd }}</code>
            <CopyButton :text="installCmd" label="Copy install command" icon-only />
          </div>
          <p class="text-[11px] leading-4 text-warm-600 dark:text-warm-400">
            Run in your agent's folder. Leafpack shows the
            <button type="button" class="underline underline-offset-2 hover:text-iolite dark:hover:text-iolite-light" @click="selectTab('permissions')">permissions</button>
            and asks before installing.
          </p>
        </aside>
      </section>

      <!-- Stats -->
      <dl class="grid grid-cols-3 gap-2 sm:gap-3">
        <div class="card px-3 py-2.5 sm:px-4 sm:py-3 min-w-0">
          <dt class="section-title flex items-center gap-1"><span class="i-carbon-download max-sm:hidden" aria-hidden="true" />Downloads</dt>
          <dd class="mt-1 num text-lg sm:text-[22px] font-semibold text-warm-900 dark:text-warm-50" :title="`${int(plugin.downloads)} downloads`">{{ compact(plugin.downloads) }}</dd>
        </div>
        <div class="card px-3 py-2.5 sm:px-4 sm:py-3 min-w-0">
          <dt class="section-title flex items-center gap-1"><span class="i-carbon-time max-sm:hidden" aria-hidden="true" />Updated</dt>
          <dd class="mt-1 text-sm sm:text-base font-semibold leading-snug text-warm-900 dark:text-warm-50" :title="absDate(plugin.updatedAt)">
            {{ relDate(plugin.updatedAt) }}
          </dd>
          <dd class="num text-[11px] text-warm-500 truncate">{{ plugin.updatedAt }}</dd>
        </div>
        <div class="card px-3 py-2.5 sm:px-4 sm:py-3 min-w-0">
          <dt class="section-title flex items-center gap-1"><span class="i-carbon-license max-sm:hidden" aria-hidden="true" />Licence</dt>
          <dd class="mt-1 num text-sm sm:text-base font-semibold text-warm-900 dark:text-warm-50 truncate" :title="plugin.license">{{ plugin.license || "—" }}</dd>
        </div>
      </dl>

      <!-- Tabs -->
      <section class="card overflow-hidden">
        <div class="flex border-b border-solid border-[var(--v2-line)] px-2 overflow-x-auto scrollbar-none" role="tablist" aria-label="Plugin details" @keydown="onTabKey">
          <button
            v-for="t in tabs"
            :id="`tab-${t.id}`"
            :key="t.id"
            ref="tabEls"
            :data-tab="t.id"
            type="button"
            role="tab"
            :aria-selected="tab === t.id"
            :aria-controls="`panel-${t.id}`"
            :tabindex="tab === t.id ? 0 : -1"
            class="shrink-0 inline-flex items-center gap-1.5 h-10 px-2.5 sm:px-3 -mb-px kt-text-body border-b-2 border-solid transition-colors"
            :class="tab === t.id ? 'border-iolite text-warm-900 dark:text-warm-50 font-medium' : 'border-transparent text-warm-600 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200'"
            @click="selectTab(t.id)"
          >
            <span class="max-sm:hidden" :class="[t.icon, tab === t.id ? 'text-iolite dark:text-iolite-light' : '']" aria-hidden="true" />
            {{ t.label }}
            <span v-if="t.count != null" class="num text-[11px] text-warm-500">{{ t.count }}</span>
          </button>
        </div>

        <div :id="`panel-${tab}`" role="tabpanel" :aria-labelledby="`tab-${tab}`" tabindex="0" class="outline-none">
          <!-- Readme -->
          <div v-if="tab === 'readme'" class="p-4 sm:p-6 lp-prose lp-prose--app">
            <template v-for="(b, i) in readme" :key="i">
              <component :is="`h${Math.min(b.level + 1, 4)}`" v-if="b.type === 'h'" v-html="b.html" />
              <p v-else-if="b.type === 'p'" v-html="b.html" />
              <ul v-else-if="b.type === 'ul'">
                <li v-for="(it, j) in b.items" :key="j" v-html="it" />
              </ul>
              <CodeBlock v-else-if="b.type === 'code'" :code="b.code" :lang="b.lang" />
            </template>
          </div>

          <!-- Versions -->
          <ol v-else-if="tab === 'versions'" class="divide-y divide-[var(--v2-line)]">
            <li
              v-for="(ver, i) in plugin.versions"
              :key="ver.version"
              class="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-baseline gap-x-4 gap-y-1"
              :class="ver.yanked ? 'opacity-75' : ''"
            >
              <div class="flex items-center gap-2 sm:w-44 shrink-0">
                <span class="font-mono text-sm font-medium" :class="ver.yanked ? 'line-through text-warm-500' : 'text-iolite dark:text-iolite-light'">{{ ver.version }}</span>
                <span v-if="ver.version === plugin.version" class="chip-iolite">latest</span>
                <span v-if="ver.yanked" class="chip-coral" title="Yanked: this release was withdrawn and cannot be installed."><span class="i-carbon-misuse" aria-hidden="true" />yanked</span>
              </div>
              <span class="num text-xs text-warm-500 sm:w-28 shrink-0" :title="absDate(ver.date)">{{ ver.date }}</span>
              <p class="kt-text-body text-warm-700 dark:text-warm-300 flex-1 min-w-0">{{ ver.notes }}</p>
            </li>
          </ol>

          <!-- Permissions -->
          <div v-else>
            <p class="px-4 sm:px-6 pt-4 kt-text-caption text-warm-600 dark:text-warm-400">
              What <span class="font-mono">{{ plugin.name }}</span> can do once installed. You confirm these when you run the install command.
            </p>
            <div v-if="!plugin.permissions.length" class="px-4 sm:px-6 py-8 flex items-center gap-3">
              <span class="i-carbon-checkmark-outline text-xl text-sage" aria-hidden="true" />
              <p class="kt-text-body text-warm-700 dark:text-warm-300">This plugin asks for no permissions. It runs without network, file or process access.</p>
            </div>
            <ul v-else class="mt-2 divide-y divide-[var(--v2-line)] border-t border-solid border-[var(--v2-line)]">
              <li v-for="(perm, i) in plugin.permissions" :key="i" class="px-4 sm:px-6 py-3 flex gap-3">
                <span :class="PERM[perm.kind]?.icon" class="text-warm-600 dark:text-warm-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="kt-text-body font-medium text-warm-900 dark:text-warm-50">{{ PERM[perm.kind]?.label ?? perm.kind }}</span>
                    <span v-if="perm.broad" class="chip-amber" title="Broad: this permission is not limited to specific hosts, paths or commands. Review before installing.">
                      <span class="i-carbon-warning-alt" aria-hidden="true" />broad
                    </span>
                  </div>
                  <p class="mt-0.5 font-mono text-xs text-warm-700 dark:text-warm-300 break-words">{{ perm.scope }}</p>
                  <p class="mt-0.5 kt-text-caption text-warm-600 dark:text-warm-400">{{ perm.reason }}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
