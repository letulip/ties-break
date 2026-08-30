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
import { bodyPartOf, drawBodyRegionFrom, tiltedBodyRegions } from '../body'
import { clamp } from '../condition'
import { kitInjuryFactor, kitWearAt } from '../equipment'
import { kitFreshCap } from '../offers'
import { knockLive, knockTauFactor, loadedPartShares, pushedParts } from '../knock'
import { planWeek } from '../plan'
import { coachById, physioRecoveryFactor, physioRiskFactor, tierOf } from '../coach'
import type { InjurySeverity } from '../../shared/protocol'
import { addEvent } from './ledger'
import { ageAtWeek, kidAgeYears } from './age'
import { KID_ID } from './constants'
import { captureMilestone } from './milestones'
import { layoffCovering } from './medical'
import { eventById, refundPractice, vacationForWeek } from './bookings'
import { gearRestWeeksOf } from './kit'
import { masseurRungOf, masseurWorksThisWeek } from './masseur'
import { releaseEntry } from './entries'
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

// =================================================================================================
// RECURRENCE – round 30 #27, the owner's ruling of 30.08
// =================================================================================================
//
// «раз мы храним историю травм у себя, то вполне можно делать алгоритм, который будет увеличивать
// немного вероятность новой такой же травмы или ее прогрессии (более тяжелой). Мне кажется это
// похоже на правду.» It is похоже на правду: PREVIOUS INJURY IS THE BEST-ESTABLISHED RISK FACTOR IN
// SPORTS-INJURY EPIDEMIOLOGY, ahead of age and ahead of load.
//
// ⭐⭐ WHAT IT IS FOR, AND IT IS NOT THE RATE. His other complaint was «ни одной травмы я не видел
// уже несколько сезонов» – and the measured rate is 0.68-0.78 onsets a season against his own
// lifetime 0.64, so the number was never the problem. INDEPENDENT WEEKLY DRAWS PRODUCE EXACTLY THE
// FORGETTABLE PATTERN HE DESCRIBES. This mechanic spends its whole budget on CLUSTERING the same
// total: «three quiet years, then the ankle went twice in one season» is the identical number of
// injuries told in a way a person can remember. The bench grades it on the clustering columns
// (`repeat share`, the gap distribution), not on the rate.
//
// ⚠⚠ RNG, AND IT IS THE SAME PROMISE THE REST OF THIS FILE MAKES. All three limbs below read
// `injuryHistory`, which is a CONSEQUENCE OF PLAY – so if any of them reached a draw, a player's
// choices would re-roll the world's dice and input-independence (invariant 2) would be gone. None of
// them does:
//   `recurrenceTauFactor` is a POST-DRAW multiply inside `injuryTau`, exactly `kitInjuryFactor`'s
//      shape – the occurrence roll is already drawn by the time it is called, so it moves whether
//      she gets hurt and never which numbers come out of any stream;
//   `escalatedBands` re-prices thresholds that an ALREADY-DRAWN uniform is compared against, exactly
//      `severityBandsFor`'s shape;
//   `recurrencePartLoad` tilts a TABLE that `drawBodyRegionFrom` spends exactly one pull against for
//      any table, exactly `tiltedBodyRegions`' shape.
// Zero draws added on any stream. The frozen MAIN capture (41550 / e6b0c709) cannot see any of it.
//
// ⚠ NO SCHEMA MOVE. Everything is derived from `injuryHistory`, which already holds `kind`,
// `severity`, `week` and `weeksOut`; `bodyPartOf` already turns a `kind` back into one of the twelve
// regions. Nothing new is persisted.

/** How much of a recovered layoff is still on the body, at `week`. Halves every
 *  `recurrence.halfLifeWeeks`, counted from the RECOVERY week (which is the week an `injuryHistory`
 *  row carries), so a long absence starts fading when she is back on court rather than when she went
 *  down. Rows in the future (hand-built probe worlds) and rows at the same week both read 1. */
function recurrenceDecay(rowWeek: number, week: number): number {
  const elapsed = week - rowWeek
  if (elapsed <= 0) return 1
  return Math.pow(0.5, elapsed / ECONOMY.availability.recurrence.halfLifeWeeks)
}

