import { describe, it, expect } from 'vitest'
import { courtToCanvas, canvasCourtRect, courtScale, type Viewport } from '../../src/viz/geometry'
import { COURT, type CourtPoint } from '../../src/viz/types'

const EPS = 1e-9

function px(p: CourtPoint, vp: Viewport) {
  return courtToCanvas(p, vp)
}

describe('geometry — aspect preservation', () => {
  // A court meter must map to the same number of pixels on x and y (uniform scale),
  // regardless of the viewport aspect: tall, wide, or square.
  const viewports: Viewport[] = [
    { width: 300, height: 500 }, // tall (portrait)
    { width: 800, height: 400 }, // wide (landscape)
    { width: 400, height: 400 }, // square
  ]
  for (const vp of viewports) {
    it(`1 m maps to equal px on x and y for ${vp.width}x${vp.height}`, () => {
      const origin = px({ x: 0, y: 0 }, vp)
      const oneX = px({ x: 1, y: 0 }, vp)
      const oneY = px({ x: 0, y: 1 }, vp)
      const dxPerMeter = Math.abs(oneY.x - origin.x) // court +y runs along canvas x
      const dyPerMeter = Math.abs(oneX.y - origin.y) // court +x runs along canvas y
      expect(dxPerMeter).toBeGreaterThan(0)
      expect(Math.abs(dxPerMeter - dyPerMeter)).toBeLessThan(EPS)
      // and it equals the exported scale
      expect(Math.abs(dxPerMeter - courtScale(vp))).toBeLessThan(EPS)
    })
  }
})

describe('geometry — net and baseline placement (landscape, side 0 on the left)', () => {
  const vp: Viewport = { width: 680, height: 340 }

  it('net center maps to the viewport center x and mid-height y', () => {
    const c = px({ x: 0, y: 0 }, vp)
    expect(Math.abs(c.x - vp.width / 2)).toBeLessThan(EPS)
    expect(Math.abs(c.y - vp.height / 2)).toBeLessThan(EPS)
  })

  it('side-0 baseline (y = -halfLength) maps LEFT of the net (smaller canvas x)', () => {
    const net = px({ x: 0, y: 0 }, vp)
    const side0Baseline = px({ x: 0, y: -COURT.halfLength }, vp)
    const side1Baseline = px({ x: 0, y: COURT.halfLength }, vp)
    expect(side0Baseline.x).toBeLessThan(net.x)
    // and side 1 (court +y) maps to the right (greater canvas x)
    expect(side1Baseline.x).toBeGreaterThan(net.x)
    // both baselines share the net's canvas x-independence: they stay at mid-height for x=0
    expect(Math.abs(side0Baseline.y - net.y)).toBeLessThan(EPS)
    expect(Math.abs(side1Baseline.y - net.y)).toBeLessThan(EPS)
  })
})

describe('geometry — the full doubles rect + margin fits inside the viewport', () => {
  const viewports: Viewport[] = [
    { width: 360, height: 200 },
    { width: 800, height: 400 },
    { width: 340, height: 180 },
  ]
  for (const vp of viewports) {
    it(`doubles corners land inside ${vp.width}x${vp.height} with an outer margin`, () => {
      const corners: CourtPoint[] = [
        { x: -COURT.doublesHalfWidth, y: -COURT.halfLength },
        { x: COURT.doublesHalfWidth, y: -COURT.halfLength },
        { x: -COURT.doublesHalfWidth, y: COURT.halfLength },
        { x: COURT.doublesHalfWidth, y: COURT.halfLength },
      ]
      for (const corner of corners) {
        const c = px(corner, vp)
        expect(c.x).toBeGreaterThanOrEqual(0)
        expect(c.x).toBeLessThanOrEqual(vp.width)
        expect(c.y).toBeGreaterThanOrEqual(0)
        expect(c.y).toBeLessThanOrEqual(vp.height)
      }
      // there must be a genuine outer margin: the mapped court must not touch the edges.
      // In landscape: side-0 baseline / court -x is the top-left corner (min x, min y).
      const topLeft = px({ x: -COURT.doublesHalfWidth, y: -COURT.halfLength }, vp)
      const bottomRight = px({ x: COURT.doublesHalfWidth, y: COURT.halfLength }, vp)
      const marginX = Math.min(topLeft.x, vp.width - bottomRight.x)
      const marginY = Math.min(topLeft.y, vp.height - bottomRight.y)
      expect(marginX).toBeGreaterThan(0)
      expect(marginY).toBeGreaterThan(0)
    })
  }
})

describe('geometry — singles court round-trip', () => {
  const viewports: Viewport[] = [
    { width: 680, height: 340 },
    { width: 360, height: 200 },
    { width: 800, height: 400 },
  ]
  for (const vp of viewports) {
    it(`singles corners map inside canvasCourtRect (±1px) for ${vp.width}x${vp.height}`, () => {
      const rect = canvasCourtRect(vp)
      const corners: CourtPoint[] = [
        { x: -COURT.halfWidth, y: -COURT.halfLength },
        { x: COURT.halfWidth, y: -COURT.halfLength },
        { x: -COURT.halfWidth, y: COURT.halfLength },
        { x: COURT.halfWidth, y: COURT.halfLength },
      ]
      for (const corner of corners) {
        const c = px(corner, vp)
        expect(c.x).toBeGreaterThanOrEqual(rect.x - 1)
        expect(c.x).toBeLessThanOrEqual(rect.x + rect.width + 1)
        expect(c.y).toBeGreaterThanOrEqual(rect.y - 1)
        expect(c.y).toBeLessThanOrEqual(rect.y + rect.height + 1)
      }
      // the rect must be a positive-area box strictly inside the viewport
      expect(rect.width).toBeGreaterThan(0)
      expect(rect.height).toBeGreaterThan(0)
      expect(rect.x).toBeGreaterThan(0)
      expect(rect.y).toBeGreaterThan(0)
      // landscape: the singles rect is wider than it is tall
      expect(rect.width).toBeGreaterThan(rect.height)
    })
  }
})
