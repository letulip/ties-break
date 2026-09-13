/**
 * r41-brand-ramp – ROUND 41 #18. THE BRAND'S SUDDEN DROP, REPRODUCED AND THEN MEASURED AWAY.
 *
 * THE OWNER, 12.09: «у девочки в 16 лет в топ-100 свежекупленный бренд почему-то упал в цене на
 * вторую неделю и остался там и дальше на долго. Начал потихоньку расти только после победы на w500.
 * Надо проверить логику. И снова потом упал в цене внезапно.»
 *
 * ⚠⚠ THREE OF THE FOUR THINGS HE SAW ARE THE MODEL WORKING, and this tool prints them rather than
 * changing them: the dip after the buy (the row opens at what was PAID and a sixteen-year-old's
 * derived worth is far below it), the long flat stretch (H ≈ 266 weeks at low fame) and the rise
 * after the W500 (fame +8 flips the sign). The FOURTH – «и снова потом упал в цене внезапно» – was a
 * defect: the half-life was recomputed from TODAY's fame and applied to the WHOLE holding period, so
 * a fame that fell rewrote every week already lived.
 *
 * ⚠⚠ THE PREDICTION IS WRITTEN DOWN HERE **BEFORE** THE FIRST RUN (invariant 5):
 *
 *   Q1  the OLD arm's worst single-week move at the fame halving ......... about −29% (the recon's
 *       own worked example, reproduced to the tenth of a point)
 *   Q2  the NEW arm's worst single-week move at the same event ........... under 1% – the weekly
 *       blend is `1 − 0.5^(1/H)`, which at H = 104 is 0.665% of the gap and can be no larger
 *   Q3  his own scenario (a sixteen-year-old's fresh buy), first week .... IDENTICAL in both arms,
 *       because one incremental step IS the closed form at n = 1
 *
 * ⚠ THE TWO ARMS ARE ARITHMETIC AND NOT CAREERS, deliberately: the defect is in the formula, and a
 * corpus run would bury a formula's own behaviour under the variance of the seeds. The OLD arm is
 * the shipped closed form spelled out here (`rampedWorthCents(paid, derived, weeksHeld, H_today)` –
 * the exact call the engine made before this item); the NEW arm is the SHIPPED function, stepped one
 * week at a time from the row's own value, which is what `revalueAssets` now does. So the B arm
 * contains the change and its reader, and the A arm is the code that used to be there.
 *
 * ⚠ NO try/catch (house bench law). A share with no denominator prints `–`, never `0.0%`.
 *
 * Run:  npx vite-node tools/r41-brand-ramp.ts
 */
import { rampedWorthCents, worthRampHalfLife } from '../src/engine/world/assets'
import { ECONOMY } from '../src/engine/economy'

const R = ECONOMY.shop.worthRamp

const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const padL = (s: string | number, n: number) => String(s).padStart(n)
const padR = (s: string | number, n: number) => String(s).padEnd(n)
const movePct = (from: number, to: number) => (from === 0 ? '–' : `${(((to - from) / from) * 100).toFixed(2)}%`)

/** THE OLD ARM – the call the engine made before round 41 #18: the whole holding period, at the pace
 *  today's fame implies. */
function closedForm(paidCents: number, derivedCents: number, weeksHeld: number, fame: number): number {
  return rampedWorthCents(paidCents, derivedCents, weeksHeld, worthRampHalfLife(fame, R.medianFame))
}

/** THE NEW ARM – one week's step from the row's own value, at this week's pace. The SAME shipped
 *  function, handed (value, 1) instead of (paid, weeksHeld). */
function step(valueCents: number, derivedCents: number, fame: number): number {
  return rampedWorthCents(valueCents, derivedCents, 1, worthRampHalfLife(fame, R.medianFame))
}

// =================================================================================================
// §1 – THE RECON'S WORKED EXAMPLE: held 100 weeks, paid $250,000, derived $2,000,000, fame 25.6 -> 12.8
// =================================================================================================
function workedExample(): void {
  const PAID = 250_000_00
  const DERIVED = 2_000_000_00
  const HELD = 100
  const FAME_BEFORE = 25.6
  const FAME_AFTER = 12.8

  console.log('\n§1 – THE WORKED EXAMPLE: 100 weeks held, paid $250,000, derived $2,000,000\n')
  console.log(
    `    fame ${FAME_BEFORE} -> ${FAME_AFTER}; half-life ${worthRampHalfLife(FAME_BEFORE, R.medianFame).toFixed(1)}` +
      ` -> ${worthRampHalfLife(FAME_AFTER, R.medianFame).toFixed(1)} weeks\n`,
  )
  console.log(`  ${padR('', 34)}${padL('week 100', 16)}${padL('week 101', 16)}${padL('the move', 12)}`)

  // OLD: both weeks are recomputed from `paid` over the whole span, at that week's pace.
  const oldAt100 = closedForm(PAID, DERIVED, HELD, FAME_BEFORE)
  const oldAt101 = closedForm(PAID, DERIVED, HELD + 1, FAME_AFTER)
  console.log(
    `  ${padR('OLD – the span re-read every week', 34)}${padL(money(oldAt100), 16)}${padL(money(oldAt101), 16)}${padL(movePct(oldAt100, oldAt101), 12)}`,
  )

  // NEW: week 100 is walked, and week 101 is ONE step from it at the new pace.
  let value = PAID
  for (let w = 0; w < HELD; w++) value = step(value, DERIVED, FAME_BEFORE)
  const newAt100 = value
  const newAt101 = step(newAt100, DERIVED, FAME_AFTER)
  console.log(
    `  ${padR('NEW – one step from the row itself', 34)}${padL(money(newAt100), 16)}${padL(money(newAt101), 16)}${padL(movePct(newAt100, newAt101), 12)}`,
  )
  console.log('')
  console.log(`  ⚠ the two arms agree at week 100 to ${money(Math.abs(newAt100 - oldAt100))} – the telescoping, minus the walk's rounding`)
  console.log(`  the weekly blend at the new pace: ${((1 - Math.pow(0.5, 1 / worthRampHalfLife(FAME_AFTER, R.medianFame))) * 100).toFixed(3)}% of the gap`)
}

