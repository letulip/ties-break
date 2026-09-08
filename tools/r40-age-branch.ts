/**
 * r40-age-branch – WHAT THE BODY SAYS PAST 29, which is where «she is done» has to live.
 *
 * ⚠ WHY THIS PROBE EXISTS, in one line: `tools/r40-retire-trigger.ts` measured the PLATEAU window
 * (24-28) and found no trigger can be right there – the card asks on 52 of 108 careers and she beat
 * that day's rank afterwards in 52 of 52, and physical share is exactly 1.000 at every ask because
 * `declineStart` IS 29. So the owner's «подсветить, когда она сама дальше вообще не готова играть»
 * moves to the AGE branch, where the share actually falls. This measures what it does there.
 *
 * The shipped rule: past `askFromAgeYears` (29) the off-season asks every year, and the offer is
 * FINAL when `physicalShare <= ENDINGS.lastOfferPeakShare` (0.55). The question is whether an
 * EARLIER band is a real signal – one that separates «she is finishing» from «she is still going».
 *
 * ⚠ The premature test that convicted every plateau candidate is kept, re-aimed for this window: a
 * band is premature if she went on to a BETTER rank after it fired. Past 29 that should be rare -
 * if it is not, the band is as wrong here as K was there.
 *
 * ⚠ Synthetic careers only; the owner's saves in ~/Downloads are read-only and never fixtures.
 *
 * Run: npx vite-node tools/r40-age-branch.ts [-- --seeds 6 --weeks 1200]
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { ENDINGS } from '../src/engine/ending'
import { physicalMean } from '../src/engine/development'
import { kidAgeYears } from '../src/engine/world/age'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const numArg = (flag: string, dflt: number) => {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : dflt
}
const seeds = numArg('--seeds', 6)
const weeks = numArg('--weeks', 1200)

type Ask = { age: number; rank: number; share: number; seasonIndex: number; week: number; titles: number }
type Career = { label: string; asks: Ask[]; bestAfter: Map<number, number>; ended: string | null; endAge: number }

const careers: Career[] = []

for (const preset of PRESETS) {
  for (const policy of POLICIES) {
    for (let i = 0; i < seeds; i++) {
      const { world, rng } = openCareer(preset, i, policy)
      const w = world as WorldState & { kidRankWta?: number; peakPhysical?: number; ending?: { kind?: string } | null }
      const asks: Ask[] = []
      // rank seen at or after each ask, so "did she get better" is answerable per ask
      const bestAfter = new Map<number, number>()
      for (let n = 0; n < weeks; n++) {
        stepCareerWeek(world, rng, policy)
        const rank = w.kidRankWta ?? 9999
        for (const [k, v] of bestAfter) if (rank > 0 && rank < v) bestAfter.set(k, rank)
        if (world.week % WEEKS_PER_YEAR !== WEEKS_PER_YEAR - OFF_SEASON_WEEKS) continue
        const age = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
        if (age < ENDINGS.askFromAgeYears) continue
        const peak = w.peakPhysical ?? physicalMean(world.skills)
        const trophies = (w as unknown as { trophiesByTier?: Record<string, { titles?: number[] }> }).trophiesByTier ?? {}
        const titlesNow = Object.values(trophies).reduce((n2, t) => n2 + (t.titles?.length ?? 0), 0)
        asks.push({
          age,
          rank,
          share: peak > 0 ? physicalMean(world.skills) / peak : 1,
          seasonIndex: Math.floor(world.week / WEEKS_PER_YEAR),
          week: world.week,
          titles: titlesNow,
        })
        bestAfter.set(asks.length - 1, rank)
      }
      careers.push({
        label: `${preset.label} · ${policy.label} · seed ${i}`,
        asks,
        bestAfter,
        ended: w.ending?.kind ?? null,
        endAge: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
      })
    }
  }
}

const n = careers.length
const reached = careers.filter((c) => c.asks.length > 0)
const pct = (k: number, of: number) => `${((k / Math.max(1, of)) * 100).toFixed(1)}%`

console.log(`\nCORPUS: ${PRESETS.length} presets x ${POLICIES.length} policies x ${seeds} seeds = ${n} careers, ${weeks} weeks\n`)
console.log('THE AGE BRANCH, AS IT STANDS')
console.log(`  careers that ever reach ${ENDINGS.askFromAgeYears}     ${reached.length} of ${n}   ${pct(reached.length, n)}`)
const allAsks = reached.flatMap((c) => c.asks)
console.log(`  asks past ${ENDINGS.askFromAgeYears}                    ${allAsks.length}`)
if (allAsks.length) {
  const ages = allAsks.map((a) => a.age).sort((x, y) => x - y)
  const shares = allAsks.map((a) => a.share).sort((x, y) => x - y)
  console.log(`  age at the ask               min ${ages[0]} · median ${ages[Math.floor(ages.length / 2)]} · max ${ages[ages.length - 1]}`)
  console.log(`  physical share at the ask    min ${(shares[0] * 100).toFixed(1)}% · median ${(shares[Math.floor(shares.length / 2)] * 100).toFixed(1)}% · max ${(shares[shares.length - 1] * 100).toFixed(1)}%`)
}

console.log('\nSHARE BANDS – when each first fires, and whether she got better afterwards')
const BANDS = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, ENDINGS.lastOfferPeakShare]
for (const band of BANDS) {
  const fired = reached.filter((c) => c.asks.some((a) => a.share <= band))
  let premature = 0
  const agesAt: number[] = []
  const seasonsLeft: number[] = []
  for (const c of fired) {
    const idx = c.asks.findIndex((a) => a.share <= band)
    agesAt.push(c.asks[idx].age)
    const best = c.bestAfter.get(idx)
    if (best !== undefined && best < c.asks[idx].rank) premature++
    // ⭐ THE NUMBER THAT DECIDES IT: how many more seasons she goes on to play after the band fires.
    // A band that leaves eight seasons on the table is not «she is done», whatever the share says.
    seasonsLeft.push(c.asks[c.asks.length - 1].titles - c.asks[idx].titles)
  }
  seasonsLeft.sort((x, y) => x - y)
  agesAt.sort((x, y) => x - y)
  const label = band === ENDINGS.lastOfferPeakShare ? `share <= ${band} (SHIPPED final)` : `share <= ${band}`
  console.log(
    `  ${label.padEnd(30)} fires on ${String(fired.length).padStart(3)} of ${reached.length} (${pct(fired.length, reached.length).padStart(6)})` +
      (agesAt.length ? ` · median age ${agesAt[Math.floor(agesAt.length / 2)]}` : '') +
      ` · she improved after: ${premature} (${pct(premature, fired.length)})` +
      (seasonsLeft.length ? ` · TITLES AFTER median ${seasonsLeft[Math.floor(seasonsLeft.length / 2)]} max ${seasonsLeft[seasonsLeft.length - 1]} · none-after ${seasonsLeft.filter((x) => x === 0).length} (${pct(seasonsLeft.filter((x) => x === 0).length, seasonsLeft.length)})` : ''),
  )
}

console.log('\nHOW CAREERS ACTUALLY END')
const kinds = new Map<string, number>()
for (const c of careers) kinds.set(c.ended ?? '(still playing)', (kinds.get(c.ended ?? '(still playing)') ?? 0) + 1)
for (const [k, v] of [...kinds.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(k).padEnd(22)} ${String(v).padStart(3)}   ${pct(v, n)}`)
const endAges = careers.map((c) => c.endAge).sort((a, b) => a - b)
console.log(`  age at the walk's end        min ${endAges[0]} · median ${endAges[Math.floor(endAges.length / 2)]} · max ${endAges[endAges.length - 1]}`)
