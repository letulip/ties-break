// =================================================================================================
// R2-13 PHASE 1 – THE FOUR-WEEK ADVANCE, AND EVERY PROMISE IT HAS TO KEEP
// =================================================================================================
//
// The review's item, in its own words: "Phase 1 exposes the already supported four-week advance only
// when the engine can stop before a blocking event ... It must preserve MAIN input independence and
// surface every intermediate financial/narrative result. Test one stop reason at a time and
// collision precedence." (docs/review-principles-2026-08-23/07-proposals-and-roadmap.md)
//
// This file is that sentence, clause by clause:
//
//   A. THE RNG LAW – a four-week press taps the identical MAIN sequence as the single presses it
//      replaces. The player's choice of button may never move the world's dice.
//   B. ONE STOP REASON AT A TIME – every member of STOP_PRECEDENCE, its own case.
//   C. COLLISION PRECEDENCE – a week that is two things reports both, in the documented order.
//   D. THE GATE – the shell offers the span in exactly the states the engine can move time in.
//   E. NOTHING IS LOST – the span reports every row the weeks it spent wrote.
//   F. THE DRIFT GUARD – a seventh refusal cannot be added without this file noticing.
//
// ⚠ NO NEW STOPPING MODEL. Every case below drives `advanceWeeks`, the function that has owned this
// since the first slice; nothing here re-implements a halt, and no snapshot field and no schema
// version was added by phase 1 or by the `'offer'` stop that finished its item text.
//
// ⭐ RE-AIMED, NOT WIDENED (the offer stop). Phase 1 added no stop reason and this file said so; the
// offer stop adds exactly one, and it enters through the SAME `stops.add` / collect-then-break loop
// as the thirteen before it. What changed in this file is one case per clause – B gets the halt and
// its negative, C gets the new slot pinned from both sides, D gets the refusal list's silence about
// it asserted rather than assumed, A gets the law re-run over a span that stops on it – and nothing
// here was relaxed to let the new member through.
import { describe, expect, it, vi } from 'vitest'
import {
  ACADEMY_NOTICE,
  ADVANCE_REFUSALS,
  MULTI_WEEK_SPAN,
  advanceRefusal,
  advanceWeeks,
  closeTournament,
  createWorld,
  decideKnock,
  enterEvent,
  entryStatus,
  pendingBirthday,
  pendingKnock,
  recomputeKidRank,
  skipTournament,
  spanDigest,
  spanRowCount,
  spanWorthOffering,
  tickWeek,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { readFileSync } from 'node:fs'
import { worldFunction } from './worldSource'
import { before, region } from './helpers/source'
import { resumeMain, type Rng } from '../src/engine/rng'
import { TIERS } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import { blockingOverlay } from '../src/composables/blockingOverlay'
import { multiOffered } from '../src/composables/weekAction'
import { DEFAULT_PROFILE, STOP_PRECEDENCE, type Offer, type OfferState, type StopReason } from '../src/shared/protocol'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// Two cases walk real careers (242 and 829 weeks). Deterministic but slow, and the suite runs many
// files in parallel – the same generous file-level timeout round11.test.ts carries, same reason.
vi.setConfig({ testTimeout: 240_000 })

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

/** A world plus the MAIN generator the WORKER would drive it with.
 *
 *  ⚠ `resumeMain(world.rngMain)` AND NOT `rngFromSeed(seed)`, WHICH IS THE WHOLE OF BLOCK A. The
 *  persisted position only moves when the draws go through the pair on the world (`resumeMain`
 *  mutates `st` in place, rng.ts says so), so a fixture that drew off a detached `rngFromSeed`
 *  generator would leave `rngMain.n` at 0 for ever and every identity below would be vacuous. This
 *  is `sim.worker.ts`'s own line. */
function career(seed: string, over: Partial<typeof DEFAULT_PROFILE> = {}): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, ...over })
  return { world, rng: resumeMain(world.rngMain) }
}

/** ...with the calendar emptied, so a case about one stop reason is not also a case about the
 *  tournament desk. Nothing else is touched: the bills, the diary and the training all still run. */
function quietCareer(seed: string, over: Partial<typeof DEFAULT_PROFILE> = {}): { world: WorldState; rng: Rng } {
  const c = career(seed, over)
  c.world.season = []
  return c
}

/** Tick to `week` the way a test harness must: `tickWeek` is total, so reveals are resolved and
 *  knocks answered on the way rather than being allowed to become the thing under test. */
