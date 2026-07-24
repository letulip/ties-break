import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { initPwa } from './pwa'
import { installGlobalSfx } from './audio/sfx'
import App from './App.vue'
import './style.css'

initPwa()
// Enable audio on the first user gesture anywhere + a quiet click cue on primary controls.
installGlobalSfx()

createApp(App).use(createPinia()).mount('#app')
