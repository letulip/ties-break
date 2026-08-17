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
// ⚠⚠ AMENDED 17.08, AND THE AMENDMENT IS A NARROWING OF THE SUBJECT RATHER THAN A RELAXING OF THE
// CLAIM. The owner asked for the second seat to be paid for – in his own scoping, twice:
//
//   «про спонсоров и оплату доли поездки тренера я говорю только для профессиональной лиги и
//    контракте с большими спонсорами… На всех остальных ступенях развития ничего не меняем пока что.»
//
// The word this file turned out to be using loosely is SUPPORT. Its original enumeration put an
// academy scholarship and a signed brand contract in one list and asserted the same thing about both,
// because on 15.08 both were leaking into the same number and the fix was one line. They are not the
// same instrument, and the difference is precisely the one the owner's ruling of 15.08 turns on:
//
//   * A SCHOLARSHIP is gated on NEED. It is granted, it is charity, and «этот механизм не должен
//     поддерживать их чрезмерные траты» is about it. It may not buy the entourage a plane ticket.
//   * A CONTRACT is gated on STANDING. It is earned, it is the brand's own money, and a brand that
//     is already flying her is a brand that can be asked about the second seat.
//
// So §1 keeps its claim word for word and applies it to the NEEDS-BASED streams, which is what it was
// always about; the contract arms move to §4, where the claim is not "nothing touches this number"
// but the stronger, quantified «exactly one thing does, by exactly its published share, and nothing
// else». §4 is also the two-way guard the amendment needs: a deal with no scholarship pays the share,
// a scholarship with no deal pays the printed price, and the scholarship's own tally never moves
// either way. A leak of the old kind – the academy reaching his seat – still goes red in §1.
//
// ⚠ AND THE SHARE IS THE DEAL'S OWN `travelShare`, WHICH IS THE OWNER'S SECOND RULING OF THE DAY. The
// first build gave the coach a flat term of his own; he refused the machinery – «может быть нам не
// надо лишней логики делать, а стоит просто стоимость поездки на 2 умножать… тогда у нас не будет
// этого слоя противоречивой логики нигде» – and he was right on the measurement as well as the
// principle: the separate term produced identical fares to this rule for every family without a
// scholarship, because `global`'s own share is 25% and the flat term was 25%. What his literal
// proposal (double the NET fare) would have done is let the scholarship pay for the coach again –
// $193k of it over one measured calendar – which is why the rule is "the SPONSOR's share on both
// seats" and not "her price, doubled". That distinction is this file's whole subject and §4 pins it.
//
// ⚠ WHAT WOULD MAKE THIS AMENDMENT WRONG, stated so a later reader can check it rather than trust it:
// if `coachTravelFareFor` ever came to depend on the family being POOR – on `academy`, on a hardship
// flag, on funds – then the narrowing above would be a fig leaf and the 15.08 ruling would be broken
// again. §4's `both` arm is aimed exactly there: it holds a full scholarship AND a contract and pins
// the reduction to the contract's share alone.
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
// on his seat – `return travelCostFor(world, event)` in `coachTravelFareFor` – and §1, §2, §3 AND §4
// all go red while `tests/round21-coach-travel.test.ts`'s default-side arms stay green. §4 goes red
// under it too, which is the point of pinning exact figures there: the mutation makes his seat
// CHEAPER than the contract's term, and an inequality-shaped claim would have called that a pass.
// Weaker variants
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
import { kitTermsFor, kitTravelShare } from '../src/engine/offers'
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

