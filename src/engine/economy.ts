// The economy tuning surface – the owner's "ручки регулировки" (regulator knobs).
//
// Every tunable number that shapes the weekly cash flow lives HERE, in one exported
// ECONOMY object, so world.ts and the calibration tests read the SAME source of truth
// (no duplicated magic numbers). Difficulty presets (later) plug in by swapping this
// object; nothing else in the engine needs to know a number changed.
//
// RNG discipline: none of these values may change the per-week draw COUNT on the MAIN
// weekly stream (the cohort-drift identity test guards it). Gear line-items therefore draw
// only from PURPOSE-SCOPED sub-streams (`rngFromSeed(seed + ':gear:' + category)`), never
// from the tick's main rng; parent income / expense factors / sponsor eligibility are pure
// look-ups or post-draw scalings that leave the draw sequence untouched.

import { rngFromSeed, pickInt } from './rng'
import type { CoachSetup, FamilyBackground, InjurySeverity } from '../shared/protocol'
import type { TierId } from './season/types'

/** The four recurring gear line-items. rackets/shoes/apparel report under the 'gear'
 *  breakdown category; stringing gets its own 'stringing' category (it recurs far more
 *  often, so the owner wants it split out on the Money pie). */
export type GearCategory = 'rackets' | 'stringing' | 'shoes' | 'apparel'
export const GEAR_CATEGORIES: readonly GearCategory[] = ['rackets', 'stringing', 'shoes', 'apparel']

export interface GearLine {
  /** breakdown category this line reports under */
  breakdown: 'gear' | 'stringing'
  /** [min,max] weeks between purchases, drawn per purchase from the gear sub-stream
   *  (min === max ⇒ a fixed cadence, e.g. stringing / quarterly apparel) */
  cadenceWeeks: Record<FamilyBackground, [number, number]>
  /** [min,max] price in whole cents, drawn per purchase */
  priceCents: Record<FamilyBackground, [number, number]>
  /** event flavor naming the item tier (owner: "Restring – tour gut" vs "budget synthetic") */
  flavor: Record<FamilyBackground, string>
}

// THE app-level wealth-price corridor (owner canon, 25.07): the same [lo, hi] factor band per
// family background prices travel (ECONOMY.travelBgFactor), every medical bill
// (ECONOMY.physio.medicalBgFactor) and the weekly coaching/review expense (world.ts
// resolveBaseCosts, roll from `seed:coachbg:week`) – all three reference this ONE object.
// Framing: working = public clinics / budget trips, middle = standard, wealthy = private
// everything. Retuned when real incomes (prize money) land – this constant is the single knob.
const WEALTH_CORRIDOR = {
  working: [0.7, 0.8],
  middle: [0.95, 1.05],
  wealthy: [1.2, 1.3],
} as Record<FamilyBackground, [number, number]>

