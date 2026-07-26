/**
 * Fatigue/injury bench (docs/specs/fatigue-bench.md, owner ask 25.07) – a headless "how does the
 * NEW round-9 condition math behave over a season/career" tool.
 *
 * MEASUREMENT ONLY. This file imports the engine and reads condition/injury/match state; it
 * changes NO engine numbers. The B1/C1 main-stream invariance freezes stay untouched: the bench
 * only calls the same public API the UI does (enterEvent / tickWeek / skipTournament /
 * closeTournament) plus two pre-tick state choices a player makes in the UI anyway (the
 * train/rest plan preset and the physio toggle).
 *
 * MATRIX
 *  - Profiles: the real difficulty tiers 8k/25k/120k = working/middle/wealthy, with middle run
 *    both self-coached and hired (same as econ-bench – the coach setup also flips the DEFAULT
 *    physio toggle, so it is a fatigue lever too).
 *  - Policies (the load-management axis this bench exists to compare):
 *      grinder  – plan 85/15 (grind preset), enters EVERYTHING eligible+affordable, ignores the
 *                 fatigue 'caution' level exactly like econ-bench's entry policy v3.
 *      balanced – plan 75/25, same enter-everything rule (the default player).
 *      careful  – plan 60/40 (light preset), physio ALWAYS on, and skips entry while
 *                 condition < the tier's availability floor + 10 (rests until recovered).
 *    Physio for grinder/balanced follows the game default (ON iff hired coach); careful FORCES it.
 *  - Horizons: 52w (one season), 104w (14→16), 208w (14→18). 30 seeds per cell.
 *
 * PAIRED SEEDS: the seed is `fatigue-<background>-<index>` – policy and coach setup are NOT in
 * the seed, so every policy (and both middle presets) faces the SAME calendar, cohort and
 * per-week injury/physio sub-stream rolls. Only tau (the injury threshold), her condition and
 * the entry pattern differ – a paired comparison, which is what makes the 30-seed ordering
 * (grinder vs careful) tight enough to test.
 *
 * Determinism: (profile, policy, seed index, horizon) reproduces byte-identically – the engine
 * forbids wall-clock/Math.random and the bench adds no entropy of its own.
 *
 * Run:  npm run bench:fatigue           (console tables + sparklines, all three horizons)
 *       npm run bench:fatigue -- --csv /path/to/rows.csv   (also dump the weekly time-series)
 *       npm run bench:fatigue -- --scenario runfat-off,runfat-a,runfat-b,runfat-c,runfat-d
 *              (the CUMULATIVE RUN FATIGUE comparison – the owner's four ladders against the
 *               pre-ladder engine; --scenario takes one id or a comma-separated list)
 */
import { writeFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  isTierEligible,
  kidPoints,
  skipTournament,
  closeTournament,
  availabilityStatus,
  bookPractice,
  bookVacation,
  practiceCaution,
  tournamentRunStrain,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY, recommendVacationPackage, vacationPriceCents } from '../src/engine/economy'
import { rivalConditions } from '../src/engine/season/rival'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import type {
  CoachSetup,
  FamilyBackground,
  InjurySeverity,
  PlayerProfile,
  WeekPlan,
  WorldEventCategory,
} from '../src/shared/protocol'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

export const START_AGE_YEARS = 14
export const SEEDS_PER_CELL = 30
/** Same near-deadline commit window as econ-bench's entry policy v3. */
export const ENTRY_LOOKAHEAD = 3

export const SEVERITIES: readonly InjurySeverity[] = ['minor', 'moderate', 'major', 'severe']

/** RUN DEPTH: the most matches ONE committed run can be on the current calendar – a 32-draw is 5
 *  rounds (local 8 = 3, regional 16 = 4). The run-fatigue ladder is indexed by exactly this, so the
 *  histogram is the distribution of "which rungs of the ladder does the game ever actually charge".
 *  A deeper future draw would repeat the ladder's last rung, so the top bucket reads as "N+". */
export const MAX_RUN_DEPTH = 5

/** RIVAL-SIDE SAMPLING CADENCE: the cohort's derived condition is read every Nth week PLUS every
 *  week the kid actually takes the court (the "who did she meet, and how tired were they" read).
 *  The engine derives the same map once per tick, so sampling every single week would roughly
 *  double the cohort half of the tick cost for a number that moves slowly – a 4-week cadence over a
 *  208w career is still 52 field-wide samples per seed, i.e. 1560 per cell. */
export const RIVAL_SAMPLE_EVERY = 4

/** Every expense-side event category (the income side is parent contribution / sponsor /
 *  interest). Kept as a local list so the fatigue bench never imports econ-bench – that module
 *  runs its own CLI on import. */
export const EXPENSE_CATEGORIES: readonly WorldEventCategory[] = [
  'coaching',
  'travel',
  'entry',
  'gear',
  'stringing',
  'physio',
  'vacation',
  'practice',
  'other',
]

/** A zeroed per-tier counter (the entries-by-tier economy split). */
export function zeroByTier(): Record<TierId, number> {
  return Object.fromEntries(TIER_LADDER.map((t) => [t, 0])) as Record<TierId, number>
}

// --- matrix -------------------------------------------------------------------

export interface Profile {
  label: string
  background: FamilyBackground
  coachSetup: CoachSetup
}

export const PROFILES: Profile[] = [
  { label: '8k   · working · self-coached', background: 'working', coachSetup: 'parent' },
  { label: '25k  · middle  · self-coached', background: 'middle', coachSetup: 'parent' },
  { label: '25k  · middle  · hired coach', background: 'middle', coachSetup: 'hired' },
  { label: '120k · wealthy · hired coach', background: 'wealthy', coachSetup: 'hired' },
]

/** The season-planner axis as DATA (the axes stayed unbundled exactly so this could arrive as a
 *  FIELD, never a code fork – owner 25.07). These are now REAL engine mechanics: the bench books
 *  through bookPractice/bookVacation, so every column below is simulated, not projected.
 *
 *  Practice habit on a plannable week: 'never' · 'every' (the grinder's "a match every week")
 *  'alternate' (every other plannable week) · 'fresh' (only at/above practiceMinCondition).
 *  Vacation habit: the RESCUE lever (spec §4b – book when she drops below `rescueBelow`, taking
 *  the cheapest package that returns her above `targetAbove`) plus the scheduled off-season
 *  family week, which the spec makes the natural default for everyone. */
export interface PlannerPolicy {
  practice: 'never' | 'every' | 'alternate' | 'fresh'
  /** 'fresh' mode: only book while condition >= this */
  practiceMinCondition: number
  /** «+ тренер на игру» – the coach rides along (50% of a session) */
  withCoach: boolean
  /** book a rescue vacation when condition falls below this; null = never books one */
  rescueBelow: number | null
  /** the rescue takes the CHEAPEST package that returns her to at least this condition (the
   *  shipped `recommendVacationPackage` rule, with this as its target) */
  targetAbove: number
  /** the scheduled off-season family week (package id), or null to skip it */
  offSeasonPackageId: string | null
  /** prudence: never spend more than this share of current funds on one package. Without it a
   *  rescue happily buys the elite programme the week before the family goes broke, which tells
   *  us nothing about the price ladder. */
  maxSpendShare: number
}

/** A load-management policy as pure DATA. */
export interface Policy {
  id: string
  label: string
  plan: WeekPlan
  /** physio toggle: 'on'/'off' force it; 'default' keeps the game default (ON iff hired coach). */
  physio: 'on' | 'off' | 'default'
  /** skip entry while condition < tier availability floor + this margin;
   *  null = enter regardless of the fatigue caution (the enter-everything rule). */
  entryConditionMargin: number | null
  /** the season-planner habit (real bookings since the planner slice landed) */
  planner: PlannerPolicy
}

/** No planning at all – the pre-planner behaviour, and the grid's neutral default. */
export const NO_PLANNER: PlannerPolicy = {
  practice: 'never',
  practiceMinCondition: 100,
  withCoach: false,
  rescueBelow: null,
  targetAbove: 85,
  offSeasonPackageId: null,
  maxSpendShare: 0.2,
}

/** The three HEADLINE policies of the spec (run at 30 seeds over all three horizons). Since the
 *  season-planner slice landed they also carry a PLANNER habit, chosen to be the three honest
 *  archetypes the owner described: the grinder takes every match on offer and never rests; the
 *  default player alternates and takes the natural family week plus a late rescue; the careful
 *  parent only plays friendlies while she is fresh and rescues early. */
export const POLICIES: Policy[] = [
  {
    id: 'grinder',
    label: 'grinder 85/15 enter-all',
    plan: WEEK_PLAN_PRESETS.grind,
    physio: 'default',
    entryConditionMargin: null,
    planner: {
      ...NO_PLANNER,
      practice: 'every', // ignores the guardrail caution exactly like it ignores the fatigue one
    },
  },
  {
    id: 'balanced',
    label: 'balanced 75/25 enter-all',
    plan: WEEK_PLAN_PRESETS.balanced,
    physio: 'default',
    entryConditionMargin: null,
    planner: {
      ...NO_PLANNER,
      practice: 'alternate',
      // the prompt's OWN threshold – tracks the knob, so a re-tune of the offer band re-tunes the
      // default player's habit with it (Wave-2 widened it 65 → 80). The policy acts strictly
      // BELOW the value while the card offers at-or-below: a one-point difference, deliberately
      // left alone so `rescueBelow` keeps meaning what its name says.
      rescueBelow: ECONOMY.practice.rescueCondition,
      targetAbove: ECONOMY.practice.rescueTargetCondition,
      offSeasonPackageId: 'seaside',
    },
  },
  {
    id: 'careful',
    label: 'careful 60/40 physio floor+10',
    plan: WEEK_PLAN_PRESETS.light,
    physio: 'on',
    entryConditionMargin: 10,
    planner: {
      ...NO_PLANNER,
      practice: 'fresh',
      practiceMinCondition: 80,
      // acts on the strain chip as soon as it lights up. Since Wave-2 widened the offer band to
      // 80 the prompt fires at exactly the level this parent already self-imposed – she still
      // aims HIGHER than the prompt does (targetAbove 90 vs the knob's 85).
      rescueBelow: ECONOMY.practice.rescueCondition,
      targetAbove: 90,
      offSeasonPackageId: 'seaside',
    },
  },
]

// --- factorial grid (owner 25.07 scope extension: unbundle the axes) -------------
// plan {85/15, 75/25, 60/40} × entry {enter-all, floor-respecting} × physio {on, off}
// = 12 cells per profile, run at GRID_HORIZON_WEEKS with GRID_SEEDS seeds (reduced from 30
// to keep the full bench under a minute – the seed count is logged in the output).

export const GRID_PLANS: { id: string; plan: WeekPlan }[] = [
  { id: '85/15', plan: WEEK_PLAN_PRESETS.grind },
  { id: '75/25', plan: WEEK_PLAN_PRESETS.balanced },
  { id: '60/40', plan: WEEK_PLAN_PRESETS.light },
]
export const GRID_ENTRIES: { id: string; margin: number | null }[] = [
  { id: 'all', margin: null },
  { id: 'floor+10', margin: 10 },
]
export const GRID_PHYSIO: ('on' | 'off')[] = ['on', 'off']
export const GRID_SEEDS = 10
export const GRID_HORIZON_WEEKS = 104

/** The 12 unbundled grid policies, built from the axis tables above. The planner is OFF here on
 *  purpose: this grid isolates plan × entry × physio. The planner has its own grid below. */
export function gridPolicies(): Policy[] {
  const out: Policy[] = []
  for (const p of GRID_PLANS) {
    for (const e of GRID_ENTRIES) {
      for (const ph of GRID_PHYSIO) {
        out.push({
          id: `${p.id}·${e.id}·${ph}`,
          label: `${p.id} ${e.id} physio-${ph}`,
          plan: p.plan,
          physio: ph,
          entryConditionMargin: e.margin,
          planner: { ...NO_PLANNER },
        })
      }
    }
  }
  return out
}

// --- planner grid (season-planner slice: the axis the PROJ layer used to guess at) ----------
// practice {never, alternate, every} × vacation {none, rescue-65} = 6 cells per profile, on the
// DEFAULT player (75/25, enter-all, physio default) so the planner axis is read in isolation.
// This replaces the deleted PROJ arithmetic: same questions, real mechanics.

export const GRID_PRACTICE: { id: string; practice: PlannerPolicy['practice'] }[] = [
  { id: 'no-practice', practice: 'never' },
  { id: 'alternate', practice: 'alternate' },
  { id: 'every-week', practice: 'every' },
]
export const GRID_VACATION: { id: string; rescueBelow: number | null; offSeasonPackageId: string | null }[] = [
  { id: 'no-vac', rescueBelow: null, offSeasonPackageId: null },
  // "takes the offer whenever the game makes it" – the threshold TRACKS the shipped knob (it was
  // hard-coded 65 until Wave-2 widened the band; a grid measuring a rule the game no longer has
  // measures nothing).
  { id: 'rescue+sea', rescueBelow: ECONOMY.practice.rescueCondition, offSeasonPackageId: 'seaside' },
]

/** The 6 planner-grid policies (all on the balanced plan/entry/physio baseline). */
export function plannerPolicies(): Policy[] {
  const out: Policy[] = []
  for (const pr of GRID_PRACTICE) {
    for (const va of GRID_VACATION) {
      out.push({
        id: `${pr.id}·${va.id}`,
        label: `75/25 ${pr.id} ${va.id}`,
        plan: WEEK_PLAN_PRESETS.balanced,
        physio: 'default',
        entryConditionMargin: null,
        planner: {
          ...NO_PLANNER,
          practice: pr.practice,
          rescueBelow: va.rescueBelow,
          targetAbove: 85,
          offSeasonPackageId: va.offSeasonPackageId,
        },
      })
    }
  }
  return out
}

// --- scenarios --------------------------------------------------------------------
// V2.1 SHIPPED 25.07 (owner "V2 хорош" + "все чуть ниже к концу сезона"): the engine defaults
// are now recoveryBase 1 + matchWeekRecoveryBase 0 + physio conditionBonusPerWeek 1, so
// BASELINE runs the shipped knobs unpatched. Two reference scenarios patch the LIVE ECONOMY
// object around their run (always restored, finally-guarded):
//   v2     – the intermediate candidate (recoveryBase 2, the state between the two flips),
//            headline-only, kept so the V2.1 decision stays auditable in one output;
//   legacy – the original round-9 values (recoveryBase 2, matchWeekRecoveryBase 2, physio
//            bonus 2), headline-only audit trail.
// Patching the live object keeps every feedback loop real: coupling curve, caution/floor
// gates, injury tau, entry starvation. `as const` is compile-time only – the runtime object is
// mutable, and the typed views below keep the patch honest.

export interface Scenario {
  id: 'baseline' | 'v2' | 'legacy' | 'runfat-off' | 'runfat-a' | 'runfat-b' | 'runfat-c' | 'runfat-d'
  label: string
  patch: {
    matchWeekRecoveryBase?: number
    physioConditionBonusPerWeek?: number
    recoveryBase?: number
    /** CUMULATIVE RUN FATIGUE: the extra drain per match-within-run (index 0 = her first match). */
    runFatigueLadder?: number[]
  }
  /** run the factorial grid (plan × entry × physio) inside this scenario's section */
  grid: boolean
  /** run the PLANNER grid (practice × vacation) inside this scenario's section */
  plannerGrid: boolean
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'baseline',
    label: 'BASELINE – shipped knobs (V2.1: recoveryBase 1, no base recovery on match weeks, physio bonus 1)',
    patch: {},
    grid: true,
    plannerGrid: true,
  },
  {
    id: 'v2',
    label: 'V2 – previous candidate (recoveryBase 2; the state before the V2.1 flip)',
    patch: { recoveryBase: 2 },
    grid: false,
    plannerGrid: false,
  },
  {
    id: 'legacy',
    label: 'LEGACY – pre-V2 round-9 values (recoveryBase 2, matchWeekRecoveryBase 2, physio bonus 2)',
    patch: { recoveryBase: 2, matchWeekRecoveryBase: 2, physioConditionBonusPerWeek: 2 },
    grid: false,
    plannerGrid: false,
  },
]

