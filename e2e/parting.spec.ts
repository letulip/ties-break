// JOURNEY: THE WEEK A MARRIAGE ENDS – THE CARD IS THE DIVORCE'S OWN, HE ANSWERS IT THROUGH THE REAL
// UI, AND THE ALBUM KEEPS A LINE ABOUT IT.
//
// SEAMS OWNED: #1 (the Web Worker boundary) and #2 (IndexedDB), with #5 carrying the press.
// ⭐ THE ONE NEW CASE WAVE 12 OWES (the owner's 29.08 rule: one e2e case per shipped mechanic), and
// the plan names it: docs/plans/life-wave-12-builder-2026-09.md §T7.2.
//
// WHAT ONLY THIS LAYER CAN SAY. Every half is unit-pinned already – the branch at `rollEnds` and its
// key-count net in tests/wave12-parting.test.ts, the card's own fit through the real cascade in
// tests/component/wave12-parting-ui.test.ts, the album line mounted in
// tests/component/wave12-parting-album.test.ts. What none of them can say is that the divorce is a
// week a BROWSER can live through:
//
//   * that a MARRIED career survives being written to IndexedDB and read back, and that the press
//     on the other side of the wire raises the divorce's card rather than the break-up's – the
//     `latchedWeek` read happening inside the worker, on a world that has been through the codec;
//   * that the card can be ANSWERED through the real UI. The fixture parks ONE PRESS BEFORE it
//     (e2e/wedding.spec.ts' standing rule: a beat answered by the GENERATOR is not «answered through
//     the real UI», which is the half a browser is for);
//   * that the week writes BOTH rows – the news row and the album's. That pair is this wave's one
//     genuinely new shape on a screen, and a feed showing one of the two would be invisible to every
//     engine test, all of which read arrays rather than pages.
//
// ⚠ WHAT THIS SPEC CANNOT SEE, said out loud rather than quietly dropped:
//
//   * NOT THE BOOTH. Airing needs a big stage inside the news window, which is weeks away from this
//     press and a different career shape besides; §H of the wave's engine tests owns it.
//   * NOT THE DIARY SCRAP. A week note is chance-gated (`WEEK_NOTE_CHANCE`) and selected against a
//     pool, so a browser assertion on one would be a coin flip wearing a test's clothes. The licence
//     and both arms are swept in tests/week-notes.test.ts.
//   * NOT THE SHOCK'S SIZE. e2e/breakup.spec.ts makes the mood claim for an ending and the two
//     ladders' collision is argued there at length; repeating it here would buy the same assertion
//     against a smaller corpus.
//
// -------------------------------------------------------------------------------------------------
// ⭐ THE ARMS, WRITTEN DOWN (the standing rule since wave 2). Each was made against the app, this
// file RUN in a real browser against it, and reverted; the red assertion is named. Control green
// first, and again between each one.
//
//   A. `src/engine/world/lifeBeat.ts`: the `married` read flipped to `=== null`, so an ordinary
//      break-up's card is raised instead.
//      -> RED at step 2 – the divorce's heading never appears.
//   B. `src/engine/world/lifeBeat.ts`: the `fireMilestone`/`captureMilestone` pair deleted from the
//      latched branch, so the news row lands and the album's does not.
//      -> RED at step 4 – the album line is not on the feed.
//
// ⚠ Both are recorded in the wave's report with their measured verdicts.

import { test, expect } from './careerAt'
import { dismissTourBriefing, onScreenWeek, weekButton } from './journey'

/** The card, by the heading the ENGINE assembled (`DIVORCED_HEADING`), and it is located BY NAME for
 *  e2e/breakup.spec.ts' stated reason: a bare `getByRole('dialog')` would silently follow the queue
 *  and pass on whichever card turned up.
 *
 *  ⚠ MATCHED ON ITS OPENING AND NOTHING ELSE. The tail carries the space-vs-company READ – a
 *  persisted draw the recipe does not pin – so the tail is exactly what a spec must not assert.
 *  ⚠ AND IT CANNOT MATCH THE BREAK-UP'S CARD, which is the whole point of the locator: `ENDED_HEADING`
 *  opens «It is over, and she …» / «There was someone, …» and neither begins this way. */
const DIVORCE_CARD = { name: /^Her marriage is over, and she / }

/** The answer he gives, transcribed – `tsconfig.e2e.json` forbids this project from importing the
 *  engine, and e2e/breakup.spec.ts writes its own four longhand for the same reason.
 *  ⚠ DELIBERATELY NOT `sort`, which is the DRAIN's answer: read-independence is a property a bench
 *  needs and a player does not. ⚠ THE WORDS ARE DRAFTS FOR THE OWNER (invariant 4); this file copies
 *  them and never proposes them. */
const HIS_ANSWER = 'Give her room, and say we are here'

