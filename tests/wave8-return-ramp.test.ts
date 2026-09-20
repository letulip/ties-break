// THE RETURN, WAVE 8 – T6 HALF 3: THE RAMP, AND THE TRAP THAT IS MECHANICAL FOR FREE (life/wave-8;
// docs/plans/life-wave-8-builder-2026-09.md §2 T6).
//
// On the week she comes back, a BLOCKING `'return-plan'` beat: **small events first** or **straight
// back to the big draws**. ⭐ THIS ONE IS THE PARENT'S, and §4a is untouched by saying so – «SHE
// decides, the parent REACTS» is a law about HER LIFE, and she decided at T5's coin. What is left is
// the SCHEDULING, which the college fork's mechanical questions already put to him.
//
//   §A  the beat: raised on the return week, BLOCKING, once, and never on the ending arm
//   §B  both answers reach `world.comeback.returnPlan` (RULING A's seat), and the table is total
//       over the card's own option ids
//   §C  the seam reads it as a **preference and not a lock** – and an override still works
//   §D  ⚠⚠ THE TWO ARMS, MEASURED. The wrong ramp must measurably fail more often, and if they tie
//       that is a finding and not a shrug. The measured numbers are in this file's header below.
//   §E  the totality obligation T3 handed T5 and T6, confirmed from T6's side
//   §F  zero draws – the beat takes none
//
// ⭐⭐⭐ **THE MEASUREMENT (§D), AND IT DID NOT COME OUT THE WAY §2 T6 PREDICTED – WHICH IS A FINDING
// AND IS BROUGHT RATHER THAN TUNED AROUND.** The brief: «the wrong ramp must measurably fail more
// often – if the two arms tie, that is a finding to bring, not a shrug. You do not tune a constant to
// make the trap appear.» They do not tie. **THEY REVERSE.**
//
// THE APPARATUS. Eight careers, each cloned into two worlds that differ ONLY in the answer to the
// beat, walked 52 weeks from the return through the REAL tick with the REAL match engine. Booking
// policy per arm, and NO TIER BOUNDARY IS INVENTED – for a woman coming back, «small» and «big» ARE
// «does she need the freeze to get in», which half 1 already computes:
//
//     straight-back   the highest rung the gate will admit her to, freeze included
//     small-first     the highest rung her LIVE standing admits – the highest whose verdict does NOT
//                     carry `onProtectedRank`
//
// MEASURED (transcribed from the run that shipped; the case prints the rows):
//
//     WTA points at +12 months     straight-back ahead on **8 of 8** careers (mean 141 against 55)
//     live rank at +12 months      straight-back better on 8 of 8 (mean #352 against #597)
//     protected entries spent      straight-back 12.0 of 12, small-first 0.0 of 12
//
// ⚠⚠ AND THE CAUSE IS ISOLATED RATHER THAN GUESSED, because «straight-back also plays the small
// events on its free weeks» would have been the obvious explanation and IS NOT THE ONE. A third,
// diagnostic arm – **big draws ONLY**, twelve entries and nothing else for a whole year – was run on
// four of the same careers and still beat a full small-events programme of 30–36 entries on 4 of 4
// (365 / 395 / 80 / 140 points against 51 / 36 / 47 / 75). So:
//
//   ⭐ **TWELVE FIRST-ROUND EXITS AT A SLAM OR A 1000, AT 0.6 OF HER WINGS, OUT-EARN A YEAR OF W15s.**
//     The ladder's points economy, not the staged factor, is what decides this: the factor makes her
//     lose the big draws exactly as designed, and losing them still pays more than winning the small
//     ones. The research's documented failure mode («straight to big events on wildcards») does not
//     reproduce in this build, and it cannot be made to by moving −40% – the gap is an order of
//     magnitude, and invariant 5 forbids moving it anyway.
//   ⚠ THE SECOND HALF OF THE TRAP IS INTACT AND IS NOT WHAT FAILED: the freeze really is spent, 12
//     of 12, and only by the arm that goes back to the big draws. What is missing is an OPPORTUNITY
//     COST for spending it – in this model a wasted protected entry costs her the entry and nothing
//     else, because weeks are not scarce (she plays 35–44 of them either way) and a lost first round
//     is not punished.
//   ⚠ IT IS CARRIED TO THE OWNER AND TO T9, NOT PATCHED HERE. §2 T6's sentence is the one that needs
//     his word; the candidates are all design decisions rather than tuning (a points floor on a draw
//     she is not competitive in, a body cost on big weeks, or accepting that our economy simply makes
//     the freeze a good bet). §D.2 PINS THE MEASURED DIRECTION so that the day any of them lands,
//     somebody has to come back to this line.
//
// MUTATION LEDGER – every arm run red-first against THIS file, applied by a scripted exact-string
// edit with an md5 receipt and reverted by md5, on a re-verified 13-green baseline. ⚠ THE COUNTS ARE
// **MEASURED** REDS, NOT PREDICTIONS. ⚠ §D IS EXCLUDED FROM THE ARM RUNS BY NAME and the exclusion is
// stated rather than hidden: it is a four-minute walk of sixteen careers through the real match
// engine, and its own net is a MEASUREMENT rather than a mutation net – every arm below is measured
// over §A / §B / §C / §E / §F, a 12-green baseline.
//   ARM 1  the raise deleted from the try arm               → 10 RED: every case that needs a card –
//                                                              all of §A but the ending arm, all of
//                                                              §B, two of §C, §E and §F
//   ARM 2  the kind declared NON-blocking                   → 3 RED: §A.1, §A.2, §E – the card stops
//                                                              being PENDING, which is what every
//                                                              reader of it asks
//   ARM 3  the answer never reaches `world.comeback         → 3 RED: §B.1, §B.2, §C.1
//          .returnPlan` (ruling A's seat left unwritten)
//   ARM 4  the seam ignores the PLAN and marks every        → 2 RED: §C.2 (straight-back must have no
//          freeze entry off-plan                               off-plan entry) and §C.3 (an
//                                                              unanswered card has no preference)
//   ARM 5  off-plan made a REFUSAL rather than a label      → 1 RED: §C.1 – «a preference, not a
//                                                              lock», and §C.1 is the only case that
//                                                              can see it because it is the only one
//                                                              that enters an off-plan event
//   ARM 6  the raise moved onto the ENDING arm as well      → 1 RED: §A.4

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's §B apparatus, carried by T2..T6's suites.
const rngKeys = vi.hoisted(() => [] as string[])
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      rngKeys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  answerLifeBeat,
  closeTournament,
  createWorld,
  decisionWeekOf,
  enterEvent,
  entryStatus,
  kidAgeExact,
  kidPoints,
  pendingLifeBeat,
  pendingLifeBeatOptions,
  resolveReturnDecision,
  skipTournament,
  tickWeek,
  LIFE_BEAT_BLOCKING,
  LIFE_BEAT_OPTIONS,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { advanceRefusal } from '../src/engine/world/multiWeek'
