// JOURNEY: IT ENDS, HER MOOD GOES WITH IT, AND THE PARENT IS ASKED WHAT TO SAY.
//
// SEAM OWNED: #1, the Web Worker boundary, with #5 (real input) carrying it. ⭐ THE ONE NEW CASE
// WAVE 4 OWES for the ending (the owner's 29.08 rule: one e2e case per shipped mechanic), and the
// wave-4 brief names it in as many words: «a fixture career with an active KNOWN episode -> the
// ending fires -> Mood dips -> the `'ended'` card -> answer -> the week moves on».
//
// WHAT ONLY THIS LAYER CAN SAY. Every half of the mechanic is already unit-pinned – `rollEnds` in
// tests/wave4-ends.test.ts, the shock and its clear bar in tests/wave4-spirit-shock.test.ts, the card
// itself mounted in tests/component/life-beat-dialog.test.ts against a hand-built prompt. What none
// of them can say is that ONE PRESS of the real week button, in a real browser, against a real
// worker's real world, produces the WHOLE SCENE AT ONCE: the hazard fires, `accrueSpirit` spends the
// shock, the Mood word the parent is looking at drops, her card arrives over it, his answer crosses
// the wire, and the week is ordinary again on the other side. Six engine steps and one snapshot; a
// mocked boundary can stage any of them in any order, because there is nothing there to object.
//
// ⚠⚠ AND IT NEEDS TWO FIXTURES OF ITS OWN, WHICH IS THE OTHER HALF OF WHY IT IS HERE. No committed
// career held a LIVE KNOWN episode at all – `pro` is the only fixture with a love life past its
// arrival, and its four endings had all already happened (weeks 171 / 221 / 307 / 371). So the
// ending had nowhere to start, in either of the two registers the engine has for it:
//
//   `breakup` – the parent HAS been told there is somebody, and the week he presses is the week it
//               ends. Ruling A's `'met'` receipt exists, so `rollEnds` raises the TOLD-NOW card.
//   `belated` – the attachment was over before its `knownWeek` came round, so no receipt was ever
//               written. `deliverKnownPartner` raises the TOLD-LATE card instead, and no `'met'`
//               beat is raised for that episode, ever (ruling B).
//
// ⭐⭐ THE SECOND ONE IS THE COVERAGE DEBT THIS FILE EXISTS TO SETTLE. Ruling A is entirely about the
// told-late collision, and its own ⭐⭐ note says the dangerous variant fails QUIETLY – «the card is
// raised, delivery sees a receipt and skips, and the week's news never reaches the album at all. A
// duplicate row is visible; a missing one is not.» Until this file the branch was unit-only: no
// fixture and no frozen career exercised it, and no frozen career ever will – three of the five have
// no love life, and the coupled pair's `p:137` is still open at week 156.
//
// See FIXTURE_NAMES in tools/e2e-fixtures-read.ts for the recipes, and docs/plans/e2e-fixtures.md for
// where the two careers stopped.
//
// -------------------------------------------------------------------------------------------------
// ⭐ THE ARMS, WRITTEN DOWN (the standing rule since wave 2: «this wave writes each arm down»). Each
// was made against the ENGINE, this file RUN in a real browser against it, and then reverted by hand;
// the red assertion is named, because a spec whose arms have not been run is a spec nobody has any
// reason to believe. Control green first, and again between each one.
//
//   A. `rollEnds` (src/engine/world/lifeBeat.ts): the `raiseLifeBeat(world, 'ended', over.id)` on the
//      last line deleted, so the ending happens and nobody is asked about it.
//      -> RED, 1 of 1, at step 2 – her card never comes up.
//   B. `accrueSpirit` (src/engine/spirit.ts): the shock summand dropped, so the ending costs her
//      nothing. -> RED, 1 of 1, on the Mood rung: «read "Bright" … and "Steady"».
//   C. `deliverKnownPartner` (src/engine/world/lifeBeat.ts): the told-late branch given a bare
//      `return` – wave 3's behaviour, where an ended episode told the parent nothing at all.
//      -> RED, 1 of 1, in the SECOND test: «the told-late card did not come up».
//   C2. The same branch's CLOSING `return` removed instead, so it falls through to the `'met'` path.
//      -> RED, 1 of 1, but in tests/e2e-fixtures.test.ts and NOT here: «expected ['ended', 'met'] to
//      deeply equal ['ended']». This page cannot see it – `pendingLifeBeat` takes the FIRST unanswered
//      row, the told-late one was raised first, and the card on screen is unchanged. That is ruling A's
//      quiet failure exactly, and the lifeLog equality is what has eyes for it.
//
// ⚠⚠ **ARM B CAME BACK GREEN THE FIRST TIME, AND THE ASSERTION IT COULD NOT FAIL IS THE ONE THAT
// MOVED.** Written as «the word is lower at all», step 4 passed with the shock removed – because the
// ATTACHMENT LIFT comes off on the same tick (measured on this fixture: spirit 75 -> 72),
// `DiaryFacts.moodWord` goes null as the BODY channel takes the week, and KidScreen falls back to
// «Steady» – which is on the spirit ladder too, by the owner's ruling that «the neutral state is one
// state and gets one word». One shared word, two ladders, and a one-rung «dip» the ending had nothing
// to do with. That is a HOLE and not an under-powered mutation: the page cannot see `moodWord`'s
// nullability, so no reading of one word can tell the ladders apart. The net was re-aimed at the
// SHOCK'S OWN SIZE – two rungs, which −22/−34 clears and a lift worth 5 cannot – in all three places
// at once (`tools/e2e-fixtures.ts` so the fixture is chosen for it, tests/e2e-fixtures.test.ts so the
// PR gate holds it, and step 4 below), and the same mutation then went red.
//
// ⚠ THE POPUP LAW NEEDS NOTHING NEW FROM THIS FILE and that is checked rather than assumed: this
// wave's dialog is the `'ended'` card, and its 375x667 assertion already exists and is armed –
// tests/component/life-beat-dialog.test.ts, «⭐⭐⭐ the fourth answer is inside a 375x667 phone, and
// the card is bounded and scrolls». Nothing here adds or lengthens an overlay.

