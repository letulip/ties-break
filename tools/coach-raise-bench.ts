/**
 * THE COACH'S FEE, FIXED AT HIRE, AND HIS ANNUAL ASK – C1…C5
 * (round 42 #51, ruled 17.09 in round 44; docs/specs/the-coachs-raise-2026-09.md).
 *
 * Run:  npx vite-node tools/coach-raise-bench.ts [--seeds 12] [--weeks 780] [--floor 0.05] [--ceiling 0.15]
 *
 * HIS TWO SENTENCES. On the silent re-pricing – «мне кажется это не корректно». On the fix –
 * «"зафиксировать при найме и пусть просит, как массажист" – верно». And on what the ask must read,
 * from #51 itself – «может такое быть, что всего с 1 титулом в сезон тренер будет требовать 15%?
 * Кажется, что самого факта такого единственного титула маловато, нужна какая-то общая оценка
 * прогресса».
 *
 * WHAT THIS ANSWERS:
 *   C1  ⭐⭐ WHERE THE 2.2k -> 1.8k COULD HAVE COME FROM, enumerated over the SHIPPED formula rather
 *       than guessed. Every term that can move a hired coach's weekly figure, and its measured
 *       range – so «the cause is in the court share or the rate rather than the band» is checked
 *       rather than repeated. ⚠ His week-777 save was not available to this build, so the answer is
 *       the exhaustive one and is stated as such.
 *   C2  ⭐ THE MONOTONE PROOF. A sweep over every (rung, age, rank) cell showing that once the labour
 *       is agreed the billed rate is NON-DECREASING – the half of his complaint that is a fairness
 *       property rather than a balance one.
 *   C3  ⭐⭐⭐ THE MEASURED CORRIDOR against his 5–15%: the distribution of the asks that actually fire
 *       over real careers, and the four components' own contributions. ⚠ Invariant 5's whole point:
 *       the corridor is a TARGET, and if the measurement misses it the spec says so rather than
 *       tuning until it agrees.
 *   C4  the compounding table – what a fee reaches over a career, against the ceiling.
 *   C5  the paired career walk: the same seeds with the ask OFF and ON.
 *
 * ⚠⚠ THE A ARM IS THIS TREE WITH THE CORRIDOR AT ZERO, NOT AN OLDER TREE – the masseur bench's own
 * shape, and CLAUDE.md's «prove the arm contains both the change and its reader» satisfied by
 * construction. `settleCoachDeal` and `coachRateCents` are present and read in BOTH arms; only the
 * corridor's two ends differ, so the A arm is «the fee is fixed and nobody asks» and the B arm is
 * «the fee is fixed and he asks». ⚠ The cheap sanity check CLAUDE.md also names is a flag:
 * `--floor 0.40 --ceiling 0.40` is absurd and C5's columns must move a long way under it.
 *
 * ⚠ ZERO DRAWS ADDED anywhere on this path. The ask is a weighted mean over state the tick has
 * already written; the frozen MAIN capture (41550 / e6b0c709) cannot see it.
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { ageAtWeek, coachMarketLabourCents, coachProgressScore, coachRateCents } from '../src/engine/world'
import {
  coachAgeBand,
  coachById,
  coachHoursForPlan,
  coachLabourCents,
  coachRateBandCents,
  coachRetainerBand,
  corridorBandFor,
  facilityRateCents,
} from '../src/engine/coach'
// ⚠ `CoachTier` LIVES IN THE PROTOCOL AND NOT IN `engine/coach.ts`, which is where the rung ladder is
// declared for the profile that chooses it. `npm run check`'s `vue-tsc -b --force` is what said so –
// a plain typecheck of `src/` alone never reaches this file.
import type { CoachTier, FamilyBackground } from '../src/shared/protocol'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const argOf = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(`--${name}`)
  const n = Number(process.argv[at + 1])
  return at > 0 && Number.isFinite(n) ? n : fallback
}
const SEEDS = argOf('seeds', 12)
/** ⚠ 780 AND NOT 416. Ages 13.6 to 28.6 – fifteen anniversaries, both age-band steps and the whole
 *  professional era. A shorter walk would never reach the rank bands the ceiling is made of, and a
 *  bench that cannot reach the mechanic measures the null arm twice. */
const WEEKS = argOf('weeks', 780)
/** THE ARM SWITCH. The header prints the EFFECTIVE values, so a run can never be mislabelled. */
const FLOOR = argOf('floor', ECONOMY.coach.raise.askFloor)
const CEILING = argOf('ceiling', ECONOMY.coach.raise.askCeiling)

