// THE PLAY DOWN RULES – a rung she has outgrown stops being hers, and gives itself back (P1 step 2,
// docs/specs/play-down-2026-08.md; the owner's ruling of 15.08, «да, делаем тоже»).
//
// ⚠⚠ THE OWNER NAMED THE PROPERTY THAT MAKES THIS SAFE, AND IT IS WHAT THIS FILE IS: «когда она
// вывалится из топ-50 и топ-150 оно само откроется обратно». It is a rank READ, not a latch. So the
// first case below walks the line in BOTH directions in one test – cross it and lose the rung, fall
// back and get it back – and then asserts that the world's own serialisation is byte-identical
// across the round trip, which is "nothing persists" made mechanical instead of promised. A test
// that only walked one way would pass just as happily on a latch, and a latch is the one thing this
// must not be.
//
// The other three claims:
//   2. THE TWO LIMBS ARE TWO LIMBS. Top-150 loses W15 and W35; top-50 loses every W event. A rule
//      that collapsed them would be right about half the ladder and silently wrong about the rest.
//   3. THE WTA'S OWN RUNGS ARE UNTOUCHED. Barring a top-50 from the rungs she is top-50 BECAUSE of
//      is the opposite of the regulation, and it is the failure this scope note exists to prevent.
//   4. THE CALENDAR AND THE TURNSTILE AGREE (R10-5), and the refusal says what is hers instead.
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  entryStatus,
  kidAgeYears,
  recomputeKidRank,
  tickWeek,
  tierFloorOpen,
  PLAY_DOWN,
  playDownBars,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { TIER_LADDER, W_SERIES } from '../src/engine/season/calendar'
import { resumeMain } from '../src/engine/rng'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// --- fixtures -----------------------------------------------------------------------------------

