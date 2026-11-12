import { ref, onMounted, onBeforeUnmount } from "vue"
import { useRoute } from "vue-router"
import { fetchPlugins } from "./data/plugins.js"

// Loads the registry list. A refresh keeps the previous data on screen and a slower
// earlier load never overwrites a newer one.
export function usePluginList() {
  const route = useRoute()
  const plugins = ref([])
  const loading = ref(true)
  const error = ref("")
  const loadedAt = ref(null)
  let seq = 0
  async function load() {
    const my = ++seq
    loading.value = true
    error.value = ""
    try {
      const data = await fetchPlugins({ fail: String(route.query.fail || "") })
      if (my !== seq) return
      plugins.value = data
      loadedAt.value = new Date().toISOString()
    } catch (e) {
      if (my !== seq) return
      error.value = e.message
    } finally {
      if (my === seq) loading.value = false
    }
  }
  onMounted(load)
  onBeforeUnmount(() => seq++)
  return { plugins, loading, error, loadedAt, reload: load }
}
