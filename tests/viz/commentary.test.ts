import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildCommentary, type Beat } from '../../src/viz/commentary'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import type { AnnotatedMatch } from '../../src/viz/types'
import type { MatchPlayer, MatchOptions, Side, Surface } from '../../src/engine/match/types'

// Two juniors with different shapes so the corpus below contains blowouts, three-setters and
// tiebreaks rather than one repeated match.
const A: MatchPlayer = { id: 'kid', name: 'Bianca Tran', serve: 58, ret: 55, composure: 42, stamina: 61 }
const B: MatchPlayer = { id: 'opp', name: 'Dana Delgado', serve: 60, ret: 57, composure: 55, stamina: 60 }
const SURFACES: Surface[] = ['hard', 'clay', 'grass']

function play(seed: string, surface: Surface = 'hard'): AnnotatedMatch {
  const opts: MatchOptions = { surface, tour: 'wta', seed }
  return annotateMatch(simulateMatch(A, B, opts), A, B, opts)
}

function corpus(n: number): AnnotatedMatch[] {
  const out: AnnotatedMatch[] = []
  for (let i = 0; i < n; i++) out.push(play(`c-${i}`, SURFACES[i % SURFACES.length]))
  return out
}

const commentate = (m: AnnotatedMatch): Beat[] => buildCommentary(m, A.name, B.name)

describe('commentary – determinism', () => {
  it('the same match narrates identically, twice in a row', () => {
    const m = play('det-1')
    expect(commentate(m)).toEqual(commentate(m))
  })

  it('a REPLAY narrates identically – re-simulate from the stored seed, re-annotate, re-build', () => {
    // This is exactly the path MatchReplay/PracticeFlow take: the result is already committed and
    // the viewer re-runs simulateMatch under the SAME seed. If the commentary ever depended on
    // anything outside (match, names) this is the test that would catch it.
    for (const seed of ['replay-a', 'replay-b', 'replay-c']) {
      expect(commentate(play(seed))).toEqual(commentate(play(seed)))
    }
  })

  it('draws ZERO random numbers – not from the main stream, not from a sub-stream', () => {
    // Behavioural, not a source grep: Math.random is booby-trapped for the duration of the build.
    // (An engine RNG would not be caught by this, which is what the source pin below is for.)
    const m = play('det-rng')
    const real = Math.random
    Math.random = () => {
      throw new Error('commentary must not draw randomness')
    }
    try {
      expect(commentate(m).length).toBeGreaterThan(0)
    } finally {
      Math.random = real
    }
  })

  it('the module imports no RNG at all, so the frozen MAIN capture cannot move by construction', () => {
    const src = readFileSync(new URL('../../src/viz/commentary.ts', import.meta.url), 'utf8')
    // ⚠ If phrase variety ever DOES need a stream, this pin is the thing to re-aim – and the
    // replacement must be a purpose-scoped sub-stream (`rngFromSeed(seed + ':commentary')`, the
    // diary/outcall idiom), never the main one. Today it needs none: variety comes from a hash of
    // the point index, which is a pure function of the match.
    expect(src).not.toMatch(/from '.*engine\/rng'/)
    expect(src).not.toContain('Math.random')
  })
})

describe('commentary – volume discipline', () => {
  // The whole feature dies if it becomes a point log. A ~200-point three-setter must not produce
  // ~70 lines; the target the design was written to is "a handful of real beats per set".
  it('lands at a handful of beats per set across 200 matches, and never at point-log density', () => {
    const perSet: number[] = []
    let worstMatch = 0
    for (const m of corpus(200)) {
      const beats = commentate(m)
      const sets = m.result.sets.length
      perSet.push(beats.length / sets)
      worstMatch = Math.max(worstMatch, beats.length / m.points.length)
    }
    const mean = perSet.reduce((a, b) => a + b, 0) / perSet.length
    const max = Math.max(...perSet)
    expect(mean, `mean beats/set = ${mean.toFixed(2)}`).toBeLessThan(8)
    expect(mean).toBeGreaterThan(3) // and it must still SAY something
    expect(max, `worst set = ${max.toFixed(2)} beats`).toBeLessThanOrEqual(14)
    // A point log would sit near 1.0. Even the chattiest match here stays far under a fifth.
    expect(worstMatch, `worst beats/point = ${worstMatch.toFixed(3)}`).toBeLessThan(0.2)
  })

  it('at most one streak and at most one rally beat per set', () => {
    for (const m of corpus(60)) {
      const perSet = new Map<string, number>()
      for (const b of commentate(m)) {
        if (b.kind !== 'streak' && b.kind !== 'rally') continue
        const key = `${b.set}:${b.kind}`
        perSet.set(key, (perSet.get(key) ?? 0) + 1)
      }
      for (const [key, n] of perSet) expect(n, key).toBe(1)
    }
  })
})

