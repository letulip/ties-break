// INJURIES AND PHYSIO: the weekly roll, the hazard shape behind it, and the recovery the family pays
// for – plus the sweep that cleans up everything an injury invalidates.
//
// ⚠ RNG, AND THE WHOLE REASON THIS SLICE IS SAFE. All of it lives on the PRIVATE per-week
// sub-streams `seed:injury:<week>` and `seed:physio:<week>`. Each is re-derived per call and keyed on
// immutable (seed, week) only, so conditional pulls inside them – severity, weeks-out and region only
// when injured, billing only when owed – can never perturb the MAIN weekly stream or any other week.
// `rollInjury`/`resolvePhysio` take only `world`: there is no rng parameter to misuse.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. The four things this file needed from the integration
// core – `eventById`, `refundPractice`, `withdrawEvent`, `retireKnock` – were moved DOWN into leaves
// (bookings, entries, knockHistory) rather than imported upward, which is what made the cut clean:
// measured at 8 call-backs in wave 0, 0 here.
import { ECONOMY } from '../economy'
import { pickInt, rngFromSeed, type Rng } from '../rng'
import { drawBodyRegion } from '../body'
import { clamp } from '../condition'
import { kitInjuryFactor, kitWearAt } from '../equipment'
import { kitFreshCap } from '../offers'
import { knockLive, knockTauFactor } from '../knock'
import { coachById, physioRecoveryFactor, physioRiskFactor, tierOf } from '../coach'
import type { InjurySeverity } from '../../shared/protocol'
import { addEvent } from './ledger'
import { ageAtWeek, kidAgeYears } from './age'
import { KID_ID } from './constants'
import { captureMilestone } from './milestones'
import { layoffCovering } from './medical'
import { eventById, refundPractice, vacationForWeek } from './bookings'
import { withdrawEvent } from './entries'
import { retireKnock } from './knockHistory'
import type { WorldState } from '../world'

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
export function enteredScheduledThisWeek(world: WorldState): boolean {
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
  // ⚠ HER REAL AGE, not the band's. Injury risk is a fact about a BODY - a thirteen-year-old's is not a
  // fourteen-year-old's - so this is one of the places the girl and her age group genuinely differ, and a
  // December girl spends her first season on the 13 row. Contrast `entryCapUsage`, which correctly keys
  // off the BAND: the ITF's annual entry limit is a birth-year rule, and its own note says so.
  tau *= ageInjuryFactor(kidAgeYears(world.week, world.profile.birthMonth))
  tau *= consecutivePlayFactor(playedWeeksInTrailing4(world))
  if (enteredScheduledThisWeek(world)) tau *= a.injuryPlayingMultiplier
  // R12-4/11: a booked family week is the opposite pole of the load axis above – she is not
  // training and not competing, so the week costs a fraction of a training week's risk. Nonzero on
  // purpose (holidays do sprain ankles). Post-draw multiply, zero draws – see the knob's note.
  // Read off `vacations` rather than a flag: `rollInjury` runs at step 1c BEFORE `resolveVacation`,
  // and `prunePlannerBookings` keeps the current week, so the booking is always visible here.
  if (vacationForWeek(world, world.week)) tau *= a.injuryVacationFactor
  // ⚠ BY RUNG NOW, not one flat boolean - see coach.ts `physioRiskFactor`. A budget team reproduces the
  // shipped 0.76 exactly, so nothing that ships today changes; the rungs above it protect her better.
  // POST-DRAW multiply on the threshold, the same invariance pattern as `knockTauFactor` below.
  if (world.physioActive) tau *= physioRiskFactor(tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId)))
  // Season planner: the resort/elite recovery buff is a POST-DRAW multiply on the threshold
  // (spec §2 "invariance-safe"), so the expensive package buys real protection without ever
  // touching the draw sequence.
  if (world.recoveryBuff && world.week <= world.recoveryBuff.untilWeek) tau *= world.recoveryBuff.factor
  // THE SECOND HALF OF THE SHOES (equipment-and-serve-speed.md §2). The owner: «в плохих коньках
  // ребята не могут угнаться за другими в хороших, просто физика так работает» - worn soles cost
  // movement AND raise injury risk, and the second one lands on a system that already exists.
  //
  // ⚠ THE ONE EQUIPMENT EFFECT THAT IS BACKGROUND-NEUTRAL BY CONSTRUCTION, and it is the injury one
  // on purpose: ECONOMY.gear.shoes has the SAME 10-14 week cadence for every family (only the price
  // differs), so this factor's whole cycle is identical for a working and a wealthy career. Nobody
  // buys their daughter out of a rolled ankle.
  //
  // Same POST-DRAW shape as the three multiplies above: `rollInjury` has already drawn from
  // `seed:injury:<week>` before it calls this, `kitWearAt` spends no draw on any stream, and
  // `injuryTau` keeps its pinned arity of 1. The frozen MAIN capture (41550 / e6b0c709) cannot see it.
  //
  // ⚠ AND A SIGNED KIT DEAL PUTS A FLOOR UNDER HER SOLES TOO (v32), which follows from the shoes
  // being real rather than from any new rule: the sponsor's cap is applied inside `kitWearAt`, so the
  // one function that decides how worn her shoes are answers the same way here and at the composition
  // point. It cannot make her safer than new shoes and it draws nothing, so the shape above is
  // unchanged: a post-draw multiply that is exactly 1 for a girl in fresh kit.
  //
  // ⚠ AND THE RUNG SHE IS ON RIDES IN THE SAME WAY (W3-KIT, v37): `world.kit` is read by `kitWearAt`
  // and comes back out as wear, so the ladder reaches the body through the ONE factor that was
  // already here rather than through a second multiply. `alloy` shoes are bought at 0.16 of a service
  // life and die a fifth faster; `pro` shoes barely age. Still post-draw, still arity-1, still
  // spending nothing on any stream. A career with no `kit` on it (every save before v37, and every
  // hand-built test world) passes `undefined` and gets the shipped answer byte-identical.
  tau *= kitInjuryFactor(
    kitWearAt(
      world.seed,
      world.profile.background,
      world.week,
      kitFreshCap(world.offers, world.week),
      world.kit ?? null,
    ),
  )
  // W4 – AND THE KNOCK HE SENT HER BACK OUT ON. The whole cost of the `push` branch, and it is
  // deliberately the same shape as the three multiplies above: POST-DRAW on the threshold, zero draws
  // on any stream, so the private `seed:injury:<week>` sequence is byte-identical for a career that
  // never gets a knock and the frozen MAIN capture (41550 / e6b0c709) cannot move.
  //
  // `injuryChanceCap` below still caps it, which matters: at a deep condition deficit the ×2.2 would
  // otherwise take a worn body past 13%/wk, and the cap is the promise that no single decision can
  // make her a coin flip.
  tau *= knockTauFactor(world.knock, world.week)
  return Math.min(tau, a.injuryChanceCap)
}

