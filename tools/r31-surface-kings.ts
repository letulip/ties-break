/** r31 #6 – does the world have surface specialists («король грунта»)? MEASUREMENT ONLY. */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { ratingOf } from '../src/engine/match/rating'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { kidMatchPlayerFor } from '../src/engine/world/player'
import { ECONOMY } from '../src/engine/economy'
// ⚠ ROUND 34 (QA-34): imported from the module that DECLARES it. `shared/protocol/competition`
// only imports `Surface` for its own field types and never re-exports it, so this line read
// `declares locally, but it is not exported` – repaired by importing the owner rather than by
// widening the protocol module's public surface.
import type { Surface } from '../src/engine/match/types'

const argv = process.argv.slice(2)
const world = (await decodeExportFile(
  new Uint8Array(readFileSync(argv[argv.indexOf('--save') + 1])),
)) as WorldState

const SURFACES: Surface[] = ['hard', 'clay', 'grass']
const TOUR = 'wta' as const

type Row = { name: string; hard: number; clay: number; grass: number; spread: number; best: string }
const rows: Row[] = []
for (const p of world.cohort) {
  const r = SURFACES.map((s) => ratingOf(rivalMatchPlayer(p, s, ECONOMY.condition.max), s, TOUR))
  const spread = Math.max(...r) - Math.min(...r)
  rows.push({
    name: p.name,
    hard: r[0], clay: r[1], grass: r[2],
    spread,
    best: SURFACES[r.indexOf(Math.max(...r))],
  })
}

const kidR = SURFACES.map((s) => ratingOf(kidMatchPlayerFor(world, s, false), s, TOUR))
console.log(`\nHER: hard ${kidR[0]}  clay ${kidR[1]}  grass ${kidR[2]}   spread ${Math.max(...kidR) - Math.min(...kidR)}`)

rows.sort((a, b) => b.spread - a.spread)
console.log(`\ncohort of ${rows.length}. THE BEST CANDIDATE "KING" OF EACH SURFACE\n`)
console.log(['best', 'name', 'hard', 'clay', 'grass', 'edge over her 2nd surface'].join('\t'))
for (const surf of SURFACES) {
  for (const r of rows.filter((x) => x.best === surf).slice(0, 3)) {
    const v = [r.hard, r.clay, r.grass].sort((a, b) => b - a)
    console.log([surf, r.name, r.hard, r.clay, r.grass, v[0] - v[1]].join('\t'))
  }
}
const sp = rows.map((r) => r.spread)
const mean = sp.reduce((a, b) => a + b, 0) / sp.length
console.log(`\nsurface spread across the cohort: min ${Math.min(...sp)}  mean ${Math.round(mean)}  max ${Math.max(...sp)}`)
const counts = new Map<string, number>()
rows.forEach((r) => counts.set(r.best, (counts.get(r.best) ?? 0) + 1))
console.log(`best surface distribution: ${[...counts].map(([k, v]) => `${k} ${v}`).join(', ')}`)
console.log(`\nFor scale: 100 rating points = about 64% win probability for the stronger player.`)
