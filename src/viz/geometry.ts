// Package E – court geometry: pure, RNG-free mapping from court meters to canvas
// pixels. Landscape orientation: the court runs HORIZONTALLY (net vertical down the
// middle), side 0 defending the LEFT half. Court length (CourtPoint.y) runs along
// canvas X (+y = side 1 = right); court width (CourtPoint.x) runs along canvas Y
// (+x = canvas down). All geometric computation for the renderer lives here so
// courtRenderer.ts stays a thin drawing layer.

import { COURT, type CourtPoint } from './types'

export interface Viewport {
  width: number
  height: number
}

/** Outer margin as a fraction of each viewport dimension, so out-balls (which land
 *  beyond the lines) stay visible inside the frame. */
export const MARGIN = 0.08

// The drawable court area is the DOUBLES width by the FULL length (baseline to
// baseline). In landscape the length lies along canvas X and the width along
// canvas Y. Aspect is preserved by a single pixels-per-meter scale.
const COURT_LENGTH_M = COURT.halfLength * 2 // along canvas X
const COURT_WIDTH_M = COURT.doublesHalfWidth * 2 // along canvas Y

/** Pixels per court meter for this viewport (uniform on both axes). */
export function courtScale(vp: Viewport): number {
  const availW = vp.width * (1 - 2 * MARGIN)
  const availH = vp.height * (1 - 2 * MARGIN)
  return Math.min(availW / COURT_LENGTH_M, availH / COURT_WIDTH_M)
}

/**
 * Map a court point (meters; origin = net center, +x = side 1's width direction,
 * +y = side 1's baseline) to canvas pixels (y-down). Court +y (length) maps toward
 * the canvas right, so side 0 (y<0) sits on the LEFT; court +x (width) maps toward
 * the canvas bottom. The court is centered in the viewport.
 */
export function courtToCanvas(p: CourtPoint, vp: Viewport): { x: number; y: number } {
  const s = courtScale(vp)
  return {
    x: vp.width / 2 + p.y * s,
    y: vp.height / 2 + p.x * s,
  }
}

/** The singles court as an axis-aligned pixel rectangle (wide in landscape). */
export function canvasCourtRect(vp: Viewport): { x: number; y: number; width: number; height: number } {
  const s = courtScale(vp)
  const halfL = COURT.halfLength * s // along canvas X
  const halfW = COURT.halfWidth * s // along canvas Y
  return {
    x: vp.width / 2 - halfL,
    y: vp.height / 2 - halfW,
    width: halfL * 2,
    height: halfW * 2,
  }
}
