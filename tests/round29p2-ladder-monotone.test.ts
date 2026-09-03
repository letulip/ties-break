// ⭐⭐⭐ ROUND 29 PART TWO #5 – A RUNG ABOVE MUST BE AT LEAST AS GOOD AS THE RUNG BELOW IT.
//
// THE OWNER'S RULING, on the `global`-dominated-by-`tour` defect: «мировые топы должны иметь все
// возможности достучаться до топовой спортсменки.» ⚠ Its TERMS, not its gate.
//
// ⚠⚠ THIS IS WRITTEN AS A PROPERTY OVER THE WHOLE LADDER AND NOT AS A CASE ABOUT `global`, WHICH IS
// THE POINT OF IT. `global` paid less than `tour` for twenty-eight days and nothing in the repo
// objected, because there was no place where the ordering's own promise was written down as an
// assertion. `windowLadder`'s header states it in prose – «strongest-first makes signing on sight
// always safe and waiting always optional» – and prose does not fail a build. A case about `global`
// would go green the moment `global` was fixed and would say nothing about the next rung somebody
// inserts.
//
// ⚠ AND IT IS NOT A SOURCE PIN. It reads the shipped catalogues through the SAME functions the
// engine reads them through (`kitTermsFor`, `adTermsFor`), so a rung that is fixed in `ECONOMY` and
// dropped on the floor in `kitTermsFor` – which is exactly how `global`'s cash could have been
// half-shipped – fails here.
//
// ⚠ THE OBLIGATION TERMS ARE EXCLUDED FROM THE BENEFIT PROPERTY AND ASSERTED SEPARATELY, DELIBERATELY.
// `minEventsPerSeason` gets WORSE as the deal gets better and that is a design the ladder is proud
// of («the coach's job is load management … a bigger cheque is a bigger standing bribe to do the
// thing that loses»), and `seasons` gets LONGER. Folding either into "at least as good" would make
// the property fail on the shipped, correct ladder; leaving them unasserted would make the exclusion
// a hole. So each is pinned in its own direction, with its own reason.
import { describe, it, expect } from 'vitest'
import { SPONSOR_TIERS, adBandFor, adTermsForCategory, kitTermsFor, rungStrength } from '../src/engine/offers'
import { ECONOMY } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import type { KitOfferTerms, SponsorTier } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

/** A standing that clears EVERY rung, so `kitTermsFor(standing, tier)` can be asked for each of them
 *  in turn without the gate deciding the answer. `kitTermsFor` takes the tier as an argument for
 *  exactly this reason (the window raises a letter per rung), so nothing here is a back door. */
const clearsEverything = {
  nationalRank: 1,
  itfRank: 1,
  itfRanked: true,
  wtaRank: 1,
  wtaRanked: true,
}

/** WHERE A RESULT BONUS STARTS BITING, as a position on the tournament ladder – so «reaches further
 *  down» is a comparison rather than a table. A rung with no bonus at all sits past the end. */
const bonusReach = (t: TierId | undefined): number =>
  t === undefined ? Number.POSITIVE_INFINITY : Object.keys(TIERS).indexOf(t)

/** EVERY WAY A KIT RUNG PAYS HER, each as "more is better", read off the terms the engine issues. */
function kitBenefits(tier: SponsorTier) {
  const t = kitTermsFor(clearsEverything, tier) as KitOfferTerms
  return {
    kitAllowanceCents: t.kitAllowanceCents,
    freshCap: t.freshCap,
    linesCovered: t.covers.length,
    travelShare: t.travelShare,
    retainerCents: t.retainerCents ?? 0,
    appearanceFeeCents: t.appearanceFeeCents ?? 0,
    bonusShare: t.bonusShare ?? 0,
    /** negated so that "bigger is better" holds for this one too: a bonus that reaches down to w50
     *  is worth more than one that starts at w75. */
    bonusReachNeg: -bonusReach(t.bonusFromTier),
  }
}

