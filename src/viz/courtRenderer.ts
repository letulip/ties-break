// Package E – canvas court renderer. Stateless draw functions over a 2D context:
// no rAF loops, no clock, no game logic. Everything drawn is a pure function of the
// SceneState handed in; every court->pixel mapping is delegated to geometry.ts.
//
// This module is imported by the Vue viewer (which owns the animation clock) and by
// nothing at module load time. `CanvasRenderingContext2D` is a type-only reference
// (DOM lib); no document/window is touched here, so it is safe under a node test env.

import type { Side, Surface } from '../engine/match/types'
import type { AnnotatedMatch, CourtPoint, ShotResult } from './types'
import { COURT } from './types'
import { courtToCanvas, courtScale, type Viewport } from './geometry'

export interface SceneState {
  match: AnnotatedMatch
  pointIndex: number
  /** shot currently in flight and its 0..1 progress; null between shots */
  flight: { shotIndex: number; progress: number } | null
  /** recent bounce marks to render (position + age 0..1 + result) */
  marks: { p: CourtPoint; age: number; result: ShotResult }[]
  /**
   * Court surface for the tint. NOTE: neither AnnotatedMatch nor MatchResult carries
   * the surface, and the spec's SceneState lists no surface field, so it is provided
   * here (optional, defaults to 'hard'). See the package report for this spec gap.
   */
  surface?: Surface
  /**
   * Round 4 item 2: current eased player positions, in the FIXED physics frame (index =
   * match Side; side 0 always defends y<0, side 1 always defends y>0, regardless of any
   * ends swap – see `endsSwapped`). Owned and lerped frame-by-frame by the Vue layer
   * (MatchViewer); courtRenderer only draws whatever it's handed, staying stateless.
   * Defaults to both baseline centers when omitted.
   */
  players?: [CourtPoint, CourtPoint]
  /** Round 4 item 1: which match Side is serving the current point, for the accent
   *  ring; null before the match has started. */
  serverSide?: Side | null
  /** Playback clock (timeline seconds) – drives the server ring's subtle pulse phase. */
  time?: number
  /**
   * Round 4 item 3: true while ends are swapped from the initial layout. A tennis court
   * is symmetric under a (x, y) -> (-x, -y) rotation, so only the DYNAMIC elements
   * (marks, flight, players) need mirroring when true – lines/background are untouched.
   */
  endsSwapped?: boolean
  /** Round 4 item 3: true during the ~0.9s change-ends beat – draws a small overlay. */
  changingEnds?: boolean
}

// --- palette (hardcoded from src/style.css, surfaces darkened toward --bg) --------
const BG = '#0f172a'
const LINE = '#e8eef7'
const ACCENT = '#d9f24f'
const DANGER = '#f2664f'
const PLAYER = '#dbe4f5'
const TRAIL = '#eaf7a8'

const SURFACE_TINT: Record<Surface, string> = {
  hard: '#1e3a5c', // #2d5a8e-ish, darkened
  clay: '#6f3d2b', // #b0603c-ish, darkened
  grass: '#285232', // #3a7d44-ish, darkened
}

const LINE_WIDTH = 1.5
const BALL_RADIUS = 4
const MARK_RADIUS = 5
const PLAYER_RADIUS = 6

/** Round 4 item 2: baseline-center "home" position for each side, in the fixed physics frame. */
const RECOVER_CENTER: readonly [CourtPoint, CourtPoint] = [
  { x: 0, y: -COURT.halfLength },
  { x: 0, y: COURT.halfLength },
]

// --- ends-swap mirroring (round 4 item 3) -----------------------------------
// A tennis court is symmetric under a (x, y) -> (-x, -y) point reflection, so only the
// DYNAMIC elements (marks, flight, players) need this transform when ends are swapped;
// lines/background are drawn once, unmirrored, and look identical either way.

function mirrorPoint(p: CourtPoint, swapped: boolean): CourtPoint {
  return swapped ? { x: -p.x, y: -p.y } : p
}

function toCanvas(p: CourtPoint, vp: Viewport, swapped: boolean): { x: number; y: number } {
  return courtToCanvas(mirrorPoint(p, swapped), vp)
}

// ---------------------------------------------------------------------------

export function drawScene(ctx: CanvasRenderingContext2D, vp: Viewport, scene: SceneState): void {
  ctx.clearRect(0, 0, vp.width, vp.height)
  drawBackground(ctx, vp, scene.surface ?? 'hard')
  drawLines(ctx, vp)
  drawMarks(ctx, vp, scene)
  drawFlight(ctx, vp, scene)
  drawPlayers(ctx, vp, scene)
  if (scene.changingEnds) drawChangingEndsOverlay(ctx, vp)
}

// --- background + court fill ------------------------------------------------

