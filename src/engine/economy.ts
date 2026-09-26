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
import type { AdTradeCategory, CoachTier, FamilyBackground, InjurySeverity, KitGrade, KitLine, PlayStyle } from '../shared/protocol'

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
 *  that scales, and it scales per category (`AdCategoryDef.feeCentsByBand`). ⭐ ROUND 39 #3 added
 *  the TERM as the second axis that scales with the band – see `termYearsMin`/`termYearsMax`. */
export interface AdBandDef {
  /** the standing at or inside which this band's cheques are written */
  maxWtaRank: number
  /** how many shoot weeks one deal asks per contract year at this band */
  shootWeeksPerYear: number
  /** ⭐⭐ ROUND 39 #3 – THE TERM RUNS WITH THE STANDING (owner 08.09, «давай так попробуем, как ты
   *  предложил», on his own shape: «для растущей карьеры не больше, чем на 12 месяцев, для топ-100
   *  до 1-2 года, топ-50 1-3 года, для топ-20 и выше» – research anchors Sharapova-Nike 8y,
   *  Federer-Uniqlo 10y, Djokovic-Lacoste 5y). The letter's ONE term draw maps into
   *  [termYearsMin, termYearsMax], both inclusive; a band where they are equal writes that term
   *  with the draw spent, never skipped – the draw COUNT is the RNG discipline, not the width. */
  termYearsMin: number
  termYearsMax: number
}
import type { TierId } from './season/types'
// ⚠⚠ TYPE-ONLY, AND IT POINTS AT A MODULE THAT IMPORTS **THIS ONE** AT RUNTIME (`world/spotlight.ts`
// reads `ECONOMY`), which is exactly why it is spelled `import type` and may never become a value
// import. `import type` is erased at compile time, so this closes no runtime cycle at all – the same
// shape `TierId` above uses and the same discipline every `world/*.ts` leaf uses for `WorldState`.
// What it buys is that `pressureBase` is typed `Record<ExposureKind, number>` and therefore TOTAL:
// the day a sixth exposure kind joins the union, `vue-tsc` names the missing base instead of letting
// a kind ship priced at `undefined`, which would poison the whole weekly sum with `NaN`.
import type { ExposureKind } from './world/spotlight'
// ⚠⚠ TYPE-ONLY FOR THE IDENTICAL REASON, and it buys the identical thing one mechanic over: `shock`
// below is `Record<SpiritShockKind, … | null>` and therefore TOTAL, so the day step 8's kind joins the
// union `vue-tsc` names the missing band instead of letting a shock ship priced at `undefined` – which
// would poison `accrueSpirit`'s weekly sum with `NaN` exactly as an unpriced exposure would.
// ⚠ `PregnancyState` JOINS IT IN v85 T4 FOR THE IDENTICAL REASON, one mechanic further on:
// `postpartumSupportScale` below is `Record<NonNullable<PregnancyState['support']>, number>` and
// therefore TOTAL, so the day a fourth answer grade joins that union `vue-tsc` names the missing
// factor instead of letting a grade ship multiplying the postpartum band by `undefined`.
import type { PregnancyState, SpiritShockKind } from './world/state'
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
  /** ⭐⭐ ROUND 42 #19 → #49(b) – ONE PRICE FOR EVERY FAMILY on a rung that carries it (round 41 P1's
   *  ruling, reaching the service ladder).
   *
   *  ⚠ THE TWO HIGH TIERS SET IT SINCE #49(b) – `resort` and `elite`, on the owner's 16.09 word
   *  «высокие тиры восстановлений в одном ценовом коридоре независимо от достатка». It was built
   *  under #19 and left unset then, refused by a bench (4 of 20 mid-careers moved, worst $178,701)
   *  whose policy books a clinic week without judging affordability – so what it priced was the
   *  autopilot's choice, not a player's. The full note, the cost he spent knowingly and the limit no
   *  bench can pass are on the `elite` package itself and in
   *  docs/specs/elite-retainer-2026-09.md §9.
   *
   *  Optional rather than `false` everywhere so that the four rungs it does NOT reach say so by
   *  silence, which is what `seaside` and below mean. */
  uniformPrice?: true
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

/** ⭐⭐⭐ ONE MARKET, DIFFERENT BASKETS – HOW A GEAR LINE IS PRICED (round 41 P1, the owner 12.09:
 *  «на рынке цены для всех сословий одинаковые, просто каждый покупает те товары, которые может…
 *  получается, что топовая ракетка для рабочей семьи стоит около 1к долларов, а для богатой 2.2к…
 *  Мне кажется это немного странно»).
 *
 *  ⚠⚠ WHAT HE WAS LOOKING AT WAS A PRICE WITH TWO AXES, AND THE SECOND ONE WAS INVISIBLE. Until this
 *  slice a purchase cost `mid(band[background]) × grades[grade].priceFactor`, so the SAME NAMED rung
 *  – «Kestra Pro Stock» – cost $360 in a working family's shop and $2,260 in a wealthy one, for an
 *  item the equipment model treats as literally identical (same `startWear`, same `lifeFactor`, same
 *  effect on her arm). That is not a corridor pricing a SERVICE in the market she trains in; it is
 *  one object with two price tags, which is precisely the thing he could not read.
 *
 *  SO THERE ARE TWO SHAPES NOW, and which one a line carries is decided by ONE question: does the
 *  quality ladder NAME this line's product?
 *
 *    * `by: 'rung'` – strings, frames and shoes. The ladder names them (`ECONOMY.equipment
 *      .gradeCopy`), the player buys them by name, and a name may have exactly one price. Identical
 *      for every background: the $90 club frame is $90 in a wealthy family's shop and the $2,260
 *      tour frame is $2,260 in a working one. His sentence, by construction rather than by tuning.
 *    * `by: 'basket'` – apparel, and it is the ONE line with no ladder. Its three bands are three
 *      DIFFERENT products that no rung names («club basics» / «brand kit» / «full designer kit»), so
 *      a background-keyed price here is a background-keyed BASKET rather than a background-keyed
 *      price for one thing. «просто каждый покупает те товары, которые может» IS this line, and it
 *      is therefore left alone. If a ladder is ever offered on apparel, this shape goes with it.
 *
 *  ⚠ CADENCE IS NOT PRICE AND STAYS PER-BACKGROUND. A wealthy family replaces its frames every
 *  10-12 weeks and a working one every 14-18: that is BEHAVIOUR – what a family does – and not a
 *  different price for the same act. It is the other half of «different baskets», and P1 does not
 *  touch it. */
export type GearPricing =
  | { by: 'rung'; cents: Record<KitGrade, [number, number]> }
  | { by: 'basket'; cents: Record<FamilyBackground, [number, number]> }

export interface GearLine {
  /** breakdown category this line reports under */
  breakdown: 'gear' | 'stringing'
  /** [min,max] weeks between purchases, drawn per purchase from the gear sub-stream
   *  (min === max ⇒ a fixed cadence, e.g. stringing / quarterly apparel) */
  cadenceWeeks: Record<FamilyBackground, [number, number]>
  /** [min,max] price in whole cents, drawn per purchase – see `GearPricing` for which axis prices it */
  price: GearPricing
  /** event flavor naming the item tier (owner: "Restring – tour gut" vs "budget synthetic") */
  flavor: Record<FamilyBackground, string>
}

/** ⚠ THE RUNG A CALLER WITH NO KIT STATE IS PRICED AT – the ladder's identity element, the same
 *  value `engine/equipment.ts` exports as `DEFAULT_KIT_GRADES` and the v37 migration back-fills on
 *  every line. It is spelled a second time HERE because this module may not import equipment.ts
 *  (that edge is the runtime cycle: equipment imports economy), and the two are pinned equal in
 *  tests/equipment.test.ts so the copy cannot drift. */
export const LADDER_IDENTITY_GRADE: KitGrade = 'composite'

/** THE BAND ONE PURCHASE OF `category` IS DRAWN FROM – the single source of truth for what gear
 *  costs, read by the recurring till (`gearHitsUpTo`) and by the shop window (`kitLinePriceCents`).
 *
 *  `grade` is the rung she is standing on for this line, or `null` for a caller that has no kit
 *  state (and for apparel, which has no rung to stand on). See `GearPricing` for why a laddered line
 *  ignores `background` and the one un-laddered line ignores `grade`. */
export function gearPriceBandCents(
  category: GearCategory,
  background: FamilyBackground,
  grade: KitGrade | null,
): readonly [number, number] {
  const price = ECONOMY.gear[category].price
  return price.by === 'rung' ? price.cents[grade ?? LADDER_IDENTITY_GRADE] : price.cents[background]
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
//
// ⭐⭐⭐ AND SINCE ROUND 41 P1 IT HAS A CEILING: THE CORRIDOR PRICES THE LOWER TIERS OF A SERVICE AND
// STOPS. The owner, 12.09, ruling on the gear complaint and then narrowing the corridor himself:
// «Коридор ±25–30% остаётся только на сервисах (физио, перелёты, тренер) и то только на нижних
// тирах, мне кажется что в про карьере с большими чеками цены для всех должны быть равны. По крайней
// мере элит тренеры и массажисты мне кажется вполне могут стоить одинаково для всех.»
//
// So the framing above survives exactly where it was ever true – a working-class club and a premium
// academy really are two different rooms at the bottom of the market – and stops where it stops
// being a fiction: an elite coach's week and a tour clinic's hour are ONE product with ONE price,
// and a family that has reached them is in the big-cheque era he is describing. See
// `UNIFORM_CORRIDOR` and `coach.corridorAppliesAt` for the rungs, and
// docs/specs/one-market-2026-09.md §4 for what stays corridored and why.
const WEALTH_CORRIDOR = {
  working: [0.7, 0.8],
  middle: [0.95, 1.05],
  wealthy: [1.2, 1.3],
} as Record<FamilyBackground, [number, number]>

/** ⚠ THE BAND A UNIFORM TIER IS PRICED IN, AND IT IS A BAND RATHER THAN A SKIPPED MULTIPLY ON
 *  PURPOSE (round 41 P1). Every corridor customer in this engine spends ONE uniform roll mapped into
 *  `lo + roll * (hi - lo)`; with `lo === hi === 1` that roll is still spent and still lands on
 *  exactly 1.0, so a tier going uniform changes the ARITHMETIC and not the SHAPE of any sub-stream.
 *  Skipping the draw instead would shift `seed:coachbg:<week>` / `seed:physio:<week>` by one position
 *  for half the tier ladder – a stream change dressed as a price change, and the kind of thing
 *  invariant 2 exists to refuse. */
const UNIFORM_CORRIDOR: [number, number] = [1, 1]

export const ECONOMY = {
  /** The canonical wealth-price corridor – see WEALTH_CORRIDOR above. */
  wealthCorridor: WEALTH_CORRIDOR,

  /** The corridor a tier that has left it is priced in: exactly 1.0, same roll. See UNIFORM_CORRIDOR. */
  uniformCorridor: UNIFORM_CORRIDOR,

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

  /** ⭐⭐ WHAT THE NINE YEARS DID TO THAT NUMBER – the childhood prologue's only money model
   *  (docs/specs/childhood-prologue-balance-2026-09.md §3, which supersedes
   *  childhood-prologue-money-2026-09.md §2; build spec §4, «the prologue makes it yours»).
   *
   *  ⚠⚠ TWO OF THE THREE FIGURES ARE FACTS ABOUT THE CARD TABLE AND THE THIRD IS A NAMED DIAL. The
   *  reference and the swing are the cheapest and dearest childhoods `src/prologue/cards.ts` can
   *  produce, recomputed by the test rather than trusted; `reserveSwingShare` is a decision, and the
   *  reason it is now written down is that it always existed – the shipped model divided by
   *  `startingFundsCents.middle` and thereby chose 0.399 without saying so. Every background moves
   *  by the same PROPORTION of its own reserve either way, which is §2.4's ruling in one line –
   *  «the player chooses where the family is FROM, not a sum, and the nine years move the number
   *  from there».
   *
   *  ⚠ WHY A PROPORTION AND NOT THE SAME CENTS FOR EVERYONE. The reachable childhoods span
   *  $8,200 - $28,150, which is more than a working family's entire reserve: subtracting cents would
   *  open a career in debt, and «you went bankrupt before she was fourteen» is a mechanic this game
   *  does not have and §7 forbids inventing here.
   *
   *  ⚠ PINNED AGAINST THE TABLE, NEVER RE-TYPED FROM IT. `tests/prologue-handover.test.ts` recomputes
   *  both numbers by walking every reachable run and fails if a card's price moves without these
   *  moving with it – the same discipline `APPETITE_AT` is held to one directory over. */
  prologue: {
    /** the childhood today's flat reserve already represents: the midpoint of what the nine cards
     *  can cost, `(cheapest + dearest) / 2` */
    referenceSpendCents: 18_175_00,
    /** ...and half the spread, `(dearest - cheapest) / 2`, which is the furthest either way a run
     *  can move the reference. */
    spendSwingCents: 9_975_00,

    /** ⭐⭐ HOW FAR THE NINE YEARS MAY MOVE A FAMILY'S OWN RESERVE, AND IT IS THE ONE DIAL IN THE
     *  PROLOGUE'S MONEY. The two figures above are facts about the card table; this is a decision,
     *  it is named as one, and it is his to move (docs/specs/childhood-prologue-balance-2026-09.md
     *  §3).
     *
     *  ⚠ IT REPLACES A DIVISOR THAT WAS A CATEGORY ERROR. The shipped model divided the childhood's
     *  spend by `startingFundsCents.middle` – nine years of FLOW over one family's BALANCE – which
     *  came out at 0.399 and nobody had ever written down. His complaint is what that number does at
     *  the bottom: «По суммам минимальным как-то совсем грустно, особенно у рабочих и средних» – a
     *  working family opening on $4,808 against the $8,000 the whole economy was tuned around – and
     *  his aim is «прийти как можно ближе к нашему коридору изначальному, который поигран и померян».
     *  So the swing keeps its SHAPE (the same clamp, the same proportion for all three backgrounds,
     *  §2.4's ruling untouched) and only this number moves: 0.399 -> 0.20.
     *
     *  ⚠ THE CEILING ON IT IS THE GAME'S OWN. `WEALTH_CORRIDOR` puts one background step at 0.25 of
     *  the middle centre (0.75 / 1.00 / 1.25), so a childhood allowed to move the reserve by a
     *  quarter or more could carry a family across a class boundary – and §2.4 is explicit that the
     *  player picks where the family is FROM. A fifth sits inside that bound with room to spare.
     *
     *  ⚠ AND IT IS NOT THE ACCEPTANCE. The acceptance – the poorest arrival surviving its first
     *  season with the coach it arrives with – is met by the coach LADDER, not by this: measured, a
     *  working family's dearest childhood goes under water at week 26 with the old rung and week 94
     *  with the ruled one, and moving this dial across its whole range shifts that by one week. The
     *  rung is the runway; the reserve is not. */
    reserveSwingShare: 0.2,
  },

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
    // ⭐⭐⭐ THE ELITE ROW IS THE OWNER'S SHELF AND IT IS HIS TABLE × 1.25 (round 41, 12.09, after P1:
    // «единая элит-полка вверх - верно»). P1 took the corridor off `high` and `elite` – one price for
    // everybody – and the measured consequence was that a wealthy family's idle year stopped burning
    // (+$6,280 -> -$4,917 on the 16-seed batch, 70% of it the corridor fade). Of the two levers the
    // calibration put in front of him – the wealthy INCOME or this band – he picked this one, and he
    // picked the direction: UP, to a single shelf.
    //
    // THE ARITHMETIC IS NOT A TUNING, IT IS AN IDENTITY: the new uniform price is what the WEALTHY
    // family paid under the corridor P1 retired, so the row is his own 29.07 midpoints times
    // `WEALTH_CORRIDOR.wealthy`'s midpoint, `(1.2 + 1.3) / 2 = 1.25`, to the dollar -
    //   12-16  $120 -> $150/h     17-22  $160 -> $200/h     23+  $200 -> $250/h
    // - and at the balanced plan's five sessions that is a weekly shelf of $750 / $1,000 / $1,250 for
    // EVERY background. docs/specs/one-market-2026-09.md §3's resolution block carries the table and
    // the predicted-vs-measured; `tests/economyCalibration.ts`'s `BANDS` block carries the burn.
    //
    // ⚠ `high` IS DELIBERATELY NOT HERE. His word was «элит», and P1's own «по крайней мере» note
    // already records that widening the cut was a floor rather than a bound - widening the PRICE is a
    // second decision and he did not make it.
    //
    // ⚠ ZERO RNG. `pickInt` spends exactly one `rng()` call whatever its bounds, so a wider band moves
    // the cents a coach charges and never a position on `seed:coaches`; the corridor roll still lands
    // on exactly 1.0 at this rung. Every elite rate scales monotonically, so `bestFitCoachAt`'s
    // cheapest-among-equals tie-break hires the same man at the same seed.
    hourlyRateCents: {
      self: [[10_00, 30_00], [11_00, 33_00], [12_00, 36_00]],
      budget: [[24_00, 36_00], [28_00, 42_00], [32_00, 48_00]],
      middle: [[40_00, 60_00], [48_00, 72_00], [52_00, 78_00]],
      high: [[64_00, 96_00], [80_00, 120_00], [96_00, 144_00]],
      elite: [[120_00, 180_00], [160_00, 240_00], [200_00, 300_00]],
    } as Record<CoachTier, [number, number][]>,

    // =============================================================================================
    // ⭐⭐⭐ ROUND 42 #19 – THE RETAINER FOLLOWS HER RANK. Proposals; the predicted-vs-measured table
    // is docs/specs/elite-retainer-2026-09.md.
    // =============================================================================================
    //
    // THE OWNER: «элитный стоит 830 в неделю, это 43к в год… за такие деньги их не существует», and
    // then the commission: «у нас есть исследование и бенч, надо просто цифры проверить и
    // актуализировать». His research (docs/research/team-economics-2026-09.md §1) prices a head
    // coach in two parts, and until this round only one of them was sized by anything: a retainer
    // read off the TIER the parent chose and her AGE band, plus a prize share. Reality sizes the
    // retainer off THE PLAYER'S RANK - top-100 ≈ $90k/yr, top-10 $150-250k - and re-prices the SAME
    // man as she climbs. Ours never did, which is finding 3.1 in one sentence.
    //
    // ⚠⚠ THE WHOLE POINT OF A RANK GATE IS THAT IT CANNOT REACH THE MIDDLE. Finding 3.2 is explicit
    // that mid-careers are priced right and that a blanket staff raise «would bankrupt the mid game
    // the tiers ladder was built to save». A factor read off her live W ranking is 1.0 for every
    // career that never enters the professional top hundred, so the middle is not measured to be
    // unmoved - it is ARITHMETICALLY unmoved, `x * 1` on an integer, on every week of every career.
    // The bench proves it anyway: a claim of «byte-identical» that nobody ran is exactly the null
    // arm CLAUDE.md warns about.
    //
    // ⚠ WHY HER RANK AND NOT HER EARNINGS, when 3.2's own complaint is denominated in money: the
    // research says rank in as many words («sized by the PLAYER'S RANK»), and a fee that tracked the
    // wallet would re-price the coach on the week a sponsor cheque landed, which is neither the
    // fiction nor anything a player could plan around. Measured, the two agree here anyway - a
    // season inside our top hundred banks a median $330k and a season inside our top ten $2.24M,
    // which is real top-tour scale (tools/r42-elite-retainer.ts §1).
    //
    // ⚠ THE BAND MULTIPLIES HIS LABOUR AND NEVER THE COURT (`bandedRateCents`). A top-ten player
    // does not make the hall dearer, and keeping the court out of it is also what lets the whole
    // change be one multiply on one number: `weeklyBillSplit`'s facility half is computed from
    // `facilityRateCents`, so the coach half absorbs the raise exactly and `coach + facility ===
    // total` survives untouched.
    //
    // ⚠ STEPS AND NOT A RAMP, deliberately. The research's own shape is a band table, and 3.1 asks
    // for «renegotiation as a scene, not a slider» - a step is the thing a scene can be hung on
    // later. What ships here is the arithmetic; the scene is its own item.
    //
    // ⚠ READ TOP-DOWN, FIRST MATCH WINS, so the rows stay ordered tightest-first. Anything outside
    // the last row is 1.0 - the identity, and the reason a career below the tail is byte-identical
    // rather than merely close.
    retainerBandByRank: [
      // #1-10. Research: $150-250k/yr. At the elite rung this lands his labour at $172k (17-22) /
      // $225k (23+) a year, which brackets the research's own midpoint.
      { atOrBetter: 10, factor: 4.5 },
      // #11-100. Research: ≈$90k/yr. Lands at $76.5k (17-22) / $100k (23+) - the band around it.
      { atOrBetter: 100, factor: 2.0 },
    ] as { atOrBetter: number; factor: number }[],

    // =============================================================================================
    // ⭐⭐⭐ ROUND 42 #51 / ROUND 44 – THE ANNUAL ASK. docs/specs/the-coachs-raise-2026-09.md.
    // =============================================================================================
    //
    // THE OWNER NAMED THE CORRIDOR AND THE CEILING HIMSELF (16.09, #51): «Коридор 5-15%, ceiling =
    // the rank band». What he did NOT want is the trigger the first draft gave it: «может такое
    // быть, что всего с 1 титулом в сезон (например w250/w500) тренер будет требовать 15%? Кажется,
    // что самого факта такого единственного титула маловато, нужна какая-то общая оценка прогресса».
    // So the position INSIDE the corridor is a weighted progress score and a title is one of its
    // four components rather than its trigger.
    //
    // ⭐⭐ AND THE BAND ABOVE BECOMES THE CEILING, WHICH IS THE SCENE ITS OWN COMMENT DEFERRED. Round
    // 42 #19 shipped `retainerBandByRank` as an arithmetic re-price and said so in as many words:
    // «3.1 asks for "renegotiation as a scene, not a slider" - a step is the thing a scene can be
    // hung on later. What ships here is the arithmetic; the scene is its own item.» This is that
    // item. The band no longer moves a fee that is already agreed - it says how far an AGREED fee may
    // be asked upward, and a man already on the payroll can never be priced above what the market
    // would quote for him at her standing today.
    //
    // ⚠ WHICH IS ALSO THE SAFETY PROPERTY, and it is worth stating as one because it is what makes a
    // live-save migration harmless: the stored fee is `min(agreed x (1 + ask)^n, today's market
    // labour)`, so it can NEVER exceed what this same till was charging before the change. The fix
    // can lower a family's payroll and cannot raise it.
    //
    // ⚠ THE WEIGHTS ARE THE ONLY FITTED NUMBERS HERE, and every REFERENCE the four components divide
    // by is a figure the game already states out loud (the rank halving, the coach's own quoted
    // season band, the tier ladder's own length, `ECONOMY.form.max`). That is deliberate: a component
    // with a private normaliser is a dial nobody can argue with, and four of those would have made
    // the score untunable. The measured corridor against his 5-15% is in the spec's §4.
    raise: {
      /** A FLAT YEAR IS STILL 5%, NEVER NOTHING AND NEVER LESS. His floor, and the one place «he
       *  never asks for less» is enforced - the downward half of the old silent re-price is deleted
       *  rather than lettered. ⚠ It also sits exactly where the masseur's ceiling was argued to:
       *  `ECONOMY.masseur.raisePerYear` is 4% precisely so the second seat stays «не так интенсивно
       *  как тренер», and the two numbers must not be retuned past each other. */
      askFloor: 0.05,
      /** His ceiling on ONE ask. Reached only by a score of 1 - every component at full marks in the
       *  same year, which the bench measures as rare rather than assumes to be. */
      askCeiling: 0.15,
      /** ⭐ THE RANK COMPONENT'S REFERENCE: HALVING HER RANKING NUMBER IN A YEAR IS FULL MARKS.
       *  #400 -> #200 and #20 -> #10 score the same, which is the honest shape - a ranking ladder is
       *  multiplicative and a linear reading would hand a junior climbing out of the four hundreds
       *  the same credit as a top-tenner defending a title. Argued rather than fitted: there is no
       *  free parameter in «twice as good». */
      rankHalving: 2,
      /** The weights, summing to 1. ⭐ THE RESIDUAL IS THE HEAVIEST AND #51 SAYS WHY: «a coach who got
       *  more out of her than the odds said is exactly the one who should ask» - it is the only
       *  component that measures HER AGAINST EXPECTATION rather than against zero, so it cannot be
       *  earned by a big season that was always going to happen. ⚠ TITLES ARE THE LIGHTEST, which is
       *  his correction to the first draft made arithmetic: at 0.15 a single title cannot on its own
       *  take the ask past 6.5% of the corridor, so «одного титула маловато» is true of the shipped
       *  model and not merely of its prose. */
      weights: {
        /** her place in the professional table, against where it was when the fee was agreed */
        rank: 0.25,
        /** the share of her REMAINING HEADROOM she actually took - literally the coach's job */
        development: 0.25,
        /** what she won, weighted by the rung it was won on */
        titles: 0.15,
        /** ⭐ what she did against the odds ring's own expectation (wave F1's results channel) */
        residual: 0.35,
      } as Record<'rank' | 'development' | 'titles' | 'residual', number>,
    },

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

    // ...and what a pill is worth on the development rate. WIDER than the rung ladder since round
    // 38 #17, not smaller: fit spans x1.67 (1.25/0.75) against x1.21 across the hireable rungs
    // (0.95 -> 1.15) and x1.40 across the whole ladder including the parent (0.82 -> 1.15). So the
    // pill REORDERS the market rather than breaking ties inside it, and in BOTH directions. A
    // Budget coach who is great for her (0.95 x 1.25 = 1.1875) out-teaches a Good-fit Elite coach
    // (1.15 x 1.00 = 1.15), so the match is now a reason NOT to buy up a rung; and an Off-style
    // coach on the bottom two rungs (0.7125, 0.78) teaches SLOWER than the parent's own 0.82 while
    // being billed every week for it. The second of those is the `under-self` band the coach card
    // prints; the first is the join that card cannot make, since it shows the two multiplicands
    // separately and multiplies them nowhere - see the profile lens in engine/world/coachMarket.ts.
    // All twelve cells are pinned in tests/wave5-coach-profiles.test.ts §A.
    /** ⭐⭐⭐ ROUND 38 #17 (07.09) – THE SPAN WIDENS 1.05/0.94 -> 1.25/0.75, AND IT IS THE HALF THAT
     *  MAKES THE THREE ROUTES DIFFERENT.
     *
     *  THE OWNER named three ways to reach the ceiling – «1. игрок тренирует сам и грамотно 2. она с
     *  тренером долгосрочно и у них метч 3. она с элитным тренером» – and then asked of the fit:
     *  «вопрос в том, как его показать?»
     *
     *  ⚠ THE ANSWER TO THAT QUESTION IS THAT IT ALREADY IS SHOWN. `CoachMarketScreen` prints «Great
     *  fit» / «Good fit» / «Off-style» and carries a lens for what a coach would be worth against
     *  another style. It does not FEEL like anything because the whole span was 12% – which is the
     *  real content of his question, and it is a number rather than a screen.
     *
     *  ⚠⚠ IT WIDENS THE SPREAD WHERE `plateauRate` NARROWS IT (see that constant's own table), which
     *  is why the two are one decision: a great fit is worth more to a career being run well, and an
     *  off-style partnership costs a mismatched one 93.2% against 98.9%. Measured with
     *  `tools/r38-ceiling-dials.ts`; the owner chose the pair. */
    fitFactor: { great: 1.25, good: 1.0, off: 0.75 } as Record<'great' | 'good' | 'off', number>,

    // THE PARENT'S OWN FIT. Self-coaching has no specialty to match: he taught her the game she
    // plays, so he is never wrong for it and never a specialist in it.
    selfFit: 'good' as 'great' | 'good' | 'off',

    // THE ELITE GATE - AND IT IS ON (owner, 13.09: «elite gate включим здесь же», wave 5 T13).
    // Owner, when it was built: «элит, кстати, могу вообще стать доступны для туров, как вариант и
    // стоит соответствующе». The idea is that an Elite coach does not take a fourteen-year-old with
    // nothing to show, which would turn the top rung from "what rich families buy in week 1" into
    // something earned - the same shape as the academy scholarship.
    //
    // He asked for it to be an OPTION first, so it was modelled and switched off, and this is the
    // flag being turned: the gate is live everywhere at once (the market's hireable check, the hire
    // command's refusal and the screen's locked row all read `coachHireable`). `minPoints` is her
    // EARNED ranking points, the same number the tier ladder gates on, and 150 is national-tier
    // eligibility - "she has results" stated in the currency the rest of the game already uses.
    //
    // ⚠ IT GATES THE HIRE, NOT THE HAVING - a latent seam, and it is named because it was CHECKED
    // rather than assumed. `coachHireable` is asked by `hireCoach`, by the market row's `lockedPoints`
    // and by the screen's lock: all three are surfaces of the HIRING DECISION. `openingCoachId` asks
    // nothing - it reads `bestFitCoachAt` and stops - so a career that OPENED on the elite rung would
    // keep its coach through the flip.
    //
    // ⭐ AND NO SHIPPED CAREER CAN: `OnboardingWizard`'s `COACH_OPTIONS` offers exactly two rungs,
    // `self` and `middle`, so the top rung has never been something a player could pick in week 1 -
    // which is why this is a seam and not a hole, and why T13 leaves it alone. The only trees that
    // reach it are `tools/econ-bench.ts`'s presets (a bench sets `coachTier` at birth) and a v22-or-
    // older save whose profile carried a rung this wizard does not offer. If the wizard ever grows an
    // Elite tile, this is the line that has to be read first - onboarding would need its own answer
    // (a refusal, a fallback rung, or the rung hidden until she has results), which is a second
    // mechanic and the owner's call, not this flag's.
    //
    // ⚠ DOMESTIC POINTS, since the two ladders landed. 150 is literally
    // TIERS.national.enterPointBand[0], so the domestic table is the one that keeps this number
    // meaning what it was written to mean. Do not repoint it at the ITF table without moving the
    // threshold too: an ITF gate would make the Elite rung reachable only by families who could
    // already afford to fly, which is the shape the gate exists to prevent.
    eliteGate: { enabled: true, minPoints: 150 },

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

  // =============================================================================================
  // CHEMISTRY – how these two WORK, as against what he can DO (docs/specs/the-chemistry-2026-09.md)
  // =============================================================================================
  //
  // The owner, 16.09: «химия между ребёнком и тренером, а не просто стиль-метч» … «эта самая химия
  // может как-то нарабатываться с разной динамикой – это может стать показателем, насколько ей
  // комфортно с тренером» … «самый дешёвый тренер может стать идеальным метчем и дать конкуренцию
  // элитному, но это такое же редкое событие, как и prodigy девочка».
  //
  // ⚠ EVERY NUMBER BELOW IS A KNOB AND NOTHING READS A LITERAL. The spec's C1 ruling is explicit
  // that the 4x4 is «built as a DATA OBJECT so a retune is one edit, not a refactor», and the same
  // rule is taken for the corridor and the walk – engine/chemistry.ts holds the arithmetic and not
  // one of these values.
  chemistry: {
    // ⭐⭐ THE 4x4 CENTRES – the pair's disposition before the draw, C1's table (spec §3a).
    //
    // THE PRINCIPLE, and it is a DESIGN CLAIM rather than a measurement – the spec flags it as such
    // twice and the owner ruled it «сама идея мне нравится… концептуально корректно звучит»: a pair
    // MATCHES on one axis and COMPLEMENTS on the other. Two intense people burn; two steady people
    // drift; the pair that shares a language and differs in temperature is the one that lasts.
    //
    // ⚠ WHICH OF HER AXES MEETS WHICH OF HIS, written down once and here, because the table is
    // otherwise sixteen unexplained numbers:
    //   · LANGUAGE – her openness (open/private) against what he TALKS TO (the person/the
    //     technique). They MATCH: an open girl is reached through the person, a private one through
    //     the third ball.
    //   · TEMPERATURE – her intensity (steady/intense) against how hard he PUSHES (hot/cool). They
    //     COMPLEMENT: the intense girl needs the cool head beside her, the steady one needs heat.
    //
    // So each row has exactly ONE best manner and ONE worst, and each manner is best for exactly one
    // temperament – the Latin-square shape B11 checks structurally rather than statistically.
    // `+1` is the good corner, `-1` the anti-match corner, 0 the two that split the difference (one
    // axis right, one wrong).
    //
    // ⚠⚠ AND THE CENTRE IS DELIBERATELY SMALL AGAINST `spread` BELOW, WHICH IS B10's WHOLE POINT.
    // A table a player can look up is «a strategy-guide entry», and the owner refused exactly that
    // when he asked for the cheap coach who clicks to be «такое же редкое событие, как и prodigy
    // девочка». The bench measures the variance of realised affinity BETWEEN cells against WITHIN a
    // cell and requires the draw to dominate at 2:1 or better – see tools/chemistry-bench.ts, B10.
    affinityCentre: {
      // sunny = open + steady -> wants a PERSON voice and HEAT
      sunny: { demanding: 1, warm: 0, analytical: -1, driving: 0 },
      // fiery = open + intense -> wants a PERSON voice and a COOL head
      fiery: { demanding: 0, warm: 1, analytical: 0, driving: -1 },
      // quiet = private + steady -> wants a TECHNIQUE voice and HEAT
      quiet: { demanding: 0, warm: -1, analytical: 0, driving: 1 },
      // deep = private + intense -> wants a TECHNIQUE voice and a COOL head
      deep: { demanding: -1, warm: 0, analytical: 1, driving: 0 },
    } as Record<'sunny' | 'fiery' | 'quiet' | 'deep', Record<'demanding' | 'warm' | 'analytical' | 'driving', number>>,

    /** what a cell's `+1` / `-1` is worth in affinity, before the draw. The table above is signed
     *  UNITS so its shape is readable at a glance; this is the one number that scales it. */
    centreScale: 0.26,

    /** the half-width of the per-pair draw around that centre, on a TRIANGULAR shape (two uniforms,
     *  so the middle is likelier than the ends and a corner pairing is genuinely rare).
     *
     *  ⚠ THIS IS THE B10 DIAL. Raising `centreScale` or lowering `spread` makes the table
     *  predictable; the measured ratio is recorded in the spec's §15. */
    spread: 0.9,

    // --- THE CORRIDOR (spec §3.2) --------------------------------------------------------------
    //
    // ⚠⚠ THE CEILING COLUMN IS THE OWNER'S IN BOTH ANCHORS AND IS NOT AN AGENT'S TO MOVE: +33 a
    // year at a perfect pair, +5 a year with «short ups» at no match. He was explicit that it
    // scales – «вверх точно». The FLOOR he was explicit about NOT being sure of – «вниз не уверен» –
    // so its middle is the bench's to fit (B7) and only its two ends are quoted from him.

    /** chemistry points a year at the TOP of the corridor, at affinity +1. His number: «за 3 года
     *  100% метч» is 33 a year, and it is a CEILING a perfect pair can REACH rather than a rate it
     *  runs at (his 16.09 correction, which is why §3 is a corridor at all). */
    ceilingAtPerfect: 33,
    /** ...and at affinity 0. His «+5%, и взлёты короткие» – the whole positive half of a no-match
     *  pair's corridor is five points wide, which is what makes its ups SHORT without a rule
     *  saying so. */
    ceilingAtNone: 5,
    /** ...and at affinity -1: «small and rare». The anti-match can still have a good week; it
     *  cannot have a good year. */
    ceilingAtAnti: 1,

    /** chemistry points a year at the BOTTOM of the corridor, at affinity +1. The middle of his
     *  «-5 to -10»: this is the Borg year, and it is reachable rather than common. */
    floorAtPerfect: -7,
    /** ...at affinity 0. «Deeper» (his «сильнее»), and four times the positive half – so an ordinary
     *  pair's weather spends more of its range losing than gaining, which is his «чаще» expressed as
     *  a SHAPE instead of as a second frequency knob. */
    floorAtNone: -20,
    /** ...at affinity -1. Deepest. */
    floorAtAnti: -33,

    /** ⭐ the pair's EXPECTED annual rate at a perfect affinity – the corridor's centre, where the
     *  weather sits when nothing is happening. Well below `ceilingAtPerfect` on purpose: a click that
     *  ran at the ceiling would make «за 3 года 100%» the rule instead of the lucky run it is.
     *
     *  ⚠ FITTED BY B7 AND IT MOVED, WHICH IS THE ONE NUMBER IN THIS BLOCK THE BENCH CHANGED. The
     *  first build set it at 22 and the run came back with «DOWN years at a perfect pair: NEVER»:
     *  with the median year at +19 and the floor at -7, a down year needed the weather to sit below
     *  -0.76 for a whole season, which is four standard deviations of the yearly mean. At 12 the
     *  median year is +11, the zero crossing is 1.9 sigma away, and a bad SEASON puts it within one -
     *  which is §3.4's own claim («losses are the channel that makes a good pair's bad year
     *  possible»), measured instead of assumed. It also puts a perfect pair's climb to 100 at «roughly
     *  a decade», which is §5's own sentence. */
    driftAtPerfect: 12,
    /** ...and the anti-match's, which is SMALLER in magnitude than the click's. C10 ruled the
     *  anti-match as FREQUENT as the click («согласен») and named the one asymmetry the design
     *  needs: it is slower to ARRIVE. This is that asymmetry and it is the only one. */
    driftAtAnti: -10,

    // --- THE WEEKLY WEATHER (spec §3.3) ---------------------------------------------------------
    //
    // ⚠⚠ «PERIODS» IS THE LOAD-BEARING WORD. White noise around a mean produces a wobbly line and no
    // story; what he described is «есть в периодах и плоские года, и взлёты и падения даже», which
    // requires the weekly step to be AUTOCORRELATED. B9 is the bench that can say it was built: a
    // perfect pair's weekly series must show runs of 8+ weeks on one side of its mean.

    /** how hard the walk is pulled back to 0 each week. The time constant is 1/this in weeks, so
     *  0.05 is a twenty-week memory – weeks near each other share a phase, seasons apart do not. */
    phaseRevert: 0.05,
    /** the week's own shock, on a triangular draw in [-1, +1]. With `phaseRevert` above this settles
     *  to a phase standard deviation near 0.39 – wide enough for a flat year, narrow enough that the
     *  corridor's ends stay rare. */
    phaseShock: 0.3,

    // --- THE THREE EVENT CHANNELS (spec §3.4) ---------------------------------------------------
    //
    // Events nudge the PHASE and never the level, so a single result cannot jolt the number: it
    // bends the weather, and the weather moves the level. And a downward phase does exactly what
    // §3.4 asks of her state – it damps the climb AND deepens the dip – because the corridor is
    // steeper below the drift than above it. The SHAPE does that work; no second rule is needed.

    /** ⭐⭐ C13, RULED 16.09 – «окей, давай слегка». Results now pay TWICE: into §4's `standing` (the
     *  coach grows, wave C2) and into the phase here. A fence would delete a true effect – winning
     *  together honestly does both things – so the chemistry read takes a FRACTION of its own
     *  natural weight instead. Every results nudge below is multiplied by this; her state is not. */
    resultsDamp: 0.5,
    /** a match won last week, before the damp – and its LOSS COUNTERPART IS EXACTLY ITS MIRROR, which
     *  was measured into this block rather than chosen.
     *
     *  ⚠⚠ THE FIRST BUILD WEIGHTED A LOSS HALF AGAIN AS HEAVY AS A WIN AND CHARGED A FIRST-ROUND EXIT
     *  ON TOP, AND THE BENCH CAUGHT IT AS A FLAT TAX ON EVERY CAREER IN THE GAME. Measured over 12
     *  careers x 208 weeks: 806 wins, 784 losses, 14 titles and 454 first-round exits – so the median
     *  career, at a 50% match record, was pushed to a standing phase of -0.36 and its relationship
     *  wore down for no reason but arithmetic. ⚠ IN A KNOCKOUT SPORT EVERY EVENT BUT ONE ENDS IN A
     *  LOSS, so any asymmetry here is a tax rather than a signal.
     *
     *  ⭐ AND THE SYMMETRIC PAIR ALREADY ENCODES DEPTH, which is why the exit term went rather than
     *  being re-sized: `wins - losses` IS the run. A title is +5 net, a semifinal +2, a first-round
     *  exit -1. So a deep run pays and an early exit costs, with no second term to keep in step - and
     *  a 50% season is exactly neutral, which is what the median career should be. ⚠ «A bad loss as
     *  FAVOURITE» (§3.4's third clause) is an EXPECTATION-relative read, and the spec defers that read
     *  to F1's residual itself (C5); it is not built here and is not faked here. */
    phasePerWin: 0.1,
    /** ...and a match lost. The exact mirror – see `phasePerWin` for the measurement that made it so. */
    phasePerLoss: -0.1,
    /** ...and the title, on top of the wins that produced it. «Winning together is how a pair finds
     *  each other», and a trophy is the week they both remember. Rare enough (0.3 a career-year,
     *  measured) that it is a bonus and not a channel. */
    phasePerTitle: 0.3,

    /** HER STATE – the five Mood bands, as a weekly phase nudge. His «психологическое состояние
     *  ребёнка», read through `spiritBandOf`, which is the world's one reading of that number.
     *  ⚠ NOT damped by `resultsDamp`: spirit pays into no second ledger, so it is read once. */
    phasePerBand: { glowing: 0.03, bright: 0.015, steady: 0, dimmed: -0.015, heavy: -0.03 } as Record<
      'glowing' | 'bright' | 'steady' | 'dimmed' | 'heavy',
      number
    >,

    // --- WHAT IT IS WORTH (spec §5 / §5a) -------------------------------------------------------

    /** ⭐ C3, RULED: the `elite` rung HAS no next tier, and a flat zero would say the best coach in
     *  the game cannot grow closer to her, which reads wrong. A token step up – and the FULL
     *  symmetric fall downward, because `high` is a real rung beneath it. */
    eliteUpStep: 0.04,

    // --- WHEN IT MAY BE SHOWN (spec §8b, ruling C7; the corridor is §8d, ruled 18.09) ------------

    // ⭐⭐ C7, RULED 16.09 – «once clear», and a single bar was what «clear» meant for one round. The
    // question C7 asks is whether chemistry surfaces «from season one, or once a band is clear», and
    // his reason for the second was quoted rather than paraphrased: «a sentence in week 3 about a
    // relationship is noise». The bar was `readableAt: 5`, and it was `ceilingAtNone` by derivation:
    // five points is, by his own anchor in this same block, the WHOLE of what an ordinary pair's year
    // can gain, so a reading under five sat inside one ordinary year's own noise.
    //
    // MEASURED AT THAT BAR (spec §8b, kept here because it is the record the new corridor is measured
    // against): 240 pairs x 416 weeks on the bench's own record – median first sighting week 62, p90
    // week 201, 5 of 240 never inside eight years, the marker turning back off 0.25 times a career,
    // and NO pair of the 240 crossing inside three weeks (median |chem| 1.05 at week 13, largest of
    // the 240 3.93).
    //
    // ⭐⭐⭐ AND THAT IS WHAT HE THEN PLAYED AND RULED ON, 18.09: «мне кажется медленно, какие-то цифры,
    // пусть и небольшие 1-2% мы всяко может раньше видеть. Но здесь тоже можно включить
    // вариативность.» Two instructions in one sentence, and the second is the standing design law of
    // this wave («вариативность… но при этом математика и стабильность – мы можем воспроизвести все
    // вариации»). So the bar is not lowered – it is DRAWN, per pair, from the corridor below.
    //
    // ⚠⚠ THE CORRIDOR IS STILL HIS `ceilingAtNone` AND NOT AN AGENT'S TASTE, which is the same
    // argument the single bar was built on, read at two more points. The floor is a FIFTH of what an
    // ordinary pair's year can gain and the ceiling is a HALF of it; the old bar was the whole of it.
    // So the three numbers are one anchor read at 1/5, 1/2 and 1/1, and «1-2%» – which is what he
    // asked to be able to see – is exactly the band the floor opens.
    //
    // ⚠ NO SCHEMA KEY IS OWED AND NONE IS TAKEN. The threshold is RE-DERIVED at read from
    // `${seed}:chemistry:readable:${coachId}` – a purpose-scoped sub-stream, one draw, persisting
    // nothing and never touching MAIN – exactly as the pair's affinity is (`affinityFor`). Same seed,
    // same career, same coach, same threshold, to the bit, for ever. `chemistryReadableAt` in
    // engine/chemistry.ts is the ONE place it is spelled.
    //
    // ⚠⚠ AND C7'S WEEK-3 GUARANTEE IS DELIBERATELY SUPERSEDED AT THE LOW END, said out loud rather
    // than discovered. At a threshold near the floor the fastest pairs on the roster can show a small
    // figure inside the first weeks – which is not a regression against «a sentence in week 3 is
    // noise», it is the owner overruling his own earlier ruling with a later one, and the figure he
    // named («1-2%») is precisely the size that appears there. What the corridor protects is that
    // this is a MINORITY of pairs rather than all of them; the measured share is in the spec's
    // 18.09 addendum.

    /** the lowest a pair's own readable threshold can be drawn – `ceilingAtNone / 5` */
    readableFloor: 1,
    /** ...and the highest – `ceilingAtNone / 2`. Small on purpose: the whole span is inside one
     *  ordinary year's gain, so the SLOWEST pair still reads inside a season and the spread is felt
     *  as «this pair took longer to show» rather than as two different games. */
    readableCeiling: 2.5,
  },

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
    /** ⭐⭐⭐ THE CHEQUE, AND IT IS THE CHEQUE AGAIN – ROUND 42 #47, SECOND READING (16.09).
     *
     *  ⚠⚠ THE FIRST READING OF HIS RULING WAS WRONG AND THIS BAND IS THE THING IT BROKE. #47 read
     *  «давай что-то вроде 60-80% закрытия» as the SIZE of the cheque and replaced this band with
     *  `shortfall × U(0.60, 0.80)`. He meant the FREQUENCY – «помощь должна срабатывать в 80%
     *  случаев примерно» – and said so plainly on 16.09, along with what was actually broken:
     *  «у нас был механизм, который нормально давал денег, нормальными суммами, просто делал это без оглядки
     *  на общий бюджет семьи, а смотрел только на кошелек. Это надо было исправить.»
     *
     *  ⭐ WHY THIS BAND IS THE RIGHT SIZE, MEASURED RATHER THAN REMEMBERED. A J-series trip costs
     *  **$1,100–3,600** before staff fares (`TIERS`, season/calendar.ts: j30 $200 + $900–2,000,
     *  j60 $250 + $1,100–2,400, j300 $400 + $1,600–3,200), and the J years are the stretch he named
     *  – «для семьи 8к самый сложный период это J серия, а там стоимость радикально другая». So this band
     *  covers **a third to a half of one trip**, which is what «нормальные суммы» means; the gap
     *  fraction paid a median **$129**, or 4–12% of a single trip.
     *
     *  ⚠ THE GAP IS STILL THE TRIGGER, IT IS JUST NOT THE SIZE. `unpayableTrip` gates whether a
     *  cheque is written at all (`world/phaseFinance.ts`) – «в край нужды для закрытия поездок» is his
     *  and it survives intact. And the cheque is deliberately NOT capped at the gap: a gift sized to
     *  what a trip costs is the mechanic, and a residual is not.
     *
     *  ⚠ The remaining half of his ruling – 60–80% of NEED CASES receiving help, against about 4%
     *  today – is a CADENCE question that needs a bench, and it ships with the chemistry/sparring
     *  wave. See docs/specs/cameo-gap-closer-corrected-2026-09.md §3. */
    amountCents: [500_00, 1500_00] as [number, number],

    // ===============================================================================================
    // ⭐⭐⭐ ROUND 42 #5 – THE CADENCE DIAL. PROPOSED NUMBERS, HIS TO CONFIRM OFF THE PRINTED TABLE.
    // ===============================================================================================
    //
    // THE OWNER, 15.09: «Спонсор деньгами реально засыпает рабочую раз в 3-4 недели».
    //
    // ⚠ HIS IMPRESSION IS THE DESIGN'S OWN NOISE AND NOT A DEFECT IN THE GATE. Measured before the
    // change (tools/sponsor-cadence.ts): the cameo was a MEMORYLESS weekly Bernoulli at
    // `rollChance` with NO cooldown and NO per-season cap of any kind, so P(gap <= 4 weeks) = 1 −
    // 0.94⁴ ≈ 22% and a working family – for whom the runway gate has zero hysteresis and therefore
    // stands open every single week – collected ≈ 2.9 payments ≈ $2,940 a season. Three cheques in
    // ten weeks is what a memoryless process looks like; it is also what «засыпает» looks like.
    //
    // ⚠⚠ BOTH NUMBERS BELOW WERE A PROPOSAL AND THE PRINT WENT TO HIM. The prediction was written
    // down BEFORE the arm was run (invariant 5) and lives in docs/specs/sponsor-cadence-2026-09.md;
    // the measured column is beside it in the same table.
    //
    // ⭐⭐⭐ ROUND 42 #43 – HIS RULING OFF THAT TABLE, 15.09: «сними потолок, а кулдаун давай 4».
    // Both halves land here and the second one HAS A CONSEQUENCE HE WAS TOLD ABOUT RATHER THAN LEFT
    // TO FIND: his original complaint was «раз в 3-4 недели», and a cooldown of four sets the floor
    // of the gap at EXACTLY four weeks – so a four-week gap is still legal and only the one-, two-
    // and three-week clusters are structurally gone. The measured share of gaps that land on that
    // floor is in the spec's §5 ledger. If the cadence still reads as too fast in play, this is one
    // constant and nothing else moves.
    //
    // ⚠ AND `seasonCap` IS GONE ENTIRELY – the constant and its reader. It was never a second
    // opinion about the cadence, it was a wall against the tail; he took the wall off, so the walk
    // in `cameoWillingWeeks` no longer counts a season's cheques at all. The cooldown is the whole
    // mechanism now, which is also why the dial he would move next is unambiguous.
    /** ⭐ THE SHOP'S OWN PATIENCE: no second cheque inside this many weeks of the last one. FOUR is
     *  his number (round 42 #43) – at `rollChance` the renewal mean is 1/p + 4 ≈ 20.7 weeks, about
     *  two and a half cheques in a season that never refuses one. ⚠ The floor it sets is four, not
     *  five: see the block above. */
    cooldownWeeks: 4,

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
  //
  // ⭐⭐⭐ THE PRICES BELOW ARE RUNG-KEYED SINCE ROUND 41 P1 – see `GearPricing` for the owner's
  // ruling and for why apparel alone keeps a background-keyed band.
  //
  // ⚠⚠ THE CALIBRATION IS THE OLD DIAGONAL, AND IT IS AN ARITHMETIC FACT RATHER THAN A NEW TUNE.
  // Each rung's band is the band of the background whose FLAVOUR already described that rung's
  // product, scaled by that rung's shipped `priceFactor`:
  //
  //     alloy        := working band × 0.55     («used, off the classifieds» × the starter rung)
  //     composite    := working band × 1.00     – the ladder's identity element, untouched arithmetic
  //     performance  := middle  band × 2.20     («current retail model»)
  //     pro          := wealthy band × 4.00     («custom pro stock»)
  //
  // So a working family's recurring bill is BYTE-IDENTICAL to the shipped game at every hit (its band
  // and the composite band are the same numbers), and the top of the ladder still costs the $2,260
  // the owner himself quoted – now to everybody. What the diagonal could NOT preserve is measured and
  // reported rather than hidden: every career in this game starts on `composite` (`DEFAULT_KIT_GRADES`
  // – there has never been a per-background starting rung), so a middle or wealthy family's DEFAULT
  // basket falls to the working family's price, because it was always the same object. The spec
  // docs/specs/one-market-2026-09.md §3 carries the measured weekly figure and the one-line retunes.
  //
  // ⚠ NOTHING HERE MOVES PLAY. A rung's `startWear` / `lifeFactor` / `frameInjuryRise` are untouched,
  // no background's DEFAULT rung moves, and `priceFactor` is gone from the arithmetic entirely: it
  // survives only as the number these bands were derived WITH, written out above.
  gear: {
    rackets: {
      breakdown: 'gear',
      cadenceWeeks: { working: [14, 18], middle: [12, 16], wealthy: [10, 12] },
      price: {
        by: 'rung',
        cents: {
          alloy: [33_00, 66_00],
          composite: [60_00, 120_00],
          performance: [396_00, 616_00],
          pro: [1920_00, 2600_00],
        },
      },
      flavor: {
        working: 'New racket – used, off the classifieds',
        middle: 'New racket – current retail model',
        wealthy: 'New racket – custom pro stock',
      },
    },
    stringing: {
      breakdown: 'stringing',
      cadenceWeeks: { working: [4, 4], middle: [3, 3], wealthy: [2, 2] },
      price: {
        by: 'rung',
        cents: {
          alloy: [9_90, 16_50],
          composite: [18_00, 30_00],
          performance: [61_60, 99_00],
          pro: [180_00, 280_00],
        },
      },
      flavor: {
        working: 'Restring – budget synthetic',
        middle: 'Restring – multifilament',
        wealthy: 'Restring – tour gut',
      },
    },
    shoes: {
      breakdown: 'gear',
      cadenceWeeks: { working: [10, 14], middle: [10, 14], wealthy: [10, 14] },
      price: {
        by: 'rung',
        cents: {
          alloy: [33_00, 49_50],
          composite: [60_00, 90_00],
          performance: [220_00, 330_00],
          pro: [680_00, 960_00],
        },
      },
      flavor: {
        working: "New shoes – last season's model",
        middle: 'New shoes – mid-range performance',
        wealthy: 'New shoes – top-line, fitted',
      },
    },
    apparel: {
      breakdown: 'gear',
      cadenceWeeks: { working: [13, 13], middle: [13, 13], wealthy: [13, 13] },
      // ⚠ THE ONE LINE WITH NO LADDER, so the only one still priced by the family's own basket –
      // three different products, three prices, and nothing here claims they are the same thing.
      price: {
        by: 'basket',
        cents: { working: [40_00, 70_00], middle: [110_00, 160_00], wealthy: [260_00, 380_00] },
      },
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
  // So it is a RAMP and not a rate: 10% the year she turns eighteen, more every birthday, and it
  // stops. The four numbers live here rather than inside `kidPrizeShareBps` because a literal in a
  // formula is a balance decision nobody can find – the rule this file exists for.
  //
  // ⭐⭐⭐ ROUND 42 #25 (CONFIRMED 15.09, «подтверждаю связку») – THE RAMP IS STEEPER AND SHORTER, AND
  // COLLEGE PAUSES IT. His question was «может быть нам с 18 не по 5, а по 10% в год ей добавлять
  // стоит?», his second pass «может даже до 60% к 23», and the confirmed shape is all three at once:
  //   * `stepBps` 500 -> 1000 – ten points a birthday, not five;
  //   * `capBps` 5000 -> 6000, and it is reached at TWENTY-THREE instead of twenty-six;
  //   * ⭐ and the steps count only years ON TOUR: «пока она снова в тур не вернется». A birthday
  //     spent at college does not move the ladder. See `collegePausedShareYears` – NO SCHEMA, the
  //     college span is already state and the step count derives from it.
  // The measurement that went with it is docs/specs/kid-share-ramp-2026-09.md, predicted-first.
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
    /** The birthday the RAMP starts climbing on. Her own bank account is the eighteenth's gift.
     *
     *  ⚠⚠ ROUND 41 #27 (12.09) – IT IS NO LONGER THE AGE THE TRANSFERS START AT, and the field is
     *  renamed in MEANING rather than in spelling because every reader of it still wants this same
     *  week. The owner: «может быть начать отчисления не в 18, а в 16 лет уже или вообще с момента,
     *  когда она в первый раз на w серию приходит? это же всё таки ее призовые», and then «призовые
     *  падают на её счёт с первого старта W-серии независимо от возраста – согласен». Below this
     *  birthday she now keeps `startBps` flat; from it the ladder climbs exactly as it always did.
     *  See `kidPrizeShareBps` for why «с первого старта W-серии» needs no gate of its own. */
    fromAgeYears: 18,
    /** What she keeps of every cheque in that first year – 10%, the bottom of his own «10-20%».
     *  ⭐ ROUND 41 #27: and what she keeps of every cheque BELOW it, which is the same number by
     *  ruling rather than by coincidence – the curve is continuous across her eighteenth. */
    startBps: 1000,
    /** ...and what each birthday after it adds. ⭐⭐ ROUND 42 #25: TEN points a year, his own «не по
     *  5, а по 10% в год», confirmed 15.09. It was five from round 23 until this item.
     *
     *  ⚠ A BIRTHDAY SPENT AT COLLEGE ADDS NOTHING – the steps count tour years only («пока она снова
     *  в тур не вернется»). That is not a fifth constant: `kidPrizeShareBps` takes the paused count
     *  as an argument and `collegePausedShareYears` derives it off the college span the save already
     *  holds. */
    stepBps: 1000,
    /** The ceiling. ⭐⭐ ROUND 42 #25: 60%, reached at TWENTY-THREE – his «может даже до 60% к 23».
     *  It was 50% at 26 from round 23 until this item, and both halves of that pair moved together:
     *  at ten points a birthday the cap is what decides where the ladder stops, and 60 at 23 is the
     *  shape he confirmed seeing what it does to the family's corridor (the bench print, invariant 5).
     *
     *  ⚠ 23 IS NOT WRITTEN ANYWHERE – it is `fromAgeYears + (capBps − startBps) / stepBps` and falls
     *  out of the three numbers above. Writing the age down as a fourth constant is how a ramp ends
     *  up with two disagreeing definitions of where it stops. */
    capBps: 6000,
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
  // THE SHAPE, ROUND 24 – «за победы или 2е места», NOT every cheque: a TITLE pays `titleBps`, a
  // FINAL pays `finalBps` («за 2е только по-меньше» – half), below a final NOTHING. The real-world
  // convention (5-15% of every cheque, sliding by depth) was researched and shown to him (the plan's
  // §1); his version was the sharper one and it is what shipped. Both shares are computed OFF THE
  // GROSS cheque – the kid's ramp (round-23 #18) is untouched and each share rounds ONCE, the
  // family keeping the remainder to the cent (`staffPrizeShareCents` + the finalize subtraction).
  //
  // =================================================================================================
  // ⭐⭐⭐ ROUND 42 #41 (15.09) – AND THE COACH'S SHAPE IS NOW THE CONVENTION'S, BY HIS OWN RESEARCH
  // =================================================================================================
  //
  // HIS WORD: «я вообще не понял почему мы снова обсуждаем разные проценты, если уже есть
  // исследование на 10% безусловных отчислений с любых призовых, независимо от глубины прохода. И мы
  // говорили, что это будет сделано».
  //
  // The receipt is his own file – docs/research/team-economics-2026-09.md §2 and finding 3.1: «7–15%,
  // most commonly 10%, of EVERY cheque» (Rublev pays Vicente fixed + 10% per tournament; Kasatkina
  // «10% от любого заработка на корте»). The audit's own verdict line on this very constant read «⚠
  // half-matches: our 10% exists but only at finishIdx 0/1; reality cuts 10% of EVERY cheque». So
  // round 24's sharper shape is REPLACED for the coach and nothing else about the mechanism moves:
  // still universal, still nothing persisted, still off the GROSS, still one rounding each, still
  // `track === 'wta'` and a FILLED seat only.
  //
  // ⭐ THE THIRD NUMBER IS THE WHOLE CHANGE. `everyBps` is what a finish BELOW a final pays; the
  // function one block down (`staffResultShareBps`) reads it instead of returning a hard 0. For the
  // coach all three are 1000, which is «10% of every prize cheque, at every finish» stated as data
  // rather than as a branch – and it is why this is still ONE mechanism with two takers.
  //
  // ⚠⚠ AND THE MASSEUR IS DELIBERATELY LEFT ON THE ROUND-24 SHAPE (`everyBps: 0`), WHICH IS A
  // QUESTION FOR THE OWNER AND NOT A DECISION TAKEN HERE. Item 41 names it as the thing the bench has
  // to answer; the measurement is in docs/specs/coach-every-cheque-2026-09.md §5, and moving him onto
  // the every-cheque road is exactly one number on this object. The default is «no change» because a
  // seat he never asked to re-rule should not move while he is reading a table about the coach.
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
    // ⭐⭐⭐ ROUND 42 #41 – FLAT TEN PER CENT AT EVERY FINISH. The three numbers are equal on purpose:
    // «10% безусловных отчислений с любых призовых, независимо от глубины прохода» has no depth in
    // it, so a title, a lost final and a first-round exit all pay the same rate. `finalBps` moved
    // from 500 to 1000 with the rest of them – round 24's «за 2е только по-меньше» was a statement
    // about DEPTH, and his 15.09 word removes depth from the coach's line entirely.
    coach: { titleBps: 1000, finalBps: 1000, everyBps: 1000 },
    // ⚠ THE MASSEUR IS UNCHANGED, AND `everyBps: 0` IS ROUND 24'S SHAPE SPELLED IN THE NEW FIELD –
    // a title-and-final bonus, nothing below a final. See the block above: whether he follows the
    // coach onto every cheque is the owner's to rule off the bench, not an agent's to decide.
    masseur: { titleBps: 300, finalBps: 150, everyBps: 0 },
  } as Record<'coach' | 'masseur', { titleBps: number; finalBps: number; everyBps: number }>,

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
  // ⚠⚠ ROUND 41 #15 MADE THAT LAST SENTENCE'S «CLOSE TO UNREACHABLE» LESS TRUE AND THE RULING MORE
  // LOAD-BEARING, which is why the paragraph is amended rather than left to rot. The advertising
  // ladder opens at SIXTEEN now (his «реклама открывается с 16 … согласен»), so a junior drinks or
  // clothing letter is a real pre-eighteen sponsor cheque – and this constant is what decides where
  // it lands. It lands the way he ruled it: hers at full value, the parent earning the fee. Measured
  // reach for the junior band is in `docs/specs/ad-portfolio-2026-08.md`'s round-41 section.
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
    /** ⭐⭐⭐ ROUND 41 #15 (12.09) – SIXTEEN, AND THE EIGHTEEN THAT STOOD HERE WAS OUR READING RATHER
     *  THAN HIS RULING. That is the whole of the item and it is written down first, because the
     *  paragraph below is the evidence against itself.
     *
     *  ⚠⚠ WHAT THE SHIPPED COMMENT SAID, KEPT VERBATIM BECAUSE IT IS THE EXHIBIT: «The age the owner
     *  scoped advertising mechanics to («какие у нас могут быть механики этих контрактов
     *  дополнительные от 18+ лет начиная и дальше»). Eighteen is already the engine's threshold age –
     *  `kidShare.fromAgeYears` above starts her own prize split there, school is over by 18.92 for
     *  every birth month, the junior rungs shut – so the boundary exists and this reads the same
     *  clock (`kidAgeYears`, the one-clock ruling of 09.08).» ⚠ HIS SENTENCE ASKED WHAT EXTRA
     *  MECHANICS EXIST FROM 18 ONWARD. It was read as an ELIGIBILITY GATE, which is a different
     *  claim, and the three supporting facts are all true and none of them is about advertising.
     *
     *  HE CAUGHT IT HIMSELF, 12.09: «А рекламных контрактов правда не предлагают до 18 лет или это
     *  наше ноу-хау? кажется молодые тоже в рекламах снимаются.» AND HIS RULING, the same day, on
     *  the round's option A1: «реклама открывается с 16 (юниорские суммы, реже), а призовые падают
     *  на её счёт с первого старта W-серии независимо от возраста – согласен».
     *
     *  ⚠ THE CLOCK IS UNCHANGED – her REAL age through `kidAgeAt`, never the band's, the one-clock
     *  ruling of 09.08. Only the number moved, and the two years it opened carry the `junior` block
     *  below rather than the adult shelf. */
    fromAgeYears: 16,
    /** ⭐⭐⭐ ROUND 41 #15 – THE JUNIOR BAND, and it is a BAND rather than four scattered multipliers
     *  on purpose: «юниорские суммы, реже» is one design sentence and it should be readable as one
     *  block. It governs exactly the real ages [16, 18); from her eighteenth birthday the shelf is
     *  byte-identical to what shipped, which is the property the bench arm is built to prove.
     *
     *  ⚠⚠ TWO CATEGORIES AND NOT SIX, AND THE PAIR IS THE SHELF'S OWN CHEAPEST RUNGS RATHER THAN A
     *  TASTE. `drinks` is the one category open at the very foot of the ladder (the ≤400 band's own
     *  cell – round 34's «a kit patch and a drink»), and `clothing` is the kit brand's second
     *  programme, which ALREADY requires a live kit deal to be written at all («двойной программой»,
     *  `reviewAdOffer`). So the junior shelf is: the drink she is photographed with, and the house
     *  that already dresses her putting her on a poster. A watch, a car, an airline and a fragrance
     *  are adult money for an adult face, and the real sport agrees – a fifteen-year-old signs an
     *  apparel deal, not a fragrance campaign.
     *
     *  ⚠ THE CAPSTONE AND THE LIFETIME LETTER ARE NOT ON THE LIST EITHER, and their own gates would
     *  refuse them anyway (four seasons ENDED inside the top 10 cannot exist at seventeen). Named
     *  rather than left to arithmetic: a gate that is unreachable today is a gate somebody deletes
     *  tomorrow.
     *
     *  ⚠ HALF THE CHEQUE AND HALF THE ARRIVALS – «юниорские суммы, реже», the two halves of his
     *  sentence, one number each. They are expressed in bps against the ADULT cell rather than as a
     *  junior price table, so the two shelves cannot drift apart on a retune: a new category cell,
     *  or a re-sized band, moves the junior figure with it by construction.
     *
     *  ⚠⚠ ONE YEAR, NEVER MORE, AND IT IS NOT A MULTIPLIER BUT A CEILING THE PAPER IS HELD TO. A
     *  multi-year deal signed for a minor is the thing his own round-34 complaint was about at the
     *  foot of the adult ladder («в 18 лет предлагают подписать копеечные контракты на 2 и 3 года»),
     *  and it is worse at sixteen: it would bind a career through the two years it changes most.
     *  ⚠ The bands a sixteen-year-old can actually reach write one year anyway (≤400 and ≤200 are
     *  both `termYearsMin: 1, termYearsMax: 1`), so this ceiling binds only a prodigy inside the top
     *  100 – which is exactly the case that needed deciding rather than left to a band table. */
    junior: {
      /** the real age the junior band ENDS at – [16, 18), her own clock */
      untilAgeYears: 18,
      /** the only categories a letter may be written in before eighteen */
      categories: ['drinks', 'clothing'] as readonly AdTradeCategory[],
      /** the junior cheque as a share of the adult cell at the same band – «юниорские суммы» */
      feeBps: 5000,
      /** the junior arrival rate as a share of the adult chance – «реже» */
      chanceBps: 5000,
      /** every junior term, in years – a ceiling and not a draw */
      termYears: 1,
    },
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
     *  clash exactly as an in-season shoot always did.
     *
     *  ⭐⭐⭐ ROUND 34 #7/#11/#12/#13 (03.09) – A FIFTH BAND IS PREPENDED AT ≤400, AND THE FOOT OF THE
     *  LADDER IS THE ITEM. The owner, playing his own save at world #113: «в 18 лет предлагают
     *  подписать копеечные контракты на 2 и 3 года … в фильме Финальный сет показывали, что игроку
     *  на 240 месте в мире предлагают контракты за 5к за каждый сыгранный матч с нашивкой спонсора.
     *  У нас сейчас 5000-12000 в год да ещё и на расцвет карьеры» – and, twice more, «129 место в
     *  мире, тот же контракт на 12к в год на 3 года. Не верю» and «99 место в мире, тот же контракт
     *  на 20к в год на 2 года».
     *
     *  ⚠⚠ ABOVE THE TOP 100 NOTHING MOVED, ON HIS OWN EXPLICIT RULING: «Про 50–100 отвечаю прямо:
     *  пересматривать не надо». The ≤100 / ≤50 / ≤10 cells below are the round-29 catalogue to the
     *  cent; only the two rungs BELOW the top 100 are round 34's, and the two cliffs they remove are
     *  «nothing at all below 200» and a 24x jump on a single ranking place from #101 to #100.
     *
     *  ⚠ 400 IS A NEW GATE AND IS NOT A KIT CUT – the three above it still are. It is the owner's own
     *  film anchor read onto the table: ~$5,000 a match under a sponsor's patch at ~40 matches a year
     *  is $200,000 a year for the world #240, and the band that has to hold him has to reach past
     *  #240. ⭐ Checked against the engine rather than assumed: a career in this band plays 22 events
     *  ≈ 44 matches a year, so the film's arithmetic and ours agree. */
    // ⭐⭐ ROUND 39 #3 (08.09) – THE TERM LADDER, his approved shape cell for cell: the rising career
    // (≤400/≤200) signs one year only, the top 100 up to two, the top 50 up to three, the top 10
    // two to five – «в спорте я видел, что они и на 5, и на 10 лет заключают», and the 5 lands
    // here while the 8-year capstone and the lifetime letter carry the top end he named. ⚠ The
    // MEASURED defect this replaces: a flat 1–3 at every band – «at wta#5 she signed a 3-season
    // kit; at wta#91 she signed a 2-season one; the 3-year ad deals land at wta#7 and wta#16
    // alike» (his save, tools/r39-save-read.ts --report).
    bands: [
      { maxWtaRank: 400, shootWeeksPerYear: 1, termYearsMin: 1, termYearsMax: 1 },
      { maxWtaRank: 200, shootWeeksPerYear: 1, termYearsMin: 1, termYearsMax: 1 },
      { maxWtaRank: 100, shootWeeksPerYear: 1, termYearsMin: 1, termYearsMax: 2 },
      { maxWtaRank: 50, shootWeeksPerYear: 2, termYearsMin: 1, termYearsMax: 3 },
      { maxWtaRank: 10, shootWeeksPerYear: 2, termYearsMin: 2, termYearsMax: 5 },
    ] as readonly AdBandDef[],
    /** ⭐⭐⭐ THE PORTFOLIO'S CATEGORIES (P7, his own list mapped onto ours) – the shelf the player
     *  sees, one live deal per category, the cheque per band in each row.
     *
     *  THE FEES WERE §8'S TABLE, CELL BY CELL, and landed inside his ranges by construction (the
     *  in-band test pins every cell): ≤200 $5k–20k · ≤100 $100k–500k · ≤50 $300k–1M · ≤10
     *  $1M–2.5M. Portfolio-per-year at each band, all categories filled: $45k · $1.1M · $2.6M ·
     *  $9.2M – against his own column «$30k–80k · ~$1–2M (Bublik) · ~$2.5–4M · ~$6–10M with kit».
     *  ⚠ ROUND 34 REWROTE THE TWO ROWS BELOW THE TOP 100 and left the three above it alone, so the
     *  ranges now read ≤400 $80k–120k · ≤200 $50k–200k · ≤100 $100k–500k · ≤50 $300k–1M · ≤10
     *  $1M–2.5M, and the portfolio-per-year column is $200k · $450k · $1.1M · $2.6M · $9.2M.
     *
     *  ⭐ THE ANCHOR SURVIVED A SECOND RESIZE UNMOVED: watches at ≤200 was the shipped $20,000 to
     *  the cent – the one cell the 23.1%-share rule still governed, and the cell every earlier
     *  number in this file's history was derived from.
     *
     *  ⚠⚠ AND ROUND 34 #7/#11/#12/#13 (03.09) IS WHERE THAT ANCHOR FINALLY MOVES, WHICH IS SAID OUT
     *  LOUD RATHER THAN LEFT FOR A READER TO NOTICE. The owner played eleven seasons in and around
     *  the top 100 and read the letters: «в 18 лет предлагают подписать копеечные контракты на 2 и 3
     *  года», «129 место в мире, тот же контракт на 12к в год на 3 года. Не верю», «99 место в мире,
     *  тот же контракт на 20к в год на 2 года». Two rungs BELOW the top 100 were rewritten and the
     *  cells above it were not touched at all («Про 50–100 отвечаю прямо: пересматривать не надо»):
     *
     *    band        was        now      what changed
     *    ≤400        –          $200,000 a new band: a kit patch and a drink, nothing else
     *    ≤200        $45,000    $450,000 the four open cells x10, their SHAPE preserved exactly
     *    ≤100        $1,100,000 unchanged
     *    ≤50         $2,600,000 unchanged
     *    ≤10         $9,200,000 unchanged
     *
     *  ⭐ HIS OWN HEDGE WAS RIGHT AND IS RECORDED AS SUCH: «может быть для нашего масштаба наша
     *  система нормальная, цифры только на первом тире и условия не очень». The ladder's SHAPE –
     *  the 2.4x / 2.4x / 3.5x it steps above the top 100, one deal per category, the cheque the only
     *  axis that scales – is the round-29 design untouched. It was the FOOT that was broken.
     *
     *  ⚠ A `null` CELL IS THE GATE: the category has not opened at that band. Drinks and the kit
     *  brand's poster campaign open at ≤400 (round 34's new rung – a patch on the shirt and a
     *  drink); watches and cars join them with the first real professional cash (≤200 – «A #180
     *  holds a watch deal, a drinks deal, a local car dealer: small money, same shelf», §8); the
     *  airline waits for the top 100; fragrance is the icon-band category (§7: «watches early, cars
     *  at top-100, fragrance at top-10»). Derived, never a second constant, so the gate and the
     *  price cannot disagree.
     *
     *  ⚠⚠ THE PER-CATEGORY LADDER IS NO LONGER MONOTONE AND THAT IS THE APPROVED TABLE, NOT A SLIP.
     *  Three cells sit level or fall as the band rises – clothing $120,000 at ≤400 against $50,000
     *  at ≤200, drinks $80,000 at both, watches $200,000 at both ≤200 and ≤100 – because what the
     *  owner approved is the BAND TOTAL ($200,000 / $450,000) and the shelf's SHAPE at each band,
     *  not a rule about one category's own climb. A #380 who is dressed and hydrated by two houses
     *  out-earns a #180 in clothing alone, and is out-earned four times over on the shelf as a whole.
     *  ⚠ It cost `adBandOfTerms` its old premise («the ladders are strictly increasing wherever they
     *  are not null»); see that function for what replaced the walk and what is still ambiguous.
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
      // ⚠⚠ FIVE CELLS PER ROW SINCE ROUND 34, AND THE FIRST IS THE NEW ≤400 BAND. Read the columns
      // as ≤400 · ≤200 · ≤100 · ≤50 · ≤10; the last three are the round-29 catalogue untouched.
      watches: {
        label: 'Watches',
        trade: 'We make watches',
        houses: ['Quiet Hour', 'Halfpast', 'Silver Alder'],
        feeCentsByBand: [null, 200_000_00, 200_000_00, 500_000_00, 1_200_000_00],
      },
      cars: {
        label: 'Cars',
        trade: 'We make cars',
        houses: ['Northgate Motors', 'Caldera Auto', 'Faro Automobiles'],
        feeCentsByBand: [null, 120_000_00, 400_000_00, 800_000_00, 2_000_000_00],
      },
      drinks: {
        label: 'Drinks',
        trade: 'We make drinks',
        houses: ['Cold Current', 'Verdel Springs', 'Ninefold'],
        feeCentsByBand: [80_000_00, 80_000_00, 150_000_00, 400_000_00, 1_000_000_00],
      },
      // ⭐ THE ≤400 SHELF IS A KIT PATCH AND A DRINK AND NOTHING ELSE, which is exactly the film's
      // picture the owner brought: a patch on the shirt. Watches, cars, the airline and the
      // fragrance all stay shut down there.
      clothing: {
        label: 'Clothing',
        trade: 'We make her kit',
        houses: [],
        feeCentsByBand: [120_000_00, 50_000_00, 100_000_00, 300_000_00, 1_000_000_00],
      },
      airline: {
        label: 'Airline',
        trade: 'We fly people across the world',
        houses: ['Northmere Air', 'Corvess Airways', 'Palewing Atlantic'],
        feeCentsByBand: [null, null, 250_000_00, 600_000_00, 1_500_000_00],
      },
      fragrance: {
        label: 'Fragrance',
        trade: 'We make perfume',
        houses: ['Rivelle', 'Maison Ondelle', 'Blanche & Noir'],
        feeCentsByBand: [null, null, null, null, 2_500_000_00],
      },
    } as Record<AdTradeCategory, AdCategoryDef>,
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
    /** ⚠ `termYearsMax: 3` STOOD HERE AND ROUND 39 #3 MOVED THE TERM ONTO THE BAND (owner 08.09,
     *  «давай так попробуем, как ты предложил»). Its note called 1–3 «the research's own law for
     *  non-endemic paper», and the flat law was the measured defect: at wta#5 and wta#91 alike the
     *  ladder wrote the same 1–3 draw, and NOTHING above three years existed in the game at all.
     *  The band's own `termYearsMin`/`termYearsMax` carry the ladder now – 1y for the rising
     *  career, up to 5y at the top – and the churn note survives where it is still true: short
     *  paper at the foot is what makes the 2–4 houses per category rotate. */
    /** ⭐⭐⭐ ROUND 39 #3 – THE LIFETIME LETTER («А некоторые и пожизненно»), once per career, at
     *  legend status: the icon exception the research names (Messi, Ronaldo, LeBron), mostly
     *  outside tennis, so it is ONE letter and not a band.
     *
     *  ⚠⚠ THE GATE IS THE CAPSTONE'S OWN TENURE READ PLUS THE ONE THING THE CAPSTONE NEVER ASKS: a
     *  Slam title. Four seasons ended inside the top 10 – `capstoneSeasonsOf`, the same fold, never
     *  a second derivation – AND at least one Slam on the trophy ledger. A lifetime deal is written
     *  to a legend, and in this sport a legend without a Slam is not one.
     *
     *  ⚠ THE FEE IS THE ICON BAND'S OWN BIGGEST TRADE CHEQUE, MADE PERMANENT – fragrance's
     *  $2,500,000, the top cell of the ordinary shelf – and NOT a second capstone: the real
     *  lifetime deals pay roughly a peak year-fee forever, and the game's peak ORDINARY fee is
     *  this cell. $10M/yr forever beside the capstone's $10M x 8 would double the top of the
     *  economy; the annuity shape – top-shelf money that never expires and survives retirement –
     *  is the «пожизненно» he named, and the walk (tools/r39-terms-walk.ts) is the measurement.
     *
     *  ⚠ ZERO SHOOT WEEKS, deliberately: shoot weeks are named at signature for the whole term,
     *  and a term with no end has no «whole term» to name them across. The house pays for the name
     *  she already made; the letter asks nothing back – which is also what lets it survive
     *  retirement without owing weeks she no longer has. */
    lifetime: {
      /** ⭐⭐ THREE, NOT THE CAPSTONE'S FOUR, AND THE NUMBER IS MEASURED (owner, 08.09: «тогда окей
       *  и не вижу причин это не сделать»). His questions were «не будет ли это большим облегчением?
       *  сколько реально игроков в % … какая ценность будет?», and `tools/r39-tenure-reach.ts`
       *  answered them over the round-29 corpus shape – 9 presets x 2 policies x 6 seeds = 108
       *  careers, 900 weeks:
       *
       *      >= 4 top-10 seasons AND a slam    11 of 108   10.2%
       *      >= 3 top-10 seasons AND a slam    11 of 108   10.2%
       *
       *  ⚠ IDENTICAL - the two careers holding exactly three top-10 seasons hold ZERO slams, so the
       *  SLAM is the binding gate and this number was never doing the work it looked like it was
       *  doing. Dropping it is therefore not a loosening: it costs nothing measurable, and it is the
       *  difference between his own best career (Ines: 3 seasons + a slam) earning the letter and
       *  never learning the mechanic exists. ⚠ The capstone above stays at FOUR - it is tenure
       *  without a title, and it is right for that to be the stricter bar. */
      seasonsInTop10: 3,
      /** Slam titles on the ledger before the house writes – the legend line */
      slamTitles: 1,
      /** per contract year, for ever – banked at signature and on every anniversary */
      cashCents: 2_500_000_00,
    },
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
     *  ⚠ ITS OWN NUMBER AND NOT A SHARE, and it stays that way: 12 is 48% of the Slam title's 25,
     *  which is not `finalFloorShare` below, and the difference is the argument the constant was
     *  written on. A Slam final is a global broadcast in its own right. */
    slamFinalFloor: 12,
    /** ⭐⭐⭐ ROUND 41 #18 PART TWO (12.09) – WHAT HER FIRST GRAND SLAM MAIN DRAW IS WORTH, once, dated
     *  at the week she played it and decaying on the TITLE clock like every other result.
     *
     *  THE OWNER, 12.09: «да, делаем fame за основу Шлема, надо полностью с математикой бренда
     *  разобраться, чтобы этот вопрос уже не поднимался… У нее был вайлдкард на Шлем, когда она была
     *  #155.»
     *
     *  ⚠⚠ THE DEFECT IT ENDS. Before this line a Slam main draw was worth EXACTLY ZERO fame unless
     *  she reached the final: `titleFloor.slam` pays the champion, `slamFinalFloor` pays the runner-up,
     *  and the other 126 women in the draw – including a #155 wildcard playing the biggest tournament
     *  of her life in front of the largest audience in the sport – left no trace in the stock at all.
     *  On the reference career the Slam DEBUT at ~w130 moved nothing; her brand woke 36 weeks later
     *  on a World Tour 500 title, which is the plateau he reported as item 18.
     *
     *  ⚠⚠ THE DEBUT AND NOT THE APPEARANCE, which is the whole sizing argument. A regular's Slam
     *  weeks are already paid for – she wins rounds, she reaches finals, she ends seasons in a band,
     *  and every one of those is a term above. Paying per appearance would price the same career
     *  twice and would grow without bound for a top-20 player who plays four a year for a decade.
     *  What NOTHING above can see is the first one: the week the world learns the name. That is a
     *  singular event, so it is a singular step.
     *
     *  ⚠ 4, AND THE LADDER IS WHY. Against `titleFloor` – slam title 25, wta1000 14, wta500 8,
     *  wta250 4 – a Slam main draw is worth one World Tour 250 title. That is deliberately modest:
     *  she has won nothing, and the claim is only that the world has now seen her. It is also ~16% of
     *  the Slam title's own step, which keeps «выиграть Шлем» an order of magnitude above «сыграть
     *  Шлем». docs/specs/the-fame-and-the-brand-2026-09.md §2 carries predicted against measured.
     *
     *  ⚠ IT NEEDS A DATED ROW AND IT HAS ONE WITHOUT A SCHEMA MOVE: the `keep: true` milestone
     *  `SLAM_DEBUT_KEY` fired in `finalizeTournament`, which `pruneEvents` can never drop. Careers
     *  that reached a Slam BEFORE this shipped carry no row and get no retroactive credit – stated in
     *  the spec's §6 rather than papered over. */
    slamDebutFloor: 4,
    /** ⭐⭐⭐ ROUND 34 #17 (03.09) – WHAT A LOST FINAL AT EVERY OTHER PROFESSIONAL TIER IS WORTH, as a
     *  SHARE of that tier's own title step. Approved by the owner at 0.4.
     *
     *  ⚠⚠ THE DEFECT IT ENDS: `trophiesByTier[tier].finals` has recorded a dated, per-tier, never
     *  pruned runner-up plate since schema v31 and NOTHING IN THE GAME EVER READ IT except at
     *  'slam'. On the owner's own week-569 save that is SIXTEEN finals worth exactly zero to her
     *  fame – 5 local, 2 regional, 1 national, 1 w15, 4 w50, 2 w100, 1 wta125 – for a girl who has
     *  spent a decade in and around the world top 100 and whose complaint («доход опустился с 200 до
     *  65 долларов в неделю с бизнеса… Она доходит в Шлеме до QF и вообще стабильно в 100 держится»)
     *  is precisely that the model cannot see the career she is having.
     *
     *  ⚠ A SHARE AND NOT A LADDER, so it cannot drift away from `titleFloor`. One number, and the
     *  per-tier shape is the title ladder's own – a w15 runner-up plate is worth 0.1 and a WTA 1000
     *  one 5.6, in the same proportion the titles are.
     *
     *  ⚠⚠ AND IT DOES NOT REACH 'slam', WHICH IS THE ONE PLACE IT WOULD DOUBLE-COUNT.
     *  `slamFinalFloor` above already pays that plate and pays it more (12 against 0.4 x 25 = 10),
     *  so `fameFloorOf` excludes the tier by name rather than by arithmetic.
     *
     *  ⚠ IT IS FAME AND NOT THE VALUATION MULTIPLE. `business.merch.value.finalX` prices the SAME
     *  finals into the multiple, deliberately and since round 30 #24 – see that constant for why
     *  both survive and what the multiple measured after this shipped. */
    finalFloorShare: 0.4,
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
      /** ⭐⭐⭐ ROUND 38 #2c (06.09) – THE RUNG THE LADDER STOPPED ONE SHORT OF, and the owner's own
       *  words are the argument: «спортсменка проводит свой лучший сезон (и не один) находясь в
       *  ТОП-100 … у нее явно есть и репутация и о ней знают».
       *
       *  ⚠⚠ WHAT IT ENDS, on his week-1115 career: NINE seasons ended inside the top 100 were worth
       *  exactly ZERO fame, because the ladder stopped at 50. A decade of being a professional the
       *  world can name bought nothing at all, while one WTA 500 title on one Sunday bought 8.
       *
       *  ⚠ 0.6 IS THE LADDER'S OWN RATIO CONTINUED AND NOT A NEW LEVEL. The rungs above step by
       *  10 / 4 / 1.5 – ratios of 2.50 and 2.67 – and 1.5 / 2.6 is 0.58. Rounded to 0.6, so the
       *  shape of the ladder decides the number rather than a preference about how much a top-100
       *  season "should" be worth. */
      { maxEndRank: 100, add: 0.6 },
    ] as readonly { maxEndRank: number; add: number }[],
    /** ⭐ THE SLOW DECAY – the half-life of every contribution, in weeks. Two seasons: a Slam won
     *  six seasons ago still carries an eighth of its step, so a reign fades over about four to
     *  six seasons rather than overnight. ⚠ Decay is what makes fame a lever and not a rank by
     *  another name (spec §3) – a stock that only rises is a trophy cabinet. */
    halfLifeWeeks: 104,
    /** ⭐⭐⭐ ROUND 38 #2c (06.09) – THE CAREER CLOCK: how long a FINISHED SEASON inside a band the
     *  world notices is remembered, against `halfLifeWeeks` above for a single title.
     *
     *  THE OWNER: «у нее явно есть и репутация и о ней знают, не могу забыть за год.»
     *
     *  ⚠⚠ IT SHIPPED AT 104 FIRST – identical to the title clock, deliberately, so the split could be
     *  proved a no-op before it was tuned. The value below is the tuned one; `seasonFloorDecayAt`'s
     *  header carries what it ends and `docs/specs/fame-presence-2026-09.md` carries predicted
     *  against measured over 29 of his own careers.
     *
     *  ⚠ IT MUST BE THE LONGEST OF THE THREE CLOCKS (title 104, campaign 52-156 by band, this one),
     *  or a season is forgotten faster than the title won inside it.
     *
     *  ⚠⚠ 312 = SIX YEARS, AND IT IS MEASURED. His best season ever – #20, wrapped at week 884 – was
     *  worth 0.86 fame points at week 1115 on the title clock and is worth 2.39 on this one. The
     *  sweep is `tools/r38-fame-presence-sweep.ts` over 29 of his own careers; 104 / 208 / 312 / 416
     *  are all in it and the table is in docs/specs/fame-presence-2026-09.md. */
    seasonHalfLifeWeeks: 312,
    /** ⭐ THE MULTIPLIER'S STEP – each shoot week ALREADY LIVED multiplies the floor by
     *  (1 + step), the step itself decaying on the same half-life. Twelve fresh shoots ≈ ×1.6:
     *  enough to reorder two comparable floors (the census's #30-on-court / #2-off-court shape),
     *  never enough to make a face out of nothing – zero floor times anything is zero. */
    shootStep: 0.05,
    /** ...and the multiplier's ceiling. The photographs can at most double what the court earned –
     *  the spec's «a multiplier on a floor she earns on court, not the only road», as a bound. */
    shootMultCap: 2,
    /** ⭐⭐⭐ ROUND 32 #5 (31.08) – WHAT A DELIVERED SHOOT ADDS TO THE FLOOR, per band of the deal
     *  that asked for it. `docs/specs/collaborations-as-early-fame-2026-08.md`, and it is the item.
     *
     *  THE OWNER: «карьера топ-20 без титулов … Мне кажется здесь как раз на раннем этапе
     *  коллаборации нам должны помочь, они станут хорошим рычагом роста известности и стоимости
     *  бренда как раз» – and «и это надо внедрять да».
     *
     *  ⚠⚠ AN ADDITION AND NOT A COEFFICIENT, WHICH IS THE WHOLE ITEM. `shootStep` above MULTIPLIES
     *  the floor, and a multiplier cannot lift a career that has nothing to multiply: fame in this
     *  game is a TITLE currency (`titleFloor` pays 8 for one World Tour 500 against 4 for a whole
     *  season ended in the top 20), so the early career the owner is asking about has a floor of
     *  almost nothing and five live deals buy a multiple of almost nothing. A signed campaign is a
     *  public event in its own right – a face on a shelf reaches people who have never watched a
     *  match – so it belongs on the same ledger as a title, not on the coefficient applied to titles
     *  she has not won.
     *
     *  ⭐ BOTH SURVIVE, ON HIS RULING («давай, да»): the ADD is the early rung and `shootStep`'s
     *  multiplier is the late one, so a champion who also sells feels both.
     *
     *  ⚠⚠ BY THE DEAL'S BAND, ON HIS RULING – «по полосе сделки (глобальный дом это не локальный
     *  ретейнер) – да». The index is `advertising.bands`' own, weakest-first like every ladder in
     *  this file, and the band a letter was written at is recovered from the cheque it states
     *  (`adBandOfTerms`) rather than stored – so no letter needs a new field and every paper already
     *  in a save answers the question it was always carrying.
     *
     *  ⭐⭐ AND THE GRADIENT IS GENTLE ON PURPOSE – 2.75x from the local retainer to the global house,
     *  against the SIXTY-FOLD span of the cheques those two bands write ($20,000 to $1.2M in
     *  `categories.watches`). What a shoot buys here is REACH, and reach does not scale with the
     *  cheque: a bigger house means better placements in more countries, not a hundred times the
     *  faces. ⚠⚠ A STEEP GRADIENT ALSO DESTROYS THE THING THE ITEM IS FOR, which is a measurement
     *  rather than an aesthetic – the high bands are where the shoot ASK is highest (2 weeks a year
     *  a deal against 1) and where a career already has a floor to multiply, so a steeply banded add
     *  lands hardest exactly where it is least needed. Benched at [0.15, 0.35, 0.6, 1.0] it moved the
     *  owner's own week-933 row +44% on fame and +131% on worth, which is a retune of the top wearing
     *  an early-career label.
     *
     *  ⚠ THE SIZES ARE THE MEASUREMENT'S, not a guess, and the binding criterion is ROUND 32 #3'S OWN:
     *  that wave sized `value.unknownX` as «the highest value that still reads single digits on the
     *  shop row at his fame», and this wave may not undo it by pushing that fame back up. This is the
     *  largest gradient of its shape under which his w933 row still reads 9 years – fame 22.33 -> 23.69
     *  (+6.1%), the floor 12.85 -> 13.63. docs/specs/collaborations-as-early-fame-2026-08.md §7
     *  records predicted vs measured and the frontier either way.
     *
     *  ⚠⚠ ROUND 34 (03.09) – A FIFTH RUNG WAS PREPENDED BECAUSE `advertising.bands` GAINED A FIFTH
     *  BAND, AND THIS IS NOT A RETUNE: the four shipped rungs are unchanged to the digit and have
     *  simply moved one index to the right, so ≤200 is still 0.04, ≤100 still 0.06, ≤50 still 0.08
     *  and ≤10 still 0.11. Leaving the array at four entries would have been the silent defect –
     *  `shootFloorByBand[band] ?? 0` reads the TOP band's index, so the global house's shoots would
     *  quietly have started buying ZERO fame.
     *  ⚠ THE NEW ≤400 RUNG IS NOT A FIGURE THE OWNER SIZED – he approved the band and its cheques,
     *  and this is the arithmetic the prepend forced – SO THE SHIPPED GUARD PICKED IT rather than a
     *  preference. The ladder is 0.01 x [4, 6, 8, 11] and its own unit continued downward gives 0.03;
     *  0.02, the first DIFFERENCE continued downward, would stretch the whole ladder's span from
     *  2.75x to 5.5x and break round 32 #5's «a global house, not a hundred of them» bound (< 4x),
     *  which was measured rather than chosen. 0.03 keeps that bound at 3.67x and leaves the span
     *  ABOVE the round-32 anchor – the ≤200 rung upward – identical at 2.75x. The criterion sets the
     *  constant, exactly as `merch.crowd.refRoom` was solved backwards from its own anchor. */
    shootFloorByBand: [0.03, 0.04, 0.06, 0.08, 0.11] as readonly number[],
    /** ⭐⭐ ...AND IT IS FORGOTTEN FASTER THAN A TITLE, WHICH IS THE OTHER HALF OF HIS RULING. He put
     *  the decay question back with both halves of the tension named: «наверное истлевает (мало кто
     *  смотрит журналы 2 годичной давности) … с другой стороны "что попало в интернет осталось
     *  навсегда"».
     *
     *  ⭐⭐ THE TWO HALVES ARE TWO DIFFERENT THINGS AND SEPARATING THEM IS THE DESIGN. The CAMPAIGN'S
     *  NOISE – her face on a shelf this season – fades, and faster than a championship, which is a
     *  sporting fact recited in every broadcast for years. THE ASSOCIATION – «she was the face of
     *  Faro Automobiles» – does not expire, and it is carried by BRAND STRENGTH
     *  (`business.merch.strength`), not by a second permanent term in here.
     *
     *  ⚠ AROUND ONE SEASON, AGAINST A TITLE'S TWO. Half of a campaign is forgotten by the next
     *  winter, which is his magazine sentence as a number.
     *
     *  ⚠⚠ AND IT IS WHAT KEEPS THE TERM BOUNDED. A permanent per-shoot addition accumulates without
     *  limit over a twenty-season career and would need a cap chosen out of the air; a decaying
     *  pulse needs none, because a steady cadence of shoots converges.
     *
     *  ⭐⭐⭐ ROUND 32 #5 EXTENSION (31.08) – AND IT IS A LADDER RATHER THAN ONE NUMBER, BECAUSE REACH
     *  BUYS DURABILITY AND NOT ONLY VOLUME. THE OWNER: «у нас есть популярные сайты, журналы и
     *  бренды, а есть менее популярные, о которых знает мало людей … чем больше она была в сильных
     *  контрактах – тем больше у нее велосити». What shipped first scaled only the SIZE of the
     *  addition by the band and gave every band the same 52 weeks – so a global house and a local
     *  retainer were told apart by loudness and then forgotten at identical speed. A placement seen
     *  by millions leaves a mark that outlives its campaign; a flyer in one town is gone by the next
     *  season.
     *
     *  ⚠ HIS OWN EXAMPLE IS NOT THE ARGUMENT. He hedged it himself («как то женщин из номинации
     *  плейбоя помнят довольно долго … но может быть я ошибаюсь») and it has not been checked here,
     *  so it carries no weight. The general principle carries the design on its own.
     *
     *  ⚠⚠ THE TOP RUNG IS STILL SHORTER THAN A TITLE'S 104 WEEKS, which is the binding half of his
     *  earlier ruling and is not negotiable by this extension: a campaign is one season's wallpaper
     *  and a championship is recited in every broadcast for years. 78 weeks is a season and a half.
     *
     *  ⚠ THE SIZES ARE MEASURED, and the criterion is the one this ladder exists to satisfy: two
     *  careers with the SAME delivered shoots at different bands must diverge VISIBLY years later.
     *  At the shoot week the bands differ 2.75x (the sizes above); three years on this ladder has
     *  widened that to ~44x, because band 0 has faded through six half-lives and band 3 through two.
     *  ⚠ Band 2 is left at the shipped 52 on purpose – the anchor round 32 #5 was sized on does not
     *  move, so what this extension changes is the SPREAD and not the level.
     *  docs/specs/collaborations-as-early-fame-2026-08.md §11 records the frontier either way.
     *
     *  ⚠⚠ ROUND 34 (03.09) – A FIFTH RUNG, FOR THE SAME REASON AND ON THE SAME TERMS AS
     *  `shootFloorByBand` ABOVE. The four shipped half-lives are unchanged and have moved one index
     *  right (≤200 still 26, ≤100 still 39, ≤50 still 52, ≤10 still 78); the new ≤400 rung is this
     *  ladder's own 13-week step continued downward, a quarter of a year, and is the arithmetic the
     *  prepend forced rather than a figure the owner sized. */
    shootFloorHalfLifeByBand: [13, 26, 39, 52, 78] as readonly number[],
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
       *  наказываем» read against a valuation.
       *
       *  ⚠⚠ ROUND 32 #3 (31.08) AMENDED THE PARAGRAPH ABOVE AND IT IS NAMED HERE RATHER THAN QUIETLY
       *  LEFT WRONG. «They move the worth and not the income» is still true of these four rungs. What
       *  is no longer true is «the multiple is the accumulated career and fame does not appear in it»:
       *  the BASE the four rungs sit on is now a ramp in fame (`unknownX` below), on the owner's
       *  ruling «главное, чтобы эта известность участвовала в механизме». So the four rungs are a
       *  PREMIUM ON TOP of what the brand's own size already earns, which is what they were always
       *  described as and were not. Two consequences, both deliberate and both measured in
       *  docs/specs/brand-multiple-follows-fame-2026-08.md: a title is now priced in the multiple as
       *  well as in the income (§3), and the multiple can FALL (§6). */
      value: {
        /** ⭐⭐⭐ ROUND 32 #3, 31.08 – THE MULTIPLE A BRAND NOBODY HAS HEARD OF EARNS, and the bottom
         *  of the fame ramp that replaced the flat base. The arithmetic is `world/brand.ts`.
         *
         *  THE OWNER, on his own w933 career – fame 22.3, the brand taking $1,720 a week and priced
         *  at $1.63M: «личный бренд в цене подрос с 250к до 1.8м, а доход у него 1800 в неделю =)))
         *  что как-будто бы не очень соответствует стоимости.» And his ruling on the repair: «её
         *  известность 22.3 – да, это ок, главное, чтобы **эта известность участвовала в механизме**,
         *  тогда мы увидим разницу на других карьерах.»
         *
         *  ⚠⚠ THE DEFECT WAS THAT `earningsMultipleX` WAS THE WHOLE BASE AT EVERY FAME. Every term of
         *  the ladder below reads her TENNIS CAREER and none read the brand, so an unknown's brand
         *  traded at 14x and a fourteen-season veteran earned 18.23x on a business turning over $89k
         *  a year. Real multiples rise with the SIZE of the business, and the size of this business
         *  is her fame.
         *
         *  ⭐⭐ THE RAMP RUNS FROM HERE TO THE RUNG'S OWN `earningsMultipleX` AT `ECONOMY.fame.cap`,
         *  so at fame 100 the multiple is EXACTLY what it was before this change for every career –
         *  the ceiling is not cut, which is his other standing ruling («вроде бы как раз спонсорские
         *  коллаборации со спортсменами дают и не такое, кратно большее»). Only the bottom moves.
         *
         *  ⚠⚠ 2.5 IS THE HIGHEST VALUE THAT STILL READS SINGLE DIGITS AT THE FAME HE ASKED ABOUT, and
         *  it is chosen that way ON PURPOSE: every point of it is a point of the day-one anchor round
         *  30 #9 measured, so the setting is the LEAST aggressive one that answers him. At 2.5 his
         *  w933 row reads 9.30x and $832k; at 4 it reads 10.5x, which the shop rounds to «11 years»
         *  and does not answer him at all. It also sits inside the two-to-five band a firm earning
         *  $89k a year changes hands at. The frontier, and what it costs the day-one anchor, is
         *  measured in docs/specs/brand-multiple-follows-fame-2026-08.md §4. */
        unknownX: 2.5,
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
         *  income through fame, and pricing them twice is the one-dial defect wearing a new hat.
         *
         *  ⚠⚠ ROUND 34 #17 (03.09) – AND NOW THE FINALS ARE IN THE INCOME TOO (`fame.finalFloorShare`),
         *  so the sentence above no longer separates them. THE TERM STAYS, deliberately, on the
         *  measurement: with both live the owner's week-569 multiple reads 6.20x – inside the 6–9x
         *  corridor round 32 repaired the free float to – and holding this term out drops the brand's
         *  worth to $90,614 against the $104,044 he approved. The approved figure was measured with
         *  this term live, so the approved figure is the ruling. */
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
         *  than picked.
         *
         *  ⚠⚠ ROUND 32 #3 – AND IT IS NO LONGER WHAT HOLDS THE TOP, WHICH IS THE MEASUREMENT THAT
         *  WAVE WAS ASKED FOR. With the base a ramp in fame, worth goes as fame³ until this binds,
         *  and it binds at fame ≈ 92 for a career maxed on all four rungs and NEVER for a typical
         *  one. What holds the top instead is the ramp's own endpoint: it reaches the rung's
         *  `earningsMultipleX` exactly at `ECONOMY.fame.cap`, so at fame 100 the multiple is
         *  identical to the pre-round-32 one for every career, cap or no cap. The crossover and the
         *  proof are docs/specs/brand-multiple-follows-fame-2026-08.md §5. */
        maxX: 20,
      },
      /** ⭐⭐⭐ ROUND 30 #23, 30.08 – THE ROOM SHE PLAYS IN. Its own block, and the arithmetic is
       *  `world/brand.ts`' `brandCrowdMult`.
       *
       *  THE OWNER, overruling the `[GAP]` this wave had filed on the crowd: «у нас есть понимание
       *  коридора зрителей на каждом турнире, мне кажется этого достаточно вполне.»
       *
       *  ⚠⚠ THE CORRIDOR, NEVER THE DRAW. `season/preview.ts`' `eventCrowd` is a per-event roll and
       *  stays decorative – its grep guard in tests/preview.test.ts is untouched and still passes.
       *  What the brand reads is `tierCrowdMid`, the static table under it, so a valuation stays a
       *  fold over history with zero draws.
       *
       *  ⚠ IT MULTIPLIES THE INCOME, CENTRED ON 1, AND IS BOUNDED BOTH WAYS – it can tilt what the
       *  brand earns and can never carry it. Sized so the median career reads ≈1.00 the week it can
       *  first afford the brand, which is what keeps round 30 #9's day-one anchor where it was.
       *  Measured in docs/specs/brand-worth-and-income-2026-08.md §5. */
      crowd: {
        /** ⭐⭐ THE ROOM THE MULTIPLIER IS CENTRED ON, in people, AND IT IS MEASURED RATHER THAN
         *  PICKED: the median room a family is playing in the week it can first afford the brand.
         *  ⚠ THAT POPULATION AND NOT THE CAREER-WIDE ONE, on purpose – centring on the career-wide
         *  median (≈2,277) is what the first draft did, and it moved round 30 #9's day-one worth by
         *  4.4% because a young career plays smaller rooms than an old one. Centring here is what
         *  makes the term neutral on the day the decision is made.
         *  ⚠⚠ SOLVED BACKWARDS FROM THE BENCH RATHER THAN GUESSED, twice. 1,500 (the first draft's
         *  guess) moved the day-one worth −4.4%; 1,250 (the measured median room at first
         *  affordability) still left −2.8%, because the population's rooms straddle the clamp and the
         *  median of a clamped ratio is not the ratio of the medians. 940 is the value at which the
         *  MEDIAN DAY-ONE MULTIPLIER IS 1.00 and round 30 #9's anchor comes back to the cent it was
         *  published at. The criterion is the anchor, so the criterion sets the constant. */
        refRoom: 940,
        /** ⚠⚠ A TENTH-POWER, AND THE FIRST DRAFT'S QUARTER WAS MEASURABLY WRONG. At 0.25 the term
         *  ran 0.85–1.35 with BOTH clamps binding inside the deciles, pushed the best career's income
         *  to $2.1M/yr – through the ceiling of the researched band – and moved the day-one anchor.
         *  It was not tilting the answer, it was carrying it, and since the room is 0.93-correlated
         *  with fame (spec §5) an amplifier here is mostly a second fame ramp. At 0.10 the term is a
         *  tilt: what survives is the part of the room that rank does NOT predict, which is the only
         *  part worth having. */
        exponent: 0.1,
        minMult: 0.9,
        maxMult: 1.15,
      },
      /** ⭐⭐⭐ ROUND 32 #4 (31.08) – THE BRAND'S SECOND, SLOWER STOCK. `world/brandStrength.ts` is
       *  the arithmetic and docs/specs/brand-inertia-2026-08.md is why.
       *
       *  THE OWNER: «А еще интересно, что будет происходить с годами падения в таблице (как у нее
       *  сейчас) – известность тоже будет падать и стоимость бренда, соответственно?» – and, on
       *  being shown the answer: «Инерция бренда – звучит интересно, давай попробуем».
       *
       *  ⚠⚠ THE MEASUREMENT THAT FORCED IT, off his own week-933 career projected five years with
       *  nothing won: $831,382 -> $9,098, a 99% capital loss. The cause is arithmetic and not
       *  tuning – fame halves every 104 weeks, the income goes as fame² and since round 32 #3 the
       *  multiple rises with fame too, so the WORTH goes as fame³ and falls eightfold every two
       *  years. A brand is not a live reading of attention: once built it holds a name, a shelf, a
       *  distribution and a customer who already owns two of its shirts.
       *
       *  ⭐⭐ SO INCOME AND WORTH READ DIFFERENT CLOCKS. Income is a FLOW and keeps reading fame –
       *  this year's noise really does sell this year's shirts. Worth is a STOCK and reads STRENGTH:
       *  the best she has ever been, faded on a half-life measured in YEARS and never falling below
       *  a share of that best. HIS RULING, both halves: «падает, но с полураспадом в годах, плюс пол
       *  в доле от пика – чтобы карьера, которая реально была большой, никогда не оценивалась по
       *  минимуму. – да» ⚠ The floor is HER OWN peak and not a global mark: a big career never
       *  prices at the minimum, a small one still can. */
      strength: {
        /** ⭐⭐ THE STOCK'S HALF-LIFE, IN WEEKS – four years against fame's two. «с полураспадом в
         *  годах» as a number: two seasons after a reign the brand is still worth ~70% of it, four
         *  years ~50%, and it lands on the floor below rather than on zero. ⚠ It must be LONGER
         *  than `ECONOMY.fame.halfLifeWeeks` or there is no second stock at all – only fame wearing
         *  a slower coat, and the split the spec exists for collapses. */
        /** ⚠⚠ ROUND 38 #2c RAISED THIS 208 -> 312 (six years). The owner: «делая его более плавным».
         *  208 made the STOCK fall 15.9% a season, which – once `retention` below let the stock
         *  govern the tail at all – was the whole of the slope he was complaining about. Measured
         *  with it: his week-1115 career's brand falls 23.3% a season instead of 27.2%, and its
         *  five-year tail holds $822,515 instead of $185,285. */
        halfLifeWeeks: 312,
        /** ⭐⭐ ...AND THE FLOOR, AS A SHARE OF HER OWN PEAK. A career that was genuinely big never
         *  prices at the minimum however long the silence runs; a career that was never noticed has
         *  a peak of nothing and a floor of nothing, so this hands an unknown exactly zero.
         *  ⚠ IT IS A SHARE AND NOT A FLOOR IN POINTS, which is the personal half of his ruling: 0.4
         *  of a Slam champion's peak is a large brand and 0.4 of a club player's is still nothing.
         *
         *  ⚠⚠ ROUND 38 #2c RAISED THIS TO 0.5 AND THE OWNER SENT IT BACK THE SAME DAY, so it is 0.4
         *  again – his own round-32 number, untouched. His words, 07.09: «он вполне может падать и на
         *  185к и ниже, особенно если давно не было рекламных контрактов… А ставить планку "не ниже
         *  662к" – это немного странно, кому нужен бренд, если он пустой?» ⚠ THE MEASUREMENT THAT
         *  PROMPTED THE RAISE STANDS AND IS NOT THE ARGUMENT FOR IT: 0.4 / 0.5 / 0.55 / 0.65 are
         *  IDENTICAL at every live week on 29 of his careers and differ only in where the fall stops,
         *  five years out. What he is asking is whether it should stop at all, and that is a design
         *  question about the FORMULA rather than a value for this constant – see
         *  docs/specs/fame-presence-2026-09.md §5. */
        floorShare: 0.4,
        /** ⭐⭐⭐ REVISION (31.08) – HOW MUCH OF THE STOCK STILL SELLS SHIRTS, 0..1. THE OWNER, reading
         *  the first shipped result and stopping it: «меня смущает вот это: На пятом году бренд
         *  стоит $166 060 при годовом доходе $1 352».
         *
         *  ⚠⚠ HE IS RIGHT AND THE FAULT WAS THE SPEC'S. The first pass floored the WORTH and left
         *  the INCOME a bare function of fame, so the income still fell 98.7% over five years while
         *  the valuation held – 123x annual earnings, which is not a valuation. THE MEMORY WAS IN
         *  THE WRONG PLACE: the premise was always that a brand keeps «a name, a shelf, a
         *  distribution and a customer who already owns two of its shirts», and that customer keeps
         *  BUYING when she stops winning. So it is the REVENUE that must not collapse; a stable
         *  valuation is the consequence and not a second thing to install.
         *
         *      effectiveReach = max(fame, retention x strength)
         *
         *  ⭐⭐ THE TOP IS PRESERVED BY CONSTRUCTION AND NOT BY A CLAMP, and this constant being
         *  STRICTLY BELOW 1 is the whole of that proof: strength equals fame at the cap and at every
         *  running peak, so `retention x strength < fame` there and the reach IS fame – the income
         *  curve at the top is the pre-wave one term for term. The floor can only ever bind on the
         *  way down, which is the only place he asked anything to move.
         *
         *  ⚠⚠ AND THE SIZE IS MEASURED AGAINST THE ONE DOCUMENTED CASE THIS REPO HOLDS OF AN
         *  OFF-COURT INCOME WHEN THE WINNING STOPS: Naomi Osaka, ~$60M (2021) -> $12.0M (2024),
         *  −75% in three years WITH ESSENTIALLY NO SPONSORS LOST – «the fall is playing time»
         *  (docs/research/player-brands-and-what-they-are-worth.md §4e). The income goes as reach²,
         *  so a −75% three-year fall is a reach holding half of itself, and this is the value that
         *  lands there on his own row. Before the revision that same three-year fall was −92%.
         *  ⚠ It is a BOUND drawn from one case and not a law; the frontier either side of it is in
         *  docs/specs/brand-inertia-2026-08.md §18, and moving it is a decision about how much of a
         *  business survives its founder's silence rather than a correction. */
        /** ⚠⚠ ROUND 38 #2c RAISED THIS 0.78 -> 0.95, AND IT IS THE DIAL THAT MAKES THE OTHERS WORK.
         *  Measured: at 0.78 the stock floors the reach at 78% of the best she has been, so lifting
         *  her FAME (the season ladder above) simply pushed her back OFF the floor and onto the fast
         *  title clock – the level rose and the SLOPE GOT WORSE, -27.2% a season becoming -33.8%. At
         *  0.95 the stock binds again and the tail is governed by the stock's own six-year clock,
         *  which is what «более плавным» asks for: -23.3%.
         *  ⚠ IT STAYS BELOW 1 AND THAT IS LOAD-BEARING – see this block's own header: `retention < 1`
         *  is the entire proof that the top of the shelf cannot move, and the measurement confirms it
         *  (his two peak careers read the same worth to the cent at 0.78, 0.85, 0.90 and 0.95). */
        retention: 0.95,
      },
      /** ⭐⭐⭐ ROUND 34 #17 (03.09) – THE BRAND FOLLOWS THE CONTRACTS. Approved by the owner:
       *  **+1 point of reach per $50,000 of LIVE annual contract value, the contribution capped at
       *  +30.**
       *
       *  ⚠⚠ THE INCOHERENCE IT ENDS, MEASURED ON HIS OWN WEEK-569 SAVE. The sponsor market prices
       *  her at $550,000 a year of live deals (and priced her at $1,000,000 a year through weeks
       *  404–452, her fullest shelf), while the brand model said her whole brand was worth $76,822
       *  and paid $244 a week: her brand was worth less than one of her own contracts for one year.
       *  His words: «плюс есть мощные рекламные контракты… мне кажется нам надо улучшить формулу
       *  рассчета доходности и стоимости ее бренда».
       *
       *  ⚠⚠ A SIGNAL INTO REACH, NEVER A CASH TRANSFER, and that distinction is the whole safety of
       *  it. The sponsor money already arrives through the deals themselves (`bankSponsorCheque` at
       *  signature, `payAdAnniversaries` each year); adding it to the brand's INCOME as well would
       *  pay her twice for one contract. What it says instead is that a house paying her seven
       *  figures has decided she is worth being seen with – which is a fact about how many people
       *  know her name, i.e. about reach, and the existing curve does the rest.
       *
       *  ⭐⭐ THE CAP IS THE POINT AND IS NOT DROPPABLE. Contracts lift the floor under an unglamorous
       *  professional – the whole complaint – but an icon is still made by titles and not by her
       *  agent. A top-10 shelf is worth $9.2M a year, saturates this term nearly twenty times over
       *  and has to win the rest.
       *
       *  ⚠ AND THE TOTAL IS STILL CLAMPED AT `ECONOMY.fame.cap` where it is spent (`brandReachOf`),
       *  so the top of the shelf that round 32 #3 fixed by construction cannot move. This lifts the
       *  middle and the bottom, which is where he was standing. */
      contracts: {
        /** cents of live annual contract value per point of reach */
        famePerCents: 50_000_00,
        /** ...and the most the whole term may ever add */
        fameCap: 30,
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
      /** ⭐⭐⭐ ROUND 34 #17 (03.09) – THE LADDER REACHES BELOW THE TOP 100. Approved by the owner:
       *  top-150 +0.05, top-250 +0.025.
       *
       *  ⚠⚠ WHAT IT ENDS, measured on his own save: eleven seasons, eight of them carrying a WTA
       *  end-rank – #349, #177, #95, #92, #89, #93, #97, #113 – and the only rung that paid anything
       *  was top-100, five times, for 0.50 in total. Six consecutive seasons inside the world top 115
       *  and three of them recorded NOTHING, because #113 and #177 were below the lowest rung there
       *  was. ⭐ That is the case for the two new rungs in one line: a career can hold the top 150
       *  for a decade and the model can barely see it. */
      reputationBands: [
        { maxEndRank: 10, add: 0.6 },
        { maxEndRank: 25, add: 0.35 },
        { maxEndRank: 50, add: 0.2 },
        { maxEndRank: 100, add: 0.1 },
        { maxEndRank: 150, add: 0.05 },
        { maxEndRank: 250, add: 0.025 },
      ] as readonly { maxEndRank: number; add: number }[],
      /** ⭐⭐⭐ ROUND 34 #17 (03.09) – THE CAP GROWS WITH THE CAREER instead of the flat 4-for-ever it
       *  was: `reputationCapBase + reputationCapPerSeason x professional seasons played`. Approved
       *  by the owner at 4 + 0.5 – «so a long professional career is worth something and a short one
       *  is not».
       *
       *  ⚠⚠ AND THE MEASURED CONSEQUENCE IS THAT IT STOPS BINDING AT EVERY REALISTIC CAREER LENGTH,
       *  which is reported rather than adjusted (the figures are his). The bands can add at most 0.6
       *  a season, so the ceiling only catches the ladder when 1 + 0.6n > 4 + 0.5n, i.e. past THIRTY
       *  professional seasons. A twenty-season career spent entirely in the world top 10 – already
       *  far beyond anything the engine produces – reaches 13.0 against a cap of 14.0 and never
       *  touches it. What holds the academy's reputation now is the band ladder itself.
       *
       *  ⚠ AND IT MOVES THE P7 PAYBACK WINDOW. `academy.stageIncomeCents` was sized so the $12M
       *  academy repays in 5–10 seasons AT THE CAP; that window is the reputation band 3.18–6.37, and
       *  a long elite career can now stand above it (rep 6.4 needs nine top-10 seasons). Recorded in
       *  docs/rounds/round-34.md under item 17 for his eye – not compensated for here. */
      reputationCapBase: 4,
      reputationCapPerSeason: 0.5,
      /** ⭐⭐⭐ ROUND 38 #8 (07.09) – HOW MUCH ONE POINT OF REPUTATION ADDS TO WHAT THE ACADEMY IS
       *  WORTH, as a share of the drifted price. `worth = paid x (1+300bps)^years x (1 +
       *  premiumPerRep x (reputation − 1))`. Option C, which the owner approved out loud: «хорошо
       *  звучит».
       *
       *  ⚠⚠ IT STARTS AT EXACTLY ZERO AND THAT IS THE DESIGN, not a coincidence of the number.
       *  Reputation is 1.0 for every career that has not banked a season (`academyReputationOf`),
       *  so the premium is `0.15 x 0` on the day the shelf opens and the paid price times the drift
       *  is a FLOOR. See `academyPremiumX` for why the clamp under it is written down anyway.
       *
       *  ⭐⭐ WHY 0.15, AND IT IS A BAND FROM THE RESEARCH RATHER THAN A FEELING. The two published
       *  player-academy/brand transactions this repo has found are the Nadal academy at ~31x
       *  earnings and Beckham's DRJB at ~10.9x (docs/research/player-brands-and-what-they-are-worth.md
       *  §5.4) – a going concern on real property trades ABOVE its bricks, and the question this
       *  number answers is by how much. ⚠ MEASURED ON HIS OWN WEEK-1115 CAREER rather than argued
       *  (`npx vite-node tools/r38-academy-worth.ts`): at reputation 2.825 it prices his two stages
       *  at $6,890,384 against $5,409,526 of drifted bricks – a **+27.37% premium**, so the going
       *  concern is a bit over a quarter of the row and the land and the courts are the rest of it.
       *  The alternative measured at the same time was option B, earnings x a multiple, which read
       *  $1.4M against $5.0M paid and was refused for saying an academy is worth less than its own
       *  land.
       *
       *  ⚠ AND IT DOES NOT COMPOUND. This is a LEVEL on the drifted price, not a second rate: an
       *  academy at a steady reputation gains 3% a year and no more, which is what keeps «assets
       *  never beat a career, they only survive one» true of the dearest thing on the shelf. What
       *  moves the premium is her seasons – so the career pays for it, which is the whole of option
       *  C. ⚠ At the reputation cap a long elite career can reach (8.2 on twelve top-10 seasons) the
       *  premium is +108%; the academy doubles, over a career that spent twelve years in the world
       *  top ten to do it. */
      premiumPerRep: 0.15,
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
      /** by the plan's calibration: first points 17-18, top-100 about 4.5 years later.
       *
       *  ⚠⚠ SINCE ROUND 31 #10 THIS PAIR IS THE **DEFAULT** CURVE, NOT THE ONLY ONE. It is what a
       *  career runs on before the fork at nineteen has been answered – nothing can read it there,
       *  because `plateauStart` first bites at 18 and `declineStart` at 23 – and it is what the v68
       *  migration PINS every career that already existed onto. The per-route pair a new career
       *  resolves at the fork is `ageRoutes` below. See `development.ts#resolveAgeCurve`. */
      plateauStart: 23,
      /** peak 23-28 – and it is the COLLEGE window, which is the whole of round 31 #10 */
      declineStart: 29,
      /** share of remaining headroom taken per week at the steepest age */
      peakRate: 0.0062,
      /** how much of that is gone by `growthEnd` (0.5 = half the rate at 18 that she had at 13) */
      growthEase: 0.5,
      /** ⭐⭐⭐ ROUND 38 #17 (07.09) – 0.0009 -> 0.0027, AND IT IS C1 AND C3 TURNING OUT TO BE ONE DIAL.
       *
       *  THE OWNER, on the coach: «нет варианта, что они и дальше гармонично сотрудничают до
       *  абсолютного потолка» – he read it as a fact about COACHES and it is not. Measured: at 23 the
       *  weekly rate sits on this number, so with an elite coach, a great fit and a grind plan a year
       *  buys about 5-7% of what headroom is left; on two remaining points that is the «+0,1%» he was
       *  seeing. No coach can be the one who takes her all the way, because the PLATEAU is what has
       *  flattened, not the coaching.
       *
       *  ⚠ AND IT IS THE SAME LEVER C1 NEEDED. His «рост как раз идёт до 28-29» is already true –
       *  careers peak at 26.6 direct and 28.6 via college – so nothing about the phase BOUNDARIES had
       *  to move; what was missing is that the late years were worth almost nothing. One number
       *  answers both, and the boundaries stay where his own reference table puts them.
       *
       *  MEASURED (`tools/r38-ceiling-dials.ts`, the analytic share of her own headroom that can EVER
       *  arrive, walked to 38 – `skill-ceiling.ts` §1's arithmetic):
       *
       *      arm                     nonsense  self-run-well  coach+fit  coach-off  elite  yardstick  spread
       *      shipped 0.0009             61.2%          92.3%      92.4%      90.0%  97.3%      98.3%    37.1
       *      x3      0.0027             75.1%          97.7%      97.7%      96.6%  99.5%      99.7%    24.7
       *      x3 + the fit span below    67.0%          98.9%      98.9%      93.2%  99.8%      99.9%    32.9
       *
       *  ⚠⚠ ON ITS OWN IT NARROWS THE SPREAD – it lifts the bottom more than the top, because the top
       *  was already at 98%. That is why it ships WITH the fit span and not before it: the pair moves
       *  the well-run career to 98.9% while a mismatched partnership falls to 93.2%, which is the
       *  «три пути должны различаться» half. The owner picked that row: «очень хорошо выглядит». */
      plateauRate: 0.0027,
      /** share of an attribute lost per week at `declineStart` */
      declineRate: 0.00035,
      /** ...growing each year past it, so a career ends rather than fading forever.
       *
       *  ⭐⭐⭐ ROUND 38 #3d (06.09) – 0.28 -> 0.22. THE OWNER: «я вижу ветеранов на корте, да, они уже
       *  не могут так быстро бегать, как раньше, но они и не беспомощны… Может разве что тоже плавнее
       *  сделать.»
       *
       *  ⚠⚠ AND HE ALLOWED THE OTHER HALF TO STAY – «Хотя может быть для формального окончания игры
       *  это и ок» – which is the constraint this number is chosen against rather than a courtesy.
       *  `ENDINGS.lastOfferPeakShare` is 0.55 and `ending.ts` marks an off-season offer FINAL at or
       *  below it, so the body must still be able to end a career. Measured
       *  (`tools/r38-decline-shape.ts`, exact arithmetic – past `declineStart` nothing else moves a
       *  physical attribute, so the share of peak is the product of the weekly factors):
       *
       *      accel   loss/season at 35   share at 40   body can end the career at
       *      0.28              4.76%          0.601                            42
       *      0.24              4.35%          0.628                            42
       *      0.22              4.14%          0.642                            43
       *      0.18              3.72%          0.671                            44
       *      0.14              3.29%          0.701                            45
       *
       *  ⚠⚠ 0.24 AND NOT 0.22, AND THE REASON IS A PIN THIS REPO LEFT AS A TRIPWIRE. `ending.test.ts`
       *  pins that the off-season her body first falls to 70% is the off-season she is first 38 –
       *  the equivalence that let `ENDINGS.stopAskingAgeYears = 38` be DELETED and replaced by a
       *  body-share rule, and whose own comment says «if this line ever needs changing then the claim
       *  the change was sold on has stopped holding». Measured: at 0.22 she reads 0.7019 at 38 and
       *  crosses during her 39th year – the equivalence breaks by 0.0019 of share. At 0.24 she reads
       *  0.6905 at 38 and the body and the birthday name the SAME off-season, exactly as before.
       *  So the softening is taken right up to that pin and stops there.
       *
       *  ⚠ A FLOOR WAS MEASURED AND REFUSED: at 0.45 or 0.50 it never binds before 0.55 is crossed,
       *  so it would have been decoration.
       *
       *  ⚠⚠ AND IT IS NOT WHAT CAUSED HIS «из топ-50 до топ-150 за сезон». That fall is her ABSOLUTE
       *  level against the field's – she is at 47 on four attributes where the tour's elite sit at
       *  65-70 – so any loss at all is decisive there. This dial softens the slope; the level is C2's
       *  question and it is still open. Said out loud so the next reader does not credit this change
       *  with a fix it does not deliver. */
      declineAccel: 0.24,
    },
    /** ⭐⭐⭐ ROUND 38 #6c (07.09) – WHICH SKILLS AGE, AND HOW FAST RELATIVE TO EACH OTHER.
     *
     *  THE OWNER: «может быть и навыки могут деградировать, это вполне ок, надо только подумать
     *  какие и с какой скоростью» – and, on the four below: «веса ок, строй и меряй пожалуйста».
     *
     *  ⚠⚠ WHAT THIS ENDS. `growWeek`'s decline branch charged `decline x skills[k]` to all four
     *  physical attributes at the SAME proportional rate, so a thirty-five-year-old lost her serve
     *  at exactly the rate she lost her legs. Nothing about that was wrong arithmetic; it was
     *  shapeless, and it is the one thing every tennis broadcast in the world says is not true.
     *
     *  ⚠⚠⚠ THESE ARE RAW WEIGHTS AND THE CODE NORMALISES THEM, WHICH IS THE WHOLE SAFETY OF THE
     *  CHANGE AND IS DELIBERATELY NOT FOUR HAND-TYPED DECIMALS. `ageWeightOf` divides by their own
     *  mean, so `mean(normalised) === 1` holds BY CONSTRUCTION however these four are retuned –
     *  and that is what keeps `physicalMean(skills) / peakPhysical` on its old path. Three things
     *  read that ratio and none of them may move: `ENDINGS.lastOfferPeakShare` (the last off-season
     *  offer), `recoveryAgeFade` (the corridor), and `realisedShare` (the coach's ceiling read).
     *  ⚠ A fifth attribute appended to `SKILL_KEYS` without a row here reads 1 and is therefore
     *  ordinary, never zero – see `ageWeightOf`.
     *
     *  ⚠ COMPOSURE IS ABSENT ON PURPOSE and would be inert if present: `isPhysicalSkill` excludes
     *  it from the decline branch entirely and it GAINS `veteranPoise` past the peak instead.
     *
     *  Measured predicted-against-measured in docs/specs/what-ages-first-2026-09.md §3. */
    ageWeight: {
      /** struck from a standing start – the last thing to go, and a serve is a career extender */
      serve: 0.6,
      /** the return is movement and reaction before it is technique */
      ret: 1.2,
      /** endurance goes first and fastest, and it is the loss everybody can see */
      stamina: 1.6,
      /** rally quality: half movement, half shot-making */
      groundstrokes: 1.0,
      // ⚠ TYPED `string` AND NOT `SkillKey`, AND THE REASON IS THE IMPORT GRAPH. `SkillKey` is
      // declared in `engine/development.ts`, which imports THIS file – a type-only import back
      // would still be a cycle for the tools' project (`match/style.ts` declares a second copy of
      // the union, and a third reader of it is not a trade worth making). The membership check
      // that a plain `string` gives up is made mechanically instead:
      // `tests/r38-age-weights.test.ts` asserts every key here is in `SKILL_KEYS`, so a typo
      // reddens rather than reading 1 in silence.
    } as Record<string, number>,
    /** ⭐⭐⭐ ROUND 44 – WHAT THE PAYROLL TAKES OFF THE DECLINE, AND NOTHING MORE THAN THAT.
     *
     *  THE OWNER, 17.09: «все эти специалисты должны его если не тормозить, то хотя бы сглаживать,
     *  а может у кого-то и тормозить даже немного.» `docs/specs/the-decline-and-the-seats-2026-09.md`
     *  §4 turns that shape into one rule: NO SEAT STOPS THE DECLINE; each softens the ONE attribute
     *  it has a real-world claim on, and the coach maintains all four a little.
     *
     *  ⚠⚠ THESE ARE SHARES OF THE ORDINARY WEEKLY LOSS, NOT NEW RATES, and the difference is the
     *  whole safety of the feature. `growWeek` charges `declineRate x ageWeightOf(k) x SHIELD x
     *  skills[k]`, where the shield is `Π(1 - share)` over the seats that apply – a product of
     *  factors each strictly inside [0, 1), so it is STRICTLY POSITIVE BY CONSTRUCTION and a fully
     *  staffed veteran still ages. That is the spec's own first pass/fail question answered in the
     *  shape of the arithmetic rather than in a measurement that could drift: there is no set of
     *  numbers anybody can write here that buys immortality, only one that makes the shield small.
     *
     *  ⚠⚠ AND NOTHING HERE MOVES `declineStart`, `declineRate` OR `declineAccel`. Round 38 #3d
     *  measured those and its own note warns the next reader off them; the spec's §5 rules them out
     *  by name. What this block changes is how much of the SAME curve a paid team absorbs.
     *
     *  ⚠ COMPOSURE IS ABSENT AND WOULD BE INERT, exactly as in `ageWeight` above: `isPhysicalSkill`
     *  keeps it out of the decline branch and it gains `veteranPoise` instead. So the psychologist
     *  has NO row here – the spec's §4 table says «no change» for that seat, because he is already
     *  aligned – and «all four» in the coach's row means the four PHYSICAL attributes.
     *
     *  Measured predicted-against-measured in docs/specs/the-decline-and-the-seats-2026-09.md §6. */
    declineCare: {
      /** ⭐ THE MASSEUR PROTECTS HER LEGS. Weekly body work is exactly what a veteran's endurance
       *  runs on, and stamina is the fastest-ageing attribute in the table above (weight 1.6), so
       *  it is both the honest claim and the one the player can feel.
       *
       *  ⚠ THE SHARE IS THE TOP RUNG'S. The rungs below it deliver a PROPORTION of it, derived from
       *  the seat's own `conditionBonusPerWeek` ladder (1/2/3) rather than written down again –
       *  see `declineCareShieldOf` in engine/development.ts. Without that, the cheapest rung would
       *  buy the whole shield and a veteran's correct play would be to drop to it, which is the
       *  farming hole the knock's rest branch already documents one module over.
       *
       *  ⭐⭐⭐ 0.25 IS DERIVED FROM THE `ageWeight` LADDER ABOVE AND IS NOT A FITTED NUMBER:
       *  `1 - ageWeight.ret / ageWeight.stamina` = `1 - 1.2/1.6` EXACTLY. The sentence it spells is
       *  «weekly body work makes her legs age like her RETURN, and never slower than that» – the
       *  seat moves its attribute exactly ONE RUNG down the tuned ladder and stops.
       *
       *  ⚠⚠ THAT SHAPE IS SELF-LIMITING BY CONSTRUCTION, WHICH IS WHY IT BEAT A ROUND NUMBER: no
       *  seat can ever make its attribute the SLOWEST-ageing one. The serve is the last thing to go
       *  with or without a payroll – `ageWeight.serve`'s own row says «a serve is a career extender»
       *  – and no amount of money reverses the order the tuned table puts the four in.
       *  `tests/round44-decline-care.test.ts` asserts this equals the ladder step, so a wave that
       *  retunes `ageWeight` reddens here and has to decide rather than drift. */
      masseur: { skill: 'stamina', topRungShare: 0.25 },
      /** ⭐ THE HITTING PARTNER PROTECTS HER RETURN. The return is reaction before it is technique
       *  (the `ageWeight` row above says so in its own words) and reaction is what match-style
       *  practice drills. Same top-rung doctrine, off this seat's own `driftCut` ladder.
       *
       *  ⭐⭐ AND THE SAME DERIVATION, ONE RUNG ALONG: `1 - ageWeight.groundstrokes / ageWeight.ret`
       *  = `1 - 1.0/1.2` = 0.1667. «Match-style practice makes her return age like her RALLY, and
       *  never slower than that.»
       *
       *  ⚠ SO THIS SEAT'S SHIELD IS SMALLER THAN THE MASSEUR'S WHILE ITS BILL IS LARGER, and that is
       *  said out loud rather than smoothed over: the LADDER'S OWN STEPS ARE UNEVEN (1.6→1.2 is a
       *  quarter, 1.2→1.0 is a sixth), the two seats are priced on their OTHER channels – the rust
       *  cut and the recovery table – and re-pricing a seat is not this spec's to do. Round 42 #48
       *  is where the hitting partner's money was measured; nothing here revisits it. */
      sparring: { skill: 'ret', topRungShare: 0.1667 },
      /** ⭐⭐ AND THE COACH MAINTAINS ALL FOUR, SLIGHTLY – the row that fixes something close to a
       *  defect. Past `declineStart` `ageFactor` returns 0, so `growWeek`'s whole GAIN term is zero
       *  and an elite coach multiplies nothing: a family paying elite money for a twenty-eight-year-
       *  old is buying literally nothing, and no screen says so. An elite coach's job past the peak
       *  is maintenance rather than growth, and this is the first term in the engine that says it.
       *
       *  ⚠ SCALED BY TIER AND FIT, AND THE SCALE IS DERIVED. `declineCareShieldOf` reads the week's
       *  own `coachFactor(tier, fit, chemistry)` – the number `growWeek` already computed – and
       *  places it between the self-coached rate and `coachFactor('elite', 'great')`. So the parent
       *  on the court buys exactly 0, a badly-matched budget coach also buys 0 (his rate is BELOW
       *  the parent's), and the ladder in between moves with `developmentFactor`, `fitFactor` and
       *  the chemistry term by construction rather than by a second table kept in step by hand.
       *
       *  ⭐⭐⭐ 0.08 IS THE ONE FITTED NUMBER IN THIS BLOCK, AND IT WAS SWEPT RATHER THAN CHOSEN.
       *  `npm run bench:decline` §2s moves it against four criteria written down BEFORE the run
       *  (invariant 5's own shape – «written down so the run can embarrass them»):
       *
       *      C1  the whole team absorbs <= 1/3 of the decline to 33
       *      C2  the staffed-vs-unstaffed gap is >= ONE season of ageing
       *      C3  ...and <= TWO
       *      C4  the coach ALONE is worth >= half a season, because §4's own ⭐ says a family paying
       *          elite money for a twenty-eight-year-old is «buying nothing at all», and a row that
       *          fixes that has to be visible on its own rather than only inside a full team
       *
       *  MEASURED, at the derived seat shares above (one season = 1.68 points, the whole decline to
       *  33 = 51.1 points over the four):
       *
       *      coach   absorbed   gap      seasons   coach alone   win prob.   verdict
       *      0.00       11.5%   +1.47      0.87          0.00       +0.90 pp  C2, C4 fail
       *      0.04       14.7%   +1.87      1.11          0.27       +1.54 pp  C4 fails
       *      0.06       16.3%   +2.08      1.24          0.40       +1.86 pp  C4 fails
       *      **0.08**   17.9%   +2.29      1.36          0.54       +2.19 pp  ⭐ meets all four
       *      0.10       19.5%   +2.49      1.48          0.68       +2.53 pp  meets all four
       *      0.14       22.8%   +2.91      1.73          0.95       +3.22 pp  meets all four
       *      0.20       27.7%   +3.54      2.11          1.37       +4.30 pp  C3 fails
       *
       *  ⭐ THE SELECTION RULE IS «THE SMALLEST THAT MEETS ALL FOUR», and «smallest» is the SPEC'S
       *  own word for this row – «a small maintenance term», «all four, slightly». So the criteria
       *  set the floor and the spec sets the direction; there is no step left for taste to take.
       *
       *  ⚠⚠⚠ IT WAS HELD AT **ZERO** FOR A DAY, AND THE REASON IS WORTH KEEPING BECAUSE THE FIXTURE
       *  IS WHAT SETTLED IT. At 0.08 this row turned the suite red in nine places across three
       *  files, every one of them pinning that `physicalMean / peakPhysical` is a function of AGE
       *  ALONE, and `tests/peak-physical.test.ts` said why in its own words – «a share threshold must
       *  not be a different rule for a rich girl than for a poor one». The previous builder held the
       *  row and escalated rather than loosening a tolerance, which was right.
       *
       *  ⚠⚠ THE MEASUREMENT THAT LOOKED LIKE CLASS – on that test's own three careers walked to 38
       *  (working/self · middle/middle · wealthy/elite):
       *
       *      coach term   working/self   middle/middle   wealthy/elite   spread    ≈ career
       *      0.00               71.47%          71.64%          71.49%   0.178pp    2 weeks
       *      0.08               71.47%          72.90%          73.35%   1.880pp   24 weeks
       *
       *  ⭐⭐ ...AND IT WAS A **STAFFING** DIFFERENCE WEARING A CLASS LABEL. The owner, 17.09: «на про
       *  уровне они все имеют условно одинаковый доход». `bornAt(seed, background, coachTier)` puts
       *  the tier in the PROFILE at creation and the fixture's walk ticks growth weeks only –
       *  NOTHING IN IT EVER HIRES ANYBODY – so the poorest arm read 71.47% because it was
       *  self-coached, not because a working family cannot afford a coach on the pro tour. The case's
       *  own comment says what it is for and it is not money: «three careers with deliberately
       *  different CEILINGS … must read the same share at 38». The claim is PROPORTIONALITY.
       *
       *  ⭐ SO THE PIN WAS SPLIT INTO THE TWO CLAIMS IT HAD BEEN CARRYING AT ONCE, and both are
       *  STRONGER than the one they replace – proportionality is now measured at identical staffing
       *  and holds to 0.0011pp across bodies 22 points apart (it was 0.20pp across 3.4), and «a paid
       *  seat changes the share» has a case of its own for the first time. See
       *  docs/specs/the-decline-and-the-seats-2026-09.md §7 and §8.
       *
       *  ⚠ WHAT THE ROW IS WORTH, RE-MEASURED WITH IT LIVE (`npm run bench:decline`, 17.09): the
       *  fully-staffed veteran at 33 holds serve 88.9% · ret 82.1% · stamina 79.0% · groundstrokes
       *  82.1% – still falling on every one of the four, so Q1 passes structurally – and the payroll
       *  hands back **+2.29 points = 1.36 SEASONS** of ageing and **+2.19 pp** of match-win
       *  probability (13.6% -> 15.8%). ⭐ That clears C2's «at least one season» floor, which the two
       *  seat rows alone MISSED at 0.87 – the coach row was the term the sweep said was missing and
       *  the re-run says so from the other side.
       *
       *  ⚠ AND IT CLOSES §4's «close to a defect»: past `declineStart` `ageFactor` returns 0, so an
       *  elite coach multiplied zero and a family paying elite money for a twenty-eight-year-old
       *  bought her tennis nothing at all. `tests/round44-decline-care.test.ts` section F is the
       *  other half of that – the coach MARKET quoted the same veteran «+0.0-0.0% a season», which
       *  was true at 0 and would have been a lie the day this shipped. */
      coachMaintenanceTop: 0.08,
      // ⚠ `skill` IS TYPED `string` FOR `ageWeight`'s OWN REASON, one concern up: `SkillKey` is
      // declared in `engine/development.ts`, which imports THIS file. The membership check a plain
      // string gives up is made mechanically instead – `tests/round44-decline-care.test.ts` asserts
      // both names are in `SKILL_KEYS` and are PHYSICAL, so a typo reddens rather than shielding an
      // attribute that does not exist in silence.
    } as { masseur: { skill: string; topRungShare: number }; sparring: { skill: string; topRungShare: number }; coachMaintenanceTop: number },
    /** ⭐⭐⭐ ROUND 31 #10 – THE FORK SHAPES THE CURVE, and until now it only priced it.
     *
     *  The owner supplied real WTA reference data and the round-31 ledger checked the engine against
     *  it (docs/rounds/round-31.md §10). His table:
     *
     *      modern top-100 peak window   24-26  direct       |  25-28  via college
     *      entry to top 100             ~21    direct       |  23-25  via college
     *
     *  The shipped `ageCurve` above peaks 23-28, which is EXACTLY the college window's top edge and
     *  two to four years late for a girl who went straight to the tour – so one curve was being worn
     *  by both routes, and it was the college one. His ruling, 31.08: «я думал уже так и есть, но
     *  тоже неплохо звучит.» He believed the fork already did this.
     *
     *  ⚠ THE COLLEGE PAIR IS TODAY'S PAIR, UNCHANGED. This is a change to the DIRECT route only:
     *  nothing about a college career moves, which is why the owner's own career (Alice went through
     *  college, weeks 294-502) reads identically under it before the pin is even considered.
     *
     *  ⚠ THE ROUTE IS THE FORK'S ANSWER AND NOT `world.college`. A career that leaves the programme
     *  early still went; reading the enrolment state would flip her back to the direct curve the week
     *  she came home. `ForkState.answer` is the decision itself and never changes once made.
     *
     *  ⚠ THE TOUR'S OWN POOL IS NOT THIS AND MUST NOT BE TUNED WITH IT. `FIELD.career` is separately
     *  and correctly calibrated – §10 measured the top-100 mean age at 25.3 against his real 25-27 –
     *  and it is a MIXED field that legitimately spans both routes. */
    ageRoutes: {
      /** straight to the tour: earlier, sharper. Peak 22-26, decline from 27. */
      direct: { plateauStart: 22, declineStart: 27 },
      /** via college: today's numbers, kept. Peak 23-28, decline from 29. */
      college: { plateauStart: 23, declineStart: 29 },
    },
    /** ⭐⭐ THE PER-CAREER SPREAD, IN YEARS EITHER SIDE OF THE ROUTE'S `declineStart` (round 31 #13,
     *  his ruling: «полностью согласен, если это реализуемо»). One uniform draw off the career's own
     *  `seed:decline` sub-stream, so the age she stops performing is not the same number for
     *  everybody.
     *
     *  ⚠ WHY 1.5, AND IT IS READ OFF HIS OWN REFERENCE RATHER THAN PICKED. His table gives WINDOWS,
     *  not modes – «24-26 direct, 25-28 via college» – i.e. three-to-four-year ranges inside which
     *  real peaks fall, with the modern tail «stretched to 30-35 for the exceptional». A uniform
     *  draw over ±1.5 reproduces a WINDOW (3 years wide, matching his) instead of pretending to know
     *  its shape; a bell would be a claim about clustering his data does not make.
     *
     *  ⚠ AND THE TWO ROUTES THEN OVERLAP, WHICH IS THE POINT. Direct lands in 25.5-28.5 and college
     *  in 27.5-30.5: a long-lasting direct player and an early-fading college one are both possible,
     *  the route only moves the ODDS by two years. A band narrower than the route gap would have made
     *  the fork a strictly-dominant choice, which is the failure mode the owner named when he held
     *  back option B (physical build) for exactly that reason.
     *
     *  ⚠ `plateauStart` DOES NOT GET THE SPREAD – his ruling names `declineStart` alone. The plateau
     *  is where a route stops climbing; the decline is where a BODY goes, and only the second is a
     *  fact about the individual. */
    declineSpreadYears: 1.5,
    /** ⭐⭐ ROUND 31 #13 – WHAT A BROKEN BODY COSTS HER AT THE FAR END: years of peak lost per week
     *  she has spent off court, counted off `weeksLostSoFar` (the monotone v40 total, never the
     *  pruned `injuryHistory`).
     *
     *  ⚠ SCALED TO LOSE YEARS, NOT WEEKS – the task's own bar. 0.025 is one year of peak per 40
     *  weeks of absence: a clean career (a handful of weeks) sits within a month of its drawn value,
     *  and a career that has lost three seasons to injury finishes two years early. Measured
     *  distributions in docs/specs/age-curve-fork-and-spread.md §4.
     *
     *  ⚠ IT IS NOT A SECOND INJURY PENALTY. The weeks themselves are already charged – she does not
     *  play them, does not train them and does not earn in them. This is the LONG-RUN half round 30
     *  #27's recurrence had no way to express: an injury that only costs the week it happens in is a
     *  week, and a body is a career. */
    declinePullPerInjuryWeek: 0.025,
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
    //
    // ⚠⚠⚠ THE OWNER RELEASED «ARRIVE AT THE OFF-SEASON DOOR AROUND 45-50» ON 19.09, AND THIS NUMBER
    // IS NOT RE-DERIVED. He said it in as many words: «давай изменим эту цель, если она нам мешает.
    // Цель – отпуска реже, а не после каждого турнира ездить всё-таки»
    // (docs/specs/the-season-equation-2026-09.md §10b). The 45-50 was DERIVED from his holiday
    // sentence above, never given: he has kept the sentence and released the arithmetic reading of
    // it, because the reading turned out to be self-defeating - arriving at 45 means living near
    // empty all year, and living near empty is what crosses `practice.rescueCondition` (80) eight
    // times a season, which is the very complaint the new target is about.
    //
    // WHAT THIS MEANS FOR THE CHAIN ABOVE: it is now the HISTORY of how 8 was chosen, and not a live
    // criterion anybody may re-derive a value from. The bar is holiday FREQUENCY. ⚠ The 8 itself did
    // NOT move with the release - nothing measured asked it to, and the 19.09 pass refused to raise
    // the professional base beside it (§10e: the natural-recovery arms buy ~0.15 holidays a point,
    // because the ceiling discards most of what they pay, and raising it would also undo his own
    // 22.08 ruling below). ONE dial moved instead, and it is the only recovery in the game the
    // ceiling cannot reach because it lands on a week she PLAYS: `masseur.tourRecoveryPerRound`.
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
    //
    // ⚠⚠ MEASURED ON 19.09 AND DELIBERATELY NOT MOVED – docs/specs/the-season-equation-2026-09.md
    // §10f. The owner named this lever FIRST («слив на глубине хода»), and a concave tail was built,
    // benched at three strengths and works. It is held for his ruling rather than shipped, for one
    // measured reason: the only strength that respects the shape rule he set on 14.08 (see
    // `runFatigueLadderDeep` below – no round of a run may cost less than that run's first round)
    // buys 0.2 holidays a season, while re-pricing all 199 rivals and moving ~40 keys of every
    // frozen career. The strengths that would justify that cost are the ones that break his rule.
    // The arms live in `tools/season-equation.ts` §5 (`--levers`); the grid is the spec's §10e.
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
     *  некорректно получается». A plateau is the right shape; a collapse was not.
     *
     *  ⚠⚠ AND THAT REJECTION IS A STANDING SHAPE RULE, WHICH THE 19.09 PASS READ OFF IT AND OBEYED.
     *  The curve he wrote is monotone NON-DECREASING; the 19.09 ruling («немного уменьшить усталость
     *  на глубоких турнирах») asks for the tail to come down, which supersedes that – but «НЕМНОГО»
     *  is the qualifier, and the shape he threw out is the one where a late round costs a fraction of
     *  an early one. The rule that survives both: THE TAIL MAY EASE BACK, BUT NO ROUND OF A RUN MAY
     *  COST LESS THAN THAT RUN'S FIRST ROUND. Benched at three strengths and NOT shipped – see
     *  `runFatigueLadderWta` above for the price, and the spec's §10d/§10f for the ruling it awaits. */
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

  // =================================================================================================
  // ⭐⭐ THE PRIVATE LIFE'S TWO NUMBERS (wave 1) – docs/specs/who-she-is-2026-09.md §4 is the source of
  // truth for every value below, and docs/plans/the-private-life-build.md §§1b/1d is where each one is
  // argued. `spirit` is the WEATHER (how she is this week) and `bond` is the STANDING (what the parent
  // has built with her); neither is ever shown as a number on any surface – the fog rule.
  //
  // ⚠ THEY LIVE HERE AND NOT IN `engine/spirit.ts` FOR THE REASON `condition`'s DO. The balance model
  // is ONE table that the bench, the tests and the engine all read, and a constant hidden inside a
  // leaf is a constant nobody can retune without editing behaviour (CLAUDE.md invariant 5).
  // =================================================================================================
  spirit: {
    /** Where she sits when nothing is happening to her, what a career starts at, and what every
     *  week's return step walks back toward. */
    baseline: 70,
    min: 0,
    max: 100,
    /** ⚠ THE KNEE IS 60 AND THE START IS 70, so a fresh career – and every migrated one – reads
     *  factor 1.0 and plays byte-identical tennis until something actually moves her. Same shape as
     *  `condition.matchStrengthKnee`; see `spiritMatchFactor`. */
    knee: 60,
    /** The worst the curve can be, at spirit 0 – and it is DELIBERATELY far gentler than condition's
     *  0.55 floor. The design's bound is «smaller than fatigue» at every point of the curve, and
     *  0.90 vs 0.55 is that bound made arithmetic rather than promised. */
    floor: 0.9,
    /** THE RETURN TOWARD BASELINE, per week, by the INTENSITY axis of her temperament (who-she-is §4:
     *  5 steady / 3 intense – the flat 4 of the 23.08 draft is superseded). A steady girl is back to
     *  herself faster; an intense one holds a feeling longer. */
    returnPerWeek: { steady: 5, intense: 3 },
    /** ...and the same axis scales how hard the week LANDS on her – «она ярче во всём». Every row of
     *  `perturb` below is multiplied by this before it is applied. */
    perturbationScale: { steady: 0.8, intense: 1.25 },
    /** THE WEEK'S OWN EVENTS (build plan §1b, verbatim), BEFORE the intensity scale. Existing world
     *  facts only – no life events yet, that is wave 2's. ⚠ Deliberately absent and named so nobody
     *  adds them by accident: match results (form's channel, parked) and training load (condition's
     *  channel). */
    perturb: {
      injuryOnset: -8,
      laidUpWeek: -1,
      knockPushedWeek: -2,
      vacationResolved: 5,
      birthdayWeek: 2,
      hardExamWeek: -2,
      seasonWithNoVacation: -3,
      blackoutWeek: 1,
      /** ⭐⭐⭐ W5/T2 – THE WEEK THE FAMILY IS ON THE ROAD AND A SMALL CHILD IS AT HOME. His ruling of
       *  21.09 chose the SPIRIT shape over the money one: a fare is something she already pays and
       *  would have read as a tax, while a week away belongs to the layer that prices weeks.
       *
       *  ⚠ DRAFTED, NOT RULED. −2 puts it between the knock she played through (−2) and the season
       *  that ended with no family week (−3), which is the company it keeps: a real weekly cost
       *  that no single week decides a career over. Benched in T7.
       *
       *  ⚠ IT IS SCALED BY TEMPERAMENT FOR FREE (`perturbationScale` above, this block's own law),
       *  so an `intense` mother feels the road more than a `quiet` one without a second constant –
       *  the property that made this the right home rather than a new weekly pass. */
      awayFromSmallChild: -2,
    },
    /** The exam row's own gate: an exam week only costs her when the plan is still grinding through
     *  it (`plan.train >= 85`, which is the `grind` preset). A light exam fortnight costs nothing. */
    examTrainFloor: 85,
    /** ⭐⭐ THE EFFECTIVE BASELINE'S LIFT – `accrueSpirit`'s weekly return walks toward
     *  `baseline + this` while the attachment slot is full (§1b). WIRED BY WAVE 3's T4 (11.09), and
     *  the note it replaces is worth keeping in one line because it was the point: this was DECLARED
     *  IN WAVE 1 AND READ BY NOBODY, deliberately, because the slot did not exist yet – written down
     *  early so that the number stayed HIS and the wave that built the slot could not invent it.
     *
     *  ⚠ IT IS A TARGET AND NOT A BUMP, which is the whole of «lifts a little and stays lifted»: she
     *  arrives at 75 over ~2 weeks through the standing return rule and leaves the same way. There is
     *  no row for it in `perturb` above and there must never be one.
     *
     *  ⚠ AND IT STAYS IN `spirit` RATHER THAN MOVING TO `life` BELOW. The private life merely
     *  SWITCHES this on; the number is spirit's own, it is read by `accrueSpirit` and by nothing
     *  else, and `baseline + attachmentLift < mood.glowingFrom` is a relation between three numbers
     *  that all live here (pinned in tests/spirit.test.ts – it is the reason the value is 5).
     *
     *  ⚠ THE READER IS PINNED, NOT JUST THE VALUE. `tests/spirit.test.ts` used to assert this
     *  constant had NO reader; T4 re-aimed that guard rather than deleting it, and it now asserts the
     *  read happens in `accrueSpirit`'s return target and in no other place in `src/`. */
    attachmentLift: 5,
    /** ⭐⭐⭐ v75 (the private life, wave 4 – T3) – WHAT AN ENDING COSTS HER, in points of spirit, by
     *  the INTENSITY axis (who-she-is §4's spirit-physics table, verbatim: «break-up shock −22 / −34»).
     *  Keyed by `spiritShock['kind']` so the kinds the build plan's steps 7–8 add land as siblings in
     *  this record rather than as a second table; `'breakup'` is wave 4's and the only one today.
     *
     *  ⚠⚠ THESE TWO NUMBERS ARE **ALREADY INTENSITY-SCALED**, SO THEY GO IN **AFTER** THE SCALE AND
     *  NEVER THROUGH `perturb` – the architect's ruling C (docs/plans/life-wave-4-rulings-2026-09.md
     *  §C), and the reconstruction is written out here because it is the one thing a later reader
     *  cannot recover from the values themselves. They are ONE base of about **−27.5** seen through
     *  `perturbationScale` above: −27.5 × 0.8 = −22.0 and −27.5 × 1.25 = −34.4. A row added to
     *  `perturb` would therefore be multiplied a SECOND time, to −17.6 / −42.5 – two numbers that look
     *  every bit as plausible and are not the design's. `accrueSpirit` adds this on its own line after
     *  the scaled perturbation; `weekPerturbation` has no row for it and must never grow one, which is
     *  pinned in tests/spirit.test.ts in `attachmentLift`'s own guard shape.
     *
     *  ⚠ −34 AND NEVER THE DERIVED −34.375: §4's own two numbers win on drift (the single-source
     *  rule), and the −27.5 above is a reconstruction of where they came from, not their definition.
     *
     *  ⚠ AND IT IS A ONE-WEEK EVENT WITH NO RECOVERY CURVE ANYWHERE BEHIND IT. She takes this on the
     *  week the attachment ends – the same week `activeEpisode` goes null and the effective baseline
     *  drops back to the flat one by itself – and then comes back at `returnPerWeek` and at nothing
     *  else. §4's own prediction for a lifted 75 is the whole of the shape: ~1–2 weeks under the knee
     *  for a steady girl, ~6–7 for an intense one. A second return rate here would be a second
     *  mechanic wearing a constant. */
    /** ⭐⭐⭐ v85 T4 – AND WHAT A BIRTH COSTS HER, THE SECOND BAND, **THE BUILDER'S OWN DRAFT**. T1
     *  parked this cell as `null` with the whole of why in its place («these are two TUNING NUMBERS,
     *  and invariant 5 says tuning is measured and not guessed – T9 benches the wave's constants and
     *  T4 is the kind's only writer»), and T4 is that writer: `landBirth` (`world/lifeBeat.ts` §14)
     *  stamps `kind: 'postpartum'` on the week the child is born. The `null` is replaced, the key is
     *  not moved, and the brief's §4 contract holds – it ships at its drafted value, unruled, and T9
     *  benches recovery weeks by grade with the psychologist on and off.
     *
     *  ⭐⭐⭐ **THE BASE MOVED AT WAVE 8b T4 AND THE SCALE DID NOT – HIS RULING ON D5, 21.09.** The
     *  questions pass put it to him as «the postpartum window is never shorter than a break-up at the
     *  same grade», and he ruled it in. What was wrong is the `warm` column, which this note's own
     *  last paragraph used to defend out loud: wave 8 shipped a supported birth clearing in **3**
     *  weeks against the break-up's **4** for a steady girl, and **8** against **10** for an intense
     *  one. A birth is physically the larger event; support should SHORTEN the window, not take it
     *  under the break-up's floor. So the BASE moves from −30 to **−36** and
     *  `postpartumSupportScale`'s 0.8 / 1 / 1.25 is untouched, which is exactly the shape D5's own
     *  sentence prescribes («the base moves and not the scale»).
     *
     *  ⚠⚠ **WHY −36 AND NOT −35, WHICH IS THE ARITHMETIC MINIMUM.** The floor needs `warm` to reach
     *  the break-up's 4 and 10: she lands at 75 + delta, climbs at 5 (steady) / 3 (intense) a week and
     *  clears at `baseline − shockClearWithin` = 68, so the binding conditions are
     *  `ceil((base × 0.64 − 7) / 5) ≥ 4` → base > 34.375 and `ceil((base − 7) / 3) ≥ 10` → base > 34.
     *  **−35 satisfies both and is not available**: −35 × 1.25 = −43.75, which is HUNDREDTHS, and
     *  `world.spirit` is carried in tenths (`roundTenth` at the end of `accrueSpirit`'s sum) – the
     *  same constraint this note already applied to −37.5. Keeping both products on the meter's own
     *  grid needs a base that is a multiple of 2, and **36 is the first one above 34.375**. ⭐ SO THE
     *  MOVE IS THE SMALLEST THE RULING ALLOWS: at `warm` the two windows come out LEVEL rather than
     *  the birth dwarfing the break-up, which would have been a second, undrafted decision about how
     *  much worse a birth is.
     *
     *  ⚠⚠ THE SHAPE IS `breakup`'s, ONE BASE SEEN THROUGH `perturbationScale`, and the arithmetic is
     *  written out because a later reader cannot recover it from the values: ONE base of **−36**,
     *  −36 × 0.8 = **−28.8** and −36 × 1.25 = **−45.0**. ⚠ BOTH PRODUCTS SHIP EXACTLY, which is where
     *  this parts from `breakup` above rather than contradicting it: §4's own table named −22/−34 in
     *  words and the single-source rule kept them against the derived −34.375. No table names these
     *  two, so there is nothing for an exact product to disagree with, and `world.spirit` is carried
     *  in TENTHS (`roundTenth` at the end of `accrueSpirit`'s sum), so −37.5 is a value the meter can
     *  actually hold.
     *
     *  ⚠⚠ WHY A BIRTH SITS ABOVE A BREAK-UP ON THE SAME AXIS AT ALL – the two reasons the −30 draft
     *  was argued on, both still standing and both now carried further by his D5 ruling. ⚠ The
     *  paragraph is kept in its original terms («why −30 and not −27.5», a 9% gap) because it is the
     *  REASONING that survives, not the number: at −36 the gap is 31%, and it is his ruling that
     *  widened it rather than any of the arithmetic below. Note that the FIRST reason is arithmetic
     *  rather than sentiment:
     *    · **THE ATTACHMENT LIFT DOES NOT LEAVE.** A break-up takes its −22/−34 *and* empties the
     *      slot on the same tick, so the effective baseline falls 75 → 70 and she is climbing toward
     *      the lower number. A birth does neither: the marriage usually still stands, `activeEpisode`
     *      is unchanged, and she climbs toward 75. At an equal base the birth would therefore CLEAR
     *      SOONER than the break-up, and the brief's own sentence about this slot is that the
     *      postpartum window is the LARGER one – «the later, larger window wins». The +9% is what
     *      buys that back: measured below, it puts the middle grade LEVEL with the break-up for a
     *      steady girl and a week past it for an intense one, which is as close to «larger, and not
     *      by much» as a rate of 5 points a week can be made to land.
     *    · the research's row is about the RECOVERY and not about the blow – «support speeds
     *      recovery; pressure → depression risk ↑» (`docs/research/life-events-motherhood.md`) – so
     *      there is no digest number to transcribe here and the base is sized on the recovery it
     *      PRODUCES, which is the quantity T9 can measure and his word can land on.
     *
     *  ⭐ WHAT IT PREDICTS, MEASURED ON THE ENGINE'S OWN WALK (tests/wave8-birth.test.ts §E, a married
     *  career at the lifted 75, psychologist off) rather than computed on paper – weeks from the birth
     *  until `accrueSpirit`'s tail clears the mark:
     *
     *        grade        steady      intense        (wave 8's own, at the −30 base: 3/8, 4/11, 5/13)
     *        warm            4           10
     *        measured        5           13
     *        cold            6           16
     *
     *  against the BREAK-UP's own **4 / 10**, measured on the SAME instrument and on the break-up's
     *  own shape (the episode ends the same tick, so the lift leaves with it) rather than transcribed
     *  – `breakupWeeks` in that file is the arm, added by T4 for exactly this comparison, so the
     *  floor cannot go stale the day the break-up's own band moves.
     *
     *  ⭐⭐⭐ **EVERY CELL IS NOW AT OR ABOVE THE BREAK-UP'S, WHICH IS THE WHOLE OF D5.** `warm` is
     *  LEVEL on both axes (4 and 10), `measured` and `cold` sit above it, and the ordering
     *  `warm < measured < cold` is unchanged on all four voices. ⚠ THE OLD PARAGRAPH'S LAST SENTENCE
     *  IS GONE AND IS NAMED HERE SO THE CHANGE IS NOT SILENT: it read «`warm` is deliberately UNDER it
     *  – a supported birth is an easier week than being left. That is the one place the ordering is
     *  allowed to cross.» It was true of the draft, it was said out loud rather than hidden, and he
     *  ruled the other way.
     *
     *  ⚠ NO SECOND CURVE AND NO RECOVERY TERM – `spirit.ts`'s own «THERE IS NO RECOVERY CURVE,
     *  ANYWHERE, BY DESIGN» is untouched by this row and by `postpartumSupportScale` below, which is
     *  the reason support enters through the MAGNITUDE. See that constant's note for the whole of the
     *  argument, including the mechanical one. */
    /** ⭐⭐⭐ v87 (the weight, wave 11 – docs/specs/the-weight-2026-09.md §5) – AND THE TWO THE
     *  LAST STEP OF THE LAYER ADDS, **DRAFTED**: `loss` −26/−40 and `bereavement` −30/−46. The
     *  reserved seats this record's own header promised («so the kinds the build plan's steps 7–8
     *  add land as siblings in this record rather than as a second table»), taken.
     *
     *  ⚠⚠ THE ORDER IS THE DESIGN AND IT IS STATED IN THE SPEC: both sit deliberately DEEPER than the
     *  break-up and ASTRIDE the postpartum pair (−28.8/−45), «because that is the order the lived days
     *  have». A loss is heavier than a break-up and lighter, at the steady end, than a birth she
     *  keeps; a death in the family is the heaviest thing this layer holds.
     *
     *  ⚠⚠ AND NEITHER BRINGS A SECOND RECOVERY RATE – `spirit.ts`'s standing refusal, which the spec
     *  quotes back at itself: «a second return rate, a «recovering» flag or a taper read off
     *  `spiritShock` would all be the same mistake». The sketch's «longer, asymmetric curve» is
     *  delivered by DEPTH under the one-rate law, and depth is the whole of «longer»: at
     *  `returnPerWeek` 5 (steady) / 3 (intense) and a clear at `baseline − shockClearWithin` = 68, a
     *  deeper landing IS a longer window, arithmetically, with no second number anywhere.
     *
     *  ⚠ THEY ARE ALREADY INTENSITY-SCALED, `breakup`'s own law two paragraphs up: they go in AFTER
     *  the scale, on `accrueSpirit`'s own line, and `weekPerturbation` has no row for either and must
     *  never grow one. ⚠ AND `postpartumSupportScale` DOES NOT TOUCH THEM – it reads
     *  `shock.kind === 'postpartum'` and returns exactly 1 for every other kind, which is what keeps
     *  the support grade a fact about a BIRTH rather than a general softener.
     *
     *  ⚠ BOTH ARE THE BUILDER'S DRAFTS and are flagged here exactly as `perWeekByAge` and
     *  `postpartumSupportScale` are: the spec drafts the ORDER and the bench prices them; his word
     *  finalises. ⚠ BOTH PRODUCTS LAND ON THE METER'S GRID – the constraint `postpartum`'s own note
     *  measured: −26 × 0.8 = −20.8 and −26 × 1.25 = −32.5; −30 × 0.8 = −24 and −30 × 1.25 = −37.5.
     *  `world.spirit` is carried in TENTHS (`roundTenth`), and all four are tenths. ⚠ The steady/intense
     *  pair is written out rather than derived from a base for `breakup`'s own single-source reason:
     *  §5's two numbers win on drift, and a reconstruction is a comment, not a definition. */
    shock: {
      breakup: { steady: -22, intense: -34 },
      postpartum: { steady: -28.8, intense: -45 },
      loss: { steady: -26, intense: -40 },
      bereavement: { steady: -30, intense: -46 },
      /** ⭐⭐⭐ v88 (the parting, wave 12 – T1/T2) – THE MARRIAGE ENDING'S OWN ROW.
       *  ⚠ ⚠ **DRAFT** – the spec (`docs/specs/the-parting-2026-09.md` §3) drafts these two numbers
       *  and says in as many words that his word replaces them at review. Flagged exactly as
       *  `motherhood.perWeekByAge` and `wedding.perWeek` are, and benched in T6.
       *
       *  ⚠⚠ THE ORDERING IS THE WHOLE CLAIM AND THE MAGNITUDES ARE THE DRAFT. §3: deeper than a
       *  break-up (−22/−34), because a marriage is more of a life; not as deep as a death
       *  (−30/−46), because the person is still in the world. Both comparisons hold for BOTH
       *  columns, which is what makes the row a rung on a ladder rather than two free numbers – and
       *  it is the property to preserve if the sizes move.
       *
       *  ⚠ AND THE SPACING IS NOT UNIFORM ON PURPOSE. −27 sits 5 above the break-up and 3 under the
       *  bereavement; −42 sits 8 above and 4 under. The gap to the break-up is the larger one in
       *  both columns because that is the distance the wave is actually claiming: the ending this
       *  row prices had a wedding in front of it, and the one under it did not.
       *
       *  ⚠ NO PER-KIND RECOVERY RATE, and `engine/spirit.ts`'s refusal is older than this member and
       *  binds it unchanged: «a second return rate, a «recovering» flag or a taper read off
       *  `spiritShock` would all be the same mistake». DEPTH is the whole of «longer» – at
       *  `returnPerWeek` 5 / 3 and a clear bar of `baseline − 2`, −27/−42 simply takes more weeks to
       *  climb out of than −22/−34 does, and that arithmetic is the design. */
      divorce: { steady: -27, intense: -42 },
    } satisfies Record<
      SpiritShockKind,
      { steady: number; intense: number } | null
    >,
    /** ⭐⭐⭐ v85 T4 – **WHERE `support` ENTERS THE RECOVERY**, and it is the whole of the wave's
     *  «support speeds recovery; pressure → depression risk ↑» (the digest's own row for the return).
     *  A pure multiplier on the postpartum band above, applied ONCE, on the one week the shock lands.
     *  **THE THREE FIGURES ARE THE BUILDER'S DRAFT** – the brief drafts the DIRECTION («`warm`
     *  shortens, `cold` lengthens», §0) and not the size – flagged exactly as `motherhood.perWeekByAge`
     *  and `wedding.perWeek` are, and benched by T9.
     *
     *  ⚠⚠ THE MAGNITUDE AND NOT THE SLOPE, AND THE FILE THAT OWNS THE RECOVERY IS WHAT DECIDES IT.
     *  `engine/spirit.ts` says of the shock, in capitals: «AND THERE IS NO RECOVERY CURVE, ANYWHERE,
     *  BY DESIGN … A second return rate, a «recovering» flag or a taper read off `spiritShock` would
     *  all be the same mistake». A support term on `returnPerWeek` IS a second return rate, by that
     *  sentence's own definition. A support term on the MAGNITUDE is the week's own weather, and the
     *  weeks she then takes to climb out of it fall out of the standing weekly rule – so «support
     *  speeds recovery» is a MEASUREMENT of arithmetic that already existed rather than a second
     *  mechanic wearing a constant.
     *
     *  ⚠⚠ AND THE MECHANICAL ARGUMENT IS THE DECIDING ONE, because it is not a matter of taste:
     *  `support` lives on `world.pregnancy`, and **T5 and T6 CLEAR that record** – the return has to
     *  clear it or W5's repeat pregnancy can never re-enter the gate (`state.ts`'s own note on
     *  `comeback`). A RATE that read `support` would therefore change silently, mid-recovery, on the
     *  week she came back, and a magnitude cannot: it is read on the birth week, when the record is
     *  provably non-null (T4 writes nothing to it, and T5's window opens
     *  `decisionWeeksAfterBirth` weeks later).
     *
     *  ⚠ AND NOT THE CLEAR THRESHOLD, THE THIRD CANDIDATE, which is refused on ruling D's own ground:
     *  `shockClearWithin` is read against the PLAIN baseline because the mark is «a question about HER
     *  recovery, not about who is in her life now». Bending the bar per grade would make «back on her
     *  feet» mean a different number for two girls who feel the same, which is the exact reading
     *  ruling D refused for the attachment lift.
     *
     *  ⭐ THE TWO FACTORS ARE EXACT RECIPROCALS – 0.8 = 1 / 1.25 – so «warm shortens and cold
     *  lengthens by the same factor» is true of the arithmetic and not only of the sentence, and
     *  `measured` is exactly **1**, so the band above IS the measured-grade magnitude and a career
     *  whose parent answered `worry` takes the two numbers as written. ⚠ THE COLLISION WITH
     *  `perturbationScale`'s 0.8 / 1.25 IS THE RECIPROCAL PAIR TURNING UP TWICE AND NOT A SHARED ROW:
     *  that one is keyed by INTENSITY (who she is), this one by the parent's ANSWER, they multiply the
     *  same summand on different axes, and folding them would be a category error. Named here so
     *  nobody folds them.
     *
     *  ⚠ A `null` GRADE READS 1.0 AND THAT IS A PROBE-WORLD COURTESY, not a fourth cell: the
     *  `'expecting'` beat BLOCKS (`LIFE_BEAT_BLOCKING`), so a career cannot tick the ~39 weeks from
     *  the announcement to the birth with the card still up, and `support === null` at a birth is
     *  unreachable in play. `accrueSpirit`'s `??` courtesies are the same instrument. */
    postpartumSupportScale: { warm: 0.8, measured: 1, cold: 1.25 } satisfies Record<
      NonNullable<PregnancyState['support']>,
      number
    >,
    /** ⭐⭐ HOW CLOSE TO HER OWN BASELINE COUNTS AS BACK – the gap `accrueSpirit`'s tail clears
     *  `world.spiritShock` at (the build plan §5 step 4: «clears when spirit ≥ baseline − 2», i.e.
     *  **68**).
     *
     *  ⚠⚠ IT IS SUBTRACTED FROM THE PLAIN `baseline` AND NEVER FROM THE EFFECTIVE ONE – ruling D. The
     *  mark is a question about HER recovery, not about who is in her life now: read against
     *  `baseline + attachmentLift` the bar would be 73, and a shock would then be held OPEN LONGER
     *  precisely because a new romance had arrived, which reads backwards on screen.
     *
     *  ⚠ NAMED RATHER THAN INLINED because this module's own law is that `engine/spirit.ts` invents no
     *  number (its header: «Every constant lives in `ECONOMY.spirit` / `ECONOMY.bond`»). The ruling
     *  writes the bar as `baseline - 2`; this is that 2, with its source on it. */
    shockClearWithin: 2,
    /** ⭐⭐ THE MOOD LADDER'S FOUR CUT POINTS – RULED 09.09, and every one of them is anchored to a
     *  MECHANICAL FACT rather than to taste. The five words they divide are the owner's
     *  (`docs/specs/voice-bibles-2026-09.md` §C, approved); the numbers are his ruling of the same
     *  day, taken over the bench's measured optimum on the reason that moved bars 1 and 3 too:
     *  «the word changes only when something really happened» – wave 1 is quiet on purpose and the
     *  ladder is built for the finished layer.
     *
     *  The four read as two floors and two ceilings around the neutral band, and `spiritBandOf` is
     *  the ONE reader: `< heavyBelow` Heavy · `< dimmedBelow` Dimmed · `>= glowingFrom` Glowing ·
     *  `>= brightFrom` Bright · everything between the two Steady.
     *
     *  ⚠ THE ≥ 2% OCCUPANCY BAR DOES NOT PASS IN WAVE 1 AND THAT IS THE RULED OUTCOME, not a defect:
     *  measured against who-she-is §4a's own distribution these cuts give Steady 90.98% · Bright
     *  6.07% · Dimmed 2.07% · Glowing 0.88% · Heavy 0.00%. Glowing and Heavy are rare-to-absent
     *  until wave 4's break-up shock (−22 steady / −34 intense) gives them their range – a lifted
     *  girl taking −34 lands deep in Heavy and stays there for weeks. The bar moved to wave 4 with
     *  bar 1; see the runbook's §6 list.
     *
     *  ⭐ THE SHOCK SHIPPED IN v75's T3 AND THE ARITHMETIC ABOVE WAS ONE WEEK'S RETURN OUT – the
     *  sentence read «a lifted girl at 75 taking −34 lands at 41», and the MEASURED figure is **38**.
     *  75 − 34 = 41 forgets that the ending frees the slot BEFORE `accrueSpirit` runs, so the return
     *  toward the flat 70 happens first (75 → 72 for an intense girl) and the shock lands on that.
     *  The claim the sentence was making is unchanged and is now a measurement rather than a
     *  prediction: an intense girl is Heavy for EIGHT weeks (38 41 44 47 50 53 56 59, then 62) and a
     *  steady one for three (48 53 58, then 63). ⚠ The «lands at 41» in
     *  `docs/plans/wave-1-the-two-numbers-runbook-2026-09.md` §6 WAS annotated after all
     *  (`a22e7499`, additively – the 41 kept as wave 1's record of its own prediction), so the
     *  earlier reading of this sentence («left alone, the architect's to re-date») aged the day it
     *  was written down; corrected 12.09 by the wave's judge rather than left to mislead.
     *  ⚠ These are not tuning dials: a test that would be easier
     *  with other numbers is a test to rewrite, not a ladder to move. */
    mood: {
      /** ⭐ THE KNEE ITSELF – below this `spiritMatchFactor` stops being 1.0 and the match starts
       *  reading her. It is already the approved doc's own gloss for «Heavy» («the weeks under the
       *  knee, where the match factor starts reading her»), so the word and the number agree by
       *  construction rather than by agreement. Kept equal to `knee` above by the pin in
       *  tests/spirit.test.ts – if one moves the other has to be argued. */
      heavyBelow: 60,
      /** Below baseline by more than half a week's return (70 − 5/2 = 67.5). */
      dimmedBelow: 67.5,
      /** ⭐ BASELINE + HALF A STEADY WEEK'S RETURN (70 + 5/2 = 72.5) – the other side of the same
       *  cut `dimmedBelow` makes. Inside `[dimmedBelow, brightFrom)` she is less than half a week of
       *  coming back from herself, which is not worth a word: «her ordinary state – nothing pressing
       *  in either direction», as arithmetic. It is where wave 3's attachment lift (+5 on a baseline
       *  of 75) will sit her, so the word she wears while someone is in her life is decided here. */
      brightFrom: 72.5,
      /** The top of the range – rare by design, as the approved doc says of «Glowing». */
      glowingFrom: 80,
    },
  },

  bond: {
    /** Start, range and the granularity every write rounds to (build plan §1d: 0..100 in steps of
     *  0.5). Its own block beside `spirit` rather than a key inside it: they are two numbers with two
     *  rules – one is weather and moves on the world, the other is a relationship and moves ONLY on
     *  parent decisions – and nesting one under the other would say they are one thing. */
    start: 70,
    min: 0,
    max: 100,
    step: 0.5,
    /** THE MEMORY PROPERTY. Deltas land immediately and then regress toward `start` at this rate and
     *  nothing else moves it: a −25 season heals in ~50 weeks, which is recoverability («one bad click
     *  at fifteen» must not ruin a ten-season career) without making a decision weightless inside the
     *  season it was taken in.
     *
     *  ⚠⚠ IT IS NOT A CONTINUOUS DIAL, AND IT LOOKS LIKE ONE. Every bond write goes through
     *  `roundHalf` onto the `step` grid above, so a week's regression is quantised before it lands:
     *  measured through the engine's own weekly rule, 0.5 / 0.4 / 0.3 / 0.25 ALL move exactly 0.5,
     *  and 0.24 / 0.2 / 0.1 ALL move exactly 0.00 – a −25 season then never heals at all, at any
     *  horizon, rather than healing slowly. The cliff sits at half a step. So this constant has two
     *  reachable behaviours and no gradient between them, and the wave-1 sweep that found this was
     *  reading a dial that had already stopped turning three rows earlier.
     *
     *  The rule that follows, pinned in `tests/spirit.test.ts`: **a positive multiple of `step`.**
     *  Anything else is a value whose measured behaviour is not the value written here. If a later
     *  wave wants slower healing than half a point a week, the honest move is a finer `step` or a
     *  regression that carries its remainder – not a smaller number here. */
    regressionPerWeek: 0.5,
    /** WHAT THE PARENT'S DECISIONS ARE WORTH (build plan §1d, verbatim). Every row lands at a real
     *  decision site – see `engine/spirit.ts`'s header for the map of which one writes which. */
    delta: {
      knockRest: 1,
      knockPush: -3,
      knockPushRepeatPart: -5,
      /** entering her with a `'warn'` clearance in hand – she plays hurt because he entered her. */
      playedHurt: -4,
      /** the birthday's TIME-TOGETHER ids only, by id (`day` / `familyweek` / `trip`). */
      giftDay: 2,
      giftFamilyWeek: 3,
      giftTrip: 4,
      /** ⭐ THE ASKED-FOR MATERIAL GIFT, GRANTED (`asked` === `given`) – the owner's own correction of
       *  23.08: «а как же с теми, которых она сама просила? мне кажется там вполне может двигаться в
       *  положительную сторону мораль». A heard request is not a purchase; see `chooseGift`. */
      giftAskedGranted: 2.5,
      /** she asked and was refused – nothing given, or a different thing. */
      giftRefused: -1.5,
      /** ⚠ AND AN UNPROMPTED MATERIAL GIFT IS EXACTLY ZERO, which is birthday ruling 2 surviving
       *  intact: a gift that moves a number is a purchase, and only an ASK the player cannot
       *  manufacture makes the answer to it a relationship move instead. */
      giftUnprompted: 0,
      vacationResolved: 1,
      seasonWithNoVacation: -3,
      /** ⭐⭐ v73 – THE LIFE BEAT'S OWN THREE (the private life, wave 2; build plan §3, «his reaction
       *  options – responses, never her choices»). What he SAYS when she has told him what she
       *  wants: back it, press the other way, or listen and say nothing.
       *
       *  ⚠⚠ THE PRICE LIST IS UNIVERSAL – who-she-is §3's fence, verbatim: «The `bond` delta table
       *  does not vary by temperament ... The situations differ; the arithmetic of care does not.»
       *  So there is one row per ANSWER here and never a row per girl, and that is also what keeps
       *  the table benchable.
       *
       *  ⚠ AND SAYING NOTHING IS EXACTLY ZERO, not a small negative. Listening is a real answer –
       *  the beat's dialog has no X precisely so that it can be one – and pricing silence as a small
       *  failure would make it the option a player learns to avoid, which is the opposite of what a
       *  parent who does not know what to say is doing. */
      beatBacked: 2,
      beatPressed: -2,
      beatListened: 0,
      /** ⭐⭐ v73 – AND THE SECOND DELTA, WHICH LANDS WHERE THE DEED DOES: `answerFork` matching the
       *  want she stated at the beat, or contradicting it. Two deltas, separate on purpose – «a
       *  parent can disagree out loud and then do as she asked» (build plan §3).
       *
       *  ⚠ THE ASYMMETRY IS THE DESIGN'S (+3 / −4) and it is the same shape the knock's rows carry:
       *  doing the thing she asked for is worth less than overriding it costs, because the fork is
       *  the one decision of hers that the parent can take away. */
      forkWithHerWant: 3,
      forkAgainstHerWant: -4,
      /** ⭐⭐ v74 (the private life, wave 3 – T6/T7) – WHAT HE SAYS THE WEEK HE IS TOLD THERE IS
       *  SOMEONE. Four answers, and not one of them is hers: the wave-3 brief §4's «'met' bond
       *  deltas» row, verbatim – warm +2 · wary 0 · intrusive −3 · silent −1.
       *
       *  ⚠⚠ THE PRICE LIST IS UNIVERSAL – who-she-is §3's fence, and the same sentence the three
       *  rows above carry: «The `bond` delta table does not vary by temperament ... The situations
       *  differ; the arithmetic of care does not.» One row per ANSWER, never a row per girl.
       *
       *  ⚠ SILENCE IS PRICED HERE AND IS EXACTLY ZERO AT THE FORK, and the difference is the beat
       *  and not an inconsistency. At the fork she asked him a question and listening IS an answer
       *  to it (`beatListened`'s own note). Here she handed him a piece of her life and said nothing
       *  was being asked of him – saying nothing back is the one reply that leaves her holding it
       *  alone, so it costs a little.
       *
       *  ⚠ THE FOUR ROWS BELOW ARE THE TABLE AN **`open`** GIRL IS READ BY, and the two after them
       *  are the whole of the difference a `private` one makes (T7, 11.09). T6's own note here said
       *  the flip «is not wired here»; it is now, and the note is CORRECTED rather than left
       *  standing, because a comment that still says «not yet» beside the wiring is the one kind of
       *  stale a constants file cannot carry. */
      metWarm: 2,
      metWary: 0,
      metIntrusive: -3,
      metSilent: -1,
      /** ⭐⭐⭐ v74 T7 – THE WANTS FLIP, AND IT IS TWO ROWS RATHER THAN A SECOND TABLE. A girl whose
       *  drawn `wants` is `'private'` reads silence as the kindness and warmth as the thing that
       *  puts it in the room: silent **+2**, warm **−1** (brief §4's «flip» column, verbatim).
       *
       *  ⚠⚠ `wary` AND `meet` ARE ABSENT ON PURPOSE AND THE ABSENCE IS LOAD-BEARING. The flip is an
       *  OVERLAY on the four above (`world/lifeBeat.ts`'s `MET_BOND_PRIVATE`), so the two rows it
       *  does not name keep the SAME number in both readings – which is what guarantees `'met'`
       *  still has a bond-NEUTRAL answer (`wary`, 0) whatever she wants. Forty tools, the e2e
       *  fixture generator and `tests/helpers/career.ts` drain beats through that zero
       *  (`tools/_lifeBeats.ts`), and a flip that copied the table instead of overlaying it could
       *  drift `wary` off zero and move every bond number those benches measure.
       *
       *  ⚠⚠ AND IT IS STILL NOT A ROW PER GIRL – the fence above holds. What varies is not WHO she
       *  is (temperament never reaches this table) but what she ASKED FOR, which is a fact she put
       *  on the record herself. The arithmetic of care is the same; the request is hers.
       *
       *  ⚠ NOTHING PRINTS EITHER NUMBER. The read reaches the player through the feed line's and
       *  the card's WORDING alone – no meter, no badge, no label (the birthday-ask scene
       *  generalised, brief §2 T7). */
      metWarmPrivate: -1,
      metSilentPrivate: 2,
      /** ⭐⭐⭐ v75 (the private life, wave 4 – T4) – WHAT HE SAYS THE WEEK HE LEARNS IT IS OVER.
       *  Four answers – give her space · keep her company · try to fix it · blame – priced from the
       *  build plan §5's own row, verbatim: «match +3, mismatch −3, fix-it −1, blame −4 always (some
       *  things are wrong regardless of what she wanted)».
       *
       *  ⚠⚠ THE FIRST TWO ARE ONE PAIR READ TWO WAYS AND THAT IS WHY THEY ARE TWO ROWS RATHER THAN
       *  FOUR. Which of «space» and «company» is the match is HER read, drawn on
       *  `seed:life:ends:<endedWeek>:react`; the answer that matches costs `endedMatched` and the
       *  other `endedMismatched`, whichever way round the draw came out. So there is one price for
       *  «you gave her what she wanted» and one for «you did not», and the flip is an overlay on the
       *  base list (`world/lifeBeat.ts`'s `ENDED_BOND_COMPANY`) exactly as `'met'`'s is – never a
       *  second table, so the two rows the flip does not name keep the SAME number in both readings.
       *
       *  ⚠⚠ AND `endedBlame` IS THE ONE ROW WITH NO READING AT ALL. «Some things are wrong
       *  regardless of what she wanted» is the ruling's own sentence: blaming her, or the person who
       *  is gone, costs −4 whichever way her read came out. `endedFixIt` is read-independent too, and
       *  that is load-bearing beyond the design – it is the answer `tools/_lifeBeats.ts` drains this
       *  kind with, and a drain answer whose price moved with a fact the harness is not tracking is
       *  refused by `drainCostOf` rather than averaged.
       *
       *  ⚠ THE FENCE HOLDS HERE TOO (who-she-is §3): one row per ANSWER, never a row per girl.
       *  Temperament does not reach this table – what varies is what she asked for, which is a fact
       *  she put on the record herself.
       *
       *  ⚠ NOTHING PRINTS ANY OF THE FOUR. The read reaches the player through the card's heading
       *  and the told-late feed line's WORDING and through nothing else – no meter, no badge, no
       *  label, no marked option (the `'met'` flip's own law, generalised). */
      endedMatched: 3,
      endedMismatched: -3,
      endedFixIt: -1,
      endedBlame: -4,
    },
    /** ⭐ THE FOUR BANDS THE DIARY READS (build plan §1e, verbatim): `close` ≥ 80 · `steady` 55..79 ·
     *  `strained` 35..54 · `cold` < 35. Each is the FLOOR of its band, read top-down by `bondBandOf`
     *  – the ONE reader, and the only road `bond` has to a sentence.
     *
     *  ⚠ WHAT THE BANDS SELECT IS THE CHANNEL, NOT THE VOLUME (who-she-is §5b): `close`/`steady` let
     *  her speak in her own voice, `strained` collapses the four voices into the shared flat pool,
     *  and `cold` is silence – the parent's line alone under the painting. A career therefore walks
     *  down a ladder with three rungs, which is the loss the player is meant to hear. ⚠ There is
     *  still NO METER: these divide a number nothing prints. */
    band: {
      close: 80,
      steady: 55,
      strained: 35,
    },
  },

  // =================================================================================================
  // ⭐⭐ THE PRIVATE LIFE, WAVE 3 – «SOMEONE EXISTS»: WHETHER HE ARRIVES, AND WHEN THE PARENT HEARS
  // =================================================================================================
  //
  // ITS OWN BLOCK BESIDE `spirit` AND `bond` for the reason those two are beside each other rather
  // than nested: three numbers, three rules. Spirit is weather, bond is a relationship, and THIS is
  // a biography – a thing that happens to her once and then stays happened.
  //
  // ⚠ EVERY VALUE BELOW IS SOURCED TO `docs/specs/who-she-is-2026-09.md` §4 («The numbers – all
  // proposals for the bench»), and THAT TABLE WINS ON ANY DRIFT. Two of them are the architect's
  // concretisations rather than the spec's own rows and are marked ⚠ where they sit – they are
  // bench-visible by design, so his word can move them without touching a line of design.
  //
  // ⚠ THE LIFT THAT BELONGS TO THIS LAYER IS NOT HERE. §1b's effective-baseline constant lives in
  // `spirit` above, because it is a SPIRIT number that this layer merely switches on; wave 3's T4
  // wired it where it already stood, and it stays there. ⚠⚠ THE BRIEF'S §4 TABLE LISTS IT UNDER THIS
  // BLOCK AND THE BRIEF IS WRONG ON THAT ROW – moving it would break the two pins in
  // tests/spirit.test.ts that hold `baseline + attachmentLift < mood.glowingFrom`, which is the
  // relation the value 5 comes from, and it would buy nothing.
  life: {
    /** ⭐ THE AGE GATE – RULED 23.08 and confirmed for this wave. Read against `kidAgeExact`, the
     *  FRACTIONAL age, so a girl turns eligible in the week she turns sixteen and not in the January
     *  of the year she will. A whole-years read would have handed a December girl eleven free
     *  months. */
    ageGate: 16,
    /** The step in the hazard below: under this she is at school and the base rate is the low one,
     *  from it she is not. Named rather than inlined so the two rows below cannot drift from it. */
    adultFrom: 18,
    /** THE BASE WEEKLY ARRIVAL HAZARD, before temperament (who-she-is §4, on the build plan's base:
     *  «arrival 1.0%/wk before 18, 2.5% from 18»). Per WEEK, not per season: the roll is one uniform
     *  on `seed:life:arrival:<week>` and nothing accumulates between weeks. */
    arrivalPerWeek: { minor: 0.010, adult: 0.025 },
    /** ...and how hard each girl leans on it (who-she-is §4's hazard-multiplier table, verbatim).
     *  ⚠ THE CENSUS BARS ARE THIS TABLE'S OTHER FACE – the expected biographies in the same row of
     *  the same table («fiery ~4–6 romances, quiet first arrival median ~18») are what T11 measures,
     *  so a number moved here moves an acceptance bar and is never a local tweak. */
    temperamentMult: { sunny: 1.2, fiery: 1.6, quiet: 0.6, deep: 0.5 },
    /** ⭐⭐⭐ v75 (the private life, wave 4 – T2) – THE BASE WEEKLY **END** HAZARD, before temperament
     *  (who-she-is §4, verbatim: «end 1.2%/wk»). Per WEEK while an attachment is ACTIVE, and it
     *  counts from `sinceWeek` and never from `knownWeek`: a romance can end before the parent ever
     *  knew it existed, which is the whole of the told-late scene wave 4 is built on.
     *
     *  ⚠ ONE NUMBER AND NO AGE STEP, unlike `arrivalPerWeek` one row up. §4's end column is a single
     *  rate: whether she is sixteen or twenty-two changes how often somebody APPEARS, and the spec
     *  says nothing about it changing how long it lasts. A second row invented here would be a design
     *  decision wearing a constant. */
    endsPerWeek: 0.012,
    /** ...and how hard each girl leans on THAT (who-she-is §4's `end` column, verbatim).
     *
     *  ⚠⚠ A TABLE OF ITS OWN AND **NEVER** `temperamentMult` OVERLOADED – the architect's ruling E
     *  (docs/plans/life-wave-4-rulings-2026-09.md), and it is the kind of mistake that ships. The two
     *  columns are genuinely different numbers in the same table: reusing the arrival record would
     *  make a fiery girl's break-ups ×1.6 instead of ×1.5 and a deep girl's ×0.5 instead of ×0.9,
     *  silently, with both values looking plausible to a reader who never opened the spec.
     *
     *  ⚠ AND THE TWO COLUMNS DO NOT EVEN AGREE ON THEIR ORDER, which is the design speaking: openness
     *  owns the MEETING (fiery and sunny meet people often), intensity owns the BREAKING (fiery ×1.5
     *  and deep ×0.9 are the two intense girls, quiet ×0.35 the one who holds on). §4's «expected
     *  biography» column is this table's other face – fiery ~0.7 seasons against quiet ~3 – so a
     *  number moved here moves a census bar in T7 and is never a local tweak. */
    endsMult: { sunny: 0.6, fiery: 1.5, quiet: 0.35, deep: 0.9 },
    /** THE WEEKS AFTER AN ENDING BEFORE ANYONE MAY APPEAR AGAIN (who-she-is §4, the `cooldown`
     *  column).
     *
     *  ⭐⭐ LIVE SINCE v75 (wave 4, T2), AND THE NOTE IS RE-AIMED RATHER THAN DELETED so the dormant
     *  year cannot be mistaken for a cancellation. It read «UNREACHABLE IN WAVE 3 AND SHIPPED ANYWAY:
     *  nothing in this wave writes `endedWeek`, so no career can ever be inside a cooldown – it lands
     *  now, with its tests, so that wave 4 (which writes the endings) changes nothing here.» That is
     *  exactly what happened: `endEpisode` (world/loveEpisodes.ts) now writes the date, clause 3 of
     *  `arrivalEligible` bites for the first time, and NOT ONE CHARACTER of the gate or of this row
     *  had to move for it. ⚠ The ordering does the rest by construction – `rollEnds` runs BEFORE
     *  `rollArrival` in the same tick, so the week an attachment ends is a week the cooldown already
     *  refuses, and nobody can arrive on the afternoon of a break-up. */
    cooldownWeeks: { fiery: 12, sunny: 26, quiet: 39, deep: 52 },
    /** THE RAW FEED LAG, in weeks, by her OPENNESS REGISTER (who-she-is §4, «Feed lag», verbatim:
     *  open – 0 with p 0.70, else uniform 1..4; private – 0 with p 0.10, else uniform 2..12).
     *
     *  ⭐⭐ THE OPEN ROW MOVED ON 11.09.2026, AND IT MOVED BECAUSE A BAR MISSED – not because anybody
     *  preferred the shape of it. T11's arrival census (§4a's wave-3 entry) measured the open
     *  late-share at **44.0% against its own ≤ 25% bar**, and it measured the CAUSE beside it: the
     *  RAW draw, before `bondShave` touches it, was already **57.4% late** (nominal 55.0% – the old
     *  row's own «0 with p 0.45»). That is 2.3× the bar with no shave in it at all, so no setting of
     *  the shave could ever have reached the corridor; ≤ 25% needs p(raw = 0) ≈ 0.75 for an open
     *  girl. The finding went to the owner as a finding and he moved the TABLE rather than the bar
     *  («двигать таблицу – ок»): **open now means the parent usually hears at once.**
     *
     *  ⚠ THE BAR ITSELF DID NOT MOVE AND MUST NOT (invariant 5: numbers are measured, never
     *  adjusted). ≤ 25% / ≥ 60% are still what `tools/life-arrival.ts` prints against, and §4a
     *  carries the re-measurement under the moved row, old numbers beside the new ones.
     *
     *  ⚠ INDEXED BY THE REGISTER SHE WAS BORN WITH, not by the `wants` she drew for this particular
     *  attachment. The two are separate facts on separate keys and are free to disagree; §4's own
     *  neighbouring row («open girls draw `open` at ~70%») is what settles which sense of the word
     *  «open» each table is keyed on – there the girl, here the girl.
     *
     *  ⚠ RAW, and the bond band shortens it afterwards (`bondShave`). This is the world's dice; the
     *  shave is the parent's history. */
    lag: {
      open: { zeroChance: 0.70, min: 1, max: 4 },
      private: { zeroChance: 0.10, min: 2, max: 12 },
    },
    /** HOW HEAVILY THE `wants` DRAW LEANS ON HER OWN REGISTER (who-she-is §4, «Wants weights»: «open
     *  girls draw `open` ... at ~70%»). A TENDENCY and never a rule – the other 30% is the whole
     *  reason the want is drawn instead of read off the temperament, and it is what stops an open
     *  girl being a stereotype who never once keeps something to herself. */
    wantsOwnRegister: 0.70,
    /** ⚠ THE BOND SHAVE – THE ARCHITECT'S CONCRETISATION (wave-3 brief §4), bench-visible, NOT a
     *  ruling: the divisor the raw lag is floored by, read off the bond band AT the arrival week.
     *  who-she-is §2a channel 1 is the design it serves – «she trusts THIS parent» – and 1 is the
     *  identity, so `strained` and `cold` pay the raw lag in full.
     *
     *  ⚠⚠ THIS IS THE ONE PLACE IN THE WAVE WHERE A PLAYER CHOICE IS ALLOWED TO SHOW, and it is
     *  deliberate. The DRAW is keyed on (seed, calendar) alone, so `sinceWeek` is identical across
     *  every run of one seed – CLAUDE.md invariant 2's input-independence, intact. The SHAVE is a
     *  pure function of the relationship the player built, so `knownWeek` MAY differ between runs.
     *  That is the relationship affecting DISCLOSURE, not the world's dice being re-rolled. */
    bondShave: { close: 3, steady: 2, strained: 1, cold: 1 },
    /** ⭐⭐ TIER-1 SMALL TALK, PER WEEK, BY BOND BAND (wave-3 brief §4's last row, verbatim) – ⚠ THE
     *  ARCHITECT'S PROPOSAL AND MARKED AS ONE THERE, bench-visible, NOT a ruling. It is sourced to
     *  who-she-is §5b's frequency column, which is prose rather than a number: «a few per season at
     *  `close`; none at `cold`».
     *
     *  ⭐⭐ READ AT RUNTIME AGAIN SINCE v74 T15 (11.09.2026), AND THE NOTE IS RE-AIMED RATHER THAN
     *  DELETED so the interim state cannot be mistaken for a cancellation. These two numbers shipped
     *  DECLARED AND NOT REACHED for one commit – the owner's «вариант 3» took the raise out while
     *  §5b's «soft – answerable, never lost» had no surface to be answerable ON. T15 built the
     *  surface (a Home card, a per-kind `blocking` flag, a 3-week derived TTL), so `rollSmallTalk` is
     *  called again from `world/phaseHerWeek.ts` and the hazard is live. ⚠ THE RULING THAT CAME WITH
     *  IT, kept where the numbers are: NO AGE GATE. She talks at any age; tier 1 is texture, not part
     *  of the romance layer – `smallTalkEligible` has none and must not acquire one.
     *
     *  ⚠⚠ THE TWO ZEROES ARE A SHORT-CIRCUIT AND NEVER A COMPARISON. `rollSmallTalk` returns before
     *  `seed:life:smalltalk:<week>` is ever derived when the chance is 0, exactly as `rollArrival`'s
     *  gate does – an ineligible week takes ZERO draws (T3's load-bearing rule, inherited whole).
     *
     *  ⚠ AND «NONE AT COLD» IS THE DESIGN RATHER THAN A FLOOR: at `strained` and `cold` the silence
     *  IS the line (§5b's own sentence). There is no flat pool for this beat, because a beat that
     *  never fires needs none. */
    smallTalkPerWeek: { close: 0.08, steady: 0.04, strained: 0, cold: 0 },
    /** ⭐⭐⭐ v74 T15 – HOW LONG A SOFT ROW STAYS ANSWERABLE: THE RAISE WEEK AND THE TWO AFTER IT
     *  (who-she-is §5b's SOFT BLOCK CONCRETIZED amendment, 11.09: «a soft row is live for 3 weeks
     *  (the raise week + 2)»).
     *
     *  ⚠⚠ LIVENESS IS **DERIVED** FROM `week − row.week` AND IS NEVER STORED – `activeEpisode`'s own
     *  discipline, and the reason is the same one the queue gives for having no `pending` boolean: an
     *  «expired» flag beside a week number is one fact with two sources of truth, and the two desync
     *  the first time a migration, a load or a command touches one and not the other. `liveSoftBeat`
     *  (world/lifeBeat.ts §1) is the one reader, and there is no new persisted field anywhere in T15.
     *
     *  ⚠ 3 IS «THE RAISE WEEK + 2» AND THE COMPARISON IS STRICTLY `<`: at `week − row.week` of 0, 1
     *  and 2 the card is up; at 3 the moment has passed, the card goes and nothing asks. The ROW
     *  stands forever either way – answered, or expired with `answer: null`, which is the honest
     *  record that she came and it went unasked («never lost = the ROW, not the chance»). */
    smallTalkTtlWeeks: 3,
    /** THE HARD CAP PER SEASON (brief §4: «cap 4/season»), counted off `lifeLog` itself.
     *
     *  ⚠⚠ THE LOG IS THE COUNTER AND THERE IS NO NEW STATE – who-she-is §5b's line item 6 («caps
     *  without new state – tier-0/1 frequency per season derived from `lifeLog` counts»). A counter
     *  field beside a record that already answers the question is one fact with two sources of
     *  truth, which is `pendingLifeBeat`'s own doctrine applied to frequency.
     *
     *  ⚠ THE COUNT IS `'small-talk'` ROWS OF **THIS** SEASON AND NOTHING ELSE. `lifeLog` also holds
     *  `'fork-opinion'` and `'met'` rows, and a naive length would cap her small talk on the week
     *  she was told there is someone. */
    smallTalkCapPerSeason: 4,
    /** ⭐⭐⭐ v74 T17 – WHAT IT TAKES FOR HER TO WANT TO STOP (the owner's ruling of 11.09, made on
     *  his own playtest: his world #5, healthy, close home, met «I want to finish» at eighteen).
     *
     *  ⚠⚠ THE SHAPE IS THE RULING AND THE THREE NUMBERS ARE **DRAFT FOR THE BENCH**, in exactly the
     *  sense §4's other rows are: `stop = floor + gainWorn × worn + gainStrained × strained`, read
     *  by `forkWantWeights` (world/lifeBeat.ts §2) and by nothing else. Before this the `stop` weight
     *  was `lean(worn)`, which is 1.0 at its floor – so the least stop-shaped girl the game can
     *  produce still met the question at ~22–25%, and a quarter of all players were told at the
     *  biggest moment of the career that she wanted to finish, with no root they could read.
     *
     *  ⚠ THE TAIL IS PRICED, NOT REMOVED. `floor` is ε > 0 and must stay so: the Barty ending – she
     *  is whole, she is winning, and she is done – is a FEATURE, and any girl may still want any of
     *  the three. What the floor buys is its RARITY: unsupported (worn = strained = 0) it reads
     *  ~3–4% at every standing, which is an eighteen-year-old's rarity rather than a quarter.
     *
     *  ⚠ `strained` IS THE MIRROR OF `close` and is measured off the distance BELOW `bond.start`,
     *  exactly as `close` is measured above it – so 70 is neutral in both directions and a neutral
     *  home leans nothing. The two gains are ordered deliberately: being worn out weighs more than
     *  being far from the parent, because the season is what she would be stopping. */
    forkStop: { floor: 0.12, gainWorn: 2.5, gainStrained: 2.0 },
    /** ⭐⭐ THE DRIVER'S THRESHOLD – the one number that decides which ROOT her stop line and the
     *  coach's counsel are worded from (`worn > this` → `'worn'`, else `strained > this` →
     *  `'strained'`, else `'own'`).
     *
     *  ⚠⚠ IT IS SPENT ON WORDING AND ON NOTHING ELSE. The driver never re-weights the draw it
     *  explains: `forkWantWeights` reads `forkStop` above and never this, and the same (standing,
     *  spirit, bond) produces the identical three weights whether or not anything asks for a driver.
     *  `tests/wave3-stop-want.test.ts` §B is the pin that says so.
     *
     *  ⚠ 0.15 IS «SOMETHING REAL RATHER THAN ROUNDING»: at 0.15 the stop weight has moved by 0.375
     *  (worn) or 0.30 (strained) off its floor, which is already three times the floor itself – so
     *  the wording claims a root only where the arithmetic actually leaned on one. Below it she is
     *  the Barty case and the copy says so. */
    forkStopDriverFrom: 0.15,
    /** ⭐⭐⭐ HER WALLS AND HER REGULATION – who-she-is §2a's leanings, their hysteresis and the hazard
     *  that flips a pole (v76, wave 5's T7). The one reader is `driftWalls` (engine/spirit.ts).
     *
     *  ⚠⚠ THE HOME IS `ECONOMY.life` AND NOT `ECONOMY.psychologist`, AND THAT IS A DELIBERATE
     *  DEPARTURE FROM THE WAVE-5 BRIEF'S §4 HEADING («home: `ECONOMY.psychologist`, one block beside
     *  `ECONOMY.masseur`»), REPORTED RATHER THAN DONE QUIETLY. The seven numbers below are read on
     *  EVERY career, including the great majority that never hire anybody – walls rise from neglect
     *  itself, «no purchase, no work» (§2a), and repair is FREE (§0.3: «the seat only ever
     *  ACCELERATES the road home. Gating any part of that road behind the retainer is a design
     *  violation»). A constant whose reader runs on a seatless career, filed under the seat's price
     *  list, would read as a paywall in the one place the layer's own law says there is none. The
     *  three numbers that really ARE the seat's – the O6 slow-down, the `'herself'` acceleration and
     *  the beyond-baseline hazard scale – are in `ECONOMY.psychologist` beside `recoverySlope`, where
     *  they belong, and each names this block.
     *
     *  ⚠⚠ ALL SEVEN ARE PROPOSALS AND NONE IS RULED – the wave-5 brief §4's «Proposals – NONE ruled,
     *  all bench-priced predicted-first, his word after». Six are the brief's own; `leanMax` is the
     *  seventh and it is the BUILDER's, argued at its own entry.
     *
     *  ⚠ THE SIGN CONVENTION IS THE ARCHITECT'S RULING N AND IS NOT NEGOTIABLE HERE: the lean is
     *  ABSOLUTE and zero is her NATURE. Negative = more private / more intense (walls up,
     *  dysregulated); positive = more open / more steady (beyond her own baseline). `driftWalls`
     *  carries the whole of it; these are only the magnitudes. */
    walls: {
      /** ⚠ WALLS UP, PER WEEK AT A `strained`/`cold` bond – §2a's «walls RISE from neglect itself»,
       *  applied to BOTH axes (kicks close her AND dysregulate her). Subtracted from the lean, so it
       *  also eats a positive lean first: «если она стала более открытой, а ее начали пинать, то она
       *  вполне может и назад откатиться» (the owner, 09.09) is this one sign doing that work.
       *  ⚠ 1.5/wk against `flipArm` 60 is ~40 held weeks to arm – «a flip is an event of seasons». */
      risePerWeek: 1.5,
      /** ⚠ THE WALK HOME, PER WEEK AT A `close`/`steady` bond – toward 0 and NEVER PAST IT. Slower
       *  than the rise on purpose: coming back is longer than going away, and it is FREE (no hire,
       *  no focus, no money – §0.3's law, benched with `psychologistHired === false`). */
      repairPerWeek: 1.0,
      /** ⚠ BEYOND HER OWN BASELINE, PER WEEK – the slowest of the three, because it is the only one
       *  she has to WORK for: it runs ONLY while the `'herself'` focus is held AND the bond is
       *  `close`/`steady` (§2a's «BEYOND her baseline is her own work»), and ONLY on the axis that
       *  has somewhere to grow. That gate is the anti-«hugged into an extravert» dam and it is a HARD
       *  invariant, not a corridor: a caring career with no focus produces zero of this, ever. */
      growthPerWeek: 0.5,
      /** ⚠ WHERE AN AXIS ARMS, in the ONE direction birth left open to it (ruling N): a born-OPEN or
       *  born-STEADY girl arms at −this (walls up, the expressed pole inverts); a born-PRIVATE or
       *  born-INTENSE one arms at +this (her own work). The other direction arms NOTHING – for the
       *  first pair it is clamped at 0 (nowhere to grow), for the second it accumulates as real walls
       *  that change no bucket and still have to be walked back before a point of growth can be
       *  bought. That asymmetry is «repair is free, growth is work» in the arithmetic. */
      flipArm: 60,
      /** ⚠ WHERE A FLIPPED AXIS ARMS THE UN-FLIP – strictly inside `flipArm`, and the band between
       *  the two is the HYSTERESIS DEAD ZONE that arms nothing in either direction. It is what makes
       *  a flip an event of seasons rather than a flicker: at `repairPerWeek` the 20 points between
       *  60 and 40 are twenty held weeks before the un-flip can even be rolled for. */
      flipRelease: 40,
      /** ⚠ THE HAZARD ON AN ARMED AXIS-WEEK – one uniform on `seed:life:walls:<axis>:<week>`, p =
       *  this. 0.05 gives a median ~13 armed weeks (ln 0.5 / ln 0.95 = 13.5), which is the wave-5
       *  brief's own «~40 weeks of sustained pattern to arm, then a median ~13 armed weeks».
       *  ⚠ NEVER GUARANTEED IN EITHER DIRECTION (§2a): two identical patterns can differ by a season. */
      flipHazardPerWeek: 0.05,
      /** ⚠⚠ THE MAGNITUDE CAP ON THE LEAN, ±. **THE BUILDER'S ADDITION, NOT THE BRIEF'S** – §4 names
       *  six walls numbers and this is a seventh, added because without it §2a's own law is
       *  ARITHMETICALLY FALSE and reported to the architect as such rather than slipped in.
       *
       *  §2a: «the road back always exists – a closed-again girl can be opened again … A career can
       *  round-trip; that sentence is earned drama». Unbounded, a career that grinds 300 weeks at a
       *  `strained` bond reaches −450, and the walk home is then 450 weeks at `repairPerWeek` – about
       *  nine years, which is longer than the game. The round trip would be a sentence in a spec and
       *  unreachable in play, and nothing in the engine would ever say so.
       *
       *  ⚠ 100 IS SIZED AGAINST THE TWO THRESHOLDS IT HAS TO LEAVE ROOM FOR, not picked round: the
       *  deepest hole is 100 weeks of free repair back to nature (~two seasons) and 60 weeks back to
       *  the release band, so neglect still costs her real seasons of the LADDER – ruling N's «she
       *  must be walked back to 0 before a single point of growth can be bought» keeps its teeth –
       *  while the round trip stays inside one career. It is also the reason the accumulator cannot
       *  drift into a serialised number nobody bounded. A PROPOSAL like the six above; T10 prices it. */
      leanMax: 100,
    },
  },

  /** ⭐⭐⭐ v83 – THE WEDDING (wave 7; `docs/plans/life-wave-7-builder-2026-09.md` §2 T2–T4, the
   *  design `docs/plans/the-wedding-and-the-children.md` §1). One block, every number the wave
   *  spends, each row naming the task that reads it.
   *
   *  ⚠⚠ EVERY NUMBER BELOW IS A DRAFT FOR THE BENCH AND NONE IS RULED (the brief's §4 contract:
   *  «every §2 number ships at its drafted value, unruled, which is the contract and not an
   *  omission»). T8 benches them against the proposed corridors (45–70% of careers latched by 30;
   *  the cost against the wealth corridors; the bond deltas' spread) and HIS word lands on numbers,
   *  not on a blank. ⚠ THE ONE EXCEPTION IS `ageGate`, WHICH IS RULED AND NOT A DRAFT.
   *
   *  ⚠ NO CENTS ANYWHERE EXCEPT `spouseViewSpendCents` (a READ line, never a charge – `costCents`
   *  was the block's one charge until the 18.09 ruling below) – the bond deltas are BOND POINTS on
   *  `applyBondDelta`'s own scale (`ECONOMY.bond.delta`'s family), and the cents rules do not apply
   *  to them. */
  wedding: {
    /** ⭐ THE AGE GATE – RULED 11.09, art-driven and his own word («свадьба на 23+ – мне вполне
     *  ок»), superseding 23.08's 22+: the `adult` portrait set is where the bride art lives. The
     *  gate sits IN THE HAZARD, never the UI, and it reads `kidAgeExact` – the fractional age, the
     *  `life.ageGate` reading – so a girl turns eligible the week she turns 23. */
    ageGate: 23,
    /** ⭐ THE DEPTH THRESHOLD, in weeks since `sinceWeek` – the episode must be DEEP before she
     *  would marry into it, and depth is DERIVED from the row's own age (no new state). Drafted 52
     *  (the brief's own figure): a year together. ⚠ Both trajectories must reach it honestly – the
     *  one-long girl latches her old episode, the several-short girl a late one – and T8's census
     *  proves BOTH populations exist; a trajectory that cannot marry is a finding, not a shrug. */
    minEpisodeWeeks: 52,
    /** ⚠⚠ THE WEEKLY HAZARD ON AN ELIGIBLE WEEK, and it is the BUILDER'S OWN DRAFT – the one number
     *  in this block the brief did not draft, flagged here so nobody mistakes it for the
     *  architect's. Sized against the proposed census corridor by arithmetic, not measurement:
     *  45–70% latched by 30 over the ~150–250 eligible weeks a typical 23+ career holds wants
     *  p ≈ 0.004–0.008, and 0.006 sits in the middle. One uniform on `seed:life:wedding:<week>`
     *  (never MAIN), an ineligible week takes ZERO draws, and T8 measures what this figure actually
     *  produces before anybody believes it. */
    perWeek: 0.006,
    /** ⭐ THE PARENT'S THREE ANSWERS AT THE `'engaged'` BEAT – the research digest's own triple
     *  (bless / keep distance / oppose), priced on `bond` through the existing `answerLifeBeat`
     *  seam exactly as every other beat's answers are. Drafted +2.5 / −1 / −4 (the brief's own
     *  figures), corridors benched in T8, his word after the numbers.
     *  ⚠ NO ZERO AMONG THEM, deliberately – the layer's second no-free-answer kind after
     *  `'ended'`: a wedding announcement is not a card a parent can answer without it meaning
     *  something. `DRAIN_ANSWER['engaged']` is `distance`, whose −1 is the same −1 under every
     *  reading (no overlay exists for this kind), so the harnesses can state their skew exactly. */
    blessBond: 2.5,
    distanceBond: -1,
    opposeBond: -4,
    /** ⭐ THE WEDDING LANDS THIS MANY WEEKS AFTER THE BEAT IS ANSWERED – any answer, opposing does
     *  not stop it: SHE decided, and what opposing bought is the bond price and the diary's memory.
     *  Drafted 8. T3 is the reader (`landWedding`). */
    weeksAfterEngagement: 8,
    // ⚠ `costCents` (drafted $12,000) RULED OUT 18.09 – Q-1 answered in his own words: «я думаю как
    // с подарками, никто и нисколько» – like the gifts, nobody pays and nothing. What the drafted
    // charge weighed while the tree carried it: docs/specs/the-wedding-2026-09.md §3c.
    /** ⭐ WHAT MARRIAGE DOES TO THE ENDING HAZARD – wave-4's multiplier × this, on a latched
     *  episode only, applied at `rollEnds`' one seam (T4). Drafted 0.15: marriage steadies the
     *  slot, which is its whole mechanical meaning at W1. ⚠ NOT ZERO, deliberately – a latched
     *  episode ending through the OLD hazard stays possible and rare, the divorce door the schema
     *  pre-paid, and T8's bench REPORTS its frequency rather than hiding it. */
    latchEndFactor: 0.15,
    /** ⭐ THE SPOUSE'S OPINION SURFACE (T5) – at most one `'spouse-view'` beat per this many weeks,
     *  counted off the `lifeLog` itself (the row is the counter, `smallTalkThisSeason`'s doctrine –
     *  no new state). Drafted 10 (the brief's own figure): up to ~5 a season while the marriage
     *  stands, and in play fewer, because the beat also needs a TRUE occasion and a free soft
     *  surface. T8's bench measures the realised rate. */
    spouseViewCooldownWeeks: 10,
    /** ⭐ THE `'money'` OCCASION'S «LARGE» LINE, in cents – the ONE money fact the surface reads
     *  (brief T5's own boundary: «beats about money, never accounting»). A financeWeeks category
     *  at or under −this inside the marriage's own trailing window counts as a spend the spouse
     *  would mention. Drafted $2,500 – above a season's routine weekly bills, under the wedding's
     *  own $12,000 – and it is the BUILDER'S OWN DRAFT (the brief drafted no figure), flagged so
     *  nobody mistakes it for the architect's. Benched in T8 with the rest of the block. */
    spouseViewSpendCents: 250000,
    /** ⭐ THE PARENT'S THREE ANSWERS AT A `'spouse-view'` BEAT, priced SMALL on `bond` through the
     *  existing `answerLifeBeat` seam – the brief's ±0.5..±1.5 corridor, the exact figures the
     *  BUILDER'S OWN DRAFT within it, flagged. Hearing the spouse out reaches her as care (+1);
     *  «the season is what it is» is a small honest friction (−0.5); waving the concern off is a
     *  dismissal of the person she chose (−1.5). ⚠ NO ZERO among them – a word about her marriage
     *  is not free – and read-INDEPENDENT by construction: no overlay in `lifeBeatOptionsFor`
     *  names this kind, so `DRAIN_ANSWER['spouse-view']` (= `level`, −0.5, the mildest) drains at
     *  one statable number. Corridors benched in T8, his word after the numbers. */
    spouseViewHearBond: 1,
    spouseViewLevelBond: -0.5,
    spouseViewBrushBond: -1.5,
  },

  /** ⭐⭐⭐ v88 – THE PARTING (wave 12; `docs/specs/the-parting-2026-09.md` §4,
   *  `docs/plans/life-wave-12-builder-2026-09.md` §T2.1). The marriage `ECONOMY.wedding` started is
   *  the marriage this block ends, and it holds **four bond deltas and nothing else** – which is the
   *  shortest block in this file and is the wave's own boundary made structural.
   *
   *  ⚠⚠ NO MONEY, AND THE ABSENCE IS A RULING RATHER THAN AN OVERSIGHT. His wedding ruling of 18.09
   *  – «я думаю как с подарками, никто и нисколько» – extends to the parting by the spec's §2.4, so
   *  there is no `costCents`, no settlement, no claim and no ledger event anywhere in this wave. The
   *  design sketch's claim-beats stay a playtest-era option, unbuilt. A reader looking for the
   *  divorce's price will find this paragraph instead, which is the point.
   *
   *  ⚠⚠ NO HAZARD EITHER, AND THAT IS THE LOUDER ABSENCE. The ending's rate is
   *  `ECONOMY.life.endsPerWeek × endsMult[temperament] × ECONOMY.wedding.latchEndFactor` and it has
   *  been since v83 – SAME key, SAME uniform, SAME threshold. This wave changes zero draws (spec
   *  §9), so a `divorcePerWeek` row appearing here would be a second, silent hazard beside the one
   *  that actually fires.
   *
   *  ⚠ ⚠ **ALL FOUR NUMBERS ARE DRAFTS, AND THEY ARE DRAFTS OF A PARTICULAR KIND**: the spec's §4
   *  says «four answers modeled on the `'ended'` pool's shapes … whose drafted values mirror the
   *  ended deltas», so what is carried here is the SHAPE of `ECONOMY.bond.delta.ended*` (+3 / −3 /
   *  −1 / −4) under names of this block's own. Mirroring is the honest default for a card that is
   *  the same scene one rung up: it prices the parent's four moves exactly as the break-up card
   *  prices them, and leaves the question of whether a divorce should cost MORE to the owner, who
   *  has the shock row above to read it against. ⚠ THE BUILDER DID NOT INVENT A SPREAD – that would
   *  be a design decision wearing a constant (invariant 5), and the spec asked for a mirror. */
  divorce: {
    /** ⭐⭐ THE PAIR READ TWO WAYS, `ECONOMY.bond.delta.endedMatched`/`endedMismatched`'s own shape
     *  and its own argument: which of «room» and «company» is the match is HER read, drawn on
     *  `seed:life:ends:<endedWeek>:react` – the key the ending already derives – and the answer that
     *  matches costs `matched`, the other `mismatched`, whichever way round the draw came out.
     *  ⚠ ONE PRICE FOR «you gave her what she wanted» and one for «you did not», never four. */
    matched: 3,
    mismatched: -3,
    /** ⭐⭐ THE TWO READ-INDEPENDENT ROWS, and the independence is LOAD-BEARING beyond the design:
     *  `sort` is what `tools/_lifeBeats.ts` drains this kind with (`DRAIN_ANSWER['divorced']`), and
     *  a drain answer whose price moved with a fact the harness is not tracking is refused outright
     *  by `drainCostOf` rather than averaged. ⚠ AND `dismiss` IS THE ROW WITH NO READING AT ALL, the
     *  ended pool's ruling inherited word for word: «some things are wrong regardless of what she
     *  wanted» – speaking against the person she married costs −4 whichever way her read came out. */
    sortItOut: -1,
    dismiss: -4,
  },

  /** ⭐⭐⭐ v85 – THE PREGNANCY AND THE RETURN (wave 8; `docs/plans/life-wave-8-builder-2026-09.md`
   *  §2 T2–T6, the design `docs/plans/the-wedding-and-the-children.md` §5 W3+W4). `ECONOMY.wedding`'s
   *  block one wave on and in its voice: one block, every number the wave spends, each row naming the
   *  task that reads it.
   *
   *  ⚠ WITH **TWO** EXCEPTIONS, NAMED HERE SO THE SENTENCE ABOVE STAYS HONEST: T4's postpartum shock
   *  band and the `support` factor that scales it live in `ECONOMY.spirit` (`shock.postpartum` and
   *  `postpartumSupportScale`), because their one reader is `accrueSpirit` and `ECONOMY.spirit`'s own
   *  law is that its rows are the weekly pass's – `attachmentLift`'s note states it («it is read by
   *  `accrueSpirit` and by nothing else»). Put here they would have made `engine/spirit.ts`'s header
   *  false («Every constant lives in `ECONOMY.spirit` / `ECONOMY.bond`»), which is a worse trade than
   *  this cross-reference.
   *
   *  ⚠⚠ EVERY NUMBER BELOW IS A DRAFT FOR THE BENCH AND NONE IS RULED – the brief's §4 contract, the
   *  wedding block's own sentence inherited whole: «every §2 number ships at its drafted value,
   *  unruled, which is the contract and not an omission». T9 benches them and HIS word lands on
   *  numbers, not on a blank. ⚠ NO CENTS ANYWHERE IN THIS BLOCK – there is no birth fee (§2 T4's own
   *  «NO COST EVENT», the wedding-price ruling of 18.09 read one wave on) and the three deltas below
   *  are BOND POINTS on `applyBondDelta`'s scale, to which the cents rules do not apply.
   *
   *  ⭐⭐⭐ AND THE RATE IS **DERIVED**, WHICH IS THE ONE THING THIS BLOCK EXISTS TO MAKE READABLE AT
   *  THE CONSTANT. His 20.09 push-back is why this paragraph is here and not in a plan file: «а на
   *  чем основана цифра? не великовато получится?» – and the first draft's 35–60% census died of it,
   *  because it was sized by VISIBILITY («the player should get to see this») rather than by
   *  anything. The source is HIS OWN RESEARCH DIGEST, `docs/research/life-events-motherhood.md:31`,
   *  the personal-life arc's own table row:
   *
   *      | First pregnancy | 24–35 | 2–4% | support only – reaction sets recovery trajectory |
   *
   *  So the whole of the rate is that row: the WINDOW is 24–35, the ANNUAL band is 2–4%, and the
   *  weekly hazard is `annual / 52` on an eligible week. The division is written out in the rungs
   *  below rather than pre-computed, so what a reader sees IS the digest's own number: nobody has to
   *  trust a transcription of `0.000577`, and nobody can re-tune the annual figure by editing a
   *  sixth decimal place that no longer says where it came from.
   *
   *  ⭐ WHAT THE CURVE PREDICTS, AS A NUMBER, BECAUSE A DERIVATION WITH NO PREDICTION IS A STORY:
   *  **15–30% of latched careers reach a pregnancy by 35** – RULED 20.09 («и это ок»), straight from
   *  the research over the ~8.5 married window-years the corridor is stated on (1 − 0.98^8.5 ≈ 16%,
   *  1 − 0.96^8.5 ≈ 29%). ⚠ THE CORRIDOR IS HIS AND IS NOT THE CURVE'S TO BEND: T9 measures the
   *  realised share against it, and a curve that misses is the curve's finding, never the corridor's.
   *
   *  ⚠⚠ THE SHAPE OF THE CURVE IS THE **BUILDER'S OWN DRAFT** – the brief drafts the window and the
   *  annual band and NOT the shape, so it is flagged here exactly as `wedding.perWeek` and
   *  `wedding.spouseViewSpendCents` are, and nobody may mistake it for the architect's. Its
   *  arithmetic, in full:
   *
   *    · the four rungs weight the window as 3y at 2%, 3y at 3%, 4y at 4%, 1y at 3% – mean annual
   *      (3·2 + 3·3 + 4·4 + 1·3) / 11 = 34/11 ≈ **3.09%**, the middle of the digest's own 2–4%;
   *    · at the corridor's stated ~8.5 married window-years that mean gives
   *      1 − (1 − 0.0309)^8.5 ≈ **23.4%** – the middle of his corridor, which is where a derived
   *      figure ought to land when it is derived from the band the corridor was derived from;
   *    · a career married across the WHOLE window is the ceiling: 1 − 0.98³·0.97³·0.96⁴·0.97 ≈
   *      **29.2%** by the annual arithmetic, **28.8%** by the week-by-week walk the engine actually
   *      performs (weekly compounding is marginally gentler). Under the corridor's 30% either way;
   *    · the likely middle, given wave 7: a 0.006/week wedding hazard from 23 waits ~167 weeks on
   *      average, so the typical marriage latches around 26–27 → **25.2%**;
   *    · a career latched LATE – say at 31, which that hazard makes uncommon but real – carries
   *      **13.9%**, and that is the floor of the SPREAD and not of the corridor, which is a claim
   *      about the POPULATION share rather than about one career. ⚠ THE REALISED FIGURE WILL SIT
   *      UNDER EVERY NUMBER ABOVE, and the reasons are all real: careers retire, marriages end
   *      (wave 7 measured 6.2 endings per 100 latched episode-years), and the knock clause skips
   *      weeks. T9 measures; these are the predictions it measures against.
   *
   *  ⚠ WHY IT RISES AND THEN TAPERS rather than sitting flat at 3%: the digest's own two sentences
   *  about the same population. «First-child ages among pros: 26 / 28 / 31 / 35 – wide spread over
   *  the 24–35 window» puts the mass ABOVE the early twenties, and «the child-vs-career-peak dilemma
   *  (peak 23–28) is the emotional core» says why – the years the hazard competes hardest with are
   *  the peak years, and a flat curve would have said the peak costs nothing. */
  motherhood: {
    /** ⚠⚠ THE WEEKLY HAZARD ON AN ELIGIBLE WEEK, BY AGE – the block's own note above carries the
     *  derivation, the census it predicts and the flag that the SHAPE is the builder's draft.
     *
     *  ⚠ THE ANNUAL FIGURE IS QUOTED AS THE NUMERATOR AND NOT IN A COMMENT BESIDE THE ANSWER. `0.03 /
     *  52` is the digest's 3%/yr spread over its 52 weeks, evaluated at build time and costing a
     *  reader nothing; `0.000577` would be a transcription with its provenance thrown away, which is
     *  the exact failure the 20.09 push-back was about.
     *
     *  ⚠ READ AS RUNGS: the LAST rung whose `fromAge` the girl has reached wins, and an age under the
     *  first rung takes 0 (`pregnancyChanceAt`, `world/lifeBeat.ts` §14). ⚠ ASCENDING AND
     *  APPEND-ONLY-IN-SPIRIT: the read depends on the order, so a rung inserted out of sequence
     *  silently re-shapes the curve – `tests/wave8-pregnancy.test.ts` §A pins that it is sorted.
     *
     *  ⭐ THE 0 AT 35 IS A RUNG AND NOT AN ABSENCE, deliberately: «the window closes» is a sentence
     *  somebody had to type, and a table that simply stopped would leave the last real rung running
     *  for ever. ⚠⚠ AND NEITHER ZERO IS A GATE. §0's adopted recommendation is «the age window is the
     *  research's 24–35, hazard-shaped, NEVER a hard gate» – `pregnancyEligible` holds no age clause
     *  at all, the marriage door (23+, wave 7) keeps the junior years out by construction, and a 0
     *  here takes ZERO DRAWS exactly as an ineligible week does (the roll returns on the chance
     *  before it derives the stream). The difference is not cosmetic: a gate would have to be
     *  re-argued to move, and a rung is re-tuned by T9 with one number. */
    perWeekByAge: [
      // 24–27 – the window opens on the digest's own lower bound, at its LOWEST annual rate: these
      // are the peak years (23–28), the ones a pregnancy competes hardest with, and the digest's
      // youngest observed first child among pros is 26.
      { fromAge: 24, perWeek: 0.02 / 52 },
      // 27–30 – the middle of the band, and the two commonest observed ages (26 / 28) sit across
      // this rung and the one below it.
      { fromAge: 27, perWeek: 0.03 / 52 },
      // 30–34 – the digest's TOP annual rate, after the peak has passed: the observed 31 sits here,
      // and this is the stretch where a pause costs a career the least of what it was going to have.
      { fromAge: 30, perWeek: 0.04 / 52 },
      // 34–35 – the tail. The digest's oldest observed first child is 35, so the window is real this
      // late and thin: back to 3%/yr for its last year.
      { fromAge: 34, perWeek: 0.03 / 52 },
      // 35+ – the window closes. See the ⭐ note above: a rung, not an absence, and not a gate.
      { fromAge: 35, perWeek: 0 },
    ],
    /** ⭐ SHE PLAYS ON THIS MANY WEEKS AFTER THE ANNOUNCEMENT, and then the entries close – the
     *  research's own «pros play into the early months». Drafted 8 (the brief's figure). T2 writes
     *  `pausesWeek` off it at the announcement; T3 is what makes the week actually close.
     *  ⚠ PERSISTED ON THE RECORD AND NOT RE-DERIVED AT READ – `PregnancyState`'s own law (T1, and
     *  `partnerName`'s one wave down): a later retune of this number must never move the pause date
     *  of a pregnancy a live career is already carrying. */
    playsOnWeeks: 8,
    /** ⭐⭐ v87 (the architect's review of T2 – the builder's own question 1 named the falsification):
     *  **THE FIRST-TRIMESTER CAP ON THE PAUSE, FROM CONCEPTION.** `announcedWeek + playsOnWeeks`
     *  alone let a private girl's 12-week window put her last event at pregnancy week 20, and the
     *  research is unambiguous that COMPETITION stops after the first trimester
     *  (`docs/research/pregnancy-in-sport-2026-09.md` §5 – training continues, competition does not).
     *  So the pause is `min(announcedWeek + playsOnWeeks, conceivedWeek + firstTrimesterWeeks)`:
     *  the shipped «up to 8 after she tells» surface holds wherever biology allows it, and the cap
     *  binds only when the window is long – which is exactly the design doc's quiet-girl scene, «he
     *  may learn from the absence of entries»: she stops entering before he knows why.
     *  Drafted 13; a zero-window pregnancy reproduces every wave-8 date exactly (min(8, 13) = 8),
     *  which is what keeps the shipped identity pin green by arithmetic rather than by luck. */
    firstTrimesterWeeks: 13,
    /** ⭐ AND THE BIRTH IS THIS MANY WEEKS AFTER THE PAUSE – `dueWeek = pausesWeek + termWeeks`, the
     *  brief's own formula, drafted 31 (the brief's figure). ⚠ THE TWO TOGETHER ARE THE TERM: 8 + 31
     *  = **39 weeks from the announcement to the birth**, which is a full human term with the
     *  announcement read as its week 0 and the pause landing at week 8 – early enough that the
     *  research's «plays into the early months» is what the calendar actually does.
     *  ⚠ THE BRIEF'S OWN PARENTHETICAL («announcement lands around pregnancy week 8, term at 39») is
     *  the rationale for the 31 and reads one word loose – the arithmetic it describes only closes if
     *  it is the PAUSE that lands around pregnancy week 8, which is what the formula beside it says
     *  and what is built. Reported rather than papered over; both numbers ship at their drafted
     *  values. T4 fires the birth on `dueWeek`. */
    /** ⭐⭐⭐ v87 (the weight, wave 11 T2 – docs/specs/the-weight-2026-09.md §2) – **AND THE WHOLE
     *  TERM, FROM CONCEPTION, WHICH IS THE NUMBER THE BIRTH NOW RIDES ON.** `termWeeks` above has no
     *  reader in `src/` any more: `dueWeek = conceivedWeek + termTotalWeeks`, and the announcement
     *  sits INSIDE the term rather than ahead of it.
     *
     *  ⚠⚠ THE ONE-NUMBER LAW, AND IT IS THE RESEARCH'S OWN FINDING RATHER THAN A TIDY-UP.
     *  `docs/research/pregnancy-in-sport-2026-09.md` §6: «`termWeeks: 31` places conception AT the
     *  announcement, so a hidden window added without shrinking `termWeeks` by the same amount would
     *  make her pregnancy 43–47 weeks long. The two are one number and must move together.» So they
     *  did: this constant is `playsOnWeeks + termWeeks` written out as the sum it is, which is the
     *  `0.03 / 52` precedent one field up – «the annual figure is quoted as the numerator and not in
     *  a comment beside the answer» – and costs a reader nothing at run time.
     *
     *  ⚠ A LITERAL SUM CANNOT FOLLOW A RETUNE, AND A **PIN** IS WHAT CLOSES THAT, not this comment:
     *  an object literal cannot reference its own siblings, so `8 + 31` would go stale in silence if
     *  somebody moved `playsOnWeeks` to 9. `tests/wave11-window.test.ts` §A asserts
     *  `termTotalWeeks === playsOnWeeks + termWeeks` against the LIVE constants, so that retune goes
     *  red at the moment it is made instead of shipping a 40-week pregnancy. The same file pins the
     *  zero-window identity against the wave-8 BRIEF's own literals rather than against this
     *  expression, so the two claims cannot prove each other.
     *
     *  ⚠ 39 AND NOT 40, and the gap is the model's own rather than an error: a human term is ~40
     *  weeks from the last period and ~38 from conception, so 39 sits between the two conventions and
     *  is what the shipped numbers already added up to. Nothing was re-derived to reach it.
     *
     *  ⚠ `termWeeks` IS KEPT AND NOT DELETED, deliberately. It is the ANNOUNCEMENT-relative half of
     *  the sum and the number every wave-8 document, test and comment quotes; deleting it would make
     *  this constant a bare 39 with its provenance thrown away – the exact failure the 20.09 push-back
     *  was about one field up («the annual figure is quoted as the numerator and not in a comment»). */
    termTotalWeeks: 8 + 31,
    termWeeks: 31,
    /** ⭐ THE PARENT'S THREE ANSWERS AT THE `'expecting'` BEAT – the research's own finding made
     *  mechanical («support only – reaction sets recovery trajectory», the digest's row): joy /
     *  worry / the career first, priced on `bond` through the existing `answerLifeBeat` seam exactly
     *  as every other beat's answers are, AND persisted as `support` on the pregnancy record, which
     *  T5's decision and T4's postpartum recovery both read. One answer, two consequences, zero new
     *  meters. Drafted +2.5 / −0.5 / −4 (the BRIEF's own figures, not the builder's), corridors
     *  benched in T9, his word after the numbers.
     *  ⚠ NO ZERO AMONG THEM, deliberately – the THIRD no-free-answer kind after `'ended'` and
     *  `'engaged'`: an announcement like this is not a card a parent can answer without it meaning
     *  something. `DRAIN_ANSWER['expecting']` is `worry`, whose −0.5 is the same −0.5 under every
     *  reading (no overlay exists for this kind), so the harnesses can state their skew exactly –
     *  `'spouse-view'`'s own precedent: the registry names the MILDEST of a kind with no zero. */
    joyBond: 2.5,
    worryBond: -0.5,
    careerFirstBond: -4,
    /** ⭐⭐ HOW LONG THE MONTHS AFTER THE BIRTH RUN BEFORE SHE SAYS – drafted 20 (the BRIEF's figure,
     *  §2 T5). ⚠ THE DRAW LANDS AT THE **END** OF THIS WINDOW AND NOT AT ITS START, which is what
     *  makes the number price anything at all; `decisionWeekOf` (`world/lifeBeat.ts` §14) is where
     *  that is argued, and its strongest reason is mechanical rather than narrative – T4 MEASURED the
     *  postpartum mark clearing in 3–13 weeks by grade and intensity, so at +20 her `spirit` is her
     *  recovered spirit and the term below reads a number that has finished moving.
     *  ⚠ THE PAUSE OUTLIVES THE BIRTH BY EXACTLY THIS MANY WEEKS. `pauseCovering` has no upper bound
     *  of its own (T3's finding): entries stay shut from `pausesWeek` until the record goes null, and
     *  `termWeeks + decisionWeeksAfterBirth` = 31 + 20 = **51 weeks with no new entry**, a year almost
     *  to the week. (Not «off tour»: already-booked events inside the window still play out, which is
     *  the distinction the `'family'` ending's own detail line is written to respect.) T9 measures what
     *  that costs her ranking; nothing here decides it. */
    decisionWeeksAfterBirth: 20,
    /** ⭐⭐⭐ HER CHANCE OF **TRYING** – the base, before the four terms below move it. Drafted 0.65
     *  (the BRIEF's figure, «~65% to TRY»).
     *
     *  ⚠⚠ THIS IS HALF OF A TWO-FACTOR MODEL AND THE OTHER HALF IS NOT IN THIS BLOCK. The research's
     *  headline is «~40% of mothers return SUCCESSFULLY», and the brief splits it honestly rather than
     *  shipping one number that pretends to be both:
     *
     *      her decision to TRY        DRAWN, here, ~65% and `support`-weighted
     *      whether the comeback WORKS EMERGENT from T6's pricing – MEASURED, never drawn
     *
     *  and the product is the sanity line: 0.65 × ~0.6 ≈ 0.4. ⚠⚠ SO NO CONSTANT IN THIS BLOCK MAY EVER
     *  DECIDE WHETHER THE COMEBACK WORKED. A success rate written here would collapse the two factors
     *  into one and make T9's check circular – it checks the PRODUCT against the digest's sentence
     *  precisely so that neither factor has to be forced to a target. A builder who finds themselves
     *  reaching for such a number stops and brings it; it belongs to T6's pricing and to nobody's draw.
     *
     *  ⚠ THE BASE IS THE **`measured`** RATE EXACTLY, because `returnSupportShift.measured` is exactly
     *  0 – `ECONOMY.spirit.postpartumSupportScale`'s own arrangement one wave-task down, and for its
     *  reason: the band a reader sees written down should be the band one real grade actually takes. */
    returnBase: 0.65,
    /** ⭐⭐⭐ THE BIGGEST TERM, AND IT IS THE DIGEST'S OWN CLAIM – «support only – reaction sets
     *  recovery trajectory» (`docs/research/life-events-motherhood.md:31`). ⚠ THE SHAPE IS THE
     *  **BUILDER'S DRAFT** and is flagged here exactly as `perWeekByAge` above is; the BRIEF drafts
     *  the base and the ordering of the terms, not the sizes.
     *
     *  ⚠ THE ARITHMETIC, IN FULL:
     *    · grades land at **0.80 / 0.65 / 0.45** – a 35 pp spread, which is more than twice what the
     *      other three terms can move between them at realistic inputs (±0.04 spirit + ±0.03 bond +
     *      0…−0.04 age ≈ 0.11 of span). «The biggest term» is arithmetic here, not an adjective;
     *    · `measured` is EXACTLY 0, so `returnBase` above IS the measured-grade rate;
     *    · THE ASYMMETRY IS THE ANSWERS' OWN. The three answers are already priced on `bond` at
     *      +2.5 / −0.5 / −4 (the brief's ruled figures, three fields up), so the cold answer is the
     *      heaviest of the three – ratio 4 / 2.5 = 1.60. This table keeps the direction and is
     *      deliberately GENTLER: 0.20 / 0.15 = 1.33. One cold sentence eleven months earlier should
     *      TILT a woman's decision about her own career; it may not decide it.
     *  ⚠ A `null` GRADE TAKES THE `measured` CELL and is not a fourth column – `postpartumSupportScale`'s
     *  own `??` courtesy: the `'expecting'` beat BLOCKS, so no career can tick the 51 weeks from the
     *  announcement to the decision without answering it, and the null is a probe world's answer. */
    returnSupportShift: { warm: 0.15, measured: 0, cold: -0.2 },
    /** ⭐ HER OWN STATE, PER POINT OF `spirit` OFF `ECONOMY.spirit.baseline` (70). Builder's draft.
     *  ±0.04 over the ±10 band a recovered girl really sits in at the decision week; −0.28 / +0.12 at
     *  the ends of the 0–100 scale, which the clamp below then catches. ⚠ IT IS SECOND AND NOT FIRST
     *  ON PURPOSE: the digest's row says SUPPORT sets the trajectory, so her mood may move the
     *  decision and may not dominate it. */
    returnSpiritPerPoint: 0.004,
    /** ⭐ AND THE PARENT'S STANDING, PER POINT OF `bond` OFF `ECONOMY.bond.start` (70). Builder's
     *  draft, and deliberately HALF the spirit term per point: §4a's law is that her life moves
     *  `spirit` and his words move `bond`, so the number that is about HIM sits behind the number that
     *  is about HER in a decision that is hers. ±0.03 over a realistic 55–85, ±0.06 over the whole
     *  scale. */
    returnBondPerPoint: 0.002,
    /** ⭐ THE AGE TERM, AND IT IS ONE-SIDED. Builder's draft: nothing at or below `returnAgePivot`,
     *  and `returnAgePerYearOver` off the chance for each whole year past it.
     *
     *  ⚠ ONE-SIDED RATHER THAN SYMMETRIC, and the reason is the drafted base. A symmetric term would
     *  pay a 25-year-old a bonus and push her above 0.65, and then the BRIEF's own «~65% to TRY» would
     *  no longer be the base of anything – it would be the rate of a girl nobody is. So youth is the
     *  default and age is the cost, which is also the shape the digest describes: the window it names
     *  is 24–35 and the comeback stories in it thin out at the top of that range.
     *  ⚠ THE PIVOT IS 30 – the middle of the research's own 24–35 window rounded to a year, and the
     *  age a career that conceived at the hazard's own likeliest rungs actually reaches the decision
     *  at. The reachable span is −0 at 27 to −0.09 at 36 (the oldest decision this wave can produce:
     *  conception at 35, +39 weeks to the birth, +20 more to here, WHOLE years), so the whole term is
     *  worth just under two thirds of the warm grade and never more. */
    returnAgePivotYears: 30,
    returnAgePerYearOver: 0.015,
    /** ⚠⚠ AND THE BAND THE CHANCE IS HELD INSIDE – builder's draft, and NECESSARY rather than tidy:
     *  the terms above really do run off the end (cold + spirit 0 + bond 0 + 36 is
     *  0.65 − 0.20 − 0.28 − 0.14 − 0.09 = **−0.06**, and warm + spirit 100 + bond 100 is 0.98). A
     *  negative number would compare harmlessly and would still be a model claiming CERTAINTY about a
     *  woman's decision, which is the one thing this layer's §4a forbids in both directions.
     *  `ECONOMY.spirit.floor`'s own shape: a bound written down beats a value allowed to run off. */
    returnChanceMin: 0.1,
    returnChanceMax: 0.9,
    /** ⭐⭐⭐ THE FREEZE, AND THESE TWO NUMBERS ARE **RULED** (20.09, «наверное да, у нас тоже были
     *  исследования») – so they are NOT drafts and NOT this builder's, which is why they sit apart
     *  from every other row in this block under a heading that says so. The source is his own digest,
     *  `docs/research/life-events-motherhood.md:9`: «**ranking freeze for 3 years post-birth** (since
     *  2019, used by 50+ players)», and the real rule's own shape is a frozen ENTRY standing usable
     *  for a bounded number of tournaments inside that span.
     *
     *  ⚠ THREE FACTS AND TWO CONSTANTS. The third – **her rank at `pausesWeek`** – is ruled with these
     *  two and is not a number that could live here: it is a fact about one career, captured on the
     *  one week it is true (`landPregnancyPause`, `world/lifeBeat.ts` §14) and carried on the record.
     *
     *  ⚠ 156 WEEKS IS THREE YEARS AT THIS ENGINE'S OWN CALENDAR (3 × 52), written as the product
     *  rather than as `156` for `perWeekByAge`'s reason one screen up: what a reader sees is the
     *  digest's own «3 years», not a transcription with its provenance thrown away.
     *  ⚠ AND IT RUNS FROM THE **RETURN**, NOT FROM THE PAUSE – `resolveReturnDecision` writes
     *  `validUntilWeek = returnedWeek + this`, and the argument is at that line: the entitlement is
     *  what the comeback buys, `returnedWeek` is the record's own clock (the staged factor is a
     *  function of exactly that number), and anchoring both halves of `world.comeback` on one week is
     *  what stops the freeze and the ramp from being two different dates about one comeback. Anchored
     *  at `pausesWeek` instead it would be 156 − 51 = 105 usable weeks, which is a different rule and
     *  is flagged in the hand-back as the one place his «3 years» could honestly be read the other
     *  way. */
    protectedRankWeeks: 3 * 52,
    /** ⭐⭐⭐ ...AND HOW MANY ENTRIES IT BUYS – **RULED 20.09** with the span above. Twelve, counted
     *  down on `world.comeback.protectedRank.entriesLeft` and spent only where the freeze was
     *  DECISIVE (`entryVerdict`, `world/medical.ts`, where that word is argued). ⚠ A COUNT AND NOT A
     *  RATE: it is an entitlement, so it is state on the record rather than a knob read per week, and
     *  T9 measures «entries it actually buys, and how often it expires unused» rather than tuning it. */
    protectedRankEntries: 12,
    /** ⭐⭐⭐ THE STAGED FACTOR'S OWN STAIRCASE – **RE-DENOMINATED IN ELO ON HIS WORD OF 21.09, «да,
     *  деноминируем»** (wave 8b T3). −200 / −100 / −50 / 0 Elo over 0–3 / 3–6 / 6–12 / 12+ months
     *  post-return, replacing the ×0.6 / ×0.8 / ×0.9 / ×1.0 MULTIPLIERS this table shipped with.
     *
     *  ⚠⚠ **WHAT WAS WRONG WAS THE UNITS AND NOT THE SHAPE**, and it was measured rather than felt:
     *  [the-comeback-staircase-2026-09.md](../../../docs/research/the-comeback-staircase-2026-09.md)
     *  prices the old first rung through `coreForStanding`/`eloForStanding` and finds that **×0.6 on a
     *  #31's wings is −477 Elo at this engine's own measured rate** – she played the first three
     *  months like **#380**, level with the W15 field and a ten-point donor at every big draw. The
     *  research's own «−40%» reads as −150…−250 Elo in the same currency, so the shipped first rung
     *  was about **twice too deep**. The digest's sentence is unchanged and still governs; what
     *  changes is that «−40% of form» is now spelled in the currency `fieldPros.ts` keeps its whole
     *  table in, instead of as a fraction of her wings.
     *
     *  ⭐ AND THE A1 INVERSION IS WHAT IT WAS ALWAYS ABOUT. Wave 8's ramp trap ran BACKWARDS – straight
     *  back to the big draws beat a careful small-first programme 8/8 and 16/18 – and §3 of the
     *  research isolates this table as the cause: a returner even with the W15 fields she was sent to
     *  farm harvests 55 points a year, while twelve first-round exits at the big draws bank 120. No
     *  design change, no points floor, no body cost: the units.
     *
     *  ⚠ THE SHAPE IS STILL THE RESEARCH'S OWN SENTENCE – `docs/research/life-events-motherhood.md:35`,
     *  «staged penalties ≈ −40% (0–3 mo) → −20% (3–6) → −10% (6–12) → full recovery 12+ mo» – and the
     *  windows below are untouched. Four rungs, halving, ending at zero.
     *
     *  ⚠ THE SIZES CARRY ±10%, NAMED BY THE RESEARCH ITSELF: `eloPerCore` was measured on FLAT builds
     *  and a ×-factor build is not flat. It changes nothing in the conclusion – −477 against −250 is
     *  not inside any error bar.
     *
     *  ⚠⚠ **IT IS A TIME-SHAPED MULTIPLIER ON THE ABSENCE AND IT READS NOTHING FROM RESULTS.** §0 of
     *  the wave brief names the fence and names the document it is a fence around:
     *  `docs/specs/form-and-slump.md` (results-driven form) is OWNER-PARKED – «форму и спад тоже давай
     *  распишем спеком, но уже на потом» – and this factor «is NOT that spec and must not become it by
     *  the back door». Three properties, all of them mechanical rather than promised:
     *    · it is a function of `world.comeback.returnedWeek` and the current week, and of nothing else;
     *    · it is dead at 1.0 for every career that never paused – `comebackMatchFactor`'s reader takes
     *      the same early return `spirit` and `form` take, so the composition is byte-identical;
     *    · the ARGUMENT TYPE it is read through carries `returnedWeek` and no other field, so a
     *      result is not merely unread here, it is out of scope at the call site.
     *  ⚠ ANY BUILDER WHO FINDS THEMSELVES READING MATCH OUTCOMES INTO IT STOPS AND BRINGS IT. That is
     *  §0's instruction verbatim and it is the one line of T6 that is not negotiable.
     *
     *  ⚠ THE WINDOWS ARE MONTHS IN THE RESEARCH AND WEEKS IN THE ENGINE, and the conversion is
     *  written as arithmetic rather than as three transcribed integers, on `perWeekByAge`'s own rule
     *  one screen up: `52 / 4` is three months, `52 / 2` is six, `52` is twelve. A reader sees the
     *  digest's own staircase; nobody has to trust `13` / `26` / `52`.
     *
     *  ⚠ READ AS RUNGS, `perWeekByAge`'s own shape and its own hazard: the LAST rung whose
     *  `fromWeeksBack` she has reached wins, so the table must stay ASCENDING – a rung inserted out of
     *  sequence silently re-shapes the ramp. ⭐ AND A WEEK BEFORE THE RETURN TAKES **NO RUNG AND
     *  THEREFORE 1.0**: a match played before she came back is not a comeback match, and the stored
     *  `WorldMatch` of one must replay exactly as it was. */
    /** ⭐⭐⭐ HOW LONG «SMALL EVENTS FIRST» ACTUALLY MEANS «ONLY SMALL EVENTS» – the owner's ruling of
     *  21.09, and it started as his own reading of the ramp rather than as a tuning: «если сольет все
     *  турниры в первый год, то в следующем автоматически будет играть более низкие, разве нет?» Yes –
     *  the freeze is twelve entries and it is spent ONCE, so the only lever the card ever had is WHEN.
     *
     *  MEASURED before it was ruled (`docs/specs/the-motherhood-2026-09.md` §15.5, n=15 paired
     *  returns off one card, five arms on the same clones):
     *
     *      arm                     pts@52w  rank@52w  freeze  pts@104w  rank@104w  top-100  back to #39
     *      only smalls (policy)          0      1621     0.0         0       1620     0/15        0/14
     *      straight back               703       267    11.2       914        173     5/15        0/14
     *      hybrid, hold 13             464       295    11.2       711        143     4/15        1/14
     *      hybrid, hold 26 (THIS)      460       268     9.9       945        117     7/15        2/14
     *
     *  ⭐ Hold-26 takes every LONG metric and matches straight-back's 52-week rank, conceding only the
     *  first year's points – six months of small draws rebuild a live standing, and the freeze then
     *  opens big draws at −50/0 instead of −200, which converts into runs rather than first-round
     *  exits. ⚠⚠ AND «ONLY SMALLS» IS NO LONGER OFFERED AS AN ANSWER, by his ruling, because it is
     *  DOMINATED by the hybrid at both horizons and at both hold points – a card may not offer a
     *  measured trap as one of its two answers.
     *
     *  ⚠ WHAT IT MOVES IS A **LABEL**, NEVER A REFUSAL. `EntryStatus.offReturnPlan` is a preference
     *  the player can override week to week (T6 §C); past this many weeks from `returnedWeek` the
     *  label simply stops being raised, so the same plan stops calling a big draw off-plan. Nothing
     *  becomes newly legal and no entry cap moves.
     *
     *  ⚠ 13 WAS MEASURED TOO and is the retune if the six months read long; the curve between them is
     *  not measured, which is the honest limit on this number (n=15, two hold points). */
    /** ⭐⭐ W5/T2 – HOW LONG «SMALL» LASTS, the window `awayFromSmallChild` reads off the child's own
     *  `bornWeek`. Drafted at three years (156 weeks): the span the digest's protected ranking runs
     *  for, and the age by which a child stops being carried everywhere. The wave-9 brief names this
     *  as one of the two things T2 was to BRING rather than decide, so it is his with the bench's
     *  numbers beside it (T7).
     *  ⚠ A window and not a flag: nothing is persisted and no save gains a key – the child's row
     *  already holds the only fact this needs. */
    childSmallWeeks: 156,
    /** ⭐⭐⭐ W5/T3 – THE SECOND CHILD'S OWN CURVE, and it is a different curve rather than the first
     *  one re-used. His digest's row is explicit and is the whole source: «Second child | 28–38 |
     *  1–2% | even less influence» – a LATER window than the first pregnancy's 24–35, a LOWER annual
     *  rate than its 2–4%, and the design's own sentence about the third («the repeat hazard reads
     *  the age window AND the count of children, so a third stays rare rather than routine»).
     *  ⚠ The rungs are read exactly as `perWeekByAge`'s are – last rung at or below her age wins –
     *  so the two curves cannot drift apart in how they are consumed, only in what they say. */
    repeatPerWeekByAge: [
      // 28–34 – the digest's window opens here, at its TOP annual rate: she is past the peak years,
      // the first child is old enough to have stopped being an infant, and this is where the two
      // documented multi-return careers sit.
      { fromAge: 28, perWeek: 0.02 / 52 },
      // 34–38 – the tail, at the digest's LOW rate. Real and thin, exactly as the first curve's
      // last rung is.
      { fromAge: 34, perWeek: 0.01 / 52 },
      // 38+ – the window closes. A rung and not an absence, `perWeekByAge`'s own law.
      { fromAge: 38, perWeek: 0 },
    ],
    /** ⭐⭐ AND EVERY CHILD AFTER THE SECOND MULTIPLIES THE HAZARD BY THIS – the «count of children»
     *  half of the design's sentence, as one number rather than a third curve. At 0.5 a third child
     *  runs at half the second's rate and a fourth at a quarter: rare, never impossible, and the
     *  bench reports what it produces instead of the constant promising it.
     *  ⚠ RULED BY HIM 21.09 that there is NO CAP – «пусть решает арифметика» – so this factor is the
     *  only thing making a large family rare, which is exactly the job it was given. */
    repeatCountFactor: 0.5,
    /** ⭐ HOW LONG AFTER A BIRTH THE NEXT PREGNANCY CANNOT START. Drafted at a year, and it is the
     *  ONE number in T3 the digest does not supply: what it protects is the comeback itself, because
     *  a pregnancy inside the return ramp would overwrite `world.comeback` and take back the freeze
     *  she is in the middle of spending. ⚠ DRAFTED, NOT RULED – benched in T7, and the alternative
     *  shape (refuse only while the freeze has entries left) is written up there rather than chosen
     *  here. */
    repeatCooldownWeeks: 52,
    /** ⭐⭐⭐ W5/T5 – «PRIORITIES SHIFT», AS ROOM RATHER THAN AS A GIFT. The research digest's one
     *  PERMANENT effect («possible permanent mental-resilience bonus after the return») and the only
     *  skill-adjacent number this whole branch is allowed to touch – which is why it ships with a
     *  bench and a spec row (invariant 5) and at a drafted value.
     *
     *  ⚠⚠ IT RAISES HER COMPOSURE **CEILING** AND NEVER HER COMPOSURE, and that shape is round 42
     *  #35's, re-used rather than re-invented: the psychologist's years already buy room above a
     *  rolled ceiling and ordinary development climbs into it. Three things follow that a raw bump
     *  could not give – she EARNS it week by week rather than receiving it, it cannot overshoot, and
     *  it composes with the seat's own bonus without either one needing to know about the other.
     *
     *  ⚠⚠ AND THE CEILING IS THE ONLY SHAPE THAT WORKS AT ALL, which is a measurement and not a
     *  preference: wave 8b's arm 7 walked careers and found a coached one reaching **96–98% of her
     *  own headroom by about twenty-two** (`docs/research/the-unclosable-head-2026-09.md` §7), and
     *  the first child arrives at 24+. A bonus clamped to her rolled ceiling would therefore be worth
     *  almost nothing to almost everybody; room ABOVE it is worth exactly what she then trains into.
     *
     *  ⚠ PER CHILD AND DERIVED FROM `world.children`, so nothing is persisted, nothing can be applied
     *  twice, and a second child adds its own room – with `returnPoiseMax` as the cap so a large
     *  family cannot become a composure strategy. */
    returnPoiseCeiling: 1.5,
    /** The cap on the above, whatever the family's size. Drafted at two children's worth. */
    returnPoiseMax: 3,
    smallFirstHoldWeeks: 26,
    comebackStages: [
      // 0–3 months – the deepest rung, and the one the wrong ramp spends its protected entries
      // inside. ⭐ 200 Elo is the top of the research's own −150…−250 corridor (§3 of the staircase
      // document), which is where «−40% of form» lands once it is priced: on a #31 it is ×0.832, a
      // returner playing like #151 rather than like #380.
      { fromWeeksBack: 0, dElo: 200 },
      // 3–6 months – half of it, exactly as the digest's −20% is half of its −40%.
      { fromWeeksBack: 52 / 4, dElo: 100 },
      // 6–12 months – half again.
      { fromWeeksBack: 52 / 2, dElo: 50 },
      // 12+ months – full. ⭐ A RUNG AND NOT AN ABSENCE, `perWeekByAge`'s own 0 at 35: «the ramp ends»
      // is a sentence somebody had to type, and a table that simply stopped would leave the last rung
      // running for the rest of her career. ⚠ AND IT IS **EXACTLY** ZERO, which is load-bearing
      // arithmetic rather than tidiness: `(core − 0) / core` is exactly 1.0 in IEEE-754, so a career
      // twelve months back composes BYTE-IDENTICALLY to one that never paused – the property
      // `tests/wave8-comeback-factor.test.ts` §B pins with `toEqual` on the whole player.
      { fromWeeksBack: 52, dElo: 0 },
    ],
  },

  /** ⭐⭐⭐ THE DYNASTY (v86, wave 10 T3 – docs/specs/the-dynasty-2026-09.md §7). His ruling, 22.09:
   *  «наследственность темперамента – можно и забенчить, мне кажется».
   *
   *  ⚠ ONE NUMBER AND ONE AXIS, and both halves of that are decisions. `opennessLean` is the chance
   *  the daughter takes her mother's OPENNESS pole; the intensity axis stays uniform and is not
   *  listed here, because a constant for «no lean» would be a dial somebody would eventually turn.
   *  §7's reason, verbatim: openness is the EXPRESSIVE axis – heredity the player can HEAR in the
   *  diary's voice – while intensity prices costs and depths, where a lean would correlate the
   *  dynasty with cost profiles for no story gain.
   *
   *  ⚠⚠ IT RE-MAPS A DRAW AND NEVER ADDS ONE. `temperamentFor` takes exactly two draws off
   *  `seed:temperament` with the lean and without it (`engine/spirit.ts`), so a dynasty career and a
   *  wizard career sit at the same stream position afterwards and the frozen MAIN capture cannot see
   *  this constant at all.
   *
   *  ⚠ DRAFTED AT 0.65 AND THE BENCH CONFIRMS IT (T7 §1, N=400, §8 row 1). 0.5 would be no heredity
   *  at all and 1.0 would make the line a copy of itself; the number is the one the spec drafted and
   *  it moves only on a measurement, never on an agent's word (invariant 5). */
  dynasty: {
    /** the chance a daughter takes her mother's openness pole; the rest takes the opposite */
    opennessLean: 0.65,
  },

  /** ⭐⭐⭐ v87 – **THE WEIGHT** (wave 11; docs/specs/the-weight-2026-09.md, the design
   *  docs/design/the-months-before-she-says-2026-09.md, the research
   *  docs/research/pregnancy-in-sport-2026-09.md). The layer's last step: the pregnancy that ends,
   *  and the death in the family. Both behind ONE switch, `world.weightEnabled`, RULED 22.09.
   *
   *  ⚠⚠ **THE ONE THING THIS BLOCK MUST NEVER MODEL IS THE PARENT AS THE CAUSE, AND IT IS A FINDING
   *  RATHER THAN A SCRUPLE.** The design's §2, the research's §6.3: nothing in the evidence supports
   *  training as a cause of a pregnancy loss, the IOC summary's concern is contact and falls, and AGE
   *  DOMINATES THE VARIANCE. A game where a hard training block CAUSES a loss is asserting something
   *  untrue and is telling every player the sentence women already hear too often. So the hazard
   *  below takes AGE and the dice, and its signature is written so the read-set is visible from the
   *  outside – `pregnancyLossChanceAt(ageYears)` takes no world at all, which is a fence a refactor
   *  cannot quietly move. ⚠ The same law binds the bereavement: temperament-free, world's dice. */
  weight: {
    /** ⭐⭐⭐ **THE WEEKLY LOSS HAZARD, BY AGE** – per-week rates that integrate to the research's
     *  J-curve over the window the research itself defines. DRAFTED; T6's bench confirms the
     *  integral, and his word finalises.
     *
     *  ⚠⚠ THE TOTALS ARE THE PRIMARY SOURCE'S, QUOTED AS THE NUMERATORS THEY ARE rather than
     *  transcribed into decimals with their provenance thrown away (`motherhood.perWeekByAge`'s own
     *  20.09 lesson): Magnus MC et al., BMJ 2019, **421,201 Norwegian pregnancies** – **9.8%** at
     *  25–29, **10.8%** at 30–34, **16.7%** at 35–39. Our window is 24–38, so it sits across the
     *  FLOOR and the CLIMB, and a flat rate would be wrong at both ends.
     *
     *  ⚠⚠ **THE INTEGRAL RUNS OVER 14 WEEKS AND NOT OVER THE 39-WEEK TERM, AND THAT IS THE
     *  RESEARCH'S OWN DENOMINATOR RATHER THAN THIS BUILDER'S CHOICE.** The study counts RECOGNISED
     *  pregnancies, «fetal death before 20 gestational weeks … identified between 6 and 20 weeks»;
     *  gestational weeks are counted from the last period, about two ahead of conception, so the
     *  study's own window is conception weeks 4 to 18. `lossFromWeek` and `lossUntilWeek` below are
     *  that window, and these rates are `1 - (1 - total)^(1/14)`.
     *  ⚠ SPREADING THE SAME TOTAL OVER ALL 39 WEEKS WOULD SHIP A DIFFERENT EVENT, which is the
     *  reason this is a deviation worth the paragraph: a loss drawn at week 36 is two weeks from the
     *  due date, is clinically a stillbirth rather than a miscarriage, and is far heavier content
     *  than the design asked for. The plan drafts «integrating to the J-curve over the term» and
     *  leaves the term's meaning to the builder; this is the reading that ships the modelled event.
     *
     *  ⚠ READ AS RUNGS, `motherhood.perWeekByAge`'s own law: the LAST rung whose `fromAge` she has
     *  reached wins, and an age under the first rung takes 0. ASCENDING AND APPEND-ONLY-IN-SPIRIT –
     *  the read depends on the order, and `tests/wave11-loss.test.ts` §A pins that it is sorted.
     *  ⚠ 24 TAKES THE 25–29 RATE because the study's floor band is the lowest it publishes inside
     *  our window, and a 24-year-old is not a lower-risk animal than a 25-year-old – the band below
     *  it (20–24, 11.3%) is HIGHER, so borrowing the floor is the conservative read rather than a
     *  flattering one. ⚠ NO RUNG ABOVE 35: the game's window closes at 38 and the study's 35–39 band
     *  covers all of it; 40–44's 32.2% is a cliff no career here can reach. */
    lossPerWeekByAge: [
      // 24–29 – the J-curve's floor, and the lowest single year in the study is 27 at 9.5%.
      { fromAge: 24, perWeek: 1 - Math.pow(1 - 0.098, 1 / 14) },
      // 30–34 – barely above the floor, which is the finding rather than the middle of a slope.
      { fromAge: 30, perWeek: 1 - Math.pow(1 - 0.108, 1 / 14) },
      // 35+ – the climb. Half again on the floor, and the reason a flat rate would be wrong.
      { fromAge: 35, perWeek: 1 - Math.pow(1 - 0.167, 1 / 14) },
    ],
    /** ⭐⭐ THE FIRST WEEK AFTER THE CONCEPTION THE HAZARD CAN FIRE ON, and the last (EXCLUSIVE) –
     *  the research's own recognised-pregnancy window, mapped onto the conception clock. See
     *  `lossPerWeekByAge`'s block for the mapping and for why the integral runs over these fourteen
     *  weeks rather than over the whole term.
     *
     *  ⚠ THE WINDOW OFTEN CLOSES BEFORE SHE HAS EVEN TOLD HIM, and that is the arithmetic rather
     *  than a design decision: a private girl's hidden window runs up to 12 weeks, so a loss can land
     *  on a pregnancy the parent never knew existed. The design's §4 row for `deep` – «the one who
     *  may not tell him at all» – is exactly this case, and T4's words are written for both sides of
     *  it. */
    lossFromWeek: 4,
    lossUntilWeek: 18,
    /** ⭐⭐ HOW SOON AFTER A LOSS THE PREGNANCY HAZARD MAY FIRE AGAIN – DRAFTED 26, against the
     *  BIRTH's 52 (`motherhood.repeatCooldownWeeks`). The spec's §3: «a loss re-arms the pregnancy
     *  hazard behind a gentler cooldown, reading the same eligibility machinery wave 9 built».
     *
     *  ⚠ GENTLER FOR A MECHANICAL REASON AND NOT A KIND ONE, which is worth writing down because the
     *  kind reason would be the wrong kind of reason to put in a constant: the birth's 52 protects
     *  the COMEBACK – `world.comeback` holds a freeze she is in the middle of spending, and a second
     *  pregnancy overwrites that record. A loss creates no comeback and no freeze, so there is
     *  nothing to protect and the only thing the number is for is that the same week should not
     *  re-arm the hazard it just discharged. */
    lossCooldownWeeks: 26,
    /** ⭐⭐⭐ **A DEATH IN THE FAMILY** (the spec's §4; his 23.08 «вплести похороны» and the
     *  numbers he drafted on 11.09). ⭐ RULED 22.09 (question 3): **his 11.09 figures enter as
     *  DRAFTED CONSTANTS** – the bench confirms the corridor, his word finalises.
     *
     *  ⚠⚠ **THE HAZARD IS TEMPERAMENT-FREE AND THAT IS A DESIGN LAW WITH A PIN**: a death is the
     *  world's dice, never her personality's. Only the RESPONSE is hers – intensity prices depth (and
     *  therefore duration, under the one-rate law), openness prices expression. `bereavementChanceAt`
     *  takes no arguments at all, which is the same fence `pregnancyLossChanceAt`'s signature builds
     *  one field up, pushed as far as it goes.
     *
     *  ⚠ THE ARITHMETIC, IN FULL, because his own words on 11.09 are the corridor T6 measures
     *  against rather than a number to re-derive: 0.08%/week is ≈**4.1%/season** (`1 - 0.9992^52`),
     *  E ≈ **0.50** over the 23→35 tail (624 weeks), ≈**39%** of careers meet one and ≈**9%** a
     *  second before the spacing and the cap bite. The spec's §8 row 1 predicts «~40% / ~8%», which
     *  is what the unconstrained arithmetic says and what the two clauses below then trim. */
    bereavement: {
      /** the weekly chance, from the adult rung. ⚠ A **RATE** AND NOT A GATE – the gate is the rung. */
      perWeek: 0.0008,
      /** ⭐⭐ THE FLOOR IN WEEKS BETWEEN TWO OF THEM – his 11.09 «spacing ≥ 156». Three years, which
       *  is `motherhood.protectedRankWeeks`' own span read for a different reason: two deaths inside
       *  a season would read as a mechanic rather than as a life, and the spacing is what stops the
       *  dice telling that story. ⚠ IT READS `world.bereavementWeeks` and never a derived guess. */
      spacingWeeks: 156,
      /** ⭐⭐ AND THE HARD CAP – his 11.09 «hard cap 2 per career». ⚠ A CAP AND NOT A SHAPED DECAY,
       *  deliberately: a third is not rarer, it is absent, because past two the arc stops being a
       *  life and starts being a theme. */
      capPerCareer: 2,
      /** ⭐⭐ THE RUNG NOTHING FIRES BELOW – `kidAgeExact >= 23`, his 23.08 «начиная со ступени
       *  adult». ⚠⚠ **THE ASSET ENFORCES WHAT THE GATE PROMISES**, which is why this number is not
       *  merely a taste: `fem-euro-brunnet-adult-funeral.webp` exists at the `adult` band and at no
       *  other, so a bereavement below it would have no picture to wear. The 11.09 log says so in as
       *  many words – «Funeral exists at `adult` ONLY – the asset enforces his 23.08 by
       *  construction». */
      fromAgeYears: 23,
    },
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
    // ⚠⚠ THE ADULT LIMB LANDED 30.08 (round 30 #26/#27), AND THE NUMBERS BELOW ARE THE FITTED ONES –
    // measured, not chosen. `docs/specs/age-injury-curve-2026-08.md` §4b is the fit and §4c its
    // predicted-vs-measured table; do not re-derive them, re-run that bench.
    //
    // WHAT WAS WRONG. `default: 0.85` was the table's LOWEST value and it carried every year from 19
    // to retirement, so nineteen, twenty-five and thirty-four were one body and all three were 29%
    // safer than a sixteen-year-old. The note above is still true – the table was never wrong, it was
    // UNFINISHED – and the fallback quietly became the adult model when careers grew to forty.
    //
    // WHAT THE SHAPE IS, ROW FAMILY BY ROW FAMILY:
    //   13-18  the shipped junior shape x0.7. The SHAPE is the owner's own research (§3.1) and is not
    //          re-argued – the peak is still at 16, the ladder is the same – only its HEIGHT moves.
    //          16-18 measured 64.5% against its own researched anchor of 46-54%, the single most
    //          over-band row in the table; x0.7 takes it to 59.0% and 13-15 to 49.7%, still in band.
    //   19-27  the prime, FLAT at 0.25. Both WTA studies that tested age for INCIDENCE returned null
    //          (research §5b), so a rising limb through the prime is not licensed by anything.
    //   28-33  the rise, LINEAR, and 34+ is 2x the prime. That 2x is the bottom of the only quantified
    //          proxy band (2.3-4.9x in football, research §5d) and deliberately nowhere near its top,
    //          because tennis's own two attempts at the question came back null.
    //
    // ⚠ THE LEVEL MOVED WITH THE SHAPE ON PURPOSE, and that is what makes it shippable: season
    // prevalence measured 58.5% against the professional research band of 30-54%, and the fitted
    // curve lands 51.4% – IN BAND, from outside it. A level-neutral variant of the same shape is
    // measured beside it (§4d) and lands 58.4%, i.e. out of band; it was not taken.
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

    // --- SEVERITY BY AGE (round 30 #27 limb 1, the owner 30.08: «тяжесть надо взять точно, но
    // разумно») ---------------------------------------------------------------------------------
    //
    // ⭐⭐ THIS IS THE BEST-SOURCED OF THE THREE LIMBS, and it is a different instrument from
    // `ageInjuryFactor` above. Research §5c: tennis shows BURDEN rising with age, not incidence –
    // the SEVERE share (>28 days lost) runs 43% in adolescents against 54-66% in
    // collegiate/professional players, a ratio of 1.26-1.53x, where every incidence number in the
    // sport shows no gradient at all (§5b, two WTA nulls). So the events stay where the fitted curve
    // put them and the CONSEQUENCES move.
    //
    // ⚠ «РАЗУМНО» IS HIS WORD AND IT IS APPLIED AS A CEILING, NOT AS A TARGET. The whole
    // adolescent-to-veteran climb below is 1.26x – the BOTTOM of the sourced 1.26-1.53 band, not its
    // middle and not its top. A model that took 1.53 would be quoting the most generous reading of a
    // single systematic review as if it were a measurement of this sport at this age.
    //
    // THE SPLIT INSIDE THAT CEILING, and only the first half of it is sourced:
    //   13-18 -> 1.00   the anchor. This IS the 43% the source measures; it must not move, or the
    //                   ratio the whole table expresses stops being the ratio that was published.
    //   19-27 -> 1.13   `[I]` the adolescent->professional step, taken at ABOUT HALF the ceiling.
    //                   The source's contrast is adolescent-vs-professional and a nineteen-year-old
    //                   IS a professional, so the literal reading would spend the whole 1.26 here –
    //                   but that leaves no gradient inside adulthood, which is the half he asked
    //                   for, and it would put a cliff at the birthday.
    //   28-33 -> linear, 34+ -> 1.26   `[I]` from Williams S et al., J Sci Med Sport 2023 (elite
    //                   rugby union): a heavy season raises the following season's BURDEN and not
    //                   its incidence, and the effect is «driven by an increased risk for older
    //                   (>26y) Forwards». That is the only sourced within-adult burden gradient in
    //                   a comparably-loaded sport, and 28 is where the frequency curve above starts
    //                   rising too – ONE age story, told twice, rather than two that can drift.
    //
    // ⚠ IT SCALES THE BANDS' CUMULATIVE THRESHOLDS AND NEVER THE LAYOFF LENGTHS. `escalatedBands`
    // multiplies each band's TAIL probability and leaves `weeksLo`/`weeksHi` exactly as they are,
    // which is round 16 #13's own ruling restated: «What changes above moderate is how OFTEN you get
    // there, never what it costs when you do.» A stress reaction does not take longer to heal
    // because the body it happened to is thirty-four.
    //
    // ⚠ AND IT CANNOT MOVE A DRAW. It is read AFTER the severity uniform has been pulled and only
    // decides what that already-drawn number MEANS – the same post-draw discipline
    // `severityBandsFor` and every multiply in `injuryTau` are built on.
    severityAgeFactor: {
      13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1,
      19: 1.13, 20: 1.13, 21: 1.13, 22: 1.13, 23: 1.13, 24: 1.13,
      25: 1.13, 26: 1.13, 27: 1.13,
      28: 1.15, 29: 1.17, 30: 1.19, 31: 1.2, 32: 1.22, 33: 1.24,
      default: 1.26,
    } as { [age: number]: number; default: number },

    // --- RECURRENCE (round 30 #27 limb 2) ---------------------------------------------------------
    //
    // THE OWNER, 30.08: «раз мы храним историю травм у себя, то вполне можно делать алгоритм,
    // который будет увеличивать немного вероятность новой такой же травмы или ее прогрессии (более
    // тяжелой). Мне кажется это похоже на правду.» It is the strongest of his three, because
    // PREVIOUS INJURY IS THE BEST-ESTABLISHED RISK FACTOR IN SPORTS-INJURY EPIDEMIOLOGY – ahead of
    // age and ahead of load.
    //
    // ⭐⭐ AND THE POINT IS CLUSTERING, NOT LEVEL, which is what makes it the answer to his OTHER
    // complaint («ни одной травмы я не видел уже несколько сезонов»). Measured onsets are 0.68-0.78 a
    // season and his own lifetime rate is 0.64: the number was never the problem. INDEPENDENT WEEKLY
    // DRAWS PRODUCE EXACTLY THE FORGETTABLE PATTERN HE DESCRIBES – nothing, nothing, a niggle,
    // nothing. «Three quiet years, then the ankle went twice in one season» is the SAME TOTAL told
    // properly, and only a mechanic with memory can tell it.
    //
    // ⚠⚠ THE CEILING AND THE DECAY ARE THE DESIGN, NOT A SAFETY RAIL BOLTED ON AFTERWARDS – «мы ни
    // за что не наказываем». A first injury may not doom a career. Without a decay this is a death
    // spiral wearing realism's clothes, so:
    //
    //   halfLifeWeeks 52   ONE SEASON. An ankle sound for three seasons has 0.5^3 = 12.5% of its
    //                      weight left, which is the owner's own test («an ankle that has been sound
    //                      for three seasons stops being the weak ankle») answered in arithmetic
    //                      rather than in prose. Counted from the RECOVERY week, which is what
    //                      `injuryHistory` rows carry – so a long layoff starts decaying when she is
    //                      back on court, not when she went down.
    //   loadCap 1          THE CEILING. The decayed sum saturates at one unit – "at most one fresh
    //                      major injury's worth of memory" – so a career cannot stack six niggles
    //                      into a body that breaks every fortnight. Every factor below is
    //                      `1 + bump x load`, so the cap is a cap on all three at once.
    //
    // ⚠ NO SCHEMA MOVE. `injuryHistory` already holds `kind`, `severity`, `week` and `weeksOut`, and
    // `bodyPartOf` already turns a `kind` back into one of the twelve regions. Nothing new is
    // persisted, so `SAVE_SCHEMA_VERSION` does not move and no migration is owed.
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
    // ⭐⭐⭐ ROUND 43 #4 – AND IT IS THE OPENING PRICE NOW, NOT THE PRICE. His 16.09 ruling: «мы
    // начинаем работать с массажистом по нашим текущим ценам, а дальше он приходит и просит
    // прибавку, либо (так как альтернативы нет) добавить денег, но убавить количество процедур…
    // может просить надбавок за свои часы ежегодно, может быть не так интенсивно как тренер». So
    // the rate above is where every career starts and this is the drift away from it, compounded
    // once per completed year on the payroll (`masseurSessionCents`, world/masseur.ts).
    //
    // ⚠⚠ THE YARDSTICK IS THE COACH AND NOT A MARKET, and that is a ruling rather than a shortcut.
    // Round 43 #6 asked the research for a real-world masseur figure and was WITHDRAWN when he
    // closed the design: an outside benchmark would only be needed to re-price him from scratch,
    // which is not what was asked. «Не так интенсивно как тренер» is the whole constraint, the
    // coach's own annual ask is a 5–15% corridor (round 42 #51, specified and not yet built), and
    // 4% sits clearly under its floor.
    //
    // ⚠ MEASURED, NOT GUESSED (invariant 5) – `npm run bench:masseurraise`, the tables in
    // docs/specs/the-masseurs-ask-2026-09.md. What 4%/yr buys over a career:
    //
    //     years served      1      4      8     12     16     20
    //     the session     $78    $88   $103   $120   $140   $164
    //     the entry rung $156   $176   $206   $240   $280   $328  a week
    //
    // The pressure he asked for is real and slow: at a constant spend the top rung (7 × the rate)
    // buys one rung less after fifteen years (M4, measured), which is «это может нам скомпенсировать все
    // ранги» over a career rather than over a season. ⚠ AND THE ONE THING THE BENCH HAD TO PROVE:
    // the ENTRY rung must never drift out of a modest family's reach, or the poor lose the seat to
    // arithmetic instead of to a decision. See the spec's §4 for the measured wallet.
    //
    // ⚠ DETERMINISTIC – no corridor, no jitter, NO DRAW ON ANY STREAM. The file's own legibility
    // rule («a salary is a negotiated number the player can read») is the reason: a rate that
    // wobbled would make the card's quote and the ledger's row two different numbers.
    raisePerYear: 0.04,
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
    //
    // ⭐⭐ RAISED 2 -> 3 ON 19.09, AND IT ANSWERS THAT QUESTION FROM THE OTHER SIDE. The note above is
    // KEPT because it is the record: he once asked whether +2 a round was already too much, and the
    // measurement kept 2 rather than dropping to 1. On 19.09 he named this dial himself as one of
    // four to RAISE – «слив на глубине хода и ТУРНИРНАЯ РАБОТА МАССАЖИСТА, а также обычная работа
    // массажиста и естественное восстановление» – so the direction is his, and the later ruling
    // governs the earlier worry.
    //
    // WHY IT IS THE RECOVERY WITH THE MOST ROOM, in one line: the season equation's §3 found that
    // the CEILING, not the dial, is what a rest week runs into – she banks 4.7 of a 10.1 week,
    // because a holiday has just put her at 100 – and this is the only recovery in the game that
    // lands on a week she PLAYS, where the ceiling cannot eat it.
    //
    // ⚠⚠ AND +1 IS THE WHOLE STEP, FOR A MEASURED REASON, not for timidity. The relief is subtracted
    // from the run's strain AFTER the fact and scales with (matches − 1), so raising it flattens
    // what DEPTH is worth: at +2 a straight-sets W15 title nets EIGHT against a first-round exit's
    // four, and the title week has stopped being twice the exit – the depth curve flattened rather
    // than softened. At +1 it nets twelve against four, so a title is still three times an exit at
    // the cheapest rung and five times at a Slam. `tools/season-equation.ts`'s `netDepthWitness`
    // measures exactly that ratio per cell, because the relief is subtracted AFTER
    // `tournamentRunStrain` has returned and no witness that reads the ladder can see it.
    //
    // MEASURED (20 careers x the wealthy·elite and middle·high presets walked to 28,
    // `npm run bench:season-eq -- --levers --seeds 10 --toAge 28`): holidays a season 8.0 -> 7.2,
    // the mean professional event 15.3 -> 13.7, weeks under 50 2.7 -> 2.0, injury prevalence and the
    // ranking ceiling unmoved (49% and #12 -> #11). +2 was measured too – 6.3 holidays – and is in
    // the spec's §10e if he wants the bigger step.
    //
    // ⚠ IT REACHES NO FROZEN CAREER AND NO RIVAL, PROVED RATHER THAN ARGUED. `masseurTourRelief` is
    // applied in ONE place, `world.ts finalizeTournament`, for the kid alone, and the gate is a
    // counting W-series result no 156-week career reaches. `tools/frozen-key-diff.ts` on 5/0, 8/0
    // and 0/1 with this change alone: 0 of 95 / 95 / 96 keys moved, `rngMain` byte-identical.
    tourRecoveryPerRound: 3,
    // ⭐ THE RETURN-WEEK SESSION (owner 22.08: «довесить послетурнирное восстановление 1 сеанс
    // массажа по возвращении»): when he was NOT flown to a tournament, the first non-played week
    // after it pays one extra session's worth of recovery on top of the ordinary week – the home
    // table working the trip out of her legs. Small and legible on purpose: it is one session, not
    // a second tour-relief channel, and it prints its own receipt (`resolveMasseurReturn`).
    returnSessionBonus: 1,
  },

  // --- THE PSYCHOLOGIST (the psychologist's year, docs/specs/the-psychologists-year-2026-09.md) ---
  // THE SECOND SALARIED SEAT, and the asymmetry with the masseur above IS the design rather than a
  // saving (the travelling-team plan's §2, the owner's ruling Б: «массажист ездит, психолог работает
  // дистанционно и стоит только зарплату»). So: pro-career gated and cancellable weekly like him,
  // and then NO FARE, NO TRAVEL STANCE AND NO RESULTS SHARE – `staffSeatFareCents` is never asked
  // for this seat and `staffShare` above stays `'coach' | 'masseur'` (O3, ruled 13.09: he is not in
  // the box on match day; his product is the year, not the title).
  //
  // ⚠⚠ AND THE DIAL IS A DIFFERENT KIND OF THING FROM THE MASSEUR'S, which is why the rung is an
  // INDEX and not a quantity. His dial buys a BUSIER CALENDAR (2/4/7 sessions a week, and the bill
  // is sessions × a rate). This one is ONE SESSION A WEEK AT EVERY RUNG – the spec's own «the rung
  // buys WHO comes to the call» – so there is no quantity to multiply and the price is simply the
  // person's weekly retainer. A rung here is a position in a three-member roster, `0 | 1 | 2`.
  //
  // ⚠ WHAT IS DELIBERATELY NOT HERE YET, so nobody reads the absence as an oversight: the four
  // focus tables (`recoverySlope` T4, `coolheadPerSeason` T5, `listenClarity` T6, the walls'
  // beyond-baseline hazard scale T7 – all four ruled in the spec's §2 and quoted in the wave-5
  // brief's §4) land with the passes that READ them. T2 ships the seat and the seat's price, and a
  // constant with no reader is a constant nobody can be wrong about yet.
  // ⭐ T4 (v76) LANDED THE FIRST OF THE FOUR – `recoverySlope`, below, with `accrueSpirit`'s own
  // reader in the same commit, exactly as the rule above requires. Three remain.
  // ⭐ T5 (v76) LANDED THE SECOND – `coolheadPerSeason`, below, with `growWeek`'s own reader in the
  // same commit. Two remain (`listenClarity` T6, the walls' hazard scale T7).
  // ⭐⭐ AND THE LIST IS CLOSED: v76's T6 and T7 landed the last two, and **v77's T5 adds a FIFTH
  // FOCUS the wave-5 forecast could not name** – «The public life» (O7, ruled 13.09), whose two
  // ladders `publicLifeShrink` and `publicLifeAccel` land at the foot of this block with their one
  // reader (`engine/spirit.ts` – the pressure term and the habituation growth) in the same commit,
  // which is the rule this block has kept since T2. ⚠ THEY LIVE HERE AND NOT IN `ECONOMY.spotlight`
  // by the spotlight block's own instruction: they are the SEAT's price list, keyed on the rung the
  // family is paying for, and `ECONOMY.spotlight` holds only what is true of a career with nobody
  // hired.
  psychologist: {
    // ⚠⚠ PROPOSALS, NOT RULINGS – bench-priced, predicted-first, THE OWNER'S WORD AFTER T10, in the
    // same register the spec marks O5 with. The wave-5 brief's §4 lists them under «Proposals – NONE
    // ruled»: $100 / $200 / $400 a week. What they are sized AGAINST is the game's own scale and the
    // spec's §3 table: the counsellor sits BELOW the masseur's entry rung ($150/wk – a weekly hour,
    // not a specialist), the sport psychologist between his entry and default rungs ($300/wk) and is
    // the DEFAULT, and the tour-grade specialist lands in the high coach's neighbourhood ($500/wk).
    // The travelling-team plan's own sizing sketch («psychologist salary ≈ a third» of a coach rung)
    // is what those three land on when it is read against the roster the game actually sells.
    //
    // ⚠ A FLAT CONTRACT PER RUNG: no corridor, no jitter, NO DRAW ON ANY STREAM – the masseur's own
    // legibility argument, which is stronger here because there is not even a session count to
    // multiply. The ledger row is the number on the card, every week.
    //
    // ⚠ EACH RUNG MUST MEASURABLY BEAT THE ONE BELOW **AT THE CHOSEN FOCUS** or it is re-priced (the
    // masseur spec's §4 law, applied per focus by the spec's §3). That is T10's 4×3 grid; T2 can
    // only make the ladder exist.
    rungs: [
      { label: 'Counsellor', salaryCents: 100_00 },
      { label: 'Sport psychologist', salaryCents: 200_00 },
      { label: 'Tour-grade specialist', salaryCents: 400_00 },
    ],
    // What a fresh hire (and every pre-v76 save) stands on: the MIDDLE rung – the professional
    // default the prices above are anchored to, and meaningless until somebody is hired. A LITERAL 1
    // in the v76 migration, by the house rule (a shipped step must never change what it back-fills
    // because somebody later retuned a constant); keep the two in step.
    //
    // ⚠ TYPED `0 | 1 | 2` RATHER THAN `number` because `createWorld` assigns it straight into
    // `WorldState.psychologistRung`, whose type is the union. Widening it here would push a cast onto
    // the reader, which is the shape this repo keeps out of `createWorld` (the literal it replaces
    // needed none).
    defaultRung: 1 as 0 | 1 | 2,
    /** ⭐⭐⭐ «BACK ON HER FEET» – THE RECOVERY SLOPE, BY RUNG (v76, wave 5's T4). The spec's §2 row,
     *  verbatim: «the recovery slope while a shock is live: **+2 / +3 / +4 per week by rung** (the
     *  23.08 design, preserved whole as ONE focus)». Points of spirit per week, ADDED TO
     *  `ECONOMY.spirit.returnPerWeek[intensity]` inside `accrueSpirit`'s return step and nowhere
     *  else.
     *
     *  ⚠⚠ IT IS A FASTER RETURN AND NEVER A SECOND CURVE, which is the one thing a later reader
     *  cannot recover from the three numbers. `accrueSpirit`'s own ⚠⚠ note («THERE IS NO RECOVERY
     *  CURVE, ANYWHERE, BY DESIGN … a second return rate, a «recovering» flag or a taper read off
     *  `spiritShock` would all be the same mistake») still governs: this is a SUMMAND on the
     *  standing rate, it goes through the same `stepToward` clamp and the same tenths rounding, and
     *  it dies with the clear because the predicate that gates it reads the live mark. No taper, no
     *  flag, no second target.
     *
     *  ⚠ INDEXED BY RUNG (`0 | 1 | 2`), WHICH IS A DIFFERENT SPELLING FROM `returnPerWeek`'s and the
     *  collision is worth naming once: `ECONOMY.spirit.returnPerWeek` is an OBJECT keyed by the
     *  intensity NAME (`{steady, intense}`) and this is an ARRAY indexed by the roster position.
     *  The two are summed on one line in `accrueSpirit` and a reader who mixes them gets
     *  `undefined`; the rungs are the same `0 | 1 | 2` that indexes `rungs` above.
     *
     *  ⚠ RULED, NOT PROPOSED – unlike the salaries above. The wave-5 brief's §4 lists it under
     *  «Ruled by the spec §2», so T10's grid MEASURES this ladder rather than pricing it: each rung
     *  strictly better than the one below on weeks-under-the-knee, by more than 2×SEM, or the
     *  masseur §4 law re-prices the RUNG and not this row. */
    recoverySlope: [2, 3, 4],
    /** ⭐⭐⭐ «COOL HEAD» – THE BOUNDED COMPOSURE WALK, BY RUNG (v76, wave 5's T5). The spec's §2 row,
     *  verbatim: «bounded composure growth: **+1.5 / +2.5 / +3.5 per held season by rung**, toward
     *  HER EXISTING CEILING only – it accelerates the work, it never breaks the cap». Points of
     *  `composure` per SEASON; `growWeek` spends `coolheadPerSeason[rung] / WEEKS_IN_SEASON` on each
     *  week he actually works it, and nowhere else.
     *
     *  ⚠⚠ A SEASON RATE READ WEEKLY, AND THE FRACTION IS THE MECHANIC RATHER THAN A ROUNDING
     *  ACCIDENT. 3.5 / 52 = 0.0673 of a point a week, and `KidSkills` fields are plain `number`s that
     *  `growWeek` never rounds – measured before the term was written, because an integer skill would
     *  have made the whole focus dead on arrival (every week's term would truncate to nothing). The
     *  owner's own anchor sizes it: her measured 7-point composure hole is two to three seasons of
     *  rung-2 work, «not a purchase» (the spec's ⚠ under the table).
     *
     *  ⚠⚠ DECIMALS, NOT AN INDEX – and the collision with the row above is worth naming once, as
     *  that row names its own: `recoverySlope` is POINTS OF SPIRIT PER WEEK, this is POINTS OF A
     *  SKILL PER SEASON. Both are indexed by the same rung (`0 | 1 | 2`, the roster position), and
     *  the two must never be read into each other's arithmetic.
     *
     *  ⚠ PROPOSALS INSIDE A RULED SHAPE – O5, the spec's §6: «the +1.5/+2.5/+3.5 season rates and the
     *  own-ceiling cap are bench proposals; measured against the training-only control before any
     *  ruling». So T10's grid PRICES these three numbers (growth against a training-only arm, more
     *  than 2×SEM per rung, zero at the ceiling proven) while the shape they sit in – a per-week
     *  summand beside training growth, clamped at her own ceiling – is ruled and stays.
     *
     *  ⚠ MONOTONE BY CONSTRUCTION BELOW THE CEILING: the three are strictly increasing and the term
     *  is `min(rate, headroom)`, so a higher rung is never worth less than a lower one on any week –
     *  the equality case is the ceiling, where all three are 0 and the focus is finished. */
    coolheadPerSeason: [1.5, 2.5, 3.5],
    /** ⭐⭐⭐ ROUND 42 #35, v78 – PAST THE CEILING: THE THREE NUMBERS ARE THE OWNER'S OWN, RULED
     *  15.09 and quoted rather than tuned. «+5 потолок, по очку за сезон, постоянный (здесь не
     *  уверен, можно всё таки небольшой откат сделать мне кажется, например 0.2пп за сезон без этой
     *  тренировки, мне кажется это вполне ок)».
     *
     *  `composureBonusCap` – how far above her rolled ceiling sustained work can carry her, in
     *  composure points. Five is about a fifth of the biggest nerve draw the game deals
     *  (`potentialBand` tops out at +26), so the seed still decides who she is and the seat decides
     *  how much further than that a patient family can take her.
     *
     *  `composureBonusPerSeason` – a season of continuous work on the `'coolhead'` focus is worth
     *  exactly one point of headroom, so the cap is a FIVE-SEASON project and nobody buys it inside
     *  one wave. ⚠ IT IS FLAT ACROSS THE RUNGS, unlike `coolheadPerSeason` above, and that is the
     *  design rather than an omission: the rung already prices how fast she CLIMBS to a ceiling, and
     *  pricing how high the ceiling goes on the same dial would pay the top rung twice for one
     *  purchase. The owner named one number, not three.
     *
     *  `composureBonusDecayPerSeason` – what an idle season costs. ⚠ HIS WORD IS «пп» AND THE BONUS
     *  IS IN COMPOSURE POINTS, so this is READ as a fifth of a point per idle season – a fifth of
     *  the earning rate, so a family that stops working keeps almost all of it and a full +5 takes
     *  twenty-five idle seasons to unwind, which is longer than any career. That reading is written
     *  down in round 42 #35 rather than assumed silently; if he meant a fifth of a percentage point
     *  of match win rate, this constant is where the correction lands.
     *
     *  ⚠ ALL THREE ARE PER SEASON AND SPENT PER WEEK (`composureBonusAfterWeek` divides by
     *  `WEEKS_IN_SEASON`), which is `coolheadPerSeason`'s own shape three lines up. A whole season
     *  worked is exactly +1 and a whole season idle exactly −0.2; a part season is proportional,
     *  which is what keeps «continuous» from needing an invented threshold on a seat that STANDS
     *  DOWN by design for a college freeze and a booked family week. */
    composureBonusCap: 5,
    composureBonusPerSeason: 1,
    composureBonusDecayPerSeason: 0.2,
    /** ⭐⭐⭐ «LEARNING TO LISTEN» – THE CHANCE THE PARENT READS HER PLAINLY, BY RUNG (v76, wave 5's
     *  T6). The spec's §2 row, verbatim: «the feed line's wording becomes legible with probability
     *  **0.6 / 0.8 / 0.95 per beat by rung** – a matched reaction becomes the parent's skill, never a
     *  purchase and never a leak of her sessions (`bond` untouched)».
     *
     *  ⚠⚠ IT PRICES A WORDING AND NOTHING ELSE, which is the one thing three decimals cannot say for
     *  themselves. One uniform on `seed:psy:listen:<kind>:<week>` decides whether the card's heading
     *  and the kept feed row say plainly what she wants; the bond deltas, her drawn `wants`, the
     *  space-vs-company read and the priced option set are the SAME BYTES on both sides of it
     *  (`tests/wave5-psychologist-listen.test.ts` §D deep-equals the priced sets across the toggle).
     *  A rung that bought a better PRICE would be the purchase the spec's own sentence forbids.
     *
     *  ⚠ A PROBABILITY, NOT A RATE AND NOT AN INDEX – the third spelling in this block and the
     *  collision is worth naming once, as its two neighbours name theirs: `recoverySlope` is POINTS
     *  OF SPIRIT PER WEEK, `coolheadPerSeason` is POINTS OF A SKILL PER SEASON, and this is a SHARE
     *  OF BEATS, 0..1, compared against one uniform. All three are indexed by the same rung
     *  (`0 | 1 | 2`, the roster position) and none of their arithmetic may be read into another's.
     *
     *  ⚠ RULED, NOT PROPOSED – the wave-5 brief's §4 lists it under «Ruled by the spec §2», so
     *  T10's grid MEASURES this ladder (the realised clarity inside the CI of each number, the
     *  matched-reaction share monotone in rung) rather than pricing it. */
    listenClarity: [0.6, 0.8, 0.95],
    /** ⭐⭐⭐ «WORKING ON HERSELF» – THE BEYOND-BASELINE FLIP HAZARD'S SCALE, BY RUNG (v76, wave 5's
     *  T7). The psychologist spec's §2 row, verbatim: «rung scales the armed hazard ×1 / ×1.5 / ×2».
     *  Read by `driftWalls` (engine/spirit.ts) and by nothing else.
     *
     *  ⚠⚠ IN THE BEYOND-BASELINE DIRECTION ONLY, AND NEVER ON AN UN-FLIP – the architect's ruling N,
     *  and the sentence that decides it is «the seat accelerates her own work and never her
     *  collapse». So the scale applies to exactly one draw in the whole model: the FLIP of an axis
     *  that has somewhere to grow. A born-open girl's walls-up flip, and every un-flip in either
     *  direction, are ×1 whatever the family is paying – a better psychologist does not make a
     *  collapse likelier, and he is not what un-does one either (repair is free and needs no dice
     *  scaled for it).
     *
     *  ⚠ IT RIDES THE BILLING PREDICATE, like everything else of his (ruling J, ruling P's ⚠): a
     *  college-freeze week and a booked family week stand the scale down with the bill.
     *
     *  ⚠ RULED, NOT PROPOSED – the wave-5 brief §4 lists «the beyond-baseline hazard scale [1, 1.5,
     *  2]» under «Ruled by the spec §2», so T10's grid MEASURES this ladder (flip medians monotone in
     *  rung) rather than pricing it. ⚠ INDEXED BY RUNG (`0 | 1 | 2`), the fourth spelling in this
     *  block: `recoverySlope` is POINTS OF SPIRIT PER WEEK, `coolheadPerSeason` POINTS OF A SKILL PER
     *  SEASON, `listenClarity` a SHARE OF BEATS, and this a MULTIPLIER ON A PROBABILITY. */
    wallsHazardScale: [1, 1.5, 2],
    /** ⭐⭐ O6, RULED 13.09 – A RETAINED SEAT AT RUNG ≥ 2 SLOWS THE WALLS' RISE, ANY FOCUS. The
     *  multiplier on `ECONOMY.life.walls.risePerWeek` on a `strained`/`cold` week: «a good
     *  psychologist in the house makes the walls rise slower» (ruling N).
     *
     *  ⚠⚠ IT SLOWS THE NEGATIVE **DRIFT** AND NEVER THE HAZARD – ruling N's own warning about the two
     *  multipliers being swapped. Once the walls are up and the axis is armed, he does not make the
     *  flip less likely; what he buys is the seasons it takes to get there.
     *
     *  ⚠ RUNG ≥ 2 AND ANY FOCUS: this is the second legible thing the RETAINER buys, so it must not
     *  read off `psychologistFocus` – a family working on «cool head» still has him in the house.
     *  ⚠ AND IT RIDES THE BILLING PREDICATE (ruling P's ⚠: «a standing-down seat slows nothing»).
     *  ⚠ A PROPOSAL – the wave-5 brief §4's «retention slow-down ×0.75 (rung ≥ 2)», priced at the
     *  census, his word after.
     *
     *  ⚠⚠ AND THE TENTHS GRID EATS A LITTLE OF IT, WHICH T10 MUST PREDICT OR IT WILL READ A CORRECT
     *  IMPLEMENTATION AS A MISS (ruling M's lesson, one focus over). The lean is stored to ONE
     *  DECIMAL, so a slowed week is `roundTenth(1.5 × 0.75) = roundTenth(1.125) = 1.1` and the
     *  REALISED slow-down is ≈ ×0.733 rather than ×0.75. Measured, not derived after the fact:
     *  tests/wave5-psychologist-walls.test.ts §F asserts the rounded value and says so. The grid is
     *  the field's own (spirit's, one concept over) and the arithmetic is not going to be un-rounded
     *  for a multiplier's sake – so the number to predict is 0.733. */
    wallsRetentionSlow: 0.75,

    /** ⭐⭐ THE `'herself'` REPAIR ACCELERATION – the multiplier on
     *  `ECONOMY.life.walls.repairPerWeek` while that focus is held at a `close`/`steady` bond.
     *
     *  ⚠⚠ AN ACCELERATION AND NEVER A GATE, which is §0.3's law («repair is free … the seat only ever
     *  ACCELERATES the road home») made arithmetic: the repair term runs at ×1 with nobody hired, and
     *  this multiplies a walk that was already happening. A version of this number that was required
     *  for the walk would be the design violation the brief names, not a tuning miss.
     *
     *  ⚠ IT RIDES THE BILLING PREDICATE for ruling J's reason – pay nothing, receive nothing extra.
     *  ⚠ A PROPOSAL – the brief §4's «`'herself'` repair acceleration ×1.5». */
    wallsHerselfRepair: 1.5,

    /** ⭐⭐⭐ «THE PUBLIC LIFE» – WHAT A YEAR ON THE SPOTLIGHT TAKES OFF EVERY EXPOSURE EVENT, BY RUNG
     *  (v77, wave 6's T5 – O7, ruled 13.09: «ships WITH the spotlight wave, not before it has
     *  something to shrink»). The FIFTH factor of `exposurePressure`'s product (engine/spirit.ts),
     *  and `1` on every week the seat is not working this focus.
     *
     *  ⚠⚠ A SHRINK AND NEVER A SHIELD, which is the one thing three decimals cannot say for
     *  themselves. Every entry is strictly between 0 and 1: the cameras cost her LESS while somebody
     *  is working the year with her, and they never cost her nothing. A `0` here would switch the
     *  whole spotlight off for anyone who can afford a retainer, which is the shape who-she-is §3c
     *  forbids in its own words about the habituation floor one block over («a SHRUG and not an
     *  immunity») – and the two multiply, so the seat and the veteran together must still leave a
     *  cost standing.
     *
     *  ⚠ STRICTLY DECREASING, OR THE RUNG IS RE-PRICED – the masseur spec's §4 law, which the wave
     *  brief applies per focus. T9's psy-grid benches the fifth column against the rung below AND
     *  against no-seat; `tests/wave6-spotlight-focus.test.ts` §A holds the SHAPE so a re-tune cannot
     *  quietly flatten a step.
     *
     *  ⚠ A MULTIPLIER ON A SPIRIT TERM, indexed by rung (`0 | 1 | 2`, the roster position) – the
     *  FIFTH spelling in this block and the collision is worth naming once, as its four neighbours
     *  name theirs: `recoverySlope` is POINTS OF SPIRIT PER WEEK, `coolheadPerSeason` POINTS OF A
     *  SKILL PER SEASON, `listenClarity` a SHARE OF BEATS, `wallsHazardScale` a MULTIPLIER ON A
     *  PROBABILITY, and this a MULTIPLIER ON A COST.
     *
     *  ⚠ UNRULED – the wave-6 brief's §4 lists «`publicLifeShrink [0.85, 0.70, 0.55]`» under
     *  «Proposals – NONE ruled, all bench-priced predicted-first, his word after», and the architect's
     *  ruling N adds the measurement that makes the size a real question rather than a formality: at
     *  the drafted bases a calm, open, habituated girl holding this focus at the top rung takes
     *  `−4 × 0.8 × 0.75 × 0.25 × 0.55 = −0.33` from the worst week of her public life – three tenths,
     *  which the screen renders as nothing. Not one pin below asserts these three numbers; every
     *  expectation is computed from this row, so a re-tune moves both sides together. */
    publicLifeShrink: [0.85, 0.7, 0.55],
    /** ⭐⭐⭐ «THE PUBLIC LIFE» – HOW MUCH FASTER SHE LEARNS TO LIVE KNOWN, BY RUNG (v77, wave 6's T5).
     *  The multiplier on `growHabituation`'s weekly `+1` (engine/spirit.ts), and `1` on every week the
     *  seat is not working this focus.
     *
     *  ⚠⚠ AN ACCELERATION AND NEVER A GATE – `wallsHerselfRepair`'s own law one row up, and §0.3's
     *  («repair is free … the seat only ever ACCELERATES the road home») read onto this focus: the
     *  counter grows at `+1` a week with nobody hired, and this multiplies a walk that was already
     *  happening. Every entry is ≥ 1 for that reason; a value below 1 would make the seat a BRAKE on
     *  her own acclimatising, which is the same defect `wallsHazardScale`'s ⚠⚠ names in the other
     *  direction.
     *
     *  ⚠⚠ AND IT CANNOT OUT-RUN THE WALLS, BY CONSTRUCTION RATHER THAN BY SIZE: `growHabituation`
     *  returns BEFORE this factor is read when she is not news or when either wall is flipped, so ×0
     *  beats any accelerator and no `Math.max` is reachable from here. That composition is where a
     *  builder reaches for one, so it is pinned (`tests/wave6-spotlight-focus.test.ts` §D).
     *
     *  ⚠ STRICTLY INCREASING, OR THE RUNG IS RE-PRICED – the masseur §4 law again, benched by T9
     *  against the §3c habituation curve. ⚠ THE CAP IS UNMOVED: `habituationFullWeeks` is still both
     *  the clamp and `habituationScale`'s denominator, so a faster walk arrives at the same floor
     *  sooner and never past it.
     *
     *  ⚠ UNRULED – the brief's §4 «`publicLifeAccel [1.5, 2.0, 2.5]`», in the same «NONE ruled» list
     *  as its sibling above. T9 prices it; no pin below asserts the three numbers. */
    publicLifeAccel: [1.5, 2, 2.5],
    /** ⭐⭐ WHERE THE FIFTH FOCUS'S RECEIPT PRINTS – the habituation-SCALE point whose first crossing,
     *  with the year being worked that week, prints «The cameras stopped costing her sleep.» The
     *  owner's D2 (14.09, «да»), on the strings doc's own trigger proposal and `RECOVERY_RECEIPT`'s
     *  13.09 precedent: the sentence stood, the TRIGGER was the design decision. 0.5 = halfway from
     *  first-news to the shrug. ⚠ ONCE-EVER BY MONOTONICITY, NOT BY A STAMP: `spotlightHabituation`
     *  never decays (v1's own law), so the crossing happens at most once per career and no schema
     *  field is spent on remembering it. ⚠ A PROPOSAL – the POINT is benchable, his word after. */
    publicLifeReceiptAt: 0.5,
  },

  // --- HER FORM: the slump and the rust (docs/specs/the-form-and-the-sparring-2026-09.md §1-§3) ---
  // The model is `src/engine/form.ts`; these are its seven numbers. ⚠ ZERO DRAWS anywhere they are
  // spent – O4, the owner's 16.09 ruling («accumulator, deterministic, v1»), so `seed:form:<week>`
  // stays reserved and unused.
  form: {
    /** §1a `G` – THE RESIDUAL GAIN. One match's worth, before the odds are applied: a win over a
     *  girl the ring gave her no chance against is `+G`, a loss as a certainty is `-G`, and both
     *  ends are unreachable because `p` is never 0 or 1.
     *
     *  ⚠ WHAT THIS DIAL SETS IS HOW FAR INTO THE CLAMPS A REAL CAREER TRAVELS, and it is the half
     *  of O1 the corridor does NOT constrain – the corridor prices the clamps, this decides whether
     *  anybody ever reaches them. Measured on the census arm of `tools/form-scale-bench.ts`; see
     *  §7 of the spec for the predicted-vs-measured table. */
    gain: 1.5,
    /** §2 `K` – THE READER, in composure points per point of form. `+-10 x 0.6 = +-6 composure` at
     *  the clamps.
     *
     *  ⚠⚠ THIS CONSTANT IS THE CONSEQUENCE AND THE CORRIDOR IS THE RULING (O1, 16.09: «what he
     *  ruled is the METHOD»). The ruled corridor is **[0.5, 4] pp of realised match win rate at the
     *  clamps** – it decides close matches, never a career – and this number is whatever puts the
     *  clamps inside it on the post-#34 engine. A builder that moves it without re-running
     *  `npm run bench:formscale` has skipped O1 rather than re-tuned it. */
    reader: 0.6,
    /** §1c – THE RETURN TO NEUTRAL, both signs, every week, applied FIRST. Half-life of a deep
     *  slump is about a month of ordinary results: «a mood, not a season» unless the results keep
     *  feeding it. A purple patch decays at the same honest rate, which is what keeps the number
     *  0-centred rather than ratcheting. */
    revertPerWeek: 0.5,
    /** §1b – HOW LONG A GAP HAS TO BE BEFORE IT IS RUST. Three weeks is an off-week, a rest and a
     *  travel week; the fourth is when a player stops being match-sharp. ⚠ STRICTLY GREATER than
     *  this, so an ordinary three-week break costs exactly nothing. */
    rustAfterWeeks: 3,
    /** §1b – the drift per matchless week past the gap, before the sparring partner's cut. */
    driftPerWeek: 0.4,
    /** §1b – HOW FAR RUST ALONE CAN TAKE HER, and it is deliberately not the clamp: rust DULLS, it
     *  does not destroy. A girl already below this from a run of bad results rusts by nothing at
     *  all – her problem is not that she has stopped playing. */
    rustFloor: -4,
    /** The clamps. 0 is neutral and both backfills; `+-10` is «as well as she has ever felt» and
     *  «nothing is going in». */
    min: -10,
    max: 10,
    /** §3's ONE WINDOW – where the coach's eye starts saying she is striking it clean, and where it
     *  starts saying she needs matches. ⚠ NOT SYMMETRICAL, because the two channels are not: the
     *  rust line is ALSO gated on the gap that caused it (`coachFormNote`), so «she needs matches
     *  under her» is never said about a girl who has been playing every week and losing – that girl
     *  is in a slump, which is the psychologist's patient and not a thing a hitting session fixes.
     *  ⚠ THE NUMBER NEVER REACHES A SURFACE, only the sentence does (O2). */
    goodNoteAt: 3,
    rustNoteAt: -2,
    /** ⭐⭐ O1's RULING ITSELF, IN THE CONSTANTS FILE, because it is the thing `reader` above serves
     *  and a corridor that lives only in a spec is a corridor a builder can forget. The realised
     *  match win-rate swing at the clamps, in probability points: form decides close matches and
     *  never a career (form-and-slump §1's bound, kept as law).
     *
     *  ⚠ IT IS READ BY THE BENCH AND BY NOTHING ELSE, deliberately: no engine path consults it, so
     *  it cannot tune anything by accident. `npm run bench:form` §1 prints each opponent's worst
     *  realised |pp| beside it and says «inside» or «OUTSIDE». */
    corridorPp: [0.5, 4] as const,
  },

  // --- THE SPARRING PARTNER (docs/specs/the-form-and-the-sparring-2026-09.md §4) -------------------
  // THE THIRD SALARIED SEAT, and the one with the narrowest job in the game. ⚠⚠ THE FENCE SENTENCE
  // IS THE DESIGN: **the slump is the psychologist's patient, the rust is the sparring partner's.**
  // He reaches `FormWeek.rustCut` and nothing else – not the results channel, not the reversion
  // rate, not condition, not development. A slumping girl who plays every week gets NOTHING from
  // him, and that is the seat working rather than the seat failing.
  sparring: {
    /** THE LADDER. `driftCut` is a MULTIPLIER ON THE DRIFT, not the share removed: x0.15 means the
     *  top rung leaves 15% of a rusting week's drift standing. Strictly decreasing, or the rung is
     *  re-priced – the masseur spec's §4 law.
     *
     *  ⚠ THE MONEY IS ANCHORED ON THE RESEARCH AND THE RUNGS ARE PROPOSALS (O7, 16.09): the band is
     *  `docs/research/team-economics-2026-09.md` §4's **$50-80k/yr + travel** for a full-time
     *  hitting partner, and round 42 #48 measured that only the NOT-travelling top rung ($72,800 a
     *  season) lands inside it at all. The three labels are the ladder the band describes – a
     *  college hitter, a journeyman pro, a top-100's partner.
     *
     *  ⚠⚠ THE THREE CUTS ARE **0.75 / 0.5 / 0.25** AND NOT §4's PROPOSED **0.6 / 0.35 / 0.15**, AND
     *  THE REASON IS A MEASUREMENT RATHER THAN A TASTE. `world.form` is kept in TENTHS (§1, and
     *  `accrueForm` rounds once at the end exactly as `accrueSpirit` does). At a base drift of
     *  0.4/wk the proposed cuts give 0.24 / 0.14 / 0.06 a week – and the accumulated value is
     *  rounded to a tenth every week, so 0.14 and 0.06 BOTH ratchet the number down by exactly one
     *  tenth a week and the top two rungs become the same seat. `npm run bench:form` §3 measured
     *  it: «A journeyman pro · home +0.312» and «A top-100 partner · home +0.312», identical to the
     *  thousandth, which is the masseur spec's §4 law broken («each rung must MEASURABLY beat the
     *  one below or the dial is decoration»).
     *
     *  ⭐ SO THE CUTS ARE CHOSEN TO BE EXACT IN THE UNIT THE NUMBER IS KEPT IN: 0.4 x 0.75 / 0.5 /
     *  0.25 is **0.3 / 0.2 / 0.1 a week**, three drifts a tenth apart, none of them rounded at all.
     *  The floor is then reached in 13 / 20 / 40 matchless weeks against 10 with nobody hired, which
     *  is a ladder a player can feel rather than a table only the source can see. ⚠ THE TOP RUNG IS
     *  therefore a WEAKER cut than §4 proposed (75% of the drift removed rather than 85%) and it is
     *  the only rung that could have been kept as proposed – it was re-fitted anyway, because a
     *  ladder whose top two rungs differ by a rounding artefact is worse than a shallower one.
     *
     *  ⭐⭐ `note` IS THE RUNG'S OWN SENTENCE ON THE CARD (his 17.09 answer, «Рекомендую A - ок»), and
     *  it is OPTIONAL on purpose: the masseur's and the psychologist's ladders have no such sentence
     *  and he has not been shown drafts for them, so a REQUIRED field would force this seat's
     *  vocabulary onto two seats he never ruled on. `SupportStaffTab.vue` prints it under the rung
     *  label and renders nothing where it is absent.
     *
     *  ⚠ THE THREE SENTENCES ARE CHECKED AGAINST THE NUMBERS BESIDE THEM, because `driftCut` is a
     *  multiplier on the drift and reads backwards to the eye: 0.75 LEAVES three quarters standing
     *  and so takes A QUARTER off, 0.5 takes half, and 0.25 leaves a quarter standing and so takes
     *  THREE QUARTERS off. The block above states the same arithmetic from the other side («the top
     *  rung is a WEAKER cut than §4 proposed – 75% of the drift removed rather than 85%»), and the
     *  two agree. A wave that re-fits a cut moves its sentence in the same edit or the card lies. */
    rungs: [
      { label: 'A college hitter', weeklyCents: 500_00, driftCut: 0.75, note: 'Takes a quarter off the rust of a week without a match.' },
      { label: 'A journeyman pro', weeklyCents: 900_00, driftCut: 0.5, note: 'Takes half off the rust of a week without a match.' },
      { label: 'A top-100 partner', weeklyCents: 1400_00, driftCut: 0.25, note: 'Takes three quarters off the rust of a week without a match.' },
    ],
    /** The middle rung, and the masseur's own `defaultSessions` doctrine: MEANINGLESS UNTIL HIRED,
     *  which is why v78 could back-fill it on a career that never hires the seat. */
    defaultRung: 1,
  },

  // --- The spotlight: the weight of being known (who-she-is §3c / §3c-bis, wave 6) ---------
  // ⚠⚠ THIS BLOCK READS FAME AND NEVER TUNES IT. `ECONOMY.fame` is fame-presence's ground
  // (docs/specs/fame-presence-2026-09.md) and the spotlight wave may not touch a number in it – the
  // wave's §8, proven at the final gate by a grep. What lives here is the wave's OWN two questions:
  // where the world starts calling her news, and what counts as a big stage.
  //
  // ⚠ WHAT IS DELIBERATELY NOT HERE YET, so nobody reads the absence as an oversight – the
  // psychologist block's own rule one concern up, and for its reason («a constant with no reader is
  // a constant nobody can be wrong about yet»): ⭐ NOTHING, SINCE T7 (14.09). The list this note kept
  // is empty: `leakBasePerWeek` / `leakOpennessMult` / `wrongShare` landed with T6's hazard and
  // `newsWindowWeeks` with T7's booth, and every one of them is struck below rather than left
  // standing here as a stale forecast.
  // ⭐ AND T5 KEPT THE PROMISE THIS NOTE MADE FOR IT (14.09): the fifth focus's two ladders
  // (`publicLifeShrink`, `publicLifeAccel`) landed in `ECONOMY.psychologist` beside the other focus
  // tables and NOT in this block – they are the seat's price list, and this block holds only what is
  // true of a career with nobody hired. Nothing of T5's is here, which is why nothing of T5's is
  // struck from the list above.
  // ⭐ T3 IS HERE (14.09) AND IT TOOK EXACTLY THE TWO THAT SENTENCE PROMISED IT: `pressureBase` and
  // `opennessScale` below.
  // ⭐ AND T4 IS HERE (14.09) WITH THE TWO IT WAS PROMISED: `habituationFullWeeks` and
  // `habituationFloor`, which are struck from the list above rather than left standing in it – the
  // list is edited as each task lands rather than kept as a stale forecast. What is still absent is
  // T6's three and T7's one.
  // ⭐ AND T6 IS HERE (14.09) WITH EXACTLY THE THREE IT WAS PROMISED: `leakBasePerWeek`,
  // `leakOpennessMult` and `wrongShare`, all struck from the list above.
  // ⭐ AND T7 IS HERE (14.09) WITH THE ONE IT WAS PROMISED AND NO SECOND: `newsWindowWeeks` below,
  // and NOTHING for the beat itself. The booth's copy lives in `src/viz/commentary.ts` where all
  // booth copy lives, its placement is that file's own `PRIORITY` table, and the mention is
  // DETERMINISTIC by design (the wave's §3) – so there is no chance, no cooldown and no per-week cap
  // to price here. The once-ness is the episode's two stamps and not a number.
  // ⭐ D5 (14.09) LATER ADDED TWO BESIDE T6's THREE – `leakFreshWeeks`/`leakFreshMult`, the
  // owner's own word on the founding scene – and D1 replaced the fame bar with the two rank bands.
  // ⚠ AND T6 ADDED NO FOURTH, which is worth saying because ruling I
  // gives the hazard a FAME factor the brief had dropped: the factor is `ECONOMY.fame.cap`, which
  // this block READS and never writes, so the ruling restored a term of the spec's own formula
  // without opening a tunable the owner would have to price.
  spotlight: {
    /** ⭐⭐⭐ THE BAR THE WHOLE WAVE STANDS BEHIND – and since the owner's D1 (14.09) it reads her
     *  RANK, never her fame. His words, verbatim, because they are the design: «у нас % достижения
     *  топ-100 огромный, вот уже с топ-200 можно иногда начинать что-то говорить, а в топ-100 так и
     *  вполне уверенно, прямая аналогия – спонсорская лестница». So membership is a STANDING, the
     *  sponsor ladder's own currency (its tour rung gates at WTA ≤ 200 in this same file), with
     *  three bands read by ONE predicate (`newsStandingOf`, `world/spotlight.ts`):
     *
     *      'known'    – WTA rank ≤ newsRankKnown:  she lives known; every kind, habituation grows
     *      'noticed'  – WTA rank ≤ newsRankNoticed: the light finds her only on her occasions;
     *                   every kind may fire, the leak runs at `noticedLeakScale`, and habituation
     *                   does NOT grow – an occasional guest of the light never gets used to it
     *      'quiet'    – everything else: no spotlight, whatever she wins
     *
     *  ⚠⚠ FAME IS OUT OF THE GATE AND STAYS IN THE LEAK – deliberately both. The gate's history
     *  (ruling E's struck anchor, the 33-save measurement that showed a fame bar of 30 excludes
     *  five of eight of the owner's own careers) is preserved in the questions doc §1 and the
     *  decision log's 14.09 entry; fame remains the brand economy's number and the leak hazard's
     *  «more lenses on a bigger star» factor (ruling I, below), which D1 did not touch.
     *
     *  ⚠⚠ THE TWO NUMBERS ARE THE OWNER'S OWN (top-100 / top-200 are his sentence, not a proposal) –
     *  what stays benchable is their EFFECT: T9's news-week shares re-print per band under
     *  `bench:spotlight`. ⚠ And the read carries the house belt: «unranked is not rank one» –
     *  `newsStandingOf` requires live professional points beside the cached rank, the same guard
     *  every rank reader in `world/ladder.ts` carries. */
    newsRankKnown: 100,
    newsRankNoticed: 200,
    /** ⭐⭐⭐ WHAT COUNTS AS A BIG STAGE – the lowest rung whose title, final or early exit puts her
     *  in the light. `'wta500'`, so the set is {wta500, wta1000, slam} today and the slam fortnight
     *  counts by construction.
     *
     *  ⚠⚠ A `TierId` AND NEVER A NUMBER, which is the architect's ruling F and corrects the brief's
     *  own `stageTierMin 500`. THERE IS NO NUMERIC TIER SCALE to compare 500 against: `TierId`
     *  (`season/types.ts`) is a string union of sixteen names – local · regional · national · j30 ·
     *  j60 · j300 · w15 · w35 · w50 · w75 · w100 · wta125 · wta250 · wta500 · wta1000 · slam – and
     *  `wta125` would break any map anybody built from the digits.
     *
     *  ⚠⚠ THE COMPARISON IS `TIER_LADDER`'s OWN INDEX, never a hand-written set of names. The ladder
     *  (`season/calendar.ts`) is the canonical ordering and its own comment says the arithmetic
     *  «moves with the list rather than with a number anybody edited» – it recorded a sixteen-rung
     *  widening that cost «adding four names to this array and nothing else». The alternative's
     *  failure is recorded in this repo in its own words (`src/art/venues.ts:150`): a hand-written
     *  tier array whose `indexOf(t)` «was −1 for every one of them, the lower-tier walk never» ran –
     *  silent, because `indexOf` does not throw. A `['wta500','wta1000','slam']` here is that defect
     *  pre-booked: the week a rung joins the ladder the spotlight quietly stops seeing it.
     *  `tests/wave6-spotlight-ledger.test.ts` §A asserts this value resolves to an index > -1, so a
     *  renamed rung goes red with a sentence instead of turning the spotlight off.
     *
     *  ⚠ A PROPOSAL, LIKE THE BAR ABOVE – the brief's §4 lists it under «Proposals – NONE ruled»,
     *  and what ruling F settles is its TYPE, not its rung. T9 prices where the bar belongs. */
    stageTierMin: 'wta500' as TierId,
    /** ⭐⭐⭐ WHAT ONE EXPOSURE EVENT COSTS HER, **BEFORE ANY SCALING** – the spirit points T3's term
     *  subtracts per event, per kind, keyed by `ExposureKind` so a sixth kind is a design decision
     *  with a number attached rather than a convenience (`world/spotlight.ts`'s own ⚠).
     *
     *  ⚠⚠ «BEFORE SCALING» IS THE LOAD-BEARING HALF OF THE SENTENCE AND IT IS THE ARCHITECT'S RULING
     *  L. These are §3c's «−2..−4 before scaling», so they take `ECONOMY.spirit.perturbationScale`
     *  EXACTLY ONCE, inside T3's own summand – which is why that summand sits OUTSIDE
     *  `weekPerturbation`'s multiplication. The alternative's cost is recorded in this file one
     *  concern up, on `spirit.shock`: those constants are ALREADY intensity-scaled (−27.5 × 0.8 =
     *  −22.0, × 1.25 = −34.4), and a row inside `weekPerturbation` would have scaled them a SECOND
     *  time, to −17.6 / −42.5. A future editor who moves these rows into `perturb` repeats that
     *  defect on new numbers.
     *
     *  ⚠⚠ ALL FIVE ARE §4 PROPOSALS AND NOT ONE OF THEM IS RULED. The brief's own §4 lists them
     *  under «Proposals – NONE ruled, all bench-priced predicted-first, his word after», and the
     *  architect's ruling N measured what they put ON SCREEN before anybody tunes them: at these
     *  bases the deepest single event the wave has – a heavily public loss, expressed-open, steady,
     *  at baseline 70 – lands at 67.6, which is ONE TENTH above the `dimmed` band edge (67.5). The
     *  spotlight's own worst contribution for that girl is 2.40 against a 2.50 distance to the edge,
     *  so it never crosses a Mood band ALONE: it tips a week the ordinary weather had already
     *  carried to the boundary. For scale, a break-up is −22 / −34 on the same axis. ⚠ Ruling N is
     *  explicit that this is NOT a re-tune – «no constant moves in this wave on my word» – so what
     *  T3 ships is the shape, pinned as a RATIO, and T9 prices the sizes.
     *
     *  ⚠ THE RANKING IS THE SPEC'S, NOT A GUESS: a wrong public story and a heavily public loss are
     *  the two deepest (−4), a shoot is the shallowest (−2) because the cameras were invited, and a
     *  big stage and the booth's mention sit between (−3). */
    pressureBase: {
      stage: -3,
      shoot: -2,
      publicLoss: -4,
      aired: -3,
      wrongStory: -4,
    } as Record<ExposureKind, number>,
    /** ⭐⭐⭐ WHO CARRIES IT WELL – the multiplier on every exposure event, read off her EXPRESSED
     *  openness (§0.6: the mechanics read expression, the voices read birth).
     *
     *  ⚠⚠ ANCHORED, NOT PROPOSED – the one pair of numbers in this block that is the SPEC'S OWN.
     *  who-she-is §3c: an open girl half-feeds on the attention and pays ×0.75; a private one pays
     *  ×1.5. The brief's §4 lists it under «Anchored by the spec» beside the note that the intensity
     *  scale is the STANDING `perturbationScale` and never a new constant.
     *
     *  ⚠ THE RATIO IS THE SHAPE AND IT IS PINNED AS ONE (ruling N part 2): 1.5 / 0.75 is exactly ×2,
     *  so the same event costs an expressed-private girl exactly twice what it costs an
     *  expressed-open one before habituation. T3's pin asserts the RATIO rather than either number,
     *  precisely so a §4 re-tune of `pressureBase` cannot silently break the shape it is about. */
    opennessScale: { open: 0.75, private: 1.5 },
    /** ⭐⭐ THE ROW'S OWN BAR – the smallest week charge (absolute, AFTER all five factors) the feed
     *  names out loud. The owner's D1b (14.09), «ок» to the architect's recommendation, and it
     *  OVERRIDES ruling N's events-not-points gate for the ROW ONLY: a habituated, focus-held girl
     *  taking −0.33 from a camera week now lives that week quietly, and «every dip explainable»
     *  reads forwards again – a row prints only where there is a dip worth a sentence. ⚠ THE CHARGE
     *  IS UNTOUCHED: the term still lands whatever its size; only the SENTENCE has a floor. */
    rowMinCharge: 1.0,
    /** ⭐⭐⭐ HOW MANY WEEKS OF LIVING KNOWN IT TAKES TO BE FULLY USED TO IT – the denominator of
     *  `habituationScale` (engine/spirit.ts) and the CAP `growHabituation` clamps the counter at.
     *  104, two full seasons of being news, which is the brief's own gloss on the number.
     *
     *  ⚠⚠ IT IS A DENOMINATOR AND A CAP AT THE SAME TIME, AND THAT IS WHY IT IS ONE CONSTANT AND NOT
     *  TWO. `spotlightHabituation` is clamped here by the writer, and the reader divides by the same
     *  value – so the scale reaches `habituationFloor` exactly when the counter reaches its ceiling
     *  and never travels past it. Two constants could disagree; one cannot.
     *
     *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**, exactly like the bar and the bases above. The brief's §4
     *  lists it under «Proposals – NONE ruled, all bench-priced predicted-first, his word after»
     *  («`habituationFullWeeks 104` (two seasons of living known)»), and T4 ships the SHAPE – linear,
     *  floored, frozen by walls, capped – with the size left for T9's benches and the owner's word.
     *  ⚠ Nothing in T4's pins asserts 104: they read this constant, so a re-tune moves both sides of
     *  every expectation together and the shape stays guarded. */
    habituationFullWeeks: 104,
    /** ⭐⭐⭐ THE MOST BEING USED TO IT CAN EVER SAVE HER – the floor of `habituationScale`. At a full
     *  `habituationFullWeeks` a veteran pays 0.25 of what the same week cost her the first time.
     *
     *  ⚠⚠ THE FLOOR IS THE POINT, NOT THE DISCOUNT. who-she-is §3c's own sentence is «a veteran star
     *  from a good home shrugs at cameras that once cost her sleep» – a SHRUG and not an immunity.
     *  A floor of 0 would make a long-famous girl free of the spotlight entirely, and the mechanic
     *  would quietly switch itself off in exactly the careers it was written for; the brief's §4 says
     *  the same thing in its own words («the floor keeps the cameras from ever costing exactly
     *  nothing»).
     *
     *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**. «`habituationFloor 0.25`» sits in the same «NONE ruled»
     *  list as everything else in this block bar `opennessScale`, and T9 prices it.
     *
     *  ⚠ AND THE FLOOR IS GUARANTEED BY THE **WRITER'S** CLAMP AND BY NOTHING IN THE READER, which
     *  is stated out loud because it is a coupling across two functions: `habituationScale` is the
     *  ruled formula verbatim and carries no second clamp, so it is total and correct on
     *  `[0, habituationFullWeeks]` – the interval `growHabituation` is pinned to keep the counter
     *  inside. A counter forced past the cap by some future second writer would drive the scale
     *  below this floor and, far enough, through zero into a spotlight that PAYS her. The one writer
     *  and its cap pin are what stand between; a second writer must re-read this note. */
    habituationFloor: 0.25,
    /** ⭐⭐⭐ HOW OFTEN A PRIVATE LIFE GETS OUT – the BASE weekly probability that the world learns
     *  about an attachment nobody outside the family knows of (who-she-is §3c-bis, «the leak
     *  hazard»). It is the bottom of a product and never the rate itself:
     *
     *      leakBasePerWeek × leakOpennessMult[openness] × (fameAt(world, week) / ECONOMY.fame.cap)
     *
     *  ⚠⚠ THE THIRD FACTOR IS THE ARCHITECT'S **RULING I** AND IT IS NOT OPTIONAL. The wave brief
     *  dropped the fame term on the grounds that «more lenses on a bigger star is already priced by
     *  the news gate»; measured, it is not – inside the news bands fame still runs the whole scale, so under
     *  the brief's spelling a girl at 100 leaked at EXACTLY the rate of a girl at 30. That is a
     *  different claim, not a smaller one, and who-she-is §3c-bis's own sentence («scales by fame ×
     *  EXPRESSED openness – more lenses on a bigger star») wins under the wave's single-source rule.
     *  ⚠ IT ADDS NO TUNABLE: `ECONOMY.fame.cap` is 100 and this block READS it, never writes it (the
     *  wave's §8), and the draw COUNT does not move – still one uniform per eligible episode-week.
     *
     *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**, like everything in this block bar `opennessScale`. At 0.008
     *  the fame factor re-prices the median by roughly 2× against a fameless spelling, and that
     *  re-pricing is T9's to measure and the owner's to rule. */
    leakBasePerWeek: 0.008,
    /** ⭐⭐⭐ NEW COUPLES GET CAUGHT – the owner's D5 (14.09, «давай попробуем как ты предлагаешь»):
     *  the leak hazard runs `leakFreshMult` times hotter while the episode is at most
     *  `leakFreshWeeks` old (`world.week − sinceWeek <= leakFreshWeeks`). The design's own reason:
     *  the founding scene («a parent learning about a boyfriend from a photograph») fired 0 times
     *  in 93 leaks across 160 bench careers, because the parent's disclosure lag is short against
     *  the time a flat hazard needs – and the girl whose untold window is LONG is exactly the
     *  private girl the scene is about. First dinners are where the lenses are; an old couple is
     *  furniture. ⚠ BOTH §4-CLASS PROPOSALS, bench-priced predicted-first (T9 prints the overtake
     *  share per arm), his word after the numbers – the MECHANISM is ruled, the sizes are not. */
    leakFreshWeeks: 8,
    leakFreshMult: 4,
    /** ⭐⭐⭐ WHO IS SIMPLY SEEN – the multiplier on the leak hazard, read off her EXPRESSED openness
     *  (§0.6: mechanics read expression, voices read birth). §3c-bis: «an open girl is simply seen
     *  (dinner, a hand held at an airport)», a private one is not.
     *
     *  ⚠ IT IS THE MIRROR OF `opennessScale` AND POINTS THE OTHER WAY, which is the whole design and
     *  is easy to «fix» by accident: the open girl leaks FOUR times as often (×2.0 against ×0.5) and
     *  pays HALF as much for each exposure (×0.75 against ×1.5). Openness is not a good or a bad
     *  trait here; it decides which half of the bargain she gets.
     *
     *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**. T9's bench prices the pair, and the census prints share
     *  leaked and median lag per temperament (§3c-bis's own expectation: «open leaks often/true,
     *  private rarely/late/wrong»). */
    leakOpennessMult: { open: 2.0, private: 0.5 },
    /** ⭐⭐ THE NOTICED BAND'S DISCOUNT ON THE LEAK – D1's «иногда» made a number: at 101–200 the
     *  world glances rather than watches, so the hazard runs at half weight; at ≤ 100 the scale is
     *  1 by construction (the band check multiplies by this only at 'noticed'). ⚠ A PROPOSAL –
     *  the bands are the owner's, this discount is the architect's, T9 prices it. */
    noticedLeakScale: 0.5,
    /** ⭐⭐⭐ HOW WRONG THE WORLD GETS IT – the share of leaks that land as a WRONG story, by
     *  EXPRESSED openness. who-she-is §3c-bis's own gem: «openness controls not only the SPEED of a
     *  leak but its ACCURACY. An open girl's life leaks EARLY and roughly TRUE – the world saw it,
     *  it is ordinary. A private girl's life leaks LATE and WRONG – the tabloid misattribution
     *  engine.»
     *
     *  ⚠⚠ THE **LATE** HALF IS EMERGENT AND THERE IS NO LAG TERM ANYWHERE – the brief's own ⚠, kept
     *  here because this is the constant a later reader would reach for to «add the lateness». It
     *  falls out of `leakOpennessMult` alone: a private girl's hazard is a quarter of an open one's,
     *  so her story breaks later in the episode by arithmetic and not by a second number. A lag term
     *  added beside this one would price the same fact twice. T9's census measures the median lag
     *  rather than setting it.
     *
     *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**. */
    wrongShare: { open: 0.15, private: 0.6 },
    /** ⭐⭐⭐ HOW LONG A PUBLIC FACT STAYS **NEWS** – the booth's window, in weeks, measured from the
     *  week the fact itself became public (`publicWeek` for «someone is there», `endedWeek` for «it
     *  is over»). Inside it the booth may touch the fact once; outside it the fact is old and is
     *  never voiced at all (T7, `world/lifeBeat.ts` §10).
     *
     *  ⚠⚠ IT IS A WINDOW ON THE **FACT**, NOT A COOLDOWN ON THE BOOTH, and the difference is the
     *  whole design. A cooldown would make the mention a rate the booth is allowed; this makes it a
     *  property of the STORY – a headline six weeks old is not what a commentator fills a changeover
     *  with. The once-ness is carried by the two `aired*` stamps and by nothing here, so shortening
     *  this number can only ever make the booth say LESS, never say it twice.
     *
     *  ⚠ INCLUSIVE, AND THE COMPARISON IS `week − factWeek <= newsWindowWeeks` – «a fact OLDER than
     *  `newsWindowWeeks` is never aired», the brief's own sentence, so a fact of exactly this age
     *  still airs and one week older never does. Both edges are pinned
     *  (`tests/wave6-booth-channel.test.ts` §C) precisely because an off-by-one here is invisible in
     *  play.
     *
     *  ⚠⚠ A §4 PROPOSAL AND **UNRULED**, like everything in this block bar `opennessScale`. The
     *  brief's §4 lists it under «Proposals – NONE ruled, all bench-priced predicted-first, his word
     *  after» («`newsWindowWeeks 6`»). Six weeks is the brief's number and T9 prices it; nothing in
     *  T7's pins asserts the 6 – they read this constant, so a re-tune moves both sides of every
     *  expectation together. */
    newsWindowWeeks: 6,
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
        // ⭐⭐ ROUND 42 #49(b) – THE SECOND OF THE TWO HIGH TIERS, and it is here because he said
        // «тиры» in the plural: «высокие тиры восстановлений в одном ценовом коридоре независимо от
        // достатка». The full ruling and its measurement are on the `elite` row below; this rung is
        // the other half of the same sentence. $1,800-3,000 a week is not a rung a family on
        // «200-300 в неделю» reaches either, which is the test his reasoning sets.
        //
        // ⚠ THE BAND STOPS HERE AND DOES NOT REACH `seaside` ($600-1,000). That row is the family
        // hotel a stretched family really does book, so the corridor is doing its job there – the
        // ruling is about the TOP of the ladder, not about recovery in general.
        uniformPrice: true,
      },
      {
        id: 'elite',
        label: 'Elite recovery programme',
        blurb: 'The clinic the pros use – she comes back new.',
        priceCents: [4000_00, 7000_00],
        conditionGain: 48,
        buffFactor: 0.85,
        // ⭐⭐ ROUND 42 #49(b) – **SET**, AND THE RULING IS WHAT THE BENCH COULD NOT SEE. His word,
        // 16.09: «высокие тиры восстановлений в одном ценовом коридоре независимо от достатка…
        // пользуются этими восстановлениями уже когда деньги реально есть. Вряд ли семья с доходом
        // 200-300 в неделю туда поедет, а если и поедет – это их выбор.» The #19 note below is kept
        // VERBATIM underneath, because the measurement in it is still true and is still the cost of
        // this line – what changed is not the number, it is the question the number answers.
        //
        // ⚠⚠ WHY THE 4-OF-20 REFUSAL DOES NOT BIND ANY MORE. `tools/r42-elite-retainer.ts` walks its
        // corpus under `econ-bench`'s policy, and that policy books the best package inside 10% of
        // current funds every off-season and every rescue – mechanically, with no view on whether a
        // family like this one would ever choose a clinic. So the four mid-careers it moved are the
        // AUTOPILOT's bookings re-priced, not a player's. His sentence is precisely the judgement the
        // policy does not make, and no arm can supply it: no bench can tell «a family that would
        // never book this» from «a family whose autopilot books everything». That limit is named in
        // docs/specs/elite-retainer-2026-09.md §9 rather than quietly re-measured away.
        //
        // ⚠ AND THE COST IS STILL THE COST. The re-measurement under #49(b) is in that same §9: the
        // mid-careers that never enter the rank band still move, because a discretionary week really
        // did get dearer for them. He has spent it knowingly.
        //
        // ---------------------------------------------------------------------------------------
        // ⭐⭐ ROUND 42 #19 – HIS SECOND NAMED FIGURE, MEASURED AND THEN **NOT TAKEN** (the state
        // this row was in until #49(b), kept because the measurement is the price of the line above).
        //
        // «элитный стоит 830 в неделю… И то же про элит рекавери… 2900». $2,900 is this band's floor
        // times a WORKING family's 0.725 corridor, so «the clinic the pros use» quotes the poorest
        // family in the game a third off - and round 41 P1 already ruled on that shape for coaching
        // («в про карьере с большими чеками цены для всех должны быть равны»). Extending P1 to this
        // rung is ONE LINE: `uniformPrice: true` here. It was built, it typechecks, and it is what
        // `tools/r42-elite-retainer.ts`'s clinic arm switches on.
        //
        // ⚠⚠ IT WAS REFUSED BY ITS OWN MEASUREMENT, AND BY THE HARDEST CONSTRAINT THIS ITEM HAS.
        // Finding 3.2 says the raise must reach the elite tail and nothing else, so the bench
        // partitions its corpus by whether a career ever enters the rank band and reads the wallet
        // delta for the ones that never do. Over 20 such mid-careers (14->20, 6 seeds x 9 presets):
        //   the rank band alone     0 of 20 moved, worst $0        - the constraint, satisfied
        //   the band + this rung    4 of 20 moved, worst $178,701  - the constraint, broken
        // A clinic week is discretionary and one-off, so «only a rich family could buy it» sounded
        // right and is not: a stretched family books one after an injury, and the corridor is what
        // made it reachable. The clean rank gate has no such failure mode because a rank is not a
        // decision the family can stretch for.
        //
        // ⚠ SO THE MECHANISM STAYS AND THE FLAG DOES NOT, and that is the same shape v78's own
        // `sparringHired` note describes: a reader who finds an unused switch here is reading a
        // DECISION with a bench behind it, not a half-built feature. The other reading of his $2,900
        // is on the table too - `resort` at a WEALTHY corridor quotes $2,950, which is nearer his
        // number than this rung's working-family quote - and which of the two he meant is one word.
        //
        // ⚠ ZERO DRAWS EITHER WAY when it is switched on: `corridorPrice` still spends its `pickInt`
        // and its `rng()` on a purpose-scoped sub-stream that persists nothing; only the multiply
        // after them changes.
        uniformPrice: true,
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
        // ⭐⭐⭐ T12, THE OWNER 14.09 – AND IT IS THE ROW HE CAUGHT. «у рабочей семьи, если вложить
        // все деньги сразу со стартом карьеры в депозит, сразу же приходят спонсорские деньги.» The
        // need gate under the cameo sponsor now reads `reachableFundsCents` (world/assets.ts), and
        // this flag is what tells it that money put here has not left the family. See `ShopItem.
        // cashParking` for why the mark is on the shelf rather than in the gate.
        cashParking: true,
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
        // ⭐⭐⭐ ROUND 42 #13 – $5,000 → $1,000, AND THE REASON IS THAT NOTHING EVER DEFENDED THE
        // $5,000. THE OWNER, 15.09: «в индексный фонд можно только от 5к зайти, мне кажется это
        // необосновано.» He is right about the record: the deposit's own $1,000 carries an argument
        // in this file («chosen so the dullest rung on the shelf quotes the roundest possible
        // price»), and this number carried none at all – it arrived with §3a's liquidity ladder as
        // a shape, not as a measurement, and no bench, spec or ruling has ever cited it.
        //
        // ⚠ ONE FLOOR FOR BOTH OPEN RUNGS NOW, which is what makes this a one-line change: the
        // shelf's «ONE MINIMUM, NOT TWO» law (`world/shop.ts`) already holds a TOP-UP to the same
        // floor as the opening stake, so top-ups drop to $1,000 with it and there is no second
        // threshold anywhere to keep in step.
        //
        // ⚠ AND NOTHING ELSE MOVES, BECAUSE FRACTIONAL UNITS ARE ALREADY THE SYSTEM'S OWN
        // ARITHMETIC. `buyAsset` divides cents by this week's unit price with no rounding and no
        // floor (`units = paidCents / price`), which is round 30 #14's whole design – «доли дадут
        // возможность расти на горизонте и будут давать разные точки входа». At `unitBaseCents
        // 4_000_00` a $1,000 entry is 0.25 of a unit, and the screen already prints two decimals
        // (`formatUnits`) precisely because a part unit is a real holding.
        entryCents: 1_000_00,
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
        // ⭐⭐⭐ T12, THE OWNER 14.09 – THE SECOND PARKING PLACE, and it is in for the same reason the
        // deposit is: «Это надо починить, чтобы поддержка приходила реально тогда, когда вообще уже
        // край и денег нет, а не только кошельком мыслить.» He named the deposit because that is
        // what he parked in; a fix that saw only the row he happened to use would have been the
        // same defect with one more week of life in it.
        //
        // ⚠ ITS WORTH MOVES AND THAT IS FINE, which is the one thing worth saying out loud about
        // this row rather than the deposit: `volBps` above means a fund holding can be worth less
        // than the family put in, and on a bad market year it can fall THROUGH the gate and let the
        // cameo write. That is not a leak – it is need, correctly seen, because the money the family
        // can actually reach really did shrink. `revalueAssets` has already priced it for the week.
        cashParking: true,
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
      // ⭐⭐ ROUND 35 #5 – THE FOUR CARS NOW HAVE PAINTINGS, AND THREE OF THEM DESCRIBED A DIFFERENT
      // CAR. The owner asked for exactly this and named all four: «cars - есть арты для каждой
      // машины (универсал 60к, люкс внедорожник 110к, спорткар 190к, 4местный люкс кабриолет 300к)
      // надо и описания поправить немного с названиями».
      //
      // ⚠ SO THIS IS THE ONE FAMILY WHERE CLAUDE.md INVARIANT 4 IS SATISFIED BY THE ITEM ITSELF:
      // he asked for the names and the descriptions to be corrected, and each correction is the
      // painting he drew read back in words. Nothing else on the shelf changed a syllable.
      //
      //   60k  универсал                `The sensible estate`   – already an estate, UNTOUCHED.
      //   110k люкс внедорожник         was `The good saloon`, and a saloon is not a four-by-four.
      //   190k спорткар                 the label survives; the blurb said «twenty-five years late»
      //                                 and the painting is a new car, so that half goes.
      //   300k 4местный люкс кабриолет  the blurb said «no back seats» and the painting has four
      //                                 of them under an open roof.
      {
        id: 'car-good',
        family: 'car',
        stake: 'fixed',
        label: 'The luxury four-by-four',
        blurb: 'Tall, quiet, and it will never once see a field.',
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
        blurb: 'Two seats, no boot, and the one that was on the bedroom wall.',
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
        blurb: 'Four seats, no roof, and no defence for any of it.',
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
        // ⭐⭐ ROUND 35 #13 (03.09) – $520,000 -> $590,000, AND THE PAINTING WAS RIGHT ALL ALONG.
        // The owner: «Дом пусть будет за 590к - ок». His art for this rung has been named
        // `property-590` since round 35 #1, and round 35 #7 deliberately left the price alone
        // because he had asked to ADD two tiers and nothing else – see the note below, which was
        // this rung's own record that the stem and the price disagreed. He has now ruled, so they
        // agree: the number here IS the number in the filename.
        //
        // ⚠ NO SCHEMA MOVE, AND HE CLOSED THAT QUESTION HIMSELF: «Дом за 520к кто-то мог купить -
        // никто не купил, нет игроков». A price is read live off this row at the two sites that
        // ask – `buyAsset` (what leaves the wallet) and `shopView` (what the card quotes) – while
        // an OWNED row is valued off its own `paidCents` (`assetWorthCents`), so an existing
        // holding is arithmetically untouched by this line. Nothing is persisted, nothing is
        // renamed, `SAVE_SCHEMA_VERSION` stays at 69.
        entryCents: 590_000_00,
        annualRateBps: 300,
      },
      // ⭐⭐ ROUND 35 #7 – THE LADDER GETS ITS TOP TWO RUNGS, and the ask is one clause: «Добавится
      // 2 тира домов еще: за 1.4м и за 3м». Both prices are HIS, to the digit, which is the whole
      // difference between these two rows and the two above them – §12b had to measure $240,000 and
      // $520,000 because the spec gave tiers and no numbers, and here the numbers came with the ask.
      //
      // ⚠ THE RATE IS THE FAMILY'S OWN +3% AND IS NOT A THIRD DECISION. §3c's word is «slow» and
      // both shipped houses carry 300 bps; a top rung that out-earned the ones below it would make
      // the expensive house the correct answer to a question §0 says assets must never win («assets
      // never beat a career, they only survive one»). No build wait and no upkeep, exactly as the
      // two rungs above – a house is bought and lived in, and §3f's «годовое обслуживание» is said
      // of the boats and the planes, never of these.
      //
      // ⚠ AND NOTHING BELOW THEM MOVED **AT THE TIME**. `house-garden` stayed at $520,000 through
      // this slice even though his painting for it is named `property-590`, because he had asked to
      // ADD two tiers and to change nothing else. ⭐ ROUND 35 #13 CLOSED IT the other way – «Дом
      // пусть будет за 590к - ок» – so the rung above now reads $590,000 and the stem is no longer
      // a discrepancy anybody has to carry a note about. The two prices HERE are still his own and
      // still untouched.
      {
        id: 'house-villa',
        family: 'house',
        stake: 'fixed',
        label: 'The villa with the pool',
        blurb: 'Glass, warm stone, and water that belongs to the family.',
        entryCents: 1_400_000_00,
        annualRateBps: 300,
      },
      {
        id: 'house-headland',
        family: 'house',
        stake: 'fixed',
        label: 'The house on the headland',
        blurb: 'Above the sea, with a pool that looks as though it falls into it.',
        entryCents: 3_000_000_00,
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
      // ⭐⭐⭐ ROUND 35 #8 – THE TWO BOTTOM RUNGS SWAPPED IDENTITIES, AND ONLY THEIR IDENTITIES.
      //
      // THE OWNER: «water - карточки как на домах, все арты яхт в наличии, меням местами только: за
      // 900к это парусник, за 2.4м уже небольшая яхта, дальше как было.» His two paintings say the
      // same thing without a word: `water-900` is a sloop under full sail, `water-2400` is a small
      // motor yacht on the plane.
      //
      // ⚠⚠ THE IDS DID **NOT** MOVE WITH THE IDENTITY THIS TIME, AND THAT IS A DELIBERATE DEPARTURE
      // FROM THE PRECEDENT DIRECTLY BELOW (part three P1 renamed `boat-motor` to `boat-sail` and
      // paid for it with migration v66). The reason is that this is a SWAP rather than a rename:
      // moving both ids would collide mid-flight, so it needs two renames, a schema bump and a
      // golden fixture to express what the player sees as two cards trading places. The ids are
      // internal – nothing on screen reads them but `src/art/shelf.ts`, which is keyed by id and
      // was written for exactly this – so the cost buys nothing a player can see. ⭐ `boat-launch`
      // is the SAILING BOAT now and `boat-sail` is the SMALL YACHT; the names are stale and the
      // rows are right, and one sentence from him turns that into a v70 migration.
      //
      // ⚠ PRICE, BUILD TIME, RATE AND UPKEEP ARE UNTOUCHED ON BOTH ROWS – «дальше как было», and
      // his swap is about what the thing IS at each price, never about what it costs.
      {
        id: 'boat-launch',
        family: 'boat',
        stake: 'fixed',
        label: 'The sailing boat',
        blurb: 'Two cabins, a mast, and weekends that answer to the wind.',
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
      // ⚠ ROUND 35 #8 READ THIS PARAGRAPH AND DID NOT DELETE A WORD OF IT: it records a real ruling
      // he made in round 29, and the ruling stands – the 2.4M rung is still not a motor boat named
      // by a spec, it is whatever he last said it is. What moved on 03.09 is which rung is the
      // SAILING one, and the id is now stale rather than wrong. See the note on `boat-launch` above.
      {
        id: 'boat-sail',
        family: 'boat',
        stake: 'fixed',
        label: 'The small yacht',
        blurb: 'A flybridge, four berths, and a bay to be at anchor in.',
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
      //
      // ⚠ ROUND 35 #8 MOVED THE WORD «SAILING» ONE RUNG DOWN AND NOT ONE PENNY OF THIS. The two
      // rungs the paragraph above calls «the launch and the sailing yacht» are the 900k and 2.4M
      // rows, which is what they still are; only their labels traded places. The rule it states is
      // the reason nothing had to move: the grant reads the 10% upkeep, never the label, so a rung
      // that is CALLED a yacht at 2.4M still grants no week because it still keeps no crew.
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
      // ⭐⭐ ROUND 35 #9 – A SECOND LIVE AEROPLANE, UNDER THE ONE THERE IS. The owner: «air -
      // карточки как на домах, добавляется небольшой самолет 8 мест за 7м, большой на 12 мест
      // остается как был за 18м», and, when asked, in as many words: «у нас сейчас один активный за
      // 18м, раньше был еще за 28м, а я прошу добавить второй за 7м с картинкой».
      //
      // ⚠ THE PRICE IS HIS AND THE OTHER THREE NUMBERS ARE THE FAMILY'S OWN. Both shipped aircraft
      // carry the same rate (−600) and the same upkeep (800 bps), so those two are not a choice at
      // all – they are what a plane costs on this shelf. The BUILD TIME is the one figure the two
      // rungs do not share (104 at $18M, 156 at the retired $38M, rising with the price), so the
      // rung below them gets the shortest wait on the shelf, 52 weeks – the same year `boat-launch`
      // waits, and about what a light aircraft really takes. ⭐ It is MINE and not his: one number,
      // and moving it moves nothing else.
      //
      // ⚠⚠ ITS BLURB DELIBERATELY DID NOT COUNT THE SEATS, AND ROUND 35 #13 IS THE WORD THAT
      // CLOSED IT. The row shipped silent on the cabin because his first message called this one
      // «8 мест» and the $18M one «большой на 12 мест» while the $18M row had said «Eight seats»
      // since round 29 #5 – two cards on one screen would have claimed the same cabin, and
      // CLAUDE.md invariant 4 forbids an agent editing a shipped sentence it was not asked to edit.
      // The note said one word from him closes it. On 03.09 he gave two: «самолет 18м стоит
      // (верно) мест пусть будет 10. У маленького 7. всё.»
      //
      // ⭐ SO BOTH COUNTS ARE HIS, THE PRICES ARE UNTOUCHED, and the pair is consistent for the
      // first time: seven below, ten above. ⚠ THIS IS THE ONE KIND OF WORDING CHANGE INVARIANT 4
      // ALLOWS – he asked for these numbers by name, so the sentence moves because he moved it and
      // not because an agent thought it read better. Nothing else on either row changed a syllable.
      //
      // ⭐ AND SEVEN IS A REAL AEROPLANE. His own research (docs/research/private-jets-in-tennis.md)
      // prices Nadal's Cessna Citation CJ2+ at $5–7M for up to 8 passengers, so the $7M rung sits on
      // an aircraft that exists at that money – the price was chosen before the research and
      // survived it.
      {
        id: 'plane-small',
        family: 'plane',
        stake: 'fixed',
        label: 'The small plane',
        blurb: 'Seven seats, short runways, and home the same night.',
        entryCents: 7_000_000_00,
        annualRateBps: -600,
        buildWeeks: 52,
        upkeepBps: 800,
      },
      {
        id: 'plane',
        family: 'plane',
        stake: 'fixed',
        label: 'The plane',
        // ⭐ ROUND 35 #13 – «Eight seats» -> «Ten seats», his own count («мест пусть будет 10»).
        // The PRICE he confirmed unchanged in the same breath: «самолет 18м стоит (верно)».
        blurb: 'Ten seats and no airport that keeps them waiting.',
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
      // and a stage IS the wait.
      //
      // ⭐⭐⭐ ROUND 41 #24 (12.09) – THE OWNER GAVE THE FILE WHAT §3g HAD NOT, AND THE PARAGRAPH
      // ABOVE IS AMENDED RATHER THAN DELETED: it recorded, correctly, that the wait was never ours
      // to invent. He asked for it himself – «может быть для Академии корты, клубный дом и стафф
      // тоже должны сколько-то строиться по времени, а не сразу быть готовы?» – and then ruled the
      // proposed timings and the round in one line: «сроки ок, в этот же раунд заводи пожалуйста».
      // So three of the four stages now carry §3f's own `buildWeeks`, and the UPKEEP half of the
      // sentence still stands untouched: he asked about building time, not about a maintenance
      // line, and the spec's §2 refusal of a land/building split is the reason inventing one here
      // would be worse than silence.
      //
      // ⚠⚠ THE LAND DOES NOT BUILD, AND THAT IS HIS OWN LIST READ LITERALLY: «корты, клубный дом и
      // стафф» names three things and the deeds are not among them. A field is BOUGHT rather than
      // BUILT – there is nothing to wait for once the money has moved – so `academy-land` carries no
      // `buildWeeks` and a career that orders it owns it the same week, exactly as it always has.
      //
      // ⚠⚠ THE THREE NUMBERS ARE THE ROUND'S PROPOSAL, WHICH IS WHAT HE APPROVED: courts 6 weeks,
      // the clubhouse 12, the staff 3. His band for the hire was «2–4» and the round proposed ONE
      // number out of it – 3, the middle – because a range is not a field. The two builds are the
      // shortest waits on this shelf by a long way (`boat-launch`'s 52 is the next one up), and that
      // is the point rather than an oversight: sixteen courts and a clubhouse are a season's work in
      // a way a yacht is not, and the whole of §3g's «a half-built academy is a real state the
      // player can sit in» is that the stages are LIVED through rather than waited out.
      //
      // ⚠⚠⚠ AND NOT ONE LINE OF MACHINERY MOVED FOR THIS. Every reader of academy ownership already
      // asks `deliveredAssets` – the income (`assetWeeklyIncomeCents`'s own first line), the ending's
      // stage count, the sale, the upkeep meter – and the WORTH falls out of the clamps two
      // functions already carry (`buyAsset` writes `basisWeek = readyWeek`, and both
      // `assetValueCents` and `rampedWorthCents` clamp a negative span to zero), so a stage under
      // construction is worth exactly what was paid for it, which is the boats' own behaviour to the
      // cent. A wait that needed a new guard would have needed a new persisted field; this one needs
      // neither, and `SAVE_SCHEMA_VERSION` does not move.
      //
      // ⭐⭐⭐ ROUND 38 #8 (07.09) – THE FOUR RATES MOVED 0 -> +300 bps, WHICH IS THE HOUSES' OWN
      // NUMBER, AND THE OWNER ASKED FOR EXACTLY THAT COMPARISON: «а что насчёт стоимости и индексации
      // этой стоимости с годами? Как с домами, например.»
      //
      // ⚠⚠ WHAT HE WAS LOOKING AT WHEN HE SAID IT, 06.09: «Академия при этом стоит ровно на месте –
      // и это не очень корректно, как мне кажется.» And he was reading the catalogue correctly.
      // `assetValueCents` indexes EVERY rung by `annualRateBps`; the academy was the only family on
      // the shelf carrying a literal zero, so «стоит ровно на месте» was not a rounding artefact or a
      // missing formula – it was this field, four times. The fix is this field, four times.
      //
      // ⚠⚠ ONE RATE AND NOT TWO, AND THE SPLIT IS REFUSED ON PURPOSE (the spec's §2). A real
      // academy's LAND appreciates while its BUILDINGS depreciate and have to be maintained – true,
      // and deliberately not modelled, because this family carries no `upkeepBps` at all. Splitting
      // the drift would ship the LOSS without the upkeep line that justifies it, and the four stages
      // would quietly diverge on a screen that offers no reason why. The honest version of that split
      // is a later item WITH a maintenance line beside it, and it is his call, not this one's.
      //
      // ⚠ THE SENTENCE ON THE CARD MOVES WITH THE NUMBER, AND NO STRING WAS EDITED TO MOVE IT.
      // `rateLine` picks its branch off `annualRatePct`, so these four rows now read the HOUSES'
      // sentence («Gains about 3% a season») instead of the zero branch's «Neither gains nor loses» –
      // which is precisely «как с домами» arriving on screen. Invariant 4 is satisfied the strict
      // way rather than the convenient one: the copy in `MoneyScreen.vue` is untouched to the byte,
      // and what changed is the data the existing sentence is chosen by. ⚠ The zero branch is now
      // reachable from no rung on the shelf; it is KEPT, because it is the honest answer for the next
      // rate-0 rung and deleting a correct branch to chase coverage is how a shelf loses a case.
      //
      // ⚠ THIS NOTE USED TO END «and the shelf says so in as many words («Holds its value»)» AND THAT
      // SENTENCE IS GONE FROM THE SHELF – round 30 #11, the owner: «Holds its value странно звучит –
      // это напрямую значит, что оно обесценивается, а это вроде бы не совсем так». The MECHANIC did
      // not move a cent then (checked first: a rate-0 rung is worth what was paid for it forever and
      // the sale is whole), only the words. This time it is the other way round: the mechanic moved
      // and the words followed it. A comment naming a string that no longer exists is the one way a
      // comment must not be wrong, so it names the new one: **«Gains about 3% a season»**, the same
      // sentence all four houses read.
      {
        id: 'academy-land',
        family: 'academy',
        stake: 'fixed',
        label: 'The land',
        blurb: 'Twelve hectares outside town, and a name on the deeds.',
        entryCents: 2_000_000_00,
        annualRateBps: 300,
      },
      {
        id: 'academy-courts',
        family: 'academy',
        stake: 'fixed',
        label: 'The courts',
        blurb: 'Sixteen of them, and the lights that keep them open till nine.',
        entryCents: 3_000_000_00,
        annualRateBps: 300,
        requiresId: 'academy-land',
        // ROUND 41 #24 – «корты… должны сколько-то строиться по времени»; his «сроки ок».
        buildWeeks: 6,
      },
      {
        id: 'academy-building',
        family: 'academy',
        stake: 'fixed',
        label: 'The clubhouse',
        blurb: 'Gym, kitchen, forty beds and somewhere to do the homework.',
        entryCents: 4_000_000_00,
        annualRateBps: 300,
        requiresId: 'academy-courts',
        // ROUND 41 #24 – «клубный дом», the longest of the three: gym, kitchen and forty beds.
        buildWeeks: 12,
      },
      {
        id: 'academy-staff',
        family: 'academy',
        stake: 'fixed',
        label: 'The staff',
        blurb: 'Coaches, physios and the person who answers the telephone.',
        entryCents: 3_000_000_00,
        annualRateBps: 300,
        requiresId: 'academy-building',
        // ROUND 41 #24 – the STAFF is a hire rather than a build, and his band was «2–4» weeks.
        // One number out of the middle of it: notice periods, not concrete.
        buildWeeks: 3,
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
    /** ⭐⭐⭐ ROUND 38 #16 (07.09) – A BRAND IS A PROCESS, NOT A PURCHASE.
     *
     *  THE OWNER, overturning the `max(catalogue, worth)` rule he had approved the day before:
     *  «если мы до пика известности бренд не покупали, то он всё равно поднимался в цене? Это
     *  супер-странно. Я бы сказал, что он неизменно для первого открытия стоит 250к, а потом МОЖЕТ
     *  набрать свои 5млн, но не за 1 день, т.к. это процесс. Если уровень известности большой, то
     *  набор будет идти быстрее (может быть кратно быстрее), но он всё равно будет идти, на это надо
     *  время.» And on the number: «полураспад 2 года при средней славе, кратно быстрее при высокой».
     *
     *  ⚠⚠ WHAT IT REPLACES AND WHY HIS SHAPE IS BETTER. A rung whose worth is DERIVED used to be
     *  worth its full derived value the instant it was bought, so it could be sold at that value and
     *  bought back at the catalogue price – +$2,326,989 a cycle on his own save, repeatable, in one
     *  week. `max(catalogue, worth)` closed that by making the PURCHASE dear, which also made a FIRST
     *  brand on a famous career cost $5,172,791 – the strange half he objected to, and it needed a
     *  price on the card that was not the price on the card. A worth that RAMPS from what was paid
     *  toward the derived value closes the same loop by construction: a freshly bought brand is worth
     *  what was paid for it, so selling at $5.17M and buying back at $250,000 LOSES $4.9M.
     *
     *  ⭐ AND IT ANSWERS THE FIRST THING HE ASKED THIS ROUND FROM THE OTHER SIDE. A stored value that
     *  CHASES its derived value smooths the FALL as well as the climb – «делая его более плавным»,
     *  item 2. One mechanism, both directions.
     *
     *  ⚠ NO SCHEMA MOVE: the ramp is a function of `boughtWeek` and `paidCents`, both persisted since
     *  the shelf shipped. An existing save's brand simply starts converging from where it is. */
    worthRamp: {
      /** the half-life of the gap between what was paid and what it is worth, at `medianDriver` */
      halfLifeWeeks: 104,
      /** ⚠ MEASURED, NOT PICKED: fame across the owner's 22 professional careers reads p10 3.2,
       *  MEDIAN 12.8, p90 39.3, max 81.3. So «средняя слава» is 12.8 and the pace is the ratio to it –
       *  p90 closes the gap three times faster, which is his «кратно быстрее». */
      medianFame: 12.8,
      /** ...and the academy's driver is REPUTATION above its 1.0 base, on its own scale. */
      medianReputationOver1: 1.8,
      /** ⚠ THE CLAMP THAT STOPS A DIVISION BY NOTHING. A career the world has never heard of has a
       *  driver at or near zero; without this the half-life is infinite and the rung would be frozen
       *  at what was paid for ever, which is not «медленно» but «никогда». Eight years is slow. */
      maxHalfLifeWeeks: 416,
      /** ...and the other end: a driver this far above the median stops buying more speed.
       *
       *  ⭐⭐ ROUND 39 #5 (REOPENED, owner 08.09 «давай попробуем») – 13 → 52, AND THE OLD FLOOR IS
       *  WHY THE LOOP SURVIVED ROUND 38. At the fame cap the pace ratio is 100/12.8 ≈ 7.8, so the
       *  half-life ran all the way down to ~13.3 weeks and a $250,000 brand was worth $1,844,174
       *  ONE WEEK after purchase (his own report: «свежекупленный бренд возвращался к своей
       *  стоимости уже в течение 5 недель» – measured, the 5-week point was $8.2M of $35.9M).
       *  His round-38 law stands unmoved – «полураспад 2 года при средней славе, кратно быстрее
       *  при высокой» – because 104/52 = 2x faster at the cap is still «кратно»; what the old
       *  floor allowed was 8x, which is «за несколько недель», the exact complaint. At 52 the
       *  week-1 worth of a fresh cap-fame brand is ~$723k and half the derived value takes a full
       *  year: «это процесс» at every level of fame. Measured in tools/r39-brand-loop.ts. */
      minHalfLifeWeeks: 52,
    },
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
  grade: KitGrade | null = null,
): GearHit[] {
  const line = ECONOMY.gear[category]
  const [cadLo, cadHi] = line.cadenceWeeks[background]
  // ⚠ THE RUNG PRICES THE PURCHASE (round 41 P1) AND THE STREAM CANNOT FEEL IT. `pickInt` spends
  // exactly ONE `rng()` call whatever its bounds, so moving this band from the background's to the
  // rung's changes the VALUE drawn and never the position after it – the cadence walk, and therefore
  // every purchase WEEK a career has ever had, is byte-identical. That is what lets `weeksSinceGear`
  // below stay rung-blind and still agree with this function to the week.
  const [prLo, prHi] = gearPriceBandCents(category, background, grade)
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
function corridorPrice(
  rng: Rng,
  band: readonly [number, number],
  background: FamilyBackground,
  /** ⭐ ROUND 42 #19 – `false` prices this offer at ONE number for every family (`UNIFORM_CORRIDOR`),
   *  which is round 41 P1's ruling for a top-of-the-market service. Defaults to the corridor every
   *  caller has always had, so only the row that asks for it moves.
   *
   *  ⚠ BOTH DRAWS STILL HAPPEN. `pickInt` and the `rng()` below run whatever this resolves to, the
   *  same discipline the coach's own corridor keeps: a sub-stream's POSITION may not depend on a
   *  price decision, or two families would walk `seed:vacation:<week>:<id>` differently. */
  corridored = true,
): number {
  const base = pickInt(rng, band[0], band[1])
  const [cLo, cHi] = corridored ? WEALTH_CORRIDOR[background] : UNIFORM_CORRIDOR
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
  // ⭐ ROUND 42 #19 → #49(b) – `uniformPrice` is the flag that opts a rung out of the wealth
  // corridor, and the two HIGH TIERS (`resort`, `elite`) carry it since his 16.09 ruling. See the
  // `elite` package for the ruling, the measurement and the limit no bench can pass.
  return corridorPrice(
    rngFromSeed(`${seed}:vacation:${week}:${packageId}`),
    pkg.priceCents,
    background,
    !(pkg.uniformPrice ?? false),
  )
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
  const rng = rngFromSeed(`${seed}:gear:${category}`)
  let w = 0
  let last = 0
  while (true) {
    w += pickInt(rng, cadLo, cadHi)
    if (w > week) break
    // The price draw must be spent even though it is unused here, or the NEXT cadence draw would
    // read a different number than `gearHitsUpTo` reads and the two functions would drift apart.
    //
    // ⚠ AND ITS BAND IS IRRELEVANT, WHICH IS WHY THIS FUNCTION NEEDED NO RUNG WHEN ROUND 41 P1 MADE
    // THE PRICE RUNG-KEYED. `pickInt` spends exactly one `rng()` call whatever its bounds, so the
    // stream position after the discard does not depend on which band is passed; the degenerate band
    // says that out loud rather than quoting a rung this function has no business knowing.
    pickInt(rng, 0, 0)
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
  grade: KitGrade | null = null,
): GearHit | null {
  return gearHitsUpTo(seed, category, background, week, grade).find((h) => h.week === week) ?? null
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

/** ⭐⭐ WHAT THE FAMILY HAS LEFT ON WEEK 0, AFTER NINE YEARS OF HER CHILDHOOD – the prologue's whole
 *  money model, and the only new arithmetic phase 4 adds (build spec §4).
 *
 *  Every family moves by the same SHARE of its OWN reserve, which is §2.4's ruling in one line – the
 *  player chooses where the family is FROM, not a sum, and the nine years move the number from
 *  there. `moved` is a pure position in the card table's range, -1 (the dearest childhood) to +1
 *  (the cheapest), and `reserveSwingShare` says how much of the reserve that position is worth:
 *
 *      middle, cheapest childhood ($8,200)   ->  25,000 x 1.20  = $30,000
 *      middle, the reference ($18,175)       ->  25,000         = $25,000  (the flat number)
 *      middle, dearest childhood ($28,150)   ->  25,000 x 0.80  = $20,000
 *
 *  ...and the other two the same way: working $6,400 - $9,600, wealthy $96,000 - $144,000. Measured
 *  over all 32 reachable runs in docs/specs/childhood-prologue-balance-2026-09.md §3.
 *
 *  ⚠ THE SHAPE IS EXACTLY THE SHIPPED ONE AND ONLY THE SHARE MOVED. The model this replaces divided
 *  the clamped spend by `startingFundsCents.middle`, which is the same arithmetic with the share
 *  written as `spendSwingCents / 25,000` = 0.399 – a number that was never chosen and never written
 *  down. See `ECONOMY.prologue.reserveSwingShare` for what moved it and why.
 *
 *  ⚠ THE CLAMP BOUNDS FINITE VALUES ONLY, AND IT IS NOT THE WIRE'S GUARD. `spentCents` arrives over
 *  the wire, and a payload claiming a childhood that costs nothing, or one that costs a million, moves
 *  the reserve by exactly the swing the real table can produce and no further. A run through the
 *  shipped cards can never reach the clamp.
 *
 *  ⚠⚠ WHAT THIS DOC CLAIMED UNTIL 26.09, AND WHY IT WAS CORRECTED RATHER THAN KEPT (A-05, the
 *  principles review). It said «THE CLAMP IS A GUARD AND NOT A DIAL … invariant 1 says every command
 *  is re-validated engine-side» – i.e. it named itself as the re-validation. It is not one, for the one
 *  input arithmetic cannot bound: `Math.max(-1, Math.min(1, NaN))` is `NaN`, so a `NaN` (or absent)
 *  `spentCents` births a career with `fundsCents = NaN`, which survives four ticks, is written as
 *  `null` by the autosave codec, and makes its own export file unreadable to the import gate –
 *  measured at the baseline. Invariant 1 IS satisfied now, one layer up where it belongs:
 *  `prologueShapeError` (shared/protocol/profile.ts) refuses a non-finite or non-integer `spentCents`
 *  on the wire, before `createWorld` runs. The clamp stayed exactly as it was; only its claim moved.
 *
 *  ⚠ NO DRAW, NO STATE, NO SCHEMA. Integer cents out, rounded once. */
export function prologueFundsCents(background: FamilyBackground, spentCents: number): number {
  const base = ECONOMY.startingFundsCents[background]
  const { referenceSpendCents, spendSwingCents, reserveSwingShare } = ECONOMY.prologue
  const moved = Math.max(-1, Math.min(1, (referenceSpendCents - spentCents) / spendSwingCents))
  return Math.round(base * (1 + reserveSwingShare * moved))
}

/** ⭐⭐ ROUND-23 #18 – WHAT SHARE OF A CHEQUE IS HERS, in basis points, at a given age.
 *
 *  `ECONOMY.kidShare` holds all four numbers; this is the ramp read off them and nothing else, so a
 *  retune moves the whole game and this function does not change. Flat once the cap is reached (age
 *  23 on the shipped ladder):
 *
 *      <18  18   19   20   21   22   23+
 *      10%  10%  20%  30%  40%  50%  60%
 *
 *  ⭐⭐⭐ ROUND 42 #25 (CONFIRMED 15.09) – THE LADDER ABOVE IS TWICE AS STEEP AND FOUR YEARS SHORTER
 *  THAN THE ONE ROUND 23 SHIPPED (`10 10 15 20 25 30 35 40 45 50`, capped at 26). His words: «может
 *  быть нам с 18 не по 5, а по 10% в год ей добавлять стоит?» and «может даже до 60% к 23», then
 *  «подтверждаю связку». Both numbers are on `ECONOMY.kidShare`; nothing here is a literal.
 *
 *  ⭐⭐⭐ ...AND `pausedYears` IS THE OTHER HALF OF THAT RULING: «пока она снова в тур не вернется».
 *  A birthday spent at college does not move the ladder, so the step count is BIRTHDAYS SINCE
 *  EIGHTEEN MINUS BIRTHDAYS SPENT AT COLLEGE. A girl who enrols at nineteen and comes back at
 *  twenty-three is on 20% the week she returns, not 60%, and climbs from there.
 *
 *  ⚠ IT IS AN ARGUMENT AND NOT A SECOND LOOKUP, and the default of 0 is what keeps that honest: this
 *  function stays pure integer arithmetic with no `world` in it, every existing caller and every
 *  catalogue sweep asks the identical question it always did, and the ONE derivation of «how many
 *  birthdays did college eat» lives in `collegePausedShareYears` (world/college.ts) where the college
 *  span is. Two implementations of that count is how the Money screen and the till would come to
 *  disagree about her cut – the exact failure `kidPrizeShareBps` itself was written to prevent.
 *
 *  ⚠ NO SCHEMA. `CollegeState.fromWeek` / `untilWeek` have been on every save since v51; the count is
 *  read off them and persisted nowhere.
 *
 *  ⭐⭐⭐ ROUND 41 #27 (12.09) – THE FIRST COLUMN IS NEW AND IT USED TO BE A ZERO.
 *
 *  HIS QUESTION: «может быть начать отчисления не в 18, а в 16 лет уже или вообще с момента, когда
 *  она в первый раз на w серию приходит? это же всё таки ее призовые» – and his ruling, option A1,
 *  the same day: «призовые падают на её счёт с первого старта W-серии независимо от возраста –
 *  согласен».
 *
 *  ⚠⚠ «С ПЕРВОГО СТАРТА W-СЕРИИ» NEEDS NO GATE HERE, AND THAT IS A FACT ABOUT THE CATALOGUE RATHER
 *  THAN A SHORTCUT. Prize money exists on the PROFESSIONAL TRACK ONLY: every `wta`-track tier in
 *  `calendar.ts` carries a `prize` array and not one domestic or ITF-junior rung does (junior tennis
 *  pays nothing, ever – ITF Juniors Reg 31 a) i), quoted at the finalize site). `finalizeTournament`
 *  splits inside `if (prize > 0)`, so THE SPLIT IS REACHED ONLY ON A W-SERIES RESULT – «her share of
 *  every prize cheque, at any age» and «her share from her first W-series start» describe exactly the
 *  same set of cheques. A `wtaEverCounted`-shaped gate on top would be a second predicate that can
 *  only ever answer true where it is asked, and this repo has dug out nine dead guards in three days.
 *  ⚠ IT IS ALSO THE STRICTER READING OF HIS SENTENCE. `wtaEverCounted` means «a W result has ever
 *  SCORED», not «she has ever COME» – a W15 first-round exit pays $130 and zero points – so a gate
 *  built on it would have refused her the first cheque she ever earned.
 *
 *  ⚠ THE LADDER FROM EIGHTEEN WAS UNTOUCHED BY ROUND 41 #27 TO THE POINT, which is what kept round 23
 *  #18 and round 35 #9 whole: the curve is CONTINUOUS at the birthday (10% either side of it) and the
 *  two years under it are 10% instead of nothing. ⭐ ROUND 42 #25 IS THE ITEM THAT DID MOVE THE
 *  LADDER, one year later and at his ask – see the table at the top. The continuity across her
 *  eighteenth is untouched by it: `startBps` did not change, so both sides of that birthday are still
 *  10%, and round 41 #27's ruling reads exactly as it did.
 *
 *  ⚠⚠ AND THE MERCH BRAND MOVES WITH IT, BY ROUND 35 #9'S OWN RULE RATHER THAN BY ACCIDENT: «доход
 *  от ее бренда давай тоже как проценты с призовых будем делить» – the brand rides THIS function, so
 *  a sixteen-year-old whose family owns her brand now keeps a tenth of its week too. It is the
 *  faithful reading of «как с призовых» and it can only ever ADD to her account; the alternative –
 *  a second ramp for the brand – is the drift that ruling exists to prevent.
 *
 *  ⚠ IT TAKES HER REAL AGE IN WHOLE YEARS (`kidAgeYears`), never the ITF band's – the one-clock
 *  ruling of 09.08. A December girl is 18 for the last three weeks of the season her band turned 19
 *  in, and paying her the nineteen-year-old's share in those weeks would be the same defect the
 *  School tile had before it started reading her birthday.
 *
 *  Pure integer arithmetic on a persisted-nowhere input: no draw, no state, no schema. */
export function kidPrizeShareBps(ageYears: number, pausedYears = 0): number {
  const { fromAgeYears, startBps, stepBps, capBps } = ECONOMY.kidShare
  if (ageYears < fromAgeYears) return startBps
  // Total: a paused count larger than the birthdays she has had cannot happen – it is derived from a
  // span inside her own life – but a poked save must floor at `startBps` rather than go below it.
  const steps = Math.max(0, Math.floor(ageYears) - fromAgeYears - Math.max(0, Math.floor(pausedYears)))
  return Math.min(capBps, startBps + steps * stepBps)
}

/** Her cut of one cheque, in whole cents – `kidPrizeShareBps` applied and rounded ONCE.
 *
 *  ⚠ THE FAMILY GETS `prizeCents - kidPrizeShareCents(...)`, computed by subtraction rather than by a
 *  second rounding, so the two halves add up to the cheque exactly. A pair of independent
 *  `Math.round`s loses or invents a cent on half the finishes, and this money is booked into two
 *  different balances that a player can add up on screen. */
export function kidPrizeShareCents(prizeCents: number, ageYears: number, pausedYears = 0): number {
  return Math.round((prizeCents * kidPrizeShareBps(ageYears, pausedYears)) / 10_000)
}

/** ⭐⭐ ROUND-24 – WHAT A FINISH PAYS THE STAFF, in basis points. ONE mechanism, two takers (the
 *  coach and the masseur), because two independent copies of "what does a finish pay" is this
 *  repo's own recurring disease – two surfaces asking different functions about one question.
 *
 *  ⭐⭐⭐ ROUND 42 #41 – AND THE THIRD RUNG IS NOW DATA. It used to `return 0` below a final, which
 *  hard-wired round 24's «за победы или 2е места» into the FUNCTION; his 15.09 ruling («10%
 *  безусловных отчислений с любых призовых, независимо от глубины прохода», on his own research)
 *  needed that road open, and a branch is not a road. So the tail reads `everyBps` off the object,
 *  the coach's three numbers are all 1000, and the masseur's `everyBps` is 0 – round 24's exact
 *  behaviour, now spelled as a rate rather than as an absence. The taker whose seat this function
 *  cannot see, the psychologist, is still not in `ECONOMY.staffShare` at all (O3, ruled 13.09).
 *
 *  `finishIdx` is the finish index `finalizeTournament` already holds (0 = champion, 1 = finalist).
 *  ⚠ ALL SIX NUMBERS LIVE IN `ECONOMY.staffShare`; this reads them and nothing else, so a retune –
 *  including the masseur's open question – moves the whole game and this function does not change. */
export function staffResultShareBps(role: 'coach' | 'masseur', finishIdx: number): number {
  const rates = ECONOMY.staffShare[role]
  return finishIdx === 0 ? rates.titleBps : finishIdx === 1 ? rates.finalBps : rates.everyBps
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
