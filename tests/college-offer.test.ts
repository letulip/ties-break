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
  COLLEGE_TIERS,
  COLLEGE_TIER_ORDER,
  canAfford,
  chosenQuoteOf,
  COLLEGE_TIER_ODDS,
  COLLEGE_ODDS_MEASURED_AT,
  COLLEGE_ODDS_MEASURED_AT_BEFORE_HOME_RULING,
  familyCanPayPerYearCents,
  recruitedAtAll,
  // ⚠ `tierOpenTo`, `tierShutFor`, `quoteShutFor`, `COLLEGE_SHUT_DETAIL` and `CollegeShutReason` were
  // imported here for round 24 #2a's refusal machinery. Round 26 #2's second pass deleted all five
  // with the rule they served – see block B's own note.
  type CollegeFundingBand,
  type CollegeRecruitView,
  type JuniorRung,
} from '../src/engine/collegeOffer'
// ⚠ THE PLAYABLE COUNTRY LIST, imported rather than sampled: block B sweeps every career a player can
// start. It is a composable (presentation – the engine holds two-letter codes and never renders one),
// which a TEST may read even though the engine may not.
import { COUNTRY_NAMES } from '../src/composables/countries'
import { COLLEGE_TRIP_WEEKS } from '../src/engine/world/college'
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
      if (!recruitedAtAll(score)) continue
      // ⚠⚠ AND SINCE 17.08 THE SWEEP RUNS PER TIER, because the award is a share of the price of the
      // place SHE CHOSE. An edit that made a dear place read a rich family would pass a sweep that
      // only looked at one tier, so every tier is swept and every one must be flat.
      for (const tier of COLLEGE_TIER_ORDER) {
        const shares = new Set<number>()
        for (const background of BACKGROUNDS) {
          for (const country of ['US', 'RU', 'AU']) {
            for (const income of INCOMES) {
              for (const savings of SAVINGS) {
                const offer = collegeOfferFor(view(bests, background, country, titles, income, savings), rngFromSeed('fixed:offer'))
                shares.add(offer.quotes.find((q) => q.tier === tier)!.athleticShare)
              }
            }
          }
        }
        expect(shares.size, `${label}/${tier}: the athletics award took ${shares.size} different values`).toBe(1)
      }
    }
  })

  // ⚠ AND THE SIGNATURE IS THE REAL GUARD. `athleticShareOf` takes a programme, a score and a die –
  // there is no argument it could read a family from. This case is what makes that structural fact a
  // tested one: it calls the function directly, which a version that had grown a `background`
  // parameter could not satisfy without a compile error here.
  it('is computable with no family and no country in scope at all', () => {
    const direct = athleticShareOf('state', 10, rngFromSeed('fixed:offer'))
    const throughView = collegeOfferFor(view({ j300: 3 }, 'wealthy', 'US'), rngFromSeed('fixed:offer'))
    expect(juniorRecordScore({ juniorBests: { j300: 3 }, juniorTitles: 0 })).toBe(10)
    // ⚠ THE FIRST QUOTE IS THE FIRST DRAW, in `COLLEGE_TIER_ORDER` – so the same die read the same
    // way. A version of `athleticShareOf` that had grown a `background` parameter could not satisfy
    // this line without a compile error here, which is the point of calling it directly.
    expect(throughView.quotes[0].tier).toBe('state')
    expect(throughView.quotes[0].athleticShare).toBeCloseTo(direct, 12)
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
    // ⚠ RE-AIMED 17.08: ALL THREE PLACES ARE ON THE TABLE FOR HER, and a weak record buys a small
    // share at each of them rather than relegating her to a small "programme". That is the owner's
    // scheme: the player picks the place, the record decides how much of it she pays for.
    expect(offer.quotes).toHaveLength(3)
    for (const q of offer.quotes) expect(q.athleticShare, q.tier).toBeGreaterThan(0)
    // and the same record is worth less at a dearer place – she sits lower on a stronger board.
    expect(offer.quotes[0].athleticShare).toBeGreaterThan(offer.quotes[2].athleticShare)
  })

  // ===============================================================================================
  // ⭐⭐⭐⭐ ROUND 26 #2, SECOND PASS – EVERY PLACE IS HERS, IN EVERY COUNTRY
  // ===============================================================================================
  //
  // The owner, having asked twice why the cheapest place was refused: «по-моему в каждой стране есть
  // домашний универ». Round 24 gave the refusal a reason and round 26's first pass made the reason
  // name the fact under it, and he asked again – because the refusal was TRUE and **unmeetable**:
  // `profile.country` is written once at onboarding, ~440 weeks before the card draws, and 23 of the
  // 24 playable countries were shut out of the cheap rung by it.
  //
  // WHAT USED TO BE HERE, so the record shows what was traded for what. Three cases: «leaves at least
  // two places open to everybody», the derivation sweep (`open` IS `tierShutFor(...) === null`, six
  // states), and the readout sweep (`quoteShutFor` off a persisted quote agrees with `tierShutFor`);
  // plus two copy cases over `COLLEGE_SHUT_DETAIL`. All five guarded ONE rule, and the rule is gone
  // with `CollegeQuote.open` itself (v61). What replaces them asserts the stronger thing: not that at
  // least two places survive a refusal, but that **there is no refusal**.
  //
  // ⚠ IT SWEEPS THE REAL COUNTRY LIST AND NOT A SAMPLE. `COUNTRY_NAMES` is exactly what onboarding
  // offers – a code with no name there is unreachable – so this is every career a player can start.
  it('⭐⭐⭐⭐ quotes all three places in all 24 playable countries, with no boolean between them', () => {
    const codes = Object.keys(COUNTRY_NAMES)
    expect(codes.length, 'the sweep really is the whole onboarding list').toBe(24)
    for (const country of codes) {
      const offer = collegeOfferFor(view({ j300: 3 }, 'working', country), rngFromSeed('anyone'))
      expect(offer.quotes.map((q) => q.tier), country).toEqual([...COLLEGE_TIER_ORDER])
      // ⚠ AND THE CHEAPEST IS THE HOME PLACE FOR ALL OF THEM, which is the sentence he wrote.
      expect(offer.quotes[0].costPerYearCents, `${country}: the home place`).toBe(
        COLLEGE_TIERS.state.costPerYearCents,
      )
    }
    // ⚠⚠ AND THE FIELD ITSELF IS GONE FROM THE PAYLOAD, not merely true. An always-true boolean is
    // the end state this deliberately did not take: it would leave the next reader believing a place
    // can be shut. Mutation: put `open: true` back on `quoteFor`'s return and this line goes red.
    const one = collegeOfferFor(view({ j300: 3 }, 'working', 'AU'), rngFromSeed('shape'))
    for (const q of one.quotes) expect('open' in q, `${q.tier}: no shut flag survives`).toBe(false)
  })

  // ⭐⭐⭐ D8 (14.09, «значит давай похороним»): THE NEED LAYER IS BURIED, and this case is the pin
  // that replaced the two the layer carried (the US-only country rule and the bill it split). The
  // tombstone at `COLLEGE_OFFER.assetSpreadYears` tells the cause of death – knots calibrated to
  // round 21's fork incomes, three economy waves of drift, zero real recipients ever after – and
  // this asserts the burial's whole visible surface: the SAME family pays the SAME bill whatever
  // its passport, and `needShare` is 0 on every quote for the view that once maximally qualified.
  // ⚠ The old cases' guards die WITH the mechanism they guarded, not silently: taper monotonicity,
  // the asset shield and the trim-order rule are properties of a function that no longer exists.
  it('D8: the buried need layer separates nobody and pays nobody', () => {
    const bests = { j300: 3 }
    const us = collegeOfferFor(view(bests, 'working', 'US'), rngFromSeed('same-die'))
    const au = collegeOfferFor(view(bests, 'working', 'AU'), rngFromSeed('same-die'))
    for (const tier of COLLEGE_TIER_ORDER) {
      const h = us.quotes.find((q) => q.tier === tier)!
      const a = au.quotes.find((q) => q.tier === tier)!
      expect(a.costPerYearCents, `${tier}: same sticker`).toBe(h.costPerYearCents)
      expect(a.athleticShare, `${tier}: same merit award`).toBeCloseTo(h.athleticShare, 12)
      expect(a.familyPerYearCents, `${tier}: and the same bill – the buried layer split nothing`).toBe(h.familyPerYearCents)
      expect(h.needShare, `${tier}: zero for the once-maximally-qualifying view`).toBe(0)
    }
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
    expect(recruitedAtAll(0)).toBe(false)
    for (const q of offer.quotes) {
      expect(q.athleticShare, q.tier).toBe(0)
      expect(q.needShare, q.tier).toBe(0)
      // ⚠ AND EVERY PLACE IS STILL ON THE TABLE AT ITS OWN FULL PRICE. She enrols and pays.
      expect(q.familyPerYearCents, q.tier).toBe(COLLEGE_TIERS[q.tier].costPerYearCents)
    }
  })

  // ⚠ D8's SECOND HALF: the view that used to earn `maxNeedShare` IN THIS SUITE (income 0, US,
  // working) – while no REAL family had reached the taper since the economy outgrew its knots –
  // now pays the full sticker like everybody else. The crafted-input life the layer led after its
  // real death is exactly why the burial needed a ruling and not a bugfix.
  it('D8: the once-maximally-qualifying walk-on pays the full price', () => {
    const offer = collegeOfferFor(view({}, 'working', 'US'), rngFromSeed('nobody'))
    for (const q of offer.quotes) {
      expect(q.athleticShare, q.tier).toBe(0)
      expect(q.needShare, q.tier).toBe(0)
      expect(q.familyPerYearCents, q.tier).toBe(COLLEGE_TIERS[q.tier].costPerYearCents)
    }
  })


  // A better junior record only ever buys MORE. Monotone, which is the direction that makes this
  // impossible to read as a punishment for playing.
  it('never pays a stronger junior record less than a weaker one', () => {
    const scores = RECORDS.map(([, b, t]) => juniorRecordScore({ juniorBests: b, juniorTitles: t })).sort((a, b) => a - b)
    // ⚠ AT EVERY TIER, since 17.08 – the monotonicity has to hold at the place she picks and not only
    // at the one her record used to be assigned.
    for (const tier of COLLEGE_TIER_ORDER) {
      let last = -1
      for (const score of scores) {
        const share = athleticShareOf(tier, score, rngFromSeed('fixed'))
        expect(share, `${tier} at ${score}`).toBeGreaterThanOrEqual(last)
        last = share
      }
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
          for (const q of o.quotes) {
            expect(q.athleticShare + q.needShare, `${label}/${background}/${country}/${q.tier}`).toBeLessThanOrEqual(1.000001)
            expect(q.familyPerYearCents).toBeGreaterThanOrEqual(0)
          }
        }
      }
    }
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
    const q = o.quotes[0]
    expect(fundingBandOf(coveredShareOf(q))).toBe('full')
    expect(q.familyPerYearCents).toBe(0)
  })
})

