import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  advanceWeeks,
  enterEvent,
  rollInjury,
  resolvePhysio,
  injuryTau,
  ageInjuryFactor,
  consecutivePlayFactor,
  kidAgeYears,
  playedWeeksInTrailing4,
  toSnapshot,
  financeWindow,
  skipTournament,
  closeTournament,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { kitInjuryFactor, kitWearAt } from '../src/engine/equipment'
import { TIERS } from '../src/engine/season/calendar'
// The load wave: the physio's strength is a rung ladder now, not one flat boolean.
import { COACH_TIERS, physioRiskFactor } from '../src/engine/coach'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { PRESETS, stepCareerWeek, EXPENSE_CATS } from '../tools/econ-bench'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { FamilyBackground, InjurySeverity, PlayerProfile, WorldEvent } from '../src/shared/protocol'

// ---------------------------------------------------------------------------
// Season-Life slice C — fatigue-driven injuries + physio.
// All of C's randomness lives on the PRIVATE per-week sub-streams
// `seed:injury:week` / `seed:physio:week`; the MAIN weekly stream must stay
// byte-identical to slice B's frozen capture (C1, blocks merge).
// ---------------------------------------------------------------------------

// FNV-1a over the stringified draw stream (same fingerprint as B1).
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

// B1's frozen reference: seed bench-working-0, weeks 1..52.
// ⚠ RE-PINNED, FOR THE LAST TIME A CALENDAR CHANGE CAN DO IT: 51642 -> 41550 draws (hash
// cae178fc -> e6b0c709), by the AI sub-stream refactor. The canonical AI tournaments moved OFF the
// main weekly stream onto their own event-scoped `seed:aitour:<event.id>` stream, so the calendar's
// size is no longer part of the weekly draw count – which is what forced both earlier re-pins
// (45239 -> 51642 for the J family, and this file's own history before it). What remains on the
// main stream is base costs + cohort drift only: 52 x (4 x 199 + 3) + 2 sponsor-gift draws.
// The INVARIANT this file guards – that C's injury and physio work adds no main-stream draws, and
// that nothing about the player's situation can move the sequence – is untouched and still proven
// by every other test here. kidRank 131 -> 143 (Part A) -> 141 (Part B) -> 140 -> 141 is a
// consequence of the ranking, not of the stream.
//
// ⚠ kidRank RE-PINNED 140 -> 141 by the rival-life slice, deliberately: cohort players now carry
// their own accumulated fatigue and a surface/style modifier into every draw, so the AI brackets
// resolve differently and one more junior ends the year holding counting points. The stream itself
// (count 41550, hash e6b0c709) is untouched – both halves of that slice are pure derivations off
// state the world already holds and draw ZERO RNG, which is exactly what this file guards.
// Full reasoning at the REF declaration in tests/condition.test.ts.
// 141 -> 140 at wave-3 integration: the surface x style table changes which of her matches she wins, so a different junior ends the year holding counting points. The STREAM is untouched (count/hash identical) - only the ranking derived from it moved.
//
// ⚠ kidRank RE-PINNED 140 -> 133 by wave B "first-round loss pays ZERO", deliberately. C1's claim
// is that INJURY and PHYSIO add no main-stream draws, and that claim is untouched: count 41550 and
// hash e6b0c709 still reproduce byte-for-byte. What moved is who holds points – `awardAiPoints`
// writes a row only when `points > 0`, so first-round losers (half of every draw) now bank nothing
// and seven fewer juniors finish the year in the points; the point-less kid shares that larger
// 0-point group's dense rank. Full reasoning at the REF declaration in tests/condition.test.ts.
// ⚠ RE-PINNED 133 -> 135 (29.07, partial seeding). The DRAW SEQUENCE did not move - `count` and
// `hash` above are untouched and still pass, which is the fact this block exists to protect. What
// moved is her RANK, a companion pin carried alongside: the bracket now seeds only the top 8 of 32
// and shuffles everyone else, the kid included, so her results in a 52-week window differ and so
// does the rank they earn. See docs/specs/rank-plateau.md.
// ⚠ RE-PINNED 135 -> 126 (29.07, the two ladders). `count`/`hash`/`head`/`tail` did NOT move; the
// stream is untouched and that is what this block guards. What moved is the MEANING of kidRank: it
// is now her place in the ITF table, not in a single mixed one, so it is a different number about a
// different question. See docs/specs/two-ladders.md.
  // ⚠⚠⚠ AND THE TWO ROUND-15 SLICES BOTH TOUCHED THIS FIELD, from opposite directions. Both notes
  // below are kept because both facts are live: the fifth attribute (v25) re-derived the number and
  // found it unmoved, and the ranking fix changed what the number MEANS. The value here is measured
  // with BOTH in, not carried over from either branch.
