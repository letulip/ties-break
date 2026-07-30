import { type Rng, rngFromSeed, pickInt } from './rng'
import {
  DEFAULT_PROFILE,
  STOP_PRECEDENCE,
  WEEK_PLAN_PRESETS,
  type ArrivalPreview,
  type CountingResult,
  LADDER_LABEL,
  type LadderView,
  type EntryCapUsage,
  type TierOpenMap,
  type FamilyBackground,
  type FinanceWeek,
  type FinanceWeekPoint,
  type FinanceWindow,
  type FullBracketMatch,
  type InjurySeverity,
  type LossStreak,
  type Milestone,
  type PendingBracketRound,
  type PendingView,
  type PlayerProfile,
  type PracticeBooking,
  type RecoveryBuff,
  type SeasonHistoryEntry,
  type SeasonSummary,
  type CoachMarketRow,
  type Snapshot,
  type SnapshotInjury,
  type StandingRow,
  type StopReason,
  type UpcomingEvent,
  type VacationBooking,
  type WeekPlan,
  type WorldEvent,
  type WorldEventCategory,
  type WorldMatch,
} from '../shared/protocol'
import { formatShortName } from '../shared/format'
// THE LAYERING, stated once (fix/world-trio item 2). `src/shared/dates.ts` is deliberately
// engine-free – it imports nothing and knows only the fixed epoch – so the dependency runs one way,
// engine -> shared, exactly as it already does for `../shared/protocol` and `../shared/format`.
// This import is therefore the seam, not a violation of one: there is no need for (and must be no)
// second week formatter living inside the engine. The engine keeps counting ABSOLUTE weeks and
// every RNG sub-stream key / save field / pinned capture stays on that index; `weekLabel` is
// applied only where the engine writes a string a PLAYER reads.
import { seasonYear, weekLabel } from '../shared/dates'
// The emotion RULES live in shared/ (pure, UI-free, and the composable reads the same module), so
// the engine borrows the two facts it needs rather than restating them: which recorded matches are
// allowed to move her face (R11-2's one predicate) and the band a streak's anger threshold sits in.
// Type-only on the way back (shared/avatarEmotion imports `type TierId` from engine/season/types),
// so this is a leaf dependency, not a cycle.
import { ANGER_STREAK_MAX, ANGER_STREAK_MIN, resultShowsOnHerFace } from '../shared/avatarEmotion'
import type { MatchPlayer, Surface } from './match/types'
import type { AiPlayer, LadderTrack, MatchRecord, RankingRow, SeasonEvent, TierId, TournamentResult } from './season/types'
import {
  TIERS,
  buildSeason,
  isBlackoutWeek,
  isExamWeek,
  isOffSeasonWeek,
  WEEKS_PER_YEAR,
  OFF_SEASON_WEEKS, TIER_LADDER } from './season/calendar'
import { clamp, conditionMatchFactor, matchDrain, tournamentRunStrain } from './condition'
import { parentIncomeForWeekCents,
  ECONOMY,
  GEAR_CATEGORIES,
  gearHitForWeek,
  practiceFeeCents,
  vacationPackage,
  vacationPriceCents,
} from './economy'
import { generateCohort, driftCohort, ageCohort } from './season/cohort'
import { renewCohort } from './season/conveyor'
import { ageFactor, growWeek, rollPotential, SKILL_KEYS, trainFactor, type KidSkills } from './development'
import {
  bestFitCoachAt,
  buildCoachRoster,
  coachById,
  coachCorridorFactor,
  coachFitFor,
  coachIncludesPhysio,
  coachSeasonUplift,
  coachWeeklyCents,
  COACH_TIER_LABEL,
  eliteGateShortfall,
  practiceCoachRateCents,
  selfRateCents,
  tierOf,
} from './coach'
import {
  kitGrantCents,
  netTravelCents,
  reviewLevel,
  travelCoverShare,
  type AcademySupport,
} from './academy'
import { rivalConditions, rivalMatchPlayer } from './season/rival'
import { generatePreHistory } from './season/prehistory'
import { computeRanking, isCountingResult, windowedBestSum, type SeasonResult } from './season/ranking'
import { selectEntrants, runTournament, kidSeedIndexIn, JUNIOR_TOUR } from './season/tournament'
import { previewEvent, eventCrowd, eventTemperature } from './season/preview'
import { simulateMatch } from './match/engine'
import { applySurfaceStyle } from './match/style'
// Diary-1: the copy system (facts → licensed phrase, sub-stream selection) and the milestone
// identity rule. diary.ts is deliberately world-free (it takes a narrow structural view), so the
// dependency runs one way: world → diary, exactly like world → condition.
import { buildDiarySnapshot, lastKidTitleOf, milestoneKey } from './diary'
// Screen C's three derived tiles (Personality / School / Friends). Same shape of dependency as the
// diary and the radar: kidLife.ts is world-free and takes a narrow structural view, one way only.
import { buildKidLife, FRIENDS_WINDOW } from './kidLife'
// The skills radar (docs/specs/skills-radar.md, decisions.md #11). Same shape of dependency as the
// diary: radar.ts is world-free and takes a narrow structural view, so world → radar runs one way.
import { axisReadings, buildRadar, buildTrainingRead, type RadarWorldView } from './radar'

// Phase 3 world: the living-season integration. The worker owns this state; the UI
// only ever sees snapshots. All randomness flows from the world RNG stream, and the
// per-week MAIN-stream draw count is independent of player input (see RNG discipline
// in docs/specs/phase3-world.md) so the load-time RNG replay stays valid.

export const SAVE_SCHEMA_VERSION = 24

/** Detailed weekly simulation starts here; childhood becomes a prologue (Phase 6). */
export const START_AGE_YEARS = 14

/** The kid's stable player id inside cohort/ranking/tournament space. */
export const KID_ID = 'kid'

/** A tournament whose outcome is fully computed (byte-identical to the old inline resolution)
 *  but is being REVEALED to the player one round at a time. The week that spawned it is not
 *  closed until the run finalizes. Persisted (schema v8) so a mid-reveal save resumes the flow.
 *  `players` holds the pre-drift skill snapshots of the kid + every opponent she faces, so the
 *  revealed match events are identical no matter how the cohort drifts after this week ticks. */
export interface PendingTournament {
  eventId: string
  result: TournamentResult
  /** kid matches already emitted as News events (0..kidMatches.length) */
  revealedRounds: number
  /** true once the last kid match is revealed and points/summary/rank are committed */
  finished: boolean
  players: Record<string, MatchPlayer>
}

export interface WorldState {
  schemaVersion: number
  /** Career this world belongs to. Generated outside the engine (worker/store); the
   *  engine only threads it through. Default here is deterministic so pure callers stay reproducible. */
  careerId: string
  seed: string
  week: number
  fundsCents: number
  profile: PlayerProfile
  plan: WeekPlan
  /** ~199 AI juniors; drifts weekly (Phase-4 placeholder). */
  cohort: AiPlayer[]
  /** rolling results ledger; pruned to the ranking window. */
  results: SeasonResult[]
  /** rolling calendar: always ≥ 26 future weeks generated. */
  season: SeasonEvent[]
  /** eventIds the kid is entered in. */
  entries: string[]
  /** structured News/Money feed; capped, `keep` survives pruning. */
  events: WorldEvent[]
  nextEventId: number
  /** the kid's dense rank among cohort + kid (cheap-access cache). THE ITF table since the two-ladder
   *  slice - it is the one the international rungs gate on and the one the standings are about. */
  kidRank: number
  /** her rank in the DOMESTIC table, the one she has before she owns an international result at all.
   *  Derived like `kidRank` and cached beside it; a career opened before this field existed simply
   *  recomputes it on the next tick, which is why it needs no migration. */
  kidRankDomestic?: number
  /** kidRank as it stood at the start of the last resolved week; null before any tick (v7). THE ITF
   *  one, because `kidRank` is. */
  prevKidRank: number | null
  /** `kidRankDomestic` as it stood at the start of the last resolved week.
   *
   *  ⚠ IT EXISTS SO A MOVEMENT ARROW CANNOT SUBTRACT ONE TABLE FROM THE OTHER. Home's rank chip shows
   *  whichever ladder she is competing in, and it draws an up/down arrow from (previous - current). With
   *  only `prevKidRank` on the world that arrow would have compared this week's NATIONAL rank against
   *  last week's INTERNATIONAL one - a smaller, quieter version of the exact bug this branch fixes, and
   *  it would have shown a triumphant "↑107" on a week nothing happened. Written beside `prevKidRank`
   *  by the same one writer. Optional, so a career opened before the field existed needs no migration:
   *  it is simply null until the next tick, which the arrow already renders as a neutral dash. */
  prevKidRankDomestic?: number | null
  /** R12-S1 (v17): her dense rank as she ENTERED the season currently in progress – captured at
   *  the top of the tick into the season's first week, and read once, at that season's wrap-up.
   *
   *  Persisted rather than derived because it is IRRECOVERABLE by the time it is wanted: the wrap
   *  fires 49 weeks into the season and `pruneResults` keeps only a 52-week trailing window, so the
   *  results that produced this rank are long gone (see maybeFireSeasonWrapUp for the full story of
   *  the "from #1" it used to print). One number per career, overwritten yearly.
   *
   *  null only on a save migrated from a pre-v17 schema mid-season – nothing in such a save can
   *  reconstruct it, and `SeasonSummary.startRank` has always been nullable. */
  seasonStartRank: number | null
  /** HER BUILD, and it MOVES now (v19, Phase 4). Until v18 this was re-derived from `seed:kid`
   *  every time it was asked for, which is why she was exactly as good at week 180 as at week 1.
   *  Seeded from that same derivation so a migrated career does not lurch, then grown weekly by
   *  engine/development.ts. */
  skills: KidSkills
  /** Her ceiling, rolled once from `seed:potential` and never shown (decisions.md #11 – the radar
   *  has axes without numbers). Persisted rather than re-rolled so a save cannot re-roll her
   *  talent, which is the one thing in a career that must not be re-rollable. */
  potential: KidSkills
  /** Her academy scholarship, or null when nobody is backing her (v21). Decided once a year at the
   *  season boundary from what an academy can see – see engine/academy.ts. Persisted because it is
   *  a relationship: it must not re-decide itself between reviews. */
  academy: AcademySupport | null
  /** a tournament being revealed round by round; null when no reveal is in progress (v8). */
  pendingTournament: PendingTournament | null
  /** best (smallest) finish index the kid has ever reached per tier (v10); updated at
   *  tournament finalize. Drives the Home season strip's real tier progress. */
  bestFinishByTier: Partial<Record<TierId, number>>
  /** the most recent end-of-season recap (v10); null until the first season wraps up. */
  lastSeasonSummary: SeasonSummary | null
  /** R10-9 (v14): every FINISHED season, oldest first – `lastSeasonSummary` is overwritten each
   *  year, so this append-only list is what makes "how does this season compare to last?"
   *  answerable. One tiny numeric row per SEASON (see SeasonHistoryEntry), written once at
   *  wrap-up (idempotent per year) and pruned to SEASON_HISTORY_CAP, so it can never grow
   *  per-week and the save stays size-safe over a long career. */
  seasonHistory: SeasonHistoryEntry[]
  /** the CURRENT (in-progress) season's kid wins/losses, counted as matches resolve so the
   *  summary never has to re-parse event text and pruning can't lose them (v10). Reset to 0
   *  at each season wrap-up. */
  /** The week a medical withdrawal fired, so advanceWeeks can halt ONCE on it. Derived, not
   *  meaningful state: optional, so every pre-existing save loads unchanged with no migration, and a
   *  reload simply re-derives it on the next tick that withdraws her. */
  medicalWithdrawalWeek?: number
  /** R12-15: the week an entered tournament resolved as a WALKOVER (she was inside her layoff when
   *  it came round). Same shape and the same job as `medicalWithdrawalWeek` above – it forfeits her
   *  entry fee, so the advance must halt on it once and the player must SEE it happen. Derived, not
   *  persisted; a reload re-derives it on the tick that walks her over. */
  walkoverWeek?: number
  seasonWins: number
  seasonLosses: number
  /** per-week/per-category signed-cents finance ledger (v11), accrued at the `addEvent` choke
   *  point and pruned to a 60-week trailing window. Feeds the Money breakdown/ledger so they
   *  survive the 60-event snapshot cap; see FinanceWeek in protocol.ts. */
  financeWeeks: FinanceWeek[]
  /** Season-Life (v12): per-week condition 0..100 (100 = fresh). Written ONLY by accrueCondition
   *  (pure arithmetic, zero main-stream RNG); fatigue is the derived 100 - condition, not stored. */
  condition: number
  /** the kid's active injury, or null when healthy. Wired in slice B but ALWAYS null here – Slice C
   *  populates it. The snapshot omits `sinceWeek`. */
  injury: (SnapshotInjury & { sinceWeek: number }) | null
  /** append-only injury log, pruned to the last 20 (Slice C writes it; empty in B). */
  injuryHistory: Array<{ kind: string; severity: string; week: number; weeksOut: number }>
  /** whether physio recovery is active (default = `coachIncludesPhysio(profile.coachTier)`, i.e.
   *  every rung but self-coached – the old rule was "a hired coach comes with a physio" and
   *  self-coaching is the only rung that is not a hire). The cost lever is billed in Slice C; in B
   *  the flag just reflects/sets the toggle. */
  physioActive: boolean
  /** Season planner (v13): booked family-vacation weeks. PURE player state – the price was
   *  quoted/charged from the `:vacation:` sub-stream at booking time, so nothing here can move
   *  the MAIN weekly draw sequence. Pruned to `week >= world.week` at housekeeping. */
  vacations: VacationBooking[]
  /** Season planner (v13): booked practice-match (friendly) weeks – same purity contract, priced
   *  off the `:practice:` sub-stream. */
  practices: PracticeBooking[]
  /** Season planner (v13): a carry-over injury-tau buff from a resort/elite vacation package;
   *  null when none is running. Applied POST-draw inside injuryTau. */
  recoveryBuff: RecoveryBuff | null
  /** Diary-1 D10 (v18): the durable milestone ledger behind the Memory card. The event feed
   *  prunes at 400 rows, so memories need their own record: first title and first final per tier,
   *  the first international entry, the first injury, each season's closing rank – captured AT THE
   *  MOMENT they happen (finalizeTournament / enterEvent / rollInjury / the season wrap-up).
   *  Bounded by construction (≤ 6+6+1+1 + one row per season), so it is never pruned. Capture is
   *  SILENT – the milestone EVENTS that already exist keep announcing; this ledger only remembers. */
  milestones: Milestone[]
  /** ITF ANNUAL ENTRY CAP (v15): the absolute WEEK of every INTERNATIONAL event she has entered.
   *
   *  Why a persisted ledger rather than a derivation off `results`: the kid's result row is
   *  AWARD-ONLY (`finalizeTournament` writes it `if (points > 0)`), so since wave B's first-round
   *  zero a first-round exit leaves NO trace in the ledger – and first-round exits are precisely
   *  the entries this cap exists to count. `world.entries` cannot do it either: `ensureSeason`
   *  prunes it to FUTURE events, so a played entry disappears the week it is played.
   *
   *  One number per entry (the event's week), not a counter, so "how many this season" is a filter
   *  rather than a value that has to be reset correctly – a missed reset is then impossible. At
   *  most one international entry can exist per week (enterEvent allows one tournament a week), so
   *  the week identifies the entry uniquely and a withdrawal can remove exactly its own slot.
   *  Pruned to the current season onward at housekeeping, so it is bounded by the cap itself. */
  internationalEntryWeeks: number[]
  /** WHO SHE TRAINS WITH (v23): a roster coach's id, or `null` for the parent on the court.
   *
   *  Only the id is stored. The roster itself is a pure derivation of `seed` (engine/coach.ts
   *  buildCoachRoster), so it can never desync from the career that hired off it, and an id saved
   *  today resolves years later without a migration. `profile.coachTier` records the rung they
   *  chose at ONBOARDING; this records who she trains with NOW, and the two part company the first
   *  time the Coach Market is used. Everything the engine bills or grows from reads THIS. */
  coachId: string | null
  /** DOES THE COACH COME TO TOURNAMENTS (v24)? A competition week is not billed as a coaching week
   *  by default - she spends it in a draw, not on his court - and this buys him for those weeks
   *  anyway. Default FALSE, which is the owner's own framing: the automatic behaviour is that
   *  competition weeks are not coach weeks, and the toggle is what adds him back.
   *
   *  It moves BOTH the bill and the development rate (coachWorksThisWeek), because a coach who is
   *  not paid for a week is not at that week. That is what keeps it a decision. */
  coachOnEventWeeks: boolean
}

export const STARTING_FUNDS_CENTS: Record<FamilyBackground, number> = {
  wealthy: 120_000_00,
  middle: 25_000_00,
  working: 8_000_00,
}

// The economy tuning surface now lives in ./economy (the owner's single "ручки регулировки"
// knob object). These aliases keep the old call sites + the public PARENT_INCOME_CENTS export
// (imported by tests) pointing at that one source of truth.
export const PARENT_INCOME_CENTS = ECONOMY.parentIncomeCents
// ⚠ `EXPENSE_RANGE = ECONOMY.expenseRangeCents` lived here – the two-band weekly coaching draw.
// The ladder replaced it with a per-tier, per-age HOURLY band; resolveBaseCosts reads it through
// `coachRateBandCents` (engine/coach.ts) so the age lookup and the band live in one place.

// Flavor lists are background-aware but a flavor is always chosen with ONE `pickInt`
// (a single rng() call regardless of list length), so the per-tick draw count is
// identical across backgrounds. middle keeps the original lists verbatim.
const TRAIN_EVENTS = [
  'Coaching block: technique drills',
  'Coaching block: footwork and conditioning',
  'Practice sets at the local club',
  'Sparring with the older kids',
  'Video session: studying her last matches',
]

const REST_EVENTS = [
  'Light week: school catches up',
  'Family weekend away from the courts',
  'Recovery week: stretching and pool',
  'Hitting for fun, no drills',
  'Off week: she reread her favorite book',
]

// working can't afford video analysis – swap that one line for a public-courts clinic.
const WORKING_TRAIN_EVENTS = TRAIN_EVENTS.map((e) =>
  e === 'Video session: studying her last matches' ? 'Group clinic at the public courts' : e,
)

// wealthy adds premium recovery lines to the rest pool.
const WEALTHY_REST_EVENTS = [...REST_EVENTS, 'Physio session', 'Massage & recovery']

function trainFlavors(background: FamilyBackground): string[] {
  return background === 'working' ? WORKING_TRAIN_EVENTS : TRAIN_EVENTS
}

function restFlavors(background: FamilyBackground): string[] {
  return background === 'wealthy' ? WEALTHY_REST_EVENTS : REST_EVENTS
}

const SEASON_MIN_FUTURE = 26 // always keep at least this many future weeks scheduled
const SEASON_CHUNK = 52 // generate the calendar one deterministic year-block at a time
const RESULTS_WINDOW = 52 // ranking window; results older than this never count → prunable
const EVENTS_CAP = 400 // non-`keep` events beyond this are pruned oldest-first
const SNAPSHOT_EVENTS = 60 // events surfaced in a snapshot
const FINANCE_WEEKS = 60 // trailing weeks of the per-category finance ledger retained (12w + a full 52w season)
const SNAPSHOT_FINANCIAL_EVENTS = 50 // financial transactions surfaced to the ledger, cap-independent of `events`
const UPCOMING_WEEKS = 8 // calendar horizon surfaced in a snapshot

function addEvent(world: WorldState, e: Omit<WorldEvent, 'id'>): void {
  world.events.push({ id: world.nextEventId++, ...e })
  // Every financial event (amountCents present) also folds into the persisted finance ledger –
  // the single choke point that captures income/coaching/sponsor/gear/stringing/travel/entry with
  // zero call-site changes, and (unlike `events`) survives pruning so the Money breakdown stays
  // window-accurate. `amount === 0` sponsored line-items move no cash, so they're skipped.
  if (e.amountCents !== undefined && e.amountCents !== 0) accrueFinance(world, e.week, e.category ?? 'other', e.amountCents)
}

// Fold one financial delta into financeWeeks: find-or-create the week entry (keeping the array
// week-ascending – the common case is appending the current, newest week) and add into its category.
function accrueFinance(world: WorldState, week: number, category: WorldEventCategory, amountCents: number): void {
  let entry = world.financeWeeks.find((w) => w.week === week)
  if (!entry) {
    entry = { week, byCategory: {} }
    const last = world.financeWeeks[world.financeWeeks.length - 1]
    if (!last || week >= last.week) world.financeWeeks.push(entry)
    else world.financeWeeks.splice(world.financeWeeks.findIndex((w) => w.week > week), 0, entry)
  }
  entry.byCategory[category] = (entry.byCategory[category] ?? 0) + amountCents
}

/** THE SEASON'S IDENTITY: the 0-based index of the 52-week block a week belongs to.
 *
 *  Pure integer arithmetic on the absolute week – no calendar, no date, nothing that can drift.
 *  It is the ONLY thing allowed to identify a season: the wrap-up milestone key, the "already
 *  banked?" guard on `seasonHistory` and the row it writes all key on this. The season year the
 *  player READS is derived from it (`seasonYear` in shared/dates.ts), never the other way round –
 *  see SeasonHistoryEntry.seasonIndex for the season that went missing when it was. */
export function seasonIndexOf(week: number): number {
  return Math.floor(week / WEEKS_PER_YEAR)
}

/** The first week of the 52-week season block a week belongs to. THE ONE definition of "this
 *  season" for money: the Money screen's "This season" window and the end-of-season summary both
 *  read it, so a season can never mean two different spans on two surfaces (R11-12a). */
export function seasonStartWeek(week: number): number {
  return seasonIndexOf(week) * WEEKS_PER_YEAR
}

/** Pure category-accurate fold of `financeWeeks` from `fromWeek` onward (inclusive). No world
 *  dependency, so the bench and tests call it directly. income/expense/net are derived from the
 *  aggregated per-category totals, so `netCents === incomeCents - expenseCents === Σ byCategory`. */
export function financeWindow(financeWeeks: FinanceWeek[], fromWeek: number): FinanceWindow {
  const byCategory: Partial<Record<WorldEventCategory, number>> = {}
  for (const w of financeWeeks) {
    if (w.week < fromWeek) continue
    for (const [cat, amt] of Object.entries(w.byCategory) as [WorldEventCategory, number][]) {
      byCategory[cat] = (byCategory[cat] ?? 0) + amt
    }
  }
  let incomeCents = 0
  let expenseCents = 0
  for (const amt of Object.values(byCategory)) {
    if ((amt ?? 0) > 0) incomeCents += amt!
    else expenseCents += -(amt ?? 0)
  }
  return { startWeek: fromWeek, byCategory, incomeCents, expenseCents, netCents: incomeCents - expenseCents }
}

/** DENSE per-week income/expense over `[fromWeek, toWeek]` – the Home budget card's chart series.
 *
 *  Dense is the whole point, and the reason this is not a `.map` over `financeWeeks`: that ledger
 *  only holds weeks that HAD a financial event, so a fortnight with nothing in it simply is not
 *  there, and a chart plotted straight off it would silently close the gap and draw a quiet
 *  stretch as if it never happened. Every week in the span gets a bar, zero-valued when the ledger
 *  is silent about it.
 *
 *  Pure (no world dependency), and the same sign convention `financeWindow` folds by: positive
 *  category totals are income, negative ones are spend, reported as a magnitude. */
export function financeSeries(
  financeWeeks: FinanceWeek[],
  fromWeek: number,
  toWeek: number,
  /** what the family has RIGHT NOW, i.e. at the end of `toWeek`. The running balance is walked
   *  backwards from it, so the series can never drift away from the funds the card prints above the
   *  chart – they are the same number by construction. Defaults to 0 for callers that only want the
   *  in/out shape. */
  endBalanceCents = 0,
): FinanceWeekPoint[] {
  const byWeek = new Map<number, FinanceWeek>()
  for (const w of financeWeeks) byWeek.set(w.week, w)
  const out: FinanceWeekPoint[] = []
  for (let week = fromWeek; week <= toWeek; week++) {
    let incomeCents = 0
    let expenseCents = 0
    for (const amt of Object.values(byWeek.get(week)?.byCategory ?? {})) {
      if ((amt ?? 0) > 0) incomeCents += amt!
      else expenseCents += -(amt ?? 0)
    }
    out.push({ week, incomeCents, expenseCents, balanceCents: 0 })
  }
  // Backwards: the last week ends on today's funds, and every earlier week ends on the next week's
  // opening balance. Undoing week i means removing ITS OWN net from the balance it closed on.
  let running = endBalanceCents
  for (let i = out.length - 1; i >= 0; i--) {
    out[i].balanceCents = running
    running -= out[i].incomeCents - out[i].expenseCents
  }
  return out
}

// --- the kid as a match player -----------------------------------------------
// The kid has no persisted skills in Phase 3 (development lands in Phase 4), so the
// starting build is derived deterministically from the world seed. Stable across a
// career, and snapshotted into every kid-match event for replay.
/** The build she is BORN with – the pre-Phase-4 derivation, unchanged, from `seed:kid`.
 *  createWorld seeds `world.skills` with it and the v19 migration back-fills old saves with it, so
 *  adding development moved nobody's starting point by a hundredth. */
export function startingSkills(seed: string, _profile: PlayerProfile): KidSkills {
  const r = rngFromSeed(seed + ':kid')
  return {
    serve: pickInt(r, 40, 58),
    ret: pickInt(r, 40, 58),
    composure: pickInt(r, 35, 55),
    stamina: pickInt(r, 40, 60),
  }
}

export function kidMatchPlayer(world: { seed: string; profile: PlayerProfile; skills?: KidSkills }): MatchPlayer {
  // Her CURRENT build when the world has one (every world does since v19); the birth derivation is
  // the fallback for the handful of pure callers that build a player without a full world.
  const s = world.skills ?? startingSkills(world.seed, world.profile)
  return {
    id: KID_ID,
    // Round-7 item 17: full "First Last" (was first-name-only) so the match viewer's
    // under-court labels short-name the kid the same way the opponent already is
    // ("V. Martin", not "Vera"). formatShortName is applied at the display layer.
    name: `${world.profile.kidName} ${world.profile.kidLastName}`.trim(),
    serve: s.serve,
    ret: s.ret,
    composure: s.composure,
    stamina: s.stamina,
  }
}

