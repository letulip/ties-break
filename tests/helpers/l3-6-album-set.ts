// L3-6 (10.10) – THE HEAVY POSED SET OF ALBUM BOOKS, in one place, and the reading of it that cannot tell the new tree from the old.
//
// The set is the one the r45 / r47 / r48 album sweeps use as its spine (`albumSweep.ts`'s 48 posed careers, every sheet of every book) widened on the four axes this wave's refs ride: the
// four VOICES (a corpus cell is picked by the parent's temperament), the NINE ENDINGS latched on a career (the closing sheet and the walls arc that displaces its words), the GRADUATE (a checklist of
// league rows) and the DYNASTY heirloom (a checklist with a name and numbers), plus the career whose Slam and W1000 shelves hang the book's tail ticket and tag.
//
// `plain` strips every ref, so the SAME file runs unchanged on the pre-wave tree (where there are none) and its digest is the byte-identity proof: tests/i18n-l3-6-endings-album.test.ts pins the
// pre-wave tree's digest of this set, and the throwaway-worktree twin recomputes it on both trees.
import { assembleAlbum, buildEndingView, createWorld, kidAgeAt, latchEnding, type WorldState } from '../../src/engine/world'
import { TEMPERAMENTS } from '../../src/engine/spirit'
import { ENDINGS, endingForFamily, endingForForkAnswer, endingForLeaving, endingForRetirement, detectEnding } from '../../src/engine/ending'
import { leavingView } from './leavingView'
import { posedCareer } from './albumSweep'
import { fnv1a } from './hash'
import { DEFAULT_PROFILE, type AlbumBook, type CareerEnding, type CareerEndingType, type CollegeLeagueRun, type CollegeYear, type DynastyHandover } from '../../src/shared/protocol'

export interface PosedBook {
  label: string
  world: WorldState
  book: AlbumBook
}

export const ENDING_TYPES: readonly CareerEndingType[] = ['stopped', 'college', 'bankruptcy', 'injury', 'natural', 'plateau', 'peak', 'fall', 'family']

/** one real ending per type, off its real producer */
export function endingOf(type: CareerEndingType, week: number): CareerEnding {
  const auto = { week: 100, ageYears: 16, fundsCents: 5000_00, debtSinceWeek: null, cheapestEntryFeeCents: 40_00, freshInjurySeverity: null, injuryHistory: [] }
  const ending: CareerEnding =
    type === 'stopped'
      ? endingForForkAnswer('stop', week, 19, ENDINGS.collegeYears, 52)!
      : type === 'college'
        ? endingForForkAnswer('college', week, 19, ENDINGS.collegeYears, 52)!
        : type === 'bankruptcy'
          ? detectEnding({ ...auto, fundsCents: -1, debtSinceWeek: 100 - ENDINGS.bankruptcyGraceWeeks, week: 100 })!
          : type === 'injury'
            ? detectEnding({ ...auto, freshInjurySeverity: 'severe', injuryHistory: [{ severity: 'major', weeksOut: 40 }] })!
            : type === 'natural'
              ? endingForRetirement({ askedWeek: 0, seasonIndex: 0, reason: 'age', final: true }, week, 41, 3)
              : type === 'plateau'
                ? endingForRetirement({ askedWeek: 0, seasonIndex: 0, reason: 'plateau', final: false }, week, 26, 0)
                : type === 'peak'
                  ? endingForLeaving('peak', leavingView({ endRank: 4 }), week, 27)
                  : type === 'fall'
                    ? endingForLeaving('fall', leavingView({ prevEndRank: 13, endRank: 59 }), week, 24)
                    : endingForFamily(week, 29, 51)
  return { ...ending, week }
}

/** The first week whose WHOLE age is `age` (`kidAgeAt === age`) - the posing `college-scene-album.test.ts` uses for its graduate, kept character for character so this set's graduates are that file's. It is NOT the
 *  shared `weekAtAge` of tests/helpers/career.ts (`kidAgeExact >= years`, which answers the first week she has REACHED the age): the two differ by a few weeks, and the posed digests below were taken on this one. */
function firstWeekOfWholeAge(world: WorldState, age: number): number {
  for (let w = 0; w < 2000; w++) if (kidAgeAt(world, w) === age) return w
  throw new Error(`no week reaches age ${age}`)
}

function run(roundsWon: number, week: number): CollegeLeagueRun {
  return { week, roundsWon, rounds: 3 }
}
function year(index: number, league: CollegeLeagueRun | null, from: number): CollegeYear {
  return { index, fromWeek: from, untilWeek: from + 52, startSkill: 40, endSkill: 44, startRank: null, endRank: null, fundsDeltaCents: 0, callUp: null, league }
}
function graduate(seed: string, pick: (from: number) => CollegeYear[]): WorldState {
  const world = createWorld(seed)
  const done = firstWeekOfWholeAge(world, 23)
  world.week = done + 10
  const from = done - 52 * ENDINGS.collegeYears
  world.college = { fromWeek: from, untilWeek: done, doneWeek: done, years: pick(from), pendingCallUp: null, pendingLeague: null }
  return world
}

