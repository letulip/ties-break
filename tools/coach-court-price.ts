/* WHAT THE COACH AND THE COURT REALLY COST, PER HOUR AND PER WEEK – the arithmetic behind
 * docs/research/real-coaching-costs.md.
 *
 * The owner priced this himself, first-hand, from the sport he actually plays (08.08):
 *
 *   «Я играю в падел, у нас есть корты за 22 доллара в час (кстати, теннисные стоят похожих денег)
 *    и за 44+ доллара в час в других местах, есть и дороже всякие элитные корты. Работа тренера на
 *    бюджетном тире в падел стоит от 10 долларов в час и дальше. Давай пожалуйста приведем стоимости
 *    тренеров и кортов к этой системе... А еще меня очень интересует реальная стоимость разных тиров
 *    тренеров за неделю при нашей загрузке в часах»
 *
 * Two questions, and this tool answers both off the SHIPPED functions rather than off a
 * re-derivation of them – `weeklyBillSplit`, `facilityRateCents`, `coachRateBandCents`,
 * `coachHoursForPlan`, `parentIncomeForWeekCents`. If a constant moves, this output moves with it,
 * which is the only way a table in a doc can be trusted a month later.
 *
 *   A. THE HOUR, DECOMPOSED. total/h = court/h + labour/h, per rung x corridor x age band. This is
 *      the frame the owner priced in, so it is the frame the comparison has to happen in. The court
 *      column is the one to read. ⚠ IT USED TO BE FLAT ACROSS RUNGS - `facilityRateCents` took no
 *      tier argument at all, so an Elite coach worked on a parent's court - and that is what this
 *      tool was written to find. Since docs/specs/court-follows-the-coach-2026-08.md it steps at
 *      `high` and `elite` and the three cheap rungs are deliberately unchanged.
 *   B. THE WEEK. The same at 4 / 5 / 6 sessions – `plan.train` 60 / 75 / 85 – because hours are what
 *      a coach charges for and the load is half the price.
 *   C. THE WEEK AS A SHARE OF THE FAMILY'S INCOME, which is the question that decides whether a
 *      number is big or WRONG. Parent income compounds 5-10% a season, so the share is printed at
 *      season 0 and at season 4 (she is 18) off `parentIncomeForWeekCents` itself.
 *
 * Run: npx vite-node tools/coach-court-price.ts
 *      npx vite-node tools/coach-court-price.ts -- --csv    # machine-readable, for a diff
 */
import { execSync } from 'node:child_process'
import { ECONOMY } from '../src/engine/economy'
import { parentIncomeForWeekCents } from '../src/engine/economy'
import {
  COACH_TIERS,
  coachRateBandCents,
  coachHoursForPlan,
  facilityRateCents,
  coachCorridorMid,
  weeklyBillSplit,
} from '../src/engine/coach'
import type { CoachTier, FamilyBackground, WeekPlan } from '../src/shared/protocol'
import { WEEK_PLAN_PRESETS } from '../src/shared/protocol'

const CSV = process.argv.includes('--csv')
const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']
const AGES: { age: number; label: string }[] = [
  { age: 14, label: '12-16' },
  { age: 18, label: '17-22' },
  { age: 24, label: '23+' },
]
const PLANS: { key: 'light' | 'balanced' | 'grind'; plan: WeekPlan }[] = [
  { key: 'light', plan: WEEK_PLAN_PRESETS.light },
  { key: 'balanced', plan: WEEK_PLAN_PRESETS.balanced },
  { key: 'grind', plan: WEEK_PLAN_PRESETS.grind },
]

/** The rung's midpoint hourly rate, MIDDLE-corridor anchored – what the constant table states. */
function midRate(tier: CoachTier, age: number): number {
  const [lo, hi] = coachRateBandCents(tier, age)
  return (lo + hi) / 2
}

const d = (cents: number): string => `$${(cents / 100).toFixed(2)}`
const d0 = (cents: number): string => `$${Math.round(cents / 100)}`
const pct = (x: number): string => `${(x * 100).toFixed(0)}%`

function head(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return '?'
  }
}

// -------------------------------------------------------------------------------------------------
if (CSV) {
  console.log('background,ageBand,tier,plan,hours,corridorMid,totalPerHour,courtPerHour,labourPerHour,weekTotal,weekCoach,weekCourt,incomeS0,shareS0,incomeS4,shareS4')
}
if (!CSV) {
  console.log(`RUN coach-court-price · ${process.cwd()} · HEAD ${head()}`)
  console.log('')
  console.log('=================================================================================')
  console.log('A. THE HOUR, DECOMPOSED — total = court + labour, at each rung MIDPOINT')
  console.log('=================================================================================')
  console.log('The court column steps at high/elite (courtTierFactor) and is flat below it, on purpose.')
}

