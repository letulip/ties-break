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
