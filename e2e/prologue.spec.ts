// ⭐⭐ THE CHILDHOOD PROLOGUE, IN A REAL BROWSER – phase 4 of
// docs/specs/childhood-prologue-build-2026-09.md §5 and §6.
//
// WHAT IT CLAIMS, and it is the half no other layer can make: that the DEFAULT path into a career
// works end to end. `tests/component/prologue-two-paths.test.ts` walks the same nine cards with the
// worker stubbed away, so the one thing it can never say is that a real `postMessage` round trip
// happened – and the whole of phase 4's wiring lives on the far side of that boundary. Here the nine
// years cross it, `createWorld` spends them, and the rose the handover draws is one a real Web
// Worker built and shipped back.
//
// ⚠ THIS IS NOW THE FIRST THING EVERY NEW PLAYER MEETS. `smoke.spec.ts` owns the other branch – it
// takes the way out on the first card and walks the six-step wizard exactly as it always has.
//
// ⚠⚠ NOT ONE SENTENCE OF THE PROLOGUE APPEARS IN THIS FILE, AND NOT ONE MODULE OF IT IS IMPORTED.
// Two rules meet here and they point the same way:
//
//   1. §8 – every word of the nine cards and of the handover is a DRAFT the owner has not read. A
//      spec that addressed a control by its label would hold a second copy of a string he is
//      expected to rewrite, and would go red on a table edit that broke nothing.
//   2. tsconfig.e2e.json – this project lists only DEPENDENCY-FREE files, and its own note says the
//      day one of them grows an import «is the signal to stop, not to add another line below». The
//      card table reaches `shared/protocol` and the run reaches `engine/economy`, so importing them
//      would drag the engine into a second type-check and into every Playwright worker.
//
// So the walk is STRUCTURAL. What it addresses is the shape of the screen rather than its words, and
// every step names what it is relying on:
//
//   * a card is a `role="dialog"` with one heading and a column of buttons;
//   * an answer is a button, and the second one is the road that buys her the most (the table's
//     options run cheap-first, which is what makes «the second» a road and not a coin flip);
//   * the way out sits LAST, after the answers – a structural fact, because round-20 #3's
//     measurement reads it off the card's bottom edge;
//   * and the handover is the one screen in the flow that carries a PICTURE, which is what tells
//     the walk it has arrived.
//
// The button COUNT is asserted on every card, so a control appearing or vanishing reddens here
// instead of quietly changing which one this walk clicks.
//
// ⚠ NO `waitForTimeout`. Every step is an action or a web-first assertion.
import { test, expect, type Page } from '@playwright/test'

/** "This device has been onboarded" - App.vue's one durable record, written by the tour's dismiss
 *  and, since phase 5, by the prologue reaching its end. Spelled out here rather than imported from
 *  `careerAt.ts`: this spec boots the real app from nothing and takes none of the fixture
 *  machinery, and one key name is a cheaper duplicate than that whole dependency. */
const TOUR_SEEN_KEY = 'tb:onboardingTourSeen'

/** ⚠ THE NINE CARDS, AS A SHAPE. Four of them carry no decision (ages 5, 6, 7 and 13 – the count is
 *  the owner's, §3) and five do, and card 5 also carries the family's origin and the way out. So the
 *  control count per card is the sequence below, and it is asserted rather than assumed: it is the
 *  only thing standing between «clicked the second answer» and «clicked whatever was second». */
const CONTROLS_PER_CARD = [4, 1, 1, 2, 2, 2, 2, 2, 1]

/** Walk the nine cards, taking the second answer wherever there is one. */
async function walkTheChildhood(page: Page): Promise<void> {
  for (const [index, expected] of CONTROLS_PER_CARD.entries()) {
    const card = page.getByRole('dialog')
    const heading = await card.getByRole('heading').textContent()
    const buttons = card.getByRole('button')
    await expect(buttons, `card ${index + 1} does not have the controls it should`).toHaveCount(expected)

    // The second control on a card that has one; the only control on a quiet year. On card 1 that is
    // the second family origin, which is the middle-class house – the background every other layer
    // measures this prologue against.
    await buttons.nth(expected > 1 ? 1 : 0).click()

    // ⚠ AND THE CARD REALLY CHANGED. Without this a click that landed on nothing would be invisible
    // until the walk ran out of cards, and the failure would name the wrong step.
    if (index < CONTROLS_PER_CARD.length - 1) {
      await expect(page.getByRole('dialog').getByRole('heading')).not.toHaveText(heading ?? '')
    }
  }
}

