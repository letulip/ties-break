/**
 * what-drives-progress – the owner's question, 13.08: «как влияют уровни скиллов на прогресс и есть
 * ли какая-то вообще зависимость "мощные скилы = больше шансов" или вообще такого нет? Что влияет
 * на прогресс вообще?»
 *
 * ⚠ WHY IT COULD NOT BE ASKED UNTIL TODAY. The old bench policy never got anyone ranked – on one of
 * his seeds it played twelve years without entering a single professional event – so "does talent
 * decide progress" would have measured a population with no progress in it and answered "no" for
 * the wrong reason. `the-wall-2026-08.md` §6-§7 is that story. This runs on the REBUILT policy.
 *
 * THE DESIGN, and it is causal rather than observational. A career's seed fixes BOTH her talent and
 * her world, so comparing two saves confounds them – the mistake §6 made and §6a had to undo. Here
 * they are separated: the world is built from seed S (field, calendar, rivals, every draw), and then
 * her build and ceiling are TRANSPLANTED from a donor seed T. `world.skills` and `world.potential`
 * are plain state (`createWorld` sets them once) and `kidMatchPlayer` reads `world.skills`, so the
 * transplant is exact and nothing else in the world moves.
 *
 *   grid A – 8 talents x 3 backgrounds, ONE world: what does talent buy, and what does money buy?
 *   grid B – 8 talents x 3 worlds, ONE background: how much is just which world she was born into?
 *
 * MEASUREMENT ONLY, tools/ only, no engine change, no new RNG. Deterministic and re-runnable.
 *
 * Run:
 *   npx vite-node tools/what-drives-progress.ts                 # ~35 min
 *   npx vite-node tools/what-drives-progress.ts -- --weeks 312  # shorter
 */
import { createWorld, type WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { POLICIES, stepCareerWeek } from './econ-bench'
import { startingSkills } from '../src/engine/world/player'
import { rollPotential, SKILL_KEYS, type KidSkills } from '../src/engine/development'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { FamilyBackground, PlayerProfile } from '../src/shared/protocol'

const arg = (name: string, fallback: number): number => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? Number(process.argv[i + 1]) : fallback
}
const WEEKS = arg('weeks', 520)
const sum = (o: KidSkills): number => SKILL_KEYS.reduce((n, k) => n + o[k], 0)
const money = (c: number): string => `${c < 0 ? '-' : ''}$${Math.abs(Math.round(c / 100)).toLocaleString('en-US')}`

const TALENTS = ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7']
const WORLDS = ['w0', 'w1', 'w2']
const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']

interface Cell {
  talent: string
  world: string
  background: FamilyBackground
  start: number
  ceiling: number
  endRank: number | null
  bestRank: number | null
  fundsCents: number
  wtaEntries: number
  endSkills: number
}

/** One career: world from `worldSeed`, HER BUILD AND CEILING from `talentSeed`. */
function run(worldSeed: string, talentSeed: string, background: FamilyBackground): Cell {
  const profile: PlayerProfile = { ...DEFAULT_PROFILE, background, coachTier: 'self' }
  const world: WorldState = createWorld(worldSeed, profile)
  // ⚠ THE TRANSPLANT. Both fields are state and nothing re-derives them from the seed on the hot
  // path (`kidMatchPlayer` reads `world.skills`; `growWeek` is handed `world.potential`), so this
  // is the whole of it – no engine hook, no fork of the bench.
  const donorStart = startingSkills(talentSeed, profile)
  world.skills = { ...donorStart }
  world.potential = rollPotential(talentSeed, donorStart)
  world.coachOnEventWeeks = POLICIES[1].coachOnEventWeeks
  const rng = rngFromSeed(world.seed)
  let bestRank: number | null = null
  let wtaEntries = 0
  for (let i = 0; i < WEEKS; i++) {
    const entered = stepCareerWeek(world, rng, POLICIES[1])
    for (const [t, n] of Object.entries(entered)) {
      if (n > 0 && (t.startsWith('w') || t === 'slam')) wtaEntries += n
    }
    const r = world.kidRankWta
    if (r !== null && r !== undefined && (bestRank === null || r < bestRank)) bestRank = r
    if (world.ending) break
  }
  return {
    talent: talentSeed,
    world: worldSeed,
    background,
    start: sum(donorStart),
    ceiling: sum(world.potential),
    endRank: world.kidRankWta ?? null,
    bestRank,
    fundsCents: world.fundsCents,
    wtaEntries,
    endSkills: sum(world.skills),
  }
}

/** Pearson correlation, printed with its n so a small sample cannot pose as a law. */
function corr(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 3) return NaN
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    dx += (xs[i] - mx) ** 2
    dy += (ys[i] - my) ** 2
  }
  return dx === 0 || dy === 0 ? NaN : num / Math.sqrt(dx * dy)
}