// --- run-fatigue ladder scenarios (owner idea 26.07) --------------------------------
// "Matches at a tournament run every day or every other day, so each SUBSEQUENT match should cost
// EXTRA condition" – the owner proposed four ladders of extra drain by match-within-run and asked
// the bench to price all four. They are OPT-IN (never part of the default sweep): run them with
//   npm run bench:fatigue -- --scenario runfat-off,runfat-a,runfat-b,runfat-c,runfat-d
// and the RUN-FATIGUE LADDER block at the end tables them against each other. runfat-off is the
// PRE-LADDER engine (the reference "what it cost before the idea"); runfat-c is the shipped
// default, so it must reproduce BASELINE exactly – the tests pin that.
export const RUNFAT_LADDERS = {
  off: [0], // no cumulative fatigue at all – the pre-idea engine
  a: [0, 1, 2, 3, 4], // +1,+2,+3,+4 = 10 over a five-match run (steepest)
  b: [0, 1, 1, 2, 4], // +1,+1,+2,+4 = 8 (flat then a brutal final)
  c: [0, 1, 1, 2, 2], // +1,+1,+2,+2 = 6 (SHIPPED default)
  d: [0, 1, 1, 1, 1], // +1 every subsequent match = 4 (flattest)
} as Record<string, number[]>

/** The five run-fatigue sections. Headline-only (no grids): the question is the LADDER, and the
 *  factorial/planner grids would multiply a five-scenario sweep by ~5x runtime for axes this
 *  change does not touch. */
export const RUNFAT_SCENARIOS: Scenario[] = [
  {
    id: 'runfat-off',
    label: 'RUNFAT-OFF – no cumulative run fatigue (the pre-idea engine; the comparison reference)',
    patch: { runFatigueLadder: RUNFAT_LADDERS.off },
    grid: false,
    plannerGrid: false,
  },
  {
    id: 'runfat-a',
    label: 'RUNFAT-A – ladder +1,+2,+3,+4 (10 over a five-match run)',
    patch: { runFatigueLadder: RUNFAT_LADDERS.a },
    grid: false,
    plannerGrid: false,
  },
  {
    id: 'runfat-b',
    label: 'RUNFAT-B – ladder +1,+1,+2,+4 (8 over a five-match run)',
    patch: { runFatigueLadder: RUNFAT_LADDERS.b },
    grid: false,
    plannerGrid: false,
  },
  {
    id: 'runfat-c',
    label: 'RUNFAT-C – ladder +1,+1,+2,+2 (6) – the SHIPPED default, so identical to BASELINE',
    patch: { runFatigueLadder: RUNFAT_LADDERS.c },
    grid: false,
    plannerGrid: false,
  },
  {
    id: 'runfat-d',
    label: 'RUNFAT-D – ladder +1,+1,+1,+1 (4 over a five-match run)',
    patch: { runFatigueLadder: RUNFAT_LADDERS.d },
    grid: false,
    plannerGrid: false,
  },
]

/** Every scenario the CLI can select: the default sweep plus the opt-in ladder sections. */
export const ALL_SCENARIOS: Scenario[] = [...SCENARIOS, ...RUNFAT_SCENARIOS]

type MutableConditionKnobs = { matchWeekRecoveryBase: number; recoveryBase: number; runFatigueLadder: number[] }
type MutablePhysioKnobs = { conditionBonusPerWeek: number }

/** Run `fn` with the scenario's ECONOMY patch applied, ALWAYS restoring the shipped values
 *  (finally), so scenarios can never leak into each other, the tests, or a later import. */
export function withScenario<T>(scenario: Scenario, fn: () => T): T {
  const cond = ECONOMY.condition as unknown as MutableConditionKnobs
  const phys = ECONOMY.physio as unknown as MutablePhysioKnobs
  const savedMatchBase = cond.matchWeekRecoveryBase
  const savedRecoveryBase = cond.recoveryBase
  const savedPhysioBonus = phys.conditionBonusPerWeek
  // the ladder is an ARRAY knob: keep the shipped instance itself, and hand the patch a COPY,
  // so nothing a scenario does can mutate the engine's default in place.
  const savedLadder = cond.runFatigueLadder
  try {
    if (scenario.patch.matchWeekRecoveryBase !== undefined) cond.matchWeekRecoveryBase = scenario.patch.matchWeekRecoveryBase
    if (scenario.patch.recoveryBase !== undefined) cond.recoveryBase = scenario.patch.recoveryBase
    if (scenario.patch.physioConditionBonusPerWeek !== undefined) phys.conditionBonusPerWeek = scenario.patch.physioConditionBonusPerWeek
    if (scenario.patch.runFatigueLadder !== undefined) cond.runFatigueLadder = [...scenario.patch.runFatigueLadder]
    return fn()
  } finally {
    cond.matchWeekRecoveryBase = savedMatchBase
    cond.recoveryBase = savedRecoveryBase
    phys.conditionBonusPerWeek = savedPhysioBonus
    cond.runFatigueLadder = savedLadder
  }
}

export interface FatigueHorizon {
  label: string
  weeks: number
  seasons: number
}

export const FATIGUE_HORIZONS: FatigueHorizon[] = [
  { label: '52w (one season)', weeks: 52, seasons: 1 },
  { label: '104w (14→16)', weeks: 104, seasons: 2 },
  { label: '208w (14→18)', weeks: 208, seasons: 4 },
]

// --- career simulation ---------------------------------------------------------

/** Open a deterministic career for a profile+policy+index. The seed excludes policy AND coach
 *  setup on purpose (see the header: paired seeds). The plan preset and the physio toggle are
 *  the two pre-tick state choices the UI exposes (setPlan / setPhysio); setting them here is a
 *  player action, not an engine change. */
export function openFatigueCareer(
  profile: Profile,
  policy: Policy,
  index: number,
): { world: WorldState; rng: Rng; seed: string } {
  const seed = `fatigue-${profile.background}-${index}`
  const playerProfile: PlayerProfile = {
    ...DEFAULT_PROFILE,
    background: profile.background,
    coachSetup: profile.coachSetup,
  }
  const world = createWorld(seed, playerProfile)
  world.plan = { ...policy.plan }
  if (policy.physio === 'on') world.physioActive = true
  else if (policy.physio === 'off') world.physioActive = false
  const rng = rngFromSeed(world.seed)
  return { world, rng, seed }
}

/** Everything observed in one bench week – the raw material for the metrics AND the tests'
 *  independent condition-trace recomputation. */
export interface WeekFacts {
  week: number
  /** post-week condition: after accrueCondition AND after any committed run's strain. */
  condition: number
  /** she is out injured as the week closes. */
  injured: boolean
  /** a NEW injury landed this week (severity + rolled weeks out), else null. */
  injuryOnset: { severity: InjurySeverity; weeksOut: number } | null
  /** the kid actually competed (a shadow run was computed and committed). */
  played: boolean
  tierPlayed: TierId | null
  /** raw kid-match scorelines of the committed run, in round order ('' = defensive no-score). */
  matchScores: string[]
  /** the committed run's total condition toll (engine tournamentRunStrain: per-match drains +
   *  the cumulative run-fatigue ladder) – 0 on non-play weeks.
   *  Carried so the projection layer can rebuild traces without re-deriving scores. */
  strain: number
  wins: number
  losses: number
  /** an entered event fell on an injured week – fee forfeited, no run. */
  walkover: boolean
  /** entries committed THIS week while condition was below the tier's availability floor. */
  cautionEntries: number
  entriesCommitted: number
  /** the TIERS entered this week, in commit order – the economy read of a load-management shift
   *  (a heavier body cost should show up as fewer / cheaper events, not only as lower condition). */
  entryTiers: TierId[]
  /** net travel and entry-fee spend this week (a skip refunds travel under the same category, so
   *  netting is what the family really parted with). */
  travelSpendCents: number
  entryFeeSpendCents: number
  /** net spend across EVERY expense category this week (coaching, travel, entry, gear, stringing,
   *  physio, vacation, practice, other) – the wallet side of the ladder. */
  totalSpendCents: number
  /** family funds as the week closes – the survival (never-negative) tracker's input. */
  fundsCents: number
  /** THE DOCTOR'S VETO (Wave-2): entries the policy WANTED this week – ranking-eligible,
   *  affordable, inside the commit window – that the medical floor hard-refused. The
   *  "does the new gate ever fire, and for whom?" counter. */
  medicalBlocks: number
  /** THE DOCTOR ON ARRIVAL (owner 26.07): an entry that reached its PLAY week under the medical
   *  floor and was withdrawn there – no travel, no run, 0 points, fee forfeited. Counted SEPARATELY
   *  from medicalBlocks because the two measure opposite ends of the same gate: a block is a trip
   *  the family never booked, a withdrawal is a trip they had already paid for. A withdrawal is the
   *  expensive one, and it is the number that says whether the arrival check earns its keep. */
  medicalWithdrawal: boolean
  /** she played inside [medicalFloor, medicalWarningCeiling) and the doctor's warning beat fired –
   *  the "does the band actually get used, or is it dead copy?" counter. */
  medicalWarnings: number
  /** the week closed under ECONOMY.availability.medicalFloor (the pathological zone). */
  belowMedicalFloor: boolean
  /** physio/medical cents billed this week (retainer, rehab, onset scans). */
  physioSpendCents: number
  /** season planner: she played a booked FRIENDLY this week (a practice match resolved). */
  practiced: boolean
  /** the friendly's scoreline, so the tests can re-derive the drain independently ('' = none). */
  practiceScore: string
  /** the vacation package that RESOLVED this week (its condition gain landed), or null. */
  vacationResolvedId: string | null
  /** the vacation package BOOKED this week (for next week) – the sale, i.e. where money moved. */
  vacationBookedId: string | null
  /** court rentals (+ coach) booked THIS week, net of any refund the same week. */
  practiceSpendCents: number
  /** vacation packages booked THIS week, net of refunds. */
  vacationSpendCents: number
  /** bookings this week made while the practice GUARDRAIL was cautioning (tired / 3rd week in a
   *  row) – the "does the caution actually fire?" counter. */
  cautionedPracticeBookings: number
  /** weeks where the RESCUE condition held and a booking was actually taken. */
  rescueBookings: number
  /** weekly coaching/training bill in cents (the planFactor-scaled base cost) – the money side
   *  of the train slider, so the grid can show the effort↔wallet↔condition triangle. */
  coachingSpendCents: number
  /** THE RIVAL-SIDE READ (the shared-ladder proof, owner 26.07). The cumulative run-fatigue ladder
   *  lives in `tournamentRunStrain`, which the COHORT's ledger reconstruction calls as well as the
   *  kid's finalizeTournament – so a steeper ladder must tire her opponents too. A bench that only
   *  reports kid-side numbers cannot tell a working shared ladder from a kid-only one (that was
   *  exactly the module-load caching bug: the `--scenario runfat-*` switch moved only the kid).
   *  `null` on a week that was not sampled (see RIVAL_SAMPLE_EVERY). */
  rival: {
    /** mean derived condition over the WHOLE cohort (a player with no rows in the fatigue window
     *  is fresh, exactly as `rivalField` treats a missing entry). */
    mean: number
    /** share of the cohort below `matchStrengthKnee` – i.e. arriving already weakened, since the
     *  coupling curve only bites below the knee. */
    pctBelowKnee: number
    /** this was one of HER play weeks (the field she actually met), not just a calendar sample. */
    playWeek: boolean
  } | null
}

/** The cohort's derived condition at `week`, summarised. Reads `rivalConditions` – the same pure
 *  function the engine calls once per tick – so this is a MEASUREMENT of engine state, never a
 *  second implementation of it. Zero RNG draws, zero writes. */
export function sampleCohortCondition(
  world: WorldState,
  week: number,
  playWeek: boolean,
): { mean: number; pctBelowKnee: number; playWeek: boolean } {
  const knee = ECONOMY.condition.matchStrengthKnee
  const derived = rivalConditions(world.results, week)
  let sum = 0
  let below = 0
  for (const p of world.cohort) {
    const c = derived.get(p.id) ?? ECONOMY.condition.max
    sum += c
    if (c < knee) below++
  }
  const n = world.cohort.length
  return { mean: n === 0 ? 0 : sum / n, pctBelowKnee: n === 0 ? 0 : (100 * below) / n, playWeek }
}

/** The planner's decision for NEXT week (the only week a player can book – the engine refuses the
 *  current one). Pure policy on top of the REAL engine commands: bookVacation / bookPractice both
 *  throw on a week that is not plannable (exam block, off-season for a friendly, an entered
 *  tournament, an existing booking, injury, no funds), which is exactly the set of weeks the UI
 *  would not offer – so a failed attempt means "the option was not on the table", never a bug.
 *
 *  Returns what it committed, for the metrics. */
function planNextWeek(
  world: WorldState,
  policy: Policy,
  state: { practiceEligibleIdx: number; seaBookedYears: Set<number> },
): { practiceBooked: boolean; cautioned: boolean; rescued: boolean; vacationBooked: string | null } {
  const p = policy.planner
  const target = world.week + 1
  const out = { practiceBooked: false, cautioned: false, rescued: false, vacationBooked: null as string | null }
  if (world.injury !== null) return out // rehab weeks are nobody's to plan

  const budgetCents = Math.floor(world.fundsCents * p.maxSpendShare)
  const priceOf = (id: string) => vacationPriceCents(world.seed, target, id, world.profile.background)
  /** THE shared pre-highlight rule (economy.ts): the cheapest package sufficient for her CURRENT
   *  condition, inside the prudence budget, falling back to the deepest reset she can afford. The
   *  bench used to carry its own copy of this rule – it now measures the one the UI ships. */
  const pickPackage = (above: number): string | null =>
    recommendVacationPackage({
      seed: world.seed,
      week: target,
      background: world.profile.background,
      condition: world.condition,
      fundsCents: world.fundsCents,
      budgetCents,
      targetCondition: above,
    })

  // 1. the scheduled off-season family week (the spec's natural default for everyone)
  const year = Math.floor(target / WEEKS_PER_YEAR)
  const targetOffSeason = target % WEEKS_PER_YEAR >= WEEKS_PER_YEAR - OFF_SEASON_WEEKS
  if (p.offSeasonPackageId && targetOffSeason && !state.seaBookedYears.has(year)) {
    const id = priceOf(p.offSeasonPackageId) <= budgetCents ? p.offSeasonPackageId : pickPackage(0)
    if (id) {
      try {
        bookVacation(world, target, id)
        state.seaBookedYears.add(year)
        out.vacationBooked = id
        return out
      } catch {
        /* not plannable – nothing was offered */
      }
    }
  }

  // 2. the RESCUE lever (spec §4b): she is low, so the game offers a week away.
  if (p.rescueBelow !== null && world.condition < p.rescueBelow) {
    const id = pickPackage(p.targetAbove)
    if (id) {
      try {
        bookVacation(world, target, id)
        out.vacationBooked = id
        out.rescued = true
        return out
      } catch {
        /* not plannable */
      }
    }
  }

  // 3. the practice habit. The GUARDRAIL is a caution, never a block – these policies push
  //    through it on purpose (that is what the bench is measuring).
  if (p.practice === 'never') return out
  const wants =
    p.practice === 'every' ||
    (p.practice === 'alternate' && state.practiceEligibleIdx % 2 === 0) ||
    (p.practice === 'fresh' && world.condition >= p.practiceMinCondition)
  // Count the attempt on the alternating cursor only when the week was actually offerable, so a
  // string of exam/off-season weeks can't silently flip the parity.
  const cautioned =
    practiceCaution({
      condition: world.condition,
      practiceWeeks: world.practices.map((x) => x.week),
      week: target,
    }).level === 'caution'
  if (wants) {
    try {
      bookPractice(world, target, p.withCoach)
      out.practiceBooked = true
      out.cautioned = cautioned
      state.practiceEligibleIdx++
    } catch {
      /* not plannable – no cursor movement */
    }
  } else {
    state.practiceEligibleIdx++
  }
  return out
}

