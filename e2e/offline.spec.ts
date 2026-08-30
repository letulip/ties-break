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

import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test, expect } from './careerAt'
import { answerOpeningKnock, dismissTourBriefing, onScreenWeek, weekButton } from './journey'

/**
 * Every painting the build ships, as the URLs a page would ask for.
 *
 * ⚠ READ OFF DISK, NOT LISTED HERE. A hand-written list is a fixture that agrees with itself: it
 * would keep passing after somebody dropped a new age band into `public/images/` and it would keep
 * passing if the precache glob stopped matching that band. This walks the directory the build
 * copies, so the claim below is "every file that SHIPS", however many that is on the day.
 */
function shippedArtUrls(): string[] {
  const root = fileURLToPath(new URL('../public/images', import.meta.url))
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) =>
      readdirSync(`${root}/${d.name}`)
        .filter((f) => f.endsWith('.webp'))
        .map((f) => `/images/${d.name}/${f}`),
    )
}

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
// ⚠ THE DIAGNOSIS BELOW IS STILL EXACTLY RIGHT AND THE ARRANGEMENT IT DESCRIBES IS GONE – read it
// as history, and read the block after it for what this test asserts today (29.08).
//
// THE BLACK PLATE IS A PICTURE THAT WAS NEVER FETCHED, and offline it can never be fetched again.
// `vite.config.ts` KEPT all of `public/images/**` out of the precache (`globIgnores`) and served it
// through a CacheFirst RUNTIME route, so a file was in the cache if and only if something asked for
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
// =================================================================================================
// ⭐⭐ ROUND 29 PART TWO #7 – «надо сделать, чтобы можно было полностью оффлайн играть без помех»
// =================================================================================================
//
// HE OVERTURNED #2's ANSWER, and this test had to grow the same distance. #2 kept the art out of the
// install and warmed the feed's eight weeks at runtime, so what could honestly be claimed was "the
// cards he is looking at have pictures". His ruling is stronger and simpler: everything is in the
// install, so NOTHING may be missing – including art nobody has warmed, on a screen he has not
// opened, in a week he has not played yet.
//
// So the test below now makes three claims where it made one, and the middle one is the ruling:
//
//   1. the install carried the art, and no runtime warm did – `tb-art-v1` is not even created;
//   2. with the network cut, EVERY painting the build ships answers from cache, all 205 of them,
//      not merely the handful this career's feed happens to draw;
//   3. and he can PLAY there: advance a week, cross the worker boundary, and open two art-bearing
//      screens with no blank plates on either.
//
// ⚠ CLAIM 2 IS THE ONE THAT NEEDED THE PRECACHE and no warm could ever have satisfied it. A cold
// install has asked for nothing; under #2's arrangement all but a handful of those fetches would
// have failed. Mutating it is one line – put `globIgnores: ['**/images/**']` back in vite.config.ts
// and this test names the ~200 URLs that stopped answering.
test('the whole art set is on the device, and the game plays, with the network cut', async ({
  page,
  context,
  careerAt,
}) => {
  // ⚠ 'junior' AND NOT 'pro', FOR ONE REASON THAT IS ABOUT THE FEED. `pro` sits on W49, so its
  // eight-week horizon is three off-season weeks and the turn of the year; `junior` sits mid-season
  // (week 120), which is a feed with tournaments in it - and a tournament card is the whole subject.
  // The count assertion below refuses to let this pass on a feed that has none either way.
  const { facts } = await careerAt('junior')
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

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
  //
  // ⚠⚠ RE-AIMED 29.08 AND POINTED AT THE OTHER CACHE, WHICH IS THE CHANGE. This poll used to wait
  // for `tb-art-v1` – the CacheFirst RUNTIME cache – to hold something, because under #2 a warm was
  // the only way art reached the device. That cache no longer exists: the route is deleted and the
  // precache answers first, so the old assertion would now hang until it timed out and reported the
  // fix as a regression. Deleting it would have thrown away the claim; it is inverted instead, and
  // the pair is stronger than either half was.
  const artInPrecache = async () =>
    page.evaluate(async () => {
      const name = (await caches.keys()).find((n) => n.startsWith('workbox-precache'))
      if (!name) return -1
      const keys = await (await caches.open(name)).keys()
      return keys.filter((r) => new URL(r.url).pathname.includes('/images/')).length
    })
  await expect
    .poll(artInPrecache, { message: 'the install did not carry the art – see round 29 part two #7' })
    .toBeGreaterThan(200)

  // ...AND NOTHING WARMED IT. `tb-art-v1` is not empty, it is absent: nothing creates it any more,
  // which is how this run proves the art came from the INSTALL rather than from a page that had
  // been online. `dropLegacyArtCaches` would delete it if a previous build had left one behind.
  expect(
    await page.evaluate(() => caches.has('tb-art-v1')),
    'a runtime art cache was created – something is still warming art behind the precache',
  ).toBe(false)

  await context.setOffline(true)
  await page.reload()
  const networkIsDown = await page.evaluate(() =>
    fetch(`/offline-probe-${Date.now()}`, { cache: 'no-store' }).then(
      () => false,
      () => true,
    ),
  )
  expect(networkIsDown, 'the network was still reachable - this run proves nothing').toBe(true)

  // --- CLAIM 2: EVERY PAINTING, not the ones this feed happens to draw -----------------------------
  //
  // ⚠ THIS IS THE RULING, AND IT IS ASKED THE ONLY WAY IT CAN BE ANSWERED: 205 fetches with the
  // network gone. Anything that comes back is a file the install put there, because nothing else
  // could have. The failures are NAMED rather than counted, so a red run says which set broke –
  // a bare "12 missing" would send the next reader back to the browser to find out which twelve.
  const shipped = shippedArtUrls()
  expect(shipped.length, 'public/images is empty - this run proves nothing').toBeGreaterThan(150)
  const unreachable = await page.evaluate(
    async (urls) =>
      (
        await Promise.all(
          urls.map(async (u) => {
            try {
              return (await fetch(u)).ok ? null : u
            } catch {
              return u
            }
          }),
        )
      ).filter((u): u is string => u !== null),
    shipped,
  )
  expect(
    unreachable,
    `${unreachable.length} of ${shipped.length} paintings are not on the device offline`,
  ).toEqual([])

  // --- CLAIM 3: and he can PLAY there ------------------------------------------------------------
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

  // ⚠ AND A SECOND ART-BEARING SCREEN, BECAUSE ONE SCREEN IS ONE SCREEN. The trophy cabinet draws
  // from `images/trophies/`, a set no preloader has ever warmed - `art/preload.ts` warms portraits,
  // the coach and the journey frame, and `art/feedArt.ts` warms the feed. Under #2's arrangement
  // this screen offline was blank plates by construction, and nobody had looked.
  await page.getByRole('navigation').getByRole('button', { name: 'Trophies' }).click()
  const cabinet = page.locator('img.trophy-art')
  await expect.poll(() => cabinet.count()).toBeGreaterThan(0)
  await expect
    .poll(() => cabinet.evaluateAll((nodes) => nodes.every((n) => (n as HTMLImageElement).complete)))
    .toBe(true)
  const blankCabinet = await cabinet.evaluateAll((nodes) =>
    nodes
      .filter((n) => (n as HTMLImageElement).naturalWidth === 0)
      .map((n) => new URL((n as HTMLImageElement).src).pathname),
  )
  expect(blankCabinet, 'the trophy cabinet rendered black plates offline').toEqual([])

  // ⚠ AND A WEEK IS ADVANCED, WHICH IS THE HALF HIS RULING ASKED FOR THAT #2's TEST DID NOT COVER:
  // «полностью оффлайн ИГРАТЬ». One click here is the whole machine with no network under it – the
  // RPC into a real Web Worker, a real engine tick, an IndexedDB autosave, and a snapshot coming
  // back that repaints the screen. Same sequence week-advance.spec.ts owns online, plug pulled.
  //
  // ⚠ IT GOES LAST, AND THAT IS NOT TIDINESS. `junior` is entered for the week ahead, so her tick
  // opens the tournament flow – a full-screen overlay whose body intercepts pointer events, and the
  // first draft of this test put the advance BEFORE the two screens and spent thirty seconds
  // retrying a nav click underneath it. The art assertions want a quiet app; the tick is the last
  // thing that happens here.
  await page.getByRole('navigation').getByRole('button', { name: 'Home' }).click()
  await expect(weekButton(page)).toBeEnabled()
  await weekButton(page).click()
  // The week the manifest says she was on, plus one, rendered the way the app renders it. And the
  // rest she was given is in the diary – the answer went in, the world moved, the snapshot came
  // back. None of those three is possible from cached HTML alone.
  await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()
  await expect(page.getByText(/Resting the /)).toBeVisible()

  expect(crashes, 'the app threw while playing offline').toEqual([])
})