//
// ⚠⚠ kidRank RE-PINNED 126 -> 119 (30.07, fix/ranking-truth) - and the re-pin above was WRONG about
// which table 126 came from. `recomputeRankAndMilestones`, the tick's last writer of `world.kidRank`,
// still ranked with no track predicate, so 126 was the MIXED (both-ladders) place while the comment
// claimed ITF. 119 is the ITF place, now by construction: there is one writer. C1's own claim - that
// INJURY and PHYSIO add no main-stream draws - is UNTOUCHED and still proves itself: count 41550 and
// hash e6b0c709 reproduce byte-for-byte, re-derived on this branch both before and after the fix.
// Full reasoning, and the arithmetic that identifies which table each number came from, at the REF
// declaration in tests/condition.test.ts. The one-writer property is now pinned directly by B1c there.
// ⚠ 121, MEASURED WITH BOTH ROUND-15 SLICES IN. The ranking fix alone gives 119; v25's rally term
// changes which juniors end the year holding points, and the two compose to 121. Neither branch was
// wrong - this is what the merged code produces, measured here rather than carried over.
// ⚠ kidRank RE-PINNED 121 -> 120 (30.07, task 55's cohort half). `count` and `hash` are UNTOUCHED and
// still reproduce byte-for-byte - the birth months come off their own sub-stream and the head start is
// post-draw arithmetic. What moved is which juniors hold points, because every rival now sits inside her
// own birth year. Full reasoning at the REF declaration in tests/condition.test.ts.
//
// ⚠⚠ kidRank RE-PINNED AGAIN 120 -> 164 (31.07, task #17, the adult rungs), and `count` 41550 and
// `hash` e6b0c709 are AGAIN untouched and re-derived byte-for-byte on this branch. THE FROZEN CAPTURE
// DID NOT MOVE: the calendar grew from 92 events a season to 139, and since the AI sub-stream
// refactor the calendar's size is no longer part of the weekly draw count at all (see the REF note in
// tests/round9.test.ts, "for the last time a calendar change can do it"). What moved is that a much
// fuller calendar leaves far more juniors holding a counting result, so the tie at the FLOOR of the
// table - which is where a point-less kid sits - is shared by fewer people and its dense rank is
// deeper. Same mechanism as the note above, forty times the scale. Full reasoning at the REF
// declaration in tests/condition.test.ts.
//
// ⚠⚠ kidRank RE-PINNED 164 -> 154 (31.07, §4.1, the junior age cap), and `count` 41550 and `hash`
// e6b0c709 are AGAIN untouched and re-derived byte-for-byte. Full reasoning at the REF declaration
// in tests/condition.test.ts; the short version is that the J rungs are U18 now, so a rival who
// turns 19 stops entering them, her old ITF results roll out of the 52-week window and are never
// replaced, and she falls back to the tie at the floor. The table above the point-less kid is
// therefore SHALLOWER by about ten distinct totals - which is precisely what a real junior ranking
// does when a player ages out, and it is the first time our ITF table has ever done it.
// ⚠ RE-PINNED 154 -> 150 AT THE round-20 MERGE, and the number is why this had to be re-derived
// rather than resolved. `fix/no-double-booking` measured 162 on its base and `feat/junior-age-cap`
// measured 154 on its own; neither is the answer, because BOTH make the table above a point-less kid
// shallower and they stack. A rival can no longer play two of a week's tournaments, and a rival
// turning 19 now ages out of the J rungs and her results roll out of the 52-week window unreplaced -
// so fewer distinct totals sit above a girl who holds none. Taking either side's pin would have
// shipped a number nobody had measured. The STREAM is untouched: count 41550 and hash e6b0c709
// reproduce byte-for-byte, which is what this block actually guards.
// ⚠ RE-AIMED 150 -> 151 BY THE EQUIPMENT / SERVE-SPEED SLICE (docs/specs/equipment-and-serve-speed.md),
// and this is the SECOND time this pin has moved for the reason its own note above predicted: the
// match model gained a leg, so asymmetric matchups resolve differently and a different set of
// juniors ends the year in the points. Two legs were added this time - her kit multiplies her
// attributes at the composition point, and `basePServe` gained a PACE term keyed on the age gap.
//
// ⚠ THE CAPTURE ITSELF DID NOT MOVE, AND THAT WAS CHECKED BEFORE THIS LINE WAS TOUCHED: count 41550
// and hash e6b0c709 reproduce byte-for-byte, verified directly against a raw-tapped 52-tick run. It
// cannot move by construction either - equipment condition is `week - lastPurchaseWeek` over a
// constant, the purchase weeks come off the `seed:gear:<category>` sub-streams that already existed,
// the shoe/injury term is a POST-DRAW multiply on a threshold `rollInjury` has already drawn
// against, and the pace term is pure arithmetic inside `basePServe`. Zero draws are added to, or
// removed from, any stream the weekly tick walks.
//
// So the STREAM is the invariant and the RANK is a measurement: 151 is one place lower off a
// point-less kid in a shallow table, which is what a girl whose strings are four weeks old looks
// like next to a cohort that has no kit at all.
// ⚠ RE-PINNED 151 -> 152 BY R15-6 (01.08, the W-family reprice), the same class of move this pin's
// own history documents twice already. TWO of the three levers reach this fixture and both are
// post-draw: the W availability floors (60/65/70 -> 50/55/60) govern which SIXTEEN-PLUS RIVALS are
// fit to take a W15/W35 draw in the kid's first season, and the W surcharges (6/7/8 -> 4/5/6) set
// what those weeks cost them - so a different set of juniors ends the year in the points and her
// dense ITF place moves by one. Attributed by partial revert (scratchpad probe, R15 report): floors
// alone -> 157, surcharges alone -> 138, the per-family run ladder alone -> no effect at this
// horizon; ALL THREE reverted reproduces 151 exactly, so nothing else in the round touches this
// fixture. THE CAPTURE ITSELF DID NOT MOVE: count 41550 and hash e6b0c709 reproduce byte-for-byte
// (asserted first, in this very test), which is what this block actually guards - fatigue,
// availability and rival condition are all post-draw arithmetic by construction.
// ⚠ THE CROSS-VERSION CONSTANT RETIRED AT v35 (P3, rng-persistence): `count`/`hash` left this
// object because no loaded career depends on the historical draw count any more — the position is
// persisted per career and every C1 test below is PAIRWISE, action arm against baseline arm under
// the same code. The single documented capture (and the whole story of the regime change) lives at
// the REF declaration in tests/condition.test.ts B1. `kidRank` stays: it was never the capture, it
// is the companion MEASUREMENT — "how many AI ended the year holding counting points" — and its
// re-pin history above is exactly why it remains worth pinning.
// ⚠ RE-PINNED 152 -> 138 by W2-LADDER: TIER_LADDER 9 -> 12 re-spaces `tierPhase`, the calendar
// re-deals, and the AI year resolves on different event sub-streams. The MAIN capture is untouched
// (B1 asserts it byte-for-byte); the mechanism note lives at the B1 REF in tests/condition.test.ts.
// ⚠ RE-PINNED 138 -> 137 BY W2-FIELD2 (the W family's entrant windows re-measured). `selectEntrants`
// is ONE function, so a W rung's `entrantPctBand` is read by the CANONICAL `seed:aitour:` brackets
// as well as by her shadow draws: the family's floors rose (w15 0.15 -> 0.35, w35 0.08 -> 0.25, and
// so on up), a different slice of the 199-cohort is therefore drawn into the W events, and
// `resolveDoubleBookings` leaves a different set of girls free for the same week's J draws. A
// different set of juniors ends the year holding counting ITF points and her dense place moves by
// one - the same post-draw composition mechanism every re-pin above records. THE CAPTURE ITSELF IS
// UNTOUCHED: count 41550 and hash e6b0c709 reproduce byte-for-byte.
// ⚠ RE-PINNED 137 -> 125 BY W2-FATIGUE (the fatigue re-price). `recoveryBase` 1 -> 8 reaches every
// body in the world through the one shared condition math, so the strength coupling resolves the
// year's brackets on a fresher field and a different set of juniors ends it holding counting points.
// Same post-draw mechanism as every re-pin above; the full argument lives at the B1 REF in
// tests/condition.test.ts. THE MAIN CAPTURE IS UNTOUCHED (B1 asserts it byte-for-byte).
const REF = { kidRank: 125 }
// ⚠ CHECKED AND HELD AT v25 (30.07, the fifth attribute), and the checking is the point - this
// number was expected to move and did not. `count`/`hash`/`head`/`tail` cannot move by
// construction: v25 adds no draw to any stream the weekly tick walks. Her build's fifth number
// comes off a draw APPENDED to `seed:kid` and her ceiling's off one appended to `seed:potential`
// (appending leaves every earlier draw byte-identical); `growWeek` still spends exactly one luck
// draw for the week; and the COHORT deliberately stores no fifth attribute at all (`AiPlayer =
// Omit<MatchPlayer, 'groundstrokes'>`, derived at match time) so `driftCohort` still spends exactly
// four main-stream draws per player - which is literally what 41550 is made of.
//
// kidRank COULD still have moved, and briefly did: `basePServe` now carries a rally term, so
// asymmetric matchups resolve differently and a different set of juniors can end the year in the
// points. It read 127 mid-slice and came back to 126 once the aggressive baseliner's groundstroke
// cost was split across clay AND grass (match/style.ts) - which is the retune that kept the grass
// window the server's. So this is the pre-v25 value, arrived at again rather than left alone.

function recordRun(mutate?: (w: WorldState) => void, perWeek?: (w: WorldState, week: number) => void): {
  draws: number[]
  world: WorldState
} {
  const world = createWorld('bench-working-0')
  if (mutate) mutate(world)
  const base = rngFromSeed(world.seed)
  const draws: number[] = []
  const rng = () => {
    const v = base()
    draws.push(v)
    return v
  }
  for (let i = 0; i < 52; i++) {
    tickWeek(world, rng)
    if (perWeek) perWeek(world, world.week)
  }
  return { draws, world }
}

function aiResults(world: WorldState) {
  return world.results.filter((r) => r.playerId !== KID_ID)
}