/** Advance ONE bench week: the planner's booking for next week, policy-gated entries, tick, commit
 *  any spawned run (skip+close – the same fast-forward the econ bench uses), then read the week's
 *  facts off the world. Shared by runFatigueCareer and the tests so the policy lives in exactly
 *  one place. `plannerState` carries the alternating cursor + the once-a-year off-season flag
 *  across weeks; pass a fresh object per career. */
export function stepFatigueWeek(
  world: WorldState,
  rng: Rng,
  policy: Policy,
  plannerState: { practiceEligibleIdx: number; seaBookedYears: Set<number> } = {
    practiceEligibleIdx: 0,
    seaBookedYears: new Set(),
  },
): WeekFacts {
  let cautionEntries = 0
  let entriesCommitted = 0
  let medicalBlocks = 0
  const entryTiers: TierId[] = []
  const firstPlannerEventId = world.nextEventId
  const planned = planNextWeek(world, policy, plannerState)
  // Entry rule = econ-bench policy v3 (ranking-eligible + affordable, committed near the
  // deadline, HARD blocks respected) + the careful policy's condition floor. The fatigue
  // 'caution' level is deliberately IGNORED by grinder/balanced – that is their defining trait.
  for (const e of world.season) {
    if (world.entries.includes(e.id)) continue
    if (world.week > e.deadlineWeek) continue
    if (e.deadlineWeek - world.week > ENTRY_LOOKAHEAD) continue
    // Ladder-up: the calendar stacks tiers on a week now, and she can only play one of them
    // (enterEvent enforces it). The season list is already sorted strongest-tier-first within a
    // week (buildSeason), so taking the first eligible one IS "the biggest event she qualifies for".
    if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
    if (!isTierEligible(e.tier, kidPoints(world))) continue
    const avail = availabilityStatus(world, e)
    if (avail.level === 'blocked') {
      // injured / exam blackout / the doctor's veto – enterEvent would throw. Count ONLY the
      // veto, and only when she could otherwise have paid for the trip: that is a tournament the
      // policy really lost to the new gate, not one it was never going to enter.
      if (avail.reason === 'medical' && world.fundsCents >= TIERS[e.tier].entryFeeCents + e.travelCostCents) {
        medicalBlocks++
      }
      continue
    }
    if (
      policy.entryConditionMargin !== null &&
      world.condition < ECONOMY.availability.minConditionToEnter[e.tier] + policy.entryConditionMargin
    ) {
      continue // careful: too tired – rest until recovered
    }
    const cost = TIERS[e.tier].entryFeeCents + e.travelCostCents
    if (world.fundsCents < cost) continue
    if (avail.level === 'caution') cautionEntries++ // entered below the tier floor – the tough-parent choice
    enterEvent(world, e.id)
    entriesCommitted++
    entryTiers.push(e.tier)
  }

  // RIVAL-SIDE SAMPLE, taken BEFORE the tick and at week+1 on purpose: `tickWeek` increments the
  // week and then derives `rivalConditions(world.results, world.week)` (world.ts, step 1d) before
  // any of the week's own rows are appended – and nothing between the entry loop and the tick
  // touches `world.results`. So this call reproduces the engine's OWN fatigue map for the week it is
  // about to play, byte for byte, rather than a post-hoc approximation of it.
  const nextWeek = world.week + 1
  const kidPlaysNextWeek = world.season.some((e) => e.week === nextWeek && world.entries.includes(e.id))
  const rival =
    kidPlaysNextWeek || nextWeek % RIVAL_SAMPLE_EVERY === 0
      ? sampleCohortCondition(world, nextWeek, kidPlaysNextWeek)
      : null

  tickWeek(world, rng)

  // Commit any spawned run in-week (reveal-flow fast-forward). Capture the kid's matches BEFORE
  // closing: scores/tier feed the strain accounting and the tests' formula spot-check.
  let played = false
  let tierPlayed: TierId | null = null
  let wins = 0
  let losses = 0
  let strain = 0
  const matchScores: string[] = []
  const p = world.pendingTournament
  if (p) {
    played = true
    tierPlayed = world.season.find((e) => e.id === p.eventId)?.tier ?? null
    const kidMatches: { score?: string }[] = []
    for (const m of p.result.matches) {
      if (m.aId !== KID_ID && m.bId !== KID_ID) continue
      matchScores.push(m.score ?? '')
      kidMatches.push({ score: m.score })
      if (m.winnerId === KID_ID) wins++
      else losses++
    }
    // The run's toll the way the engine charges it: per-match drains PLUS the cumulative
    // run-fatigue ladder, which is order-sensitive – so the whole run goes in at once
    // (summing matchDrain here would silently drop the ladder).
    if (tierPlayed !== null) strain = tournamentRunStrain(tierPlayed, kidMatches)
    skipTournament(world)
    closeTournament(world)
  }

  // This week's fresh events (ids are monotonic; new ones are never pruned within their own
  // week) carry the walkover marker, every physio/medical bill AND the planner's line items –
  // the window opens at the BOOKING phase, so a rental refunded the same week nets to zero.
  const newEvents = world.events.filter((ev) => ev.id >= firstPlannerEventId)
  const walkover = newEvents.some((ev) => ev.type === 'injury' && ev.text.startsWith('Walkover'))
  // The two arrival-check beats, read off the feed the same way the walkover is (the engine emits
  // exactly one of them per play week, so a substring match is a faithful counter).
  const medicalWithdrawal = newEvents.some((ev) => ev.type === 'injury' && ev.text.startsWith('Withdrawn from the'))
  const medicalWarnings = newEvents.filter((ev) => ev.type === 'info' && ev.text.startsWith("Doctor's warning")).length
  const physioSpendCents = newEvents
    .filter((ev) => ev.category === 'physio' && (ev.amountCents ?? 0) < 0)
    .reduce((s, ev) => s - (ev.amountCents ?? 0), 0)
  const coachingSpendCents = newEvents
    .filter((ev) => ev.category === 'coaching' && (ev.amountCents ?? 0) < 0)
    .reduce((s, ev) => s - (ev.amountCents ?? 0), 0)
  // Planner spend nets refunds (a cancelled/injury-refunded booking is credited under the SAME
  // category, so the sum is what the family really parted with). The same netting gives the
  // ECONOMY read its travel / entry-fee / total-spend columns (a skipped trip refunds travel
  // under the 'travel' category, and that is money the family kept).
  const netOf = (cat: WorldEventCategory) =>
    -newEvents.filter((ev) => ev.category === cat).reduce((s, ev) => s + (ev.amountCents ?? 0), 0)
  const totalSpendCents = EXPENSE_CATEGORIES.reduce((s, cat) => s + netOf(cat), 0)
  const friendly = newEvents.find((ev) => ev.friendly === true)
  // Bookings survive their week for a short trailing window, so the one that just resolved is
  // still on the world – read the engine's state, not the policy's intent.
  const resolvedVacationId = world.vacations.find((v) => v.week === world.week)?.packageId ?? null

  const injuryOnset =
    world.injury !== null && world.injury.sinceWeek === world.week
      ? { severity: world.injury.severity, weeksOut: world.injury.totalWeeks }
      : null

  return {
    week: world.week,
    condition: world.condition,
    injured: world.injury !== null,
    injuryOnset,
    played,
    tierPlayed,
    matchScores,
    strain,
    wins,
    losses,
    walkover,
    cautionEntries,
    entriesCommitted,
    entryTiers,
    travelSpendCents: netOf('travel'),
    entryFeeSpendCents: netOf('entry'),
    totalSpendCents,
    fundsCents: world.fundsCents,
    medicalBlocks,
    medicalWithdrawal,
    medicalWarnings,
    belowMedicalFloor: world.condition < ECONOMY.availability.medicalFloor,
    physioSpendCents,
    coachingSpendCents,
    practiced: friendly !== undefined,
    practiceScore: friendly?.match?.score ?? '',
    vacationResolvedId: resolvedVacationId,
    vacationBookedId: planned.vacationBooked,
    practiceSpendCents: netOf('practice'),
    vacationSpendCents: netOf('vacation'),
    cautionedPracticeBookings: planned.cautioned ? 1 : 0,
    rescueBookings: planned.rescued ? 1 : 0,
    rival,
  }
}

export interface WeeklyPoint {
  week: number
  condition: number
  injured: boolean
  tierPlayed: TierId | null
  matches: number
  /** committed run's condition toll this week (0 = no run) – projection-layer input. */
  strain: number
}

export interface RunResult {
  seed: string
  /** one point per ticked week, in order – the season curve. */
  weekly: WeeklyPoint[]
  meanCondition: number
  /** week counts by condition band (post-week condition). */
  bandLow: number // < 40
  bandMid: number // 40..69
  bandHigh: number // >= 70
  /** weeks pinned at the exact cap/floor – the "rides high"/"death spiral" detectors. */
  weeksAt100: number
  weeksAt0: number
  /** deepest trough of the run. */
  trough: number
  /** condition at each season's WRAP week (week % 52 === 49, the owner's "end of season" –
   *  BEFORE the 3 off-season weeks restore her). The tuning target reads here. */
  endOfSeasonCondition: number[]
  /** condition at each season year's last week (week % 52 === 51, AFTER the off-season
   *  blackout weeks) – how far the built-in 3-week restore got on its own. */
  postOffSeasonCondition: number[]
  injuriesBySeverity: Record<InjurySeverity, number>
  injuriesTotal: number
  /** how many season years of this run saw ≥1 injury ONSET – the real prevalence numerator
   *  (an onset on a year-boundary week counts into the season it interrupts, clamped). */
  seasonsWithInjury: number
  /** weeks that closed with her out injured. */
  weeksInjured: number
  walkovers: number
  cautionEntries: number
  entries: number
  /** ECONOMY side of the load-management calculus: which tiers she actually entered, what the
   *  trips and fees cost, what the family spent in total, and whether it survived the horizon. */
  entriesByTier: Record<TierId, number>
  travelSpendCents: number
  entryFeeSpendCents: number
  totalSpendCents: number
  /** first week the balance went negative, or null – `survived` is exactly its null-ness. */
  weeksToBankrupt: number | null
  survived: boolean
  /** THE DOCTOR'S VETO, both surfaces, counted separately (owner 26.07):
   *   - medicalBlocks       : ENTRIES refused ahead of time by the floor (no money moved);
   *   - medicalWithdrawals  : entries that reached their PLAY week under the floor and were pulled
   *                           there – entry fee already paid and forfeited, travel never charged;
   *   - medicalWarnings     : play weeks inside the warning band, where he talks and she plays.
   *  plus weeks physically spent under the floor (the pathological zone itself). */
  medicalBlocks: number
  medicalWithdrawals: number
  medicalWarnings: number
  weeksBelowMedicalFloor: number
  physioSpendCents: number
  coachingSpendCents: number
  /** season planner (REAL mechanics since the planner slice): friendlies actually played, what
   *  the courts cost, which packages were bought and for how much, and how often the guardrail
   *  caution / the rescue trigger actually fired. */
  practicesPlayed: number
  practiceSpendCents: number
  vacationsByPackage: Record<string, number>
  vacationsTotal: number
  vacationSpendCents: number
  cautionedPracticeBookings: number
  rescueBookings: number
  /** family funds at horizon end – the wallet corner of the effort↔wallet↔condition triangle. */
  endFundsCents: number
  matchesPlayed: number
  wins: number
  losses: number
  /** RUN-DEPTH DISTRIBUTION (the previous sweep's most useful finding: ~half of all runs are a
   *  SINGLE match, which is why the shallow ladder variants were indistinguishable – a one-match run
   *  pays 0 ladder by definition). Index = matches in the committed run, 1..MAX_RUN_DEPTH; index 0
   *  is always 0 (a committed run has at least one match) and the top index absorbs anything deeper.
   *  Σ counts = runsCommitted and Σ (index × count) = matchesPlayed, which the test pins. */
  runDepthCounts: number[]
  /** committed runs over the horizon (a walkover / medical withdrawal / skipped event is NOT one:
   *  it never reaches finalize, so it costs no strain and charges no ladder rung). */
  runsCommitted: number
  /** RIVAL-SIDE (the shared-ladder proof): means over the sampled weeks. `*PlayWeek*` restricts to
   *  the weeks she actually competed – the field she MET rather than the calendar at large. */
  rivalCondMean: number
  rivalPctBelowKnee: number
  rivalSamples: number
  rivalPlayWeekCondMean: number
  rivalPlayWeekPctBelowKnee: number
  rivalPlayWeekSamples: number
  /** best (lowest) dense rank reached while actually ranked (kidPoints > 0) – the same
   *  hasResults guard econ-bench needed against the point-less dense-rank-1 tie. */
  bestRank: number | null
  endRank: number
  endPoints: number
}

