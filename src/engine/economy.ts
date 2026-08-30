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
import type { AdCategory, CoachTier, FamilyBackground, InjurySeverity, KitGrade, KitLine, PlayStyle } from '../shared/protocol'

/** ONE CATEGORY OF THE ADVERTISING PORTFOLIO (round 29 part four P6/P7) – see
 *  `ECONOMY.advertising.categories` for the shelf itself and the gradient it is priced on. Named
 *  here rather than inlined so `adTermsForCategory` and the reach bench read one shape.
 *
 *  ⚠ THIS REPLACES `AdHouse`, the one-rung shape of the #19/#20 ladder, because the axis moved: a
 *  rung WAS a house, and a category HOLDS several («игрок устанет смотреть на одно и то же название
 *  без смены ГОДАМИ» – the owner, 29.08). Letters already written under the old shape persist in
 *  saves untouched; only the catalogue that writes NEW letters changes shape. */
export interface AdCategoryDef {
  /** the shelf's own word for the trade, capitalised for the portfolio surface ("Watches") */
  label: string
  /** the opening clause of a house's letter, in the houses' shared voice ("We make watches") */
  trade: string
  /** 2–4 fictional houses that take turns writing – the variety P6's churn asks for. Never a
   *  tennis brand and never anything constructible into a real company. EMPTY for the clothing
   *  category, whose writer is the live kit deal's own brand (the «двойной программой» ruling). */
  houses: readonly string[]
  /** the fee PER CONTRACT YEAR, in cents, per band of `AD_BANDS` (same index), and `null` exactly
   *  where the category has not opened yet – which is also how «which categories are open at this
   *  band» is derived, so the gate and the price cannot disagree. */
  feeCentsByBand: readonly (number | null)[]
}

/** ONE BAND OF THE GRADIENT (§8) – the professional cut it opens at, and what a year of a deal
 *  signed inside it asks in shoot weeks. The CHEQUE is deliberately not here: it is the one axis
 *  that scales, and it scales per category (`AdCategoryDef.feeCentsByBand`). */
export interface AdBandDef {
  /** the standing at or inside which this band's cheques are written */
  maxWtaRank: number
  /** how many shoot weeks one deal asks per contract year at this band */
  shootWeeksPerYear: number
}
import type { TierId } from './season/types'
// ⚠ THE SEASON LENGTH COMES FROM THE SHARED DATES LEAF, NOT FROM season/calendar.ts – see the note
// on `upliftHorizonWeeks` below for the browser crash the old edge caused. `shared/dates.ts` imports
// nothing, so this direction can never close a cycle.
import { WEEKS_IN_SEASON } from '../shared/dates'

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
  /** ⭐⭐ ROUND 29 #5 -> PART TWO #8, the-shop §3f – A PACKAGE THE SHELF CAN MAKE FREE. It used to
   *  say «ask before offering me» (the row existed only for a family with a delivered yacht); his
   *  part-two #8 put the row on EVERY family's sheet at a real charter price – «можно просто на
   *  постоянку добавить в ленту сначала с реальной стоимостью, а после покупки яхты это станет
   *  бесплатным» – so the flag now zeroes the QUOTE instead of hiding the ROW. Absent on the six
   *  the planner has always carried, which is why it is optional rather than `false` everywhere.
   *
   *  ⚠ THE GRANT IS STILL THE SHOP'S (`ShopView.vacationIds` / `grantedVacationIds`) AND THE PRICE
   *  IS `vacationPriceCents`'s: nothing here knows what grants what, and every quote – the sheet's,
   *  the recommendation's and the booking's – goes through that one function with the granted list
   *  in hand, so a screen and the engine cannot price the same week two ways. A screen that forgot
   *  the list can only OVERSTATE a price; the booking itself always re-prices off the world. */
  freeOnceGranted?: boolean
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
// ⚠⚠ THIS COMMENT SAID "COACHING LEFT THE CORRIDOR" AND HAD BEEN WRONG SINCE 29.07. That was the
// coach-tiers slice's FIRST model - the tier states the family's price level, so keeping the corridor
// would charge the difference twice - and the owner reversed it in Round 2 the same week
// («для 8к все тиры стоят согласно их коридору, для 25к – свои цены, для 120к стоят дороже всего»):
// the corridor is not a discount for being poor, it is THE MARKET SHE TRAINS IN. The reversal landed
// in `coach.coachCorridorFactor` and in world.ts, and this line was never updated, so the one place a
// reader looks up what the corridor prices has been listing three customers where there are five.
//
// ITS REAL CUSTOMERS, all of them referencing this ONE object: travel, medical, the planner's
// packages, THE WEEKLY COACHING BILL (via `seed:coachbg:<week>` in resolveBaseCosts) and - since the
// bill split, docs/specs/split-the-bill-2026-08.md - the FACILITY line that came out of it. The last
// of those is the corridor at its most literal: the same court costs less in a working-class club
// than in a premium academy, and the family can now see the number.
const WEALTH_CORRIDOR = {
  working: [0.7, 0.8],
  middle: [0.95, 1.05],
  wealthy: [1.2, 1.3],
} as Record<FamilyBackground, [number, number]>