/** What one history row weighs before decay.
 *
 *  ⚠ THE WIDENING IS DELIBERATE AND IT IS ON THE SAVE'S SIDE, NOT THE KNOB'S. `injuryHistory` rows
 *  declare `severity: string` (world/state.ts) because they are PERSISTED and a save written by any
 *  build may be read by this one, while the knob is a `Record<InjurySeverity, number>` because that
 *  is what it documents. Reading through `Record<string, number | undefined>` is the honest join of
 *  the two: an unrecognised severity contributes NOTHING rather than `undefined` propagating into
 *  the sum as `NaN` and poisoning every factor downstream. */
function recurrenceWeightOf(severity: string): number {
  const table = ECONOMY.availability.recurrence.severityWeight as Record<string, number | undefined>
  return table[severity] ?? 0
}

/**
 * ⭐ THE ONE STATE QUANTITY ALL THREE LIMBS READ – the decayed, severity-weighted count of what this
 * body has already been through, saturating at `recurrence.loadCap`.
 *
 * ⚠⚠ THE CEILING AND THE DECAY ARE THE DESIGN AND NOT A RAIL BOLTED ON AFTERWARDS. «Мы ни за что не
 * наказываем»: a first injury may not doom a career, so a mechanic that only ever accumulates is a
 * death spiral wearing realism's clothes. The cap says a body can carry at most one fresh major
 * injury's worth of memory however long the list gets, and the half-life says three quiet seasons
 * take 87.5% of it away.
 *
 * ⚠ IT READS THE PRUNED LIST ON PURPOSE. `rollInjury` keeps `injuryHistory` at its last 20 rows, and
 * unlike `weeksLostSoFar` – whose accumulator had to be rescued in v40 because a career TOTAL that
 * silently ran short was a bug – a decayed sum wants the recent tail and nothing else. A row old
 * enough to be pruned is a row worth ~0 here anyway: 20 injuries deep is many seasons back.
 *
 * Pure state, zero draws.
 */
export function recurrenceLoad(world: WorldState): number {
  const r = ECONOMY.availability.recurrence
  let load = 0
  for (const row of world.injuryHistory) {
    load += recurrenceWeightOf(row.severity) * recurrenceDecay(row.week, world.week)
  }
  return Math.min(load, r.loadCap)
}

/**
 * ...and the same sum split BY BODY PART, each capped on its own, for the region tilt. This is the
 * «новой ТАКОЙ ЖЕ травмы» half of his sentence: the ankle that went last season is what makes the
 * ankle the likely next one.
 *
 * ⚠ EMPTY MAP FOR A CLEAN RECORD, which is what keeps every existing career byte-identical:
 * `tiltedBodyRegions` returns the shipped `BODY_REGIONS` array itself when nothing tilts it, and its
 * own note explains why that identity return is load-bearing (the twelve weights sum to 1.0 in
 * decimal but not in binary, so a renormalising pass over an all-ones tilt could flip a boundary
 * uniform into the neighbouring part). A row whose `kind` names none of the twelve regions –
 * possible only in a hand-built world – is skipped rather than guessed at.
 */
export function recurrencePartLoad(world: WorldState): Map<string, number> {
  const r = ECONOMY.availability.recurrence
  const out = new Map<string, number>()
  for (const row of world.injuryHistory) {
    const part = bodyPartOf(row.kind)
    if (part === null) continue
    const w = recurrenceWeightOf(row.severity) * recurrenceDecay(row.week, world.week)
    out.set(part, Math.min(r.loadCap, (out.get(part) ?? 0) + w))
  }
  return out
}

