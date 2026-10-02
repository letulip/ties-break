// WHAT A MATCH COSTS HER IN CONDITION, MEASURED – round 45 item 1 (the owner's «2 матча Шлема снимают
// 8% кондиции, а 2 матча 250 – 10%… перерасход кондиции… мы хотели немного подкорректировать начальные
// матчи»). Invariant 5: tuning is measured, not guessed.
//
//   npx vite-node tools/condition-drain-probe.ts [--worlds N] [--reps N] [--q 0.1,0.3,..] [--csv /path/rows.csv]
//
// THE QUESTION. Per-match condition drain at the four top rungs (WTA 250 / 500 / 1000 / Slam), round by
// round: what does a match cost, what does a RUN cost, how much of it does a travelling masseur hand
// back – and does that reproduce the five figures the owner read off his own career?
//
// THE FORMULA UNDER TEST (engine/condition.ts, applied at `finalizeTournament`, nothing restated here):
//   run strain = Σ over the matches she PLAYED of  matchDrain(tier, score) + runFatigueExtra(i, tier)
//   matchDrain = (2 straight sets | 3 a three-setter or any tiebreak | +1 for a third tiebreak set) + tierMatchFatigue[tier]
//   the ladder is keyed on the DRAW (> 32 ⇒ [-2, -1, 0], the owner's 14.08 curve) else on the track
//   NET toll   = strain − masseurTourRelief(matches, strain, true)   (3 per night between rounds, owner 19.09)
// So per-match cost is a function of (scoreline class, tier, index-in-run) and nothing else: no opponent
// strength, no round-of-draw, no prestige. The only dice in it are the scoreline class, which is why the
// probe plays REAL matches for it and prices them with the engine's own functions.
//
// ⚠⚠ METHOD – real engine, fixed seeds, zero entropy of its own (no Math.random, no clock):
//   * a probe world per seed (`createWorld`, week 0 – no ticks: the scoreline mix is a function of the
//     matchup, not of the calendar) supplies the cohort and the derived professionals; the field is built
//     the way `tools/big-draw-cost.ts` rebuilds the canonical W bracket (`universeForTier` ∪ merged W
//     standings → `selectEntrants` → `rivalMatchPlayer`);
//   * "the kid" is ONE REAL ENTRANT lifted out of that field at a fixed quantile of the entrant list
//     (best-first; `--q`, default 0.1 / 0.3 / 0.5 / 0.7 / 0.9) and put back through `runTournament`'s kid slot at her
//     own standing – so her matches are played point by point by `simulateMatch` and carry a scoreline,
//     the AI-vs-AI matches being the closed form, exactly as in the game. She is fresh (condition is not
//     fed back), so this is the cost of the FIRST week of a run of weeks, not a compounding tired one;
//   * each run's event id is unique, because the kid's match seed is `${worldSeed}:${event.id}:r${round}`
//     – a constant id would replay the same opener forever and the cell would measure one match n times.
//   * her index in a run is her round, because a power-of-two bracket has no byes (runTournament is a pure
//     single-elimination fold); a run that ended after k matches is a run that lost in round k − 1 or won.
// THIN CELLS ARE PRINTED, NOT HIDDEN: every cell shows its n, and any n < 200 is starred. The deep rounds
// of a Slam are rare for a mid-table entrant by construction; the straight-sets floor and the all-hard
// ceiling beside them are DRAW-FREE (priced through the same functions on synthetic scorelines), so a thin
// cell is bracketed by two exact numbers rather than guessed at.
//
// ⚠ SCENARIOS RE-PRICE THE SAME RECORDS. `--scenario` patches ECONOMY in memory (the fatigue bench's own
// `withScenario` idiom – `as const` is compile-time only) and prices the SAME collected scorelines again, so
// an option's table is the baseline's dice under a different tariff: a PREDICTION, exact for the tariff and
// silent on the second-order effects (a fresher kid plays a little better; the rivals' shared ladder moves
// their fatigue and, with it, every frozen career – the 19.09 pass measured 38-44 of ~94 keys for a ladder
// change and 0 for the masseur dial). MEASUREMENT ONLY: no engine number is written from here.

