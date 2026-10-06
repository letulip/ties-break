// ROUND 46 #4 – THE BOARDING PASS LIES TURNED, 5° CLOCKWISE. ROUND 47 #8 – AND IT IS SMALLER, AND IT HANGS LOWER.
//
// THE OWNER'S SENTENCES. Round 46: «Альбом стал лучше, а давай ещё повернём немного вот этот цветной горизонтальный
// билет на на 5 градусов по часовой стрелке?» – the pass lay square (0°), so «ещё» is 5° and the result is stated
// ABSOLUTE below (CSS's positive `rotate()` is clockwise). Round 47: «в альбоме горизонтальный билет повернулся - ок, но
// надо его ниже опустить, он на некоторых страницах перекрывает много букв наверху. И давай его на 10% меньше сделаем
// заодно» – lower, and ten percent smaller.
//
// ⚠ EVERY NUMBER IS READ OFF THE MOUNTED PAGE – the computed `transform`, `transform-origin`, `left`, `right`, `bottom`
// and `min-height` of the rendered `.album-b-pass`. happy-dom lays nothing out, so no box is measured here; what a mount
// CAN give is what the page was TOLD, and that is exactly what a refactor changes silently. (The layout itself was
// measured in real Chromium on 06.10 – the table is in `albumPlacement.ts` on `passBox` and in the round-47 ledger.)
// The four tier steps (`album-pass-<step>`) are mounted separately: the pass is one component in four inks.
//   1. THE ATTITUDE: +5° on every step, exactly ONE `rotate()` and exactly ONE `scale()` – a second transform site
//      would show here as two.
//   2. ⭐ THE SIZE (round 47 #8b): the one `scale()` is 0.9 – the drawn pass is 360px across where the frame is 400.
//   3. ⭐⭐ THE TOP CLEARANCE (round 47 #8a): the turned, scaled pass's HIGHEST corner is not above the frame's top edge –
//      the edge the resolver keeps the loose line (and everything else) clear of. The arm that round 46 could not write,
//      because the overlap was lawful then: turned about the centre the left end lifted ~17px into the loose line's strip.
//      It carries its own non-vacuity check: the round-46 geometry, replayed through the same function, DOES rise.
//   4. ⚠ NOTHING IS CLIPPED: the turned pass is held >= 15px inside the 470px leaf – layout B's own page margin, its first
//      photograph is drawn at x 15, y 15. The mount is 375x667 and the 470-space IS the phone's own: the sheet is never
//      scaled below 768 (`SHEET_PX`), and above it the whole leaf scales as one (`album-wide.test.ts` holds the ladder).
//   5. THE MIRROR: the rendered CSS frame (`left`, `bottom`, `right`, `min-height`) IS the resolver's frame for the pass
//      (`passBox` in `albumPlacement.ts`) – or the outline above would be built on a pass nobody draws.
//
// ⭐ MUTATION-VERIFIED (06.10), each run on the real file and restored byte-identical (`cmp`):
//   `rotate(5deg)` -> `rotate(0deg)`                                              -> arm 1 red on all four steps (4 red);
//   `rotate(5deg)` -> `rotate(-5deg)` (anticlockwise)                             -> arm 1 and arm 3 (the right end rises) red (8);
//   `rotate(5deg)` -> `rotate(25deg)` (too far)                                   -> arm 1 and arm 4 (the clip arm) red (8);
//   `scale(0.9)` -> `scale(1)`                                                    -> arm 2 and arm 4 red (8);
//   `transform-origin: 0 0` removed (the round-46 centre origin)                  -> arm 3 red on all four steps (4);
//   `min-height: 121px` -> `118px` (the frame and the page disagree)              -> arm 5 and arm 4 red (8; and the unit mirror in
//                                                                                     tests/round45-album-placement.test.ts, 1);
//   THE PRE-FIX GEOMETRY – `bottom: 48px`, `transform: rotate(5deg)` about the centre, no scale -> 12 red: arms 2, 3 and 5 on all four steps.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AlbumSheet from '../../src/components/album/AlbumSheet.vue'
import { LAYOUTS, type Box } from '../../src/components/album/albumPlacement'
import { SHEET_PX } from '../../src/shared/protocol'
import type { AlbumSheetModel } from '../../src/shared/protocol'
import { sheetOf } from './albumFixture'
import { PHONE, setViewport } from './fits'

const STEPS = ['budget', 'middle', 'high', 'elite'] as const
type Step = (typeof STEPS)[number]

/** Layout B's own page margin: its first photograph is drawn at x 15, y 15. */
const PAGE_MARGIN = 15

/** The pass as it was drawn BEFORE round 47: 400px across, turned 5° about its centre – the geometry the owner saw. */
const ROUND_46 = { transform: 'rotate(5deg)', origin: '50% 50%' }