/**
 * THE FREQUENCY LIMB – `injuryTau *= this`. At the top of the ceiling it is +30% on the weekly
 * threshold («немного», his word), and it decays to nothing across three seasons.
 *
 * ⚠⚠ WEEKLY DOOR ONLY, AND THAT IS SAID OUT LOUD RATHER THAN GLOSSED. The measurement
 * (docs/specs/age-injury-curve-2026-08.md §2c) found the IN-MATCH RETIREMENT DOOR supplies 73-79% of
 * adult onsets and carries no age, physio or kit term at all, so a term added here reaches about a
 * fifth of her injuries. It is NOT extended to that door, and the reason is that the door's rate is
 * not ours to move: `RETIRE_K = 0.07` is calibrated against a published stoppage rate (2.73% of
 * matches, PLOS ONE 2024) and the owner reserved it explicitly on 11.08 – «RETIRE_K оставляем как
 * есть». Reaching it would also mean a new field on `MatchPlayer`, which is frozen into
 * `WorldMatch.a` for replay, i.e. the schema move #27 says this design does not need.
 *
 * ⭐ SO RECURRENCE REACHES BOTH DOORS BY THE OTHER TWO LIMBS INSTEAD, and that is the more important
 * half: `escalatedBands` and the region tilt both live inside `onsetInjury`, which is THE ONE INJURY
 * ONSET WRITER for the weekly roll and the retirement alike. The texture he asked for – the same
 * ankle again, and worse – lands on ~100% of her injuries. Only the TIMING limb is capped at the
 * weekly door's share, and that is a known, measured ceiling rather than an oversight.
 *
 * Pure state, zero draws.
 */
export function recurrenceTauFactor(world: WorldState): number {
  return 1 + ECONOMY.availability.recurrence.tauBump * recurrenceLoad(world)
}

/**
 * THE SEVERITY LIMB'S FACTOR – age x history, clamped at the sourced band's own top.
 *
 * Limb 1 of #27 («тяжесть надо взять точно, но разумно») is the age half: research §5c has the
 * severe share running 43% in adolescents against 54-66% in professionals, 1.26-1.53x, where every
 * INCIDENCE number in the sport shows no gradient at all. Limb 2's «или ее прогрессии (более
 * тяжелой)» is the history half, on the same instrument.
 *
 * ⚠ THE CLAMP IS THE «РАЗУМНО». `severityAgeFactor` tops out at 1.26 – the BOTTOM of the sourced
 * range, taken as a ceiling rather than as a target – and the history bump can add at most 20% on
 * top, so the product's own maximum (1.512) is clipped to `severityFactorCap` (1.5). Nothing in this
 * engine may push the severe share past what was published.
 *
 * Pure state, zero draws.
 */
export function severityEscalation(world: WorldState): number {
  const a = ECONOMY.availability
  const age = a.severityAgeFactor[kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)]
  const byAge = age ?? a.severityAgeFactor.default
  return Math.min(byAge * (1 + a.recurrence.severityBump * recurrenceLoad(world)), a.recurrence.severityFactorCap)
}

/**
 * ⭐ THE BANDS, RE-PRICED BY A FACTOR – and it moves the ODDS of getting above `minor`, never the
 * layoff lengths.
 *
 * Each band's TAIL probability (the chance of landing in it or anything worse) is multiplied by
 * `factor` and the cumulative thresholds are rebuilt from the tails, so a factor of 1.26 takes the
 * weekly table's P(worse than minor) from 40% to 50.4% and P(severe) from 2.5% to 3.15% – which is
 * exactly the shape §5c publishes. `weeksLo`/`weeksHi` are untouched, which restates round 16 #13's
 * own ruling: «What changes above moderate is how OFTEN you get there, never what it costs when you
 * do.» A stress reaction does not heal faster or slower because of the age of the body it happened
 * to.
 *
 * ⚠ MONOTONICITY IS STRUCTURAL, not asserted: tails are non-increasing in band order, scaling them
 * all by the same positive factor and clamping at 1 keeps them non-increasing, so the rebuilt
 * cumulatives stay non-decreasing and the last band still closes at exactly 1.
 *
 * ⚠ AND IT RETURNS THE SHIPPED ARRAY ITSELF AT `factor <= 1`, the same identity return
 * `tiltedBodyRegions` makes and for the same reason: a career that escalates nothing must compare
 * against byte-identical thresholds, not against thresholds that survived a float round trip.
 */
