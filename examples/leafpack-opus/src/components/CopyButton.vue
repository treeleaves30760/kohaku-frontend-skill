<script setup>
// Copy to clipboard: the icon swaps to a sage check + "Copied" for 1.5s.
// On failure, says what to do instead.
import { ref, onBeforeUnmount } from "vue"

const props = defineProps({
  text: { type: String, required: true },
  label: { type: String, default: "Copy" },
  iconOnly: Boolean,
})
const state = ref("idle") // idle | copied | failed
let t = null

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text)
    state.value = "copied"
  } catch {
    state.value = "failed"
  }
  clearTimeout(t)
  t = setTimeout(() => (state.value = "idle"), state.value === "failed" ? 4000 : 1500)
}
onBeforeUnmount(() => clearTimeout(t))
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg kt-text-caption transition-colors"
    :class="[
      iconOnly ? 'btn-icon' : 'h-7 px-2 hover:bg-warm-200/60 dark:hover:bg-warm-700/40',
      state === 'copied'
        ? '!text-sage-shadow dark:!text-sage-light'
        : state === 'failed'
          ? '!text-coral'
          : 'text-warm-600 dark:text-warm-300',
    ]"
    :title="state === 'failed' ? 'Copy failed — select and copy manually' : label"
    :aria-label="label"
    @click="copy"
  >
    <span :class="state === 'copied' ? 'i-carbon-checkmark' : state === 'failed' ? 'i-carbon-warning-alt' : 'i-carbon-copy'" aria-hidden="true" />
    <span v-if="!iconOnly">{{ state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy" }}</span>
    <span class="sr-only" role="status">{{ state === "copied" ? "Copied to clipboard" : state === "failed" ? "Copy failed — select and copy manually" : "" }}</span>
  </button>
</template>
