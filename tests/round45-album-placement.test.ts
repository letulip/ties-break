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
  NOTE_STEPS,
  POLAROID,
  SCALES,
  TUNING,
  drawnPlacement,
  noteHands,
  noteHeight,
  noteSpot,
  noteStep,
  placeSheet,
  spot,
  touches,
  wrapLines,
  type Box,
  type NoteBox,
  type Tuning,
} from '../src/components/album/albumPlacement'
import { componentFile } from './worldSource'
import type { AlbumLayout, AlbumSheetModel } from '../src/shared/protocol'

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
      expect(src, `layout ${name} binds the note from it, by its own spot (position AND the size it is drawn at)`).toMatch(/:style="noteSpot\(placed\.note\)"/)
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

// ---------------------------------------------------------------------------------------------------
// 5. ROUND 45 #6b – THE NOTE DRAWN SMALLER, THE HERO KEPT CLEAR, THE WINDOWS SPARED (the owner, 02.10: «может
// быть пересмотреть размер самих записочек, может быть расположение в местах пересечения букв»).
//
// ⚠ THE «BEFORE» IS A MEASUREMENT AND AN ARM. MEASURED on 19a5748b (B6's resolver) over THIS sweep, 335 sheets:
// 52 of 121 layout C sheets put a note on the hero PICTURE (1,405,540 px² in all), and photograph windows were
// at a shrunk rung on 26 of 147 A, 45 of 67 B and 59 of 121 C sheets. `B6` below is that resolver's knobs as
// DATA – no step, windows at 15 a percent, no hero kept, no border tier – so the sweep reproduces the «before»
// live and cannot go idle. (It runs on today's slots, so it is the same knobs, not a byte-for-byte replay.)
const OFF = [{ upTo: Infinity, step: 1 }]
// (the loose line's widths and the six-spot note search are today's: same knobs, not a byte-for-byte replay)
const B6: Tuning = {
  steps: OFF,
  shrinkCost: 15,
  widenCost: 20,
  coverCost: 0.02,
  stepCost: 0,
  borderCost: Infinity,
  protectHero: false,
  // the C note slot B6 shipped: 156/220/290 wide, bottom at 434 – the strip under the hero never had those widths
  slots: { C: { x: 28, y: 434, anchor: 'bottom', widths: [156, 220, 290] } },
}

type Placed = ReturnType<typeof placeSheet>
const overlap = (a: Box, b: Box): number =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
const heroPicture = (p: Placed): Box | null => {
  const h = p.photos[0]
  return h ? { x: h.x, y: h.y + POLAROID.top, w: h.w, h: h.photoH } : null
}

interface Counters {
  sheets: Record<AlbumLayout, number>
  /** sheets whose photograph windows were drawn at a rung below the layout's own height */
  shrunk: Record<AlbumLayout, number>
  /** C sheets on which the resolved note or loose line touches the hero picture */
  heroCovered: number
  /** notes drawn smaller than what their length earned, or under the floor – must be 0 */
  badStep: number
  /** resolved notes by the size they are drawn at */
  atStep: Record<string, number>
}
const memo = new Map<string, Counters>()
function sweep(name: string, tuning: Tuning): Counters {
  const hit = memo.get(name)
  if (hit) return hit
  const c: Counters = { sheets: { A: 0, B: 0, C: 0 }, shrunk: { A: 0, B: 0, C: 0 }, heroCovered: 0, badStep: 0, atStep: {} }
  const floor = Math.min(...NOTE_STEPS.map((x) => x.step))
  for (const s of sheets) {
    const p = placeSheet(s, tuning)
    c.sheets[s.layout]++
    if (p.scale < 1) c.shrunk[s.layout]++
    const hero = heroPicture(p)
    if (s.layout === 'C' && hero && [p.note, p.line].some((m) => m && overlap(m, hero) > 0)) c.heroCovered++
    if (p.note) {
      c.atStep[p.note.step] = (c.atStep[p.note.step] ?? 0) + 1
      if (p.note.step < Math.min(floor, ...tuning.steps.map((x) => x.step)) || p.note.step > noteStep(s.note, tuning.steps)) c.badStep++
    }
  }
  memo.set(name, c)
  return c
}

