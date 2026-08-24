// FIXED-RECORD PARITY FOR THE ENGINE-SIDE MATCH PATH – the net R2-06 moves code under.
//
// ⚠ WHAT THIS FILE IS, AND WHY IT IS NOT tests/component/match-viewer-parity.test.ts. That file
// freezes what leaves the COMPONENT on every paint; it can only see the match through a mounted
// viewer, and it mocks the audio layer to do it. R2-06 moves modules on the other side of that
// boundary – the rally annotation, the serve-speed stream, the box score and the clock – so the
// record it needs is the ENGINE's own emitted sequence, taken with no DOM in the room.
//
// ⚠ HOW A "RECORDED MATCH" WORKS HERE, and it is the repo's own mechanism rather than a new one.
// `MatchReplay.vue` re-watches a stored `WorldMatch` by re-running `simulateMatch(a, b, opts)` under
// the SAME stored seed – a pure function, so the match reproduces byte for byte and nothing is
// stored except the seed and the two skill snapshots. Each `RECORD` below is exactly that shape.
//
// ⚠ WHAT IS CAPTURED, and the answer is EVERYTHING the four modules emit:
//   * every point's log entry (server, winner, pServe, breakPoint, set/match point, scoreAfter);
//   * every shot of every rally – striker, kind, direction, both bounce coordinates, result;
//   * the ace / double-fault flags, the deuce-court flag, the game/set-end flags;
//   * the post-point live win probability, at full float precision;
//   * every serve speed the point's own `<seed>:spd:<n>` stream produced, in strike order;
//   * the whole box score, and the diegetic clock's per-point start times.
// `hash` is over ALL of it, unabridged. The readable fields beside it exist so a red run says WHAT
// moved before it says that something did.
//
// ⚠ THIS IS A PURE-MOVE NET, NOT A BALANCE PIN. A wave that deliberately retunes the rally model
// changes these numbers and SHOULD; a wave that only moves a module must leave them byte-identical.
// R2-06 is the second kind, which is the whole reason the record was frozen before the move and not
// after it.
//
// ⚠ REGENERATING IS DELIBERATE AND LOUD: `TB_WRITE_MATCH_ANNOTATION_PARITY=1 npx vitest run
// --project unit tests/match/match-annotation-parity.test.ts` rewrites the fixture. A refactor that
// needs it has changed behaviour, and THAT is the finding.
import { describe, it, expect } from 'vitest'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { pointServeSpeeds } from '../../src/engine/match/serveSpeed'
import { computeMatchStats } from '../../src/viz/match/matchStats'
import { matchDurationSeconds, pointStartSeconds } from '../../src/viz/matchClock'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { fnv1aHex } from '../helpers/hash'
import type { AnnotatedMatch } from '../../src/shared/matchViz'
import type { MatchOptions, MatchPlayer, Surface, Tour } from '../../src/engine/match/types'

const FIXTURE_DIR = resolve(process.cwd(), 'tests/fixtures/match-parity')
const FIXTURE = resolve(FIXTURE_DIR, 'annotation-run.json')
const WRITING = process.env.TB_WRITE_MATCH_ANNOTATION_PARITY === '1'

interface Record_ {
  seed: string
  surface: Surface
  tour: Tour
  a: MatchPlayer
  b: MatchPlayer
}

/** ⚠ FOUR ARMS, EACH BUYING A DIFFERENT BRANCH – a single seed would leave most of the path unpinned.
 *  `hard-even` is a long grinding match (the rally-length buckets); `clay-cannon` has a 40-point
 *  serve gap so the ace branch and the speed ceiling actually fire; `grass-legacy` omits `age`
 *  entirely, which is the `LEGACY_SNAPSHOT_AGE` path an old save takes; `hard-second-server` starts
 *  the other player serving, which re-phases the deuce-court parity and the change-of-ends clock. */
