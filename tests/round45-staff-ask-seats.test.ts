// ROUND 45 #3, THE OTHER TWO SEATS – THE PSYCHOLOGIST AND THE HITTING PARTNER ASK TOO.
//
// The owner: «Письма с прогрессом от специалистов приходят, а повышение они так и не просят, только
// массажист растёт сам по себе тихо ежегодно». B2 made the masseur's raise an open staff letter
// (tests/round45-staff-ask.test.ts is its pattern and stays the masseur's net). This file asks the SAME
// mechanism of the two seats that bill by the WEEK: the anniversary writes ONE open letter, Accept
// moves the derived weekly price (and all three rungs of the dial), Decline and a lapse leave it and
// ⚠ 02.10 FOURTH BATCH (B17): the refused year is BANKED, so the NEXT request carries it – it was «the forgone
// year is not banked, and the NEXT request is one step above what the seat is paid NOW». The coach's principle,
// at the seats' own 2/4/6% scale; the arms of the bank are in tests/round45-staff-ask-floating.test.ts §G.
//
// ⚠ WHAT IS DIFFERENT FROM THE MASSEUR AND IS TESTED ON PURPOSE: a career that predates the papers
// – years served, no request on file – must pay exactly the opening price. The masseur's rule
// (`years − withheld`) would have raised these two seats' bills on the day this shipped, with no
// letter; their baseline is the catalogue price, moved only by the papers the family SIGNED
// (world/staffRaise.ts head note).
//
// ⚠ RE-AIMED 02.10 (ROUND 45 #3b – the owner's «плавающая вилка»). The 4% below is the FLAT-year step: the
// step floats with the year now (good 6% / flat 4% / bad 2%, defaulted) and the fee is the chain of signed
// papers, not an exponent. These worlds bank no season and no season is a flat verdict, so every literal
// anchor is unchanged; the three places that spoke the exponent's language (`staffRateAfter`) are re-aimed
// and say so. The floating arms live in tests/round45-staff-ask-floating.test.ts.
//
// ⚠ ALL COPY UNDER TEST IS DRAFT (invariant 4, docs/rounds/round-45.md «R45 – DRAFT strings»). The 4% is
// a DEFAULTED parameter (the masseur's own `ECONOMY.masseur.raisePerYear`, lent until the owner picks
// one): the literal anchors below name the figures it produces, so a retune says what moved.
//
// ⚠ MUTATION-VERIFIED – each arm is listed in the hand-back and was run against this file and the
// component file next door (tests/component/round45-staff-ask-card.test.ts):
//   M1  `staffFeeCents` ignores the chain (accepting moves nothing).
//   M2  `staffSignedAsks` counts every request, not only the signed (an OPEN letter moves the bill).
//   M3  the psychologist's fee counts the YEARS served (the masseur's legacy rule) instead of the signed asks.
//   M4  the phase never calls `resolvePsychologistRaise` / `resolveSparringRaise` (only the REAL walk sees it).
//   M5  `acceptOffer`'s staff arm has no sparring door (a hitting partner's request cannot be signed).
//   M6  the snapshot's per-rung prices are the flat catalogue again.
//   M10 the service clock resets on a re-hire (only the last span counts), so a release buys the price back.
import { describe, expect, it } from 'vitest'

import {
  acceptOffer,
  createWorld,
  declineOffer,
  hireMasseur,
  hirePsychologist,
  hireSparring,
  masseurRaiseDue,
  masseurSessionCents,
  psychologistWeeklyCents,
  resolveMasseurRaise,
  setPsychologistRung,
  setSparringRung,
  sparringWeeklyCents,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { MASSEUR_CHANGE_KEY } from '../src/engine/world/masseur'
import {
  PSYCHOLOGIST_CHANGE_KEY,
  psychologistRungWeeklyCents,
  resolvePsychologistRaise,
} from '../src/engine/world/psychologist'
import { SPARRING_CHANGE_KEY, resolveSparringRaise, sparringRungWeeklyCents } from '../src/engine/world/sparring'
import { staffFeeCents, staffRaiseDue } from '../src/engine/world/staffRaise'
import {
  expireOffers,
  isOfferLive,
  STAFF_ASK_WINDOW_WEEKS,
  staffAskId,
  staffAskUnit,
  staffAsks,
  staffLetters,
} from '../src/engine/offers'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type StaffLetterTerms } from '../src/shared/protocol'

