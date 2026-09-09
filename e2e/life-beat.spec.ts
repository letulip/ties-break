// JOURNEY: SHE SAYS WHAT SHE WANTS, THE WEEK STOPS, AND THE FORK WAITS ITS TURN.
//
// SEAM OWNED: #1, the Web Worker boundary, with #5 (real input) carrying it. The private life's
// wave 2 is an ORDER between two questions that live in the engine and surface as two cards:
// `advanceWeeks` refuses to tick while a `lifeLog` row is unanswered, and `answerFork` REFUSES
// outright while it stands (`FORK_UNHEARD_REFUSAL`, src/engine/world/endings.ts). Both halves are
// unit-pinned in tests/wave2-life-beat.test.ts and the card itself is mounted in
// tests/component/life-beat-dialog.test.ts – so what is left for THIS layer, and what neither of
// those can say, is that the order survives the wire: a real worker's real world raises her card, a
// real press answers it, the snapshot that comes back is the one in which the fork may be answered
// at all, and the week only moves when both have been.
//
// ⚠ WHY THIS IS NOT A COMPONENT TEST. `tests/component/` hands the screens a snapshot object
// directly – so a mounted test can put the beat's prompt and the fork's prompt on screen in either
// order, or both at once, because there is no engine on the other side to object. The claim below is
// precisely that there IS one: the fork's three answers are NOWHERE on the page until her row is
// answered, and they arrive in the very snapshot that clears it.
//
// ⚠ AND IT NEEDS ITS OWN FIXTURE, which is the other half of why it is here. The beat fires on the
// tick that opens the college fork (`schoolEndWeek`), and every other recipe in
// tools/e2e-fixtures.ts walks past that tick through `answerLifeBeat(world, 'listen')` – so no
// committed career could hold a PENDING one. `unheard` is that career: the same week `ending` sits
// on, stopped one answer earlier. See FIXTURE_NAMES in tools/e2e-fixtures-read.ts.
//
// -------------------------------------------------------------------------------------------------
// ⭐ THE ARMS, WRITTEN DOWN (wave-2 runbook §6: «this wave writes each arm down»). Three mutations
// were made against this spec and each was RUN, on 09.09, one at a time and reverted:
//
//   A. `blockingOverlay` (src/composables/blockingOverlay.ts): `'fork'` moved above `'life'`.
//      -> red at step 1 – her card never comes up at all, because the fork's takes its place.
//   B. `showFork` (src/App.vue): the gate re-written to read `snapshot.fork` instead of the queue,
//      so BOTH cards render. -> red at step 3, «Expected: 0, Received: 3» on the fork's answers.
//      This is the arm that matters: it is the only one that leaves her card up and lets the fork
//      be answered anyway, which is exactly the defect this file exists to catch.
//   C. `.dialog-overlay` (src/style.css): `position: fixed; inset: 0` dropped, so the scrim covers
//      nothing. -> red at step 1's trial press, «Expected "blocked", Received "reached"».
//
// A spec whose arms have not been run is a spec nobody has any reason to believe; these three are
// the ones a future wave would break, and each one goes red on its own assertion.

import { test, expect } from './careerAt'
import { onScreenWeek, weekButton } from './journey'

/**
 * HIS THREE ANSWERS, TRANSCRIBED RATHER THAN IMPORTED – `WEEK_ACTION_NAME`'s own arrangement in
 * e2e/journey.ts, for the reason `tsconfig.e2e.json`'s header gives: `LIFE_BEAT_OPTIONS` lives in
 * `src/engine/world/lifeBeat.ts`, and listing the engine in this composite project would type-check
 * ~200 modules a second time and load them in every Playwright worker.
 *
 * ⚠ A CLOSED SET, AND THE ORDER IS THE ENGINE'S. The dialog renders the options it is handed,
 * verbatim and in order, so a wave that re-words an answer or adds a fourth goes red HERE – on the
 * only controls this card has – rather than passing quietly against a card that now says something
 * else. The words themselves are the owner's (CLAUDE.md invariant 4); this file copies them, it
 * never proposes them.
 */
const HIS_ANSWERS = [
  'Tell her we are behind her',
  'Tell her we see it differently',
  'Say nothing, and let her talk',
] as const

/** The FORK's own three, likewise transcribed (`src/components/ForkDialog.vue`). Anchored at the
 *  start because each button's accessible name is its whole text – the bold answer and the line of
 *  consequence under it. This is the set whose ABSENCE is the wave's contract seen from the page. */
const FORK_ANSWERS = /^(Turn professional|Reserve the college place|Stop here)/

/** Her card, by the heading the ENGINE assembled – all three registers of `HEADING` open this way
 *  («School is over, and she has said what she wants» / «…she has told us…» / «…it took her a while
 *  to say it»), so this matches the beat and cannot match the fork, whose own name ENDS with
 *  "School is over." behind her age. The two are told apart by name because they land one after the
 *  other in the same second and `getByRole('dialog')` alone would silently follow the queue. */
