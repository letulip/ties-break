import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  advanceWeeks,
  accrueCondition,
  availabilityStatus,
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
import { ECONOMY, vacationPackage, vacationPriceCents, practiceFeeCents } from '../src/engine/economy'
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
// ⚠ RE-PINNED by ladder-up Part B: 45239 -> 51642 draws (hash cae178fc) because the J family
// roughly doubled the number of scheduled events, and every one runs an AI tournament on the MAIN
// stream. P1's actual claim – that PLANNER BOOKINGS never perturb that stream – is unchanged and
// still proven below: both tests book something every single week and still reproduce the capture
// exactly. Full reasoning at the REF declaration in tests/condition.test.ts.
const REF = { count: 51642, hash: 'cae178fc', kidRank: 141 }

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
    expect(SAVE_SCHEMA_VERSION).toBe(13)
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
    expect(migrated.schemaVersion).toBe(13)
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
    expect(migrated.schemaVersion).toBe(13)
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
    // condition: entry 80 + practice-week recovery (base 1, slider FORFEITED) − drain(1..2)
    const sets = ev.match!.score!.split(' ')
    const tiebreaks = sets.filter((s) => s === '7-6' || s === '6-7').length
    const local = (sets.length >= 3 || tiebreaks >= 1 ? 2 : 1) + (tiebreaks > 2 ? 1 : 0)
    const drain = Math.max(1, local - 1)
    expect(w.condition).toBe(80 + ECONOMY.condition.recoveryBase - drain)
    expect(drain).toBeGreaterThanOrEqual(1)
    expect(drain).toBeLessThanOrEqual(2)
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

  it('flags the 3rd consecutive practice week', () => {
    const third = practiceCaution({ condition: 95, practiceWeeks: [8, 9], week: 10 })
    expect(third.level).toBe('caution')
    expect(third.reasons).toContain('streak')
    // a gap resets the streak
    expect(practiceCaution({ condition: 95, practiceWeeks: [7, 9], week: 10 }).level).toBe('ok')
    expect(consecutivePracticeWeeks([8, 9], 10)).toBe(2)
    expect(consecutivePracticeWeeks([7, 9], 10)).toBe(1)
    expect(consecutivePracticeWeeks([], 10)).toBe(0)
  })

  it('never BLOCKS the booking – the parent may push (owner philosophy)', () => {
    const w = createWorld('p7-push', bgProfile('middle'))
    w.condition = 20
    const week = freeWeek(w)
    expect(() => bookPractice(w, week, false)).not.toThrow()
    expect(w.practices).toHaveLength(1)
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
    expect(stop).not.toBe('deadline')
  })

  it('a point-eligible kid IS stopped by the same deadline', () => {
    const w = createWorld('p8-eligible')
    giveKidPoints(w, 200) // national band [150, ∞)
    const nat = injectEvent(w, { week: w.week + 4, tier: 'national', deadlineWeek: w.week + 2 })
    w.season = [nat]
    expect(advanceWeeks(w, rngFromSeed(w.seed), 4)).toBe('deadline')
  })

  it('an OUTGROWN tier never stops the sim either (points past the ceiling)', () => {
    const w = createWorld('p8-outgrown')
    giveKidPoints(w, 400) // past regional's 230 ceiling; national needs no stop here
    const reg = injectEvent(w, { week: w.week + 4, tier: 'regional', deadlineWeek: w.week + 2 })
    w.season = [reg]
    expect(advanceWeeks(w, rngFromSeed(w.seed), 4)).not.toBe('deadline')
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

  it('the Home availability chip reads the practice strain', () => {
    const src = readFileSync(new URL('../src/components/screens/HomeScreen.vue', import.meta.url), 'utf8')
    expect(src).toMatch(/practiceCaution|cautionCondition/)
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
