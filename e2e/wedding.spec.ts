// JOURNEY: SHE SAYS SHE IS GETTING MARRIED, HE ANSWERS, THE WEDDING LANDS EIGHT WEEKS LATER –
// AND IT IS STILL THERE THROUGH BOTH SAVE DOORS.
//
// SEAMS OWNED: #1 (the Web Worker boundary) and #5 (real input), with #2 and #6 carrying the tail.
// ⭐ THE ONE NEW CASE WAVE 7 OWES for the wedding (the owner's 29.08 rule: one e2e case per shipped
// mechanic), and the wave's brief names it in as many words: «a career walked to an engagement beat,
// answered, the wedding row seen, a save and a load across it»
// (docs/plans/life-wave-7-builder-2026-09.md §2 T11).
//
// WHAT ONLY THIS LAYER CAN SAY. Every half of the mechanic is unit-pinned already – `rollWedding`
// and the beat in tests/wave7-wedding.test.ts, `landWedding`'s four gates beside them, the card
// mounted in tests/component/life-beat-dialog.test.ts against a hand-built prompt, and the two
// v83 fields in tests/goldenSaves.test.ts. What none of them can say is that the wedding is a thing
// a PLAYER CAN REACH: that a real worker's real world raises her announcement on a week nobody
// staged, that his answer crosses the wire, that EIGHT ORDINARY PRESSES later the engine writes a
// row he can read on the hub, and that the latch it wrote survives a browser being thrown away and
// a file leaving the app and coming back. That last half is the schema move's only end-to-end
// witness: `latchedWeek` is written in one browser week and read back in another, through both
// codecs, rather than asserted on a world a test built itself.
//
// ⚠⚠ AND IT NEEDS A FIXTURE OF ITS OWN, WHICH IS HALF OF WHY IT IS HERE. The wedding's gate is 23 –
// the owner's ruled age, living in the hazard – and the OLDEST career in the corpus was `pro` at
// **21**. Not one of the ten could reach the beat on any number of presses, so this case had nowhere
// to start at all. `engaged` is that career: one press before she says it, with the nine weeks
// behind it proved ordinary on the browser's own chain of ticks. See FIXTURE_NAMES in
// tools/e2e-fixtures-read.ts and the recipe in tools/e2e-fixtures.ts.
//
// ⚠ ONE FIXTURE AND NOT TWO, DELIBERATELY. The tempting cheaper shape is a second career parked on
// the wedding week itself – but its engagement would then have been answered by the GENERATOR, and
// «answered through the real UI» is precisely the half the brief asks a browser for. So the fixture
// parks before the announcement and the spec walks the whole distance.
//
// ⚠⚠ WHAT THIS SPEC CANNOT SEE, SAID OUT LOUD RATHER THAN QUIETLY DROPPED – and it is TWO things,
// both of which the schema move might be expected to hand a browser:
//
//   * `partnerName` reaches NO SURFACE at W1–W2. The engine writes it at the engagement and every
//     line of copy deliberately withholds it – «whether a surface speaks the husband's name is T7's
//     wording question, not a default» (world/lifeBeat.ts). A browser has no honest assertion to make
//     about a string nothing prints.
//   * `latchedWeek`'s own VALUE is not drawn anywhere either. What the wedding puts on screen is the
//     kept feed row, and a `WorldEvent` survives a save whatever the episode row holds – so steps 7
//     and 8 below are honestly «the wedding a player reached is still there after both doors», never
//     «the latch field round-tripped». The field itself round-trips through `encodeExportFile` /
//     `decodeExportFile` in tests/e2e-fixtures.test.ts, where the world can be opened and read; this
//     file would be claiming more than it can see.
//
// What the file door DOES prove from here, and no other layer runs: that a v83 save the app itself
// wrote is ACCEPTED back by `decodeExportFile` – the size cap, the magic, the declared-version check,
// the SHA-256, the bounded inflate, the BOUNDS WALK over the parsed object and the migration ladder.
// A schema bump whose new fields the guard chain refused would fail here and nowhere else in a
// browser.
//
// -------------------------------------------------------------------------------------------------
// ⭐ THE ARMS, WRITTEN DOWN (the standing rule since wave 2: «this wave writes each arm down»). Each
// was made against the ENGINE **in a worktree at HEAD** – the main checkout had another builder in it
// – this file RUN in a real browser against it, and then thrown away with the worktree; the red
// assertion is named. Control green first, and again between each one.
//
//   A. `rollWedding` (src/engine/world/lifeBeat.ts): the closing `raiseLifeBeat(world, 'engaged', …)`
//      deleted, so she decides and nobody is told.
//      -> RED at step 2 – her card never comes up.
//   B. `landWedding` (same file): the `fireMilestone(world, \`wedding:…\`, …)` line dropped, so the
//      latch is written and the week says nothing.
//      -> RED at step 6 – there is no kept row under the wedding week's News.
//      ⚠ AND NOT `episode.latchedWeek = world.week`, WHICH WAS THE FIRST ARM WRITTEN AND IS NOT ONE:
//      `fireMilestone` is idempotent per KEY, not per latch, so dropping the latch leaves the row
//      firing exactly once anyway and this file stays green. An arm that cannot fail is the thing
//      these blocks exist to catch, and it caught itself.
//   C. `landWedding`: `world.week - row.week < …weeksAfterEngagement` changed to `<=`, so the
//      wedding lands one week late.
//      -> RED at step 6, and on the assertion ABOVE the row's – «there is no News table for W690 at
//      all». That is worth recording rather than correcting: the wedding week's table exists only
//      because the wedding put an event on it, which is what makes the eight presses a real count
//      rather than a number somebody watched the screen for.
//
// ⚠ STEPS 7 AND 8 ARE ARMED BY B AND C (no row survives either door if no row was ever written) and,
// for the doors THEMSELVES, by their own negative halves: each asserts the week that must NOT be on
// screen, which is the only thing that tells «the save was read» from «nothing happened». A seed
// that re-fired would show the fixture's week at step 7; an import that did nothing would leave
// `weddingWeek + 1` on screen at step 8.

