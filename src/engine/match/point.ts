// Point-win probability model. Turns a matchup + point context into p, the
// probability the server wins the next point. Pure math, no RNG here – the
// caller draws against the returned p.

import type { Side, Tour, Surface, MatchPlayer, MatchOptions, PointContext } from './types'

export const TOUR_AVG_P: Record<Tour, number> = { atp: 0.63, wta: 0.57 }
export const SURFACE_SERVE_BONUS: Record<Surface, number> = { hard: 0, grass: 0.015, clay: -0.015 }

const SKILL_K = 0.0016 // p shift per skill point
const BASE_CLAMP: [number, number] = [0.42, 0.82]
const FINAL_CLAMP: [number, number] = [0.3, 0.9]
const BIG_POINT_MAX_PENALTY = 0.03
const MOMENTUM_BONUS = 0.015
const MOMENTUM_MIN_STREAK = 3
const FATIGUE_START = 120 // point number
const FATIGUE_RATE = 0.0003 // per point past start, scaled by (1 - stamina/100)
const FATIGUE_CAP = 0.03

export interface Streak {
  side: Side
  length: number
}

function clamp(x: number, [lo, hi]: [number, number]): number {
  return x < lo ? lo : x > hi ? hi : x
}

// Barnett–Clarke matchup adjustment around the tour average, then surface bonus.
export function basePServe(server: MatchPlayer, receiver: MatchPlayer, opts: MatchOptions): number {
  const p =
    TOUR_AVG_P[opts.tour] +
    (server.serve - 50) * SKILL_K -
    (receiver.ret - 50) * SKILL_K +
    SURFACE_SERVE_BONUS[opts.surface]
  return clamp(p, BASE_CLAMP)
}

// Per-point term (already min-capped at FATIGUE_CAP) for one player's stamina.
function fatigueTerm(pointNumber: number, stamina: number): number {
  return Math.min(FATIGUE_CAP, (pointNumber - FATIGUE_START) * FATIGUE_RATE * (1 - stamina / 100))
}

export function modifiedPServe(
  base: number,
  server: MatchPlayer,
  receiver: MatchPlayer,
  ctx: PointContext,
  streak: Streak | null,
): number {
  let p = base

  // 1. Momentum: a run of >= MOMENTUM_MIN_STREAK points nudges p toward the streak holder.
  if (streak && streak.length >= MOMENTUM_MIN_STREAK) {
    p += streak.side === ctx.server ? MOMENTUM_BONUS : -MOMENTUM_BONUS
  }

  // 2. Big point (Klaassen–Magnus): servers underperform on break points, more so with low composure.
  if (ctx.breakPoint) {
    p -= (1 - server.composure / 100) * BIG_POINT_MAX_PENALTY
  }

  // 3. Fatigue: past FATIGUE_START the server tires (subtract) while a tired returner helps (add).
  if (ctx.pointNumber > FATIGUE_START) {
    p -= fatigueTerm(ctx.pointNumber, server.stamina)
    p += fatigueTerm(ctx.pointNumber, receiver.stamina)
  }

  // 4. Final clamp.
  return clamp(p, FINAL_CLAMP)
}
