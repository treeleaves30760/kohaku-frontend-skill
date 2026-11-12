import { createRouter, createWebHashHistory } from "vue-router"

// Every view has a URL (hash routing): #/, #/browse?q=&cat=&sort=&fail=1,
// #/plugin/<id>?tab=versions, #/docs/<page>.
export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "home", component: () => import("./views/HomeView.vue") },
    { path: "/browse", name: "browse", component: () => import("./views/BrowseView.vue") },
    { path: "/plugin/:id", name: "plugin", component: () => import("./views/PluginView.vue"), props: true },
    { path: "/docs/:page?", name: "docs", component: () => import("./views/DocsView.vue"), props: true },
    { path: "/:rest(.*)*", name: "missing", component: () => import("./views/MissingView.vue") },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    // Only reset scroll when the path changes, not when a query hook (tab, sort) changes.
    if (to.path !== from.path) return { top: 0 }
    return false
  },
})
