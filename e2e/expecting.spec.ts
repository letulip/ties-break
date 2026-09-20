// JOURNEY: A CAREER INSIDE THE MATERNITY PAUSE – IT COMES BACK OUT OF STORAGE STILL CARRYING, THE
// ENTRIES ARE SHUT ON THE CARDS IN THE ENGINE'S OWN WORDS, AND THE WEEKS STILL TICK.
//
// SEAMS OWNED: #1 (the Web Worker boundary) and #2 (IndexedDB), with #5 carrying the press.
// ⭐ THE ONE NEW CASE WAVE 8 OWES for the pregnancy (the owner's 29.08 rule: one e2e case per
// shipped mechanic), and the wave's brief names it in as many words: «a save and a load across the
// pause» (docs/plans/life-wave-8-builder-2026-09.md §2 T11).
//
// WHAT ONLY THIS LAYER CAN SAY. Every half of the mechanic is unit-pinned already – `rollPregnancy`
// and the hazard in the wave's engine tests, `landPregnancyPause` and the entry gate beside them,
// the `'expecting'` card mounted through the real cascade in tests/component/life-beat-dialog.test.ts,
// the two v85 fields in tests/goldenSaves.test.ts and T9's whole census in
// docs/specs/the-motherhood-2026-09.md. What none of them can say is that a pregnancy is a state a
// BROWSER can hold:
//
//   * that a career CARRYING A CHILD survives being written to IndexedDB and read back – the
//     save/load half, which is the whole reason this is e2e, and which no engine test can see;
//   * that `Snapshot.pregnancyFace` – the one word T10 put on the wire – becomes a PAINTING the
//     browser really decodes. The two `.webp` files shipped with the art set referenced by nothing
//     in `src/` until T10, so «the app serves them» had never been true anywhere;
//   * that the refusal reaches a PLAYER. The pause is a world-level condition answered inside
//     `availabilityStatus`, and the only surface that speaks it is a lock pill on a Season card –
//     an engine test can assert the verdict and cannot assert that anybody is ever shown it;
//   * that the household weeks still move. «Weeks TICK – no latch, no fast-forward machinery» is
//     §2 T3's own sentence, and a browser is where «the week button still works» is a fact rather
//     than a claim about a function.
//
// ⚠⚠ AND THE FIXTURE IS PARKED **INSIDE** THE PAUSE, WHICH IS THE ONE THING ABOUT THIS FILE A
// READER SHOULD PUSH ON, so the argument is here rather than buried in the generator. Every other
// beat fixture in the corpus parks ONE PRESS BEFORE its card, on e2e/wedding.spec.ts' stated rule:
// «its engagement would then have been answered by the GENERATOR, and "answered through the real UI"
// is precisely the half the brief asks a browser for». That rule is about THE BEAT UNDER TEST. Here
// the beat is not under test – the `'expecting'` card's own answering is pinned through the real
// cascade one layer down – and what IS under test is the pause, which is not a card at all. Parking
// from `pausesWeek` on is therefore the honest shape, and the rule is kept rather than bent.
//
// ⚠⚠ THE CLEAN RUN-IN WAS MEASURED BEFORE IT WAS GIVEN UP. T11 walked 48 seeds: six reached a
// pregnancy (12.5%, inside T9's predicted 8–15% of all careers) and ALL SIX were blocked within two
// presses of the announcement by a knock, a tournament reveal or a retirement offer. That is
// structural rather than unlucky: `ECONOMY.motherhood.playsOnWeeks` is BY DESIGN the weeks she keeps
// playing, and the hazard's window is the deep-tour years (T9's census puts the median announcement
// at 30.2), so the eight weeks between the announcement and the pause are guaranteed to be her
// busiest. A nine-press browser walk to the pause is a state the MODEL makes rare.
//
// ⚠ WHAT THIS SPEC CANNOT SEE, said out loud rather than quietly dropped:
//
//   * NOT `support`. The parent's answer grade is persisted and read by T5's decision and the
//     postpartum recovery, and NO SURFACE PRINTS IT. It is asserted on decoded worlds in the wave's
//     engine tests, which is the layer that can.
//   * NOT THE BIRTH, AND NOT THE RETURN. Both are `ECONOMY.motherhood` distances away – 31 weeks and
//     51 – and a browser case that pressed its way to either would be a 50-press journey in a suite
//     that runs 130 tests in ~1.2 minutes. The engine walks them; this file walks one week.
//   * NOT THE PROTECTED RANK. `comeback.protectedRank` is written at the return, which is past the
//     end of this journey by a year.
//
// -------------------------------------------------------------------------------------------------
// ⭐ THE ARMS, WRITTEN DOWN (the standing rule since wave 2: «this wave writes each arm down»). Each
// was made against the app, this file RUN in a real browser against it, and reverted; the red
// assertion is named. Control green first, and again between each one.
//
//   A. `src/composables/kidEmotion.ts`: `pregnancyWeek` forced to `false`, so the wire still carries
//      the word and the hero ignores it.
//      -> RED at step 2 – her portrait is the ordinary `{stage}-{emotion}` painting.
//   B. `src/engine/world/medical.ts`: the pause branch deleted from `availabilityStatus`, so the
//      entries never shut.
//      -> RED at step 3 – no card wears the refusal, and several wear an Enter pill instead.
//   C. `src/engine/world/medical.ts`: `pauseCovering`'s `week >= pregnancy.pausesWeek` turned into
//      `>`, the classic off-by-one.
//      -> GREEN, and it is recorded rather than corrected because the REASON is a fact about the
//      gate that a reader of this file should have. The arm was predicted RED twice – first because
//      «the fixture parks well inside the window» and then, when the accepted seed turned out to
//      park on `pausesWeek` ITSELF, because «this file sits exactly on the boundary». Both readings
//      confuse the WORLD's week with the EVENT's. `pauseCovering` is asked `(world, event.week)` and
//      its own note says so, and every card this spec can read is a FUTURE event – an event on week
//      `pausesWeek` has had its deadline pass or is already entered, so it draws «Entries closed W…»
//      or a Withdraw button rather than the lock pill. A one-week boundary at `pausesWeek` is
//      therefore invisible to any card on screen, at any parking week the recipe accepts.
//      ⚠ So the boundary is pinned where it CAN be seen: `tests/e2e-fixtures.test.ts` asserts the
//      two distances against `ECONOMY.motherhood`, and the wave's engine tests own the gate itself.
//      An arm that cannot fail is what these blocks exist to catch, and this one caught itself –
//      twice, which is the whole argument for running them rather than reasoning about them.

