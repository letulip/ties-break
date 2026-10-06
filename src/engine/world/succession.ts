// SUCCESSION S2a – THE PURE READER OF A FINISHED CAREER (docs/specs/succession-2026-10.md §1, §3, §4).
//
// `legacyInputOf(world)` reads ONE finished generation-1 world and produces what generation 2 is
// created FROM: who the mother was, how her story ended, what the family still owned, when the
// daughter is born, and which book she inherits. It is INPUT DATA at creation, the prologue's choices
// being the precedent (§5): the finished save is read here and never written, and after creation the
// new world owes the old one nothing.
//
// ⚠⚠ THE WORKER HAS NO CONSUMER OF IT ON THIS TREE. S2a wrote the reader; S2b added `createLegacyWorld` at the
// foot of this file – generation 2's creation, the reader's first consumer. Nothing in `createWorld`, the
// worker or the snapshot imports this module (the door and the worker command are S2c), so a career that
// never touches the door behaves byte for byte as before. It is deliberately NOT on the `engine/world`
// barrel – the barrel is a frozen surface (A-03), and a symbol born here is imported from its owning module.
//
// ⚠⚠ IT EXTENDS THE DOOR THAT EXISTS, IT IS NOT A SECOND ONE. `dynastyHandoverOf` (world/endings.ts) is
// wave 10's inheritance block and already answers «who was she and what did she win» – her name, her
// PRO-table best, her Slam shelf, the kind her ending latched. Those fields are READ OFF THAT BLOCK
// rather than re-derived, because a second spelling of «what is her peak» is how an epilogue and a
// handover come to quote two numbers (the round 46 #10 defect class, one file over). What this module
// adds is only what the block does not carry: the money's multiplier, the owned house and car, the
// daughter's birth year and the book.
//
// ⚠ PURE, ZERO MAIN DRAWS, NO CLOCK. Every line is a question asked of records the world already
// keeps. `assembleAlbum` is the one callee with randomness and it draws from its own purpose-scoped
// `seed:album:flavour:*` sub-stream, re-derived at the call site and persisting nothing – so two calls
// on one world are deep-equal and the world is byte-identical after (the unit suite pins both).
//
// ⚠ IT MUST NOT THROW ON ANY WORLD. A career with no house, no car, no child, no title and no latched
// ending at all is a legal input: every missing piece becomes a null or a default, and the default
// for the money is the FLOOR (1.0 – an ordinary start), never a guess upward.
import { weekYear } from '../../shared/dates'
import { DEFAULT_PROFILE, profileShapeError } from '../../shared/protocol'
import type { AlbumBook, DynastyHandover, FamilyBackground, OwnedAsset, PlayerProfile, PrologueHandover } from '../../shared/protocol'
import { prologueFundsOnBaseCents } from '../economy'
import { START_AGE_YEARS } from './age'
import { assembleAlbum } from './albumBook'
import { assetEntryPriceCents, assetWorthCents, deliveredAssets, shopItem } from './assets'
import { createWorld, STARTING_FUNDS_CENTS } from './create'
import { dynastyHandoverOf } from './endings'
import type { WorldState } from './state'

// --- §4 the ending multiplier --------------------------------------------------------------------

/** ⭐⭐ §4's FOUR ROWS, BY NAME, lowest first. The spec's table, verbatim (docs/specs/succession-2026-10.md §4):
 *
 *  «Мультипликатор на начальные деньги в зависимости от того, как закончилась предыдущая карьера».
 *
 *      | generation-1 ending                                  | starting money |
 *      | held a Slam or №1, farewell ending                   | 3.0 × B        |
 *      | a solid pro career (top-100 reached)                 | 2.0 × B        |
 *      | the career faded before the top                      | 1.3 × B        |
 *      | early/forced endings                                 | 1.0 × B        |
 *
 *  ⭐⭐⭐ AMENDED 06.10 (W1, THE OWNER'S RULING 11): THE TABLE'S ENDING QUALIFIERS ARE SUPERSEDED. «farewell ending» in row 1 and «early/forced
 *  endings» in row 4 are gone – the four rows are ACHIEVEMENT alone (see `legacyBandOf`), and how the career ended no longer caps the money.
 *
 *  B is the ordinary start budget and is S2b's to multiply in: this module only names the band and the
 *  multiplier. The order of the array IS the order of the money, lowest first, which the unit suite holds as a property. */
