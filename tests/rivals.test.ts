import { describe, it, expect } from 'vitest'
import {
  RIVAL_STYLE,
  applySurfaceStyle,
  matchesForFinish,
  reconstructRun,
  rivalCondition,
  rivalConditions,
  rivalGroundstrokes,
  rivalMatchPlayer,
  styleOf,
} from '../src/engine/season/rival'
import { conditionMatchFactor, matchDrain, runFatigueExtra, tournamentRunStrain } from '../src/engine/condition'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { generateCohort } from '../src/engine/season/cohort'
import { ECONOMY } from '../src/engine/economy'
import type { SeasonResult } from '../src/engine/season/ranking'
import type { AiPlayer, SeasonEvent, TierId } from '../src/engine/season/types'
import type { MatchPlayer, Surface } from '../src/engine/match/types'
import type { PlayStyle } from '../src/shared/protocol'
import {
  KID_ID,
  SAVE_SCHEMA_VERSION,
  closeTournament,
  createWorld,
  enterEvent,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { fieldProsFor } from '../src/engine/season/fieldPros'
import { seasonIndexOf } from '../src/engine/world/ledger'
import { firstRoundValue } from './openerValue'

// ---------------------------------------------------------------------------
// Rivals become real — Part A: rival fatigue, DERIVED from the results ledger.
//
// The whole slice is a pure derivation: no new WorldState field, no schema bump, ZERO RNG draws.
// A rival's condition is reconstructed from the rows she already has in `world.results` –
// `points` inverts through `TIERS[tier].points` to a finish index, the finish index gives how
// many matches she played, and from there the SAME matchDrain / tournamentRunStrain / recovery /
// conditionMatchFactor the kid uses do the rest.
//
// *** RE-PINNED (wave-3 integration, 26.07 – THE LADDER IS SHARED). The run-fatigue slice added
// ECONOMY.condition.runFatigueLadder, the extra condition the n-th match of ONE run costs on top of
// its own scoreline drain. Because a rival's strain is `tournamentRunStrain` and NOT a private
// formula, the cohort inherited it the moment the two slices met – so every A-series number below
// moved. That is the DESIGN, not a leak: if only the kid paid the ladder a deep run would grind only
// the player, reintroducing precisely the asymmetry this slice exists to remove. Every pin in A1-A4
// is therefore re-pinned to the ladder-INCLUSIVE reality, and the ladder's contribution is written
// out from the knob (LADDER5 below) rather than hard-coded, so a tuning pass on the owner's four
// variants re-reads instead of re-breaking. ***
// ---------------------------------------------------------------------------

const R = ECONOMY.condition

/** The ladder's total extra over a FIVE-match run (variant C shipped: 0+1+1+2+2 = 6) – read from
 *  the knob so re-tuning the ladder does not re-break the arithmetic below. */
const LADDER5 = Array.from({ length: 5 }, (_, i) => runFatigueExtra(i, 'j300')).reduce((s, x) => s + x, 0)

/** One ledger row for `ai-x` at `week`, finishing `finish` at `tier`. */
function row(tier: TierId, finish: number, week: number, playerId = 'ai-x'): SeasonResult {
  return { playerId, week, points: TIERS[tier].points[finish], tier }
}

describe('A1 — reconstruction: (tier, points) round-trips to the right match count', () => {
  it('champion plays log2(drawSize) matches and a first-round exit plays exactly 1, every tier', () => {
    for (const tier of TIER_LADDER) {
      const def = TIERS[tier]
      const rounds = Math.log2(def.drawSize)
      // ⚠ RE-PINNED by wave B "first-round loss pays ZERO" (tune/first-round-zero). This used to
      // assert `def.points.every((p) => p > 0)` – "every entrant of every draw leaves a
      // reconstructible row, nobody is invisible to the ledger". That is NO LONGER TRUE, and the
      // consequence is deliberately pinned here rather than quietly dropped:
      //
      //   every finish EXCEPT the first-round exit still pays, and the exit pays exactly 0;
      //   BOTH ledger write sites guard on `points > 0` (world.ts finalizeTournament for the kid,
      //   awardAiPoints for the cohort), so a first-round exit now leaves NO ROW AT ALL.
      //
      // For the RIVAL-FATIGUE reconstruction that means a rival who loses her opener is invisible
      // to `rivalCondition`: her week reads as a QUIET week and earns `recoveryBase` instead of
      // costing her a trip and a match. The ledger is the only record rival.ts has, so the cohort
      // is now systematically fresher than it was. Surfaced in docs/specs/wave-b-first-round-zero.md
      // as an open decision for the owner – it is a side effect of the points change, not a design
      // choice, and fixing it means touching how "she played" is recorded (world.ts), not this table.
      //
      // ⚠ AND THAT IS WHAT HAPPENED (fix/rival-fatigue-rows). The second paragraph above is HISTORY
      // as of that branch and is kept only because it explains why this test reads the way it does.
      // The cohort write site no longer guards on `points > 0`: every entrant leaves a row, `points`
      // carries the award (0 included), and a first-round exit costs a rival exactly one score-less
      // match at that tier. The table below is unchanged – the fix is in world.ts, precisely where
      // this note said it would have to be – and the reconstruction of a 0-point row is asserted on
      // the very next line, which now describes a row the engine really writes.
      expect(def.points.length).toBe(rounds + 1)
      expect(def.points.slice(0, -1).every((p) => p > 0)).toBe(true)
      // The W2-LADDER family split: the chart's nominal 1 at W50/W75/WTA125, wave B's 0 everywhere
      // else (tests/wave-b-points.test.ts NOMINAL_ONE_TIERS). The round-trip below is unaffected -
      // the table stays strictly decreasing, so 1 inverts as unambiguously as 0 did.
      // ⚠ W3-ACT2 ADDS A THIRD CASE: WTA 250/500 join the nominal-1 family and the two biggest
      // rungs pay a REAL opener (a 1000's row bottoms at 65, a Slam's at 130) because the research
      // chart is normalised to 32 main-draw rows. The round-trip below is unaffected either way -
      // the table stays strictly decreasing, so 65 inverts as unambiguously as 0 did.
      expect(def.points[def.points.length - 1]).toBe(
        firstRoundValue(tier),
      )

      expect(reconstructRun(row(tier, 0, 1))).toMatchObject({ tier, matches: rounds }) // champion
      expect(reconstructRun(row(tier, rounds, 1))).toMatchObject({ tier, matches: 1 }) // R1 exit
    }
  })

  it('every (tier, finish) inverts to the finish it came from, and the match count is monotone', () => {
    for (const tier of TIER_LADDER) {
      const rounds = Math.log2(TIERS[tier].drawSize)
      let prev = Infinity
      for (let finish = 0; finish <= rounds; finish++) {
        const run = reconstructRun(row(tier, finish, 3))
        expect(run.tier).toBe(tier)
        // finish f (f > 0) = lost in round `rounds - f`, so she played `rounds - f + 1` matches;
        // the champion (f = 0) played every round.
        expect(run.matches).toBe(finish === 0 ? rounds : rounds - finish + 1)
        expect(run.matches).toBeLessThanOrEqual(prev) // deeper finish ⇒ never fewer matches
        prev = run.matches
      }
    }
  })

  it('matchesForFinish: runner-up plays as many matches as the champion, R1 exit plays one', () => {
    expect(matchesForFinish(3, 0)).toBe(3) // 8-draw champion: R1 + SF + F
    expect(matchesForFinish(3, 1)).toBe(3) // runner-up plays the same three
    expect(matchesForFinish(3, 2)).toBe(2) // semifinalist
    expect(matchesForFinish(3, 3)).toBe(1) // first round
    expect(matchesForFinish(5, 0)).toBe(5) // 32-draw champion
    expect(matchesForFinish(5, 5)).toBe(1)
  })

  it("the run's strain IS tournamentRunStrain over score-less matches – one drain rule, both sides", () => {
    // AI-vs-AI records carry no scoreline (they resolve closed-form), so every rival match takes
    // matchDrain's score-less branch: straightSets + the tier surcharge. Identical to what the kid
    // would pay for a straight-sets match at that tier – never a private rival formula.
    //
    // *** RE-PINNED 30 -> 36 (wave-3, the SHARED ladder): the five per-match drains are unchanged
    // (5 × 6 = 30), and on top of them the run now pays the cumulative ladder for matches 2-5
    // (LADDER5 = 6 at variant C) exactly as the kid's own five-match run does. Asserted against
    // tournamentRunStrain itself as well, so the two sides are proved to be ONE function rather
    // than two formulas that happen to agree today. ***
    // *** RE-PINNED AGAIN 36 -> 41 (26.07, MATCH BASE RAISE 1 -> 2): the ladder half is untouched
    // (LADDER5 = 6) and so is the sharing property this test exists for; the five per-match drains
    // went 6 -> 7 each. The heaviest reconstructable rival run in the game is now 41. ***
    const run = reconstructRun(row('j300', 0, 4))
    expect(run.matches).toBe(5)
    expect(run.strain).toBe(5 * matchDrain('j300', undefined) + LADDER5)
    expect(run.strain).toBe(41) // 5 × (2 straight-sets + 5 j300 surcharge) = 35, + 6 ladder
    // THE point of routing through the shared helper: the rival's number IS the kid's number for the
    // same five score-less wins at that tier, ladder included.
    expect(run.strain).toBe(tournamentRunStrain('j300', new Array(5).fill({})))
    // A ONE-match run is ladder-free on both sides – her first match of a run never pays extra.
    expect(reconstructRun(row('local', 3, 4)).strain).toBe(matchDrain('local', undefined)) // 1
    expect(runFatigueExtra(0, 'local')).toBe(0)
  })

  it('the ladder is SHARED, not copied: re-tuning the knob moves the cohort too', () => {
    // The wave-3 integration decision, asserted directly. The strain index is memoised on the LIVE
    // ladder (rival.ts runsIndex), so a tuning pass – or the fatigue bench's `--scenario runfat-*`
    // sections, which is what the owner reads to choose a variant – moves the kid and the cohort
    // together. With a module-load snapshot the cohort silently stayed on variant C while the kid
    // moved, and the comparison measured half the game.
    const knob = R as unknown as { runFatigueLadder: number[] }
    const shipped = knob.runFatigueLadder
    const flat = 5 * matchDrain('j300', undefined)
    try {
      knob.runFatigueLadder = [0] // the pre-ladder engine
      expect(reconstructRun(row('j300', 0, 4)).strain).toBe(flat)
      knob.runFatigueLadder = [0, 1, 2, 3, 4] // the owner's steepest variant (A)
      expect(reconstructRun(row('j300', 0, 4)).strain).toBe(flat + 10)
    } finally {
      knob.runFatigueLadder = shipped
    }
    expect(reconstructRun(row('j300', 0, 4)).strain).toBe(flat + LADDER5) // restored
  })
})

describe('A2 — a tier-less row (legacy saves / pre-history) is handled explicitly', () => {
  // `SeasonResult.tier` is OPTIONAL and every AI row written before this slice omitted it. Such a
  // row is reconstructed by MINIMUM STRAIN over the (tier, finish) pairs that could have produced
  // those points: deterministic, never a crash, and never "free".
  it('never crashes and never treats the row as free', () => {
    for (const tier of TIER_LADDER) {
      const rounds = Math.log2(TIERS[tier].drawSize)
      for (let finish = 0; finish <= rounds; finish++) {
        const { tier: _t, ...legacy } = row(tier, finish, 2)
        const run = reconstructRun(legacy)
        expect(run.matches).toBeGreaterThanOrEqual(1)
        expect(run.strain).toBeGreaterThan(0)
      }
    }
  })

  it('resolves an AMBIGUOUS points value to the cheapest reading, deterministically', () => {
    // 30 points is a Local title, a J30 last-16 or a J300 first round.
    //
    // *** RE-PINNED strain 3 -> 5 (wave-3, the SHARED ladder). The three readings under the ladder:
    //     local title    3 matches × 1 =  3, + ladder(0,1,1) = 2  ->  5   <- still the cheapest
    //     j30 last-16    2 matches × 4 =  8, + ladder(0,1)   = 1  ->  9
    //     j300 first rd  1 match  × 6 =  6, + ladder(0)      = 0  ->  6
    // Note how much TIGHTER the ordering became: the winning reading used to be 3 against 6, it is
    // now 5 against 6. The cheapest-reading rule is unchanged and still picks local, but a future
    // steepening of the ladder (the owner's variant A would make the local title 3 + 6 = 9) would
    // flip a legacy row's cheapest reading onto a different tier. Recorded for the tuning pass –
    // the rule is "cheapest", not "local", so this is behaviour, not a bug. ***
    //
    // *** THAT PREDICTION CAME TRUE — and not from the ladder. RE-PINNED local/3/5 -> j300/1/7 by the
    // MATCH BASE RAISE (26.07, straightSets 1 -> 2). The base is charged PER MATCH, so raising it by
    // one taxes a 3-match reading three times and a 1-match reading once; the readings at base 2 are
    //     local title    3 matches × 2 =  6, + ladder(0,1,1) = 2  ->  8
    //     j30 last-16    2 matches × 5 = 10, + ladder(0,1)   = 1  -> 11
    //     j300 first rd  1 match  × 7 =  7, + ladder(0)      = 0  ->  7   <- now the cheapest
    // BEHAVIOUR, NOT A BUG, exactly as the note above said: the rule is "cheapest reading", and the
    // cheapest reading of 30 points is now one J300 first-round loss rather than a Local title. It
    // only touches rows with NO `tier` field — every AI row written since the rival-life slice
    // carries one — i.e. pre-slice legacy saves, where a tier-less row now reconstructs as 1 match /
    // 7 strain instead of 3 matches / 5. FLAGGED FOR THE OWNER: if a legacy row should still read as
    // the LOCAL title (the likelier real history for a 30-point week), the fix is a tie-break
    // preference in reconstructRun, not a fatigue knob. ***
    // *** AND WAVE B PUT IT BACK. RE-PINNED j300/1/7 -> local/3/8 by "first-round loss pays ZERO"
    // (tune/first-round-zero). A J300 first round is no longer worth 30 – it is worth 0 – so 30
    // points is no longer a reading j300 can produce at all, and the surviving candidates are
    //     local title    3 matches × 2 =  6, + ladder(0,1,1) = 2  ->  8   <- cheapest
    //     j30 last-16    2 matches × 5 = 10, + ladder(0,1)   = 1  -> 11
    // This is exactly the outcome the note above asked for ("if a legacy row should still read as
    // the LOCAL title – the likelier real history for a 30-point week"), reached by removing the
    // false candidate rather than by adding a tie-break preference. No knob was touched. Zeroing
    // the first round also collapses SIX readings onto the value 0 – but no row is ever written
    // with 0 points, so that collision is unreachable from a real save. ***
    // *** RE-PINNED strain 8 -> 11 by W2-WINDOW's DOMESTIC RE-PRICE (tierMatchFatigue local 0 -> 1),
    // and the WINNING READING DID NOT MOVE, which is the half worth reading. The candidates are now
    //     local title    3 matches x 3 =  9, + ladder(0,1,1) = 2  -> 11   <- still cheapest
    //     j30 last-16    2 matches x 5 = 10, + ladder(0,1)   = 1  -> 11   <- now TIED
    // and `reconstructRun` keeps local because it scans in TIER_LADDER order and a strict `<` never
    // displaces an earlier equal - a stable, deterministic tie-break rather than a coin flip. That
    // makes this the tightest the ordering has ever been, so a further +1 on Local would flip it:
    // FLAGGED FOR THE OWNER exactly as the 26.07 note flagged the previous flip, and it only ever
    // touches pre-rival-life legacy rows, which carry no `tier` field. ***
    const run = reconstructRun({ playerId: 'ai-x', week: 2, points: 30 })
    expect(run).toMatchObject({ tier: 'local', matches: 3, strain: 11 })
    expect(run.strain).toBe(tournamentRunStrain('local', new Array(3).fill({}))) // the shared helper
    // ...and it is a pure function: same row, same answer, every time.
    expect(reconstructRun({ playerId: 'ai-x', week: 2, points: 30 })).toEqual(run)
  })

  it('a points value that matches no tier at all costs one straight-sets match at the entry tier', () => {
    const run = reconstructRun({ playerId: 'ai-x', week: 2, points: 777 })
    expect(run.matches).toBe(1)
    expect(run.strain).toBe(matchDrain(TIER_LADDER[0], undefined))
  })
})

describe('A3 — the same drain + the same time recovery the kid uses', () => {
  it('a quiet rival sits at full condition', () => {
    expect(rivalCondition([], 'ai-x', 20)).toBe(R.max)
    expect(rivalCondition([row('j300', 0, 1, 'ai-other')], 'ai-x', 20)).toBe(R.max) // not her row
  })

  it('a five-match J300 run costs exactly the run strain, and recovers recoveryBase per quiet week', () => {
    const ledger = [row('j300', 0, 10)]
    // *** RE-PINNED 70 -> 64 (wave-3, the SHARED ladder): the run's toll is 30 per-match + 6 ladder
    // = 36, the same 36 the kid pays for five score-less J300 wins. Written as `30 + LADDER5` rather
    // than 36 so the owner's four ladder variants re-read this instead of re-breaking it. ***
    // *** …and that is exactly why the MATCH BASE RAISE (26.07, 1 -> 2) did not break it: the drain
    // is READ FROM THE ENGINE, so it moved 36 -> 41 on its own. Only the illustrative numbers in
    // these comments were re-pinned: the run week is now 59, then 60, 63. ***
    const drain = 5 * matchDrain('j300', undefined) + LADDER5 // 41 (35 per-match + 6 ladder)
    expect(rivalCondition(ledger, 'ai-x', 10)).toBe(R.max - drain) // 59 – the run week itself
    // A tournament week earns matchWeekRecoveryBase (0 shipped); every quiet week earns
    // recoveryBase, +blackoutBonus on an off-season/exam week. Weeks 11-14 are all plain.
    expect(rivalCondition(ledger, 'ai-x', 11)).toBe(R.max - drain + R.recoveryBase) // 60
    expect(rivalCondition(ledger, 'ai-x', 14)).toBe(R.max - drain + 4 * R.recoveryBase) // 63
  })

  it('rivals get NO plan slider, NO physio and NO vacation – that asymmetry is the player edge', () => {
    // The kid on the 60/40 preset recovers recoveryBase + 2 on a free week, +1 more on physio.
    // A rival recovers the base alone: four quiet weeks buy her exactly 4 * recoveryBase. Dug out
    // of a deep enough hole (a J300 title: 41 at base 2 under the shared ladder) that the clamp cannot
    // flatter the reading.
    const deep = [row('j300', 0, 10)]
    const gained = rivalCondition(deep, 'ai-x', 14) - rivalCondition(deep, 'ai-x', 10)
    expect(gained).toBe(4 * R.recoveryBase)
    expect(gained).toBeLessThan(4 * (R.recoveryBase + 2)) // strictly worse than the careful kid
  })

  it('clamps to the same [min, max] bounds', () => {
    // Eight back-to-back J300 titles (328 strain at base 2 under the shared ladder) cannot push her below the
    // floor...
    const brutal = Array.from({ length: 8 }, (_, i) => row('j300', 0, 3 + i))
    expect(rivalCondition(brutal, 'ai-x', 10)).toBe(R.min)
    // ...and no amount of rest lifts her over the ceiling.
    expect(rivalCondition([row('local', 3, 1)], 'ai-x', 1 + 5 * R.max)).toBe(R.max)
  })

  // ⚠ RE-AIMED 03.08 (W2-FATIGUE: recoveryBase 1 -> 8), AND THE RE-AIM IS ITSELF THE FINDING - the
  // «shared implementation forces a re-measure» case the re-price spec's §7 names by name. The
  // window itself is UNTOUCHED at 16 (it is the owner's number and the spec forbids turning it);
  // what moved underneath it is how long a drain can still be SEEN.
  //
  // The old second assertion put one J300 title at the window's OLDEST week and demanded a visible
  // dent 15 weeks later. At recoveryBase 1 that was easy - the title cost 41 and fifteen quiet weeks
  // repaid 15. At recoveryBase 8 the same fifteen weeks repay 120, and `walkWindow` clamps to
  // [0, 100] every week, so ANY drain parked at the oldest edge is fully repaid before the read: a
  // rival who was floored outright climbs 0 -> 100 in thirteen weeks. So the window is now strictly
  // longer than the memory the VALUE can hold - it bounds the WORK the scan does, which is what its
  // name and its own comment in economy.ts claim, and no longer doubles as the memory itself.
  //
  // Both halves of the original claim are still asserted, on weeks where they are observable:
  // outside the window is exactly `max` (the boundary), inside it is strictly below (the scan really
  // does read those rows), plus the repayment horizon itself, so the fact above is pinned rather
  // than merely described.
  it('is bounded work: only the last ECONOMY.condition.rivalFatigueWindowWeeks weeks are scanned', () => {
    const window = R.rivalFatigueWindowWeeks
    expect(window).toBeGreaterThan(0)
    const ancient = [row('j300', 0, 100 - window - 1)] // one week outside the window
    expect(rivalCondition(ancient, 'ai-x', 100)).toBe(R.max)
    const inside = [row('j300', 0, 99)] // inside, and still inside the repayment horizon
    expect(rivalCondition(inside, 'ai-x', 100)).toBeLessThan(R.max)
    // THE HORIZON, pinned: a J300 title costs `drain` and a quiet week repays `recoveryBase`, so the
    // dent is gone after ceil(drain / recoveryBase) weeks - and that is well inside the window now.
    const drain = 5 * matchDrain('j300', undefined) + LADDER5
    const repaid = Math.ceil(drain / R.recoveryBase)
    expect(repaid).toBeLessThan(window)
    expect(rivalCondition([row('j300', 0, 100 - repaid)], 'ai-x', 100)).toBe(R.max)
    expect(rivalCondition([row('j300', 0, 100 - repaid + 1)], 'ai-x', 100)).toBeLessThan(R.max)
  })

  it('is deterministic and pure: same ledger, same week, same number – and the ledger is not mutated', () => {
    const ledger = [row('j60', 1, 8), row('j30', 3, 11), row('national', 0, 12)]
    const snapshot = JSON.stringify(ledger)
    const a = rivalCondition(ledger, 'ai-x', 13)
    const b = rivalCondition(ledger.slice().reverse(), 'ai-x', 13) // order-independent
    expect(b).toBe(a)
    expect(JSON.stringify(ledger)).toBe(snapshot)
  })

  it('rivalConditions batches the whole field and agrees with the single-player function', () => {
    const ledger = [row('j60', 1, 8, 'ai-1'), row('j30', 3, 11, 'ai-2'), row('national', 0, 12, 'ai-1')]
    const map = rivalConditions(ledger, 13)
    expect(map.get('ai-1')).toBe(rivalCondition(ledger, 'ai-1', 13))
    expect(map.get('ai-2')).toBe(rivalCondition(ledger, 'ai-2', 13))
    expect(map.get('ai-never-played')).toBeUndefined() // absent = full condition, by construction
  })
})

describe('A4 — a deep run leaves a soft week behind her, and it heals', () => {
  // Two identical rivals carrying the SAME recent load (the live world never hands anyone a blank
  // ledger); one then plays a five-match J300, the other sits the week out.
  const history = (id: string): SeasonResult[] => [
    row('j30', 2, 4, id),
    row('j60', 3, 7, id),
    row('j30', 1, 9, id),
  ]
  const runner = [...history('ai-run'), row('j300', 0, 12, 'ai-run')]
  const rester = history('ai-rest')

  it('the week after a five-match run she is measurably weaker; the rival who sat out is not', () => {
    const cRun = rivalCondition(runner, 'ai-run', 13)
    const cRest = rivalCondition(rester, 'ai-rest', 13)
    expect(cRun).toBeLessThan(cRest)
    // ...and the gap is big enough to cross the strength knee, so it shows up on court.
    expect(conditionMatchFactor(cRun)).toBeLessThan(conditionMatchFactor(cRest))
  })

  it('the CLAIM CHANGED: one deep run now costs a fresh champion a shade of strength too', () => {
    // *** RE-PINNED AND RE-CLAIMED (wave-3, the SHARED ladder). This test used to assert "a fresh
    // rival pays condition for one deep run, not strength": pre-ladder a J300 title cost 30, so she
    // landed on 100 − 30 = 70 = matchStrengthKnee EXACTLY and the strength curve was still a no-op.
    // That equality was a coincidence of two independently-tuned knobs, and the ladder ended it: the
    // run now costs 36, she is on 64 the run week and 65 the week after – one point UNDER the knee –
    // so conditionMatchFactor reads ~0.968 and she carries a ~3% strength cost into next week.
    //
    // DOCUMENTED, NOT TUNED AWAY. It is the same rule the kid pays (one curve, one knee, one
    // ladder), and "the champion of a five-match international is a shade weaker the following week"
    // is the intent of the whole run-fatigue idea. The knee is the owner's knob if he wants the
    // no-op back – widening it to 65 would restore the old claim exactly – so this is flagged for
    // the tuning pass rather than patched here. What the test now pins is the SHAPE: one deep run
    // is a small, recoverable dent, not the cliff that ACCUMULATED load is. ***
    //
    // *** RE-PINNED 0.95 -> 0.90 by the MATCH BASE RAISE (26.07, 1 -> 2). The J300 title now costs 41
    // rather than 36, so the fresh champion lands on 60 (was 65) and reads ~0.936 (was ~0.968): the
    // dent roughly DOUBLED, 3% -> 6.4%. Still the shape this test pins – a recoverable shade, five
    // quiet weeks from gone – but the base raise pushed her 10 points under the knee instead of 5,
    // and that is exactly the "widen the knee to 65" question the note above flagged, now louder.
    // The bound is loosened once, deliberately, and stays a bound rather than a point pin. ***
    const fresh = rivalCondition([row('j300', 0, 12, 'ai-fresh')], 'ai-fresh', 13)
    expect(fresh).toBe(R.max - (5 * matchDrain('j300', undefined) + LADDER5) + R.recoveryBase) // 60
    expect(fresh).toBeLessThan(R.max)
    // she has crossed the knee, but only just: a few percent, nowhere near the floor
    expect(fresh).toBeLessThan(R.matchStrengthKnee)
    const factor = conditionMatchFactor(fresh)
    expect(factor).toBeLessThan(1)
    expect(factor).toBeGreaterThan(0.9) // ~0.936 shipped: a shade, not a cliff
    // ...and the cliff is still reserved for accumulated load – the A4 runner above, who arrives at
    // the same J300 already carrying three recent draws, is far weaker than this fresh champion.
    expect(conditionMatchFactor(rivalCondition(runner, 'ai-run', 13))).toBeLessThan(factor)
  })

  it('after enough quiet weeks the two converge again', () => {
    const quiet = 13 + R.rivalFatigueWindowWeeks
    expect(rivalCondition(runner, 'ai-run', quiet)).toBe(rivalCondition(rester, 'ai-rest', quiet))
    expect(rivalCondition(runner, 'ai-run', quiet)).toBe(R.max)
  })
})

// ---------------------------------------------------------------------------
// Part B — derived play styles. A pure function of the attributes the cohort was ALREADY
// generated with, fed with the event's surface through applySurfaceStyle.
// ---------------------------------------------------------------------------

const STYLES: PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']
const SURFACES: Surface[] = ['hard', 'clay', 'grass']

/** A bare MatchPlayer with the given attributes – style reads only serve/ret/stamina, and
 *  `groundstrokes` is level at 50 so it never tilts a matchup these cases are not about. */
function player(serve: number, ret: number, stamina: number, composure = 50): MatchPlayer {
  return { id: 'p', name: 'P', serve, ret, composure, stamina, groundstrokes: 50 }
}

/** ⚠ A COHORT ROW IS NOT A `MatchPlayer` SINCE v25 - `AiPlayer` is `Omit<MatchPlayer,
 *  'groundstrokes'>`, because the cohort must not STORE a fifth attribute (`driftCohort`'s four
 *  main-stream draws per player are what the frozen capture is made of). `rivalMatchPlayer` derives
 *  it; these composition tests re-derive it the same way so they compare like with like. */
const withGs = (p: AiPlayer): MatchPlayer => ({ ...p, groundstrokes: rivalGroundstrokes(p) })

describe('B1 — the style thresholds are exported, documented knobs', () => {
  it('sits inside the cohort generation ranges (serve/ret 30-60, stamina 30-70)', () => {
    expect(RIVAL_STYLE.serveEdge).toBeGreaterThan(0)
    for (const t of [RIVAL_STYLE.highServe, RIVAL_STYLE.highRet]) {
      expect(t).toBeGreaterThan(30)
      expect(t).toBeLessThan(60)
    }
    expect(RIVAL_STYLE.highStamina).toBeGreaterThan(30)
    expect(RIVAL_STYLE.highStamina).toBeLessThan(70)
  })
})

describe('B2 — styleOf: a pure function of existing attributes, in the spec order', () => {
  const s = RIVAL_STYLE

  it('a serve clearly ahead of the return is serve-first, and it wins over every other arm', () => {
    expect(styleOf(player(58, 58 - s.serveEdge, 30))).toBe('serve-first')
    // ...even when the counterpuncher and aggressive arms would BOTH also match: the loudest
    // signal is checked first (spec order), so the classification is total and unambiguous.
    expect(styleOf(player(60, 60 - s.serveEdge, 70))).toBe('serve-first')
    expect(styleOf(player(58, 58 - s.serveEdge + 1, 30))).not.toBe('serve-first') // one short of the gap
  })

  it('a high return on high stamina is a counterpuncher – legs, not the first ball', () => {
    expect(styleOf(player(s.highRet, s.highRet, s.highStamina))).toBe('counterpuncher')
    // Same return, no legs: she cannot grind, so she is the aggressive baseliner instead.
    expect(styleOf(player(s.highServe, s.highRet, s.highStamina - 1))).toBe('aggressive')
  })

  it('two weapons without the legs is aggressive; anything else is all-court', () => {
    expect(styleOf(player(s.highServe, s.highRet, 30))).toBe('aggressive')
    expect(styleOf(player(s.highServe - 1, s.highRet, 30))).toBe('all-court') // one weapon short
    expect(styleOf(player(40, 40, 40))).toBe('all-court')
    expect(styleOf(player(30, 30, 30))).toBe('all-court') // the generation floor
  })

  it('is pure: same attributes, same style, and it never touches the player object', () => {
    const p = player(52, 44, 60)
    const snapshot = JSON.stringify(p)
    expect(styleOf(p)).toBe(styleOf(p))
    expect(JSON.stringify(p)).toBe(snapshot)
  })
})

describe('B3 — the style histogram over a REAL generated cohort', () => {
  const cohort = generateCohort('rival-style-histogram')

  it('every style is represented and none swallows the field', () => {
    const counts = new Map<PlayStyle, number>(STYLES.map((s) => [s, 0]))
    for (const p of cohort) counts.set(styleOf(p), counts.get(styleOf(p))! + 1)
    // Reported in the slice write-up; asserted as a BAND, not a pin, so cohort tuning stays free.
    for (const style of STYLES) {
      const share = counts.get(style)! / cohort.length
      expect(share, `${style} share`).toBeGreaterThan(0.05) // present, and not a curiosity
      expect(share, `${style} share`).toBeLessThan(0.5) // ...and not the whole field
    }
    expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(cohort.length) // total, no gaps
  })

  it('holds across independent cohort seeds – it is the thresholds, not one lucky draw', () => {
    for (const seed of ['alpha', 'bravo', 'charlie', 'bench-working-0']) {
      const present = new Set(generateCohort(seed).map(styleOf))
      expect(present.size, `seed ${seed}`).toBe(STYLES.length)
    }
  })
})

describe('B4 — applySurfaceStyle: the surface finally cuts both ways', () => {
  it('is pure and leaves identity fields (and composure) alone', () => {
    const p = player(50, 50, 50)
    const out = applySurfaceStyle(p, 'serve-first', 'grass')
    expect(out).not.toBe(p)
    expect(p).toEqual(player(50, 50, 50)) // input untouched
    expect(out.id).toBe(p.id)
    expect(out.name).toBe(p.name)
    expect(out.composure).toBe(p.composure)
  })

  it('serve-first is rewarded on grass and blunted on clay', () => {
    const p = player(50, 50, 50)
    expect(applySurfaceStyle(p, 'serve-first', 'grass').serve).toBeGreaterThan(p.serve)
    expect(applySurfaceStyle(p, 'serve-first', 'clay').serve).toBeLessThan(p.serve)
  })

  it('the counterpuncher is rewarded on clay and exposed on grass', () => {
    const p = player(50, 50, 50)
    expect(applySurfaceStyle(p, 'counterpuncher', 'clay').ret).toBeGreaterThan(p.ret)
    expect(applySurfaceStyle(p, 'counterpuncher', 'grass').ret).toBeLessThan(p.ret)
  })

  it('all-court is neutral everywhere – that IS its identity, no weaknesses and no shortcuts', () => {
    const p = player(50, 44, 61)
    for (const surface of SURFACES) expect(applySurfaceStyle(p, 'all-court', surface)).toEqual(p)
  })

  it('stays a COLOURING: no attribute moves more than 10% on any (style, surface) cell', () => {
    const p = player(50, 50, 50)
    for (const style of STYLES) {
      for (const surface of SURFACES) {
        const out = applySurfaceStyle(p, style, surface)
        for (const key of ['serve', 'ret', 'stamina'] as const) {
          expect(Math.abs(out[key] - p[key]) / p[key], `${style}/${surface}/${key}`).toBeLessThanOrEqual(0.1)
        }
      }
    }
  })

  it('no style is uniformly better: every non-neutral style gives back somewhere', () => {
    const p = player(50, 50, 50)
    for (const style of STYLES.filter((s) => s !== 'all-court')) {
      const sums = SURFACES.map((surface) => {
        const out = applySurfaceStyle(p, style, surface)
        return out.serve + out.ret + out.stamina
      })
      expect(Math.min(...sums), style).toBeLessThan(p.serve + p.ret + p.stamina)
      expect(Math.max(...sums), style).toBeGreaterThan(p.serve + p.ret + p.stamina)
    }
  })
})

describe('B5 — rivalMatchPlayer: ONE composition, in the kid order, applied exactly once', () => {
  const rival = generateCohort('compose')[0]

  it('is base -> surface/style -> condition factor, and nothing else', () => {
    const condition = 40
    const built = rivalMatchPlayer(rival, 'clay', condition)
    const styled = applySurfaceStyle(withGs(rival), styleOf(rival), 'clay')
    const factor = conditionMatchFactor(condition)
    expect(built.serve).toBeCloseTo(styled.serve * factor, 12)
    expect(built.ret).toBeCloseTo(styled.ret * factor, 12)
    expect(built.stamina).toBeCloseTo(styled.stamina * factor, 12)
    // composure takes the condition factor only – the style table deliberately never touches it.
    expect(built.composure).toBeCloseTo(rival.composure * factor, 12)
  })

  it('a fresh rival is her styled self exactly – the condition factor is a no-op above the knee', () => {
    for (const surface of SURFACES) {
      const fresh = rivalMatchPlayer(rival, surface, ECONOMY.condition.max)
      const styled = applySurfaceStyle(withGs(rival), styleOf(rival), surface)
      expect(fresh.serve).toBeCloseTo(styled.serve, 12)
      expect(fresh.ret).toBeCloseTo(styled.ret, 12)
    }
    // ...and the default argument means "fresh", so a caller with no derived condition is safe.
    expect(rivalMatchPlayer(rival, 'hard')).toEqual(rivalMatchPlayer(rival, 'hard', ECONOMY.condition.max))
  })

  it('a tired rival is strictly weaker on every attribute, and never below the floor', () => {
    const fresh = rivalMatchPlayer(rival, 'hard', ECONOMY.condition.max)
    const spent = rivalMatchPlayer(rival, 'hard', ECONOMY.condition.min)
    for (const key of ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const) {
      expect(spent[key]).toBeLessThan(fresh[key])
      expect(spent[key]).toBeCloseTo(fresh[key] * ECONOMY.condition.matchStrengthFloor, 12)
    }
    expect(spent.id).toBe(rival.id)
    expect(spent.name).toBe(rival.name)
  })

  // ⚠ RE-AIMED: the expected key set gains `groundstrokes` (v25). The fact this test protects is
  // unchanged and is the reason it is an EXACT key-set comparison rather than a spot check: what goes
  // into a bracket is a `MatchPlayer` and NOT a cohort row - `nation`, `growth`, `ageYears` and
  // `potential` must not ride along into the match model.
  //
  // The new key makes that claim STRONGER rather than weaker, and this is the one test that says so:
  // `groundstrokes` is present on the built player and absent from the stored rival, which is exactly
  // the v25 arrangement (`AiPlayer = Omit<MatchPlayer, 'groundstrokes'>`, derived at match time so
  // `driftCohort` keeps its four main-stream draws per player and the frozen capture cannot move).
  // ⚠ RE-AIMED AGAIN (equipment/serve-speed slice): the key set gains `age`, and the distinction it
  // draws is the point rather than an exception to it. `ageYears` is a COHORT field and still must not
  // ride along - the assertion below says so explicitly. `age` is a MatchPlayer field that the
  // composition point DERIVES from it, exactly as `groundstrokes` is derived, because the serve-speed
  // curve (match/serveSpeed.ts) is a function of age and a box score against a sixteen-year-old has to
  // report a sixteen-year-old's serve. `nation`, `growth` and `potential` are still barred outright.
  // ⚠ RE-AIMED AGAIN (27.08, the retirement hazard's own condition curve – docs/specs/
  // retirement-shape-2026-08.md §13): the key set gains `condition`, and it is the SAME distinction
  // one more time rather than an exception to it. It is a MatchPlayer field the composition point
  // takes from its own `condition` ARGUMENT – the identical number `conditionMatchFactor` two lines
  // above turns into the strength factor – so the built player carries the freshness she stepped on
  // court at and the cohort row carries nothing new. No AiPlayer field rides along: `nation`,
  // `growth`, `potential` and `ageYears` are still barred and still asserted below. The reason it has
  // to be ON the player rather than handed in at simulation time is a replay one and it is argued in
  // `MatchPlayer.condition` – a stored match must re-watch as the match that was played.
  it('drops the AiPlayer-only fields: a MatchPlayer goes into the bracket, not a cohort row', () => {
    const built = rivalMatchPlayer(rival, 'hard', 80)
    expect(Object.keys(built).sort()).toEqual([
      'age', 'composure', 'condition', 'groundstrokes', 'id', 'name', 'ret', 'serve', 'stamina',
    ])
    // ...and it is the argument, not a re-derivation: one number, written once, read by the
    // retirement hazard and by nothing else.
    expect(built.condition).toBe(80)
    expect('condition' in rival).toBe(false)
    // ...and the cohort row it came from still does NOT hold the fifth attribute.
    expect('groundstrokes' in rival).toBe(false)
    expect(built.groundstrokes).toBeGreaterThan(0)
    // The cohort's OWN key is still absent from the match model, and the derived one carries its value.
    expect('ageYears' in built).toBe(false)
    expect(built.age).toBe(rival.ageYears)
    // The three that have never been allowed through are still not allowed through.
    for (const banned of ['nation', 'growth', 'potential']) expect(banned in built).toBe(false)
  })

  it('is deterministic and never mutates the cohort row', () => {
    const snapshot = JSON.stringify(rival)
    expect(rivalMatchPlayer(rival, 'grass', 55)).toEqual(rivalMatchPlayer(rival, 'grass', 55))
    expect(JSON.stringify(rival)).toBe(snapshot)
  })
})

// ---------------------------------------------------------------------------
// C — the WIRING. Both halves reach the bracket through one helper, in a real ticked world.
// ---------------------------------------------------------------------------

/** Tick a fresh world `weeks` weeks, resolving any reveal so time keeps moving. */
function runWorld(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

describe('C1 — a cohort row carries exactly what it is meant to, and nothing else', () => {
  it('the row is its generated fields plus the two Phase-4 ones, and no more', () => {
    // ⚠ RE-AIMED at v20. C1's rule was "derive, never store" and it was right for FATIGUE - which
    // is still derived from the results ledger and still stored nowhere. It was never a rule
    // against the cohort HAVING properties: age and a ceiling are facts about a person, not a
    // cache of something computable, and without them the field grew about 1.5 a year for ever
    // and no career could catch the ladder.
    //
    // What C1 actually guards - that a row does not quietly accumulate derived state - is
    // unchanged, and this list is still exhaustive.
    const world = runWorld('rival-wiring', 8)
    expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    for (const p of world.cohort.slice(0, 5)) {
      expect(Object.keys(p).sort()).toEqual([
        'ageYears',
        'composure',
        'growth',
        'id',
        'name',
        'nation',
        'potential',
        'ret',
        'serve',
        'stamina',
      ])
    }
    // ...and no CONDITION or fatigue is stored on a rival, which is the half of C1 that was never
    // about schema at all.
    for (const p of world.cohort) {
      expect(Object.keys(p)).not.toContain('condition')
      expect(Object.keys(p)).not.toContain('fatigue')
    }
  })

  it('AI result rows now record their tier, so next week reconstructs them EXACTLY', () => {
    const world = runWorld('rival-wiring', 8)
    const ai = world.results.filter((r) => r.playerId !== KID_ID && r.week > 0)
    expect(ai.length).toBeGreaterThan(0)
    expect(ai.every((r) => r.tier !== undefined)).toBe(true)
    // ...and the tier is a real one, whose points array really does contain that value.
    for (const r of ai.slice(0, 40)) expect(TIERS[r.tier!].points).toContain(r.points)
  })
})

describe('C2 — a real season produces genuinely tired rivals, and nobody is pinned all season', () => {
  const world = runWorld('rival-wiring', 40)

  it('the ledger feeds the derivation: the field SPANS, tired to fresh', () => {
    const conds = world.cohort.map((p) => rivalConditions(world.results, world.week).get(p.id) ?? ECONOMY.condition.max)
    expect(conds.some((c) => c < ECONOMY.condition.matchStrengthKnee)).toBe(true)
    // ⚠ RE-AIMED, AND THE RE-AIM IS THE FIX WORKING (31.07, fix/no-double-booking). This line used to
    // read `conds.some((c) => c === ECONOMY.condition.max)` – "...and some are fresh" – and it passed
    // for a reason nobody wanted: a player sits at EXACTLY 100 only when she has no ledger row in the
    // whole 16-week fatigue window, i.e. when she has not played a single tournament in four months.
    // Measured before the fix, 8 seeds x 40 ticked weeks: 9-16 of the 199 were untouched at any given
    // moment and 4.5-7.5% of the cohort never played AT ALL, while the players the standings favour
    // were drawn into two of the same week's draws and carried 37.7-42.9 events a season. The old
    // assertion was reading the "exhausted elite and a crowd of extras" split that the availability
    // gate's own note describes, and calling it freshness.
    //
    // The fix removes the crowd: nobody is double-booked on a fillable week, so the load spreads and
    // EVERY rival now plays (share who never play: 4.5-7.5% -> 0.0%; busiest rival 42.9 -> 35.1
    // events a season). Untouched-at-100 correctly goes to zero, and the claim is restated at the
    // level the world now holds – the field still spans, and its top is genuinely fresh rather than
    // merely idle. Measured on this seed: min 0 · median 35 · p90 64 · max 96, with 16 of 199 above
    // the knee and the lowest per-week maximum over the window at 95.
    expect(conds.some((c) => c >= ECONOMY.condition.matchStrengthKnee)).toBe(true)
    expect(Math.max(...conds) - Math.min(...conds)).toBeGreaterThan(50)
  })

  it('NO rival sits at the floor for the whole season, and the FIELD is never inverted', () => {
    // *** RE-PINNED AND RE-SHAPED (wave-3, season blocks). This asserted `< weeks / 2` floored weeks
    // for EVERY rival on ONE seed, and the season-block slice broke it: the worst rival on
    // 'rival-wiring' went 9 -> 13 of 20 weeks at the floor.
    //
    // The bound was seed luck, exactly like the two earlier versions of this test that the file
    // already documents. Swept over 8 seeds x BOTH surface mixes (the block table flattened back to
    // hard .5 / clay .35 / grass .15 is the pre-slice engine), worst floored weeks out of 20:
    //     FLAT (pre-slice)   9 · 11 · 9 · 10 · 10 · 10 · 12 · 13    (>= 10 on FIVE of eight seeds)
    //     BLOCKS (shipped)   13 · 10 · 8 · 11 · 8 · 8 · 8 · 11
    // The two are statistically indistinguishable, and the flat mix was already over the old bound
    // on most seeds – 'rival-wiring' simply happened to be a clean cell for it. Asserting a
    // one-seed number was going to break on the next content change either way.
    //
    // MECHANISM the blocks do add, worth the owner's attention rather than a tighter bound: a block
    // gives one style a LONG run of favourable courts (the clay swing is 15 weeks), so a specialist
    // rival can win deep three or four times in a row and grind herself to the floor for a stretch.
    // Under the flat mix nobody got a 15-week favourable run. It is realistic, it stays confined to
    // 1-2 players of 199, and it is bounded by rivalFatigueWindowWeeks – but it IS the kind of thing
    // a future "rival plans her season" slice should manage rather than suffer.
    //
    // What is asserted now is the property economy.ts actually claims for the fatigue window, on the
    // FIELD rather than on one player:
    //   1. nobody is floored for the whole window (the title's literal claim);
    //   2. heavy pinning stays a handful of the 199, not the standings (measured 0-2, either mix);
    //   3. the cohort's MEDIAN condition stays healthy, so the ranking is coloured, not inverted.
    //
    // *** RE-PINNED (2) 3 -> 10 by the MATCH BASE RAISE (26.07, 1 -> 2). The cohort pays the SAME
    // per-match drain the kid does and recovers at recoveryBase 1/week with no slider, no physio and
    // no vacation, so a base raise lands on the rivals harder than on any player. MEASURED, 8 seeds
    // × 40 ticked weeks × 199 rivals, window 20w (tools sweep, base patched with the runsIndex memo
    // invalidated – it is keyed on the ladder array, so a matchFatigue patch alone is invisible to it):
    //     base 1   worst floored 7-13/20 · heavy(>=10w) 0-2 · ever floored 13.1-15.1% · min median 98
    //     base 2   worst floored 12-14/20 · heavy(>=10w) 2-9 · ever floored 21.1-23.6% · min median 93-96
    // So: claims (1) and (3) hold with room to spare – the median rival is still fit every week, i.e.
    // the standings are still COLOURED and not inverted, which is the property that protects the
    // ranking. What degraded is (2): the handful went 0-2 -> 2-9 of 199 (1% -> 4.5%). Bound set at 10
    // from the measured 9, not tightened onto it.
    // ⚠ FLAGGED FOR THE OWNER, not tuned here: `ever floored` is now 21-24% against a 25% bound, and
    // the same sweep at 60 ticked weeks measures 25.6% – i.e. a longer world already crosses it. The
    // knob for that is `rivalFatigueWindowWeeks` (16), which economy.ts documents as chosen precisely
    // because "at recoveryBase 1/week their drain outruns their recovery permanently"; one rung more
    // drain shortens the window that statement is true for. ~12-13 is the follow-up to measure. ***
    const weeks = 20
    const flooredWeeks = new Map<string, number>()
    const medians: number[] = []
    for (let w = world.week - weeks + 1; w <= world.week; w++) {
      const conds = rivalConditions(world.results, w)
      for (const [id, c] of conds) if (c === ECONOMY.condition.min) flooredWeeks.set(id, (flooredWeeks.get(id) ?? 0) + 1)
      // the WHOLE field: a player with no rows in the window is fresh by construction
      const all = world.cohort.map((p) => conds.get(p.id) ?? ECONOMY.condition.max).sort((a, b) => a - b)
      medians.push(all[Math.floor(all.length / 2)])
    }
    // 1. never the whole window, and a tripwire well clear of the measured 13/20 worst case
    for (const [id, n] of flooredWeeks) {
      expect(n, `${id} floored weeks`).toBeLessThan(weeks)
      expect(n, `${id} floored weeks`).toBeLessThanOrEqual(0.75 * weeks)
    }
    // 2. a handful of the field, not the field
    // *** ⚠⚠⚠ RE-PINNED (2) 10 -> 15 AND (3) RE-AIMED, BY THE ADULT RUNGS (31.07, task #17), AND
    // THIS IS THE BIGGEST SINGLE FINDING OF THAT SLICE. It is a re-aim of the assertions and an
    // HONEST RECORD of a real regression, not a tidy-up: the number that moved is the health of the
    // whole field, and it moved a long way.
    //
    // WHAT HAPPENED, mechanically and without mystery. The calendar went from 92 events a season to
    // 139 (26 W15 + 17 W35 + 4 W100). `selectEntrants` fills all of them from the SAME 199 rivals,
    // because the junior rungs have no maximum age - so a seventeen-year-old is now drawn into the
    // junior tour AND the professional tour in the same season, and the cohort's competitive load
    // rose ~50%, from ~14.8 events per rival per season to ~22.3. Their recovery did not: it is
    // still `recoveryBase` 1/week with no slider, no physio and no vacation, which economy.ts
    // already describes as a drain that "outruns their recovery permanently", bounded only by
    // `rivalFatigueWindowWeeks`.
    //
    // MEASURED, 8 seeds x 40 ticked weeks x 199 rivals, window 20w, against the same sweep the note
    // above records for the match-base raise:
    //     before (base 2, 6 rungs)   worst 12-14/20 · heavy(>=10w) 2-9  · ever 21.1-23.6% · minMedian 93-96
    //     after  (base 2, 9 rungs)   worst 12-13/20 · heavy(>=10w) 2-12 · ever 23.1-29.1% · minMedian 34-35
    //
    // ⚠ THE KNOB THE PREVIOUS NOTE FLAGGED DOES NOT FIX IT, which is why this is reported rather
    // than tuned. That note named `rivalFatigueWindowWeeks` (16) and proposed "~12-13" as the
    // follow-up; swept here at 16/13/12/11/10 under the new load, minMedian goes 34 / 38 / 41 / 43 /
    // 45 - it never gets back over the knee (70), because the window bounds the MEMORY of the drain
    // and the drain itself is 50% larger. The actual fix is §4.1 of
    // docs/specs/adult-tour-and-endings.md - `maxAgeYears` on the J tiers, so a rival plays ONE tour
    // rather than two - which that spec sequences after this slice and which is out of its scope.
    // Flagged for the owner in the commit message and the report.
    //
    // WHAT IS STILL ASSERTED, and it is all three original claims, restated at the level the world
    // now holds rather than deleted:
    //   1. nobody is floored for the whole window - UNCHANGED and untouched below (worst 13/20).
    //   2. heavy pinning is still a handful, not the standings. Bound 15, set from the measured 12
    //      the way the old 10 was set from a measured 9 - never tightened onto today's number.
    //   3. THE STANDINGS ARE STILL COLOURED, NOT INVERTED. This is what claim 3 was always for, and
    //      it survives: the median rival sits at ~34, which is tired but is a long way clear of the
    //      floor and of the doctor's veto, and the field still spans fresh to floored (the sibling
    //      case above asserts both ends). What it can no longer say is "fit EVERY week" - so the
    //      assertion names the floor it actually defends and the regression is visible in this diff
    //      instead of being quietly deleted with the line that used to catch it.
    // *** ⚠⚠⚠ RE-PINNED (2) 15 -> 30 AND THE SHARE 0.35 -> 0.40, BY W2-LADDER (the three new W
    // rungs) - the task-#17 note above, happening again one wave later, for the same mechanical
    // reason at a smaller scale. The calendar went 139 -> 164 events a season (13 W50 + 8 W75 + 4
    // WTA 125), and every one of the 25 new draws is filled from the SAME live cohort: the
    // canonical `seed:aitour:` brackets deliberately exclude the field pros (a pro must never
    // write into `world.results` - fieldPros.ts's scope fence), so 25 x 32 = 800 more player-weeks
    // a season land on the ~82 sixteen-and-overs the W age gates admit. Their recovery is still
    // recoveryBase 1/week.
    //
    // MEASURED, the same sweep as every re-pin above (8 seeds x 40 ticked weeks x 199 rivals,
    // window 20w; scratchpad c2-sweep, W2-LADDER):
    //     before (9 rungs)    worst 11-13/20 · heavy(>=10w) 4-12  · ever 23.6-28.1% · minMedian 35-37
    //     after  (12 rungs)   worst 13-14/20 · heavy(>=10w) 17-28 · ever 29.1-34.7% · minMedian 28-31
    //
    // WHAT STILL HOLDS, all three claims' structure intact: (1) nobody is floored for the whole
    // window - untouched, worst 14/20 against the 15 tripwire; (3) the standings are still
    // COLOURED, NOT INVERTED - the median rival sits at 28-31, above the min+25 line and the
    // doctor's veto, asserted below unchanged. What is re-bounded is (2): heavy pinning is 17-28
    // of 199, bound set at 30 from the measured 28 the way 15 was set from 12 and 10 from 9 -
    // never tightened onto today's number - and the ever-floored share at 0.40 from the measured
    // 34.7%.
    //
    // ⚠ THE FIX IS A POPULATION, NOT A KNOB, AND IT IS THE NEXT WAVE'S BY NAME. The task-#17 note
    // said §4.1's age cap; it landed, helped, and the load has outgrown it again. The remedy for a
    // 199-strong cohort carrying a 164-event calendar is docs/specs/living-field.md's population -
    // and W2-FIELD2 (act2-pro-tour.md §8, entry: W2-LADDER merged) is where the field grows its
    // fourth storey and the field-quality bench gets recalibrated per rung. Re-measure THIS sweep
    // there; if the live cohort's W load is not relieved by that wave's design, this bound is the
    // evidence to bring the owner.
    //
    // ✅⚠ W2-FIELD2 RE-MEASURED IT, AND THE ANSWER IS HALF GOOD AND HALF STRUCTURAL. The note above
    // asks the next wave whether the population relieves the load. It does not, and it CANNOT: the
    // canonical `seed:aitour:` brackets are LIVE-ONLY by fieldPros.ts's own scope fence (a derived
    // pro must never write into `world.results`), so 364 professionals absorb exactly ZERO of the
    // 25 extra W draws a season. Measured directly: W result rows per rival over the window are
    // 4.50 before the wave and 4.50 after, to two decimals, by construction. Letting pros into the
    // canonical brackets needs fp-safe result rows, which living-field.md §8.3 books for act 3 BY
    // NAME - so this is reported as a coupling, not resolved by inventing one.
    //
    // WHAT DID MOVE is WHO carries the load, and it moved a long way. The wave slid every W
    // entrant window down the table (w15 [0.15, 0.75] -> [0.35, 0.85] and so on up), so the W draws
    // stop landing on the same top slice of the cohort. Same sweep as every re-pin above (8 seeds x
    // 40 ticked weeks x 199 rivals, window 20w), the two band sets on identical code:
    //     PRE  (W2-LADDER bands)   worst 14-15/20 · heavy 20-27 · ever 27.6-33.7% · minMedian 29-31
    //     POST (W2-FIELD2 bands)   worst 13-14/20 · heavy 10-20 · ever 33.7-38.2% · minMedian 27-31
    // and on THIS test's own seed: heavy 27 -> 9, ever 34.2% -> 35.7%, minMedian 29 -> 27.
    //
    // That is the same trade `resolveDoubleBookings`' own note describes from the other side:
    // spreading a fixed load over more bodies pulls the extremes in. Heavy pinning is cut by about
    // 60%, and the price is that MORE rivals touch the floor at least once.
    //
    // SO (2) TIGHTENS AND THE SHARE DOES NOT. 30 -> 25, from the sweep's measured 20 the way 30 was
    // set from 28 and 15 from 12 - never onto today's number. The ever-floored bound STAYS at 0.40:
    // it moved the wrong way (33.7-38.2% against a 0.40 bound is the tightest this guard has ever
    // been) and tightening a bound a change just pushed toward would be dishonest. ⚠ FLAGGED FOR
    // THE OWNER: at 38.2% there is one wave of headroom left on that line, and the remedy is the
    // act-3 item above rather than another band move.
    const heavy = [...flooredWeeks.values()].filter((n) => n >= weeks / 2).length
    expect(heavy, 'rivals floored for half the window').toBeLessThanOrEqual(25)
    expect(flooredWeeks.size / world.cohort.length, 'share ever floored').toBeLessThan(0.4)
    // 3. coloured, not inverted: the median rival is never at or near the floor, and never under the
    //    doctor's veto - so the table still sorts on tennis rather than on exhaustion.
    for (const m of medians) {
      expect(m, 'median rival at the floor').toBeGreaterThan(ECONOMY.condition.min + 25)
      expect(m, 'median rival under the doctor\'s veto').toBeGreaterThan(ECONOMY.availability.medicalFloor)
    }
    // ...and the loss of the old "above the strength knee every week" claim is pinned as a FACT, so
    // that if a later slice (§4.1's age cap) gives the field its condition back, this line fails and
    // somebody has to come back and restore the stronger assertion above rather than leave it weak.
    //
    // ⚠⚠⚠ THE TRIPWIRE WAS AIMED AT THE WRONG SUSPECT, AND THIS IS THE DISPROOF (31.07,
    // fix/no-double-booking). The note above names ONE cause – "the same 199 rivals now fill 139
    // events a season" – and the branch that followed it went after the most obvious half of that:
    // the same rival was being drawn into TWO of a week's tournaments and playing both, 14,381 of
    // 45,675 player-weeks in a draw (31.5%), 17,301 appearances the calendar does not contain. That
    // is fixed; it is now 0% on every week the calendar does not over-subscribe (see C5 below). AND
    // THE MEDIAN DID NOT COME BACK. Measured with this very block's methodology, 8 seeds x 40 ticked
    // weeks x 199 rivals, window 20w:
    //     before the fix   minMedian 34-36 · worst floored 11-13/20 · heavy 5-11 · ever 23.1-27.1%
    //     after  the fix   minMedian 35-37 · worst floored 11-13/20 · heavy 4-12 · ever 23.6-28.1%
    //
    // WHY, and it is arithmetic rather than a mystery: DOUBLE-BOOKING NEVER ADDED TENNIS TO THE
    // WORLD, IT CONCENTRATED IT. The number of draw slots a season contains is a property of the
    // calendar alone – 3,616 of them over 199 rivals, ~18 events per rival per season – and the fix
    // does not change it by one. What it changes is the DISTRIBUTION: the busiest rival went 42.9 ->
    // 35.1 events a season and the share who never played at all went 4.5-7.5% -> 0.0%. Total strain
    // is untouched, so the median cannot move much, and it moved 1-2 points (upward, because strain
    // spent on a player already clamped at 0 is strain that lands on nobody).
    //
    // SO THE CAUSE IS THE LOAD ITSELF: ~18 tournaments a season each, against a recovery of
    // `recoveryBase` 1 a week and no slider, no physio and no vacation. The note above is right that
    // the fix is a rung that reduces how many draws one rival is eligible for (§4.1's `maxAgeYears`
    // on the J tiers), and this branch is the evidence that nothing short of that will do it – the
    // knob sweep in the note ruled out `rivalFatigueWindowWeeks`, and this rules out the collisions.
    // The assertion below is therefore LEFT AS IT IS, still inverted, still honest, still waiting.
    //
    // ⚠⚠⚠⚠ AND THE 93-96 THIS BLOCK REMEMBERS IS ITSELF SUSPECT, WHICH IS THE FINDING THE OWNER
    // SHOULD READ FIRST. The collision is NOT an adult-tour bug: re-measured on the junior-only
    // calendar (the three W rungs' cadence zeroed, so `buildSeason` rebuilds the 92-event season this
    // block's "before" column came from), 6,198 of 27,248 player-weeks in a draw – 22.7% – were
    // double-booked there too, and 30.7-33.7% of the cohort never played at all. The overlapping
    // junior windows are the whole cause (j300 [0, 0.25], j60 [0.05, 0.4], j30 [0.12, 0.6], national
    // [0.2, 0.7]); the adult rungs only made it visible. So the "field" behind every historical
    // number in this repo was an over-worked third playing twice a week and an idle third not playing
    // at all, and 93-96 is the median of THAT distribution. Same methodology, junior-only arm:
    //     before the fix   minMedian 69-79 · at 100: 75-80 of 199 · never played 30.7-33.7%
    //     after  the fix   minMedian 63-70 · at 100: 61-64 of 199 · never played 26.6-28.6%
    // The median goes DOWN there and UP on nine rungs, and it is one effect seen from two sides:
    // spreading a fixed load over more bodies pulls the extremes in. (Those junior-arm numbers are a
    // MODEL of the old calendar on today's engine – `tierPhase` still divides by a nine-rung ladder,
    // so the weeks land differently and the absolutes sit below the historical 93-96. The before/after
    // WITHIN the arm is a fair comparison; the cross-branch one is not.)
    // FOR THE OWNER: relative comparisons in the old benches probably survive – the defect was in both
    // arms of every A/B – but absolute statements about the FIELD's health do not.
    //
    // ✅✅ THE TRIPWIRE FIRED, AND THIS IS IT BEING PAID (W3-FIELD3, 04.08). Every note above ends in
    // the same sentence – the fix is a POPULATION that absorbs the W draws, and the fence in
    // fieldPros.ts is what stops it – and W2-FIELD2's own entry ends "letting pros into the canonical
    // brackets needs fp-safe result rows, which living-field.md §8.3 books BY NAME". That is this
    // wave: the W-track canonical brackets draw from LIVE ∪ 364 professionals, and a pro leaves no
    // ledger row. So the assertion the note asked to have restored is restored, at the knee it
    // originally defended and not at today's number.
    //
    // MEASURED, the same sweep as every re-pin above (8 seeds x 40 ticked weeks x 199 rivals, window
    // 20w), the seam OFF and ON on this very branch – i.e. a clean A/B, same seeds, same code:
    //     BEFORE (canonical W = LIVE only)   worst 10-19/20 · heavy 1-22 · ever 23.1-31.2% · minMedian 28-36
    //     AFTER  (canonical W = LIVE ∪ pros) worst  0/20    · heavy 0    · ever  0.0%       · minMedian 95-100
    // and the mechanism, measured in the unit the coupling was always stated in: W result rows per
    // rival over the window, 6.79 -> 0.00.
    for (const m of medians) {
      expect(m, 'the median rival is fit EVERY week - the knee claim, restored').toBeGreaterThan(
        ECONOMY.condition.matchStrengthKnee,
      )
    }
    // ⚠⚠ AND THE COST OF THE REPAIR, PINNED AS A FACT SO IT CANNOT BE MISTAKEN FOR A TARGET: the
    // cohort now carries NO professional load at all. Not less – none. A LIVE junior holds zero W
    // points, so she sits below all 364 pros in the merged W table, so she is outside every W rung's
    // entrant window (the widest, W15's, ends at percentile 0.72 and the pros alone fill it), so she
    // is never drawn, so she can never earn a W point. That is a CLOSED LOOP, and it is the same
    // closed loop the kid's own gate solves with an on-ramp rule (`tierFloorOpen` reads her ITF
    // junior points for W15, because "a player cannot hold a ranking in a table she has never played
    // in"). The AI juniors have no such rule and this wave deliberately does not invent one.
    //
    // So the field went from over-worked to under-worked in one step, and the honest reading is that
    // the load did not get SHARED, it MOVED. Reported for the owner, not tuned here: the knobs are
    // an AI on-ramp (a junior's ITF standing positioning her in the merged W tail) or a smaller
    // professional share of each W draw. If either lands, this line fails and its author has to come
    // back and restate the trade rather than let it drift.
    //
    // ✅⚠ IT LANDED, AND THIS IS THE TRADE RESTATED (W3-ONRAMP, 04.08 – the owner: «Замкнутый круг у
    // ИИ-юниорок - да, надо чинить»). The first of the two knobs named above is what shipped, in the
    // second of its two forms: a W draw HOLDS `ON_RAMP.slots` (2 of 32) for LIVE players who clear
    // the rung's own acceptance door – the kid's door, `tierFloorOpen`'s W arm asked of a cohort id
    // through `proDoors`. Nobody is given a W point she did not win; what opens is the door.
    //
    // MEASURED, this block's own methodology and unit (8 seeds x 40 ticked weeks x 199 rivals,
    // 20-week window, tools/w-onramp-probe.ts – the `ON_RAMP.slots` 0/6 A/B on this very branch):
    //     BEFORE (W3-FIELD3 as merged)  W rows/rival 0.00 · minMedian 95-100 · worst 0/20 · heavy 0 · ever 0.0%
    //     AFTER  (the on-ramp)          W rows/rival 0.22 · minMedian 95-100 · worst 0/20 · heavy 0 · ever 0.0%
    // and against the state this whole block was written about, W2-FIELD2: 6.79 rows/rival and a
    // median of 28-36. So the load came back to the cohort at ONE THIRTIETH of the weight that broke
    // it, and the median rival's condition is UNMOVED to the resolution of this measurement - not
    // merely surviving the bound, identical to the arm with no on-ramp at all. Claims (1), (2) and
    // (3) above are untouched; nothing was re-bounded to let this through. Part of why is that the
    // held slots are filled AFTER the week is resolved (world.ts `fillWeekOnRamps`), so an on-ramp
    // entrant is a player who was not already playing somewhere else that week.
    //
    // ⚠ THE ASSERTION IS NOW TWO-SIDED, WHICH IS WHAT IT SHOULD ALWAYS HAVE BEEN. `toBe(0)` could
    // only ever catch the repair being spent; it could not catch the closed loop it was describing,
    // because the loop WAS the zero. The bound below is the load the knee claim can carry, set from
    // the measured 0.22 the way every other bound in this file was set from its measurement – so a
    // future wave that widens the on-ramp trips this line before it trips the medians.
    const wRows = world.results.filter(
      (r) => r.playerId !== KID_ID && r.tier !== undefined && TIERS[r.tier].track === 'wta' && world.week - r.week < weeks,
    )
    expect(wRows.length, 'the cohort is ON the professional ladder - the loop above, opened').toBeGreaterThan(0)
    expect(
      wRows.length / world.cohort.length,
      'W result rows per rival in the window - the load the knee claim can carry',
    ).toBeLessThan(1.5)
  })
})

describe('C3 — the kid faces the rivals who actually took the court', () => {
  it('her snapshotted opponents carry the surface/style modifier and their own fatigue', () => {
    const world = createWorld('rival-snapshot')
    const rng = rngFromSeed(world.seed)
    const target = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)!
    enterEvent(world, target.id)
    while (!world.pendingTournament) tickWeek(world, rng)
    const p = world.pendingTournament!
    const event = world.season.find((e) => e.id === p.eventId)!
    const byId = new Map(world.cohort.map((c) => [c.id, c]))
    const opponents = Object.entries(p.players).filter(([id]) => id !== KID_ID)
    expect(opponents.length).toBeGreaterThan(0)
    for (const [id, snapshot] of opponents) {
      const row = byId.get(id)!
      // ⚠ The fatigue must be read as it was BEFORE this event resolved. `world.results` already
      // carries this week's own AI rows by the time we look, and those rows are exactly what the
      // bracket did NOT see when it built its players.
      const priorResults = world.results.filter((r) => r.week < world.week)
      const fatigue = rivalConditions(priorResults, world.week).get(id) ?? ECONOMY.condition.max
      const expected = rivalMatchPlayer(row, event.surface, fatigue)
      expect(snapshot.id).toBe(expected.id)
      expect(snapshot.name).toBe(expected.name)
      // The snapshot is what the ONE composition helper builds – no second code path. It is taken
      // PRE-drift (step 2 of the tick; driftCohort is step 3), which is deliberate: it is what
      // keeps a revealed match record replayable however the cohort moves afterwards. So the
      // cohort row we read back here has had exactly one drift nudge applied.
      //
      // ⚠ RE-AIMED by the random-draw change (28.07). This compared a RATIO to two decimal places,
      // i.e. a 0.5% tolerance – which only ever held because she used to meet the number-one seed
      // in every first round. The top seed has the largest attributes in the field, so one drift
      // nudge was a small FRACTION of them. Now she meets whoever the draw gives her, and the same
      // absolute nudge on a weaker player's smaller numbers blows a relative tolerance. The bound
      // the engine actually guarantees is ABSOLUTE (one driftCohort step), so that is what we
      // check – it is the stronger statement anyway, and it no longer depends on who she drew.
      // ⚠ RE-PINNED 0.075 -> 0.09 by the two ladders (29.07), and the reason is arithmetic rather
      // than a weakened claim. The bound is ONE `driftCohort` step, whose size is a share of the
      // player's REMAINING HEADROOM - so it is largest for a rival who is young and far from her
      // ceiling. The point tables changed, so the standings changed, so the ENTRANT SELECTION
      // changed, and she now meets a different, younger set of opponents than she did before. The
      // statement is the same one: her snapshotted opponent is the live cohort row plus at most a
      // single drift nudge. 0.09 is that nudge's worst case across this field.
      const DRIFT_STEP = 0.09
      for (const key of ['serve', 'ret', 'composure', 'stamina'] as const) {
        expect(Math.abs(snapshot[key] - expected[key]), `${id}.${key}`).toBeLessThanOrEqual(DRIFT_STEP)
      }
    }
  })
})

describe('C4 — determinism: same seed, same world, and zero new draws', () => {
  it('two runs of the same seed produce identical ledgers, cohorts and ranks', () => {
    const a = runWorld('rival-determinism', 24)
    const b = runWorld('rival-determinism', 24)
    expect(b.results).toEqual(a.results)
    expect(b.cohort).toEqual(a.cohort)
    expect(b.kidRank).toBe(a.kidRank)
  })

  it('the per-week MAIN-stream draw count is still base costs + cohort drift and nothing else', () => {
    // The rival derivation is pure arithmetic over the ledger, so it cannot add a draw. Proved here
    // independently of the frozen B1/C1/P1 pins, which guard the same property from the other side.
    const world = createWorld('rival-draws')
    const base = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = base()
      draws.push(v)
      return v
    }
    const driftDraws = 4 * world.cohort.length
    for (let i = 0; i < 12; i++) {
      const before = draws.length
      tickWeek(world, rng)
      const week = draws.slice(before)
      const sponsorHit = week[2] < ECONOMY.sponsor.rollChance
      expect(week.length).toBe(driftDraws + (sponsorHit ? 4 : 3))
    }
  })
})

