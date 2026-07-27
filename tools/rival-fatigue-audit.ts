/**
 * RIVAL-FATIGUE AUDIT – does the cohort's reconstructed strain match the tennis it actually played?
 *
 * MEASUREMENT ONLY. Imports the engine, changes nothing, draws nothing from any stream the engine
 * uses (the entrant replay below builds its OWN `rngFromSeed` instances, exactly as the engine
 * does, so it can never perturb a career it is watching).
 *
 * WHY IT EXISTS. `season/rival.ts` reconstructs a cohort player's tournament strain from her rows
 * in `world.results`. Wave B ("a first-round loss pays ZERO") pulled SHE PLAYED and SHE SCORED
 * apart for the first time, and while the ledger write site guarded on `points > 0` a rival who
 * lost her opener left no row – so the reconstruction read her week as REST. Half of every draw.
 * This tool measures that gap directly, and it measures it the same way before and after a fix:
 *
 *   GROUND TRUTH (who really played) is replayed, not guessed. `runAiTournament` picks its field
 *   with `selectEntrants(event, cohort, aiRanking, rngFromSeed(seed:aitour:<event.id>))`, and every
 *   entrant of a full draw plays at least one match. All three inputs are reproducible from the
 *   world BEFORE the tick (the engine derives `aiRanking` at the top of the tick, before any of the
 *   week's own rows are appended – the same window `tools/fatigue-bench.ts` samples the cohort in),
 *   so the replay is the engine's own selection rather than an approximation of it. `--verify`
 *   asserts it: no player may hold a row in a week the replay says she was not entered in.
 *
 * WHAT IT REPORTS, per (profile × policy) cell and pooled:
 *   1. BLIND APPEARANCES – share of (rival, week) appearances whose reconstructed strain is 0.
 *      Reported twice: as the ENGINE reads the ledger, and under a POINTS-ONLY counterfactual
 *      (`results.filter(points > 0)`) which is exactly what the pre-fix reconstruction saw. The
 *      counterfactual is run on the SAME world, so it isolates the reconstruction from every
 *      downstream difference a real before/after run also carries.
 *   2. COHORT CONDITION – mean derived condition over the field, share below the strength knee,
 *      and the share of the field that is EVER below the doctor's floor. Both readings again.
 *   3. COHORT WIN% AGAINST THE KID, and the kid's end-of-season rank distribution.
 *   4. PRE-HISTORY row counts, total and scoreless (that path never had the guard).
 *
 * Axes are the fatigue bench's, borrowed wholesale (same PROFILES, POLICIES, seed strings
 * `fatigue-<background>-<i>`, same stepping), so a cell here is the same career as the matching
 * cell of `npm run bench:fatigue` and "same seeds before and after" is structural.
 *
 * Run:  npx vite-node tools/rival-fatigue-audit.ts
 *       npx vite-node tools/rival-fatigue-audit.ts -- --weeks 104 --seeds 20 --verify
 *       npx vite-node tools/rival-fatigue-audit.ts -- --json /tmp/before.json
 */

// MUST come before the dynamic import below – fatigue-bench.ts self-runs its whole sweep on import
// outside vitest. Same rule tools/points-curve.ts follows, and for the same reason.
process.env.TB_BENCH_NO_AUTORUN = '1'

import { writeFileSync } from 'node:fs'
import { KID_ID } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { computeRanking, type SeasonResult } from '../src/engine/season/ranking'
import { reconstructRun, rivalConditions } from '../src/engine/season/rival'
import { selectEntrants } from '../src/engine/season/tournament'
import { generateCohort } from '../src/engine/season/cohort'
import { generatePreHistory } from '../src/engine/season/prehistory'
import { rngFromSeed } from '../src/engine/rng'
import type { Profile, Policy } from './fatigue-bench'

const { PROFILES, POLICIES, openFatigueCareer, stepFatigueWeek, mean } = await import('./fatigue-bench')