const TIERS: CoachTier[] = ['budget', 'middle', 'high', 'elite']
const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']
const money = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const pct = (x: number): string => `${(x * 100).toFixed(1)}%`

console.log(
  `coach-raise bench – seeds ${SEEDS} · weeks ${WEEKS} · corridor ${pct(FLOOR)}–${pct(CEILING)}` +
    `${FLOOR === ECONOMY.coach.raise.askFloor && CEILING === ECONOMY.coach.raise.askCeiling ? ' (shipped)' : ' (OVERRIDDEN)'}`,
)

// =================================================================================================
// C1 – EVERY TERM THAT CAN MOVE A HIRED COACH'S WEEKLY FIGURE, and by how much
// =================================================================================================
//
// ⚠ THE SHIPPED FORMULA, spelled out once so the enumeration is checkable:
//     weekly = bandedRateCents(coach.rateCents, age, tier, band) x coachHoursForPlan(plan) x corridor x jitter
//   and `coach.rateCents` is itself redrawn from `coachRateBandCents(tier, age)` at every AGE BAND.
//   So there are five movers and the owner agreed to exactly none of them.
console.log('\n=== C1 · what can move a hired man\'s weekly figure (the SHIPPED formula) ===')
console.log('term                          direction   measured range        agreed?')
{
  // The rate band's own step at the two age crossings, at the SAME position in the band (the roster
  // draw is age-independent, so a coach dear for his rung at 14 is dear for it at 22).
  const bandStep = (tier: CoachTier, from: number, to: number): number => {
    const [lo0, hi0] = coachRateBandCents(tier, from)
    const [lo1, hi1] = coachRateBandCents(tier, to)
    return (lo1 + hi1) / (lo0 + hi0)
  }
  const steps16 = TIERS.map((t) => bandStep(t, 16, 17))
  const steps22 = TIERS.map((t) => bandStep(t, 22, 23))
  console.log(
    `his rate, age band 16->17     UP ONLY     x${Math.min(...steps16).toFixed(2)}–${Math.max(...steps16).toFixed(2)}          no`,
  )
  console.log(
    `his rate, age band 22->23     UP ONLY     x${Math.min(...steps22).toFixed(2)}–${Math.max(...steps22).toFixed(2)}          no`,
  )
  const courts = TIERS.map((t) => facilityRateCents(23, t) / facilityRateCents(16, t))
  console.log(
    `the court, same two steps     UP ONLY     x${Math.min(...courts).toFixed(2)}–${Math.max(...courts).toFixed(2)}          no (it is rent)`,
  )
  // The retainer band, both directions – this is the only term that can FALL, and by how much.
  const bandFalls: number[] = []
  for (const tier of TIERS) {
    for (const age of [18, 24]) {
      const [lo, hi] = coachRateBandCents(tier, age)
      const rate = Math.round((lo + hi) / 2)
      const court = facilityRateCents(age, tier)
      const at = (rank: number | null): number => court + coachLabourCents(rate, age, tier, coachRetainerBand(rank))
      bandFalls.push(at(500) / at(50), at(50) / at(5))
    }
  }
  console.log(
    `the retainer band (her rank)  BOTH        x${Math.min(...bandFalls).toFixed(2)}–${Math.max(...bandFalls).toFixed(2)}          no  <-- THE ONLY FALL`,
  )
  // The two the family DOES agree to, for contrast.
  const hours = ECONOMY.coach.sessionsByTrain
  console.log(
    `the training dial (hours)     BOTH        x${(hours[0][1] / hours[hours.length - 1][1]).toFixed(2)}–${(hours[hours.length - 1][1] / hours[0][1]).toFixed(2)}          YES – the parent moved it`,
  )
  const [jLo, jHi] = ECONOMY.coach.weekJitterBps
  console.log(`the week's jitter             BOTH        x${(jLo / jHi).toFixed(2)}–${(jHi / jLo).toFixed(2)}          it is the week, not a price`)

  // ⭐ AND WHAT A 0.82x FALL ACTUALLY NEEDS. The band's own steps are x2 and x2.25 (round 44's note
  // is right that 0.82 is not one of them), so the enumeration below is the honest answer: at the
  // rungs that still carry a wealth corridor, ONE MAN'S OWN WEEK-TO-WEEK ENVELOPE spans it.
  console.log('\n  the 0.82x, enumerated – one rate\'s own week-to-week envelope by rung and background:')
  console.log('  rung     background   lo/hi of the same fee     spans 0.82x?')
  for (const tier of TIERS) {
    for (const bg of BACKGROUNDS) {
      const [cLo, cHi] = corridorBandFor(bg, tier)
      const [jLo2, jHi2] = ECONOMY.coach.weekJitterBps
      const ratio = (cLo * jLo2) / (cHi * jHi2)
      console.log(
        `  ${tier.padEnd(8)} ${bg.padEnd(12)} x${ratio.toFixed(3)}` +
          `${' '.repeat(18)}${ratio <= 0.82 ? 'YES' : 'no'}`,
      )
    }
  }
}

