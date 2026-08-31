/** r31 #7 – IS HER WIN RATE FALLING? His observation, checked across every save he has kept.
 *  Each save carries its own rolling 52-week window; the union of them is a career timeline.
 *  MEASUREMENT ONLY, read-only. */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { KID_ID } from '../src/engine/world/constants'

const paths = process.argv.slice(2).filter((a) => a.endsWith('.tsave'))
/** week|tier|points – the same entry seen in two overlapping windows is one entry. */
const seen = new Map<string, { week: number; tier: string; wins: number; matches: number; title: boolean }>()

for (const p of paths) {
  const w = (await decodeExportFile(new Uint8Array(readFileSync(p)))) as WorldState
  for (const r of w.results) {
    if (r.playerId !== KID_ID || !r.tier || r.mandatoryMiss) continue
    const t = TIERS[r.tier as keyof typeof TIERS]
    const i = t?.points.indexOf(r.points) ?? -1
    if (i < 0) continue
    const wins = t.points.length - 1 - i
    seen.set(`${r.week}|${r.tier}|${r.points}`, {
      week: r.week,
      tier: r.tier,
      wins,
      matches: i === 0 ? wins : wins + 1,
      title: i === 0,
    })
  }
}

const rows = [...seen.values()].sort((a, b) => a.week - b.week)
console.log(`\n${paths.length} saves → ${rows.length} distinct entries, weeks ${rows[0]?.week}..${rows[rows.length - 1]?.week}\n`)

const bySeason = new Map<number, { n: number; wins: number; matches: number; titles: number }>()
for (const r of rows) {
  const s = Math.floor(r.week / WEEKS_PER_YEAR)
  if (!bySeason.has(s)) bySeason.set(s, { n: 0, wins: 0, matches: 0, titles: 0 })
  const b = bySeason.get(s)!
  b.n++
  b.wins += r.wins
  b.matches += r.matches
  if (r.title) b.titles++
}
console.log(['season', 'entries', 'matches', 'won', 'win rate', 'titles', 'wins/entry'].join('\t'))
for (const [s, b] of [...bySeason].sort((a, c) => a[0] - c[0])) {
  console.log(
    [s, b.n, b.matches, b.wins, `${Math.round((b.wins / b.matches) * 100)}%`, b.titles, (b.wins / b.n).toFixed(2)].join('\t'),
  )
}

// WAS THE FIELD HARDER, OR WAS SHE WEAKER? Tier mix per season, elite share, and her age.
const ELITE = new Set(['wta500', 'wta1000', 'slam'])
console.log('\nTIER MIX PER SEASON – share of entries at World Tour 500 and above\n')
console.log(['season', 'entries', 'elite', 'elite share', 'tiers played'].join('\t'))
const bySeasonTier = new Map<number, string[]>()
for (const r of rows) {
  const s = Math.floor(r.week / WEEKS_PER_YEAR)
  if (!bySeasonTier.has(s)) bySeasonTier.set(s, [])
  bySeasonTier.get(s)!.push(r.tier)
}
for (const [s, tiers] of [...bySeasonTier].sort((a, c) => a[0] - c[0])) {
  const elite = tiers.filter((t) => ELITE.has(t)).length
  const uniq = [...new Set(tiers)].map((t) => TIERS[t as keyof typeof TIERS]?.label ?? t)
  console.log([s, tiers.length, elite, `${Math.round((elite / tiers.length) * 100)}%`, uniq.join(', ')].join('\t'))
}