const RECORDS: Record<string, Record_ & { firstServer?: 0 | 1 }> = {
  'hard-even': {
    seed: 'r2-06-parity-hard-even',
    surface: 'hard',
    tour: JUNIOR_TOUR,
    a: { id: 'a', name: 'Vera Novak', serve: 55, ret: 52, composure: 50, stamina: 50, groundstrokes: 50, age: 16.4 },
    b: { id: 'b', name: 'Ines Duval', serve: 54, ret: 53, composure: 50, stamina: 50, groundstrokes: 50, age: 17.9 },
  },
  'clay-cannon': {
    seed: 'r2-06-parity-clay-cannon',
    surface: 'clay',
    tour: JUNIOR_TOUR,
    a: { id: 'a', name: 'Mira Fontaine', serve: 88, ret: 46, composure: 61, stamina: 58, groundstrokes: 64, age: 21.2 },
    b: { id: 'b', name: 'Lea Brandt', serve: 48, ret: 66, composure: 49, stamina: 55, groundstrokes: 57, age: 13.1 },
  },
  'grass-legacy': {
    seed: 'r2-06-parity-grass-legacy',
    surface: 'grass',
    tour: JUNIOR_TOUR,
    // ⚠ NO `age` ON EITHER PLAYER – the pre-branch snapshot shape. Both speeds fall back to
    // LEGACY_SNAPSHOT_AGE, and that fallback is read in three places (rally's ace rate, the box
    // score's rows, point.ts's own speed base), so a move that dropped one of them shows up here.
    a: { id: 'a', name: 'Anke Roth', serve: 71, ret: 58, composure: 55, stamina: 52, groundstrokes: 60 },
    b: { id: 'b', name: 'Sofia Reyes', serve: 63, ret: 62, composure: 58, stamina: 61, groundstrokes: 55 },
  },
  // ⚠ AND THIS ONE TURNED OUT TO BE THE RETIREMENT ARM, which was luck rather than design and is
  // kept deliberately: side 1 stops at 1-3 in the third, so `MatchResult.retired` is populated and
  // the truncated log walks the whole annotate/speed/box-score/clock path a short match takes. The
  // non-vacuity test below asserts that it is still a retirement, so a reseed cannot quietly lose it.
  'hard-second-server': {
    seed: 'r2-06-parity-hard-second-server',
    surface: 'hard',
    tour: JUNIOR_TOUR,
    firstServer: 1,
    a: { id: 'a', name: 'Nadia Alves', serve: 66, ret: 49, composure: 44, stamina: 47, groundstrokes: 52, age: 14.75 },
    b: { id: 'b', name: 'Elin Aas', serve: 59, ret: 57, composure: 66, stamina: 63, groundstrokes: 49, age: 19.5 },
  },
}

function optionsOf(record: Record_ & { firstServer?: 0 | 1 }): MatchOptions {
  const opts: MatchOptions = { surface: record.surface, tour: record.tour, seed: record.seed }
  if (record.firstServer !== undefined) opts.firstServer = record.firstServer
  return opts
}

/**
 * THE WHOLE EMITTED SEQUENCE AS ONE STRING. Raw numbers, never rounded: a bounce coordinate that
 * moved in the sixteenth decimal is a different draw, and a `toFixed` here would hide exactly the
 * class of change this record exists to catch.
 */
function serialise(record: Record_ & { firstServer?: 0 | 1 }, annotated: AnnotatedMatch): string {
  const opts = optionsOf(record)
  const out: string[] = []
  const r = annotated.result
  out.push(`M|${r.winner}|${r.totalPoints}|${r.seed}|${r.sets.map((s) => `${s.a}-${s.b}`).join(',')}`)
  out.push(`R|${r.retired ? `${r.retired.side}@${r.retired.pointNumber}` : 'none'}`)
  for (const side of [0, 1] as const) {
    const s = r.stats[side]
    out.push(
      `S${side}|${s.pointsWon}|${s.servePointsPlayed}|${s.servePointsWon}|${s.breakPointsFaced}|` +
        `${s.breakPointsSaved}|${s.breaksWon}|${s.longestPointStreak}`,
    )
  }
  for (const point of annotated.points) {
    const e = point.entry
    out.push(
      `P|${e.pointNumber}|${e.server}|${e.winner}|${e.pServe}|${e.tiebreak ? 1 : 0}|${e.breakPoint ? 1 : 0}|` +
        `${e.setPointFor ?? '-'}|${e.matchPointFor ?? '-'}|${e.scoreAfter}|` +
        `${point.winProbA}|${point.deuceCourt ? 1 : 0}|${point.gameEnd ? 1 : 0}|${point.setEnd ? 1 : 0}|` +
        `${point.rally.ace ? 1 : 0}|${point.rally.doubleFault ? 1 : 0}`,
    )
    for (const shot of point.rally.shots) {
      out.push(`  H|${shot.by}|${shot.kind}|${shot.direction}|${shot.bounce.x}|${shot.bounce.y}|${shot.result}`)
    }
    for (const struck of pointServeSpeeds(r.seed, point, record.a, record.b)) {
      out.push(`  V|${struck.shotIndex}|${struck.side}|${struck.kmh}|${struck.secondServe ? 1 : 0}`)
    }
  }
  out.push(`C|${pointStartSeconds(annotated).join(',')}`)
  const stats = computeMatchStats(annotated, record.a, record.b)
  out.push(
    `B|${stats.winners.join(',')}|${stats.unforcedErrors.join(',')}|${stats.aces.join(',')}|` +
      `${stats.doubleFaults.join(',')}|${stats.meanRallyLength}|${stats.serveSpeed.avg.join(',')}|` +
      `${stats.serveSpeed.max.join(',')}|${stats.durationEstimate}`,
  )
  out.push(`O|${opts.surface}|${opts.tour}|${opts.firstServer ?? 0}`)
  return out.join('\n')
}