/** THE COMPOSITION POINT: the kid exactly as she steps on court. Her raw build, scaled by the
 *  CONDITION factor (R9-19) and then by the surface x play-style table (docs/specs/surface-style.md).
 *  Both are pure arithmetic with ZERO RNG, they compose multiplicatively, and every path that puts
 *  her in a match – the shadow tournament, the practice friendly, the exhibition viewer – builds her
 *  here, so the modifiers land exactly once per match. `all-court` (and any untouched attribute)
 *  comes back byte-identical to the pre-slice condition-only scaling. */
export function kidMatchPlayerFor(
  world: { seed: string; profile: PlayerProfile; condition: number },
  surface: Surface,
): MatchPlayer {
  const raw = kidMatchPlayer(world)
  const factor = conditionMatchFactor(world.condition)
  return applySurfaceStyle(
    {
      ...raw,
      serve: raw.serve * factor,
      ret: raw.ret * factor,
      composure: raw.composure * factor,
      stamina: raw.stamina * factor,
    },
    world.profile.playStyle,
    surface,
  )
}

function cohortIds(world: WorldState): string[] {
  return world.cohort.map((p) => p.id)
}

function eventById(world: WorldState, id: string): SeasonEvent | undefined {
  return world.season.find((e) => e.id === id)
}

// --- rolling calendar --------------------------------------------------------
// Extend the season in whole deterministic year-blocks until at least
// SEASON_MIN_FUTURE weeks ahead are scheduled, then drop resolved (past) weeks and
// any entries pointing at events that no longer lie in the future.
export function ensureSeason(world: WorldState): void {
  // Round 5 item 23: notify the player when a NEW block of the calendar appears –
  // but not for the very first block a career/migration ever generates (nothing to
  // be "new" about a calendar the player has never seen yet).
  const hadSeason = world.season.length > 0
  const horizonChunk = Math.floor((world.week + SEASON_MIN_FUTURE) / SEASON_CHUNK)
  let maxWeek = world.week
  for (const e of world.season) if (e.week > maxWeek) maxWeek = e.week
  let coveredChunk = world.season.length ? Math.floor(maxWeek / SEASON_CHUNK) : -1
  while (coveredChunk < horizonChunk) {
    coveredChunk++
    const start = coveredChunk * SEASON_CHUNK
    world.season.push(...buildSeason(`${world.seed}:s${coveredChunk}`, start, SEASON_CHUNK, world.profile.background))
    if (hadSeason) addEvent(world, { week: world.week, type: 'info', text: 'New events on the calendar' })
  }
  world.season = world.season.filter((e) => e.week >= world.week).sort((a, b) => a.week - b.week)
  const future = new Set(world.season.filter((e) => e.week > world.week).map((e) => e.id))
  world.entries = world.entries.filter((id) => future.has(id))
}

// --- ranking helpers ---------------------------------------------------------
//
// TWO TABLES, ONE LEDGER (docs/specs/two-ladders.md, the owner 29.07). Local / Regional / National
// pay into a NATIONAL table; J30 / J60 / J300 pay into the ITF junior table. Nothing crosses: in the
// real sport a national result produces zero ITF points, because Reg 10's list of ranking
// tournaments is closed and contains only ITF grades, while federations import ITF results at their
// own valuation and never the reverse.
//
// It costs nothing to store, which is the nice part: a result row already carries the `tier` it was
// won at, so a track is a FILTER over the ledger we already keep. Two tables = two folds. No schema
// bump, no migration, no golden save.

/** Does this result pay into `track`? A row with no tier is pre-r5 history and counts as domestic -
 *  it can only have come from the rungs that existed then. */
export function inTrack(track: LadderTrack): (r: SeasonResult) => boolean {
  return (r) => (r.tier ? TIERS[r.tier].track === track : track === 'domestic')
}

function rankingFor(world: WorldState, track: LadderTrack): RankingRow[] {
  return computeRanking(world.results, world.week, [...cohortIds(world), KID_ID], inTrack(track))
}

/** THE table when only one is meant: the ITF one. It is what opens the international rungs and what
 *  the game is about. Callers that need the domestic side ask for it by name. */
function fullRanking(world: WorldState): RankingRow[] {
  return rankingFor(world, 'itf')
}

function domesticRanking(world: WorldState): RankingRow[] {
  return rankingFor(world, 'domestic')
}

/** Refresh the cheap-access rank caches. `kidRank` stays the ITF one - it is the number the ladder
 *  and the standings are about - and the domestic rank rides beside it for the screens that show her
 *  place before she has an international result at all. */
export function recomputeKidRank(world: WorldState): void {
  const row = fullRanking(world).find((r) => r.playerId === KID_ID)
  world.kidRank = row?.rank ?? world.cohort.length + 1
  const dom = domesticRanking(world).find((r) => r.playerId === KID_ID)
  world.kidRankDomestic = dom?.rank ?? world.cohort.length + 1
}

// --- milestones (never pruned) -----------------------------------------------
function fireMilestone(world: WorldState, key: string, text: string): void {
  if (world.events.some((e) => e.milestoneKey === key)) return
  addEvent(world, { week: world.week, type: 'milestone', text, keep: true, milestoneKey: key })
}

/** Diary-1 D10: remember a moment in the durable ledger. Idempotent per `milestoneKey` (a first
 *  can only happen once), SILENT (no event – the existing milestone events keep announcing), and
 *  pure state: zero draws on any stream, so no capture can ever move the frozen MAIN pins. */
function captureMilestone(world: WorldState, m: Milestone): void {
  const key = milestoneKey(m)
  if (world.milestones.some((x) => milestoneKey(x) === key)) return
  world.milestones.push(m)
}

/** R10-9: how many finished seasons the career history keeps (newest wins). 30 years of junior/
 *  pro career is far past the game's horizon – the cap exists so the save has a hard ceiling. */
const SEASON_HISTORY_CAP = 30

// --- season wrap-up (Round 5 items 16/21; round-7 item 4) ---------------------
// Fires once, the moment the world ticks into a season year's first off-season week
// (see calendar.ts's isOffSeasonWeek). Season figures are read back off the EXISTING
// ledgers for the just-finished year, EXCEPT W-L which come from the running counters
// (round-7: "count as you go … don't parse text", so pruning can't lose them):
//  - season points / best finish: results + tournament events in range.
//  - W-L: world.seasonWins / seasonLosses (accumulated at finalizeTournament).
//  - rank vs season start: results ledger replayed at the year's first week (still
//    inside the 52-week ranking window, so nothing has been pruned away yet).
//  - money (spent / earned / net): the SAME financeWindow fold the Money screen reads,
//    over the SAME season window (see below).
// The same figures are stored as the structured `lastSeasonSummary` (v10) for the
// SeasonSummaryDialog, then the season counters reset for the year ahead.
//
// R11-12a – THE MONEY BUG (owner, 120k season 2: "spend 59740 … no wait, the final popup adds it
// up wrong: the wallet says 95507"). The season's money figures were a scrape of `world.events`:
//   1. `events` is CAPPED (EVENTS_CAP = 400, pruned oldest-first) and `housekeep` prunes it
//      IMMEDIATELY BEFORE this function runs – so from the first season the cap bites, the earliest
//      financial events of the year were simply not in the array any more. Measured on the bench's
//      120k/wealthy career: season 2 came out $885 light for exactly this reason. The per-category
//      `financeWeeks` ledger exists precisely because `events` cannot be trusted for money
//      (protocol.ts, FinanceWeek) – the Money screen was moved onto it and this fold was missed.
//   2. the window was `[yearStart, wrapWeek)` – it EXCLUDED the wrap-up week's own costs, which the
//      tick has already charged by the time this runs, while the Money screen's "This season"
//      window includes them (another $174–$381 a season on the same bench career).
//   3. and one figure was doing two jobs: the popup's single line is a NET delta, while the number
//      the owner was comparing it against – the wallet's donut centre – is GROSS SPEND. On that
//      same career the two are $47,371 and $73,316: both correct, neither the other. So the summary
//      now banks spend and income SEPARATELY, and the popup can show what the wallet shows.
// The fold is exhaustive over the ledger's categories by construction (financeWindow walks
// `byCategory`), so a NEW expense category can never be forgotten here again – there is no list to
// forget it from. Reconciled cent-for-cent against the wallet, and against the change in
// `fundsCents` itself, in tests/round11.test.ts.
function maybeFireSeasonWrapUp(world: WorldState): void {
  if (world.week % WEEKS_PER_YEAR !== WEEKS_PER_YEAR - OFF_SEASON_WEEKS) return
  // THE SEASON, IDENTIFIED BY ITS INDEX – and the year it is DISPLAYED as, derived from that index.
  // Everything below that names a season (the milestone key, the milestone text, the summary's
  // label, the history row and its dedup guard) reads one of these two, so they cannot disagree.
  //
  // ⚠ THE BUG THIS REPLACES (fix/world-trio). The label and the identity were the same value –
  // `weekYear(yearStart)`, the calendar year of the season's first Monday – and that value repeats:
  // 52 weeks is 364 days, so the opening Monday walks ~1.25 days earlier a year and steps back over
  // New Year at season 5. weekYear(208) and weekYear(260) are BOTH 2035, so when season 5 wrapped,
  // the `some(h => h.year === …)` guard below saw 2035 already banked (by season 4) and dropped
  // season 5's row on the floor. A whole season vanished from the Stats table at age 19.
  const seasonIndex = seasonIndexOf(world.week)
  const displayYear = seasonYear(seasonIndex)
  const yearStart = seasonStartWeek(world.week)
  const wrapWeek = world.week

  const inRange = (w: number) => w >= yearStart && w < wrapWeek

  const seasonPoints = world.results
    .filter((r) => r.playerId === KID_ID && inRange(r.week))
    .reduce((sum, r) => sum + r.points, 0)

  let bestFinish: number | null = null
  for (const e of world.events) {
    if (!inRange(e.week)) continue
    if (e.type === 'tournament' && e.finishIdx !== undefined) {
      if (bestFinish === null || e.finishIdx < bestFinish) bestFinish = e.finishIdx
    }
  }

  const wins = world.seasonWins
  const losses = world.seasonLosses

  // The season's money, off the pruning-proof per-category ledger, over the window that ENDS ON
  // the wrap-up week (inclusive – `financeWindow` has no upper bound and the ledger holds nothing
  // past the current week). That window is exactly what the Money screen's "This season" shows at
  // this moment, so the popup and the wallet agree by construction. The two remaining off-season
  // weeks (50, 51) still spend money and the wallet keeps counting them into the same 52-block –
  // a figure computed HERE cannot know them, and it should not: it describes the season played.
  const seasonMoney = financeWindow(world.financeWeeks, yearStart)
  const spentCents = seasonMoney.expenseCents
  const earnedCents = seasonMoney.incomeCents
  const fundsDeltaCents = seasonMoney.netCents

  // Season-Life slice C: weeks lost to injury inside [yearStart, wrapWeek). Derived from
  // injuryHistory (each entry spans [week - weeksOut, week)) + the current injury if she is
  // still out at the wrap – no extra persisted counter, so no schema bump.
  const overlap = (lo: number, hi: number) => Math.max(0, Math.min(hi, wrapWeek) - Math.max(lo, yearStart))
  let weeksInjured = 0
  for (const h of world.injuryHistory) weeksInjured += overlap(h.week - h.weeksOut, h.week)
  if (world.injury) weeksInjured += overlap(world.injury.sinceWeek, wrapWeek)

  // R12-S1 – "#89 ↓88 FROM #1" (owner's screenshots, BOTH careers, season 2). She did not start
  // season 2 ranked first; nobody did.
  //
  // THE BUG. This line used to be a REPLAY:
  //     computeRanking(world.results, yearStart, [...cohortIds(world), KID_ID])
  // – "rank everyone as they stood on the season's first week" – and the comment above it claimed
  // the data was still there ("still inside the 52-week ranking window, so nothing has been pruned
  // away yet"). That claim is false, and it is false by 49 weeks. The wrap fires at yearStart + 49,
  // and `pruneResults` keeps `world.week - r.week <= 52`, i.e. weeks from yearStart − 3 onward. The
  // ranking AT yearStart needs the 52 weeks BEFORE it – the whole season that earned her the rank
  // she carried in – and every one of them has already been pruned. So `computeRanking` ran over a
  // ledger holding almost nothing, virtually the entire field came out on 0 points, and competition
  // ranking gives every member of a tie the SAME rank: #1. Her "season start rank" was an artefact
  // of an empty table, and it read as a fall from the top of the world.
  //
  // It is not recoverable at wrap-up – the rows are gone – so it is CAPTURED instead, at the moment
  // it is true: the top of the tick into the season's first week (see tickWeek), from the rank she
  // carried in. Persisted, because a save can be closed mid-season (schema v17). null on a career
  // migrated from an older save mid-season, which every reader already handles as "not recorded".
  const startRank = world.seasonStartRank
  const rankMove =
    startRank === null || startRank === world.kidRank
      ? ''
      : startRank > world.kidRank
        ? ` (↑${startRank - world.kidRank} vs season start)`
        : ` (↓${world.kidRank - startRank} vs season start)`

  // R12-S2 (owner's screenshot): the row LABEL is already "Best result", so the value said
  // "best Champion". The value is the finish, and nothing else – "Champion" / "Runner-up" /
  // "Semifinalist". The no-tournaments phrasing is untouched: it is a sentence, not a finish.
  // Checked against every consumer: SeasonSummaryDialog's "Best result" row (the row this fixes),
  // the wrap-up milestone below (which reads as a bare clause between two others, and reads better
  // without the stray adjective), and the Stats season table – which never used this string at all,
  // it renders `bestFinish` through `finishLabel` itself. Summaries banked BEFORE this change keep
  // their stored wording, which is correct: a recap is a record of what was said.
  const bestText = bestFinish === null ? 'no tournaments played' : finishLabel(bestFinish)
  const fundsSign = fundsDeltaCents >= 0 ? '+' : '-'
  const fundsText = `${fundsSign}$${Math.abs(Math.round(fundsDeltaCents / 100)).toLocaleString('en-US')}`

  // ⚠ THE RANK IS NAMED (30.07, fix/ranking-truth). This read a bare "rank #N" off `world.kidRank`,
  // which was a both-ladders fold at the time, so the popup and Home agreed with each other (#4) and
  // disagreed with the Stats table (#128) - the owner's «Rank #4 on the home tab and end of season
  // popup seems strange since in stats I can clearly see #128». `kidRank` is honestly the ITF rank
  // now, and saying so is what stops the number being read as the only rank she has: a fourteen-year-
  // old who has not left the country yet ends her season around #130 internationally and that is not
  // a disappointing result, it is an accurate one. `LADDER_LABEL.itf` so the wording matches the
  // screens exactly.
  // ⚠ AND "UNRANKED" IS NOT A NUMBER. Found in the browser, one screen apart: a working-class girl who
  // never left the country ended her season with the Stats International tab reading "Unranked" and
  // this popup reading "#127" - the owner's original complaint, in a new pair of clothes. #127 is the
  // dense rank of the whole 0-point tie group, which is the thing `rankLabel` exists to refuse to
  // print. So the popup says what the table says, and the rank move (a diff between two of these
  // non-numbers) is suppressed with it.
  const rankedItf = kidPoints(world, 'itf') > 0
  const rankText = rankedItf ? `${LADDER_LABEL.itf} rank #${world.kidRank}${rankMove}` : `Unranked internationally`
  fireMilestone(
    world,
    `season-wrap-${seasonIndex}`,
    `Season ${displayYear} wrap-up: ${rankText} · ` +
      `${seasonPoints} pts this season · ${bestText} · ${wins}-${losses} (W-L) · funds ${fundsText}`,
  )
  addEvent(world, { week: world.week, type: 'info', text: 'Off-season: rest, school, family time.' })

  world.lastSeasonSummary = {
    seasonYear: displayYear,
    endRank: world.kidRank,
    startRank,
    points: seasonPoints,
    wins,
    losses,
    bestResultText: bestText,
    fundsDeltaCents,
    spentCents,
    earnedCents,
    weeksInjured,
    // v21: what the scholarship was actually worth this season. It exists nowhere else – the travel
    // half is a discount on the travel line, not an income row, so no window fold can recover it.
    // Read HERE, at week 49, which is after the year's last trip and before the review resets it.
    academyCoveredCents: world.academy?.coveredCents ?? 0,
  }
  // R10-9: the same figures also APPEND to the career history (the summary above is overwritten
  // every year). Guarded on the season INDEX, so a re-entry for a season already banked is a no-op –
  // the append is idempotent exactly like the wrap-up milestone, whose key is the same index. This
  // guard is where the dropped season died; an index makes the collision unrepresentable.
  if (!world.seasonHistory.some((h) => h.seasonIndex === seasonIndex)) {
    world.seasonHistory.push({
      seasonIndex,
      endRank: world.kidRank,
      points: seasonPoints,
      wins,
      losses,
      fundsDeltaCents,
      endFundsCents: world.fundsCents,
      ...(bestFinish === null ? {} : { bestFinish }),
    })
    // Bounded: a career this long is beyond the game's horizon, but the save must never grow
    // without a ceiling. Oldest seasons drop out first.
    if (world.seasonHistory.length > SEASON_HISTORY_CAP) {
      world.seasonHistory = world.seasonHistory.slice(-SEASON_HISTORY_CAP)
    }
  }
  // D10: the season's closing rank joins the durable ledger – one row per season, keyed on the
  // same index as the wrap-up milestone and the history row, so all three name the same season.
  captureMilestone(world, { type: 'season-rank', week: wrapWeek, seasonIndex, rank: world.kidRank })
  // The season that just wrapped is banked in the summary – start the next one clean.
  world.seasonWins = 0
  world.seasonLosses = 0
}

// --- finish / stage labels ---------------------------------------------------
// finish index = rounds - round (0 = champion). Higher = earlier exit.
// Exported for R10-9's history table, which renders a season's stored `bestFinish` index with the
// SAME wording the tournament finale and the wrap-up milestone use.
export function finishLabel(finish: number): string {
  switch (finish) {
    case 0:
      return 'Champion'
    case 1:
      return 'Runner-up'
    case 2:
      return 'Semifinalist'
    case 3:
      return 'Quarterfinalist'
    default:
      return `Round of ${2 ** finish}`
  }
}

// Stage name of a match played in the given round of a draw of `drawSize`.
function stageLabel(round: number, drawSize: number): string {
  const remaining = drawSize / 2 ** round
  if (remaining === 2) return 'Final'
  if (remaining === 4) return 'Semifinal'
  if (remaining === 8) return 'Quarterfinal'
  return `Round of ${remaining}`
}

// --- Season-Life: condition + availability gate (slice B) --------------------
// The condition MATH (clamp / matchDrain / tournamentRunStrain / conditionMatchFactor) and the
// week-TYPE predicates (isExamWeek / isBlackoutWeek) were extracted to ./condition and
// ./season/calendar by the rival-life slice, so the AI cohort can run the SAME rules without a
// world.ts import cycle. They are re-exported here under their historical names – every existing
// call site and test import keeps working, and there is still exactly one implementation.
export { matchDrain, runFatigueExtra, tournamentRunStrain, conditionMatchFactor } from './condition'
export { isExamWeek, isBlackoutWeek } from './season/calendar'

/** The train/rest slider's recovery bonus for a MATCH-FREE week (round-9 owner redesign):
 *  threshold-based on plan.rest, first (highest) matching threshold wins, never interpolated –
 *  the 60/40 preset earns +2, 75/25 earns +1, the 85/15 grind earns 0. Pure, integer. */
export function restRecoveryBonus(restPercent: number): number {
  for (const { minRest, bonus } of ECONOMY.condition.restRecoveryBonus) {
    if (restPercent >= minRest) return bonus
  }
  return 0
}

/** Pure INTEGER condition accumulator (zero RNG). Round-9 owner redesign: fatigue comes from
 *  MATCHES (matchDrain, applied when a run COMMITS at finalizeTournament – so a skipped event
 *  week (R9-9) or a walkover costs nothing by construction); recovery comes from TIME:
 *  recoveryBase every week, + the train/rest slider bonus on match-free weeks only, + the
 *  physio bonus while the retainer runs (R9-14 – the billed value finally visible), + the
 *  blackout bonus on off-season/exam weeks. Clamps to [min,max]. */
export function accrueCondition(world: WorldState, playedThisWeek: boolean): void {
  const c = ECONOMY.condition
  // WEEK-TYPE RECOVERY LADDER (season-planner spec §4, owner 25.07 – 0 / base / base+slider):
  //  - TOURNAMENT week: matchWeekRecoveryBase (0 shipped) – travel + competition, not rest;
  //  - PRACTICE week: the base only – she keeps it but FORFEITS the slider rest bonus, because
  //    she played, even if the match was a friendly (the drain lands in resolvePractice);
  //  - free / vacation week: recoveryBase + the rest-slider bonus (the vacation's package gain
  //    rides on top in resolveVacation).
  // The practice flag is read off world state (not a parameter) so the signature – and with it
  // the zero-RNG, arity-2 contract the B1 invariance test pins – stays exactly as it was.
  const practiced = !playedThisWeek && practiceForWeek(world, world.week) !== undefined
  let recovery = playedThisWeek
    ? c.matchWeekRecoveryBase
    : practiced
      ? c.recoveryBase
      : c.recoveryBase + restRecoveryBonus(world.plan.rest)
  if (world.physioActive) recovery += ECONOMY.physio.conditionBonusPerWeek
  if (isBlackoutWeek(world.week)) recovery += c.blackoutBonus
  world.condition = clamp(world.condition + recovery, c.min, c.max)
}

/** The kid's age (whole years) in a given absolute week – the same arithmetic the snapshot uses. */
export function ageAtWeek(week: number): number {
  return START_AGE_YEARS + Math.floor(week / WEEKS_PER_YEAR)
}

/** Pure age gate for a tier (ladder-up): the junior tour is 13+, the domestic ladder has no
 *  minimum. No world/RNG dependency, so the childhood prologue and the tests call it directly. */
export function isTierAgeOpen(tier: TierId, ageYears: number): boolean {
  const minAge = TIERS[tier].minAgeYears
  return minAge === undefined || ageYears >= minAge
}

// --- the ITF annual entry cap (docs/research/ranking-points-by-tier.md §2) --------------------
// The knob (the per-age table and the tier set) lives in ECONOMY.entryCap with the rest of the
// tuning surface; everything below is logic that reads it, so the numbers can be retuned without
// touching a line of this file. All three helpers are pure and draw ZERO RNG on any stream – an
// entry rule is a post-draw gate, so the frozen MAIN capture cannot move.

/** Is this tier one the ITF counts? Only the international rungs; the domestic ladder is ours. */
export function isCappedTier(tier: TierId): boolean {
  return ECONOMY.entryCap.cappedTiers.includes(tier)
}

/** How many international events she may enter in the season she is `ageYears` old.
 *  MAX_SAFE_INTEGER = unrestricted (17+), the same "no ceiling" sentinel `enterPointBand` uses. */
export function annualEntryLimit(ageYears: number): number {
  const table = ECONOMY.entryCap.perYearByAge
  return table[ageYears] ?? table.default
}

/** Her allowance for the season CONTAINING `week`, and how much of it is already spent.
 *
 *  Scoped to the EVENT's season, never to today's, for the same reason `layoffCovering` is scoped
 *  to the event's week (R10-17): a rule about a future event has to be asked about that event's
 *  future, or the December horizon reports next season's fixture against this season's ledger.
 *  "This season" is `seasonStartWeek` – THE definition the round-11 money accounting introduced
 *  and the wrap-up shares (R11-12a) – rather than a second spelling of the same arithmetic.
 *
 *  Age and season are the same boundary here: `ageAtWeek` is START_AGE_YEARS + floor(week/52) and
 *  `seasonStartWeek` is floor(week/52)*52, so our season block IS the real rule's birthday year. */
export function entryCapUsage(world: WorldState, week: number): EntryCapUsage {
  const from = seasonStartWeek(week)
  const used = world.internationalEntryWeeks.filter((w) => w >= from && w < from + WEEKS_PER_YEAR).length
  const limit = annualEntryLimit(ageAtWeek(week))
  return { used, limit, remaining: Math.max(0, limit - used) }
}

/** Whether the kid can currently ENTER `event`, at three levels. One helper, wired at three engine
 *  surfaces (enterEvent / upcomingEvents / advanceWeeks) so the gate can never desync. Precedence
 *  is injured > too-young > capped > unavailable > medical > fatigued.
 *   - 'blocked' HARD stops entry: `injured` (she is already out), `unavailable` (too young for the
 *     tier / school exams / off-season / a booked family vacation – WEEK-level reasons, so they
 *     name the week), `capped` (the annual entry cap: she has spent this SEASON's allowance of
 *     international entries – the one block that lifts by itself, when the year turns), and
 *     `medical` (the doctor's veto below ECONOMY.availability.medicalFloor).
 *   - 'caution' is a SOFT warning that still ALLOWS entry: `fatigued` (condition below the tier's
 *     floor). The owner's call: racing tired is a tough-parent CHOICE with emergent consequences
 *     (deeper condition hole now, higher injury risk), not a forbidden action.
 *   - 'ok' is clear.
 *
 *  The 'medical' branch (owner R9-19b, shipped with the Wave-2 tuning slice) is the FIRST hard
 *  body-gate in the game and the single exception to "the parent may push": under the floor she is
 *  not cleared to play at all. It sits far below every tier caution floor (20-45), so a normal
 *  career never meets it – it exists for the pathological zone the fatigue bench found (a
 *  self-coached grinder competing at condition 0 for ~4.4% of her weeks). */
export interface AvailabilityStatus {
  level: 'ok' | 'caution' | 'blocked'
  reason?: 'injured' | 'fatigued' | 'unavailable' | 'medical' | 'capped'
  detail?: string
  /** 'capped' only: the season's allowance and what she has spent of it, so every surface prints
   *  the ENGINE's own numbers for THIS event instead of re-deriving them (see `pointsToEnter`). */
  entryCap?: EntryCapUsage
}