import { test, expect } from './careerAt'
import type { Locator, Page } from '@playwright/test'
import { weekLabel } from '../src/shared/dates'
import {
  dismissTourBriefing,
  goHome,
  importFile,
  onScreenWeek,
  openSaves,
  weekButton,
} from './journey'

/**
 * HIS THREE ANSWERS, TRANSCRIBED RATHER THAN IMPORTED – `WEEK_ACTION_NAME`'s own arrangement in
 * e2e/journey.ts, for the reason `tsconfig.e2e.json`'s header gives: `LIFE_BEAT_OPTIONS` lives in
 * `src/engine/world/lifeBeat.ts`, and listing the engine in this composite project would type-check
 * ~200 modules a second time and load them in every Playwright worker.
 *
 * ⚠ A CLOSED SET, AND THE ORDER IS THE ENGINE'S – e2e/life-beat.spec.ts' and e2e/breakup.spec.ts'
 * own rule. The dialog renders the options it is handed, verbatim and in order, so a wave that
 * re-words an answer or adds a fourth goes red HERE, on the only controls this card has. The words
 * are the owner's (CLAUDE.md invariant 4) and are DRAFTS until his pass
 * (docs/plans/life-wave-7-strings-2026-09.md); this file copies them, it never proposes them.
 */
const HIS_ANSWERS = [
  'Give them our blessing',
  'Say it is her decision, and step back',
  'Tell her we think it is a mistake',
] as const

/** The one he presses – `'bless'`, the first of the three, and the SAME id `tools/e2e-fixtures.ts`
 *  pressed in the look-ahead that accepted this seed.
 *
 *  ⚠⚠ THE TWO MUST AGREE, AND HERE THAT IS NOT A CONVENTION BUT ARITHMETIC. `answerLifeBeat` moves
 *  `bond`, and bond is read by the hazards that run in the eight weeks below – so pressing a
 *  different answer would walk a different chain of weeks from the one the recipe measured to be
 *  ordinary. `ENGAGED_ANSWER_ID` in the generator is this constant's other half. */
const HIS_ANSWER = HIS_ANSWERS[0]

