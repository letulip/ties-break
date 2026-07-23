// PWA service-worker registration in 'prompt' mode (see vite.config registerType).
// A new build no longer silently takes over; instead `needRefresh` flips true and
// App.vue shows an Update banner that calls applyUpdate() -> updateSW(true).
import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

/** True when a new service worker is waiting to activate. */
export const needRefresh = ref(false)

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined

export function initPwa(): void {
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      needRefresh.value = true
    },
  })
}

/** Activate the waiting worker and reload once it takes control. */
export function applyUpdate(): void {
  needRefresh.value = false
  void updateSW?.(true)
}
