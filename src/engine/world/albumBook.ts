// THE ALBUM BOOK: the career's whole story, assembled on demand (docs/specs/the-album-2026-09.md).
//
// This is the spec's §8 step 1 – the engine half. Chapters from the lived bands plus the prologue's
// own trace (v84), representatives selected from ledgers the save never prunes, every frame resolved
// to a picture by the §4 ladder, the corpus's handwriting in her parent's voice, tickets and tags
// from real facts, and the arc on the closing sheet. The screens that render the book landed on this
// same branch first, against `src/components/album/albumWire.ts` – a declared stand-in for THIS
// module – so the shapes here are that contract satisfied, not a second design.
// `shared/protocol/album.ts` carries them, and since 19.09 it is the only declaration: the stand-in's
// importers are re-pointed at the protocol barrel and the file is deleted. It went home unchanged –
// the two shapes were identical to the field on the day they were joined.
//
// ⚠⚠ ON DEMAND, NEVER IN THE WEEKLY SNAPSHOT – his §8b ruling: «Сборка альбома – по требованию, не
// в недельном снимке». `assembleAlbum` is served by the worker's `album` query when the section
// opens; `toSnapshot` never calls it, so it costs every tick nothing.
//
// ⚠⚠ A PURE READ WITH ONE NAMED SUB-STREAM FAMILY. Nothing here mutates the world and nothing draws
// on MAIN: the only randomness is `seed:album:flavour:*` – the антураж (seat, gate, row, barcode,
// the fictional venue and club-patch names of §8b), his ruling 6 («антураж рисуем», generation «не
// принципиально») taken with the architect's «из сида, чтобы не мигал»: the same book reopens
// identical. The frozen MAIN capture (41550 / e6b0c709) cannot see this file.
//
// ⚠⚠ THE WORDS ARE THE CORPUS's, NEVER THIS FILE's. Every note, caption and line comes out of
// `ALBUM_CORPUS` / `ALBUM_ARC` (generated from docs/specs/album-corpus-2026-09.md – the owner's
// document, all drafts until his pass), selected by occasion id and her BIRTH temperament – the fog
// law is lifted for the album (spec ruling 8) and the voice bibles read birth alone. What this file
// adds in words is marked ⚠ DRAFT at each table: the five chapter headings (spec §9 – his), the
// image alts, and the ticket flavour vocabulary.
//
// ⚠ DEPENDENCY DIRECTION – `world/album.ts`'s own header, kept: `WorldState` is a TYPE-ONLY import,
// values come from sibling leaves and from `shared/`, and no art BUILDER is imported anywhere. The
// frame's `art` is a base-relative PATH the engine spells (the protocol field's own note says who
// prefixes `BASE_URL`), and `tests/albumBook.test.ts` sweeps every path the assembly can emit
// against the files on disk – the same ground truth `tests/portrait-bands.test.ts` holds the art
// layer's spelling to, which is what keeps the two spellings from drifting apart.
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../season/calendar'
import type { TierId } from '../season/types'
import { DEFAULT_START_YEAR, weekSpan } from '../../shared/dates'
import { paintedStemFor, portraitStage } from '../../shared/avatarEmotion'
import { finishedTheCourse } from '../../shared/avatarEmotion'
import type { PortraitEmotion } from '../../shared/avatarEmotion'
import type {
  AlbumBook,
  AlbumChapter,
  AlbumDoodle,
  AlbumFrame,
  AlbumLayout,
  AlbumNote,
  AlbumSheetModel,
  AlbumTag,
  AlbumClubPatch,
  AlbumFiller,
  AlbumTicket,
  AlbumTierStep,
  BuildLetterTerms,
  CareerEnding,
  CareerEndingType,
  CollegeYear,
  Milestone,
  PrologueTrace,
  TravelHomeMood,
  TravelHomeScene,
} from '../../shared/protocol'
import { FIRST_COURT_AGE } from '../../shared/protocol'
// ⚠ THE LEAF'S OWN NAMERS, AND NEVER A SECOND SPELLING OF THEM (the college scene, ruling C):
// `wonTheLeague` is the title fork, `leagueExitLabel` is the round's name, `COLLEGE_LEAGUE.label` is
// the competition's fictional one. `engine/collegeLeague.ts` is a leaf – no `WorldState`, no calendar –
// so this import keeps the album's dependency direction intact.
import { COLLEGE_LEAGUE, leagueExitLabel, wonTheLeague } from '../collegeLeague'
import { ENDINGS } from '../ending'
import { KID_ID } from './constants'
import { temperamentFor, type Temperament } from '../spirit'
import { pickInt, rngFromSeed } from '../rng'
// ⭐ L3-6 (10.10): the book's strings also leave this file as CopyRefs, beside the English (see `AlbumSheetModel.lineC` and the fields beside every string of the wire).
import { cp, type CopyRef } from '../../shared/i18n'
import { kidAgeAt } from './age'
import { isCappedProTier, isCappedTier } from './entryCaps'
import { finishLabel } from './labels'
import {
  ALBUM_ARC,
  ALBUM_CORPUS,
  type AlbumArcDirection,
  type AlbumBand,
  type AlbumHand,
  type AlbumOccasion,
} from './albumCorpus'
import type { WorldState } from '../world'

// =================================================================================================
// §1 THE MOOD TABLE – the whole of it, in one place (his ruling, 19.09, spec §7)
// =================================================================================================
//
// «настроение выводим из вехи (титул → радость, травма → восстановление, у нас их несколько
// разных, в т.ч. на week results)» – RULED, and the injury row carries his own sentence for why it
// is `rehab` and never `injury`: «альбом помнит, как она вставала, а не как падала». Nothing is
// stored – the mood is a function of the occasion, exactly as the ruling asks. Keyed on the CORPUS
// ids, total over them minus the four whose picture is never a band portrait (the closers and the
// wedding resolve to their own paintings at the ladder's top rung and carry a fallback row anyway).
//
// ⚠ THE PRECEDENT ROWS FOLLOW `MEMORY_EMOTION` (engine/diary/facts.ts) WHERE THE TWO SHARE A KIND:
// school and international are `norm` there for written-down reasons and are `norm` here for the
// same ones. Rows with no precedent – the prologue's four, the buys, the super-rares, the season
// variants – are the builder's picks, cheap to move, and none of them is a word on a screen.
export const ALBUM_MOOD: Record<string, PortraitEmotion> = {
  // ⭐ v86 – the heirloom (T6a). `norm` because the page is a box on a table and a girl going
  // through it: nothing has happened to HER yet, and a mood here would be the book telling her how to
  // feel about a career that is not hers.
  'the-line': 'norm',
  'first-court': 'happy',
  'first-tournament': 'serious',
  'first-win': 'happy',
  'first-cup': 'happy',
  'first-title': 'happy',
  'title-step-up': 'happy',
  'title-after-injury': 'happy',
  'title-last': 'serious',
  'first-final': 'serious',
  'final-lost': 'serious',
  'season-first': 'norm',
  'season-best': 'happy',
  /** ⭐ the climb back – a year better than the last one that is still short of her own best. It is
   *  `happy` and not `norm` for the reason the gate exists at all (his 20.09 blocker): a recovery
   *  is a thing that HAPPENED, and the face that reads «nothing moved» is the one the old
   *  `season-held` routing put on it. */
  'season-recovery': 'happy',
  'season-held': 'norm',
  'season-down': 'sad',
  /** RULED: the comeback, never the fall – «альбом помнит, как она вставала, а не как падала» */
  injury: 'rehab',
  'injury-return': 'rehab',
  'first-prize': 'happy',
  'first-international': 'norm',
  'break-even': 'happy',
  'school-done': 'norm',
  wedding: 'happy',
  // ⭐ wave 8b T6 (E2) – the row every non-closing occasion must have. ⚠ IT IS `'norm'` AND NOT
  // `'happy'`, and the reason is `MEMORY_EMOTION.birth`'s own: a birth week is the week the
  // postpartum mark lands, so a grin is the one face the same week's arithmetic contradicts.
  // ⚠ IT IS ALSO UNREACHED IN PRACTICE, and that is worth saying rather than leaving to be found:
  // the frame resolves through `MOMENT_FACE` at rung 1, so the birth's own painting wins before this
  // table is consulted. The row exists because the mood is ALSO the journey rung's input and because
  // the table's own law – a row for every non-closing occasion – is what stops a silent `'norm'`.
  birth: 'norm',
  'first-house': 'happy',
  brand: 'happy',
  'academy-land': 'serious',
  'academy-courts': 'serious',
  'academy-built': 'happy',
  'lifetime-sponsor': 'happy',
  'top-tier-title': 'happy',
  'years-at-the-top': 'happy',
  // ⭐ round 45 #5 – the first time at number one, one row per table. `happy` for the rare family's own reason (a thing that HAPPENED);
  // a DRAFT pick like the other rare rows, cheap to move, and not a word on a screen.
  'first-number-one': 'happy',
  'first-number-one-junior': 'happy',
  // ⭐ round 45 #5b – the page the first #1 and the highest title share when they fall in one week. `happy` is BOTH its neighbours' mood (the title's and the
  // first #1's), so the pair cannot disagree about her face; a DRAFT pick like the rows above it, cheap to move, and not a word on a screen.
  'first-number-one-title': 'happy',
  graduated: 'happy',
  farewell: 'serious',
  'career-ended': 'happy',
}

/** WHICH ONE-MOMENT PAINTING AN OCCASION HAS – the §4 ladder's TOP rung, as painting STEMS under
 *  `images/fem-euro-brunnet/`. The bride goes through `paintedStemFor` instead (band fallback – the
 *  wave-7 wiring: a wedding at thirty-one shows the band's own `norm`, never a 404). ⚠ `funeral`
 *  and the two `pregnant-*` paintings are on disk and reachable from NO row here: the world holds
 *  no death and no pregnancy, and the album does not invent one. */
const EVENT_STEM: Partial<Record<string, string>> = {
  'first-court': 'jun-training',
  graduated: 'adult-graduated',
  farewell: 'lateCareer-farewell',
  /** ⚠ THE OCCASION WAS RENAMED AND THE PAINTING WAS NOT (20.09). `career-ended` is the corpus id;
   *  `fem-euro-brunnet-lateCareer-retired.webp` is a file on disk and renaming art to match a word
   *  would be a change to a thing his own eyes have passed. */
  'career-ended': 'lateCareer-retired',
}

/** ⭐⭐⭐ WHICH OCCASIONS RESOLVE THROUGH THE **MOMENT-FACE** SEAM rather than through `EVENT_STEM`
 *  above – the paintings that exist in ONE band and therefore need a band FALLBACK, never a raw stem.
 *
 *  ⚠⚠ IT IS A TABLE AND IT USED TO BE AN `if (c.occasion.id === 'wedding')`, which is the shape
 *  `shared/avatarEmotion.ts`' own `FACE_BANDS` note predicted would have to be found and edited:
 *  «the next one-band painting that arrives needs exactly this seam, and a branch would have to be
 *  found and edited instead of a row being added». Wave 8b T6 is that arrival, so the branch became
 *  the table it should have been and the birth is a ROW.
 *
 *  ⚠ WHY NOT `EVENT_STEM`: that table names a STEM outright, and a stem cannot fall back. A wedding
 *  at thirty-one and a birth at thirty-one must both draw the band's own `norm` rather than a file
 *  that is not on disk – `paintedFaceFor` is the one place that decision lives, and this is the table
 *  that routes to it. Both halves are swept against disk by `tests/portrait-bands.test.ts`.
 *
 *  ⚠ BASE_PATH-SAFE BY CONSTRUCTION, which is the album wave's own deployed-only 404 lesson: every
 *  value here goes through `paintingPath`, which returns a path RELATIVE to the app root, and
 *  `AlbumPhoto.vue` is the one place that prefixes `import.meta.env.BASE_URL`. A stem that built an
 *  absolute `/images/...` here would work on localhost and 404 on the deployed sub-path. */
type MomentFace = 'bride' | 'birth'
const MOMENT_FACE: Partial<Record<string, MomentFace>> = {
  wedding: 'bride',
  // ⭐ wave 8b T6 (E2) – `fem-euro-brunnet-adult-birth.webp`, on disk since T5.
  birth: 'birth',
}

/** The paintings' home – ONE spelling in this module, swept against the files on disk by
 *  `tests/albumBook.test.ts` exactly as the art layer's own spelling is swept by
 *  `tests/portrait-bands.test.ts`; the disk is the ground truth both must match. */
const PAINTING_DIR = 'images/fem-euro-brunnet/'
function paintingPath(stem: string): string {
  return `${PAINTING_DIR}fem-euro-brunnet-${stem}.webp`
}

/** THE TRAVEL RUNG's projection of the mood onto the twelve painted journey scenes.
 *
 *  ⚠ `rehab` RETURNS NULL AND THAT IS THE RULING, NOT A GAP. An injury frame at an away event would
 *  otherwise resolve to a sad journey home – the fall – and his sentence is that the album
 *  remembers her getting up, so the injury frames skip the journey and land on the rehab portrait.
 *  Everything without a journey face of its own travels `sleepy` – the owner's own original travel
 *  word, the neutral face of a long trip home. */
function travelMoodOf(mood: PortraitEmotion): TravelHomeMood | null {
  if (mood === 'happy') return 'happy'
  if (mood === 'sad') return 'sad'
  if (mood === 'rehab' || mood === 'injury') return null
  return 'sleepy'
}

/** The journey's mode – антураж, not a fact, and NOT a draw: the week number picks one of the four
 *  painted scenes, so the same frame reopens on the same picture without touching any stream. */
const TRAVEL_SCENES: readonly TravelHomeScene[] = ['airport', 'plane', 'bus', 'car']

/** ⭐⭐ ROUND 45 #8 – WHO MAY STAND IN FOR A FACE when two frames of one page would be the same
 *  picture. His 02.10 sentence: «Постараться сделать, чтобы одинаковых фоточек не было на одной
 *  странице».
 *
 *  ⚠ THERE WAS NO DRAW TO REPEAT, AND THAT IS THE FINDING. The ladder is a TABLE: a frame's mood is a
 *  function of its occasion (§1) and the band portrait is ONE painting per (band, face), so two
 *  `happy` frames of one chapter are the same file by construction – which is what he saw. The only
 *  honest way to two pictures is a second FACE, and this table says which faces are close enough in
 *  meaning to be asked: ordered, nearest first, and never a face that says the opposite.
 *
 *  ⚠ THE RULED ROWS STAY RULED. `rehab` never stands in as `injury` or `sad` (his «альбом помнит, как
 *  она вставала, а не как падала», §1), a `sad` year never turns `happy`, and a lost final never
 *  smiles: the stand-ins of a face are its neighbours on the calm side. `angry`, `tired` and `injury`
 *  are on disk and are in no row here – the album never asked for them and this does not start.
 *
 *  ⚠ A PAGE CAN STILL EXHAUST THE LIST (three `serious` frames against two faces) and then it shows
 *  the repeat rather than a face that lies – `pickDistinct` counts it. The journey rung needs none of
 *  this: it has twelve painted scenes and rotates through the four of its own mood. */
const PORTRAIT_STAND_INS: Partial<Record<PortraitEmotion, readonly PortraitEmotion[]>> = {
  happy: ['norm', 'serious'],
  serious: ['norm'],
  norm: ['serious', 'happy'],
  sad: ['serious', 'norm'],
  rehab: ['serious', 'norm'],
}

// =================================================================================================
// §2 THE FILE's OWN WORDS – all ⚠ DRAFT, tabled for his pass (invariant 4)
// =================================================================================================