import { test, expect } from './careerAt'
import type { Locator, Page } from '@playwright/test'
import { dismissTourBriefing, onScreenWeek, weekButton } from './journey'

/**
 * ⚠⚠ THE PAUSE'S REFUSAL, TRANSCRIBED – `PREGNANCY_PAUSE_DETAIL` (src/engine/world/medical.ts), which
 * `tsconfig.e2e.json` forbids this project from importing (e2e/wedding.spec.ts writes
 * `weeksAfterEngagement`'s 8 longhand for the same reason and says so).
 *
 * ⚠ THE 🔒 IS HALF THE ASSERTION, which is `WEDDING_ROW`'s 🏆 argument one mechanic over.
 * `SeasonScreen.vue` draws a FOUR-branch ladder on an event card – Withdraw, Cancel entry, «Entries
 * closed W…», and only then the lock pill – so the glyph is how a browser says the sentence came
 * down the LOCK path rather than as some other line that happens to hold the same words.
 *
 * ⚠ MATCHED ON THE OPENING ONLY, and the sentence is a DRAFT for the owner's pass (invariant 4), so
 * its tail must be free to move without reddening a browser test. ⚠ AND THE TRANSCRIPTION CANNOT ROT
 * IN SILENCE: the generator's own acceptance clause and the rot alarm both read the CONSTANT
 * (`pauseRefusedCards`, tools/e2e-fixtures.ts), so a вычитка that re-words it leaves this file as the
 * only copy and this line goes red naming the pill. Only one side is a copy, which is the property
 * `WEEKS_AFTER_ENGAGEMENT`'s note names.
 *
 * ⚠ THE `\s*` IS LOAD-BEARING AND e2e/album.spec.ts PAID FOR IT: `getByText` normalizes whitespace
 * for a STRING and does NOT for a REGEX, and this pill is an interpolation on its own template line,
 * so its `textContent` opens with a newline and sixteen spaces.
 */
const PAUSE_REFUSAL = /^\s*🔒 She is expecting – no new entries\./

/** Her hero photograph on the Kid screen, by the `alt` the template gives it (`:alt="kidName"`).
 *
 *  ⚠ SCOPED TO `main`, which is e2e/album.spec.ts' own rule and not tidiness: past 1024 the desktop
 *  rail carries her avatar too, and this suite's 576px viewport is below that today – a scope that
 *  only works at one width is a locator waiting for S3's device matrix. */
function heroPortrait(page: Page, kidName: string): Locator {
  return page.getByRole('main').getByRole('img', { name: kidName })
}

