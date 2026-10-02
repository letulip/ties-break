// ROUND 45 #8 – «Постараться сделать, чтобы одинаковых фоточек не было на одной странице».
//
// WHAT THIS PINS. The album's pictures are not drawn: a frame's mood is a function of its occasion and
// the band portrait is ONE painting per (band, face), so two `happy` frames of one chapter were the
// same file by construction. `pickDistinct` now assigns a page's pictures together, and the ladder
// offers stand-in faces and journey scenes (`frameArtOptions`). The change draws nothing: no MAIN, no
// sub-stream – so the frozen capture is untouched by construction and `tests/condition.test.ts` is the
// check of that, not of this file.
//
// ⚠ THE SWEEP IS THE EVIDENCE AND ITS MUTATION IS THE PROOF IT CAN FAIL. 48 posed careers, every sheet
// of every book: zero pages with a repeated picture. With the de-duplication replaced by «every frame
// takes its first choice» (`picks[i]` -> 0 in `distinctFramesOf`) the same sweep goes red, and the
// message carries the count – that run is the «before» of this change.
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assembleAlbum, createWorld, kidAgeAt, type WorldState } from '../src/engine/world'
import { pickDistinct } from '../src/engine/world/albumBook'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { pickInt, rngFromSeed } from '../src/engine/rng'
import type { AlbumBook } from '../src/shared/protocol'

const PUBLIC = fileURLToPath(new URL('../public', import.meta.url))

describe('round 45 #8 · pickDistinct – a page\'s pictures, assigned together', () => {
  it('a page that already shows different pictures changes nothing', () => {
    expect(pickDistinct([['a', 'x'], ['b', 'y'], ['c']])).toEqual({ picks: [0, 0, 0], clashes: 0 })
  })

  it('the LATER frame gives way to the earlier one\'s picture', () => {
    expect(pickDistinct([['happy', 'norm'], ['happy', 'serious']])).toEqual({ picks: [0, 1], clashes: 0 })
  })

  it('it is a search and not a first-free grab: an early frame moves so a later one is not stranded', () => {
    // greedy would hand frame 0 'a' and leave frame 1 only 'a'; a distinct assignment exists
    expect(pickDistinct([['a', 'b'], ['a']])).toEqual({ picks: [1, 0], clashes: 0 })
  })

  it('a pool smaller than the page is ANSWERED – the repeat is shown, counted, nothing throws', () => {
    const got = pickDistinct([['a', 'b'], ['a', 'b'], ['a', 'b']])
    expect(got.clashes, 'three frames, two pictures: exactly one repeat').toBe(1)
    expect(got.picks).toHaveLength(3)
    expect(pickDistinct([['only'], ['only']])).toEqual({ picks: [0, 0], clashes: 1 })
    expect(pickDistinct([])).toEqual({ picks: [], clashes: 0 })
  })
})

/** The first week she is `age`, scanned once per world rather than assumed (the file-local clock of
 *  `tests/albumBook.test.ts`). */
function firstWeeks(world: WorldState): Map<number, number> {
  const out = new Map<number, number>()
  for (let w = 0; w < 1500; w++) {
    const age = kidAgeAt(world, w)
    if (!out.has(age)) out.set(age, w)
  }
  return out
}

/** A career posed from a seeded stream of ITS OWN – the test's dice, never the engine's. The mix is the
 *  duplicate-prone one: many titles and finals (all `happy` / `serious`), season closes of every shape
 *  (`norm`, `happy`, `sad`), a school, a first cheque, an injury, and half of the proving weeks made
 *  away weeks so the journey rung is exercised as well as the portrait one. */
function posedCareer(i: number): WorldState {
  const seed = `r45-distinct-${i}`
  const world = createWorld(seed)
  const rng = rngFromSeed(`${seed}:posed`)
  const at = firstWeeks(world)
  const weekIn = (from: number, to: number): number => (at.get(pickInt(rng, from, to)) ?? 0) + pickInt(rng, 0, 45)
  let last = 0
  const note = (w: number): number => {
    last = Math.max(last, w)
    return w
  }
  const away = (w: number): void => {
    if (pickInt(rng, 0, 1) === 1) world.internationalEntryWeeks.push(w)
  }
  const titles = pickInt(rng, 5, 10)
  for (let n = 0; n < titles; n++) {
    const w = note(weekIn(13, 36))
    world.milestones.push({ type: 'title', week: w, tier: TIER_LADDER[pickInt(rng, 0, TIER_LADDER.length - 1)] })
    away(w)
  }
  const finals = pickInt(rng, 3, 6)
  for (let n = 0; n < finals; n++) {
    const w = note(weekIn(13, 36))
    world.milestones.push({ type: 'final', week: w, tier: TIER_LADDER[pickInt(rng, 0, TIER_LADDER.length - 1)] })
    away(w)
  }
  world.milestones.push({ type: 'prize', week: note(weekIn(15, 30)), tier: 'w15' })
  world.milestones.push({ type: 'international', week: note(weekIn(14, 20)), tier: 'j30' })
  world.milestones.push({ type: 'school', week: note(weekIn(17, 19)) })
  world.milestones.push({ type: 'injury', week: note(weekIn(14, 34)), kind: 'ankle soreness' })
  const closes = pickInt(rng, 8, 18)
  for (let n = 0; n < closes; n++) {
    world.milestones.push({
      type: 'season-rank',
      week: note(weekIn(13, 36)),
      seasonIndex: n,
      rank: pickInt(rng, 1, 300),
    })
  }
  world.week = last + 1
  return world
}

function sheetsWithARepeat(book: AlbumBook): string[] {
  return book.sheets
    .filter((s) => new Set(s.frames.map((f) => f.art)).size < s.frames.length)
    .map((s) => `${s.id}: ${s.frames.map((f) => f.art.replace(/^.*fem-euro-brunnet-/, '')).join(' | ')}`)
}

describe('round 45 #8 · the sweep – no page of any career shows one picture twice', () => {
  const CAREERS = 48
  const books = Array.from({ length: CAREERS }, (_, i) => assembleAlbum(posedCareer(i)))

  it('the sweep is not vacuous: many pages, most of them with two or more frames', () => {
    const sheets = books.flatMap((b) => b.sheets)
    const crowded = sheets.filter((s) => s.frames.length >= 2)
    expect(books.every((b) => b.sheets.length > 0), 'every posed career has a book').toBe(true)
    expect(sheets.length).toBeGreaterThanOrEqual(CAREERS * 3)
    expect(crowded.length, 'pages with a pair or a trio to tell apart').toBeGreaterThanOrEqual(CAREERS * 2)
  })

  it('⭐ ZERO pages with a repeated picture, over 48 careers', () => {
    const repeats = books.flatMap((b, i) => sheetsWithARepeat(b).map((row) => `career ${i} ${row}`))
    expect(repeats, `${repeats.length} page(s) show one picture twice`).toEqual([])
  })

  it('every picture the de-duplication can reach is a file on disk', () => {
    for (const book of books) {
      for (const sheet of book.sheets) {
        for (const frame of sheet.frames) {
          expect(existsSync(`${PUBLIC}/${frame.art}`), `${frame.art} names a painting on disk`).toBe(true)
        }
      }
    }
  })

  it('the same career opens on the same book twice – the de-duplication draws nothing', () => {
    for (const i of [0, 7, 23, 47]) {
      expect(assembleAlbum(posedCareer(i))).toEqual(assembleAlbum(posedCareer(i)))
    }
  })
})
