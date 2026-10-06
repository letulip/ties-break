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
import type { FamilyBackground, KitGrade } from '../shared/protocol'
// One module per block of `ECONOMY` (T7.3 of the principles fix), assembled below in the literal's own key order.
import { WEALTH_CORRIDOR } from './economy/wealthCorridor'
import { UNIFORM_CORRIDOR } from './economy/uniformCorridor'
import { startingFundsCents } from './economy/startingFundsCents'
import { prologue } from './economy/prologue'
import { parentIncomeCents } from './economy/parentIncomeCents'
import { incomeGrowthBand } from './economy/incomeGrowthBand'
import { coach } from './economy/coach'
import { travelBgFactor } from './economy/travelBgFactor'
import { chemistry } from './economy/chemistry'
import { sponsor } from './economy/sponsor'
import { sponsorship } from './economy/sponsorship'
import { gear } from './economy/gear'
import { equipment } from './economy/equipment'
import { kidShare } from './economy/kidShare'
import { staffShare } from './economy/staffShare'
import { managerCommission } from './economy/managerCommission'
import { advertising } from './economy/advertising'
import { fame } from './economy/fame'
import { business } from './economy/business'
import { development } from './economy/development'
import { summerBlock } from './economy/summerBlock'
import { school } from './economy/school'
import { academy } from './economy/academy'
import { condition } from './economy/condition'
import { spirit } from './economy/spirit'
import { bond } from './economy/bond'
import { life } from './economy/life'
import { wedding } from './economy/wedding'
import { divorce } from './economy/divorce'
import { motherhood } from './economy/motherhood'
import { dynasty } from './economy/dynasty'
import { weight } from './economy/weight'
import { availability } from './economy/availability'
import { entryCap } from './economy/entryCap'
import { mandatory } from './economy/mandatory'
import { physio } from './economy/physio'
import { masseur } from './economy/masseur'
import { psychologist } from './economy/psychologist'
import { form } from './economy/form'
import { sparring } from './economy/sparring'
import { spotlight } from './economy/spotlight'
import { vacation } from './economy/vacation'
import { practice } from './economy/practice'
import { shop } from './economy/shop'

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
  /** ⭐⭐ ROUND 46 #6 – THE INJURY BUFF THE OWNER'S OWN WEEK CARRIES, `buffFactor`'s twin for a package the
   *  shelf has made FREE. His 05.10 word: «Может для своей яхты тоже поставим -15% вероятности травмы?» –
   *  «тоже» = the Elite recovery programme's `buffFactor` 0.85 on this same sheet («injury risk −15% for 4
   *  weeks»), which the yacht row did not have.
   *
   *  ⚠ ON THE GRANTED WEEK ONLY, which is «своей» read literally: the charter every other family books
   *  keeps `buffFactor` (1 on the yacht row), so a career that owns no delivered yacht is byte-identical to
   *  before this field existed. Same pathway as every other rung – the booking's `recoveryBuff.factor` and
   *  the ONE post-draw multiply in `injuryTau` – only the SOURCE of the factor is ownership-aware, and
   *  `vacationBuffFactor` is the one function that says which: the booking and the sheet's «injury risk
   *  −N%» line both ask it, with the granted list in hand.
   *
   *  Optional rather than `1` everywhere, so the six rungs that never had one say so by silence. */
  grantedBuffFactor?: number
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

/** THE TUNING SURFACE, ASSEMBLED from one module per block under `economy/`, the keys in the order
 *  the literal always had (T7.3 of the principles fix).
 *
 *  ⚠ THE KEY ORDER AT EVERY DEPTH IS PART OF THE CONTRACT, not a layout choice:
 *  `tests/principles-t73-economy-identity.test.ts` pins `JSON.stringify(ECONOMY)` and the deep key-path
 *  list, so a reorder here or inside a block goes red instead of passing silently.
 *
 *  ⚠ THE BLOCKS ARE LEAVES: none may import a VALUE from this file – this module imports every block at
 *  load, so a value import back is a runtime cycle. The two corridor objects sit in
 *  `economy/wealthCorridor.ts` and `economy/uniformCorridor.ts` for exactly that reason. */
export const ECONOMY = {
  /** The canonical wealth-price corridor – see WEALTH_CORRIDOR above. */
  wealthCorridor: WEALTH_CORRIDOR,

  /** The corridor a tier that has left it is priced in: exactly 1.0, same roll. See UNIFORM_CORRIDOR. */
  uniformCorridor: UNIFORM_CORRIDOR,

  startingFundsCents,
  prologue,
  parentIncomeCents,
  incomeGrowthBand,
  coach,
  travelBgFactor,
  chemistry,
  sponsor,
  sponsorship,
  gear,
  equipment,
  kidShare,
  staffShare,
  managerCommission,
  advertising,
  fame,
  business,
  development,
  summerBlock,
  school,
  academy,
  condition,
  spirit,
  bond,
  life,
  wedding,
  divorce,
  motherhood,
  dynasty,
  weight,
  availability,
  entryCap,
  mandatory,
  physio,
  masseur,
  psychologist,
  form,
  sparring,
  spotlight,
  vacation,
  practice,
  shop,
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

/** ⭐⭐ ROUND 46 #6 – THE INJURY BUFF A BOOKED WEEK CARRIES, as ONE pure rule. `grantedIds` is the shelf's
 *  grant exactly as `vacationPriceCents` takes it (`Snapshot.shop.vacationIds` on a screen,
 *  `grantedVacationIds(world)` in the engine): a `freeOnceGranted` package that carries a
 *  `grantedBuffFactor` hands it over once the family has earned the week – the owner's own boat, not a
 *  charter. Every other package, granted or not, answers its `buffFactor`, so nothing but the yacht week
 *  can differ from the shipped table.
 *
 *  ⚠ THE DEFAULT IS THE CONSERVATIVE ARM, on `vacationPriceCents`' own argument: a caller that does not
 *  know about the shelf is told the factor every family gets, so a forgetful screen can only UNDERSTATE
 *  the buff, never promise one the booking will not pay – and the booking itself always passes the
 *  world's own list. Pure, zero draws. */
export function vacationBuffFactor(pkg: VacationPackage, grantedIds: readonly string[] = []): number {
  if (pkg.freeOnceGranted && pkg.grantedBuffFactor !== undefined && grantedIds.includes(pkg.id)) {
    return pkg.grantedBuffFactor
  }
  return pkg.buffFactor
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