/** What the doctor says about a body at `condition`, as ONE pure knob-driven rule read at BOTH
 *  medical surfaces – the entry gate (`availabilityStatus`) and the ARRIVAL check on the play week
 *  (`tickWeek` step 2). Owner 26.07:
 *    'withdraw' – under ECONOMY.availability.medicalFloor: not cleared, at any price. The single
 *                 exception to "the parent may push";
 *    'warn'     – in [medicalFloor, medicalWarningCeiling): she plays, and he warns the family
 *                 ("я вас предупреждаю о последствиях, формально запретить не могу");
 *    'clear'    – above the band: medicine has nothing to say (the tier fatigue caution still may).
 *  Pure integer comparison, zero RNG. A ceiling at or below the floor collapses the band to
 *  nothing, which is how the warning is switched off without touching the veto. */
export type MedicalClearance = 'withdraw' | 'warn' | 'clear'
export function medicalClearance(condition: number): MedicalClearance {
  const a = ECONOMY.availability
  if (condition < a.medicalFloor) return 'withdraw'
  if (condition < a.medicalWarningCeiling) return 'warn'
  return 'clear'
}

/** THE VETO AS A VERDICT – `medicalClearance` decided, phrased once. Every surface that has to
 *  REFUSE on medical grounds (tournament entry, and since the practice gate the friendly too) reads
 *  THIS, so the three of them cannot drift into three different sentences about the same doctor.
 *  Null = nothing to say, i.e. she is at or above the floor.
 *
 *  Shaped as an `AvailabilityStatus` because that is what the tournament gate returns and what the
 *  UI already knows how to render; `detail` is non-optional here so a caller can print it without a
 *  fallback. Pure integer comparison, zero RNG. */
export interface MedicalBlock {
  level: 'blocked'
  reason: 'medical'
  detail: string
}
export function medicalBlock(condition: number): MedicalBlock | null {
  if (medicalClearance(condition) !== 'withdraw') return null
  return { level: 'blocked', reason: 'medical', detail: 'Not cleared to play – she needs rest.' }
}
/** R10-17, AS ONE FUNCTION – "will she still be laid up in `week`?".
 *
 *  A layoff is a RANGE OF WEEKS: an injury with `weeksRemaining` to run covers
 *  `[world.week, world.week + weeksRemaining)`. The upper bound is EXCLUSIVE because `rollInjury`
 *  clears the injury at the TOP of week `world.week + weeksRemaining`, before anything else reads
 *  it – so the return week is already hers. That is also exactly the week the UI has been printing
 *  all along ("back wk {week + weeksRemaining}"), so the label and every lock tell one story.
 *
 *  R10-17 was the owner's playtest 26.07 – "the news said she is out until week 21, but at week 22
 *  and every week after, no tournament could be entered": `availabilityStatus` was asking "is she
 *  hurt TODAY?" about an event WEEKS away, which blacked out the whole 8-week horizon for the
 *  entire layoff. It fixed the ENTRY gate. F45-2 (27.07) found the same question being skipped
 *  outright in the ONSET sweep, where `rollInjury` cancelled every still-refundable entry no matter
 *  how far past her return it sat. Rather than a third spelling of the comparison, the rule now
 *  lives here and the three surfaces that ask it – the entry gate, the planner and the onset sweep –
 *  all call this. Returns the active injury (so callers can quote `weeksRemaining` without
 *  re-deriving the window) or null.
 *
 *  NOT for "is she hurt right now" – that is a plain `world.injury !== null` on the current week. */
export function layoffCovering(world: WorldState, week: number): WorldState['injury'] {
  const injury = world.injury
  return injury !== null && layoffCoversWeek(world.week, injury.weeksRemaining, week) ? injury : null
}

/** R10-17's window as PURE ARITHMETIC, with no WorldState in sight.
 *
 *  R12-5b (owner playtest 27.07 – the planner sheet still rendered the Practice tab bookable
 *  during a 5-week layoff, and booking would have thrown) needs this comparison on the UI side of
 *  the wire, where there is a Snapshot and no world. Rather than let a component re-spell
 *  `week < currentWeek + weeksRemaining` – the fourth spelling of the rule R10-17 exists to make
 *  singular – the arithmetic is extracted here and BOTH shapes call it: `layoffCovering` for the
 *  engine, `layoffBlock` for anything holding a snapshot. Same comparison, one implementation.
 *
 *  `weeksRemaining` is nullable so a caller can pass `snapshot.injury?.weeksRemaining` straight in;
 *  null/undefined/0 all mean "no layoff". Pure integer comparison, zero RNG. */
export function layoffCoversWeek(
  currentWeek: number,
  weeksRemaining: number | null | undefined,
  week: number,
): boolean {
  return weeksRemaining !== null && weeksRemaining !== undefined && weeksRemaining > 0 && week < currentWeek + weeksRemaining
}

/** THE LAYOFF SENTENCE, written once. Four surfaces refuse a week because she is laid up – the
 *  entry gate, the planner's `assertPlannable` throw, the arrival gate and (since R12-5b) the
 *  planner SHEET's disabled Practice button – and a disabled button whose reason differs from the
 *  message the same click would have thrown is exactly the drift R10-16 is about. */
function injuredDetail(weeksRemaining: number): string {
  return `Injured – back in ${weeksRemaining} weeks.`
}

/** THE LAYOFF AS A BLOCK – the exact shape and role `medicalBlock` has, for the other half of the
 *  planner's body gate (R12-5b).
 *
 *  THE BUG (owner, round 12): the sheet asked `medicalBlock(condition)` and nothing else, so during
 *  a 5-week layoff the Practice tab rendered a live "Book the match" button whose click
 *  `assertPlannable` would have thrown on. The engine was right and the sheet was silent – the
 *  R10-16 doctrine in one line: every control must either act or be disabled WITH A REASON.
 *
 *  Takes the two facts a Snapshot already carries (its `week` and its `injury.weeksRemaining`), so
 *  the component needs nothing new on the wire and no world. Returns the SAME sentence
 *  `assertPlannable` throws, by construction. Null = she is free that week. */
export interface LayoffBlock {
  level: 'blocked'
  reason: 'injured'
  detail: string
}
export function layoffBlock(input: {
  /** the snapshot's current week */
  currentWeek: number
  /** the snapshot's active injury, or null when healthy */
  injury: { weeksRemaining: number } | null
  /** the week being planned */
  week: number
}): LayoffBlock | null {
  const weeksRemaining = input.injury?.weeksRemaining
  if (!layoffCoversWeek(input.currentWeek, weeksRemaining, input.week)) return null
  return { level: 'blocked', reason: 'injured', detail: injuredDetail(weeksRemaining!) }
}

export function availabilityStatus(world: WorldState, event: SeasonEvent): AvailabilityStatus {
  // The injury window is read against the EVENT's week, never today's (R10-17 – see layoffCovering).
  // Note the CONDITION-driven branches below stay current-week reads: her condition in a future week
  // is unknowable, which is why the doctor re-checks her on arrival.
  const layoff = layoffCovering(world, event.week)
  if (layoff !== null) {
    return { level: 'blocked', reason: 'injured', detail: injuredDetail(layoff.weeksRemaining) }
  }
  // Ladder-up: the junior international tour opens at 13. Our detailed sim starts at 14, so this
  // never fires today – it is wired now so the childhood prologue (Phase 6) inherits the rule for
  // free instead of re-deriving it, and so the tier table stays the single source of truth.
  const minAge = TIERS[event.tier].minAgeYears
  if (minAge !== undefined && !isTierAgeOpen(event.tier, ageAtWeek(event.week))) {
    return {
      level: 'blocked',
      reason: 'unavailable',
      detail: `${TIERS[event.tier].label} opens at ${minAge} – she is too young.`,
    }
  }
  // THE ITF ANNUAL ENTRY CAP – she has used her year's international allowance.
  //
  // Placed HERE, immediately after the tier's minimum age, because it is the same family of rule
  // from the same source: both are ITF eligibility, both are about how old she is, and the two
  // read as one paragraph rather than two unrelated gates. Precedence therefore runs
  // injured > too young > CAPPED > vacation/exam > medical > fatigued. Above the week-level
  // blackouts on purpose: an exam week tells her nothing she can act on, while "the allowance is
  // gone until the season turns" is the fact that should reshape the rest of her year.
  //
  // Deliberately BELOW `injured`: a layoff is the fresher, more urgent news and it names a return
  // week, whereas the cap will still be there to report the moment she is fit again.
  if (isCappedTier(event.tier)) {
    const cap = entryCapUsage(world, event.week)
    if (cap.remaining <= 0) {
      return {
        level: 'blocked',
        reason: 'capped',
        // Short dash only, and it must read as THIS YEAR rather than "never" – a parent who has
        // spent all fourteen has to understand she is capped for the season, not shut out.
        detail:
          `Year limit reached – ${cap.used} of ${cap.limit} international events at ` +
          `${ageAtWeek(event.week)}. A fresh allowance next season.`,
        entryCap: cap,
      }
    }
  }
  // Season planner: a booked family-vacation week is a HARD blackout – the family is away, so
  // nothing is enterable (spec §3). It outranks the exam/off-season blackout copy so the chip
  // names the actual reason she is unavailable.
  const vacation = vacationForWeek(world, event.week)
  if (vacation) {
    return { level: 'blocked', reason: 'unavailable', detail: vacationBlackoutDetail(vacation) }
  }
  if (isBlackoutWeek(event.week)) {
    return { level: 'blocked', reason: 'unavailable', detail: 'School exams this week – no tournaments.' }
  }
  // THE DOCTOR'S VETO: under the medical floor no tier is enterable, at any price. Ranked AFTER
  // the week-level blackouts (a vacation/exam week is unenterable for everyone, so it names the
  // week) and BEFORE the soft fatigue caution, which it replaces in the pathological zone.
  // The verdict itself comes from `medicalBlock`, shared with the practice gate.
  const medical = medicalBlock(world.condition)
  if (medical) return medical
  if (world.condition < ECONOMY.availability.minConditionToEnter[event.tier]) {
    return { level: 'caution', reason: 'fatigued', detail: 'Exhausted – racing risks injury.' }
  }
  return { level: 'ok' }
}

/** THE ENTRY GATE – the ONE rule that answers "may she enter THIS event, right now?".
 *
 *  Round-10 R10-5 (owner playtest): the tier POINT BAND used to be re-derived at every surface that
 *  needed it – inline in `enterEvent`, inline again in `upcomingEvents`, via `isTierEligible` in
 *  `advanceWeeks` – and absent from the fourth (the play-week resolution). `availabilityStatus`
 *  existed so the BODY/WEEK half could never desync, but nothing did that job for the band, so the
 *  band was free to drift, and it did: the owner was in a Local at 122 points (band [0, 85]) with no
 *  lock shown anywhere. This helper closes the hole – it is the only place the two halves are
 *  combined, and every gate reads it instead of re-deriving anything.
 *
 *  PRECEDENCE: the point band FIRST (it is the hard, permanent headline – "Reach N pts" /
 *  "Outgrown"), then availability (injured > unavailable > medical > fatigued). That is the order
 *  `enterEvent` threw in and the order `upcomingEvents` documented, so the wiring is a
 *  de-duplication, not a behaviour change.
 *
 *  SCOPE, and this is the subtle half of R10-5/R10-3: this gate governs ENTERING. It does NOT
 *  govern an entry already made. Once a list has CLOSED with her on it the fee is committed and the
 *  event plays (the owner's real-world rule, see `releaseOutgrownEntries`) – so a committed entry
 *  she has since outgrown is not "illegal", it is a decision that needs an exit, which is what
 *  `cancelEntry` (R10-13) is. Treating the entry gate's verdict as a lock on a committed entry is
 *  precisely what removed the escape and produced the R10-3 dead end.
 *
 *  Pure state, ZERO RNG draws. */
export interface EntryStatus {
  level: 'ok' | 'caution' | 'blocked'
  reason?: 'locked' | 'outgrown' | 'injured' | 'fatigued' | 'unavailable' | 'medical' | 'capped'
  detail?: string
  /** the tier's minPoints threshold, present only when a DOMESTIC rung is 'locked' (so the UI can
   *  say "Reach N pts"). */
  pointsToEnter?: number
  /** the ITF rank an international rung accepts down to, present only when one is 'locked' - the UI
   *  says "top 50" rather than a points number she can never read off her own table. */
  rankToEnter?: number
  /** 'capped' only: the season allowance behind the verdict (see AvailabilityStatus.entryCap). */
  entryCap?: EntryCapUsage
}
export function entryStatus(world: WorldState, event: SeasonEvent): EntryStatus {
  const tier = TIERS[event.tier]
  // AN ITF RUNG IS AN ACCEPTANCE LIST, not a points threshold (docs/specs/two-ladders.md). She gets
  // in on her ITF RANK, the same signal the AI field is drawn on, so the two sides of the same
  // event finally obey the same rule - see rank-plateau.md 2b for what it cost when they did not.
  if (tier.track === 'itf') {
    // The first international rung has no rank bar - it reads her DOMESTIC points, because she
    // cannot own an international ranking before she has played internationally and a rank gate
    // there would be a closed loop. Above it, the acceptance list takes over.
    const accepts = acceptanceRank(world, event.tier)
    if (accepts === undefined) {
      const [minPoints] = tier.enterPointBand
      const domestic = kidPoints(world, 'domestic')
      if (domestic < minPoints) {
        return {
          level: 'blocked',
          reason: 'locked',
          detail: `${tier.label} takes her on her national standing – ${minPoints} pts needed`,
          pointsToEnter: minPoints,
        }
      }
      return availabilityStatus(world, event)
    }
    // ⚠ UNRANKED IS NOT RANK ONE. With nobody holding an ITF point in week 1 the whole field ties at
    // zero, and competition ranking gives every member of a tie the SAME rank - so a fresh
    // fourteen-year-old reads as #1 and the top rungs would open to her on day one. You cannot be on
    // an acceptance list BY RANKING if you have no ranking, so the gate demands a counting ITF
    // result before it will read a position at all. (The same `hasResults` guard the econ bench
    // already puts on its rank arm, for the same reason.)
    const ranked = kidPoints(world, 'itf') > 0
    if (!ranked || world.kidRank > accepts) {
      return {
        level: 'blocked',
        reason: 'locked',
        detail: ranked
          ? `${tier.label} takes the top ${accepts} – she is #${world.kidRank}`
          : `${tier.label} takes the top ${accepts} – she has no international ranking yet`,
        rankToEnter: accepts,
      }
    }
    return availabilityStatus(world, event)
  }
  const minPoints = tier.enterPointBand[0]
  const points = kidPoints(world, 'domestic')
  if (points < minPoints) {
    return {
      level: 'blocked',
      reason: 'locked',
      detail: `Not enough ranking points for ${tier.label} yet (need ${minPoints})`,
      pointsToEnter: minPoints,
    }
  }
  if (outgrewTier(event.tier, points)) {
    return { level: 'blocked', reason: 'outgrown', detail: `You've outgrown ${tier.label} (${points} pts)` }
  }
  return availabilityStatus(world, event)
}

// --- THE ARRIVAL GATE (R12-15 / R12-3) ----------------------------------------------------------
//
// `entryStatus` above answers "may she ENTER this event?". Nothing answered the OTHER question the
// player asks every single week – "what will actually happen when this entered week arrives?" – so
// three surfaces answered it separately and one of them lied:
//
//   * `tickWeek` step 2 asked `world.injury !== null` and `medicalClearance(condition)` INLINE. Two
//     hand-rolled reads of rules that already exist as named functions (`layoffCovering` – the
//     R10-17 window – and `medicalBlock`), which is precisely the shape R10-5 was written to end.
//   * `composables/weekAhead.ts` asked NOTHING. It found the entered event for `week + 1` and
//     printed "🏆 Play {TIER} ▶", with a comment admitting the injury layoff was "deliberately NOT
//     a branch here".
//   * nothing at all reported that the committed entry was to a tier she has since OUTGROWN.
//
// THE OWNER'S DEAD CLICK (R12-15, the round's worst item), reproduced exactly on seed
// "r12-repro-12" at week 4: an injury onsets in week W; her entry for week W+1 is already PAST its
// deadline, so `rollInjury`'s F45-2 sweep deliberately leaves it alone (the fee is committed – "no
// refunds"); the sticky bar reads the entry and promises "🏆 Play Local ▶"; the click ticks the
// week, step 2 takes the walkover branch, and the week resolves with a single news line, no
// tournament, no refund, no dialog and no toast – `advanceWeeks` collected no stop reason at all
// (the injury was not FRESH that week, and a walkover was not a reason). No refund, no tournament,
// no error: the button did nothing a player could see.
//
// THE DIVERGENCE FROM THE PRACTICE PATH the owner noticed is right here. A booked friendly inside
// the layoff is cancelled AT ONSET by `rollInjury` and refunded in full, so the money visibly comes
// back and the injury dialog lists it. A post-deadline tournament entry is deliberately NOT
// cancelled – the fee is committed – so it rode silently into a walkover a week later with nothing
// surfacing it. The fee rule is correct and stays; what was missing is that the walkover must be
// ANNOUNCED (a stop reason, see `advanceWeeks`) and must not be PROMISED as a tournament (this
// verdict, carried to the button on the snapshot).
//
// So: ONE rule, three readers. `tickWeek` consumes it to resolve the week, `toSnapshot` previews it
// so the button can tell the truth, and the tests pin both halves. Pure state, ZERO RNG draws on
// any stream – the frozen MAIN capture (41550 / e6b0c709) cannot move, and by construction the
// verdicts are the same two comparisons step 2 already made, so nothing about a resolved week
// changed either.
export type ArrivalVerdict = 'play' | 'injured' | 'medical'
export interface ArrivalStatus {
  verdict: ArrivalVerdict
  /** player-facing reason; present exactly when `verdict !== 'play'` */
  detail?: string
  /** Her points have passed the tier's ceiling. NOT a block and never will be: once a list has
   *  closed with her on it the entry is COMMITTED and the event plays (R10-3 / R10-5 – treating a
   *  committed entry as illegal is what produced the round-10 dead end). It rides on the verdict so
   *  every surface can SAY so, which is the half R12-3 was missing. */
  outgrown: boolean
}

/** What the play week will do with `event` – asked with the SAME predicates every other surface
 *  reads: `layoffCovering` for the body (against the EVENT's week, so the R10-17 window governs
 *  here too) and `medicalBlock` for the doctor. Precedence mirrors `availabilityStatus` exactly –
 *  injured > medical – so the entry gate and the arrival gate can never disagree about which beat
 *  fires. */
export function arrivalStatus(world: WorldState, event: SeasonEvent): ArrivalStatus {
  const outgrown = outgrewTier(event.tier, kidPoints(world, 'domestic'))
  const layoff = layoffCovering(world, event.week)
  if (layoff !== null) return { verdict: 'injured', detail: injuredDetail(layoff.weeksRemaining), outgrown }
  const medical = medicalBlock(world.condition)
  if (medical) return { verdict: 'medical', detail: medical.detail, outgrown }
  return { verdict: 'play', outgrown }
}

// --- Season-Life: injuries + physio (slice C) ---------------------------------
// ALL of this slice's randomness lives on the PRIVATE per-week sub-streams
// `rngFromSeed(seed + ':injury:' + week)` and `rngFromSeed(seed + ':physio:' + week)`.
// Each is re-derived per call and keyed on immutable (seed, week) only, so conditional
// pulls inside them (severity/weeks-out/region only when injured; billing only when owed)
// can never perturb the MAIN weekly stream or any other week – the C1 invariance test
// (count 45239 / hash 9f783705, frozen in slice B) guards it. rollInjury/resolvePhysio
// take only `world`: there is no rng parameter to misuse.

/** The girl injury-age curve (owner research 25.07, peak at 16); ages past the table
 *  fall to the `default` knob. See docs/research/injury-stats-by-age.md §3.1. */
export function ageInjuryFactor(ageYears: number): number {
  const table = ECONOMY.availability.ageInjuryFactor
  return table[ageYears] ?? table.default
}

/** Overuse multiplier for competed weeks in the trailing 4 (research §3.2). Index = count,
 *  clamped to the table's top (4+ straight weeks -> the max factor). */
export function consecutivePlayFactor(playedWeeks: number): number {
  const table = ECONOMY.availability.consecutivePlayFactor
  return table[Math.min(playedWeeks, table.length - 1)]
}

/** True when the kid is entered in an event scheduled for the CURRENT week. */
function enteredScheduledThisWeek(world: WorldState): boolean {
  return world.season.some((e) => e.week === world.week && world.entries.includes(e.id))
}

/** Competed weeks in the trailing 4 (incl. this one), counted from the KID's results ledger –
 *  pure state, zero draws. This week's run has not landed in the ledger yet at roll time, so it
 *  is read off entries+season instead. */
export function playedWeeksInTrailing4(world: WorldState): number {
  const weeks = new Set<number>()
  for (const r of world.results) {
    if (r.playerId === KID_ID && r.week > world.week - 4 && r.week <= world.week) weeks.add(r.week)
  }
  if (enteredScheduledThisWeek(world)) weeks.add(world.week)
  return weeks.size
}

/** The effective per-week injury chance (the occurrence roll's threshold). Pure state, zero
 *  draws: fatigue/age/load/play/physio are post-draw comparison operands, so none of them can
 *  move the draw sequence – only whether the (already drawn) roll counts as an injury. */
export function injuryTau(world: WorldState): number {
  const a = ECONOMY.availability
  const fatigue = 100 - world.condition
  let tau = clamp(a.injuryBaseChance + fatigue * a.injuryFatigueSlope, 0, a.injuryChanceCap)
  tau *= ageInjuryFactor(START_AGE_YEARS + Math.floor(world.week / 52))
  tau *= consecutivePlayFactor(playedWeeksInTrailing4(world))
  if (enteredScheduledThisWeek(world)) tau *= a.injuryPlayingMultiplier
  // R12-4/11: a booked family week is the opposite pole of the load axis above – she is not
  // training and not competing, so the week costs a fraction of a training week's risk. Nonzero on
  // purpose (holidays do sprain ankles). Post-draw multiply, zero draws – see the knob's note.
  // Read off `vacations` rather than a flag: `rollInjury` runs at step 1c BEFORE `resolveVacation`,
  // and `prunePlannerBookings` keeps the current week, so the booking is always visible here.
  if (vacationForWeek(world, world.week)) tau *= a.injuryVacationFactor
  if (world.physioActive) tau *= ECONOMY.physio.riskReduction
  // Season planner: the resort/elite recovery buff is a POST-DRAW multiply on the threshold
  // (spec §2 "invariance-safe"), so the expensive package buys real protection without ever
  // touching the draw sequence.
  if (world.recoveryBuff && world.week <= world.recoveryBuff.untilWeek) tau *= world.recoveryBuff.factor
  return Math.min(tau, a.injuryChanceCap)
}

// Body-region weights (owner research 25.07): ~48% lower-limb / 28% upper / 24% core, with the
// WTA skew inside `lower` (girls' pattern = ankle+knee sprains take the majority of the lower
// share) and a lumbar bias inside `core` (teen back trouble). Flattened to one cumulative table
// so the region costs exactly ONE pull from the private injury generator.
const BODY_REGIONS: readonly { part: string; weight: number }[] = [
  { part: 'ankle', weight: 0.48 * 0.3 },
  { part: 'knee', weight: 0.48 * 0.25 },
  { part: 'hamstring', weight: 0.48 * 0.15 },
  { part: 'calf', weight: 0.48 * 0.12 },
  { part: 'foot', weight: 0.48 * 0.1 },
  { part: 'hip', weight: 0.48 * 0.08 },
  { part: 'wrist', weight: 0.28 * 0.25 },
  { part: 'shoulder', weight: 0.28 * 0.25 },
  { part: 'elbow', weight: 0.28 * 0.25 },
  { part: 'forearm', weight: 0.28 * 0.25 },
  { part: 'lower back', weight: 0.24 * 0.75 },
  { part: 'abdominal', weight: 0.24 * 0.25 },
]

function drawBodyRegion(rng: Rng): string {
  const u = rng() // exactly one pull
  let cum = 0
  for (const region of BODY_REGIONS) {
    cum += region.weight
    if (u < cum) return region.part
  }
  return BODY_REGIONS[BODY_REGIONS.length - 1].part
}

// kind = "<part> <descriptor>". A 1-week minor reads as a "niggle", a 2-week one as "soreness" –
// deterministic variety off the already-drawn weeks-out, no extra pull.
const SEVERITY_DESCRIPTOR: Record<InjurySeverity, string> = {
  minor: 'soreness',
  moderate: 'strain',
  major: 'stress reaction',
  severe: 'tear',
}

/** One medical bill in cents: draw the MIDDLE-anchored base from `band`, then map ONE uniform
 *  roll from the same physio generator into the background's medical corridor (mirrors
 *  travelBgFactor: same roll, disjoint corridors, so working < middle < wealthy per bill). */
function medicalBillCents(world: WorldState, rng: Rng, band: readonly [number, number]): number {
  const base = pickInt(rng, band[0], band[1])
  const [cLo, cHi] = ECONOMY.physio.medicalBgFactor[world.profile.background]
  const roll = rng()
  return Math.round(base * (cLo + roll * (cHi - cLo)))
}

/** Weekly injury step (tick step 1c, FIRST – so playedThisWeek/accrueCondition see a walkover).
 *  Injured: count down; at 0 clear + log to injuryHistory + emit a 'recovery' event – the
 *  clearing week is a grace week (the occurrence roll only fires again next tick). Healthy: one
 *  UNCONDITIONAL occurrence roll off `seed:injury:week`; injured iff roll < injuryTau(world). */
