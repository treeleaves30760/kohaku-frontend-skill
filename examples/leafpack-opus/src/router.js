import { createRouter, createWebHashHistory } from "vue-router"
import HomeView from "./views/HomeView.vue"

// Hash routing so every view (and every state, via the query) has a URL that
// works on a static host and can be screenshotted: #/browse?cat=memory&fail=1
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView, meta: { title: "Home" } },
    { path: "/browse", name: "browse", component: () => import("./views/BrowseView.vue"), meta: { title: "Browse" } },
    { path: "/plugin/:id", name: "plugin", component: () => import("./views/PluginView.vue"), meta: { title: "Plugin" } },
    { path: "/docs/:page?", name: "docs", component: () => import("./views/DocsView.vue"), meta: { title: "Docs" } },
    { path: "/:rest(.*)*", name: "missing", component: () => import("./views/NotFoundView.vue"), meta: { title: "Not found" } },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash && to.name === from.name && to.path === from.path) return false
    if (to.name === from.name && to.path === from.path) return false // query-only change (filters, tabs)
    return { top: 0 }
  },
})
