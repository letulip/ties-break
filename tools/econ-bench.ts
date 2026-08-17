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
  activeLadderOf,
  hasOutgrown,
  proEntryCapUsage,
  bookVacation,
  hireCoach,
  ageAtWeek,
  STARTING_FUNDS_CENTS,
  type WorldState,
} from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { WEEK_PLAN_PRESETS, LADDER_TRACKS } from '../src/shared/protocol'
import type { CoachTier, FamilyBackground, PlayerProfile, WorldEventCategory } from '../src/shared/protocol'
import { COACH_TIER_LABEL, bestFitCoachAt, coachWeeklyBandCents } from '../src/engine/coach'
import { ECONOMY, recommendVacationPackage } from '../src/engine/economy'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

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
 *  2026-08-02 were all ONE career crossing ONE line; a plateau is what stops the fifth.
 *
 *  ⚠⚠ RE-BASED AGAIN 320 → 250 ON 08.08, AND THIS ONE IS A RULING RATHER THAN A DRIFT
 *  (docs/specs/ladder-floor-2026-08.md §4d). The ladder floor stopped refusing a rung she has
 *  outgrown, on the owner's ruling that having somewhere to play every week is the CORRECT state of
 *  the world - tournaments run continuously in reality, and a first-round exit followed by six empty
 *  weeks is simply wrong - and that what she does with those weeks is the PLAYER's decision.
 *
 *  WHAT THAT DID TO THIS PROXY, and it is not a side effect, it is the ruling arriving: the domestic
 *  ladder used to PUSH her up it by closing Local behind her. It no longer does, so a parent who
 *  enters everything spends his early weeks on club draws, and 320 - "she is WINNING at the top of
 *  the domestic ladder by sixteen" - went to **0 of 30** on the working preset. A proxy 0 of 270
 *  careers meet is the same non-measurement 150 was, from the other end.
 *
 *  WHY 250 AND NOT THE NUMBER THAT RESTORES ELEVEN. The note above says it: re-base to the next
 *  milestone the domestic table NAMES. **250 is the most-named number in that table** - it is
 *  Regional's `enterPointBand` ceiling AND J30's floor, and act2-pro-tour.md §12.2 records that the
 *  two "are one decision and must move together". The proxy therefore becomes "by sixteen she has
 *  crossed the INTERNATIONAL DOOR", which is a milestone the game itself is built around rather than
 *  a threshold chosen to make a test interesting.
 *
 *  MEASURED, `npx vite-node tools/reach-sweep.ts` on this tree, careers of 30 clearing each
 *  candidate on the working preset (the one the band is asserted against):
 *
 *      target   150  200  250  270  280  290  300  320
 *      working·self-coached   29   20    9    6    3    1    1    0      <- median peak 224
 *
 *  150 is a formality again (29 of 30), 320 is nobody, and **250 reads 9 - inside the pinned
 *  [4, 20] with room on both sides**, on the preset that fires. Across all nine presets 250 reads
 *  9-21. */
export const REACH_TARGET_MONEY = 250
/** 14→18 "pro" proxy: a top-50 rank ONCE she is actually ranked (has a counting result) OR a points
 *  threshold. The `hasResults` guard on the rank arm is REQUIRED – see reachedTarget. */
