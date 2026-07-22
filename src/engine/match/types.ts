// Shared contract for the match engine (Phase 1). This file is the source of truth:
// implementations in scoring.ts / point.ts / closedForm.ts / engine.ts must conform to it.

export type Surface = 'hard' | 'clay' | 'grass'
export type Tour = 'wta' | 'atp'
export type Side = 0 | 1

export interface MatchPlayer {
  id: string
  name: string
  /** 0-100: serve quality + first-strike game */
  serve: number
  /** 0-100: return + neutralizing quality */
  ret: number
  /** 0-100: big-point nerves; 100 = no choke penalty on break points */
  composure: number
  /** 0-100: resistance to late-match fatigue */
  stamina: number
}

export interface MatchOptions {
  surface: Surface
  tour: Tour
  /** only best-of-3 in Phase 1 */
  bestOf?: 3
  seed: string
  /** cosmetic (provably irrelevant to win probability); defaults to 0 */
  firstServer?: Side
  /** momentum/streak modifier on; defaults to true */
  momentum?: boolean
}

/** Raw point counters of the current game or tiebreak (deuce = margin rule, not a state). */
export interface GamePoints {
  a: number
  b: number
}

/** Games won per side in one set, from side A's perspective. */
export interface SetGames {
  a: number
  b: number
}

export interface MatchScore {
  /** completed sets, plus the in-progress set as the last element */
  sets: SetGames[]
  game: GamePoints
  inTiebreak: boolean
  server: Side
  winner: Side | null
}

/** Context of the NEXT point, computed before it is played. */
export interface PointContext {
  /** 1-based sequential number of the point in the match */
  pointNumber: number
  server: Side
  tiebreak: boolean
  /** receiver wins the game if they win this point (regular games only) */
  breakPoint: boolean
  setPointFor: Side | null
  matchPointFor: Side | null
}

export interface PointLogEntry extends PointContext {
  winner: Side
  /** serve-point win probability actually used, after all modifiers */
  pServe: number
  /** score AFTER the point, e.g. "6-4 2-1 30-30" or "6-4 6-6 TB 3-2" */
  scoreAfter: string
}

export interface SideMatchStats {
  pointsWon: number
  servePointsPlayed: number
  servePointsWon: number
  /** on own serve */
  breakPointsFaced: number
  breakPointsSaved: number
  /** return games won */
  breaksWon: number
  longestPointStreak: number
}

export interface MatchResult {
  winner: Side
  /** completed sets only, e.g. [{a:6,b:4},{a:7,b:6}] */
  sets: SetGames[]
  stats: [SideMatchStats, SideMatchStats]
  log: PointLogEntry[]
  totalPoints: number
  seed: string
}
