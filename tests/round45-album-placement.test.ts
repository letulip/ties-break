// ROUND 45 #6 + #7 – «Расположение фото в альбоме конфликтуют с надписями в самом альбоме и с некоторыми
// записками, которые перекрывают надписи на фото» and «Кроп фото в альбоме берёт среднюю часть фото, на
// некоторых обрезается голова».
//
// WHAT THIS PINS. Every coordinate of an album sheet is a pixel number in `AlbumLayoutA/B/C.vue`; the
// engine hands over only text, and the text varies (a note is 3-7 ruled lines, a caption 1-3). So the
// drawings collided with captions whenever the words ran long, and measuring that needs boxes – which a
// happy-dom mount cannot lay out. `albumPlacement.ts` is a PURE resolver over rectangles, so the
// rectangle math IS the measurement here: 48 posed careers, every sheet of every book.
//
// ⚠ THE «BEFORE» IS IN THE FILE, NOT IN A REPORT. `drawnPlacement` is the layout's own drawing with no
// resolving – exactly what the code did before – and the sweep counts the sheets on which it touches a
// caption. With `placeSheet` replaced by that identity the `ZERO` test below goes red and its message
// carries the count; that run is the «before» of this change.
//
// ⚠ THE HEIGHTS ARE AN ESTIMATE OF HOW CAVEAT WRAPS and the estimate is held against the thing it
// estimates: the REAL table below was measured in Chromium (Playwright over the seeded `pro` career, 6
// sheets, the face loaded, 02.10) and the model may run a line long, never short.
import { describe, it, expect } from 'vitest'
import { assembleAlbum, createWorld, kidAgeAt, type WorldState } from '../src/engine/world'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { pickInt, rngFromSeed } from '../src/engine/rng'
import {
  HAND_EM,
  LAYOUTS,
  NOTE,
  POLAROID,
  SCALES,
  drawnPlacement,
  placeSheet,
  touches,
  wrapLines,
  type Box,
} from '../src/components/album/albumPlacement'
import { componentFile } from './worldSource'
import type { AlbumSheetModel } from '../src/shared/protocol'

// ---------------------------------------------------------------------------------------------------
// 1. THE ESTIMATE, AGAINST REAL CHROMIUM.
// Each row: the text, the width of the box it was set in, the font size, and the lines Chromium drew.
const REAL: { text: string; width: number; font: number; lines: number }[] = [
  { text: 'Your first. You called late, and the first thing you said was about the second set.', width: 150, font: 17, lines: 4 },
  { text: 'Your first one abroad. You said everything sounded different and that you liked it, and that was the message.', width: 125, font: 17, lines: 6 },
  { text: 'The best year so far. You said it had felt like one long week, and I think that was the whole report.', width: 130, font: 17, lines: 5 },
  { text: 'You waited until the year was finished before you would call it a climb back, and then you said it in one sentence.', width: 150, font: 17, lines: 5 },
  { text: 'First week back. You said you had been more afraid of this week than of the injury.', width: 125, font: 17, lines: 5 },
  { text: 'A step up. You said it was the same game with more people watching, and then you went quiet.', width: 130, font: 17, lines: 5 },
  { text: 'Realer than the results, she said.', width: 122, font: 17, lines: 2 },
  { text: 'She never once asked what it had cost.', width: 122, font: 17, lines: 3 },
  { text: 'She asked how long.', width: 107, font: 17, lines: 2 },
  { text: 'One sentence, once the year was finished.', width: 229, font: 17, lines: 2 },
  { text: 'She called after midnight.', width: 229, font: 17, lines: 1 },
  { text: 'She waited for the year to end first.', width: 200, font: 21, lines: 2 },
  { text: 'Late, and exact, as usual.', width: 200, font: 21, lines: 1 },
  { text: 'She waited to say the true thing.', width: 132, font: 20, lines: 2 },
  { text: 'One long week. That was the report.', width: 74, font: 19, lines: 4 },
]

describe('round 45 #6 · the wrap estimate – held against real Chromium', () => {
  it('never under-counts a line and runs at most one long, on all 15 real elements', () => {
    for (const r of REAL) {
      const est = wrapLines(r.text, r.width, r.font)
      expect(est, `«${r.text}» at ${r.width}px/${r.font}px: Chromium drew ${r.lines}`).toBeGreaterThanOrEqual(r.lines)
      expect(est, `«${r.text}» is over-counted by more than a line`).toBeLessThanOrEqual(r.lines + 1)
    }
    expect(HAND_EM, 'the measured faces wrap at 0.37-0.39em; 0.40 is the round number above').toBe(0.4)
  })
})

// ---------------------------------------------------------------------------------------------------
// 2. THE MODEL'S NUMBERS ARE THE COMPONENTS' NUMBERS (a self-stated number needs a pin against the thing).
const polaroidFile = componentFile('components/ui/Polaroid.vue')
const noteFile = componentFile('components/album/AlbumNoteCard.vue')
const photoFile = componentFile('components/album/AlbumPhoto.vue')
const layoutA = componentFile('components/album/AlbumLayoutA.vue')
const layoutB = componentFile('components/album/AlbumLayoutB.vue')
const layoutC = componentFile('components/album/AlbumLayoutC.vue')