// ⚠ `rankIn` IS NOT ON THE `engine/world` BARREL and is imported from the module that owns it, which
// is where `tests/ladder-floor.test.ts` already takes its ladder reads from.
import { rankIn } from '../src/engine/world/ladder'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import type { LoveEpisode } from '../src/shared/protocol'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// ⚠⚠ THE BRIEF'S OWN LITERALS, TRANSCRIBED AND NEVER READ OFF `ECONOMY` – wave 3's ARM 2 law.
const BRIEF = { playsOnWeeks: 8, termWeeks: 31, protectedEntries: 12 } as const

/** The two answers the card offers, transcribed from §2 T6's own sentence («small events first /
 *  straight back to the big draws») rather than read off `LIFE_BEAT_OPTIONS`. */
const PLANS = ['small-first', 'straight-back'] as const

beforeEach(() => {
  rngKeys.length = 0
})

// -------------------------------------------------------------------------------------------------
// FIXTURES – T5's and half 1's own
// -------------------------------------------------------------------------------------------------

function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

function wedded(seed: string, age = 28): WorldState {
  const world = createWorld(seed)
  const week = weekAtAge(world, age)
  world.week = week
  world.loveEpisodes = [married(week - 104, week - 52)]
  world.condition = 100
  world.fundsCents = 5_000_000_00
  world.spirit = ECONOMY.spirit.baseline
  world.bond = ECONOMY.bond.start
  world.fork = { askedWeek: 0, answer: 'continue', offer: null }
  // ⭐⭐⭐ SHE IS A PROFESSIONAL, AND THE FIRST DRAFT OF THIS FIXTURE WAS NOT – WHICH IS A FINDING
  // RATHER THAN A TIDY-UP, AND IT IS RECORDED IN THE HEADER'S MEASUREMENT NOTE.
  //
  // ⚠⚠ THE ON-RAMPS ARE LATCHES (`onRampCleared`, v34) AND A CAREER THAT NEVER CROSSED THEM HAS NO
  // W ACCESS AT ALL. Without these two booleans the «small-first» arm has nothing on the professional
  // ladder it can enter – W15's door is the latch, every rung above is an acceptance cut she misses,
  // and the arm therefore books DOMESTIC tennis and banks ZERO WTA points. That is a fact about the
  // fixture and not about the ramp, and believing it would have been CLAUDE.md's own null-arm shape:
  // «prove the arm contains both the change and its READER». A woman who paused a professional career
  // crossed both on-ramps years before the pregnancy, so the fixture says so.
  world.onRampCleared = { itf: true, wta: true }
  return world
}