// ⚠ THE BODY-REGION TABLE AND `drawBodyRegion` MOVED TO ./body.ts (W6c), unchanged - same twelve
// entries, same order, same weights, still exactly one pull. They left because diary.ts needed the
// same vocabulary to stop writing «her leg up on a chair» about a strained wrist, and diary.ts cannot
// import this file (world -> diary is the direction; the reverse would be a cycle). The move touches
// no draw: see the note at the top of body.ts for why that is load-bearing.

// kind = "<part> <descriptor>". A 1-week minor reads as a "niggle", a 2-week one as "soreness" –
// deterministic variety off the already-drawn weeks-out, no extra pull.
export const SEVERITY_DESCRIPTOR: Record<InjurySeverity, string> = {
  minor: 'soreness',
  moderate: 'strain',
  major: 'stress reaction',
  severe: 'tear',
}

/** One medical bill in cents: draw the MIDDLE-anchored base from `band`, then map ONE uniform
 *  roll from the same physio generator into the background's medical corridor (mirrors
 *  travelBgFactor: same roll, disjoint corridors, so working < middle < wealthy per bill). */
export function medicalBillCents(world: WorldState, rng: Rng, band: readonly [number, number]): number {
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
  // W4 – THE THREAD'S BILL. When she is mid-push on a knock, the injury lands on THAT part. This is
  // the payoff the accumulating thread exists for: a career that keeps sending her back out does not
  // collect a series of unrelated Fridays, it breaks the shoulder it has been ignoring, and the news
  // line says so in as many words.
  //
  // ⚠ A POST-DRAW OVERRIDE, NOT A SKIPPED DRAW. `drawBodyRegion` still spends its one pull exactly
  // where it always did – the override replaces the RESULT, so the `seed:injury:<week>` sequence is
  // byte-identical and every downstream draw (there are none after this, but the property is what
  // makes it safe) keeps its position. A career with no knock is untouched, so nothing shipped moves.
  const drawnPart = drawBodyRegion(injuryRng)
  const pushing = knockLive(world.knock, world.week) && world.knock!.choice === 'push'
  const part = pushing ? world.knock!.part : drawnPart
  // ...and the same rung scaling on how long she is out. Budget = today's 12% exactly.
  if (world.physioActive) {
    weeksOut = Math.max(
      1,
      Math.round(weeksOut * physioRecoveryFactor(tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId)))),
    )
  }
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
        : pushing
          ? `Injury: ${kind} – out ~${wks}. The knock we trained through.`
          : `Injury: ${kind} – out ~${wks}.`,
  })
  // ...and the knock is retired, marked with what it cost. An injury SUPERSEDES a knock in both
  // directions: there is nothing left to load (she is not training) and nothing left to decide, and
  // `brokeDown` is what lets the history distinguish "he pushed and got away with it" from "he
  // pushed and this is the bill". Retired here rather than left to expire so a nine-week layoff
  // cannot come back to a live knock on a body that has been resting.
  if (world.knock !== null) retireKnock(world, pushing)
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
