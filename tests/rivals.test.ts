import { describe, it, expect } from 'vitest'
import {
  RIVAL_STYLE,
  applySurfaceStyle,
  matchesForFinish,
  reconstructRun,
  rivalCondition,
  rivalConditions,
  rivalMatchPlayer,
  styleOf,
} from '../src/engine/season/rival'
import { conditionMatchFactor, matchDrain, runFatigueExtra, tournamentRunStrain } from '../src/engine/condition'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { generateCohort } from '../src/engine/season/cohort'
import { ECONOMY } from '../src/engine/economy'
import type { SeasonResult } from '../src/engine/season/ranking'
import type { TierId } from '../src/engine/season/types'
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
const LADDER5 = Array.from({ length: 5 }, (_, i) => runFatigueExtra(i)).reduce((s, x) => s + x, 0)

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
      expect(def.points.length).toBe(rounds + 1)
      expect(def.points.slice(0, -1).every((p) => p > 0)).toBe(true)
      expect(def.points[def.points.length - 1]).toBe(0)

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
    expect(runFatigueExtra(0)).toBe(0)
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
    const run = reconstructRun({ playerId: 'ai-x', week: 2, points: 30 })
    expect(run).toMatchObject({ tier: 'local', matches: 3, strain: 8 })
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

  it('is bounded work: only the last ECONOMY.condition.rivalFatigueWindowWeeks weeks are scanned', () => {
    const window = R.rivalFatigueWindowWeeks
    expect(window).toBeGreaterThan(0)
    const ancient = [row('j300', 0, 100 - window - 1)] // one week outside the window
    expect(rivalCondition(ancient, 'ai-x', 100)).toBe(R.max)
    const inside = [row('j300', 0, 100 - window + 1)]
    expect(rivalCondition(inside, 'ai-x', 100)).toBeLessThan(R.max)
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

/** A bare MatchPlayer with the given attributes – style reads only serve/ret/stamina. */
function player(serve: number, ret: number, stamina: number, composure = 50): MatchPlayer {
  return { id: 'p', name: 'P', serve, ret, composure, stamina }
}

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
    const styled = applySurfaceStyle(rival, styleOf(rival), 'clay')
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
      const styled = applySurfaceStyle(rival, styleOf(rival), surface)
      expect(fresh.serve).toBeCloseTo(styled.serve, 12)
      expect(fresh.ret).toBeCloseTo(styled.ret, 12)
    }
    // ...and the default argument means "fresh", so a caller with no derived condition is safe.
    expect(rivalMatchPlayer(rival, 'hard')).toEqual(rivalMatchPlayer(rival, 'hard', ECONOMY.condition.max))
  })

  it('a tired rival is strictly weaker on every attribute, and never below the floor', () => {
    const fresh = rivalMatchPlayer(rival, 'hard', ECONOMY.condition.max)
    const spent = rivalMatchPlayer(rival, 'hard', ECONOMY.condition.min)
    for (const key of ['serve', 'ret', 'composure', 'stamina'] as const) {
      expect(spent[key]).toBeLessThan(fresh[key])
      expect(spent[key]).toBeCloseTo(fresh[key] * ECONOMY.condition.matchStrengthFloor, 12)
    }
    expect(spent.id).toBe(rival.id)
    expect(spent.name).toBe(rival.name)
  })

  it('drops the AiPlayer-only fields: a MatchPlayer goes into the bracket, not a cohort row', () => {
    const built = rivalMatchPlayer(rival, 'hard', 80)
    expect(Object.keys(built).sort()).toEqual(['composure', 'id', 'name', 'ret', 'serve', 'stamina'])
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

describe('C1 — derive, never store: no schema bump and no new cohort field', () => {
  it('the save schema is untouched and a cohort row still carries exactly its generated fields', () => {
    const world = runWorld('rival-wiring', 8)
    expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    for (const p of world.cohort.slice(0, 5)) {
      expect(Object.keys(p).sort()).toEqual(['composure', 'growth', 'id', 'name', 'nation', 'ret', 'serve', 'stamina'])
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

  it('the ledger feeds the derivation: some of the field is under the strength knee', () => {
    const conds = world.cohort.map((p) => rivalConditions(world.results, world.week).get(p.id) ?? ECONOMY.condition.max)
    expect(conds.some((c) => c < ECONOMY.condition.matchStrengthKnee)).toBe(true)
    expect(conds.some((c) => c === ECONOMY.condition.max)).toBe(true) // ...and some are fresh
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
    const heavy = [...flooredWeeks.values()].filter((n) => n >= weeks / 2).length
    expect(heavy, 'rivals floored for half the window').toBeLessThanOrEqual(10)
    expect(flooredWeeks.size / world.cohort.length, 'share ever floored').toBeLessThan(0.25)
    // 3. the standings are coloured, not inverted – the median rival is fit every single week
    for (const m of medians) expect(m).toBeGreaterThan(ECONOMY.condition.matchStrengthKnee)
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
      const fatigue = rivalConditions(world.results, world.week).get(id) ?? ECONOMY.condition.max
      const expected = rivalMatchPlayer(row, event.surface, fatigue)
      expect(snapshot.id).toBe(expected.id)
      expect(snapshot.name).toBe(expected.name)
      // The snapshot is what the ONE composition helper builds – no second code path. It is taken
      // PRE-drift (step 2 of the tick; driftCohort is step 3), which is deliberate: it is what
      // keeps a revealed match record replayable however the cohort moves afterwards. So the
      // cohort row we read back here has had exactly one drift nudge applied (<= 0.075 per
      // attribute), and the comparison is a ratio rather than an equality.
      for (const key of ['serve', 'ret', 'composure', 'stamina'] as const) {
        expect(snapshot[key] / expected[key], `${id}.${key}`).toBeCloseTo(1, 2)
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
