/**
 * opener-price-bench – what the owner's 14.08 ruling does to a WHOLE CAREER, not just to a save.
 *
 * ⚠ WHY A SAVE CANNOT ANSWER THIS. `tools/counting-window.ts` re-folds an EXISTING ledger, so it
 * prices the change against rows that were already banked. But `world.results` stores the points a
 * row was AWARDED – nothing re-derives them from the table on load – so his four careers keep their
 * old figures and converge only as the 52-week window turns over. This runs the career from week 0
 * under each price, which is the only way to see the second-order effects: whether she still gets
 * INTO the big draws once they stop paying her to be there, and what happens to the money.
 *
 * ⚠ THE PATCH-AND-RESTORE IDIOM, licensed and already used by tools/best16-bench.ts on
 * `BEST_N_BY_TRACK` and by tools/big-draw-cost.ts on `drawSize`. `TIERS[t].points` is a plain array
 * on a plain object; the arm swaps the last element and puts it back. Nothing is written to a file
 * and no engine number is decided here.
 *
 * ⚠ AND BOTH ARMS SHARE EVERY SEED. Same world, same talent, same policy, same RNG – the ONLY
 * difference is what an opening loss at a Slam and a 1000 pays. Anything that moves, moved because
 * of that.
 *
 * MEASUREMENT ONLY. Run:
 *   npx vite-node tools/opener-price-bench.ts -- --seeds 8
 */
