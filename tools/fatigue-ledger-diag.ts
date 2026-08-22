/**
 * DIAGNOSIS SCRIPT – wave/sim-health, 22.08. Answers three questions about the doctor's-veto
 * inversion in tests/fatigue-bench-planner.test.ts, with numbers per hypothesis:
 *   H1  does the degenerate policy die/derank early and stop having entries to veto?
 *   H2  does it get injured out (consequences landing as injuries rather than vetoes)?
 *   H3  does the managed policy under-rest for the post-coach-edge world (instrument defect)?
 * Plus the FULL consequence ledger for all three policies (vetoes, injuries, weeks lost,
 * career-ending injuries, rank, prize).
 *
 * Run: npx vite-node tools/fatigue-ledger-diag.ts
 */

// MUST come before the dynamic import below – same reason and same shape as tools/points-curve.ts:
// fatigue-bench.ts self-runs its whole main() on a bare import outside vitest, and a static import
// is hoisted above any assignment. Type-only imports stay static: they are erased.
process.env.TB_BENCH_NO_AUTORUN = '1'

import { tierOpenFor, availabilityStatus, travelCostFor, kidPoints } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import type { InjurySeverity } from '../src/shared/protocol'
import type { Policy, Profile } from './fatigue-bench'

const { PROFILES, POLICIES, openFatigueCareer, stepFatigueWeek, ENTRY_LOOKAHEAD } = await import(
  './fatigue-bench'
)

const grinder = POLICIES.find((p) => p.id === 'grinder')!
const balanced = POLICIES.find((p) => p.id === 'balanced')!
const careful = POLICIES.find((p) => p.id === 'careful')!
const H104 = 104

interface Diag {
  profile: string
  policy: string
  seed: number
  // the test's own counters
  medicalBlocks: number
  medicalWithdrawals: number
  medicalWarnings: number
  weeksBelowFloor: number
  weeksAt0: number
  entries: number
  matches: number
  wins: number
  practices: number
  // consequences
  injuriesTotal: number
  injuriesBySeverity: Record<InjurySeverity, number>
  weeksInjured: number
  endingType: string | null
  endedWeek: number | null
  bestRank: number | null
  endPoints: number
  prizeCents: number
  endFundsCents: number
  weeksToBankrupt: number | null
  // H1/H2 classification: why a week below the medical floor produced NO countable veto
  floorWeeksEnded: number // career already over (nothing to veto, forever)
  floorWeeksInjured: number // in rehab (refusal is 'injury', not 'medical')
  floorWeeksNoCandidate: number // no eligible event inside the commit window that week
  floorWeeksBroke: number // medical refusal happened but was NOT counted: could not pay anyway
  floorWeeksVetoed: number // >=1 countable medical block that week (the doctor actually spoke)
  floorWeeksCarefulSkip: number // careful's own margin skipped before any veto could apply
  deadWeeks: number // weeks lived with world.ending latched
}

