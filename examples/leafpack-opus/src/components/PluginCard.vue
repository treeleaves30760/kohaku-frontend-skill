<script setup>
import CategoryTile from "./CategoryTile.vue"
import PluginBadges from "./PluginBadges.vue"
import { categoryById } from "../data/categories.js"
import { compact, int, relDate, absDate } from "../lib/format.js"

defineProps({ plugin: { type: Object, required: true } })
defineEmits(["tag"])
</script>

<template>
  <!-- Whole card is clickable through a stretched link; tag chips sit above
       it so they can filter without nesting interactive elements. -->
  <article class="card lp-card-link relative flex flex-col gap-3 p-4 min-w-0">
    <div class="flex items-start gap-3 min-w-0">
      <CategoryTile :category="plugin.category" />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 min-w-0">
          <RouterLink
            :to="{ name: 'plugin', params: { id: plugin.id } }"
            class="truncate text-[15px] font-semibold text-warm-900 dark:text-warm-50 rounded after:content-[''] after:absolute after:inset-0 after:rounded-xl"
            :title="plugin.name"
            >{{ plugin.name }}</RouterLink
          >
          <span class="num text-[11px] text-warm-500 shrink-0">{{ plugin.version }}</span>
        </div>
        <div class="text-[11px] text-warm-500 truncate mt-0.5">
          <span class="font-mono">{{ plugin.publisher }}</span> · {{ categoryById[plugin.category]?.label }} ·
          <span :title="`Updated ${absDate(plugin.updatedAt)}`">{{ relDate(plugin.updatedAt) }}</span>
        </div>
      </div>
    </div>
    <p class="text-[13px] leading-5 text-warm-700 dark:text-warm-300 line-clamp-2 min-h-[2.5rem]">
      {{ plugin.description }}
    </p>
    <div class="mt-auto flex items-center gap-1.5 flex-wrap min-w-0">
      <PluginBadges :plugin="plugin" />
      <button
        v-for="t in plugin.tags"
        :key="t"
        type="button"
        class="chip-warm relative z-1 hover:border-iolite/50 transition-colors"
        :title="`Show plugins tagged ${t}`"
        @click="$emit('tag', t)"
      >
        {{ t }}
      </button>
      <span class="ml-auto inline-flex items-center gap-1 text-[11px] text-warm-500" :title="`${int(plugin.downloads)} downloads`">
        <span class="i-carbon-download" aria-hidden="true" />
        <span class="num">{{ compact(plugin.downloads) }}</span>
        <span class="sr-only">downloads</span>
      </span>
    </div>
  </article>
</template>