/** Run ONE career headless to `horizonWeeks`. Deterministic per (profile, policy, index, horizon). */
export function runFatigueCareer(
  profile: Profile,
  policy: Policy,
  index: number,
  horizonWeeks: number,
): RunResult {
  const { world, rng, seed } = openFatigueCareer(profile, policy, index)

  const weekly: WeeklyPoint[] = []
  const injuriesBySeverity: Record<InjurySeverity, number> = { minor: 0, moderate: 0, major: 0, severe: 0 }
  const endOfSeasonCondition: number[] = []
  const postOffSeasonCondition: number[] = []
  const onsetSeasons = new Set<number>()
  let condSum = 0
  let bandLow = 0
  let bandMid = 0
  let bandHigh = 0
  let weeksAt100 = 0
  let weeksAt0 = 0
  let trough: number = ECONOMY.condition.max
  let weeksInjured = 0
  let walkovers = 0
  let cautionEntries = 0
  let entries = 0
  let medicalBlocks = 0
  let medicalWithdrawals = 0
  let medicalWarnings = 0
  let weeksBelowMedicalFloor = 0
  const entriesByTier = zeroByTier()
  let travelSpendCents = 0
  let entryFeeSpendCents = 0
  let totalSpendCents = 0
  let bankruptWeek: number | null = null
  let physioSpendCents = 0
  let coachingSpendCents = 0
  let wins = 0
  let losses = 0
  let bestRank: number | null = null
  let practicesPlayed = 0
  let practiceSpendCents = 0
  let vacationSpendCents = 0
  let cautionedPracticeBookings = 0
  let rescueBookings = 0
  const vacationsByPackage: Record<string, number> = {}
  const plannerState = { practiceEligibleIdx: 0, seaBookedYears: new Set<number>() }
  const runDepthCounts = new Array<number>(MAX_RUN_DEPTH + 1).fill(0)
  let runsCommitted = 0
  let rivalCondSum = 0
  let rivalBelowSum = 0
  let rivalSamples = 0
  let rivalPlayCondSum = 0
  let rivalPlayBelowSum = 0
  let rivalPlaySamples = 0

  for (let i = 0; i < horizonWeeks; i++) {
    const f = stepFatigueWeek(world, rng, policy, plannerState)
    weekly.push({
      week: f.week,
      condition: f.condition,
      injured: f.injured,
      tierPlayed: f.tierPlayed,
      matches: f.matchScores.length,
      strain: f.strain,
    })
    condSum += f.condition
    if (f.condition < 40) bandLow++
    else if (f.condition < 70) bandMid++
    else bandHigh++
    if (f.condition === ECONOMY.condition.max) weeksAt100++
    if (f.condition === ECONOMY.condition.min) weeksAt0++
    if (f.condition < trough) trough = f.condition
    if (f.injured) weeksInjured++
    if (f.injuryOnset) {
      injuriesBySeverity[f.injuryOnset.severity]++
      onsetSeasons.add(Math.min(Math.floor(f.week / WEEKS_PER_YEAR), horizonWeeks / WEEKS_PER_YEAR - 1))
    }
    if (f.walkover) walkovers++
    // A committed run's DEPTH is the ladder's own index domain: bucket it (anything deeper than the
    // calendar's biggest draw folds into the top bucket, mirroring the ladder's repeat-last rule).
    if (f.matchScores.length > 0) {
      runsCommitted++
      runDepthCounts[Math.min(f.matchScores.length, MAX_RUN_DEPTH)]++
    }
    if (f.rival) {
      rivalCondSum += f.rival.mean
      rivalBelowSum += f.rival.pctBelowKnee
      rivalSamples++
      if (f.rival.playWeek) {
        rivalPlayCondSum += f.rival.mean
        rivalPlayBelowSum += f.rival.pctBelowKnee
        rivalPlaySamples++
      }
    }
    cautionEntries += f.cautionEntries
    entries += f.entriesCommitted
    for (const tier of f.entryTiers) entriesByTier[tier]++
    travelSpendCents += f.travelSpendCents
    entryFeeSpendCents += f.entryFeeSpendCents
    totalSpendCents += f.totalSpendCents
    if (bankruptWeek === null && f.fundsCents < 0) bankruptWeek = f.week
    medicalBlocks += f.medicalBlocks
    if (f.medicalWithdrawal) medicalWithdrawals++
    medicalWarnings += f.medicalWarnings
    if (f.belowMedicalFloor) weeksBelowMedicalFloor++
    physioSpendCents += f.physioSpendCents
    coachingSpendCents += f.coachingSpendCents
    if (f.practiced) practicesPlayed++
    practiceSpendCents += f.practiceSpendCents
    vacationSpendCents += f.vacationSpendCents
    cautionedPracticeBookings += f.cautionedPracticeBookings
    rescueBookings += f.rescueBookings
    if (f.vacationBookedId) vacationsByPackage[f.vacationBookedId] = (vacationsByPackage[f.vacationBookedId] ?? 0) + 1
    wins += f.wins
    losses += f.losses
    if (kidPoints(world) > 0 && (bestRank === null || world.kidRank < bestRank)) bestRank = world.kidRank
    if (world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS) endOfSeasonCondition.push(f.condition)
    if (world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - 1) postOffSeasonCondition.push(f.condition)
  }

  return {
    seed,
    weekly,
    meanCondition: condSum / horizonWeeks,
    bandLow,
    bandMid,
    bandHigh,
    weeksAt100,
    weeksAt0,
    trough,
    endOfSeasonCondition,
    postOffSeasonCondition,
    injuriesBySeverity,
    injuriesTotal: SEVERITIES.reduce((s, sev) => s + injuriesBySeverity[sev], 0),
    seasonsWithInjury: onsetSeasons.size,
    weeksInjured,
    walkovers,
    cautionEntries,
    entries,
    entriesByTier,
    travelSpendCents,
    entryFeeSpendCents,
    totalSpendCents,
    weeksToBankrupt: bankruptWeek,
    survived: bankruptWeek === null,
    medicalBlocks,
    medicalWithdrawals,
    medicalWarnings,
    weeksBelowMedicalFloor,
    physioSpendCents,
    coachingSpendCents,
    practicesPlayed,
    practiceSpendCents,
    vacationsByPackage,
    vacationsTotal: Object.values(vacationsByPackage).reduce((s, n) => s + n, 0),
    vacationSpendCents,
    cautionedPracticeBookings,
    rescueBookings,
    endFundsCents: world.fundsCents,
    matchesPlayed: wins + losses,
    wins,
    losses,
    runDepthCounts,
    runsCommitted,
    rivalCondMean: rivalSamples === 0 ? 0 : rivalCondSum / rivalSamples,
    rivalPctBelowKnee: rivalSamples === 0 ? 0 : rivalBelowSum / rivalSamples,
    rivalSamples,
    rivalPlayWeekCondMean: rivalPlaySamples === 0 ? 0 : rivalPlayCondSum / rivalPlaySamples,
    rivalPlayWeekPctBelowKnee: rivalPlaySamples === 0 ? 0 : rivalPlayBelowSum / rivalPlaySamples,
    rivalPlayWeekSamples: rivalPlaySamples,
    bestRank,
    endRank: world.kidRank,
    endPoints: kidPoints(world),
  }
}

/** All 30 seeds of one (profile, policy, horizon) cell. */
export function runCell(profile: Profile, policy: Policy, horizonWeeks: number, seeds = SEEDS_PER_CELL): RunResult[] {
  const rows: RunResult[] = []
  for (let i = 0; i < seeds; i++) rows.push(runFatigueCareer(profile, policy, i, horizonWeeks))
  return rows
}

// --- stats ----------------------------------------------------------------------

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((s, x) => s + x, 0) / xs.length
}

