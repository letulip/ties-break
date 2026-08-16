/**
 * runway-probe – HOW MANY WEEKS OF THE BILL IS THE FAMILY ACTUALLY HOLDING, AND DOES HIRING UP BUY
 * CHARITY?
 *
 * ⚠ MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture, reads no
 * save. It exists to SIZE the need gate under the local-sponsor cameo rather than to have it picked.
 * See docs/specs/need-not-background-2026-08.md.
 *
 * THE QUESTION. The cameo used to gate on the row in the profile (`eligible: ['working']`); the owner
 * ruled on 10.08 that the gate is «порог по деньгам на счету, а не по строчке в анкете» – a RUNWAY:
 * how many weeks of her committed bill the balance still covers. A flat dollar threshold cannot be
 * right for the reason `ECONOMY.sponsorship` already gives – the weekly bill runs through the coach
 * rung, the court that follows it and the wealth corridor, so $3,000 is a season to one family and a
 * fortnight to another.
 *
 * TWO DENOMINATORS ARE MEASURED SIDE BY SIDE, because the choice between them is the whole
 * anti-exploit argument and it should be made on numbers:
 *   * TOTAL – `weeklyBillSplit().totalCents`, the whole training bill. Hiring up SHRINKS the runway
 *     twice over (it drains the balance AND inflates the denominator), so it walks the family toward
 *     charity.
 *   * COURT – `weeklyBillSplit().facilityCents`, the half she cannot get out of: you cannot train
 *     without booking a court, and it is charged at every rung including `self`. Hiring up still
 *     drains the balance – that is need, and it should count – but it no longer inflates the unit
 *     the need is measured in.
 *
 * ⚠ IT RE-DERIVES THE ENGINE'S OWN QUANTITY RATHER THAN GUESSING AT IT. `resolveBaseCosts` is the
 * first thing `tickWeek` does, so at the moment the cameo is decided the balance is exactly
 * (funds at the top of the week) − (this week's bill, when it is billed at all). The corridor comes
 * off the same deterministic `seed:coachbg:<week>` sub-stream the engine reads and
 * `coachWorksThisWeek` is the engine's own predicate. The one input it cannot see without spending a
 * MAIN draw is the week's ±8% jitter, so the bill is quoted at the middle of that band – worth at
 * most half a week of runway at these thresholds, and it moves numerator and denominator together.
 *
 * Run:
 *   npx vite-node tools/runway-probe.ts -- [--seeds 50] [--weeks 208] [--mode cells|rungs]
 */
import { rngFromSeed } from '../src/engine/rng'
import { acceptOffer, ageAtWeek, coachWorksThisWeek, createWorld, type WorldState } from '../src/engine/world'
import { inCollege } from '../src/engine/world/college'
import { coachById, coachCorridorFactor, facilityRateCents, tierOf, weeklyBillSplit } from '../src/engine/coach'
import { stepCareerWeek, POLICIES } from './econ-bench'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type CoachTier, type FamilyBackground, type PlayerProfile } from '../src/shared/protocol'

const DEFAULT_SEEDS = 50
const DEFAULT_WEEKS = 4 * WEEKS_PER_YEAR

/** Candidate gates, in weeks of runway. Two ladders, because the two denominators live on different
 *  scales – the court is roughly 40% of an ordinary academy's bill and all of a self-coached one. */
const CANDIDATES_TOTAL = [8, 12, 16, 20, 24, 28, 32, 40, 52, 70]
const CANDIDATES_COURT = [32, 40, 46, 50, 52, 54, 56, 58, 60, 64, 72, 90]

interface Arm {
  label: string
  background: FamilyBackground
  coach: CoachTier | null
}

// The same four cells tools/two-cells.ts runs, in the same order, so the two reports read side by side.
const CELLS: Arm[] = [
  { label: 'olivia  8k · self-coached', background: 'working', coach: null },
  { label: 'ines   25k · middle coach', background: 'middle', coach: 'middle' },
  { label: 'control 8k · middle coach', background: 'working', coach: 'middle' },
  { label: 'control 25k · self-coached', background: 'middle', coach: null },
]

/** THE GRADIENT SWEEP – the same background, every rung of the ladder. If the cameo's hit rate rises
 *  as she hires up, a need gate is paying for the coach. */
const RUNGS: CoachTier[] = ['self', 'budget', 'middle', 'high', 'elite']
const SWEEP: Arm[] = (['working', 'middle'] as FamilyBackground[]).flatMap((bg) =>
  RUNGS.map((r) => ({ label: `${bg.padEnd(7)} · ${r}`, background: bg, coach: r === 'self' ? null : r })),
)

function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}

function quantile(xs: number[], q: number): number {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]
}

interface WeekRunway {
  total: number
  court: number
  totalBillCents: number
  courtBillCents: number
}

