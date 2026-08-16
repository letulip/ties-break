// ⭐⭐ WHAT THE COLLEGE ANSWER OFFERS – the guards for v51,
// docs/specs/what-the-college-place-costs-2026-08.md.
//
// Three properties are load-bearing and each has its own describe block, because they fail
// differently and two of them are owner rulings rather than balance:
//
//   A. THE ATHLETIC SHARE IS MERIT-ONLY. It may never read family wealth. The owner asked the
//      question directly on 16.08 – «едины для всех или тоже от достатка?» – and the answer built
//      here is that the athletics award is merit-priced (there is no means test anywhere in NCAA
//      Bylaw 15 on athletics aid) while a separate need-based layer beside it is means-tested.
//   B. NOTHING REMOVES THE THIRD ANSWER. His ruling of the same morning. A weak record buys a small
//      share at a small programme; an EMPTY record buys a walk-on place at full price. Neither is a
//      refusal, and no professional result is an input at all.
//   C. THE TWO LAYERS ARE METERED AT ONE CEILING and the trim falls on the need layer. NCAA Bylaw
//      15.1: total aid may not exceed the cost of attendance. 15.1.3: the institution reduces
//      INSTITUTIONAL aid to get back under it.
import { describe, it, expect } from 'vitest'
import {
  COLLEGE_OFFER,
  JUNIOR_RUNGS,
  athleticShareOf,
  collegeOfferFor,
  juniorRecordScore,
  needShareOf,
  programmeFor,
  type CollegeRecruitView,
  type JuniorRung,
} from '../src/engine/collegeOffer'
import { rngFromSeed } from '../src/engine/rng'
import type { FamilyBackground } from '../src/shared/protocol'

const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']
// ⚠ ZERO-BASED FINISHES: 0 = won it, 1 = lost the final, 2-3 = semi, 4-7 = quarter. `world.ts`'s
// trophy cabinet is the definition (`kidFinish === 0` pushes a title).
const RECORDS: Array<[string, Partial<Record<JuniorRung, number>>, number]> = [
  ['empty', {}, 0],
  ['j30 titles only', { j30: 0, j60: 0 }, 2],
  ['a j300 quarter', { j300: 7 }, 0],
  ['a j300 semi', { j300: 3 }, 2],
  ['a j300 final', { j300: 1 }, 4],
  ['a j300 title', { j300: 0 }, 6],
  ['everything', { j300: 0, j60: 0, j30: 0 }, 15],
]

function view(
  juniorBests: Partial<Record<JuniorRung, number>>,
  background: FamilyBackground,
  country: string,
  juniorTitles = 0,
): CollegeRecruitView {
  return { juniorBests, juniorTitles, background, country }
}

describe('A. the athletics award is merit-only', () => {
  // ⚠ THIS IS THE CASE THE OWNER'S QUESTION TURNS ON, and it is written as a SWEEP rather than as a
  // spot check because the failure it guards against is a plausible future edit ("richer families
  // get better programmes"), not a typo. Every junior record x every background x both
  // nationalities, one die, one number expected.
  it('does not move with family background or nationality, on any junior record', () => {
    for (const [label, bests, titles] of RECORDS) {
      const score = juniorRecordScore({ juniorBests: bests, juniorTitles: titles })
      const programme = programmeFor(score)
      if (programme === null) continue
      const shares = new Set<number>()
      for (const background of BACKGROUNDS) {
        for (const country of ['US', 'RU', 'AU']) {
          const offer = collegeOfferFor(view(bests, background, country, titles), rngFromSeed('fixed:offer'))
          shares.add(offer.athleticShare)
        }
      }
      expect(shares.size, `${label}: the athletics award took ${shares.size} different values`).toBe(1)
    }
  })

  // ⚠ AND THE SIGNATURE IS THE REAL GUARD. `athleticShareOf` takes a programme, a score and a die –
  // there is no argument it could read a family from. This case is what makes that structural fact a
  // tested one: it calls the function directly, which a version that had grown a `background`
  // parameter could not satisfy without a compile error here.
  it('is computable with no family and no country in scope at all', () => {
    const direct = athleticShareOf('solid', 10, rngFromSeed('fixed:offer'))
    const throughView = collegeOfferFor(view({ j300: 3 }, 'wealthy', 'US'), rngFromSeed('fixed:offer'))
    expect(juniorRecordScore({ juniorBests: { j300: 3 }, juniorTitles: 0 })).toBe(10)
    expect(programmeFor(10)).toBe('solid')
    expect(throughView.athleticShare).toBeCloseTo(direct, 12)
  })

  // ⚠ THE RECRUIT VIEW HAS NO PROFESSIONAL FIELD, and that is what makes the deleted rule
  // unrepresentable rather than merely dormant. If an agent ever adds `rank` or `prizeCents` here to
  // re-create "she is too good for college now" from the other side, this goes red first.
  it('reads a junior record and nothing professional', () => {
    const keys = Object.keys(view({}, 'middle', 'US')).sort()
    expect(keys).toEqual(['background', 'country', 'juniorBests', 'juniorTitles'])
    for (const rung of JUNIOR_RUNGS) expect(rung.startsWith('j')).toBe(true)
  })
})