const HER_CARD = { name: /^School is over, and / }
const FORK_CARD = { name: /School is over\.$/ }

test.describe('the life beat at the college fork', () => {
  test('the beat stops the week, her card is answered, and only then may the fork be', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts, profile } = await careerAt('unheard')

    // =============================================================================================
    // 1. THE WEEK IS STOPPED, AND IT IS STOPPED FOR HER
    // =============================================================================================
    const herCard = page.getByRole('dialog', HER_CARD)
    await expect(
      herCard,
      `the '${profile.kidName}' fixture is expected to boot holding an UNANSWERED life beat, with ` +
        'her card in front of the fork. Two things can put this red. If it is the only red test ' +
        'after a fixture regeneration, the recipe stopped finding one: tools/e2e-fixtures.ts ' +
        'searches for a career parked on the tick that raises it, and the clause that would have ' +
        'rejected a career with a knock or a birthday over her is beside it. Otherwise the QUEUE ' +
        'moved – `blockingOverlay` puts \'life\' before \'fork\', and a swap shows the fork card ' +
        'here instead of hers (measured: that is the arm that produced this exact failure).',
    ).toBeVisible()
    await expect(herCard).toHaveAttribute('aria-modal', 'true')

    // Time has not moved: the week on screen is still the one the manifest was written at.
    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()

    // ⭐⭐ AND THE ADVANCE CONTROL CANNOT BE PRESSED – which is what "the week is stopped" MEANS for
    // this card, and it is a different mechanism from the knock's (week-advance.spec.ts). The knock
    // disables the button (`composables/weekAction.ts` has a clause for it); a life beat does not,
    // because it does not need one: the card is a blocking overlay whose scrim owns every pixel of
    // the page. So the honest question is not "is it disabled" but "could a player reach it", and
    // `trial: true` is Playwright's own answer to exactly that – it runs the actionability checks
    // (visible, stable, RECEIVES POINTER EVENTS, enabled) and performs no click.
    //
    // ⚠ THE VISIBILITY ASSERTION ABOVE IT IS LOAD-BEARING. Without it a bar that had been removed
    // from the DOM would fail the trial too, and this claim would pass for the opposite reason.
    // ⚠ ARM C, RUN: drop `.dialog-overlay`'s `position: fixed; inset: 0` (src/style.css) and this
    // line goes red with «Received: "reached"» – the button is reachable behind a card that no
    // longer covers anything.
    await expect(weekButton(page)).toBeVisible()
    const reached = await weekButton(page)
      .click({ trial: true, timeout: 1500 })
      .then(() => 'reached', () => 'blocked')
    expect(
      reached,
      'the advance control was reachable while an unanswered life beat was on screen – the card ' +
        'stops the week, so nothing behind it may be pressed.',
    ).toBe('blocked')

    // =============================================================================================
    // 2. THE CARD IS HER LINE AND THREE ANSWERS, AND THERE IS NO FOURTH WAY OUT
    // =============================================================================================
    //
    // ⚠ HER WORDS ARE ASSERTED BY SHAPE, NOT BY COPY, and that is deliberate. There are 27 lines in
    // the pools (kind x temperament x register x want, plus the flat pool a strained home collapses
    // to) and which one this career draws is the engine's business; a spec that pinned the string
    // would be pinning the owner's copy in the slowest layer there is. What every one of them obeys
    // is the voice bibles' two shape rules, which is what this asks for: the narration names HER,
    // and there is ONE quoted span, at the end.
    const answers = herCard.getByRole('radiogroup')
    await expect(
      answers,
      'the answers are not named by her line – `aria-labelledby="life-beat-said"` is what tells a ' +
        'listener which sentence these three are a reply to.',
    ).toHaveAccessibleName(/^She .+"[^"]+"$/)

    // ROUND 40'S CONVENTIONS, ON THE WIRE: real radios in a real group, nothing marked on arrival.
    // The card may not point at an answer, on a card whose whole subject is that the answer is his.
    for (const label of HIS_ANSWERS) {
      const option = herCard.getByRole('radio', { name: label, exact: true })
      await expect(option, `"${label}" is not on her card`).toBeVisible()
      await expect(option, `"${label}" arrived already marked`).toHaveAttribute('aria-checked', 'false')
    }
    await expect(herCard.getByRole('radio')).toHaveCount(HIS_ANSWERS.length)
    // ⭐ EVERY CONTROL IS AN ANSWER AND THERE IS NO X. The three above are the whole card, so there
    // is nothing on it that closes it without saying something – the law LifeBeatDialog.vue is
    // written to, asserted here on the rendered page rather than read off its template.
    await expect(
      herCard.getByRole('button'),
      'a control that is not one of her three answers appeared on the card – walking away from a ' +
        'life beat must not be a thing the player can do (LifeBeatDialog.vue: "every button is an ' +
        'answer and there is no X").',
    ).toHaveCount(0)

    // ...and Escape is not one either. Transcribed from the component's own ruling, exactly as
    // a11y.spec.ts transcribes each card's Escape policy rather than imposing a uniform one.
    await page.keyboard.press('Escape')
    await expect(
      herCard,
      'Escape closed a card whose every way out is meant to be an answer. See LifeBeatDialog.vue ' +
        'before changing this expectation – it is a product ruling, not a convention.',
    ).toBeVisible()

    // =============================================================================================
    // 3. ⭐⭐⭐ THE WAVE'S WHOLE CONTRACT: THE FORK IS NOT ANSWERABLE YET
    // =============================================================================================
    //
    // The fork was raised by the SAME tick that raised her row – `resolveEndings` writes both, one
    // line apart – so it is open in the world right now, and the only reason its card is not on the
    // page is that she outranks it. That is the claim, and step 5 is what makes it a claim about a
    // REFUSAL rather than about an absence: the answers turn up the moment hers is recorded.
    //
    // ⚠ ARM B, RUN – and it is this file's headline arm. Point `showFork` at `snapshot.fork` instead
    // of at the queue (src/App.vue) and both cards render at once: her sentence is still on screen,
    // unanswered, with three fork answers live beside it. This line goes red, «Received: 3».
    await expect(
      page.getByRole('button', { name: FORK_ANSWERS }),
      'the fork could be answered while she was still waiting to be. The order is the engine\'s ' +
        '(`answerFork` throws FORK_UNHEARD_REFUSAL, and \'life\' outranks \'fork\' in ' +
        'STOP_PRECEDENCE) and this is the surface it is supposed to reach.',
    ).toHaveCount(0)
    await expect(page.getByRole('dialog', FORK_CARD)).toHaveCount(0)

    // =============================================================================================
    // 4. HE ANSWERS HER – one press, across the worker boundary
    // =============================================================================================
    await herCard.getByRole('radio', { name: HIS_ANSWERS[0], exact: true }).click()
    await expect(herCard, 'her card stayed up after an answer was pressed').toHaveCount(0)

    // =============================================================================================
    // 5. AND THE FORK IS NOW ANSWERABLE – the same snapshot that cleared her row raises it
    // =============================================================================================
    const forkCard = page.getByRole('dialog', FORK_CARD)
    await expect(
      forkCard,
      'the fork did not arrive behind her. It was open in the world the whole time (the tick that ' +
        'raised her opinion raised it), so step 3 was a refusal – if it never appears here, step 3 ' +
        'was measuring an absent fork instead and this spec proves nothing about the order.',
    ).toBeVisible()
    await expect(page.getByRole('button', { name: FORK_ANSWERS })).toHaveCount(3)

    // ⚠ AND THE WEEK IS STILL STOPPED, now by the fork rather than by her – the queue advanced by
    // one, it did not empty. Same measurement as step 1, and the reason it is repeated: "answering
    // the beat starts the week again" would be a false sentence, and a spec that stopped here would
    // have implied it.
    const afterHer = await weekButton(page)
      .click({ trial: true, timeout: 1500 })
      .then(() => 'reached', () => 'blocked')
    expect(afterHer, 'the week moved on before the fork was answered').toBe('blocked')

    // =============================================================================================
    // 6. THE FORK IS ANSWERED, AND ONLY NOW DOES TIME MOVE
    // =============================================================================================
    //
    // "Turn professional" of the three, because it is the only one that leaves a career to go on
    // playing: `college` freezes her into the years away and `stop` latches the ending, and the
    // press below needs an ordinary week on the other side of it. `tools/e2e-fixtures.ts` answers
    // the same way in the look-ahead that accepted this seed, so the week this reaches is the week
    // that was measured to be clean.
    await page.getByRole('button', { name: /^Turn professional/ }).click()
    await expect(forkCard).toHaveCount(0)

    // HER ANSWER IS IN THE WORLD, not only in the UI that sent it: the engine wrote its own feed
    // line for it during `answerLifeBeat`, and Home's News is where a player reads it back. A mocked
    // boundary cannot produce this line at all – there is nothing on the other side to write it.
    //
    // ⚠ ON THE NEWS AND NOT ON THE MONEY SCREEN, which is the no-cents rule surfacing: an answer is
    // never a purchase, so the row carries no `amountCents` and `accrueFinance` never sees it. The
    // rule itself is unit-owned (tests/wave2-life-beat.test.ts); what this line says is that the
    // sentence the engine wrote for a decision made in a browser came back and was rendered.
    await expect(page.getByText(/We told her we are behind her/)).toBeVisible()

    // AND THE WEEK MOVES. The stop is gone because both questions have been answered, and one press
    // is now an ordinary week.
    await expect(weekButton(page)).toBeEnabled()
    await weekButton(page).click()
    await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()

    expect(crashes, 'the app threw while answering a life beat and the fork behind it').toEqual([])
  })
})
