// THE 52-WEEK BURN CALIBRATION – the batch, the walk that produces it and the owner's frozen bands.
//
// ⚠ WHY THIS EXISTS. `tests/economy.test.ts` walked into birpc's unraisable 60 s RPC window on CI
// (wave 3, PR #135): the `unit-heavy` job died four times on the all-green-non-zero shape – every
// test green, exit 1, a blank annotation and a ~582 s step – and this file was one of the two
// residents that had grown past the wall. It was already alone in its process from
// `scripts/heavy-tests.mjs`, so the FILE was the unit and the file had to be cut, exactly as
// radar's was on 11.08, fatigue-bench-policy's on 27.08 and coach-travel-edge's on 31.08. It is now
// three, and the two below this line share everything in this module:
//
//   economy.test.ts                        the sponsor, the gear cadence, the coaching bill and the
//                                          need gate – the behaviour describes (KEEPS the path)
//   economy-calibration.test.ts            the three band cells + the unsponsored precondition
//   economy-calibration-ordering.test.ts   the ordering cell, which re-walks all three batches
//
// ⚠ THE SEAM IS THE BATCH, AND IT IS THE ONLY SEAM HERE THAT MOVES THE NUMBER. MEASURED SOLO before
// anything was touched, one vitest process, `--project unit --reporter=json`, 37 tests:
//
//     ordering (3 batches)                 7.93 s      the four other describes, 32 tests   6.57 s
//     working  (2 batches)                 5.37 s        (the largest single one: 2.04 s)
//     middle   (1 batch)                   2.71 s
//     wealthy  (1 batch)                   2.68 s
//     the unsponsored precondition         0.22 s
//
// **74 % of the file is FIVE TESTS**, and the cost is linear in batches at ~2.6 s each – a batch
// being 16 seeds × 52 weeks of real `tickWeek`. So a topical cut ("calibration versus the sponsor")
// leaves a file at three quarters of what already stalled, and the honest seam runs through the
// SEVEN BATCHES: the calibration describe leaves `economy.test.ts` entirely, and `ordering` – the
// heaviest arm, and the one the 05.09 review already flagged as the file's slowest test at 12.7 s
// quiet / 21.4 s contended – is separated from the three cells it re-walks.
//
// ⚠ IT IS A SPLIT AND NOT A DIET. The same 16 seeds, the same 52 weeks, the same seven batches and
// all 37 test names crossed over unchanged, and both calibration files keep the ORIGINAL describe
// name deliberately, so every FULL test name is still the name it was and nothing outside can have
// been pointed at nothing. `scripts/heavy-tests.mjs`'s own rule governs the shape of the cut:
// trimming seeds until a file fits buys speed with coverage, and that trade is made deliberately
// and measured, never as a side effect of making a wall.
//
// ⚠⚠ AND THE APPARATUS DID NOT SPLIT WITH THE TESTS. `seasonBurnDollars` is the one piece here that
// must never have two truths – it subtracts the physio tail and adds the interest back precisely so
// the cells keep measuring the fixed base cashflow the owner froze his bands against, and a second
// copy that drifted by one term would move a band without moving a number anybody reads. The walk,
// the three exclusion helpers and the frozen `BANDS` / `SEED_SLACK` therefore live HERE, once, and
// the two test files import them. A hand-maintained second copy is exactly what
// `scripts/heavy-tests.mjs` exists to make impossible.
//
// ⚠ FOR THE OWNER, and please do not "fix" it by moving these numbers: nothing about the
// calibration changed. The bands, the seeds, the rungs and the reasoning below are the ones that
// were in `tests/economy.test.ts`, moved verbatim.

import {
  createWorld,
  tickWeek,
  financeWindow,
  STARTING_FUNDS_CENTS,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier, type FamilyBackground } from '../src/shared/protocol'

// Fixed calibration batch. 16 seeds so the mean is stable against the working-class sponsor's
// high variance (a single working season can swing several $k on sponsor luck – see below), while
// staying cheap.
export const SEEDS = Array.from({ length: 16 }, (_, i) => `cal-${i + 1}`)

/** The season's physio/medical spend in cents (a positive number). Season-Life slice C layered
 *  injuries + physio ON TOP of the base economy; the owner's net-burn bands below were frozen
 *  BEFORE that layer, so the calibration excludes the 'physio' bucket (a stochastic medical tail
 *  – a single severe onset swings $3-6k) and keeps measuring what it always measured: the fixed
 *  base cashflow. The medical layer's own calibration lives in tests/injuries.test.ts + the bench. */
