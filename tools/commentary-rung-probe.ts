// COMMENTARY RUNG PROBE (round 21 item 3, the owner's SECOND ask) - «И ещё раз: проверь пожалуйста
// что с комментариями текстовой трансляции на 1000 и шлемах, кажется ничего не изменилось».
//
// Invariant 4: measured, not guessed. The question is not "is the commentary good" but the flat
// factual one he is actually asking: DOES ANY LINE DIFFER BY RUNG. So this runs the real
// `buildCommentary` over one corpus of matches, once per rung, and DIFFS the output.
//
// Three numbers per rung, and they are the ones the ledger carries:
//   * beats per match      - how much is said at all
//   * distinct phrasings   - the same beats with names and numbers masked out, uniqued across the
//                            whole corpus. This is the SAMENESS measure: two rungs can emit the same
//                            number of rows out of wildly different vocabularies, or out of one.
//   * rows differing       - against the J30 arm, row by row, same match, same seed. The number he
//                            is really asking for.
//
// Zero RNG of its own: every match is a seeded build and the builder draws nothing.
//
//   npx vite-node tools/commentary-rung-probe.ts

import { simulateMatch } from '../src/engine/match/engine'
import { annotateMatch } from '../src/engine/match/rally'
import { buildCommentary, type CommentaryEvent } from '../src/viz/commentary'
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
 *  way the draw sheet names it. `round` 0 is the opener; `rounds - 1` is the final. */
interface Arm {
  name: string
  tier: TierId | null
  round: number | null
}

const ARMS: Arm[] = [
  { name: 'no context (today)', tier: null, round: null },
  { name: 'National final (s1)', tier: 'national', round: 4 },
  { name: 'J30 first round (s2)', tier: 'j30', round: 0 },
  { name: 'J30 final (s2)', tier: 'j30', round: 4 },
  { name: 'W75 first round (s3)', tier: 'w75', round: 0 },
  { name: 'W75 final (s3)', tier: 'w75', round: 4 },
  { name: 'WTA 1000 R64 (s4)', tier: 'wta1000', round: 0 },
  { name: 'WTA 1000 final (s4)', tier: 'wta1000', round: 5 },
  { name: 'Slam R128 (s4)', tier: 'slam', round: 0 },
  { name: 'Slam final (s4)', tier: 'slam', round: 6 },
]

function eventOf(arm: Arm): CommentaryEvent | null {
  if (arm.tier === null || arm.round === null) return null
  return { tier: arm.tier, roundLabel: stageLabel(arm.round, TIERS[arm.tier].drawSize) }
}

interface Row {
  arm: string
  label: string
  beats: number
  perMatch: number
  shapes: number
  differs: number
  differsPct: number
}

const rows: Row[] = []
let baseline: string[][] | null = null

for (const arm of ARMS) {
  const event = eventOf(arm)
  const shapes = new Set<string>()
  const perMatch: string[][] = []
  let beats = 0
  for (const m of corpus) {
    const built = buildCommentary(m, A.name, B.name, event)
    beats += built.length
    const asText = built.map((b) => `${b.lead ?? '-'}|${b.text}`)
    perMatch.push(asText)
    for (const b of built) shapes.add(shape(b.lead, b.text))
  }
  // The J30 first round is the reference arm: it is the bottom of the ladder he is comparing against.
  if (arm.name === 'J30 first round (s2)') baseline = perMatch
  let differs = 0
  let total = 0
  if (baseline) {
    for (let i = 0; i < perMatch.length; i++) {
      const mine = perMatch[i]
      const theirs = baseline[i]
      const n = Math.max(mine.length, theirs.length)
      total += n
      for (let r = 0; r < n; r++) if (mine[r] !== theirs[r]) differs++
    }
  }
  rows.push({
    arm: arm.name,
    label: event ? `${event.roundLabel} at the ${TIERS[arm.tier as TierId].label}` : '-',
    beats,
    perMatch: beats / corpus.length,
    shapes: shapes.size,
    differs,
    differsPct: total === 0 ? 0 : (differs / total) * 100,
  })
}

const pad = (s: string, n: number) => s.padEnd(n)
const num = (x: number, n: number, d = 2) => x.toFixed(d).padStart(n)

console.log(`\nCOMMENTARY BY RUNG - ${corpus.length} seeded matches, same corpus in every arm\n`)
console.log(
  `${pad('arm', 22)}${pad('occasion', 34)}${pad('beats', 8)}${pad('/match', 8)}${pad('phrasings', 11)}${pad('rows != J30 R1', 16)}`,
)
console.log('-'.repeat(99))
for (const r of rows) {
  console.log(
    `${pad(r.arm, 22)}${pad(r.label, 34)}${String(r.beats).padStart(6)}  ${num(r.perMatch, 6)}  ${String(r.shapes).padStart(9)}  ${num(r.differsPct, 8, 1)}%`,
  )
}
// PER KIND, bottom of the ladder against the top - so "more varied" is a number per beat family
// rather than one aggregate that a single new sentence could move.
const KIND_ARMS: Arm[] = [
  { name: 'J30 first round (s2)', tier: 'j30', round: 0 },
  { name: 'Slam final (s4)', tier: 'slam', round: 6 },
]
const byKind = new Map<string, [number, number]>()
KIND_ARMS.forEach((arm, col) => {
  const event = eventOf(arm)
  const seen = new Map<string, Set<string>>()
  for (const m of corpus) {
    for (const b of buildCommentary(m, A.name, B.name, event)) {
      const set = seen.get(b.kind) ?? new Set<string>()
      set.add(shape(b.lead, b.text))
      seen.set(b.kind, set)
    }
  }
  for (const [k, v] of seen) {
    const row = byKind.get(k) ?? [0, 0]
    row[col] = v.size
    byKind.set(k, row)
  }
})
console.log(`\nDISTINCT PHRASINGS BY BEAT KIND (names and numbers masked)\n`)
console.log(`${pad('kind', 12)}${pad('J30 R1 (storey 2)', 20)}${pad('Slam final (storey 4)', 22)}`)
console.log('-'.repeat(54))
for (const [k, [lo, hi]] of [...byKind.entries()].sort()) {
  console.log(`${pad(k, 12)}${String(lo).padStart(12)}${String(hi).padStart(18)}`)
}

console.log(
  `\nDraws in play: J30 ${TIERS.j30.drawSize} (${Math.log2(TIERS.j30.drawSize)} rounds), ` +
    `WTA 1000 ${TIERS.wta1000.drawSize} (${Math.log2(TIERS.wta1000.drawSize)} rounds), ` +
    `Slam ${TIERS.slam.drawSize} (${Math.log2(TIERS.slam.drawSize)} rounds).`,
)
console.log(
  `Openers by the engine's own namer: J30 "${stageLabel(0, TIERS.j30.drawSize)}", ` +
    `WTA 1000 "${stageLabel(0, TIERS.wta1000.drawSize)}", Slam "${stageLabel(0, TIERS.slam.drawSize)}".\n`,
)
