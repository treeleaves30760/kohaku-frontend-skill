<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import AppHeader from "./components/AppHeader.vue"
import AppFooter from "./components/AppFooter.vue"
import SideDrawer from "./components/SideDrawer.vue"
import NavList from "./components/NavList.vue"

const route = useRoute()
const router = useRouter()
const drawerOpen = ref(false)

// ?drawer=1 opens the phone drawer for one load (screenshot / link hook).
watch(
  () => route.query.drawer,
  (v) => {
    if (v === "1") drawerOpen.value = true
  },
  { immediate: true },
)
// Close on the outcome (navigation happened), not on any click inside.
watch(
  () => route.path,
  () => (drawerOpen.value = false),
)
watch(
  () => route.meta.title,
  (t) => (document.title = t && t !== "Home" ? `${t} · Leafpack` : "Leafpack · plugins for your agents"),
  { immediate: true },
)

// Ctrl/⌘+K always wins, even inside inputs: focus the plugin search on this
// page, or go to Browse and focus it there.
function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault()
    const input = document.querySelector("[data-search]")
    if (input) {
      input.focus()
      input.select()
    } else router.push({ name: "browse", query: { focus: "1" } })
  }
}
function skipToMain() {
  document.getElementById("main")?.focus()
}
onMounted(() => window.addEventListener("keydown", onKey))
onBeforeUnmount(() => window.removeEventListener("keydown", onKey))
</script>

<template>
  <button
    type="button"
    class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-lg focus:bg-iolite focus:text-white"
    @click="skipToMain"
  >
    Skip to content
  </button>
  <div class="min-h-dvh flex flex-col">
    <AppHeader @open-menu="drawerOpen = true" />
    <main id="main" tabindex="-1" class="flex-1 outline-none">
      <RouterView />
    </main>
    <AppFooter />
  </div>
  <SideDrawer v-model:open="drawerOpen" label="Menu">
    <NavList />
  </SideDrawer>
</template>