describe('C5 — a legacy ledger (every AI row tier-less) still ticks', () => {
  it('strips tier off the whole ledger, keeps ticking, and lands in the same bounds', () => {
    // Exactly the shape of a save written BEFORE this slice: pre-history and AI results alike
    // carry no `tier`, so every row goes through the cheapest-reading fallback. The engine must
    // run normally on it – this is the backward-compatibility guarantee, exercised through
    // tickWeek rather than through the pure function alone.
    const world = createWorld('rival-legacy')
    world.results = world.results.map(({ tier: _drop, ...rest }) => rest)
    const rng = rngFromSeed(world.seed)
    expect(() => {
      for (let i = 0; i < 12; i++) {
        tickWeek(world, rng)
        if (world.pendingTournament) {
          skipTournament(world)
          closeTournament(world)
        }
      }
    }).not.toThrow()
    const conds = [...rivalConditions(world.results, world.week).values()]
    expect(conds.length).toBeGreaterThan(0)
    for (const c of conds) {
      expect(c).toBeGreaterThanOrEqual(ECONOMY.condition.min)
      expect(c).toBeLessThanOrEqual(ECONOMY.condition.max)
    }
  })
})

// ---------------------------------------------------------------------------
/** How far each AGE POOL falls short of a week's demand on it - the Hall bounds of our eligibility
 *  classes (domestic = everyone; J = 13-18; the W family = 16+; its upper half = 17+).
 *  The classes are nested or disjoint, so these ARE the binding subsets, and the engine's
 *  residue on an unfillable week is their maximum (measured, the C5 third case pins it).
 *
 *  ⚠ THE W CLASSES ARE SERVED BY A SECOND POPULATION SINCE W3-FIELD3 (04.08). A W-track canonical
 *  draw comes from LIVE cohort ∪ the season's ~364 derived professionals (all of them aged 16-30),
 *  so a W demand is no longer a claim on the cohort's sixteen-plus alone - and the FIRST bound
 *  splits for the same reason: pros cannot fill a J30, so the "everybody" class is really "the
 *  non-professional rungs against the cohort". Getting this wrong does not fail loudly, it makes the
 *  C5 cases skip weeks that are in fact perfectly fillable. */
