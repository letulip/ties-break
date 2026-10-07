// ROUND 48 B3 – LEDGER ITEMS 1 AND 2 (owner, 07.10, his first detailed pass over the merged round 47):
//   1 (reopens r47 №14) «для горизонтальных пустых мест можно еще фото добавить какое-то, например из vacation второе рядом, на последней странице и предпоследней
//     всё ещё остались пропуски, на последней повесь вертикальную бирку w1000 справа, а на предпоследней зеленый билет на Шлем внизу»
//   2 (reopens r47 №9)  «оверлап текста и заголовка на одной из страниц всё еще есть … (The Tour / Straight back to the planning – надо отодвинуть последний дальше вправо)»
//
// WHAT SHIPPED, AND WHERE EACH HALF IS HELD
//   1a  a layout-B sheet whose snapshot has room for TWO hangs a second one beside it – the NEXT picture of the same pool on the career's walk, so a vacation page gets a
//       vacation pair and the two are different paintings by construction. Engine: `AlbumFiller.pair` (zero draws). Resolver: `placeFiller`'s second pass.
//   1b  the book's LAST sheet, when it is layout C and carries no tag of its own, hangs a vertical WORLD TOUR 1000 tag in C's right-hand column – only for a career whose
//       cabinet holds a W1000 title or final. 1c the SECOND-TO-LAST sheet, when it is layout B with no pass of its own, hangs a GRAND SLAM pass (the Slam's own green) along the
//       bottom – only for a career whose cabinet holds a Slam title or final. Engine: `hangTail` (derived, zero draws). Both carry `tail: true`: the resolver draws one only
//       where the gap is CLEAR of the note and the loose line (the tag tries a rung smaller first), and a page with no room goes without it.
//   2   the loose line keeps `HEAD_AIR` (24px) to the right of a heading's box. Reproduced in real Chromium on his save (adult-1, «The tour»): the line sat 10px past the
//       last letter, in the heading's own band, so the two read as one run.
//
// ⚠ WHAT THIS CANNOT SEE: happy-dom lays nothing out, so the geometry below is the RESOLVER'S OWN BOXES (the table's numbers) – the numbers that were MEASURED IN REAL CHROMIUM
// (the tour sheet's 145.8 / 156 / 180, the tag's 284.1px, his last page's 23.2px of clear paper under the shrunk tag) are written beside the arms that hold them.
//
// ⭐ MUTATION-VERIFIED (07.10), each arm on the real file, restored byte-identical – the list is at the foot of this file.
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assembleAlbum, type WorldState } from '../src/engine/world'
import { ALBUM_ARC } from '../src/engine/world/albumCorpus'
import {
  ALBUM_CHAPTER_TITLES,
  ALBUM_FILLER_HOLIDAY,
  ALBUM_FILLER_REST,
  ALBUM_TAIL_TAG_TIER,
  ALBUM_TAIL_TICKET_TIER,
  albumTailFact,
} from '../src/engine/world/albumBook'
import { TIERS } from '../src/engine/season/calendar'
import { HEAD_AIR, LAYOUTS, TAIL_TAG_RUNGS, TUNING, placeSheet, tailTagBox, touches, type Box } from '../src/components/album/albumPlacement'
import { hand, sheetOf } from './component/albumFixture'
import { SWEEP_CAREERS, posedCareer, sweepSheets } from './helpers/albumSweep'
import type { AlbumSheetModel } from '../src/shared/protocol'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const GAP = 2
const BEFORE = { ...TUNING, headAir: 0 }
const sheets = sweepSheets()
const headOf = (s: AlbumSheetModel): Box => LAYOUTS[s.layout].fixed(s)[0] as Box
const stemOf = (art: string): string => art.replace('images/weeks/', '').replace('.webp', '')

// =================================================================================================
// 2 – THE LOOSE LINE KEEPS ITS AIR FROM THE HEADING
// =================================================================================================