export const LEGACY_BANDS = ['early', 'faded', 'solid', 'held'] as const
export type LegacyBand = (typeof LEGACY_BANDS)[number]

/** ⭐⭐⭐ THE ONE TABLE OF THE MULTIPLIER – §4's numbers, and the only place they are written. «The
 *  corridor's intent: a generation-2 start is never POORER than an ordinary one and never so rich that
 *  the junior-years budget tension disappears – the pressure of money is the game, so the cap stays low
 *  (around 3×).» Every value is therefore in [1.0, 3.0], which the unit suite holds as a property and
 *  not only as four literals.
 *
 *  ⚠ A SKETCH BY THE SPEC'S OWN WORD («exact thresholds and values are the build wave's bench work,
 *  predicted vs measured»). The bench is S2b's, once a creation exists to measure; this constant is the
 *  seat the measured values land in and nothing else moves when they do. */
export const LEGACY_SAVINGS_MULTIPLIER: Record<LegacyBand, number> = {
  held: 3.0,
  solid: 2.0,
  faded: 1.3,
  early: 1.0,
}

/** §4 row 2's bar: «top-100 reached», on the PRO table. `bestRankOn(world, 'wta')` is the reader and it
 *  answers `null` for a career that never touched that table, so a junior #3 is not a solid pro – the
 *  architect's 22.09 review, which `dynastyHandoverOf` carries and this reads. */
export const LEGACY_SOLID_RANK = 100

/** ⭐⭐⭐ THE BAND A CAREER'S MONEY FALLS IN – HER RECORD AND NOTHING ELSE. §4's rows, read off the two numbers the dynasty block already carries
 *  (`motherCareer.bestRank`, `.slams`), so the band and the block cannot disagree about her peak:
 *
 *    held   a Slam title, or the best PRO rank was №1 – «held a Slam or №1»
 *    solid  the pro table's best is inside the top-100 – «top-100 reached»
 *    faded  she was ranked on the pro table and never reached the top-100 – «faded before the top»
 *    early  she never touched the pro table at all – there is no pro career to pay out
 *
 *  ⭐⭐⭐ THE ENDING KIND NO LONGER CAPS IT (06.10, THE OWNER'S RULING 11 – W1). S2a took the LOWER of her record and a ceiling per ending kind
 *  (`LEGACY_ENDING_CEILING`, a total record keyed on every ending kind): an injury or a bankruptcy priced even an injured top-100 career at 1.0
 *  and a quiet fade stopped at 2.0 whatever she had won. He read the consequence off an injury and asked the question the table could not answer:
 *  «ну если у нее на момент травмы на счету было много денег, то почему 1.0? я не вижу связи здесь особой» – what she had when the story stopped
 *  is what she had, and HOW it stopped is no reason to take it away. So the table is DELETED rather than emptied: no ending kind appears in this
 *  function, and a TENTH ending needs no pricing here – the compiler's total-record reminder is back to the four records that are about WORDS
 *  (`ENDING_TITLE`, `ENDING_BLURB`, `EMOTION_BY_ENDING`, `ALBUM_CLOSING_FAMILY`, as `CareerEndingType`'s own note counts them).
 *
 *  ⚠ A WORLD THAT NEVER LATCHED AN ENDING IS READ BY ITS RECORD TOO. The old rule («an unknown kind reads early, the floor») existed so that a
 *  missing fact could not guess upward; with no kind in the arithmetic nothing is missing – a Slam on the shelf is a Slam – and what is absent still
 *  reads the floor: no pro-table presence is `early`, 1.0, and the reader never throws. Exported pure and taking plain facts, so the whole table is
 *  testable without walking a career. */
export function legacyBandOf(bestRank: number | null, slams: number): LegacyBand {
  if (slams >= 1 || bestRank === 1) return 'held'
  if (bestRank === null) return 'early'
  return bestRank <= LEGACY_SOLID_RANK ? 'solid' : 'faded'
}

// --- the daughter ---------------------------------------------------------------------------------

/** ⭐⭐ THE EPILOGUE'S «A DAUGHTER CAME LATER», in years after the career stopped (the architect's
 *  brief, S2a): the birth year a world with NO recorded child synthesizes. A named constant so the two
 *  sources of `daughterBirthYear` are visibly one decision in two arms and not a stray `+ 2`. */