import { writeFileSync } from 'node:fs'
import { createWorld, inTrack, KID_ID, seasonIndexOf } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import { BEST_N_BY_TRACK, computeRanking } from '../src/engine/season/ranking'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, TIER_SHORT } from '../src/engine/season/calendar'
import { selectEntrants, runTournament } from '../src/engine/season/tournament'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { fieldProsFor, mergedWtaRanking, universeForTier } from '../src/engine/season/fieldPros'
import { matchDrain, runFatigueExtra, tournamentRunStrain } from '../src/engine/condition'
import { masseurTourRelief } from '../src/engine/world/masseur'
import { ECONOMY } from '../src/engine/economy'
import type { TierId, SeasonEvent, AiPlayer, RankingRow } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const strArgOf = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const WORLDS = argOf('worlds', 3)
const REPS = argOf('reps', 100)
const CSV = strArgOf('csv')
// WHO THE KID IS. Default: five quantiles across the whole entrant list ("an ordinary entrant"). `--q 0.01,0.03,0.06`
// lifts a CONTENDER instead – the top of the field, who is the one that actually plays the deep rounds the owner
// quoted (5 matches at a 500, 6 at a 1000), and the only way a Slam's last rounds reach a readable n.
const QUANTILES = (strArgOf('q') ?? '0.1,0.3,0.5,0.7,0.9').split(',').map(Number)

const TOP: TierId[] = ['wta250', 'wta500', 'wta1000', 'slam']
const THIN = 200

// Synthetic scorelines for the DRAW-FREE bracket: the cheapest match, the dearest ordinary one, the epic.
const STRAIGHT = '6-1 6-1'
const HARD = '6-4 3-6 6-4'
const EPIC = '7-6 6-7 7-6'

interface Rec {
  score?: string
  won: boolean
}

/** Every run's records of HER matches only, in round order, kept so a scenario can price them again. */
const runsOf = new Map<TierId, Rec[][]>(TOP.map((t) => [t, []]))
/** n of kid runs per quantile, for the header (so a reader sees the weights). */
let totalRuns = 0

function canonical(world: WorldState, tier: TierId): { cohort: AiPlayer[]; ranking: RankingRow[] } {
  const pros = fieldProsFor(world.seed, seasonIndexOf(world.week), world.cohort.map((p) => p.name))
  const live = computeRanking(
    world.results.filter((r) => r.playerId !== KID_ID),
    world.week,
    BEST_N_BY_TRACK.wta,
    world.cohort.map((p) => p.id),
    inTrack('wta'),
  )
  return { cohort: universeForTier(tier, world.cohort, pros), ranking: mergedWtaRanking(live, pros) }
}

let skipped = 0
for (let w = 0; w < WORLDS; w++) {
  const world = createWorld(`cond-drain-${w}`)
  for (const tier of TOP) {
    const { cohort, ranking } = canonical(world, tier)
    const selEvent: SeasonEvent = {
      id: `cdp-sel-${tier}`,
      week: world.week,
      tier,
      surface: 'hard',
      travelCostCents: 0,
      deadlineWeek: world.week - 2,
    }
    const entrants = selectEntrants(selEvent, cohort, ranking, rngFromSeed(`${world.seed}:cdp:sel:${tier}`))
    const field = entrants.map((p) => rivalMatchPlayer(p, selEvent.surface))
    const drawSize = TIERS[tier].drawSize
    QUANTILES.forEach((q, qi) => {
      const idx = Math.min(field.length - 1, Math.floor(q * field.length))
      const kid = field[idx]
      const others = field.filter((_, j) => j !== idx)
      if (others.length !== drawSize - 1) {
        skipped += REPS
        return
      }
      for (let rep = 0; rep < REPS; rep++) {
        const event: SeasonEvent = { ...selEvent, id: `cdp-${tier}-w${w}-q${qi}-r${rep}` }
        const rng = rngFromSeed(`${world.seed}:cdp:run:${tier}:${qi}:${rep}`)
        const res = runTournament(event, others, kid, world.seed, rng, idx)
        const mine = res.matches
          .filter((m) => m.aId === kid.id || m.bId === kid.id)
          .map((m) => ({ score: m.score, won: m.winnerId === kid.id }))
        runsOf.get(tier)!.push(mine)
        totalRuns += 1
      }
    })
  }
}

