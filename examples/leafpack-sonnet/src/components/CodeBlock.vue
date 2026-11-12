<script setup>
import { computed } from "vue"
import { highlight } from "../lib/highlight.js"
import CopyButton from "./CopyButton.vue"
const props = defineProps({ code: { type: String, required: true }, lang: { type: String, default: "text" } })
const html = computed(() => highlight(props.code.replace(/^\n|\n\s*$/g, ""), props.lang))
const plain = computed(() => props.code.replace(/^\n|\n\s*$/g, ""))
</script>

<template>
  <div class="relative">
    <pre class="kt-code" :data-lang="lang" tabindex="0"><code v-html="html" /></pre>
    <CopyButton :text="plain" label="Copy" class="!absolute top-1.5 right-1.5 !h-8 md:!h-7" />
  </div>
</template>