export const LEGACY_DAUGHTER_LAG_YEARS = 2

/** ⭐⭐ THE DAUGHTER'S BIRTH YEAR, FROM ONE OF TWO SOURCES – and the save tells them apart with one field.
 *
 *   (a) A REAL CHILD: `world.children` holds a row with `sex === 'girl'` (the birth mechanic writes
 *       `{ bornWeek, sex }` and nothing else, `ChildRecord`). Her year is her ACTUAL birth week's,
 *       through the one calendar with the world's own `startYear` – S1's parameterised dates – so a
 *       career that began in 2040 does not answer in 2031's years. ⚠ THE FIRST GIRL, which is the first
 *       row today: the wizard already reads `childBirthdays[0]`, and rows are appended in birth order.
 *       A boy is skipped on purpose – the roster is a scaffold (20.09, «пока будут только девочки»)
 *       and the heiress is a daughter.
 *   (b) NO CHILD (an empty `children`, or boys only): the epilogue's «a daughter came later» –
 *       the year the story stopped plus `LEGACY_DAUGHTER_LAG_YEARS`. The ending's own week, and
 *       `world.week` for a world that never latched one (the dynasty block's own fallback).
 *
 *  ⚠ THE FIELD THAT DISTINGUISHES THEM IS `world.children`, the same one `wasThereAChild` – the ONE
 *  predicate the door's two texts fork on – reads. A second spelling of «was there a child» would be a
 *  second answer to a question with one true answer. */
function daughterBirthYearOf(world: WorldState, endedWeek: number): number {
  const daughter = world.children.find((child) => child.sex === 'girl')
  if (daughter) return weekYear(daughter.bornWeek, world.startYear)
  return weekYear(endedWeek, world.startYear) + LEGACY_DAUGHTER_LAG_YEARS
}

// --- the house and the car -----------------------------------------------------------------------

/** The best DELIVERED holding of one shelf family, by id – or null when the family owns none.
 *
 *  ⚠ «BEST» IS THE HIGHER RUNG, AND THE CATALOGUE'S OWN PRICE IS THE LADDER: `entryCents` rises up
 *  every house and car rung, so the order is the shelf's and not a number this file invented. Ties
 *  cannot occur between rungs; the value at the end and then the purchase order (`deliveredAssets`
 *  lists oldest first) keep the answer deterministic regardless.
 *  ⚠ DELIVERED ONLY – `deliveredAssets` is the one predicate, «a contract is not a house»: a stage
 *  still under construction when the career stopped is not something the family owned. */
function bestOwnedOf(world: WorldState, family: 'house' | 'car'): string | null {
  let best: { id: string; entryCents: number; valueCents: number } | null = null
  for (const { owned, item } of deliveredAssets(world)) {
    if (item.family !== family) continue
    const better =
      best === null ||
      item.entryCents > best.entryCents ||
      (item.entryCents === best.entryCents && owned.valueCents > best.valueCents)
    if (better) best = { id: owned.id, entryCents: item.entryCents, valueCents: owned.valueCents }
  }
  return best === null ? null : best.id
}

// --- the reader ----------------------------------------------------------------------------------

/** ⭐⭐⭐ THE GENERATION-2 CREATION INPUT, as read off a finished career. Every field is a fact the
 *  finished world already holds; none is new state, and none of it is persisted by this module.
 *
 *  `endingKind` is typed `string` for the dynasty block's own reason: the empty string is the real
 *  value for a world with no latched ending, and the block it is read from says so. It is
 *  `CareerEndingType | ''` in every world this build can produce. */
