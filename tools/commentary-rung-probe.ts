// COMMENTARY RUNG PROBE - does the running commentary get RICHER as she climbs, and by how much.
//
// ---------------------------------------------------------------------------------------------
// ⚠⚠ THIS INSTRUMENT WAS BUILT TO FIND A FLAT FLOOR AND THEN COULD NOT SEE ONE. READ THIS FIRST.
// ---------------------------------------------------------------------------------------------
// Round 21 item 3 shipped this probe with FOUR arms - J30, W75, WTA 1000, Slam - and graded the fix
// on DISTINCT PHRASINGS. Both halves of that were wrong, and round 23 item 4 is the owner asking the
// same question a third time because of it:
//
//   1. NO 250 ARM AND NO 500 ARM. `storeyOf` puts wta250/wta500/wta1000/slam on one storey and the
//      250 and the 500 are both 32-draw, so those two rungs narrated BYTE-IDENTICALLY - and a probe
//      that only ever compares the top of the ladder against the bottom cannot see it. The rung he
//      was actually standing on had never been measured. **Every rung is an arm now, and the diff is
//      taken against the rung BELOW rather than against a junior baseline.**
//   2. PHRASINGS ARE BLIND TO SUBSTITUTION. Storey 4 rewords 56% of the rows against a W75 for the
//      same beats and 1.8% FEWER sentences: the per-row budget means an arriving stake clause
//      DISPLACES a colour clause. Phrasings went 396 -> 611 and the log said less. **Beats/match and
//      sentences/match are the first two columns now; phrasings is last and is labelled as variety.**
//
// ⭐ SO THE GRADING RULE, and it is the whole reason this file is shaped the way it is: a rung is
// richer than the rung below it when it says MORE THINGS - beats/match and sentences/match - not
// when it says the same things differently. Anything that moves phrasings without moving those two
// is a rewording, and the owner has now asked for detail three times.
//
// Zero RNG of its own: every match is a seeded build and the builder draws nothing.
//
//   npx vite-node tools/commentary-rung-probe.ts

import { simulateMatch } from '../src/engine/match/engine'
import { annotateMatch } from '../src/engine/match/rally'
import { buildCommentary, type BeatKind, type CommentaryEvent } from '../src/viz/commentary'
import { rungOf, storeyOf } from '../src/viz/preview'
import { TIERS } from '../src/engine/season/calendar'
import { stageLabel } from '../src/engine/world/labels'
import type { AnnotatedMatch } from '../src/viz/types'
import type { MatchOptions, MatchPlayer, Surface } from '../src/engine/match/types'
import type { TierId } from '../src/engine/season/types'

const A: MatchPlayer = { id: 'kid', name: 'Bianca Tran', serve: 58, ret: 55, composure: 42, stamina: 61, groundstrokes: 56 }
const B: MatchPlayer = { id: 'opp', name: 'Dana Delgado', serve: 60, ret: 57, composure: 55, stamina: 60, groundstrokes: 58 }
const SURFACES: Surface[] = ['hard', 'clay', 'grass']
const N = 200

function play(seed: string, surface: Surface): AnnotatedMatch {
  const opts: MatchOptions = { surface, tour: 'wta', seed }
  return annotateMatch(simulateMatch(A, B, opts), A, B, opts)
}

const corpus: AnnotatedMatch[] = []
for (let i = 0; i < N; i++) corpus.push(play(`rung-${i}`, SURFACES[i % SURFACES.length]))

/** The row with everything match-specific masked out, so what is left is the PHRASING. */
function shape(lead: string | null, text: string): string {
  return `${lead ?? '-'}|${text}`
    .split(A.name).join('{P}')
    .split(B.name).join('{P}')
    .split('Bianca').join('{P}')
    .split('Dana').join('{P}')
    .replace(/\b\d+\b/g, '#')
}

/** The arms: a rung and the round inside it, using the engine's OWN namer so a 128 draw is named the
 *  way the draw sheet names it. `round` 0 is the opener; the final is `log2(drawSize) - 1`. */
