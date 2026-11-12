// One ordered list drives the sidebar, prev/next and routing. Each page is a component.
export const DOC_GROUPS = [
  {
    id: "guides",
    label: "Guides",
    pages: [
      { id: "publishing", title: "Publishing a plugin", summary: "From an empty folder to a listing on Leafpack in about ten minutes.", load: () => import("./Publishing.vue") },
      { id: "versioning", title: "Versions and deprecation", summary: "Ship updates, yank a bad release and retire a plugin without breaking installs.", load: () => import("./Versioning.vue") },
    ],
  },
  {
    id: "reference",
    label: "Reference",
    pages: [
      { id: "manifest", title: "Manifest reference", summary: "Every field in leaf.plugin.json and what Leafpack does with it.", load: () => import("./Manifest.vue") },
    ],
  },
]
export const DOC_PAGES = DOC_GROUPS.flatMap((g) => g.pages.map((p) => ({ ...p, group: g.label })))