export function escalatedBands<T extends { cum: number }>(bands: readonly T[], factor: number): readonly T[] {
  if (factor <= 1 || bands.length === 0) return bands
  return bands.map((b, i) =>
    i === bands.length - 1 ? b : { ...b, cum: 1 - Math.min(1, (1 - b.cum) * factor) },
  )
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
  tau *= ageInjuryFactor(kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay))
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
    // ⚠ AND THE HOLIDAY STAND-DOWN RIDES IN THE SAME WAY (round-29 #20, the owner's ruling 5 of
    // 09.08): a booked family holiday stops the wear CLOCK, so her shoes come back off a fortnight
    // at the sea exactly as worn as they went, and this factor reads that. Still post-draw, still
    // arity-1, still spending nothing on any stream. ⚠⚠ It does NOT decide the injury half of that
    // ruling, which the owner left open on purpose - a LAYOFF is not a rest week here, only a
    // booked holiday is, and `gearRestWeeksOf` is empty for every career that never booked one.
    kitWearAt(
      world.seed,
      world.profile.background,
      world.week,
      kitFreshCap(world.offers, world.week),
      world.kit ?? null,
      gearRestWeeksOf(world),
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
  // ROUND 30 #27 – AND WHAT HER BODY HAS ALREADY BEEN THROUGH. Deliberately the same shape as every
  // multiply above it and as `kitInjuryFactor` in particular: POST-DRAW on the threshold, zero draws
  // on any stream, so the private `seed:injury:<week>` sequence is byte-identical for a career with
  // a clean record and the frozen MAIN capture (41550 / e6b0c709) cannot move. It reads
  // `injuryHistory`, which is a consequence of PLAY, so that property is not a nicety here – it is
  // the whole reason the mechanic is allowed to exist under invariant 2.
  //
  // `injuryChanceCap` below still caps it, and the factor is 1.0 exactly for every career that has
  // never been hurt and for every career whose last injury is three seasons behind her.
  tau *= recurrenceTauFactor(world)
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
    // THE MASSEUR'S REHAB CADENCE (travelling team step 1): every Nth week of an active layoff his
    // hands take ONE extra week off it – the one effect in this file the player can WATCH, because
    // it moves the "back in N weeks" already on screen, and each moment prints a receipt below.
    //
    // ⚠ DETERMINISTIC AND DRAW-FREE, deliberately: the cadence reads (week − sinceWeek), which
    // prior extra decrements cannot move, so this branch spends nothing on any stream and the
    // frozen MAIN capture (41550 / e6b0c709) cannot see it. A career with no masseur (every save
    // before v59, every hand-built probe world) takes the exact path it always took.
    //
    // ⚠ THE GUARD IS `weeksRemaining > 0`: an extra decrement may CLEAR the layoff a week early
    // (that is the product), but a layoff already clearing this tick has nothing left to save – no
    // receipt is printed for a week nobody bought. `masseurWorksThisWeek` keeps the paid week and
    // the bought week the same week (college and family holidays suspend both).
    //
    // ⚠ THE CADENCE IS THE RUNG'S OWN since the dial (step 2, `masseurRungOf`): every 3rd rehab
    // week at twice-a-week, every 2nd at every-other-day (step 1's measured arm), every week at
    // daily. And the NIGGLE RULE IS A GUARD NOW rather than an arithmetic accident: at N=2/3 a 1-2
    // week layoff could never meet the cadence, but the daily rung's N=1 could halve a two-week
    // soreness – so `totalWeeks > 2` states the honest rule («nobody massages a one-week soreness
    // away») structurally, at every rung, byte-identical for the two rungs that never needed it.
    if (world.injury.weeksRemaining > 0 && world.injury.totalWeeks > 2 && masseurWorksThisWeek(world)) {
      const rehabWeek = world.week - world.injury.sinceWeek
      if (rehabWeek > 0 && rehabWeek % masseurRungOf(world).rehabExtraEveryNWeeks === 0) {
        world.injury.weeksRemaining -= 1
        world.injury.weeksSaved = (world.injury.weeksSaved ?? 0) + 1
        addEvent(world, {
          week: world.week,
          type: 'info',
          text: 'Rehab ahead of schedule – the masseur bought a week back.',
        })
      }
    }
    if (world.injury.weeksRemaining <= 0) {
      const { kind, severity, totalWeeks } = world.injury
      // ⚠ THE RECORD KEEPS THE WEEKS SHE WAS ACTUALLY OUT. `totalWeeks` is the clinic's dealt
      // number; with a masseur the true absence is shorter, and a history row (or a career total,
      // or the ending hazard's prior-weeks sum) that counted the forecast instead of the fact
      // would erase his work from every ledger that matters. Identical to the old value whenever
      // `weeksSaved` is 0, and the key is written only when he saved something, so a career
      // without him serialises byte-for-byte as before.
      const weeksSaved = world.injury.weeksSaved ?? 0
      const actualWeeks = totalWeeks - weeksSaved
      world.injuryHistory.push({
        kind,
        severity,
        week: world.week,
        weeksOut: actualWeeks,
        ...(weeksSaved > 0 ? { weeksSaved } : {}),
      })
      if (world.injuryHistory.length > 20) world.injuryHistory.splice(0, world.injuryHistory.length - 20)
      // ⚠ AND THE MONOTONE TOTAL, BECAUSE THE LINE ABOVE THROWS HISTORY AWAY (v40, the audit's §6).
      // The career-ending injury reads the SUM of the layoffs a body has already been through, and
      // that sum was being taken over a list pruned to its last twenty rows - so the most broken
      // careers in the game were the ones whose accumulator quietly ran short. Measured over 90 full
      // careers: 13 reached the cap, 1.4% of onsets were judged against a total a mean of 6.1 weeks
      // light. Counted HERE, in the same branch that writes the history row, so the two can never
      // disagree about what "recovered" means. Pure state, zero draws.
      // `??=` for the hand-built probe worlds in tests that predate `careerTotals`.
      world.careerTotals ??= { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }
      world.careerTotals.weeksLostToInjury = (world.careerTotals.weeksLostToInjury ?? 0) + actualWeeks
      world.injury = null
      addEvent(world, {
        week: world.week,
        type: 'recovery',
        // The early return says so – the beat the receipts were building to. The plain line is the
        // shipped copy, byte-identical for every career without a masseur.
        text:
          weeksSaved > 0
            ? 'Back on court – cleared to play, ahead of schedule.'
            : 'Back on court – cleared to play.',
      })
    }
    return
  }

  const injuryRng = rngFromSeed(`${world.seed}:injury:${world.week}`)
  const roll = injuryRng() // unconditional every healthy week – only tau moves
  if (roll >= injuryTau(world)) return

  // ⚠ ROUND 30 #27 – THE WEEKLY DOOR NOW HANDS IN A TILTED TABLE TOO, where it used to hand in the
  // raw twelve. The tilt is the scars and nothing else (the week's sessions and the knock record are
  // the RETIREMENT door's tilts – she never took the court on an ordinary week, so there is no
  // in-match loading to read), and `recurrencePartLoad` returns an empty map for a clean record, so
  // `tiltedBodyRegions` gives back the shipped `BODY_REGIONS` ARRAY ITSELF and a career that has
  // never been hurt walks byte-identical cumulative sums. One pull either way.
  onsetInjury(world, injuryRng, 'week', tiltedBodyRegions(new Map(), [], recurrencePartLoad(world)))
}

