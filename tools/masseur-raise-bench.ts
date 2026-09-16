/**
 * THE MASSEUR'S ANNUAL ASK – M1…M5 (round 43 #4, docs/specs/the-masseurs-ask-2026-09.md).
 *
 * Run:  npx vite-node tools/masseur-raise-bench.ts [--seeds 12] [--weeks 728] [--raise 0.04]
 *
 * HIS RULING, 16.09: «мы начинаем работать с массажистом по нашим текущим ценам, а дальше он
 * приходит и просит прибавку, либо (так как альтернативы нет) добавить денег, но убавить количество
 * процедур… может просить надбавок за свои часы ежегодно, может быть не так интенсивно как тренер».
 *
 * WHAT THIS ANSWERS, and the last one is the one the round says must be answered above all:
 *   M1  the drift table – what a session, a week and a year cost by years served.
 *   M2  ⭐ THE INTENSITY, measured against the COACH and never against a market. Round 43 #6 was
 *       WITHDRAWN precisely because an outside benchmark was the wrong question: today's price is
 *       the anchor and this is the drift away from it. The coach's own annual ask is 5–15%.
 *   M3  ⭐⭐ THE BOTTOM RUNG'S REACH – «the drift must never push the ENTRY rung out of a modest
 *       family's reach, or the poor lose the seat to arithmetic rather than to a decision».
 *   M4  the rung erosion at a CONSTANT spend – his «это может нам скомпенсировать все ранги».
 *   M5  the paired career walk: the same seeds with the ask OFF and ON, entry rung, modest presets.
 *
 * ⚠⚠ THE A ARM IS THIS TREE WITH THE CONSTANT AT ZERO, NOT AN OLDER TREE. `masseurSessionCents` is
 * present and read in BOTH arms – only `ECONOMY.masseur.raisePerYear` differs – which is CLAUDE.md's
 * «prove the arm contains both the change and its reader» satisfied by construction rather than by
 * a worktree. ⚠ And the cheap sanity check it also names is a flag: `--raise 0.40` is an absurd
 * value, and M5's columns must move a long way under it. If they do not, the arm is wrong before the
 * hypothesis is.
 *
 * ⚠ ZERO DRAWS ADDED. The drift is deterministic arithmetic over the employment history the ledger
 * already keeps, so nothing here or in the engine it drives touches MAIN.
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import {
  hireMasseur,
  masseurSessionCents,
  masseurUnlocked,
  masseurWeeksServed,
  setMasseurSessions,
  inCollege,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY, parentIncomeForWeekCents } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { FamilyBackground } from '../src/shared/protocol'

const argOf = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(`--${name}`)
  const n = Number(process.argv[at + 1])
  return at > 0 && Number.isFinite(n) ? n : fallback
}
const SEEDS = argOf('seeds', 12)
/** ⚠ 728 AND NOT THE MASSEUR BENCH'S 416. Ages 14 to 28: the professional gate opens around 17–18,
 *  so 416 weeks leaves barely one anniversary inside the walk and the two arms would differ by a
 *  rounding. This bench is about what a DECADE of service does to a modest household. */
const WEEKS = argOf('weeks', 728)
/** ⚠ THE ARM SWITCH, and the header line below prints the EFFECTIVE value so a run can never be
 *  mislabelled – the masseur bench's own `--relief` idiom, and the zsh word-split incident's rule. */
const RAISE = argOf('raise', ECONOMY.masseur.raisePerYear)

/** The coach's own annual ask (round 42 #51 – specified, not yet built). The whole of «не так
 *  интенсивно как тренер» is that this seat sits under the FLOOR of that corridor. */
const COACH_CORRIDOR: readonly [number, number] = [0.05, 0.15]
/** ...and the family's own income ladder, which is the other number the drift has to lose to. His
 *  round-12 ruling: «с каждым новым годом вклад родителей приростал процентов на 5-10 рандомно». */
const INCOME_BAND = ECONOMY.incomeGrowthBand

const HIRE_FLOOR_CENTS = 25_000_00
const RELEASE_FLOOR_CENTS = 10_000_00

const money = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const pct = (x: number): string => `${(100 * x).toFixed(1)}%`
const pad = (s: string, n: number): string => s.padEnd(n)
const padL = (s: string, n: number): string => s.padStart(n)

/** The rate after `years` on the payroll – the ENGINE'S OWN arithmetic, re-asked here through a
 *  world rather than re-typed. ⚠ A re-typed formula is a bench measuring its own copy, which is the
 *  one way this table can be confidently wrong. */
