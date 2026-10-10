// LB-NOTE · THE POSED CHECKLIST BOOKS, ONCE – used by `tests/lb-note-layout-pin.test.ts` (the engine half) and `tests/component/lb-note-checklist-under.test.ts` (the mounted half), so the two
// nets are measured on the SAME careers. Real worlds, the real assembly: nothing here is a typed book.
//
// THE GRADUATE is the 48 posed careers of `albumSweep.ts` with a finished college course written onto them (`college-scene-album.test.ts` poses its graduate the same way), graduating at a
// chosen age: three league rows on the degree's page. THE HEIRLOOM is a real `createWorld` with a dynasty block, which is the only way the engine builds one.
//
// `readChapters` is the other direction: the planner's input read BACK OFF a finished book. A chapter's size is its frames (`distinctFramesOf` keeps one frame per candidate) and the checklist
// frame is the one wearing the occasion's caption, so `planBook(readChapters(book).chapters, false)` is the layout the rotation ALONE would have given the same world – the before-arm.
import { expect } from 'vitest'
import { createWorld, kidAgeAt, type WorldState } from '../../src/engine/world'
import type { SheetPlan } from '../../src/engine/world/albumBook'
import { ALBUM_CORPUS } from '../../src/engine/world/albumCorpus'
import { ENDINGS } from '../../src/engine/ending'
import { posedCareer } from './albumSweep'
import { DEFAULT_PROFILE, type AlbumBook, type AlbumLayout, type CollegeLeagueRun, type CollegeYear, type DynastyHandover } from '../../src/shared/protocol'

function year(index: number, league: CollegeLeagueRun | null, from: number): CollegeYear {
  return { index, fromWeek: from, untilWeek: from + 52, startSkill: 40, endSkill: 44, startRank: null, endRank: null, fundsDeltaCents: 0, callUp: null, league }
}
const run = (roundsWon: number, week: number): CollegeLeagueRun => ({ week, roundsWon, rounds: 3 })

/** The first week whose WHOLE age is `age` – `college-scene-album.test.ts`'s own scan. */
function firstWeekOfAge(world: WorldState, age: number): number {
  for (let w = 0; w < 2000; w++) if (kidAgeAt(world, w) === age) return w
  throw new Error(`no week reaches age ${age}`)
}

/** A posed career with a finished college course graduating at `age`: three league rows on the degree's page. */
export function graduateOf(i: number, age: number): WorldState {
  const world = posedCareer(i)
  const done = firstWeekOfAge(world, age)
  const from = done - 52 * ENDINGS.collegeYears
  world.college = {
    fromWeek: from,
    untilWeek: done,
    doneWeek: done,
    years: [year(1, run(3, from + 12), from), year(2, run(0, from + 64), from + 52), year(3, null, from + 104), year(4, run(1, from + 168), from + 156)],
    pendingCallUp: null,
    pendingLeague: null,
  }
  world.week = Math.max(world.week, done + 10)
  return world
}

/** A real dynasty world: the mother's cabinet rides the first sheet's checklist. */
export function dynastyOf(seed: string, over: Partial<DynastyHandover['motherCareer']> = {}): WorldState {
  const block: DynastyHandover = {
    generation: 2,
    childSeed: `${seed}:dynasty:2`,
    background: 'middle',
    raisedOnTour: true,
    motherName: { first: 'Vera', last: 'Kowalski' },
    motherCountry: 'PL',
    childBirthdays: [{ month: 7, day: 2 }],
    motherTemperament: 'sunny',
    motherCareer: { titles: 5, proTitles: 0, collegeTitles: 0, bestRank: 4, slams: 1, endedWeek: 900, endingKind: 'college', ...over },
  }
  return createWorld(seed, DEFAULT_PROFILE, 'c-a', undefined, block)
}

/** The caption the occasion wears in the world's voice – how the checklist frame is found on the wire. */
export const captionOf = (occasion: 'graduated' | 'the-line', world: WorldState): string =>
  ALBUM_CORPUS.find((o) => o.id === occasion)!.voices[world.temperament!].caption

/** A chapter as the planner reads it: `size` candidates, those at `pins` carrying a checklist. */
export function chapter(size: number, pins: readonly number[] = []): { candidates: { lines?: string[] }[] } {
  return { candidates: Array.from({ length: size }, (_, k) => (pins.includes(k) ? { lines: ['a fact'] } : {})) }
}

/** The planner's input, read back off a finished book (see the header). `at` / `k`: the chapter and the frame that carry the checklist. */
export function readChapters(book: AlbumBook, captionOfChecklist: string): { chapters: { candidates: { lines?: string[] }[] }[]; sizes: number[]; at: number; k: number } {
  const sizes: number[] = []
  const chapters: { candidates: { lines?: string[] }[] }[] = []
  let at = -1
  let k = -1
  for (const [c, ch] of book.chapters.entries()) {
    const sheets = book.sheets.slice(ch.firstSheet, ch.firstSheet + ch.sheetCount)
    const frames = sheets.flatMap((s) => s.frames)
    const hasChecklist = sheets.some((s) => (s.note?.lines.length ?? 0) > 0)
    const pin = hasChecklist ? frames.findIndex((f) => f.caption === captionOfChecklist) : -1
    if (hasChecklist) {
      expect(pin, `chapter ${c + 1} carries a checklist but no frame wears the occasion's caption`).toBeGreaterThanOrEqual(0)
      at = c
      k = pin
    }
    sizes.push(frames.length)
    chapters.push(chapter(frames.length, pin >= 0 ? [pin] : []))
  }
  return { chapters, sizes, at, k }
}

/** the sheet of a plan that holds the chapter's frame `k` – frames are dealt in order, `takes[i]` to sheet i */
export function sheetIndexOf(takes: readonly number[], k: number): number {
  let edge = 0
  for (const [i, t] of takes.entries()) {
    edge += t
    if (k < edge) return i
  }
  return takes.length - 1
}
export const seatOf = (p: SheetPlan, k: number): AlbumLayout => p.layouts[sheetIndexOf(p.takes, k)] as AlbumLayout