/** Rank for arithmetic: unranked is not a number, so it is excluded and COUNTED, never zeroed. */
function ranked(cells: Cell[]): { rank: number[]; cell: Cell[]; unranked: number } {
  const rank: number[] = []
  const cell: Cell[] = []
  let unranked = 0
  for (const c of cells) {
    if (c.endRank === null || c.endRank > 1600) unranked += 1
    else {
      rank.push(c.endRank)
      cell.push(c)
    }
  }
  return { rank, cell, unranked }
}

function main(): void {
  console.log(`what-drives-progress · ${WEEKS} weeks per career · rebuilt player policy · self-coached\n`)

  console.log(`${'='.repeat(96)}\nGRID A – 8 talents x 3 backgrounds, ONE world (w0)\n${'='.repeat(96)}`)
  const a: Cell[] = []
  for (const t of TALENTS) {
    for (const b of BACKGROUNDS) a.push(run('w0', t, b))
  }
  console.log('talent  start  ceiling |        working        |        middle         |        wealthy')
  for (const t of TALENTS) {
    const row = BACKGROUNDS.map((b) => a.find((c) => c.talent === t && c.background === b)!)
    const cell = (c: Cell): string => `${(c.endRank && c.endRank <= 1600 ? `#${c.endRank}` : 'unrk').padStart(6)} ${String(c.wtaEntries).padStart(4)}e ${money(c.fundsCents).padStart(10)}`
    console.log(`${t.padEnd(7)}${row[0].start.toFixed(0).padStart(6)}${row[0].ceiling.toFixed(0).padStart(9)} | ${row.map(cell).join(' | ')}`)
  }

  console.log(`\n${'='.repeat(96)}\nGRID B – 8 talents x 3 worlds, ONE background (working)\n${'='.repeat(96)}`)
  const b: Cell[] = []
  for (const t of TALENTS) {
    for (const wS of WORLDS) b.push(wS === 'w0' ? a.find((c) => c.talent === t && c.background === 'working')! : run(wS, t, 'working'))
  }
  console.log('talent  start  ceiling |         w0            |         w1            |         w2')
  for (const t of TALENTS) {
    const row = WORLDS.map((wS) => b.find((c) => c.talent === t && c.world === wS)!)
    const cell = (c: Cell): string => `${(c.endRank && c.endRank <= 1600 ? `#${c.endRank}` : 'unrk').padStart(6)} ${String(c.wtaEntries).padStart(4)}e ${money(c.fundsCents).padStart(10)}`
    console.log(`${t.padEnd(7)}${row[0].start.toFixed(0).padStart(6)}${row[0].ceiling.toFixed(0).padStart(9)} | ${row.map(cell).join(' | ')}`)
  }

  console.log(`\n${'='.repeat(96)}\nWHAT ACTUALLY MOVES HER\n${'='.repeat(96)}`)
  const all = [...a, ...b.filter((c) => c.world !== 'w0')]
  const r = ranked(all)
  console.log(`careers: ${all.length}  ·  ranked: ${r.rank.length}  ·  unranked: ${r.unranked}`)
  const better = r.rank.map((x) => -x) // a SMALLER rank is better; negate so a positive r means "helps"
  console.log(`\n  correlation with FINAL RANK (positive = helps her), n=${r.rank.length}:`)
  console.log(`    starting skills   ${corr(r.cell.map((c) => c.start), better).toFixed(3)}`)
  console.log(`    ceiling           ${corr(r.cell.map((c) => c.ceiling), better).toFixed(3)}`)
  console.log(`    headroom          ${corr(r.cell.map((c) => c.ceiling - c.start), better).toFixed(3)}`)
  console.log(`    W-track entries   ${corr(r.cell.map((c) => c.wtaEntries), better).toFixed(3)}`)
  console.log(`    funds at the end  ${corr(r.cell.map((c) => c.fundsCents), better).toFixed(3)}`)
  console.log(`    skills she ENDED with ${corr(r.cell.map((c) => c.endSkills), better).toFixed(3)}`)

  // The spreads are the causal read: within a block only ONE factor moves.
  const spread = (cells: Cell[]): string => {
    const { rank, unranked } = ranked(cells)
    if (rank.length === 0) return 'all unranked'
    return `#${Math.min(...rank)} … #${Math.max(...rank)} (spread ${Math.max(...rank) - Math.min(...rank)}${unranked ? `, ${unranked} unranked` : ''})`
  }
  console.log(`\n  HOLDING the world and the money, moving only TALENT:`)
  for (const bg of BACKGROUNDS) console.log(`    ${bg.padEnd(8)} ${spread(a.filter((c) => c.background === bg))}`)
  console.log(`\n  HOLDING the world and the talent, moving only MONEY:`)
  for (const t of TALENTS) console.log(`    ${t.padEnd(8)} ${spread(a.filter((c) => c.talent === t))}`)
  console.log(`\n  HOLDING the talent and the money, moving only THE WORLD:`)
  for (const t of TALENTS) console.log(`    ${t.padEnd(8)} ${spread(b.filter((c) => c.talent === t))}`)
}

main()