export const REACH_PRO_RANK = 50
/** ⚠ `REACH_PRO_POINTS` LIVED HERE AND IS GONE (10.08, owner: «убери, раз мёртвый, надо будет -
 *  сделаем снова»). It was 60 ITF points, the second arm of a disjunction with the rank test below,
 *  and it was INERT: measured across all nine presets at every threshold from 60 to 600, the union
 *  equalled the rank arm alone, because every career reaching 60 points was already inside the top
 *  fifty holding a counting result. It moved no number in any file.
 *
 *  ⚠ REMOVED, NOT RE-TUNED, and the difference matters if it comes back. An inert arm is not a
 *  mis-set threshold - the two arms are not independent, the points ARE what produce the rank - so
 *  raising or lowering it buys nothing. Reviving it needs a reason to believe a career could be
 *  points-rich and rank-poor (a much larger field would do it), and then it is one line here plus
 *  one in `econ-reach-pro.test.ts`'s replay. */

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
 *  'practice' (season planner, v13) is an expense bucket the econ bench never books – friendlies are
 *  the fatigue bench's axis – so it reads $0 here and exists to keep the category fold exhaustive.
 *  ⚠ 'vacation' STOPPED READING $0 IN THE PLAYER ARM (task #89, R5): the owner's «и отпуска брать
 *  для восстановления». The grinder still never books one, so its column is unchanged. */
/** ⚠ 'facility' SITS BESIDE 'coaching' BECAUSE THEY ARE ONE BILL (v44,
 *  docs/specs/split-the-bill-2026-08.md): the weekly training charge is now booked as the coach's
 *  labour and the court's hire on two rows, and `coaching + facility` here is exactly the single
 *  'coaching' figure every table before v44 printed. Adding the row is what makes the split legible
 *  in the bench too - GROSS EXPENSE is folded from the ledger's own `expenseCents` and not from this
 *  list, so it was never at risk, but a category the bench does not name is a category the reader
 *  cannot see. */
export const EXPENSE_CATS: WorldEventCategory[] = ['coaching', 'facility', 'travel', 'entry', 'gear', 'stringing', 'physio', 'vacation', 'practice', 'other']
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
    facility: 0,
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
    tuition: 0,
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
  /** cash the family refuses to go below when committing to a trip. 0 = spend to the floor.
   *
   *  ⚠ AN ABSOLUTE FLOOR HERE IS THE POVERTY TRAP OF `the-wall-2026-08.md` §6a, AND IT IS WHY THE
   *  PLAYER ARM'S IS NOW 0 (task #89). It was $5,000. Measured on the owner's own Naomi seed with
   *  only `coachTier` moving: `self` #285, `budget` #211, `middle` **#1621**, `high` #1615 - a
   *  cliff, not a slope, with the middle arm entering ZERO professional events in twelve years
   *  while playing 613 matches and holding $19,185. A W75 trip is $2,200-3,900 and a `local` is
   *  nearly free, so a family hovering near an absolute floor is permanently allowed the rungs
   *  that pay nothing and permanently refused the ones that pay. The trajectory probe is
   *  unambiguous: her balance sat between $5,003 and $6,326 for TWELVE YEARS - the floor is an
   *  attractor, and everything she could afford above it was a club draw.
   *
   *  `reserveWeeks` replaces it. Kept as a field (not deleted) because the grinder's 0 is what
   *  makes that arm byte-identical to every number in this file's history, and because a flat
   *  reserve is still the right shape for a floor UNDER the scaled one. */
  reserveCents: number
  /** ⭐ R1 (task #89) – THE RESERVE AS WEEKS OF BILLS RATHER THAN A NUMBER OF DOLLARS.
   *
   *  The parent's sentence: «I keep a couple of months of our bills in the bank – what that is in
   *  money depends on what our week costs.»
   *
   *  The reserve is `max(reserveCents, reserveWeeks x the family's own weekly running cost)`,
   *  where "running cost" is what arrives whether or not she plays: coaching, the court, gear,
   *  strings, physio, the rest. Travel and entry fees are deliberately NOT in it - those are the
   *  trips being decided about, and folding them in would make a busy calendar raise its own bar.
   *  0 = the absolute floor alone (the historical arm). */
  reserveWeeks: number
  /** condition she must be at to enter at all, ON TOP of the tier's own caution floor. The
   *  plateau work measured a grinder's mean condition at 24.4 against the field's 72.3, and a
   *  floor near 70 was worth roughly #89 -> #40, so this is the lever that arm exists to pull.
   *
   *  ⚠ SINCE task #89 IT IS THE FLOOR AT THE BOTTOM OF THE LADDER, not a flat gate – see
   *  `restRelief` and `restFloorFor`. */
  restFloor: number
  /** ⭐ R4 (task #89, the owner's «и против кондиции») – HOW MUCH OF THE REST FLOOR THE TOP OF THE
   *  LADDER BUYS BACK.
   *
   *  The parent's sentence: «If she's tired I'll skip a small one – but for a big one I'll take
   *  her tired and rest her afterwards.»
   *
   *  A flat gate is not what a parent does: it refuses a Slam and a club draw on the same tired
   *  week. The floor therefore slides linearly down the ladder, from `restFloor` at `local` to
   *  `restFloor - restRelief` at `slam`. 0 = the flat gate (the historical arm). */
  restRelief: number
  /** does she buy the coach for competition weeks (R4)? */
  coachOnEventWeeks: boolean
  /** ⭐ R2 (task #89, the owner's rule, and the same one task #84 is applying to the season FEED) –
   *  NEVER PAY INTO A TABLE BELOW THE ONE SHE IS CLIMBING.
   *
   *  The parent's sentence: «Once she's playing internationals, a club tournament at home doesn't
   *  move her ranking any more – we don't pay for those.»
   *
   *  `local`/`regional`/`national` pay `domestic`, the J rungs pay `itf`, W15 and up pay `wta`, and
   *  nothing crosses (season/types.ts, LadderTrack). The table she is climbing is the engine's own
   *  one answer, `activeLadderOf` – the same read `coachMarket`'s alternative-rung suggestion uses,
   *  with the same rule: her table and UP, never down.
   *
   *  ⚠ ONE EXCEPTION, AND IT IS THE LADDER'S OWN – see `proAllowanceSpent` in stepCareerWeek. */
  onlyHerTable: boolean
  /** ⭐ R3 (task #89) – DO NOT PAY TO ENTER A RUNG SHE HAS ALREADY PASSED.
   *
   *  The parent's sentence: «I'm not paying to enter tournaments she's too good for.»
   *
   *  `hasOutgrown` is the ladder-floor ruling's own verdict. The engine stopped REFUSING those
   *  entries on the owner's call (a first-round exit followed by six empty weeks is simply wrong)
   *  and kept the verdict as a sorting key – «what she does with those weeks is the PLAYER's
   *  decision». This is the policy making that decision. */
  skipOutgrown: boolean
  /** ⭐ R5 (task #89, the owner's «и отпуска брать для восстановления») – BOOK THE WEEK AWAY.
   *
   *  The parent's sentence: «When she's run down we take a week off – the cheapest one that will
   *  actually fix her.»
   *
   *  Condition below this books next week off through the REAL `bookVacation` command, choosing the
   *  package with the engine's own shipped pre-highlight rule (`recommendVacationPackage`, the same
   *  one the rescue card and the planner sheet quote). null = never books one, which is what the
   *  bench has always done - the vacation and practice categories have read $0 in every table this
   *  tool has ever printed. */
  rescueBelow: number | null
  /** the condition the rescue aims to restore her to (the pick is the cheapest package that gets
   *  her there). ⚠ THE LADDER WAS RE-TUNED THIS WEEK to 10/18/26/32/40/48 – any older note about
   *  18/22/26 is stale. */
  rescueTo: number
  /** ⭐ R5b – the scheduled off-season family week, once a year.
   *
   *  The parent's sentence: «We take the off-season week away as a family, every year.» */
  offSeasonWeekOff: boolean
  /** prudence on both vacation arms: never spend more than this share of current funds on one
   *  package. Without it a rescue happily buys the elite programme the week before the family goes
   *  broke (the fatigue bench's own note, and its `maxSpendShare`). */
  vacationSpendShare: number
  /** ⭐ R6 (task #89, the owner's second named move: «drop the coach for a season») – THE REVIEW OF
   *  THE COACHING BILL.
   *
   *  The parent's sentence: «If we're running the savings down and we've eaten into the cushion, the
   *  coach goes and I take her myself until the money comes back.»
   *
   *  A family whose trailing half-year is net-negative AND whose funds have fallen through the
   *  reserve releases the coach – checked every week, because that is when it hurts. Taking him back
   *  waits for the season to end and for the books to carry half a season of his fees on top of the
   *  cushion, because a hire is a decision and a release is not. false = the historical
   *  behaviour, in which `coachTier` is fixed at BIRTH and the family pays that bill until it is
   *  bankrupt - which `the-wall-2026-08.md` §6 named as the modelling choice that manufactures the
   *  poverty every economy verdict then reported. */
  coachSeasonReview: boolean
}

