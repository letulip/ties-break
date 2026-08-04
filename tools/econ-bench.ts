/**
 * Economy bench (Part C of docs/specs/econ-breakdown-bench.md, extended to whole-horizon in
 * docs/specs/econ-bench-horizon.md) – a headless "how much does the CAREER eat, and who survives it"
 * tool.
 *
 * MEASUREMENT ONLY. This file imports the engine and reads the finance aggregate; it changes NO
 * engine/economy numbers. It exists so we stop hand-clicking difficulty branches and can diagnose,
 * by category, WHY a tier goes bankrupt and how far each family's bankroll runs.
 *
 * Presets = the real difficulty tiers 8k / 25k / 120k = family backgrounds working / middle / wealthy
 * (the background alone sets STARTING_FUNDS + parent income + expense/travel factors). coachSetup and
 * plan = balanced (75/25) are held per-preset so ONLY the intended lever varies.
 *
 * WHOLE HORIZON (Wave 1): instead of one 52-week season, run the SAME world forward to two career
 * milestones and report, per profile, the cumulative chance of surviving (not going bankrupt) and a
 * reach-rate proxy:
 *   14→16 = 104 weeks (2 seasons, the junior sink – no rung she can enter pays anything)
 *   14→18 = 208 weeks (4 seasons, "pro attempt" proxy)
 *   14→20 = 312 weeks (6 seasons, THE ADULT TOUR – W15 opens at 16, W100 at 17, so this is the
 *                      first horizon in which the prize-money question can be asked at all)
 * State carries across seasons because we keep ONE createWorld + ONE rngFromSeed for the whole horizon
 * and just tick further – fundsCents, kidRank, the rolling results ledger, bestFinishByTier and
 * lastSeasonSummary all live on the world.
 *
 * ⚠ THE STANDING CAVEAT IS GONE (task #17, A2). It read "prize money is NOT modeled yet – tournaments
 * award POINTS only", and it had been the largest asterisk on every number this tool prints since it
 * was written. The adult rungs now pay: `finalizeTournament` credits a 'prize' income category off
 * the finishing tier's own payout table (see TierDef.prizeCents). The survival numbers are therefore
 * no longer a pure-sink measurement past age 16, the reach targets are no longer standing in for
 * earnings, and the A4 arm below asks the question the caveat used to make unaskable: WHEN does the
 * tennis start paying for itself?
 *
 * What is still true and still worth saying: the junior tour pays nothing, ever, so for the first two
 * seasons of every career this is exactly the sink it always was. That is the design, not a gap.
 *
 * Finance read (the correctness crux): the engine prunes financeWeeks to a 60-week trailing window,
 * so financeWindow(fw, 0) at horizon end silently drops every season but the last ~60 weeks. Instead
 * we ACCUMULATE per season: at each season wrap (world.week % 52 === 49) we fold that year's block
 * with financeWindow(fw, yearStartWeek) – a full year is always still retained at its own wrap week
 * since 52 < 60 – and sum the per-year folds for the cumulative income/expense/net.
 *
 * Monte-Carlo: one career is noisy, so we average 30 seeds per preset (seed varied by index, never
 * Math.random – the engine forbids wall-clock/Math.random and same seed+preset must reproduce
 * byte-identically).
 *
 * Run:  npm run bench:econ            (console tables, both horizons)
 *       npm run bench:econ -- --csv /path/to/rows.csv   (also dump per-seed rows)
 */
import { writeFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  tierOpenFor,
  kidPoints,
  skipTournament,
  closeTournament,
  financeWindow,
  availabilityStatus,
  travelCostFor,
  STARTING_FUNDS_CENTS,
  type WorldState,
} from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import type { CoachTier, FamilyBackground, PlayerProfile, WorldEventCategory } from '../src/shared/protocol'
import { COACH_TIER_LABEL, coachWeeklyBandCents } from '../src/engine/coach'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

export { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

/** Careers start at age 14; ageYears = START_AGE_YEARS + Math.floor(week / 52). */
export const START_AGE_YEARS = 14
export const SEEDS_PER_PRESET = 30
/** How many weeks before an event's entry deadline the policy commits to it. A near-deadline window
 *  (not the full rolling horizon) keeps the entry count realistic – see stepCareerWeek. */
export const ENTRY_LOOKAHEAD = 3

/** The tick at which a season wraps (its first off-season week): 49, 101, 153, 205. maybeFireSeasonWrapUp
 *  fires here and overwrites world.lastSeasonSummary, and the full just-finished year is still retained
 *  in the 60-week finance ledger, so this is where we fold each season's finance. */
export const SEASON_WRAP_OFFSET = WEEKS_PER_YEAR - OFF_SEASON_WEEKS // 49

export interface Horizon {
  /** code label; the arrow is fine in a code label, prose stays on the short dash "–". */
  label: string
  /** total weeks ticked = (targetAge - START_AGE_YEARS) * 52. */
  weeks: number
  /** age reached at the end of the horizon. */
  targetAge: number
  /** one-line prose describing the milestone this horizon proxies. */
  blurb: string
}

// Three horizons, all iterated in main. weeks = (targetAge - 14) * 52.
//
// ⚠ THE THIRD ONE EXISTS BECAUSE THE ADULT TOUR IS UNREACHABLE INSIDE THE OTHER TWO (task #17, A4).
// W15 has `minAgeYears: 16`, which is week 104 – the exact last week of the 14→16 horizon – so the
// junior horizon can never see a professional entry, and 14→18 leaves at most two seasons of it. The
// A4 question ("in what week does prize money first exceed the week's costs?") needs the adult rungs
// to have been played for long enough to answer honestly, and a horizon that reports "never" because
// it stopped too early would be the same non-measurement REACH_TARGET_MONEY was before it was
// re-based. Six seasons takes her to 20 – past the fork at 19 that §4 of
// docs/specs/adult-tour-and-endings.md will eventually make a decision rather than a birthday.
export const HORIZONS: Horizon[] = [
  { label: '14→16', weeks: 104, targetAge: 16, blurb: 'the junior sink – nothing she can enter pays a cent' },
  { label: '14→18', weeks: 208, targetAge: 18, blurb: 'pro attempt proxy (top-50 once ranked, or 60 points)' },
  { label: '14→20', weeks: 312, targetAge: 20, blurb: 'the adult tour – can the tennis start paying for itself?' },
]

// Reach targets. ⚠ THEY PREDATE PRIZE MONEY AND STILL DO NOT READ IT (task #17). They were written
// as proxies precisely BECAUSE the engine modelled no earnings; earnings now exist, so a literal
// "the week she first covers her own costs" is available and is measured by the A4 block instead.
// They stay points/rank-based on purpose - the money question has its own measure now, and these
// answer the different question of whether the TENNIS arrived.
/** 14→16, the DOMESTIC arm.
 *
 *  ⚠ RE-BASED 150 → 320 (chore/reach-and-art), and it is the tuning pass five separate notes in
 *  tests/econ-reach.test.ts said was owed. `npx vite-node tools/reach-sweep.ts` is the sweep behind
 *  the number and re-running it is how the next re-base gets decided.
 *
 *  WHAT 150 WAS: National's `enterPointBand` floor - "she may ENTER the top domestic rung". That was
 *  a real climb when the calendar was six rungs long. It is not one now: the ladder has been
 *  re-spaced twice (9 → 12 → 16 rungs, each re-dividing `tierPhase` and re-dealing the whole
 *  season), and measured at this revision every one of 270 careers clears 150 inside 104 weeks, most
 *  of them by about week 20. A proxy 270 of 270 careers meet is a formality, not a measurement.
 *
 *  WHAT 320 IS, on the same axis, one step along: a National title PLUS a National final. National
 *  pays [200, 120, …], so 320 is exactly `points[0] + points[1]` inside the windowed best-6 - or,
 *  equivalently, four Regional titles. The proxy therefore moves from "she is ALLOWED at the top of
 *  the domestic ladder" to "she is WINNING at the top of it", which is what "a career has visibly
 *  arrived" has to mean once eligibility is free. It also sits above J30's 250 floor, so a career
 *  that clears it has gone through the international door and is still winning at home.
 *
 *  MEASURED (30 careers x 9 presets, grinder policy, 14→16): 11-14 of 30 clear it, in EVERY preset -
 *  both branches of the tracker fire everywhere, with a margin of at least eleven careers on each
 *  side. And it is deliberately NOT a knife edge: the count is flat for every threshold in
 *  [319, 323] on the tightest preset and [314, 361] on the loosest, so it sits on a plateau rather
 *  than between two adjacent careers. The four flips this tripwire took between 2026-07-31 and
 *  2026-08-02 were all ONE career crossing ONE line; a plateau is what stops the fifth. */
export const REACH_TARGET_MONEY = 320
/** 14→18 "pro" proxy: a top-50 rank ONCE she is actually ranked (has a counting result) OR a points
 *  threshold. The `hasResults` guard on the rank arm is REQUIRED – see reachedTarget. */
export const REACH_PRO_RANK = 50
/** ⚠ RE-BASED for the two-ladder slice. This used to be 300 points on the old MIXED scale, where a
 *  J30 title paid 400 - so it meant "about one good international week". On the real ITF scale 300
 *  points IS a J300 title, which is a career-defining result and nobody's "pro attempt proxy". The
 *  equivalent milestone is a real body of international results: 60 ITF points is a J60 title, or a
 *  J30 title plus a J30 final, or six J30 quarter-finals. */
export const REACH_PRO_POINTS = 60

export interface Preset {
  /** table label, e.g. "25k  · middle · hired coach" */
  label: string
  background: FamilyBackground
  /** the coach RUNG drives the biggest expense line, so it's a preset dimension, not a constant.
   *  middle is run on two rungs to expose the lever's swing. */
  coachTier: CoachTier
}

// 8k / 25k / 120k = working / middle / wealthy (the tier IS the family background). The coach RUNG
// is the one each family realistically buys off the ladder: working and middle can both self-coach,
// middle's paid option is the STANDARD private coach, and wealthy buys the top of the market.
//
// ⚠ RE-AIMED TWICE. Round 1 took the old four cells to six; Round 2 takes them to NINE, because the
// question the owner is buying changed. It is no longer "does the middle family survive a coach" -
// it is «each family should have a real choice inside its own corridor», so the bench has to walk
// each family UP its own ladder until it breaks, and report where that is.
//
// Every original cell still has a successor, so no before/after comparison is lost:
//   old `coachSetup: 'parent'` -> `self`   (rows 1 and 4)
//   old `coachSetup: 'hired'`  -> `middle` (row 6, the 0/120 cell) and `elite` (row 9)
//
// WHY `hired` SPLIT IN TWO: it was a single $250-700/wk band whose midpoint (~$475) the spec prices
// as an ELITE coach, so the middle family was never choosing a coach - it was being handed the most
// expensive one in the game and going bankrupt 120 times out of 120 for it.
//
// AND WHY THE PRICES DIFFER BY BACKGROUND AGAIN (Round 2): the wealth corridor is back on coaching,
// because it is not a discount for being poor - it is the MARKET she trains in. So `25k middle` and
// `8k working` on the SAME rung are two different bills, and each family's ladder has to be walked
// in its own corridor. That is the whole reason rows 1-3, 4-7 and 8-9 exist as three ladders rather
// than one.
export const PRESETS: Preset[] = [
  { label: '8k   · working · self-coached', background: 'working', coachTier: 'self' },
  { label: '8k   · working · budget coach', background: 'working', coachTier: 'budget' },
  { label: '8k   · working · middle coach', background: 'working', coachTier: 'middle' },
  { label: '25k  · middle  · self-coached', background: 'middle', coachTier: 'self' },
  { label: '25k  · middle  · budget coach', background: 'middle', coachTier: 'budget' },
  { label: '25k  · middle  · middle coach', background: 'middle', coachTier: 'middle' },
  { label: '25k  · middle  · high coach', background: 'middle', coachTier: 'high' },
  { label: '120k · wealthy · high coach', background: 'wealthy', coachTier: 'high' },
  { label: '120k · wealthy · elite coach', background: 'wealthy', coachTier: 'elite' },
]

/** The per-category buckets we surface, in display order (expenses first, then income).
 *  'interest' (round-9 R9-1, weekly savings interest) is an INCOME category.
 *  'vacation' / 'practice' (season planner, v13) are expense buckets: the econ bench never books
 *  either (it has no planner policy – that is the fatigue bench's axis), so they read $0 here and
 *  exist only to keep the category fold exhaustive. */
export const EXPENSE_CATS: WorldEventCategory[] = ['coaching', 'travel', 'entry', 'gear', 'stringing', 'physio', 'vacation', 'practice', 'other']
/** ⚠ 'prize' LEADS THE INCOME LIST because it is the only one of the four the TENNIS produces – the
 *  other three are a parent, a shop and a bank. It reads $0 for every career under 16 and for every
 *  career that never opens a W15, which is information rather than an empty column. */
export const INCOME_CATS: WorldEventCategory[] = ['prize', 'income', 'sponsor', 'academy', 'interest']

/** One completed season, captured at its wrap week off world.lastSeasonSummary + that year's finance fold. */
export interface PerSeason {
  /** calendar-year label of the season that just ended (weekYear of its first week). */
  seasonYear: number
  /** kid's dense rank at wrap-up. */
  endRank: number
  /** ranking points earned in-season. */
  points: number
  wins: number
  losses: number
  /** this season's net cents (income - expense), from financeWindow(fw, yearStart) at the wrap. */
  netCents: number
}

export interface SeedResult {
  seed: string
  /** per-category magnitudes in cents, CUMULATIVE across the horizon (expenses positive, income positive). */
  cats: Record<WorldEventCategory, number>
  /** sum of every expense category over the horizon (a positive number) */
  grossExpenseCents: number
  /** sum of every income category over the horizon (parent contribution + sponsor) */
  totalIncomeCents: number
  /** totalIncome - grossExpense, cumulative over the captured seasons */
  netCents: number
  endFundsCents: number
  /** first week fundsCents < 0, or null if the family never went into the red over the FULL horizon */
  weeksToBankrupt: number | null
  /** true ⇔ the family survived the whole horizon (weeksToBankrupt === null) */
  survived: boolean
  /** lowest fundsCents reached across the run (a "peak deficit" when negative) */
  peakDeficitCents: number
  /** first week the horizon's reach target was met, or null if it never was */
  reachedWeek: number | null
  /** kid's dense rank at horizon end */
  endRank: number
  /** kid's earned ranking points at horizon end */
  endPoints: number
  /** one entry per completed season (2 for 14→16, 4 for 14→18) */
  perSeason: PerSeason[]
  /** tournaments entered over the horizon: total plus the ranking-gated per-tier split.
   *  Every tier in the catalogue is live since ladder-up, so total === Σ byTier. */
  entries: { total: number; byTier: Record<TierId, number> }
  /** A4 (task #17): the first week a `prize` line appeared in the ledger at all – i.e. the week she
   *  first played a professional main draw and got paid for it, however little. Null if never. */
  firstPrizeWeek: number | null
  /** A4, AND THE NUMBER THE SLICE IS FOR: the first week in which that week's PRIZE MONEY exceeded
   *  that week's total outgoings. Null if it never happened – which is a finding, not a failure.
   *
   *  ⚠ WHAT "THE WEEK'S COSTS" MEANS HERE, precisely, because the answer is only as good as the
   *  reading. It is the magnitude of every negative category in that week's `FinanceWeek` row:
   *  travel, coaching, gear, stringing, physio, the lot. It does NOT include the entry fee, and that
   *  is not a choice – `enterEvent` charges the fee the week she COMMITS, up to ENTRY_LOOKAHEAD
   *  weeks before the draw, so it sits in a different row of the ledger. The reading is therefore
   *  slightly generous, by one entry fee ($300-600 on the adult rungs) against a cheque that has to
   *  beat $1,000-3,800 of travel plus the week's coaching. Worth knowing; not worth distorting the
   *  measure to chase, since a fee three weeks back is genuinely not what that week cost. */
  prizeBreakEvenWeek: number | null
  /** v21: travel the academy paid for over the horizon, summed at each season wrap. Invisible in
   *  the category fold by design – the scholarship discounts the travel line rather than crediting
   *  an income one – so it is carried here or it is not measurable at all. */
  academyCoveredCents: number
  /** how many of the horizon's seasons she was on a scholarship for. */
  academySeasons: number
  /** DIAGNOSTIC ONLY: financeWindow(financeWeeks, 0).netCents read at horizon end – the OLD BUGGY read
   *  that the 60-week pruning corrupts past 60 weeks. Kept so tests can prove the fix; not featured in
   *  the console table (surfaced in the CSV so the correction is auditable). */
  naiveNetCents: number
}

function zeroCats(): Record<WorldEventCategory, number> {
  return {
    coaching: 0,
    travel: 0,
    entry: 0,
    gear: 0,
    stringing: 0,
    physio: 0,
    vacation: 0,
    practice: 0,
    sponsor: 0,
    academy: 0,
    income: 0,
    interest: 0,
    prize: 0,
    other: 0,
  }
}

// --- career simulation -------------------------------------------------------

/** Open a fresh, deterministic career for a preset+index: createWorld + rngFromSeed(world.seed) are
 *  the ONLY entropy sources, so the same (preset, index) reproduces exactly. Exported so tests can
 *  replay a career week by week without duplicating the engine wiring. */
export function openCareer(
  preset: Preset,
  index: number,
  policy: Policy = POLICIES[0],
): { world: WorldState; rng: Rng; seed: string } {
  const seed = `bench-${preset.background}-${index}`
  const profile: PlayerProfile = {
    ...DEFAULT_PROFILE,
    background: preset.background,
    coachTier: preset.coachTier,
  }
  const world = createWorld(seed, profile)
  // R4: the tournament-week toggle is a career-long stance, so it is set at birth rather than
  // flipped mid-run. ZERO draws either way - the frozen capture cannot see it.
  world.coachOnEventWeeks = policy.coachOnEventWeeks
  const rng = rngFromSeed(world.seed)
  return { world, rng, seed }
}

/** Zeroed per-tier counter over the whole live catalogue (ladder-up: six rungs). */
export function zeroByTier(): Record<TierId, number> {
  return Object.fromEntries(TIER_LADDER.map((t) => [t, 0])) as Record<TierId, number>
}

/** Advance ONE career week under entry policy v3, then tick and resolve any spawned tournament.
 *  Returns the per-tier entries committed this week. Shared by runCareer and the tests so the world
 *  evolution is defined in exactly one place (no duplication of the entry policy). */
/** HOW THE CAREER IS MANAGED - the second axis of the bench, and the owner's question (R4).
 *
 *  «"элита = ловушка" - это верно для гриндера, а не обязательно для игрока. Вот и я о том же.
 *   Добавь, померим.»
 *
 *  The only policy this bench has ever had enters everything it can afford and spends toward zero,
 *  so an expensive coach mechanically eats the entry fees and any "the dear rungs do not pay"
 *  finding inherits that behaviour rather than measuring the rung. A second arm that manages the
 *  career the way a player would is what tells the two apart. */
export interface Policy {
  id: 'grinder' | 'player'
  label: string
  /** cash the family refuses to go below when committing to a trip. 0 = spend to the floor. */
  reserveCents: number
  /** condition she must be at to enter at all, ON TOP of the tier's own caution floor. The
   *  plateau work measured a grinder's mean condition at 24.4 against the field's 72.3, and a
   *  floor near 70 was worth roughly #89 -> #40, so this is the lever that arm exists to pull. */
  restFloor: number
  /** does she buy the coach for competition weeks (R4)? */
  coachOnEventWeeks: boolean
}

export const POLICIES: Policy[] = [
  // The historical arm, unchanged in every respect, so every earlier number in this file's history
  // is still reproducible: no reserve, no rest floor, and the R4 default of leaving the coach at
  // home on competition weeks.
  { id: 'grinder', label: 'grinder', reserveCents: 0, restFloor: 0, coachOnEventWeeks: false },
  // Someone actually managing it: keeps a season's worth of runway rather than spending to zero,
  // refuses to race worn out, and - having paid for a coach - takes him to the tournaments.
  { id: 'player', label: 'player', reserveCents: 5_000_00, restFloor: 70, coachOnEventWeeks: true },
]

/** Advance ONE career week under a policy, then tick and resolve any spawned tournament. Returns
 *  the per-tier entries committed this week. Shared by runCareer and the tests so the world
 *  evolution is defined in exactly one place (no duplication of the entry policy). */
export function stepCareerWeek(
  world: WorldState,
  rng: Rng,
  policy: Policy = POLICIES[0],
): Record<TierId, number> {
  const entered = zeroByTier()
  // Entry policy v3: enter each RANKING-ELIGIBLE event affordable by entry+travel as its deadline
  // APPROACHES (within ENTRY_LOOKAHEAD weeks) – a parent commits a few weeks out, not a year ahead.
  //
  // Ladder-up: the season now stacks several tiers on the same week, so the policy walks the
  // calendar STRONGEST-TIER-FIRST and takes at most one event per week (enterEvent enforces the
  // rule; the policy has to choose, and an ambitious parent picks the biggest event she qualifies
  // for). Without the ordering the policy would just grab whichever rung happened to sort first.
  const byRung = [...world.season].sort(
    (a, b) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier),
  )
  for (const e of byRung) {
    if (world.entries.includes(e.id)) continue
    if (world.week > e.deadlineWeek) continue // deadline passed – enterEvent would throw
    if (e.deadlineWeek - world.week > ENTRY_LOOKAHEAD) continue // too far out – commit nearer the date
    // One tournament a week: skip the week entirely once something is booked on it.
    if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
    // Ranking gate (before affordability): the kid may only enter tiers her EARNED points open.
    // Two ladders: the domestic rungs read her domestic best-6 and the international ones read her
    // ITF RANK, so the policy asks the engine's own single gate instead of re-deriving either.
    if (!tierOpenFor(world, e.tier)) continue
    // Availability gate (Season-Life): skip HARD-blocked events (school exams / injured) the way
    // a parent would – enterEvent throws on them. 'caution' (fatigue) stays enterable by design.
    if (availabilityStatus(world, e).level === 'blocked') continue
    // THE REST FLOOR (player arm): the grinder ignores the fatigue caution by design; a player
    // does not race worn out. `restFloor` 0 leaves the historical behaviour byte-identical.
    if (world.condition < policy.restFloor) continue
    // v21: the trip is priced AFTER the academy's share, because that is what the family is
    // actually asked for – a policy quoting the sticker price would refuse trips she can afford.
    const cost = TIERS[e.tier].entryFeeCents + travelCostFor(world, e)
    // THE RESERVE (player arm): commit only what still leaves the family standing. A reserve of 0
    // is the old `world.fundsCents < cost` test exactly.
    if (world.fundsCents - cost < policy.reserveCents) continue
    enterEvent(world, e.id)
    entered[e.tier]++
  }
  tickWeek(world, rng)
  if (world.pendingTournament) {
    skipTournament(world)
    closeTournament(world)
  }
  return entered
}

