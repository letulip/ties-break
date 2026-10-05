// SUCCESSION S2a – THE PURE READER OF A FINISHED CAREER (docs/specs/succession-2026-10.md §1, §3, §4).
//
// `legacyInputOf(world)` reads ONE finished generation-1 world and produces what generation 2 is
// created FROM: who the mother was, how her story ended, what the family still owned, when the
// daughter is born, and which book she inherits. It is INPUT DATA at creation, the prologue's choices
// being the precedent (§5): the finished save is read here and never written, and after creation the
// new world owes the old one nothing.
//
// ⚠⚠ IT HAS NO CONSUMER ON THIS TREE. S2b wires creation; this module only READS and CLASSIFIES, so
// nothing in `createWorld`, the worker or the snapshot imports it and a career that never touches the
// door behaves byte for byte as before. It is deliberately NOT on the `engine/world` barrel – the
// barrel is a frozen surface (A-03), and a symbol born here is imported from its owning module.
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
import type { AlbumBook, CareerEndingType } from '../../shared/protocol'
import { assembleAlbum } from './albumBook'
import { deliveredAssets } from './assets'
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
 *  B is the ordinary start budget and is S2b's to multiply in: this module only names the band and the
 *  multiplier. The order of the array IS the order of the money, which is what `legacyBandOf` leans on
 *  when it takes the lower of two answers. */
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

/** ⭐⭐ WHAT EACH ENDING KIND MAY REACH – THE CEILING, kind by kind, over all nine. A TOTAL `Record`
 *  over the union, for the reason `ENDING_TITLE`, `ENDING_BLURB`, `EMOTION_BY_ENDING` and
 *  `ALBUM_CLOSING_FAMILY` are: a TENTH ending goes red here until somebody decides what its money is,
 *  which is the compiler doing the remembering.
 *
 *  The facts of the career (`legacyBandOf`) say how far SHE got; this table says how far the ENDING lets
 *  the money follow. The answer is the lower of the two – which is §4's own shape, since its rows mix
 *  achievement (a Slam, the top-100) with circumstance («farewell», «early/forced»).
 *
 *    peak       held    she left AT the top – §4 row 1's «farewell after a held №1», the case it names.
 *    natural    held    she played until she was done: a farewell on her own terms, so a champion who
 *                       ran her course is not priced below one who left early at the top.
 *    family     held    a decision about something else, «a life completed rather than a career
 *                       failed» (the album's own ruling for this kind) – a farewell by choice.
 *    plateau    solid   «she had gone as far as she was going» – the QUIET FADE the spec sets apart from
 *                       the farewell («the farewell after a held №1 and the quiet fade are different
 *                       endings»). A solid pro at most, whatever she once won.
 *    fall       solid   the same, after a collapse.
 *    injury     early   FORCED – §4 row 4 names it. ⚠ THE LITERAL READING, AND A DECISION FOR THE
 *                       ARCHITECT: it prices an injured top-100 career at 1.0. A one-word edit here
 *                       (`solid`) is the whole change if the owner wants the achievement to follow.
 *    bankruptcy early   FORCED, and the money is by definition not there to pass on.
 *    stopped    early   «School ended and the next ladder wanted more than the family had» – EARLY.
 *    college    early   she left for a degree: humbler facts, the dynasty spec's own word. ⚠ Almost
 *                       never read through this row – a college latch resumes, and a graduate leaves no
 *                       latch at all (`dynastyBackgroundFloored`'s note) – but the table is total. */
export const LEGACY_ENDING_CEILING: Record<CareerEndingType, LegacyBand> = {
  peak: 'held',
  natural: 'held',
  family: 'held',
  plateau: 'solid',
  fall: 'solid',
  injury: 'early',
  bankruptcy: 'early',
  stopped: 'early',
  college: 'early',
}

/** ⭐ §4 ROW BY ROW, THE ACHIEVEMENT HALF: how far her own record got, before the ending's ceiling.
 *
 *    held   a Slam title, or the best PRO rank was №1 – «held a Slam or №1»
 *    solid  the pro table's best is inside the top-100 – «top-100 reached»
 *    faded  she was ranked on the pro table and never reached the top-100 – «faded before the top»
 *    early  she never touched the pro table at all – there is no pro career to pay out
 *
 *  ⚠ THE INPUTS ARE THE DYNASTY BLOCK'S OWN TWO NUMBERS (`motherCareer.bestRank`, `.slams`), so the
 *  band and the block cannot disagree about her peak. */
function achievedBandOf(bestRank: number | null, slams: number): LegacyBand {
  if (slams >= 1 || bestRank === 1) return 'held'
  if (bestRank === null) return 'early'
  return bestRank <= LEGACY_SOLID_RANK ? 'solid' : 'faded'
}

/** The band a career's money falls in: the LOWER of what she achieved and what her ending allows.
 *
 *  ⚠ AN UNKNOWN KIND – the empty string a world with no latched ending carries, or a kind a future wave
 *  adds before its table row – reads as `early`, the floor. A reader that guessed upward on a missing
 *  fact would hand a generation-2 start more money than anything on the page justifies. Exported pure
 *  and taking plain facts so the whole nine-by-four matrix is testable without walking a career. */
export function legacyBandOf(endingKind: string, bestRank: number | null, slams: number): LegacyBand {
  const ceiling = (LEGACY_ENDING_CEILING as Record<string, LegacyBand | undefined>)[endingKind] ?? 'early'
  const achieved = achievedBandOf(bestRank, slams)
  return LEGACY_BANDS.indexOf(achieved) <= LEGACY_BANDS.indexOf(ceiling) ? achieved : ceiling
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
  const band = legacyBandOf(career.endingKind, career.bestRank, career.slams)
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