function physioSpendCents(world: WorldState): number {
  return -(financeWindow(world.financeWeeks, 0).byCategory.physio ?? 0)
}

/** The season's savings-interest income in cents (round-9 R9-1). Like the physio tail above,
 *  the interest layer landed AFTER the owner froze the burn bands – and it scales with the
 *  STARTING reserve (wealthy's 120k earns ~$3.7k/yr, dwarfing middle's), so leaving it in
 *  would warp the band comparison. The calibration adds it back and keeps measuring the fixed
 *  base cashflow it always measured. */
function interestEarnedCents(world: WorldState): number {
  return financeWindow(world.financeWeeks, 0).byCategory.interest ?? 0
}

/** The season's local-sponsor cameo income in cents (working-only; 0 for middle/wealthy). See the
 *  working-burn test below for why the calibration measures the burn BEFORE this gift. */
function sponsorIncomeCents(world: WorldState): number {
  return financeWindow(world.financeWeeks, 0).byCategory.sponsor ?? 0
}

/** Net funds lost over 52 weeks with NO tournaments entered (fixed costs only). A fresh career
 *  earns no ranking points on EITHER ladder, so the kid sits at the bottom of both tables all year →
 *  national rank > 30 → the local sponsor's annual review pays her nothing. These are the owner's
 *  UNSPONSORED-kid bands. (Read "rank > 30" as the NATIONAL rank since 30.07: the sponsorship is a
 *  flat annual grant gated on the domestic table, not a share of a gear bill gated on the ITF one.)
 *
 *  ⚠ TAKES A COACH RUNG NOW – see CALIBRATION_TIER below for why it has to. */
export function seasonBurnDollars(
  seed: string,
  background: FamilyBackground,
  opts: { excludeSponsor?: boolean } = {},
): number {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background, coachTier: CALIBRATION_TIER[background] })
  const rng = rngFromSeed(world.seed)
  const start = STARTING_FUNDS_CENTS[background]
  for (let i = 0; i < 52; i++) tickWeek(world, rng)
  const sponsor = opts.excludeSponsor ? sponsorIncomeCents(world) : 0
  return (start - world.fundsCents - physioSpendCents(world) + interestEarnedCents(world) + sponsor) / 100
}

export function batchBurns(background: FamilyBackground, opts: { excludeSponsor?: boolean } = {}): number[] {
  return SEEDS.map((s) => seasonBurnDollars(s, background, opts))
}

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

// ⚠ RE-AIMED BY THE COACH LADDER – THE MECHANISM THAT MAKES THE THREE CELLS DIFFER MOVED, so this
// calibration had to move with it or stop measuring anything about class.
//
// Until now all three cells ran on the SAME coach setting (DEFAULT_PROFILE's `hired`) and the
// WEALTH CORRIDOR did the tiering: one $250-700/wk band × 0.75 / 1.00 / 1.25. The corridor has left
// coaching (docs/specs/coach-tiers.md §2), so holding the coach constant would now charge all three
// families the identical bill and the cells would differ only by income and gear. The rung is what
// tiers them now, so each family is calibrated on the rung it actually buys – the same three rungs
// tools/econ-bench.ts puts them on.
export const CALIBRATION_TIER: Record<FamilyBackground, CoachTier> = {
  working: 'budget',
  middle: 'middle',
  wealthy: 'elite',
}

