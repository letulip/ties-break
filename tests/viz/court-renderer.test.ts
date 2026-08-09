// THE COURT RENDERER, OBSERVED THROUGH A RECORDING CONTEXT.
//
// ⚠ WHY THIS FILE EXISTS AND WHY IT IS NOT A SOURCE PIN. `drawScene` is the one part of the match
// screen a mounted test cannot see: under happy-dom `canvas.getContext('2d')` returns null, so
// MatchViewer's own component net watches the court not paint. Reading the module's source text for
// a colour constant would prove that the constant is spelled somewhere, which is exactly the kind of
// pin the component net exists to replace. So the context itself is the fixture: every call is
// recorded with the fill that was live at the time, and the assertions are about what was drawn.
import { describe, it, expect } from 'vitest'
import { drawScene, type SceneState } from '../../src/viz/courtRenderer'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import type { Viewport } from '../../src/viz/geometry'
import type { MatchOptions, MatchPlayer, Side } from '../../src/engine/match/types'

/** The accent, as src/style.css declares it and courtRenderer copies it. */
const ACCENT = '#d9f24f'
/** PLAYER_RADIUS in courtRenderer; the ball is 4 and a bounce mark is 5, so the radius is what tells
 *  a player dot apart from everything else drawn as a circle. */
const PLAYER_RADIUS = 6

interface Circle {
  r: number
  fill: string
}

/** A 2D context that draws nothing and remembers everything that matters here. */
function recorder() {
  const circles: Circle[] = []
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    clearRect() {},
    fillRect() {},
    strokeRect() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    bezierCurveTo() {},
    stroke() {},
    fill() {},
    save() {},
    restore() {},
    setLineDash() {},
    roundRect() {},
    fillText() {},
    measureText: () => ({ width: 0 }),
    arc(_x: number, _y: number, r: number) {
      circles.push({ r, fill: String(ctx.fillStyle) })
    },
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, circles }
}

function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...overrides }
}

const VP: Viewport = { width: 680, height: 420 }

function scene(heroSide: Side | null): SceneState {
  const a = player({ id: 'a', name: 'Vera Novak' })
  const b = player({ id: 'b', name: 'Ines Duval' })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'renderer-fixture' }
  return {
    match: annotateMatch(simulateMatch(a, b, opts), a, b, opts),
    pointIndex: 0,
    // No ball in flight and no bounce marks, so the only circles drawn are the two players.
    flight: null,
    marks: [],
    surface: 'hard',
    serverSide: null,
    heroSide,
  }
}

function playerDots(heroSide: Side | null): Circle[] {
  const { ctx, circles } = recorder()
  drawScene(ctx, VP, scene(heroSide))
  return circles.filter((c) => c.r === PLAYER_RADIUS)
}

// =================================================================================================
// HER DOT IS THE YELLOW ONE (owner, 06.08): «давай во время матча точку нашей девочки тоже жёлтой
// сделаем, так нагляднее будет точно».
//
// The accent marks her on every other surface of this screen - her name on the panel, her digit in
// the point score, her line on the momentum curve - and the court was the one place where the two
// players were drawn in the same colour.
// =================================================================================================
describe('the player dots', () => {
  it('draws exactly two of them, one per side', () => {
    expect(playerDots(0)).toHaveLength(2)
  })

  it('⚠ paints HER dot in the accent and leaves the opponent neutral - one of the two, never both', () => {
    for (const side of [0, 1] as const) {
      const dots = playerDots(side)
      const accented = dots.filter((d) => d.fill.toLowerCase() === ACCENT)
      expect(accented, `side ${side}: the accent did not land on exactly one dot`).toHaveLength(1)
      // ...and it is the right one: side 0 is drawn first (drawPlayers walks 0 then 1).
      expect(dots[side].fill.toLowerCase()).toBe(ACCENT)
      expect(dots[side === 0 ? 1 : 0].fill.toLowerCase()).not.toBe(ACCENT)
    }
  })

  it('⚠ paints NOBODY in the accent when she is not in this match', () => {
    // TournamentFlow's spectate walk mounts the viewer on rounds she is not in. `heroSide` is null
    // there (matchReadout.kidSide), and an accent dot would be marking a stranger as ours.
    const accented = playerDots(null).filter((d) => d.fill.toLowerCase() === ACCENT)
    expect(accented).toHaveLength(0)
  })
})