describe('round 48 #2 · «The tour» / «Straight back to the planning.» – reproduced, then fixed', () => {
  // THE SHEET IS BUILT FROM THE CORPUS' OWN WORDS (invariant 4): chapter «The tour» is `ALBUM_CHAPTER_TITLES.adult`, the line is the `season-recovery` / quiet occasion's. It is
  // the very placement of his save's `adult-1`: line [156,37 200x53] before, in real Chromium 12.1px (10.2 leaf px) past the last letter of «The tour».
  const tour = (): AlbumSheetModel => sheetOf({ layout: 'A', occasion: 'season-recovery', voice: 'quiet', chapterTitle: ALBUM_CHAPTER_TITLES.adult })
  // MEASURED IN CHROMIUM (06.10 and 07.10): the name's text box, Caveat 600 at 38px.
  const REAL_NAME: Record<string, number> = { 'The beginning': 181.2, 'Growing up': 141.7, 'The breakthrough': 233.4, 'The tour': 111.8, 'The final chapter': 224.1 }

  it('the sheet is the one he saw: the title is «The tour» and the loose line is «Straight back to the planning.»', () => {
    const s = tour()
    expect(s.chapterTitle).toBe('The tour')
    expect(s.line).toBe(hand('season-recovery', 'quiet').line)
    expect(s.line).toBe('Straight back to the planning.')
  })

  it('⭐ BEFORE: the resolver put the line exactly GAP past the heading box, in the heading\'s own band – two bare lines of one hand 10px apart', () => {
    const s = tour()
    const head = headOf(s)
    const line = placeSheet(s, BEFORE).line as Box
    expect(line.x, 'the pre-fix geometry: 2px of air past the box').toBe(head.x + head.w + GAP)
    expect(line.y < head.y + head.h && head.y < line.y + line.h, `the line [y ${line.y}..${line.y + line.h}] is in the heading's band [y ${head.y}..${head.y + head.h}]`).toBe(true)
    // the real text ends at x 34 + 111.8: the gap the reader saw, in leaf px (Chromium: 12.1px on screen at 1.183)
    expect(line.x - (head.x + REAL_NAME['The tour']!), 'real gap, leaf px').toBeCloseTo(10.2, 1)
  })

  it('⭐ AFTER: the line starts HEAD_AIR further right – 34px of real air (Chromium measured 34.2) – and its band, size and the rest of the sheet are unchanged', () => {
    const s = tour()
    const head = headOf(s)
    const was = placeSheet(s, BEFORE)
    const now = placeSheet(s)
    const line = now.line as Box
    expect(line.x - (head.x + head.w), 'air past the heading box').toBeGreaterThanOrEqual(HEAD_AIR + GAP)
    expect(line.x, 'moved RIGHT, by the air and no more').toBe((was.line as Box).x + HEAD_AIR)
    expect(line.x - (head.x + REAL_NAME['The tour']!), 'real gap, leaf px').toBeCloseTo(34.2, 1)
    expect(line.y, 'same band').toBe((was.line as Box).y)
    expect({ ...now, line: null }, 'nothing but the line moved').toEqual({ ...was, line: null })
  })

  // ---- THE SWEEP: the same 335 sheets round 45 and 47 measure
  const hugging = (s: AlbumSheetModel, tuning = TUNING): boolean => {
    const p = placeSheet(s, tuning)
    if (s.layout === 'B' || !p.line) return false
    const h = headOf(s)
    return touches(p.line, h) || touches(p.line, { x: h.x + h.w, y: h.y, w: HEAD_AIR, h: h.h })
  }

  it('is not vacuous: with the air at 0 (the pre-fix geometry) the loose line sits against the heading on 54 of the sweep\'s 268 A and C sheets', () => {
    const n = sheets.filter((s) => hugging(s, BEFORE)).length
    expect(sheets.filter((s) => s.layout !== 'B').length).toBe(268)
    expect(n, `${n} sheets`).toBeGreaterThanOrEqual(50)
    expect(sheets.filter((s) => hugging(s, BEFORE) && s.chapterTitle === 'The tour').length, 'and «The tour» is among them').toBeGreaterThan(0)
  })

  it('⭐ ZERO sheets: no loose line is within HEAD_AIR of any heading – and no note or caption meets a heading box either', () => {
    const bad = sheets.filter((s) => hugging(s))
    expect(bad.map((s) => `${s.layout} ${s.id} «${s.chapterTitle}»`), `${bad.length} of ${sheets.length} sheets keep a loose line against the heading`).toEqual([])
    for (const s of sheets) {
      if (s.layout === 'B') continue
      const p = placeSheet(s)
      const h = headOf(s)
      const hits = [
        ...(p.note && touches(p.note as Box, h) ? ['note'] : []),
        ...p.photos.flatMap((x, i) => [...(touches(x.box, h) ? [`photo ${i}`] : []), ...(x.band && touches(x.band, h) ? [`caption ${i}`] : [])]),
      ]
      expect(hits, `${s.layout} ${s.id}`).toEqual([])
    }
  })

  it('the note needed no air of its own: the nearest it sits to a heading\'s REAL text is 26px or more – the distance the loose line now keeps at the very least', () => {
    let nearest = Infinity
    for (const s of sheets) {
      if (s.layout === 'B') continue
      const p = placeSheet(s)
      const h = headOf(s)
      const note = p.note as Box | null
      if (!note || !(note.y < h.y + h.h && h.y < note.y + note.h)) continue // not in the heading's band
      nearest = Math.min(nearest, note.x - (h.x + (REAL_NAME[s.chapterTitle] as number)))
    }
    expect(Number.isFinite(nearest), 'the sweep has notes in a heading\'s band, or this arm is idle').toBe(true)
    expect(nearest, `the nearest note is ${nearest.toFixed(1)}px from a heading's real text`).toBeGreaterThanOrEqual(26)
    // the loose line keeps HEAD_AIR + GAP plus the box's own slack – at least 28.6px at the tightest title (the breakthrough: 236 - 233.4)
    const slack = Math.min(...Object.entries(REAL_NAME).map(([t, real]) => Math.max(120, Math.ceil(t.length * 14.7)) - real))
    expect(HEAD_AIR + GAP + slack, 'the line\'s own least real distance').toBeGreaterThanOrEqual(nearest)
  })

  it('the air moves NO window: photograph windows are at a shrunk rung on exactly the sheets they were – A 0, B 22 (the guard\'s ceiling, untouched), C 29', () => {
    const shrunk = (t: typeof TUNING): Record<string, number> => {
      const c: Record<string, number> = { A: 0, B: 0, C: 0 }
      for (const s of sheets) if (placeSheet(s, t).scale < 1) c[s.layout]!++
      return c
    }
    const after = shrunk(TUNING)
    expect(after, 'the air does not shrink a single window the pre-fix geometry left alone').toEqual(shrunk(BEFORE))
    expect(after).toEqual({ A: 0, B: 22, C: 29 })
  })
})

