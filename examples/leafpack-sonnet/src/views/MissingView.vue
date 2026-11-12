<template>
  <div class="max-w-[1100px] mx-auto px-3 md:px-5 py-10">
    <div class="kt-v2-card py-10 px-4 text-center">
      <span class="i-carbon-unknown text-4xl muted opacity-60" aria-hidden="true" />
      <h1 class="mt-2 text-base font-semibold">That page does not exist</h1>
      <p class="mt-1 text-sm muted">Check the address, or start from the home page.</p>
      <div class="mt-4 flex justify-center gap-2">
        <RouterLink to="/" class="btn-primary">Go home</RouterLink>
        <RouterLink to="/browse" class="btn-secondary">Browse plugins</RouterLink>
      </div>
    </div>
  </div>
</template>
