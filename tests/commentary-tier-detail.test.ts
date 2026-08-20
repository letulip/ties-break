// ROUND 23 ITEM 4 – «Проверь ещё раз текстовые трансляции на 500+ сериях пожалуйста, добавилось ли
// там детализации.»
//
// A RE-CHECK. Round 21 item 3 (commit 8e38c0d, "the running commentary knows which rung she is
// playing on") answered the same owner ask for the 1000 and the Slam, and `tools/commentary-rung-
// probe.ts` is the instrument it shipped. That probe has NO WTA 500 arm and no WTA 250 arm, so the
// one rung he is asking about now has never actually been measured. This file measures it, and it
// lives in `tests/` rather than `tools/` because the finding below is a fact about the ladder that
// should go red if anybody changes it by accident.
//
// ⚠ WHAT IS MEASURED, and "it reads richer" is not on the list. Four numbers per arm, over one
// corpus of seeded matches replayed identically in every arm:
//
//   beats/match     rows in the log. How much is SAID AT ALL.
//   sentences/match the beats' text split on sentence ends. Detail beats, not rows.
//   chars/match     the log's total length. The blunt one, and it catches substitution.
//   phrasings       distinct beat texts with names and numbers masked, uniqued over the corpus.
//                   This is the VARIETY measure – two rungs can emit the same rows out of one
//                   vocabulary or out of three.
//
// Zero RNG of its own: every match is a seeded build and `buildCommentary` draws nothing (that is
// its own test, in tests/viz/commentary.test.ts).

import { describe, it, expect } from 'vitest'
import { buildCommentary, type CommentaryEvent } from '../src/viz/commentary'
import { storeyOf } from '../src/viz/preview'
import { simulateMatch } from '../src/engine/match/engine'
import { annotateMatch } from '../src/engine/match/rally'
import { TIERS } from '../src/engine/season/calendar'
import { stageLabel } from '../src/engine/world/labels'
import type { AnnotatedMatch } from '../src/viz/types'
import type { MatchOptions, MatchPlayer, Surface } from '../src/engine/match/types'
import type { TierId } from '../src/engine/season/types'

// Two players of different shapes, so the corpus holds blowouts, three-setters and tiebreaks rather
// than one repeated match. Same pair as tests/viz/commentary.test.ts and the round-21 probe, so the
// numbers below are comparable with the ones that commit recorded.
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

const ARMS: Arm[] = [
  { name: 'J30 opener', tier: 'j30', round: 0 },
  { name: 'J30 final', tier: 'j30', round: finalRound('j30') },
  { name: 'W75 opener', tier: 'w75', round: 0 },
  { name: 'W75 final', tier: 'w75', round: finalRound('w75') },
  { name: 'WTA 250 opener', tier: 'wta250', round: 0 },
  { name: 'WTA 250 final', tier: 'wta250', round: finalRound('wta250') },
  { name: 'WTA 500 opener', tier: 'wta500', round: 0 },
  { name: 'WTA 500 final', tier: 'wta500', round: finalRound('wta500') },
  { name: 'WTA 1000 opener', tier: 'wta1000', round: 0 },
  { name: 'WTA 1000 final', tier: 'wta1000', round: finalRound('wta1000') },
  { name: 'Slam opener', tier: 'slam', round: 0 },
  { name: 'Slam final', tier: 'slam', round: finalRound('slam') },
]

interface Measured {
  arm: string
  storey: number
  draw: number
  label: string
  beats: number
  sentences: number
  chars: number
  phrasings: number
  /** the log of each match, row by row, for the row-level diffs below */
  rows: string[][]
}

function measure(arm: Arm): Measured {
  const event = eventOf(arm)
  const phrasings = new Set<string>()
  const rows: string[][] = []
  let beats = 0
  let sentences = 0
  let chars = 0
  for (const m of corpus) {
    const built = buildCommentary(m, A.name, B.name, event)
    beats += built.length
    rows.push(built.map((b) => `${b.lead ?? '-'}|${b.text}`))
    for (const b of built) {
      phrasings.add(shape(b.lead, b.text))
      chars += b.text.length
      sentences += (b.text.match(/[.!?](\s|$)/g) ?? []).length
    }
  }
  return {
    arm: arm.name,
    storey: storeyOf(arm.tier),
    draw: TIERS[arm.tier].drawSize,
    label: event.roundLabel,
    beats,
    sentences,
    chars,
    phrasings: phrasings.size,
    rows,
  }
}

/** Rows that differ, same match, same row index, between two arms. */
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

