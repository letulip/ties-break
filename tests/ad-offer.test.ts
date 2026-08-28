// ROUND 24 ITEM 2, STEPS 1-2 – ONE NON-ENDEMIC OFFER, AND ITS PRICE IN TIME
// (docs/plans/the-face-and-the-court.md §6).
//
// The owner: «Рекламные контракты будем добавлять какие-то?» – and step 1, whole: one advertising
// letter from a house that is not a tennis brand, gated on results only, cash only.
// «Done when: it arrives, it can be signed, and the ledger shows it» – which is exactly the three
// things this file measures, plus the two silences that make the gate a gate: nothing before
// eighteen or below the bar, and nothing inside the college freeze («nobody writes to an amateur»).
//
// ⭐ STEP 2 RIDES THE SAME FILE (§4a, owner ruling 22.08: «съемки должны быть иногда … и
// восстановления на тех неделях должно быть чуть меньше»): the signature names `shootCount` shoot
// weeks – in-season, spaced, inside the term – and each one recovers like a TRAVEL week rather than
// a rest week (`accrueCondition`), with the college freeze lapsing a shoot silently. The last
// describes below measure exactly that and nothing later: fame, refusal reasons and her own account
// are steps 3+ and stay behind the terms fence.
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
  accrueCondition,
  acceptOffer,
  adShootHolds,
  withheldFreeWeekRecovery,
  createWorld,
  declineOffer,
  kidAgeYears,
  recomputeKidRank,
  reviewAdOffer,
  tickWeek,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { activeAdDeal, adOfferId, adShootWeek, adSpokenFor, adWritesAt, chooseShootWeeks, expireOffers, hasLiveOffer, isOfferLive, raiseAdOffer } from '../src/engine/offers'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { ECONOMY, kidPrizeShareCents } from '../src/engine/economy'
import { isOffSeasonWeek } from '../src/engine/season/calendar'
import { PLAN_DAYS } from '../src/engine/plan'
import { weekLabel } from '../src/shared/dates'
import { lookAheadFor, type CalendarWeekFacts } from '../src/composables/weekDays'
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

  it('terms are the catalogue, frozen at arrival – brand, cash, term, the shoot promise, and nothing else', () => {
    const t = adPost(life.world)[0].terms as AdOfferTerms
    expect(t.brand).toBe(AD.brand)
    expect(t.cashCents).toBe(AD.cashCents)
    expect(t.termWeeks).toBe(AD.termWeeks)
    expect(t.shootCount).toBe(AD.shootWeeksPerTerm)
    // ...and the WEEKS are not on the arrival paper: they are the signature's to name, so an open
    // letter that already carried them would be a choice made before the player made it.
    expect(t.shootWeeks).toBeUndefined()
    // ⚠ THE SCOPE FENCE, AS AN ASSERTION – RE-AIMED FOR STEP 2 (owner ruling 22.08). Step 1 pinned
    // ['brand','cashCents','termWeeks']; the owner then ruled the shoots in («съемки должны быть
    // иногда и это надо как-то прописывать»), so `shootCount` joined the paper DELIBERATELY – which
    // is precisely what this fence exists to force. It still forbids everything later: fame, a
    // refusal reason, her own account, obligations outliving the term. A new key here is a step 3+
    // field arriving early, and it must arrive the way this one did – by a ruling, re-aiming this
    // line on purpose.
    expect(Object.keys(t).sort()).toEqual(['brand', 'cashCents', 'shootCount', 'termWeeks'])
  })

  it('nothing arrived on the walk to eighteen, and nothing before the dice said yes', () => {
    // The whole walk – 200+ weeks of it under eighteen, plus the eligible weeks the dice declined –
    // wrote exactly one advertising letter.
    expect(adPost(life.eligible)).toEqual([])
    expect(adPost(life.world)).toHaveLength(1)
  })
})