// --- CLI ----------------------------------------------------------------------
const argv = process.argv.slice(2)
const flag = (name: string, fallback: number): number => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] !== undefined ? Number(argv[i + 1]) : fallback
}
const str = (name: string): string | null => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : null
}
const WEEKS = flag('weeks', 104)
const SEEDS = flag('seeds', 20)
const VERIFY = argv.includes('--verify')
const JSON_OUT = str('json')

/** The doctor's veto level, borrowed as a yardstick. Rivals have no medical gate – they never
 *  withdraw – so this is "how much of the field is in a state the game would not let the KID play
 *  in", not a rule the cohort obeys. */
const MEDICAL_FLOOR = ECONOMY.availability.medicalFloor
const KNEE = ECONOMY.condition.matchStrengthKnee
const MAXC = ECONOMY.condition.max

// --- one career ---------------------------------------------------------------

export interface CareerAudit {
  seed: string
  /** (rival, week) pairs in which she was entered in at least one draw. */
  appearances: number
  /** ...of those, how many the ENGINE's reconstruction charges no strain for. */
  blindEngine: number
  /** ...and how many a POINTS-ONLY ledger (the pre-fix reading) charges no strain for. */
  blindPointsOnly: number
  /** appearances that left no ledger row at all, as the engine writes it. */
  rowlessEngine: number
  /** rows found in a week the entrant replay says the holder was not in – must stay 0. */
  ghostRows: number
  /** mean cohort condition over every sampled week, engine read / points-only read. */
  condEngine: number
  condPointsOnly: number
  /** mean share of the field below the strength knee, both reads. */
  belowKneeEngine: number
  belowKneePointsOnly: number
  /** share of the field that dips under the doctor's floor at least once, both reads. */
  everBelowFloorEngine: number
  everBelowFloorPointsOnly: number
  /** the kid's record against the cohort. */
  kidWins: number
  kidLosses: number
  /** the kid's rank at each season wrap, and at the end of the run. */
  rankAtWrap: number[]
  endRank: number
  /** ledger rows written across the career (post-prune snapshot at the end). */
  endLedgerRows: number
  endLedgerZeroRows: number
}

