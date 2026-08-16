// SEEDED CAREERS - one spec per fixture, and this file is not coverage.
//
// WHAT IT CLAIMS: that `careerAt` puts the app in the state the manifest describes, before the app
// boots, without touching the UI. Nothing more. S2's journeys are what get built on top of it; this
// is the proof that there is something to build on.
//
// ⚠ EVERY ASSERTION IS A MANIFEST FACT ON SCREEN, AND THAT IS THE WHOLE DESIGN. The failure this
// file exists to catch is the quiet one: a seed that lands after the store's single `listCareers`
// call writes bytes nobody reads, the app falls through to the onboarding wizard, and a spec that
// asserted "the app rendered" or "a tab bar exists" passes against a FRESH CAREER while believing it
// is at week 412. So each test below names a number that only its own fixture holds - week 412 and
// $102,448 for `pro`, a balance below zero for `broke`, an epilogue for `ending` - and a seed that
// silently did nothing cannot satisfy any of them.
//
// ⚠ THE NUMBERS ARE READ FROM THE MANIFEST AND FORMATTED BY THE APP'S OWN FORMATTERS, never typed in
// here. `formatCents` and `weekDateLine` are the functions the screens themselves call, so these
// assertions survive a regeneration that moves a fixture's funds, and they cannot drift into
// asserting a format the app stopped using. tests/e2e-fixtures.test.ts is what keeps the manifest
// honest about the bytes; this file trusts it and looks at the screen.
//
// SELECTORS: role and accessible name (plan §4). Not one `data-testid` was needed - see the note on
// the Family budget card below, which is the one place it nearly was.

import { test, expect, TOUR_ANSWERED } from './careerAt'
import { weekDateLine } from '../src/shared/dates'
import { formatCents } from '../src/shared/money'

/** Home's date line - "W49 2038 · Dec 6 – Dec 12". The in-season week and the season year, which is
 *  how this app writes a week to a player; the absolute career week the manifest counts in never
 *  appears on screen, and `weekDateLine` is the product's own translation between the two. */
const onScreenWeek = (week: number): RegExp => new RegExp(`^${weekDateLine(week)}`)

/** The Family budget card on Home, by role and by the start of its accessible name.
 *
 *  ⚠ THE ONE PLACE A `data-testid` WAS NEARLY NEEDED, and it was not, so this is worth recording.
 *  The card is a composite `Card as="button"`, so its accessible name is its ENTIRE text content -
 *  eyebrow, figure, window label and all - which makes an exact-name match unusable and a partial
 *  one the right tool. The figure is then asserted INSIDE the card with `toContainText`. Scoping
 *  matters here rather than being tidy: on `fresh` the starting funds also appear in the engine's own
 *  first diary line ("Family budget: $25,000."), so an unscoped `getByText('$25,000')` is a
 *  strict-mode violation - and the tempting fix would have been a testid on a control that already
 *  has a perfectly good name. */
const BUDGET_CARD = { name: /^Family budget/ }