function walkTo(world: WorldState, rng: Rng, week: number, solvent = false): void {
  while (world.week < week) {
    if (solvent) world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    if (world.fork !== null && world.fork.answer === null) world.fork.answer = 'continue'
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  if (pendingKnock(world)) decideKnock(world, 'rest')
}

/** Enough domestic points to clear a rung's entry band, kept on the ledger (unlike events.test.ts's
 *  `enterEligible`, which restores it) – the deadline stop asks `entryStatus` DURING the advance. */
function grantBand(world: WorldState, points: number): void {
  world.results = [...world.results, { playerId: KID_ID, week: world.week, points, tier: 'national' }]
  recomputeKidRank(world)
}

/** ⚠ THE CALENDAR IS THE ONLY THING THESE CASES INJECT, AND IT IS INJECTED RATHER THAN SEARCHED FOR
 *  BECAUSE WHICH RUNG LANDS ON WHICH WEEK IS A FUNCTION OF THE SEED. A fixture that hunted the
 *  generated season for "a local event two weeks out" passes on one seed and fails on the next, and
 *  a case about a STOP has no business also being a case about the tournament desk's draw. The
 *  round11.test.ts idiom, unchanged. */
function injectEvent(world: WorldState, e: { week: number; tier: TierId; deadlineWeek: number }): SeasonEvent {
  const event: SeasonEvent = {
    id: `r2-13-${e.week}-${e.tier}`,
    week: e.week,
    tier: e.tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: e.deadlineWeek,
  }
  world.season = [event]
  return event
}

/** ONE LETTER ON THE TABLE, dated a week the span is about to reach.
 *
 *  ⚠ THE SHAPE IS `settleTourSeasonNotice`'S OWN – a `tour` letter carrying `notice: 'season'` – and
 *  the two arms that use it differ in `state` and in nothing else, because `state` is the entire
 *  rule the `'offer'` stop is made of. The `open` arm is the CONTROL rather than a claim that the
 *  desk writes decisions: it exists so the negative cannot pass by the letter never being read.
 *  Deadline far enough out that `expireOffers` cannot take it before the span reaches it. */
function putLetter(world: WorldState, o: { week: number; state: OfferState }): void {
  const letter: Offer = {
    id: `r2-13-letter-${o.week}`,
    kind: 'tour',
    week: o.week,
    deadlineWeek: o.week + 4,
    terms: { notice: 'season' },
    state: o.state,
  }
  world.offers.push(letter)
}

/** WHERE A REASON SITS IN THE PRECEDENCE, AND IT THROWS WHEN THE REASON IS NOT THERE.
 *
 *  ⚠ `list.indexOf(x)` RETURNS -1 FOR A MEMBER WITH NO SLOT, AND -1 IS LESS THAN EVERYTHING – so
 *  `indexOf(a) < indexOf(b)` passes cheerfully when `a` was never in the list at all. That is the
 *  same swallowed -1 the source-pin ratchet exists for (scripts/pin-ratchet.mjs says so, and says
 *  why the array form cannot be ratcheted: it is written identically to the string form). An
 *  ordering assertion about a member that has been DELETED from STOP_PRECEDENCE is exactly the
 *  mutation these cases have to fail on, so the lookup throws instead of returning a number. */
function slotOf(list: readonly StopReason[], reason: StopReason): number {
  const i = list.indexOf(reason)
  if (i < 0) throw new Error(`'${reason}' has no slot in STOP_PRECEDENCE`)
  return i
}

/** The span, run as ONE press. Returns the reasons and how many weeks it actually bought. */
function span(world: WorldState, rng: Rng): { stops: StopReason[]; weeks: number } {
  const before = world.week
  const stops = advanceWeeks(world, rng, MULTI_WEEK_SPAN)
  return { stops, weeks: world.week - before }
}

// =================================================================================================
// A. THE RNG LAW – MAIN INPUT-INDEPENDENCE
// =================================================================================================
//
// CLAUDE.md invariant 2, and the one that must not bend: "A no-action run and an action-laden run
// under the same code must tap identical MAIN sequences. Player choices may never re-roll the
// world's dice. This is a fairness property." A second week BUTTON is a player choice like any
// other, so the span has to be indistinguishable from the presses it replaces – not merely similar,
// byte-identical, register and draw count included.
describe('R2-13 A – a four-week press taps the identical MAIN sequence as four single presses', () => {
  it('⚠⚠ THE LAW: same seed, both ways – identical rngMain AND identical world state', () => {
    const four = quietCareer('r2-13-law')
    const ones = quietCareer('r2-13-law')

    const spanStops = advanceWeeks(four.world, four.rng, MULTI_WEEK_SPAN)
    // The control arm presses ONE at a time, taking a fresh generator over the same persisted pair
    // each press – which is exactly what `mutate` does in sim.worker.ts, one message per press.
    const oneStops: StopReason[] = []
    for (let i = 0; i < MULTI_WEEK_SPAN; i++) oneStops.push(...advanceWeeks(ones.world, resumeMain(ones.world.rngMain), 1))

    // ⚠ THE ARM IS NOT NULL – both really spent four weeks and really drew. A green identity between
    // two worlds that never ticked would prove nothing, and this is the provenance check CLAUDE.md
    // demands of a null result: name the number before believing the equality.
    expect(spanStops, 'the quiet stretch runs its course – nothing stopped either arm').toEqual([])
    expect(oneStops).toEqual([])
    expect(four.world.week, 'four weeks really passed').toBe(MULTI_WEEK_SPAN)
    expect(four.world.rngMain.n, 'and they really drew on MAIN').toBeGreaterThan(0)

    // THE ASSERTION. The persisted MAIN position first, because it is the fairness property itself:
    // the register AND the cumulative draw count, which together describe the stream exactly
    // (rng.ts: "a stream position is completely described by the pair {s, n}").
    expect(four.world.rngMain, 'the register and the draw count are the same either way').toEqual(ones.world.rngMain)
    // ...and then the whole world, because an identical stream that produced a different world would
    // mean the draws were CONSUMED differently, which is the same bug wearing a disguise.
    expect(JSON.stringify(four.world), 'and so is every other byte of the career').toBe(JSON.stringify(ones.world))
  })

  it('⚠ ...and a span that STOPS EARLY matches exactly the presses it bought, not the four it offered', () => {
    // The harder half. `advanceWeeks` breaks on the first week that has anything in it, so a press
    // for four can buy one; the law then says the world must equal ONE single press, not four.
    const four = quietCareer('r2-13-law-stop')
    four.world.fundsCents = -1_000_00
    const ones = quietCareer('r2-13-law-stop')
    ones.world.fundsCents = -1_000_00

    const { stops, weeks } = span(four.world, four.rng)
    // ⚠ `toContain` AND NOT `toEqual`, ON PURPOSE. This seed's first week is also the week she picks
    // something up, so the honest reading is `['injury', 'funds']` – which is R11-1's rule working
    // and is exactly the kind of week the law has to hold on. What the case is about is the STATE
    // after a short span, not which reasons the seed happened to raise.
    expect(stops, 'the fixture stops on the first tick').toContain('funds')
    expect(weeks, 'so it bought one week of the four').toBe(1)

    for (let i = 0; i < weeks; i++) advanceWeeks(ones.world, resumeMain(ones.world.rngMain), 1)

    expect(four.world.rngMain.n, 'the arm drew').toBeGreaterThan(0)
    expect(four.world.rngMain).toEqual(ones.world.rngMain)
    expect(JSON.stringify(four.world)).toBe(JSON.stringify(ones.world))
  })

  it('⚠⚠ ...and it holds on a span that stops on the OFFER – the law over the new reason', () => {
    // THE LAW, RE-RUN OVER THE MEMBER THIS WAVE ADDED, and it is re-run rather than argued from the
    // case above because a new stop is exactly the kind of change that could break it: a reason
    // derived from a state the loop had not read before is one line away from being a reason derived
    // from a DRAW the loop had not taken before, and the second of those moves the stream.
    //
    // ⚠ THE ARM IS A REAL CAREER AND THE LETTER IS THE ENGINE'S, as in block B – the same walk into
    // the brands' window, both arms, so the two are comparable at week 45 before either presses.
    const four = quietCareer('r2-13-offer')
    grantBand(four.world, 400)
    walkTo(four.world, four.rng, 45)
    const ones = quietCareer('r2-13-offer')
    grantBand(ones.world, 400)
    walkTo(ones.world, ones.rng, 45)
    expect(JSON.stringify(four.world), 'the two arms start identical').toBe(JSON.stringify(ones.world))

    const { stops, weeks } = span(four.world, four.rng)
    // ⚠ PROVENANCE BEFORE THE IDENTITY: the arm really stopped, really stopped for THIS reason, and
    // really left weeks on the table. Without these three the equality below is a tautology.
    expect(stops, 'the span stopped on the offer').toEqual(['offer'])
    expect(weeks, 'having bought two of the four it offered').toBe(2)
    expect(weeks, 'so the remaining weeks were NOT consumed').toBeLessThan(MULTI_WEEK_SPAN)

    for (let i = 0; i < weeks; i++) advanceWeeks(ones.world, resumeMain(ones.world.rngMain), 1)

    expect(four.world.rngMain.n, 'the arm drew on MAIN').toBeGreaterThan(0)
    expect(four.world.rngMain, 'identical register and draw count either way').toEqual(ones.world.rngMain)
    expect(JSON.stringify(four.world), 'and identical to the last byte, letter included').toBe(
      JSON.stringify(ones.world),
    )
    // ...and the letter really is in both worlds, so the identity is over a state that contains it.
    expect(four.world.offers.length, 'the letter is part of what was compared').toBeGreaterThan(0)
  })

  it('⚠ the law holds at EVERY prefix – a span of k weeks is k single presses, for every k', () => {
    // The law stated as a prefix property, which is what makes it a law rather than a coincidence at
    // k=4: a player who presses the span and a player who presses one at a time are on the same
    // stream at every point where they could compare notes, not only at the end.
    //
    // ⚠ MEASURED AND NOT ASSUMED: THE COST OF A WEEK IS NOT CONSTANT. The first draft of this case
    // asserted `n(4) === 4 × n(1)` and it is FALSE – 2397 draws against 3196 predicted, because the
    // opening week seeds a cohort the later weeks only maintain. That arithmetic was never the law;
    // the law is that the two BUTTONS agree, which is what is asserted here.
    for (let k = 1; k <= MULTI_WEEK_SPAN; k++) {
      const spanArm = quietCareer('r2-13-law-prefix')
      advanceWeeks(spanArm.world, spanArm.rng, k)
      const pressArm = quietCareer('r2-13-law-prefix')
      for (let i = 0; i < k; i++) advanceWeeks(pressArm.world, resumeMain(pressArm.world.rngMain), 1)

      expect(spanArm.world.week, `k=${k}: both arms spent k weeks`).toBe(k)
      expect(pressArm.world.week).toBe(k)
      expect(spanArm.world.rngMain.n, `k=${k}: the arm drew`).toBeGreaterThan(0)
      expect(spanArm.world.rngMain, `k=${k}: identical MAIN position`).toEqual(pressArm.world.rngMain)
      expect(JSON.stringify(spanArm.world), `k=${k}: identical world`).toBe(JSON.stringify(pressArm.world))
    }
  })
})

// =================================================================================================
// B. ONE STOP REASON AT A TIME
// =================================================================================================
//
// ⚠ TWO SHAPES OF STOP, AND THE DIFFERENCE IS THE PLAYER'S. A REFUSAL returns the reason with ZERO
// ticks – the question is already standing in front of the week and the span may not start. A HALT
// spends weeks and stops on the one that raised something. Six reasons refuse (`ADVANCE_REFUSALS`);
// every reason can halt. Each case below says which shape it is asserting.
describe('R2-13 B – the span stops before every blocking event, one reason at a time', () => {
  it('BIRTHDAY – refuses outright while it is unanswered, and halts on the week it lands', () => {
    // REFUSAL. Walked to her birthday week, `advanceWeeks` will not tick at all.
    // ⚠ 21 -> 22 BY ROUND 34 #3: the default profile is born 15 June and her birthday is MARKED in
    // the week her age changes now (the first Monday past her date) rather than in the week the date
    // falls in, so the fixture's first birthday moved from week 22 to week 23. The claim is
    // unchanged – walk to the week before it and the span may not start.
    const { world, rng } = quietCareer('r2-13-bday')
    walkTo(world, rng, 22)
    const before = world.week
    const halted = span(world, rng)
    expect(halted.stops, 'the halt: the tick reached her birthday and stopped there').toEqual(['birthday'])
    expect(halted.weeks, 'one week of the four – it stopped ON the birthday').toBe(1)
    expect(pendingBirthday(world), 'and the question is up').not.toBeNull()
    expect(world.week).toBe(before + 1)

    // ...and pressing again moves nothing until it is answered.
    expect(span(world, rng).stops).toEqual(['birthday'])
    expect(world.week, 'not one week moved').toBe(before + 1)
  })

  it('INJURY – halts on the week the onset lands', () => {
    const { world, rng } = quietCareer('r2-13-injury')
    // The engine's own predicate is `injury.sinceWeek === world.week`; a layoff opened on the week
    // the tick is about to reach is exactly what a fresh injury is.
    world.injury = { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: 1 }
    const { stops, weeks } = span(world, rng)
    expect(stops).toEqual(['injury'])
    expect(weeks).toBe(1)
  })

  it('MEDICAL – halts on a withdrawal, which costs her an entry and its fee', () => {
    const { world, rng } = quietCareer('r2-13-medical')
    world.medicalWithdrawalWeek = 1
    const { stops, weeks } = span(world, rng)
    expect(stops).toEqual(['medical'])
    expect(weeks).toBe(1)
  })

  it('WALKOVER – halts on the forfeited entry (R12-15, the owner dead click)', () => {
    const { world, rng } = quietCareer('r2-13-walkover')
    world.walkoverWeek = 2
    const { stops, weeks } = span(world, rng)
    expect(stops).toEqual(['walkover'])
    expect(weeks, 'the two weeks before it were quiet and were spent').toBe(2)
  })

  it('ACADEMY – halts on the verdict week, the one a step of four could never land on', () => {
    // ROUND 23 #16's arithmetic, restated as the reason this case matters most of the fifteen: the
    // academy speaks at `week % 52 === 0` and the advance hard-stops at `% 52 === 49`, so 49 + 4 = 53
    // made the verdict week unreachable by a player stepping by four – for a whole career.
    const { world, rng } = quietCareer('r2-13-academy')
    world.events.push({ id: world.nextEventId++, week: 3, type: 'info', text: `${ACADEMY_NOTICE.arrived} – on a full scholarship.` })
    const { stops, weeks } = span(world, rng)
    expect(stops).toEqual(['academy'])
    expect(weeks).toBe(3)
  })

  it('⭐ OFFER – halts on the week a letter he can still answer lands (walked, not injected)', () => {
    // R2-13's item text lists «offers» among the events the span must stop before, and phase 1
    // shipped without one: the letter reached the player through the span digest and the inbox dot,
    // which is exactly the pair of surfaces round-23 #16 proved insufficient one case above.
    //
    // ⚠ THE LETTER IS THE ENGINE'S OWN AND NOTHING IS PUSHED INTO `world.offers`. The career is
    // walked into the brands' window (`SPONSOR_WINDOW_WEEKS`, the off-season plus two) with a
    // domestic standing the bottom rung clears, and `reviewSponsors` writes on the week its own dice
    // say so. A case that injected the paper would prove the stop reads an array; this one proves it
    // reads the game.
    const { world, rng } = quietCareer('r2-13-offer')
    grantBand(world, 400)
    walkTo(world, rng, 45)
    expect(world.offers, 'nothing on the table before the window opens').toEqual([])

    const { stops, weeks } = span(world, rng)
    expect(stops, 'the letter, and nothing else that week').toEqual(['offer'])
    expect(weeks, 'two of the four – the quiet weeks before it were spent, the letter stopped it').toBe(2)
    expect(world.week, 'and the span ended ON the arrival week').toBe(47)
    const letter = world.offers.find((o) => o.week === world.week)
    expect(letter, 'a real letter, dated the week the span stopped on').toBeTruthy()
    expect(letter!.state, 'and it is a DECISION – open, with a deadline he can still meet').toBe('open')
    expect(letter!.deadlineWeek, 'which is the window close, not this week').toBeGreaterThan(world.week)
    expect(toSnapshot(world, stops).offerOpen, 'the inbox dot agrees with the stop').toBe(true)

    // ⚠⚠ THE OTHER HALF OF THE RULE, AND IT IS THE HALF THAT KEEPS THE PILL A PILL: the SAME letter,
    // still open and still live for four more weeks, does NOT stop the next span. The stop is about
    // the paper ARRIVING, not about it lying there – measured, a "there is a live offer" rule costs
    // 152 extra presses per 72 seasons against this rule's 5, and halts five weeks running.
    const again = span(world, rng)
    expect(again.stops, 'the second press is not stopped by the letter it already reported').not.toContain('offer')
    expect(again.weeks, 'and time really moved').toBeGreaterThan(0)
    expect(world.offers.some((o) => o.state === 'open'), 'with the letter still open and unanswered').toBe(true)
  })

  it('⭐ ...and a NOTICE does not halt it – the negative that keeps the rule honest', () => {
    // ⚠ THIS IS THE CASE THE FEATURE IS AT RISK FROM, NOT THE ONE ABOVE. The inbox carries two kinds
    // of paper and `OfferState` names the difference: an `open` letter expires unanswered, an `info`
    // letter «is born terminal – there is nothing to sign and nothing to refuse». Every desk writes
    // `info` – the entry receipts, the tour's due / penalty / suspension / season notices, the
    // academy's three letters, a brand's goodbye – and a stop for each of those is the four-week pill
    // turned back into a press a week, which is the disease R2-13 exists to cure.
    //
    // The payload below is `settleTourSeasonNotice`'s own shape. Both arms are the SAME letter on the
    // SAME seed dated the SAME week; `state` is the only variable, because `state` is the whole rule.
    const notice = quietCareer('r2-13-offer-notice')
    putLetter(notice.world, { week: notice.world.week + 2, state: 'info' })
    const quiet = span(notice.world, notice.rng)
    expect(quiet.stops, 'a notice is not a decision, so it is not a stop').toEqual([])
    expect(quiet.weeks, 'and the span ran its whole course through it').toBe(MULTI_WEEK_SPAN)
    expect(notice.world.offers[0].week, 'the notice really did land inside the span').toBeLessThanOrEqual(notice.world.week)

    // ⚠ THE CONTROL, so the negative above cannot pass by the letter never being seen. One character
    // of difference – `info` becomes `open` – and the identical fixture halts on the identical week.
    const decision = quietCareer('r2-13-offer-notice')
    putLetter(decision.world, { week: decision.world.week + 2, state: 'open' })
    const halted = span(decision.world, decision.rng)
    expect(halted.stops, 'the same paper, answerable, stops it').toEqual(['offer'])
    expect(halted.weeks, 'on its own arrival week').toBe(2)
  })

  it('KNOCK – halts on the sore ankle and then refuses to restart until it is answered', () => {
    // Self-coached, because a coach who takes the call answers it before the player is ever asked
    // (docs/specs/coach-as-load-manager.md §8) – which is the product, and would make this vacuous.
    const { world, rng } = quietCareer('r2-13-knock', { coachTier: 'self' })
    // WHICH week the sore ankle lands on is the seed's business, so it is found rather than assumed
    // – on a throwaway copy of the same career, which keeps the world under test untouched.
    const scout = quietCareer('r2-13-knock', { coachTier: 'self' })
    let knockWeek = -1
    for (let i = 0; i < 40 && knockWeek < 0; i++) {
      tickWeek(scout.world, scout.rng)
      if (pendingKnock(scout.world)) knockWeek = scout.world.week
    }
    expect(knockWeek, 'the fixture reached a knock').toBeGreaterThan(0)
    walkTo(world, rng, knockWeek - 1)
    const halted = span(world, rng)
    expect(halted.stops).toEqual(['knock'])
    expect(halted.weeks).toBe(1)
    expect(pendingKnock(world)).toBe(true)
    // REFUSAL: the second press ticks nothing at all.
    const blocked = span(world, rng)
    expect(blocked.stops).toEqual(['knock'])
    expect(blocked.weeks).toBe(0)
  })

  it('TOURNAMENT (reveal / arrival) – halts on the week her entry comes round', () => {
    const { world, rng } = career('r2-13-tour')
    const event = injectEvent(world, { week: 3, tier: 'local', deadlineWeek: 0 })
    enterEvent(world, event.id)
    const { stops, weeks } = span(world, rng)
    expect(stops).toEqual(['tournament'])
    expect(weeks, 'the two quiet weeks before the trip were spent, the trip stopped it').toBe(3)
    expect(world.pendingTournament, 'and the reveal is open for the flow to take over').not.toBeNull()
    // REFUSAL: nothing ticks behind an open reveal.
    const blocked = span(world, rng)
    expect(blocked.stops).toEqual(['tournament'])
    expect(blocked.weeks).toBe(0)
  })

  it('DEADLINE – halts BEFORE the week, so the entry decision is still makeable', () => {
    // The one pre-tick guard in the loop, and the only stop that fires before its week rather than
    // on it. It bites only from the second week (`i > 0`), so a single press always progresses.
    const { world, rng } = career('r2-13-deadline')
    grantBand(world, TIERS.regional.enterPointBand[0])
    const event = injectEvent(world, { week: 6, tier: 'regional', deadlineWeek: 2 })
    expect(entryStatus(world, event).level, 'the fixture is an entry she could really make').not.toBe('blocked')
    const { stops, weeks } = span(world, rng)
    expect(stops).toEqual(['deadline'])
    expect(weeks, 'one week, then the guard stopped it short of the deadline').toBe(1)
    expect(world.entries, 'and it stopped BEFORE the decision, not after it').toEqual([])
  })

  it('FUNDS – halts the week the family goes under', () => {
    const { world, rng } = quietCareer('r2-13-funds')
    world.fundsCents = -1_000_00
    const { stops, weeks } = span(world, rng)
    expect(stops).toEqual(['funds'])
    expect(weeks).toBe(1)
    expect(world.fundsCents).toBeLessThan(0)
  })

  // ⚠⚠ RE-AIMED AT ROUND 29 #6 – "HALTS" BECAME "REPORTS", AND THE OLD CASE COULD NOT TELL THEM
  // APART. It walked to week 45 and pressed four, which lands ON 49: the wrap was the span's LAST
  // week, so `weeks === 4` was the full span either way and the case never once exercised the break.
  // The owner pressed from a week where the wrap falls MID-span and bought two weeks of a six-week
  // gap – «увидел сообщение о конце года ... а календарь так и остался на 51й неделе». The reason is
  // still collected and still returned in its `STOP_PRECEDENCE` slot (R11-1); what changed is that
  // it no longer ends the loop. See `SPAN_REPORTS_ONLY` for why this one member may pass and no
  // other may.
  it('SEASON-END – is REPORTED on the wrap-up week and no longer truncates the span', () => {
    const { world, rng } = career('r2-13-season-end')
    walkTo(world, rng, 45)
    world.season = []
    const { stops, weeks } = span(world, rng)
    expect(stops).toEqual(['season-end'])
    expect(world.week % 52, 'the season wrapped on 49, as the loop says').toBe(49)
    expect(weeks).toBe(4)
  })

  it('⭐⭐ ...and a press that STRADDLES the wrap buys every week it offered (round 29 #6)', () => {
    // THE DISCRIMINATING CASE the block above could not be. Standing on 46 with a clear calendar,
    // a six-week press crosses the wrap at 49 and must land on 52 – the first week of the next
    // season – rather than stopping three weeks in. This is the owner's own scenario: the tail of a
    // season is the longest quiet gap a career has, which is exactly where the pill appears.
    const { world, rng } = career('r2-13-season-end-through')
    walkTo(world, rng, 46)
    world.season = []
    const before = world.week
    const stops = advanceWeeks(world, rng, 6)
    expect(before % 52, 'the fixture stands where the wrap falls mid-span').toBe(46)
    expect(world.week - before, 'the year end cut the span short').toBe(6)
    expect(world.week % 52, 'and it really did cross into the new season').toBe(0)
    expect(stops, 'the wrap-up is still reported – it just no longer ends the press').toContain('season-end')
  })

  it('FORK – halts on the week school ends and the question opens (walked, not injected)', () => {
    const { world, rng } = career('r2-13-fork')
    walkTo(world, rng, 241, true)
    world.season = []
    const { stops, weeks } = span(world, rng)
    expect(stops).toEqual(['fork'])
    expect(weeks, 'it stopped ON the ask').toBe(1)
    expect(world.fork?.answer, 'unanswered – two of its three answers end the career').toBeNull()
    // REFUSAL: the most expensive click in the game may not be stepped past.
    const blocked = span(world, rng)
    expect(blocked.stops).toEqual(['fork'])
    expect(blocked.weeks).toBe(0)
  })

  it('RETIREMENT – halts on the off-season week the question is put (walked, not injected)', () => {
    const { world, rng } = career('r2-13-retire')
    walkTo(world, rng, 828, true)
    const { stops, weeks } = span(world, rng)
    expect(weeks, 'it stopped on the wrap week that raised it').toBe(1)
    expect(stops, 'and it is a real collision: the offer is raised ON the wrap week by construction').toEqual([
      'retirement',
      'season-end',
    ])
    expect(world.retirementOffer).not.toBeNull()
    // REFUSAL: an off-season question a player can tick past is not a decision.
    const blocked = span(world, rng)
    expect(blocked.stops[0]).toBe('retirement')
    expect(blocked.weeks).toBe(0)
  })

  it('ENDING – leads every reason it lands with, and then refuses to tick at all', () => {
    const { world, rng } = quietCareer('r2-13-ending')
    world.fundsCents = -100_000_00
    // Walk the grace period out one press at a time so the ending is the ENGINE's, not an injection.
    let raised: StopReason[] = []
    for (let i = 0; i < 30 && world.ending === null; i++) raised = advanceWeeks(world, rng, 1)
    expect(world.ending, 'the debt ran its course').not.toBeNull()
    // ⚠ THE PRESS THAT PRODUCED IT SAID SO, and it said so FIRST. Without this the case would only
    // exercise the refusal below, and the loop's own `stops.add('ending')` could be deleted unnoticed.
    expect(raised[0], 'the epilogue outranks every reason it lands with').toBe('ending')
    const blocked = span(world, rng)
    expect(blocked.weeks, 'nothing ticks behind an epilogue').toBe(0)
    expect(blocked.stops).toEqual(['ending'])
  })

  it("CALL-UP and COLLEGE-LEAGUE – no advance ever produces them, and that is the contract", () => {
    // The two members `resumeFromCollege` alone raises (protocol.ts says so twice). They belong in
    // this file as an ABSENCE: a span cannot stop for them, because the state that produces them –
    // the college latch – is an `ending`, and an ending refuses the span outright. Pinned on the
    // source so a future edit that taught the loop to raise one would have to come through here.
    const loop = worldFunction('advanceWeeks')
    expect(loop).not.toBe('')
    expect(loop, "'call-up' is resumeFromCollege's, not the advance's").not.toContain("'call-up'")
    expect(loop).not.toContain("'college-league'")
  })

  it('⚠ every member of STOP_PRECEDENCE is accounted for above – none may be quietly untested', () => {
    // MECHANICAL, on round11.test.ts's own precedent: the list is hand-written, because derived from
    // STOP_PRECEDENCE it could never catch the member nobody wrote a case for.
    // ⚠ 'shoot-clash' JOINED IT AT ROUND 29 #3 and its case is the first in block B above.
    const covered: StopReason[] = [
      'birthday', 'injury', 'medical', 'walkover', 'academy', 'offer', 'knock',
      'tournament', 'deadline', 'funds', 'season-end', 'fork', 'retirement', 'ending',
      'shoot-clash',
    ]
    const advanceCannotRaise: StopReason[] = ['call-up', 'college-league']
    expect([...covered, ...advanceCannotRaise].sort()).toEqual([...STOP_PRECEDENCE].sort())
  })
})

// =================================================================================================
// C. COLLISION PRECEDENCE
// =================================================================================================
describe('R2-13 C – a week that is two things reports both, in the documented order', () => {
  it('⚠⚠ BIRTHDAY + REVEAL: the span reports both, and the BIRTHDAY leads', () => {
    // THE DOCUMENTED ORDER IS `STOP_PRECEDENCE`'s, and it is documented for this exact pair:
    // 'birthday' sits above 'tournament' there, with the reason written beside it – "Unlike a knock
    // it CAN co-occur with 'tournament' and with 'season-end' – a birthday lands wherever the date
    // lands, including a playing week and the off-season – which is exactly the ordering this line
    // decides." So the assertion is `['birthday', 'tournament']` and not the other way round.
    // ⚠⚠ A BIRTH DATE OF ITS OWN SINCE ROUND 34 #3, and the reason is worth writing down. The mark
    // moved to the week her age changes, and for the DEFAULT profile (15 June) that week is now
    // inside the school-exam fortnight (season weeks 23-24) – where `enterEvent` refuses outright
    // («School exams this week – no tournaments»), so the collision this case is about cannot be
    // built there at all. 15 March marks in week 10, which is an ordinary playing week. The case is
    // unchanged: a birthday and a reveal in ONE week, both from the engine's own predicates.
    const BORN = { birthMonth: 3, birthDay: 15 }
    const { world, rng } = career('r2-13-collide', BORN)
    // Find her birthday week on a throwaway copy, then put a tournament she is entered in on exactly
    // that week. Nothing about the collision is faked – both facts are the engine's own predicates.
    const scout = quietCareer('r2-13-collide', BORN)
    let birthdayWeek = -1
    for (let i = 0; i < 60 && birthdayWeek < 0; i++) {
      tickWeek(scout.world, scout.rng)
      if (pendingBirthday(scout.world) !== null) birthdayWeek = scout.world.week
    }
    expect(birthdayWeek, 'the fixture found her birthday').toBeGreaterThan(1)
    const event = injectEvent(world, { week: birthdayWeek, tier: 'local', deadlineWeek: 0 })
    enterEvent(world, event.id)
    walkTo(world, rng, birthdayWeek - 1)

    const { stops, weeks } = span(world, rng)
    expect(weeks, 'one week – the collision week itself').toBe(1)
    expect(pendingBirthday(world), 'it really is her birthday').not.toBeNull()
    expect(world.pendingTournament, 'and her entry really came round the same week').not.toBeNull()

    expect(stops, 'both, birthday first – STOP_PRECEDENCE order').toEqual(['birthday', 'tournament'])
    expect(STOP_PRECEDENCE.indexOf('birthday')).toBeLessThan(STOP_PRECEDENCE.indexOf('tournament'))

    // ⚠ AND THE ORDER THE PLAYER SEES IS THE OTHER ONE, WHICH IS A DIFFERENT QUESTION AND HAS ITS OWN
    // DOCUMENT. Round-21 #9 (`composables/blockingOverlay.ts`): the reveal owns the screen while it
    // is up, so the birthday is HELD behind it and lands the moment the tournament is closed.
    // "Which question is next" and "is the screen free to be interrupted" are not the same rule, and
    // this pair is where they disagree – so both are asserted rather than one being assumed.
    const snap = toSnapshot(world, stops)
    expect(blockingOverlay(snap), 'the queue still says the birthday is the next question').toBe('birthday')
    expect(snap.pending, 'and the reveal is what is on screen until it is closed').toBeTruthy()
  })

  it("⭐ OFFER's slot is pinned from BOTH sides – the academy leads it, and it leads the wallet", () => {
    // The new member's precedence is the only thing about it that is a DOCUMENTED FACT rather than a
    // behaviour, so it is asserted where it can actually be observed: on a week that really is two
    // things at once, twice, once against each neighbour that a real career can put beside it.
    //
    // ⚠ ABOVE IT, 'academy'. The verdict is a change to the family's money that has ALREADY happened
    // – the travel cover moved whether or not anybody read the letter – and this list is ordered on
    // exactly that ("they cost her entries and money the moment they land"). An offer is a proposal:
    // until it is signed the wallet does not know it exists.
    const withAcademy = quietCareer('r2-13-offer-academy')
    withAcademy.world.events.push({
      id: withAcademy.world.nextEventId++,
      week: 3,
      type: 'info',
      text: `${ACADEMY_NOTICE.arrived} – on a full scholarship.`,
    })
    putLetter(withAcademy.world, { week: 3, state: 'open' })
    const both = span(withAcademy.world, withAcademy.rng)
    expect(both.weeks, 'one week, and it is two things').toBe(3)
    expect(both.stops, 'both, the verdict first – STOP_PRECEDENCE order').toEqual(['academy', 'offer'])
    expect(slotOf(STOP_PRECEDENCE, 'academy')).toBeLessThan(slotOf(STOP_PRECEDENCE, 'offer'))

    // ⚠ BELOW IT, 'funds'. A family under water is told again every week it stays under; a letter is
    // told once and then expires. The reason that cannot come round again leads the one that will.
    const underWater = quietCareer('r2-13-offer-funds')
    underWater.world.fundsCents = -1_000_00
    putLetter(underWater.world, { week: underWater.world.week + 1, state: 'open' })
    const pair = span(underWater.world, underWater.rng)
    expect(pair.weeks).toBe(1)
    expect(pair.stops, 'both, the letter first').toEqual(['offer', 'funds'])
    expect(slotOf(STOP_PRECEDENCE, 'offer')).toBeLessThan(slotOf(STOP_PRECEDENCE, 'funds'))

    // ...and the toast speaks for the highest-precedence reason that HAS copy (App.vue, R10-16), so
    // the slot is also the answer to "which sentence does the player read". Both of these have copy.
    expect(slotOf(STOP_PRECEDENCE, 'offer')).toBeLessThan(slotOf(STOP_PRECEDENCE, 'deadline'))
    expect(slotOf(STOP_PRECEDENCE, 'walkover'), 'and everything that already cost her money still leads it')
      .toBeLessThan(slotOf(STOP_PRECEDENCE, 'offer'))
  })

  it('⚠ RETIREMENT + SEASON-END on the wrap week: the question leads the report', () => {
    // The second co-occurrence STOP_PRECEDENCE names in prose ("They can co-occur with 'season-end'
    // ... which is exactly the ordering these two lines decide"). Asserted off the walked career in
    // block B, cheaply, so the ordering is pinned twice from two directions.
    expect(STOP_PRECEDENCE.indexOf('retirement')).toBeLessThan(STOP_PRECEDENCE.indexOf('season-end'))
  })
})

// =================================================================================================
// D. THE GATE – "only when the engine can stop before a blocking event"
// =================================================================================================
describe('R2-13 D – the shell offers the span in exactly the states the engine can move time in', () => {
  /** One world per refusal, built the cheapest honest way. The point of the table is that the SIX
   *  are the six – not how each one is reached. */
  function refusalWorlds(): { reason: StopReason; world: WorldState }[] {
    const ending = quietCareer('gate-ending')
    ending.world.fundsCents = -100_000_00
    for (let i = 0; i < 30 && ending.world.ending === null; i++) advanceWeeks(ending.world, ending.rng, 1)

    const tournament = career('gate-tour')
    const ev = injectEvent(tournament.world, { week: 2, tier: 'local', deadlineWeek: 0 })
    enterEvent(tournament.world, ev.id)
    advanceWeeks(tournament.world, tournament.rng, MULTI_WEEK_SPAN)

    const knock = quietCareer('gate-knock', { coachTier: 'self' })
    for (let i = 0; i < 40 && !pendingKnock(knock.world); i++) tickWeek(knock.world, knock.rng)

    const birthday = quietCareer('gate-bday')
    // ⚠ 21 -> 22 BY ROUND 34 #3 – the same one-week move as the case above; see its note.
    walkTo(birthday.world, birthday.rng, 22)
    advanceWeeks(birthday.world, birthday.rng, 1)

    const fork = quietCareer('gate-fork')
    fork.world.fork = { askedWeek: fork.world.week, answer: null, offer: null, departsWeek: null }

    const retirement = quietCareer('gate-retire')
    retirement.world.retirementOffer = { askedWeek: retirement.world.week, seasonIndex: 0, reason: 'age', final: false }

    // ⭐⭐ ROUND 29 #3 – THE SEVENTH REFUSAL. A signed campaign names the week ahead and she is
    // entered in it: the parent has to choose, and two of his four answers stop being possible once
    // the week begins. Built the cheapest honest way like every other row here – the point of the
    // table is that the SEVEN are the seven, not how each one is reached.
    const clash = quietCareer('gate-shoot-clash')
    const clashEv = injectEvent(clash.world, { week: clash.world.week + 1, tier: 'local', deadlineWeek: clash.world.week })
    enterEvent(clash.world, clashEv.id)
    clash.world.offers.push({
      id: 'ad-gate-clash',
      kind: 'ad',
      week: clash.world.week - 5,
      deadlineWeek: clash.world.week - 2,
      state: 'signed',
      decidedWeek: clash.world.week - 5,
      fromWeek: clash.world.week - 5,
      untilWeek: clash.world.week + 40,
      terms: {
        // The LEGACY watch paper's own shape (real saves hold letters exactly like it): the fee is
        // the watches category's anchor cell, the term the old 52-week one.
        brand: ECONOMY.advertising.categories.watches.houses[0],
        cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[0]!,
        termWeeks: 52,
        shootCount: 2,
        shootWeeks: [clash.world.week + 1],
      },
    })

    return [
      { reason: 'ending', world: ending.world },
      { reason: 'tournament', world: tournament.world },
      { reason: 'knock', world: knock.world },
      { reason: 'birthday', world: birthday.world },
      { reason: 'fork', world: fork.world },
      { reason: 'retirement', world: retirement.world },
      { reason: 'shoot-clash', world: clash.world },
    ]
  }

  it('⚠⚠ in every state the engine REFUSES, the shell does not offer the span (no dead click)', () => {
    const table = refusalWorlds()
    expect(table.map((r) => r.reason), 'the table covers the refusal list exactly').toEqual([...ADVANCE_REFUSALS])
    for (const { reason, world } of table) {
      // The engine's answer.
      expect(advanceRefusal(world), `${reason}: the engine names it`).toBe(reason)
      const before = world.week
      expect(advanceWeeks(world, resumeMain(world.rngMain), MULTI_WEEK_SPAN), `${reason}: one reason, no ticks`).toEqual([reason])
      expect(world.week, `${reason}: not one week moved`).toBe(before)
      // The shell's answer, asked of the SNAPSHOT – the same six seen from the other side of the wire.
      expect(multiOffered(toSnapshot(world), 'training'), `${reason}: and the pill is not on offer`).toBe(false)
    }
  })

  it('⚠ on a LAYOFF week with nothing pending, the span IS offered', () => {
    // The other half – without it the gate above is satisfied by a control that never appears.
    // ⚠ RE-AIMED NOTE (round 26 #1): this stayed green for a DIFFERENT REASON than it used to.
    // `quietCareer` empties `world.season`, so the owner's first arm – nothing in the calendar for
    // five weeks – held as well as the engine's refusal being null.
    //
    // ⚠⚠ RE-AIMED AGAIN BY ROUND 30 #3, AND THE FIRST ARM IS GONE. He played the repaired control
    // and deleted it: «давай вообще эту кнопку про 6 недель уберём. Её можно оставить только на
    // длинные травмы». An empty calendar is no longer a reason to offer a skip – «нам в это время
    // приходят письма и идёт запись на новые турниры» – so this case now reaches the offered state
    // through the arm that survives, and asserts BOTH halves of the new rule: an empty calendar on
    // its own says no, and the layoff over it says yes.
    const { world } = quietCareer('gate-quiet')
    const snap = toSnapshot(world)
    expect(advanceRefusal(world), 'the engine can move time').toBeNull()
    expect(snap.upcoming, 'the calendar really is empty').toHaveLength(0)
    expect(
      multiOffered(snap, 'training'),
      'an empty calendar still offers the span – the quiet-stretch arm is back',
    ).toBe(false)

    // ...and the layoff is what makes the control legal, on the identical week.
    const hurt = {
      ...snap,
      injury: {
        kind: 'stress fracture',
        severity: 'major' as const,
        weeksRemaining: 20,
        totalWeeks: 20,
        sinceWeek: snap.week - 1,
      },
    }
    expect(multiOffered(hurt, 'training'), 'so the layoff week offers the span').toBe(true)
    expect(multiOffered(hurt, 'off-season')).toBe(true)
    expect(multiOffered(hurt, 'exam')).toBe(true)
  })

  it('⭐⭐ an unanswered LETTER is a halt and not a refusal – so the pill stays on offer', () => {
    // ⚠⚠ THE TWO READERS HAVE TO AGREE ABOUT THE NEW REASON AS WELL, AND HERE THEY AGREE BY BOTH
    // SAYING NOTHING – which is the answer that needs asserting, because it is the one a later
    // reader is most likely to "fix". `'offer'` HALTS a span and never REFUSES one: an open letter is
    // not a question standing in front of the week, the parent is allowed to let it expire («the
    // window is the feature, not a courtesy», engine/offers.ts), and a pill that stood down while
    // paper lay on the table would be a refusal the engine does not have – the shell inventing a
    // rule, which is precisely what `multiOffered`'s header forbids.
    expect([...ADVANCE_REFUSALS], "the refusal list does not name it, and that is the decision").not.toContain('offer')

    // Driven, not asserted from the list: the walked career of block B, standing on the week its
    // letter arrived, with the letter open and live for four more weeks.
    const { world, rng } = quietCareer('r2-13-offer')
    grantBand(world, 400)
    walkTo(world, rng, 45)
    expect(span(world, rng).stops, 'the fixture really is standing on an offer stop').toEqual(['offer'])
    const live = world.offers.find((o) => o.state === 'open')
    expect(live, 'and the letter really is unanswered').toBeTruthy()
    expect(live!.deadlineWeek, 'and really still answerable').toBeGreaterThanOrEqual(world.week)

    const snap = toSnapshot(world)
    expect(snap.offerOpen, 'the inbox dot is lit').toBe(true)
    expect(advanceRefusal(world), 'and yet the engine can move time').toBeNull()
    expect(blockingOverlay(snap), 'nothing is blocking the shell either').toBeNull()

    // ⚠ RE-AIMED BY ROUND 26 #1, NOT RELAXED – AND THE CLAIM IS NOW THE STRONGER ONE. This line used
    // to read `multiOffered(snap, 'off-season') === true`, which was true only because the OLD gate
    // offered the pill on every week the engine could move. The owner overturned that gate on 25.08
    // and this fixture is not quiet under the new one: week 45 of a walked career has 17 events in
    // the eight-week horizon and 11 of them inside his five. So the case can no longer read the
    // pill's verdict as "the letter did not withhold it" – a false answer here would now be the
    // CALENDAR's, not the letter's, and the case would pass or fail for the wrong reason.
    //
    // What it asserts instead is exactly the original sentence: THE LETTER IS NOT A TERM. First that
    // the verdict is the owner's rule and nothing else…
    expect(multiOffered(snap, 'off-season'), 'the letter contributes nothing to the verdict either way').toBe(
      spanWorthOffering(snap.week, snap.upcoming, snap.injury),
    )
    // …and then that with his rule satisfied the pill IS on offer WITH the letter still lying open,
    // which is the half a "the shell invented a refusal" regression would break. The calendar is
    // emptied on the SNAPSHOT rather than in the world, so the offer, the inbox dot and every other
    // fact about this week are untouched.
    // ⚠⚠ RE-AIMED AGAIN BY ROUND 30 #3. The cleared reading used to be `{ ...snap, upcoming: [] }`,
    // because an empty calendar was the arm that satisfied his rule. That arm is gone – he deleted
    // it – so the reading that satisfies the rule today is a LAYOFF, and the claim is unchanged:
    // with his rule satisfied the pill IS on offer WITH the letter still lying open. The layoff is
    // laid on the SNAPSHOT rather than in the world, so the offer, the inbox dot and every other
    // fact about this week are untouched, exactly as the empty calendar was.
    const clear = {
      ...snap,
      upcoming: [],
      injury: {
        kind: 'stress fracture',
        severity: 'major' as const,
        weeksRemaining: 20,
        totalWeeks: 20,
        sinceWeek: snap.week - 1,
      },
    }
    expect(clear.offerOpen, 'the letter is still open on the cleared reading').toBe(true)
    expect(multiOffered(clear, 'off-season'), 'so the span is still on offer – no reason to withhold it').toBe(true)
  })

  it('⭐ the offer stop has toast copy, and the copy keeps the house rules', () => {
    // R10-16's rule, working the other way round (round12.test.ts makes the same check for the
    // walkover): a stop reason with NO copy and no owning dialog renders the empty popup the owner
    // hit on 26.07. This one has copy, so the toast can speak for it; and because it has copy it
    // must also survive the copy rules – short dash, no Cyrillic in a player-facing string.
    const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
    const map = region(app, 'const STOP_REASON_TEXT', 'const stopReasons')
    expect(map).toContain('offer:')
    const copy = map.match(/\n {2}offer: '([^']*)'/)![1]
    expect(copy, 'the short dash, never the long one').not.toContain('—')
    expect(copy, 'no Cyrillic in player copy').not.toMatch(/[Ѐ-ӿ]/)
    // ...and the sentence keeps the promise only a DECISION can keep. It says the letter can be
    // answered, which would be a lie over a receipt – which is the copy's own stake in the rule.
    expect(copy.toLowerCase(), 'it names the surface and the clock').toContain('inbox')
    expect(copy.toLowerCase()).toContain('deadline')
    // and it is in the precedence list, or the filter would silently drop it (R11-1's bug class)
    expect(STOP_PRECEDENCE).toContain('offer')
  })

  it('⚠⚠ ROUND 26 #1 – THE OWNER\'S GATE IS AN OFFER RULE, AND THE ADVANCE HAS NOT HEARD OF IT', () => {
    // ⚠⚠ THE DIRECTION IS THE WHOLE CASE. The second pass narrowed WHEN the pill is drawn, from "the
    // engine can move time" (204 of 208 walked weeks) to his rule (5 of 208). The one way that can
    // go wrong is for the narrowing to leak into the engine – a week the pill is withheld on must
    // still be a week the ADVANCE runs, or `advanceRefusal` has quietly grown a seventh member and
    // a busy career has lost the ability to step at all.
    //
    // Driven on block B's own offer fixture, which is exactly such a week: at week 45 of this walk
    // her calendar is full, so the pill stands down – and the span still spends its weeks and still
    // halts on the letter, with the identical reason list block B asserts.
    const { world, rng } = quietCareer('r2-13-offer')
    grantBand(world, 400)
    walkTo(world, rng, 45)
    const snap = toSnapshot(world)
    expect(spanWorthOffering(snap.week, snap.upcoming, snap.injury), 'the owner\'s rule withholds the pill here').toBe(false)
    expect(multiOffered(snap, 'off-season'), 'so the shell does not draw it').toBe(false)

    // ...and none of that reaches the engine.
    expect(advanceRefusal(world), 'the advance still refuses nothing').toBeNull()
    const before = world.week
    const ran = span(world, rng)
    expect(ran.stops, 'and it still stops on the letter, exactly as block B asserts').toEqual(['offer'])
    expect(world.week, 'having really spent the weeks it bought').toBeGreaterThan(before)

    // THE REFUSAL LIST AND THE PRECEDENCE ARE THE SAME OBJECTS THEY WERE. Block F counts the
    // refusals out of `advanceRefusal`'s own source and block B's last case accounts for every
    // member of STOP_PRECEDENCE; this states the round's claim about them in one place, including
    // the two the item text names – the letter and the college pauses.
    // ⚠ RE-AIMED AT ROUND 29 #3 – 'shoot-clash' IS THE SEVENTH REFUSAL, and this line is the one place
    // the round's claim about the list is stated, so it moves WITH the list rather than being loosened.
    // Everything the case is about is unchanged: the narrowing of the OFFER rule still does not reach
    // the engine, and the letter is still a halt and not a refusal.
    expect([...ADVANCE_REFUSALS]).toEqual(['ending', 'tournament', 'knock', 'birthday', 'fork', 'retirement', 'shoot-clash'])
    expect(ADVANCE_REFUSALS, 'the offer is still a halt and not a refusal').not.toContain('offer')
    for (const collegePause of ['ending', 'birthday', 'fork'] as const) {
      expect(STOP_PRECEDENCE, `the college pause '${collegePause}' still has its slot`).toContain(collegePause)
    }
    expect(STOP_PRECEDENCE).toContain('offer')
  })

  it('⚠ ...and never on a week the player came to play', () => {
    // The 28.07 ruling, as an assertion: "it was a testing shortcut that offered to skip the thing
    // the player came to play". A trip, a withdrawal, a booked friendly and a family week are that
    // thing; the span is for the stretches between them.
    const { world } = quietCareer('gate-busy')
    const snap = toSnapshot(world)
    for (const kind of ['tournament', 'walkover', 'practice', 'vacation'] as const) {
      expect(multiOffered(snap, kind), `${kind} is not a quiet week`).toBe(false)
    }
  })
})

