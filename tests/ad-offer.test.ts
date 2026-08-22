// ROUND 24 ITEM 2, STEP 1 – ONE NON-ENDEMIC OFFER (docs/plans/the-face-and-the-court.md §6).
//
// The owner: «Рекламные контракты будем добавлять какие-то?» – and step 1, whole: one advertising
// letter from a house that is not a tennis brand, gated on results only, cash only, no cost at all.
// «Done when: it arrives, it can be signed, and the ledger shows it» – which is exactly the three
// things this file measures, plus the two silences that make the gate a gate: nothing before
// eighteen or below the bar, and nothing inside the college freeze («nobody writes to an amateur»).
//
// ⚠ THE WALK ASKS THE ENGINE, NOT THE REVIEWER – the round24-academy-letters lesson, kept: the
// arrival tests drive `tickWeek` and never call `reviewAdOffer` by hand, so the ONE line that wires
// the feature into a career (world.ts, beside the sponsor review's own freeze gate) is what is
// actually under test. `reviewAdOffer` is called directly only in the gate-arm probes, whose whole
// point is to hold every OTHER condition true while one is varied.
//
// ⚠ THE BAR-CROSSING IS STAGED, THE WALK IS REAL – the `proWorld` idiom (tests/play-down.test.ts):
// every week to eighteen is ticked by the real engine, and her professional book is then written the
// way every pro fixture in this repo writes one (a counting W result + the on-ramp latch +
// `recomputeKidRank`). An organic crossing would need eight-plus entered seasons per arm and still
// not be guaranteed by the calibration («first points 17-18, top-100 about 4.5 years later»).
//
// RNG: the letter's one roll lives on `seed:ad:<week>` – purpose-scoped, never MAIN – so the tests
// can READ the same dice the engine will roll (`adWritesAt`) and walk exactly to the first true
// week. Nothing here is seed-hunted into passing: where a fixture needs a property of the dice, the
// property is asserted as a fixture fact first, so a retuned chance fails loudly instead of quietly
// testing nothing.
import { describe, it, expect, vi } from 'vitest'

// The shared walk is a real career to eighteen (~210 ticks) plus up to a season of arrivals; the
// runner is shared with heavier suites.
vi.setConfig({ testTimeout: 300_000 })

import {
  acceptOffer,
  createWorld,
  declineOffer,
  kidAgeYears,
  recomputeKidRank,
  reviewAdOffer,
  tickWeek,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { activeAdDeal, adOfferId, adSpokenFor, adWritesAt, hasLiveOffer, isOfferLive } from '../src/engine/offers'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type AdOfferTerms, type Offer } from '../src/shared/protocol'

const AD = ECONOMY.advertising

const adPost = (world: WorldState): Offer[] => world.offers.filter((o) => o.kind === 'ad')

/** Her age this week, off the world's own clock – the same read the gate makes. */
const ageOf = (world: WorldState): number =>
  kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)

/** A counting professional result, the pro-fixture idiom: the book that makes `wtaRanked` true and
 *  puts a real rank in the table. Re-pushed when a test walks past the 52-week results window,
 *  which is only what a career that keeps playing does. */
function pushBook(world: WorldState): void {
  world.results.push({ playerId: KID_ID, week: world.week, points: 100_000, tier: 'w100' })
}

/** A REAL career ticked to her eighteenth year, then given a professional standing the way
 *  `proWorld` fixtures do. Self-coached and entering nothing, so the walk is deterministic and no
 *  tournament dialogs arise; the engine still lives every week of it. */
function adultPro(seed: string) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  const rng = resumeMain(world.rngMain)
  while (ageOf(world) < AD.fromAgeYears) tickWeek(world, rng)
  pushBook(world)
  world.onRampCleared = { itf: true, wta: true }
  recomputeKidRank(world)
  return { world, rng }
}

/** The first week at or after `from` whose own dice say a house writes – the exact roll the engine
 *  will take on that week, read off the same purpose-scoped sub-stream. -1 when the span has none. */
function firstRollFrom(seed: string, from: number, limit: number): number {
  for (let w = from; w < from + limit; w++) if (adWritesAt(seed, w, AD.offerChance)) return w
  return -1
}

// THE SHARED CAREER. One walk, two checkpoints: `eligible` is the week she first stands past both
// gates with no letter yet; `world` is the same career at the letter's arrival week.
const life = (() => {
  const { world, rng } = adultPro('ad-life')
  const eligible = structuredClone(world)
  const hit = firstRollFrom(world.seed, world.week + 1, 40)
  if (hit > 0) while (world.week < hit) tickWeek(world, rng)
  return { world, eligible, hit }
})()

