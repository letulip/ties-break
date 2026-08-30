// THE GATES: condition, the doctor's veto, the layoff, and whether she may enter at all.
//
// One module because they are one decision with several answers, ranked: injury > too-young >
// capped > unavailable > medical > fatigued. `availabilityStatus`, `entryStatus` and
// `arrivalStatus` are three questions about the same body on the same week, and they are wired at
// three engine surfaces (enterEvent / upcomingEvents / advanceWeeks) precisely so the gate cannot
// desync between them.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. Everything this file needs at runtime comes from
// SIBLING leaves – ledger, age, entryCaps, ladder, bookings – plus the engine leaf offers.ts
// (ad step 2's shoot-week read) – which is what made the cut clean:
// measured at 11 call-backs into world.ts before those landed, 0 after.
//
// ⚠ RNG: nothing here draws. These are pure reads over persisted state plus the ECONOMY knobs, so
// the frozen MAIN capture cannot notice this file.
import { ECONOMY } from '../economy'
import { clamp } from '../condition'
import { TIERS, isBlackoutWeek, isJuniorAge, isOffSeasonWeek, tierAgeBlock } from '../season/calendar'
import { schoolIsOver } from '../kidLife'
import type { LadderTrack, SeasonEvent, TierId } from '../season/types'
import { LADDER_LABEL, LADDER_POINTS_LABEL, type EntryCapUsage } from '../../shared/protocol'
// ⭐ THE LONG GOODBYE §4a: her body as one number, and the continuous age `declineFactor` reads.
// `development.ts` is an engine LEAF (rng / economy / coach / plan / protocol / dates – no world.ts
// edge), which is the same reason world/endings.ts imports `physicalMean` from it for the ending's
// own share. The dependency direction in this file's header is unchanged.
import { physicalMean } from '../development'
import { kidAgeAt, kidAgeExact } from './age'
import { alternateListPlace } from './ladder'
import {
  entryCapUsage,
  proEntryCapUsage,
  proSubCapRefusalDetail,
  proSubCapUsage,
  isCappedTier,
  isCappedProTier,
  acceleratorRefusalDetail,
  acceleratorUsage,
  juniorReservedRank,
} from './entryCaps'
import {
  acceptanceRank,
  activeLadderOf,
  hasOutgrown,
  juniorAccessOpen,
  juniorReservedPlace,
  homeWildCardPlace,
  kidPoints,
  onRampOpen,
  playDownBars,
  playDownRefusalDetail,
  rankIn,
  tableSize,
  yearEndJuniorRank,
} from './ladder'
import { vacationForWeek, practiceForWeek, vacationBlackoutDetail } from './bookings'
import { masseurRungOf, masseurWorksThisWeek } from './masseur'
// ⚠ ROUND 29 #5 – the LEAF and never `./shop`: this file is imported by `./entries`, `entries` by
// `./endings` and `endings` by `world/shop.ts`, so a value import of the shop from here would close
// a cycle. `world/assets.ts` exists for exactly this and imports nothing from this package.
import { ownsDeliveredOfFamily } from './assets'
// ⭐ Ad step 2 (§4a): the one question the recovery ladder asks the signed endorsement – is this a
// shoot week? `offers.ts` is an engine LEAF (it reaches only economy/rng/calendar/world-ledger), so
// the edge runs the same direction as every other import in this file.
import { adShootWeek } from '../offers'
// ⭐ ROUND 29 #3: the week's own length, for the clash price the owner named per DAY. `plan.ts` is a
// leaf below this one (it reaches only shared/protocol), so the edge runs the same direction as the
// import above it – and the alternative was a literal 7 beside a rate, which is the shape a retune
// walks past.
import { PLAN_DAYS } from '../plan'
import { isSuspendedAt, suspensionWeeksLeft } from './mandatory'
import type { WorldState } from '../world'

// --- Season-Life: condition + availability gate (slice B) --------------------
// The condition MATH (clamp / matchDrain / tournamentRunStrain / conditionMatchFactor) and the
// week-TYPE predicates (isExamWeek / isBlackoutWeek) were extracted to ./condition and
// ./season/calendar by the rival-life slice, so the AI cohort can run the SAME rules without a
// world.ts import cycle. They are re-exported here under their historical names – every existing
// call site and test import keeps working, and there is still exactly one implementation.

/** The train/rest slider's recovery bonus for a MATCH-FREE week (round-9 owner redesign):
 *  threshold-based on plan.rest, first (highest) matching threshold wins, never interpolated –
 *  the 60/40 preset earns +2, 75/25 earns +1, the 85/15 grind earns 0. Pure, integer. */
export function restRecoveryBonus(restPercent: number): number {
  for (const { minRest, bonus } of ECONOMY.condition.restRecoveryBonus) {
    if (restPercent >= minRest) return bonus
  }
  return 0
}