export const ECONOMY = {
  /** The canonical wealth-price corridor – see WEALTH_CORRIDOR above. */
  wealthCorridor: WEALTH_CORRIDOR,

  // Weekly parent contribution to the war chest, by family background. Emitted as an
  // `income` event BEFORE costs each week; NO rng draw. TUNED (round-7 economy pass) so
  // that an UNSPONSORED kid (rank > 30 all year, no tournaments) lands the owner's target
  // 52-week net-burn bands: working $4.5–7k, middle $9–14k, wealthy $14–22k. Wealthy's
  // huge weekly support was the "profits feel too easy" driver – the gear/factor/sponsor
  // knobs alone can't make an $800/wk-funded season burn, so the contribution comes down
  // (they still front-load a large STARTING reserve; see world.ts STARTING_FUNDS_CENTS).
  // Working is unchanged – it already sat in-band.
  parentIncomeCents: {
    wealthy: 430_00,
    middle: 300_00,
    working: 245_00,
  } as Record<FamilyBackground, number>,

  // Weekly base ("coaching") expense draw range in cents, by coaching setup. A parent-coach
  // saves on fees. The draw COUNT is one pickInt per tick regardless of setup/background.
  // Background scaling happens AFTER the pickInt via the wealth corridor: one uniform roll from
  // the private `seed:coachbg:week` sub-stream maps into wealthCorridor[background] (see
  // world.ts resolveBaseCosts) – a post-draw multiply, so the main-stream draw sequence never
  // depends on background. (Wealth-corridor unification: this replaced the fixed bgExpenseFactor
  // 0.8/1.0/1.4 – middle's exact ×1.0 pin to the pre-round-7 baseline ended DELIBERATELY, middle
  // now breathes ±5% weekly like every other corridor-priced bill.)
  expenseRangeCents: {
    hired: [250_00, 700_00],
    parent: [120_00, 400_00],
  } as Record<CoachSetup, [number, number]>,

  // Travel scales with family means (wealthier travel = pricier + a money-sink; poorer = cheaper),
  // and the owner wants the price to sit in a CORRIDOR for every trip, not on a fixed multiplier.
  // A per-event uniform roll (from a purpose-scoped sub-stream keyed by the event – see calendar.ts)
  // maps into the band: `factor = lo + roll * (hi - lo)`. The corridors are disjoint
  // (working ≤ 0.80 < middle ≥ 0.95 ≤ 1.05 < wealthy ≥ 1.20) so, drawn off the SAME roll,
  // working < middle < wealthy holds per trip, not just on average. POST-draw multiply only – the
  // travel pickInt in calendar.ts stays byte-identical, so the season sub-RNG (and the world's RNG
  // identity) hold. The bands ARE the canonical app-level corridor (kept under its historical
  // export name so call sites stay stable).
  travelBgFactor: WEALTH_CORRIDOR,

  // Weekly expense scale from the time split: train 75% ≈ 1.0, more training costs more.
  // factor = base + perTrainPercent * plan.train.
  planFactor: { base: 0.55, perTrainPercent: 0.006 },

  // Local sponsor cameo. The weekly ROLL is unchanged (draw count!), but round-7 b makes the
  // payout NEED-BASED: only a `working`-background kid actually banks it – for everyone else
  // the roll result is ignored (no event), the draws still happen so the main stream is
  // background-independent. Amounts unchanged.
  sponsor: {
    rollChance: 0.06,
    amountCents: [500_00, 1500_00] as [number, number],
    eligible: ['working'] as FamilyBackground[],
  },

  // Product-sponsorship valve v1 (round-7 amendment) – the "painful but survivable"
  // counter-force. A kid whose rank AT PURCHASE TIME is good enough gets her gear subsidised:
  //   rank ≤ freeMaxRank  → the line-item is $0 ("… – covered by your racket sponsor")
  //   rank ≤ halfPriceMaxRank → the line-item is halved (" – sponsor covers half")
  // The event is STILL emitted (amount 0/half) with its gear/stringing category, so the Money
  // breakdown shows the sponsor relationship rather than the line simply vanishing.
  sponsorship: { halfPriceMaxRank: 30, freeMaxRank: 10 },

  // Recurring gear purchases, scheduled DETERMINISTICALLY off a purpose-scoped sub-stream per
  // category (never the main weekly stream). Cadence + price are drawn from that sub-stream.
  gear: {
    rackets: {
      breakdown: 'gear',
      cadenceWeeks: { working: [14, 18], middle: [12, 16], wealthy: [10, 12] },
      priceCents: { working: [60_00, 120_00], middle: [180_00, 280_00], wealthy: [480_00, 650_00] },
      flavor: {
        working: 'New racket – used, off the classifieds',
        middle: 'New racket – current retail model',
        wealthy: 'New racket – custom pro stock',
      },
    },
    stringing: {
      breakdown: 'stringing',
      cadenceWeeks: { working: [4, 4], middle: [3, 3], wealthy: [2, 2] },
      priceCents: { working: [18_00, 30_00], middle: [28_00, 45_00], wealthy: [45_00, 70_00] },
      flavor: {
        working: 'Restring – budget synthetic',
        middle: 'Restring – multifilament',
        wealthy: 'Restring – tour gut',
      },
    },
    shoes: {
      breakdown: 'gear',
      cadenceWeeks: { working: [10, 14], middle: [10, 14], wealthy: [10, 14] },
      priceCents: { working: [60_00, 90_00], middle: [100_00, 150_00], wealthy: [170_00, 240_00] },
      flavor: {
        working: "New shoes – last season's model",
        middle: 'New shoes – mid-range performance',
        wealthy: 'New shoes – top-line, fitted',
      },
    },
    apparel: {
      breakdown: 'gear',
      cadenceWeeks: { working: [13, 13], middle: [13, 13], wealthy: [13, 13] },
      priceCents: { working: [40_00, 70_00], middle: [110_00, 160_00], wealthy: [260_00, 380_00] },
      flavor: {
        working: 'Apparel refresh – club basics',
        middle: 'Apparel refresh – brand kit',
        wealthy: 'Apparel refresh – full designer kit',
      },
    },
  } as Record<GearCategory, GearLine>,

  // R9-1: weekly deterministic savings interest on a POSITIVE balance, credited on the
  // carried-in funds as each week opens (before any of the week's flows). ~3.1%/yr – a
  // realistic family savings account. round(fundsCents × apyWeekly), emitted only when
  // >= 1 cent as an `income` event under the dedicated 'interest' category. Zero RNG.
  savings: { apyWeekly: 0.0006 },

  // Season-Life condition accumulator (0..100, 100 = fresh). Pure INTEGER arithmetic –
  // accrueCondition draws ZERO main-stream RNG, so none of these can shift the weekly draw
  // sequence (the B1 invariance test guards it).
  //
  // Round-9 OWNER REDESIGN (replaces the old restBase/restSlope/trainSlope plan formula AND
  // the flat per-tier tournamentStrain – everything integer, no fractions):
  //  - FATIGUE comes from MATCHES, per kid match played (world.ts matchDrain, applied when the
  //    run COMMITS at finalizeTournament): straight sets with no tiebreak = 1; a 3-setter OR a
  //    tiebreak in a 2-setter = 2; +1 more when the match had MORE than 2 tiebreak sets (a
  //    three-TB epic) – max 3; plus the tier surcharge PER MATCH below. Hardest national
  //    match = 3 + 2 = 5, so a five-match National run maxes at 25 (the owner's own check).
  //  - RECOVERY comes from TIME: recoveryBase every week, always; on a week with NO kid match
  //    the train/rest slider adds restRecoveryBonus (threshold-based on plan.rest – the 60/40
  //    preset earns +2, 75/25 earns +1, the 85/15 grind earns 0; NEVER interpolated); physio
  //    adds ECONOMY.physio.conditionBonusPerWeek; a blackout week (off-season / exams) adds
  //    blackoutBonus. condition = clamp(condition + recovery − matchDrain, 0, 100).
  condition: {
    start: 100,
    min: 0,
    max: 100,
    recoveryBase: 2, // every week, always
    // Match-free weeks only, first matching threshold wins (descending): the slider stays
    // meaningful – money (planFactor), future skill growth, and recovery pacing.
    restRecoveryBonus: [
      { minRest: 40, bonus: 2 },
      { minRest: 25, bonus: 1 },
    ] as { minRest: number; bonus: number }[],
    blackoutBonus: 1, // off-season (weeks 49-51) and exam weeks (replaces the old offSeasonGain)
    // Per-match drain components (see world.ts matchDrain).
    matchFatigue: { straightSets: 1, hardMatch: 2, extraTiebreaks: 1 },
    // Tier surcharge PER MATCH. itf is EXTRAPOLATED (+3) – the tier is locked in Phase 3, so
    // the owner has never priced it; revisit when ITF unlocks.
    tierMatchFatigue: { local: 0, regional: 1, national: 2, itf: 3 } as Record<TierId, number>,
    // R9-19: coupling ON, owner curve – NO penalty while condition >= knee (fresh enough),
    // then linear down to `floor` at condition 0:
    //   condFactor = condition >= knee ? 1.0 : floor + (1 − floor) × condition / knee.
    // The kid's MatchPlayer scales by it on the EVENT-scoped `seed:kidtour` stream only; the
    // slice-B fast-follow the owner proved necessary (won a Regional at 0 condition).
    matchStrengthKnee: 70,
    matchStrengthFloor: 0.55,
  },

  // The availability gate: the minimum condition to ENTER each tier, and the school-exam blackout
  // blocks (season-week offsets, blacked out for tournaments). Off-season weeks (49-51) are already
  // event-free and are treated as blackout too (see isBlackoutWeek in world.ts).
  availability: {
    minConditionToEnter: { local: 20, regional: 30, national: 40, itf: 45 } as Record<TierId, number>,
    examWeeks: [[24, 25]] as [number, number][], // season-week offsets blacked out for school

    // Season-Life slice C: fatigue-driven injury risk. ALL of these move only the post-draw
    // threshold tau (or pull from the private per-week `seed:injury:week` sub-stream) – the MAIN
    // weekly draw sequence stays byte-identical (the C1 invariance test guards it).
    injuryBaseChance: 0.006, // per healthy week at condition 100
    injuryFatigueSlope: 0.0009, // + per fatigue point (100 - condition)
    injuryPlayingMultiplier: 1.8, // tau *= this the week she competes
    injuryChanceCap: 0.12,
    // Owner research 25.07 (docs/research/injury-stats-by-age.md): girl injury-age curve peaks at 16.
    // Mild by design – the base is already anchored to real junior prevalence (46-54%/season).
    ageInjuryFactor: { 14: 0.9, 15: 1.05, 16: 1.2, 17: 1.05, 18: 0.95, default: 0.85 } as {
      [age: number]: number
      default: number
    },
    // Competed weeks in the trailing 4 (incl. this one) -> overuse multiplier. Index = count.
    consecutivePlayFactor: [1.0, 1.0, 1.2, 1.5, 1.8] as number[],
    // Cumulative over the severity draw (owner split 60/30/10; the 10% "heavy" splits
    // 7.5 major / 2.5 severe).
    severityBands: [
      { cum: 0.6, severity: 'minor', weeksLo: 1, weeksHi: 2 },
      { cum: 0.9, severity: 'moderate', weeksLo: 3, weeksHi: 6 },
      { cum: 0.975, severity: 'major', weeksLo: 8, weeksHi: 14 },
      { cum: 1.0, severity: 'severe', weeksLo: 16, weeksHi: 22 },
    ] as { cum: number; severity: InjurySeverity; weeksLo: number; weeksHi: number }[],
  },

  // Season-Life slice C: physio + medical costs. ALL prices are MIDDLE-anchored bands. Every
  // medical bill (weekly rehab, one-time onset treatment, physio retainer) draws its base amount
  // from its band, then multiplies by one uniform roll mapped into medicalBgFactor[background] –
  // the SAME wealth-corridor principle as travelBgFactor (owner 25.07: working = public clinics /
  // school resources, middle = standard care, wealthy = private clinics). The roll comes from the
  // SAME `seed:physio:week` generator (post-draw multiply on a private sub-stream – invariance-safe).
  physio: {
    medicalBgFactor: WEALTH_CORRIDOR, // the canonical app-level corridor, not a private copy
    rehabPerWeekCents: [60_00, 120_00] as [number, number],
    // One-time scans/treatment at onset (owner table, deliberately compressed so the severe tail
    // stays brutal-but-survivable for 8k; OWNER-TUNABLE – real surgery $20k+ needs an insurance
    // valve first). minor = no onset bill (rehab-only).
    onsetCostCents: {
      minor: [0, 0],
      moderate: [200_00, 500_00],
      major: [1000_00, 2500_00],
      severe: [4000_00, 8000_00],
    } as Record<InjurySeverity, [number, number]>,
    retainerPerWeekCents: [45_00, 70_00] as [number, number], // middle-anchored; the corridor produces the tiering
    riskReduction: 0.76, // tau *= this when physioActive (24% cut)
    recoverySpeedup: 0.12, // weeksOut *= (1 - this), min 1, when physioActive
    // R9-14: the billed retainer finally shows on the bar – accrueCondition adds this flat
    // weekly recovery while physioActive. Integer (owner said "1 or 2"; 2 for visible value).
    conditionBonusPerWeek: 2,
  },
} as const