describe('⭐⭐ the kit ladder is monotone in what it PAYS – round 29 part two #5', () => {
  it('every rung is at least as good as the one below it, on every term that pays her', () => {
    for (let i = 1; i < SPONSOR_TIERS.length; i++) {
      const hi = SPONSOR_TIERS[i]
      const lo = SPONSOR_TIERS[i - 1]
      const a = kitBenefits(hi)
      const b = kitBenefits(lo)
      for (const key of Object.keys(a) as (keyof typeof a)[]) {
        expect(
          a[key],
          `${hi} is presented ABOVE ${lo} and pays LESS on ${key} (${a[key]} against ${b[key]})`,
        ).toBeGreaterThanOrEqual(b[key])
      }
    }
  })

  it('...and it genuinely IMPROVES somewhere on every step, so no rung is pure ceremony', () => {
    // The other half of "at least as good": a rung that matched the one below it on every single
    // axis would satisfy the property above and still be a letter with nothing to offer.
    for (let i = 1; i < SPONSOR_TIERS.length; i++) {
      const hi = SPONSOR_TIERS[i]
      const lo = SPONSOR_TIERS[i - 1]
      const a = kitBenefits(hi)
      const b = kitBenefits(lo)
      const better = (Object.keys(a) as (keyof typeof a)[]).filter((k) => a[k] > b[k])
      expect(better.length, `${hi} pays exactly what ${lo} pays, on every term`).toBeGreaterThan(0)
    }
  })

  it('⚠ THE DEFECT ITSELF, NAMED – global against tour, which is where the ruling came from', () => {
    // The property above is the guard; this is the record. Kept as its own arm so a reader who
    // greps for the reported bug finds it, and so the two numbers the owner's ruling actually moved
    // are pinned as the values they were given rather than only as an inequality.
    const global = kitBenefits('global')
    const tour = kitBenefits('tour')
    expect(rungStrength('global')).toBeGreaterThan(rungStrength('tour'))
    // What it had and what it lacked: same kit, same fares, no retainer, no bonus.
    expect(global.kitAllowanceCents).toBe(tour.kitAllowanceCents)
    expect(global.travelShare).toBe(tour.travelShare)
    // ...and what the ruling gave it. The retainer is the top of act2-pro-tour.md §7's own
    // «~$3-8k/yr» band where `tour` takes the middle, so it is strictly better and not merely equal.
    expect(ECONOMY.sponsorship.global.retainerCents).toBe(2_000_00)
    expect(global.retainerCents).toBeGreaterThan(tour.retainerCents)
    expect(ECONOMY.sponsorship.global.retainerCents * 4).toBe(8_000_00)
    // The bonus is tour's verbatim – a fourth value between 20% and premium's 25% would be a number
    // invented to fill a gap the design does not have.
    expect(global.bonusShare).toBe(tour.bonusShare)
    expect(global.bonusReachNeg).toBe(tour.bonusReachNeg)
  })

  it('⚠ the obligation terms move the OTHER way, and that is the design – asserted, not skipped', () => {
    // Excluded from the benefit property above because a bigger deal deliberately ASKS more. Pinned
    // here so the exclusion is a decision with a test rather than a hole.
    const events = SPONSOR_TIERS.map((t) => (kitTermsFor(clearsEverything, t) as KitOfferTerms).minEventsPerSeason)
    const seasons = SPONSOR_TIERS.map((t) => (kitTermsFor(clearsEverything, t) as KitOfferTerms).seasons)

    // THE TERM LENGTH IS MONOTONE, and it is the one obligation that is: 1 -> 2 -> 2 -> 3 -> 3 -> 4,
    // «a term longer than a season is what gives ONE BRAND AT A TIME its bite».
    for (let i = 1; i < seasons.length; i++) {
      expect(seasons[i], `${SPONSOR_TIERS[i]} runs SHORTER than ${SPONSOR_TIERS[i - 1]}`).toBeGreaterThanOrEqual(
        seasons[i - 1],
      )
    }

    // ⚠⚠ THE EVENTS OBLIGATION IS **NOT** MONOTONE, AND THIS ARM FOUND THAT RATHER THAN ASSUMED IT.
    //   The shipped sequence read through this standing is 8 / 10 / 14 / 12 / 16 / 16 (the local
    //   shop's two figures differ by her domestic rank and `clearsEverything` is #1 at home, so it
    //   is the `topMinEvents` arm) – `tour` asks 14 and `global`, one rung
    //   ABOVE it, asks 12. Both rungs' own comments read «the step of two» off an order in which
    //   global comes fourth and tour fifth, which is not the order `SPONSOR_TIERS` actually has: it
    //   is the SAME artefact of `tour` being inserted between the junior-era rungs that produced the
    //   defect item #5 is about.
    //
    //   ⚠ IT IS LEFT ALONE, DELIBERATELY, AND FLAGGED RATHER THAN FIXED. An obligation that FALLS as
    //   the rung improves is the player-favourable direction – global asks two events fewer than the
    //   rung below it – so it is not a domination and not the defect the owner ruled on. Changing it
    //   would be a balance decision (it makes a deal harder to keep) and balance decisions are his.
    //   Pinned as literals so the inversion cannot be "tidied" into a real domination by accident.
    expect(events).toEqual([8, 10, 14, 12, 16, 16])

    // ⚠ AND THE ONE PLACE THE STEP OF TWO STOPS IS `icon`, ON PURPOSE – its own comment: «the trap
    // this block is proud of stays a trap right up to the rung where it would stop being one».
    expect(ECONOMY.sponsorship.icon.minEvents).toBe(ECONOMY.sponsorship.premium.minEvents)
  })
})

