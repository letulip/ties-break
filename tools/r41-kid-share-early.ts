/**
 * r41-kid-share-early – ROUND 41 #27, ASK A1. WHAT STARTING HER SHARE AT HER FIRST W CHEQUE DOES.
 *
 * THE OWNER: «может быть начать отчисления не в 18, а в 16 лет уже или вообще с момента, когда она в
 * первый раз на w серию приходит? это же всё таки ее призовые» – and the ruling, option A1: «призовые
 * падают на её счёт с первого старта W-серии независимо от возраста – согласен».
 *
 * ⚠⚠ THE PREDICTION IS WRITTEN DOWN HERE **BEFORE** THE FIRST RUN (invariant 5). Round 23's own bench
 * measured the 18-gate at **−36% family mean at 28**, which is the yardstick these numbers are small
 * against:
 *
 *   P1  careers holding a non-zero account at 18 ....................... over 60%
 *   P2  her account at 18, mean ........................................ $2,000 – $20,000
 *   P3  the family's funds at 18, mean delta ........................... under −$5,000
 *   P4  the family's PRIZE total at 26, delta as a share of it ......... under −3%
 *
 * ⚠ THE REASONING BEHIND P4, so a wrong prediction is informative: the junior window is two seasons
 * of a fourteen-season career, and they are the two cheapest – a W15 first-round exit pays $130 and
 * a W15 title $2,200 against a Slam's $3,000,000. Ten percent of the smallest years is a rounding
 * error against a career, which is the whole reason this ruling costs the parent almost nothing and
 * means a great deal to the girl.
 *
 * ⚠⚠ HOW THE OFF ARM IS BUILT, AND WHY IT IS NOT A CONSTANT FLIP. Round 23's own bench could set
 * `ECONOMY.kidShare` to zero because the question was «does the ramp exist»; this item changed a
 * BRANCH (`ageYears < fromAgeYears` returns `startBps` instead of 0) and no setting of the four
 * constants reproduces the old rule without also moving the ladder above eighteen. So the OFF arm
 * REVERSES THE TRANSFER AT ITS SITE: after each ticked week, any cents that reached her account
 * before her eighteenth are moved back to the family. That is the old money to the cent – the old
 * rule transferred nothing – through the shipped engine, with no second implementation of anything.
 *
 * ⚠ WHAT THE REVERSAL IS NOT: it is not the old LEDGER. The OFF arm's feed still carries a row
 * saying «less her 10% share», because the row was written inside the tick. Every FIGURE this bench
 * reports – both balances, the prize totals, the career's own decisions – is the old arm's, and no
 * figure is read off a row. ⚠ And it is one decision late by construction: the wallet is restored
 * after the tick that spent it, so an entry decision taken in the same tick as a cheque saw the new
 * wallet. Named rather than hidden; at these sums it moves nothing, and the arms' comparability is
 * asserted rather than assumed.
 *
 * ⚠ ACTUATION IS PROVEN PER ARM: the OFF arm's junior balance must be exactly zero on every career
 * and the ON arm's must not be, which is the same discriminator `tests/round23-kid-share.test.ts`
 * uses. If both arms read zero the corpus never earned a junior cheque and the run says so instead
 * of printing a null.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law). A share with no denominator
 * prints `–`, never `0.0%`.
 *
 * Run:  npx vite-node tools/r41-kid-share-early.ts
 *       npx vite-node tools/r41-kid-share-early.ts -- --seeds 24 --long 12
 */
import { kidAgeYears, type WorldState } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { openCareer, stepCareerWeek, PRESETS, POLICIES, mean, median } from './econ-bench'

const args = process.argv.slice(2)
let seedsPerPreset = 24
let longSeedsPerPreset = 8
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--seeds' && args[i + 1]) seedsPerPreset = Number(args[++i])
  if (args[i] === '--long' && args[i + 1]) longSeedsPerPreset = Number(args[++i])
}

/** Careers open at fourteen (`econ-bench`'s START_AGE_YEARS). */
const START_AGE = 14
const AGE_18_WEEKS = (18 - START_AGE) * WEEKS_PER_YEAR
/** Round 23's own horizon for the family figure it measured at −36%. */
const AGE_26_WEEKS = (26 - START_AGE) * WEEKS_PER_YEAR

const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const padL = (s: string | number, n: number) => String(s).padStart(n)
const padR = (s: string | number, n: number) => String(s).padEnd(n)
const pct = (num: number, den: number) => (den === 0 ? '–' : `${((num / den) * 100).toFixed(1)}%`)
const signedPct = (delta: number, base: number) => (base === 0 ? '–' : `${((delta / base) * 100).toFixed(2)}%`)

const ageOf = (w: WorldState): number => kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay)

interface CareerRead {
  /** cents that reached her account before her eighteenth */
  juniorCents: number
  /** her account at the horizon */
  kidFundsCents: number
  /** the family's wallet at the horizon */
  fundsCents: number
  /** the family's banked prize total at the horizon (already net of her share) */
  familyPrizeCents: number
  /** the first age at which a cheque reached her, or -1 */
  firstPaidAge: number
  /** tournaments played – the comparability guard */
  results: number
}

