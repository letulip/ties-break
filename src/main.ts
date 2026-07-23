import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { initPwa } from './pwa'
import App from './App.vue'
import './style.css'

initPwa()

createApp(App).use(createPinia()).mount('#app')