function drawBackground(ctx: CanvasRenderingContext2D, vp: Viewport, surface: Surface): void {
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, vp.width, vp.height)

  // Court fill covers the doubles area (baseline to baseline), mapped via geometry.
  // Landscape: top-left = side-0 baseline + court -x (min canvas x, min canvas y);
  // bottom-right = side-1 baseline + court +x (max canvas x, max canvas y).
  const tl = courtToCanvas({ x: -COURT.doublesHalfWidth, y: -COURT.halfLength }, vp)
  const br = courtToCanvas({ x: COURT.doublesHalfWidth, y: COURT.halfLength }, vp)
  ctx.fillStyle = SURFACE_TINT[surface]
  ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y)
}

// --- court lines ------------------------------------------------------------

function line(ctx: CanvasRenderingContext2D, vp: Viewport, a: CourtPoint, b: CourtPoint): void {
  const p0 = courtToCanvas(a, vp)
  const p1 = courtToCanvas(b, vp)
  ctx.beginPath()
  ctx.moveTo(p0.x, p0.y)
  ctx.lineTo(p1.x, p1.y)
  ctx.stroke()
}

function drawLines(ctx: CanvasRenderingContext2D, vp: Viewport): void {
  const w = COURT.halfWidth
  const dw = COURT.doublesHalfWidth
  const l = COURT.halfLength
  const sl = COURT.serviceLine

  ctx.strokeStyle = LINE
  ctx.lineWidth = LINE_WIDTH
  ctx.lineCap = 'round'

  // Lines are defined in court metres and mapped through geometry, so the landscape
  // flip is automatic: court length (±y) runs along canvas X, court width (±x) along
  // canvas Y. Baselines/service lines therefore render VERTICAL, sidelines/centre
  // service line HORIZONTAL, and the net is the vertical centre line.

  // Baselines at ±halfLength (vertical, span the doubles width).
  line(ctx, vp, { x: -dw, y: l }, { x: dw, y: l })
  line(ctx, vp, { x: -dw, y: -l }, { x: dw, y: -l })
  // Singles + doubles sidelines (horizontal, baseline to baseline).
  line(ctx, vp, { x: -w, y: -l }, { x: -w, y: l })
  line(ctx, vp, { x: w, y: -l }, { x: w, y: l })
  line(ctx, vp, { x: -dw, y: -l }, { x: -dw, y: l })
  line(ctx, vp, { x: dw, y: -l }, { x: dw, y: l })
  // Service lines at ±serviceLine (vertical, between the singles sidelines).
  line(ctx, vp, { x: -w, y: sl }, { x: w, y: sl })
  line(ctx, vp, { x: -w, y: -sl }, { x: w, y: -sl })
  // Centre service line (horizontal, between the two service lines).
  line(ctx, vp, { x: 0, y: -sl }, { x: 0, y: sl })

  // Net: emphasised, vertical centre line spanning the doubles width.
  ctx.lineWidth = LINE_WIDTH * 1.6
  line(ctx, vp, { x: -dw, y: 0 }, { x: dw, y: 0 })
  ctx.lineWidth = LINE_WIDTH
}

// --- bounce marks -----------------------------------------------------------