function injectEvent(world: WorldState, week: number, tier: TierId): SeasonEvent {
  const e: SeasonEvent = {
    id: `pd-${week}-${tier}`,
    week,
    tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

/** An ADULT professional – past junior eligibility, so the Accelerator (step 1) is not asked of her
 *  and this file measures step 2 alone. She holds a real professional book, so every acceptance cut
 *  takes her and the ONLY thing that can refuse her is the Play Down rule. */
function proWorld(seed: string, age = 21): WorldState {
  const world = createWorld(seed)
  const rng = resumeMain(world.rngMain)
  while (kidAgeYears(world.week, world.profile.birthMonth) < age) tickWeek(world, rng)
  world.condition = 100
  world.fundsCents = 500_000_00
  world.season = []
  world.results.push({ playerId: KID_ID, week: world.week, points: 900, tier: 'w100' })
  world.onRampCleared = { itf: true, wta: true }
  recomputeKidRank(world)
  return world
}

/** Put her AT a world rank. `kidRankWta` is the cache every W gate reads (`rankIn`), and writing it
 *  is how a fixture says "she is #N this week" without having to manufacture a field that produces
 *  it – the same thing `recomputeKidRank` does, from the other end. */
function atRank(world: WorldState, rank: number): void {
  world.kidRankWta = rank
}

const W_ABOVE_LOW: readonly TierId[] = W_SERIES.filter((t) => !PLAY_DOWN.lowW.includes(t))
const NOT_W: readonly TierId[] = TIER_LADDER.filter((t) => !W_SERIES.includes(t))

// =================================================================================================
// 1. THE PROPERTY THE OWNER NAMED – both directions, one test, nothing persisted
// =================================================================================================

describe('it is a rank READ, so it reverses itself', () => {
  it('⚠⚠ CROSS THE LINE AND LOSE THE RUNG; FALL BACK AND GET IT BACK', () => {
    const world = proWorld('pd-both-ways')

    // (a) OUTSIDE both cuts: the whole W series is hers. #300 clears every W acceptance cut too
    //     (the tightest is W100's 350), so anything that shuts below is this rule and not the list.
    atRank(world, 300)
    expect(W_SERIES.filter((t) => tierFloorOpen(world, t)), 'nothing is barred at #300').toEqual([...W_SERIES])
    const before = JSON.stringify(world)

    // (b) INSIDE #150: the bottom two go, and only those two.
    atRank(world, 120)
    expect(W_SERIES.filter((t) => tierFloorOpen(world, t))).toEqual([...W_ABOVE_LOW])

    // (c) INSIDE #50: every W event goes.
    atRank(world, 40)
    expect(W_SERIES.filter((t) => tierFloorOpen(world, t)), 'the top 50 play no W events').toEqual([])

    // (d) ...AND BACK OUT. This is the half a latch would fail.
    atRank(world, 300)
    expect(W_SERIES.filter((t) => tierFloorOpen(world, t)), 'it opened back up on its own').toEqual([...W_SERIES])

    // (e) NOTHING PERSISTED, asserted rather than promised: the whole world serialises identically
    //     to how it did before the round trip. A latch, a flag, a spent counter or a remembered week
    //     would all show up here as a byte difference.
    expect(JSON.stringify(world)).toBe(before)
  })

  it('a girl with no professional ranking cannot be barred by one', () => {
    // "Unranked is not a rank" – the sentinel would otherwise read a missing cache as a number, and
    // `tableSize(world,'wta')` is a perfectly good-looking integer.
    const world = createWorld('pd-unranked')
    world.kidRankWta = 1
    expect(kidAgeYears(world.week, world.profile.birthMonth)).toBeLessThan(99)
    for (const t of W_SERIES) expect(playDownBars(world, t), t).toBe(false)
  })
})

// =================================================================================================
// 2. THE TWO LIMBS ARE TWO LIMBS
// =================================================================================================

describe('the two cuts are two rules', () => {
  it('#150 takes the bottom two rungs and nothing above them', () => {
    const world = proWorld('pd-limb-150')
    atRank(world, PLAY_DOWN.fromLowW)
    for (const t of PLAY_DOWN.lowW) expect(playDownBars(world, t), t).toBe(true)
    for (const t of W_ABOVE_LOW) expect(playDownBars(world, t), t).toBe(false)
    // ...and one place outside it, nothing is barred at all.
    atRank(world, PLAY_DOWN.fromLowW + 1)
    for (const t of W_SERIES) expect(playDownBars(world, t), t).toBe(false)
  })

  it('#50 takes every W event, and one place outside it takes only the bottom two', () => {
    const world = proWorld('pd-limb-50')
    atRank(world, PLAY_DOWN.fromAllW)
    for (const t of W_SERIES) expect(playDownBars(world, t), t).toBe(true)
    atRank(world, PLAY_DOWN.fromAllW + 1)
    expect(W_SERIES.filter((t) => playDownBars(world, t))).toEqual([...PLAY_DOWN.lowW])
  })
})

// =================================================================================================
// 3. SCOPE – the W SERIES, not the W table
// =================================================================================================

describe('it is the ITF World Tennis Tour\'s rule, about the ITF World Tennis Tour\'s events', () => {
  it('⚠ a WTA 125 and the majors are never barred – she is top-50 BECAUSE of them', () => {
    const world = proWorld('pd-scope')
    atRank(world, 1)
    for (const t of ['wta125', 'wta250', 'wta500', 'wta1000', 'slam'] as const) {
      expect(playDownBars(world, t), t).toBe(false)
    }
  })

  it('the junior and domestic ladders are not its business either', () => {
    const world = proWorld('pd-scope-j')
    atRank(world, 1)
    for (const t of NOT_W) expect(playDownBars(world, t), t).toBe(false)
  })
})

// =================================================================================================
// 4. R10-5 – one rule, two surfaces, and the refusal names what is hers instead
// =================================================================================================

describe('the calendar and the turnstile agree', () => {
  it('a rung this rule shuts is shut at the door too, and the copy says why', () => {
    const world = proWorld('pd-r105')
    atRank(world, 30)
    const ev = injectEvent(world, world.week + 3, 'w15')
    expect(tierFloorOpen(world, 'w15'), 'the calendar says shut').toBe(false)
    const gate = entryStatus(world, ev)
    expect(gate.level, 'and so does the turnstile').toBe('blocked')
    expect(gate.detail ?? '', 'it names the cut and her place').toMatch(/top 50 – she is #30/)
    expect(gate.detail ?? '', 'and promises tennis, which every refusal here has to').toMatch(/bigger draws/i)
  })

  it('⚠ THE SWEEP: no W rung, at any rank across both cuts, is open on one surface and shut on the other', () => {
    const world = proWorld('pd-sweep')
    for (const rank of [1, 50, 51, 150, 151, 400]) {
      atRank(world, rank)
      for (const tier of W_SERIES) {
        const ev = injectEvent(world, world.week + 3, tier)
        const calendar = tierFloorOpen(world, tier)
        // One-way, as in tests/junior-access.test.ts: the turnstile also carries availability, which
        // is not this file's subject. What must never happen is the calendar shutting a rung the door
        // then lets her through.
        if (!calendar) expect(entryStatus(world, ev).level, `#${rank} / ${tier}`).toBe('blocked')
      }
    }
  })
})

// =================================================================================================
// 5. THE MUTATION CHECK – the cuts have to be able to bite
// =================================================================================================

describe('the cuts are load-bearing', () => {
  it('⚠ zeroing them re-opens every rung, and restoring them shuts it again', () => {
    const world = proWorld('pd-mutate')
    atRank(world, 10)
    expect(tierFloorOpen(world, 'w15'), 'the world number ten plays no W15s').toBe(false)
    const cuts = { all: PLAY_DOWN.fromAllW, low: PLAY_DOWN.fromLowW }
    try {
      PLAY_DOWN.fromAllW = 0
      PLAY_DOWN.fromLowW = 0
      expect(tierFloorOpen(world, 'w15'), '0 is a meaningful OFF: nobody is barred').toBe(true)
    } finally {
      PLAY_DOWN.fromAllW = cuts.all
      PLAY_DOWN.fromLowW = cuts.low
    }
    expect(tierFloorOpen(world, 'w15'), 'and the restore puts the rule back').toBe(false)
  })
})
