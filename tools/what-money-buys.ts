/**
 * what-money-buys – WHAT GATES THE LADDER, WHAT A COACH RUNG IS WORTH, AND WHEN MONEY STOPS BEING
 * A DECISION.
 *
 * The setup is two of the owner's own careers, and the contrast is the whole question:
 *
 *   olivia  age 20.8  headroom 37.5 (p0.7)  skills 269.6  SELF-COACHED  funds $323,491  wta500 #71
 *   naomi   age 21.8  headroom 71.1 (p50)   skills 313.5  middle coach  funds   $8,070  w75
 *
 * Naomi is 44 skill points the better player and forty times poorer, and she is two rungs lower.
 * So the hypothesis under test is that the ladder is gated by the WALLET rather than by the RACKET.
 * n=2 is an anecdote; this file reproduces the contrast at scale.
 *
 * ⚠ MEASUREMENT ONLY, and the constant discipline is the same one growth-age-sweep.ts uses. §5 is
 * the ONLY section that patches anything, it patches `ECONOMY.coach.hourlyRateCents` in place, and
 * it restores in a `finally` and exits 1 if the restore did not take. Every other section runs
 * against the engine exactly as it ships. Nothing is committed, derived or quoted from a personal
 * save beyond the aggregates §6 prints.
 *
 * THE THREE QUESTIONS:
 *
 *   §1 WHAT GATES THE LADDER? A PAIRED ABLATION. The same seeds run five ways – as shipped, with the
 *      wallet defused, with health defused, with both, and screened for top-decile talent. Whichever
 *      arm collapses the climb is the gate. Pairing is exact: `openCareer`'s seed is
 *      `bench-<background>-<index>` and `startingSkills` ignores the profile, so an arm is the same
 *      girl under a different constraint.
 *   §2 THE COACH LADDER, PRICED. All five rungs inside one background, same seeds, self-coaching as
 *      the control. What each rung costs over a career against what it delivers: development, the
 *      radar's own accuracy, the physio, weeks lost, entries, rank, prize.
 *   §3 WHEN DOES MONEY STOP BEING A DECISION? Per week, per career: does the budget refuse the
 *      biggest trip her ranking already opens? The last week it ever does is the crossover.
 *   §4 THE EXCHANGE RATE AND THE LOOP. A lump grant at week 0, swept over six levels: what a
 *      thousand dollars buys in rungs, and how many dollars of prize a granted dollar returns.
 *   §5 THE OWNER'S TWO PROPOSALS, priced without shipping either.
 *   §6 THE TWO SAVES, read locally through the engine's own import door.
 *
 * Run:
 *   npx vite-node tools/what-money-buys.ts -- --only 0                       # arithmetic, instant
 *   npx vite-node tools/what-money-buys.ts -- --only 1 --seeds 20            # 100 careers
 *   npx vite-node tools/what-money-buys.ts -- --only 2,3 --seeds 16          # 240 careers
 *   npx vite-node tools/what-money-buys.ts -- --only 4 --seeds 16            # 96 careers
 *   npx vite-node tools/what-money-buys.ts -- --only 5 --seeds 12            # 72 careers
 *   npx vite-node tools/what-money-buys.ts -- --only 6 --save <a .tsave>     # local only
 */
import { readFileSync } from 'node:fs'
import { openCareer, stepCareerWeek, PRESETS, POLICIES, ENTRY_LOOKAHEAD, type EntryVeto, type Preset, type Policy } from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import { answerFork, answerRetirement, type WorldState } from '../src/engine/world'
import { kidPoints, tierOpenFor, tierFloorOpen } from '../src/engine/world/ladder'
import { travelCostFor } from '../src/engine/world/sponsors'
import { startingSkills } from '../src/engine/world/player'
import { kidAgeExact } from '../src/engine/world/age'
import { decodeExportFile } from '../src/engine/saveCodec'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { SKILL_KEYS, rollPotential, ageFactor, trainFactor } from '../src/engine/development'
import {
  COACH_TIERS,
  coachRateBandCents,
  coachHoursForPlan,
  coachCorridorMid,
  coachWeeklyCents,
  facilityRateCents,
  physioQuality,
  physioRiskFactor,
  physioRecoveryFactor,
  coachFactor,
  coachSeasonUplift,
} from '../src/engine/coach'
import { COACH_ACCURACY, COACH_EYE, bandFor } from '../src/engine/radar'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CareerEnding, type CoachTier, type FamilyBackground, type PlayerProfile, type WorldEventCategory } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

// -------------------------------------------------------------------------------------------------
// args
// -------------------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 16)
const TALENT_SCAN = argOf('talent-scan', 4000)
const onlyArg = args.indexOf('--only') >= 0 ? (args[args.indexOf('--only') + 1] ?? '') : ''
const ONLY = new Set(onlyArg.split(',').filter(Boolean))
const wants = (s: string): boolean => ONLY.size === 0 || ONLY.has(s)
const SAVES: string[] = []
for (let i = 0; i < args.length; i++) if (args[i] === '--save') SAVES.push(args[++i])

/** The manager. `player` throughout – the arm potential-band-sweep §3 and ladder-vs-targets §2 use,
 *  so every figure here is comparable with theirs. */
const POLICY: Policy = POLICIES[1]

/** Money never binds. Ten million dollars is not a balance – it is the absence of one. */
const INFINITE_CENTS = 10_000_000_00

// -------------------------------------------------------------------------------------------------
// small helpers
// -------------------------------------------------------------------------------------------------
function pad(s: string | number, w: number): string {
  return String(s).padStart(w)
}
function padEnd(s: string | number, w: number): string {
  return String(s).padEnd(w)
}
function rule(n = 112): string {
  return '='.repeat(n)
}
function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}
function pctl(xs: readonly number[], q: number): number {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))]
}
function mean(xs: readonly number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
}
function shareOf(hits: number, of: number): string {
  return of === 0 ? '   –' : `${((100 * hits) / of).toFixed(1)}%`
}
/** The W rungs, strongest last – the ladder the owner counts in. */
const W_RUNGS: TierId[] = TIER_LADDER.filter((t) => TIERS[t].track === 'wta')

