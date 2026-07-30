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
import type { CoachTier, FamilyBackground, InjurySeverity, PlayStyle } from '../shared/protocol'
import type { TierId } from './season/types'
import { WEEKS_PER_YEAR } from './season/calendar'

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
// (ECONOMY.physio.medicalBgFactor) and the season planner's packages (vacationPriceCents /
// practiceFeeCents) – all of them reference this ONE object. Framing: working = public clinics /
// budget trips, middle = standard, wealthy = private everything. Retuned when real incomes (prize
// money) land – this constant is the single knob.
//
// ⚠ COACHING LEFT THE CORRIDOR (coach-tiers slice, docs/specs/coach-tiers.md §2). The weekly
// coaching bill used to be its fourth customer, via a roll from `seed:coachbg:week` in world.ts
// resolveBaseCosts. The coach TIER now states the family's price level explicitly, so the corridor
// would have charged the same difference twice. Everything else it prices is untouched.
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
  // WEALTHY RAISED 430 -> 750 (owner, round 12 - his THIRD ask, 27.07 "я уже просил его поднять и
  // не один раз"). His two full 120k careers both ended the same way: bankrupt around week 120-125,
  // with travel overtaking the coach as the top cost centre once the international calendar opened.
  // The old figure was tuned for the round-7 no-tournament burn bands; a real playing season at the
  // J tiers costs $45-60k/season and the age-cap change already trimmed the schedule, so the burn
  // band gives way to the owner's number. He asked for 700-800; 750 is the middle of his range.
  // MIDDLE RAISED 300 -> 425 (owner, round 13, 28.07 - his ask at "400-450" for the SECOND time;
  // wealthy moved in round 12 but middle never did, and his first Diary-1 playtest burned the whole
  // 25k reserve inside one season). 425 is the middle of his range. Same trade as the wealthy
  // re-base: the round-7 idle-year burn band gives way to the owner's number, and the calibration
  // band in tests/economy.test.ts is re-pinned to the measured window at 425, deliberately.
  parentIncomeCents: {
    wealthy: 750_00,
    middle: 425_00,
    working: 245_00,
  } as Record<FamilyBackground, number>,

  // THE PARENTS' CAREERS MOVE TOO (owner, round 12: "с каждым новым годом вклад родителей
  // приростал процентов на 5-10 рандомно... не фиксированная сумма на всю жизнь"). Each season
  // boundary the weekly contribution grows by a uniform draw from this band, COMPOUNDING - season
  // N's income is base x prod(1 + roll_i) over seasons 1..N. Both bounds are knobs.
  incomeGrowthBand: [0.05, 0.10] as [number, number],

  // --- THE COACH LADDER (docs/specs/coach-tiers.md; the model itself is engine/coach.ts) --------
  //
  // REPLACES `expenseRangeCents` – the old two-band weekly draw (hired $250-700, parent $120-400).
  // The bands become a per-tier PER-HOUR ladder, a ROSTER of named coaches is drawn off it, and the
  // weekly bill is `coach rate x hours(plan) x wealthCorridor[background]`.
  //
  // ⚠ THE CORRIDOR IS BACK ON COACHING (Round 2, owner 29.07), and the reason is his, not mine. I
  // took it off arguing that the tier already says "poorer families buy cheaper coaches", so keeping
  // both charges the difference twice. His model is better and it is a DIFFERENT claim:
  //
  //   «для 8к все тиры [в их академии] стоят согласно их коридору, для 25к – свои цены,
  //    для 120к [в их премиальных и элитных местах] стоят дороже всего»
  //
  // The corridor is not a discount for being poor, it is THE MARKET SHE TRAINS IN. The same rung of
  // coach costs different money in a working-class club, an ordinary academy and a premium one,
  // because the court, the city and the queue for that coach's time are different. A family does not
  // get a cheaper Middle coach because it is poor - it hires the Middle coach its academy HAS. So
  // every tier is priced in every corridor, both dials are real, and the wealthy family pays MORE
  // for the same rung, which the previous model had backwards.
  //
  // THE DRAW COUNT IS STILL ONE pickInt per tick, in the same position. What it draws changed: the
  // COACH's rate is his own and comes off the roster sub-stream, so the main-stream draw is now the
  // week's jitter (see weekJitterBps). Corridor and hours are post-draw multiplies.
  coach: {
    // Inclusive upper bounds of the age-rate rows: 12-16 (development), 17-22 (pro), 23+ (peak and
    // after). His own caveat is why there are three and not four - 17-22 and 22-28 barely differ,
    // and 29+ holds level because past the peak the work becomes maintenance.
    ageBandUpper: [16, 22] as [number, number],

    // SESSIONS A WEEK, anchored on the three plan PRESETS. ⚠ 4 / 5 / 6, the owner's own numbers
    // (Round 2), replacing the 3/4/6 I anchored on his price table's "x4 h/wk" reference. An hour
    // is a session.
    //
    // THE HALF THE OLD MODEL WAS MISSING: the split scaled the development rate and, through
    // planFactor, barely scaled the bill (0.91 at train 60 to 1.06 at 85 - a 16% spread on a slider
    // that doubles her growth). Hours are what a coach charges for, so the split now moves the bill
    // by half again end to end and the family has two dials instead of none: WHICH coach, and HOW
    // MUCH of him. A High coach at four sessions is affordable where an Elite at six is not.
    //
    // Anchors rather than two endpoints because train 75 sits at t=0.6 of the 60-85 range, not at
    // its middle, so a straight line puts BALANCED somewhere nobody chose. Linear between anchors,
    // clamped outside them, ascending by construction.
    sessionsByTrain: [
      [60, 4],
      [75, 5],
      [85, 6],
    ] as [number, number][],

    // THE OWNER'S PRICE RESEARCH (29.07), per hour, individual lessons, big-city rate, converted
    // straight across because per-hour is the unit he priced in. His midpoints, row by row:
    //   12-16   Budget 30 · Middle 50 · High  80 · Elite 120
    //   17-22   Budget 35 · Middle 60 · High 100 · Elite 160
    //   23+     Budget 40 · Middle 65 · High 120 · Elite 200
    //
    // ⚠ THESE ARE MIDDLE-CORRIDOR PRICES. The corridor multiplies them, and middle's is [0.95, 1.05]
    // centred on 1.0, so his table IS what an ordinary academy charges - which is the market he
    // priced. Working pays 0.7-0.8 of it and wealthy 1.2-1.3, per the rung, per the hour.
    //
    // Each band is his midpoint +/-20%, and a coach's OWN rate is drawn from it once and kept for
    // the career (see the roster below). So the band is no longer weekly breathing - it is the
    // spread of rates between the coaches who work at that rung, which is what makes a tier a
    // market with a price range rather than a single number.
    //
    // SELF IS THE COURT, NOT THE COACH. The parent's hour is free - that is the whole rung - but the
    // court is not, and §3 of the spec keeps every tier price inclusive of it rather than splitting
    // court rental into a line of its own (we already charge it for practice matches). So `self` is
    // priced at exactly the court rental §3 quotes, $10-30/h, and takes the MIDDLE of that band: it
    // has no roster and nobody to be dearer than. A $0 rung would hand the working family the single
    // largest line in the game.
    hourlyRateCents: {
      self: [[10_00, 30_00], [11_00, 33_00], [12_00, 36_00]],
      budget: [[24_00, 36_00], [28_00, 42_00], [32_00, 48_00]],
      middle: [[40_00, 60_00], [48_00, 72_00], [52_00, 78_00]],
      high: [[64_00, 96_00], [80_00, 120_00], [96_00, 144_00]],
      elite: [[96_00, 144_00], [128_00, 192_00], [160_00, 240_00]],
    } as Record<CoachTier, [number, number][]>,

    // THE WEEK'S JITTER, in basis points, and the ONE main-stream draw the bill spends. A coach has
    // a rate; a WEEK still varies - a session moved, a court booked at a worse hour, an extra half
    // hour before a tournament. +/-8% keeps the bill recognisably his price while leaving the
    // Money screen something to show, and it is what preserves the frozen MAIN capture: exactly one
    // pickInt, in exactly the slot the old expense draw held.
    weekJitterBps: [9200, 10800] as [number, number],

    // THE ROSTER (Round 2). «примерно по 4 тренера на тир, по одному на стиль игры» - what makes
    // screen T a market rather than a menu: at one rung the parent chooses between a coach who fits
    // her game and one who does not, at roughly the same money.
    //
    // The slots are DATA and not a generated grid, because the art is: 16 portraits ship in
    // public/images/coaches (budget 3, middle 5, high 4, elite 4), each of a specific person, so the
    // gender is a fact about the file and the style is a reading of what he is doing in it. What the
    // seed draws is the NAME; who these people are does not change between careers.
    //
    // ⚠ THE OWNER REVERSED "BUDGET SHIPS NO SERVE-FIRST COACH" (playtest, 30.07): «2 counterpancher
    // budget, none big serve». Both halves of that sentence are one complaint, and it is the poorest
    // family's complaint - the only rung a working-class career can actually shop at was the one rung
    // with a hole in it.
    //
    // WHAT THE RULE USED TO SAY, kept because the argument was real and lost anyway: a big serve is
    // the expensive build, the cheap rung teaches shape and consistency, and a serve-first girl who
    // shopped at the bottom found nobody who fitted her. That was described as "the tier's texture",
    // and Round 2 was explicit that the owner had not objected to it.
    //
    // HE HAS NOW, AND HE IS RIGHT, for a reason the texture argument never answered: a play style is
    // chosen ONCE, on screen R, before the player has any idea what coaching costs - and it is
    // persisted for the whole career. So "serve-first has no great fit at Budget" is not a texture, it
    // is a fourteen-year-old's irreversible choice quietly taxing the family least able to buy its
    // way out. The other three styles each had a great-fit Budget coach who was also the cheapest
    // great fit IN THE GAME (R3 pinned exactly that); serve-first alone had to find $41/h at Middle
    // against $28 at Budget. The texture was only ever visible to a serve-first family, and to them it
    // read as the game being broken.
    //
    // ⚠ AND IT COSTS THE R3 DUPLICATE, DELIBERATELY. Round 3 moved `middle-4` down from Middle (which
    // carried two counterpunchers purely because five middle portraits had to go somewhere) and argued
    // the duplicate now "reads as something rather than as an accident: the club IS defence and
    // consistency, so two defensive coaches at the bottom of the market is what a club looks like",
    // giving a counterpuncher two Budget prices to choose between. That reading was fair and it is
    // what the owner has just called the bug. It is also the CHEAPER of the two things to give up:
    // a counterpuncher losing a second Budget price loses a choice between two coaches who fit her,
    // while a serve-first girl was losing the only coach who could fit her at all. `budget-1` keeps
    // the counterpuncher slot - he is the Home card's face for the working-class family and the
    // cheapest great-fit counterpuncher in the game, which is the fact R3 pinned in answer to the
    // owner's PREVIOUS complaint, and reversing that would re-open a closed issue.
    //
    // WHAT SURVIVES INTACT is the structural half of R3, which is the half the owner asked for:
    // FOUR A TIER, all the way up. The roster is now one coach per style per rung, sixteen slots,
    // no duplicate anywhere - the most even spread this art can produce.
    //
    // The portrait stem still says `middle-4` because a stem names the MASTER FILE, not the rung and
    // not the style - the art is a man in a cap and an orange jacket, both hands up, mid-explanation,
    // which is a man showing a serve motion as readily as a defensive shape. Renaming the file would
    // break every save holding that id, and the id is what a save holds.
    roster: [
      { portrait: 'budget-1', tier: 'budget', style: 'counterpuncher', gender: 'm' },
      { portrait: 'budget-2', tier: 'budget', style: 'all-court', gender: 'f' },
      { portrait: 'budget-3', tier: 'budget', style: 'aggressive', gender: 'f' },
      { portrait: 'middle-4', tier: 'budget', style: 'serve-first', gender: 'm' },
      { portrait: 'middle-1', tier: 'middle', style: 'all-court', gender: 'f' },
      { portrait: 'middle-2', tier: 'middle', style: 'counterpuncher', gender: 'm' },
      { portrait: 'middle-3', tier: 'middle', style: 'serve-first', gender: 'm' },
      { portrait: 'middle-5', tier: 'middle', style: 'aggressive', gender: 'm' },
      { portrait: 'high-1', tier: 'high', style: 'all-court', gender: 'm' },
      { portrait: 'high-2', tier: 'high', style: 'counterpuncher', gender: 'f' },
      { portrait: 'high-3', tier: 'high', style: 'aggressive', gender: 'm' },
      { portrait: 'high-4', tier: 'high', style: 'serve-first', gender: 'f' },
      { portrait: 'elit-1', tier: 'elite', style: 'aggressive', gender: 'f' },
      { portrait: 'elit-2', tier: 'elite', style: 'all-court', gender: 'f' },
      { portrait: 'elit-3', tier: 'elite', style: 'serve-first', gender: 'm' },
      { portrait: 'elit-4', tier: 'elite', style: 'counterpuncher', gender: 'm' },
    ] as { portrait: string; tier: CoachTier; style: PlayStyle; gender: 'm' | 'f' }[],

    // WHAT EACH RUNG IS WORTH. Replaces ECONOMY.development.coachParent (0.82) / coachHired (1.15),
    // and keeps both of those values as the ENDS of the ladder on purpose - see coachFactor in
    // engine/coach.ts for the argument. Steps shrink as they climb (+0.13, +0.09, +0.07, +0.04)
    // while the price roughly doubles every two rungs, so Elite is a luxury rather than an
    // optimisation.
    developmentFactor: { self: 0.82, budget: 0.95, middle: 1.04, high: 1.11, elite: 1.15 } as Record<
      CoachTier,
      number
    >,

    // FIT, as screen T's three pills - and since Round 2 it is a fact about the COACH, not the tier.
    // A coach coaches the game he plays; how well that transfers to hers is a question about the two
    // STYLES, so this is a compatibility table and not a tier table.
    //
    // Symmetric, and the shape is the game's own: aggressive and serve-first are both first-strike
    // tennis and read across; counterpuncher is the opposite philosophy and does not; all-court is
    // the generalist and is never `off` for anybody, in either direction. Own style is always
    // `great`, anything unlisted is `off`.
    styleAffinity: {
      aggressive: ['serve-first', 'all-court'],
      counterpuncher: ['all-court'],
      'serve-first': ['aggressive', 'all-court'],
      'all-court': ['aggressive', 'counterpuncher', 'serve-first'],
    } as Record<PlayStyle, PlayStyle[]>,

    // ...and what a pill is worth on the development rate. Deliberately SMALL next to the rung
    // ladder (which spans 1.40 end to end): fit is a reason to prefer one affordable coach over
    // another, never a reason to buy up a rung. At these values a Budget coach who is great for her
    // (0.95 x 1.05 = 0.998) just edges a Middle coach who is wrong for her (1.04 x 0.94 = 0.978),
    // which is exactly the size of trade the pills are meant to be advertising.
    fitFactor: { great: 1.05, good: 1.0, off: 0.94 } as Record<'great' | 'good' | 'off', number>,

    // THE PARENT'S OWN FIT. Self-coaching has no specialty to match: he taught her the game she
    // plays, so he is never wrong for it and never a specialist in it.
    selfFit: 'good' as 'great' | 'good' | 'off',

    // THE ELITE GATE - A HOOK, AND IT IS OFF. Owner: «элит, кстати, могу вообще стать доступны для
    // туров, как вариант и стоит соответствующе». The idea is that an Elite coach does not take a
    // fourteen-year-old with nothing to show, which would turn the top rung from "what rich families
    // buy in week 1" into something earned - the same shape as the academy scholarship.
    //
    // He asked for it to be an OPTION, so it is modelled and switched off: flip `enabled` and the
    // gate is live everywhere at once (the market's hireable check, the hire command's refusal and
    // the screen's locked row all read `coachHireable`). `minPoints` is her EARNED ranking points,
    // the same number the tier ladder gates on, and 150 is national-tier eligibility - "she has
    // results" stated in the currency the rest of the game already uses.
    //
    // ⚠ DOMESTIC POINTS, since the two ladders landed. 150 is literally
    // TIERS.national.enterPointBand[0], so the domestic table is the one that keeps this number
    // meaning what it was written to mean. Do not repoint it at the ITF table without moving the
    // threshold too: an ITF gate would make the Elite rung reachable only by families who could
    // already afford to fly, which is the shape the gate exists to prevent.
    eliteGate: { enabled: false, minPoints: 150 },

    // WHAT A RUNG IS WORTH TO HER, RIGHT NOW - the projection screen T prints on every coach row.
    // Owner: «"budget может добавить 0-2%", "middle 1-3%", "high 2-4%" но всё зависит от ребенка».
    // COMPUTED, never written down (see coachSeasonUplift): a hand-written band drifts the moment a
    // knob moves, and the game already knows the answer. `weeks` is the horizon the projection runs
    // over - one season, because that is the unit a weekly bill is judged in.
    //
    // ⚠ THE LITERAL 52 IS DELIBERATE and must not become `WEEKS_PER_YEAR`. This object is evaluated
    // at MODULE LOAD, and economy.ts sits inside an import cycle with season/calendar.ts - so
    // reading that constant HERE throws "Cannot access 'WEEKS_PER_YEAR' before initialization" in
    // the browser's module order and takes the whole app down with it. It does NOT throw under
    // vitest, whose resolution order differs, which is exactly how it got as far as a green suite;
    // it was caught by loading the real app. The constant stays safe inside FUNCTION bodies, and
    // parentIncomeForWeekCents below still uses it that way.
    upliftHorizonWeeks: 52,
  },

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

  // ⚠ `planFactor` (base 0.55 + 0.006 x plan.train) IS GONE, and its job moved rather than
  // vanished. It scaled the weekly coaching bill by the training split, but only from 0.91 at
  // train 60 to 1.06 at train 85 – a 16% spread on a slider that doubles her development. The
  // coach ladder replaces it with HOURS (ECONOMY.coach.sessionsAt60/85), which move the bill 2x
  // end to end, because hours are what a coach actually charges for.

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
  //    run COMMITS at finalizeTournament): straight sets with no tiebreak = 2; a 3-setter OR a
  //    tiebreak in a 2-setter = 3; +1 more when the match had MORE than 2 tiebreak sets (a
  //    three-TB epic) – max 4; plus the tier surcharge PER MATCH below. Hardest national
  //    match = 4 + 2 = 6, so a five-match National run of epics costs 30 + the cumulative ladder.
  //    (BASE RAISED 1 → 2, owner 26.07; the old "maxes at 25" check was that same run at base 1.)
  //  - RECOVERY comes from TIME: recoveryBase every week, always; on a week with NO kid match
  //    the train/rest slider adds restRecoveryBonus (threshold-based on plan.rest – the 60/40
  //    preset earns +2, 75/25 earns +1, the 85/15 grind earns 0; NEVER interpolated); physio
  //    adds ECONOMY.physio.conditionBonusPerWeek; a blackout week (off-season / exams) adds
  //    blackoutBonus. condition = clamp(condition + recovery − matchDrain, 0, 100).
  // --- DEVELOPMENT (Phase 4) --------------------------------------------------------------------
  // Every number the growth model reads, in one object, because this is the block the owner will
  // want to turn. The shape is docs/plan.md's ("potential + age curves ... weekly training
  // allocation, coach quality"); these are its first measured values, not its last.
  development: {
    /** Headroom rolled per attribute ON TOP of where she starts. A career at the bottom of this
     *  band is a girl who was never going to make it, and that has to be a career the game can
     *  tell - so the low end is deliberately small, not merely "less good". */
    potentialBand: [4, 26] as [number, number],
    /** She never falls below this, whatever age does to her. */
    floor: 20,
    ageCurve: {
      /** the steep years start here (our START_AGE is 14, so a prologue at 13 is covered) */
      growthStart: 13,
      /** ...and ease off into the late teens */
      growthEnd: 18,
      /** by the plan's calibration: first points 17-18, top-100 about 4.5 years later */
      plateauStart: 23,
      /** peak 23-28 */
      declineStart: 29,
      /** share of remaining headroom taken per week at the steepest age */
      peakRate: 0.0062,
      /** how much of that is gone by `growthEnd` (0.5 = half the rate at 18 that she had at 13) */
      growthEase: 0.5,
      /** across the peak she maintains rather than climbs */
      plateauRate: 0.0009,
      /** share of an attribute lost per week at `declineStart` */
      declineRate: 0.00035,
      /** ...growing each year past it, so a career ends rather than fading forever */
      declineAccel: 0.28,
    },
    /** The plan slider, end to end. Roughly a factor of two between coasting and committing. */
    trainAt60: 0.72,
    trainAt85: 1.28,
    /* ⚠ THE COACH MOVED OUT (coach-tiers slice). `coachParent: 0.82` and `coachHired: 1.15` lived
     * here; they are now the two ENDS of `ECONOMY.coach.developmentFactor`, beside the prices they
     * are traded against, because "what a rung costs" and "what a rung is worth" are one decision
     * and were never legible split across two objects. Neither value changed. */
    /** Competition teaches what practice cannot – capped, because a fourth match in a week is
     *  fatigue, not education, and the condition model already charges her for that. */
    matchBonus: 0.18,
    matchBonusCap: 3,
    /** One draw per week, shared across the four attributes: a good week is a good week. */
    weekLuck: [0.55, 1.45] as [number, number],
    /** Past the peak, composure keeps creeping up – the veteran is slower and calmer. */
    veteranPoise: 0.004,
  },

  // THE ACADEMY SCHOLARSHIP (see engine/academy.ts for the whole argument). Reviewed once a year at
  // the season boundary; the level is continuous, so every knob below scales rather than switches.
  academy: {
    /** Junior support only. She is 14 at week 0, so the earliest possible offer is the review that
     *  makes her 15, and the scholarship ends when she turns 19 – which is when junior tennis ends. */
    ageBand: [13, 18] as [number, number],
    /** Rank at review that reads as "a prospect, no argument" – full marks on the results half. */
    rankFull: 40,
    /** ...and the rank at which the results half is worth nothing. Sized to a ~200-strong field
     *  where a career that never scores sits at the tie floor around #120. */
    rankNone: 130,
    /** Where the population's ceilings actually lie (measured: p10 56, p50 62, p90 69), so the
     *  scout's half spans the real distribution instead of saturating at one end. */
    ceilingBand: [56, 70] as [number, number],
    /** How much of the verdict is the scout's eye vs her results. Half and half: results make the
     *  scholarship something to play for, the eye is why a poor 15-year-old gets looked at at all. */
    scoutWeight: 0.5,
    /** Need, and need alone, decides how much of that talent is worth backing. Wealthy is 0 –
     *  a family that can pay, pays. */
    needFactor: { working: 1, middle: 0.6, wealthy: 0 } as Record<FamilyBackground, number>,
    /** Tournaments in the last 52 weeks below which the academy passes: they fund players, not
     *  prospects. Deliberately low – the seasons she cannot afford to travel are exactly the ones
     *  this is meant to rescue, so the gate must not become "you need money to get money". */
    minEventsPerYear: 3,
    /** Below this the academy writes no letter at all. Stops a dribble of $12 scholarships. */
    minLevel: 0.15,
    /** Share of a travel bill covered at level 1. Travel is the bill that breaks the family
     *  (bench: $18k over 14→18 for the working preset, against a $5.7k horizon deficit), so it is
     *  the one this pays. */
    travelCover: 0.8,
    /** The kit grant at each review she is supported through, at level 1 – "и экипа". Paid as
     *  money rather than as a gear discount because it arrives once a year, not per purchase. */
    kitCentsAtFull: 900_00,
  },

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
    // MATCH BASE RAISED 1 → 2 (owner decision 26.07, "a simple match should cost 2, not 1"): the
    // BASE moved one rung and hardMatch moved with it, because his rule is unchanged – "+1 for a
    // tiebreak or a third set" – so hardMatch must always be straightSets + 1 (pinned as a pair in
    // tests/fatigueReference.test.ts). extraTiebreaks and tierMatchFatigue are NOT touched, so a
    // SIMPLE match now costs 2 (local) … 7 (j300) and the ceiling is 9 (a three-TB J300 epic).
    // The consequence he asked for: at the shipped ladder C a straight-sets TITLE costs exactly
    // what the pre-round-9 FLAT tournamentStrain charged (local 8 / regional 16 / national 26),
    // while a first-round exit still costs a fraction of it.
    // ONE side effect, deliberate: the practice friendly's max(1, local − 1) used to clamp
    // (max(1, 0) = 1 for every scoreline); it now subtracts for real, so a straight-sets friendly
    // still costs 1 but a 3-setter costs 2 and a three-TB epic 3 (docs/specs/fatigue-reference.md).
    matchFatigue: { straightSets: 2, hardMatch: 3, extraTiebreaks: 1 },
    // Tier surcharge PER MATCH, one step per rung. The J levels are EXTRAPOLATED above national
    // (ladder-up): international travel, time-zone changes and a fortnight away from home make
    // them the most draining weeks she plays. Worst case is a 5-match J300 run at 4 + 5 per match
    // = 45, + the cumulative ladder 6 = 51 condition – deliberately the heaviest thing in the game
    // (it was 40 + 6 before the base raise), and OWNER-TUNABLE: the owner has priced local..national
    // himself, never the J family, so these three are the first numbers the pending tuning pass
    // should look at – all the more so now that the base under them is one rung higher.
    tierMatchFatigue: { local: 0, regional: 1, national: 2, j30: 3, j60: 4, j300: 5 } as Record<TierId, number>,
    // CUMULATIVE RUN FATIGUE (owner idea 26.07): matches at a tournament run every day or every
    // other day, so each SUBSEQUENT match of the SAME run costs EXTRA condition on top of its own
    // scoreline drain – the deeper she goes, the more that week grinds her down. The array is the
    // extra, INDEXED BY MATCH-WITHIN-RUN: index 0 = her first match = 0 extra, index 1 = the
    // second match, and so on (world.ts runFatigueExtra / tournamentRunStrain).
    // A run LONGER than the ladder repeats its LAST value – a future draw bigger than the J-tier
    // 32 (5 matches) must never silently cost 0.
    // The owner proposed four ladders and the fatigue bench measured all four
    // (--scenario runfat-a|b|c|d, plus runfat-off for the pre-ladder reference):
    //   A +1,+2,+3,+4 (10 over a 5-match run) · B +1,+1,+2,+4 (8) · C +1,+1,+2,+2 (6) · D +1×4 (4)
    // C – the middle of his range – ships as the default; the bench report is what moves it.
    runFatigueLadder: [0, 1, 1, 2, 2] as number[],
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
    examWeeks: [[23, 24]] as [number, number][], // season-week offsets blacked out for school
    // Moved off 24-25 when the surface blocks landed: week 25 is the FIRST week of the grass
    // window (25-30), so the old placement ate 1 of only 6 grass weeks a year - a real cost to a
    // serve-first build, for no design reason. 23-24 is also truer: school ends, THEN grass.

    // THE DOCTOR'S VETO (owner idea R9-19b, cashed in by the Wave-2 fatigue bench 26.07): the one
    // place where "the parent may push, the game warns" yields to medicine. Below this condition
    // entering a tournament is a HARD block (availabilityStatus level 'blocked', reason 'medical');
    // at or above it, fatigue stays the SOFT caution it has always been. The bench found the only
    // degenerate cell of the whole sweep – a self-coached grinder competing at condition 0 for
    // ~4.4% of her weeks – and this is the floor under it. Deliberately far below every tier
    // caution floor (20-45), so normal play never meets it; knob-driven (0 disables it) so the
    // owner can lower or retire it after seeing the numbers.
    //
    // THE DOCTOR NOW CHECKS HER ON ARRIVAL TOO (owner 26.07): "врач точно не пустит ниже 15 на
    // турнир, если она приезжает". The floor used to gate ENTRY only, and entries commit weeks
    // ahead of the play week – so a run entered healthy could still be PLAYED at condition 0 with
    // nothing intervening (the fatigue bench recorded 14 straight weeks of it). It is now re-read on
    // the play week itself: under the floor she is withdrawn on medical grounds (world.ts tickWeek
    // step 2). Same knob, two surfaces, one rule.
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
    injuryBaseChance: 0.006, // per healthy week at condition 100
    injuryFatigueSlope: 0.0009, // + per fatigue point (100 - condition)
    injuryPlayingMultiplier: 1.8, // tau *= this the week she competes
    // R12-4/11 (owner playtest 27.07: "injured ON a family vacation", TWICE in one career). A
    // resort week used to roll the SAME dice as a training week – `rollInjury` reads fatigue, age,
    // trailing load and whether she is competing, and a booked vacation touched none of them, so
    // the week she is furthest from a tennis court was as dangerous as the week she is grinding.
    //
    // THE VALUE, and why 0.25. The model's load axis already runs from 1.8 (a competing week) up to
    // 1.8 again for four straight played weeks; a vacation is the far end of that same axis and
    // must be a bigger move than any protection money can buy – `physio.riskReduction` is 0.76 (a
    // retainer, 24% off) and the elite package's carry-over buff is 0.85. A quarter of a training
    // week's risk puts a fresh kid's holiday at ~0.15%/wk, i.e. one holiday injury per several
    // hundred vacation weeks, and it stays NONZERO on the owner's own instruction ("holidays do
    // sprain ankles") – she still climbs, swims and falls over. It rises with a deep condition
    // deficit, which is honest: the week she most needs the rest is the week her body is most
    // fragile, and that is exactly when a vacation gets booked.
    //
    // POST-DRAW MULTIPLY ON THE THRESHOLD – the same invariance pattern as `physio.riskReduction`
    // and the recovery buff (see injuryTau). ZERO draws, on any stream: the frozen MAIN capture
    // cannot move, and neither can the private `seed:injury:week` sequence, so a career that never
    // books a vacation is byte-identical to before.
    injuryVacationFactor: 0.25,
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

  // --- THE ITF ANNUAL ENTRY CAP (docs/research/ranking-points-by-tier.md §2 and §6) -----------
  //
  // Reality's real brake on "just grind cheap international events" is not the points table, it is
  // a HARD ELIGIBILITY CAP: Appendix F of the 2026 ITF World Tennis Tour Juniors Regulations limits
  // how many ITF junior events a player may enter per year, and the limit is tighter the younger
  // she is. The research counted our calendar at ~26 J30s + 17 J60s + 4 J300s a season, against an
  // allowance of FOURTEEN events for a 14-year-old. Wave B measured that zeroing the first-round
  // award did NOT reduce the grind (docs/specs/wave-b-first-round-zero.md) – the count is driven by
  // eligibility, affordability and calendar density, and this is the eligibility half.
  //
  // Counted birthday-to-birthday in the real rule; here that is exactly the 52-week season block,
  // because `ageAtWeek` and `seasonStartWeek` are the same arithmetic (world.ts) – so the reset is
  // the season boundary and no second definition of "this year" was invented.
  entryCap: {
    // WHY ONLY THESE THREE, and please do not "fix" it later: `local` / `regional` / `national` are
    // OUR OWN INVENTION – no national result of any kind produces an ITF junior ranking point
    // (Reg 10's list of Ranking Tournaments is closed and contains only ITF grades), so the ITF has
    // nothing to say about how many of them a kid plays. Capping them would be inventing a rule and
    // attributing it to a source. The domestic ladder stays deliberately uncapped; it is also what
    // she is left with once the allowance is gone, which is the whole point of the change.
    cappedTiers: ['j30', 'j60', 'j300'] as readonly TierId[],
    // ITF Appendix F, verbatim: 16 -> 25, 15 -> 18, 14 -> 14, 13 -> 10, 17 and 18 unrestricted,
    // 12 and under not eligible at all. `default` is the 17+ row; ages below 13 never reach this
    // table because `TIERS[tier].minAgeYears = 13` refuses them first (availabilityStatus asks the
    // age gate before the cap), which is also the honest place for "not eligible" to live.
    //
    // NOT MODELLED, DELIBERATELY – the merit increases. The same appendix grants +4 events to a
    // top-20 ITF junior at 14/15 (+4 to a top-50 at 13), and the WTA rulebook grants a year-end
    // top-5 junior up to 4 extra PRO events. Both are keyed to a world ranking; our field is 199
    // cohort players plus the kid, so "top 20 of the ITF" has no defensible mapping onto "top 20 of
    // 200" without an owner decision about what our standings represent. Left out rather than
    // guessed, and left out in the direction that keeps the cap honest (a bonus only weakens it).
    perYearByAge: { 13: 10, 14: 14, 15: 18, 16: 25, default: Number.MAX_SAFE_INTEGER } as {
      [age: number]: number
      default: number
    },
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
  // an OPTIONAL coach. Effect: condition drain
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
    // ⚠ `coachSessionCents: [120_00, 250_00]` IS GONE (Round 3), and it is the owner's ruling that
    // retired it: «справедливо будет завязать на стоимость выбранного тренера или best-fit если не
    // выбран». The friendly's optional coach is HER coach, so it costs a share of HIS OWN rate -
    // there is no second, unrelated price for a coaching hour any more. The flat band had drifted
    // badly enough to be worth saying out loud: at $120-250 a session it sat ABOVE the Elite tier's
    // own $96-144/h, so a practice friendly was charging more for an hour of coaching than the most
    // expensive coach in the game charges for one.
    //
    // A FRIENDLY IS A MATCH, NOT A LESSON, so it books more of him than a training hour does. Two
    // hours is a warm-up and a match; `coachShare` then halves it, because the other half is paid by
    // the opponent's family (the original framing, unchanged).
    coachHours: 2,
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
 *  court rental, plus (optionally) her own coach for «+ тренер на игру».
 *
 *  ⚠ THE COACH HALF IS NOW HER COACH (Round 3, owner's ruling). `coachHourlyCents` is the rate of
 *  the coach she actually has - or, when she is self-coached, of the best-fit coach at the cheapest
 *  hireable rung, because a family with no coach is hiring one for a single afternoon and the
 *  bottom of the market is what that costs. Callers resolve it through `practiceCoachRateCents` in
 *  engine/world.ts so there is exactly one definition of "her rate".
 *
 *  THE COURT DRAW COMES FIRST and is untouched, so a `withCoach: false` quote is byte-identical to
 *  every one this function has ever given. The coach half spends one fewer draw than it used to
 *  (its own price is no longer drawn - it is looked up), which only moves this private per-week
 *  sub-stream and never the main one. */
export function practiceFeeCents(
  seed: string,
  week: number,
  background: FamilyBackground,
  withCoach: boolean,
  coachHourlyCents = 0,
): number {
  const rng = rngFromSeed(`${seed}:practice:${week}`)
  const court = corridorPrice(rng, ECONOMY.practice.courtFeeCents, background)
  if (!withCoach) return court
  const [wLo, wHi] = WEALTH_CORRIDOR[background]
  const roll = rng()
  const hours = ECONOMY.practice.coachHours * ECONOMY.practice.coachShare
  return court + Math.round(coachHourlyCents * hours * (wLo + roll * (wHi - wLo)))
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

/** The parents' weekly contribution for the season holding `week` - PURE, no stored state.
 *  Season 0 pays the base; each later season compounds one uniform growth roll from
 *  `incomeGrowthBand`, drawn off the private `seed:income:<season>` sub-stream (one draw per
 *  season, keyed by index, so the whole trajectory replays from the seed alone: no schema field,
 *  no migration, nothing to desync). Rounded to whole cents once, AFTER the compounding, so the
 *  weekly ledger stays integer. Zero MAIN-stream draws. */
export function parentIncomeForWeekCents(seedStr: string, background: FamilyBackground, week: number): number {
  const season = Math.max(0, Math.floor(week / WEEKS_PER_YEAR))
  let income = ECONOMY.parentIncomeCents[background]
  const [lo, hi] = ECONOMY.incomeGrowthBand
  for (let i = 1; i <= season; i++) {
    const rng = rngFromSeed(`${seedStr}:income:${i}`)
    income *= 1 + lo + rng() * (hi - lo)
  }
  return Math.round(income)
}
