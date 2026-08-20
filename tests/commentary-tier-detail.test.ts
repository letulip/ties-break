// ROUND 23 ITEM 4 – «Проверь ещё раз текстовые трансляции на 500+ сериях пожалуйста, добавилось ли
// там детализации.»
//
// ⚠⚠ HIS THIRD ASK ON ONE SUBJECT, AND THE HISTORY IS THE REASON THIS FILE IS SHAPED THE WAY IT IS.
// Round 21 item 3 (commit 8e38c0d) answered the same question for the 1000 and the Slam and shipped
// `tools/commentary-rung-probe.ts` as its instrument. That probe had a J30 arm, a W75 arm, a 1000 arm
// and a Slam arm – and NO 250 arm and NO 500 arm – so the rung he was standing on had never been
// measured, and it graded on DISTINCT PHRASINGS, which cannot tell a new sentence from a substituted
// one. Measured here first (120 seeded matches), that produced the report he filed:
//
//   arm             beats/m  sent/m   chars/m  phrasings     rows differing
//   J30 final         16.20   29.52     952.5        396     W75 -> 250   1087/1944 (55.9%)
//   W75 final         16.20   31.99    1065.3        528     250 -> 500      0/1944 ( 0.0%)  ⚠
//   WTA 250 final     16.20   31.40    1077.2        611     500 -> 1000   120/1944 ( 6.2%)
//   WTA 500 final     16.20   31.40    1077.2        611     500f -> Slamf   0/1944 ( 0.0%)  ⚠
//   Slam final        16.20   31.40    1077.2        611
//
// Two findings, and both are fixed by the code this file now guards. `storeyOf` put 250/500/1000/slam
// on ONE storey and the 250 and the 500 are both 32-draw, so a WTA 500 and a Grand Slam final
// narrated byte-identically – and the storey step it did have bought +1.1% characters, the same
// beats and 1.8% FEWER sentences, because the per-row budget makes an arriving stake clause DISPLACE
// a colour clause. He asked for детализация and what shipped was variety.
//
// ⭐ SO THE GRADING RULE THIS FILE ENFORCES: **beats/match and sentences/match, with a 500-vs-250 arm
// in the instrument.** Never phrasing counts against a junior arm. Four numbers per arm, over one
// corpus of seeded matches replayed identically in every arm:
//
//   beats/match     rows in the log. How much is SAID AT ALL – the number that answers him.
//   sentences/match the beats' text split on sentence ends. Detail inside the rows.
//   chars/match     the log's total length. The blunt one, and it catches substitution.
//   phrasings       distinct beat texts with names and numbers masked. VARIETY, and it is here to be
//                   read beside the other three rather than instead of them.
//
// Zero RNG of its own: every match is a seeded build and `buildCommentary` draws nothing (that is
// its own test, in tests/viz/commentary.test.ts).

import { describe, it, expect } from 'vitest'
import { buildCommentary, type CommentaryEvent } from '../src/viz/commentary'
import { rungOf, storeyOf } from '../src/viz/preview'
import { simulateMatch } from '../src/engine/match/engine'
import { annotateMatch } from '../src/engine/match/rally'
import { TIERS } from '../src/engine/season/calendar'
import { stageLabel } from '../src/engine/world/labels'
import type { AnnotatedMatch } from '../src/viz/types'
import type { MatchOptions, MatchPlayer, Surface } from '../src/engine/match/types'
import type { TierId } from '../src/engine/season/types'

// Two players of different shapes, so the corpus holds blowouts, three-setters and tiebreaks rather
// than one repeated match. Same pair as tests/viz/commentary.test.ts and the round-21 probe, so the
// numbers below are comparable with the ones those commits recorded.
const A: MatchPlayer = { id: 'kid', name: 'Bianca Tran', serve: 58, ret: 55, composure: 42, stamina: 61, groundstrokes: 56 }
const B: MatchPlayer = { id: 'opp', name: 'Dana Delgado', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58 }
const SURFACES: Surface[] = ['hard', 'clay', 'grass']
const N = 120

function play(seed: string, surface: Surface): AnnotatedMatch {
  const opts: MatchOptions = { surface, tour: 'wta', seed }
  return annotateMatch(simulateMatch(A, B, opts), A, B, opts)
}

