import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../../src/style.css'
import RestFilm from './RestFilm.vue'
try { localStorage.setItem('tb:kidAvatarHintSeen', '1') } catch (e) {}
createApp(RestFilm).use(createPinia()).mount('#app')
