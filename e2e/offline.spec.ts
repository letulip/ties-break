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
import { answerOpeningKnock, dismissTourBriefing, onScreenWeek } from './journey'

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

// =================================================================================================
// ⭐⭐ ROUND 29 #2 – «у меня в ленте через одну черные плашки в сезоне»
// =================================================================================================
//
// THE BLACK PLATE IS A PICTURE THAT WAS NEVER FETCHED, and offline it can never be fetched again.
// `vite.config.ts` keeps ALL of `public/images/**` out of the precache (`globIgnores`) and serves it
// through a CacheFirst RUNTIME route, so a file is in the cache if and only if something asked for
// its URL while there was a network. The Season feed's tournament cards each bind a DIFFERENT court
// (`art/venues.ts` – one photograph per event, forever), so every card he had not already scrolled
// past was a URL nothing had ever requested. The quiet weeks in between bind the same handful of
// frames over and over (`training`, the three off-season paintings), so those were long since warm –
// which is the whole of «через одну»: the pattern is tournament / quiet / tournament / quiet.
//
// ⚠ WHY THIS CANNOT BE A MOUNTED TEST. `happy-dom` does not fetch an `<img src>` at all, and a unit
// test of the preloader can only prove that a URL was HANDED to `new Image()`. What is claimed here
// is that the file is on the device – i.e. that a real service worker, a real CacheFirst route and a
// real cut network answer with bytes. That needs this project and no other.
test('the season feed keeps its pictures with the network cut', async ({
  page,
  context,
  careerAt,
}) => {
  // ⚠ 'junior' AND NOT 'pro', FOR ONE REASON THAT IS ABOUT THE FEED. `pro` sits on W49, so its
  // eight-week horizon is three off-season weeks and the turn of the year; `junior` sits mid-season
  // (week 120), which is a feed with tournaments in it - and a tournament card is the whole subject.
  // The count assertion below refuses to let this pass on a feed that has none either way.
  await careerAt('junior')

  // The worker installs on the first visit and takes the page on the second (see above).
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  await page.reload()
  await page.getByRole('button', { name: 'Tap to start' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true)

  // ⚠ SEASON IS NOT OPENED WHILE THE NETWORK IS UP, and that is the point of the test rather than an
  // omission. Opening it would fetch every picture through the worker by hand and prove only that an
  // `<img>` works. What a player has is a career he ticked on the train: the art must already be on
  // the device BEFORE the tab that shows it is ever opened.
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const cache = await caches.open('tb-art-v1')
          return (await cache.keys()).length
        }),
      { message: 'nothing warmed the runtime art cache while the network was up' },
    )
    .toBeGreaterThan(0)

  await context.setOffline(true)
  await page.reload()
  const networkIsDown = await page.evaluate(() =>
    fetch(`/offline-probe-${Date.now()}`, { cache: 'no-store' }).then(
      () => false,
      () => true,
    ),
  )
  expect(networkIsDown, 'the network was still reachable - this run proves nothing').toBe(true)

  await page.getByRole('button', { name: 'Tap to start' }).click()
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)
  await page.getByRole('navigation').getByRole('button', { name: 'Season' }).click()
  await expect(page.getByRole('heading', { name: 'Season Planner' })).toBeVisible()

  // ⚠ THE TOURNAMENT CARDS ARE THE SUBJECT, so their presence is asserted before their pictures are.
  // The quiet weeks share four frames between them and were never the reported defect; a run whose
  // feed happened to hold no tournament would pass this test while proving nothing.
  const courtImages = page.locator('.event-art img')
  await expect.poll(() => courtImages.count()).toBeGreaterThan(0)

  // Every card in the feed carries exactly one painting. `naturalWidth === 0` on a `complete` image
  // is the browser saying it has no pixels - the black plate, asked about directly.
  const feedImages = page.locator('.event-art img, .week-art img')
  await expect
    .poll(() =>
      feedImages.evaluateAll((nodes) => nodes.every((n) => (n as HTMLImageElement).complete)),
    )
    .toBe(true)

  const blank = await feedImages.evaluateAll((nodes) =>
    nodes
      .filter((n) => (n as HTMLImageElement).naturalWidth === 0)
      .map((n) => new URL((n as HTMLImageElement).src).pathname),
  )
  expect(blank, 'these feed cards rendered a black plate offline').toEqual([])
})