function injectEvent(
  world: WorldState,
  partial: { week: number; tier: TierId; id?: string; deadlineWeek?: number },
): SeasonEvent {
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

function setInjury(world: WorldState, weeksRemaining: number, totalWeeks = weeksRemaining, kind = 'ankle strain'): void {
  world.injury = { kind, severity: 'moderate', weeksRemaining, totalWeeks, sinceWeek: world.week }
}

function bgProfile(background: FamilyBackground): PlayerProfile {
  return {
    kidName: 'Vera',
    kidLastName: 'Martin',
    gender: 'girl',
    country: 'US',
    background,
    coachTier: 'self',
    playStyle: 'all-court',
    birthMonth: 6,
    birthDay: 15,
  }
}

/** [min, max] cents a medical bill can land on: middle-anchored band x the background corridor. */
function corridorBounds(band: readonly [number, number], background: FamilyBackground): [number, number] {
  const [cLo, cHi] = ECONOMY.physio.medicalBgFactor[background]
  return [Math.floor(band[0] * cLo), Math.ceil(band[1] * cHi)]
}

// A reusable lightweight world for direct rollInjury Monte-Carlo (the injury/physio
// sub-streams key off (seed, week) only, so mutating seed/week/state between rolls is
// exactly as deterministic as building a fresh world each time – and far cheaper).
function resetForRoll(world: WorldState, seed: string): void {
  world.seed = seed
  world.week = 0
  world.injury = null
  world.injuryHistory = []
  world.results = []
  world.season = []
  world.entries = []
  world.events = []
  world.nextEventId = 0
  world.financeWeeks = []
  world.fundsCents = 1_000_000_00
  world.physioActive = false
  world.condition = 100
}

const rollWorld = createWorld('c-roll-base')

// ⚠ DERIVED FROM THE KNOBS SINCE W2-FATIGUE, NOT WRITTEN DOWN. It was the literal 0.0864 that the
// shipped trio (base .006 + slope .0009 x 100 fatigue, x0.9 for age 14) happened to produce, and the
// injury re-calibration (docs/specs/fatigue-reprice-2026-08.md §5) moved all three under it: the same
// composition is now 0.0162, and every fixture that hunts a firing seed against it went quiet at once.
// A constant that has to be recomputed by hand whenever the model is tuned is a trap, so it is
// computed here the way `injuryTau` computes it - the fixtures track the engine from now on.
const TAU_C0_AGE14 =
  Math.min(
    ECONOMY.availability.injuryBaseChance + 100 * ECONOMY.availability.injuryFatigueSlope,
    ECONOMY.availability.injuryChanceCap,
  ) * ECONOMY.availability.ageInjuryFactor[14]

/** First seed (prefix-indexed) whose week-1 occurrence roll fires below `threshold`. */
function findFiringSeed(prefix: string, threshold: number, from = 0): string {
  for (let i = from; i < 4000; i++) {
    const seed = `${prefix}-${i}`
    if (rngFromSeed(`${seed}:injury:1`)() < threshold) return seed
  }
  throw new Error('no firing seed found')
}

/** Run one direct roll at (seed, week 1) with condition 0 and return the resulting injury. */
function onsetAt(seed: string, physio: boolean): WorldState['injury'] {
  resetForRoll(rollWorld, seed)
  rollWorld.week = 1
  rollWorld.condition = 0
  rollWorld.physioActive = physio
  rollInjury(rollWorld)
  return rollWorld.injury
}

// ---------------------------------------------------------------------------
// C1 — THE INVARIANT (blocks merge): an injured career and an untouched one
// tap the identical MAIN-stream draw sequence. Injuries/physio draw ONLY from
// the private per-week sub-streams, so nothing here may move.
// ---------------------------------------------------------------------------
// ⚠ CONVERTED TO PAIRWISE A/B AT v35 (P3): every test compares an ACTION-LADEN run against the
// no-action BASELINE under the same code — the property (injuries/physio cannot reach the MAIN
// stream) is exactly what it always was; only the yardstick changed from a cross-version constant
// to the baseline arm beside it.
describe('C1 — main-stream RNG invariance (blocks merge)', () => {
  it('the baseline year is alive, and the rank companion holds', () => {
    const { draws, world } = recordRun()
    // Non-vacuity for every pairwise test below: the year really spends draws, every week.
    expect(draws.length).toBeGreaterThan(52 * 4 * world.cohort.length)
    expect(world.kidRank).toBe(REF.kidRank)
  })

  it('physio on/off and pre-seeded injury history never perturb the main stream (A/B)', () => {
    const base = recordRun()
    const variants: Array<(w: WorldState) => void> = [
      (w) => (w.physioActive = true),
      (w) => (w.physioActive = false),
      (w) => (w.injuryHistory = [{ kind: 'ankle strain', severity: 'moderate', week: 0, weeksOut: 4 }]),
    ]
    for (const mutate of variants) {
      const v = recordRun(mutate)
      expect(v.draws.length).toBe(base.draws.length)
      expect(hashOf(v.draws)).toBe(hashOf(base.draws))
      expect(v.world.cohort).toEqual(base.world.cohort)
      expect(aiResults(v.world)).toEqual(aiResults(base.world))
      expect(v.world.kidRank).toBe(base.world.kidRank)
    }
  })

  it('a mid-run injury (forced) + its rehab billing never perturb the main stream (A/B)', () => {
    const base = recordRun()
    const { draws } = recordRun(undefined, (w, week) => {
      // Force an injury the moment week 10 resolves: the following 6 ticks exercise the
      // full injured path (countdown, rehab billing, recovery event) against live state.
      if (week === 10) setInjury(w, 5, 5)
    })
    expect(draws.length).toBe(base.draws.length)
    expect(hashOf(draws)).toBe(hashOf(base.draws))
  })

  it('rollInjury/resolvePhysio take only `world` – no rng parameter exists to misuse', () => {
    expect(rollInjury.length).toBe(1)
    expect(resolvePhysio.length).toBe(1)
    expect(injuryTau.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// C2 — sub-stream determinism: the injury timeline is a function of (seed, week)
// + the tau state, never of funds/plan; save/reload replays it identically.
// ---------------------------------------------------------------------------
describe('C2 — sub-stream determinism', () => {
  interface Onset {
    week: number
    kind: string
    severity: string
    totalWeeks: number
  }

  function timelineRun(mutate: (w: WorldState) => void, weeks: number): Onset[] {
    const world = createWorld('c2-seed')
    world.physioActive = false
    mutate(world)
    const rng = rngFromSeed(world.seed)
    const onsets: Onset[] = []
    for (let i = 0; i < weeks; i++) {
      world.condition = 35 // pin so tau is identical across variants
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      if (world.injury && world.injury.sinceWeek === world.week) {
        onsets.push({
          week: world.week,
          kind: world.injury.kind,
          severity: world.injury.severity,
          totalWeeks: world.injury.totalWeeks,
        })
      }
    }
    return onsets
  }

  it('occurrence/severity/weeksOut/region identical across funds/plan variants', () => {
    const base = timelineRun(() => {}, 90)
    expect(base.length).toBeGreaterThan(0) // pinned at 35 – injuries genuinely fire
    const variants: Array<(w: WorldState) => void> = [
      (w) => (w.fundsCents = 1),
      (w) => (w.fundsCents = 9_999_999_00),
      (w) => (w.plan = { train: 100, rest: 0 }),
      (w) => (w.plan = { train: 60, rest: 40 }),
    ]
    for (const mutate of variants) {
      expect(timelineRun(mutate, 90)).toEqual(base)
    }
  })

  it('save mid-career, reload, re-tick -> identical injury timeline', () => {
    const record = (world: WorldState, rng: () => number, weeks: number): Onset[] => {
      const onsets: Onset[] = []
      for (let i = 0; i < weeks; i++) {
        world.condition = 35
        tickWeek(world, rng)
        if (world.pendingTournament) {
          skipTournament(world)
          closeTournament(world)
        }
        if (world.injury && world.injury.sinceWeek === world.week) {
          onsets.push({
            week: world.week,
            kind: world.injury.kind,
            severity: world.injury.severity,
            totalWeeks: world.injury.totalWeeks,
          })
        }
      }
      return onsets
    }

    // Uninterrupted run: 80 weeks.
    const wa = createWorld('c2-reload')
    wa.physioActive = false
    const ra = rngFromSeed(wa.seed)
    const fullTimeline = record(wa, ra, 80)
    expect(fullTimeline.length).toBeGreaterThan(0)

    // Interrupted run: 40 weeks, JSON save/reload (migrateSave), then 40 more with the
    // worker's restoreRng recipe (fast-forward a probe world to reposition the main stream).
    const wb = createWorld('c2-reload')
    wb.physioActive = false
    const rb = rngFromSeed(wb.seed)
    const firstHalf = record(wb, rb, 40)
    const reloaded = migrateSave(JSON.parse(JSON.stringify(wb))) // save -> load
    const rc = rngFromSeed(reloaded.seed)
    const probe = createWorld(reloaded.seed)
    for (let i = 0; i < reloaded.week; i++) tickWeek(probe, rc)
    const secondHalf = record(reloaded, rc, 40)
    expect([...firstHalf, ...secondHalf]).toEqual(fullTimeline)
  })
})

// ---------------------------------------------------------------------------
// C3 — fatigue (+ racing) drives injury: Monte-Carlo over 200 seeds, a grinder
// suffers >= 3x the injuries/season of a rested kid.
// ---------------------------------------------------------------------------
describe('C3 — fatigue drives injury (Monte-Carlo, 200 seeds)', () => {
  function season(seed: string, condition: number, play: boolean): { onsets: number; weeksOut: number } {
    resetForRoll(rollWorld, seed)
    let onsets = 0
    let weeksOut = 0
    for (let w = 1; w <= 52; w++) {
      rollWorld.week = w
      rollWorld.condition = condition
      if (rollWorld.injury !== null) weeksOut++
      if (play && rollWorld.injury === null) {
        // she races every healthy week: entered+scheduled this week + a results-ledger
        // trail for the trailing-4 overuse counter.
        rollWorld.season.push({ id: `p-${w}`, week: w, tier: 'local', surface: 'hard', travelCostCents: 0, deadlineWeek: w - 2 })
        rollWorld.entries.push(`p-${w}`)
        rollWorld.results.push({ playerId: KID_ID, week: w, points: 5, tier: 'local' })
      }
      const before = rollWorld.injury
      rollInjury(rollWorld)
      if (before === null && rollWorld.injury !== null) onsets++
    }
    return { onsets, weeksOut }
  }

  it('grinder (condition 45, races weekly) >= 3x rested (condition 85, spaced)', () => {
    let grinder = 0
    let rested = 0
    let grinderWeeksOut = 0
    let restedWeeksOut = 0
    const SEEDS = 200
    for (let i = 0; i < SEEDS; i++) {
      const g = season(`c3-g-${i}`, 45, true)
      const r = season(`c3-r-${i}`, 85, false)
      grinder += g.onsets
      rested += r.onsets
      grinderWeeksOut += g.weeksOut
      restedWeeksOut += r.weeksOut
    }
    expect(rested).toBeGreaterThan(0) // injuries exist even for a careful family
    expect(grinder).toBeGreaterThanOrEqual(rested * 3)
    // weeks lost follow the same ordering (the report's C3 sanity figures).
    expect(grinderWeeksOut).toBeGreaterThan(restedWeeksOut)
  })
})

// ---------------------------------------------------------------------------
// C4 — injured gate + recovery lifecycle.
// ---------------------------------------------------------------------------
describe('C4 — injured gate + recovery', () => {
  it('while injured, enterEvent throws "Injured – …" on every reachable tier and upcoming flags it', () => {
    // local (fresh kid) + national (200 pts kid): both hard-blocked while injured.
    const wl = createWorld('c4-l')
    setInjury(wl, 3, 5)
    const loc = injectEvent(wl, { week: wl.week + 2, tier: 'local' })
    expect(() => enterEvent(wl, loc.id)).toThrow(/^Injured – /)
    expect(toSnapshot(wl).upcoming.find((e) => e.id === loc.id)!.ineligibleReason).toBe('injured')

    const wn = createWorld('c4-n')
    giveKidPoints(wn, 200)
    setInjury(wn, 3, 5)
    const nat = injectEvent(wn, { week: wn.week + 2, tier: 'national' })
    expect(() => enterEvent(wn, nat.id)).toThrow(/^Injured – /)
    expect(toSnapshot(wn).upcoming.find((e) => e.id === nat.id)!.ineligibleReason).toBe('injured')
  })

  it('weeksRemaining decrements each tick; at 0 -> cleared, history entry, recovery event', () => {
    const w = createWorld('c4-rec')
    const rng = rngFromSeed(w.seed)
    setInjury(w, 2, 5, 'knee strain')
    tickWeek(w, rng)
    expect(w.injury?.weeksRemaining).toBe(1)
    tickWeek(w, rng)
    expect(w.injury).toBeNull()
    expect(w.injuryHistory).toHaveLength(1)
    expect(w.injuryHistory[0]).toEqual({ kind: 'knee strain', severity: 'moderate', week: w.week, weeksOut: 5 })
    const rec = w.events.find((e) => e.type === 'recovery')
    expect(rec).toBeDefined()
    expect(rec!.text).toBe('Back on court – cleared to play.')
    expect(rec!.amountCents).toBeUndefined() // recovery costs nothing
  })

  it('the clearing week is a grace week: no occurrence roll fires on it', () => {
    // Pick a seed whose week-1 roll WOULD fire at condition 0 – then clear an injury on
    // week 1 and prove she stays healthy (the roll only fires again next tick).
    const seed = findFiringSeed('c4-grace', TAU_C0_AGE14 * 0.9)
    const w = createWorld(seed)
    w.physioActive = false
    w.condition = 0
    setInjury(w, 1, 1)
    const rng = rngFromSeed(w.seed)
    tickWeek(w, rng) // week 1: countdown hits 0 -> cleared; NO new roll this week
    expect(w.injury).toBeNull()
    expect(w.injuryHistory).toHaveLength(1)
  })

  it('injuryHistory is pruned to the last 20 entries', () => {
    const w = createWorld('c4-prune')
    for (let i = 0; i < 25; i++) {
      setInjury(w, 1, 1, `entry-${i}`)
      w.week += 1
      rollInjury(w) // clears immediately -> history push
    }
    expect(w.injuryHistory).toHaveLength(20)
    expect(w.injuryHistory[0].kind).toBe('entry-5') // oldest 5 pruned away
    expect(w.injuryHistory[19].kind).toBe('entry-24')
  })
})

// ---------------------------------------------------------------------------
// C5 — entered-then-injured: pre-deadline entries are auto-withdrawn+refunded at
// onset; a post-deadline entry walks over (0 points, no travel, no shadow run).
// ---------------------------------------------------------------------------
describe('C5 — entered-then-injured walkover + auto-withdraw', () => {
  it('injury on the play week: no travel, no shadow tournament, walkover event, 0 points', () => {
    const w = createWorld('c5-walk')
    w.season = []
    const ev = injectEvent(w, { week: w.week + 3, tier: 'local', deadlineWeek: w.week + 1 })
    enterEvent(w, ev.id) // entered while healthy, pre-deadline
    // Injury lands AFTER the deadline (week +2), so the entry can no longer be refunded.
    const rng = rngFromSeed(w.seed)
    tickWeek(w, rng) // week +1 (deadline week)
    tickWeek(w, rng) // week +2: post-deadline – force the onset here
    setInjury(w, 5, 5)
    const fundsBefore = w.fundsCents
    tickWeek(w, rng) // week +3: the play week – walkover
    expect(w.pendingTournament).toBeNull()
    const weekEvents = w.events.filter((e) => e.week === w.week)
    expect(weekEvents.some((e) => e.text.startsWith('Travel to'))).toBe(false)
    const walkover = weekEvents.find((e) => e.type === 'injury')
    expect(walkover).toBeDefined()
    expect(walkover!.text).toContain('Walkover')
    expect(w.results.filter((r) => r.playerId === KID_ID)).toHaveLength(0) // 0 points
    expect(w.events.some((e) => e.type === 'match')).toBe(false)
    // no refund either – the fee was forfeited at the deadline (documented in world.ts)
    expect(w.events.some((e) => e.week === w.week && e.text.startsWith('Entry refunded'))).toBe(false)
    // funds this week: income - base costs - gear - rehab, but NO travel charge
    expect(w.fundsCents).not.toBe(fundsBefore - ev.travelCostCents)
  })

  // ⚠ THE SEED SEARCH GREW A SECOND REQUIREMENT (W2-FATIGUE §5), and it is one this fixture always
  // depended on silently: the layoff has to actually COVER the entered week. F45-2 only withdraws
  // entries the injury really reaches, so a seed that fires a 1-week niggle at week 1 leaves a week-6
  // entry standing - correctly. The old search only asked "does the roll fire", and got a long enough
  // layoff by luck; with the re-calibrated tau it drew a different seed and the luck ran out. Asking
  // the engine for both facts is the fix, and it makes the fixture say what it means.
  it('pre-deadline entries are auto-withdrawn and refunded at onset', () => {
    let seed = ''
    for (let i = 0; i < 4000 && seed === ''; i++) {
      const candidate = `c5-onset-${i}`
      const onset = onsetAt(candidate, false)
      if (onset && onset.totalWeeks >= 6) seed = candidate // the layoff reaches the week-6 entry
    }
    expect(seed, 'no seed fires an onset long enough to cover the entered week').not.toBe('')
    const w = createWorld(seed)
    w.physioActive = false
    w.season = []
    const ev = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 4 })
    enterEvent(w, ev.id)
    expect(w.entries).toContain(ev.id)
    w.condition = 0 // max fatigue -> the chosen seed's week-1 roll fires
    const rng = rngFromSeed(w.seed)
    tickWeek(w, rng)
    expect(w.injury).not.toBeNull()
    expect(w.entries).not.toContain(ev.id) // withdrawn at onset
    const refund = w.events.find((e) => e.week === 1 && e.text.startsWith('Entry refunded'))
    expect(refund).toBeDefined()
    expect(refund!.amountCents).toBe(TIERS.local.entryFeeCents)
  })
})

// ---------------------------------------------------------------------------
// C6 — physio ledger + benefit.
// ---------------------------------------------------------------------------
describe('C6 — physio ledger + benefit', () => {
  it('each injured week bills a non-zero physio rehab that lands in the Money physio bucket', () => {
    const w = createWorld('c6-rehab') // default profile: middle
    w.physioActive = false // rehab is billed regardless of the retainer toggle
    setInjury(w, 4, 4)
    const rng = rngFromSeed(w.seed)
    tickWeek(w, rng)
    const rehab = w.events.find((e) => e.week === w.week && e.category === 'physio')
    expect(rehab).toBeDefined()
    expect(rehab!.type).toBe('expense')
    expect(rehab!.text).toBe('Physio / recovery session')
    const [lo, hi] = corridorBounds(ECONOMY.physio.rehabPerWeekCents, 'middle')
    expect(rehab!.amountCents!).toBeGreaterThanOrEqual(-hi)
    expect(rehab!.amountCents!).toBeLessThanOrEqual(-lo)
    // it folds into the persisted finance ledger -> Money breakdown + season funds delta
    const window = financeWindow(w.financeWeeks, 0)
    expect(window.byCategory.physio).toBe(rehab!.amountCents)
    expect(toSnapshot(w).finance.window12w.byCategory.physio).toBe(rehab!.amountCents)
  })

  it('physioActive bills the corridor-scaled retainer each healthy week; off bills nothing', () => {
    for (const background of ['working', 'middle', 'wealthy'] as const) {
      const w = createWorld(`c6-ret-${background}`, bgProfile(background))
      w.physioActive = true
      const [lo, hi] = corridorBounds(ECONOMY.physio.retainerPerWeekCents, background)
      const rng = rngFromSeed(w.seed)
      tickWeek(w, rng)
      const retainer = w.events.find((e) => e.week === w.week && e.category === 'physio')
      expect(retainer).toBeDefined()
      expect(retainer!.amountCents!).toBeGreaterThanOrEqual(-hi)
      expect(retainer!.amountCents!).toBeLessThanOrEqual(-lo)
    }
    const off = createWorld('c6-ret-off')
    off.physioActive = false
    const rng = rngFromSeed(off.seed)
    tickWeek(off, rng)
    expect(off.events.some((e) => e.week === off.week && e.category === 'physio')).toBe(false)
  })

  it('physioActive lowers tau by riskReduction – BY RUNG, and budget is still exactly the old number', () => {
    // ⚠ RE-AIMED BY THE LOAD WAVE, AND STRICTLY WIDENED. `riskReduction` used to be one flat 0.76 for every
    // hired rung - which the load bench showed was the whole reason four rungs and ~$100k of fees produced
    // no difference in injury weeks at all. It scales with the rung now (coach.ts `physioRiskFactor`), so
    // this fixture (`createWorld` with no profile = 'middle') no longer reads 0.76.
    //
    // The guarded fact is unchanged and now checked on all five rungs instead of one - PLUS the anchoring
    // promise the change was made under: BUDGET REPRODUCES THE SHIPPED CONSTANT EXACTLY, so nothing that
    // ships today gets worse. That promise is the load of this test now; if a later tuning pass re-centres
    // the ladder on middle, this is where it has to say so out loud.
    for (const tier of COACH_TIERS) {
      const w = createWorld('c6-tau', { ...DEFAULT_PROFILE, coachTier: tier })
      w.condition = 45
      w.physioActive = false
      const bare = injuryTau(w)
      w.physioActive = true
      expect(injuryTau(w) / bare, tier).toBeCloseTo(physioRiskFactor(tier), 10)
    }
    // the anchor, spelled out
    expect(physioRiskFactor('budget')).toBeCloseTo(ECONOMY.physio.riskReduction, 10)
    // ...and the ladder really is one: each rung protects her at least as well as the one below
    const factors = COACH_TIERS.filter((t) => t !== 'self').map(physioRiskFactor)
    for (let i = 1; i < factors.length; i++) expect(factors[i]).toBeLessThan(factors[i - 1])
  })

  it('physioActive shortens weeksOut: max(1, round(weeksOut * (1 - recoverySpeedup)))', () => {
    // Find a seed where the roll fires under the physio-reduced tau AND the drawn
    // weeks-out is long enough (>= 5) for the 12% cut to actually round down.
    //
    // ⚠ THE SEARCH ASKS THE ENGINE NOW (W2-FATIGUE §5), instead of composing a threshold by hand.
    // It used to hunt a roll below `TAU_C0_AGE14 * riskReduction`, which was a RECONSTRUCTION of
    // `injuryTau` that quietly omitted the terms the real one has grown - the per-rung
    // `physioRiskFactor` and the kit-wear factor - and got away with it only because the shipped tau
    // was big enough to absorb the error. Re-calibrated five times smaller, the reconstruction and
    // the engine no longer agree, and a fixture that hunts the wrong number reports it as a null
    // injury. `onsetAt` IS the engine, so this cannot drift again for any knob.
    let from = 0
    for (;;) {
      if (from > 4000) throw new Error('no seed with a physio-firing roll and a >= 5 week layoff')
      const seed = `c6-speed-${from++}`
      const withPhysio = onsetAt(seed, true)
      if (withPhysio === null) continue // the roll does not clear the physio-reduced threshold
      const without = onsetAt(seed, false)
      if (without!.totalWeeks >= 5) {
        expect(withPhysio.totalWeeks).toBe(
          Math.max(1, Math.round(without!.totalWeeks * (1 - ECONOMY.physio.recoverySpeedup))),
        )
        expect(withPhysio.totalWeeks).toBeLessThan(without!.totalWeeks)
        expect(withPhysio.severity).toBe(without!.severity) // same draws, same band
        expect(withPhysio.kind).toBe(without!.kind)
        break
      }
    }
  })
})

// ---------------------------------------------------------------------------
// C7 — injury flavor: region-composed kinds, lower-limb skew, ankle+knee on top.
// ---------------------------------------------------------------------------
describe('C7 — injury flavor (Monte-Carlo sample)', () => {
  const LOWER = ['ankle', 'knee', 'hamstring', 'calf', 'foot', 'hip']
  const UPPER = ['wrist', 'shoulder', 'elbow', 'forearm']
  const CORE = ['lower back', 'abdominal']
  const PARTS = [...CORE, ...LOWER, ...UPPER] // longest-prefix parts first ('lower back')
  const DESCRIPTORS: Record<InjurySeverity, string[]> = {
    minor: ['niggle', 'soreness'],
    moderate: ['strain'],
    major: ['stress reaction'],
    severe: ['tear'],
  }

  function sample(): { part: string; severity: InjurySeverity; kind: string }[] {
    const out: { part: string; severity: InjurySeverity; kind: string }[] = []
    // ⚠ 140 -> 800 SEEDS (W2-FATIGUE §5). The sample size is not a taste, it is `>= 300 onsets`
    // divided by tau: at condition 0 the re-calibrated model fires on 1.6% of weeks instead of
    // 8.6%, so 140 x 52 rolls yielded 134 injuries where it used to yield ~630. Nothing about the
    // FLAVOUR under test changed - the region table and the descriptor bands are untouched - only
    // how many rolls it takes to see the distribution. Still one rng derive per roll, so this is
    // ~42k cheap pure calls.
    for (let s = 0; s < 800; s++) {
      resetForRoll(rollWorld, `c7-${s}`)
      for (let w = 1; w <= 52; w++) {
        rollWorld.week = w
        rollWorld.condition = 0
        rollWorld.injury = null // independent rolls: onset probability per week, no immunity
        rollInjury(rollWorld)
        // assertion re-widens: the `= null` assignment above narrows the property and TS cannot
        // see that rollInjury mutates it.
        const inj = rollWorld.injury as WorldState['injury']
        if (inj) {
          const part = PARTS.find((p) => inj.kind.startsWith(`${p} `))
          expect(part, `unparseable kind "${inj.kind}"`).toBeDefined()
          out.push({ part: part!, severity: inj.severity as InjurySeverity, kind: inj.kind })
        }
      }
    }
    return out
  }

  it('kinds are region-composed, lower-limb-skewed (~48%), ankle+knee lead the lower share', () => {
    const all = sample()
    expect(all.length).toBeGreaterThan(300) // a real sample

    // every kind is "<part> <descriptor>" with the descriptor matching its severity band
    for (const inj of all) {
      const rest = inj.kind.slice(inj.part.length + 1)
      expect(DESCRIPTORS[inj.severity]).toContain(rest)
    }

    const count = (parts: string[]) => all.filter((i) => parts.includes(i.part)).length
    const lower = count(LOWER)
    const upper = count(UPPER)
    const core = count(CORE)
    expect(lower + upper + core).toBe(all.length)

    // lower-limb share ~0.48 over the sample
    const lowerShare = lower / all.length
    expect(lowerShare).toBeGreaterThan(0.4)
    expect(lowerShare).toBeLessThan(0.56)

    // WTA skew: ankle + knee are the top two lower-limb regions and take the majority
    // of the lower share (0.30 + 0.25 of it by construction).
    const byPart = new Map<string, number>()
    for (const i of all) byPart.set(i.part, (byPart.get(i.part) ?? 0) + 1)
    const lowerSorted = [...LOWER].sort((a, b) => (byPart.get(b) ?? 0) - (byPart.get(a) ?? 0))
    expect(lowerSorted.slice(0, 2).sort()).toEqual(['ankle', 'knee'])
    expect((byPart.get('ankle') ?? 0) + (byPart.get('knee') ?? 0)).toBeGreaterThan(lower / 2)

    // core keeps its lumbar bias
    expect(byPart.get('lower back') ?? 0).toBeGreaterThan(byPart.get('abdominal') ?? 0)

    // the label reads like "ankle strain"
    expect(all.some((i) => i.kind === 'ankle strain')).toBe(true)

    // severity split lands near the owner's 60/30/10 (loose bands – Monte-Carlo)
    const sev = (s: InjurySeverity) => all.filter((i) => i.severity === s).length / all.length
    expect(sev('minor')).toBeGreaterThan(0.5)
    expect(sev('minor')).toBeLessThan(0.7)
    expect(sev('moderate')).toBeGreaterThan(0.2)
    expect(sev('moderate')).toBeLessThan(0.4)
    expect(sev('major') + sev('severe')).toBeLessThan(0.16)
  })
})

// ---------------------------------------------------------------------------
// C8 — the girl injury-age curve (peak 16).
// ---------------------------------------------------------------------------
describe('C8 — age curve', () => {
  it('ageInjuryFactor matches the knob table (peak at 16, default past 18)', () => {
    const t = ECONOMY.availability.ageInjuryFactor
    expect(ageInjuryFactor(14)).toBe(t[14])
    expect(ageInjuryFactor(15)).toBe(t[15])
    expect(ageInjuryFactor(16)).toBe(t[16])
    expect(ageInjuryFactor(17)).toBe(t[17])
    expect(ageInjuryFactor(18)).toBe(t[18])
    expect(ageInjuryFactor(19)).toBe(t.default)
    expect(ageInjuryFactor(25)).toBe(t.default)
    expect(ageInjuryFactor(16)).toBeGreaterThan(ageInjuryFactor(14)) // the peak is real
  })

  it('effective tau two seasons apart differs by exactly the age-factor ratio', () => {
    // ⚠ RE-AIMED, AND THE OLD TITLE WAS THE BUG THE OWNER FOUND IN THE MODEL. It read "age 16 vs age 14"
    // and set `w.week = 0` with the comment `// age 14` - but `DEFAULT_PROFILE.birthMonth` is JUNE, and a
    // June girl in the 14s band is THIRTEEN in the January the career opens in. The test was assuming the
    // band and the girl are the same number, which is exactly what world.ts's age note now separates.
    //
    // The guarded fact - `injuryTau` applies the age curve and nothing else between two weeks - is
    // unchanged and now stated in terms of her REAL ages, so it holds for any birthday instead of only for
    // a January one. Both birthdays are swept, and the January case preserves the original literal reading.
    //
    // ⚠ RE-AIMED AGAIN (equipment slice, docs/specs/equipment-and-serve-speed.md §2). There is now a SECOND
    // week-dependent term in `injuryTau`: her shoes, whose traction decays over their 14-week life and
    // resets on the purchase already on the ledger. Two weeks 104 apart sit at different points of that
    // cycle, so the raw ratio is no longer the age ratio alone - and that is the new behaviour working, not
    // a regression.
    //
    // The guard is DIVIDED rather than loosened: each tau is normalised by its own known kit factor, and
    // the residue must still be EXACTLY the age ratio to ten places. So the assertion still fails the
    // instant a THIRD week-dependent term appears in `injuryTau`, which is the whole thing it was ever
    // protecting. Naming both terms is strictly stronger than tolerating one.
    for (const birthMonth of [1, 6, 12]) {
      const w = createWorld('c8-tau', { ...DEFAULT_PROFILE, birthMonth })
      w.physioActive = false
      w.condition = 60
      w.week = 0
      const kitEarly = kitInjuryFactor(kitWearAt(w.seed, w.profile.background, 0))
      const early = injuryTau(w) / kitEarly
      const ageEarly = kidAgeYears(0, birthMonth)
      w.week = 104
      const kitLate = kitInjuryFactor(kitWearAt(w.seed, w.profile.background, 104))
      const late = injuryTau(w) / kitLate
      const ageLate = kidAgeYears(104, birthMonth)
      expect(ageLate - ageEarly, `${birthMonth}: two seasons is two years`).toBe(2)
      expect(late / early, `birthMonth ${birthMonth}`).toBeCloseTo(
        ageInjuryFactor(ageLate) / ageInjuryFactor(ageEarly),
        10,
      )
      // ...and the kit term is REAL, not a no-op divided out of an unchanged number: the two weeks must
      // genuinely sit at different points of the shoe cycle for this re-aim to have been necessary.
      expect(kitLate, `birthMonth ${birthMonth}: the shoe cycle actually moved`).not.toBeCloseTo(kitEarly, 6)
    }
    // and the owner's own case, spelled out: a December girl really is 13 in the opening January
    expect(kidAgeYears(0, 12)).toBe(13)
    expect(kidAgeYears(0, 1)).toBe(14)
  })

  it('Monte-Carlo direction: more onsets in the age-16 window than the age-14 window', () => {
    function countOnsets(fromWeek: number): number {
      let onsets = 0
      for (let s = 0; s < 400; s++) {
        resetForRoll(rollWorld, `c8mc-${s}`)
        for (let i = 0; i < 52; i++) {
          rollWorld.week = fromWeek + i
          rollWorld.condition = 60
          rollWorld.injury = null
          rollInjury(rollWorld)
          if (rollWorld.injury) onsets++
        }
      }
      return onsets
    }
    const at14 = countOnsets(0) // weeks 0..51 -> age 14
    const at16 = countOnsets(104) // weeks 104..155 -> age 16
    expect(at14).toBeGreaterThan(0)
    expect(at16).toBeGreaterThan(at14 * 1.15) // expected ratio 1.2/0.9 ≈ 1.33
  })
})

// ---------------------------------------------------------------------------
// C9 — consecutive-competition load (trailing-4 counter off the results ledger).
// ---------------------------------------------------------------------------
describe('C9 — consecutive load', () => {
  it('factor table: 0-1 -> x1.0, 2 -> x1.2, 3 -> x1.5, 4 -> x1.8 (clamped above)', () => {
    expect(consecutivePlayFactor(0)).toBe(1.0)
    expect(consecutivePlayFactor(1)).toBe(1.0)
    expect(consecutivePlayFactor(2)).toBe(1.2)
    expect(consecutivePlayFactor(3)).toBe(1.5)
    expect(consecutivePlayFactor(4)).toBe(1.8)
    expect(consecutivePlayFactor(9)).toBe(1.8)
  })

  it('counter derives from the KID results ledger over the trailing 4 weeks incl. this one', () => {
    const w = createWorld('c9')
    w.week = 30
    w.results = []
    expect(playedWeeksInTrailing4(w)).toBe(0)

    // 3 past competed weeks + this week's entered event = 4
    w.results.push(
      { playerId: KID_ID, week: 27, points: 10, tier: 'local' },
      { playerId: KID_ID, week: 28, points: 10, tier: 'local' },
      { playerId: KID_ID, week: 29, points: 10, tier: 'local' },
    )
    expect(playedWeeksInTrailing4(w)).toBe(3)
    const ev = injectEvent(w, { week: 30, tier: 'local' })
    w.entries.push(ev.id)
    expect(playedWeeksInTrailing4(w)).toBe(4)

    // outside the window / non-kid results never count; duplicates collapse per week
    const w2 = createWorld('c9-b')
    w2.week = 30
    w2.results = [
      { playerId: KID_ID, week: 26, points: 10 }, // too old (window is 27..30)
      { playerId: 'ai-3', week: 28, points: 10 }, // not the kid
      { playerId: KID_ID, week: 29, points: 10 },
      { playerId: KID_ID, week: 29, points: 5 }, // same week counts once
      { playerId: KID_ID, week: 27, points: 10 },
    ]
    expect(playedWeeksInTrailing4(w2)).toBe(2)
    expect(injuryTau(w2) / injuryTau(w)).toBeGreaterThan(0) // both pure, no draws
  })

  it('a 4-of-4 racer carries x1.8 into tau vs x1.0 for a spaced schedule', () => {
    const w = createWorld('c9-tau')
    w.physioActive = false
    w.condition = 60
    w.week = 30
    w.results = []
    const spaced = injuryTau(w)
    w.results = [
      { playerId: KID_ID, week: 27, points: 10 },
      { playerId: KID_ID, week: 28, points: 10 },
      { playerId: KID_ID, week: 29, points: 10 },
      { playerId: KID_ID, week: 30, points: 10 },
    ]
    expect(injuryTau(w) / spaced).toBeCloseTo(1.8, 10)
  })
})

// ---------------------------------------------------------------------------
// C10 — one-time onset treatment cost.
// ---------------------------------------------------------------------------
describe('C10 — onset treatment cost', () => {
  /** Direct-roll an onset and capture the events it emitted. */
  function onsetEvents(seed: string, week: number): { injury: WorldState['injury']; events: WorldEvent[] } {
    resetForRoll(rollWorld, seed)
    rollWorld.week = week
    rollWorld.condition = 0
    const before = rollWorld.events.length
    rollInjury(rollWorld)
    return { injury: rollWorld.injury, events: rollWorld.events.slice(before) }
  }

  function findOnsetOfSeverity(want: (s: string) => boolean): { injury: NonNullable<WorldState['injury']>; events: WorldEvent[] } {
    for (let s = 0; s < 3000; s++) {
      for (let w = 1; w <= 8; w++) {
        const { injury, events } = onsetEvents(`c10-${s}`, w)
        if (injury && want(injury.severity)) return { injury, events }
      }
    }
    throw new Error('no onset of wanted severity found')
  }

  it('a moderate+ onset bills a one-time in-range physio expense; minor bills none', () => {
    for (const severity of ['moderate', 'major', 'severe'] as const) {
      const { events } = findOnsetOfSeverity((s) => s === severity)
      const onset = events.find((e) => e.text === 'Medical – scans and treatment')
      expect(onset, `${severity} onset bill`).toBeDefined()
      expect(onset!.type).toBe('expense')
      expect(onset!.category).toBe('physio')
      const [lo, hi] = corridorBounds(ECONOMY.physio.onsetCostCents[severity], 'middle') // rollWorld is middle
      expect(onset!.amountCents!).toBeGreaterThanOrEqual(-hi)
      expect(onset!.amountCents!).toBeLessThanOrEqual(-lo)
      expect(onset!.amountCents!).toBeLessThan(0)
    }
    const minor = findOnsetOfSeverity((s) => s === 'minor')
    expect(minor.events.some((e) => e.text === 'Medical – scans and treatment')).toBe(false)
    expect(minor.events.some((e) => e.type === 'injury')).toBe(true) // the news beat still lands
  })

  it('the onset bill is IN ADDITION to weekly rehab, and both fold into the physio bucket', () => {
    // Full-tick integration: a seed whose week-1 roll fires with a moderate+ band.
    let seed = ''
    for (let s = 0; s < 3000 && !seed; s++) {
      const candidate = `c10-tick-${s}`
      const { injury } = onsetEvents(candidate, 1)
      if (injury && injury.severity !== 'minor') seed = candidate
    }
    expect(seed).not.toBe('')
    const w = createWorld(seed)
    w.physioActive = false
    w.season = []
    w.condition = 0
    const rng = rngFromSeed(w.seed)
    tickWeek(w, rng)
    expect(w.injury).not.toBeNull()
    const physioEvents = w.events.filter((e) => e.week === 1 && e.category === 'physio')
    expect(physioEvents).toHaveLength(2) // onset bill + weekly rehab
    expect(physioEvents.some((e) => e.text === 'Medical – scans and treatment')).toBe(true)
    expect(physioEvents.some((e) => e.text === 'Physio / recovery session')).toBe(true)
    const folded = financeWindow(w.financeWeeks, 0).byCategory.physio
    expect(folded).toBe(physioEvents.reduce((s, e) => s + (e.amountCents ?? 0), 0))
  })
})

// ---------------------------------------------------------------------------
// C11 — medical wealth corridors (mirror of the travelBgFactor corridor test):
// same (seed, week, severity), same base draw + same roll -> disjoint corridors
// order every medical bill working < middle < wealthy.
// ---------------------------------------------------------------------------
describe('C11 — medical corridors', () => {
  const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']

  function physioBill(seed: string, background: FamilyBackground, injured: boolean): number {
    const w = createWorld(seed, bgProfile(background))
    w.week = 5
    w.physioActive = true
    if (injured) setInjury(w, 3, 3)
    const before = w.events.length
    resolvePhysio(w)
    const bill = w.events.slice(before).find((e) => e.category === 'physio')
    expect(bill).toBeDefined()
    return -bill!.amountCents!
  }

  it('weekly rehab orders working < middle < wealthy off the same roll, inside band x corridor', () => {
    const costs = BACKGROUNDS.map((bg) => physioBill('c11-rehab', bg, true))
    expect(costs[0]).toBeLessThan(costs[1])
    expect(costs[1]).toBeLessThan(costs[2])
    BACKGROUNDS.forEach((bg, i) => {
      const [lo, hi] = corridorBounds(ECONOMY.physio.rehabPerWeekCents, bg)
      expect(costs[i]).toBeGreaterThanOrEqual(lo)
      expect(costs[i]).toBeLessThanOrEqual(hi)
    })
  })

  it('the healthy retainer orders working < middle < wealthy, inside band x corridor', () => {
    const costs = BACKGROUNDS.map((bg) => physioBill('c11-ret', bg, false))
    expect(costs[0]).toBeLessThan(costs[1])
    expect(costs[1]).toBeLessThan(costs[2])
    BACKGROUNDS.forEach((bg, i) => {
      const [lo, hi] = corridorBounds(ECONOMY.physio.retainerPerWeekCents, bg)
      expect(costs[i]).toBeGreaterThanOrEqual(lo)
      expect(costs[i]).toBeLessThanOrEqual(hi)
    })
  })

  it('the onset treatment bill orders working < middle < wealthy for the same injury', () => {
    // Find a (seed, week 1) whose roll fires with a moderate+ band (tau is background-independent,
    // so the same seed produces the SAME injury for all three families).
    let seed = ''
    for (let s = 0; s < 3000 && !seed; s++) {
      const candidate = `c11-onset-${s}`
      resetForRoll(rollWorld, candidate)
      rollWorld.week = 1
      rollWorld.condition = 0
      rollInjury(rollWorld)
      if (rollWorld.injury && rollWorld.injury.severity !== 'minor') seed = candidate
    }
    expect(seed).not.toBe('')
    const results = BACKGROUNDS.map((bg) => {
      const w = createWorld(seed, bgProfile(bg))
      w.physioActive = false
      w.week = 1
      w.condition = 0
      rollInjury(w)
      expect(w.injury).not.toBeNull()
      const onset = w.events.find((e) => e.text === 'Medical – scans and treatment')
      expect(onset).toBeDefined()
      return { severity: w.injury!.severity as InjurySeverity, kind: w.injury!.kind, cost: -onset!.amountCents! }
    })
    // identical injury across families...
    expect(results[0].severity).toBe(results[1].severity)
    expect(results[1].severity).toBe(results[2].severity)
    expect(results[0].kind).toBe(results[2].kind)
    // ...but corridor-ordered bills
    expect(results[0].cost).toBeLessThan(results[1].cost)
    expect(results[1].cost).toBeLessThan(results[2].cost)
    results.forEach((r, i) => {
      const [lo, hi] = corridorBounds(ECONOMY.physio.onsetCostCents[r.severity], BACKGROUNDS[i])
      expect(r.cost).toBeGreaterThanOrEqual(lo)
      expect(r.cost).toBeLessThanOrEqual(hi)
    })
  })
})

// ---------------------------------------------------------------------------
// Season wrap: weeksInjured (optional SeasonSummary stat – no schema bump).
// ---------------------------------------------------------------------------
describe('SeasonSummary.weeksInjured', () => {
  it('accumulates the season\'s injured weeks and lands on the wrap summary', () => {
    const w = createWorld('wrap-inj')
    const rng = rngFromSeed(w.seed)
    while (w.week < 10) {
      tickWeek(w, rng)
      if (w.pendingTournament) {
        skipTournament(w)
        closeTournament(w)
      }
    }
    w.injury = null // make room for a clean forced injury
    setInjury(w, 4, 4) // injured weeks 10..13, cleared on 14
    while (w.week < 49) {
      tickWeek(w, rng)
      if (w.pendingTournament) {
        skipTournament(w)
        closeTournament(w)
      }
    }
    expect(w.lastSeasonSummary).not.toBeNull()
    expect(w.lastSeasonSummary!.weeksInjured).toBe(4)
  })

  it('a clean season reports 0 weeks injured', () => {
    const w = createWorld('wrap-clean')
    w.physioActive = false
    const rng = rngFromSeed(w.seed)
    // keep her healthy: clear any (rare) random injury before it can accumulate –
    // this is a stat test, not an occurrence test.
    while (w.week < 49) {
      w.injury = null
      w.condition = 100
      tickWeek(w, rng)
      w.injury = null
      if (w.pendingTournament) {
        skipTournament(w)
        closeTournament(w)
      }
    }
    expect(w.lastSeasonSummary).not.toBeNull()
    expect(w.lastSeasonSummary!.weeksInjured ?? 0).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// advanceWeeks stops on a fresh injury ('injury' stop reason).
// ---------------------------------------------------------------------------
describe('advanceWeeks injury stop', () => {
  it('a fresh injury halts an in-flight advance with stopReason "injury"', () => {
    const seed = findFiringSeed('adv-inj', TAU_C0_AGE14 * 0.9)
    const w = createWorld(seed)
    w.physioActive = false
    w.condition = 0
    const stop = advanceWeeks(w, rngFromSeed(w.seed), 4)
    expect(stop).toContain('injury')
    expect(w.week).toBe(1)
    expect(w.injury).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Bench wiring: the physio bucket exists and the entry policy tolerates injury.
// ---------------------------------------------------------------------------
describe('bench — physio bucket + injured-week tolerance', () => {
  it('EXPENSE_CATS carries the physio bucket', () => {
    expect(EXPENSE_CATS).toContain('physio')
  })

  it('stepCareerWeek skips entries while injured instead of throwing', () => {
    const preset = PRESETS.find((p) => p.background === 'middle')!
    const w = createWorld('bench-inj-tolerance')
    w.physioActive = false
    setInjury(w, 6, 6)
    injectEvent(w, { week: w.week + 2, tier: 'local', deadlineWeek: w.week + 1 })
    expect(preset).toBeDefined()
    expect(() => stepCareerWeek(w, rngFromSeed(w.seed))).not.toThrow()
    expect(w.entries).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// UI wiring (source-level guards, mirroring B7's pattern).
// ---------------------------------------------------------------------------
describe('UI wiring', () => {
  it('MoneyScreen has a physio breakdown bucket', () => {
    const src = readFileSync(new URL('../src/components/screens/MoneyScreen.vue', import.meta.url), 'utf8')
    expect(src).toContain("'physio'")
  })

  it('SeasonSummaryDialog surfaces weeksInjured', () => {
    const src = readFileSync(new URL('../src/components/SeasonSummaryDialog.vue', import.meta.url), 'utf8')
    expect(src).toContain('weeksInjured')
  })

  it('the injured WHY reaches Home through the D1 note (R13-3 re-aim: the chip left the row)', () => {
    // ⚠ RE-AIMED by R13-3 (28.07). This pin used to hold Home's availability chip to
    // `injury.kind` + a weekLabel()-formatted return week. The owner dropped the chip from Home's
    // condition row (the squares + the D1 note carry the state; the chip duplicated both), so what
    // the pin now asserts is the SAME guarantee through its surviving surface: the engine's D1
    // note names the kind and the clock, and Home renders that note verbatim. The chip idiom
    // itself lives on on the Season screen's layoff plaques (round12-view pins it there).
    const src = readFileSync(new URL('../src/components/screens/HomeScreen.vue', import.meta.url), 'utf8')
    expect(src).not.toContain('avail-chip')
    expect(src).toContain('diary.conditionNote')
    const diary = readFileSync(new URL('../src/engine/diary.ts', import.meta.url), 'utf8')
    expect(diary).toContain('Out with the ${f.injured?.kind')
    expect(diary).toContain("weeksRemaining ?? 1, 'week'")
    // R9-5 (re-pinned deliberately): the physio toggle + retainer cost moved to MoneyScreen's
    // Budget section – a spending decision lives with the money.
    const money = readFileSync(new URL('../src/components/screens/MoneyScreen.vue', import.meta.url), 'utf8')
    expect(money).toContain('retainerPerWeekCents')
    expect(money).toContain('Budget')
    expect(src).not.toContain('retainerPerWeekCents')
  })

  it('player-facing copy never uses the long dash', () => {
    for (const file of [
      '../src/components/screens/HomeScreen.vue',
      '../src/components/screens/SeasonScreen.vue',
      '../src/components/SeasonSummaryDialog.vue',
    ]) {
      const src = readFileSync(new URL(file, import.meta.url), 'utf8')
      expect(src.includes('—')).toBe(false)
    }
  })
})
