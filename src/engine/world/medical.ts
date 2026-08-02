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
// SIBLING leaves – ledger, age, entryCaps, ladder, bookings – which is what made the cut clean:
// measured at 11 call-backs into world.ts before those landed, 0 after.
//
// ⚠ RNG: nothing here draws. These are pure reads over persisted state plus the ECONOMY knobs, so
// the frozen MAIN capture cannot notice this file.
import { ECONOMY } from '../economy'
import { clamp } from '../condition'
import { TIERS, isBlackoutWeek, tierAgeBlock } from '../season/calendar'
import type { LadderTrack, SeasonEvent } from '../season/types'
import { LADDER_LABEL, LADDER_POINTS_LABEL, type EntryCapUsage } from '../../shared/protocol'
import { ageAtWeek } from './age'
import { entryCapUsage, proEntryCapUsage, isCappedTier, isCappedProTier } from './entryCaps'
import { acceptanceRank, kidPoints, onRampOpen, outgrewTier, rankIn } from './ladder'
import { vacationForWeek, practiceForWeek, vacationBlackoutDetail } from './bookings'
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

export function availabilityStatus(world: WorldState, event: SeasonEvent): AvailabilityStatus {
  // The injury window is read against the EVENT's week, never today's (R10-17 – see layoffCovering).
  // Note the CONDITION-driven branches below stay current-week reads: her condition in a future week
  // is unknowable, which is why the doctor re-checks her on arrival.
  const layoff = layoffCovering(world, event.week)
  if (layoff !== null) {
    return { level: 'blocked', reason: 'injured', detail: injuredDetail(layoff.weeksRemaining) }
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
  const ageBlock = tierAgeBlock(event.tier, ageAtWeek(event.week))
  if (ageBlock !== null) {
    const tier = TIERS[event.tier]
    return {
      level: 'blocked',
      reason: 'unavailable',
      detail:
        ageBlock === 'young'
          ? `${tier.label} opens at ${tier.minAgeYears} – she is too young.`
          : `${tier.label} is under-${tier.maxAgeYears! + 1} – at ${ageAtWeek(event.week)} she has aged out.`,
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
          `Tour age rule – ${cap.used} of ${cap.limit} pro entries at ${ageAtWeek(event.week)}. ` +
          `A fresh allowance next season; the junior and national events stay open.`,
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
   *  says "takes the top N" rather than a points number she can never read off her own table. The
   *  number is DERIVED from the tier's `enterPct` and the live field size, never written down, so it
   *  follows both a re-picked acceptance list and a growing population (30.07: the illustrative
   *  "top 50" that used to sit here was already stale by two re-pins). */
  rankToEnter?: number
  /** 'capped' only: the season allowance behind the verdict (see AvailabilityStatus.entryCap). */
  entryCap?: EntryCapUsage
}
export function entryStatus(world: WorldState, event: SeasonEvent): EntryStatus {
  const tier = TIERS[event.tier]
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
    const onRamp: LadderTrack = tier.track === 'itf' ? 'domestic' : 'itf'
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
        return {
          level: 'blocked',
          reason: 'locked',
          detail: `${tier.label} takes her on her ${LADDER_LABEL[onRamp].toLowerCase()} standing – ${minPoints} ${LADDER_POINTS_LABEL[onRamp]} needed`,
          pointsToEnter: minPoints,
        }
      }
      return availabilityStatus(world, event)
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
    if (!ranked || rank > accepts) {
      return {
        level: 'blocked',
        reason: 'locked',
        detail: ranked
          ? `${tier.label} takes the top ${accepts} – she is #${rank}`
          : `${tier.label} takes the top ${accepts} – she has no ${LADDER_LABEL[tier.track].toLowerCase()} ranking yet`,
        rankToEnter: accepts,
      }
    }
    return availabilityStatus(world, event)
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
  if (outgrewTier(event.tier, points)) {
    return {
      level: 'blocked',
      reason: 'outgrown',
      detail: `You've outgrown ${tier.label} (${points} ${LADDER_POINTS_LABEL.domestic})`,
    }
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