/** ⚠ DRAFT – the five chapter headings are HIS (spec §9: «Названия пяти глав … – его»). These are
 *  placeholders in the mockup's own register (its list had six names for five bands; the five kept
 *  are the ones that map). */
export const ALBUM_CHAPTER_TITLES: Record<AlbumBand, string> = {
  prologue: 'The beginning',
  young: 'Growing up',
  teen: 'The breakthrough',
  adult: 'The tour',
  lateCareer: 'The final chapter',
}

/** ⚠ DRAFT – the image alts, one per KIND of picture rather than per occasion: an alt describes
 *  what is DRAWN, and one rewording of «her portrait» per occasion would be thirty-three more
 *  strings for his pass with nothing in them. */
const ALT_DRAFT = {
  portrait: 'Her, that week',
  travel: 'The journey home',
  'jun-training': 'Her first days on a court',
  bride: 'Her wedding day',
  // ⚠ DRAFT (wave 8b T6) – husband-agnostic and child-sex-agnostic, so it reads correctly on a
  // career whose marriage ended before the birth and on the day boys exist.
  birth: 'The week the baby came home',
  'adult-graduated': 'Graduation day',
  'lateCareer-farewell': 'Her farewell match',
  'lateCareer-retired': 'The day after the last match',
} as const

/** ⚠ DRAFT – the ticket vocabulary (`Gate 3`, `Seat 14B`, `Row 14` – the mockup's own register) and
 *  the two fictional-name pools §8b asks for («нужен маленький пул вымышленных имён, тянутый из
 *  сида»). Every name is invented; none is constructible into a real venue, club or organisation. */
const TICKET_WORDS = { gate: 'Gate', seat: 'Seat', row: 'Row', age: 'Age' } as const
const VENUE_POOL: readonly string[] = [
  'Centre Court',
  'Court One',
  'The River Court',
  'Garden Arena',
  'Harbour Stadium',
  'The Old Clay',
] as const
/** ⭐ ROUND 47 #16 – TEN CLUBS, NOT SIX. The first six are the §8b pool as it shipped (`Whitegate Club` is the one he
 *  named); the last four are new and wired – R47-S7 … R47-S10 in docs/rounds/round-47.md. Every name is two or three
 *  plain words that fit the patch in TWO lines (measured in Chromium, 96px cloth); none is a real club, a
 *  tournament or a trademark (`tests/albumBook.test.ts` holds the pool against that list). */
export const ALBUM_PATCH_POOL: readonly string[] = [
  'Rivermouth Tennis',
  'Northfield Club',
  'Harbour Lane Tennis',
  'Old Mill Courts',
  'Cedar Park Tennis',
  'Whitegate Club',
  'Larkfield Tennis',
  'Fairhaven Club',
  'Elmwood Courts',
  'Stoneleigh Tennis',
] as const

/** ⚠ DRAFT – the alt each moment-face wears when its OWN painting is the one drawn; the band
 *  fallback takes `ALT_DRAFT.portrait` instead. A total `Record` over `MomentFace`, so a third
 *  one-band painting cannot join `MOMENT_FACE` without a sentence for it. */
const MOMENT_ALT: Record<MomentFace, string> = {
  bride: ALT_DRAFT.bride,
  birth: ALT_DRAFT.birth,
}

// =================================================================================================
// ⭐ L3-6 (10.10) – THE BOOK'S PROSE AS COPYREFS, BESIDE THE ENGLISH (docs/specs/i18n-2026-10.md §8, row L3-6)
// =================================================================================================
//
// The book is a VIEW (class b): assembled on demand from the world, thrown away – except that the finished book is also the HEIRLOOM, copied into the daughter's save at the door (`world.legacy.heirloomAlbum`),
// so the refs below are stored there too, on a generation-two career, beside the strings they translate. Not one character of the English moved: a ref sits next to its string and a screen draws
// `eventText({ text, c })`. Nothing here draws – the ONLY draws in this file are `flavourFor`'s and `flavourStartOf`'s, on their own sub-streams, in the order they always had.
//
// ⚠ THE CORPUS CELL IS A SEAT: a note, a caption and a line are static strings in a census copy leaf (`albumCorpus.ts`), so the string IS its key (`selfKey`) and every cell is already a catalog key.
// ⚠ A STRING WITH A HOLE IS A `cp` TEMPLATE spelt beside its twin (the age labels, the ticket words, the checklist), and a counted form would be a sentence per form (there is none here: an age is a number).
// ⚠ WHAT HAS NO REF, ON PURPOSE: the tier label and the stage on a pass or a tag (engine-born words, RU-04's formatters), the venue and the club patch (invented proper nouns, Latin by spec §9.5),
// the date line (a formatter's output, RU-13D) and the mother's name on the heirloom's checklist. They draw as the engine wrote them.

/** The corpus cell's key is the cell. */
const selfKey = (text: string): CopyRef => ({ k: text })

/** `ALBUM_CHAPTER_TITLES` as refs, the same five lines. A record keyed on the band: a sixth chapter cannot ship without its ref. */
const CHAPTER_TITLE_REF: Record<AlbumBand, CopyRef> = {
  prologue: cp`The beginning`,
  young: cp`Growing up`,
  teen: cp`The breakthrough`,
  adult: cp`The tour`,
  lateCareer: cp`The final chapter`,
}

/** `ALT_DRAFT` as refs, the same eight lines; a picked alt maps back to its ref by its own text (the lines are unique, and none has a hole). */
const ALT_REFS: readonly CopyRef[] = [
  cp`Her, that week`,
  cp`The journey home`,
  cp`Her first days on a court`,
  cp`Her wedding day`,
  cp`The week the baby came home`,
  cp`Graduation day`,
  cp`Her farewell match`,
  cp`The day after the last match`,
]
const ALT_REF_BY_TEXT: ReadonlyMap<string, CopyRef> = new Map(ALT_REFS.map((ref) => [ref.k, ref]))

/** `ageLabelOf`'s `Age 12` and the chapter's `Age 12 – 15` as refs. */
const ageRef = (age: number): CopyRef => cp`Age ${age}`
const ageRangeRef = (from: number, to: number): CopyRef => cp`Age ${from} – ${to}`

// =================================================================================================
// §3 CANDIDATES – the corpus's 33 occasions, resolved against ledgers the save never prunes
// =================================================================================================
//
// The registry is `ALBUM_CORPUS` (generated from the owner's document): each occasion declares its
// KIND (the §5 thirds rule's «род событий»), the BANDS it may appear in, and a GATE this file
// resolves. docs/specs/album-corpus-2026-09.md writes each gate's source in words; this section is
// those sentences as code, one resolver per family.

interface AlbumCandidate {
  /** the career week, or null for a prologue moment (the childhood is before week 0) */
  week: number | null
  /** her age at the moment – the trace's own age for prologue rows */
  ageYears: number
  occasion: AlbumOccasion
  /** the tournament the ticket/tag names, where one exists */
  tier?: TierId
  /** finish index for the ticket's stage word (0 = champion), where one exists */
  finish?: number
  /** higher wins a place; ties resolve to the earlier week */
  priority: number
  /** a closer is guaranteed its frame and exempt from the caps – the ruled closing frames */
  closer?: boolean
  /** ⭐ v86 – THE NOTE'S RULED CHECKLIST, built engine-side (`AlbumNote.lines`, the form mockups AZ-B
   *  and AZ-C already drew). Absent on almost every candidate the book builds: the corpus may carry no
   *  number, so the facts that ARE numbers ride here.
   *
   *  Two writers today – the heirloom (`dynastyCandidates`, the mother's cabinet) and the graduate
   *  (`collegeLeagueLines` on the `graduated` closer, the college scene's ruling C). Both obey the
   *  same law: a line rests on a fact the record really holds, and an absent fact prints nothing. */
  lines?: readonly string[]
  /** ⭐ L3-6 – the refs of `lines`, index for index (`null` where a line is a proper name and has none). Absent exactly when `lines` is. */
  linesC?: readonly (CopyRef | null)[]
}

const TOP_RANK = 10
const TOP_STREAK_YEARS = 4

// ⚠⚠ THE WRAPPER IS DELIVERY, NOT SPEED, AND IT CHANGES NOTHING THAT RUNS – G-01 of the 26.09
// performance review, W3 T3.1.
//
// THIS WAS A BARE `new Map(ALBUM_CORPUS.map(…))` AT MODULE SCOPE, and rollup cannot prove a
// top-level `new Map(...)` free of side effects, so it kept the initialiser and everything it reads:
// the whole of `albumCorpus.ts` rode in the **UI** chunk, which never calls one function in this
// file. The only runtime path here is `BracketTabs.vue → engine/world.ts → world/albumBook.ts`, and
// every UI import on it is a small symbol such as `KID_ID`. Measured on the build before the change:
// two of the corpus' own sentences were in `dist/assets/index-*.js` as well as in
// `dist/assets/sim.worker-*.js`, which is the only caller. After it, neither is in the UI chunk and
// both are still in the worker's.
//
// ⚠⚠ THE TWO SENTENCES ARE DELIBERATELY NOT QUOTED HERE, AND THE GATE IS WHY (27.09).
// `tests/component/album-mobile.test.ts` refuses any corpus string anywhere in `src/` outside
// `albumCorpus.ts`, comments included, and it caught this note on the wave's own gate. It is RIGHT to:
// a sentence quoted in a comment is a SECOND COPY of copy the corpus owns, and one day it will quote
// a line the corpus no longer holds - which is the «a note restates a rule the code owns» class this
// same wave spent a whole pass (T3.8, C-02) clearing out of nine other sites, one of which would have
// had a builder break a correct shipped sentence. To re-take this measurement, grep the built chunks
// for the sentences `ALBUM_CORPUS` holds rather than for a pair transcribed here: that is a count over
// the whole corpus and strictly better evidence than two samples.
//
// ⚠ ONE ANNOTATED CALL, AND THAT IS WHY IT IS AN IIFE RATHER THAN A BARE `/*#__PURE__*/ new Map`.
// The annotation is a promise about the call it precedes; the ARGUMENT `ALBUM_CORPUS.map(…)` is a
// separate opaque member call, so annotating only the `new Map` would leave rollup holding the
// argument's side effects – exactly the residue `WEEK_NOTES` was caught with in `diary/weekNotes.ts`.
// Wrapping both in one call gives the bundler a single statement it may delete whole.
//
// ⚠ A LAZY ACCESSOR WAS THE OTHER ARM AND IT WAS MEASURED AND DROPPED (T3.1). `let OCCASION … |
// null` built on the first `occasionOf` freed the SAME 49,042 B from the UI chunk and cost the
// **worker** chunk 14 bytes and a new hash (664,405 → 664,419 B, `CVruQZj1` → `CDzw6KMU`), because
// the guard ships in the worker's own code. This shape leaves the worker chunk byte-identical, which
// is the proof G-01 asks for, so the cheaper arm won on the only axis that separated them.
const OCCASION = /*#__PURE__*/ (() => new Map(ALBUM_CORPUS.map((o) => [o.id, o])))()
function occasionOf(id: string): AlbumOccasion {
  const row = OCCASION.get(id)
  if (!row) throw new Error(`no occasion '${id}' in ALBUM_CORPUS – the selector and the corpus have drifted`)
  return row
}

function wrapWeekOf(seasonIndex: number): number {
  return seasonIndex * WEEKS_PER_YEAR + WEEKS_PER_YEAR - 1
}

function candidate(
  world: WorldState,
  id: string,
  week: number,
  priority: number,
  extra: Partial<Pick<AlbumCandidate, 'tier' | 'finish' | 'closer' | 'lines' | 'linesC'>> = {},
): AlbumCandidate {
  return { week, ageYears: kidAgeAt(world, week), occasion: occasionOf(id), priority, ...extra }
}

/** The titles – four occasions for thirteen rows (§4 of the corpus doc: «the fourteenth only if it
 *  is about something»). */
function titleCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const titles = world.milestones.filter((m) => m.type === 'title').sort((a, b) => a.week - b.week)
  if (titles.length === 0) return out
  // A5 first-of-kind
  out.push(candidate(world, 'first-title', titles[0].week, 80, { tier: titles[0].tier, finish: 0 }))
  // A6 tier-above-every-previous-title – each true step up is its own candidate
  let best = TIER_LADDER.indexOf(titles[0].tier ?? 'local')
  for (const m of titles.slice(1)) {
    const rung = TIER_LADDER.indexOf(m.tier ?? 'local')
    if (rung > best) {
      out.push(candidate(world, 'title-step-up', m.week, 66, { tier: m.tier, finish: 0 }))
      best = rung
    }
  }
  // A7 first-title-after-a-layoff – the first title row after the first layoff ended
  const firstReturn = world.injuryHistory[0]?.week
  if (firstReturn !== undefined) {
    const after = titles.find((m) => m.week >= firstReturn)
    if (after) out.push(candidate(world, 'title-after-injury', after.week, 72, { tier: after.tier, finish: 0 }))
  }
  // A8 last-title-of-the-career – «only reachable on a finished career» (the corpus's own §4 note)
  if (world.ending) {
    const last = titles[titles.length - 1]
    out.push(candidate(world, 'title-last', last.week, 61, { tier: last.tier, finish: 0 }))
  }
  return out
}

function finalCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const finals = world.milestones.filter((m) => m.type === 'final').sort((a, b) => a.week - b.week)
  if (finals.length === 0) return out
  out.push(candidate(world, 'first-final', finals[0].week, 45, { tier: finals[0].tier, finish: 1 }))
  // A10 final-with-no-title-that-week – result-known: she lost it
  const titleWeeks = new Set(world.milestones.filter((m) => m.type === 'title').map((m) => m.week))
  for (const m of finals.slice(1)) {
    if (!titleWeeks.has(m.week)) out.push(candidate(world, 'final-lost', m.week, 18, { tier: m.tier, finish: 1 }))
  }
  return out
}

/** ⚠⚠ THE BAND OF STABILITY, AND IT IS RELATIVE BECAUSE A RANKING IS – his 20.09 blocker 4. The
 *  gate that routes a season to `season-held` decides whether a page says «A year of holding on»,
 *  so the band is the width of «nothing really moved» and nothing wider. It is a RATIO of the
 *  previous close, not a count of places: twenty places at #400 is noise and two places at #10 is a
 *  season – a fixed number would call the first a recovery and the second a flat year, which is the
 *  same defect in both directions.
 *
 *  ⚠ A FLOOR OF ONE PLACE keeps the top of the ladder honest: at #10 the ratio is half a place, and
 *  #10 → #11 is a year of holding on by anybody's reading.
 *
 *  ⚠ THE WIDTH ITSELF IS A DRAFT AND IS FLAGGED AS ONE. It is the one number in this wave that was
 *  chosen rather than measured (invariant 5), because the thing it tunes is a SENTENCE and not a
 *  balance curve – there is no bench whose output would settle it. A twentieth reads as «the same
 *  year» on every rung of the ladder and it is one edit to move. */
const SEASON_HELD_BAND = 0.05

function heldBandOf(previousRank: number): number {
  return Math.max(1, Math.round(previousRank * SEASON_HELD_BAND))
}

/** ⭐⭐ FOUR SEASONS, NOT THREE – his 20.09 blocker 4, and the defect it repairs is the routing and
 *  not the writing: «season-held does not mean she held on». Anything that set no career best and
 *  was no worse than last year used to land on `A13`, so a real climb – #80 to #40 under an old
 *  best of #20 – printed as a year of standing still.
 *
 *    `season-first`     the first close there was
 *    `season-best`      a new career best, whatever last year did
 *    `season-recovery`  better than last year, short of her own best
 *    `season-held`      the same rank, or inside the band above
 *    `season-down`      worse than last year, past the band
 *
 *  ⚠ THE ORDER OF THE ARMS IS THE CONTRACT. A new best is a new best even when it is one place: the
 *  best arm is asked first, so a career best inside the band prints `A12` rather than `A13`. */
function seasonCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const closes = world.milestones
    .filter((m) => m.type === 'season-rank' && m.rank !== undefined)
    .sort((a, b) => a.week - b.week)
  let bestRank = Infinity
  let prevRank: number | null = null
  for (const [i, m] of closes.entries()) {
    const rank = m.rank!
    if (i === 0 || prevRank === null) {
      out.push(candidate(world, 'season-first', m.week, 44))
    } else if (rank < bestRank) {
      out.push(candidate(world, 'season-best', m.week, 40))
    } else if (Math.abs(rank - prevRank) <= heldBandOf(prevRank)) {
      out.push(candidate(world, 'season-held', m.week, 12))
    } else if (rank < prevRank) {
      out.push(candidate(world, 'season-recovery', m.week, 36))
    } else {
      out.push(candidate(world, 'season-down', m.week, 20))
    }
    bestRank = Math.min(bestRank, rank)
    prevRank = rank
  }
  return out
}

function bodyCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const first = world.milestones.find((m) => m.type === 'injury')
  if (first) out.push(candidate(world, 'injury', first.week, 53))
  // A16 the week the layoff ended, derived – there is no milestone for it. The LONGEST layoff's
  // return is the representative; the others are bulk.
  let longest: { week: number; weeksOut: number } | null = null
  for (const h of world.injuryHistory) {
    if (longest === null || h.weeksOut > longest.weeksOut) longest = { week: h.week, weeksOut: h.weeksOut }
  }
  for (const h of world.injuryHistory) {
    out.push(candidate(world, 'injury-return', h.week, h.week === longest?.week ? 52 : 25))
  }
  return out
}

function onceCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const rows: Array<[Milestone['type'], string, number]> = [
    ['prize', 'first-prize', 70],
    ['international', 'first-international', 65],
    ['school', 'school-done', 62],
  ]
  for (const [type, id, priority] of rows) {
    const m = world.milestones.find((row) => row.type === type)
    if (m) out.push(candidate(world, id, m.week, priority, { tier: m.tier }))
  }
  // A19 break-even – the CAREER crossing, captured the week it happened because it cannot be
  // reconstructed afterwards. The common week-crossing is bulk the representatives rule prunes.
  const crossed = world.milestones.find((m) => m.type === 'break-even' && m.kind === 'career')
  if (crossed) out.push(candidate(world, 'break-even', crossed.week, 75))
  // A21 the wedding – per EPISODE, so a second marriage reaches the occasion again
  for (const m of world.milestones.filter((row) => row.type === 'wedding')) {
    out.push(candidate(world, 'wedding', m.week, 90))
  }
  // ⭐⭐⭐ A34 THE BIRTH (wave 8b T6, E2 – RULED 21.09, «да, получает, картинка теперь есть»). Per
  // WEEK rather than per episode, which is `milestoneKey`'s own identity for this type and its own
  // reason: a birth is once per PREGNANCY, so W5's second child of the same marriage reaches this
  // occasion again on its own week. The wedding one line up is the shape; the loop is the same loop.
  //
  // ⚠ PRIORITY 92, ONE ABOVE THE WEDDING'S 90, AND THE NUMBER IS THE BUILDER'S. E2's own sentence is
  // the argument – «a birth is the largest life event the album could hold» – and the ladder around
  // it is the calibration: the closers sit at 1000, the wedding at 90, break-even at 75, the first
  // prize at 70. One step above the wedding says «larger than the marriage that produced it» without
  // reaching past the career's own closing frames, which is as much as an ordering can honestly say.
  // ⚠ IT DOES NOT MAKE THE PAGE CERTAIN: the selector's own representatives rule still caps one kind
  // at a third of a chapter's sheets, and priority decides ORDER inside a band rather than admission.
  for (const m of world.milestones.filter((row) => row.type === 'birth')) {
    out.push(candidate(world, 'birth', m.week, 92))
  }
  return out
}

/** ⭐⭐ THE WEEK A BUILD WAS DELIVERED – the `build` LETTER's own week, and his own reason for
 *  reading it there (20.09): «Это наиболее DRY-решение: письмо и альбом будут ссылаться на один
 *  факт доставки.»
 *
 *  `deliverAssets` (engine/world/shop.ts) raises one `build` letter per delivery and `raiseBuildLetter`
 *  (engine/offers.ts, round 43 #11) dates it at the week the thing ARRIVED, keyed on the rung and the
 *  week the order was placed. It is never pruned – `pruneEntryLetters` touches `entry` and `tour`
 *  letters only – so it is the one dated, durable record that a build finished.
 *
 *  ⚠ THE EARLIEST LETTER FOR THE RUNG, because the album writes each asset's FIRST (the corpus's
 *  «five firsts») and a re-bought rung raises a second letter under its own order week.
 *
 *  ⚠ NULL IS A REAL ANSWER AND IS THE OTHER HALF OF THE FIX: a career that ORDERED the courts and
 *  never saw them finished has no letter, and gets no page. «The courts went in» is a sentence about
 *  a delivery, and the delivery is the only thing that licenses it. */
function deliveredWeek(world: WorldState, itemId: string): number | null {
  let earliest: number | null = null
  for (const offer of world.offers ?? []) {
    if (offer.kind !== 'build') continue
    if ((offer.terms as BuildLetterTerms).itemId !== itemId) continue
    if (earliest === null || offer.week < earliest) earliest = offer.week
  }
  return earliest
}

function assetCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const houses = world.assets.filter((a) => a.id.startsWith('house-')).sort((a, b) => a.boughtWeek - b.boughtWeek)
  if (houses[0]) out.push(candidate(world, 'first-house', houses[0].boughtWeek, 58))
  // ⚠ THE TWO LISTS ARE THE CATALOGUE'S OWN SPLIT AND NOT A PREFERENCE. `buyAsset` writes
  // `readyWeek` in exactly one branch – `item.buildWeeks` – so a rung with no build time is owned
  // the week it is paid for and `boughtWeek` IS the week it happened. The house, the brand and the
  // field carry no build time (economy.ts's shelf); the courts and the clubhouse do.
  const bought: Array<[string, string, number]> = [
    ['merch-brand', 'brand', 57],
    ['academy-land', 'academy-land', 56],
  ]
  for (const [assetId, id, priority] of bought) {
    const row = world.assets.find((a) => a.id === assetId)
    if (row) out.push(candidate(world, id, row.boughtWeek, priority))
  }
  // ⚠⚠ HIS 20.09 BLOCKER 2: «built» WAS PRINTED ON THE WEEK IT WAS ORDERED. `A25` says «The courts
  // went in» and `A26` says «The building is up», and both were dated off `boughtWeek` – the week
  // the money left, with the build still years away. They are dated off the delivery now.
  const built: Array<[string, string, number]> = [
    ['academy-courts', 'academy-courts', 55],
    ['academy-building', 'academy-built', 54],
  ]
  for (const [assetId, id, priority] of built) {
    const week = deliveredWeek(world, assetId)
    if (week !== null) out.push(candidate(world, id, week, priority))
  }
  return out
}

/** ⭐ THE WEEK OF THE FIRST TITLE AT THE HIGHEST STEP – `top-tier-title`'s own date, null where she has not won one. Gated, as it always was, on the
 *  high-water mark (`bestFinishByTier` holds a finish and NO week) and dated off the titles ledger (`trophiesByTier`, v31), which keeps the weeks.
 *
 *  ⚠ ONE FUNCTION BOTH PAGES ASK (round 45 #5b): the title's page is composed at this week and the first-#1 collision below is read against it, so the two
 *  sides of «the same week» cannot come from two readings of one ledger. A pure read of the world – no draw, no write, and no field of its own. */
function topTierTitleWeek(world: WorldState): number | null {
  const topTier = TIER_LADDER[TIER_LADDER.length - 1]
  const weeks = world.trophiesByTier[topTier]?.titles ?? []
  return world.bestFinishByTier[topTier] === 0 && weeks.length > 0 ? weeks[0] : null
}

/** ⭐ THE SUPER-RARES – his 19.09 addition. Each DISPLACES an ordinary representative rather than
 *  raising the cap: they enter the same fixed budget at the top of the priority order.
 *
 *  ⚠ SOURCES VERIFIED, AS THE TASK ASKS, AND ONE HALF-CORRECTED: the top step's win is GATED on
 *  `bestFinishByTier` (the corpus doc's own source clause) and DATED off `trophiesByTier` – the
 *  spec named the former, which is a high-water mark holding a finish index and NO week, so it can
 *  corroborate the win and cannot date it; the titles ledger (v31) keeps the weeks. The streak
 *  reads `seasonHistory`'s per-track ranks (v46); rows banked before v46 carry none and honestly
 *  cannot join a streak. The lifetime deal reads the offers ledger, which is never pruned. */
function rareCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const topTier = TIER_LADDER[TIER_LADDER.length - 1]
  const titleWeek = topTierTitleWeek(world)
  if (titleWeek !== null) {
    out.push(candidate(world, 'top-tier-title', titleWeek, 100, { tier: topTier, finish: 0 }))
  }
  let streak = 0
  let streakEnd: number | null = null
  for (const row of world.seasonHistory) {
    const rank = row.byTrack?.wta?.endRank
    if (rank !== undefined && rank <= TOP_RANK) {
      streak += 1
      if (streak >= TOP_STREAK_YEARS) streakEnd = row.seasonIndex
    } else {
      streak = 0
    }
  }
  if (streakEnd !== null) out.push(candidate(world, 'years-at-the-top', wrapWeekOf(streakEnd), 98))
  // ⭐⭐ ROUND 45 #5 – THE FIRST TIME AT NUMBER ONE (the owner, 02.10: «даже если в моменте, а не по итогам года, это значимый момент»,
  // and «можно и на других уровнях тоже»). ONE page per table, DATED AT THE WEEK THE LIVE FOLD FIRST SAID #1 – `world.firstNo1`, the v91
  // latch `recomputeKidRank` writes once. Priority 99: between the top-tier title (100) and the years at the top (98), so the first
  // touch outranks the run it begins and yields only to the biggest trophy there is.
  // ⚠ NOT DERIVED FROM `seasonHistory`, and that is the whole reason for the latch: a year-end row would miss a June touch that ends the
  // season at #3, and no save held the week otherwise. ⚠ TWO OCCASIONS AND NOT ONE WITH A TABLE PARAMETER – the corpus forbids
  // interpolation (corpus doc §3.2), so each table's page has its own twelve strings. ⚠ THE DOMESTIC TABLE IS NOT LATCHED: no page.
  // A career whose latch is absent (never touched #1, or an older save that had not at migration time) simply has no such page.
  if (world.firstNo1?.wta !== undefined) {
    out.push(candidate(world, 'first-number-one', world.firstNo1.wta, 99))
    // ⭐⭐ ROUND 45 #5b – THE WEEK THE FIRST #1 AND THE HIGHEST TITLE SHARE (the owner, 02.10, third batch: «а они обе не могут на одной странице
    // жить?… она же стала №1 потому что выиграла шлем, без него никак. Это тоже как-то надо научиться показывать»). Round 45 #5 let the title's page take
    // such a week and absorb the first #1; now ONE page carries both, composed AT 101 – above the title's 100 and the first-#1 page's 99 – so the book's
    // one-frame-per-week rule (`selectRepresentatives`) gives the week to it and NEITHER plain page prints.
    // ⚠ THERE IS DELIBERATELY NO SECOND MECHANISM: the plain pair is not omitted here, because priority under that one rule already is the suppression and a belt
    // on top of it could not be told from the braces by any test – the mutations (the trigger, the rule, the priority) each go red on their own.
    // ⚠ THE QUESTION IS PUT TO THE TITLE'S OWN WEEK (`topTierTitleWeek`), never to the raw ledger: a LATER top-tier title that shares the latch week is not a
    // collision, because the title's page is dated at the FIRST one – that week stays the plain first-#1 page, exactly as before. ⚠ THE JUNIOR TABLE KEEPS THE
    // ABSORB RULE: no junior twin was asked for. ⚠ IT CARRIES THE TITLE'S TIER AND FINISH, because it REPLACES the title's page on its sheet and the ticket and
    // the tag read them – a page without them would drop the tournament fact a title-only week keeps on the B and C layouts.
    if (world.firstNo1.wta === titleWeek) out.push(candidate(world, 'first-number-one-title', titleWeek, 101, { tier: topTier, finish: 0 }))
  }
  if (world.firstNo1?.junior !== undefined) out.push(candidate(world, 'first-number-one-junior', world.firstNo1.junior, 99))
  for (const o of world.offers) {
    if (o.state !== 'signed') continue
    if ('lifetime' in o.terms && o.terms.lifetime === true) {
      out.push(candidate(world, 'lifetime-sponsor', o.decidedWeek ?? o.week, 96))
      break
    }
  }
  return out
}

// -------------------------------------------------------------------------------------------------
// §3b THE CLOSING – three families, one last page, and a farewell only where a last match was played
// -------------------------------------------------------------------------------------------------
//
// ⚠⚠ HIS 20.09 BLOCKER 1, AND IT IS THIS WAVE's WHOLE DEFECT CLASS IN ONE PLACE: «хорошие строки
// могут описывать событие, которого в карьере не было». Both closing cards used to fire on ANY
// `world.ending`, and the union has nine members since v85 (eight when this was written) – so a
// BANKRUPTCY, a forced stop or a departure for college was given a farewell speech with thanks, an
// empty court and a handing over of the book. The contract below is the ruling, in three parts.

/** ⭐⭐ THE THREE FAMILIES A CAREER CAN END IN (his 20.09 ruling), and the closing is extended
 *  through this table rather than through a chain of `if`s.
 *
 *    `decision`      she chose to stop – `stopped`, and since v85 `family`
 *    `forced`        it was taken out of her hands – `bankruptcy`, `injury`
 *    `left-the-tour` she left the professional career – `natural`, `plateau`, `peak`, `fall`
 *
 *  ⚠⚠ A TOTAL `Record` OVER THE UNION, and that totality is the point of writing it as a table: a
 *  TENTH ending goes RED here until somebody decides which of the three it is, which is exactly the
 *  standing `ENDING_BLURB` / `ENDING_TITLE` / `EMOTION_BY_ENDING` already have (protocol/career.ts's
 *  own note: «a new ending cannot ship without its copy, enforced by the compiler»). ⚠ The count in
 *  that sentence said «ninth» and wave 8's `'family'` is the ninth, so it is advanced rather than
 *  softened – the same repair `CareerEndingType`'s own «three TOTAL records» needed, one file over.
 *
 *  ⚠ `college` SITS IN THE TABLE AND IS ALMOST NEVER READ THROUGH IT. `closingEndingOf` below
 *  refuses a college latch while it resumes – his sentence: «college is not a final page at all
 *  while `resumesWeek` exists – she is coming back». Only a college ending that never resumes
 *  (`resumesWeek === null`, which no engine path writes today) reaches this row, and a girl who
 *  left for a degree and did not come back left the professional career. */
export type AlbumClosingFamily = 'decision' | 'forced' | 'left-the-tour'