export function rollInjury(world: WorldState): void {
  if (world.injury !== null) {
    world.injury.weeksRemaining -= 1
    if (world.injury.weeksRemaining <= 0) {
      const { kind, severity, totalWeeks } = world.injury
      world.injuryHistory.push({ kind, severity, week: world.week, weeksOut: totalWeeks })
      if (world.injuryHistory.length > 20) world.injuryHistory.splice(0, world.injuryHistory.length - 20)
      world.injury = null
      addEvent(world, { week: world.week, type: 'recovery', text: 'Back on court – cleared to play.' })
    }
    return
  }

  const injuryRng = rngFromSeed(`${world.seed}:injury:${world.week}`)
  const roll = injuryRng() // unconditional every healthy week – only tau moves
  if (roll >= injuryTau(world)) return

  // Injured. Severity band, weeks-out and body region pull from the SAME per-week generator
  // (invariance-safe: it is private to this (seed, week)).
  const bands = ECONOMY.availability.severityBands
  const sevRoll = injuryRng()
  const band = bands.find((b) => sevRoll < b.cum) ?? bands[bands.length - 1]
  let weeksOut = pickInt(injuryRng, band.weeksLo, band.weeksHi)
  const part = drawBodyRegion(injuryRng)
  if (world.physioActive) weeksOut = Math.max(1, Math.round(weeksOut * (1 - ECONOMY.physio.recoverySpeedup)))
  const descriptor = band.severity === 'minor' && weeksOut === 1 ? 'niggle' : SEVERITY_DESCRIPTOR[band.severity]
  const kind = `${part} ${descriptor}`
  world.injury = { kind, severity: band.severity, weeksRemaining: weeksOut, totalWeeks: weeksOut, sinceWeek: world.week }
  // D10: her first injury, captured at ONSET (injuryHistory only records at recovery). Pure
  // state, zero extra pulls from the injury generator – the draws above are untouched.
  captureMilestone(world, { type: 'injury', week: world.week, kind })

  // One-time scans/treatment at onset, corridor-scaled off the physio sub-stream. minor draws
  // a $0 bill (band [0,0]) and emits no event – she just rests it off.
  const onsetCost = medicalBillCents(world, rngFromSeed(`${world.seed}:physio:${world.week}`), ECONOMY.physio.onsetCostCents[band.severity])
  if (onsetCost > 0) {
    world.fundsCents -= onsetCost
    addEvent(world, {
      week: world.week,
      type: 'expense',
      category: 'physio',
      text: 'Medical – scans and treatment',
      amountCents: -onsetCost,
    })
  }

  // F45-2 (owner playtest 27.07 – «автоматически выкидывает СО ВСЕХ поданных заявок и делает
  // рефанд, даже если турнир ТОЧНО ПОСЛЕ выздоровления»). Withdraw only the entries the layoff
  // actually SWALLOWS. This loop used to ask one question – "is the list still open?" – so a
  // one-week niggle in week 10 cancelled a tournament in week 30, refund and all. It is the same
  // mistake R10-17 fixed in the entry gate, in the one injury surface that never got the fix: a
  // layoff is a RANGE of weeks, so the question is "will she still be out IN e.week?".
  //
  // TWO conditions, both required:
  //   inside the layoff – `layoffCovering`, the shared R10-17 window (exclusive of the return
  //                       week). At or after her return she is FIT, so the entry stays booked.
  //   list still open   – `world.week <= e.deadlineWeek`. Past the deadline the fee is committed
  //                       and `withdrawEvent` refuses anyway, so an in-layoff entry with a closed
  //                       list keeps today's behaviour: still entered, fee forfeited, and the
  //                       walkover beat in tickWeek resolves its week. Deliberately unchanged.
  //
  // Consequence worth naming: lists close two weeks out, so a still-refundable entry always sits at
  // `world.week + 2` or later – which means a 1- or 2-week layoff now cancels NOTHING, and only a
  // 3+ week absence can reach an open list at all.
  for (const id of [...world.entries]) {
    const e = eventById(world, id)
    if (e && layoffCovering(world, e.week) !== null && world.week <= e.deadlineWeek) {
      withdrawEvent(world, id)
    }
  }

  // Season planner (spec §4): an injury cancels the practice weeks it swallows – the court
  // rental comes back in full ("no fee forfeit beyond the court rental"). Vacations are left
  // alone: a family week away is still rest, injured or not. Same window as the entries above,
  // and now literally the same predicate instead of a hand-rolled `backAtWeek` copy of it.
  for (const p of [...world.practices]) {
    if (p.week >= world.week && layoffCovering(world, p.week) !== null) refundPractice(world, p, 'Injured')
  }

  const wks = `${weeksOut} wk${weeksOut === 1 ? '' : 's'}`
  addEvent(world, {
    week: world.week,
    type: 'injury',
    text:
      band.severity === 'severe'
        ? `Bad news from the clinic: ${kind} – out ~${wks}. The dream takes a hit.`
        : `Injury: ${kind} – out ~${wks}.`,
  })
}

/** Weekly physio/medical billing (tick step 1c, LAST). Injured weeks bill rehab regardless of
 *  the retainer toggle; a healthy week bills the retainer only while physioActive. Amounts are
 *  corridor-scaled draws off `seed:physio:week`; the expense event auto-folds into accrueFinance
 *  (Money breakdown) and the season-wrap funds delta. */
export function resolvePhysio(world: WorldState): void {
  const physioRng = rngFromSeed(`${world.seed}:physio:${world.week}`)
  let cost: number
  if (world.injury !== null) {
    cost = medicalBillCents(world, physioRng, ECONOMY.physio.rehabPerWeekCents)
  } else if (world.physioActive) {
    cost = medicalBillCents(world, physioRng, ECONOMY.physio.retainerPerWeekCents)
  } else {
    return
  }
  world.fundsCents -= cost
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'physio',
    text: 'Physio / recovery session',
    amountCents: -cost,
  })
}

// --- Season planner: vacations + practice matches ------------------------------
// docs/specs/season-planner.md. TWO player-planned week types on otherwise empty weeks.
//
// RNG DISCIPLINE (the whole reason this slice is safe): a booking is PURE STATE. Prices are
// quoted from the purpose-scoped sub-streams `seed:vacation:week:packageId` /
// `seed:practice:week` (economy.ts), and the friendly itself runs on `seed:practicematch:week`
// – never the MAIN weekly stream. The B1/C1 freezes (count 45239 / hash 9f783705) therefore
// stay byte-identical no matter how much the parent plans; tests/planner.test.ts P1 re-proves
// it with a career that books something every single week.

/** The vacation booked for `week`, if any. */
export function vacationForWeek(world: WorldState, week: number): VacationBooking | undefined {
  return world.vacations.find((v) => v.week === week)
}

/** The practice match booked for `week`, if any. */
export function practiceForWeek(world: WorldState, week: number): PracticeBooking | undefined {
  return world.practices.find((p) => p.week === week)
}

/** The availability copy for a booked vacation week: "Family vacation – {package}" (spec §3). */
function vacationBlackoutDetail(booking: VacationBooking): string {
  return `Family vacation – ${vacationPackage(booking.packageId)?.label ?? booking.packageId}`
}

/** Guard shared by both booking commands: a plannable week is in the FUTURE, free of the kid's
 *  own entries and of another booking, and she is not laid up through it. Throws the
 *  player-facing reason (short dash copy). `kind` shapes the school/off-season rules: the
 *  off-season is family time (no friendlies) but IS the natural family-vacation week, and an
 *  exam block takes neither.
 *
 *  THE DOCTOR'S VETO REACHES THE FRIENDLY (owner 26.07: "the doctor who will not let her travel
 *  probably should not clear her for a friendly at condition 0"). A match is a match: under
 *  ECONOMY.availability.medicalFloor she is not cleared for one, whoever is standing across the
 *  net. It applies to `practice` ONLY – a VACATION is rest, and refusing that below the floor is
 *  how a week becomes a dead end (R10-3), the exact bug class this gate must not reintroduce.
 *  The verdict comes from the shared `medicalBlock`, so the friendly and the tournament print the
 *  same sentence by construction. Ranked LAST, mirroring `availabilityStatus`: injury and the
 *  week-level reasons (exams, off-season, an existing booking, an entered tournament) name
 *  themselves first, because they are true for any body. */
function assertPlannable(world: WorldState, week: number, kind: 'vacation' | 'practice'): void {
  if (!Number.isInteger(week) || week <= world.week) throw new Error('Only a future week can be planned')
  const layoff = layoffCovering(world, week) // the shared R10-17 window
  if (layoff !== null) throw new Error(`Injured – back in ${layoff.weeksRemaining} weeks.`)
  if (isExamWeek(week)) throw new Error('School exams that week – no matches, no trips')
  if (kind === 'practice' && isOffSeasonWeek(week)) throw new Error('Off-season – family time, no matches')
  if (vacationForWeek(world, week)) throw new Error('That week is already a family vacation')
  if (practiceForWeek(world, week)) throw new Error('A practice match is already booked that week')
  if (world.season.some((e) => e.week === week && world.entries.includes(e.id))) {
    throw new Error('She is entered in a tournament that week')
  }
  if (kind === 'practice') {
    const medical = medicalBlock(world.condition)
    if (medical) throw new Error(medical.detail)
  }
}

/** Book a family vacation on an empty future week: charges the sub-stream quote (spec §2) and
 *  records the booking. The week becomes a hard blackout; the package's condition gain (and, for
 *  the two top packages, its recovery buff) lands when the week ticks. */
export function bookVacation(world: WorldState, week: number, packageId: string): void {
  const pkg = vacationPackage(packageId)
  if (!pkg) throw new Error('Unknown vacation package')
  assertPlannable(world, week, 'vacation')
  const priceCents = vacationPriceCents(world.seed, week, packageId, world.profile.background)
  // R13-7a: a ZERO-PRICE package is always affordable. The bare `funds < price` refused the free
  // home-rest week the moment funds went negative (-$1 < $0), i.e. exactly when it is the one
  // thing a broke family can still book. Nothing is charged, so nothing has to be afforded.
  if (priceCents > 0 && world.fundsCents < priceCents) throw new Error('Not enough funds for that vacation')
  world.fundsCents -= priceCents
  world.vacations.push({ week, packageId, paidCents: priceCents })
  world.vacations.sort((a, b) => a.week - b.week)
  if (priceCents > 0) {
    addEvent(world, {
      week: world.week,
      type: 'expense',
      category: 'vacation',
      text: `Booked: ${pkg.label} – ${weekLabel(week)}`,
      amountCents: -priceCents,
    })
  }
  addEvent(world, { week: world.week, type: 'entry', text: `Family vacation booked – ${weekLabel(week)} (${pkg.label})` })
}

/** Cancel a booked vacation before its week starts: FULL refund (mirror of entry withdrawal). */
export function cancelVacation(world: WorldState, week: number): void {
  const booking = vacationForWeek(world, week)
  if (!booking) throw new Error('No vacation booked that week')
  if (week <= world.week) throw new Error('That vacation week has already started')
  world.vacations = world.vacations.filter((v) => v !== booking)
  const label = vacationPackage(booking.packageId)?.label ?? booking.packageId
  if (booking.paidCents > 0) {
    world.fundsCents += booking.paidCents
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'vacation',
      text: `Vacation refunded: ${label}`,
      amountCents: booking.paidCents,
    })
  }
  addEvent(world, { week: world.week, type: 'entry', text: `Cancelled the family vacation – ${weekLabel(week)}` })
}

/** Book a practice match (a watchable friendly) on an empty future week: charges the court
 *  rental off the `:practice:` sub-stream, plus half a coaching session when the coach comes
 *  along. NEVER blocked by the fatigue GUARDRAIL – the caution is advice, not a veto (owner:
 *  "the parent may push, the game warns"); see practiceCaution.
 *
 *  The ONE exception, and it is the doctor's, not the guardrail's: below
 *  ECONOMY.availability.medicalFloor `assertPlannable` refuses outright (there is no warning band
 *  for a friendly – above the floor the guardrail's soft caution owns the whole range). That is the
 *  same hard body-gate `availabilityStatus` applies to a tournament, reading the same
 *  `medicalBlock`. */
// --- THE COACH MARKET (v23) --------------------------------------------------------------------

/** The coach a career OPENS with, from the rung onboarding chose.
 *
 *  `self` means nobody: the parent is on the court, and there is no id to store. Otherwise it is
 *  the coach at that rung who suits her game best, cheapest first among equals - which is what a
 *  parent walking into an academy and naming a budget actually gets. Pure: the roster is derived
 *  from the seed and nothing is drawn on the main stream. */
export function openingCoachId(seed: string, profile: PlayerProfile): string | null {
  if (profile.coachTier === 'self') return null
  return bestFitCoachAt(seed, START_AGE_YEARS, profile.coachTier, profile.playStyle)?.id ?? null
}

/** The friendly's coach rate for one week of THIS world - a thin read of the pure rule in
 *  engine/coach.ts, so the planner sheet and the engine quote the same number. */
export function practiceCoachRateFor(world: WorldState, week: number): number {
  return practiceCoachRateCents(world.seed, ageAtWeek(week), world.coachId, world.profile.playStyle)
}

/** THE HIRE, and it is deliberately cheap to do: no signing fee, no notice period, effective from
 *  the next weekly bill.
 *
 *  Whether swapping coach mid-season should COST something is an open question the spec raises
 *  (§5 - "a free swap makes the choice weightless") and not one this slice answers, so the command
 *  is built to take a fee later without changing shape: the refusals live here in one place, and
 *  the only mutation is the id.
 *
 *  ZERO RNG on any stream - the roster is a derivation and the id is a string. The frozen MAIN
 *  capture cannot move, and neither can the week's own bill until the week actually turns.
 *
 *  `null` fires the parent back onto the court, which must always be allowed: a family that cannot
 *  pay has to be able to stop paying. */
export function hireCoach(world: WorldState, coachId: string | null): void {
  if (coachId === null) {
    if (world.coachId === null) return
    world.coachId = null
    world.physioActive = false
    addEvent(world, {
      week: world.week,
      type: 'info',
      // ⚠ NOW KEPT, AND TAGGED (skills-radar). Both arms of this command are the moment a coaching
      // arrangement CHANGED, and the radar's "weeks together" is derived from exactly that moment
      // (coachSinceWeek) rather than from a new persisted field. A pruned release event would let a
      // fired coach go on lending his read to the parent who replaced him. Bounded by construction:
      // one row per hire, and a career has a handful.
      keep: true,
      milestoneKey: `${COACH_CHANGE_KEY}${world.week}`,
      text: 'You are coaching her yourself again. The weekly bill is court time only.',
    })
    return
  }
  const coach = coachById(world.seed, ageAtWeek(world.week), coachId)
  if (!coach) throw new Error('No such coach')
  if (world.coachId === coach.id) return
  // ⚠ DOMESTIC, and the merge with the two ladders is why this now has to say so out loud. The
  // gate's threshold (ECONOMY.coach.eliteGate.minPoints = 150) was written as "national-tier
  // eligibility" - it IS TIERS.national.enterPointBand[0] - so the domestic table is the one that
  // preserves its meaning. Reading ITF points here would also make the Elite rung strictly
  // downstream of money (no international travel, no ITF points, no Elite coach ever), which is the
  // opposite of the "earned rather than bought" shape the owner asked the gate for.
  const short = eliteGateShortfall(coach, kidPoints(world, 'domestic'))
  if (short !== null) {
    throw new Error(`${coach.name} only takes players with results – ${short} more ranking points`)
  }
  world.coachId = coach.id
  world.physioActive = coachIncludesPhysio(coach.tier)
  addEvent(world, {
    week: world.week,
    type: 'info',
    keep: true,
    // See the release arm above: the tag is what makes "when did this partnership start" a read
    // over the ledger instead of a persisted field and a migration.
    milestoneKey: `${COACH_CHANGE_KEY}${world.week}`,
    text: `${coach.name} is her coach now – ${COACH_TIER_LABEL[coach.tier]} tier.`,
  })
}

/** THE TAG ON A COACH-CHANGE EVENT, and the only thing that identifies one. `milestoneKey` already
 *  exists on every event (it is what makes a milestone fire once), it is never pruned when the event
 *  is `keep`, and it needs no schema bump - the same trick the academy's offers use
 *  (`academy-in-<week>`). The week is in the key, so two hires can never collide.
 *
 *  A career migrated from a save written before this tag existed simply has no tagged events, and
 *  `coachSinceWeek` falls back to week 0 - "they have been together as long as anyone can remember",
 *  which is the right answer for a ledger with no record of a change. */
const COACH_CHANGE_KEY = 'coach-since-'

/** WHEN THE CURRENT COACHING ARRANGEMENT BEGAN - the radar's "weeks together", derived rather than
 *  stored (docs/specs/skills-radar.md §2: no schema bump, no migration, no golden save).
 *
 *  Week 0 for a career that has never changed coach, and the week of the last hire or release
 *  otherwise. BOTH arms count: a new coach has to learn her, and so - as far as the ladder is
 *  concerned - does the parent who takes the court back, because what the rung buys is an eye, and
 *  the eye left with him. */
export function coachSinceWeek(world: WorldState): number {
  let since = 0
  for (const e of world.events) {
    if (e.milestoneKey?.startsWith(COACH_CHANGE_KEY) && e.week > since) since = e.week
  }
  return since
}

/** EVERY COMPETITIVE MATCH SHE HAS EVER PLAYED, off the two durable ledgers that already count them:
 *  the running season W-L counters (v10, incremented per kid match at finalizeTournament) and the
 *  per-season history rows (v14, appended at each wrap-up as those counters reset).
 *
 *  ⚠ NOT `world.events.filter(e => e.match)`. The event feed prunes at EVENTS_CAP, so her match
 *  records are a rolling window of roughly the last year and a half - measured on a busy career it
 *  holds 20-40 matches and oscillates rather than grows. The radar needs a count that can only go
 *  UP (see engine/radar.ts, axisEvidence): a confidence that fell because an old match aged out
 *  would re-thicken the fog on its own, which is exactly the shimmer the spec forbids.
 *
 *  Walkovers and medical withdrawals are absent by construction - they never reach finalize, so
 *  they were never counted, and she never took the court. Practice friendlies are absent for the
 *  same reason they are not evidence (R11-2): nothing was on the line. */
export function matchesEverPlayed(world: WorldState): number {
  return (
    world.seasonWins +
    world.seasonLosses +
    world.seasonHistory.reduce((sum, h) => sum + h.wins + h.losses, 0)
  )
}

/** THE TOURNAMENT-WEEK TOGGLE. Pure state, zero draws on any stream - it changes only what the
 *  arithmetic downstream of an unchanged pickInt does with the number it drew, so the frozen MAIN
 *  capture cannot move. Takes effect from the NEXT tick; this week's bill is already written. */
export function setCoachOnEventWeeks(world: WorldState, on: boolean): void {
  if (world.coachOnEventWeeks === on) return
  world.coachOnEventWeeks = on
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: on
      ? 'Your coach travels to tournaments now – billed on competition weeks too.'
      : 'Your coach stays home on tournament weeks – those weeks are no longer billed.',
  })
}

/** WHAT THE COACH COSTS OVER A SEASON, both ways, so the toggle can be priced rather than guessed.
 *
 *  `weeklyCents` is the same either way - what differs is HOW MANY weeks are billed, so the honest
 *  pair of numbers is the season, not the week. Counted off the season she is actually in: the
 *  off-season weeks are already unbilled for everyone, and `eventWeeks` is the weeks of it she is
 *  entered for. Derived at snapshot time; persists nothing. */
export function coachBilling(world: WorldState): {
  onEventWeeks: boolean
  weeklyCents: number
  eventWeeks: number
  seasonOffCents: number
  seasonOnCents: number
} {
  const age = ageAtWeek(world.week)
  const coach = coachById(world.seed, age, world.coachId)
  const rate = coach ? coach.rateCents : selfRateCents(age)
  const weeklyCents = coachWeeklyCents(rate, world.plan, world.profile.background)
  const seasonStart = seasonStartWeek(world.week)
  const seasonEnd = seasonStart + WEEKS_PER_YEAR
  const inSeason = (w: number) => w >= seasonStart && w < seasonEnd
  const eventWeeks = new Set(
    world.season.filter((e) => inSeason(e.week) && world.entries.includes(e.id)).map((e) => e.week),
  ).size
  // The playable weeks of a season are everything but the off-season block.
  const playableWeeks = WEEKS_PER_YEAR - OFF_SEASON_WEEKS
  return {
    onEventWeeks: world.coachOnEventWeeks,
    weeklyCents,
    eventWeeks,
    seasonOffCents: weeklyCents * Math.max(0, playableWeeks - eventWeeks),
    seasonOnCents: weeklyCents * playableWeeks,
  }
}

/** THE MARKET, as the screen needs it: every coach, priced in HER family's corridor at HER age and
 *  HER plan, read against HER game, with what each rung would add for her.
 *
 *  Derived at snapshot time, so it persists nothing and bumps no schema. The ENGINE decides fit,
 *  price, affordability and the gate; the screen only lays them out - the same division upcoming
 *  events already use, and the reason two surfaces can never disagree about what a coach costs. */
export function coachMarket(world: WorldState): CoachMarketRow[] {
  const age = ageAtWeek(world.week)
  const points = kidPoints(world, 'domestic') // ⚠ the Elite gate's currency – see hireCoach above
  const weeklyIncome = parentIncomeForWeekCents(world.seed, world.profile.background, world.week)
  return buildCoachRoster(world.seed, age).map((coach) => {
    const fit = coachFitFor(coach, world.profile.playStyle)
    const [upliftLo, upliftHi] = coachSeasonUplift({
      skills: SKILL_KEYS.map((k) => world.skills[k]),
      potential: SKILL_KEYS.map((k) => world.potential[k]),
      plan: world.plan,
      tier: coach.tier,
      fit,
      ageFactor: ageFactor(age),
      trainFactor: trainFactor(world.plan),
    })
    return {
      id: coach.id,
      tier: coach.tier,
      name: coach.name,
      style: coach.style,
      fit,
      weeklyCents: coachWeeklyCents(coach.rateCents, world.plan, world.profile.background),
      current: world.coachId === coach.id,
      // AFFORDABLE MEANS "against the week's income", not "against the reserve". A reserve pays for
      // one week of anything; what the family is actually deciding is whether this bill fits the
      // money that arrives every week, which is the number the budget meter draws.
      overBudgetCents: Math.max(0, coachWeeklyCents(coach.rateCents, world.plan, world.profile.background) - weeklyIncome),
      lockedPoints: eliteGateShortfall(coach, points),
      upliftPct: [upliftLo, upliftHi] as [number, number],
    }
  })
}

export function bookPractice(world: WorldState, week: number, withCoach: boolean): void {
  assertPlannable(world, week, 'practice')
  const paidCents = practiceFeeCents(world.seed, week, world.profile.background, withCoach, practiceCoachRateFor(world, week))
  if (world.fundsCents < paidCents) throw new Error('Not enough funds for the court rental')
  world.fundsCents -= paidCents
  world.practices.push({ week, paidCents, withCoach })
  world.practices.sort((a, b) => a.week - b.week)
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'practice',
    text: withCoach ? `Court rental + coach – practice match ${weekLabel(week)}` : `Court rental – practice match ${weekLabel(week)}`,
    amountCents: -paidCents,
  })
  addEvent(world, { week: world.week, type: 'entry', text: `Practice match booked – ${weekLabel(week)}` })
}

/** Cancel a booked practice before its week starts: full refund of the rental. */
export function cancelPractice(world: WorldState, week: number): void {
  const booking = practiceForWeek(world, week)
  if (!booking) throw new Error('No practice match booked that week')
  if (week <= world.week) throw new Error('That practice week has already started')
  refundPractice(world, booking, 'Cancelled')
}

/** Drop a practice booking and hand the rental back (shared by the player cancel, the injury hook
 *  and the doctor's arrival check, so the money story is identical whichever one fires). */
function refundPractice(world: WorldState, booking: PracticeBooking, reason: 'Cancelled' | 'Injured' | 'Medical'): void {
  world.practices = world.practices.filter((p) => p !== booking)
  world.fundsCents += booking.paidCents
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'practice',
    text: `Court rental refunded – ${weekLabel(booking.week)}`,
    amountCents: booking.paidCents,
  })
  addEvent(world, {
    week: world.week,
    type: 'entry',
    text:
      reason === 'Injured'
        ? `Practice match called off – ${weekLabel(booking.week)} (she is hurt)`
        : reason === 'Medical'
          ? `Practice match called off – ${weekLabel(booking.week)} (not cleared to play)`
          : `Cancelled the practice match – ${weekLabel(booking.week)}`,
  })
}

/** How many practice weeks run UNBROKEN immediately before `week` (pure, order-free). */
export function consecutivePracticeWeeks(practiceWeeks: readonly number[], week: number): number {
  const booked = new Set(practiceWeeks)
  let n = 0
  while (booked.has(week - 1 - n)) n++
  return n
}

/** The practice GUARDRAIL as a small pure predicate (fatigue-bench finding 25.07: practising
 *  every single week is self-destructive – mean condition 47, 41-44% of weeks under 40). It is a
 *  CAUTION, never a block: the confirm sheet spells the risk out and the Home chip reads the
 *  strain, but the parent may still push. Reasons: 'tired' (below ECONOMY.practice.cautionCondition)
 *  and 'streak' (a run of consecutive match weeks).
 *
 *  WAVE-2 RETUNE (bench 26.07): the streak arm is GATED on real strain – `cautionStreak` (3) in a
 *  row warns only below `cautionStreakCondition`, while `cautionStreakAlways` (4) in a row warns at
 *  any condition. It used to fire on a perfectly fresh kid (careful pushed through 8-11
 *  cautions/season at condition 92), which is how a warning becomes noise. */
export interface PracticeCaution {
  level: 'ok' | 'caution'
  reasons: Array<'tired' | 'streak'>
  /** how many match weeks in a row this booking would make (1 = the first) – so the chip and the
   *  sheet can NAME the run without re-deriving it. */
  streakWeeks: number
  /** player-facing warning copy (short dash), absent when clear */
  detail?: string
}
export function practiceCaution(input: {
  condition: number
  practiceWeeks: readonly number[]
  week: number
}): PracticeCaution {
  const p = ECONOMY.practice
  const reasons: Array<'tired' | 'streak'> = []
  // The booking under consideration closes the run, so it is the (unbroken run before it + 1)-th.
  const streakWeeks = consecutivePracticeWeeks(input.practiceWeeks, input.week) + 1
  if (input.condition < p.cautionCondition) reasons.push('tired')
  const strainedStreak = streakWeeks >= p.cautionStreak && input.condition < p.cautionStreakCondition
  if (strainedStreak || streakWeeks >= p.cautionStreakAlways) reasons.push('streak')
  if (reasons.length === 0) return { level: 'ok', reasons, streakWeeks }
  const parts: string[] = []
  // Owner's line: «Она уже вымотана – ещё матч?»
  if (reasons.includes('tired')) parts.push('She is already worn out – another match?')
  if (reasons.includes('streak')) parts.push(`${streakWeeks} match weeks in a row – that is how bodies break.`)
  return { level: 'caution', reasons, streakWeeks, detail: parts.join(' ') }
}

