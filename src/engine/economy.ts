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
import type { CoachSetup, FamilyBackground } from '../shared/protocol'

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

export const ECONOMY = {
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
  expenseRangeCents: {
    hired: [250_00, 700_00],
    parent: [120_00, 400_00],
  } as Record<CoachSetup, [number, number]>,

  // Family background scales the drawn base expense AFTER the pickInt (draw itself unchanged,
  // so the main-stream count never depends on background). middle ×1.0 stays byte-identical to
  // the pre-round-7 baseline used by the 520-week identity run. wealthy 1.25 → 1.4 (round-7 c:
  // premium everything).
  bgExpenseFactor: {
    working: 0.8,
    middle: 1.0,
    wealthy: 1.4,
  } as Record<FamilyBackground, number>,

  // Travel scales with family means (wealthier travel = pricier + a money-sink; poorer = cheaper),
  // and the owner wants the price to sit in a CORRIDOR for every trip, not on a fixed multiplier.
  // Each background is a `[lo, hi]` band; a per-event uniform roll (from a purpose-scoped sub-stream
  // keyed by the event – see calendar.ts) maps into the band: `factor = lo + roll * (hi - lo)`. The
  // corridors are disjoint (working ≤ 0.80 < middle ≥ 0.95 ≤ 1.05 < wealthy ≥ 1.20) so, drawn off
  // the SAME roll, working < middle < wealthy holds per trip, not just on average. POST-draw multiply
  // only – the travel pickInt in calendar.ts stays byte-identical, so the season sub-RNG (and the
  // world's RNG identity) hold.
  travelBgFactor: {
    working: [0.7, 0.8],
    middle: [0.95, 1.05],
    wealthy: [1.2, 1.3],
  } as Record<FamilyBackground, [number, number]>,

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