export interface LegacyInput {
  /** the mother's given name – the kid's first name in the finished career. */
  motherName: string
  /** her best rank on the PRO table, or null when she never touched it (a junior rank is not a pro
   *  rank – `dynastyHandoverOf`'s rule, read here, not restated). */
  motherPeakRank: number | null
  /** Slam titles on her shelf. */
  motherSlamTitles: number
  /** the family name – `profile.kidLastName`, the one the profile's validator itself calls «a family
   *  name». Generation 1's surname carries (§1.4). */
  surname: string
  /** the kind her ending latched (`CareerEndingType`), or '' when it never did. */
  endingKind: string
  /** §4's multiplier on the ordinary start budget: 1.0 to 3.0. S2b multiplies; this only reads. */
  savingsMultiplier: number
  /** the best house owned and delivered at the end – a catalogue rung id – or null. */
  houseId: string | null
  /** the best car owned and delivered at the end, or null. */
  carId: string | null
  /** the calendar year the daughter is born in: a real child's, or the epilogue's synthesized one.
   *  See `daughterBirthYearOf`. */
  daughterBirthYear: number
  /** ⭐⭐ THE HEIRLOOM, AS THE ALBUM MODULE ASSEMBLES IT: the finished `AlbumBook`, whole.
   *
   *  ⚠ THE BOOK AND NOT THE MILESTONE LEDGER, AND THE REASONS ARE MEASURED. (1) §5: «if [the old save]
   *  is deleted later, the running generation-2 career keeps everything it copied» – generation 2 has
   *  no generation-1 world to re-assemble from, so a slice of the album's INPUTS would be useless to
   *  it; only the OUTPUT travels. (2) The book reads far more than `milestones` – title, final, season,
   *  body, once, asset, rare and closer candidate families, the prologue trace and the dynasty line –
   *  so «the ledger slice the album reads» is not a smaller thing than the album. (3) The book is
   *  already small and already plain data: 1 to 9 KB of JSON over fourteen walked careers (two to
   *  twelve sheets), and it survives a JSON round trip strictly equal. That is the spec's own
   *  sentence, «it is already a self-contained structure; it travels as one blob», checked against the
   *  structure. No new format is invented. */
  heirloomAlbum: AlbumBook
}

export function legacyInputOf(world: WorldState): LegacyInput {
  // ⭐ ONE READ OF THE DYNASTY BLOCK carries the mother's name, her pro-table peak, her Slam shelf, the
  // week the story stopped and the kind it stopped as – the epilogue and this reader quote one cabinet.
  const handover = dynastyHandoverOf(world)
  const career = handover.motherCareer
  const band = legacyBandOf(career.bestRank, career.slams)
  return {
    motherName: handover.motherName.first,
    motherPeakRank: career.bestRank,
    motherSlamTitles: career.slams,
    surname: handover.motherName.last,
    endingKind: career.endingKind,
    savingsMultiplier: LEGACY_SAVINGS_MULTIPLIER[band],
    houseId: bestOwnedOf(world, 'house'),
    carId: bestOwnedOf(world, 'car'),
    daughterBirthYear: daughterBirthYearOf(world, career.endedWeek),
    heirloomAlbum: assembleAlbum(world),
  }
}

// --- the generation-2 creation (S2b) --------------------------------------------------------------

/** ⭐⭐ THE MULTIPLIER'S CORRIDOR IS THE TABLE'S OWN, not a second pair of literals: `createLegacyWorld` refuses an input whose
 *  multiplier no finished career can produce, and «can produce» is what `LEGACY_SAVINGS_MULTIPLIER` says – so a retuned table (§4 calls
 *  its values a sketch) moves the guard with it instead of leaving a stale 3.0 behind. §4's two corridor-intent rules, «never POORER
 *  than an ordinary start» and «never so rich that the junior-years budget tension disappears», are the floor and the ceiling of it. */
const LEGACY_MULTIPLIER_FLOOR = Math.min(...Object.values(LEGACY_SAVINGS_MULTIPLIER))
const LEGACY_MULTIPLIER_CEILING = Math.max(...Object.values(LEGACY_SAVINGS_MULTIPLIER))

/** ⭐ ENGINE-SIDE RE-VALIDATION OF WHAT ONLY THIS FUNCTION KNOWS (invariant 1): the multiplier's corridor, and which rungs are a house
 *  and a car. The profile's law is `profileShapeError`'s and the calendar's is `createWorld`'s – neither is restated here. A thrown
 *  `RangeError` and not a clamp, `createWorld`'s own idiom for `startYear`: a guess on a missing fact is the one mistake this module's
 *  header forbids. */
function refuseIllegalLegacy(legacy: LegacyInput): void {
  const m = legacy.savingsMultiplier
  if (!Number.isFinite(m) || m < LEGACY_MULTIPLIER_FLOOR || m > LEGACY_MULTIPLIER_CEILING) {
    throw new RangeError(
      `createLegacyWorld: savingsMultiplier must lie between ${LEGACY_MULTIPLIER_FLOOR} and ${LEGACY_MULTIPLIER_CEILING}, got ${m}`,
    )
  }
  for (const [family, id] of [['house', legacy.houseId], ['car', legacy.carId]] as const) {
    if (id !== null && shopItem(id)?.family !== family) {
      throw new RangeError(`createLegacyWorld: ${family}Id must name a ${family} on the shelf, got ${id}`)
    }
  }
}

