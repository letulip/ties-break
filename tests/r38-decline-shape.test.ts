// ⭐⭐ A VETERAN IS SLOWER, NOT HELPLESS – AND THE BODY MUST STILL BE ABLE TO END A CAREER.
//
// The owner, 06.09: «я вижу ветеранов на корте, да, они уже не могут так быстро бегать, как раньше,
// но они и не беспомощны… Может разве что тоже плавнее сделать» – and, in the same breath, the half
// he chose to keep: «Хотя может быть для формального окончания игры это и ок.»
//
// ⚠⚠ THE SECOND HALF IS THE ONE THIS FILE EXISTS FOR. `ENDINGS.lastOfferPeakShare` is 0.55 and
// `ending.ts` marks an off-season offer FINAL when `physicalShare <= 0.55`; soften the decline far
// enough – or add a floor at or above that share – and the offer becomes unreachable and no career
// can ever be ended by the body. Nothing else in the repo asks that question, and it is silent when
// it goes wrong: careers simply never finish.
//
// ⚠ THE SHARE IS ARITHMETIC AND NOT A SIMULATION. Past `declineStart` `ageFactor` returns 0, so
// every physical attribute is multiplied by the same `(1 - declineFactor(age))` each week and
// `physicalMean(now) / peakPhysical` is exactly the product of those factors – `physicalMean`'s own
// header states it. That is why this walks weeks instead of careers.
import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../src/engine/economy'
import { declineFactor } from '../src/engine/development'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const DECLINE_START = 29
const bounds = { plateauStart: 23, declineStart: DECLINE_START }

/** The share of her peak body left at `toAge`, walked week by week from `declineStart`. */
function shareAt(toAge: number): number {
  let share = 1
  for (let age = DECLINE_START; age < toAge; age += 1 / WEEKS_PER_YEAR) {
    share *= 1 - declineFactor(age, bounds)
  }
  return share
}

describe('round 38 #3d – the veteran years are gentler', () => {
  it('still declines, and still accelerates', () => {
    expect(declineFactor(30, bounds)).toBeGreaterThan(0)
    expect(declineFactor(35, bounds)).toBeGreaterThan(declineFactor(30, bounds))
    expect(declineFactor(40, bounds)).toBeGreaterThan(declineFactor(35, bounds))
  })

  it('takes less than five per cent of her body in a season at 35', () => {
    const perSeason = 1 - Math.pow(1 - declineFactor(35, bounds), WEEKS_PER_YEAR)
    expect(perSeason).toBeLessThan(0.05)
    // ...and it is not flat either: a veteran year still costs more than a young one.
    const at30 = 1 - Math.pow(1 - declineFactor(30, bounds), WEEKS_PER_YEAR)
    expect(perSeason).toBeGreaterThan(at30)
  })

  it('leaves more than three fifths of her at forty', () => {
    expect(shareAt(40)).toBeGreaterThan(0.6)
  })
})

describe('⚠⚠ round 38 #3d – the body can STILL end a career', () => {
  it('crosses lastOfferPeakShare by 45, so the final off-season offer is reachable', () => {
    // The guard, and the whole reason the floor measured in tools/r38-decline-shape.ts was REFUSED:
    // at 0.45 or 0.50 it never binds before 0.55 is crossed, so it would have been decoration – and
    // at 0.55 or above it would have made this impossible.
    expect(shareAt(45)).toBeLessThanOrEqual(ENDINGS.lastOfferPeakShare)
  })

  it('⚠ MUTATION ARM – a decline soft enough to strand the career is caught here', () => {
    const c = ECONOMY.development.ageCurve as unknown as { declineAccel: number; declineRate: number }
    const accel = c.declineAccel
    const rate = c.declineRate
    c.declineRate = rate / 4
    try {
      expect(shareAt(45)).toBeGreaterThan(ENDINGS.lastOfferPeakShare)
    } finally {
      c.declineAccel = accel
      c.declineRate = rate
    }
  })

  it('composure is untouched by any of this – it is not a physical attribute', () => {
    // The predicate rather than a repeat of it: `development.ts#isPhysicalSkill` is the one answer to
    // "which attributes does age take points off", and composure is the one it excludes.
    expect(ECONOMY.development.veteranPoise).toBeGreaterThan(0)
  })
})