describe('the fixture is what it claims to be', () => {
  it('eighteen-plus, a counting W standing inside the bar, and dice that say yes inside the window', () => {
    expect(ageOf(life.eligible)).toBeGreaterThanOrEqual(AD.fromAgeYears)
    const standing = sponsorStandingOf(life.eligible)
    expect(standing.wtaRanked).toBe(true)
    expect(standing.wtaRank).toBeLessThanOrEqual(AD.maxWtaRank)
    // The dice hit inside 40 weeks of eligibility – inside the book's own 52-week window, so her
    // standing still holds on the arrival week. A retuned `offerChance` that breaks this fails HERE,
    // not silently in an arm that then proves nothing.
    expect(life.hit).toBeGreaterThan(0)
  })
})

describe('step 1.1 – it arrives', () => {
  it('the letter arrives through the tick, once, on the week its own dice first say yes', () => {
    const world = structuredClone(life.world)
    const post = adPost(world)
    expect(post).toHaveLength(1)
    const offer = post[0]
    expect(offer.id).toBe(adOfferId(life.hit))
    expect(offer.week).toBe(life.hit)
    expect(offer.state).toBe('open')
    // The kit window's own thinking time, stated as a real deadline `expireOffers` enforces.
    expect(offer.deadlineWeek).toBe(life.hit + AD.decideWeeks - 1)
    // ...and the inbox dot is on: a letter that arrives unseen is the round-24 academy bug over.
    expect(hasLiveOffer(world.offers, world.week)).toBe(true)
  })

  it('terms are the catalogue, frozen at arrival – brand, cash, term, and nothing else', () => {
    const t = adPost(life.world)[0].terms as AdOfferTerms
    expect(t.brand).toBe(AD.brand)
    expect(t.cashCents).toBe(AD.cashCents)
    expect(t.termWeeks).toBe(AD.termWeeks)
    // ⚠ THE SCOPE FENCE, AS AN ASSERTION. Step 1 carries no obligation of any kind: no events owed,
    // no recovery cost, no fame, nothing that outlives the term. A field appearing here is a later
    // step arriving early, which the plan's build order forbids.
    expect(Object.keys(t).sort()).toEqual(['brand', 'cashCents', 'termWeeks'])
  })

  it('nothing arrived on the walk to eighteen, and nothing before the dice said yes', () => {
    // The whole walk – 200+ weeks of it under eighteen, plus the eligible weeks the dice declined –
    // wrote exactly one advertising letter.
    expect(adPost(life.eligible)).toEqual([])
    expect(adPost(life.world)).toHaveLength(1)
  })
})

describe('step 1.2 – it can be signed, and the ledger shows it', () => {
  it('signing pays the fee into the FAMILY wallet and the ledger shows it, same week, in cents', () => {
    const world = structuredClone(life.world)
    const offer = adPost(world)[0]
    const fundsBefore = world.fundsCents
    const kidBefore = world.kidFundsCents ?? 0
    const earnedBefore = world.careerTotals.earnedCents

    const signed = acceptOffer(world, offer.id)
    expect(signed.state).toBe('signed')

    // The wallet: the fee, exactly, once.
    expect(world.fundsCents - fundsBefore).toBe(AD.cashCents)
    // ⚠ AND NOT HER ACCOUNT. Step 5 is where the plan routes an endorsement to `kidFundsCents`;
    // step 1's money is the family's, so her balance must not move by a cent here.
    expect(world.kidFundsCents ?? 0).toBe(kidBefore)

    // The feed row: income, under 'sponsor' – filed with the other brand money.
    const row = world.events.find(
      (e) => e.week === world.week && e.category === 'sponsor' && e.amountCents === AD.cashCents,
    )
    expect(row).toBeDefined()
    expect(row!.type).toBe('income')
    expect(row!.text).toContain(AD.brand)

    // The persisted finance ledger – the Money breakdown's source, which survives feed pruning.
    const week = world.financeWeeks.find((f) => f.week === world.week)
    expect(week?.byCategory.sponsor).toBe(AD.cashCents)
    expect(world.careerTotals.earnedCents - earnedBefore).toBe(AD.cashCents)

    // The paper is a record now: the engine froze the term it will honour.
    expect(signed.fromWeek).toBe(world.week)
    expect(signed.untilWeek).toBe(world.week + AD.termWeeks - 1)
    expect(activeAdDeal(world.offers, world.week)?.id).toBe(offer.id)
  })

  it('declining works and costs nothing – no money moves, nothing is written, the week goes on', () => {
    const world = structuredClone(life.world)
    const offer = adPost(world)[0]
    const fundsBefore = world.fundsCents
    const eventsBefore = world.events.length
    const earnedBefore = world.careerTotals.earnedCents

    const refused = declineOffer(world, offer.id)
    expect(refused.state).toBe('refused')
    expect(world.fundsCents).toBe(fundsBefore)
    expect(world.events.length).toBe(eventsBefore)
    expect(world.careerTotals.earnedCents).toBe(earnedBefore)
    expect(activeAdDeal(world.offers, world.week)).toBeNull()
    // The AD letter stops knocking – it is answered. (The walked career can hold live KIT letters
    // beside it, so the claim is about this paper, not about the whole inbox dot.)
    expect(isOfferLive(refused, world.week)).toBe(false)
    expect(adSpokenFor(world.offers, world.week)).toBe(false)

    // ...and the career simply continues: refusal is an answer, not an event.
    const rng = resumeMain(world.rngMain)
    tickWeek(world, rng)
    expect(world.events.some((e) => e.category === 'sponsor' && e.amountCents === AD.cashCents)).toBe(false)
  })

  it('left unanswered it expires on its own deadline, and that costs nothing either', () => {
    const world = structuredClone(life.world)
    const rng = resumeMain(world.rngMain)
    const deadline = adPost(world)[0].deadlineWeek
    while (world.week <= deadline) tickWeek(world, rng)
    const offer = adPost(world)[0]
    expect(offer.state).toBe('expired')
    expect(world.events.some((e) => e.category === 'sponsor' && e.amountCents === AD.cashCents)).toBe(false)
  })
})