// =================================================================================================
// ⭐⭐ E. THE CHOICE (17.08, docs/specs/the-college-choice-2026-08.md)
// =================================================================================================
//
// The owner's scheme, as five properties the model has to hold rather than as copy on a card:
// a tier is a PRICE and a QUALITY; the award is a share of the price of the place SHE CHOSE; the
// family pays the rest weekly and may go into debt; the CHOICE is the player's; and nothing is
// compared to the tour anywhere in here.
describe('E. a tier is a place with a price, and the player picks it', () => {
  it('prices all three sourced stickers, cheapest first, and nothing else', () => {
    const offer = collegeOfferFor(view({ j300: 3 }, 'middle', 'US'), rngFromSeed('three'))
    expect(offer.quotes.map((q) => q.tier)).toEqual(['state', 'national', 'private'])
    // ⚠ THE THREE PRICES ARE THE SOURCED ONES – College Board, Trends 2025, Figure CP-1. Pinned
    // exactly, because these are the only numbers in the tier that are not ours.
    expect(offer.quotes.map((q) => q.costPerYearCents)).toEqual([30_990_00, 50_920_00, 65_470_00])
  })

  // ⚠⚠ THE TRADE, STATED AS ARITHMETIC. A dearer place is a stronger squad, so the SAME record earns
  // a smaller share of a bigger price – which is why the family pays strictly more for it. If this
  // ever inverts, the choice has stopped being a trade and become a free upgrade.
  it('makes a dearer place cost the family more on the same junior record', () => {
    for (const [label, bests, titles] of RECORDS) {
      const offer = collegeOfferFor(view(bests, 'middle', 'US', titles), rngFromSeed(`trade:${label}`))
      const bills = offer.quotes.map((q) => q.familyPerYearCents)
      expect(bills[1], `${label}: national vs state`).toBeGreaterThanOrEqual(bills[0])
      expect(bills[2], `${label}: private vs national`).toBeGreaterThanOrEqual(bills[1])
      // and the squad really does climb with the price, which is the other half of the trade
      const squads = offer.quotes.map((q) => COLLEGE_TIERS[q.tier].squad)
      expect(squads[0]).toBeLessThan(squads[1])
      expect(squads[1]).toBeLessThan(squads[2])
    }
  })

  // ⚠ NOBODY HAS PICKED ANYTHING YET, and there is no default. A preselected place is a
  // recommendation drawn in preselection – ruling 4 (30.07) forbids this card an opinion.
  it('arrives with nothing chosen, and reads back the place once one is', () => {
    const offer = collegeOfferFor(view({ j300: 3 }, 'middle', 'US'), rngFromSeed('pick'))
    expect(offer.chosen).toBeNull()
    expect(chosenQuoteOf(offer)).toBeNull()
    const taken = { ...offer, chosen: 'private' as const }
    expect(chosenQuoteOf(taken)?.tier).toBe('private')
    expect(chosenQuoteOf(taken)?.costPerYearCents).toBe(65_470_00)
  })

  // ⭐⭐ CAN SHE PAY FOR IT? A FACT, NEVER A REFUSAL – the family goes into debt, not away.
  //
  // ⚠ THE AFFORDABILITY NUMBER SURVIVED D8 – it was never the means test. The shielded
  // `familyPositionCents` died with the buried layer (the tombstone at
  // `COLLEGE_OFFER.assetSpreadYears`); what a family can PAY counts its whole cushion and still
  // does, on the same four-year spread the tombstone kept alive.
  it('counts the whole cushion when asking whether the family can pay', () => {
    const income = 31_531_00
    const saved = 100_000_00
    expect(familyCanPayPerYearCents({ familyIncomeCents: income, familyAssetsCents: saved })).toBe(income + saved / 4)
    // a family in debt can still enrol; it just cannot call the debt income
    expect(familyCanPayPerYearCents({ familyIncomeCents: 0, familyAssetsCents: -40_000_00 })).toBe(0)
  })

  // ⚠ THE FAMILY HERE IS THE MEASURED MIDDLE ONE ($31,531 a year in, nothing saved) ON A SINGLE J300
  // QUARTER-FINAL. Chosen over the working family on purpose, and the reason is a finding rather than
  // a convenience: at the working position the need layer pays its full 45%, which brings even the
  // $65,470 place inside reach. The family the dear place is actually beyond is the one just out of
  // Pell's range – which is `needShareByBackground.middle`'s old note read back on a real case.
  it('says plainly which places this family can pay for, and never refuses one', () => {
    const offer = collegeOfferFor(view({ j300: 7 }, 'middle', 'US', 0, 31_531_00, 0), rngFromSeed('middling'))
    const affordable = offer.quotes.map((q) => canAfford(offer, q))
    expect(affordable[0], 'the state place is within reach').toBe(true)
    // the dear one is not – and it is STILL on the table, at its own price, which is the owner's
    // ruling of 16.08. A family that cannot pay goes into debt, not away.
    expect(affordable[2], 'the private place is beyond this family').toBe(false)
    expect(offer.quotes[2].familyPerYearCents).toBeGreaterThan(0)
    // ⚠ `expect(offer.quotes[2].open).toBe(true)` STOOD HERE and the field is gone (round 26 #2,
    // second pass): a place that cannot be shut needs no boolean saying it is not. What survives is
    // the claim that mattered – it is quoted, at its own price, on the same list as the others.
    expect(offer.quotes.map((q) => q.tier), 'all three places, still').toEqual([...COLLEGE_TIER_ORDER])
  })

  // ⚠ THE UNMEASURED CASE. A career migrated from v51 was never asked this question, and the card
  // prints nothing rather than guessing.
  it('answers "never measured" rather than "she can pay nothing"', () => {
    const offer = collegeOfferFor(view({ j300: 3 }, 'middle', 'US'), rngFromSeed('migrated'))
    expect(canAfford({ ...offer, canPayPerYearCents: null }, offer.quotes[0])).toBeNull()
  })

  // ⚠⚠ ONE QUOTE PER TIER AND NOTHING PROFESSIONAL ANYWHERE IN THE SHAPE. The rule the owner deleted
  // on 16.08 – a tour result closing the college door – stays unrepresentable through the rebuild.
  it('carries no professional field on any quote', () => {
    const offer = collegeOfferFor(view({ j300: 0 }, 'middle', 'US', 4), rngFromSeed('shape'))
    for (const q of offer.quotes) {
      for (const k of Object.keys(q)) {
        expect(/rank|prize|wta|itf|w[0-9]|pro\b|earn/i.test(k), `${k} looks like a professional result`).toBe(false)
      }
    }
  })
})

