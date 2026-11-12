<script setup>
// Plugin trust states. "verified" follows the marketplace's "official" chip
// (amber + check); "deprecated" follows the "yanked" precedent (coral + icon).
// Each carries an icon and a word, never colour alone.
defineProps({ plugin: { type: Object, required: true } })
</script>

<template>
  <span
    v-if="plugin.verified"
    class="chip-amber"
    title="Verified: the publisher's identity is confirmed and each release is built from a signed tag."
  >
    <span class="i-carbon-checkmark-filled" aria-hidden="true" />verified
  </span>
  <span
    v-if="plugin.deprecated"
    class="chip-coral"
    :title="`Deprecated: ${plugin.deprecated.reason} Use ${plugin.deprecated.replacement} instead.`"
  >
    <span class="i-carbon-warning-alt" aria-hidden="true" />deprecated
  </span>
</template>