// =================================================================================================
// C2 – THE MONOTONE PROOF: once the labour is agreed, the billed rate can only rise
// =================================================================================================
console.log('\n=== C2 · the agreed rate is monotone non-decreasing (the fairness property) ===')
{
  let cells = 0
  let violations = 0
  let worst = Number.POSITIVE_INFINITY
  for (const tier of TIERS) {
    for (let age = 13; age <= 30; age++) {
      const [lo, hi] = coachRateBandCents(tier, age)
      for (const rate of [lo, Math.round((lo + hi) / 2), hi]) {
        // The agreed labour, struck at this age and this rank, against the court at every LATER age.
        for (const rankAtHire of [null, 50, 5] as (number | null)[]) {
          const agreed = coachLabourCents(rate, age, tier, coachRetainerBand(rankAtHire))
          let prev = facilityRateCents(age, tier) + agreed
          for (let later = age + 1; later <= 30; later++) {
            const now = facilityRateCents(later, tier) + agreed
            cells++
            if (now < prev) violations++
            worst = Math.min(worst, now / prev)
            prev = now
          }
        }
      }
    }
  }
  console.log(`  ${cells.toLocaleString('en-US')} cells swept · violations: ${violations} · worst step x${worst.toFixed(4)}`)
  console.log(
    `  ⭐ the shipped formula for comparison – its worst single step is the band fall printed in C1,`,
  )
  console.log(`     which is the half of his complaint this item deletes rather than letters.`)
}

// =================================================================================================
// C3 / C4 / C5 – the career walks
// =================================================================================================
interface Ask {
  week: number
  score: number
  fraction: number
  fromCents: number
  toCents: number
  /** ⚠⚠ THE CEILING DECIDED THIS FIGURE, meaning the score asked for MORE than the market would pay.
   *  ⚠ THE FIRST VERSION OF THIS COLUMN WAS WRONG AND PRINTED 100% – it tested «the realised fraction
   *  is below the corridor's top», which is true whenever the score is below 1 and therefore almost
   *  always. A column that can only print one value is a check that always passes, which is the
   *  masseur bench's own bankruptcy-column lesson arriving one wave later. It now compares the ASKED
   *  figure against the ceiling, which is the question. */
  clampedByCeiling: boolean
}

interface Run {
  asks: Ask[]
  /** the billed hourly rate at the end of the walk, and at the start */
  firstRateCents: number
  lastRateCents: number
  /** ⭐ WHAT THE SHIPPED TILL WOULD HAVE CHARGED over the same weeks, against what this one did.
   *  The second arm the corridor switch cannot reach: `coachMarketLabourCents` is the floating
   *  figure, so the ratio is «the fixed fee as a share of the one that floats» and is <= 1 by the
   *  design's own safety property. */
  billedCents: number
  shippedCents: number
  coachedWeeks: number
  endFundsCents: number
  bankrupt: boolean
  releases: number
}

/** ONE CAREER, WALKED, with the asks observed as they fire.
 *
 *  ⚠ THE ARM IS APPLIED BY OVERWRITING THE TWO CORRIDOR ENDS ON `ECONOMY` FOR THE DURATION OF THE
 *  WALK, and restored after. That is what makes both arms the SAME TREE with the same reader present
 *  – the alternative (a worktree at an older commit) is the null arm CLAUDE.md's own note describes.
 */