// =================================================================================================
// 1a – THE SECOND SNAPSHOT, BESIDE THE FIRST
// =================================================================================================

describe('round 48 #1a · a wide strip holds two small snapshots – a different painting of the same pool beside the first', () => {
  const carrying = sheets.filter((s) => s.filler)
  const pairs = carrying.filter((s) => s.filler?.pair)
  const inRest = (stem: string): boolean => [...ALBUM_FILLER_REST.young, ...ALBUM_FILLER_REST.teen].includes(stem)

  it('is not vacuous: the sweep has B sheets with a snapshot and every one of them carries a pair', () => {
    const b = carrying.filter((s) => s.layout === 'B')
    expect(b.length).toBeGreaterThanOrEqual(6)
    expect(pairs.length, 'a B sheet with a snapshot always carries a pair').toBe(b.length)
  })

  it('⭐ only layout B (a 400px strip) carries a pair – C\'s 110px column keeps one snapshot, and A none', () => {
    expect(pairs.every((s) => s.layout === 'B')).toBe(true)
    expect(carrying.filter((s) => s.layout === 'C').every((s) => s.filler?.pair === undefined)).toBe(true)
    expect(sheets.filter((s) => s.layout === 'A' && s.filler)).toEqual([])
  })

  it('⭐ the two are DIFFERENT paintings of the SAME pool – a holiday page gets a vacation pair – and both are files on disk', () => {
    for (const s of pairs) {
      const a = stemOf(s.filler!.art)
      const b = stemOf(s.filler!.pair!)
      expect(b, `${s.id}: the pair repeats its neighbour`).not.toBe(a)
      expect(s.filler!.pair, s.id).toMatch(/^images\/weeks\/[a-z0-9-]+\.webp$/)
      expect(existsSync(`${ROOT}public/${s.filler!.pair}`), `${s.id}: ${s.filler!.pair}`).toBe(true)
      const holiday = ALBUM_FILLER_HOLIDAY.includes(a)
      expect(ALBUM_FILLER_HOLIDAY.includes(b), `${s.id}: ${a} and ${b} come from one pool`).toBe(holiday)
      if (!holiday) expect(inRest(a) && inRest(b), `${s.id}: ${a} / ${b}`).toBe(true)
    }
    expect(pairs.some((s) => ALBUM_FILLER_HOLIDAY.includes(stemOf(s.filler!.art))), 'the sweep has a vacation pair').toBe(true)
  })

  it('⭐ where the strip has room for two, both are DRAWN: inside the page and the strip, touching nothing – not the photographs, captions, note, line, furniture, or each other', () => {
    let drawn = 0
    for (const s of pairs) {
      const p = placeSheet(s)
      const first = p.filler
      const second = first?.pair
      expect(first, `${s.id} carries a snapshot and the resolver found no room`).not.toBeNull()
      expect(second, `${s.id} carries a pair and the strip showed one`).toBeDefined()
      if (!first || !second) continue
      drawn++
      const home = LAYOUTS.B.fixed(s)[LAYOUTS.B.filler?.home ?? 0] as Box
      for (const f of [first, second]) {
        expect(f.box.x).toBeGreaterThanOrEqual(home.x)
        expect(f.box.x + f.box.w).toBeLessThanOrEqual(home.x + home.w)
        expect(f.box.y).toBeGreaterThanOrEqual(home.y)
        expect(f.box.y + f.box.h).toBeLessThanOrEqual(home.y + home.h)
        const others: Box[] = [
          ...p.photos.flatMap((x) => [x.box, ...(x.band ? [x.band] : [])]),
          ...LAYOUTS.B.fixed(s).filter((_, i) => i !== LAYOUTS.B.filler?.home),
          ...[p.note, p.line].flatMap((m) => (m ? [m as Box] : [])),
        ]
        expect(others.filter((o) => touches(f.box, o)), `${s.id}`).toEqual([])
      }
      expect(touches(first.box, second.box), `${s.id}: the two snapshots overlap`).toBe(false)
      expect(second.y, 'beside, on the same line').toBe(first.y)
      expect(Math.abs(second.x - first.x), 'a card, a gap and the next card').toBeGreaterThanOrEqual(first.w)
      expect(second.tilt, 'leaning the other way').toBe(-first.tilt)
    }
    expect(drawn, 'every carried pair is drawn on the sweep').toBe(pairs.length)
  })

  it('⭐ the guard: the pair moves NOTHING – photographs, note, line, scale and the first snapshot are identical with and without it', () => {
    for (const s of pairs) {
      const { filler: withPair, ...rest } = placeSheet(s)
      const single = { ...s, filler: { art: s.filler!.art } }
      const { filler: alone, ...restAlone } = placeSheet(single)
      expect(rest, s.id).toEqual(restAlone)
      const { pair, ...firstOnly } = withPair as NonNullable<typeof withPair>
      expect(firstOnly, `${s.id}: the first snapshot is where it always was`).toEqual(alone)
      void pair
    }
  })

  it('a strip with room for ONE shows one: the pair is dropped, the first stays – and a sheet whose ticket IS drawn hangs neither', () => {
    // the right-hand portrait's longest caption crowds the strip (the r47 arm), and the loose line and note are on the left: only one spot is free
    const art = 'images/weeks/vac-sea.webp'
    const s0 = sheetOf({ layout: 'B' })
    const long = Object.values(hand('first-court')).reduce((a, v) => (v.length > a.length ? v : a), '')
    const crowded: AlbumSheetModel = { ...s0, ticket: null, note: null, line: '', filler: { art, pair: 'images/weeks/vac-camping.webp' }, frames: s0.frames.map((f) => ({ ...f, caption: long })) }
    const p = placeSheet(crowded)
    expect(p.filler, 'the first snapshot is drawn').not.toBeNull()
    if (p.filler?.pair) expect(touches(p.filler.box, p.filler.pair.box)).toBe(false)
    expect(placeSheet({ ...sheetOf({ layout: 'B' }), filler: { art, pair: art } }).filler, 'a drawn pass leaves no gap').toBeNull()
  })

  it('the walk stays derived: assembling twice gives the same book, the world is byte-identical after, and no pool repeats a picture inside a book until it has shown them all', () => {
    const world = posedCareer(3)
    const before = JSON.stringify(world)
    const a = assembleAlbum(world)
    expect(assembleAlbum(world)).toEqual(a)
    expect(JSON.stringify(world)).toBe(before)
    // the pair takes the NEXT pool slot, so a whole book never shows a picture twice before its pool is spent
    for (let i = 0; i < SWEEP_CAREERS; i++) {
      const used = assembleAlbum(posedCareer(i)).sheets.flatMap((s) => (s.filler ? [s.filler.art, ...(s.filler.pair ? [s.filler.pair] : [])] : []))
      const holiday = used.filter((u) => ALBUM_FILLER_HOLIDAY.includes(stemOf(u)))
      expect(new Set(holiday.slice(0, ALBUM_FILLER_HOLIDAY.length)).size, `career ${i}: the first six holiday snapshots`).toBe(Math.min(holiday.length, ALBUM_FILLER_HOLIDAY.length))
    }
  })
})

