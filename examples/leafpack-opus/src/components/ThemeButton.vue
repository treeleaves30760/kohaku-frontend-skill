<script setup>
import { computed } from "vue"
import { themePref, cycleTheme, themeMeta } from "../lib/theme.js"
const meta = computed(() => themeMeta[themePref.value])
</script>

<template>
  <button type="button" class="btn-icon touch-target" :title="meta.label" :aria-label="meta.label" @click="cycleTheme">
    <span :class="meta.icon" aria-hidden="true" />
  </button>
</template>
