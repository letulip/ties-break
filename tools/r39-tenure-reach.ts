/**
 * r39-tenure-reach – WHO EVER SEES THE CAREER-CROWNING DEALS, as a share of careers.
 *
 * ⚠ THE QUESTION IS THE OWNER'S, AND IT IS THE RIGHT ONE (08.09): «не будет ли это большим
 * облегчением? … сколько реально игроков в % по нашим прогнозам могут это увидеть? какая ценность
 * будет?» A gate nobody reaches is not a legendary reward, it is dead code with a comment; a gate
 * everybody reaches is not a reward at all. Both failures are invisible without this table.
 *
 * The anchor this re-measures: round 29's run put >=4 top-10 seasons at 9 of 108 careers (8%) –
 * `docs/specs/ad-portfolio-2026-08.md`. That run priced the 8-year capstone. This one adds the two
 * numbers that decision needs now: the share at a threshold of THREE, and the share that also holds
 * a Slam, which is the lifetime letter's own second gate.
 *
 * Same corpus shape as the round-29 run: every preset x every policy x N seeds, walked to the end of
 * a career. ⚠ The owner's personal saves are never read here – synthetic careers only.
 *
 * Run: npx vite-node tools/r39-tenure-reach.ts [-- --seeds 3 --weeks 900]
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { capstoneSeasonsOf } from '../src/engine/world/sponsors'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const numArg = (flag: string, dflt: number) => {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : dflt
}
const seeds = numArg('--seeds', 3)
const weeks = numArg('--weeks', 900)

type Row = { preset: string; policy: string; seed: number; top10: number; slams: number; bestRank: number }
const rows: Row[] = []

for (const preset of PRESETS) {
  for (const policy of POLICIES) {
    for (let i = 0; i < seeds; i++) {
      const { world, rng } = openCareer(preset, i, policy)
      for (let w = 0; w < weeks; w++) stepCareerWeek(world, rng, policy)
      const st = world as WorldState & { trophiesByTier?: Record<string, { titles?: number[] }> }
      const ranks = (world.seasonHistory ?? [])
        .map((h: { byTrack?: { wta?: { endRank?: number } } }) => h.byTrack?.wta?.endRank)
        .filter((r): r is number => typeof r === 'number')
      rows.push({
        preset: preset.label,
        policy: policy.label,
        seed: i,
        top10: capstoneSeasonsOf(world),
        slams: st.trophiesByTier?.slam?.titles?.length ?? 0,
        bestRank: ranks.length ? Math.min(...ranks) : 9999,
      })
    }
  }
}

const n = rows.length
const pct = (k: number) => `${((k / n) * 100).toFixed(1)}%`
console.log(`\nCORPUS: ${PRESETS.length} presets x ${POLICIES.length} policies x ${seeds} seeds = ${n} careers, ${weeks} weeks each\n`)

console.log('SEASONS ENDED IN THE WTA TOP 10 – the distribution')
const hist = new Map<number, number>()
for (const r of rows) hist.set(r.top10, (hist.get(r.top10) ?? 0) + 1)
for (const k of [...hist.keys()].sort((a, b) => a - b)) {
  console.log(`  ${String(k).padStart(2)} seasons  ${String(hist.get(k)).padStart(4)} careers  ${pct(hist.get(k)!).padStart(7)}`)
}

console.log('\nTHE GATES, as a share of careers')
const gate = (label: string, fits: (r: Row) => boolean) => {
  const k = rows.filter(fits).length
  console.log(`  ${label.padEnd(44)} ${String(k).padStart(4)} of ${n}   ${pct(k).padStart(7)}`)
}
gate('>= 4 top-10 seasons  (capstone, shipped)', (r) => r.top10 >= 4)
gate('>= 3 top-10 seasons', (r) => r.top10 >= 3)
gate('>= 1 slam title', (r) => r.slams >= 1)
gate('>= 4 top-10 AND a slam  (lifetime, as built)', (r) => r.top10 >= 4 && r.slams >= 1)
gate('>= 3 top-10 AND a slam  (the proposal)', (r) => r.top10 >= 3 && r.slams >= 1)
gate('>= 2 top-10 AND a slam', (r) => r.top10 >= 2 && r.slams >= 1)

console.log('\nWHO THEY ARE – every career that clears >= 3 top-10 seasons')
for (const r of rows.filter((x) => x.top10 >= 3).sort((a, b) => b.top10 - a.top10)) {
  console.log(`  ${String(r.top10).padStart(2)} seasons · ${String(r.slams)} slam(s) · best #${r.bestRank} · ${r.preset} · ${r.policy} · seed ${r.seed}`)
}