/** ⭐⭐ A HOLDING THAT ARRIVES OWNED: the row `buyAsset` writes for a car or a house (the plain branch of world/shop.ts), minus the
 *  purchase. NO FUNDS MOVE, there is no listing, no feed line and no milestone – the family bought nothing, and a «bought» mark for a
 *  house the mother left would be a sentence nobody lived.
 *
 *  ⚠ `paidCents` IS THE WEEK-0 QUOTE OF THE GENERATION-2 SHELF (`assetEntryPriceCents`, the one function the shop's own till reads), NOT
 *  the figure generation 1 paid and not an aged one. A house's quote indexes from the CAREER'S first week (round 46 #3), so at week 0 it
 *  is the catalogue figure, and every later resale, upkeep and appreciation calculation – all of which read `paidCents` and
 *  `boughtWeek` – starts from a market price on a clock that starts now. A row claiming twenty years of age would need a negative
 *  `boughtWeek` that the rest of the shop was never written for.
 *  ⚠ SPEC §3 SAYS «AT THEIR AGED VALUE»; this is the one place the build departs from that sentence, on the architect's S2b brief, and it
 *  is the thing to rule on if the owner wants a visibly older car.
 *  ⚠ `entries` IS EMPTY – the v77 -> v78 migration's own value for «no purchase marks recorded». The list is «what the family DID», and
 *  nothing left the wallet. */
function arriveOwned(world: WorldState, id: string): void {
  const item = shopItem(id)
  if (item === undefined) throw new RangeError(`createLegacyWorld: nothing on the shelf is called ${id}`)
  const paidCents = assetEntryPriceCents(world, item)
  const row: OwnedAsset = { id: item.id, boughtWeek: world.week, paidCents, valueCents: paidCents, entries: [] }
  // priced by the same function `revalueAssets` asks next week, so the row opens at exactly what was «paid», to the cent
  row.valueCents = assetWorthCents(world, row, item)
  world.assets.push(row)
}

/** ⭐⭐⭐ S2c – THE ARCHITECT'S ORIGINS RULING (S2b finding 1): A LEGACY CREATION IGNORES THE ORIGINS CARD, and this is the band it sets in its
 *  place. The family's circumstance is §4's multiplier and nothing else – the owner's «просто новая карьера с небольшими бенефитами в начале» –
 *  so the door forces the ONE field every origin is read from, `profile.background`, to the ordinary family. That is what keeps a wealthy-origin
 *  daughter of a held champion from stacking 3.0 on $120,000.
 *
 *  ⚠ WHAT THAT FIELD CONTROLS IS WIDER THAN THE OPENING WALLET, and forcing it moves all of it: the wallet (`STARTING_FUNDS_CENTS`), the coach
 *  rung she arrives on (`prologueCoachTier`), the parents' weekly money, the coach, vacation, practice, kit and treatment price corridors, the
 *  season's build and a college's aid read. It is one field with readers across the engine, so «only the budget band» is not a thing the engine
 *  can express and the narrowest TRUE version is the field itself. What survives is everything that is not the field: the nine years as lived
 *  (cards, costs, picks and the trace they leave), her name, birthday and country, the line's generation and temperament, and the weight ask.
 *
 *  ⚠ THE DOOR APPLIES IT AND `createLegacyWorld` DOES NOT. That function takes the profile's background as given – S2b's twelve-cell arm
 *  measures all three – so the ruling is one line in the one place that is the door (the worker's `new`), not a second spelling inside the
 *  builder. */
export const LEGACY_FAMILY_BACKGROUND: FamilyBackground = 'middle'