// ---- pricing, ALWAYS through the engine's own functions ------------------------------------------------------------

const perMatch = (tier: TierId, i: number, score: string): number => matchDrain(tier, score) + runFatigueExtra(i, tier)
const surcharge = (tier: TierId): number => ECONOMY.condition.tierMatchFatigue[tier]
const hardCost = (): number => ECONOMY.condition.matchFatigue.hardMatch
const grossOf = (tier: TierId, recs: Rec[]): number => tournamentRunStrain(tier, recs)
const netOf = (tier: TierId, recs: Rec[]): number => {
  const g = grossOf(tier, recs)
  return g - masseurTourRelief(recs.length, g, true)
}
/** Σ of a synthetic scoreline over the first k rounds, relief on top – the draw-free bracket of a run of k matches. */
const synth = (tier: TierId, k: number, score: string): { gross: number; net: number } => {
  let gross = 0
  for (let i = 0; i < k; i++) gross += perMatch(tier, i, score)
  return { gross, net: gross - masseurTourRelief(k, gross, true) }
}

const f1 = (x: number): string => x.toFixed(1)
const pad = (s: string | number, n: number): string => String(s).padStart(n)
const rounds = (tier: TierId): number => Math.log2(TIERS[tier].drawSize)
const roundName = (tier: TierId, i: number): string => {
  const left = TIERS[tier].drawSize / 2 ** i
  return left === 2 ? 'F' : left === 4 ? 'SF' : left === 8 ? 'QF' : `R${left}`
}

function csvRows(): string[] {
  const rows = ['tier,round,n,won,hard,scoreline_mean,matchdrain_mean,gross_mean']
  for (const tier of TOP) {
    for (let i = 0; i < rounds(tier); i++) {
      const cell = runsOf.get(tier)!.filter((r) => r.length > i).map((r) => r[i])
      if (cell.length === 0) continue
      const sc = cell.map((c) => matchDrain(tier, c.score) - surcharge(tier))
      rows.push(
        [
          tier,
          roundName(tier, i),
          cell.length,
          cell.filter((c) => c.won).length,
          sc.filter((x) => x >= hardCost()).length,
          f1(sc.reduce((a, b) => a + b, 0) / cell.length),
          f1(cell.reduce((a, c) => a + matchDrain(tier, c.score), 0) / cell.length),
          f1(cell.reduce((a, c) => a + matchDrain(tier, c.score), 0) / cell.length + runFatigueExtra(i, tier)),
        ].join(','),
      )
    }
  }
  return rows
}

// ---- TABLE 0: the tariff itself, no dice -------------------------------------------------------------------------------

function printTariff(label: string): void {
  console.log(`\n  ${label}`)
  console.log('  per-match cost by round, STRAIGHT SETS / HARD (3 sets or a tiebreak) / EPIC (a third tiebreak set) – draw-free, priced through matchDrain + runFatigueExtra')
  console.log("  (the owner's own 14.08 rows for the two deep draws were  min 5 6 7 7 7 7 7  max 7 8 9 9 9 9 9 – the first and last column below, round by round)")
  for (const tier of TOP) {
    const r = rounds(tier)
    const cells: string[] = []
    for (let i = 0; i < r; i++) cells.push(`${roundName(tier, i)} ${perMatch(tier, i, STRAIGHT)}/${perMatch(tier, i, HARD)}/${perMatch(tier, i, EPIC)}`)
    console.log(`    ${TIER_SHORT[tier].padEnd(8)} draw ${pad(TIERS[tier].drawSize, 3)} surcharge ${surcharge(tier)}   ${cells.join('  ')}`)
  }
}

