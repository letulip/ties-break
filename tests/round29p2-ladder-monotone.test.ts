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
import { AD_TIERS, SPONSOR_TIERS, adRungFor, adTermsFor, kitTermsFor, rungStrength } from '../src/engine/offers'
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

describe('⭐ the ADVERTISING ladder is monotone too – round 29 part two #19/#20', () => {
  it('every house pays more and gates harder than the one below it', () => {
    for (let i = 1; i < AD_TIERS.length; i++) {
      const hi = ECONOMY.advertising.houses[AD_TIERS[i]]
      const lo = ECONOMY.advertising.houses[AD_TIERS[i - 1]]
      expect(hi.cashCents, `${AD_TIERS[i]} pays less than ${AD_TIERS[i - 1]}`).toBeGreaterThan(lo.cashCents)
      expect(hi.maxWtaRank, `${AD_TIERS[i]} is not a harder gate than ${AD_TIERS[i - 1]}`).toBeLessThan(lo.maxWtaRank)
      // ...and it asks MORE of her, which is this ladder's obligation direction: shoot weeks.
      expect(hi.shootWeeksPerTerm).toBeGreaterThan(lo.shootWeeksPerTerm)
    }
  })

  it('⚠ the plan`s annual cap is structural: one deal at a time x the biggest ask = six weeks', () => {
    // `the-face-and-the-court.md` §4a-1: «the sum of live deals must never exceed 6 shoot weeks a
    // year». Nothing enforces that as a rule, and nothing needs to: every term is exactly one year
    // and only one deal runs at a time, so the ceiling IS the biggest single house's ask.
    for (const t of AD_TIERS) expect(ECONOMY.advertising.houses[t].termWeeks).toBe(52)
    const most = Math.max(...AD_TIERS.map((t) => ECONOMY.advertising.houses[t].shootWeeksPerTerm))
    expect(most).toBe(6)
  })

  it('the terms the engine issues are the catalogue`s, house by house', () => {
    for (const t of AD_TIERS) {
      const h = ECONOMY.advertising.houses[t]
      const terms = adTermsFor(clearsEverything, t)!
      expect(terms.tier).toBe(t)
      expect(terms.brand).toBe(h.brand)
      expect(terms.trade).toBe(h.trade)
      expect(terms.cashCents).toBe(h.cashCents)
      expect(terms.termWeeks).toBe(h.termWeeks)
      expect(terms.shootCount).toBe(h.shootWeeksPerTerm)
    }
  })

  it('⭐ and $20,000 did not move – the ladder was built on top of the shipped rung, not over it', () => {
    // Round 29 part two #20's whole answer: the research (docs/research/off-court-money.md) does not
    // contradict the shipped fee at the band it was written for; it contradicts that fee still being
    // the only one eleven rungs later. A wave that "fixed" #20 by retuning this number would have
    // answered a question nobody asked.
    expect(ECONOMY.advertising.houses.watch.cashCents).toBe(20_000_00)
    expect(ECONOMY.advertising.houses.watch.maxWtaRank).toBe(200)
    expect(ECONOMY.advertising.houses.watch.shootWeeksPerTerm).toBe(2)
    expect(ECONOMY.advertising.houses.watch.brand).toBe('Quiet Hour')
  })
})

describe('⭐⭐ ...and the GATE picks the strongest house she clears, at every boundary', () => {
  // ⚠ THESE ARMS LIVE HERE, WITH THE CONSTANTS, AND NOT WITH THE WALKED CAREERS – AND THE REASON IS
  // A DEAD GUARD THAT WAS CAUGHT IN ITS OWN DRAFT. `tests/round29p2-ad-ladder.test.ts` builds three
  // real careers at module load and THROWS when it cannot stand one in the band it needs; mutating
  // `adRungFor` back to «always the bottom rung» – which is round 29 part two #20's whole defect –
  // made that file collapse at collection with «no tests», so its own assertion about the defect
  // never ran. A pure-function arm in a file with no fixture cannot be silenced that way.
  const at = (wtaRank: number) =>
    adRungFor({ nationalRank: 1, itfRank: 1, itfRanked: true, wtaRank, wtaRanked: true })
  const H = ECONOMY.advertising.houses

  it('an unranked standing is offered nothing at all – a floor tie is not a standing', () => {
    expect(adRungFor({ nationalRank: 1, itfRank: 1, itfRanked: true, wtaRank: 1, wtaRanked: false })).toBeNull()
    expect(adTermsFor({ nationalRank: 1, itfRank: 1, itfRanked: true, wtaRank: 1, wtaRanked: false })).toBeNull()
  })

  it('⚠⚠ THE DEFECT #20 REPORTED, AS AN ASSERTION: a top-10 standing gets the top-10 house', () => {
    expect(at(H.house.maxWtaRank)).toBe('house')
    expect(at(H.house.maxWtaRank + 1)).toBe('campaign')
    expect(at(H.campaign.maxWtaRank)).toBe('campaign')
    expect(at(H.campaign.maxWtaRank + 1)).toBe('watch')
    expect(at(H.watch.maxWtaRank)).toBe('watch')
    expect(at(H.watch.maxWtaRank + 1)).toBeNull()
    // ...and the fee that arrives with it, which is the number he was reading off the screen.
    expect(adTermsFor({ nationalRank: 1, itfRank: 1, itfRanked: true, wtaRank: 21, wtaRanked: true })!.cashCents)
      .toBeGreaterThan(H.watch.cashCents)
  })
})
