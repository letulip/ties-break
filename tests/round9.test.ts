import { describe, it, expect } from 'vitest'
import { componentLogic } from './worldSource'
import type { KidSkills } from '../src/engine/development'
import { existsSync, readFileSync } from 'node:fs'
import { portraitStage } from '../src/shared/avatarEmotion'
import {
  createWorld,
  tickWeek,
  enterEvent,
  skipEvent,
  skipTournament,
  closeTournament,
  revealTournamentRound,
  accrueCondition,
  matchDrain,
  tournamentRunStrain,
  runFatigueExtra,
  restRecoveryBonus,
  conditionMatchFactor,
  kidMatchPlayer,
  toSnapshot,
  financeWindow,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { coachMatchEdge } from '../src/engine/world/player'
import { applyKit, FRESH_KIT, kitMultipliers, kitWearAt } from '../src/engine/equipment'
import { ECONOMY } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import { INCOME_CATS } from '../tools/econ-bench'
import { fnv1aHex } from './helpers/hash'

// ---------------------------------------------------------------------------
// Round-9 pt3 — engine pack: savings interest (R9-1), per-match tournament
// strain (R9-7), recovery re-tune (R9-10), physio condition bonus (R9-14),
// match-strength coupling ON (R9-19), skip-at-event-week (R9-9) and the loud
// injury stop's UI wiring (R9-21a).
//
// RNG discipline: NOTHING in this pack draws from the MAIN weekly stream —
// interest is deterministic, strain/recovery/physio-bonus are pure arithmetic,
// and the coupling only scales the kid's MatchPlayer on the EVENT-scoped
// `seed:kidtour` stream. The B1/C1 freezes (seed bench-working-0) stay green;
// the skip test below re-proves the capture.
// ---------------------------------------------------------------------------

// FNV-1a over the stringified draw stream (same fingerprint as B1/C1). The hash lives in
// tests/helpers/hash.ts.
function hashOf(draws: number[]): string {
  return fnv1aHex(draws.map((d) => d.toString()).join(','))
}
// ⚠ RE-PINNED, FOR THE LAST TIME A CALENDAR CHANGE CAN DO IT: 51642 -> 41550 (hash cae178fc ->
// e6b0c709) by the AI sub-stream refactor – the canonical AI tournaments now run on their own
// event-scoped `seed:aitour:<event.id>` stream, so the calendar's size is no longer part of the
// weekly draw count (the flaw that forced the earlier 45239 -> 51642 move). R9-9's own claim –
// that a post-deadline SKIP never perturbs the stream – is unchanged and still proven below.
// Full reasoning at the REF declaration in tests/condition.test.ts.
//
// ⚠ AND THEN THE CONSTANT ITSELF RETIRED, AT v35 (P3, rng-persistence): the REF that lived on this
// line is gone because no loaded career depends on the historical draw count any more — the
// position is persisted per career, and the skip test below is PAIRWISE now: the skipping career
// against the never-entered baseline, same harness, same code, byte-identical MAIN taps. The one
// documented capture lives at the REF declaration in tests/condition.test.ts B1.

/** Enter the earliest still-open local event and tick until its week spawns the reveal.
 *  BOUNDED: a random injury before the event week would auto-withdraw the entry (or turn the
 *  play week into a walkover) and the reveal would never spawn – the deterministic seeds below
 *  are chosen so that never happens; the guard fails loudly instead of spinning. */
function tickToPending(seed: string, mutate?: (w: WorldState) => void): {
  world: WorldState
  rng: Rng
  eventId: string
  travelCostCents: number
  /** ⚠ Phase 4 (v19): she DEVELOPS every week, and the tick grows her (step 3b) AFTER the shadow
   *  tournament runs (step 2) - you do not improve halfway through a tournament. So a snapshot
   *  taken inside the tick belongs to the build she woke up with, and anything comparing against it
   *  must use THIS, not `world.skills` afterwards. */
  skillsAtEntry: KidSkills
} {
  const world = createWorld(seed)
  if (mutate) mutate(world)
  const target = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)!
  enterEvent(world, target.id)
  const rng = rngFromSeed(world.seed)
  let skillsAtEntry = { ...world.skills }
  for (let i = 0; i < 12 && !world.pendingTournament; i++) {
    skillsAtEntry = { ...world.skills }
    tickWeek(world, rng)
  }
  if (!world.pendingTournament) throw new Error(`seed ${seed}: reveal never spawned (injury got in the way?) – pick another seed`)
  return { world, rng, eventId: target.id, travelCostCents: target.travelCostCents, skillsAtEntry }
}