/** ⭐ THE BASE A WEEK RETURNS, BY CAREER PHASE (owner 22.08, the recovery question's variant C –
 *  docs/specs/the-masseur-2026-08.md §10-11). The professional grind recovers on
 *  `proPhaseRecoveryBase` (5); the junior era – and every rival, who reads the constant directly
 *  in season/rival.ts – keeps `recoveryBase` (8). The boundary is the masseur's own unlock gate,
 *  `activeLadderOf === 'wta'`: her first counting W-series result on the never-pruned mark, a
 *  one-way door, so the base can never flap back mid-career.
 *
 *  ⚠ ONE HELPER, TWO READERS IN THIS FILE, BY CONSTRUCTION: `accrueCondition` below plus
 *  `withheldFreeWeekRecovery`, which is the one oracle the three refund sites read (the two 18.08
 *  makeup expressions in world.ts – the medical-withdrawal arm and `skipEvent` – plus planner.ts's
 *  practice cancellation; the round-25 collect folded them into it, so this header's old «three
 *  readers in world.ts» wording named the shape before that merge). The makeups hand back «what a
 *  non-playing week pays», so they MUST pay the same phase's base or the doctor's veto becomes worth
 *  3 condition more than an ordinary week in the pro era. Pure read, zero draws.
 *
 *  ⭐⭐⭐ AND FROM `declineStart` IT FADES WITH HER BODY (the long goodbye §4a, his own addition on
 *  26.08: «для концовок и возраста предлагаю еще уменьшать недельное восстановление после матчей,
 *  т.е. и физика будет падать и восстанавливаться будет дольше»). The base is multiplied by the
 *  share of her own peak physical she has left – v62's stored `peakPhysical` against today's
 *  `physicalMean`, the SAME ratio §3a's ending trigger reads – floored at
 *  `ECONOMY.condition.recoveryAgeFloor`. 5.00 at 29, 4.46 at 33, 3.45 at 38, 2.79 at 41, 2.50 from
 *  ~43 where the floor first bites.
 *
 *  ⚠⚠ THE FADE GOES HERE PRECISELY SO THAT BOTH READERS INHERIT IT. A slower rest week that the
 *  medical withdrawal then refunded at the un-faded rate would make the doctor's veto worth MORE
 *  than an ordinary week in exactly the years this is about – the same incoherence the 22.08 phase
 *  split had to close, one step further on. `withheldFreeWeekRecovery` carries the faded base on
 *  both sides of its practice arm, so a friendly still forfeits only the slider.
 *
 *  ⚠ THE JUNIOR ERA CANNOT MOVE, AND IT IS THE AGE GATE THAT GUARANTEES IT RATHER THAN THE RATIO.
 *  The share is not identically 1 before the peak: a rested knock lowers `skills` while the running
 *  maximum keeps the number the good week earned, so a fifteen-year-old with a sore shoulder reads
 *  below 1 for a few weeks. Multiplying by that would slow the junior recovery, and the junior
 *  benches are pinned reference tables where a drift is invisible (fatigue-reprice-2026-08.md §5).
 *  So: below `declineStart` the multiplier is exactly 1, by construction and not by arithmetic.
 *
 *  ⚠ `kidAgeExact` AND NOT `kidAgeAt`, because `declineFactor` reads the continuous age and
 *  `growWeek` hands it `kidAgeExact` (world/phaseGrowth.ts). Two clocks here would open a gap of up
 *  to a year in which her body is falling and her recovery is not.
 *
 *  ⚠ RIVALS ARE UNTOUCHED and must stay so: season/rival.ts:185 reads `c.recoveryBase` directly, not
 *  this helper. Field-pro ageing is its own backlog item and is not this spec's.
 *
 *  ⚠ FRACTIONAL ON PURPOSE (owner 26.08: «у нас в логике могут быть дробные числа – это окей, а у
 *  пользователя целые в интерфейсе»). The engine keeps the fraction and it keeps falling; the
 *  rounding happens ONCE, where a number crosses into `Snapshot` for a person to read – see
 *  world/snapshot.ts. Quantising the mechanic would deliver the fade as three visible jumps instead
 *  of a slope, which is the opposite of what §4a is for. Still zero draws: a division. */
export function recoveryBaseFor(world: WorldState): number {
  const base = activeLadderOf(world) === 'wta' ? ECONOMY.condition.proPhaseRecoveryBase : ECONOMY.condition.recoveryBase
  return base * recoveryAgeFade(world)
}

/** THE MULTIPLIER ABOVE, ALONE – 1 through the whole junior era and the whole pre-peak career, then
 *  the share of her own peak physical that is left, floored at `recoveryAgeFloor`.
 *
 *  Exported because the fade is a claim about a career and the tests have to be able to state it at
 *  an age without walking `accrueCondition` a thousand times to infer it. Pure read, zero draws. */
export function recoveryAgeFade(world: WorldState): number {
  const age = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
  if (age < ECONOMY.development.ageCurve.declineStart) return 1
  const share = physicalMean(world.skills) / world.peakPhysical
  return Math.max(ECONOMY.condition.recoveryAgeFloor, share)
}

/** ⭐ AD STEP 2 (§4a): IS A SHOOT WEEK IN FORCE – the signed endorsement's named week, outside the
 *  college freeze? ONE predicate, read by the accumulator below AND by every withheld-recovery
 *  refund (`withheldFreeWeekRecovery`), so the charge and its refunds can never disagree about
 *  what kind of week this was.
 *
 *  ⚠ THE FREEZE HALF IS `inCollege`'s own comparison INLINED, not a second opinion:
 *  `world/college.ts` is the middle of the package and this file is a gate leaf (see the header's
 *  dependency note – the same reason `guardNotEnded` in world/constants.ts reads `ending.type`
 *  instead of importing it). A shoot week the freeze swallows lapses silently – no penalty, no
 *  makeup week («мы ни за что не наказываем», plan §4c). Pure read, zero draws.
 *
 *  ⚠ ROUND 29 #3 WIDENED IT TO TAKE A WEEK, DEFAULTING TO THE CURRENT ONE – a widening, not a
 *  second opinion. The shoot/tournament collision is raised the week BEFORE it lands (that is the
 *  only week on which withdrawing an entry or moving a shoot is still possible), so it has to ask
 *  this question about `world.week + 1`. Every existing caller passes nothing and is byte-identical.
 */
export function adShootHolds(world: WorldState, week: number = world.week): boolean {
  const atCollege = world.college !== null && week < world.college.untilWeek
  return !atCollege && adShootWeek(world.offers, week)
}

/** THE WITHHELD RECOVERY, OWED WHEN A "PLAYING" WEEK ENDS MATCH-FREE – the one oracle behind the
 *  three refund sites (the medical withdrawal and `skipEvent` in world.ts, the practice medical
 *  cancellation in planner.ts). `accrueCondition` pays a week believing she will play; when the
 *  match then never happens, the difference between the MATCH-FREE figure and what was banked is
 *  handed back, "the week resolves as a normal non-playing week" (owner 18.08: «она и в одном
 *  случае не играла и в другом»).
 *
 *  ⭐ AND IT IS SHOOT-AWARE, which is why it is a function and not three inline expressions any
 *  more: on a shoot week the match-free figure IS the travel figure (§4a – the week recovers like
 *  a trip whatever else it holds), and `accrueCondition` already banked exactly that, so NOTHING
 *  is owed. Without this the refund paths quietly handed a shoot week its rest back – measured
 *  live by tools/ad-shoot-bench.ts's first draft: a medically-withdrawn entry on a shoot week
 *  netted +9, the full rest week the ruling says she does not get.
 *
 *  `paid` names the rung `accrueCondition` banked when it believed she would play: 'tournament'
 *  weeks banked `matchWeekRecoveryBase`, 'practice' weeks banked `recoveryBase` (the friendly
 *  forfeits only the slider). Pure integer, zero draws – the caller clamps. */
export function withheldFreeWeekRecovery(world: WorldState, paid: 'tournament' | 'practice'): number {
  const c = ECONOMY.condition
  if (adShootHolds(world)) return 0
  // ⭐ MERGED AT THE ROUND-25 COLLECT: the oracle now carries the PHASE'S OWN BASE (owner 22.08,
  // recovery variant C – `recoveryBaseFor`, 8 junior / 5 pro) and the MASSEUR'S AT-HOME TABLE
  // (v59 step 2) – the two waves rebuilt this same seam in parallel and both were right: one
  // expression, every refund site. The masseur term sits on BOTH sides of the practice arm (his
  // table worked the practice week and was banked), so a friendly still forfeits only the slider;
  // a tournament-paid week banked neither the base nor the table, so both come back.
  const base = recoveryBaseFor(world)
  const masseur = masseurWorksThisWeek(world) ? masseurRungOf(world).conditionBonusPerWeek : 0
  const matchFree = base + restRecoveryBonus(world.plan.rest) + masseur
  return matchFree - (paid === 'tournament' ? c.matchWeekRecoveryBase : base + masseur)}