function runCareer(presetIndex: number, seedIndex: number, weeks: number, revertJunior: boolean): CareerRead {
  const { world, rng } = openCareer(PRESETS[presetIndex], seedIndex, POLICIES[0])
  let juniorCents = 0
  let firstPaidAge = -1
  for (let w = 0; w < weeks; w++) {
    const before = world.kidFundsCents ?? 0
    stepCareerWeek(world, rng, POLICIES[0])
    if (world.ending) break
    const moved = (world.kidFundsCents ?? 0) - before
    if (moved > 0 && ageOf(world) < ECONOMY.kidShare.fromAgeYears) {
      juniorCents += moved
      if (firstPaidAge < 0) firstPaidAge = ageOf(world)
      // THE OFF ARM: the junior cents go back where the shipped rule left them – with the family.
      if (revertJunior) {
        world.kidFundsCents = (world.kidFundsCents ?? 0) - moved
        world.fundsCents += moved
      }
    }
  }
  return {
    juniorCents: revertJunior ? 0 : juniorCents,
    kidFundsCents: world.kidFundsCents ?? 0,
    fundsCents: world.fundsCents,
    familyPrizeCents: world.careerTotals?.prizeCents ?? 0,
    firstPaidAge,
    results: world.results.length,
  }
}

function runArm(weeks: number, seeds: number, revertJunior: boolean): CareerRead[] {
  const out: CareerRead[] = []
  for (let p = 0; p < PRESETS.length; p++) {
    for (let s = 0; s < seeds; s++) out.push(runCareer(p, s, weeks, revertJunior))
  }
  return out
}

function report(title: string, on: CareerRead[], off: CareerRead[]): void {
  const n = on.length
  console.log(`\n${title} (${n} careers per arm)\n`)
  console.log(`  ${padR('', 44)}${padL('ON (from the 1st W)', 22)}${padL('OFF (from 18)', 18)}${padL('delta', 16)}`)
  const row = (label: string, a: string, b: string, d: string) =>
    console.log(`  ${padR(label, 44)}${padL(a, 22)}${padL(b, 18)}${padL(d, 16)}`)

  const paidOn = on.filter((c) => c.kidFundsCents > 0).length
  const paidOff = off.filter((c) => c.kidFundsCents > 0).length
  row('careers holding a non-zero account', `${paidOn} (${pct(paidOn, n)})`, `${paidOff} (${pct(paidOff, n)})`, `${paidOn - paidOff}`)

  const herOn = mean(on.map((c) => c.kidFundsCents))
  const herOff = mean(off.map((c) => c.kidFundsCents))
  row('HER account – mean', money(herOn), money(herOff), money(herOn - herOff))
  row(
    'HER account – median',
    money(median(on.map((c) => c.kidFundsCents))),
    money(median(off.map((c) => c.kidFundsCents))),
    money(median(on.map((c) => c.kidFundsCents)) - median(off.map((c) => c.kidFundsCents))),
  )

  const famOn = mean(on.map((c) => c.fundsCents))
  const famOff = mean(off.map((c) => c.fundsCents))
  row('FAMILY wallet – mean', money(famOn), money(famOff), money(famOn - famOff))
  row(
    'FAMILY wallet – median',
    money(median(on.map((c) => c.fundsCents))),
    money(median(off.map((c) => c.fundsCents))),
    money(median(on.map((c) => c.fundsCents)) - median(off.map((c) => c.fundsCents))),
  )

  const przOn = mean(on.map((c) => c.familyPrizeCents))
  const przOff = mean(off.map((c) => c.familyPrizeCents))
  row('FAMILY prize banked – mean', money(przOn), money(przOff), `${money(przOn - przOff)} ${signedPct(przOn - przOff, przOff)}`)

  // ⚠ THE ACTUATION PROOF, PER ARM AND READ OFF THE RUN: the OFF arm must hold exactly zero junior
  // cents on every career, and the ON arm must not. Both zero means the corpus never earned a junior
  // cheque, and the table above would then be a null nobody could read.
  const juniorOn = on.reduce((s, c) => s + c.juniorCents, 0)
  const juniorOff = off.reduce((s, c) => s + c.juniorCents, 0)
  console.log('')
  console.log(`  junior cents transferred, ON:                 ${money(juniorOn)}`)
  console.log(`  junior cents transferred, OFF (must be $0):   ${money(juniorOff)}`)
  const firstAges = on.map((c) => c.firstPaidAge).filter((a) => a > 0)
  console.log(
    `  the age her FIRST cheque reached her:         ${
      firstAges.length === 0 ? '–' : `${Math.min(...firstAges)} at the earliest, ${median(firstAges).toFixed(1)} median`
    }`,
  )
  // ⚠ COMPARABILITY BEFORE THE DIFFERENCE IS READ (CLAUDE.md's own A/B rule): two careers that
  // played different tournaments are two different lives and their wallets are not a measurement.
  let same = 0
  for (let i = 0; i < n; i++) if (on[i].results === off[i].results) same++
  console.log(`  arms that played the same tournaments:        ${same} of ${n} (${pct(same, n)})`)
}

function main(): void {
  report(
    'ROUND 41 #27 – AT HER EIGHTEENTH, the end of the junior window',
    runArm(AGE_18_WEEKS, seedsPerPreset, false),
    runArm(AGE_18_WEEKS, seedsPerPreset, true),
  )
  report(
    "ROUND 41 #27 – AT TWENTY-SIX, round 23's own horizon (it measured the 18-gate at -36% family mean)",
    runArm(AGE_26_WEEKS, longSeedsPerPreset, false),
    runArm(AGE_26_WEEKS, longSeedsPerPreset, true),
  )
}

main()
