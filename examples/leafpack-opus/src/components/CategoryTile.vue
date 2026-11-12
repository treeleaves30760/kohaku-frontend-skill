<script setup>
import { computed } from "vue"
import { categoryById } from "../data/categories.js"

const props = defineProps({
  category: { type: String, required: true },
  size: { type: String, default: "md" }, // sm 32 · md 40 · lg 64
})
const cat = computed(() => categoryById[props.category])
const box = { sm: "w-8 h-8 rounded-lg", md: "w-10 h-10 rounded-lg", lg: "w-16 h-16 rounded-xl" }
const glyph = { sm: "kt-text-body", md: "kt-text-title", lg: "text-3xl" }
</script>

<template>
  <span class="grid place-items-center shrink-0 text-white" :class="[box[size], cat?.tile]" aria-hidden="true">
    <span :class="[cat?.icon, glyph[size]]" />
  </span>
</template>
