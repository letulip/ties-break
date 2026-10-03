// ROUND 45 #3 AND #4 – THE STAFF'S RAISE REQUEST, AND THE PSYCHOLOGIST'S CARRIED YEAR.
//
// #3, the owner: «Письма с прогрессом от специалистов приходят, а повышение они так и не просят,
// только массажист растёт сам по себе тихо ежегодно». The masseur's rate used to rise on its own on
// the anniversary, with a feed notice. It is an OPEN LETTER now – the sponsor letters' window and two
// doors – and the rate is DERIVED from the papers the family signed (the chain, `staffFeeCents`), so a
// declined or lapsed request leaves the fee where it was and nothing is persisted for the answer.
//
// ⚠ RE-AIMED 02.10 (ROUND 45 #3b – the owner's «плавающая вилка»). This file was written against B2's
// exponent, `years served − asksWithheld`, at a flat 4%. The step FLOATS with the year now (good 6% / flat 4%
// / bad 2%, defaulted) and the fee is the chain of the signed papers, so the two assertions that spoke the
// exponent's language (`staffAsksWithheld`) ask the chain's question instead. ⚠ Every figure below is the
// FLAT-year 4%: these worlds bank no season, and no season is a flat verdict (`staffYearVerdict`). The
// floating arms – a good year asks for more than a bad one, the chain, the legacy baseline, the coach's
// letter – are tests/round45-staff-ask-floating.test.ts.
//
// ⚠ RE-AIMED AGAIN 02.10 (B17, the FOURTH BATCH: «можно принцип сделать похожим, но размер немного изменить для
// supportов»). The DECLINE arm said the declined year was forgone – the next request one step above what he is paid.
// The seats adopted the coach's principle at their own scale: a refused year is BANKED in the next ask. The
// arms of the bank are in the floating file's §G; this file keeps the one-year figures.
//
// #4, the owner: «если игрок забыл выбрать направление, то оставалось предыдущее. А в письме
// следующего года писать "мы не выбрали новое, поэтому работали по предыдущему"». The engine never
// cleared the direction; what was missing was the letter SAYING so.
//
// ⚠ ALL COPY UNDER TEST IS DRAFT (invariant 4, docs/rounds/round-45.md «R45 – DRAFT strings»); the
// assertions are about structure and figures, never a whole sentence.
//
// ⚠ MUTATION-VERIFIED – the arms are listed in the hand-back and run against this file:
//   M1  `masseurSessionCents` ignores the signed papers (the baseline alone: the OLD silent rise's exponent).
//   M2  `staffSignedAsks` drops the signed ones (accepting moves nothing).
//   M3  the carry-over stamp test is `<=` (an ANSWERED year reads as carried).
//   M4  the carry-over fact is never written (the letter goes quiet again).
import { describe, expect, it } from 'vitest'

import {
  acceptOffer,
  createWorld,
  declineOffer,
  hireMasseur,
  hirePsychologist,
  masseurRaiseDue,
  masseurSessionCents,
  masseurWeeklyCents,
  resolveMasseurRaise,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { psychologistFocusOpen, psychologistWorkingRung, setPsychologistFocus } from '../src/engine/world/psychologist'
import {
  expireOffers,
  isOfferLive,
  STAFF_ASK_WINDOW_WEEKS,
  staffAskId,
  staffAsks,
  staffLetters,
} from '../src/engine/offers'
import { staffSignedAsks } from '../src/engine/world/staffRaise'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type Offer, type StaffLetterTerms } from '../src/shared/protocol'

const PLAYED = 49
const OPENING = ECONOMY.masseur.perSessionCents
/** The rate after `y` GRANTED raises, spelled out here and not taken from the engine's own function. */
const rateAfter = (y: number): number => Math.round((OPENING * (1 + ECONOMY.masseur.raisePerYear) ** y) / 100) * 100
const SESSIONS = ECONOMY.masseur.defaultSessions

function proWorld(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  world.fundsCents = 1_000_000_00
  return world
}

/** Hire at `at`, then stand at `week` – the engine's own hire, so the kept tagged row is production's. */
function masseurAt(at: number, week: number, seed = 'r45-ask'): WorldState {
  const world = proWorld(seed)
  world.week = at
  hireMasseur(world, true)
  world.week = week
  return world
}

const ANNIVERSARY = 100 + WEEKS_PER_YEAR
const askOf = (world: WorldState) => staffAsks(world.offers, 'masseur')