/** WHERE AN INJURY COMES FROM. Two doors into the same body, and the distinction is the owner's
 *  ruling of 10.08 rather than a taxonomy: `'week'` is the ordinary weekly roll (between
 *  tournaments, or on arrival at one – she never takes the court, nothing counts); `'retirement'`
 *  is the one that happened ON COURT, mid-match, where the round she had already reached is hers.
 *  The BODY does not care which; the copy and the accounting do. */
export type InjuryCause = 'week' | 'retirement'

/**
 * WHICH SEVERITY TABLE THE DOOR DRAWS FROM (round 16 #13, the owner's ruling of 11.08). A table
 * lookup and nothing more – the branch point already existed, because `onsetInjury` has taken the
 * cause since the retirement slice.
 *
 * ⚠ THE WHOLE ARGUMENT LIVES ON `ECONOMY.availability.retirementSeverityBands`, band by band, and
 * it is not repeated here. The one-line version: the retirement hazard reads `spentness`, so it
 * fires on a girl who is spent rather than on a girl who broke, and the layoff it hands out should
 * be the one being spent actually costs. The weekly roll's table is untouched.
 *
 * ⚠ AND IT CANNOT MOVE A DRAW. Both tables are read AFTER the severity uniform has been pulled and
 * only decide what that already-drawn number MEANS – the same post-draw discipline `injuryTau`'s
 * multipliers and `ENDINGS.injuryPriorWeeksOut` are both built on. See the arity note in
 * `onsetInjury`.
 */