function rateAfter(years: number): number {
  const world = {
    week: years * WEEKS_PER_YEAR,
    masseurHired: true,
    events: [{ id: 1, week: 0, type: 'info', text: 'hired', keep: true, milestoneKey: 'masseur-since-0' }],
  } as unknown as WorldState
  return masseurSessionCents(world)
}

const YEARS = [0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20]

function m1(): void {
  console.log('\n=== M1 · THE DRIFT TABLE – what his hours cost by years served ===')
  console.log(`   ${pad('years', 7)}${padL('session', 10)}${padL('2/wk', 10)}${padL('4/wk', 10)}${padL('7/wk', 10)}${padL('2/wk a year', 14)}${padL('7/wk a year', 14)}`)
  for (const y of YEARS) {
    const rate = rateAfter(y)
    const cells = ECONOMY.masseur.rungs.map((r) => money(r.sessions * rate))
    const entryYear = money(ECONOMY.masseur.rungs[0].sessions * rate * WEEKS_PER_YEAR)
    const topYear = money(ECONOMY.masseur.rungs[2].sessions * rate * WEEKS_PER_YEAR)
    console.log(
      `   ${pad(String(y), 7)}${padL(money(rate), 10)}${padL(cells[0], 10)}${padL(cells[1], 10)}${padL(cells[2], 10)}` +
        `${padL(entryYear, 14)}${padL(topYear, 14)}`,
    )
  }
}

function m2(): void {
  console.log('\n=== M2 · THE INTENSITY – measured against the COACH, never against a market ===')
  console.log(`   the ask ${pct(RAISE)}/yr · the coach's corridor ${pct(COACH_CORRIDOR[0])}–${pct(COACH_CORRIDOR[1])}/yr (round 42 #51)`)
  console.log(`   the family's own income ladder ${pct(INCOME_BAND[0])}–${pct(INCOME_BAND[1])}/season (his round-12 ruling)\n`)
  console.log(`   ${pad('years', 7)}${padL('masseur ×', 12)}${padL('coach 5% ×', 12)}${padL('coach 15% ×', 13)}${padL('income 5% ×', 13)}`)
  for (const y of YEARS) {
    console.log(
      `   ${pad(String(y), 7)}${padL(((1 + RAISE) ** y).toFixed(2), 12)}` +
        `${padL(((1 + COACH_CORRIDOR[0]) ** y).toFixed(2), 12)}${padL(((1 + COACH_CORRIDOR[1]) ** y).toFixed(2), 13)}` +
        `${padL(((1 + INCOME_BAND[0]) ** y).toFixed(2), 13)}`,
    )
  }
  const under = RAISE < COACH_CORRIDOR[0]
  console.log(
    `\n   ⭐ ${under ? '✅' : '❌'} the ask is ${under ? 'UNDER' : 'NOT under'} the coach's corridor floor` +
      ` – «не так интенсивно как тренер»`,
  )
  const loses = RAISE < INCOME_BAND[0]
  console.log(
    `   ⭐ ${loses ? '✅' : '❌'} and it ${loses ? 'LOSES' : 'does NOT lose'} to the SLOWEST family income growth,` +
      ` which is what M3 turns into the reachability answer`,
  )
}

/** ⭐⭐ THE ONE THE ROUND SAYS MUST BE CHECKED ABOVE ALL. The entry rung's weekly bill as a share of
 *  what the parents bring in that week, over the career, per background – averaged over seeds
 *  because the income ladder is a per-season DRAW (`seed:income:<season>`) and not a constant. */
function m3(): void {
  console.log('\n=== M3 · ⭐⭐ THE BOTTOM RUNG`S REACH – the entry rung as a share of the household`s week ===')
  console.log('   «the drift must never push the ENTRY rung out of a modest family`s reach»\n')
  const backgrounds: FamilyBackground[] = ['working', 'middle', 'wealthy']
  const entry = ECONOMY.masseur.rungs[0].sessions
  console.log(`   ${pad('years', 7)}${padL('2/wk bill', 12)}${backgrounds.map((b) => padL(b, 14)).join('')}`)
  const first: Record<string, number> = {}
  const last: Record<string, number> = {}
  for (const y of YEARS) {
    const bill = entry * rateAfter(y)
    const cells: string[] = []
    for (const background of backgrounds) {
      let sum = 0
      for (let s = 0; s < SEEDS; s++) {
        sum += bill / parentIncomeForWeekCents(`reach-${s}`, background, y * WEEKS_PER_YEAR)
      }
      const share = sum / SEEDS
      if (first[background] === undefined) first[background] = share
      last[background] = share
      cells.push(padL(pct(share), 14))
    }
    console.log(`   ${pad(String(y), 7)}${padL(money(bill), 12)}${cells.join('')}`)
  }
  console.log('')
  let ok = true
  for (const background of backgrounds) {
    const rose = last[background] > first[background]
    if (rose) ok = false
    console.log(
      `   ${rose ? '❌' : '✅'} ${pad(background, 9)} the entry rung costs ${pct(first[background])} of the week at hire` +
        ` and ${pct(last[background])} after ${YEARS[YEARS.length - 1]} years`,
    )
  }
  console.log(
    `   ⭐ ${ok ? 'PASS' : 'FAIL'} – the bottom rung gets ${ok ? 'CHEAPER' : 'DEARER'} against the household, every year,` +
      ` because ${pct(RAISE)} loses to ${pct(INCOME_BAND[0])}–${pct(INCOME_BAND[1])}`,
  )
}

