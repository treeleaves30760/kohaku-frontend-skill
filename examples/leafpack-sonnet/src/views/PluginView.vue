<script setup>
import { computed, ref, watch, onBeforeUnmount } from "vue"
import { useRoute, useRouter } from "vue-router"
import { fetchPlugin, categoryById } from "../data/plugins.js"
import { renderMd } from "../lib/md.js"
import { fmtCompact, fmtFull, fmtAgo, fmtDateTime, fmtDate } from "../lib/format.js"
import StatusChips from "../components/StatusChips.vue"
import CopyButton from "../components/CopyButton.vue"

const props = defineProps({ id: { type: String, required: true } })
const route = useRoute()
const router = useRouter()

const plugin = ref(null)
const loading = ref(true)
const error = ref("")
let seq = 0
async function load() {
  const my = ++seq
  loading.value = true
  error.value = ""
  try {
    const p = await fetchPlugin(props.id, { fail: String(route.query.fail || "") })
    if (my !== seq) return
    plugin.value = p
    selectedVersion.value = p?.version || ""
    document.title = p ? `${p.name} · Leafpack` : "Plugin not found · Leafpack"
  } catch (e) {
    if (my === seq) error.value = e.message
  } finally {
    if (my === seq) loading.value = false
  }
}
watch(() => props.id, () => { plugin.value = null; load() }, { immediate: true })
onBeforeUnmount(() => { seq++; document.title = "Leafpack · plugins for Leaf agents" })

const TABS = [
  { id: "readme", label: "Readme", icon: "i-carbon-document" },
  { id: "versions", label: "Versions", icon: "i-carbon-version" },
  { id: "permissions", label: "Permissions", icon: "i-carbon-locked" },
]
const tab = computed(() => (TABS.some((t) => t.id === route.query.tab) ? String(route.query.tab) : "readme"))
const setTab = (id) => router.replace({ query: { ...route.query, tab: id === "readme" ? undefined : id } })
function onTabKey(e) {
  const i = TABS.findIndex((t) => t.id === tab.value)
  let n = -1
  if (e.key === "ArrowRight") n = (i + 1) % TABS.length
  else if (e.key === "ArrowLeft") n = (i + TABS.length - 1) % TABS.length
  else if (e.key === "Home") n = 0
  else if (e.key === "End") n = TABS.length - 1
  if (n < 0) return
  e.preventDefault()
  setTab(TABS[n].id)
  document.getElementById(`tab-${TABS[n].id}`)?.focus()
}

const selectedVersion = ref("")
const installCmd = computed(() => (plugin.value ? plugin.value.install + (selectedVersion.value && selectedVersion.value !== plugin.value.version ? `@${selectedVersion.value}` : "") : ""))
const readmeHtml = computed(() => (plugin.value ? renderMd(plugin.value.readme) : ""))
const attention = computed(() => (plugin.value ? plugin.value.permissions.filter((p) => p.level === "attention").length : 0))
</script>