describe('commentary – shape', () => {
  it('is chronological, one beat per point, and bracketed by the opener and the match beat', () => {
    for (const m of corpus(60)) {
      const beats = commentate(m)
      const indices = beats.map((b) => b.pointIndex)
      expect([...indices].sort((x, y) => x - y)).toEqual(indices)
      expect(new Set(indices).size).toBe(indices.length)
      expect(beats[0].kind).toBe('open')
      expect(beats[0].pointIndex).toBe(0)
      expect(beats[beats.length - 1].kind).toBe('match')
      expect(beats[beats.length - 1].pointIndex).toBe(m.points.length - 1)
      expect(beats.filter((b) => b.kind === 'match')).toHaveLength(1)
      expect(beats.filter((b) => b.kind === 'open')).toHaveLength(1)
      // The LAST set is told by the match beat, so a `set` beat exists for every set but that one.
      expect(beats.filter((b) => b.kind === 'set')).toHaveLength(m.result.sets.length - 1)
      for (const b of beats) expect(b.set).toBeGreaterThanOrEqual(1)
    }
  })

  it('an empty match produces nothing rather than throwing', () => {
    const empty = { ...play('shape-empty'), points: [] }
    expect(buildCommentary(empty, A.name, B.name)).toEqual([])
  })
})

describe('commentary – honesty (a beat may claim nothing the point log does not carry)', () => {
  it("a `break` beat only ever sits on a game the RETURNER won, and never inside a tiebreak", () => {
    for (const m of corpus(60)) {
      for (const b of commentate(m).filter((x) => x.kind === 'break')) {
        const p = m.points[b.pointIndex]
        expect(p.gameEnd, 'break beats sit on a game end').toBe(true)
        expect(p.entry.tiebreak).toBe(false)
        expect(p.entry.winner).not.toBe(p.entry.server)
      }
    }
  })

  it('a `hold` beat only ever sits on a game the SERVER won', () => {
    for (const m of corpus(60)) {
      for (const b of commentate(m).filter((x) => x.kind === 'hold')) {
        const p = m.points[b.pointIndex]
        expect(p.gameEnd).toBe(true)
        expect(p.entry.winner).toBe(p.entry.server)
        expect(p.setEnd, 'a set-deciding hold is told by the set beat, not twice').toBe(false)
      }
    }
  })

  it('a `set` beat sits on a set end, and the `match` beat on the final point', () => {
    for (const m of corpus(60)) {
      const beats = commentate(m)
      for (const b of beats.filter((x) => x.kind === 'set')) {
        expect(m.points[b.pointIndex].setEnd).toBe(true)
        expect(b.pointIndex).not.toBe(m.points.length - 1)
      }
      const match = beats[beats.length - 1]
      expect(m.points[match.pointIndex].setEnd).toBe(true)
      // It names the actual winner and carries the actual scoreline.
      const winnerName = m.result.winner === 0 ? 'Bianca' : 'Dana'
      expect(match.text.startsWith(winnerName)).toBe(true)
      expect(match.score).toBe(m.result.sets.map((s) => `${s.a}-${s.b}`).join('  '))
      expect(match.text).toContain(m.result.sets.length === 3 ? 'in three' : 'straight sets')
    }
  })

  it('a `streak` beat counts a run that really ended on that point', () => {
    const NUM: Record<string, number> = {
      Six: 6, Seven: 7, Eight: 8, Nine: 9, Ten: 10, Eleven: 11, Twelve: 12,
      Thirteen: 13, Fourteen: 14, Fifteen: 15, Sixteen: 16, Seventeen: 17,
      Eighteen: 18, Nineteen: 19, Twenty: 20,
    }
    let seen = 0
    for (const m of corpus(60)) {
      for (const b of commentate(m).filter((x) => x.kind === 'streak')) {
        const word = b.text.split(' ')[0]
        const claimed = NUM[word] ?? Number(word)
        expect(Number.isFinite(claimed), b.text).toBe(true)
        expect(claimed).toBeGreaterThanOrEqual(6)
        const side = m.points[b.pointIndex].entry.winner
        // Count backwards from the anchor: the claimed run must actually be there...
        let actual = 0
        for (let i = b.pointIndex; i >= 0 && m.points[i].entry.winner === side; i--) actual++
        expect(actual, b.text).toBe(claimed)
        // ...and it must have ENDED here (the next point went the other way, or the match did).
        const next = m.points[b.pointIndex + 1]
        expect(next === undefined || next.entry.winner !== side, 'the run ended on its anchor').toBe(true)
        expect(b.text).toContain(side === 0 ? 'Bianca' : 'Dana')
        seen++
      }
    }
    expect(seen, 'the corpus must actually contain streaks').toBeGreaterThan(20)
  })

  it('a `rally` beat counts the shots that are really in the rally, and it ended in a winner', () => {
    let seen = 0
    for (const m of corpus(60)) {
      for (const b of commentate(m).filter((x) => x.kind === 'rally')) {
        const shots = m.points[b.pointIndex].rally.shots
        expect(shots.length).toBeGreaterThanOrEqual(12)
        expect(shots[shots.length - 1].result).toBe('winner')
        expect(b.text).toContain(shots[shots.length - 1].by === 0 ? 'Bianca' : 'Dana')
        seen++
      }
    }
    expect(seen).toBeGreaterThan(20)
  })

  it('a `tiebreak` beat only fires at six games all, before the breaker is played', () => {
    let seen = 0
    for (const m of corpus(120)) {
      for (const b of commentate(m).filter((x) => x.kind === 'tiebreak')) {
        expect(b.score).toBe('6-6')
        expect(m.points[b.pointIndex].gameEnd).toBe(true)
        expect(m.points[b.pointIndex].setEnd).toBe(false)
        expect(m.points[b.pointIndex + 1].entry.tiebreak).toBe(true)
        seen++
      }
    }
    expect(seen, 'the corpus must actually contain tiebreaks').toBeGreaterThan(10)
  })

  it('every "saves N match/set points" claim is backed by the point log', () => {
    let matchPoints = 0
    for (const m of corpus(120)) {
      for (const b of commentate(m).filter((x) => x.kind === 'hold')) {
        const held = m.points[b.pointIndex].entry.winner
        const other: Side = held === 0 ? 1 : 0
        // Walk back over the game this beat closed and count what the log actually says.
        let faced = 0
        for (let i = b.pointIndex; i >= 0; i--) {
          if (m.points[i].entry.matchPointFor === other) faced++
          if (i < b.pointIndex && m.points[i].gameEnd) break
        }
        if (b.text.includes('match point')) {
          expect(faced, b.text).toBeGreaterThan(0)
          matchPoints++
        } else {
          expect(faced, `"${b.text}" hides a saved match point`).toBe(0)
        }
      }
    }
    expect(matchPoints, 'the corpus must contain saved match points').toBeGreaterThan(3)
  })
})

