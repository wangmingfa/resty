import { createPinia } from 'pinia'
import { createApp } from 'vue'
import BreakApp from './BreakApp.vue'
import './breakApp.css'

const app = createApp(BreakApp)
app.use(createPinia())
app.mount('#break-app')
