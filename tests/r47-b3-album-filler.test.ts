// ROUND 47 B3 – LEDGER ITEM 14: «у нас есть фотки, где она дома отдыхает, есть где на отдых ездила – их тоже можно небольшие добавлять на те страницы, где
// убрали горизонтальный билет или боковую бирку, чтобы пустоту немного заполнить».
//
// WHAT SHIPPED: a sheet with no ticket, no tag and no patch (layout B or C with no tournament on it) may carry ONE small taped snapshot of her resting at
// home or on holiday – the app's own paintings, no caption, no alt, zero new strings. The engine says WHICH picture (`albumBook.ts`: the sheet's mood picks
// the kind, a walk from the career's one existing flavour draw picks the picture); the resolver says WHERE and whether there is room (`placeFiller`, a post-pass
// that moves nothing else).
//
// ⭐ THE GUARD, AS AN ASSERTION: placing a snapshot changes nothing else on the sheet – the photographs, the note, the line and the scale are identical with and
// without it on every sheet that carries one, so no count of round 45's sweep (B's shrunk windows sit AT their ceiling of 22) can move because of it.
//
// ⭐ MUTATION-VERIFIED (06.10), each run on the real file and restored byte-identical – the list is in the round-47 ledger, item 14.
//
// ⚠ 07.10 (round 48 B3, item 1 – `tests/r48-b3-album-tail.test.ts`; NO ASSERTION BELOW MOVED): two things grew beside this file's «ONE small snapshot». (1) A layout-B sheet whose snapshot has
// room for two now carries a PAIR (`AlbumFiller.pair` – the next picture of the same pool, hung by the same post-pass beside the first); the first snapshot is exactly where it always was,
// which is what the guard arm below still asserts. (2) A sheet the book's TAIL hung a W1000 tag or a Slam pass on keeps its snapshot as well – the resolver draws whichever the gap can hold –
// so «carried only by a sheet with NO ticket, NO tag and NO patch» is a claim about THIS sweep, whose posed careers have no cabinet and so no tail object.
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ALBUM_CORPUS } from '../src/engine/world/albumCorpus'
import {
  ALBUM_FILLER_HOLIDAY,
  ALBUM_FILLER_REST,
  albumFillerFor,
  albumFillerKind,
  albumFillerPool,
} from '../src/engine/world/albumBook'
import { assembleAlbum } from '../src/engine/world'
import { LAYOUTS, placeSheet, touches, type Box } from '../src/components/album/albumPlacement'
import { VACATION_ART_STEMS, WEEK_ART } from '../src/art/weeks'
import { sheetOf } from './component/albumFixture'
import { posedCareer, sweepSheets } from './helpers/albumSweep'
import type { AlbumLayout, AlbumSheetModel } from '../src/shared/protocol'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const stemOf = (art: string): string => art.replace('images/weeks/', '').replace('.webp', '')
const sheets = sweepSheets()
const withFiller = sheets.filter((s) => s.filler)

describe('round 47 #14 · the pool is the honest subset, and every picture is a real file', () => {
  const all = [...new Set([...ALBUM_FILLER_HOLIDAY, ...ALBUM_FILLER_REST.young, ...ALBUM_FILLER_REST.teen])]

  it('every stem is a file on disk', () => {
    for (const stem of all) expect(existsSync(`${ROOT}public/images/weeks/${stem}.webp`), stem).toBe(true)
  })

  it('HOLIDAY is exactly the family-holiday set the app already paints; REST is the three off-season paintings plus the knock-rested week at home, in her own age', () => {
    expect([...ALBUM_FILLER_HOLIDAY].sort()).toEqual([...VACATION_ART_STEMS].sort())
    const off = WEEK_ART.filter((s) => s.startsWith('off-'))
    expect(ALBUM_FILLER_REST.young).toEqual([...off, 'chores-young'])
    expect(ALBUM_FILLER_REST.teen).toEqual([...off, 'chores-teen'])
  })

  it('and what was left out stays out: no study, no training, no journey, no portrait', () => {
    for (const stem of all) expect(stem, 'not rest, not a holiday').not.toMatch(/^(study|training|sleepy|travel|fem-euro)/)
  })
})

