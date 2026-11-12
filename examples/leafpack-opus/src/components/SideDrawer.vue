<script setup>
// Left drawer for phones: w-72 max-w-[85vw], scrim, body scroll lock, Esc
// closes (capture phase, so it wins over page shortcuts), focus moves in and
// returns to the opener.
import { nextTick, ref, watch, onBeforeUnmount } from "vue"

const props = defineProps({ open: Boolean, label: { type: String, required: true } })
const emit = defineEmits(["update:open"])
const panel = ref(null)
let opener = null

const close = () => emit("update:open", false)
function onKey(e) {
  if (e.key === "Escape") {
    e.preventDefault()
    e.stopPropagation()
    close()
  }
}
watch(
  () => props.open,
  async (open) => {
    document.body.style.overflow = open ? "hidden" : ""
    if (open) {
      opener = document.activeElement
      window.addEventListener("keydown", onKey, true)
      await nextTick()
      panel.value?.focus()
    } else {
      window.removeEventListener("keydown", onKey, true)
      opener?.focus?.()
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  document.body.style.overflow = ""
  window.removeEventListener("keydown", onKey, true)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="lp-fade">
      <div v-if="open" class="fixed inset-0 z-40 bg-black/40" aria-hidden="true" @click="close" />
    </Transition>
    <Transition name="lp-slide">
      <div
        v-if="open"
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        tabindex="-1"
        class="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col bg-[var(--v2-panel)] border-r border-solid border-[var(--v2-line-strong)] outline-none"
      >
        <div class="h-12 shrink-0 flex items-center gap-2 pl-4 pr-2 border-b border-solid border-[var(--v2-line)]">
          <span class="kt-text-body font-semibold text-warm-800 dark:text-warm-100 flex-1">{{ label }}</span>
          <button type="button" class="btn-icon !w-10 !h-10" :aria-label="`Close ${label.toLowerCase()}`" title="Close (Esc)" @click="close">
            <span class="i-carbon-close" aria-hidden="true" />
          </button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto bg-inherit pb-[env(safe-area-inset-bottom)]">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