// ---------------------------------------------------------------------------
// R9-1 — savings interest.
// ---------------------------------------------------------------------------
describe('R9-1 — savings interest', () => {
  it('a positive balance earns round(funds × apyWeekly) as an income event, category interest', () => {
    const w = createWorld('r9-interest') // middle: $25,000 start
    const carriedIn = w.fundsCents
    const expected = Math.round(carriedIn * ECONOMY.savings.apyWeekly)
    expect(expected).toBeGreaterThanOrEqual(1)
    tickWeek(w, rngFromSeed(w.seed))
    const ev = w.events.find((e) => e.week === 1 && e.category === 'interest')
    expect(ev).toBeDefined()
    expect(ev!.type).toBe('income')
    expect(ev!.text).toBe('Savings interest')
    expect(ev!.amountCents).toBe(expected)
  })

  it('interest is computed on the CARRIED-IN balance, before the week\'s other flows', () => {
    // Week 2's interest must key off funds at the END of week 1 (post all week-1 flows),
    // not off any intra-week-2 value.
    const w = createWorld('r9-interest-carry')
    const rng = rngFromSeed(w.seed)
    tickWeek(w, rng)
    const endOfW1 = w.fundsCents
    tickWeek(w, rng)
    const ev = w.events.find((e) => e.week === 2 && e.category === 'interest')
    expect(ev!.amountCents).toBe(Math.round(endOfW1 * ECONOMY.savings.apyWeekly))
  })

  it('a negative or zero balance earns nothing', () => {
    for (const funds of [-100_00, 0]) {
      const w = createWorld(`r9-interest-neg-${funds}`)
      w.fundsCents = funds
      tickWeek(w, rngFromSeed(w.seed))
      expect(w.events.some((e) => e.category === 'interest')).toBe(false)
    }
  })

  it('sub-cent interest is not emitted (round() < 1)', () => {
    const w = createWorld('r9-interest-tiny')
    w.fundsCents = 500 // 500¢ × 0.0006 = 0.3 → round 0 → nothing
    tickWeek(w, rngFromSeed(w.seed))
    expect(w.events.some((e) => e.category === 'interest')).toBe(false)
  })

  it('folds into the finance ledger as an income-side category (Money breakdown + bench)', () => {
    const w = createWorld('r9-interest-fold')
    const rng = rngFromSeed(w.seed)
    tickWeek(w, rng)
    tickWeek(w, rng)
    const win = financeWindow(w.financeWeeks, 0)
    expect(win.byCategory.interest ?? 0).toBeGreaterThan(0)
    // income side, never expense
    const snapWin = toSnapshot(w).finance.window12w
    expect(snapWin.incomeCents).toBeGreaterThanOrEqual(snapWin.byCategory.interest ?? 0)
    // the bench's exhaustive income list carries the new category
    expect(INCOME_CATS).toContain('interest')
  })

  it('draws zero RNG: the interest step never touches the main stream', () => {
    // Identical draw streams whether the balance is huge (interest fires) or negative
    // (it never does) — the funds-variant arm of B1, re-proven against the new step.
    const record = (funds: number): string => {
      const w = createWorld('r9-interest-rng')
      w.fundsCents = funds
      const base = rngFromSeed(w.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      for (let i = 0; i < 20; i++) tickWeek(w, rng)
      return hashOf(draws)
    }
    expect(record(9_999_999_00)).toBe(record(-1_00))
  })
})

// ---------------------------------------------------------------------------
// R9-10 / R9-14 — recovery (owner redesign: time-based, integer) + physio bonus.
// Recovery = 2 always, + the train/rest slider bonus on MATCH-FREE weeks only
// (rest >= 40 → +2, >= 25 → +1, below → 0; threshold, never interpolated),
// + 2 while physioActive, + 1 on blackout weeks. The slider no longer drains.
// ---------------------------------------------------------------------------
describe('R9-10/R9-14 — time-based recovery + physio bonus', () => {
  it('match-free weeks: grind 85/15 → +8, balanced 75/25 → +9, light 60/40 → +10 (the W2 re-price)', () => {
    // RE-PINNED 25.07 (V2.1: recoveryBase 2 → 1) – the owner's "все чуть ниже к концу сезона".
    // ⚠ RE-PINNED AGAIN 03.08 (W2-FATIGUE: recoveryBase 1 → 8, docs/specs/fatigue-reprice-2026-08.md
    // §3). The SHAPE under test is untouched and is the only thing this case was ever about - the
    // slider's threshold ladder (+0/+1/+2, never interpolated) sits on top of the base exactly as
    // before. What moved is the base, and it moved because the owner's season equation demands it:
    // at the shipped 1 a rest week returned 3 against an average professional event of 20, so no
    // schedule could accumulate fatigue AND be recoverable over an off-season.
    const cases: Array<{ plan: { train: number; rest: number }; gain: number }> = [
      { plan: { train: 85, rest: 15 }, gain: 8 }, // base 8 + slider 0
      { plan: { train: 75, rest: 25 }, gain: 9 }, // base 8 + slider 1
      { plan: { train: 60, rest: 40 }, gain: 10 }, // base 8 + slider 2
    ]
    for (const { plan, gain } of cases) {
      const w = createWorld(`r9-rec-${plan.rest}`)
      w.physioActive = false
      w.condition = 50
      w.plan = plan
      accrueCondition(w, false)
      expect(w.condition).toBe(50 + gain)
    }
  })

  it('a match week earns NO base and NO slider bonus – V2 shipped: tournament = travel + competition', () => {
    // RE-PINNED 25.07 (owner "V2 хорош"): matchWeekRecoveryBase went 2 → 0, so a played week
    // now recovers nothing at all on its own (physio/blackout still add on top).
    const w = createWorld('r9-rec-match')
    w.physioActive = false
    w.condition = 50
    w.plan = { train: 60, rest: 40 } // would be +2 slider on a free week
    accrueCondition(w, true)
    expect(w.condition).toBe(50) // matchWeekRecoveryBase 0 – nothing accrues
    expect(ECONOMY.condition.matchWeekRecoveryBase).toBe(0)
  })

  it('R9-14: physioActive adds conditionBonusPerWeek = 1 (the billed retainer, V2-tuned)', () => {
    // RE-PINNED 25.07: was 2 – at 2 the retainer alone erased every policy difference on
    // hired-coach profiles (fatigue-bench finding), so the V2 flip tuned it to 1.
    const w = createWorld('r9-physio-bonus')
    w.condition = 50
    w.plan = { train: 75, rest: 25 }
    w.physioActive = true
    accrueCondition(w, false)
    // ⚠ RE-PINNED 53 -> 60 (W2-FATIGUE: recoveryBase 1 -> 8). The retainer's OWN number is what this
    // case is about and it is untouched at 1, asserted on the next line; only the base under it moved.
    expect(w.condition).toBe(60) // 8 base + 1 slider + 1 physio
    expect(ECONOMY.physio.conditionBonusPerWeek).toBe(1)
  })

  it('a blackout week adds +1; everything clamps at 100', () => {
    const w = createWorld('r9-rec-blackout')
    w.physioActive = false
    w.plan = { train: 75, rest: 25 }
    w.week = 49 // off-season → blackout
    w.condition = 50
    accrueCondition(w, false)
    // ⚠ RE-PINNED 53 -> 60 (W2-FATIGUE: recoveryBase 1 -> 8). `blackoutBonus` itself is untouched at
    // 1 - the off-season's edge over an ordinary rest week is the same one point it always was.
    expect(w.condition).toBe(60) // 8 base + 1 slider + 1 blackout
    w.condition = 99
    accrueCondition(w, false)
    expect(w.condition).toBe(100) // clamped
  })
})

// ---------------------------------------------------------------------------
// R9-7 — match-based fatigue (owner redesign, integer per match), applied when
// the run COMMITS (finalize). matchDrain = 2 (straight sets, no TB) | 3 (a
// 3-setter OR a TB in a 2-setter) | 4 (more than 2 TB sets), + the tier's
// per-match surcharge (local 1 / regional 2 / national 3 / j30 3 / j60 4 / j300 5).
//
// ⚠ RE-PINNED 03.08 BY W2-WINDOW, the DOMESTIC half only (owner: «как для local, Regional и national
// мы могли бы легко брать больше condition за них... это сделало бы вещи чуть сложнее и интереснее»).
// 0/1/2 -> 1/2/3, so every Local/Regional/National number in this block moved by exactly one. The J
// surcharges did not move at all, and the SHAPE this block is about - grade the scoreline, then
// surcharge per tier - is untouched, exactly as it was through the base raise below.
//
// ⚠ RE-PINNED 26.07 by the MATCH BASE RAISE (owner decision): straightSets 1 → 2 and, because his
// rule "+1 for a TB or a third set" is unchanged, hardMatch 2 → 3. extraTiebreaks stays 1 and
// tierMatchFatigue is untouched, so every number in this block moved by exactly one — the SHAPE
// (grade the scoreline, then surcharge per tier) is the thing under test and it did not change.
// ---------------------------------------------------------------------------
describe('R9-7 — match-based fatigue', () => {
  it('matchDrain grades the scoreline: 3 easy, 4 hard, 5 a three-tiebreak epic (Local + its 1)', () => {
    expect(matchDrain('local', '6-4 6-2')).toBe(3) // straight sets, no TB
    expect(matchDrain('local', '7-6 6-4')).toBe(4) // TB in a 2-setter
    expect(matchDrain('local', '6-4 3-6 6-2')).toBe(4) // 3 sets
    expect(matchDrain('local', '7-6 6-7 7-6')).toBe(5) // 3 TB sets → +1 extra
    expect(matchDrain('local', '7-6 6-7 6-3')).toBe(4) // 2 TBs is still just a hard match
  })

  it('the tier surcharge is PER MATCH: hardest national match = 7', () => {
    expect(matchDrain('regional', '6-4 6-2')).toBe(4) // 2 + 2
    expect(matchDrain('national', '6-4 6-2')).toBe(5) // 2 + 3
    // RE-PINNED 5 → 6: the owner's original "hardest national match" check, one rung higher. His
    // "a five-match National run maxes at 25" was this number × 5 at the OLD base; the same run is
    // now 30 per-match (+ the cumulative ladder) – see docs/specs/fatigue-reference.md.
    // RE-PINNED AGAIN 6 → 7 by W2-WINDOW's domestic re-price (surcharge 2 → 3).
    expect(matchDrain('national', '7-6 6-7 7-6')).toBe(7) // 4 + 3
    // RE-PINNED by ladder-up Part B: the inert `itf` placeholder became the J family, and its
    // +3 surcharge carried over to j30 unchanged (j60 +4, j300 +5 extrapolate above it).
    expect(matchDrain('j30', '6-4 6-2')).toBe(5) // 2 + 3
    // a record without a score (defensive) counts as straight sets
    expect(matchDrain('national', undefined)).toBe(5)
  })

  // ⚠ RE-PINNED 26.07 by the CUMULATIVE RUN FATIGUE ladder (owner idea; see the dedicated block
  // below): the per-match drains are unchanged, but a run now also pays the ladder's extra per
  // SUBSEQUENT match. Variant C ([0,1,1,2,2], +6 over five matches) ships as the default, so the
  // owner's "five-match National of epics" check moves 25 -> 31 and the 2-match local 3 -> 4.
  // ⚠ RE-PINNED AGAIN 26.07 by the MATCH BASE RAISE (1 -> 2): the ladder half is untouched, the
  // per-match half went up one rung per match, so the epic run is 30 + 6 = 36 and the two-match
  // local is 2 + 3 + 1 = 6.
  // ⚠ RE-PINNED A THIRD TIME 03.08 (W2-WINDOW, the domestic surcharge +1): the epic National run is
  // 35 per-match + 6 ladder = 41, and the two-match Local is 3 + 4 + 1 = 8. The ladder half is
  // untouched again, which is what the identity in the block below asserts.
  it('tournamentRunStrain sums the run: a 5-match National of epics is 35 + the ladder', () => {
    expect(tournamentRunStrain('national', new Array(5).fill({ score: '7-6 6-7 7-6' }))).toBe(41) // 35 + 6
    expect(tournamentRunStrain('local', [{ score: '6-4 6-2' }, { score: '7-6 4-6 6-3' }])).toBe(8) // 3 + 4 + 1
    expect(tournamentRunStrain('j30', [])).toBe(0) // no matches, no drain
  })

  it('no fatigue lands at tick time; the full run drain lands at finalizeTournament', () => {
    const { world } = tickToPending('r9-strain-2')
    const afterTick = world.condition
    const p = world.pendingTournament!
    const kidMatches = p.result.matches.filter((m) => m.aId === KID_ID || m.bId === KID_ID)
    expect(kidMatches.length).toBeGreaterThan(0)
    const strain = tournamentRunStrain('local', kidMatches)
    expect(strain).toBeGreaterThan(0)
    skipTournament(world) // reveal-all → finalize commits the run
    const c = ECONOMY.condition
    const expected = Math.max(c.min, Math.min(c.max, afterTick - strain))
    expect(world.condition).toBe(expected)
    closeTournament(world)
  })
})

// ---------------------------------------------------------------------------
// CUMULATIVE RUN FATIGUE (owner idea 26.07) — matches at a tournament run every
// day or every other day, so each SUBSEQUENT match in the SAME run costs EXTRA
// condition on top of its own scoreline drain: the deeper she goes, the more the
// week grinds her down. ECONOMY.condition.runFatigueLadder is that extra, indexed
// by match-within-run (index 0 = her first match = 0 extra); a run longer than the
// ladder repeats its LAST value, so a future bigger draw can never silently cost 0.
// Shipped default = the owner's variant C (+1,+1,+2,+2 = 6 over a five-match run).
// Pure arithmetic on the run's match records – zero RNG, order-sensitive only.
// ---------------------------------------------------------------------------
describe('cumulative run fatigue (the ladder)', () => {
  const LADDER = ECONOMY.condition.runFatigueLadder
  const straightNat = matchDrain('national', '6-4 6-2') // 4 = base 2 + tier 2 (base raised 26.07)

  it('ships variant C: [0,+1,+1,+2,+2] – 0 extra for the first match, 6 over a five-match run', () => {
    expect(LADDER).toEqual([0, 1, 1, 2, 2])
    expect(LADDER[0]).toBe(0) // her FIRST match of the run never costs extra
    expect(LADDER.reduce((s, x) => s + x, 0)).toBe(6)
    expect(runFatigueExtra(0, 'national')).toBe(0)
    expect([1, 2, 3, 4].map((i) => runFatigueExtra(i, 'national'))).toEqual([1, 1, 2, 2])
  })

  it('a 1-match run is UNCHANGED: the ladder never touches a first-round exit', () => {
    for (const tier of ['local', 'regional', 'national', 'j30', 'j60', 'j300'] as const) {
      for (const score of ['6-4 6-2', '7-6 6-4', '7-6 6-7 7-6']) {
        expect(tournamentRunStrain(tier, [{ score }])).toBe(matchDrain(tier, score))
      }
    }
  })

  it('a 5-match National run adds EXACTLY the ladder sum on top of the per-match drains', () => {
    const run = new Array(5).fill({ score: '6-4 6-2' })
    const perMatch = 5 * straightNat // 20 – what the pre-ladder engine would charge at base 2
    expect(tournamentRunStrain('national', run)).toBe(perMatch + 6)
    // and the growth is match-by-match, not a lump at the end
    // ⚠ RE-PINNED +1/match 26.07 (base raise) and again 03.08 (W2-WINDOW's domestic surcharge +1):
    // both times the ladder increments on the LAST line below are UNCHANGED, which is the property
    // this test exists for – only the per-match half moved.
    const cumulative = [1, 2, 3, 4, 5].map((n) => tournamentRunStrain('national', new Array(n).fill({ score: '6-4 6-2' })))
    expect(cumulative).toEqual([5, 11, 17, 24, 31])
    expect(cumulative.map((c, i) => c - (i === 0 ? 0 : cumulative[i - 1]) - straightNat)).toEqual([0, 1, 1, 2, 2])
  })

  it('a run LONGER than the ladder repeats its LAST value (a bigger future draw can never cost 0)', () => {
    const last = LADDER[LADDER.length - 1]
    expect(runFatigueExtra(LADDER.length, 'national')).toBe(last)
    expect(runFatigueExtra(99, 'national')).toBe(last)
    // a 7-match run (draw of 128) = the ladder sum + 2 more repeats of its last rung
    const seven = new Array(7).fill({ score: '6-4 6-2' })
    // ⚠ UNCHANGED THROUGH THE 128-DRAW WAVE, AND THAT IS THE POINT OF THE TIER IT USES. 'national'
    // is a 32-draw and always will be, so it keeps the domestic ladder and its repeat-last rule
    // exactly as written. The rungs that got deeper (slam 128, wta1000 64) run on a THIRD ladder
    // keyed on `drawSize` – see condition.ts `ladderFor` and tests/fatigueReference.test.ts, which
    // is where the deep curve's own numbers live.
    expect(tournamentRunStrain('national', seven)).toBe(7 * straightNat + 6 + 2 * last)
  })

  it('a SKIPPED run still costs NOTHING: no match records, no drains, no ladder', () => {
    expect(tournamentRunStrain('j300', [])).toBe(0) // the heaviest tier, zero matches
    // …and the engine agrees: skipping at the tournament week never reaches finalize. Grind plan
    // (rest 15 → slider bonus 0), so the retroactive match-free bonus is 0 and the number is exact.
    const { world, eventId } = tickToPending('r9-skip', (w) => {
      w.physioActive = false
      w.plan = { train: 85, rest: 15 }
      w.condition = 60
    })
    const conditionAfterTick = world.condition
    skipEvent(world, eventId)
    expect(world.pendingTournament).toBeNull()
    // ⚠ 18.08 – A SKIPPED WEEK NOW PAYS THE SAME BASE RECOVERY AS A MEDICAL WITHDRAWAL. This line
    // asserted `conditionAfterTick` unchanged, which was the short payment the architect's note
    // flagged; the claim this test is named for is about RUNS - no match record, no drain, no ladder
    // step - and that claim is untouched. Recovery is a different fact and is asserted as the
    // engine's own expression.
    expect(world.condition).toBe(
      Math.min(
        100,
        conditionAfterTick +
          (ECONOMY.condition.recoveryBase - ECONOMY.condition.matchWeekRecoveryBase) +
          restRecoveryBonus(world.plan.rest),
      ),
    ) // no run committed
  })

  it('a WALKOVER still costs NOTHING: the trip that never happened has no run to charge', () => {
    const world = createWorld('runfat-walkover')
    world.physioActive = false
    world.plan = { train: 85, rest: 15 } // slider bonus 0 → the only recovery is the base
    world.condition = 60
    const target = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)!
    enterEvent(world, target.id)
    const rng = rngFromSeed(world.seed)
    while (world.week < target.week - 1) tickWeek(world, rng)
    // she arrives at the event week injured: entry fee forfeited, no travel, no run at all
    world.injury = { kind: 'wrist', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: world.week }
    const before = world.condition
    tickWeek(world, rng)
    expect(world.week).toBe(target.week)
    expect(world.events.some((e) => e.week === world.week && e.text.startsWith('Walkover'))).toBe(true)
    expect(world.pendingTournament).toBeNull()
    // recovery only (base 1, no slider/physio/blackout) – zero strain, so zero ladder
    expect(world.condition).toBe(before + ECONOMY.condition.recoveryBase)
  })

  it('is pure, RNG-free and never mutates the knob array', () => {
    const snapshot = [...LADDER]
    const run = new Array(5).fill({ score: '7-6 6-4' })
    expect(tournamentRunStrain('regional', run)).toBe(tournamentRunStrain('regional', run)) // idempotent
    expect(LADDER).toEqual(snapshot)
    expect(tournamentRunStrain.length).toBe(2) // (tier, kidMatches) – no rng parameter
    // ⚠ RE-AIMED 01.08 (R15-6): (matchIndex, tier) – the ladder went per-FAMILY (C for domestic+J,
    // the owner's D for the W rungs), so the tier must be named and the arity is 2 now. The rule
    // this pin protects is unchanged and still holds: neither parameter is an Rng, so the function
    // CANNOT draw – which is the whole point of pinning the signature.
    expect(runFatigueExtra.length).toBe(2) // (matchIndex, tier) – still no rng parameter
  })

  it('the ladder rides on the COMMITTED run: finalize subtracts drains + ladder together', () => {
    const { world } = tickToPending('r9-strain-ladder')
    const afterTick = world.condition
    const kidMatches = world.pendingTournament!.result.matches.filter((m) => m.aId === KID_ID || m.bId === KID_ID)
    const flat = kidMatches.reduce((s, m) => s + matchDrain('local', m.score), 0)
    const withLadder = tournamentRunStrain('local', kidMatches)
    expect(withLadder).toBe(flat + kidMatches.map((_, i) => runFatigueExtra(i, 'local')).reduce((s, x) => s + x, 0))
    skipTournament(world) // reveal-all -> finalize commits the run
    const c = ECONOMY.condition
    expect(world.condition).toBe(Math.max(c.min, Math.min(c.max, afterTick - withLadder)))
    closeTournament(world)
  })
})

