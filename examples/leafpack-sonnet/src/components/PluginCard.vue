<script setup>
import { categoryById } from "../data/plugins.js"
import { fmtCompact, fmtAgo, fmtDateTime } from "../lib/format.js"
import StatusChips from "./StatusChips.vue"
defineProps({ plugin: { type: Object, required: true } })
</script>

<template>
  <RouterLink
    :to="{ name: 'plugin', params: { id: plugin.id } }"
    class="lp-card-link kt-v2-card group flex flex-col gap-2.5 p-4 min-w-0 focus-visible:outline-2 focus-visible:outline-iolite focus-visible:outline-offset-2"
    :class="plugin.deprecated ? 'opacity-90' : ''"
  >
    <div class="flex items-start gap-3 min-w-0">
      <div
        class="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xl"
        :class="categoryById[plugin.category].tile"
        aria-hidden="true"
      >
        <span :class="categoryById[plugin.category].icon" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 min-w-0">
          <span class="kt-text-body font-semibold truncate min-w-0" :title="plugin.name">{{ plugin.name }}</span>
          <span class="num kt-text-caption muted shrink-0">v{{ plugin.version }}</span>
        </div>
        <div class="kt-text-caption muted truncate" :title="`${plugin.scope} · ${plugin.license}`">
          {{ plugin.scope }} · {{ plugin.license }} · <span :title="fmtDateTime(plugin.updated)">{{ fmtAgo(plugin.updated) }}</span>
        </div>
      </div>
    </div>
    <p class="kt-text-body leading-5 line-clamp-2 min-h-[2.5rem] muted">{{ plugin.summary }}</p>
    <div class="flex items-center gap-1.5 flex-wrap mt-auto">
      <span class="chip-taaffeite">{{ categoryById[plugin.category].label }}</span>
      <StatusChips :plugin="plugin" />
      <span class="ml-auto num kt-text-caption muted inline-flex items-center gap-1" :title="`${plugin.downloads.toLocaleString('en')} downloads`">
        <span class="i-carbon-download" aria-hidden="true" />{{ fmtCompact(plugin.downloads) }}
      </span>
    </div>
  </RouterLink>
</template>
