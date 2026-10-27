import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../../src/style.css'
import RankFilm from './RankFilm.vue'
try { localStorage.setItem('tb:kidAvatarHintSeen', '1') } catch (e) {}
createApp(RankFilm).use(createPinia()).mount('#app')