// -------------------------------------------------------------------------------------------------
// TALENT, as an exact POPULATION percentile (the derivation ladder-vs-targets.ts §3a documents)
// -------------------------------------------------------------------------------------------------
function irwinHall5CDF(s: number): number {
  if (s <= 0) return 0
  if (s >= 5) return 1
  const C = [1, 5, 10, 10, 5, 1]
  let sum = 0
  for (let k = 0; k <= Math.floor(s); k++) sum += (k % 2 === 0 ? 1 : -1) * C[k] * (s - k) ** 5
  return sum / 120
}
function headroomOf(seed: string, profile: PlayerProfile): number {
  const start = startingSkills(seed, profile)
  const potential = rollPotential(seed, start)
  return SKILL_KEYS.reduce((a, k) => a + (potential[k] - start[k]), 0)
}
function headroomPercentile(headroom: number): number {
  const [lo, hi] = ECONOMY.development.potentialBand
  return 100 * irwinHall5CDF((headroom - SKILL_KEYS.length * lo) / (hi - lo))
}
/** `Σu` at a given percentile of Irwin-Hall(5), by bisection on the exact CDF. */
function sumUAt(p: number): number {
  let lo = 0
  let hi = 5
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (irwinHall5CDF(mid) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
function headroomCut(p: number): number {
  const [lo, hi] = ECONOMY.development.potentialBand
  return sumUAt(p) * (hi - lo) + SKILL_KEYS.length * lo
}
function profileFor(preset: Preset): PlayerProfile {
  return { ...DEFAULT_PROFILE, background: preset.background, coachTier: preset.coachTier }
}
function seedFor(preset: Preset, index: number): string {
  return `bench-${preset.background}-${index}`
}
function presetOf(background: FamilyBackground, coachTier: CoachTier): Preset {
  return { label: `${background} · ${coachTier}`, background, coachTier }
}

// -------------------------------------------------------------------------------------------------
// ONE CAREER, under one arm
// -------------------------------------------------------------------------------------------------

interface Arm {
  id: string
  label: string
  preset: Preset
  /** a lump sum handed to the family at week 0, in cents */
  grantCents?: number
  /** the wallet is defused: funds topped to INFINITE_CENTS every week, and the debt spell cleared */
  wallet?: boolean
  /** the body is defused: condition pinned at 100 and any injury cleared, every week */
  health?: boolean
  /** screen seeds for this talent band before running – [loPct, hiPct] of total headroom */
  talentBand?: [number, number]
  /** ⚠ THE EARLY-PRO ARM. Refuse every W-track event until she is this old, and nothing else. The
   *  junior calendar is untouched, so a delayed career plays juniors in those weeks exactly as the
   *  policy would have. `undefined` = no veto = the shipped behaviour, which already steps up the
   *  moment `tierOpenFor` and the wallet both allow it. */
  wFromAge?: number
  /** ⚠ THE LINGERER. Refuse a W-track event whenever a NON-W event is open on the same week – i.e.
   *  always take the rung she can win over the rung she would have to climb. This is the career the
   *  save shows: a twenty-one-year-old still entering National Series, whose 555 domestic points in
   *  a year are worth nothing on the professional table. Nothing in the engine forbids it: the
   *  domestic rungs carry no `maxAgeYears` and no upper `enterPointBand`, and `ladder-floor-2026-08`
   *  deliberately turned the lower bound from a refusal into a sorting key. */
  preferLowerRung?: boolean
}

interface Career {
  arm: string
  index: number
  headroom: number
  headroomPct: number
  weeks: number
  ending: string | null
  bankrupt: boolean
  bankruptBy18: boolean
  reachedHorizon: boolean
  entriesByTier: Record<TierId, number>
  entries: number
  bestWta: number | null
  peakWtaPoints: number
  titles: number
  prizeCents: number
  /** the strongest rung she ever ENTERED, as an index into W_RUNGS, or -1 */
  bestRungEntered: number
  /** ...and the strongest whose `acceptsRank` her best rank ever CLEARED */
  bestRungCleared: number
  /** her five attributes summed, at each birthday from 14 – the owner's own "skills now, summed" */
  skillSumByAge: Map<number, number>
  skillSumEnd: number
  weeksLostToInjury: number
  /** career-total cents by ledger category, folded week by week (financeWeeks prunes to 60) */
  cats: Record<string, number>
  /** weeks in which the budget refused the biggest trip her ranking already opened */
  bindingWeeks: number
  /** ...and the LAST such week. -1 if the budget never bound at all. */
  lastBindingWeek: number
  /** weeks in which some rung was open and affordable – the denominator that makes the above a share */
  weeksWithAnOpenRung: number
  fundsByWeek: number[]

  // --- THE EARLY-PRO INSTRUMENTS ---------------------------------------------------------------
  /** the week she first entered ANY W-track event, or -1 if she never did */
  firstWWeek: number
  /** ...as an exact age, or NaN */
  firstWAge: number
  /** her WTA rank at each birthday from 14, where she held one */
  rankByAge: Map<number, number>
  /** her best-18 professional book at each birthday from 14 */
  pointsByAge: Map<number, number>
  /** the strongest rung she had ENTERED by each birthday, as an index into W_RUNGS */
  rungByAge: Map<number, number>
  /** weeks in which the budget refused a W-TRACK trip her ranking already opened, before age 20 –
   *  the ordering test: is the wallet what buys the early entry? */
  wBlockedWeeksBefore20: number
}

function zeroByTier(): Record<TierId, number> {
  return Object.fromEntries(TIER_LADDER.map((t) => [t, 0])) as Record<TierId, number>
}

/**
 * ⚠ DOES THE BUDGET DECIDE THIS WEEK? Read off the world, not re-implemented from the policy.
 *
 * The question is not "is she broke" – it is "is money choosing her tournament". So the probe asks
 * for the MOST EXPENSIVE trip her ranking gate already opens inside the commitment window, and
 * reports whether the reserve refuses it. If it does, the wallet is picking the event; if it does
 * not, every door her racket opened is also affordable and the budget is not in the decision.
 *
 * `tierOpenFor`, `travelCostFor` and `TIERS` are the engine's own; the reserve is the arm's. Weeks
 * with nothing open are excluded rather than counted as free, which is the conservative direction.
 */
function budgetProbe(world: WorldState, policy: Policy): { open: boolean; binds: boolean; wBlocked: boolean } {
  let worst = 0
  // ...and the same question asked of the W TRACK ALONE, which is the ordering test: if the wallet is
  // upstream of the early-entry trap, it will be refusing PROFESSIONAL trips at sixteen and
  // seventeen while the junior calendar stays affordable.
  let wOpen = false
  let wAffordable = false
  for (const e of world.season) {
    if (world.week > e.deadlineWeek) continue
    if (e.deadlineWeek - world.week > ENTRY_LOOKAHEAD) continue
    if (!tierOpenFor(world, e.tier)) continue
    const cost = TIERS[e.tier].entryFeeCents + travelCostFor(world, e)
    if (cost > worst) worst = cost
    if (TIERS[e.tier].track === 'wta') {
      wOpen = true
      if (world.fundsCents - cost >= policy.reserveCents) wAffordable = true
    }
  }
  if (worst === 0) return { open: false, binds: false, wBlocked: false }
  return {
    open: true,
    binds: world.fundsCents - worst < policy.reserveCents,
    wBlocked: wOpen && !wAffordable,
  }
}

function runCareer(arm: Arm, index: number): Career {
  const { world, rng, seed } = openCareer(arm.preset, index, POLICY)
  if (arm.grantCents) world.fundsCents += arm.grantCents

  const entriesByTier = zeroByTier()
  const cats: Record<string, number> = {}
  const skillSumByAge = new Map<number, number>()
  const rankByAge = new Map<number, number>()
  const pointsByAge = new Map<number, number>()
  const rungByAge = new Map<number, number>()
  const fundsByWeek: number[] = []
  let bestWta: number | null = null
  let peakWtaPoints = 0
  let weeks = 0
  let bindingWeeks = 0
  let lastBindingWeek = -1
  let weeksWithAnOpenRung = 0
  let foldedThrough = -1
  let firstWWeek = -1
  let firstWAge = NaN
  let wBlockedWeeksBefore20 = 0
  let rungSoFar = -1

  // ⚠ THE ONLY BEHAVIOURAL DIFFERENCE AN ARM MAKES TO THE ENTRY POLICY, and it is a parent's own
  // choice rather than a rule change: refuse the professional calendar until she is old enough.
  // `EntryVeto` sits after the ranking gate and before affordability, which is exactly where a
  // "not yet, she is fifteen" decision belongs. Undefined for every other arm, so those runs are
  // byte-identical to a run with no veto argument at all.
  const veto: EntryVeto | undefined =
    arm.wFromAge === undefined && !arm.preferLowerRung
      ? undefined
      : (w, e) => {
          if (TIERS[e.tier].track !== 'wta') return false
          if (arm.wFromAge !== undefined && kidAgeExact(w.week, w.profile.birthMonth, w.profile.birthDay) < arm.wFromAge) return true
          if (arm.preferLowerRung) {
            return w.season.some(
              (x) => x.week === e.week && TIERS[x.tier].track !== 'wta' && w.week <= x.deadlineWeek && tierOpenFor(w, x.tier),
            )
          }
          return false
        }

  for (; weeks < FULL_CAREER_WEEKS && world.ending === null; weeks++) {
    // --- the two defusals, applied BEFORE the step so the policy sees them ---------------------
    if (arm.wallet) {
      world.fundsCents = INFINITE_CENTS
      world.debtSinceWeek = null
    }
    if (arm.health) {
      world.condition = 100
      world.injury = null
    }

    // the budget probe, at exactly the state the entry policy is about to read
    const probe = budgetProbe(world, POLICY)
    const exactAge = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
    if (probe.open) {
      weeksWithAnOpenRung++
      if (probe.binds) {
        bindingWeeks++
        lastBindingWeek = world.week
      }
    }
    if (probe.wBlocked && exactAge < 20) wBlockedWeeksBefore20++
    const age = Math.floor(exactAge)
    if (!skillSumByAge.has(age)) {
      skillSumByAge.set(age, SKILL_KEYS.reduce((a, k) => a + world.skills[k], 0))
      if (typeof world.kidRankWta === 'number' && kidPoints(world, 'wta') > 0) rankByAge.set(age, world.kidRankWta)
      pointsByAge.set(age, kidPoints(world, 'wta'))
      rungByAge.set(age, rungSoFar)
    }
    if (world.week % WEEKS_PER_YEAR === 0) fundsByWeek.push(world.fundsCents)

    const entered = stepCareerWeek(world, rng, POLICY, veto)
    for (const t of TIER_LADDER) entriesByTier[t] += entered[t]
    for (let i = 0; i < W_RUNGS.length; i++) {
      if (entered[W_RUNGS[i]] > 0) {
        if (i > rungSoFar) rungSoFar = i
        if (firstWWeek < 0) {
          firstWWeek = world.week
          firstWAge = exactAge
        }
      }
    }
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)

    // ⚠ `typeof === 'number'`. `kidRankWta` is `number | undefined`, and `!== null` admits undefined
    // and would latch the accumulator – the defect vue-tsc found in ladder-vs-targets.ts, not
    // repeated here.
    const wtaRank = world.kidRankWta
    if (world.careerTotals.prizeCents > 0 && typeof wtaRank === 'number') {
      if (bestWta === null || wtaRank < bestWta) bestWta = wtaRank
    }
    const pts = kidPoints(world, 'wta')
    if (pts > peakWtaPoints) peakWtaPoints = pts

    // fold the ledger week by week: financeWeeks prunes to a 60-week trailing window, so a
    // fifteen-season total is not recoverable from it afterwards.
    for (const fw of world.financeWeeks) {
      if (fw.week <= foldedThrough) continue
      for (const [k, v] of Object.entries(fw.byCategory)) cats[k] = (cats[k] ?? 0) + (v as number)
    }
    foldedThrough = world.financeWeeks.length ? world.financeWeeks[world.financeWeeks.length - 1].week : foldedThrough
  }

  let titles = 0
  for (const t of Object.values(world.trophiesByTier ?? {})) titles += (t as { titles?: number[] })?.titles?.length ?? 0
  const endingRow: CareerEnding | null = world.ending
  const ending = endingRow?.type ?? null
  const bankrupt = ending === 'bankruptcy'
  const headroom = headroomOf(seed, world.profile)

  let bestRungEntered = -1
  let bestRungCleared = -1
  for (let i = 0; i < W_RUNGS.length; i++) {
    if (entriesByTier[W_RUNGS[i]] > 0) bestRungEntered = i
    const accepts = TIERS[W_RUNGS[i]].acceptsRank
    if (accepts !== undefined && bestWta !== null && bestWta <= accepts) bestRungCleared = i
  }

  return {
    arm: arm.id,
    index,
    headroom,
    headroomPct: headroomPercentile(headroom),
    weeks,
    ending,
    bankrupt,
    bankruptBy18: bankrupt && (endingRow?.week ?? Number.MAX_SAFE_INTEGER) <= 4 * WEEKS_PER_YEAR,
    reachedHorizon: !bankrupt && ending !== 'stopped' && ending !== 'college',
    entriesByTier,
    entries: TIER_LADDER.reduce((a, t) => a + entriesByTier[t], 0),
    bestWta,
    peakWtaPoints,
    titles,
    prizeCents: world.careerTotals.prizeCents,
    bestRungEntered,
    bestRungCleared,
    skillSumByAge,
    skillSumEnd: SKILL_KEYS.reduce((a, k) => a + world.skills[k], 0),
    weeksLostToInjury: world.careerTotals.weeksLostToInjury,
    cats,
    bindingWeeks,
    lastBindingWeek,
    weeksWithAnOpenRung,
    fundsByWeek,
    firstWWeek,
    firstWAge,
    rankByAge,
    pointsByAge,
    rungByAge,
    wBlockedWeeksBefore20,
  }
}

/** Indices for an arm: straight 0..n-1, or screened arithmetically for a talent band first. */
function indicesFor(arm: Arm, n: number): number[] {
  if (!arm.talentBand) return Array.from({ length: n }, (_, i) => i)
  const [loP, hiP] = arm.talentBand
  const lo = headroomCut(loP / 100)
  const hi = headroomCut(hiP / 100)
  const out: number[] = []
  for (let i = 0; i < TALENT_SCAN && out.length < n; i++) {
    const h = headroomOf(seedFor(arm.preset, i), profileFor(arm.preset))
    if (h >= lo && h < hi) out.push(i)
  }
  return out
}

function runArm(arm: Arm, n: number): Career[] {
  return indicesFor(arm, n).map((i) => runCareer(arm, i))
}

// -------------------------------------------------------------------------------------------------
// reporting
// -------------------------------------------------------------------------------------------------

const CAT_COACH: WorldEventCategory[] = ['coaching', 'facility']
function catSum(c: Career, keys: readonly string[]): number {
  return keys.reduce((a, k) => a + Math.abs(c.cats[k] ?? 0), 0)
}

function armRow(label: string, cs: Career[]): string {
  const ranked = cs.map((c) => c.bestWta).filter((x): x is number => x !== null)
  const rungs = cs.map((c) => c.bestRungEntered)
  const firstWAges = cs.map((c) => c.firstWAge).filter((a) => !Number.isNaN(a))
  return (
    `  ${padEnd(label, 30)}` +
    `${pad(cs.length, 5)}` +
    `${pad(shareOf(cs.filter((c) => !c.bankrupt).length, cs.length), 10)}` +
    `${pad(ranked.length ? `#${pctl(ranked, 0.5)}` : '–', 9)}` +
    `${pad(ranked.length ? `#${Math.min(...ranked)}` : '–', 8)}` +
    `${pad(shareOf(cs.filter((c) => c.bestWta !== null && c.bestWta <= 250).length, cs.length), 10)}` +
    `${pad(shareOf(cs.filter((c) => c.bestWta !== null && c.bestWta <= 100).length, cs.length), 10)}` +
    `${pad(shareOf(cs.filter((c) => c.bestRungEntered >= W_RUNGS.indexOf('wta250')).length, cs.length), 10)}` +
    `${pad(shareOf(cs.filter((c) => c.bestRungEntered >= W_RUNGS.indexOf('wta500')).length, cs.length), 10)}` +
    `${pad(mean(rungs).toFixed(2), 8)}` +
    `${pad(pctl(cs.map((c) => c.entries), 0.5), 8)}` +
    `${pad(money(pctl(cs.map((c) => c.prizeCents), 0.5)), 13)}` +
    `${pad(firstWAges.length ? mean(firstWAges).toFixed(2) : '–', 9)}`
  )
}
function armHeader(): string {
  return (
    `  ${padEnd('arm', 30)}${pad('n', 5)}${pad('solvent', 10)}${pad('rank p50', 9)}${pad('best', 8)}` +
    `${pad('top-250', 10)}${pad('top-100', 10)}${pad('wta250+', 10)}${pad('wta500+', 10)}${pad('rung', 8)}${pad('entries', 8)}${pad('prize p50', 13)}${pad('1st W age', 9)}`
  )
}
/** the rung index legend, so `rung` above is readable */
function rungLegend(): string {
  return `  rung = mean index into [${W_RUNGS.join(', ')}] of the strongest rung ENTERED (-1 = never played a W event)`
}

function ladderDoors(label: string, cs: Career[]): void {
  console.log(`\n  ${padEnd(`${label} – the ladder's own doors`, 34)}${pad('accepts', 9)}${pad('cleared', 10)}${pad('entered', 10)}`)
  for (const t of W_RUNGS) {
    const accepts = TIERS[t].acceptsRank
    const cleared = accepts === undefined ? cs.length : cs.filter((c) => c.bestWta !== null && c.bestWta <= accepts).length
    console.log(
      `  ${padEnd(`  ${t}`, 34)}${pad(accepts === undefined ? 'on-ramp' : `#${accepts}`, 9)}` +
        `${pad(accepts === undefined ? '–' : shareOf(cleared, cs.length), 10)}${pad(shareOf(cs.filter((c) => c.entriesByTier[t] > 0).length, cs.length), 10)}`,
    )
  }
}

// =================================================================================================
// §0  THE ARITHMETIC – what the constants say before a single career is built
// =================================================================================================

function section0(): void {
  console.log(`\n${rule()}`)
  console.log('§0  THE COACH LADDER AS PRICED – arithmetic on the shipped constants, no career built')
  console.log(rule())

  const plan = WEEK_PLAN_PRESETS.balanced
  console.log(`\n  0a. WHAT A RUNG COSTS A WEEK, at the balanced plan (${coachHoursForPlan(plan)} sessions), MIDDLE of each rate band\n`)
  console.log(
    `  ${padEnd('rung', 10)}${pad('dev x', 8)}${pad('court x', 9)}` +
      (['working', 'middle', 'wealthy'] as FamilyBackground[]).map((b) => pad(`${b} 12-16`, 15) + pad(`${b} 17-22`, 15) + pad(`${b} 23+`, 13)).join(''),
  )
  for (const tier of COACH_TIERS) {
    let row = `  ${padEnd(tier, 10)}${pad(ECONOMY.coach.developmentFactor[tier].toFixed(2), 8)}${pad(ECONOMY.coach.courtTierFactor[tier].toFixed(1), 9)}`
    for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
      for (const ageYears of [14, 19, 25]) {
        const [lo, hi] = coachRateBandCents(tier, ageYears)
        const mid = (lo + hi) / 2
        const weekly =
          tier === 'self'
            ? Math.round(facilityRateCents(ageYears, tier) * coachHoursForPlan(plan) * coachCorridorMid(bg))
            : coachWeeklyCents(mid, plan, bg)
        row += pad(`${money(weekly)}/wk`, ageYears === 25 ? 13 : 15)
      }
    }
    console.log(row)
  }

  console.log(`\n  0b. ...AND OVER A CAREER. 14 -> 38 is ${FULL_CAREER_WEEKS} weeks; the R4 rule stands the coach down`)
  console.log(`      on competition weeks, and the \`player\` policy takes him ("coachOnEventWeeks: true"), so the`)
  console.log(`      figure below is the FULL-ATTENDANCE bill and an upper bound on what a career pays.\n`)
  console.log(`  ${padEnd('rung', 10)}${pad('working', 16)}${pad('middle', 16)}${pad('wealthy', 16)}${pad('vs self (middle)', 20)}`)
  const careerBill = (tier: CoachTier, bg: FamilyBackground): number => {
    let total = 0
    for (let w = 0; w < FULL_CAREER_WEEKS; w++) {
      const ageYears = 14 + w / WEEKS_PER_YEAR
      const [lo, hi] = coachRateBandCents(tier, ageYears)
      total +=
        tier === 'self'
          ? Math.round(facilityRateCents(ageYears, tier) * coachHoursForPlan(plan) * coachCorridorMid(bg))
          : coachWeeklyCents((lo + hi) / 2, plan, bg)
    }
    return total
  }
  const selfMiddle = careerBill('self', 'middle')
  for (const tier of COACH_TIERS) {
    console.log(
      `  ${padEnd(tier, 10)}${pad(money(careerBill(tier, 'working')), 16)}${pad(money(careerBill(tier, 'middle')), 16)}` +
        `${pad(money(careerBill(tier, 'wealthy')), 16)}${pad(`+${money(careerBill(tier, 'middle') - selfMiddle)}`, 20)}`,
    )
  }

  console.log(`\n  0c. WHAT THE RUNG BUYS, as the constants state it\n`)
  console.log(
    `  ${padEnd('rung', 10)}${pad('devFactor', 11)}${pad('vs self', 9)}${pad('COACH_EYE', 11)}${pad('ACCURACY', 10)}` +
      `${pad('final haze', 12)}${pad('physio q', 10)}${pad('injury tau x', 14)}${pad('layoff x', 10)}`,
  )
  for (const tier of COACH_TIERS) {
    const dev = ECONOMY.coach.developmentFactor[tier]
    console.log(
      `  ${padEnd(tier, 10)}${pad(dev.toFixed(2), 11)}${pad(`x${(dev / ECONOMY.coach.developmentFactor.self).toFixed(3)}`, 9)}` +
        `${pad(COACH_EYE[tier].toFixed(2), 11)}${pad(COACH_ACCURACY[tier].toFixed(2), 10)}` +
        `${pad(`+/-${bandFor(COACH_ACCURACY[tier]).toFixed(2)}`, 12)}${pad(physioQuality(tier).toFixed(2), 10)}` +
        `${pad(tier === 'self' ? '1.000 (none)' : physioRiskFactor(tier).toFixed(3), 14)}${pad(tier === 'self' ? '1.000' : physioRecoveryFactor(tier).toFixed(3), 10)}`,
    )
  }
  console.log(`\n  "final haze" = bandFor(COACH_ACCURACY) – the inner contour's half-width after infinite tenure and`)
  console.log(`  infinite match evidence. It is the PERMANENT read error the rung leaves on the radar.`)

  console.log(`\n  0d. THE GAME'S OWN QUOTE of what a rung adds, on a fresh 14-year-old at the balanced plan\n`)
  const probeSeed = 'bench-middle-0'
  const start = startingSkills(probeSeed, profileFor(PRESETS[3]))
  const pot = rollPotential(probeSeed, start)
  console.log(`  ${padEnd('rung', 10)}${pad('coachSeasonUplift, % of level, a season', 42)}${pad('per $1,000 of season bill', 28)}`)
  for (const tier of COACH_TIERS) {
    const [lo, hi] = coachSeasonUplift({
      skills: SKILL_KEYS.map((k) => start[k]),
      potential: SKILL_KEYS.map((k) => pot[k]),
      plan: plan,
      tier,
      fit: 'good',
      ageFactor: ageFactor(14),
      trainFactor: trainFactor(plan),
    })
    const seasonBill =
      tier === 'self'
        ? Math.round(facilityRateCents(14, tier) * coachHoursForPlan(plan) * coachCorridorMid('middle')) * WEEKS_PER_YEAR
        : coachWeeklyCents((coachRateBandCents(tier, 14)[0] + coachRateBandCents(tier, 14)[1]) / 2, plan, 'middle') * WEEKS_PER_YEAR
    const mid = (lo + hi) / 2
    console.log(
      `  ${padEnd(tier, 10)}${pad(`${lo.toFixed(2)} – ${hi.toFixed(2)}%   (mid ${mid.toFixed(2)}%)`, 42)}` +
        `${pad(`${(mid / (seasonBill / 100_000)).toFixed(4)} %/$1k   bill ${money(seasonBill)}`, 28)}`,
    )
  }

  console.log(`\n  0e. THE STEP BETWEEN RUNGS – the owner's «между budget и middle разница как будто небольшая»\n`)
  console.log(`  ${padEnd('step', 22)}${pad('dev factor', 13)}${pad('accuracy', 11)}${pad('physio q', 11)}${pad('season bill, middle bg', 26)}${pad('$ per +1% dev', 16)}`)
  for (let i = 1; i < COACH_TIERS.length; i++) {
    const a = COACH_TIERS[i - 1]
    const b = COACH_TIERS[i]
    const billOf = (t: CoachTier): number =>
      t === 'self'
        ? Math.round(facilityRateCents(19, t) * coachHoursForPlan(plan) * coachCorridorMid('middle')) * WEEKS_PER_YEAR
        : coachWeeklyCents((coachRateBandCents(t, 19)[0] + coachRateBandCents(t, 19)[1]) / 2, plan, 'middle') * WEEKS_PER_YEAR
    const dDev = (ECONOMY.coach.developmentFactor[b] / ECONOMY.coach.developmentFactor[a] - 1) * 100
    const dBill = billOf(b) - billOf(a)
    console.log(
      `  ${padEnd(`${a} -> ${b}`, 22)}${pad(`+${dDev.toFixed(1)}%`, 13)}` +
        `${pad(`+${((COACH_ACCURACY[b] - COACH_ACCURACY[a]) * 100).toFixed(0)}pp`, 11)}` +
        `${pad(`+${(physioQuality(b) - physioQuality(a)).toFixed(2)}`, 11)}` +
        `${pad(`${money(billOf(a))} -> ${money(billOf(b))} (+${money(dBill)})`, 34)}${pad(money(Math.round(dBill / Math.max(dDev, 0.001))), 16)}`,
    )
  }

  console.log(`\n  0f. THE PARENT'S WAGE GROWS AND EVERY COST CONSTANT STANDS STILL (task #103)\n`)
  const [gLo, gHi] = ECONOMY.incomeGrowthBand
  console.log(`  incomeGrowthBand = [${gLo}, ${gHi}] compounding at every season boundary, so over a 14->38 career:`)
  console.log(`  ${padEnd('background', 12)}${pad('week 0', 12)}${pad('at 18', 12)}${pad('at 22', 12)}${pad('at 26', 12)}${pad('at 38', 12)}${pad('x over career', 15)}`)
  for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
    const base = ECONOMY.parentIncomeCents[bg]
    const at = (yrs: number, g: number): number => base * (1 + g) ** yrs
    const row = [0, 4, 8, 12, 24]
      .map((yrs) => pad(`${money(Math.round(at(yrs, (gLo + gHi) / 2)))}/wk`, 12))
      .join('')
    console.log(`  ${padEnd(bg, 12)}${row}${pad(`x${((1 + (gLo + gHi) / 2) ** 24).toFixed(1)}`, 15)}`)
  }
  console.log(`\n  At the midpoint 7.5%/yr the wage is x5.7 by 38 while every cost constant in ECONOMY is the same`)
  console.log(`  number it was at 14. That is the cheapening, and it is by construction rather than by accident.`)
}

