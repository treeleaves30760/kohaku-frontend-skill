<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center flex flex-col items-center gap-2">
    <span class="i-carbon-search text-[40px] text-warm-400 opacity-60" aria-hidden="true" />
    <h1 class="kt-text-title font-semibold text-warm-900 dark:text-warm-50">No page at this address</h1>
    <p class="kt-text-body text-warm-600 dark:text-warm-400">The link may be old. Plugins are listed in the catalog.</p>
    <RouterLink :to="{ name: 'browse' }" class="btn-primary mt-3">Browse plugins</RouterLink>
  </div>
</template>