// =================================================================================================
// §2 – A WHOLE PATH: the same career, fame halving at week 100, week by week
// =================================================================================================
function path(): void {
  const PAID = 250_000_00
  const DERIVED = 2_000_000_00
  const WEEKS = 160
  const fameAt = (w: number) => (w < 100 ? 25.6 : 12.8)

  let value = PAID
  let worstNew = 0
  let worstNewWeek = -1
  let worstOld = 0
  let worstOldWeek = -1
  let prevOld = closedForm(PAID, DERIVED, 0, fameAt(0))
  const marks: { week: number; oldCents: number; newCents: number }[] = []
  for (let w = 1; w <= WEEKS; w++) {
    const prevNew = value
    value = step(value, DERIVED, fameAt(w))
    const moveNew = prevNew === 0 ? 0 : (value - prevNew) / prevNew
    if (Math.abs(moveNew) > Math.abs(worstNew)) {
      worstNew = moveNew
      worstNewWeek = w
    }
    const oldNow = closedForm(PAID, DERIVED, w, fameAt(w))
    const moveOld = prevOld === 0 ? 0 : (oldNow - prevOld) / prevOld
    if (Math.abs(moveOld) > Math.abs(worstOld)) {
      worstOld = moveOld
      worstOldWeek = w
    }
    prevOld = oldNow
    if (w === 1 || w === 52 || w === 99 || w === 100 || w === 101 || w === 104 || w === 160) {
      marks.push({ week: w, oldCents: oldNow, newCents: value })
    }
  }

  console.log('\n§2 – THE PATH, with fame halving at week 100\n')
  console.log(`  ${padR('week', 10)}${padL('OLD', 16)}${padL('NEW', 16)}`)
  for (const m of marks) console.log(`  ${padR(m.week, 10)}${padL(money(m.oldCents), 16)}${padL(money(m.newCents), 16)}`)
  console.log('')
  console.log(`  worst single-week move, OLD:  ${(worstOld * 100).toFixed(2)}%  (week ${worstOldWeek})`)
  console.log(`  worst single-week move, NEW:  ${(worstNew * 100).toFixed(2)}%  (week ${worstNewWeek})`)
  // ⚠⚠ THE NEW ARM'S WORST WEEK IS ITS **FIRST**, AND IT IS IN BOTH ARMS – the opening step of a row
  // bought far below what the market says the name is worth. That is the ramp doing what round 38
  // #16 built it to do, not the defect this item is about, so the comparison that matters is the one
  // at the FAME EVENT and it is printed on its own.
  const beforeEvent = marks.find((m) => m.week === 99)!
  const atEvent = marks.find((m) => m.week === 100)!
  console.log('')
  console.log(`  AT THE FAME EVENT (week 99 -> 100), which is the defect's own week:`)
  console.log(`    OLD  ${money(beforeEvent.oldCents)} -> ${money(atEvent.oldCents)}   ${movePct(beforeEvent.oldCents, atEvent.oldCents)}`)
  console.log(`    NEW  ${money(beforeEvent.newCents)} -> ${money(atEvent.newCents)}   ${movePct(beforeEvent.newCents, atEvent.newCents)}`)
}

// =================================================================================================
// §3 – HIS OWN SCENARIO: a sixteen-year-old in the top 100 buys a brand this week
// =================================================================================================
function herScenario(): void {
  const PAID = 250_000_00
  // A sixteen-year-old inside the top 100 is known, but not yet worth much as a NAME: the derived
  // figure sits below what the garage story costs, which is the whole of «упал в цене на вторую
  // неделю». The floor under it is `businessValueFloorShare` of what was paid.
  const DERIVED = Math.max(PAID * ECONOMY.shop.businessValueFloorShare, 90_000_00)
  const FAME = 18

  console.log('\n§3 – HER OWN SCENARIO: a fresh buy at sixteen, derived below the sticker\n')
  console.log(`  paid ${money(PAID)} · derived ${money(DERIVED)} · fame ${FAME} · half-life ${worthRampHalfLife(FAME, R.medianFame).toFixed(0)} weeks\n`)
  console.log(`  ${padR('week', 10)}${padL('OLD', 16)}${padL('NEW', 16)}${padL('the week`s move', 18)}`)
  let value = PAID
  for (let w = 1; w <= 8; w++) {
    const prev = value
    value = step(value, DERIVED, FAME)
    const old = closedForm(PAID, DERIVED, w, FAME)
    console.log(`  ${padR(w, 10)}${padL(money(old), 16)}${padL(money(value), 16)}${padL(movePct(prev, value), 18)}`)
  }
  console.log('')
  console.log('  ⚠ THE DIP IS DESIGN AND IT IS UNTOUCHED – the row opens at what was paid and walks')
  console.log('    down to what the world says a sixteen-year-old`s name is worth. The first week is')
  console.log('    IDENTICAL in both arms, because one step IS the closed form at n = 1.')
}

workedExample()
path()
herScenario()