/** ⭐⭐ THE NEEDS-BASED STREAMS – the ones §1's claim is about, and the ones the 15.08 ruling names.
 *
 *  ⚠ THE BRAND DEAL USED TO BE IN THIS LIST AND WAS MOVED OUT ON 17.08, which is the one change a
 *  reader should be suspicious of, so here is the reason in the place they will look. It is not that
 *  the contract stopped being checked - `CONTRACTS` below is checked harder, against an exact figure
 *  rather than against an inequality. It is that this list is the answer to "what is a mechanism of
 *  targeted support for a family in need", and a brand paying a girl to wear its shoes has never been
 *  one. Gated on need, granted, revocable when the need ends; against gated on standing, earned, and
 *  the brand's own money. `f9104eb`'s bug lived in the first kind and §1 still holds every inch of it. */
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
]
const NO_SUPPORT = SUPPORTS[0]
const ACADEMY_MID = SUPPORTS[1]
const ACADEMY_FULL = SUPPORTS[2]

/** ⭐⭐ THE CONTRACT STREAMS – §4's subject, and the one thing in the game that may reach his seat. */
const CONTRACTS: Support[] = [
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
const BRAND_ONLY = CONTRACTS[0]
const BRAND_AND_SCHOLARSHIP = CONTRACTS[1]

/** Every state the game can be in, support and contract alike. The loop for the claims that must hold
 *  in ALL of them – §2's junior rungs, where NOTHING may reach his seat whatever the family holds. */
const ALL_STATES: Support[] = [...SUPPORTS, ...CONTRACTS]

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

describe('§1 no NEEDS-BASED support stream reduces the coach\'s fare', () => {
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
    //
    // ⚠ OVER **ALL** STATES, not just §1's. The contract arms are asserted here too so that §4 rests
    // on the same proof of liveness: a `travelBrandDeal` that had quietly stopped covering anything
    // would make §4's exact-figure arms pass for the wrong reason.
    for (const support of ALL_STATES) {
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
      const world = supported(NO_SUPPORT)
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

describe('§2 opening junior travel does not open a door for ANY cover, support or contract', () => {
  it('a junior fare bought by the player is ALSO the printed price, under every cover', () => {
    // ⚠ THE REASON THIS ARM EXISTS. v49 lets the player buy the rungs that pay her nothing, and those
    // are exactly the rungs a struggling family's scholarship is most likely to be covering. If a
    // cover leaked anywhere, this is where it would do the most damage: the support would be paying
    // for presence at events with no prize money at the end of them, which is «поддерживать их
    // чрезмерные траты» in its purest form.
    //
    // ⚠⚠ AND THIS IS THE ONE SECTION THE 17.08 AMENDMENT MADE **STRICTER** RATHER THAN NARROWER, which
    // is worth noticing because every other change that day went the other way. The contract may now
    // reach his seat - but only «для профессиональной лиги», the owner's own scope - so at the junior
    // rungs the claim "nothing reaches it" is still absolutely true, and it is now asserted over the
    // contract states too. A future hand that dropped the prize-money gate would go red HERE, and
    // nowhere else in the file, because §4 only ever looks at rungs that pay.
    for (const support of ALL_STATES) {
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
    const world = supported(ACADEMY_MID)
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
    // The end-to-end form of §1: charge every trip he is on, in a world holding the strongest support
    // the game can grant, and the family is out exactly the calendar's own total. One arithmetic
    // identity over a season, so a cover that reduced one rung in ten would still be caught.
    //
    // ⚠ A FULL SCHOLARSHIP AND NO CONTRACT, on purpose (17.08). It used to hold both, which after the
    // amendment would assert something false; §4's own season arm is the contract's half of this
    // identity and it is the exact same shape, so the pair still covers every trip on the calendar.
    const world = supported(ACADEMY_FULL, { juniors: true })
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

// =================================================================================================
// 4. THE ONE THING THAT MAY – a contract, by exactly its own published share, and nothing else
//
// ⚠⚠ THIS SECTION IS THE PRICE OF THE 17.08 AMENDMENT AND IT IS DELIBERATELY THE STRICTEST IN THE
// FILE. §1-§3 assert an inequality ("not less than the printed price"), which is the right shape for
// a claim about covers that must not exist. Once ONE cover legitimately exists, an inequality stops
// being enough: "his seat is cheaper than list" is satisfied by a scholarship leaking in, by a second
// term nobody meant to add, and by a rounding bug. So every arm here pins an EXACT figure computed
// from the deal's own term, and the two-way arms below are what make a leak visible rather than
// merely smaller.
// =================================================================================================

/** What the engine should charge for his seat, from the deal's own term. Written out rather than
 *  imported so that a change to the formula has to be made twice, deliberately.
 *
 *  ⚠ IT CARRIES THE PRIZE-MONEY GATE, and the first draft did not - which is how it earned its place
 *  here. Summed over a season with junior travel ON, a version that discounted every rung came out
 *  $21,573 under the till and went red. That is the scope claim doing real work: this figure can only
 *  match if the cover applied at exactly the rungs that pay and at none of the ones that do not. */
function expectedCoachFare(world: WorldState, event: SeasonEvent): number {
  if (TIERS[event.tier].prizeCents === undefined) return event.travelCostCents
  const share = kitTravelShare(world.offers, world.week)
  return event.travelCostCents - Math.round(event.travelCostCents * share)
}

describe('§4 a sponsor contract DOES reduce it – by its own share, at the rungs that pay', () => {
  it('⭐⭐ WITH NO SCHOLARSHIP THE TRIP COSTS EXACTLY DOUBLE – the owner\'s own model of the rule', () => {
    // ⚠ THIS IS THE HEADLINE ASSERTION OF THE WHOLE AMENDMENT, and it is the owner's sentence turned
    // into arithmetic: «стоит просто стоимость поездки на 2 умножать». One sponsor share, two seats -
    // so for a family whose only cover is a contract, the coach's seat costs precisely what hers
    // does, and the trip is her price twice. Nothing about "25%" appears here: the claim is the
    // IDENTITY of the two numbers, so it survives any re-pricing of the brand ladder.
    //
    // It is also the arm that would go red if anybody ever gave the coach a term of his own again.
    const world = supported(BRAND_ONLY)
    const paying = realTrips(world).filter((e) => TIERS[e.tier].prizeCents !== undefined)
    expect(paying.length, 'the calendar has rungs that pay').toBeGreaterThan(0)
    let covered = 0
    for (const e of paying) {
      const his = coachTravelFareFor(world, e)
      if (his === 0) continue
      expect(his, `${e.id}: his seat is hers`).toBe(travelCostFor(world, e))
      expect(his, `${e.id}: and it is the term, exactly`).toBe(expectedCoachFare(world, e))
      expect(his, `${e.id}: which is genuinely less than list`).toBeLessThan(e.travelCostCents)
      covered++
    }
    expect(covered, 'and he is really on some of them').toBeGreaterThan(0)
  })

  it('⭐⭐ THE TWO-WAY GUARD – the contract pays, the scholarship does not, and holding both changes nothing', () => {
    // ⚠⚠ THE ARM THE AMENDMENT EXISTS TO SURVIVE. If `coachTravelFareFor` ever came to depend on the
    // family being POOR, the 15.08 ruling would be broken again behind a contract-shaped excuse. So:
    // hold a FULL scholarship AND a contract, and the fare must equal the contract-only fare to the
    // cent. Any leak of the scholarship into his seat makes this number smaller and this arm red.
    const brand = supported(BRAND_ONLY)
    const both = supported(BRAND_AND_SCHOLARSHIP)
    const scholarshipOnly = supported(ACADEMY_FULL)

    const trips = realTrips(brand).filter((e) => TIERS[e.tier].prizeCents !== undefined && coachTravelFareFor(brand, e) > 0)
    expect(trips.length, 'covered trips exist').toBeGreaterThan(0)
    for (const e of trips) {
      expect(coachTravelFareFor(both, e), `${e.id}: the scholarship adds NOTHING to his cover`).toBe(
        coachTravelFareFor(brand, e),
      )
      expect(coachTravelFareFor(scholarshipOnly, e), `${e.id}: and alone it covers nothing at all`).toBe(
        e.travelCostCents,
      )
    }
    // ...and the scholarship is demonstrably working on HER seat in that same world, so the arm above
    // is about where the cover goes rather than about a scholarship that does nothing.
    const trip = trips[0]
    expect(travelCostFor(both, trip), 'her seat in the both-world is cheaper than under the deal alone').toBeLessThan(
      travelCostFor(brand, trip),
    )
  })

  it('⭐ the till charges exactly that, and no cover\'s tally moves when it does', () => {
    // §3's shape, on the contract side. The ledger is the other leak path: a term that never touched
    // the price could still hand money back through `academy.coveredCents` or a rebate row.
    const world = supported(BRAND_AND_SCHOLARSHIP)
    const trip = realTrips(world).find((e) => TIERS[e.tier].prizeCents !== undefined && coachTravelFareFor(world, e) > 0)!
    expect(trip, 'a covered trip he is on').toBeTruthy()
    const expected = expectedCoachFare(world, trip)
    const tallyBefore = world.academy!.coveredCents
    const before = world.fundsCents

    chargeCoachTravel(world, trip)
    expect(before - world.fundsCents, 'the till charges the covered fare, exactly').toBe(expected)
    expect(world.academy!.coveredCents, 'and the SCHOLARSHIP was not credited with the brand\'s work').toBe(tallyBefore)

    const row = world.events.filter((e) => e.category === 'travel' && /coach/i.test(e.text))
    expect(row, 'one line, its own').toHaveLength(1)
    expect(row[0].amountCents, 'and the line says the same number').toBe(-expected)
    // ⚠ AND IT NAMES THE PAYER. A fare that quietly shrank would be indistinguishable from a price
    // that moved; `chargeCoachTravel` prints the brand and the percentage for exactly that reason.
    expect(row[0].text, 'the line says who paid').toMatch(/covers \d+%/)
  })

  it('⚠ the cover can never reach the whole fare – `> 0` still means "he came"', () => {
    // ⚠ A REAL HAZARD AND NOT A HYPOTHETICAL. `coachTravelFareFor(...) > 0` is what world.ts and
    // snapshot.ts ask to decide whether the coach is AT the court – the match-strength helping reads
    // it. A share of 1.0 would zero the fare and silently mean "he did not come", turning a generous
    // sponsor into a missing coach. So the ladder's top rung is pinned below the whole fare.
    const world = supported(BRAND_ONLY)
    expect(kitTravelShare(world.offers, world.week), 'the fixture deal really covers something').toBeGreaterThan(0)
    const trips = realTrips(world).filter((e) => TIERS[e.tier].prizeCents !== undefined)
    for (const e of trips) {
      expect(coachTravelFareFor(world, e), `${e.id}: a covered seat is still a charged seat`).toBeGreaterThan(0)
    }
  })

  it('a whole booked season under a contract adds up to the term, and to nothing less', () => {
    // The contract half of §3's season identity. Junior travel is ON, so this sums the rungs that pay
    // AND the rungs that do not in one number - which is the strongest form of the scope claim: the
    // total can only come out right if the cover applied at exactly the prize-money rungs.
    const world = supported(BRAND_ONLY, { juniors: true })
    const trips = realTrips(world).filter((e) => coachTravelFareFor(world, e) > 0)
    expect(trips.length, 'he is on a real season of trips').toBeGreaterThan(4)
    const expected = trips.reduce((sum, e) => sum + expectedCoachFare(world, e), 0)
    const printed = trips.reduce((sum, e) => sum + e.travelCostCents, 0)
    const before = world.fundsCents
    for (const e of trips) chargeCoachTravel(world, e)
    expect(before - world.fundsCents, 'the season of second seats, at the contract price').toBe(expected)
    // ...and the season is genuinely cheaper than list, so the identity above is not a restatement of
    // "the cover did nothing".
    expect(expected, 'the contract really is paying for a season').toBeLessThan(printed)
  })
})
