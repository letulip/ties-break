// ROUND 50 №3 – TROPHY CUPS IN LAYOUT C'S EMPTY CORNERS (owner, 12.10: «на вот этом типе страниц в альбоме
// справа сверху в углу и слева внизу есть место, может быть мы можем туда какие-то из фото наград-кубков
// ставить соответственно периоду и занятому месту? Без рамки, просто прозрачный фон и картинка с тенюшкой?»).
//
// WHAT SHIPPED, AND WHERE EACH HALF IS HELD
//   · ENGINE `chapterCupOf` (albumBook.ts): the chapter's best silverware. THE RANKING RULE (the architect's):
//     walk TIER_LADDER from the TOP – the first rung whose cabinet holds a title OR a lost final inside the
//     band wins, and at that rung a title (gold) beats a final (silver), so a higher rung's silver outranks a
//     lower rung's gold. Weeks are banded by bandOfAge(kidAgeAt(…)), never by label arithmetic. A semi-only
//     band gets NO cup – semis never enter `trophiesByTier`. ONE cup per chapter, on the chapter's FIRST C
//     sheet (`AlbumSheetModel.cup` – optional, wire-only, nothing persisted moves).
//   · RESOLVER `placeCup` (albumPlacement.ts): a POST-PASS after `placeFiller` – the top-right corner above
//     the tag's frame first, bottom-left second, first free spot wins, null = the sheet goes without. It reads
//     what is settled (cards, bands, furniture, note, line, snapshot and its pair) and moves NONE of it, which
//     is what keeps every count of the round-45/47/48 sweeps standing.
//
// ⭐ MUTATION-VERIFIED (12.10), each arm on the real file and restored byte-identical:
//   · `CUP_SPOTS` emptied (`[]`) -> the sweep arm reds (zero cups placed) and the corner-geometry arm reds;
//   · `chapterCupOf`'s titles/finals order swapped -> «gold beats silver at the rung» reds.
import { describe, it, expect } from 'vitest'
import { assembleAlbum, createWorld, kidAgeAt, type WorldState } from '../src/engine/world'
import { chapterCupOf } from '../src/engine/world/albumBook'
import type { AlbumBand } from '../src/engine/world/albumCorpus'
import { CUP_PX, CUP_SPOTS, CUP_TILT, LAYOUTS, placeSheet, touches, TUNING, type Box } from '../src/components/album/albumPlacement'
import { SWEEP_CAREERS, posedCareer, sweepSheets } from './helpers/albumSweep'
import { region } from './helpers/source'
import { componentFile } from './worldSource'
import { sheetOf } from './component/albumFixture'
import type { AlbumBook, AlbumSheetModel } from '../src/shared/protocol'

// =================================================================================================
// 1 – THE RANKING RULE, on a world whose cabinet this file fills by hand
// =================================================================================================

/** The first week of each age the career walks – the same scan the posed careers use. */
function weekAt(world: WorldState, age: number): number {
  for (let w = 0; w < 1500; w++) if (kidAgeAt(world, w) === age) return w
  throw new Error(`no week at age ${age} – the scan is out of date`)
}

/** A fresh world with the cabinet filled: `[tier, 'titles' | 'finals', age]` rows, weeks dated off the age. */
function cabinets(rows: readonly [string, 'titles' | 'finals', number][]): WorldState {
  const world = createWorld('r50-cups-unit')
  for (const [tier, shelf, age] of rows) {
    world.trophiesByTier[tier as keyof typeof world.trophiesByTier][shelf].push(weekAt(world, age))
  }
  return world
}

describe('round 50 №3 · chapterCupOf – the ranking rule', () => {
  it('a fresh cabinet answers null for every band: a semi-only period has no cup and the corner stays empty', () => {
    const world = createWorld('r50-cups-unit')
    for (const band of ['prologue', 'young', 'teen', 'adult', 'lateCareer'] as AlbumBand[]) {
      expect(chapterCupOf(world, band), band).toBeNull()
    }
  })

  it('gold beats silver at the rung: a title and a lost final at the same tier in the same band -> the title\'s cup', () => {
    const world = cabinets([
      ['w75', 'finals', 18],
      ['w75', 'titles', 19],
    ])
    expect(chapterCupOf(world, 'teen')).toEqual({ tier: 'w75', metal: 'gold' })
  })

  it('the ladder is walked from the top: a higher rung\'s lost final outranks a lower rung\'s title', () => {
    const world = cabinets([
      ['w15', 'titles', 18],
      ['wta1000', 'finals', 19],
    ])
    expect(chapterCupOf(world, 'teen')).toEqual({ tier: 'wta1000', metal: 'silver' })
  })

  it('weeks are banded by bandOfAge, never by the shelf: an adult Slam does not reach the teen chapter, whose own w15 title wins it', () => {
    const world = cabinets([
      ['slam', 'titles', 25],
      ['w15', 'titles', 18],
    ])
    expect(chapterCupOf(world, 'teen')).toEqual({ tier: 'w15', metal: 'gold' })
    expect(chapterCupOf(world, 'adult')).toEqual({ tier: 'slam', metal: 'gold' })
    expect(chapterCupOf(world, 'young'), 'no young-band week in the cabinet').toBeNull()
    expect(chapterCupOf(world, 'lateCareer'), 'no late-band week in the cabinet').toBeNull()
  })

  it('the prologue band owns no career week: even a full cabinet answers null, so the childhood chapter never wears a grown woman\'s cup', () => {
    const world = cabinets([['slam', 'titles', 14]])
    expect(chapterCupOf(world, 'prologue')).toBeNull()
  })

  it('a pure read: the world is byte-identical after, and two calls agree', () => {
    const world = cabinets([['w50', 'titles', 25]])
    const before = JSON.stringify(world)
    const a = chapterCupOf(world, 'adult')
    expect(JSON.stringify(world)).toBe(before)
    expect(chapterCupOf(world, 'adult')).toEqual(a)
  })
})