/** THE REST FLOOR FOR ONE RUNG – R4's slide. `local` pays the full `restFloor`; `slam` pays
 *  `restFloor - restRelief`; everything between is linear in ladder position. A `restRelief` of 0
 *  returns the flat gate unchanged, which is what keeps the grinder byte-identical. */
export function restFloorFor(policy: Policy, tier: TierId): number {
  if (policy.restRelief === 0) return policy.restFloor
  const i = TIER_LADDER.indexOf(tier)
  if (i < 0) return policy.restFloor
  return policy.restFloor - (policy.restRelief * i) / Math.max(1, TIER_LADDER.length - 1)
}

/** How many weeks of ledger the running-cost read looks back over. 26 = half a season, comfortably
 *  inside the engine's 60-week finance pruning, long enough that one expensive fortnight cannot
 *  move the reserve on its own. */
export const RUNNING_COST_WINDOW = 26

/** The categories that arrive whether or not she plays – see `Policy.reserveWeeks`. `travel` and
 *  `entry` are the trips being decided about and are deliberately absent; `vacation` and `practice`
 *  are discretionary and would let one holiday raise the bar for the next trip. */
const RUNNING_COST_CATS: WorldEventCategory[] = ['coaching', 'facility', 'gear', 'stringing', 'physio', 'other']

