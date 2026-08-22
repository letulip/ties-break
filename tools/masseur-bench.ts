/**
 * THE MASSEUR A/B BENCH – step 2: THE DIAL × THE SEAT (docs/specs/the-masseur-2026-08.md, invariant 4).
 *
 * Run:  npx vite-node tools/masseur-bench.ts [--seeds 32] [--weeks 416]
 *
 * PAIRED ARMS, SAME SEEDS. Arm `none` never hires. Six B-cells hire at the first week the
 * pro-career gate opens (`masseurUnlocked`) and keep him to the end: the three dial rungs
 * (2 / 4 / 7 sessions a week) × travels / stays home. Careers walk the econ bench's own loop
 * (`openCareer`/`stepCareerWeek`, `player` policy – the model of a reasonable parent), so nothing
 * here re-implements an entry policy.
 *
 * WHAT IT MEASURES per cell, paired against `none` on the same seed (SEM = sd/√n reported per cell
 * – the step-1 middle preset cleared only ~1.4 SEM, so this run reports the honesty number itself):
 *   (a) weeks lost to injury, injury onsets, the rehab receipts (weeks bought back);
 *   (b) the money line – salary actually paid AT THE RUNG'S PRICE (read off the ledger, so a
 *       suspended week counts as the $0 it charged), the fares actually charged (and how many of
 *       them a brand discount reached – the Meridian interaction), total staff cost, prize, funds;
 *   (c) what the player reads – pro-phase mean condition, match wins over the pro phase (the
 *       deep-run question: tour arms vs home arms), end W rank, endings, tour receipts.
 *
 * ⚠ THE HIRE (and the dial, and the stance) ARE THE ARMS' ONLY DIVERGENCE, and none of them spends
 * a draw on any stream – so every paired difference below is the masseur's, not a reshuffled
 * world's. (Post-draw threshold moves can still ripple a career – that is the effect being
 * measured, exactly as the physio's own levers do.)
 *
 * ⚠ THE B ARMS MANAGE THE HIRE LIKE A PARENT, NOT LIKE A LATCH. The first probe of this grid hired
 * at the gate and held for ever, and the knife-edge presets answered with bankruptcies: the gate
 * opens while the family's funds are at their junior-years low, and $300-525/wk plus fares tipped
 * careers that A kept alive – measuring a stubbornness nobody plays (the same shape as the coach
 * fare's own measured hazard, docs/specs/coach-travel-2026-08.md). So the walk (re)hires only
 * above HIRE_FLOOR and releases below RELEASE_FLOOR – the `player` policy's own register – and the
 * releases per career are reported. A walk also STOPS at its ending: the engine's tick is total by
 * design, so walking past a bankruptcy would keep billing a dead career and pollute every tally.
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import {
  hireMasseur,
  masseurUnlocked,
  setMasseurSessions,
  setMasseurTravels,
  inCollege,
  type WorldState,
} from '../src/engine/world'

const argOf = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(`--${name}`)
  const n = Number(process.argv[at + 1])
  return at > 0 && Number.isFinite(n) ? n : fallback
}
const SEEDS = argOf('seeds', 32)
const WEEKS = argOf('weeks', 416)
const POLICY = POLICIES[1] // 'player' – the reasonable parent
const ARMS_PRESETS = [5, 2] // 25k · middle · middle coach, and 8k · working · middle coach

interface Cell {
  sessions: number | null // null = never hires
  travels: boolean
  label: string
}
const CELLS: Cell[] = [
  { sessions: null, travels: false, label: 'none' },
  { sessions: 2, travels: false, label: '2/wk home' },
  { sessions: 2, travels: true, label: '2/wk tour' },
  { sessions: 4, travels: false, label: '4/wk home' },
  { sessions: 4, travels: true, label: '4/wk tour' },
  { sessions: 7, travels: false, label: '7/wk home' },
  { sessions: 7, travels: true, label: '7/wk tour' },
]

/** (Re)hire only above this – a parent does not staff up on fumes... */
const HIRE_FLOOR_CENTS = 25_000_00
/** ...and lets the masseur go when the family is down to this, before the bankruptcy latch can. */
const RELEASE_FLOOR_CENTS = 10_000_00