const corpus: AnnotatedMatch[] = []
for (let i = 0; i < N; i++) corpus.push(play(`rung-${i}`, SURFACES[i % SURFACES.length]))

/** The row with everything match-specific masked out, so what is left is the PHRASING. */
function shape(lead: string | null, text: string): string {
  return `${lead ?? '-'}|${text}`
    .split(A.name)
    .join('{P}')
    .split(B.name)
    .join('{P}')
    .split('Bianca')
    .join('{P}')
    .split('Dana')
    .join('{P}')
    .replace(/\b\d+\b/g, '#')
}

interface Arm {
  name: string
  tier: TierId
  /** 0 = the opener; the final is `log2(drawSize) - 1`. */
  round: number
}

/** Named by the engine's own `stageLabel`, so a 64 draw reads the way its draw sheet reads. */
function eventOf(arm: Arm): CommentaryEvent {
  return { tier: arm.tier, roundLabel: stageLabel(arm.round, TIERS[arm.tier].drawSize) }
}

const finalRound = (t: TierId) => Math.log2(TIERS[t].drawSize) - 1

/** ⭐ THE 250 AND THE 500 ARE BOTH ARMS, AND THEY ARE ADJACENT. That is the whole correction to the
 *  round-21 instrument: the flat step was inside the gap it never sampled. */
const LADDER: { label: string; tier: TierId }[] = [
  { label: 'J30', tier: 'j30' },
  { label: 'W75', tier: 'w75' },
  { label: 'WTA 250', tier: 'wta250' },
  { label: 'WTA 500', tier: 'wta500' },
  { label: 'WTA 1000', tier: 'wta1000' },
  { label: 'Slam', tier: 'slam' },
]

const ARMS: Arm[] = LADDER.flatMap((r): Arm[] => [
  { name: `${r.label} opener`, tier: r.tier, round: 0 },
  { name: `${r.label} final`, tier: r.tier, round: finalRound(r.tier) },
])

interface Measured {
  arm: string
  rung: number
  storey: number
  draw: number
  label: string
  beats: number
  sentences: number
  chars: number
  phrasings: number
  /** every point index that produced a row, per match – the monotonicity check below reads these */
  spokeAt: Set<number>[]
  /** the log of each match, row by row, for the row-level diffs below */
  rows: string[][]
  /** beats per SET, worst match in the corpus – the volume ceiling */
  worstPerSet: number
}

function measure(arm: Arm): Measured {
  const event = eventOf(arm)
  const phrasings = new Set<string>()
  const rows: string[][] = []
  const spokeAt: Set<number>[] = []
  let beats = 0
  let sentences = 0
  let chars = 0
  let worstPerSet = 0
  for (const m of corpus) {
    const built = buildCommentary(m, A.name, B.name, event)
    beats += built.length
    rows.push(built.map((b) => `${b.lead ?? '-'}|${b.text}`))
    spokeAt.push(new Set(built.map((b) => b.pointIndex)))
    worstPerSet = Math.max(worstPerSet, built.length / m.result.sets.length)
    for (const b of built) {
      phrasings.add(shape(b.lead, b.text))
      chars += b.text.length
      sentences += (b.text.match(/[.!?](\s|$)/g) ?? []).length
    }
  }
  return {
    arm: arm.name,
    rung: rungOf(arm.tier),
    storey: storeyOf(arm.tier),
    draw: TIERS[arm.tier].drawSize,
    label: event.roundLabel,
    beats,
    sentences,
    chars,
    phrasings: phrasings.size,
    spokeAt,
    rows,
    worstPerSet,
  }
}

/** Rows that differ, same match, same row index. A row one arm has and the other does not counts. */
function rowsDiffering(x: Measured, y: Measured): { differing: number; total: number } {
  let differing = 0
  let total = 0
  for (let i = 0; i < x.rows.length; i++) {
    const n = Math.max(x.rows[i].length, y.rows[i].length)
    total += n
    for (let r = 0; r < n; r++) if (x.rows[i][r] !== y.rows[i][r]) differing++
  }
  return { differing, total }
}