function poolShortfalls(world: WorldState, scheduled: SeasonEvent[]): number[] {
  const demand = (pred: (t: TierId) => boolean) =>
    scheduled.filter((e) => pred(e.tier)).reduce((s, e) => s + TIERS[e.tier].drawSize, 0)
  const supply = (pred: (age: number) => boolean) => world.cohort.filter((p) => pred(p.ageYears)).length
  const pros = fieldProsFor(world.seed, seasonIndexOf(world.week), world.cohort.map((p) => p.name))
  const proSupply = (pred: (age: number) => boolean) => pros.filter((p) => pred(p.ageYears)).length
  return [
    demand((t) => TIERS[t].track !== 'wta') - world.cohort.length,
    demand((t) => TIERS[t].track === 'wta') - (supply((a) => a >= 16) + proSupply((a) => a >= 16)),
    demand((t) => (TIERS[t].minAgeYears ?? 0) >= 17) - (supply((a) => a >= 17) + proSupply((a) => a >= 17)),
    demand((t) => TIERS[t].track === 'itf') - supply((a) => a >= 13 && a <= 18),
  ]
}

describe('C5 — one body, one week: a rival is never in two of a week\'s draws', () => {
  // THE OWNER'S QUESTION, 31.07: «они физически не могут сразу везде играть, ведь так?» They cannot,
  // and until fix/no-double-booking nothing in the code said so. `selectEntrants` was called once per
  // event, each call seeing the same condition map and knowing nothing about the week's other events,
  // so the players the standings favour were drawn into two tournaments on the same Tuesday and
  // played both — and `walkWindow` (season/rival.ts) charges EVERY run of a week against ONE week's
  // recovery, which is how it became the field's fatigue problem rather than a cosmetic one.
  //
  // MEASURED off the results ledger, 6 careers x 156 weeks (tools/double-booked.ts), on BOTH arms of
  // the calendar — because this is NOT an adult-tour bug, it is an old one the adult tour made
  // visible. The junior entrant windows overlap almost completely (j300 [0, 0.25], j60 [0.05, 0.4],
  // j30 [0.12, 0.6], national [0.2, 0.7]), so two junior events on one week have always drawn twice
  // out of the same slice of the table:
  //
  //   nine rungs (139 events/season)   before  45,675 player-weeks · 14,381 doubled (31.5%) · 17,301 phantom
  //                                    after   62,094 player-weeks ·    654 doubled ( 1.1%) ·    882 phantom
  //   six rungs  ( 92 events/season)   before  27,248 player-weeks ·  6,198 doubled (22.7%) ·  7,600 phantom
  //                                    after   34,848 player-weeks ·      0 doubled ( 0.0%) ·      0 phantom
  //
  // The junior arm reaches EXACTLY zero because no junior week is over-subscribed (its heaviest wants
  // 136 slots of 199). Every one of the nine-rung arm's remaining 654 sits on a week the CALENDAR
  // cannot fill — see the second test.
  //
  // A ROW IS AN APPEARANCE (the contract at the top of season/rival.ts): `runAiTournament` writes one
  // result row per entrant of every draw it runs, so two rows for one player in one week IS a rival
  // in two draws. That is why this guard reads the ledger rather than re-deriving the fields — it
  // asserts what the engine DID, not what a replica of it would have done.
  it('no rival holds two ledger rows for the same week, on any fillable week', () => {
    const world = createWorld('one-body-one-week')
    const rng = rngFromSeed(world.seed)
    let checkedWeeks = 0
    let checkedMultiEventWeeks = 0
    for (let i = 0; i < 40; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const scheduled = world.season.filter((e) => e.week === world.week)
      if (scheduled.length === 0) continue
      // ⚠ FILLABLE MEANS FILLABLE PER AGE POOL SINCE W2-LADDER, not merely in total. The 12-rung
      // calendar stacks FOUR W events on one structural week (season offset 40: w75+w50+w35+w15,
      // 128 slots), and a W slot can only hold a sixteen-plus rival - so a week can be
      // over-subscribed for the W pool while its raw slot count still fits the cohort. The
      // sibling case below owns every week where ANY pool falls short and pins the residue's
      // arithmetic; this case asserts the zero exactly where zero is achievable.
      if (poolShortfalls(world, scheduled).some((s) => s > 0)) continue
      const slots = scheduled.reduce((s, e) => s + TIERS[e.tier].drawSize, 0)
      checkedWeeks++
      if (scheduled.length > 1) checkedMultiEventWeeks++
      const rows = new Map<string, number>()
      for (const r of world.results) {
        if (r.week !== world.week || r.playerId === KID_ID) continue
        rows.set(r.playerId, (rows.get(r.playerId) ?? 0) + 1)
      }
      for (const [id, n] of rows) expect(n, `${id} played ${n} events in week ${world.week}`).toBe(1)
      // ...and the week is still fully played: every slot of every draw has somebody in it.
      //
      // ⚠ COUNTED ON THE LIVE-ONLY RUNGS SINCE W3-FIELD3 (04.08), because the ledger stopped being a
      // census of the week. A W-track bracket is contested by derived professionals who leave no
      // ledger row (world.ts `runAiTournament`), so Σ drawSize over the WHOLE week now over-counts
      // by exactly the pros' chairs – measured on this fixture, 40 rows against 72 slots. The claim
      // is unweakened where it still means anything: the six junior/domestic rungs are filled to the
      // last chair, and the W rungs are held to a CEILING instead (nothing is written that should
      // not be, and no fp- id is ever written at all). `slots` above is retained for the ceiling.
      const liveSlots = scheduled
        .filter((e) => TIERS[e.tier].track !== 'wta')
        .reduce((s, e) => s + TIERS[e.tier].drawSize, 0)
      const rowsByTrack = (wta: boolean) =>
        world.results.filter(
          (r) =>
            r.week === world.week &&
            r.playerId !== KID_ID &&
            r.tier !== undefined &&
            (TIERS[r.tier].track === 'wta') === wta,
        ).length
      expect(rowsByTrack(false)).toBe(liveSlots)
      expect(rowsByTrack(true)).toBeLessThanOrEqual(slots - liveSlots)
      expect([...rows.values()].reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(slots)
    }
    // the fixture really did exercise the rule, and not just single-event weeks
    expect(checkedWeeks).toBeGreaterThan(0)
    expect(checkedMultiEventWeeks).toBeGreaterThan(0)
  })

  it('holds on the JUNIOR-ONLY calendar too – this was never an adult-tour bug', () => {
    // ⚠ THE FRAMING THIS TEST EXISTS FOR. The defect was found while investigating the adult-tour
    // wave's fatigue regression, which makes it very easy to file as an adult-tour bug. It is not:
    // the junior entrant windows overlap almost completely (j300 [0, 0.25], j60 [0.05, 0.4], j30
    // [0.12, 0.6], national [0.2, 0.7]), so two junior events on one week have ALWAYS drawn twice out
    // of the same slice of the table. Measured on the junior-only season: 6,198 of 27,248 player-weeks
    // in a draw were double-booked before the fix, and 0 after – exactly zero, not "zero on fillable
    // weeks", because no junior week is over-subscribed (its heaviest wants 136 slots of 199).
    //
    // The arm is simulated by CADENCE rather than by a checkout: `buildSeason` skips a tier whose
    // `everyNWeeks` is 0, so zeroing the three W rungs rebuilds the 92-event calendar. Restored in a
    // `finally` – TIERS is module state shared by every test in the file.
    // All TEN W rungs since W3-ACT2 - the arm is "the junior-only calendar", whatever the adult
    // family's size is this release.
    //
    // ⚠ AND ZEROING THE CADENCE IS NO LONGER ENOUGH ON ITS OWN. The four act-3 rungs are placed by
    // NAMED SEASON WEEKS (`TierDef.anchorWeeks`) and carry cadence 0 by construction, so the trick
    // above would have left every Slam, 1000 and 500 on the calendar while believing it had removed
    // them - and the "it really is the six-rung season" assertion at the foot of this test is
    // exactly the guard that caught it. Both placement rules are suspended and both restored.
    const adult: TierId[] = [
      'w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam',
    ]
    const cadences = adult.map((t) => TIERS[t].everyNWeeks)
    const anchors = adult.map((t) => TIERS[t].anchorWeeks)
    for (const t of adult) {
      TIERS[t].everyNWeeks = 0
      TIERS[t].anchorWeeks = undefined
    }
    try {
      const world = createWorld('one-body-one-week-juniors')
      const rng = rngFromSeed(world.seed)
      let weeks = 0
      let events = 0
      for (let i = 0; i < 40; i++) {
        tickWeek(world, rng)
        if (world.pendingTournament) {
          skipTournament(world)
          closeTournament(world)
        }
        const scheduled = world.season.filter((e) => e.week === world.week)
        events += scheduled.length
        if (scheduled.length < 2) continue
        weeks++
        // the junior calendar can always be filled – assert that too, so the "exactly zero" claim
        // above is known to be about the rule and not about a week that happened to be small
        const slots = scheduled.reduce((s, e) => s + TIERS[e.tier].drawSize, 0)
        expect(slots, 'a junior week is never over-subscribed').toBeLessThanOrEqual(world.cohort.length)
        const rows = new Map<string, number>()
        for (const r of world.results) {
          if (r.week !== world.week || r.playerId === KID_ID) continue
          rows.set(r.playerId, (rows.get(r.playerId) ?? 0) + 1)
        }
        for (const [id, n] of rows) expect(n, `${id} played ${n} junior events in week ${world.week}`).toBe(1)
      }
      expect(weeks, 'junior weeks with two or more events').toBeGreaterThan(0)
      // ...and it really is the six-rung season, not the nine-rung one with the W draws empty
      expect(events).toBeGreaterThan(0)
      expect(world.season.every((e) => TIERS[e.tier].track !== 'wta')).toBe(true)
    } finally {
      adult.forEach((t, i) => {
        TIERS[t].everyNWeeks = cadences[i]
        TIERS[t].anchorWeeks = anchors[i]
      })
    }
  })

  it('...and where it CANNOT hold, the calendar is the reason and the excess is exactly the shortfall', () => {
    // ⚠ THE ONE RESIDUE, AND IT IS A SECOND BUG WEARING THIS ONE'S CLOTHES. A week is
    // OVER-SUBSCRIBED when the calendar schedules more draw slots than the world has rivals; then
    // somebody must play twice and no selection rule can help. It is not hypothetical and it is not
    // rare-and-random: SEASON OFFSET 48 — the last playable week before the off-season — collects ALL
    // NINE rungs, in every season of every seed, because `claimWeek` searches outward from each
    // tier's ideal week and every tier whose last event of the year overshoots week 51 gets clamped
    // and then pushed DOWN onto the first free week under the off-season reservation. That is
    // 8 + 16 + 32x7 = 248 slots for 199 rivals.
    //
    // The rule's last resort hands those events back their OWN drawn entrants (season/tournament.ts,
    // preference (c)) rather than smearing the collision across the week, so the damage stays
    // attributable. This test pins the arithmetic: the phantom appearances on such a week are exactly
    // the slots the world has nobody to fill, never more.
    //
    // FOR THE OWNER: the fix is in the scheduler — `buildSeason` should refuse to pile every rung's
    // December event onto one week — and it is deliberately NOT taken here, because moving a claimed
    // week changes `pickSurface`'s block lookup and therefore the surface of real events.
    // ⚠ RE-AIMED BY W2-LADDER, AND STRENGTHENED. Under the 12-rung calendar there are THREE
    // structural collision offsets, not one, and two kinds of shortage, not one:
    //   offset 48  eleven rungs, 312 slots vs 199 rivals - the pre-off-season wall, as before;
    //   offset 47  eight rungs, 232 slots - the wall now starts a week earlier, because three more
    //              tiers' overshooting final events push down against the same reservation;
    //   offset 40  FOUR W rungs stack (w75+w50+w35+w15, 128 slots) - not over-subscribed in total,
    //              over-subscribed for the SIXTEEN-PLUS POOL a W slot must draw from (~100-126 of
    //              199 live rivals, varying with the cohort's dealt ages - so this one appears on
    //              some seasons and not others, unlike the two walls).
    // The pinned arithmetic is upgraded to cover all three at once: the phantom count equals the
    // MAXIMUM pool deficiency (poolShortfalls above) - Hall's bound for our nested classes -
    // which says the engine hands back the fewest possible entrants and wastes nobody. Measured
    // across 3 seeds x 104 weeks before pinning: every colliding week satisfies it exactly.
    const world = createWorld('one-body-one-week')
    const rng = rngFromSeed(world.seed)
    let over = 0
    const collisionOffsets = new Set<number>()
    for (let i = 0; i < 104; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const scheduled = world.season.filter((e) => e.week === world.week)
      const shortfalls = poolShortfalls(world, scheduled)
      if (!shortfalls.some((s) => s > 0)) continue
      over++
      // ⚠ THE THREE STRUCTURAL OFFSETS ARE GONE, AND THAT IS W2-WINDOW SHIPPING THE FIX THIS
      // COMMENT ASKED FOR ("FOR THE OWNER: the fix is in the scheduler – `buildSeason` should refuse
      // to pile every rung's December event onto one week"). Offsets 47/48 were the pre-off-season
      // wall: every tier's overflowing final event clamped onto the same two weeks, in every season
      // of every seed, because the count was measured over 52 weeks and only 49 are playable.
      // Placement now counts in PLAYABLE SLOTS and takes a seeded jitter, so a collision week has no
      // fixed address any more – it is wherever this world's draw happened to stack four W rungs.
      // The offset list is therefore RETIRED rather than extended (a list of seeded addresses is not
      // a property), and the arithmetic below – phantom appearances = the maximum pool deficiency,
      // Hall's bound for our nested classes – is what this test was always really pinning. Two
      // NEW claims replace the list and are strictly stronger than it was: the collision must be a
      // GENUINE pool shortage (asserted right below), and the wall must not come back (asserted
      // after the loop).
      collisionOffsets.add(world.week % 52)
      expect(Math.max(...shortfalls), 'a collision week is a real pool shortage').toBeGreaterThan(0)
      const rows = new Map<string, number>()
      for (const r of world.results) {
        if (r.week !== world.week || r.playerId === KID_ID) continue
        rows.set(r.playerId, (rows.get(r.playerId) ?? 0) + 1)
      }
      const phantom = [...rows.values()].reduce((a, n) => a + n - 1, 0)
      expect(phantom, 'phantom appearances = the max pool deficiency').toBe(Math.max(...shortfalls))
    }
    // ⚠⚠ AND AS OF W3-FIELD3 (04.08) THERE ARE NO SUCH WEEKS LEFT – `over` is 0 over 104 weeks, where
    // it used to find the pre-off-season wall in every season of every seed. That is this branch's
    // side-effect rather than its aim, and the arithmetic is one line: the shortage was always a W
    // shortage (a W chair may only hold a sixteen-plus, and the cohort has ~100-126 of them), and a
    // W chair may now hold any of ~364 professionals as well. `poolShortfalls` above is re-aimed to
    // count that supply, so the weeks this case used to catch are simply fillable now.
    //
    // THE CASE IS KEPT, AND KEPT INVERTED, for exactly the reason C2's knee tripwire was: the
    // arithmetic inside the loop is the real claim (the engine hands back the FEWEST possible
    // entrants and wastes nobody), and it must still hold the day a cadence change or a smaller
    // field brings a shortage back. So the loop is unchanged and the count is pinned at the measured
    // zero – if a future wave re-creates an over-subscribed week, this line fails and somebody comes
    // back to read the assertions above rather than discovering them by a mystery in the ledger.
    expect(over, 'over-subscribed weeks: the W pool is served by the professional field now').toBe(0)
    // THE WALL MUST NOT COME BACK. The last two playable weeks of a season used to carry EVERY
    // rung's final event (312 draw slots for 199 rivals on offset 48 alone). A collision landing
    // there once is ordinary; the season's whole tail collecting them is the bug.
    expect([...collisionOffsets].filter((w) => w >= 47).length, `collision offsets: ${[...collisionOffsets].join(',')}`)
      .toBeLessThan(2)
  })
})
