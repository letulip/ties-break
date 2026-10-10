import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { initPwa } from './pwa'
import { installErrorBuffer } from './errorBuffer'
import { setReportBridge, type ReportBridge } from './feedback'
import { installGlobalSfx } from './audio/sfx'
import { startArtPreloader } from './art/autoPreload'
import AppRoot from './AppRoot.vue'
import './style.css'

// The feedback report's error ring (src/errorBuffer.ts) starts before anything else, so a boot
// failure is in the tail too. Memory only: no storage, no network.
installErrorBuffer()
// ⚠ The shells' one contact with src (app-shells spec §S3): a wrapper defines window.__TIES_SHELL_BRIDGE__ before the bundle runs; no shell is named here.
const shellBridge: unknown = Reflect.get(window, '__TIES_SHELL_BRIDGE__')
if (typeof shellBridge === 'function') setReportBridge(shellBridge as ReportBridge)
initPwa()
// Enable audio on the first user gesture anywhere + a quiet click cue on primary controls.
installGlobalSfx()

// AppRoot = the first-run language prompt in front of App.vue (spec §3.4); it is the whole of what changed here.
createApp(AppRoot).use(createPinia()).mount('#app')

// R11-9: warm her age band's portraits (Kid screen + the finale splash) as soon as a career is
// loaded, so a popup never renders ahead of its art. Must come after the pinia install – the
// watcher reads the game store. See src/art/preload.ts for the caching story.
startArtPreloader()

// L4-3 – THE LQA RUNNER'S WINDOW HOOK, IN THE LQA BUILD ONLY. `VITE_TB_LQA` is a build-time switch (the sibling of VITE_TB_SW):
// `vite build` rewrites the read into a literal, the branch is dead in a player's bundle and the dynamic import below is never
// emitted. The hook it installs is READ-ONLY – the miss counter of src/i18n, nothing else (src/i18n/lqa.ts).
if (import.meta.env.VITE_TB_LQA === 'on') void import('./i18n/lqa').then((m) => m.installLqaHook())