function runDiag(profile: Profile, policy: Policy, seed: number): Diag {
  const { world, rng } = openFatigueCareer(profile, policy, seed)
  const plannerState = { practiceEligibleIdx: 0, seaBookedYears: new Set<number>() }
  const floor = ECONOMY.availability.medicalFloor
  const sev: Record<InjurySeverity, number> = { minor: 0, moderate: 0, major: 0, severe: 0 }
  const d: Diag = {
    profile: profile.label,
    policy: policy.id,
    seed,
    medicalBlocks: 0,
    medicalWithdrawals: 0,
    medicalWarnings: 0,
    weeksBelowFloor: 0,
    weeksAt0: 0,
    entries: 0,
    matches: 0,
    wins: 0,
    practices: 0,
    injuriesTotal: 0,
    injuriesBySeverity: sev,
    weeksInjured: 0,
    endingType: null,
    endedWeek: null,
    bestRank: null,
    endPoints: 0,
    prizeCents: 0,
    endFundsCents: 0,
    weeksToBankrupt: null,
    floorWeeksEnded: 0,
    floorWeeksInjured: 0,
    floorWeeksNoCandidate: 0,
    floorWeeksBroke: 0,
    floorWeeksVetoed: 0,
    floorWeeksCarefulSkip: 0,
    deadWeeks: 0,
  }
  for (let i = 0; i < H104; i++) {
    // --- pre-tick classification of THIS week's entry decisions (mirrors the bench's loop) ---
    const preBelowFloor = world.condition < floor
    const preEnded = world.ending !== null
    const preInjured = world.injury !== null
    if (preEnded) d.deadWeeks++
    if (preBelowFloor && !preEnded) {
      // scan the same candidate set the bench's entry loop scans, classify the refusals
      let candidates = 0
      let vetoCountable = 0
      let vetoBroke = 0
      let carefulSkip = 0
      for (const e of world.season) {
        if (world.entries.includes(e.id)) continue
        if (world.week > e.deadlineWeek) continue
        if (e.deadlineWeek - world.week > ENTRY_LOOKAHEAD) continue
        if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
        if (!tierOpenFor(world, e.tier)) continue
        candidates++
        const avail = availabilityStatus(world, e)
        if (avail.level === 'blocked') {
          if (avail.reason === 'medical') {
            if (world.fundsCents >= TIERS[e.tier].entryFeeCents + travelCostFor(world, e)) vetoCountable++
            else vetoBroke++
          }
          continue
        }
        if (
          policy.entryConditionMargin !== null &&
          world.condition < ECONOMY.availability.minConditionToEnter[e.tier] + policy.entryConditionMargin
        )
          carefulSkip++
      }
      if (preInjured) d.floorWeeksInjured++
      else if (candidates === 0) d.floorWeeksNoCandidate++
      else if (vetoCountable > 0) d.floorWeeksVetoed++
      else if (vetoBroke > 0) d.floorWeeksBroke++
      else if (carefulSkip > 0) d.floorWeeksCarefulSkip++
      else d.floorWeeksNoCandidate++
    }
    if (preBelowFloor && preEnded) d.floorWeeksEnded++

    const eidBefore = world.nextEventId
    const f = stepFatigueWeek(world, rng, policy, plannerState)
    d.medicalBlocks += f.medicalBlocks
    if (f.medicalWithdrawal) d.medicalWithdrawals++
    d.medicalWarnings += f.medicalWarnings
    if (f.belowMedicalFloor) d.weeksBelowFloor++
    if (f.condition === ECONOMY.condition.min) d.weeksAt0++
    d.entries += f.entriesCommitted
    d.matches += f.matchScores.length
    d.wins += f.wins
    if (f.practiced) d.practices++
    if (f.injured) d.weeksInjured++
    if (f.injuryOnset) {
      d.injuriesTotal++
      sev[f.injuryOnset.severity]++
    }
    if (d.weeksToBankrupt === null && f.fundsCents < 0) d.weeksToBankrupt = f.week
    if (d.endingType === null && world.ending) {
      d.endingType = world.ending.type
      d.endedWeek = world.ending.week
    }
    d.prizeCents += world.events
      .filter((ev) => ev.id >= eidBefore && ev.category === 'prize' && (ev.amountCents ?? 0) > 0)
      .reduce((s, ev) => s + (ev.amountCents ?? 0), 0)
    if (kidPoints(world, 'itf') > 0 && (d.bestRank === null || world.kidRank < d.bestRank)) d.bestRank = world.kidRank
  }
  d.endPoints = kidPoints(world, 'itf')
  d.endFundsCents = world.fundsCents
  return d
}

const pad = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)