// ---- TABLE 1: measured, tier × round -------------------------------------------------------------------------------------

function printRounds(): void {
  console.log('\n  MEASURED, tier x round: what a match cost the kid on the round she PLAYED it (real scorelines)')
  console.log('  tier      round        n   win%  hard%  scoreline  +tier  +ladder   gross/match   straight  hard    (* = n < ' + THIN + ')')
  for (const tier of TOP) {
    for (let i = 0; i < rounds(tier); i++) {
      const cell = runsOf.get(tier)!.filter((r) => r.length > i).map((r) => r[i])
      if (cell.length === 0) {
        console.log(`  ${TIER_SHORT[tier].padEnd(8)}  ${roundName(tier, i).padEnd(5)}        0      –`)
        continue
      }
      const sc = cell.map((c) => matchDrain(tier, c.score) - surcharge(tier))
      const mean = sc.reduce((a, b) => a + b, 0) / cell.length
      const lad = runFatigueExtra(i, tier)
      const gross = mean + surcharge(tier) + lad
      const star = cell.length < THIN ? '*' : ' '
      console.log(
        `  ${TIER_SHORT[tier].padEnd(8)}  ${roundName(tier, i).padEnd(5)}  ${pad(cell.length, 7)}${star} ` +
          `${pad(Math.round((100 * cell.filter((c) => c.won).length) / cell.length), 4)}  ` +
          `${pad(Math.round((100 * sc.filter((x) => x >= hardCost()).length) / cell.length), 5)}  ` +
          `${pad(f1(mean), 9)}  ${pad(surcharge(tier), 5)}  ${pad(lad, 7)}   ${pad(f1(gross), 11)}   ` +
          `${pad(perMatch(tier, i, STRAIGHT), 8)}  ${pad(perMatch(tier, i, HARD), 4)}`,
      )
    }
  }
}

// ---- TABLE 2: measured, per run, by how many matches she played ------------------------------------------------------

function printRuns(): void {
  console.log('\n  MEASURED, per run, by matches played (k = she lost in round k, or won the title at k = last round)')
  console.log('  GROSS = tournamentRunStrain (no masseur). NET = GROSS - masseurTourRelief(k, GROSS, travelling). floor = all straight sets, ceil = all hard, epic = every match a 3-tiebreak epic')
  console.log('  tier      k        n   gross   net  net/match   floor-net  ceil-net  epic-net   floor-gross')
  for (const tier of TOP) {
    const runs = runsOf.get(tier)!
    for (let k = 1; k <= rounds(tier); k++) {
      const cell = runs.filter((r) => r.length === k)
      const lo = synth(tier, k, STRAIGHT)
      const hi = synth(tier, k, HARD)
      const ep = synth(tier, k, EPIC)
      if (cell.length === 0) {
        console.log(`  ${TIER_SHORT[tier].padEnd(8)}  ${pad(k, 2)}        0      –                       ${pad(lo.net, 9)}  ${pad(hi.net, 8)}  ${pad(ep.net, 8)}   ${pad(lo.gross, 11)}`)
        continue
      }
      const g = cell.reduce((a, r) => a + grossOf(tier, r), 0) / cell.length
      const n = cell.reduce((a, r) => a + netOf(tier, r), 0) / cell.length
      const star = cell.length < THIN ? '*' : ' '
      console.log(
        `  ${TIER_SHORT[tier].padEnd(8)}  ${pad(k, 2)}  ${pad(cell.length, 7)}${star} ${pad(f1(g), 6)}  ${pad(f1(n), 4)}  ${pad(f1(n / k), 9)}   ` +
          `${pad(lo.net, 9)}  ${pad(hi.net, 8)}  ${pad(ep.net, 8)}   ${pad(lo.gross, 11)}`,
      )
    }
    const all = runs
    const mk = all.reduce((a, r) => a + r.length, 0) / all.length
    const mg = all.reduce((a, r) => a + grossOf(tier, r), 0) / all.length
    const mn = all.reduce((a, r) => a + netOf(tier, r), 0) / all.length
    console.log(`  ${TIER_SHORT[tier].padEnd(8)}  ALL ${pad(all.length, 7)}   mean matches ${f1(mk)}  mean gross ${f1(mg)}  mean net ${f1(mn)}  gross/match ${f1(mg / mk)}  net/match ${f1(mn / mk)}`)
  }
}

