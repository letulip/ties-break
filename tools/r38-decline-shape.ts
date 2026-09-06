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
import { ECONOMY } from '../src/engine/economy'
import { declineFactor } from '../src/engine/development'
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