/** The runway the engine itself would see at the cameo, on both denominators. */
function runwayAt(world: WorldState): WeekRunway {
  const age = ageAtWeek(world.week)
  const coach = coachById(world.seed, age, world.coachId)
  const tier = tierOf(coach)
  const rate = coach ? coach.rateCents : facilityRateCents(age, tier)
  const corridor = coachCorridorFactor(world.seed, world.week, world.profile.background)
  const split = weeklyBillSplit({
    rateCents: rate,
    ageYears: age,
    tier,
    plan: world.plan,
    background: world.profile.background,
    corridor,
  })
  const funds = world.fundsCents - (coachWorksThisWeek(world) ? split.totalCents : 0)
  const inf = Number.POSITIVE_INFINITY
  return {
    total: split.totalCents > 0 ? funds / split.totalCents : inf,
    court: split.facilityCents > 0 ? funds / split.facilityCents : inf,
    totalBillCents: split.totalCents,
    courtBillCents: split.facilityCents,
  }
}

interface ArmStats {
  totals: number[]
  courts: number[]
  totalBills: number[]
  courtBills: number[]
  underTotal: number[]
  underCourt: number[]
  weeks: number
  careers: number
  /** the runway on week 0, per career – the owner's item 16 ("it paid Olivia in week 2") */
  zeroTotal: number[]
  zeroCourt: number[]
  /** the LOWEST runway each career reaches inside its FIRST season */
  min0Total: number[]
  min0Court: number[]
  underCourtBySeason: number[][]
  weeksBySeason: number[]
}

function runArm(arm: Arm, seeds: number, weeks: number): ArmStats {
  const seasons = Math.ceil(weeks / WEEKS_PER_YEAR)
  const st: ArmStats = {
    totals: [], courts: [], totalBills: [], courtBills: [],
    underTotal: CANDIDATES_TOTAL.map(() => 0),
    underCourt: CANDIDATES_COURT.map(() => 0),
    weeks: 0, careers: seeds,
    zeroTotal: [], zeroCourt: [], min0Total: [], min0Court: [],
    underCourtBySeason: CANDIDATES_COURT.map(() => new Array<number>(seasons).fill(0)),
    weeksBySeason: new Array<number>(seasons).fill(0),
  }
  for (let s = 0; s < seeds; s++) {
    const seed = `seed-${s}`
    const profile: PlayerProfile = {
      ...DEFAULT_PROFILE,
      background: arm.background,
      coachTier: arm.coach ?? 'self',
    }
    const world: WorldState = createWorld(seed, profile)
    const rng = rngFromSeed(`${seed}:bench`)
    let min0T = Number.POSITIVE_INFINITY
    let min0C = Number.POSITIVE_INFINITY
    for (let i = 0; i < weeks; i++) {
      // two-cells signs every letter it is sent; a kit deal moves the gear bill, so the probe has to
      // be the same career or its balances are somebody else's.
      if (!world.ending) {
        for (const o of world.offers) {
          if (o.kind !== 'kit' || o.state !== 'open' || world.week > o.deadlineWeek) continue
          try {
            acceptOffer(world, o.id)
          } catch {
            /* one brand at a time */
          }
        }
      }
      if (!inCollege(world) && !world.ending) {
        const r = runwayAt(world)
        const season = Math.min(seasons - 1, Math.floor(world.week / WEEKS_PER_YEAR))
        st.totals.push(r.total)
        st.courts.push(r.court)
        st.totalBills.push(r.totalBillCents)
        st.courtBills.push(r.courtBillCents)
        st.weeks++
        st.weeksBySeason[season]++
        if (i === 0) {
          st.zeroTotal.push(r.total)
          st.zeroCourt.push(r.court)
        }
        if (world.week < WEEKS_PER_YEAR) {
          if (r.total < min0T) min0T = r.total
          if (r.court < min0C) min0C = r.court
        }
        for (let c = 0; c < CANDIDATES_TOTAL.length; c++) if (r.total < CANDIDATES_TOTAL[c]) st.underTotal[c]++
        for (let c = 0; c < CANDIDATES_COURT.length; c++) {
          if (r.court < CANDIDATES_COURT[c]) {
            st.underCourt[c]++
            st.underCourtBySeason[c][season]++
          }
        }
      }
      stepCareerWeek(world, rng, POLICIES[1])
    }
    if (Number.isFinite(min0T)) st.min0Total.push(min0T)
    if (Number.isFinite(min0C)) st.min0Court.push(min0C)
  }
  return st
}

function cameoPerCareer(underWeeks: number, careers: number, perHit: number): number {
  return (underWeeks / careers) * ECONOMY.sponsor.rollChance * perHit
}