import { createWorld, type WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { POLICIES, stepCareerWeek } from './econ-bench'
import { TIERS } from '../src/engine/season/calendar'
import { KID_ID } from '../src/engine/world/constants'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { PlayerProfile } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

const argNum = (n: string, d: number): number => {
  const i = process.argv.indexOf(`--${n}`)
  return i >= 0 ? Number(process.argv[i + 1]) : d
}
const SEEDS = argNum('seeds', 8)
const WEEKS = argNum('weeks', 520)
const money = (c: number): string => `${c < 0 ? '-' : ''}$${Math.abs(Math.round(c / 100)).toLocaleString('en-US')}`

/** The two arms. `before` is what shipped until 14.08; `after` is the rulebook's own opener. */
const ARMS: { name: string; floors: Partial<Record<TierId, number>> }[] = [
  { name: 'before (130/65)', floors: { slam: 130, wta1000: 65 } },
  { name: 'after  (10/10)', floors: { slam: 10, wta1000: 10 } },
]

interface Row {
  seed: string
  endRank: number | null
  bestRank: number | null
  funds: number
  bigEntries: number
  bigOpenerLosses: number
  matchesWon: number
}

function runCareer(seed: string): Row {
  const profile: PlayerProfile = { ...DEFAULT_PROFILE, background: 'working', coachTier: 'middle' }
  const world: WorldState = createWorld(seed, profile)
  world.coachOnEventWeeks = POLICIES[1].coachOnEventWeeks
  const rng = rngFromSeed(world.seed)
  let bestRank: number | null = null
  for (let i = 0; i < WEEKS; i++) {
    stepCareerWeek(world, rng, POLICIES[1])
    const r = world.kidRankWta
    if (r !== null && r !== undefined && r <= 1600 && (bestRank === null || r < bestRank)) bestRank = r
    if (world.ending) break
  }
  // Read her own rows off the pruned window – the same 52 weeks a ranking is, so the two arms are
  // compared on the same span of career rather than on ledgers of different lengths.
  const hers = (world.results ?? []).filter((r) => r.playerId === KID_ID && r.tier !== undefined)
  const big = hers.filter((r) => r.tier === 'slam' || r.tier === 'wta1000')
  let matchesWon = 0
  for (const r of hers) {
    const pts = TIERS[r.tier!].points
    const f = pts.indexOf(r.points)
    if (f >= 0) matchesWon += pts.length - 1 - f
  }
  return {
    seed,
    endRank: world.kidRankWta === null || world.kidRankWta === undefined || world.kidRankWta > 1600 ? null : world.kidRankWta,
    bestRank,
    funds: world.fundsCents,
    bigEntries: big.length,
    bigOpenerLosses: big.filter((r) => r.points === TIERS[r.tier!].points[TIERS[r.tier!].points.length - 1]).length,
    matchesWon,
  }
}

function main(): void {
  console.log(`opener-price-bench · ${SEEDS} careers x ${WEEKS} weeks · rebuilt player policy · working family, middle coach\n`)
  const results = new Map<string, Row[]>()
  for (const arm of ARMS) {
    // PATCH
    const saved: Partial<Record<TierId, number>> = {}
    for (const [tier, floor] of Object.entries(arm.floors) as [TierId, number][]) {
      const pts = TIERS[tier].points
      saved[tier] = pts[pts.length - 1]
      pts[pts.length - 1] = floor
    }
    const rows: Row[] = []
    for (let i = 0; i < SEEDS; i++) rows.push(runCareer(`opener-${i}`))
    results.set(arm.name, rows)
    // RESTORE, unconditionally – a thrown arm must not leak a patched table into the next one.
    for (const [tier, was] of Object.entries(saved) as [TierId, number][]) {
      TIERS[tier].points[TIERS[tier].points.length - 1] = was
    }
    console.log(`  ${arm.name} done`)
  }

  console.log(`\n${'='.repeat(100)}`)
  console.log('seed          before: rank   best   funds        big  losses  wins   |   after: rank   best   funds        big  losses  wins')
  console.log('='.repeat(100))
  const before = results.get(ARMS[0].name)!
  const after = results.get(ARMS[1].name)!
  const cell = (r: Row): string =>
    `${(r.endRank ? `#${r.endRank}` : 'unrk').padStart(6)} ${(r.bestRank ? `#${r.bestRank}` : '–').padStart(6)} ${money(r.funds).padStart(11)} ${String(r.bigEntries).padStart(4)} ${String(r.bigOpenerLosses).padStart(7)} ${String(r.matchesWon).padStart(5)}`
  for (let i = 0; i < before.length; i++) {
    console.log(`${before[i].seed.padEnd(12)}${cell(before[i])}   |  ${cell(after[i])}`)
  }

  const med = (xs: number[]): number => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : NaN)
  const ranked = (rs: Row[]): number[] => rs.map((r) => r.endRank).filter((r): r is number => r !== null)
  console.log(`\n${'='.repeat(100)}\nWHAT MOVED\n${'='.repeat(100)}`)
  for (const [name, rs] of [[ARMS[0].name, before], [ARMS[1].name, after]] as [string, Row[]][]) {
    const rk = ranked(rs)
    console.log(
      `  ${name.padEnd(16)} median #${String(med(rk)).padStart(4)}   top-100 ${rs.filter((r) => r.endRank !== null && r.endRank <= 100).length}/${rs.length}   ` +
        `ranked ${rk.length}/${rs.length}   median funds ${money(med(rs.map((r) => r.funds)))}   ` +
        `big-draw entries ${rs.reduce((n, r) => n + r.bigEntries, 0)}   of them opening losses ${rs.reduce((n, r) => n + r.bigOpenerLosses, 0)}`,
    )
  }
  // ⚠ THE QUESTION THIS BENCH EXISTS FOR: does she still GET IN once the big draws stop paying her
  // to be there? Access is a rank cut, so a fall in rank can shut a door that a fall in points did
  // not - and that second-order loop is invisible to any counterfactual folded on a finished save.
  const entriesBefore = before.reduce((n, r) => n + r.bigEntries, 0)
  const entriesAfter = after.reduce((n, r) => n + r.bigEntries, 0)
  console.log(
    `\n  access loop: ${entriesBefore} big-draw entries before, ${entriesAfter} after` +
      `${entriesBefore ? ` (${Math.round((100 * entriesAfter) / entriesBefore)}% of before)` : ''}`,
  )
}

main()
