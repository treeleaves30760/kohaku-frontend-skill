// Top-level destinations. One list feeds the header pills and the phone drawer.
export const navItems = [
  { to: { name: "home" }, name: "home", label: "Home", icon: "i-carbon-home" },
  { to: { name: "browse" }, name: "browse", label: "Browse", icon: "i-carbon-catalog", match: ["browse", "plugin"] },
  { to: { name: "docs" }, name: "docs", label: "Docs", icon: "i-carbon-book" },
]
export const isActive = (item, routeName) => (item.match || [item.name]).includes(routeName)
