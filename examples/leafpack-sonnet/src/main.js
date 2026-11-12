import "virtual:uno.css"
import "./styles/tokens.css"
import "./styles/base.css"
import "./styles/app.css"
import { createApp } from "vue"
import App from "./App.vue"
import router from "./router.js"
import { initTheme } from "./lib/theme.js"

initTheme()
createApp(App).use(router).mount("#app")
