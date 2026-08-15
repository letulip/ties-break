// ⭐⭐ THE PRINCIPLE: A SUPPORT MECHANISM MAY NOT PAY FOR THE COACH'S SEAT.
//
// THE OWNER, 15.08, and he raised it as a principle rather than as a bug report:
//
//   «Мы делали механизм точечной поддержки нуждающихся, этот механизм не должен поддерживать их
//    чрезмерные траты, только помочь дожить до призов. Вот что надо проконтролировать.»
//
// He was right, and it had been working backwards for a wave: `coachTravelFareFor` returned
// `travelCostFor`, which subtracts the academy scholarship and the brand's travel share – so the
// mechanism built to keep a struggling family in the game was buying the coach a plane ticket, and
// the better the scholarship the more of the luxury it funded. Commit `f9104eb` made his seat GROSS.
//
// ⚠⚠ WHY THIS FILE EXISTS AT ALL, GIVEN THAT THE FIX IS ONE LINE AND ALREADY HAS A TEST. Because the
// fix is the first half and the owner asked for the second: «вот что надо проконтролировать» is a
// standing property, not a patch. `tests/round21-coach-travel.test.ts` §1 pins the two covers we have
// TODAY, by name, on the site we noticed. A third one – a federation grant (already specced,
// docs/specs/federation-grant.md), a national-association travel fund, a hardship waiver – would ship
// past that test without touching it, and the leak would look exactly like the first one did.
//
// ⚠ SO THE CLAIM HERE IS STATED AGAINST A NUMBER NO COVER CAN TOUCH: **THE CALENDAR'S OWN PRINTED
// FARE.** `event.travelCostCents` is drawn once when the season is built and nothing in the game
// reduces it; every cover in the engine – present or future – can only ever REDUCE what somebody
// pays. So "his seat costs exactly the printed price, or he is not going" is a property that a cover
// invented tomorrow breaks by existing, whatever it is called and wherever it is wired. That is the
// difference between this file and a longer list of `expect(academy)` lines.
//
// ⚠ AND THE SECOND LEAK PATH IS THE TILL, NOT THE PRICE. A cover that never touches `travelCostFor`
// could still hand the money back – credit the fare to `academy.coveredCents`, refund a share into
// `fundsCents`, write a rebate row. §3 holds the ledger to the same principle: exactly the gross fare
// leaves, and no cover's tally moves when it does.
//
// ⚠ MUTATION-VERIFIED, and this is the mutation to re-run when touching any of it: put the cover back
// on his seat – `return travelCostFor(world, event)` in `coachTravelFareFor` – and §1, §2 and §3 all
// go red while `tests/round21-coach-travel.test.ts`'s default-side arms stay green. Weaker variants
// were tried and rejected for being green under it: asserting the fare merely "does not change when
// the academy is removed" passes for a world with no academy, and asserting a fixed cents figure
// passes for the wrong reason the day the calendar is re-priced.
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  setCoachOnEventWeeks,
  setCoachOnJuniorEvents,
  coachTravelFareFor,
  travelCostFor,
  type WorldState,
} from '../src/engine/world'
// ⚠ FROM THEIR OWN MODULE: `world.ts` imports these but does not re-export them, and widening a
// public surface for a test would be the tail wagging the dog.
import { academyCoverOf, chargeCoachTravel, chargeTravel } from '../src/engine/world/sponsors'
import { kitTermsFor } from '../src/engine/offers'
import { TIERS } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type Offer } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'

// -------------------------------------------------------------------------------------------------
// EVERY SUPPORT STATE THE GAME CAN BE IN – the enumeration is for NON-VACUITY, never for the claim.
//
// The claim (§1) is about the calendar's printed price and does not know these names; this list is
// what proves the covers are actually LIVE in the worlds the claim is asserted on. A world where the
// scholarship happens to be doing nothing would make every assertion below pass for free.
// -------------------------------------------------------------------------------------------------

/** A signed brand deal at the one rung that pays a share of the airfare (`global`). */
function travelBrandDeal(week: number): Offer {
  const terms = kitTermsFor({ nationalRank: 1, itfRank: 1, itfRanked: true, wtaRank: 1, wtaRanked: true }, 'global')!
  expect(terms.travelShare, 'the fixture rung really does pay for travel').toBeGreaterThan(0)
  return {
    id: 'kit-travel-share',
    kind: 'kit',
    week,
    deadlineWeek: week + 4,
    state: 'signed',
    terms,
    decidedWeek: week,
    fromWeek: week,
    untilWeek: week + 200,
  }
}

interface Support {
  name: string
  apply: (world: WorldState) => void
  /** does this state actually reduce her fare? (`none` is the control and does not) */
  reduces: boolean
}