// =================================================================================================
// §1  WHAT GATES THE LADDER – the paired ablation
// =================================================================================================

/** The cell §1 ablates in. Middle background, self-coached: the cell that is neither the wealthy
 *  trap nor the poorest corner, and the one olivia actually played. */
const ABLATION_PRESET = presetOf('middle', 'self')

function section1(): Career[] {
  console.log(`\n${rule()}`)
  console.log('§1  WHAT GATES THE LADDER – the same seeds, nine ways')
  console.log(rule())
  console.log(`
  ${SEEDS} seeds, one cell (${ABLATION_PRESET.background} background, ${ABLATION_PRESET.coachTier}-coached), "${POLICY.label}" policy, 14 -> 38.
  Every arm is EXACTLY PAIRED with 'shipped' except the two talent arms: \`openCareer\`'s seed is
  \`bench-<background>-<index>\` and \`startingSkills\` ignores the profile, so an arm is the same girl
  under one different constraint. A talent band is a different girl by definition.

    shipped        the engine as it ships – which already steps up to the W ladder the moment
                   \`tierOpenFor\` and the wallet both allow it (w15/w35/w50 open at 16, the rest at 17)
    W from 17/18/19  the professional calendar is REFUSED until she is that old, and nothing else
                   changes. The junior calendar is untouched, so those weeks are spent playing
                   juniors – exactly the career that "spent her juniors winning juniors"
    wallet         funds topped to ${money(INFINITE_CENTS)} every week and the debt spell cleared – money never binds
    health         condition pinned at 100 and any injury cleared every week – the body never binds
    wallet+health  both
    talent p90+/p<10  the top and bottom deciles of total headroom, seed-screened arithmetically

  ⚠ Bankruptcy is NOT defused in the shipped arm. It is the thing being measured.
  ⚠ THE DELAY ARMS ARE THE HYPOTHESIS UNDER TEST: junior points are a currency the professional
    table does not accept, so a year spent winning juniors may convert into nothing. If the delay
    arms fall off, the ladder is gated by WHEN SHE STEPPED UP rather than by the wallet.
`)
  const arms: Arm[] = [
    { id: 'shipped', label: 'shipped (up as soon as allowed)', preset: ABLATION_PRESET },
    { id: 'w17', label: 'W refused until 17', preset: ABLATION_PRESET, wFromAge: 17 },
    { id: 'w18', label: 'W refused until 18', preset: ABLATION_PRESET, wFromAge: 18 },
    { id: 'w19', label: 'W refused until 19', preset: ABLATION_PRESET, wFromAge: 19 },
    { id: 'wallet', label: 'wallet defused', preset: ABLATION_PRESET, wallet: true },
    { id: 'health', label: 'health defused', preset: ABLATION_PRESET, health: true },
    { id: 'both', label: 'wallet + health defused', preset: ABLATION_PRESET, wallet: true, health: true },
    { id: 'talent', label: 'talent p90+ (shipped money)', preset: ABLATION_PRESET, talentBand: [90, 100] },
    { id: 'talent-lo', label: 'talent p<10 (shipped money)', preset: ABLATION_PRESET, talentBand: [0, 10] },
    // ⚠ THE POOR CELL, and it is here because the cell above may simply never run out of money – in
    // which case defusing its wallet proves nothing. `8k working` buying a middle coach is the corner
    // compound-cost-2026-08.md measures going under; if money is upstream of anything, it is upstream
    // here. Same two arms, different cell, so the pair is still exact.
    { id: 'poor', label: '8k working · middle coach', preset: presetOf('working', 'middle') },
    { id: 'poor-wallet', label: '   ...wallet defused', preset: presetOf('working', 'middle'), wallet: true },
    { id: 'poor-w18', label: '   ...W refused until 18', preset: presetOf('working', 'middle'), wFromAge: 18 },
  ]
  const all: Career[] = []
  console.log(armHeader())
  for (const arm of arms) {
    const cs = runArm(arm, SEEDS)
    all.push(...cs)
    console.log(armRow(arm.label, cs))
  }
  console.log(rungLegend())

  for (const id of ['shipped', 'w18', 'wallet', 'talent']) {
    ladderDoors(id, all.filter((c) => c.arm === id))
  }

  // --- 1a. THE COST OF A YEAR, paired -----------------------------------------------------------
  const byArmIdx = new Map<string, Map<number, Career>>()
  for (const c of all) {
    if (!byArmIdx.has(c.arm)) byArmIdx.set(c.arm, new Map())
    byArmIdx.get(c.arm)!.set(c.index, c)
  }
  const shipped = byArmIdx.get('shipped')!
  console.log(`\n  1a. WHAT A YEAR OF DELAY COSTS – paired against 'shipped', mean over ${SEEDS} pairs\n`)
  console.log(
    `  ${padEnd('delay', 24)}${pad('d 1st W age', 13)}${pad('d peak rank', 13)}${pad('d rung', 9)}` +
      `${pad('d peak points', 15)}${pad('d prize', 15)}${pad('worse in', 10)}${pad('better in', 11)}`,
  )
  for (const id of ['w17', 'w18', 'w19']) {
    const other = byArmIdx.get(id)!
    const d = { age: [] as number[], rank: [] as number[], rung: [] as number[], pts: [] as number[], prize: [] as number[] }
    let worse = 0
    let better = 0
    let n = 0
    for (const [i, a] of shipped) {
      const b = other.get(i)
      if (!b) continue
      n++
      if (!Number.isNaN(a.firstWAge) && !Number.isNaN(b.firstWAge)) d.age.push(b.firstWAge - a.firstWAge)
      const ra = a.bestWta ?? 1800
      const rb = b.bestWta ?? 1800
      d.rank.push(rb - ra)
      d.rung.push(b.bestRungEntered - a.bestRungEntered)
      d.pts.push(b.peakWtaPoints - a.peakWtaPoints)
      d.prize.push(b.prizeCents - a.prizeCents)
      if (rb > ra) worse++
      else if (rb < ra) better++
    }
    console.log(
      `  ${padEnd(id, 24)}${pad(`+${mean(d.age).toFixed(2)}y`, 13)}${pad(mean(d.rank) >= 0 ? `+${mean(d.rank).toFixed(0)}` : mean(d.rank).toFixed(0), 13)}` +
        `${pad(mean(d.rung).toFixed(2), 9)}${pad(mean(d.pts).toFixed(0), 15)}${pad(money(Math.round(mean(d.prize))), 15)}` +
        `${pad(`${worse}/${n}`, 10)}${pad(`${better}/${n}`, 11)}`,
    )
  }
  console.log(`\n  d peak rank is SIGNED and POSITIVE IS WORSE (a bigger number is a lower rank). An unranked`)
  console.log(`  career scores #1800, the table's own size, rather than being dropped.`)

  // --- 1b. THE COMPOUNDING ----------------------------------------------------------------------
  console.log(`\n  1b. THE COMPOUNDING – rank and book, age by age, per arm (median of the careers holding one)\n`)
  const AGES = [16, 17, 18, 19, 20, 22, 24, 26]
  console.log(`  ${padEnd('arm', 24)}${AGES.map((a) => pad(`@${a}`, 11)).join('')}   <- median WTA rank`)
  for (const id of ['shipped', 'w17', 'w18', 'w19']) {
    const cs = all.filter((c) => c.arm === id)
    console.log(
      `  ${padEnd(id, 24)}` +
        AGES.map((a) => {
          const rs = cs.map((c) => c.rankByAge.get(a)).filter((r): r is number => r !== undefined)
          return pad(rs.length ? `#${pctl(rs, 0.5)}` : '–', 11)
        }).join(''),
    )
  }
  console.log(`\n  ${padEnd('arm', 24)}${AGES.map((a) => pad(`@${a}`, 11)).join('')}   <- median best-18 book`)
  for (const id of ['shipped', 'w17', 'w18', 'w19']) {
    const cs = all.filter((c) => c.arm === id)
    console.log(
      `  ${padEnd(id, 24)}` +
        AGES.map((a) => {
          const ps = cs.map((c) => c.pointsByAge.get(a)).filter((p): p is number => p !== undefined)
          return pad(ps.length ? String(pctl(ps, 0.5)) : '–', 11)
        }).join(''),
    )
  }

  // ...and the loop's own gain: does a rank at 18 predict a rank at 24, and by how much?
  console.log(`\n  1c. IS THERE A LOOP? – a rank advantage at eighteen, cashed at twenty-four\n`)
  const ship = all.filter((c) => c.arm === 'shipped')
  for (const [young, old] of [[17, 22], [18, 24], [18, 22]] as Array<[number, number]>) {
    const pairs = ship
      .map((c) => [c.rankByAge.get(young), c.rankByAge.get(old)] as [number | undefined, number | undefined])
      .filter((p): p is [number, number] => p[0] !== undefined && p[1] !== undefined)
    if (pairs.length < 4) {
      console.log(`  age ${young} -> ${old}: only ${pairs.length} careers held a rank at both. Not enough to say.`)
      continue
    }
    const xs = pairs.map((p) => p[0])
    const ys = pairs.map((p) => p[1])
    const mx = mean(xs)
    const my = mean(ys)
    const cov = mean(pairs.map(([x, y]) => (x - mx) * (y - my)))
    const vx = mean(xs.map((x) => (x - mx) ** 2))
    const sy = Math.sqrt(mean(ys.map((y) => (y - my) ** 2)))
    const slope = vx > 0 ? cov / vx : NaN
    const r = vx > 0 && sy > 0 ? cov / (Math.sqrt(vx) * sy) : NaN
    console.log(
      `  age ${young} -> ${old}   n=${pairs.length}   median #${pctl(xs, 0.5)} -> #${pctl(ys, 0.5)}   ` +
        `r=${r.toFixed(2)}   slope ${slope.toFixed(2)} places at ${old} per place at ${young}` +
        `   ${slope > 1.05 ? '<- AMPLIFIES (a loop)' : slope < 0.95 ? '<- damps (regression to the mean)' : '<- carries through'}`,
    )
  }

  // --- 1d. THE ORDERING TEST --------------------------------------------------------------------
  console.log(`\n  1d. IS THE WALLET UPSTREAM OF THE STEP-UP? – does money buy the early entry?\n`)
  console.log(
    `  ${padEnd('arm', 30)}${pad('1st W age p50', 15)}${pad('never entered W', 17)}` +
      `${pad('wks a W trip was', 18)}${pad('...as a share of', 18)}`,
  )
  console.log(`  ${padEnd('', 30)}${pad('', 15)}${pad('', 17)}${pad('unaffordable, <20', 18)}${pad('weeks before 20', 18)}`)
  for (const id of ['shipped', 'wallet', 'both', 'talent', 'talent-lo', 'poor', 'poor-wallet']) {
    const cs = all.filter((c) => c.arm === id)
    const ages = cs.map((c) => c.firstWAge).filter((a) => !Number.isNaN(a))
    console.log(
      `  ${padEnd(id, 30)}${pad(ages.length ? pctl(ages, 0.5).toFixed(2) : '–', 15)}` +
        `${pad(`${cs.filter((c) => c.firstWWeek < 0).length}/${cs.length}`, 17)}` +
        `${pad(mean(cs.map((c) => c.wBlockedWeeksBefore20)).toFixed(1), 18)}` +
        `${pad(`${(100 * mean(cs.map((c) => c.wBlockedWeeksBefore20 / (6 * WEEKS_PER_YEAR)))).toFixed(1)}%`, 18)}`,
    )
  }
  console.log(`\n  If defusing the wallet pulls the first W entry EARLIER, money is upstream of the trap.`)
  console.log(`  If it does not move, the wallet is beside the trap and the step-up is gated by something else.`)

  // --- the paired deltas, career by career, which is what pairing is FOR --------------------------
  console.log(`\n  1e. PAIRED DELTAS – the same girl, one constraint removed. Mean over ${SEEDS} pairs.\n`)
  console.log(
    `  ${padEnd('constraint removed', 26)}${pad('d rung', 10)}${pad('d entries', 12)}${pad('d best rank', 13)}` +
      `${pad('d prize', 15)}${pad('d skills sum', 14)}${pad('d WEEKS LIVED', 15)}${pad('pairs improved', 16)}`,
  )
  console.log(`  ⚠ read 'd WEEKS LIVED' first: an arm that survives longer plays more, and more of`)
  console.log(`    everything follows from that rather than from the constraint it removed.\n`)
  for (const [id, againstId] of [
    ['wallet', 'shipped'],
    ['health', 'shipped'],
    ['both', 'shipped'],
    ['w17', 'shipped'],
    ['w18', 'shipped'],
    ['w19', 'shipped'],
    ['poor-wallet', 'poor'],
    ['poor-w18', 'poor'],
  ] as Array<[string, string]>) {
    const base = byArmIdx.get(againstId)!
    const other = byArmIdx.get(id)!
    const dRung: number[] = []
    const dEntries: number[] = []
    const dRank: number[] = []
    const dPrize: number[] = []
    const dSkill: number[] = []
    const dWeeks: number[] = []
    let improved = 0
    let n = 0
    for (const [i, a] of base) {
      const b = other.get(i)
      if (!b) continue
      n++
      dWeeks.push(b.weeks - a.weeks)
      dRung.push(b.bestRungEntered - a.bestRungEntered)
      dEntries.push(b.entries - a.entries)
      dPrize.push(b.prizeCents - a.prizeCents)
      dSkill.push(b.skillSumEnd - a.skillSumEnd)
      // an unranked career is worse than any rank; score it at the table's tail so the median means
      // something rather than silently dropping the careers the constraint killed.
      const ra = a.bestWta ?? 1800
      const rb = b.bestWta ?? 1800
      dRank.push(rb - ra)
      if (b.bestRungEntered > a.bestRungEntered || rb < ra) improved++
    }
    console.log(
      `  ${padEnd(`${id} vs ${againstId}`, 26)}${pad(mean(dRung).toFixed(2), 10)}${pad(mean(dEntries).toFixed(1), 12)}` +
        `${pad(mean(dRank).toFixed(0), 13)}${pad(money(Math.round(mean(dPrize))), 15)}${pad(mean(dSkill).toFixed(1), 14)}` +
        `${pad(mean(dWeeks).toFixed(0), 15)}${pad(`${improved}/${n}`, 16)}`,
    )
  }
  console.log(`\n  d best rank is SIGNED: negative is better (a lower number is a higher rank). An unranked`)
  console.log(`  career is scored at #1800, the table's own size, rather than dropped.`)

  return all
}

