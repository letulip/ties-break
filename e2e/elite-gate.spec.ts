// JOURNEY: THE TOP RUNG IS EARNED – A LOCKED ELITE ROW, IN A REAL BROWSER, ON A REAL CAREER.
//
// SEAM OWNED: #5 (the screen reading the engine), with #1 (the worker boundary) carrying it. ⭐ THE
// ONE NEW CASE WAVE 5 T13 OWES for the elite gate (the owner's 29.08 rule: one e2e case per shipped
// mechanic), and ruling H names it in as many words: «e2e gains the locked-row case».
//
// WHAT ONLY THIS LAYER CAN SAY. Both halves of the mechanic are pinned below already – the engine's
// three surfaces swept in tests/wave5-elite-gate.test.ts, the screen's four readers mounted in
// tests/component/wave5-elite-gate-row.test.ts. What neither can say is that the number crosses the
// WORKER: the gate is evaluated inside the worker's world, travels as `CoachMarketRow.lockedPoints`
// through a structured clone, and is the thing a player's finger meets. A mounted component is handed
// a snapshot somebody constructed; this one is handed a career that a worker built from bytes.
//
// ⚠ THE BAR IS WRITTEN OUT, NOT IMPORTED. `ECONOMY.coach.eliteGate.minPoints` lives in the engine and
// tsconfig.e2e.json's own header forbids this project from reaching it («what must never be listed is
// anything that reaches the engine»). So 150 is longhand here – and the unit layer owns the claim
// that the constant IS 150, exactly as it owns the arithmetic behind `formatCents`.
const MIN_POINTS = 150

// ⚠ NO STRING BELOW IS THIS WAVE'S. «{n} pts short» and «locked, {n} ranking points short» were both
// written when the gate was built; the flip is what made them reachable by a player. They are
// transcribed here rather than imported for the same reason the plaque sentences are transcribed in
// tests/component/round21-coach.test.ts: a change to either has to be deliberate.
//
// -------------------------------------------------------------------------------------------------
// ⭐ THE ARMS, WRITTEN DOWN (the standing rule since wave 2). Each was made against the ENGINE, this
// file RUN in a real browser against it, and then reverted; the red assertion is named. Control green
// first, and again between each one.
//
//   A. `ECONOMY.coach.eliteGate.enabled` back to `false` – the flip undone.
//      -> RED, 1 of 2, in the FIRST test: no row carries «pts short» and the locked count is 0. The
//         second test stays GREEN, which is the separation that makes it a control rather than a
//         copy: `sinking` is above the bar and reads the same screen under either flag.
//   B. `coachMarket`'s `lockedPoints` pinned to `null` – the row surface alone.
//      -> RED, 1 of 2, same place and for the same reason as A. This page cannot tell the two apart,
//         and that is honest: from a finger's point of view they are the same screen.
//   C. the template's `:disabled` back to `r.current` alone – the BUTTON alone.
//      -> RED, 1 of 2, on `toBeDisabled()` only: the copy is still right and the name still says
//         locked, and the row is pressable. That is the R10-16 defect in its purest form, and this
//         is the assertion with eyes for it.
//   D. `rowLabel`'s locked arm dropped to the hire word.
//      -> RED, 1 of 2, on the accessible name alone – the sighted half of the screen is untouched,
//         which is exactly why the name is asserted separately from the action word.
//   E. ⭐ 16.09, FOR §4's RE-AIM: `rowLabel`'s OVER-BUDGET arm put back – round 42 #42 undone.
//      -> **RED, 1 of 3**, in the second test and naming the whole string it found:
//         «an Elite row does not end in its weekly cost and the hire word: "Magda Prochazka, Elite
//         tier, Great fit, $611 a week – over budget by $343"». The first and third cases stay
//         GREEN, which is the separation that makes it a control: they are about the LOCK, and the
//         lock is the refusal #42 deliberately kept.
//
// ⚠⚠ AND THE FIXTURE'S REACHABILITY IS ASSERTED BEFORE ANYTHING IS READ OFF THE SCREEN. Ruling O's
// second blind spot, one layer up: «a fixture that cannot reach the case is a green that means
// nothing». The facts are read from the MANIFEST, which is generated from the career itself, so no
// test here can go vacuous if a regeneration moves a fixture across the bar – it goes RED instead,
// naming the number. ⚠⚠ AND THAT IS EXACTLY WHAT HAPPENED ON 14.09, and the red was the RULING
// arriving rather than a defect: the owner re-ruled the gate's currency to the CAREER («это про
// КАРЬЕРУ, а не про неделю»), and `junior` – 0 live domestic points at week 120, which this file
// used as «below the bar» – turned out to hold a banked high-water of 251 on an ITF career whose
// domestic window had simply emptied behind her. Under the ruling her Elite rows are OPEN, this
// case's locked-row count read 0, and the fixture that honestly sits below the bar is `fresh`:
// week 0, no result ever played, so live and peak are BOTH 0 by construction and no regeneration
// can quietly separate them. `junior` moved to the third case, where being open is the assertion.

import type { Page } from '@playwright/test'
import { test, expect } from './careerAt'
import { answerOpeningKnock, dismissTourBriefing } from './journey'