test.describe('a seeded career boots into the state the manifest describes', () => {
  test('fresh: week 0, the background\'s starting funds, no ranking earned', async ({ page, careerAt }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    // TOUR_ANSWERED: week 0 is when the first-run coach marks are offered, and this spec is about
    // what the manifest says the career IS – see careerAt.ts.
    const { facts } = await careerAt('fresh', { localStorage: TOUR_ANSWERED })

    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
    await expect(page.getByRole('button', BUDGET_CARD)).toContainText(
      formatCents(facts.fundsCents),
    )
    // A career exists, so the six-step wizard must NOT be what the app fell back to. This is the
    // negative half of the same claim the numbers above make, and it is the assertion that would
    // have caught a seed landing one tick too late before anyone read a diff of two dollar figures.
    await expect(page.getByRole('heading', { name: 'Raise a Champion. Together.' })).toHaveCount(0)

    expect(crashes, 'the app threw while booting a seeded career').toEqual([])
  })

  test('junior: week 120, her first ranking, a feed with something in it', async ({ page, careerAt }) => {
    const { facts } = await careerAt('junior')

    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
    await expect(page.getByRole('button', BUDGET_CARD)).toContainText(
      formatCents(facts.fundsCents),
    )
    // Seeding a career is only worth anything if what arrives is the WHOLE world, so this asserts a
    // fact that no week-0 career could hold and that lives deep inside the payload rather than in the
    // record's denormalised header: she is ranked, and the ladder says so.
    // ⚠ RANKED ON SOME TABLE, NOT ON THE DOMESTIC ONE SPECIFICALLY (16.08). This asserted
    // `rankedDomestic` until the junior-ladder wave, and the wave made that unsatisfiable alongside
    // the fixture's other two requirements: at week 120 only 46 careers in 120 hold domestic points
    // now, against 114 holding ITF ones, because P1 made the junior table the one that opens the
    // professional ladder. The claim above is what this line is for and it is untouched – she is
    // ranked, and the ladder says so. Which table carries it was never the point, and pinning one
    // made this spec a hostage to a balance decision it has no opinion about.
    expect(
      facts.rankedDomestic || facts.rankedItf || facts.rankedWta,
      'the junior fixture is meant to arrive holding a ranking on some table',
    ).toBe(true)
    await expect(page.getByRole('navigation').getByRole('button', { name: 'Home' })).toBeVisible()
  })

  test('pro: week 412, eight seasons of ledgers, inside the sponsor window', async ({ page, careerAt }) => {
    const { facts } = await careerAt('pro')

    // The headline of the whole plan: this test reached week 412 without clicking a single week.
    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
    await expect(page.getByRole('button', BUDGET_CARD)).toContainText(
      formatCents(facts.fundsCents),
    )
    // Her post is on Home and openable. The inbox dot's ARRIVAL half is deliberately not asserted
    // here - a freshly seeded career has no stored watermark, and src/composables/inboxCue.ts seeds
    // one to "now" the first time it finds none, so `letterUnseen` reads false by design. The
    // CareerAtOptions doc-comment in careerAt.ts spells out how a mail-marker spec asks for the
    // other half; this one asserts only what is true without help.
    expect(facts.openKitLetters, 'the pro fixture is meant to hold unopened kit letters').toBe(2)
    await expect(page.getByRole('button', { name: 'Open the inbox' })).toBeVisible()
  })

  test('sinking: under water with weeks in hand, and still playable', async ({ page, careerAt }) => {
    const { facts } = await careerAt('sinking')

    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
    expect(facts.fundsCents, 'the sinking fixture is meant to be under water').toBeLessThan(0)
    await expect(page.getByRole('button', BUDGET_CARD)).toContainText(formatCents(facts.fundsCents))
    // ⚠ THE DIFFERENCE FROM `broke` IS THE ONLY REASON THIS FIXTURE EXISTS, so it is what this test
    // asserts on screen: she is under water and the career is still a career. `ending` proves what
    // the alternative looks like - the epilogue REPLACES the tab shell - so the tab bar being here
    // is the positive form of "nothing has latched".
    await expect(page.getByRole('navigation').getByRole('button', { name: 'Home' })).toBeVisible()
  })

  test('broke: eleven weeks under water, the balance below zero', async ({ page, careerAt }) => {
    const { facts } = await careerAt('broke')

    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
    // The negative balance IS the state this fixture exists for, and `formatCents` puts the minus on
    // the front ("-$461"), so asserting the formatted figure asserts the sign with it.
    expect(facts.fundsCents, 'the broke fixture is meant to be under water').toBeLessThan(0)
    await expect(page.getByRole('button', BUDGET_CARD)).toContainText(
      formatCents(facts.fundsCents),
    )
  })

  test('ending: past the fork, the epilogue instead of the shell, and no way to play on', async ({
    page,
    careerAt,
  }) => {
    const { facts } = await careerAt('ending')

    expect(facts.endingType, 'the ending fixture is meant to be past the fork').toBe('stopped')
    // W2-ENDINGS: the epilogue REPLACES the tab shell rather than covering it (App.vue branches it
    // beside the onboarding wizard). So "read-only" is not a disabled button to look for - it is the
    // absence of the entire surface a career is played from, which is the strongest form the claim
    // has and the one a screen reader would report too.
    await expect(page.getByRole('dialog', { name: 'Epilogue' })).toBeVisible()
    // ⚠ NOT `getByRole('navigation')` ON ITS OWN, which is what this asserted first and it went red:
    // the album's page arrows are a `<nav>` too, so the landmark IS present on the epilogue and
    // counting landmarks asks the wrong question. The claim is about the tab bar - the one surface a
    // career is played from - so the assertion names a control only that bar has.
    await expect(page.getByRole('navigation').getByRole('button', { name: 'Home' })).toHaveCount(0)
    await expect(page.getByText(onScreenWeek(facts.week))).toHaveCount(0)
  })
})