/** True ⇔ the horizon's reach target is currently met. 14→16: the domestic arm (DOMESTIC best-6 >=
 *  REACH_TARGET_MONEY - National eligibility while that constant was 150, a National title plus a
 *  National final since it was re-based to 320). 14→18: (ranked AND top-50) OR the ITF points
 *  threshold. Keyed on targetAge derived from the horizon.
 *
 *  ⚠ WHICH CONSTANT A HORIZON READS IS DECIDED HERE AND NOWHERE ELSE, and it is the first thing to
 *  check before attributing a horizon's numbers to a re-base: `targetAge >= 18` takes the PRO arm,
 *  so 14→18 and 14→20 never read REACH_TARGET_MONEY at all. Re-basing it moves 14→16 and only
 *  14→16. The 14→18 horizon is REACH_PRO_RANK / REACH_PRO_POINTS or it is nothing.
 *
 *  ⚠ THE TWO ARMS READ TWO DIFFERENT TABLES, and they have to (docs/specs/two-ladders.md). This used
 *  to be one `points` local, which was right while there was one ledger and became wrong the moment
 *  the tracks split: the 1548338 sweep retracked it to 'itf' for the 14→18 arm and silently took the
 *  14→16 arm with it, against a threshold its own constant documents as DOMESTIC. It is the exact
 *  failure mode that commit removed the `kidPoints` default to prevent, surviving in the one place
 *  the compiler could not see it - a single variable serving two questions.
 *
 *  It was not a cosmetic slip. On the real ITF scale 150 international points is most of a J60
 *  title-plus-final, so the 14→16 horizon measured a milestone a working family reached in 0 of 30
 *  careers and every other preset in 1 of 30 - a reach tracker pinned at 'never', which is not a
 *  measurement. Read domestically it is 28 of 30 for working: a genuine climb, some careers making
 *  it and some not, which is what the horizon is FOR. Caught by the guard below that asserts both
 *  branches fire. */