/** The feed line the engine writes for that answer (`ANSWER_EVENT.engaged.bless`), matched on its
 *  tail so the sentence's opening clause is free to move. ⚠ DRAFT COPY, the owner's (invariant 4). */
const HIS_ANSWER_ROW = /We gave them our blessing/

/** Her card, by the heading the ENGINE assembled (`ENGAGED_HEADING`).
 *
 *  ⚠ ONE FRAME, KEYED ON NOTHING, which is why this is an exact name and not a shape: the heading
 *  reads the bond band nowhere – «she has decided, and the deciding is hers» is the same fact at
 *  every distance – so unlike the ending's two registers there is exactly one string this card can
 *  wear. Naming it is also what tells it apart from any other dialog the same tick could raise:
 *  `getByRole('dialog')` alone would silently follow the queue. */
const HER_CARD = { name: 'A wedding is coming, and she has made up her mind' }

/**
 * ⭐⭐⭐ THE KEPT ROW THE WEDDING WRITES, AND THE 🏆 IS HALF THE ASSERTION.
 *
 * `landWedding` fires it through the MILESTONE CHANNEL (`fireMilestone`), which is `markSchoolEnd`'s
 * own two-surface idiom: the feed keeps the line past every prune (`keep: true`) and the album keeps
 * the row. Home draws `EVENT_EMOJI.milestone` – 🏆 – in front of a `type: 'milestone'` row and
 * nothing in front of an ordinary one, so matching the glyph is how a browser can say the row came
 * down THAT channel rather than as a plain feed line that happens to say the same words.
 *
 * ⚠ THE ALBUM'S HALF IS NOT VISIBLE FROM HERE AND THE ABSENCE IS DELIBERATE, not an oversight:
 * `buildScroll` is assembled by `buildEndingView` (world/endings.ts), so the scroll exists only once
 * a career is over – and a career that has ended cannot also be one that just got married this week.
 * `tests/e2e-fixtures.test.ts` is where the `captureMilestone` half is asserted, off the fixture's
 * own decoded world.
 *
 * ⚠ MATCHED ON THE OPENING ONLY. The sentence is a DRAFT for the owner's pass (invariant 4), so its
 * tail must be free to move without reddening a browser test.
 */
const WEDDING_ROW = /^🏆 Her wedding day\./

/**
 * ⚠⚠ TRANSCRIBED, AND IT IS THE ONE NUMBER IN THIS FILE THAT COULD GO STALE –
 * `ECONOMY.wedding.weeksAfterEngagement`, which `tsconfig.e2e.json` forbids this project from
 * importing (e2e/elite-gate.spec.ts writes the gate's 150 longhand for the same reason and says so).
 *
 * ⚠ IT IS SAFE TO TRANSCRIBE BECAUSE IT CANNOT ROT IN SILENCE. The fixture's recipe asserts the
 * latch landed on exactly this many ticks after the answer, against the constant itself – so a wave
 * that moves the constant moves the fixture, and the count below then reaches a week with no wedding
 * on it and step 6 goes red naming the row. The failure mode a transcription usually has – both
 * sides quietly agreeing on the wrong thing – is not reachable from here, because only one side is
 * a copy.
 */
const WEEKS_AFTER_ENGAGEMENT = 8

/** Come back to the app the way a player does – a full navigation, a cold boot, a fresh worker.
 *  e2e/persistence.spec.ts' own helper and its own argument: the splash is on every launch and waits
 *  for `game.init()` to settle, so clicking it by name IS the wait for the store to have finished
 *  asking the worker to reopen the database. */
async function reload(page: Page): Promise<void> {
  await page.reload()
  await page.getByRole('button', { name: 'Tap to start' }).click()
}