import { test, expect } from './careerAt'
import { answerOpeningKnock, dismissTourBriefing, onScreenWeek, weekButton } from './journey'
import type { Page } from '@playwright/test'

/**
 * HIS FOUR ANSWERS, TRANSCRIBED RATHER THAN IMPORTED – `WEEK_ACTION_NAME`'s own arrangement in
 * e2e/journey.ts, for the reason `tsconfig.e2e.json`'s header gives: `LIFE_BEAT_OPTIONS` lives in
 * `src/engine/world/lifeBeat.ts`, and listing the engine in this composite project would type-check
 * ~200 modules a second time and load them in every Playwright worker.
 *
 * ⚠ A CLOSED SET, AND THE ORDER IS THE ENGINE'S. ⭐ AND THE FOUR WORDS ARE THE SAME UNDER BOTH
 * READINGS, which is ruling G stated on the page rather than in a comment: the space-vs-company draw
 * moves the PRICE of these buttons and never their labels, so a spec that pinned them is pinning
 * something the flip cannot touch. If a wave ever made a label move with the read, this line is where
 * it would be found.
 */
const HIS_ANSWERS = [
  'Give her room, and say we are here',
  'Keep her company, and stay close this week',
  'Offer to help put it right',
  'Say they were never worth it',
] as const

/** The one he presses, and it is `'space'` – the same id `tools/e2e-fixtures.ts` pressed in the
 *  look-ahead that accepted both seeds, so the week this spec reaches is the week that was measured.
 *  ⚠ DELIBERATELY NOT the harness answer `'fix-it'`: that one is the DRAIN's, chosen for being
 *  read-independent, which is a property a bench needs and a player does not. */
const HIS_ANSWER = HIS_ANSWERS[0]

/** The feed line the engine writes for that answer (`ANSWER_EVENT.ended.space`), matched on its tail
 *  so the sentence's opening clause is free to move. ⚠ THE WORDS ARE THE OWNER's (invariant 4); this
 *  file copies them and never proposes them. */
const HIS_ANSWER_ROW = /We gave her room, and said we were there/