<template>
  <div class="max-w-[1100px] mx-auto px-3 md:px-5 py-4 md:py-6 flex flex-col gap-4">
    <RouterLink :to="{ name: 'browse' }" class="inline-flex items-center gap-1 text-sm muted hover:text-iolite dark:hover:text-iolite-light self-start min-h-10 md:min-h-0">
      <span class="i-carbon-arrow-left" aria-hidden="true" /> Back to Browse
    </RouterLink>

    <!-- error -> loading -> empty (not found) -> content; the header card keeps its place -->
    <div v-if="error" role="alert" class="kt-banner">
      <span class="i-carbon-warning-filled text-coral mt-0.5" aria-hidden="true" />
      <div class="flex-1 min-w-0">
        Could not load {{ id }}. <span class="font-mono text-xs break-words">{{ error }}</span>
      </div>
      <button class="btn-ghost shrink-0" @click="load">Retry</button>
    </div>

    <div v-else-if="loading" class="kt-v2-card p-5" aria-busy="true">
      <p class="text-sm muted" role="status">Loading {{ id }}…</p>
      <div class="mt-4 flex gap-4"><div class="lp-skel w-16 h-16" /><div class="flex-1 flex flex-col gap-2"><div class="lp-skel h-6" style="width: 40%" /><div class="lp-skel h-3" style="width: 25%" /><div class="lp-skel h-3" style="width: 70%" /></div></div>
    </div>

    <div v-else-if="!plugin" class="kt-v2-card py-10 px-4 text-center">
      <span class="i-carbon-search text-4xl muted opacity-60" aria-hidden="true" />
      <h1 class="mt-2 text-base font-semibold">No plugin named “{{ id }}”</h1>
      <p class="mt-1 text-sm muted">It may have been renamed or removed by its publisher.</p>
      <RouterLink :to="{ name: 'browse' }" class="btn-primary mt-4">Browse all plugins</RouterLink>
    </div>

    <template v-else>
      <div v-if="plugin.deprecated" role="note" class="kt-banner kt-banner--attention">
        <span class="i-carbon-warning-alt text-amber-shadow dark:text-amber mt-0.5" aria-hidden="true" />
        <div class="min-w-0"><strong class="font-semibold">Deprecated —</strong> {{ plugin.deprecated }}</div>
      </div>

      <div class="flex flex-col lg:flex-row gap-4 items-start">
        <div class="min-w-0 flex-1 w-full flex flex-col gap-4">
          <section class="kt-v2-card p-4 md:p-5" aria-labelledby="plugin-title">
            <div class="flex items-start gap-4 min-w-0">
              <div class="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-3xl" :class="categoryById[plugin.category].tile" aria-hidden="true">
                <span :class="categoryById[plugin.category].icon" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center flex-wrap gap-x-3 gap-y-1">
                  <h1 id="plugin-title" class="text-2xl font-bold tracking-tight break-all">{{ plugin.name }}</h1>
                  <span class="num text-sm muted" title="Latest version">v{{ plugin.version }}</span>
                </div>
                <p class="text-sm muted mt-0.5">
                  by <span class="font-mono ink">{{ plugin.scope }}</span> · {{ categoryById[plugin.category].label }}
                </p>
                <div class="flex items-center flex-wrap gap-1.5 mt-2">
                  <StatusChips :plugin="plugin" />
                  <span v-for="t in plugin.tags" :key="t" class="chip-warm">{{ t }}</span>
                </div>
              </div>
            </div>
            <p class="mt-4 text-base leading-7 max-w-[70ch]">{{ plugin.summary }}</p>
          </section>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="kt-v2-card p-3">
              <div class="section-title flex items-center gap-1"><span class="i-carbon-download" aria-hidden="true" />Downloads</div>
              <div class="num kt-text-h2 font-semibold mt-1" :title="`${fmtFull(plugin.downloads)} downloads`">{{ fmtCompact(plugin.downloads) }}</div>
              <div class="kt-text-caption muted">all time</div>
            </div>
            <div class="kt-v2-card p-3">
              <div class="section-title flex items-center gap-1"><span class="i-carbon-time" aria-hidden="true" />Updated</div>
              <div class="num kt-text-h2 font-semibold mt-1" :title="fmtDateTime(plugin.updated)">{{ fmtAgo(plugin.updated).replace(" ago", "") }}</div>
              <div class="kt-text-caption muted">{{ fmtDate(plugin.updated) }}</div>
            </div>
            <div class="kt-v2-card p-3">
              <div class="section-title flex items-center gap-1"><span class="i-carbon-license" aria-hidden="true" />Licence</div>
              <div class="num kt-text-h2 font-semibold mt-1 truncate" :title="plugin.license">{{ plugin.license }}</div>
              <div class="kt-text-caption muted">SPDX identifier</div>
            </div>
            <div class="kt-v2-card p-3">
              <div class="section-title flex items-center gap-1"><span class="i-carbon-locked" aria-hidden="true" />Permissions</div>
              <div class="num kt-text-h2 font-semibold mt-1">{{ plugin.permissions.length }}</div>
              <div class="kt-text-caption muted">{{ attention ? `${attention} need a look` : "none sensitive" }}</div>
            </div>
          </div>

          <section class="kt-v2-card overflow-hidden" aria-label="Plugin details">
            <div class="flex overflow-x-auto scrollbar-none border-0 border-b border-solid border-[var(--v2-line)] px-2" role="tablist" aria-label="Plugin sections" @keydown="onTabKey">
              <button
                v-for="t in TABS"
                :id="`tab-${t.id}`"
                :key="t.id"
                type="button"
                role="tab"
                :aria-selected="tab === t.id"
                :aria-controls="`panel-${t.id}`"
                :tabindex="tab === t.id ? 0 : -1"
                class="shrink-0 inline-flex items-center gap-1.5 h-11 md:h-10 px-3 text-sm border-0 border-b-2 border-solid -mb-px transition-colors"
                :class="tab === t.id ? 'border-b-iolite text-iolite dark:text-iolite-light font-medium' : 'border-b-transparent muted hover:text-[var(--v2-ink)]'"
                @click="setTab(t.id)"
              >
                <span :class="t.icon" aria-hidden="true" />{{ t.label }}
                <span v-if="t.id === 'versions'" class="num kt-text-caption muted">{{ plugin.versions.length }}</span>
                <span v-if="t.id === 'permissions'" class="num kt-text-caption muted">{{ plugin.permissions.length }}</span>
              </button>
            </div>

            <div v-if="tab === 'readme'" id="panel-readme" role="tabpanel" aria-labelledby="tab-readme" class="p-4 md:p-6">
              <div class="kt-prose max-w-[78ch] kt-text-body" v-html="readmeHtml" />
            </div>

            <div v-else-if="tab === 'versions'" id="panel-versions" role="tabpanel" aria-labelledby="tab-versions">
              <ul class="m-0 p-0 list-none">
                <li v-for="(v, i) in plugin.versions" :key="v.v" class="flex flex-col sm:flex-row sm:items-baseline gap-x-4 gap-y-1 px-4 py-3 border-0 border-b border-solid border-[var(--v2-line)] last:border-b-0 min-h-14">
                  <div class="flex items-center gap-2 sm:w-44 shrink-0">
                    <span class="num text-sm font-medium text-iolite dark:text-iolite-light">{{ v.v }}</span>
                    <span v-if="i === 0" class="chip-iolite">latest</span>
                    <span v-if="v.yanked" class="chip-coral" :title="`Yanked: ${v.yanked}`"><span class="i-carbon-close-filled" aria-hidden="true" /> yanked</span>
                  </div>
                  <span class="num text-xs muted sm:w-28 shrink-0" :title="fmtDateTime(v.date)">{{ fmtDate(v.date) }}</span>
                  <p class="text-sm min-w-0 flex-1">
                    {{ v.notes }}
                    <span v-if="v.yanked" class="block text-xs text-coral-shadow dark:text-coral-light">Yanked: {{ v.yanked }}</span>
                  </p>
                </li>
              </ul>
            </div>

            <div v-else id="panel-permissions" role="tabpanel" aria-labelledby="tab-permissions">
              <p class="px-4 pt-4 pb-2 text-sm muted max-w-[70ch]">
                Leaf asks you to approve these before the plugin runs for the first time. A later version that asks for more will ask again.
              </p>
              <ul class="m-0 p-0 list-none">
                <li v-for="p in plugin.permissions" :key="p.id" class="flex items-start gap-3 px-4 py-3 border-0 border-t border-solid border-[var(--v2-line)] min-h-14">
                  <span :class="p.icon" class="text-lg mt-0.5 muted shrink-0" aria-hidden="true" />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center flex-wrap gap-2">
                      <span class="text-sm font-medium">{{ p.label }}</span>
                      <span class="num kt-text-caption muted">{{ p.id }}</span>
                      <span v-if="p.level === 'attention'" class="chip-amber"><span class="i-carbon-warning-alt" aria-hidden="true" /> review</span>
                    </div>
                    <p class="text-sm muted mt-0.5">{{ p.hint }}</p>
                    <p v-if="p.id === 'net.fetch' && plugin.hosts" class="text-xs mt-1 muted">Hosts: <span class="font-mono ink break-all">{{ plugin.hosts }}</span></p>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>

        <aside class="w-full lg:w-72 shrink-0 kt-v2-card p-4 flex flex-col gap-3 lg:sticky lg:top-16" aria-labelledby="install-title">
          <h2 id="install-title" class="section-title">Install</h2>
          <div>
            <label class="text-xs font-medium block mb-1" for="ver">Version</label>
            <select id="ver" v-model="selectedVersion" class="input-field !h-10 md:!h-8 font-mono">
              <option v-for="v in plugin.versions.filter((x) => !x.yanked)" :key="v.v" :value="v.v">{{ v.v }}{{ v.v === plugin.version ? " (latest)" : "" }}</option>
            </select>
          </div>
          <div class="rounded-lg border border-solid border-[var(--v2-line-strong)] bg-[var(--color-surface-alt)] p-2.5">
            <code class="block font-mono kt-text-caption leading-5 whitespace-nowrap overflow-x-auto select-all pb-1" aria-label="Install command">{{ installCmd }}</code>
          </div>
          <CopyButton :text="installCmd" label="Copy command" class="!h-10 md:!h-8 w-full" />
          <p v-if="plugin.deprecated" class="text-xs text-amber-shadow dark:text-amber-light flex gap-1.5"><span class="i-carbon-warning-alt mt-0.5 shrink-0" aria-hidden="true" />Deprecated. Installing it is still possible, but it will not get fixes.</p>
          <p v-else class="kt-text-caption muted">Run this in your agent project. Leaf shows the permissions before it installs anything.</p>
          <dl class="m-0 text-xs flex flex-col gap-1.5 border-0 border-t border-solid border-[var(--v2-line)] pt-3">
            <div class="flex justify-between gap-2"><dt class="muted">Publisher</dt><dd class="m-0 font-mono">{{ plugin.scope }}</dd></div>
            <div class="flex justify-between gap-2"><dt class="muted">Category</dt><dd class="m-0">{{ categoryById[plugin.category].label }}</dd></div>
            <div class="flex justify-between gap-2"><dt class="muted">Licence</dt><dd class="m-0 font-mono">{{ plugin.license }}</dd></div>
          </dl>
        </aside>
      </div>
    </template>
  </div>
</template>