/** THE FAMILY'S OWN WEEKLY RUNNING COST, in cents, read off the same ledger the Money screen reads.
 *  Read-only; no RNG. Falls back to a zero week before there is any ledger to read. */
export function weeklyRunningCostCents(world: WorldState): number {
  const from = Math.max(0, world.week - RUNNING_COST_WINDOW)
  const span = Math.max(1, world.week - from)
  const win = financeWindow(world.financeWeeks, from)
  let out = 0
  for (const cat of RUNNING_COST_CATS) out += Math.max(0, -(win.byCategory[cat] ?? 0))
  return out / span
}

/** THE CASH THE FAMILY REFUSES TO GO BELOW THIS WEEK – R1. */
export function reserveFor(world: WorldState, policy: Policy): number {
  if (policy.reserveWeeks <= 0) return policy.reserveCents
  return Math.max(policy.reserveCents, policy.reserveWeeks * weeklyRunningCostCents(world))
}

export const POLICIES: Policy[] = [
  // The historical arm, unchanged in every respect, so every earlier number in this file's history
  // is still reproducible: no reserve, no rest floor, and the R4 default of leaving the coach at
  // home on competition weeks. ⚠ EVERY FIELD ADDED BY TASK #89 IS OFF HERE, DELIBERATELY: this arm
  // is the file's reproducibility anchor and the one `tests/endings-bench.test.ts` drives.
  {
    id: 'grinder',
    label: 'grinder',
    reserveCents: 0,
    reserveWeeks: 0,
    restFloor: 0,
    restRelief: 0,
    coachOnEventWeeks: false,
    onlyHerTable: false,
    skipOutgrown: false,
    rescueBelow: null,
    rescueTo: 0,
    offSeasonWeekOff: false,
    vacationSpendShare: 0,
    coachSeasonReview: false,
  },
  // ⭐ THE MODEL OF A REASONABLE PARENT (task #89, rebuilt from «keeps a $5k reserve, refuses to
  // enter below condition 70, takes the coach to tournaments»).
  //
  // ⚠⚠ IT IS A MODEL, NOT AN OPTIMISER, AND THAT IS THE HARDER HALF OF THE BRIEF. The target is the
  // owner's own envelope on his own seeds - #51 self-coached, #106 with a middle coach - NOT
  // victory. A policy that games entry lists to #10 would make the game look far easier than it is
  // and every future verdict would be wrong in the opposite direction, which is exactly as bad as
  // the wall was. So every rule below is one a parent could say out loud in a single sentence, and
  // there is no rule here that reads the draw, the field, or anybody's form.
  {
    id: 'player',
    label: 'player',
    reserveCents: 0,
    reserveWeeks: 8,
    restFloor: 80,
    restRelief: 30,
    coachOnEventWeeks: true,
    onlyHerTable: true,
    skipOutgrown: true,
    rescueBelow: ECONOMY.practice.rescueCondition,
    rescueTo: ECONOMY.practice.rescueTargetCondition,
    offSeasonWeekOff: true,
    vacationSpendShare: 0.1,
    coachSeasonReview: true,
  },
]