// ---------------------------------------------------------------------------
// R9-19 — match-strength coupling ON (owner curve: knee 70, floor 0.55).
// ---------------------------------------------------------------------------
describe('R9-19 — match-strength coupling', () => {
  it('conditionMatchFactor: no penalty at/above the knee, linear to 0.55 at 0', () => {
    expect(ECONOMY.condition.matchStrengthKnee).toBe(70)
    expect(ECONOMY.condition.matchStrengthFloor).toBe(0.55)
    expect(conditionMatchFactor(100)).toBe(1)
    expect(conditionMatchFactor(85)).toBe(1)
    expect(conditionMatchFactor(70)).toBe(1) // fresh enough – the knee itself is penalty-free
    expect(conditionMatchFactor(35)).toBeCloseTo(0.775, 10) // halfway down the ramp
    expect(conditionMatchFactor(0)).toBeCloseTo(0.55, 10)
  })

  it('the shadow tournament scales the kid\'s MatchPlayer by the factor (stored snapshot included)', () => {
    // Grind + no physio so she arrives at the event week genuinely worn.
    const { world, skillsAtEntry } = tickToPending('r9-couple', (w) => {
      w.physioActive = false
      w.plan = { train: 100, rest: 0 }
      w.condition = 40
    })
    expect(world.condition).toBeLessThan(100)
    const factor = conditionMatchFactor(world.condition)
    expect(factor).toBeLessThan(1)
    const raw = kidMatchPlayer({ ...world, skills: skillsAtEntry })
    const stored = world.pendingTournament!.players[KID_ID]
    // ⚠ RE-AIMED (equipment slice, docs/specs/equipment-and-serve-speed.md §2): the composition point
    // now carries a THIRD multiplicative term - the condition of her kit - so the expected value names
    // it instead of the assertion being loosened. It is still an exact identity to ten places, so a
    // further term appearing in `kidMatchPlayerFor` still fails this test, which is the fact it guards.
    //
    // ⚠ RE-AIMED AGAIN 13.08 (docs/specs/coach-match-edge.md) – and the shape of the addition is the
    // point. The coach's edge is ADDITIVE and lands after the multiplication, so naming it here leaves
    // the multiplicative identity this test guards completely intact: the factor still has to be
    // exactly right on every wing, because the coach adds the SAME number to all five.
    const kit = kitMultipliers(kitWearAt(world.seed, world.profile.background, world.week))
    const edge = coachMatchEdge(world)
    expect(edge).toBeGreaterThan(0) // r9-couple opens on DEFAULT_PROFILE's middle coach
    expect(stored.serve).toBeCloseTo(raw.serve * factor * kit.serve + edge, 10)
    expect(stored.ret).toBeCloseTo(raw.ret * factor * kit.ret + edge, 10)
    expect(stored.composure).toBeCloseTo(raw.composure * factor + edge, 10) // no kit line touches composure
    expect(stored.stamina).toBeCloseTo(raw.stamina * factor * kit.stamina + edge, 10)
    skipTournament(world)
    closeTournament(world)
  })

  it('at condition 100 the kid plays unscaled (factor exactly 1)', () => {
    // Default profile (hired coach → physio on) + balanced plan keeps her at 100.
    const { world, skillsAtEntry } = tickToPending('r9-couple-fresh')
    expect(world.condition).toBe(100)
    const raw = kidMatchPlayer({ ...world, skills: skillsAtEntry })
    const stored = world.pendingTournament!.players[KID_ID]
    // ⚠ RE-AIMED (equipment slice): "unscaled" is a claim about the CONDITION factor, and it still
    // holds exactly - the only things between `raw` and `stored` are her kit and (since 13.08, and
    // this world has a middle coach) her coach's additive edge. Both are named rather than absorbed
    // into a tolerance, so the exact `toBe` survives and the claim is unchanged.
    const kit = kitMultipliers(kitWearAt(world.seed, world.profile.background, world.week))
    const edge = coachMatchEdge(world)
    expect(edge).toBeGreaterThan(0)
    expect(stored.serve).toBe(raw.serve * kit.serve + edge)
    expect(stored.stamina).toBe(raw.stamina * kit.stamina + edge)
    // ...and the neutral element is still byte-identical, which is what protects the frozen pins: a
    // girl in fresh kit at condition 100 plays her raw build to the last bit.
    expect(applyKit({ ...raw }, FRESH_KIT)).toEqual(raw)
    skipTournament(world)
    closeTournament(world)
  })
})