/** ⭐⭐ HIS TWO BRANCHES, PRICED SIDE BY SIDE – «либо добавить денег, либо убавить количество
 *  процедур». Each year the family holding a rung is asked one question, and this is what the two
 *  answers cost.
 *
 *  ⚠⚠ AND THE FINDING THIS TABLE EXISTS TO CORRECT. The round-43 ledger illustrates the mechanic as
 *  «seven sessions a week bought at 22 are four by 26 on the same money», which is a 15%/yr drift –
 *  the COACH'S CEILING, not a gentler seat – and it is also the wrong SHAPE: the dial sells 2 / 4 / 7
 *  and nothing between, so a constant spend stops covering its rung on the very FIRST ask and the
 *  erosion is never gradual. What the drift really does is make «pay it» cost a few dollars and
 *  «drop a rung» save a great many, which is his two branches exactly. The honest form of the
 *  ledger's sentence is the ⭐ line below: the year at which the rung BELOW costs what this one cost
 *  at hire. */
function m4(): void {
  console.log('\n=== M4 · HIS TWO BRANCHES, PRICED – keep the rung, or drop one ===')
  const rungs = ECONOMY.masseur.rungs
  console.log(
    `   ${pad('rung', 10)}${pad('at hire', 10)}${padL('+1y', 9)}${padL('+4y', 9)}${padL('+8y', 9)}` +
      `${padL('+12y', 9)}${padL('dropping saves', 20)}`,
  )
  for (const [i, r] of rungs.entries()) {
    const below = i === 0 ? null : rungs[i - 1]
    const keep = (y: number): string => padL(money(r.sessions * rateAfter(y)), 9)
    const saves = below === null ? '– the floor' : `${pct(1 - below.sessions / r.sessions)} of the bill`
    console.log(
      `   ${pad(`${r.sessions}/wk`, 10)}${pad(money(r.sessions * ECONOMY.masseur.perSessionCents), 10)}` +
        `${keep(1)}${keep(4)}${keep(8)}${keep(12)}${padL(saves, 20)}`,
    )
  }
  console.log('')
  for (const [i, r] of rungs.entries()) {
    if (i === 0) continue
    const below = rungs[i - 1]
    const target = (r.sessions * ECONOMY.masseur.perSessionCents) / below.sessions
    let year: number | null = null
    for (let y = 0; y <= 40 && year === null; y++) if (rateAfter(y) >= target) year = y
    console.log(
      `   ⭐ ${below.sessions}/wk costs what ${r.sessions}/wk cost at hire after ` +
        `${year === null ? 'more than 40' : year} years`,
    )
  }
  const top = rungs[rungs.length - 1]
  console.log(
    `   ⚠ and the FIRST ask already breaks a constant spend: ${money(top.sessions * ECONOMY.masseur.perSessionCents)}` +
      ` covers ${top.sessions}/wk at hire, ${money(top.sessions * rateAfter(1))} is asked a year later, and the dial has` +
      ` no rung between ${rungs[1].sessions} and ${top.sessions} – the choice is annual and binary, never gradual`,
  )
}

// =================================================================================================
// M5 – THE PAIRED CAREER WALK
// =================================================================================================

interface Run {
  hiredWeeks: number
  releases: number
  salaryCents: number
  tourBillCents: number
  endFundsCents: number
  endWeek: number
  ended: string
  weeksServed: number
  endRateCents: number
}

/** The reasonable parent's staffing rule, the masseur bench's own: hire at the gate when the money
 *  is there, let go before the money is gone, hire again when it comes back. ⚠ THE ENTRY RUNG
 *  THROUGHOUT – this walk is about the poorest seat, which is the one the round asks about. */
