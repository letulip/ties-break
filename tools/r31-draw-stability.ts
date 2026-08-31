/**
 * r31 #4 – IS THE FIRST-ROUND OPPONENT FOR ONE FIXED TOURNAMENT STABLE AS THE WEEKS PASS?
 * The owner's question: in reality a player knows their round-one opponent and it does not change.
 *
 * MEASUREMENT ONLY. Read-only import of the personal save; the world is ticked IN MEMORY and never
 * written back. No constant changed, no fixture shipped.
 *
 * ⭐⭐ ACCEPTANCE, AND THE COUNTING RULE IS THE WHOLE OF IT (r31b, the fix for this item). The
 * question is not "did the engine's idea of the field move" – it always did and always will, the
 * standings and the rivals' fatigue move every week. The question is **did the CARD ever show him
 * two different names for one tournament**, because a name is what he read as a promise. So an
 * observation where the card names NOBODY is not a reading at all and is skipped; a tournament
 * CHANGES only if two DIFFERENT names were on screen for it.
 *
 * ⚠ THAT RULE IS DELIBERATELY NEUTRAL BETWEEN THE TWO TREES, which is what makes the before/after
 * comparison worth anything. Before the fix every observation carries a name, so nothing is skipped
 * and the count is the raw one (measured 20 of 24 on the w933 save). After it, a name exists only
 * inside `DRAW_LEAD_WEEKS`, so the skipping is the fix showing up rather than the harness helping.
 *
 * ⚠ AND THE BAND IS COUNTED TOO, because after the fix the band is the ONLY thing a far-out card
 * says and it is therefore the thing he plans on. It is observed 3-6 times per event here, so unlike
 * the name it is a real repeated reading.
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
const seen = new Map<string, { week: number; opp: string; ch: string; band: string }[]>()
tracked.forEach((t) => seen.set(t.id, []))

for (let step = 0; step <= 6; step++) {
  for (const e of upcomingEvents(world)) {
    const row = seen.get(e.id)
    if (row)
      row.push({
        week: world.week,
        // '' = the card named nobody this week. Kept distinct from a dash so the counting below can
        // skip it rather than treat "no draw yet" as a third opponent.
        opp: e.preview.opponentName,
        ch: e.preview.firstMatchChance === null ? '–' : `${Math.round(e.preview.firstMatchChance * 100)}%`,
        band: e.preview.fieldStrength,
      })
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
let bandMoved = 0
let named = 0
for (const t of tracked) {
  const rows = seen.get(t.id)!
  if (rows.length < 2) continue
  // Only the weeks the card actually put a name on screen count as readings of the opponent.
  const shown = rows.filter((r) => r.opp !== '')
  named += shown.length
  const opps = [...new Set(shown.map((r) => r.opp))]
  const bands = [...new Set(rows.map((r) => r.band))]
  const flag = opps.length > 1 ? 'CHANGES' : 'stable '
  if (opps.length > 1) changed++
  else stable++
  if (bands.length > 1) bandMoved++
  console.log(
    `${flag}  ${bands.length > 1 ? 'BAND-MOVES' : 'band-holds'}  wk${t.week} ${t.label.padEnd(24)} seen ${rows.length}x  ` +
      rows.map((r) => `[w${r.week}: ${r.opp || 'no draw'} ${r.ch} ${r.band}]`).join(' '),
  )
}
console.log(`\n${changed} of ${changed + stable} tournaments changed their round-one opponent while being watched.`)
console.log(`   (${named} weeks in all put a name on screen across those ${changed + stable} tournaments)`)
console.log(`${bandMoved} of ${changed + stable} tournaments changed their field-strength band while being watched.`)
