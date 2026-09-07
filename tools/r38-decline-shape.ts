/**
 * r38-decline-shape – HOW FAST A VETERAN FADES, AND WHEN THE GAME CAN STILL END HER CAREER.
 *
 * Round 38 #3d. The owner, 06.09: «я вижу ветеранов на корте, да, они уже не могут так быстро
 * бегать, как раньше, но они и не беспомощны. Хотя может быть для формального окончания игры это и
 * ок. Может разве что тоже плавнее сделать.»
 *
 * ⚠ MEASUREMENT ONLY, AND IT NEEDS NO CAREER WALK. Past `declineStart` nothing else moves a physical
 * attribute – `ageFactor` returns 0 from that age – so each of the four is multiplied by the same
 * `(1 - declineFactor(age))` every week and `physicalMean(now) / peakPhysical` is EXACTLY the product
 * of those factors. `development.ts#physicalMean`'s own header states this and it is what makes the
 * table below arithmetic rather than a simulation.
 *
 * ⚠⚠ THE CONSTRAINT THE TABLE EXISTS TO CHECK. `ENDINGS.lastOfferPeakShare` is **0.55**, and
 * `ending.ts` marks an off-season offer FINAL when `physicalShare <= 0.55`. A decline floor at or
 * above that share would make the final offer unreachable and a career could never be ended by the
 * body at all – which is precisely the half the owner said may stay («для формального окончания игры
 * это и ок»). Every arm below prints the age at which the share first crosses it.
 *
 * Run: npx vite-node tools/r38-decline-shape.ts
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { ECONOMY } from '../src/engine/economy'
import { PHYSICAL_SKILL_KEYS, ageCurveOf, ageWeightOf, declineFactor, physicalMean } from '../src/engine/development'
import { kidAgeExact } from '../src/engine/world/age'
import { startingSkills, withHeadStart } from '../src/engine/world/player'
import type { WorldState } from '../src/engine/world'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const padR = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)

type Arm = { label: string; rate: number; accel: number; floorShare?: number }

const A = ECONOMY.development.ageCurve
const ARMS: Arm[] = [
  { label: `shipped (${A.declineRate}, accel ${A.declineAccel})`, rate: A.declineRate, accel: A.declineAccel },
  { label: 'accel 0.28 (the old one)', rate: A.declineRate, accel: 0.28 },
  { label: 'accel 0.22', rate: A.declineRate, accel: 0.22 },
  { label: 'accel 0.18', rate: A.declineRate, accel: 0.18 },
  { label: 'accel 0.14', rate: A.declineRate, accel: 0.14 },
  { label: 'accel 0.18 + floor .45', rate: A.declineRate, accel: 0.18, floorShare: 0.45 },
  { label: 'accel 0.18 + floor .50', rate: A.declineRate, accel: 0.18, floorShare: 0.5 },
  { label: 'shipped + floor .45', rate: A.declineRate, accel: A.declineAccel, floorShare: 0.45 },
]

/** Patch the two rate dials, run, and put them back whatever happens – the in-place move
 *  `tools/potential-band-sweep.ts` documents. Nothing here changes a shipped constant. */
function withArm<T>(arm: Arm, fn: () => T): T {
  const c = ECONOMY.development.ageCurve as unknown as { declineRate: number; declineAccel: number }
  const r = c.declineRate
  const a = c.declineAccel
  c.declineRate = arm.rate
  c.declineAccel = arm.accel
  try {
    return fn()
  } finally {
    c.declineRate = r
    c.declineAccel = a
  }
}

/** The share of her peak body left at each age, walked week by week from `declineStart`, with the
 *  candidate floor applied exactly where `growWeek` would apply it. */
function shareByAge(arm: Arm, declineStart: number, toAge: number): Map<number, number> {
  const bounds = { plateauStart: 23, declineStart }
  const out = new Map<number, number>()
  return withArm(arm, () => {
    let share = 1
    for (let age = declineStart; age <= toAge; age += 1 / WEEKS_PER_YEAR) {
      const d = declineFactor(age, bounds)
      const next = share * (1 - d)
      share = arm.floorShare !== undefined ? Math.max(arm.floorShare, next) : next
      const whole = Math.round(age * 100) / 100
      if (Math.abs(whole - Math.round(whole)) < 1 / WEEKS_PER_YEAR / 2) out.set(Math.round(whole), share)
    }
    return out
  })
}

const AGES = [30, 32, 34, 35, 36, 38, 40, 42, 45]
const DECLINE_START = 29

console.log(`ENDINGS.lastOfferPeakShare = ${ENDINGS.lastOfferPeakShare} – the share at or below which the off-season offer is FINAL`)
console.log(`declineStart used: ${DECLINE_START} (the college route's shipped pair, no spread)`)
console.log()
console.log(padR("arm", 30) + AGES.map((a) => padL(a, 8)).join('') + padL('ends at', 10) + padL('%/season@35', 13))
for (const arm of ARMS) {
  const share = shareByAge(arm, DECLINE_START, 50)
  let endsAt: string = 'NEVER'
  for (let a = DECLINE_START; a <= 50; a++) {
    const v = share.get(a)
    if (v !== undefined && v <= ENDINGS.lastOfferPeakShare) {
      endsAt = String(a)
      break
    }
  }
  const perSeason = withArm(arm, () => {
    const d = declineFactor(35, { plateauStart: 23, declineStart: DECLINE_START })
    return (1 - Math.pow(1 - d, WEEKS_PER_YEAR)) * 100
  })
  console.log(
    padR(arm.label, 30) +
      AGES.map((a) => padL((share.get(a) ?? 0).toFixed(3), 8)).join('') +
      padL(endsAt, 10) +
      padL(perSeason.toFixed(2) + '%', 13),
  )
}
console.log()
console.log('⚠ "ends at" is the first whole age at which the body alone can end the career. NEVER means')
console.log('  the floor sits at or above lastOfferPeakShare and the final offer becomes unreachable.')