/** ⭐⭐ A CAREER STANDING ON ITS RETURN WEEK, POSED THROUGH THE ENGINE'S OWN WRITER. The coin is not
 *  bent – the arm is SELECTED by searching seeds, exactly as T5's `decided` does. `rankAtPause` is set
 *  by hand because these cases are about the RAMP and not about the capture (half 1 walks that). */
function returned(prefix: string, rankAtPause: number | null = 41, age = 28): WorldState {
  for (let i = 0; i < 500; i++) {
    const world = wedded(`${prefix}-${i}`, age)
    const pausesWeek = world.week + BRIEF.playsOnWeeks
    world.pregnancy = {
      episodeId: world.loveEpisodes[0].id,
      announcedWeek: world.week,
      pausesWeek,
      dueWeek: pausesWeek + BRIEF.termWeeks,
      support: 'warm',
      rankAtPause,
    }
    world.week = decisionWeekOf(world.pregnancy)
    resolveReturnDecision(world)
    if (world.comeback !== null && world.ending === null) return world
  }
  throw new Error(`no seed under '${prefix}' whose coin says she tries`)
}

/** Tick one week and play out anything the reveal opens. ⚠ `skipTournament` REVEALS EVERY ROUND AND
 *  FINALISES – it is the «show me the whole thing at once» control, not a withdrawal – so the walk
 *  below really plays her tournaments and really banks her points. */
function tickThrough(world: WorldState, rng: () => number): void {
  tickWeek(world, rng)
  if (world.pendingTournament) {
    skipTournament(world)
    closeTournament(world)
  }
}

/** ⭐⭐⭐ ONE WEEK OF A BOOKING POLICY, AND THE POLICY IS THE SEAM'S OWN FLAG RATHER THAN A TIER LIST.
 *
 *  Over every future event whose deadline is still open and whose week she is free on, take the
 *  HIGHEST rung on `TIER_LADDER` the gate will admit her to – and, for `'small-first'`, only among
 *  the ones whose verdict does NOT carry `onProtectedRank`, which is «play where your live standing
 *  already gets you in». That is what the small-events ramp IS, and it needs no boundary anybody
 *  invented: half 1 already computes which entries the freeze had to open. */
function bookOne(world: WorldState, plan: (typeof PLANS)[number]): TierId | null {
  let best: { event: SeasonEvent; rung: number } | null = null
  for (const event of world.season) {
    if (event.week <= world.week || world.week > event.deadlineWeek) continue
    if (world.entries.includes(event.id)) continue
    if (world.season.some((e) => e.week === event.week && world.entries.includes(e.id))) continue
    const gate = entryStatus(world, event)
    if (gate.level === 'blocked') continue
    if (plan === 'small-first' && gate.onProtectedRank) continue
    const rung = TIER_LADDER.indexOf(event.tier)
    if (best === null || rung > best.rung) best = { event, rung }
  }
  if (best === null) return null
  enterEvent(world, best.event.id)
  return best.event.tier
}