export const ECONOMY = {
  /** The canonical wealth-price corridor – see WEALTH_CORRIDOR above. */
  wealthCorridor: WEALTH_CORRIDOR,

  /** ⭐ THE WAR CHEST THE FAMILY OPENS WITH, and the game's own three pictures of what a family HAS.
   *
   *  ⚠ MOVED HERE FROM world.ts BY ROUND 26 #4, AND NOTHING ELSE MOVED WITH IT. `world.ts` keeps the
   *  historical export (`export const STARTING_FUNDS_CENTS = ECONOMY.startingFundsCents`) on the same
   *  line as `PARENT_INCOME_CENTS` three lines below it, so all twelve readers – two screens, five
   *  tests, two tools – are untouched. It comes here because a MEANS BAND needs it and the module
   *  that needs it (`world/means.ts`) may not import `world.ts` back: that edge is a runtime cycle,
   *  and this file imports nothing from the engine above `rng`.
   *
   *  ⚠ AND IT IS THE ONLY HONEST SOURCE FOR "IS THIS FAMILY POOR". Every other wealth figure in the
   *  game is a per-week flow (`parentIncomeCents`) or a per-bill factor (`wealthCorridor`); these
   *  three are the only BALANCES the design ever named, and the whole economy was tuned against them
   *  – the round-12/13 comments below argue about a career going bankrupt out of the 120k reserve and
   *  a first playtest burning the 25k one inside a season. See `world/means.ts` for what reads them. */
  startingFundsCents: {
    wealthy: 120_000_00,
    middle: 25_000_00,
    working: 8_000_00,
  } as Record<FamilyBackground, number>,

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

    // THE VENUE, BY THE RUNG THAT TRAINS THERE (docs/specs/court-follows-the-coach-2026-08.md).
    //
    // ⚠ UNTIL 08.08 THE COURT TOOK NO RUNG ARGUMENT AT ALL, so an Elite coach worked on the same
    // court as a self-coaching parent. The owner priced the real thing himself, from the sport he
    // plays:
    //
    //   «у нас есть корты за 22 доллара в час (кстати, теннисные стоят похожих денег) и за 44+
    //    доллара в час в других местах, есть и дороже всякие элитные корты»
    //
    // ⚠⚠ AND THE OWNER RULED ON THE SHAPE THE SAME DAY, which is why this is a ladder and not the
    // two-step at the top it shipped as for an hour:
    //
    //   «Можно вообще стоимость корта по тиру к тиру тренера привязывать и всё.
    //    Более дорогой тренер = более дорогой корт.»
    //
    // So the court rises with the RUNG, every rung, and that is the whole rule. Multiplies
    // `facilityRateCents`, which is the middle of the `self` band - so at 12-16, middle corridor, the
    // court runs $20 / $20 / $24 / $38 / $48 an hour. x2.4 inside one corridor, x4.46 from the cheapest
    // court in the game to the dearest, against a measured x1.86 before and a real single-city spread
    // of x5.1 (Sydney, one municipal operator) to x16.7 (New York, $15 public clay to $250 indoor).
    //
    // ⚠ `budget` IS THE ONE CELL HIS RULE CANNOT REACH, and it is arithmetic rather than an oversight.
    // A Budget coach's whole bill is $30/h at 12-16 and $20 of it is already the court, so his labour
    // is $10 at the midpoint and $4 at the bottom of his own band. Lifting his court to the owner's
    // own $22 club figure would leave the cheapest Budget coach in the game **$2/h** - below every
    // published coaching rate on Earth, and it would deepen the finding that
    // docs/research/real-coaching-costs.md §7.3 already reports about that corner. The club court is
    // therefore shared by `self` and `budget`, and the fiction is exact: a club coach uses the club's
    // courts, which are the same courts the parent books for herself.
    //
    // ⚠ IT IS A PARTITION AND NOT A RE-PRICE. `hourlyRateCents` is untouched, so `split.totalCents`
    // is the same integer on every week of every career and no survival number can move - measured,
    // 1,620 careers, 538 bankrupt before and after. What changes is which half of the bill the family
    // is looking at.
    //
    // ⚠ THE THREE CHEAP RUNGS ARE 1.0 ON PURPOSE, and it is the one thing here that is NOT a
    // compromise. docs/research/real-coaching-costs.md §7 records that our cheap end was already
    // right and that the owner confirmed it twice without meaning to: his 29.07 research put a Budget
    // coach at $30/h, and his 08.08 figures put the court at $22 and Budget labour at "from $10" -
    // $32, two independent statements 7% apart, with our $20 + $10 = $30 between them. Re-pricing
    // there would be manufacturing a correction.
    //
    // ⚠ WHY `middle` IS 1.2 AND CANNOT BE MORE. Its midpoint total is $50/h, so ANY court above $25/h
    // makes the room the larger half of an ordinary academy's bill and inverts the composition the
    // whole ladder is built on (tests/split-the-bill.test.ts holds Budget court-dominated and
    // everything above it coach-dominated). The hard ceiling is x1.25; 1.2 is the largest step that
    // clears it without landing on the line, and it leaves $26 of coach against $24 of court.
    //
    // ⚠ AND WHY `high` IS 1.9 RATHER THAN THE 2.0 HIS "$44 vs $22" IMPLIES: at 2.0 its court is
    // EXACTLY half its $80 bill, and `coachCents > facilityCents` inverts on a rounding. 1.9 leaves
    // $42 of coach against $38 of court. The other binding constraint is that every rung's band LOW
    // must stay above its own court or a coach drawn at the bottom of his rung books a $0 coach line:
    // high $64/$80/$96 against $38.00/$41.80/$45.60 and elite $96/$128/$160 against
    // $48.00/$52.80/$57.60, per age row. Both are asserted, not assumed.
    //
    // ⚠ THE CORNER WHERE THE TWO AXES MEET, checked because it is the one cell two multipliers can turn
    // into nonsense: ELITE x WEALTHY. At the corridor's ceiling that is $62.40/h at 12-16 and $74.88/h
    // at 23+. Against real premium court hire it is comfortably inside - Roosevelt Island Racquet Club,
    // New York, indoor clay, weekday prime: $132 member / $250 non-member; Hall of Fame Newport grass
    // $250/h; Islington indoor GBP 40 non-member. The corridor and the rung are different axes (the
    // market she trains in, and the venue that market's coaches work at), and at their product the
    // model still sits below the dearest courts anyone actually publishes.
    //
    // THE EMPIRICAL CASE, because "it looks wrong" is not one: a published SINGLE-VENUE coach ladder
    // is only x1.13-1.43 wide (Central Park NYC, Meadows, Oak Hollow, Duke, Pure Tennis, Crawley
    // LTC) and the LTA's own certification ladder is x1.91 - while OUR rung ladder is x4.0. So our
    // four rungs are not four colleagues at one club, they are four VENUES, and a court price
    // identical across them is the thing that does not survive contact with the evidence. One
    // venue's own court card shows how far it should move: Pure Tennis Academy, Wexford PA, $22
    // member / $44 non-prime / $60 prime = x2.7 - to the dollar, the owner's own two numbers.
    courtTierFactor: {
      self: 1.0,
      budget: 1.0,
      middle: 1.2,
      high: 1.9,
      elite: 2.4,
    } as Record<CoachTier, number>,

    // THE WEEK'S JITTER, in basis points, and the ONE main-stream draw the bill spends. A coach has
    // a rate; a WEEK still varies - a session moved, a court booked at a worse hour, an extra half
    // hour before a tournament. +/-8% keeps the bill recognisably his price while leaving the
    // Money screen something to show.
    //
    // ⚠ THIS LINE USED TO END "and it is what preserves the frozen MAIN capture: exactly one pickInt,
    // in exactly the slot the old expense draw held" - WHICH OVERSTATED THE RULE AND WAS CORRECTED ON
    // 08.08. CLAUDE.md invariant 2 is explicit that the capture is "a documented measurement, not a
    // change-gate since v35" and that "a wave that legitimately adds a MAIN draw updates the pin";
    // the pin has already moved three times (45239 -> 51642 -> 41550). What IS permanent is
    // input-independence and the sub-stream rule, and neither of those is about the draw COUNT.
    //
    // ⚠ WHICH LEAVES THE JITTER OWING A REASON OF ITS OWN, because the sentence above records that
    // the roll became jitter partly to keep a slot - provenance, not merit. The merit it should stand
    // or fall on: a real weekly bill is not the same number 52 times, and at +/-8% it is small enough
    // that the rung stays recognisable in the figure and large enough that the family notices the
    // week. The owner has been asked to accept or reject that on its own terms
    // (docs/specs/split-the-bill-2026-08.md §6); removing it is a one-line change costing one MAIN
    // draw and a re-pinned capture, and it is HIS call rather than a thing to inherit by accident.
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
    // ⚠ THIS NUMBER WAS A HARD-CODED LITERAL 52 FOR ONE REASON, AND THE CYCLE THAT FORCED IT IS NOW
    // CLOSED (TB-02). economy.ts used to import `WEEKS_PER_YEAR` from season/calendar.ts while
    // calendar.ts imported `ECONOMY` straight back – a runtime cycle. This object is evaluated at
    // MODULE LOAD, so reading the calendar constant HERE threw "Cannot access 'WEEKS_PER_YEAR'
    // before initialization" in the browser's module order and took the whole app down with it.
    //
    // WHAT IT COST: nothing caught it. It does NOT throw under vitest, whose resolution order
    // differs, so the suite stayed green through the crash; it was found only by loading the real
    // app. The workaround was to write `52` here and confine the imported constant to FUNCTION
    // bodies, where the temporal dead zone has passed – a live landmine that a later edit moving
    // any calendar read up to module scope would have stepped on again.
    //
    // THE FIX IS THE DIRECTION, NOT THE PLACEMENT: the season length now comes from
    // `shared/dates.ts`, a leaf that imports nothing, so economy no longer depends on calendar at
    // all and calendar derives `WEEKS_PER_YEAR` from the same leaf. There is one 52 in the codebase
    // and no cycle to initialise around, which is why this may safely be a named constant again.
    upliftHorizonWeeks: WEEKS_IN_SEASON,
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

  // Local sponsor cameo. The weekly ROLL is unchanged (draw count!), and round-7 b made the payout
  // NEED-BASED – for everyone else the roll result is ignored (no event), the draws still happen so
  // the main stream is background-independent. Amounts unchanged.
  //
  // ⚠ AND SINCE 10.08 "NEED" IS THE BALANCE RATHER THAN THE PROFILE ROW. `eligible: ['working']` is
  // GONE. The intent was need from the start – docs/rounds/round-7.md, 24.07: «спонсор
  // нужде-ориентирован (платит только working)» – and background was a proxy for it because at the
  // time the two coincided. docs/specs/round15-triage.md measured how far they have since come apart.
  // The owner, 10.08: «порог по деньгам на счету, а не по строчке в анкете – всё именно так, и с
  // самого начала так и затевалось».
  //
  // The predicate is `sponsorNeedMet` in engine/world/sponsors.ts and the whole argument for its
  // SHAPE is written there – why a runway and not a dollar figure, why the court and not the whole
  // bill, why a rung cut and not a spend cut. The numbers, and only the numbers, are here.
  // Measured in docs/specs/need-not-background-2026-08.md (tools/runway-probe.ts, tools/two-cells.ts).
  sponsor: {
    rollChance: 0.06,
    amountCents: [500_00, 1500_00] as [number, number],

    /** HOW MANY WEEKS OF COURT HIRE THE BALANCE MUST NO LONGER COVER for a shop to chip in.
     *
     *  ⚠ 62 IS THE MIDDLE OF A MEASURED BAND, not a chosen figure, and both of its walls are numbers
     *  rather than opinions (50 seeds x 4 seasons on the round-15 2x2, plus a ten-arm rung sweep):
     *    * NOT BELOW ~58, because under that the gate pays the `middle` background MORE of the cameo
     *      than the `working` one and the difficulty setting inverts. The crossover measures at 55-56
     *      and it is the wealth corridor doing it: a middle-market court costs more, so the same
     *      balance buys fewer weeks of it. What puts working back on top above the crossover is the
     *      thing that should – it opens the game $17,000 poorer.
     *    * NOT ABOVE ~68, because past that the two SELF-COACHED cells start collecting it, and they
     *      are the definition of a family that does not need it: they finish four seasons at +$25,626
     *      and +$39,001 and neither goes under water once in 50 careers. They cross 2% of weeks at 72
     *      and reach 10% at 90.
     *    * AND NEVER ABOVE 81 whatever else is true: 81.5 is the worst week-0 runway any eligible cell
     *      holds over 50 seeds, and NOBODY IS IN NEED BEFORE A BALL IS STRUCK. That is round-15 item
     *      16 in one number - the cameo paid the owner's own career in week 2 - and it is the one
     *      bound here that is a correctness condition rather than a balance preference.
     *
     *  ⚠ IT IS DENOMINATED IN COURT WEEKS, WHICH ARE NOT MONEY WEEKS. The court is roughly a quarter
     *  of what a family actually spends in a week (measured: $77 of a $335 week self-coached, $92 of
     *  $357 with a middle coach), so 62 court weeks is nearer 15 weeks of the real burn. The unit is
     *  the court because the court is the part she cannot get out of; the number is 62 because that
     *  is where the band is. */
    runwayWeeks: 62,

    /** ...AND ABOVE THIS RUNG NOBODY CHIPS IN, however empty the account (owner, 10.08: «у нас есть
     *  маркер трат в неделю, если тренер стоит дороже, то нечего и помогать»). A shop backs the girl
     *  whose family is doing this on a shoestring, not the one that has hired the best coach in the
     *  city – a story rule first and an anti-exploit second.
     *
     *  ⚠ `middle` AND NOT LOWER, because the owner's own two careers are 8k self-coached and 25k
     *  middle and both stay inside it. ⚠ AND NOT HIGHER, because `high` and `elite` are exactly where
     *  a need gate would start paying for the coach: measured at this threshold, a `high` rung holds
     *  the cameo's gate open for 99% of a working career's weeks and an `elite` one for 100% – against
     *  53-60% at `middle`, 9-14% at `budget` and 1-2% self-coached.
     *  The rung ladder's own comment already says what the top of it is – "The steps between them
     *  shrink as they climb while the price roughly doubles every two rungs. Elite is a luxury, not an
     *  optimisation" – so cutting above `middle` reads a property `ECONOMY.coach` asserts about itself.
     *
     *  ⚠ THE CUT IS ON THE RUNG AND NOT ON THE WEEKLY DOLLARS. See `sponsorNeedMet`: the corridor
     *  prices the same rung differently by background, so a dollar cut would refuse a wealthy family's
     *  `middle` coach and allow a working family's – background back through the side door, in the one
     *  mechanic this wave exists to take it out of. */
    maxCoachTier: 'middle' as CoachTier,
  },

  // THE LOCAL SPONSOR – a shop in her town backing the local girl who is doing well locally.
  //
  // ⚠ REBUILT 30.07 (tune/rank-numbers). It was a "product-sponsorship valve": a PERCENTAGE
  // discount (half / free) on each gear line-item, gated on `world.kidRank`. Both halves were
  // wrong, and in two different ways.
  //
  // THE GATE WAS WRONG IN KIND, not in degree. `world.kidRank` is her INTERNATIONAL rank, and a
  // local sponsorship is by concept a DOMESTIC-ladder reward. Gating a shop in her home town on a
  // world junior ranking is the same category of error as the two rank writers this branch fixed:
  // an award for domestic prominence denominated in a currency she does not hold. Measured over 120
  // seeds x 208 weeks it therefore fired for NOBODY, in ANY preset, in ANY season - her ITF rank
  // sits at #89-#109 and the gate wanted #30. Her NATIONAL rank sits at #8-#18, which is what a
  // local shop would actually be looking at. So the gate reads the national table.
  //
  // THE AMOUNT WAS WRONG BECAUSE IT SCALED WITH THE FAMILY'S OWN SPENDING. A share of a gear bill
  // is a share of a bill that runs through the wealth corridor (a wealthy family's racket is
  // $480-650 against a working family's $60-120, bought more often), so the same "half price" paid
  // the wealthy family $2,384 a season against the working family's $348 - seven times - measured
  // on the national gate. A local shop's cheque does not know how rich the family is. So the amount
  // is FLAT: the same figure for every background, and it is the whole mechanic's shape rather than
  // a multiplier on something else.
  //
  // WHY A SEASON'S GRANT RATHER THAN A PER-PURCHASE DISCOUNT. Three reasons, and the third is
  // decisive:
  //   * the sources denominate it that way. docs/research/02-tennis-economics.md: junior equipment
  //     sponsorship is "mostly product-only (racquets/strings/shoes, ~$1k+/yr value), 3-4 year
  //     terms". The deal IS an annual value, not a discount rate;
  //   * ECONOMY.academy.kitCentsAtFull already made this exact call for the same reason, and its
  //     comment says so: paid "as money rather than as a gear discount because it arrives once a
  //     year, not per purchase";
  //   * a per-purchase cap CANNOT be flat. The wealthy family buys 39 kit items a year against the
  //     working family's 25 (ECONOMY.gear cadences), so any per-item figure pays it ~1.6x more
  //     however the cap is drawn. Only a per-SEASON figure is actually flat.
  //
  // AND IT IS MORE VISIBLE, which is the other half of item 27. The old valve was smeared across
  // 25-39 invisible line-items; two-ladders.md measured the sibling cash cameo losing 3.10 gifts a
  // season down to 0.65 still on screen at season end, because the snapshot keeps only the trailing
  // 60 events. One annual lump in the `sponsor` income category survives that window.
  //
  // ⚠ THE THRESHOLDS ARE DELIBERATELY THE OLD 30 / 10, moved table but not moved number, so the
  // owner can read the change as "same gate, honest ladder, flat cheque" rather than having to
  // attribute a threshold move at the same time.
  //
  // ⚠ AND IT IS OPEN TO EVERY BACKGROUND, which is a deliberate difference from its sibling. The
  // random `ECONOMY.sponsor` cameo is need-based (`eligible: ['working']`) because it is a gift. This
  // is not a gift - it is EARNED, on the national ladder, and a shop backing the local girl does not
  // audit her parents' income. Means-testing it would also make the mechanic unmeasurable at the top
  // end, and how ruinous the road actually is up there is an open question rather than a settled one.
  // The wealthy family's numbers are reported alongside everybody else's in two-ladders.md §2.
  // ⚠ AND IT IS PAID IN KIT NOW, NOT IN CASH (31.07, feat/offers-inbox-slice). The owner's first
  // rung on docs/specs/offers-and-the-inbox.md's ladder of instruments: «кит вместо денег». Nothing
  // above changes - the gate is the same national table, the figure is the same figure - but the
  // money never reaches the balance. The shop pays her racquet / string / shoe bills as they land
  // until `seasonCents` of them have been paid, and keeps her kit fresh while it does.
  //
  // WHY THAT IS NOT THE VALVE THIS BLOCK ALREADY REJECTED, which is the first question a reader of
  // the argument above should ask. The old valve was a PERCENTAGE of each gear line with no ceiling,
  // so it paid a share of a corridor-scaled bill and handed the wealthy family $2,384 against the
  // working family's $348. This is the per-SEASON figure the paragraph above calls the only flat
  // shape there is - it is simply SPENT on kit rather than handed over, and a family cannot spend
  // more of it by being rich. The direction of the residual difference is also the honest one: a
  // working family's covered lines run to roughly the whole allowance, so she gets her kit paid for,
  // and a wealthy family's run far past it, so the shop covers a slice of a bill she could always
  // afford. And the FRESHNESS half is flat by construction (see `freshCap`) and worth most to
  // exactly the family that was stretching a string bed past its life.
  //
  // WHY IT HAD TO BECOME A DECISION. `02-tennis-economics.md` calls a junior deal "mostly
  // product-only (racquets/strings/shoes, ~$1k+/yr value)" - which is what this block has been
  // paying in cash for want of a mechanism. Main now carries equipment condition, so there is
  // somewhere real for the product to land, and once it lands somewhere real it is worth being asked
  // about. See engine/offers.ts.
  sponsorship: {
    /** NATIONAL rank at or inside which a local shop signs her at all. */
    maxRank: 30,
    /** ...and at which the deal steps up - she is one of the best juniors in the country. */
    topMaxRank: 10,
    /** ⚠ ...AND THE JUNIOR TABLE, BECAUSE THE DOMESTIC GATE ON ITS OWN IS INVERTED (09.08, the owner:
     *  «у нас 3 тира этих спонсоров, а мне достается только 1 самый первый… у неё кончился контракт,
     *  а нового не дали»).
     *
     *  THE DEFECT, ON HIS OWN SAVE. Olivia at week 104 stands national #67, ITF #4, no professional
     *  ranking. She CLEARS `global` and she CLEARS `national` - and `local` REFUSED her, because the
     *  only evidence the shop would look at was `maxRank` above and she had slid to #67 at home by
     *  playing abroad. Her five-week window therefore carried two letters instead of three, both dice
     *  missed (0.3 x 0.3 = 9%), and she opened the season with no deal at all.
     *
     *  ⚠ AND THAT IS THIS BLOCK'S OWN 30.07 ERROR WITH THE TWO TABLES SWAPPED. The note above records
     *  a local sponsorship gated on a table she does not hold (the ITF one, when her standing was
     *  domestic) and fixes it by reading the national table. The same sentence is true again in the
     *  other direction the moment she leaves home: her domestic points are a rolling 52-week best-6,
     *  so a season on the international calendar decays them to nothing, and a gate that reads only
     *  that table says «the better she gets abroad, the more certainly the shop in her own town
     *  refuses her». A floor that turns away the careers the big brands passed on is not a floor.
     *  So the local rung reads WHICHEVER table she is on, exactly as `national` and `global` learned
     *  to on 02.08 - `standingClears` already carried `|| standing.wtaRanked` as the professional
     *  escape hatch, and this is the junior one it was missing.
     *
     *  ⚠ 128 = `TIERS.j300.drawSize` x 4, AND IT IS THE LADDER'S OWN STEP RUN DOWNWARDS. National is
     *  the J300 main draw (32) and Global is the last eight of it (32 / 4), so the rungs divide by
     *  four as they climb; the rung BELOW national multiplies by four. Pinned as an equality in
     *  tests/offers.test.ts beside its two neighbours, for the reason they are pinned there: this
     *  file cannot import the calendar, so a J300 that ever changed its draw would otherwise detach
     *  the ladder from the ladder it describes.
     *
     *  A SECOND READING OF THE SAME TIER ROW LANDS ON THE SAME NUMBER, which is why it is this one
     *  and not a round figure that felt right: J300 runs `everyNWeeks: 13`, i.e. four a season, so
     *  128 is every main-draw place at the prestige rung over a whole year. National signs the girl
     *  who is IN this draw; Global the one still in it on the last day; the shop backs the girl good
     *  enough to be in a J300 draw at some point this season. That is what a home-town shop knows
     *  about a girl - that she plays at that level - and it is deliberately WIDER than the
     *  distributor's gate, because a shop should be more eager to back a girl the world ranks, not
     *  less.
     *
     *  ⚠ WHERE IT BITES TODAY, MEASURED, BECAUSE THE NUMBER SHOULD NOT BE TRUSTED WITHOUT THIS. The
     *  junior table is the cohort (200 rows) and 75-122 of them hold a counting result in any given
     *  winter (min 75, p50 90, max 122 over 30 observations - three presets x two seeds x five
     *  winters, `rankingFor` at the window's opening week), so a cut at 128 sits just PAST the ranked
     *  depth: in today's population this arm reads "she holds a junior world ranking at all". That is
     *  the same shape the professional arm one line below it already has, and it is the intended
     *  reading - but the ceiling is written down anyway, because the cohort has grown once already
     *  (FIELD 520 -> 1,600) and a rule spelled "any ranking" would silently stay unbounded when the
     *  table outgrows it, while this one starts biting again the day it does.
     *
     *  ⚠ AND IT CANNOT BECOME A PENSION. `itfRanked` is a LIVE 52-week window (`sponsorStandingOf`),
     *  so a girl who stops entering loses the arm on her own - the escape hatch holds only while she
     *  is actually competing, which is the same thing `minEvents` asks of the deal itself. */
    localMaxItfRank: 128,
    /** What the season's kit deal is worth, flat, every background the same. `~$1k+/yr value`,
     *  02-tennis-economics.md's figure for a junior product deal, taken at its stated midpoint.
     *  Now a CEILING ON WHAT THE SHOP SPENDS on her kit rather than a cheque - see the note above. */
    seasonCents: 1_000_00,
    /** The stepped-up deal. junior-economics.md: "travel sponsorship only after national/
     *  international wins", and its merit-grant band tops out at £2,000 one-per-player-per-year -
     *  so the better deal is kit plus a hand with the travel, at the top of that band. */
    topSeasonCents: 2_000_00,
    /** The name on the letterhead, and it is READ OFF THE ART rather than invented here: the owner's
     *  own `public/images/sponsors/local.webp` is a racket and a reel of string over the words
     *  "STRING HOUSE – LOCAL. HONEST. TIGHT.". The mark is the signature on the letter, so the two
     *  have to agree; a name picked in this file would have been a second source of truth for the
     *  same shop. ONE rung only - the national and global marks are the brand ladder, which is a
     *  later slice (see `SponsorTier`). */
    localBrand: 'String House',
    /** HOW FRESH THE SHOP KEEPS HER KIT, as a ceiling on `KitWear` (0 = as new, 1 = spent). The
     *  standard deal at 0.5 leaves her at the middle of every service life rather than the dead end;
     *  the stepped-up deal at 0.3 is nearer to always-fresh. Sized SMALL on purpose: the whole
     *  equipment swing is already under one year of relative age (ECONOMY.equipment), so a cap can
     *  only ever be worth a fraction of that, which is the correct order of magnitude for a junior
     *  kit deal and keeps the anti-destiny bound this block's neighbour measures. */
    freshCap: 0.5,
    topFreshCap: 0.3,
    /** WHAT SHE OWES: tournaments entered over the season for the shop to write again. A sponsor
     *  pays to be SEEN, so it wants her playing - and this is the trap the whole design is built
     *  around (spec §4.1): the coach's job is load management and the bench has measured three times
     *  that resting beats racing, so a kit deal is a standing bribe to do the thing that loses.
     *  Sized off what a junior season already contains rather than off what would hurt: six is
     *  roughly the entry cap's own shape at the younger ages, so an ordinary season clears it and a
     *  season spent nursing her does not. */
    minEvents: 6,
    topMinEvents: 8,
    /** HOW LONG THE PARENT HAS TO THINK, in weeks, counted INCLUSIVELY from the week the letter
     *  lands: the deadline is `arrival + decideWeeks - 1` (`kitOfferDeadline`), so five means the
     *  arrival week and the four after it, and the letter is still answerable on the last of them.
     *  The owner asked for exactly this - «давать человеку какое-то время на подумать».
     *
     *  ⚠⚠ IT BELONGS TO THE LETTER AGAIN, AND IT IS FIVE (28.08, round 28 #17-b, HIS RULING):
     *
     *      «в чем проблема сделать 5? у нас конечная неделя сезона 49 по сути, дальше окно в новый
     *       сезон, даже если приглашение придет на 1й или 2й неделе я не вижу проблем сделать слот
     *       в 5 недель»
     *
     *  From 05.08 to 28.08 this number SIZED THE WINDOW instead: `SPONSOR_WINDOW_WEEKS` was read as
     *  `decideWeeks + 1`, every letter of a winter expired when the window closed, and so the first
     *  letter of a winter carried five weeks and the last carried two. That bought one property -
     *  «no decision is ever open while she is playing» - and it cost the thing this constant is
     *  named for.
     *
     *  ⚠ WHAT HE IS KNOWINGLY GIVING UP, because the next reader of `docs/specs/sponsor-window-2026-08.md`
     *  §3.1 will otherwise re-derive the old rule from a document that still argues for it. A letter
     *  raised on the window's closing week now runs four weeks into the new season, so the inbox can
     *  hold a live decision while she is playing. He was shown that objection in those words and
     *  overruled it, and he is more right than the spec is, for a reason the spec could not have
     *  known: **the property was already gone.** Round 28 #2 gave the ADVERTISING letter five fixed
     *  weeks from arrival, and an advertising letter arrives on whatever week a campaign notices her
     *  - mid-season, most of the time. So «no decision open while playing» had already stopped being
     *  true of the inbox; the window guarantee only ever covered kit letters. His ruling makes the
     *  two kinds of post one rule instead of two, which is simpler than what it replaces.
     *
     *  ⚠ THE WINDOW ITSELF DID NOT MOVE. `SPONSOR_WINDOW_WEEKS` is `OFF_SEASON_WEEKS + 2` and always
     *  was - that is «межсезонье +2», the owner's own sentence - and it is still the five weeks a
     *  brand may WRITE in. What is no longer true is the second reading, `decideWeeks + 1`: the two
     *  numbers are now independent and only coincidentally equal, so nothing should re-derive one
     *  from the other. See `SPONSOR_LETTER_WEEKS`, whose reason changed with this. */
    decideWeeks: 5,
    /** WHETHER THE SHOP WRITES AT ALL in a season she qualifies for. Not 1, on purpose: an offer
     *  that is guaranteed to come round again is an offer with no cost to letting it expire, and
     *  spec §2 asks for the reverse ("an offer left to expire is gone, and the next one is not
     *  guaranteed to be as good"). Drawn from `seed:offer:<week>` - never the weekly stream. */
    offerChance: 0.7,
    topOfferChance: 0.9,

    // --- THE BRAND LADDER: the two rungs above the shop (01.08, feat/brand-ladder) ---------------
    //
    // WHY IT EXISTS, in the owner's own case. He finished a season #1 NATIONAL and #13
    // INTERNATIONAL and asked whether two contracts would arrive. They would not: `kitTermsFor` read
    // only the table above, so a girl who is thirteenth in the world was still being written to by
    // one shop in her town, and by nobody else. A national top-30 and a world top-30 are not the
    // same achievement and are not interesting to the same people.
    //
    // ⚠ THE RUNG IS COVERAGE, NOT PRESTIGE - see `SponsorTier`. What steps up is WHICH OF HER LINES
    // the brand supplies (strings / +frames / +shoes +travel), which is legible off the gear the
    // game already models, rather than a number the game would have to invent and then explain.
    //
    // ⚠ AND THE TWO UPPER GATES READ THE INTERNATIONAL TABLE, WHICH IS THE POINT. The local shop
    // keeps the domestic gate above (`maxRank` / `topMaxRank`) - that argument is unchanged and a
    // home-town shop reads the ladder she is on at home. A national distributor and a global brand
    // read the one she is on abroad.
    //
    // ⚠ AND THAT IS THE EXACT ERROR two-ladders.md CAUGHT ONCE ("the gear valve has never fired for
    // anybody": an ITF-rank gate at #30 fired for NOBODY in any preset, because her ITF rank sat at
    // #89-#109). It is not that error twice, for two reasons, and both are measured rather than
    // asserted. First, the ladder still has a rung for those careers - the local shop, on the table
    // they actually hold. Second, the numbers below were picked against a sweep
    // (tools/brand-gate-bench.ts, 18 preset x policy cells x 12 seeds x 312 weeks, best ITF rank ever
    // held): 78/216 careers reach #32 and 34/216 reach #8. The self-coached and grinder cells never
    // reach either - which is the discrimination we want, not a failure - and every managed cell
    // clears #32 in most seeds. So both rungs are live content, and neither is free.
    national: {
      /** Read off `public/images/sponsors/national.webp`, which is a wordmark over "STRINGS.
       *  FRAMES. NATIONWIDE." - the coverage this rung ships is on the picture. */
      brand: 'Netrally Distribution',
      /** ⚠ ITF RANK AT OR INSIDE WHICH THEY WRITE, AND IT IS THE J300 MAIN DRAW.
       *  = `TIERS.j300.drawSize`, pinned as an equality in tests/offers.test.ts because this file
       *  cannot import the calendar (calendar.ts imports ECONOMY; the cycle is the reason the number
       *  is written out here rather than computed). A sponsor pays to be SEEN, and J300 is the one
       *  rung in the junior game with a four-figure crowd (900-2,600 against j60's 110-320) - the
       *  lore's "one rung where a junior plays in front of strangers". Inside the world's top 32 she
       *  would fill that draw on merit, which is precisely when a national distributor's logo starts
       *  being worth something. */
      maxItfRank: 32,
      /** ⚠ ...AND THE PROFESSIONAL RANK THAT SAYS THE SAME THING (02.08, the owner: «спонсор вполне
       *  может жить и дальше»). Built exactly as `maxItfRank` above is - off one figure in the tier
       *  table, not picked: National signs the girl who would be IN the prestige draw, and on the
       *  professional side that is W100's acceptance list, `enterPct` 0.25 of the merged W table.
       *  That table is FIELD.size + the cohort (199) + her, so a quarter of it is this number.
       *  Pinned against both figures in tests/offers.test.ts, the same way the junior pair is
       *  pinned against `TIERS.j300.drawSize`.
       *
       *  ⚠ 125 -> 350 BY W2-FIELD2, IN TWO STEPS, AND BOTH ARE THE DERIVATION MOVING RATHER THAN A
       *  DECISION. The rule has not changed a word - National signs the girl who would be IN the
       *  W100 draw, i.e. on W100's acceptance list, whatever that list currently is.
       *    1. the fourth storey took the merged table 500 -> 564 rows, so the old SHARE (0.25) went
       *       125 -> 141;
       *    2. then the share itself was retired. Against a table carrying the real points-to-rank
       *       curve a share bites in real ranks - it made the W ladder unwalkable - so the W rungs
       *       took the real tour's own cuts, and a real W100 accepts to about #350.
       *  So this is `TIERS.w100.acceptsRank`, read straight. It IS a looser gate than before, and
       *  that follows from the table being honest rather than compressed: #350 of a 564-row
       *  professional field is a different player from #141 of a table whose #300 held nine points.
       *  Flagged for the owner in the wave report rather than smoothed over.
       *
       *  ⚠⚠ 350 -> 240 (P3, 16.08), AND IT IS THE DERIVATION MOVING FOR THE THIRD TIME RATHER THAN A
       *  NEW DECISION - exactly as the two steps above were. `TIERS.w100.acceptsRank` went 350 -> 240
       *  as the fourth link of the sourced acceptance chain
       *  (docs/specs/acceptance-cuts-corrected-2026-08.md), and the rule here has still not changed a
       *  word: National signs the girl who would be IN the W100 draw, whatever that list currently is.
       *  The equality is pinned by tests/offers.test.ts, so the two cannot drift apart silently.
       *
       *  ⚠ BUT THE DIRECTION IS THE OPPOSITE OF LAST TIME AND THE OWNER SHOULD SEE IT. The paragraph
       *  above flagged a LOOSER gate; this is a materially TIGHTER one - a national sponsor now wants
       *  a top-240 professional where it wanted top-350. Nobody retuning the ladder opened this file,
       *  which is precisely the coupling `TIERS.w100`'s own comment has warned about twice. It is the
       *  first item on the P3 spec's escalation list.
       *
       *  ================================================================================================
       *  ⭐⭐ 240 -> 350, AND THE DERIVATION IS RETIRED: THIS NUMBER IS ITS OWN DECISION NOW (16.08).
       *  ================================================================================================
       *  Everything above this line is the RECORD of how the number got here, kept verbatim because it
       *  is the evidence. What changed is not the value, it is the WIRING.
       *
       *  THE DEFECT IS THE ONE P4 FIXED FOR THE COLLEGE DOOR: one constant doing two unrelated jobs.
       *  `TIERS.w100.acceptsRank` decided BOTH who the tour lets into a W100 AND how famous a rank has
       *  to be before a national distributor writes to her - so P3's acceptance-cut work, which was
       *  about the first, silently moved the second. Nobody decided that; it was a SIDE EFFECT, and the
       *  three paragraphs above are the sound of the repo noticing and shipping it anyway.
       *
       *  AN ACCEPTANCE CUT AND A SPONSOR'S INTEREST HAVE NO REASON TO SHARE A NUMBER. The cut is a rule
       *  of the tour - who may enter, decided by the ITF and the WTA. The sponsor gate is a fact about
       *  visibility - how famous a rank makes you, decided by a marketing department. They coincided
       *  once, in 02.08's derivation, and a coincidence is not a dependency. So the rule that read
       *  "whatever that list currently is" is withdrawn: it was a good way to PICK the number and a bad
       *  way to HOLD it.
       *
       *  350 IS THE VALUE IT HELD BEFORE THE COUPLING DRAGGED IT, restored rather than re-picked -
       *  because the coupling is what moved it and nothing else did. Reverting the side effect is not a
       *  new balance decision and must not be dressed as one; the P3 chain keeps its four links, and
       *  W100's door stays at 240 where the ladder work put it.
       *
       *  ⚠ WHAT IS NOT DECIDED HERE. Whether 350 is still the RIGHT number, now that the rest of the
       *  ladder has moved under it, is a live question and it is the owner's - see
       *  `global.maxWtaRank` below, where it bites hardest, and the spec. Restoring a number the
       *  coupling took is a different act from choosing it. `tests/offers.test.ts` now guards the
       *  DECOUPLING (move `TIERS.w100.acceptsRank`; these two must not follow) instead of pinning the
       *  equality that made the drag possible. */
      maxWtaRank: 350,
      /** ⚠ ...AND THE DOMESTIC STANDING SHE HAS TO KEEP TO HOLD IT = `maxRank` above, the same top
       *  30 that opens the local shop. This is National's job on the way OUT and the whole reason
       *  this rung is gated on two tables at once: her domestic points are a rolling 52-week best-6,
       *  so a season spent entirely on the international calendar decays them to nothing and she
       *  slides out of this band. The deal ends when she does.
       *
       *  ⚠⚠ AND IT IS NOT THE ONLY WAY TO HOLD THE DEAL ANY MORE (02.08). The paragraph above is
       *  true of a JUNIOR who goes abroad - a lateral move inside the same visibility economy, and
       *  a brand that paid for a domestic name is entitled to notice. It is simply false of a
       *  PROFESSIONAL: she is not less visible than the girl they signed, she is more. So the
       *  keep-condition now reads "still worth being seen with", which the professional rank answers
       *  too - see `standingClears` in offers.ts, which is the one place either question is asked.
       *  The deal's other condition (`minEvents`) is untouched and is still the real obligation: a
       *  sponsor pays to be SEEN, so a season spent resting still costs the deal, at every rung. */
      keepDomesticRank: 30,
      /** TWO SEASONS. `02-tennis-economics.md` puts junior equipment deals at "3-4 year terms"; our
       *  whole junior career is four to six seasons, so the real figure is scaled to the game's own
       *  horizon rather than copied. A term longer than a season is what gives ONE BRAND AT A TIME
       *  its bite: sign this and the global letter that arrives next winter finds her busy. */
      seasons: 2,
      /** WHAT THE SEASON'S KIT IS WORTH, and it is sized on the gear table rather than picked. The
       *  two lines it names cost, over a season: ~$600 working, ~$1,500 middle, ~$4,200 wealthy
       *  (ECONOMY.gear cadences x prices). $3,000 covers both outright for the working and middle
       *  corridors and about two thirds of the wealthy one - which is EXACTLY the relationship
       *  `seasonCents` already has to the single string line ($1,000 against $312 / $625 / $1,495).
       *  Same shape, one rung up, so the ladder's economics are one decision rather than three. */
      seasonCents: 3_000_00,
      /** The stepped-up local deal's own figure, unmoved. ⚠ AND THAT IS DELIBERATE: what a higher
       *  rung buys is MORE LINES, not fresher ones. A second freshness number here would quietly
       *  turn the ladder back into a prestige scale, which is the one thing `SponsorTier` says it is
       *  not. */
      freshCap: 0.3,
      /** WHAT SHE OWES. The pair above steps 6 -> 8; this rung and the one above it keep walking the
       *  block's own step of two. It is the design's best trap and it has to get worse as the deal
       *  gets better: the coach's job is load management, the bench has measured three times that
       *  resting beats racing, and a bigger cheque is a bigger standing bribe to do the thing that
       *  loses. Ten is comfortably inside the ITF's own annual allowance at the ages that reach this
       *  rung (25 at sixteen, unrestricted at seventeen), so it is a choice and never a wall. */
      minEvents: 10,
    },
    global: {
      /** Read off `public/images/sponsors/global.webp` - a wordmark over "EQUIP. SUPPORT.
       *  ELEVATE.", which is this rung's three promises in the artwork's own words. */
      brand: 'Play Beyond',
      /** ⚠ THE LAST EIGHT OF THAT SAME DRAW = `TIERS.j300.drawSize / 4`, pinned in the tests beside
       *  `national.maxItfRank` for the same reason. National signs the girl who would be IN the
       *  prestige draw; global signs the one who would still be in it on the last day. Both numbers
       *  therefore come off ONE figure in the tier table, which is what keeps the ladder's shape a
       *  reading of the game rather than two round numbers picked to feel right.
       *
       *  It leaves the owner's own #13 season one rung short, and that is the intended answer rather
       *  than an accident: the calendar's standing rule is that "there must ALWAYS be somewhere to
       *  go". */
      maxItfRank: 8,
      /** ⚠ THE PROFESSIONAL FIGURE, and it is the same reading one rung up (02.08): National signs
       *  the girl who would be in the prestige draw, Global the one who would still be in it on the
       *  last day - the last quarter. Junior: 8 of the J300's 32. Professional: 87 of the 350 who
       *  would be accepted into a W100 (`national.maxWtaRank` / 4, rounded down as the junior pair
       *  divides exactly). Pinned beside its neighbour in tests/offers.test.ts.
       *
       *  ⚠ 31 -> 87 BY W2-FIELD2, for exactly the reason its neighbour carries: this is a quarter of
       *  W100's acceptance list, and that list was re-derived from the real tour's own cut.
       *
       *  ⚠⚠ 87 -> 60 BY P3 (16.08), THE SAME DERIVATION FOLLOWING THE SAME SOURCE - `national` went
       *  350 -> 240 with `TIERS.w100.acceptsRank`, and a quarter of 240 is 60.
       *
       *  ⚠ AND IT SQUEEZES THIS RUNG'S BAND HARD ENOUGH THAT THE OWNER SHOULD SEE IT. Global sits
       *  between `premium` (50) and itself, so its band was ranks **51-87 (37 places wide)** and is
       *  now **51-60 (ten)**. Nothing decided that; it fell out of a ladder correction four files
       *  away. Whether a sponsorship rung ten ranks wide is still a rung is a balance question, and
       *  it is on the P3 spec's escalation list rather than absorbed here.
       *
       *  ================================================================================================
       *  ⭐⭐ 60 -> 87, AND THIS NUMBER IS ITS OWN DECISION NOW (16.08). See `national.maxWtaRank` above
       *  for the whole argument - one constant was doing two unrelated jobs, and an acceptance cut and
       *  a brand's interest have no reason to share one.
       *  ================================================================================================
       *  87 IS THE VALUE IT HELD BEFORE THE COUPLING DRAGGED IT, restored and not re-picked. The band
       *  goes back to ranks **51-87 (37 places)** from the ten it had been squeezed to.
       *
       *  ⚠⚠ AND A BAND TEN RANKS WIDE IS NOT A BAND - which is the reason this rung is where the defect
       *  actually hurt. `premium` sits at 50 and `global` at 87, so the whole of this rung's professional
       *  territory is #51-#87: every career that ever holds a rank in that window, for the weeks it holds
       *  it. At 60 that window was #51-#60, and a rung a career crosses in a season or two of climbing is
       *  a letter that arrives, if at all, by luck.
       *
       *  ⚠ WHETHER 87 IS STILL RIGHT IS THE OWNER'S CALL AND IS DELIBERATELY NOT TAKEN HERE. The
       *  argument that made it 87 was arithmetic - a quarter of national's 350 - and that arithmetic is
       *  exactly the derivation this decoupling retires, so the number now stands on nothing but its own
       *  history. It also has to sit ABOVE `premium`'s 50 and BELOW `tour`'s 200 to keep the sponsor
       *  chain monotone (national 350 > tour 200 > global 87 > premium 50 > icon 10), and 87 is barely
       *  a third of the way up that gap. Reported in the spec, not moved: restoring what the coupling
       *  took is a revert; choosing a new figure is a balance decision and it is his. */
      maxWtaRank: 87,
      /** THREE SEASONS - the top of `02-tennis-economics.md`'s "3-4 year terms", scaled the same way
       *  `national.seasons` is. Signing it is the biggest commitment in the game: everything is
       *  covered, and nothing else can be signed until it runs out. */
      seasons: 3,
      /** ⚠ "EVERYTHING" HAS TO MEAN EVERYTHING, and that is what sizes this. All three lines cost
       *  ~$900 working, ~$2,020 middle, ~$4,700 wealthy over a season, so $5,000 clears the most
       *  expensive corridor in the game outright. Every other rung's allowance is a ceiling the
       *  letter is honest about ("up to"); this one is the rung whose letter says "everything", so
       *  it must not be a promise that runs out in October for a wealthy family. */
      seasonCents: 5_000_00,
      /** The same ceiling again, and see `national.freshCap`: the rung buys lines, not freshness. */
      freshCap: 0.3,
      /** The step of two, once more: 6 -> 8 -> 10 -> 12. */
      minEvents: 12,
      /** ⚠ A HAND WITH THE TRAVEL - the one thing no other rung does, and the reason this is the top
       *  of the ladder rather than just a third line of kit. `junior-economics.md`: "travel
       *  sponsorship only after national/international wins", which is exactly this gate.
       *
       *  A QUARTER OF THE FARE, and the size is read off the wealth corridor rather than picked: a
       *  trip costs a wealthy family x1.2-1.3 of the sticker and a middle one x0.95-1.05, so a
       *  quarter off is worth almost exactly ONE STEP DOWN that corridor. It is deliberately nowhere
       *  near `ECONOMY.academy.travelCover` (0.75 since R15-7): the academy is a need-based rescue that decides
       *  whether a working family survives at all, and a brand must not quietly become a second one.
       *  This helps a family reach further; it does not carry it.
       *
       *  ⚠ NOT MEASURED ON THE ECON BENCH YET. It is the one number in this block that is argued
       *  rather than swept, and travel is the biggest line in the game, so it is the first knob to
       *  put through econ-bench when the ladder has run for a while. */
      travelShare: 0.25,

      // ===============================================================================================
      // ⭐⭐ ROUND 29 PART TWO #5 – THE CASH THIS RUNG NEVER HAD, AND IT IS THE OWNER'S RULING ON A
      // DEFECT THE SPEC ITSELF PREDICTED AND NOBODY EVER TOOK TO HIM.
      // ===============================================================================================
      //
      // HIS WORDS: «мировые топы должны иметь все возможности достучаться до топовой спортсменки.»
      //
      // WHAT WAS WRONG. `global` is sorted ABOVE `tour` – the chain is national 350 > tour 200 >
      // global 87 > premium 50 > icon 10 – and it paid LESS: the same $5,000 of kit and the same 25%
      // of the fare, but NO retainer against tour's $6,000 a season and NO result bonus against
      // tour's 20% of every W75+ cheque, while locking THREE seasons against two. A parent who signed
      // the stronger-looking letter on sight was strictly worse off, which is the exact inversion
      // `windowLadder`'s own header promises cannot happen («signing on sight is always safe and
      // waiting always optional»). `tools/sponsor-ladder-reach.ts` prints it as a ⚠ line, and
      // `tests/round29p2-ladder-monotone.test.ts` is now the guard that stops it recurring – written
      // as a property over the WHOLE ladder rather than as a case about this rung.
      //
      // ⚠⚠ AND IT WAS PREDICTED AT DESIGN TIME. `docs/specs/act2-pro-tour.md` §7, verbatim: «`tour`'s
      // WTA ≤ 200 sits deliberately BELOW global's 31 in strength while above it in kind, which is
      // the one thing to resolve when it is built … an owner's call at build time, not now.» The call
      // was never taken and the rungs shipped side by side. This is that call, finally made, and the
      // spec is amended where it stood open.
      //
      // ⚠ THE FIX IS THE TERMS AND NOT THE GATE, on his instruction. Nothing about who Play Beyond
      // writes to moves by a single rank; what moves is what the letter is worth when it comes.
      /** ⭐ THE RETAINER, AND IT IS READ OFF THE SPEC'S OWN BAND RATHER THAN PICKED. §7 gives the
       *  professional retainer a «~$3–8k/yr» band and `tour` takes the MIDDLE of it ($1,500 a
       *  quarter = $6,000 a season). This rung takes the TOP of the same band – $2,000 a quarter =
       *  $8,000 a season – which is the smallest honest number that is strictly better than the rung
       *  below rather than merely equal to it.
       *
       *  ⚠ STRICTLY BETTER AND NOT MERELY EQUAL, ON PURPOSE. Equal money would still leave this rung
       *  the worse deal, because it locks a THIRD season and a running deal turns the post away – so
       *  a parent who signed it would give up a winter of letters for nothing. (Round 29 part two
       *  #12 narrows that cost: a strictly stronger rung may now write while a deal runs. It does not
       *  remove it – `premium` may write over this deal, `tour` may not.)
       *
       *  ⚠ AND IT STAYS INSIDE THE CHAIN ABOVE IT: `premium`'s $7,500 a quarter is still §7's
       *  «retainer ×5–10» of `tour`, which is the relationship that clause names, and $2,000 sits
       *  between the two without disturbing either. */
      retainerCents: 2_000_00,
      /** ⭐ THE RESULT BONUS, AND HERE THE HONEST NUMBER IS EXACTLY TOUR'S. The share ladder is
       *  20% → 25% → 30% across tour → premium → icon and the reach is w75 → w50 → w50; inserting a
       *  fourth value between 20 and 25 would be inventing a number to fill a gap the design does not
       *  have. Taking tour's pair verbatim keeps the whole chain non-decreasing (20 / 20 / 25 / 30,
       *  w75 / w75 / w50 / w50) and adds nothing to retune.
       *
       *  ⚠ WHY THE MONEY LADDER STEPS ON THE RETAINER AND NOT HERE. A retainer is a promise about
       *  HER; a result bonus is a share of a cheque she has to go and win. This rung's own step up
       *  over `tour` is a longer, safer term, so the term-shaped money is where its step belongs. */
      bonusShare: 0.2,
      bonusFromTier: 'w75' as TierId,
    },

    // --- THE PROFESSIONAL RUNGS: tour / premium / icon (W3-ACT2, act2-pro-tour.md section 7) -----
    //
    // The owner asked for a proposal («да, надо продумать, предложи что-то») and this is it, built.
    // Three things are new in KIND rather than in size, and each of them is the first of its sort in
    // the game: a quarterly cash RETAINER (every rung below pays in gear, because juniors pay to
    // play), an APPEARANCE FEE (money for turning up, which the sport really does pay at the top),
    // and a RESULT BONUS expressed as a share of the tournament's own cheque.
    //
    // THE GATES ARE THE PROFESSIONAL TABLE'S, and they slot into a ladder that already had two
    // professional arms rather than starting a second one. After W2-FIELD2 re-derived the W cuts the
    // full chain reads national 350 > tour 200 > global 87 > premium 50 > icon 10 - monotone, one
    // deal at a time, `rungFor` strongest-first. See `SponsorTier` for why that answers section 7's
    // own open question without a new rule.
    //
    // NOTHING HERE SCALES WITH THE WEALTH CORRIDOR. A retainer is a cheque to the player, exactly
    // like prize money, and `prizeCentsFor`'s note is the same rule for the same reason.
    //
    // THE BANDS ARE THE SPEC'S, ANCHORED ON REAL TENNIS ECONOMICS RATHER THAN INVENTED: section 7
    // gives tour a "~$3-8k/yr" retainer band and premium "x5-10" of it. $1,500 a quarter is $6,000 a
    // year, the middle of that band; premium takes x5 ($30,000) and icon x5 again ($150,000). Read
    // against docs/research/02-tennis-economics.md that is the right shape - a #200 player's kit
    // deal does not pay her rent, a #50 player's does, and a top-10 player's endorsement income is
    // the largest line on her page.
    tour: {
      /** The first brand that signs a PROFESSIONAL rather than a prospect. Fictional, like every
       *  organisation name in this game (ITF/WTA/ATP and the majors are trademarks). */
      brand: 'Baseline Athletic',
      /** WTA <= 200, the spec's own gate: inside the top 200 she is a working professional whose
       *  name appears on a draw sheet somebody reads. Below `national`'s 350 and above `global`'s
       *  87, which is what makes the chain monotone. */
      maxWtaRank: 200,
      /** ...and NO junior arm at all, which is the point of the rung. `national` and `global` read
       *  BOTH tables because they were built for a junior and learned to read a professional; these
       *  three read one table, because a brand that signs on a WTA ranking is not interested in a
       *  girl who has not got one. `standingClears` treats a missing `maxItfRank` as "no junior
       *  door", never as "open to anyone". */
      seasons: 2,
      /** Everything she wears - the same three lines `global` covers. The LADDER STOPS BEING ABOUT
       *  COVERAGE HERE and starts being about money, which is the honest reading: there is no fourth
       *  line of kit to promise, so a bigger deal has to pay her instead. */
      seasonCents: 5_000_00,
      freshCap: 0.3,
      /** The step of two continues: 6 -> 8 -> 10 -> 12 -> 14. */
      minEvents: 14,
      travelShare: 0.25,
      /** $1,500 a quarter = $6,000 a season, the middle of section 7's own "~$3-8k/yr" band. */
      retainerCents: 1_500_00,
      /** RESULT BONUSES AT W75 AND ABOVE (section 7 verbatim), at a fifth of the cheque. A W75 title
       *  is $9,000, so the bonus is $1,800 - a real number that is not a second prize table. */
      bonusShare: 0.2,
      bonusFromTier: 'w75' as TierId,
    },
    premium: {
      brand: 'Meridian Sport',
      /** WTA <= 50 - the spec's gate, and the same number the mandatory regime binds at. That is not
       *  a coincidence worth hiding: the top 50 is where the tour starts requiring her presence, and
       *  it is exactly where a brand starts paying for it. */
      maxWtaRank: 50,
      seasons: 3,
      seasonCents: 8_000_00,
      freshCap: 0.3,
      minEvents: 16,
      travelShare: 0.5,
      /** x5 the tour rung, the bottom of section 7's «retainer x5-10»: $7,500 a quarter, $30,000 a
       *  season. */
      retainerCents: 7_500_00,
      /** APPEARANCE FEES - the new income line section 7 names, "real at 250s". $15,000 to be on the
       *  poster of a WTA 250 or better, paid when she actually plays it. */
      appearanceFeeCents: 15_000_00,
      appearanceFromTier: 'wta250' as TierId,
      /** ...and the bonus schedule reaches further down the ladder AND up to the Slam rounds, which
       *  is section 7's own phrase - it is the same share against a prize table that now runs to
       *  $3M, so a Slam semi-final bonus is six figures without a second table existing. */
      bonusShare: 0.25,
      bonusFromTier: 'w50' as TierId,
    },
    icon: {
      brand: 'Aurelia',
      /** WTA <= 10, section 7's gate. Its «or a Slam semi-final» half is deliberately NOT modelled as
       *  a second predicate: a Slam semi-final under the shipped points table is 780 points from one
       *  event, which on the real curve the merged table now carries puts her inside the top ten by
       *  arithmetic anyway. One gate that both routes satisfy beats two that can disagree - and if a
       *  future table breaks that equivalence, the honest fix is a second clause here with its own
       *  measurement, not a guess now. */
      maxWtaRank: 10,
      /** FOUR SEASONS - the top of `02-tennis-economics.md`'s "3-4 year terms", and long enough that
       *  signing it really is the last contract decision a career makes. */
      seasons: 4,
      seasonCents: 12_000_00,
      freshCap: 0.3,
      /** The step of two would give 18; it stops at 16 instead, and that is the one place this ladder
       *  declines to get worse as it gets better. A top-10 player's calendar is largely the mandatory
       *  regime's (act2-pro-tour.md section 6: four Slams, the 1000s and six 500s bind the top 50),
       *  so an obligation ABOVE what the tour already compels would be two systems demanding the same
       *  weeks and one of them fining her for it. The trap this block is proud of stays a trap right
       *  up to the rung where it would stop being one. */
      minEvents: 16,
      travelShare: 0.75,
      /** x5 again: $37,500 a quarter, $150,000 a season. */
      retainerCents: 37_500_00,
      appearanceFeeCents: 40_000_00,
      appearanceFromTier: 'wta250' as TierId,
      bonusShare: 0.3,
      bonusFromTier: 'w50' as TierId,
    },
  },

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

  // --- EQUIPMENT CONDITION: what the three lines above are actually WORTH -------------------
  // docs/specs/equipment-and-serve-speed.md §2. Until this block existed the gear lines were pure
  // outgoings: the game already said she plays a worse racket and restrings half as often, and then
  // never let that matter. Nothing new is bought here - the spend that is already on the ledger
  // becomes the thing that keeps her equipment honest.
  //
  // ⚠ IT IS CONDITION, NOT VINTAGE, and that is the owner's own correction from playing padel:
  // «я вот в падел играю и знаю, что чиненая ракетка работает хуже, чем пусть и старая, но целая».
  // So nothing here reads "how expensive was it" - every line reads WEEKS SINCE THE LAST PURCHASE
  // against an ABSOLUTE service life. A string bed dies after so many weeks of play no matter whose
  // daughter is hitting with it.
  //
  // ⚠ AND THE ABSOLUTE LIFE IS THE WHOLE ANTI-DESTINY MECHANISM. Normalising wear by the FAMILY'S
  // OWN cadence instead would make every background sit at the same average freshness and the block
  // would do nothing; normalising by PRICE would let money buy strokes directly, which is the one
  // outcome the spec forbids. An absolute life gives exactly the intended sentence: the wealthy
  // family restrings inside the life and the working family stretches past it.
  //
  // SIZING, AND IT IS MEASURED (tools/kit-bench.ts). The anchor is the relative age effect -
  // SKILL_POINTS_PER_YEAR = 2.4, what a year of junior development is worth. The whole swing from
  // worst kit to best, all three lines at once, must come in UNDER one year of relative age, because
  // the owner's rule is that «если девочка плохо играет - она и с лучшим тренером и в лучшем экипе
  // будет это делать точно так же». Fresh kit is exactly neutral (factor 1) and every line only ever
  // subtracts, which is also what keeps the shipped balance intact for a family that buys on time.
  //
  // RNG: ZERO DRAWS ANYWHERE. Wear is `week - lastPurchaseWeek` over a constant, and the purchase
  // weeks come off the gear sub-streams that already existed. The frozen MAIN capture
  // (41550 / e6b0c709) cannot see any of this.
  equipment: {
    /** STRINGS - the biggest and truest lever, and it is CONTROL rather than power. In real tennis
     *  the gap between a fresh bed and a dead one dwarfs the gap between a good frame and a great
     *  one, and it shows up as balls landing long rather than as pace. Hence `ret`/`groundstrokes`
     *  carry it and `serve` takes a token share - the spec's "a couple of km/h", which is what it
     *  really is. 5 weeks of life against restring cadences of 4 (working) / 3 (middle) / 2
     *  (wealthy): the wealthy girl never leaves the fresh end, the working girl lives at 0.6 wear. */
    stringLifeWeeks: 5,
    stringWear: { ret: 0.03, groundstrokes: 0.03, serve: 0.01 },

    /** FRAME - integrity, a small constant, and the ONE line that is genuinely binary in spirit. A
     *  sound frame is neutral however old it is (`soundWeeks` of exactly nothing), and only past its
     *  service life does it become the patched racket that works worse than an old whole one. At 13
     *  sound weeks the wealthy cadence (10-12) never reaches it at all and the working cadence
     *  (14-18) always does, which is precisely the sentence the price table was already implying. */
    frameSoundWeeks: 13,
    framePatchWeeks: 6,
    frameWear: { serve: 0.008, groundstrokes: 0.008 },

    /** SHOES - traction, and TWO effects rather than one (owner: «в плохих коньках ребята не могут
     *  угнаться за другими в хороших, просто физика так работает»). Movement has no attribute of its
     *  own, so it lands where movement actually pays: `ret` (reaching the ball at all) and `stamina`
     *  (chasing costs more when you slip).
     *
     *  ⚠ SHOES ARE THE BACKGROUND-NEUTRAL LINE ON PURPOSE. Their cadence is 10-14 for EVERY
     *  background - only the price differs - so wear here is identical for a working and a wealthy
     *  career and contributes exactly zero to the background gap. That is deliberate and it is the
     *  safest possible home for the injury half: a richer family must never be able to buy its
     *  daughter out of getting hurt. */
    shoeLifeWeeks: 14,
    shoeWear: { ret: 0.014, stamina: 0.018 },
    /** ...and the second effect: worn shoes multiply the weekly injury threshold by up to this much
     *  again. A POST-DRAW multiply inside `injuryTau`, the same invariance-safe shape as the
     *  vacation recovery buff - the roll is already drawn, only the threshold moves. */
    shoeInjuryRise: 0.2,

    /** THE FRAME'S OWN INJURY HALF (W3-KIT, owner: «экип влияет и на травмы и на производительность
     *  игрока»). A heavy, stiff, dead frame is an ARM story - tennis elbow is the injury a bad racket
     *  actually causes - and until this wave the frame line had a performance half and no body half at
     *  all, which made the shoes carry the whole of "equipment hurts people".
     *
     *  ⚠ SMALLER THAN THE SHOES' RISE ON PURPOSE, and the ratio is the research's own: the body-region
     *  table (engine/body.ts) is ~48% lower limb against ~28% upper, so the line that lands on arms
     *  cannot be priced like the line that lands on ankles. 0.12 against the shoes' 0.20.
     *
     *  ⚠ AND IT IS INVISIBLE TO A CAREER THAT BUYS ON CADENCE, WHICH IS WHY IT COULD BE ADDED AT ALL.
     *  Realised frame wear is 0.041 (working) / 0.010 (middle) / 0.000 (wealthy) - the frame has a flat
     *  head 13 weeks long and the family replaces it inside that - so this multiplies tau by 1.005 for
     *  the worst-off shipped career. It only bites on the `alloy` rung, which is a thing the player has
     *  to choose. Same POST-DRAW multiply as its neighbour: `injuryTau` keeps its pinned arity and
     *  spends no draw.
     *
     *  ⚠ WHAT IS DELIBERATELY *NOT* HERE: steering WHICH part gets hurt. The honest model of a bad
     *  frame is an elbow, and `drawBodyRegion` spends exactly one pull against a twelve-entry table -
     *  so aiming the result would mean either a second draw (forbidden: the private `seed:injury:<week>`
     *  sequence is byte-identical for every career today) or a second region table selected by kit,
     *  which is a bigger change than this wave's evidence supports. The RATE moves; the anatomy does
     *  not, and that is stated rather than quietly skipped. */
    frameInjuryRise: 0.12,

    // --- THE QUALITY LADDER: the rung the PLAYER buys ------------------------------------------
    //
    // The owner, W3-KIT: «я вообще за оба подхода одновременно, как с тренерами. Мы же точно знаем,
    // что начальные ракетки из алюминия тяжелее и хуже во многом, чем начальные композитные, значит
    // экип влияет и на травмы и на производительность игрока.» So a rung is like a coach rung: it
    // moves BOTH what she can do and what happens to her body, and the parent pays for it.
    //
    // ⚠⚠ THE LADDER CANNOT BREAK THE ANTI-DESTINY BOUND, AND NOT BECAUSE IT WAS TUNED NOT TO. A rung
    // does exactly two things to the arithmetic and both live INSIDE `kitWearAt`'s existing
    // `clamp01`: it starts a line partway down its own wear curve (`startWear`), and it stretches or
    // shortens that curve (`lifeFactor`). So every state the ladder can produce is a state the WEAR
    // model could already produce, the whole ladder lives inside [FRESH_KIT, SPENT_KIT], and the
    // nominal swing tools/kit-bench.ts measures against SKILL_POINTS_PER_YEAR is the same 2.01 < 2.40
    // it was before this wave - structurally, not by choice of coefficient. Nothing new was added to
    // the modifier channel; the ladder only decides WHERE ON THE OLD CURVE she stands.
    //
    // MEASURED (tools/kit-bench.ts §6, and the number is repeated in engine/equipment.ts): the
    // REALISED alloy -> pro swing, i.e. what a career actually lives at on the bottom rung against
    // the top one, is what the ladder is really worth. It is reported in skill points against the
    // same 2.4-point yardstick and against the coach ladder's own 2.26.
    //
    // ⚠ THE TOP RUNG IS NEUTRAL-OR-SLOWER-WEARING, NEVER A BONUS. `startWear` is 0 from `composite`
    // up, so no amount of money can put her ABOVE fresh kit - which is the promise engine/equipment.ts
    // has made since it shipped ("Fresh kit is exactly neutral... wear only ever subtracts") and the
    // reason the KID-ONLY asymmetry stays honest: the 199 rivals have no kit bag, so a kid who could
    // buy her way past neutral would be carrying a bonus the field cannot have.
    grades: {
      /** THE ALUMINIUM STARTER - the owner's own example, and the only rung that is worse than the
       *  game has ever been. Heavy, stiff, and a frame that plays like one already half spent: it is
       *  slower off the ground and through the ball, it gives up sooner, and it is the rung that
       *  actually hurts her (a stiff frame's shock goes into the arm - see `frameInjuryRise`).
       *
       *  The `startWear` split is the point: the FRAME carries most of it (0.40 of a service life the
       *  moment it is bought) because that is the item the owner named, while cheap synthetic string
       *  and flat-soled trainers are a smaller, realer handicap. `lifeFactor` 0.80 - cheap kit also
       *  dies faster, which is the second half of why it is a false economy. */
      alloy: { startWear: { strings: 0.20, frame: 0.40, shoes: 0.16 }, lifeFactor: 0.8, priceFactor: 0.55 },
      /** ⚠ THE GAME AS IT SHIPPED, AND EVERY NUMBER HERE IS THE IDENTITY ELEMENT. No handicap, the
       *  service lives above exactly as written, prices exactly `ECONOMY.gear`'s. A v36 career
       *  migrates onto this rung and its wear, its injury threshold and its gear bills are
       *  byte-identical to what they were - which is the whole reason the rung exists at this
       *  position rather than at the bottom of the ladder. */
      composite: { startWear: { strings: 0, frame: 0, shoes: 0 }, lifeFactor: 1, priceFactor: 1 },
      /** What a serious junior's parents actually buy: a current retail frame, a decent poly bed,
       *  proper court shoes. It buys no extra POWER - it cannot, see the note above - it buys the
       *  thing that is actually worth having, which is that her kit is still good in week four. */
      performance: { startWear: { strings: 0, frame: 0, shoes: 0 }, lifeFactor: 1.4, priceFactor: 2.2 },
      /** Tour-level kit. Four times the bill, and what it returns is a girl who is never playing
       *  worn-out equipment - the realised wear that `tools/kit-bench.ts` §2 measures at 0.30-0.40 on
       *  strings and shoes falls by nearly half. Bounded by fresh kit, like everything else. */
      pro: { startWear: { strings: 0, frame: 0, shoes: 0 }, lifeFactor: 1.9, priceFactor: 4 },
    } as Record<KitGrade, { startWear: Record<KitLine, number>; lifeFactor: number; priceFactor: number }>,

    /** THE COPY, kept beside the numbers so a rung cannot ship with a price and no name. Fictional
     *  brands only (CLAUDE.md: real marks are trademarks), in the parent's register - what the thing
     *  IS, not what it does to a coefficient. */
    gradeCopy: {
      alloy: {
        strings: { label: 'Club synthetic', blurb: 'Cheap nylon – it goes dead in a fortnight.' },
        frame: { label: 'Ashline Alloy', blurb: 'Heavy aluminium starter – slow, stiff, hard on the arm.' },
        shoes: { label: 'Court Basics', blurb: 'Flat soles, no support – she slides when she should grip.' },
      },
      composite: {
        strings: { label: 'Multifil Standard', blurb: 'The usual bed – fine until it is not.' },
        frame: { label: 'Ashline Composite', blurb: 'The frame most juniors own. Nothing wrong with it.' },
        shoes: { label: 'Baseline Trainer', blurb: 'Proper court shoes, mid-range.' },
      },
      performance: {
        strings: { label: 'Kestra Control', blurb: 'Holds tension – the bed is still alive in week four.' },
        frame: { label: 'Kestra Team 98', blurb: 'A current retail frame, and it stays sound far longer.' },
        shoes: { label: 'Kestra Grip', blurb: 'Real support underfoot. Fewer rolled ankles.' },
      },
      pro: {
        strings: { label: 'Kestra Tour Gut', blurb: 'What the tour restrings with. Fresh, always.' },
        frame: { label: 'Kestra Pro Stock', blurb: 'Custom-weighted. She will never out-grow it.' },
        shoes: { label: 'Kestra Tour', blurb: 'Fitted, cushioned, replaced before they wear.' },
      },
    } as Record<KitGrade, Record<KitLine, { label: string; blurb: string }>>,
  },

  // ⭐⭐⭐ R9-1's `savings: { apyWeekly: 0.0006 }` STOOD HERE AND ROUND 29 #12 DELETED IT.
  //
  // THE OWNER, 28.08: «И я предлагал убрать авто начисление % на текущий счёт.» It paid ~3.1%/yr on
  // the current account every week, automatically and silently, and it grew with the balance.
  //
  // ⚠ DELETED RATHER THAN LEFT AT ZERO, deliberately. A live balance constant that nothing charges
  // is a decision nobody can find – the exact failure this file's own header exists to prevent – and
  // the next reader would wire it back up believing it was a tuning knob. The rate is recoverable
  // from git and from `docs/rounds/round-29.md`; it is not recoverable from a dead field.
  //
  // ⚠ WHERE MONEY EARNS NOW: `shop.catalogue` below – the deposit at +2% a season and the index fund
  // at +7%, both of which round 29 #11 gave top-ups in the same wave. Yield became a decision the
  // parent makes instead of a wage the wallet pays.

  // =================================================================================================
  // HER SHARE OF THE PRIZE MONEY (round-23 #18) – the one income line the family stops keeping
  // =================================================================================================
  //
  // THE OWNER: «после появления её счета в банке в 18 начать ей призовые переводить какие-то суммы,
  // например начать с 10-20% и может быть наращивать год к году», and then, on the ceiling:
  // «да, давай, но может не до 30, а до 40 или 50 вообще, это всё-таки ее карьера?»
  //
  // So it is a RAMP and not a rate: 10% the year she turns eighteen, five points more every birthday,
  // and it stops at half. The four numbers live here rather than inside `kidPrizeShareBps` because a
  // literal in a formula is a balance decision nobody can find – the rule this file exists for.
  //
  // ⚠ WHY EIGHTEEN AND NOT THE BANK CARD. Her account is a BIRTHDAY GIFT (`world/birthday.ts`, the
  // eighteenth's `bankcard` row: «Her own bank card and account – she is earning now, it should be in
  // her name»), and a gift is one of four the parent chooses between. Keying the ramp to it would
  // make the mechanic invisible in three careers out of four and, worse, make a father who bought her
  // a watch the reason his daughter never got paid. Eighteen is the age the game already treats as
  // the threshold – school is over by 18.92 for every birth month, the junior rungs shut, the fork is
  // one year away – so the account is the FICTION of this rule and her age is its trigger.
  //
  // ⚠ AND THE MONEY GENUINELY LEAVES THE FAMILY WALLET. See `finalizeTournament`: the family is
  // credited its part and she is credited hers, so the parent watches the cheque get smaller as she
  // grows. A share that only counted beside the wallet would be a number, not a mechanic, and «это
  // всё-таки её карьера» is an argument about whose money it is.
  kidShare: {
    /** The birthday the transfers start on. Her own bank account is the eighteenth's gift. */
    fromAgeYears: 18,
    /** What she keeps of every cheque in that first year – 10%, the bottom of his own «10-20%». */
    startBps: 1000,
    /** ...and what each birthday after it adds. Five points a year is his «наращивать год к году». */
    stepBps: 500,
    /** The ceiling, reached at 26 – «может не до 30, а до 40 или 50 вообще». Half is the legible
     *  version of what he asked for: an even split between the girl who won it and the family that
     *  paid to get her there, arriving in the years she is worth the most. */
    capBps: 5000,
  },

  // =================================================================================================
  // ⭐⭐ THE TEAM'S SHARE OF THE PRIZE MONEY (owner, round 24, 22.08 – docs/plans/the-team-share.md)
  // =================================================================================================
  //
  // HIS MODEL, VERBATIM: «3млн призовые из них отчисляется процент дочери (скажем 30 для примера) и
  // тренеру (скажем 10 для примера) – это будет 900к дочери и 300к тренеру плюс остальные расходы».
  // And on eligibility: «тренер может не ездить, но долю получать наверное за победы или 2е места
  // вполне может. За 2е только по-меньше». Then, the same day, the masseur joined: «мне всё-таки
  // кажется, что массажисту тоже можно за призовые месте давать бонус, может по-меньше чем
  // тренеру, но давать, давай тоже сделаем».
  //
  // WHAT THAT RULING KILLED, so nobody rebuilds it: the plan's original contract-FORM design (flat
  // vs base+share, chosen at hire, persisted per career) is DEAD. The share is a UNIVERSAL rule –
  // no form, no choice, nothing persisted: computed at `finalizeTournament` from these constants
  // and the finish, exactly like the kid's ramp one block up.
  //
  // THE SHAPE – «за победы или 2е места», NOT every cheque: a TITLE pays `titleBps`, a FINAL pays
  // `finalBps` («за 2е только по-меньше» – half), below a final NOTHING. The real-world convention
  // (5-15% of every cheque, sliding by depth) was researched and shown to him (the plan's §1); his
  // version is the sharper one and it is the one that ships. Both shares are computed OFF THE
  // GROSS cheque – the kid's ramp (round-23 #18) is untouched and each share rounds ONCE, the
  // family keeping the remainder to the cent (`staffPrizeShareCents` + the finalize subtraction).
  //
  // WHO PAYS AND WHEN: the family (the parent is the employer – the game's premise), pro tour only
  // (`track === 'wta'` – junior tennis pays no prize money worth sharing and the convention is a
  // pro convention), independent of any travel switch (his own words: «может не ездить, но долю
  // получать»), and only a seat that is actually FILLED – a self-coached family owes no coach
  // share, an empty table no masseur share.
  //
  // THE MASSEUR'S RATES are roughly a third of the coach's («по-меньше чем тренеру») – the same
  // sizing logic the travelling-team plan used for specialist money against coach money. On his
  // own worked example (a $3M Slam title): coach $300k, masseur $90k, daughter $900k (at the
  // age-22 rung), family $1.71M «плюс остальные расходы».
  staffShare: {
    coach: { titleBps: 1000, finalBps: 500 },
    masseur: { titleBps: 300, finalBps: 150 },
  } as Record<'coach' | 'masseur', { titleBps: number; finalBps: number }>,

  // =================================================================================================
  // ⭐⭐⭐ THE MANAGER'S COMMISSION – round 29 part three P3 (owner, 29.08)
  // =================================================================================================
  //
  // HIS RULING, VERBATIM: «как менеджер может от этого что-то получать в свою очередь. 10-20%
  // например… контракт на полную сумму ребенку приходит на почту, после подписания видим на счету
  // уже родительский кат.» Its context: it was put to him that taking half of a cheque paid for her
  // face reads as the parent living off the daughter, and he answered «полностью согласен».
  //
  // ⚠⚠ WHAT IT REPLACES, AND THE HEADLINE UNDERSTATED IT. Until this ruling `bankSponsorCheque`
  // split sponsor cash by HER PRIZE RAMP – so the family kept 100% before her eighteenth, 90% at
  // 18 and 50% only from 26. Measured over 72 careers x 780 weeks the parent actually kept **63.1%
  // of gross sponsor money**, so this is not «50% -> 15%», it is **63.1% -> 15%**.
  //
  // ⚠ SPONSOR CHEQUES ONLY. Prize money's own 50/50 ramp is his standing ruling of 23 #18 and is
  // untouched: `finalizeTournament` still splits the tournament's cheque by `kidPrizeShareBps`, and
  // the staff shares one block up still come off the gross prize. This constant is read at exactly
  // one place in the engine, `bankSponsorCheque`, and by the two screens that describe it.
  //
  // ⚠ NO AGE GATE, DELIBERATELY, and it is the ruling rather than an omission: «контракт на полную
  // сумму ребенку» is addressed to HER at any age, so the commission is flat from the first cheque a
  // brand ever writes. In practice the professional rungs open at WTA #200 and the advertising
  // ladder at eighteen, so a pre-eighteen sponsor cheque is close to unreachable – but where one
  // exists, the money is hers minus the fee, not the family's whole.
  managerCommission: {
    /** ⚠ PROVISIONAL AND HIS TO MOVE – the midpoint of his own «10-20% например», picked because he
     *  named a band and not a number. It is ONE constant and every sentence on every screen reads
     *  it, so moving it is one edit here. The bench (`tools/sponsor-ladder-reach.ts --commission N`)
     *  overrides it for a run so the band can be swept without a code change. */
    bps: 1500,
  },

  // =================================================================================================
  // THE ADVERTISING LADDER (round 24 item 2, docs/plans/the-face-and-the-court.md §6 STEPS 1-2;
  // the three rungs are round 29 part two #19/#20)
  // =================================================================================================
  //
  // THE OWNER: «Рекламные контракты будем добавлять какие-то?» – and the plan's answer is that the
  // kit ladder above is complete and ENDEMIC (tennis brands paying for tennis), so what is missing
  // is the other kind entirely: a non-endemic house paying cash for her FACE. Step 1 is the smallest
  // honest slice of it – one offer, results-gated, cash only; step 2 gives the cheque its price in
  // TIME (the shoot weeks below, §4a) – and the build stops there on the plan's own order: fame
  // (step 3+) is paused upstream with the private life.
  //
  // ⚠ WHERE THE GATE SITS WAS THE PLAN'S OWN MEASUREMENT (§3, the owner's two careers): at Ines'
  // level (24, interest $251,439 a year against $220,000 of ALL outgoings) an advertising cheque is
  // noise; at Alice's (18, interest $3,235 against $64,000 of outgoings) it is real money against a
  // real budget. So the deal belonged EARLY – mid-career, where the budget is still tight – which
  // inverts the instinct to gate it on the top ten.
  //
  // ⚠⚠ AND ROUND 29 PART TWO #20 IS THE OTHER HALF OF THAT ARGUMENT, WHICH NOBODY EVER BUILT. §3 is
  // right that a FIXED cheque decays into noise as she climbs; the conclusion it drew – so gate it
  // low and let it decay – only followed because there was one row. A rung sized on the stage it
  // opens for does not decay, and the ladder is on `houses` below, with the owner's own words, the
  // sourced comparison it was checked against, and the measured shares it is built from.
  advertising: {
    /** The age the owner scoped advertising mechanics to («какие у нас могут быть механики этих
     *  контрактов дополнительные от 18+ лет начиная и дальше»). Eighteen is already the engine's
     *  threshold age – `kidShare.fromAgeYears` above starts her own prize split there, school is
     *  over by 18.92 for every birth month, the junior rungs shut – so the boundary exists and this
     *  reads the same clock (`kidAgeYears`, the one-clock ruling of 09.08). */
    fromAgeYears: 18,
    /** ⭐⭐⭐ ROUND 29 PART TWO #19/#20 – THE LADDER, WHICH IS WHAT THIS CATALOGUE DID NOT HAVE.
     *
     *  HIS TWO QUESTIONS, and the second one invited correction: «я не увидел наш список спонсоров
     *  для съемок и прочего, не спортивных. С ними что и на каких уровнях и что дают… Хочу увидеть
     *  их список и что дают.» and «предлагать контракт за 20к долларов на год для 100 и выше ракетки
     *  мира выглядит весьма сомнительно, как мне кажется, поправь меня, если я ошибаюсь.»
     *
     *  ⚠ HE IS RIGHT, AND THE MEASUREMENT SAYS SO MORE SHARPLY THAN HE DID – see
     *  `docs/research/off-court-money.md`, which reads the WTA's own prize-money list and the Forbes
     *  2025 earnings table rather than quoting either at second hand. In the real sport off-court
     *  money is not flat and it is not ordered by rank: the woman with the second-largest endorsement
     *  income in 2025 was the THIRTIETH-largest prize-money earner ($21M off court against $1.6M on
     *  it), and no non-endemic contract value has ever been published for anybody outside the top 25
     *  at all. What was shipped here was ONE house, $20,000, with a floor at WTA #200 and **no
     *  ceiling of any kind** – so the world #21 in his own save was offered exactly what the #199 is.
     *
     *  ⭐ AND THE $20,000 ITSELF SURVIVES. The research does not contradict it at the rung it was
     *  written for; what it contradicts is the same cheque still arriving eleven rungs later. So this
     *  is a LADDER and not a retune: the bottom row is the shipped deal, unchanged to the cent.
     *
     *  THE SIZING PRINCIPLE IS THE ONE THE SHIPPED COMMENT ALREADY STATED – a rung is a SHARE OF THE
     *  OUTGOINGS OF THE STAGE IT OPENS FOR, not an absolute sum – with one correction it needed. The
     *  old comment sized $20,000 as «about 31% of Alice's-stage ANNUAL outgoings ($64,000)», read
     *  off ONE career. Measured across 108 careers x 780 weeks (`tools/sponsor-ladder-reach.ts`) the
     *  median annual outgoings of a season spent in that band are **$86,474**, so the shipped rung's
     *  own realised share is **23.1%** – and THAT is the rule, because the anchor sets it and the
     *  rungs above it obey. Nothing here was picked and then justified:
     *
     *    band          median annual outgoings   this catalogue   realised share   $ per shoot week
     *    WTA 51-200           $86,474                 $20,000           23.1%           $10,000
     *    WTA 11-50           $173,210                 $40,000           23.1%           $10,000
     *    WTA 1-10            $240,343                 $55,000           22.9%            $9,167
     *
     *  ⚠⚠ THE DENOMINATOR MOVED UNDER THIS VERY WAVE AND THE FIRST SIZING WAS TAKEN AGAINST THE OLD
     *  ONE – recorded because it is the more useful fact. Measured before items #5 and #12 the three
     *  medians were $100,435 / $254,972 / $348,855; after them they are the figures above, because a
     *  career that can now be written to by `premium` and `icon` mid-contract gets half to three
     *  quarters of its FARES paid and more of its kit, so what a season costs her falls. The fees are
     *  sized against the world as it now is, and the run that produced these numbers is the one in
     *  the ledger. ⭐ The anchor is unchanged either way: $20,000 is what it is, and the two rungs
     *  above it hold ITS realised share rather than a round number picked first.
     *
     *  ⚠ THE PER-SHOOT COLUMN IS THE CROSS-CHECK AND IT AGREES, WHICH IS WHY IT IS PRINTED. Sized
     *  the other way round – what a week of her season is worth – the three rungs come out at
     *  $10,000, $10,000 and $9,167 a shoot week. Two independent readings of the same catalogue
     *  landing within 8% of each other is what makes this a rule rather than three numbers.
     *
     *  ⚠ A CONSTANT SHARE IS A DECISION AND IT OVERRULES §3 OF THE PLAN, WHICH SAID THIS MECHANIC
     *  ONLY MATTERS EARLY. That was the right reading of a catalogue with one row: a fixed cheque
     *  does decay into noise as she climbs. A rung sized on the stage it opens for cannot – it is the
     *  same fifth of the same budget at every stage, which is what «felt, not budget-solving» has to
     *  mean once there is more than one rung. It is deliberately NOT the real curve, which is convex
     *  to the point of absurdity (Gauff: $25M off court against $8M on it); a game that copied that
     *  would make the top rung solve the endgame, and the endgame is not short of money.
     *
     *  ⚠ AND THE ENDEMIC LADDER STILL OUT-EARNS THE PHOTOGRAPH AT EVERY PROFESSIONAL RUNG, which is
     *  the relationship the shipped comment named and this one keeps: $40,000 against `premium`'s
     *  $30,000 retainer + $15,000 appearance fee + $8,000 of kit + half the fares + 25% bonuses;
     *  $55,000 against `icon`'s $150,000 retainer + $40,000 appearance fees + 30% bonuses.
     *
     *  ⚠⚠ THE GATES ARE THE KIT LADDER'S OWN PROFESSIONAL CUTS, READ AND NOT SHARED. 200 / 50 / 10
     *  are `tour` / `premium` / `icon`'s `maxWtaRank`, which is the shipped rung's own derivation
     *  («a non-endemic brand notices her exactly when the first endemic cash does») extended upward
     *  with the same argument. They are written out here rather than imported, exactly as the
     *  original 200 was and for the same reason: a kit retune must never silently retune advertising.
     *  ⭐ And they are REACHED – `tools/sponsor-ladder-reach.ts` measures 45% of careers ever inside
     *  WTA #50 and 29% ever inside #10, so neither new rung is a row nobody sees.
     *
     *  ⚠⚠ THE SHOOT WEEKS ARE THE PLAN'S RECORDED LADDER, AND THEY ARE WHY IT STOPS AT THREE ROWS.
     *  `the-face-and-the-court.md` §4a-1 wrote down «bigger campaigns would carry 3-4 shoot weeks, a
     *  global house 5-6, and the sum of live deals must never exceed 6 shoot weeks a year». Taking
     *  the top of each band – 2 / 4 / 6 – spends the whole annual allowance on the top rung, so the
     *  cap is STRUCTURAL rather than a rule somebody has to remember: one deal at a time
     *  (`adSpokenFor`), every term exactly one year (`termWeeks: 52`), so the most she can ever owe
     *  in a year is the biggest single house's six. A fourth rung would have nothing left to ask for.
     *
     *  ⭐ WHAT THE BIGGEST HOUSE ACTUALLY COSTS HER, since round 29 #3 made a shoot on a tournament
     *  week a four-way decision: SIX of her 49 in-season weeks, 12% of the playing year, each
     *  recovering like a travel week instead of a rest week (measured at -9 condition per deficit
     *  shoot week, `docs/specs/ad-shoot-recovery-2026-08.md`) and each one a week she must either
     *  keep clear or pay `clashConditionPerDay` x 7 to play through.
     *
     *  ⚠⚠⚠ ROUND 29 PART FOUR P6/§6–§8 SUPERSEDES THE THREE-ROW LADDER ABOVE, BY THE OWNER'S OWN
     *  CALIBRATION, and the history stays because it explains what the anchor is. His three moves,
     *  in order (docs/research/endorsement-tiers-and-academy-money.md §6–§8):
     *   1. «Это доход у топ-100, у топ-50 точно больше» – Bublik's $1–2M/yr portfolio is a TOP-100
     *      figure, so the bands LIFT and a #100 gate joins the kit ladder's own 200/50/10;
     *   2. the portfolio is CATEGORIES – «одежда и обувь · часы · автомобили · гидратация и
     *      напитки», one live deal per category, kit brands writing ad campaigns as a second
     *      programme («Можно даже текущих использовать двойной программой»);
     *   3. the GRADIENT – «на каждой ступени может быть до 4-6 одновременно, только с разными
     *      чеками»: the portfolio SHAPE is constant at every band and the CHEQUE is the only axis
     *      that scales.
     *  The 23.1%-share sizing rule above therefore holds for exactly ONE cell of the new table –
     *  the watches fee at the ≤200 band, $20,000 unchanged to the cent, the anchor everything else
     *  was once derived from – and the cells above it are HIS band ranges (§8, movable, his), not
     *  shares: at real scale off-court money is 32–99% of an annual income (§4c), so no share of
     *  outgoings can reach his line and the resize is a chosen point on the measured dial. */
    /** ⭐⭐⭐ THE GRADIENT'S BANDS (round 29 part four, §8 – his final shape), weakest-first like
     *  every ladder in this file, so an index comparison is a band comparison everywhere.
     *
     *  ⚠⚠ THE GATES ARE THE KIT LADDER'S OWN PROFESSIONAL CUTS PLUS HIS OWN #100. 200 / 50 / 10 are
     *  `tour` / `premium` / `icon`'s `maxWtaRank`, read and not imported (the shipped rule: a kit
     *  retune must never silently retune advertising); 100 is the Bublik line, P11 verbatim: «Это
     *  доход у топ-100, у топ-50 точно больше» – the one band the kit ladder never had, added
     *  because his data point sits exactly on it.
     *
     *  ⚠ THE SHOOT ASK RISES WITH THE BAND AND THE WINTER NOW CARRIES IT (P9, §6: «shoot capacity
     *  rises because the winter now carries them»). One week per deal-year at the two lower bands,
     *  two at the two upper – so a full ≤10 shelf of six deals asks 12 weeks a year against a
     *  6-week winter, and the spill into the season is Zheng's own complaint made mechanical:
     *  «слишком много съёмок и никакого отпуска». The overflow meets the round-29 #3 four-way
     *  clash exactly as an in-season shoot always did. */
    bands: [
      { maxWtaRank: 200, shootWeeksPerYear: 1 },
      { maxWtaRank: 100, shootWeeksPerYear: 1 },
      { maxWtaRank: 50, shootWeeksPerYear: 2 },
      { maxWtaRank: 10, shootWeeksPerYear: 2 },
    ] as readonly AdBandDef[],
    /** ⭐⭐⭐ THE PORTFOLIO'S CATEGORIES (P7, his own list mapped onto ours) – the shelf the player
     *  sees, one live deal per category, the cheque per band in each row.
     *
     *  THE FEES ARE §8'S TABLE, CELL BY CELL, and land inside his ranges by construction (the
     *  in-band test pins every cell): ≤200 $5k–20k · ≤100 $100k–500k · ≤50 $300k–1M · ≤10
     *  $1M–2.5M. Portfolio-per-year at each band, all categories filled: $45k · $1.1M · $2.6M ·
     *  $9.2M – against his own column «$30k–80k · ~$1–2M (Bublik) · ~$2.5–4M · ~$6–10M with kit».
     *
     *  ⭐ THE ANCHOR SURVIVES A SECOND RESIZE UNMOVED: watches at ≤200 is the shipped $20,000 to
     *  the cent – the one cell the 23.1%-share rule still governs, and the cell every earlier
     *  number in this file's history was derived from.
     *
     *  ⚠ A `null` CELL IS THE GATE: the category has not opened at that band. Watches, cars,
     *  drinks and the kit brand's poster campaign open with the first professional cash (≤200 – «A
     *  #180 holds a watch deal, a drinks deal, a local car dealer: small money, same shelf», §8);
     *  the airline waits for the top 100; fragrance is the icon-band category (§7: «watches early,
     *  cars at top-100, fragrance at top-10»). Derived, never a second constant, so the gate and
     *  the price cannot disagree.
     *
     *  ⚠ 2–4 HOUSES PER CATEGORY IS P6'S CHURN MADE VISIBLE – terms run 1–3 years and a house may
     *  not write twice running at the top band (`pickAdHouse`), so the shelf shows different names
     *  across a reign: «игрок устанет смотреть на одно и то же название без смены ГОДАМИ». Every
     *  name is fictional and constructible into no real company or trademark.
     *
     *  ⚠ CLOTHING HAS NO HOUSES OF ITS OWN, BY DESIGN («двойной программой»): the writer is the
     *  live kit deal's brand – Baseline Athletic paying for her racket bag AND a poster campaign
     *  is two deals, one brand, separate letters, separate money. No kit deal, no clothing
     *  campaign; the kit paper stays entirely the kit ladder's. */
    categories: {
      watches: {
        label: 'Watches',
        trade: 'We make watches',
        houses: ['Quiet Hour', 'Halfpast', 'Silver Alder'],
        feeCentsByBand: [20_000_00, 200_000_00, 500_000_00, 1_200_000_00],
      },
      cars: {
        label: 'Cars',
        trade: 'We make cars',
        houses: ['Northgate Motors', 'Caldera Auto', 'Faro Automobiles'],
        feeCentsByBand: [12_000_00, 400_000_00, 800_000_00, 2_000_000_00],
      },
      drinks: {
        label: 'Drinks',
        trade: 'We make drinks',
        houses: ['Cold Current', 'Verdel Springs', 'Ninefold'],
        feeCentsByBand: [8_000_00, 150_000_00, 400_000_00, 1_000_000_00],
      },
      clothing: {
        label: 'Clothing',
        trade: 'We make her kit',
        houses: [],
        feeCentsByBand: [5_000_00, 100_000_00, 300_000_00, 1_000_000_00],
      },
      airline: {
        label: 'Airline',
        trade: 'We fly people across the world',
        houses: ['Northmere Air', 'Corvess Airways', 'Palewing Atlantic'],
        feeCentsByBand: [null, 250_000_00, 600_000_00, 1_500_000_00],
      },
      fragrance: {
        label: 'Fragrance',
        trade: 'We make perfume',
        houses: ['Rivelle', 'Maison Ondelle', 'Blanche & Noir'],
        feeCentsByBand: [null, null, null, 2_500_000_00],
      },
    } as Record<Exclude<AdCategory, 'capstone'>, AdCategoryDef>,
    /** ⭐⭐⭐ THE CAPSTONE (P6, approved twice – §6 «D … очень хорошо» and §8's own last row): the
     *  one kit-shaped deal on top of the whole shelf. His anchor sentence, verbatim: «Федерер
     *  получал контракт с Nike на 10+ миллионов, это 1-2млн для родителя.»
     *
     *  ⚠⚠ THE GATE IS TENURE, NOT A RANK READ TODAY: four seasons ENDED inside the world's top 10,
     *  counted off `seasonHistory[].byTrack.wta.endRank` – banked once a season at the wrap,
     *  never pruned, already persisted, so the gate is a fold over an existing field and NO schema
     *  moves (65 stays). Measured before it was picked: 4+ seasons in the top 10 is the top ~10%
     *  of careers (7 of 72, the round-29 reachability run), which is what a career-crowning deal
     *  should cost.
     *
     *  ⚠ KIT-SHAPED MEANS THE SHAPE, SAID PRECISELY: eight years, one at a time, the writer is the
     *  kit house that already dresses her (the double programme at icon scale – his Federer/Nike
     *  sentence is a kit brand paying for a FACE), falling back to the icon rung's own brand when
     *  she happens to be between kit deals so the gate he ruled is the only gate there is. It pays
     *  cash for her face through `bankSponsorCheque` like every ad deal – NOT kit, fares or
     *  bonuses – and its year-fee lands each anniversary (`payAdAnniversaries`). */
    capstone: {
      /** seasons that must have ENDED inside the top 10 before the letter is written */
      seasonsInTop10: 4,
      /** the fee per contract year – his $10M sentence, exactly */
      cashCents: 10_000_000_00,
      termYears: 8,
      shootWeeksPerYear: 2,
    },
    /** 1–3 contract years for every category deal – the research's own law for non-endemic paper
     *  («kit deals run 8–10 years while non-endemic deals run 1–3», off-court-money.md), drawn per
     *  letter on the letter's own sub-stream. The churn is the variety: short paper is what makes
     *  the 2–4 houses per category actually rotate. */
    termYearsMax: 3,
    /** The earliest a shoot may land after the signature, in weeks – the studio is booked about a
     *  month out, and it is the same courtesy the letter's own decide weeks extend: a cost the
     *  player can SEE coming is a plan, a cost that lands the week he agreed to it is a trap. Engine
     *  mechanics of the choice, not a promise on the paper – so it is read at signature, not frozen
     *  into terms. */
    shootLeadWeeks: 4,
    /** ⭐⭐ ROUND 29 #3 – WHAT SHOOTING AND PLAYING IN THE SAME WEEK COSTS HER, PER DAY OF THAT WEEK.
     *
     *  THE OWNER'S OWN FIGURE, verbatim: «+1 в день, т.к. съемка занимает не один час, то нагрузка
     *  будет мощной на всю неделю». So it is one condition point per day and it is charged across
     *  the WHOLE week rather than per shoot slot – his sentence says why: a shoot is not an hour,
     *  and the load it leaves is the week's, not the afternoon's.
     *
     *  ⚠ IT IS A PRICE AND NOT A REFUSAL. Round 28's shoot week is «not blocked and not
     *  double-charged» and that still holds everywhere else; this is the one week the owner asked to
     *  be paid for, and only when the parent has CHOSEN to have both – the other three answers to
     *  the collision remove it (see `world/shootClash.ts`).
     *
     *  ⚠ PER DAY, MULTIPLIED BY THE WEEK'S DAYS AT THE ONE SITE THAT CHARGES IT
     *  (`accrueCondition`). Written as a rate rather than as a total because that is the shape he
     *  named it in, and because a week is seven days everywhere in this engine – the plan matrix,
     *  `planWeek`, the calendar grid – so the multiplication has one honest reading. */
    clashConditionPerDay: 1,
    /** The weekly chance a qualifying week produces the letter, on its own sub-stream
     *  (`seed:ad:<week>`, never MAIN). 5% a week puts the median arrival ~13 weeks after she
     *  crosses the bar and the mean ~20 – the plan's §2 row «when it arrives: after results, and it
     *  LAGS them», bought with one number instead of a second calendar. Unlike the kit window's
     *  once-a-season 70%, this rolls weekly because a campaign is not an off-season ritual: brands
     *  write when they notice her. */
    offerChance: 0.05,
    /** HOW LONG THE PARENT HAS TO THINK, in weeks, counted INCLUSIVELY from the week the letter
     *  lands: the deadline is `arrival + decideWeeks - 1`, so five means the arrival week and the
     *  four after it, and the letter is still answerable on the last of them.
     *
     *  ⚠ FOUR → FIVE, ROUND 28 #2, AND IT SETTLES A DISAGREEMENT RATHER THAN TUNING A NUMBER. The
     *  owner: «Предложение от спонсора с часами пришло на сорок четвёртой неделе А на сорок восьмой
     *  уже истёк срок рассмотрения мне казалось мы договаривались про 5 недель». He is describing
     *  this letter exactly – `brand` below is the watchmaker – and the arithmetic he read off the
     *  screen was right: at four, a letter filed on W44 died on W47 and was already gone when he
     *  looked on W48.
     *
     *  ⚠⚠ AND THE FIVE HE REMEMBERS WAS NEVER WRITTEN DOWN FOR THIS LETTER. What this comment used
     *  to say was "four weeks – the same thinking time the kit window's letters get", and that
     *  sentence was loose in a way that produced the bug: the KIT window is five weeks wide
     *  (`SPONSOR_WINDOW_WEEKS`, «межсезонье +2»), and what a kit letter actually gets is five weeks
     *  for the first of a winter down to two for the last, because its deadline is the WINDOW's and
     *  not its own (see `SPONSOR_LETTER_WEEKS`). Reading "the same thinking time" off
     *  `sponsorship.decideWeeks` – the number that SIZES that window rather than the time any letter
     *  gets – is how the advertising house came to give four. The owner's memory is the ruling
     *  (round 28 #2), so the campaign letter now gets the five weeks the window's own first letter
     *  gets, on its own clock, and the number is written here as a duration rather than borrowed.
     *
     *  ⚠ IT IS ITS OWN CLOCK AND MUST STAY ONE. An advertising letter is not windowed – it arrives
     *  on whatever week the campaign notices her (`reviewAdOffer`) – so it cannot inherit the kit
     *  window's «every letter dies when the window closes» rule without a decision hanging over
     *  weeks she is playing, which is the exact fault the 01.08 move into the off-season fixed.
     *  Stated on the paper and enforced by `expireOffers`. */
    decideWeeks: 5,
  },

  // --- FAME (round 29 part four P7/P8, docs/specs/fame-and-the-shoots-2026-08.md) ---------------
  //
  // «нам важны разные спонсоры и их появление как можно раньше в плане фотосессий и их количества –
  // это прямой рычаг известности» – and his «здесь полностью согласен» on the floor-and-multiplier
  // shape: THE FLOOR IS EARNED ON COURT AND THE SHOOTS MULTIPLY IT. A champion who never shoots is
  // still famous; a face with no results has nothing for the photographs to multiply.
  //
  // ⚠⚠ FAME IS A FOLD, NEVER A ROLL. It is a pure function of what has already happened – dated
  // titles (`trophiesByTier`, weeks, never pruned), lost Slam finals (same ledger), seasons ended
  // inside the top 10 (`seasonHistory[].byTrack.wta.endRank`) and shoot weeks already lived
  // (`AdOfferTerms.shootWeeks` on signed letters) – so RNG input-independence is not merely
  // respected but unreachable: there is no die anywhere in it, and nothing is persisted for it
  // (the stock is re-derived from the career's own records on every read). See world/fame.ts.
  fame: {
    /** ⭐ THE FLOOR, PER RESULT THE WORLD NOTICES – fame points per TITLE at each professional
     *  tier, freshest worth the full step and every step fading on `halfLifeWeeks` below. The
     *  spec's own floor list is «a Slam final, a title at 1000+, a first top-10 season»; the
     *  ladder below extends it downward with small steps so a climbing career is not a flat zero –
     *  the local paper notices a W35 title even if the world does not. Tiers absent here (the
     *  junior and domestic rungs) buy no fame at all: the world does not read junior draws. */
    titleFloor: {
      w15: 0.25, w35: 0.5, w50: 0.75, w75: 1, w100: 1.5, wta125: 2,
      wta250: 4, wta500: 8, wta1000: 14, slam: 25,
    } as Partial<Record<TierId, number>>,
    /** a LOST Slam final – the one runner-up plate the world remembers (spec §3's own example).
     *  Lost finals at every other tier buy nothing: the world remembers who won. */
    slamFinalFloor: 12,
    /** ⭐⭐ WHAT A FINISHED SEASON'S END-RANK IS WORTH, best matching band only, counted once per
     *  season from its wrap week. The spec's floor list says «a first top-10 season»; this is that
     *  entry as a LADDER, in the shape `academy.reputationBands` already uses two blocks up.
     *
     *  ⭐⭐⭐ ROUND 30 #24 – SHIPPED 30.08, AND THE TWO LOWER RUNGS ARE THE ITEM. The owner, three
     *  times: «она же топ-20 в мире». Before them a career built on quarter- and semi-finals earned
     *  no title, reached no Slam final and ended no season in the top ten, so its fame floor was
     *  EXACTLY ZERO and its brand was worth nothing however high it ranked – a top-20 player was
     *  invisible to her own brand by construction. That is arithmetic, not a measurement, and it is
     *  what the two rungs end.
     *
     *  ⚠ THE DATA FOR «DEEP RUNS» ITSELF DOES NOT EXIST AT THE TOURNAMENT LEVEL: `TierTrophies`
     *  records `titles` and `finals` and nothing below a final, so a quarter-final leaves no durable
     *  trace anywhere in the save. The END-RANK ladder is the answer that needs no schema move,
     *  because `seasonHistory[].byTrack.wta.endRank` is already written for every finished season –
     *  and a season ended at #18 IS the deep runs, summed and sorted by the tour itself.
     *
     *  ⚠⚠ IT MOVES MERCH INCOME AND THE BRAND'S WORTH ON EVERY CAREER, and it was benched before it
     *  was kept: 72 careers x 780 weeks, median peak fame 58.9 -> 67.5 (+14.6%), with the two rows
     *  that make it safe UNCHANGED – the fame the week a family can first afford the brand (9.6) and
     *  the brand's worth on the day they buy it. A family reaches first affordability before it has
     *  finished top-50 seasons to bank, so round 30 #9's «fair on the day they can afford it»
     *  multiple and the fund-parity anchor both survive untouched. The lift lands in the MIDDLE of
     *  the distribution, which is where he asked for it: p90 and best are already at the fame cap.
     *  ⭐ It also partly answers round 30 #13 as a side effect – a top-20 season feeds the stock
     *  WHILE SHE IS CLIMBING, so climbing windows that lose income fall 15.1% -> 13.7%.
     *  Predicted vs measured: docs/specs/brand-worth-and-income-2026-08.md. */
    seasonEndBands: [
      { maxEndRank: 10, add: 10 },
      { maxEndRank: 20, add: 4 },
      { maxEndRank: 50, add: 1.5 },
    ] as readonly { maxEndRank: number; add: number }[],
    /** ⭐ THE SLOW DECAY – the half-life of every contribution, in weeks. Two seasons: a Slam won
     *  six seasons ago still carries an eighth of its step, so a reign fades over about four to
     *  six seasons rather than overnight. ⚠ Decay is what makes fame a lever and not a rank by
     *  another name (spec §3) – a stock that only rises is a trophy cabinet. */
    halfLifeWeeks: 104,
    /** ⭐ THE MULTIPLIER'S STEP – each shoot week ALREADY LIVED multiplies the floor by
     *  (1 + step), the step itself decaying on the same half-life. Twelve fresh shoots ≈ ×1.6:
     *  enough to reorder two comparable floors (the census's #30-on-court / #2-off-court shape),
     *  never enough to make a face out of nothing – zero floor times anything is zero. */
    shootStep: 0.05,
    /** ...and the multiplier's ceiling. The photographs can at most double what the court earned –
     *  the spec's «a multiplier on a floor she earns on court, not the only road», as a bound. */
    shootMultCap: 2,
    /** fame is bounded 0–100 – the spec's own scale; the cap is «the whole world knows her». */
    cap: 100,
  },

  // --- THE PARENT'S BUSINESSES (round 29 part four P7 – merch and the academy that earns) --------
  //
  // His order, verbatim: «нам нужен мерч, растущий от частоты и обилия рекламных контрактов,
  // съемок, выступлений, титулов и прочего» and «нам нужна академия, которая зарабатывает».
  //
  // ⚠ TWO INSTRUMENTS, TWO AXES, DELIBERATELY (P7's own chain): merch follows FAME – the fold over
  // contracts, shoots and titles he listed, which is NOT rank – and the academy follows
  // SEASONS-IN-BAND (reputation, the P2 ruling «чем выше и дольше место – тем выше доход»). The
  // two are different numbers in this game and the businesses keep them apart.
  //
  // ⚠⚠ INCOME ONLY, NEVER NEGATIVE – «мы ни за что не наказываем». Both lines are the NET of a
  // business that simply sells less when nobody is looking; zero is their floor by construction.
  // ⚠ ZERO DRAWS ON ANY STREAM: both are arithmetic on persisted records (world/business.ts).
  business: {
    merch: {
      /** ⭐ WHAT ONE POINT OF FAME SELLS, in cents a week – the merch dial's SCALE. At fame 10 (a
       *  few small titles) the brand pays ≈ the index fund on its $250,000 price; that anchor is the
       *  one end of the curve that was already right, and round 30 #23 kept it to the cent by
       *  pivoting the new curve on it (`famePivot`). Sized originally against the round-29
       *  counterweight gap: the 10% commission costs the MEDIAN career ≈ $130k of peak wallet.
       *
       *  ⚠ IT IS NO LONGER THE WHOLE DIAL – see `famePivot` directly below. Reading this constant
       *  alone as «dollars per fame point» has been true only up to fame 10 since round 30 #23. */
      perFamePointCents: 3_000,
      /** ⭐⭐⭐ ROUND 30 #23 – THE PIVOT OF THE CONVEX INCOME CURVE, in fame points:
       *      weekly = perFamePointCents x fame² / famePivot
       *
       *  THE OWNER: «проанализировать и скорректировать доход мерча». Measured
       *  (docs/research/player-brands-and-what-they-are-worth.md §7e), the linear dial paid $91.9k a
       *  year at the median career's peak fame and $156k at fame 100, against a researched band of
       *  **$0.5M–$2M a year NET** for a top full own-brand (§7d, derived from Sugarpova's $20M peak
       *  valuation and EleVen's $5–12M turnover through §5.4's multiples) – 3–13x under.
       *
       *  ⚠⚠ AND THE SHAPE IS FORCED, NOT CHOSEN. The BOTTOM of the old curve measured true: at the
       *  fame a family holds the week it can first afford the brand it yielded 6.0% a year against
       *  the index fund's 7%, which is this block's own anchor confirmed live. A flat multiplier
       *  would have broken the end that was right to fix the end that was wrong. Hold the anchor,
       *  reach the band, and the only curves left are convex; this is the simplest member, pivoted on
       *  the anchor itself so it is IDENTICAL at fame 10 by construction (fame²/10 = fame there) and
       *  diverges only above it.
       *
       *  ⚠ TEN IS THE ANCHOR'S OWN FAME AND NOT A FREE PARAMETER. Moving it moves the day-one
       *  economics of the rung, which round 30 #9's multiple was sized against. */
      famePivot: 10,
      /** ⭐⭐⭐ ROUND 30 #23/#24 – WHAT THE CAREER ADDS TO THE BRAND'S MULTIPLE. The arithmetic is
       *  `world/brand.ts`; this is its ladder.
       *
       *  THE OWNER: «У нас есть её профессионализм, сколько играет, сколько выигрывает, как глубоко
       *  проходит и вся остальная информация… Всё это можно использовать в расчете так или иначе.»
       *  The four rungs below are that sentence, in his order, each read off a record the save
       *  already keeps and never prunes – no schema move, no new field, a fold over history.
       *
       *  ⚠⚠ THEY MOVE THE WORTH AND NOT THE INCOME, WHICH IS THE POINT OF THEM. Before round 30 #23
       *  the brand's worth was `16 x a year of its income` and the two were ONE dial – nothing could
       *  reach one without moving the other in exactly the same proportion, which is why #23 stalled.
       *  Income is CURRENT FORM (fame, which falls); this is the ACCUMULATED CAREER, which is finding
       *  §5.1 of the research verbatim – «brand value follows the accumulated stock, not current
       *  form». Two careers at identical fame are now worth different money.
       *
       *  ⚠ AND NOTHING HERE IS SUBTRACTED. Every rung is a non-negative addition over a base, so a
       *  short career, a losing season and an unranked year cost nothing – «мы ни за что не
       *  наказываем» read against a valuation. */
      value: {
        /** ⭐ «ОНА ЖЕ ТОП-20 В МИРЕ» – the end-rank a finished season has to beat to count as one of
         *  her top seasons. ⚠ The SAME 20 as `fame.seasonEndBands`' new rung, and deliberately: #24
         *  is one claim about one number, and a brand that valued «top-20» differently from the fame
         *  floor that pays it would be two answers to his one question. */
        topEndRank: 20,
        /** «сколько играет» – per finished PROFESSIONAL season (one carrying a WTA end-rank). */
        seasonX: 0.2,
        seasonCapN: 12,
        /** «она же топ-20» – per season ended inside `topEndRank`. The heaviest rung, because it is
         *  the one he has raised three times. */
        topSeasonX: 0.3,
        topSeasonCapN: 8,
        /** ⭐⭐ «как глубоко проходит» – per professional final REACHED AND LOST (`TierTrophies
         *  .finals`, every tier `fame.titleFloor` names). ⚠ Round 30 #24 established that there is
         *  no ledger below a final, which is true and which is why a quarter-final cannot count; it
         *  does not stop a FINAL counting, and the fame floor reads `finals` only at 'slam', so every
         *  lost final from w15 to wta1000 is a dated professional result nothing in this game has
         *  ever read. Titles are deliberately NOT here – they are already fully priced into the
         *  income through fame, and pricing them twice is the one-dial defect wearing a new hat. */
        finalX: 0.1,
        finalCapN: 12,
        /** «сколько выигрывает» – her WTA-track career win rate, as a share of the window below. A
         *  career at or under `winRateFrom` adds nothing and is charged nothing. */
        winRateX: 1.0,
        winRateFrom: 0.6,
        winRateTo: 0.85,
        /** the ceiling on the whole multiple, base included. ⚠ IT BINDS THE TOP OF THE SHELF: at
         *  fame 100 the convex curve pays $1.56M a year, so this is what decides whether the best
         *  career in a run exits at the RF mark's ~$27M or somewhere absurd. Sized in
         *  docs/specs/brand-worth-and-income-2026-08.md against the researched valuations rather
         *  than picked. */
        maxX: 20,
      },
    },
    academy: {
      /** ⭐⭐ WHAT EACH DELIVERED STAGE BRINGS IN AT REPUTATION 1.0, in cents a week, keyed by the
       *  catalogue's own stage ids. THE SHAPE IS THE ROUND-29 REACHABILITY PROPOSAL'S OWN TABLE
       *  (the ledger, part three): the land is a field and earns nothing; the courts rent; the
       *  clubhouse lodges; the staff run the programmes that are the business. One number reaches
       *  the ledger per week – the Nadal split (programmes+lodging 56%, its own sponsors 14%,
       *  merch, restaurants – Forbes España 2023) is the flavour of the LINE, never four lines.
       *
       *  ⚠ SIZED A QUARTER ABOVE THE PROPOSAL'S $5,750 BASE ($7,250), AND MEASURED BEFORE IT WAS
       *  KEPT (docs/specs/merch-and-academy-income-2026-08.md, predicted vs measured): the
       *  proposal's own sizing was «repay the p90 commission in 7 seasons at the cap»; the P7
       *  bench criterion is the research's bridge – the $12M academy repays in roughly 5–10
       *  seasons of a real reign. Benched at 108 × 780 (--buy-business): the careers that BUILD
       *  it hold reputation 2.40–4.00 with the MEDIAN BUILDER AT THE 4.00 CAP, where this base
       *  repays in **8.0 seasons** ($1.508M/yr) – mid-window – against 10.06 at the unlifted
       *  anchor (the window's edge); the worst builder (2.40) reads 13.3. At reputation 1.0 it is
       *  3.1% a year against the fund's 7% – the shelf's own law («assets never beat a career,
       *  they only survive one») still holds everywhere below a top-ten reign. */
      stageIncomeCents: {
        'academy-land': 0,
        'academy-courts': 95_000,
        'academy-building': 250_000,
        'academy-staff': 380_000,
      } as Record<string, number>,
      /** ⭐ REPUTATION – the fold over `seasonHistory[].byTrack.wta.endRank` the round-29 ledger
       *  proposed and P2 ruled («чем выше и дольше место – тем выше будет доход»): 1.0 base, plus
       *  the BEST band of each finished season, counted once per season, capped below. A season
       *  with no recorded WTA end-rank (pre-v46 rows, null ranks) counts nothing – «not recorded»
       *  is not «top-100». */
      reputationBands: [
        { maxEndRank: 10, add: 0.6 },
        { maxEndRank: 25, add: 0.35 },
        { maxEndRank: 50, add: 0.2 },
        { maxEndRank: 100, add: 0.1 },
      ] as readonly { maxEndRank: number; add: number }[],
      reputationCap: 4,
    },
  },

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

  // =================================================================================================
  // THE SUMMER TRAINING BLOCK (W3-SUMMER) - nine weeks with no school in them
  // =================================================================================================
  //
  // THE OWNER'S RULING, and it is a correction of an objection rather than a fresh idea: «я играл и
  // брал отпуска между турнирами пропуская и коучинговые сессии в том числе, если мы летом сделаем
  // реальную нагрузку с 2 тренировками в день я не вижу ничего плохого, это как раз частично
  // компенсирует недостаток тренерских недель в другие периоды, т.е. сделает прокачку эффективнее и
  // более полной.»
  //
  // ⚠ SO IT IS VOLUME, NOT A BETTER MULTIPLIER, and that distinction is the whole design. She is not
  // learning FASTER in the holidays - she is on court twice a day instead of once, because there is
  // no school, and a fuller week develops more and costs more. That is why it lands on `growWeek`'s
  // `loadFactor` (the knob whose own note says it is "HOW MUCH OF THE WEEK SHE ACTUALLY TRAINED") and
  // on the condition accumulator, and not on `trainFactor`, the coach or the luck draw.
  //
  // ⚠ AND IT MUST NOT BE MANDATORY. A family that books its holiday in the summer LOSES the block -
  // `summerBlockWeek` refuses on a vacation week, on a tournament week, on a layoff and on a rested
  // knock - and that is a TRADE, not a punishment: the vacation's own condition package is paid
  // instead, and the weeks she spends racing earn the match bonus instead. The choice is the feature.
  //
  // SIZING, AND IT IS MEASURED (tools/summer-bench.ts, 24 careers x 4 seasons, 14->18):
  //
  //   TRAINING-ONLY career   9.0 block weeks a season   +0.35 skill points over the career
  //   RACING career          3.9 block weeks a season   +0.18 skill points over the career
  //
  // The racing row is the design working rather than the design failing: most of her summer is a
  // tournament, and `summerBlockWeek` stands down on those weeks because a competition week already
  // has its own bonus and its own bill. So the block is worth most to the girl who is NOT travelling,
  // which is exactly «частично компенсирует недостаток тренерских недель» read literally. Against the
  // yardstick it is a help and never the lever: one year of junior development is 2.4 skill points
  // and the whole coach ladder is 2.26, so a full career of summers is a seventh of a coach.
  //
  // AND THE FATIGUE, which is the half that surprised the bench (§1c):
  //   at the condition CEILING       0.0 - `recoveryBase` is 8 a week, so the -3 is clamped away and
  //                                  a girl who is not already tired does not notice a fuller summer;
  //   from a real deficit (start 20) -7.0 condition points by September (93.0 against 100.0).
  // Both are true and the second is the one the design is defended on: the block bites exactly on the
  // body that is already carrying a season, which is whose summer this is.
  summerBlock: {
    /** The multiplier on the week's development rate, through `growWeek`'s `loadFactor`. Two sessions
     *  a day is not twice the learning - the coach's hours are what they are, and volume has sharply
     *  diminishing returns - so it is +40%, not +100%. */
    loadFactor: 1.4,
    /** ...and what the fuller week COSTS her, in condition points, against a free training week's
     *  `recoveryBase` of 8 plus 0-2 from the rest slider. Three: she still comes out of a summer week
     *  ahead, which is right (there is no travel and no competition in it), but a nine-week block run
     *  back to back leaves her measurably more tired than nine ordinary weeks would - and the injury
     *  model reads condition, so the block carries its own risk without a rule of its own.
     *
     *  ⚠ INTEGER, like every other term in the condition accumulator ("no fractions", the owner's own
     *  round-9 redesign), and subtracted BESIDE `accrueCondition` rather than inside it - the same
     *  shape the knock's rest credit and the vacation's package gain use, and the reason
     *  `accrueCondition` keeps the arity-2 zero-RNG contract tests/condition.test.ts pins. */
    conditionCost: 3,
  },

  // =================================================================================================
  // SCHOOL, AND THE WEEK AFTER IT (W4-SCHOOL) - the summer block's own logic, made permanent
  // =================================================================================================
  //
  // THE OWNER, from his own playtest, twice: «Школа должна когда-то закончиться, ей уже 21, а
  // тренировки и прогресс должны удвоиться, соответственно, как мне кажется. Школа уже после 18 вроде
  // не должна быть.» and, a day later, «и школа с уроками в 22 года всё еще со мной». School had no
  // end at all: `isExamWeek` was a pure function of the season week, so a twenty-two-year-old
  // professional still sat two exam papers every June and her calendar still drew a lesson block at
  // eight in the morning.
  //
  // AND WHEN IT ENDS IS HIS SECOND RULING: «Конец школы – в конце учебного года.» Not her birthday -
  // the school year containing it, which is what happens to a person and which the calendar already
  // has a boundary for (`SCHOOL_YEAR_TURNS_AT`, 1 September). `kidLife.ts`'s `gradeOf` has modelled
  // exactly that since the School tile shipped, and it already returns null past the last grade.
  // Nothing else in the game read it. Now everything does. (What the tile SAYS when it returns null
  // stopped being "School finished" in round 23 #6 – see `lifeStageTile`; the arithmetic is the same.)
  //
  // ⚠ THE LOAD HALF IS THE SUMMER BLOCK'S ARGUMENT WITH A LONGER WINDOW, AND IT IS DELIBERATELY THE
  // SAME NUMBER. The owner's summer ruling was about a week «с 2 тренировками в день» because there
  // is no school in it; a week in October when she is nineteen is the same week for the same reason.
  // One school-free week may not be worth 1.4 in July and 2.0 in October, so `loadFactor` here IS
  // `summerBlock.loadFactor` - a separate knob only because the WINDOW is thirty-odd weeks a year
  // instead of nine, and a knob whose window changes by a factor of four has to be swept on its own.
  // See docs/specs/school-ends-2026-08.md for predicted vs measured, and for why "doubles" did not
  // survive the bench.
  school: {
    /** The last grade of school. `gradeOf` returns null past it, which is what ENDS school; read
     *  live (not captured at module load) so the bench can sweep it - `tools/school-bench.ts` sets
     *  it to 99 to re-play the shipped game, where school never ended at all. */
    lastGrade: 12,
    /** The multiplier on a post-school week's development rate, through `growWeek`'s `loadFactor` -
     *  the same channel and the same value as `summerBlock.loadFactor`, for the reason above. */
    loadFactor: 1.4,
    /** ...and what the fuller week costs her, in condition points. ⚠ ZERO, AND THAT IS A MEASURED
     *  DECISION RATHER THAN AN OMISSION - see docs/specs/school-ends-2026-08.md §5. The summer
     *  block charges 3 for nine weeks; charging 3 for thirty-odd takes the off-season door from 73
     *  to the fifties and lifts injury prevalence, i.e. it makes leaving school a thing that hurts
     *  her, and «мы ни за что не наказываем» governs. The hours school took back were never on a
     *  court, so giving them back is not a heavier week than a summer one - it is more of them. */
    conditionCost: 0,
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
     *  the one this pays.
     *
     *  ⚠ 0.8 -> 0.75 (R15-7, owner 01.08: «потолок скидки на поездки можно и по-меньше сделать
     *  может быть немного»). A nudge, not a rebuild - and MEASURED before shipping, because the
     *  academy is THE survival mechanism for working-background careers. The econ bench's working
     *  presets at 30 seeds, before -> after: BACKING and SURVIVAL hold (backed 27-30/30 -> 27-30/30,
     *  max -2 careers per 30; survival deltas -3..+3, both directions), so the mechanism itself is
     *  intact and the change ships. What visibly gives is TRIP VOLUME at the long horizons: a
     *  backed family's net fare rises a few percent, the affordability-gated policy books fewer
     *  international weeks (self-coached grinder j30 entries 55 -> 45 over 14->20, covered travel
     *  mean $7.5k -> $5.7k), and the points-denominated reach proxy softens with it (worst working
     *  cell 24 -> 16 of 30 at 14->18). Flagged in the round-15 report for the owner's call rather
     *  than smoothed over: it is the intended lever doing exactly its arithmetic, at a size he may
     *  or may not want. If a future pass lowers the ceiling further, run this same arm first. */
    travelCover: 0.75,
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
    //
    // ⚠⚠ 1 -> 8 (W2-FATIGUE, docs/specs/fatigue-reprice-2026-08.md §3). THE OTHER HALF OF THE SAME
    // DECISION as the W surcharge reprice below, and it could not be anything else: at the shipped
    // surcharge a rest week would have had to return SEVENTEEN for the owner's season to balance,
    // and that is not rest, that is convalescence. So both dials move towards each other instead.
    //
    // THE NUMBER IS THE SEASON EQUATION'S, not a taste. His design (§1) is twenty events on every
    // second week, fatigue that ACCUMULATES, and «то, что за off-season РЕАЛЬНО восстановить с 1
    // большим или парой небольших отпусков» - which is arithmetic: arrive at the off-season door
    // around 45-50, so twenty play+rest PAIRS cost ~55, so each pair costs ~2.75, so a rest week
    // must return within ~2.75 of what an average event drains. At the repriced surcharge an average
    // professional event costs ~12.5, so the rest week owes ~10 = base 8 + the 60/40 slider's 2.
    // The vacation table below is denominated in exactly this unit (18/22/26/32/40/48 = 2.2 … 6.0
    // rest weeks at base 8), which is why the two tables have to move in one pass.
    //
    // ⚠ IT IS GLOBAL, SO THE JUNIOR ERA AND THE COHORT GET IT TOO - deliberate, not collateral. The
    // spec moves what a WEEK returns, not what a professional week returns; the junior COST tables
    // are untouched (not one cell of tests/fatigueReference.test.ts's domestic/J rows moves). What
    // does move is how fast anybody comes back, kid and rivals alike, and the rival half is
    // re-measured rather than re-tuned - see `rivalFatigueWindowWeeks` below, whose whole premise
    // ("at recoveryBase 1/week their drain outruns their recovery permanently") this number retires.
    recoveryBase: 8,
    // ⭐ THE PRO PHASE RECOVERS ON 5, NOT 8 (owner 22.08, variant C of his own proposal: «может
    // быть нам тогда стоит дефолтное восстановление с 10 в неделю на 7 опустить? тогда массажист
    // как раз будет еще немного накидывать, может вполне гармонично получиться»). His 10 = base 8
    // + the 60/40 slider's +2, so his 7 = base 5 – and it applies ONLY while
    // `activeLadderOf === 'wta'` (the masseur's own unlock boundary), read through
    // `recoveryBaseFor` in world/medical.ts. Juniors and ALL 199 RIVALS keep `recoveryBase` above.
    //
    // ⚠ THE GLOBAL DROP (variant B) WAS MEASURED AND REJECTED – docs/specs/the-masseur-2026-08.md
    // §10, 32 paired seeds × 2 presets: B lands 2/3 of its damage outside the place he aimed at
    // (junior condition −1.6..−2.2 at 3.5-5 SEM, +3 bankruptcies across 64 base careers, two
    // careers per preset never turn professional) and the one thing the proposal was FOR – the
    // masseur's uplift – SHRINKS (~40% fewer rehab receipts). C keeps the junior era byte-identical
    // (measured 0.00 ± 0.00 on every metric) and makes the pro grind honestly harder exactly where
    // he pointed. His «накидывать» arithmetic only works here too: base 5 + slider 2 + the entry
    // rung's +1 = 8 for a staffed professional against today's unstaffed 10.
    proPhaseRecoveryBase: 5,
    // ⭐⭐⭐ THE FLOOR UNDER THE FADING RECOVERY (the long goodbye §4a, owner 26.08 – «пол 2.5 ок»).
    // From `declineStart` the base above is multiplied by the share of her own peak physical she has
    // left, and this is the lowest that multiplier may go: 0.5, so a professional rest week can never
    // return less than 2.5. His own addition to the spec – «и физика будет падать и восстанавливаться
    // будет дольше» – because until it the only thing age touched was the attribute VALUE: a
    // thirty-eight-year-old drained from a match exactly as fast as a twenty-two-year-old and came
    // back exactly as fast, so the old body was weaker but never tireder, which is backwards.
    //
    // ⚠ IT IS A MULTIPLIER ON `recoveryBaseFor`, NOT A SECOND CURVE. The share is the one §3a already
    // computes for the ending, so the corridor closes continuously – every week, with no steps in it
    // – and no new constant is tuned. `world/medical.ts` is the single place it is spent.
    //
    // ⚠⚠ AND IT IS ALMOST INERT UNDER THE SHIPPED THRESHOLD, which is worth knowing BEFORE anybody
    // reaches for it. The share first falls below 0.5 at ~43, and `ENDINGS.lastOfferPeakShare` (0.55)
    // has ended the career at ~41.2 – so this fires on outliers only (a migrated save, a future dial).
    // It is a safety net, not a balance knob: «nobody should later raise the floor to fix something
    // without noticing it is not currently doing anything» (§4a). ⚠ The ONE thing that legitimately
    // moves it is §6.6's veto – if the fade pushes season injury prevalence further over its band,
    // this rises before anything else is touched.
    recoveryAgeFloor: 0.5,
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
    // ⚠ AND THE FRIENDLY NO LONGER READS LOCAL'S SURCHARGE AT ALL (W2-WINDOW): with local at 1 the
    // same formula would have taken the cheapest thing in the game from 1/2/3 to 2/3/4 as a side
    // effect of pricing a tournament WEEK. `resolvePractice` subtracts the surcharge by name now -
    // a practice set against a clubmate has no trip in it - so those three values are pinned to the
    // SCORELINE and cannot move again when Local is re-priced.
    matchFatigue: { straightSets: 2, hardMatch: 3, extraTiebreaks: 1 },
    // Tier surcharge PER MATCH, one step per rung. The J levels are EXTRAPOLATED above national
    // (ladder-up): international travel, time-zone changes and a fortnight away from home make
    // them the most draining weeks she plays. Worst case USED to be a 5-match J300 run at 4 + 5 per
    // match = 45, + the cumulative ladder 6 = 51 condition, and OWNER-TUNABLE: the owner has priced
    // local..national himself, never the J family, so those three are the first numbers the pending
    // tuning pass should look at – all the more so now that the base under them is one rung higher.
    //
    // ⚠ THE W FAMILY IS REPRICED ONE STEP OVER THE J FAMILY (R15-6, owner asked directly 01.08 and
    // agreed the W15 drops were too deep for what the field is today). The original W surcharges
    // (6/7/8) extrapolated "+1 per rung over J300" on the argument that a W15 field is full of
    // adults who do this for a living. MEASURED, it is not - not yet: today's W15 entrant field
    // median sits at position ~53 of 200 on the mixed table (mean skill 50.2) against the J300
    // field's ~20 (53.9), so the softest international field in the game was priced as its hardest
    // week. The W family now steps +1 over the J ENTRY rungs instead (j30 3 -> w15 4), keeping +1
    // per rung inside its own family.
    //
    // ⚠ PRICED FOR TODAY'S SOFT FIELDS, ON PURPOSE, AND THAT IS A DATED DECISION: when the
    // living-field population lands and the W fields become real professionals rather than the top
    // half of a junior table, w35/w100 must be re-priced UPWARD - measured against the actual
    // entrant fields, not guessed. The seam j300 (5) -> w15 (4) DROPS by design and the ladder
    // guard (tests/ladder.test.ts L9) is re-aimed per family to hold exactly this shape: monotone
    // inside each family, and the W family never priced above where its fields actually are.
    // ⚠ W50/W75/WTA125 (W2-LADDER) INTERPOLATE INSIDE THE PRICED FAMILY, THEY DO NOT EXTEND IT.
    // R15-6 pinned the family's ends for today's soft fields (w15 4 .. w100 6), so the two middle
    // rungs land BETWEEN them: the raw interpolation is w50 5 / w75 5.5, and the half rounds UP
    // because the condition accumulator is integer arithmetic end to end ("no fractions", the
    // block note above) - so w75 prices with the prestige pair it schedules like (every 6 weeks,
    // age 17) rather than with the dense pair. Two integers strictly between 5 and 6 do not exist,
    // so the family is monotone NON-STRICT by construction; the ladder guard (tests/ladder.test.ts
    // L9) holds exactly that. The 125 takes w100's 6, NOT a +1 step: R15-6's rule is "priced
    // against the measured field, never extrapolated by prestige", and today a 125 field is drawn
    // from the same merged-table slice as a W100's - when W2-FIELD2's fourth storey makes the 125
    // field real, IT gets re-priced upward with w35/w100, measured, per the dated note above.
    //
    // ⚠⚠ AND NOW THE WHOLE W FAMILY IS REPRICED DOWN INTO THE 2-3 BAND (W2-FATIGUE,
    // docs/specs/fatigue-reprice-2026-08.md §2-3; owner 03.08: «по усталости нам надо комплексно
    // что-то сделать, я чувствую. Значит надо все рычаги потрогать»). R15-6 above moved this family
    // for the FIELD it meets; this moves it for the SCHEDULE she keeps, and those are two different
    // arguments that happen to pull the same lever.
    //
    // THE ARITHMETIC THAT FORCED IT. The surcharge is charged PER MATCH, so the depth of a run
    // multiplies it: of a W35 title's 41 condition, 25 WERE THE SURCHARGE (61%) against 12 of
    // scoreline and 4 of cumulative ladder. Cutting the ladder instead - the intuitive move - buys 4
    // points and costs the story, so the ladder stays (see runFatigueLadderWta). And the owner's own
    // frame is an argument about exactly this number: «это же работа, она привыкла». The surcharge
    // prices international travel, time zones and a fortnight from home - written for a schoolgirl
    // who flies to a J300 twice a year. A professional grinding W35s is conditioned for her own tour
    // and must not pay more per match than that fifteen-year-old does.
    //
    // THE SHAPE IS THE SHIPPED ONE COMPRESSED, never a new table: R15-6's dense pair (w15/w35/w50 at
    // 4/5/5) all land on 2 and its prestige pair (w75/w100/wta125 at 6) on 3, so the family's one
    // internal seam stays exactly where it was and the family stays monotone non-decreasing. W35 = 2
    // is the value the ACCEPTANCE picks rather than the middle of the proposed range: a title (five
    // matches, two of them 3-setters) costs 26 and she comes home at 74%, inside spec §6.3's 70-78;
    // at surcharge 3 the same run costs 31 and she comes home at 69%, outside it.
    //
    // ⚠ SO THE J -> W SEAM NOW DROPS BY THREE, AND A W15 MATCH COSTS WHAT A NATIONAL ONE DOES (both
    // 4). That is the ruling and not an artefact: what this table prices is travel-and-adaptation,
    // and the one girl in the game who does this for a living is the one it should cost least. The
    // guards (tests/fatigueReference.test.ts, tests/ladder.test.ts L9) are RE-AIMED onto the new
    // seam, not relaxed - a decrease inside the family and a prestige re-extrapolation both still
    // fail there.
    //
    // ⚠ THE ENTRY FLOORS DID NOT MOVE WITH THEM, so R15-6's `floor = 30 + 5 x surcharge` pairing is
    // retired (see minConditionToEnter for the argument and the re-aimed guard). Two different
    // questions had been given one answer: what a week COSTS her body, and how fresh she must be to
    // start one.
    //
    // ⚠⚠⚠ AND THE DOMESTIC FAMILY GOES UP BY ONE (W2-WINDOW, owner 03.08: «как для local, Regional и
    // national мы могли бы легко брать больше condition за них, я считаю, это сделало бы вещи чуть
    // сложнее и интереснее»). 0/1/2 -> 1/2/3. The J and W families do NOT move - they were priced
    // last wave against the field and against the schedule, and not one cell of their whole-run
    // tables in tests/fatigueReference.test.ts changes.
    //
    // WHY LOCAL'S 0 WAS THE ONE WORTH FIXING. A surcharge of 0 is not a cheap week, it is NO WEEK:
    // `matchDrain` = scoreline + surcharge, so a Local match cost exactly what a practice set costs
    // and the rung contributed nothing at all to the one resource the game is about. A Local title
    // (three matches) cost 8 of 100 condition against a recovery of 8-10 a rest week, i.e. she could
    // play every Local on the calendar for free and scheduling was not yet a decision. At 1 the same
    // title costs 11, which is still cheap - it should be - but it is a number.
    //
    // THE SEAM GOES FLAT AT THE TOP, AND THAT IS THE RULING RATHER THAN AN ARTEFACT. National is now
    // 3, exactly what J30 costs. What this table prices is the week away from ordinary life, and a
    // National Series week - a 32 draw, five matches, the event the family plans a season around -
    // is the same kind of week as the entry rung of the international tour. It never INVERTS (the
    // guard in tests/ladder.test.ts L9 is re-aimed to `>=` for this table only, and the condition
    // FLOOR table keeps its strict step: 45 to enter a J30 against 40 for a National, because how
    // fresh she must ARRIVE is the different question W2-FATIGUE already separated out).
    //
    // MEASURED, tools/ladder-walk.ts, 6 prospect careers x 8 seasons, before -> after:
    // entries a season 20.8-29.2 (mean 26.2) -> see the wave report; the early domestic seasons are
    // where it bites, which is where the owner asked for it to.
    tierMatchFatigue: {
      local: 1, regional: 2, national: 3,
      j30: 3, j60: 4, j300: 5,
      w15: 2, w35: 2, w50: 2, w75: 3, w100: 3, wta125: 3,
      // W3-ACT2. The family's own step continues rather than a new scale being invented: the top
      // half of the W family sits at 3, so the 250/500 pair takes 4 and the 1000/Slam pair takes 5 -
      // which lands the biggest week in the game on exactly J300's number, the most expensive match
      // anywhere else on the ladder. What it prices is the WEEK, not the prestige: a major is a
      // fortnight's trip across a time zone against the strongest field that exists, and every match
      // in it is played after one of those.
      wta250: 4, wta500: 4, wta1000: 5, slam: 5,
    } as Record<TierId, number>,
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
    // ⚠ ...AND THE W FAMILY RUNS ON HIS LADDER D (R15-6, owner 01.08: «может быть будет иметь смысл
    // использовать другой кумулятивный механизм для мировой серии, с меньшими надбавками просто. Я
    // несколько тогда предлагал»). He is pointing back at his own four measured ladders above - D
    // is the flattest of them, +1 per subsequent match, 4 over a 5-match run against C's 6 - and it
    // lands on the same finding the surcharge reprice above rests on: today's W fields are the
    // softest international draws in the game, so the professional week grinds a run down GENTLY
    // rather than steeply. Domestic and J rungs keep ladder C untouched (their whole-run tables in
    // tests/fatigueReference.test.ts must not move a cell); the split is per FAMILY, applied inside
    // `runFatigueExtra` (engine/condition.ts) so the kid and the rival cohort inherit it from the
    // one implementation together. A straight-sets W15 title run: 5x(2+4) + 4 = 34, from 46.
    //
    //
    // ⚠ THE TWO BIG RUNGS DO NOT RUN ON THIS LADDER ANY MORE (14.08) – they have their own, keyed
    // on the DRAW rather than the track, because the question stopped being "which family" and
    // became "how many matches fit in a week". See `runFatigueLadderDeep` below and
    // `condition.ts ladderFor`. This array is therefore back to the exact five entries R15-6
    // measured, and every rung that reads it is a 32-draw, so its fifth entry is its last.
    runFatigueLadderWta: [0, 1, 1, 1, 1] as number[],
    /** ⚠⚠ THE OWNER'S OWN CURVE FOR THE DEEP DRAWS, 14.08, given as the two bounds of a match at a
     *  Slam and a WTA 1000 round by round: min 5 6 7 7 7 7 7, max 7 8 9 9 9 9 9.
     *
     *  Against `matchDrain`'s parts (scoreline 2..4 plus the rung's surcharge of 5) that is the
     *  surcharge RAMPING to its full value over three matches instead of landing flat on the first,
     *  so the ladder is the offset: -2, -1, then the tier's own number. The trailing 0 is what makes
     *  the plateau follow `tierMatchFatigue` rather than duplicate it.
     *
     *  WHAT IT COSTS A TITLE. Slam (7 matches) 46 at best, 60 at worst; WTA 1000 (6 matches) 39 and
     *  51. Under the flat surcharge those were 43/57 and 41/53 – so the Slam gets slightly dearer
     *  and the 1000 slightly cheaper, which is exactly what he predicted when he wrote the rows.
     *
     *  ⚠ IT REPLACES A CAP OF MINE THAT MADE A CLIFF. I had stopped charging the surcharge after the
     *  fifth match, which priced the deep rounds at 2 against the shallow ones' 8 – «а сейчас немного
     *  некорректно получается». A plateau is the right shape; a collapse was not. */
    runFatigueLadderDeep: [-2, -1, 0] as number[],
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
    //
    // ⚠ W2-FATIGUE RETIRED THAT PREMISE AND LEFT THE NUMBER ALONE, ON PURPOSE. `recoveryBase` is
    // now 8, so an elite rival's recovery no longer loses to her drain and the window is no longer
    // the thing standing between the cohort and a season pinned at 0 - it is now just her MEMORY,
    // which is what the paragraph above says it always was. The re-price's §7 names this window as
    // the owner's, "except where the shared implementation forces a re-measure", so it was
    // re-MEASURED and not re-tuned: the fatigue bench's rival columns (mean cohort condition and
    // the share arriving below `matchStrengthKnee`) are the receipt, reported with the wave.
    rivalFatigueWindowWeeks: 16,
  },

  // The availability gate: the minimum condition to ENTER each tier, and the school-exam blackout
  // blocks (season-week offsets, blacked out for tournaments). Off-season weeks (49-51) are already
  // event-free and are treated as blackout too (see isBlackoutWeek in world.ts).
  availability: {
    // The soft fatigue floor per tier, one step per rung (the J levels extrapolate above national,
    // matching tierMatchFatigue). Racing below the floor is still ALLOWED – it raises a caution,
    // never a block (the owner's "the parent may push, the game warns").
    //
    // ⚠ THE W FLOORS MOVED WITH THE SURCHARGES (R15-6, same ruling, same date - see
    // tierMatchFatigue). The old 60/65/70 continued the J family's +5 extrapolation and priced the
    // W15 as the most gatekept week in the game while its measured field is the softest
    // international draw there is (median entrant ~#53 of 200 against J300's ~#20). The family now
    // steps +5 over the J ENTRY rungs (j30 45 -> w15 50), keeps +5 inside itself, and the seam
    // j300 (55) -> w15 (50) DROPS on purpose - the same dated decision as the surcharge: when the
    // living-field population makes the W fields real, w35/w100 are re-priced upward, measured.
    // W100's old 70 meant nearly every entry raised a caution; at 60 it still cautions any career
    // that arrives worn, and the one HARD floor in the game is still `medicalFloor` (15) below.
    // The W2-LADDER middle rungs keep the floor<->surcharge pairing R15-6 set (floor = 30 + 5 x
    // surcharge: 4->50, 5->55, 6->60), so the floors interpolate exactly as the surcharges do -
    // w50 with the dense pair at 55, w75/wta125 with the prestige pair at 60 - and one retune
    // note (tierMatchFatigue above) governs both tables.
    //
    // ⚠⚠ THAT PAIRING IS RETIRED AS OF W2-FATIGUE, AND THIS TABLE IS DELIBERATELY UNCHANGED. The
    // fatigue re-price (docs/specs/fatigue-reprice-2026-08.md §2-3) took the W surcharges into the
    // 2-3 band; carried through `30 + 5 x surcharge` that would have put W100's entry floor at 45 -
    // BELOW J300's 55 - so the biggest event in the game would caution later than a junior one. The
    // pairing was a derivation rule for interpolating new rungs, and it quietly fused two different
    // questions: what a week COSTS her body (travel and adaptation, which the spec repriced) and how
    // fresh she must BE to start one (arrival safety, which nobody asked to move - it is not in the
    // spec's §2-5 and §7 leaves the owner's own numbers alone). The floors stay where R15-6 put them;
    // tests/ladder.test.ts L9 is re-aimed to pin this table on its own terms, and it still refuses a
    // decrease inside the family, a broken seam, or a missing rung.
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
    // ⚠⚠ ALL THREE RE-CALIBRATED 03.08 (W2-FATIGUE, docs/specs/fatigue-reprice-2026-08.md §5), and
    // the spec's own §5 is the reason they had to be: «у нас же там еще риск травм растет, как бы мы
    // себе в ногу не стрельнули усталостью». MEASURED BEFORE THE WAVE, on a career playing the
    // owner's own season (twenty events, every second week): a 96-100% chance of at least one injury
    // per season against the researched anchor of 46-54% (docs/research/injury-stats-by-age.md).
    // The foot was already shot; the re-price is the bandage, not the bullet.
    //
    // ⚠ ORDER OF WORK, honoured: the fatigue re-price landed and was MEASURED FIRST, in its own
    // commit, and this calibration was taken on top of it - never simultaneously, or the result is
    // unattributable (the mistake act2-pro-tour.md's A3 note warns about for best-16). All numbers
    // below come from tools/pro-season-probe.ts, 32 careers x 3 professional seasons, the spec's own
    // reference player (60/40, no retainer), the professional pair schedule.
    //
    // WHY ALL THREE MOVED, in the spec's own order of preference, with what each was worth:
    //   1. THE SLOPE FIRST, and the spec's suggestion of halving it was tried first and measured:
    //      0.00045 -> 96%, 0.0003 -> 79%, 0.0002 -> 67%, 0.0001 -> 60%. Halving is not close. The
    //      slope ALONE can reach the band, at about 0.00004 - but that is a 22x cut that leaves a
    //      wrecked week only 1.7x as dangerous as a fresh one, i.e. it buys the number by deleting
    //      the mechanic this whole slice is named after. Rejected on those grounds, and the
    //      measurement is here so the owner can overrule it with one line.
    //   2. THE COMPETING MULTIPLIER SECOND - and it is the injury axis of the same argument the
    //      surcharge reprice makes: 1.8 was a junior's match week, and a professional on her own
    //      tour is conditioned for hers. Worth ~4 points of prevalence on its own (a weak lever
    //      here: only 20 of 52 weeks carry it).
    //   3. THE BASE LAST, and it had to move because it is what was actually eating the band: at
    //      twenty competing weeks, 0.006 x 1.8 x the age and overuse factors contributes ~45%
    //      season prevalence BEFORE ANY FATIGUE AT ALL. It is halved, not abandoned - and the
    //      research anchor it is tied to is a PREVALENCE, not a per-week rate. 0.006 was derived so
    //      that a JUNIOR season produced 46-54%; the professional season has twice the competing
    //      weeks, so the same anchor demands a smaller base. This is a re-derivation against the
    //      same research, at the schedule the game now actually offers.
    //
    // WHAT THE SHIPPED TRIO MEASURES: 51% season prevalence at the professional pair schedule
    // (target 46-54), and the fatigue coupling SURVIVES - a week at condition 50 is 3.5x as
    // dangerous as a fresh one and a wrecked week is 6.0x, against the shipped 8.5x and 16x. The
    // cliff is flattened, tiredness still plainly hurts, which is exactly what §5 asked for.
    //
    // ⚠ AND EVERY ONE OF THESE IS STILL A POST-DRAW THRESHOLD MULTIPLY inside `injuryTau` - that
    // property is load-bearing and is untouched: zero new draws on any stream, the frozen MAIN
    // capture byte-identical, the private `seed:injury:week` sequence in the same order it always
    // was. Only the number a roll is compared against moved.
    injuryBaseChance: 0.003, // per healthy week at condition 100
    injuryFatigueSlope: 0.00015, // + per fatigue point (100 - condition)
    injuryPlayingMultiplier: 1.4, // tau *= this the week she competes
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
    // ⚠ 13 IS EXPLICIT NOW, AND IT DELIBERATELY CHANGES NOTHING. A December-born girl is genuinely 13 for
    // her first season (world.ts `kidAgeYears`), and before this the row did not exist - she fell through
    // to `default`, which is the 19+ mature-body value, and 0.85 happened to be a plausible answer. An
    // accident that produces the right number is still an accident: naming it at the same value makes it a
    // decision, and stops a later re-tune of `default` (a rule about adults) from silently moving
    // thirteen-year-olds. The shape peaks at 16, which is the growth spurt; 13 sits below 14 because she
    // is pre-spurt and carrying smaller loads.
    ageInjuryFactor: { 13: 0.85, 14: 0.9, 15: 1.05, 16: 1.2, 17: 1.05, 18: 0.95, default: 0.85 } as {
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

    // --- THE RETIREMENT DOOR'S OWN SEVERITY TABLE (round 16 #13) --------------------------------
    //
    // THE OWNER, 11.08: «RETIRE_K оставляем как есть, дверь схода надо показывать, а 3 мощные травмы
    // 6-4-4 недели подряд одна за одной – это слишком… это значит, что у нас с механикой что-то не
    // то. Это надо чинить.» So the RATE does not move – `RETIRE_K = 0.07` is on its own measured
    // calibration (docs/specs/match-retirement.md §4) and is untouched – and the door stays visible.
    // What is wrong is the CONSEQUENCE, and this table is the whole of the fix.
    //
    // WHAT IT WAS. `retirementInjury` called `onsetInjury`, which read `severityBands` above – the
    // SAME table a weekly roll uses. So a girl who stopped mid-match had a 30% chance of losing 3-6
    // weeks and a 10% chance of losing 8+. Measured over 400 season-years at careful policy
    // (docs/specs/round16-injuries.md §9): 36.3% of retirements cost 3+ weeks, 16.8% cost 6+, and
    // 61% of ALL her injuries – 68% at high condition – arrive through this door. So the acute-injury
    // table was most of what the player actually experienced.
    //
    // THE ARGUMENT, AND IT IS ABOUT THE MECHANISM RATHER THAN THE FEEL. A girl who stops because her
    // legs are gone is not the same event as a girl who tears something, and this engine knows which
    // one it is rolling:
    //
    //   1. THE TRIGGER IS EXHAUSTION, BY CONSTRUCTION. `retireHazard = RETIRE_K * spentness(n,
    //      stamina) x retireDurability(condition)` – the third factor since 27.08, and STRICTLY
    //      POSITIVE, so it cannot manufacture a stoppage where exhaustion is zero – is zero for the
    //      first 120 points and rises with IN-MATCH fatigue –
    //      match-retirement.md §3 says it in as many words: "A retirement in this engine is
    //      exhaustion, not accident", and names the rolled ankle at 2-2 in the first set as the thing
    //      it deliberately does NOT model. A hazard indexed on how spent she is should hand out the
    //      consequences of being spent.
    //   2. AND THE RULEBOOKS PUT THAT CATEGORY OUTSIDE INJURY ALTOGETHER. The tour's medical rules
    //      (docs/research/retirement-and-withdrawal.md §6) refuse a medical time-out for cramping and
    //      list "general player fatigue" as non-treatable – not because they are cruel but because
    //      there is nothing to treat. Cramp, heat and a spent body are what this hazard fires on, and
    //      they are back on court in days.
    //   3. THE 2.73% ANCHOR IS A STOPPAGE RATE, NOT AN INJURY RATE. `RETIRE_K` is calibrated against
    //      PLOS ONE 2024, and that study's own caveat (research §7 flag (b)) is that it counts matches
    //      "that started but did not finish FOR ANY REASON – illness, injury and anything else are
    //      pooled". A rate borrowed from a pooled population must carry that population's severity
    //      mix, and that mix is dominated by things that are not a torn anything.
    //   4. THE RULES ARE WRITTEN AROUND HER PLAYING THE FOLLOWING WEEK. WTA §IV.C.1 is an entire
    //      clause about the player who retires and is entered next week – examined here, form
    //      submitted there, examined again on arrival – and the ITF junior certificate
    //      (CoC §III.B.2.b) is scoped by DEFAULT to "the following week's" tournament, with §III.B.2.c
    //      as the extension for anything longer. Rulebooks do not spend paragraphs on the exception.
    //
    // THE TABLE, BAND BY BAND, AND WHY EACH IS WHERE IT IS:
    //
    //   minor 60% -> 80%, still 1-2 weeks. The modal mid-match stoppage is cramp, heat or a tweak
    //     that settles, and a 1-week layoff in this engine is exactly "she plays the following week"
    //     (`rollInjury` clears at step 1c of the next tick, before she is asked to enter anything).
    //     Four in five, because that is what "the normal case, but not the only one" looks like.
    //   moderate 30% -> 15%, and 3-6 -> 3-5 weeks. A spent body moves badly and does pull things, so
    //     this must survive – but as the minority, not as a third of them. The CEILING comes down one
    //     week because six is the owner's own number: a six-week layoff is an acute event, and acute
    //     events belong to the band below.
    //   major 7.5% -> 4%, LENGTH UNCHANGED at 8-14. And that is the line this table draws: minor and
    //     moderate are the EXHAUSTION outcomes and their lengths follow the mechanism, but major and
    //     severe are the ACCIDENT outcomes – the body genuinely broke – and a stress reaction does
    //     not heal faster because it happened at 5-5 in the third. What changes above moderate is how
    //     OFTEN you get there, never what it costs when you do.
    //   severe 2.5% -> 1%, LENGTH UNCHANGED at 16-22. KEPT DELIBERATELY, and it is what stops this
    //     fix going too far in the other direction. The retirement copy has a sentence only this band
    //     reaches – "She stopped, and this time it is serious: … The dream takes a hit." – and a
    //     retirement must be able to be the moment a career changes. At ~0.73 retirements a season
    //     that is roughly one career in fourteen over ten seasons: rare enough to be a story, on the
    //     same standard `ENDINGS.injuryPriorWeeksOut` was measured to (4.4% of full-life careers).
    //
    // ⚠ ZERO DRAWS ADDED OR REMOVED, WHICH IS WHY NO CAREER RE-BASES. `onsetInjury` spends exactly
    // three pulls in exactly one order – severity, weeks-out, region – and this changes only the
    // NUMBERS the second and third are compared against. `pickInt` takes one pull for any range
    // (a collapsed range still draws) and `drawBodyRegionFrom` takes one for any table. So the
    // `seed:retire:<week>` and `seed:injury:<week>` sequences are byte-identical to before, and the
    // frozen MAIN capture (41550 / e6b0c709) never saw either.
    //
    // ⚠ AND THE FOUR SEVERITY LABELS ARE THE SAME FOUR. `InjurySeverity` is untouched, so
    // `SEVERITY_DESCRIPTOR`, `onsetCostCents`, the snapshot, the dialog and every persisted
    // `injuryHistory` row keep their vocabulary. NO SCHEMA CHANGE.
    retirementSeverityBands: [
      { cum: 0.8, severity: 'minor', weeksLo: 1, weeksHi: 2 },
      { cum: 0.95, severity: 'moderate', weeksLo: 3, weeksHi: 5 },
      { cum: 0.99, severity: 'major', weeksLo: 8, weeksHi: 14 },
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
  // Counted birthday-to-birthday in the real rule. The game keeps the 52-week SEASON BLOCK as the
  // window – one allowance, reset at the season boundary, which is what the copy promises and what
  // `seasonStartWeek` already defines – and reads the LIMIT off the age she actually is in the week
  // of the event (`kidAgeAt`, world/age.ts).
  //
  // ⚠ THOSE TWO USED TO BE THE SAME SENTENCE AND ARE NOT ANY MORE. This note said the block "IS the
  // real rule's birthday year, because `ageAtWeek` and `seasonStartWeek` are the same arithmetic",
  // which held only for a girl born in the first week of January: everyone else's birthday falls
  // inside a block. Since the one-clock ruling (09.08) the window and the birthday are two facts, and
  // the visible consequence is that her allowance can RISE mid-season on her birthday and never
  // falls – see entryCaps.ts for why that direction is the safe one.
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
    // ⚠ AND SINCE §4.1 THE SAME IS NOW TRUE AT THE TOP: ages above 18 never reach this table
    // either, because `maxAgeYears = 18` on the same three rungs refuses them first. So `default`
    // is exactly the 17-18 row it was always meant to be, rather than an open-ended "17+" that
    // quietly also answered for a twenty-five-year-old. The table's domain and the tiers' age
    // window are now the same interval, which is what makes the `default` key honest.
    //
    // ⚠⚠ THE MERIT INCREASES SHIP AT P2 (16.08), AND THE ARGUMENT THAT KEPT THEM OUT IS RECORDED
    // RATHER THAN DELETED, BECAUSE THE BLOCKER IT NAMED WAS REAL AND WAS REMOVED BY SOMETHING ELSE.
    // It ran: "NOT MODELLED, DELIBERATELY – the merit increases. The same appendix grants +4 events
    // to a top-20 ITF junior at 14/15 (+4 to a top-50 at 13), and the WTA rulebook grants a year-end
    // top-5 junior up to 4 extra PRO events. Both are keyed to a world ranking; our field is 199
    // cohort players plus the kid, so 'top 20 of the ITF' has no defensible mapping onto 'top 20 of
    // 200' without an owner decision about what our standings represent. Left out rather than
    // guessed, and left out in the direction that keeps the cap honest (a bonus only weakens it)."
    //
    // WHAT CHANGED IS THAT P1 ANSWERED THE QUESTION, AND ANSWERED IT SOMEWHERE ELSE.
    // `docs/specs/junior-access-2026-08.md` built `yearEndJuniorRank` – a read of PERSISTED history,
    // not a live fold – and keyed the Junior Accelerator on the regulation's own ABSOLUTE rows
    // (1 / 2 / 3 / 4-5 / 6-10 / 11-20) rather than on a share of our table. So the decision the old
    // comment was waiting for has been taken and shipped: in this game a year-end junior rank IS read
    // as the list position the rulebooks name. The merit rows below read the SAME function on the
    // SAME convention; inventing a second mapping here is exactly what that would have been.
    //
    // ⚠ AND THE ONE PLACE THE CONVENTIONS DIFFER IS STATED, NOT SMOOTHED OVER. `JUNIOR_RESERVED`
    // (world/entryCaps.ts) resolves W15's door as a FRACTION of the table, because that door had a
    // shipped difficulty to hold and a rank-vs-points change of unit to survive. A merit bonus has
    // neither: it is additive, it can only ever be generous, and it is the same list the Accelerator
    // reads two lines up. Absolute is the honest reading for it.
    meritIncrease: {
      /** ITF Appendix F: +4 international events to a top-50 junior at 13, to a top-20 at 14 and 15.
       *
       *  ⚠ THE 13 ROW CANNOT FIRE IN THIS GAME AND IS HERE ANYWAY, exactly as the 14/15 PRO rows are
       *  (see `proPerYearByAge`'s own note). Her thirteenth year runs from week 0 to her birthday, so
       *  no season has wrapped yet and there is no year-end list to be on. The game does not invent a
       *  number where the calendar makes it unreachable, and the day a career opens earlier the row is
       *  already right. */
      juniorByAge: { 13: { throughRank: 50, extra: 4 }, 14: { throughRank: 20, extra: 4 }, 15: { throughRank: 20, extra: 4 } } as {
        [age: number]: { throughRank: number; extra: number }
      },
      /** WTA Pro Path: up to 4 extra professional events a year, earned by Grand Slam / WTA 1000
       *  DIRECT ACCEPTANCE or by year-end ITF junior top 5 – the same top-5 gate the Accelerator uses.
       *  It is an OR, and both arms are read off the year-end row for the reason `proMerit` explains:
       *  a limit that can fall mid-window would retro-invalidate an entry she was allowed to make. */
      proExtra: 4,
      proJuniorThroughRank: 5,
      /** ...and the professional arm, as the rungs whose acceptance list IS "direct acceptance to a
       *  major or a 1000". Read as tier ids, never as a copied number, so a phase that re-tunes those
       *  cuts moves this rule with them – the same discipline `mandatory.perEventTiers` is under. */
      proDirectTiers: ['slam', 'wta1000'] as readonly TierId[],
    },

    /** ⭐ THE SUB-CAP INSIDE THE FOURTEEN-YEAR-OLD'S EIGHT (WTA §X.A.2, quoted in
     *  docs/specs/acceptance-cuts-2026-08.md line 145: *"the WTA's sub-cap of three W75+ events
     *  inside a 14-year-old's eight – a quota, not a door"*).
     *
     *  ⚠ IT CANNOT BIND AT THE SHIPPED CONSTANTS, AND IT SHIPS ANYWAY – the same choice, for the same
     *  reason, that put 14 and 15 in `proPerYearByAge` and 13 in `meritIncrease.juniorByAge`. W75
     *  opens at 17 and no W rung above W15 opens below 16, so a fourteen-year-old can reach exactly
     *  one professional rung and it is far below the ceiling this counts. The rule is here so that a
     *  phase which opens a rung lower does not have to remember it, and so that the game states the
     *  regulation it models rather than a subset of it. §5 of the spec measures the zero.
     *
     *  `fromTier` is a rung, not a list: "at or above W75" is a walk of TIER_LADDER, so a re-ordered
     *  or inserted rung moves with it. */
    proSubCapByAge: { 14: { fromTier: 'w75' as TierId, max: 3 } } as {
      [age: number]: { fromTier: TierId; max: number }
    },
    perYearByAge: { 13: 10, 14: 14, 15: 18, 16: 25, default: Number.MAX_SAFE_INTEGER } as {
      [age: number]: number
      default: number
    },

    // --- THE PRO AER, PARALLEL AND NEVER MERGED (W2-LADDER §5) --------------------------------
    //
    // The WTA's own age-eligibility rule - the Capriati rule, which exists for exactly our story -
    // gets the PARALLEL structure to the junior cap above: its own capped family, its own age
    // table, its own persisted ledger (`WorldState.proEntryWeeks`, schema v36). The two are never
    // merged because the real rules are two rules: research §4 is explicit that the professional
    // age caps are "separate from and additional to the junior caps", so a sixteen-year-old holds
    // BOTH allowances at once - 25 junior entries AND 12 professional ones - and spending one
    // never touches the other.
    //
    // THE FAMILY is every W rung (the WTA counts professional events, whatever their size); the
    // domestic ladder stays uncapped here for the same reason it is uncapped above - it is ours.
    // ⚠ AND THE ACT-3 RUNGS JOIN IT (W3-ACT2). "Professional events, whatever their size" is the
    // rule's own wording, and a Grand Slam is the most professional event there is - the real AER
    // counts a major against a sixteen-year-old's twelve exactly as it counts a W15. ⚠ THE PARENTHESIS
    // HERE USED TO READ "every act-3 rung opens at 17" AND IT NO LONGER DOES: the owner's age-grid
    // ruling of 16.08 put the four WTA rungs at 15 and the Slam at 14, so the family is capped from
    // fourteen upward and `proPerYearByAge` is the only thing metering it. In practice it still bites
    // for about one season, because the allowance is unlimited from 18 and an acceptance list at
    // #200 or tighter is what a child actually meets up here – the honest amount: the rule is about
    // children, and by the time her ranking clears a 1000's list she is not one.
    cappedProTiers: ['w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam'] as readonly TierId[],
    // The spec's design table (§5): 16 -> 12, 17 -> 16, 18+ unlimited.
    //
    // ⚠⚠ 14 -> 8 AND 15 -> 10 ARE HERE SINCE THE ONE-CLOCK RULING (owner 1, 09.08), AND THE
    // ARGUMENT THAT KEPT THEM OUT IS WORTH KEEPING RATHER THAN DELETING. It ran: "14 and 15 carry 8
    // and 10 in the real rulebook (research §4) and are DELIBERATELY absent here: every W rung's
    // `minAgeYears` is 16+, so availabilityStatus refuses a fourteen-year-old on AGE before the cap
    // is ever consulted - the same 'the age gate is the honest place for not eligible' argument the
    // junior table's note makes about 12-and-under. A rung that ever opens at 14 (the real W15 does,
    // via junior-reserved places) must bring those rows with it."
    //
    // THE ARGUMENT WAS FALSE FOR EVERY GIRL BORN AFTER JUNE, and the reason is the defect the ruling
    // fixes: the gate was asking `ageAtWeek` - the BAND - so a fifteen-year-old born in March was
    // "16" from week 104, the age gate let her through, and the AER then had no row to refuse her
    // with. She entered W15s at 15.83 against an allowance of `default`, i.e. unlimited. Both halves
    // are mended: the gate reads HER age now (world/age.ts), and the table covers the ages a girl can
    // be, so `default` - a rule about adults - can never answer for a child again. The rows are the
    // rulebook's own (research/real-ladder-pace.md: <14 = 0, 14 = 8, 15 = 10, 16 = 12, 17 = 16, 18+
    // unlimited), so the game does not invent a number even where the gate makes it unreachable.
    //
    // ⚠ AND 13 IS DELIBERATELY NOT A ROW, THOUGH THE RULEBOOK HAS ONE (0 events). Two reasons, and
    // the second is a trap. (a) "Not eligible at all" belongs in the age gate, exactly as the junior
    // table's note says of 12-and-under - a 0 in an allowance table is a rule pretending to be a
    // budget. (b) A limit of 0 makes `remaining <= 0` TRUE for a thirteen-year-old who has entered
    // nothing, and `tierOutgrown` (world/ladder.ts) reads precisely that expression to re-open the
    // rungs below her when her pro allowance is spent - so a 13 row would silently disable the
    // ladder's ceiling for the whole first season of every career except a January one. Named here
    // rather than discovered later.
    //
    // NOT MODELLED, DELIBERATELY - the merited increases (a year-end top-5 junior earns up to 4
    // extra pro events). Same ruling as the junior table's: keyed to a world ranking ours cannot
    // honestly map, and the spec names it phase 2 or act 3 ("v1 ships the flat table if the bench
    // says it already paces well" - the boredom-guard receipt in tools/boredom-guard.ts is that
    // bench).
    proPerYearByAge: { 14: 8, 15: 10, 16: 12, 17: 16, default: Number.MAX_SAFE_INTEGER } as {
      [age: number]: number
      default: number
    },
  },

  // --- THE MANDATORY REGIME (W3-ACT2, act2-pro-tour.md §6 — the owner's spec as canon) ----------
  //
  // «10 штрафных очков за 52 недели -> отстранение на 4 недели. Источники: пропуск обязательного
  // турнира, поздний отказ, неявка. Обязательные турниры только для топ-50: 4 Шлема, 1000-ки, шесть
  // 500-к.» Verbatim, and every number below is either that sentence or the one adaptation the
  // sentence itself authorises ("counts adapted to our calendar grid in act 3").
  //
  // ⚠⚠ THE TOUR PUNISHES; THE GAME NEVER DOES. The owner's standing ruling — «мы ни за что не
  // наказываем» — is not softened by this block, it is what SHAPES it, and it lands as four
  // structural rules rather than as a tone of voice:
  //   1. EVERY OBLIGATION IS ANNOUNCED BEFORE IT CAN BITE. The desk writes when the entry deadline
  //      of a mandatory event passes with her not on the list, one week before the week itself, so
  //      the letter is a warning and not a receipt. The entry-lifecycle letters W2-LADDER shipped
  //      are the pattern and this is the same surface.
  //   2. AN OBLIGATION SHE COULD NOT MEET IS NOT AN OBLIGATION. It binds only if she was actually
  //      able to enter — inside the acceptance list, old enough, not injured, not already committed
  //      to that week and not suspended. See `mandatoryBinds`: the tour's real rule excuses a
  //      medical withdrawal, and a rule the game manufactured out of a condition floor would be a
  //      punishment nobody chose.
  //   3. THE PRICE IS ALWAYS NAMEABLE. Each source has its own number and the refusal quotes it, so
  //      a penalty reads like a bill and never like a verdict.
  //   4. NOTHING IS RETROACTIVE. The ledger is a rolling 52 weeks, so points age out on their own.
  mandatory: {
    /** WHO IS BOUND. The spec's own number: top-50 only, and it is the real regime's own gate.
     *  Read against the MERGED W table, which is the table these rungs' acceptance lists are in. */
    maxRank: 50,
    /** THE PER-EVENT OBLIGATIONS: every Slam and every 1000, exactly as the spec names them. Both
     *  families are ANCHORED (`TierDef.anchorWeeks`), which is what makes an obligation announceable
     *  a year ahead — a player can see in January which weeks she owes the tour. */
    perEventTiers: ['slam', 'wta1000'] as readonly TierId[],
    /** ...AND THE 500s ARE A QUOTA, WHICH IS THE REAL RULE'S OWN SHAPE. The tour does not name six
     *  particular 500s; it asks a top-50 player to COMMIT to six of them and lets her pick. So this
     *  is checked once, at the season boundary, against how many she actually played — which is
     *  also the only reading that leaves her a decision (six of our ten) rather than a timetable. */
    quotaTier: 'wta500' as TierId,
    /** SIX, THE SPEC'S OWN NUMBER, against a pool of ten. The real regime is six of ~sixteen; our
     *  grid holds ten 500s (`TIERS.wta500.anchorWeeks`), so keeping six preserves the NUMBER the
     *  owner wrote while the ratio tightens — the adaptation his own parenthesis authorises, stated
     *  rather than smuggled. If the measured season cannot carry it, that is a finding for him and
     *  not a knob to turn quietly: the derivation-faithful alternative is 4 (six of sixteen scaled
     *  to ten), and it is written down here so the choice is visible. */
    quota: 6,
    /** WHAT EACH SOURCE COSTS, and they are ordered by how much the tournament lost by it — which is
     *  the only ordering that is about the TOUR rather than about her. Skipping an event nobody was
     *  promised she would play costs least; withdrawing after the list closed leaves a hole in a
     *  published draw; not turning up at all leaves the hole AND an empty court. */
    skipPoints: 2,
    lateWithdrawalPoints: 3,
    noShowPoints: 4,
    /** ...and one point per event of the 500 quota she fell short by, settled once a season. It is
     *  the gentlest source on purpose: it is the one obligation she was allowed to plan around. */
    quotaShortfallPoints: 1,
    /** THE SPEC'S OWN PAIR: ten points inside a rolling 52 weeks, and a four-week suspension. */
    suspensionAt: 10,
    suspensionWeeks: 4,
    /** The rolling window the ten are counted in — the same 52 every other rolling record in this
     *  game keeps (the ranking window, the entry-letter prune, the results ledger). */
    windowWeeks: 52,
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

  // --- THE MASSEUR (travelling team step 1, docs/specs/the-masseur-2026-08.md) -------------------
  // A salaried person, pro-career gated, hired/fired like the coach. DISTINCT FROM THE PHYSIO
  // ABOVE, and the distinction is the design: the physio is a coach-bundled clinic SERVICE whose
  // work is prevention (tau, and the layoff dealt at onset); the masseur is RECOVERY THE PLAYER
  // WATCHES – he works the layoff she is already in and the week-to-week body. See
  // src/engine/world/masseur.ts for the whole argument.
  masseur: {
    // ⭐ STEP 2 RE-CUT THE CONTRACT INTO A DIAL (owner, round 24: «а не слишком ли дешево это для
    // специалиста?… может быть добавлять настройки сколько раз в неделю он дает свои услуги»). The
    // step-1 flat $150/wk was half the middle coach's weekly bill and the owner read it right: at
    // his own real-world friendly rate ($50/h) it buys THREE hours, and a professional's body work
    // is not three hours. The honest recalibration is RELATIVE, inside the game's own scale:
    //
    //   * a SESSION is priced at the top of the middle coach's 17-22 hourly band ($48-72/h,
    //     `coach.hourlyRateCents`) – a specialist's hour, not a friendly visit;
    //   * the rungs below make the WEEK read against the staff the game already sells: 2×$75 =
    //     $150/wk (step 1's own number, surviving as the entry rung), 4×$75 = $300/wk (the middle
    //     coach's whole weekly bill – «a professional on retainer»), 7×$75 = $525/wk (between the
    //     high coach's $500 and the elite's $800 – the full-time body man; ≈$27k/yr, beside the
    //     owner's own «+2 специалиста это ещё +46к» sketch).
    //
    // STILL A FLAT CONTRACT PER RUNG: no corridor, no jitter, no draw – the rung is chosen, the
    // bill is flat per rung, and the ledger row is the number on the card (step 1's legibility
    // argument, moved one level up).
    perSessionCents: 75_00,
    // THE DIAL – how many times a week the table is hers, the owner's own idea. Three rungs, and
    // each must MEASURABLY beat the one below or the dial is decoration (the plan's §4 law); the
    // bench table in docs/specs/the-masseur-2026-08.md carries every cell.
    //
    //   * rehabExtraEveryNWeeks: every Nth week of an ACTIVE layoff the hands take one extra week
    //     off it (deterministic, off week − sinceWeek; see rollInjury). N=3 was measured in step 1
    //     at the EDGE of season noise (-1.7 ± sd 8) – acceptable as the CHEAP rung of a dial, a
    //     named failure as the only effect of a flat contract. N=2 is step 1's shipped-and-measured
    //     arm (-2.3..-2.5 weeks/career). N=1 halves a long layoff, which is what daily hands are
    //     for. A 1-2 week niggle gains nothing at ANY rung (the totalWeeks > 2 guard in
    //     rollInjury) – honest: nobody massages a one-week soreness away.
    //   * conditionBonusPerWeek: the at-home table, on top of the physio's own +1, on the weeks she
    //     is NOT away at a tournament (the away weeks are the travel stance's business below).
    //     ⭐ +1/+2/+3 SINCE THE OWNER'S 22.08 RULING – the shipped +1/+1/+2 had a measured flaw the
    //     dial's own §4 law forbids: rungs 1 and 2 were INDISTINGUISHABLE on any week without an
    //     injury (same bonus, and the cadence only separates them inside a layoff), i.e. the $150
    //     step from «twice a week» to «every other day» bought nothing a healthy player could
    //     read. The ladder now steps by exactly one point per rung. The physio note's hair trigger
    //     («at 2 the retainer alone erased every policy difference») was about the UNPRICED
    //     retainer bonus on every profile; these rungs are priced $150/$300/$525 a week and land
    //     in the pro phase, whose base dropped to 5 in the same wave – the combined grid in
    //     docs/specs/the-masseur-2026-08.md §11 measures the whole stack together.
    rungs: [
      { sessions: 2, label: 'Twice a week', rehabExtraEveryNWeeks: 3, conditionBonusPerWeek: 1 },
      { sessions: 4, label: 'Every other day', rehabExtraEveryNWeeks: 2, conditionBonusPerWeek: 2 },
      { sessions: 7, label: 'Daily', rehabExtraEveryNWeeks: 1, conditionBonusPerWeek: 3 },
    ],
    // What a fresh hire (and every pre-v59 save) stands on: the middle rung – the professional
    // default the pricing above is anchored to. A LITERAL 4 in the v59 migration, by the house
    // rule; keep the two in step.
    defaultSessions: 4,
    // ⭐ WHAT THE FARE BUYS (step 2, the owner's «влияет ли он на восстановление на глубоких
    // играх»): when the masseur TRAVELS to a tournament (fare paid, `pendingTournament.masseurThere`),
    // the run's strain at finalize is relieved by this much PER NIGHT BETWEEN ROUNDS – i.e. ×
    // (matches − 1), capped at the strain itself. Scales with DEPTH by construction: a first-round
    // exit has no nights between rounds and buys nothing, a title week has the most – which is
    // literally the owner's question answered. Zero draws; the knob is read post-strain.
    //
    // ⚠ 1-vs-2 WAS MEASURED ON THE OWNER'S OWN QUESTION («+2 за каждый круг не многовато?») and 2
    // STAYS – the combined grid's relief arms (docs/specs/the-masseur-2026-08.md §11): at 1/round
    // the tour condition channel survives at half size but the deep-run WINS channel drops under
    // 2 SEM everywhere (8k +8.2±2.3 -> +4.7±2.6) and the 8k prize delta goes to noise – the fare
    // would buy a number the player cannot feel, the decorative-staff failure again.
    tourRecoveryPerRound: 2,
    // ⭐ THE RETURN-WEEK SESSION (owner 22.08: «довесить послетурнирное восстановление 1 сеанс
    // массажа по возвращении»): when he was NOT flown to a tournament, the first non-played week
    // after it pays one extra session's worth of recovery on top of the ordinary week – the home
    // table working the trip out of her legs. Small and legible on purpose: it is one session, not
    // a second tour-relief channel, and it prints its own receipt (`resolveMasseurReturn`).
    returnSessionBonus: 1,
  },

  // --- Season planner: family vacations (spec §2, owner-approved 25.07) -------------------
  // ONE shared catalogue; money is the only gate. A vacation week is a hard blackout (nothing
  // enterable) that pays a condition gain on top of a FREE week's recovery, and the two top
  // packages carry an injury-tau buff for `buffWeeks` weeks (applied POST-draw, so the MAIN
  // stream stays byte-identical). Prices are middle-anchored bands × wealthCorridor, quoted
  // from the `seed:vacation:week:packageId` sub-stream. 1-week packages, bookable back-to-back
  // (2 weeks = deep reset at 2× price – owner approved).
  //
  // ⚠⚠ THE WHOLE TABLE WAS LIFTED 03.08 (W2-FATIGUE, docs/specs/fatigue-reprice-2026-08.md §4;
  // owner: «надо все приподнять»): 12/14/16/20/25/30 -> 18/22/26/32/40/48, prices untouched. It is
  // the same decision as `recoveryBase` and had to move in the same pass, because THIS TABLE IS
  // DENOMINATED IN REST WEEKS: at the new base of 8 the ladder reads 2.2 · 2.7 · 3.2 · 4.0 · 5.0 ·
  // 6.0 rest weeks, which is the shape the spec's §4 table specifies to the decimal. Left at
  // 12..30 against a base of 8 the ELITE week would have been worth less than four rest weeks and
  // the free one barely more than one, i.e. the whole ladder would have quietly become a rounding
  // error the season no longer needed.
  //
  // TWO PROPERTIES IT IS BUILT FOR, both of them tested rather than asserted:
  //   * THE FREE WEEK IS A REAL MID-SEASON TOOL. At 18 the staycation is worth over two rest weeks,
  //     so «в течение сезона она сможет брать мини отпуска на неделю иногда» is a move rather than
  //     a gesture - one week out after a hard block genuinely buys the block back.
  //   * MONEY BUYS RECOVERY SPEED, NOT RECOVERY. 18 -> 48 is the honest-economics thesis applied to
  //     the body: the elite week alone nearly closes a season's deficit and the free one does not.
  //     ⚠ AND THE WEALTH CORRIDOR MUST NEVER SCALE THE GAIN ITSELF - the same package restores the
  //     same condition for every family, exactly as prize money pays the same cheque (the rule
  //     act2-pro-tour.md §3 sets for money). It is true by construction: `resolveVacation` adds
  //     `pkg.conditionGain` flat and the corridor is applied ONLY in `vacationPriceCents`, which is
  //     the one thing about a holiday a family's means may decide. Pinned in tests/planner.test.ts
  //     P3 so it stays true by construction rather than by luck.
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
        // ⚠ 10, WAS 18 (owner ruling 12.08: «шифт-8 на всех: у первого будет восстановление +10,
        // у второго +18, у третьего и далее останется без изменений»). The bottom of the ladder
        // used to run 18/22/26 – four points between a FREE week at home and a paid one at
        // grandma's, so the free package was a near-perfect substitute for the paid rungs and the
        // picker's own "cheapest sufficient" rule recommended it almost always. The bottom now
        // steps by 8 (10 → 18 → 26): a paid vacation buys something a free one measurably does not.
        conditionGain: 10,
        buffFactor: 1,
      },
      {
        id: 'grandma',
        label: "Grandma's village",
        blurb: 'Two trains and a bus – slow food, slow days.',
        // ⚠ W7 PUT A FLOOR UNDER THIS ONE BAND, and only this one. The owner: «Grandma's village
        // регулярно стоит 0 или 3 доллара для 8к, мне кажется там можно какой-то порог цены
        // сделать, но можно и так оставить, в принципе.»
        //
        // HE IS DESCRIBING A REAL RATE, not a bad run. The band was `[0, 50_00]` and `corridorPrice`
        // draws `pickInt(rng, 0, 5000)` then scales by the wealth corridor, so a working family
        // ([0.7, 0.8]) was quoted $0.00-$40.00 uniformly: measured over 104,000 quotes, 1 in 78
        // rendered "$0", 1 in 37 rendered "$3", and 1 in 7 came in under five dollars. That is the
        // package quoting a week away for a family for less than a sandwich.
        //
        // ⚠ AND ZERO WAS NOT MERELY CHEAP, IT WAS A DIFFERENT OBJECT. `bookVacation` carves out the
        // free package twice - `if (priceCents > 0 && funds < priceCents)` skips the affordability
        // check, and `if (priceCents > 0)` skips the expense row - both correctly, for the
        // `staycation` rung that IS free by design. A grandma quote that happened to roll 0 fell
        // through both carve-outs: it was bookable at negative funds and it never appeared on the
        // Money screen's breakdown. The floor makes those two branches mean what they say again,
        // because the only package that can reach them is the one whose band is `[0, 0]`.
        //
        // THE NUMBER IS THE CATALOGUE'S OWN, NOT A TASTE. $30 is the floor of the practice-court
        // rental band a few blocks down this same file ($30-80 x corridor) - this economy's answer
        // to "the smallest thing this family knowingly pays for". A week at grandma's, which the
        // blurb prices as two trains and a bus, cannot honestly cost less than one hour on a
        // practice court. The CEILING is untouched at $50, so the floor compresses the band from
        // below rather than making the package dearer: a working family now sees $21-$40 where it
        // saw $0-$40, and the ladder reads free -> $21-40 -> $105-240 with no rung able to
        // impersonate the one below it.
        priceCents: [30_00, 50_00],
        // ⚠ 18, WAS 22 – the second half of the owner's 12.08 re-step (see staycation above). The
        // paid rung keeps a real edge over the free one (+8, was +4), and camping keeps the same
        // +8 edge over this. Third rung and up are untouched by the ruling.
        conditionGain: 18,
        buffFactor: 1,
      },
      {
        id: 'camping',
        label: 'Camping road-trip',
        blurb: 'Tent, lake, no racket in the car.',
        priceCents: [150_00, 300_00],
        conditionGain: 26,
        buffFactor: 1,
      },
      {
        id: 'seaside',
        label: 'Seaside family hotel',
        blurb: 'A real holiday – sea, sleep, sun.',
        priceCents: [600_00, 1000_00],
        conditionGain: 32,
        buffFactor: 1,
      },
      {
        id: 'resort',
        label: 'Sports recovery resort',
        blurb: 'Pool, physio, massage – rest with a programme.',
        priceCents: [1800_00, 3000_00],
        conditionGain: 40,
        buffFactor: 0.9,
      },
      {
        id: 'elite',
        label: 'Elite recovery programme',
        blurb: 'The clinic the pros use – she comes back new.',
        priceCents: [4000_00, 7000_00],
        conditionGain: 48,
        buffFactor: 0.85,
      },
      // ⭐⭐ ROUND 29 #5 – THE SEVENTH RUNG. docs/specs/the-shop-2026-08.md §3f, the owner's own
      // idea: «а неделя на яхте (при наличии яхты) вполне может стать новой строкой отпуска,
      // кстати».
      //
      // ⭐⭐ PART TWO #8 PUT IT ON THE GENERAL SHELF (29.08): «она же бесплатная только при наличии
      // яхты, верно? я могу сделать для нее отдельный арт, тогда можно просто на постоянку
      // добавить в ленту сначала с реальной стоимостью, а после покупки яхты это станет
      // бесплатным». So the band below is a real CHARTER price every family is quoted, and the
      // shelf's grant is what zeroes it (`freeOnceGranted` + `grantedVacationIds`, DELIVERED rungs
      // only) – §3f's «the money went years ago and the upkeep is charged every week whether she
      // sails or not» is still the whole reason the owner's quote is 0. A granted quote of 0 walks
      // `bookVacation`'s two zero-price carve-outs (affordable at negative funds, no expense row)
      // unchanged and correctly: nothing is charged, so nothing has to be afforded and there is no
      // row to write. ⚠ His art for the row is coming; until it lands `vacationArtUrl` returns
      // null and the sheet draws the row artless by its documented fallback.
      //
      // ⚠ #9's BAND IS x1.4 OF ELITE'S ([4000_00, 7000_00] -> [5600_00, 9800_00]) – HIS 29.08
      // FIGURE, VERIFIED AGAINST THE SPEC BEFORE USE because he asked rather than decreed
      // («изначально стоит дороже немного (х1.4 вроде мы считали, да?)»). §3f carries exactly one
      // 1.4 and it relates the SAME two objects – the yacht week against the elite programme
      // («about 1.4 elite vacations a week in upkeep») – and no other charter figure anywhere, so
      // his multiplier stands as the figure of record. A charter dearer than the clinic is also
      // the honest ladder: same gain, no injury buff, top of a strictly ascending price ladder
      // (tests/planner.test.ts pins both).
      //
      // ⚠⚠ 48 AND `buffFactor: 1` – THE TUNING QUESTION §3f NAMES, ANSWERED ON ITS FIRST ARM. Its
      // words: «Either it ties with elite and wins on being free, or it beats it slightly and elite
      // keeps a reason to exist that is not price», and its veto: «the yacht must NOT be the
      // strictly best rest week available – if it is, every owner takes it every time and the other
      // six packages die on the same day the yacht arrives.»
      //
      // It TIES with the elite programme on the gain (48, the top of the ladder – §3f's «at or above
      // elite» read at «at») and wins on being free FOR THE OWNER, and ELITE KEEPS THE INJURY BUFF:
      // `buffFactor` 0.85 against this one's 1, riding `buffWeeks: 4`. So the two are not comparable
      // on one axis and neither dominates – a family with a yacht still pays for the clinic in the
      // weeks it wants her tau bought down, which is the only thing money can do that a boat cannot.
      // ⚠ A NUMBER ABOVE 48 WOULD BREAK THAT: it would beat elite on the gain AND on the price, and
      // the buff alone is not a reason to pay $7,000 for a smaller reset. ⚠ AND #8's CHARTER MAKES
      // THE VETO HOLD FOR EVERYBODY ELSE TOO, for free: the boatless family sees the same 48 at a
      // DEARER price and a weaker after-effect, so the clinic keeps its reason on both sides of the
      // grant and the six packages survive the row appearing everywhere.
      {
        id: 'yacht-week',
        label: 'A week on the yacht',
        blurb: 'Nowhere to be, and the sea to be nowhere on.',
        priceCents: [5600_00, 9800_00],
        conditionGain: 48,
        buffFactor: 1,
        freeOnceGranted: true,
      },
    ] as VacationPackage[],
  },

  // --- Season planner: practice matches (spec §4) -----------------------------------------
  // A friendly on an empty week: court rental $30-80 × corridor off `seed:practice:week`, plus
  // an OPTIONAL coach. Effect: condition drain
  // max(1, local SCORELINE drain − 1) - the tier surcharge is subtracted out by name, see
  // resolvePractice - ZERO ranking points, and the week keeps the base
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
  /** ⭐⭐ THE SHELF (slice 1, docs/specs/the-shop-2026-08.md §3a/§3b/§3c). The parent's own money,
   *  and the first screen in this game where it is his to enjoy.
   *
   *  ⚠⚠ A CONSTANT AND NOT SAVE DATA, which is the whole reason it lives here (spec §5). Only what
   *  the family OWNS persists (`WorldState.assets`), so adding a rung – or the whole elite ladder of
   *  §3f – is a catalogue edit and not a migration. An owned row whose id has left this list is the
   *  one case that needs care, and `shopItem` returns undefined for it rather than throwing.
   *
   *  ⚠ `annualRateBps` IS SIGNED AND THE SIGN IS THE POINT. Negative is a thing that loses money,
   *  and §3b says why the game needs some: «THIS FAMILY EXISTS TO LOSE MONEY AND THAT IS THE POINT.
   *  If everything on the shelf appreciates, the shop is a savings account with pictures.» Basis
   *  points rather than a percentage so the table is integers all the way down; the fraction appears
   *  once, inside `assetValueCents`.
   *
   *  ⚠ SLICE 1 IS STATIC, AND «STATIC» MEANS DETERMINISTIC RATHER THAN FROZEN. Every value below is
   *  arithmetic on `boughtWeek` and draws NOTHING – no drift (§4, slice 2), no shock, no freeze. A
   *  car still loses its 9% a season, because otherwise acceptance §2e-1 («the ledger shows the loss
   *  to the cent») has no loss to show and the shelf teaches nothing. */
  shop: {
    /** ⭐ THE RUNGS, cheapest first – the order they are read in and the order they are shown in.
     *  `stake: 'open'` is a product you choose an amount for (at least `entryCents`); `'fixed'` is a
     *  thing with one price. That distinction is §3a's, not a convenience: a deposit with a $1,000
     *  MINIMUM and a car with a $60,000 PRICE are different objects, and modelling the deposit as a
     *  $1,000 thing you buy would make every investment on this shelf decorative the moment the
     *  family had real money. */
    catalogue: [
      {
        id: 'deposit',
        family: 'investment',
        stake: 'open',
        label: 'A savings deposit',
        blurb: 'The dull one – it will not lose money and it will not make much.',
        entryCents: 1_000_00,
        // ⭐⭐⭐ ROUND 29 PART TWO #3 – 200 → 317 BPS, AND IT IS HIS RULING, NOT A TUNING.
        //
        // «не вижу проблем сделать ставку 3.17% на Savings.»
        //
        // ⚠⚠ 3.17% IS NOT A NEW NUMBER – IT IS THE OLD ONE, MOVED. It is exactly what the current
        // account used to pay automatically every week (`ECONOMY.savings.apyWeekly: 0.0006`
        // annualised, deleted by round 29 #12 – the note where it stood is ~1,300 lines up in this
        // file). #12's own measurement is why he was asked: at 200 bps the deposit recovered only
        // **63%** of the wage it replaced, so the replacement was not a replacement. His earlier
        // ruling binds the two – «мы для этого делаем Savings как раз. Одни должны друг друга
        // заменить» – and a replacement that pays two thirds of what it replaced does not.
        //
        // ⚠ THE OTHER HALF OF THE GAP WAS NEVER THE RATE, and part two #6 closes it: the shelf was
        // SHUT in the junior years, which is the horizon where the removal bites cleanest. No rate
        // fixes a locked door; both were needed and both are his.
        //
        // ⚠ THE INDEX FUND IS UNTOUCHED at 700 bps. He named Savings, and #12's «the fund would
        // recover 221%» is exactly why widening this by hand would have been the tuning he did not
        // ask for. The fund's own under-pricing stands as round 29's ask 11b.
        annualRateBps: 317,
        // ⭐⭐ ROUND 30 #14 – A DEPOSIT IS HELD IN UNITS TOO, AND IT IS HIS OWN EXPECTATION, ROUND 29
        // #11: «Index fund хотелось бы иметь возможность докупать, предполагаю, что Savings deposit
        // будет вести себя так же – тоже надо исправить.» Adding to a holding and taking part of one
        // out is what `stake: 'open'` MEANS, and a holding you can do both to is a holding measured
        // in units. That is what let the rebase be deleted outright rather than kept for one rung.
        //
        // ⚠⚠ AND NOT ONE CENT OF THE DEPOSIT MOVED, WHICH IS ARITHMETIC AND NOT LUCK. With no
        // `volBps` this unit's price is `1000 × 1.0317^years` dead flat (`marketIndex` answers
        // exactly 1), and `units × price` is identically the `(basis + top-up) × (1+r)^t` the rebase
        // computed – rebasing at today's worth WAS the unit model, written the long way round. The
        // deposit's arm in `tests/round30-fund-units.test.ts` measures that equality rather than
        // trusting it.
        //
        // ⚠ $1,000 IS ITS OWN MINIMUM STAKE, chosen so the dullest rung on the shelf quotes the
        // roundest possible price. Nothing depends on the number: units are fractional, so a $1,000
        // opening stake buys exactly one and a $1,500 one buys one and a half.
        unitBaseCents: 1_000_00,
      },
      {
        id: 'index-fund',
        family: 'investment',
        stake: 'open',
        label: 'An index fund',
        // ⭐⭐ AND NOW IT MAY SAY IT – ROUND 29 PART THREE #16. The note that stood here said the
        // blurb «may not describe a movement the engine does not make», because §3a's index fund
        // «can be DOWN for a whole season and still be the right holding» and slice 1 had no drift.
        // The engine makes that movement as of this item, so the second sentence is now a true
        // description of the thing rather than a promise about it.
        blurb: 'A slice of the whole market. It will have bad years – it has never had a bad decade.',
        entryCents: 5_000_00,
        // ⭐⭐⭐ ROUND 29 PART THREE #16 – THE DRIFT, AND IT DID NOT MOVE.
        //
        // THE OWNER: «Механику фонда надо придумать, да, потому что безрисковые 3 против безрисковых
        // 7 это весьма странно. Давай подумаем как это можно сделать красиво и просто.»
        //
        // ⚠⚠ 700 IS NOW THE LONG-RUN FIGURE RATHER THAN THE WEEK'S, and that is the whole reason the
        // number is untouched. The market rides EITHER SIDE of this curve (`volBps` below); the
        // headline the shop card prints is where a holding ends up, not where it stands. Round 29
        // #12's «the fund would recover 221%» measurement and the 11b under-pricing question are
        // therefore still answered by exactly this number.
        annualRateBps: 700,
        // ⭐⭐⭐ ...AND THIS IS THE RISK. See `world/market.ts` for the path and `ShopItem.volBps` for
        // what the field means. 1,800 bps of log-volatility.
        //
        // ⚠⚠ 1,800 IS A CEILING BEFORE IT IS A TUNING, AND THE ARITHMETIC IS WHY. `marketWave` is
        // bounded in [-1, 1], so the worst the market can ever do to a holding is `e^(-2·vol)`, and
        // the fund beats the 3.17% deposit at ten years for EVERY seed and every entry week exactly
        // while `1.07^10 · e^(-2·vol) > 1.0317^10` – which solves to `vol < 1,824 bps`. Above that
        // the fund becomes a trap for a player who did not read carefully, and «мы ни за что не
        // наказываем» is house law. This sits just under the line, deliberately: it is the most risk
        // the design can carry and still be safe to hold.
        //
        // ⚠ AND IT IS ABOUT HALF A REAL INDEX'S VOLATILITY, which is a decision and not a mistake. A
        // true 17% is a random walk's number, and a walk would put roughly a quarter of ten-year
        // holdings behind the deposit.
        //
        // ⭐⭐⭐ THE CRASH LAYER RIDES ON TOP SINCE HIS EXTENSION OF 29.08 («например раз в 3-5 лет и
        // стартовый сезон уже может быть как раз с -20%») – a crisis every 2-6 years centered on
        // four, -15…-30% at the trough with a recovery arc, no grace period. The construction and
        // its own knobs live in `world/market.ts`; this rung participates because it has a volBps,
        // at full depth (a crisis is not a bigger wobble – the reasoning is at `marketIndex`).
        //
        // ⚙ MEASURED, `npx vite-node tools/market-probe.ts --seeds 4000` (29.08, crash layer IN),
        // 228,000 rolling seasons, 48,000 holdings per horizon, 16,000 crises:
        //
        //   crises            mean interval 4.01y (75.2% in his 3-5y band) · median depth −22.5%
        //   first-season fall 49.7% of careers («стартовый сезон» – exactly his ask)
        //   negative seasons  30.8%   (the wave alone was 19.9% – his crises are the difference;
        //                              the knob back toward one-in-four is THIS volBps, his call)
        //   worst season      −39.9%  (a deep crash landing on a bad wave year; sd 16.79%)
        //   beats the deposit 1y 57.15%  3y 84.03%  5y 86.75%  10y 98.90%
        //   ⚠⚠ the 10y tail   529 of 48,000 (1.10%) – EVERY one sold inside a crash arc; selling
        //                     in calm waters ten years is still universal (the two-tier bound,
        //                     `worstCrashFreeRatio` / `worstMarketRatio`), so «мы ни за что не
        //                     наказываем» reads: holding through a crisis costs nothing, only
        //                     selling into one can lose, at this measured rate. HIS number to
        //                     accept – docs/specs/the-shop-2026-08.md §14h puts it in front of him.
        //
        // The shape is the design: WHEN you sell matters, WHETHER you were right to hold does not.
        //
        // ⚠ PROVISIONAL BY HIS OWN FRAMING: «вроде посмотрел, давай сделаем, а я пощупаю и скажу
        // свои ощущения потом.» Move this one number and re-run the probe; nothing else has to move.
        //
        // ⭐⭐⭐ HE PLAYED IT AND MOVED IT – ROUND 30 #14, 1_800 -> ROUND30_VOL_BPS.
        //
        // «Волатильность индексного фонда какая-то очень большая по ощущениям +65/-15 это то, что я
        // видел… Во-первых она скорее всего будет менее "галопирующая", во-вторых вряд-ли в таких
        // крайностях.»
        //
        // ⚠ THE KNOB THE SPEC ALREADY NAMED FOR THIS, and §14h named the direction too: «If he wants
        // back toward one-in-four WITH crashes, the wave's volBps comes down – his call, one knob.»
        // It is his call and this is him making it. His crash band is UNTOUCHED: −15…−30% at the
        // trough is his own number from the day before and not mine to shave.
        //
        // ⚠⚠ HALVED, AND «HALF» IS THE RULING RATHER THAN A FITTED NUMBER. 1,800 -> 900 is a
        // sentence he can hold («half the wobble»); 1,050 or 875 would be a number nobody could
        // defend later. It lands the felt figure back where he approved it: 24.5% of seasons
        // negative – «roughly one year in four» – against 30.9% before, with a season sd of 15.0%
        // which is about a real index's own.
        //
        // ⚠ AND THE CEILING IS UNMOVED AND UNTOUCHED BY THIS: §14c's inequality caps `volBps` at
        // 1,824 for the ten-year calm-water guarantee, and coming DOWN can only widen the margin.
        //
        // ⚙ MEASURED, `npx vite-node tools/market-probe.ts --seeds 4000` (30.08) – see §14i.
        volBps: 900,
        // ⭐⭐⭐ ROUND 30 #14 – WHAT ONE UNIT COSTS AT THE START, and it is HIS anchor to the dollar:
        // «Зашёл, когда доля стоила 4к, через десять лет она может вполне удвоиться. Или зашёл на
        // пике при цене 7-8к.»
        //
        // ⚠ THE DOUBLING IS THE RATE AND NOT A SECOND CONSTANT. $4,000 at 700 bps is $7,869 after
        // ten years – «вполне удвоиться» – and it passes through his $7,000-8,000 peak band in the
        // ninth and tenth seasons of a career, which is where a family that has been earning long
        // enough to buy at a peak actually is. The market rides either side of that all the way.
        unitBaseCents: 4_000_00,
      },
      // ⚙ 26.08, the owner: «давай гэп сделаем скромнее пока что от 60 до 300к». A five-fold spread
      // rather than the twenty-two-fold one the first draft drew – from $60k to $300k every rung is
      // a real decision for a real career, and the ladder can always be extended upward later.
      //
      // ⭐⭐⭐ ROUND 30 #15 – AND NOW THEY COST SOMETHING TO KEEP, AND IT GROWS.
      //
      // THE OWNER, 30.08: «Для машин вполне можно ввести годовую стоимость обслуживания, которая
      // может с каждым годом немного расти, как в реальности, пока стоимость авто на рынке падает.»
      //
      // ⚠⚠ WHY THE CARS HAD NONE UNTIL NOW, because it was a decision rather than an omission: §3f's
      // «годовое обслуживание» table is written about the BOATS AND THE PLANES and quotes no car, so
      // round 29 #5 gave the cars none. §3b's own table gives them a price and a loss and stops.
      // This is the third column he has now asked for, and it lands on the family the spec left out.
      //
      // ⭐⭐ THE FOUR RATES ARE A REAL-WORLD LADDER AND NOT A MULTIPLE OF THE PRICE. Servicing,
      // insurance, tyres and tax on an ordinary estate run about a twentieth of what it cost; the
      // same list on a two-seater with carbon brakes and an annual major service runs nearly twice
      // that share, and the share is what climbs, not just the money. Fuel is excluded on purpose –
      // nothing in this game knows how far anybody drove, and a cost nobody can influence should not
      // be modelled as if they could.
      //
      //   the sensible estate   5.0%   $3,000/yr    $57.69/wk
      //   the good saloon       5.5%   $6,050/yr   $116.35/wk
      //   the one from poster   7.0%  $13,300/yr   $255.77/wk
      //   the unreasonable one  9.0%  $27,000/yr   $519.23/wk   <- about one elite coach
      //
      // ⚠ THE LAST ROW IS THE POINT OF THE LADDER, AND IT IS §3f's OWN DESIGN SENTENCE READ ONE
      // FAMILY DOWN: «the toys compete with the team for the same money». A $300,000 car costs
      // roughly what the best coach in the game costs, every week, for as long as it sits there.
      //
      // ⚠⚠ NOTHING HERE CAN STRAND A FAMILY, on §3f's own test: a car has NO build wait, so it is
      // sellable from the week it is bought – there is no week in which the family is paying for a
      // thing it cannot get out from under, which is the property the yacht's ten per cent was
      // measured against.
      //
      // ⭐ AND `upkeepGrowthBps` IS THE HALF THAT IS NEW TO THE SHELF: 6% a year, compounding on the
      // car's own age and capped at double (`ECONOMY.shop.upkeepGrowthCapX`). Beside a value falling
      // 6–15% a year it is the two curves he described – a car worth less every season and dearer
      // every season – and neither of them is a second rule: they are the same two fields every rung
      // on this shelf already carries, with an age put through them.
      {
        id: 'car-sensible',
        family: 'car',
        stake: 'fixed',
        label: 'The sensible estate',
        blurb: 'Five doors and a boot that takes the kit bags. Nobody looks at it twice.',
        entryCents: 60_000_00,
        annualRateBps: -600,
        upkeepBps: 500,
        upkeepGrowthBps: 600,
      },
      {
        id: 'car-good',
        family: 'car',
        stake: 'fixed',
        label: 'The good saloon',
        blurb: 'Quiet, quick, and quietly expensive the day it stops being new.',
        entryCents: 110_000_00,
        annualRateBps: -900,
        upkeepBps: 550,
        upkeepGrowthBps: 600,
      },
      {
        id: 'car-nineteen',
        family: 'car',
        stake: 'fixed',
        // ⚠ NOT «the one he wanted at nineteen», WHICH IS §3b's OWN LABEL AND CANNOT SHIP. R15-7 is a
        // house rule with a test behind it (tests/coach-voice.test.ts): no string a player can read
        // calls anybody «he». The spec's phrase is about the PARENT, whose gender this game has never
        // fixed – the player is «the parent», never a father – so the pronoun would have been the
        // engine deciding something the onboarding deliberately does not ask. The picture survives
        // the edit; only the assumption goes.
        label: 'The one from the poster',
        blurb: 'Two seats, no boot, and twenty-five years late.',
        entryCents: 190_000_00,
        annualRateBps: -1200,
        upkeepBps: 700,
        upkeepGrowthBps: 600,
      },
      {
        id: 'car-unreasonable',
        family: 'car',
        stake: 'fixed',
        label: 'The unreasonable one',
        blurb: 'No boot, no back seats, no defence for any of it.',
        entryCents: 300_000_00,
        annualRateBps: -1500,
        upkeepBps: 900,
        upkeepGrowthBps: 600,
      },
      // ⭐ §3c – THE FIRST RUNG MATTERS MOST: «the earliest seasons are measured in debt, and a
      // family that finally owns where it lives is a real milestone this game currently has no way
      // to mark.» Two tiers in slice 1; the absurd end of that ladder waits.
      //
      // ⚠⚠ THE TWO PRICES ARE MINE AND NOT THE SPEC'S – §3c gives tiers, a rent idea and no numbers
      // at all, so these are MEASURED rather than declared (CLAUDE.md invariant 4). See
      // `tools/shop-probe.ts`: on the nine bench presets the first rung must be out of reach while
      // the tennis still needs the money and reachable while it does not, which is the whole of
      // acceptance §2e-5. $240,000 clears the dearest car and lands after the turn; $520,000 is the
      // rung above it, at the same distance again.
      //
      // ⚠ AND +3% IS THE SLOWEST POSITIVE RATE ON THE SHELF ON PURPOSE. §3c's word is «slow»: a home
      // that out-earned the index fund would make property the correct answer to every question and
      // §0's warning – «assets never beat a career, they only survive one» – would be broken by the
      // one family that is largest. The rent a house can pay when it is not lived in is §3c's, and
      // it is not slice 1's: an income line is movement, and this slice has none.
      {
        id: 'house-first',
        family: 'house',
        stake: 'fixed',
        label: 'A place of their own',
        blurb: 'The end of renting. Small, theirs on paper, and hers to paint.',
        entryCents: 240_000_00,
        annualRateBps: 300,
      },
      {
        id: 'house-garden',
        family: 'house',
        stake: 'fixed',
        label: 'The house with the garden',
        blurb: 'Room for all of them, and a garden nobody has to share.',
        entryCents: 520_000_00,
        annualRateBps: 300,
      },
      // ⭐⭐ ROUND 29 #5 – THE ELITE (§3f), AND THEY ARE NOT BOUGHT, THEY ARE COMMISSIONED.
      //
      // THE OWNER: «Может что-то элитное добавить - яхты или самолеты? Со временем постройки около
      // реальным - купил и ждешь пока будет готово, яхты строят несколько лет.» And, on the shape:
      // «тоже можно разные тиры сделать, кстати и потерю стоимости в год + годовое обслуживание
      // (недельный кост, ага)».
      //
      // ⚠⚠ SO EACH ONE CARRIES THREE NUMBERS AND NOT ONE: what it cost (`entryCents`), what it loses
      // (`annualRateBps`, negative on every rung here) and what it takes every week to keep
      // (`upkeepBps`, an annual share of the PRICE – `assetUpkeepCents` divides it by the year).
      // Every figure below is §3f's own table, verbatim, including the build times.
      //
      // ⚠⚠ THE UPKEEP PERCENTAGES ARE THE REAL ONES AND THAT IS WHY THEY HURT (§3f). A yacht
      // genuinely costs about a tenth of its value a year to keep – crew, berth, fuel, survey,
      // insurance – and at $12M that is $23,076.92 a week, which is roughly thirty-eight coaches.
      // The number is not a punishment invented for balance; it is what the thing costs, and it is
      // the whole argument for owning one being a statement rather than an investment.
      //
      // ⚠ AND NOTHING HERE CAN STRAND A FAMILY, which is the house's «мы ни за что не наказываем»
      // checked against the largest bill in the game. The two states are disjoint by construction:
      // while it is BUILDING it cannot be sold and it charges NOTHING; the week it arrives the
      // upkeep starts and it becomes sellable the same week. There is no week in which the family
      // is paying for a thing it cannot get out from under.
      // ⭐⭐ ROUND 29 PART FOUR P7 – THE MERCH BRAND, the parent's FIRST business rung.
      //
      // THE OWNER (P4): «до академии можно запустить свой бренд одежды (мерча) – это может стать
      // хорошим шагом и подспорьем как в доходе, так и вообще добавить геймплея немного. А еще это
      // дешевле академии» – so it is CHEAP against the academy ($250,000 against $12,000,000, the
      // low hundreds of thousands, startable mid-career) and it EARNS: what it brings in each week
      // follows FAME – «мерч, растущий от частоты и обилия рекламных контрактов, съемок,
      // выступлений, титулов и прочего» – never rank. See ECONOMY.business.merch and
      // world/business.ts; the income lands in the till as its own 'business' line.
      //
      // ⚠ NO BUILD WAIT, NO UPKEEP AND RATE 0, the academy stages' own reading of §3g: the price
      // is the decision, the brand holds its value, and the income line – zero when nobody knows
      // her – is the whole mechanic. A negative week is unreachable by construction («мы ни за
      // что не наказываем»): fame is bounded at zero from below.
      {
        id: 'merch-brand',
        family: 'business',
        stake: 'fixed',
        label: 'The merch brand',
        blurb: 'Her name on shirts and bags. It sells while she is talked about.',
        entryCents: 250_000_00,
        annualRateBps: 0,
        // ⭐⭐⭐ ROUND 30 #9 – AND IT IS NOW WORTH WHAT A BUSINESS IS WORTH: years of its own income,
        // which is years of her fame. `annualRateBps: 0` above is left where it is and is now DEAD
        // for this rung – `assetWorthCents` branches on `earningsMultipleX` before it reaches the
        // rate – and it is kept rather than deleted because the type requires it and because zero is
        // the honest answer to «what rate does it drift at»: none, it is priced off earnings.
        //
        // ⚠⚠ THE RESEARCH GAVE A BAND AND NOT A NUMBER, AND SAYS SO
        // (docs/research/player-brands-and-what-they-are-worth.md §5.4): NO player-brand transaction
        // publishes both an earnings figure and a price. The two nearest are Beckham's DRJB – 55%
        // sold for ~$269M, implying ~$489M against FY2024 profit of $44.9M, so ~10.9x – and the
        // Nadal academy at ~€209M against €6.8M net profit, ~31x. HIS OWN REFERENCE, the RF mark,
        // has no published valuation at all: it sits in a private Swiss holding company (Tenro AG)
        // and On Holding's filings name it only in a risk factor, never in the financials. So this
        // figure is a CHOICE inside a wide, thin band and the measurement is what chose it.
        //
        // ⭐⭐⭐ ROUND 30 #23 – AND SINCE 30.08 IT IS THE *BASE* MULTIPLE AND NOT THE WHOLE ONE. The
        // career earns more on top of it: `world/brand.ts` adds seasons played, seasons ended
        // top-20, professional finals reached and her win rate, capped at
        // `ECONOMY.business.merch.value.maxX`. Everything the two paragraphs below say about SIZING
        // still holds – it is the same criterion measured against the same week – but the number a
        // given career is priced at is now a range and not this constant.
        //
        // ⚠⚠ WHY THE BASE LIVES HERE AND THE LADDER LIVES IN `ECONOMY.business.merch.value`: this
        // field is the PREDICATE («this rung is priced on its earnings» – `assetWorthCents` branches
        // on its presence and `tests/round30-brand-value.test.ts` holds the catalogue to exactly one
        // rung carrying it), so the number that says where that pricing STARTS belongs on the row the
        // shop actually sells. A copy in the constants block would be a second home for one fact.
        //
        // ⭐⭐ THE CRITERION IS «FAIR ON THE DAY THEY CAN AFFORD IT».
        // `tools/merch-fame-vs-rank.ts` walks 108 careers x 780 weeks and reads the fame a family
        // holds the first week its wallet can carry twice the $250,000 price. The brand has to be
        // worth about what it cost at the fame AND the career those families actually hold, so the
        // purchase is not a paper loss the week it is made – which is what a punishing multiple would
        // have made it, on the one rung whose whole pitch is «дешевле академии». Above that the
        // family gains; below it the family is down; and both directions are the item. ⚠ The
        // measurement that picked this base against the earned ladder is
        // docs/specs/brand-worth-and-income-2026-08.md.
        //
        // ⚠ AND IT FALLS DURING HER CAREER, which is the only fall the game is in frame for: fame
        // halves over 104 weeks and the income is CONVEX in it, so a year with no title costs the
        // brand more than a proportional share of its value. The floor under it is
        // `ECONOMY.shop.businessValueFloorShare`.
        earningsMultipleX: 14,
      },
      {
        id: 'boat-launch',
        family: 'boat',
        stake: 'fixed',
        label: 'The launch',
        blurb: 'Eight metres of teak and one good afternoon a week.',
        entryCents: 900_000_00,
        annualRateBps: -700,
        buildWeeks: 52,
        upkeepBps: 600,
      },
      // ⭐ ROUND 29 PART THREE P1 – THE MOTOR BOAT BECAME A SAILING YACHT, his ask verbatim:
      // «моторка $2.4М – давай переделаем на парусную яхту пожалуйста». He changed what it IS,
      // never what it costs: price, build weeks, annual loss and upkeep are the motor boat's own,
      // untouched. The id moved with the identity – the art hook is the id everywhere on this
      // shelf – and v66's migration renames owned rows in the same wave, so no save is stranded
      // on a rung the catalogue no longer carries.
      {
        id: 'boat-sail',
        family: 'boat',
        stake: 'fixed',
        label: 'The sailing yacht',
        blurb: 'Two cabins, a mast, and weekends that answer to the wind.',
        entryCents: 2_400_000_00,
        annualRateBps: -700,
        buildWeeks: 78,
        upkeepBps: 600,
      },
      // ⭐⭐ THE TWO THAT GRANT THE WEEK (§3f, and it is the owner's own idea): «а неделя на яхте
      // (при наличии яхты) вполне может стать новой строкой отпуска, кстати».
      //
      // ⚠ ONLY THESE TWO, AND THAT IS STILL THE NARROW READING OF «при наличии ЯХТЫ» ON PURPOSE –
      // re-argued at part three P1, because the sailing yacht above made the old sentence («the
      // spec calls neither of them a yacht») stop covering the shelf. The WEEK is a crewed week:
      // its own copy is a crew of six and nobody able to reach her, and the crew is what these two
      // rungs' 10% upkeep is buying – the «real ones» note above names it first. The launch and
      // the sailing yacht keep the boats' 6%: hull, berth and survey, nobody on the payroll. A
      // family that sails itself has a boat, not a holiday staff, so the sailing yacht grants
      // nothing – the grant reads what the upkeep pays for, never the word in the label. §11's own
      // acceptance – «a career orders a yacht, WAITS THREE YEARS» – is still this rung's build
      // time and not theirs.
      {
        id: 'yacht',
        family: 'boat',
        stake: 'fixed',
        label: 'The yacht',
        blurb: 'Crew of six, and a week of it is a week nobody can reach them.',
        entryCents: 12_000_000_00,
        annualRateBps: -500,
        buildWeeks: 156,
        upkeepBps: 1000,
        grantsVacationId: 'yacht-week',
      },
      {
        id: 'yacht-big',
        family: 'boat',
        stake: 'fixed',
        label: 'The big yacht',
        blurb: 'The one the harbour has to make room for.',
        entryCents: 28_000_000_00,
        annualRateBps: -500,
        buildWeeks: 208,
        upkeepBps: 1000,
        grantsVacationId: 'yacht-week',
      },
      // ⭐⭐ THE PLANE IS THE PARENTS', AND THE OWNER CORRECTED ME ON EXACTLY THAT (§3f): «Самолёт не
      // её, а родителей =) Теоретически может вполне резать косты на перелеты до соревнований,
      // почему бы и нет. По усталости по аналогии с кортом может 1 накинуть, не вижу причин не
      // делать, не такая большая величина».
      //
      // ⚠ BOTH EFFECTS RIDE ON THE FAMILY, not on the rung: a long-range plane costs more, loses
      // more and keeps for more, and it flies the same people to the same tournaments. The spec
      // gives the two aircraft three different numbers and one identical purpose, so inventing a
      // second, better cut for the dearer one would be a rule this file does not have.
      {
        id: 'plane',
        family: 'plane',
        stake: 'fixed',
        label: 'The plane',
        blurb: 'Eight seats and no airport that keeps them waiting.',
        entryCents: 18_000_000_00,
        annualRateBps: -600,
        buildWeeks: 104,
        upkeepBps: 800,
      },
      // ⚠ ROUND 29 PART FOUR P10 – RETIRED, HIS RULING: «значит убрать этот самолет за 38М и всех
      // делов =)». The reachability measurement (72 careers x 780 weeks, the round-29 ledger)
      // found 0 of 72 ever took DELIVERY of one – nobody could hold the rung, and he removed it
      // rather than resizing it. The entry stays as a tombstone so a save that somehow owns one is
      // not stranded: it is still valued by its own rate, still billed its upkeep and still sells;
      // `retired` is only what keeps it off the shelf and out of `buyAsset`.
      {
        id: 'plane-long',
        family: 'plane',
        stake: 'fixed',
        label: 'The long-range plane',
        blurb: 'Melbourne without stopping, and a bed on the way back.',
        entryCents: 38_000_000_00,
        annualRateBps: -600,
        buildWeeks: 156,
        upkeepBps: 800,
        retired: true,
      },
      // ⭐⭐ ROUND 29 #5 – HER ACADEMY (§3g), THE END OF THE MONEY.
      //
      // THE OWNER: «построить свою академию за много миллионов - тоже может быть интересно, кстати.
      // Как раз будет куда рекламное тратить.»
      //
      // ⚠⚠ FOUR STAGES IN THE SPEC'S OWN ORDER – «land, courts, the building, the staff» – AND THE
      // ORDER IS ENFORCED, not suggested: `requiresId` chains them, so a half-built academy is a
      // real state the player can sit in (§3g's own words) and courts cannot appear on land nobody
      // owns. That is why THIS family is the one exception to the catalogue's «cheapest first»: the
      // stages read in BUILD order, and the last one is not the dearest.
      //
      // ⚠⚠ THE FOUR PRICES ARE MINE AND NOT THE SPEC'S, exactly as the two house tiers were (§12b).
      // §3g gives a band – «Cost: $8–15M, in STAGES rather than one press» – and four stage names,
      // and stops. $2M + $3M + $4M + $3M = $12,000,000, the middle of his band, and each stage is a
      // real decision on its own rather than a step nobody notices.
      //
      // ⚠ NO BUILD WAIT AND NO UPKEEP, because §3g asks for neither and this file does not invent
      // what it was not given. §3f's «время постройки» and «годовое обслуживание» are said of the
      // boats and the planes; the academy's own sentence is «each stage is a decision and a bill»,
      // and a stage IS the wait. ⚠ AND IT NEITHER GAINS NOR LOSES (rate 0) for the same reason: §3g
      // calls it «the one asset that outlives the career» and gives it no rate.
      //
      // ⚠ THIS NOTE USED TO END «and the shelf says so in as many words («Holds its value»)» AND THAT
      // SENTENCE IS GONE FROM THE SHELF – round 30 #11, the owner: «Holds its value странно звучит –
      // это напрямую значит, что оно обесценивается, а это вроде бы не совсем так». The MECHANIC did
      // not move a cent (checked first: a rate-0 rung is worth what was paid for it forever and the
      // sale is whole), only the words. A comment naming a string that no longer exists is the one
      // way a comment must not be wrong, so it names the new one: **«Neither gains nor loses»**, said
      // of these four stages and of nothing else since the merch brand became a business (#9).
      {
        id: 'academy-land',
        family: 'academy',
        stake: 'fixed',
        label: 'The land',
        blurb: 'Twelve hectares outside town, and a name on the deeds.',
        entryCents: 2_000_000_00,
        annualRateBps: 0,
      },
      {
        id: 'academy-courts',
        family: 'academy',
        stake: 'fixed',
        label: 'The courts',
        blurb: 'Sixteen of them, and the lights that keep them open till nine.',
        entryCents: 3_000_000_00,
        annualRateBps: 0,
        requiresId: 'academy-land',
      },
      {
        id: 'academy-building',
        family: 'academy',
        stake: 'fixed',
        label: 'The clubhouse',
        blurb: 'Gym, kitchen, forty beds and somewhere to do the homework.',
        entryCents: 4_000_000_00,
        annualRateBps: 0,
        requiresId: 'academy-courts',
      },
      {
        id: 'academy-staff',
        family: 'academy',
        stake: 'fixed',
        label: 'The staff',
        blurb: 'Coaches, physios and the person who answers the telephone.',
        entryCents: 3_000_000_00,
        annualRateBps: 0,
        requiresId: 'academy-building',
      },
    ],
    /** ⭐⭐ ROUND 29 #5, §3f – WHAT THE FAMILY'S OWN PLANE TAKES OFF A FARE, as a share of it.
     *
     *  THE OWNER: «Теоретически может вполне резать косты на перелеты до соревнований, почему бы и
     *  нет.» ⚠ THE VERB IS «резать» AND NOT «убрать», and this number is that distinction made
     *  mechanical: the plane HALVES the family's travel bill, it does not delete it. Three reasons
     *  the share is a half rather than the whole fare, and the spec gives no figure at all:
     *
     *    1. a fare that fell to zero would take the travel LINE off the family's ledger, and a cost
     *       the player cannot find is this repo's own named defect (the academy's $20,879);
     *    2. flying your own aeroplane is not free – it is what `upkeepBps` above is charging for,
     *       and a plane that both zeroed the fare and billed the upkeep would be describing one
     *       journey twice;
     *    3. it is not a balance lever in either direction. A season of travel is four figures and
     *       this aircraft costs $27,692 A WEEK to keep, so the cut can never be the reason to buy
     *       one. §3f is explicit that owning these is «a statement rather than an investment».
     *
     *  ⚠ IT COMES OFF EVERY SEAT THE FAMILY PAYS FOR – hers, the coach's and the masseur's – because
     *  it is ONE AIRCRAFT carrying all of them. That does not touch the 15.08 ruling that support
     *  may not pay for the entourage: a scholarship is somebody else's money and this is the
     *  family's own. */
    planeTravelShare: 0.5,
    /** ⭐⭐ §3f – WHAT THE PLANE ADDS TO A WEEK SHE SPENDS TRAVELLING, in condition points.
     *
     *  THE OWNER: «По усталости по аналогии с кортом может 1 накинуть, не вижу причин не делать, не
     *  такая большая величина.»
     *
     *  ⚠⚠ IT IS HIDDEN, AND THAT IS HIS OWN RULING ON THE COURT IT IS AN ANALOGY OF: «верно, но
     *  только если знают об этом, я предложил сделать бонус скрытым». §3d rule 4 spells out what
     *  hidden means – «never a number on a card» – so no shelf row, no confirm dialog and no note
     *  anywhere states it. The effect is visible where every effect in this game is visible: in the
     *  condition line, over weeks.
     *
     *  ⚠ AND IT CANNOT STACK WITH THE COURT (§3d), by construction rather than by a cap: the court's
     *  +1 lands on weeks she is NOT competing and this one lands on weeks she IS. §3f: «No week can
     *  receive both, so a family owning everything gets a corridor that is one point kinder across
     *  the board – never two.» */
    planeTravelRestBonus: 1,
    /** ⭐⭐⭐ ROUND 30 #15 – THE CEILING ON A RISING UPKEEP, as a multiple of its first-year figure.
     *
     *  THE OWNER: «годовая стоимость обслуживания, которая может с каждым годом НЕМНОГО расти».
     *
     *  ⚠⚠ «НЕМНОГО» IS WHAT THIS NUMBER IS FOR. `upkeepGrowthBps` is 6% a year, which is a small
     *  step and a large product: unbounded, a car kept fifteen seasons would cost 2.4x its first
     *  year, and one kept longer would keep going. A bill that compounds without a stop is the
     *  shape «мы ни за что не наказываем» rules out – it turns a purchase the family made once
     *  into a debt that grows for as long as they keep it.
     *
     *  ⭐ AND IT IS THE SENTENCE A PLAYER CAN HOLD: **the bill can at most double.** 6% a year
     *  reaches it in the twelfth season of ownership, which is longer than any car in a fifteen-
     *  season career is realistically held, so the cap is the guarantee rather than the common case
     *  – it binds the tail and leaves the curve he asked for alone.
     *
     *  ⚠ IT BINDS THE MULTIPLIER AND NOT THE YEARS, deliberately: a cap in years would have to be
     *  re-derived every time the growth rate moved, and the promise would silently change with it. */
    upkeepGrowthCapX: 2,
    /** ⭐⭐⭐ ROUND 30 #9 – THE FLOOR UNDER A BUSINESS RUNG'S VALUE, as a share of what was paid.
     *
     *  ⚠⚠ IT IS THE MARK, AND IT IS A SOURCED IDEA RATHER THAN A KINDNESS. Björn Borg's own company
     *  went bankrupt in 1990; the NAME was licensed from 1997, bought outright for $18 million at the
     *  end of 2006 and is a Nasdaq Stockholm company doing SEK 1,044M today
     *  (docs/research/player-brands-and-what-they-are-worth.md §4d). A brand with no earnings left is
     *  not a brand with no value – somebody will buy the name.
     *
     *  ⭐ A QUARTER, so a family between reigns is meaningfully down and never wiped out: «мы ни за
     *  что не наказываем» read against a rung they CHOSE to buy, on a shelf whose own §3b law is
     *  «THIS FAMILY EXISTS TO LOSE MONEY AND THAT IS THE POINT». It is also the one thing that keeps
     *  a sale possible in the years she is quiet, which is what makes the decision to sell a real
     *  fork rather than a trap. */
    businessValueFloorShare: 0.25,
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
 *  (spec §2). Quoted at offer time, charged on booking – same function, same number.
 *
 *  ⭐ ROUND 29 PART TWO #8 – `grantedIds` IS THE SHELF'S GRANT (`Snapshot.shop.vacationIds` on a
 *  screen, `grantedVacationIds(world)` in the engine): a `freeOnceGranted` package the family has
 *  earned is quoted 0 – «после покупки яхты это станет бесплатным» – and the sub-stream is not
 *  even derived for it, which no caller can observe (sub-streams persist nothing and are re-keyed
 *  per call; the world's dice cannot see any of this either way).
 *
 *  ⚠ THE DEFAULT IS THE CONSERVATIVE ARM, on `recommendVacationPackage.grantedIds`' own argument:
 *  a caller that does not know about the shelf quotes the price every family pays. It can only
 *  OVERSTATE – the booking itself always passes the world's own list, so a forgetful screen shows
 *  a price and the engine charges less, never the reverse. */
export function vacationPriceCents(
  seed: string,
  week: number,
  packageId: string,
  background: FamilyBackground,
  grantedIds: readonly string[] = [],
): number {
  const pkg = vacationPackage(packageId)
  if (!pkg) throw new Error(`Unknown vacation package "${packageId}"`)
  if (pkg.freeOnceGranted && grantedIds.includes(packageId)) return 0
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
  /** ⭐ ROUND 29 #5 -> PART TWO #8 – the packages the shelf has made FREE for this family
   *  (`Snapshot.shop.vacationIds`). Since #8 every package is on every family's shelf, so this no
   *  longer widens the LIST – it re-prices it: a granted `freeOnceGranted` package is weighed at 0,
   *  which is what lets the pick name the owner's free week over a paid one. ⚠ DEFAULTS TO NONE,
   *  and the default is the conservative one: a caller that does not know about the shelf weighs
   *  the yacht week at the charter price every family pays, and can only over-charge the
   *  recommendation, never under-charge the booking. */
  grantedIds?: string[]
}): string | null {
  const cap = Math.min(input.fundsCents, input.budgetCents ?? input.fundsCents)
  const target = input.targetCondition ?? ECONOMY.practice.rescueTargetCondition
  const granted = input.grantedIds ?? []
  // ⚠ PART TWO #8 – the grantedOnly FILTER that stood here is gone rather than inverted: every
  // package is on the general shelf now, and the grant lives in the PRICE (a granted week weighs
  // 0, exactly what the sheet quotes for it).
  const priced = ECONOMY.vacation.packages
    .map((pkg) => ({ pkg, priceCents: vacationPriceCents(input.seed, input.week, pkg.id, input.background, granted) }))
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

/** How many weeks her kit in `category` has been in service at `week` - the ONE input every
 *  equipment-condition rule takes (engine/equipment.ts).
 *
 *  Week 0 is brand-new kit, so before the first purchase this is simply `week`. After it, it is the
 *  weeks since the most recent hit. Walks the SAME sub-stream in the SAME order as `gearHitsUpTo`
 *  (so the two can never disagree about when she bought) but without building the array - this runs
 *  on every match composition and once per week, where `gearHitsUpTo`'s allocation would be waste.
 *
 *  Pure, and zero MAIN-stream draws: the sub-stream is created fresh from the seed and discarded. */
export function weeksSinceGear(
  seed: string,
  category: GearCategory,
  background: FamilyBackground,
  week: number,
): number {
  const line = ECONOMY.gear[category]
  const [cadLo, cadHi] = line.cadenceWeeks[background]
  const [prLo, prHi] = line.priceCents[background]
  const rng = rngFromSeed(`${seed}:gear:${category}`)
  let w = 0
  let last = 0
  while (true) {
    w += pickInt(rng, cadLo, cadHi)
    if (w > week) break
    // The price draw must be spent even though it is unused here, or the NEXT cadence draw would
    // read a different number than `gearHitsUpTo` reads and the two functions would drift apart.
    pickInt(rng, prLo, prHi)
    last = w
  }
  return week - last
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

/**
 * ⭐ WHICH SHOP THE LINE IS WRITTEN FROM – round-17 #17.
 *
 * The owner, 12.08: «New racket – used, off the classifieds» on a career with a sponsor, a full kit
 * deal and $323,491 in the bank. His ruling with it: *the line is right for the years it was written
 * for; give it a precondition – need, or pre-sponsor – rather than deleting it.* So it is not
 * deleted, and nothing else about it changes. It simply stops being the only thing the game can say.
 *
 * THE PRECONDITION IS THE BRAND CONTRACT, and it is a statement about the ITEM rather than about the
 * balance. `flavor` is keyed on `FamilyBackground` – an answer to a questionnaire at week 0, fixed
 * for the whole career – and the sentence it produces is a claim about where the racket came from.
 * When a signed deal covers that line the brand is SENDING it, so "used, off the classifieds" is not
 * a poor family's line any more, it is a false one. A `local` deal that covers only strings leaves
 * the racket exactly where it was, which is right: a small sponsor does not stop a family shopping
 * second-hand for frames.
 *
 * ⚠ IT STEPS UP ONE RUNG AND NEVER DOWN. `wealthy` under a deal keeps its own voice – a brand does
 * not make a rich family's frames plainer – and nothing here can make a line poorer than the family
 * is. One rung, because "current retail model" is what a kitted-out player actually plays; jumping
 * to "custom pro stock" would be inventing a fact about the contract.
 *
 * ⚠ AND IT IS COPY ONLY. `gearHitForWeek` still takes `background` and nothing else, so the
 * `seed:gear:<category>` sub-stream, the cadence and the cents are byte-identical to before this
 * existed – CLAUDE.md invariant 2. The half the owner also named, NEED, is not built here: the need
 * test the repo already settled on (`sponsorNeedMet`, 10.08 – a runway against the week's COURT
 * bill, not a dollar figure) needs a number `resolveGear` does not have and cannot re-derive without
 * re-running a MAIN draw. That is a real second precondition and it is written up in
 * `docs/specs/round17-triage.md` §17 for the owner rather than guessed at here.
 */
export function gearVoice(background: FamilyBackground, lineCoveredByBrand: boolean): FamilyBackground {
  return lineCoveredByBrand && background === 'working' ? 'middle' : background
}

/** The parents' weekly contribution for the season holding `week` - PURE, no stored state.
 *  Season 0 pays the base; each later season compounds one uniform growth roll from
 *  `incomeGrowthBand`, drawn off the private `seed:income:<season>` sub-stream (one draw per
 *  season, keyed by index, so the whole trajectory replays from the seed alone: no schema field,
 *  no migration, nothing to desync). Rounded to whole cents once, AFTER the compounding, so the
 *  weekly ledger stays integer. Zero MAIN-stream draws. */
export function parentIncomeForWeekCents(seedStr: string, background: FamilyBackground, week: number): number {
  const season = Math.max(0, Math.floor(week / WEEKS_IN_SEASON))
  let income = ECONOMY.parentIncomeCents[background]
  const [lo, hi] = ECONOMY.incomeGrowthBand
  for (let i = 1; i <= season; i++) {
    const rng = rngFromSeed(`${seedStr}:income:${i}`)
    income *= 1 + lo + rng() * (hi - lo)
  }
  return Math.round(income)
}

/** ⭐⭐ ROUND-23 #18 – WHAT SHARE OF A CHEQUE IS HERS, in basis points, at a given age.
 *
 *  `ECONOMY.kidShare` holds all four numbers; this is the ramp read off them and nothing else, so a
 *  retune moves the whole game and this function does not change. Zero before the threshold birthday,
 *  and flat once the cap is reached (age 26 on the shipped ladder):
 *
 *      18   19   20   21   22   23   24   25   26+
 *      10%  15%  20%  25%  30%  35%  40%  45%  50%
 *
 *  ⚠ IT TAKES HER REAL AGE IN WHOLE YEARS (`kidAgeYears`), never the ITF band's – the one-clock
 *  ruling of 09.08. A December girl is 18 for the last three weeks of the season her band turned 19
 *  in, and paying her the nineteen-year-old's share in those weeks would be the same defect the
 *  School tile had before it started reading her birthday.
 *
 *  Pure integer arithmetic on a persisted-nowhere input: no draw, no state, no schema. */
export function kidPrizeShareBps(ageYears: number): number {
  const { fromAgeYears, startBps, stepBps, capBps } = ECONOMY.kidShare
  if (ageYears < fromAgeYears) return 0
  return Math.min(capBps, startBps + (Math.floor(ageYears) - fromAgeYears) * stepBps)
}

/** Her cut of one cheque, in whole cents – `kidPrizeShareBps` applied and rounded ONCE.
 *
 *  ⚠ THE FAMILY GETS `prizeCents - kidPrizeShareCents(...)`, computed by subtraction rather than by a
 *  second rounding, so the two halves add up to the cheque exactly. A pair of independent
 *  `Math.round`s loses or invents a cent on half the finishes, and this money is booked into two
 *  different balances that a player can add up on screen. */
export function kidPrizeShareCents(prizeCents: number, ageYears: number): number {
  return Math.round((prizeCents * kidPrizeShareBps(ageYears)) / 10_000)
}

/** ⭐⭐ ROUND-24 – WHAT A FINISH PAYS THE STAFF, in basis points. ONE mechanism, two takers (the
 *  coach and the masseur), because two independent copies of "what does a finish pay" is this
 *  repo's own recurring disease – two surfaces asking different functions about one question.
 *
 *  The owner's shape, not the tour's: «за победы или 2е места» – a TITLE pays `titleBps`, a FINAL
 *  pays `finalBps` («за 2е только по-меньше»), and below a final NOTHING – never a cut of every
 *  cheque. `finishIdx` is the finish index `finalizeTournament` already holds (0 = champion,
 *  1 = finalist). All four numbers live in `ECONOMY.staffShare`; this reads them and nothing
 *  else, so a retune moves the whole game and this function does not change. */
export function staffResultShareBps(role: 'coach' | 'masseur', finishIdx: number): number {
  const rates = ECONOMY.staffShare[role]
  return finishIdx === 0 ? rates.titleBps : finishIdx === 1 ? rates.finalBps : 0
}

/** A staff member's cut of one cheque, in whole cents – the role's bps applied to the GROSS prize
 *  and rounded ONCE (the `kidPrizeShareCents` discipline one function up: every share rounds once,
 *  and the family gets the remainder by SUBTRACTION at finalize, so the pieces always re-add to
 *  the tournament's cheque to the cent). Zero draws, no state, no schema. */
export function staffPrizeShareCents(role: 'coach' | 'masseur', prizeCents: number, finishIdx: number): number {
  return Math.round((prizeCents * staffResultShareBps(role, finishIdx)) / 10_000)
}

/** ⭐⭐⭐ ROUND 29 PART THREE P3 – WHAT THE PARENT EARNS ON A SPONSOR CHEQUE, in basis points.
 *
 *  `ECONOMY.managerCommission` holds the one number and this reads it and nothing else, so a retune
 *  moves the whole game – the split, the coach market's cap and every sentence that describes it –
 *  and this function does not change. `staffResultShareBps`' own shape, one block up, for the same
 *  reason: the screens call the SAME function the till calls, so a line that describes the rule
 *  cannot drift from the rule. */
export function managerCommissionBps(): number {
  return ECONOMY.managerCommission.bps
}

/** The parent's fee on one sponsor cheque, in whole cents – rounded ONCE.
 *
 *  ⚠⚠ AND SHE GETS THE REMAINDER BY SUBTRACTION, WHICH IS THE OTHER HALF OF THE RULING. Every other
 *  splitter in this engine rounds the small side and leaves the family the rest; here the small side
 *  IS the family's, so the rounding lands on the fee and `gross - fee` is hers. The pair still
 *  re-adds to the brand's cheque to the cent, which is `kidPrizeShareCents`' rule and the reason it
 *  exists: a player can put the two balances side by side on screen. */
export function managerCommissionCents(grossCents: number): number {
  return Math.round((grossCents * managerCommissionBps()) / 10_000)
}