/** Pure INTEGER condition accumulator (zero RNG). Round-9 owner redesign: fatigue comes from
 *  MATCHES (matchDrain, applied when a run COMMITS at finalizeTournament – so a skipped event
 *  week (R9-9) or a walkover costs nothing by construction); recovery comes from TIME:
 *  the phase's base (`recoveryBaseFor` – 8 junior, 5 pro since the owner's 22.08 ruling) every
 *  week, + the train/rest slider bonus on match-free weeks only, + the physio bonus while the
 *  retainer runs (R9-14 – the billed value finally visible), + the blackout bonus on
 *  off-season/exam weeks. Clamps to [min,max]. */
export function accrueCondition(world: WorldState, playedThisWeek: boolean): void {
  const c = ECONOMY.condition
  // WEEK-TYPE RECOVERY LADDER (season-planner spec §4, owner 25.07 – 0 / base / base+slider):
  //  - TOURNAMENT week: matchWeekRecoveryBase (0 shipped) – travel + competition, not rest;
  //  - ⭐ SHOOT week (ad step 2, the-face-and-the-court.md §4a, owner 22.08): the SAME travel
  //    figure – a campaign shoot is lights, flights and a working day, not rest, so the week
  //    recovers «like a travel week rather than a rest week». His own design, verbatim: no second
  //    calendar, no blocking – the week stays hers, and what changes is how much of it she gets
  //    back. ⚠ NO STACKING on a played week, again by his design: a tournament on a shoot week
  //    already recovers at the travel figure, and the match drain (at finalizeTournament) is what
  //    makes it the worse week – she simply recovers worse, no rule needed. Physio and blackout
  //    still add on top, exactly as they do on a real trip.
  //  - PRACTICE week: the base only – she keeps it but FORFEITS the slider rest bonus, because
  //    she played, even if the match was a friendly (the drain lands in resolvePractice);
  //  - free / vacation week: recoveryBase + the rest-slider bonus (the vacation's package gain
  //    rides on top in resolveVacation).
  // The practice and shoot flags are read off world state (not parameters) so the signature – and
  // with it the zero-RNG, arity-2 contract the B1 invariance test pins – stays exactly as it was.
  // The freeze-lapse rule (a shoot the college years swallow charges nothing) lives in
  // `adShootHolds`, the one predicate this and every refund site read.
  const shooting = adShootHolds(world)
  const practiced = !playedThisWeek && practiceForWeek(world, world.week) !== undefined
  const base = recoveryBaseFor(world)
  let recovery = playedThisWeek || shooting
    ? c.matchWeekRecoveryBase
    : practiced
      ? base
      : base + restRecoveryBonus(world.plan.rest)
  if (world.physioActive) recovery += ECONOMY.physio.conditionBonusPerWeek
  // The masseur's at-home table (travelling team steps 1+2): the RUNG's bonus beside the physio's
  // +1, THROUGH THE ONE PREDICATE his bill reads – a suspended week (college, family holiday) buys
  // nothing, which keeps the paid week and the bought week the same week.
  //
  // ⚠ AND NOT ON A WEEK SHE PLAYS, since step 2 – she is away at the event and nobody is on the
  // home table. Step 1 paid this bonus on tournament weeks too, which was the incoherence the
  // owner's deep-run question exposed: tournament-week recovery is now exactly what the TRAVEL
  // stance sells (the fare, `masseurTourRelief` at finalize), so a masseur left at home earns
  // nothing on the weeks she is not home. Pure read, zero draws, arity untouched.
  // ⚠ ...NOR ON A SHOOT WEEK (round-25 collect): lights and flights, not his table – the same
  // reason the week recovers at the travel figure at all.
  if (!playedThisWeek && !shooting && masseurWorksThisWeek(world)) recovery += masseurRungOf(world).conditionBonusPerWeek
  if (isBlackoutWeek(world.week, schoolIsOver(world.week, world.profile.birthMonth))) {
    recovery += c.blackoutBonus
  }
  // ⭐⭐ ROUND 29 #3 – SHE SHOT AND SHE PLAYED IN THE SAME WEEK, and the owner priced it himself:
  // «+1 в день, т.к. съемка занимает не один час, то нагрузка будет мощной на всю неделю». One
  // point per day of the week, taken off the week's recovery.
  //
  // ⚠⚠ IT IS CHARGED OFF THE FACT AND NEVER OFF THE ANSWER. Round 28's note two paragraphs up says
  // «NO STACKING on a played week ... she simply recovers worse, no rule needed» – that was true for
  // as long as the collision was nobody's decision, and the owner has now made it one: «жарить прямо
  // с чемпионатом с последствиями». The three other answers to the question REMOVE the collision
  // (the entry is withdrawn, or the week leaves `shootWeeks`), so by the time both are true here the
  // parent has chosen this. Reading the world rather than `shootClashAccepted` is what makes that
  // safe for a save written before the question existed, and keeps this arithmetic a function of
  // the week rather than of a click.
  //
  // ⚠ NOT A SECOND SPELLING OF EITHER PREDICATE: `adShootHolds` is the one shoot-week oracle this
  // file already reads, and `playedThisWeek` is `isCompetitionWeek`, handed in by the caller.
  if (shooting && playedThisWeek) recovery -= ECONOMY.advertising.clashConditionPerDay * PLAN_DAYS
  // ⭐⭐ ROUND 29 #5 – ...AND THE FAMILY'S OWN PLANE MAKES THE ROAD ONE POINT KINDER.
  // docs/specs/the-shop-2026-08.md §3f, the owner: «Самолёт не её, а родителей =) ... По усталости
  // по аналогии с кортом может 1 накинуть, не вижу причин не делать, не такая большая величина».
  //
  // ⚠⚠ IT IS A HIDDEN BONUS AND THAT IS HIS OWN RULING, made about the court this is the analogy of:
  // «верно, но только если знают об этом, я предложил сделать бонус скрытым». §3d rule 4 says what
  // hidden means – «never a number on a card» – so the shelf row, the confirm dialog and every
  // sentence about the plane say what the thing IS and never what it is worth. There is nothing to
  // suppress on the way out: no surface in this game itemises the terms of `recovery`, which is why
  // the physio's own +1 and the masseur's rung bonus have never been printed either. The effect is
  // visible where every effect in this game is visible – in the condition line, over weeks.
  //
  // ⚠⚠ AND IT CANNOT STACK WITH §3d's COURT, BY CONSTRUCTION RATHER THAN BY A CAP. §3f: «the two
  // effects land on DIFFERENT WEEKS» – the court pays on weeks she is NOT competing and this one on
  // weeks she IS. `playedThisWeek` is `isCompetitionWeek`, handed in by the caller, so a family
  // owning everything gets a corridor one point kinder across the board and never two.
  //
  // ⚠ ON THE PLAYED WEEK AND NOT ON A SHOOT WEEK. §3f's own row is «weeks she IS TRAVELLING TO AN
  // EVENT»; a campaign shoot is lights and flights the family's aeroplane was not booked for, and
  // widening this to `shooting` would be a rule the spec does not have. Zero draws: a read and an
  // addition, post-draw, so the frozen MAIN capture (41550 / e6b0c709) cannot see it.
  if (playedThisWeek && ownsDeliveredOfFamily(world, 'plane')) recovery += ECONOMY.shop.planeTravelRestBonus
  world.condition = clamp(world.condition + recovery, c.min, c.max)
}