// =================================================================================================
// E. NOTHING IS LOST
// =================================================================================================
describe('R2-13 E – the span reports every intermediate result', () => {
  it('⚠⚠ every row the spent weeks wrote is in the digest – measured against the world itself', () => {
    const { world, rng } = quietCareer('r2-13-digest')
    const from = world.week
    const { stops, weeks } = span(world, rng)
    expect(stops, 'a quiet four-week stretch, which is the case the feature is for').toEqual([])
    expect(weeks).toBe(MULTI_WEEK_SPAN)

    const digest = spanDigest(world.events, from, world.week)
    // THE CLAIM: the digest's ids are exactly the ids of the world's own rows in that window. Not a
    // count – the SET, so a digest that dropped one row and invented another could not pass.
    const raised = world.events.filter((e) => e.week > from && e.week <= world.week).map((e) => e.id)
    expect(digest.flatMap((w) => w.rows.map((r) => r.id)).sort((a, b) => a - b)).toEqual([...raised].sort((a, b) => a - b))
    expect(raised.length, 'and the four weeks really wrote something – otherwise this is vacuous').toBeGreaterThan(10)

    // ⚠ AND IT SURVIVES THE WIRE. `Snapshot.events` is the trailing SNAPSHOT_EVENTS rows, not the
    // whole feed, and the shell builds its digest from that – so the claim the card actually makes
    // is this one. Measured rather than argued, because "60 is plenty for four weeks" is exactly the
    // kind of sentence that is true until a career gets busy.
    const overWire = spanDigest(toSnapshot(world).events, from, world.week)
    expect(spanRowCount(overWire), `${raised.length} rows in ${MULTI_WEEK_SPAN} weeks, all of them inside the snapshot window`).toBe(raised.length)
    expect(JSON.stringify(overWire)).toBe(JSON.stringify(digest))

    // Every week that had something is its own group, oldest first, and no group is empty.
    expect(digest.map((w) => w.week)).toEqual([...digest.map((w) => w.week)].sort((a, b) => a - b))
    for (const w of digest) {
      expect(w.rows.length, `week ${w.week} is in the digest, so it has rows`).toBeGreaterThan(0)
      expect(w.week).toBeGreaterThan(from)
      expect(w.week).toBeLessThanOrEqual(world.week)
    }
  })

  it('⚠ the money the span moved is all there – a bill in week two cannot pass in silence', () => {
    const { world, rng } = quietCareer('r2-13-digest-money')
    const from = world.week
    const fundsBefore = world.fundsCents
    span(world, rng)
    const digest = spanDigest(world.events, from, world.week)
    const moved = digest.flatMap((w) => w.rows).reduce((sum, r) => sum + (r.amountCents ?? 0), 0)
    expect(moved, 'the rows account for the whole change in the wallet, to the cent').toBe(world.fundsCents - fundsBefore)
    expect(moved, 'and it is not zero – four weeks of a career cost money').not.toBe(0)
  })

  it('⚠ the digest is a window and nothing else – the week before and the week after are excluded', () => {
    // The mutation surface named: `spanDigest` filters on `(from, to]` and on no other property. A
    // version that also filtered by type or by "interestingness" would drop rows this asserts are in.
    const rows = [
      { id: 1, week: 4, type: 'info' as const, text: 'before' },
      { id: 2, week: 5, type: 'info' as const, text: 'first' },
      { id: 3, week: 5, type: 'expense' as const, text: 'bill', amountCents: -1000 },
      { id: 4, week: 7, type: 'milestone' as const, text: 'diary beat' },
      { id: 5, week: 8, type: 'info' as const, text: 'after' },
    ]
    const digest = spanDigest(rows, 4, 7)
    expect(digest.map((w) => w.week)).toEqual([5, 7])
    expect(digest.flatMap((w) => w.rows.map((r) => r.id))).toEqual([2, 3, 4])
    expect(spanRowCount(digest)).toBe(3)
  })
})