describe('step 1.2 – it can be signed, and the ledger shows it', () => {
  // ⚠⚠ RE-AIMED BY ROUND-28 #15, NOT WEAKENED. This test used to assert the fee landed WHOLE in the
  // family wallet and that «her balance must not move by a cent here» – a correct guard on the day
  // it was written, and the owner has since ruled the other way: «С чеков спонсоров мне кажется
  // ребёнку тоже нужно % перечислять, как и с призовых, давай сделаем». So the claim moves from
  // "none of it is hers" to "exactly the ramp's share of it is hers, and the two halves re-add to
  // the brand's cheque to the cent", which is a strictly sharper assertion than the one it replaces.
  //
  // ⚠ IT IS STILL NOT STEP 5, and that distinction is the reason this describe keeps its name. Step
  // 5 gives her the WHOLE fee («the deal pays HER, not the family»); his ruling is the prize ramp,
  // which is a SHARE with the family keeping the rest. The fence below (`Object.keys(t)`) is
  // untouched: no `AdOfferTerms` field was added, because the ramp needs none.
  it('signing splits the fee with her at the ramp, and the ledger shows both halves, same week', () => {
    const world = structuredClone(life.world)
    const offer = adPost(world)[0]
    const fundsBefore = world.fundsCents
    const kidBefore = world.kidFundsCents ?? 0
    const earnedBefore = world.careerTotals.earnedCents

    // The rate is read off the shipped ramp at HER real age, never restated as a literal – a retune
    // of `ECONOMY.kidShare` moves this test with the game instead of reddening it.
    const hers = kidPrizeShareCents(AD.cashCents, ageOf(world))
    const theirs = AD.cashCents - hers
    expect(hers, 'she is eighteen-plus here, so the ramp is really paying').toBeGreaterThan(0)

    const signed = acceptOffer(world, offer.id)
    expect(signed.state).toBe('signed')

    // The wallet: the fee less her share, exactly, once.
    expect(world.fundsCents - fundsBefore).toBe(theirs)
    // ...and HER account moved by the rest of it.
    expect((world.kidFundsCents ?? 0) - kidBefore).toBe(hers)
    // ⚠ THE PENNY RULE, WHICH IS WHY THE TWO ARE READ TOGETHER: one rounding, the family gets the
    // remainder, so the halves re-add to the brand's cheque exactly.
    expect(theirs + hers).toBe(AD.cashCents)

    // The feed row: income, under 'sponsor' – filed with the other brand money, at what was banked.
    const row = world.events.find(
      (e) => e.week === world.week && e.category === 'sponsor' && e.amountCents === theirs,
    )
    expect(row).toBeDefined()
    expect(row!.type).toBe('income')
    expect(row!.text).toContain(AD.brand)

    // The persisted finance ledger – the Money breakdown's source, which survives feed pruning.
    const week = world.financeWeeks.find((f) => f.week === world.week)
    expect(week?.byCategory.sponsor).toBe(theirs)
    expect(world.careerTotals.earnedCents - earnedBefore).toBe(theirs)

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
    //
    // ⚠ RE-AIMED BY ROUND-28 #15, AND THE CLAIM IS UNCHANGED – only the size of the credit moved.
    // Her cut now comes off the fee at signing («с чеков спонсоров… как и с призовых»), so the
    // sponsor row is the FAMILY's half. The no-clawback claim is what this test is about and it is
    // now asserted on BOTH balances rather than one: the halves still re-add to the brand's cheque,
    // so neither purse gave anything back when she enrolled.
    expect(offer.state).toBe('signed')
    expect(offer.untilWeek).toBe(until)
    const hers = kidPrizeShareCents(AD.cashCents, ageOf(world))
    const sponsorRows = world.events.filter((e) => e.category === 'sponsor')
    expect(sponsorRows).toHaveLength(1)
    expect(sponsorRows[0].amountCents).toBe(AD.cashCents - hers)
    expect(sponsorRows[0].amountCents! + (world.kidFundsCents ?? 0), 'both halves are still there').toBe(AD.cashCents)
    expect(world.events.some((e) => (e.amountCents ?? 0) < 0 && e.text.includes(AD.brand))).toBe(false)
  })
})

// =================================================================================================
// STEP 2 – THE SHOOT WEEKS (§4a, owner ruling 22.08)
// =================================================================================================
//
// «Съемки должны быть иногда и это надо как-то прописывать и отражать потом в свободных неделях,
// соответственно и восстановления на тех неделях должно быть чуть меньше» – and the sized version
// he approved («утверждаю, для начала точно ок»): exactly two shoot weeks per Quiet Hour term,
// in-season, named in the letter at the signature, each recovering like a TRAVEL week rather than a
// rest week. No second calendar, no blocking: the week stays hers.