// HER AGE (band, exact age, birthday) moved to world/age.ts (P4 extraction); re-exported below
// under the historical names so every existing call site keeps working.

/** Pure age gate for a tier: the junior tour is 13-18, the domestic ladder has no gate, the adult
 *  rungs are 16/16/17 and never close. No world/RNG dependency, so the childhood prologue and the
 *  tests call it directly. MOVED to season/calendar.ts with the adult rungs (task #17) so the AI
 *  entrant selection can read the same one implementation without importing this file; re-exported
 *  here under its historical name, so every existing call site keeps working. `tierAgeBlock` is its
 *  companion for the two surfaces that must say WHICH end she failed (§4.1). */

// entryCaps: moved to world/entryCaps.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

/** Whether the kid can currently ENTER `event`, at three levels. One helper, wired at three engine
 *  surfaces (enterEvent / upcomingEvents / advanceWeeks) so the gate can never desync. Precedence
 *  is injured > too-young > capped > unavailable > medical > fatigued.
 *   - 'blocked' HARD stops entry: `injured` (she is already out), `unavailable` (too young for the
 *     tier, or AGED OUT of it – the junior rungs are U18 since §4.1, and that is the one refusal
 *     here that never lifts / school exams / off-season / a booked family vacation – WEEK-level
 *     reasons, so they name the week), `capped` (the annual entry cap: she has spent this SEASON's allowance of
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
export function injuredDetail(weeksRemaining: number): string {
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

export function availabilityStatus(
  world: WorldState,
  // ⚠ WIDENED TO WHAT IT READS (PR-09): this function touches `event.tier` and `event.week` and
  // nothing else, measured. A `SeasonEvent` still satisfies it structurally, so every existing caller
  // is unchanged - what it now also accepts is the rung-level `VerdictContext`, which is what let the
  // one verdict answer both questions instead of the UI rebuilding it.
  event: Pick<SeasonEvent, 'tier' | 'week'>,
): AvailabilityStatus {
  // The injury window is read against the EVENT's week, never today's (R10-17 – see layoffCovering).
  // Note the CONDITION-driven branches below stay current-week reads: her condition in a future week
  // is unknowable, which is why the doctor re-checks her on arrival.
  const layoff = layoffCovering(world, event.week)
  if (layoff !== null) {
    return { level: 'blocked', reason: 'injured', detail: injuredDetail(layoff.weeksRemaining) }
  }
  // ⚠ A SUSPENSION IS THE TOUR SHUTTING THE DOOR, AND IT OUTRANKS EVERY OTHER REFUSAL BUT INJURY
  // (W3-ACT2 §6). Placed here rather than lower for the reason the precedence comment below gives
  // about the caps: a parent has to be able to see the fact that reshapes the whole block of weeks,
  // and no other gate matters while this one is closed. Below `injured` for the same reason the
  // caps are - a layoff is the fresher news and names a return week, and this will still be here.
  //
  // THE REFUSAL NAMES THE RULE AND THE DATE, which is §6's transparency clause: she is not being
  // told "no", she is being told which rule, how many points bought it, and the week it ends. No
  // copy here shames her - «мы ни за что не наказываем» - and the letter that announced every one
  // of those points arrived before any of them could bite.
  if (isSuspendedAt(world, event.week)) {
    const left = suspensionWeeksLeft(world, event.week)
    return {
      level: 'blocked',
      reason: 'unavailable',
      detail:
        `Tour suspension – ${ECONOMY.mandatory.suspensionAt} penalty points inside 52 weeks. ` +
        `${left} ${left === 1 ? 'week' : 'weeks'} left; entries reopen after that.`,
    }
  }
  // THE TIER'S AGE GATE, BOTH ENDS OF IT (§4.1). The junior tour runs 13-18, the adult rungs open at
  // 16/16/17, the domestic ladder is open at every age for ever (owner's call 2 – it is ours, not
  // the ITF's, and it is where an adult who is not good enough still plays).
  //
  // ⚠ THE `minAge !== undefined` SHORT-CIRCUIT IS GONE, and removing it is load-bearing rather than
  // tidying: it meant a tier with a MAXIMUM and no minimum would never have been checked at all,
  // and `isTierAgeOpen` would have been consulted only for permission it had already granted. No
  // shipped tier has that shape today (all three J rungs carry both), so this is a trap disarmed
  // before it fires rather than a bug fixed – but it is exactly the shape a "domestic veterans"
  // rung or an U14 rung would take, and the failure would have been silent.
  //
  // ⚠ AND THIS IS THE FIRST GATE IN THE GAME THAT CAN CLOSE BEHIND HER. Every other refusal here is
  // a "not yet" – earn the points, heal, wait for the allowance to reset. Ageing out of the junior
  // tour is permanent, it arrives on a birthday she cannot plan around, and on the season she turns
  // 19 it removes J30/J60/J300 from her calendar in one week. That is the intended shape of §4 and
  // NOT a bug: the adult rungs (W15 from 16) have been open beside them for three seasons by then,
  // so what she loses is half a calendar she has already replaced rather than the whole of it. The
  // FORK that makes this a decision instead of an event – rank, balance, the ended scholarship, what
  // a W15 costs against what it pays – is §4.2 A / B2, still to come, and the copy below is
  // deliberately plain until it exists so nothing promises a screen that is not there.
  //
  // ⚠ AND IT IS ASKED OF HER, NOT OF THE BAND (owner ruling 1, 09.08 - see world/age.ts). This read
  // `ageAtWeek(event.week)` until the one-clock wave, which is why a girl born on 15 March was offered
  // and entered a W15 at week 104 while she was 15.83: `minAgeYears = 16` was being asked of the band.
  // The consequence of the fix is the ruling working rather than a regression - a December girl becomes
  // W15-eligible eleven months later than a January one, and keeps eleven months MORE junior
  // eligibility at the other end, because the U18 ceiling is the same clock read from the top.
  const ageYears = kidAgeAt(world, event.week)
  const ageBlock = tierAgeBlock(event.tier, ageYears)
  if (ageBlock !== null) {
    const tier = TIERS[event.tier]
    return {
      level: 'blocked',
      reason: 'unavailable',
      detail:
        ageBlock === 'young'
          ? `${tier.label} opens at ${tier.minAgeYears} – she is too young.`
          : `${tier.label} is under-${tier.maxAgeYears! + 1} – at ${ageYears} she has aged out.`,
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
        // spent all fourteen has to understand she is capped for the year, not shut out.
        // ⚠ "ON HER NEXT BIRTHDAY" AND NO LONGER "NEXT SEASON" (P2). The allowance's window is her
        // birthday year now, not the season block, so the old sentence named the wrong date – and a
        // refusal that names the wrong date is worse than one that names none.
        detail:
          `Year limit reached – ${cap.used} of ${cap.limit} international events at ` +
          `${ageYears}. A fresh allowance on her next birthday.`,
        entryCap: cap,
      }
    }
  }
  // THE PRO AER (W2-LADDER §5) – the same family of rule one table up, in the same slot of the
  // precedence for the same reason: it is age eligibility from the tour's own book, and "the
  // allowance is gone until the season turns" is the fact that reshapes the rest of her year.
  // THE REFUSAL NAMES THE RULE (owner ruling 1's transparency, §5's «the refusal names the rule»):
  // a parent reading this must know it is the tour's age rule, that it is THIS season's, and what
  // she is still free to play – the guard that ships with the cap promises tennis exists.
  if (isCappedProTier(event.tier)) {
    const cap = proEntryCapUsage(world, event.week)
    if (cap.remaining <= 0) {
      return {
        level: 'blocked',
        reason: 'capped',
        detail:
          `Tour age rule – ${cap.used} of ${cap.limit} pro entries at ${ageYears}. ` +
          `A fresh allowance on her next birthday; the junior and national events stay open.`,
        entryCap: cap,
      }
    }
    // ...AND THE SUB-CAP INSIDE IT (P2): at most three of a fourteen-year-old's eight may be at W75
    // or above (WTA §X.A.2). It sits immediately after its parent allowance because it is the same
    // rule's second sentence, and it is a QUOTA rather than a door - it refuses this entry at this
    // rung while the smaller ones stay open, which is what the copy says.
    const subCap = proSubCapUsage(world, event.week, event.tier)
    if (subCap && subCap.remaining <= 0) {
      return {
        level: 'blocked',
        reason: 'capped',
        detail: proSubCapRefusalDetail(ageYears, subCap, ECONOMY.entryCap.proSubCapByAge[ageYears].fromTier),
        entryCap: subCap,
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
  // ⚠ THE WEEK'S OWN ANSWER, NOT THIS WEEK'S (W4-SCHOOL). Entries commit weeks ahead, so a girl
  // entering in August for a June that falls after her last school year must not be refused for an
  // exam she will never sit.
  if (isBlackoutWeek(event.week, schoolIsOver(event.week, world.profile.birthMonth))) {
    return {
      level: 'blocked',
      reason: 'unavailable',
      // Off-season weeks reach here too, and past school they are the ONLY ones that do.
      detail: isOffSeasonWeek(event.week)
        ? 'Off-season – the tour is closed.'
        : 'School exams this week – no tournaments.',
    }
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
 *  govern an entry already made. An entry already taken is HONOURED and the event plays – so a
 *  committed entry she has since outgrown is not "illegal", it is a decision that needs an exit,
 *  which is what `cancelEntry` (R10-13) is. Treating the entry gate's verdict as a lock on a
 *  committed entry is precisely what removed the escape and produced the R10-3 dead end.
 *
 *  ⚠ AND SINCE 05.08 THAT IS TRUE ON BOTH SIDES OF THE DEADLINE. `releaseOutgrownEntries` used to
 *  cancel the still-refundable half of the same commitment, so which of two identical entries
 *  survived depended on a date; the owner played into it and it read as the game taking a tournament
 *  off her for winning. The step is retired – see the note where it used to live in world.ts.
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
   *  says "takes the top N" rather than a points number she can never read off her own table. The
   *  number is DERIVED from the tier's `enterPct` and the live field size, never written down, so it
   *  follows both a re-picked acceptance list and a growing population (30.07: the illustrative
   *  "top 50" that used to sit here was already stale by two re-pins). */
  rankToEnter?: number
  /** 'capped' only: the season allowance behind the verdict (see AvailabilityStatus.entryCap). */
  entryCap?: EntryCapUsage
  /** SHE HAS PASSED THIS RUNG – and since 06.08 that is a LABEL, never a refusal (the owner's ruling
   *  on backlog #84, quoted verbatim in docs/specs/ladder-floor-2026-08.md: no lower bound at all,
   *  let her play, lead with the more relevant tournament of the week when there is one). Either
   *  ceiling sets it – `hasOutgrown` is the one answer both of them now have – so a card can say
   *  "outgrown" while staying enterable, which is exactly what the ruling asks for. Absent from
   *  `availabilityStatus`' own returns: it is a LADDER fact, and `entryStatus` is where the ladder
   *  and the body are combined. */
  outgrown?: boolean
}
/** ⚠ ONE READ, BOTH CEILINGS, AND IT RIDES ON EVERY RETURN OF THE VERDICT BELOW – which is why the
 *  verdict is a separate function and this is a two-line wrapper rather than a flag threaded through
 *  seven return statements. `hasOutgrown` folds the domestic band's ceiling (`outgrewTier`) and the
 *  sliding window's (`tierOutgrown`) into the one verdict world.ts demands they have; the two arms
 *  below used to spell one of them each and each returned `blocked/outgrown`. The ruling of 06.08 is
 *  that NEITHER refuses – see `tierOpenFor` and docs/specs/ladder-floor-2026-08.md. */