function reachedTarget(world: WorldState, horizonWeeks: number): boolean {
  const targetAge = START_AGE_YEARS + Math.floor(horizonWeeks / WEEKS_PER_YEAR)
  if (targetAge >= 18) {
    const points = kidPoints(world, 'itf')
    // hasResults mirrors the engine's `ranked` signal (StatsScreen/HomeScreen use
    // `countingResults.length > 0`): the kid isn't really ranked until she owns a counting result.
    // Every kid result carries points > 0 (finalizeTournament only pushes scoring results), so
    // `points > 0` IS `computeCountingResults(world).length > 0`. The guard is REQUIRED: without it the
    // point-less field ties at dense-rank 1, firing kidRank<=50 at week 1 for everyone. The points arm
    // stays UNGUARDED (earned, not tie-degenerate).
    const hasResults = points > 0
    return (hasResults && world.kidRank <= REACH_PRO_RANK) || points >= REACH_PRO_POINTS
  }
  return kidPoints(world, 'domestic') >= REACH_TARGET_MONEY
}

/**
 * Run ONE career headless to `horizonWeeks` for a preset+index. Deterministic: (preset, index,
 * horizon) reproduces byte-identically. Carries state across seasons by continuing to tick the SAME
 * world – fundsCents, kidRank, the results ledger and lastSeasonSummary all persist on it.
 *
 * The finance read accumulates per season at each wrap (world.week % 52 === 49) with
 * financeWindow(fw, yearStartWeek), summing the per-year folds – so it stays correct past the engine's
 * 60-week finance-ledger pruning, which financeWindow(fw, 0) at horizon end would fall foul of.
 */