// ⚠⚠ RE-AIMED BY ROUND 29 PART FOUR P6/§8, NOT DELETED: the two describes below WERE the
// three-rung ad ladder's monotone property and its strongest-house gate. The owner replaced the
// ladder with the CATEGORY PORTFOLIO (one deal per category, the cheque the only axis that
// scales), so the same disciplines are restated on the new shape: the BANDS gate harder and ask
// more as they rise, every category's cheque is monotone up the bands and lands inside §8's own
// ranges, and the anchor cell is untouched to the cent.
describe('⭐ the ADVERTISING gradient is monotone – round 29 part four P6/§8', () => {
  const BANDS = ECONOMY.advertising.bands
  const CATS = Object.keys(ECONOMY.advertising.categories) as (keyof typeof ECONOMY.advertising.categories)[]
  /** §8's table, verbatim – his ranges, the in-band pin every cell must land inside.
   *
   *  ⚠⚠ RE-AIMED BY ROUND 34 #7/#11/#12/#13 (03.09) AND ONLY THE TWO ROWS BELOW THE TOP 100 MOVED.
   *  The owner ruled the foot of the ladder broken («129 место в мире, тот же контракт на 12к в год
   *  на 3 года. Не верю») and approved a new ≤400 band worth $200,000 a year across the shelf plus a
   *  tenfold lift of the ≤200 band to $450,000. The three rows above them are §8's, untouched, on
   *  his explicit ruling «Про 50–100 отвечаю прямо: пересматривать не надо». */
  const RANGE_BY_BAND: [number, number][] = [
    [80_000_00, 120_000_00],
    [50_000_00, 200_000_00],
    [100_000_00, 500_000_00],
    [300_000_00, 1_000_000_00],
    [1_000_000_00, 2_500_000_00],
  ]

  it('the bands gate harder and never ask less as they rise', () => {
    for (let i = 1; i < BANDS.length; i++) {
      expect(BANDS[i].maxWtaRank, `band ${i} is not a harder gate`).toBeLessThan(BANDS[i - 1].maxWtaRank)
      expect(BANDS[i].shootWeeksPerYear).toBeGreaterThanOrEqual(BANDS[i - 1].shootWeeksPerYear)
    }
    // ...and the gates are the kit ladder's own cuts, his Bublik line and round 34's film anchor.
    // ⚠ 200 / 50 / 10 are STILL `tour` / `premium` / `icon`'s own `maxWtaRank`, read and not
    // imported; 100 is his «Это доход у топ-100»; 400 is round 34's, and is the one gate here that
    // is not a kit cut – it reaches past the world #240 his film anchor is about.
    expect(BANDS.map((b) => b.maxWtaRank)).toEqual([400, 200, 100, 50, 10])
    const S = ECONOMY.sponsorship
    expect([S.tour.maxWtaRank, S.premium.maxWtaRank, S.icon.maxWtaRank], 'the kit cuts are unmoved')
      .toEqual([200, 50, 10])
  })

  it('⭐⭐ every cheque lands inside §8`s own range for its band, and rises up the bands', () => {
    for (const c of CATS) {
      const fees = ECONOMY.advertising.categories[c].feeCentsByBand
      expect(fees).toHaveLength(BANDS.length)
      let last: number | null = null
      let opened = false
      for (let i = 0; i < fees.length; i++) {
        const fee = fees[i]
        if (fee === null) {
          // a category opens once and stays open – a null above a priced cell would be a slot that
          // slams shut as she climbs, which no portfolio does
          expect(opened, `${c}: a closed cell above an open one`).toBe(false)
          continue
        }
        opened = true
        const [lo, hi] = RANGE_BY_BAND[i]
        expect(fee, `${c}@band${i} under his floor`).toBeGreaterThanOrEqual(lo)
        expect(fee, `${c}@band${i} over his ceiling`).toBeLessThanOrEqual(hi)
        // ⚠⚠ THE PER-CATEGORY CLIMB IS ASSERTED FROM THE ≤100 BAND UP, AND ROUND 34 IS WHY. It used
        // to run from band 0, because every category's own cheque rose with every rung. The owner's
        // approved foot does not: clothing pays $120,000 at ≤400 against $50,000 at ≤200, drinks pays
        // $80,000 at both, and the tenfold lift put watches at $200,000 at ≤200 as well as at ≤100.
        // What he approved is the BAND TOTAL and the shape of the shelf, not one category's own
        // climb – the totals are pinned whole in the arm below this one, and every cell that sits
        // level or lower than the band beneath it is pinned BY NAME in the arm after that, so a
        // third one cannot appear without reddening something. Above ≤200, where he ruled nothing
        // was to be touched, the old claim holds exactly as it did.
        if (last !== null && i > 2) expect(fee, `${c}: the cheque fell up the ladder`).toBeGreaterThan(last)
        last = fee
      }
      expect(opened, `${c}: a category no band ever opens`).toBe(true)
    }
  })

  it('⚠⚠ ROUND 34 – exactly these cells do not climb, and no others', () => {
    // The three places the owner's approved foot leaves a category level or lower than the band
    // below it. Listed rather than described, so a fourth is a red test and not a discovery.
    const flat: string[] = []
    for (const c of CATS) {
      const fees = ECONOMY.advertising.categories[c].feeCentsByBand
      for (let i = 1; i < fees.length; i++) {
        const here = fees[i]
        const below = fees[i - 1]
        if (here === null || below === null) continue
        if (here <= below) flat.push(`${c}@${i}`)
      }
    }
    expect(flat.sort()).toEqual(['clothing@1', 'drinks@1', 'watches@2'])
  })

  it('⭐⭐⭐ ROUND 34 – THE BAND TOTALS ARE THE OWNER`S OWN TABLE, generated from ECONOMY', () => {
    // ⚠⚠ THIS ARM IS THE ONE THE APPROVED FIGURES LIVE IN, and it is generated rather than typed:
    // the shelf's total per contract year at each band, all categories signed. His table, verbatim
    // (docs/rounds/round-34.md, «APPROVED BY THE OWNER, 02.09.2026»), with the three rows above the
    // top 100 unchanged from round 29 part four §8.
    const totals = BANDS.map((_, band) =>
      CATS.reduce((sum, c) => sum + (ECONOMY.advertising.categories[c].feeCentsByBand[band] ?? 0), 0),
    )
    expect(totals, 'the five band totals, in cents a contract year').toEqual([
      200_000_00, // ≤400 – his film anchor: ~$5,000 a match under a patch at ~40 matches a year
      450_000_00, // ≤200 – the shipped $45,000 lifted tenfold
      1_100_000_00, // ≤100 – unchanged
      2_600_000_00, // ≤50 – unchanged
      9_200_000_00, // ≤10 – unchanged
    ])
    // ⚠ AND THE TWO CLIFFS THE CHANGE REMOVES, stated as arithmetic so they cannot come back: there
    // is money below #200 at all, and the step from the ≤200 shelf to the ≤100 one is no longer the
    // 24x jump on one ranking place he was reading.
    expect(totals[0], 'there is a shelf below #200 now').toBeGreaterThan(0)
    expect(totals[2] / totals[1], 'the #101 -> #100 step was 24x and is now under 3x').toBeLessThan(3)
    for (let i = 1; i < totals.length; i++) {
      expect(totals[i], `the shelf as a whole still climbs at band ${i}`).toBeGreaterThan(totals[i - 1])
    }
  })

  it('the terms the engine issues are the catalogue`s, cell by cell', () => {
    for (const c of CATS) {
      const def = ECONOMY.advertising.categories[c]
      for (let band = 0; band < BANDS.length; band++) {
        const fee = def.feeCentsByBand[band]
        const terms = adTermsForCategory(c, band, 2, def.houses[0] ?? 'Baseline Athletic')
        if (fee === null) {
          expect(terms, `${c}@band${band} issued terms for a closed cell`).toBeNull()
          continue
        }
        expect(terms!.category).toBe(c)
        expect(terms!.trade).toBe(def.trade)
        expect(terms!.cashCents).toBe(fee)
        expect(terms!.termYears).toBe(2)
        expect(terms!.termWeeks).toBe(104)
        expect(terms!.shootCount).toBe(BANDS[band].shootWeeksPerYear)
      }
    }
  })

  it('⭐ P6`s churn has names to churn: 2–4 houses per category, and clothing deliberately none', () => {
    for (const c of CATS) {
      const houses = ECONOMY.advertising.categories[c].houses
      if (c === 'clothing') {
        // the double programme: the live kit brand writes, so the category lists no houses of its own
        expect(houses).toHaveLength(0)
        continue
      }
      expect(houses.length, `${c}: one name is what the owner said the player would tire of`).toBeGreaterThanOrEqual(2)
      expect(houses.length).toBeLessThanOrEqual(4)
      expect(new Set(houses).size).toBe(houses.length)
    }
  })

  it('⚠⚠ ROUND 34 MOVED THE $20,000 ANCHOR, and this arm is where that is recorded', () => {
    // ⚠⚠ RE-AIMED, NOT DELETED. This arm read «$20,000 did not move – the gradient was built on top
    // of the shipped rung, not over it», and it was true through two resizes: round 29 part two #20
    // sized the watches cell at the ≤200 band and the research never contradicted it there.
    //
    // ROUND 34 #7/#11/#12/#13 (03.09) IS WHERE IT MOVES, and the owner moved it himself after
    // playing eleven seasons around the top 100: «в 18 лет предлагают подписать копеечные контракты
    // на 2 и 3 года», «129 место в мире, тот же контракт на 12к в год на 3 года. Не верю», «99 место
    // в мире, тот же контракт на 20к в год на 2 года». The cell is now $200,000 – the shipped figure
    // times ten, the whole ≤200 row lifted by the same factor so its SHAPE is preserved exactly.
    // ⚠ The band it sits at is unchanged: still ≤200, now at index 1 behind the new ≤400 rung.
    expect(ECONOMY.advertising.bands[1].maxWtaRank).toBe(200)
    expect(ECONOMY.advertising.categories.watches.feeCentsByBand[1]).toBe(200_000_00)
    expect(ECONOMY.advertising.categories.watches.houses).toContain('Quiet Hour')
    // ⭐ THE SHAPE OF THE ≤200 SHELF IS THE SHIPPED ONE, EXACTLY x10 – which is what makes this a
    // lift and not a re-derivation. Watches 20k, cars 12k, drinks 8k, clothing 5k, in that order.
    const row = (['watches', 'cars', 'drinks', 'clothing'] as const).map(
      (c) => ECONOMY.advertising.categories[c].feeCentsByBand[1]!,
    )
    expect(row).toEqual([200_000_00, 120_000_00, 80_000_00, 50_000_00])
    expect(row.map((c) => c / 10), 'the shipped row, to the cent').toEqual([20_000_00, 12_000_00, 8_000_00, 5_000_00])
    // ...and the new ≤400 rung is a kit patch and a drink, which is what the film he quoted shows.
    const open400 = CATS.filter((c) => ECONOMY.advertising.categories[c].feeCentsByBand[0] !== null)
    expect(open400.sort()).toEqual(['clothing', 'drinks'])
  })

  it('⭐⭐ the capstone is the roof: dearer than every cell, longer than every term, gated on tenure', () => {
    const cap = ECONOMY.advertising.capstone
    for (const c of CATS) {
      for (const fee of ECONOMY.advertising.categories[c].feeCentsByBand) {
        if (fee !== null) expect(cap.cashCents).toBeGreaterThan(fee)
      }
    }
    expect(cap.cashCents).toBe(10_000_000_00) // his sentence: «контракт с Nike на 10+ миллионов»
    expect(cap.termYears).toBe(8) // kit-shaped: «kit deals run 8–10 years» (off-court-money.md)
    expect(cap.termYears).toBeGreaterThan(ECONOMY.advertising.termYearsMax)
    expect(cap.seasonsInTop10).toBe(4) // the ruling: 4 seasons ENDED inside the top 10
  })
})

