// HOW MUCH DOES THE EVENT CARD'S PERCENTAGE MOVE BEFORE THE EVENT IS PLAYED? — owner's item 7
// (31.07): «А почему на карточках турниров % меняется от одной недели к другой? На одной неделе было
// 92%, на следующей уже 64% - это довольно странно.»
//
// preview.ts is explicit that the field is drawn "from the standings AS THEY ARE TODAY" and calls
// itself an estimate rather than a prophecy. What was never measured is HOW BIG that movement is.
// A card that swings 28 points between two consecutive weeks does not read as an honest estimate,
// it reads as a broken number - and the fix, if one is needed, depends on the size.
//
// This walks real careers and records every upcoming event's quoted chance every week it is on
// screen, then reports the swing per event.
//
// ⚠⚠ ARCHIVAL SINCE ROUND 31 #4 (31.08.2026). Its finding is what shipped: the swing was the DRAWN
// OPPONENT changing, so the card now names nobody until week − 1 (`DRAW_LEAD_WEEKS`) and a
// percentage exists on exactly one week per event. Re-running this measures almost nothing, by
// construction – cards with no chance are skipped below, which leaves at most one reading per event
// and therefore no step to measure. The numbers it produced are preserved in
// docs/specs/preview-odds-honesty.md §2, and §6 of that file records what shipped.
import { createWorld, tickWeek, toSnapshot } from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'

interface Track {
  chances: number[]
  opponents: string[]
  strengths: string[]
  conds: number[]
  tier: string
}

const WEEKS = 104
const SEEDS = 12

const swings: number[] = []
const stepSwings: number[] = []
let oppChanges = 0
let oppSlots = 0
let strengthChanges = 0
const sameOppSteps: number[] = []
const condSteps: number[] = []
const byTier = new Map<string, number[]>()

for (let s = 0; s < SEEDS; s++) {
  const seed = `drift-${s}`
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(`${seed}:bench`)
  const tracks = new Map<string, Track>()

  for (let w = 0; w < WEEKS; w++) {
    const snap = toSnapshot(world)
    for (const e of snap.upcoming) {
      // No draw, no chance – see the archival note at the top of this file.
      if (e.preview.firstMatchChance === null) continue
      const t = tracks.get(e.id) ?? { chances: [], opponents: [], strengths: [], conds: [], tier: e.tier }
      t.chances.push(e.preview.firstMatchChance)
      t.opponents.push(e.preview.opponentName)
      t.strengths.push(e.preview.fieldStrength)
      t.conds.push(world.condition)
      tracks.set(e.id, t)
    }
    tickWeek(world, rng)
  }

  for (const t of tracks.values()) {
    if (t.chances.length < 2) continue
    const swing = (Math.max(...t.chances) - Math.min(...t.chances)) * 100
    swings.push(swing)
    const arr = byTier.get(t.tier) ?? []
    arr.push(swing)
    byTier.set(t.tier, arr)
    for (let i = 1; i < t.chances.length; i++) {
      const step = Math.abs(t.chances[i] - t.chances[i - 1]) * 100
      stepSwings.push(step)
      oppSlots++
      if (t.opponents[i] !== t.opponents[i - 1]) oppChanges++
      else sameOppSteps.push(step)
      if (t.strengths[i] !== t.strengths[i - 1]) strengthChanges++
      condSteps.push(Math.abs(t.conds[i] - t.conds[i - 1]))
    }
  }
}

function pct(xs: number[], p: number): number {
  const a = [...xs].sort((x, y) => x - y)
  return a[Math.min(a.length - 1, Math.floor((a.length - 1) * p))]
}

const fmt = (xs: number[]) =>
  `n=${xs.length}  p50=${pct(xs, 0.5).toFixed(1)}  p90=${pct(xs, 0.9).toFixed(1)}  max=${Math.max(...xs).toFixed(1)}`

console.log(`careers=${SEEDS}  weeks=${WEEKS}`)
console.log(`\nTOTAL SWING per event, first sighting to last (points of %):`)
console.log(`  ${fmt(swings)}`)
console.log(`\nWEEK-TO-WEEK step (what he actually saw, points of %):`)
console.log(`  ${fmt(stepSwings)}`)
console.log(`  steps over 20 points: ${((stepSwings.filter((x) => x > 20).length / stepSwings.length) * 100).toFixed(1)}%`)
console.log(`  steps over 10 points: ${((stepSwings.filter((x) => x > 10).length / stepSwings.length) * 100).toFixed(1)}%`)
console.log(`\nNAMED OPPONENT changed between consecutive weeks: ${((oppChanges / oppSlots) * 100).toFixed(1)}% of ${oppSlots} steps`)
console.log(`FIELD STRENGTH (the WORDS) changed:                ${((strengthChanges / oppSlots) * 100).toFixed(1)}%`)
console.log(`\nWHEN THE OPPONENT DID *NOT* CHANGE, the % still moved by:`)
console.log(`  ${fmt(sameOppSteps)}`)
console.log(`  (this residue is HER OWN condition, which the preview scales her by while previewing`)
console.log(`   every rival rested. Her week-to-week condition step: ${fmt(condSteps)} points of 100.)`)
console.log(`\nby tier (total swing):`)
for (const [tier, arr] of [...byTier.entries()].sort()) {
  console.log(`  ${tier.padEnd(9)} ${fmt(arr)}`)
}