export const ALBUM_CLOSING_FAMILY: Record<CareerEndingType, AlbumClosingFamily> = {
  stopped: 'decision',
  bankruptcy: 'forced',
  injury: 'forced',
  natural: 'left-the-tour',
  plateau: 'left-the-tour',
  peak: 'left-the-tour',
  fall: 'left-the-tour',
  college: 'left-the-tour',
  // ⭐⭐ WAVE 8 T5 – THE NINTH ENDING, AND THE TABLE'S OWN PROMISE PAID: it «goes RED here until
  // somebody decides which of the three it is», and it did. `decision` is the brief's drafted mapping
  // and the design's own sentence is the argument – «a life completed rather than a career failed» –
  // so it lands beside `stopped`, which is the same shape of story: she was never stopped, she
  // decided. ⚠ `left-the-tour` IS THE ONE THAT LOOKS RIGHT AND IS NOT: that family is for a career
  // that ran its course and closed, and the whole point of this ending is that the closing is a choice
  // taken about something else. ⚠ ALL THREE FAMILIES STILL TAKE `A32` (his ruling below), so this row
  // adds no occasion and no string – which is the extension point working exactly as its note says.
  family: 'decision',
}

/** WHICH OCCASION EACH FAMILY's LAST PAGE SPEAKS IN. All three take `A32` today and that is HIS
 *  ruling, not a shortcut: «сами строки A32 для этого уже прекрасно подходят» – the last page is
 *  the parent handing the book over, which is true of a career that stopped, one that was stopped
 *  and one that ran its course. The id was renamed `retired` → `career-ended` in the same breath,
 *  because `retired` is one of the three stories and the page is all of them.
 *
 *  ⚠ THIS IS THE EXTENSION POINT. When he writes a family its own sentences, the corpus gains an
 *  occasion and this table gains one edit – no new branch anywhere in the selector. */
const CLOSING_OCCASION: Record<AlbumClosingFamily, string> = {
  decision: 'career-ended',
  forced: 'career-ended',
  'left-the-tour': 'career-ended',
}

/** The ending the album may CLOSE on, or null while the story still has a next week.
 *
 *  ⚠ A COLLEGE LATCH IS NOT AN ENDING FOR THIS PURPOSE. `resumesWeek` points one year out
 *  (protocol/career.ts: «`college` is the only one that resumes»); the album is shown, every
 *  mutating command refuses, and then she comes back. A last page there would close a book that is
 *  still being written. */
function closingEndingOf(world: WorldState): CareerEnding | null {
  const ending = world.ending
  if (!ending) return null
  if (ending.type === 'college' && ending.resumesWeek !== null) return null
  return ending
}

/** ⭐⭐ THE LAST WEEK THE SAVE CAN PROVE SHE WAS ON A COURT – the honest source for `A31`, asked for
 *  and answered rather than assumed (his 20.09 instruction).
 *
 *  ⚠⚠ AND THE SHORT ANSWER IS THAT THE SAVE STILL CANNOT DATE THE LAST MATCH EXACTLY. The previous
 *  builder's sentence stands and was re-checked against the tree: `world.results` prunes at 52 weeks
 *  AND is award-only (`world.ts` writes a kid row only when `points > 0`, so a scoreless first-round
 *  exit leaves none), the news feed caps at 400 rows, `seasonEntries` / `internationalEntryWeeks` /
 *  `proEntryWeeks` are pruned to the current season, and `seasonHistory` keeps wins and losses per
 *  SEASON with no week on them. `world/brand.ts` reached the same floor for the same reason and
 *  wrote it down: «`trophiesByTier[tier].titles/finals` is the only dated, per-tier, never-pruned
 *  appearance ledger in the game».
 *
 *  ⭐ SO THIS GATES ON WHAT IT CAN PROVE, which is the instruction's own fallback. Every week below
 *  is a week she demonstrably played a match:
 *    · `trophiesByTier[t].titles/finals` – never pruned, dated, one per appearance in a final;
 *    · `world.results` rows for the kid with points on them – the last 52 weeks, and a mandatory
 *      MISS is excluded by the same test (its row is a deliberate scoreless one);
 *    · `title` / `final` milestones – dated firsts, and the ledger hand-built probe worlds carry.
 *  The latest of them, never later than the ending. A career the save can prove nothing about gets
 *  no farewell page at all, which is the failure this function is allowed to have: a missing true
 *  page costs a sheet, an invented one costs the book its credibility. */
function lastProvenCourtWeek(world: WorldState, by: number): number | null {
  let last: number | null = null
  const see = (week: number): void => {
    if (week <= by && (last === null || week > last)) last = week
  }
  for (const tier of TIER_LADDER) {
    const cabinet = world.trophiesByTier?.[tier]
    if (!cabinet) continue
    for (const week of cabinet.titles) see(week)
    for (const week of cabinet.finals) see(week)
  }
  for (const row of world.results) {
    if (row.playerId === KID_ID && row.points > 0) see(row.week)
  }
  for (const m of world.milestones) {
    if (m.type === 'title' || m.type === 'final') see(m.week)
  }
  return last
}

/** ⭐⭐ THE GRADUATE'S CHAMPIONSHIP RECORD, AS THE NOTE'S CHECKLIST – the college scene's ruling C
 *  (docs/plans/college-scene-rulings-2026-09.md). The spec asked for «the album's college chapter
 *  gains the championship's line per year» and THERE IS NO COLLEGE CHAPTER: `AlbumBand` has five
 *  members and the album's whole college reading is the `graduated` closer. So the per-year lines
 *  land where the shape already has a place for facts a corpus string may not carry – `AlbumNote.lines`,
 *  «short ruled lines instead of a paragraph» – exactly as the heirloom's do (`dynastyCandidates`).
 *
 *  ⚠ ONE LINE PER BANKED YEAR THAT REALLY HELD A CHAMPIONSHIP, and a `league: null` year contributes
 *  NOTHING rather than an absence sentence. Two careers legitimately carry that null (a v55 save
 *  migrated mid-freeze, and a year cut short before week `COLLEGE_LEAGUE.seasonWeek` came round –
 *  `CollegeYear.league`'s own note), and a «no championship» row would be the book describing a
 *  fixture that never happened. Same rule as the heirloom's missing «Titles: 0».
 *
 *  ⚠ THE YEAR'S OWN `index`, NEVER A COUNT. `bankCollegeYear` writes `years.length + 1`, so the row
 *  carries its own number – `CollegeYearCard.vue`'s `collegeReportHead` is written under the same
 *  sentence, and a count here could drift from the number the card printed at the time.
 *
 *  ⚠ IT NEVER GRADES HER, which is `collegeLeagueLine`'s own ⚠ binding a second reader: «a
 *  first-round exit and a title are stated in the same voice». One template, one forked value, no
 *  score, no date, no adjective. `wonTheLeague` is the fork and `leagueExitLabel` is the namer – a
 *  second idea of what a round is called may not get in (the rule `collegeLeague.ts` is written
 *  under). The competition is `COLLEGE_LEAGUE.label` and never a real body's name (CLAUDE.md Style:
 *  organisations are fictional).
 *
 *  ⚠ THE TWO RENDERINGS ARE DRAFTS for his pass (invariant 4), quoted in the wave's report and its
 *  strings table. They deliberately reuse the words the year card already prints for this exact
 *  fact – its `the College League` / `Won it` fact pair and `leagueExitLabel`'s round – so the two
 *  surfaces cannot come to say different things about one championship. */
function collegeLeagueLines(years: readonly CollegeYear[]): readonly string[] {
  return years
    .map((year) => {
      // ⚠ TRUTHINESS, AND IT IS `lastLeagueRun`'s OWN IDIOM (world/college.ts) rather than a loose
      // `=== null`: that function is the only other reader of this field and it asks `if (run)`. The
      // declared type is `CollegeLeagueRun | null` and the v56 migration normalises a missing key to
      // null (migrations.ts:1798), so the two spellings agree on every save – and on a hand-built
      // probe year, which answers `undefined`, only this one is honest about «no run recorded».
      const run = year.league
      if (!run) return null
      // ⚠ DRAFT x2 – the title year and the exit year, in one voice:
      //     «Year 1, the College League: Won it»
      //     «Year 2, the College League: Went out in the Semifinal»
      // ⚠ RE-AIMED 24.09, HIS RULING ON THE WAVE'S Q3 («по всем вопросам делай по твоим
      // рекомендациям» – option B): the bare round read cold beside «Won it» could be heard as
      // «she reached it». The long form is the engine's own sentence for this fact (the card's
      // `leagueNote` spells it the same way), so the album stops reading like a results table and
      // the two surfaces still share `leagueExitLabel`'s one spelling of the round.
      return `Year ${year.index}, ${COLLEGE_LEAGUE.label}: ${wonTheLeague(run) ? 'Won it' : `Went out in the ${leagueExitLabel(run)}`}`
    })
    .filter((line): line is string => line !== null)
}

/** ⭐ L3-6 (10.10) – `collegeLeagueLines`' sentences as refs, one per year that has a run, in the same order: the same filter (`year.league` truthy), the same two arms, so the arrays are index-aligned by
 *  construction (the net holds it on posed graduates). The league's name and the round's name are engine-born words and ride as params; `Won it` and `Went out in the …` are two sentences. */
function collegeLeagueRefs(years: readonly CollegeYear[]): readonly CopyRef[] {
  const out: CopyRef[] = []
  for (const year of years) {
    const run = year.league
    if (!run) continue
    out.push(
      wonTheLeague(run)
        ? cp`Year ${year.index}, ${COLLEGE_LEAGUE.label}: Won it`
        : cp`Year ${year.index}, ${COLLEGE_LEAGUE.label}: Went out in the ${leagueExitLabel(run)}`,
    )
  }
  return out
}

/** THE CLOSERS – ruled 19.09, re-ruled 20.09, and checked by his own eyes on the paintings:
 *  `graduated` where a college happened (the FULL course – `finishedTheCourse` is the shared
 *  predicate, so a leaver gets no graduation frame on any surface); `farewell` where a last match
 *  can be proved, ON ITS OWN WEEK and not on the ending's; and the book's last frame, `career-ended`,
 *  in whichever family the ending falls.
 *
 *  ⚠ THE TWO CLOSERS NO LONGER SHARE A WEEK, which is the visible half of blocker 1: the farewell
 *  is the week she last played and the last page is the week the story stopped. They are the same
 *  week only where she played to the very end. */
function closerCandidates(world: WorldState): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  const college = world.college
  if (college?.doneWeek != null && finishedTheCourse(college.years.length, ENDINGS.collegeYears)) {
    // ⭐ THE COLLEGE SCENE (ruling C) – the degree's page carries the championship record as its
    // checklist. `lines` is empty on a course whose every year held a null run, which is the same
    // book the graduate always had.
    out.push(candidate(world, 'graduated', college.doneWeek, 1000, { closer: true, lines: collegeLeagueLines(college.years), linesC: collegeLeagueRefs(college.years) }))
  }
  const ending = closingEndingOf(world)
  if (!ending) return out
  const lastMatch = lastProvenCourtWeek(world, ending.week)
  if (lastMatch !== null) out.push(candidate(world, 'farewell', lastMatch, 1000, { closer: true }))
  const family = ALBUM_CLOSING_FAMILY[ending.type]
  out.push(candidate(world, CLOSING_OCCASION[family], ending.week, 1000, { closer: true }))
  return out
}

/** CHAPTER 1's MOMENTS – the ruled path (а): «Первый раз на корте, первый турнир и/или победа»,
 *  read off the v84 trace at assembly time and derived nowhere else. One frame per weekend at most,
 *  the most specific occasion winning: the cup outranks the win outranks the plain first weekend. */
function prologueCandidates(trace: PrologueTrace): AlbumCandidate[] {
  const out: AlbumCandidate[] = []
  // ⚠⚠ HIS 20.09 BLOCKER 3 – THE FIRST DAY ON COURT IS A FIXED SCENE AND CARRIES A FIXED AGE.
  // This used to take the age of the first `trace.picks` entry, and a walked childhood's first pick
  // is at EIGHT: ages 6 and 7 are continue-only cards and write no pick at all. So the three sunny
  // strings his mockups anchored the whole corpus on printed «Age 8» over «First day on court», and
  // `tests/albumBook.test.ts` hid it behind a hand-built `picks: { 6: … }` that no engine path can
  // produce. `FIRST_COURT_AGE` (shared/protocol/profile.ts) is the one constant the prologue's own
  // card table and this line now share.
  //
  // ⚠ THE GATE IS THE WALK, NOT A PICK. The age-6 card has no options, so every childhood that was
  // walked went through it – the trace holding ANY of the three things a walk writes is the proof
  // that it was walked. An entirely empty trace (a crafted edge; no engine path writes one) proves
  // nothing and earns no page, which is the rule this chapter already had.
  const walked =
    Object.keys(trace.picks).length > 0 || Object.keys(trace.entries).length > 0 || trace.opens.length > 0
  if (walked) {
    out.push({ week: null, ageYears: FIRST_COURT_AGE, occasion: occasionOf('first-court'), priority: 80 })
  }
  const firstOpen = trace.opens[0]
  const firstWin = trace.opens.find((o) => o.wins > 0)
  const firstCup = trace.opens.find((o) => o.finish === 0)
  const taken = new Set<string>()
  const push = (row: (typeof trace.opens)[number] | undefined, id: string, priority: number) => {
    if (!row) return
    const key = `${row.age}:${row.index}`
    if (taken.has(key)) return
    taken.add(key)
    out.push({ week: null, ageYears: row.age, occasion: occasionOf(id), priority })
  }
  push(firstCup, 'first-cup', 76)
  push(firstWin, 'first-win', 74)
  push(firstOpen, 'first-tournament', 72)
  return out.sort((a, b) => a.ageYears - b.ageYears)
}

/** ⭐⭐⭐ THE HEIRLOOM – ONE PAGE, ON A CAREER THAT CONTINUES A LINE (v86, wave 10 T6a;
 *  docs/specs/the-dynasty-2026-09.md §1). Zero mechanics: it reads `world.dynasty` and changes
 *  nothing.
 *
 *  ⚠⚠ EVERY LINE IS LICENSED OFF A FACT AND AN ABSENT FACT PRINTS NOTHING, which is §5's rule
 *  applied to a page instead of to a sentence. A mother who won nothing gets no titles row – not a
 *  «Titles: 0», which would be the book telling a girl her mother lost. A mother who never held a
 *  professional ranking gets no ranking row for the same reason. What every line HAS is her name and
 *  the generation, because those are true of every line there is.
 *
 *  ⚠ IT RIDES THE PROLOGUE CHAPTER, which is what «early in the book» means here: a dynasty career
 *  walks a childhood like any other, so the chapter exists, and the box was in the house before she
 *  ever held a racquet – hence the age.
 *
 *  ⚠ THE LABELS ARE DRAFTS, listed verbatim in the wave's report for his pass (invariant 4). */
function dynastyCandidates(world: WorldState): AlbumCandidate[] {
  const record = world.dynasty
  if (record === null) return []
  const career = record.motherCareer
  // ⭐ L3-6: each line is read as a (line, ref) pair, the name having no ref (a proper noun), and the two arrays are cut from the same list so they cannot drift out of step. (`line` / `ref`, not
  // `text` / `c`: those are the names of a ledger row's pair, which tests/i18n-l3-1-ledger-writers.test.ts §2 holds to the table.)
  const rows: { line: string; ref: CopyRef | null }[] = [
    { line: `${record.motherName.first} ${record.motherName.last}`, ref: null },
    ...(career.bestRank === null ? [] : [{ line: `Best ranking: #${career.bestRank}`, ref: cp`Best ranking: #${career.bestRank}` }]),
    ...(career.titles > 0 ? [{ line: `Titles: ${career.titles}`, ref: cp`Titles: ${career.titles}` }] : []),
    ...(career.slams > 0 ? [{ line: `Slams: ${career.slams}`, ref: cp`Slams: ${career.slams}` }] : []),
    { line: `Generation ${record.generation}`, ref: cp`Generation ${record.generation}` },
  ]
  const lines = rows.map((row) => row.line)
  const linesC = rows.map((row) => row.ref)
  // ⚠ THE AGE IS **BEFORE** THE FIRST COURT DAY and the priority is above it, so the book opens on
  // where she came from and then on where she started. Both are deliberate and both are visible here
  // rather than in a sort nobody can find.
  return [{ week: null, ageYears: FIRST_COURT_AGE - 1, occasion: occasionOf('the-line'), priority: 82, lines, linesC }]
}

