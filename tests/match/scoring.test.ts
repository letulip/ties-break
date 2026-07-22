import { describe, it, expect } from 'vitest'
import { createScore, awardPoint, contextOf, formatScore } from '../../src/engine/match/scoring'
import type { MatchScore, Side } from '../../src/engine/match/types'

// Win one whole game for `side` starting from a fresh (0-0) game: 4 straight points.
function winGame(score: MatchScore, side: Side): void {
  for (let p = 0; p < 4; p++) awardPoint(score, side)
}

// Win `count` consecutive games for `side` (each from a game start).
function winGames(score: MatchScore, side: Side, count: number): void {
  for (let g = 0; g < count; g++) winGame(score, side)
}

describe('scoring — game (deuce/advantage margin rule)', () => {
  it('game won at 4-0', () => {
    const score = createScore(0)
    winGame(score, 0)
    expect(score.game).toEqual({ a: 0, b: 0 }) // reset after the game
    expect(score.sets[0]).toEqual({ a: 1, b: 0 }) // one game to side 0
  })

  it('game won at 4-2', () => {
    const score = createScore(0)
    awardPoint(score, 0) // 1-0
    awardPoint(score, 0) // 2-0
    awardPoint(score, 0) // 3-0
    awardPoint(score, 1) // 3-1
    awardPoint(score, 1) // 3-2 (40-30, not over)
    expect(score.sets[0]).toEqual({ a: 0, b: 0 })
    awardPoint(score, 0) // 4-2 -> game over, margin 2
    expect(score.sets[0]).toEqual({ a: 1, b: 0 })
    expect(score.game).toEqual({ a: 0, b: 0 })
  })

  it('game NOT over at 4-3 (advantage)', () => {
    const score = createScore(0)
    for (let i = 0; i < 3; i++) {
      awardPoint(score, 0)
      awardPoint(score, 1)
    } // 3-3 (deuce)
    awardPoint(score, 0) // 4-3 -> advantage, margin 1, not over
    expect(score.sets[0]).toEqual({ a: 0, b: 0 })
    expect(score.game).toEqual({ a: 4, b: 3 })
  })

  it('deuce cycle 40-40 -> Ad -> 40-40 and game from advantage', () => {
    const score = createScore(0)
    for (let i = 0; i < 3; i++) {
      awardPoint(score, 0)
      awardPoint(score, 1)
    } // 3-3
    expect(formatScore(score)).toBe('0-0 40-40')
    awardPoint(score, 0) // 4-3 -> Ad for side 0
    expect(formatScore(score)).toBe('0-0 Ad-40')
    awardPoint(score, 1) // 4-4 -> back to deuce
    expect(formatScore(score)).toBe('0-0 40-40')
    awardPoint(score, 0) // 5-4 -> Ad
    awardPoint(score, 0) // 6-4 raw -> game from advantage (margin 2)
    expect(score.game).toEqual({ a: 0, b: 0 })
    expect(score.sets[0]).toEqual({ a: 1, b: 0 })
  })
})

describe('scoring — set', () => {
  it('set won 6-4', () => {
    const score = createScore(0)
    winGames(score, 1, 4) // 0-4
    winGames(score, 0, 6) // 1-4 ... 6-4 -> set decided for side 0 on the 6th
    expect(score.sets[0]).toEqual({ a: 6, b: 4 })
    expect(score.winner).toBeNull()
    // a new in-progress set is opened
    expect(score.sets[score.sets.length - 1]).toEqual({ a: 0, b: 0 })
    expect(score.inTiebreak).toBe(false)
  })

  it('5-5 goes to 7-5', () => {
    const score = createScore(0)
    winGames(score, 0, 5) // 5-0
    winGames(score, 1, 5) // 5-5
    expect(score.sets[0]).toEqual({ a: 5, b: 5 })
    winGames(score, 0, 1) // 6-5 (not decided, margin 1)
    expect(score.inTiebreak).toBe(false)
    expect(score.sets[0]).toEqual({ a: 6, b: 5 })
    winGames(score, 0, 1) // 7-5 -> decided
    expect(score.sets[0]).toEqual({ a: 7, b: 5 })
  })

  it('6-6 enters a tiebreak', () => {
    const score = createScore(0)
    winGames(score, 0, 5) // 5-0
    winGames(score, 1, 6) // 5-6
    expect(score.inTiebreak).toBe(false)
    winGames(score, 0, 1) // 6-6
    expect(score.inTiebreak).toBe(true)
    expect(score.sets[score.sets.length - 1]).toEqual({ a: 6, b: 6 })
    expect(score.game).toEqual({ a: 0, b: 0 })
  })
})

// Bring a fresh match to 6-6 (tiebreak) in the current set.
function toTiebreak(score: MatchScore): void {
  winGames(score, 0, 5) // 5-0
  winGames(score, 1, 6) // 5-6
  winGames(score, 0, 1) // 6-6 -> tiebreak
}