/** Weekly base-expense scale from the time split (more training ⇒ higher cost). */
export function planExpenseFactor(trainPercent: number): number {
  return ECONOMY.planFactor.base + ECONOMY.planFactor.perTrainPercent * trainPercent
}

export interface GearHit {
  week: number
  amountCents: number
}

/** Every gear purchase for one category up to and including `uptoWeek`, generated from the
 *  category's PURPOSE-SCOPED sub-stream (independent of the main weekly stream and of the
 *  player's background choice, so it can never perturb cohort drift / the RNG replay). The
 *  sequence of (week, amount) pairs for weeks ≤ N is stable no matter how far ahead we walk:
 *  each call re-derives the stream from the seed and draws gap→price in the same fixed order.
 *  Deterministic, pure, cheap for game-length horizons. */
export function gearHitsUpTo(
  seed: string,
  category: GearCategory,
  background: FamilyBackground,
  uptoWeek: number,
): GearHit[] {
  const line = ECONOMY.gear[category]
  const [cadLo, cadHi] = line.cadenceWeeks[background]
  const [prLo, prHi] = line.priceCents[background]
  const rng = rngFromSeed(`${seed}:gear:${category}`)
  const hits: GearHit[] = []
  let w = 0
  // First purchase sits a full cadence in, so week 0 (career start) is never a buy.
  while (w <= uptoWeek) {
    w += pickInt(rng, cadLo, cadHi)
    if (w > uptoWeek) break
    hits.push({ week: w, amountCents: pickInt(rng, prLo, prHi) })
  }
  return hits
}

/** The gear purchase (if any) that lands EXACTLY on `week` for one category, else null. */
export function gearHitForWeek(
  seed: string,
  category: GearCategory,
  background: FamilyBackground,
  week: number,
): GearHit | null {
  return gearHitsUpTo(seed, category, background, week).find((h) => h.week === week) ?? null
}
