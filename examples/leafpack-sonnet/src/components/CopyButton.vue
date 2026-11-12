<script setup>
import { ref } from "vue"
const props = defineProps({ text: { type: String, required: true }, label: { type: String, default: "Copy" } })
const state = ref("idle") // idle | copied | failed
let timer
async function copy() {
  try {
    await navigator.clipboard.writeText(props.text)
    state.value = "copied"
  } catch {
    // Fallback for non-secure contexts: select a hidden textarea.
    try {
      const ta = document.createElement("textarea")
      ta.value = props.text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand("copy")
      ta.remove()
      state.value = ok ? "copied" : "failed"
    } catch {
      state.value = "failed"
    }
  }
  clearTimeout(timer)
  timer = setTimeout(() => (state.value = "idle"), state.value === "failed" ? 3500 : 1500)
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center justify-center gap-1.5 h-9 md:h-7 px-2.5 rounded-lg text-xs font-medium border border-solid border-[var(--v2-line-strong)] bg-[var(--v2-card)] hover:border-iolite/50 transition-colors focus-visible:outline-2 focus-visible:outline-iolite focus-visible:outline-offset-2"
    :class="state === 'copied' ? 'text-sage-shadow dark:text-sage-light' : state === 'failed' ? 'text-coral-shadow dark:text-coral-light' : 'text-warm-700 dark:text-warm-200'"
    :aria-label="label"
    :title="state === 'failed' ? 'Copy failed — select and copy manually' : 'Copy to clipboard'"
    @click="copy"
  >
    <span v-if="state === 'copied'" class="i-carbon-checkmark" aria-hidden="true" />
    <span v-else-if="state === 'failed'" class="i-carbon-warning" aria-hidden="true" />
    <span v-else class="i-carbon-copy" aria-hidden="true" />
    <span>{{ state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label }}</span>
    <span class="sr-only" role="status" aria-live="polite">{{ state === "copied" ? "Copied to clipboard" : state === "failed" ? "Copy failed" : "" }}</span>
  </button>
</template>
