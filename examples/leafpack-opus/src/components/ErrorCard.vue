<script setup>
// Inline load failure: names what failed, shows the real message in mono,
// offers the next step. Sits where the content would have been.
defineProps({
  title: { type: String, required: true },
  message: { type: String, default: "" },
  hint: { type: String, default: "Check the connection and try again." },
  retrying: Boolean,
})
defineEmits(["retry"])
</script>

<template>
  <div role="alert" class="rounded-xl border border-solid border-coral/30 bg-coral/10 p-4 sm:p-5 flex gap-3">
    <span class="i-carbon-warning-alt text-coral text-xl shrink-0 mt-0.5" aria-hidden="true" />
    <div class="min-w-0 flex-1">
      <p class="font-semibold kt-text-body text-coral-shadow dark:text-coral-light">{{ title }}</p>
      <p v-if="message" class="mt-1 font-mono text-xs text-warm-700 dark:text-warm-300 break-words">{{ message }}</p>
      <p class="mt-1 kt-text-caption text-warm-600 dark:text-warm-400">{{ hint }}</p>
      <button type="button" class="btn-secondary mt-3" :disabled="retrying" @click="$emit('retry')">
        <span :class="retrying ? 'i-carbon-circle-dash animate-spin' : 'i-carbon-renew'" aria-hidden="true" />
        {{ retrying ? "Retrying…" : "Retry" }}
      </button>
    </div>
  </div>
</template>