interface ArmResult {
  points: number
  rank: number
  spent: number
  entered: number
}

/** One arm: answer the beat, then book and play `weeks` weeks through the real engine. */
function walkArm(base: WorldState, plan: (typeof PLANS)[number], weeks: number): ArmResult {
  const world = structuredClone(base)
  answerLifeBeat(world, plan)
  expect(world.comeback!.returnPlan, 'the arm really is the arm').toBe(plan)
  const rng = rngFromSeed(`${world.seed}:main`)
  let entered = 0
  for (let i = 0; i < weeks; i++) {
    if (bookOne(world, plan) !== null) entered++
    tickThrough(world, rng)
  }
  return {
    points: kidPoints(world, 'wta'),
    rank: rankIn(world, 'wta'),
    spent: BRIEF.protectedEntries - (world.comeback!.protectedRank?.entriesLeft ?? 0),
    entered,
  }
}

// =================================================================================================
// A. THE BEAT – raised on the return week, blocking, once
// =================================================================================================
describe('wave 8 T6 A – the ramp is a blocking beat on the week she comes back', () => {
  it('⭐⭐⭐ the try arm raises it, on the same week it fills `world.comeback`', () => {
    const world = returned('w8-t6-raise')
    const row = pendingLifeBeat(world)
    expect(row?.kind, 'the card is up').toBe('return-plan')
    expect(row?.week, 'on the week she came back').toBe(world.comeback!.returnedWeek)
    expect(row?.answer, 'and nobody has answered it').toBeNull()
    expect(pendingLifeBeatOptions(world)?.map((o) => o.id), 'two answers, the brief\'s own two')
      .toEqual([...PLANS])
  })

  it('⚠⚠ it BLOCKS – the week does not move until the parent has said how', () => {
    expect(LIFE_BEAT_BLOCKING['return-plan'], 'declared blocking, per kind and by type').toBe(true)
    const world = returned('w8-t6-block')
    expect(advanceRefusal(world), 'the tick refuses while her card stands').toBe('life')
    answerLifeBeat(world, 'small-first')
    expect(advanceRefusal(world), '...and any answer releases it').not.toBe('life')
  })

  it('⚠ ONCE, by construction – the record is cleared, so the function cannot raise a second', () => {
    const world = returned('w8-t6-once')
    resolveReturnDecision(world)
    resolveReturnDecision(world)
    expect(
      (world.lifeLog ?? []).filter((r) => r.kind === 'return-plan'),
      'one card for one comeback',
    ).toHaveLength(1)
  })

  it('⚠ the ENDING arm raises none – there is no ramp to plan', () => {
    let stopped: WorldState | null = null
    for (let i = 0; i < 500 && stopped === null; i++) {
      const world = wedded(`w8-t6-ramp-stops-${i}`)
      const pausesWeek = world.week + BRIEF.playsOnWeeks
      world.pregnancy = {
        episodeId: world.loveEpisodes[0].id, announcedWeek: world.week, pausesWeek,
        dueWeek: pausesWeek + BRIEF.termWeeks, support: 'warm', rankAtPause: 41,
      }
      world.week = decisionWeekOf(world.pregnancy)
      resolveReturnDecision(world)
      if (world.ending !== null) stopped = world
    }
    expect(stopped, 'a seed whose coin says she does not go back').not.toBeNull()
    expect(
      (stopped!.lifeLog ?? []).filter((r) => r.kind === 'return-plan'),
      'the career stopped; nothing asks how she is coming back',
    ).toEqual([])
  })
})