/** The two cards, by the heading the ENGINE assembled (`ENDED_HEADING`), and they are told apart the
 *  way e2e/life-beat.spec.ts tells her card from the fork's: by NAME, because a bare
 *  `getByRole('dialog')` would silently follow the queue and pass on whichever card turned up.
 *
 *  ⚠ BOTH REGISTERS ARE MATCHED ON THEIR OWN OPENING AND ON NOTHING ELSE, so each regex can only
 *  match its own scene. `ENDED_HEADING` carries the space-vs-company read in the tail of both rows –
 *  a persisted draw, and the recipe does not pin which way it came out – so the tail is exactly what
 *  a spec must not assert. */
const TOLD_NOW_CARD = { name: /^It is over, and she / }
const TOLD_LATE_CARD = { name: /^There was someone, it is already over, and she / }

/**
 * THE FIVE MOOD WORDS, TOP DOWN – the ladder `SPIRIT_BANDS` runs and `MOOD_WORD` spells
 * (src/engine/spirit.ts), transcribed here for the same tsconfig reason as the answers above, exactly
 * as e2e/mood-word.spec.ts transcribes the same five.
 *
 * ⚠⚠ THE ORDER IS THE ASSERTION, so it is the one thing in this file that must be right. «Her Mood
 * dipped» is `indexOf(after) > indexOf(before)` and nothing else – never a pinned word, because which
 * rung a seeded career happens to be on is a property of that fixture's spirit on that week and moves
 * with the next `npm run e2e:fixtures`. What cannot move is that an ending costs her rungs.
 *
 * ⚠ A WORD THAT IS NOT ON THIS LADDER IS A FAILURE AND NOT A SKIP. `DiaryFacts.moodWord` is null on
 * every week the BODY channel wins the diary, and KidScreen then falls back to the face's own word
 * («Tired», «Hurt», «On the mend»); comparing one of those against a spirit word would be two ladders
 * being subtracted. `tools/e2e-fixtures.ts` REJECTS a seed whose tile speaks a body word on either
 * side of the press, so this assertion is a property of the fixture rather than a hope about it.
 */
const MOOD_LADDER = ['Glowing', 'Bright', 'Steady', 'Dimmed', 'Heavy']

/**
 * Home -> her page -> back, and read the Mood word on the way through.
 *
 * ⚠⚠ IT COMES BACK TO HOME, AND THAT IS A FACT ABOUT THE PRODUCT RATHER THAN TIDINESS. The advance
 * control is **HOME-ONLY** (`App.vue`: `v-if="(tab === 'home' && !showCollege) || snapshot.pending"`)
 * – the owner's wave-2 ruling, because «advancing a week is irreversible, so it lives on Home only»
 * and a floating button lands under the thumb on every screen. ⚠ THE COMMENT DIRECTLY ABOVE THAT
 * `v-if` STILL OPENS «R13-12: GLOBAL – it renders on every tab», which is the history the paragraph
 * under it overturns; a reader who stops at the first sentence writes a spec that presses a button
 * that is not there, and this one did, once, and timed out on exactly that.
 */
async function moodOnHerPage(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Open her profile' }).click()
  const tile = page.locator('.kid-tile').filter({ has: page.getByText('Mood', { exact: true }) })
  await expect(tile).toBeVisible()
  const word = (await tile.locator('.kid-tile-lead').innerText()).trim()
  await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
  await expect(weekButton(page), 'back on Home, where the week button lives').toBeVisible()
  return word
}

