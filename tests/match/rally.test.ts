import { describe, it, expect } from 'vitest'
import { annotateMatch } from '../../src/engine/match/rally'
import { simulateMatch } from '../../src/engine/match/engine'
import { COURT } from '../../src/viz/types'
import type { Shot, AnnotatedMatch } from '../../src/viz/types'
import type { MatchPlayer, MatchOptions, Side } from '../../src/engine/match/types'

function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, ...overrides }
}
function opts(overrides: Partial<MatchOptions> = {}): MatchOptions {
  return { surface: 'hard', tour: 'atp', seed: 'seed-0', ...overrides }
}

const A = player({ id: 'a', name: 'A', serve: 60, ret: 50 })
const B = player({ id: 'b', name: 'B', serve: 53, ret: 55 })

function annotate(o: MatchOptions, a = A, b = B): AnnotatedMatch {
  return annotateMatch(simulateMatch(a, b, o), a, b, o)
}

function isFaultServe(s: Shot): boolean {
  return (s.kind === 'serve1' || s.kind === 'serve2') && (s.result === 'out' || s.result === 'net')
}
function isServe(s: Shot): boolean {
  return s.kind === 'serve1' || s.kind === 'serve2'
}
function sign(x: number): number {
  return x >= 0 ? 1 : -1
}

describe('rally — required test 1: determinism', () => {
  it('annotateMatch twice on the same result is deep-equal', () => {
    const o = opts({ seed: 'determ-1', surface: 'clay' })
    const result = simulateMatch(A, B, o)
    const one = annotateMatch(result, A, B, o)
    const two = annotateMatch(result, A, B, o)
    expect(one).toEqual(two)
  })

  it('one annotated point per logged point', () => {
    const o = opts({ seed: 'determ-2' })
    const result = simulateMatch(A, B, o)
    const ann = annotateMatch(result, A, B, o)
    expect(ann.points.length).toBe(result.log.length)
    for (let i = 0; i < ann.points.length; i++) {
      expect(ann.points[i].entry).toEqual(result.log[i])
      expect(ann.points[i].rally.pointNumber).toBe(result.log[i].pointNumber)
    }
  })
})

describe('rally — required test 2: winner consistency + alternation', () => {
  it('across 20 varied matches the implied winner matches the log and hitters alternate', () => {
    for (let i = 0; i < 20; i++) {
      const surface = (['hard', 'clay', 'grass'] as const)[i % 3]
      const o = opts({ seed: `winner-${i}`, surface, tour: i % 2 ? 'wta' : 'atp' })
      const ann = annotate(o)
      for (const pt of ann.points) {
        const server = pt.entry.server
        const receiver: Side = (1 - server) as Side
        const shots = pt.rally.shots

        // implied winner
        let implied: Side
        if (pt.rally.ace) implied = server
        else if (pt.rally.doubleFault) implied = receiver
        else {
          const last = shots[shots.length - 1]
          implied = last.result === 'winner' ? last.by : ((1 - last.by) as Side)
        }
        expect(implied).toBe(pt.entry.winner)

        // hitters alternate over the non-fault shots, starting with the server;
        // faulted serves repeat the server.
        const nonFault = shots.filter((s) => !isFaultServe(s))
        for (let k = 0; k < nonFault.length; k++) {
          const expected: Side = k % 2 === 0 ? server : receiver
          expect(nonFault[k].by).toBe(expected)
        }
        // every faulted serve is by the server
        for (const s of shots) if (isFaultServe(s)) expect(s.by).toBe(server)
      }
    }
  })
})

describe('rally — required test 3: ace/DF legality and rates', () => {
  it('per-point legality of ace and doubleFault flags', () => {
    for (let i = 0; i < 10; i++) {
      const ann = annotate(opts({ seed: `legal-${i}`, tour: i % 2 ? 'wta' : 'atp' }))
      for (const pt of ann.points) {
        const server = pt.entry.server
        const receiver: Side = (1 - server) as Side
        const shots = pt.rally.shots
        if (pt.rally.ace) {
          expect(pt.rally.doubleFault).toBe(false)
          expect(pt.entry.winner).toBe(server) // server won
          // exactly one 'in' shot (the serve), no rally strokes
          const inShots = shots.filter((s) => s.result === 'in')
          expect(inShots.length).toBe(1)
          expect(isServe(inShots[0])).toBe(true)
          expect(shots.every((s) => s.kind !== 'rally')).toBe(true)
        }
        if (pt.rally.doubleFault) {
          expect(pt.rally.ace).toBe(false)
          expect(pt.entry.winner).toBe(receiver) // receiver won
          expect(shots.length).toBe(2)
          expect(shots.every((s) => isFaultServe(s))).toBe(true)
        }
      }
    }
  })

  it('over 50 matches both occur and rates are sane', () => {
    let aces = 0
    let dfs = 0
    let servicePoints = 0
    for (let i = 0; i < 50; i++) {
      const ann = annotate(opts({ seed: `rates-${i}`, tour: i % 2 ? 'wta' : 'atp' }))
      for (const pt of ann.points) {
        servicePoints++
        if (pt.rally.ace) aces++
        if (pt.rally.doubleFault) dfs++
      }
    }
    expect(aces).toBeGreaterThan(0)
    expect(dfs).toBeGreaterThan(0)
    const aceRate = aces / servicePoints
    const dfRate = dfs / servicePoints
    expect(aceRate).toBeGreaterThan(0.01)
    expect(aceRate).toBeLessThan(0.15)
    expect(dfRate).toBeGreaterThan(0.01)
    expect(dfRate).toBeLessThan(0.1)
  })
})