/** The readable halves plus the hash over everything – the shape match-viewer-parity froze. */
function frozen(name: string): {
  points: number
  shots: number
  scoreline: string
  winner: number
  retired: string
  aces: [number, number]
  doubleFaults: [number, number]
  winners: [number, number]
  unforcedErrors: [number, number]
  meanRallyLength: number
  serveSpeedAvg: [number, number]
  serveSpeedMax: [number, number]
  durationEstimate: string
  durationSeconds: number
  firstShots: string[]
  everyTwentyFifthPoint: string[]
  hash: string
} {
  const record = RECORDS[name]
  const opts = optionsOf(record)
  const annotated = annotateMatch(simulateMatch(record.a, record.b, opts), record.a, record.b, opts)
  const stats = computeMatchStats(annotated, record.a, record.b)
  const text = serialise(record, annotated)
  const lines = text.split('\n')
  return {
    points: annotated.points.length,
    shots: annotated.points.reduce((n, p) => n + p.rally.shots.length, 0),
    scoreline: annotated.result.sets.map((s) => `${s.a}-${s.b}`).join(' '),
    winner: annotated.result.winner,
    retired: annotated.result.retired
      ? `${annotated.result.retired.side}@${annotated.result.retired.pointNumber}`
      : 'none',
    aces: stats.aces,
    doubleFaults: stats.doubleFaults,
    winners: stats.winners,
    unforcedErrors: stats.unforcedErrors,
    meanRallyLength: stats.meanRallyLength,
    serveSpeedAvg: stats.serveSpeed.avg,
    serveSpeedMax: stats.serveSpeed.max,
    durationEstimate: stats.durationEstimate,
    durationSeconds: matchDurationSeconds(annotated),
    firstShots: lines.filter((l) => l.startsWith('  H|')).slice(0, 16),
    everyTwentyFifthPoint: lines.filter((l) => l.startsWith('P|')).filter((_, i) => i % 25 === 0),
    hash: fnv1aHex(text),
  }
}