// =================================================================================================
// §4 SELECTION – representatives per chapter: 1–3 sheets by density, no kind over a third
// =================================================================================================

/** ⭐⭐ THE ROTATION – his 20.09 re-ruling, and it supersedes BOTH earlier readings («дальше B» and
 *  the openers' own alternation): «я бы хотел, чтобы в главах были все листы, а порядок уже значения
 *  не имеет. Хочется, чтобы одинаковых подряд просто не было и всё… Или сразу как-то задать набор
 *  непересекающихся и недублирующихся подряд страниц, а потом его по факту заполнять, пропуская
 *  невостребованные.»
 *
 *  So the book runs one cursor over these three and takes the next layout for every sheet it
 *  actually builds. Two sheets in a row can never share a layout (the cursor always advances, and
 *  three is the period), a three-sheet chapter shows all three, and nothing is reserved for a page
 *  the career did not earn – the rotation is filled by fact, which is his second sentence exactly. */
const LAYOUT_ROTATION: readonly AlbumLayout[] = ['A', 'B', 'C']

/** How many frames each layout can hold – the mockups' own arrangements (spec §3): A is a big
 *  polaroid plus a second one overlapping it, B is two across the top and one down the right edge,
 *  C is a hero on two thirds of the sheet plus a smaller frame under the note. */
const FRAME_CAPACITY: Record<AlbumLayout, number> = { A: 2, B: 3, C: 2 }

/** ⚠ ONLY A AND C CARRY THE CHAPTER's NAME. `AlbumLayoutA.vue` and `AlbumLayoutC.vue` draw
 *  `AlbumSheetTitle`; `AlbumLayoutB.vue` does not – a sheet of three frames and a boarding pass has
 *  no room for a heading. So the cursor SKIPS B at a chapter's first sheet: a chapter opening on B
 *  would be a chapter with no name on it, and the chapter rail's door would land the reader on a
 *  page that does not say where they are. Every other sheet takes whatever the rotation offers. */
function opensAChapter(layout: AlbumLayout): boolean {
  return layout !== 'B'
}

/** The ruled «1-3 страницы на каждую главу». */
const MAX_CHAPTER_SHEETS = 3

/** A chapter's frame budget – DERIVED from the rotation rather than typed, because it is now a
 *  consequence of it: any three consecutive layouts are a permutation of A, B and C, so three
 *  sheets hold 2 + 3 + 2 wherever the cursor happens to stand.
 *
 *  ⚠ IT WAS 8 UNTIL 20.09 and the ceiling fell by one with the rotation: a chapter used to be
 *  opener-B-B (2 + 3 + 3) and can no longer hold two B sheets, because two B sheets in one chapter
 *  of three means two of them adjacent. Reported to him as a consequence of the ruling. */
const MAX_CHAPTER_FRAMES = LAYOUT_ROTATION.reduce((n, layout) => n + FRAME_CAPACITY[layout], 0)

/** How a chapter's n frames sit on the sheets it earned: one each first – his «пустых листов не
 *  бывает», guaranteed by construction and not by a table – then levelled up, the emptiest sheet
 *  first and the later of two equals winning, until they are all placed or every sheet is full.
 *
 *  ⚠ THE CAPS ARE THE LAYOUTS', WHICH IS WHY THIS IS AN ALGORITHM AND NOT THE OLD `SHEET_SPLITS`
 *  TABLE. The old table was keyed on the sheet's POSITION (the opener draws two, the rest three),
 *  which was only true while position decided layout. Under the rotation it does not. */
function spreadFrames(frames: number, caps: readonly number[]): number[] {
  const take = caps.map(() => 0)
  let left = frames
  for (let i = 0; i < take.length && left > 0; i++) {
    take[i] = 1
    left -= 1
  }
  while (left > 0) {
    let at = -1
    for (let i = 0; i < take.length; i++) {
      if (take[i] >= caps[i]) continue
      if (at === -1 || take[i] <= take[at]) at = i
    }
    if (at === -1) break
    take[at] += 1
    left -= 1
  }
  return take
}

/** One chapter's sheets: the layout each is drawn on and how many frames sit on it. */
export interface SheetPlan {
  layouts: AlbumLayout[]
  takes: number[]
}

/** The sheets one chapter earns by the rotation alone: the FEWEST of the rotation's next layouts
 *  that can hold its frames, and how many frames sit on each. The walk starts at `cursor`, which is
 *  `cursorAfter` the layout the book drew last (`planBook` derives it – this used to hand back the
 *  next cursor itself, which is the same number only while every chapter takes the rotation's own run). */
function chapterSheetPlan(cursor: number, frames: number): SheetPlan {
  let at = cursor
  if (!opensAChapter(LAYOUT_ROTATION[at % LAYOUT_ROTATION.length])) at += 1
  const offered: AlbumLayout[] = []
  for (let i = 0; i < MAX_CHAPTER_SHEETS; i++) offered.push(LAYOUT_ROTATION[(at + i) % LAYOUT_ROTATION.length])
  let count = MAX_CHAPTER_SHEETS
  for (let k = 1; k <= MAX_CHAPTER_SHEETS; k++) {
    const room = offered.slice(0, k).reduce((n, layout) => n + FRAME_CAPACITY[layout], 0)
    if (room >= frames) {
      count = k
      break
    }
  }
  const layouts = offered.slice(0, count)
  return { layouts, takes: spreadFrames(frames, layouts.map((l) => FRAME_CAPACITY[l])) }
}

// =================================================================================================
// ⭐⭐ LB-note (owner 10.10, decisions.md №38) – THE SHEET THAT CARRIES A CHECKLIST IS LAYOUT A
// =================================================================================================
//
// WHY: the checklist lies UNDER the prose now (`AlbumNoteCard.vue`), so the graduate's and the heirloom's note is the tallest scrap in the book – a date row, a sentence and three
// to five facts, at the floor hand. Layout A is the one layout with no ticket and no tag for that scrap to land on (its furniture is a heading, a patch and a doodle). MEASURED on
// 768 posed graduate books (the 48 posed careers x 4 voices x graduation at 20 / 21 / 22 / 23, the rotation as it stood): the checklist sheet fell on A 172 times, on B 384 and on C 212;
// and on the 292 B sheets that drew a pass and the 56 C sheets that drew a tag the resolved note touched it EVERY time. The heirloom never had the problem: it leads the book's first sheet,
// which the rotation already makes A (24 of 24 clear). So the cheap lever is the engine's – the sheet takes its layout before any pixel does.
//
// ⚠⚠ A CHOICE, NEVER A DRAW. Nothing here reads a stream: the layouts are picked by a depth-first search over a handful of lawful runs (at most ten a chapter, five chapters), in a fixed order,
// from facts the assembly already holds. No MAIN draw and no sub-stream is added; the same world assembles the same book.
//
// ⚠⚠ THE PIN IS INSIDE HIS 20.09 LAW AND NEVER OVER IT. A plain «this sheet is A» breaks three things the rotation exists to keep: two sheets in a row on one layout (the sheet before it can
// be A as well), a chapter opening on B, and a sheet holding more frames than its layout draws (a three-frame B sheet turned A silently loses its third picture). So an option is lawful only
// when no two neighbours share a layout ACROSS a chapter break too, the opener is not B, a chapter of three shows all three, and the capacities hold. The rotation's own answer is ALWAYS
// tried first, so a book with no checklist is byte-identical to what it was (the 335-sheet sweeps and every other book are untouched), and a chapter takes another run only when
// its own sheet would not be A. When no run exists for it (a one-sheet chapter straight after another pinned A), the LATER pin yields and the rotation stands – the law outranks the lever,
// and the resolver still places that note as it places any other.
//
// WHICH SHEET: the one that holds the candidate carrying `lines` – `noteOf` hands the sheet the checklist of the first candidate on it that has one, so this asks the same question.

/** The rotation's cursor after `layout` was drawn: where the NEXT chapter's walk begins (`null` = the book's start). */
function cursorAfter(layout: AlbumLayout | null): number {
  return layout === null ? 0 : (LAYOUT_ROTATION.indexOf(layout) + 1) % LAYOUT_ROTATION.length
}

/** Which sheet of a plan holds the chapter's frame number `index` – frames are dealt in order, `takes[i]` to sheet i. */
function sheetHolding(takes: readonly number[], index: number): number {
  let edge = 0
  for (const [sheet, take] of takes.entries()) {
    edge += take
    if (index < edge) return sheet
  }
  return takes.length - 1
}

/** EVERY run of layouts a chapter of `frames` frames may take after a sheet drawn on `prev`: 1 to 3 sheets, no two neighbours alike (the first against `prev`), no opener on B, three
 *  sheets showing all three, the frames fitting the capacities, and a frame for every sheet. Fewer sheets first, then in the rotation's own order. */
function lawfulRuns(prev: AlbumLayout | null, frames: number): SheetPlan[] {
  const out: SheetPlan[] = []
  const grow = (run: AlbumLayout[], sheets: number): void => {
    if (run.length === sheets) {
      if (sheets === MAX_CHAPTER_SHEETS && new Set(run).size !== sheets) return
      const caps = run.map((layout) => FRAME_CAPACITY[layout])
      if (caps.reduce((n, cap) => n + cap, 0) >= frames) out.push({ layouts: run, takes: spreadFrames(frames, caps) })
      return
    }
    const before = run.length === 0 ? prev : (run[run.length - 1] as AlbumLayout)
    for (const layout of LAYOUT_ROTATION) {
      if (layout === before || (run.length === 0 && !opensAChapter(layout))) continue
      grow([...run, layout], sheets)
    }
  }
  for (let sheets = 1; sheets <= Math.min(MAX_CHAPTER_SHEETS, frames); sheets++) grow([], sheets)
  return out
}

/** ⭐ THE BOOK'S LAYOUT PLAN: for every chapter the layouts of its sheets and the frames on each, with every sheet that carries a checklist drawn on A wherever the laws above allow it.
 *  A chapter's options are the rotation's own run first and then every other lawful run; the search keeps the first option of each chapter that lets the rest of the book be planned.
 *
 *  ⚠ ONE SHAPE NO RUN CAN SEAT, AND IT IS FRAME ARITHMETIC AND NOT A CHOICE: the FIFTH frame (index 4) of a FULL seven-frame chapter. Seven frames fill 2 + 3 + 2 exactly, so every
 *  arrangement of the three layouts deals frames 2-4 or 4-6 to the three-frame B sheet; no lawful run puts index 4 on an A. MEASURED on the 768 posed graduate books: 68 of them (17 of the
 *  192 career-and-graduation-age pairs, four voices each) are that shape and keep the rotation's B; every graduate who is the LAST frame of her chapter is seated. The pin yields there
 *  (it is a pin, not a reason to drop a moment from a chapter) and the resolver places that note as it places any other.
 *
 *  `pinChecklists` is the BEFORE-ARM and nothing else reads it: `false` is the rotation alone, the layout of every book until 10.10 – `tests/lb-note-layout-pin.test.ts` plans with and without
 *  it, so the arm that says the pin matters cannot go idle (the way `Tuning.headAir` keeps round 48's «before» alive). The chapters need only what the search reads: how many candidates, and which carry lines. */
export function planBook(chapters: readonly { candidates: readonly { lines?: readonly string[] }[] }[], pinChecklists = true): SheetPlan[] {
  const pins = chapters.map((chapter) => chapter.candidates.flatMap((c, k) => ((c.lines?.length ?? 0) > 0 ? [k] : [])))
  const solve = (at: number, prev: AlbumLayout | null, active: ReadonlySet<number>): SheetPlan[] | null => {
    if (at === chapters.length) return []
    const frames = chapters[at].candidates.length
    const own = chapterSheetPlan(cursorAfter(prev), frames)
    const options = [own, ...lawfulRuns(prev, frames).filter((run) => run.layouts.join() !== own.layouts.join())]
    for (const option of options) {
      if (active.has(at) && !pins[at].every((k) => option.layouts[sheetHolding(option.takes, k)] === 'A')) continue
      const rest = solve(at + 1, option.layouts[option.layouts.length - 1], active)
      if (rest) return [option, ...rest]
    }
    return null
  }
  const pinned = pinChecklists ? pins.flatMap((chapterPins, at) => (chapterPins.length > 0 ? [at] : [])) : []
  // every pin if the laws allow; else the LATEST yields first (the heirloom, on the first sheet, is A by the rotation itself)
  for (let keep = pinned.length; keep > 0; keep--) {
    const plan = solve(0, null, new Set(pinned.slice(0, keep)))
    if (plan) return plan
  }
  return solve(0, null, new Set()) ?? []
}

/** The §5 thirds rule over the chapter's selection: with n frames picked, no corpus KIND may hold
 *  more than max(1, floor(n / 3)) of them – equal to or stricter than «ни один род не занимает
 *  больше трети её листов» at every n, and the floor of one keeps a two-frame chapter from being
 *  two injuries. The guard against the measured adult bulk: 248 season closes and 127 layoffs
 *  against 95 titles, which selection on «significance» alone would ride into the injury ward.
 *  Closers are exempt: the ruled closing frames are not a «род» crowding anything out. */
function groupCapOf(n: number): number {
  return Math.max(1, Math.floor(n / 3))
}

function selectRepresentatives(candidates: AlbumCandidate[], budget: number): AlbumCandidate[] {
  // one frame per week: a title and its cheque in one week are one moment, and the higher priority
  // names it. Closers keep their own weeks even where they collide – the farewell and the last page
  // are two scenes in two places and may fall in one week on a career that played to the very end –
  // and a prologue moment has no week to collide on.
  const byWeek = new Map<number, AlbumCandidate>()
  const keep: AlbumCandidate[] = []
  for (const c of candidates) {
    if (c.closer || c.week === null) {
      keep.push(c)
      continue
    }
    const seat = byWeek.get(c.week)
    if (!seat || c.priority > seat.priority) byWeek.set(c.week, c)
  }
  const closers = keep.filter((c) => c.closer)
  const ordinary = [...keep.filter((c) => !c.closer), ...byWeek.values()].sort(
    (a, b) => b.priority - a.priority || (a.week ?? -1) - (b.week ?? -1),
  )

  const picked: AlbumCandidate[] = [...closers]
  const room = () => budget - picked.length
  // greedy under the widest cap the rule can allow (the budget's own third), then tightened: the
  // honest cap depends on the final count, so the pass repeats with it until nothing moves (the cap
  // only shrinks – this terminates)
  let cap = groupCapOf(budget)
  for (let pass = 0; pass < 4; pass++) {
    for (const c of ordinary) {
      if (room() <= 0) break
      if (picked.includes(c)) continue
      const held = picked.filter((p) => !p.closer && p.occasion.kind === c.occasion.kind).length
      if (held >= cap) continue
      picked.push(c)
    }
    const honest = groupCapOf(picked.length)
    if (honest >= cap) break
    cap = honest
    for (const kind of new Set(picked.filter((p) => !p.closer).map((p) => p.occasion.kind))) {
      const members = picked
        .filter((p) => !p.closer && p.occasion.kind === kind)
        .sort((a, b) => b.priority - a.priority)
      for (const extra of members.slice(cap)) picked.splice(picked.indexOf(extra), 1)
    }
  }
  return picked.sort((a, b) => (a.week ?? -1) - (b.week ?? -1) || a.ageYears - b.ageYears || closerRank(a) - closerRank(b))
}

