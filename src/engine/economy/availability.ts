// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/availability.md#the-availability-block

import type { InjurySeverity } from '../../shared/protocol'
import type { TierId } from '../season/types'

// The availability gate: the minimum condition to ENTER each tier, and the school-exam blackout
// blocks (season-week offsets, blacked out for tournaments). Off-season weeks (49-51) are already
// event-free and are treated as blackout too (see isBlackoutWeek in world.ts).
export const availability = {
  // The soft fatigue floor per tier, one step per rung (the J levels extrapolate above national,
  // matching tierMatchFatigue). Racing below the floor is still ALLOWED – it raises a caution,
  // never a block (the owner's "the parent may push, the game warns").
  //
  // ⚠ availability.minConditionToEnter: THE W FLOORS MOVED WITH THE SURCHARGES (R15-6, same ruling, same date - see tierMatchFatigue).
  // ⚠⚠ availability.minConditionToEnter: THAT PAIRING IS RETIRED AS OF W2-FATIGUE, AND THIS TABLE IS DELIBERATELY UNCHANGED.
  // → docs/notes/economy/availability.md#availabilityminconditiontoenter
  minConditionToEnter: {
    local: 20, regional: 30, national: 40,
    j30: 45, j60: 50, j300: 55,
    w15: 50, w35: 55, w50: 55, w75: 60, w100: 60, wta125: 60,
    // ⚠ W3-ACT2 KEEPS THE W FAMILY'S CEILING AT 60 AND DELIBERATELY DOES NOT RAISE IT, which is
    // the one place the top four rungs decline a step the tables below them would suggest. This
    // is ARRIVAL SAFETY - how fresh she must BE to start a week, the question W2-FATIGUE separated
    // from what the week COSTS (that half did step: see tierMatchFatigue above). From here up she
    // is not free to decline: §6's mandatory regime obliges a top-50 player to turn up at the four
    // Slams, the 1000s and six 500s or take penalty points for it. A floor that refused her entry
    // to an event she is REQUIRED to attend would manufacture penalties out of a knob nobody asked
    // to move, and «мы ни за что не наказываем» governs. The tour may punish; a tuning number
    // may not.
    wta250: 60, wta500: 60, wta1000: 60, slam: 60,
  } as Record<TierId, number>,
  examWeeks: [[23, 24]] as [number, number][], // season-week offsets blacked out for school
  // Moved off 24-25 when the surface blocks landed: week 25 is the FIRST week of the grass
  // window (25-30), so the old placement ate 1 of only 6 grass weeks a year - a real cost to a
  // serve-first build, for no design reason. 23-24 is also truer: school ends, THEN grass.

  // THE DOCTOR'S VETO (owner idea R9-19b, cashed in by the Wave-2 fatigue bench 26.07): the one
  // place where "the parent may push, the game warns" yields to medicine. Below this condition
  // entering a tournament is a HARD block (availabilityStatus level 'blocked', reason
  // 'medical'); at or above it, fatigue stays the SOFT caution it has always been.
  // → docs/notes/economy/availability.md#availabilitymedicalfloor-2
  medicalFloor: 15,
  // ...and the band ABOVE the floor where the doctor talks but does not act – the owner's own
  // framing: "с состоянием 20 врач вполне может сказать «я вас предупреждаю о последствиях,
  // формально запретить не могу»". In [medicalFloor, medicalWarningCeiling) she PLAYS and a
  // warning beat carries his line; the philosophy stays "the parent may push, the game warns".
  // Knob-driven: set it to medicalFloor (or lower) to silence the warning without touching the
  // veto, or raise it to make the doctor nag earlier.
  medicalWarningCeiling: 25,

  // Season-Life slice C: fatigue-driven injury risk. ALL of these move only the post-draw
  // threshold tau (or pull from the private per-week `seed:injury:week` sub-stream) – the MAIN
  // weekly draw sequence stays byte-identical (the C1 invariance test guards it).
  //
  // ⚠⚠ availability.injuryBaseChance: ALL THREE RE-CALIBRATED 03.08 (W2-FATIGUE, docs/specs/fatigue-reprice-2026-08.md §5)
  // owner (availability.injuryBaseChance): «у нас же там еще риск травм растет, как бы мы себе в ногу не стрельнули усталостью»
  // ⚠ availability.injuryBaseChance: ORDER OF WORK, honoured: the fatigue re-price landed and was MEASURED FIRST, in its own commit…
  // ⚠ availability.injuryBaseChance: AND EVERY ONE OF THESE IS STILL A POST-DRAW THRESHOLD MULTIPLY
  // → docs/notes/economy/availability.md#availabilityinjurybasechance
  injuryBaseChance: 0.003, // per healthy week at condition 100
  injuryFatigueSlope: 0.00015, // + per fatigue point (100 - condition)
  injuryPlayingMultiplier: 1.4, // tau *= this the week she competes
  // R12-4/11 (owner playtest 27.07: "injured ON a family vacation", TWICE in one career). A
  // resort week used to roll the SAME dice as a training week – `rollInjury` reads fatigue, age,
  // trailing load and whether she is competing, and a booked vacation touched none of them, so
  // the week she is furthest from a tennis court was as dangerous as the week she is grinding.
  // → docs/notes/economy/availability.md#availabilityinjuryvacationfactor
  injuryVacationFactor: 0.25,
  injuryChanceCap: 0.12,
  // Owner research 25.07 (docs/research/injury-stats-by-age.md): girl injury-age curve peaks at
  // 16. Mild by design – the base is already anchored to real junior prevalence (46-54%/season).
  // ⚠ 13 IS EXPLICIT NOW, AND IT DELIBERATELY CHANGES NOTHING.
  //
  // ⚠⚠ availability.ageInjuryFactor: THE ADULT LIMB LANDED 30.08 (round 30 #26/#27), AND THE NUMBERS BELOW ARE THE FITTED ONES
  // ⚠ availability.ageInjuryFactor: THE LEVEL MOVED WITH THE SHAPE ON PURPOSE
  // → docs/notes/economy/availability.md#availabilityageinjuryfactor
  ageInjuryFactor: {
    13: 0.6, 14: 0.63, 15: 0.74, 16: 0.84, 17: 0.74, 18: 0.67,
    19: 0.25, 20: 0.25, 21: 0.25, 22: 0.25, 23: 0.25, 24: 0.25,
    25: 0.25, 26: 0.25, 27: 0.25,
    28: 0.29, 29: 0.32, 30: 0.36, 31: 0.39, 32: 0.43, 33: 0.46,
    default: 0.5,
  } as {
    [age: number]: number
    default: number
  },
  // Competed weeks in the trailing 4 (incl. this one) -> overuse multiplier. Index = count.
  consecutivePlayFactor: [1.0, 1.0, 1.2, 1.5, 1.8] as number[],
  // Cumulative over the severity draw (owner split 60/30/10; the 10% "heavy" splits
  // 7.5 major / 2.5 severe).
  //
  // ⚠ THIS IS THE WEEKLY ROLL'S TABLE AND ONLY THE WEEKLY ROLL'S, since round 16. The retirement
  // door draws from `retirementSeverityBands` below – see the note there for the argument, the
  // measurement and the owner's ruling. Nothing about THIS table moved.
  severityBands: [
    { cum: 0.6, severity: 'minor', weeksLo: 1, weeksHi: 2 },
    { cum: 0.9, severity: 'moderate', weeksLo: 3, weeksHi: 6 },
    { cum: 0.975, severity: 'major', weeksLo: 8, weeksHi: 14 },
    { cum: 1.0, severity: 'severe', weeksLo: 16, weeksHi: 22 },
  ] as { cum: number; severity: InjurySeverity; weeksLo: number; weeksHi: number }[],

  // THE RETIREMENT DOOR'S OWN SEVERITY TABLE (round 16 #13) – THE OWNER, 11.08: «RETIRE_K
  // оставляем как есть, дверь схода надо показывать, а 3 мощные травмы 6-4-4 недели подряд одна
  // за одной – это слишком… это значит, что у нас с механикой что-то не то. Это надо чинить.» So
  // the RATE does not move – `RETIRE_K = 0.07` is on its own measured calibration
  // (docs/specs/match-retirement.md §4) and is untouched – and the door stays visible.
  //
  // ⚠ availability…retirementSeverityBands: ZERO DRAWS ADDED OR REMOVED, WHICH IS WHY NO CAREER RE-BASES.
  // ⚠ availability…retirementSeverityBands: AND THE FOUR SEVERITY LABELS ARE THE SAME FOUR.
  // → docs/notes/economy/availability.md#availabilityretirementseveritybands
  retirementSeverityBands: [
    { cum: 0.8, severity: 'minor', weeksLo: 1, weeksHi: 2 },
    { cum: 0.95, severity: 'moderate', weeksLo: 3, weeksHi: 5 },
    { cum: 0.99, severity: 'major', weeksLo: 8, weeksHi: 14 },
    { cum: 1.0, severity: 'severe', weeksLo: 16, weeksHi: 22 },
  ] as { cum: number; severity: InjurySeverity; weeksLo: number; weeksHi: number }[],

  // SEVERITY BY AGE (round 30 #27 limb 1, the owner 30.08: «тяжесть надо взять точно, но
  // разумно») – ⭐⭐ THIS IS THE BEST-SOURCED OF THE THREE LIMBS, and it is a different instrument
  // from `ageInjuryFactor` above.
  //
  // ⚠ availability.severityAgeFactor: «РАЗУМНО» IS HIS WORD AND IT IS APPLIED AS A CEILING, NOT AS A TARGET.
  // ⚠ availability.severityAgeFactor: IT SCALES THE BANDS' CUMULATIVE THRESHOLDS AND NEVER THE LAYOFF LENGTHS.
  // ⚠ availability.severityAgeFactor: AND IT CANNOT MOVE A DRAW.
  // → docs/notes/economy/availability.md#availabilityseverityagefactor
  severityAgeFactor: {
    13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1,
    19: 1.13, 20: 1.13, 21: 1.13, 22: 1.13, 23: 1.13, 24: 1.13,
    25: 1.13, 26: 1.13, 27: 1.13,
    28: 1.15, 29: 1.17, 30: 1.19, 31: 1.2, 32: 1.22, 33: 1.24,
    default: 1.26,
  } as { [age: number]: number; default: number },

  // RECURRENCE (round 30 #27 limb 2) – THE OWNER, 30.08: «раз мы храним историю травм у себя, то
  // вполне можно делать алгоритм, который будет увеличивать немного вероятность новой такой же
  // травмы или ее прогрессии (более тяжелой). Мне кажется это похоже на правду.» It is the
  // strongest of his three, because PREVIOUS INJURY IS THE BEST-ESTABLISHED RISK FACTOR IN
  // SPORTS-INJURY EPIDEMIOLOGY – ahead of age and ahead of load.
  //
  // owner (availability.recurrence): «ни одной травмы я не видел уже несколько сезонов»
  // ⚠⚠ availability.recurrence: THE CEILING AND THE DECAY ARE THE DESIGN, NOT A SAFETY RAIL BOLTED ON AFTERWARDS
  // owner (availability.recurrence): «мы ни за что не наказываем»
  // ⚠ availability.recurrence: NO SCHEMA MOVE.
  // → docs/notes/economy/availability.md#availabilityrecurrence
  recurrence: {
    /** Weight one recovered layoff contributes at zero decay, by what it was. A niggle is a fact
     *  about a week; a tear is a fact about a body, and the ladder says so. */
    severityWeight: { minor: 0.4, moderate: 0.7, major: 1, severe: 1 } as Record<InjurySeverity, number>,
    halfLifeWeeks: 52,
    loadCap: 1,
    /** HOW MUCH MORE LIKELY, at full load – `injuryTau *= 1 + tauBump x load`. «Немного» is his
     *  word: +30% on the weekly threshold at the very top of the ceiling, decaying to nothing
     *  across three seasons. ⚠ WEEKLY DOOR ONLY, and that is stated rather than hidden – see the
     *  note on `recurrenceTauFactor` for why the retirement door's RATE is not touched. */
    tauBump: 0.3,
    /** ...and how much worse it lands – the same `load`, into the same `escalatedBands` the age
     *  factor uses, so a body with a recent history draws from a shifted table at BOTH doors. */
    severityBump: 0.2,
    /** THE CEILING ON THE PRODUCT `severityAgeFactor x (1 + severityBump x load)`, and it is the
     *  sourced band's own top: 1.26 x 1.2 = 1.512, so this clamp binds only in the last decimal
     *  and exists to make the guarantee structural. Nothing in this engine may push the severe
     *  share past what §5c published. */
    severityFactorCap: 1.5,
    /** How far a part the record has ALREADY broken is tilted in the region draw, at full load for
     *  that part. Sits between `BODY_AIM_TILT` (2.0, what she drilled) and `BODY_PUSHED_TILT`
     *  (2.6, a knock he sent her back out on): a healed injury is a stronger statement than a
     *  training week and a weaker one than a joint that gave way while being ignored. ⚠ A TILT,
     *  NOT A RISK – `tiltedBodyRegions` renormalises, so this moves WHERE it lands and never how
     *  often, at BOTH doors. */
    partTilt: 2.3,
  },
} as const