describe('round 47 #14 · which sheets earn which kind (the table, over the whole corpus)', () => {
  const NEVER = new Set(['lineage', 'prologue', 'wedding', 'birth', 'closing'])

  it('the mood picks the kind: a happy occasion gets a holiday, every other a quiet day at home – and the NEVER kinds, the prologue band and an empty sheet get none', () => {
    const mood = (id: string): string => albumFillerKind('adult', [{ id, kind: 'rare' }]) ?? 'none'
    expect(mood('season-best')).toBe('holiday')
    expect(mood('season-down')).toBe('rest')
    expect(mood('injury')).toBe('rest')
    for (const o of ALBUM_CORPUS) {
      const kind = albumFillerKind('teen', [{ id: o.id, kind: o.kind }])
      if (NEVER.has(o.kind)) expect(kind, `${o.id} (${o.kind}) has its own painting or is the book's last word`).toBeNull()
      else expect(kind, o.id).not.toBeNull()
    }
    expect(albumFillerKind('prologue', [{ id: 'season-best', kind: 'season-rank' }])).toBeNull()
    expect(albumFillerKind('adult', [])).toBeNull()
    expect(albumFillerKind('adult', [{ id: 'season-best', kind: 'season-rank' }, { id: 'career-ended', kind: 'closing' }]), 'a closer anywhere on the sheet').toBeNull()
  })

  it('the pool follows the band: the young band rests with `chores-young`, every later one with `chores-teen`, and a holiday is the same six in every band', () => {
    expect(albumFillerPool('young', 'rest')).toBe(ALBUM_FILLER_REST.young)
    for (const band of ['teen', 'adult', 'lateCareer'] as const) expect(albumFillerPool(band, 'rest')).toBe(ALBUM_FILLER_REST.teen)
    for (const band of ['young', 'teen', 'adult', 'lateCareer'] as const) expect(albumFillerPool(band, 'holiday')).toBe(ALBUM_FILLER_HOLIDAY)
  })
})

describe('round 47 #14 · the walk – derived, never rolled', () => {
  it('no pool repeats a picture until it has shown them all, from any start, and wraps', () => {
    for (const [band, kind] of [['young', 'rest'], ['teen', 'rest'], ['adult', 'holiday']] as const) {
      const size = albumFillerPool(band, kind).length
      for (let start = 0; start < 10; start++) {
        const seq = Array.from({ length: size * 2 }, (_, k) => albumFillerFor(start, band, kind, k).art)
        expect(new Set(seq.slice(0, size)).size, `${band}/${kind} from ${start}`).toBe(size)
        expect(seq.slice(size)).toEqual(seq.slice(0, size))
      }
    }
  })

  it('the books use the whole pool: across the sweep the snapshots show at least nine of the eleven pictures', () => {
    const used = new Set(withFiller.map((s) => stemOf(s.filler?.art ?? '')))
    expect(used.size, [...used].join(', ')).toBeGreaterThanOrEqual(9)
  })

  it('assembling twice gives the same book, and the world is byte-identical after (zero draws that persist, MAIN untouched)', () => {
    const world = posedCareer(3)
    const before = JSON.stringify(world)
    const a = assembleAlbum(world)
    expect(assembleAlbum(world)).toEqual(a)
    expect(JSON.stringify(world)).toBe(before)
  })
})

