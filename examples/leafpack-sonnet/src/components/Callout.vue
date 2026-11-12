<script setup>
const props = defineProps({ type: { type: String, default: "note" }, title: { type: String, default: "" } })
const icons = { note: "i-carbon-information", tip: "i-carbon-checkmark-outline", warn: "i-carbon-warning-alt", danger: "i-carbon-warning" }
</script>

<template>
  <aside class="kt-callout" :class="`kt-callout--${type}`" :role="type === 'danger' ? 'alert' : 'note'">
    <div class="kt-callout__title"><span :class="icons[type]" aria-hidden="true" />{{ title || type }}</div>
    <p><slot /></p>
  </aside>
</template>