/** The Coach Market's door on Home – the route a player uses, by role and accessible name (the same
 *  locator `e2e/stations.ts` walks). */
const COACH_NOTE = { name: 'Coach note – open the Coach Market' }

/** The market list lives behind the screen's second tab.
 *
 *  ⚠ PRESSED EXPLICITLY RATHER THAN RELIED ON. The screen opens on Coaches BY ITSELF for a career
 *  that has a coach (round-18 #3) – and `junior` has none: the player policy let him go before week
 *  120, so that career lands on «Her week» and the market is one press away. Discovered by this spec
 *  failing on a page whose own snapshot said «I coach her myself», which is a better reason to press
 *  the tab than tidiness: the route has to be the route from wherever the career actually is. */
async function openCoaches(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Coaches', exact: true }).click()
  await expect(page.getByRole('button', { name: /tier,/ }).first()).toBeVisible()
}

test.describe('the elite rung is locked until she has results', () => {
  test('fresh: below the bar, every Elite row says how far short and cannot be pressed', async ({
    page,
    careerAt,
  }) => {
    // ⚠ RE-AIMED 14.09 from `junior` by the owner's gate ruling – the header carries the story.
    // `fresh` is the one career that cannot drift across the bar: week 0, nothing ever played,
    // live and banked standing both 0 by construction.
    const { facts } = await careerAt('fresh')

    // 1 – THE FIXTURE REACHES THE STATE. Asserted from the manifest, before the screen is opened.
    expect(
      facts.domesticPoints,
      `fresh is meant to sit below the elite gate's ${MIN_POINTS}-point bar, at zero exactly`,
    ).toBe(0)
    const short = MIN_POINTS - facts.domesticPoints

    // 2 – the route a player takes. ⚠ THE DOORWAY FIRST: a fresh career boots into the onboarding
    // tour (the owner's first-run sentence), and the overlay intercepts Home until it is answered.
    await page.getByRole('button', { name: 'Skip tour' }).click()
    await page.getByRole('button', COACH_NOTE).click()
    await expect(page.getByRole('heading', { name: 'Coach Market', level: 2 })).toBeVisible()
    await openCoaches(page)

    // 3 – THE LOCKED ROWS. Found by the accessible name, which is the reading a screen reader gets,
    // and there is more than one of them: the roster carries four Elite coaches and every one of them
    // is short the same number, because the bar is about HER and not about the man.
    const locked = page.getByRole('button', { name: new RegExp(`locked, ${short} ranking points short`) })
    const count = await locked.count()
    expect(count, 'the screen really drew locked rows').toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const row = locked.nth(i)
      // ...it is an Elite row, and nothing else is locked: the name carries the tier.
      await expect(row).toHaveAccessibleName(/Elite tier/)
      // ...the sighted half says the same thing, in the card's own shorter words.
      await expect(row).toContainText(`${short} pts short`)
      // ...and R10-16's own half: a refused control is actually refused.
      await expect(row).toBeDisabled()
    }

    // 4 – AND ONLY ELITE. A lock on a rung the gate is not about would be the same defect pointing the
    // other way, and the count is what says so: every locked row on this screen is one of the four.
    const anyLocked = page.getByRole('button', { name: /locked, \d+ ranking points short/ })
    expect(await anyLocked.count(), 'nothing below the top rung is gated').toBe(count)
  })

  // ⚠ RE-AIMED 16.09 BY ROUND 42 #42 – the title said «the money is a SEPARATE refusal» and the
  // owner's ruling made it no refusal at all. The case's own claim is untouched: this screen refuses
  // on money nowhere, and the points lock is a different thing. See §4.
  test('sinking: past the bar, the same screen locks nothing – and the money refuses nothing either', async ({
    page,
    careerAt,
  }) => {
    const { facts } = await careerAt('sinking')

    // 1 – THE CONTROL REACHES ITS OWN STATE, and it is the other side of the same bar.
    expect(
      facts.domesticPoints,
      `sinking is meant to sit at or above the elite gate's ${MIN_POINTS}-point bar`,
    ).toBeGreaterThanOrEqual(MIN_POINTS)

    await answerOpeningKnock(page)
    await dismissTourBriefing(page)
    await page.getByRole('button', COACH_NOTE).click()
    await expect(page.getByRole('heading', { name: 'Coach Market', level: 2 })).toBeVisible()
    await openCoaches(page)

    // 2 – THE RUNG IS ON THE SCREEN. Without this the absence below would prove nothing at all: a
    // market that drew no Elite row would pass an assertion about no Elite row being locked.
    const elite = page.getByRole('button', { name: /Elite tier/ })
    expect(await elite.count(), 'the market really offers the rung the gate is about').toBeGreaterThan(0)

    // 3 – ...and not one row is locked. She has results; the bar is behind her.
    await expect(page.getByRole('button', { name: /ranking points short/ })).toHaveCount(0)
    await expect(page.getByText(/pts short/)).toHaveCount(0)

    // =============================================================================================
    // 4 – ⚠⚠ RE-AIMED 16.09 BY ROUND 42 #42, AND THE CLAIM IS THE ONE THAT SURVIVED
    // =============================================================================================
    //
    // THIS STEP USED TO WAIT FOR `getByRole('button', { name: /over budget by/ })`, and the phrase is
    // gone from the screen on the owner's own ruling: «мы не можем запретить нанимать специалистов,
    // если у них есть желание – они нанимают, просто в этом индикаторе мы покажем реальные затраты в
    // неделю». The row used to swap «Hire ›» for a shortfall figure and take the refusal treatment
    // while `hireCoach` never consulted the budget at all, so a perfectly legal hire READ as
    // forbidden – and the accessible name told a listener the row was refused while a sighted player
    // was invited to press it, which is the same defect in the channel the label exists to serve.
    //
    // ⭐ WHAT THIS CASE IS ABOUT DID NOT MOVE. It has always been «this screen refuses on MONEY
    // nowhere, and the points lock is a separate thing»; §3 above is the lock's half and this is the
    // money's. What changed is which sentence proves it: before #42 the money was a flag, and now
    // there is no flag at all – so the assertion is the new contract. The row is PRESSABLE, it
    // carries the week's real cost, and the money is said on the tile instead.
    //
    // ⚠⚠ AND IT IS NOT VACUOUS, WHICH IS THE WHOLE RISK OF RE-AIMING A REFUSAL INTO A PERMISSION: a
    // pressable row on a rich career proves nothing. Both numbers are read OFF THE SCREEN – the
    // tile's own weekly cap and the row's own price, in the accessible name – so a regeneration that
    // moved `sinking` into comfort reddens here NAMING the two figures instead of leaving a green
    // that means nothing. Measured at head: a $267 week against four Elite rungs of $611-$894.
    const legend = (await page.locator('.budget-meter .budget-legend').innerText()).replace(/\s+/g, ' ')
    const cap = /\$([\d,]+(?:\.\d+)?) weekly cap/.exec(legend)
    expect(cap, `the Team budget tile prints no weekly cap – it read «${legend}»`).not.toBeNull()
    const weekCarries = Number(cap![1].replace(/,/g, ''))

    const eliteCount = await elite.count()
    for (let i = 0; i < eliteCount; i++) {
      const row = elite.nth(i)
      const rowName = (await row.getAttribute('aria-label')) ?? ''
      // ...the row's state word is the CALL TO ACTION and its price is in the name – #42's own two
      // halves, in the one string a screen reader is handed.
      const price = /, \$([\d,]+(?:\.\d+)?) a week – hire$/.exec(rowName)
      expect(
        price,
        `an Elite row does not end in its weekly cost and the hire word: «${rowName}»`,
      ).not.toBeNull()
      // ...and the family genuinely cannot carry it, which is what makes the next line a claim.
      expect(
        Number(price![1].replace(/,/g, '')),
        `«${rowName}» fits inside this family's $${weekCarries} week, so a pressable row proves nothing`,
      ).toBeGreaterThan(weekCarries)
      await expect(
        row,
        'a rung the week cannot carry is still a rung the family may press – the engine never ' +
          'refused it, and after #42 the screen does not either',
      ).toBeEnabled()
    }

    // ...and the old sentence is gone from EVERY control on the screen, not merely from the top rung.
    // The positive half above could hold while some other row still carried the refusal wording.
    await expect(page.getByRole('button', { name: /over budget/ })).toHaveCount(0)
  })

  test('⭐ junior: the market remembers – an empty window behind a banked peak locks nothing (14.09)', async ({
    page,
    careerAt,
  }) => {
    // THE RULING'S OWN e2e PIN. `junior` is a rank-63 fifteen-year-old on the ITF ladder whose
    // domestic window has emptied behind her – 0 LIVE points at week 120 – and whose banked
    // high-water (251, probed off the fixture the day this case was written) is far past the bar.
    // As the gate shipped she was refused an Elite coach; the owner's word is the case's title.
    const { facts } = await careerAt('junior')

    // 1 – the state, from the manifest: the live fold really is empty, and the career really has
    // outgrown the domestic table. The PEAK is deliberately not a manifest fact – what this case
    // asserts is the SCREEN's verdict, and the unit suite (§A2) owns the standing's arithmetic.
    expect(facts.domesticPoints, 'the live window is empty – the state the old gate refused').toBe(0)
    expect(facts.rankedItf, 'and she is a real ITF player, not a fresh career').toBe(true)

    await answerOpeningKnock(page)
    await dismissTourBriefing(page)
    await page.getByRole('button', COACH_NOTE).click()
    await expect(page.getByRole('heading', { name: 'Coach Market', level: 2 })).toBeVisible()
    await openCoaches(page)

    // 2 – the rung is offered at all (the sinking case's own vacancy guard, reused).
    const elite = page.getByRole('button', { name: /Elite tier/ })
    expect(await elite.count(), 'the market really offers the rung the gate is about').toBeGreaterThan(0)

    // 3 – and NOTHING is locked: the door her career already opened stays open on an empty window.
    await expect(page.getByRole('button', { name: /ranking points short/ })).toHaveCount(0)
    await expect(page.getByText(/pts short/)).toHaveCount(0)
  })
})
