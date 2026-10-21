// ⭐⭐⭐ ROUND 53 №1 – THE COACH PAY LADDER (docs/specs/coach-pay-ladder-2026-10.md §3.1–§3.3, the owner's word of 21.10).
//
// Three claims, each mutation-verified when written (21.10, M7; mutate → red → restore, shasum equal):
//   §A the elite shelf: five sessions at every age band land inside his brackets ($1500–2000 / $2000–3000 / $2250–3250);
//   §B the hitting partner's top rung is never dearer than 60% of the coach's week, and is not offered without one;
//   §C the band is a LETTER: once on entering #11–50 (×1.5 of his labour), once on #1–10 (×2.5 of the original), the
//      market reprices the same week, a refusal ends the arrangement at the season's end, leaving the band keeps
//      the price, nothing below #51.
import { describe, expect, it } from 'vitest'

import { acceptOffer, ageAtWeek, coachMarketLabourCents, coachRateCents, coachRetainerBandOf, createWorld, declineOffer, settleCoachDeal, type WorldState } from '../src/engine/world'
import { resolveCoachBandAsk, resolveCoachBandDeparture } from '../src/engine/world/coachMarket'
import { hiredCoachWeeklyCents } from '../src/engine/world/coachDeal'
import { setSparringRung, sparringTopRungCents, sparringWeeklyCents } from '../src/engine/world/sparring'
import { coachById, coachLabourCents, coachRateBandCents, coachRetainerBand, facilityRateCents } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { coachBandAskId, coachBandAskOf } from '../src/engine/offers'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type CoachTier, type StaffLetterTerms } from '../src/shared/protocol'
import { KID_ID } from '../src/engine/world/constants'

const SESSIONS = 5

function coached(tier: CoachTier = 'elite', seed = 'r53-ladder'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: tier })
  if (!world.coachId) throw new Error('the fixture has no coach')
  settleCoachDeal(world)
  return world
}

/** The house idiom (round42-coach-raise's): a counting W result AND the cache, or `kidLadderRank` answers null. */
function atRank(world: WorldState, rank: number): void {
  world.results.push({ playerId: KID_ID, week: world.week, points: 2000, tier: 'w100' })
  world.kidRankWta = rank
}

function bandLetters(world: WorldState) {
  return world.offers.filter((o) => coachBandAskOf(o) !== null)
}

function heldCoach(world: WorldState) {
  const coach = coachById(world.seed, ageAtWeek(world.week), world.coachId)
  if (!coach) throw new Error('no coach')
  return coach
}

describe('§A the elite shelf – five sessions inside his brackets', () => {
  it('every elite rate at every age band lands its five-session week in the owner\'s bracket', () => {
    const brackets: [number, [number, number]][] = [
      [14, [1500_00, 2000_00]],
      [19, [2000_00, 3000_00]],
      [25, [2250_00, 3250_00]],
    ]
    for (const [age, [lo, hi]] of brackets) {
      const [rLo, rHi] = coachRateBandCents('elite', age)
      expect(rLo * SESSIONS, `elite at ${age}, the cheapest`).toBeGreaterThanOrEqual(lo)
      expect(rHi * SESSIONS, `elite at ${age}, the dearest`).toBeLessThanOrEqual(hi)
    }
  })

  it('high is untouched', () => {
    expect(ECONOMY.coach.hourlyRateCents.high).toEqual([[64_00, 96_00], [80_00, 120_00], [96_00, 144_00]])
  })
})

describe('§B the hitting partner is never dearer than the coach', () => {
  it('with an elite coach the top rung is offered and costs at most 60% of his week', () => {
    const world = coached('elite')
    const top = sparringTopRungCents(world)
    const week = hiredCoachWeeklyCents(world)!
    expect(top).not.toBeNull()
    expect(top!).toBeLessThanOrEqual(Math.round(week * ECONOMY.sparring.topRungCoachShare))
    expect(top!).toBeLessThan(week)
    setSparringRung(world, 2)
    world.sparringHired = true
    expect(sparringWeeklyCents(world), 'the till bills the one function').toBe(top)
  })

  it('without a coach – or beside one too cheap to carry it – the top rung is not offered', () => {
    const world = coached('elite')
    world.coachId = null
    world.coachDeal = null
    expect(sparringTopRungCents(world)).toBeNull()
    expect(() => setSparringRung(world, 2)).toThrow()
    const cheap = coached('budget')
    expect(sparringTopRungCents(cheap)).toBeNull()
  })

  it('a top rung chosen while it was offered bills as the middle rung once it is not', () => {
    const world = coached('elite')
    setSparringRung(world, 2)
    world.sparringHired = true
    world.coachId = null
    world.coachDeal = null
    expect(sparringWeeklyCents(world)).toBe(ECONOMY.sparring.rungs[1].weeklyCents)
  })
})