describe('round 45 #6b · the hand a note is written in', () => {
  it('steps by length: up to 72 characters as drawn, up to 100 at 0.9, longer at 0.82 – two steps and a floor', () => {
    expect(NOTE_STEPS.map((x) => x.step)).toEqual([1, 0.9, 0.82])
    expect(NOTE_STEPS.map((x) => x.upTo)).toEqual([72, 100, Infinity])
    const text = (n: number): { text: string; lines: string[]; dateLabel: string; ageLabel: string } => ({ text: 'a'.repeat(n), lines: [], dateLabel: '', ageLabel: '' })
    expect([72, 73, 100, 101, 127].map((n) => noteStep(text(n)))).toEqual([1, 0.9, 0.9, 0.82, 0.82])
    // the checklist form is its lines read as one
    expect(noteStep({ text: '', lines: ['a'.repeat(40), 'b'.repeat(40)], dateLabel: '', ageLabel: '' })).toBe(0.9)
    expect(noteStep(null)).toBe(1)
  })

  it('a sheet may spend the hands from the one its note earned DOWN to the floor, never up', () => {
    const text = (n: number): { text: string; lines: string[]; dateLabel: string; ageLabel: string } => ({ text: 'a'.repeat(n), lines: [], dateLabel: '', ageLabel: '' })
    expect(noteHands(text(40))).toEqual([1, 0.9, 0.82])
    expect(noteHands(text(90))).toEqual([0.9, 0.82])
    expect(noteHands(text(120))).toEqual([0.82])
    expect(noteHands(text(120), OFF)).toEqual([1])
  })

  it('similitude: the 11 real 17px rows carry over to every step – laid out at full size in a wider box, drawn small', () => {
    // Chromium measured these at 17px; a note drawn at `step` is that layout scaled, so its wrap IS the measured one.
    // The estimate is held to the real line counts at each step, and goes red if the step is not what scales it.
    const rows = REAL.filter((r) => r.font === 17)
    expect(rows.length).toBe(11)
    for (const r of rows) {
      const sheet = { note: { text: r.text, lines: [], dateLabel: '', ageLabel: '' } } as unknown as AlbumSheetModel
      const w = r.width + 2 * NOTE.padSide
      const full = noteHeight(sheet, w, 1)
      expect(full, `«${r.text}»: at least the ${r.lines} real lines`).toBeGreaterThanOrEqual(NOTE.padTop + NOTE.padBottom + r.lines * NOTE.rule)
      expect(full, `«${r.text}»: at most one line over`).toBeLessThanOrEqual(NOTE.padTop + NOTE.padBottom + (r.lines + 1) * NOTE.rule)
      for (const step of [0.9, 0.82]) {
        expect(noteHeight(sheet, w * step, step), `«${r.text}» at ${step}`).toBe(Math.ceil(full * step))
      }
    }
  })

  it('a smaller note is a shorter note: the longest in the corpus at its width is far under the full-size one', () => {
    const long = 'You came back up the table this year and you talked about the two weeks in the middle where it turned, not about the end of it.'
    const sheet = { note: { text: long, lines: [], dateLabel: 'Nov 10 – Nov 16', ageLabel: 'Age 14' } } as unknown as AlbumSheetModel
    expect(noteHeight(sheet, 186, 0.82)).toBeLessThan(noteHeight(sheet, 186, 1) * 0.8)
    expect(noteHeight(sheet, 186, 0.9)).toBeLessThan(noteHeight(sheet, 186, 1))
  })

  it('noteSpot: a full-size note is the plain spot, a smaller one is laid out 1/step wide and scaled from its corner', () => {
    const full: NoteBox = { x: 12, y: 300, w: 186, h: 120, step: 1 }
    expect(noteSpot(full)).toEqual(spot(full))
    const small: NoteBox = { x: 12, y: 300, w: 186, h: 98, step: 0.82 }
    expect(noteSpot(small)).toEqual({ left: '12px', top: '300px', width: '226.83px', transform: 'scale(0.82)', transformOrigin: '0 0' })
  })

  it('every resolved note is drawn at a step of the ladder – never above what its length earned, never under the floor', () => {
    const c = sweep('after', TUNING)
    expect(c.badStep, `steps used: ${JSON.stringify(c.atStep)}`).toBe(0)
    expect(Object.keys(c.atStep).length, 'the sweep uses every step, or the ladder is dead').toBe(3)
  }, 60_000)

  it("C's note slot is the strip under the hero and left of the second photograph – wide and low, not narrow and tall", () => {
    const slot = LAYOUTS.C.note
    expect(LAYOUTS.C.hero, 'the hero is the first photograph').toBe(0)
    expect(slot.anchor).toBe('bottom')
    expect(slot.y, 'a lower page margin than the 434 it was').toBeGreaterThanOrEqual(450)
    expect(slot.x + Math.max(...slot.widths), 'the widest option ends before the second photograph begins').toBeLessThanOrEqual(LAYOUTS.C.photos[1]?.x ?? 0)
    expect(Math.max(...slot.widths), 'wider than the 156 it was – the strip is wide and short').toBeGreaterThan(156)
  })
})