interface Arm {
  name: string
  tier: TierId | null
  /** 'open' = round 0, 'final' = the last round; null on the no-context arm. */
  where: 'open' | 'final' | null
}

const finalRound = (t: TierId) => Math.log2(TIERS[t].drawSize) - 1

// ⚠ EVERY RUNG, BOTH ENDS. The 250 and the 500 are the two that were missing, and they are the two
// the owner is standing between - but the fix is the RULE, not the two names: a ladder is measured
// rung by rung or the flat step is always in the gap nobody sampled.
const LADDER: { label: string; tier: TierId }[] = [
  { label: 'National', tier: 'national' },
  { label: 'J30', tier: 'j30' },
  { label: 'W75', tier: 'w75' },
  { label: 'WTA 250', tier: 'wta250' },
  { label: 'WTA 500', tier: 'wta500' },
  { label: 'WTA 1000', tier: 'wta1000' },
  { label: 'Slam', tier: 'slam' },
]

const ARMS: Arm[] = [
  { name: 'no context', tier: null, where: null },
  ...LADDER.flatMap((r): Arm[] => [
    { name: `${r.label} opener`, tier: r.tier, where: 'open' },
    { name: `${r.label} final`, tier: r.tier, where: 'final' },
  ]),
]

function eventOf(arm: Arm): CommentaryEvent | null {
  if (arm.tier === null || arm.where === null) return null
  const round = arm.where === 'open' ? 0 : finalRound(arm.tier)
  return { tier: arm.tier, roundLabel: stageLabel(round, TIERS[arm.tier].drawSize) }
}

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
  /** beats of each kind, over the whole corpus - so ADDITION and SUBSTITUTION can be told apart */
  byKind: Map<BeatKind, number>
  /** rows within 8 characters of the 120-char budget: the ones a clause was probably cut from */
  nearCap: number
  /** the log of each match, row by row, for the row-level diffs below */
  rows: string[][]
}

