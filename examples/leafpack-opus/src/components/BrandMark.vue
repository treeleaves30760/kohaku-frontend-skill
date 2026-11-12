<script setup>
defineProps({ small: Boolean })
</script>

<template>
  <!-- Leafpack is not a Kohaku-named product, so no Kohaku wordmark: a round
       iolite mark with a white Carbon icon for the domain + a one-tone name. -->
  <span class="inline-flex items-center gap-2">
    <span
      class="rounded-full bg-iolite text-white grid place-items-center shrink-0"
      :class="small ? 'w-5 h-5' : 'w-7 h-7'"
      aria-hidden="true"
    >
      <span class="i-carbon-sprout" :class="small ? 'kt-text-micro' : 'kt-text-body'" />
    </span>
    <span class="font-semibold text-warm-800 dark:text-warm-100" :class="small ? 'kt-text-caption' : 'kt-text-body'">Leafpack</span>
  </span>
</template>
