/**
 * r31 #4 – IS THE FIRST-ROUND OPPONENT FOR ONE FIXED TOURNAMENT STABLE AS THE WEEKS PASS?
 * The owner's question: in reality a player knows their round-one opponent and it does not change.
 *
 * MEASUREMENT ONLY. Read-only import of the personal save; the world is ticked IN MEMORY and never
 * written back. No constant changed, no fixture shipped.
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { advanceWeeks } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { upcomingEvents } from '../src/engine/world/snapshot'
import { TIERS } from '../src/engine/season/calendar'

const argv = process.argv.slice(2)
const world = (await decodeExportFile(
  new Uint8Array(readFileSync(argv[argv.indexOf('--save') + 1])),
)) as WorldState

// Track every event that is visible NOW and still lies ahead – follow each by its own id.
const start = world.week
const tracked = upcomingEvents(world).map((e) => ({
  id: e.id,
  week: e.week,
  label: TIERS[e.tier].label,
}))
const seen = new Map<string, { week: number; opp: string; ch: number }[]>()
tracked.forEach((t) => seen.set(t.id, []))

for (let step = 0; step <= 6; step++) {
  for (const e of upcomingEvents(world)) {
    const row = seen.get(e.id)
    if (row) row.push({ week: world.week, opp: e.preview.opponentName || '-', ch: Math.round(e.preview.firstMatchChance * 100) })
  }
  if (step === 6) break
  const stops = advanceWeeks(world, resumeMain(world.rngMain!), 1)
  if (world.week === start + step) {
    console.log(`\n⚠ advance refused at week ${world.week}: ${stops.join(', ')}`)
    break
  }
}

console.log(`\nONE TOURNAMENT, RE-PREVIEWED EACH WEEK – observed from week ${start} to ${world.week}\n`)
let changed = 0
let stable = 0
for (const t of tracked) {
  const rows = seen.get(t.id)!
  if (rows.length < 2) continue
  const opps = [...new Set(rows.map((r) => r.opp))]
  const flag = opps.length > 1 ? 'CHANGES' : 'stable '
  if (opps.length > 1) changed++
  else stable++
  console.log(
    `${flag}  wk${t.week} ${t.label.padEnd(24)} seen ${rows.length}x  ` +
      rows.map((r) => `[w${r.week}: ${r.opp} ${r.ch}%]`).join(' '),
  )
}
console.log(`\n${changed} of ${changed + stable} tournaments changed their round-one opponent while being watched.`)