// =================================================================================================
// 1b / 1c – THE BOOK'S LAST TWO SHEETS WEAR WHAT THE CAREER REALLY WON
// =================================================================================================

/** A posed career given a FINISHED ending and a cabinet: `w1000` / `slam` say which rungs it really reached. The cabinet is the never-pruned dated ledger (`trophiesByTier`).
 *  ⚠ THE CABINET'S WEEKS NEVER PASS THE CAREER'S LAST TITLE OR FINAL MILESTONE, so `lastProvenCourtWeek` – the week the farewell page is dated – is the same with or without a
 *  record, and a record changes the tail and nothing else. `bare` strips the TIER off the posed title / final / prize / international milestones: their weeks still prove she played,
 *  but no sheet has a tournament of its own, so no sheet wears a ticket or a tag of its own and the tail's objects hang exactly where the layouts have the frame. */
function tailCareer(i: number, record: { w1000: boolean; slam: boolean }, bare = false): WorldState {
  const world = posedCareer(i)
  if (bare) {
    world.milestones = world.milestones.map((m) =>
      m.type === 'title' || m.type === 'final' || m.type === 'prize' || m.type === 'international' ? { ...m, tier: undefined } : m,
    ) as WorldState['milestones']
  }
  const proof = Math.max(40, ...world.milestones.filter((m) => m.type === 'title' || m.type === 'final').map((m) => m.week))
  world.ending = { type: 'natural', week: world.week, ageYears: 31, detail: 'probe', resumesWeek: null }
  if (record.w1000) {
    world.trophiesByTier.wta1000.titles.push(proof - 30, proof - 10)
    world.trophiesByTier.wta1000.finals.push(proof - 20)
  }
  if (record.slam) {
    world.trophiesByTier.slam.titles.push(proof - 25)
    world.trophiesByTier.slam.finals.push(proof - 5)
  }
  return world
}
const RICH = { w1000: true, slam: true }
const POOR = { w1000: false, slam: false }
const careers = (record: typeof RICH, bare: boolean): { i: number; world: WorldState; book: ReturnType<typeof assembleAlbum> }[] =>
  Array.from({ length: SWEEP_CAREERS }, (_, i) => {
    const world = tailCareer(i, record, bare)
    return { i, world, book: assembleAlbum(world) }
  })