function dynastyBlock(over: Partial<DynastyHandover['motherCareer']> = {}, temperament: DynastyHandover['motherTemperament'] = 'sunny'): DynastyHandover {
  return {
    generation: 2,
    childSeed: 'w10-line:dynasty:2',
    background: 'middle',
    raisedOnTour: true,
    motherName: { first: 'Vera', last: 'Kowalski' },
    motherCountry: 'PL',
    childBirthdays: [{ month: 7, day: 2 }],
    motherTemperament: temperament,
    motherCareer: { titles: 0, proTitles: 0, collegeTitles: 0, bestRank: null, slams: 0, endedWeek: 900, endingKind: 'college', ...over },
  }
}

let cache: PosedBook[] | null = null
export function posedBooks(): PosedBook[] {
  if (cache) return cache
  const out: PosedBook[] = []
  const add = (label: string, world: WorldState): void => {
    out.push({ label, world, book: assembleAlbum(world) })
  }
  for (let i = 0; i < 48; i++) add(`posed ${i}`, posedCareer(i))
  for (let i = 0; i < 12; i++) {
    for (const voice of TEMPERAMENTS) {
      const world = posedCareer(i)
      world.temperament = voice
      add(`posed ${i} / ${voice}`, world)
    }
  }
  ENDING_TYPES.forEach((type, t) => {
    for (const lean of [null, 1, -1] as const) {
      const world = posedCareer(30 + t)
      world.week += 8
      if (lean !== null) world.wallsLean = { open: lean, reg: 0 }
      // the book's tail: a Slam and a W1000 on the shelf hang a ticket and a tag on its last two sheets
      world.trophiesByTier.slam = { ...world.trophiesByTier.slam, titles: [world.week - 40], finals: [world.week - 60] }
      world.trophiesByTier.wta1000 = { ...world.trophiesByTier.wta1000, titles: [world.week - 20], finals: [] }
      latchEnding(world, endingOf(type, world.week))
      add(`ended ${type} / lean ${lean}`, world)
    }
  })
  // a Slam on the shelf hangs the book's tail TICKET where the second-to-last sheet is an unticketed B-layout one - found by search over the posed careers, so the set carries it whatever the sheet plan does
  let tails = 0
  for (let i = 0; i < 48 && tails < 6; i++) {
    const world = posedCareer(i)
    world.trophiesByTier.slam = { ...world.trophiesByTier.slam, titles: [world.week - 40], finals: [world.week - 60] }
    if (assembleAlbum(world).sheets.some((s) => s.ticket?.tail)) {
      add(`tail ticket ${i}`, world)
      tails++
    }
  }
  add('graduate: four years', graduate('l36-grad-a', (from) => [year(1, run(3, from + 12), from), year(2, run(0, from + 64), from + 52), year(3, null, from + 104), year(4, run(1, from + 168), from + 156)]))
  add('graduate: no league at all', graduate('l36-grad-b', (from) => [year(1, null, from), year(2, null, from + 52), year(3, null, from + 104), year(4, null, from + 156)]))
  add('dynasty: rich', createWorld('w10-heir', DEFAULT_PROFILE, 'c-a', undefined, dynastyBlock({ titles: 5, bestRank: 4, slams: 1 })))
  add('dynasty: humble', createWorld('w10-heir2', DEFAULT_PROFILE, 'c-c', undefined, dynastyBlock()))
  const ended = createWorld('w10-heir3', DEFAULT_PROFILE, 'c-d', undefined, dynastyBlock({ titles: 2, bestRank: 17 }, 'deep'))
  ended.week = 700
  latchEnding(ended, endingOf('natural', ended.week))
  add('dynasty: ended', ended)
  cache = out
  return out
}

/** The wire object as JSON, with every ref stripped: a ref is an object with a string `k` (or the `linesC` array of them), carried under a key that ends in `C`. */
export function plain(value: unknown): unknown {
  const isRef = (v: unknown): boolean => typeof v === 'object' && v !== null && !Array.isArray(v) && typeof (v as { k?: unknown }).k === 'string'
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk)
    if (typeof v !== 'object' || v === null) return v
    const o: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(v as Record<string, unknown>)) {
      if (/C$/.test(key) && (isRef(child) || (Array.isArray(child) && child.every((x) => x === null || isRef(x))))) continue
      o[key] = walk(child)
    }
    return o
  }
  return walk(JSON.parse(JSON.stringify(value)))
}

/** The ending view of a posed ended world, refs stripped - the epilogue's page and the record, English only. */
export function endedViews(): { label: string; view: unknown }[] {
  return posedBooks()
    .filter((b) => b.world.ending !== null)
    .map((b) => ({ label: b.label, view: plain(buildEndingView(b.world)) }))
}

/** The digest of everything the set can show a player in English: every book, and every epilogue's page and record. */
export function englishDigest(): { books: string; views: string; sheets: number; chapters: number; viewsN: number } {
  const books = posedBooks()
  const booksJson = JSON.stringify(books.map((b) => plain(b.book)))
  const views = endedViews()
  return {
    books: fnv1a(booksJson).toString(16),
    views: fnv1a(JSON.stringify(views)).toString(16),
    sheets: books.reduce((n, b) => n + b.book.sheets.length, 0),
    chapters: books.reduce((n, b) => n + b.book.chapters.length, 0),
    viewsN: views.length,
  }
}