/** Advance ONE career week under a policy, then tick and resolve any spawned tournament. Returns
 *  the per-tier entries committed this week. Shared by runCareer and the tests so the world
 *  evolution is defined in exactly one place (no duplication of the entry policy). */
/** ⚠ AN OPTIONAL VETO, AND ITS DEFAULT IS WHAT KEEPS EVERY EARLIER NUMBER IN THIS FILE'S HISTORY
 *  REPRODUCIBLE (08.08, docs/specs/ladder-floor-2026-08.md §4). The ladder floor put a decision in
 *  the PLAYER's hands that the engine used to make by refusing, and the owner's answer to that is a
 *  coach who says so on the card - so "does a parent who listens to his coach get a different
 *  career?" became a measurable question and there was nothing to measure it with. Passing a veto is
 *  the only way to ask it without a second copy of the entry policy, which is the duplication this
 *  function exists to prevent. Undefined is the historical arm, byte for byte. */
export type EntryVeto = (world: WorldState, event: SeasonEvent) => boolean

export function stepCareerWeek(
  world: WorldState,
  rng: Rng,
  policy: Policy = POLICIES[0],
  veto?: EntryVeto,
): Record<TierId, number> {
  const entered = zeroByTier()
  // ⚠ W2-ENDINGS: A CAREER THAT HAS ENDED ENTERS NOTHING, and the week still ticks. Since v39 a
  // family eight consecutive weeks below zero latches BANKRUPTCY, and `enterEvent` refuses on an
  // ended world - so a bench that walked straight past this crashed on the first bankrupt seed.
  // Skipping only the ENTRY phase (never the tick) keeps every horizon figure comparable: a career
  // under water was already entering nothing, because the affordability clause below refused it.
  if (world.ending) {
    tickWeek(world, rng)
    return entered
  }
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
  // ⚠ HOISTED, AND IT IS A CORRECTNESS NOTE AS WELL AS A SPEED ONE. Three of the reads below are
  // per-WEEK facts, not per-event ones: the reserve folds a 26-week ledger, `activeLadderOf` walks
  // the never-pruned finish marks, and `hasOutgrown` re-derives an acceptance cut over the whole
  // field. Nothing the entry loop does can move any of them - `enterEvent` spends money and books a
  // week, it finalises no tournament - so computing them once per week is the same answer, and
  // computing them inside a loop that runs ~187 times a week for 312 weeks x 30 seeds x 9 presets
  // is the difference between a bench that finishes and one that does not.
  const reserveCents = reserveFor(world, policy)
  const herTable = LADDER_TRACKS.indexOf(activeLadderOf(world))
  const outgrown = new Map<TierId, boolean>()
  // ⭐ R2's ONE EXCEPTION, AND IT IS THE LADDER'S OWN, COPIED RATHER THAN INVENTED. The tour's age
  // rule caps a sixteen-year-old at 12 professional entries a season and a seventeen-year-old at 16
  // (`proEntryCapUsage`), and `tierOutgrown` already lifts its ceiling on every NON-professional rung
  // the moment that allowance is spent - the owner's ruling 2, «игрок должен иметь возможность
  // играть, если не w-серии то где-то еще, чтобы не скучал», measured at 144 weeks with nothing to
  // enter before the clause existed. A parent obeys the same rule for the same reason, and it is his
  // sentence too: «when she's used up her professional entries for the year, she plays the junior and
  // home events rather than sit out the rest of the season.» Without this, R2 would re-create inside
  // the policy exactly the dead season the engine was changed to remove.
  const proAllowanceSpent = policy.onlyHerTable && proEntryCapUsage(world, world.week).remaining <= 0
  for (const e of byRung) {
    if (world.entries.includes(e.id)) continue
    if (world.week > e.deadlineWeek) continue // deadline passed – enterEvent would throw
    if (e.deadlineWeek - world.week > ENTRY_LOOKAHEAD) continue // too far out – commit nearer the date
    // One tournament a week: skip the week entirely once something is booked on it.
    if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
    // Ranking gate (before affordability): the kid may only enter tiers her EARNED points open.
    // Two ladders: the domestic rungs read her domestic best-6 and the international ones read her
    // ITF RANK, so the policy asks the engine's own single gate instead of re-deriving either.
    //
    // ⚠⚠ `e.id` IS PASSED, AND FOR MOST OF THIS FILE'S LIFE IT WAS NOT – WHICH MADE EVERY BENCH BUILT
    // ON THIS LOOP BLIND TO A WHOLE MECHANIC (round 21 #2b, 17.08). Since the wild cards, one door on
    // this ladder is a fact about ONE TOURNAMENT and not about a rung: a Grand Slam played in her
    // country holds eight places for home players the acceptance list refused. Asked without an event
    // id, `tierOpenFor` answers the honest PER-RUNG summary – "the Slam takes the top 112" – so this
    // line skipped every card the wild card opens, BEFORE `enterEvent` (which would have accepted it,
    // and which is the game's own gate) was ever asked. The bench was strictly stricter than the game.
    //
    // Measured cost of that blindness: `tools/wild-card-reach.ts` says 49 of 54 careers are OFFERED at
    // least one wild card, median 2 per career – and `ladder-baseline` and `big-rung-finishes` counted
    // exactly zero of them. A null from an instrument that cannot see the change is a null ARM, not a
    // null result, which is the lesson CLAUDE.md carries from the day before.
    //
    // ⚠ EVERY OTHER RUNG IS BYTE-IDENTICAL: the wild-card clause is Slam-only and returns false for
    // everything else, so this argument changes nothing anywhere but a home major.
    if (!tierOpenFor(world, e.tier, e.id)) continue
    // ...and the VETO, if this arm has one: a parent who does what his coach tells him. It sits
    // AFTER the ranking gate and BEFORE affordability on purpose - an opinion is only worth asking
    // for about a trip she is actually allowed to take.
    if (veto && veto(world, e)) continue
    // ⭐ R2 – HER OWN TABLE, AND UP. See Policy.onlyHerTable. Ranked here, beside the other
    // "is this trip worth taking at all" questions and before anything is priced, because a rung
    // that pays into a table she is not climbing is not made worth taking by being cheap - which
    // is precisely how the old policy came to take 139 club draws in one career.
    if (
      policy.onlyHerTable &&
      LADDER_TRACKS.indexOf(TIERS[e.tier].track) < herTable &&
      !(proAllowanceSpent && TIERS[e.tier].track !== 'wta')
    ) {
      continue
    }
    // ⭐ R3 – a rung she has passed. See Policy.skipOutgrown.
    if (policy.skipOutgrown) {
      let past = outgrown.get(e.tier)
      if (past === undefined) {
        past = hasOutgrown(world, e.tier)
        outgrown.set(e.tier, past)
      }
      if (past) continue
    }
    // Availability gate (Season-Life): skip HARD-blocked events (school exams / injured) the way
    // a parent would – enterEvent throws on them. 'caution' (fatigue) stays enterable by design.
    if (availabilityStatus(world, e).level === 'blocked') continue
    // THE REST FLOOR (player arm): the grinder ignores the fatigue caution by design; a player
    // does not race worn out. `restFloor` 0 leaves the historical behaviour byte-identical.
    // ⭐ R4 – and it is now a TRADE against what the event is worth, not a flat gate: see
    // `restFloorFor`. `restRelief` 0 is the flat gate, byte for byte.
    if (world.condition < restFloorFor(policy, e.tier)) continue
    // v21: the trip is priced AFTER the academy's share, because that is what the family is
    // actually asked for – a policy quoting the sticker price would refuse trips she can afford.
    const cost = TIERS[e.tier].entryFeeCents + travelCostFor(world, e)
    // THE RESERVE: commit only what still leaves the family standing. A reserve of 0 is the old
    // `world.fundsCents < cost` test exactly. ⭐ R1 – and it is now weeks of the family's own bills
    // rather than an absolute sum, which is the poverty trap of the-wall-2026-08.md §6a.
    if (world.fundsCents - cost < reserveCents) continue
    enterEvent(world, e.id)
    entered[e.tier]++
  }
  // ⭐ R5 – THE WEEK AWAY, booked with the real command, AFTER the entries are settled. The order is
  // the parent's: a tournament she wants beats a rest week, and a week she is too tired to enter
  // anything on is exactly the week to take off. `bookVacation` refuses a week that is not
  // plannable (an entered tournament, an exam block, an existing booking, an ended career), which
  // is the same set of weeks the UI would not offer - so a refusal means "it was not on the table".
  planRecoveryWeek(world, policy)
  // ⭐ R6 – the look at the coaching bill.
  reviewCoach(world, policy, reserveCents)
  tickWeek(world, rng)
  if (world.pendingTournament) {
    skipTournament(world)
    closeTournament(world)
  }
  return entered
}