export function auditCareer(profile: Profile, policy: Policy, index: number, weeks: number): CareerAudit {
  const { world, rng, seed } = openFatigueCareer(profile, policy, index)
  const plannerState = { practiceEligibleIdx: 0, seaBookedYears: new Set<number>() }
  const ids = world.cohort.map((p) => p.id)

  let appearances = 0
  let blindEngine = 0
  let blindPointsOnly = 0
  let rowlessEngine = 0
  let ghostRows = 0
  let condSumEngine = 0
  let condSumPointsOnly = 0
  let kneeSumEngine = 0
  let kneeSumPointsOnly = 0
  let samples = 0
  const everFloorEngine = new Set<string>()
  const everFloorPointsOnly = new Set<string>()
  let kidWins = 0
  let kidLosses = 0
  const rankAtWrap: number[] = []

  for (let i = 0; i < weeks; i++) {
    const w = world.week + 1

    // --- ground truth: the field the canonical brackets are about to select for week w ---------
    // `aiRanking` excludes the kid exactly as the engine's does; the ledger is untouched between
    // here and the tick, so both inputs are byte-identical to the engine's own.
    const aiRanking = computeRanking(
      world.results.filter((r) => r.playerId !== KID_ID),
      w,
      ids,
    )
    const entrants = new Set<string>()
    for (const e of world.season) {
      if (e.week !== w) continue
      const aiRng = rngFromSeed(`${world.seed}:aitour:${e.id}`)
      for (const p of selectEntrants(e, world.cohort, aiRanking, aiRng)) entrants.add(p.id)
    }

    // --- the two reads of the cohort's condition, at the week it takes the court ---------------
    const pointsOnly = world.results.filter((r) => r.points > 0)
    const cEngine = rivalConditions(world.results, w)
    const cPoints = rivalConditions(pointsOnly, w)
    let sumE = 0
    let sumP = 0
    let kneeE = 0
    let kneeP = 0
    for (const id of ids) {
      const ce = cEngine.get(id) ?? MAXC
      const cp = cPoints.get(id) ?? MAXC
      sumE += ce
      sumP += cp
      if (ce < KNEE) kneeE++
      if (cp < KNEE) kneeP++
      if (ce < MEDICAL_FLOOR) everFloorEngine.add(id)
      if (cp < MEDICAL_FLOOR) everFloorPointsOnly.add(id)
    }
    condSumEngine += sumE / ids.length
    condSumPointsOnly += sumP / ids.length
    kneeSumEngine += (100 * kneeE) / ids.length
    kneeSumPointsOnly += (100 * kneeP) / ids.length
    samples++

    const f = stepFatigueWeek(world, rng, policy, plannerState)
    kidWins += f.wins
    kidLosses += f.losses

    // --- what the ledger says about that same week, now that it has resolved ------------------
    const rows = new Map<string, SeasonResult[]>()
    for (const r of world.results) {
      if (r.week !== w || r.playerId === KID_ID) continue
      const list = rows.get(r.playerId)
      if (list) list.push(r)
      else rows.set(r.playerId, [r])
    }
    for (const id of entrants) {
      appearances++
      const mine = rows.get(id)
      if (!mine) rowlessEngine++
      const strainEngine = (mine ?? []).reduce((s, r) => s + reconstructRun(r).strain, 0)
      const strainPoints = (mine ?? [])
        .filter((r) => r.points > 0)
        .reduce((s, r) => s + reconstructRun(r).strain, 0)
      if (strainEngine === 0) blindEngine++
      if (strainPoints === 0) blindPointsOnly++
    }
    if (VERIFY) for (const id of rows.keys()) if (!entrants.has(id)) ghostRows++

    if (w % 52 === 51) rankAtWrap.push(world.kidRank)
  }

  return {
    seed,
    appearances,
    blindEngine,
    blindPointsOnly,
    rowlessEngine,
    ghostRows,
    condEngine: condSumEngine / samples,
    condPointsOnly: condSumPointsOnly / samples,
    belowKneeEngine: kneeSumEngine / samples,
    belowKneePointsOnly: kneeSumPointsOnly / samples,
    everBelowFloorEngine: (100 * everFloorEngine.size) / ids.length,
    everBelowFloorPointsOnly: (100 * everFloorPointsOnly.size) / ids.length,
    kidWins,
    kidLosses,
    rankAtWrap,
    endRank: world.kidRank,
    endLedgerRows: world.results.length,
    endLedgerZeroRows: world.results.filter((r) => r.points === 0).length,
  }
}

// --- aggregation ---------------------------------------------------------------

const pct = (num: number, den: number) => (den === 0 ? 0 : (100 * num) / den)
const f1 = (x: number) => x.toFixed(1)
const pad = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))
const padL = (s: string, n: number) => (s.length >= n ? s : ' '.repeat(n - s.length) + s)

function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

interface Cell {
  profile: string
  policy: string
  runs: CareerAudit[]
}

