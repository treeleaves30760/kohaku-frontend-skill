<script setup>
// Search input with a left icon, Esc to clear, IME-safe Enter.
const props = defineProps({ modelValue: { type: String, default: "" }, placeholder: { type: String, default: "Search plugins…" }, big: Boolean })
const emit = defineEmits(["update:modelValue", "submit"])
function onKey(e) {
  if (e.key === "Escape" && props.modelValue) {
    e.preventDefault()
    emit("update:modelValue", "")
  }
  if (e.key === "Enter" && !(e.isComposing || e.keyCode === 229)) emit("submit")
}
</script>

<template>
  <div class="relative w-full">
    <span class="i-carbon-search absolute left-3 top-1/2 -translate-y-1/2 muted pointer-events-none" aria-hidden="true" />
    <input
      data-search
      type="search"
      autocomplete="off"
      enterkeyhint="search"
      :value="modelValue"
      :placeholder="placeholder"
      aria-label="Search plugins"
      class="input-field pl-9 pr-8 appearance-none"
      :class="big ? '!h-11 text-base' : ''"
      @input="emit('update:modelValue', $event.target.value)"
      @keydown="onKey"
    />
    <button
      v-if="modelValue"
      type="button"
      class="absolute right-1 top-1/2 -translate-y-1/2 btn-icon !w-9 !h-9 md:!w-6 md:!h-6"
      aria-label="Clear search"
      title="Clear search (Esc)"
      @click="emit('update:modelValue', '')"
    >
      <span class="i-carbon-close" aria-hidden="true" />
    </button>
  </div>
</template>