function walk(presetIndex: number, seedIndex: number): Run {
  const { world, rng } = openCareer(PRESETS[presetIndex], seedIndex, POLICIES[1])
  let unlocked = false
  let hiredWeeks = 0
  let releases = 0
  let salaryCents = 0
  let tourBillCents = 0
  for (let w = 0; w < WEEKS; w++) {
    if (!unlocked && masseurUnlocked(world)) unlocked = true
    if (unlocked && !world.ending && !inCollege(world)) {
      if (!world.masseurHired && world.fundsCents > HIRE_FLOOR_CENTS) {
        hireMasseur(world, true)
        setMasseurSessions(world, ECONOMY.masseur.rungs[0].sessions)
      } else if (world.masseurHired && world.fundsCents < RELEASE_FLOOR_CENTS) {
        hireMasseur(world, false)
        releases++
      }
    }
    if (world.masseurHired) hiredWeeks++
    stepCareerWeek(world, rng, POLICIES[1])
    for (const e of world.events) {
      if (e.week !== world.week) continue
      if (e.text === 'Masseur – weekly salary') salaryCents += -(e.amountCents ?? 0)
      if (e.text.startsWith('Masseur on tour')) tourBillCents += -(e.amountCents ?? 0)
    }
    if (world.ending) break
  }
  return {
    hiredWeeks,
    releases,
    salaryCents,
    tourBillCents,
    endFundsCents: world.fundsCents,
    endWeek: world.week,
    ended: world.ending?.kind ?? '–',
    weeksServed: masseurWeeksServed(world),
    endRateCents: masseurSessionCents(world),
  }
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length
}

function m5(): void {
  console.log('\n=== M5 · THE PAIRED CAREER WALK – the entry rung, the modest presets, same seeds ===')
  console.log(`   ${SEEDS} seeds × ${WEEKS} weeks · A = the ask OFF (raisePerYear 0) · B = ON (${pct(RAISE)})\n`)
  console.log(
    `   ${pad('preset', 30)}${pad('arm', 5)}${padL('wks hired', 11)}${padL('wks served', 12)}${padL('releases', 10)}` +
      `${padL('salary paid', 13)}${padL('end funds', 12)}${padL('end rate', 10)}${padL('bankrupt', 10)}`,
  )
  // 8k · working · middle coach, and 25k · middle · middle coach – the masseur bench's own pair,
  // and the poorest two households that reach the professional gate at all.
  for (const presetIndex of [2, 5]) {
    const arms: Record<string, Run[]> = { A: [], B: [] }
    for (const [arm, raise] of [
      ['A', 0],
      ['B', RAISE],
    ] as const) {
      Object.assign(ECONOMY.masseur, { raisePerYear: raise })
      for (let s = 0; s < SEEDS; s++) arms[arm].push(walk(presetIndex, s))
    }
    Object.assign(ECONOMY.masseur, { raisePerYear: RAISE })
    for (const arm of ['A', 'B'] as const) {
      const rs = arms[arm]
      console.log(
        `   ${pad(arm === 'A' ? PRESETS[presetIndex].label : '', 30)}${pad(arm, 5)}` +
          `${padL(mean(rs.map((r) => r.hiredWeeks)).toFixed(0), 11)}` +
          `${padL(mean(rs.map((r) => r.weeksServed)).toFixed(0), 12)}` +
          `${padL(mean(rs.map((r) => r.releases)).toFixed(2), 10)}` +
          `${padL(money(mean(rs.map((r) => r.salaryCents))), 13)}` +
          `${padL(money(mean(rs.map((r) => r.endFundsCents))), 12)}` +
          `${padL(money(mean(rs.map((r) => r.endRateCents))), 10)}` +
          `${padL(String(rs.filter((r) => r.ended === 'bankrupt').length), 10)}`,
      )
    }
    const a = arms.A
    const b = arms.B
    const lostWeeks = mean(a.map((r) => r.hiredWeeks)) - mean(b.map((r) => r.hiredWeeks))
    const extraReleases = mean(b.map((r) => r.releases)) - mean(a.map((r) => r.releases))
    console.log(
      `   ⭐ the ask costs this household ${lostWeeks.toFixed(1)} weeks of his employment and ` +
        `${extraReleases.toFixed(2)} extra release(s) per career; bankruptcies ` +
        `${a.filter((r) => r.ended === 'bankrupt').length} → ${b.filter((r) => r.ended === 'bankrupt').length}\n`,
    )
  }
}

function main(): void {
  console.log('THE MASSEUR`S ANNUAL ASK – round 43 #4')
  console.log(
    `raisePerYear ${pct(RAISE)} (shipped ${pct(ECONOMY.masseur.raisePerYear)}) · opening session ` +
      `${money(ECONOMY.masseur.perSessionCents)} · rungs ${ECONOMY.masseur.rungs.map((r) => r.sessions).join('/')}`,
  )
  Object.assign(ECONOMY.masseur, { raisePerYear: RAISE })
  m1()
  m2()
  m3()
  m4()
  m5()
}

main()
