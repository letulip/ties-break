// ROUND 46 #4 – THE BOARDING PASS LIES TURNED, 5° CLOCKWISE.
//
// THE OWNER'S SENTENCE: «Альбом стал лучше, а давай ещё повернём немного вот этот цветной горизонтальный
// билет на на 5 градусов по часовой стрелке?» The pass lay square (0°) before, so «ещё» is 5° and the result
// is stated ABSOLUTE below – CSS's positive `rotate()` is clockwise.
//
// ⚠ EVERY NUMBER IS READ OFF THE MOUNTED PAGE – the computed `transform`, `left`, `right` and `bottom` of the
// rendered `.album-b-pass`. happy-dom lays nothing out, so no box is measured here; what a mount CAN give is
// what the page was TOLD, and that is exactly what a refactor changes silently. The four tier steps
// (`album-pass-<step>`) are mounted separately: the pass is one component in four inks and its height differs
// between them (97 / 121), which is what the turned outline is built from.
//   1. THE ATTITUDE: +5° on every step, and exactly ONE `rotate()` in the transform – a second transform
//      site would show here as two.
//   2. ⚠ NOTHING IS CLIPPED: a 400px strip turned 5° lifts one end and drops the other by ~17px, so the turned
//      pass is held >= 15px inside the 470px leaf – layout B's own page margin, its first photograph is drawn
//      at x 15, y 15. The mount is 375x667 and the 470-space IS the phone's own: the sheet is never scaled
//      below 768 (`SHEET_PX`), and above it the whole leaf scales as one (`album-wide.test.ts` holds the
//      ladder). The frame the outline is built from is first held to the resolver's own frame for the pass.
//
// ⚠ WHAT THIS DOES NOT HOLD, ON PURPOSE: the resolver (`passBox` in `albumPlacement.ts`) still keeps clear of
// the SQUARE frame and not of the turned pass. Every way of teaching it the turn moved a round-45 guard, so
// that is an open design question – measured, and written up on `passBox` and in the round-46 ledger – and
// not something to pin as if it were settled.
//
// ⭐ MUTATION-VERIFIED (06.10), each run on the real file and restored byte-identical (`cmp`):
//   `.album-b-pass` `rotate(5deg)` -> `rotate(0deg)`      -> arm 1 red on all four steps;
//   `rotate(5deg)` -> `rotate(-5deg)` (anticlockwise)     -> arm 1 red on all four steps;
//   `rotate(5deg)` -> `rotate(25deg)` (too far)           -> arm 1 AND arm 2 red – the clip arm fails on its own merits.
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

interface Point {
  x: number
  y: number
}

interface Told {
  classes: string[]
  transform: string
  left: number
  right: number
  bottom: number
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
    left: Number.parseFloat(cs.left),
    right: Number.parseFloat(cs.right),
    bottom: Number.parseFloat(cs.bottom),
  }
  w.unmount()
  expect([out.left, out.right, out.bottom].every(Number.isFinite), `the pass reports no frame: ${JSON.stringify(out)}`).toBe(true)
  return out
}

/** The turn in degrees – and the proof there is exactly ONE: a second transform site would show here as two. */
function angleOf(transform: string): number {
  const found = [...transform.matchAll(/rotate\((-?[\d.]+)deg\)/g)]
  if (found.length !== 1) throw new Error(`expected exactly one rotate() in the transform "${transform}"`)
  return Number(found[0]?.[1])
}

/** The four corners of the pass as the CSS draws it, in the 470px page: the frame from the rendered
 *  left/right/bottom and the tier's height, turned `deg` clockwise about its centre (screen y runs DOWN, so a
 *  positive angle drops the right end). */
function cornersOf(t: Told, h: number, deg: number): Point[] {
  const w = SHEET_PX - t.left - t.right
  const cx = t.left + w / 2
  const cy = SHEET_PX - t.bottom - h / 2
  const r = (deg * Math.PI) / 180
  const signs: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  return signs.map(([sx, sy]) => {
    const dx = (sx * w) / 2
    const dy = (sy * h) / 2
    return { x: cx + dx * Math.cos(r) - dy * Math.sin(r), y: cy + dx * Math.sin(r) + dy * Math.cos(r) }
  })
}

describe('round 46 #4 · the boarding pass lies turned 5° clockwise', () => {
  for (const step of STEPS) {
    describe(`the ${step} step`, () => {
      it('⚠ the mounted pass is turned +5° – clockwise – and by exactly one rotate()', () => {
        const t = told(sheetAt(step))
        expect(t.classes, "the pass is not layout B's anchor").toContain('album-b-pass')
        expect(t.classes, 'the pass lost its tier step').toContain(`album-pass-${step}`)
        const angle = angleOf(t.transform)
        expect(angle, `the computed transform is "${t.transform}"`).toBe(5)
        expect(angle, 'a positive rotate() is clockwise in CSS').toBeGreaterThan(0)
      })

      it(`⚠ nothing is clipped: the turned pass stays >= ${PAGE_MARGIN}px inside the ${SHEET_PX}px sheet at 375x667`, () => {
        const sheet = sheetAt(step)
        const t = told(sheet)
        // the pass's own frame, as the resolver holds it (`passBox` is layout B's first piece of furniture) – and the
        // rendered CSS must be that frame, or the outline below would be built on a pass nobody draws
        const frame = LAYOUTS.B.fixed(sheet)[0] as Box
        expect([t.left, SHEET_PX - t.bottom - frame.h, SHEET_PX - t.left - t.right]).toEqual([frame.x, frame.y, frame.w])
        const cs = cornersOf(t, frame.h, angleOf(t.transform))
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
    })
  }
})