describe('round 45 #6b · the hero stays clear and the windows are spared – over the 335-sheet sweep', () => {
  it('is not vacuous: B6\'s knobs put a note or a line on the hero picture of N > 0 C sheets and shrink windows on most B sheets', () => {
    const b = sweep('b6', B6)
    expect(b.heroCovered, `B6's knobs: ${b.heroCovered} of ${b.sheets.C} C sheets cover the hero`).toBeGreaterThan(0)
    expect(b.shrunk.B, `B6's knobs: ${b.shrunk.B} of ${b.sheets.B} B sheets at a shrunk rung`).toBeGreaterThanOrEqual(40)
  }, 60_000)

  it('⭐ the hero picture is covered by no note and no loose line on ANY C sheet (B6 measured 52 of 121)', () => {
    const c = sweep('after', TUNING)
    expect(c.sheets.C).toBeGreaterThan(100)
    expect(c.heroCovered, `${c.heroCovered} of ${c.sheets.C} C sheets still cover the hero`).toBe(0)
  }, 60_000)

  it('⭐ photograph windows are at a shrunk rung on far fewer sheets: B at most 22 of 67 (B6 measured 45), C 35 of 121 (59), A 10 of 147 (26)', () => {
    const c = sweep('after', TUNING)
    expect(c.shrunk.B, `B: ${c.shrunk.B} of ${c.sheets.B} at a shrunk rung`).toBeLessThanOrEqual(22)
    expect(c.shrunk.C, `C: ${c.shrunk.C} of ${c.sheets.C}`).toBeLessThanOrEqual(35)
    expect(c.shrunk.A, `A: ${c.shrunk.A} of ${c.sheets.A}`).toBeLessThanOrEqual(10)
  }, 60_000)

  it('the step-down is what spares the windows: with the notes written at full size B is back to shrinking on 38+ sheets', () => {
    const c = sweep('no-step', { ...TUNING, steps: OFF })
    expect(c.shrunk.B, `no step-down: B ${c.shrunk.B}, C ${c.shrunk.C}`).toBeGreaterThanOrEqual(38)
    expect(c.shrunk.C).toBeGreaterThanOrEqual(60)
  }, 60_000)

  it('the hero protection is what keeps the hero clear: switched off, the hero is covered again', () => {
    const c = sweep('no-hero', { ...TUNING, protectHero: false })
    expect(c.heroCovered, `hero protection off: ${c.heroCovered} of ${c.sheets.C}`).toBeGreaterThan(0)
  }, 60_000)
})