describe('⭐⭐ ...and the GATE picks the strongest band she clears, at every boundary', () => {
  // ⚠ THESE ARMS LIVE HERE, WITH THE CONSTANTS, AND NOT WITH THE WALKED CAREERS – AND THE REASON IS
  // A DEAD GUARD THAT WAS CAUGHT IN ITS OWN DRAFT (see this block's history): a fixture file that
  // THROWS when it cannot stand a career in a band collapses at collection with «no tests», so its
  // own assertion about the defect never runs. A pure-function arm in a file with no fixture cannot
  // be silenced that way.
  const at = (wtaRank: number) =>
    adBandFor({ nationalRank: 1, itfRank: 1, itfRanked: true, wtaRank, wtaRanked: true })

  it('an unranked standing is offered nothing at all – a floor tie is not a standing', () => {
    expect(adBandFor({ nationalRank: 1, itfRank: 1, itfRanked: true, wtaRank: 1, wtaRanked: false })).toBeNull()
  })

  it('⚠⚠ THE DEFECT #20 REPORTED, AS AN ASSERTION: a top-10 standing gets the top band`s cheques', () => {
    // ⚠ WALKED RATHER THAN LISTED SINCE ROUND 34 (03.09), because the ladder gained a fifth rung and
    // a hand-listed pair of literals per boundary is a list that has to be rewritten every time one
    // is added. Same claim, every boundary, whatever the ladder's length: the gate at a band's own
    // cut is that band, and one place outside it is the band below – or nothing at all, at the foot.
    const B = ECONOMY.advertising.bands
    for (let i = B.length - 1; i >= 0; i--) {
      expect(at(B[i].maxWtaRank), `#${B[i].maxWtaRank} stands in band ${i}`).toBe(i)
      expect(at(B[i].maxWtaRank + 1), `#${B[i].maxWtaRank + 1} does not`).toBe(i === 0 ? null : i - 1)
    }
    // ...and the fee that arrives with it, which is the number he was reading off the screen: the
    // world #21's watches cheque is written from the ≤50 band's cell, not the ≤200's.
    expect(adTermsForCategory('watches', at(21)!, 1)!.cashCents)
      .toBeGreaterThan(ECONOMY.advertising.categories.watches.feeCentsByBand[1]!)
  })
})