// =================================================================================================
// B. THE ANSWER – it reaches `world.comeback`, which is where RULING A put the field
// =================================================================================================
describe('wave 8 T6 B – both answers set `returnPlan` on the seat that outlives the pregnancy', () => {
  it('⭐⭐⭐ small-first and straight-back each land on `world.comeback.returnPlan`', () => {
    for (const plan of PLANS) {
      const world = returned(`w8-t6-answer-${plan}`)
      expect(world.comeback!.returnPlan, 'null while the card stands – nobody has said how').toBeNull()
      expect(world.pregnancy, '⚠ AND THERE IS NO PREGNANCY LEFT TO WRITE ONTO – ruling A\'s whole reason')
        .toBeNull()
      answerLifeBeat(world, plan)
      expect(world.comeback!.returnPlan, `${plan} is recorded where the seam can read it`).toBe(plan)
    }
  })

  it('⚠ the id→plan table is TOTAL over the card\'s own option ids', () => {
    // The ids are strings rather than a union, so the type cannot carry this claim and a test has to
    // (`EXPECTING_SUPPORT`'s own arrangement one beat back). A third answer added to the card without
    // a plan beside it throws BY NAME in `answerLifeBeat` rather than writing `undefined`.
    const ids = LIFE_BEAT_OPTIONS['return-plan'].map((o) => o.id)
    expect(ids, 'the card offers exactly the two the brief drafts').toEqual([...PLANS])
    for (const id of ids) {
      const world = returned(`w8-t6-total-${id}`)
      expect(() => answerLifeBeat(world, id), `${id} has a plan`).not.toThrow()
      expect(world.comeback!.returnPlan).not.toBeNull()
    }
  })

  it('⚠ BOTH ARE FREE ON `bond` – the price of this answer is paid in tennis and nowhere else', () => {
    // §3k's ruling, asserted rather than left in a comment: a delta here would make one arm of the
    // wave's own trap «the nice one» on the card the trap is about.
    expect(LIFE_BEAT_OPTIONS['return-plan'].map((o) => o.bond), 'two zeroes').toEqual([0, 0])
    for (const plan of PLANS) {
      const world = returned(`w8-t6-bond-${plan}`)
      const bond = world.bond ?? ECONOMY.bond.start
      answerLifeBeat(world, plan)
      expect(world.bond ?? ECONOMY.bond.start, `${plan} moved no bond`).toBe(bond)
    }
  })
})

// =================================================================================================
// C. THE SEAM – a booking PREFERENCE and not a lock
// =================================================================================================
describe('wave 8 T6 C – the entries seam reads the plan, and an override still works', () => {
  it('⭐⭐⭐ under small-first a freeze-riding entry is marked OFF-PLAN and is still enterable', () => {
    const world = returned('w8-t6-pref')
    answerLifeBeat(world, 'small-first')
    const event = firstFreezeEvent(world)
    const gate = entryStatus(world, event)
    expect(gate.onProtectedRank, 'this entry needs the freeze').toBe(true)
    expect(gate.offReturnPlan, '⚠ and it parts from the ramp she said she would take').toBe(true)
    expect(gate.level, '⚠⚠ AND IT IS NOT REFUSED – a preference, never a lock').not.toBe('blocked')
    const funds = world.fundsCents
    expect(() => enterEvent(world, event.id), 'the override really works').not.toThrow()
    expect(world.entries, 'she is in it').toContain(event.id)
    expect(world.fundsCents, 'and it cost her the ordinary fee').toBeLessThan(funds)
    expect(world.comeback!.protectedRank!.entriesLeft, 'and one of the twelve, as any freeze entry does')
      .toBe(BRIEF.protectedEntries - 1)
  })

  it('⚠ under straight-back NOTHING is off-plan – the answer that names no boundary', () => {
    const world = returned('w8-t6-straight')
    answerLifeBeat(world, 'straight-back')
    const event = firstFreezeEvent(world)
    const gate = entryStatus(world, event)
    expect(gate.onProtectedRank, 'the same entry still rides the freeze').toBe(true)
    expect(gate.offReturnPlan, '...and is exactly what she said she would do').toBeUndefined()
  })

  it('⚠ and while the card is UNANSWERED there is no preference to part from', () => {
    const world = returned('w8-t6-unanswered')
    const event = firstFreezeEvent(world)
    expect(world.comeback!.returnPlan, 'nobody has said how').toBeNull()
    expect(entryStatus(world, event).offReturnPlan, 'so nothing is off any plan').toBeUndefined()
  })
})