/** farewell is the last match and `career-ended` is the book's very last frame – ruled – so two
 *  closers that land on the SAME week (a career that played to the very end) order themselves;
 *  everything else ties at zero. Since 20.09 they usually carry different weeks and the
 *  chronological sort does the work on its own. */
function closerRank(c: AlbumCandidate): number {
  if (c.occasion.id === 'career-ended') return 2
  if (c.occasion.id === 'farewell') return 1
  return 0
}

// =================================================================================================
// §5 FRAMES – week + occasion, resolved by the §4 ladder: event painting, travel, portrait
// =================================================================================================

/** A rung she has to TRAVEL to – the exact complement of the domestic ladder, and asked through the
 *  SAME two predicates that write the entry ledgers. `enterEvent` (world/entries.ts) pushes onto
 *  `internationalEntryWeeks` iff `isCappedTier` and onto `proEntryWeeks` iff `isCappedProTier`, so
 *  reusing them is what keeps the derived half of the away test below from drifting away from the
 *  recorded half the day a rung changes family. */
function awayTier(tier: TierId): boolean {
  return isCappedTier(tier) || isCappedProTier(tier)
}

/** WHICH MILESTONE TYPES DATE A WEEK SHE PLAYED, and it is a short list ON PURPOSE – every row here
 *  is written by `finalizeTournament` (world.ts) at the award, carrying THAT event's own tier, so
 *  the milestone's week is the week she was there.
 *
 *  ⚠⚠ `international` IS DELIBERATELY ABSENT AND THE REASON IS A ONE-LINE TRAP. `enterEvent` captures
 *  it at `world.week` – the week the FORM went in – while the entry ledger beside it records
 *  `event.week`. Entries run up to `ENTRY_LOOKAHEAD` weeks ahead, so that milestone dates the
 *  kitchen table and not the airport, and reading it here would paint a journey home on a week she
 *  spent at home.
 *
 *  ⭐ `prize` IS PRESENT AND IT IS THE CHEAPEST REACH IN THE LIST: `prizeCents` is declared on the W
 *  rungs and above ONLY (calendar.ts – «NO junior level pays prize money», and the domestic ladder
 *  declares none either), so a first cheque is proof of a pro-rung week by construction. It is also
 *  why the home arm of the ladder case in `tests/albumBook.test.ts` had to move off `w15`: a w15
 *  prize week is an away week, always, and a case that called one «at home» was posing a world no
 *  engine path can reach. */
const AWAY_PROVING_MILESTONES = new Set<Milestone['type']>(['title', 'final', 'prize'])

/** ⭐⭐ WAS `week` AN AWAY WEEK? – the §4 ladder's rung 2, and it takes TWO kinds of evidence,
 *  because neither one of them reaches the whole career on its own.
 *
 *  ⚠⚠ THIS DOCBLOCK USED TO SAY THE TWO ENTRY LEDGERS ARE «persisted for the life of the career and
 *  never pruned (v15 / v36)». THAT SENTENCE WAS FALSE, and the rung was the smaller half of the
 *  damage. `pruneInternationalEntries` (world/planner.ts) filters BOTH to
 *  `w >= min(seasonStartWeek, ageWindowStartWeek)` and runs EVERY week out of `housekeep`
 *  (world/bookkeeping.ts); `state.ts`'s own field docs say it in a line each («pruned to the current
 *  season onward at housekeeping»); `world/brand.ts` reached the same floor independently. So a
 *  ledger-only test answers for the current season block and for nothing before it.
 *
 *  ⭐ AND IT WAS MEASURED BEFORE IT WAS FIXED, on five walked careers of ~1350 weeks each
 *  (docs/specs/the-album-2026-09.md §4): 119 frames assembled, 11 of them resolved at rung 1 and never
 *  asking the question at all, 42 of the remaining 108 sitting on a week that was away IN TRUTH – and
 *  the ledgers as the prune leaves them answered «away» for **0 of them**. Not one. The travel rung was
 *  not under-firing, it was not firing, on any of the five: the album's representatives are spread over
 *  a whole career and the ledger only ever holds the tail of it. Twelve painted journey scenes were
 *  unreachable art.
 *
 *  THE TWO SOURCES, and what each one can and cannot say:
 *    · THE ENTRY LEDGERS are COMPLETE for the weeks they still hold – every entry at any non-domestic
 *      rung, including a first-round exit that left no other trace anywhere – and they hold only the
 *      current season block / age window.
 *    · THE TROPHY CABINET (v31) and the award milestones are NEVER pruned, are dated, and
 *      carry their tier, so they reach the whole career. ⚠⚠ AND THEY ONLY KNOW FINALS AND FIRST
 *      CHEQUES – `AWAY_PROVING_MILESTONES` above is the whole list and it is three rows. That is the
 *      limit the owner named in the same breath as the source, it is stated rather than papered over,
 *      and it is what the numbers above measure: of the 42 truly-away frames the two sources together
 *      reach 24, and 23 of those actually draw a journey (the twenty-fourth is an injury frame, which
 *      refuses one by ruling). A first-round exit abroad four years ago is a trip the save cannot prove, and
 *      its frame takes the band portrait. A missing true journey costs one picture; an invented one
 *      would cost the book its credibility – the same trade `lastProvenCourtWeek` makes one page up.
 *
 *  ⚠ NO NEW PERSISTED STATE, deliberately: a per-week away flag would answer completely and is a
 *  schema move, which is the owner's to authorise and not an agent's to assume. */
function awayWeek(world: WorldState, week: number): boolean {
  if (world.internationalEntryWeeks.includes(week)) return true
  if (world.proEntryWeeks.includes(week)) return true
  for (const tier of TIER_LADDER) {
    if (!awayTier(tier)) continue
    const cabinet = world.trophiesByTier?.[tier]
    if (!cabinet) continue
    if (cabinet.titles.includes(week) || cabinet.finals.includes(week)) return true
  }
  for (const m of world.milestones) {
    if (!AWAY_PROVING_MILESTONES.has(m.type)) continue
    if (m.week === week && m.tier !== undefined && awayTier(m.tier)) return true
  }
  return false
}

/** ⭐⭐ ROUND 45 #8 – THE LADDER'S PICTURES FOR ONE FRAME, FIRST CHOICE FIRST. `[0]` is exactly what
 *  this function returned before the round (the rung 1 painting, else the journey, else the band
 *  portrait in the ruled mood), so a page whose frames already differ is byte-identical to the old
 *  one; the rest are the stand-ins `pickDistinct` may ask for, nearest first:
 *    rung 1 – none. A one-moment painting belongs to its occasion and no other face may wear it.
 *    rung 2 – the other three journey scenes of the SAME mood, rotating from the week's own scene.
 *    rung 3 – the faces of `PORTRAIT_STAND_INS` at the same band.
 *  ⚠ NO DRAW, NO STREAM: the rotation is the week number's, like the scene it rotates from. */
function frameArtOptions(world: WorldState, c: AlbumCandidate): { art: string; alt: string }[] {
  const stage = portraitStage(c.ageYears)
  // rung 1 – the event painting, where the occasion has one. The bride resolves through
  // `paintedStemFor` (the wave-7 wiring): band fallback, never a 404.
  const moment = MOMENT_FACE[c.occasion.id]
  if (moment) {
    const stem = paintedStemFor(stage, moment)
    // ⚠ THE BAND FALLBACK DECIDES THE ALT TOO, and `stem.endsWith` is how: a birth at thirty-one
    // DRAWS `lateCareer-norm`, so calling it «the week the baby came home» would describe a picture
    // that is not on screen. One reading, two consumers – the wave-7 wiring, generalised.
    const own = MOMENT_ALT[moment]
    return [{ art: paintingPath(stem), alt: stem.endsWith(moment) ? own : ALT_DRAFT.portrait }]
  }
  const eventStem = EVENT_STEM[c.occasion.id]
  if (eventStem) {
    return [
      { art: paintingPath(eventStem), alt: ALT_DRAFT[eventStem as keyof typeof ALT_DRAFT] ?? ALT_DRAFT.portrait },
    ]
  }
  const mood = ALBUM_MOOD[c.occasion.id] ?? 'norm'
  // rung 2 – the journey, on an away week whose mood has a journey face
  if (c.week !== null && awayWeek(world, c.week)) {
    const travelMood = travelMoodOf(mood)
    if (travelMood) {
      const week = c.week
      return TRAVEL_SCENES.map((_, k) => ({
        art: paintingPath(`travel-${travelMood}-${TRAVEL_SCENES[(week + k) % TRAVEL_SCENES.length]}`),
        alt: ALT_DRAFT.travel,
      }))
    }
  }
  // rung 3 – the band portrait at her age that week, in the ruled mood
  return [mood, ...(PORTRAIT_STAND_INS[mood] ?? [])].map((face) => ({
    art: paintingPath(paintedStemFor(stage, face)),
    alt: ALT_DRAFT.portrait,
  }))
}

/** ⭐⭐ ROUND 45 #8 – ONE PICTURE PER FRAME OF A PAGE, ASSIGNED TOGETHER. `options[i]` is frame i's
 *  pictures, first choice first; the answer is the index each frame takes and how many frames are
 *  left showing a picture an earlier one on the page already shows.
 *
 *  ⚠ IT IS A SEARCH AND NOT A «TAKE THE FIRST FREE ONE», because the greedy form is wrong exactly
 *  where it matters: a `happy` frame that took `norm` first would leave the `norm` frame after it no
 *  honest picture while a distinct assignment existed. Frames are at most three and options at most
 *  four, so every assignment is a handful; the winner is the one with the FEWEST repeats, and among
 *  those the one that keeps the EARLIEST frames on their earliest choices – so a page that already
 *  has three different pictures changes nothing, which `tests/round45-album-distinct-frames.test.ts`
 *  holds as the property that makes the whole change safe to ship.
 *
 *  ⚠ A POOL SMALLER THAN THE PAGE IS ANSWERED, NOT REFUSED: `clashes` is above zero, the frames that
 *  cannot be told apart keep their first choice, and nothing throws. Pure arithmetic over the lists
 *  it is given – no draw, no clock – so MAIN and every sub-stream are untouched. */
export function pickDistinct(options: readonly (readonly string[])[]): { picks: number[]; clashes: number } {
  let best: { picks: number[]; clashes: number } | null = null
  const picks: number[] = []
  const shown = new Map<string, number>()
  const walk = (i: number, clashes: number): void => {
    if (best !== null && clashes >= best.clashes) return
    if (i === options.length) {
      best = { picks: [...picks], clashes }
      return
    }
    for (let k = 0; k < options[i].length; k++) {
      const art = options[i][k]
      const held = shown.get(art) ?? 0
      picks[i] = k
      shown.set(art, held + 1)
      walk(i + 1, clashes + (held > 0 ? 1 : 0))
      shown.set(art, held)
    }
  }
  walk(0, 0)
  return best ?? { picks: options.map(() => 0), clashes: 0 }
}

/** The frames of ONE page, no two of them the same picture where the ladder has a way to say so. */
function distinctFramesOf(world: WorldState, own: readonly AlbumCandidate[], voice: Temperament): AlbumFrame[] {
  const options = own.map((c) => frameArtOptions(world, c))
  const { picks } = pickDistinct(options.map((row) => row.map((o) => o.art)))
  return own.map((c, i) => {
    const { art, alt } = options[i][picks[i]]
    const caption = c.occasion.voices[voice].caption
    const altC = ALT_REF_BY_TEXT.get(alt)
    // ⭐ L3-6: the refs ride beside the strings; a caption that is empty (not every frame is written under) has no ref, and an alt the table does not know would draw as it was.
    return { art, alt, caption, ...(altC ? { altC } : {}), ...(caption !== '' ? { captionC: selfKey(caption) } : {}) }
  })
}

// =================================================================================================
// §6 THE ANTУРАЖ – the one named sub-stream family, and every drawn thing on a sheet
// =================================================================================================

/** Per sheet, off `seed:album:flavour:<sheet id>` – re-derived at the call site, persisting
 *  nothing, MAIN untouched (invariant 2). The same sheet of the same career always deals the same
 *  seat, which is «из сида, чтобы не мигал» satisfied at zero cost. */
function flavourFor(seed: string, sheetId: string) {
  const rng = rngFromSeed(`${seed}:album:flavour:${sheetId}`)
  // ⭐ L3-6 (10.10): THE SAME DRAWS IN THE SAME ORDER, now bound to names so the refs beside the strings can use the numbers (seat number, then its letter, then the gate, then the row, then the venue,
  // twelve bars, the doodle - the order the template literals evaluated them in). The sub-stream key above is the one it always was.
  const seatNo = pickInt(rng, 1, 32)
  const seatLetter = 'ABCDEF'[pickInt(rng, 0, 5)]
  const seat = `${TICKET_WORDS.seat} ${seatNo}${seatLetter}`
  const gateNo = pickInt(rng, 1, 9)
  const gate = `${TICKET_WORDS.gate} ${gateNo}`
  const rowNo = pickInt(rng, 1, 32)
  const row = `${TICKET_WORDS.row} ${rowNo}`
  const venue = VENUE_POOL[pickInt(rng, 0, VENUE_POOL.length - 1)]
  const bars: number[] = []
  for (let i = 0; i < 12; i++) bars.push(pickInt(rng, 1, 4))
  const doodle = pickInt(rng, 0, 5)
  return { seat, gate, row, venue, bars, doodle, seatC: cp`Seat ${seatNo}${seatLetter}`, gateC: cp`Gate ${gateNo}`, rowC: cp`Row ${rowNo}` }
}

/** The ramp's four steps in order, lowest first – the one list `chapterStepOf` ranks by. */
const STEP_ORDER: readonly AlbumTierStep[] = ['budget', 'middle', 'high', 'elite']

/** ⭐ ROUND 47 #16 – THE STEP A CHAPTER'S CLUB PATCH IS SEWN IN (`albumChapterStep`): the highest step any tournament on the chapter's
 *  own pages sits on, read through the SAME `ALBUM_TIER_STEP` table the pass and the tag use. A chapter with no
 *  tournament in it (the childhood) is the first step – the domestic years, where every career starts. */
export function albumChapterStep(candidates: readonly { tier?: TierId }[]): AlbumTierStep {
  let best = 0
  for (const c of candidates) {
    if (c.tier !== undefined) best = Math.max(best, STEP_ORDER.indexOf(ALBUM_TIER_STEP[c.tier]))
  }
  return STEP_ORDER[best]
}

/** ⭐⭐ ROUND 47 #16 – THE CLUB PATCH GOES THE TICKET'S WAY («по аналогии с билетом разными цветами и с разными
 *  названиями вымышленными»): a name that VARIES and a colour that carries the rank. Both are DERIVED – nothing
 *  is rolled that was not rolled before:
 *    * THE NAME walks the pool by chapter. The career's ONE patch draw (`${seed}:album:flavour:patch`, the same
 *      key and the same single draw it has always made) gives the start, and chapter N wears the name N places
 *      on – so the openers of one book never repeat a club until the pool runs out (a per-sheet roll off six
 *      names repeated one in roughly three books of four), and it is still a pure function of (seed, chapter):
 *      re-opening the album reshuffles nothing, MAIN is untouched (invariant 2), no stream is new.
 *    * THE STEP is `albumChapterStep` – the rank the chapter reached, on the pass's own ramp. */