/** The `{ … }` block of one CSS rule, throwing when the rule is absent – a rotted selector must fail,
 *  never widen a region. */
function rule(src: string, selector: string): string {
  const m = new RegExp(`${selector.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`).exec(src)
  if (!m) throw new Error(`no rule ${selector}`)
  return m[1] as string
}
function px(block: string, prop: string): number {
  const m = new RegExp(`(?:^|[;\\s])${prop}:\\s*(-?[\\d.]+)px`).exec(block)
  if (!m) throw new Error(`no ${prop} in: ${block.trim().slice(0, 60)}`)
  return Number(m[1])
}

describe('round 45 #6 · the model is the components\' own numbers', () => {
  it('Polaroid: padding 4/4/12, caption margin 8/4, 17px at 1.15', () => {
    expect(polaroidFile).toMatch(/padding:\s*4px 4px 12px/)
    expect(polaroidFile).toMatch(/margin:\s*8px 4px 0/)
    expect(polaroidFile).toMatch(/font-size:\s*17px/)
    expect(polaroidFile).toMatch(/line-height:\s*1\.15/)
    expect([POLAROID.top, POLAROID.side, POLAROID.bottom, POLAROID.capGap, POLAROID.capSide, POLAROID.capFont]).toEqual([4, 4, 12, 8, 4, 17])
    expect(POLAROID.capLine).toBeCloseTo(POLAROID.capFont * 1.15, 1)
  })

  it('the note: padding 10/13/12 and the 26px ruling', () => {
    expect(noteFile).toMatch(/padding:\s*10px 13px 12px/)
    expect(noteFile).toMatch(/line-height:\s*26px/)
    expect([NOTE.padTop, NOTE.padSide, NOTE.padBottom, NOTE.rule]).toEqual([10, 13, 12, 26])
  })

  it('the furniture the resolver avoids is where the CSS puts it', () => {
    const at = (src: string, cls: string): Box => {
      const b = rule(src, `.${cls}`)
      return { x: px(b, 'left'), y: px(b, 'top'), w: 0, h: 0 }
    }
    const sheet = { chapterTitle: 'x', ticket: null } as unknown as AlbumSheetModel
    const [headA, patchA, doodleA] = LAYOUTS.A.fixed(sheet)
    expect([at(layoutA, 'album-a-head').x, at(layoutA, 'album-a-head').y]).toEqual([headA?.x, headA?.y])
    expect([at(layoutA, 'album-a-patch').x, at(layoutA, 'album-a-patch').y]).toEqual([patchA?.x, patchA?.y])
    expect([at(layoutA, 'album-a-doodle').x, at(layoutA, 'album-a-doodle').y]).toEqual([doodleA?.x, doodleA?.y])
    const [pass, doodleB] = LAYOUTS.B.fixed(sheet)
    expect([at(layoutB, 'album-b-doodle').x, at(layoutB, 'album-b-doodle').y]).toEqual([doodleB?.x, doodleB?.y])
    const passRule = rule(layoutB, '.album-b-pass')
    expect([px(passRule, 'left'), 470 - px(passRule, 'bottom') - (pass?.h ?? 0)]).toEqual([pass?.x, pass?.y])
    const [headC, tagC, doodleC] = LAYOUTS.C.fixed(sheet)
    expect([at(layoutC, 'album-c-head').x, at(layoutC, 'album-c-head').y]).toEqual([headC?.x, headC?.y])
    expect([at(layoutC, 'album-c-tag').x, at(layoutC, 'album-c-tag').y]).toEqual([tagC?.x, tagC?.y])
    expect([at(layoutC, 'album-c-doodle').x, at(layoutC, 'album-c-doodle').y]).toEqual([doodleC?.x, doodleC?.y])
  })

  it('the layouts own no coordinate of the things the resolver places', () => {
    for (const [name, src] of [['A', layoutA], ['B', layoutB], ['C', layoutC]] as const) {
      expect(src, `layout ${name} calls the resolver`).toMatch(/placeSheet\(props\.sheet\)/)
      expect(src, `layout ${name} binds the note and the line from it`).toMatch(/:style="spot\(placed\.note\)"/)
      expect(src).toMatch(/:style="spot\(placed\.line\)"/)
      expect(src).toMatch(/:style="spot\(placed\.photos\[0\]\)"/)
    }
    // the numbers the layouts used to carry (a note's bottom anchor, a line's left) are gone from the CSS
    expect(rule(layoutB, '.album-b-note')).not.toMatch(/bottom:|left:|width:/)
    expect(rule(layoutC, '.album-c-note')).not.toMatch(/bottom:|left:|width:/)
    expect(rule(layoutA, '.album-a-line')).not.toMatch(/left:|top:|width:/)
  })
})