// =================================================================================================
// §2  THE COACH LADDER, PRICED – five rungs, one background at a time
// =================================================================================================

function section2(): Career[] {
  console.log(`\n${rule()}`)
  console.log('§2  DOES THE COACH LADDER EARN ITS PRICE? – five rungs, same seeds, self-coaching as the control')
  console.log(rule())
  console.log(`
  ${SEEDS} seeds x 5 rungs x 3 backgrounds = ${SEEDS * 15} full careers. Within a background the seeds are
  IDENTICAL across rungs, so a row is the same girl with a different coach. Across backgrounds they
  are not (the background is in the seed string) – so read DOWN a background's block, not across.

  ⚠ THE BENCH ACCEPTS NO OFFERS AND BOOKS NOTHING. \`stepCareerWeek\` enters tournaments and does
  nothing else: no kit deal, no academy place, no sponsorship, no practice week, no vacation, no
  rescue package. Read every row as a FLOOR for a played career.
`)
  const all: Career[] = []
  for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
    console.log(`\n  ${'-'.repeat(108)}`)
    console.log(`  ${bg.toUpperCase()} – parent wage ${money(ECONOMY.parentIncomeCents[bg])}/wk at week 0, corridor x${coachCorridorMid(bg).toFixed(2)}`)
    console.log(`  ${'-'.repeat(108)}`)
    console.log(armHeader())
    const block: Career[] = []
    for (const tier of COACH_TIERS) {
      const arm: Arm = { id: `${bg}:${tier}`, label: `${bg} · ${tier}`, preset: presetOf(bg, tier) }
      const cs = runArm(arm, SEEDS)
      block.push(...cs)
      all.push(...cs)
      console.log(armRow(tier, cs))
    }
    // the price columns
    console.log(`\n  ${padEnd('rung', 10)}${pad('coach+court bill', 18)}${pad('entry+travel', 14)}${pad('skills @18', 12)}${pad('skills end', 12)}${pad('wks lost', 10)}${pad('$/skill pt vs self', 20)}${pad('$/rank place vs self', 22)}`)
    const selfCs = block.filter((c) => c.arm === `${bg}:self`)
    const selfBill = mean(selfCs.map((c) => catSum(c, CAT_COACH)))
    const selfSkill = mean(selfCs.map((c) => c.skillSumEnd))
    const selfRank = mean(selfCs.map((c) => c.bestWta ?? 1800))
    for (const tier of COACH_TIERS) {
      const cs = block.filter((c) => c.arm === `${bg}:${tier}`)
      const bill = mean(cs.map((c) => catSum(c, CAT_COACH)))
      const skill = mean(cs.map((c) => c.skillSumEnd))
      const rank = mean(cs.map((c) => c.bestWta ?? 1800))
      const dBill = bill - selfBill
      const dSkill = skill - selfSkill
      const dRank = selfRank - rank // positive = better
      console.log(
        `  ${padEnd(tier, 10)}${pad(money(Math.round(bill)), 18)}${pad(money(Math.round(mean(cs.map((c) => catSum(c, ['entry', 'travel']))))), 14)}` +
          `${pad(mean(cs.map((c) => c.skillSumByAge.get(18) ?? NaN)).toFixed(1), 12)}${pad(skill.toFixed(1), 12)}` +
          `${pad(mean(cs.map((c) => c.weeksLostToInjury)).toFixed(1), 10)}` +
          `${pad(tier === 'self' ? '– (control)' : dSkill > 0.05 ? money(Math.round(dBill / dSkill)) : 'BUYS NOTHING', 20)}` +
          `${pad(tier === 'self' ? '– (control)' : dRank > 0.5 ? money(Math.round(dBill / dRank)) : 'BUYS NOTHING', 22)}`,
      )
    }
  }
  return all
}