/** The fee rule spelled out here and NOT taken from the engine's own function. */
const rateAfter = (base: number, y: number): number => Math.round((base * (1 + ECONOMY.masseur.raisePerYear) ** y) / 100) * 100

const ANNIVERSARY = 100 + WEEKS_PER_YEAR

interface Kit {
  seat: 'psychologist' | 'sparring'
  /** The opening price of each rung, off the catalogue. */
  opening: number[]
  defaultRung: number
  /** [opening, after one granted raise, after two] on the DEFAULT rung at the shipped 4%. */
  literal: number[]
  hire: (w: WorldState, on: boolean) => void
  resolve: (w: WorldState) => void
  weekly: (w: WorldState) => number
  rungs: (w: WorldState) => number[]
  setRung: (w: WorldState, rung: number) => void
  billText: string
  key: string
  headline: 'psychologistSalaryCents' | 'sparringSalaryCents'
  rungField: 'psychologistRungSalaryCents' | 'sparringRungSalaryCents'
}

const KITS: Kit[] = [
  {
    seat: 'psychologist',
    opening: ECONOMY.psychologist.rungs.map((r) => r.salaryCents),
    defaultRung: ECONOMY.psychologist.defaultRung,
    literal: [200_00, 208_00, 216_00],
    hire: hirePsychologist,
    resolve: resolvePsychologistRaise,
    weekly: psychologistWeeklyCents,
    rungs: psychologistRungWeeklyCents,
    setRung: setPsychologistRung,
    billText: 'Psychologist – weekly salary',
    key: PSYCHOLOGIST_CHANGE_KEY,
    headline: 'psychologistSalaryCents',
    rungField: 'psychologistRungSalaryCents',
  },
  {
    seat: 'sparring',
    opening: ECONOMY.sparring.rungs.map((r) => r.weeklyCents),
    defaultRung: ECONOMY.sparring.defaultRung,
    literal: [900_00, 936_00, 973_00],
    hire: hireSparring,
    resolve: resolveSparringRaise,
    weekly: sparringWeeklyCents,
    rungs: sparringRungWeeklyCents,
    setRung: setSparringRung,
    billText: 'Hitting partner – weekly salary',
    key: SPARRING_CHANGE_KEY,
    headline: 'sparringSalaryCents',
    rungField: 'sparringRungSalaryCents',
  },
]

function proWorld(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  world.fundsCents = 1_000_000_00
  return world
}

/** Hire at `at`, then stand at `week` – the engine's own hire, so the kept tagged row is production's. */
function seatAt(kit: Kit, at: number, week: number, seed = `r45-seat-${kit.seat}`): WorldState {
  const world = proWorld(seed)
  world.week = at
  kit.hire(world, true)
  world.week = week
  return world
}