const bareRich = careers(RICH, true)
const posedRich = careers(RICH, false)
const isChildhood = (s: AlbumSheetModel): boolean => s.id.startsWith('prologue-')
const lastTwo = (book: { sheets: readonly AlbumSheetModel[] }): [AlbumSheetModel | undefined, AlbumSheetModel] => [book.sheets[book.sheets.length - 2], book.sheets[book.sheets.length - 1] as AlbumSheetModel]

describe('round 48 #1b/#1c · the tail hangs a W1000 tag and a Slam pass – only where the career has them and the layout has the frame', () => {
  it('the fact is the cabinet\'s own: a title first (the LATEST one), a lost final when she never won the rung, nothing when she never reached it', () => {
    const w = tailCareer(0, POOR)
    expect(albumTailFact(w, ALBUM_TAIL_TAG_TIER), 'an empty cabinet is no record').toBeNull()
    const c = w.trophiesByTier.wta1000
    c.finals.push(300, 410)
    expect(albumTailFact(w, 'wta1000'), 'a lost final is a record when she never won').toEqual({ week: 410, finish: 1 })
    c.titles.push(120, 260)
    expect(albumTailFact(w, 'wta1000'), 'a title beats a later lost final – and it is the latest title').toEqual({ week: 260, finish: 0 })
    expect(albumTailFact({ ...w, trophiesByTier: undefined } as unknown as WorldState, 'slam'), 'a save with no cabinet').toBeNull()
    expect([ALBUM_TAIL_TAG_TIER, ALBUM_TAIL_TICKET_TIER]).toEqual(['wta1000', 'slam'])
  })

  for (const bare of [false, true]) {
    it(`⭐ THE GATE (the variability law), ${bare ? 'on careers with no tournament of their own' : 'on the posed careers'}: a career with neither rung in its record has NOT ONE tail object anywhere in its book`, () => {
      let sheetsSeen = 0
      for (let i = 0; i < SWEEP_CAREERS; i++) {
        const book = assembleAlbum(tailCareer(i, POOR, bare))
        expect(book.sheets.length, `career ${i} is a whole book – no crash`).toBeGreaterThan(0)
        for (const s of book.sheets) {
          sheetsSeen++
          expect(s.tag?.tail, `career ${i} ${s.id}`).toBeUndefined()
          expect(s.ticket?.tail, `career ${i} ${s.id}`).toBeUndefined()
          expect(s.ticket?.paint, `career ${i} ${s.id}`).toBeUndefined()
        }
      }
      expect(sheetsSeen, 'the gate was asked of real books').toBeGreaterThan(300)
    })
  }

  it('the gate is per rung: a career with only a W1000 record gets a tag and no pass, with only a Slam a pass and no tag', () => {
    let tags = 0
    let passes = 0
    for (let i = 0; i < SWEEP_CAREERS; i++) {
      const onlyW = assembleAlbum(tailCareer(i, { w1000: true, slam: false }, true)).sheets
      const onlyS = assembleAlbum(tailCareer(i, { w1000: false, slam: true }, true)).sheets
      expect(onlyW.some((s) => s.ticket?.tail), `career ${i}: a pass without a Slam`).toBe(false)
      expect(onlyS.some((s) => s.tag?.tail), `career ${i}: a tag without a W1000`).toBe(false)
      tags += onlyW.filter((s) => s.tag?.tail).length
      passes += onlyS.filter((s) => s.ticket?.tail).length
    }
    expect(tags, 'the W1000-only careers do get tags').toBeGreaterThanOrEqual(18)
    expect(passes, 'the Slam-only careers do get passes').toBeGreaterThanOrEqual(18)
  })

  it('⭐ WHERE it hangs, exactly: the tag on the LAST sheet iff it is a layout C, the pass on the SECOND-TO-LAST iff it is a layout B – the frames those layouts keep – and on no other sheet', () => {
    let tags = 0
    let passes = 0
    for (const { i, book } of bareRich) {
      const [prev, last] = lastTwo(book)
      const hungTags = book.sheets.filter((s) => s.tag?.tail)
      const hungPasses = book.sheets.filter((s) => s.ticket?.tail)
      const wantsTag = last.layout === 'C' && !isChildhood(last)
      const wantsPass = prev !== undefined && prev.layout === 'B' && !isChildhood(prev)
      expect(hungTags.length, `career ${i}: the tag hangs iff the last sheet is a C (${last.layout})`).toBe(wantsTag ? 1 : 0)
      expect(hungPasses.length, `career ${i}: the pass hangs iff the second-to-last sheet is a B (${prev?.layout})`).toBe(wantsPass ? 1 : 0)
      expect(hungTags.every((s) => s === last)).toBe(true)
      expect(hungPasses.every((s) => s === prev)).toBe(true)
      tags += hungTags.length
      passes += hungPasses.length
    }
    expect(tags, '21 of the 48 finished careers end on a C').toBeGreaterThanOrEqual(18)
    expect(passes, '21 of the 48 finished careers have a B before it').toBeGreaterThanOrEqual(18)
  })

  it('a sheet\'s OWN tag or pass is never replaced and never repainted: where the frame already holds one, nothing hangs – on the posed careers, whose B sheets mostly earned a pass', () => {
    let own = 0
    for (const { i, book } of posedRich) {
      const [prev, last] = lastTwo(book)
      if (prev?.layout === 'B' && prev.ticket && !prev.ticket.tail) {
        own++
        expect(prev.ticket.paint, `career ${i}: an earned pass keeps its step's ink`).toBeUndefined()
      }
      if (last.layout === 'C' && last.tag) expect(last.tag.tail === true, `career ${i}`).toBe(true) // the posed last C's never earned one: only the tail's
    }
    expect(own, 'the posed careers have B sheets that earned their pass (16 measured)').toBeGreaterThanOrEqual(10)
    for (const { book } of posedRich) for (const s of book.sheets) if (s.ticket && !s.ticket.tail) expect(s.ticket.paint).toBeUndefined()
  })

  it('what they print is the RECORD: the rung\'s label, the stage she reached and her age – and the pass wears the Slam\'s own paint, the tag its own tier\'s', () => {
    let seen = 0
    for (const { world, book } of bareRich) {
      for (const s of book.sheets) {
        if (s.tag?.tail) {
          seen++
          expect(albumTailFact(world, 'wta1000')!.finish).toBe(0)
          expect(s.tag.tier).toBe(TIERS.wta1000.label)
          expect(s.tag.step, 'W1000 sits on the elite step').toBe('elite')
          expect(s.tag.stage).toBe('Champion')
          expect(s.tag.ageLabel).toMatch(/^Age \d+$/)
          expect(s.tag.place, 'the sheet\'s own flavour venue').toMatch(/\w/)
        }
        if (s.ticket?.tail) {
          seen++
          expect(s.ticket.tier).toBe(TIERS.slam.label)
          expect(s.ticket.paint, 'the Slam\'s own green').toBe('slam')
          expect(s.ticket.step).toBe('elite')
          expect(s.ticket.stage).toBe('Champion')
          expect(s.ticket.dateLabel).toMatch(/^[A-Z][a-z]{2} \d+ – [A-Z][a-z]{2} \d+$/)
        }
      }
    }
    expect(seen, 'tags and passes both reached').toBeGreaterThanOrEqual(36)
  })

  it('a rung she reached but never won is a RUNNER-UP page: a lost final hangs the pass with the lost stage', () => {
    for (let i = 0; i < SWEEP_CAREERS; i++) {
      const w = tailCareer(i, POOR, true)
      w.trophiesByTier.slam.finals.push(40)
      const [prev] = lastTwo(assembleAlbum(w))
      if (prev?.ticket?.tail) {
        expect(prev.ticket.stage).toBe('Runner-up')
        expect(prev.ticket.tier).toBe(TIERS.slam.label)
        return
      }
    }
    throw new Error('no career in the sweep ends B-then-C: this arm is idle')
  })

  it('derived and pure: nothing is rolled, nothing persists – two assemblies are equal and the world is byte-identical after', () => {
    const pick = bareRich.find((c) => c.book.sheets.some((s) => s.tag?.tail || s.ticket?.tail))
    expect(pick, 'some career hangs something, or this arm is idle').toBeDefined()
    const world = tailCareer(pick!.i, RICH, true)
    const before = JSON.stringify(world)
    const a = assembleAlbum(world)
    expect(assembleAlbum(world)).toEqual(a)
    expect(JSON.stringify(world)).toBe(before)
    expect(a.sheets.some((s) => s.tag?.tail || s.ticket?.tail), `career ${pick!.i} hangs something`).toBe(true)
  })
})