describe('one deal at a time (plan §4.1)', () => {
  it('a signed term shuts the post for its whole run, and its end reopens it', () => {
    const world = structuredClone(life.world)
    const rng = resumeMain(world.rngMain)
    const offer = adPost(world)[0]
    acceptOffer(world, offer.id)
    const until = offer.untilWeek!

    // Fixture fact first: the dice say yes at least once INSIDE the term – so a quiet year below is
    // the gate's doing, not the dice's.
    let insideTrue = 0
    for (let w = world.week + 1; w <= until; w++) if (adWritesAt(world.seed, w, AD.offerChance)) insideTrue++
    expect(insideTrue).toBeGreaterThan(0)

    while (world.week < until) {
      // She keeps playing: the book is refreshed mid-term so her standing never lapses and the
      // silence cannot be blamed on the results gate.
      if (until - world.week === 26) {
        pushBook(world)
        recomputeKidRank(world)
      }
      tickWeek(world, rng)
    }
    expect(adPost(world)).toHaveLength(1)
    expect(adSpokenFor(world.offers, world.week)).toBe(true)

    // The week after the term, the post is open – and the next true-roll week brings the next
    // letter, through the tick, exactly as the first one came.
    pushBook(world)
    recomputeKidRank(world)
    const next = firstRollFrom(world.seed, until + 1, 40)
    expect(next).toBeGreaterThan(0)
    while (world.week < next) tickWeek(world, rng)
    const post = adPost(world)
    expect(post).toHaveLength(2)
    expect(post[1].week).toBe(next)
    expect(post[1].state).toBe('open')
  })

  it('an OPEN letter blocks a second one while it is still live', () => {
    // Two true rolls inside one letter's window – found by reading the dice, then asserted, so the
    // fixture cannot rot into a vacuous pass if the chance or the window is retuned.
    let seed = ''
    let w1 = -1
    let w2 = -1
    outer: for (let n = 0; n < 500; n++) {
      const s = `ad-open-${n}`
      for (let w = 260; w < 340; w++) {
        if (!adWritesAt(s, w, AD.offerChance)) continue
        const second = firstRollFrom(s, w + 1, AD.decideWeeks - 1)
        if (second > 0) {
          seed = s
          w1 = w
          w2 = second
          break outer
        }
      }
    }
    expect(w1).toBeGreaterThan(0)
    expect(w2).toBeLessThanOrEqual(w1 + AD.decideWeeks - 1)

    const world = probeWorld(seed, w1, 150, true)
    reviewAdOffer(world)
    expect(adPost(world)).toHaveLength(1)
    world.week = w2 // the letter is still live – inside its own deadline
    reviewAdOffer(world)
    expect(adPost(world)).toHaveLength(1)
  })
})

/** A surgical probe for the gate arms: a fresh world moved to `week`, with exactly the standing the
 *  arm needs. `reviewAdOffer` reads nothing else, so each arm below varies ONE condition while the
 *  probe holds the rest true – including, always, a week whose own dice say yes. */
function probeWorld(seed: string, week: number, rank: number | undefined, ranked: boolean): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = week
  if (ranked) world.results.push({ playerId: KID_ID, week, points: 100, tier: 'w100' })
  world.kidRankWta = rank
  return world
}