// ⚠ RE-BASED AGAIN (Round 2), and this time the WEALTHY cell flips back to a burn. Two knobs moved
// under it: hours went 4 -> 5 at the balanced plan (the owner's own 4/5/6), which raises every
// weekly bill by a quarter, and the wealth corridor went back ON coaching, which prices each family
// in its own market. Together they put an Elite coach in a premium academy at $750/wk against a
// wealthy family's $750/wk of parent income - so "premium everything must hurt" is back in the idle
// year for the family it was written about, rather than only in the playing season.
//
// The Round-1 note still stands for the other two, and it is worth keeping because it explains what
// the ORIGINAL bands were really measuring: they charged every family a coach the spec prices as
// ELITE (the old `hired` band's ~$475/wk midpoint), so a working family on $245/wk of parent income
// was billed $356/wk for coaching - 145% of its own income - in a year with no tournaments in it.
// That was the wall, measured, in a test that had been reporting it as a healthy $6.8k burn.
//
// Measured (same 16 seeds, sponsor-excluded for working), with the coaching line that produced it:
//   working · budget  $112/wk  burn mean -$5,667   spread -$6,670 .. -$4,798
//   middle  · middle  $250/wk  burn mean -$7,334   spread -$9,441 .. -$4,754
//   wealthy · elite   $750/wk  burn mean +$6,280   spread -$1,126 .. +$13,527
// The mean bands below are those windows with headroom; the per-seed tolerances are wider because
// the corridor roll now breathes on the coaching line every week, which it did not in Round 1.
//
// FOR THE OWNER, and please do not "fix" it by moving these numbers: an idle year is still a SAVING
// for the two families below the top, so the round-7 item-1d burn bands no longer discriminate
// between all three and are due a design decision rather than another re-pin. The bench is where
// the real question lives now - tools/econ-bench.ts walks each family up its own corridor and
// reports which rungs it survives.
//
// ⚠⚠⚠ ROUND 41 P1 MOVED TWO OF THESE THREE, AND THE WEALTHY CELL CHANGED SIGN. **THIS IS A FINDING
// FOR THE OWNER AND NOT A RE-TUNE**: the band below CHARACTERISES what his own two rulings of 12.09
// produce, it was measured rather than chosen, and the design question it raises is stated here
// rather than answered. MEASURED on the 16-seed batch, arms built in this worktree and each one
// verified to contain its change before it was read (positive = a burn, negative = a saving):
//
//     arm                                     working      middle     wealthy
//     CONTROL (`b07f01ba`, src reverted)     -5,666.67   -7,192.06   **+6,280.22**
//     P1 part A only (gear uniform)          -5,666.67   -8,039.47   **+2,971.11**
//     P1 full (A + the corridor fade)        -5,666.67   -8,039.47   **-4,916.82**
//
//   * WORKING IS BYTE-IDENTICAL ACROSS ALL THREE ARMS. The uniform `composite` band IS the old
//     working band cent for cent, and a budget coach keeps its corridor. Its band is untouched.
//   * MIDDLE moves -$847 (gear only; its coach rung keeps the corridor) and STAYS INSIDE its band.
//     Untouched.
//   * WEALTHY swings **$11,197**, of which the gear half is -$3,309 and **the corridor fade is
//     -$7,888 – 70% of it**. Its idle year is no longer a burn.
//
// ⚠⚠ WHAT THAT COSTS, SAID PLAINLY: the cell's own sentence one file over – «premium everything
// hurts again», the round-7 item-1d principle – IS NO LONGER TRUE, and the ordering cell's «the only
// one that BURNS» has no member. **The ORDERING itself survives untouched** (middle saves most,
// then working, then wealthy: -8,039 < -5,667 < -4,917), so the shape of the ladder is intact and
// only the wealthy cell's SIGN flipped. Both halves of the flip are the mechanical consequence of
// rulings he gave in his own words – «на рынке цены для всех сословий одинаковые» and «в про карьере
// с большими чеками цены для всех должны быть равны» – so neither is reversible here.
//
// **THE QUESTION THAT IS HIS, and the two levers, neither touched:** should a wealthy family with an
// elite coach still run a deficit in an idle year? If yes, the honest lever is the WEALTHY INCOME
// (`ECONOMY.parentIncomeCents.wealthy`, $750/wk – the elite coach used to cost exactly that at the
// wealthy corridor and now costs $800 flat, so the cell is close) or the ELITE RATE BAND. Re-pinning
// this number a third time is not a lever, which is what the note above already says.
export const BANDS: Record<FamilyBackground, [number, number]> = {
  working: [-6_500, -4_800],
  middle: [-8_500, -6_000],
  // ⚠ MEASURED (-4,916.82), NOT CHOSEN – see the block above. Same ±1,750 half-width the working
  // band carries, so it is a characterisation with the same tightness, not a widened net.
  wealthy: [-6_700, -3_200],
}

/** Per-seed tolerance around each band. The corridor roll moves the coaching line every week, so a
 *  single season lands further from the batch mean than it did with a corridor-free bill. */
export const SEED_SLACK: Record<FamilyBackground, number> = { working: 2_500, middle: 3_500, wealthy: 8_000 }