function main(): void {
  const args = process.argv.slice(2)
  let seeds = DEFAULT_SEEDS
  let weeks = DEFAULT_WEEKS
  let mode = 'cells'
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seeds') seeds = Number(args[++i])
    if (args[i] === '--weeks') weeks = Number(args[++i])
    if (args[i] === '--mode') mode = args[++i]
  }
  const [lo, hi] = ECONOMY.sponsor.amountCents
  const perHit = (lo + hi) / 2
  const arms = mode === 'rungs' ? SWEEP : CELLS
  console.log(`runway-probe (${mode}): ${seeds} seeds x ${weeks} weeks (${(weeks / WEEKS_PER_YEAR).toFixed(0)} seasons)`)
  console.log(`cameo: ${(100 * ECONOMY.sponsor.rollChance).toFixed(0)}% a week, mean gift ${money(perHit)}\n`)

  const all: Array<[Arm, ArmStats]> = []
  for (const arm of arms) all.push([arm, runArm(arm, seeds, weeks)])

  const bar = '-'.repeat(104)
  console.log(`${bar}\nTHE BILL AND THE BALANCE, per decided week\n${bar}`)
  console.log(`  ${'cell'.padEnd(28)}${'bill/wk'.padStart(9)}${'court/wk'.padStart(10)}   ` +
    `${'TOTAL runway p10/p50'.padStart(24)}   ${'COURT runway p10/p50'.padStart(24)}`)
  for (const [arm, st] of all) {
    console.log(
      `  ${arm.label.padEnd(28)}${money(quantile(st.totalBills, 0.5)).padStart(9)}` +
        `${money(quantile(st.courtBills, 0.5)).padStart(10)}   ` +
        `${(quantile(st.totals, 0.1).toFixed(1) + ' / ' + quantile(st.totals, 0.5).toFixed(1)).padStart(24)}   ` +
        `${(quantile(st.courts, 0.1).toFixed(1) + ' / ' + quantile(st.courts, 0.5).toFixed(1)).padStart(24)}`,
    )
  }

  for (const which of ['TOTAL', 'COURT'] as const) {
    const cands = which === 'TOTAL' ? CANDIDATES_TOTAL : CANDIDATES_COURT
    console.log(`\n${bar}\nGATE ON THE ${which} BILL – % of decided weeks under N, and the cameo it buys per career\n${bar}`)
    console.log(`  ${'N'.padEnd(6)}` + all.map(([a]) => a.label.trim().slice(0, 20).padStart(22)).join(''))
    for (let c = 0; c < cands.length; c++) {
      const cells = all.map(([, st]) => {
        const under = which === 'TOTAL' ? st.underTotal[c] : st.underCourt[c]
        const share = st.weeks ? under / st.weeks : 0
        return `${(100 * share).toFixed(0).padStart(4)}% ${money(cameoPerCareer(under, st.careers, perHit)).padStart(8)}`.padStart(22)
      })
      console.log(`  ${String(cands[c]).padEnd(6)}` + cells.join(''))
    }
  }

  console.log(`\n${bar}\nTHE CEILING ON N – nobody is in need before a ball is struck (owner, item 16)\n${bar}`)
  for (const [arm, st] of all) {
    console.log(
      `  ${arm.label.padEnd(28)} week 0: TOTAL ${quantile(st.zeroTotal, 0.5).toFixed(1).padStart(7)}` +
        ` COURT ${quantile(st.zeroCourt, 0.5).toFixed(1).padStart(7)}` +
        `  |  worst week-0 COURT ${Math.min(...st.zeroCourt).toFixed(1).padStart(7)}` +
        `  |  lowest COURT in season 0 ${Math.min(...st.min0Court).toFixed(1).padStart(7)}`,
    )
  }
  const zeroFloorCourt = Math.min(...all.map(([, st]) => Math.min(...st.zeroCourt)))
  const zeroFloorTotal = Math.min(...all.map(([, st]) => Math.min(...st.zeroTotal)))
  console.log(
    `\n  N < ${zeroFloorCourt.toFixed(1)} (COURT) / ${zeroFloorTotal.toFixed(1)} (TOTAL) keeps the gate shut on week 0 for every cell and every seed.`,
  )

  if (mode === 'cells') {
    console.log(`\n${bar}\nWHEN THE COURT GATE OPENS – % of that cell's weeks under N, by season 0/1/2/3\n${bar}`)
    for (let c = 0; c < CANDIDATES_COURT.length; c++) {
      const line = all
        .map(([, st]) =>
          st.weeksBySeason
            .map((w, s) => (w ? `${Math.round((100 * st.underCourtBySeason[c][s]) / w)}` : '-').padStart(4))
            .join('')
            .padStart(22),
        )
        .join('')
      console.log(`  N=${String(CANDIDATES_COURT[c]).padEnd(4)}` + line)
    }
    console.log(`\n  cells, in order: ${CELLS.map((a) => a.label.trim()).join('  |  ')}`)
  }
}

main()