// ---------------------------------------------------------------------------
// R9-9 — skip/back at the tournament week.
// ---------------------------------------------------------------------------
describe('R9-9 — skipEvent at the tournament week', () => {
  it('travel refunded, entry fee forfeited, no run committed, week closes as non-playing', () => {
    // Light plan (60/40 → slider bonus +2) + a worn kid, so the retroactive match-free bonus
    // is visible below the clamp.
    const { world, rng, eventId, travelCostCents } = tickToPending('r9-skip', (w) => {
      w.physioActive = false
      w.plan = { train: 60, rest: 40 }
      w.condition = 30
    })
    const weekOfEvent = world.week
    const fundsAfterTick = world.fundsCents
    const conditionAfterTick = world.condition

    skipEvent(world, eventId)

    expect(world.pendingTournament).toBeNull()
    expect(world.entries).not.toContain(eventId)
    // travel comes back in full; the entry fee does NOT.
    expect(world.fundsCents).toBe(fundsAfterTick + travelCostCents)
    const refund = world.events.find(
      (e) => e.week === weekOfEvent && e.type === 'income' && e.text === `Travel refunded: ${TIERS.local.label}`,
    )
    expect(refund).toBeDefined()
    expect(refund!.amountCents).toBe(travelCostCents)
    expect(refund!.category).toBe('travel')
    expect(world.events.some((e) => e.week === weekOfEvent && e.text.startsWith('Entry refunded'))).toBe(false)
    // the info beat, short dash.
    expect(
      world.events.some(
        (e) => e.week === weekOfEvent && e.type === 'info' && e.text === `Skipped ${TIERS.local.label} – entry fee forfeited.`,
      ),
    ).toBe(true)
    // nothing resolved: no matches, no points, no W-L, no match drain. The week ended
    // match-free after all, so she earns the slider recovery bonus tickWeek withheld.
    //
    // ⚠⚠ RE-AIMED 18.08 – IT PINNED THE SLIDER BONUS ALONE, WHICH WAS THE SHORT PAYMENT. The
    // architect's note beside the medical withdrawal had flagged it: both constants were 2 when this
    // was written so the difference was zero, then the V2 flip set `matchWeekRecoveryBase` to 0 and
    // the two match-free weeks silently parted by `recoveryBase` – eight points, depending only on
    // whether the doctor pulled her out or the parent chose not to enter. The owner ruled it a fix,
    // not a tuning call: «она и в одном случае не играла и в другом», against the standing «мы ни за
    // что не наказываем».
    //
    // ⚠ THE EXPRESSION IS THE ENGINE'S OWN, NOT A COPIED NUMBER, so a later re-pricing of either knob
    // moves this pin with it rather than freezing today's eight.
    expect(world.events.some((e) => e.type === 'match')).toBe(false)
    expect(world.results.filter((r) => r.playerId === KID_ID)).toHaveLength(0)
    expect(world.seasonWins + world.seasonLosses).toBe(0)
    expect(world.condition).toBe(
      Math.min(
        100,
        conditionAfterTick +
          (ECONOMY.condition.recoveryBase - ECONOMY.condition.matchWeekRecoveryBase) +
          restRecoveryBonus(world.plan.rest),
      ),
    )
    // time moves again — the week is closed.
    tickWeek(world, rng)
    expect(world.week).toBe(weekOfEvent + 1)
  })

  it('guards: unknown event / already under way', () => {
    const { world, eventId } = tickToPending('r9-skip-guard')
    expect(() => skipEvent(world, 'nope')).toThrow('No tournament to skip this week')
    revealTournamentRound(world) // first match shown — no backing out any more
    expect(() => skipEvent(world, eventId)).toThrow('already under way')
    skipTournament(world)
    closeTournament(world)
    expect(() => skipEvent(world, eventId)).toThrow('No tournament to skip this week')
  })

  it('skipping never perturbs the main stream: enter-and-skip taps the never-entered baseline (A/B)', () => {
    const run = (enter: boolean): number[] => {
      const world = createWorld('bench-working-0')
      if (enter) {
        const target = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)!
        enterEvent(world, target.id)
      }
      const base = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      for (let i = 0; i < 52; i++) {
        tickWeek(world, rng)
        if (world.pendingTournament) skipEvent(world, world.pendingTournament.eventId)
      }
      return draws
    }
    const baseline = run(false)
    const skipping = run(true)
    expect(baseline.length).toBeGreaterThan(0)
    expect(skipping.length).toBe(baseline.length)
    expect(hashOf(skipping)).toBe(hashOf(baseline))
  })
})