// ---------- PART A: the test's exact cells (seed 3), per profile ----------
console.log('PART A – the test cells (seed 3, 104w), per profile x policy')
console.log(
  pad('profile', 30) +
    pad('policy', 10) +
    padL('blocks', 7) +
    padL('wdraw', 7) +
    padL('warn', 6) +
    padL('<floor', 7) +
    padL('at0', 5) +
    padL('entries', 8) +
    padL('inj', 5) +
    padL('wkInj', 6) +
    padL('ending', 12) +
    padL('@wk', 5) +
    padL('deadWks', 8) +
    padL('fl:end', 7) +
    padL('fl:inj', 7) +
    padL('fl:noc', 7) +
    padL('fl:brk', 7) +
    padL('fl:veto', 8) +
    padL('fl:skip', 8),
)
const partA: Diag[] = []
for (const prof of PROFILES) {
  for (const pol of [grinder, balanced, careful]) {
    const d = runDiag(prof, pol, 3)
    partA.push(d)
    console.log(
      pad(d.profile, 30) +
        pad(d.policy, 10) +
        padL(d.medicalBlocks, 7) +
        padL(d.medicalWithdrawals, 7) +
        padL(d.medicalWarnings, 6) +
        padL(d.weeksBelowFloor, 7) +
        padL(d.weeksAt0, 5) +
        padL(d.entries, 8) +
        padL(d.injuriesTotal, 5) +
        padL(d.weeksInjured, 6) +
        padL(d.endingType ?? '-', 12) +
        padL(d.endedWeek ?? '-', 5) +
        padL(d.deadWeeks, 8) +
        padL(d.floorWeeksEnded, 7) +
        padL(d.floorWeeksInjured, 7) +
        padL(d.floorWeeksNoCandidate, 7) +
        padL(d.floorWeeksBroke, 7) +
        padL(d.floorWeeksVetoed, 8) +
        padL(d.floorWeeksCarefulSkip, 8),
    )
  }
}

// the test's own three aggregates, reproduced
const gA = partA.filter((d) => d.policy === 'grinder')
const mA = partA.filter((d) => d.policy !== 'grinder')
const shareOf = (rs: Diag[]) => rs.reduce((s, r) => s + r.weeksBelowFloor, 0) / (rs.length * H104)
console.log('\nTEST AGGREGATES (seed 3): grinder blocks=' + gA.reduce((s, r) => s + r.medicalBlocks, 0) +
  ' managed blocks=' + mA.reduce((s, r) => s + r.medicalBlocks, 0) +
  ' | grinder wdraw=' + gA.reduce((s, r) => s + r.medicalWithdrawals, 0) +
  ' managed wdraw=' + mA.reduce((s, r) => s + r.medicalWithdrawals, 0) +
  ' | grinderShare=' + shareOf(gA).toFixed(4) +
  ' managedShare=' + shareOf(mA).toFixed(4) +
  ' ratio=' + (shareOf(gA) / shareOf(mA)).toFixed(2) + 'x')