for (const bg of BACKGROUNDS) {
  const mid = coachCorridorMid(bg)
  if (!CSV) {
    console.log('')
    console.log(`  ${bg.toUpperCase()} corridor  (x${mid.toFixed(3)} — band [${ECONOMY.wealthCorridor[bg].join(', ')}])`)
    console.log('  age band | rung   | total/h | court/h | labour/h | labour share | band lo..hi total/h')
    console.log('  ---------|--------|---------|---------|----------|--------------|--------------------')
  }
  for (const { age, label } of AGES) {
    for (const tier of COACH_TIERS) {
      const total = midRate(tier, age) * mid
      const court = facilityRateCents(age, tier) * mid
      const labour = Math.max(0, total - court)
      const [bLo, bHi] = coachRateBandCents(tier, age)
      if (!CSV) {
        console.log(
          `  ${label.padEnd(8)} | ${tier.padEnd(6)} | ${d(total).padStart(7)} | ${d(court).padStart(7)} | ` +
            `${d(labour).padStart(8)} | ${pct(total > 0 ? labour / total : 0).padStart(12)} | ` +
            `${d(bLo * mid)}..${d(bHi * mid)}`,
        )
      }
    }
  }
}

// -------------------------------------------------------------------------------------------------
if (!CSV) {
  console.log('')
  console.log('=================================================================================')
  console.log('B. THE WEEK — the same rates x hours(plan), through weeklyBillSplit itself')
  console.log('=================================================================================')
  console.log(`hours: light ${coachHoursForPlan(PLANS[0].plan)} · balanced ${coachHoursForPlan(PLANS[1].plan)} · grind ${coachHoursForPlan(PLANS[2].plan)}`)
  console.log('Quoting corridor midpoint, jitter 1 — a real week runs +/-8% of these.')
}

for (const bg of BACKGROUNDS) {
  if (!CSV) {
    console.log('')
    console.log(`  ${bg.toUpperCase()}`)
    console.log('  age band | rung   |     light (4h)      |    balanced (5h)    |     grind (6h)')
    console.log('           |        |  total  coach court |  total  coach court |  total  coach court')
    console.log('  ---------|--------|---------------------|---------------------|--------------------')
  }
  for (const { age, label } of AGES) {
    for (const tier of COACH_TIERS) {
      const cells = PLANS.map(({ plan }) =>
        weeklyBillSplit({ rateCents: midRate(tier, age), ageYears: age, tier, plan, background: bg }),
      )
      if (!CSV) {
        const render = cells
          .map((s) => `${d0(s.totalCents).padStart(6)} ${d0(s.coachCents).padStart(6)} ${d0(s.facilityCents).padStart(5)}`)
          .join(' |')
        console.log(`  ${label.padEnd(8)} | ${tier.padEnd(6)} |${render}`)
      }
    }
  }
}

// -------------------------------------------------------------------------------------------------
// C. THE SHARE OF INCOME. Income compounds per season off `seed:income:<n>`, so it is seed-dependent;
// averaged over 200 seeds here so the share is a property of the constants and not of one career.
const SEEDS = 200
const WEEKS_PER_YEAR = 52

function meanIncome(bg: FamilyBackground, season: number): number {
  let sum = 0
  for (let i = 0; i < SEEDS; i++) sum += parentIncomeForWeekCents(`price-probe-${i}`, bg, season * WEEKS_PER_YEAR)
  return sum / SEEDS
}

if (!CSV) {
  console.log('')
  console.log('=================================================================================')
  console.log('C. THE WEEKLY BILL AS A SHARE OF THE FAMILY\'S WEEKLY INCOME')
  console.log('=================================================================================')
  console.log(`Balanced plan (5 h). Income = parentIncomeForWeekCents, mean of ${SEEDS} seeds.`)
  console.log('S0 = season 0 (she is 14). S4 = season 4 (she is 18), income compounded 5-10% x4.')
  console.log('⚠ The S4 column pairs season 4 income with the 17-22 rate row, which is the pairing a')
  console.log('  real career meets. Anything over 100% is a family that cannot pay out of income at all.')
}

for (const bg of BACKGROUNDS) {
  const inc0 = meanIncome(bg, 0)
  const inc4 = meanIncome(bg, 4)
  // S10 is age 24 - the 23+ rate row's own season, so the share is read against the income a family
  // that far into a career actually has rather than against its first year's.
  const inc10 = meanIncome(bg, 10)
  if (!CSV) {
    console.log('')
    console.log(
      `  ${bg.toUpperCase()}  — income ${d0(inc0)}/wk at S0, ${d0(inc4)}/wk at S4 (+${pct(inc4 / inc0 - 1)}), ` +
        `${d0(inc10)}/wk at S10 (+${pct(inc10 / inc0 - 1)})`,
    )
    console.log('  rung   | age 14 bill  share | age 18 bill  share | age 24 bill  share')
    console.log('  -------|--------------------|--------------------|-------------------')
  }
  for (const tier of COACH_TIERS) {
    const at = (age: number) =>
      weeklyBillSplit({ rateCents: midRate(tier, age), ageYears: age, tier, plan: WEEK_PLAN_PRESETS.balanced, background: bg })
    const b0 = at(14)
    const b4 = at(18)
    const b10 = at(24)
    if (!CSV) {
      console.log(
        `  ${tier.padEnd(6)} | ${d0(b0.totalCents).padStart(11)} ${pct(b0.totalCents / inc0).padStart(6)} | ` +
          `${d0(b4.totalCents).padStart(11)} ${pct(b4.totalCents / inc4).padStart(6)} | ` +
          `${d0(b10.totalCents).padStart(11)} ${pct(b10.totalCents / inc10).padStart(6)}`,
      )
    }
  }
}