// =================================================================================================
// F. THE DRIFT GUARD
// =================================================================================================
describe('R2-13 F – a seventh refusal cannot be added without this file noticing', () => {
  it('⚠⚠ `advanceRefusal` returns exactly the reasons `ADVANCE_REFUSALS` names, in that order', () => {
    // WHY THIS IS A SOURCE PIN AND NOT A BEHAVIOUR TEST. The failure it guards is a state nobody has
    // written a fixture for yet: a seventh refusal added to the engine leaves the four-week pill
    // offered in a state the engine cannot move, which is R10-16's dead control – and no behaviour
    // test can cover a state that does not exist at the time the test is written. Counting the
    // refusals in the function's own source can. Location-independent (`worldFunction` reads the
    // whole world module set), so a further extraction needs no edit here.
    const fn = worldFunction('advanceRefusal')
    expect(fn).not.toBe('')
    const code = fn.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
    const returned = [...code.matchAll(/return '([a-z-]+)'/g)].map((m) => m[1])
    expect(returned, 'every refusal in the code is in the list, in the order the code asks them').toEqual([...ADVANCE_REFUSALS])
  })

  it('⚠ `advanceWeeks` asks that one gate and keeps no private copy of it', () => {
    const loop = worldFunction('advanceWeeks')
    expect(loop).toContain('advanceRefusal(world)')
    // The entry gate is one call: no `return ['...']` may reappear above the loop, which is how the
    // engine and the button would drift apart again.
    const head = before(loop, 'const stops = new Set')
    expect([...head.matchAll(/return \['/g)]).toHaveLength(0)
  })

  // ⚠⚠ RE-AIMED AT ROUND 29 #6 – THE CONSTANT IS A FLOOR NOW, NOT THE SPAN. It read «the span is
  // four, and it is one number», and its stated reason was the wire: «`ToWorker`'s `advance` accepts
  // `weeks: 1 | 4`; this constant is what the UI presses with, and a mismatch would be a runtime
  // refusal». That literal union is exactly what made the pill unable to offer the owner's six-week
  // gap, so the wire widened to a plain count and this constant stopped being what the UI presses
  // with (`multiSpanOf` -> `spanWeeksFor` is). What it still IS, and what this now pins, is the
  // smallest slot worth a second button – below it a "span" is the week button pressed twice.
  it('⚠ the span FLOOR is four, and it is one number', () => {
    expect(MULTI_WEEK_SPAN).toBe(4)
    // ...and the shell reads that floor rather than carrying a second copy of it.
    const action = readFileSync(new URL('../src/composables/weekAction.ts', import.meta.url), 'utf8')
    expect(action, 'the composable invented its own floor').toContain('weeks >= MULTI_WEEK_SPAN ? weeks : 0')
  })
})
