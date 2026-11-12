<script setup>
import BrandMark from "./BrandMark.vue"
</script>

<template>
  <footer class="mt-12 border-t border-solid border-warm-200/60 dark:border-warm-800 bg-warm-50/50 dark:bg-warm-950/40">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-3 kt-text-caption text-warm-600 dark:text-warm-400">
      <div class="flex sm:items-center gap-x-2 gap-y-1 max-sm:flex-col">
        <BrandMark small />
        <span><span class="max-sm:hidden">· </span>plugins for your agents, with every permission listed up front</span>
      </div>
      <div class="sm:ml-auto flex gap-4">
        <RouterLink class="hover:text-iolite dark:hover:text-iolite-light transition-colors" :to="{ name: 'docs', params: { page: 'publishing' } }">Publish a plugin</RouterLink>
        <RouterLink class="hover:text-iolite dark:hover:text-iolite-light transition-colors" :to="{ name: 'docs', params: { page: 'permissions' } }">How permissions work</RouterLink>
      </div>
    </div>
  </footer>
</template>