/** Retire an expired recovery buff (pure state). Runs after the week's injury roll, so the last
 *  covered week still gets its protection. */
function expireRecoveryBuff(world: WorldState): void {
  if (world.recoveryBuff && world.week > world.recoveryBuff.untilWeek) world.recoveryBuff = null
}

/** Tick step 1c: resolve a booked vacation week – the package's condition gain on top of the
 *  free-week recovery accrueCondition already granted, plus the resort/elite carry-over buff.
 *  Runs even while she is injured: a family week away is still rest. */
function resolveVacation(world: WorldState): void {
  const booking = vacationForWeek(world, world.week)
  if (!booking) return
  const pkg = vacationPackage(booking.packageId)
  if (!pkg) return
  world.condition = clamp(world.condition + pkg.conditionGain, ECONOMY.condition.min, ECONOMY.condition.max)
  if (pkg.buffFactor < 1) {
    world.recoveryBuff = { untilWeek: world.week + ECONOMY.vacation.buffWeeks, factor: pkg.buffFactor }
  }
  addEvent(world, {
    week: world.week,
    type: 'info',
    text:
      pkg.buffFactor < 1
        ? `Family vacation – ${pkg.label}: +${pkg.conditionGain} condition, and the recovery holds for ${ECONOMY.vacation.buffWeeks} weeks.`
        : `Family vacation – ${pkg.label}: +${pkg.conditionGain} condition.`,
  })
}

/** Pick the week's sparring partner: a cohort player from the kid's own neighbourhood of the
 *  standings (one draw on the private practice stream). Flavor + a fair hit-out, never a result. */
function pickSparringPartner(world: WorldState, rng: Rng): AiPlayer {
  const ranking = fullRanking(world).filter((r) => r.playerId !== KID_ID)
  const byId = new Map(world.cohort.map((p) => [p.id, p]))
  const kidIdx = Math.max(0, Math.min(ranking.length - 1, world.kidRank - 1))
  const lo = Math.max(0, kidIdx - 10)
  const hi = Math.min(ranking.length - 1, kidIdx + 10)
  const pick = pickInt(rng, lo, hi) // exactly one pull
  return byId.get(ranking[pick]?.playerId ?? '') ?? world.cohort[0]
}

/** Tick step 1c: play a booked practice match. A watchable friendly through the SAME record
 *  shape a tournament match uses (MatchReplay re-simulates from the stored seed), ZERO ranking
 *  points, and the spec's drain: `max(1, local-scoreline drain − 1)` – a friendly is one lighter
 *  than the same match at a local, never free. Injury cancels the week (the rental was already
 *  refunded at onset), and so does the doctor's floor, re-read here on arrival (see below); the
 *  friendly runs on the private `seed:practicematch:week` stream, so it adds no MAIN-stream draws. */
function resolvePractice(world: WorldState): void {
  const booking = practiceForWeek(world, world.week)
  if (!booking) return
  if (world.injury !== null) {
    refundPractice(world, booking, 'Injured')
    return
  }
  // THE DOCTOR CHECKS HER ON ARRIVAL HERE TOO. The booking gate reads her condition on the day she
  // BOOKS, and a booking is made a week ahead – so a friendly signed up for at condition 30 can
  // still come round with her at 5 (one bad tournament run in between is enough). The floor is
  // therefore re-read on the play week against the condition she would actually take the court at
  // (step 1c has already accrued), exactly like the tournament arrival check in tickWeek, and
  // ranked the same way: injury first, then medicine.
  //
  // THE MONEY GOES THE OTHER WAY THAN THE TOURNAMENT'S, deliberately. A medical withdrawal from a
  // tournament FORFEITS the entry fee, because the list closed with her on it and refunding it
  // would make the veto a free late exit from any entry the parent regrets. Neither half of that is
  // true of a friendly: there is no closed list (cancelPractice already refunds in full at any point
  // before the week), the friendly awards nothing that could be gamed, and the practice
  // sub-system's own precedent for "her body called it off" – the injury branch right above – is a
  // FULL refund. So the club simply does not get booked. Consistency inside the practice rules beats
  // symmetry with a rule whose reason does not apply.
  //
  // It does NOT set `medicalWithdrawalWeek` either: that marker exists to HALT an advance so the
  // player cannot miss a forfeited entry fee (the owner's silent-withdrawal trap). Nothing is lost
  // here – the money is back and the news feed carries the line – so stopping the fast-forward
  // would be a nag, not a warning.
  if (medicalClearance(world.condition) === 'withdraw') {
    refundPractice(world, booking, 'Medical')
    // The week is match-free after all, so she earns the FULL free-week recovery that
    // accrueCondition withheld when it still believed she would play a friendly (it paid
    // recoveryBase alone, the practice-week rung of the ladder). Written as the DIFFERENCE from a
    // free week, exactly like the tournament withdrawal in tickWeek: base is already in, only the
    // rest-slider bonus is owed. Integer, clamped, zero draws.
    world.condition = clamp(
      world.condition + restRecoveryBonus(world.plan.rest),
      ECONOMY.condition.min,
      ECONOMY.condition.max,
    )
    return
  }
  const rng = rngFromSeed(`${world.seed}:practicematch:${world.week}`)
  const opponent = pickSparringPartner(world, rng)
  const surface: Surface = 'hard' // the home club's courts
  // She hits at her CURRENT condition, exactly like a tournament run (R9-19 coupling), and on the
  // court her style earns her (surface-style): one composition point, applied once.
  const kid = kidMatchPlayerFor(world, surface)
  const opp: MatchPlayer = {
    id: opponent.id,
    name: opponent.name,
    serve: opponent.serve,
    ret: opponent.ret,
    composure: opponent.composure,
    stamina: opponent.stamina,
  }
  const seed = `${world.seed}:practicematch:${world.week}:m`
  const result = simulateMatch(kid, opp, { surface, tour: JUNIOR_TOUR, seed })
  const score = result.sets.map((s) => `${s.a}-${s.b}`).join(' ')
  const kidWon = result.winner === 0
  // The spec's drain rule, graded off the real scoreline via the SAME matchDrain the tour uses.
  const drain = Math.max(1, matchDrain('local', score) - 1)
  world.condition = clamp(world.condition - drain, ECONOMY.condition.min, ECONOMY.condition.max)
  const kidShort = formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  addEvent(world, {
    week: world.week,
    type: 'match',
    friendly: true,
    text: `Practice match: ${kidShort} ${kidWon ? 'beat' : 'lost to'} ${formatShortName(opp.name)} ${score} – no ranking points`,
    match: {
      round: 0,
      aId: KID_ID,
      bId: opp.id,
      winnerId: kidWon ? KID_ID : opp.id,
      seed,
      score,
      eventId: `practice-w${world.week}`,
      surface,
      oppName: opp.name,
      a: { ...kid },
      b: { ...opp },
    },
  })
}

/** Housekeeping: bookings are kept for a short TRAILING window after their week resolves, not
 *  dropped on the spot – the guardrail's consecutive-practice streak (and the Home strain chip)
 *  has to be able to see "she already played the last two weeks". Bounded, so the save stays
 *  small no matter how long the career runs. */
const PLANNER_TRAIL_WEEKS = 4
function prunePlannerBookings(world: WorldState): void {
  const from = world.week - PLANNER_TRAIL_WEEKS
  world.vacations = world.vacations.filter((v) => v.week >= from)
  world.practices = world.practices.filter((p) => p.week >= from)
}

/** Drop international entries from seasons that are over: nothing can ever read them again (the
 *  cap is asked per season, and the only seasons reachable are the current one and the next). The
 *  list is therefore bounded by the cap itself – tens of numbers over a whole career, not one per
 *  event played. Same `seasonStartWeek` boundary the cap counts on, so the prune can never eat a
 *  slot the gate still needs. */
function pruneInternationalEntries(world: WorldState): void {
  const from = seasonStartWeek(world.week)
  world.internationalEntryWeeks = world.internationalEntryWeeks.filter((w) => w >= from)
}

// --- weekly resolution pieces ------------------------------------------------
// R9-1: weekly savings interest on a POSITIVE balance, credited on the CARRIED-IN funds as
// the week opens – before any of this week's flows (refunds, contribution, costs). Emitted
// only when it rounds to >= 1 cent, under the dedicated income category 'interest'. Zero RNG.
function resolveInterest(world: WorldState): void {
  if (world.fundsCents <= 0) return
  const interest = Math.round(world.fundsCents * ECONOMY.savings.apyWeekly)
  if (interest < 1) return
  world.fundsCents += interest
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'interest',
    text: 'Savings interest',
    amountCents: interest,
  })
}

// The parent's weekly contribution to the budget. Runs BEFORE costs and draws no MAIN-stream RNG:
// the per-season growth (round 12, +5-10% compounding each new season) replays from the private
// `seed:income:<season>` sub-stream inside parentIncomeForWeekCents, so the amount is a pure
// function of (seed, background, week) - nothing stored, nothing to migrate.
function resolveParentIncome(world: WorldState): void {
  const income = parentIncomeForWeekCents(world.seed, world.profile.background, world.week)
  world.fundsCents += income
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'income',
    text: "Parents' contribution",
    amountCents: income,
  })
}

/** IS SHE COMPETING THIS WEEK - entered in an event scheduled for it, and healthy enough to play.
 *
 *  ONE definition, two call sites, and they are deliberately evaluated at DIFFERENT points in the
 *  tick: the coaching bill asks at step 1 (before rollInjury) and `accrueCondition` asks at step 1c
 *  (after it). So a fresh injury this week counts as a competition week for the BILL and as a
 *  walkover for CONDITION, which is the honest reading of both - the week opened with her entered
 *  and travelling, and it ended with her not playing.
 *
 *  ENTERED, not merely offered: a calendar full of events she did not enter is a training week.
 *  Pure, zero draws. */
export function isCompetitionWeek(world: WorldState): boolean {
  return (
    world.injury === null &&
    world.season.some((e) => e.week === world.week && world.entries.includes(e.id))
  )
}

/** Is the coach on the clock this week? Every week except a competition week she is not paying him
 *  for - see `coachOnEventWeeks`. Pure, zero draws, and the ONE place the rule lives: the bill and
 *  the development step both ask it, so they can never disagree about whether he was there. */
export function coachWorksThisWeek(world: WorldState): boolean {
  return world.coachOnEventWeeks || !isCompetitionWeek(world)
}

function resolveBaseCosts(world: WorldState, rng: Rng): void {
  // THE COACHING BILL = his rate x hours x the market she trains in x this week's jitter
  // (docs/specs/coach-tiers.md; the model is engine/coach.ts).
  //
  // ONE MAIN-STREAM DRAW, IN THE SAME POSITION IT ALWAYS HELD. The old bill drew a band with one
  // `pickInt` here and multiplied by the plan factor and a corridor roll. The new one draws the
  // WEEK'S JITTER with one `pickInt` here and multiplies by the coach's own rate, the hours the
  // plan buys and the corridor roll. Same draw, same slot, and the frozen MAIN capture (41550
  // draws / e6b0c709) cannot see the difference - which is the whole reason the jitter is what
  // gets drawn and everything with a decision behind it is what gets multiplied.
  //
  // ⚠ THE WEALTH CORRIDOR IS BACK ON THIS LINE (Round 2), on the SAME private
  // `seed:coachbg:<week>` sub-stream it always used. I had taken it off arguing the tier already
  // said "poorer families buy cheaper coaches"; the owner's model is better and is a different
  // claim - the corridor is THE MARKET SHE TRAINS IN, so the same rung costs different money in a
  // working-class club, an ordinary academy and a premium one, and the wealthy family pays MORE for
  // the same coach. POST-draw multiply, so the main-stream sequence still cannot depend on
  // background (the invariance test in economy.test.ts holds it to that).
  const coach = coachById(world.seed, ageAtWeek(world.week), world.coachId)
  const rate = coach ? coach.rateCents : selfRateCents(ageAtWeek(world.week))
  const [jLo, jHi] = ECONOMY.coach.weekJitterBps
  const jitter = pickInt(rng, jLo, jHi) / 10_000
  const corridor = coachCorridorFactor(world.seed, world.week, world.profile.background)
  // ⚠ A COMPETITION WEEK IS NOT A COACHING WEEK (owner, R4): «мы автоматически можем не считать
  // соревновательные и турнирные недели тренерскими, а давать игроку возможность самому отдельным
  // переключателем добавить тренера и на эти недели тоже». She spends that week in a draw, not on
  // his court, so by default she is not billed a retainer for it - and `coachOnEventWeeks` buys him
  // for those weeks anyway, because a coach who travels and works between matches is exactly what
  // the expensive rungs are for.
  //
  // THE DRAWS HAPPEN EITHER WAY. Both pickInts above and below run on every week whatever this
  // resolves to, and only the ARITHMETIC after them changes - the same discipline the sponsor
  // cameo uses when it discards a gift for an ineligible background. The frozen MAIN capture
  // cannot see a toggle.
  const works = coachWorksThisWeek(world)
  const expense = works
    ? Math.round(coachWeeklyCents(rate, world.plan, world.profile.background, corridor) * jitter)
    : 0
  world.fundsCents -= expense
  const flavors = world.plan.train >= 70 ? trainFlavors(world.profile.background) : restFlavors(world.profile.background)
  const flavor = flavors[pickInt(rng, 0, flavors.length - 1)]
  // The $0 line is still EMITTED, the way a sponsor-covered gear item is: the Money breakdown should
  // show why a coaching week cost nothing, not silently drop the row.
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'coaching',
    text: works ? flavor : 'Competition week – no coaching billed',
    amountCents: works ? -expense : 0,
  })
  // Local-sponsor cameo: the ROLL (and the gift draw when it hits) run for EVERY background so
  // the main-stream draw count is background-independent (round-7 keeps the draws exactly as they
  // were). The payout is now NEED-BASED: only an eligible (working) kid actually banks it; for
  // everyone else the drawn result is discarded – no funds move, no event.
  if (rng() < ECONOMY.sponsor.rollChance) {
    const [glo, ghi] = ECONOMY.sponsor.amountCents
    const gift = pickInt(rng, glo, ghi)
    if (ECONOMY.sponsor.eligible.includes(world.profile.background)) {
      world.fundsCents += gift
      addEvent(world, {
        week: world.week,
        type: 'income',
        category: 'sponsor',
        text: 'A local sponsor chipped in!',
        amountCents: gift,
      })
    }
  }
}

// Recurring gear line-items (round-7 a). Scheduled DETERMINISTICALLY off per-category
// purpose-scoped sub-streams – NEVER the main weekly `rng` – so they add zero main-stream
// draws and cohort drift / the RNG replay stay untouched. The product-sponsorship valve
// (round-7 amendment) reads the kid's cached rank AT PURCHASE TIME to subsidise gear for a
// well-ranked kid; the line-item is still emitted (halved / zeroed) so the Money breakdown
// shows the sponsor relationship instead of the cost simply vanishing.
function resolveGear(world: WorldState): void {
  const bg = world.profile.background
  for (const category of GEAR_CATEGORIES) {
    const hit = gearHitForWeek(world.seed, category, bg, world.week)
    if (!hit) continue
    const line = ECONOMY.gear[category]
    let amount = hit.amountCents
    let text = line.flavor[bg]
    if (world.kidRank <= ECONOMY.sponsorship.freeMaxRank) {
      amount = 0
      text += ' – covered by your racket sponsor'
    } else if (world.kidRank <= ECONOMY.sponsorship.halfPriceMaxRank) {
      amount = Math.round(amount / 2)
      text += ' – sponsor covers half'
    }
    world.fundsCents -= amount
    // `-amount` would be -0 for a fully-covered item; keep it +0 so the event/ledger stay clean.
    addEvent(world, { week: world.week, type: 'expense', category: line.breakdown, text, amountCents: amount === 0 ? 0 : -amount })
  }
}

/** WHAT THE TRIP COSTS THE FAMILY – the scholarship applied to the calendar's full fare.
 *
 *  THE ONE definition, and it has to be: the charge (chargeTravel), the refund (skipEvent) and the
 *  price the planner quotes (the snapshot's UpcomingEvent) all read this. If any of them computed
 *  its own number the discount would be arbitrageable – enter at the covered price, withdraw at the
 *  full refund, bank the difference, repeat for every J30 on the calendar. */
export function travelCostFor(world: WorldState, event: SeasonEvent): number {
  return netTravelCents(event.travelCostCents, world.academy)
}

function chargeTravel(world: WorldState, event: SeasonEvent): void {
  const net = travelCostFor(world, event)
  const covered = event.travelCostCents - net
  world.fundsCents -= net
  if (world.academy && covered > 0) world.academy.coveredCents += covered
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'travel',
    // The sponsor valve's wording, for the same reason: the line is still emitted at its reduced
    // amount so the Money breakdown shows the relationship instead of the cost quietly shrinking.
    text:
      covered > 0
        ? `Travel to ${TIERS[event.tier].label} – academy covers ${Math.round(travelCoverShare(world.academy) * 100)}%`
        : `Travel to ${TIERS[event.tier].label}`,
    amountCents: -net,
  })
}

// --- the junior conveyor -----------------------------------------------------
// The field turns over once a year: who is still here, and who has just arrived underneath her.
// The mechanism and its whole argument live in season/conveyor.ts; this is the world-side wiring
// and the one line of news it is worth.

/** How well a departing player has to have been doing for her leaving to be NEWS. Top-50 of a
 *  ~200-strong field: somebody the player has plausibly seen in the standings or across a net. */
const NOTABLE_DEPARTURE_RANK = 50

function turnOverField(world: WorldState, seasonIndex: number): void {
  // The standings as they stand BEFORE the turnover – the only moment a departing player still has
  // a rank, because renewCohort removes her from the id list `fullRanking` is built over.
  const rankBefore = new Map(fullRanking(world).map((r) => [r.playerId, r.rank]))
  const { left, joined } = renewCohort(world.cohort, world.seed, seasonIndex)
  if (left.length === 0) return

  // The best-ranked of the ones who stopped. Named because a number alone ("9 players left") is
  // weather; a name the player has seen in the table is a story.
  let notable: { name: string; rank: number } | null = null
  for (const p of left) {
    const rank = rankBefore.get(p.id)
    if (rank === undefined || rank > NOTABLE_DEPARTURE_RANK) continue
    if (!notable || rank < notable.rank) notable = { name: p.name, rank }
  }

  const base = `A new intake: ${left.length} players have left the tour and ${joined.length} thirteen-year-olds have taken their places.`
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: notable ? `${base} ${notable.name} (#${notable.rank}) is among those who stopped.` : base,
  })
}

// --- the academy's annual review ---------------------------------------------
// Runs at the season boundary, on the rank she CARRIES IN (the one the season just gone earned
// her) and the year of tournaments behind it. Zero draws on any stream – see engine/academy.ts.

export function reviewAcademy(world: WorldState): void {
  const seasonIndex = seasonIndexOf(world.week)
  const prev = world.academy
  if (prev && prev.seasonIndex === seasonIndex) return // idempotent per season

  const ageYears = ageAtWeek(world.week)
  const playedLastYear = world.results.filter((r) => r.playerId === KID_ID && world.week - r.week <= RESULTS_WINDOW).length
  const level = reviewLevel({
    rank: world.kidRank,
    potential: world.potential,
    background: world.profile.background,
    playedLastYear,
    ageYears,
  })

  if (level <= 0) {
    if (prev) {
      // Why it ended matters – "she aged out" and "she stopped playing" are different stories, and
      // the second one is a lesson.
      const reason =
        ageYears > ECONOMY.academy.ageBand[1]
          ? 'she has aged out of their junior programme'
          : playedLastYear < ECONOMY.academy.minEventsPerYear
            ? 'she barely competed this year'
            : 'her year did not make their case'
      addEvent(world, {
        week: world.week,
        type: 'info',
        text: `The academy has ended her scholarship – ${reason}.`,
      })
    }
    world.academy = null
    return
  }

  const pct = Math.round(level * ECONOMY.academy.travelCover * 100)
  if (!prev) {
    fireMilestone(world, `academy-in-${seasonIndex}`, `An academy has taken her on – a scholarship covering ${pct}% of her travel.`)
  } else {
    const wasPct = Math.round(prev.level * ECONOMY.academy.travelCover * 100)
    if (pct !== wasPct) {
      addEvent(world, {
        week: world.week,
        type: 'info',
        text: `Academy review: her scholarship ${pct > wasPct ? 'rises' : 'falls'} to ${pct}% of her travel.`,
      })
    }
  }

  world.academy = {
    level,
    // A renewal is not a new offer: the relationship keeps its start date.
    sinceWeek: prev ? prev.sinceWeek : world.week,
    seasonIndex,
    coveredCents: 0,
  }

  // "и экипа" – the kit, once a year, as money rather than as a per-purchase discount, because it
  // arrives as a delivery and not as a coupon.
  const kit = kitGrantCents(level)
  if (kit > 0) {
    world.fundsCents += kit
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'academy',
      text: 'Academy kit grant – rackets, strings and shoes for the season',
      amountCents: kit,
    })
  }
}

// The kid's tournament run. Uses an EVENT-SCOPED sub-RNG only (never the main
// weekly stream) so entering or skipping never perturbs cohort drift / AI results.
/** "2-6 6-4 1-6" -> "6-2 4-6 6-1" */
export function flipScore(score: string): string {
  return score
    .split(' ')
    .map((set) => set.split('-').reverse().join('-'))
    .join(' ')
}

function fallbackPlayer(id: string): MatchPlayer {
  return { id, name: id, serve: 50, ret: 50, composure: 50, stamina: 50 }
}

// The kid's matches within a full result, in round order (she plays once per round she survives).
function kidMatchesOf(result: TournamentResult): MatchRecord[] {
  return result.matches.filter((m) => m.aId === KID_ID || m.bId === KID_ID)
}

// One kid match rendered as a News `match` event: identical text/shape to the old inline
// resolution. Skill snapshots come from the pre-drift `players` map so the record is stable.
function kidMatchEvent(
  world: WorldState,
  event: SeasonEvent,
  m: MatchRecord,
  players: Record<string, MatchPlayer>,
): { text: string; match: WorldMatch } {
  const tier = TIERS[event.tier]
  const oppId = m.aId === KID_ID ? m.bId : m.aId
  const oppName = (players[oppId] ?? fallbackPlayer(oppId)).name
  const kidWon = m.winnerId === KID_ID
  const stage = stageLabel(m.round, tier.drawSize)
  // MatchRecord scores are from bracket side A's perspective; news reads from the kid's.
  const kidScore = m.score && m.bId === KID_ID ? flipScore(m.score) : m.score
  // Short names for EVERYONE: cohort names are "First Last"; the kid's full name is
  // kidName + last name (kidMatchPlayer only carries the first name).
  const kidShort = formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  const a = { ...(players[m.aId] ?? fallbackPlayer(m.aId)) }
  const b = { ...(players[m.bId] ?? fallbackPlayer(m.bId)) }
  return {
    text: `${stage}: ${kidShort} ${kidWon ? 'beat' : 'lost to'} ${formatShortName(oppName)} ${kidScore ?? ''}`.trim(),
    match: { ...m, eventId: event.id, surface: event.surface, oppName, a, b },
  }
}

/** RIVALS BECOME REAL: turn the selected cohort rows into the players who actually take the court
 *  for `event` – base attributes → surface/style modifier → condition factor, exactly once and in
 *  the same order as the kid's, via the single `rivalMatchPlayer` helper (season/rival.ts).
 *
 *  THE one place both tournament paths (the kid's shadow run and the canonical AI bracket) build a
 *  rival, so the two can never disagree about who she is. `fatigue` is the week's derived
 *  conditions; a player absent from it has no results inside the fatigue window and is fresh.
 *  Pure – the cohort rows are read, never written – and ZERO RNG draws. */
function rivalField(entrants: AiPlayer[], event: SeasonEvent, fatigue: Map<string, number>): MatchPlayer[] {
  return entrants.map((p) => rivalMatchPlayer(p, event.surface, fatigue.get(p.id) ?? ECONOMY.condition.max))
}

// Compute the kid's full shadow tournament: same event-scoped RNG, same entrant selection, same
// bracket. Emits NO events and awards NO points – that is deferred to reveal/finalize. Snapshots
// the kid + every opponent she faces at PRE-drift skills so the revealed match records are stable
// no matter how the cohort drifts afterwards; since rival-life those snapshots are the FATIGUED,
// surface-styled opponents, i.e. exactly who she played, so a replay reproduces the match.
function computeShadowTournament(
  world: WorldState,
  event: SeasonEvent,
  ranking: RankingRow[],
  fatigue: Map<string, number>,
): PendingTournament {
  // R9-19 coupling ON: the kid plays at her CURRENT condition (post this week's accrual –
  // step 1c runs before step 2), on the event's surface as her play style meets it (surface-style).
  // The SCALED player is both what runs the bracket and what is snapshotted into `players`, so
  // revealed records and replays stay byte-identical no matter how her condition moves afterwards –
  // and the run's every round shares this ONE build. Fractional skills are fine for the match engine.
  const kid = kidMatchPlayerFor(world, event.surface)
  const kidRng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
  const entrants = selectEntrants(event, world.cohort, ranking, kidRng, fatigue)
  const field = rivalField(entrants, event, fatigue)
  // v21b: she goes into the draw AT HER STANDING, not at the bottom of it - the same place the
  // acceptance list would give her - and is seeded, or not, on the terms everybody else gets.
  const result = runTournament(event, field, kid, world.seed, kidRng, kidSeedIndexIn(field, ranking, KID_ID))
  const players: Record<string, MatchPlayer> = { [KID_ID]: { ...kid } }
  for (const m of result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    const oppId = m.aId === KID_ID ? m.bId : m.aId
    const ai = field.find((p) => p.id === oppId)
    players[oppId] = ai ? { ...ai } : fallbackPlayer(oppId)
  }
  return { eventId: event.id, result, revealedRounds: 0, finished: false, players }
}