export function entryStatus(world: WorldState, event: SeasonEvent): EntryStatus {
  return { ...entryVerdict(world, event), outgrown: hasOutgrown(world, event.tier) }
}

/** ⭐⭐ THE SAME VERDICT, ASKED ABOUT A RUNG (PR-09 / TB-05). The UI needs one for a card whose rung
 *  has no scheduled event yet, and until now it REBUILT the rule to get it - `composables/tierState.ts`
 *  carrying its own age gate, its own point band and its own copy of `entryBandTrack`. That is the
 *  "two sides asking different functions about one question" class, and it has shipped as a defect at
 *  least four times: the wild cards, the age gates, the bench pre-filter, and the one this file's own
 *  neighbour records - a W15 reading "68 / 120 international pts" while the engine held it open.
 *
 *  ⚠ IT IS THE ONE FUNCTION, not a parallel one. `entryStatus` and this call the SAME `entryVerdict`,
 *  so the card and the turnstile cannot drift apart by construction rather than by a test noticing.
 *  What differs is only the CONTEXT: no named tournament, so no per-event door (see `VerdictContext`),
 *  and no availability tail - injury and condition are answered per event, on that event's week.
 *
 *  ⚠ THE WEEK IS `world.week`, deliberately. A rung's card means "where do I stand with this rung
 *  TODAY", and her age, her allowance and the accelerator's usage are all read at that week. */
