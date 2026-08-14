/**
 * outcome-odds – the owner's question, 13.08: «я хочу понять какие у нас в текущем сетапе вообще
 * вероятности у разных исходных данных куда-то добраться … чтобы точно понимать какие у нас исходы
 * в игре и что крутить, и надо ли что-то крутить вообще.»
 *
 * A FULL FACTORIAL, in probabilities rather than point results:
 *
 *   TALENT    untalented / average / talented / prodigy   – percentile bands of the real draw
 *   MONEY     working (8k) / wealthy (120k)
 *   COACH     self / middle
 *   AIM       «does not know what to train» (all `general`) / «knows» (serve+return blocks)
 *
 * 4 x 2 x 2 x 2 = 32 cells, N seeds each, and each cell reports the SHARE of careers reaching each
 * band. That is the shape of his question: not "where does one girl land" but "what are her odds".
 *
 * ⚠ WHY «KNOWS WHAT TO TRAIN» IS THE SERVE BLOCK AND NOT SOMETHING CLEVERER. `aimWeights`
 * redistributes a CONSERVED growth rate (development.ts) – aiming adds nothing to the total, it
 * moves it between wings. So the only way aim can pay is by moving it onto the wings the match model
 * prices first, and `ladder-vs-targets-2026-08.md` §5c measured those: serve and return. A player
 * who knows the game aims there; one who does not leaves the default, which is what the bench has
 * always done.
 *
 * ⚠ TALENT BANDS ARE PERCENTILES OF THE ACTUAL DISTRIBUTION, not adjectives. The tool samples the
 * real `startingSkills` draw, sorts it, and reports what each band IS in points – so «prodigy» means
 * a measured top-2% draw rather than a word.
 *
 * The world is transplanted the same way `what-drives-progress.ts` does it and for the same reason:
 * a seed fixes BOTH the girl and her world, so talent has to be donated into a held world or the two
 * are confounded (the mistake the-wall §6 made and §6a had to undo).
 *
 * MEASUREMENT ONLY, tools/ only, no engine change, no new RNG.
 *
 * Run (shard across cores – the whole grid is ~2h on one):
 *   npx vite-node tools/outcome-odds.ts -- --shard 0/5 --out /tmp/odds
 *   npx vite-node tools/outcome-odds.ts -- --report /tmp/odds
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createWorld, type WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { POLICIES, stepCareerWeek } from './econ-bench'
import { startingSkills } from '../src/engine/world/player'
import { rollPotential, SKILL_KEYS, type KidSkills } from '../src/engine/development'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { CoachTier, FamilyBackground, PlayerProfile, SessionKind } from '../src/shared/protocol'

const argNum = (n: string, d: number): number => {
  const i = process.argv.indexOf(`--${n}`)
  return i >= 0 ? Number(process.argv[i + 1]) : d
}
const argStr = (n: string): string | null => {
  const i = process.argv.indexOf(`--${n}`)
  return i >= 0 ? process.argv[i + 1] : null
}
const WEEKS = argNum('weeks', 520)
const SEEDS = argNum('seeds', 12)
const sum = (o: KidSkills): number => SKILL_KEYS.reduce((n, k) => n + o[k], 0)

// --- the talent bands, measured rather than asserted ---------------------------------------------
const PROFILE: PlayerProfile = { ...DEFAULT_PROFILE }
const POOL = 600
const draws = Array.from({ length: POOL }, (_, i) => {
  const s = `talent-${i}`
  return { seed: s, start: sum(startingSkills(s, PROFILE)) }
}).sort((a, b) => a.start - b.start)
const at = (p: number): number => Math.min(POOL - 1, Math.max(0, Math.round((p / 100) * (POOL - 1))))
/** Bands as percentile WINDOWS, so each has enough distinct seeds to sample without repeats. */
const BANDS: { name: string; from: number; to: number }[] = [
  { name: 'untalented', from: 0, to: 8 },
  { name: 'average', from: 46, to: 54 },
  { name: 'talented', from: 86, to: 94 },
  { name: 'prodigy', from: 98, to: 100 },
]
const TALENTS = BANDS.map((b) => {
  const lo = at(b.from)
  const hi = at(b.to)
  const slice = draws.slice(lo, hi + 1)
  const seeds = Array.from({ length: SEEDS }, (_, i) => slice[i % slice.length].seed)
  return { ...b, seeds, meanStart: slice.reduce((n, d) => n + d.start, 0) / slice.length }
})

const MONEY: FamilyBackground[] = ['working', 'wealthy']
const COACH: CoachTier[] = ['self', 'middle']
const AIM = [false, true]
/** «Knows what to train»: every session aimed at the pair the match model prices first. */
const AIMED_WEEK: SessionKind[][] = Array.from({ length: 7 }, () => ['serve'] as SessionKind[])

interface Cell {
  band: string
  money: FamilyBackground
  coach: CoachTier
  aimed: boolean
  ranks: (number | null)[]
  bankrupt: number
}

function runOne(worldSeed: string, talentSeed: string, money: FamilyBackground, coach: CoachTier, aimed: boolean): { rank: number | null; bankrupt: boolean } {
  const profile: PlayerProfile = { ...DEFAULT_PROFILE, background: money, coachTier: coach }
  const world: WorldState = createWorld(worldSeed, profile)
  const donor = startingSkills(talentSeed, profile)
  world.skills = { ...donor }
  world.potential = rollPotential(talentSeed, donor)
  world.coachOnEventWeeks = POLICIES[1].coachOnEventWeeks
  if (aimed) world.plan = { ...world.plan, week: AIMED_WEEK.map((d) => [...d]) }
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < WEEKS; i++) {
    stepCareerWeek(world, rng, POLICIES[1])
    if (world.ending) break
  }
  const r = world.kidRankWta
  return { rank: r === null || r === undefined || r > 1600 ? null : r, bankrupt: world.ending?.type === 'bankruptcy' }
}