describe.each(KITS)('round 45 #3 – the $seat asks, on the masseur`s pattern', (kit) => {
  const open = kit.opening[kit.defaultRung]
  const rate = (y: number): number => rateAfter(open, y)
  const asksOf = (world: WorldState) => staffAsks(world.offers, kit.seat)

  it('premise – the shipped FLAT-year 4% on the default rung produces the literal anchors', () => {
    expect([rate(0), rate(1), rate(2)]).toEqual(kit.literal)
    // ⚠ RE-AIMED 02.10 (#3b): was `staffRateAfter(open, 1) === literal[1]`, the leaf's exponent. A seat with
    // no signed paper pays its BASELINE untouched – the identity the legacy saves rely on.
    expect(staffFeeCents([], kit.seat, open), 'no papers, no drift').toBe(open)
  })

  it('⭐⭐⭐ the anniversary writes ONE open letter with both prices on it, and the BILL does not move until yes', () => {
    const early = seatAt(kit, 100, ANNIVERSARY - 1, `r45-seat-early-${kit.seat}`)
    kit.resolve(early)
    expect(asksOf(early), 'nothing the week before the anniversary').toHaveLength(0)

    const world = seatAt(kit, 100, ANNIVERSARY)
    expect(staffRaiseDue(world, true, kit.key)).toBe(true)
    kit.resolve(world)
    const [letter] = asksOf(world)
    expect(asksOf(world), 'exactly one request').toHaveLength(1)
    expect(letter.state, 'a proposal and not a notice').toBe('open')
    expect(isOfferLive(letter, world.week)).toBe(true)
    expect(letter.deadlineWeek, 'the sponsor letters` four-week window, arrival week included').toBe(
      world.week + STAFF_ASK_WINDOW_WEEKS - 1,
    )
    const terms = letter.terms as StaffLetterTerms
    expect(terms.seat).toBe(kit.seat)
    expect(terms.ask).toEqual({ fromCents: rate(0), toCents: rate(1) })
    expect(terms.weeksServed).toBe(WEEKS_PER_YEAR)
    expect(letter.id).toBe(staffAskId(kit.seat, 1))
    expect(kit.weekly(world), 'the weekly bill is still the price it had').toBe(rate(0))
    kit.resolve(world)
    expect(asksOf(world), 'idempotent on its id').toHaveLength(1)
    expect(staffLetters(world.offers), 'a request is not a year-end report').toHaveLength(0)
  })

  it('⭐⭐ ACCEPT moves the weekly price AND every rung of the dial, and the next request asks one step above', () => {
    const world = seatAt(kit, 100, ANNIVERSARY)
    kit.resolve(world)
    const [letter] = asksOf(world)
    expect(acceptOffer(world, letter.id).state).toBe('signed')
    expect(kit.weekly(world)).toBe(rate(1))
    expect(kit.rungs(world), 'all three rungs drift together').toEqual(kit.opening.map((b) => rateAfter(b, 1)))
    expect(() => acceptOffer(world, letter.id), 'a signed paper cannot be signed twice').toThrow()
    world.week = 100 + 2 * WEEKS_PER_YEAR
    kit.resolve(world)
    const second = asksOf(world).find((o) => o.id === staffAskId(kit.seat, 2))
    expect(second, 'year 2 asks again').toBeDefined()
    expect((second!.terms as StaffLetterTerms).ask).toEqual({ fromCents: rate(1), toCents: rate(2) })
  })

  it('⭐⭐ DECLINE leaves the price, pays and writes nothing – ⚠ 02.10 (B17): the declined year is BANKED in the next request', () => {
    const world = seatAt(kit, 100, ANNIVERSARY)
    kit.resolve(world)
    const [first] = asksOf(world)
    const funds = world.fundsCents
    const events = world.events.length
    declineOffer(world, first.id)
    expect(first.state).toBe('refused')
    expect(kit.weekly(world), 'the price stays').toBe(rate(0))
    expect(world.fundsCents, 'no cash moved').toBe(funds)
    expect(
      world.events.slice(events).filter((e) => e.type === 'expense'),
      'and nothing was charged for saying no',
    ).toHaveLength(0)
    // The next year: ⚠ 02.10 fourth batch (B17) – the request carries the declined year, quoted from what the seat is
    // paid NOW (these worlds bank no season, so both years are the flat 4%). It WAS «one step above what the seat is
    // paid NOW, not two above the opening».
    world.week = 100 + 2 * WEEKS_PER_YEAR
    kit.resolve(world)
    const second = asksOf(world).find((o) => o.id === staffAskId(kit.seat, 2))
    expect((second!.terms as StaffLetterTerms).ask, 'a refused year is BANKED – two steps, from the price he is paid now').toEqual({
      fromCents: rate(0),
      toCents: rate(2),
    })
    acceptOffer(world, second!.id)
    expect(kit.weekly(world), 'one signature pays the declined year as well').toBe(rate(2))
  })

  it('⭐ an unanswered request lapses on the ordinary clock, leaves the price, and cannot be signed late', () => {
    const world = seatAt(kit, 100, ANNIVERSARY)
    kit.resolve(world)
    const [letter] = asksOf(world)
    expireOffers(world.offers, letter.deadlineWeek)
    expect(letter.state, 'still on the table on its last day').toBe('open')
    expireOffers(world.offers, letter.deadlineWeek + 1)
    expect(letter.state).toBe('expired')
    expect(kit.weekly(world)).toBe(rate(0))
    world.week = letter.deadlineWeek + 1
    expect(() => acceptOffer(world, letter.id)).toThrow()
  })

  it('⚠ a live request cannot be accepted once the seat has left the payroll (re-validated engine-side)', () => {
    const world = seatAt(kit, 100, ANNIVERSARY)
    kit.resolve(world)
    const [letter] = asksOf(world)
    kit.hire(world, false)
    expect(() => acceptOffer(world, letter.id)).toThrow()
    expect(letter.state, 'nothing was written').toBe('open')
    expect(() => declineOffer(world, letter.id), 'a refusal is always allowed to say no').not.toThrow()
  })

  it('⭐⭐ a release does not reset the clock – the weeks served before it still count, so firing the seat for a spell buys nothing back', () => {
    // hire at 100, release at 130 (30 weeks served), re-hire at 140: the clock RESUMES at 30 and a whole
    // year is reached 22 weeks later, not 52. `masseurWeeksServedAt`'s own argument: a clock that reset
    // would let a family fire a seat for a week to buy the entry price back.
    const world = proWorld(`r45-seat-rehire-${kit.seat}`)
    world.week = 100
    kit.hire(world, true)
    world.week = 130
    kit.hire(world, false)
    world.week = 140
    kit.hire(world, true)
    world.week = 140 + 21
    expect(staffRaiseDue(world, true, kit.key), 'one week short of the year').toBe(false)
    world.week = 140 + 22
    expect(staffRaiseDue(world, true, kit.key), '30 + 22 weeks is a year').toBe(true)
    kit.resolve(world)
    expect(asksOf(world)).toHaveLength(1)
    expect((asksOf(world)[0].terms as StaffLetterTerms).weeksServed).toBe(WEEKS_PER_YEAR)
  })

  it('⭐⭐⭐ a career that predates the papers – years served, no request on file – keeps paying the opening price', () => {
    // The masseur's rule (`years − withheld`) would put three raises on this bill the moment the seat
    // began to ask. These seats never rose, so nothing is owed until somebody says yes.
    const world = seatAt(kit, 100, 100 + 3 * WEEKS_PER_YEAR)
    expect(asksOf(world)).toHaveLength(0)
    expect(kit.weekly(world), 'three years on the payroll and not a cent nobody asked for').toBe(open)
    expect(kit.rungs(world)).toEqual(kit.opening)
    kit.resolve(world)
    const [letter] = asksOf(world)
    expect(letter.id).toBe(staffAskId(kit.seat, 3))
    expect((letter.terms as StaffLetterTerms).ask, 'its first request is one step above what it pays').toEqual({
      fromCents: rate(0),
      toCents: rate(1),
    })
  })

  it('⭐⭐⭐ a REAL walk: tickWeek writes the request on the anniversary, bills the old price, and the first bill after yes is the new one', () => {
    const world = proWorld(`r45-seat-walk-${kit.seat}`)
    const rng = rngFromSeed(world.seed)
    kit.hire(world, true) // week 0: the tagged row the service clock reads
    for (let w = 0; w < WEEKS_PER_YEAR; w++) tickWeek(world, rng)
    expect(world.week, 'sitting on the anniversary').toBe(WEEKS_PER_YEAR)
    const [letter] = asksOf(world)
    expect(letter, 'the tick wrote it – not this test`s own call').toBeDefined()
    expect(letter.state).toBe('open')
    expect(kit.weekly(world), 'and the price has not moved on its own').toBe(rate(0))
    const rows = () => world.events.filter((e) => e.text === kit.billText)
    const before = rows()
    expect(before.length, 'the seat was billed through the year').toBeGreaterThan(0)
    for (const r of before) expect(-(r.amountCents ?? 0), `week ${r.week} billed at the opening price`).toBe(rate(0))
    acceptOffer(world, letter.id)
    expect(kit.weekly(world)).toBe(rate(1))
    for (let w = 0; w < 6; w++) tickWeek(world, rng)
    const after = rows().filter((r) => r.week > WEEKS_PER_YEAR)
    expect(after.length, 'and the seat is billed again after the answer').toBeGreaterThan(0)
    for (const r of after) expect(-(r.amountCents ?? 0), `week ${r.week} billed at the new price`).toBe(rate(1))
  })

  it('⭐⭐ the raise belongs to the SEAT, not to the rung: switching rung afterwards keeps it', () => {
    const world = seatAt(kit, 100, ANNIVERSARY)
    kit.resolve(world)
    acceptOffer(world, asksOf(world)[0].id)
    kit.setRung(world, 2)
    expect(kit.weekly(world)).toBe(rateAfter(kit.opening[2], 1))
  })

  it('⭐⭐⭐ THE SNAPSHOT CARRIES WHAT THE BILL USES – the headline and every rung, before and after a raise', () => {
    const fresh = toSnapshot(createWorld(`r45-seat-snap-${kit.seat}`, DEFAULT_PROFILE)) as unknown as Record<string, unknown>
    expect(fresh[kit.rungField], 'a career with no papers quotes the catalogue').toEqual(kit.opening)

    const world = seatAt(kit, 100, ANNIVERSARY)
    kit.resolve(world)
    acceptOffer(world, asksOf(world)[0].id)
    const snap = toSnapshot(world) as unknown as Record<string, unknown>
    expect(snap[kit.headline], 'the headline IS the bill').toBe(kit.weekly(world))
    expect(snap[kit.headline]).toBe(rate(1))
    expect(snap[kit.rungField], 'and the dial is the engine`s per-rung price').toEqual(
      kit.opening.map((b) => rateAfter(b, 1)),
    )
  })
})