export function severityBandsFor(cause: InjuryCause) {
  const a = ECONOMY.availability
  return cause === 'retirement' ? a.retirementSeverityBands : a.severityBands
}

/**
 * THE ONE INJURY-ONSET WRITER. Sets `world.injury`, bills the scans, sweeps the entries and
 * practices the layoff swallows, captures the milestone, retires any live knock, and emits the news
 * line. Everything a career carries out of an injury is decided here, whichever door it came in by.
 *
 * ⚠ EXTRACTED, NOT REWRITTEN, and the draw ORDER is the reason that matters. `rollInjury` used to
 * hold this block inline and spent its pulls in exactly this sequence – severity, weeks-out, region –
 * off `seed:injury:<week>` after the occurrence roll. Moving it changes neither the generator, the
 * count, nor the order, so every existing career's injury timeline is byte-identical. The frozen
 * MAIN capture (41550 / e6b0c709) never saw this stream at all.
 *
 * `rng` is the generator to spend, `table` the body-region table to walk – three pulls from the
 * caller's stream, always in this order, always unconditionally.
 */
export function onsetInjury(
  world: WorldState,
  rng: Rng,
  cause: InjuryCause,
  table: readonly { part: string; weight: number }[],
): void {
  // ⚠ THE DOOR CHOOSES THE TABLE, AND THAT IS THE ONLY THING ROUND 16 CHANGED HERE (#13). It is a
  // lookup, not a branch in the draw: the uniform below is pulled unconditionally either way, and
  // `pickInt`/`drawBodyRegionFrom` each take exactly one pull for any range and any table. The arity
  // note below still holds to the letter – three pulls, this order, always.
  //
  // ⚠ AND ROUND 30 #27 RE-PRICES THAT TABLE BEFORE THE UNIFORM IS PULLED, which is the same
  // statement wearing a second hat: `escalatedBands` is pure state (age and `injuryHistory`), it runs
  // ABOVE the `rng()` below, and all it changes is the numbers the already-drawn uniform is compared
  // against. The arity note holds to the letter – three pulls, this order, always – and it holds at
  // BOTH doors, because this is the one onset writer and the escalation lives here rather than at
  // either call site.
  const bands = escalatedBands(severityBandsFor(cause), severityEscalation(world))
  const sevRoll = rng()
  const band = bands.find((b) => sevRoll < b.cum) ?? bands[bands.length - 1]
  let weeksOut = pickInt(rng, band.weeksLo, band.weeksHi)
  // W4 – THE THREAD'S BILL. When she is mid-push on a knock, the injury lands on THAT part. This is
  // the payoff the accumulating thread exists for: a career that keeps sending her back out does not
  // collect a series of unrelated Fridays, it breaks the shoulder it has been ignoring, and the news
  // line says so in as many words.
  //
  // ⚠ A POST-DRAW OVERRIDE, NOT A SKIPPED DRAW. `drawBodyRegionFrom` still spends its one pull exactly
  // where it always did – the override replaces the RESULT, so the caller's sequence is
  // byte-identical and every downstream draw (there are none after this, but the property is what
  // makes it safe) keeps its position. A career with no knock is untouched, so nothing shipped moves.
  //
  // ⚠ AND THE TILT RIDES ON THE TABLE, NOT ON A SECOND DRAW (docs/specs/match-retirement.md §5). The
  // retirement door hands in `tiltedBodyRegions(...)` – the same twelve parts, re-weighted toward
  // what the week loaded and what the record has already broken. One uniform in, one part out, at
  // this line, exactly as before.
  const drawnPart = drawBodyRegionFrom(rng, table)
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
      // ⚠ AND IT SAYS SO ON THE PAPER (fix/outgrown-entry, 05.08). This is the DESK acting, not the
      // parent - so the letter it raises must not come back reading "Your withdrawal is confirmed".
      // See the note on `releaseEntry`: the reason is the difference between a record and a lie.
      releaseEntry(world, id, 'injury')
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
  // ⚠ THE RETIREMENT GETS ITS OWN SENTENCE, AND NOT BECAUSE IT IS A DIFFERENT INJURY. The owner,
  // 10.08: «не забудь про соответствующие записочки по итогам недели если была травма с учетом
  // момента, когда она была». The MOMENT is the whole of what makes these weeks different – the same
  // ankle, the same five weeks out, and one of them happened in a car park and the other happened in
  // front of an umpire with a set and a half already on the board. Reusing "Injury: ankle strain –
  // out ~5 wks" here would be stretching a sentence over a situation it was not written for: it says
  // nothing about the match she was in, so the news feed would carry a retirement and a Tuesday in
  // identical words. The three retirement lines below are new; the four ordinary ones above them are
  // the shipped copy, untouched.
  addEvent(world, {
    week: world.week,
    type: 'injury',
    text:
      cause === 'retirement'
        ? band.severity === 'severe'
          ? `She stopped, and this time it is serious: ${kind} – out ~${wks}. The dream takes a hit.`
          : pushing
            ? `She had to stop: ${kind} – out ~${wks}. The knock we trained through, in front of everybody.`
            : `She had to stop: ${kind} – out ~${wks}.`
        : band.severity === 'severe'
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

/**
 * SHE STOPPED ON COURT. The injury behind a mid-match retirement, opened at `finalizeTournament`
 * once the run has committed.
 *
 * ⚠ IT IS THE ORDINARY INJURY MODEL THROUGH A DIFFERENT DOOR, and that is a deliberate choice with
 * the research behind it (docs/research/retirement-and-withdrawal.md §10.2: "the cheapest coherent
 * model is that a retirement IS an injury onset that happened to land during a played week, and the
 * layoff that follows is the ordinary one. Nothing in the rules argues against that."). Same onset
 * writer, same weeks-out draw, same scans, same entry sweep, same recovery. A second layoff model
 * would have been a second thing to balance for no fiction anybody could feel.
 *
 * ⚠ RESTATED, NOT LEFT LYING – THE ONE CLAUSE THAT IS NO LONGER TRUE (round 16 #13). This note used
 * to open with "Same severity bands", and since 11.08 it is not: the door draws from
 * `ECONOMY.availability.retirementSeverityBands`, which is skewed short (80/15/4/1 against the
 * weekly 60/30/7.5/2.5). The paragraph above still holds in every other respect and the reasoning
 * behind it is unchanged – what moved is the ODDS, on the argument that this hazard reads
 * `spentness` and therefore fires on a girl who is spent rather than on one who broke. The
 * measurement that forced it is docs/specs/round16-injuries.md §9; `severityBandsFor` is the lookup
 * and the knob carries the band-by-band argument.
 *
 * ⚠ ITS OWN STREAM, `seed:retire:<week>`, and the alternative was a bug. `seed:injury:<week>` has
 * ALREADY been opened this week by `rollInjury` – which found her healthy and returned after one
 * pull – so re-deriving it here would hand back that same first uniform as this injury's severity
 * roll. Not merely correlated: the severity of every retirement would be a function of the number
 * that had just decided she was fit. A private purpose-scoped stream, re-derived at the call site
 * and persisting nothing, is the pattern this file's header already requires; the frozen MAIN
 * capture (41550 / e6b0c709) cannot see it.
 *
 * ⚠ AND IT LANDS WHERE SHE WORKED – `tiltedBodyRegions` off the week's sessions and the parts the
 * record already shows her being sent back out on. NO NEW DRAW: the same single uniform is walked
 * against a different table. See the note above `tiltedBodyRegions` in body.ts.
 */
export function retirementInjury(world: WorldState): void {
  onsetInjury(
    world,
    rngFromSeed(`${world.seed}:retire:${world.week}`),
    'retirement',
    // ⚠ AND THE SCARS RIDE ON THE SAME TABLE (round 30 #27), which is why recurrence reaches this
    // door at all: a third tilt on the twelve parts, not a second draw. See `recurrenceTauFactor` for
    // what does NOT reach this door and why (`RETIRE_K` is owner-reserved and calibrated to a
    // published stoppage rate, so the door's RATE is untouched – only where it lands and how hard).
    tiltedBodyRegions(
      loadedPartShares(planWeek(world.plan)),
      pushedParts(world.knockHistory),
      recurrencePartLoad(world),
    ),
  )
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