function summarise(runs: CareerAudit[]) {
  const appearances = runs.reduce((s, r) => s + r.appearances, 0)
  const kidMatches = runs.reduce((s, r) => s + r.kidWins + r.kidLosses, 0)
  const ranks = runs.map((r) => r.endRank)
  return {
    appearances,
    blindEngine: pct(runs.reduce((s, r) => s + r.blindEngine, 0), appearances),
    blindPointsOnly: pct(runs.reduce((s, r) => s + r.blindPointsOnly, 0), appearances),
    rowless: pct(runs.reduce((s, r) => s + r.rowlessEngine, 0), appearances),
    ghostRows: runs.reduce((s, r) => s + r.ghostRows, 0),
    condEngine: mean(runs.map((r) => r.condEngine)),
    condPointsOnly: mean(runs.map((r) => r.condPointsOnly)),
    belowKneeEngine: mean(runs.map((r) => r.belowKneeEngine)),
    belowKneePointsOnly: mean(runs.map((r) => r.belowKneePointsOnly)),
    everFloorEngine: mean(runs.map((r) => r.everBelowFloorEngine)),
    everFloorPointsOnly: mean(runs.map((r) => r.everBelowFloorPointsOnly)),
    cohortWinPct: pct(runs.reduce((s, r) => s + r.kidLosses, 0), kidMatches),
    kidMatches,
    rankMean: mean(ranks),
    rankMedian: median(ranks),
    rankBest: Math.min(...ranks),
    rankWorst: Math.max(...ranks),
    // The rank DISTRIBUTION, off every season wrap rather than the last week alone: an end-of-run
    // rank is one sample taken deep in an off-season, and the wrap ranks are what the outcome
    // targets are written against.
    wrapMean: mean(runs.flatMap((r) => r.rankAtWrap)),
    wrapMedian: median(runs.flatMap((r) => r.rankAtWrap)),
    bestWrapMean: mean(runs.map((r) => Math.min(...r.rankAtWrap))),
    top10: pct(runs.filter((r) => Math.min(...r.rankAtWrap) <= 10).length, runs.length),
    top20: pct(runs.filter((r) => Math.min(...r.rankAtWrap) <= 20).length, runs.length),
    top50: pct(runs.filter((r) => Math.min(...r.rankAtWrap) <= 50).length, runs.length),
    ledgerRows: mean(runs.map((r) => r.endLedgerRows)),
    ledgerZeroRows: mean(runs.map((r) => r.endLedgerZeroRows)),
  }
}

// --- pre-history (path 2, unchanged by any live-path fix) ----------------------
const PREHISTORY_SEEDS = ['fresh-ph', 'bench-wealthy-0', 'counting']

function prehistoryRows() {
  return PREHISTORY_SEEDS.map((seed) => {
    const rows = generatePreHistory(seed, generateCohort(seed))
    const zero = rows.filter((r) => r.points === 0).length
    const ranking = computeRanking(rows, 0, generateCohort(seed).map((p) => p.id))
    return { seed, total: rows.length, zero, zeroPct: pct(zero, rows.length), atZeroPoints: ranking.filter((r) => r.points === 0).length }
  })
}

// --- main ----------------------------------------------------------------------

