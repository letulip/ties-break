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
  medicalBlock,
  medicalClearance,
  restRecoveryBonus,
  toSnapshot,
  skipTournament,
  closeTournament,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
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
//
// ⚠ RE-PINNED, FOR THE LAST TIME A CALENDAR CHANGE CAN DO IT: 51642 -> 41550, hash cae178fc ->
// e6b0c709 (the AI sub-stream refactor). History of this number: 45239 (pre-ladder) -> 51642
// (ladder-up Part B, the J family) -> 41550 (here).
//
// WHY IT MOVED, AND WHY IT STOPS MOVING NOW. The two previous moves were forced by the same
// design flaw: the canonical AI tournaments drew from the MAIN weekly stream – one draw per
// entrant-band candidate plus one per AI-AI match, per scheduled event – so the calendar's SIZE
// was part of the weekly draw count. Any content change (a new tier, a denser cadence, one extra
// event) re-based this pin by construction; the ladder-up slice moved it for exactly that reason.
//
// The AI bracket now runs on its own EVENT-scoped stream `seed:aitour:<event.id>`, the mirror of
// the kid's `seed:kidtour:<event.id>`. What is left on the main stream is base costs + cohort
// drift and nothing else: 52 x (4 x 199 cohort drift + 3 base costs) + 2 sponsor-gift draws =
// 41550. That is a function of the COHORT SIZE and the career length, not of the calendar – so
// from here on, adding tiers and events is free and this pin no longer moves with content. The
// composition is proved exhaustively, week by week, in B1b below.
//
// WHAT DID NOT MOVE – the property this test actually exists to protect: the per-week draw count
// is still INDEPENDENT of player input. Every other test in this describe block is untouched and
// green: condition/plan/funds/physio variants, entering and playing an event, planner bookings
// (P1), a mid-run injury (C1), a post-deadline skip (R9-9).
//
// NOTE ON hash/head/tail: `recordRun` taps the RAW generator, so `draws` is by construction the
// first N outputs of rngFromSeed('bench-working-0'). hash and tail are therefore pure functions of
// N and carry no information beyond `count` (head is N-independent and never changes). They are
// kept because they make an accidental drift loud, but the real guards are the variance tests.
const REF = {
  count: 41550,
  hash: 'e6b0c709',
  head: [
    0.29022555728442967, 0.879210032755509, 0.9903593938797712, 0.8499038522131741, 0.3840416269376874,
    0.6166684734635055, 0.3415204482153058, 0.8582294869702309,
  ],
  tail: [
    0.09633621200919151, 0.14082618593238294, 0.7656564658973366, 0.16811327124014497, 0.9865698856301606,
    0.8267154651694, 0.7829126522410661, 0.4907760114874691,
  ],
  // 131 (pre-slice) -> 143 (Part A, cohort pre-history) -> 141 (Part B, the J family) -> 140 (the
  // AI sub-stream) -> 141 (RIVALS BECOME REAL). A CONSEQUENCE of the stream, never the stream
  // itself: the point-less kid shares the dense rank of the whole 0-point group, so this number is
  // just "how many AI ended the year holding counting points".
  //
  // ⚠ RE-PINNED 140 -> 141 BY THE RIVAL-LIFE SLICE, DELIBERATELY. Rivals now arrive at a draw
  // carrying the fatigue of their own recent schedule and coloured by how their style suits the
  // surface, so AI-vs-AI matches resolve differently and a different set of juniors ends the year
  // in the points – one fewer, here. That is the POINT of the slice. What did NOT move, and is the
  // thing this test exists to protect, is everything above: count 41550, hash e6b0c709, head and
  // tail are all byte-identical, because both halves are pure derivations that draw no RNG.
  // 141 -> 140 at wave-3 integration: the surface x style table changes which of her matches she wins, so a different junior ends the year holding counting points. The STREAM is untouched (count/hash identical) - only the ranking derived from it moved.
  //
  // ⚠ RE-PINNED 140 -> 133 BY WAVE B "first-round loss pays ZERO" (tune/first-round-zero),
  // DELIBERATELY, and it is the LARGEST move this number has ever made. Mechanism, in one line:
  // `awardAiPoints` only writes a ledger row when `points > 0`, so with every tier's first-round
  // value now 0, the ~half of each 32-draw that loses its opener stops banking anything at all.
  // Seven fewer juniors end the year holding counting points, and the kid – still point-less at
  // week 52 in this fixture – shares the dense rank of a 0-point group that is now seven larger.
  // The number means exactly what the note above says it means ("how many AI ended the year
  // holding counting points"), so a DROP here is the change landing, not a regression.
  // The STREAM is untouched and that is the whole point of this test: count 41550, hash e6b0c709,
  // head and tail all still byte-identical, because points are post-draw arithmetic – they are
  // read off a table AFTER the bracket has already been resolved by the RNG.
  // ⚠ RE-PINNED 133 -> 135 (29.07, partial seeding). `count`/`hash`/`head`/`tail` above did NOT
  // move - the main stream is untouched, which is what this block guards. Her RANK moved, because
  // the bracket now seeds the top 8 and shuffles the rest, herself included.
  // ⚠ RE-PINNED 135 -> 126 (29.07, the two ladders). `count`/`hash`/`head`/`tail` did NOT move; the
  // stream is untouched and that is what this block guards. What moved is the MEANING of kidRank: it
  // is now her place in the ITF table, not in a single mixed one, so it is a different number about a
  // different question. See docs/specs/two-ladders.md.
  kidRank: 126,
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
// B1b — THE AI SUB-STREAM. Every scheduled event's canonical AI tournament now runs on its OWN
// event-scoped stream `seed:aitour:<event.id>` – the exact mirror of the kid's `seed:kidtour:
// <event.id>`. Both entrant selection AND the AI-vs-AI matches draw from it, so the MAIN weekly
// stream carries base costs + cohort drift and NOTHING else.
//
// This is what makes CALENDAR CONTENT FREE: a new tier, a densified cadence, an extra event – none
// of them can re-base the main stream any more, so the frozen B1/C1 pins stop moving every time the
// calendar is edited. (The ladder-up slice had to move them precisely because it could not.)
// ---------------------------------------------------------------------------
describe('B1b — the main stream is base costs + cohort drift, and nothing else', () => {
  it('every week draws exactly 3-4 base-cost values + 4 per cohort player', () => {
    const world = createWorld('bench-working-0')
    const base = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = base()
      draws.push(v)
      return v
    }
    const driftDraws = 4 * world.cohort.length // driftCohort: serve/ret/composure/stamina
    for (let i = 0; i < 52; i++) {
      const before = draws.length
      tickWeek(world, rng)
      const week = draws.slice(before)
      // resolveBaseCosts runs FIRST and draws, in order: the expense pickInt, the flavor pickInt,
      // the sponsor roll, and – only when that roll hits – the gift pickInt. Then driftCohort.
      // Nothing else on the main stream, so the week's length is fully determined by draw #2.
      const sponsorHit = week[2] < ECONOMY.sponsor.rollChance
      expect(week.length).toBe(driftDraws + (sponsorHit ? 4 : 3))
    }
    expect(draws.length).toBe(REF.count) // ...and the 52 weeks sum to the frozen pin
  })

  it('CONTENT IS FREE: extra events on the calendar never move the main stream', () => {
    const base = recordRun()
    const dense = recordRun((w) => {
      // 24 extra tournaments across the year – under the old MAIN-stream AI bracket this alone
      // added thousands of draws (one per band candidate + one per AI-AI match, per event).
      for (let week = 4; week <= 48; week += 4) {
        injectEvent(w, { week, tier: 'national', id: `extra-${week}-national` })
        injectEvent(w, { week, tier: 'j60', id: `extra-${week}-j60` })
      }
    })
    expect(dense.draws.length).toBe(base.draws.length)
    expect(hashOf(dense.draws)).toBe(hashOf(base.draws))
    expect(dense.world.cohort).toEqual(base.world.cohort)
    // ...and the extra brackets really did run – they just ran on their own streams.
    expect(aiResults(dense.world).length).toBeGreaterThan(aiResults(base.world).length)
  })

  it("an event's AI bracket is a pure function of (seed, event.id) – the main stream cannot move it", () => {
    // Same world, same calendar, but the main stream is advanced by a different number of draws
    // before the weeks resolve. `growth = 0` freezes the cohort's SKILLS (drift still draws its 4
    // per player, it just lands on +0), so the only thing the offset can still change is the
    // bracket's RNG. Under a MAIN-stream bracket that rewrites every AI result; under the
    // event-scoped stream nothing about the AI side can notice.
    const runWithOffset = (offset: number) => {
      const world = createWorld('aitour-purity')
      for (const p of world.cohort) p.growth = 0
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < offset; i++) rng() // desynchronise the main stream
      for (let i = 0; i < 12; i++) tickWeek(world, rng)
      return aiResults(world)
    }
    const a = runWithOffset(0)
    const b = runWithOffset(7)
    expect(b).toEqual(a)
    expect(a.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// B2 — condition dynamics (pure INTEGER accumulator).
// Re-pinned deliberately for the round-9 OWNER REDESIGN: recovery is time-based
// (base +2 every week; the train/rest slider adds a threshold bonus on MATCH-FREE
// weeks only: 85/15 → +0, 75/25 → +1, 60/40 → +2), the slider never drains, and
// match fatigue lives in matchDrain/finalizeTournament instead. physioActive is
// pinned OFF for the pure numbers; the +2 physio bonus is covered in round9.test.ts.
// ---------------------------------------------------------------------------
describe('B2 — condition dynamics', () => {
  // RE-PINNED 25.07 (V2.1 shipped: recoveryBase 2 → 1): the free-week ladder is now
  // grind +1 / balanced +2 / light +3 – the owner wants every policy to ARRIVE at the season
  // wrap below 100, with the off-season + a planner vacation doing the restoring.
  it('balanced 75/25, match-free: +2/wk', () => {
    const w = createWorld('b2-balanced')
    w.physioActive = false
    w.condition = 60
    w.plan = { train: 75, rest: 25 }
    for (let i = 0; i < 10; i++) accrueCondition(w, false)
    expect(w.condition).toBe(80) // base 1 + slider 1 – was +3/wk pre-V2.1
  })

  it('grind 85/15, match-free: +1/wk (base only – rest 15 earns no slider bonus)', () => {
    const w = createWorld('b2-grind')
    w.physioActive = false
    w.condition = 40
    w.plan = { train: 85, rest: 15 }
    for (let i = 0; i < 10; i++) accrueCondition(w, false)
    expect(w.condition).toBe(50) // base 1 only – was +2/wk pre-V2.1
  })

  it('light 60/40, match-free: +3/wk, clamped at 100', () => {
    const w = createWorld('b2-rest')
    w.physioActive = false
    w.condition = 90
    w.plan = { train: 60, rest: 40 }
    for (let i = 0; i < 4; i++) accrueCondition(w, false)
    expect(w.condition).toBe(100) // 90 → 93 → 96 → 99 → clamp
  })
})

// ---------------------------------------------------------------------------
// B3 — tournament fatigue. Re-pinned deliberately for round-9 R9-7 (owner redesign):
// fatigue is PER MATCH (matchDrain: scoreline grade + tier surcharge) and lands at
// finalizeTournament (the commit point) – accrueCondition applies NO match fatigue at
// tick time, so a skipped event week (R9-9) or a walkover costs none by construction.
// The per-match numbers + the finalize integration live in tests/round9.test.ts.
// ---------------------------------------------------------------------------
describe('B3 — tournament fatigue (per-match at finalize since round-9)', () => {
  it('accrueCondition applies NO match fatigue at tick, even on an entered national week', () => {
    const w = createWorld('b3')
    w.physioActive = false
    w.condition = 60
    w.plan = { train: 75, rest: 25 }
    const ev = injectEvent(w, { week: w.week, tier: 'national' })
    w.entries.push(ev.id)
    accrueCondition(w, true)
    // RE-PINNED 25.07 (V2 shipped): a match week earns NO base recovery at all
    // (matchWeekRecoveryBase 0) – and still no match fatigue at tick time.
    expect(w.condition).toBe(60)
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

    // Playing fatigued digs a deeper hole – emergent (per-match drain at finalize since
    // round-9, see tests/round9.test.ts), NO extra entry penalty. RE-PINNED 25.07 (V2
    // shipped): at tick time a match week accrues NOTHING (matchWeekRecoveryBase 0).
    const wp = createWorld('b4-play')
    wp.physioActive = false
    wp.condition = 35
    wp.plan = { train: 75, rest: 25 }
    const ev = injectEvent(wp, { week: wp.week, tier: 'national' })
    wp.entries.push(ev.id)
    accrueCondition(wp, true)
    expect(wp.condition).toBe(35) // unchanged at tick – was 37 pre-V2, 10 under the flat -26 strain
  })
})

// ---------------------------------------------------------------------------
// Hard blocks: injury (Slice C, wired) and school exams STOP entry on every
// surface; fatigue never does.
// ---------------------------------------------------------------------------
describe('hard availability blocks (injured / exams)', () => {
  // R10-17: the layoff is a RANGE of weeks, so these fixtures put the event under test INSIDE it
  // (3 weeks out, event at +2). What they assert is unchanged – an injured kid is hard-blocked on
  // every tier – but the layoff has to actually cover the event's week for that to be the question:
  // she is enterable again FROM `week + weeksRemaining`, which is the same week the news and the
  // planner have always named. tests/round10.test.ts owns the boundary itself.
  it('an injured kid is blocked on every reachable tier', () => {
    // local (fresh kid, point-eligible) -> injured throw.
    const wl = createWorld('hb-inj-l')
    wl.injury = { kind: 'wrist', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: wl.week }
    const loc = injectEvent(wl, { week: wl.week + 2, tier: 'local' })
    expect(() => enterEvent(wl, loc.id)).toThrow('Injured – back in 3 weeks.')
    const ul = toSnapshot(wl).upcoming.find((e) => e.id === loc.id)!
    expect(ul.eligible).toBe(false)
    expect(ul.ineligibleReason).toBe('injured')
    expect(ul.cautionReason).toBeUndefined()

    // national (national-eligible) -> injured throw too.
    const wn = createWorld('hb-inj-n')
    giveKidPoints(wn, 200)
    wn.injury = { kind: 'wrist', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: wn.week }
    const nat = injectEvent(wn, { week: wn.week + 2, tier: 'national' })
    expect(() => enterEvent(wn, nat.id)).toThrow('Injured – back in 3 weeks.')
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
    expect(advanceWeeks(wa, rngFromSeed(wa.seed), 4)).toContain('deadline')
  })

  it('a hard block (injured) is consistent on all three surfaces (never stops advance)', () => {
    const b = createWorld('b6-inj')
    giveKidPoints(b, 200)
    // R10-17: 4 weeks out so the +3 event under test sits INSIDE the layoff (she is enterable again
    // from week + weeksRemaining – see tests/round10.test.ts for the boundary itself).
    b.injury = { kind: 'ankle', severity: 'moderate', weeksRemaining: 4, totalWeeks: 6, sinceWeek: b.week }
    const nat = injectEvent(b, { week: b.week + 3, tier: 'national', deadlineWeek: b.week + 1 })
    b.season = [nat]

    // surface 1: enterEvent throws (hard block)
    expect(() => enterEvent(b, nat.id)).toThrow('Injured – back in 4 weeks.')
    // surface 2: upcoming marks it ineligible with the matching reason
    const ue = toSnapshot(b).upcoming.find((e) => e.id === nat.id)!
    expect(ue.eligible).toBe(false)
    expect(ue.ineligibleReason).toBe('injured')
    // surface 3: advance never stops-for-deadline on an event she hard-cannot enter
    expect(advanceWeeks(b, rngFromSeed(b.seed), 4)).not.toContain('deadline')
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

  it('HomeScreen drives the condition RING off the real condition, never a hard-coded fill', () => {
    // ⚠ RE-AIMED by A2b (owner, 28.07): slice B's ten squares became the export's ProgressRing, so
    // `round(condition / 10)` (the number of filled squares) is gone. The fact this guards is
    // unchanged and is now checked at the arc: the sweep is the REAL condition, clamped to 0..100,
    // and the geometry comes from the radius rather than from a magic number.
    // ⚠ RE-AIMED AGAIN by U0 (docs/specs/ui-components.md #6): the ring is a shared component now –
    // `src/components/ui/ProgressRing.vue` – because Home's condition ring and the Season card's
    // chance ring were the same object written twice, and a percentage has to look like a percentage
    // everywhere. So the GEOMETRY and the clamp moved into it, and Home passes `value`.
    // The protected fact is unchanged and is checked in both halves, which is what makes the move
    // safe: Home hands the ring her REAL condition (never a constant, never a bucket), and the ring
    // clamps it to 0..1 and derives its dash offset from its own radius rather than a magic number.
    const src = readFileSync(new URL('../src/components/screens/HomeScreen.vue', import.meta.url), 'utf8')
    const ring = readFileSync(new URL('../src/components/ui/ProgressRing.vue', import.meta.url), 'utf8')
    expect(src).not.toContain('Phase 4')
    expect(src).toContain(':value="condition / 100"')
    expect(src).toContain('game.snapshot?.condition ?? 0')
    expect(ring).toMatch(/Math\.max\(0,\s*Math\.min\(1,\s*props\.value\)\)/)
    expect(ring).toMatch(/2 \* Math\.PI \* r/)
    expect(src).not.toContain('CONDITION_FILLED')
    expect(src).not.toContain('conditionFilled')
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
    // ABOVE the medical floor (the doctor's veto below it is a HARD block – see the block below);
    // 20 is deep under national's floor of 40, so the soft fatigue caution is what surfaces.
    w.condition = 20
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

// ---------------------------------------------------------------------------
// THE DOCTOR'S VETO (owner R9-19b, cashed in by the Wave-2 fatigue bench): the ONE
// place where "the parent may push" yields to medicine. Below
// ECONOMY.availability.medicalFloor entering is a HARD block; above it fatigue stays
// the soft, warned CHOICE it has always been. This is the first hard body-gate in
// the game, and it is knob-driven so the owner can lower or disable it.
// ---------------------------------------------------------------------------
describe("the doctor's veto — medical floor", () => {
  const FLOOR = ECONOMY.availability.medicalFloor

  it('sits far below every tier caution floor, so normal play never meets it', () => {
    for (const [, floor] of Object.entries(ECONOMY.availability.minConditionToEnter)) {
      expect(FLOOR).toBeLessThan(floor)
    }
    expect(FLOOR).toBeGreaterThan(ECONOMY.condition.min)
  })

  it('blocks entry below the floor on all three surfaces, with the medical reason', () => {
    const w = createWorld('vet-block')
    w.condition = FLOOR - 1
    const loc = injectEvent(w, { week: w.week + 3, tier: 'local', deadlineWeek: w.week + 1 })
    w.season = [loc]

    // surface 1: availabilityStatus / enterEvent hard-refuse
    const status = availabilityStatus(w, loc)
    expect(status.level).toBe('blocked')
    expect(status.reason).toBe('medical')
    expect(status.detail).toBe('Not cleared to play – she needs rest.')
    expect(() => enterEvent(w, loc.id)).toThrow('Not cleared to play – she needs rest.')
    expect(w.entries).toEqual([])

    // surface 2: upcoming marks it ineligible with the same reason (and no soft caution)
    const up = toSnapshot(w).upcoming.find((e) => e.id === loc.id)!
    expect(up.eligible).toBe(false)
    expect(up.ineligibleReason).toBe('medical')
    expect(up.cautionReason).toBeUndefined()

    // surface 3: advance never stops-for-deadline on an event she hard-cannot enter. Condition 0,
    // because the pre-deadline ticks recover a couple of points before the guard is re-read.
    const wa = createWorld('vet-block')
    wa.condition = 0
    giveKidPoints(wa, 200)
    const nat = injectEvent(wa, { week: wa.week + 3, tier: 'national', deadlineWeek: wa.week + 1 })
    wa.season = [nat]
    expect(advanceWeeks(wa, rngFromSeed(wa.seed), 4)).not.toContain('deadline')
  })

  it('AT the floor she may still push through – fatigue above it stays a soft caution', () => {
    const w = createWorld('vet-floor')
    w.condition = FLOOR // the floor itself is cleared: the block is strictly below
    const loc = injectEvent(w, { week: w.week + 2, tier: 'local' })
    const status = availabilityStatus(w, loc)
    expect(status.level).toBe('caution') // below local's floor of 20 -> the OLD soft warning
    expect(status.reason).toBe('fatigued')
    expect(() => enterEvent(w, loc.id)).not.toThrow()
    expect(w.entries).toContain(loc.id)
  })

  it('injury still outranks it, and a blacked-out week still names the week-level reason', () => {
    const inj = createWorld('vet-inj')
    inj.condition = 0
    // R10-17: the layoff must cover the event's week for "injury outranks the veto" to be the
    // question being asked – 3 weeks out, event at +2.
    inj.injury = { kind: 'wrist', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: inj.week }
    const ev = injectEvent(inj, { week: inj.week + 2, tier: 'local' })
    expect(availabilityStatus(inj, ev).reason).toBe('injured')

    const exam = createWorld('vet-exam')
    exam.week = 20
    exam.condition = 0
    const examEv = injectEvent(exam, { week: 24, tier: 'local' })
    expect(availabilityStatus(exam, examEv).reason).toBe('unavailable')
  })

  it('is knob-driven: lowering the floor to 0 restores the pre-veto behaviour', () => {
    const av = ECONOMY.availability as { medicalFloor: number }
    const saved = av.medicalFloor
    try {
      av.medicalFloor = 0
      const w = createWorld('vet-knob')
      w.condition = 0
      const loc = injectEvent(w, { week: w.week + 2, tier: 'local' })
      expect(availabilityStatus(w, loc).level).toBe('caution')
      expect(() => enterEvent(w, loc.id)).not.toThrow()
    } finally {
      av.medicalFloor = saved
    }
  })
})

// ---------------------------------------------------------------------------
// THE DOCTOR CHECKS HER ON ARRIVAL (owner 26.07):
//   "врач точно не пустит ниже 15 на турнир, если она приезжает; скажем, с состоянием 20 врач
//    вполне может сказать «я вас предупреждаю о последствиях, формально запретить не могу»"
//
// The floor above gates ENTRY, and entries commit weeks ahead of the play week – so until now a run
// entered healthy could still be PLAYED at condition 0 with nothing intervening (the fatigue bench
// traced a grinder doing exactly that for 14 straight weeks). The floor is now re-read ON the play
// week, before the run resolves:
//   under the floor            -> WITHDRAWN on medical grounds (no travel, no run, 0 pts, fee gone);
//   [floor, warningCeiling)    -> she PLAYS and the doctor goes on record. A warning, never a block.
// Pure state, ZERO new RNG draws – proved against the main stream below.
// ---------------------------------------------------------------------------
describe('the doctor on ARRIVAL — the play-week re-check', () => {
  const FLOOR = ECONOMY.availability.medicalFloor
  const CEILING = ECONOMY.availability.medicalWarningCeiling

  /** A seed whose PRIVATE injury sub-stream cannot fire on weeks 1..`through` whatever her condition
   *  is: each of those weeks' FIRST draw is at or above ECONOMY.availability.injuryChanceCap, and tau
   *  is capped there. That makes these tests deterministic instead of 12%-per-week flaky – an injury
   *  would pre-empt the medical branch (injury outranks it, exactly as availabilityStatus says). */
  function injuryProofSeed(prefix: string, through: number): string {
    const cap = ECONOMY.availability.injuryChanceCap
    for (let i = 0; i < 400; i++) {
      const seed = `${prefix}-${i}`
      let clean = true
      for (let w = 1; w <= through && clean; w++) {
        if (rngFromSeed(`${seed}:injury:${w}`)() < cap) clean = false
      }
      if (clean) return seed
    }
    throw new Error('no injury-proof seed found')
  }

  /** A world entered in ONE local event at `playWeek`, ticked to the week BEFORE it, with the
   *  recovery knobs pinned flat (no physio, 85/15 so the slider bonus is 0) so the arithmetic below
   *  is exact. `condition` is set on the eve of the play week – past the deadline, so the entry can
   *  no longer be withdrawn/refunded and only the arrival check can act. */
  function arriveAt(seedPrefix: string, condition: number, playWeek = 6) {
    const world = createWorld(injuryProofSeed(seedPrefix, playWeek))
    world.physioActive = false
    world.plan = { train: 85, rest: 15 }
    world.season = []
    const event = injectEvent(world, { week: playWeek, tier: 'local', deadlineWeek: playWeek - 3 })
    enterEvent(world, event.id) // entered at full condition, pre-deadline
    const rng = rngFromSeed(world.seed)
    while (world.week < playWeek - 1) tickWeek(world, rng)
    expect(world.injury).toBeNull() // the seed guarantees it – the branch under test is the medical one
    world.condition = condition
    return { world, event, rng }
  }

  it('medicalClearance is the ONE pure rule every surface reads', () => {
    // THREE surfaces now, not two: the entry gate, this arrival check, and (26.07) the practice
    // booking – a friendly is a match, so the doctor's floor governs it too. `medicalBlock` is the
    // shared VERDICT wrapper, so all three refuse in the same words; the practice half of that is
    // asserted in tests/planner.test.ts P7b.
    expect(medicalBlock(FLOOR - 1)).toEqual({
      level: 'blocked',
      reason: 'medical',
      detail: 'Not cleared to play – she needs rest.',
    })
    expect(medicalBlock(FLOOR)).toBeNull()
    expect(medicalClearance(FLOOR - 1)).toBe('withdraw')
    expect(medicalClearance(ECONOMY.condition.min)).toBe('withdraw')
    expect(medicalClearance(FLOOR)).toBe('warn') // the floor itself is cleared – the veto is strictly below
    expect(medicalClearance(CEILING - 1)).toBe('warn')
    expect(medicalClearance(CEILING)).toBe('clear')
    expect(medicalClearance(ECONOMY.condition.max)).toBe('clear')
    // the owner's own example: "с состоянием 20 врач вполне может сказать…"
    expect(medicalClearance(20)).toBe('warn')
    // The band is non-empty, contains the owner's own example, and stays deep in the pathological
    // zone rather than nagging through normal play.
    expect(CEILING).toBeGreaterThan(FLOOR)
    expect(CEILING).toBeGreaterThan(20) // "с состоянием 20 врач вполне может сказать…" – 20 must warn
    expect(CEILING).toBeLessThan(ECONOMY.condition.max / 2)
    // It DELIBERATELY overlaps local's soft fatigue floor of 20 – the owner's example forces that,
    // and the two gates ask different questions: the tier floor is "is this event too big for her
    // right now?" (checked at ENTRY, per tier), the band is "is this body fit to compete at all?"
    // (checked on ARRIVAL, tier-independent). At condition 22 a local entry is 'ok' and the doctor
    // still speaks up on the day, which is the intended reading, not a conflict.
    expect(CEILING).toBeGreaterThan(ECONOMY.availability.minConditionToEnter.local)
    // ...and the entry gate is the same rule, not a copy of the comparison.
    const w = createWorld('clearance-gate')
    w.condition = FLOOR - 1
    const ev = injectEvent(w, { week: w.week + 2, tier: 'local' })
    expect(availabilityStatus(w, ev).reason).toBe('medical')
    w.condition = FLOOR
    expect(availabilityStatus(w, ev).reason).toBe('fatigued') // warn band = play + warn, never block
  })

  it('under the floor on the play week she is WITHDRAWN: no travel, no run, 0 pts, fee forfeited', () => {
    const { world, event, rng } = arriveAt('arrive-block', 0)
    tickWeek(world, rng)
    expect(world.week).toBe(event.week)

    // no run at all
    expect(world.pendingTournament).toBeNull()
    expect(world.events.some((e) => e.type === 'match')).toBe(false)
    expect(world.results.filter((r) => r.playerId === KID_ID)).toHaveLength(0) // 0 points
    // the entry is spent, not pending
    expect(world.entries).not.toContain(event.id)

    const weekEvents = world.events.filter((e) => e.week === world.week)
    // NO travel charge – she never boards, so the trip is never billed (nothing to refund either:
    // the whole travel category nets to exactly zero this week).
    expect(weekEvents.some((e) => e.text.startsWith('Travel to'))).toBe(false)
    expect(weekEvents.filter((e) => e.category === 'travel').reduce((s, e) => s + (e.amountCents ?? 0), 0)).toBe(0)
    expect(event.travelCostCents).toBeGreaterThan(0) // ...and there really was a trip to not charge
    // ENTRY FEE FORFEITED – the same rule skipEvent uses post-deadline, and the same rule the
    // injury walkover uses: the list closed with her on it. No refund event of any kind.
    expect(weekEvents.some((e) => e.text.startsWith('Entry refunded'))).toBe(false)
    expect(weekEvents.some((e) => e.category === 'entry' && (e.amountCents ?? 0) > 0)).toBe(false)

    // the news beat, in player copy: short dash, no Cyrillic
    const beat = weekEvents.find((e) => e.text.includes('not cleared to play'))
    expect(beat).toBeDefined()
    expect(beat!.text).toBe(
      `Withdrawn from the ${TIERS.local.label} – not cleared to play on medical advice. 0 pts, entry fee forfeited.`,
    )
    expect(beat!.text).not.toMatch(/[—А-Яа-яЁё]/)
  })

  it('the withdrawn week resolves as a normal NON-playing week – she gets the free-week recovery', () => {
    // accrueCondition ran with played = true (she was still entered), banking matchWeekRecoveryBase.
    // The withdrawal hands back the DIFFERENCE plus the rest-slider bonus, so the week pays exactly
    // what a match-free week pays – whatever the two knobs are set to.
    for (const plan of [{ train: 85, rest: 15 }, { train: 60, rest: 40 }]) {
      const { world, rng } = arriveAt(`arrive-recover-${plan.rest}`, 0)
      world.plan = plan
      tickWeek(world, rng)
      expect(world.condition).toBe(ECONOMY.condition.recoveryBase + restRecoveryBonus(plan.rest))
      expect(world.pendingTournament).toBeNull()
    }
  })

  it('an INJURY still outranks it: the walkover beat fires, not the medical one', () => {
    const { world, rng } = arriveAt('arrive-inj', 0)
    world.injury = { kind: 'wrist niggle', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: world.week }
    tickWeek(world, rng)
    const weekEvents = world.events.filter((e) => e.week === world.week)
    expect(weekEvents.some((e) => e.text.startsWith('Walkover'))).toBe(true)
    expect(weekEvents.some((e) => e.text.includes('not cleared to play'))).toBe(false)
  })

  it('inside the warning band she PLAYS, and the doctor goes on record', () => {
    const { world, rng } = arriveAt('arrive-warn', CEILING - 1)
    tickWeek(world, rng)
    // she plays: the run really is computed
    expect(world.pendingTournament).not.toBeNull()
    const weekEvents = world.events.filter((e) => e.week === world.week)
    expect(weekEvents.some((e) => e.text.startsWith('Travel to'))).toBe(true) // the trip IS billed
    const warning = weekEvents.find((e) => e.text.startsWith("Doctor's warning"))
    expect(warning).toBeDefined()
    expect(warning!.type).toBe('info') // somebody SAID something; nothing happened to her body
    expect(warning!.text).toBe(
      `Doctor's warning – she is cleared for the ${TIERS.local.label}, but only just. He can warn you; he cannot forbid it.`,
    )
    expect(warning!.text).not.toMatch(/[—А-Яа-яЁё]/) // short dash only, no Cyrillic in player copy
    skipTournament(world)
    closeTournament(world)
    // ...and it really was a run. This used to be proven by "she has a result row", which relied on
    // every tier paying at every finish; wave B ("first-round loss pays ZERO") made a first-round
    // exit bank nothing, so a result row is no longer evidence that she PLAYED. Proven instead off
    // the two records finalizeTournament writes UNCONDITIONALLY, which is the stronger claim
    // anyway – the doctor's subject is whether she took the court, not whether she scored.
    expect(world.events.some((e) => e.type === 'tournament' && e.week === world.week)).toBe(true)
    expect(world.bestFinishByTier.local).toBeDefined()
  })

  it('above the band she plays in silence – the doctor has nothing to say', () => {
    const { world, rng } = arriveAt('arrive-clear', CEILING)
    tickWeek(world, rng)
    expect(world.pendingTournament).not.toBeNull()
    expect(world.events.filter((e) => e.week === world.week).some((e) => e.text.startsWith("Doctor's warning"))).toBe(
      false,
    )
  })

  it('both halves are knob-driven: floor 0 disables the veto, ceiling = floor silences the warning', () => {
    const av = ECONOMY.availability as { medicalFloor: number; medicalWarningCeiling: number }
    const savedFloor = av.medicalFloor
    const savedCeiling = av.medicalWarningCeiling
    try {
      // floor 0: at condition 0 she plays after all (the pre-veto engine)
      av.medicalFloor = 0
      const { world, rng } = arriveAt('arrive-knob-off', 0)
      tickWeek(world, rng)
      expect(world.pendingTournament).not.toBeNull()
      expect(world.events.some((e) => e.text.includes('not cleared to play'))).toBe(false)

      // ceiling pulled down to the floor: the band is empty, so nobody is ever warned
      av.medicalFloor = savedFloor
      av.medicalWarningCeiling = savedFloor
      expect(medicalClearance(savedFloor)).toBe('clear')
      const quiet = arriveAt('arrive-knob-quiet', savedFloor)
      tickWeek(quiet.world, quiet.rng)
      expect(quiet.world.pendingTournament).not.toBeNull()
      expect(quiet.world.events.some((e) => e.text.startsWith("Doctor's warning"))).toBe(false)
    } finally {
      av.medicalFloor = savedFloor
      av.medicalWarningCeiling = savedCeiling
    }
  })

  it('ZERO new draws: the arrival check cannot move the MAIN weekly stream', () => {
    // The strongest form of the claim – the SAME career, once with the withdrawal firing and once
    // with the floor switched off so she plays instead. The shadow run lives on its own event-scoped
    // stream, and the check itself is integer comparison, so the main sequence must be byte-equal.
    function record(disableFloor: boolean): { draws: number[]; withdrawn: boolean } {
      const av = ECONOMY.availability as { medicalFloor: number }
      const saved = av.medicalFloor
      try {
        if (disableFloor) av.medicalFloor = 0
        const world = createWorld(injuryProofSeed('arrive-draws', 6))
        world.physioActive = false
        world.plan = { train: 85, rest: 15 }
        world.season = []
        const event = injectEvent(world, { week: 6, tier: 'local', deadlineWeek: 3 })
        enterEvent(world, event.id)
        const base = rngFromSeed(world.seed)
        const draws: number[] = []
        const rng = () => {
          const v = base()
          draws.push(v)
          return v
        }
        for (let i = 0; i < 10; i++) {
          if (world.week === 5) world.condition = 0 // wrecked on the eve of the play week
          tickWeek(world, rng)
          if (world.pendingTournament) {
            skipTournament(world)
            closeTournament(world)
          }
        }
        return { draws, withdrawn: world.events.some((e) => e.text.includes('not cleared to play')) }
      } finally {
        av.medicalFloor = saved
      }
    }
    const pulled = record(false)
    const played = record(true)
    expect(pulled.withdrawn).toBe(true) // the branch under test really fired…
    expect(played.withdrawn).toBe(false) // …and really did not, in the reference run
    expect(pulled.draws.length).toBe(played.draws.length)
    expect(hashOf(pulled.draws)).toBe(hashOf(played.draws))
  })
})
