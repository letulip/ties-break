import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../../src/style.css'
import WeekFilm from './WeekFilm.vue'

// ⚠ A ONE-TIME COACH MARK, NOT GAME STATE. HomeScreen shows "Tap the photo - her page lives here"
// until it is dismissed, and it persists in localStorage per device (never in the save). Marking it
// seen keeps a first-run hint out of the frame without touching anything the engine owns.
try { localStorage.setItem('tb:kidAvatarHintSeen', '1') } catch (e) {}
createApp(WeekFilm).use(createPinia()).mount('#app')