describe('round 47 #14 · the sweep – where a snapshot is carried, and where it is drawn', () => {
  it('is not vacuous: the sweep has ticketless B sheets and tagless C sheets, and they carry snapshots', () => {
    const bare = (l: AlbumLayout): AlbumSheetModel[] => sheets.filter((s) => s.layout === l && !s.ticket && !s.tag)
    expect(bare('B').length).toBeGreaterThan(0)
    expect(bare('C').length).toBeGreaterThan(20)
    expect(withFiller.length).toBeGreaterThan(30)
  })

  it('⭐ a snapshot is carried only by a sheet with NO ticket, NO tag and NO patch – layout B or C – and its art is a pool file', () => {
    for (const s of withFiller) {
      expect(s.ticket, s.id).toBeNull()
      expect(s.tag, s.id).toBeNull()
      expect(s.patch, s.id).toBeNull()
      expect(['B', 'C'], s.id).toContain(s.layout)
      expect(s.filler?.art, s.id).toMatch(/^images\/weeks\/[a-z0-9-]+\.webp$/)
      expect(existsSync(`${ROOT}public/${s.filler?.art}`), s.id).toBe(true)
    }
    expect(sheets.filter((s) => s.layout === 'A' && s.filler)).toEqual([])
  })

  it('⭐ the guard: the snapshot moves NOTHING – photographs, note, line and scale are identical with and without it, on every sheet that carries one', () => {
    for (const s of withFiller) {
      const { filler, ...withIt } = placeSheet(s)
      const { filler: none, ...without } = placeSheet({ ...s, filler: null })
      expect(none).toBeNull()
      expect(withIt, s.id).toEqual(without)
      void filler
    }
  })

  it('every carried snapshot is drawn (no sheet in the sweep lacked room), inside the page, inside the frame the missing object leaves, and touching nothing', () => {
    let drawn = 0
    for (const s of withFiller) {
      const p = placeSheet(s)
      const f = p.filler
      expect(f, `${s.layout} ${s.id} carries a snapshot and the resolver found no room`).not.toBeNull()
      if (!f) continue
      drawn++
      const def = LAYOUTS[s.layout]
      expect(f.box.x).toBeGreaterThanOrEqual(0)
      expect(f.box.y).toBeGreaterThanOrEqual(0)
      expect(f.box.x + f.box.w).toBeLessThanOrEqual(470)
      expect(f.box.y + f.box.h).toBeLessThanOrEqual(470)
      const home = def.fixed(s)[def.filler?.home ?? 0] as Box
      expect(f.box.x, `${s.id} inside its frame`).toBeGreaterThanOrEqual(home.x)
      expect(f.box.y).toBeGreaterThanOrEqual(home.y)
      expect(f.box.x + f.box.w).toBeLessThanOrEqual(home.x + home.w)
      expect(f.box.y + f.box.h).toBeLessThanOrEqual(home.y + home.h)
      const others: Box[] = [
        ...p.photos.flatMap((x) => [x.box, ...(x.band ? [x.band] : [])]),
        ...def.fixed(s).filter((_, i) => i !== def.filler?.home),
        ...[p.note, p.line].flatMap((m) => (m ? [m as Box] : [])),
      ]
      expect(others.filter((o) => touches(f.box, o)), `${s.id}`).toEqual([])
    }
    expect(drawn).toBe(withFiller.length)
  })

  it('a sheet whose ticket or tag IS drawn hangs no snapshot, whatever the model says', () => {
    const art = { art: 'images/weeks/off-1.webp' }
    expect(placeSheet({ ...sheetOf({ layout: 'B' }), filler: art }).filler).toBeNull()
    expect(placeSheet({ ...sheetOf({ layout: 'C' }), filler: art }).filler).toBeNull()
    expect(placeSheet({ ...sheetOf({ layout: 'A' }), filler: art }).filler).toBeNull()
    expect(placeSheet({ ...sheetOf({ layout: 'B' }), ticket: null, filler: art }).filler).not.toBeNull()
  })
})

describe('round 47 #14 · a crowded gap – the snapshot steps aside for the portrait\'s long caption, and goes without when nothing is free', () => {
  const art = { art: 'images/weeks/vac-sea.webp' }
  const LONG = ALBUM_CORPUS.flatMap((o) => Object.values(o.voices)).reduce((a, v) => (v.caption.length > a.length ? v.caption : a), '')
  // no note, so no window gives a rung: the right-hand portrait keeps its full height and hangs a long caption into the strip
  const crowded = (): AlbumSheetModel => {
    const s = sheetOf({ layout: 'B' })
    return { ...s, ticket: null, note: null, filler: art, frames: s.frames.map((f) => ({ ...f, caption: LONG })) }
  }

  it('the first spot (the right-hand one) is taken by the third photograph here, so the snapshot hangs further left – and still touches nothing', () => {
    const s = crowded()
    const p = placeSheet(s)
    const def = LAYOUTS.B.filler
    const first = def?.spots[0]
    expect(first && p.photos[2]?.box.y !== undefined).toBe(true)
    const pad = 4
    const swing: Box = { x: (first?.x ?? 0) - pad, y: (first?.y ?? 0) - pad, w: (def?.w ?? 0) + 2 * pad, h: 4 + (def?.photoH ?? 0) + 12 + 2 * pad }
    const third = p.photos[2]?.box as Box
    expect(touches(swing, third), 'the portrait\'s card reaches the strip – or this test is idle').toBe(true)
    expect(p.filler, 'it found a free spot to the left').not.toBeNull()
    expect(p.filler?.x).not.toBe(first?.x)
    expect(touches(p.filler?.box as Box, third)).toBe(false)
  })
})