export function runCareer(
  preset: Preset,
  index: number,
  horizonWeeks: number,
  policy: Policy = POLICIES[0],
): SeedResult {
  const { world, rng, seed } = openCareer(preset, index, policy)

  let peak = world.fundsCents
  let bankruptWeek: number | null = world.fundsCents < 0 ? 0 : null
  let reachedWeek: number | null = null
  const entries = { total: 0, byTier: zeroByTier() }

  // Per-season finance accumulation (survives the engine's 60-week pruning; see file header).
  const signedCats = zeroCats() // signed per category: income positive, expense negative
  let cumIncome = 0
  let cumExpense = 0
  let cumNet = 0
  let academyCoveredCents = 0
  let academySeasons = 0
  const perSeason: PerSeason[] = []

  // A4: the prize-money watch. Read off the SAME per-week ledger the Money screen reads, week by
  // week as the career runs, because `financeWeeks` is pruned to a 60-week trailing window and a
  // horizon-end scan would silently miss every earlier week – the exact bug the per-season fold
  // above exists to dodge. `seenWeeks` makes the scan idempotent as rows accumulate and then age out.
  let firstPrizeWeek: number | null = null
  let prizeBreakEvenWeek: number | null = null
  const seenWeeks = new Set<number>()

  for (let i = 0; i < horizonWeeks; i++) {
    const e = stepCareerWeek(world, rng, policy)
    for (const tier of TIER_LADDER) {
      entries.byTier[tier] += e[tier]
      entries.total += e[tier]
    }

    if (world.fundsCents < peak) peak = world.fundsCents
    if (bankruptWeek === null && world.fundsCents < 0) bankruptWeek = world.week
    if (reachedWeek === null && reachedTarget(world, horizonWeeks)) reachedWeek = world.week

    for (const fw of world.financeWeeks) {
      if (seenWeeks.has(fw.week)) continue
      seenWeeks.add(fw.week)
      const prize = fw.byCategory.prize ?? 0
      if (prize <= 0) continue
      if (firstPrizeWeek === null) firstPrizeWeek = fw.week
      // Every negative category of that week, as a positive magnitude – see prizeBreakEvenWeek.
      const outgoings = Object.values(fw.byCategory).reduce((s, v) => s + (v < 0 ? -v : 0), 0)
      if (prizeBreakEvenWeek === null && prize > outgoings) prizeBreakEvenWeek = fw.week
    }

    // Season wrap: fold this just-finished year's finance and bank its summary. The wrap week is
    // always off-season (no scheduled event, so no pending tournament), so maybeFireSeasonWrapUp has
    // already run inside tickWeek and world.lastSeasonSummary is this year's recap.
    if (world.week % WEEKS_PER_YEAR === SEASON_WRAP_OFFSET) {
      const yearStartWeek = Math.floor(world.week / WEEKS_PER_YEAR) * WEEKS_PER_YEAR
      const fold = financeWindow(world.financeWeeks, yearStartWeek)
      for (const [cat, amt] of Object.entries(fold.byCategory) as [WorldEventCategory, number][]) {
        signedCats[cat] += amt
      }
      cumIncome += fold.incomeCents
      cumExpense += fold.expenseCents
      cumNet += fold.netCents
      // v21: the scholarship's travel half never appears as income – it is taken off the travel
      // line – so the only place its size exists is the academy's own season tally. Read at the
      // wrap (week 49), which is after every trip of the year and before the review resets it.
      academyCoveredCents += world.academy?.coveredCents ?? 0
      if (world.academy) academySeasons += 1
      const s = world.lastSeasonSummary
      perSeason.push({
        seasonYear: s?.seasonYear ?? START_AGE_YEARS + Math.floor(world.week / WEEKS_PER_YEAR),
        endRank: s?.endRank ?? world.kidRank,
        points: s?.points ?? 0,
        wins: s?.wins ?? 0,
        losses: s?.losses ?? 0,
        netCents: fold.netCents,
      })
    }
  }

  const cats = zeroCats()
  for (const cat of EXPENSE_CATS) cats[cat] = -signedCats[cat] // negatives -> positive magnitude
  for (const cat of INCOME_CATS) cats[cat] = signedCats[cat]

  return {
    seed,
    cats,
    grossExpenseCents: cumExpense,
    totalIncomeCents: cumIncome,
    netCents: cumNet,
    endFundsCents: world.fundsCents,
    weeksToBankrupt: bankruptWeek,
    survived: bankruptWeek === null,
    peakDeficitCents: peak,
    reachedWeek,
    endRank: world.kidRank,
    endPoints: kidPoints(world, 'itf'),
    perSeason,
    entries,
    firstPrizeWeek,
    prizeBreakEvenWeek,
    academyCoveredCents,
    academySeasons,
    naiveNetCents: financeWindow(world.financeWeeks, 0).netCents,
  }
}