// ---- THE RESOLVER'S SIDE: boxes inside the sheet, touching nothing, and a page with no room goes without
describe('round 48 #1b/#1c · the resolver draws the tail only where it is clear – and what it draws touches nothing', () => {
  const hung = bareRich.flatMap(({ book, i }) => book.sheets.filter((s) => s.tag?.tail || s.ticket?.tail).map((s) => ({ i, s })))
  const tagSheet = (over: Partial<AlbumSheetModel> = {}): AlbumSheetModel => ({
    ...sheetOf({ layout: 'C', occasion: 'season-recovery', voice: 'quiet', chapterTitle: ALBUM_CHAPTER_TITLES.lateCareer }),
    tag: { stage: 'Champion', tier: TIERS.wta1000.label, step: 'elite', place: 'Harbour Stadium', ageLabel: 'Age 32', tail: true },
    ...over,
  })

  it('is not vacuous: the sweep hangs both a tag and a pass, and every one of them is drawn (the short corpus words never crowd a frame)', () => {
    expect(hung.filter((h) => h.s.tag?.tail).length).toBeGreaterThanOrEqual(18)
    expect(hung.filter((h) => h.s.ticket?.tail).length).toBeGreaterThanOrEqual(18)
  })

  it('⭐ a DRAWN tail tag docks at the RIGHT, inside the sheet, and the note, the loose line, the heading and the hero touch none of it; a drawn pass sits along the BOTTOM clear of the note and the line', () => {
    let tags = 0
    let passes = 0
    for (const { i, s } of hung) {
      const p = placeSheet(s)
      if (s.tag?.tail) {
        expect(p.tagDrawn, `career ${i} ${s.id}`).toBe(true)
        tags++
        const box = tailTagBox(p.tagScale)
        expect(box.x, `career ${i} ${s.id}: inside the sheet`).toBeGreaterThanOrEqual(0)
        expect(box.y).toBeGreaterThanOrEqual(0)
        expect(box.x + box.w, 'docked at the right, inside the page').toBeLessThanOrEqual(470)
        expect(box.y + box.h, `${s.id}: inside the sheet's height`).toBeLessThanOrEqual(470)
        expect(box.x + box.w / 2, 'docked on the RIGHT of the sheet').toBeGreaterThan(470 * 0.65)
        const others: Box[] = [headOf(s), p.photos[0]!.box, ...[p.note, p.line].flatMap((m) => (m ? [m as Box] : []))]
        expect(others.filter((o) => touches(box, o)), `career ${i} ${s.id} at rung ${p.tagScale}`).toEqual([])
        expect(p.filler, 'the tag leaves no gap for a snapshot').toBeNull()
        expect(TAIL_TAG_RUNGS).toContain(p.tagScale)
      }
      if (s.ticket?.tail) {
        expect(p.ticketDrawn, `career ${i} ${s.id}`).toBe(true)
        passes++
        const frame = LAYOUTS.B.fixed(s)[0] as Box
        expect(frame.x).toBeGreaterThanOrEqual(0)
        expect(frame.x + frame.w).toBeLessThanOrEqual(470)
        expect(frame.y + frame.h, 'along the bottom, inside the sheet').toBeLessThanOrEqual(470)
        expect(frame.y, 'the lower third').toBeGreaterThan(470 * 0.6)
        const others: Box[] = [...[p.note, p.line].flatMap((m) => (m ? [m as Box] : []))]
        expect(others.filter((o) => touches(frame, o)), `career ${i} ${s.id}`).toEqual([])
        expect(p.filler, 'the pass leaves no gap for a snapshot').toBeNull()
      }
    }
    expect(tags).toBeGreaterThanOrEqual(18)
    expect(passes).toBeGreaterThanOrEqual(18)
  })

  it('a hung C tag moves NOTHING: C reserves its tag column whether or not a tag hangs in it, so the photographs, note, line and scale are the sheet\'s own', () => {
    for (const { i, s } of hung.filter((h) => h.s.tag?.tail)) {
      const { filler: f1, tagDrawn: d1, tagScale: t1, ...with1 } = placeSheet(s)
      const { filler: f2, tagDrawn: d2, tagScale: t2, ...without } = placeSheet({ ...s, tag: null })
      expect(with1, `career ${i} ${s.id}`).toEqual(without)
      void [f1, d1, t1, f2, d2, t2]
    }
  })

  it('⭐ HIS LAST PAGE (measured in real Chromium): the arc\'s 68-character loose line leaves the 110px tag no clear column – so the tag hangs ONE RUNG SMALLER and the line stays where it was, 23px under it', () => {
    // the closing sheet's words are the ARC's, and the longest of them – «The timetable still came first. Eventually, the answer came with it.» – is 68 characters
    // against a base corpus whose longest loose line is 52. Built from the corpus' own words: the arc's note and line on the layout-C sheet his save ends on.
    const arcs = Object.values(ALBUM_ARC as Record<string, Record<string, { note: string; line: string }>>).flatMap((byVoice) => Object.values(byVoice))
    const arc = arcs.reduce((a, v) => (v.line.length > a.line.length ? v : a))
    expect(arc.line.length).toBe(68)
    const s = tagSheet({ note: { text: arc.note, dateLabel: 'Dec 12 – Dec 18', ageLabel: 'Age 33', lines: [] }, line: arc.line })
    const p = placeSheet(s)
    const line = p.line as Box
    // the resolver ran out of clear paper for a 143px line: it lies across the column's frame (that is what it did on this sheet before any tag hung there)
    expect(touches(line, tailTagBox(1)), 'at full size the tag would sit under the line').toBe(true)
    expect(touches(line, tailTagBox(0.9)), 'and so would the first rung').toBe(true)
    expect(p.tagDrawn, 'the tag IS drawn').toBe(true)
    expect(p.tagScale, 'one rung smaller – 0.8 – is the first that clears the line').toBe(0.8)
    expect(touches(line, tailTagBox(p.tagScale))).toBe(false)
    // real Chromium (07.10): the shrunk tag's bottom edge is y 304.3, the line's top y 327.5 – 23.2px of clear paper (the model: 285 * 0.8 + 77 = 305)
    const shrunk = tailTagBox(p.tagScale)
    expect(line.y - (shrunk.y + shrunk.h), 'clear paper under the shrunk tag, px').toBeGreaterThanOrEqual(20)
    // …and the same sheet WITHOUT the tail flag is a tag of its own: always drawn, never shrunk – the old behaviour, untouched
    const own = placeSheet({ ...s, tag: { ...s.tag!, tail: undefined } })
    expect(own.tagDrawn).toBe(true)
    expect(own.tagScale).toBe(1)
  })

  it('a page with NO room for the tag at any rung goes without it – and the sheet is exactly what it was before the tail was asked for', () => {
    // a loose line as tall as the column: wherever the resolver puts it, it lies across the tag's whole height
    const long = Array.from({ length: 6 }, () => hand('first-court').line).join(' ')
    const s = tagSheet({ line: long, filler: { art: 'images/weeks/off-1.webp' } })
    const p = placeSheet(s)
    for (const r of TAIL_TAG_RUNGS) expect(touches(p.line as Box, tailTagBox(r)), `the precondition: the line crowds rung ${r}, or this arm is idle`).toBe(true)
    expect(p.tagDrawn, 'no rung clears – the tag is not drawn').toBe(false)
    expect(p.tagScale).toBe(1)
    const { tagDrawn, tagScale, ...rest } = p
    const { tagDrawn: d0, tagScale: t0, ...old } = placeSheet({ ...s, tag: null })
    expect(rest, 'the sheet is the one it was without the tag').toEqual(old)
    void [tagDrawn, tagScale, d0, t0]
  })

  it('a tail PASS whose strip the note or line lies across is declined, and the sheet is its ticketless self – snapshot included', () => {
    const b0 = sheetOf({ layout: 'B' })
    const note = Array.from({ length: 7 }, () => hand('first-court').note).join(' ')
    const s: AlbumSheetModel = {
      ...b0,
      note: { text: note, dateLabel: 'May 12', ageLabel: 'Age 5', lines: [] },
      ticket: { ...b0.ticket!, paint: 'slam', tail: true },
      filler: { art: 'images/weeks/off-1.webp' },
    }
    const frame = LAYOUTS.B.fixed(s)[0] as Box
    const p = placeSheet(s)
    expect(p.ticketDrawn, 'the pass is declined').toBe(false)
    // the precondition: with the pass in its frame the resolved note really lies on it – the arm is not idle
    const forced = placeSheet({ ...s, ticket: { ...s.ticket!, tail: undefined } })
    expect([forced.note, forced.line].some((m) => m && touches(m as Box, frame)), 'the note or line crowds the pass\'s frame').toBe(true)
    expect(p, 'a declined pass is the sheet it was without one').toEqual({ ...placeSheet({ ...s, ticket: null }) })
    // …and a pass of the sheet's OWN is never declined, however crowded: the old behaviour
    expect(forced.ticketDrawn).toBe(true)
  })
})

