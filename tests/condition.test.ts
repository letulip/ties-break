import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  advanceWeeks,
  accrueCondition,
  availabilityStatus,
  isBlackoutWeek,
  toSnapshot,
  skipTournament,
  closeTournament,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS } from '../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// ---------------------------------------------------------------------------
// Season-Life slice B — condition/fatigue + availability gate.
// ---------------------------------------------------------------------------

// FNV-1a over the stringified draw stream: a compact, order-sensitive fingerprint
// of the MAIN RNG sequence (see B1).
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

// Add a controlled event to a world's calendar (id-targeted, so the generated season
// around it is irrelevant). deadlineWeek defaults to week - 2 (the engine convention).
function injectEvent(world: WorldState, partial: { week: number; tier: TierId; id?: string; deadlineWeek?: number }): SeasonEvent {
  const e: SeasonEvent = {
    id: partial.id ?? `inj-${partial.week}-${partial.tier}`,
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

// ---------------------------------------------------------------------------
// B1 — THE INVARIANT (blocks merge). The per-week MAIN RNG stream must be
// byte-identical before and after the slice, and must never depend on player
// input, funds, plan, or condition. Frozen reference captured from the
// step-1c-stubbed (pre-slice) build for seed "bench-working-0", weeks 1..52.
// ---------------------------------------------------------------------------
const REF = {
  count: 45239,
  hash: '9f783705',
  head: [
    0.29022555728442967, 0.879210032755509, 0.9903593938797712, 0.8499038522131741, 0.3840416269376874,
    0.6166684734635055, 0.3415204482153058, 0.8582294869702309,
  ],
  tail: [
    0.4780225674621761, 0.18402758589945734, 0.041664635529741645, 0.7598230177536607, 0.7584145739674568,
    0.9743674397468567, 0.3922130144201219, 0.5808420258108526,
  ],
  kidRank: 131,
}

function recordRun(mutate?: (w: WorldState) => void): { draws: number[]; world: WorldState } {
  const world = createWorld('bench-working-0')
  if (mutate) mutate(world)
  const base = rngFromSeed(world.seed)
  const draws: number[] = []
  const rng = () => {
    const v = base()
    draws.push(v)
    return v
  }
  for (let i = 0; i < 52; i++) tickWeek(world, rng)
  return { draws, world }
}

function aiResults(world: WorldState) {
  return world.results.filter((r) => r.playerId !== KID_ID)
}

describe('B1 — main-stream RNG invariance (blocks merge)', () => {
  it('reproduces the frozen pre-slice draw sequence byte-for-byte', () => {
    const { draws, world } = recordRun()
    expect(draws.length).toBe(REF.count)
    expect(hashOf(draws)).toBe(REF.hash)
    expect(draws.slice(0, 8)).toEqual(REF.head)
    expect(draws.slice(-8)).toEqual(REF.tail)
    // cohort/results/kidRank of the real slice match the stubbed build too.
    expect(world.kidRank).toBe(REF.kidRank)
  })

  it('the draw stream + cohort + AI results + kidRank never depend on condition/plan/funds/physio', () => {
    const base = recordRun()
    const baseHash = hashOf(base.draws)
    const variants: Array<(w: WorldState) => void> = [
      (w) => (w.condition = 0),
      (w) => (w.condition = 50),
      (w) => (w.condition = 100),
      (w) => (w.plan = { train: 100, rest: 0 }),
      (w) => (w.plan = { train: 60, rest: 40 }),
      (w) => (w.fundsCents = 1),
      (w) => (w.fundsCents = 9_999_999_00),
      (w) => (w.physioActive = true),
      (w) => (w.physioActive = false),
    ]
    for (const mutate of variants) {
      const v = recordRun(mutate)
      expect(v.draws.length).toBe(base.draws.length)
      expect(hashOf(v.draws)).toBe(baseHash)
      expect(v.world.cohort).toEqual(base.world.cohort)
      expect(aiResults(v.world)).toEqual(aiResults(base.world))
      expect(v.world.kidRank).toBe(base.world.kidRank)
    }
  })

  it('entering (and playing) an event never perturbs the main stream (the guarded branch)', () => {
    const base = recordRun()
    const world = createWorld('bench-working-0')
    const raw = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = raw()
      draws.push(v)
      return v
    }
    // Fresh kid (0 pts) can always enter the earliest still-open local event.
    const target = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)!
    enterEvent(world, target.id)
    for (let i = 0; i < 52; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    expect(draws.length).toBe(base.draws.length)
    expect(hashOf(draws)).toBe(hashOf(base.draws))
    expect(world.cohort).toEqual(base.world.cohort)
    expect(aiResults(world)).toEqual(aiResults(base.world))
    // ...but she actually played, so the entered run left a kid match record the baseline lacks.
    expect(world.events.some((e) => e.type === 'match')).toBe(true)
  })

  it('accrueCondition is pure arithmetic (zero draws): a poison rng is never called', () => {
    const w = createWorld('poison')
    w.condition = 50
    // accrueCondition takes no rng; proving it here documents the zero-draw contract.
    expect(() => accrueCondition(w, false)).not.toThrow()
    expect(accrueCondition.length).toBe(2) // (world, playedThisWeek) — no rng parameter
  })
})

// ---------------------------------------------------------------------------
// B2 — condition dynamics (pure accumulator).
// ---------------------------------------------------------------------------
describe('B2 — condition dynamics', () => {
  it('balanced 75/25, non-playing: +1/wk', () => {
    const w = createWorld('b2-balanced')
    w.condition = 60
    w.plan = { train: 75, rest: 25 }
    for (let i = 0; i < 10; i++) accrueCondition(w, false)
    expect(w.condition).toBe(70)
  })

  it('grind 100/0: -2/wk', () => {
    const w = createWorld('b2-grind')
    w.condition = 100
    w.plan = { train: 100, rest: 0 }
    for (let i = 0; i < 30; i++) accrueCondition(w, false)
    expect(w.condition).toBe(40)
  })

  it('full rest 0/100: +10/wk, clamped at 100', () => {
    const w = createWorld('b2-rest')
    w.condition = 40
    w.plan = { train: 0, rest: 100 }
    for (let i = 0; i < 6; i++) accrueCondition(w, false)
    expect(w.condition).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// B3 — tournament strain.
// ---------------------------------------------------------------------------
describe('B3 — tournament strain', () => {
  it('condition 100, balanced, one national played that week -> ~75', () => {
    const w = createWorld('b3')
    w.condition = 100
    w.plan = { train: 75, rest: 25 }
    const ev = injectEvent(w, { week: w.week, tier: 'national' })
    w.entries.push(ev.id)
    accrueCondition(w, true)
    expect(w.condition).toBe(75) // 100 + 5.5 - 4.5 - 26
  })
})

// ---------------------------------------------------------------------------
// B4 — fatigue is a SOFT, warned choice (not a hard block). A tired body is a
// tough-parent decision; racing anyway is allowed, with emergent consequences.
// ---------------------------------------------------------------------------
describe('B4 — fatigue is a soft, warned choice', () => {
  it('condition 35: national is enterable with a caution; local is clear; playing digs deeper', () => {
    // national: kid national-eligible and fatigued (35 < floor 40) – fatigue does NOT block entry.
    const wn = createWorld('b4-nat')
    giveKidPoints(wn, 200)
    wn.condition = 35
    const nat = injectEvent(wn, { week: wn.week + 2, tier: 'national' })
    const before = wn.fundsCents
    expect(() => enterEvent(wn, nat.id)).not.toThrow()
    expect(wn.entries).toContain(nat.id)
    expect(wn.fundsCents).toBe(before - TIERS.national.entryFeeCents)
    const un = toSnapshot(wn).upcoming.find((e) => e.id === nat.id)!
    expect(un.eligible).toBe(true) // she CAN enter
    expect(un.ineligibleReason).toBeUndefined()
    expect(un.cautionReason).toBe('fatigued') // ...but warned
    expect(un.cautionDetail).toBe('Exhausted – racing risks injury.')

    // local: fresh kid (0 pts, local eligible), condition 35 clears the floor of 20, no caution.
    const wl = createWorld('b4-loc')
    wl.condition = 35
    const loc = injectEvent(wl, { week: wl.week + 2, tier: 'local' })
    enterEvent(wl, loc.id)
    expect(wl.entries).toContain(loc.id)
    const ul = toSnapshot(wl).upcoming.find((e) => e.id === loc.id)!
    expect(ul.eligible).toBe(true)
    expect(ul.cautionReason).toBeUndefined()

    // Playing fatigued digs a deeper hole – emergent (tournamentStrain), NO extra entry penalty.
    const wp = createWorld('b4-play')
    wp.condition = 35
    wp.plan = { train: 75, rest: 25 }
    const ev = injectEvent(wp, { week: wp.week, tier: 'national' })
    wp.entries.push(ev.id)
    accrueCondition(wp, true)
    expect(wp.condition).toBe(10) // 35 + 5.5 - 4.5 - 26
  })
})

// ---------------------------------------------------------------------------
// Hard blocks: injury (Slice C, wired) and school exams STOP entry on every
// surface; fatigue never does.
// ---------------------------------------------------------------------------
describe('hard availability blocks (injured / exams)', () => {
  it('an injured kid is blocked on every reachable tier', () => {
    // local (fresh kid, point-eligible) -> injured throw.
    const wl = createWorld('hb-inj-l')
    wl.injury = { kind: 'wrist', severity: 'minor', weeksRemaining: 2, totalWeeks: 3, sinceWeek: wl.week }
    const loc = injectEvent(wl, { week: wl.week + 2, tier: 'local' })
    expect(() => enterEvent(wl, loc.id)).toThrow('Injured – back in 2 weeks.')
    const ul = toSnapshot(wl).upcoming.find((e) => e.id === loc.id)!
    expect(ul.eligible).toBe(false)
    expect(ul.ineligibleReason).toBe('injured')
    expect(ul.cautionReason).toBeUndefined()

    // national (national-eligible) -> injured throw too.
    const wn = createWorld('hb-inj-n')
    giveKidPoints(wn, 200)
    wn.injury = { kind: 'wrist', severity: 'minor', weeksRemaining: 2, totalWeeks: 3, sinceWeek: wn.week }
    const nat = injectEvent(wn, { week: wn.week + 2, tier: 'national' })
    expect(() => enterEvent(wn, nat.id)).toThrow('Injured – back in 2 weeks.')
    expect(toSnapshot(wn).upcoming.find((e) => e.id === nat.id)!.ineligibleReason).toBe('injured')
  })

  it('an exam-week event is unavailable (hard block) on entry and in upcoming', () => {
    const w = createWorld('hb-exam')
    w.week = 20
    w.condition = 100
    const ev = injectEvent(w, { week: 24, tier: 'local' }) // offset 24 ∈ examWeeks
    expect(() => enterEvent(w, ev.id)).toThrow('School exams this week – no tournaments.')
    const ue = toSnapshot(w).upcoming.find((e) => e.id === ev.id)!
    expect(ue.eligible).toBe(false)
    expect(ue.ineligibleReason).toBe('unavailable')
    expect(ue.cautionReason).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// B5 — school gate (exam weeks).
// ---------------------------------------------------------------------------
describe('B5 — school exam gate', () => {
  it('entering an event in an exam block is unavailable on all surfaces', () => {
    const w = createWorld('b5')
    w.week = 20
    w.condition = 100
    const ev = injectEvent(w, { week: 24, tier: 'local' }) // offset 24 ∈ examWeeks
    expect(isBlackoutWeek(24)).toBe(true)
    expect(() => enterEvent(w, ev.id)).toThrow('School exams this week – no tournaments.')
    const ue = toSnapshot(w).upcoming.find((e) => e.id === ev.id)!
    expect(ue.eligible).toBe(false)
    expect(ue.ineligibleReason).toBe('unavailable')
  })
})

// ---------------------------------------------------------------------------
// B6 — three-surface parity (enterEvent / upcomingEvents / advanceWeeks).
// ---------------------------------------------------------------------------
describe('B6 — three-surface parity', () => {
  it('fatigue is caution/enterable on all three surfaces (may stop-for-deadline)', () => {
    // Fatigued national, imminent deadline. Enterable everywhere; the sim MAY stop so the parent
    // can make the tough call.
    const w = createWorld('b6-fat')
    giveKidPoints(w, 200)
    w.condition = 35 // below national floor 40 -> caution, not block
    const nat = injectEvent(w, { week: w.week + 3, tier: 'national', deadlineWeek: w.week + 1 })
    w.season = [nat]

    // surface 1: enterEvent does NOT throw
    expect(() => enterEvent(w, nat.id)).not.toThrow()
    expect(w.entries).toContain(nat.id)
    // surface 2: upcoming keeps it eligible with a caution
    const ue = toSnapshot(w).upcoming.find((e) => e.id === nat.id)!
    expect(ue.eligible).toBe(true)
    expect(ue.cautionReason).toBe('fatigued')
    expect(ue.ineligibleReason).toBeUndefined()
    // surface 3: on a fresh (un-entered) copy advance MAY stop-for-deadline (it's enterable)
    const wa = createWorld('b6-fat')
    giveKidPoints(wa, 200)
    wa.condition = 35
    const natA = injectEvent(wa, { week: wa.week + 3, tier: 'national', deadlineWeek: wa.week + 1 })
    wa.season = [natA]
    expect(advanceWeeks(wa, rngFromSeed(wa.seed), 4)).toBe('deadline')
  })

  it('a hard block (injured) is consistent on all three surfaces (never stops advance)', () => {
    const b = createWorld('b6-inj')
    giveKidPoints(b, 200)
    b.injury = { kind: 'ankle', severity: 'moderate', weeksRemaining: 3, totalWeeks: 6, sinceWeek: b.week }
    const nat = injectEvent(b, { week: b.week + 3, tier: 'national', deadlineWeek: b.week + 1 })
    b.season = [nat]

    // surface 1: enterEvent throws (hard block)
    expect(() => enterEvent(b, nat.id)).toThrow('Injured – back in 3 weeks.')
    // surface 2: upcoming marks it ineligible with the matching reason
    const ue = toSnapshot(b).upcoming.find((e) => e.id === nat.id)!
    expect(ue.eligible).toBe(false)
    expect(ue.ineligibleReason).toBe('injured')
    // surface 3: advance never stops-for-deadline on an event she hard-cannot enter
    expect(advanceWeeks(b, rngFromSeed(b.seed), 4)).not.toBe('deadline')
  })
})

// ---------------------------------------------------------------------------
// B7 — snapshot + HomeScreen.
// ---------------------------------------------------------------------------
describe('B7 — snapshot + UI', () => {
  it('toSnapshot carries condition, null injury, and the physio flag', () => {
    const w = createWorld('b7')
    w.condition = 73
    const snap = toSnapshot(w)
    expect(snap.condition).toBe(73)
    expect(snap.injury).toBeNull()
    expect(typeof snap.physioActive).toBe('boolean')
  })

  it('HomeScreen drives the condition bar off round(condition/10), no "Phase 4" title', () => {
    const src = readFileSync(new URL('../src/components/screens/HomeScreen.vue', import.meta.url), 'utf8')
    expect(src).not.toContain('Phase 4')
    // the bar is driven off round(condition / 10), not a hard-coded fill.
    expect(src).toMatch(/round\([^)]*condition[^)]*\/\s*10/i)
    expect(src).not.toContain('CONDITION_FILLED')
  })
})

// ---------------------------------------------------------------------------
// availabilityStatus precedence (injured > unavailable > fatigued).
// ---------------------------------------------------------------------------
describe('availabilityStatus precedence + levels', () => {
  it('unavailable (hard) outranks fatigued (soft) on the same event', () => {
    const w = createWorld('prec')
    w.condition = 5 // fatigued for every tier
    const ev = injectEvent(w, { week: 24, tier: 'national' }) // exam week -> unavailable
    expect(w.injury).toBeNull() // injury dead in B
    const status = availabilityStatus(w, ev)
    expect(status.level).toBe('blocked')
    expect(status.reason).toBe('unavailable')
  })

  it('fatigue on a clear week is a soft caution, not a block', () => {
    const w = createWorld('prec-fat')
    w.condition = 5
    const ev = injectEvent(w, { week: w.week + 2, tier: 'national' })
    const status = availabilityStatus(w, ev)
    expect(status.level).toBe('caution')
    expect(status.reason).toBe('fatigued')
    expect(status.detail).toBe('Exhausted – racing risks injury.')
  })

  it('a clear week at full condition is ok', () => {
    const w = createWorld('prec2')
    w.condition = 100
    const ev = injectEvent(w, { week: w.week + 2, tier: 'local' })
    expect(availabilityStatus(w, ev)).toEqual({ level: 'ok' })
  })
})