describe('rally — required test 4: geometry', () => {
  it('every in/winner is inside the correct court (service box for serves); out is outside; net at y=0', () => {
    const { halfWidth, halfLength, serviceLine } = COURT
    for (let i = 0; i < 12; i++) {
      const surface = (['hard', 'clay', 'grass'] as const)[i % 3]
      const ann = annotate(opts({ seed: `geo-${i}`, surface }))
      for (const pt of ann.points) {
        const server = pt.entry.server
        const receiver: Side = (1 - server) as Side
        const xSignServe = pt.deuceCourt
          ? receiver === 1
            ? 1
            : -1
          : receiver === 1
            ? -1
            : 1
        for (const s of pt.rally.shots) {
          const ySide = s.by === 0 ? 1 : -1 // ball lands on the opponent's half
          if (s.result === 'net') {
            expect(s.bounce.y).toBe(0)
            continue
          }
          if (isServe(s)) {
            if (s.result === 'in') {
              expect(Math.abs(s.bounce.x)).toBeLessThan(halfWidth)
              expect(Math.abs(s.bounce.y)).toBeGreaterThan(0)
              expect(Math.abs(s.bounce.y)).toBeLessThan(serviceLine)
              expect(sign(s.bounce.x)).toBe(xSignServe)
              expect(sign(s.bounce.y)).toBe(ySide)
            } else {
              // faulted serve 'out' -> outside the service box
              const outside =
                Math.abs(s.bounce.y) > serviceLine || Math.abs(s.bounce.x) > halfWidth
              expect(outside).toBe(true)
            }
          } else {
            // rally stroke
            if (s.result === 'in' || s.result === 'winner') {
              expect(Math.abs(s.bounce.x)).toBeLessThan(halfWidth)
              expect(Math.abs(s.bounce.y)).toBeGreaterThan(0)
              expect(Math.abs(s.bounce.y)).toBeLessThan(halfLength)
              expect(sign(s.bounce.y)).toBe(ySide)
            } else {
              // 'out'
              const outside =
                Math.abs(s.bounce.y) > halfLength || Math.abs(s.bounce.x) > halfWidth
              expect(outside).toBe(true)
            }
          }
        }
      }
    }
  })
})

describe('rally — required test 5: length distribution', () => {
  function nonFaultLen(shots: Shot[]): number {
    return shots.filter((s) => !isFaultServe(s)).length
  }

  it('100 ATP hard matches: <=4 share in [0.50,0.75], >=9 share in [0.03,0.20]', () => {
    let total = 0
    let le4 = 0
    let ge9 = 0
    for (let i = 0; i < 100; i++) {
      const ann = annotate(opts({ seed: `len-${i}`, surface: 'hard', tour: 'atp' }))
      for (const pt of ann.points) {
        if (pt.rally.doubleFault) continue // exclude DF
        const len = nonFaultLen(pt.rally.shots)
        total++
        if (len <= 4) le4++
        if (len >= 9) ge9++
      }
    }
    const le4Share = le4 / total
    const ge9Share = ge9 / total
    expect(le4Share).toBeGreaterThanOrEqual(0.5)
    expect(le4Share).toBeLessThanOrEqual(0.75)
    expect(ge9Share).toBeGreaterThanOrEqual(0.03)
    expect(ge9Share).toBeLessThanOrEqual(0.2)
  })

  it('mean rally length: clay > grass over the same seeds', () => {
    function meanLen(surface: 'clay' | 'grass'): number {
      let sum = 0
      let n = 0
      for (let i = 0; i < 60; i++) {
        const ann = annotate(opts({ seed: `surf-${i}`, surface }))
        for (const pt of ann.points) {
          if (pt.rally.doubleFault) continue
          sum += nonFaultLen(pt.rally.shots)
          n++
        }
      }
      return sum / n
    }
    expect(meanLen('clay')).toBeGreaterThan(meanLen('grass'))
  })
})

describe('rally — required test 6: flags', () => {
  it('gameEnd/setEnd counts match the result; deuceCourt true on each game first point', () => {
    for (let i = 0; i < 15; i++) {
      const o = opts({ seed: `flags-${i}`, surface: (['hard', 'clay', 'grass'] as const)[i % 3] })
      const result = simulateMatch(A, B, o)
      const ann = annotateMatch(result, A, B, o)

      const gameEnds = ann.points.filter((p) => p.gameEnd).length
      const setEnds = ann.points.filter((p) => p.setEnd).length
      const expectedGames = result.sets.reduce((acc, s) => acc + s.a + s.b, 0)
      expect(gameEnds).toBe(expectedGames)
      expect(setEnds).toBe(result.sets.length)

      // every set end is also a game end
      for (const p of ann.points) if (p.setEnd) expect(p.gameEnd).toBe(true)

      // deuceCourt true on the very first point and on every point after a gameEnd
      expect(ann.points[0].deuceCourt).toBe(true)
      for (let k = 0; k < ann.points.length - 1; k++) {
        if (ann.points[k].gameEnd) expect(ann.points[k + 1].deuceCourt).toBe(true)
      }
    }
  })
})
