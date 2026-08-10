// JOURNEY: A LETTER IS OPENED, SIGNED, AND THE CONTRACT TURNS UP ON THE MONEY SCREEN.
//
// SEAMS OWNED: #1 (the Web Worker boundary) and #5 (real input - an overlay, a two-view sheet, and a
// confirm on the one irreversible thing in it).
//
// WHY NO CHEAPER LAYER REACHES IT, and this journey has a sharper answer than most because the engine
// rule under it changes TWO things at once. `signOffer` does not only sign the letter it was given:
// it walks every other open kit offer and refuses it, because a player in one brand's kit is in
// nobody else's. That is a term on the paper and a line in the engine, and it means one press has to
// be observable on a letter the player never touched. A mounted `InboxSheet` is handed its offers as
// a prop, so it can only ever show what a test already decided; there is nothing on the other side of
// it to close the second letter. Then the SAME command produces `snapshot.kitDeal`, which is computed
// engine-side and rendered by a different screen - the two are one round trip or they are nothing.
//
// ⚠ THIS IS GAP 8.4, THE ONE THE COVERAGE DOCUMENT CALLED THE MOST VALUABLE UNCOVERED JOURNEY. It
// was never blocked by a defect - only by time - and the fixture has been ready since the set was
// built: `pro` sits inside the sponsor window holding two unopened kit letters.
//
// ⚠ WHAT IS DELIBERATELY NOT ASSERTED: the terms. What a rung is worth, how many seasons it runs, how
// the allowance is spent down and what happens when it empties are all engine arithmetic, owned by
// `tests/offers.test.ts` and the sponsor bench, and re-deriving any of it here would be a slower copy
// of a test that exists. What is asserted is that a signature crossed the boundary and came back as
// a contract two surfaces agree about.

import { test, expect } from './careerAt'
import { answerOpeningKnock, openMoney } from './journey'

/** A row in the inbox list that is still waiting on an answer. The pill is the engine's own fact -
 *  `live(o)` is `state === 'open' && week <= deadlineWeek` - so counting these counts OPEN OFFERS as
 *  the world sees them, not rows as the sheet drew them. */
const WAITING_ROW = { name: /Needs an answer/ }

