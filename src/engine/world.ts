import { type Rng, type MainRngState, rngFromSeed, pickInt, initMainState, resumeMain } from './rng'
import {
  DEFAULT_PROFILE,
  STOP_PRECEDENCE,
  WEEK_PLAN_PRESETS,
  type ArrivalPreview,
  type CountingResult,
  type LadderView,
  type TierOpenMap,
  type FamilyBackground,
  type FinanceWeek,
  type FullBracketMatch,
  type Knock,
  type KnockChoice,
  type KnockRecord,
  type LossStreak,
  type Milestone,
  type KitLine,
  type KitOfferTerms,
  type Offer,
  type PendingBracketRound,
  type PendingView,
  type PlayerProfile,
  type PracticeBooking,
  type RecoveryBuff,
  type SeasonHistoryEntry,
  type SeasonSummary,
  type Snapshot,
  type SnapshotInjury,
  type StandingRow,
  type StopReason,
  type TierTrophies,
  type UpcomingEvent,
  type SeasonSupply,
  type VacationBooking,
  type WeekPlan,
  type WorldEvent,
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
import { clamp, matchDrain, tournamentRunStrain } from './condition'
import { parentIncomeForWeekCents,
  ECONOMY,
  GEAR_CATEGORIES,
  type GearCategory,
  gearHitForWeek,
  practiceFeeCents,
  vacationPackage,
  vacationPriceCents,
} from './economy'
import { generateCohort, driftCohort, ageCohort, COHORT_SIZE } from './season/cohort'
import { renewCohort } from './season/conveyor'
import { growWeek, rollPotential, type KidSkills } from './development'
import {
  coachById,
  coachCorridorFactor,
  coachIncludesPhysio,
  coachWeeklyCents,
  selfRateCents,
  tierOf,
} from './coach'
import {
  kitGrantCents,
  travelCoverShare,
  reviewLevel,
  type AcademySupport,
} from './academy'
import { rivalConditions, rivalGroundstrokes, rivalMatchPlayer } from './season/rival'
import { generatePreHistory } from './season/prehistory'
import { BEST_N_BY_TRACK, computeRanking, isCountingResult, windowedBestSum, type SeasonResult } from './season/ranking'
import {
  selectEntrants,
  resolveDoubleBookings,
  runTournament,
  kidSeedIndexIn,
  weekFieldExclusion,
  JUNIOR_TOUR,
} from './season/tournament'
import { previewEvent, eventCrowd, eventTemperature } from './season/preview'
// THE FIELD TIER (living-field phase W, 01.08). Field pros are DERIVED, NEVER PERSISTED – see
// season/fieldPros.ts for the whole argument. world.ts only ever asks three questions of them:
// the merged W ranking, the W-event candidate universe, and a name for an fp- id on a surface.
import {
  isFieldProId,
  mergedWtaRanking,
  universeForTier,
} from './season/fieldPros'
import { simulateMatch } from './match/engine'
// Diary-1: the copy system (facts → licensed phrase, sub-stream selection) and the milestone
// identity rule. diary.ts is deliberately world-free (it takes a narrow structural view), so the
// dependency runs one way: world → diary, exactly like world → condition.
import { buildDiarySnapshot, lastKidTitleOf } from './diary'
// Screen C's three derived tiles (Personality / School / Friends). Same shape of dependency as the
// diary and the radar: kidLife.ts is world-free and takes a narrow structural view, one way only.
import { buildKidLife, FRIENDS_WINDOW } from './kidLife'
// The skills radar (docs/specs/skills-radar.md, decisions.md #11). Same shape of dependency as the
// diary: radar.ts is world-free and takes a narrow structural view, so world → radar runs one way.
import { axisConfidence, axisEvidence, axisReadings, buildRadar, buildTrainingRead, shownSkill, type RadarWorldView } from './radar'
// W4 – THE KNOCK: the ordinary training week's one event and the decision it puts in front of the
// parent. Same dependency shape as the diary, kidLife and the radar: knock.ts is world-free and
// takes a narrow structural view, so world -> knock runs one way and can never cycle.
import {
  buildKnockPrompt,
  drawKnock,
  knockGoverns,
  knockLive,
  knockRestWeek,
  knockUntilWeek,
  offCooldown,
  KNOCK_REST_CONDITION,
  KNOCK_REST_GROWTH,
} from './knock'
// W6c: the anatomy, in a leaf module so diary.ts can read the same twelve parts this draws from.
// THE INBOX (v32, docs/specs/offers-and-the-inbox.md). Same dependency shape as the knock and the
// diary: offers.ts is world-free and takes plain arguments, so world -> offers runs one way. Its
// only randomness is its own `seed:offer:<week>` sub-stream, so nothing it does can reach the MAIN
// weekly stream the frozen capture (41550 / e6b0c709) measures.
import {
  activeKitDeal,
  seasonLastWeek,
  expireOffers,
  hasLiveOffer,
  isSponsorReviewWeek,
  pruneEntryLetters,
} from './offers'
// The load slice (docs/specs/coach-as-load-manager.md): pure, world-free, world -> coachLoad only.
import { coachEscalates, coachKnockCall, coachManagesLoad, coachWarnsEntry, type CoachLoadView } from './coachLoad'
import { addEvent, seasonIndexOf, seasonStartWeek, financeWindow, financeSeries } from './world/ledger'
import { openingCoachId, practiceCoachRateFor, hireCoach, coachSinceWeek, matchesEverPlayed, setCoachOnEventWeeks, coachBilling, coachMarket } from './world/coachMarket'
export { openingCoachId, practiceCoachRateFor, hireCoach, coachSinceWeek, matchesEverPlayed, setCoachOnEventWeeks, coachBilling, coachMarket }
import { startingSkills, withHeadStart, kidMatchPlayer, kidMatchPlayerFor } from './world/player'
export { startingSkills, kidMatchPlayer, kidMatchPlayerFor }
import { ageInjuryFactor, consecutivePlayFactor, playedWeeksInTrailing4, injuryTau, rollInjury, resolvePhysio } from './world/injury'
export { ageInjuryFactor, consecutivePlayFactor, playedWeeksInTrailing4, injuryTau, rollInjury, resolvePhysio }
import { enterEvent, withdrawEvent, cancelEntry } from './world/entries'
export { enterEvent, withdrawEvent, cancelEntry }
import { eventById, refundPractice } from './world/bookings'
import { KNOCK_HISTORY_MAX, retireKnock } from './world/knockHistory'
export { KNOCK_HISTORY_MAX }
import { fireMilestone, captureMilestone, maybeFireSeasonWrapUp, emptySeasonRecord, emptyTrophyLedger, copyTrophyLedger } from './world/milestones'
export { emptySeasonRecord, emptyTrophyLedger }
import { localSponsorCents, reviewSponsors, acceptOffer, declineOffer, travelCostFor, academyCoverOf, chargeTravel } from './world/sponsors'
export { localSponsorCents, reviewSponsors, acceptOffer, declineOffer, travelCostFor }
import { restRecoveryBonus, accrueCondition, medicalClearance, medicalBlock, layoffCovering, layoffCoversWeek, layoffBlock, availabilityStatus, entryStatus, arrivalStatus } from './world/medical'
export { restRecoveryBonus, accrueCondition, medicalClearance, medicalBlock, layoffCovering, layoffCoversWeek, layoffBlock, availabilityStatus, entryStatus, arrivalStatus }
export type { AvailabilityStatus, MedicalClearance, MedicalBlock, LayoffBlock, EntryStatus, ArrivalVerdict, ArrivalStatus } from './world/medical'
// Pass-throughs that historically lived in the condition/availability block and left with it:
// re-exported here so the ~111 modules importing them from  keep working.
export { matchDrain, runFatigueExtra, tournamentRunStrain, conditionMatchFactor } from './condition'
export { isExamWeek, isBlackoutWeek } from './season/calendar'
export { isTierAgeOpen, tierAgeBlock } from './season/calendar'
import { vacationForWeek, practiceForWeek } from './world/bookings'
export { vacationForWeek, practiceForWeek }
import { cohortIds, inTrack, fieldProsOf, rankingFor, fullRanking, recomputeKidRank, refreshDerivedRankCaches, kidPoints, kidDomesticPoints, isTierEligible, acceptanceRank, tierOpenFor, outgrewTier, rankIn, prevRankIn } from './world/ladder'
export { inTrack, recomputeKidRank, refreshDerivedRankCaches, kidPoints, kidDomesticPoints, isTierEligible, acceptanceRank, tierOpenFor, outgrewTier }
import { KID_ID } from './world/constants'
export { KID_ID }
import { isCappedTier, annualEntryLimit, entryCapUsage, isCappedProTier, annualProEntryLimit, proEntryCapUsage } from './world/entryCaps'
export { isCappedTier, annualEntryLimit, entryCapUsage, isCappedProTier, annualProEntryLimit, proEntryCapUsage }
import { finishLabel, prizeCentsFor, stageLabel } from './world/labels'
export { finishLabel, prizeCentsFor }
import { START_AGE_YEARS, ageAtWeek, kidBirthYear, kidAgeExact, kidAgeYears, birthdayWeek, birthdayTurning, markBirthday } from './world/age'
export { START_AGE_YEARS, ageAtWeek, kidBirthYear, kidAgeExact, kidAgeYears, birthdayWeek, birthdayTurning }

// Phase 3 world: the living-season integration. The worker owns this state; the UI
// only ever sees snapshots. All randomness flows from the world RNG stream, and the
// per-week MAIN-stream draw count is independent of player input (see RNG discipline
// in docs/specs/phase3-world.md).
//
// ⚠ THE RNG REGIME CHANGED AT v35 (docs/review/proposals/P3-rng-persistence.md). The MAIN stream's
// position is now PERSISTED PER CAREER (`rngMain: {s, n}` below): a load verifies the pair and
// resumes — it no longer rebuilds the position by replaying every week ever played. Two things
// follow, and they are different claims:
//   * INPUT-INDEPENDENCE IS STILL LAW, proved as pairwise A/B — a no-action run and an
//     action-laden run under the same code must tap identical MAIN sequences (player choices
//     cannot re-roll the world's dice). That is a fairness property and it is permanent.
//   * CROSS-VERSION DRAW-COUNT STABILITY IS NOT REQUIRED ANY MORE. The frozen capture
//     (41550 / e6b0c709, tests/condition.test.ts B1) is a documented measurement now, not a
//     change-gate: a wave that legitimately adds a MAIN draw updates the pin and moves on,
//     because no loaded career depends on the historical count being reproducible — each carries
//     its own position.

// v36 = W2-LADDER's `proEntryWeeks` (the pro AER ledger); v37/v38 stay reserved for endings/psyche
// per act2-pro-tour.md §9's renumbering.
export const SAVE_SCHEMA_VERSION = 36



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
  /** THE PERSISTED MAIN POSITION (v35): mulberry32's register + the cumulative draw count. The
   *  worker draws through `resumeMain(world.rngMain)`, which mutates this pair in place — so every
   *  autosave carries the live position by construction and a load RESUMES instead of replaying
   *  the whole career. The two fields are redundant on purpose (`s = seed32 + n·STEP mod 2³²`):
   *  the pair is its own checksum, and `mainStateConsistent` is the load-time verifier. Only the
   *  MAIN stream has state at all — every sub-stream is re-derived at its call site from a
   *  purpose-scoped seed string, which is why nothing else needed persisting. */
  rngMain: MainRngState
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
  /** her rank in the PROFESSIONAL (WTA) table – the third one, added with the adult rungs (task #17).
   *
   *  Same shape and the same reason as `kidRankDomestic` above: derived, cached beside the other two
   *  by the one writer (`recomputeKidRank`), and OPTIONAL so a career opened before the field existed
   *  needs no migration – it recomputes on the next tick. Note this is not the same question as
   *  "has she turned professional": the fallback (below the whole field) is what a girl who has never
   *  entered a W15 reads, which is why `tierOpenFor`'s wta arm gates on her having a counting result
   *  before it will read this number at all. */
  kidRankWta?: number
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
  /** `kidRankWta` as it stood at the start of the last resolved week – the third member of the pair
   *  above, written by the same one writer for the same reason: a movement arrow is
   *  (previous - current) and both halves have to come out of ONE table. Optional, so no migration. */
  prevKidRankWta?: number | null
  /** THE ON-RAMPS SHE HAS ALREADY CROSSED (v34). An on-ramp is a THRESHOLD, not a standing condition.
   *
   *  ⚠ WHY THIS IS STATE AND NOT DERIVED, which is the whole reason for the schema bump. Both
   *  on-ramps are denominated in the table BELOW them - J30 reads her domestic best-6, W15 reads her
   *  ITF junior best-6 - and both of those are ROLLING 52-WEEK windows. So the evidence that she once
   *  cleared the bar deletes itself: a season spent abroad ages out every domestic result, and from
   *  eighteen the J rungs are shut on AGE so no junior point can ever be earned again. Derived, this
   *  question has no honest answer a year later; latched, it has exactly one.
   *
   *  Owner, 31.07, playing: «не может играть в J серии, потому что ранг в national упал» - and
   *  «въезд – это порог, который переходят один раз, а не условие, которое держат постоянно».
   *  Measured before the fix (tools/j30-onramp-lock.ts): 209/216 careers went through the J30 door
   *  and were shut out again, 160/216 of them while J60 or J300 stood OPEN.
   *
   *  ⚠ ACCEPTANCE LISTS DO NOT LATCH, AND MUST NOT. Only the bottom rung of each table is an on-ramp.
   *  J60/J300/W35/W100 are acceptance cuts read against a CURRENT ranking, which is how a real entry
   *  list works - you do not get into a draw on a ranking you held two years ago. The latch guarantees
   *  a way back ONTO the table; it never guarantees a place in a field.
   *
   *  Written by `latchOnRamps`, which rides with `recomputeKidRank` so it cannot be forgotten at a
   *  call site. Pure state: no draw on any stream, so the frozen MAIN capture cannot move. */
  onRampCleared: { itf: boolean; wta: boolean }
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
  /** THE TITLES LEDGER (v31): every title and every LOST final of her career, per tier, as the
   *  absolute weeks they happened in. Written beside `bestFinishByTier` at tournament finalize;
   *  behind the Trophy Cabinet. Full shape and the `finals` warning: `TierTrophies` in protocol.ts.
   *
   *  ⚠ IT IS A NEW FACT, NOT A VIEW OF AN OLD ONE, and every neighbour it might have been derived
   *  from loses the answer on purpose. `bestFinishByTier`, one line up, is a HIGH-WATER MARK: it
   *  keeps 0 or 1, never both, never a count and never a week, and the day she finally wins the
   *  tier it overwrites the silver it was holding. `milestones` keeps FIRSTS (`title:<tier>` is its
   *  whole identity, so a five-time J30 champion has one row). `results` prunes at 52 weeks and
   *  `events` at 400, of which 60 reach a snapshot. Nothing in a save counts anything career-wide,
   *  which is why this had to be stored rather than computed.
   *
   *  Bounded by the number of finals a career can reach - a handful a season at most - so it is
   *  never pruned, and pruning it would defeat the one thing it is for. */
  trophiesByTier: Record<TierId, TierTrophies>
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
  /** THE SAME SEASON W-L, PER LADDER (v28). Written beside the two counters above, never instead of
   *  them – see `Snapshot.seasonRecord` for the owner's ask and `matchesEverPlayed` for why the
   *  totals had to keep their own home.
   *
   *  Optional so a pre-v28 save's `undefined` is a shape the readers already handle; the migration
   *  fills it in (see migrations.ts v28) and `finalizeTournament` maintains it from there. */
  seasonRecord?: Record<LadderTrack, { wins: number; losses: number }>
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
  /** W4 (v26): THE KNOCK she is carrying, or null. See engine/knock.ts for the whole design.
   *
   *  Two states in one field. `choice === null` is a QUESTION the career is stopped on; once he
   *  answers, it is a CONDITION the next weeks resolve under (a rest week, or a loaded injury roll
   *  through `untilWeek`). Retired at the top of the tick once `week > untilWeek`.
   *
   *  ⚠ THE ONLY REASON THIS SLICE BUMPS THE SCHEMA. `choice` is the player's decision, and a
   *  decision that evaporates on reload is not one – he could close the app on the dialog and come
   *  back to a career that had quietly picked for him. Everything else the knock produces (the
   *  dialog copy, the prompt) is derived at snapshot time and costs nothing. */
  knock: Knock | null
  /** W4 (v26): retired knocks, oldest first, pruned to the last KNOCK_HISTORY_MAX.
   *
   *  THE ACCUMULATING THREAD, and the reason it is a list rather than a counter: a knock he SENT HER
   *  BACK OUT ON puts that part of her body on the record, and `pushedParts` reads this to make the
   *  next one land there ~55% of the time and bite harder when it does. A counter could not say WHICH
   *  shoulder. It also feeds the cooldown, so one field carries both halves of the rate limit. */
  knockHistory: KnockRecord[]
  /** THE INBOX (v32): every letter this career has been sent, oldest first – open, signed, refused
   *  and expired alike. docs/specs/offers-and-the-inbox.md §2; the mechanism is engine/offers.ts.
   *
   *  ⚠ IT IS ON THE WORLD AND NOT IN THE EVENT FEED, and the spec makes that a rule rather than a
   *  preference (§5): a SIGNED DEAL HAS TO OUTLIVE EVERY PRUNE. `events` caps at 400 rows and a busy
   *  career burns that in a couple of seasons, so a contract announced in the feed is a contract that
   *  silently stops existing - and "silently" is the whole problem, because the thing it would stop
   *  paying is her equipment. The same argument `trophiesByTier` makes one field up.
   *
   *  Bounded by construction: the shop reviews once a season and writes at most one letter, so this
   *  is a handful of rows per career and is never pruned. Pruning it would defeat what it is for. */
  offers: Offer[]
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
  /** THE PRO AER LEDGER (v36, W2-LADDER §5): the absolute WEEK of every PROFESSIONAL (W-rung)
   *  event she has entered - `internationalEntryWeeks`' exact parallel, one table up, and NEVER
   *  merged with it: the WTA's age rule is "separate from and additional to" the ITF junior one
   *  (research §4), so a sixteen-year-old holds both allowances at once and each ledger counts
   *  only its own family (ECONOMY.entryCap.cappedProTiers vs .cappedTiers).
   *
   *  Same construction as the junior array for the same four reasons: a persisted ledger because
   *  the kid's result row is award-only (a first-round W15 exit leaves no other trace - and at
   *  w15/w35 it still pays 0); weeks rather than a counter so "how many this season" is a filter
   *  and a missed reset is impossible; at most one entry per week so the week identifies the slot
   *  a withdrawal removes; pruned to the current season onward at housekeeping. Entered at
   *  enter-time, spliced on refunding withdrawal, KEPT on every forfeiting exit - the tour counts
   *  participation, and a name still on a closed list participated. */
  proEntryWeeks: number[]
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

// THE LEDGER PRIMITIVES moved to world/ledger.ts (P4 extraction). `addEvent`/`accrueFinance` are
// imported at the top of this file; the pure finance folds are re-exported here under their
// historical names so every existing `from ...engine/world` call site keeps working.
export { seasonIndexOf, seasonStartWeek, financeWindow, financeSeries }

// player: moved to world/player.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

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


// THE LADDER (ranking helpers + tier eligibility) moved to world/ladder.ts (P4 extraction).
// Imported back below and re-exported under the historical names.
// milestones: moved to world/milestones.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

// injury: moved to world/injury.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

// --- W4: THE KNOCK ------------------------------------------------------------
//
// The design, the anti-farming argument and the RNG discipline all live in engine/knock.ts, which
// holds the dice, the anatomy and the copy. This is the half that touches the world: when a knock
// arrives, when it retires, and what the parent's answer does to the weeks that follow.
//
// ⚠ THE DECISION GOVERNS THE WEEK AHEAD, NOT THE WEEK JUST PLAYED, and that is a structural choice
// worth stating. `rollKnock` runs at the END of the tick – she came off court on the Friday – so by
// the time the dialog is on screen the week is already resolved and cannot be edited. The alternative
// (pausing mid-tick, the way `pendingTournament` does) would let the choice re-write the week it
// arrived in, at the price of splitting the weekly resolution in half for one feature. Not worth it,
// and the fiction is better this way round: something happened on Friday, and what you decide is what
// happens NEXT week.

/** Is the career waiting for an answer? The ONE predicate `advanceWeeks` blocks on and the snapshot
 *  builds its prompt from, so the dialog and the engine can never disagree. */
export function pendingKnock(world: WorldState): boolean {
  return world.knock !== null && world.knock.choice === null
}

/** A week she spent training at home and nothing else – the only kind of week a knock arrives on.
 *
 *  ⚠ DELIBERATELY NARROW, and every clause earns its place. A tournament week already has a story
 *  (and its own injury multiplier); an off-season or exam week is a blackout and must keep feeling
 *  like one; a booked family week is the opposite of load; a friendly is a match; and a body already
 *  laid up cannot pick up a niggle. What is left is exactly the week the owner was complaining
 *  about – the one with nothing in it but training. */
export function ordinaryTrainingWeek(world: WorldState): boolean {
  return (
    world.injury === null &&
    world.pendingTournament === null &&
    !isCompetitionWeek(world) &&
    !isBlackoutWeek(world.week) &&
    vacationForWeek(world, world.week) === undefined &&
    practiceForWeek(world, world.week) === undefined
  )
}

/** Retire a knock whose weeks are up. Runs at the TOP of the tick, after `world.week` has moved, so
 *  a knock is live for weeks `sinceWeek + 1 .. untilWeek` inclusive and `rollInjury` sees the right
 *  answer on every one of them. Undecided knocks never expire – they block time instead. */
export function expireKnock(world: WorldState): void {
  if (world.knock === null || world.knock.choice === null) return
  if (world.week > world.knock.untilWeek) retireKnock(world)
}

/** Roll for a knock (tick step 3c, after the week's work). ZERO main-stream draws – `drawKnock`
 *  reads `seed:knock:<week>`, its own per-week sub-stream – so the frozen capture cannot move.
 *
 *  ONE AT A TIME AND RATE-LIMITED: nothing arrives while a knock is open (decided or not) or inside
 *  KNOCK_COOLDOWN_WEEKS of the last one retiring. See knock.ts's farming note (d). */
export function rollKnock(world: WorldState): void {
  if (world.knock !== null) return
  if (!ordinaryTrainingWeek(world)) return
  const view = {
    seed: world.seed,
    week: world.week,
    condition: world.condition,
    plan: world.plan,
    history: world.knockHistory,
  }
  if (!offCooldown(view)) return
  const knock = drawKnock(view)
  if (!knock) return
  world.knock = knock
  // Type 'info', not 'injury': nothing has happened to her body that costs anything yet, and the 💬
  // channel is where somebody SAYS something. Calling it an injury in the feed would also make the
  // Memory card's first-injury milestone a lie by association.
  addEvent(world, {
    week: world.week,
    type: 'info',
    // ⚠ IT REPORTS, IT DOES NOT DEMAND - and the repeat line used to end "It needs a decision."
    // (owner, 31.07: «а где сам decision? кто его должен принимать?»). It was written before the
    // routing below existed, and the routing is what made it a lie on the commonest path there is.
    //
    // Three things can happen to a knock. With no load-managing coach the dialog opens and the parent
    // decides; with one who escalates, the dialog opens too and he says he is asking. On the third
    // path - a coach who simply takes the call, which is what DEFAULT_PROFILE's middle rung does - the
    // choice is made two lines down and NOBODY ASKS THE PLAYER. The feed then told him a decision was
    // needed, and immediately afterwards told him what the coach had decided: the shape of having been
    // asked and ignored.
    //
    // So the arrival line states the fact and stops. THE DEMAND IS THE DIALOG, and where there is no
    // dialog there is no demand to make - the coach's own line says what he did instead. That is
    // correct on all three paths without branching on any of them, which is why it is a deletion
    // rather than a condition.
    text: knock.repeat
      ? `Her ${knock.part} is sore again – the same one.`
      : `She has picked up a sore ${knock.part}. Not an injury – yet.`,
  })
  // ⚠ AND IF THE FAMILY IS PAYING SOMEBODY, HE ANSWERS IT – docs/specs/coach-as-load-manager.md §8.
  // This single line is the routing the whole slice is about: `pendingKnock` is false immediately, so
  // `advanceWeeks` never halts and the dialog never opens. That is the product - «you are buying your
  // attention back» - and it is why the rule lives in coachLoad.ts rather than here.
  //
  // ⚠ THE EVENT SURVIVES THE DIALOG'S REMOVAL, and that is not decoration. W4 exists because the owner
  // complained that training weeks «просто скипались»; a slice that silently deleted the stop for four
  // of five rungs would hand him that complaint back dressed as a feature. So the knock still happens,
  // still costs (KNOCK_REST_GROWTH or the loaded roll), still takes the week's frame and its scrap - and
  // `coachDecidedKnock` below writes what was decided into the feed in the coach's own voice. He finds
  // out what happened to his daughter; he just is not the one deciding.
  if (coachManagesLoad(tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId)))) {
    coachDecidesKnock(world)
  }
}


