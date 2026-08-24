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
// since the first slice; nothing here re-implements a halt, and the phase-1 work added no stop
// reason, no snapshot field and no schema version.
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
  tickWeek,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { worldFunction } from './worldSource'
import { before } from './helpers/source'
import { resumeMain, type Rng } from '../src/engine/rng'
import { TIERS } from '../src/engine/season/calendar'
import { blockingOverlay } from '../src/composables/blockingOverlay'
import { multiOffered } from '../src/composables/weekAction'
import { DEFAULT_PROFILE, STOP_PRECEDENCE, type StopReason } from '../src/shared/protocol'
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
    const { world, rng } = quietCareer('r2-13-bday')
    walkTo(world, rng, 21)
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

  it('SEASON-END – halts on the wrap-up week, before the off-season', () => {
    const { world, rng } = career('r2-13-season-end')
    walkTo(world, rng, 45)
    world.season = []
    const { stops, weeks } = span(world, rng)
    expect(stops).toEqual(['season-end'])
    expect(world.week % 52, 'the season wrapped on 49, as the loop says').toBe(49)
    expect(weeks).toBe(4)
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
    const covered: StopReason[] = [
      'birthday', 'injury', 'medical', 'walkover', 'academy', 'knock',
      'tournament', 'deadline', 'funds', 'season-end', 'fork', 'retirement', 'ending',
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
    const { world, rng } = career('r2-13-collide')
    // Find her birthday week on a throwaway copy, then put a tournament she is entered in on exactly
    // that week. Nothing about the collision is faked – both facts are the engine's own predicates.
    const scout = quietCareer('r2-13-collide')
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
    walkTo(birthday.world, birthday.rng, 21)
    advanceWeeks(birthday.world, birthday.rng, 1)

    const fork = quietCareer('gate-fork')
    fork.world.fork = { askedWeek: fork.world.week, answer: null, offer: null, departsWeek: null }

    const retirement = quietCareer('gate-retire')
    retirement.world.retirementOffer = { askedWeek: retirement.world.week, seasonIndex: 0, reason: 'age', final: false }

    return [
      { reason: 'ending', world: ending.world },
      { reason: 'tournament', world: tournament.world },
      { reason: 'knock', world: knock.world },
      { reason: 'birthday', world: birthday.world },
      { reason: 'fork', world: fork.world },
      { reason: 'retirement', world: retirement.world },
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

  it('⚠ on a quiet week with nothing pending, the span IS offered', () => {
    // The other half – without it the gate above is satisfied by a control that never appears.
    const { world } = quietCareer('gate-quiet')
    const snap = toSnapshot(world)
    expect(advanceRefusal(world), 'the engine can move time').toBeNull()
    expect(multiOffered(snap, 'training'), 'so the quiet week offers the span').toBe(true)
    expect(multiOffered(snap, 'off-season')).toBe(true)
    expect(multiOffered(snap, 'exam')).toBe(true)
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

  it('⚠ the span is four, and it is one number', () => {
    // `ToWorker`'s `advance` accepts `weeks: 1 | 4`; this constant is what the UI presses with, and a
    // mismatch would be a runtime refusal at the worker's own validator rather than a type error.
    expect(MULTI_WEEK_SPAN).toBe(4)
  })
})
