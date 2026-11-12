import { createApp } from "vue"
import "virtual:uno.css"
import "./styles/tokens.css"
import "./styles/base.css"
import "./styles/app.css"
import App from "./App.vue"
import { router } from "./router.js"

createApp(App).use(router).mount("#app")
