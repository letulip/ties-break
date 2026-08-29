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

/**
 * THE TWO RUNTIME ART CACHES THIS BUILD NO LONGER WRITES (round 29 part two #7).
 *
 * Until 29.08 `public/images/**` was kept OUT of the precache and served through two runtime
 * routes: `tb-art-v1` (CacheFirst, up to 80 paintings) and `tb-art-small-v1` (StaleWhileRevalidate,
 * up to 48 trophies and letterheads). His ruling put the art in the install instead, the routes are
 * gone from vite.config.ts, and nothing writes to either cache again.
 *
 * ⚠ NOTHING DELETES THEM EITHER, WHICH IS THE POINT OF THIS FUNCTION. Workbox's
 * `cleanupOutdatedCaches` prunes old PRECACHES and no more; a runtime cache it was never told about
 * survives every update forever. On a phone that installed before this build that is up to 128
 * entries of art – several MB – sitting unreferenced beside a 12 MB install, which is exactly the
 * cost his question was about.
 */
export const LEGACY_ART_CACHES = ['tb-art-v1', 'tb-art-small-v1']

/**
 * Delete those two caches, but ONLY once the precache demonstrably holds the art.
 *
 * ⚠ THE CONDITION IS THE WHOLE SAFETY ARGUMENT AND IT IS NOT DECORATION. With
 * `registerType: 'prompt'` a player can sit on the OLD worker for days – he has to tap Update. On
 * that worker the runtime routes are still live and `tb-art-v1` is still the only copy of a
 * painting he has; deleting it there would blank his feed offline until he accepted an update he
 * had not been offered yet. So the test is a positive fact about the replacement rather than a
 * guess about the version: if the precache is answering for `/images/`, the art is on the device
 * twice and one of the copies is garbage.
 *
 * Returns the names it actually deleted, which is what makes this testable without a browser.
 */
export async function dropLegacyArtCaches(store: CacheStorage | undefined = globalThis.caches): Promise<string[]> {
  // ⚠ THIS EARLY RETURN IS FOR THE TYPE CHECKER AND FOR THE READER, NOT FOR BEHAVIOUR – said out
  // loud because a mutation run proved it. Delete it and the function still returns `[]` on a
  // browser with no CacheStorage: `store.keys()` throws a TypeError that the `catch` below
  // swallows. So no test can distinguish the two, and `tests/round29p2-offline-install.test.ts`
  // asserts the outcome ("empty, never thrown") in one arm rather than pretending to cover both.
  if (!store) return []
  try {
    const names = await store.keys()
    const precache = names.find((n) => n.startsWith('workbox-precache'))
    if (!precache) return []
    const held = await (await store.open(precache)).keys()
    if (!held.some((r) => new URL(r.url).pathname.includes('/images/'))) return []
    const dropped: string[] = []
    for (const name of LEGACY_ART_CACHES) {
      if (names.includes(name) && (await store.delete(name))) dropped.push(name)
    }
    return dropped
  } catch {
    // A private window, a browser with storage blocked, a quota error mid-delete. None of them is
    // worth a console error on a phone for housekeeping nobody asked for.
    return []
  }
}

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

  // ⚠ EVERY BOOT, AND THE FUNCTION'S OWN PRECONDITION IS WHAT MAKES THAT SAFE – there is no
  // `onActivate` in this API to hang it on, and reaching for `onOfflineReady` would fire it only on
  // a first install, which is the one phone that has nothing to clean up. On a phone still running
  // the old worker the live precache is the old one, holds no `/images/` and the call deletes
  // nothing; the boot after he taps Update, it deletes both. A one-boot delay on housekeeping.
  void dropLegacyArtCaches()

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