describe('scoring — tiebreak', () => {
  it('tiebreak won 7-3 -> set recorded 7-6', () => {
    const score = createScore(0)
    toTiebreak(score)
    for (let i = 0; i < 3; i++) awardPoint(score, 1) // 0-3
    for (let i = 0; i < 7; i++) awardPoint(score, 0) // 1-3 ... 7-3 -> tiebreak won
    expect(score.inTiebreak).toBe(false)
    expect(score.sets[0]).toEqual({ a: 7, b: 6 })
    expect(score.game).toEqual({ a: 0, b: 0 })
    expect(score.winner).toBeNull()
  })

  it('tiebreak continues past 6-6 until margin 2 (8-6)', () => {
    const score = createScore(0)
    toTiebreak(score)
    for (let i = 0; i < 6; i++) {
      awardPoint(score, 0)
      awardPoint(score, 1)
    } // TB 6-6
    expect(score.inTiebreak).toBe(true)
    awardPoint(score, 0) // TB 7-6 -> margin 1, NOT over
    expect(score.inTiebreak).toBe(true)
    expect(score.game).toEqual({ a: 7, b: 6 })
    awardPoint(score, 0) // TB 8-6 -> margin 2, over
    expect(score.inTiebreak).toBe(false)
    expect(score.sets[0]).toEqual({ a: 7, b: 6 })
  })
})

describe('scoring — serve rotation', () => {
  it('serve alternates every game', () => {
    const score = createScore(0)
    const servers: Side[] = []
    for (let g = 0; g < 5; g++) {
      servers.push(score.server)
      winGame(score, 0) // side 0 wins each game (5-0, no set end)
    }
    expect(servers).toEqual([0, 1, 0, 1, 0])
  })

  it('tiebreak serve pattern for first 8 points = S,O,O,S,S,O,O,S (relative to opener)', () => {
    const score = createScore(0)
    toTiebreak(score)
    const opener = score.server
    const pattern: string[] = []
    // Alternate winners so the tiebreak does not end within 8 points.
    for (let i = 0; i < 8; i++) {
      pattern.push(score.server === opener ? 'S' : 'O')
      awardPoint(score, (i % 2) as Side)
    }
    expect(pattern).toEqual(['S', 'O', 'O', 'S', 'S', 'O', 'O', 'S'])
  })

  it('the set after the tiebreak opens with the opposite player to the TB opener', () => {
    const score = createScore(0)
    toTiebreak(score)
    const opener = score.server
    for (let i = 0; i < 7; i++) awardPoint(score, 0) // 7-0 -> tiebreak won
    expect(score.inTiebreak).toBe(false)
    expect(score.server).toBe((1 - opener) as Side)
  })
})

describe('scoring — contextOf breakPoint', () => {
  function scoreWith(game: { a: number; b: number }, server: Side, inTiebreak = false): MatchScore {
    return {
      sets: [{ a: 0, b: 0 }],
      game,
      inTiebreak,
      server,
      winner: null,
    }
  }

  it('breakPoint true at raw 0-3, 1-3, 2-3 (server 0, receiver at game point)', () => {
    for (const a of [0, 1, 2]) {
      const ctx = contextOf(scoreWith({ a, b: 3 }, 0), 1)
      expect(ctx.breakPoint).toBe(true)
    }
  })

  it('breakPoint true at receiver advantage', () => {
    const ctx = contextOf(scoreWith({ a: 3, b: 4 }, 0), 1) // receiver (side 1) has Ad
    expect(ctx.breakPoint).toBe(true)
  })

  it('breakPoint false at deuce (3-3)', () => {
    expect(contextOf(scoreWith({ a: 3, b: 3 }, 0), 1).breakPoint).toBe(false)
  })

  it('breakPoint false at server game point (40-15)', () => {
    expect(contextOf(scoreWith({ a: 3, b: 1 }, 0), 1).breakPoint).toBe(false)
  })

  it('breakPoint always false inside a tiebreak', () => {
    expect(contextOf(scoreWith({ a: 6, b: 5 }, 0, true), 1).breakPoint).toBe(false)
  })

  it('breakPoint is relative to the actual server (server 1)', () => {
    // side 0 is the receiver at game point -> break point against server 1
    expect(contextOf(scoreWith({ a: 3, b: 0 }, 1), 1).breakPoint).toBe(true)
  })
})