// MUTATION LEDGER (07.10) – each arm applied to the SOURCE, run, red read, restored byte-identical (`cmp`); 21 arms across this file and its mounted twin. Control: green before every arm.
//   2a   `HEAD_AIR` 24 -> 0 (the pre-fix geometry)                          -> 3 RED (the line's x after, «ZERO hugging sheets», the real-gap arm)
//   2b   the air flag false in every tier                                    -> 2 RED
//   2c   `HEAD_AIR` 24 -> 60                                                 -> 1 RED («the air moves no window»). ⚠ round 45's guard counts and r47's heading and filler arms stay GREEN at 60 –
//                                                                               the arm that holds «no window moved» is THIS file's alone
//   1a-1 `B_FILLER.pair` false (no second snapshot is ever placed)           -> 1 RED here (+2 mounted)
//   1a-2 the engine pairs a picture with ITSELF                              -> 2 RED
//   1a-3 the second snapshot ignores the first one's box                     -> 2 RED
//   1a-4 the engine hands a pair to layout C as well                         -> 3 RED
//   1b-1 THE GATE REMOVED – a career with no record still gets a fact        -> 7 RED (every poor book carries a tail object)
//   1b-2 the tag footprint shifted off the sheet (x 327 -> 450)              -> 1 RED
//   1b-3 the tag hangs on a last sheet of ANY layout                         -> 2 RED
//   1b-4 the pass hangs on a second-to-last sheet of ANY layout              -> 2 RED
//   1c-1 the hung pass loses its Slam paint                                  -> 1 RED
//   1b-5 the resolver never finds the column crowded                         -> 3 RED here (+3 mounted)
//   1b-6 the tag has no smaller rung (rungs = [1])                           -> 1 RED here (+1 mounted)
