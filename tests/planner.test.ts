import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  advanceWeeks,
  accrueCondition,
  availabilityStatus,
  entryStatus,
  medicalBlock,
  bookVacation,
  cancelVacation,
  bookPractice,
  cancelPractice,
  practiceCaution,
  consecutivePracticeWeeks,
  injuryTau,
  toSnapshot,
  skipTournament,
  closeTournament,
  SAVE_SCHEMA_VERSION,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import {
  ECONOMY,
  recommendVacationPackage,
  vacationPackage,
  vacationPriceCents,
  practiceFeeCents,
} from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import type { FamilyBackground, PlayerProfile } from '../src/shared/protocol'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// ---------------------------------------------------------------------------
// Season planner (docs/specs/season-planner.md) — vacations + practice matches.
// Schema v13. ALL new randomness lives on the purpose-scoped sub-streams
// `seed:vacation:week:packageId` (price quotes) and `seed:practice:week` (court
// fee) / `seed:practicematch:week` (the friendly itself); player bookings are
// PURE STATE. The MAIN weekly draw stream must stay byte-identical to the frozen
// B1/C1 capture (see REF below) – P1 below re-proves it with a booking-heavy career.
// ---------------------------------------------------------------------------

function fnv1a(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
function hashOf(draws: number[]): string {
  return fnv1a(draws.map((d) => d.toString()).join(','))
}
// ⚠ RE-PINNED, FOR THE LAST TIME A CALENDAR CHANGE CAN DO IT: 51642 -> 41550 draws (hash
// cae178fc -> e6b0c709) by the AI sub-stream refactor. The canonical AI tournaments left the MAIN
// weekly stream for their own event-scoped `seed:aitour:<event.id>` stream, so the calendar's size
// is no longer part of the weekly draw count – the flaw that forced the earlier 45239 -> 51642
// move. P1's actual claim – that PLANNER BOOKINGS never perturb that stream – is unchanged and
// still proven below: both tests book something every single week and still reproduce the capture
// exactly.
//
// ⚠ kidRank RE-PINNED 140 -> 141 by the rival-life slice, deliberately. P1's claim is about the
// PLAYER's bookings, and that claim is untouched: count and hash still reproduce byte-for-byte
// under a career that books something every week. What moved is the AI world – rivals now tire
// from their own schedule and read the surface through a play style – so one more junior finishes
// the year in the points. Zero RNG draws were added; only outcomes changed.
// Full reasoning at the REF declaration in tests/condition.test.ts.
// 141 -> 140 at wave-3 integration: the surface x style table changes which of her matches she wins, so a different junior ends the year holding counting points. The STREAM is untouched (count/hash identical) - only the ranking derived from it moved.
//
// ⚠ kidRank RE-PINNED 140 -> 133 by wave B "first-round loss pays ZERO", deliberately. P1's claim
// is about the PLAYER's bookings and is untouched: a career that books something every single week
// still reproduces count 41550 / hash e6b0c709 byte-for-byte. What moved is the AI table – a
// first-round exit now banks nothing (`awardAiPoints` writes only when `points > 0`), so seven
// fewer juniors end the year with counting points and the point-less kid sits inside a bigger
// 0-point tie. Full reasoning at the REF declaration in tests/condition.test.ts.
const REF = { count: 41550, hash: 'e6b0c709', kidRank: 133 }

function injectEvent(
  world: WorldState,
  partial: { week: number; tier: TierId; id?: string; deadlineWeek?: number },
): SeasonEvent {
  const e: SeasonEvent = {
    id: partial.id ?? `pl-${partial.week}-${partial.tier}`,
    week: partial.week,
    tier: partial.tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: partial.deadlineWeek ?? partial.week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

function giveKidPoints(world: WorldState, points: number): void {
  world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'national' })
}

function bgProfile(background: FamilyBackground): PlayerProfile {
  return {
    kidName: 'Vera',
    kidLastName: 'Martin',
    gender: 'girl',
    country: 'US',
    background,
    coachSetup: 'parent',
    playStyle: 'all-court',
    birthMonth: 6,
  }
}

/** A week with no scheduled event, no blackout, safely in the future. */
function freeWeek(world: WorldState): number {
  for (let w = world.week + 1; w < world.week + 40; w++) {
    if (world.season.some((e) => e.week === w)) continue
    const offset = w % 52
    if (offset >= 49 || (offset >= 24 && offset <= 25)) continue
    return w
  }
  throw new Error('no free week')
}

// ---------------------------------------------------------------------------
// P1 — THE INVARIANT (blocks merge): bookings are pure state, quotes/friendlies
// live on private sub-streams, so the MAIN per-week draw sequence is untouched.
// ---------------------------------------------------------------------------
describe('P1 — main-stream RNG invariance with a planner-heavy career', () => {
  function record(mutate?: (w: WorldState, week: number) => void): { draws: number[]; world: WorldState } {
    const world = createWorld('bench-working-0')
    const base = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = base()
      draws.push(v)
      return v
    }
    for (let i = 0; i < 52; i++) {
      if (mutate) mutate(world, world.week)
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    return { draws, world }
  }

  it('booking a practice EVERY week never perturbs the main stream', () => {
    const { draws, world } = record((w) => {
      const next = w.week + 1
      w.fundsCents = 9_999_999_00
      try {
        bookPractice(w, next, false)
      } catch {
        /* blackout / conflict weeks are simply not bookable */
      }
    })
    expect(draws.length).toBe(REF.count)
    expect(hashOf(draws)).toBe(REF.hash)
    expect(world.kidRank).toBe(REF.kidRank)
    // ...and she really did play friendlies (the branch was exercised)
    expect(world.events.some((e) => e.friendly === true)).toBe(true)
  })

  it('booking vacations (incl. the buffed resort) never perturbs the main stream', () => {
    const { draws, world } = record((w) => {
      const next = w.week + 1
      w.fundsCents = 9_999_999_00
      try {
        bookVacation(w, next, next % 3 === 0 ? 'resort' : 'staycation')
      } catch {
        /* not bookable this week */
      }
    })
    expect(draws.length).toBe(REF.count)
    expect(hashOf(draws)).toBe(REF.hash)
    expect(world.kidRank).toBe(REF.kidRank)
    expect(world.events.some((e) => e.text.startsWith('Family vacation'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// P2 — schema v13 + migration.
// ---------------------------------------------------------------------------
describe('P2 — schema v13', () => {
  it('is at version 13 and a fresh world carries empty planner state', () => {
    // The planner landed AT v13; later slices keep bumping the schema (R10-9's season history is
    // v14), so this asserts "v13 or later" – the planner state below is what the case is about.
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThanOrEqual(13)
    const w = createWorld('p2')
    expect(w.vacations).toEqual([])
    expect(w.practices).toEqual([])
    expect(w.recoveryBuff).toBeNull()
  })

  it('migrates a v12 save (append-only, idempotent)', () => {
    const v12 = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v12.json', import.meta.url), 'utf8'),
    ) as Record<string, unknown>
    const migrated = migrateSave(structuredClone(v12))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.vacations).toEqual([])
    expect(migrated.practices).toEqual([])
    expect(migrated.recoveryBuff).toBeNull()
    // everything else untouched
    expect(migrated.condition).toBe(v12.condition)
    expect(migrated.week).toBe(v12.week)
    // idempotent
    expect(migrateSave(structuredClone(migrated))).toEqual(migrated)
  })

  it('keeps existing v13 planner state on re-migration (never resets a booking)', () => {
    const v13 = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v13.json', import.meta.url), 'utf8'),
    ) as Record<string, unknown>
    const migrated = migrateSave(structuredClone(v13))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.vacations.length).toBeGreaterThan(0)
    expect(migrated.practices.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// P3 — vacation catalogue + deterministic corridor pricing.
// ---------------------------------------------------------------------------
describe('P3 — vacation pricing (middle-anchored band × wealth corridor)', () => {
  it('has the owner-approved six packages with the spec gains and buffs', () => {
    const ids = ECONOMY.vacation.packages.map((p) => p.id)
    expect(ids).toEqual(['staycation', 'grandma', 'camping', 'seaside', 'resort', 'elite'])
    expect(ECONOMY.vacation.packages.map((p) => p.conditionGain)).toEqual([12, 14, 16, 20, 25, 30])
    expect(vacationPackage('resort')!.buffFactor).toBe(0.9)
    expect(vacationPackage('elite')!.buffFactor).toBe(0.85)
    expect(vacationPackage('staycation')!.buffFactor).toBe(1)
    expect(ECONOMY.vacation.buffWeeks).toBe(4)
    // the staycation is free; the ladder is strictly ascending in price
    expect(vacationPackage('staycation')!.priceCents).toEqual([0, 0])
  })

  it('quotes deterministically off seed:vacation:week:packageId, inside band × corridor', () => {
    const quote = (bg: FamilyBackground) => vacationPriceCents('quote-seed', 7, 'seaside', bg)
    expect(quote('middle')).toBe(quote('middle')) // deterministic
    const [lo, hi] = vacationPackage('seaside')!.priceCents
    for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
      const [cLo, cHi] = ECONOMY.wealthCorridor[bg]
      expect(quote(bg)).toBeGreaterThanOrEqual(Math.floor(lo * cLo))
      expect(quote(bg)).toBeLessThanOrEqual(Math.ceil(hi * cHi))
    }
    // same roll, disjoint corridors -> working < middle < wealthy for the SAME offer
    expect(quote('working')).toBeLessThan(quote('middle'))
    expect(quote('middle')).toBeLessThan(quote('wealthy'))
    // the quote is week- and package-scoped
    expect(vacationPriceCents('quote-seed', 8, 'seaside', 'middle')).not.toBe(quote('middle'))
    expect(vacationPriceCents('quote-seed', 7, 'resort', 'middle')).not.toBe(quote('middle'))
    // free package stays free in every corridor
    expect(vacationPriceCents('quote-seed', 7, 'staycation', 'wealthy')).toBe(0)
  })

  it('practice court fee is $30-80 × corridor off seed:practice:week; the coach adds 50% of a session', () => {
    const fee = practiceFeeCents('court-seed', 4, 'middle', false)
    expect(fee).toBe(practiceFeeCents('court-seed', 4, 'middle', false))
    const [lo, hi] = ECONOMY.practice.courtFeeCents
    expect(fee).toBeGreaterThanOrEqual(Math.floor(lo * ECONOMY.wealthCorridor.middle[0]))
    expect(fee).toBeLessThanOrEqual(Math.ceil(hi * ECONOMY.wealthCorridor.middle[1]))
    expect(practiceFeeCents('court-seed', 4, 'working', false)).toBeLessThan(fee)
    // adding the coach never moves the court part, and costs ~50% of a coaching session
    const withCoach = practiceFeeCents('court-seed', 4, 'middle', true)
    const extra = withCoach - fee
    const [clo, chi] = ECONOMY.practice.coachSessionCents
    const share = ECONOMY.practice.coachShare
    expect(extra).toBeGreaterThanOrEqual(Math.floor(clo * share * ECONOMY.wealthCorridor.middle[0]))
    expect(extra).toBeLessThanOrEqual(Math.ceil(chi * share * ECONOMY.wealthCorridor.middle[1]))
  })
})

// ---------------------------------------------------------------------------
// P4 — booking / cancelling (money + validation), mirroring entry withdrawal.
// ---------------------------------------------------------------------------
describe('P4 — booking and cancelling', () => {
  it('books a vacation: charges the quote, records it, refunds in full before the week starts', () => {
    const w = createWorld('p4-vac', bgProfile('middle'))
    const week = freeWeek(w)
    const price = vacationPriceCents(w.seed, week, 'seaside', 'middle')
    const before = w.fundsCents
    bookVacation(w, week, 'seaside')
    expect(w.fundsCents).toBe(before - price)
    expect(w.vacations).toEqual([{ week, packageId: 'seaside', paidCents: price }])
    expect(w.events.some((e) => e.category === 'vacation' && e.amountCents === -price)).toBe(true)

    cancelVacation(w, week)
    expect(w.fundsCents).toBe(before) // FULL refund (mirror of entry withdrawal)
    expect(w.vacations).toEqual([])
    expect(w.events.some((e) => e.category === 'vacation' && e.amountCents === price)).toBe(true)
  })

  it('books a practice with and without the coach and refunds on cancel', () => {
    const w = createWorld('p4-pra', bgProfile('middle'))
    const week = freeWeek(w)
    const fee = practiceFeeCents(w.seed, week, 'middle', true)
    const before = w.fundsCents
    bookPractice(w, week, true)
    expect(w.fundsCents).toBe(before - fee)
    expect(w.practices).toEqual([{ week, paidCents: fee, withCoach: true }])
    cancelPractice(w, week)
    expect(w.fundsCents).toBe(before)
    expect(w.practices).toEqual([])
  })

  it('refuses double bookings, past weeks, blackout weeks, entered weeks and broke families', () => {
    const w = createWorld('p4-guard', bgProfile('middle'))
    const week = freeWeek(w)
    bookVacation(w, week, 'grandma')
    expect(() => bookVacation(w, week, 'camping')).toThrow(/already/i)
    expect(() => bookPractice(w, week, false)).toThrow(/vacation/i)
    expect(() => bookVacation(w, w.week, 'grandma')).toThrow(/future/i)
    expect(() => cancelVacation(w, w.week)).toThrow(/no vacation/i)
    expect(() => bookVacation(w, 24, 'grandma')).toThrow(/exam/i) // school-exam block
    expect(() => bookPractice(w, 50, false)).toThrow(/off-season/i) // off-season = family time
    // an ENTERED tournament week is not plannable
    const ev = injectEvent(w, { week: w.week + 4, tier: 'local' })
    enterEvent(w, ev.id)
    expect(() => bookPractice(w, ev.week, false)).toThrow(/entered/i)
    expect(() => bookVacation(w, ev.week, 'grandma')).toThrow(/entered/i)
    // no funds
    const poor = createWorld('p4-poor', bgProfile('working'))
    poor.fundsCents = 10
    expect(() => bookVacation(poor, freeWeek(poor), 'elite')).toThrow(/funds/i)
  })

  it('a vacation week is a hard availability block (level blocked / unavailable) naming the package', () => {
    const w = createWorld('p4-block', bgProfile('middle'))
    const week = w.week + 5
    const ev = injectEvent(w, { week, tier: 'local' })
    bookVacation(w, week, 'seaside')
    const status = availabilityStatus(w, ev)
    expect(status.level).toBe('blocked')
    expect(status.reason).toBe('unavailable')
    expect(status.detail).toBe('Family vacation – Seaside family hotel')
    expect(() => enterEvent(w, ev.id)).toThrow('Family vacation – Seaside family hotel')
    const up = toSnapshot(w).upcoming.find((e) => e.id === ev.id)!
    expect(up.eligible).toBe(false)
    expect(up.ineligibleReason).toBe('unavailable')
  })
})

// ---------------------------------------------------------------------------
// P5 — the vacation week in tick step 1c (gain, buff, blackout guarantee).
// ---------------------------------------------------------------------------
describe('P5 — vacation week mechanics', () => {
  it('applies the package gain on top of a FREE week (base + slider), clamped at 100', () => {
    const w = createWorld('p5-gain', bgProfile('middle'))
    w.physioActive = false
    w.plan = { train: 75, rest: 25 } // free-week ladder: base 1 + slider 1 = +2
    w.condition = 50
    const week = freeWeek(w)
    bookVacation(w, week, 'camping') // +16
    const rng = rngFromSeed(w.seed)
    while (w.week < week) tickWeek(w, rng)
    // 50 + 2/wk for the weeks in between + 16 on the vacation week itself
    const plainWeeks = week - 0 // ticks taken
    expect(w.condition).toBe(Math.min(100, 50 + 2 * plainWeeks + 16))
    expect(w.events.some((e) => e.text.includes('Family vacation – Camping road-trip'))).toBe(true)
  })

  it('the resort/elite packages set recoveryBuff and cut injury tau for 4 weeks, then expire', () => {
    const w = createWorld('p5-buff', bgProfile('wealthy'))
    const week = freeWeek(w)
    bookVacation(w, week, 'elite')
    const rng = rngFromSeed(w.seed)
    while (w.week < week) tickWeek(w, rng)
    expect(w.recoveryBuff).toEqual({ untilWeek: week + ECONOMY.vacation.buffWeeks, factor: 0.85 })
    // tau is cut by exactly the factor (post-draw multiply)
    w.condition = 60
    const buffed = injuryTau(w)
    const unbuffed = (() => {
      const buff = w.recoveryBuff
      w.recoveryBuff = null
      const t = injuryTau(w)
      w.recoveryBuff = buff
      return t
    })()
    expect(buffed).toBeCloseTo(unbuffed * 0.85, 10)
    // expires after 4 weeks
    for (let i = 0; i < ECONOMY.vacation.buffWeeks + 1; i++) tickWeek(w, rng)
    expect(w.recoveryBuff).toBeNull()
  })

  it('back-to-back vacation weeks are allowed (a deep reset at 2× price)', () => {
    const w = createWorld('p5-b2b', bgProfile('wealthy'))
    const a = freeWeek(w)
    const b = a + 1
    expect(() => {
      bookVacation(w, a, 'seaside')
      bookVacation(w, b, 'seaside')
    }).not.toThrow()
    expect(w.vacations).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// P6 — practice matches: drain rule, 0 points, watchable record, week type.
// ---------------------------------------------------------------------------
describe('P6 — practice match mechanics', () => {
  function runToPractice(seed: string, plan = { train: 75, rest: 25 }, condition = 80) {
    const w = createWorld(seed, bgProfile('middle'))
    w.physioActive = false
    w.plan = plan
    const week = freeWeek(w)
    bookPractice(w, week, false)
    const rng = rngFromSeed(w.seed)
    while (w.week < week - 1) tickWeek(w, rng)
    w.condition = condition
    tickWeek(w, rng)
    return { w, week }
  }

  it('plays a friendly, drains max(1, local drain − 1), awards ZERO ranking points', () => {
    const { w } = runToPractice('p6-drain')
    const ev = w.events.find((e) => e.friendly === true)!
    expect(ev.type).toBe('match')
    expect(ev.match).toBeTruthy()
    expect(ev.text).toMatch(/Practice match/)
    // a replayable record: both skill snapshots + a seed (MatchReplay re-simulates from it)
    expect(ev.match!.seed).toBeTruthy()
    expect(ev.match!.a.id).toBe(KID_ID)
    expect(ev.match!.score).toBeTruthy()
    // zero ranking points: the kid's results ledger is untouched by a friendly
    expect(w.results.filter((r) => r.playerId === KID_ID)).toEqual([])
    // condition: entry 80 + practice-week recovery (base 1, slider FORFEITED) − drain(1..3)
    // ⚠ RE-PINNED 26.07 by the MATCH BASE RAISE: this re-derivation HARDCODED the old base (`? 2 : 1`)
    // and so would have silently disagreed with the engine on any friendly that was not straight
    // sets — it only kept passing because this seed produces a straight-sets one. Read off the live
    // knobs instead, so the test measures the rule rather than a snapshot of it. The drain ceiling
    // moves 2 → 3 with the base: max(1, local − 1) now grades (1 straight / 2 a 3-setter / 3 an
    // epic) where it used to clamp everything to 1. The canonical table is in
    // tests/fatigueReference.test.ts + docs/specs/fatigue-reference.md.
    const f = ECONOMY.condition.matchFatigue
    const sets = ev.match!.score!.split(' ')
    const tiebreaks = sets.filter((s) => s === '7-6' || s === '6-7').length
    const local = (sets.length >= 3 || tiebreaks >= 1 ? f.hardMatch : f.straightSets) + (tiebreaks > 2 ? f.extraTiebreaks : 0)
    const drain = Math.max(1, local - 1)
    expect(w.condition).toBe(80 + ECONOMY.condition.recoveryBase - drain)
    expect(drain).toBeGreaterThanOrEqual(1)
    expect(drain).toBeLessThanOrEqual(3)
  })

  it('a PRACTICE week keeps the base recovery but FORFEITS the slider bonus (owner ladder)', () => {
    // 60/40 earns +2 on a free week; on a practice week it earns the base only.
    const free = createWorld('p6-free', bgProfile('middle'))
    free.physioActive = false
    free.plan = { train: 60, rest: 40 }
    free.condition = 50
    accrueCondition(free, false)
    expect(free.condition).toBe(50 + ECONOMY.condition.recoveryBase + 2)

    const prac = createWorld('p6-prac', bgProfile('middle'))
    prac.physioActive = false
    prac.plan = { train: 60, rest: 40 }
    prac.condition = 50
    prac.practices.push({ week: prac.week, paidCents: 0, withCoach: false })
    accrueCondition(prac, false)
    expect(prac.condition).toBe(50 + ECONOMY.condition.recoveryBase) // slider bonus forfeited
  })

  it('an injury cancels + refunds every practice inside the layoff', () => {
    // Force the onset deterministically by patching the LIVE tau knobs (bench pattern:
    // patch, run, always restore) – the roll is unconditional, only tau moves.
    const av = ECONOMY.availability as unknown as { injuryBaseChance: number; injuryChanceCap: number }
    const savedBase = av.injuryBaseChance
    const savedCap = av.injuryChanceCap
    try {
      av.injuryBaseChance = 1
      av.injuryChanceCap = 1
      const w = createWorld('p6-inj', bgProfile('middle'))
      const week = w.week + 3
      bookPractice(w, week, false)
      const paid = w.practices[0].paidCents
      expect(paid).toBeGreaterThan(0)
      const fundsBefore = w.fundsCents
      tickWeek(w, rngFromSeed(w.seed)) // week 1: injury onset (tau = 1), layoff >= 1 week
      expect(w.injury).not.toBeNull()
      // she is back at world.week + weeksRemaining, so the practice week is swallowed iff
      // weeksRemaining > (practice week − current week)
      if (w.injury!.weeksRemaining > week - w.week) {
        // the layoff swallows the practice week -> booking cancelled, rental refunded
        expect(w.practices).toEqual([])
        expect(w.fundsCents).toBeGreaterThanOrEqual(fundsBefore + paid)
        expect(w.events.some((e) => e.category === 'practice' && e.amountCents === paid)).toBe(true)
      }
      // ...and while she is out, nothing new is bookable
      expect(() => bookPractice(w, w.week + 1, false)).toThrow(/injured/i)
    } finally {
      av.injuryBaseChance = savedBase
      av.injuryChanceCap = savedCap
    }
  })
})

// ---------------------------------------------------------------------------
// P7 — the practice guardrail (caution, never a hard block) — pure predicate.
// ---------------------------------------------------------------------------
describe('P7 — practice guardrail predicate', () => {
  it('flags a tired kid below the caution floor', () => {
    const tired = practiceCaution({ condition: 40, practiceWeeks: [], week: 10 })
    expect(tired.level).toBe('caution')
    expect(tired.reasons).toContain('tired')
    expect(tired.detail).toMatch(/worn out/i)
    const fresh = practiceCaution({ condition: 90, practiceWeeks: [], week: 10 })
    expect(fresh.level).toBe('ok')
    expect(fresh.reasons).toEqual([])
  })

  // Wave-2 tuning (fatigue bench 26.07): the 3-in-a-row arm used to fire on a perfectly fresh
  // kid – careful pushed through 8-11 cautions/season at condition 92, which trains the player to
  // click through the REAL ones. The streak arm is now gated on actual strain (below
  // cautionStreakCondition) OR on a longer run (cautionStreakAlways).
  it('stays QUIET on a 3-week streak while she is fresh (the warning-noise fix)', () => {
    const p = ECONOMY.practice
    expect(p.cautionStreakCondition).toBeLessThan(ECONOMY.condition.max)
    const fresh = practiceCaution({ condition: 92, practiceWeeks: [8, 9], week: 10 })
    expect(fresh.level).toBe('ok')
    expect(fresh.reasons).toEqual([])
    // exactly AT the strain gate is still quiet (the gate is "below")
    expect(practiceCaution({ condition: p.cautionStreakCondition, practiceWeeks: [8, 9], week: 10 }).level).toBe('ok')
  })

  it('flags the 3rd consecutive practice week once she is actually strained', () => {
    const third = practiceCaution({ condition: ECONOMY.practice.cautionStreakCondition - 1, practiceWeeks: [8, 9], week: 10 })
    expect(third.level).toBe('caution')
    expect(third.reasons).toContain('streak')
    expect(third.streakWeeks).toBe(3)
    expect(third.detail).toMatch(/3 match weeks in a row/)
    // a gap resets the streak
    expect(practiceCaution({ condition: 70, practiceWeeks: [7, 9], week: 10 }).level).toBe('ok')
    expect(consecutivePracticeWeeks([8, 9], 10)).toBe(2)
    expect(consecutivePracticeWeeks([7, 9], 10)).toBe(1)
    expect(consecutivePracticeWeeks([], 10)).toBe(0)
  })

  it('flags a 4-in-a-row run at ANY condition (a long streak is strain by itself)', () => {
    const long = practiceCaution({ condition: 100, practiceWeeks: [7, 8, 9], week: 10 })
    expect(long.level).toBe('caution')
    expect(long.reasons).toContain('streak')
    expect(long.streakWeeks).toBe(ECONOMY.practice.cautionStreakAlways)
    expect(long.detail).toMatch(/4 match weeks in a row/)
  })

  it('never BLOCKS the booking – the parent may push (owner philosophy)', () => {
    const w = createWorld('p7-push', bgProfile('middle'))
    // 20 is CHOSEN, not arbitrary: it is the owner's own "он вполне может сказать «предупреждаю»"
    // example, i.e. inside the warning band and ABOVE the medical floor – so what this test pins is
    // the GUARDRAIL's philosophy, not the absence of the doctor's veto (P7b owns that boundary).
    // Stated as an assertion so the day the floor is raised past it, this test says why it broke.
    w.condition = 20
    expect(w.condition).toBeGreaterThanOrEqual(ECONOMY.availability.medicalFloor)
    const week = freeWeek(w)
    expect(() => bookPractice(w, week, false)).not.toThrow()
    expect(w.practices).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// P7b — THE DOCTOR'S VETO REACHES THE FRIENDLY (owner 26.07: "the doctor who will
// not let her travel probably should not clear her for a friendly at condition 0").
//
// WHY THIS EXISTS, measured: the match-base raise (1 -> 2) made the friendly's
// `max(1, localDrain − 1)` subtraction real, so the "friendly treadmill" turned from
// a flat plateau into a −0.6/week slide, and the veto gated TOURNAMENTS only. Nothing
// stopped a practise-every-week policy from sitting at condition 0 for a third of a
// career (fatigue bench: worst cell 1.9% -> 32.7% of weeks at 0 across the base raise).
// The fix is candidate (b) from the doctor's-veto test: gate the BOOKING on the same
// floor, through the same predicate.
//
// TWO properties are non-negotiable here and both are asserted below:
//   1. ONE RULE, ONE OWNER – the friendly and the tournament read `medicalBlock`, so
//      they refuse for the same reason in the same words. No second threshold compare.
//   2. NO DEAD END – a refused practice week is still the parent's to plan (vacation,
//      training/rest, or nothing at all). A week where nothing is possible is the worst
//      item of the owner's last playtest (R10-3) and must never come back.
// It is a HARD block with NO warning band: fatigue for tournaments is a soft warned
// choice, but below the floor the doctor "точно не пустит" (owner, verbatim).
// ---------------------------------------------------------------------------
describe("P7b — the doctor's veto on a friendly", () => {
  const FLOOR = ECONOMY.availability.medicalFloor

  it('refuses the booking BELOW the floor, clears it AT the floor and above', () => {
    const below = createWorld('p7b-below', bgProfile('middle'))
    below.condition = FLOOR - 1
    const fundsBefore = below.fundsCents
    expect(() => bookPractice(below, freeWeek(below), false)).toThrow(/not cleared to play/i)
    expect(below.practices).toEqual([]) // nothing booked…
    expect(below.fundsCents).toBe(fundsBefore) // …and nothing charged for the refusal
    // the degenerate case the gate exists for
    const wrecked = createWorld('p7b-zero', bgProfile('middle'))
    wrecked.condition = ECONOMY.condition.min
    expect(() => bookPractice(wrecked, freeWeek(wrecked), false)).toThrow(/not cleared to play/i)
    // AT the floor she is cleared – the veto is strictly below, exactly like the entry gate
    const at = createWorld('p7b-at', bgProfile('middle'))
    at.condition = FLOOR
    expect(() => bookPractice(at, freeWeek(at), false)).not.toThrow()
    expect(at.practices).toHaveLength(1)
    const above = createWorld('p7b-above', bgProfile('middle'))
    above.condition = FLOOR + 1
    expect(() => bookPractice(above, freeWeek(above), false)).not.toThrow()
    expect(above.practices).toHaveLength(1)
  })

  it('refuses in the SAME WORDS the tournament gate uses – one predicate, three surfaces', () => {
    const w = createWorld('p7b-agree', bgProfile('middle'))
    w.condition = FLOOR - 1
    const ev = injectEvent(w, { week: w.week + 3, tier: 'local' })
    // the tournament surfaces
    const availability = availabilityStatus(w, ev)
    expect(availability.level).toBe('blocked')
    expect(availability.reason).toBe('medical')
    expect(entryStatus(w, ev).detail).toBe(availability.detail)
    expect(toSnapshot(w).upcoming.find((e) => e.id === ev.id)!.ineligibleReason).toBe('medical')
    // the practice surface: the SAME sentence, because both read `medicalBlock`
    let practiceReason = ''
    try {
      bookPractice(w, freeWeek(w), false)
    } catch (e) {
      practiceReason = (e as Error).message
    }
    expect(practiceReason).toBe(availability.detail)
    expect(practiceReason).toBe(medicalBlock(w.condition)!.detail)
    // …and the shared predicate is silent the moment she is cleared, so nothing above the floor
    // can pick up a hard refusal by accident
    expect(medicalBlock(FLOOR)).toBeNull()
    expect(medicalBlock(ECONOMY.condition.max)).toBeNull()
  })

  it('is the SAME KNOB as the tournament veto: floor 0 restores the old booking behaviour', () => {
    const av = ECONOMY.availability as { medicalFloor: number }
    const saved = av.medicalFloor
    try {
      av.medicalFloor = 0
      const w = createWorld('p7b-knob', bgProfile('middle'))
      w.condition = ECONOMY.condition.min
      expect(() => bookPractice(w, freeWeek(w), false)).not.toThrow()
    } finally {
      av.medicalFloor = saved
    }
  })

  it('leaves the refused week FULLY PLANNABLE – vacation, training/rest, or nothing at all', () => {
    const w = createWorld('p7b-plannable', bgProfile('middle'))
    w.condition = ECONOMY.condition.min // the worst case: the week must still be usable
    const week = freeWeek(w)
    expect(() => bookPractice(w, week, false)).toThrow(/not cleared to play/i)
    // 1. a VACATION on the very same week – the answer the sheet points the parent at. REST is
    //    never gated on the floor; gating it is how this fix would have become an R10-3 dead end.
    expect(() => bookVacation(w, week, 'grandma')).not.toThrow()
    expect(w.vacations).toHaveLength(1)
    cancelVacation(w, week) // and it is still cancellable, so nothing is one-way
    expect(w.vacations).toEqual([])
    // 2. plain TRAINING/REST commits and the week RECOVERS her instead of draining her – the whole
    //    point of the gate (a practice week would have paid base only, and drained 1-3 on top).
    w.plan = { train: 60, rest: 40 }
    const before = w.condition
    tickWeek(w, rngFromSeed(w.seed))
    expect(w.condition).toBeGreaterThan(before)
    // 3. and doing NOTHING still advances time (no state can trap the week)
    const at = w.week
    advanceWeeks(w, rngFromSeed(w.seed), 3)
    expect(w.week).toBeGreaterThan(at)
  })

  it('calls OFF a booked friendly whose week arrives below the floor, rental refunded in full', () => {
    // The booking gate reads her condition on BOOKING day and a booking is a week ahead, so the
    // floor is re-read on arrival – the same two-surface shape the tournament veto has (entry gate
    // + play-week check). Injury is switched off via the live tau knobs (bench pattern: patch, run,
    // always restore), because an injury outranks the medical branch and would pre-empt it.
    const av = ECONOMY.availability as unknown as { injuryBaseChance: number; injuryChanceCap: number }
    const savedBase = av.injuryBaseChance
    const savedCap = av.injuryChanceCap
    try {
      av.injuryBaseChance = 0
      av.injuryChanceCap = 0
      const w = createWorld('p7b-arrive', bgProfile('middle'))
      w.physioActive = false
      w.plan = { train: 60, rest: 40 } // free-week slider bonus = +2
      w.season = [] // no tournament anywhere near: the week is the friendly's alone
      w.condition = FLOOR + 20 // booked while the doctor was happy
      const week = w.week + 1
      bookPractice(w, week, false)
      const paid = w.practices[0].paidCents
      expect(paid).toBeGreaterThan(0)
      // …and then a bad week happens in between (a deep run, an injury scare): she arrives wrecked
      w.condition = 3
      tickWeek(w, rngFromSeed(w.seed))
      expect(w.week).toBe(week)
      expect(w.practices).toEqual([]) // the friendly is off
      expect(w.events.some((e) => e.type === 'match' && e.friendly === true)).toBe(false) // never played
      // MONEY: full refund, unlike the tournament withdrawal's forfeited entry fee. There is no
      // closed entry list holding a friendly's court rental, cancelPractice already refunds it in
      // full at any point before the week, and the practice sub-system's own precedent for "her body
      // called it off" (the injury branch) is a refund too. Asserted on the 'practice' CATEGORY,
      // which nets to zero – total funds also carry the week's ordinary income and bills.
      expect(w.events.some((e) => e.category === 'practice' && e.amountCents === paid)).toBe(true)
      expect(
        w.events.filter((e) => e.category === 'practice').reduce((s, e) => s + (e.amountCents ?? 0), 0),
      ).toBe(0)
      expect(w.events.some((e) => e.text.includes('not cleared to play'))).toBe(true)
      // CONDITION: the week ends match-free, so it pays the FULL free-week ladder (base 1 accrued by
      // accrueCondition + the slider bonus handed back here), and drains nothing.
      expect(w.condition).toBe(3 + ECONOMY.condition.recoveryBase + 2)
    } finally {
      av.injuryBaseChance = savedBase
      av.injuryChanceCap = savedCap
    }
  })

  it('surfaces the refusal in the planner sheet: disabled WITH the reason, never a throwing button', () => {
    // Source-level (the B7/P9 pattern): the sheet reads the engine's own `medicalBlock` and renders
    // its `detail`, so the sentence the player sees IS the sentence bookPractice would throw – the
    // two surfaces cannot drift into two different explanations of the same doctor.
    const src = readFileSync(new URL('../src/components/PlanWeekSheet.vue', import.meta.url), 'utf8')
    expect(src).toMatch(/medicalBlock/)
    expect(src).toMatch(/medical\.detail/)
    // R12-5b: the layoff gate now stands IN FRONT of the doctor on the same button
    expect(src).toMatch(/:disabled="!!layoff \|\| !!medical/)
    // …and it names what the week CAN still become, so the refusal is never a dead end
    expect(src).toMatch(/Vacation\s*\n?\s*tab/)
    // the guardrail's soft caution is still there for everything above the floor
    expect(src).toMatch(/caution\.level === 'caution'/)
  })
})

// ---------------------------------------------------------------------------
// P8 — advanceWeeks deadline filter: only stop for events she could ENTER.
// ---------------------------------------------------------------------------
describe('P8 — deadline stop respects the point band', () => {
  it('a 0-point kid is never stopped by a regional/national deadline', () => {
    const w = createWorld('p8-fresh')
    const rng = rngFromSeed(w.seed)
    const stop = advanceWeeks(w, rng, 20)
    expect(stop).not.toContain('deadline')
  })

  it('a point-eligible kid IS stopped by the same deadline', () => {
    const w = createWorld('p8-eligible')
    giveKidPoints(w, 200) // national band [150, ∞)
    const nat = injectEvent(w, { week: w.week + 4, tier: 'national', deadlineWeek: w.week + 2 })
    w.season = [nat]
    expect(advanceWeeks(w, rngFromSeed(w.seed), 4)).toContain('deadline')
  })

  it('an OUTGROWN tier never stops the sim either (points past the ceiling)', () => {
    const w = createWorld('p8-outgrown')
    giveKidPoints(w, 400) // past regional's 230 ceiling; national needs no stop here
    const reg = injectEvent(w, { week: w.week + 4, tier: 'regional', deadlineWeek: w.week + 2 })
    w.season = [reg]
    expect(advanceWeeks(w, rngFromSeed(w.seed), 4)).not.toContain('deadline')
  })
})

// ---------------------------------------------------------------------------
// P9 — snapshot + UI wiring (source-level, mirroring the B7 pattern).
// ---------------------------------------------------------------------------
describe('P9 — snapshot + planner UI', () => {
  it('the snapshot carries bookings and the recovery buff', () => {
    const w = createWorld('p9-snap', bgProfile('middle'))
    const week = freeWeek(w)
    bookVacation(w, week, 'grandma')
    bookPractice(w, week + 1, true)
    const snap = toSnapshot(w)
    expect(snap.vacations).toEqual([{ week, packageId: 'grandma', paidCents: w.vacations[0].paidCents }])
    expect(snap.practices).toEqual([{ week: week + 1, paidCents: w.practices[0].paidCents, withCoach: true }])
    expect(snap.recoveryBuff).toBeNull()
  })

  it('SeasonScreen hides OUTGROWN events, keeps locked-ahead ones, and offers "+ Plan week"', () => {
    const src = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
    expect(src).toMatch(/ineligibleReason !== 'outgrown'/)
    expect(src).toContain('Plan week')
    expect(src).toContain('PlanWeekSheet')
    // locked-ahead events stay visible: the lock label is still rendered
    expect(src).toContain('lockLabel')
  })

  it('the planner sheet has both tabs, the guardrail warning and the pre-highlight', () => {
    const src = readFileSync(new URL('../src/components/PlanWeekSheet.vue', import.meta.url), 'utf8')
    expect(src).toContain('Practice')
    expect(src).toContain('Vacation')
    expect(src).toMatch(/practiceCaution/)
    expect(src).toMatch(/recommended/i)
    expect(src).toMatch(/coach/i)
  })

  it('the rescue prompt is an OFFER (never an auto-book)', () => {
    const src = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
    expect(src).toMatch(/rescue/i)
    expect(src).toMatch(/worn out|worn down/i)
  })

  it('the worker + store expose the four planner commands', () => {
    const worker = readFileSync(new URL('../src/worker/sim.worker.ts', import.meta.url), 'utf8')
    const store = readFileSync(new URL('../src/stores/game.ts', import.meta.url), 'utf8')
    for (const cmd of ['bookVacation', 'cancelVacation', 'bookPractice', 'cancelPractice']) {
      expect(worker).toContain(cmd)
      expect(store).toContain(cmd)
    }
  })

  it('Home reads the practice strain (R13-3: folded from the removed chip into the note line)', () => {
    const src = readFileSync(new URL('../src/components/screens/HomeScreen.vue', import.meta.url), 'utf8')
    expect(src).toMatch(/practiceCaution|cautionCondition/)
  })
})

// ---------------------------------------------------------------------------
// P10 — the vacation OFFER (Wave-2 tuning): a wider band + a pre-highlight that
// slides DOWN the ladder as the deficit shrinks. Before this pass the offer only
// fired below 65 and the pick always needed >= 85, so seaside took 88% of every
// booking in the bench and grandma/camping were unreachable answers.
// ---------------------------------------------------------------------------
describe('P10 — vacation offer band + cheapest-sufficient pre-highlight', () => {
  const RICH = 9_999_999_00

  function pickAt(condition: number, seed = 'p10', week = 12, fundsCents = RICH): string | null {
    return recommendVacationPackage({ seed, week, background: 'wealthy', condition, fundsCents })
  }

  it('the offer band reaches mildly-tired weeks (<= 80), where a cheap package IS the answer', () => {
    expect(ECONOMY.practice.rescueCondition).toBeGreaterThanOrEqual(80)
    // …and the target the pre-highlight aims for stays where the owner put it.
    expect(ECONOMY.practice.rescueTargetCondition).toBe(85)
  })

  it('picks the CHEAPEST package sufficient for her CURRENT condition', () => {
    // gains: staycation +12 · grandma +14 · camping +16 · seaside +20 · resort +25 · elite +30,
    // target 85 -> the ladder slides down as the deficit shrinks.
    expect(pickAt(80)).toBe('staycation') // 80+12 = 92
    expect(pickAt(73)).toBe('staycation') // 73+12 = 85 (exactly sufficient)
    expect(pickAt(72)).toBe('grandma') // 72+12 = 84 short; +14 = 86
    expect(pickAt(70)).toBe('camping') // +14 = 84 short; +16 = 86
    expect(pickAt(66)).toBe('seaside') // +16 = 82 short; +20 = 86
    expect(pickAt(61)).toBe('resort')
    expect(pickAt(56)).toBe('elite')
  })

  it('a nearly-fresh kid gets the FREE staycation (the clamp at 100 counts as sufficient)', () => {
    expect(pickAt(95)).toBe('staycation')
    expect(pickAt(100)).toBe('staycation')
  })

  it('on a deep deficit nothing clears the target, so it falls back to the best she can afford', () => {
    expect(pickAt(20)).toBe('elite') // 20+30 = 50, still short – buy the biggest reset available
  })

  it('respects the wallet: only affordable packages, and null when even the free one is gone', () => {
    const week = 12
    const camping = vacationPriceCents('p10', week, 'camping', 'wealthy')
    // A family that can afford camping but not seaside gets camping even on a deep deficit.
    expect(recommendVacationPackage({ seed: 'p10', week, background: 'wealthy', condition: 30, fundsCents: camping })).toBe(
      'camping',
    )
    // The staycation is free, so it is always reachable – a budget of 0 still returns it.
    expect(recommendVacationPackage({ seed: 'p10', week, background: 'wealthy', condition: 30, fundsCents: 0 })).toBe(
      'staycation',
    )
    // …unless the prudence budget forbids even that (bench guard: negative funds).
    expect(
      recommendVacationPackage({ seed: 'p10', week, background: 'wealthy', condition: 30, fundsCents: 0, budgetCents: -1 }),
    ).toBeNull()
  })

  it('takes an explicit target override (the bench policies aim higher than the prompt)', () => {
    expect(pickAt(78)).toBe('staycation')
    expect(
      recommendVacationPackage({
        seed: 'p10',
        week: 12,
        background: 'wealthy',
        condition: 78,
        fundsCents: RICH,
        targetCondition: 90,
      }),
    ).toBe('staycation') // 78+12 = 90 exactly
    expect(
      recommendVacationPackage({
        seed: 'p10',
        week: 12,
        background: 'wealthy',
        condition: 77,
        fundsCents: RICH,
        targetCondition: 90,
      }),
    ).toBe('grandma') // 77+12 = 89 short
  })

  it('BOTH pre-highlight surfaces call the one shared helper (no third copy of the rule)', () => {
    const sheet = readFileSync(new URL('../src/components/PlanWeekSheet.vue', import.meta.url), 'utf8')
    const season = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
    expect(sheet).toContain('recommendVacationPackage')
    expect(season).toContain('recommendVacationPackage')
    // the old off-season hard-code ("always seaside") is gone – the recommendation slides now
    expect(sheet).not.toMatch(/'seaside'/)
  })
})

// ---------------------------------------------------------------------------
// P10 — the money ledger keeps planner spend visible and nets refunds out.
// ---------------------------------------------------------------------------
describe('P10 — planner money', () => {
  it('vacation + practice spend land in their own finance categories and net out on cancel', () => {
    const w = createWorld('p10', bgProfile('middle'))
    const week = freeWeek(w)
    bookVacation(w, week, 'seaside')
    bookPractice(w, week + 1, false)
    const snap = toSnapshot(w)
    expect(snap.finance.window12w.byCategory.vacation!).toBeLessThan(0)
    expect(snap.finance.window12w.byCategory.practice!).toBeLessThan(0)
    cancelVacation(w, week)
    cancelPractice(w, week + 1)
    const after = toSnapshot(w)
    expect(after.finance.window12w.byCategory.vacation).toBe(0)
    expect(after.finance.window12w.byCategory.practice).toBe(0)
    expect(after.fundsCents).toBe(createWorld('p10', bgProfile('middle')).fundsCents)
  })

  it('the tier entry fee is untouched by the planner (no cross-talk)', () => {
    expect(TIERS.local.entryFeeCents).toBe(40_00)
  })
})