test('the nine cards run, the handover draws her, and going on starts the career', async ({ page }) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  await page.goto('/')
  await page.getByRole('button', { name: 'Tap to start' }).click()

  // --- the prologue is the DEFAULT (§6) ---------------------------------------------------------
  // No save in this profile, so the app opens on the childhood rather than on the wizard. The
  // wizard's own heading is the assertion that says which branch this is, and it is the one string
  // this file may name: it is the owner's SHIPPED copy, not the prologue's draft.
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Raise a Champion. Together.' }),
    'the wizard is the OTHER branch and must not be what a new player lands on',
  ).toHaveCount(0)

  await walkTheChildhood(page)

  // --- the handover (§5) ------------------------------------------------------------------------
  const handover = page.getByRole('dialog')
  await expect(handover).toBeVisible()

  // 1. THE FORMED ROSE, drawn by the shipped radar off a snapshot a real worker built – and it is
  //    what tells this walk it has arrived: no card in the flow carries a picture.
  await expect(handover.getByRole('img')).toBeVisible()

  // 2. THE COACH'S READ. ⚠ THE BAND IS THE CAREER'S, so the spec cannot know which of his sentences
  //    it will be. What it can say is the thing §5 actually asks for: he speaks, and NO NUMBER
  //    reaches his mouth. Asserted over the WHOLE card, which is stronger than isolating his
  //    paragraph – the only digits allowed on this screen are the money, §2.4's total, once.
  const screen = ((await handover.textContent()) ?? '').replace(/\s+/g, ' ').trim()
  expect(screen.length, 'the handover is empty').toBeGreaterThan(80)
  expect((screen.match(/\$/g) ?? []).length, `the money is not said exactly once: ${screen}`).toBe(1)
  const figures = screen.match(/[\d,]*\d/g) ?? []
  expect(figures.length, `a number on this screen is not the money: ${figures.join(' | ')}`).toBe(1)

  // 3. THE HONEST CHOICE – two controls, and the game says NOTHING about rerolling, odds or a floor
  //    (his ruling, §2.3). The words below are a denylist and not a transcription: none of them may
  //    appear whatever the owner rewrites the screen to say.
  const answers = handover.getByRole('button')
  await expect(answers).toHaveCount(2)
  for (const word of ['reroll', 're-roll', 'odds', 'chance', 'random', 'seed', 'restart', 'retry', 'potential']) {
    expect(screen.toLowerCase().includes(word), `"${word}" is on the handover`).toBe(false)
  }

  // --- and the career is hers -------------------------------------------------------------------
  // The FIRST control is the one that goes on with her. ⚠ AND IF THAT EVER STOPS BEING TRUE THIS
  // TEST FAILS RATHER THAN LYING: the other control drops the career and returns to the first card,
  // so week 1 would never render below.
  await answers.first().click()

  // Week 1, painted off a Snapshot the worker built from a world the prologue's nine years were
  // spent on. This is the assertion the whole file exists for: the round trip happened.
  await expect(page.getByRole('heading', { name: /^W1 \d{4} · /, level: 1 })).toBeVisible()
  await expect(page.getByText(/career started \(seed "/)).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()

  // --- ⭐⭐ §6 C: ...AND NO TOUR (phase 5) -------------------------------------------------------
  //
  // His ruling is B and C together: B for the player who SKIPS the prologue, C for the player who
  // plays it, and after C «В уже не будет». C is not something built beside the tour - it is the
  // nine cards doing their job. A player who has just been walked through the interface does not
  // then need eleven coach marks explaining the same screen.
  //
  // ⚠ ASSERTED AFTER THE SHELL IS UP, NEVER BEFORE. `toHaveCount(0)` is true of a page that has not
  // rendered yet, so this is a green that means nothing if it runs before the nav exists. The three
  // assertions above are what make the absence below a fact: the shell is on screen, the marks
  // render in the same tick as the shell, and they are not there.
  await expect(
    page.getByRole('button', { name: 'Skip tour' }),
    'a player who walked the childhood is shown the tour as well',
  ).toHaveCount(0)
  await expect(page.locator('.coach-tooltip')).toHaveCount(0)

  // ⚠ AND FOR GOOD, which is a claim about what was WRITTEN DOWN rather than about this render.
  // `tourWanted` offers the marks to any device that has never answered them for as long as the
  // career sits at week 0, so a prologue that merely happened to be quiet here would meet them on
  // the next boot. The key is the one the dismiss writes: "this device has been onboarded" is a
  // single durable fact, and finishing the childhood is one of the ways of acquiring it.
  expect(await page.evaluate((k) => localStorage.getItem(k), TOUR_SEEN_KEY)).toBe('1')

  await page.reload()
  await page.getByRole('button', { name: 'Tap to start' }).click()
  await expect(page.getByRole('heading', { name: /^W1 \d{4} · /, level: 1 })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Skip tour' }),
    'the tour came back on the next boot of a career that started in the prologue',
  ).toHaveCount(0)

  expect(crashes, 'the app threw while the prologue ran').toEqual([])
})
