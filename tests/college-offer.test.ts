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
  coveredShareOf,
  fundingBandOf,
  juniorRecordScore,
  needShareOf,
  programmeFor,
  type CollegeFundingBand,
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

/** ⭐ ROUND 21 – THE FAMILY'S POSITION AT ENROLMENT, which the need layer now reads instead of the
 *  background label. The defaults put a family squarely inside the taper so a case that does not care
 *  about the means test still gets a non-zero need share, exactly as the label used to give it one.
 *  ⚠ MEASURED VALUES, not invented ones: $18,255 / $19,650 are the WORKING band's median annualised
 *  parent income and median savings at the fork, n = 53 (probe arm A at 6575a35). */
const WORKING_INCOME = 18_255_00
const WORKING_SAVINGS = 19_650_00

function view(
  juniorBests: Partial<Record<JuniorRung, number>>,
  background: FamilyBackground,
  country: string,
  juniorTitles = 0,
  familyIncomeCents = WORKING_INCOME,
  familyAssetsCents = WORKING_SAVINGS,
): CollegeRecruitView {
  return { juniorBests, juniorTitles, background, country, familyIncomeCents, familyAssetsCents }
}

describe('A. the athletics award is merit-only', () => {
  // ⚠ THIS IS THE CASE THE OWNER'S QUESTION TURNS ON, and it is written as a SWEEP rather than as a
  // spot check because the failure it guards against is a plausible future edit ("richer families
  // get better programmes"), not a typo. Every junior record x every background x both
  // nationalities, one die, one number expected.
  //
  // ⚠⚠ ROUND 21 WIDENED THIS SWEEP RATHER THAN REPLACING IT, and the widening is the point. The need
  // layer stopped reading the background LABEL and started reading the family's real income and
  // savings at enrolment – which means there are now two more axes an award could accidentally learn
  // to read, and the sweep that guards the owner's question has to cover them or it has been
  // silently narrowed at the moment the surface grew. Backgrounds x nationalities x INCOMES x
  // SAVINGS, one number expected. The extremes are real: $335,586 is the largest savings balance
  // measured at the fork over 53 careers, and a negative balance is a family that arrived in debt.
  it('does not move with family background, nationality, income or savings, on any junior record', () => {
    const INCOMES = [0, 18_255_00, 55_153_00, 500_000_00]
    const SAVINGS = [-40_000_00, 0, 19_650_00, 335_586_00]
    for (const [label, bests, titles] of RECORDS) {
      const score = juniorRecordScore({ juniorBests: bests, juniorTitles: titles })
      const programme = programmeFor(score)
      if (programme === null) continue
      const shares = new Set<number>()
      for (const background of BACKGROUNDS) {
        for (const country of ['US', 'RU', 'AU']) {
          for (const income of INCOMES) {
            for (const savings of SAVINGS) {
              const offer = collegeOfferFor(view(bests, background, country, titles, income, savings), rngFromSeed('fixed:offer'))
              shares.add(offer.athleticShare)
            }
          }
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
  //
  // ⚠⚠ RE-AIMED IN ROUND 21, NOT LOOSENED. Two keys were added – `familyIncomeCents` and
  // `familyAssetsCents` – because the need layer now prices the family's real position at enrolment
  // rather than its background label (the owner, 17.08: «с учетом доходов семьи на момент
  // поступления»). The list is still EXHAUSTIVE, so a third addition still goes red here first; what
  // changed is which four names are expected, and the second assertion below is new and states the
  // property the list was always standing in for.
  it('reads a junior record and nothing professional', () => {
    const keys = Object.keys(view({}, 'middle', 'US')).sort()
    expect(keys).toEqual(['background', 'country', 'familyAssetsCents', 'familyIncomeCents', 'juniorBests', 'juniorTitles'])
    for (const rung of JUNIOR_RUNGS) expect(rung.startsWith('j')).toBe(true)
    // ⚠ THE PROPERTY ITSELF, SAID DIRECTLY: nothing on this view is a PROFESSIONAL result. The owner
    // deleted the rule that a tour result closes the college door on 16.08, and the guard against
    // re-creating it is that the fact it would need is not a field here. A key list alone could be
    // satisfied by renaming; this cannot.
    for (const k of keys) {
      expect(/rank|prize|wta|itf|w[0-9]|pro|earn|title.*sen/i.test(k), `${k} looks like a professional result`).toBe(false)
    }
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
  //
  // ⚠⚠ ROUND 21 RE-AIMED THE FAMILY IN THIS CASE, AND THE RE-AIM IS THE BEHAVIOUR CHANGE ITSELF.
  // It used to pass `'wealthy'` and expect the full sticker, because the label alone bought a need
  // share of zero. The label no longer prices anything – a family is priced on the income and savings
  // it actually has at enrolment – so the case now passes a wealthy POSITION (the measured wealthy
  // median: $55,153 income, $15,518 saved). ⚠ A career labelled `wealthy` that arrived broke would
  // now get the need layer, which is the intended new behaviour and not a leak in this test.
  it('still enrols a girl no programme funded, at the full price', () => {
    const offer = collegeOfferFor(view({}, 'wealthy', 'US', 0, 55_153_00, 15_518_00), rngFromSeed('nobody'))
    expect(offer.programme).toBeNull()
    expect(offer.athleticShare).toBe(0)
    expect(offer.needShare).toBe(0)
    expect(offer.familyPerYearCents).toBe(COLLEGE_OFFER.costPerYearInStateCents)
  })

  // ⚠ AND THE NEED LAYER STILL REACHES HER, because it was never an athletics thing. A poor American
  // family gets means-tested aid whether or not a coach ever called.
  it('gives an unfunded walk-on the need-based layer anyway', () => {
    const offer = collegeOfferFor(view({}, 'working', 'US'), rngFromSeed('nobody'))
    expect(offer.programme).toBeNull()
    expect(offer.needShare).toBe(COLLEGE_OFFER.needTest.maxNeedShare)
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
    expect(poor.needShare).toBeLessThan(COLLEGE_OFFER.needTest.maxNeedShare)
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
    expect(needShareOf({ country: 'RU', familyIncomeCents: 0, familyAssetsCents: 0 })).toBe(0)
    // And she faces the out-of-state sticker, because a non-resident alien is never in-state.
    expect(home.costPerYearCents).toBe(COLLEGE_OFFER.costPerYearInStateCents)
    expect(away.costPerYearCents).toBe(COLLEGE_OFFER.costPerYearOutOfStateCents)
    expect(away.familyPerYearCents).toBeGreaterThan(home.familyPerYearCents)
  })

  // ⚠⚠ RE-AIMED IN ROUND 21 FROM THE LABEL TO THE POSITION, and it now asserts MORE than it did.
  //
  // It used to read `needShareOf('working'|'middle'|'wealthy', 'US')` – three lookups in a table, so
  // the only thing it could fail on was somebody editing the table out of order. The layer is now a
  // phase-out over the family's real income and savings at enrolment, so the property worth guarding
  // is the one the owner's question is actually about: **a family with more money gets less help, at
  // every point on the axis, and never the other way round.** A table cannot express that; a sweep
  // over the measured range can.
  it('is means-tested on the family position, monotonically and in the right direction', () => {
    const us = (income: number, assets = 0) => needShareOf({ country: 'US', familyIncomeCents: income, familyAssetsCents: assets })
    let last = Infinity
    for (let income = 0; income <= 70_000_00; income += 1_000_00) {
      const share = us(income)
      expect(share, `need share rose at income ${income}`).toBeLessThanOrEqual(last)
      last = share
    }
    expect(us(0)).toBe(COLLEGE_OFFER.needTest.maxNeedShare)
    expect(us(70_000_00)).toBe(0)

    // ⭐ AND SAVINGS COUNT TOO, which is the half the label could never see. Same income, more in the
    // bank, less help – «Копят деньги и оплачивают» is the owner's own framing of it. The shield is
    // real: below it, savings do not price her at all.
    const income = 22_000_00
    expect(us(income, COLLEGE_OFFER.needTest.assetShieldCents)).toBe(us(income, 0))
    expect(us(income, 200_000_00)).toBeLessThan(us(income, 0))
    expect(us(income, 500_000_00)).toBe(0)
  })

  // ⭐⭐ THE THREE MEASURED FAMILIES, AND THIS IS THE ROW THAT REPLACES THE OLD LABEL ORDERING.
  //
  // ⚠ THE POSITIONS ARE MEASURED, NOT CHOSEN: median annualised parent income and median savings at
  // the fork, per background, n = 53 (`college-price-probe --seeds 6 --all`, arm A at 6575a35). So
  // this case says the shipped population still orders the way the owner expects – WITHOUT the rule
  // being told which family is which.
  it('still orders the three shipped families correctly, reading no label at all', () => {
    const at = (income: number, assets: number) => needShareOf({ country: 'US', familyIncomeCents: income, familyAssetsCents: assets })
    const working = at(18_255_00, 19_650_00)
    const middle = at(31_531_00, 26_414_00)
    const wealthy = at(55_153_00, 15_518_00)
    expect(working).toBeGreaterThan(middle)
    expect(middle).toBeGreaterThan(wealthy)
    expect(wealthy).toBe(0)

    // ⚠⚠ AND THE CASE THE LABEL GOT WRONG, WHICH IS WHY ROUND 21 EXISTS. Measured, a WORKING family
    // at p75 has saved $57,555 by the fork while a WEALTHY one has saved $21,297 – the wealthy career
    // burned its capital on the tennis. Under the old table that working family was still paid the
    // full 45% because the label said "working". It is now priced on what it has.
    expect(at(18_862_00, 57_555_00)).toBeLessThan(COLLEGE_OFFER.needTest.maxNeedShare)
  })
})

// ⭐⭐ D. THE FUNDING BAND – round 21's second, named ladder («понятные ступени»).
describe('D. the funding band names what the two layers cover', () => {
  it('names the sourced edge exactly, and is monotone across the rest', () => {
    // ⚠ 1.0 IS THE SPORT'S OWN NAMED THING – Bylaw 15.02.5's full grant-in-aid, up to the cost of
    // attendance. It is the one band edge that is not ours, so it is pinned exactly.
    expect(fundingBandOf(1)).toBe('full')
    expect(fundingBandOf(0.999)).not.toBe('full')
    expect(fundingBandOf(0)).toBe('none')
    const order: CollegeFundingBand[] = ['none', 'part', 'half', 'most', 'full']
    let last = -1
    for (let c = 0; c <= 1.0001; c += 0.01) {
      const rank = order.indexOf(fundingBandOf(Math.min(1, c)))
      expect(rank, `band went backwards at ${c}`).toBeGreaterThanOrEqual(last)
      last = rank
    }
  })

  // ⚠⚠ THE LESSON OF THE PROGRAMME BANDS, APPLIED BEFORE SHIPPING RATHER THAN AFTER. `collegeOffer.ts`
  // records that the first set of programme thresholds put 88 of 90 careers in ONE band and measured
  // college as free. A band that holds nearly everybody carries no information about anybody, so the
  // funding bands are checked against the measured `covered` distribution (n = 53, arm A at 6575a35):
  // min 41.0% · p25 62.6% · median 79.4% · p75 99.9% · max 100%.
  it('splits the measured population across four live bands, not one', () => {
    const MEASURED = [0.41, 0.466, 0.55, 0.626, 0.7, 0.794, 0.85, 0.95, 0.999, 1]
    const bands = new Set(MEASURED.map(fundingBandOf))
    expect(bands.size).toBeGreaterThanOrEqual(4)
    expect(bands.has('full')).toBe(true)
    expect(bands.has('most')).toBe(true)
    expect(bands.has('half')).toBe(true)
    expect(bands.has('part')).toBe(true)
  })

  // The band and the bill are the same arithmetic, so a card cannot say "a full ride" over a
  // non-zero figure.
  it('agrees with the bill: a full ride charges nothing', () => {
    const o = collegeOfferFor(view({ j300: 0, j60: 0, j30: 0 }, 'working', 'US', 15), rngFromSeed('full-ride'))
    expect(fundingBandOf(coveredShareOf(o))).toBe('full')
    expect(o.familyPerYearCents).toBe(0)
  })
})