export function albumPatchFor(seed: string, chapterIndex: number, step: AlbumTierStep): AlbumClubPatch {
  const start = flavourStartOf(seed)
  return { name: ALBUM_PATCH_POOL[(start + chapterIndex) % ALBUM_PATCH_POOL.length], step }
}

const DOODLES: readonly AlbumDoodle[] = ['trophy', 'heart', 'sun', 'smile', 'globe', 'plane']
/** A doodle that fits the sheet's lead occasion where one obviously does; the flavour picks
 *  otherwise. Decoration, never a fact. */
const DOODLE_BY_KIND: Partial<Record<string, AlbumDoodle>> = {
  title: 'trophy',
  rare: 'trophy',
  international: 'plane',
  wedding: 'heart',
  // ⭐ wave 8b T6 – the same heart the wedding wears. A doodle is антураж, not a fact, and the two
  // occasions of the life family are the two the pool's heart was drawn for.
  birth: 'heart',
  prologue: 'smile',
}

// =================================================================================================
// ⭐⭐ ROUND 47 #14 – THE SMALL SNAPSHOT IN THE GAP
// =================================================================================================

/** ⭐ THE CAREER'S ONE FLAVOUR DRAW – the club patch's (`${seed}:album:flavour:patch`, the same key and the same single draw it has always made), now
 *  read in one place because TWO things walk from it: the club names (by chapter) and the small snapshots (by their order in the book). Nothing new
 *  is rolled and no key is new – a pure function of the seed, re-derived at the call site, persisting nothing, MAIN untouched (invariant 2). */
function flavourStartOf(seed: string): number {
  return pickInt(rngFromSeed(`${seed}:album:flavour:patch`), 0, ALBUM_PATCH_POOL.length - 1)
}

/** ⭐⭐ THE OWNER, 06.10: «у нас есть фотки, где она дома отдыхает, есть где на отдых ездила – их тоже можно небольшие добавлять на те страницы, где
 *  убрали горизонтальный билет или боковую бирку, чтобы пустоту немного заполнить». The art is the app's own (`art/weeks.ts`); this module spells the
 *  stems and `AlbumFillerPhoto.vue` adds the base, like every other painting on a sheet.
 *
 *  WHICH SHEETS: a sheet with no ticket, no tag AND no patch – layout B or C with no tournament on it (A always wears the patch). The engine says WHICH
 *  PICTURE; whether the gap has room is the resolver's (`placeFiller`), so a sheet can carry one and show none.
 *
 *  WHICH PICTURES – the honest subset, and what was left out:
 *    · HOLIDAY – the six `vac-*` paintings the family budget shows for a booked week (`VACATION_ART`).
 *    · REST – the three `off-*` off-season paintings (a fire and a window, a frozen lake, a warm court) and the week she rests a knock at home, which the
 *      app paints in two ages (`chores-young` for the young band, `chores-teen` for every later one – `weekHomeBand`'s own split).
 *    · NOT `study-*` (the exam fortnight is not rest), NOT `training` (it is training), NOT the sleepy journey set (it is the §4 ladder's own rung for an
 *      away week – a ticketless sheet is not a journey, and it already appears as a frame), and NOT on the prologue chapter (the child's chapter – a grown
 *      woman's holiday would be somebody else's childhood).
 *  WHICH KIND: the sheet's own mood (`ALBUM_MOOD` of its lead occasion) – a happy page gets a holiday picture, every other page a quiet one at home – and
 *  NEVER on a page that has its own painting or is the book's last word (`FILLER_NEVER_KINDS`: lineage, prologue, wedding, birth, closing). */
const FILLER_DIR = 'images/weeks/'

export type AlbumFillerKind = 'rest' | 'holiday'

export const ALBUM_FILLER_HOLIDAY: readonly string[] = ['vac-camping', 'vac-elite', 'vac-friends', 'vac-resort', 'vac-sea', 'vac-village']

export const ALBUM_FILLER_REST: Record<'young' | 'teen', readonly string[]> = {
  young: ['off-1', 'off-2', 'off-3', 'chores-young'],
  teen: ['off-1', 'off-2', 'off-3', 'chores-teen'],
}

const FILLER_NEVER_KINDS: ReadonlySet<string> = new Set(['lineage', 'prologue', 'wedding', 'birth', 'closing'])

/** Which kind of snapshot a sheet's occasions earn, or null for none. */
export function albumFillerKind(band: AlbumBand, occasions: readonly { id: string; kind: string }[]): AlbumFillerKind | null {
  const lead = occasions[0]
  if (!lead || band === 'prologue' || occasions.some((o) => FILLER_NEVER_KINDS.has(o.kind))) return null
  return ALBUM_MOOD[lead.id] === 'happy' ? 'holiday' : 'rest'
}

/** The stems a (band, kind) may draw from. */
export function albumFillerPool(band: AlbumBand, kind: AlbumFillerKind): readonly string[] {
  if (kind === 'holiday') return ALBUM_FILLER_HOLIDAY
  return band === 'young' ? ALBUM_FILLER_REST.young : ALBUM_FILLER_REST.teen
}

/** ⭐ THE WALK – like the club names: the k-th snapshot of a pool in this book is `pool[(start + k) % size]`, so no pool repeats a picture until it has
 *  shown them all, and nothing is rolled. `used` counts per pool across the whole book. */
interface FillerWalk {
  start: number
  used: Map<string, number>
}

/** The k-th snapshot of a (band, kind) pool in a book whose walk starts at `start` – pure, so the walk is a function the tests can call. */
export function albumFillerFor(start: number, band: AlbumBand, kind: AlbumFillerKind, k: number): AlbumFiller {
  const pool = albumFillerPool(band, kind)
  return { art: `${FILLER_DIR}${pool[(start + k) % pool.length] as string}.webp` }
}

function takeFiller(walk: FillerWalk, band: AlbumBand, kind: AlbumFillerKind): AlbumFiller {
  const key = kind === 'holiday' ? 'holiday' : band === 'young' ? 'rest:young' : 'rest:teen'
  const k = walk.used.get(key) ?? 0
  walk.used.set(key, k + 1)
  return albumFillerFor(walk.start, band, kind, k)
}

function ageLabelOf(age: number): string {
  return `${TICKET_WORDS.age} ${age}`
}

/** ⭐⭐ THE RANK'S STEP ON THE APP'S OWN FOUR-STEP RAMP – spec §4's «Цвет билета и бирки несёт ранг:
 *  чем выше ступень, тем насыщеннее», and the ONE place that decision is made.
 *
 *  ⚠⚠ A `Record<TierId, …>` AND NOT A PREDICATE CHAIN, which is the whole reason it is a table: the
 *  ladder has grown twice already (W2-LADDER's six W rungs, W3-ACT2's top four) and a
 *  `track === 'itf' ? … : …` would have absorbed each new rung silently into whatever branch it
 *  happened to fall through. This shape makes a seventeenth rung a COMPILE error, which is the only
 *  kind of totality worth having. `tests/albumBook.test.ts` walks `TIER_LADDER` and proves two things
 *  about it: every rung has a step, and the steps never go DOWN as the ladder goes up – which is §4's
 *  sentence, restated as something a machine can fail.
 *
 *  ⚠ THE GROUPING IS THE LADDER'S OWN FAMILIES, not four equal slices of sixteen. Each step is a
 *  thing a career can be IN for years, and the boundaries are the ladder's own handovers:
 *
 *    budget  local · regional · national    – the domestic ladder (`track: 'domestic'`), where she
 *                                             starts and where an adult who is not good enough stays
 *    middle  j30 · j60 · j300               – the junior international tour (`track: 'itf'`), no
 *                                             prize money: the «invest without knowing the return» years
 *    high    w15 … w100                     – `W_SERIES`, the adult ITF rungs, where the cheque is an
 *                                             insult but it is a cheque
 *    elite   wta125 … slam                  – the tour proper, the mandatory regime's home
 *
 *  ⚠ AND THE COLOURS ARE NOT HERE, WHICH IS THE POINT OF SHIPPING A STEP. `AlbumTierStep`'s note
 *  names the four `--tier-*` tokens; the engine may not know a hex. */
export const ALBUM_TIER_STEP: Record<TierId, AlbumTierStep> = {
  local: 'budget',
  regional: 'budget',
  national: 'budget',
  j30: 'middle',
  j60: 'middle',
  j300: 'middle',
  w15: 'high',
  w35: 'high',
  w50: 'high',
  w75: 'high',
  w100: 'high',
  wta125: 'elite',
  wta250: 'elite',
  wta500: 'elite',
  wta1000: 'elite',
  slam: 'elite',
}

/** What a ticket or a tag READS of a tournament: the rung, how far she went, when. A candidate is one; so is the book's tail fact (`albumTailFact`). */
type TournamentFact = Pick<AlbumCandidate, 'week' | 'ageYears' | 'tier' | 'finish'>

function ticketOf(c: TournamentFact, flavour: ReturnType<typeof flavourFor>, startYear: number = DEFAULT_START_YEAR): AlbumTicket {
  return {
    tier: TIERS[c.tier!].label,
    step: ALBUM_TIER_STEP[c.tier!],
    stage: c.finish === undefined ? '' : finishLabel(c.finish),
    venue: flavour.venue,
    dateLabel: c.week === null ? '' : weekSpan(c.week, startYear),
    gate: flavour.gate,
    seat: flavour.seat,
    row: flavour.row,
    bars: flavour.bars,
    gateC: flavour.gateC,
    seatC: flavour.seatC,
    rowC: flavour.rowC,
  }
}

function tagOf(c: TournamentFact, flavour: ReturnType<typeof flavourFor>): AlbumTag {
  return {
    stage: c.finish === undefined ? '' : finishLabel(c.finish),
    tier: TIERS[c.tier!].label,
    step: ALBUM_TIER_STEP[c.tier!],
    place: flavour.venue,
    ageLabel: ageLabelOf(c.ageYears),
    ageLabelC: ageRef(c.ageYears),
  }
}

// =================================================================================================
// §7 SHEETS AND CHAPTERS
// =================================================================================================

function noteOf(c: AlbumCandidate, hand: AlbumHand, own: readonly AlbumCandidate[] = [c], startYear: number = DEFAULT_START_YEAR): AlbumNote {
  return {
    text: hand.note,
    textC: selfKey(hand.note),
    dateLabel: c.week === null ? null : weekSpan(c.week, startYear),
    ageLabel: ageLabelOf(c.ageYears),
    ageLabelC: ageRef(c.ageYears),
    // ⭐ v86 – `[]` on every candidate that carries no checklist, which is almost all of them: the
    // ruled form exists in the shape and had no writer until the dynasty needed to print numbers a
    // corpus string is forbidden to carry. The graduate's championship record joined it on the same
    // argument (`collegeLeagueLines`).
    //
    // ⚠⚠ THE CHECKLIST IS THE SHEET's, NOT THE LEAD FRAME's, AND THAT IS A REPAIR WITH A MEASUREMENT
    // BEHIND IT (the college scene, 24.09). This read used to be `c.lines ?? []` – the LEAD frame's
    // alone – which was invisible while the heirloom was the only writer, because it always leads the
    // prologue's first sheet. The graduate does not: `portraitStage` puts 17–22 in ONE band, so a
    // girl who enrolled at eighteen and graduated at twenty-two shares her chapter with everything
    // she did at seventeen, and those weeks sort ahead of the degree. MEASURED on the posed
    // teen-band graduate: with no earlier teen moment the checklist printed its three rows, and with
    // ONE it printed none – the record was built, banked and dropped on the way to the page.
    // «Captured is not surfaced», and the fix is to ask the SHEET for its checklist.
    //
    // ⚠ IT CHANGES NOTHING FOR THE HEIRLOOM, which is why a generalisation was safe: it is the only
    // candidate on its sheet that carries lines, so «the first frame with a checklist» and «the lead
    // frame» are the same candidate there. Two sheets can never both be claimed – the heirloom rides
    // the prologue chapter and the graduate the teen/adult one.
    //
    // ⚠ AND ONLY THE LINES MOVED. `dateLabel` and `ageLabel` stay the LEAD's, because they date the
    // sheet, and `text` stays the SPEAKER's, because A32's closing words win their sheet by ruling.
    lines: own.find((x) => (x.lines?.length ?? 0) > 0)?.lines ?? [],
    // ⭐ L3-6: the refs of THE SAME candidate's checklist (the sheet's first one that has lines) - present exactly when it is.
    ...((): { linesC?: readonly (CopyRef | null)[] } => {
      const withLines = own.find((x) => (x.lines?.length ?? 0) > 0)
      return withLines?.linesC ? { linesC: withLines.linesC } : {}
    })(),
  }
}

interface BuiltChapter {
  band: AlbumBand
  candidates: AlbumCandidate[]
}

function sheetsOf(
  world: WorldState,
  chapter: BuiltChapter,
  chapterIndex: number,
  voice: Temperament,
  plan: { layouts: AlbumLayout[]; takes: number[] },
  fillers: FillerWalk,
): AlbumSheetModel[] {
  const { band, candidates } = chapter
  const title = ALBUM_CHAPTER_TITLES[band]
  const ages = candidates.map((c) => c.ageYears)
  const ageFrom = Math.min(...ages)
  const ageTo = Math.max(...ages)
  const chapterAgeLabel =
    ageFrom === ageTo ? ageLabelOf(ageFrom) : `${TICKET_WORDS.age} ${ageFrom} – ${ageTo}`
  const chapterAgeRef = ageFrom === ageTo ? ageRef(ageFrom) : ageRangeRef(ageFrom, ageTo)
  const patch = albumPatchFor(world.seed, chapterIndex, albumChapterStep(candidates))
  const sheets: AlbumSheetModel[] = []
  let at = 0
  for (const [index, take] of plan.takes.entries()) {
    const own = candidates.slice(at, at + take)
    at += take
    const layout = plan.layouts[index]
    const id = `${band}-${index + 1}`
    const flavour = flavourFor(world.seed, id)
    const lead = own[0]
    // the sheet speaks for its lead frame – EXCEPT the closing sheet, whose words are A32's own
    // (the corpus's §5: «this is what the closing sheet says»): farewell may lead it chronologically,
    // and the book's last word is still the handing over, not the last match.
    const speaker = own.find((c) => c.occasion.id === 'career-ended') ?? lead
    const hand = speaker.occasion.voices[voice]
    // the sheet's own tournament fact, if it holds one – an honest sheet carries no invented trip.
    // A fact WITH a finish (a title, a final) makes the better pass than a cheque or an entry.
    const facts = own.filter((c) => c.tier !== undefined)
    const tournament = facts.find((c) => c.finish !== undefined) ?? facts[0] ?? null
    // ⭐ ROUND 47 #14 – the three objects that fill a sheet's gap are settled first; a sheet with none of them may carry a small snapshot
    const ticket = layout === 'B' && tournament ? ticketOf(tournament, flavour, world.startYear) : null
    const tag = layout === 'C' && tournament ? tagOf(tournament, flavour) : null
    const sheetPatch = layout === 'A' ? patch : null
    const fillerKind = ticket || tag || sheetPatch ? null : albumFillerKind(band, own.map((c) => c.occasion))
    // ⭐ ROUND 48 #1a – layout B's gap is a 400px strip and holds TWO snapshots: a B sheet takes the NEXT picture of its pool as well, so the pair is two
    // different paintings by construction (the walk never repeats before the pool is shown). Layout C's gap is a narrow column – it keeps one.
    const filler = fillerKind ? takeFiller(fillers, band, fillerKind) : null
    const pair = filler && fillerKind && layout === 'B' ? takeFiller(fillers, band, fillerKind).art : null
    sheets.push({
      id,
      layout,
      chapterIndex,
      chapterTitle: title,
      chapterTitleC: CHAPTER_TITLE_REF[band],
      ageLabel: chapterAgeLabel,
      ageLabelC: chapterAgeRef,
      frames: distinctFramesOf(world, own, voice),
      note: noteOf(lead, hand, own, world.startYear),
      line: hand.line,
      lineC: selfKey(hand.line),
      ticket,
      tag,
      patch: sheetPatch,
      filler: filler && pair ? { ...filler, pair } : filler,
      doodles: [DOODLE_BY_KIND[lead.occasion.kind] ?? DOODLES[flavour.doodle]],
    })
  }
  return sheets
}