// Step 5 of a resolved week: recompute the kid's rank vs the whole field and fire rank milestones.
// Shared by a normal tick (inline) and finalizeTournament (deferred for a reveal week).
function recomputeRankAndMilestones(world: WorldState): void {
  world.prevKidRank = world.kidRank
  // Both "before" values, captured together, so no surface can diff across the two tables.
  world.prevKidRankDomestic = world.kidRankDomestic ?? null
  // ⚠ ONE WRITER, ONE MEANING. This used to rank with `computeRanking(results, week, ids)` and NO
  // track predicate - so it folded BOTH ladders into one table and wrote that into `kidRank`, while
  // `recomputeKidRank` wrote the ITF rank into the same field and `computeStandings` rendered the
  // ITF table. Whichever ran last won, so Home and the season wrap-up showed her combined-table
  // place (#4 on 604 points) while the Stats table showed her ITF row (#128 on 4) - the owner's
  // playtest finding, and four items on his list are this one bug wearing different clothes.
  //
  // The two-ladder slice removed `kidPoints`' default track for exactly this reason; this call site
  // survived because it reached for `computeRanking` directly instead. It now defers to the one
  // function that owns the caches, so the field cannot mean two things again.
  recomputeKidRank(world)
  // Rank milestones ("top 10/50/1") intentionally removed: in the early season almost no one
  // has points, so the first result rockets her to a single-digit rank and all of them fire at
  // once (reads absurdly). A real "world" ranking belief system belongs to the world-news
  // feature (Phase 4+), not this placeholder cohort ranking.
}

// Step 6 of a resolved week: prune ledgers/feeds, roll the calendar forward.
function housekeep(world: WorldState): void {
  pruneResults(world)
  pruneEvents(world)
  pruneFinanceWeeks(world)
  prunePlannerBookings(world)
  pruneInternationalEntries(world)
  ensureSeason(world)
}

/** The clause appended to a tournament summary that explains the EFFECTIVE ranking change
 *  (round-5 item 1a). `delta` is the change in the kid's windowed best-6 sum caused by the
 *  new result: `points` when nothing was displaced, `points − displaced` when a counted
 *  result was pushed out, `0` when the result didn't crack the best 6. */
export function rankingDeltaSuffix(points: number, delta: number): string {
  if (points <= 0) return ''
  if (delta <= 0) return ' (does not improve best 6)'
  if (delta < points) return ` (ranking total +${delta})`
  return ''
}

// Commit the kid's run: award points, emit the summary + milestones, recompute rank + housekeep.
// Runs once, when the last kid match is revealed. Keeps `pendingTournament` alive (finished: true)
// so the finale stays a real snapshot; `closeTournament` clears it.
function finalizeTournament(world: WorldState): void {
  const p = world.pendingTournament
  if (!p || p.finished) return
  const event = eventById(world, p.eventId)
  if (!event) {
    world.pendingTournament = null
    return
  }
  const tier = TIERS[event.tier]
  const kidFinish = p.result.finishes[KID_ID] ?? Math.log2(tier.drawSize)
  const points = tier.points[kidFinish] ?? 0

  // v10: remember the kid's best (smallest) finish index per tier – drives the Home season strip.
  const priorBest = world.bestFinishByTier[event.tier]
  if (priorBest === undefined || kidFinish < priorBest) world.bestFinishByTier[event.tier] = kidFinish

  // v10: count this season's kid wins/losses as they resolve (never re-parsed from text; pruning
  // can't lose them). Every match on the kid's path is one played match.
  for (const m of p.result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    if (m.winnerId === KID_ID) world.seasonWins++
    else world.seasonLosses++
  }

  // R9-7: the run's physical toll lands HERE, when it commits – per-match, not flat per tier.
  // A skipped event week (R9-9) or a walkover never reaches finalize, so neither costs strain.
  world.condition = clamp(
    world.condition - tournamentRunStrain(event.tier, kidMatchesOf(p.result)),
    ECONOMY.condition.min,
    ECONOMY.condition.max,
  )

  // Effective ranking delta = kid's windowed best-6 sum after adding the result minus before.
  //
  // THE KID'S ROW IS STILL AWARD-ONLY, deliberately (fix/rival-fatigue-rows). The cohort's rows
  // became APPEARANCE rows because the ledger is the only record rival fatigue has; the kid needs
  // no such record – her run's strain is charged directly, twenty lines above, off the very match
  // list that produced it. What she does still read out of the ledger is `playedWeeksInTrailing4`
  // (the consecutive-play multiplier on injury risk), and THAT is under-counting a week she lost
  // her opener in, exactly as rival fatigue was. It is left alone here on purpose: it moves injury
  // exposure, which is a tuning decision with its own targets, and folding it into this slice would
  // make the cohort-fatigue measurement unattributable. Flagged for the owner in the commit message.
  const before = windowedBestSum(world.results, world.week, KID_ID)
  if (points > 0) world.results.push({ playerId: KID_ID, week: world.week, points, tier: event.tier })
  const after = windowedBestSum(world.results, world.week, KID_ID)
  addEvent(world, {
    week: world.week,
    type: 'tournament',
    text:
      `${tier.label} (${event.surface}, ${weekLabel(event.week)}): ${world.profile.kidName} – ` +
      `${finishLabel(kidFinish)} (+${points} pts)${rankingDeltaSuffix(points, after - before)}`,
    finishIdx: kidFinish,
  })
  // World news: who actually took the title of the draw she played in. When the kid IS the
  // champion, the summary + first-title milestone already celebrate it, so only report others.
  const championId = Object.entries(p.result.finishes).find(([, f]) => f === 0)?.[0]
  if (championId && championId !== KID_ID) {
    const champName = world.cohort.find((c) => c.id === championId)?.name ?? p.players[championId]?.name ?? championId
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: `🏆 ${formatShortName(champName)} won the ${tier.label} (${event.surface}).`,
    })
  }
  if (kidFinish === 0) fireMilestone(world, 'first-title', `🏆 First career title: ${tier.label}!`)
  // D10: the durable ledger remembers the FIRST title and the FIRST final per tier, at the moment
  // they land. A title week captures both – reaching the final is part of winning it.
  if (kidFinish === 0) captureMilestone(world, { type: 'title', week: world.week, tier: event.tier })
  if (kidFinish <= 1) captureMilestone(world, { type: 'final', week: world.week, tier: event.tier })
  if (
    event.tier === 'national' &&
    p.result.matches.some((m) => (m.aId === KID_ID || m.bId === KID_ID) && m.winnerId === KID_ID)
  ) {
    fireMilestone(world, 'first-national', '🏆 First win at National level!')
  }
  recomputeRankAndMilestones(world)
  housekeep(world)
  p.finished = true
}

/** Reveal ONE more kid match: emit its News `match` event, bump `revealedRounds`, and finalize the
 *  run once the kid's last match (elimination or the final) has been shown. Idempotent when done. */
export function revealTournamentRound(world: WorldState): void {
  const p = world.pendingTournament
  if (!p || p.finished) return
  const event = eventById(world, p.eventId)
  if (!event) return
  const kidMatches = kidMatchesOf(p.result)
  const m = kidMatches[p.revealedRounds]
  if (!m) {
    finalizeTournament(world)
    return
  }
  const ev = kidMatchEvent(world, event, m, p.players)
  addEvent(world, { week: world.week, type: 'match', text: ev.text, match: ev.match })
  p.revealedRounds++
  if (p.revealedRounds >= kidMatches.length) finalizeTournament(world)
}

/** Reveal every remaining round at once, then finalize – the "Skip tournament" path to the finale. */
export function skipTournament(world: WorldState): void {
  const p = world.pendingTournament
  if (!p || p.finished) return
  const event = eventById(world, p.eventId)
  if (!event) return
  const kidMatches = kidMatchesOf(p.result)
  while (p.revealedRounds < kidMatches.length) {
    const ev = kidMatchEvent(world, event, kidMatches[p.revealedRounds], p.players)
    addEvent(world, { week: world.week, type: 'match', text: ev.text, match: ev.match })
    p.revealedRounds++
  }
  finalizeTournament(world)
}

/** Dismiss a finished reveal (the finale's "Continue"): clear the pending state so the week closes. */
export function closeTournament(world: WorldState): void {
  world.pendingTournament = null
}

// The canonical AI-only bracket for one event. Runs on its OWN EVENT-SCOPED stream
// `seed:aitour:<event.id>` – the exact mirror of the kid's `seed:kidtour:<event.id>` – covering
// BOTH the entrant selection and the AI-vs-AI matches. ZERO main-stream draws.
//
// Why it is scoped and not on the main weekly stream: the calendar is content. While the brackets
// drew from the main stream, adding a tier or densifying a cadence changed the per-week draw count
// by construction, which re-based every frozen invariance pin – the ladder-up slice had to move
// them for exactly that reason. Scoped by (world.seed, event.id) – two immutable values, and
// event.id is unique per (year, week, tier) – the AI world is now a pure function of the event, so
// content is free and a reloaded career replays its brackets by construction rather than by the
// worker fast-forwarding the main stream onto precisely the right draw.
//
// RIVALS BECOME REAL: the field is built through `rivalField`, so the bracket runs on rivals who
// are tired from their own recent schedule and coloured by how their style suits the surface. That
// costs no draw – both are pure derivations – so everything above still holds. The awarded rows now
// record their `tier`, which is what lets next week's reconstruction read them EXACTLY instead of
// guessing (SeasonResult.tier has always been optional, so this is not a schema bump).
//
// EVERY ENTRANT LEAVES A ROW – SCORING OR NOT (fix/rival-fatigue-rows). This loop used to guard on
// `points > 0`, which was harmless while every finish paid: "has a row" and "played that week" were
// the same fact. Wave B's first-round zero ended that, and the guard then deleted the ONLY record
// that half of every draw had played at all – so `season/rival.ts`, which reconstructs a cohort
// player's strain from her rows, read a rival who lost her opener as having RESTED. She banked
// `recoveryBase` for a week she spent travelling and playing. Measured on the real engine
// (tools/rival-fatigue-audit.ts, 12 cells × 30 seeds × 208w): 45.6% of all cohort appearances were
// charged no strain whatever, the field ran ~4 points of condition fresher than the tennis it
// played, and the cohort's win% against the kid moved with it.
//
// So the row is written for EVERY entrant of the draw and `points` carries the award, 0 included.
// The two facts now live in two fields instead of one presence check, which is what
// `isCountingResult` exists to keep honest: nothing that reads the ledger as a STANDINGS table sees
// a scoreless row (computeRanking / windowedBestSum / the counting-results list all filter it out),
// and the one system that reads it as a record of PLAY – the rival fatigue window – sees all of it.
// This is the same shape `season/prehistory.ts` has always written; the live path is what moved.
//
// COSTS NOTHING ON THE STREAM: pushing a row draws no RNG on any stream, and the loop already
// visited every entrant (`result.finishes` is dense over the whole draw). The frozen MAIN capture
// 41550 / e6b0c709 is untouched by construction – points are post-draw arithmetic, read off a table
// after the bracket has already been resolved. The ledger roughly doubles in size (a 32-draw writes
// 32 rows instead of 16); it is still pruned on the same 52-week rule and stays ~2k rows.
function runAiTournament(
  world: WorldState,
  event: SeasonEvent,
  aiRanking: RankingRow[],
  fatigue: Map<string, number>,
): void {
  const aiRng = rngFromSeed(`${world.seed}:aitour:${event.id}`)
  const field = rivalField(selectEntrants(event, world.cohort, aiRanking, aiRng, fatigue), event, fatigue)
  const result = runTournament(event, field, null, world.seed, aiRng)
  const pts = TIERS[event.tier].points
  for (const [playerId, finish] of Object.entries(result.finishes)) {
    world.results.push({ playerId, week: world.week, points: pts[finish] ?? 0, tier: event.tier })
  }
}

function pruneResults(world: WorldState): void {
  world.results = world.results.filter((r) => world.week - r.week <= RESULTS_WINDOW)
}

function pruneEvents(world: WorldState): void {
  if (world.events.length <= EVENTS_CAP) return
  const kept = world.events.filter((e) => e.keep)
  const rest = world.events.filter((e) => !e.keep)
  const overflow = world.events.length - EVENTS_CAP
  const trimmed = overflow >= rest.length ? [] : rest.slice(overflow)
  world.events = [...kept, ...trimmed].sort((a, b) => a.id - b.id)
}

// Drop finance-ledger weeks older than the 60-week trailing window (retain week >= week - 59).
// Bounded by career length, not event volume, so it stays ≤ ~60 entries no matter the season.
function pruneFinanceWeeks(world: WorldState): void {
  world.financeWeeks = world.financeWeeks.filter((w) => w.week >= world.week - (FINANCE_WEEKS - 1))
}

// --- the losing streak (fix/world-trio item 3) --------------------------------
// `angry` finally has a trigger, and it is the owner's: she gets angry after a RUN of losses, of a
// length the player cannot count to (a threshold drawn per streak in ANGER_STREAK_MIN..MAX).
//
// WHY THE ENGINE OWNS THIS. `avatarEmotion()` is a pure function of one result – no seed, no
// history – so it can neither count a streak nor draw a threshold. Both are done here, once, and
// travel on the snapshot; the pure decision then only compares two numbers. That split is also what
// makes the face STABLE: a threshold re-drawn on every render would flip her between `sad` and
// `angry` on the same screen (a UI-side draw has no idea it has already been made).
//
// THE STREAK RULES, and the reasoning for each:
//
//  * A COMPETITIVE MATCH SHE LOST extends it; a COMPETITIVE MATCH SHE WON ends it. Those are the
//    only two things that move it. Note this makes an entire tournament RUN self-clearing: a run
//    that reaches the final is W,W,W,L in the feed, so walking back from the newest event stops at
//    the first of those wins and the streak is 1 – a good week cannot leave anger banked.
//
//  * A PRACTICE FRIENDLY IS INVISIBLE – it neither counts nor breaks. Forced by R11-2 (the owner:
//    a friendly must not move her face at all): if a friendly LOSS could push her over the edge, a
//    hit-out at the club would have changed her face, and if a friendly WIN could clear a run of
//    real defeats, it would have changed it just as much in the other direction. Consistency here
//    is not a judgement call, it is the same rule read twice – so it is the same predicate, too
//    (`resultShowsOnHerFace`, shared/avatarEmotion.ts).
//
//  * A WALKOVER OR A MEDICAL WITHDRAWAL IS INVISIBLE – neither counts nor breaks. She never took
//    the court: there is no defeat to add (losing to her own body is what `injury`/`tired` are for,
//    and the injury emotion outranks the whole idle ladder anyway), and there is no performance to
//    forgive her with either. Making it BREAK the streak would be perverse – a forfeited entry
//    would launder away four real losses – and making it COUNT would punish her for an injury
//    twice. This falls out of the walk for free: both emit `injury`-type events carrying no
//    `match`, so the predicate above already skips them. Stated explicitly because "it happens to
//    work" is exactly how such a rule rots.
//
//  * The streak spans SEASONS. A season boundary is a calendar fact, not something that happens to
//    her; nothing about New Year makes the fifth defeat land softer.
//
// COST ON THE MAIN STREAM: ZERO. The threshold comes from `rngFromSeed(seed:angry:<startWeek>)` –
// a purpose-scoped sub-stream, the same shape as `:injury:<week>` and `:aitour:<eventId>` – and
// nothing here touches the weekly `rng`. The frozen capture (41550 / e6b0c709) cannot move: this
// runs at SNAPSHOT time, which is not part of the tick at all.
//
// The start week is the key because it is the ONE thing about a streak that does not change while
// the streak grows – keying on the length would re-draw at every new loss, which is the flicker
// again. At most one competitive loss can exist per week (one tournament a week, and a bracket
// eliminates her exactly once), so a start week identifies its streak uniquely.
export function computeLossStreak(world: WorldState): LossStreak | null {
  let losses = 0
  let startWeek = 0
  for (let i = world.events.length - 1; i >= 0; i--) {
    const e = world.events[i]
    if (!resultShowsOnHerFace(e)) continue
    if (e.match!.winnerId === KID_ID) break
    losses++
    startWeek = e.week
  }
  if (losses === 0) return null
  return {
    losses,
    startWeek,
    angerAt: pickInt(rngFromSeed(`${world.seed}:angry:${startWeek}`), ANGER_STREAK_MIN, ANGER_STREAK_MAX),
  }
}

// --- lifecycle ---------------------------------------------------------------
export function createWorld(
  seed: string,
  profile: PlayerProfile = DEFAULT_PROFILE,
  careerId: string = `legacy-${seed}`,
): WorldState {
  const fundsCents = STARTING_FUNDS_CENTS[profile.background]
  const cohort = generateCohort(seed)
  // Ladder-up Part A: the cohort arrives with a season already behind it (season/prehistory.ts),
  // so week-1 entrant fields are ranking-MEANINGFUL and the standings are not a 199-way tie at 0.
  // Rows sit at NEGATIVE weeks [-51, -1]; they count inside the existing rolling-52 window at
  // week 0 and are pruned away by the normal `world.week - r.week <= RESULTS_WINDOW` rule as the
  // first season runs – NO new field and NO schema bump. Audited before adopting the shape: the
  // only week-sensitive reads over `results` are pruneResults, computeRanking/windowedBestSum
  // (all three use the same `<= WINDOW` difference, which is sign-agnostic), playedWeeksInTrailing4
  // and computeCountingResults (KID-only, and pre-history is AI-only), and maybeFireSeasonWrapUp's
  // `inRange` (`w >= yearStart`, so negative weeks are excluded from every season figure). Nothing
  // clamps a result week at 0 and nothing feeds a result week to weekYear.
  // The kid gets NO pre-history: she still starts on 0 points and reads "Unranked".
  const world: WorldState = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    careerId,
    seed,
    week: 0,
    fundsCents,
    profile,
    plan: { ...WEEK_PLAN_PRESETS.balanced },
    cohort,
    results: generatePreHistory(seed, cohort),
    season: [],
    entries: [],
    events: [],
    nextEventId: 0,
    // Placeholder only – recomputeKidRank below replaces it with the real value (last, behind the
    // whole cohort, because she is the only player without a counting result).
    kidRank: cohort.length + 1,
    prevKidRank: null,
    // Phase 4: her starting build is the SAME derivation that used to be recomputed on demand, so
    // week 0 is byte-identical to the pre-development engine. What changed is that it is now state,
    // and state moves.
    skills: startingSkills(seed, profile),
    potential: rollPotential(seed, startingSkills(seed, profile)),
    // Nobody is backing her yet. The first review is the season boundary at week 52 – she has to
    // put a year in front of them before anyone writes a letter.
    academy: null,
    // R12-S1: season 0's start rank is set below, once `recomputeKidRank` has produced the real
    // value – she starts dead last behind the whole cohort, because she is the only player without
    // a counting result, and that is a true and meaningful thing for her first wrap-up to say.
    seasonStartRank: null,
    pendingTournament: null,
    bestFinishByTier: {},
    lastSeasonSummary: null,
    seasonHistory: [],
    seasonWins: 0,
    seasonLosses: 0,
    financeWeeks: [],
    condition: ECONOMY.condition.start,
    injury: null,
    injuryHistory: [],
    physioActive: coachIncludesPhysio(profile.coachTier),
    // v23: onboarding picks a RUNG, so the world picks the person on it - the coach at that rung
    // who suits her game best, and the cheapest of those when several tie. That is what a parent
    // walking into an academy and saying "we can afford this much" actually gets, and it means a
    // career opens with a real named coach rather than an abstraction.
    coachId: openingCoachId(seed, profile),
    // Default OFF - the automatic rule is that competition weeks are not coach weeks.
    coachOnEventWeeks: false,
    vacations: [],
    practices: [],
    recoveryBuff: null,
    milestones: [],
    internationalEntryWeeks: [],
  }
  addEvent(world, {
    week: 0,
    type: 'info',
    keep: true,
    text: `${profile.kidName}'s career started (seed "${seed}"). Family budget: $${(fundsCents / 100).toLocaleString('en-US')}.`,
  })
  ensureSeason(world)
  recomputeKidRank(world)
  world.seasonStartRank = world.kidRank // R12-S1 – see the field above
  return world
}

/** Hydrate the Phase-3 systems onto a pre-v6 save. Idempotent for v6+. */
export function seedWorldForV6(save: Partial<WorldState> & { seed: string; week: number; log?: string[] }): void {
  save.cohort = generateCohort(save.seed)
  save.results = []
  save.entries = []
  save.internationalEntryWeeks = []
  save.season = []
  save.nextEventId = 0
  const oldLog = Array.isArray(save.log) ? save.log : []
  save.events = oldLog.map((text) => ({ id: save.nextEventId!++, week: save.week, type: 'info' as const, text }))
  save.kidRank = save.cohort.length + 1
  save.pendingTournament = null
  save.bestFinishByTier = {}
  save.lastSeasonSummary = null
  save.seasonHistory = []
  save.seasonWins = 0
  save.seasonLosses = 0
  save.financeWeeks = []
  save.condition = ECONOMY.condition.start
  save.injury = null
  save.injuryHistory = []
  save.physioActive = coachIncludesPhysio(save.profile?.coachTier ?? DEFAULT_PROFILE.coachTier)
  save.coachId = openingCoachId(save.seed, save.profile ?? DEFAULT_PROFILE)
  save.coachOnEventWeeks = false
  save.vacations = []
  save.practices = []
  save.recoveryBuff = null
  save.milestones = []
  ensureSeason(save as WorldState)
  recomputeKidRank(save as WorldState)
  // R12-S1 (v17): a pre-v6 save carries no season history at all, so the honest value for "the rank
  // she entered this season on" is the one the rebuilt world has right now.
  save.seasonStartRank = save.kidRank ?? null
  delete save.log
}

// --- Round-8 R8-7a: entry lists close at the deadline --------------------------
// Real-world rule (owner 25.07): players out of band at close are removed and refunded.
// If the kid's points have grown OUT of a tier's band while she still holds a
// still-refundable (pre-deadline) entry of that tier, the organisers release the entry
// at the top of the weekly tick: full refund via the existing withdrawEvent (mirror of
// slice C's injury auto-withdraw) + an info beat. A POST-deadline entry is never touched
// – the list closed with her in band, the fee is committed and the event still plays.
// Pure state, ZERO RNG draws – the B1/C1 main-stream invariance freezes stay untouched.
function releaseOutgrownEntries(world: WorldState): void {
  if (world.entries.length === 0) return
  const points = kidPoints(world, 'domestic')
  for (const id of [...world.entries]) {
    const event = eventById(world, id)
    if (!event || world.week > event.deadlineWeek) continue // closed list – fee committed
    if (!outgrewTier(event.tier, points)) continue // still inside (or under) the band
    withdrawEvent(world, id)
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: `Entry released – she's outgrown ${TIERS[event.tier].label}. Fee refunded.`,
    })
  }
}