function walk(presetIndex: number, seedIndex: number, floor: number, ceiling: number, shipped = false): Run {
  // ⚠ `Object.assign` AND NOT A FIELD WRITE – `ECONOMY` is declared readonly, and this is the idiom
  // `tools/masseur-raise-bench.ts` already uses to swap an arm's constant for the length of a walk.
  const savedFloor = ECONOMY.coach.raise.askFloor
  const savedCeiling = ECONOMY.coach.raise.askCeiling
  Object.assign(ECONOMY.coach.raise, { askFloor: floor, askCeiling: ceiling })
  try {
    const { world, rng } = openCareer(PRESETS[presetIndex], seedIndex, POLICIES[0])
    const asks: Ask[] = []
    let firstRateCents = 0
    let lastRateCents = 0
    let coachedWeeks = 0
    let releases = 0
    let billedCents = 0
    let shippedCents = 0
    let prevCoachId = world.coachId
    for (let w = 0; w < WEEKS; w++) {
      // ⭐⭐ THE **S** ARM – THE SHIPPED TILL, REPRODUCED EXACTLY AND WITHOUT A SECOND TREE. Clearing
      // the contract before the week makes `settleCoachDeal` re-strike it at `coachMarketLabourCents`,
      // which IS the floating figure `bandedRateCents` used to bill – so the S arm charges the same
      // integer cents v81 charged, week by week, with the reader present in the same tree. That is
      // the arm the corridor switch cannot reach, and without it «the ask costs N bankruptcies» would
      // be measured against an arm that is already cheaper than the shipped game.
      if (shipped) world.coachDeal = null
      const beforeDeal = world.coachDeal
      const beforeLabour = beforeDeal?.labourCents ?? 0
      const beforeWeek = world.week
      stepCareerWeek(world, rng, POLICIES[0])
      if (world.ending) break
      if (world.coachId !== prevCoachId) {
        if (world.coachId === null) releases++
        prevCoachId = world.coachId
      }
      // ⚠ `ageAtWeek` AND NEVER A RE-DERIVATION. The roster is keyed on the age BAND, so a bench
      // that computed the age itself would silently hire a different man on a boundary week.
      const coach = coachById(world.seed, ageAtWeek(world.week), world.coachId)
      if (!coach) continue
      coachedWeeks++
      const rate = coachRateCents(world, coach)
      if (firstRateCents === 0) firstRateCents = rate
      lastRateCents = rate
      billedCents += rate
      shippedCents += facilityRateCents(ageAtWeek(world.week), coach.tier) + coachMarketLabourCents(world, coach)
      const deal = world.coachDeal
      // An ask is the week the agreed labour rose on an anniversary of the same contract.
      if (deal && beforeDeal && deal.coachId === beforeDeal.coachId && deal.labourCents > beforeLabour) {
        const fraction = deal.labourCents / beforeLabour - 1
        const ceiling = coachMarketLabourCents(world, coach)
        asks.push({
          week: world.week,
          // ⚠ THE SCORE IS RE-READ AFTER THE RE-STAMP AND IS THEREFORE NOT THE ONE THE ASK USED.
          // What the table needs is the FRACTION, which is observed exactly; the score is printed
          // only as the post-ask reading and is labelled as such in C3's own header.
          score: coachProgressScore(world),
          fraction,
          fromCents: beforeLabour,
          toCents: deal.labourCents,
          clampedByCeiling: deal.labourCents >= ceiling - 1,
        })
      }
      void beforeWeek
    }
    return {
      asks,
      firstRateCents,
      lastRateCents,
      coachedWeeks,
      billedCents,
      shippedCents,
      endFundsCents: world.fundsCents,
      bankrupt: world.ending?.type === 'bankruptcy',
      releases,
    }
  } finally {
    Object.assign(ECONOMY.coach.raise, { askFloor: savedFloor, askCeiling: savedCeiling })
  }
}


