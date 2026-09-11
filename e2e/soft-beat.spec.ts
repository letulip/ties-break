// JOURNEY: SHE CAME BY WITH SOMETHING SMALL, THE WEEK WENT ON ANYWAY, AND HE OPENED IT WHEN HE CHOSE.
//
// SEAM OWNED: #1, the Web Worker boundary, with #5 (real input) carrying it. Tier 1 – v74 T15's soft
// surface, who-she-is §5b's «soft – answerable, never lost» – is the FIRST thing this game raises
// that does not stop the world. Its three halves live in three different places and only a real
// browser over a real worker can hold all three in one claim:
//
//   * the ENGINE declares the kind non-blocking (`LIFE_BEAT_BLOCKING`, engine/world/lifeBeat.ts), so
//     `pendingLifeBeat` never returns the row and `advanceRefusal` never mentions it;
//   * the SHELL never queues it (`blockingOverlay` deliberately does not read `snapshot.softBeat`),
//     so nothing is laid over the hub;
//   * and the CARD on Home opens the SAME `LifeBeatDialog` the blocking beats use – «No new dialog
//     exists anywhere» is the ruling, and one prop is what keeps it true.
//
// Each half is unit- or mount-pinned already (tests/wave3-soft-surface.test.ts,
// tests/component/wave3-soft-card.test.ts). What neither of those layers can say, and what this file
// is for, is that they compose over the wire: a real world raises the row, a real hub draws the
// invitation, THE REAL WEEK BUTTON STILL WORKS WHILE IT IS UP, a real press opens the real dialog,
// and the answer that comes back through the worker takes the card away for good.
//
// ⚠ WHY THIS IS NOT A COMPONENT TEST, and it is a sharper version of life-beat.spec.ts's own answer.
// `tests/component/` hands a screen a snapshot object, so a mounted test can put the card and any
// dialog on screen in any combination – there is no engine on the other side to object, and above
// all THERE IS NO WEEK TO TICK. «The week was never stopped by it» is a claim about `advanceWeeks`
// refusing nothing, and the only place a spec can watch a player press the advance bar and reach the
// next week with her card still on screen is here.
//
// ⚠ AND IT NEEDS ITS OWN FIXTURE, which is the other half of why it is here – the same shape of
// problem `unheard` solved one tier up. A soft row is live for three weeks (`liveSoftBeat`, derived
// from `week − row.week`), and no committed career was parked inside one: measured over the seven,
// six carry `'small-talk'` rows – 40 of them, all unanswered – and EVERY one is expired, the closest
// miss being `junior`'s youngest at 4 weeks against a window of 3. So `soft` is that career: week 9,
// the row raised on the week it is parked on, nothing blocking in front of it. See FIXTURE_NAMES in
// tools/e2e-fixtures-read.ts and the recipe in tools/e2e-fixtures.ts, whose clauses are what keep it
// that career through the next regeneration.
//
// -------------------------------------------------------------------------------------------------
// ⭐ THE ARMS, WRITTEN DOWN (wave-3 brief §0.7: «every new net is mutation-verified and the ARM is
// RECORDED»). Three mutations were made against this spec and each was RUN, on 11.09, one at a time
// and reverted. Each reddens a DIFFERENT assertion, which is what says the three steps are three
// claims rather than one claim asserted three times:
//
//   A. `LIFE_BEAT_BLOCKING['small-talk']` (src/engine/world/lifeBeat.ts §1): `false` -> `true`, which
//      is tier 1 shipped through the hard pause the owner reverted.
//      -> RED AT STEP 1, on her card: «expect(locator).toBeVisible() failed – Locator:
//         getByRole('button', { name: /^She came by with something/ }); Expected: visible; Error:
//         element(s) not found». The row is pending now, so `liveSoftBeat` refuses it, the invitation
//         is gone and the blocking dialog is up over the hub instead. This is the arm that matters –
//         it is the one the whole tier-1 design is a decision AGAINST.
//   B. `liveSoftBeat`'s window (same file §1): `world.week - row.week < ttl` -> `<= 0`, so the row is
//      live on the week it is raised and dead the moment the week moves.
//      -> RED AT STEP 2: «the card went when the week did. A soft row survives the weeks inside its
//         window …» on the same locator, «element(s) not found». ⚠ STEP 1 PASSED IN THIS ARM, which
//         is the whole reason it is a separate one: the card is drawn on arrival and vanishes on the
//         advance, so this is what proves the fixture is read back INSIDE its window rather than
//         merely parked on its first week – a difference nothing in step 1 can see.
//   C. `<LifeBeatDialog v-if="showSoftBeat" soft />` (src/App.vue): the `soft` prop dropped, so the
//      mount reads `snapshot.lifeBeatPrompt` – null on this career – instead of the soft prompt.
//      -> RED AT STEP 3: «the tap opened no dialog …» – Locator: getByRole('dialog', { name: /^She
//         came to us with something/ }), «element(s) not found». The card is still there, the press
//         still lands, and nothing opens. It is the arm for «the same component, pointed at the other
//         field», which is the only part of T15's «no new dialog exists anywhere» a browser can check.
//
// ⚠ AND A FOURTH RED THAT WAS NOT A MUTATION BUT IS WORTH THE LINE, because it is what the ARM
// DISCIPLINE IS FOR: the first run of this spec went red at step 2 on the very assertion arm B now
// covers, and the cause was the spec's own – after an advance the app navigates to the week's story
// by itself, so the card was being looked for on a hub the player had left. The walk back through
// `Proceed to Home` is the fix, and it is the product's own door rather than a workaround.
//
// A spec whose arms have not been run is a spec nobody has any reason to believe.