// Full weekly resolution. The MAIN stream carries exactly TWO things, in this fixed order:
// resolveBaseCosts (3 draws, 4 when the sponsor roll hits) and driftCohort (4 per cohort player).
// Nothing else – both tournament sides run on EVENT-scoped streams (`seed:kidtour:<id>` for the
// kid's shadow run, `seed:aitour:<id>` for the canonical AI bracket), so the weekly draw count is
// independent of player input AND of how much content the calendar carries.
//
// When the kid has an entered event this week the resolution PAUSES: the shadow tournament is
// computed (byte-identical to the old inline run) and stashed in `world.pendingTournament`, but its
// match/summary/milestone events, ranking points and the week's rank recompute are all deferred to
// the reveal/finalize flow (revealTournamentRound / skipTournament). The main-stream work (base
// costs, drift) and the AI brackets still run, so the per-week draw count is unchanged.
export function tickWeek(world: WorldState, rng: Rng): void {
  world.week += 1

  // 0a00. R12-S1: a NEW SEASON opens – bank the rank she carries into it, before anything this year
  //       can move it. This is the only moment the number exists: by the wrap-up 49 weeks later the
  //       results behind it have been pruned out of the 52-week window and it cannot be replayed
  //       (which is exactly how the wrap-up came to report "from #1"). `world.kidRank` here is still
  //       last week's – the final off-season week of the season just gone – which is precisely "the
  //       rank she started this season on". Pure state, ZERO draws, and it runs before every RNG
  //       step so it cannot perturb the weekly sequence.
  if (world.week % WEEKS_PER_YEAR === 0) {
    world.seasonStartRank = world.kidRank
    // 0a0b (v20): AND EVERYBODY GETS A YEAR OLDER. The cohort had no age at all until now, which is
    // why it grew for ever and the ladder could never be caught. Pure arithmetic, ZERO draws, and
    // it runs beside the rank capture because they are the same event: a season turned over.
    ageCohort(world.cohort)
    // 0a0c (v21): AND THE ACADEMY DECIDES. It reads `world.kidRank` before this season can touch
    // it – the rank the year just gone earned her – which is precisely what an academy reviewing
    // her in the off-season would be looking at. ZERO draws, so it is safe this far up the tick.
    reviewAcademy(world)
    // 0a0d: AND THE FIELD TURNS OVER. Last, because everything above is about the season that just
    // ENDED and wants the field that played it – the academy's verdict in particular is a reading
    // of her standing among those players, not among their replacements. ZERO main-stream draws:
    // the conveyor runs entirely on `seed:conveyor:<season>`. See season/conveyor.ts.
    turnOverField(world, seasonIndexOf(world.week))
  }

  // 0a0. R9-1: savings interest on the carried-in balance. ZERO draws.
  resolveInterest(world)

  // 0a. Round-8 R8-7a: release (refund) still-refundable entries whose tier she has
  //     outgrown. Pure state, ZERO draws, so it sits safely ahead of every RNG step.
  releaseOutgrownEntries(world)

  // 0. parent's weekly contribution BEFORE costs (no RNG draw)
  resolveParentIncome(world)

  // 1. base costs (main stream, plan-independent draw count)
  resolveBaseCosts(world, rng)

  // 1b. recurring gear line-items (round-7 a). Zero main-stream draws – purpose-scoped
  //     sub-streams only – so this never perturbs the weekly draw count.
  resolveGear(world)

  // 1c. Season-Life availability. ZERO main-stream draws: rollInjury/resolvePhysio pull only
  //     from the private per-week `:injury:`/`:physio:` sub-streams and accrueCondition is pure
  //     arithmetic. Sits here (not inside the pendingTournament block) so it runs exactly once
  //     per real week, reveal weeks included. rollInjury runs FIRST so a fresh injury reads as
  //     the walkover it is (played = false ⇒ she keeps the match-free slider bonus). R9-7:
  //     match fatigue no longer accrues here – it lands per-match at finalizeTournament, so a
  //     walkover/skipped week costs none by construction.
  //     Season planner (v13): the booked week types resolve INSIDE this step, on private
  //     sub-streams only. Order matters – rollInjury first (so an injury can still cancel the
  //     friendly and refund the court), then the week-type accrual, then the vacation gain /
  //     the friendly's drain, exactly like finalizeTournament applies its strain after accrual.
  rollInjury(world)
  expireRecoveryBuff(world)
  const playedThisWeek = isCompetitionWeek(world) // injured on the play week => walkover
  accrueCondition(world, playedThisWeek)
  resolveVacation(world)
  resolvePractice(world)
  resolvePhysio(world)

  const ids = cohortIds(world)
  const scheduled = world.season.filter((e) => e.week === world.week)
  // Canonical ranking excludes the kid so AI-field selection never depends on the kid's own
  // results / entry history – the canonical AI world stays the same world whatever she does.
  const aiRanking = computeRanking(
    world.results.filter((r) => r.playerId !== KID_ID),
    world.week,
    ids,
  )

  // RIVALS BECOME REAL: every cohort player's condition for THIS week, derived ONCE from the
  // results ledger before any of the week's brackets run. Deriving it up front (rather than per
  // event) is what keeps the week coherent: every event scheduled this week sees the same rivals,
  // and the kid's shadow run (step 2) and the canonical AI brackets (step 4) can never disagree
  // about how tired an opponent is. Pure derivation, ZERO main-stream draws.
  const rivalFatigue = rivalConditions(world.results, world.week)

  // 2. the kid's entered event this week (event-scoped RNG only): charge travel and stash the
  //    fully-computed shadow tournament. Nothing kid-specific is emitted/awarded here – the flow does.
  const enteredThisWeek = scheduled.find((e) => world.entries.includes(e.id))
  // An injury turns an entered event into a walkover: no travel, no shadow run, 0 points.
  // Only a POST-deadline entry can still be live here – pre-deadline entries were auto-withdrawn
  // (and refunded) at onset by rollInjury; past the deadline the fee is forfeited (withdrawEvent
  // refuses), so the walkover event is all that remains of the trip that never happened.
  //
  // THE DOCTOR CHECKS HER ON ARRIVAL (owner 26.07). The medical floor used to gate ENTRY only, and
  // entries commit ENTRY_LOOKAHEAD weeks ahead of the play week – so a run entered healthy could
  // still be PLAYED at condition 0 and nothing intervened (the fatigue bench traced 14 straight
  // such weeks). The floor is therefore re-read HERE, on the play week, against the condition she
  // will actually take the court at (step 1c has already accrued, so this is the same number
  // computeShadowTournament would scale her by). Precedence mirrors availabilityStatus exactly –
  // injured > medical – so the two surfaces can never disagree about which beat fires.
  // Pure state: ZERO new RNG draws, on any stream.
  //
  // R12-3 / R12-15: the two comparisons above USED to be spelled out inline here – `world.injury
  // !== null` and `medicalClearance(world.condition)` – a private copy of two rules that already
  // had names. They now come from `arrivalStatus`, the ONE arrival verdict the sticky-bar button
  // also reads off the snapshot, so the week cannot resolve one way while the button that played it
  // promised another. Byte-identical by construction: on the play week `world.week === event.week`,
  // so `layoffCovering(world, event.week)` is `injury !== null && 0 < weeksRemaining`, which is
  // exactly `world.injury !== null` (rollInjury clears at 0 before this runs); and `medicalBlock` is
  // non-null exactly when `medicalClearance` returns 'withdraw'.
  const arrival = enteredThisWeek ? arrivalStatus(world, enteredThisWeek) : null
  const clearance = enteredThisWeek ? medicalClearance(world.condition) : 'clear'
  if (enteredThisWeek && arrival!.verdict === 'injured') {
    // R12-15: MARK THE WEEK, so `advanceWeeks` halts on it exactly once. A walkover forfeits the
    // entry fee just as surely as the medical withdrawal below does, and the owner's dead click was
    // this beat passing in total silence – no dialog, no toast, and a "Play" button that had just
    // promised a tournament. Derived state, deliberately not persisted (like
    // `medicalWithdrawalWeek`): a reload replays the tick and re-derives it.
    world.walkoverWeek = world.week
    addEvent(world, {
      week: world.week,
      type: 'injury',
      text: `Walkover: too injured to play the ${TIERS[enteredThisWeek.tier].label} – 0 pts, entry fee forfeited.`,
    })
  } else if (enteredThisWeek && arrival!.verdict === 'medical') {
    // WITHDRAWN ON MEDICAL GROUNDS: no travel charge (she never boards), no shadow run, 0 points.
    // The ENTRY FEE IS FORFEITED – the same rule skipEvent uses for a post-deadline pull-out, and
    // the same rule the injury walkover above uses. Chosen over a refund because it is the identical
    // real-world situation: the list closed with her on it, so the organisers keep the fee whatever
    // the reason she does not appear. Refunding here would also make the doctor's veto financially
    // FREE, i.e. a cheap late exit from any entry she regrets – the fee has to bite or "enter it and
    // see" becomes the dominant strategy.
    world.entries = world.entries.filter((id) => id !== enteredThisWeek.id)
    // Mark the week so advanceWeeks halts ONCE on it (see the stop below). The owner hit exactly this
    // trap with injuries – he skipped weeks, an entry was silently withdrawn, and he only found out
    // in the news three weeks later – so a forfeited entry must never pass by unseen either. The
    // marker is derived state, not saved: a reload replays the tick and re-derives it.
    world.medicalWithdrawalWeek = world.week
    addEvent(world, {
      week: world.week,
      type: 'injury',
      text: `Withdrawn from the ${TIERS[enteredThisWeek.tier].label} – not cleared to play on medical advice. 0 pts, entry fee forfeited.`,
    })
    // The week is match-free after all, so she earns the FULL free-week recovery ladder that
    // accrueCondition withheld when it still believed she would play (it ran with played = true, so
    // she banked matchWeekRecoveryBase instead of recoveryBase + the rest-slider bonus). Written as
    // the DIFFERENCE so it lands on exactly what a non-playing week pays, whatever the two knobs
    // are set to – and so this stays byte-consistent with the bench's independent trace, which
    // reads the week as free. Integer, clamped, zero draws.
    //
    // NOTE for the architect: skipEvent (R9-9) hands back the rest-slider bonus ALONE. That was
    // exactly right when it was written (matchWeekRecoveryBase == recoveryBase == 2) and quietly
    // became a short payment at the V2 flip, which set matchWeekRecoveryBase to 0 – so a skipped
    // event week still under-pays by recoveryBase. NOT touched here: fixing it moves shipped
    // condition traces, which is a tuning call, not a merge call.
    world.condition = clamp(
      world.condition +
        (ECONOMY.condition.recoveryBase - ECONOMY.condition.matchWeekRecoveryBase) +
        restRecoveryBonus(world.plan.rest),
      ECONOMY.condition.min,
      ECONOMY.condition.max,
    )
  } else if (enteredThisWeek) {
    chargeTravel(world, enteredThisWeek)
    // ...and the WARNING BAND: cleared, but only just. She plays; the doctor goes on record. Emitted
    // after the travel charge so the week reads chronologically in the news feed (trip → the doctor
    // sees her → her matches). Type 'info' rather than 'injury': nothing has happened to her body,
    // somebody SAID something, which is what the 💬 channel is for.
    if (clearance === 'warn') {
      addEvent(world, {
        week: world.week,
        type: 'info',
        text: `Doctor's warning – she is cleared for the ${TIERS[enteredThisWeek.tier].label}, but only just. He can warn you; he cannot forbid it.`,
      })
    }
    world.pendingTournament = computeShadowTournament(world, enteredThisWeek, aiRanking, rivalFatigue)
  }

  // 3. cohort drift (main stream, fixed 4-draws-per-player)
  driftCohort(world.cohort, rng)

  // 3b. SHE DEVELOPS (Phase 4). Deliberately here, beside the cohort's own drift: the whole point
  //     is that both sides of the ladder move, and putting them on adjacent lines is the cheapest
  //     way to keep it that way. ZERO main-stream draws – `growWeek` reads `seed:growth:<week>`,
  //     its own stream – so the frozen capture cannot move.
  //
  //     The matches that feed it are THIS week's, counted off the ledger she just wrote, so a
  //     tournament week teaches her and a training week does not pretend to.
  const matchesThisWeek = world.events.filter(
    (e) => e.week === world.week && e.type === 'match' && !e.friendly,
  ).length
  world.skills = growWeek({
    skills: world.skills,
    potential: world.potential,
    ageYears: ageAtWeek(world.week),
    plan: world.plan,
    // ⚠ HE ONLY COACHES THE WEEKS HE IS PAID FOR (R4). A competition week she has not bought him
    //     for is a week he is not there, so it develops at the self-coached rate - which is what
    //     makes `coachOnEventWeeks` a decision rather than free money. Same predicate the bill used
    //     at step 1, so the two can never disagree about whether he came.
    coach: coachWorksThisWeek(world) ? coachById(world.seed, ageAtWeek(world.week), world.coachId) : null,
    playStyle: world.profile.playStyle,
    matchesThisWeek,
    seed: world.seed,
    week: world.week,
  })

  // 4. canonical AI tournaments for ALL scheduled events. ZERO main-stream draws: each event's
  //    bracket runs on its own `seed:aitour:<event.id>` stream, so the calendar's SIZE no longer
  //    touches the weekly draw count. The main stream ends here carrying base costs + drift only.
  for (const e of scheduled) runAiTournament(world, e, aiRanking, rivalFatigue)

  // 5-6. rank recompute + housekeeping. For a reveal week these are deferred to finalizeTournament
  //      (after the kid's points land), so the rank milestones keep their id order behind the kid's
  //      match/summary events. A normal week resolves them inline as before.
  if (!world.pendingTournament) {
    recomputeRankAndMilestones(world)
    housekeep(world)
    maybeFireSeasonWrapUp(world)
  }
}

/** The kid's EARNED ranking points: her windowed best-6 sum at the current week – the same value
 *  `computeRanking` assigns her, an absolute measure of achievement (a fresh kid = 0). Derived on the
 *  fly from the results ledger (no persisted state → no schema bump); the eligibility ladder reads it. */
// NO DEFAULT, DELIBERATELY. There are two tables now and "her points" is no longer a question with
// one answer, so every caller has to say which one it means. Making the argument required turns a
// silent change of meaning into a compile error - which is what a change of this kind should be.
export function kidPoints(world: WorldState, track: LadderTrack): number {
  return windowedBestSum(world.results, world.week, KID_ID, inTrack(track))
}

/** Her domestic best-6 - the number the domestic rungs' bands are denominated in. */
export function kidDomesticPoints(world: WorldState): number {
  return kidPoints(world, 'domestic')
}

/** Pure eligibility check for a tier (Phase-4 "Season Life" slice 1, increment 2). A tier is a WINDOW
 *  `[minPoints, maxPoints]` on the kid's EARNED ranking points: eligible ⇔ the points sit inside the
 *  band. Points (not dense-rank POSITION) so a fresh/point-less kid starts at the BOTTOM (local only)
 *  and climbs local → regional → national as she earns results. No world/RNG dependency, so the bench
 *  and tests call it directly. */
export function isTierEligible(tier: TierId, points: number): boolean {
  const [minPoints, maxPoints] = TIERS[tier].enterPointBand
  return minPoints <= points && points <= maxPoints
}

/** The acceptance list as an absolute position, for the one field we actually have this week. A
 *  share rather than a count, so it survives the field growing (see TierDef.enterPct). */
export function acceptanceRank(world: WorldState, tier: TierId): number | undefined {
  const pct = TIERS[tier].enterPct
  if (pct === undefined) return undefined
  return Math.max(1, Math.round(pct * (world.cohort.length + 1)))
}

/** THE ONE GATE, now that there are two tables (docs/specs/two-ladders.md).
 *
 *  A DOMESTIC rung reads her domestic best-6 against its band, exactly as the single ladder always
 *  did - those bands are denominated in domestic points and did not move, because the domestic
 *  point tables did not move either.
 *
 *  An ITF rung reads her ITF RANK POSITION against `enterRank`. That is the acceptance list, it is
 *  how the real tour works, and it is the same signal `entrantPctBand` already uses to pick the AI
 *  field - which is what closes the "two different entry rules for the same event" finding in
 *  rank-plateau.md 2b. A rung with no `enterRank` is open to anyone, which is what a J30 is. */
export function tierOpenFor(world: WorldState, tier: TierId): boolean {
  const def = TIERS[tier]
  if (def.track === 'itf') {
    // The on-ramp rung reads domestic points; the rungs above it read her ITF rank. See entryStatus.
    const accepts = acceptanceRank(world, tier)
    if (accepts === undefined) return isTierEligible(tier, kidPoints(world, 'domestic'))
    return kidPoints(world, 'itf') > 0 && world.kidRank <= accepts
  }
  return isTierEligible(tier, kidPoints(world, 'domestic'))
}

/** The GRADUATED-OUT half of the band, on its own: her points have passed the tier's ceiling.
 *  Round-10: pulled out as a named rule because two places need exactly this direction (the entry
 *  gate's 'outgrown' verdict and the deadline release), and each used to spell the comparison out
 *  by hand – which is how "outgrown" came to mean slightly different things on different surfaces. */
export function outgrewTier(tier: TierId, points: number): boolean {
  return points > TIERS[tier].enterPointBand[1]
}

/** Enter the kid in a scheduled event: validates deadline / funds / duplicates / ranking
 *  eligibility, then charges the fee immediately (expense event) and records the entry (entry
 *  event). Eligibility is direction-aware: too low to qualify vs graduated out of the tier. */
export function enterEvent(world: WorldState, eventId: string): void {
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (world.entries.includes(eventId)) throw new Error('Already entered this event')
  if (world.week > event.deadlineWeek) throw new Error('Entry deadline has passed')
  // Ladder-up: the calendar now stacks several tiers on the same week, so "one event per week" is
  // no longer guaranteed by the schedule and has to be a rule. She has one body and one week –
  // the abundance is a CHOICE between events, not a licence to play two.
  if (world.season.some((e) => e.week === event.week && world.entries.includes(e.id))) {
    throw new Error('She is already entered in a tournament that week')
  }
  const fee = TIERS[event.tier].entryFeeCents
  if (world.fundsCents < fee) throw new Error('Not enough funds for the entry fee')
  // THE ONE GATE (round-10 R10-5): point band + availability, in one call, shared with the snapshot
  // and the advance stop – so no surface can decide differently about the same event. Only a HARD
  // block stops entry; fatigue is a soft, warned CHOICE (level 'caution'), so racing tired is
  // allowed – its cost is emergent, not a veto.
  const gate = entryStatus(world, event)
  if (gate.level === 'blocked') throw new Error(gate.detail ?? 'Unavailable this week')
  // Season planner: the real thing wins over the friendly. A practice match booked on this week
  // gives way (rental refunded in full) instead of stacking a friendly onto a tournament week –
  // she can only play one week's worth of tennis. A booked VACATION can't collide: it is a hard
  // availability block, so the guard above already refused.
  const collidingPractice = practiceForWeek(world, event.week)
  if (collidingPractice) refundPractice(world, collidingPractice, 'Cancelled')
  world.fundsCents -= fee
  world.entries.push(eventId)
  // ITF annual cap: an international entry spends one of the year's slots. Recorded by the EVENT's
  // week, which is both the slot's identity (one tournament a week) and the season it belongs to.
  if (isCappedTier(event.tier)) {
    world.internationalEntryWeeks.push(event.week)
    // D10: her FIRST international entry (j30+) is a moment the family keeps – captured here, at
    // the moment the form goes in, which is what "first entry" means. Idempotent, so every later
    // entry (and a withdrawal of this one) leaves the memory untouched.
    captureMilestone(world, { type: 'international', week: world.week, tier: event.tier })
  }
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'entry',
    text: `Entry fee: ${TIERS[event.tier].label} (${weekLabel(event.week)})`,
    amountCents: -fee,
  })
  addEvent(world, {
    week: world.week,
    type: 'entry',
    text: `Entered ${TIERS[event.tier].label} – ${weekLabel(event.week)} (${event.surface})`,
  })
}

/** Withdraw before the deadline: refunds the fee (income event) + records it (entry event). */
export function withdrawEvent(world: WorldState, eventId: string): void {
  if (!world.entries.includes(eventId)) throw new Error('Not entered in this event')
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (world.week > event.deadlineWeek) throw new Error('Cannot withdraw after the deadline')
  const fee = TIERS[event.tier].entryFeeCents
  world.fundsCents += fee
  world.entries = world.entries.filter((id) => id !== eventId)
  // THE SLOT FOLLOWS THE FEE. This is the only path that hands the money back, and it is the only
  // one that hands the year's slot back – the ITF counts PARTICIPATION, and a name taken off an
  // open list never participated. Every forfeiting exit keeps both (cancelEntry past the deadline,
  // skipEvent on the week, the medical withdrawal in tickWeek): the list closed with her on it, so
  // she was an entrant. Nothing else needs to know the rule, because the two automatic pull-outs
  // that DO refund – the injury auto-withdraw and releaseOutgrownEntries – both come through here.
  if (isCappedTier(event.tier)) {
    const at = world.internationalEntryWeeks.indexOf(event.week)
    if (at >= 0) world.internationalEntryWeeks.splice(at, 1)
  }
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'income',
    text: `Entry refunded: ${TIERS[event.tier].label}`,
    amountCents: fee,
  })
  addEvent(world, {
    week: world.week,
    type: 'entry',
    text: `Withdrew from ${TIERS[event.tier].label} – ${weekLabel(event.week)}`,
  })
}

/** R10-13: CANCEL an entry, at any point before its week starts. THE ESCAPE HATCH.
 *
 *  The owner's dead end (R10-3): she was entered in a Local, the list closed, and only THEN did she
 *  outgrow the tier and run out of gas. `withdrawEvent` refuses past the deadline, the planner
 *  refuses a week that holds an entry, and the calendar had hidden the card – so the week could be
 *  neither played, planned, nor abandoned. Nothing was possible. This is the way out.
 *
 *  THE FEE RULE, kept coherent with `skipEvent` (R9-9) and with the medical withdrawal in tickWeek:
 *  once the list has closed, the organisers keep the fee whatever the reason she does not appear.
 *  So all three pull-outs forfeit it, and the only difference between them is what else was already
 *  charged at the moment of the pull-out:
 *    - BEFORE the deadline  -> this is a withdrawal, not a forfeit: delegates to `withdrawEvent`
 *                             (full refund). One command for the UI, the refund rule untouched.
 *    - after the deadline, before the week -> fee forfeited. Travel has not been charged yet
 *                             (tickWeek charges it on the play week), so there is nothing to hand
 *                             back, and the week becomes plannable again (practice or vacation).
 *    - ON the event week    -> not this command's business: tickWeek has already charged travel and
 *                             stashed the run, so `skipEvent` owns it (fee forfeited, travel back).
 *  Refunding here instead would make "enter it and see" the dominant strategy, which is the same
 *  reason the medical withdrawal forfeits – the fee has to bite.
 *
 *  Pure state, ZERO RNG draws. */
export function cancelEntry(world: WorldState, eventId: string): void {
  if (!world.entries.includes(eventId)) throw new Error('Not entered in this event')
  const event = eventById(world, eventId)
  if (!event) throw new Error('Unknown event')
  if (event.week <= world.week) {
    throw new Error('That week has already started – skip the tournament instead')
  }
  // Still refundable: the list is open, so this is an ordinary withdrawal and the fee comes back.
  if (world.week <= event.deadlineWeek) {
    withdrawEvent(world, eventId)
    return
  }
  world.entries = world.entries.filter((id) => id !== eventId)
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `Cancelled ${TIERS[event.tier].label} – ${weekLabel(event.week)}, entry fee forfeited.`,
  })
}

/** R9-9: skip an entered tournament AT its event week – entering the begin flow is no longer a
 *  one-way door. A POST-deadline withdrawal, real-world style: the entry fee stays committed
 *  (the list closed with her on it), the travel charge tickWeek took is refunded in full (she
 *  never boards), NO run is committed (no points, no W-L, no strain – the shadow result is
 *  discarded), and the week then closes exactly like a normal non-playing week (the same
 *  deferred steps finalizeTournament would have run). Only callable before the first reveal;
 *  once a match has been shown the run is under way. Zero draws – the discarded shadow already
 *  ran on its event-scoped stream, so the MAIN weekly sequence is untouched either way. */
export function skipEvent(world: WorldState, eventId: string): void {
  const p = world.pendingTournament
  if (!p || p.eventId !== eventId) throw new Error('No tournament to skip this week')
  if (p.finished || p.revealedRounds > 0) throw new Error('The tournament is already under way')
  const event = eventById(world, eventId)
  if (!event) {
    // calendar lost the event (defensive – finalize handles this the same way): just clear.
    world.pendingTournament = null
    return
  }
  // v21: refund WHAT SHE PAID, not what the calendar prints. `travelCostFor` is the same function
  // chargeTravel used minutes ago, so a scholarship can never be turned into free money by entering
  // and withdrawing; the covered part is handed back to the academy's season tally at the same time.
  const paid = travelCostFor(world, event)
  const covered = event.travelCostCents - paid
  world.fundsCents += paid
  if (world.academy && covered > 0) world.academy.coveredCents = Math.max(0, world.academy.coveredCents - covered)
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'travel',
    text: `Travel refunded: ${TIERS[event.tier].label}`,
    amountCents: paid,
  })
  world.entries = world.entries.filter((id) => id !== eventId)
  world.pendingTournament = null
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `Skipped ${TIERS[event.tier].label} – entry fee forfeited.`,
  })
  // The week ends match-free after all, so she earns the slider recovery bonus that tickWeek
  // withheld when it still believed she would play (accrueCondition ran with played = true).
  // Integer, clamped – "the week then resolves as a normal non-playing week".
  world.condition = clamp(
    world.condition + restRecoveryBonus(world.plan.rest),
    ECONOMY.condition.min,
    ECONOMY.condition.max,
  )
  // Close the week: the rank recompute + housekeeping that tickWeek deferred to the flow.
  recomputeRankAndMilestones(world)
  housekeep(world)
}

/** Tick up to `weeks`, stopping early when a tournament week spawns a reveal (the week is not
 *  closed until it resolves), an imminent affordable regional+ deadline appears, or funds cross
 *  below zero. A reveal already in progress blocks any advance until it is closed.
 *
 *  Returns EVERY reason the advance stopped, in STOP_PRECEDENCE order (empty = it ran its full
 *  course). R11-1 – THE BUG this shape fixes (owner 26.07, "the injury popup does not always
 *  appear – once it did, once it did not"): the old signature carried ONE reason and `break`ed on
 *  the first match in source order, so a fresh injury that landed on the season wrap-up week was
 *  reported as 'season-end' alone. The injury dialog never mounted, the toast had no copy for
 *  'injury' either (R10-16 moved it onto the dialog), and her auto-withdrawals happened with
 *  NOTHING shown. One week can be several things at once; the caller gets all of them and decides
 *  the order to show them in. ZERO extra RNG draws and the identical number of ticks – the loop
 *  still breaks on the first week that stops it, it just no longer forgets the rest of the news. */
export function advanceWeeks(world: WorldState, rng: Rng, weeks: number): StopReason[] {
  // A pending reveal must resolve (and close) before time moves on.
  if (world.pendingTournament) return ['tournament']
  const stops = new Set<StopReason>()
  for (let i = 0; i < weeks; i++) {
    const nextWeek = world.week + 1
    // Pre-tick guards bite only after the first tick, so a single step always progresses.
    if (i > 0) {
      // Round-9 leftover FIX (owner-visible bug, season-planner slice): the stop must only fire
      // for an event she could ACTUALLY enter. The availability gate alone let the sim halt at
      // W1/W3 with 0 points for regional/national deadlines she was nowhere near qualifying for,
      // so the point-band eligibility is now AND-ed in – the same isTierEligible enterEvent uses,
      // which also silences a tier she has OUTGROWN (points past the ceiling).
      const deadlineSoon = world.season.some(
        (e) =>
          // Ladder-up: "regional or national" was "anything above the entry tier" – it now reads
          // that way literally, so the J levels (the most expensive commitments in the game) stop
          // the sim too. NOTE for the tuning pass: with j30 every 2 weeks this roughly doubles how
          // often an advance halts once she is J-eligible; if that proves noisy the fix belongs in
          // a player-side "don't stop for tier X" preference, not in silently skipping the stop.
          e.tier !== 'local' &&
          !world.entries.includes(e.id) &&
          world.fundsCents >= TIERS[e.tier].entryFeeCents &&
          (e.deadlineWeek === world.week || e.deadlineWeek === nextWeek) &&
          // Round-10 R10-5: the point band AND the availability gate, read through the ONE helper
          // every other surface reads (`entryStatus` = band + availability). This used to be
          // `isTierEligible(...) && availabilityStatus(...) !== 'blocked'` spelled out here – the
          // same verdict, but a third independent copy of the rule. Don't stop-for-deadline on an
          // event she HARD-cannot enter (locked/outgrown on points, school exams, a booked family
          // vacation, injured); a FATIGUED event is still enterable (soft caution), so the sim MAY
          // stop so the player can make the tough call.
          entryStatus(world, e).level !== 'blocked',
      )
      if (deadlineSoon) {
        stops.add('deadline')
        break
      }
    }
    tickWeek(world, rng)
    // EVERY reason this week stops the advance is collected – no `break` between them, because a
    // week that is two things at once (the classic: she gets hurt in the season's last playing
    // week) must report both. The loop still breaks ONCE, after the week has been read out.
    //
    // A tournament this week paused the resolution: stop so the flow can take over.
    if (world.pendingTournament) stops.add('tournament')
    // Season just wrapped up (the tick landed on the year's first off-season week, week 49 of
    // the year): stop AFTER the wrap-up resolved, before week 50, so the season-summary popup
    // shows. Off-season weeks never carry a tournament, so this can't collide with 'tournament'.
    if (world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS) stops.add('season-end')
    // A FRESH injury (onset this very tick) halts the advance so the medical event surfaces;
    // an ongoing recovery never re-stops the sim on every week she sits out.
    if (world.injury !== null && world.injury.sinceWeek === world.week) stops.add('injury')
    // A medical withdrawal costs her an entry AND its fee, so it halts the advance for the same
    // reason a fresh injury does: the player must see it happen, not read about it later.
    if (world.medicalWithdrawalWeek === world.week) stops.add('medical')
    // R12-15: ...and so does a WALKOVER, for exactly the same reason. This was the owner's dead
    // click: the entry fee was forfeited, the trip never happened, and the only trace was one line
    // in a news feed the player had no reason to open – because the click that caused it had just
    // promised a tournament. Note this fires INDEPENDENTLY of 'injury': the walkover usually lands
    // a week or more AFTER the onset, when the injury is no longer fresh and nothing else stops.
    if (world.walkoverWeek === world.week) stops.add('walkover')
    if (world.fundsCents < 0) stops.add('funds')
    if (stops.size > 0) break
  }
  // Precedence order, not insertion order: the caller renders them in this sequence, and the
  // medical pair leads it so nothing can bury them (see STOP_PRECEDENCE).
  return STOP_PRECEDENCE.filter((r) => stops.has(r))
}

