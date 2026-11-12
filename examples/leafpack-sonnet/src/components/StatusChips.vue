<script setup>
// verified -> sage with a check (done / passed); deprecated -> amber with a warning (needs a look).
defineProps({ plugin: { type: Object, required: true } })
</script>

<template>
  <span
    v-if="plugin.deprecated"
    class="chip-amber"
    title="The publisher no longer maintains this plugin. Check the notice for a replacement."
  >
    <span class="i-carbon-warning-alt" aria-hidden="true" /> deprecated
  </span>
  <span
    v-if="plugin.verified"
    class="chip-sage"
    title="Leafpack confirmed the publisher's identity and reviewed the manifest permissions."
  >
    <span class="i-carbon-checkmark-filled" aria-hidden="true" /> verified
  </span>
</template>