/** The three sentences the week puts on the feed, each matched on a distinctive TAIL so the opening
 *  clause is free to move under a вычитка without reddening a browser test.
 *
 *  ⚠⚠ THE FIRST TWO ARE THE PAIR THIS SPEC EXISTS FOR – the news row (`type: 'life'`) and the album's
 *  (`type: 'milestone'`), on ONE week. They are the only such pair in the game, and a feed carrying
 *  one of them is a defect no engine test can see. */
// ⚠ RE-AIMED 23.09 BY HIS STRINGS REVIEW: the news row lost its second clause (must-fix 3) and the
// milestone line lost «the phone still rang», so both locators follow the shipped words. The
// answer's own row survived the review untouched.
const NEWS_ROW = /Her marriage ended this week\./
const ALBUM_ROW = /We had no say in it, only in what we said next/
const HIS_ANSWER_ROW = /We gave her room, and said we were there/

test.describe('the parting', () => {
  test('the week a marriage ends: the card is its own, he answers it, and the album keeps a line', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts, profile } = await careerAt('parting')
    await dismissTourBriefing(page)

    // =============================================================================================
    // 1. ⭐⭐ THE MARRIED CAREER CAME BACK OUT OF STORAGE, ON AN ORDINARY WEEK
    // =============================================================================================
    //
    // The bytes seeded here are the app's own export envelope, written into IndexedDB inside the
    // transaction that CREATES the database – so a career on screen at this week is the whole world,
    // `loveEpisodes[].latchedWeek` included, having survived the codec. Every claim below is about
    // ONE PRESS, so a fixture booting behind a card of its own would make that press answer somebody
    // else's question.
    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
    await expect(
      weekButton(page),
      `the '${profile.kidName}' fixture is expected to boot on an ORDINARY week, married, one press ` +
        'from the ending. If this is red after a fixture regeneration, tools/e2e-fixtures.ts stopped ' +
        'finding such a week: its recipe evaluates the ends key directly and prints why a candidate ' +
        'was turned down.',
    ).toBeEnabled()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // =============================================================================================
    // 2. ⭐⭐⭐ HE PRESSES, AND THE CARD IS THE DIVORCE'S OWN
    // =============================================================================================
    //
    // ⚠ ARM A, RUN: flip `over.latchedWeek !== null` to `=== null` in `rollEnds` and this goes red –
    // the ending still happens and the card that opens is the break-up's, whose heading cannot match
    // this locator.
    await weekButton(page).click()
    const card = page.getByRole('dialog', DIVORCE_CARD)
    await expect(
      card,
      'the divorce raised no card of its own. `rollEnds` reads `latchedWeek` at ONE site and the ' +
        'kind it raises follows from it – so either the branch stopped splitting or the fixture ' +
        'stopped being married.',
    ).toBeVisible()

    // ⭐⭐ AND IT OFFERS FOUR ANSWERS AND NO WAY PAST THEM. `LIFE_BEAT_BLOCKING['divorced']` is
    // `true`, and what that MEANS for a player is that there is nothing on this card that is not an
    // answer to it.
    await expect(card.getByRole('radio')).toHaveCount(4)
    await expect(
      card.getByRole('button', { name: /close|dismiss|later|not now/i }),
      'a control that is not one of his four answers appeared on the card – walking away from a ' +
        'life beat must not be a thing the player can do.',
    ).toHaveCount(0)

    // =============================================================================================
    // 3. ⭐⭐⭐ HE ANSWERS IT – select, then the Proceed the selection reveals (round 42 #8)
    // =============================================================================================
    await card.getByRole('radio', { name: HIS_ANSWER, exact: true }).click()
    await card.getByRole('button', { name: 'Proceed', exact: true }).click()
    await expect(card, 'the card stayed up after the answer was recorded').toHaveCount(0)

    // =============================================================================================
    // 4. ⭐⭐⭐ AND THE WEEK WROTE BOTH ROWS – the news, and the album's own line
    // =============================================================================================
    //
    // ⚠ ARM B, RUN: delete the `fireMilestone`/`captureMilestone` pair from the latched branch and
    // the ALBUM_ROW assertion goes red on its own while the other two stay green – which is exactly
    // the shape of the defect this step exists for.
    await page.getByRole('button', { name: 'Proceed to Home' }).click()
    await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()
    await expect(
      page.getByText(NEWS_ROW),
      'the week the marriage ended left no news row on the feed.',
    ).toBeVisible()
    await expect(
      page.getByText(ALBUM_ROW),
      'the album kept no line about it. This is the ONE week in the game that writes both a life row ' +
        'and a milestone row, and a feed showing only the first is a defect no engine test can see.',
    ).toBeVisible()
    await expect(
      page.getByText(HIS_ANSWER_ROW),
      'the answer he gave left no trace – `ANSWER_EVENT.divorced` is what records which of the four ' +
        'biographies this career is.',
    ).toBeVisible()

    expect(crashes, 'the app threw on the week her marriage ended').toEqual([])
  })
})