// =================================================================================================
// ⭐⭐⭐ F. THE ODDS ON THE CARD ARE A MEASUREMENT, AND THIS IS WHAT KEEPS THEM ONE (round 21 #2)
// =================================================================================================
//
// `COLLEGE_TIER_ODDS` replaced `squad` on the fork card. The owner's requirement was not "put a
// number there" – it was that the number be MEASURED, with the run behind it, and REFRESHED WHEN THE
// TIERS MOVE. The first two are documentation and the third cannot be: a comment saying "re-run the
// probe if you re-tune this" is a comment, and the next agent to move a price will not read it.
//
// ⚠⚠ SO THE STALENESS IS MECHANICAL. This block recomputes the fingerprint of every input the odds
// were measured against and pins it. Move a sticker, a recruiting bar, a match count or a trip week
// and it goes red, naming the probe to re-run. It is the same discipline as the frozen MAIN capture:
// a documented measurement with a gate that notices when its subject moved underneath it.
//
// ⚠ IT DOES NOT ASSERT THE ODDS ARE RIGHT – nothing in a unit test can, the run takes five minutes.
// It asserts they are not silently describing a different game.
describe('F. the measured odds cannot go stale without a test noticing', () => {
  // ⚠⚠ RE-AIMED, NOT DELETED, AND THE RE-AIMING IS THE POINT (round 21, the development ruling).
  // The first version listed THREE NAMED FIELDS – price, recruiting bar, matches a week – and it was
  // measured blind: adding `coachesAt` and moving a place from `high` to `elite`, which is a large
  // change to what four years there develop, left this block GREEN. **A fingerprint over named fields
  // cannot see a field that did not exist when it was written**, which is exactly the input a future
  // phase is most likely to add. So it folds the WHOLE tier object now, keys sorted, and a new
  // property trips it on the day it appears.
  const fingerprint = () =>
    [
      ...COLLEGE_TIER_ORDER.map((t) => {
        const tier = COLLEGE_TIERS[t] as Record<string, unknown>
        const props = Object.keys(tier)
          .sort()
          .map((k) => `${k}=${String(tier[k])}`)
          .join(',')
        return `${t} ${props}`
      }),
      `trips ${COLLEGE_TRIP_WEEKS.join(',')}`,
    ].join(' · ')

  // ⭐⭐⭐⭐ ROUND 26 #2 MOVED THE PIN WITHOUT RE-MEASURING, AND THIS IS THE CASE THAT MAKES THAT
  // CLAIM CHECKABLE INSTEAD OF A COMMENT. `residentOnly` left `COLLEGE_TIERS` with the residence rule
  // (the owner: «в каждой стране есть домашний универ»), so the whole-object fold had to move – and
  // that property is the ONE thing in the fold `tools/college-return-probe.ts` never reads: the probe
  // takes each tier's quote BY NAME and walks four years plus four back on tour, and openness cannot
  // reach any of it. So 85 / 93 / 74 still describes this game.
  //
  // ⚠ THE ASSERTION IS THE DELTA, NOT THE STRING. Deleting the residence property from the round-21
  // pin must reproduce the round-26 pin EXACTLY – which is only true if nothing else moved. A wave
  // that quietly re-prices a place while claiming to have removed a boolean goes red here.
  it('⭐⭐⭐ the pin moved by exactly the residence property and by nothing else', () => {
    const withoutResidence = COLLEGE_ODDS_MEASURED_AT_BEFORE_HOME_RULING.replace(/,?residentOnly=(true|false)/g, '')
    expect(
      withoutResidence,
      'a probe input moved under cover of the residence deletion – re-run the probe',
    ).toBe(COLLEGE_ODDS_MEASURED_AT)
    // anti-vacuity: the old string really did carry the property, on all three rows
    expect(COLLEGE_ODDS_MEASURED_AT_BEFORE_HOME_RULING.match(/residentOnly=/g)).toHaveLength(3)
    expect(COLLEGE_ODDS_MEASURED_AT).not.toContain('residentOnly')
  })

  it('⭐⭐ pins the tier table the odds were measured against', () => {
    expect(
      fingerprint(),
      'A college tier input moved. `COLLEGE_TIER_ODDS` no longer describes this game – re-run ' +
        '`npx vite-node tools/college-return-probe.ts -- --seeds 6`, write the new figures and the new ' +
        'commit into `COLLEGE_TIER_ODDS`, update `docs/specs/the-college-answers-2026-08.md` §2, and ' +
        'move `COLLEGE_ODDS_MEASURED_AT` to the string this failure printed.',
    ).toBe(COLLEGE_ODDS_MEASURED_AT)
  })

  // ⚠ MUTATION PROOF, INLINE. A guard that cannot fail on the thing it guards is not a guard.
  //
  // ⚠⚠ AND THE PROPERTY IT NOW PROVES IS THE ONE THE OLD VERSION LACKED: **every property of every
  // place is inside the fold**, so a phase that adds a fourth axis cannot measure the odds against a
  // tier table the pin has never seen. The old proof mutated the PRICE, which the old fingerprint did
  // read – so it passed while being blind to everything else.
  it('⚠⚠ and every property of every place is inside the pin', () => {
    for (const t of COLLEGE_TIER_ORDER) {
      for (const [k, v] of Object.entries(COLLEGE_TIERS[t] as Record<string, unknown>)) {
        expect(fingerprint(), `${t}.${k} is not in the fingerprint`).toContain(`${k}=${String(v)}`)
      }
    }
    expect(fingerprint()).toContain(`trips ${COLLEGE_TRIP_WEEKS.join(',')}`)
    // a changed input is a changed string, so the pin above would go red
    expect(fingerprint().replace('coachesAt=high', 'coachesAt=elite')).not.toBe(COLLEGE_ODDS_MEASURED_AT)
  })

  // ⚠ AND THE THREE FIGURES ARE SHARES OF A HUNDRED CAREERS, not shares of one. A card printing
  // "Top 100 for 0.42 in 100" is the unit error this catches.
  it('states each place\'s odds as whole careers in a hundred', () => {
    for (const t of COLLEGE_TIER_ORDER) {
      const odds = COLLEGE_TIER_ODDS[t].top100In100
      expect(Number.isInteger(odds), `${t} is not a whole number of careers`).toBe(true)
      expect(odds).toBeGreaterThan(0)
      expect(odds).toBeLessThanOrEqual(100)
    }
  })
})