describe('scoring — contextOf set/match point', () => {
  it('serving at 5-4 40-30 in set 2 after winning set 1 -> set & match point for server', () => {
    const score: MatchScore = {
      sets: [{ a: 6, b: 4 }, { a: 5, b: 4 }],
      game: { a: 3, b: 2 }, // 40-30
      inTiebreak: false,
      server: 0,
      winner: null,
    }
    const ctx = contextOf(score, 100)
    expect(ctx.setPointFor).toBe(0)
    expect(ctx.matchPointFor).toBe(0)
  })

  it('set point inside a tiebreak at 6-5 (first set, so not match point)', () => {
    const score: MatchScore = {
      sets: [{ a: 6, b: 6 }],
      game: { a: 6, b: 5 }, // TB 6-5
      inTiebreak: true,
      server: 0,
      winner: null,
    }
    const ctx = contextOf(score, 60)
    expect(ctx.setPointFor).toBe(0)
    expect(ctx.matchPointFor).toBeNull()
    expect(ctx.breakPoint).toBe(false)
  })

  it('no set/match point mid-game', () => {
    const score: MatchScore = {
      sets: [{ a: 3, b: 2 }],
      game: { a: 1, b: 1 },
      inTiebreak: false,
      server: 0,
      winner: null,
    }
    const ctx = contextOf(score, 20)
    expect(ctx.setPointFor).toBeNull()
    expect(ctx.matchPointFor).toBeNull()
  })
})

describe('scoring — match end', () => {
  it('match ends at 2 sets; sets array holds only completed sets; awardPoint then throws', () => {
    const score = createScore(0)
    // side 0 wins two 6-0 sets = 48 points, ending the match exactly.
    for (let i = 0; i < 48; i++) awardPoint(score, 0)
    expect(score.winner).toBe(0)
    expect(score.sets).toEqual([{ a: 6, b: 0 }, { a: 6, b: 0 }]) // no in-progress set
    expect(score.sets.length).toBe(2)
    expect(() => awardPoint(score, 0)).toThrow()
  })

  it('a 1-1 set score leads to a 3rd set, and a 3rd-set 6-6 plays a tiebreak', () => {
    const score = createScore(0)
    for (let i = 0; i < 24; i++) awardPoint(score, 0) // set 1: 6-0 side 0
    for (let i = 0; i < 24; i++) awardPoint(score, 1) // set 2: 6-0 side 1 -> 1-1
    expect(score.sets.length).toBe(3)
    expect(score.sets[2]).toEqual({ a: 0, b: 0 })
    expect(score.winner).toBeNull()
    // drive 3rd set to 6-6
    winGames(score, 0, 5) // 5-0
    winGames(score, 1, 6) // 5-6
    winGames(score, 0, 1) // 6-6
    expect(score.inTiebreak).toBe(true)
    expect(score.sets[2]).toEqual({ a: 6, b: 6 })
    // finish the tiebreak -> match ends 2-1
    for (let i = 0; i < 7; i++) awardPoint(score, 0)
    expect(score.winner).toBe(0)
    expect(score.sets.length).toBe(3)
    expect(score.sets[2]).toEqual({ a: 7, b: 6 })
  })

  it('awardPoint throws when the match is already decided', () => {
    const score = createScore(0)
    for (let i = 0; i < 48; i++) awardPoint(score, 0)
    expect(() => awardPoint(score, 1)).toThrow()
  })
})

describe('scoring — formatScore exact strings', () => {
  it('new match', () => {
    expect(formatScore(createScore(0))).toBe('0-0')
  })

  it('after A wins one point', () => {
    const score = createScore(0)
    awardPoint(score, 0)
    expect(formatScore(score)).toBe('0-0 15-0')
  })

  it('deuce and advantage', () => {
    const score = createScore(0)
    for (let i = 0; i < 3; i++) {
      awardPoint(score, 0)
      awardPoint(score, 1)
    }
    expect(formatScore(score)).toBe('0-0 40-40')
    awardPoint(score, 0)
    expect(formatScore(score)).toBe('0-0 Ad-40')
  })

  it('B advantage renders 40-Ad', () => {
    const score = createScore(0)
    for (let i = 0; i < 3; i++) {
      awardPoint(score, 0)
      awardPoint(score, 1)
    }
    awardPoint(score, 1)
    expect(formatScore(score)).toBe('0-0 40-Ad')
  })

  it('completed set + in-progress set + game (6-4 2-1 30-30)', () => {
    const score: MatchScore = {
      sets: [{ a: 6, b: 4 }, { a: 2, b: 1 }],
      game: { a: 2, b: 2 },
      inTiebreak: false,
      server: 0,
      winner: null,
    }
    expect(formatScore(score)).toBe('6-4 2-1 30-30')
  })

  it('tiebreak (6-4 6-6 TB 3-2)', () => {
    const score: MatchScore = {
      sets: [{ a: 6, b: 4 }, { a: 6, b: 6 }],
      game: { a: 3, b: 2 },
      inTiebreak: true,
      server: 0,
      winner: null,
    }
    expect(formatScore(score)).toBe('6-4 6-6 TB 3-2')
  })
})