test.describe('the maternity pause', () => {
  test('a career inside it loads, the entries are shut on screen, and the weeks still tick', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts, profile } = await careerAt('expecting')
    // The briefing is a doorway rather than a claim – e2e/journey.ts carries the whole argument, and
    // `belated`'s recipe is the precedent: dismissing it writes localStorage and no world, so the
    // week below is still exactly the week the recipe measured.
    await dismissTourBriefing(page)

    // =============================================================================================
    // 1. ⭐⭐ THE CAREER CAME BACK OUT OF STORAGE, ON THE WEEK IT WENT IN
    // =============================================================================================
    //
    // ⚠ THIS STEP IS LOAD-BEARING AND NOT THE USUAL SANITY LINE – e2e/wedding.spec.ts' own note. The
    // bytes seeded here are the app's own export envelope, sliced and written into IndexedDB inside
    // the transaction that CREATES the database, so a career on screen at this week is the whole
    // world – `world.pregnancy` included – having survived `compressWorld`/`decompressWorld`. And
    // every claim below is about ONE PRESS: a fixture booting behind a card of its own would make
    // that press answer somebody else's question.
    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
    await expect(
      weekButton(page),
      `the '${profile.kidName}' fixture is expected to boot on an ORDINARY week inside the pause – ` +
        'nothing pending, nothing blocking. If this is red after a fixture regeneration, ' +
        'tools/e2e-fixtures.ts stopped finding such a week: its recipe skips a candidate week that ' +
        'holds a knock, a birthday, a reveal, a beat or a soft row, and prints why.',
    ).toBeEnabled()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // =============================================================================================
    // 2. ⭐⭐⭐ AND SHE IS CARRYING – the one word on the wire, as a painting the browser decodes
    // =============================================================================================
    //
    // ⚠ ARM A, RUN: force `pregnancyWeek` to `false` in src/composables/kidEmotion.ts and this goes
    // red – the wire still says `pregnant-early`, and the hero draws the ordinary band painting.
    await page.getByRole('button', { name: 'Open her profile' }).click()
    await expect(page.getByRole('heading', { name: 'Important moments', level: 3 })).toBeVisible()

    const portrait = heroPortrait(page, profile.kidName)
    await expect(
      portrait,
      'her hero is not the pregnancy painting. `Snapshot.pregnancyFace` is the whole of what the ' +
        'wire carries about the months (T10), and `useKidEmotion` is the one reader – so either the ' +
        'snapshot stopped computing it or the hero stopped asking.',
    ).toHaveAttribute('src', /fem-euro-brunnet-adult-pregnant-(early|last)\.webp$/)

    // ...AND IT IS A FILE THE APP SERVES. e2e/album.spec.ts' arm D is the precedent and the reason:
    // an `<img>` with a 404 behind it is still in the DOM, still visible and still carries its `src`,
    // and only `naturalWidth` knows. These two paintings were referenced by nothing in `src/` until
    // T10 wired them, so this is the first time anything has asked the browser for either.
    await expect(portrait).toBeVisible()
    const decoded = await portrait.evaluate((n) => (n as HTMLImageElement).naturalWidth)
    expect(decoded, 'the pregnancy painting the engine named is not a file the app serves').toBeGreaterThan(0)

    // =============================================================================================
    // 3. ⭐⭐⭐ THE ENTRIES ARE SHUT, AND THE CARD SAYS WHY IN THE ENGINE'S OWN WORDS
    // =============================================================================================
    //
    // ⚠ ARM B, RUN: delete the pause branch from `availabilityStatus` and this goes red – the cards
    // come back wearing Enter pills, which is the defect the whole of §2 T3 exists to prevent.
    //
    // ⚠ `.first()` RATHER THAN A COUNT, and the count is deliberately NOT asserted: how many rungs a
    // given week puts on the feed is a property of where the search stopped and of the whole balance
    // of the calendar, and it moves with every regeneration. That at least one card is refused is the
    // claim; `tests/e2e-fixtures.test.ts` is what guarantees the fixture has one to show.
    await page.getByRole('navigation').getByRole('button', { name: 'Season', exact: true }).click()
    const refused = page.getByText(PAUSE_REFUSAL)
    await expect(
      refused.first(),
      'no Season card carries the pause\'s refusal. The pause rides the ONE entry gate ' +
        '(`availabilityStatus`), so every surface that asks about a tournament goes quiet together – ' +
        'and the lock pill is the only place a player is ever told which rule did it.',
    ).toBeVisible()

    // =============================================================================================
    // 4. ⭐⭐ AND THE WEEKS STILL TICK. She is off tour; the household is not.
    // =============================================================================================
    //
    // «Weeks TICK. No latch, no fast-forward machinery» – §2 T3, and the college precedent it leans
    // on. One press, and the week moves: the pause shuts the ENTRIES and stops nothing else, which is
    // what separates it from an ending and from the college freeze, where the shell itself goes away.
    //
    // ⚠ THE THREE STEPS ARE THE PRODUCT'S OWN ROUTE – e2e/wedding.spec.ts' `advanceOneWeek`, inlined
    // because this file presses ONCE: a resolved week opens its own story by itself, so the first
    // thing across the boundary is a NAVIGATION the app performed, and `Proceed to Home` is the door
    // back. ⚠ AND THERE IS NO WRAP-UP STEP-THROUGH HERE, because there is nothing to step through:
    // the recipe rejects a candidate whose one press would turn the season over, which is a trade
    // e2e/wedding.spec.ts could not make (it presses nine times) and this file can.
    await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
    await expect(weekButton(page)).toBeEnabled()
    await weekButton(page).click()
    await expect(page.getByRole('region', { name: /^Week story/ })).toBeVisible()
    await page.getByRole('button', { name: 'Proceed to Home' }).click()
    await expect(
      page.getByText(onScreenWeek(facts.week + 1)),
      'the week did not move. The maternity pause closes the ENTRY seam and nothing else – a career ' +
        'that could not be ticked through it would be months a player cannot leave.',
    ).toBeVisible()
    await expect(page.getByText(onScreenWeek(facts.week))).toHaveCount(0)

    expect(crashes, 'the app threw while she was carrying').toEqual([])
  })
})
