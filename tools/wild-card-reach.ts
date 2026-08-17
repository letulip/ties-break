// ⭐⭐ HOW OFTEN A WILD CARD IS ACTUALLY OFFERED – and it exists because the two instruments the
// wave was measured on CANNOT SEE HER HALF OF THE MECHANIC.
//
// ⚠⚠ THE INSTRUMENT DEFECT, NAMED SO THE NEXT READER DOES NOT REDISCOVER IT. `tools/econ-bench.ts`'s
// entry loop pre-filters the week's calendar with
//
//     if (!tierOpenFor(world, e.tier)) continue          // econ-bench.ts, the ranking gate
//
// i.e. with the PER-RUNG gate and no event id. Every rung but the Slam answers identically either
// way, but a home wild card is a fact about ONE TOURNAMENT (see `homeWildCardPlace`), so a Slam the
// wild card opens is skipped by the bench before `enterEvent` – which would have accepted it – is
// ever asked. `ladder-baseline.ts` and `big-rung-finishes.ts` both walk careers through that loop,
// so both measure the AI half of the wild cards and NEITHER measures hers. A null there is a null
// arm, not a null result, and CLAUDE.md's own lesson of 17.08 is exactly this shape.
//
// ⚠ THE ONE-LINE FIX IS `tierOpenFor(world, e.tier, e.id)` AND IT IS DELIBERATELY NOT MADE HERE.
// `econ-bench.ts` is shared measurement infrastructure and another agent was mid-run against it when
// this was found; changing it under a running arm is precisely the contamination this wave was
// already bitten by. It is a follow-up with its own re-measure, not a side effect of this one.
//
// WHAT THIS DOES INSTEAD. It walks the same careers the bench walks, with the same policy, and each
// week asks the ENGINE's own predicate about each of the season's Slams – so it reports the OFFER
// (how often the door opens and to whom) without touching the shared tool or the entry policy. It
// answers the owner's question directly: who can get one, and how often.
//
//     npx vite-node tools/wild-card-reach.ts [--seeds 10] [--weeks 676]
//
// ⚠ MEASUREMENT ONLY. It patches nothing, in memory or otherwise, and reads every threshold out of
// the engine.

import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { homeWildCardPlace, acceptanceRank, tableSize, kidPoints } from '../src/engine/world'
import { hostNationOf, WILD_CARD } from '../src/engine/season/tournament'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const argOf = (name: string, fallback: number): number => {
  const next = process.argv[process.argv.indexOf(`--${name}`) + 1]
  const n = Number(next)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const SEEDS = argOf('seeds', 10)
const WEEKS = argOf('weeks', 676)
const POLICY = POLICIES[1] // 'player' – the arm ladder-baseline reports

interface Row {
  /** Slams whose host nation is hers, over the whole horizon */
  homeSlams: number
  /** ...of those, the ones she held a wild card for on the week the list closed */
  offered: number
  /** the weeks she sat inside the window at all (any nation) */
  weeksInWindow: number
  /** her best rank, for the band the offers landed in */
  bestRank: number | null
  /** the ranks the offers came at */
  offerRanks: number[]
}

const rows: Row[] = []

for (let p = 0; p < PRESETS.length; p++) {
  for (let s = 0; s < SEEDS; s++) {
    const { world, rng } = openCareer(PRESETS[p], s, POLICY)
    const row: Row = { homeSlams: 0, offered: 0, weeksInWindow: 0, bestRank: null, offerRanks: [] }
    const seen = new Set<string>()
    for (let w = 0; w < WEEKS; w++) {
      stepCareerWeek(world, rng, POLICY)
      const rank = world.kidRankWta
      if (rank !== null && kidPoints(world, 'wta') > 0) {
        row.bestRank = row.bestRank === null ? rank : Math.min(row.bestRank, rank)
        const accepts = acceptanceRank(world, WILD_CARD.tier)
        const total = tableSize(world, 'wta')
        const ceilingRank = Math.floor(total * 0.185)
        if (accepts !== undefined && rank > accepts && rank <= ceilingRank) row.weeksInWindow++
      }
      // Every Slam on the live calendar whose entry week has not passed – asked ONCE per event, on
      // the week its list closes, which is the week the offer is real.
      for (const e of world.season) {
        if (e.tier !== WILD_CARD.tier || seen.has(e.id)) continue
        if (e.deadlineWeek !== world.week) continue
        seen.add(e.id)
        if (hostNationOf(world.seed, e.id) === world.profile.country) row.homeSlams++
        if (homeWildCardPlace(world, e.tier, e.id)) {
          row.offered++
          if (world.kidRankWta !== null) row.offerRanks.push(world.kidRankWta)
        }
      }
    }
    rows.push(row)
  }
}

const n = rows.length
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const med = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}
const seasons = WEEKS / WEEKS_PER_YEAR

console.log(`\nWILD-CARD REACH · ${PRESETS.length} presets x ${SEEDS} seeds = n ${n} careers · ${WEEKS} weeks (${seasons.toFixed(0)} seasons) · policy "${POLICY.id}"`)
console.log(`  the rule: host nation === profile.country, outside slam.acceptsRank, inside the rung's entrant band ceiling`)
console.log(`  ⚠ this reports the OFFER, not an entry – see the header for why the bench cannot enter one\n`)

const offered = rows.filter((r) => r.offered > 0)
console.log(`  careers offered at least one wild card   ${offered.length} / ${n}   ${((100 * offered.length) / n).toFixed(0)}%`)
console.log(`  wild cards offered, total                ${sum(rows.map((r) => r.offered))}`)
console.log(`  ...per career that got any               median ${med(offered.map((r) => r.offered))}, max ${Math.max(0, ...rows.map((r) => r.offered))}`)
console.log(`  ...per career per season, all careers    ${(sum(rows.map((r) => r.offered)) / n / seasons).toFixed(3)}`)
console.log()
console.log(`  home Slams on the calendar, total        ${sum(rows.map((r) => r.homeSlams))}  (of ${n * 4 * seasons} Slams = ${((100 * sum(rows.map((r) => r.homeSlams))) / (n * 4 * seasons)).toFixed(1)}%)`)
console.log(`  weeks spent inside the window            median ${med(rows.map((r) => r.weeksInWindow))}, max ${Math.max(0, ...rows.map((r) => r.weeksInWindow))}`)
const allOfferRanks = rows.flatMap((r) => r.offerRanks)
console.log(`  the ranks an offer came at               ${allOfferRanks.length ? `min #${Math.min(...allOfferRanks)} · median #${med(allOfferRanks)} · max #${Math.max(...allOfferRanks)}` : 'none'}`)
console.log()
