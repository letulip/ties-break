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

import { rngFromSeed, pickInt, type Rng } from './rng'
import type { CoachSetup, FamilyBackground, InjurySeverity } from '../shared/protocol'
import type { TierId } from './season/types'

/** The four recurring gear line-items. rackets/shoes/apparel report under the 'gear'
 *  breakdown category; stringing gets its own 'stringing' category (it recurs far more
 *  often, so the owner wants it split out on the Money pie). */
export type GearCategory = 'rackets' | 'stringing' | 'shoes' | 'apparel'
export const GEAR_CATEGORIES: readonly GearCategory[] = ['rackets', 'stringing', 'shoes', 'apparel']

/** One family-vacation package of the season planner (docs/specs/season-planner.md §2).
 *  ONE shared catalogue – money is the only gate. Prices are MIDDLE-anchored bands scaled by
 *  the wealth corridor at quote time (see vacationPriceCents); the quote is deterministic per
 *  (seed, week, packageId) so the offer the player sees is exactly what booking charges. */
export interface VacationPackage {
  id: string
  /** player-facing name (short dash only – never an em dash) */
  label: string
  /** one-line flavor for the planner sheet */
  blurb: string
  /** middle-anchored [min,max] price in whole cents; [0,0] = free */
  priceCents: [number, number]
  /** condition gain applied on the vacation week (clamped to 0..100) */
  conditionGain: number
  /** injury-tau multiplier carried for ECONOMY.vacation.buffWeeks weeks; 1 = no carry-over buff */
  buffFactor: number
}

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
    // V2.1 SHIPPED (owner 25.07 "все чуть ниже к концу сезона", same pass as the V2 flip):
    // every MATCH-FREE week recovers this base (was 2) – the free-week ladder is now
    // grinder +1 / balanced +2 / careful +3 via the slider bonus, so every policy ARRIVES at
    // the season wrap below 100 and the off-season + a planner vacation earn their keep.
    recoveryBase: 1,
    // V2 SHIPPED (owner verdict 25.07 "V2 хорош", after two fatigue-bench rounds): a tournament
    // week is travel + competition, not rest – NO base recovery on a week the kid plays. The
    // knob stays (the bench's 'legacy' scenario patches it back to 2 for reference runs).
    matchWeekRecoveryBase: 0,
    // Match-free weeks only, first matching threshold wins (descending): the slider stays
    // meaningful – money (planFactor), future skill growth, and recovery pacing.
    restRecoveryBonus: [
      { minRest: 40, bonus: 2 },
      { minRest: 25, bonus: 1 },
    ] as { minRest: number; bonus: number }[],
    blackoutBonus: 1, // off-season (weeks 49-51) and exam weeks (replaces the old offSeasonGain)
    // Per-match drain components (see world.ts matchDrain).
    matchFatigue: { straightSets: 1, hardMatch: 2, extraTiebreaks: 1 },
    // Tier surcharge PER MATCH, one step per rung. The J levels are EXTRAPOLATED above national
    // (ladder-up): international travel, time-zone changes and a fortnight away from home make
    // them the most draining weeks she plays. Worst case is a 5-match J300 run at 3 + 5 per match
    // = 40 condition – deliberately the heaviest thing in the game, and OWNER-TUNABLE: the owner
    // has priced local..national himself ("a five-match National run maxes at 25"), never the J
    // family, so these three are the first numbers the pending tuning pass should look at.
    tierMatchFatigue: { local: 0, regional: 1, national: 2, j30: 3, j60: 4, j300: 5 } as Record<TierId, number>,
    // R9-19: coupling ON, owner curve – NO penalty while condition >= knee (fresh enough),
    // then linear down to `floor` at condition 0:
    //   condFactor = condition >= knee ? 1.0 : floor + (1 − floor) × condition / knee.
    // The kid's MatchPlayer scales by it on the EVENT-scoped `seed:kidtour` stream only; the
    // slice-B fast-follow the owner proved necessary (won a Regional at 0 condition).
    matchStrengthKnee: 70,
    matchStrengthFloor: 0.55,
    // RIVALS BECOME REAL (rival-life slice): how many trailing weeks of the results ledger a
    // COHORT player's condition is reconstructed from. The kid carries a persisted `condition`
    // counter; a rival cannot (world.cohort is inside every save, and a new field would cost a
    // schema bump AND re-roll all 199 players), so hers is DERIVED on the fly from the rows she
    // already has – which means the scan has to be bounded.
    //
    // The window is therefore the rival's MEMORY: she carries the last N weeks of competitive
    // load, not her whole career. That is not just an optimisation – it is the knob that keeps a
    // heavy schedule from being an unrecoverable death spiral. Elite juniors enter ~20-30 draws a
    // season (the entrant bands overlap, so the top of the table is a candidate for j30 + j60 +
    // j300 at once), and at recoveryBase 1/week their drain outruns their recovery permanently:
    // an unbounded scan pins the whole top of the cohort at condition 0 for the entire season,
    // which inverts the standings instead of colouring them. Measured on the real calendar
    // (docs + the rival bench): 16 weeks keeps the field's median in the 70s-80s, leaves a real
    // dip behind a deep run, and floors nobody all season.
    rivalFatigueWindowWeeks: 16,
  },

  // The availability gate: the minimum condition to ENTER each tier, and the school-exam blackout
  // blocks (season-week offsets, blacked out for tournaments). Off-season weeks (49-51) are already
  // event-free and are treated as blackout too (see isBlackoutWeek in world.ts).
  availability: {
    // The soft fatigue floor per tier, one step per rung (the J levels extrapolate above national,
    // matching tierMatchFatigue). Racing below the floor is still ALLOWED – it raises a caution,
    // never a block (the owner's "the parent may push, the game warns").
    minConditionToEnter: { local: 20, regional: 30, national: 40, j30: 45, j60: 50, j300: 55 } as Record<TierId, number>,
    examWeeks: [[24, 25]] as [number, number][], // season-week offsets blacked out for school

    // THE DOCTOR'S VETO (owner idea R9-19b, cashed in by the Wave-2 fatigue bench 26.07): the one
    // place where "the parent may push, the game warns" yields to medicine. Below this condition
    // entering a tournament is a HARD block (availabilityStatus level 'blocked', reason 'medical');
    // at or above it, fatigue stays the SOFT caution it has always been. The bench found the only
    // degenerate cell of the whole sweep – a self-coached grinder competing at condition 0 for
    // ~4.4% of her weeks – and this is the floor under it. Deliberately far below every tier
    // caution floor (20-45), so normal play never meets it; knob-driven (0 disables it) so the
    // owner can lower or retire it after seeing the numbers.
    medicalFloor: 15,

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
    // weekly recovery while physioActive. Integer (owner said "1 or 2"; was 2, tuned to 1 with
    // the V2 flip 25.07 – at 2 the retainer alone erased every policy difference on hired-coach
    // profiles, see the fatigue bench).
    conditionBonusPerWeek: 1,
  },

  // --- Season planner: family vacations (spec §2, owner-approved 25.07) -------------------
  // ONE shared catalogue; money is the only gate. A vacation week is a hard blackout (nothing
  // enterable) that pays a condition gain on top of a FREE week's recovery, and the two top
  // packages carry an injury-tau buff for `buffWeeks` weeks (applied POST-draw, so the MAIN
  // stream stays byte-identical). Prices are middle-anchored bands × wealthCorridor, quoted
  // from the `seed:vacation:week:packageId` sub-stream. 1-week packages, bookable back-to-back
  // (2 weeks = deep reset at 2× price – owner approved).
  vacation: {
    /** how many weeks a resort/elite recovery buff rides after the vacation week */
    buffWeeks: 4,
    packages: [
      {
        id: 'staycation',
        // Labels are deliberately dash-FREE: they get embedded in copy that already carries a
        // short dash ("Family vacation – {label}"), and a double dash reads badly.
        label: 'Staycation with friends',
        blurb: 'No travel, no drills – her own bed and her own people.',
        priceCents: [0, 0],
        conditionGain: 12,
        buffFactor: 1,
      },
      {
        id: 'grandma',
        label: "Grandma's village",
        blurb: 'Two trains and a bus – slow food, slow days.',
        priceCents: [0, 50_00],
        conditionGain: 14,
        buffFactor: 1,
      },
      {
        id: 'camping',
        label: 'Camping road-trip',
        blurb: 'Tent, lake, no racket in the car.',
        priceCents: [150_00, 300_00],
        conditionGain: 16,
        buffFactor: 1,
      },
      {
        id: 'seaside',
        label: 'Seaside family hotel',
        blurb: 'A real holiday – sea, sleep, sun.',
        priceCents: [600_00, 1000_00],
        conditionGain: 20,
        buffFactor: 1,
      },
      {
        id: 'resort',
        label: 'Sports recovery resort',
        blurb: 'Pool, physio, massage – rest with a programme.',
        priceCents: [1800_00, 3000_00],
        conditionGain: 25,
        buffFactor: 0.9,
      },
      {
        id: 'elite',
        label: 'Elite recovery programme',
        blurb: 'The clinic the pros use – she comes back new.',
        priceCents: [4000_00, 7000_00],
        conditionGain: 30,
        buffFactor: 0.85,
      },
    ] as VacationPackage[],
  },

  // --- Season planner: practice matches (spec §4) -----------------------------------------
  // A friendly on an empty week: court rental $30-80 × corridor off `seed:practice:week`, plus
  // an OPTIONAL coach (50% of a coaching session – "the other half is paid by the opponent's
  // family"; re-priced per coach tier when the coach slice lands). Effect: condition drain
  // max(1, local-scoreline drain − 1), ZERO ranking points, and the week keeps the base
  // recovery but FORFEITS the rest-slider bonus (she played, even if friendly).
  // GUARDRAIL (fatigue-bench finding 25.07: practising every week is self-destructive – mean
  // condition 47, 41-44% of weeks under 40): booking below `cautionCondition`, or a long enough
  // run of consecutive practice weeks, raises a CAUTION. It never blocks – the owner's philosophy
  // is "the parent may push, the game warns".
  //
  // WAVE-2 RETUNE (fatigue bench 26.07): the streak arm used to fire on the 3rd week no matter
  // how fresh she was – careful pushed through 8-11 cautions/season at condition 92, and a warning
  // nobody believes is worse than none (it trains the player to click through the real ones). The
  // arm is now gated on ACTUAL strain: 3 in a row only warns below `cautionStreakCondition`, while
  // `cautionStreakAlways` in a row warns at any condition (a run that long IS strain). The
  // low-condition arm (`cautionCondition`) is untouched.
  practice: {
    courtFeeCents: [30_00, 80_00] as [number, number],
    coachSessionCents: [120_00, 250_00] as [number, number],
    coachShare: 0.5,
    cautionCondition: 55,
    /** the SHORT streak – warns only while she is under the strain gate below */
    cautionStreak: 3,
    /** the short streak's strain gate: 3 match weeks in a row warn only below this condition */
    cautionStreakCondition: 75,
    /** a run this long warns at ANY condition – no gate */
    cautionStreakAlways: 4,
    /** the rescue prompt fires at or below this condition (spec §4b – an OFFER, never an
     *  auto-book). WIDENED 65 → 80 (Wave-2): the narrow band meant the offer only ever appeared
     *  on a deep deficit, where nothing but the expensive packages could clear the target – so
     *  seaside took 88% of every booking in the bench. A mildly-tired week is exactly where a
     *  cheap package is the right answer. */
    rescueCondition: 80,
    /** the offer pre-highlights the CHEAPEST package sufficient to return her to this condition
     *  (see recommendVacationPackage) – so the recommendation slides down the ladder as the
     *  deficit shrinks, instead of always demanding the +20 tier. */
    rescueTargetCondition: 85,
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

// --- Season planner pricing (pure, sub-stream only) --------------------------------------
// Both quotes below are pure functions of (seed, week, …) drawn from a PURPOSE-SCOPED
// sub-stream, never the main weekly stream – so a player's booking cannot move the world's
// draw sequence (the B1/C1 invariance freezes stay byte-identical). Being pure also means the
// UI can quote the same price the engine will charge without any extra snapshot payload.

/** One corridor-scaled price: draw the MIDDLE-anchored base from `band`, then map ONE uniform
 *  roll into the background's wealth corridor (same shape as medicalBillCents/travelBgFactor –
 *  same roll, disjoint corridors, so working < middle < wealthy per offer). */
function corridorPrice(rng: Rng, band: readonly [number, number], background: FamilyBackground): number {
  const base = pickInt(rng, band[0], band[1])
  const [cLo, cHi] = WEALTH_CORRIDOR[background]
  const roll = rng()
  return Math.round(base * (cLo + roll * (cHi - cLo)))
}

/** The catalogue entry for a package id, or undefined for an unknown id. */
export function vacationPackage(id: string): VacationPackage | undefined {
  return ECONOMY.vacation.packages.find((p) => p.id === id)
}

/** The deterministic price of ONE vacation offer: `rngFromSeed(seed:vacation:week:packageId)`
 *  (spec §2). Quoted at offer time, charged on booking – same function, same number. */
export function vacationPriceCents(
  seed: string,
  week: number,
  packageId: string,
  background: FamilyBackground,
): number {
  const pkg = vacationPackage(packageId)
  if (!pkg) throw new Error(`Unknown vacation package "${packageId}"`)
  return corridorPrice(rngFromSeed(`${seed}:vacation:${week}:${packageId}`), pkg.priceCents, background)
}

/** THE vacation pre-highlight, as ONE pure rule (Wave-2 tuning, fatigue bench 26.07).
 *
 *  Before this pass the rule lived in three places (the rescue card, the planner sheet, the
 *  bench) and every copy asked the same question – "the cheapest package that returns her ABOVE
 *  85" – which on a deep deficit no cheap package can answer, so all three fell through to "the
 *  most expensive she can afford". Result: seaside 88% of every booking in the bench, grandma
 *  0.2%, camping 0.4%.
 *
 *  The rule now reads HER CURRENT condition: the cheapest package that gets her to
 *  `targetCondition` (defaulting to ECONOMY.practice.rescueTargetCondition), counting the clamp
 *  at ECONOMY.condition.max – so on a mild deficit the free staycation IS the answer and the
 *  recommendation slides up the ladder only as the hole deepens. When nothing on the shelf can
 *  reach the target (a real crash), it falls back to the biggest reset she can afford.
 *
 *  Pure: prices come from the same deterministic quote the booking will charge, so the UI, the
 *  engine and the bench can never disagree. Returns null only when even the free package is out
 *  of reach (a prudence budget below zero). */
export function recommendVacationPackage(input: {
  seed: string
  week: number
  background: FamilyBackground
  /** her condition TODAY – the deficit the package has to close */
  condition: number
  fundsCents: number
  /** optional prudence cap (the bench's "never spend more than X on one package") */
  budgetCents?: number
  /** optional override for the condition the pick aims to restore */
  targetCondition?: number
}): string | null {
  const cap = Math.min(input.fundsCents, input.budgetCents ?? input.fundsCents)
  const target = input.targetCondition ?? ECONOMY.practice.rescueTargetCondition
  const priced = ECONOMY.vacation.packages
    .map((pkg) => ({ pkg, priceCents: vacationPriceCents(input.seed, input.week, pkg.id, input.background) }))
    .filter((row) => row.priceCents <= cap)
    // cheapest first, and on a price tie the SMALLER gain first – "cheapest sufficient" has to be
    // read off the quoted price, not the catalogue order (quotes breathe inside their bands).
    .sort((a, b) => a.priceCents - b.priceCents || a.pkg.conditionGain - b.pkg.conditionGain)
  if (priced.length === 0) return null
  const sufficient = priced.find(
    (row) => Math.min(ECONOMY.condition.max, input.condition + row.pkg.conditionGain) >= target,
  )
  // Nothing clears the target: buy the deepest reset money can buy (the biggest gain, cheapest
  // among equals) – the crash case the ladder's top tiers exist for.
  const deepest = priced.reduce((a, b) => (b.pkg.conditionGain > a.pkg.conditionGain ? b : a))
  return (sufficient ?? deepest).pkg.id
}

/** The deterministic price of ONE practice-match booking off `rngFromSeed(seed:practice:week)`:
 *  court rental, plus (optionally) HALF a coaching session for «+ тренер на игру». The court
 *  draw comes FIRST, so adding the coach never moves the court part of the quote. */
export function practiceFeeCents(
  seed: string,
  week: number,
  background: FamilyBackground,
  withCoach: boolean,
): number {
  const rng = rngFromSeed(`${seed}:practice:${week}`)
  const court = corridorPrice(rng, ECONOMY.practice.courtFeeCents, background)
  if (!withCoach) return court
  const [cLo, cHi] = ECONOMY.practice.coachSessionCents
  const base = pickInt(rng, cLo, cHi)
  const [wLo, wHi] = WEALTH_CORRIDOR[background]
  const roll = rng()
  return court + Math.round(base * ECONOMY.practice.coachShare * (wLo + roll * (wHi - wLo)))
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