// ---------- PART B: the consequence ledger, seeds 0..9 pooled ----------
console.log('\nPART B – consequence ledger, 4 profiles x seeds 0..9 pooled, per policy (104w)')
const SEEDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
interface Pool {
  runs: Diag[]
}
const pools: Record<string, Pool> = { grinder: { runs: [] }, balanced: { runs: [] }, careful: { runs: [] } }
for (const prof of PROFILES) {
  for (const pol of [grinder, balanced, careful]) {
    for (const s of SEEDS) pools[pol.id].runs.push(runDiag(prof, pol, s))
  }
}
const sum = (rs: Diag[], f: (d: Diag) => number) => rs.reduce((s, r) => s + f(r), 0)
const mean = (rs: Diag[], f: (d: Diag) => number) => sum(rs, f) / rs.length
console.log(
  pad('metric (40 careers each)', 34) + padL('grinder', 12) + padL('balanced', 12) + padL('careful', 12),
)
const rowsB: [string, (d: Diag) => number, boolean][] = [
  ['medical blocks (total)', (d) => d.medicalBlocks, false],
  ['medical withdrawals (total)', (d) => d.medicalWithdrawals, false],
  ['medical warnings (total)', (d) => d.medicalWarnings, false],
  ['weeks below floor (total)', (d) => d.weeksBelowFloor, false],
  ['weeks at 0 (total)', (d) => d.weeksAt0, false],
  ['injur onsets (total)', (d) => d.injuriesTotal, false],
  ['  minor', (d) => d.injuriesBySeverity.minor, false],
  ['  moderate', (d) => d.injuriesBySeverity.moderate, false],
  ['  major', (d) => d.injuriesBySeverity.major, false],
  ['  severe', (d) => d.injuriesBySeverity.severe, false],
  ['weeks lost injured (total)', (d) => d.weeksInjured, false],
  ['career-ending injuries', (d) => (d.endingType === 'injury' ? 1 : 0), false],
  ['bankruptcy endings', (d) => (d.endingType === 'bankruptcy' ? 1 : 0), false],
  ['careers ever red', (d) => (d.weeksToBankrupt !== null ? 1 : 0), false],
  ['dead weeks (career over)', (d) => d.deadWeeks, false],
  ['entries (mean/career)', (d) => d.entries, true],
  ['matches (mean/career)', (d) => d.matches, true],
  ['wins (mean/career)', (d) => d.wins, true],
  ['practices (mean/career)', (d) => d.practices, true],
  ['end ITF points (mean)', (d) => d.endPoints, true],
  ['prize $ (mean/career)', (d) => d.prizeCents / 100, true],
  ['end funds $ (mean)', (d) => d.endFundsCents / 100, true],
]
for (const [label, f, asMean] of rowsB) {
  const v = (id: string) => (asMean ? mean(pools[id].runs, f).toFixed(1) : sum(pools[id].runs, f))
  console.log(pad(label, 34) + padL(v('grinder'), 12) + padL(v('balanced'), 12) + padL(v('careful'), 12))
}
const ranked = (rs: Diag[]) => rs.filter((r) => r.bestRank !== null)
for (const id of ['grinder', 'balanced', 'careful']) {
  const rk = ranked(pools[id].runs)
  console.log(
    pad(`best rank (${id})`, 34) +
      ` mean ${rk.length ? (rk.reduce((s, r) => s + (r.bestRank as number), 0) / rk.length).toFixed(1) : '-'} over ${rk.length}/40 ranked`,
  )
}

// floor-week classification pooled (the veto-suppression channels), per policy
console.log('\nfloor-week classification, pooled 40 careers per policy (why a sub-floor week produced no countable veto)')
for (const id of ['grinder', 'balanced', 'careful']) {
  const rs = pools[id].runs
  console.log(
    pad(id, 10) +
      ` floorWeeks=${sum(rs, (d) => d.weeksBelowFloor)}` +
      ` vetoed=${sum(rs, (d) => d.floorWeeksVetoed)}` +
      ` broke(suppressed)=${sum(rs, (d) => d.floorWeeksBroke)}` +
      ` injured=${sum(rs, (d) => d.floorWeeksInjured)}` +
      ` noCandidate=${sum(rs, (d) => d.floorWeeksNoCandidate)}` +
      ` ended=${sum(rs, (d) => d.floorWeeksEnded)}` +
      ` carefulSkip=${sum(rs, (d) => d.floorWeeksCarefulSkip)}`,
  )
}