// =================================================================================================
// ⭐⭐ ROUND 38 #6c – WHAT THE PER-ATTRIBUTE WEIGHTS DO TO A REAL CAREER
// =================================================================================================
//
// ⚠ THIS IS THE SHIPPED ARITHMETIC AND NOT A MODEL OF IT. Past `declineStart` `ageFactor` returns 0,
// so `growWeek`'s only surviving term for a physical attribute is
// `loss = decline x ageWeightOf(k) x skills[k]` – which is what the walk below applies, week by week,
// off her own stored peak. The single-rate column is the same walk with every weight forced to 1.
//
// Run: npx vite-node tools/r38-decline-shape.ts -- --save /path/career.tsave
const f2 = (n: number) => n.toFixed(2)

async function perAttribute(savePath: string) {
  const world = (await decodeExportFile(new Uint8Array(readFileSync(savePath)))) as WorldState
  const age = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
  const bounds = ageCurveOf(world.ageCurve, world.careerTotals?.weeksLostToInjury ?? 0)
  const birth = withHeadStart(startingSkills(world.seed, world.profile), world.profile.birthMonth)

  /** Walk from `declineStart` to her age, applying the shipped loss per week. `weighted: false`
   *  forces every weight to 1, i.e. the pre-#6c engine, so the two columns differ in ONE thing. */
  function walk(weighted: boolean): Record<string, number> {
    const out: Record<string, number> = {}
    for (const k of PHYSICAL_SKILL_KEYS) out[k] = 1
    for (let a = bounds.declineStart; a < age; a += 1 / WEEKS_PER_YEAR) {
      const d = declineFactor(a, bounds)
      for (const k of PHYSICAL_SKILL_KEYS) out[k]! *= 1 - d * (weighted ? ageWeightOf(k) : 1)
    }
    return out
  }

  const single = walk(false)
  const split = walk(true)
  // ⚠⚠ HER PEAK IS BACK-DERIVED THROUGH THE **SINGLE-RATE** FACTOR, AND GETTING THIS BACKWARDS IS
  // THE ONE WAY TO MAKE THIS TABLE CIRCULAR. The save was PLAYED under one rate – the weights did not
  // exist when it was written – so today's values are `peak x single`, and dividing them by the
  // WEIGHTED factor would invent a peak she never had and then "prove" that the weights change
  // nothing. Divide by the model she actually lived under, and the weighted column is then the honest
  // counterfactual: what she would read today if the weights had been in force all along.
  const peak: Record<string, number> = {}
  for (const k of PHYSICAL_SKILL_KEYS) peak[k] = world.skills[k] / single[k]!

  console.log()
  console.log('='.repeat(96))
  console.log(`PER-ATTRIBUTE DECLINE – ${world.profile.kidName} at ${f2(age)}, declineStart ${f2(bounds.declineStart)}`)
  console.log('='.repeat(96))
  console.log(padR('skill', 16) + padL('birth', 9) + padL('peak', 9) + padL('one rate', 10) + padL('weighted', 10) + padL('weight', 8) + padL('vs birth', 10))
  const cells: Record<string, number> = {}
  for (const k of PHYSICAL_SKILL_KEYS) {
    const one = peak[k]! * single[k]!
    const w = peak[k]! * split[k]!
    cells[k] = w
    console.log(
      padR(k, 16) + padL(f2(birth[k]), 9) + padL(f2(peak[k]!), 9) + padL(f2(one), 10) + padL(f2(w), 10) +
      padL(ageWeightOf(k).toFixed(2), 8) + padL((w - birth[k] >= 0 ? '+' : '') + f2(w - birth[k]), 10),
    )
  }
  const meanOne = PHYSICAL_SKILL_KEYS.reduce((t, k) => t + peak[k]! * single[k]!, 0) / PHYSICAL_SKILL_KEYS.length
  const meanW = physicalMean({ ...world.skills, ...cells } as never)
  console.log(padR('MEAN', 16) + padL(f2(physicalMean(birth)), 9) + padL(f2(world.peakPhysical ?? 0), 9) + padL(f2(meanOne), 10) + padL(f2(meanW), 10))
  console.log()
  console.log(`  ⚠ the mean moves by ${f2(Math.abs(meanW - meanOne))} of a point – that is the normalisation holding.`)
  const below = PHYSICAL_SKILL_KEYS.filter((k) => cells[k]! < birth[k])
  console.log(`  ⭐ attributes now BELOW the build she was born with: ${below.length ? below.join(', ') : 'none'}`)
  const belowOne = PHYSICAL_SKILL_KEYS.filter((k) => peak[k]! * single[k]! < birth[k])
  console.log(`     ...against ${belowOne.length ? belowOne.join(', ') : 'none'} on one rate.`)
}

const saveArg = process.argv.indexOf('--save')
if (saveArg >= 0 && process.argv[saveArg + 1]) {
  await perAttribute(process.argv[saveArg + 1]!)
}