interface Point {
  x: number
  y: number
}

interface Told {
  classes: string[]
  transform: string
  origin: string
  left: number
  right: number
  bottom: number
  minHeight: number
}

function sheetAt(step: Step): AlbumSheetModel {
  const s = sheetOf({ layout: 'B' })
  if (!s.ticket) throw new Error('the layout-B fixture carries no ticket – every arm below would be vacuous')
  return { ...s, ticket: { ...s.ticket, step } }
}

/** What the page was TOLD about the pass, read off the rendered element on a 375x667 phone. ⚠ `setViewport`
 *  runs BEFORE the mount – happy-dom caches a media query on its first computed-style read. */
function told(sheet: AlbumSheetModel): Told {
  setViewport(PHONE)
  const w = mount(AlbumSheet, { props: { sheet }, attachTo: document.body })
  const found = w.find('.album-b-pass')
  expect(found.exists(), 'layout B drew no boarding pass').toBe(true)
  const el = found.element as HTMLElement
  const cs = getComputedStyle(el)
  const out = {
    classes: [...el.classList],
    transform: cs.transform,
    origin: cs.getPropertyValue('transform-origin') || cs.transformOrigin || '',
    left: Number.parseFloat(cs.left),
    right: Number.parseFloat(cs.right),
    bottom: Number.parseFloat(cs.bottom),
    minHeight: Number.parseFloat(cs.minHeight),
  }
  w.unmount()
  expect([out.left, out.right, out.bottom, out.minHeight].every(Number.isFinite), `the pass reports no frame: ${JSON.stringify(out)}`).toBe(true)
  return out
}

/** The turn in degrees – and the proof there is exactly ONE: a second transform site would show here as two. */
function angleOf(transform: string): number {
  const found = [...transform.matchAll(/rotate\((-?[\d.]+)deg\)/g)]
  if (found.length !== 1) throw new Error(`expected exactly one rotate() in the transform "${transform}"`)
  return Number(found[0]?.[1])
}

/** The scale – and the proof there is exactly ONE. No `scale()` at all is the pre-round-47 pass, drawn at 1. */
function scaleOf(transform: string): number {
  const found = [...transform.matchAll(/scale\((-?[\d.]+)\)/g)]
  if (found.length > 1) throw new Error(`expected at most one scale() in the transform "${transform}"`)
  return found.length === 0 ? 1 : Number(found[0]?.[1])
}

/** `transform-origin` as a point inside a `w` x `h` box: `0 0`, `0px 0px`, `left top`, `50% 50%` – and the CSS default
 *  (the centre) when the value is empty. */
function originOf(raw: string, w: number, h: number): Point {
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  const at = (tok: string | undefined, size: number, lo: string, hi: string): number => {
    if (tok === undefined) return size / 2
    if (tok === lo) return 0
    if (tok === hi) return size
    if (tok === 'center') return size / 2
    if (tok.endsWith('%')) return (Number.parseFloat(tok) / 100) * size
    const px = Number.parseFloat(tok)
    if (!Number.isFinite(px)) throw new Error(`cannot read the transform-origin "${raw}"`)
    return px
  }
  return { x: at(parts[0], w, 'left', 'right'), y: at(parts[1], h, 'top', 'bottom') }
}

/** The four corners of the pass as the CSS draws it, in the 470px page: the layout box (`box`), then the transform list
 *  applied the way CSS applies it – the LAST function first, about the origin (screen y runs DOWN, so a positive angle
 *  drops the right end). Understands exactly `translate`/`translateX`/`translateY`, `rotate` and `scale`, and THROWS on
 *  anything else rather than drawing a pass it has not understood. */
function cornersOf(transform: string, origin: string, box: Box): Point[] {
  const fns = [...transform.matchAll(/(translateX|translateY|translate|rotate|scale)\(([^)]*)\)/g)].map((m) => ({
    name: m[1],
    args: (m[2] ?? '').split(',').map((a) => Number.parseFloat(a)),
  }))
  const rest = transform.replace(/(translateX|translateY|translate|rotate|scale)\([^)]*\)/g, '').trim()
  if (rest !== '' || fns.length === 0) throw new Error(`cannot read the transform "${transform}"`)
  const o = originOf(origin, box.w, box.h)
  const local: [number, number][] = [[0, 0], [box.w, 0], [box.w, box.h], [0, box.h]]
  return local.map(([lx, ly]) => {
    let x = lx - o.x
    let y = ly - o.y
    for (const f of [...fns].reverse()) {
      const a = f.args[0] ?? 0
      if (f.name === 'scale') {
        x *= a
        y *= a
      } else if (f.name === 'rotate') {
        const r = (a * Math.PI) / 180
        ;[x, y] = [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]
      } else if (f.name === 'translateX') x += a
      else if (f.name === 'translateY') y += a
      else {
        x += a
        y += f.args[1] ?? 0
      }
    }
    return { x: box.x + o.x + x, y: box.y + o.y + y }
  })
}