export function tierVerdict(world: WorldState, tier: TierId): EntryStatus {
  return {
    ...entryVerdict(world, { tier, week: world.week, id: null }, false),
    outgrown: hasOutgrown(world, tier),
  }
}

/** ⭐⭐ PR-09 / TB-05 – WHAT THE VERDICT ACTUALLY NEEDS, which turned out not to be an event.
 *
 *  Measured before this was written: over `entryVerdict`'s refusal half the event appears as
 *  `event.tier` twelve times, `event.week` five, and `event.id` twice. That is the whole of it - so
 *  the refusal half is a function of (world, RUNG, WEEK, and whether a named tournament's own doors
 *  are on offer), and never of anything else about an event.
 *
 *  ⚠ `id: null` MEANS "AN EVENT OF THIS RUNG, THIS WEEK, WITH NO PER-EVENT DOOR", and it is a
 *  CONSERVATIVE BASELINE rather than a different rule. The three doors that read an id - the home
 *  wild card, the alternates list, the reserved junior place - all sit in the NEGATIVE position of
 *  one condition (`&& !reserved && !wildCard && !alternate`), so holding one SKIPS a refusal and none
 *  of them can ever cause one. A named tournament can therefore only be MORE permissive than this
 *  answer, never less, which is exactly what a rung's card should promise: it explains the rule, it
 *  does not promise a door at a tournament it cannot name. */
export interface VerdictContext {
  tier: TierId
  week: number
  /** the tournament whose own doors are on offer, or null for the rung's baseline (see above). */
  id: string | null
}