/**
 * THE SEASON WRAP-UP, STEPPED THROUGH RATHER THAN ASSERTED.
 *
 * ⚠⚠ A CONDITIONAL IN A TEST IS A SMELL AND THIS ONE IS ARGUED FOR, the way `answerOpeningKnock`'s
 * is – and the thing it guards against is a REGENERATION rather than today's fixture. The seed in
 * the manifest as this was written parks at an in-season week whose ten quiet weeks stay inside one
 * season, so every call below is a no-op. But a nine-week stretch with no tournament in it is a rare
 * shape in a 26-year-old's calendar and the OFF-SEASON is where such stretches cluster: of the seven
 * engagements the first census found, the two whose following weeks were clearest were the two that
 * ran into it. So the next search can easily land this walk across a season boundary, and a season
 * turning over is weather this journey passes through rather than anything it is about – what a
 * wrap-up SAYS is e2e/week-advance.spec.ts's claim and tests/component/season-wrapup-mirror.test.ts's,
 * and re-making it here would be a second copy of both.
 * ⚠ THE RECIPE DOES NOT REJECT THE CROSSING, deliberately – it would be rejecting the state's most
 * likely shape to save this six-line helper.
 *
 * ⚠ AND THE CONDITIONAL IS ON PRESENCE ONLY – the IDENTITY is in the locator. Any OTHER dialog on
 * that tick leaves this a no-op and the `Proceed to Home` press immediately after it fails on a
 * blocking overlay, loudly, naming the control it could not reach. A bare `getByRole('dialog')` here
 * would have pressed Continue on whatever turned up.
 */
async function passSeasonWrapUp(page: Page): Promise<void> {
  const wrapUp = page.getByRole('dialog', { name: /^Season \d{4} · wrap-up/ })
  if (!(await wrapUp.isVisible().catch(() => false))) return
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(wrapUp).toHaveCount(0)
}

/**
 * ONE ORDINARY WEEK, walked the way the product makes a player walk one.
 *
 * ⚠ THE THREE STEPS ARE THE PRODUCT'S OWN ROUTE AND ARE NOT WORKED AROUND – e2e/soft-beat.spec.ts'
 * note, verbatim in intent: a resolved week opens its own story by itself, so the first thing across
 * the boundary is a NAVIGATION the app performed, and `Proceed to Home` is the only door back. A
 * spec that skipped it would be asserting about a hub the player is no longer on.
 *
 * ⚠ THE WEEK IS PASSED IN AND ASSERTED, not counted inside. Nine presses that each "moved a week"
 * can still arrive at the wrong week if one of them was a resume rather than an advance; naming the
 * destination makes every press say where it landed.
 */
async function advanceOneWeek(page: Page, to: number): Promise<void> {
  await expect(weekButton(page)).toBeEnabled()
  await weekButton(page).click()
  await expect(page.getByRole('region', { name: /^Week story/ })).toBeVisible()
  await passSeasonWrapUp(page)
  await page.getByRole('button', { name: 'Proceed to Home' }).click()
  await expect(page.getByText(onScreenWeek(to))).toBeVisible()
}

/** Home's News table for one week, by the name `HomeScreen.vue` gives it (`News – W12 '32`). One
 *  table PER WEEK is the app's own shape (defect D8's fix), which is what lets this spec say the row
 *  landed on the WEDDING's week rather than merely somewhere in the feed. */
function newsFor(page: Page, week: number): Locator {
  return page.getByRole('table', { name: `News – ${weekLabel(week)}` })
}