function main(): void {
  const t0 = Date.now()
  const cells: Cell[] = []
  for (const profile of PROFILES) {
    for (const policy of POLICIES) {
      const runs: CareerAudit[] = []
      for (let i = 0; i < SEEDS; i++) runs.push(auditCareer(profile, policy, i, WEEKS))
      cells.push({ profile: profile.label, policy: policy.id, runs })
    }
  }
  const all = cells.flatMap((c) => c.runs)
  const pooled = summarise(all)

  const out: string[] = []
  out.push('')
  out.push('RIVAL-FATIGUE AUDIT — does the cohort pay for the tennis it played?')
  out.push(
    `  ${PROFILES.length} profiles × ${POLICIES.length} policies × ${SEEDS} seeds × ${WEEKS}w` +
      `  ·  cohort ${all.length ? '199' : '0'}  ·  fatigue window ${ECONOMY.condition.rivalFatigueWindowWeeks}w` +
      `  ·  knee ${KNEE}  ·  doctor's floor ${MEDICAL_FLOOR}`,
  )
  out.push('')
  out.push('1. BLIND APPEARANCES — a (rival, week) pair she was entered in, charged NO strain')
  out.push(
    `  ${pad('read', 24)}${padL('appearances', 13)}${padL('blind', 10)}${padL('blind %', 10)}`,
  )
  const blindE = Math.round((pooled.blindEngine * pooled.appearances) / 100)
  const blindP = Math.round((pooled.blindPointsOnly * pooled.appearances) / 100)
  out.push(`  ${pad('engine (ledger as-is)', 24)}${padL(String(pooled.appearances), 13)}${padL(String(blindE), 10)}${padL(f1(pooled.blindEngine), 10)}`)
  out.push(`  ${pad('points-only (pre-fix)', 24)}${padL(String(pooled.appearances), 13)}${padL(String(blindP), 10)}${padL(f1(pooled.blindPointsOnly), 10)}`)
  out.push(`  appearances that left NO row at all (engine): ${f1(pooled.rowless)}%`)
  if (VERIFY) out.push(`  ghost rows (a row in a week the replay says she was not entered): ${pooled.ghostRows}`)
  out.push('')
  out.push('2. COHORT CONDITION across the run')
  out.push(`  ${pad('read', 24)}${padL('mean cond', 11)}${padL('% < knee', 11)}${padL('% ever < floor', 16)}`)
  out.push(
    `  ${pad('engine (ledger as-is)', 24)}${padL(f1(pooled.condEngine), 11)}${padL(f1(pooled.belowKneeEngine), 11)}${padL(f1(pooled.everFloorEngine), 16)}`,
  )
  out.push(
    `  ${pad('points-only (pre-fix)', 24)}${padL(f1(pooled.condPointsOnly), 11)}${padL(f1(pooled.belowKneePointsOnly), 11)}${padL(f1(pooled.everFloorPointsOnly), 16)}`,
  )
  out.push('')
  out.push('3. THE KID AGAINST THAT FIELD')
  out.push(
    `  cohort win% vs the kid: ${f1(pooled.cohortWinPct)}  (${pooled.kidMatches} kid matches)` +
      `   ·  kid rank at end: mean ${f1(pooled.rankMean)} median ${pooled.rankMedian} best ${pooled.rankBest} worst ${pooled.rankWorst}`,
  )
  out.push(
    `  kid rank over ALL season wraps: mean ${f1(pooled.wrapMean)} median ${pooled.wrapMedian}` +
      `  ·  best wrap rank per career: mean ${f1(pooled.bestWrapMean)}` +
      `  ·  careers ever top-10 ${f1(pooled.top10)}%  top-20 ${f1(pooled.top20)}%  top-50 ${f1(pooled.top50)}%`,
  )
  out.push(`  ledger at end of run: ${f1(pooled.ledgerRows)} rows, of which ${f1(pooled.ledgerZeroRows)} scoreless`)
  out.push('')
  out.push('4. PER CELL')
  out.push(
    `  ${pad('profile', 30)}${pad('policy', 10)}${padL('blind%', 8)}${padL('blind%', 8)}${padL('cond', 7)}${padL('cond', 7)}${padL('win%', 7)}${padL('rank', 7)}`,
  )
  out.push(`  ${pad('', 30)}${pad('', 10)}${padL('engine', 8)}${padL('pts-only', 8)}${padL('eng', 7)}${padL('pts', 7)}${padL('cohort', 7)}${padL('median', 7)}`)
  for (const c of cells) {
    const s = summarise(c.runs)
    out.push(
      `  ${pad(c.profile, 30)}${pad(c.policy, 10)}${padL(f1(s.blindEngine), 8)}${padL(f1(s.blindPointsOnly), 8)}` +
        `${padL(f1(s.condEngine), 7)}${padL(f1(s.condPointsOnly), 7)}${padL(f1(s.cohortWinPct), 7)}${padL(String(s.rankMedian), 7)}`,
    )
  }
  out.push('')
  out.push('5. PRE-HISTORY (season/prehistory.ts — the path that never had the guard)')
  const ph = prehistoryRows()
  out.push(`  ${pad('seed', 20)}${padL('rows', 8)}${padL('scoreless', 12)}${padL('%', 8)}${padL('players on 0 pts', 19)}`)
  for (const p of ph) {
    out.push(`  ${pad(p.seed, 20)}${padL(String(p.total), 8)}${padL(String(p.zero), 12)}${padL(f1(p.zeroPct), 8)}${padL(String(p.atZeroPoints), 19)}`)
  }
  out.push('')
  out.push(`  (${((Date.now() - t0) / 1000).toFixed(1)}s)`)
  out.push('')
  console.log(out.join('\n'))

  if (JSON_OUT) {
    writeFileSync(
      JSON_OUT,
      JSON.stringify(
        {
          weeks: WEEKS,
          seeds: SEEDS,
          pooled,
          cells: cells.map((c) => ({ profile: c.profile, policy: c.policy, ...summarise(c.runs) })),
          prehistory: ph,
        },
        null,
        2,
      ),
    )
  }
}

if (!process.env.VITEST) main()