// --- stats -------------------------------------------------------------------

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((s, x) => s + x, 0) / xs.length
}

/** Population standard deviation (we have the whole 30-seed population, not a sample). */
export function stddev(xs: number[]): number {
  if (xs.length === 0) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// --- formatting --------------------------------------------------------------

/** Whole-dollar money for the console, e.g. -1863042 -> "-$18,630". */
function fmtUsd(cents: number): string {
  const dollars = Math.round(cents / 100)
  const sign = dollars < 0 ? '-' : ''
  return `${sign}$${Math.abs(dollars).toLocaleString('en-US')}`
}

function pad(s: string, w: number): string {
  return s.length >= w ? s : ' '.repeat(w - s.length) + s // right-align
}
function padEnd(s: string, w: number): string {
  return s.length >= w ? s : s + ' '.repeat(w - s.length)
}

const LABEL_W = 16
const COL_W = 13

function statRow(label: string, xs: number[]): string {
  const cells = [fmtUsd(mean(xs)), '±' + fmtUsd(stddev(xs)), fmtUsd(Math.min(...xs)), fmtUsd(Math.max(...xs))]
  return '  ' + padEnd(label, LABEL_W) + cells.map((c) => pad(c, COL_W)).join('')
}

function header(): string {
  return '  ' + padEnd('', LABEL_W) + ['mean', '±sd', 'min', 'max'].map((c) => pad(c, COL_W)).join('')
}

// --- rendering ---------------------------------------------------------------

const RULE = '─'.repeat(2 + LABEL_W + COL_W * 4)

function renderPreset(preset: Preset, horizon: Horizon, rows: SeedResult[], policy: Policy): string {
  const startFunds = STARTING_FUNDS_CENTS[preset.background]
  const out: string[] = []
  out.push('')
  out.push(RULE)
  // The weekly band this rung bills at the horizon's OPENING age and the bench's plan – the same
  // arithmetic the engine charges, so the header cannot drift from the coaching row below it.
  const [wLo, wHi] = coachWeeklyBandCents(
    preset.coachTier,
    START_AGE_YEARS,
    WEEK_PLAN_PRESETS.balanced,
    preset.background,
  )
  const coachRange = `${COACH_TIER_LABEL[preset.coachTier]} coach $${Math.round(wLo / 100)}-${Math.round(wHi / 100)}/wk at 14, ${preset.background} corridor`
  out.push(
    `  PRESET ${preset.label}   ·  ${policy.label.toUpperCase()}   [${horizon.label}, ${horizon.weeks} wk / ${horizon.targetAge - START_AGE_YEARS} seasons]`,
  )
  out.push(`  start $${(startFunds / 100).toLocaleString('en-US')}, ${coachRange}, plan balanced 75/25`)
  out.push(RULE)
  out.push(header())

  out.push('  -- expense by category (cumulative over horizon) --')
  for (const cat of EXPENSE_CATS) {
    out.push(statRow(cat, rows.map((r) => r.cats[cat])))
  }
  out.push(statRow('GROSS EXPENSE', rows.map((r) => r.grossExpenseCents)))

  out.push('  -- income (cumulative; `prize` is the tennis, the other four are people) --')
  for (const cat of INCOME_CATS) {
    out.push(statRow(cat, rows.map((r) => r.cats[cat])))
  }
  out.push(statRow('TOTAL INCOME', rows.map((r) => r.totalIncomeCents)))

  out.push('  -- bottom line --')
  out.push(statRow('NET (horizon)', rows.map((r) => r.netCents)))
  out.push(statRow('end funds', rows.map((r) => r.endFundsCents)))
  out.push(statRow('peak deficit', rows.map((r) => r.peakDeficitCents)))

  // How many tournaments the ranking gate actually let the kid enter over the horizon, total + split.
  const meanEntry = (sel: (r: SeedResult) => number) => mean(rows.map(sel)).toFixed(1)
  const totals = rows.map((r) => r.entries.total)
  const split = TIER_LADDER.map((t) => `${t} ${meanEntry((r) => r.entries.byTier[t])}`).join(' · ')
  out.push('  -- entries (ranking-gated, whole horizon) --')
  out.push(
    '  ' +
      padEnd('entries/career', LABEL_W) +
      `${meanEntry((r) => r.entries.total)} mean  ` +
      `[min ${Math.min(...totals)} / max ${Math.max(...totals)}]`,
  )
  out.push('  ' + padEnd('  per tier', LABEL_W) + split)

  // THE SCHOLARSHIP (v21): how many careers it reached, for how many seasons, and what it paid.
  const backed = rows.filter((r) => r.academySeasons > 0)
  out.push('  -- academy scholarship --')
  out.push(
    '  ' +
      padEnd('backed', LABEL_W) +
      `${backed.length}/${rows.length} careers · ${meanEntry((r) => r.academySeasons)} seasons mean · ` +
      `travel covered ${fmtUsd(mean(rows.map((r) => r.academyCoveredCents)))} mean`,
  )

  // A4 (task #17): THE WEEK THE ARITHMETIC FLIPS. Two facts, and the second is the one the whole
  // slice is for: how many careers are ever PAID at all, and how many are ever paid MORE THAN THE
  // WEEK COST. "never" in either column is a real answer about this ladder, not a broken tracker –
  // see prizeBreakEvenWeek for exactly what "the week's costs" counts.
  const paid = rows.filter((r) => r.firstPrizeWeek !== null)
  const flipped = rows.filter((r) => r.prizeBreakEvenWeek !== null)
  const medFirst = paid.length ? median(paid.map((r) => r.firstPrizeWeek as number)).toString() : '–'
  const medFlip = flipped.length ? median(flipped.map((r) => r.prizeBreakEvenWeek as number)).toString() : '–'
  out.push('  -- prize money (A4: when does the tennis start paying for itself?) --')
  out.push(
    '  ' +
      padEnd('first cheque', LABEL_W) +
      `${paid.length}/${rows.length} careers ever paid · median week ${medFirst}` +
      (paid.length ? ` (earliest ${Math.min(...paid.map((r) => r.firstPrizeWeek as number))})` : ''),
  )
  out.push(
    '  ' +
      padEnd('week it flips', LABEL_W) +
      `${flipped.length}/${rows.length} careers where a week's prize beat that week's costs · median week ${medFlip}` +
      (flipped.length ? ` (earliest ${Math.min(...flipped.map((r) => r.prizeBreakEvenWeek as number))})` : ''),
  )

  // SURVIVAL (the headline): cumulative bankruptcy-survival over the FULL horizon.
  const survivors = rows.filter((r) => r.survived)
  const red = rows.filter((r) => r.weeksToBankrupt !== null)
  const redWeeks = red.map((r) => r.weeksToBankrupt as number)
  const medRedWeek = red.length ? median(redWeeks).toString() : '–'
  out.push('  -- survival & reach (SURVIVAL RUNWAY + points/rank proxy) --')
  out.push(
    '  ' +
      padEnd('survival', LABEL_W) +
      `survived ${survivors.length}/${rows.length} · median week-to-red = ${medRedWeek}` +
      (red.length ? ` (earliest week ${Math.min(...redWeeks)})` : ''),
  )

  // REACH-RATE proxy: % of seeds meeting the horizon target within the horizon, + median reach week.
  const reached = rows.filter((r) => r.reachedWeek !== null)
  const reachWeeks = reached.map((r) => r.reachedWeek as number)
  const reachPct = ((reached.length / rows.length) * 100).toFixed(0)
  const medReachWeek = reached.length ? median(reachWeeks).toString() : '–'
  out.push(
    '  ' +
      padEnd('reach', LABEL_W) +
      `reached ${reached.length}/${rows.length} (${reachPct}%) · median reach week = ${medReachWeek}  ` +
      `[target: ${horizon.blurb}]`,
  )

  // Per-season progression (mean end-of-season rank), so the multi-season carry is visible.
  const seasonCount = horizon.targetAge - START_AGE_YEARS
  const rankBySeason: string[] = []
  for (let s = 0; s < seasonCount; s++) {
    const ranks = rows.filter((r) => r.perSeason[s]).map((r) => r.perSeason[s].endRank)
    rankBySeason.push(ranks.length ? `S${s + 1} #${Math.round(mean(ranks))}` : `S${s + 1} –`)
  }
  out.push('  ' + padEnd('season endRank', LABEL_W) + rankBySeason.join(' · ') + '  (mean dense rank)')
  return out.join('\n')
}

const policyHeader = (seeds: number): string => [
  'Ties Break – economy bench (measurement only; changes no engine numbers)',
  '',
  'PRIZE MONEY IS MODELLED (task #17). The adult rungs pay off TierDef.prizeCents at finalize; the',
  '    junior and domestic rungs pay nothing and never will, because juniors pay to play. So the first',
  '    two seasons of every career are still a pure sink, and the A4 block per preset reports when – if',
  '    ever – a week\'s cheque beats that week\'s costs. The cheque does NOT scale with the wealth',
  '    corridor: every family below is handed the identical figure for the identical result.',
  '',
  'Horizons run against the SAME continued world (state carries across seasons):',
  `  14→16 = 104 wk (2 seasons) – ${HORIZONS[0].blurb}`,
  `  14→18 = 208 wk (4 seasons) – ${HORIZONS[1].blurb}`,
  `  14→20 = 312 wk (6 seasons) – ${HORIZONS[2].blurb}`,
  'Finance is folded per season at each wrap (financeWindow from the year start, summed) so it stays',
  '  correct past the engine\'s 60-week ledger pruning – a naive financeWindow(fw,0) would drop early seasons.',
  '',
  `Entry policy v3: each week, enter every RANKING-ELIGIBLE event (a tier her EARNED points open) the`,
  `  kid can afford entry+travel for AS ITS DEADLINE NEARS (within ${ENTRY_LOOKAHEAD} wk); tick; skip+close any`,
  `  spawned tournament. Funds red ⇒ entries stall; coaching still bleeds.`,
  `${seeds} seeds/cell · coach rung per preset · plan balanced (75/25) · TWO policy arms:`,
  `  grinder = enters everything affordable, no reserve, no rest floor, coach stays home on event weeks;`,
  `  player  = keeps a $5k reserve, refuses to enter below condition ${POLICIES[1].restFloor}, takes the coach to tournaments.`,
  `Money is whole-dollar rounded; ±sd is the population stddev across the ${seeds} seeds.`,
].join('\n')

// --- CSV ---------------------------------------------------------------------

function toCsv(all: { horizon: Horizon; preset: Preset; policy: Policy; rows: SeedResult[] }[]): string {
  const cols = [
    'horizon',
    'horizon_weeks',
    'preset',
    'policy',
    'background',
    'seed',
    ...EXPENSE_CATS.map((c) => `${c}_cents`),
    ...INCOME_CATS.map((c) => `${c}_cents`),
    'gross_expense_cents',
    'total_income_cents',
    'net_cents',
    'naive_window_net_cents',
    'end_funds_cents',
    'weeks_to_bankrupt',
    'survived',
    'peak_deficit_cents',
    'reached_week',
    'first_prize_week',
    'prize_break_even_week',
    'end_rank',
    'end_points',
    'seasons_captured',
    'entries_total',
    ...TIER_LADDER.map((t) => `entries_${t}`),
  ]
  const lines = [cols.join(',')]
  for (const { horizon, preset, policy, rows } of all) {
    for (const r of rows) {
      const cells = [
        horizon.label,
        horizon.weeks.toString(),
        preset.label.trim(),
        policy.label,
        preset.background,
        r.seed,
        ...EXPENSE_CATS.map((c) => r.cats[c].toString()),
        ...INCOME_CATS.map((c) => r.cats[c].toString()),
        r.grossExpenseCents.toString(),
        r.totalIncomeCents.toString(),
        r.netCents.toString(),
        r.naiveNetCents.toString(),
        r.endFundsCents.toString(),
        r.weeksToBankrupt === null ? '' : r.weeksToBankrupt.toString(),
        r.survived ? '1' : '0',
        r.peakDeficitCents.toString(),
        r.reachedWeek === null ? '' : r.reachedWeek.toString(),
        r.firstPrizeWeek === null ? '' : r.firstPrizeWeek.toString(),
        r.prizeBreakEvenWeek === null ? '' : r.prizeBreakEvenWeek.toString(),
        r.endRank.toString(),
        r.endPoints.toString(),
        r.perSeason.length.toString(),
        r.entries.total.toString(),
        ...TIER_LADDER.map((t) => r.entries.byTier[t].toString()),
      ]
      lines.push(cells.join(','))
    }
  }
  return lines.join('\n') + '\n'
}

// --- CLI ---------------------------------------------------------------------

function parseCsvPath(argv: string[]): string | null {
  const i = argv.indexOf('--csv')
  if (i === -1) return null
  const path = argv[i + 1]
  if (!path || path.startsWith('--')) {
    throw new Error('--csv requires a file path argument')
  }
  return path
}

/** `--seeds N` – the Monte-Carlo sample size, defaulting to SEEDS_PER_PRESET.
 *
 *  It is a FLAG rather than a constant because 30 seeds is a trend and not a claim: a balance
 *  change of a few points hides inside the noise of a 30-seed run (the random-draw slice looked
 *  like a 14pp regression at 30 and was flat at 120). Anything that gets reported as a number
 *  should be run at a sample that carries it. */
function parseSeeds(argv: string[]): number {
  const i = argv.indexOf('--seeds')
  if (i === -1) return SEEDS_PER_PRESET
  const n = Number(argv[i + 1])
  if (!Number.isInteger(n) || n < 1) throw new Error('--seeds requires a positive integer')
  return n
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const csvPath = parseCsvPath(argv)
  const seeds = parseSeeds(argv)

  console.log(policyHeader(seeds))

  const all: { horizon: Horizon; preset: Preset; policy: Policy; rows: SeedResult[] }[] = []
  for (const horizon of HORIZONS) {
    console.log('')
    console.log(`${'═'.repeat(2 + LABEL_W + COL_W * 4)}`)
    console.log(`  HORIZON ${horizon.label}  (${horizon.weeks} weeks, ${horizon.targetAge - START_AGE_YEARS} seasons) – ${horizon.blurb}`)
    console.log(`${'═'.repeat(2 + LABEL_W + COL_W * 4)}`)
    for (const preset of PRESETS) {
      for (const policy of POLICIES) {
        const rows: SeedResult[] = []
        for (let i = 0; i < seeds; i++) rows.push(runCareer(preset, i, horizon.weeks, policy))
        all.push({ horizon, preset, policy, rows })
        console.log(renderPreset(preset, horizon, rows, policy))
      }
    }
  }

  // THE SIDE-BY-SIDE, which is the whole point of the second arm: one line per (preset, policy) so
  // the two ways of running the SAME family and the SAME coach can be read against each other
  // without scrolling through nine pairs of blocks.
  for (const horizon of HORIZONS) {
    console.log('')
    console.log(`  TWO ARMS, ${horizon.label} – does the rung pay off for someone who does not grind?`)
    console.log(
      '  ' +
        padEnd('preset', 30) +
        ['policy', 'survived', 'end funds', 'reach', 'entries', 'coaching'].map((c) => pad(c, 12)).join(''),
    )
    for (const preset of PRESETS) {
      for (const policy of POLICIES) {
        const cell = all.find((a) => a.horizon === horizon && a.preset === preset && a.policy === policy)
        if (!cell) continue
        const r = cell.rows
        const survived = r.filter((x) => x.survived).length
        const reached = r.filter((x) => x.reachedWeek !== null).length
        console.log(
          '  ' +
            padEnd(preset.label.trim(), 30) +
            [
              policy.label,
              `${survived}/${r.length}`,
              fmtUsd(mean(r.map((x) => x.endFundsCents))),
              `${reached}/${r.length}`,
              mean(r.map((x) => x.entries.total)).toFixed(1),
              fmtUsd(mean(r.map((x) => x.cats.coaching))),
            ]
              .map((c) => pad(c, 12))
              .join(''),
        )
      }
    }
  }
  console.log('')

  if (csvPath) {
    writeFileSync(csvPath, toCsv(all))
    console.log(`Per-seed rows written to ${csvPath}`)
  }
}

// Run only when invoked as the CLI script, never when imported. Under vite-node process.argv[1] is
// the runner (not this file), so the usual argv[1] entry check doesn't apply; the signals that do
// work are "not inside vitest" (vitest sets process.env.VITEST) and "this file's name is on the
// command line".
//
// ⚠ THE SECOND HALF WAS ADDED BECAUSE ANOTHER TOOL BORROWED THE CAREER LOOP. `stepCareerWeek` and
// `POLICIES` are exported precisely so a bench does not have to invent a second entry policy, and
// tools/next-goal-bench.ts takes them up on it - at which point importing this file ran the whole
// nine-preset economy sweep first, for nobody. The VITEST check alone could not see the difference
// between "imported by a test" and "imported by another bench".
//
// ⚠⚠ AND THE NAME CHECK HAD SILENTLY STOPPED FINDING THE NAME (found 31.07 while wiring A4). The
// installed vite-node (3.2.4) rewrites `process.argv` to ["node", ".../bin/vite-node", ...flags] -
// the ENTRY FILE is stripped, though the flags after it survive, which is why `--csv` still parsed
// fine and nothing looked broken. So the predicate was false on every invocation, `main()` never
// ran, and `npm run bench:econ` had been printing the two lines of npm preamble and exiting 0 for
// however long that version has been installed. A bench that reports nothing and succeeds is worse
// than one that crashes: this is the tool the economy is tuned with.
//
// The name is still on the command line, just not in `argv` any more - npm puts the whole script
// body in `npm_lifecycle_script` ("vite-node tools/econ-bench.ts"), so the fix is to look in both
// places for the same string. It stays a NAME check rather than becoming an unconditional autorun,
// because that is what keeps `next-goal-bench` from triggering the sweep: its own lifecycle script
// names itself, not this file. `TB_BENCH_RUN` is the manual override for an invocation that hides
// the name from both (a bare `npx vite-node tools/econ-bench.ts` on this runner version).
const NAMED_ON_THE_COMMAND_LINE =
  process.argv.some((a) => a.includes('econ-bench')) ||
  (process.env.npm_lifecycle_script ?? '').includes('econ-bench') ||
  process.env.TB_BENCH_RUN === '1'
if (!process.env.VITEST && NAMED_ON_THE_COMMAND_LINE) {
  main()
}