// =================================================================================================
// 2 – THE CORNER'S OWN GEOMETRY: the first spot uses the strip above the tag frame to the pixel
// =================================================================================================

describe('round 50 №3 · the top-right corner', () => {
  const pad = Math.ceil((CUP_PX / 2) * Math.sin((Math.abs(CUP_TILT) * Math.PI) / 180)) + 1

  it('the first spot\'s swing box bottoms at the tag frame\'s GAP-guarded edge – one pixel lower would touch', () => {
    const frame = LAYOUTS.C.fixed(sheetOf({ layout: 'C' }))[1] as Box
    expect(frame).toEqual({ x: 327, y: 77, w: 110, h: 271 })
    const first = CUP_SPOTS[0] as { x: number; y: number }
    const box: Box = { x: first.x - pad, y: first.y - pad, w: CUP_PX + 2 * pad, h: CUP_PX + 2 * pad }
    expect(box.y + box.h, 'the strip above y 77 is used exactly').toBe(75)
    expect(touches(box, frame)).toBe(false)
    expect(touches({ ...box, y: box.y + 1 }, frame), 'one pixel lower touches the frame').toBe(true)
  })

  it('«с тенюшкой»: the shadow is a drop-shadow – it follows the cut-out\'s alpha edge, where a box-shadow would draw the pasted rectangle he did not ask for', () => {
    // a claim about which FILE carries the CSS declaration is a claim about the path – `componentFile`
    const cupRule = region(componentFile('components/album/AlbumLayoutC.vue'), '.album-c-cup {', '}')
    expect(cupRule).toContain('filter: drop-shadow(')
    expect(cupRule).not.toContain('box-shadow')
  })

  it('a posed C sheet with a cup hangs it at the first spot, frameless at CUP_PX; the same sheet without one shows none', () => {
    const sheet: AlbumSheetModel = { ...sheetOf({ layout: 'C' }), cup: { tier: 'wta1000', metal: 'gold' } }
    const p = placeSheet(sheet)
    expect(p.cup).not.toBeNull()
    expect({ x: p.cup?.x, y: p.cup?.y, size: p.cup?.size, tilt: p.cup?.tilt }).toEqual({ ...CUP_SPOTS[0], size: CUP_PX, tilt: CUP_TILT })
    const { cup: _own, ...bare } = sheet
    expect(placeSheet(bare).cup, 'no cup on the wire, none on the page').toBeNull()
  })
})

// =================================================================================================
// 3 – THE SWEEP: the posed books, the titled arm, and the guard that the post-pass moves nothing
// =================================================================================================

/** The posed careers with their own milestones banked into the never-pruned cabinet – the same facts the
 *  book already draws its title/final sheets from, now dated on the shelf `chapterCupOf` reads. */
function titledWorld(i: number): WorldState {
  const world = posedCareer(i)
  for (const m of world.milestones) {
    if (m.tier === undefined) continue
    if (m.type === 'title') world.trophiesByTier[m.tier].titles.push(m.week)
    if (m.type === 'final') world.trophiesByTier[m.tier].finals.push(m.week)
  }
  for (const shelf of Object.values(world.trophiesByTier)) {
    shelf.titles.sort((a, b) => a - b)
    shelf.finals.sort((a, b) => a - b)
  }
  return world
}

let titledArm: { world: WorldState; book: AlbumBook }[] | null = null
function titledBooks(): { world: WorldState; book: AlbumBook }[] {
  titledArm ??= Array.from({ length: SWEEP_CAREERS }, (_, i) => {
    const world = titledWorld(i)
    return { world, book: assembleAlbum(world) }
  })
  return titledArm
}