describe('round 45 #3 A – the anniversary writes a LETTER and the rate waits for the answer', () => {
  it('⭐⭐⭐ ONE open letter on the anniversary, both rates on it, and the BILL does not move until yes', () => {
    const world = masseurAt(100, ANNIVERSARY)
    expect(masseurRaiseDue(world)).toBe(true)
    resolveMasseurRaise(world)
    const [letter] = askOf(world)
    expect(askOf(world), 'exactly one request').toHaveLength(1)
    expect(letter.state, 'a proposal and not a notice').toBe('open')
    expect(isOfferLive(letter, world.week)).toBe(true)
    expect(letter.deadlineWeek, 'the sponsor letters` four-week window, arrival week included').toBe(
      world.week + STAFF_ASK_WINDOW_WEEKS - 1,
    )
    const terms = letter.terms as StaffLetterTerms
    expect(terms.ask).toEqual({ fromCents: rateAfter(0), toCents: rateAfter(1) })
    expect(terms.seat).toBe('masseur')
    // THE SILENT INDEX IS DEAD: the old site moved the live rate here. It must not.
    expect(masseurSessionCents(world), 'the rate is still the one he had').toBe(rateAfter(0))
    expect(masseurWeeklyCents(world), 'and so is the weekly bill').toBe(SESSIONS * rateAfter(0))
    expect(world.events.some((e) => e.text.startsWith("The masseur's rate rises")), 'no silent feed notice').toBe(false)
    // idempotent on its id
    resolveMasseurRaise(world)
    expect(askOf(world)).toHaveLength(1)
    expect(letter.id).toBe(staffAskId('masseur', 1))
  })

  it('⭐⭐ ACCEPT moves the fee – the rate and the weekly bill read it', () => {
    const world = masseurAt(100, ANNIVERSARY)
    resolveMasseurRaise(world)
    const [letter] = askOf(world)
    const signed = acceptOffer(world, letter.id)
    expect(signed.state).toBe('signed')
    expect(masseurSessionCents(world)).toBe(rateAfter(1))
    expect(masseurWeeklyCents(world)).toBe(SESSIONS * rateAfter(1))
    // ⚠ RE-AIMED 02.10 (#3b): was `staffAsksWithheld(...) === 0`, the exponent's count of un-granted asks. The
    // fee is the chain of signed papers now, so the question is whether this paper ENTERED the chain – and
    // that what it printed is what is billed.
    expect(staffSignedAsks(world.offers, 'masseur').map((o) => o.id)).toEqual([letter.id])
    expect((signed.terms as StaffLetterTerms).ask!.toCents, 'the paper IS the fee').toBe(masseurSessionCents(world))
    expect(() => acceptOffer(world, letter.id), 'a signed paper cannot be signed twice').toThrow()
  })

  it('⭐⭐⭐ signing a raise NEVER touches the sponsor deal she is wearing – the paper signs on its own arm', () => {
    // `signOffer` below its sale/ad arms is KIT arithmetic: a signature ENDS a running kit deal
    // (`superseded`). A masseur's raise falling into that would end her contract. A signed kit deal
    // is planted in the inbox and must come through the signature byte for byte (mutation M7).
    const world = masseurAt(100, ANNIVERSARY)
    resolveMasseurRaise(world)
    const kit = {
      id: 'kit-guard',
      kind: 'kit',
      week: 0,
      deadlineWeek: 0,
      state: 'signed',
      fromWeek: 0,
      untilWeek: 100_000,
      terms: {},
    } as unknown as Offer
    world.offers.push(kit)
    const [letter] = askOf(world)
    acceptOffer(world, letter.id)
    expect(kit.untilWeek, 'her sponsor deal runs exactly as long as it did').toBe(100_000)
    expect(world.offers.some((o) => o.id.startsWith('kit-end-')), 'and nobody wrote its goodbye').toBe(false)
  })

  it('⭐⭐ DECLINE leaves the fee, writes nothing else – ⚠ 02.10 (B17): the declined year is BANKED in the next ask, not forgone', () => {
    const world = masseurAt(100, ANNIVERSARY)
    resolveMasseurRaise(world)
    const [first] = askOf(world)
    const funds = world.fundsCents
    const events = world.events.length
    declineOffer(world, first.id)
    expect(first.state).toBe('refused')
    expect(masseurSessionCents(world), 'the fee stays').toBe(rateAfter(0))
    expect(world.fundsCents, 'no punishment: no money moved').toBe(funds)
    expect(world.events.length, 'and no feed row, no mood, nothing').toBe(events)
    // A year later he asks again – ⚠ 02.10 fourth batch (B17): the declined year is BANKED, so the request is both
    // years' steps above what he actually has (these worlds bank no season, so each is the flat 4%). It WAS «one
    // step above what he actually has, never two»; the coach's principle, adopted at the seats' own scale, ruled otherwise.
    world.week = 100 + 2 * WEEKS_PER_YEAR
    resolveMasseurRaise(world)
    const second = askOf(world).find((o) => o.id === staffAskId('masseur', 2))!
    expect((second.terms as StaffLetterTerms).ask).toEqual({ fromCents: rateAfter(0), toCents: rateAfter(2) })
    acceptOffer(world, second.id)
    expect(masseurSessionCents(world), 'one signature pays the declined year as well').toBe(rateAfter(2))
  })

  it('⭐ an unanswered request lapses on the ordinary clock, leaves the fee, and cannot be signed late', () => {
    const world = masseurAt(100, ANNIVERSARY)
    resolveMasseurRaise(world)
    const [letter] = askOf(world)
    expireOffers(world.offers, letter.deadlineWeek)
    expect(letter.state, 'still open on its last day').toBe('open')
    expireOffers(world.offers, letter.deadlineWeek + 1)
    expect(letter.state).toBe('expired')
    expect(masseurSessionCents(world)).toBe(rateAfter(0))
    world.week = letter.deadlineWeek + 1
    expect(() => acceptOffer(world, letter.id)).toThrow(/gone/)
  })

  it('⚠ a live request cannot be accepted once the masseur has left the payroll (re-validated engine-side)', () => {
    const world = masseurAt(100, ANNIVERSARY)
    resolveMasseurRaise(world)
    const [letter] = askOf(world)
    hireMasseur(world, false)
    expect(() => acceptOffer(world, letter.id)).toThrow()
    expect(letter.state, 'and nothing was written').toBe('open')
    expect(() => declineOffer(world, letter.id), 'a refusal is always allowed to say no').not.toThrow()
  })

  it('⚠ a career with NO request papers keeps every raise it was already paying (no migration needed)', () => {
    const world = masseurAt(100, 100 + 3 * WEEKS_PER_YEAR)
    // ⚠ RE-AIMED 02.10 (#3b): was `staffAsksWithheld(...) === 0`. No papers is no chain, and no chain is the
    // baseline untouched – the exponent over the years he has served, exactly what he was paying.
    expect(askOf(world), 'no request papers on file').toHaveLength(0)
    expect(masseurSessionCents(world), 'three silent raises, as shipped before this round').toBe(rateAfter(3))
  })
})