/** R5: the off-season family week and the mid-season rescue, both through `bookVacation` on NEXT
 *  week - the only week the engine lets a player plan, which is what the UI offers too.
 *
 *  RNG DISCIPLINE: a booking is pure state. The price is quoted off the purpose-scoped sub-stream
 *  `seed:vacation:week:packageId`, re-derived at the call site and persisting nothing, so the MAIN
 *  stream's position is untouched and the bench stays byte-reproducible. That is the same property
 *  tests/planner.test.ts P1 proves with a career that books something every single week. */
function planRecoveryWeek(world: WorldState, policy: Policy): void {
  if (policy.rescueBelow === null && !policy.offSeasonWeekOff) return
  if (world.ending) return
  const target = world.week + 1
  const budgetCents = Math.floor(world.fundsCents * policy.vacationSpendShare)
  const pick = (above: number): string | null =>
    recommendVacationPackage({
      seed: world.seed,
      week: target,
      background: world.profile.background,
      condition: world.condition,
      fundsCents: world.fundsCents,
      budgetCents,
      targetCondition: above,
    })

  // 1. THE OFF-SEASON FAMILY WEEK, once a year. "Have we already had it this year" is read off
  //    `world.vacations` rather than carried in a counter, so the rule holds for a career resumed
  //    from anywhere and adds no state to a function that has none.
  const year = Math.floor(target / WEEKS_PER_YEAR)
  const inOffSeason = (w: number): boolean => w % WEEKS_PER_YEAR >= SEASON_WRAP_OFFSET
  if (
    policy.offSeasonWeekOff &&
    inOffSeason(target) &&
    !world.vacations.some((v) => Math.floor(v.week / WEEKS_PER_YEAR) === year && inOffSeason(v.week))
  ) {
    const id = pick(policy.rescueTo)
    if (id !== null) {
      try {
        bookVacation(world, target, id)
        return
      } catch {
        /* the week was not plannable – the option was never on the table */
      }
    }
  }

  // 2. THE RESCUE: she is run down, so the family takes the week off.
  if (policy.rescueBelow !== null && world.condition < policy.rescueBelow) {
    const id = pick(policy.rescueTo)
    if (id === null) return
    try {
      bookVacation(world, target, id)
    } catch {
      /* not plannable */
    }
  }
}