const SUPPORTS: Support[] = [
  { name: 'no support at all', apply: () => {}, reduces: false },
  {
    name: 'academy scholarship, mid level',
    apply: (w) => void (w.academy = { level: 0.5, sinceWeek: 0, seasonIndex: 0, coveredCents: 0 }),
    reduces: true,
  },
  {
    name: 'academy scholarship, FULL level',
    apply: (w) => void (w.academy = { level: 1, sinceWeek: 0, seasonIndex: 0, coveredCents: 0 }),
    reduces: true,
  },
  { name: 'a brand paying a share of the airfare', apply: (w) => w.offers.push(travelBrandDeal(w.week)), reduces: true },
  {
    name: 'BOTH – the scholarship and the brand, composing',
    apply: (w) => {
      w.academy = { level: 0.8, sinceWeek: 0, seasonIndex: 0, coveredCents: 0 }
      w.offers.push(travelBrandDeal(w.week))
    },
    reduces: true,
  },
]

/** A real career with somebody to send and the coach travelling, in the given support state. */
function supported(support: Support, opts: { juniors?: boolean } = {}): WorldState {
  const world = createWorld(`support-${support.name}`, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  expect(world.coachId, 'the fixture must actually employ somebody').not.toBeNull()
  setCoachOnEventWeeks(world, true)
  if (opts.juniors) setCoachOnJuniorEvents(world, true)
  support.apply(world)
  return world
}

/** The trips on this calendar with a fare worth reducing. */
function realTrips(world: WorldState): SeasonEvent[] {
  return world.season.filter((e) => e.travelCostCents > 0)
}

// =================================================================================================
// 1. THE PRICE – his seat is the calendar's own number, in every support state that exists
// =================================================================================================

describe('§1 no support stream reduces the coach\'s fare', () => {
  for (const support of SUPPORTS) {
    it(`⭐ with ${support.name}: his seat is the printed fare, or he is not on the trip`, () => {
      const world = supported(support)
      const trips = realTrips(world)
      expect(trips.length, 'the calendar has trips at all').toBeGreaterThan(0)

      let charged = 0
      for (const e of trips) {
        const his = coachTravelFareFor(world, e)
        // ⚠ THE WHOLE PRINCIPLE, IN ONE LINE, AND IT NAMES NO COVER. Either he is not going (the
        // rung's own gate) or the seat costs what the calendar prints. Any cover that ever reaches
        // this number – one that exists today, one that ships next month – makes it smaller.
        expect(his === 0 || his === e.travelCostCents, `event ${e.id} (${e.tier}): fare ${his} of ${e.travelCostCents}`).toBe(true)
        if (his > 0) charged++
      }
      expect(charged, 'and he IS on some of them – a fare of zero everywhere would prove nothing').toBeGreaterThan(0)
    })
  }

  it('⚠ ...AND THE COVERS ARE LIVE IN THOSE VERY WORLDS – the non-vacuity arm', () => {
    // Without this, §1 is satisfied by a game whose support mechanisms do nothing at all. HER fare
    // must move in exactly the states that claim to move it, and stay put in the control.
    for (const support of SUPPORTS) {
      const world = supported(support)
      const trips = realTrips(world)
      const reduced = trips.filter((e) => travelCostFor(world, e) < e.travelCostCents)
      if (support.reduces) {
        expect(reduced.length, `${support.name}: her own fare is discounted`).toBe(trips.length)
      } else {
        expect(reduced.length, `${support.name}: the control pays full price`).toBe(0)
      }
    }
  })

  it('⭐ so the better her scholarship, the LARGER the share of the trip the second seat is', () => {
    // The consequence the owner wanted and the one the screen now has to say out loud: the discount
    // stops scaling with the luxury. Read as a monotone property over the ladder rather than as a
    // figure, so it survives any re-pricing of `ECONOMY.academy.travelCover`.
    const levels = [0, 0.25, 0.5, 0.75, 1]
    let previousShare = -1
    for (const level of levels) {
      const world = supported(SUPPORTS[0])
      if (level > 0) world.academy = { level, sinceWeek: 0, seasonIndex: 0, coveredCents: 0 }
      const trip = realTrips(world).find((e) => coachTravelFareFor(world, e) > 0)!
      expect(trip, 'a trip he is on').toBeTruthy()
      const his = coachTravelFareFor(world, trip)
      const hers = travelCostFor(world, trip)
      const share = his / (his + hers)
      expect(share, `level ${level}`).toBeGreaterThan(previousShare)
      previousShare = share
    }
    // ...and at the top of the ladder the trip is very nearly his seat alone.
    expect(previousShare, 'a fully covered girl travels almost free; her coach never does').toBeGreaterThan(0.6)
  })
})

// =================================================================================================
// 2. ...AND THE SAME AT THE RUNGS THE PLAYER OPENED HIMSELF (v49)
// =================================================================================================

describe('§2 opening junior travel does not open a door for the support either', () => {
  it('a junior fare bought by the player is ALSO the printed price, under every cover', () => {
    // ⚠ THE REASON THIS ARM EXISTS. v49 lets the player buy the rungs that pay her nothing, and those
    // are exactly the rungs a struggling family's scholarship is most likely to be covering. If a
    // cover leaked anywhere, this is where it would do the most damage: the support would be paying
    // for presence at events with no prize money at the end of them, which is «поддерживать их
    // чрезмерные траты» in its purest form.
    for (const support of SUPPORTS) {
      const world = supported(support, { juniors: true })
      const juniors = realTrips(world).filter((e) => TIERS[e.tier].prizeCents === undefined)
      expect(juniors.length, 'the calendar has junior rungs').toBeGreaterThan(0)
      for (const e of juniors) {
        expect(coachTravelFareFor(world, e), `${support.name} @ ${e.id}`).toBe(e.travelCostCents)
        if (support.reduces) {
          expect(travelCostFor(world, e), `${support.name} @ ${e.id}: hers is still covered`).toBeLessThan(e.travelCostCents)
        }
      }
    }
  })
})

// =================================================================================================
// 3. THE TILL – the money that leaves, and the tallies that must not move
// =================================================================================================

describe('§3 the ledger keeps the principle too', () => {
  it('⭐ exactly the gross fare leaves the family, whatever support she holds', () => {
    for (const support of SUPPORTS) {
      const world = supported(support)
      const trip = realTrips(world).find((e) => coachTravelFareFor(world, e) > 0)!
      const before = world.fundsCents
      chargeCoachTravel(world, trip)
      expect(before - world.fundsCents, `${support.name}: the till charges the printed fare`).toBe(trip.travelCostCents)
      const row = world.events.filter((e) => e.category === 'travel' && /coach/i.test(e.text))
      expect(row, `${support.name}: one line, its own`).toHaveLength(1)
      expect(row[0].amountCents, `${support.name}: and the line says the same number`).toBe(-trip.travelCostCents)
    }
  })

  it('⭐⭐ AND NO COVER\'S OWN TALLY MOVES WHEN IT IS CHARGED – `academyCoverOf`\'s ledger included', () => {
    // ⚠ THE OTHER LEAK PATH, and it would never show up in the price. `chargeTravel` credits
    // `world.academy.coveredCents` with what the scholarship took off HER fare – that is the number
    // the academy screen reports as the value of her support. A future "the academy helps with the
    // coach's travel too" would most naturally be written as a credit HERE rather than as a discount
    // in `travelCostFor`, and §1 would not see it.
    const world = supported(SUPPORTS[1])
    const trip = realTrips(world).find((e) => coachTravelFareFor(world, e) > 0)!
    const tallyBefore = world.academy!.coveredCents

    chargeCoachTravel(world, trip)
    expect(world.academy!.coveredCents, 'the scholarship did not pay for the second seat').toBe(tallyBefore)

    // ...and the same charge on HER seat DOES move it, so the assertion above is about the coach's
    // fare rather than about a tally nothing ever touches.
    chargeTravel(world, trip)
    expect(world.academy!.coveredCents, 'her own fare is what the scholarship is credited with').toBe(
      tallyBefore + academyCoverOf(world, trip),
    )
    expect(academyCoverOf(world, trip), 'and that credit is real money').toBeGreaterThan(0)
  })

  it('a whole booked season adds up to the printed fares and to nothing less', () => {
    // The end-to-end form of §1: charge every trip he is on, in a world holding both covers, and the
    // family is out exactly the calendar's own total. One arithmetic identity over a season, so a
    // cover that reduced one rung in ten would still be caught.
    const world = supported(SUPPORTS[4], { juniors: true })
    const trips = realTrips(world).filter((e) => coachTravelFareFor(world, e) > 0)
    expect(trips.length, 'he is on a real season of trips').toBeGreaterThan(4)
    const printed = trips.reduce((sum, e) => sum + e.travelCostCents, 0)
    const before = world.fundsCents
    for (const e of trips) chargeCoachTravel(world, e)
    expect(before - world.fundsCents, 'the season of second seats, at list price').toBe(printed)
    // ...while HER own season over the same trips is genuinely cheaper, which is the mechanism doing
    // its job: it kept the family in the game and it did not fund the entourage.
    const hers = trips.reduce((sum, e) => sum + travelCostFor(world, e), 0)
    expect(hers, 'the support is still supporting her').toBeLessThan(printed)
  })
})
