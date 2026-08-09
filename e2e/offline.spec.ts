// JOURNEY: THE APP RUNS WITH THE NETWORK CUT.
//
// SEAM OWNED: #3, the service worker - and it is the seam nothing in this repo had ever touched.
// The app's entire promise is "offline-first PWA"; until this spec, that promise was verified by
// reading `vite.config.ts`. There is no unit test that can hold it: a service worker is a second
// JavaScript context installed by a browser, precaching a real build over a real HTTP server, and
// then answering `fetch` for a page that no longer has a network.
//
// ⚠ THIS SPEC RUNS AGAINST A DIFFERENT BUILD FROM EVERY OTHER SPEC, and that is deliberate. The rest
// of the suite is served from a build made with `VITE_TB_SW=off`, because a worker activating
// mid-run, a precache serving the previous build to the next spec, and an update banner landing on a
// control a test was about to click are three races that produce red runs with nothing wrong in the
// code. `playwright.config.ts` therefore serves a SECOND production build on its own port with the
// switch left alone, and the `chromium-sw` project pins this file to it. The smoke spec asserts the
// other build registers NO worker; this one asserts this build does. Between them the two builds are
// proven to be the two things they claim to be.

import { test, expect } from './careerAt'
import { onScreenWeek } from './journey'

test('after one visit the app boots with the network cut, and the career is still there', async ({
  page,
  context,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  const { facts } = await careerAt('junior')

  // --- the worker installs ----------------------------------------------------------------------
  // `ready` resolves once there is an ACTIVE registration for this scope - i.e. the worker has
  // installed and precached the build. This is the assertion the smoke spec makes in reverse.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))

  // ⚠ ...AND THEN DOES NOT TAKE THE PAGE, WHICH IS `registerType: 'prompt'` BEING CORRECT. Workbox
  // only claims open clients when it is allowed to skip waiting, and this app deliberately does not:
  // a new build must never reload itself underneath a player mid-week (src/pwa.ts's whole header).
  // So the first visit installs the worker and the SECOND visit is served by it. That is the real
  // behaviour a player gets, and a spec that cut the network after one load would be testing a
  // browser that had simply not finished yet.
  await page.reload()
  await page.getByRole('button', { name: 'Tap to start' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true)

  // --- now cut the network ----------------------------------------------------------------------
  await context.setOffline(true)
  await page.reload()

  // ⚠ THE NETWORK IS REALLY GONE, ASKED RATHER THAN ASSUMED. `navigator.onLine` was the obvious
  // probe and it is the wrong one - it stayed `true` under `setOffline`, which is a known
  // rough edge and not evidence of anything either way. So this asks the only question that cannot
  // lie: a fetch for a path nothing precached. `navigateFallback` covers navigations, not this, so
  // it goes to the network - and offline, the network rejects.
  const networkIsDown = await page.evaluate(() =>
    fetch(`/offline-probe-${Date.now()}`, { cache: 'no-store' }).then(
      () => false,
      () => true,
    ),
  )
  expect(networkIsDown, 'the network was still reachable - this run proves nothing').toBe(true)

  // And the page in front of it came up anyway. Without a worker this reload would have landed on
  // the browser's own "no internet" page and there would be no splash to click at all.
  await page.getByRole('button', { name: 'Tap to start' }).click()

  // And the career is intact: IndexedDB is local storage, but reaching it needs the app, the worker
  // bundle and the module graph to have all been served from cache first.
  await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Home' })).toBeVisible()

  expect(crashes, 'the app threw while running offline').toEqual([])
})