test.describe('the week it ends', () => {
  test('one press ends it: her Mood drops, the card asks, and the week moves on after it', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts, profile } = await careerAt('breakup')

    // =============================================================================================
    // 1. THE CAREER BOOTS CLEAN, ON AN ORDINARY WEEK, WITH SOMEBODY IN HER LIFE
    // =============================================================================================
    //
    // ⚠ THIS STEP IS LOAD-BEARING AND NOT THE USUAL SANITY LINE. Every claim below is about what ONE
    // PRESS does; if the fixture booted holding a card of its own, the press would be answering
    // somebody else's question and every step after it would be measuring a different week.
    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
    await expect(
      weekButton(page),
      `the '${profile.kidName}' fixture is expected to boot on an ORDINARY week – nothing pending, ` +
        'nothing blocking, one attachment live and already told about. If this is red after a ' +
        'fixture regeneration, tools/e2e-fixtures.ts stopped finding such a week: its recipe rejects ' +
        'a seed that boots behind a knock, a birthday, a reveal, a briefing or a beat, and the ' +
        'rejection reason is printed by the generator.',
    ).toBeEnabled()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // ...and the word the parent is looking at is one of the five, so the rungs below are comparable.
    const before = await moodOnHerPage(page)
    expect(
      MOOD_LADDER,
      `the Mood tile said "${before}", which is not on the spirit ladder – the body channel has the ` +
        'week, and a body word cannot be compared with a spirit one. The recipe rejects such a seed; ' +
        'if this is red, that clause stopped working.',
    ).toContain(before)

    // =============================================================================================
    // 2. HE PRESSES THE WEEK, AND THE ENGINE DECIDES THE WHOLE SCENE ON THE OTHER SIDE OF THE WIRE
    // =============================================================================================
    await weekButton(page).click()

    const card = page.getByRole('dialog', TOLD_NOW_CARD)
    // ⚠ ARM A, RUN: delete `raiseLifeBeat(world, 'ended', over.id)` from `rollEnds` and this line is
    // where it goes red – the attachment ends, the shock lands, and nobody is asked about any of it.
    await expect(
      card,
      'the week was pressed on the tick the hazard ends her attachment, and no card came up. The ' +
        'ending is raised by `rollEnds` behind the `\'met\'` receipt (ruling A), so either the ' +
        'receipt reading moved or the raise did.',
    ).toBeVisible()
    await expect(card).toHaveAttribute('aria-modal', 'true')

    // =============================================================================================
    // 3. THE CARD IS HER LINE AND FOUR ANSWERS, AND THERE IS NO FIFTH WAY OUT
    // =============================================================================================
    //
    // ⚠ HER WORDS ARE ASSERTED BY SHAPE, NOT BY COPY – e2e/life-beat.spec.ts's own rule and the same
    // reason: the pool is temperament x register x presence and which cell this career draws is the
    // engine's business, while the words themselves are the owner's. What every one of them obeys is
    // the voice bibles' two shape rules, which is what this asks for: the narration names HER, and
    // there is ONE quoted span, at the end.
    const answers = card.getByRole('radiogroup')
    await expect(
      answers,
      'the answers are not named by her line – `aria-labelledby="life-beat-said"` is what tells a ' +
        'listener which sentence these four are a reply to.',
    ).toHaveAccessibleName(/^(She|Her) .+"[^"]+"$/)

    // ROUND 40'S CONVENTIONS, ON THE WIRE: real radios in a real group, nothing marked on arrival.
    // The card may not point at an answer, on a card whose whole subject is that the answer is his.
    for (const label of HIS_ANSWERS) {
      const option = card.getByRole('radio', { name: label, exact: true })
      await expect(option, `"${label}" is not on her card`).toBeVisible()
      await expect(option, `"${label}" arrived already marked`).toHaveAttribute('aria-checked', 'false')
    }
    await expect(card.getByRole('radio')).toHaveCount(HIS_ANSWERS.length)
    // ⭐ EVERY CONTROL IS AN ANSWER AND THERE IS NO X – LifeBeatDialog.vue's own law, asserted on the
    // rendered page rather than read off its template.
    await expect(
      card.getByRole('button'),
      'a control that is not one of his four answers appeared on the card – walking away from a life ' +
        'beat must not be a thing the player can do.',
    ).toHaveCount(0)

    // ⭐⭐ AND NOTHING BEHIND IT MAY BE PRESSED. `LIFE_BEAT_BLOCKING['ended']` is `true`, and what
    // that MEANS for a player is that the card's scrim owns every pixel – not that anything is
    // disabled, which nothing is. `trial: true` runs Playwright's actionability checks (visible,
    // stable, RECEIVES POINTER EVENTS, enabled) and performs no click, which is exactly the question.
    //
    // ⚠⚠ THE CONTROL IT ASKS ABOUT IS `Proceed to Home` AND NOT THE ADVANCE BAR, and that is a fact
    // about where a press LANDS rather than a convenience. After an advance the app navigates to the
    // WEEK'S STORY, whose CTA replaces the week button – so `weekButton` is not on the page at all
    // here and a trial click on it would report «blocked» for the wrong reason, which is the failure
    // this spec hit on its first run. `Proceed to Home` is the story's own door, it is visible, it is
    // behind the scrim, and e2e/week-advance.spec.ts makes the identical claim with it.
    // ⚠ THE VISIBILITY ASSERTION IS LOAD-BEARING: without it a control removed from the DOM would
    // fail the trial too, and this claim would pass for the opposite reason.
    const proceed = page.getByRole('button', { name: 'Proceed to Home' })
    await expect(proceed).toBeVisible()
    const reached = await proceed
      .click({ trial: true, timeout: 1500 })
      .then(() => 'reached', () => 'blocked')
    expect(
      reached,
      'the week story\'s own door was reachable while the ending card was on screen – it is a ' +
        'blocking beat, so nothing behind it may be pressed.',
    ).toBe('blocked')

    // =============================================================================================
    // 4. ⭐⭐⭐ HER MOOD WENT WITH IT – the shock, seen from the tile the parent actually reads
    // =============================================================================================
    //
    // The card is a blocking overlay, so it is answered first and the tile is read behind it. That
    // costs this step nothing: `answerLifeBeat` moves BOND and never spirit (the wave-4 brief calls a
    // spirit delta in that function a red flag in as many words), so the word below is the shock and
    // nothing else.
    await card.getByRole('radio', { name: HIS_ANSWER, exact: true }).click()
    await expect(card, 'her card stayed up after an answer was pressed').toHaveCount(0)

    // ...and now the story behind it can be left, which is the same door the trial click could not
    // reach one assertion ago. That is the blocking claim seen from the other side.
    await proceed.click()
    const after = await moodOnHerPage(page)
    expect(MOOD_LADDER, `the Mood tile said "${after}", which is not on the spirit ladder`).toContain(after)
    // ⚠⚠ TWO RUNGS AND NOT ONE, AND THE SECOND ONE IS ARM B's DOING. Written as «lower at all», this
    // line survived the arm that drops the shock summand from `accrueSpirit` – because the ATTACHMENT
    // LIFT comes off on the same tick (spirit 75 -> 72 on this career), the BODY channel then wins the
    // week, and KidScreen falls back to «Steady», which is on this ladder too by the owner's ruling
    // that the neutral state gets one word. One shared word, two ladders, and a dip the shock had
    // nothing to do with. ⚠ THE PAGE CANNOT TELL THE TWO LADDERS APART – `moodWord`'s nullability is
    // not on the wire – so the bar is the SHOCK'S OWN SIZE instead: −22/−34 against a lift worth 5.
    // `tools/e2e-fixtures.ts` rejects any seed whose career cannot show it, so this is a property of
    // the fixture rather than a hope about it.
    // ⚠ ARM B, RUN AGAIN AFTER THE RE-AIM: same mutation, and this line now goes red.
    expect(
      MOOD_LADDER.indexOf(after) - MOOD_LADDER.indexOf(before),
      `her Mood read "${before}" the week before it ended and "${after}" the week it did. The ` +
        'ending is worth −22 steady / −34 intense through `ECONOMY.spirit.shock.breakup`; one rung ' +
        'of that is the attachment lift on its own, which is why the bar is two.',
    ).toBeGreaterThanOrEqual(2)

    // =============================================================================================
    // 5. HIS ANSWER IS IN THE WORLD, and the week is ordinary again
    // =============================================================================================
    //
    // Not only in the UI that sent it: the engine wrote its own feed line during `answerLifeBeat`,
    // and Home's News is where a player reads it back. A mocked boundary cannot produce this line at
    // all – there is nothing on the other side to write it.
    //
    // ⚠ ON THE NEWS AND NOT ON THE MONEY SCREEN, which is the no-cents rule surfacing: an answer is
    // never a purchase, so the row carries no `amountCents` and `accrueFinance` never sees it.
    await expect(page.getByText(HIS_ANSWER_ROW)).toBeVisible()
    await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()

    // AND THE WEEK MOVES. The stop is gone because the question has been answered, and one press is
    // now an ordinary week – which is the half that says the ending did not leave the career wedged.
    await expect(weekButton(page)).toBeEnabled()
    await weekButton(page).click()
    await expect(page.getByText(onScreenWeek(facts.week + 2))).toBeVisible()

    expect(crashes, 'the app threw while her attachment ended').toEqual([])
  })

  test('⭐⭐ the told-late scene: he hears there was someone and that it is already over, in one card', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts } = await careerAt('belated')

    // ⚠⚠ TWO DOORWAYS FIRST, AND THIS IS THE ONE PLACE THIS FILE'S TWO TESTS DIFFER AT THE DOOR.
    // `breakup`'s career boots with nothing in front of it because the generator could demand that –
    // its state is on ~40% of seeds. This one's is on 1.9%, and of the eight careers in 432 seeds that
    // reached it, FOUR were behind an opening knock or an owed tour briefing. Both are FIXTURE STATE
    // rather than anything this test is about, both have a step-through in e2e/journey.ts that argues
    // itself at length, and `junior` and `pro` have booted behind a knock since the corpus existed.
    // ⚠ The generator replays the knock (an engine command, `'rest'`, which moves bond) inside its own
    // look-ahead, so the week this reaches is still exactly the week that was measured; the briefing's
    // dismissal writes localStorage and no world, so it needs no replay.
    await answerOpeningKnock(page)
    await dismissTourBriefing(page)

    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
    await expect(weekButton(page)).toBeEnabled()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // ONE PRESS, AND THE NEWS LANDS WHOLE. `deliverKnownPartner` finds the first undelivered row,
    // sees `endedWeek !== null` and takes the told-late branch: one feed row, one card, and no
    // `'met'` beat for that episode, ever.
    await weekButton(page).click()

    // ⚠ ARM C, RUN: give `deliverKnownPartner`'s told-late branch a bare `return` – wave 3's own
    // behaviour, where an episode that ended before its `knownWeek` told the parent nothing at all –
    // and this line goes red: the press lands on an ordinary week and no card comes up.
    // ⚠ AND THE NEIGHBOURING MUTATION IS UNIT-ARMED RATHER THAN ARMED HERE, deliberately. Removing
    // only the branch's closing `return`, so it falls THROUGH to the `'met'` path, leaves this card
    // visible – `pendingLifeBeat` takes the FIRST unanswered row and the told-late one was raised
    // first – so no assertion on this page can see it. What sees it is the lifeLog equality in
    // tests/e2e-fixtures.test.ts (`['ended']`), which is where that arm was run.
    const card = page.getByRole('dialog', TOLD_LATE_CARD)
    await expect(
      card,
      'the told-late card did not come up. This career holds an episode that was over before its ' +
        '`knownWeek` came round, so the week pressed above is the week the parent hears BOTH facts ' +
        'at once – ruling B\'s branch in `deliverKnownPartner`.',
    ).toBeVisible()

    // ⭐⭐⭐ AND THE ARRIVAL'S CARD IS NOWHERE, WHICH IS THE WHOLE OF WHAT THIS TEST EXISTS TO SAY.
    // «There was someone in her life» about somebody already gone is the one dishonest thing this
    // beat could say, and the failure ruling A warns about is QUIET: the dangerous variant raises the
    // card, lets delivery see a receipt and skip, and the week's news never reaches the album at all.
    // So both halves are asserted – the told-now heading is absent, and the card that IS up is the
    // late one.
    await expect(
      page.getByRole('dialog', TOLD_NOW_CARD),
      'the told-NOW card came up for an episode that was already over – two contradictory readings ' +
        'of one week, which is what ruling A exists to prevent.',
    ).toHaveCount(0)
    await expect(card.getByRole('radio')).toHaveCount(HIS_ANSWERS.length)

    // HE ANSWERS, AND THE WEEK MOVES ON – the same four answers, the same feed line, on the other
    // register of the same piece of news.
    await card.getByRole('radio', { name: HIS_ANSWER, exact: true }).click()
    await expect(card).toHaveCount(0)
    // The week's story is what the press landed on; `Proceed to Home` is the product's own door back
    // to the hub, and the News is where the answer is read back (the first test's own note).
    await page.getByRole('button', { name: 'Proceed to Home' }).click()
    await expect(page.getByText(HIS_ANSWER_ROW)).toBeVisible()
    await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()

    await expect(weekButton(page)).toBeEnabled()
    await weekButton(page).click()
    await expect(page.getByText(onScreenWeek(facts.week + 2))).toBeVisible()

    expect(crashes, 'the app threw while the late news arrived').toEqual([])
  })
})