import { test, expect } from './careerAt'
import { onScreenWeek, weekButton } from './journey'

/**
 * WHAT THE PARENT MAY SAY BACK, TRANSCRIBED RATHER THAN IMPORTED – `HIS_ANSWERS`' own arrangement in
 * e2e/life-beat.spec.ts, for the reason that file gives: `LIFE_BEAT_OPTIONS` lives in
 * `src/engine/world/lifeBeat.ts`, and listing the engine in `tsconfig.e2e.json` would type-check
 * ~200 modules a second time and load them in every Playwright worker.
 *
 * ⚠ A CLOSED SET, AND THE ORDER IS THE ENGINE'S. The dialog renders the options it is handed,
 * verbatim and in order, so a wave that re-words an answer or adds a fourth goes red HERE – on the
 * only controls this card has. The words are the owner's (CLAUDE.md invariant 4) and every one of
 * them is a DRAFT until his вычитка passes; this file copies them, it never proposes them.
 *
 * ⚠ AND ALL THREE ARE BOND-NEUTRAL, which is why pressing any of them is safe for a spec: tier 1 has
 * no economy («the delta table stays the big beats'»), so answering moves no number at all.
 */
const HIS_ANSWERS = [
  'Ask her to say more',
  'Tell her what we think',
  'Tell her it can keep',
] as const

/** THE INVITATION ON THE HUB, by the shape of the one line the engine gives it (`SMALL_TALK_CARD`).
 *  A `Card as="button"` with no `aria-label`, so its accessible name is its whole text – addressed
 *  by the START of that name, which is `openMoney`'s own idiom in e2e/journey.ts.
 *
 *  ⚠ BY SHAPE AND NOT BY THE WHOLE SENTENCE, deliberately: the line is a draft awaiting the owner's
 *  вычитка, and what every string in this wave obeys whatever he does to the words is the presence
 *  law's own rule – the narration names HER. Pinning the full sentence here would put his copy in
 *  the slowest layer there is. */
const HER_CARD = { name: /^She came by with something/ }

/** THE DIALOG THE TAP OPENS, by the heading the ENGINE assembled. All three registers of
 *  `SMALL_TALK_HEADING` open this way («She came to us with something good this week» / «…with
 *  something this week» / «…with something on her mind»), so this matches tier 1 and can match
 *  nothing else on the page: the card's own line is «She came BY with something small». */
const HER_DIALOG = { name: /^She came to us with something/ }