/** The walked career, signed – the shared fixture for everything the signature creates. */
function signedLife() {
  const world = structuredClone(life.world)
  const offer = adPost(world)[0]
  acceptOffer(world, offer.id)
  return { world, offer }
}

describe('step 2.1 – the signature names the weeks', () => {
  it('exactly shootCount weeks, all inside the term, none earlier than the lead', () => {
    const { world, offer } = signedLife()
    const t = offer.terms as AdOfferTerms
    expect(t.shootWeeks).toBeDefined()
    expect(t.shootWeeks!).toHaveLength(t.shootCount)
    for (const w of t.shootWeeks!) {
      expect(w).toBeGreaterThanOrEqual(world.week + AD.shootLeadWeeks)
      expect(w).toBeLessThanOrEqual(offer.untilWeek!)
    }
  })

  it('in-season by construction, and spaced – never adjacent', () => {
    const t = signedLife().offer.terms as AdOfferTerms
    for (const w of t.shootWeeks!) expect(isOffSeasonWeek(w), `week ${w} is off-season`).toBe(false)
    const [a, b] = t.shootWeeks!
    expect(Math.abs(a - b)).toBeGreaterThanOrEqual(2)
  })

  it('deterministic at the signature: the same career signed the same week names the same weeks', () => {
    const first = signedLife().offer.terms as AdOfferTerms
    const second = signedLife().offer.terms as AdOfferTerms
    expect(second.shootWeeks).toEqual(first.shootWeeks)
    // ...and they are the sub-stream's own answer, not a coincidence of the walk.
    expect(first.shootWeeks).toEqual(
      chooseShootWeeks(life.world.seed, life.world.week, AD.termWeeks, AD.shootWeeksPerTerm, AD.shootLeadWeeks),
    )
  })

  it('signing draws ZERO on MAIN – the persisted stream position does not move by a bit', () => {
    const world = structuredClone(life.world)
    const mainBefore = structuredClone(world.rngMain)
    acceptOffer(world, adPost(world)[0].id)
    expect(world.rngMain).toEqual(mainBefore)
  })

  it('over many draws an off-season or adjacent pair is impossible by construction', () => {
    // 500 signature points spread over 10 seeds x 50 sign weeks – the (c) arm of the bench, pinned
    // small here so a retune that breaks the construction fails in CI rather than in a hand-run.
    let pairs = 0
    for (let n = 0; n < 10; n++) {
      for (let sw = 220; sw < 270; sw++) {
        const weeks = chooseShootWeeks(`ad-shoot-sweep-${n}`, sw, AD.termWeeks, AD.shootWeeksPerTerm, AD.shootLeadWeeks)
        expect(weeks).toHaveLength(2)
        for (const w of weeks) expect(isOffSeasonWeek(w), `seed ${n} sign ${sw}: week ${w} off-season`).toBe(false)
        expect(Math.abs(weeks[0] - weeks[1])).toBeGreaterThanOrEqual(2)
        pairs++
      }
    }
    expect(pairs).toBe(500)
    // ⚠ THE ADJACENCY WITNESS, found by reading the dice (the R1 rule: a property a fixture needs
    // is asserted, not hoped for). With the non-adjacency filter REMOVED, this exact signature
    // draws [239, 240] – the first pick lands on the last eligible week of its slice and the second
    // on the first of its own – so this one case fails DETERMINISTICALLY under that mutation, where
    // the 500 random pairs above would only fail by luck (the mutant measured 33 adjacent in
    // 20,000: ~1/600 a pair).
    const witness = chooseShootWeeks('adj-0', 212, AD.termWeeks, AD.shootWeeksPerTerm, AD.shootLeadWeeks)
    expect(witness[0]).toBe(239)
    expect(Math.abs(witness[0] - witness[1])).toBeGreaterThanOrEqual(2)
  })
})

