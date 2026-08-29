import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../../src/style.css'
import MoneyFilm from './MoneyFilm.vue'
try { localStorage.setItem('tb:kidAvatarHintSeen', '1') } catch (e) {}
createApp(MoneyFilm).use(createPinia()).mount('#app')