/** The first future event the freeze is decisive for – probed through the REAL gate.
 *
 *  ⚠ IT TICKS THE WORLD FIRST, AND THAT IS NOT A CONVENIENCE: `wedded` parks a career at week ~1450
 *  and `ensureSeason` is what builds a calendar there, so a world that has not ticked has NO EVENTS
 *  AT ALL and the probe would throw on an empty list rather than on a missing door. Measured on the
 *  first run of this file. The beat is left unanswered by the caller that needs it that way –
 *  `tickWeek` does not consult `LIFE_BEAT_BLOCKING` (only `advanceWeeks` does), so ticking cannot
 *  answer her card. */
function firstFreezeEvent(world: WorldState): SeasonEvent {
  const rng = rngFromSeed(`${world.seed}:probe`)
  for (let i = 0; i < 12; i++) {
    for (const event of world.season) {
      if (event.week <= world.week || world.week > event.deadlineWeek) continue
      const gate = entryStatus(world, event)
      if (gate.level !== 'blocked' && gate.onProtectedRank) return event
    }
    tickThrough(world, rng)
  }
  throw new Error('no freeze-riding event on this calendar')
}

// =================================================================================================
// D. ⚠⚠ THE TWO ARMS – the wrong ramp must measurably fail more often
// =================================================================================================
describe('wave 8 T6 D – the trap, measured', () => {
  it('⭐⭐⭐ SMALL-FIRST vs STRAIGHT-BACK over twelve months, on the same careers', {
    timeout: 900_000,
  }, () => {
    // ⚠⚠ THE TWO WORLDS DIFFER IN EXACTLY ONE FIELD: the answer to the beat. Everything else – the
    // seed, the week, the freeze, the calendar, the MAIN stream – is a `structuredClone` of one
    // career, which is CLAUDE.md's «name the commit each arm was built at» rule applied to a fixture
    // instead of a tree: an A/B whose arms are two different careers measures the careers.
    const rows: string[] = []
    let straightAhead = 0
    let smallPts = 0
    let straightPts = 0
    let smallRank = 0
    let straightRank = 0
    let spentSmall = 0
    let spentStraight = 0
    const seeds = Array.from({ length: 8 }, (_, i) => `w8-t6-arm-${i}`)
    for (const seed of seeds) {
      const base = returned(seed)
      const small = walkArm(base, 'small-first', 52)
      const straight = walkArm(base, 'straight-back', 52)
      if (straight.points > small.points) straightAhead++
      smallPts += small.points
      straightPts += straight.points
      smallRank += small.rank
      straightRank += straight.rank
      spentSmall += small.spent
      spentStraight += straight.spent
      rows.push(
        `${seed}: small-first pts ${small.points} rank ${small.rank} spent ${small.spent} entered ${small.entered}` +
        ` | straight-back pts ${straight.points} rank ${straight.rank} spent ${straight.spent} entered ${straight.entered}`,
      )
    }
    const n = seeds.length
    // ⚠ PRINTED, BECAUSE A MEASUREMENT NOBODY CAN READ IS A NUMBER. The file's header transcribes
    // what these lines said on the run that shipped.
    console.log(rows.join('\n'))
    console.log(
      `straight-back ahead on points in ${straightAhead} of ${n}; mean points ` +
      `${(smallPts / n).toFixed(0)} small / ${(straightPts / n).toFixed(0)} straight; mean rank ` +
      `${(smallRank / n).toFixed(0)} small / ${(straightRank / n).toFixed(0)} straight; entries spent ` +
      `${(spentSmall / n).toFixed(1)} small / ${(spentStraight / n).toFixed(1)} straight`,
    )

    // ⭐ FIRST, THE PROVENANCE: two arms that produced identical worlds would be a null arm dressed as
    // a result (CLAUDE.md's own 17.08 pair of mistakes). They did not – the plans differ, the entry
    // programmes differ, and the books differ.
    expect(smallPts, 'the careful arm really played a season').toBeGreaterThan(0)
    expect(straightPts, 'and so did the other one').toBeGreaterThan(0)
    expect(smallPts).not.toBe(straightPts)

    // ⭐⭐ SECOND, THE HALF OF THE TRAP THAT WORKS EXACTLY AS §2 T6 DESCRIBES IT: the protected rank
    // ENTERS the big draws, and only the arm that goes back to them spends it. Twelve of twelve
    // against zero of twelve, on every career.
    expect(spentStraight / n, 'straight-back burns the whole entitlement inside a year')
      .toBe(BRIEF.protectedEntries)
    expect(spentSmall, '...and small-first never needs one').toBe(0)

    // ⚠⚠⚠ AND THIRD, **THE FINDING**, PINNED AS A MEASUREMENT RATHER THAN ASSERTED AS A DESIGN. §2 T6
    // predicts that the wrong ramp fails more often. IT DOES NOT: straight-back is ahead on points on
    // every career measured, because twelve first-round exits at a Slam or a 1000 – at 0.6 of her
    // wings, losing exactly as designed – out-earn a whole year of W15s. The header carries the
    // isolating third arm (big draws ONLY, twelve entries and nothing else, still ahead on 4 of 4),
    // which is what rules out «straight-back merely plays more tennis».
    //
    // ⚠⚠ THIS LINE IS DELIBERATELY THE SHAPE THAT GOES RED WHEN SOMEBODY FIXES IT. It is not a
    // statement that the reversal is correct – it is a receipt that it was MEASURED, so the day an
    // opportunity cost lands (the owner's call: a points floor, a body cost on big weeks, or accepting
    // that our economy makes the freeze a good bet) this case fails and somebody has to come back and
    // re-aim it with the new numbers. ⚠ NO CONSTANT OF THIS WAVE WAS MOVED TO MAKE IT PASS, and the
    // staged factor could not have closed the gap anyway: it is an order of magnitude wide.
    expect(
      straightAhead,
      '⚠⚠ FINDING: the wrong ramp WINS in this build – see the header, and do not tune to hide it',
    ).toBeGreaterThan(n / 2)
  })
})