describe('step 2.2 – a shoot week recovers like a travel week, not a rest week', () => {
  /** A surgical probe in the B2 idiom (tests/condition.test.ts): a fresh world handed a signed deal
   *  whose shoot weeks this test controls, so one condition varies per arm. Light 60/40 plan – the
   *  rest week's figure is the pinned +10 (base 8 + slider 2) – no physio, condition mid-range so
   *  nothing clamps. */
  function shootProbe(shootWeeks: number[], week: number): WorldState {
    const world = createWorld('ad-shoot-probe', { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.week = week
    world.plan = { train: 60, rest: 40 }
    world.physioActive = false
    world.condition = 50
    world.offers.push({
      id: adOfferId(week - 10),
      kind: 'ad',
      week: week - 10,
      deadlineWeek: week - 7,
      state: 'signed',
      decidedWeek: week - 10,
      fromWeek: week - 10,
      untilWeek: week - 10 + AD.termWeeks - 1,
      terms: { brand: AD.brand, cashCents: AD.cashCents, termWeeks: AD.termWeeks, shootCount: 2, shootWeeks },
    })
    return world
  }
  // Week 216 is a mid-season adult week (offset 8 of season 5): not off-season, not an exam offset,
  // school over – asserted below so a calendar retune fails loudly instead of testing nothing.
  const WEEK = 216

  it('fixture fact: the probe week is an ordinary in-season week', () => {
    expect(isOffSeasonWeek(WEEK)).toBe(false)
    const world = shootProbe([], WEEK)
    accrueCondition(world, false)
    expect(world.condition).toBe(60) // the rest week's own +10 – the control this file measures against
  })

  it('the same week as a SHOOT week: the travel figure – base and slider both forfeited', () => {
    const world = shootProbe([WEEK], WEEK)
    expect(adShootWeek(world.offers, world.week)).toBe(true)
    accrueCondition(world, false)
    // matchWeekRecoveryBase is 0 shipped: she gets the week's travel recovery, which is none.
    expect(world.condition).toBe(50 + ECONOMY.condition.matchWeekRecoveryBase)
    expect(world.condition).toBe(50)
  })

  it('physio still pays on a shoot week – the travel week SHAPE, not a special zero', () => {
    const world = shootProbe([WEEK], WEEK)
    world.physioActive = true
    accrueCondition(world, false)
    expect(world.condition).toBe(51) // +1, exactly what the retainer adds on a real trip week
  })

  // ⚠⚠ RE-AIMED AT ROUND 29 #3, AND IT IS THE OWNER OVERTURNING HIS OWN EARLIER DESIGN – not a
  // regression and not a weakening. What stood here was «a tournament on the shoot week does NOT
  // stack – she simply recovers worse, via the match drain», which was round 28's ruling: the shoot
  // is «not blocked and not double-charged», and the collision was nobody's decision. He has since
  // looked at that exemption and rejected it – «но она же осталась на турнирной неделе... Может
  // сделать возможность переноса съёмки или всё-таки жарить прямо с чемпионатом с последствиями» –
  // and named the price himself: «+1 в день, т.к. съемка занимает не один час, то нагрузка будет
  // мощной на всю неделю».
  //
  // ⚠ AND IT IS NOT A HIDDEN MALUS, WHICH IS WHAT THE OLD CASE WAS PROTECTING AGAINST. The parent is
  // ASKED before the week is spent (`shootClashOpen` refuses the tick) and this arm is one of four
  // answers he can give – the other three remove the collision. The guard's real content therefore
  // moves: the two arms must differ by EXACTLY his figure and by nothing else.
  it('a tournament on the shoot week costs the owner\'s figure, and exactly that (round 29 #3)', () => {
    const shoot = shootProbe([WEEK], WEEK)
    accrueCondition(shoot, true)
    const plain = shootProbe([], WEEK)
    accrueCondition(plain, true)
    const price = ECONOMY.advertising.clashConditionPerDay * PLAN_DAYS
    expect(plain.condition - shoot.condition, 'the week did not cost what he priced it at').toBe(price)
    expect(plain.condition, 'the plain playing week moved – the difference is not the shoot').toBe(
      50 + ECONOMY.condition.matchWeekRecoveryBase,
    )
    expect(shoot.condition).toBe(50 + ECONOMY.condition.matchWeekRecoveryBase - price)
  })

  it('at the ceiling a shoot week holds – recovery is forfeited, nothing is taken', () => {
    const world = shootProbe([WEEK], WEEK)
    world.condition = 100
    accrueCondition(world, false)
    expect(world.condition).toBe(100) // «чуть меньше восстановления», never a charge
  })

  it('the week after the shoot is an ordinary week again – one week, not a debuff', () => {
    const world = shootProbe([WEEK], WEEK + 1)
    accrueCondition(world, false)
    expect(world.condition).toBe(60)
  })

  it('through the real tick: the signed career pays the travel figure on its own named weeks', () => {
    const { world, offer } = signedLife()
    const t = offer.terms as AdOfferTerms
    const rng = resumeMain(world.rngMain)
    const target = t.shootWeeks![0]
    while (world.week < target - 1) tickWeek(world, rng)
    // A clean read needs a week that is only a shoot: skip if the walk booked anything else on it.
    world.condition = 50
    world.physioActive = false
    world.plan = { train: 60, rest: 40 }
    const before = world.condition
    tickWeek(world, rng)
    expect(world.week).toBe(target)
    // The travel figure, plus at most the exam blackout's +1 (a shoot is in-season by construction,
    // but the exam fortnight IS in-season and pays its bonus on trips too – the travel-week SHAPE).
    // The mutation this pins: without the shoot mechanism this free light-plan week returns +10.
    expect(world.condition - before).toBeLessThanOrEqual(
      ECONOMY.condition.matchWeekRecoveryBase + ECONOMY.condition.blackoutBonus,
    )
  })
})

describe('step 2.2b – the refund paths cannot hand a shoot week its rest back', () => {
  // ⚠ THE LEAK THE FIRST BENCH RUN CAUGHT (tools/ad-shoot-bench.ts): `accrueCondition` withheld the
  // shoot week's rest, and then the medical withdrawal refunded it – +9, the full rest week the
  // ruling says she does not get – because three sites re-derived "what a match-free week pays"
  // without asking about the shoot. They now read ONE oracle, `withheldFreeWeekRecovery`, and this
  // is its pin: 'tournament' names the banked matchWeekRecoveryBase rung (the medical withdrawal
  // and skipEvent), 'practice' the banked recoveryBase rung (the friendly's cancellation).
  function oracleProbe(shootWeeks: number[], week: number): WorldState {
    const world = createWorld('ad-refund-probe', { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.week = week
    world.plan = { train: 60, rest: 40 }
    world.offers.push({
      id: adOfferId(week - 10),
      kind: 'ad',
      week: week - 10,
      deadlineWeek: week - 7,
      state: 'signed',
      decidedWeek: week - 10,
      fromWeek: week - 10,
      untilWeek: week - 10 + AD.termWeeks - 1,
      terms: { brand: AD.brand, cashCents: AD.cashCents, termWeeks: AD.termWeeks, shootCount: 2, shootWeeks },
    })
    return world
  }
  const WEEK = 216 // the same asserted ordinary in-season week the accrual probes use

  it('an ordinary week refunds the whole ladder: base + slider for a tournament, slider for a friendly', () => {
    const world = oracleProbe([], WEEK)
    // Light 60/40: matchFree = 8 + 2; tournament banked 0, practice banked 8.
    expect(withheldFreeWeekRecovery(world, 'tournament')).toBe(10)
    expect(withheldFreeWeekRecovery(world, 'practice')).toBe(2)
    world.plan = { train: 85, rest: 15 }
    expect(withheldFreeWeekRecovery(world, 'tournament')).toBe(8)
    expect(withheldFreeWeekRecovery(world, 'practice')).toBe(0)
  })

  it('a shoot week refunds NOTHING on either path – the travel figure was banked and is owed', () => {
    const world = oracleProbe([WEEK], WEEK)
    expect(adShootHolds(world)).toBe(true)
    expect(withheldFreeWeekRecovery(world, 'tournament')).toBe(0)
    expect(withheldFreeWeekRecovery(world, 'practice')).toBe(0)
  })

  it('inside the college freeze the shoot lapses, so the refund is ORDINARY again – no penalty by any route', () => {
    const world = oracleProbe([WEEK], WEEK)
    world.college = { fromWeek: WEEK - 2, untilWeek: WEEK - 2 + 208, doneWeek: null, years: [], pendingCallUp: null, pendingLeague: null }
    expect(adShootHolds(world)).toBe(false)
    expect(withheldFreeWeekRecovery(world, 'tournament')).toBe(10)
  })
})

describe('step 2.3 – the college freeze lapses a shoot, silently (plan §4c)', () => {
  it('a shoot week inside the freeze charges nothing – the week recovers as the free week it is', () => {
    const WEEK = 216
    const world = createWorld('ad-shoot-freeze', { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.week = WEEK
    world.plan = { train: 60, rest: 40 }
    world.physioActive = false
    world.condition = 50
    world.offers.push({
      id: adOfferId(WEEK - 10),
      kind: 'ad',
      week: WEEK - 10,
      deadlineWeek: WEEK - 7,
      state: 'signed',
      decidedWeek: WEEK - 10,
      fromWeek: WEEK - 10,
      untilWeek: WEEK - 10 + AD.termWeeks - 1,
      terms: { brand: AD.brand, cashCents: AD.cashCents, termWeeks: AD.termWeeks, shootCount: 2, shootWeeks: [WEEK, WEEK + 20] },
    })
    world.college = {
      fromWeek: WEEK - 2,
      untilWeek: WEEK - 2 + 208,
      doneWeek: null,
      years: [],
      pendingCallUp: null,
      pendingLeague: null,
    }
    const eventsBefore = world.events.length
    accrueCondition(world, false)
    // The rest week's own +10: the shoot lapsed, it did not bite. «Мы ни за что не наказываем» –
    // and silently means SILENTLY: no event row, no makeup week appended to the term.
    expect(world.condition).toBe(60)
    expect(world.events.length).toBe(eventsBefore)
    expect((world.offers[world.offers.length - 1].terms as AdOfferTerms).shootWeeks).toEqual([WEEK, WEEK + 20])
    // ...and the same week OUT of the freeze does bite – the control that proves the guard is the
    // freeze and not an accident.
    world.college = null
    world.condition = 50
    accrueCondition(world, false)
    expect(world.condition).toBe(50)
  })
})

describe('step 2.4 – the calendar shows them coming (the D2 marker idiom)', () => {
  const facts = (over: Partial<CalendarWeekFacts>): CalendarWeekFacts =>
    ({
      week: 300,
      plan: { train: 60, rest: 40 },
      profile: { ...DEFAULT_PROFILE },
      injury: null,
      knock: null,
      vacations: [],
      practices: [],
      upcoming: [],
      arrival: null,
      pending: null,
      ...over,
    }) as CalendarWeekFacts

  it('the snapshot carries the signed deal\'s weeks, and only a signed deal\'s', () => {
    const open = structuredClone(life.world)
    expect(toSnapshot(open).adShoot).toBeNull() // arrived, not signed – nothing to mark yet

    const { world, offer } = signedLife()
    const t = offer.terms as AdOfferTerms
    const snap = toSnapshot(world)
    expect(snap.adShoot).toEqual({ brand: AD.brand, weeks: t.shootWeeks })

    // ...and the wire goes quiet when the term does: the marker cannot outlive the deal. (The term
    // is ENDED on the paper rather than the week moved, so the snapshot is read in a week the
    // season has actually generated.)
    offer.untilWeek = world.week - 1
    expect(toSnapshot(world).adShoot).toBeNull()
  })

  it('a shoot week inside the look-ahead window is a row of its own kind, named by the brand', () => {
    const rows = lookAheadFor(facts({ adShoot: { brand: AD.brand, weeks: [305, 330] } }))
    const marked = rows.find((r) => r.week === 305)
    expect(marked).toBeDefined()
    expect(marked!.kind).toBe('shoot')
    expect(marked!.note).toBe(`${AD.brand} shoot`)
    expect(rows.filter((r) => r.kind === 'shoot')).toHaveLength(1) // 330 is past the seven-week window
    // No deal, no marker.
    const bare = lookAheadFor(facts({}))
    expect(bare.every((r) => r.kind !== 'shoot')).toBe(true)
  })

  it('the week stays hers: an entered tournament on the shoot week keeps its tappable marker', () => {
    const rows = lookAheadFor(
      facts({
        adShoot: { brand: AD.brand, weeks: [305] },
        upcoming: [
          {
            id: 'evt-305',
            week: 305,
            tier: 'w100',
            label: 'W100 Harbourside',
            surface: 'hard',
            entered: true,
            eligible: true,
            deadlineWeek: 304,
          } as never,
        ],
      }),
    )
    const row = rows.find((r) => r.week === 305)
    expect(row!.kind).toBe('event') // the tournament genuinely plays – the shoot never blocks
    expect(row!.event).not.toBeNull()
  })
})

// =================================================================================================
// ROUND 28 #2 – HOW LONG THE PARENT ACTUALLY HAS, AND IT IS THE SAME LENGTH WHATEVER WEEK IT LANDS
// =================================================================================================
//
// The owner: «Предложение от спонсора с часами пришло на сорок четвёртой неделе А на сорок восьмой
// уже истёк срок рассмотрения мне казалось мы договаривались про 5 недель». The sponsor with the
// watches is this letter – `ECONOMY.advertising.brand` is a watchmaker – and his arithmetic was
// right: at four weeks a letter filed on W44 died on W47 and was gone when he opened the inbox on
// W48. His memory is the ruling (round 28 #2), so the number moved 4 -> 5.
//
// ⚠ THE NUMBER IS ASSERTED AS A LITERAL HERE, DELIBERATELY, AND IT IS THE ONLY PLACE IN THIS FILE
// THAT DOES. Every other deadline assertion in this file is written as `AD.decideWeeks - 1`, which
// is right for them – they are about the CLOCK and must survive a retune – but it means not one of
// them could have failed when the ruled duration was wrong. A ruling needs a test that breaks when
// the ruling is broken, so this block reads the number the owner said out loud.
//
// ⚠ AND THE SECOND HALF IS WHAT HIS SAVE ACTUALLY DIAGNOSED: the ad letter's clock is PER LETTER,
// not per batch. The kit window's letters deliberately share one deadline – every letter of a
// winter dies when the window closes, so the first carries five weeks and the last carries two
// (`SPONSOR_LETTER_WEEKS`, pinned in tests/offers.test.ts) – and reading that shape onto the
// campaign letter would be a real bug, because an advertising house writes on whatever week it
// notices her and a shared deadline would hand a late letter a window of nothing. So the shelf life
// is measured from SEVERAL different arrival weeks and must come out the same every time.
describe('⚠ ROUND 28 #2 – the campaign letter is five weeks of shelf life, from any arrival week', () => {
  /** The ruled duration, written out rather than read off the constant – see the block header. */
  const RULED_WEEKS = 5

  it('the ruling: five weeks to decide, counted inclusively from the week it lands', () => {
    // «мне казалось мы договаривались про 5 недель» – round 28 #2, and the owner's memory is the
    // spec. The arithmetic is inclusive because that is how the paper counts: `OfferLetter` and
    // `InboxSheet` both print `deadlineWeek - week + 1`, so the arrival week is one of the five and
    // the letter is still answerable on the last of them.
    expect(AD.decideWeeks).toBe(RULED_WEEKS)
  })

  /** Every week inside a span whose own dice say a house writes – so the shelf life is measured on
   *  letters that genuinely arrive on DIFFERENT weeks rather than on one letter inspected twice. */
  function arrivalWeeks(seed: string, from: number, span: number, want: number): number[] {
    const weeks: number[] = []
    for (let w = from; w < from + span && weeks.length < want; w++) {
      if (adWritesAt(seed, w, AD.offerChance)) weeks.push(w)
    }
    return weeks
  }

  const SEED = 'ad-shelf-life'
  const ARRIVALS = arrivalWeeks(SEED, 260, 200, 4)

  it('fixture facts: four genuinely different arrival weeks, and not all of them are quiet ones', () => {
    // Asserted as fixture facts first, the discipline this file already keeps: a retuned
    // `offerChance` that stopped producing four arrivals would fail HERE rather than quietly
    // testing one letter four times.
    expect(ARRIVALS).toHaveLength(4)
    expect(new Set(ARRIVALS).size).toBe(4)
    // ...and at least one lands in a week she is PLAYING, which is what makes this letter's clock a
    // different object from the kit window's: a shared deadline is only even expressible for letters
    // that all arrive inside the same five off-season weeks.
    expect(ARRIVALS.some((w) => !isOffSeasonWeek(w))).toBe(true)
  })

  it('⚠ THE SHELF LIFE: five weeks live, the sixth gone – and it does not depend on the arrival week', () => {
    // The batch-deadline check. Four letters, four different arrival weeks, one shelf life. If the
    // deadline were ever anchored on something SHARED – a window's close, a season's end, a fixed
    // decision week – the later arrivals would come out shorter than the earlier ones, which is
    // exactly the shape the owner's save shows for the KIT letters (`kit-671`, `kit-672` and
    // `kit-673` all expiring together on 675, deliberately). Here it must be flat.
    for (const arrival of ARRIVALS) {
      const world = probeWorld(SEED, arrival, 150, true)
      reviewAdOffer(world)
      const post = adPost(world)
      expect(post, `no letter arrived on week ${arrival}`).toHaveLength(1)
      const offer = post[0]
      expect(offer.week).toBe(arrival)
      // What the paper says, in the paper's own arithmetic: `deadlineWeek - week + 1`.
      expect(offer.deadlineWeek - offer.week + 1, `week ${arrival} got a different shelf life`).toBe(RULED_WEEKS)
      // ...and what the parent can actually DO, week by week, which is the claim the number stands
      // for. Live on all five, including the last; gone on the sixth.
      for (let n = 0; n < RULED_WEEKS; n++) {
        expect(isOfferLive(offer, arrival + n), `dead on week ${n + 1} of ${RULED_WEEKS}`).toBe(true)
      }
      expect(isOfferLive(offer, arrival + RULED_WEEKS)).toBe(false)
    }
  })

  it('⚠ ...and the engine really does take it away on the week after the last one', () => {
    // `isOfferLive` is a predicate; `expireOffers` is the thing that acts. The owner's report is
    // about the second one – he opened the inbox and the letter was gone – so this asks the engine
    // rather than the predicate, from the LAST live week, so it fails if the boundary moves either
    // way.
    const arrival = ARRIVALS[0]
    const world = probeWorld(SEED, arrival, 150, true)
    reviewAdOffer(world)
    const offer = adPost(world)[0]
    world.week = arrival + RULED_WEEKS - 1
    expireOffers(world.offers, world.week)
    expect(offer.state, 'the letter lapsed on the last week he was promised').toBe('open')
    world.week = arrival + RULED_WEEKS
    expireOffers(world.offers, world.week)
    expect(offer.state).toBe('expired')
  })

  it('his own report, replayed: filed on W44, still answerable on W48', () => {
    // The complaint as a sentence the engine can be asked, in the labels he read off the screen.
    // `weekLabel` is 1-based, so his "W44" is season week 43 – the arrival is placed there directly
    // rather than hunted for, because this test is about the arithmetic and not about the dice.
    const world = probeWorld('ad-w44', 300, 150, true)
    const filedOn = Math.floor(300 / 52) * 52 + 43 // season week 43 prints as "W44"
    world.week = filedOn
    raiseAdOffer(
      world.offers,
      world.week,
      { brand: AD.brand, cashCents: AD.cashCents, termWeeks: AD.termWeeks, shootCount: AD.shootWeeksPerTerm },
      world.week + AD.decideWeeks - 1,
    )
    const offer = adPost(world)[0]
    expect(weekLabel(offer.week)).toContain('W44')
    expect(weekLabel(filedOn + 4)).toContain('W48') // the week he came back and found it gone
    expect(isOfferLive(offer, filedOn + 4), 'the letter he came back for on W48 had already lapsed').toBe(true)
    // ...and it is still a real deadline rather than an open-ended one: W49 is too late.
    expect(isOfferLive(offer, filedOn + 5)).toBe(false)
  })
})
