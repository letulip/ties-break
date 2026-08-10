// JOURNEY: THE DATABASE GOES WRONG, AND THE APP SAYS SO INSTEAD OF PRETENDING TO BE A NEW INSTALL.
//
// SEAM OWNED: #2, persistence across a real browser - and this is the half of seam #2 that the
// reload specs cannot reach, because they need storage to WORK. `fake-indexeddb` is not IndexedDB in
// the way that matters here: the two faults below are things the browser's own storage layer does to
// a real player, and neither is expressible as a stubbed rejection.
//
//   * A DATABASE AT A VERSION THIS BUILD CANNOT OPEN. IndexedDB refuses a downgrade with its own
//     `VersionError`, and that refusal is what `game.init()` turns into `phase === 'recovery'`.
//     Nothing below this layer can produce it: the rule lives in the browser, not in the app.
//   * A NEWEST AUTOSAVE GENERATION THAT DOES NOT SURVIVE ITS CHECKSUM. `readLatestAutosave` falls
//     back to the previous generation and reports `recovered: true`; the shell turns that into a
//     banner. The fall-back needs a real gzip, a real SHA-256 and a real worker on the other side of
//     a `postMessage` - a mounted test would have to hand itself the answer.
//
// WHY IT HAS TO BE HERE AND NOWHERE ELSE, said once for both:
//
//   1. `App.vue` CANNOT BE MOUNTED IN THE COMPONENT PROJECT AT ALL. It imports `src/pwa.ts`, which
//      imports the `virtual:pwa-register` module VitePWA injects at build time; under the component
//      runner that import does not resolve and the mount dies before a line renders. That is measured
//      and recorded in tests/a11y-banner-names.test.ts, which is why that file's claim is deliberately
//      the NEGATIVE one. The recovery screen and both banners live in `App.vue`, so this suite is the
//      only layer that can see any of them at all.
//   2. THE FAULT IS THE ENVIRONMENT, NOT THE WORLD. Every career below is an ordinary fixture the
//      engine played out; what is arranged is the DATABASE around it. See `StorageState` and
//      `AutosaveState` in e2e/careerAt.ts for why that keeps "found, not forged" intact.
//
// ⚠ NOT ASSERTED HERE: what `decompressWorld`'s guard chain does with bad bytes (unit owns every
// rule), what the migration ladder does with an old save (tests/goldenSaves.test.ts), or what the
// recovery screen looks like. The claim is that a storage fault REACHES the player as a decision.

import { test, expect } from './careerAt'
import { answerOpeningKnock, onScreenWeek } from './journey'
import { formatCents } from '../src/shared/money'

/** The three doors out of recovery, by the names on them. Named once because both tests below stand
 *  on the same screen, and because a door that quietly disappeared would otherwise be noticed by
 *  neither of them. */
const DOORS = ['Retry', 'Import a save file', 'Start a new career']

/** Home's Family budget card, scoped the way seeded-careers.spec.ts argues for: the card is a
 *  composite `Card as="button"` whose accessible name is its whole text, so the figure is asserted
 *  INSIDE it rather than loose on the page. */
const BUDGET_CARD = { name: /^Family budget/ }