test.describe('the wedding', () => {
  test('she announces it, he answers, it lands eight weeks later – and it survives both save doors', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts, seed, profile } = await careerAt('engaged')
    // The briefing is the one doorway this fixture's recipe accepts, and it is OWED on the committed
    // fixture rather than merely tolerated: a career that has reached 23 with somebody in her life is
    // a long way inside the top 50 (this one wakes at WTA #17), and five of the seven engagements the
    // first census found booted the same way. Dismissing it writes localStorage and no world, so the
    // week below is still exactly the week the recipe measured – `belated`'s precedent, and
    // e2e/journey.ts carries the whole argument.
    await dismissTourBriefing(page)

    // =============================================================================================
    // 1. THE CAREER BOOTS CLEAN, ON AN ORDINARY WEEK
    // =============================================================================================
    //
    // ⚠ THIS STEP IS LOAD-BEARING AND NOT THE USUAL SANITY LINE – e2e/breakup.spec.ts' own note.
    // Every claim below is about what ONE PRESS does; if the fixture booted holding a card of its
    // own, the press would be answering somebody else's question.
    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()
    await expect(
      weekButton(page),
      `the '${profile.kidName}' fixture is expected to boot on an ORDINARY week – nothing pending, ` +
        'nothing blocking, one attachment live and a year deep. If this is red after a fixture ' +
        'regeneration, tools/e2e-fixtures.ts stopped finding such a week: its recipe rejects a seed ' +
        'that boots behind a knock, a birthday, a reveal, a beat or a soft row, and the rejection ' +
        'reason is printed by the generator.',
    ).toBeEnabled()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // =============================================================================================
    // 2. ONE PRESS, AND SHE SAYS IT
    // =============================================================================================
    await weekButton(page).click()
    // ⚠ THE WRAP-UP DOORWAY IS ASKED ON BOTH SIDES OF HER CARD, because `App.vue` renders exactly ONE
    // blocking overlay at a time and which of the two is in front is the queue's business, not this
    // spec's. Whichever order the tick produces, one of these two calls is a no-op and the other is
    // the doorway – and neither can touch a dialog that is not the wrap-up, because the identity is
    // in the locator rather than in the branch.
    await passSeasonWrapUp(page)

    const card = page.getByRole('dialog', HER_CARD)
    // ⚠ ARM A, RUN: delete the `raiseLifeBeat(world, 'engaged', …)` at the foot of `rollWedding` and
    // this line goes red – she decides, the name is written onto the episode, and nobody is asked.
    await expect(
      card,
      'the week was pressed on the tick `rollWedding` decides she is getting married, and no card ' +
        'came up. The hazard draws on `seed:life:wedding:<week>` – a (seed, calendar) key no entry ' +
        'and no player choice can move – so either the raise moved or the gate stopped reading the ' +
        'episode this fixture was accepted for.',
    ).toBeVisible()
    await expect(card).toHaveAttribute('aria-modal', 'true')

    // =============================================================================================
    // 3. THE CARD IS HER LINE AND THREE ANSWERS, AND THERE IS NO FOURTH WAY OUT
    // =============================================================================================
    //
    // ⚠ HER WORDS ARE ASSERTED BY THE FACT THAT THEY NAME THE GROUP, NOT BY THEIR SHAPE, and that is
    // one register weaker than e2e/breakup.spec.ts' «narration plus one quoted span» ON PURPOSE. The
    // pool has a DRY cell – «She is getting married. The news reached this house second-hand.» –
    // which a `strained`/`cold` home draws and which carries no quotation at all. A walked career
    // sits at bond 70 and would take the voiced pool, but pinning the quoted span would make this
    // line a hostage to a band no clause of the recipe holds.
    const answers = card.getByRole('radiogroup')
    await expect(
      answers,
      'the answers are not named by her line – `aria-labelledby="life-beat-said"` is what tells a ' +
        'listener which sentence these three are a reply to.',
    ).toHaveAccessibleName(/^She /)

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
      'a control that is not one of his three answers appeared on the card – walking away from a ' +
        'life beat must not be a thing the player can do.',
    ).toHaveCount(0)

    // ⭐⭐ AND NOTHING BEHIND IT MAY BE PRESSED. `LIFE_BEAT_BLOCKING['engaged']` is `true` – tier 2's
    // own price at the layer's biggest ask – and what that MEANS for a player is that the card's
    // scrim owns every pixel, not that anything is disabled, which nothing is. `trial: true` runs
    // Playwright's actionability checks (visible, stable, RECEIVES POINTER EVENTS, enabled) and
    // performs no click, which is exactly the question.
    //
    // ⚠ THE CONTROL IT ASKS ABOUT IS `Proceed to Home` AND NOT THE ADVANCE BAR – e2e/breakup.spec.ts
    // paid for this one: after an advance the app is on the WEEK'S STORY, whose CTA replaces the week
    // button, so a trial click on `weekButton` would report «blocked» for the wrong reason.
    // ⚠ THE VISIBILITY ASSERTION IS LOAD-BEARING: without it a control removed from the DOM would
    // fail the trial too, and this claim would pass for the opposite reason.
    const proceed = page.getByRole('button', { name: 'Proceed to Home' })
    await expect(proceed).toBeVisible()
    const reached = await proceed
      .click({ trial: true, timeout: 1500 })
      .then(() => 'reached', () => 'blocked')
    expect(
      reached,
      "the week story's own door was reachable while the engagement card was on screen – it is a " +
        'blocking beat, so nothing behind it may be pressed.',
    ).toBe('blocked')

    // =============================================================================================
    // 4. HE ANSWERS HER – select, then Proceed, across the worker boundary
    // =============================================================================================
    // ⚠ ROUND 42 #8: the radio only SELECTS, and the Proceed it reveals is what records («выбор +
    // proceed», the owner's ruling after his double-tap answered a beat before he could read it).
    await card.getByRole('radio', { name: HIS_ANSWER, exact: true }).click()
    await expect(card, 'a selection alone must not close her card').toBeVisible()
    await card.getByRole('button', { name: 'Proceed', exact: true }).click()
    await expect(card, 'her card stayed up after the answer was recorded').toHaveCount(0)

    // The engagement week, and his answer read back off the hub. The engine wrote its own feed line
    // during `answerLifeBeat`; a mocked boundary cannot produce it at all, because there is nothing
    // on the other side to write it.
    //
    // ⚠ ON THE NEWS AND NOT ON THE MONEY SCREEN, which is the no-cents rule surfacing – and this
    // wave's own ruling behind it: the wedding's drafted $12,000 was RULED OUT on 18.09 («я думаю
    // как с подарками, никто и нисколько»), so nothing in this whole journey touches the ledger.
    const engagedWeek = facts.week + 1
    await passSeasonWrapUp(page)
    await proceed.click()
    await expect(page.getByText(onScreenWeek(engagedWeek))).toBeVisible()
    await expect(page.getByText(HIS_ANSWER_ROW)).toBeVisible()

    // =============================================================================================
    // 5. EIGHT ORDINARY WEEKS – the distance the engine puts between deciding and doing
    // =============================================================================================
    //
    // ⭐⭐⭐ AND NOT ONE OF THEM IS A DECISION, WHICH IS WHAT THE FIXTURE BOUGHT. `landWedding` runs
    // on every tick and refuses until the day has come; the recipe walked these same eight ticks on
    // the browser's own chain (raw `tickWeek`, no entry policy) and rejected any seed that met a
    // reveal, a knock, a birthday or a beat on the way – these eight, and the ninth step 8 spends.
    // So the loop below is eight identical presses and needs no branch of its own; if it ever does,
    // the fixture moved and the generator will say so on the way past.
    const weddingWeek = engagedWeek + WEEKS_AFTER_ENGAGEMENT
    for (let week = engagedWeek + 1; week <= weddingWeek; week++) {
      await advanceOneWeek(page, week)
    }

    // =============================================================================================
    // 6. ⭐⭐⭐ THE WEDDING IS ON THE FEED, UNDER ITS OWN WEEK
    // =============================================================================================
    //
    // ⚠ ARM B, RUN: drop the `fireMilestone` line from `landWedding` and this is where it goes red –
    // the latch is written, the album keeps its row, and the week says nothing to the player.
    // ⚠ ARM C, RUN: turn the `<` in `landWedding`'s week gate into `<=` and it goes red here too,
    // because the row then belongs to the ninth week and not the eighth.
    const weddingNews = newsFor(page, weddingWeek)
    await expect(
      weddingNews,
      `there is no News table for career week ${weddingWeek} (${weekLabel(weddingWeek)}) at all – ` +
        'the eight presses did not reach the week the wedding was measured to land on, or the week ' +
        'they reached has nothing on it, which is the same news: the wedding row is the only thing ' +
        'that puts a table on that week.',
    ).toBeVisible()
    await expect(
      weddingNews.getByText(WEDDING_ROW),
      'the wedding never landed. `landWedding` needs an answered `\'engaged\'` row, its episode ' +
        'still active, no latch yet and the day come – and the 🏆 in front of the sentence is the ' +
        'MILESTONE channel, so a row without it would be an ordinary feed line wearing the same words.',
    ).toBeVisible()

    // =============================================================================================
    // 7. DOOR ONE – THE DATABASE. The browser is thrown away and the marriage comes back.
    // =============================================================================================
    //
    // ⚠ THE WEEK ASSERTED IS ONE THE FIXTURE HAS NEVER BEEN AT, which is e2e/persistence.spec.ts'
    // whole design and the only thing that makes this a test rather than a demonstration: a reload
    // that showed the SEEDED week would pass in a world where the autosave never happened, in one
    // where the seed re-fired, and in one where persistence works. The wedding was reached nine
    // browser weeks after the bytes this context was seeded with, so there is exactly one
    // explanation for that row being on screen after a cold boot – and the second line, the week
    // that must NOT be there, is what rules out a seed that fired again.
    await reload(page)
    await expect(page.getByText(onScreenWeek(weddingWeek))).toBeVisible()
    await expect(page.getByText(onScreenWeek(facts.week))).toHaveCount(0)
    await expect(
      newsFor(page, weddingWeek).getByText(WEDDING_ROW),
      'the wedding did not survive a cold boot. A brand-new worker rebuilt this world out of ' +
        'IndexedDB through `decompressWorld`, so a missing row here is a week the player lived ' +
        'through failing to round-trip.',
    ).toBeVisible()

    // =============================================================================================
    // 8. DOOR TWO – THE FILE. The other codec, the other guard set, the migration ladder.
    // =============================================================================================
    //
    // ⚠ TWO DOORS, TWO TRUST LEVELS, and the second does not follow from the first – `saveCodec.ts`'s
    // own header, and the reason tests/e2e-fixtures.test.ts loads every fixture twice. The database
    // door above is `compressWorld`/`decompressWorld`; this one is `encodeExportFile` and, on the way
    // back in, the whole untrusted chain plus the MIGRATION LADDER. For a wave whose deliverable is a
    // schema bump, that ladder is the machinery, and this is the only place a browser runs it.
    await openSaves(page)
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export to file' }).click()
    const download = await downloadPromise
    // The name the worker built out of the world it was holding – the cheapest possible proof that
    // the export read the MARRIED world and not the seeded one.
    expect(download.suggestedFilename()).toBe(`tennis-sim_${seed}_w${weddingWeek}.tsave`)
    const chunks: Buffer[] = []
    for await (const chunk of await download.createReadStream()) chunks.push(chunk as Buffer)
    const exported = Buffer.concat(chunks)

    // ⚠⚠ ONE MORE WEEK FIRST, AND IT IS WHAT MAKES THE IMPORT UNAMBIGUOUS. This browser already holds
    // the married career, so importing it back over itself would assert nothing: the row would be on
    // screen whether the file was read or ignored. Moving the career PAST the wedding week first
    // leaves exactly one explanation for `weddingWeek` being on screen afterwards – it came out of
    // the file. (The recipe proved this ninth press ordinary too, for precisely this step.)
    await goHome(page)
    await advanceOneWeek(page, weddingWeek + 1)
    await expect(page.getByText(onScreenWeek(weddingWeek))).toHaveCount(0)

    await openSaves(page)
    await importFile(page, download.suggestedFilename(), exported)
    await goHome(page)
    await expect(page.getByText(onScreenWeek(weddingWeek))).toBeVisible()
    await expect(
      page.getByText(onScreenWeek(weddingWeek + 1)),
      'the import did not replace the career – the app is still on the week it had walked to.',
    ).toHaveCount(0)
    await expect(
      newsFor(page, weddingWeek).getByText(WEDDING_ROW),
      'the wedding did not survive the file door. These are the app\'s own exported bytes coming ' +
        'back through `decodeExportFile` – the size cap, the magic, the declared-version check, the ' +
        'SHA-256, the bounded inflate, the bounds walk and the migration ladder – and a v83 save the ' +
        'guard chain refused would fail here and nowhere else in a browser.',
    ).toBeVisible()

    expect(crashes, 'the app threw while she got married').toEqual([])
  })
})
