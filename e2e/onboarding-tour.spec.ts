// ⭐ 16.08 – A NEW PLAYER IS SHOWN THE INTERFACE, AND IT DOES NOT COME BACK ONCE THEY SAY SO.
//
// The owner, after handing the game to someone who had never played it: the onboarding that
// explained the functions and the interface used to exist and now it does not - the person saw
// nothing of the sort - and the interface is not the simplest.
//
// ⚠ IT WAS NEVER ABSENT FROM THE BUILD, WHICH IS WHY NOTHING CAUGHT IT. `smoke.spec.ts` has walked
// the wizard and clicked "Skip tour" since S0, and it passes: on a browser profile that has never
// seen the app, creates a career and answers the marks in one uninterrupted sitting, the tour is
// there. The gate was a ONE-SHOT - a non-persisted store flag (`firstEverCareer`) consumed by
// App.vue on the first snapshot transition of the session, whether or not the player ever answered
// what it opened. The only durable record was `tb:onboardingTourSeen`, written by the dismiss alone.
// So a first session that ended any other way - the phone backgrounding the tab, the player closing
// the app to come back later, a worker restart adopting the last committed week - left BOTH gates
// shut for the rest of that device's life, with nothing on screen to ask for it back.
//
// ⚠ WHICH SEAM THIS OWNS (e2e/README.md's six). #2, PERSISTENCE ACROSS A REAL RELOAD, and it is the
// only layer that can hold this claim: the defect is entirely about what survives a navigation, and
// `tests/component/` mounts one component at a time with no boot, no reload and no store to spend.
// The component's own half - what the marks say, that a player can walk and dismiss them, and that
// the card cannot leave a 375x667 phone - is `tests/component/onboarding-tour.test.ts`, and this
// spec deliberately does not repeat it.
//
// ⚠ AND IT RUNS ON THE SEEDED WEEK-0 CAREER, NOT THE WIZARD. The wizard walk is smoke.spec.ts's, and
// duplicating six clicks here would buy nothing: what the tour reacts to is a career being on
// screen, and `fresh` is a career on screen at week 0 with a cleared localStorage - a device that
// has never answered the marks, which is precisely the player in the report.
import { test, expect } from './careerAt'

const TOUR_SEEN_KEY = 'tb:onboardingTourSeen'

/** The card, addressed by the two controls that are the whole of "can I get out of this". */
const skipTour = 'Skip tour'