describe('fixed-record parity – the engine-side match path', () => {
  it('four recorded matches emit the sequence frozen before R2-06 moved anything', () => {
    const captured: Record<string, ReturnType<typeof frozen>> = {}
    for (const name of Object.keys(RECORDS)) captured[name] = frozen(name)

    if (WRITING) {
      mkdirSync(FIXTURE_DIR, { recursive: true })
      writeFileSync(FIXTURE, JSON.stringify(captured, null, 2) + '\n')
      // Loud on purpose: a run that WROTE the record has not checked anything.
      console.warn(`[parity] rewrote ${FIXTURE} – this run asserted nothing`)
      return
    }

    expect(existsSync(FIXTURE), `no frozen record at ${FIXTURE}`).toBe(true)
    const golden = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, ReturnType<typeof frozen>>
    expect(Object.keys(captured).sort()).toEqual(Object.keys(golden).sort())
    for (const name of Object.keys(golden)) {
      // The readable halves first, so a red run says WHAT moved before it says that something did.
      expect(captured[name].scoreline, `${name}: the match itself resolved differently`).toBe(golden[name].scoreline)
      expect(captured[name].winner, `${name}: a different player won`).toBe(golden[name].winner)
      expect(captured[name].retired, `${name}: the retirement branch moved`).toBe(golden[name].retired)
      expect(captured[name].points, `${name}: the point count moved`).toBe(golden[name].points)
      expect(captured[name].shots, `${name}: the rally synthesis produced a different shot count`).toBe(
        golden[name].shots,
      )
      expect(captured[name].aces, `${name}: the ace rate moved`).toEqual(golden[name].aces)
      expect(captured[name].doubleFaults, `${name}: the double-fault rate moved`).toEqual(golden[name].doubleFaults)
      expect(captured[name].winners, `${name}: the box score's winners moved`).toEqual(golden[name].winners)
      expect(captured[name].unforcedErrors, `${name}: the box score's errors moved`).toEqual(
        golden[name].unforcedErrors,
      )
      expect(captured[name].meanRallyLength, `${name}: the mean rally length moved`).toBe(golden[name].meanRallyLength)
      expect(captured[name].serveSpeedAvg, `${name}: the mean serve speed moved`).toEqual(golden[name].serveSpeedAvg)
      expect(captured[name].serveSpeedMax, `${name}: the fastest serve moved`).toEqual(golden[name].serveSpeedMax)
      expect(captured[name].durationSeconds, `${name}: the diegetic clock drifted`).toBe(golden[name].durationSeconds)
      // ⚠ `hard-second-server` IS PINNED AT "1:60", AND THAT IS A REAL DEFECT PRESERVED ON PURPOSE.
      // `formatDuration` ROUNDS the minutes after taking the hours by floor, so 7,179 s (1 h 59.65 m)
      // prints `1:60` instead of `2:00` – any duration in the last thirty seconds of an hour does.
      // It is a display bug in matchStats, not in the clock (`durationSeconds` above is exact), and
      // R2-06 is a pure move: fixing it here would change a shipped reading under cover of a
      // refactor and move this record for a reason that has nothing to do with the move. Recorded
      // so the next reader knows it is observed rather than overlooked.
      expect(captured[name].durationEstimate, `${name}: the box score's duration row moved`).toBe(
        golden[name].durationEstimate,
      )
      expect(captured[name].firstShots, `${name}: the first sixteen shots differ`).toEqual(golden[name].firstShots)
      expect(captured[name].everyTwentyFifthPoint, `${name}: the point stream diverged`).toEqual(
        golden[name].everyTwentyFifthPoint,
      )
      // ...and the hash is over EVERY point, EVERY shot and EVERY serve speed, unabridged.
      expect(captured[name].hash, `${name}: the full emitted sequence moved`).toBe(golden[name].hash)
    }
  })

  // ⚠ NOT VACUOUS. A record of four one-point walkovers would pass the test above and pin nothing;
  // these are the floors that make the four arms worth their runtime.
  it('...and the record is not vacuous: four real matches, with the branches they were chosen for', () => {
    const golden = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, ReturnType<typeof frozen>>
    expect(Object.keys(golden).sort()).toEqual(Object.keys(RECORDS).sort())
    for (const [name, arm] of Object.entries(golden)) {
      expect(arm.points, `${name}: a handful of points would pin nothing`).toBeGreaterThan(50)
      expect(arm.shots, `${name}: a match with no rallies pins no rally synthesis`).toBeGreaterThan(150)
      expect(arm.durationSeconds, `${name}: a zero-length match pins no clock`).toBeGreaterThan(1000)
      expect(arm.hash, `${name}: the hash is eight hex digits`).toMatch(/^[0-9a-f]{8}$/)
    }
    // ⚠ THE ACE BRANCH HAS TO BE LIVE SOMEWHERE, and it is thinner than it looks: `wta` aces are
    // 6% of server-won points before the speed factor, so the four arms hold 16 aces between them
    // (3 / 2 / 4 / 7 on 24.08) and no single arm holds many. The floor is therefore the CORPUS, not
    // one match – the ace rate is the one thing rally.ts derives FROM the serve speed, so both
    // moved symbols are unpinned if it never fires.
    const acesEverywhere = Object.values(golden).reduce((n, arm) => n + arm.aces[0] + arm.aces[1], 0)
    expect(acesEverywhere, 'not one ace across four recorded matches').toBeGreaterThan(10)
    for (const [name, arm] of Object.entries(golden)) {
      expect(arm.aces[0] + arm.aces[1], `${name}: no ace at all in this arm`).toBeGreaterThan(0)
    }
    expect(golden['clay-cannon'].serveSpeedMax[0], 'the cannon served like a child').toBeGreaterThan(150)
    // The retirement arm is a retirement, so the truncated-log path stays covered by the record.
    expect(golden['hard-second-server'].retired, 'the retirement arm plays itself out now').not.toBe('none')
    expect(Object.values(golden).filter((a) => a.retired === 'none').length, 'every arm retired').toBe(3)
    // The legacy arm is the LEGACY_SNAPSHOT_AGE path: no `age` on either player, yet real speeds.
    expect(golden['grass-legacy'].serveSpeedAvg[0], 'the ageless snapshot reported no serve').toBeGreaterThan(100)
    // Every arm records a box score with both sides scoring, so `winners`/`unforcedErrors` are live.
    for (const [name, arm] of Object.entries(golden)) {
      expect(arm.winners[0] + arm.winners[1], `${name}: nobody hit a winner`).toBeGreaterThan(5)
      expect(arm.unforcedErrors[0] + arm.unforcedErrors[1], `${name}: nobody missed`).toBeGreaterThan(5)
    }
  })
})