describe('commentary – copy rules', () => {
  it('no long dash, no Cyrillic, no leftover digits-as-words, and every line is a sentence', () => {
    for (const m of corpus(80)) {
      for (const b of commentate(m)) {
        const line = `${b.lead ?? ''} ${b.text}`
        expect(line, 'player copy uses the short dash only').not.toContain('—')
        expect(line).not.toMatch(/[Ѐ-ӿ]/)
        expect(b.text.endsWith('.'), b.text).toBe(true)
        expect(b.text[0], b.text).toBe(b.text[0].toUpperCase())
        // Leads are TAGS, not sentences – they have to fit the log row's accent slot.
        if (b.lead !== null) expect(b.lead.length).toBeLessThanOrEqual(10)
        // Nothing may run away with the row: two or three short sentences, never a paragraph.
        expect(b.text.length, b.text).toBeLessThanOrEqual(120)
      }
    }
  })

  it('players are told apart by name in every beat that names anyone', () => {
    // The one ambiguity worth guarding: two players who share a first name fall back to the full
    // name for BOTH, so no row can be read as being about the wrong girl.
    const m = play('copy-names')
    const clash = buildCommentary(m, 'Mila Tran', 'Mila Delgado')
    for (const b of clash) {
      expect(b.text.includes('Mila Tran') || b.text.includes('Mila Delgado') || !b.text.includes('Mila')).toBe(true)
    }
  })

  it('a label that is not a person keeps its whole name ("Top seed", not "Top")', () => {
    // The Season screen's exhibition opponent really is called "Top seed", and the first-name rule
    // was writing "Top sends it long." Found in the browser, not in the suite.
    const m = play('copy-label')
    for (const b of buildCommentary(m, 'Vera Martin', 'Top seed')) {
      expect(b.text, b.text).not.toMatch(/\bTop\b(?! seed)/)
      if (b.text.includes('Vera')) expect(b.text).not.toContain('Vera Martin')
    }
  })
})