// ---------- PART C: the aggregates a rewritten test would pin, on seeds 0-3 ----------
console.log('\nPART C – seeds 0-3 x 4 profiles (the sample the test file already uses for its veto sweep)')
const s03 = (id: string) => pools[id].runs.filter((d) => d.seed <= 3)
const g03 = s03('grinder')
const m03 = [...s03('balanced'), ...s03('careful')]
const shr = (rs: Diag[]) => sum(rs, (d) => d.weeksBelowFloor) / (rs.length * H104)
console.log(`grinder runs=${g03.length} managed runs=${m03.length}`)
console.log(`under-floor share: grinder=${shr(g03).toFixed(4)} managed=${shr(m03).toFixed(4)} ratio=${(shr(g03) / shr(m03)).toFixed(2)}x`)
console.log(`blocks/career: grinder=${(sum(g03, (d) => d.medicalBlocks) / g03.length).toFixed(2)} managed=${(sum(m03, (d) => d.medicalBlocks) / m03.length).toFixed(2)}`)
console.log(`withdrawals/career: grinder=${(sum(g03, (d) => d.medicalWithdrawals) / g03.length).toFixed(2)} managed=${(sum(m03, (d) => d.medicalWithdrawals) / m03.length).toFixed(2)}`)
console.log(`warnings/career: grinder=${(sum(g03, (d) => d.medicalWarnings) / g03.length).toFixed(2)} managed=${(sum(m03, (d) => d.medicalWarnings) / m03.length).toFixed(2)}`)
console.log(`wins/career: grinder=${(sum(g03, (d) => d.wins) / g03.length).toFixed(1)} balanced=${(sum(s03('balanced'), (d) => d.wins) / 16).toFixed(1)} careful=${(sum(s03('careful'), (d) => d.wins) / 16).toFixed(1)}`)
console.log(`endPoints/career: grinder=${(sum(g03, (d) => d.endPoints) / g03.length).toFixed(1)} balanced=${(sum(s03('balanced'), (d) => d.endPoints) / 16).toFixed(1)} careful=${(sum(s03('careful'), (d) => d.endPoints) / 16).toFixed(1)}`)
console.log(`ranked careers: grinder=${g03.filter((d) => d.bestRank !== null).length}/16 balanced=${s03('balanced').filter((d) => d.bestRank !== null).length}/16 careful=${s03('careful').filter((d) => d.bestRank !== null).length}/16`)
console.log(`prize $/career: grinder=${(sum(g03, (d) => d.prizeCents) / 100 / 16).toFixed(0)} balanced=${(sum(s03('balanced'), (d) => d.prizeCents) / 100 / 16).toFixed(0)} careful=${(sum(s03('careful'), (d) => d.prizeCents) / 100 / 16).toFixed(0)}`)
console.log(`injuries total: grinder=${sum(g03, (d) => d.injuriesTotal)} balanced=${sum(s03('balanced'), (d) => d.injuriesTotal)} careful=${sum(s03('careful'), (d) => d.injuriesTotal)}`)
console.log(`matches total: grinder=${sum(g03, (d) => d.matches)} balanced=${sum(s03('balanced'), (d) => d.matches)} careful=${sum(s03('careful'), (d) => d.matches)}`)
console.log(`inj per 100 matches: grinder=${((100 * sum(g03, (d) => d.injuriesTotal)) / sum(g03, (d) => d.matches)).toFixed(2)} balanced=${((100 * sum(s03('balanced'), (d) => d.injuriesTotal)) / sum(s03('balanced'), (d) => d.matches)).toFixed(2)} careful=${((100 * sum(s03('careful'), (d) => d.injuriesTotal)) / sum(s03('careful'), (d) => d.matches)).toFixed(2)}`)
console.log(`weeksInjured total: grinder=${sum(g03, (d) => d.weeksInjured)} balanced=${sum(s03('balanced'), (d) => d.weeksInjured)} careful=${sum(s03('careful'), (d) => d.weeksInjured)}`)

// per-seed ratio stability (pooled across profiles, per seed)
console.log('\nper-seed under-floor ratio (grinder share / managed share), 4 profiles pooled per seed')
for (const s of SEEDS) {
  const g = pools.grinder.runs.filter((d) => d.seed === s)
  const m = [...pools.balanced.runs, ...pools.careful.runs].filter((d) => d.seed === s)
  const gs = shr(g)
  const ms = shr(m)
  console.log(`  seed ${s}: grinder=${gs.toFixed(4)} managed=${ms.toFixed(4)} ratio=${ms === 0 ? 'inf' : (gs / ms).toFixed(2) + 'x'}`)
}