// ---------------------------------------------------------------------------
// R9-9 / R9-21a — UI wiring (source-level guards, the B7/C-suite pattern).
// ---------------------------------------------------------------------------
describe('R9-9/R9-21a — UI wiring', () => {
  it('TournamentFlow splash carries Back + a confirmed skip that calls the skipEvent command', () => {
    const src = readFileSync(new URL('../src/components/TournamentFlow.vue', import.meta.url), 'utf8')
    expect(src).toContain('← Back')
    expect(src).toContain('skipEvent')
    expect(src).toContain('ConfirmDialog')
  })

  it('App.vue can hide the flow (Back) and the paused week can be resumed from ANY tab', () => {
    // ⚠ RE-AIMED by R13-12 (28.07). The resume affordance used to be a banner (plus, since
    // R13-8, the Home bar's primary button). R13-12 made the sticky Next-week bar GLOBAL and
    // dropped the banner: the bar's primary button (playWeek re-opens a pending overlay – the
    // R13-8 wiring) is now the one resume control, present on every tab because the bar carries
    // no tab gate. The R9-9a property this pin exists for – no tab can strand the career –
    // is unchanged; only the surface that guarantees it moved.
    const src = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
    expect(src).toContain('tournamentHidden')
    // ⚠ RE-AIMED by wave 2: the bar is Home-only for ADVANCING and global for RESUMING a
    // paused reveal (see round13-nav.test.ts). What R9-9 cares about is that the shell owns it and
    // no screen grows one of its own - that is unchanged.
    expect(src).toContain(`class="next-week-bar"`)
    expect(src).toContain(`game.snapshot?.pending`)
    expect(src).toContain('tournamentHidden.value = false') // the re-open path playWeek takes
  })

  it('the injury stop is a blocking popup with kind/weeks/withdrawals and an alert sfx — not a toast', () => {
    const dialog = readFileSync(new URL('../src/components/InjuryStopDialog.vue', import.meta.url), 'utf8')
    expect(dialog).toContain('playSfx')
    expect(dialog).toContain('injury')
    // ⭐ R2-02 REPOINTED: this used to pin the literal `'Entry refunded'`, because the popup found
    // the money by `startsWith('Entry refunded')` on the news feed – the raw-literal half of the
    // defect R2-02 removed. The claim ("the popup reports the refunds") is unchanged; its source is
    // now the typed `Snapshot.injuryReport.refundCents`, and the sentence the player reads is the
    // one pinned here. The engine's feed line still says "Entry refunded"; the UI no longer reads it.
    expect(dialog).toContain('refundCents')
    expect(dialog).toContain('Fees refunded')
    const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
    expect(app).toContain('InjuryStopDialog')
    expect(app).not.toContain('she picked up an injury – see the news')
  })
})