test.describe('the first-run tour of the interface', () => {
  test('a new player is shown it, can step through it, and can dismiss it', async ({ page, careerAt }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    await careerAt('fresh')

    // ⭐ THE OWNER'S SENTENCE, AS AN ASSERTION: a player who has never answered the tour meets it.
    await expect(page.getByRole('button', { name: skipTour })).toBeVisible()

    // ...and it explains the app rather than gesturing at it. The first mark says what the GAME is,
    // which is the half his playtester could not work out. Asserted here and not in the component
    // test because this is the string a player really meets, over the real Home screen.
    await expect(page.getByText('You do not play the matches')).toBeVisible()

    // STEPPING THROUGH IT. Each press must land on a different mark - a "Next" that quietly did
    // nothing would otherwise read as a green walk. Four presses, then the tour is asked where it
    // is: the count is deliberately not pinned to the number of steps, because adding a mark is a
    // copy decision and should not break the navigation claim.
    const next = page.getByRole('button', { name: 'Next', exact: true })
    for (const heading of ['Her page', 'News and letters', 'The money is yours', 'This week']) {
      await next.click()
      await expect(page.getByText(heading, { exact: true })).toBeVisible()
    }

    // DISMISSING IT. One tap, from the middle of the walk, and the marks are gone.
    await page.getByRole('button', { name: skipTour }).click()
    await expect(page.getByRole('button', { name: skipTour })).toBeHidden()
    // The screen underneath was never taken away - `.coach-tour` does not block - and it is Home.
    await expect(page.getByRole('heading', { name: /^W1 \d{4} · /, level: 1 })).toBeVisible()

    // AND IT IS RECORDED WHERE A RELOAD CAN SEE IT. This is the fact the old gate never had.
    expect(await page.evaluate((k) => localStorage.getItem(k), TOUR_SEEN_KEY)).toBe('1')

    expect(crashes, 'the app threw while the tour was on screen').toEqual([])
  })

  test('it does not come back on the next boot', async ({ page, careerAt }) => {
    await careerAt('fresh')
    await page.getByRole('button', { name: skipTour }).click()

    // A REAL RELOAD, which is the only way to ask this question honestly: the store is rebuilt from
    // nothing, the worker is respawned, the career is adopted from IndexedDB, and the only thing
    // that crosses the boundary is what was written down.
    await page.reload()
    await page.getByRole('button', { name: 'Tap to start' }).click()
    await expect(page.getByRole('heading', { name: /^W1 \d{4} · /, level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: skipTour })).toBeHidden()
  })

  // ⭐ THE DEFECT ITSELF, KEPT AS THE REGRESSION. This test fails on the code as it stood on 16.08.
  test('an interrupted first session does not lose it for ever', async ({ page, careerAt }) => {
    await careerAt('fresh')
    await expect(page.getByRole('button', { name: skipTour })).toBeVisible()

    // The player looks at the marks and puts the phone down without answering them. Nothing has been
    // written - which was the whole trap: the one-shot that opened this had already been spent.
    expect(await page.evaluate((k) => localStorage.getItem(k), TOUR_SEEN_KEY)).toBeNull()

    await page.reload()
    await page.getByRole('button', { name: 'Tap to start' }).click()
    await expect(page.getByRole('heading', { name: /^W1 \d{4} · /, level: 1 })).toBeVisible()
    await expect(
      page.getByRole('button', { name: skipTour }),
      'a player who never answered the tour must still be offered it',
    ).toBeVisible()
  })

  // ⭐⭐ THE 01.09 REPRODUCTION, IN THE BROWSER IT WAS MEASURED IN
  // (docs/specs/childhood-prologue-build-2026-09.md §6, phase 5).
  //
  // `.coach-tour` is `pointer-events: none` so the page beneath can scroll, which means the tap on
  // the bottom bar goes THROUGH the overlay and changes the screen under the marks. On `main` the
  // tour did not notice: tapping Stats and pressing Next four times walked all four of "You are the
  // parent", "Her page", "News and letters" and "The money is yours" while the player stood on
  // Stats, with no highlight cut into the overlay at all - every anchor those four name lives on
  // Home. The tour could never break VISIBLY; it just became untrue.
  //
  // ⚠ WHICH SEAM THIS OWNS, and it is why the claim is repeated here after
  // tests/component/onboarding-tour.test.ts has already made it: REAL INPUT AT A REAL SIZE. The
  // mounted test drives the `screen` prop, so the one thing it can never say is that a real tap on a
  // real tab, through a real click-through overlay, reaches the shell and moves it. That is the
  // whole mechanism of the defect.
  //
  // ⚠ AND THE FIX IS NOT A CLICK TRAP. The overlay is still click-through - Stats really does open
  // below - because the version that swallows the tap is the overloaded tour the owner refused. A
  // wrong tour becomes no tour, and the way back is the test below this one.
  test('⭐⭐ changing tab ends it, instead of describing a screen the player has left', async ({ page, careerAt }) => {
    await careerAt('fresh')
    await expect(page.getByRole('button', { name: skipTour })).toBeVisible()
    await expect(page.getByText('You do not play the matches')).toBeVisible()

    // THE TAP THE REPORT MADE. Not the tour's own control - a tab, underneath it.
    await page.getByRole('button', { name: 'Stats', exact: true }).click()

    // The marks are gone, and with them the only two controls they had: there is no Next to press
    // four times. Asserted by the button rather than by the card so the failure names what a player
    // would be looking at.
    await expect(
      page.getByRole('button', { name: skipTour }),
      'the tour is still up over a screen it does not describe',
    ).toBeHidden()
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toHaveCount(0)
    for (const mark of ['You do not play the matches', 'The bell is the week just gone']) {
      await expect(page.getByText(mark)).toHaveCount(0)
    }

    // AND STATS REALLY IS OPEN. The overlay never ate the tap and still does not - this is the half
    // that says the repair is "the tour stops", not "the tour blocks the app".
    await expect(page.getByRole('button', { name: 'Stats', exact: true })).toHaveAttribute('aria-current', 'page')

    // It ended the way Skip ends it: the device is marked, so the marks do not come back by
    // themselves on the next screen or the next boot. `tourWanted` is the gate; this is its input.
    expect(await page.evaluate((k) => localStorage.getItem(k), TOUR_SEEN_KEY)).toBe('1')
    await page.getByRole('button', { name: 'Home', exact: true }).click()
    await expect(page.getByRole('button', { name: skipTour })).toBeHidden()
  })

  // ⭐ THE OTHER HALF OF THE SAME RULING: ending the tour early is only acceptable because the
  // player can ask for it back. Same control as the test below, but reached from the NEW exit - a
  // re-arm that worked after Skip and not after this one would leave the phase-5 player stranded.
  test('...and More can still bring it back after the screen change took it away', async ({ page, careerAt }) => {
    await careerAt('fresh')
    await expect(page.getByRole('button', { name: skipTour })).toBeVisible()
    await page.getByRole('button', { name: 'Stats', exact: true }).click()
    await expect(page.getByRole('button', { name: skipTour })).toBeHidden()

    await page.getByRole('button', { name: 'Home', exact: true }).click()
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await expect(page.getByRole('group', { name: 'Which settings' })).toBeVisible()
    await page.getByRole('button', { name: 'Show the tour' }).click()

    // Back from the first mark, on Home, where the marks have something to point at.
    await expect(page.getByRole('button', { name: skipTour })).toBeVisible()
    await expect(page.getByText('You do not play the matches')).toBeVisible()
    await expect(page.getByRole('heading', { name: /^W1 \d{4} · /, level: 1 })).toBeVisible()
  })

  // The way back, for the player who skipped it by accident or came back a month later. It is a
  // navigation claim as much as a visibility one: the marks point at Home's furniture and at the
  // bottom bar, so asking for them from More has to move the player to Home.
  test('More can ask for it again after it has been dismissed', async ({ page, careerAt }) => {
    await careerAt('fresh')
    await page.getByRole('button', { name: skipTour }).click()
    await expect(page.getByRole('button', { name: skipTour })).toBeHidden()

    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await expect(page.getByRole('group', { name: 'Which settings' })).toBeVisible()
    await page.getByRole('button', { name: 'Show the tour' }).click()

    await expect(page.getByRole('button', { name: skipTour })).toBeVisible()
    // Back on Home, where the marks have something to point at.
    await expect(page.getByRole('heading', { name: /^W1 \d{4} · /, level: 1 })).toBeVisible()
  })
})