/** Which band chapter a career week belongs to. Career ages start at 13, so `portraitStage` can
 *  never answer `jun` here; the prologue chapter is built from the trace, never from a week. */
function bandOfAge(age: number): AlbumBand {
  const stage = portraitStage(age)
  return stage === 'jun' ? 'young' : stage
}

// =================================================================================================
// ⭐⭐ ROUND 48 #1b / #1c – THE BOOK'S LAST TWO SHEETS WEAR WHAT THE CAREER REALLY WON
// =================================================================================================
//
// THE OWNER, 07.10 (round 47 №14 reopened – the small snapshots left the tail still empty): «на последней странице и предпоследней всё ещё остались пропуски,
// на последней повесь вертикальную бирку w1000 справа, а на предпоследней зеленый билет на Шлем внизу».
//
// WHY THE TAIL IS THE ONE PLACE A SNAPSHOT NEVER FILLED: `FILLER_NEVER_KINDS` keeps a small holiday picture off «the book's last word» (the closing kinds), and in a
// finished career the closing frames sit on exactly the last two sheets. So the gap the sheet's layout leaves – layout C's right-hand column where the baggage tag
// would hang, layout B's bottom strip where the boarding pass would – stayed EMPTY on those two pages and only there. The owner's answer is to hang the real
// object in the real gap: the vertical tag on the LAST sheet, the ticket on the one before it.
//
// ⭐ THE TRUTHFULNESS GATE – the variability law (a page may only carry a fact the career has). The tag is a WORLD TOUR 1000 tag and the ticket is a GRAND SLAM ticket,
// so each is hung only for a career whose never-pruned cabinet (`trophiesByTier`, the one dated per-tier ledger – `lastProvenCourtWeek`'s own note) holds a title or a
// lost final at that rung; a career without one keeps the sheet exactly as it was (a snapshot, or the empty gap). What it prints is that appearance's own: the stage
// it reached (`finishLabel`), the rung's label, the calendar week (`weekSpan`) and her age that week.
//
// ⭐ DERIVED, NEVER DRAWN: the fact is a read of the cabinet, and the seat, gate, row, venue and barcode are the SHEET'S OWN flavour (`flavourFor(seed, sheet.id)` – the
// key every ticket of the book already uses, re-derived at the call site). No stream is new, nothing is rolled, nothing persists, MAIN is untouched (invariant 2).
//
// ⚠ IT HANGS WHERE THE LAYOUT HAS THE FRAME AND NOWHERE ELSE: a C last sheet (that is where a tag lives) and a B second-to-last sheet (that is where a pass lives), and
// only when the sheet carries no tag or ticket of its own (it would not be a gap). A tail of other layouts keeps what it had – an A sheet is full (its patch), and a
// tag cannot hang in B's strip nor a pass in C's column. The childhood chapter never wears them (a grown woman's keepsake on a child's page).
// ⚠ AND IT IS AN ASK, NOT A GIVEN (`tail: true` on the wire): the closing sheet of a career whose walls drifted carries the ARC's words, and the longest of those
// (a 68-character loose line against a corpus whose longest is 52 – measured on his own save's last page) leaves the tag's column no clear paper. The resolver decides
// per sheet whether the gap is clear – at the tag's size, or one rung smaller – and a page with no room goes without it rather than put a line over a tag.
// ⚠ THE GREEN IS THE SLAM TICKET'S ALONE (`AlbumTicket.paint`): the tag is a W1000 tag on its own tier's paper, and every other Slam ticket in a book keeps the
// elite ink it has always had – he asked for this one page's ticket.

/** The two rungs the tail hangs: the tag's and the ticket's. */
export const ALBUM_TAIL_TAG_TIER: TierId = 'wta1000'
export const ALBUM_TAIL_TICKET_TIER: TierId = 'slam'

/** ⭐ HER LATEST TITLE AT `tier` – and, for a career that reached the rung and never won it, her latest LOST FINAL – read off the cabinet; null when the cabinet holds
 *  neither (the gate). `finish` is the ticket's own index (0 champion, 1 runner-up). A pure read: no draw, no write. */
export function albumTailFact(world: WorldState, tier: TierId): { week: number; finish: number } | null {
  const cabinet = world.trophiesByTier?.[tier]
  if (!cabinet) return null
  if (cabinet.titles.length > 0) return { week: Math.max(...cabinet.titles), finish: 0 }
  if (cabinet.finals.length > 0) return { week: Math.max(...cabinet.finals), finish: 1 }
  return null
}

/** The childhood chapter's sheets (`prologue-N`). */
function isChildhoodSheet(sheet: AlbumSheetModel): boolean {
  return sheet.id.startsWith('prologue-')
}

/** ⭐ THE TAIL. Mutates the assembled `sheets` array (a local the assembly owns), never the world. See the header above. Both objects carry `tail: true`, which tells
 *  the resolver they are an ASK and not a fact of the sheet: it draws one only where the gap is clear (`placeSheet`), so a page too full to hold it goes without it.
 *  ⚠ THE SHEET KEEPS ITS SMALL SNAPSHOT: the resolver draws whichever the gap can hold – the hung object first – so a page that declines the object still gets its
 *  picture, and the engine does not guess at room (that is the resolver's, `placeFiller`'s own rule). */
function hangTail(world: WorldState, sheets: AlbumSheetModel[]): void {
  const factAt = (tier: TierId): TournamentFact | null => {
    const fact = albumTailFact(world, tier)
    return fact ? { week: fact.week, ageYears: kidAgeAt(world, fact.week), tier, finish: fact.finish } : null
  }
  const last = sheets.length - 1
  const lastSheet = sheets[last]
  if (lastSheet && lastSheet.layout === 'C' && !lastSheet.tag && !isChildhoodSheet(lastSheet)) {
    const fact = factAt(ALBUM_TAIL_TAG_TIER)
    if (fact) sheets[last] = { ...lastSheet, tag: { ...tagOf(fact, flavourFor(world.seed, lastSheet.id)), tail: true } }
  }
  const prevSheet = sheets[last - 1]
  if (prevSheet && prevSheet.layout === 'B' && !prevSheet.ticket && !isChildhoodSheet(prevSheet)) {
    const fact = factAt(ALBUM_TAIL_TICKET_TIER)
    if (fact) {
      sheets[last - 1] = {
        ...prevSheet,
        ticket: { ...ticketOf(fact, flavourFor(world.seed, prevSheet.id), world.startYear), paint: 'slam', tail: true },
      }
    }
  }
}

// =================================================================================================
// §8 THE ASSEMBLY
// =================================================================================================

/** ⭐⭐ THE BOOK, WHOLE – a pure read of the world, assembled when the section opens.
 *
 *  Chapters: 1 = the prologue (exists iff the v84 trace is non-null AND holds a frame-worthy
 *  moment), then the lived bands, each existing iff it earned at least one frame – «сколько прошла,
 *  столько и покажем», no empty chapters and no empty sheets, ever. A wizard career honestly starts
 *  at the bands; a career that stopped at nineteen never grows an adult chapter.
 *
 *  ⚠ ZERO DRAWS outside `seed:album:flavour:*`, ZERO writes anywhere: two calls on the same world
 *  return deep-equal books, flavour included, and the world is byte-identical after (the unit suite
 *  pins both). */
export function assembleAlbum(world: WorldState): AlbumBook {
  // the parent's hand is keyed on WHO SHE IS – birth, the voice bibles' own rule (the corpus's §2);
  // the arc is where the walls' drift gets its say, on the closing sheet alone
  const voice = world.temperament ?? temperamentFor(world.seed)

  const pool = [
    ...titleCandidates(world),
    ...finalCandidates(world),
    ...seasonCandidates(world),
    ...bodyCandidates(world),
    ...onceCandidates(world),
    ...assetCandidates(world),
    ...rareCandidates(world),
    ...closerCandidates(world),
  ]

  const chapters: BuiltChapter[] = []
  // ⭐ v86 – the heirloom leads the prologue chapter when there is a line behind her, and is absent
  // on every other career. ⚠ IT DOES NOT NEED A WALKED CHILDHOOD OF ITS OWN: the chapter is built
  // when either has something to show, so a dynasty career opened by a bench (no trace) still gets
  // its one page, and a wizard career with no line still gets exactly the chapter it always got.
  const prologueMoments = [
    ...dynastyCandidates(world),
    ...(world.prologueTrace ? prologueCandidates(world.prologueTrace) : []),
  ]
  if (prologueMoments.length > 0) {
    chapters.push({ band: 'prologue', candidates: prologueMoments.slice(0, MAX_CHAPTER_FRAMES) })
  }
  for (const band of ['young', 'teen', 'adult', 'lateCareer'] as const) {
    const own = pool.filter((c) => {
      if (c.week === null) return false
      if (bandOfAge(c.ageYears) !== band) return false
      // the occasion's own band list is a corpus constraint: handwriting exists only for the bands
      // the document declared, and a frame with no words is not built (the corpus doc's §4)
      return c.occasion.bands.includes(band)
    })
    if (own.length === 0) continue
    const picked = selectRepresentatives(own, MAX_CHAPTER_FRAMES)
    if (picked.length > 0) chapters.push({ band, candidates: picked })
  }

  const sheets: AlbumSheetModel[] = []
  const chapterRows: AlbumChapter[] = []
  // the rotation runs over the WHOLE book, not over a chapter: that is what keeps two sheets either
  // side of a chapter break from sharing a layout (his «одинаковых подряд просто не было»).
  // ⭐ LB-note: it is planned for the whole book at once (`planBook`) – the rotation's own run for
  // every chapter, except that a sheet carrying a checklist is drawn on A where his laws allow it.
  const plans = planBook(chapters)
  // ⭐ ROUND 47 #14 – the small snapshots walk their pools from the career's one flavour draw, across the whole book (`takeFiller`)
  const fillers: FillerWalk = { start: flavourStartOf(world.seed), used: new Map() }
  for (const [i, chapter] of chapters.entries()) {
    const own = sheetsOf(world, chapter, i + 1, voice, plans[i], fillers)
    chapterRows.push({
      index: i + 1,
      title: ALBUM_CHAPTER_TITLES[chapter.band],
      titleC: CHAPTER_TITLE_REF[chapter.band],
      ageLabel: own[0].ageLabel,
      ...(own[0].ageLabelC ? { ageLabelC: own[0].ageLabelC } : {}),
      sheetCount: own.length,
      firstSheet: sheets.length,
    })
    sheets.push(...own)
  }

  // ⭐ THE ARC – on the closing sheet, DISPLACING the `career-ended` sheet's note and line when the lean
  // moved (the corpus's §5: «this document writes nothing for the never-drifted case. That is not
  // an omission; it is the ruling» – the other eight careers keep A32's own words). The direction
  // is the OPEN axis's lean, the engine's own sign: positive is the armable direction – toward the
  // pole she was not born on – which for the walls machinery means she came OUT (`wallsGrowable`'s
  // note in engine/spirit.ts); negative means she drew in.
  //
  // ⚠⚠ AND THE REG-ONLY CAREER IS REACHABLE, WHICH THE SILENT CONDITION USED TO HIDE. Traced through
  // the only writer (`driftWalls`, engine/spirit.ts) on 20.09, because a branch that looks reachable
  // and is not – or the reverse – is this repo's oldest defect family. The pass visits both axes with
  // ONE set of inputs (`kicked`, `retained`, `herself`, and the same three per-week steps); the ONLY
  // thing that differs between them is `wallsGrowable(birth, axis)`, and it enters in exactly one
  // branch – «beyond her baseline», `value += w.growthPerWeek`. So:
  //
  //   * KICKS move both axes by the same `risePerWeek` and REPAIR walks both back by the same
  //     `repairPerWeek`, from the same start – a career that only ever suffered or healed carries
  //     `open === reg` at every week, which is precisely what his own nine saves showed
  //     (§4b: `{open: 43, reg: 43}`, then `{open: 66, reg: 66}`, and `{0, 0}` on the other eight);
  //   * the growth branch is the one that can move ONE axis, and it needs the axis to be growable.
  //     `wallsGrowable` is `openness === 'private'` for `open` and `intensity === 'intense'` for
  //     `reg`, so the two disagree for exactly the two mixed girls: `fiery` (open + intense) grows on
  //     `reg` alone, `quiet` (private + steady) on `open` alone.
  //
  // `quiet` therefore lands in the condition below and is written for. **`fiery` does not**: a fiery
  // girl on a caring bond whose parent bought the psychologist and held the `'herself'` focus becomes
  // measurably steadier – `{open: 0, reg: +x}` – and takes the ordinary closing sheet. That is a
  // quarter of all births, and it is not a rounding case: she is the girl the whole walls model was
  // built for. `tests/albumBook.test.ts` reaches the state through the REAL `driftWalls` rather than
  // by posing a lean, so this paragraph cannot rot into a story about an impossible branch.
  //
  // ⚠ IT IS DOCUMENTED AND NOT FIXED HERE, ON PURPOSE. The fix is two sentences per voice on the
  // regulation axis – «была резкой, стала ровной» and its opposite – and corpus sentences are the
  // owner's, never an agent's (invariant 4). Until he writes them the honest behaviour is the one
  // below: say nothing rather than tell a fiery girl's parent she opened up. Carried to spec §9.
  //
  // ⚠⚠ AND IT NEEDS THE CLOSING SHEET TO EXIST, NOT MERELY `world.ending` (his 20.09 blocker 1, the
  // same defect one page along). The condition used to be `world.ending`, which is set on a COLLEGE
  // latch too – so a girl who had gone away for a year and was coming back had the last page of her
  // parent's album written over an ordinary sheet in the middle of her career. The arc displaces
  // `A32`'s words, so it fires only where `A32` was actually placed: the `career-ended` frame sorts
  // last in the last chapter, which is what makes the final sheet the one to displace.
  const closedOn = chapters.some((ch) => ch.candidates.some((c) => c.occasion.id === 'career-ended'))
  const lean = world.wallsLean ?? { open: 0, reg: 0 }
  const direction: AlbumArcDirection | null = lean.open === 0 ? null : lean.open > 0 ? 'open' : 'reserved'
  if (closedOn && direction && sheets.length > 0) {
    const closing = sheets[sheets.length - 1]
    const arc = ALBUM_ARC[direction][voice]
    sheets[sheets.length - 1] = {
      ...closing,
      // ⭐ L3-6: the arc displaces the closing sheet's words, so it displaces their refs with them - the sheet must never say one thing and carry the key of another.
      note: closing.note
        ? { ...closing.note, text: arc.note, textC: selfKey(arc.note) }
        : { text: arc.note, textC: selfKey(arc.note), dateLabel: null, ageLabel: null, lines: [] },
      line: arc.line,
      lineC: selfKey(arc.line),
    }
  }

  // ⭐ ROUND 48 #1b / #1c – the two last sheets hang the career's W1000 tag and Slam ticket in the gaps their layouts leave (`hangTail`)
  hangTail(world, sheets)

  return { chapters: chapterRows, sheets }
}
