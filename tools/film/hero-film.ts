import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../../src/style.css'
import HeroFilm from './HeroFilm.vue'
createApp(HeroFilm).use(createPinia()).mount('#app')