// ---------------------------------------------------------------------------
// Round-9 pt4 — UI pack wiring (source-level guards, the B7/C-suite pattern)
// + the R9-17 engine-to-feed verification.
// ---------------------------------------------------------------------------
describe('R9-17 — the recovery line reaches the News feed', () => {
  it('a forced injury + recovery emits the 💪-mapped event into the snapshot feed', () => {
    const w = createWorld('r9-recovery-feed')
    w.injury = { kind: 'knee strain', severity: 'moderate', weeksRemaining: 1, totalWeeks: 3, sinceWeek: w.week }
    tickWeek(w, rngFromSeed(w.seed))
    const rec = toSnapshot(w).events.find((e) => e.type === 'recovery')
    expect(rec).toBeDefined()
    expect(rec!.text).toBe('Back on court – cleared to play.')
    // HomeScreen's feed keeps non-financial types (recovery included) and maps 💪 to it.
    const home = readFileSync(new URL('../src/components/screens/HomeScreen.vue', import.meta.url), 'utf8')
    expect(home).toContain("recovery: '💪'")
    expect(home).toContain("e.type !== 'expense' && e.type !== 'income'")
  })
})

describe('pt4 — UI wiring', () => {
  const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')

  it('R9-4: Sora reaches the kid name, tournament names and the Season heading', () => {
    const css = read('../src/style.css')
    // ⚠ RE-AIMED by epic/redesign-home (28.07): the kid's name on Home left `.player-name` (the
    // player card is gone) for `.diary-name` – the 42px headline laid on the hero photograph. The
    // property is the NAME's, not the card's, and it moved with it.
    // ⚠ RE-AIMED AGAIN by A2 (28.07): `.kid-name` was the app header's name, and the app header
    // is gone. `.diary-name` is the only place her name is set now, and it is the headline.
    // ⚠ RE-AIMED A THIRD TIME, by U0. Both rules moved out of `src/style.css` and into the scoped
    // block of the screen that is their ONE consumer – `.diary-name` into HomeScreen, `.event-tier`
    // into SeasonScreen – because six screens are being built in parallel on top of this slice and
    // the sheet is the file they would all have to edit. The property is still the name's and the
    // tournament title's, and it still is Sora; only the file it is written in changed.
    const home = read('../src/components/screens/HomeScreen.vue')
    const season = read('../src/components/screens/SeasonScreen.vue')
    for (const [sel, src] of [
      ['.diary-name', home.slice(home.indexOf('<style scoped>'))],
      ['.event-tier', season.slice(season.indexOf('<style scoped>'))],
    ] as const) {
      const at = src.indexOf(`${sel} {`)
      expect(at, `${sel} must still be declared somewhere`).toBeGreaterThan(-1)
      expect(src.slice(at, src.indexOf('}', at))).toContain('var(--font-heading)')
    }
    expect(css).toContain('.season-topbar h2')
  })

  it('R9-8: the plan line is unbordered plain text with the tournament name', () => {
    // ⚠ RE-AIMED by R13-12 (28.07): the This-week block left Home for its own tab
    // (screens/ThisWeekScreen.vue). The property is the block's, not the screen's – it moved
    // with the block, wording and all.
    const src = read('../src/components/screens/ThisWeekScreen.vue')
    expect(src).toContain('this-week-plan')
    expect(src).not.toContain('<span class="pill">Training')
  })

  // PIN MOVED by F45-1 (27.07): the header crop left this set. R9-13/15's point – the surfaces that
  // show an emotion all take it from ONE composable – still holds for the two that remain; the
  // header is now age-only by owner decision (tests/round11-followups.test.ts).
  it('R9-13/15: both emotional portrait surfaces run through the shared emotion composable', () => {
    for (const p of ['../src/components/screens/HomeScreen.vue', '../src/components/screens/KidScreen.vue']) {
      expect(read(p)).toContain('useKidEmotion')
    }
    // ⚠ RE-AIMED by A2 (28.07): the static age-only crop moved off the deleted app header onto
    // Home, beside the date. Home is now the one screen carrying BOTH faces – the big emotional
    // painting and the small chrome avatar – and they still answer to different composables.
    expect(read('../src/components/screens/HomeScreen.vue')).toContain('useHeaderAvatar')
    expect(read('../src/App.vue')).not.toContain('useHeaderAvatar')
  })

  it('R9-18: the recap dismissal survives remounts (module scope) and the rule is documented', () => {
    // ⚠ RE-AIMED by R13-12 (28.07): the WeekRecapCard moved to the This-week tab, and the
    // module-scope dismissal – the whole point of R9-18 – moved WITH it (the new screen
    // re-mounts on tab switches exactly like Home did).
    const screen = read('../src/components/screens/ThisWeekScreen.vue')
    expect(screen).toContain('dismissedRecapKey')
    expect(screen).toMatch(/<script lang="ts">/) // the plain (module-scope) block exists
    expect(screen).toContain('THE RULE')
  })

  it('R9-21b: the Home tab carries an unread-news dot and a soft cue on arrival', () => {
    const app = read('../src/App.vue')
    expect(app).toContain('homeHasNews')
    expect(app).toContain("playSfx('clickSoft')")
    expect(app).toContain('lastSeenNewsId')
  })

  it('R9-23: reaction cues fire at the scoring instant; the *-end event starts are silent', () => {
    const viewer = componentLogic('components/MatchViewer.vue')
    expect(viewer).toMatch(/if \(ev\.kind !== 'point-end'\) return/)
    expect(viewer).toContain('match > set > game')
  })

  it('R9-24: long cues rate-match the clip (cap 2, preservesPitch) and the seats hold scales', () => {
    const sfx = read('../src/audio/sfx.ts')
    expect(sfx).toContain('preservesPitch')
    expect(sfx).toContain('MAX_RATE = 2')
    const viewer = componentLogic('components/MatchViewer.vue')
    expect(viewer).toContain('playLong')
    expect(viewer).toContain('SEATS_PREROLL_MS / Math.min(speed.value, 2)')
  })
})

