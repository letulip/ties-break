// WHICH CAREERS' COINS LAND, without walking a single one of them.
//
// `resolveLeaving` draws `rngFromSeed(`${seed}:ending:${door}:${seasonIndex}`)()` and compares it to
// `ENDINGS.peakLeavingChance` / `fallLeavingChance`. That is a PURE FUNCTION of the career's seed,
// the door and the season – so the set of (seed, season) pairs whose coin lands can be enumerated in
// milliseconds, and only those seeds need the five-second walk that proves the DOOR was open too.
//
// ⚠ NOTHING IS TUNED. Both chances are read from `ENDINGS`; the comparison is the engine's own. This
// is casting – choosing which career to film – and it is the only way to film a 1.72% event on
// purpose without touching the 1.72%.
import { rngFromSeed } from '../../src/engine/rng'
import { ENDINGS } from '../../src/engine/ending'
import { PRESETS } from '../econ-bench'

const MAX_INDEX = Number(process.env.MAX_INDEX || 400)
const SEASONS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const coin = (seed: string, door: 'peak' | 'fall', s: number) => rngFromSeed(`${seed}:ending:${door}:${s}`)()

for (const door of ['peak', 'fall'] as const) {
  const chance = door === 'peak' ? ENDINGS.peakLeavingChance : ENDINGS.fallLeavingChance
  const hits: string[] = []
  for (let i = 0; i < MAX_INDEX; i++) {
    const preset = PRESETS[i % PRESETS.length]
    const seed = `bench-${preset.background}-${i}`
    for (const s of SEASONS) if (coin(seed, door, s) < chance) hits.push(`${seed}@s${s} (${coin(seed, door, s).toFixed(4)})`)
  }
  console.log(`\n${door} – chance ${chance} – ${hits.length} landing (seed, season) pairs in ${MAX_INDEX} seeds x ${SEASONS.length} seasons`)
  for (const h of hits.slice(0, 18)) console.log('   ' + h)
  // ⭐ THE SHORTLIST WORTH WALKING: only the presets that can reach the top (indices 6, 7, 8 of
  // PRESETS – the two wealthy arms and the middle+high-coach one) and only the seasons that land
  // between twenty-five and twenty-nine, which is where `peakMinAgeYears` and a top-ten year overlap.
  const shortlist = hits.filter((h) => {
    const idx = Number(h.split('@')[0].split('-').at(-1))
    const season = Number(h.split('@s')[1].split(' ')[0])
    return idx % 9 >= 6 && season >= 11 && season <= 16
  })
  console.log(`   shortlist (resourced preset, season 11-16): ${shortlist.length}`)
  console.log('   PAIRS=' + shortlist.map((h) => h.split(' ')[0]).join(','))
}