describe('the gate: results only, from eighteen, and the dice', () => {
  const SEED = 'ad-gates'
  // A true-roll week where she is under eighteen for EVERY birth date (age < 18 holds for all weeks
  // under 205: whole years = weekYear - birthYear - (0|1) <= 17 there), and one safely past her
  // nineteenth (week 260+) – so the two arms differ in age and in nothing else.
  const underAgeTrue = firstRollFrom(SEED, 60, 140)
  const adultTrue = firstRollFrom(SEED, 260, 80)

  it('fixture facts: both probe weeks exist and sit where the argument needs them', () => {
    expect(underAgeTrue).toBeGreaterThan(0)
    expect(underAgeTrue).toBeLessThan(205)
    expect(adultTrue).toBeGreaterThanOrEqual(260)
    const world = createWorld(SEED, { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.week = underAgeTrue
    expect(ageOf(world)).toBeLessThan(AD.fromAgeYears)
    world.week = adultTrue
    expect(ageOf(world)).toBeGreaterThanOrEqual(AD.fromAgeYears)
  })

  it('no letter before eighteen – same standing, same true roll, only the age differs', () => {
    const under = probeWorld(SEED, underAgeTrue, 150, true)
    reviewAdOffer(under)
    expect(adPost(under)).toEqual([])

    const adult = probeWorld(SEED, adultTrue, 150, true)
    reviewAdOffer(adult)
    expect(adPost(adult)).toHaveLength(1)
  })

  it('no letter below the bar – #200 is written to, #201 is not', () => {
    const inside = probeWorld(SEED, adultTrue, AD.maxWtaRank, true)
    reviewAdOffer(inside)
    expect(adPost(inside)).toHaveLength(1)

    const outside = probeWorld(SEED, adultTrue, AD.maxWtaRank + 1, true)
    reviewAdOffer(outside)
    expect(adPost(outside)).toEqual([])
  })

  it('a floor tie is not a standing – a rank with no counting W result buys nothing', () => {
    const tied = probeWorld(SEED, adultTrue, 150, false)
    reviewAdOffer(tied)
    expect(adPost(tied)).toEqual([])
  })

  it('and the dice are real – an eligible week whose roll says no writes nothing', () => {
    let falseWeek = -1
    for (let w = 260; w < 340; w++) {
      if (!adWritesAt(SEED, w, AD.offerChance)) {
        falseWeek = w
        break
      }
    }
    expect(falseWeek).toBeGreaterThan(0)
    const world = probeWorld(SEED, falseWeek, 150, true)
    reviewAdOffer(world)
    expect(adPost(world)).toEqual([])
  })
})

describe('«nobody writes to an amateur» – the college freeze (plan §4c)', () => {
  it('the same career, the same weeks, the same dice – enrolled, and no letter comes', () => {
    // The open-career control is `life.world`: this exact span produced the letter at `life.hit`.
    expect(adPost(life.world)).toHaveLength(1)

    const world = structuredClone(life.eligible)
    // She answers the fork with «college»: the span is what `inCollege` reads, and enrolment
    // releases whatever entries were outstanding (this walk made none). Under 52 weeks are walked
    // here, so no college-year machinery is due inside the probe.
    world.entries = []
    world.college = {
      fromWeek: world.week,
      untilWeek: world.week + 208,
      doneWeek: null,
      years: [],
      pendingCallUp: null,
      pendingLeague: null,
    }
    const rng = resumeMain(world.rngMain)
    while (world.week < life.hit) tickWeek(world, rng)
    expect(adPost(world)).toEqual([])
  })

  it('a deal signed BEFORE she enrols keeps its money and simply runs out – no penalty, ever', () => {
    const world = structuredClone(life.world)
    const offer = adPost(world)[0]
    acceptOffer(world, offer.id)
    const until = offer.untilWeek!

    // She enrols the very next week, mid-term.
    world.entries = []
    world.college = {
      fromWeek: world.week + 1,
      untilWeek: world.week + 1 + 208,
      doneWeek: null,
      years: [],
      pendingCallUp: null,
      pendingLeague: null,
    }
    const rng = resumeMain(world.rngMain)
    for (let i = 0; i < 6; i++) tickWeek(world, rng)

    // The paper still says signed, the term still stands as written, and not a cent of the fee
    // moved back out: the only sponsor-category row in the whole career is the one credit, and no
    // negative sponsor row – no clawback of any size – exists anywhere. «Мы ни за что не
    // наказываем» applies to contracts too.
    expect(offer.state).toBe('signed')
    expect(offer.untilWeek).toBe(until)
    const sponsorRows = world.events.filter((e) => e.category === 'sponsor')
    expect(sponsorRows).toHaveLength(1)
    expect(sponsorRows[0].amountCents).toBe(AD.cashCents)
    expect(world.events.some((e) => (e.amountCents ?? 0) < 0 && e.text.includes(AD.brand))).toBe(false)
  })
})