describe('B. nothing removes the third answer', () => {
  it('offers a place on the weakest record that has anything in it at all', () => {
    // A single J300 quarter-final and nothing else in five junior seasons.
    const offer = collegeOfferFor(view({ j300: 7 }, 'working', 'US'), rngFromSeed('weak'))
    expect(offer.programme).toBe('small')
    expect(offer.athleticShare).toBeGreaterThan(0)
  })

  // ⚠ AN EMPTY RECORD IS A WALK-ON, NOT A CLOSED DOOR. She enrols and pays; the answer is still
  // there. `programme: null` is the narrow route stated honestly (nobody offered her money), never a
  // refusal.
  it('still enrols a girl no programme funded, at the full price', () => {
    const offer = collegeOfferFor(view({}, 'wealthy', 'US'), rngFromSeed('nobody'))
    expect(offer.programme).toBeNull()
    expect(offer.athleticShare).toBe(0)
    expect(offer.familyPerYearCents).toBe(COLLEGE_OFFER.costPerYearInStateCents)
  })

  // ⚠ AND THE NEED LAYER STILL REACHES HER, because it was never an athletics thing. A poor American
  // family gets means-tested aid whether or not a coach ever called.
  it('gives an unfunded walk-on the need-based layer anyway', () => {
    const offer = collegeOfferFor(view({}, 'working', 'US'), rngFromSeed('nobody'))
    expect(offer.programme).toBeNull()
    expect(offer.needShare).toBe(COLLEGE_OFFER.needShareByBackground.working)
    expect(offer.familyPerYearCents).toBeLessThan(COLLEGE_OFFER.costPerYearInStateCents)
  })

  // A better junior record only ever buys MORE. Monotone, which is the direction that makes this
  // impossible to read as a punishment for playing.
  it('never pays a stronger junior record less than a weaker one', () => {
    const scores = RECORDS.map(([, b, t]) => juniorRecordScore({ juniorBests: b, juniorTitles: t })).sort((a, b) => a - b)
    let last = -1
    for (const score of scores) {
      const programme = programmeFor(score)
      const share = programme === null ? 0 : athleticShareOf(programme, score, rngFromSeed('fixed'))
      expect(share).toBeGreaterThanOrEqual(last)
      last = share
    }
  })
})

describe('C. the two layers, one ceiling', () => {
  // NCAA Bylaw 15.1 – total aid may not exceed the cost of attendance.
  it('never covers more than the bill', () => {
    for (const [label, bests, titles] of RECORDS) {
      for (const background of BACKGROUNDS) {
        for (const country of ['US', 'FR']) {
          const o = collegeOfferFor(view(bests, background, country, titles), rngFromSeed(`${label}:${country}`))
          expect(o.athleticShare + o.needShare, `${label}/${background}/${country}`).toBeLessThanOrEqual(1.000001)
          expect(o.familyPerYearCents).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  // ⚠ AND THE TRIM FALLS ON THE NEED LAYER. 15.1.3's own remedy is to reduce institutional aid – and
  // trimming the athletics award instead would make a merit number move with family wealth, which is
  // block A's property. So this case is A's second half rather than a duplicate of it.
  it('trims the need layer, not the award, when the two would overflow', () => {
    const bare = athleticShareOf('strong', 26, rngFromSeed('rich-kid'))
    const poor = collegeOfferFor(view({ j300: 0, j60: 0, j30: 0 }, 'working', 'US', 15), rngFromSeed('rich-kid'))
    expect(poor.athleticShare).toBeCloseTo(bare, 12)
    expect(poor.athleticShare + poor.needShare).toBeCloseTo(1, 6)
    expect(poor.needShare).toBeLessThan(COLLEGE_OFFER.needShareByBackground.working)
    expect(poor.familyPerYearCents).toBe(0)
  })

  // ⚠⚠ THE NATIONALITY SPLIT, WHICH IS PRIMARY LAW AND NOT A BALANCE CHOICE. 34 CFR §668.33 bars
  // federal student aid to anyone in the US "for a temporary purpose", which a student visa is; NAFSA
  // calls institutional aid to undergraduate internationals "uncommon". The athletics award is
  // untouched – nothing in Bylaw 15 conditions it on nationality, and 62-66% of D-I women's tennis
  // rosters are international.
  it('shuts the need layer to a non-American and leaves her award alone', () => {
    const bests = { j300: 3 }
    const home = collegeOfferFor(view(bests, 'working', 'US'), rngFromSeed('same'))
    const away = collegeOfferFor(view(bests, 'working', 'RU'), rngFromSeed('same'))
    expect(away.athleticShare).toBeCloseTo(home.athleticShare, 12)
    expect(home.needShare).toBeGreaterThan(0)
    expect(away.needShare).toBe(0)
    expect(needShareOf('working', 'RU')).toBe(0)
    // And she faces the out-of-state sticker, because a non-resident alien is never in-state.
    expect(home.costPerYearCents).toBe(COLLEGE_OFFER.costPerYearInStateCents)
    expect(away.costPerYearCents).toBe(COLLEGE_OFFER.costPerYearOutOfStateCents)
    expect(away.familyPerYearCents).toBeGreaterThan(home.familyPerYearCents)
  })

  // The need layer is means-tested and monotone in the direction the owner would expect.
  it('is means-tested: working > middle > wealthy, for an American', () => {
    expect(needShareOf('working', 'US')).toBeGreaterThan(needShareOf('middle', 'US'))
    expect(needShareOf('middle', 'US')).toBeGreaterThan(needShareOf('wealthy', 'US'))
    expect(needShareOf('wealthy', 'US')).toBe(0)
  })
})