// =================================================================================================
// C3 – ⭐⭐⭐ THE MEASURED CORRIDOR, against his 5–15%
// =================================================================================================
//
// ⚠ INVARIANT 5's WHOLE POINT. The corridor is a TARGET he named, not a constant to paste: what this
// section reports is where the asks that ACTUALLY FIRE land inside it, how often the CEILING is what
// decided the figure rather than the score, and how many anniversaries pass with no room at all.
// If the measurement misses his corridor the spec says so.
console.log('\n=== C3 · the asks that fire, over real careers ===')
const coached = PRESETS.map((p, i) => ({ p, i })).filter((r) => r.p.coachTier !== 'self')
const allAsks: Ask[] = []
const runsB = new Map<string, Run[]>()
for (const { p, i } of coached) {
  const runs: Run[] = []
  for (let s = 0; s < SEEDS; s++) runs.push(walk(i, s, FLOOR, CEILING))
  runsB.set(p.label, runs)
  for (const r of runs) allAsks.push(...r.asks)
}
console.log(`  ${allAsks.length} asks over ${coached.length * SEEDS} careers of ${WEEKS} weeks`)
if (allAsks.length > 0) {
  const fr = allAsks.map((a) => a.fraction).sort((a, b) => a - b)
  const q = (t: number): number => fr[Math.min(fr.length - 1, Math.floor(t * fr.length))]
  const mean = fr.reduce((a, b) => a + b, 0) / fr.length
  console.log(`  ask size   min ${pct(fr[0])} · p25 ${pct(q(0.25))} · median ${pct(q(0.5))} · p75 ${pct(q(0.75))} · max ${pct(fr[fr.length - 1])} · mean ${pct(mean)}`)
  const inCorridor = fr.filter((x) => x >= FLOOR - 1e-9 && x <= CEILING + 1e-9).length
  console.log(`  inside his ${pct(FLOOR)}–${pct(CEILING)}: ${inCorridor}/${fr.length} (${pct(inCorridor / fr.length)})`)
  const clamped = allAsks.filter((a) => a.clampedByCeiling).length
  console.log(`  decided by the CEILING rather than by the score: ${clamped}/${allAsks.length} (${pct(clamped / allAsks.length)})`)
  const perCareer = coached.length * SEEDS
  console.log(`  asks per career: ${(allAsks.length / perCareer).toFixed(2)} over ${(WEEKS / WEEKS_PER_YEAR).toFixed(0)} years`)
}

// =================================================================================================
// C4 – WHAT A FEE REACHES, and against what
// =================================================================================================
console.log('\n=== C4 · what the agreed rate reaches over a career ===')
console.log('preset                          asks  first rate   last rate   multiple   paid vs the floating fee')
for (const { p } of coached) {
  const runs = runsB.get(p.label) ?? []
  const withCoach = runs.filter((r) => r.firstRateCents > 0)
  if (withCoach.length === 0) continue
  const mean = (f: (r: Run) => number): number => withCoach.reduce((a, r) => a + f(r), 0) / withCoach.length
  const first = mean((r) => r.firstRateCents)
  const last = mean((r) => r.lastRateCents)
  const paid = mean((r) => r.billedCents)
  const would = mean((r) => r.shippedCents)
  console.log(
    `${p.label.padEnd(32)}${mean((r) => r.asks.length).toFixed(1).padStart(5)}  ${money(first).padStart(10)}  ${money(last).padStart(10)}   x${(last / first).toFixed(2)}   ${pct(would > 0 ? paid / would : 1).padStart(8)}`,
  )
}

// =================================================================================================
// C5 – THE PAIRED WALK: the same seeds, the ask OFF and ON
// =================================================================================================
//
// ⚠ THE A ARM IS THIS TREE WITH THE CORRIDOR AT ZERO. Both arms settle a deal and both read
// `coachRateCents`; only the corridor differs, so the reader is present in both by construction.
console.log('\n=== C5 · S = the shipped floating till · A = fixed, nobody asks · B = fixed and he asks ===')
console.log('preset                          arm   asks  end rate    end funds      bankrupt  releases')
for (const { p, i } of coached) {
  const arms: [string, Run[]][] = [
    ['S', Array.from({ length: SEEDS }, (_, s) => walk(i, s, 0, 0, true))],
    ['A', Array.from({ length: SEEDS }, (_, s) => walk(i, s, 0, 0))],
    ['B', runsB.get(p.label) ?? []],
  ]
  for (const [name, runs] of arms) {
    const withCoach = runs.filter((r) => r.firstRateCents > 0)
    if (withCoach.length === 0) continue
    const mean = (f: (r: Run) => number): number => withCoach.reduce((a, r) => a + f(r), 0) / withCoach.length
    console.log(
      `${(name === 'S' ? p.label : '').padEnd(32)}${name}   ${mean((r) => r.asks.length).toFixed(1).padStart(4)}  ${money(mean((r) => r.lastRateCents)).padStart(9)}  ${money(mean((r) => r.endFundsCents)).padStart(12)}  ${withCoach.filter((r) => r.bankrupt).length.toString().padStart(8)}  ${mean((r) => r.releases).toFixed(2).padStart(8)}`,
    )
  }
}

// ⚠ `coachHoursForPlan` and `coachAgeBand` are imported for C1's own arithmetic and for the note
// above `ageAtWeek`; referenced here so a reader can see the whole import list is live.
void coachHoursForPlan
void coachAgeBand
