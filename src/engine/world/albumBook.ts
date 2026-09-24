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
import { weekSpan } from '../../shared/dates'
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
const PATCH_POOL: readonly string[] = [
  'Rivermouth Tennis',
  'Northfield Club',
  'Harbour Lane Tennis',
  'Old Mill Courts',
  'Cedar Park Tennis',
  'Whitegate Club',
] as const

/** ⚠ DRAFT – the alt each moment-face wears when its OWN painting is the one drawn; the band
 *  fallback takes `ALT_DRAFT.portrait` instead. A total `Record` over `MomentFace`, so a third
 *  one-band painting cannot join `MOMENT_FACE` without a sentence for it. */
const MOMENT_ALT: Record<MomentFace, string> = {
  bride: ALT_DRAFT.bride,
  birth: ALT_DRAFT.birth,
}

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
}

const TOP_RANK = 10
const TOP_STREAK_YEARS = 4

const OCCASION = new Map(ALBUM_CORPUS.map((o) => [o.id, o]))
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
  extra: Partial<Pick<AlbumCandidate, 'tier' | 'finish' | 'closer' | 'lines'>> = {},
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
  const slamWeeks = world.trophiesByTier[topTier]?.titles ?? []
  if (world.bestFinishByTier[topTier] === 0 && slamWeeks.length > 0) {
    out.push(candidate(world, 'top-tier-title', slamWeeks[0], 100, { tier: topTier, finish: 0 }))
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
    out.push(candidate(world, 'graduated', college.doneWeek, 1000, { closer: true, lines: collegeLeagueLines(college.years) }))
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
  const lines = [
    `${record.motherName.first} ${record.motherName.last}`,
    career.bestRank === null ? null : `Best ranking: #${career.bestRank}`,
    career.titles > 0 ? `Titles: ${career.titles}` : null,
    career.slams > 0 ? `Slams: ${career.slams}` : null,
    `Generation ${record.generation}`,
  ].filter((line): line is string => line !== null)
  // ⚠ THE AGE IS **BEFORE** THE FIRST COURT DAY and the priority is above it, so the book opens on
  // where she came from and then on where she started. Both are deliberate and both are visible here
  // rather than in a sort nobody can find.
  return [{ week: null, ageYears: FIRST_COURT_AGE - 1, occasion: occasionOf('the-line'), priority: 82, lines }]
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

/** The sheets one chapter earns: the FEWEST of the rotation's next layouts that can hold its
 *  frames, and how many frames sit on each. Returns the cursor the next chapter starts from. */
function chapterSheetPlan(
  cursor: number,
  frames: number,
): { layouts: AlbumLayout[]; takes: number[]; next: number } {
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
  return { layouts, takes: spreadFrames(frames, layouts.map((l) => FRAME_CAPACITY[l])), next: at + count }
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

function frameArtFor(world: WorldState, c: AlbumCandidate): { art: string; alt: string } {
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
    return { art: paintingPath(stem), alt: stem.endsWith(moment) ? own : ALT_DRAFT.portrait }
  }
  const eventStem = EVENT_STEM[c.occasion.id]
  if (eventStem) {
    return { art: paintingPath(eventStem), alt: ALT_DRAFT[eventStem as keyof typeof ALT_DRAFT] ?? ALT_DRAFT.portrait }
  }
  const mood = ALBUM_MOOD[c.occasion.id] ?? 'norm'
  // rung 2 – the journey, on an away week whose mood has a journey face
  if (c.week !== null && awayWeek(world, c.week)) {
    const travelMood = travelMoodOf(mood)
    if (travelMood) {
      const scene = TRAVEL_SCENES[c.week % TRAVEL_SCENES.length]
      return { art: paintingPath(`travel-${travelMood}-${scene}`), alt: ALT_DRAFT.travel }
    }
  }
  // rung 3 – the band portrait at her age that week, in the ruled mood
  return { art: paintingPath(paintedStemFor(stage, mood)), alt: ALT_DRAFT.portrait }
}

function frameOf(world: WorldState, c: AlbumCandidate, voice: Temperament): AlbumFrame {
  const { art, alt } = frameArtFor(world, c)
  return { art, alt, caption: c.occasion.voices[voice].caption }
}

// =================================================================================================
// §6 THE ANTУРАЖ – the one named sub-stream family, and every drawn thing on a sheet
// =================================================================================================

/** Per sheet, off `seed:album:flavour:<sheet id>` – re-derived at the call site, persisting
 *  nothing, MAIN untouched (invariant 2). The same sheet of the same career always deals the same
 *  seat, which is «из сида, чтобы не мигал» satisfied at zero cost. */
function flavourFor(seed: string, sheetId: string) {
  const rng = rngFromSeed(`${seed}:album:flavour:${sheetId}`)
  const seat = `${TICKET_WORDS.seat} ${pickInt(rng, 1, 32)}${'ABCDEF'[pickInt(rng, 0, 5)]}`
  const gate = `${TICKET_WORDS.gate} ${pickInt(rng, 1, 9)}`
  const row = `${TICKET_WORDS.row} ${pickInt(rng, 1, 32)}`
  const venue = VENUE_POOL[pickInt(rng, 0, VENUE_POOL.length - 1)]
  const bars: number[] = []
  for (let i = 0; i < 12; i++) bars.push(pickInt(rng, 1, 4))
  const doodle = pickInt(rng, 0, 5)
  return { seat, gate, row, venue, bars, doodle }
}

/** The childhood club's fictional name – §8b's pool, drawn ONCE per career on the flavour family's
 *  own key so every opener wears the same patch («стабилен при перечитывании, товарных знаков не
 *  задевает»). */
function patchFor(seed: string): string {
  const rng = rngFromSeed(`${seed}:album:flavour:patch`)
  return PATCH_POOL[pickInt(rng, 0, PATCH_POOL.length - 1)]
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

function ticketOf(c: AlbumCandidate, flavour: ReturnType<typeof flavourFor>): AlbumTicket {
  return {
    tier: TIERS[c.tier!].label,
    step: ALBUM_TIER_STEP[c.tier!],
    stage: c.finish === undefined ? '' : finishLabel(c.finish),
    venue: flavour.venue,
    dateLabel: c.week === null ? '' : weekSpan(c.week),
    gate: flavour.gate,
    seat: flavour.seat,
    row: flavour.row,
    bars: flavour.bars,
  }
}

function tagOf(c: AlbumCandidate, flavour: ReturnType<typeof flavourFor>): AlbumTag {
  return {
    stage: c.finish === undefined ? '' : finishLabel(c.finish),
    tier: TIERS[c.tier!].label,
    step: ALBUM_TIER_STEP[c.tier!],
    place: flavour.venue,
    ageLabel: ageLabelOf(c.ageYears),
  }
}

// =================================================================================================
// §7 SHEETS AND CHAPTERS
// =================================================================================================

function noteOf(c: AlbumCandidate, hand: AlbumHand, own: readonly AlbumCandidate[] = [c]): AlbumNote {
  return {
    text: hand.note,
    dateLabel: c.week === null ? null : weekSpan(c.week),
    ageLabel: ageLabelOf(c.ageYears),
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
): AlbumSheetModel[] {
  const { band, candidates } = chapter
  const title = ALBUM_CHAPTER_TITLES[band]
  const ages = candidates.map((c) => c.ageYears)
  const ageFrom = Math.min(...ages)
  const ageTo = Math.max(...ages)
  const chapterAgeLabel =
    ageFrom === ageTo ? ageLabelOf(ageFrom) : `${TICKET_WORDS.age} ${ageFrom} – ${ageTo}`
  const patch = patchFor(world.seed)
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
    sheets.push({
      id,
      layout,
      chapterIndex,
      chapterTitle: title,
      ageLabel: chapterAgeLabel,
      frames: own.map((c) => frameOf(world, c, voice)),
      note: noteOf(lead, hand, own),
      line: hand.line,
      ticket: layout === 'B' && tournament ? ticketOf(tournament, flavour) : null,
      tag: layout === 'C' && tournament ? tagOf(tournament, flavour) : null,
      patch: layout === 'A' ? patch : null,
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
  // the rotation's cursor runs over the WHOLE book, not over a chapter: that is what keeps two
  // sheets either side of a chapter break from sharing a layout (his «одинаковых подряд просто не
  // было»), and it is the one piece of state the assembly carries between chapters.
  let cursor = 0
  for (const [i, chapter] of chapters.entries()) {
    const plan = chapterSheetPlan(cursor, chapter.candidates.length)
    cursor = plan.next
    const own = sheetsOf(world, chapter, i + 1, voice, plan)
    chapterRows.push({
      index: i + 1,
      title: ALBUM_CHAPTER_TITLES[chapter.band],
      ageLabel: own[0].ageLabel,
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
      note: closing.note ? { ...closing.note, text: arc.note } : { text: arc.note, dateLabel: null, ageLabel: null, lines: [] },
      line: arc.line,
    }
  }

  return { chapters: chapterRows, sheets }
}