function measure(arm: Arm): Measured {
  const event = eventOf(arm)
  const phrasings = new Set<string>()
  const byKind = new Map<BeatKind, number>()
  const rows: string[][] = []
  let beats = 0
  let sentences = 0
  let chars = 0
  let nearCap = 0
  for (const m of corpus) {
    const built = buildCommentary(m, A.name, B.name, event)
    beats += built.length
    rows.push(built.map((b) => `${b.lead ?? '-'}|${b.text}`))
    for (const b of built) {
      phrasings.add(shape(b.lead, b.text))
      chars += b.text.length
      sentences += (b.text.match(/[.!?](\s|$)/g) ?? []).length
      if (b.text.length >= 112) nearCap++
      byKind.set(b.kind, (byKind.get(b.kind) ?? 0) + 1)
    }
  }
  return {
    arm: arm.name,
    rung: arm.tier ? rungOf(arm.tier) : 0,
    storey: arm.tier ? storeyOf(arm.tier) : 1,
    draw: arm.tier ? TIERS[arm.tier].drawSize : 0,
    label: event ? event.roundLabel : '-',
    beats,
    sentences,
    chars,
    phrasings: phrasings.size,
    byKind,
    nearCap,
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

const measured = ARMS.map(measure)
const at = (name: string): Measured => measured.find((m) => m.arm === name)!

const pad = (s: string, n: number) => s.padEnd(n)
const num = (x: number, n: number, d = 2) => x.toFixed(d).padStart(n)
const signed = (x: number, d = 2) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`.padStart(7)

// -------------------------------------------------------------------------------------------------
// 1. THE LADDER, and the two columns that decide it. `d beats` and `d sent` are against the arm two
//    rows up - the SAME round one rung lower - so a flat step prints as +0.00 and cannot hide.
// -------------------------------------------------------------------------------------------------
console.log(`\nCOMMENTARY BY RUNG - ${N} seeded matches, the same corpus in every arm`)
console.log(`⭐ GRADE ON beats/m AND sent/m. Phrasings is VARIETY and is blind to substitution.\n`)
console.log(
  `${pad('arm', 17)}${pad('rung', 6)}${pad('draw', 6)}${pad('round', 15)}` +
    `${pad('beats/m', 9)}${pad('d beats', 9)}${pad('sent/m', 9)}${pad('d sent', 9)}${pad('chars/m', 10)}${pad('nearCap', 9)}${pad('phrasings', 10)}`,
)
console.log('-'.repeat(109))
for (let i = 0; i < measured.length; i++) {
  const m = measured[i]
  // The arm one rung below at the SAME end of the draw: two rows up once the ladder starts.
  const below = i >= 3 ? measured[i - 2] : null
  const dBeats = below ? (m.beats - below.beats) / N : 0
  const dSent = below ? (m.sentences - below.sentences) / N : 0
  console.log(
    `${pad(m.arm, 17)}${String(m.rung).padStart(3)}   ${String(m.draw).padStart(4)}  ${pad(m.label, 15)}` +
      `${num(m.beats / N, 7)}  ${below ? signed(dBeats) : pad('-', 7)}  ${num(m.sentences / N, 7)}  ${below ? signed(dSent) : pad('-', 7)}  ` +
      `${num(m.chars / N, 8, 1)}  ${String(m.nearCap).padStart(6)}  ${String(m.phrasings).padStart(8)}`,
  )
}

// -------------------------------------------------------------------------------------------------
// 2. ROWS DIFFERING, RUNG AGAINST THE RUNG BELOW. The round-21 probe diffed everything against one
//    J30 arm, which is why "56% of rows differ" read as success while the two adjacent rungs he was
//    climbing between were identical. Adjacent pairs are the only diff that answers his question.
// -------------------------------------------------------------------------------------------------
console.log(`\nROWS DIFFERING FROM THE RUNG BELOW, same match, same row index\n`)
for (const where of ['opener', 'final'] as const) {
  for (let i = 1; i < LADDER.length; i++) {
    const lo = at(`${LADDER[i - 1].label} ${where}`)
    const hi = at(`${LADDER[i].label} ${where}`)
    const d = rowsDiffering(lo, hi)
    const flag = d.differing === 0 ? '   ⚠ FLAT' : ''
    console.log(
      `  ${pad(`${lo.arm} -> ${hi.arm}`, 40)}${String(d.differing).padStart(6)} / ${d.total}  (${((d.differing / d.total) * 100).toFixed(1)}%)${flag}`,
    )
  }
}

// -------------------------------------------------------------------------------------------------
// 3. BEATS BY KIND. The column that tells ADDITION from SUBSTITUTION: a rung that gained variety and
//    lost a beat family shows it here and nowhere else.
// -------------------------------------------------------------------------------------------------
const KINDS: BeatKind[] = ['open', 'break', 'hold', 'deuce', 'tiebreak', 'streak', 'rally', 'games', 'set', 'match']
const COLS = LADDER.map((r) => at(`${r.label} final`))
console.log(`\nBEATS PER MATCH BY KIND (finals)\n`)
console.log(`${pad('kind', 10)}${COLS.map((c) => pad(c.arm.replace(' final', ''), 11)).join('')}`)
console.log('-'.repeat(10 + COLS.length * 11))
for (const k of KINDS) {
  const cells = COLS.map((c) => num((c.byKind.get(k) ?? 0) / N, 9).padEnd(11))
  console.log(`${pad(k, 10)}${cells.join('')}`)
}
console.log(`${pad('TOTAL', 10)}${COLS.map((c) => num(c.beats / N, 9).padEnd(11)).join('')}`)

console.log(
  `\nDraws in play: ${LADDER.map((r) => `${r.label} ${TIERS[r.tier].drawSize}`).join(', ')}.`,
)
console.log(
  `⚠ The 250 and the 500 are both ${TIERS.wta250.drawSize}-draw, so the round LABEL cannot separate them - ` +
    `only the rung can.\n`,
)