/** R6: the review of the coaching arrangement.
 *
 *  ⚠ THIS IS THE ONE PLACE THE BENCH STOPS TREATING `coachTier` AS A BIRTH FACT, which is what
 *  the-wall-2026-08.md §6 named: «the bench fixes coachTier at BIRTH from its preset, and the real
 *  decision is a TIMING decision. A working family paying a middle coach from fourteen has nothing
 *  left for entry fees.» The preset still decides WHICH rung this family buys – nothing here ever
 *  hires a rung they did not choose – it decides only whether they can hold it this season.
 *
 *  ⚠ THE TWO ARMS ARE DELIBERATELY ON DIFFERENT CLOCKS, and the asymmetry is the human one: LETTING
 *  HIM GO IS FORCED and is checked every week, TAKING HIM BACK IS A DECISION and waits for the
 *  season to end. Measured on the first cut, which reviewed both at the wrap: the working·elite arm
 *  went bankrupt at week 40, i.e. NINE WEEKS BEFORE ITS FIRST REVIEW, so the family sat and watched
 *  a bill it could not pay for the better part of a year. Nobody does that.
 *
 *  ZERO RNG: `hireCoach` draws nothing on any stream (the roster is a derivation of the seed and
 *  the id is a string), and `bestFitCoachAt` is the same pure rule `openingCoachId` uses at birth. */
