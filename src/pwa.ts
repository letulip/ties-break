// PWA service-worker registration in 'prompt' mode (see vite.config registerType).
// A new build no longer silently takes over; instead `needRefresh` flips true and
// App.vue shows an Update banner that calls applyUpdate() -> updateSW(true).
//
// ⚠ AND IT HAS TO GO LOOKING FOR THE NEW BUILD, WHICH IT DID NOT (31.07). The owner merged a wave,
// the deploy ran, and his phone kept showing the previous app. Every server-side link was checked
// and every one was correct: main carried the code, GitHub Pages served an index.html pointing at
// the new bundle, that bundle contained the new screen, and sw.js precached exactly it. The break
// was here.
//
// `registerSW` asks the server for a new worker WHEN IT IS CALLED, and it is called once, at
// startup. A browser tab re-registers on every navigation, so it self-heals; an app installed to a
// home screen and left in the app switcher does not navigate for days. It never asks again, the
// waiting worker is never discovered, `onNeedRefresh` never fires, the banner never renders - and
// the old precache serves the old app indefinitely. 'prompt' mode makes this worse than
// 'autoUpdate' would, because there is no silent takeover to paper over the missed check.
//
// So the registration now looks for a new build in the two situations where one can appear:
//
//   1. ON RETURN TO THE FOREGROUND. This is the case that actually bites a phone - the app is
//      resumed rather than launched, which is exactly when a fresh check is both cheap and most
//      likely to find something.
//   2. ON A TIMER, for the session that stays open all evening. An hour is deliberately unhurried:
//      a check is one conditional request for sw.js, and noticing an update forty minutes late
//      costs nothing, while a chatty interval on a metered phone is a real cost.
//
// ⚠ NEITHER PATH FORCES ANYTHING. `registration.update()` only asks; if a new worker is found it
// goes through the same `onNeedRefresh` -> banner -> the player taps Update. The rule that a build
// must never reload the app underneath him (registerType 'prompt') is untouched - this only makes
// sure the question gets asked.
import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

/** True when a new service worker is waiting to activate. */
export const needRefresh = ref(false)

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined

/** How often a session that never leaves the foreground re-asks. See the header for why an hour. */
export const UPDATE_CHECK_MS = 60 * 60 * 1000

export function initPwa(): void {
  // ⚠ THE E2E BUILD DOES NOT REGISTER THE WORKER, AND THAT IS THIS LINE (S0, 08.08).
  //
  // Everything above describes a worker that installs itself, precaches the app and one day raises a
  // banner the player must answer. Every one of those is a race an end-to-end run can lose: a worker
  // activating between `goto` and the first assertion, a precache serving the PREVIOUS build to the
  // next spec, and an update prompt landing on top of the control a test was about to click. The
  // suite would then go red for reasons that have nothing to do with the code - the exact failure
  // mode .github/workflows/simulation.yml already ruled against.
  //
  // What is NOT done: the plugin still runs and `sw.js`, the manifest and the precache manifest are
  // all still built and served, so the artefact under test stays the production artefact. Only the
  // registration call is withheld. And nothing here ships as a test branch: `import.meta.env` is
  // inlined at BUILD time, so a player's bundle contains the registration and no switch at all.
  //
  // ⚠ IT IS A SWITCH, NOT A DELETION. S2's update-flow spec needs the worker back ON, and it gets
  // there by building without this variable - see e2e/README.md, "The service worker".
  if (import.meta.env.VITE_TB_SW === 'off') return

  updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // A check can reject offline, on a flaky connection, or while another update is in flight.
      // None of those are worth surfacing: the next resume asks again, and an unhandled rejection
      // here would be a console error on a phone for a request nobody asked for.
      const check = (): void => void registration.update().catch(() => {})
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      setInterval(check, UPDATE_CHECK_MS)
    },
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
