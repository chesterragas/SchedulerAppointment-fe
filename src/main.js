import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import store from './store/index.js'
import './styles/main.scss'

const app = createApp(App)
app.use(store)
app.use(router)
app.mount('#app')