// --- snapshot ----------------------------------------------------------------
function upcomingEvents(world: WorldState): UpcomingEvent[] {
  const entered = new Set(world.entries)
  // The Season card's preview needs the standings and her match build ONCE for the whole list, not
  // once per card: both are the same for every event in the window, and rebuilding them per event
  // would be the expensive half of this function. Surface-specific scaling still happens per event
  // inside the preview, which is where it belongs.
  const ranking = fullRanking(world)
  return world.season
    .filter((e) => e.week > world.week && e.week <= world.week + UPCOMING_WEEKS)
    .sort((a, b) => a.week - b.week)
    .map((e) => {
      // Round-10 R10-5: ONE call, the same `entryStatus` enterEvent and advanceWeeks read, instead
      // of this function's own copy of the point band + a separate availability call. `eligible`
      // and `ineligibleReason` therefore describe exactly what enterEvent would do, by construction
      // rather than by two implementations happening to agree.
      //
      // NOTE the scope: this is the ENTRY verdict. It is NOT a verdict on `entered` – a list that
      // closed with her on it keeps her on it whatever her points did afterwards, so an entered
      // card must never be treated as a lock (see `cancellable`, and R10-3).
      const gate = entryStatus(world, e)
      const isEntered = entered.has(e.id)
      const reason =
        gate.level === 'blocked'
          ? {
              ineligibleReason: gate.reason as
                | 'locked'
                | 'outgrown'
                | 'injured'
                | 'unavailable'
                | 'medical'
                | 'capped',
              ...(gate.pointsToEnter !== undefined ? { pointsToEnter: gate.pointsToEnter } : {}),
              ...(gate.rankToEnter !== undefined ? { rankToEnter: gate.rankToEnter } : {}),
              // Per-EVENT figures, exactly like pointsToEnter: a card near the year boundary can
              // be judged against a different season's allowance than today's, so the number it
              // prints has to be the one the gate actually used.
              ...(gate.entryCap !== undefined ? { entryCap: gate.entryCap } : {}),
            }
          : gate.level === 'caution'
            ? { cautionReason: gate.reason as 'fatigued', cautionDetail: gate.detail }
            : {}
      return {
        id: e.id,
        week: e.week,
        tier: e.tier,
        surface: e.surface,
        // What the Season card can honestly say before she plays: her odds in round one against
        // the field as it stands TODAY, how strong that field is, and the (decorative) weather.
        // See season/preview.ts for what this estimate does and does not claim.
        preview: previewEvent(world, e, ranking, kidMatchPlayerFor(world, e.surface)),
        // v21: the price the FAMILY pays, scholarship included – the planner has to quote what
        // entering will actually cost, and it is the same number chargeTravel will take.
        travelCostCents: travelCostFor(world, e),
        deadlineWeek: e.deadlineWeek,
        entryFeeCents: TIERS[e.tier].entryFeeCents,
        label: TIERS[e.tier].label,
        entered: isEntered,
        // A fatigued event is a CAUTION, not a block: she stays eligible. Only a HARD block
        // (point band, injured, unavailable, medical) removes eligibility.
        eligible: gate.level !== 'blocked',
        // R10-13: the entry is COMMITTED (the list has closed) but the week has not started yet –
        // the only window in which cancelling costs the fee and frees the week. Every row here is
        // a FUTURE week by construction, so the closed list is the whole condition.
        cancellable: isEntered && world.week > e.deadlineWeek,
        ...reason,
      }
    })
}

/** R12-15/R12-3: the arrival verdict for the entered event on `world.week + 1` – the week the
 *  sticky bar's one button plays (tickWeek increments the week FIRST, so it is always `week + 1`,
 *  never today). Null when no entry sits there.
 *
 *  The DOCTOR's arm is downgraded to 'play' on purpose (see ArrivalPreview): his verdict is re-read
 *  on arrival against a condition that can only have RISEN by then (a tournament week accrues
 *  `matchWeekRecoveryBase` = 0, plus the physio and blackout bonuses, and nothing subtracts before
 *  step 2), so a 'medical' preview can be false by a point or two. Announcing a withdrawal that
 *  then does not happen would replace the old lie with a new one; the medical stop + toast already
 *  make the real thing loud. The layoff and the point band are pure state and cannot move, so those
 *  two ARE previewed. */
function arrivalPreview(world: WorldState): ArrivalPreview | null {
  const next = world.week + 1
  const event = world.season.find((e) => e.week === next && world.entries.includes(e.id))
  if (!event) return null
  const status = arrivalStatus(world, event)
  const injured = status.verdict === 'injured'
  return {
    eventId: event.id,
    tier: event.tier,
    week: event.week,
    verdict: injured ? 'injured' : 'play',
    ...(injured && status.detail !== undefined ? { detail: status.detail } : {}),
    outgrown: status.outgrown,
  }
}

// The kid's counted best-6 results (round-5 item 1b): same window + sort as computeRanking,
// so their points sum equals the kid's standings points. Strongest first. `isCountingResult` is
// the same filter computeRanking applies, named rather than respelled – "counting" has to mean one
// thing in both places or this list and the standings total drift apart the moment a scoreless row
// reaches the kid's half of the ledger.
function computeCountingResults(world: WorldState, track: LadderTrack = 'itf'): CountingResult[] {
  // TWO LADDERS: this list EXPLAINS a ranking, so it has to be the same table as the rank beside it.
  // Hence the track argument - `ladders[track].countingResults` pairs each list with its own rank,
  // and an empty ITF list is the honest reading of "unranked internationally".
  return world.results.filter(inTrack(track))
    .filter(
      (r) =>
        isCountingResult(r) &&
        r.playerId === KID_ID &&
        r.week <= world.week &&
        world.week - r.week <= RESULTS_WINDOW,
    )
    .sort((a, b) => b.points - a.points || b.week - a.week)
    .slice(0, 6)
    .map((r) => ({ week: r.week, tier: r.tier, points: r.points }))
}

/** BOTH TABLES, THE SAME SHAPE - the half of docs/specs/two-ladders.md the UI never got.
 *
 *  The spec designed two currencies with no exchange rate and then every screen kept showing ONE
 *  number called "rank" and ONE called "points", both read off the ITF table. So a career spent on
 *  the domestic rungs - which is most of a fourteen-year-old's career, and ALL of a working-class
 *  one's - showed a Stats table reading 4 points while she had 604, a Kid screen reading "No points
 *  yet", and a Home ladder asking her to "Reach 250 pts" it had already let her past. Three of the
 *  owner's 30.07 items are that.
 *
 *  A LadderView is therefore the unit the screens consume: one table's rank, points, standings and
 *  the results that earned them, in that table's own currency. Two of them, identically shaped, so a
 *  screen renders "a ladder" once instead of special-casing which one it has.
 *
 *  Pure derivation over the ledger the world already keeps - no persisted field, no schema bump, no
 *  migration, zero RNG draws. */
function computeLadderView(world: WorldState, track: LadderTrack): LadderView {
  const counting = computeCountingResults(world, track)
  return {
    // Her place a week ago IN THIS TABLE - see `prevKidRankDomestic` on WorldState for why both are
    // carried rather than one shared "previous rank".
    prevRank: track === 'itf' ? world.prevKidRank : (world.prevKidRankDomestic ?? null),
    // UNRANKED IS NOT A NUMBER. With nobody holding a point the whole field ties at zero and
    // competition ranking hands every member of that tie the same place, so a point-less kid reads
    // as a single digit. The screens have always papered over that by asking `countingResults.length
    // > 0` themselves; making it null HERE means they cannot forget, and the two questions ("where
    // is she?" and "is she ranked at all?") stop being one field.
    rank: counting.length > 0 ? rankIn(world, track) : null,
    points: kidPoints(world, track),
    standings: computeStandings(world, track),
    countingResults: counting,
  }
}

/** Her cached place in `track`. The caches are the authority (one writer - see recomputeKidRank), so
 *  this reads them rather than re-folding, which is what keeps a snapshot from disagreeing with the
 *  gate that used the same number to decide her entries. */
function rankIn(world: WorldState, track: LadderTrack): number {
  return track === 'itf' ? world.kidRank : (world.kidRankDomestic ?? world.cohort.length + 1)
}

/** WHICH TABLE IS SHE ACTUALLY COMPETING IN - one rule, one place, so Home, Stats and the Kid screen
 *  cannot answer it three ways.
 *
 *  docs/specs/two-ladders.md, "Which rank is her rank": the ITF one once she has it, because that is
 *  the table the international rungs open on and the one the game is about. Before her first counting
 *  ITF result she is unranked internationally and the screens show her national standing instead.
 *  "That is the real shape of a junior career, and the moment the first ITF point lands is a beat
 *  worth having." */
export function activeLadderOf(world: WorldState): LadderTrack {
  return kidPoints(world, 'itf') > 0 ? 'itf' : 'domestic'
}

function computeStandings(world: WorldState, track: LadderTrack = 'itf'): StandingRow[] {
  const full = rankingFor(world, track)
  const meta = new Map<string, { name: string; nation: string }>()
  for (const p of world.cohort) meta.set(p.id, { name: p.name, nation: p.nation })
  // Full name so the UI can render "V. Last" for the kid like everyone else (formatShortName).
  meta.set(KID_ID, {
    name: `${world.profile.kidName} ${world.profile.kidLastName}`.trim(),
    nation: world.profile.country,
  })
  const enrich = (r: RankingRow, gapBefore: boolean): StandingRow => {
    const m = meta.get(r.playerId) ?? { name: r.playerId, nation: '' }
    return { ...r, name: m.name, nation: m.nation, isKid: r.playerId === KID_ID, gapBefore }
  }
  // Top 10 + a window around the kid, as *positions in `full`* rather than as slices
  // deduped by id – tracking the underlying index (not the rank number) is what lets
  // `gapBefore` below tell a genuine omission from a competition-ranking tie-skip,
  // which also jumps the rank number by more than 1 without anyone being left out.
  const kidIdx = full.findIndex((r) => r.playerId === KID_ID)
  const topEnd = Math.min(10, full.length)
  const aroundStart = kidIdx >= 0 ? Math.max(0, kidIdx - 2) : -1
  const aroundEnd = kidIdx >= 0 ? Math.min(full.length, kidIdx + 3) : -1
  const includedIdx: number[] = []
  for (let i = 0; i < topEnd; i++) includedIdx.push(i)
  for (let i = Math.max(aroundStart, topEnd); i < aroundEnd; i++) includedIdx.push(i)
  return includedIdx.map((idx, pos) => enrich(full[idx], pos > 0 && idx !== includedIdx[pos - 1] + 1))
}

// Any id -> short display name, for anyone who could appear in a bracket (kid or AI),
// not just the kid's own opponents (unlike `players`, which only snapshots those).
function playerShortName(world: WorldState, id: string): string {
  if (id === KID_ID) return formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  const ai = world.cohort.find((c) => c.id === id)
  return formatShortName(ai?.name ?? id)
}

// The live view of an in-progress reveal (drives TournamentFlow). Lean: the revealed path, the
// current round's opponent + record, and the finale copy. Scorelines belong to the record and are
// never shown by the UI before a match has been watched/skipped.
function pendingView(world: WorldState): PendingView | undefined {
  const p = world.pendingTournament
  if (!p) return undefined
  const event = eventById(world, p.eventId)
  if (!event) return undefined
  const tier = TIERS[event.tier]
  const kidMatches = kidMatchesOf(p.result)
  const revealed = p.revealedRounds

  const bracket: PendingBracketRound[] = kidMatches.slice(0, revealed).map((m) => {
    const oppId = m.aId === KID_ID ? m.bId : m.aId
    return {
      roundLabel: stageLabel(m.round, tier.drawSize),
      oppName: formatShortName((p.players[oppId] ?? fallbackPlayer(oppId)).name),
      kidWon: m.winnerId === KID_ID,
      score: m.score && m.bId === KID_ID ? flipScore(m.score) : m.score,
    }
  })

  // Round 5 item 5: the FULL draw (every match, every player). During her run this is bounded
  // to the kid's played rounds (0..revealed-1; single elim, she plays every round until
  // eliminated) so later rounds stay spoiler-free. Round-7 (spectate): once her run is FINISHED
  // there are no spoilers left to protect, so the whole draw is exposed – every round through
  // the Final – letting the flow spectate the tournament to its conclusion past her exit.
  // `score` is always normalised to the WINNER's perspective (conventional "W d. L 6-4 ..."
  // reading) regardless of which bracket side (a/b) actually won – MatchRecord stores it
  // from side A's perspective, so it only needs flipping when B won.
  const lastRound = p.finished ? Math.max(...p.result.matches.map((m) => m.round)) : revealed - 1
  const fullBracket: FullBracketMatch[] =
    lastRound < 0
      ? []
      : p.result.matches
          .filter((m) => m.round <= lastRound)
          .map((m) => ({
            round: m.round,
            roundLabel: stageLabel(m.round, tier.drawSize),
            aId: m.aId,
            bId: m.bId,
            aName: playerShortName(world, m.aId),
            bName: playerShortName(world, m.bId),
            winnerId: m.winnerId,
            score: m.score && m.winnerId === m.bId ? flipScore(m.score) : m.score,
          }))

  // The round being presented: the next unrevealed match, or (finished) the last one played.
  const currentIdx = revealed < kidMatches.length ? revealed : kidMatches.length - 1
  const current = kidMatches[currentIdx]
  const oppId = current.aId === KID_ID ? current.bId : current.aId
  const ranks = new Map(fullRanking(world).map((r) => [r.playerId, r.rank]))
  const oppRank = ranks.get(oppId) ?? world.cohort.length + 1
  const oppNation = world.cohort.find((c) => c.id === oppId)?.nation ?? ''
  const kidFinish = p.result.finishes[KID_ID] ?? Math.log2(tier.drawSize)

  return {
    eventId: p.eventId,
    tier: event.tier,
    surface: event.surface,
    // The weather plate on the live match. Same function the Season card quotes, so one tournament
    // has one day. VIEW ASSEMBLY ONLY - see the grep guard in tests/preview.test.ts.
    temperatureC: eventTemperature(world.seed, event),
    roundLabel: stageLabel(current.round, tier.drawSize),
    opponent: {
      name: formatShortName((p.players[oppId] ?? fallbackPlayer(oppId)).name),
      nation: oppNation,
      rank: oppRank,
    },
    // Only expose a record to watch while there is still an unrevealed round.
    kidMatch: revealed < kidMatches.length ? kidMatchEvent(world, event, current, p.players).match : undefined,
    bracket,
    fullBracket,
    finished: p.finished,
    kidChampion: kidFinish === 0,
    tierLabel: tier.label,
    points: tier.points[kidFinish] ?? 0,
    finishLabel: finishLabel(kidFinish),
    // The E brief's crowd. Its own `seed:crowd:` sub-stream, so reading it here costs the MAIN
    // stream nothing (the frozen 41550 / e6b0c709 capture is untouched by construction) and it is
    // the SAME figure the Season card printed while the event was still upcoming.
    crowd: eventCrowd(world.seed, event),
  }
}

export function toSnapshot(world: WorldState, stopReasons?: StopReason[]): Snapshot {
  const pending = pendingView(world)
  // Computed ONCE and shared by the snapshot field and the diary facts – two computations could
  // never disagree, but one is also cheaper and reads as the single decision it is.
  const lossStreak = computeLossStreak(world)
  // Diary-1: the facts + the selected lines, assembled from a narrow view of the world. Selection
  // draws only from `seed:diary:*` / `seed:memory:*` sub-streams at SNAPSHOT time – zero MAIN
  // draws, so the frozen capture (41550 / e6b0c709) is untouched by construction.
  const diary = buildDiarySnapshot({
    seed: world.seed,
    week: world.week,
    kidId: KID_ID,
    startAgeYears: START_AGE_YEARS,
    condition: world.condition,
    fundsCents: world.fundsCents,
    injury: world.injury
      ? {
          kind: world.injury.kind,
          weeksRemaining: world.injury.weeksRemaining,
          totalWeeks: world.injury.totalWeeks,
        }
      : null,
    events: world.events,
    lossStreak,
    kidRank: world.kidRank,
    prevKidRank: world.prevKidRank,
    pendingUnfinished: world.pendingTournament !== null && !world.pendingTournament.finished,
    // R13-2: the points her run AWARDED this week. finalizeTournament writes a kid row only when
    // points > 0, so a first-round exit leaves none – "> 0" is exactly "she won matches this
    // week", the licence behind the earned-climb softener and the good-loss diary lines.
    runPointsThisWeek: world.results
      .filter((r) => r.playerId === KID_ID && r.week === world.week)
      .reduce((s, r) => s + r.points, 0),
    milestones: world.milestones,
    vacationWeek: vacationForWeek(world, world.week) !== undefined,
  })
  // THE SKILLS RADAR'S VIEW OF HER, assembled ONCE and read twice - by the contour (`buildRadar`)
  // and by the Weekly Story's training line (`buildTrainingRead`). Hoisted rather than inlined
  // because the two readings MUST see the same girl: a second literal here would be a second place
  // for "which matches count" to drift, and the card and the radar would then disagree about how
  // much anybody can see, on the same screen, in the same week.
  const radarView: RadarWorldView = {
    seed: world.seed,
    week: world.week,
    kidId: KID_ID,
    skills: world.skills,
    // Where she began, recomputed from the seed rather than stored - see RadarWorldView.startSkills.
    // `growWeek` is the only thing in the engine that moves `world.skills`, so the difference between
    // these two IS her development, and neither of them ever leaves this object.
    startSkills: startingSkills(world.seed, world.profile),
    potential: world.potential,
    coachTier: tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId)),
    coachSinceWeek: coachSinceWeek(world),
    matchesPlayed: matchesEverPlayed(world),
    // Her OWN records out of the retained feed, competitive only - a practice friendly teaches
    // the radar nothing, for the same reason it never shows on her face (R11-2).
    matches: world.events
      .filter((e) => e.match !== undefined && !e.friendly)
      .map((e) => e.match!)
      .filter((m) => m.aId === KID_ID || m.bId === KID_ID),
  }
  // ...and the evidence fold behind BOTH of them, walked once. `axisEvidence` reads the whole
  // retained match window per axis, so asking the two builders independently would walk it eight
  // times a snapshot for one girl in one week.
  const radarReadings = axisReadings(radarView)
  return {
    schemaVersion: world.schemaVersion,
    careerId: world.careerId,
    seed: world.seed,
    week: world.week,
    ageYears: START_AGE_YEARS + Math.floor(world.week / 52),
    fundsCents: world.fundsCents,
    profile: world.profile,
    plan: world.plan,
    condition: world.condition,
    // injury is always null in slice B; drop the persisted-only `sinceWeek` when surfacing it.
    injury: world.injury
      ? {
          kind: world.injury.kind,
          severity: world.injury.severity,
          weeksRemaining: world.injury.weeksRemaining,
          totalWeeks: world.injury.totalWeeks,
        }
      : null,
    physioActive: world.physioActive,
    events: world.events.slice(-SNAPSHOT_EVENTS),
    // Category-accurate windows off the persisted ledger (immune to the 60-event cap). season
    // keeps the current MoneyScreen semantics: the current 52-week season block from its first week.
    finance: {
      window12w: financeWindow(world.financeWeeks, world.week - 11),
      // ONE definition of "this season" (seasonStartWeek), shared with the wrap-up summary – the
      // two used to spell the same arithmetic out separately, which is how they came to disagree.
      season: financeWindow(world.financeWeeks, seasonStartWeek(world.week)),
      // The same 12 weeks, un-folded, for the Home budget card's chart. Clamped at week 0 so a
      // young career charts the weeks it has actually lived instead of eleven empty bars. Today's
      // funds anchor the running balance, so the line's last point is the total printed above it.
      weekly12: financeSeries(
        world.financeWeeks,
        Math.max(0, world.week - 11),
        world.week,
        world.fundsCents,
      ),
    },
    financialEvents: world.events.filter((e) => e.amountCents !== undefined).slice(-SNAPSHOT_FINANCIAL_EVENTS),
    upcoming: upcomingEvents(world),
    // R12-15/R12-3: what next week's entered event will actually DO, so the one button that plays
    // that week stops promising a tournament the engine has already decided against.
    arrival: arrivalPreview(world),
    // Season planner (v13): the bookings the calendar renders, plus the short trailing window the
    // guardrail's consecutive-practice read needs (the calendar only ever looks at future weeks,
    // so the tail is invisible there). Prices are re-derivable by the UI from the same pure quote
    // functions the engine charges (economy.ts), so nothing else is needed on the wire.
    vacations: world.vacations.map((v) => ({ ...v })),
    practices: world.practices.map((p) => ({ ...p })),
    recoveryBuff: world.recoveryBuff ? { ...world.recoveryBuff } : null,
    academy: world.academy
      ? {
          coverShare: travelCoverShare(world.academy),
          sinceWeek: world.academy.sinceWeek,
          coveredCents: world.academy.coveredCents,
        }
      : null,
    // The ITF annual cap as it stands TODAY – what the Home ladder needs to tell a tier's state.
    // Derived at snapshot time from the persisted ledger, so it can never disagree with the gate.
    entryCap: entryCapUsage(world, world.week),
    // THE ENGINE'S OWN VERDICT PER RUNG (see TierOpenMap in protocol.ts). `tierOpenFor` is the same
    // function `enterEvent` validates against, so a screen can no longer disagree with the gate.
    tierOpen: Object.fromEntries(TIER_LADDER.map((t) => [t, tierOpenFor(world, t)])) as TierOpenMap,
    coachId: world.coachId,
    coachMarket: coachMarket(world),
    coachBilling: coachBilling(world),
    kidRank: world.kidRank,
    prevKidRank: world.prevKidRank,
    standings: computeStandings(world),
    countingResults: computeCountingResults(world),
    // BOTH TABLES, and which one she is actually competing in. `kidRank`/`standings`/`countingResults`
    // above are the ITF ones and stay as aliases of `ladders.itf` so nothing that reads them has to
    // change; the pairing is pinned by a test, because two names for one fact is how this bug started.
    ladders: {
      domestic: computeLadderView(world, 'domestic'),
      itf: computeLadderView(world, 'itf'),
    },
    activeLadder: activeLadderOf(world),
    bestFinishByTier: { ...world.bestFinishByTier },
    // Round-8 (R6 debt): the running season W-L counters, already persisted since v10 –
    // surfacing them is derivation, not schema.
    seasonWins: world.seasonWins,
    seasonLosses: world.seasonLosses,
    // The run of defeats behind her face, decided HERE and not in the UI: the engine holds the seed
    // (so the per-streak threshold is drawn once, off `seed:angry:<startWeek>`) and the FULL event
    // log (the snapshot only carries the trailing 60, which a long streak could outrun). Pure
    // derivation off state that already exists – no persisted field, no schema bump.
    lossStreak,
    diary,
    // HER LIFE OFF THE COURT (engine/kidLife.ts): the Personality / School / Friends tiles screen C
    // draws. Same discipline as the diary - derived at SNAPSHOT time off `seed:friends:*`
    // sub-streams, zero MAIN draws, so the frozen capture (41550 / e6b0c709) cannot move.
    life: buildKidLife({
      seed: world.seed,
      week: world.week,
      ageYears: START_AGE_YEARS + Math.floor(world.week / 52),
      // The app's ONE definition of a season's display year (shared/dates.ts), so the school-year
      // arithmetic can never disagree with the year the rest of the game prints.
      seasonYear: seasonYear(seasonIndexOf(world.week)),
      playStyle: world.profile.playStyle,
      birthMonth: world.profile.birthMonth,
      injured: world.injury !== null,
      // HOW MUCH SHE HAS BEEN AWAY, off the persisted finance ledger rather than the capped event
      // feed: a week in which a travel bill was actually paid is a week the family was somewhere
      // else. A local event costs no travel and is therefore correctly NOT a week away.
      weeksAway: world.financeWeeks.filter(
        (w) => w.week > world.week - FRIENDS_WINDOW && w.week <= world.week && (w.byCategory.travel ?? 0) < 0,
      ).length,
      lossStreak: lossStreak?.losses ?? 0,
      // Her most recent title off the same walk the diary uses, so two surfaces cannot disagree
      // about when she last won something.
      weeksSinceTitle: (() => {
        const title = lastKidTitleOf(world.events)
        return title ? world.week - title.week : null
      })(),
    }),
    // THE SKILLS RADAR. Derived here and nowhere else, off `seed:read:*` / `seed:ceil:*` sub-streams
    // at SNAPSHOT time - zero MAIN draws, so the frozen capture (41550 / e6b0c709) is untouched by
    // construction. The true `skills` / `potential` go IN and never come out: the snapshot carries
    // an estimate and a haze, which is the whole point of the slice.
    radar: buildRadar(radarView, radarReadings),
    // ...AND THE SAME FOG, ONE STEP FURTHER ON: what came along this week, in words, for the Weekly
    // Story's Training card. Design D lists skill gains there; we may not, because a weekly delta
    // integrates into her exact build and the fog above would be decoration. Same sub-stream
    // discipline (`seed:train*`), same zero MAIN draws, and NOT ONE NUMBER on the way out.
    trainingRead: buildTrainingRead(radarView, radarReadings),
    lastSeasonSummary: world.lastSeasonSummary,
    // R10-9: the career's finished seasons, copied out (oldest first) for the Stats history table.
    seasonHistory: world.seasonHistory.map((h) => ({ ...h })),
    ...(stopReasons && stopReasons.length > 0 ? { stopReasons } : {}),
    ...(pending ? { pending } : {}),
  }
}