// ---------------------------------------------------------------------------
// Round-9 pt5 — R9-16 portrait stages by age + the young/teen header crops.
// ---------------------------------------------------------------------------
describe('pt5 — R9-16 portrait stages by age', () => {
  it('portraitStage: jun <11, young 11-16, teen 17-22, adult 23-30, milf 31+', () => {
    expect(portraitStage(10)).toBe('jun')
    // Owner 25.07: young starts at 11 (the childhood prologue will need this boundary).
    expect(portraitStage(11)).toBe('young')
    expect(portraitStage(12)).toBe('young')
    expect(portraitStage(14)).toBe('young') // START_AGE ⇒ the game OPENS on young art
    expect(portraitStage(16)).toBe('young')
    expect(portraitStage(17)).toBe('teen')
    expect(portraitStage(22)).toBe('teen')
    expect(portraitStage(23)).toBe('adult')
    // Owner 27.07: adult gained an UPPER bound and milf became a real band.
    expect(portraitStage(30)).toBe('adult')
    expect(portraitStage(31)).toBe('milf')
  })

  it('the 256px header crops exist for every young/teen emotion (sips→256→cwebp q82)', () => {
    for (const stage of ['jun', 'young', 'teen'] as const) {
      for (const emotion of ['norm', 'happy', 'sad', 'serious', 'tired', 'injury'] as const) {
        const p = new URL(`../public/avatars/${stage}-${emotion}.webp`, import.meta.url)
        expect(existsSync(p), `${stage}-${emotion}.webp missing`).toBe(true)
      }
    }
  })

  it('the full-size art exists for every young/teen emotion the big portraits can request', () => {
    for (const stage of ['jun', 'young', 'teen', 'adult'] as const) {
      for (const emotion of ['norm', 'happy', 'sad', 'serious', 'tired', 'injury'] as const) {
        const p = new URL(
          `../public/images/fem-euro-brunnet/fem-euro-brunnet-${stage}-${emotion}.webp`,
          import.meta.url,
        )
        expect(existsSync(p), `${stage}-${emotion} full art missing`).toBe(true)
      }
    }
  })

  it('the stage resolver reaches the crop picker, the big portraits and the flow art', () => {
    const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
    expect(read('../src/composables/kidEmotion.ts')).toContain('portraitStage')
    expect(read('../src/components/TournamentFlow.vue')).toContain('kidStage')
    // ⚠ RE-AIMED by R13-12 (28.07): the Kid TAB left the bottom bar (the header avatar opens
    // the screen now), so the R9-16 "tab glyph grows up at 18" wiring went with it – its subject
    // no longer exists. What SURVIVES of R9-16: the surface that opens the Kid screen still ages
    // with her (the header avatar resolves through portraitStage – pinned by
    // tests/round11-followups.test.ts F45-1), and the owner's icon pairs stay on disk, reserved
    // (woman/man for the future tours, like kid-boy).
    const app = read('../src/App.vue')
    expect(app).not.toContain("'kid-girl'") // no Kid tab entry survives in the shell
    expect(existsSync(new URL('../public/icons/woman.svg', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../public/icons/man.svg', import.meta.url))).toBe(true)
    // onboarding's "first time on court" frame stays jun BY DESIGN (narrative flashback)
    expect(read('../src/components/OnboardingWizard.vue')).toContain('jun')
  })
})
