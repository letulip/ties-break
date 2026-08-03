// THE SUMMER BENCH (W3-SUMMER) - `npx vite-node tools/summer-bench.ts`. Same shape as the knock /
// econ / kit benches: a measurement harness, run by hand, never part of a gate.
//
// THREE QUESTIONS, and the design is only defensible if all three answer with numbers:
//
//   1. WHAT IS THE BLOCK WORTH? The owner's claim is that a real summer load «частично компенсирует
//      недостаток тренерских недель в другие периоды». "Partially" is the word that has to be true:
//      if the block is worth more than a coach rung it has quietly become the dominant lever, and if
//      it is worth nothing it is decoration.
//   2. WHAT DOES IT COST? «реальная нагрузка» means the week is FULLER, not free, so she has to be
//      measurably more tired in September than she would have been.
//   3. WHAT DOES A SUMMER HOLIDAY COST HER? The block must never be mandatory - a family week in July
//      is a TRADE, and the size of that trade is the thing a player is entitled to know.
//
// METHOD. The same career, seed for seed, run twice: once with the block and once with
// `ECONOMY.summerBlock` zeroed out. Zeroing rather than deleting keeps every other code path
// identical, and the block spends no RNG on any stream, so the two runs walk byte-identical
// sequences and the difference is the block and nothing else.
import { createWorld, tickWeek, bookVacation, enterEvent, closeTournament, summerBlockWeek } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { SKILL_KEYS } from '../src/engine/development'
import { SUMMER_WEEKS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { rngFromSeed } from '../src/engine/rng'
import { WEEK_PLAN_PRESETS } from '../src/shared/protocol'

const CAREERS = 24
const SEASONS = 4 // 14 -> 18, the horizon every other bench in this repo reports on
const HORIZON = WEEKS_PER_YEAR * SEASONS

const SHIPPED = { ...ECONOMY.summerBlock }
const OFF = { loadFactor: 1, conditionCost: 0 }

interface Run {
  meanSkill: number
  /** her condition the week the holidays end, averaged over careers - the September reading */
  septemberCondition: number
  meanCondition: number
  blockWeeks: number
  injuries: number
}

function career(
  seed: string,
  plan: 'light' | 'balanced' | 'grind',
  vacationWeeks: number[],
  racing: boolean,
): Run {
  const w = createWorld(seed)
  w.plan = { ...WEEK_PLAN_PRESETS[plan] }
  for (const week of vacationWeeks) bookVacation(w, week, 'staycation')
  const rng = rngFromSeed(w.seed)
  let blockWeeks = 0
  let injuries = 0
  let conditionSum = 0
  let september = 0
  for (let i = 0; i < HORIZON; i++) {
    // ⚠ THE RACING ARM EXISTS BECAUSE THE FIRST DRAFT MEASURED NOTHING. A career that only ticks never
    // plays a match, so `matchDrain` never fires, `recoveryBase` (8/wk) outruns everything and her
    // condition is pinned at the ceiling of 100 all year - which meant the block's -3 was clamped away
    // and the fatigue column read 0.0 at every plan. That is a TRUE fact about a girl who never
    // competes, and a useless one: the cost of a fuller summer is only visible on a body that is
    // already carrying a season. So this arm enters everything it is allowed to.
    if (racing) {
      for (const e of w.season) {
        if (e.week <= w.week || w.entries.includes(e.id)) continue
        try {
          enterEvent(w, e.id)
        } catch {
          /* not eligible / capped / blacked out - the gate's answer is the point */
        }
      }
    }
    // ⚠ ASKED BEFORE THE TICK, because `tickWeek` increments `world.week` first: the predicate has to
    // be read against the week the tick is about to resolve, which is `week + 1`.
    const probe = { ...w, week: w.week + 1 }
    if (summerBlockWeek(probe as typeof w)) blockWeeks++
    tickWeek(w, rng)
    if (w.pendingTournament) closeTournament(w)
    conditionSum += w.condition
    if (w.injury && w.injury.sinceWeek === w.week) injuries++
    if (w.week % WEEKS_PER_YEAR === SUMMER_WEEKS[1] + 1) september += w.condition
  }
  return {
    meanSkill: SKILL_KEYS.reduce((s, k) => s + w.skills[k], 0) / SKILL_KEYS.length,
    septemberCondition: september / SEASONS,
    meanCondition: conditionSum / HORIZON,
    blockWeeks,
    injuries,
  }
}

function sweep(plan: 'light' | 'balanced' | 'grind', vacationWeeks: number[], racing = false): Run {
  const acc: Run = { meanSkill: 0, septemberCondition: 0, meanCondition: 0, blockWeeks: 0, injuries: 0 }
  for (let s = 0; s < CAREERS; s++) {
    const r = career(`summer-${s}`, plan, vacationWeeks, racing)
    acc.meanSkill += r.meanSkill
    acc.septemberCondition += r.septemberCondition
    acc.meanCondition += r.meanCondition
    acc.blockWeeks += r.blockWeeks
    acc.injuries += r.injuries
  }
  return {
    meanSkill: acc.meanSkill / CAREERS,
    septemberCondition: acc.septemberCondition / CAREERS,
    meanCondition: acc.meanCondition / CAREERS,
    blockWeeks: acc.blockWeeks / CAREERS,
    injuries: acc.injuries / CAREERS,
  }
}

function withBlock<T>(on: boolean, fn: () => T): T {
  Object.assign(ECONOMY.summerBlock, on ? SHIPPED : OFF)
  try {
    return fn()
  } finally {
    Object.assign(ECONOMY.summerBlock, SHIPPED)
  }
}

console.log('='.repeat(96))
console.log('SUMMER BENCH - is the holiday block worth something, does it cost something, is it optional?')
console.log(`  ${CAREERS} careers x ${SEASONS} seasons  ·  window = season-weeks ${SUMMER_WEEKS[0]}-${SUMMER_WEEKS[1]}`)
console.log(`  knobs: loadFactor ${SHIPPED.loadFactor}  conditionCost ${SHIPPED.conditionCost}`)
console.log('='.repeat(96))

for (const racing of [false, true] as const) {
  console.log(
    `\n§1${racing ? 'b' : 'a'}  WITH THE BLOCK vs WITHOUT IT - same careers, seed for seed` +
      (racing ? ' (RACING: she enters everything the gate allows)' : ' (training only, never competes)'),
  )
  console.log('   plan       block wks/season   mean skill @18    delta      Sept condition   delta    injuries/career')
  for (const plan of ['light', 'balanced', 'grind'] as const) {
    const on = withBlock(true, () => sweep(plan, [], racing))
    const off = withBlock(false, () => sweep(plan, [], racing))
    console.log(
      `   ${plan.padEnd(9)}  ${(on.blockWeeks / SEASONS).toFixed(1).padStart(8)}` +
        `          ${on.meanSkill.toFixed(2)}       ${(on.meanSkill - off.meanSkill >= 0 ? '+' : '')}${(on.meanSkill - off.meanSkill).toFixed(2)}` +
        `        ${on.septemberCondition.toFixed(1).padStart(5)}          ${(on.septemberCondition - off.septemberCondition).toFixed(1).padStart(5)}` +
        `      ${on.injuries.toFixed(2)} vs ${off.injuries.toFixed(2)}`,
    )
  }
}

// -------------------------------------------------------------------------------------------------
// §1c THE FATIGUE, ISOLATED FROM THE CLAMP - and the clamp is itself the finding above.
//
// ⚠ THE COLUMNS ABOVE READ 0.0 AND THEY ARE NOT BROKEN. `recoveryBase` is 8 a week and a junior
// career at this level rarely takes enough match drain to spend it, so her condition sits on the
// ceiling of 100 all year and the block's -3 is clamped away before it can be seen. That is TRUE of
// the careers this bench runs, and it is the honest headline: on a girl who is not already tired, a
// fuller summer costs her nothing she notices.
//
// What it costs a girl who IS tired is the number the design has to defend, so this arm plants her at
// a realistic mid-season deficit on the first day of the holidays and reads her back on the first day
// of September.
// -------------------------------------------------------------------------------------------------
console.log('\n§1c  THE FATIGUE, from a body that is actually carrying a season (condition set at the window’s open)')
console.log('   start   Sept with block   without   cost')
for (const start of [20, 40, 60, 80]) {
  const run = (on: boolean) => {
    const shipped = { ...ECONOMY.summerBlock }
    Object.assign(ECONOMY.summerBlock, on ? SHIPPED : OFF)
    try {
      let total = 0
      for (let s = 0; s < CAREERS; s++) {
        const w = createWorld(`summer-fatigue-${s}`)
        const rng = rngFromSeed(w.seed)
        while (w.week < SUMMER_WEEKS[0] - 1) tickWeek(w, rng)
        w.condition = start
        while (w.week <= SUMMER_WEEKS[1]) tickWeek(w, rng)
        total += w.condition
      }
      return total / CAREERS
    } finally {
      Object.assign(ECONOMY.summerBlock, shipped)
    }
  }
  const on = run(true)
  const off = run(false)
  console.log(
    `   ${String(start).padStart(3)}     ${on.toFixed(1).padStart(6)}          ${off.toFixed(1).padStart(6)}   ${(on - off).toFixed(1).padStart(6)}`,
  )
}

console.log('\n§2  ...AND THE TRADE: a family week booked INSIDE the window loses the block for that week')
// Four holidays, one per season, planted in the middle of the summer window.
const holidays = [0, 1, 2, 3].map((s) => s * WEEKS_PER_YEAR + SUMMER_WEEKS[0] + 4)
for (const racing of [false, true] as const) {
  const plan = 'balanced' as const
  const straight = withBlock(true, () => sweep(plan, [], racing))
  const holiday = withBlock(true, () => sweep(plan, holidays, racing))
  console.log(`   plan ${plan}${racing ? ', RACING' : ', training only'} - one family week per season inside the holidays:`)
  console.log(
    `     block weeks/season ${(straight.blockWeeks / SEASONS).toFixed(1)} -> ${(holiday.blockWeeks / SEASONS).toFixed(1)}` +
      `   ·   mean skill @18 ${straight.meanSkill.toFixed(2)} -> ${holiday.meanSkill.toFixed(2)}` +
      ` (${(holiday.meanSkill - straight.meanSkill).toFixed(2)})`,
  )
  console.log(
    `     mean condition ${straight.meanCondition.toFixed(1)} -> ${holiday.meanCondition.toFixed(1)}` +
      `   ·   injuries/career ${straight.injuries.toFixed(2)} -> ${holiday.injuries.toFixed(2)}`,
  )
}
console.log('   (the family week pays its own package rest instead - the trade, not a punishment; and a')
console.log('    RACING career loses almost nothing, because most of her summer was a tournament anyway)')

console.log('\n§3  THE YARDSTICK. The block must stay a HELP, never the dominant lever:')
console.log('     one year of junior development (SKILL_POINTS_PER_YEAR) = 2.4 skill points')
console.log('     the whole coach ladder, self -> elite (kit-bench §3)   = 2.26 skill points')