interface Run {
  unlockWeek: number | null
  hiredWeeks: number
  releases: number
  endedWeek: number | null
  salaryCents: number
  fareCents: number
  fareTrips: number
  fareDiscountedTrips: number
  weeksLost: number
  onsets: number
  weeksSaved: number
  tourReceipts: number
  proWins: number
  prizeCents: number
  fundsCents: number
  endRankWta: number | null
  meanProCondition: number | null
  ended: string
}

function walk(presetIndex: number, seedIndex: number, cell: Cell): Run {
  const { world, rng } = openCareer(PRESETS[presetIndex], seedIndex, POLICY)
  let unlockWeek: number | null = null
  let hiredWeeks = 0
  let releases = 0
  let endedWeek: number | null = null
  let salaryCents = 0
  let fareCents = 0
  let fareTrips = 0
  let fareDiscountedTrips = 0
  let onsets = 0
  let weeksSaved = 0
  let tourReceipts = 0
  let proWins = 0
  let injuredBefore = false
  let proWeeks = 0
  let proConditionSum = 0
  let prevSeasonWins = 0
  for (let w = 0; w < WEEKS; w++) {
    if (unlockWeek === null && masseurUnlocked(world)) unlockWeek = world.week
    // The reasonable parent's staffing rule (see the header): hire at the gate when the money is
    // there, let go before the money is gone, hire again when it comes back. The dial and the
    // stance are set once and PERSIST across a release – they are decisions, not employment.
    if (cell.sessions !== null && unlockWeek !== null && !world.ending && !inCollege(world)) {
      if (!world.masseurHired && world.fundsCents > HIRE_FLOOR_CENTS) {
        hireMasseur(world, true)
        setMasseurSessions(world, cell.sessions)
        if (cell.travels && !world.masseurTravels) setMasseurTravels(world, true)
      } else if (world.masseurHired && world.fundsCents < RELEASE_FLOOR_CENTS) {
        hireMasseur(world, false)
        releases++
      }
    }
    if (world.masseurHired) hiredWeeks++
    stepCareerWeek(world, rng, POLICY)
    // Money, as the LEDGER paid it this week – a suspended week books nothing, and the rung's
    // price is read off the row rather than off a constant.
    for (const e of world.events) {
      if (e.week !== world.week) continue
      if (e.category === 'staff' && (e.amountCents ?? 0) < 0) salaryCents += -e.amountCents!
      if (e.category === 'travel' && e.text.includes('masseur travels')) {
        fareCents += -(e.amountCents ?? 0)
        fareTrips++
        if (e.text.includes('covers')) fareDiscountedTrips++
      }
      if (e.text.includes('the masseur bought a week back')) weeksSaved++
      if (e.text.includes('table work on tour')) tourReceipts++
    }
    const injuredNow = world.injury !== null
    if (injuredNow && !injuredBefore) onsets++
    injuredBefore = injuredNow
    // Match wins, cumulative across season rolls (seasonWins resets at the boundary).
    const cur = world.seasonWins ?? 0
    const wins = cur >= prevSeasonWins ? cur - prevSeasonWins : cur
    prevSeasonWins = cur
    if (unlockWeek !== null) {
      proWins += wins
      proWeeks++
      proConditionSum += world.condition
    }
    // A career that has ENDED is over: the tick is total by design, so walking on would keep
    // billing a dead world and pollute every tally. The paired outcome deltas keep their meaning –
    // ending early IS the outcome.
    if (world.ending) {
      endedWeek = world.week
      break
    }
  }
  return {
    unlockWeek,
    hiredWeeks,
    releases,
    endedWeek,
    salaryCents,
    fareCents,
    fareTrips,
    fareDiscountedTrips,
    weeksLost: world.careerTotals.weeksLostToInjury ?? 0,
    onsets,
    weeksSaved,
    tourReceipts,
    proWins,
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
const sem = (xs: number[]) => sd(xs) / Math.sqrt(xs.length)

for (const presetIndex of ARMS_PRESETS) {
  console.log(`\n== ${PRESETS[presetIndex].label} · policy ${POLICY.id} · ${SEEDS} paired seeds · ${WEEKS} weeks ==`)
  // Walk every cell for every seed – the `none` arm once per seed, paired against each B-cell.
  const bySeed: Array<Record<string, Run>> = []
  for (let i = 0; i < SEEDS; i++) {
    const row: Record<string, Run> = {}
    for (const cell of CELLS) row[cell.label] = walk(presetIndex, i, cell)
    bySeed.push(row)
  }
  const reached = bySeed.filter((row) => row['4/wk home'].unlockWeek !== null)
  console.log(`reached the pro gate: ${reached.length}/${bySeed.length}`)
  if (!reached.length) continue
  for (const cell of CELLS.slice(1)) {
    const b = reached.map((row) => row[cell.label])
    const a = reached.map((row) => row.none)
    const d = (f: (r: Run) => number) => b.map((r, i) => f(r) - f(a[i]))
    const dWeeks = d((r) => r.weeksLost)
    const dOnsets = d((r) => r.onsets)
    const dCond = d((r) => r.meanProCondition ?? 0)
    const dWins = d((r) => r.proWins)
    const dPrize = d((r) => r.prizeCents)
    const dFunds = d((r) => r.fundsCents)
    const ranked = reached.filter((row) => row[cell.label].endRankWta !== null && row.none.endRankWta !== null)
    const dRank = ranked.map((row) => row[cell.label].endRankWta! - row.none.endRankWta!)
    console.log(`\n-- cell ${cell.label} (n=${b.length}) --`)
    console.log(
      `weeksLost   B ${mean(b.map((r) => r.weeksLost)).toFixed(1)} vs A ${mean(a.map((r) => r.weeksLost)).toFixed(1)} | paired ${mean(dWeeks).toFixed(2)} sem ${sem(dWeeks).toFixed(2)}`,
    )
    console.log(
      `onsets      B ${mean(b.map((r) => r.onsets)).toFixed(2)} vs A ${mean(a.map((r) => r.onsets)).toFixed(2)} | paired ${mean(dOnsets).toFixed(2)} sem ${sem(dOnsets).toFixed(2)}`,
    )
    console.log(
      `condition   B ${mean(b.map((r) => r.meanProCondition ?? 0)).toFixed(1)} vs A ${mean(a.map((r) => r.meanProCondition ?? 0)).toFixed(1)} | paired ${mean(dCond).toFixed(2)} sem ${sem(dCond).toFixed(2)}`,
    )
    console.log(
      `proWins     B ${mean(b.map((r) => r.proWins)).toFixed(1)} vs A ${mean(a.map((r) => r.proWins)).toFixed(1)} | paired ${mean(dWins).toFixed(2)} sem ${sem(dWins).toFixed(2)}`,
    )
    console.log(
      `receipts    rehab ${mean(b.map((r) => r.weeksSaved)).toFixed(2)} | tour ${mean(b.map((r) => r.tourReceipts)).toFixed(2)}`,
    )
    console.log(
      `money       salary ${fmt(mean(b.map((r) => r.salaryCents)))} over ${mean(b.map((r) => r.hiredWeeks)).toFixed(0)} hired wks (${mean(b.map((r) => r.releases)).toFixed(1)} releases) | fares ${fmt(mean(b.map((r) => r.fareCents)))} over ${mean(b.map((r) => r.fareTrips)).toFixed(1)} trips (${mean(b.map((r) => r.fareDiscountedTrips)).toFixed(1)} discounted) | staff total ${fmt(mean(b.map((r) => r.salaryCents + r.fareCents)))}`,
    )
    console.log(
      `outcome     prize ${fmt(mean(dPrize))} sem ${fmt(sem(dPrize))} | funds ${fmt(mean(dFunds))} | rank ${mean(dRank).toFixed(1)} (n=${dRank.length}, neg=better) | endings B ${JSON.stringify(count(b.map((r) => r.ended)))} vs A ${JSON.stringify(count(a.map((r) => r.ended)))}`,
    )
  }
}

function count(xs: string[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const x of xs) out[x] = (out[x] ?? 0) + 1
  return out
}