/** The hired coach's answer, taken the moment the knock arrives. Separate from `decideKnock` so the
 *  parent's path keeps its guard (`decideKnock` throws on an already-answered knock, which is a real
 *  protection against a double-tap) while this one is an internal step of the same tick.
 *
 *  ZERO DRAWS: `coachKnockCall` is arithmetic, and the one draw behind `shownStamina` is the radar's
 *  per-career `seed:read:stamina` - taken on its own sub-stream, outside the MAIN sequence, exactly as
 *  `drawKnock` takes `seed:knock:<week>`. The frozen capture (41550 / e6b0c709) cannot move. */
function coachDecidesKnock(world: WorldState): void {
  const k = world.knock
  if (!k || k.choice !== null) return
  const view = coachLoadViewOf(world)
  // ⚠ ...UNLESS HE WANTS THE PARENT'S SAY. The call stays unanswered, `pendingKnock` stays true, and the
  // dialog opens exactly as it does for a self-coached career - which is what keeps W4's content alive on
  // a career that has a coach (DEFAULT_PROFILE is 'middle', so that is most of them). See coachLoad.ts
  // `coachEscalates`: the zone scales with his haze, so a cheap coach asks often and an Elite one almost
  // never - and "you are buying your attention back" becomes a number instead of a slogan.
  if (coachEscalates(view, k.repeat)) {
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: k.repeat
        ? `The coach wants to talk about her ${k.part} before anyone decides.`
        : `The coach is in two minds about the ${k.part}. He is asking us.`,
    })
    return
  }
  const choice = coachKnockCall(view, k.repeat)
  k.choice = choice
  k.untilWeek = knockUntilWeek(k, choice)
  addEvent(world, {
    week: world.week,
    type: 'info',
    // HIS voice, not the parent's – the feed's `decideKnock` lines are what the family decided, and
    // these are what they were told. The difference is the thing they are paying for.
    text:
      choice === 'rest'
        ? `The coach is keeping her off the court this week – the ${k.part}.`
        : `The coach is happy for her to train through the ${k.part}.`,
  })
}