function entryVerdict(
  world: WorldState,
  event: VerdictContext,
  /** ⚠ WHETHER THE WEEK'S AVAILABILITY IS PART OF THE ANSWER, and it is NOT for a rung-level ask.
   *  `availabilityStatus` answers "can she play AT ALL this week" - a layoff covering it, her
   *  condition, the off-season, an exam week, a booked holiday. None of that is a fact about a RUNG,
   *  and `tierOpenFor` has never counted it, so including it made every rung of a resting world
   *  report itself refused. Measured by the parity net the moment it was written: 27 disagreements,
   *  every one of them 'unavailable' and every one of them ALL rungs of one world at once - which is
   *  the signature of a world-level condition wearing a rung's clothes. */
  availability = true,
): EntryStatus {
  const tier = TIERS[event.tier]
  // ⭐⭐ THE DOOR THAT HAS SHUT BEHIND HER OUT-RANKS EVERY LADDER SENTENCE (round 28 #12 Part 0).
  // `availabilityStatus` has always carried the age gate, but it runs AFTER this function's ladder
  // arms, so an aged-out rung was refused by whichever ladder rule happened to fire first - and on
  // the owner's save at 26 that produced «Junior Tour 60 takes the top 100 – she has no
  // international ranking yet» and «Junior Tour 300 takes the top 50 – she has no international
  // ranking yet», sentences that invite a twenty-six-year-old to go and earn a junior ranking. j30
  // read correctly the whole time purely because its arm has no acceptance list to refuse her with,
  // which is how the inconsistency hid: one of the three J rungs told the truth.
  //
  // ⚠ 'old' ONLY. The 'young' end stays exactly where it is, in `availabilityStatus`, because it is
  // a countdown rather than a closed door and nothing about its precedence has ever been wrong.
  // ⚠ AND IT IS THE SAME `tierAgeBlock` `tierOpenFor` NOW ASKS, so the calendar and the turnstile
  // shut an aged-out rung on one function's answer (R10-5).
  if (tierAgeBlock(event.tier, kidAgeAt(world, event.week)) === 'old') {
    return {
      level: 'blocked',
      reason: 'unavailable',
      detail: `${tier.label} is under-${tier.maxAgeYears! + 1} – at ${kidAgeAt(world, event.week)} she has aged out.`,
    }
  }
  // AN ITF OR WTA RUNG IS AN ACCEPTANCE LIST, not a points threshold (docs/specs/two-ladders.md).
  // She gets in on her RANK IN THAT TABLE, the same signal the AI field is drawn on, so the two
  // sides of the same event finally obey the same rule - see rank-plateau.md 2b for what it cost
  // when they did not.
  //
  // ⚠ ONE ARM FOR BOTH TABLES, AND MERGING THEM IS THE POINT (task #17). This branch used to be
  // `tier.track === 'itf'` and the domestic fall-through below caught everything else - so the
  // moment the W rungs existed they fell into the DOMESTIC gate and W15 was refused with "Not
  // enough national pts for World Tour 15 yet (need 120)", a threshold denominated in the wrong
  // currency entirely. `tierOpenFor` had already been given its wta arm and said the rung was open,
  // so the season policy committed to an event `enterEvent` then threw on: the two gates R10-5
  // exists to keep identical had come apart, and the econ bench crashed on it mid-sweep. Writing
  // the two tables as ONE arm over `onRamp` is what makes that unrepresentable rather than
  // remembered - a fourth table would inherit the rule instead of needing this comment again.
  if (tier.track === 'itf' || tier.track === 'wta') {
    // THE ON-RAMP IS ALWAYS THE TABLE BELOW. The first rung of a table has no rank bar, because she
    // cannot own a ranking in a table she has never played in and a rank gate there would be a
    // closed loop; so J30 reads her DOMESTIC points and W15 reads her ITF JUNIOR points. Above the
    // on-ramp the acceptance list takes over, in the rung's own table's currency.
    // ⚠⚠ THE PLAY DOWN RULES, ASKED FIRST AND AT BOTH SURFACES (P1 step 2, docs/specs/
    // play-down-2026-08.md). It is the SAME predicate `tierFloorOpen` reads, in the same position –
    // above the on-ramp branch, because W15 returns out of that branch and the #150 limb is mostly
    // about W15. Placing it here rather than in `availabilityStatus` is the acceptance cut's own
    // precedence: this is a LADDER fact about her standing, not a fact about her week.
    if (playDownBars(world, event.tier)) {
      return {
        level: 'blocked',
        reason: 'locked',
        detail: playDownRefusalDetail(event.tier, rankIn(world, 'wta')),
      }
    }
    const onRamp: LadderTrack = tier.track === 'itf' ? 'domestic' : 'itf'
    // ⚠ THE CEILING USED TO REFUSE HERE, AND SINCE 06.08 IT DOES NOT (docs/specs/
    // ladder-floor-2026-08.md). W2-WINDOW gave every rung both bounds and this branch was the ITF/W
    // half of it: a rung she had passed CLOSED. It was right about the junk (measured on the owner's
    // W230 career: 48 of the 64 entries left in his season sat at rungs whose strongest entrant is
    // weaker than she is) and wrong about the remedy - measured on his NEXT save, the same rule left
    // 112 of 165 blocked events saying `outgrown` and 27 of his 46 remaining event weeks with nothing
    // enterable on them at all. The junk is now sorted below rather than refused; `outgrown` above
    // carries the fact to the card and to the feed's per-week pick.
    //
    // ⚠ THE TRAP THIS BRANCH ONCE FIXED IS GONE WITH IT, not left behind. It had to sit ABOVE the
    // on-ramp branch, because J30 and W15 have no acceptance list, so `accepts` is undefined for them
    // and the branch below RETURNS - which let `tierOpenFor` close J30 for an eighteen-year-old while
    // this gate went on admitting her (R10-5's disagreement, found in the browser). With the ceiling
    // out of BOTH gates the two agree again by construction: `tierOpenFor` is `tierFloorOpen`, and
    // this arm is the same floor asked event by event.
    const accepts = acceptanceRank(world, event.tier)
    if (accepts === undefined) {
      const [minPoints] = tier.enterPointBand
      // ⚠ THE LATCH, NOT THE LIVE BAND (v34) - and this line is why R10-5's rule matters. Reading
      // `kidPoints(world, onRamp) < minPoints` here is what USED to be written, and it is a second
      // implementation of `tierOpenFor`'s on-ramp arm: the moment that arm started latching, this one
      // went on refusing entry to a girl the calendar was showing an open rung to, and the bench
      // crashed on the disagreement mid-sweep - the identical failure this comment block already
      // describes from task #17. Both arms now read the one piece of state.
      // The MESSAGE is unchanged and still names the band, because for a girl who has not crossed yet
      // the band is exactly what she needs: that is how the latch gets set.
      if (!onRampOpen(world, tier.track)) {
        // ⚠ TWO ON-RAMPS, TWO CURRENCIES, AND SINCE P1 THEY DIFFER (docs/specs/
        // junior-access-2026-08.md). J30's door is still domestic POINTS and still says so – for a
        // girl who has not crossed yet the band is exactly what she needs, because that is how the
        // latch gets set. W15's door is now the sport's own junior RESERVED PLACE, read as an ITF
        // junior RANKING, so the sentence has to name a position instead of a point total: a number
        // she could not find on her own table is not an explanation. Both halves read the SAME
        // functions the calendar's verdict reads (`onRampOpen`, `juniorReservedRank`), which is the
        // whole of what keeps R10-5 true.
        if (tier.track === 'wta') {
          const cut = juniorReservedRank(tableSize(world, onRamp))
          const ranked = kidPoints(world, onRamp) > 0
          return {
            level: 'blocked',
            reason: 'locked',
            detail: ranked
              ? `${tier.label} holds junior places for the top ${cut} – she is #${rankIn(world, onRamp)}`
              : `${tier.label} holds junior places for the top ${cut} – she has no ${LADDER_LABEL[onRamp].toLowerCase()} ranking yet`,
            rankToEnter: cut,
          }
        }
        return {
          level: 'blocked',
          reason: 'locked',
          detail: `${tier.label} takes her on her ${LADDER_LABEL[onRamp].toLowerCase()} standing – ${minPoints} ${LADDER_POINTS_LABEL[onRamp]} needed`,
          pointsToEnter: minPoints,
        }
      }
      return availability ? availabilityStatus(world, event) : { level: 'ok' }
    }
    // ⚠ UNRANKED IS NOT RANK ONE. With nobody holding a point in this table in week 1 the whole field
    // ties at zero, and competition ranking gives every member of a tie the SAME rank - so a fresh
    // fourteen-year-old reads as #1 and the top rungs would open to her on day one. You cannot be on
    // an acceptance list BY RANKING if you have no ranking, so the gate demands a counting result IN
    // THIS TABLE before it will read a position at all. (The same `hasResults` guard the econ bench
    // already puts on its rank arm, for the same reason.) It matters twice as much on the
    // professional table, which opens EMPTY for the whole world - see topBandForPercentile.
    const ranked = kidPoints(world, tier.track) > 0
    const rank = rankIn(world, tier.track)
    // ⚠⚠ THE RESERVED PLACE IS CHECKED BEFORE THE CUT REFUSES, AND THE ORDER IS A BUG THIS CAUGHT
    // (16.08). Once the Accelerator became an extra door rather than a ceiling, a junior it holds a
    // place for is admitted by `tierFloorOpen` WITHOUT clearing the list – and this branch, sitting
    // above the programme's own, would have refused her anyway. That is the R10-5 disagreement
    // arriving from the far side: the calendar open, the turnstile shut, on the one girl the reserved
    // place exists for. `tests/rankingGate.test.ts`'s sweep could not see it, because its implication
    // runs one way (a rung the calendar SHUTS must never be enterable).
    const reserved = juniorReservedPlace(world, event.week, event.tier)
    // ⭐⭐ AND THE HOME WILD CARD, CHECKED IN THE SAME BREATH AND FOR THE SAME REASON (round 21 #2b,
    // 17.08). It is the third door `tierFloorOpen` now offers, so it has to be offered here too or
    // R10-5 re-opens from the far side – the calendar showing an enterable card and the turnstile
    // refusing it, on the one event the wild card exists for. `homeWildCardPlace` is the whole rule
    // and `wildCardWindow` inside it is the same function the AI draw's eight held places are
    // filled by; see season/tournament.ts.
    // ⚠ BOTH DOORS ARE OFF FOR A RUNG-LEVEL ASK (`id: null`), which is the conservative direction:
    // see `VerdictContext`. They can only ever admit, so withholding them cannot invent a refusal
    // that a real event would not make - it can only decline to promise one it might.
    const wildCard = event.id !== null && homeWildCardPlace(world, event.tier, event.id)
    // ⭐ THE ALTERNATES LIST (18.08) – the rung's middle, and the one door that can open BETWEEN weeks
    // without her rank moving. Four places below the cut she stands in a queue; she takes a chair when
    // enough of the field withdrew. `tierFloorOpen` asks the same function, so the calendar and this
    // turnstile cannot disagree - the mistake the wild card made earlier the same day.
    const alternate = event.id !== null && alternateListPlace(world, event.tier, event.id)
    if ((!ranked || rank > accepts) && !reserved && !wildCard && !alternate) {
      const cut = ranked
        ? `${tier.label} takes the top ${accepts} – she is #${rank}`
        : `${tier.label} takes the top ${accepts} – she has no ${LADDER_LABEL[tier.track].toLowerCase()} ranking yet`
      // ⚠ AND A JUNIOR IS TOLD ABOUT BOTH DOORS, because she has both. An adult has only the list, so
      // naming a programme she is not eligible for would be noise; a seventeen-year-old who misses
      // the cut is refused by the list AND by the junior programme, and a refusal that names one of
      // the two invites her to solve the wrong one.
      const junior = isJuniorAge(kidAgeAt(world, event.week))
      const yearEnd = junior ? yearEndJuniorRank(world) : null
      return {
        level: 'blocked',
        reason: 'locked',
        detail: junior
          ? `${cut}. ${acceleratorRefusalDetail(event.tier, yearEnd, acceleratorUsage(world, event.week, event.tier, yearEnd))}`
          : cut,
        rankToEnter: accepts,
      }
    }
    // ⚠⚠ AND THE JUNIOR ACCELERATOR, ASKED OF THE EVENT'S WEEK (P1). It sits BELOW the acceptance cut
    // and ABOVE availability for the same reason the two entry caps sit where they do: it is an
    // eligibility rule out of the tour's own book, and "the junior programme has no place for her
    // here" is the fact that should reshape a season rather than a week. The EVENT's week, never
    // today's, on `entryCapUsage`'s own R10-17 rule – a rule about a future event has to be asked
    // about that event's future, or a December horizon reports next season's fixture against this
    // season's allowance.
    //
    // ⚠ AND IT IS THE SAME FUNCTION THE CALENDAR'S VERDICT READS (`juniorAccessOpen`, called from
    // `tierFloorOpen`), which is the whole of what stops R10-5 from re-opening: the calendar saying
    // shut while the turnstile lets her through is the disagreement `tests/rankingGate.test.ts`
    // exists for, and one function cannot disagree with itself.
    if (!juniorAccessOpen(world, event.week, event.tier)) {
      const yearEnd = yearEndJuniorRank(world)
      return {
        level: 'blocked',
        reason: 'locked',
        detail: acceleratorRefusalDetail(event.tier, yearEnd, acceleratorUsage(world, event.week, event.tier, yearEnd)),
      }
    }
    return availability ? availabilityStatus(world, event) : { level: 'ok' }
  }
  // ⭐⭐ THE PLAY DOWN RULES ON THE DOMESTIC LADDER, ASKED FIRST (round 28 #12 Part 0, docs/specs/
  // the-calendar-she-can-reach-2026-08.md). Same position and same reason as the W arm's copy
  // twenty lines up: it is a LADDER fact about her standing, and it has to out-rank the points floor
  // below because that floor is denominated in a currency a world-tour player stops earning. The
  // owner's save at 26, WTA #110, read «Not enough national pts for Regional Championship yet (need
  // 65)» - said to the world number one hundred and ten. The rule has not changed; the sentence it
  // is refused with has, and `playDownRefusalDetail` writes it in one place for both surfaces.
  if (playDownBars(world, event.tier)) {
    return {
      level: 'blocked',
      reason: 'locked',
      detail: playDownRefusalDetail(event.tier, rankIn(world, 'wta')),
    }
  }
  const minPoints = tier.enterPointBand[0]
  const points = kidPoints(world, 'domestic')
  // ⚠ THESE TWO SENTENCES NAME THEIR CURRENCY (31.07, fix/ladder-separation), and they are shown to
  // the player: `enterEvent` throws `gate.detail` and the store puts the message on screen. They said
  // "ranking points" and "(604 pts)" while the game holds TWO point tables that never convert into
  // one another - so a girl with 604 national points and 4 international ones was told she did not
  // have enough "ranking points", which is a sentence she could check against the wrong number on
  // two different screens. `LADDER_POINTS_LABEL` is the one place those units are spelled.
  if (points < minPoints) {
    return {
      level: 'blocked',
      reason: 'locked',
      detail: `Not enough ${LADDER_POINTS_LABEL.domestic} for ${tier.label} yet (need ${minPoints})`,
      pointsToEnter: minPoints,
    }
  }
  // ⚠ THE DOMESTIC ARM'S TWO CEILINGS USED TO REFUSE HERE, AND THEY WERE TWO BRANCHES: the band's
  // own (`outgrewTier` – "her points passed this rung") and the ladder's (`tierOutgrown` – "the rung
  // three above opened, so she has walked past it"). Both are folded into `entryStatus`'
  // `hasOutgrown` now, and neither refuses. Keeping them as two branches here was the standing risk
  // world.ts's own note names: they must have the same consequence, and two branches is two places
  // to change. What `tests/rankingGate.test.ts` caught when this arm was one branch short ("local:
  // the calendar says shut, the turnstile lets her through") cannot recur in either direction – the
  // calendar's verdict is `tierFloorOpen` and so is this one.
  return availability ? availabilityStatus(world, event) : { level: 'ok' }
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
  // ⚠ BOTH CEILINGS, THE SAME ONE `entryStatus` READS (06.08). This used to be `outgrewTier` alone,
  // which was the domestic band only – so a committed W50 whose rung the SLIDING window had closed
  // arrived announcing nothing, while a Local whose band she had passed said "(outgrown)". Two
  // ceilings, one consequence: `hasOutgrown` is where that is now true by construction rather than
  // by two call sites agreeing. It matters more since the floor stopped refusing, because she now
  // routinely ENTERS the rungs she has passed and the arrival is where the game says so.
  const outgrown = hasOutgrown(world, event.tier)
  const layoff = layoffCovering(world, event.week)
  if (layoff !== null) return { verdict: 'injured', detail: injuredDetail(layoff.weeksRemaining), outgrown }
  const medical = medicalBlock(world.condition)
  if (medical) return { verdict: 'medical', detail: medical.detail, outgrown }
  return { verdict: 'play', outgrown }
}