const measured = new Map<string, Measured>()
for (const arm of ARMS) measured.set(arm.name, measure(arm))
const at = (name: string): Measured => measured.get(name)!

/** The pairs the ladder is graded on: each rung against the one below it, at the same end of the
 *  draw. ⚠ AGAINST THE RUNG BELOW, NEVER AGAINST A JUNIOR BASELINE - the round-21 probe diffed
 *  everything against one J30 arm, which is how "56% of rows differ" read as success while the two
 *  rungs he was actually climbing between were byte-identical. */
const STEPS: [string, string][] = ['opener', 'final'].flatMap((where) =>
  LADDER.slice(1).map((r, i): [string, string] => [`${LADDER[i].label} ${where}`, `${r.label} ${where}`]),
)

describe('round 23 #4 – detail in the running commentary at the 500 and above', () => {
  it('prints the table (the measurement, not an assertion)', () => {
    const pad = (s: string, n: number) => s.padEnd(n)
    const num = (x: number, d = 2) => x.toFixed(d).padStart(8)
    const lines: string[] = []
    lines.push(`\nCOMMENTARY DETAIL BY RUNG – ${N} seeded matches, the same corpus in every arm\n`)
    lines.push(
      `${pad('arm', 18)}${pad('rung', 6)}${pad('draw', 6)}${pad('round', 16)}${pad('beats/m', 9)}${pad('sent/m', 9)}${pad('chars/m', 10)}${pad('phrasings', 10)}`,
    )
    lines.push('-'.repeat(88))
    for (const arm of ARMS) {
      const m = at(arm.name)
      lines.push(
        `${pad(m.arm, 18)}${String(m.rung).padStart(3)}   ${String(m.draw).padStart(4)}  ${pad(m.label, 16)}${num(m.beats / N)} ${num(m.sentences / N)} ${num(m.chars / N, 1)} ${String(m.phrasings).padStart(9)}`,
      )
    }
    lines.push(`\nROWS DIFFERING FROM THE RUNG BELOW, same match, same row index\n`)
    for (const [lo, hi] of STEPS) {
      const d = rowsDiffering(at(lo), at(hi))
      lines.push(
        `  ${pad(`${lo} -> ${hi}`, 40)}${String(d.differing).padStart(6)} / ${d.total}  (${((d.differing / d.total) * 100).toFixed(1)}%)`,
      )
    }
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'))
    expect(measured.size).toBe(ARMS.length)
  })

  // ---------------------------------------------------------------------------------------------
  // ⭐ THE TEST HE ASKED FOR BY NAME: it reddens if a 250 and a 500 ever narrate identically again.
  // ---------------------------------------------------------------------------------------------
  it('a WTA 500 does NOT narrate like a WTA 250 – the flat floor is gone and stays gone', () => {
    // The two facts that made them identical are both still true, and that is the point: the fix is
    // not that the draws or the storeys changed, it is that neither of them is the only input any
    // more. `rungOf` separates them (viz/preview.ts) and `BARS` reads it (viz/commentary.ts).
    expect(storeyOf('wta250'), 'both are still storey 4').toBe(storeyOf('wta500'))
    expect(TIERS.wta250.drawSize, 'both are still 32-draw').toBe(TIERS.wta500.drawSize)
    expect(rungOf('wta500'), 'and the rung is what tells them apart').toBeGreaterThan(rungOf('wta250'))

    for (const where of ['opener', 'final'] as const) {
      const d = rowsDiffering(at(`WTA 250 ${where}`), at(`WTA 500 ${where}`))
      expect(d.differing, `a WTA 500 ${where} still narrates like a 250`).toBeGreaterThan(0)
      // ...and not by one row in a corner: it is a third of the log or better.
      expect(d.differing / d.total).toBeGreaterThan(0.3)
    }
    // The other byte-identical pair from the report: a 500 final and a Grand Slam final.
    expect(rowsDiffering(at('WTA 500 final'), at('Slam final')).differing).toBeGreaterThan(0)
    expect(rowsDiffering(at('WTA 500 final'), at('WTA 1000 final')).differing).toBeGreaterThan(0)
  })

  // ---------------------------------------------------------------------------------------------
  // ⭐ AND THE GRADING RULE ITSELF, WHICH IS WHAT STOPS A FOURTH ATTEMPT MISSING THE SAME WAY.
  // ---------------------------------------------------------------------------------------------
  it('every step of the ladder says MORE THINGS – beats/match and sentences/match both climb', () => {
    for (const [lo, hi] of STEPS) {
      const a = at(lo)
      const b = at(hi)
      // ⚠ THE J30 -> W75 STEP IS THE ONE EXEMPTION, AND IT IS HONEST: storey 3's gain is genuinely
      // vocabulary plus the numbers in the stake clause, and no bar moves there. Every step ABOVE it
      // has to move rows, because that is the thing the owner has now asked for three times.
      if (lo.startsWith('J30')) {
        expect(b.beats, `${lo} -> ${hi} lost rows`).toBeGreaterThanOrEqual(a.beats)
        continue
      }
      expect(b.beats / N - a.beats / N, `${lo} -> ${hi} gained no BEATS`).toBeGreaterThan(0)
      expect(b.sentences / N - a.sentences / N, `${lo} -> ${hi} gained no SENTENCES`).toBeGreaterThan(0)
      expect(b.chars, `${lo} -> ${hi} got shorter`).toBeGreaterThan(a.chars)
    }
    // End to end, professional tour against the rung below it, so the gain is a size and not a sign.
    const w75 = at('W75 final')
    const slam = at('Slam final')
    expect(slam.beats / w75.beats, `a Slam says ${(slam.beats / w75.beats).toFixed(2)}x the rows`).toBeGreaterThan(1.2)
    expect(slam.sentences / w75.sentences).toBeGreaterThan(1.15)
  })

  it('...and it is ADDITION, not substitution: no rung ever goes silent where a junior spoke', () => {
    // The property that replaces round 21's "the occasion does not change the cut". Every bar in
    // `BARS` only comes DOWN as the rung goes up, so every candidate a junior rung had is still a
    // candidate above it. A higher rung may swap WHICH beat wins a point (a long game outranks the
    // rally inside it – see PRIORITY) and may never leave the point empty.
    for (const [lo, hi] of STEPS) {
      const a = at(lo)
      const b = at(hi)
      for (let i = 0; i < a.spokeAt.length; i++) {
        for (const p of a.spokeAt[i]) {
          expect(b.spokeAt[i].has(p), `${hi} lost the row ${lo} has at point ${p} of match ${i}`).toBe(true)
        }
      }
    }
  })

  it('the top of the ladder is richer, not chattier – the volume band still holds', () => {
    // The whole feature dies if it becomes a point log (viz/commentary.ts, VOLUME CAPS). The junior
    // band is ~4-6 beats a set and is pinned in tests/viz/commentary.test.ts; this is the ceiling on
    // what the round-23 bars may spend on top of it.
    const slam = at('Slam final')
    const perSet = slam.beats / N / (corpus.reduce((s, m) => s + m.result.sets.length, 0) / N)
    expect(perSet, `a Slam runs at ${perSet.toFixed(2)} beats/set`).toBeLessThan(10)
    expect(slam.worstPerSet, `worst set in the corpus = ${slam.worstPerSet.toFixed(2)} beats`).toBeLessThanOrEqual(18)
  })

  it('the long game is a NEW fact and it only speaks on the professional rungs', () => {
    // `deuce` is the one beat kind round 23 added, and it is the answer to "детализация" that no
    // amount of rewording could have been: a game that went to six deuces is invisible in the score
    // column and in every other beat this file emits.
    const deucesAt = (arm: string): number => {
      const m = ARMS.find((x) => x.name === arm)!
      let n = 0
      for (const match of corpus) {
        for (const b of buildCommentary(match, A.name, B.name, eventOf(m))) if (b.kind === 'deuce') n++
      }
      return n
    }
    expect(deucesAt('J30 final'), 'a junior draw has no long-game beat').toBe(0)
    expect(deucesAt('W75 final'), 'nor does the W tour').toBe(0)
    expect(deucesAt('WTA 250 final'), 'it arrives at the 250').toBeGreaterThan(0)
    expect(deucesAt('Slam final'), 'and it speaks more often at a major').toBeGreaterThan(deucesAt('WTA 250 final'))
  })
})