function cells(): Cell[] {
  const out: Cell[] = []
  for (const t of TALENTS) for (const m of MONEY) for (const c of COACH) for (const a of AIM) {
    out.push({ band: t.name, money: m, coach: c, aimed: a, ranks: [], bankrupt: 0 })
  }
  return out
}

function main(): void {
  const reportDir = argStr('report')
  if (reportDir) return report(reportDir)

  const outDir = argStr('out') ?? '/tmp/odds'
  mkdirSync(outDir, { recursive: true })
  const shard = argStr('shard') ?? '0/1'
  const [si, sn] = shard.split('/').map(Number)
  const all = cells()
  const mine = all.filter((_, i) => i % sn === si)
  console.log(`shard ${si}/${sn}: ${mine.length} cells x ${SEEDS} seeds x ${WEEKS} weeks`)
  for (const cell of mine) {
    const t0 = Date.now()
    const t = TALENTS.find((x) => x.name === cell.band)!
    for (let i = 0; i < SEEDS; i++) {
      // The WORLD varies with i so a cell is not one world's luck; the TALENT stays inside its band.
      const r = runOne(`odds-w${i}`, t.seeds[i], cell.money, cell.coach, cell.aimed)
      cell.ranks.push(r.rank)
      if (r.bankrupt) cell.bankrupt += 1
    }
    const id = `${cell.band}-${cell.money}-${cell.coach}-${cell.aimed ? 'aimed' : 'blind'}`
    writeFileSync(join(outDir, `${id}.json`), JSON.stringify(cell))
    console.log(`  ${id.padEnd(38)} ${((Date.now() - t0) / 1000).toFixed(0)}s`)
  }
}

function report(dir: string): void {
  const loaded: Cell[] = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
  console.log(`outcome-odds · ${loaded.length} cells · ${WEEKS} weeks · rebuilt player policy\n`)
  console.log('THE TALENT BANDS, MEASURED (mean summed starting skills over the band):')
  for (const t of TALENTS) console.log(`  ${t.name.padEnd(12)} p${t.from}-${t.to}   ${t.meanStart.toFixed(1)}`)

  const pct = (n: number, d: number): string => (d === 0 ? '  –' : `${Math.round((100 * n) / d)}%`.padStart(4))
  console.log(`\n${'='.repeat(104)}`)
  console.log('cell                                      n   top50  top100  top250  top500  ranked  bankrupt   median')
  console.log('='.repeat(104))
  const order = (c: Cell): number =>
    TALENTS.findIndex((t) => t.name === c.band) * 100 + (c.money === 'wealthy' ? 0 : 10) + (c.coach === 'middle' ? 0 : 5) + (c.aimed ? 0 : 1)
  for (const c of loaded.sort((a, b) => order(a) - order(b))) {
    const n = c.ranks.length
    const got = c.ranks.filter((r): r is number => r !== null)
    const med = got.length ? [...got].sort((a, b) => a - b)[Math.floor(got.length / 2)] : null
    const label = `${c.band} · ${c.money === 'wealthy' ? 'money' : 'no money'} · ${c.coach === 'middle' ? 'coach' : 'self'} · ${c.aimed ? 'knows' : 'blind'}`
    console.log(
      `${label.padEnd(40)}${String(n).padStart(3)}   ${pct(got.filter((r) => r <= 50).length, n)}   ${pct(got.filter((r) => r <= 100).length, n)}   ${pct(got.filter((r) => r <= 250).length, n)}   ${pct(got.filter((r) => r <= 500).length, n)}   ${pct(got.length, n)}    ${pct(c.bankrupt, n)}     ${med ? `#${med}` : '–'}`,
    )
  }

  // Marginals: what each factor is worth on its own, pooled over the other three.
  console.log(`\n${'='.repeat(104)}\nWHAT EACH FACTOR IS WORTH ON ITS OWN (pooled over the other three)\n${'='.repeat(104)}`)
  const marginal = (name: string, pick: (c: Cell) => string): void => {
    const groups = new Map<string, Cell[]>()
    for (const c of loaded) {
      const k = pick(c)
      groups.set(k, [...(groups.get(k) ?? []), c])
    }
    console.log(`\n  ${name}`)
    for (const [k, cs] of [...groups].sort()) {
      const ranks = cs.flatMap((c) => c.ranks)
      const got = ranks.filter((r): r is number => r !== null)
      const med = got.length ? [...got].sort((a, b) => a - b)[Math.floor(got.length / 2)] : null
      console.log(
        `    ${k.padEnd(14)} n=${String(ranks.length).padStart(4)}   top100 ${pct(got.filter((r) => r <= 100).length, ranks.length)}   top250 ${pct(got.filter((r) => r <= 250).length, ranks.length)}   ranked ${pct(got.length, ranks.length)}   median ${med ? `#${med}` : '–'}`,
      )
    }
  }
  marginal('TALENT', (c) => c.band)
  marginal('MONEY', (c) => (c.money === 'wealthy' ? 'wealthy' : 'working'))
  marginal('COACH', (c) => (c.coach === 'middle' ? 'coach' : 'self-coached'))
  marginal('AIM', (c) => (c.aimed ? 'knows' : 'blind'))
}

main()