describe('§C the band is a letter', () => {
  it('the bands: ×1 at #51 and below, ×1.5 at #11–50, ×2.5 at #1–10 (re-aimed 21.10 from ×2 at #100 / ×4.5 at #10)', () => {
    expect(coachRetainerBand(null)).toBe(1)
    expect(coachRetainerBand(100)).toBe(1)
    expect(coachRetainerBand(51)).toBe(1)
    expect(coachRetainerBand(50)).toBe(1.5)
    expect(coachRetainerBand(11)).toBe(1.5)
    expect(coachRetainerBand(10)).toBe(2.5)
    expect(coachRetainerBand(1)).toBe(2.5)
  })

  it('no letter below #51', () => {
    const world = coached()
    atRank(world, 60)
    resolveCoachBandAsk(world)
    expect(bandLetters(world)).toHaveLength(0)
    expect(coachRetainerBandOf(world)).toBe(1)
  })

  it('⭐ entering #11–50: one letter for ×1.5 of his labour, and the market moves the same week', () => {
    const world = coached()
    const coach = heldCoach(world)
    const labour = world.coachDeal!.labourCents
    const marketBefore = coachMarketLabourCents(world, coach)
    atRank(world, 40)
    expect(coachMarketLabourCents(world, coach), 'the market reprices on entry').toBe(
      coachLabourCents(coach.rateCents, ageAtWeek(world.week), coach.tier, 1.5),
    )
    expect(coachMarketLabourCents(world, coach)).toBeGreaterThan(marketBefore)
    expect(coachRateCents(world, coach) - facilityRateCents(ageAtWeek(world.week), coach.tier), 'his own fee waits for the paper').toBe(labour)
    resolveCoachBandAsk(world)
    resolveCoachBandAsk(world)
    const letters = bandLetters(world)
    expect(letters, 'once').toHaveLength(1)
    expect(letters[0].id).toBe(coachBandAskId(world.coachId!, 1.5))
    const ask = (letters[0].terms as StaffLetterTerms).ask!
    expect(ask.toCents - ask.fromCents).toBe(Math.round(labour * 1.5) - labour)
    acceptOffer(world, letters[0].id)
    expect(world.coachDeal!.labourCents).toBe(Math.round(labour * 1.5))
  })

  it('⭐ #1–10: a second letter for ×2.5 of the ORIGINAL labour', () => {
    const world = coached()
    const labour = world.coachDeal!.labourCents
    atRank(world, 40)
    resolveCoachBandAsk(world)
    acceptOffer(world, bandLetters(world)[0].id)
    world.week += 1
    atRank(world, 8)
    resolveCoachBandAsk(world)
    const second = bandLetters(world).find((o) => coachBandAskOf(o)!.band === 2.5)!
    expect(second).toBeDefined()
    acceptOffer(world, second.id)
    expect(world.coachDeal!.labourCents).toBe(Math.round((Math.round(labour * 1.5) / 1.5) * 2.5))
    expect(coachRetainerBandOf(world)).toBe(2.5)
  })

  it('a man hired in the band writes nothing – his hire price was already the banded market', () => {
    const world = coached()
    atRank(world, 30)
    world.coachDeal = { ...world.coachDeal!, markWtaRank: 30 }
    resolveCoachBandAsk(world)
    expect(bandLetters(world)).toHaveLength(0)
  })

  it('leaving the band does not lower the price', () => {
    const world = coached()
    const coach = heldCoach(world)
    atRank(world, 40)
    resolveCoachBandAsk(world)
    acceptOffer(world, bandLetters(world)[0].id)
    const rate = coachRateCents(world, coach)
    world.kidRankWta = 300
    expect(coachRetainerBandOf(world), 'the letter row remembers the entry').toBe(1.5)
    expect(coachRateCents(world, coach)).toBe(rate)
  })

  it('⭐ a refusal ends the arrangement at the season\'s end – not before', () => {
    const world = coached()
    atRank(world, 40)
    resolveCoachBandAsk(world)
    declineOffer(world, bandLetters(world)[0].id)
    resolveCoachBandDeparture(world)
    expect(world.coachId, 'still here this season').not.toBeNull()
    world.week += WEEKS_PER_YEAR
    resolveCoachBandDeparture(world)
    expect(world.coachId, 'gone in the next').toBeNull()
  })

  it('a lapse is a refusal – only a signed letter is a signed letter', () => {
    const world = coached()
    atRank(world, 40)
    resolveCoachBandAsk(world)
    world.week += WEEKS_PER_YEAR
    resolveCoachBandDeparture(world)
    expect(world.coachId).toBeNull()
  })
})