// The CSV arm: one row per cell, everything, for diffing across a re-price.
if (CSV) {
  for (const bg of BACKGROUNDS) {
    const mid = coachCorridorMid(bg)
    const inc0 = meanIncome(bg, 0)
    const inc4 = meanIncome(bg, 4)
    for (const { age, label } of AGES) {
      for (const tier of COACH_TIERS) {
        for (const { key, plan } of PLANS) {
          const s = weeklyBillSplit({ rateCents: midRate(tier, age), ageYears: age, tier, plan, background: bg })
          const total = midRate(tier, age) * mid
          const court = facilityRateCents(age, tier) * mid
          console.log(
            [
              bg, label, tier, key, coachHoursForPlan(plan), mid.toFixed(4),
              Math.round(total), Math.round(court), Math.round(Math.max(0, total - court)),
              s.totalCents, s.coachCents, s.facilityCents,
              Math.round(inc0), (s.totalCents / inc0).toFixed(4),
              Math.round(inc4), (s.totalCents / inc4).toFixed(4),
            ].join(','),
          )
        }
      }
    }
  }
}

// -------------------------------------------------------------------------------------------------
// E. THE YEAR. `coachWorksThisWeek` is true on all 52 weeks bar college and a booked vacation, so the
// annual training bill is 52 x the weekly one - which is the unit a real academy publishes a price in
// and therefore the only unit the comparison can happen in.
if (!CSV) {
  console.log('')
  console.log('=================================================================================')
  console.log('E. THE YEAR — 52 weeks, balanced plan, against real academy tuition')
  console.log('=================================================================================')
  console.log('The coach is billed on every week bar college and a booked vacation')
  console.log('(coachWorksThisWeek), so a season is 52 weekly bills and not 40.')
  for (const bg of BACKGROUNDS) {
    const inc0 = meanIncome(bg, 0)
    console.log('')
    console.log(`  ${bg.toUpperCase()}  — household income ${d0(inc0 * 52)}/yr at S0`)
    console.log('  rung   |  coach/yr  |  court/yr  |  total/yr  | share of a year\'s income')
    console.log('  -------|------------|------------|------------|-------------------------')
    for (const tier of COACH_TIERS) {
      const s = weeklyBillSplit({ rateCents: midRate(tier, 14), ageYears: 14, tier, plan: WEEK_PLAN_PRESETS.balanced, background: bg })
      console.log(
        `  ${tier.padEnd(6)} | ${d0(s.coachCents * 52).padStart(10)} | ${d0(s.facilityCents * 52).padStart(10)} | ` +
          `${d0(s.totalCents * 52).padStart(10)} | ${pct(s.totalCents / inc0).padStart(24)}`,
      )
    }
  }
}

if (!CSV) {
  console.log('')
  console.log('=================================================================================')
  console.log('D. THE COURT\'S TOTAL SPREAD — the number to compare against a real city')
  console.log('=================================================================================')
  // The cheapest court in the game is the club rung at the working corridor's floor; the dearest is
  // the elite rung at the wealthy ceiling. The second column is the one that matters, and before the
  // venue ladder it read x1.00: what ONE family, whose corridor is a fact rather than a choice, can
  // move the court by at all.
  for (const { age, label } of AGES) {
    const club = facilityRateCents(age, 'self')
    const top = facilityRateCents(age, 'elite')
    const lo = club * ECONOMY.wealthCorridor.working[0]
    const hi = top * ECONOMY.wealthCorridor.wealthy[1]
    console.log(
      `  ${label.padEnd(8)}  cheapest court ${d(lo)}/h .. dearest ${d(hi)}/h = x${(hi / lo).toFixed(2)} end to end` +
        `  ·  x${(top / club).toFixed(2)} inside one corridor`,
    )
  }
  console.log('')
  console.log('  For comparison, the owner\'s own first-hand figures: $22/h at his cheap club,')
  console.log('  $44+/h elsewhere, elite dearer still — at least x2 inside one city. And the real')
  console.log('  metros: Sydney x5.1 (one municipal operator), London x10.0, New York x16.7.')
}