test.describe('when the browser will not open the database', () => {
  test('a career behind an unopenable database becomes a screen with choices, not a fresh install', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    // Eight seasons of career, in a database this build cannot open. The RECORD is intact - that is
    // the point: everything the player owns is on the disk and none of it can be reached.
    await careerAt('pro', { storage: 'unreachable' })

    await expect(page.getByRole('heading', { name: "Saved games can't be reached" })).toBeVisible()

    // ⚠ THIS IS THE ASSERTION THE WHOLE PATH EXISTS FOR, and it is written as an ABSENCE because the
    // defect it guards was a false positive rather than a crash. `game.init()`'s own comment records
    // it: the old init probed the database through a helper that SWALLOWS a failed reply, so
    // "IndexedDB denied" arrived as "no careers here" and the app handed a player with years of
    // saves to the six-step onboarding wizard. Nothing looked broken. The first hint anything was
    // wrong came weeks later, when their new career failed to autosave over the old one.
    //
    // So: no wizard, and no splash either - a wordmark waiting on data that will never arrive is the
    // same lie told more slowly.
    //
    // ⚠ MUTATION-VERIFIED AGAINST THE HISTORICAL BUG ITSELF. `init()`'s `if (!res.ok)` arm was
    // changed back to `ready` (which is what swallowing the probe amounted to) -> this test goes red
    // on the heading, having been handed the onboarding wizard, which is precisely the report the
    // player never got.
    await expect(page.getByRole('heading', { name: 'Raise a Champion. Together.' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Tap to start' })).toHaveCount(0)

    // Three doors, each named. A recovery screen whose controls a reader cannot tell apart is a
    // dead end with buttons on it.
    for (const door of DOORS) {
      await expect(page.getByRole('button', { name: door, exact: true })).toBeEnabled()
    }

    // ⚠ AND THE BROWSER'S OWN SENTENCE REACHES THE PLAYER, WORD FOR WORD. `initError` is rendered
    // verbatim, and that is a deliberate product decision (`src/stores/game.ts`: "A failed probe now
    // lands in `recovery` with the actual error"): the app does not know why storage refused and
    // must not invent a reason. "The requested version (2) is less than the existing version (3)" is
    // IndexedDB's phrasing, not this app's, and there is no other way to see whether it survived the
    // trip from a worker's `openDB` rejection through a typed RPC to a paragraph on screen.
    //
    // ⚠ IT IS THE BROWSER'S WORDING AND SO IT IS THE BROWSER'S TO CHANGE. If a Chromium release
    // rewords `VersionError`, this line goes red - and that is the correct outcome rather than a
    // flake: the claim is precisely that the engine-room message is what a player is shown, so the
    // day it changes, somebody should read the new one. The stock explanation above it is the app's
    // own and is asserted separately, so the two cannot be confused for each other.
    await expect(page.getByText(/requested version/i)).toBeVisible()
    await expect(page.getByText(/The browser refused to open this game's storage/)).toBeVisible()

    // The promise the next test keeps.
    await expect(page.getByText(/Nothing has been deleted/)).toBeVisible()

    expect(crashes, 'the app threw while reporting that storage is unreachable').toEqual([])
  })

  test('Retry finds the career again once storage comes back - with no reload', async ({
    page,
    careerAt,
    storageComesBack,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts } = await careerAt('pro', { storage: 'unreachable' })

    // FIRST, THAT THE BROKEN WORLD IS REAL. Without this line the rest of the test would pass in an
    // app where storage was never broken at all - the same failure the reload specs avoid by
    // asserting `week + 1` instead of the seeded week. Establish the state only the fault produces,
    // then act, then assert the state only a genuine recovery produces.
    await expect(page.getByRole('heading', { name: "Saved games can't be reached" })).toBeVisible()

    // The environment comes back: the database is rebuilt at the version the app asks for, holding
    // the same product-written bytes. Nothing touches the app - it does not know this happened.
    await storageComesBack()

    // ⚠ A WITNESS THAT THE PAGE NEVER NAVIGATED, because "with no reload" is half the claim and an
    // unasserted half is a claim nobody is keeping. A reload would clear this property - and would
    // also make the test pass for the wrong reason, since a fresh document opens a fresh database
    // connection and could never exercise the bug this path exists for: `src/db/saves.ts` used to
    // MEMOISE its rejected open, so one denied open at boot poisoned every later call, Retry
    // included, until the tab was reloaded (W1-INTEGRITY-B / TB-06). Retry succeeding in a page that
    // has been alive the whole time is the only shape of evidence that fix has.
    //
    // ⚠ MUTATION-VERIFIED AGAINST THAT EXACT BUG: the `.catch` that clears `dbPromise` was removed
    // from `src/db/saves.ts` -> this test hangs on the splash below and fails, because Retry re-awaits
    // the dead promise and `init()` never settles. Nothing else in the suite noticed.
    await page.evaluate(() => {
      ;(window as unknown as { __tbSameDocument?: true }).__tbSameDocument = true
    })

    await page.getByRole('button', { name: 'Retry', exact: true }).click()

    // Storage answered, so the ordinary launch resumes: the splash, then the career.
    await page.getByRole('button', { name: 'Tap to start' }).click()

    // AND IT IS HER CAREER, not a career. Week 412 and eight seasons of funds both come off the
    // record that was behind the unopenable database the whole time - and neither is a number any
    // other exit from this screen could produce, which is what makes them the assertion. "Start a
    // new career" leads to the wizard and week 0; a silent re-seed is impossible (the init script's
    // one-shot is the database's own existence, and the database has just been rebuilt without it).
    // This is exactly what the screen promised: "Nothing has been deleted - if storage comes back,
    // your careers will still be here."
    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
    await expect(page.getByRole('button', BUDGET_CARD)).toContainText(formatCents(facts.fundsCents))
    // ...and the fault is gone rather than merely covered.
    await expect(page.getByRole('heading', { name: "Saved games can't be reached" })).toHaveCount(0)

    expect(
      await page.evaluate(
        () => (window as unknown as { __tbSameDocument?: true }).__tbSameDocument === true,
      ),
      'the page navigated, so this proves nothing about a live retry',
    ).toBe(true)

    expect(crashes, 'the app threw while recovering from an unreachable database').toEqual([])
  })
})

test('a damaged newest autosave falls back to the previous one, and the shell says which notice that is', async ({
  page,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  // Generation `b` is newer and one byte wrong; generation `a` is the career. See `AutosaveState`.
  //
  // ⚠ `junior` AND DELIBERATELY NOT `fresh`, WHICH IS THE SAME TRAP THE RELOAD SPECS AVOID. A week-0
  // career with the background's starting funds is EXACTLY what the onboarding wizard produces, so a
  // fall-back that silently did nothing and dropped the player into a new career would satisfy every
  // assertion below. Week 120 with two seasons of spending behind it is a state no fresh install can
  // reach, so there is one explanation for it being on screen.
  const { facts } = await careerAt('junior', { autosave: 'damaged' })

  // 1. THE FALL-BACK HAPPENED, AND IT IS SAID OUT LOUD. `recovered` is set inside the worker, by a
  //    SHA-256 that did not match, and travels to the shell on the snapshot. A silent fall-back
  //    would be the worse bug: the player would be a week behind and never told.
  await expect(page.getByText('Autosave was damaged – restored the previous one.')).toBeVisible()

  // 2. AND WHAT CAME BACK IS A REAL CAREER, not an empty shell that happens not to have crashed.
  //    Both numbers come out of the OLDER generation - the only readable bytes in the database - so
  //    this is the fall-back's output rather than any default the app could have reached alone.
  await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
  await expect(page.getByRole('button', BUDGET_CARD)).toContainText(formatCents(facts.fundsCents))

  // 3. THE NOTICE SAYS WHICH NOTICE IT IS (defect D11). Two strips can stack at the top of this
  //    shell and both used to carry a button that said `Dismiss` and nothing else - one shape, one
  //    position, one word, and a strict-mode collision the moment they were both up. Asserting the
  //    other one's ABSENCE is the half that makes this a claim about naming rather than about a
  //    label: on this screen there is exactly one banner, it answers to its own name, and the name
  //    the OTHER banner answers to reaches nothing. e2e/week-advance.spec.ts makes the mirrored
  //    claim from the stop toast's side, which is the only other place either name is reachable.
  //
  //    ⚠ MUTATION-VERIFIED AS A PAIR: both buttons in App.vue renamed back to `Dismiss` -> this line
  //    and its mirror in week-advance.spec.ts go red together, each on its own name, with the app
  //    otherwise working exactly as before. Two specs, two banners, one defect.
  await expect(page.getByRole('button', { name: 'Dismiss stop notice' })).toHaveCount(0)
  const dismiss = page.getByRole('button', { name: 'Dismiss autosave notice' })
  await expect(dismiss).toBeVisible()
  // `junior` boots holding a knock, which covers the page - see the long note on `answerOpeningKnock`
  // for why that is treated as a doorway here and asserted strictly in exactly one other spec.
  await answerOpeningKnock(page)
  await dismiss.click()
  await expect(page.getByText('Autosave was damaged – restored the previous one.')).toHaveCount(0)

  expect(crashes, 'the app threw while recovering a damaged autosave').toEqual([])
})