// ---------------------------------------------------------------------------------------------------
// 3. ITEM 7 – THE CROP ANCHOR (the file's half; the rendered half is in tests/component/).
describe('round 45 #7 · the album crop anchors near the top', () => {
  it('AlbumPhoto hands Polaroid an object-position that is 10% down, not the centre', () => {
    expect(photoFile).toMatch(/const ALBUM_CROP = \{ objectPosition: '50% 10%' \}/)
    expect(photoFile).toMatch(/:photo-style="ALBUM_CROP"/)
  })

  it('the mechanism is `object-fit: cover` in Polaroid – the default centre is what cut the heads', () => {
    expect(rule(polaroidFile, '.tb-polaroid img')).toMatch(/object-fit:\s*cover/)
    expect(rule(polaroidFile, '.tb-polaroid img')).not.toMatch(/object-position/)
  })
})

// ---------------------------------------------------------------------------------------------------
// 4. THE SWEEP – the same 48 posed careers as round 45 #8's, every sheet of every book.
function firstWeeks(world: WorldState): Map<number, number> {
  const out = new Map<number, number>()
  for (let w = 0; w < 1500; w++) {
    const age = kidAgeAt(world, w)
    if (!out.has(age)) out.set(age, w)
  }
  return out
}

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
    world.milestones.push({ type: 'season-rank', week: note(weekIn(13, 36)), seasonIndex: n, rank: pickInt(rng, 1, 300) })
  }
  world.week = last + 1
  return world
}

const CAREERS = 48
const sheets: AlbumSheetModel[] = Array.from({ length: CAREERS }, (_, i) => assembleAlbum(posedCareer(i))).flatMap((b) => b.sheets)

const hitsBand = (m: Box | null, bands: readonly Box[]): boolean => !!m && bands.some((b) => touches(m, b))

describe('round 45 #6 · the sweep – no note and no loose line touches a caption', () => {
  it('the sweep is not vacuous: every layout is there, and the DRAWINGS touched captions on N > 0 of its sheets', () => {
    const byLayout = { A: 0, B: 0, C: 0 }
    const before = { A: 0, B: 0, C: 0 }
    for (const s of sheets) {
      byLayout[s.layout]++
      const d = drawnPlacement(s)
      if (hitsBand(d.note, d.bands) || hitsBand(d.line, d.bands)) before[s.layout]++
    }
    expect(sheets.length).toBeGreaterThanOrEqual(CAREERS * 3)
    for (const k of ['A', 'B', 'C'] as const) {
      expect(byLayout[k], `layout ${k} appears in the sweep`).toBeGreaterThan(0)
      expect(before[k], `layout ${k}: the unresolved drawing must touch a caption somewhere, or the sweep proves nothing`).toBeGreaterThan(0)
    }
  })

  it('⭐ ZERO caption contacts after resolving, on every sheet – and none needed the stack-below fallback', () => {
    const bad: string[] = []
    let unclear = 0
    for (const s of sheets) {
      const p = placeSheet(s)
      const bands = p.photos.flatMap((x) => (x.band ? [x.band] : []))
      if (hitsBand(p.note, bands) || hitsBand(p.line, bands)) bad.push(`${s.layout} ${s.id}`)
      if (!p.clear) unclear++
    }
    expect(bad, `${bad.length} of ${sheets.length} sheets still put a note or a line on a caption`).toEqual([])
    expect(unclear, 'sheets that had to be stacked below because no free spot existed').toBe(0)
  })

  it('every resolved note and line is inside the page (the sheet clips what is past its edge)', () => {
    for (const s of sheets) {
      const p = placeSheet(s)
      for (const m of [p.note, p.line]) {
        if (!m) continue
        expect(m.x, `${s.id} left`).toBeGreaterThanOrEqual(0)
        expect(m.y, `${s.id} top`).toBeGreaterThanOrEqual(0)
        expect(m.x + m.w, `${s.id} right`).toBeLessThanOrEqual(470)
        expect(m.y + m.h, `${s.id} bottom`).toBeLessThanOrEqual(470)
      }
    }
  })

  it('a photograph only leaves the page when its window is already at the smallest rung', () => {
    const floor = SCALES[SCALES.length - 1] as number
    for (const s of sheets) {
      const p = placeSheet(s)
      p.photos.forEach((ph, i) => {
        const drawn = (LAYOUTS[s.layout].photos[i]?.photoH ?? 0) * floor
        if (ph.box.y + ph.box.h > 470) {
          expect(ph.photoH, `${s.id} photo ${i} hangs off the page above the floor`).toBeLessThanOrEqual(Math.round(drawn))
        }
      })
    }
  })

  it('the same sheet resolves to the same answer twice – no clock, no dice', () => {
    for (const s of sheets.filter((_, i) => i % 11 === 0)) {
      expect(placeSheet(s)).toEqual(placeSheet(s))
    }
  })
})