function drawMarks(ctx: CanvasRenderingContext2D, vp: Viewport, scene: SceneState): void {
  const swapped = scene.endsSwapped ?? false
  for (const mark of scene.marks) {
    const alpha = Math.max(0, Math.min(1, 1 - mark.age))
    if (alpha <= 0) continue
    const c = toCanvas(mark.p, vp, swapped)
    ctx.globalAlpha = alpha
    if (mark.result === 'winner') {
      ctx.fillStyle = ACCENT
      ctx.beginPath()
      ctx.arc(c.x, c.y, MARK_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    } else if (mark.result === 'in') {
      ctx.strokeStyle = ACCENT
      ctx.lineWidth = LINE_WIDTH
      ctx.beginPath()
      ctx.arc(c.x, c.y, MARK_RADIUS, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      // 'out' / 'net' -> danger cross
      ctx.strokeStyle = DANGER
      ctx.lineWidth = LINE_WIDTH + 0.5
      const r = MARK_RADIUS
      ctx.beginPath()
      ctx.moveTo(c.x - r, c.y - r)
      ctx.lineTo(c.x + r, c.y + r)
      ctx.moveTo(c.x + r, c.y - r)
      ctx.lineTo(c.x - r, c.y + r)
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

// --- flight path + ball -----------------------------------------------------

/** Where the ball starts for the shot in flight: server baseline for serves, else the previous bounce. */
function flightStart(scene: SceneState, shotIndex: number): CourtPoint {
  const point = scene.match.points[scene.pointIndex]
  const shots = point.rally.shots
  const shot = shots[shotIndex]
  const isServe = shot.kind === 'serve1' || shot.kind === 'serve2'
  if (isServe || shotIndex === 0) {
    const y = point.entry.server === 1 ? COURT.halfLength : -COURT.halfLength
    return { x: 0, y }
  }
  return shots[shotIndex - 1].bounce
}

function quad(p0: number, cp: number, p1: number, t: number): number {
  const mt = 1 - t
  return mt * mt * p0 + 2 * mt * t * cp + t * t * p1
}

function drawFlight(ctx: CanvasRenderingContext2D, vp: Viewport, scene: SceneState): void {
  const flight = scene.flight
  if (!flight) return
  const point = scene.match.points[scene.pointIndex]
  if (!point) return
  const shots = point.rally.shots
  if (flight.shotIndex < 0 || flight.shotIndex >= shots.length) return

  const swapped = scene.endsSwapped ?? false
  const startC = toCanvas(flightStart(scene, flight.shotIndex), vp, swapped)
  const endC = toCanvas(shots[flight.shotIndex].bounce, vp, swapped)

  // Modest control-point lift (arc height ~ proportional to distance, capped).
  const dist = Math.hypot(endC.x - startC.x, endC.y - startC.y)
  const lift = Math.min(0.25 * dist, 1.4 * courtScale(vp))
  const cp = { x: (startC.x + endC.x) / 2, y: (startC.y + endC.y) / 2 - lift }

  const progress = Math.max(0, Math.min(1, flight.progress))

  // Flight arc, faint.
  ctx.globalAlpha = 0.35
  ctx.strokeStyle = TRAIL
  ctx.lineWidth = LINE_WIDTH
  ctx.beginPath()
  ctx.moveTo(startC.x, startC.y)
  ctx.quadraticCurveTo(cp.x, cp.y, endC.x, endC.y)
  ctx.stroke()
  ctx.globalAlpha = 1

  // Short fading trail behind the ball.
  const TRAIL_STEPS = 5
  for (let i = TRAIL_STEPS; i >= 1; i--) {
    const tt = Math.max(0, progress - i * 0.05)
    const x = quad(startC.x, cp.x, endC.x, tt)
    const y = quad(startC.y, cp.y, endC.y, tt)
    ctx.globalAlpha = 0.12 * (1 - i / (TRAIL_STEPS + 1))
    ctx.fillStyle = TRAIL
    ctx.beginPath()
    ctx.arc(x, y, BALL_RADIUS * 0.8, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // The ball.
  const bx = quad(startC.x, cp.x, endC.x, progress)
  const by = quad(startC.y, cp.y, endC.y, progress)
  ctx.fillStyle = ACCENT
  ctx.beginPath()
  ctx.arc(bx, by, BALL_RADIUS, 0, Math.PI * 2)
  ctx.fill()
}

// --- player dots (round 4 items 1 + 2) --------------------------------------
// Positions arrive pre-eased (scene.players, fixed physics frame – see SceneState) and
// are only mirrored here for ends-swap, same as marks/flight above. Falls back to both
// baseline centers if the caller hasn't supplied any (e.g. a bare/legacy scene).

function drawPlayers(ctx: CanvasRenderingContext2D, vp: Viewport, scene: SceneState): void {
  const swapped = scene.endsSwapped ?? false
  const players = scene.players ?? RECOVER_CENTER
  const serverSide = scene.serverSide ?? null

  ctx.fillStyle = PLAYER
  for (let side = 0; side < 2; side++) {
    const p = players[side] ?? RECOVER_CENTER[side]
    const c = toCanvas(p, vp, swapped)
    ctx.beginPath()
    ctx.arc(c.x, c.y, PLAYER_RADIUS, 0, Math.PI * 2)
    ctx.fill()
  }

  if (serverSide === 0 || serverSide === 1) {
    const p = players[serverSide] ?? RECOVER_CENTER[serverSide]
    const c = toCanvas(p, vp, swapped)
    drawServerRing(ctx, c, scene.time ?? 0)
  }
}

/** Subtle breathing ring around the serving side's dot – not a blink, a slow pulse. */
function drawServerRing(ctx: CanvasRenderingContext2D, c: { x: number; y: number }, time: number): void {
  const pulse = (Math.sin(time * 4.2) + 1) / 2 // 0..1
  ctx.save()
  ctx.globalAlpha = 0.35 + pulse * 0.3
  ctx.strokeStyle = ACCENT
  ctx.lineWidth = LINE_WIDTH
  ctx.beginPath()
  ctx.arc(c.x, c.y, PLAYER_RADIUS + 3 + pulse * 2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

// --- "Changing ends" overlay (round 4 item 3) -------------------------------

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawChangingEndsOverlay(ctx: CanvasRenderingContext2D, vp: Viewport): void {
  const text = 'Changing ends'
  ctx.save()
  ctx.font = '600 13px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const paddingX = 12
  const paddingY = 6
  const textHeight = 13
  const w = ctx.measureText(text).width + paddingX * 2
  const h = textHeight + paddingY * 2
  const cx = vp.width / 2
  const cy = vp.height / 2
  roundedRectPath(ctx, cx - w / 2, cy - h / 2, w, h, h / 2)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)'
  ctx.fill()
  ctx.strokeStyle = ACCENT
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = ACCENT
  ctx.fillText(text, cx, cy + 0.5)
  ctx.restore()
}