// =================================================================================================
// §3  WHEN DOES MONEY STOP BEING A DECISION?
// =================================================================================================

function section3(careers: Career[]): void {
  console.log(`\n${rule()}`)
  console.log('§3  WHEN DOES MONEY STOP BEING A DECISION? (task #103)')
  console.log(rule())
  console.log(`
  Per week, at the exact state the entry policy is about to read: is the MOST EXPENSIVE trip her
  ranking gate already opens refused by the reserve? If yes the wallet is choosing her tournament;
  if no, every door her racket opened is affordable and money is not in the decision.

  Weeks with no rung open at all are excluded from the denominator rather than counted as free.
`)
  const byArm = new Map<string, Career[]>()
  for (const c of careers) {
    if (!byArm.has(c.arm)) byArm.set(c.arm, [])
    byArm.get(c.arm)!.push(c)
  }
  console.log(
    `  ${padEnd('cell', 22)}${pad('n', 4)}${pad('weeks bound', 13)}${pad('share of open wks', 19)}` +
      `${pad('LAST binding wk', 17)}${pad('= age', 8)}${pad('never bound', 13)}${pad('bound to the end', 18)}`,
  )
  for (const [arm, cs] of byArm) {
    const last = cs.map((c) => c.lastBindingWeek)
    const never = cs.filter((c) => c.lastBindingWeek < 0).length
    const toEnd = cs.filter((c) => c.lastBindingWeek >= 0 && c.lastBindingWeek >= c.weeks - WEEKS_PER_YEAR).length
    const lastMed = pctl(last.filter((w) => w >= 0), 0.5)
    console.log(
      `  ${padEnd(arm, 22)}${pad(cs.length, 4)}${pad(pctl(cs.map((c) => c.bindingWeeks), 0.5), 13)}` +
        `${pad(`${(100 * mean(cs.map((c) => (c.weeksWithAnOpenRung ? c.bindingWeeks / c.weeksWithAnOpenRung : 0)))).toFixed(1)}%`, 19)}` +
        `${pad(Number.isNaN(lastMed) ? '–' : `w${lastMed}`, 17)}${pad(Number.isNaN(lastMed) ? '–' : (14 + lastMed / WEEKS_PER_YEAR).toFixed(1), 8)}` +
        `${pad(`${never}/${cs.length}`, 13)}${pad(`${toEnd}/${cs.length}`, 18)}`,
    )
  }

  console.log(`\n  3b. THE THREE PHASES OF A CAREER, by the same probe. Pooled over every cell above.\n`)
  const solvent = careers.filter((c) => !c.bankrupt && c.weeks > 4 * WEEKS_PER_YEAR)
  const phase = (c: Career): { tight: number; free: number } => {
    const cut = c.lastBindingWeek < 0 ? 0 : c.lastBindingWeek
    return { tight: cut, free: Math.max(0, c.weeks - cut) }
  }
  const tights = solvent.map((c) => phase(c).tight)
  const frees = solvent.map((c) => phase(c).free)
  console.log(`  n = ${solvent.length} careers that reached eighteen without folding`)
  console.log(`  ${padEnd('phase', 40)}${pad('median weeks', 14)}${pad('median years', 14)}${pad('share of career', 17)}`)
  console.log(
    `  ${padEnd('MONEY DECIDES (up to the last binding week)', 40)}${pad(pctl(tights, 0.5), 14)}` +
      `${pad((pctl(tights, 0.5) / WEEKS_PER_YEAR).toFixed(1), 14)}${pad(`${(100 * mean(solvent.map((c) => phase(c).tight / c.weeks))).toFixed(1)}%`, 17)}`,
  )
  console.log(
    `  ${padEnd('MONEY IS FREE (after it)', 40)}${pad(pctl(frees, 0.5), 14)}` +
      `${pad((pctl(frees, 0.5) / WEEKS_PER_YEAR).toFixed(1), 14)}${pad(`${(100 * mean(solvent.map((c) => phase(c).free / c.weeks))).toFixed(1)}%`, 17)}`,
  )
  const ages = solvent.filter((c) => c.lastBindingWeek >= 0).map((c) => 14 + c.lastBindingWeek / WEEKS_PER_YEAR)
  if (ages.length) {
    console.log(
      `\n  the crossover AGE: p10 ${pctl(ages, 0.1).toFixed(1)} · p25 ${pctl(ages, 0.25).toFixed(1)} · MEDIAN ${pctl(ages, 0.5).toFixed(1)}` +
        ` · p75 ${pctl(ages, 0.75).toFixed(1)} · p90 ${pctl(ages, 0.9).toFixed(1)}   (n=${ages.length}; ${solvent.length - ages.length} never bound at all)`,
    )
  }

  console.log(`\n  3c. THE FUNDS TRAJECTORY, per cell – funds at each season boundary, median career\n`)
  console.log(`  ${padEnd('cell', 22)}${[0, 2, 4, 6, 8, 12, 16, 20, 24].map((s) => pad(`age ${14 + s}`, 12)).join('')}`)
  for (const [arm, cs] of byArm) {
    const row = [0, 2, 4, 6, 8, 12, 16, 20, 24]
      .map((s) => {
        const vals = cs.map((c) => c.fundsByWeek[s]).filter((v) => v !== undefined)
        return pad(vals.length ? money(pctl(vals, 0.5)) : '–', 12)
      })
      .join('')
    console.log(`  ${padEnd(arm, 22)}${row}`)
  }
}