describe('round 23 #4 – detail in the running commentary at the 500 and above', () => {
  it('prints the table (the measurement, not an assertion)', () => {
    const pad = (s: string, n: number) => s.padEnd(n)
    const num = (x: number, d = 2) => x.toFixed(d).padStart(8)
    const lines: string[] = []
    lines.push(`\nCOMMENTARY DETAIL BY RUNG – ${N} seeded matches, the same corpus in every arm\n`)
    lines.push(
      `${pad('arm', 18)}${pad('storey', 8)}${pad('draw', 6)}${pad('round', 22)}${pad('beats/m', 9)}${pad('sent/m', 9)}${pad('chars/m', 9)}${pad('phrasings', 10)}`,
    )
    lines.push('-'.repeat(91))
    for (const arm of ARMS) {
      const m = at(arm.name)
      lines.push(
        `${pad(m.arm, 18)}${String(m.storey).padStart(4)}    ${String(m.draw).padStart(4)}  ${pad(m.label, 22)}${num(m.beats / N)} ${num(m.sentences / N)} ${num(m.chars / N, 1)} ${String(m.phrasings).padStart(9)}`,
      )
    }
    const pairs: [string, string][] = [
      ['J30 opener', 'W75 opener'],
      ['W75 opener', 'WTA 250 opener'],
      ['WTA 250 opener', 'WTA 500 opener'],
      ['WTA 500 opener', 'WTA 1000 opener'],
      ['WTA 500 final', 'Slam final'],
      ['J30 final', 'WTA 500 final'],
    ]
    lines.push(`\nROWS DIFFERING, same match, same row index\n`)
    for (const [x, y] of pairs) {
      const d = rowsDiffering(at(x), at(y))
      lines.push(`  ${pad(`${x} -> ${y}`, 40)}${String(d.differing).padStart(6)} / ${d.total}  (${((d.differing / d.total) * 100).toFixed(1)}%)`)
    }
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'))
    expect(measured.size).toBe(ARMS.length)
  })

  // ---------------------------------------------------------------------------------------------
  // THE FINDING. Everything above the W125 is ONE storey, and inside it the tier is not read at all.
  // ---------------------------------------------------------------------------------------------
  it('a WTA 500 and a WTA 250 narrate BYTE-IDENTICALLY – the top of the ladder is flat', () => {
    // `storeyOf` puts wta250/wta500/wta1000/slam all on storey 4, and `wta250.drawSize` and
    // `wta500.drawSize` are both 32 – so `stageLabel` names the same round and every phrase pool
    // resolves to the same array. There is no third input. This is not a bug in an implementation;
    // it is the ladder having no rung where he is standing.
    expect(storeyOf('wta250')).toBe(storeyOf('wta500'))
    expect(TIERS.wta250.drawSize).toBe(TIERS.wta500.drawSize)
    expect(rowsDiffering(at('WTA 250 opener'), at('WTA 500 opener')).differing).toBe(0)
    expect(rowsDiffering(at('WTA 250 final'), at('WTA 500 final')).differing).toBe(0)
    expect(at('WTA 500 opener').phrasings).toBe(at('WTA 250 opener').phrasings)
  })

  it('the storey-4 gain over the junior tour is real, and it is VARIETY rather than volume', () => {
    const j30 = at('J30 final')
    const w500 = at('WTA 500 final')
    // Variety climbs: the pools gain entries at storey 3 and again at storey 4.
    expect(w500.phrasings).toBeGreaterThan(j30.phrasings)
    // Volume does not follow it. The log is the same NUMBER of rows – the beats are chosen by the
    // match, not by the rung – and the per-row budget (`clausesUpTo`, 120 chars) means an arriving
    // clause can displace a colour clause instead of adding to it.
    expect(w500.beats).toBe(j30.beats)
  })

  it('a 1000 and a Slam differ from the 500 by ONE row per match, and it is the round\'s NAME', () => {
    // Both are storey 4, so the only lever left is `drawSize` reaching `stageLabel`: a 64 draw opens
    // at the "Round of 64" and a 32 draw at the "Round of 32". That is one row – the `open` beat –
    // and it names the draw rather than saying anything more about the tennis.
    const openers = rowsDiffering(at('WTA 500 opener'), at('WTA 1000 opener'))
    expect(openers.differing).toBe(N)
    // ...and where the round labels coincide, even that goes: a WTA 500 final and a Grand Slam final
    // are byte-identical logs.
    expect(rowsDiffering(at('WTA 500 final'), at('Slam final')).differing).toBe(0)
    expect(rowsDiffering(at('WTA 500 final'), at('WTA 1000 final')).differing).toBe(0)
  })

  // ---------------------------------------------------------------------------------------------
  // ⚠ THE REASON THE OWNER CANNOT SEE THE ROUND-21 FIX. The step onto storey 4 REWORDS most of the
  // log and adds almost nothing to it – the row budget (`clausesUpTo`, 120 chars) means an arriving
  // stake or room clause pushes a colour clause out instead of joining it. Variety went up;
  // "детализация" did not.
  // ---------------------------------------------------------------------------------------------
  it('the storey step swaps WORDS, it does not add DETAIL – measured both ways', () => {
    const w75 = at('W75 final')
    const w500 = at('WTA 500 final')
    // Most rows are textually different...
    const d = rowsDiffering(w75, w500)
    expect(d.differing / d.total).toBeGreaterThan(0.5)
    // ...and yet the log is the same length in rows, within 2% in characters, and it says FEWER
    // sentences than the rung below it. Nothing about the tennis is being reported that was not
    // being reported at the W75.
    expect(w500.beats).toBe(w75.beats)
    expect(Math.abs(w500.chars - w75.chars) / w75.chars).toBeLessThan(0.02)
    expect(w500.sentences).toBeLessThan(w75.sentences)
  })
})
