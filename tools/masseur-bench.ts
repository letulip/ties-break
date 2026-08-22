/**
 * THE MASSEUR A/B BENCH (travelling team step 1, docs/specs/the-masseur-2026-08.md – invariant 4).
 *
 * Run:  npx vite-node tools/masseur-bench.ts [--seeds 24] [--weeks 416]
 *
 * PAIRED ARMS, SAME SEEDS: arm A never hires; arm B hires the masseur on the first week the
 * pro-career gate opens (`masseurUnlocked`) and keeps him to the end. Careers walk the econ bench's
 * own loop (`openCareer`/`stepCareerWeek`, `player` policy – the model of a reasonable parent), so
 * nothing here re-implements an entry policy.
 *
 * WHAT IT MEASURES, per the plan's three questions:
 *   (a) weeks lost to injury/condition – `careerTotals.weeksLostToInjury`, injury onsets, and the
 *       weeks his hands bought back (the receipt events, counted live before the feed prunes);
 *   (b) the money line – salary actually paid (counted at the ledger row, so a suspended week
 *       counts as the $0 it charged), prize money, closing funds;
 *   (c) whether the effect is visible in results the player reads – end W ranking, and the mean
 *       condition over the professional phase.
 *
 * ⚠ THE HIRE IS THE ONLY DIVERGENCE BETWEEN ARMS, and it spends no draw on any stream – so every
 * paired difference below is the masseur's, not a reshuffled world's. (Post-draw threshold moves
 * can still ripple a career – that is the effect being measured, exactly as the physio's own
 * levers do.)
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { hireMasseur, masseurUnlocked, inCollege, type WorldState } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'

const argOf = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(`--${name}`)
  const n = Number(process.argv[at + 1])
  return at > 0 && Number.isFinite(n) ? n : fallback
}
const SEEDS = argOf('seeds', 24)
const WEEKS = argOf('weeks', 416)
const POLICY = POLICIES[1] // 'player' – the reasonable parent
const ARMS_PRESETS = [5, 2] // 25k · middle · middle coach, and 8k · working · middle coach

interface Run {
  seed: string
  unlockWeek: number | null
  hiredWeeks: number
  salaryCents: number
  weeksLost: number
  onsets: number
  weeksSaved: number
  prizeCents: number
  fundsCents: number
  endRankWta: number | null
  meanProCondition: number | null
  ended: string
}

function walk(presetIndex: number, seedIndex: number, hire: boolean): Run {
  const { world, rng, seed } = openCareer(PRESETS[presetIndex], seedIndex, POLICY)
  let unlockWeek: number | null = null
  let hiredWeeks = 0
  let salaryCents = 0
  let onsets = 0
  let weeksSaved = 0
  let injuredBefore = false
  let proWeeks = 0
  let proConditionSum = 0
  for (let w = 0; w < WEEKS; w++) {
    if (unlockWeek === null && masseurUnlocked(world)) unlockWeek = world.week
    if (hire && unlockWeek !== null && !world.masseurHired && !world.ending && !inCollege(world)) {
      hireMasseur(world, true)
    }
    stepCareerWeek(world, rng, POLICY)
    // The salary as the LEDGER paid it this week – a suspended week books nothing.
    const paid = world.events.some(
      (e) => e.week === world.week && e.category === 'staff' && (e.amountCents ?? 0) < 0,
    )
    if (paid) {
      hiredWeeks++
      salaryCents += ECONOMY.masseur.salaryPerWeekCents
    }
    const injuredNow = world.injury !== null
    if (injuredNow && !injuredBefore) onsets++
    injuredBefore = injuredNow
    weeksSaved += world.events.filter(
      (e) => e.week === world.week && e.text.includes('the masseur bought a week back'),
    ).length
    if (unlockWeek !== null) {
      proWeeks++
      proConditionSum += world.condition
    }
  }
  return {
    seed,
    unlockWeek,
    hiredWeeks,
    salaryCents,
    weeksLost: world.careerTotals.weeksLostToInjury ?? 0,
    onsets,
    weeksSaved,
    prizeCents: world.careerTotals.prizeCents ?? 0,
    fundsCents: world.fundsCents,
    endRankWta: (world as WorldState & { kidRankWta?: number | null }).kidRankWta ?? null,
    meanProCondition: proWeeks > 0 ? proConditionSum / proWeeks : null,
    ended: world.ending?.type ?? 'alive',
  }
}

const fmt = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)
const sd = (xs: number[]) => {
  if (xs.length < 2) return NaN
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1))
}

for (const presetIndex of ARMS_PRESETS) {
  console.log(`\n== ${PRESETS[presetIndex].label} · policy ${POLICY.id} · ${SEEDS} paired seeds · ${WEEKS} weeks ==`)
  const pairs: Array<{ a: Run; b: Run }> = []
  for (let i = 0; i < SEEDS; i++) {
    const a = walk(presetIndex, i, false)
    const b = walk(presetIndex, i, true)
    pairs.push({ a, b })
  }
  // Only careers that actually REACHED the pro gate can tell us anything about a pro-gated hire.
  const reached = pairs.filter((p) => p.b.unlockWeek !== null)
  console.log(`reached the pro gate: ${reached.length}/${pairs.length}` +
    (reached.length ? ` (median unlock week ${[...reached].map((p) => p.b.unlockWeek!).sort((x, y) => x - y)[Math.floor(reached.length / 2)]})` : ''))
  if (!reached.length) continue
  const dWeeksLost = reached.map((p) => p.b.weeksLost - p.a.weeksLost)
  const dOnsets = reached.map((p) => p.b.onsets - p.a.onsets)
  const dCondition = reached.map((p) => (p.b.meanProCondition ?? 0) - (p.a.meanProCondition ?? 0))
  const dFunds = reached.map((p) => p.b.fundsCents - p.a.fundsCents)
  const dPrize = reached.map((p) => p.b.prizeCents - p.a.prizeCents)
  const ranked = reached.filter((p) => p.a.endRankWta !== null && p.b.endRankWta !== null)
  const dRank = ranked.map((p) => p.b.endRankWta! - p.a.endRankWta!)
  console.log(`A weeks lost   mean ${mean(reached.map((p) => p.a.weeksLost)).toFixed(1)} | B ${mean(reached.map((p) => p.b.weeksLost)).toFixed(1)} | paired delta ${mean(dWeeksLost).toFixed(2)} +- sd ${sd(dWeeksLost).toFixed(2)}`)
  console.log(`A onsets       mean ${mean(reached.map((p) => p.a.onsets)).toFixed(2)} | B ${mean(reached.map((p) => p.b.onsets)).toFixed(2)} | paired delta ${mean(dOnsets).toFixed(2)}`)
  console.log(`weeks bought back (B only)  mean ${mean(reached.map((p) => p.b.weeksSaved)).toFixed(2)}  min ${Math.min(...reached.map((p) => p.b.weeksSaved))}  max ${Math.max(...reached.map((p) => p.b.weeksSaved))}`)
  console.log(`salary paid (B)             mean ${fmt(mean(reached.map((p) => p.b.salaryCents)))} over mean ${mean(reached.map((p) => p.b.hiredWeeks)).toFixed(0)} billed weeks`)
  console.log(`pro-phase condition         A ${mean(reached.map((p) => p.a.meanProCondition ?? 0)).toFixed(1)} | B ${mean(reached.map((p) => p.b.meanProCondition ?? 0)).toFixed(1)} | paired delta +${mean(dCondition).toFixed(2)}`)
  console.log(`end W rank (${ranked.length} ranked)   A ${mean(ranked.map((p) => p.a.endRankWta!)).toFixed(1)} | B ${mean(ranked.map((p) => p.b.endRankWta!)).toFixed(1)} | paired delta ${mean(dRank).toFixed(2)} (negative = better)`)
  console.log(`prize money    A ${fmt(mean(reached.map((p) => p.a.prizeCents)))} | B ${fmt(mean(reached.map((p) => p.b.prizeCents)))} | paired delta ${fmt(mean(dPrize))}`)
  console.log(`closing funds  A ${fmt(mean(reached.map((p) => p.a.fundsCents)))} | B ${fmt(mean(reached.map((p) => p.b.fundsCents)))} | paired delta ${fmt(mean(dFunds))}`)
  console.log(`endings A ${JSON.stringify(count(reached.map((p) => p.a.ended)))} | B ${JSON.stringify(count(reached.map((p) => p.b.ended)))}`)
}

function count(xs: string[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const x of xs) out[x] = (out[x] ?? 0) + 1
  return out
}