// =================================================================================================
// §4  THE EXCHANGE RATE AND THE LOOP – a lump grant at week 0
// =================================================================================================

const GRANTS = [0, 10_000_00, 25_000_00, 50_000_00, 100_000_00, 250_000_00]

function section4(): void {
  console.log(`\n${rule()}`)
  console.log('§4  THE EXCHANGE RATE – what a thousand dollars is worth in rungs, and how steep the loop is')
  console.log(rule())
  console.log(`
  ${SEEDS} seeds, ${ABLATION_PRESET.background} background, ${ABLATION_PRESET.coachTier}-coached, one lump grant at week 0 and nothing else changed.
  Exactly paired: the grant is the ONLY difference between two rows of the same index.
`)
  const rows: Array<{ grant: number; cs: Career[] }> = []
  console.log(armHeader())
  for (const g of GRANTS) {
    const cs = runArm({ id: `grant-${g}`, label: `+${money(g)}`, preset: ABLATION_PRESET, grantCents: g }, SEEDS)
    rows.push({ grant: g, cs })
    console.log(armRow(g === 0 ? 'no grant (control)' : `+${money(g)} at week 0`, cs))
  }
  console.log(rungLegend())

  console.log(`\n  4b. THE LOOP – what a granted dollar comes back as\n`)
  console.log(
    `  ${padEnd('grant', 18)}${pad('d rung', 10)}${pad('d entries', 12)}${pad('d best rank', 13)}` +
      `${pad('d career prize', 17)}${pad('PRIZE PER $1 GRANTED', 22)}${pad('d end funds', 15)}`,
  )
  const control = new Map(rows[0].cs.map((c) => [c.index, c]))
  for (const { grant, cs } of rows.slice(1)) {
    const dRung: number[] = []
    const dEntries: number[] = []
    const dRank: number[] = []
    const dPrize: number[] = []
    for (const c of cs) {
      const a = control.get(c.index)
      if (!a) continue
      dRung.push(c.bestRungEntered - a.bestRungEntered)
      dEntries.push(c.entries - a.entries)
      dRank.push((c.bestWta ?? 1800) - (a.bestWta ?? 1800))
      dPrize.push(c.prizeCents - a.prizeCents)
    }
    console.log(
      `  ${padEnd(`+${money(grant)}`, 18)}${pad(mean(dRung).toFixed(2), 10)}${pad(mean(dEntries).toFixed(1), 12)}` +
        `${pad(mean(dRank).toFixed(0), 13)}${pad(money(Math.round(mean(dPrize))), 17)}` +
        `${pad(`$${(mean(dPrize) / grant).toFixed(2)}`, 22)}${pad('–', 15)}`,
    )
  }
  console.log(`\n  A "prize per $1 granted" above 1.00 means the loop pays the grant back and the early game`)
  console.log(`  compounds. Below 1.00 it does not, and money is a floor rather than an engine.`)

  console.log(`\n  4c. MONEY AGAINST TALENT, in the SAME currency – rungs reached\n`)
  const talentArms: Array<[string, [number, number]]> = [
    ['talent p<10', [0, 10]],
    ['talent p10-50', [10, 50]],
    ['talent p50-90', [50, 90]],
    ['talent p90+', [90, 100]],
  ]
  console.log(armHeader())
  const talentRows: Array<{ label: string; cs: Career[] }> = []
  for (const [label, band] of talentArms) {
    const cs = runArm({ id: label, label, preset: ABLATION_PRESET, talentBand: band }, SEEDS)
    talentRows.push({ label, cs })
    console.log(armRow(label, cs))
  }
  const rungSpanTalent = mean(talentRows[3].cs.map((c) => c.bestRungEntered)) - mean(talentRows[0].cs.map((c) => c.bestRungEntered))
  const rungSpanMoney = mean(rows[rows.length - 1].cs.map((c) => c.bestRungEntered)) - mean(rows[0].cs.map((c) => c.bestRungEntered))
  const hrSpan = mean(talentRows[3].cs.map((c) => c.headroom)) - mean(talentRows[0].cs.map((c) => c.headroom))
  console.log(`\n  p<10 -> p90+ is ${hrSpan.toFixed(1)} points of headroom and moves the mean rung by ${rungSpanTalent.toFixed(2)}.`)
  console.log(`  $0 -> ${money(GRANTS[GRANTS.length - 1])} moves the mean rung by ${rungSpanMoney.toFixed(2)}.`)
  if (Math.abs(rungSpanTalent) > 0.001) {
    console.log(
      `  So ${money(GRANTS[GRANTS.length - 1])} is worth ${((rungSpanMoney / rungSpanTalent) * hrSpan).toFixed(1)} points of headroom, i.e. ` +
        `$1,000 ~ ${(((rungSpanMoney / rungSpanTalent) * hrSpan) / (GRANTS[GRANTS.length - 1] / 100_000)).toFixed(2)} points of talent.`,
    )
  }
}

