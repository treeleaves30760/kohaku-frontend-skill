<script setup>
import { computed } from "vue"
import CopyButton from "./CopyButton.vue"
import { highlight } from "../lib/highlight.js"

const props = defineProps({ code: { type: String, required: true }, lang: { type: String, default: "" } })
const html = computed(() => highlight(props.code, props.lang))
</script>

<template>
  <div class="lp-code">
    <div class="lp-code__head">
      <span class="flex-1">{{ lang || "text" }}</span>
      <CopyButton :text="code" icon-only :label="`Copy ${lang || 'code'}`" />
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -- highlight.js escapes its input -->
    <pre tabindex="0"><code v-html="html" /></pre>
  </div>
</template>