/** Population standard deviation (the 30 seeds are the whole population of the cell). */
export function stddev(xs: number[]): number {
  if (xs.length === 0) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

export interface CellStats {
  profile: Profile
  policy: Policy
  horizon: FatigueHorizon
  runs: RunResult[]
  meanCond: number
  meanCondSd: number
  /** pooled week shares across all seeds, in percent. */
  pctLow: number
  pctMid: number
  pctHigh: number
  pctAt100: number
  troughMean: number
  troughMin: number
  /** mean condition at each season's WRAP week (wk49 – before the off-season restore). */
  endOfSeasonMean: number[]
  /** mean condition at each season year's last week (wk51 – after the 3 blackout weeks). */
  postOffSeasonMean: number[]
  /** season-end (wk49) values pooled across seeds AND seasons – the tuning-target distribution. */
  endSeasonPooled: { mean: number; sd: number; min: number; max: number }
  injPerSeason: number
  injPerSeasonSd: number
  /** REAL seasonal prevalence: % of (seed × season) years with ≥1 injury onset – the number
   *  the research doc's "juniors 46-54%/season" anchor compares against. */
  prevalencePct: number
  sevPerSeason: Record<InjurySeverity, number>
  weeksLostPerSeason: number
  walkoversPerCareer: number
  cautionPerSeason: number
  /** THE DOCTOR'S VETO, per season, both surfaces kept apart (owner 26.07) – "how often does the
   *  hard gate actually bite, and which end of it?":
   *   - medicalBlocksPerSeason      : ENTRIES refused ahead of time (nothing paid);
   *   - medicalWithdrawalsPerSeason : runs pulled ON THE PLAY WEEK, entry fee already forfeited –
   *                                   the expensive half, and the one the arrival check added;
   *   - medicalWarningsPerSeason    : play weeks inside the warning band (he talks, she plays).
   *  plus the share of weeks physically spent under the floor. */
  medicalBlocksPerSeason: number
  medicalWithdrawalsPerSeason: number
  medicalWarningsPerSeason: number
  pctWeeksBelowMedicalFloor: number
  physioPerSeasonCents: number
  coachingPerSeasonCents: number
  /** season planner, per season: friendlies played, court spend, packages bought + their spend,
   *  guardrail cautions pushed through, rescue bookings taken. */
  practicesPerSeason: number
  practiceSpendPerSeasonCents: number
  vacationsPerSeason: number
  vacationSpendPerSeasonCents: number
  cautionedPracticePerSeason: number
  rescuePerSeason: number
  /** package id -> bookings per season, pooled over the cell's seeds (the price-ladder answer). */
  packagesPerSeason: Record<string, number>
  endFundsMeanCents: number
  endPointsMean: number
  /** pooled kid match-win %: sum wins / sum matches across the cell. */
  winPct: number
  matchesPerSeason: number
  entriesPerSeason: number
  /** mean best rank over the seeds that got ranked at all, + how many did. */
  bestRankMean: number | null
  rankedCount: number
  /** ECONOMY side-effects (the run-fatigue ladder's second question): entries per season split by
   *  tier, the trips/fees they cost, total family spend per season, and the survival rate. */
  entriesByTierPerSeason: Record<TierId, number>
  travelPerSeasonCents: number
  entryFeePerSeasonCents: number
  totalSpendPerSeasonCents: number
  survivalPct: number
  /** mean weekly condition across seeds – the sparkline source (length = horizon weeks). */
  meanWeekly: number[]
  /** RUN-DEPTH DISTRIBUTION pooled over the cell's seeds: percent of committed runs at each depth
   *  (index = matches, 1..MAX_RUN_DEPTH; [0] unused). THE number that decides whether a ladder can
   *  be felt at all – a rung only ever gets charged as often as runs reach that depth. */
  runDepthPct: number[]
  runsPerSeason: number
  meanRunDepth: number
  /** share of committed runs that reach 3+ / 4+ matches – the "deep run" the owner wants FELT. */
  pctRuns3Plus: number
  pctRuns4Plus: number
  /** RIVAL-SIDE, meaned over seeds (see RunResult): the whole-calendar read and the play-week read. */
  rivalCondMean: number
  rivalPctBelowKnee: number
  rivalPlayWeekCondMean: number
  rivalPlayWeekPctBelowKnee: number
}

export function computeCellStats(
  profile: Profile,
  policy: Policy,
  horizon: FatigueHorizon,
  runs: RunResult[],
): CellStats {
  const seasons = horizon.weeks / WEEKS_PER_YEAR
  const totalWeeks = runs.length * horizon.weeks
  const meanWeekly: number[] = []
  for (let w = 0; w < horizon.weeks; w++) meanWeekly.push(mean(runs.map((r) => r.weekly[w].condition)))
  const sevPerSeason = { minor: 0, moderate: 0, major: 0, severe: 0 } as Record<InjurySeverity, number>
  for (const sev of SEVERITIES) sevPerSeason[sev] = mean(runs.map((r) => r.injuriesBySeverity[sev] / seasons))
  const endOfSeasonMean: number[] = []
  const postOffSeasonMean: number[] = []
  for (let s = 0; s < seasons; s++) {
    endOfSeasonMean.push(mean(runs.map((r) => r.endOfSeasonCondition[s])))
    postOffSeasonMean.push(mean(runs.map((r) => r.postOffSeasonCondition[s])))
  }
  const pooledEnds = runs.flatMap((r) => r.endOfSeasonCondition)
  const totalWins = runs.reduce((s, r) => s + r.wins, 0)
  const totalMatches = runs.reduce((s, r) => s + r.matchesPlayed, 0)
  const ranked = runs.filter((r) => r.bestRank !== null)
  // Run depth pooled over the whole cell (counts, not per-seed shares: a seed with 2 runs must not
  // weigh as much as a seed with 20 when the question is "what does a RUN look like").
  const depthCounts = new Array<number>(MAX_RUN_DEPTH + 1).fill(0)
  for (const r of runs) for (let d = 0; d <= MAX_RUN_DEPTH; d++) depthCounts[d] += r.runDepthCounts[d]
  const totalRuns = depthCounts.reduce((s, n) => s + n, 0)
  const depthShare = (from: number) =>
    totalRuns === 0 ? 0 : (100 * depthCounts.slice(from).reduce((s, n) => s + n, 0)) / totalRuns
  return {
    profile,
    policy,
    horizon,
    runs,
    meanCond: mean(runs.map((r) => r.meanCondition)),
    meanCondSd: stddev(runs.map((r) => r.meanCondition)),
    pctLow: (100 * runs.reduce((s, r) => s + r.bandLow, 0)) / totalWeeks,
    pctMid: (100 * runs.reduce((s, r) => s + r.bandMid, 0)) / totalWeeks,
    pctHigh: (100 * runs.reduce((s, r) => s + r.bandHigh, 0)) / totalWeeks,
    pctAt100: (100 * runs.reduce((s, r) => s + r.weeksAt100, 0)) / totalWeeks,
    troughMean: mean(runs.map((r) => r.trough)),
    troughMin: Math.min(...runs.map((r) => r.trough)),
    endOfSeasonMean,
    postOffSeasonMean,
    endSeasonPooled: {
      mean: mean(pooledEnds),
      sd: stddev(pooledEnds),
      min: Math.min(...pooledEnds),
      max: Math.max(...pooledEnds),
    },
    injPerSeason: mean(runs.map((r) => r.injuriesTotal / seasons)),
    injPerSeasonSd: stddev(runs.map((r) => r.injuriesTotal / seasons)),
    prevalencePct: (100 * runs.reduce((s, r) => s + r.seasonsWithInjury, 0)) / (runs.length * seasons),
    sevPerSeason,
    weeksLostPerSeason: mean(runs.map((r) => r.weeksInjured / seasons)),
    walkoversPerCareer: mean(runs.map((r) => r.walkovers)),
    cautionPerSeason: mean(runs.map((r) => r.cautionEntries / seasons)),
    medicalBlocksPerSeason: mean(runs.map((r) => r.medicalBlocks / seasons)),
    medicalWithdrawalsPerSeason: mean(runs.map((r) => r.medicalWithdrawals / seasons)),
    medicalWarningsPerSeason: mean(runs.map((r) => r.medicalWarnings / seasons)),
    pctWeeksBelowMedicalFloor: (100 * runs.reduce((s, r) => s + r.weeksBelowMedicalFloor, 0)) / totalWeeks,
    physioPerSeasonCents: mean(runs.map((r) => r.physioSpendCents / seasons)),
    coachingPerSeasonCents: mean(runs.map((r) => r.coachingSpendCents / seasons)),
    practicesPerSeason: mean(runs.map((r) => r.practicesPlayed / seasons)),
    practiceSpendPerSeasonCents: mean(runs.map((r) => r.practiceSpendCents / seasons)),
    vacationsPerSeason: mean(runs.map((r) => r.vacationsTotal / seasons)),
    vacationSpendPerSeasonCents: mean(runs.map((r) => r.vacationSpendCents / seasons)),
    cautionedPracticePerSeason: mean(runs.map((r) => r.cautionedPracticeBookings / seasons)),
    rescuePerSeason: mean(runs.map((r) => r.rescueBookings / seasons)),
    packagesPerSeason: (() => {
      const pooled: Record<string, number> = {}
      for (const r of runs) {
        for (const [id, n] of Object.entries(r.vacationsByPackage)) pooled[id] = (pooled[id] ?? 0) + n
      }
      for (const id of Object.keys(pooled)) pooled[id] /= runs.length * seasons
      return pooled
    })(),
    endFundsMeanCents: mean(runs.map((r) => r.endFundsCents)),
    endPointsMean: mean(runs.map((r) => r.endPoints)),
    winPct: totalMatches === 0 ? 0 : (100 * totalWins) / totalMatches,
    matchesPerSeason: mean(runs.map((r) => r.matchesPlayed / seasons)),
    entriesPerSeason: mean(runs.map((r) => r.entries / seasons)),
    bestRankMean: ranked.length ? mean(ranked.map((r) => r.bestRank as number)) : null,
    rankedCount: ranked.length,
    entriesByTierPerSeason: Object.fromEntries(
      TIER_LADDER.map((t) => [t, mean(runs.map((r) => r.entriesByTier[t] / seasons))]),
    ) as Record<TierId, number>,
    travelPerSeasonCents: mean(runs.map((r) => r.travelSpendCents / seasons)),
    entryFeePerSeasonCents: mean(runs.map((r) => r.entryFeeSpendCents / seasons)),
    totalSpendPerSeasonCents: mean(runs.map((r) => r.totalSpendCents / seasons)),
    survivalPct: (100 * runs.filter((r) => r.survived).length) / runs.length,
    meanWeekly,
    runDepthPct: depthCounts.map((n) => (totalRuns === 0 ? 0 : (100 * n) / totalRuns)),
    runsPerSeason: mean(runs.map((r) => r.runsCommitted / seasons)),
    meanRunDepth:
      totalRuns === 0 ? 0 : depthCounts.reduce((s, n, d) => s + d * n, 0) / totalRuns,
    pctRuns3Plus: depthShare(3),
    pctRuns4Plus: depthShare(4),
    rivalCondMean: mean(runs.map((r) => r.rivalCondMean)),
    rivalPctBelowKnee: mean(runs.map((r) => r.rivalPctBelowKnee)),
    // Seeds where she never played a single week have no play-week sample; averaging them in as 0
    // would read as "her opponents arrived at condition 0". Restrict to the seeds that HAVE one.
    rivalPlayWeekCondMean: mean(runs.filter((r) => r.rivalPlayWeekSamples > 0).map((r) => r.rivalPlayWeekCondMean)),
    rivalPlayWeekPctBelowKnee: mean(
      runs.filter((r) => r.rivalPlayWeekSamples > 0).map((r) => r.rivalPlayWeekPctBelowKnee),
    ),
  }
}

/** effective physio toggle for a (profile, policy) run – mirrors openFatigueCareer. */
export function effectivePhysio(profile: Profile, policy: Policy): boolean {
  if (policy.physio === 'on') return true
  if (policy.physio === 'off') return false
  return profile.coachSetup === 'hired'
}

// --- rendering -------------------------------------------------------------------

const BLOCKS = '▁▂▃▄▅▆▇█'

/** One condition value (0..100) to one sparkline block. */
export function sparkChar(condition: number): string {
  const idx = Math.min(BLOCKS.length - 1, Math.max(0, Math.floor(condition / (100 / BLOCKS.length))))
  return BLOCKS[idx]
}

/** The cell's mean weekly condition as one 52-char row per season. */
export function sparkRows(meanWeekly: number[]): string[] {
  const rows: string[] = []
  for (let s = 0; s * WEEKS_PER_YEAR < meanWeekly.length; s++) {
    rows.push(
      meanWeekly
        .slice(s * WEEKS_PER_YEAR, (s + 1) * WEEKS_PER_YEAR)
        .map(sparkChar)
        .join(''),
    )
  }
  return rows
}

function padEnd(s: string, w: number): string {
  return s.length >= w ? s : s + ' '.repeat(w - s.length)
}
function pad(s: string, w: number): string {
  return s.length >= w ? s : ' '.repeat(w - s.length) + s
}

const POLICY_W = 31

function tableHeader(): string {
  const cols = [
    ['cond', 6],
    ['±sd', 5],
    ['%<40', 6],
    ['40-69', 6],
    ['≥70', 6],
    ['@100', 6],
    ['low', 8],
    ['inj/s', 7],
    ['mn/mo/mj/sv', 21],
    ['lost/s', 7],
    ['WO/c', 5],
    ['caut/s', 7],
    ['phys$/s', 8],
    ['win%', 6],
    ['mt/s', 6],
    ['ent/s', 6],
    ['bestRk', 7],
  ] as [string, number][]
  return '  ' + padEnd('policy', POLICY_W) + cols.map(([c, w]) => pad(c, w)).join('')
}

function cellRow(c: CellStats): string {
  const sev = SEVERITIES.map((s) => c.sevPerSeason[s].toFixed(2)).join('/')
  const bestRk = c.bestRankMean === null ? '–' : `#${Math.round(c.bestRankMean)}`
  const cells: [string, number][] = [
    [c.meanCond.toFixed(1), 6],
    [c.meanCondSd.toFixed(1), 5],
    [c.pctLow.toFixed(1), 6],
    [c.pctMid.toFixed(1), 6],
    [c.pctHigh.toFixed(1), 6],
    [c.pctAt100.toFixed(1), 6],
    [`${c.troughMean.toFixed(0)}·${c.troughMin}`, 8],
    [c.injPerSeason.toFixed(2), 7],
    [sev, 21],
    [c.weeksLostPerSeason.toFixed(1), 7],
    [c.walkoversPerCareer.toFixed(2), 5],
    [c.cautionPerSeason.toFixed(2), 7],
    [`$${Math.round(c.physioPerSeasonCents / 100)}`, 8],
    [c.winPct.toFixed(1), 6],
    [c.matchesPerSeason.toFixed(1), 6],
    [c.entriesPerSeason.toFixed(1), 6],
    [bestRk, 7],
  ]
  return '  ' + padEnd(c.policy.label, POLICY_W) + cells.map(([s, w]) => pad(s, w)).join('')
}

/** Which packages a cell bought, cheapest-first, as "id n/s" parts. */
function packageParts(c: CellStats): string[] {
  return ECONOMY.vacation.packages
    .filter((p) => (c.packagesPerSeason[p.id] ?? 0) > 0)
    .map((p) => `${p.id} ${c.packagesPerSeason[p.id].toFixed(2)}/s`)
}

/** The season-planner read for one cell: friendlies + their court spend, packages + their spend,
 *  and the two trigger counters (guardrail cautions pushed through, rescue bookings taken). */
function plannerLine(c: CellStats): string {
  const parts = packageParts(c)
  return (
    '  ' +
    padEnd(`planner ${c.policy.id}`, 20) +
    `pract ${c.practicesPerSeason.toFixed(1)}/s ($${Math.round(c.practiceSpendPerSeasonCents / 100)}/s)` +
    ` · vac ${c.vacationsPerSeason.toFixed(2)}/s ($${Math.round(c.vacationSpendPerSeasonCents / 100)}/s)` +
    ` · caution-booked ${c.cautionedPracticePerSeason.toFixed(1)}/s` +
    ` · rescue ${c.rescuePerSeason.toFixed(2)}/s` +
    ` · ${parts.length ? parts.join(' · ') : 'no packages booked'}`
  )
}

/** The per-tier entry split as "local 2.0 · regional 3.1 · …", tiers she never entered omitted. */
function tierSplit(c: CellStats): string {
  const used = TIER_LADDER.filter((t) => c.entriesByTierPerSeason[t] > 0)
  return used.length === 0 ? 'none' : used.map((t) => `${t} ${c.entriesByTierPerSeason[t].toFixed(1)}`).join(' · ')
}

/** The ECONOMY read for one cell (the run-fatigue ladder's side-effect question): how many events
 *  per season and OF WHAT TIER, what the trips + fees cost, total family spend, end funds and the
 *  survival rate. A heavier body cost should show up HERE as fewer / cheaper events. */
function economyLine(c: CellStats): string {
  const dollars = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
  return (
    '  ' +
    padEnd(`economy ${c.policy.id}`, 20) +
    `ent ${c.entriesPerSeason.toFixed(1)}/s (${tierSplit(c)})` +
    ` · travel ${dollars(c.travelPerSeasonCents)}/s · fees ${dollars(c.entryFeePerSeasonCents)}/s` +
    ` · spend ${dollars(c.totalSpendPerSeasonCents)}/s · endFunds ${dollars(c.endFundsMeanCents)}` +
    ` · survived ${c.survivalPct.toFixed(0)}%`
  )
}

/** THE DOCTOR'S VETO per policy, for one profile block. Reports BOTH surfaces of the same floor
 *  separately (owner 26.07): entries it refused ahead of time ("blocked", nothing paid) and runs it
 *  pulled on the PLAY WEEK ("withdrawn", entry fee already forfeited – the expensive half). Plus the
 *  warning band above the floor, where the doctor talks and she plays anyway. The whole point of the
 *  knob is that all three read 0.00 for every non-pathological policy. */
function medicalLine(cells: CellStats[]): string {
  const a = ECONOMY.availability
  return (
    '  ' +
    padEnd(`medical ${a.medicalFloor}/warn ${a.medicalWarningCeiling}`, 20) +
    cells
      .map(
        (c) =>
          `${c.policy.id} ${c.medicalBlocksPerSeason.toFixed(2)} blocked/s + ${c.medicalWithdrawalsPerSeason.toFixed(2)} withdrawn/s` +
          ` · ${c.medicalWarningsPerSeason.toFixed(2)} warned/s (${c.pctWeeksBelowMedicalFloor.toFixed(1)}% of weeks under the floor)`,
      )
      .join(' · ')
  )
}

/** Degeneracy screens the spec asks the report to surface: pinned condition, injury spirals,
 *  unplayable calendars. Returns human-readable findings (empty = nothing degenerate). */
export function degeneracyFindings(c: CellStats): string[] {
  const out: string[] = []
  const pooledAt0 = (100 * c.runs.reduce((s, r) => s + r.weeksAt0, 0)) / (c.runs.length * c.horizon.weeks)
  if (pooledAt0 > 1) out.push(`condition pinned at 0 for ${pooledAt0.toFixed(1)}% of weeks`)
  if (c.pctAt100 > 90) out.push(`condition pinned at 100 for ${c.pctAt100.toFixed(1)}% of weeks`)
  if (c.weeksLostPerSeason > 26) out.push(`injury spiral: ${c.weeksLostPerSeason.toFixed(1)} weeks lost/season`)
  if (c.entriesPerSeason < 1) out.push(`unplayable calendar: ${c.entriesPerSeason.toFixed(1)} entries/season`)
  return out.map((f) => `${c.profile.label.trim()} × ${c.policy.id}: ${f}`)
}

// --- grid rendering ---------------------------------------------------------

const GRID_COLS: [string, number][] = [
  ['plan', 7],
  ['entry', 10],
  ['physio', 7],
  ['cond', 7],
  ['low', 8],
  ['inj/s', 7],
  ['lost/s', 7],
  ['win%', 6],
  ['mt/s', 6],
  ['ent/s', 6],
  ['coach$/s', 9],
  ['phys$/s', 8],
  ['endFunds', 10],
  ['endPts', 7],
  ['bestRk', 7],
]

function gridHeader(): string {
  return '  ' + GRID_COLS.map(([c, w]) => pad(c, w)).join('')
}

function gridRow(planId: string, entryId: string, physio: string, c: CellStats): string {
  const bestRk = c.bestRankMean === null ? '–' : `#${Math.round(c.bestRankMean)}`
  const endFunds = `$${Math.round(c.endFundsMeanCents / 100).toLocaleString('en-US')}`
  const cells = [
    planId,
    entryId,
    physio,
    c.meanCond.toFixed(1),
    `${c.troughMean.toFixed(0)}·${c.troughMin}`,
    c.injPerSeason.toFixed(2),
    c.weeksLostPerSeason.toFixed(1),
    c.winPct.toFixed(1),
    c.matchesPerSeason.toFixed(1),
    c.entriesPerSeason.toFixed(1),
    `$${Math.round(c.coachingPerSeasonCents / 100).toLocaleString('en-US')}`,
    `$${Math.round(c.physioPerSeasonCents / 100)}`,
    endFunds,
    c.endPointsMean.toFixed(0),
    bestRk,
  ]
  return '  ' + cells.map((s, i) => pad(s, GRID_COLS[i][1])).join('')
}

/** Pooled corner-case screens over every grid cell – the owner's "does ANYTHING bite?" read. */
function gridCornerBlock(cells: CellStats[]): string[] {
  const out: string[] = []
  const neverBelowKnee = cells.filter((c) => c.troughMin >= ECONOMY.condition.matchStrengthKnee)
  out.push(
    `  knee (${ECONOMY.condition.matchStrengthKnee}) never crossed in ${neverBelowKnee.length}/${cells.length} cells` +
      ` – the win% coupling is inert there; worst trough anywhere = ${Math.min(...cells.map((c) => c.troughMin))}.`,
  )
  const dipped = cells.filter((c) => c.troughMin < ECONOMY.condition.matchStrengthKnee)
  for (const c of dipped) {
    out.push(`  below-knee cell: ${c.profile.label.trim()} × ${c.policy.id} (worst trough ${c.troughMin})`)
  }
  const anyLow = cells.filter((c) => c.pctLow > 0)
  out.push(
    anyLow.length === 0
      ? '  no cell EVER sees a week under condition 40 – the <40 band is unreachable under the current knobs.'
      : `  cells with <40 weeks: ${anyLow.map((c) => `${c.profile.label.trim()} × ${c.policy.id}`).join(', ')}`,
  )
  const maxLost = cells.reduce((a, b) => (a.weeksLostPerSeason >= b.weeksLostPerSeason ? a : b))
  out.push(
    `  heaviest injury toll: ${maxLost.profile.label.trim()} × ${maxLost.policy.id} at ` +
      `${maxLost.weeksLostPerSeason.toFixed(1)} weeks lost/season (${maxLost.injPerSeason.toFixed(2)} inj/season).`,
  )
  // Axis effects, pooled across profiles (paired seeds make the deltas meaningful).
  const byPhysio = (ph: string) => cells.filter((c) => c.policy.id.endsWith(ph))
  const injOf = (xs: CellStats[]) => mean(xs.map((c) => c.injPerSeason))
  const condOf = (xs: CellStats[]) => mean(xs.map((c) => c.meanCond))
  out.push(
    `  physio axis (pooled): inj/season ${injOf(byPhysio('·on')).toFixed(2)} on vs ${injOf(byPhysio('·off')).toFixed(2)} off · ` +
      `mean cond ${condOf(byPhysio('·on')).toFixed(1)} vs ${condOf(byPhysio('·off')).toFixed(1)}.`,
  )
  const byPlan = (planId: string) => cells.filter((c) => c.policy.id.startsWith(planId))
  out.push(
    '  plan axis (pooled): ' +
      GRID_PLANS.map((p) => `${p.id} cond ${condOf(byPlan(p.id)).toFixed(1)} / inj ${injOf(byPlan(p.id)).toFixed(2)}`).join(' · ') +
      '.',
  )
  const byEntry = (entryId: string) => cells.filter((c) => c.policy.id.includes(`·${entryId}·`))
  out.push(
    '  entry axis (pooled): ' +
      GRID_ENTRIES.map((e) => {
        const xs = byEntry(e.id)
        return `${e.id} mt/s ${mean(xs.map((c) => c.matchesPerSeason)).toFixed(1)} / inj ${injOf(xs).toFixed(2)} / caut/s ${mean(xs.map((c) => c.cautionPerSeason)).toFixed(2)}`
      }).join(' · ') +
      '.',
  )
  return out
}

const HEADER = [
  'Ties Break – fatigue/injury bench (round-9 condition math; measurement only, zero engine changes)',
  '',
  `Policies: grinder = plan 85/15, enters everything eligible+affordable (ignores the fatigue caution),`,
  '  practises EVERY plannable week and never books a vacation; balanced = plan 75/25, same entry rule,',
  '  practises every OTHER week, takes the off-season family week and rescues below 65; careful = plan 60/40,',
  '  physio ALWAYS on, skips entry while condition < tier floor + 10, only practises at condition >= 80 and',
  '  rescues below 75. Physio for grinder/balanced follows the game default (ON iff hired coach).',
  `Entries commit within ${ENTRY_LOOKAHEAD} weeks of the deadline (econ-bench policy v3); spawned runs are`,
  '  skip-revealed and closed the same week, so per-match strain lands the week it is played.',
  `Seeds are paired: fatigue-<background>-<index> – policies and both middle presets face the SAME`,
  '  calendar, cohort and injury/physio sub-stream rolls; only condition, tau and entries differ.',
  `${SEEDS_PER_CELL} seeds/cell. Columns: cond = mean weekly condition; %<40 / 40-69 / ≥70 = pooled week share`,
  '  by band; @100 = share of weeks at the exact cap; low = mean trough · worst trough; inj/s = injuries',
  '  per season (mn/mo/mj/sv = severity split per season); lost/s = injured weeks per season; WO/c =',
  '  walkovers per career; caut/s = caution entries (below tier floor) per season; phys$/s = physio+medical',
  '  spend per season; win% = pooled kid match-win rate; mt/s = matches per season; ent/s = entries per',
  '  season; bestRk = mean best dense rank while ranked. Sparklines: mean weekly condition, one row of 52',
  '  chars per season (▁=0-12 … █=88-100).',
  'SEASON PLANNER (schema v13 – REAL mechanics, no longer a projection): the "planner" line per policy reads',
  '  pract N/s = friendlies actually played per season (+ court spend), vac N/s = packages booked per season',
  '  (+ their spend), caution-booked = practice bookings pushed through the fatigue GUARDRAIL, rescue = weeks',
  '  the §4b rescue trigger bought a package, then the per-package rate. Bookings go through the engine',
  '  commands (bookPractice/bookVacation) for NEXT week only, exactly as the UI offers them: a week that is',
  '  not plannable (exam block, off-season friendly, entered tournament, injury, no funds) is simply skipped.',
  'WAVE-2 TUNING (26.07, calendar-independent half): (1) the practice guardrail\'s STREAK arm is gated on real',
  `  strain – ${ECONOMY.practice.cautionStreak} in a row warn only below condition ${ECONOMY.practice.cautionStreakCondition}, ${ECONOMY.practice.cautionStreakAlways} in a row warn at any condition (it used to fire on a`,
  '  perfectly fresh kid, which is how a warning becomes noise); (2) the vacation OFFER band widened to',
  `  <= ${ECONOMY.practice.rescueCondition} and the pre-highlight is now the CHEAPEST package sufficient for HER CURRENT condition (one shared`,
  '  rule in economy.ts – UI and bench read the same function), so the cheap tier can finally be the right',
  `  answer; (3) the DOCTOR'S VETO – condition < ${ECONOMY.availability.medicalFloor} is a HARD block on entering, surfaced as availability`,
  "  reason 'medical'. The per-profile \"medical\" line and the DOCTOR'S VETO block report its firing rate.",
  `WAVE-3 (owner 26.07): the doctor now also checks her ON ARRIVAL. Entries commit ${ENTRY_LOOKAHEAD} weeks ahead, so the entry`,
  '  gate alone could never stop a run she signed up for while healthy and reached wrecked – the bench traced 14',
  '  straight weeks of exactly that. The floor is re-read on the PLAY week: under it she is WITHDRAWN there (no',
  '  travel, no run, 0 pts, entry fee forfeited – the same rule as a post-deadline skip), and the two surfaces are',
  `  counted separately (blocked = entries refused ahead of time · withdrawn = runs pulled on the day). In`,
  `  [${ECONOMY.availability.medicalFloor}, ${ECONOMY.availability.medicalWarningCeiling}) she PLAYS and a warning beat carries the doctor's line ("warned") – never a block.`,
  '',
  `FACTORIAL GRID (owner 25.07): plan × entry × physio unbundled = 12 cells per profile at ${GRID_HORIZON_WEEKS}w,`,
  `  ${GRID_SEEDS} seeds/cell (REDUCED from ${SEEDS_PER_CELL} for runtime; the headline trio keeps ${SEEDS_PER_CELL}). Money coupling per cell:`,
  '  coach$/s = planFactor-scaled coaching spend per season; endFunds = mean family funds at horizon end.',
  `PLANNER GRID: practice {never, alternate, every} × vacation {none, rescue+sea} = 6 cells per profile at`,
  `  ${GRID_HORIZON_WEEKS}w, ${GRID_SEEDS} seeds/cell, on the DEFAULT player (rescue+sea takes the offer whenever the game`,
  `  makes it – the shipped band, condition <= ${ECONOMY.practice.rescueCondition}) – the planner axis in isolation. It REPLACES the`,
  '  old PROJ arithmetic layer (deleted with this slice): same questions, real bookings. The factorial grid',
  '  above keeps the planner OFF so plan × entry × physio stays a clean read.',
  '',
  'RUN-FATIGUE LADDER (owner idea 26.07): matches at a tournament run every day or every other day, so each',
  '  SUBSEQUENT match of the SAME run costs EXTRA condition on top of its own scoreline drain',
  `  (ECONOMY.condition.runFatigueLadder, indexed by match-within-run; shipped [${ECONOMY.condition.runFatigueLadder.join(',')}] = variant C).`,
  '  The owner proposed four ladders – A +1,+2,+3,+4 (10 over a 5-match run) · B +1,+1,+2,+4 (8) · C +1,+1,+2,+2 (6) ·',
  '  D +1,+1,+1,+1 (4) – benched as OPT-IN sections: --scenario runfat-off,runfat-a,runfat-b,runfat-c,runfat-d.',
  '  runfat-off is the PRE-LADDER engine (the reference); runfat-c is the shipped default, so it must reproduce',
  '  BASELINE exactly. With >= 2 of them selected the RUN-FATIGUE LADDER block tables the variants against each',
  '  other (condition + wk49 + injuries + the ECONOMY side-effects). They are headline-only: the factorial and',
  '  planner grids measure axes this idea does not touch, and would multiply a five-section sweep for nothing.',
  '  RUN-DEPTH LINES ("depth <variant>"): the share of COMMITTED runs that were 1, 2, … matches long, plus the',
  '  mean depth and runs/season. This is the distribution the ladder is indexed by, so it decides whether a',
  '  variant can be felt at all – a 1-match run pays rung 0 (nothing) under every variant.',
  '  RIVAL-SIDE COLUMNS (rivCond / riv<knee%) + the RIVAL-SIDE block: the ladder lives in tournamentRunStrain,',
  '  which the COHORT ledger reconstruction calls as well as the kid, so a steeper ladder must tire her',
  `  opponents too. Cohort condition is derived (never stored), sampled every ${RIVAL_SAMPLE_EVERY} weeks plus every play week;`,
  `  "<knee" is the share of the cohort under condition ${ECONOMY.condition.matchStrengthKnee}, where the strength coupling starts to bite. These`,
  '  numbers moving across variants IS the proof the sweep measures the whole game and not just the kid.',
  'ECONOMY LINE (per policy, under the planner line): ent N/s split BY TIER, travel + entry fees + total family',
  '  spend per season, mean end funds and the survival rate (share of seeds whose balance never went negative) –',
  '  the "does a heavier body cost make anyone play fewer / cheaper events?" read.',
  '',
  'SCENARIOS (owner 25.07, V2.1 SHIPPED): BASELINE = the shipped engine knobs (recoveryBase 1,',
  '  matchWeekRecoveryBase 0, physio bonus 1), full section (headline + both grids). V2 = the previous',
  '  candidate patched back (recoveryBase 2), headline only – the audit trail of the V2.1 decision.',
  '  LEGACY = the original round-9 values (2/2/2), headline only. Patches land on the LIVE ECONOMY',
  '  object and are restored afterwards, so every scenario keeps all feedback loops real: coupling',
  '  curve, caution/floor gates, injury tau, entry starvation. --scenario baseline|v2|legacy runs one',
  '  section. endSeason lines read wk49 (the wrap, BEFORE the off-season restore) → wk51 (after the 3',
  '  blackout weeks); the owner target is wk49 ~60-85 by policy. A BASELINE-vs-V2 delta block + the',
  '  INJURY PANEL (real-anchor calibration) close the full run.',
].join('\n')

// --- CSV ---------------------------------------------------------------------

export interface BenchCell {
  scenario: Scenario
  horizon: FatigueHorizon
  profile: Profile
  policy: Policy
  runs: RunResult[]
}

export function toCsv(all: BenchCell[]): string {
  const lines = ['scenario,horizon_weeks,profile,policy,seed,week,condition,injured,tier_played,matches,strain']
  for (const { scenario, horizon, profile, policy, runs } of all) {
    for (const r of runs) {
      for (const w of r.weekly) {
        lines.push(
          [
            scenario.id,
            horizon.weeks.toString(),
            profile.label.trim().replace(/\s+/g, ' '),
            policy.id,
            r.seed,
            w.week.toString(),
            w.condition.toString(),
            w.injured ? '1' : '0',
            w.tierPlayed ?? '',
            w.matches.toString(),
            w.strain.toString(),
          ].join(','),
        )
      }
    }
  }
  return lines.join('\n') + '\n'
}

// --- CLI ---------------------------------------------------------------------

function parseCsvPath(argv: string[]): string | null {
  const i = argv.indexOf('--csv')
  if (i === -1) return null
  const path = argv[i + 1]
  if (!path || path.startsWith('--')) throw new Error('--csv requires a file path argument')
  return path
}

/** `--scenario a[,b,…]` selects one or more sections by id (the run-fatigue ladder sections are
 *  opt-in and only reachable this way). Returns null when the flag is absent = the default sweep. */
export function parseScenarioArg(argv: string[]): Scenario['id'][] | null {
  const i = argv.indexOf('--scenario')
  if (i === -1) return null
  const v = argv[i + 1]
  const known = ALL_SCENARIOS.map((s) => s.id)
  const ids = (v ?? '').split(',').map((x) => x.trim()).filter((x) => x.length > 0)
  if (ids.length === 0 || ids.some((id) => !known.includes(id as Scenario['id']))) {
    throw new Error(`--scenario must be a comma-separated list of: ${known.join(', ')}`)
  }
  return ids as Scenario['id'][]
}

function keyOf(scenario: Scenario, horizon: FatigueHorizon, profile: Profile, policy: Policy): string {
  return `${scenario.id}|${horizon.weeks}|${profile.label}|${policy.id}`
}

// One full section (headline horizons + factorial grid) under the CURRENT live ECONOMY knobs.
// Call inside withScenario(scenario, ...). Headline stats land in `headline` for the
// V2-vs-baseline comparison block.
function runScenarioSection(
  scenario: Scenario,
  all: BenchCell[],
  degenerate: string[],
  headline: Map<string, CellStats>,
): void {
  const rule = '═'.repeat(120)
  console.log('')
  console.log(rule)
  console.log(`  SCENARIO ${scenario.label}`)
  console.log(rule)

  for (const horizon of FATIGUE_HORIZONS) {
    console.log('')
    console.log(rule)
    console.log(
      `  [${scenario.id}] HORIZON ${horizon.label} – ${horizon.seasons} season${horizon.seasons > 1 ? 's' : ''}`,
    )
    console.log(rule)
    for (const profile of PROFILES) {
      console.log('')
      console.log(`  PROFILE ${profile.label}`)
      console.log(tableHeader())
      const cellsOfProfile: CellStats[] = []
      for (const policy of POLICIES) {
        const runs = runCell(profile, policy, horizon.weeks)
        all.push({ scenario, horizon, profile, policy, runs })
        const stats = computeCellStats(profile, policy, horizon, runs)
        cellsOfProfile.push(stats)
        headline.set(keyOf(scenario, horizon, profile, policy), stats)
        degenerate.push(...degeneracyFindings(stats).map((f) => `[${scenario.id}] ${f}`))
        console.log(cellRow(stats))
      }
      // Season shape: mean weekly condition sparkline per policy, one 52-char row per season.
      for (const stats of cellsOfProfile) {
        const rows = sparkRows(stats.meanWeekly)
        rows.forEach((row, s) => {
          const label = s === 0 ? `shape ${stats.policy.id}` : ''
          console.log('  ' + padEnd(label, 17) + `S${s + 1} ` + row)
        })
      }
      // End-of-season (wk49, BEFORE the off-season restore) → post-off-season (wk51) – the
      // owner's tuning target reads the wk49 side; the arrow shows what 3 blackout weeks buy.
      for (const stats of cellsOfProfile) {
        const perSeason = stats.endOfSeasonMean
          .map((c, s) => `S${s + 1} ${c.toFixed(1)}→${stats.postOffSeasonMean[s].toFixed(1)}`)
          .join(' · ')
        const p = stats.endSeasonPooled
        console.log(
          '  ' +
            padEnd(`endSeason ${stats.policy.id}`, 20) +
            perSeason +
            `   (wk49→wk51; pooled wk49 ${p.mean.toFixed(1)} ±${p.sd.toFixed(1)} [${p.min}..${p.max}])`,
        )
      }
      // Season planner (REAL mechanics): what each policy actually booked, what it cost, and
      // whether the guardrail / rescue triggers fired. One line per policy – the headline table
      // is already at its width budget.
      for (const stats of cellsOfProfile) console.log(plannerLine(stats))
      // ECONOMY side-effects: the entry pattern + what it cost. The run-fatigue ladder is expected
      // to move THIS line as much as the condition columns (deeper runs cost more body ⇒ the
      // load-management calculus, and with it the entry pattern, shifts).
      for (const stats of cellsOfProfile) console.log(economyLine(stats))
      // The doctor's veto (Wave-2): one line per profile, all three policies – the proof that the
      // floor only bites in the pathological zone.
      console.log(medicalLine(cellsOfProfile))
      // Anchors (spec): balanced vs real junior prevalence; grinder-vs-careful injury ratio.
      const grinder = cellsOfProfile[0]
      const balanced = cellsOfProfile[1]
      const careful = cellsOfProfile[2]
      const minorShare =
        balanced.injPerSeason === 0 ? 0 : (100 * balanced.sevPerSeason.minor) / balanced.injPerSeason
      const ratio =
        careful.injPerSeason === 0 ? Infinity : grinder.injPerSeason / careful.injPerSeason
      console.log(
        `  anchors: balanced inj/season ${balanced.injPerSeason.toFixed(2)} (target ~0.5-1.1; minors ${minorShare.toFixed(0)}%)` +
          ` · grinder/careful injury ratio ${ratio === Infinity ? 'inf' : ratio.toFixed(1)}x (anchor ≥3x)`,
      )
    }
  }

  // --- factorial grid (12 unbundled cells per profile, one horizon, reduced seeds) ---
  if (scenario.grid) {
    const gridHorizon = FATIGUE_HORIZONS.find((h) => h.weeks === GRID_HORIZON_WEEKS)!
    const gridCells: CellStats[] = []
    console.log('')
    console.log(rule)
    console.log(
      `  [${scenario.id}] FACTORIAL GRID – plan × entry × physio, ${GRID_HORIZON_WEEKS}w, ${GRID_SEEDS} seeds/cell` +
        ` (reduced from ${SEEDS_PER_CELL}; headline trio above keeps ${SEEDS_PER_CELL})`,
    )
    console.log(rule)
    for (const profile of PROFILES) {
      console.log('')
      console.log(`  PROFILE ${profile.label}`)
      console.log(gridHeader())
      for (const p of GRID_PLANS) {
        for (const e of GRID_ENTRIES) {
          for (const ph of GRID_PHYSIO) {
            const policy = gridPolicies().find((g) => g.id === `${p.id}·${e.id}·${ph}`)!
            const runs = runCell(profile, policy, GRID_HORIZON_WEEKS, GRID_SEEDS)
            all.push({ scenario, horizon: gridHorizon, profile, policy, runs })
            const stats = computeCellStats(profile, policy, gridHorizon, runs)
            gridCells.push(stats)
            degenerate.push(...degeneracyFindings(stats).map((f) => `[${scenario.id}] ${f}`))
            console.log(gridRow(p.id, e.id, ph, stats))
          }
        }
      }
    }
    console.log('')
    console.log(`  [${scenario.id}] GRID CORNER CASES`)
    for (const line of gridCornerBlock(gridCells)) console.log(line)
  }

  // The PLANNER grid (practice × vacation, real bookings) – the axis that replaced the deleted
  // PROJ arithmetic. Runs inside the scenario so it reads the LIVE patched knobs.
  if (scenario.plannerGrid) runPlannerGrid(scenario, all, degenerate)
}

// --- PLANNER grid (real bookings; replaces the deleted PROJ arithmetic) --------------------

const PLANNER_COLS: [string, number][] = [
  ['practice', 13],
  ['vacation', 13],
  ['cond', 7],
  ['%<40', 6],
  ['low', 8],
  ['inj/s', 7],
  ['lost/s', 7],
  ['win%', 6],
  ['mt/s', 6],
  ['pract/s', 8],
  ['pr$/s', 7],
  ['vac/s', 6],
  ['vac$/s', 8],
  ['caut/s', 7],
  ['endFunds', 10],
]

function plannerGridHeader(): string {
  return '  ' + PLANNER_COLS.map(([c, w]) => pad(c, w)).join('')
}

function plannerGridRow(practiceId: string, vacationId: string, c: CellStats): string {
  const cells = [
    practiceId,
    vacationId,
    c.meanCond.toFixed(1),
    c.pctLow.toFixed(1),
    `${c.troughMean.toFixed(0)}·${c.troughMin}`,
    c.injPerSeason.toFixed(2),
    c.weeksLostPerSeason.toFixed(1),
    c.winPct.toFixed(1),
    c.matchesPerSeason.toFixed(1),
    c.practicesPerSeason.toFixed(1),
    `$${Math.round(c.practiceSpendPerSeasonCents / 100)}`,
    c.vacationsPerSeason.toFixed(2),
    `$${Math.round(c.vacationSpendPerSeasonCents / 100)}`,
    c.cautionedPracticePerSeason.toFixed(1),
    `$${Math.round(c.endFundsMeanCents / 100).toLocaleString('en-US')}`,
  ]
  return '  ' + cells.map((s, i) => pad(s, PLANNER_COLS[i][1])).join('')
}

/** practice {never, alternate, every} × vacation {none, rescue+sea} on the DEFAULT player –
 *  the planner axis in isolation, with REAL bookings (the PROJ layer used to guess this). */
function runPlannerGrid(scenario: Scenario, all: BenchCell[], degenerate: string[]): void {
  const horizon = FATIGUE_HORIZONS.find((h) => h.weeks === GRID_HORIZON_WEEKS)!
  const rule = '═'.repeat(120)
  console.log('')
  console.log(rule)
  console.log(
    `  [${scenario.id}] PLANNER GRID – practice × vacation (REAL bookings), ${GRID_HORIZON_WEEKS}w, ${GRID_SEEDS} seeds/cell,` +
      ' on the default player (75/25 · enter-all · physio default)',
  )
  console.log(rule)
  const cells: CellStats[] = []
  for (const profile of PROFILES) {
    console.log('')
    console.log(`  PROFILE ${profile.label}`)
    console.log(plannerGridHeader())
    for (const pr of GRID_PRACTICE) {
      for (const va of GRID_VACATION) {
        const policy = plannerPolicies().find((p) => p.id === `${pr.id}·${va.id}`)!
        const runs = runCell(profile, policy, GRID_HORIZON_WEEKS, GRID_SEEDS)
        all.push({ scenario, horizon, profile, policy, runs })
        const stats = computeCellStats(profile, policy, horizon, runs)
        cells.push(stats)
        degenerate.push(...degeneracyFindings(stats).map((f) => `[${scenario.id}] ${f}`))
        console.log(plannerGridRow(pr.id, va.id, stats))
      }
    }
  }
  // Pooled axis effects – the "does practising every week really hurt?" read the bench's PROJ
  // layer only guessed at.
  const byPractice = (id: string) => cells.filter((c) => c.policy.id.startsWith(`${id}·`))
  const condOf = (xs: CellStats[]) => mean(xs.map((c) => c.meanCond))
  const injOf = (xs: CellStats[]) => mean(xs.map((c) => c.injPerSeason))
  const lowOf = (xs: CellStats[]) => mean(xs.map((c) => c.pctLow))
  console.log('')
  console.log(`  [${scenario.id}] PLANNER AXIS (pooled over profiles)`)
  console.log(
    '  practice: ' +
      GRID_PRACTICE.map((pr) => {
        const xs = byPractice(pr.id)
        return `${pr.id} cond ${condOf(xs).toFixed(1)} / <40 ${lowOf(xs).toFixed(1)}% / inj ${injOf(xs).toFixed(2)}`
      }).join(' · '),
  )
  const byVacation = (id: string) => cells.filter((c) => c.policy.id.endsWith(`·${id}`))
  console.log(
    '  vacation: ' +
      GRID_VACATION.map((va) => {
        const xs = byVacation(va.id)
        return `${va.id} cond ${condOf(xs).toFixed(1)} / <40 ${lowOf(xs).toFixed(1)}% / inj ${injOf(xs).toFixed(2)}`
      }).join(' · '),
  )
}

/** THE price-ladder question (spec §4b: "every package selling at SOME rate across policies
 *  before the ladder is considered tuned"). Pools every cell of the run – headline trio, the
 *  factorial grid and the planner grid – and reports, per package, the total bookings and which
 *  (profile × policy) cells bought it. */
function renderPackageSales(all: BenchCell[]): void {
  const rule = '═'.repeat(120)
  console.log('')
  console.log(rule)
  console.log('  PACKAGE SALES – does every package sell at SOME rate? (pooled over every cell of this run)')
  console.log(rule)
  const totals = new Map<string, { bookings: number; cells: Set<string>; spendCents: number }>()
  let allBookings = 0
  for (const cell of all) {
    for (const r of cell.runs) {
      for (const [id, n] of Object.entries(r.vacationsByPackage)) {
        const t = totals.get(id) ?? { bookings: 0, cells: new Set<string>(), spendCents: 0 }
        t.bookings += n
        t.cells.add(`${cell.profile.background}·${cell.policy.id}`)
        totals.set(id, t)
        allBookings += n
      }
      if (r.vacationsTotal > 0) {
        const first = Object.keys(r.vacationsByPackage)[0]
        const t = totals.get(first)
        if (t) t.spendCents += r.vacationSpendCents
      }
    }
  }
  for (const pkg of ECONOMY.vacation.packages) {
    const t = totals.get(pkg.id)
    const share = allBookings === 0 ? 0 : (100 * (t?.bookings ?? 0)) / allBookings
    const priceBand = `$${pkg.priceCents[0] / 100}-${pkg.priceCents[1] / 100}`
    console.log(
      '  ' +
        padEnd(pkg.id, 12) +
        pad(priceBand, 12) +
        pad(`+${pkg.conditionGain}`, 5) +
        pad(`${t?.bookings ?? 0} bookings`, 16) +
        pad(`${share.toFixed(1)}%`, 8) +
        `  ${t ? `in ${t.cells.size} cells` : 'NEVER SOLD'}`,
    )
  }
  const unsold = ECONOMY.vacation.packages.filter((p) => !totals.has(p.id))
  console.log(
    unsold.length === 0
      ? '  VERDICT: all 6 packages sell somewhere – the ladder clears the spec §4b bar.'
      : `  VERDICT: ${unsold.length} package(s) NEVER sold: ${unsold.map((p) => p.id).join(', ')} – the ladder needs a tuning pass.`,
  )
}

/** THE DOCTOR'S VETO, pooled per policy over every cell of the run (owner R9-19b; the ARRIVAL half
 *  added 26.07). Answers the questions the owner will ask: does the gate fire at all, does it ever
 *  touch a policy that is not the degenerate grinder – and now, WHICH END of it fires. The two ends
 *  are reported as separate columns because they cost the family different money:
 *    BLOCKED   – the floor refused an entry weeks ahead of the play week. Nothing was paid.
 *    WITHDRAWN – the entry reached its play week under the floor and was pulled there. The entry fee
 *                was already committed and is forfeited; travel is never charged (she never boards).
 *    WARNED    – the play week landed in [floor, warningCeiling): she played, the doctor went on
 *                record. Never a block – the owner's "I can warn you, I cannot forbid it".
 *  A withdrawal is the expensive one, so a policy with withdrawals but no blocks is the interesting
 *  cell: she was healthy enough to SIGN UP and wrecked herself before the week arrived. */
function renderMedicalVeto(all: BenchCell[]): void {
  const rule = '═'.repeat(120)
  const a = ECONOMY.availability
  console.log('')
  console.log(rule)
  console.log(
    `  DOCTOR'S VETO – condition < ${a.medicalFloor} blocks ENTRY and, since 26.07, also withdraws her ON THE PLAY WEEK;` +
      ` ${a.medicalFloor}-${a.medicalWarningCeiling - 1} warns and lets her play`,
  )
  console.log(
    '  (pooled over every cell of this run; tier caution floors are 20-45, so normal play must read 0.00 everywhere)',
  )
  console.log(rule)
  const byPolicy = new Map<
    string,
    {
      blocks: number
      withdrawals: number
      warnings: number
      seasons: number
      weeksBelow: number
      weeks: number
      cells: Set<string>
    }
  >()
  for (const cell of all) {
    const seasons = cell.horizon.weeks / WEEKS_PER_YEAR
    const row = byPolicy.get(cell.policy.id) ?? {
      blocks: 0,
      withdrawals: 0,
      warnings: 0,
      seasons: 0,
      weeksBelow: 0,
      weeks: 0,
      cells: new Set<string>(),
    }
    for (const r of cell.runs) {
      row.blocks += r.medicalBlocks
      row.withdrawals += r.medicalWithdrawals
      row.warnings += r.medicalWarnings
      row.seasons += seasons
      row.weeksBelow += r.weeksBelowMedicalFloor
      row.weeks += cell.horizon.weeks
      if (r.medicalBlocks + r.medicalWithdrawals > 0) row.cells.add(`${cell.profile.background}·${cell.profile.coachSetup}`)
    }
    byPolicy.set(cell.policy.id, row)
  }
  const rows = [...byPolicy.entries()].sort((a2, b) => b[1].blocks + b[1].withdrawals - (a2[1].blocks + a2[1].withdrawals))
  for (const [id, r] of rows) {
    console.log(
      '  ' +
        padEnd(id, 12) +
        pad(`${r.blocks} blocked`, 13) +
        pad(`${(r.blocks / r.seasons).toFixed(2)}/s`, 9) +
        pad(`${r.withdrawals} withdrawn`, 15) +
        pad(`${(r.withdrawals / r.seasons).toFixed(2)}/s`, 9) +
        pad(`${r.warnings} warned`, 13) +
        pad(`${((100 * r.weeksBelow) / r.weeks).toFixed(2)}% wks under floor`, 26) +
        `  ${r.cells.size ? `fires in ${r.cells.size} profile(s)` : 'never fires'}`,
    )
  }
  const firing = rows.filter(([, r]) => r.blocks + r.withdrawals > 0)
  const pulled = rows.filter(([, r]) => r.withdrawals > 0)
  console.log(
    firing.length === 0
      ? '  VERDICT: the veto never fired anywhere – the floor is pure insurance under these knobs.'
      : `  VERDICT: the veto fires only for ${firing.map(([id]) => id).join(', ')} – every other policy never met it.` +
        (pulled.length === 0
          ? ' No entry ever reached its play week under the floor, so the ARRIVAL check is pure insurance too.'
          : ` The ARRIVAL check earns its keep for ${pulled.map(([id]) => id).join(', ')} – runs entered healthy that were wrecked before the week came.`),
  )
}

// --- scenario comparison ----------------------------------------------------------

function renderComparison(headline: Map<string, CellStats>, from: Scenario, to: Scenario): void {
  const rule = '═'.repeat(120)
  console.log('')
  console.log(rule)
  console.log(
    `  ${to.id.toUpperCase()} vs ${from.id.toUpperCase()} – headline deltas (${from.id}→${to.id});` +
      ' owner season-end target: wk49 lands ~60-85 by policy (grinder low, careful high-but-<100)',
  )
  console.log(rule)
  for (const horizon of FATIGUE_HORIZONS) {
    console.log('')
    console.log(`  [${horizon.label}]`)
    for (const profile of PROFILES) {
      const get = (s: Scenario, pol: Policy) => headline.get(keyOf(s, horizon, profile, pol))
      const rows = POLICIES.map((pol) => ({ pol, b: get(from, pol), v: get(to, pol) }))
      if (rows.some((r) => !r.b || !r.v)) continue
      console.log(`  ${profile.label}`)
      const below70 = (s: CellStats) => s.pctLow + s.pctMid
      for (const { pol, b, v } of rows) {
        console.log(
          '    ' +
            padEnd(pol.id, 10) +
            `cond ${b!.meanCond.toFixed(1)}→${v!.meanCond.toFixed(1)}` +
            ` · endSeason(wk49) ${b!.endSeasonPooled.mean.toFixed(1)}→${v!.endSeasonPooled.mean.toFixed(1)}` +
            ` · <70 ${below70(b!).toFixed(1)}%→${below70(v!).toFixed(1)}%` +
            ` · caut/s ${b!.cautionPerSeason.toFixed(2)}→${v!.cautionPerSeason.toFixed(2)}` +
            ` · trough ${b!.troughMean.toFixed(0)}·${b!.troughMin}→${v!.troughMean.toFixed(0)}·${v!.troughMin}` +
            ` · inj/s ${b!.injPerSeason.toFixed(2)}→${v!.injPerSeason.toFixed(2)}`,
        )
      }
      const [g, , c] = rows
      const ratio = (x?: CellStats, y?: CellStats) =>
        !x || !y || y.injPerSeason === 0 ? 'inf' : (x.injPerSeason / y.injPerSeason).toFixed(1)
      const winGap = (s: Scenario) => {
        const gs = get(s, POLICIES[0])!
        const cs = get(s, POLICIES[2])!
        return (cs.winPct - gs.winPct).toFixed(1)
      }
      console.log(
        `    anchors: inj g/c ${ratio(g.b, c.b)}x→${ratio(g.v, c.v)}x (spec ≥3x)` +
          ` · win% careful−grinder ${winGap(from)}pp→${winGap(to)}pp` +
          ` · matches g ${g.b!.matchesPerSeason.toFixed(1)}→${g.v!.matchesPerSeason.toFixed(1)}/s` +
          ` · lost/s g ${g.b!.weeksLostPerSeason.toFixed(1)}→${g.v!.weeksLostPerSeason.toFixed(1)}`,
      )
    }
  }
}

// --- run-fatigue ladder comparison (owner idea 26.07) ------------------------------

const RUNFAT_COLS: [string, number][] = [
  ['variant', 12],
  ['ladder', 16],
  ['cond', 6],
  ['%<40', 6],
  ['%<70', 6],
  ['trough', 9],
  ['wk49', 19],
  ['inj/s', 6],
  ['lost/s', 7],
  ['ent/s', 6],
  ['mt/s', 6],
  ['win%', 6],
  ['travel$/s', 10],
  ['spend$/s', 10],
  ['endFunds', 10],
  ['surv%', 6],
  ['blk/s', 7],
  ['wdr/s', 7],
  // RIVAL-SIDE: the ladder is SHARED, so these two must move with the variant or the table is
  // measuring half the game (the module-load caching bug fixed on main).
  ['rivCond', 8],
  ['riv<knee%', 10],
]

function runfatHeader(): string {
  return '  ' + RUNFAT_COLS.map(([c, w]) => pad(c, w)).join('')
}

function runfatRow(scenario: Scenario, c: CellStats): string {
  const ladder = scenario.patch.runFatigueLadder ?? ECONOMY.condition.runFatigueLadder
  const dollars = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
  const cells = [
    scenario.id.replace('runfat-', ''),
    `[${ladder.join(',')}]`,
    c.meanCond.toFixed(1),
    c.pctLow.toFixed(1),
    (c.pctLow + c.pctMid).toFixed(1),
    `${c.troughMean.toFixed(0)}·${c.troughMin}`,
    `${c.endSeasonPooled.mean.toFixed(1)}±${c.endSeasonPooled.sd.toFixed(0)}[${c.endSeasonPooled.min}-${c.endSeasonPooled.max}]`,
    c.injPerSeason.toFixed(2),
    c.weeksLostPerSeason.toFixed(1),
    c.entriesPerSeason.toFixed(1),
    c.matchesPerSeason.toFixed(1),
    c.winPct.toFixed(1),
    dollars(c.travelPerSeasonCents),
    dollars(c.totalSpendPerSeasonCents),
    dollars(c.endFundsMeanCents),
    c.survivalPct.toFixed(0),
    c.medicalBlocksPerSeason.toFixed(2),
    c.medicalWithdrawalsPerSeason.toFixed(2),
    c.rivalCondMean.toFixed(1),
    c.rivalPctBelowKnee.toFixed(1),
  ]
  return '  ' + cells.map((x, i) => pad(x, RUNFAT_COLS[i][1])).join('')
}

/** One cell's run-depth histogram as a line: the share of committed runs at each depth, the mean
 *  depth, and how many runs a season there were at all. */
function depthLine(c: CellStats): string {
  const buckets = c.runDepthPct
    .map((pct, d) => (d === 0 ? '' : `${d}${d === MAX_RUN_DEPTH ? '+' : ''}:${pct.toFixed(0)}%`))
    .filter((s) => s !== '')
    .join(' ')
  return `${buckets}  mean ${c.meanRunDepth.toFixed(2)} · ${c.runsPerSeason.toFixed(1)} runs/s · 3+ ${c.pctRuns3Plus.toFixed(0)}% · 4+ ${c.pctRuns4Plus.toFixed(0)}%`
}

/** THE run-fatigue slice's headline output: every ladder variant that ran, side by side, per
 *  horizon × profile × policy, plus a pooled per-variant summary and the per-tier entry split
 *  (the ECONOMY side-effect the owner expects). Rendered only when >= 2 ladder scenarios ran. */
function renderRunFatigueComparison(headline: Map<string, CellStats>, scenarios: Scenario[]): void {
  const ran = scenarios.filter((s) => s.patch.runFatigueLadder !== undefined)
  if (ran.length < 2) return
  const rule = '═'.repeat(140)
  console.log('')
  console.log(rule)
  console.log(
    '  RUN-FATIGUE LADDER – cumulative tournament fatigue (owner idea 26.07): each SUBSEQUENT match of the same run',
  )
  console.log(
    `  costs EXTRA condition. Variants: ${ran.map((s) => `${s.id.replace('runfat-', '')} [${(s.patch.runFatigueLadder ?? []).join(',')}]`).join(' · ')}` +
      ` – wk49 is the owner's season-end target (~60-85 by policy).`,
  )
  console.log(rule)
  for (const horizon of FATIGUE_HORIZONS) {
    const anyRow = ran.some((sc) => PROFILES.some((pr) => POLICIES.some((po) => headline.has(keyOf(sc, horizon, pr, po)))))
    if (!anyRow) continue
    console.log('')
    console.log(`  [${horizon.label}]`)
    for (const profile of PROFILES) {
      for (const policy of POLICIES) {
        const rows = ran
          .map((sc) => ({ sc, c: headline.get(keyOf(sc, horizon, profile, policy)) }))
          .filter((r): r is { sc: Scenario; c: CellStats } => r.c !== undefined)
        if (rows.length < 2) continue
        console.log('')
        console.log(`  ${profile.label.trim()} × ${policy.id}`)
        console.log(runfatHeader())
        for (const { sc, c } of rows) console.log(runfatRow(sc, c))
        // the entry pattern in full, per variant – "does a heavier deep run make anyone play
        // fewer / cheaper events?" is answered by THIS line, not by the ent/s column alone.
        for (const { sc, c } of rows) {
          console.log('  ' + padEnd(`tiers ${sc.id.replace('runfat-', '')}`, 14) + tierSplit(c))
        }
        // RUN DEPTH per variant – how often the ladder's deeper rungs are charged at all. If the
        // distribution is dominated by 1-match runs, no shallow variant CAN be felt.
        for (const { sc, c } of rows) {
          console.log('  ' + padEnd(`depth ${sc.id.replace('runfat-', '')}`, 14) + depthLine(c))
        }
      }
    }
  }
  // Pooled per-variant summary over the whole comparison (all horizons × profiles), per policy.
  console.log('')
  console.log('  POOLED per variant (mean over all horizons × profiles), one block per policy')
  for (const policy of POLICIES) {
    console.log('')
    console.log(`  policy ${policy.label}`)
    console.log(runfatHeader())
    for (const sc of ran) {
      const cells = FATIGUE_HORIZONS.flatMap((h) =>
        PROFILES.map((pr) => headline.get(keyOf(sc, h, pr, policy))).filter((c): c is CellStats => c !== undefined),
      )
      if (cells.length === 0) continue
      const pooled: CellStats = {
        ...cells[0],
        meanCond: mean(cells.map((c) => c.meanCond)),
        pctLow: mean(cells.map((c) => c.pctLow)),
        pctMid: mean(cells.map((c) => c.pctMid)),
        troughMean: mean(cells.map((c) => c.troughMean)),
        troughMin: Math.min(...cells.map((c) => c.troughMin)),
        endSeasonPooled: {
          mean: mean(cells.map((c) => c.endSeasonPooled.mean)),
          sd: mean(cells.map((c) => c.endSeasonPooled.sd)),
          min: Math.min(...cells.map((c) => c.endSeasonPooled.min)),
          max: Math.max(...cells.map((c) => c.endSeasonPooled.max)),
        },
        injPerSeason: mean(cells.map((c) => c.injPerSeason)),
        weeksLostPerSeason: mean(cells.map((c) => c.weeksLostPerSeason)),
        entriesPerSeason: mean(cells.map((c) => c.entriesPerSeason)),
        matchesPerSeason: mean(cells.map((c) => c.matchesPerSeason)),
        winPct: mean(cells.map((c) => c.winPct)),
        travelPerSeasonCents: mean(cells.map((c) => c.travelPerSeasonCents)),
        totalSpendPerSeasonCents: mean(cells.map((c) => c.totalSpendPerSeasonCents)),
        endFundsMeanCents: mean(cells.map((c) => c.endFundsMeanCents)),
        survivalPct: mean(cells.map((c) => c.survivalPct)),
        medicalBlocksPerSeason: mean(cells.map((c) => c.medicalBlocksPerSeason)),
        medicalWithdrawalsPerSeason: mean(cells.map((c) => c.medicalWithdrawalsPerSeason)),
        medicalWarningsPerSeason: mean(cells.map((c) => c.medicalWarningsPerSeason)),
        pctWeeksBelowMedicalFloor: mean(cells.map((c) => c.pctWeeksBelowMedicalFloor)),
        rivalCondMean: mean(cells.map((c) => c.rivalCondMean)),
        rivalPctBelowKnee: mean(cells.map((c) => c.rivalPctBelowKnee)),
        rivalPlayWeekCondMean: mean(cells.map((c) => c.rivalPlayWeekCondMean)),
        rivalPlayWeekPctBelowKnee: mean(cells.map((c) => c.rivalPlayWeekPctBelowKnee)),
        // Depth pools by RUN COUNT, so re-pool from the cells' own counts rather than meaning
        // percentages (a 52w cell has a quarter of the runs a 208w cell does).
        ...pooledDepth(cells),
      }
      console.log(runfatRow(sc, pooled))
      console.log('  ' + padEnd('  depth', 14) + depthLine(pooled))
    }
  }

  // THE RIVAL-SIDE PROOF, in one block: the ladder lives in `tournamentRunStrain`, which the cohort's
  // ledger reconstruction calls too, so a steeper ladder MUST tire the field. If these numbers were
  // flat across variants, the sweep would be measuring the kid only (the module-load caching bug).
  console.log('')
  console.log(
    `  RIVAL-SIDE (shared-ladder proof): cohort condition derived from the results ledger, sampled every ${RIVAL_SAMPLE_EVERY} weeks`,
  )
  console.log(
    `  plus EVERY play week. "<knee" = share of the 199-player cohort under condition ${ECONOMY.condition.matchStrengthKnee}, where the strength`,
  )
  console.log('  coupling starts to bite. field = the whole calendar · met = only the weeks she took the court.')
  for (const horizon of FATIGUE_HORIZONS) {
    const parts: string[] = []
    for (const sc of ran) {
      const cells = PROFILES.flatMap((pr) =>
        POLICIES.map((po) => headline.get(keyOf(sc, horizon, pr, po))).filter((c): c is CellStats => !!c),
      )
      if (cells.length === 0) continue
      parts.push(
        `${padEnd(sc.id.replace('runfat-', ''), 4)} field ${mean(cells.map((c) => c.rivalCondMean)).toFixed(1)}` +
          ` (<knee ${mean(cells.map((c) => c.rivalPctBelowKnee)).toFixed(1)}%)` +
          ` · met ${mean(cells.map((c) => c.rivalPlayWeekCondMean)).toFixed(1)}` +
          ` (<knee ${mean(cells.map((c) => c.rivalPlayWeekPctBelowKnee)).toFixed(1)}%)`,
      )
    }
    if (parts.length) {
      console.log(`  ${horizon.label}`)
      for (const p of parts) console.log(`    ${p}`)
    }
  }

  // RUN DEPTH pooled per variant × policy – the distribution that decides whether ANY ladder can be
  // felt (a 1-match run pays rung 0 = nothing, whatever the variant).
  console.log('')
  console.log('  RUN-DEPTH DISTRIBUTION per variant (pooled over horizons × profiles, by RUN count), one block per policy')
  for (const policy of POLICIES) {
    console.log('')
    console.log(`  policy ${policy.label}`)
    for (const sc of ran) {
      const cells = FATIGUE_HORIZONS.flatMap((h) =>
        PROFILES.map((pr) => headline.get(keyOf(sc, h, pr, policy))).filter((c): c is CellStats => !!c),
      )
      if (cells.length === 0) continue
      const pooled: CellStats = { ...cells[0], ...pooledDepth(cells) }
      console.log('  ' + padEnd(sc.id.replace('runfat-', ''), 8) + depthLine(pooled))
    }
  }

  // The grinder/careful injury anchor per variant – the spec's >=3x load-management signal.
  console.log('')
  console.log('  INJURY ANCHOR per variant (grinder/careful inj/season, pooled over profiles; spec anchor >= 3x)')
  for (const horizon of FATIGUE_HORIZONS) {
    const parts: string[] = []
    for (const sc of ran) {
      const g = PROFILES.map((pr) => headline.get(keyOf(sc, horizon, pr, POLICIES[0]))).filter((c): c is CellStats => !!c)
      const cf = PROFILES.map((pr) => headline.get(keyOf(sc, horizon, pr, POLICIES[2]))).filter((c): c is CellStats => !!c)
      if (g.length === 0 || cf.length === 0) continue
      const gi = mean(g.map((c) => c.injPerSeason))
      const ci = mean(cf.map((c) => c.injPerSeason))
      parts.push(`${sc.id.replace('runfat-', '')} ${ci === 0 ? 'inf' : (gi / ci).toFixed(1)}x`)
    }
    if (parts.length) console.log(`  ${horizon.label}: ${parts.join(' · ')}`)
  }
}

/** Re-pool a run-depth distribution from several cells by RUN COUNT (never by meaning their
 *  percentages – the horizons contribute wildly different numbers of runs). */
function pooledDepth(
  cells: CellStats[],
): Pick<CellStats, 'runDepthPct' | 'meanRunDepth' | 'pctRuns3Plus' | 'pctRuns4Plus' | 'runsPerSeason'> {
  const counts = new Array<number>(MAX_RUN_DEPTH + 1).fill(0)
  for (const c of cells) {
    for (const r of c.runs) {
      for (let d = 0; d <= MAX_RUN_DEPTH; d++) counts[d] += r.runDepthCounts[d]
    }
  }
  const total = counts.reduce((s, n) => s + n, 0)
  const share = (from: number) => (total === 0 ? 0 : (100 * counts.slice(from).reduce((s, n) => s + n, 0)) / total)
  return {
    runDepthPct: counts.map((n) => (total === 0 ? 0 : (100 * n) / total)),
    meanRunDepth: total === 0 ? 0 : counts.reduce((s, n, d) => s + d * n, 0) / total,
    pctRuns3Plus: share(3),
    pctRuns4Plus: share(4),
    runsPerSeason: mean(cells.map((c) => c.runsPerSeason)),
  }
}

// --- injury panel (owner calibration vs docs/research/injury-stats-by-age.md) ------

/** Real-world anchors (research doc + owner 25.07): juniors 46-54% injured/season (≈0.5-1.1
 *  inj/season, minors dominating); girls post-peak ≈1.0 week lost/yr, boys at growth peak
 *  ≈2.3 weeks; teen-peak heavy-load groups reach ~95% prevalence – the grinder's legitimate
 *  analog. */
export const INJURY_ANCHORS = {
  juniorPrevalencePct: [46, 54] as [number, number],
  juniorInjPerSeason: [0.5, 1.1] as [number, number],
  weeksLostBand: [1.0, 2.3] as [number, number], // girls post-peak 1.0 … boys growth-peak 2.3
  heavyLoadPrevalencePct: 95, // teen-peak heavy-load analog for the grinder
}

function bandFlag(x: number, [lo, hi]: [number, number]): string {
  if (x < lo) return `below ${lo}-${hi}`
  if (x > hi) return `ABOVE ${lo}-${hi}`
  return `in ${lo}-${hi}`
}

function renderInjuryPanel(headline: Map<string, CellStats>, from: Scenario, to: Scenario): void {
  const a = INJURY_ANCHORS
  const horizon = FATIGUE_HORIZONS.find((h) => h.weeks === GRID_HORIZON_WEEKS)!
  const rule = '═'.repeat(120)
  console.log('')
  console.log(rule)
  console.log(
    `  INJURY PANEL – ${horizon.label}, ${from.id}→${to.id}, vs the REAL anchors` +
      ' (docs/research/injury-stats-by-age.md):',
  )
  console.log(
    `  juniors ${a.juniorPrevalencePct[0]}-${a.juniorPrevalencePct[1]}%/season injured (≈${a.juniorInjPerSeason[0]}-${a.juniorInjPerSeason[1]} inj/season, minors dominating) · weeks lost ` +
      `${a.weeksLostBand[0]} (girls post-peak) - ${a.weeksLostBand[1]} (boys growth-peak) /yr · heavy-load teen-peak ≈${a.heavyLoadPrevalencePct}% prevalence (grinder analog)`,
  )
  console.log(rule)
  for (const profile of PROFILES) {
    console.log('')
    console.log(`  PROFILE ${profile.label}`)
    for (const policy of POLICIES) {
      const b = headline.get(keyOf(from, horizon, profile, policy))
      const v = headline.get(keyOf(to, horizon, profile, policy))
      if (!b || !v) continue
      const sev = SEVERITIES.map((s) => v.sevPerSeason[s].toFixed(2)).join('/')
      const minorShare = v.injPerSeason === 0 ? 0 : (100 * v.sevPerSeason.minor) / v.injPerSeason
      const anchor =
        policy.id === 'grinder'
          ? `prev vs heavy-load ~${a.heavyLoadPrevalencePct}%: ${v.prevalencePct.toFixed(0)}% · lost ${bandFlag(v.weeksLostPerSeason, a.weeksLostBand)}`
          : `prev ${bandFlag(v.prevalencePct, a.juniorPrevalencePct)}% · inj ${bandFlag(v.injPerSeason, a.juniorInjPerSeason)} · lost ${bandFlag(v.weeksLostPerSeason, a.weeksLostBand)}`
      console.log(
        '    ' +
          padEnd(policy.id, 10) +
          `inj/s ${b.injPerSeason.toFixed(2)}→${v.injPerSeason.toFixed(2)}` +
          ` · prev ${b.prevalencePct.toFixed(0)}%→${v.prevalencePct.toFixed(0)}%` +
          ` · sev(${to.id}) ${sev} (minors ${minorShare.toFixed(0)}%)` +
          ` · lost/s ${b.weeksLostPerSeason.toFixed(1)}→${v.weeksLostPerSeason.toFixed(1)}` +
          `   [${anchor}]`,
      )
    }
  }
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const csvPath = parseCsvPath(argv)
  const scenarioFilter = parseScenarioArg(argv)
  // Default sweep = the three shipped-knob sections. The run-fatigue ladder sections are opt-in
  // (they would multiply the default run's cost for an axis the default run does not ask about),
  // and selecting them keeps the CLI order the user typed.
  const scenarios = scenarioFilter
    ? scenarioFilter.map((id) => ALL_SCENARIOS.find((s) => s.id === id)!)
    : SCENARIOS
  console.log(HEADER)

  const all: BenchCell[] = []
  const degenerate: string[] = []
  const headline = new Map<string, CellStats>()

  for (const scenario of scenarios) {
    withScenario(scenario, () => runScenarioSection(scenario, all, degenerate, headline))
  }

  // The audit trail of the V2.1 decision: previous candidate (v2) → shipped (baseline),
  // plus the owner's injury calibration panel against the real-world anchors.
  const baseline = scenarios.find((s) => s.id === 'baseline')
  const v2 = scenarios.find((s) => s.id === 'v2')
  if (baseline && v2) {
    renderComparison(headline, v2, baseline)
    renderInjuryPanel(headline, v2, baseline)
  }

  // The run-fatigue ladder table (owner idea 26.07) – only when >= 2 ladder sections ran.
  renderRunFatigueComparison(headline, scenarios)

  // The price-ladder verdict (spec §4b): does every package sell somewhere?
  renderPackageSales(all)
  // The Wave-2 hard body-gate: does it only ever bite the degenerate cell?
  renderMedicalVeto(all)

  console.log('')
  if (degenerate.length) {
    console.log('DEGENERATE CELLS:')
    for (const d of degenerate) console.log('  ' + d)
  } else {
    console.log('Degenerate cells: none (no 0/100 pinning beyond thresholds, no injury spirals, no unplayable calendars).')
  }
  console.log(
    'PLANNER: practice matches + vacations are REAL engine mechanics now (season-planner slice, schema v13)',
  )
  console.log('  – every planner column above is simulated (bookings via bookPractice/bookVacation), not projected.')
  console.log('  Remaining blind spots: practices feed neither skills nor the overuse counter (by design until the')
  console.log('  skills system lands), and a booking is only attempted for NEXT week, exactly like the UI offers it.')

  if (csvPath) {
    writeFileSync(csvPath, toCsv(all))
    console.log(`Weekly time-series written to ${csvPath}`)
  }
}

// Run only when invoked as the CLI script, never when imported by the test (vitest sets
// process.env.VITEST – same guard as econ-bench; under vite-node argv[1] is the runner).
if (!process.env.VITEST) {
  main()
}