// =================================================================================================
// §5  THE OWNER'S TWO PROPOSALS, priced without shipping either
// =================================================================================================

function section5(): void {
  console.log(`\n${rule()}`)
  console.log("§5  THE OWNER'S TWO PROPOSALS – priced, not shipped")
  console.log(rule())
  console.log(`
  «Стоит ли элитный тренер столько? Может быть он должен быть ощутимо дороже и открываться на проф
   карьере уже? Да и других можно пересмотреть, между budget и middle разница как будто небольшая.»

  ⚠ THIS IS THE ONLY SECTION THAT PATCHES A SHIPPED CONSTANT. \`ECONOMY.coach.hourlyRateCents\` is
  replaced in place, restored in a \`finally\`, and the restore is asserted – the tool exits 1 if the
  table is not byte-identical afterwards.
`)
  const original = ECONOMY.coach.hourlyRateCents
  const snapshot = JSON.stringify(original)
  const mut = ECONOMY.coach as unknown as { hourlyRateCents: Record<CoachTier, [number, number][]> }
  const scaleRow = (rows: [number, number][], f: number): [number, number][] =>
    rows.map(([lo, hi]) => [Math.round(lo * f), Math.round(hi * f)] as [number, number])

  interface Variant {
    id: string
    label: string
    build: () => Record<CoachTier, [number, number][]>
  }
  const base = JSON.parse(snapshot) as Record<CoachTier, [number, number][]>
  const VARIANTS: Variant[] = [
    { id: 'shipped', label: 'shipped', build: () => JSON.parse(snapshot) },
    {
      id: 'elite-x2',
      label: 'elite x2 (dearer)',
      build: () => ({ ...JSON.parse(snapshot), elite: scaleRow(base.elite, 2) }),
    },
    {
      id: 'elite-x3',
      label: 'elite x3 (much dearer)',
      build: () => ({ ...JSON.parse(snapshot), elite: scaleRow(base.elite, 3) }),
    },
    {
      id: 'gap-widened',
      label: 'middle x1.4 (gap widened)',
      build: () => ({ ...JSON.parse(snapshot), middle: scaleRow(base.middle, 1.4) }),
    },
  ]

  try {
    for (const bg of ['middle', 'wealthy'] as FamilyBackground[]) {
      console.log(`\n  ${'-'.repeat(108)}`)
      console.log(`  ${bg.toUpperCase()} background`)
      console.log(`  ${'-'.repeat(108)}`)
      console.log(armHeader())
      for (const v of VARIANTS) {
        mut.hourlyRateCents = v.build()
        for (const tier of (v.id === 'gap-widened' ? ['budget', 'middle'] : ['middle', 'elite']) as CoachTier[]) {
          const cs = runArm({ id: `${v.id}:${tier}`, label: `${v.label} · ${tier}`, preset: presetOf(bg, tier) }, SEEDS)
          console.log(armRow(`${padEnd(v.label, 26)} ${tier}`, cs))
        }
      }
    }
  } finally {
    mut.hourlyRateCents = original
    if (JSON.stringify(ECONOMY.coach.hourlyRateCents) !== snapshot) {
      console.error('\n⚠⚠ RESTORE FAILED – ECONOMY.coach.hourlyRateCents is not what it was. Do not trust this run.')
      process.exit(1)
    }
    console.log(`\n  ✓ ECONOMY.coach.hourlyRateCents restored byte-identical.`)
  }

  console.log(`\n  5b. THE ELITE GATE, as arithmetic. "Opens on the professional career" means a minimum`)
  console.log(`      age or a minimum standing before the rung is hireable at all.\n`)
  console.log(`  ${padEnd('gate', 30)}${pad('weeks of a 14->38 career it shuts out', 40)}${pad('career elite bill, middle bg', 30)}`)
  const plan = WEEK_PLAN_PRESETS.balanced
  const eliteBill = (fromAge: number, factor: number): number => {
    let total = 0
    for (let w = 0; w < FULL_CAREER_WEEKS; w++) {
      const ageYears = 14 + w / WEEKS_PER_YEAR
      if (ageYears < fromAge) continue
      const [lo, hi] = coachRateBandCents('elite', ageYears)
      total += coachWeeklyCents(((lo + hi) / 2) * factor, plan, 'middle')
    }
    return total
  }
  for (const [label, fromAge, factor] of [
    ['none (shipped)', 14, 1],
    ['from 16', 16, 1],
    ['from 18 (the pro career)', 18, 1],
    ['from 18 AND x2 dearer', 18, 2],
    ['from 18 AND x3 dearer', 18, 3],
  ] as Array<[string, number, number]>) {
    const shut = Math.round((fromAge - 14) * WEEKS_PER_YEAR)
    console.log(`  ${padEnd(label, 30)}${pad(`${shut} of ${FULL_CAREER_WEEKS} (${((100 * shut) / FULL_CAREER_WEEKS).toFixed(0)}%)`, 40)}${pad(money(eliteBill(fromAge, factor)), 30)}`)
  }
}

// =================================================================================================
// §7  THE LINGERER – the career the save actually shows
// =================================================================================================

function section7(): void {
  console.log(`\n${rule()}`)
  console.log('§7  THE LINGERER – what it costs to keep playing the rung you can win')
  console.log(rule())
  console.log(`
  The save that raised this shows a TWENTY-ONE-YEAR-OLD entering National Series. Over her last
  retained year, 7 of 21 appearances were on the DOMESTIC ladder for 555 points – nearly three times
  her whole professional book of 200 – and every one of those points is worth zero on the W table.

  Nothing in the engine forbids that, and each piece of it is a deliberate decision:
    * the domestic rungs carry NO \`maxAgeYears\` and no upper \`enterPointBand\` – they never close;
    * \`ladder-floor-2026-08.md\` turned the window's lower bound from a REFUSAL into a SORTING KEY,
      on the owner's own ruling that having somewhere to play is the correct state of the world;
    * a National title pays 200 points and a W15 title pays 15, so the ladder she should be leaving
      posts the bigger number on the screen.

  THE ARM: refuse a W-track event whenever ANY non-W event is open on the same week. That is not a
  rule change – it is a parent taking the draw his daughter can win, every time, which is what the
  sorting key permits and what the save appears to record.
`)
  const arms: Arm[] = [
    { id: 'up', label: 'steps up as soon as allowed', preset: ABLATION_PRESET },
    { id: 'linger', label: 'takes the winnable rung', preset: ABLATION_PRESET, preferLowerRung: true },
    { id: 'up-poor', label: '8k working: steps up', preset: presetOf('working', 'middle') },
    { id: 'linger-poor', label: '8k working: lingers', preset: presetOf('working', 'middle'), preferLowerRung: true },
  ]
  const all: Career[] = []
  console.log(armHeader())
  for (const arm of arms) {
    const cs = runArm(arm, SEEDS)
    all.push(...cs)
    console.log(armRow(arm.label, cs))
  }
  console.log(rungLegend())

  console.log(`\n  7b. WHERE THE WEEKS WENT – mean entries per career, by the table that pays them\n`)
  console.log(`  ${padEnd('arm', 30)}${pad('domestic', 12)}${pad('ITF junior', 13)}${pad('W professional', 17)}${pad('% of entries that', 20)}`)
  console.log(`  ${padEnd('', 30)}${pad('', 12)}${pad('', 13)}${pad('', 17)}${pad('paid W points', 20)}`)
  for (const arm of arms) {
    const cs = all.filter((c) => c.arm === arm.id)
    const tally = (track: string): number =>
      mean(cs.map((c) => TIER_LADDER.filter((t) => TIERS[t].track === track).reduce((a, t) => a + c.entriesByTier[t], 0)))
    const dom = tally('domestic')
    const itf = tally('itf')
    const wta = tally('wta')
    console.log(
      `  ${padEnd(arm.label, 30)}${pad(dom.toFixed(1), 12)}${pad(itf.toFixed(1), 13)}${pad(wta.toFixed(1), 17)}` +
        `${pad(`${((100 * wta) / Math.max(1, dom + itf + wta)).toFixed(1)}%`, 20)}`,
    )
  }

  console.log(`\n  7c. PAIRED – the lingerer against herself, same seeds\n`)
  const idx = new Map<string, Map<number, Career>>()
  for (const c of all) {
    if (!idx.has(c.arm)) idx.set(c.arm, new Map())
    idx.get(c.arm)!.set(c.index, c)
  }
  console.log(
    `  ${padEnd('pair', 34)}${pad('d 1st W age', 13)}${pad('d peak rank', 13)}${pad('d rung', 9)}` +
      `${pad('d peak pts', 12)}${pad('d prize', 15)}${pad('d end skills', 14)}${pad('worse in', 10)}`,
  )
  for (const [a, b] of [['up', 'linger'], ['up-poor', 'linger-poor']] as Array<[string, string]>) {
    const base = idx.get(a)!
    const other = idx.get(b)!
    const d = { age: [] as number[], rank: [] as number[], rung: [] as number[], pts: [] as number[], prize: [] as number[], sk: [] as number[] }
    let worse = 0
    let n = 0
    for (const [i, x] of base) {
      const y = other.get(i)
      if (!y) continue
      n++
      if (!Number.isNaN(x.firstWAge) && !Number.isNaN(y.firstWAge)) d.age.push(y.firstWAge - x.firstWAge)
      const rx = x.bestWta ?? 1800
      const ry = y.bestWta ?? 1800
      d.rank.push(ry - rx)
      d.rung.push(y.bestRungEntered - x.bestRungEntered)
      d.pts.push(y.peakWtaPoints - x.peakWtaPoints)
      d.prize.push(y.prizeCents - x.prizeCents)
      d.sk.push(y.skillSumEnd - x.skillSumEnd)
      if (ry > rx) worse++
    }
    console.log(
      `  ${padEnd(`${b} vs ${a}`, 34)}${pad(d.age.length ? `+${mean(d.age).toFixed(2)}y` : '–', 13)}` +
        `${pad(mean(d.rank) >= 0 ? `+${mean(d.rank).toFixed(0)}` : mean(d.rank).toFixed(0), 13)}${pad(mean(d.rung).toFixed(2), 9)}` +
        `${pad(mean(d.pts).toFixed(0), 12)}${pad(money(Math.round(mean(d.prize))), 15)}${pad(mean(d.sk).toFixed(1), 14)}${pad(`${worse}/${n}`, 10)}`,
    )
  }
  console.log(`\n  d peak rank POSITIVE IS WORSE. An unranked career scores #1800.`)
}