// sheet ids are `${band}-${n}` and no band name carries a dash, so the first segment IS the band
const bandOf = (s: AlbumSheetModel): AlbumBand => s.id.split('-')[0] as AlbumBand

describe('round 50 №3 · the sweep', () => {
  it('the pinned 335-sheet sweep is untouched: no posed career holds a trophy, zero cups ride it, and the shrunk-rung counts stand', () => {
    const sheets = sweepSheets()
    expect(sheets.filter((s) => s.cup).length).toBe(0)
    const shrunk: Record<string, number> = { A: 0, B: 0, C: 0 }
    for (const s of sheets) if (placeSheet(s).scale < 1) shrunk[s.layout]!++
    // the r48-b3 pin, re-stamped 12.10 by r49 №7 (C 29 -> 22): the cup moves none of it
    expect(shrunk).toEqual({ A: 0, B: 22, C: 22 })
  })

  it('⭐ the model: every cup rides a C sheet, at most one per chapter, on the chapter\'s FIRST C sheet, and it is chapterCupOf\'s own answer', () => {
    let carriers = 0
    for (const { world, book } of titledBooks()) {
      const byChapter = new Map<number, AlbumSheetModel[]>()
      for (const s of book.sheets) byChapter.set(s.chapterIndex, [...(byChapter.get(s.chapterIndex) ?? []), s])
      for (const [index, own] of byChapter) {
        const withCup = own.filter((s) => s.cup)
        expect(withCup.length, `chapter ${index}: one cup per chapter`).toBeLessThanOrEqual(1)
        const firstC = own.find((s) => s.layout === 'C')
        const cup = chapterCupOf(world, bandOf(own[0] as AlbumSheetModel))
        if (cup && firstC) {
          carriers++
          expect(withCup[0], `chapter ${index}: the cup rides the chapter's first C sheet`).toBe(firstC)
          expect(firstC.cup).toEqual(cup)
        } else {
          expect(withCup.length, `chapter ${index}: no C sheet or no silverware – no cup`).toBe(0)
        }
      }
    }
    expect(carriers, 'the titled arm really exercises the wire').toBeGreaterThan(0)
    // the dated record (12.10): 120 cup-carrying chapters across the 48 titled careers – the law is the
    // shape above, the number is the census, re-stamp it when the corpus or the posed careers move
    expect(carriers).toBe(120)
  })

  it('⭐ the page: ≥1 chapter-cup LANDS for a titled career, no cup box intersects anything placed, and the post-pass moves nothing', () => {
    let placed = 0
    let refused = 0
    const atSpot: Record<string, number> = {}
    for (const { book } of titledBooks()) {
      for (const s of book.sheets) {
        if (!s.cup) continue
        const p = placeSheet(s)
        if (!p.cup) {
          refused++
        } else {
          placed++
          const spot = `${p.cup.x},${p.cup.y}`
          atSpot[spot] = (atSpot[spot] ?? 0) + 1
          // the resolver's own guarantee, asserted anyway: the swing box touches no card, band, furniture,
          // note, loose line or snapshot – and lies on the page
          const page = 470
          expect(p.cup.box.x >= 0 && p.cup.box.y >= 0 && p.cup.box.x + p.cup.box.w <= page && p.cup.box.y + p.cup.box.h <= page).toBe(true)
          const obstacles: Box[] = [
            ...p.photos.flatMap((ph) => [ph.box, ...(ph.band ? [ph.band] : [])]),
            ...LAYOUTS[s.layout].fixed(s),
            ...[p.note, p.line, p.filler?.box, p.filler?.pair?.box].flatMap((b) => (b ? [b] : [])),
          ]
          for (const o of obstacles) expect(touches(p.cup.box, o), `${s.id}: the cup rests on ${JSON.stringify(o)}`).toBe(false)
        }
        // the post-pass guard: the same sheet without its cup resolves to the SAME placement, cup aside
        const { cup: _own, ...bare } = s
        const { cup: _was, ...rest } = p
        const { cup: none, ...bareRest } = placeSheet(bare, TUNING)
        expect(none).toBeNull()
        expect(rest, `${s.id}: asking for a cup moved something`).toEqual(bareRest)
      }
    }
    expect(placed, 'at least one chapter-cup lands on a titled career\'s pages').toBeGreaterThan(0)
    // the dated record (12.10): 116 of the 120 land, every one at the first spot (the top-right corner,
    // 386,4); 4 pages had no clear corner and go without – no room, no object. The law is the ≥1 above
    // and the no-touch sweep; the split is the census, re-stamp it when the corpus moves.
    expect({ placed, refused }).toEqual({ placed: 116, refused: 4 })
    expect(atSpot['386,4'], 'the corner he pointed at is where they land').toBe(116)
  })
})
