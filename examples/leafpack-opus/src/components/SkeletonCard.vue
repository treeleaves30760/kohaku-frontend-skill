<template>
  <!-- First-load placeholder for an empty catalog grid only. Static (no pulse):
       the "Loading…" status line above the grid says work is happening. -->
  <div class="card p-4 flex flex-col gap-3" aria-hidden="true">
    <div class="flex items-center gap-3">
      <div class="lp-skel w-10 h-10 !rounded-lg" />
      <div class="flex-1 flex flex-col gap-2">
        <div class="lp-skel h-3.5 w-[55%]" />
        <div class="lp-skel h-2.5 w-[75%]" />
      </div>
    </div>
    <div class="lp-skel h-3 w-full" />
    <div class="lp-skel h-3 w-[88%]" />
    <div class="flex gap-1.5">
      <div class="lp-skel h-4 w-14 !rounded-full" />
      <div class="lp-skel h-4 w-10 !rounded-full" />
    </div>
  </div>
</template>