// =================================================================================================
// §6  THE TWO SAVES – read locally through the engine's own import door
// =================================================================================================

async function section6(paths: string[]): Promise<void> {
  console.log(`\n${rule()}`)
  console.log('§6  THE CAREERS THAT ASKED THE QUESTION – read through decodeExportFile, nothing committed')
  console.log(rule())
  for (const path of paths) {
    const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
    console.log(`\n  ${path.split('/').pop()}  ·  week ${w.week}  ·  age ${kidAgeExact(w.week, w.profile.birthMonth, w.profile.birthDay).toFixed(2)}`)
    console.log(`  background ${w.profile.background} · coach rung ${w.profile.coachTier} · coachId ${w.coachId ?? 'none'} · condition ${w.condition}`)
    const start = startingSkills(w.seed, w.profile)
    const pot = w.potential as unknown as Record<string, number>
    const sk = w.skills as unknown as Record<string, number>
    const headroom = SKILL_KEYS.reduce((a, k) => a + (pot[k] - start[k]), 0)
    console.log(
      `  headroom ${headroom.toFixed(1)} (p${headroomPercentile(headroom).toFixed(2)}) · skills summed ${SKILL_KEYS.reduce((a, k) => a + sk[k], 0).toFixed(1)}` +
        ` · funds ${money(w.fundsCents)} · career prize ${money(w.careerTotals.prizeCents)}`,
    )
    console.log(`  wta #${w.kidRankWta ?? '–'} · points ${kidPoints(w, 'wta')} · weeks lost to injury ${w.careerTotals.weeksLostToInjury}`)

    // what the ledger says over the retained window – the same fold the money screens do
    const cat: Record<string, number> = {}
    for (const fw of w.financeWeeks) for (const [k, v] of Object.entries(fw.byCategory)) cat[k] = (cat[k] ?? 0) + (v as number)
    const first = w.financeWeeks[0]?.week
    const last = w.financeWeeks[w.financeWeeks.length - 1]?.week
    console.log(`\n  the ledger over the retained ${w.financeWeeks.length} weeks (w${first}..w${last}):`)
    for (const [k, v] of Object.entries(cat).sort((a, b) => a[1] - b[1])) console.log(`    ${padEnd(k, 14)}${pad(money(v), 14)}`)

    // the doors, asked of the engine
    console.log(`\n  the ladder's own doors, asked of tierFloorOpen:`)
    for (const t of W_RUNGS) {
      console.log(`    ${padEnd(t, 12)}accepts ${padEnd(TIERS[t].acceptsRank ?? 'on-ramp', 10)}${tierFloorOpen(w, t) ? 'OPEN' : 'shut'}`)
    }

    // ⚠ THE TURNSTILE, ON HER OWN LEDGER. `TIERS.w15.enterPointBand` is [120, MAX]: 120 ITF junior
    // points open the professional ladder and there is no upper bound, so every junior point above
    // 120 is worth exactly nothing on the professional table. This walks her retained results in
    // week order and reports when she paid the 120, when she first played a W event, and how many
    // times over she paid.
    const mine = [...w.results].filter((r) => r.playerId === 'kid' && r.tier !== undefined).sort((a, b) => a.week - b.week)
    const isJ = (t: TierId): boolean => TIERS[t].track === 'itf'
    const isW = (t: TierId): boolean => TIERS[t].track === 'wta'
    let cumJ = 0
    let crossed120 = -1
    let firstW = -1
    let cumW = 0
    for (const r of mine) {
      const t = r.tier as TierId
      if (isJ(t)) {
        cumJ += r.points
        if (crossed120 < 0 && cumJ >= TIERS.w15.enterPointBand![0]) crossed120 = r.week
      }
      if (isW(t)) {
        cumW += r.points
        if (firstW < 0) firstW = r.week
      }
    }
    const span = mine.length ? `w${mine[0].week}..w${mine[mine.length - 1].week}` : 'none'
    console.log(`\n  THE 120-POINT TURNSTILE (TIERS.w15.enterPointBand = [${TIERS.w15.enterPointBand?.[0]}, no ceiling])`)
    console.log(`  results retained: ${mine.length} rows, ${span}  ⚠ a ROLLING window – anything older is gone, so these are LOWER BOUNDS`)
    console.log(`    junior (ITF) points earned in the window : ${cumJ}   = ${(cumJ / 120).toFixed(1)}x the turnstile`)
    console.log(`    professional (WTA) points earned         : ${cumW}`)
    console.log(`    first week the running ITF total cleared 120 : ${crossed120 < 0 ? 'not inside the window' : `w${crossed120} (age ${kidAgeExact(crossed120, w.profile.birthMonth, w.profile.birthDay).toFixed(1)})`}`)
    console.log(`    first W-track result in the window          : ${firstW < 0 ? 'none' : `w${firstW} (age ${kidAgeExact(firstW, w.profile.birthMonth, w.profile.birthDay).toFixed(1)})`}`)
    const jRows = mine.filter((r) => isJ(r.tier as TierId))
    const wRows = mine.filter((r) => isW(r.tier as TierId))
    console.log(`    appearances in the window: ${jRows.length} junior, ${wRows.length} professional, ${mine.length - jRows.length - wRows.length} domestic`)
    const byTier = new Map<TierId, { n: number; pts: number }>()
    for (const r of mine) {
      const t = r.tier as TierId
      const b = byTier.get(t) ?? { n: 0, pts: 0 }
      b.n++
      b.pts += r.points
      byTier.set(t, b)
    }
    console.log(`    where those weeks were actually spent:`)
    for (const t of TIER_LADDER) {
      const b = byTier.get(t)
      if (b) console.log(`      ${padEnd(t, 10)}${pad(b.n, 4)} appearances${pad(b.pts, 8)} pts  (${TIERS[t].track})`)
    }

    // and the budget probe, on the live save
    const probe = budgetProbe(w, POLICY)
    console.log(`\n  the §3 budget probe on this save RIGHT NOW: ${probe.open ? (probe.binds ? 'THE BUDGET BINDS' : 'money is not in the decision') : 'no rung open in the window'}`)
    console.log(`  what a season of her own rung would cost her today, at the balanced plan:`)
    for (const tier of COACH_TIERS) {
      const ageYears = kidAgeExact(w.week, w.profile.birthMonth, w.profile.birthDay)
      const [lo, hi] = coachRateBandCents(tier, ageYears)
      const weekly =
        tier === 'self'
          ? Math.round(facilityRateCents(ageYears, tier) * coachHoursForPlan(w.plan) * coachCorridorMid(w.profile.background))
          : coachWeeklyCents((lo + hi) / 2, w.plan, w.profile.background)
      console.log(
        `    ${padEnd(tier, 10)}${pad(`${money(weekly)}/wk`, 14)}${pad(`${money(weekly * WEEKS_PER_YEAR)}/yr`, 16)}` +
          `${pad(`${((100 * weekly * WEEKS_PER_YEAR) / Math.max(1, w.fundsCents)).toFixed(1)}% of her funds`, 24)}` +
          `${pad(`dev x${coachFactor(tier, 'good').toFixed(3)}`, 16)}`,
      )
    }
  }
}

// =================================================================================================

async function main(): Promise<void> {
  const t0 = Date.now()
  console.log(`\nwhat-money-buys · ${SEEDS} seeds/arm · full careers 14->38 (${FULL_CAREER_WEEKS} weeks max) · "${POLICY.label}" policy`)
  if (wants('0')) section0()
  if (wants('1')) section1()
  let coachCareers: Career[] | null = null
  if (wants('2')) coachCareers = section2()
  if (wants('3')) {
    if (!coachCareers) coachCareers = section2()
    section3(coachCareers)
  }
  if (wants('4')) section4()
  if (wants('5')) section5()
  if (wants('7')) section7()
  if (wants('6') && SAVES.length) await section6(SAVES)
  console.log(`\ndone in ${((Date.now() - t0) / 1000).toFixed(0)}s`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