/** ⭐⭐⭐ S2c – WHAT RIDES BESIDE THE LEGACY WHEN THE DOOR CREATES THE CAREER: the three arguments `createWorld` takes after the career id and the
 *  ordinary `new` command already carries, each optional and each handed through untouched.
 *
 *    `prologue`       the nine years she just lived – skills, style, the rung, the trace, and the wallet's deduction (W1, ruling 12: `spentCents`
 *                     moves the multiplied reserve by the share it always moved an ordinary one). WITHOUT IT the childhood the player walked
 *                     would be discarded at the last card; with it a legacy career is the same childhood plus the inheritance.
 *    `dynasty`        wave 10's line record (generation, ancestor root, the mother's temperament and career), which `createWorld` persists as
 *                     `world.dynasty`. ⚠ THIS IS THE DECISION S2b LEFT TO THE DOOR («the door decides if that ever changes»), AND IT IS YES:
 *                     that record is what makes a generation-2 career a link in the chain – her own ending reads `generation` and `ancestorSeed`
 *                     to build her daughter's seed, and §7's temperament lean reads the mother's – so a door that dropped it would break the line
 *                     to add the money. The two blocks are written in the same instant off the same finished world (`legacyInputOf` reads
 *                     `dynastyHandoverOf`), so they cannot disagree at creation. `createWorld` also forces `profile.background` to the
 *                     handover's own `background`, so the door passes it already set to `LEGACY_FAMILY_BACKGROUND`.
 *    `weightEnabled`  the creation ask's answer. */
export interface LegacyCreation {
  prologue?: PrologueHandover
  dynasty?: DynastyHandover
  weightEnabled?: boolean
}

/** ⭐⭐⭐ S2b – THE GENERATION-2 CREATION: her career, built FROM what the finished one left (docs/specs/succession-2026-10.md §1, §3-§5).
 *
 *  ONE call to `createWorld` and four things laid over it, each a fact the input already holds and none of them a draw – so the new
 *  world has its own fresh `rngMain`, the very stream a plain `createWorld` of the same seed and year has, and «same seed + same legacy
 *  blob = the same generation-2 world, byte for byte» (§5) holds by construction. The finished save is never touched: the input is
 *  data, and the album is COPIED in (`structuredClone`) so the running career keeps it with no live link.
 *
 *    THE CALENDAR  `startYear = daughterBirthYear + START_AGE_YEARS`. `START_AGE_YEARS` (14, world/age.ts) is the age every career opens
 *                  a girl at – the childhood prologue's nine years (5 to 13) end exactly there, `CHILDHOOD.endAge` being that same
 *                  constant – and `kidBirthYear(startYear)` is its inverse, so she is born in the year the legacy says.
 *    THE NAME      her GIVEN name is the caller's (the door takes it from the identity card, B6's `dynastyOpeningName`); the family name
 *                  is generation 1's (§1.4). `profile` is the base the rest of her comes from, the game's default girl unless the door
 *                  passes one.
 *    THE MONEY     B x multiplier, ONE multiply, whole cents – and, when the nine childhood years ride along, the childhood's DEDUCTION on that
 *                  (below, W1). B is `STARTING_FUNDS_CENTS` for the profile's background – what `createWorld` seeds today. The wallet goes to
 *                  `createWorld` as the opening wallet (its eighth argument – the feed's first line states it) and into
 *                  `legacy.savingsSliceCents` as the amount GRANTED, so a later screen quotes the number the career really got and not a
 *                  recomputation off a table that may have been retuned since.
 *    THE ASSETS    the house and the car arrive owned (`arriveOwned`), each null-safe, house first.
 *    THE BLOCK     `world.legacy`, persisted, in the shape S1 declared – nothing is added to it.
 *
 *  ⭐⭐⭐ W1 (06.10, THE OWNER'S RULING 12) – THE CHILDHOOD DEDUCTION RETURNS. «мне кажется нормальной логика вычета, не вижу проблем использовать ее
 *  и здесь, отличается только начальная сумма для сида по сути, ну и дом, машина и некоторые сбережения на счете». S2b's grant REPLACED the
 *  prologue's own wallet line, so on a legacy career the nine cards a parent walked stopped costing anything – the one thing that makes those
 *  choices money. It is back, and it is the SAME arithmetic and not a second spelling: `prologueFundsOnBaseCents` (engine/economy.ts, the one
 *  function behind `prologueFundsCents` too), handed the MULTIPLIED base –
 *
 *      wallet = round( B x m x (1 + reserveSwingShare x moved) ),    moved = clamp( (referenceSpend - spent) / spendSwing, -1, +1 )
 *
 *  – so the childhood moves the SHARE of the reserve it always moved (a cheap one +20 %, a dear one -20 %, the reference one nothing) and the
 *  reserve is the multiplied one. ⚠ A SHARE OF THE MULTIPLIED BASE AND NOT A FLAT SUM, because «only the starting sum differs» says the logic is
 *  unchanged and the logic is a share (the ordinary prologue's own ruling: «the player chooses where the family is FROM, not a sum»). The
 *  consequence in a number: at the held band a childhood is worth +-15,000 on 75,000, where a flat reading would be +-5,000. ⚠ NO PROLOGUE, NO
 *  DEDUCTION – the wizard's skip walks no nine years, there is nothing to deduct, and the wallet is B x m rounded once (S2b's figure).
 *
 *  ⚠ `savingsSliceCents` IS THE WHOLE OPENING WALLET – after the deduction when a prologue rode along – the architect's S2b brief, «write the
 *  result», and not the extra over an ordinary start. A display that wants «what her mother's career added» compares it with the ordinary start of
 *  the SAME childhood (`prologueFundsCents(profile.background, spentCents)`, or `STARTING_FUNDS_CENTS[profile.background]` with no prologue):
 *  subtracting B alone stopped being right the day the deduction returned.
 *  ⚠ NO `dynasty` HANDOVER IS PASSED to `createWorld`: wave 10's block and this one both carry «who the mother was», and a world holding
 *  both would hold two spellings of one fact. By default none is, and the input carries none; S2c's door hands one through `creation.dynasty` (see `LegacyCreation` for why it must).
 *  ⚠ `profileShapeError` JUDGES THE FINAL PROFILE, so the creation cap on names binds an INHERITED surname too: a family name longer than
 *  `PROFILE_NAME_MAX_CHARS`, possible only on a career opened before 06.09, is refused rather than carried. The door should pre-check, or
 *  the cap should be waived for inherited names – S2c's call. */