describe('round 45 #3 – the leaf is the masseur`s own arithmetic, not a second opinion', () => {
  function masseurWorld(): WorldState {
    const world = proWorld('r45-seat-parity')
    world.week = 100
    hireMasseur(world, true)
    return world
  }

  it('⭐⭐ the masseur`s fee after y granted raises IS the last signed paper`s toCents, and each paper quotes what he is paid – for every y a career reaches', () => {
    // ⚠ RE-AIMED 02.10 (#3b). This was `staffRateAfter(opening, y)`: the exponent, rounded ONCE from the
    // unrounded power. With a step that can differ every year there is no power – the fee is the CHAIN of the
    // papers the family signed, each printing its own whole-dollar figures, so the paper IS the fee. (On a
    // flat-year chain at $75 that reads $87 in year 4 where the exponent said $88: the price of «what the
    // letter says is what is billed».)
    const world = masseurWorld()
    let paid: number = ECONOMY.masseur.perSessionCents
    for (let y = 0; y <= 6; y++) {
      expect(masseurSessionCents(world), `after ${y} granted`).toBe(paid)
      world.week = 100 + (y + 1) * WEEKS_PER_YEAR
      resolveMasseurRaise(world)
      const paper = staffAsks(world.offers, 'masseur').find((o) => o.id === staffAskId('masseur', y + 1))!
      const ask = (paper.terms as StaffLetterTerms).ask!
      expect(ask.fromCents, `paper ${y + 1} quotes what he is paid`).toBe(paid)
      acceptOffer(world, paper.id)
      paid = ask.toCents
    }
  })

  it('⭐⭐ staffRaiseDue is masseurRaiseDue, week for week over three years', () => {
    const world = masseurWorld()
    let anniversaries = 0
    for (let w = 100; w <= 100 + 3 * WEEKS_PER_YEAR; w++) {
      world.week = w
      const due = staffRaiseDue(world, true, MASSEUR_CHANGE_KEY)
      expect(due, `week ${w}`).toBe(masseurRaiseDue(world))
      if (due) anniversaries++
    }
    expect(anniversaries, 'one per year of service').toBe(3)
  })

  it('the unit a request is quoted in: the masseur by the session, the two retainers by the week', () => {
    expect(staffAskUnit('masseur')).toBe('session')
    expect(staffAskUnit('psychologist')).toBe('week')
    expect(staffAskUnit('sparring')).toBe('week')
    // ⭐ ROUND 45 #3b – the coach is quoted by the HOUR, the rate his bill is built from.
    expect(staffAskUnit('coach')).toBe('hour')
  })
})