// ---- TABLE 3: the owner's five figures against the model -----------------------------------------------------------------

function printOwner(): void {
  console.log("\n  THE OWNER'S FIVE FIGURES, read as NET with the masseur travelling (3 per night between rounds)")
  console.log('  his reading              his%   gross floor  net floor  measured net  net ceil   his - net floor   gross-floor > his?')
  const cases: [TierId, number, number][] = [
    ['slam', 2, 8],
    ['wta250', 2, 10],
    ['wta1000', 3, 15],
    ['wta500', 5, 24],
    ['wta1000', 6, 26],
  ]
  for (const [tier, k, his] of cases) {
    const cell = runsOf.get(tier)!.filter((r) => r.length === k)
    const lo = synth(tier, k, STRAIGHT)
    const hi = synth(tier, k, HARD)
    const meanNet = cell.length ? cell.reduce((a, r) => a + netOf(tier, r), 0) / cell.length : NaN
    console.log(
      `  ${TIER_SHORT[tier].padEnd(8)} ${pad(k, 2)} matches    ${pad(his, 4)}   ${pad(lo.gross, 11)}  ${pad(lo.net, 9)}  ${pad(Number.isNaN(meanNet) ? '–' : f1(meanNet), 12)}  ${pad(hi.net, 8)}   ${pad(his - lo.net, 15)}   ${lo.gross > his ? 'YES – cannot be a gross figure' : 'no'}`,
    )
  }
}

// ---- TABLE 4: the options, as re-pricings of the same records ----------------------------------------------------------

type Patch = () => () => void

/** Patch ECONOMY in memory, hand back the undo – the fatigue bench's `withScenario` idiom. */
const patchLadder = (key: 'runFatigueLadder' | 'runFatigueLadderWta' | 'runFatigueLadderDeep', value: number[]): (() => void) => {
  const arr = ECONOMY.condition[key] as number[]
  const old = arr.slice()
  arr.length = 0
  arr.push(...value)
  return () => {
    arr.length = 0
    arr.push(...old)
  }
}
const patchSurcharge = (tier: TierId, delta: number): (() => void) => {
  const t = ECONOMY.condition.tierMatchFatigue as Record<TierId, number>
  const old = t[tier]
  t[tier] = old + delta
  return () => {
    t[tier] = old
  }
}
const patchRelief = (value: number): (() => void) => {
  const m = ECONOMY.masseur as { tourRecoveryPerRound: number }
  const old = m.tourRecoveryPerRound
  m.tourRecoveryPerRound = value
  return () => {
    m.tourRecoveryPerRound = old
  }
}

