/**
 * r31 #4 – HOW MUCH OF A PROMISE IS THE NAME REVEALED AT WEEK − 1?
 *
 * The card at week − 1 and the bracket at week E hold the SAME `world.results`: `tickWeek` increments
 * the week first, and `buildKidTournament` runs at step 5, before that week's AI results are appended
 * at step 7. So the two differ in exactly ONE input – the week number handed to `rivalConditions` and
 * to the ranking fold – and this measures what that single number costs in opponent identity.
 *
 * It also reports how often the field-strength BAND moves week to week, which is the other half of
 * the item: the band is the only thing a pre-draw card says, so it is the thing the owner plans on.
 *
 * ⚠ NON-WTA TIERS ONLY, deliberately. `upcomingEvents` hands the W track a merged professional
 * universe and a week-exclusivity set that this file would have to rebuild; the drift mechanism it is
 * measuring is identical on both tracks and the junior/domestic call is a one-liner, so the narrower
 * scope buys a measurement that cannot be wrong about its own arms.
 *
 * MEASUREMENT ONLY: synthetic careers, no save read, no constant changed, no fixture shipped.
 *
 * Run: npx vite-node tools/r31-draw-promise.ts
 */
import { createWorld, tickWeek } from '../src/engine/world'
import { fullRanking } from '../src/engine/world/ladder'
import { kidMatchPlayerFor } from '../src/engine/world/player'
import { coachTravelFareFor } from '../src/engine/world/sponsors'
import { previewEvent, DRAW_LEAD_WEEKS } from '../src/engine/season/preview'
import { TIERS } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import { UPCOMING_WEEKS } from '../src/engine/world/constants'

const SEEDS = 6
const WEEKS = 170

interface Obs { week: number; opp: string; band: string }
const rows = new Map<string, Obs[]>()
const bandCount = new Map<string, number>()
let promiseKept = 0
let promiseBroken = 0

for (let s = 0; s < SEEDS; s++) {
  const seed = `promise-${s}`
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(`${seed}:bench`)
  for (let w = 0; w < WEEKS; w++) {
    const ranking = fullRanking(world)
    for (const e of world.season) {
      if (TIERS[e.tier].track === 'wta') continue
      if (e.week <= world.week || e.week > world.week + UPCOMING_WEEKS) continue
      const kid = kidMatchPlayerFor(world, e.surface, coachTravelFareFor(world, e) > 0)
      const p = previewEvent(world, e, ranking, kid)
      const arr = rows.get(`${seed}|${e.id}`) ?? []
      arr.push({ week: world.week, opp: p.opponentName, band: p.fieldStrength })
      rows.set(`${seed}|${e.id}`, arr)
      bandCount.set(p.fieldStrength, (bandCount.get(p.fieldStrength) ?? 0) + 1)

      // THE DRAW WEEK, read twice: as the card reads it, and as the bracket will – same world, same
      // results, the bracket's own week number.
      if (e.week - world.week === DRAW_LEAD_WEEKS) {
        const atBracketWeek = { seed: world.seed, week: e.week, cohort: world.cohort, results: world.results }
        const q = previewEvent(atBracketWeek, e, fullRanking({ ...world, week: e.week }), kid)
        if (q.opponentName === p.opponentName) promiseKept++
        else promiseBroken++
      }
    }
    tickWeek(world, rng)
  }
}

let bandStepSame = 0
let bandStepDiff = 0
let events = 0
let bandStable = 0
for (const arr of rows.values()) {
  if (arr.length < 2) continue
  events++
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].band === arr[i - 1].band) bandStepSame++
    else bandStepDiff++
  }
  if (new Set(arr.map((o) => o.band)).size === 1) bandStable++
}

const pc = (a: number, b: number) => `${((a / (a + b)) * 100).toFixed(1)}%`
console.log(`careers=${SEEDS}  weeks=${WEEKS}  events tracked=${events}  (non-WTA tiers)`)
console.log(`band distribution: ${[...bandCount].map(([k, v]) => `${k}=${v}`).join('  ')}`)
console.log(`\nTHE PROMISE – the card at week − ${DRAW_LEAD_WEEKS} against the same fold at the bracket's week`)
console.log(`  same opponent ${promiseKept}   different ${promiseBroken}   broken on ${pc(promiseBroken, promiseKept)} of draw-week cards`)
console.log(`\nTHE BAND – week to week, over every week a card is on screen`)
console.log(`  changed ${bandStepDiff} of ${bandStepDiff + bandStepSame} steps (${pc(bandStepDiff, bandStepSame)})`)
console.log(`  never moved on ${bandStable} of ${events} events`)
// ⚠ READ THE DISTRIBUTION LINE ABOVE BEFORE QUOTING THAT ZERO. A fresh career's girl sits at the
// bottom of the ITF table for years, so `strengthOf` answers `strong` on every card and the band
// cannot move because it only ever has one value. This arm proves the band does not FLICKER; the
// arm that proves it holds across all three readings is tools/r31-draw-stability.ts on a deep save.
if (bandCount.size < 2) console.log(`  ⚠ DEGENERATE: only one band occurs in these careers – see the note in this file`)
