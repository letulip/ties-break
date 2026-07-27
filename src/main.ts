import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { initPwa } from './pwa'
import { installGlobalSfx } from './audio/sfx'
import { startArtPreloader } from './art/autoPreload'
import App from './App.vue'
import './style.css'

initPwa()
// Enable audio on the first user gesture anywhere + a quiet click cue on primary controls.
installGlobalSfx()

createApp(App).use(createPinia()).mount('#app')

// R11-9: warm her age band's portraits (Kid screen + the finale splash) as soon as a career is
// loaded, so a popup never renders ahead of its art. Must come after the pinia install – the
// watcher reads the game store. See src/art/preload.ts for the caching story.
startArtPreloader()