test('signing a kit letter closes the whole table, and the deal reaches the money screen', async ({
  page,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  const { facts } = await careerAt('pro')
  await answerOpeningKnock(page)

  // --- the post ---------------------------------------------------------------------------------
  // The inbox is the second tool beside the bell on Home - no tab, no route, and the only door.
  await page.getByRole('button', { name: 'Open the inbox' }).click()

  // Two letters, both waiting. The number is the manifest's, so this is the fixture's own state
  // arriving on screen rather than a count typed in here - and it is the pre-state the whole test
  // turns on: a career with ONE open letter could not show that signing closes the others.
  expect(facts.openKitLetters, 'the pro fixture is meant to hold two unopened kit letters').toBe(2)
  await expect(page.getByRole('button', WAITING_ROW)).toHaveCount(facts.openKitLetters)
  await expect(page.getByRole('button', WAITING_ROW).first()).toBeVisible()

  // ⚠ THE SENDER IS READ OFF THE ROW, AND HAVING TO READ IT IS ITSELF A DEFECT REPORT (D13,
  // docs/specs/e2e-coverage.md §12). An inbox row is a `<button>` with no `aria-label`, so its
  // accessible name is its whole text content - letterhead, subject, filing week AND a countdown
  // ("4 weeks to decide") that the engine rewrites every week. There is therefore no stable name for
  // "the letter from X", and a spec cannot ask for one. The letterhead is the row's first line
  // (`senderOf`), so it is taken from there; when D13 is closed this becomes a name.
  const topRow = page.getByRole('button', WAITING_ROW).first()
  const brand = (await topRow.innerText()).split('\n')[0].trim()
  expect(brand, 'the top inbox row has no letterhead').not.toBe('')

  // --- one letter, open --------------------------------------------------------------------------
  await topRow.click()
  // The sheet is a two-view stack now: the list is gone and the paper is the only thing on it. The
  // back control is the app's one back control, and its presence is how this spec knows it is
  // looking at a letter rather than at the list it came from.
  await expect(page.getByRole('button', { name: 'Back to all letters' })).toBeVisible()
  await expect(page.getByText(new RegExp(`– ${brand}$`, 'm'))).toBeVisible()

  // --- signing, which the app gates ---------------------------------------------------------------
  await page.getByRole('button', { name: 'Sign', exact: true }).click()
  // The confirm restates the deal in the letter's own words and says the one thing the paper cannot
  // say for itself. Asserting the brand in it is what ties the signature to the letter that was
  // opened - without it, "a deal appeared" would be true of signing either of the two.
  await expect(page.getByText(new RegExp(`^Sign with ${brand}\\?`))).toBeVisible()
  await expect(page.getByText(/This cannot be undone\./)).toBeVisible()

  // ⚠ POSITIONAL, AND IT IS THE SECOND HALF OF DEFECT D13 RATHER THAN A PREFERENCE. The confirm's
  // button and the letter's own button are both called `Sign`, both live, both on screen together -
  // a strict-mode collision on the single irreversible control in this sheet. `ConfirmDialog` is
  // also one of the eight overlays still rendered as a roleless `<div>` (D1), so it cannot be scoped
  // by `getByRole('dialog')` either. Between the two, `.last()` - the confirm is a sibling mounted
  // AFTER the sheet, so it is the topmost of the pair - is the only reading left. Both halves are
  // filed; neither is worked around anywhere else.
  await page.getByRole('button', { name: 'Sign', exact: true }).last().click()

  // --- 1. the letter she signed -------------------------------------------------------------------
  // ...and 2. THE ONE SHE NEVER TOUCHED. `signOffer` refuses every other open kit offer in the same
  // call, so the table empties from one press. This is the assertion the journey exists for: nothing
  // in the sheet could have produced it, and no fixture state satisfies it either - `pro` boots with
  // two waiting and has never been at zero.
  //
  // ⚠ MUTATION-VERIFIED: the `for (const other of offers)` loop deleted from `signOffer` -> this
  // line goes red with `Expected: 0 / Received: 1`, and everything else in the test still passes.
  // That gap between "the letter I signed changed" and "the table cleared" is the rule.
  await page.getByRole('button', { name: 'Back to all letters' }).click()
  await expect(page.getByRole('button', WAITING_ROW)).toHaveCount(0)
  await expect(page.getByText('Nothing waiting on an answer.')).toBeVisible()

  // --- 3. and the contract exists on a different screen -------------------------------------------
  // `snapshot.kitDeal` is computed by the engine off the signed offer; MoneyScreen prices nothing and
  // names nothing, it renders that. So a running allowance on the Bills tab is the signature having
  // become a term of the world - and the fixture has `hasActiveKitDeal: false`, so this row cannot
  // have been there before.
  expect(facts.hasActiveKitDeal, 'the pro fixture is meant to start with no deal running').toBe(false)
  await page.getByRole('button', { name: 'Close' }).click()
  await openMoney(page)
  await page.getByRole('group', { name: 'Which part of the budget' })
    .getByRole('button', { name: 'Bills' })
    .click()
  // The allowance row is a named group (D5's fix turned `StatRow` into `role="group"` with a name
  // from its label, meta and value), so the sponsor's running balance is askable for by name. The
  // figures inside it are the engine's and are not asserted.
  await expect(page.getByRole('group', { name: /^Allowance left this season/ })).toBeVisible()
  // ...and it is HER sponsor's, which is what carries the brand from the letter across two screens.
  await expect(page.getByText(brand, { exact: true })).toBeVisible()

  expect(crashes, 'the app threw while signing a sponsor letter').toEqual([])
})
