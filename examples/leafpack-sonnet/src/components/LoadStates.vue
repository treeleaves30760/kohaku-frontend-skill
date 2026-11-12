<script setup>
// The four states in fixed order inside one container: error -> loading -> empty -> content.
// `count` is the number of items the content slot would render.
defineProps({
  error: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  count: { type: Number, default: 0 },
  hasData: { type: Boolean, default: false }, // data already shown at least once
  noun: { type: String, default: "plugins" },
})
defineEmits(["retry"])
</script>

<template>
  <div>
    <!-- error with content: keep the content, show the failure above it -->
    <div v-if="error && hasData" role="alert" class="kt-banner mb-3">
      <span class="i-carbon-warning-filled text-coral mt-0.5" aria-hidden="true" />
      <div class="flex-1 min-w-0">
        Refresh failed — showing the last results. <span class="font-mono text-xs break-words">{{ error }}</span>
      </div>
      <button class="btn-ghost shrink-0" @click="$emit('retry')">Retry</button>
    </div>

    <div v-if="error && !hasData" role="alert" class="kt-v2-card p-6 text-center border-coral/50" style="border-color: color-mix(in srgb, var(--kt-color-coral) 50%, var(--v2-line))">
      <span class="i-carbon-warning-filled text-coral text-3xl" aria-hidden="true" />
      <h2 class="mt-2 text-base font-semibold">Could not load {{ noun }}</h2>
      <p class="mt-1 text-sm muted max-w-[60ch] mx-auto">Nothing was changed. Check your connection and try again.</p>
      <p class="mt-2 font-mono text-xs muted break-words max-w-[70ch] mx-auto">{{ error }}</p>
      <button class="btn-primary mt-4" @click="$emit('retry')"><span class="i-carbon-renew" aria-hidden="true" />Retry</button>
    </div>

    <div v-else-if="loading && !hasData" aria-busy="true">
      <p class="text-sm muted text-center py-2" role="status">Loading {{ noun }}…</p>
      <slot name="skeleton" />
    </div>

    <div v-else-if="!count">
      <slot name="empty" />
    </div>

    <slot v-else-if="count" />
  </div>
</template>