// =================================================================================================
// E. THE TOTALITY OBLIGATION, CONFIRMED FROM T6's SIDE
// =================================================================================================
describe('wave 8 T6 E – the three paths out of the window, one task later', () => {
  it('⭐⭐ a returning career holds NO pregnancy, an open gate, a comeback and one card', () => {
    // T3's finding: `pauseCovering` reads the record LIVE and its refusal ends only when the record
    // goes null, so a career left holding one has its entries shut FOR EVER. T5 made the clear total
    // over both arms; T6 adds state to the same instant and must not have re-opened the hole. The
    // three paths are: she returns (here), she does not (the ending arm, §A.4 and T5's §D), and the
    // window «passes» – which is NOT a third case, because the guard is `>=` and `resolveEndings`
    // runs on every week. T5's §F walks 24 careers past the end of the window; this asserts the shape
    // T6 leaves behind on the arm T6 touched.
    const world = returned('w8-t6-totality')
    expect(world.pregnancy, 'the record never survives the function').toBeNull()
    expect(world.ending, 'and the career ticks on').toBeNull()
    expect(world.comeback, 'with the return recorded where the next task can read it').not.toBeNull()
    expect(pendingLifeBeat(world)?.kind, 'and exactly one question waiting').toBe('return-plan')
  })
})

// =================================================================================================
// F. THE DRAWS – the beat and its answer take none
// =================================================================================================
describe('wave 8 T6 F – half 3 takes no draw at all', () => {
  it('the raise and the answer are draw-free; only T5\'s own coin is spent', () => {
    const world = returned('w8-t6-ramp-draws')
    // ⚠ THE POSITIVE CONTROL FIRST AND ON THE SAME INSTRUMENT: the return itself DOES draw (T5's one
    // coin), so a recorder that saw nothing anywhere would be broken rather than draw-free.
    expect(
      rngKeys.filter((k) => k.includes(':life:return:')).length,
      'control: T5\'s coin was really spent through this recorder',
    ).toBeGreaterThan(0)
    rngKeys.length = 0
    answerLifeBeat(world, 'straight-back')
    expect(rngKeys.filter((k) => k.includes(':life:')), '⚠ answering the ramp draws nothing').toEqual([])
  })
})