/** ⭐⭐ THE ONE CLASS THIS FILE ADDRESSES, AND IT IS THE CLAIM THAT NEEDS IT. Role and accessible
 *  name are the house rule (e2e/journey.ts's header) and they carry everything else below – but
 *  «tapping it opens the SAME `LifeBeatDialog`» is a claim about WHICH COMPONENT DREW THE CARD, and
 *  a component's identity is not in the accessibility tree. `dialog-card season-summary
 *  life-beat-dialog` is `LifeBeatDialog.vue`'s own signature and no other file in `src/` emits it,
 *  so this is the one observable a browser has for T15's «no new dialog exists anywhere» ruling: a
 *  second component built for the soft entrance would have to reproduce it verbatim to pass here.
 *  ⚠ It is asserted ON the dialog node, not instead of it – the role, the modality and every word on
 *  the card are still read through the tree. */
const LIFE_BEAT_COMPONENT = '[role="dialog"].life-beat-dialog'

test.describe('the tier-1 soft surface', () => {
  test('she came by, the week did not stop, and the card is answered when he opens it', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts, profile } = await careerAt('soft')

    // =============================================================================================
    // 1. THE INVITATION IS ON THE HUB, AND NOTHING WAS LAID OVER ANYTHING
    // =============================================================================================
    const card = page.getByRole('button', HER_CARD)
    await expect(
      card,
      `the '${profile.kidName}' fixture is expected to boot holding a LIVE, unanswered tier-1 row ` +
        'with its card on Home. Two things can put this red. If it is the only red test after a ' +
        'fixture regeneration, the recipe stopped finding one: tools/e2e-fixtures.ts searches for a ' +
        'career parked on the week that raises it, with clauses beside it for every blocking ' +
        'question that would have covered the hub. Otherwise the SURFACE moved – either the kind ' +
        'stopped being declared non-blocking (`LIFE_BEAT_BLOCKING`), which takes the row out of ' +
        '`liveSoftBeat` and puts a modal here instead, or the card stopped reading ' +
        '`snapshot.softBeat` (measured: the first of those is the arm that produced this exact ' +
        'failure).',
    ).toBeVisible()

    // ⭐⭐ AND THERE IS NO DIALOG ON THE PAGE AT ALL, which is the negative half of the same fact and
    // is worth stating separately: tier 1 is answerable from a card the player CHOOSES to tap, so a
    // career holding one boots into the hub and not into a question. `blockingOverlay` never reads
    // `snapshot.softBeat`, and this is that decision seen from the page.
    await expect(
      page.getByRole('dialog'),
      'a blocking overlay was up on a career whose only unanswered row is a SOFT one. Tier 1 is ' +
        'not in `blockingOverlay`\'s queue by construction – a card here means the hard pause the ' +
        'owner reverted has come back on the surface side.',
    ).toHaveCount(0)

    // Time has not moved: the week on screen is still the one the manifest was written at.
    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()

    // =============================================================================================
    // 2. ⭐⭐⭐ THE LOAD-BEARING CLAIM: THE WEEK WAS NEVER STOPPED BY IT
    // =============================================================================================
    //
    // This is the whole of what separates tier 1 from tier 2, and it is asserted rather than implied.
    // e2e/life-beat.spec.ts runs the IDENTICAL measurement on `unheard` and reads «blocked» out of
    // it, because a blocking beat's card is an overlay whose scrim owns every pixel of the page;
    // here the same three lines must read «reached». `trial: true` is Playwright's own way to ask
    // «could a player press this» – it runs the actionability checks (visible, stable, RECEIVES
    // POINTER EVENTS, enabled) and performs no click.
    await expect(weekButton(page)).toBeVisible()
    await expect(weekButton(page)).toBeEnabled()
    const reached = await weekButton(page)
      .click({ trial: true, timeout: 1500 })
      .then(() => 'reached', () => 'blocked')
    expect(
      reached,
      'the advance control could not be reached while a tier-1 card was on the hub. The week is ' +
        'not stopped for a soft row – `pendingLifeBeat` reads BLOCKING rows only, so ' +
        '`advanceRefusal` has nothing to say about this one – so either something is drawn over ' +
        'the page (a scrim that should not exist) or the button is disabled by a clause that ' +
        'should not be reading this row.',
    ).toBe('reached')

    // ⭐⭐ AND THE PRESS IS REAL, BECAUSE «REACHABLE» IS NOT «TICKS». The engine has to actually
    // advance a week it was never asked to hold: the row is unanswered, it stays unanswered, and the
    // next week arrives anyway.
    //
    // ⚠ THE ROUTE AFTER THE PRESS IS THE PRODUCT'S OWN AND IS WALKED, NOT WORKED AROUND – the same
    // three lines e2e/week-advance.spec.ts takes and for the reason it writes down there: a resolved
    // week opens its own story by itself, so the first thing across the boundary is a NAVIGATION the
    // app performed, and `Proceed to Home` is the only door back. Measured the first time this spec
    // ran: without the walk it asserted about a hub the player was no longer on.
    await weekButton(page).click()
    await expect(page.getByRole('region', { name: /^Week story/ })).toBeVisible()
    await expect(
      page.getByText(onScreenWeek(facts.week + 1)),
      'the week did not move while an unanswered tier-1 row stood. That row stops nothing – if ' +
        'this is red, `advanceWeeks` is refusing on a soft row and the week has become a hostage ' +
        'to a conversation the design says is optional.',
    ).toBeVisible()
    await page.getByRole('button', { name: 'Proceed to Home' }).click()

    // ⭐⭐⭐ AND SHE IS STILL WAITING – «never lost = the ROW, not the chance» (who-she-is §5b). The
    // window is three weeks (`ECONOMY.life.smallTalkTtlWeeks`) and DERIVED from `week − row.week`, so
    // a week that moved took her to the second of the three and not out of the card's life. The
    // fixture's own look-ahead measured exactly this before the seed was accepted, which is what
    // makes this an assertion about the SURFACE rather than a hope about a constant.
    //
    // ⚠ AND HOME WAS MOUNTED FRESH TO READ IT. The walk above left the screen and came back, so this
    // is the card drawn from the NEW snapshot at the NEW week – not a node that survived because
    // nothing re-rendered it.
    await expect(
      card,
      'the card went when the week did. A soft row survives the weeks inside its window – losing ' +
        'it on the first tick is «never lost» failing on the only surface that can show it.',
    ).toBeVisible()

    // =============================================================================================
    // 3. THE TAP OPENS THE SAME `LifeBeatDialog` – modal only because the player chose to listen
    // =============================================================================================
    await card.click()
    const dialog = page.getByRole('dialog', HER_DIALOG)
    await expect(
      dialog,
      'the tap opened no dialog. The card is only the invitation: App.vue mounts the SAME ' +
        '`LifeBeatDialog` with `soft`, which points it at `snapshot.softBeat.prompt` instead of ' +
        '`snapshot.lifeBeatPrompt` (measured: dropping that one prop is the arm that produced this ' +
        'exact failure).',
    ).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')

    // ⚠ AND IT IS THAT COMPONENT AND NOT A SECOND ONE WEARING ITS HEADING. See
    // `LIFE_BEAT_COMPONENT`: this is the one identity claim the accessibility tree cannot carry, and
    // T15's ruling is exactly an identity claim.
    await expect(
      page.locator(LIFE_BEAT_COMPONENT),
      'the card that opened is not `LifeBeatDialog.vue`. T15 shipped the soft surface as one prop ' +
        'on the existing component – «No new dialog exists anywhere» – because a second component ' +
        'would be a second place her voice could be edited from.',
    ).toHaveCount(1)

    // HER WORDS ARE ASSERTED BY SHAPE, NOT BY COPY, and for life-beat.spec.ts's own reason: which of
    // the twelve lines this career draws is the engine's business (voice x subject), and a spec that
    // pinned the sentence would be pinning the owner's draft copy in the slowest layer there is.
    // What every one of them obeys is the voice bibles' two shape rules, which is what this asks
    // for: the narration names HER, and there is ONE quoted span, at the end.
    const answers = dialog.getByRole('radiogroup')
    await expect(
      answers,
      'the answers are not named by her line – `aria-labelledby="life-beat-said"` is what tells a ' +
        'listener which sentence these three are a reply to, and it is the wiring that says this ' +
        'is the same card the blocking beats draw.',
    ).toHaveAccessibleName(/^She .+"[^"]+"$/)

    // ROUND 40'S CONVENTIONS, ON THE WIRE: real radios in a real group, nothing marked on arrival.
    // The card may not point at an answer, on a card whose whole subject is that the answer is his.
    for (const label of HIS_ANSWERS) {
      const option = dialog.getByRole('radio', { name: label, exact: true })
      await expect(option, `"${label}" is not on her card`).toBeVisible()
      await expect(option, `"${label}" arrived already marked`).toHaveAttribute('aria-checked', 'false')
    }
    await expect(dialog.getByRole('radio')).toHaveCount(HIS_ANSWERS.length)

    // ⭐ EVERY CONTROL IS AN ANSWER AND THERE IS NO X – and on the SOFT entrance that law is the one
    // thing about the card that did not get smaller. The week was never stopped, so nothing is held
    // hostage; but a card opened to hear her out still has no way out that is not one of the three
    // things the parent may say, and one of them is «tell her it can keep».
    await expect(
      dialog.getByRole('button'),
      'a control that is not one of her three answers appeared on the card – walking away from a ' +
        'life beat must not be a thing the player can do (LifeBeatDialog.vue: "every button is an ' +
        'answer and there is no X"), and opening it from a Home card does not change that.',
    ).toHaveCount(0)

    // ...and Escape is not one either. Transcribed from the component's own ruling, exactly as
    // a11y.spec.ts transcribes each card's Escape policy rather than imposing a uniform one.
    await page.keyboard.press('Escape')
    await expect(
      dialog,
      'Escape closed a card whose every way out is meant to be an answer. See LifeBeatDialog.vue ' +
        'before changing this expectation – it is a product ruling, not a convention.',
    ).toBeVisible()

    // =============================================================================================
    // 4. HE ANSWERS HER, AND THE ROW IS WRITTEN – one press, across the worker boundary
    // =============================================================================================
    //
    // ⚠ THE FIRST TAP IS THE ANSWER HERE, and that is a per-kind fact rather than an oversight: the
    // listening detour belongs to the fork's beat, whose `listenFollowUp` carries her continuation.
    // Tier 1 has none (`lifeBeatListenFollowUp` returns null for `'small-talk'`), so there are three
    // answers and no fourth control – which the count above has just said.
    await dialog.getByRole('radio', { name: HIS_ANSWERS[0], exact: true }).click()
    await expect(dialog, 'her card stayed up after an answer was pressed').toHaveCount(0)

    // AND THE INVITATION IS GONE WITH IT. This is the assertion that says the row was ANSWERED in the
    // world rather than the dialog merely closed: the card is drawn from `snapshot.softBeat`, which
    // is `liveSoftBeat` re-derived engine-side, so it can only go away because the row it was
    // standing on now carries an answer. A refused command would have left the snapshot unchanged
    // and the card exactly where it was.
    await expect(
      card,
      'the invitation is still on the hub after it was answered. The card and the prompt are ONE ' +
        'snapshot field on purpose – a surface cannot draw an invitation whose conversation is over.',
    ).toHaveCount(0)

    // ⚠ AND THE WEEK IS STILL THE PLAYER'S, which is the other thing an answer must not change. It
    // was never stopped, so answering cannot have started it – the bar is live on both sides of the
    // conversation, and a spec that only measured before would have left that unsaid.
    await expect(weekButton(page)).toBeEnabled()

    // =============================================================================================
    // 5. ⭐⭐ AND IT WAS WRITTEN DOWN, NOT MERELY HIDDEN – across a real reload
    // =============================================================================================
    //
    // The row is the record. `answerLifeBeat` goes through the worker's `mutate`, so the answered
    // world is committed to IndexedDB like any other command, and a reload reads it back – the seed
    // is a one-shot latch that deliberately does NOT re-fire on a navigation (careerAt.ts's own
    // header). So this is the difference between a UI that stopped drawing a card and a career in
    // which the conversation actually happened, and no other layer can tell those two apart.
    await page.reload()
    await page.getByRole('button', { name: 'Tap to start' }).click()
    await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()
    await expect(
      page.getByRole('button', HER_CARD),
      'the invitation came back after a reload – the answer never reached the disk, so the row on ' +
        'the saved career is still unanswered and still inside its window.',
    ).toHaveCount(0)

    expect(crashes, 'the app threw while she came by').toEqual([])
  })
})