// =================================================================================================
// THE COACH AS LOAD MANAGER (docs/specs/coach-as-load-manager.md) – the world side
// =================================================================================================
//
// The design, the rejected oracle and the both-directions argument all live in engine/coachLoad.ts,
// which is pure and world-free. This is the half that touches the world: assembling what the coach can
// SEE, and letting him answer the knock when the family is paying somebody to.

/**
 * HER SKILLS RADAR VIEW – hoisted out of `toSnapshot` by the load slice, because the COACH now reads it
 * too and at a different moment (inside the tick, when a knock arrives) than the screens do.
 *
 * ⚠ ONE SPELLING, WHICH IS THE WHOLE REASON IT IS A FUNCTION. `toSnapshot`'s own note already argues
 * this for the two readers it had ("a second literal here would be a second place for 'which matches
 * count' to drift"); a third reader inside the tick makes it load-bearing rather than tidy. If the
 * coach acted on a differently-assembled view, he would be managing a girl the radar is not drawing -
 * and §8's entire claim is that his belief and the radar's contour are the SAME belief.
 */
export function radarViewOf(world: WorldState): RadarWorldView {
  return {
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
}

/**
 * WHAT THE COACH CAN SEE OF HER BODY, this week.
 *
 * `shownStamina` is the radar's own estimate of the stamina axis - her true value displaced by his
 * rung's haze, one draw per career with a FIXED SIGN (see radar.ts `shownSkill`). Stamina is the axis
 * because it is the physical one: a load manager is judging how much tennis she can absorb, and that is
 * what this attribute means.
 *
 * ⚠ CONDITION IS PASSED EXACT, NOT FOGGED, and that asymmetry is deliberate. The condition bar is a
 * number the game prints for the player outright, so a coach who could not read it would be blinder
 * than the parent who hired him - which is not a model of a cheap coach, it is a bug. What a cheap coach
 * gets wrong is how much of it she can AFFORD to spend, and that is `shownStamina`.
 *
 * Called at most a handful of times per career (a knock arrives ~15 times over 14->18), so the evidence
 * fold it costs is not on the weekly path.
 */
export function coachLoadViewOf(world: WorldState): CoachLoadView {
  const view = radarViewOf(world)
  const weeksTogether = Math.max(0, world.week - coachSinceWeek(world))
  const confidence = axisConfidence(view.coachTier, weeksTogether, axisEvidence(view, 'stamina').level)
  return {
    tier: view.coachTier,
    shownStamina: shownSkill(view, 'stamina', confidence),
    condition: world.condition,
    playedWeeks: playedWeeksInTrailing4(world),
    confidence,
  }
}

/** THE PARENT ANSWERS. The only way an undecided knock clears, and the only way time moves again.
 *
 *  Pure state: `untilWeek` is arithmetic and the consequences are read off it later (a rest week by
 *  `knockRestWeek`, a loaded roll by `knockTauFactor`). ZERO draws, on any stream – which is what
 *  makes a decision the player can take at any moment safe to put inside a deterministic sim. */
export function decideKnock(world: WorldState, choice: KnockChoice): void {
  const k = world.knock
  if (!k) throw new Error('Nothing to decide')
  if (k.choice !== null) throw new Error('That knock has already been answered')
  k.choice = choice
  k.untilWeek = knockUntilWeek(k, choice)
  addEvent(world, {
    week: world.week,
    type: 'info',
    text:
      choice === 'rest'
        ? `Resting the ${k.part} – a week off the training court.`
        : `Training through the ${k.part}. The coach knows.`,
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
// THE COACH MARKET moved to world/coachMarket.ts (P4 extraction); imported back and re-exported.

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
    // Her sparring partner's groundstroke comes off the SAME derivation a tournament opponent's
    // does, so a friendly is not a different game (v25 - the cohort stores no fifth attribute).
    groundstrokes: rivalGroundstrokes(opponent),
    // ...and for the same reason her AGE comes off the cohort row, so the friendly's box score reads
    // her serve at her real pace instead of falling back to the career-start age.
    age: opponent.ageYears,
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
  // The pro ledger prunes on the same boundary for the same reason - bounded by its own cap.
  world.proEntryWeeks = world.proEntryWeeks.filter((w) => w >= from)
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

/** Is the coach on the clock this week? Pure, zero draws, and the ONE place the rule lives: the bill and
 *  the development step both ask it, so they can never disagree about whether he was there.
 *
 *  ⚠ A BOOKED FAMILY WEEK IS NOT A COACHING WEEK (owner, 30.07). It used to be: a vacation is not a
 *  COMPETITION week, so this returned true and an elite coach billed $909 for the week the diary describes
 *  as «A week away as a family. Nobody mentioned rankings once.» - measured, on seed bill-probe W8. The
 *  family is at the seaside; he is not there, he is not owed, and `growWeek` should not be developing her
 *  at his rate either. One clause fixes the bill and the development together, which is the whole reason
 *  they read the same predicate.
 *
 *  ⚠ THE LAYOFF STAYS A COACHING WEEK, and that is the owner's call rather than an oversight: «это ок, они
 *  вполне могут вместе восстанавливаться». She is at home doing rehab and he is part of it.
 *
 *  ⚠ AND SO DOES THE EXAM FORTNIGHT - «на тренировку можно доехать». She is home, blacked out from
 *  tournaments, not from training. What was wrong on those weeks was the COPY, not the money: the notes
 *  claimed the racquet never left the hall while $933 of coaching was billed. Fixed in engine/diary.ts. */
export function coachWorksThisWeek(world: WorldState): boolean {
  if (vacationForWeek(world, world.week) !== undefined) return false
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
// draws and cohort drift / the RNG replay stay untouched.
//
// ⚠ THE PRODUCT-SPONSORSHIP VALVE HAS LEFT THIS FUNCTION (30.07, tune/rank-numbers). It used to
// read `world.kidRank` here, at purchase time, and halve or zero the line. Both the table it read
// and the shape of the subsidy were wrong – the whole argument is on `ECONOMY.sponsorship`, which
// is now an annual grant gated on her NATIONAL rank (see reviewLocalSponsor). The gear line is a
// gear line again: the family pays for its kit, and the sponsor's contribution arrives once a year
// as money, where it can actually be seen.
//
// ⚠ ...AND A SIGNED KIT DEAL SENDS SOME OF THESE BILLS TO THE SHOP (v32). This is the sponsorship
// arriving as PRODUCT, which is what the sources say a junior deal actually is, and it is a
// deliberately different animal from the percentage valve that was removed on 30.07:
//   * it is capped by a PER-SEASON allowance, which ECONOMY.sponsorship's own argument identifies as
//     the only shape of subsidy that can be flat. The wealth corridor can raise the BILL but not the
//     ceiling, so a rich family cannot extract more of it by buying a more expensive racket;
//   * it covers the three lines the equipment model reads - racquets, strings, shoes - and not
//     apparel, because it is a kit deal and not a clothing allowance;
//   * the line is still EMITTED, at the amount the family actually paid ($0 when the shop took the
//     whole of it), so the Money breakdown shows the relationship instead of a cost quietly
//     vanishing. Exactly `chargeTravel`'s pattern with the academy's cover, and the $0-line handling
//     the finance aggregate already has (it never stores a zero-valued category entry).
/** ⚠ WHICH BILL IS WHICH LINE - the one place the equipment model's vocabulary (`KitLine`: strings /
 *  frame / shoes, what the MATCH reads) is mapped onto the ledger's (`GearCategory`: stringing /
 *  rackets / shoes, what the FAMILY pays). A rung names lines; a gear hit names a category; without
 *  a single mapping the two would be joined by a string comparison at each site and a national deal
 *  could end up paying a bill it does not cover.
 *
 *  Apparel is deliberately absent from the values: it is not a line the match reads and a kit deal
 *  is not a clothing allowance, so no rung can ever cover it. */
const GEAR_CATEGORY_LINE: Partial<Record<GearCategory, KitLine>> = {
  stringing: 'strings',
  rackets: 'frame',
  shoes: 'shoes',
}

function resolveGear(world: WorldState): void {
  const bg = world.profile.background
  const deal = activeKitDeal(world.offers, world.week)
  const terms = deal ? (deal.terms as KitOfferTerms) : null
  for (const category of GEAR_CATEGORIES) {
    const hit = gearHitForWeek(world.seed, category, bg, world.week)
    if (!hit) continue
    const line = ECONOMY.gear[category]
    // What the brand picks up of this line: everything, up to whatever is left of the allowance -
    // and ONLY if the deal actually covers this line. That is the brand ladder arriving at the till:
    // a local deal pays her restringing and leaves the racket on the family, a national one adds the
    // frame, and only the top rung pays for everything.
    const remaining = deal && terms ? Math.max(0, terms.kitAllowanceCents - (deal.coveredCents ?? 0)) : 0
    const kitLine = GEAR_CATEGORY_LINE[category]
    const inDeal = !!terms && !!kitLine && terms.covers.includes(kitLine)
    const covered = deal && terms && inDeal ? Math.min(hit.amountCents, remaining) : 0
    const paid = hit.amountCents - covered
    if (deal && covered > 0) deal.coveredCents = (deal.coveredCents ?? 0) + covered
    world.fundsCents -= paid
    addEvent(world, {
      week: world.week,
      type: 'expense',
      category: line.breakdown,
      text: covered > 0 ? `${line.flavor[bg]} – on ${terms!.brand}` : line.flavor[bg],
      amountCents: -paid,
    })
  }
}

// sponsors: moved to world/sponsors.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

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
  //
  // ⚠ THE GRANT STANDS DOWN UNDER A LIVE KIT DEAL (owner, 01.08: «мне кажется, что это справедливо»).
  // Until round 15 the academy paid the full grant while a signed brand deal covered the same
  // equipment lines - the family was being paid twice for one string bed. The academy is not naive:
  // at review time it reads the deal in force (`activeKitDeal`, the same one answer the wear model
  // and the travel share read) and funds only the UNCOVERED lines, a third of the grant per line.
  // Full coverage (the global rung: strings + frame + shoes) pays nothing, and the review SAYS SO in
  // the feed instead of going silent - a line that used to arrive every year and quietly stops is a
  // bug report waiting to be filed. The review is a flow, not persisted terms: nothing here touches
  // the schema, and a deal signed or lapsed between reviews is simply read fresh next year.
  // Zero draws, like everything in this review.
  const kit = kitGrantCents(level)
  const deal = activeKitDeal(world.offers, world.week)
  const covers = deal ? (deal.terms as KitOfferTerms).covers : []
  const brand = deal ? (deal.terms as KitOfferTerms).brand : ''
  const grant = Math.round((kit * (3 - covers.length)) / 3)
  if (kit > 0 && covers.length >= 3) {
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: `No academy kit grant this year – ${brand} already kits her out.`,
    })
  } else if (grant > 0) {
    world.fundsCents += grant
    // The income row says what the money is FOR when a brand holds some of her lines - the parent
    // reading the ledger must be able to tell a two-thirds grant from a full one.
    const uncovered = (['strings', 'frame', 'shoes'] as KitLine[]).filter((l) => !covers.includes(l))
    const LINE_WORD: Record<KitLine, string> = { strings: 'strings', frame: 'frames', shoes: 'shoes' }
    const listOf = (lines: KitLine[]) => lines.map((l) => LINE_WORD[l]).join(' and ')
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'academy',
      text: deal
        ? `Academy kit grant – ${listOf(uncovered)}; ${brand} covers her ${listOf([...covers])}.`
        : 'Academy kit grant – rackets, strings and shoes for the season',
      amountCents: grant,
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
  return { id, name: id, serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 }
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
  // ⚠ HER W-TIER DRAWS ARE MADE OF THE MERGED FIELD (living-field phase W, 01.08). For a W-track
  // event the candidate universe becomes LIVE cohort ∪ field pros and the positions come from the
  // MERGED W standings – which is the whole fix: a W15 used to draw by percentile over the MIXED
  // table (median entrant ~53/200, mean skill 50.2, weaker than a J300 field), because the mixed
  // table was the only table there was. The percentile-band machinery on top is byte-identical.
  //
  // Built to the same independence rule as `aiRanking`: LIVE rows fold WITHOUT the kid (results
  // and roster both), so who turns up to her W15 never depends on what she has done – the exact
  // property the mixed `ranking` argument already has for every other tier. Field pros carry no
  // fatigue ledger in phase W, so `fatigue` simply has no entry for them and `rivalField` reads
  // them fresh at 100 – a real simplification, named in the spec as phase-2 work, and conservative
  // in the right direction (the field she meets is at its best).
  //
  // RNG: everything below stays on `seed:kidtour:<id>`, the event's own sub-stream. The candidate
  // COUNT changed for the three W rungs – a documented event-sub-stream composition change, the
  // same class as every band/age re-pick – and the MAIN capture is untouched by construction.
  const isW = TIERS[event.tier].track === 'wta'
  const pros = isW ? fieldProsOf(world) : null
  const universe = pros ? universeForTier(event.tier, world.cohort, pros) : world.cohort
  const selRanking = pros
    ? mergedWtaRanking(
        computeRanking(
          world.results.filter((r) => r.playerId !== KID_ID),
          world.week,
          BEST_N_BY_TRACK.wta,
          cohortIds(world),
          inTrack('wta'),
        ),
        pros,
      )
    : ranking
  // ⚠ AND ONE PRO PLAYS ONE EVENT A WEEK (W2-FIELD2, act2-pro-tour.md §8.2). When two W rungs land
  // on the same week the HIGHER one draws first and its field leaves this window – the professional
  // half of the rule `resolveDoubleBookings` already enforces on the canonical brackets, which
  // cannot reach here because a field pro has no ledger row to rearrange. Deterministic, ordered by
  // TIER_LADDER, and it draws nothing on THIS event's stream (see `weekFieldExclusion`).
  const excluded = pros
    ? weekFieldExclusion(event, world.season, universe, selRanking, world.seed, fatigue)
    : undefined
  const entrants = selectEntrants(event, universe, selRanking, kidRng, fatigue, excluded)
  const field = rivalField(entrants, event, fatigue)
  // v21b: she goes into the draw AT HER STANDING, not at the bottom of it - the same place the
  // acceptance list would give her - and is seeded, or not, on the terms everybody else gets.
  const result = runTournament(event, field, kid, world.seed, kidRng, kidSeedIndexIn(field, selRanking, KID_ID))
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
  // All THREE "before" values, captured together, so no surface can diff across two tables.
  world.prevKidRankDomestic = world.kidRankDomestic ?? null
  world.prevKidRankWta = world.kidRankWta ?? null
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
  // W2-LADDER §6: the tournament desk's receipts age out after a year; contracts never do.
  world.offers = pruneEntryLetters(world.offers, world.week)
  ensureSeason(world)
}

/** The clause appended to a tournament summary that explains the EFFECTIVE ranking change
 *  (round-5 item 1a). `delta` is the change in the kid's windowed best-N sum caused by the
 *  new result: `points` when nothing was displaced, `points − displaced` when a counted
 *  result was pushed out, `0` when the result didn't crack the best N. `bestN` is the TRACK's
 *  window width (W2-LADDER §3) so the sentence names the rule it measured against - "best 6" on a
 *  junior summary, "best 16" on a professional one - instead of quoting the junior rule at both. */
export function rankingDeltaSuffix(points: number, delta: number, bestN: number): string {
  if (points <= 0) return ''
  if (delta <= 0) return ` (does not improve best ${bestN})`
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

  // v31: ...AND THE CABINET REMEMBERS EVERY ONE OF THEM, which the line above cannot. That is a
  // high-water mark: it holds 0 or 1 and never both, it carries no week, and the day she finally
  // wins a tier it OVERWRITES the runner-up it was holding. Nothing else in the save counts either:
  // `milestones` keeps firsts (one row per tier however many she wins), `results` prunes at 52
  // weeks, `events` at 400. So five J30 titles were, until this line, one row and no years.
  //
  // ⚠ THE TWO ARRAYS ARE DISJOINT: `=== 0` and `=== 1`, never `<= 1`. The milestone capture eight
  // lines below deliberately uses `<= 1`, because reaching a first final is the moment a MEMORY
  // wants and winning it is reaching it. A CABINET is the other question - which piece of
  // silverware came home - and one week produces exactly one piece. Counted the milestone's way,
  // the silver plate would light up the first time she WON something and would then claim a tally
  // of finals she never lost. Runner-up has to be countable on its own or the silver half of the
  // screen is a lie. (See `TierTrophies` in protocol.ts.)
  //
  // No draw, no stream, no reordering - a push onto an array the RNG cannot see. The frozen MAIN
  // capture (41550 / e6b0c709) is untouched by construction.
  //
  // The row is created on demand rather than assumed, and that is v30's lesson written down: a
  // migration runs ONCE, so a save upgraded today holds exactly today's tiers, and the week a tenth
  // rung joins TIER_LADDER every one of those saves reaches this line with no shelf for it. That is
  // precisely how `record[track].wins++` came to throw on `undefined` when `LadderTrack` gained
  // `wta`. `emptyTrophyLedger` already follows the ladder for NEW careers; this makes the existing
  // ones grow a shelf the first time they need one, so no future rung needs a migration at all.
  const cabinet = (world.trophiesByTier[event.tier] ??= { titles: [], finals: [] })
  if (kidFinish === 0) cabinet.titles.push(world.week)
  else if (kidFinish === 1) cabinet.finals.push(world.week)

  // v10: count this season's kid wins/losses as they resolve (never re-parsed from text; pruning
  // can't lose them). Every match on the kid's path is one played match.
  //
  // v28: AND THE SAME MATCH IS COUNTED INTO ITS OWN LADDER, one line further on. This is the whole of
  // the owner's «разделить победы и поражения» and it needs no new fact: the event is right here, the
  // event carries its tier, and the tier carries its track, so the attribution is read rather than
  // decided. The two counters and the pair are maintained together on purpose – the pair is a
  // DECOMPOSITION of the totals, not a replacement for them, and anything that increments one and not
  // the other breaks the invariant the Stats screen shows both halves of.
  const track = tier.track
  const record = (world.seasonRecord ??= emptySeasonRecord())
  for (const m of p.result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    if (m.winnerId === KID_ID) {
      world.seasonWins++
      record[track].wins++
    } else {
      world.seasonLosses++
      record[track].losses++
    }
  }

  // A2: AND THIS IS WHERE THE TENNIS FINALLY PAYS HER (task #17). Same commit point as the points,
  // off the same finish index, out of the tier's own table – so a result cannot award one without
  // the other and a skipped event or a walkover pays nothing because it never reaches finalize.
  //
  // ⚠ NO WEALTH CORRIDOR ON THIS LINE, AND THAT IS THE WHOLE POINT OF IT. Everything else the family
  // touches is priced by where they come from: the trip that got her here was multiplied by
  // ECONOMY.travelBgFactor, the coach is billed in the market they can afford, the physio bill has
  // its own factor. The cheque is not a price, it is what the tournament pays the person who won the
  // match, and a working family and a wealthy one are handed the identical piece of paper. It is the
  // only number in the game of which that is true, and it is what makes the cliff mean the same thing
  // to everybody. If a future slice wants a background-scaled income, it must NOT reach for this one.
  const prize = prizeCentsFor(event.tier, kidFinish)
  if (prize > 0) {
    world.fundsCents += prize
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'prize',
      // Names the finish, because the whole design is that the player should be able to read this
      // line against the travel line two rows up and feel the arithmetic. Short dash only.
      text: `${tier.label} prize money – ${finishLabel(kidFinish)}`,
      amountCents: prize,
    })
    // D10 + R15-5: THE FIRST CHEQUE IS A MILESTONE (owner, 01.08: «я believe it's a very memorable
    // moment»). The first week the tennis pays her anything at all - after years of the family
    // paying for everything - is a beat the career keeps: captured into the durable ledger (one row
    // per career, `milestoneKey` collapses repeats) and fired once into the feed with the real
    // figure on it, because "$130 for a first-round exit" and "$2,200 for the title" are different
    // memories and the ledger line two rows up already taught the player to read the number.
    // Same commit point as the cheque itself, so a walkover or a skip can never fire it. Zero draws.
    captureMilestone(world, { type: 'prize', week: world.week, tier: event.tier })
    fireMilestone(
      world,
      'first-prize',
      `💰 First prize money – $${Math.round(prize / 100).toLocaleString('en-US')} at the ${tier.label}!`,
    )
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
  // ⚠ IN THE EVENT'S OWN TRACK, AT THAT TRACK'S WINDOW WIDTH (W2-LADDER §3 - and a latent bug
  // fixed by the same stroke). This pair used to fold the WHOLE ledger with no track filter, so
  // the "best 6" being diffed was a mixed-currency pool: a girl carrying a J300-heavy book who
  // won a W15 was told "does not improve best 6" about a table her result plainly improved,
  // because the junior 300s crowded the mixed six. The suffix now diffs the one table the result
  // pays into, under that table's own N - which is what the sentence always claimed to mean.
  // (`track` is the v28 attribution const a few lines up - the same fact, read once.)
  const before = windowedBestSum(world.results, world.week, KID_ID, BEST_N_BY_TRACK[track], inTrack(track))
  if (points > 0) world.results.push({ playerId: KID_ID, week: world.week, points, tier: event.tier })
  const after = windowedBestSum(world.results, world.week, KID_ID, BEST_N_BY_TRACK[track], inTrack(track))
  addEvent(world, {
    week: world.week,
    type: 'tournament',
    text:
      `${tier.label} (${event.surface}, ${weekLabel(event.week)}): ${world.profile.kidName} – ` +
      `${finishLabel(kidFinish)} (+${points} pts)${rankingDeltaSuffix(points, after - before, BEST_N_BY_TRACK[track])}`,
    finishIdx: kidFinish,
  })
  // World news: who actually took the title of the draw she played in. When the kid IS the
  // champion, the summary + first-title milestone already celebrate it, so only report others.
  const championId = Object.entries(p.result.finishes).find(([, f]) => f === 0)?.[0]
  if (championId && championId !== KID_ID) {
    // A W draw's champion can be a field pro now (living-field phase W, 01.08), and she is in
    // neither the cohort nor `players` unless the kid met her – so the derived field is the third
    // place to ask before falling back to the raw id.
    const champName =
      world.cohort.find((c) => c.id === championId)?.name ??
      p.players[championId]?.name ??
      (isFieldProId(championId) ? fieldProsOf(world).find((c) => c.id === championId)?.name : undefined) ??
      championId
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
//
// ⚠ SPLIT IN TWO BY THE NO-DOUBLE-BOOKING RULE (31.07), AND THE SPLIT IS THE LOAD-BEARING PART.
// The draw and the bracket used to be one call because they share one `aiRng`: `selectEntrants`
// spends the first N numbers of `seed:aitour:<id>` and `runTournament` continues from N+1. A rule
// that has to see EVERY event of the week before ANY bracket runs cannot be written inside a
// function shaped like that – but re-seeding a second stream for the bracket would restart it at
// draw 0 and move every AI result ever recorded. So `drawAiEntrants` makes the draw and hands the
// LIVE RNG OBJECT on; `runAiTournament` resumes on exactly the number it would have read anyway.
// Same stream, same position, same values: the split is invisible to every sub-stream in the game.
function drawAiEntrants(
  world: WorldState,
  event: SeasonEvent,
  aiRanking: RankingRow[],
  fatigue: Map<string, number>,
): { event: SeasonEvent; entrants: AiPlayer[]; rng: Rng } {
  const rng = rngFromSeed(`${world.seed}:aitour:${event.id}`)
  return { event, entrants: selectEntrants(event, world.cohort, aiRanking, rng, fatigue), rng }
}

function runAiTournament(
  world: WorldState,
  event: SeasonEvent,
  entrants: AiPlayer[],
  aiRng: Rng,
  fatigue: Map<string, number>,
): void {
  const field = rivalField(entrants, event, fatigue)
  const result = runTournament(event, field, null, world.seed, aiRng)
  const pts = TIERS[event.tier].points
  for (const [playerId, finish] of Object.entries(result.finishes)) {
    world.results.push({ playerId, week: world.week, points: pts[finish] ?? 0, tier: event.tier })
  }
}

function pruneResults(world: WorldState): void {
  world.results = world.results.filter((r) => world.week - r.week <= RESULTS_WINDOW)
}

// ⚠ HER MATCHES ARE PRUNED LAST, AND THE RADAR IS WHY (31.07).
//
// `radarViewOf` builds the radar's whole evidence base by scraping `world.events` for her own
// competitive match records - and this function trims that feed BY COUNT, oldest-first. Those two
// facts together make an undocumented coupling with teeth: **every non-match row any feature adds
// permanently displaces one of her matches from the window `axisEvidence` measures over.** The
// offers slice found it the expensive way - one extra row per season pushed the radar's worst fog
// re-widening from 0.36 to 0.64 against a 0.5 bound - and designed around it rather than into it.
//
// Designing around it does not scale, because the pressure is not the new feature. Measured on a
// career that plays no tournaments at all, the retained feed is 217 expense + 168 income rows out
// of 400: the window the radar reads is **overwhelmingly bookkeeping**. Money rows accrue every
// single week of a career; her matches accrue only on the weeks she competes. Left alone, the
// arithmetic guarantees that the longer a career runs the less of her tennis the radar can see -
// which is the exact opposite of what a confidence model is supposed to do.
//
// So the budget is unchanged and only the ORDER OF SACRIFICE moves: milestones first (they always
// were), then her competitive matches, then everything else. The cap still bites at the same size,
// the feed is still bounded, and a feature that writes to the feed can no longer quietly cost the
// radar its evidence. A practice friendly is deliberately NOT protected - the radar ignores
// friendlies by design (R11-2), so protecting one would spend the budget on a row it will not read.
function isRadarEvidence(e: WorldEvent): boolean {
  return e.match !== undefined && !e.friendly && (e.match.aId === KID_ID || e.match.bId === KID_ID)
}

function pruneEvents(world: WorldState): void {
  if (world.events.length <= EVENTS_CAP) return
  const kept = world.events.filter((e) => e.keep)
  const evidence = world.events.filter((e) => !e.keep && isRadarEvidence(e))
  const rest = world.events.filter((e) => !e.keep && !isRadarEvidence(e))
  const overflow = world.events.length - EVENTS_CAP
  // Ordinary rows go first. Only if dropping every one of them is still not enough does the trim
  // reach her matches, oldest-first as before.
  const restTrimmed = overflow >= rest.length ? [] : rest.slice(overflow)
  const stillOver = Math.max(0, overflow - rest.length)
  const evidenceTrimmed = stillOver >= evidence.length ? [] : evidence.slice(stillOver)
  world.events = [...kept, ...evidenceTrimmed, ...restTrimmed].sort((a, b) => a.id - b.id)
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
    // v35: the MAIN stream is born at position zero, ON the world. From here on the position and
    // the career are one object — the worker resumes from this pair and its draws advance it.
    rngMain: initMainState(seed),
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
    // Both shut. She starts on zero points in every table, so she has cleared nothing - and the
    // `recomputeKidRank` at the end of this function will not open them either, which is the on-ramp
    // doing its job. The FIRST thing this game asks of her is to earn her way onto the domestic
    // table, and that has not changed.
    onRampCleared: { itf: false, wta: false },
    // Phase 4: her starting build is the SAME derivation that used to be recomputed on demand, so
    // week 0 is byte-identical to the pre-development engine. What changed is that it is now state,
    // and state moves.
    // ⚠ TASK 55 – AND THE HEAD START HER BIRTH MONTH BOUGHT HER. `startingSkills` stays the pure birth
    // derivation (the build she was BORN with, seed-only, and the radar's baseline for every existing
    // save); this adds the eleven months of extra training a January girl has had by the time the game
    // opens. Applied HERE rather than inside `startingSkills` for two reasons: that function is
    // documented as the birth build and two girls with the same seed really do have the same one, and
    // every save written before this existed keeps a radar baseline that has not moved.
    // POST-DRAW arithmetic, so no stream is touched.
    skills: withHeadStart(startingSkills(seed, profile), profile.birthMonth),
    // ⚠ THE CEILING IS ROLLED OFF THE BIRTH BUILD, NOT THE HEAD-STARTED ONE. `rollPotential` adds a band
    // on top of where she starts, so feeding it the head start would hand the January girl a higher
    // CEILING as well as a better start - turning a timing effect into a talent effect, which is exactly
    // what task 55 must not become. Being born in January does not make her able to get better.
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
    // v31: eighteen empty shelves. She has won nothing, and the cabinet says so by showing her all
    // eighteen things she has not won yet.
    trophiesByTier: emptyTrophyLedger(),
    lastSeasonSummary: null,
    seasonHistory: [],
    seasonWins: 0,
    seasonLosses: 0,
    seasonRecord: emptySeasonRecord(),
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
    // W4: nothing hurts yet, and nothing is on her record. Week 1 is the earliest a knock can arrive
    // (rollKnock runs after the week's work), which is right - she has to train before she can pull
    // something doing it.
    knock: null,
    knockHistory: [],
    // v32: nobody has written to her yet, and nobody can until she has put a season in front of
    // them. The first review is the season boundary at week 52 - the same moment the academy makes
    // up its mind, and for the same reason.
    offers: [],
    milestones: [],
    internationalEntryWeeks: [],
    proEntryWeeks: [],
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

// --- v35: the ONE remaining replay, and the budget its verifier is bounded by --------------------

/** The probe replay: a fresh world on the same seed, ticked `weeks` times, drawing through a
 *  resumed position so the returned state carries BOTH the register and the count.
 *
 *  This is byte-for-byte what the worker's `restoreRng` used to do on EVERY load. Under v35 it has
 *  exactly two callers left, and both are terminal: the v34 -> v35 migration (which stamps its
 *  output into the save, once per career, and never runs again) and the worker's
 *  `recoverMainState` (reachable only from a failed consistency check on a corrupted save). It is
 *  valid for the same reason the old replay was — the per-week MAIN draw count is independent of
 *  player input, so a probe with no entries walks the same positions the real career did — and it
 *  is best-effort in the same way too: it replays under CURRENT code, so it lands where current
 *  code says, not where history did. v35 freezes that answer once instead of re-rolling it on
 *  every load for ever (see the migration block's note in migrations.ts). */
export function replayMainState(seed: string, profile: PlayerProfile, weeks: number): MainRngState {
  const st = initMainState(seed)
  const rng = resumeMain(st)
  const probe = createWorld(seed, profile)
  for (let w = 0; w < weeks; w++) tickWeek(probe, rng)
  return st
}

/** The MOST MAIN draws `weeks` of career can legitimately have spent — the plausibility half of
 *  the load-time verifier (the redundancy check `mainStateConsistent` is the other, sharper half).
 *
 *  Derived from what the weekly tick actually spends TODAY, not from a remembered cost table:
 *  `resolveBaseCosts` draws 3 (jitter, flavor, sponsor roll) plus 1 more when the roll hits, and
 *  `driftCohort` draws exactly 4 per rival (see the tick's own header) — so a week costs at most
 *  4 + 4×field. The 8 keeps the bound GENEROUS on purpose: it is corruption detection, not
 *  accounting, and a bound that has to be re-derived every time a draw is added would be the old
 *  frozen-capture tax wearing a new hat. Floored at COHORT_SIZE because the draws were made
 *  against the GENERATED field: a v6/v7-era fixture persists a trimmed shape-sample of its
 *  cohort, but the probe that computed its position drifted all 199. */
export function maxMainDraws(weeks: number, cohortSize: number): number {
  return weeks * (8 + 4 * Math.max(cohortSize, COHORT_SIZE))
}

/** Hydrate the Phase-3 systems onto a pre-v6 save. Idempotent for v6+. */
export function seedWorldForV6(save: Partial<WorldState> & { seed: string; week: number; log?: string[] }): void {
  save.cohort = generateCohort(save.seed)
  save.results = []
  save.entries = []
  save.internationalEntryWeeks = []
  save.proEntryWeeks = []
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

  // 0a0c-bis (30.07, MOVED 01.08): AND THE SPONSORS DECIDE – in the OFF-SEASON, which is where a
  //         contract for next year is really agreed. It used to sit inside the boundary block above,
  //         so the letter landed on week 1 of the new season and the parent spent the first four
  //         weeks of competition weighing it; the owner asked for it to be tied to the start of the
  //         season instead («мне кажется было бы логичным их как раз к старту сезона привязывать»),
  //         and in the real sport equipment deals are negotiated in November and December so the
  //         player opens the year already kitted.
  //
  //         ⚠ THE ONCE-A-SEASON GUARANTEE IS NOW EXPLICIT, and it has to be. The boundary block gave
  //         it away free – `week % 52 === 0` is one week – but the off-season is three
  //         (OFF_SEASON_WEEKS), so the same call made naively would raise a fresh letter every one of
  //         them. `isSponsorReviewWeek` is the FIRST off-season week and no other; it is the same
  //         arithmetic `maybeFireSeasonWrapUp` fires on, which is the precedent for a once-a-year
  //         off-season step.
  //
  //         Placed here, in the same zero-main-draw region the boundary block occupies, and for the
  //         same reason: it takes at most one draw and that draw is on `seed:offer:<week>`, its own
  //         sub-stream. The frozen MAIN capture (41550 / e6b0c709) cannot see it.
  if (isSponsorReviewWeek(world.week)) reviewSponsors(world)

  // 0a0-w4. W4: retire a knock whose weeks are up. FIRST of the pure-state steps, because everything
  //         below that reads it – `injuryTau` at step 1c most of all – must see the same answer for
  //         the whole week. ZERO draws.
  expireKnock(world)

  // 0a0-inbox (v32). ⚠ AND A LETTER LEFT TOO LONG IS GONE. The window is the feature, not a courtesy
  //         (docs/specs/offers-and-the-inbox.md §2): an offer past its deadline lapses, whether or not
  //         the parent ever opened it, and the inbox dot goes out on its own when the last one does.
  //         Beside `expireKnock` because it is the same kind of step - a deadline the world keeps for
  //         the player rather than a decision it makes for him - and ZERO draws, so it is safe this
  //         far up the tick.
  //
  // ⚠ AND IT DELIBERATELY WRITES NOTHING IN THE FEED, which is the one place this slice had to give
  // something up. See the note on `reviewLocalSponsor` for the measurement: a non-match event row
  // permanently displaces a MATCH from the 400-row cap, and the radar's estimate is measured over the
  // matches that window still holds. So the whole inbox is held to the same feed budget as the cheque
  // it replaced - one row per season boundary and not one more - and an expiry is carried by the two
  // surfaces that already carry it truthfully: the dot goes out, and the letter itself says "Expired"
  // in the inbox for as long as the career lasts.
  expireOffers(world.offers, world.week)

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
  // 1c-w4. W4: the REST branch's small credit, applied beside the other week-type gains rather than
  //        inside `accrueCondition` – whose arity-2, zero-RNG contract is pinned by B1 in
  //        tests/condition.test.ts (`expect(accrueCondition.length).toBe(2)`) and must not gain a
  //        parameter. Same shape `resolveVacation` uses for its package gain: accrue first, then add.
  //
  //        ⚠ SMALL ON PURPOSE (KNOCK_REST_CONDITION = 3, against a Light week's free +3 total). It has
  //        to be worth less than what the plan slider hands out for nothing, or a knock becomes
  //        something a player wants – see knock.ts's farming note (b). The value of resting is that
  //        the injury roll never gets loaded, not this.
  if (knockRestWeek(world.knock, world.week)) {
    world.condition = clamp(
      world.condition + KNOCK_REST_CONDITION,
      ECONOMY.condition.min,
      ECONOMY.condition.max,
    )
  }
  resolveVacation(world)
  resolvePractice(world)
  resolvePhysio(world)

  const ids = cohortIds(world)
  const scheduled = world.season.filter((e) => e.week === world.week)
  // Canonical ranking excludes the kid so AI-field selection never depends on the kid's own
  // results / entry history – the canonical AI world stays the same world whatever she does.
  // ⚠ THE MIXED SELECTION TABLE KEEPS THE JUNIOR 6 (W2-LADDER §3, an explicit non-move). This fold
  // is not one of the three ranking tables - it is the AI side's ordinal ambience, all tracks in
  // one pot, feeding `selectEntrants`' percentile bands - and the best-16 rule is about what a
  // PROFESSIONAL SEASON IS WORTH where professional points are read (rankingFor / the merged W
  // table / kidPoints), none of which flow through here. Widening this one would permute every
  // event sub-stream's composition to make a selection heuristic agree with a rule it never
  // implements. The N is stated, not defaulted, so the split cannot land here by accident.
  const aiRanking = computeRanking(
    world.results.filter((r) => r.playerId !== KID_ID),
    world.week,
    BEST_N_BY_TRACK.itf,
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
    // ⚠ HER REAL AGE, not the band's - and this REPLACED a hybrid that said the same thing worse. It used
    // to be `ageAtWeek(week) + relativeAgeYears(birthMonth)`: the band's age plus an offset standing in
    // for a birthday. `kidAgeExact` is the birthday itself, off the game's own calendar, so the number is
    // now a fact rather than a correction - and a December girl develops at 13 because she IS 13, which is
    // the owner's point. Same magnitude, one concept instead of two. No new draw: `growWeek` keeps
    // `seed:growth:<week>`.
    ageYears: kidAgeExact(world.week, world.profile.birthMonth),
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
    // ⚠ W4 – THE PRICE OF RESTING A KNOCK, and the whole reason `growWeek` gained this knob. She is
    // doing rehab and light hitting, not training, so the week earns KNOCK_REST_GROWTH of what it
    // would have. Expressed HERE as a multiplier on the week rather than as a lower `plan.train`
    // because `trainFactor` clamps below 60 – a career already on Light would otherwise have rested
    // for free, which is the farming hole this shape closes (knock.ts, note (a)).
    loadFactor: knockRestWeek(world.knock, world.week) ? KNOCK_REST_GROWTH : 1,
  })

  // 3c. W4 – AND SHE CAME OFF COURT SORE. Deliberately LAST of the things that happen to her body,
  //     and after `growWeek`: the week's work is done and banked, and the knock is what she is left
  //     with on the Friday. Anything earlier would read as a knock she then trained through anyway.
  //
  //     ZERO main-stream draws – `drawKnock` reads `seed:knock:<week>`, its own per-week sub-stream,
  //     exactly as `rollInjury` reads `seed:injury:<week>` – so the frozen capture (41550 /
  //     e6b0c709) cannot move. `ordinaryTrainingWeek` also rules out every week with a pending
  //     tournament, so a knock can never arrive on a week the reveal flow still owns.
  rollKnock(world)

  // 3d. AND SHE HAS A BIRTHDAY. The owner, 30.07: the birth month should show up in the notes.
  //
  //     ONE WEEK A YEAR, and it is the first thing in the game that says her birth month out loud. The
  //     player picks it in onboarding and until now it fed one cosmetic line on screen C - so the number
  //     deciding her whole relative-age story was invisible. Now the week it names stops and says so.
  //     ZERO DRAWS: a calendar comparison. Placed after `rollKnock` so a birthday week that also carries
  //     a knock reads in the order it happened - she came off court sore, and it was her birthday.
  markBirthday(world)

  // 4. canonical AI tournaments for ALL scheduled events. ZERO main-stream draws: each event's
  //    bracket runs on its own `seed:aitour:<event.id>` stream, so the calendar's SIZE no longer
  //    touches the weekly draw count. The main stream ends here carrying base costs + drift only.
  //
  //    ⚠ DRAW THE WHOLE WEEK, THEN RESOLVE IT, THEN PLAY IT (31.07 – «они физически не могут сразу
  //    везде играть, ведь так?»). It used to be one loop that drew and played each event in turn,
  //    which is why the same rival could be in two of a week's draws: each `selectEntrants` call saw
  //    the same condition map and nothing else about the week. The three phases below are the ONLY
  //    way to say "not twice" without touching a draw:
  //      4a. every event draws its field exactly as it always did – same stream, same order, same
  //          count. Safe to hoist because it always was independent of the brackets: `aiRanking` and
  //          `rivalFatigue` are snapshots taken above, `world.cohort` is read-only here, and
  //          `runAiTournament`'s ledger rows are never read back inside the same week. So phase 4a
  //          returns, event for event, precisely what the old loop's first line returned.
  //      4b. pure post-draw arithmetic on those arrays – higher tier keeps her, the loser backfills
  //          by standings position. ZERO draws on any stream (season/tournament.ts).
  //      4c. the brackets play, in the ORIGINAL calendar order and each on the very number of its
  //          own sub-stream it was going to read, so the ledger's row order is unchanged too.
  const weekDraws = scheduled.map((e) => drawAiEntrants(world, e, aiRanking, rivalFatigue))
  const weekFields = resolveDoubleBookings(weekDraws, world.cohort, aiRanking, rivalFatigue)
  for (const d of weekDraws) {
    runAiTournament(world, d.event, weekFields.get(d.event.id) ?? d.entrants, d.rng, rivalFatigue)
  }

  // 5-6. rank recompute + housekeeping. For a reveal week these are deferred to finalizeTournament
  //      (after the kid's points land), so the rank milestones keep their id order behind the kid's
  //      match/summary events. A normal week resolves them inline as before.
  if (!world.pendingTournament) {
    recomputeRankAndMilestones(world)
    housekeep(world)
    maybeFireSeasonWrapUp(world)
  }
}

// entries: moved to world/entries.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

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
  // ...and the academy's tally is handed back exactly what it was credited, never the brand's share
  // as well (see `academyCoverOf`): two payers, two ledgers, and a withdrawal must unwind each of
  // them by its own contribution.
  const covered = academyCoverOf(world, event)
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
  // ⚠ W4 – AND SO MUST AN UNANSWERED KNOCK. This line is the mechanical heart of the whole slice.
  //
  // The owner's complaint was that training weeks «просто скипались» – he pressed +4 and four weeks
  // of his daughter's life went past without asking him anything. Halting is not enough: a stop the
  // player can dismiss with one tap and then re-press is a notification, not a decision. So a knock
  // BLOCKS, on the identical contract `pendingTournament` has above – no tick at all until
  // `decideKnock` runs. Both branches of the dialog are valid answers, so this can never dead-end a
  // career (see KnockDialog: there is no third button and no way out that is not a choice).
  if (pendingKnock(world)) return ['knock']
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
    // W4: she came off court sore and the parent has to answer. The `break` below then ends the
    // advance, and the guard at the top of this function refuses to restart it until he has.
    if (pendingKnock(world)) stops.add('knock')
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


/** What he says when he would rather she skipped a trip. Three sentences, picked by HOW tired she is
 *  rather than by luck - a draw here would make the same coach say different things about the same
 *  Tuesday, and the card is re-derived on every snapshot. Player copy: short dash only.
 *
 *  The J300 line names the stake because that is the honest argument at the top of the ladder: the
 *  entry fee and the flights are real money, and a first-round exit spends them for nothing. */
function coachEntryLine(tier: TierId, condition: number): string {
  const floor = ECONOMY.availability.minConditionToEnter[tier]
  if (condition < floor - 5) return 'Your coach would not take her. She is empty.'
  if (condition < floor) return 'Your coach would skip this one and get her legs back.'
  return 'Your coach thinks she is a week short of her best for this.'
}

// --- snapshot ----------------------------------------------------------------

/** WHAT IS LEFT TO PLAY THIS SEASON, by rung - the planning counter (owner, 02.08: «мне кажется мы
 *  где-то можем сделать каунтер сколько доступных турниров и какого уровня у нас до конца года
 *  вообще осталось, это даст человеку возможность планировать»).
 *
 *  ⚠ IT IS NOT THE FEED, AND THAT IS THE POINT. `upcoming` is eight weeks long and passes through
 *  the two-type rule, so a player planning a season could see neither how much tennis remains nor
 *  which rungs it is on - the very thing that made an ordinary sparse tail read as "there is
 *  nothing left". This counts the WHOLE rest of the season and every rung the ENGINE opens to her,
 *  the rare ones included. Blank weeks are normal and expected (the owner: «пустые недели это
 *  нормально, она же не может постоянно играть» - roughly 20 events a year is one per fortnight,
 *  with more on offer than she can take); what a planner needs is the supply, so that resting is a
 *  choice she can see the cost of rather than a hole she fell into.
 *
 *  AVAILABLE means: ahead of this week, inside THIS season, entry list still open, and the engine's
 *  own gate says she may enter (`entryStatus` level != 'blocked' - a fatigue 'caution' is a week
 *  she can play, which is the same reading the boredom guard uses). Snapshot-only, derived, zero
 *  persistence and zero draws.
 *
 *  COST, MEASURED RATHER THAN ASSUMED (week 160, 60 calls): `toSnapshot` goes 11.3 -> 15.3 ms, so
 *  this asks the entry gate about ~40 events for ~4 ms. Paid once per command rather than per week
 *  of a fast-forward's inner loop, which is why the honest per-event gate is affordable here at
 *  all - and why it is asked about the EVENT's week (an injury layoff covering it) rather than
 *  today's condition, which by then will be whatever the player decides between now and then. */
function seasonSupply(world: WorldState): SeasonSupply {
  const entered = new Set(world.entries)
  const lastWeek = seasonLastWeek(world.week)
  const byTier = new Map<TierId, { open: number; entered: number }>()
  for (const e of world.season) {
    if (e.week <= world.week || e.week > lastWeek) continue
    const isEntered = entered.has(e.id)
    // An entry already made is hers whatever the gate says now (R10-3: a committed week survives a
    // band crossing), so it is counted before the gate is asked.
    if (!isEntered) {
      if (world.week > e.deadlineWeek) continue
      if (entryStatus(world, e).level === 'blocked') continue
    }
    const row = byTier.get(e.tier) ?? { open: 0, entered: 0 }
    row.open += 1
    if (isEntered) row.entered += 1
    byTier.set(e.tier, row)
  }
  return {
    weeksLeft: Math.max(0, lastWeek - world.week),
    // Ladder order, strongest last, the one order every other surface reads (TIER_LADDER).
    rows: TIER_LADDER.filter((t) => byTier.has(t)).map((tier) => ({ tier, ...byTier.get(tier)! })),
  }
}

function upcomingEvents(world: WorldState): UpcomingEvent[] {
  const entered = new Set(world.entries)
  // The Season card's preview needs the standings and her match build ONCE for the whole list, not
  // once per card: both are the same for every event in the window, and rebuilding them per event
  // would be the expensive half of this function. Surface-specific scaling still happens per event
  // inside the preview, which is where it belongs.
  const ranking = fullRanking(world)
  // ...and the W cards get the W world (living-field phase W, 01.08). A W-track preview must draw
  // from the population its bracket will actually be made of – LIVE cohort ∪ field pros, positioned
  // by the merged W standings – or the card would name a junior the professional draw does not
  // contain. Same lazy-once shape as `ranking` above, paid only on windows that actually show a W
  // card; `previewEvent`'s own contract is untouched, it is simply handed the professional
  // universe as the cohort (the parameter always WAS "who can be drawn").
  let wtaCtx: { universe: AiPlayer[]; ranking: RankingRow[]; conditions: Map<string, number> } | null = null
  const wtaWorldFor = (e: SeasonEvent) => {
    wtaCtx ??= {
      universe: universeForTier(e.tier, world.cohort, fieldProsOf(world)),
      ranking: rankingFor(world, 'wta'),
      conditions: rivalConditions(world.results, world.week),
    }
    return { seed: world.seed, week: world.week, cohort: wtaCtx.universe, results: world.results }
  }
  // ...and the card obeys the same week-exclusivity rule its own bracket will (W2-FIELD2 §8.2), or
  // it would name an opponent the higher rung has already taken. Computed HERE because only this
  // function holds `world.season`; `previewEvent`'s own contract stays a single event's worth of
  // inputs. Lazy per card and only on the W track — a J or domestic card never asks.
  const wtaExclusionFor = (e: SeasonEvent) =>
    weekFieldExclusion(e, world.season, wtaCtx!.universe, wtaCtx!.ranking, world.seed, wtaCtx!.conditions)
  // ...and the same argument for the COACH'S READ OF HER: it is one girl in one week, identical for
  // every card, and `coachLoadViewOf` walks the retained match window to get there. Once per snapshot,
  // null on a self-coached career because there is nobody to have an opinion.
  const coachTier = tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId))
  const coachLoad = coachManagesLoad(coachTier) ? coachLoadViewOf(world) : null
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
      // THE HIRED COACH'S OPINION on this trip (load slice §8). Independent of the gate above: he can
      // speak on an 'ok' card (his margin is scaled by what he believes about her stamina, so a good
      // one warns BEFORE the fatigue rule does) and he can stay quiet on a 'caution' one (a cheap coach
      // who thinks she is tough). That gap is the thing being sold, so the two are never merged.
      //
      // Computed here rather than inside `entryStatus` deliberately: `entryStatus` is the ENGINE's
      // verdict on whether she may enter, and this changes no verdict at all. It is somebody's view.
      //
      // ⚠ AND ONLY ON A CARD SHE COULD ACTUALLY ENTER. A test caught this: the advice was being attached to
      // HARD-BLOCKED cards too - a tier she has no points for, an exam week, a season whose entry cap she
      // has spent - so a coach was giving his view on a tournament that is not on offer. Worse, it made
      // "the advice never locks a card" unverifiable, because the card was already locked for its own
      // reasons and the two were indistinguishable on screen. He speaks about trips she can take.
      const coachSay =
        gate.level !== 'blocked' &&
        coachLoad !== null &&
        coachWarnsEntry(coachLoad, ECONOMY.availability.minConditionToEnter[e.tier])
          ? { coachCaution: coachEntryLine(e.tier, world.condition) }
          : {}
      return {
        id: e.id,
        week: e.week,
        tier: e.tier,
        surface: e.surface,
        // What the Season card can honestly say before she plays: her odds in round one against
        // the field as it stands TODAY, how strong that field is, and the (decorative) weather.
        // See season/preview.ts for what this estimate does and does not claim.
        preview:
          TIERS[e.tier].track === 'wta'
            ? previewEvent(
                wtaWorldFor(e),
                e,
                wtaCtx!.ranking,
                kidMatchPlayerFor(world, e.surface),
                wtaExclusionFor(e),
              )
            : previewEvent(world, e, ranking, kidMatchPlayerFor(world, e.surface)),
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
        ...coachSay,
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
  // The slice is the TRACK's window width (W2-LADDER §3): sixteen rows on the professional list,
  // six on the others - the list's sum must equal the rank beside it, and the rank counts best-N.
  return world.results.filter(inTrack(track))
    .filter(
      (r) =>
        isCountingResult(r) &&
        r.playerId === KID_ID &&
        r.week <= world.week &&
        world.week - r.week <= RESULTS_WINDOW,
    )
    .sort((a, b) => b.points - a.points || b.week - a.week)
    .slice(0, BEST_N_BY_TRACK[track])
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
/** HER PLACE IN ONE TABLE, or null when she holds no counting result in it.
 *
 *  ⚠ ONE IMPLEMENTATION, TWO CONSUMERS, and the second one is why it was extracted (31.07): the
 *  tournament overlay prints her rank too, and it must print the SAME number the Home chip and the
 *  Stats tab are showing at that moment or the app contradicts itself on the one screen where the
 *  player is looking hardest. That is not automatic - on a reveal week the tick DEFERS the rank
 *  recompute to `finalizeTournament` (see step 5) while the week's AI results are already in the
 *  ledger, so a freshly-folded rank and the cached one legitimately differ by a place or two until
 *  she finishes her run. Reading the cache through one function is what makes the two agree by
 *  construction instead of by coincidence. */
function kidLadderRank(world: WorldState, track: LadderTrack): number | null {
  return computeCountingResults(world, track).length > 0 ? rankIn(world, track) : null
}

function computeLadderView(world: WorldState, track: LadderTrack): LadderView {
  const counting = computeCountingResults(world, track)
  return {
    // Her place a week ago IN THIS TABLE - see `prevKidRankDomestic` on WorldState for why both are
    // carried rather than one shared "previous rank".
    prevRank: prevRankIn(world, track),
    // UNRANKED IS NOT A NUMBER. With nobody holding a point the whole field ties at zero and
    // competition ranking hands every member of that tie the same place, so a point-less kid reads
    // as a single digit. The screens have always papered over that by asking `countingResults.length
    // > 0` themselves; making it null HERE means they cannot forget, and the two questions ("where
    // is she?" and "is she ranked at all?") stop being one field.
    rank: kidLadderRank(world, track),
    points: kidPoints(world, track),
    standings: computeStandings(world, track),
    countingResults: counting,
  }
}

/** Her cached place in `track`. The caches are the authority (one writer - see recomputeKidRank), so
 *  this reads them rather than re-folding, which is what keeps a snapshot from disagreeing with the

/** HAS A W RESULT EVER COUNTED - the permanent half of `activeLadderOf`'s professional arm.
 *
 *  ⚠ THE EVIDENCE FOR "EVER" CANNOT BE THE RESULTS LEDGER: `world.results` is pruned to the 52-week
 *  window (RESULTS_WINDOW), so a pro on a long layoff would watch her own debut delete itself. The
 *  v34 migration solved the identical problem for the on-ramp latches with `bestFinishByTier` - a
 *  high-water mark written at tournament finalize and NEVER pruned - and this reads the same mark:
 *  a recorded finish whose points-table row pays > 0 was a counting result the week it landed
 *  (`isCountingResult` IS `points > 0`), and the table is monotone non-increasing, so the BEST
 *  finish paying zero means every finish did. Exact, for every save, however long ago it happened -
 *  no new persisted field, no schema bump. */
function wtaEverCounted(world: WorldState): boolean {
  return (Object.keys(world.bestFinishByTier) as TierId[]).some((tier) => {
    const finish = world.bestFinishByTier[tier]
    return finish !== undefined && TIERS[tier].track === 'wta' && TIERS[tier].points[finish] > 0
  })
}

/** WHICH TABLE IS SHE ACTUALLY COMPETING IN - one rule, one place, so Home, Stats and the Kid screen
 *  cannot answer it three ways.
 *
 *  docs/specs/two-ladders.md, "Which rank is her rank": the ITF one once she has it, because that is
 *  the table the international rungs open on and the one the game is about. Before her first counting
 *  ITF result she is unranked internationally and the screens show her national standing instead.
 *  "That is the real shape of a junior career, and the moment the first ITF point lands is a beat
 *  worth having."
 *
 *  ⚠ THE PROFESSIONAL ARM IS A ONE-WAY DOOR (architect's ruling, 02.08, on the owner's «для тех кому
 *  актуально уже и мировую можно показывать, она с ней до конца игры будет»). Her first counting
 *  W-series result makes the professional table her table TO THE END OF THE GAME - it never falls
 *  back to 'itf'/'domestic' when the 52-week window later empties, which is why the arm reads the
 *  never-pruned mark (`wtaEverCounted`) and not the live window alone. The junior arm stays a live
 *  read on purpose: J is a stage she passes through, the paid tour is where the story ends. The
 *  live `kidPoints` OR is the latchOnRamps discipline - the fresh fact answers correctly on its
 *  own, the memory only ever adds, so no caller is order-sensitive on when finalize last ran. */
export function activeLadderOf(world: WorldState): LadderTrack {
  if (wtaEverCounted(world) || kidPoints(world, 'wta') > 0) return 'wta'
  return kidPoints(world, 'itf') > 0 ? 'itf' : 'domestic'
}

function computeStandings(world: WorldState, track: LadderTrack = 'itf'): StandingRow[] {
  const full = rankingFor(world, track)
  const meta = new Map<string, { name: string; nation: string }>()
  for (const p of world.cohort) meta.set(p.id, { name: p.name, nation: p.nation })
  // The W table's virtual rows carry real names and flags too (living-field phase W, 01.08) – the
  // fallback below would otherwise print "fp-141" the day the Stats screen grows its World Tour
  // tab. The table itself stays windowed exactly as every table always was (top 10 + around the
  // kid, built a few lines down), so ~500 rows cost the snapshot nothing.
  if (track === 'wta') for (const p of fieldProsOf(world)) meta.set(p.id, { name: p.name, nation: p.nation })
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
// Field pros resolve through the same derivation that drew them (living-field phase W, 01.08):
// the id encodes nothing, but fieldProsOf is season-stable and memoised, so a W draw's full
// bracket names its professionals as cheaply as the cohort array names the juniors.
function playerShortName(world: WorldState, id: string): string {
  if (id === KID_ID) return formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  if (isFieldProId(id)) {
    const fp = fieldProsOf(world).find((p) => p.id === id)
    return formatShortName(fp?.name ?? id)
  }
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
  // ⚠ THE TABLE THIS TOURNAMENT IS ACTUALLY PLAYED ON – see `PendingView.ladder` for the owner's
  // report and what it cost. This line used to read `fullRanking(world)`, whose doc comment says
  // outright "THE table when only one is meant: the ITF one", so every rank the tournament overlay
  // printed came from the international table even when the trophy on the table paid national points.
  const track = tier.track
  const ranks = new Map(rankingFor(world, track).map((r) => [r.playerId, r.rank]))
  const oppNation = world.cohort.find((c) => c.id === oppId)?.nation ?? ''
  const kidFinish = p.result.finishes[KID_ID] ?? Math.log2(tier.drawSize)
  // UNRANKED IS NOT A NUMBER, for either girl, and it is the same rule `computeLadderView` applies to
  // the kid: with nobody holding a point in this table the whole field ties at zero and competition
  // ranking hands every member of that tie the same place. Asked of the OPPONENT too, because the two
  // numbers sit side by side on the VS card and a real "#3" against a tie-floor "#119" invites a
  // comparison that is not there.
  //
  // ⚠ TWO SOURCES, DELIBERATELY, AND THE ASYMMETRY IS THE CONSERVATIVE CHOICE. HER number comes
  // through `kidLadderRank`, i.e. off the same cache `ladders[track].rank` reads, so the overlay can
  // never print a different place for her than the screens behind it - the exact failure this branch
  // is about. The OPPONENT's is folded here because nothing caches it and nothing else prints it, so
  // it has nothing to disagree with. On a reveal week the two can be a place apart (the tick defers
  // the rank recompute to `finalizeTournament` while the week's AI results are already banked); a
  // one-place drift between two different players' numbers is invisible, whereas a drift in HERS
  // between two screens is the bug.
  // A FIELD PRO IS ALWAYS RANKED (living-field phase W, 01.08): her points are virtual, so the
  // ledger fold below would read 0 and print her "unranked" – on the very row the merged table
  // ranks her by. The earned-points guard exists to stop TIE-FLOOR ranks being printed for players
  // with nothing; a pro's standing row is never that, by construction (wtaPoints >= 1).
  const oppRankIn = (id: string): number | null =>
    isFieldProId(id) || windowedBestSum(world.results, world.week, id, BEST_N_BY_TRACK[track], inTrack(track)) > 0
      ? (ranks.get(id) ?? null)
      : null

  return {
    eventId: p.eventId,
    tier: event.tier,
    surface: event.surface,
    // The weather plate on the live match. Same function the Season card quotes, so one tournament
    // has one day. VIEW ASSEMBLY ONLY - see the grep guard in tests/preview.test.ts.
    temperatureC: eventTemperature(world.seed, event),
    roundLabel: stageLabel(current.round, tier.drawSize),
    ladder: track,
    kidRank: kidLadderRank(world, track),
    opponent: {
      name: formatShortName((p.players[oppId] ?? fallbackPlayer(oppId)).name),
      nation: oppNation,
      rank: oppRankIn(oppId),
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
    // ⚠ HER LADDER, NOT THE INTERNATIONAL ONE (31.07, fix/ladder-separation). This pair feeds exactly
    // one derivation - `rankClimbed` - and `rankClimbed` licenses three lines that say she "moved up
    // the table" plus the loss softener behind her face. It was `world.kidRank` / `world.prevKidRank`,
    // the ITF pair, on a career that is domestic for its whole first year or two: so "she moved up the
    // table" was a claim about a table she is not in, and the movement it read was mostly the tie floor
    // drifting as OTHER players' international results aged out of their 52-week windows. R13-2 already
    // fought this exact battle once - it added the `runPointsThisWeek > 0` licence because "rank is
    // RELATIVE, so she can climb on a zero-point week purely because rivals' results decayed ... other
    // people's ageing calendars, not her tennis" - and the earned-points guard cannot do its job while
    // the points are counted in one table and the climb read off the other.
    //
    // `activeLadderOf` is the same one answer Home's chip, the Kid screen and Stats all read.
    kidRank: rankIn(world, activeLadderOf(world)),
    prevKidRank: prevRankIn(world, activeLadderOf(world)),
    pendingUnfinished: world.pendingTournament !== null && !world.pendingTournament.finished,
    // R13-2: the points her run AWARDED this week. finalizeTournament writes a kid row only when
    // points > 0, so a first-round exit leaves none – "> 0" is exactly "she won matches this
    // week", the licence behind the earned-climb softener and the good-loss diary lines.
    runPointsThisWeek: world.results
      .filter((r) => r.playerId === KID_ID && r.week === world.week)
      .reduce((s, r) => s + r.points, 0),
    milestones: world.milestones,
    vacationWeek: vacationForWeek(world, world.week) !== undefined,
    // W5: ...and WHICH holiday, for the frame that names it. The booking is still on file when its
    // story is told - `prunePlannerBookings` keeps four trailing weeks - and null on every other week.
    vacationPackageId: vacationForWeek(world, world.week)?.packageId ?? null,
    // W2: how hard the PLAYER worked her this week – the one fact about a training week that is his
    // decision rather than the world's, and the subject of the ordinary week's note.
    trainPct: world.plan.train,
    // W4: ...and the OTHER decision of his the week can be about. Read off the live knock only – an
    // undecided one is not doing anything to the week yet, it is stopping it, so `plainTraining` must
    // still hold for the week the knock arrived in (its note is about the training that caused it).
    //
    // ⚠ W6 MADE THAT SENTENCE TRUE. It was the intent and it only held while the knock was UNANSWERED:
    // the instant he chose, `knockLive` was already true on the ARRIVAL week, so week N's own story
    // started describing a decision that governs week N+1 – she was drawn at home, and captioned «A week
    // off the ankle», about a week she spent on court. `knockGoverns` is the same window the tick
    // actually charges (see its note: growWeek at 3b, rollKnock at 3c), so the frame and the words now
    // agree with the arithmetic instead of with each other.
    // ...and the one week a year that is about HER rather than about tennis.
    birthdayAge: birthdayTurning(world.week, world.profile.birthMonth, world.profile.birthDay),
    knockChoice: knockGoverns(world.knock, world.week) ? world.knock!.choice : null,
    knockPart: knockGoverns(world.knock, world.week) ? world.knock!.part : null,
  })
  // THE SKILLS RADAR'S VIEW OF HER, assembled ONCE and read twice - by the contour (`buildRadar`)
  // and by the Weekly Story's training line (`buildTrainingRead`). Hoisted rather than inlined
  // because the two readings MUST see the same girl: a second literal here would be a second place
  // for "which matches count" to drift, and the card and the radar would then disagree about how
  // much anybody can see, on the same screen, in the same week.
  const radarView = radarViewOf(world)
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
    // W4: the knock, and the question it is asking. Both DERIVED (the prompt's copy is assembled per
    // snapshot off `seed:knockread:<sinceWeek>`, its own sub-stream); only `world.knock` itself is
    // persisted, and only because `choice` is the player's decision.
    //
    // `knockPrompt` is non-null on exactly the weeks `pendingKnock` is true – the same predicate
    // `advanceWeeks` blocks on – so the dialog cannot be missing on a week the engine has stopped,
    // and cannot be up on a week it has not.
    knock: knockLive(world.knock, world.week) ? world.knock : null,
    knockPrompt: pendingKnock(world) ? buildKnockPrompt(world.knock!, world.seed, world.condition) : null,
    events: world.events.slice(-SNAPSHOT_EVENTS),
    // ⚠ THE DURABLE LEDGER, WHOLE, and it is here because the 60-event window above is exactly the
    // wrong source for it. Milestone EVENTS carry `keep: true` so they survive `pruneEvents` in the
    // world - but `slice(-60)` is positional, so a first title from four seasons ago falls out of the
    // SNAPSHOT the moment sixty newer rows exist, which is a couple of months of play. The Kid
    // screen's moments strip was reading the feed and therefore emptied itself permanently (owner,
    // 31.07: «в Important moments на экране профиля девочки вообще ничего не происходит»); its own
    // source comment had already diagnosed this and filed the fix as "a small engine ask" rather than
    // doing it. This is that ask. `world.milestones` is v18 state and never prunes, it is capped by
    // identity rather than by count (one row per first), and it is tiny - so it ships whole and no
    // surface has to reconstruct a durable fact from a volatile window ever again.
    milestones: world.milestones,
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
    seasonSupply: seasonSupply(world),
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
    // ...and the PRO allowance beside it (W2-LADDER §5): the planner prints the budget («pro
    // entries this season: N of M») and the tier ladder tells "capped" apart from "locked", both
    // off the engine's own count.
    proEntryCap: proEntryCapUsage(world, world.week),
    // THE ENGINE'S OWN VERDICT PER RUNG (see TierOpenMap in protocol.ts). `tierOpenFor` is the same
    // function `enterEvent` validates against, so a screen can no longer disagree with the gate.
    tierOpen: Object.fromEntries(TIER_LADDER.map((t) => [t, tierOpenFor(world, t)])) as TierOpenMap,
    // ...AND THE POSITION EACH ACCEPTANCE LIST CUTS AT, for the rungs that have one. Same discipline
    // as `tierOpen` directly above: the screen asks the engine for the number rather than deriving a
    // share of a field it would have to be told the size of. Absent on every rung that gates on
    // points, which is what `acceptanceRank` returning undefined means.
    tierAcceptance: Object.fromEntries(
      TIER_LADDER.map((t) => [t, acceptanceRank(world, t)]).filter(([, r]) => r !== undefined),
    ) as Partial<Record<TierId, number>>,
    // R15-9: THE ON-RAMP LATCHES, read-only, for the SLIDING TIER WINDOW - the calendar hides the
    // rungs a latch says she has definitively left behind (a copy, like every object on this
    // message: the snapshot must never be a live view of engine state). Surfacing widens the
    // snapshot only; the persisted v34 field and the entry gates are untouched.
    onRampCleared: { ...world.onRampCleared },
    coachId: world.coachId,
    coachMarket: coachMarket(world),
    coachBilling: coachBilling(world),
    kidRank: world.kidRank,
    prevKidRank: world.prevKidRank,
    standings: computeStandings(world),
    countingResults: computeCountingResults(world),
    // ALL THREE TABLES, and which one she is actually competing in. `kidRank`/`standings`/
    // `countingResults` above are the ITF ones and stay as aliases of `ladders.itf` so nothing that
    // reads them has to change; the pairing is pinned by a test, because two names for one fact is
    // how this bug started.
    //
    // THE THIRD IS BUILT EXACTLY LIKE THE OTHER TWO – same call, same argument, no special case –
    // which is the whole reason `LadderTrack` was widened rather than the adult rungs folded into
    // `itf`. Nothing here decides whether the player SEES it: the Stats and rank-help screens still
    // list two tabs by hand, because a fourteen-year-old with an empty professional table is noise
    // and the week it stops being noise is the handover at 19 (docs/specs/adult-tour-and-endings.md
    // §4), which is a slice of its own. The view exists and is correct from week 0 regardless.
    ladders: {
      domestic: computeLadderView(world, 'domestic'),
      itf: computeLadderView(world, 'itf'),
      wta: computeLadderView(world, 'wta'),
    },
    activeLadder: activeLadderOf(world),
    bestFinishByTier: { ...world.bestFinishByTier },
    // v31: THE CABINET. Copied a level deeper than its neighbour above, because its values are
    // arrays and a shallow spread would hand the UI the engine's own `titles`/`finals` - the same
    // objects `finalizeTournament` pushes onto. The snapshot is a message across the worker
    // boundary and must never be a live view of engine state.
    trophiesByTier: copyTrophyLedger(world),
    // v32: THE INBOX, copied one level deep for the same reason the cabinet above is - the snapshot
    // crosses the worker boundary and must never be a live view of engine state. `terms` is copied
    // too, because a screen holding the engine's own terms object could mutate the contract it is
    // rendering. (`Offer` is flat apart from `terms`, so two spreads is the whole of it.)
    offers: world.offers.map((o) => ({ ...o, terms: { ...o.terms } })),
    // ...AND THE DOT, DECIDED HERE. It asserts one FACT - an offer is open and its deadline has not
    // passed - exactly as the bell's dot asserts that the week put something in the feed. It is never
    // "unread": the engine cannot know what the player has looked at, and neither can this.
    offerOpen: hasLiveOffer(world.offers, world.week),
    // Round-8 (R6 debt): the running season W-L counters, already persisted since v10 –
    // surfacing them is derivation, not schema. THE TOTAL, both ladders; `seasonRecord` below is the
    // same matches told apart, and the two always agree because finalizeTournament writes both.
    seasonWins: world.seasonWins,
    seasonLosses: world.seasonLosses,
    seasonRecord: world.seasonRecord ?? emptySeasonRecord(),
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