function reviewCoach(world: WorldState, policy: Policy, reserveCents: number): void {
  if (!policy.coachSeasonReview || world.ending) return
  const born = world.profile.coachTier
  if (born === 'self') return
  if (world.coachId !== null) {
    // ⚠ THE TRAILING WINDOW IS 26 WEEKS, NOT 52, and it has to be: the check runs on ordinary weeks
    // now, and the engine prunes `financeWeeks` to a 60-week trailing window, so a 52-week fold read
    // off-wrap is the same silent truncation the per-season fold in runCareer exists to dodge.
    const halfYearNet = financeWindow(world.financeWeeks, Math.max(0, world.week - RUNNING_COST_WINDOW)).netCents
    if (halfYearNet < 0 && world.fundsCents < reserveCents) hireCoach(world, null)
    return
  }
  if (world.week % WEEKS_PER_YEAR !== SEASON_WRAP_OFFSET) return
  // Take him back when the cushion is whole and there is half a season of his fees on top of it.
  const [, weeklyHi] = coachWeeklyBandCents(born, ageAtWeek(world.week), WEEK_PLAN_PRESETS.balanced, world.profile.background)
  if (world.fundsCents < reserveCents + weeklyHi * (WEEKS_PER_YEAR / 2)) return
  const back = bestFitCoachAt(world.seed, ageAtWeek(world.week), born, world.profile.playStyle)
  if (!back) return
  try {
    hireCoach(world, back.id)
  } catch {
    /* he would not take her – the same refusal the coach screen would print */
  }
}

/** True ⇔ the horizon's reach target is currently met. 14→16: the domestic arm (DOMESTIC best-6 >=
 *  REACH_TARGET_MONEY - National eligibility while that constant was 150, a National title plus a
 *  National final since it was re-based to 320). 14→18: (ranked AND top-50) OR the ITF points
 *  threshold. Keyed on targetAge derived from the horizon.
 *
 *  ⚠ WHICH CONSTANT A HORIZON READS IS DECIDED HERE AND NOWHERE ELSE, and it is the first thing to
 *  check before attributing a horizon's numbers to a re-base: `targetAge >= 18` takes the PRO arm,
 *  so 14→18 and 14→20 never read REACH_TARGET_MONEY at all. Re-basing it moves 14→16 and only
 *  14→16. The 14→18 horizon is REACH_PRO_RANK or it is nothing.
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
    // point-less field ties at dense-rank 1, firing kidRank<=50 at week 1 for everyone.
    // ⚠ ONE ARM NOW, not two - see the note where REACH_PRO_POINTS used to be declared. `points` is
    // still read, and still does the work: it IS the ranked signal.
    const hasResults = points > 0
    return hasResults && world.kidRank <= REACH_PRO_RANK
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
  `  player  = the MODEL OF A REASONABLE PARENT (task #89), six rules, each one a sentence he could say:`,
  `      R1 keeps ${POLICIES[1].reserveWeeks} weeks of the family's own bills in the bank (NOT a flat $5k – that was the`,
  `         poverty trap of the-wall-2026-08.md §6a, which held her at ~$5,500 for twelve years);`,
  `      R2 never pays into a table below the one she is climbing (activeLadderOf and up);`,
  `      R3 never pays to enter a rung she has outgrown;`,
  `      R4 rests her below condition ${POLICIES[1].restFloor} at the bottom of the ladder, sliding to`,
  `         ${POLICIES[1].restFloor - POLICIES[1].restRelief} at the top – a tired week is worth spending on a big event, not a small one;`,
  `      R5 books the off-season family week and a rescue week below condition ${POLICIES[1].rescueBelow};`,
  `      R6 lets the coach go while the books run down through the cushion, and takes the same rung`,
  `         back when they recover. The preset still chooses WHICH rung; R6 decides only whether they hold it.`,
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