export function createLegacyWorld(
  legacy: LegacyInput,
  seed: string,
  daughterName: string,
  profile: PlayerProfile = DEFAULT_PROFILE,
  careerId?: string,
  creation: LegacyCreation = {},
): WorldState {
  refuseIllegalLegacy(legacy)
  const daughter: PlayerProfile = { ...profile, kidName: daughterName, kidLastName: legacy.surname }
  const illegalProfile = profileShapeError(daughter)
  if (illegalProfile !== null) throw new RangeError(`createLegacyWorld: ${illegalProfile}`)

  const startYear = legacy.daughterBirthYear + START_AGE_YEARS
  // ⭐ S2c: THE BAND `createWorld` WILL APPLY – the handover's own answer when one rides along (create.ts: `if (dynasty) profile = { ...profile,
  // background: dynasty.background }`) and the profile's otherwise. The grant is priced against THAT, so the wallet and the world's
  // `profile.background` can never name two families. With no `creation.dynasty` it is `daughter.background`, exactly S2b's line.
  const background = creation.dynasty?.background ?? daughter.background
  // ⭐⭐ W1 (06.10, ruling 12): THE WALLET IS THE PROLOGUE'S OWN DEDUCTION ON THE MULTIPLIED BASE when the nine years ride along – the arithmetic
  // `createWorld` applies to an ordinary prologue career, on a base that is B x m instead of B – and B x m rounded once when they do not.
  // `createWorld` is handed the finished figure (its eighth argument replaces the prologue's own wallet line there), so there is ONE wallet.
  const multipliedBaseCents = STARTING_FUNDS_CENTS[background] * legacy.savingsMultiplier
  const grantCents = creation.prologue
    ? prologueFundsOnBaseCents(multipliedBaseCents, creation.prologue.spentCents)
    : Math.round(multipliedBaseCents)
  const world = createWorld(seed, daughter, careerId, creation.prologue, creation.dynasty, creation.weightEnabled, startYear, grantCents)

  world.legacy = {
    motherName: legacy.motherName,
    motherPeakRank: legacy.motherPeakRank,
    motherSlamTitles: legacy.motherSlamTitles,
    surname: legacy.surname,
    endingKind: legacy.endingKind,
    savingsSliceCents: grantCents,
    heirloomAlbum: structuredClone(legacy.heirloomAlbum),
  }
  if (legacy.houseId !== null) arriveOwned(world, legacy.houseId)
  if (legacy.carId !== null) arriveOwned(world, legacy.carId)
  return world
}