describe('round 45 #3 B – a REAL tick on the anniversary writes the letter and bills the old rate', () => {
  it('⭐⭐⭐ tickWeek itself raises the request – not this test`s own call', () => {
    const world = proWorld('r45-ask-tick')
    const rng = rngFromSeed(world.seed)
    hireMasseur(world, true) // week 0: the tagged row the service clock reads
    for (let w = 0; w < WEEKS_PER_YEAR; w++) tickWeek(world, rng)
    expect(world.week, 'sitting on the anniversary').toBe(WEEKS_PER_YEAR)
    const [letter] = askOf(world)
    expect(letter, 'the tick wrote it').toBeDefined()
    expect(letter.state).toBe('open')
    expect(masseurSessionCents(world), 'and the rate has not moved on its own').toBe(rateAfter(0))
    const billed = world.events
      .filter((e) => e.week === WEEKS_PER_YEAR && e.category === 'staff' && (e.amountCents ?? 0) < 0)
      .reduce((sum, e) => sum + (e.amountCents ?? 0), 0)
    expect(billed, 'that week`s bill is at the rate he had').toBe(-SESSIONS * rateAfter(0))
    acceptOffer(world, letter.id)
    expect(masseurSessionCents(world)).toBe(rateAfter(1))
  })
})

describe('round 45 #4 – an unanswered psychologist year carries the previous direction, and the NEXT letter says so', () => {
  const walk = (seed: string, repickAtWeek: number | null) => {
    const world = proWorld(seed)
    const rng = rngFromSeed(world.seed)
    hirePsychologist(world, true)
    setPsychologistFocus(world, 'coolhead') // the choice for season 0
    for (let w = 0; w < WEEKS_PER_YEAR + PLAYED; w++) {
      tickWeek(world, rng)
      if (repickAtWeek !== null && world.week === repickAtWeek) setPsychologistFocus(world, 'coolhead')
    }
    const letters = staffLetters(world.offers)
      .filter((o) => (o.terms as StaffLetterTerms).seat === 'psychologist')
      .map((o) => o.terms as StaffLetterTerms)
    return { world, letters }
  }

  it('⭐⭐⭐ the direction persists, the week was never blocked, and season 1`s letter carries the stamp it was chosen for', () => {
    const { world, letters } = walk('r45-psy-ignored', null)
    expect(world.psychologistFocus, 'nothing cleared it').toBe('coolhead')
    expect(psychologistWorkingRung(world, 'coolhead'), 'and the seat is still WORKING it').not.toBeUndefined()
    expect(psychologistFocusOpen(world).length, 'the choice was never forced – it is still on offer').toBeGreaterThan(0)
    expect(letters.map((t) => t.seasonIndex)).toEqual([0, 1])
    expect(letters[0].focus).toBe('coolhead')
    expect(letters[0].focusCarriedFrom, 'season 0 was chosen: no carry-over').toBeUndefined()
    expect(letters[1].focus, 'season 1 was never chosen, so the previous direction is named').toBe('coolhead')
    expect(letters[1].focusCarriedFrom, 'with the season it was last chosen for – real data').toBe(0)
  })

  it('⭐⭐ an ANSWERED year is not a carried one – re-choosing the same direction counts as choosing', () => {
    const { letters } = walk('r45-psy-answered', 50) // an off-season pick buys season 1
    expect(letters.map((t) => t.seasonIndex)).toEqual([0, 1])
    expect(letters[1].focus).toBe('coolhead')
    expect(letters[1].focusCarriedFrom, 'chosen for season 1, so nothing was carried').toBeUndefined()
  })
})