const SCENARIOS: { id: string; what: string; patch: Patch }[] = [
  { id: 'baseline', what: 'as shipped', patch: () => () => {} },
  {
    id: 'A-openers',
    what: 'runFatigueLadderWta [0,1,1,1,1] -> [-1,0,1,1,1]: the 32-draws open on the same 5-6-7 ramp the 1000 and the Slam have',
    patch: () => patchLadder('runFatigueLadderWta', [-1, 0, 1, 1, 1]),
  },
  {
    id: 'B-plateau',
    what: 'tierMatchFatigue wta250/wta500/wta1000/slam each -1: every top-rung match one cheaper, the ramps untouched',
    patch: () => {
      const undo = TOP.map((t) => patchSurcharge(t, -1))
      return () => undo.forEach((u) => u())
    },
  },
  {
    id: 'C-relief4',
    what: 'masseur.tourRecoveryPerRound 3 -> 4: the travelling masseur hands back one more per night (the kid with one only)',
    patch: () => patchRelief(4),
  },
  {
    id: 'D-tail',
    what: 'the 19.09 concave tail, HELD for his ruling (spec the-season-equation §10d, k=0.5): deep [-2,-1,0,0,-1,-1,-2], Wta [0,1,1,0,0]',
    patch: () => {
      const a = patchLadder('runFatigueLadderDeep', [-2, -1, 0, 0, -1, -1, -2])
      const b = patchLadder('runFatigueLadderWta', [0, 1, 1, 0, 0])
      return () => {
        a()
        b()
      }
    },
  },
]

function printScenarios(): void {
  console.log('\n  OPTIONS – the SAME collected scorelines priced under each tariff (a PREDICTION: exact for the tariff, silent on second-order effects)')
  for (const s of SCENARIOS) console.log(`    ${s.id.padEnd(10)} ${s.what}`)
  console.log('\n  mean NET toll by matches played k (masseur travelling) · "title" = the last column · then the all-runs mean')
  console.log('  scenario    tier       k=1    k=2    k=3    k=4    k=5    k=6    k=7    mean-net/run  mean-net/match  straight-title-net')
  for (const s of SCENARIOS) {
    const undo = s.patch()
    for (const tier of TOP) {
      const runs = runsOf.get(tier)!
      const cols: string[] = []
      for (let k = 1; k <= 7; k++) {
        if (k > rounds(tier)) {
          cols.push(pad('', 6))
          continue
        }
        const cell = runs.filter((r) => r.length === k)
        cols.push(pad(cell.length ? f1(cell.reduce((a, r) => a + netOf(tier, r), 0) / cell.length) : '–', 6))
      }
      const mn = runs.reduce((a, r) => a + netOf(tier, r), 0) / runs.length
      const mk = runs.reduce((a, r) => a + r.length, 0) / runs.length
      console.log(
        `  ${s.id.padEnd(10)}  ${TIER_SHORT[tier].padEnd(8)} ${cols.join(' ')}   ${pad(f1(mn), 12)}  ${pad(f1(mn / mk), 14)}  ${pad(synth(tier, rounds(tier), STRAIGHT).net, 18)}`,
      )
    }
    undo()
  }
}

// ---- output ----------------------------------------------------------------------------------------------------------------

console.log(
  `CONDITION DRAIN PROBE – ${WORLDS} worlds x ${TOP.length} tiers x ${QUANTILES.length} entrant quantiles [${QUANTILES.join(' ')}] x ${REPS} reps = ${totalRuns} runs` +
    (skipped ? ` (${skipped} skipped: field did not fill the draw)` : ''),
)
console.log(
  `  tariff: straightSets ${ECONOMY.condition.matchFatigue.straightSets}, hardMatch ${ECONOMY.condition.matchFatigue.hardMatch}, ` +
    `+${ECONOMY.condition.matchFatigue.extraTiebreaks} for a third tiebreak · masseur relief ${ECONOMY.masseur.tourRecoveryPerRound}/night · ` +
    `ladders: deep ${JSON.stringify(ECONOMY.condition.runFatigueLadderDeep)} (draw > 32), W ${JSON.stringify(ECONOMY.condition.runFatigueLadderWta)}`,
)
printTariff('TABLE 0 – THE TARIFF (no dice)')
printRounds()
printRuns()
printOwner()
printScenarios()

if (CSV) {
  writeFileSync(CSV, csvRows().join('\n') + '\n')
  console.log(`\n  per-cell rows written to ${CSV}`)
}