/** The pass's layout box in the 470 page, from the rendered CSS: `left`/`right` and `bottom` + the one height. */
function boxOf(t: Told): Box {
  return { x: t.left, y: SHEET_PX - t.bottom - t.minHeight, w: SHEET_PX - t.left - t.right, h: t.minHeight }
}

describe('round 46 #4 + round 47 #8 · the boarding pass lies turned 5° clockwise, 10% smaller, hung from its top-left corner', () => {
  for (const step of STEPS) {
    describe(`the ${step} step`, () => {
      it('⚠ the mounted pass is turned +5° – clockwise – by exactly one rotate(), and drawn at ONE scale', () => {
        const t = told(sheetAt(step))
        expect(t.classes, "the pass is not layout B's anchor").toContain('album-b-pass')
        expect(t.classes, 'the pass lost its tier step').toContain(`album-pass-${step}`)
        const angle = angleOf(t.transform)
        expect(angle, `the computed transform is "${t.transform}"`).toBe(5)
        expect(angle, 'a positive rotate() is clockwise in CSS').toBeGreaterThan(0)
        expect(() => scaleOf(t.transform), `the computed transform is "${t.transform}"`).not.toThrow()
      })

      it('⭐ round 47 #8b: the pass is drawn 10% smaller – scale 0.9, so 360px across where the frame is 400', () => {
        const t = told(sheetAt(step))
        const box = boxOf(t)
        expect(scaleOf(t.transform), `the computed transform is "${t.transform}"`).toBe(0.9)
        const [tl, tr] = cornersOf(t.transform, t.origin, box)
        const across = Math.hypot((tr as Point).x - (tl as Point).x, (tr as Point).y - (tl as Point).y)
        expect(box.w, 'the frame the pass is drawn in').toBe(400)
        expect(across, 'the top edge as drawn').toBeCloseTo(box.w * 0.9, 6)
      })

      it('⭐⭐ round 47 #8a: the highest corner of the turned pass is NOT above the frame\'s top edge – nothing rises into the loose line\'s strip', () => {
        const sheet = sheetAt(step)
        const t = told(sheet)
        const frame = LAYOUTS.B.fixed(sheet)[0] as Box
        const cs = cornersOf(t.transform, t.origin, boxOf(t))
        expect(cs, 'the arm built no corners and would pass on anything').toHaveLength(4)
        const highest = Math.min(...cs.map((c) => c.y))
        const lift = frame.y - highest // > 0 is a corner standing above the edge, in px
        expect(lift, `the turned pass rises ${lift.toFixed(2)}px above the frame's top edge (y ${frame.y}); the loose line is kept clear of that edge and no further`).toBeLessThanOrEqual(1e-9)
      })

      it('⭐ the top-clearance arm is not vacuous: the round-46 geometry replayed through the same function DOES rise ~17px', () => {
        const sheet = sheetAt(step)
        const frame = LAYOUTS.B.fixed(sheet)[0] as Box
        const old = cornersOf(ROUND_46.transform, ROUND_46.origin, frame)
        const lift = frame.y - Math.min(...old.map((c) => c.y))
        expect(lift, 'round 46 turned the 400px frame about its centre – the left end lifted').toBeGreaterThan(15)
        expect(lift).toBeLessThan(20)
      })

      it(`⚠ nothing is clipped: the turned pass stays >= ${PAGE_MARGIN}px inside the ${SHEET_PX}px sheet at 375x667`, () => {
        const t = told(sheetAt(step))
        const cs = cornersOf(t.transform, t.origin, boxOf(t))
        expect(cs, 'the arm built no corners and would pass on anything').toHaveLength(4)
        const xs = cs.map((c) => c.x)
        const ys = cs.map((c) => c.y)
        const room = {
          left: Math.min(...xs),
          top: Math.min(...ys),
          right: SHEET_PX - Math.max(...xs),
          bottom: SHEET_PX - Math.max(...ys),
        }
        for (const [side, v] of Object.entries(room)) {
          expect(v, `the turned pass is ${v.toFixed(1)}px from the ${side} edge of the sheet`).toBeGreaterThanOrEqual(PAGE_MARGIN)
        }
      })

      it("the rendered CSS frame IS the resolver's frame for the pass (`passBox`) – the page and the table are mirrors", () => {
        const sheet = sheetAt(step)
        const t = told(sheet)
        const frame = LAYOUTS.B.fixed(sheet)[0] as Box
        expect(boxOf(t), 'left / bottom-less-height / width, and the one height').toEqual({ x: frame.x, y: frame.y, w: frame.w, h: frame.h })
      })
    })
  }
})
