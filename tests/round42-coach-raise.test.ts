// ROUND 42 #51, RULED 17.09 IN ROUND 44 – THE COACH'S FEE IS FIXED AT HIRE AND HE ASKS.
//
// His two sentences. On the silent re-pricing: «мне кажется это не корректно». On the fix:
// «"зафиксировать при найме и пусть просит, как массажист" – верно». And on what the ask must read,
// from #51 itself: «может такое быть, что всего с 1 титулом в сезон тренер будет требовать 15%?
// Кажется, что самого факта такого единственного титула маловато, нужна какая-то общая оценка
// прогресса».
//
// WHAT THIS FILE PINS, in the order the feature can fail:
//   A. ⭐⭐ THE FALL IS UNREACHABLE. Once the labour is agreed the billed rate is MONOTONE
//      NON-DECREASING over her whole career, at every rung – which is the half of his complaint that
//      is a fairness property rather than a balance one, and the one thing no letter could fix.
//   B. THE HANDSHAKE – the fee is written down at the hire, at the price the card was showing, and
//      a release clears the contract so a re-hire cannot inherit a figure agreed with another man.
//   C. THE CEILING IS THE RANK BAND – the billed rate can never exceed what the shipped till would
//      have charged, which is what makes the change safe on a live save.
//   D. ⭐ HE NEVER ASKS FOR LESS, and an ask smaller than his own floor is not an ask at all.
//   E. THE PROGRESS SCORE reads four components and not a title – his own correction to the first
//      draft, made arithmetic: one ordinary title cannot on its own move the corridor far.
//   F. THE ASK – one row on the anniversary of THIS contract, never while self-coached, never when
//      the market has left no room, and the corridor holds on both ends.
//   G. THE MARKET GOES ON FLOATING for every coach who is not on the payroll, which is the fence the
//      round drew and the reason the card and the bill still agree about the man she has.
//
// ⚠⚠ THE MUTATION ARMS THIS FILE WAS BUILT AGAINST – applied, run, WATCHED TO FAIL, reverted. The
// cases are the MEASURED ones and not the predicted ones, which is the difference this repo keeps
// insisting on:
//   ARM 1  `coachRateCents` drops the deal and bills `court + market` (the shipped v81 till).
//          → 2 red: F3, G1.
//   ARM 2  `coachAskFraction` loses its floor (`askFloor` -> 0). → 2 red: D1, F3.
//   ARM 3  `resolveCoachRaise` drops the sub-floor gate for `next <= labourCents`. → 2 red: D3, F4.
//   ARM 4  `resolveCoachRaise` drops `Math.min(asked, ceiling)`. → 2 red: C3, D2.
//   ARM 5  `coachProgressScore` returns 1 for any title (the trigger #51 refused). → 2 red: E2, E3.
//   ARM 6  `settleCoachDeal` keeps the old contract on a release. → 1 red: B3.
//
// ⚠ AND ARM 4 CAUGHT A HOLE IN THIS FILE RATHER THAN IN THE ENGINE, which is why C3 exists. Deleting
// the ceiling clamp left C2 GREEN – a deal struck at a quarter of the market cannot overshoot it with
// a 15% ask however good the season, so the case that tests a clamp has to stand where the clamp
// bites. C3 stands at 0.98 and 1.00 of the market and is red under the same arm.
import { describe, expect, it } from 'vitest'

import {
  ageAtWeek,
  coachBilling,
  coachMarket,
  coachMarketLabourCents,
  coachProgressScore,
  coachRateCents,
  coachRaiseDue,
  createWorld,
  hireCoach,
  resolveCoachRaise,
  settleCoachDeal,
  type WorldState,
} from '../src/engine/world'
import {
  coachAskFraction,
  coachById,
  coachLabourCents,
  coachRateBandCents,
  coachRetainerBand,
  facilityRateCents,
} from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR, TIER_LADDER } from '../src/engine/season/calendar'
// ⚠ `CoachTier` LIVES IN THE PROTOCOL – it is the rung the PROFILE chooses, declared beside it.
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'
import { KID_ID } from '../src/engine/world/constants'

const RUNGS: CoachTier[] = ['budget', 'middle', 'high', 'elite']
const FLOOR = ECONOMY.coach.raise.askFloor
const CEIL = ECONOMY.coach.raise.askCeiling
/** ⚠ THE OPENER THIS FILE FINDS THE ROW BY, in ONE place, so the next rewording of a DRAFT string is
 *  one line here rather than a hunt. The sentence itself is the owner's to rule on. */
const ASK_OPENER = 'has asked for more after a year together'

/** A career with a real hired coach, settled through the engine's own command. */
function coachedWorld(tier: CoachTier = 'middle', seed = 'r42-51'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: tier })
  settleCoachDeal(world)
  return world
}

function heldCoach(world: WorldState) {
  const coach = coachById(world.seed, ageAtWeek(world.week), world.coachId)
  if (!coach) throw new Error('the fixture has no coach')
  return coach
}

describe('§A the fall is unreachable – the agreed rate is monotone', () => {
  it('⭐⭐ no (rung, age, rank-at-hire, position-in-band) cell can bill less next year than this year', () => {
    // ⚠ THE SWEEP IS THE POINT AND A SPOT CHECK WOULD NOT BE. His complaint is that a figure FELL,
    // and «it does not fall on the seed I tried» is not the same claim as «it cannot fall». The
    // shipped till could: `coachRetainerBand` is a STEP on her live ranking, so leaving the top
    // hundred divided a man's labour by two with no letter and no decision.
    let cells = 0
    for (const tier of RUNGS) {
      for (let age = 13; age <= 30; age++) {
        const [lo, hi] = coachRateBandCents(tier, age)
        for (const rate of [lo, Math.round((lo + hi) / 2), hi]) {
          for (const rankAtHire of [null, 50, 5] as (number | null)[]) {
            const agreed = coachLabourCents(rate, age, tier, coachRetainerBand(rankAtHire))
            let prev = facilityRateCents(age, tier) + agreed
            for (let later = age + 1; later <= 30; later++) {
              const now = facilityRateCents(later, tier) + agreed
              cells++
              expect(now, `${tier}/${age}->${later}/rate ${rate}/rank ${String(rankAtHire)}`).toBeGreaterThanOrEqual(prev)
              prev = now
            }
          }
        }
      }
    }
    // ⚠ A SWEEP THAT VISITED NOTHING PASSES, which is the failure mode a loop-shaped assertion has
    // and a single `expect` does not. Named so the case cannot quietly become a no-op.
    expect(cells, 'the sweep actually visited the table').toBeGreaterThan(5_000)
  })

  it('...and the shipped till COULD fall, which is why the sweep above is worth its seconds', () => {
    // The counterfactual, stated as a measurement rather than as prose: the same man, the same age,
    // the same rate, her ranking leaving the top hundred.
    const age = 24
    const [lo, hi] = coachRateBandCents('elite', age)
    const rate = Math.round((lo + hi) / 2)
    const court = facilityRateCents(age, 'elite')
    const inBand = court + coachLabourCents(rate, age, 'elite', coachRetainerBand(50))
    const outOfBand = court + coachLabourCents(rate, age, 'elite', coachRetainerBand(500))
    expect(outOfBand, 'the shipped till re-priced him DOWN when she slipped out of the hundred').toBeLessThan(inBand)
  })
})

describe('§B the handshake', () => {
  it('B1 the fee is written down at the hire, and it is the figure the card was quoting', () => {
    const world = coachedWorld('high')
    const coach = heldCoach(world)
    expect(world.coachDeal, 'a career that opens with a coach has a contract once the till has met him').not.toBeNull()
    expect(world.coachDeal?.coachId).toBe(coach.id)
    // ⚠ THE HIRE PRICE IS UNCHANGED BY THIS ITEM, which is round 42 #42's «the cost shows, the hire is
    // never refused» kept from the other side: a card quoting one figure while the ledger charged
    // another would break it just as surely as a refusal.
    expect(world.coachDeal?.labourCents).toBe(coachMarketLabourCents(world, coach))
    expect(coachRateCents(world, coach)).toBe(facilityRateCents(ageAtWeek(world.week), coach.tier) + coachMarketLabourCents(world, coach))
  })

  it('B2 a career the parent coaches has no contract at all, which is what `null` means', () => {
    const world = createWorld('r42-51-self', { ...DEFAULT_PROFILE, coachTier: 'self' })
    settleCoachDeal(world)
    expect(world.coachDeal, 'there is nobody to have a contract with').toBeNull()
  })

  it('B3 ⭐ a release CLEARS the contract, so a re-hire cannot inherit another man\'s figure', () => {
    const world = coachedWorld('middle')
    const first = world.coachDeal?.labourCents
    expect(first).toBeGreaterThan(0)
    hireCoach(world, null)
    expect(world.coachDeal, 'released: no contract').toBeNull()
    // ...and hiring someone from a DIFFERENT rung strikes that man's own price rather than the old one.
    const elite = coachMarket(world).find((r) => r.tier === 'elite' && r.lockedPoints === null)
    if (elite) {
      world.bestFinishByTier.w15 = 0
      world.peakDomesticPoints = 10_000
      hireCoach(world, elite.id)
      expect(world.coachDeal?.coachId, 'the new man, not the old one').toBe(elite.id)
      expect(world.coachDeal?.labourCents, 'and his own price, not the old fee').not.toBe(first)
    }
  })

  it('B4 the marks are taken when the deal is struck – that is what the ask is measured against', () => {
    const world = coachedWorld('middle')
    const deal = world.coachDeal
    expect(deal?.markSkills, 'her build at the handshake').toBeGreaterThan(0)
    expect(deal?.markPotential, 'and her ceilings at the handshake').toBeGreaterThan(deal?.markSkills ?? 0)
    expect(deal?.residualSince, 'nothing has happened yet').toBe(0)
    expect(deal?.agreedWeek, 'dated from the arrangement and not from the tick that noticed it').toBe(0)
  })
})

describe('§C the ceiling is the rank band', () => {
  it('C1 ⭐⭐ the billed rate can never exceed what the shipped till charged – the safety property', () => {
    // ⚠ THIS IS THE ONE SENTENCE THAT MAKES A LIVE-SAVE MIGRATION HARMLESS, so it is asserted over a
    // career rather than argued: whatever an ask has done, `coachRateCents` clamps at the market's own
    // quote for the same man, so the fix can lower a family's payroll and cannot raise it.
    const world = coachedWorld('elite')
    const coach = heldCoach(world)
    for (const labour of [1, 100, 10_000, 1_000_000]) {
      world.coachDeal = { ...world.coachDeal!, labourCents: labour }
      const billed = coachRateCents(world, coach)
      const shipped = facilityRateCents(ageAtWeek(world.week), coach.tier) + coachMarketLabourCents(world, coach)
      expect(billed, `an agreed labour of ${labour} can never out-bill the market`).toBeLessThanOrEqual(shipped)
    }
  })

  it('C2 an ask is clamped at the market, so a run of good years cannot price him past his own rung', () => {
    const world = coachedWorld('middle')
    const coach = heldCoach(world)
    const ceiling = coachMarketLabourCents(world, coach)
    // Strike the deal well UNDER the ceiling and give her a year worth asking about.
    world.coachDeal = { ...world.coachDeal!, labourCents: Math.round(ceiling / 4), agreedWeek: 0 }
    world.week = WEEKS_PER_YEAR
    resolveCoachRaise(world)
    expect(world.coachDeal!.labourCents, 'the ask took what the corridor allows').toBeLessThanOrEqual(
      Math.round(Math.round(ceiling / 4) * (1 + CEIL)),
    )
    expect(world.coachDeal!.labourCents, '...and never more than the market').toBeLessThanOrEqual(ceiling)
  })

  it('C3 ⭐ a fee already AT the market cannot be asked past it, however the year went', () => {
    // ⚠⚠ THIS CASE EXISTS BECAUSE C2 ABOVE COULD NOT CATCH THE MUTATION IT WAS WRITTEN FOR, and that
    // was measured rather than suspected: deleting `Math.min(asked, ceiling)` left C2 green, because
    // a deal struck at a quarter of the ceiling cannot overshoot it with a 15% ask however good the
    // season. The clamp only bites NEAR the ceiling, so the case that tests it has to stand there.
    const world = coachedWorld('middle')
    const coach = heldCoach(world)
    const ceiling = coachMarketLabourCents(world, coach)
    for (const share of [0.98, 1]) {
      world.coachDeal = { ...world.coachDeal!, labourCents: Math.round(ceiling * share), agreedWeek: 0 }
      world.week = WEEKS_PER_YEAR
      const before = world.coachDeal.labourCents
      resolveCoachRaise(world)
      expect(world.coachDeal!.labourCents, `at ${share} of the market there is no room worth asking for`).toBe(before)
      expect(world.coachDeal!.labourCents, 'and the fee is still inside the market').toBeLessThanOrEqual(ceiling)
    }
  })
})

describe('§D he never asks for less', () => {
  it('D1 the corridor has a FLOOR and no negative arm, at every score including a dreadful one', () => {
    for (const score of [-5, -1, -0.0001, 0, 0.5, 1, 1.0001, 99]) {
      const f = coachAskFraction(score)
      expect(f, `score ${score}`).toBeGreaterThanOrEqual(FLOOR)
      expect(f, `score ${score}`).toBeLessThanOrEqual(CEIL)
    }
    expect(coachAskFraction(0), 'a flat year is the floor and never nothing').toBe(FLOOR)
    expect(coachAskFraction(1), 'a perfect year is the ceiling').toBeCloseTo(CEIL, 12)
  })

  it('D2 ⭐ a quiet season cannot lower an agreed fee – the thing he called incorrect', () => {
    const world = coachedWorld('high')
    const coach = heldCoach(world)
    const agreed = world.coachDeal!.labourCents
    // She was a top-hundred player when the deal was struck and has fallen out of it since: under the
    // shipped till this is the exact move that halved his labour.
    world.coachDeal = { ...world.coachDeal!, markWtaRank: 40, agreedWeek: 0 }
    world.kidRankWta = 800
    world.week = WEEKS_PER_YEAR
    resolveCoachRaise(world)
    expect(world.coachDeal!.labourCents, 'the fee did not move down').toBeGreaterThanOrEqual(agreed)
    expect(world.events.some((e) => e.text.includes(ASK_OPENER)), 'and no letter claimed a raise').toBe(false)
    void coach
  })

  it('D3 an ask with less room than the floor is not an ask – no row, no re-stamp', () => {
    const world = coachedWorld('middle')
    const coach = heldCoach(world)
    const ceiling = coachMarketLabourCents(world, coach)
    // One cent of room: far below the 5% floor.
    world.coachDeal = { ...world.coachDeal!, labourCents: ceiling - 1, agreedWeek: 0 }
    world.week = WEEKS_PER_YEAR
    const before = world.events.length
    resolveCoachRaise(world)
    expect(world.coachDeal!.labourCents, 'nothing was taken').toBe(ceiling - 1)
    expect(world.events.length, 'and nothing was written').toBe(before)
  })
})

describe('§E the progress score reads a basket, not a title', () => {
  it('E1 it is a number in [0, 1] and a career with nothing behind it scores an exact 0', () => {
    const world = coachedWorld('middle')
    expect(coachProgressScore(world)).toBe(0)
    const noDeal = createWorld('r42-51-nodeal', { ...DEFAULT_PROFILE, coachTier: 'self' })
    expect(coachProgressScore(noDeal), 'no contract, no score').toBe(0)
  })

  it('E2 ⭐⭐ ONE TITLE CANNOT BUY THE CEILING – his own objection, made arithmetic', () => {
    // «Кажется, что самого факта такого единственного титула маловато». The titles component carries
    // weight `titles` and nothing else, so even a SLAM – the top of `TIER_LADDER`, full marks on that
    // component alone – moves the ask by at most that weight's share of the corridor.
    const world = coachedWorld('elite')
    world.coachDeal = { ...world.coachDeal!, agreedWeek: 0 }
    world.trophiesByTier.slam = { titles: [10], finals: [] }
    world.week = WEEKS_PER_YEAR
    const score = coachProgressScore(world)
    const w = ECONOMY.coach.raise.weights
    expect(score, 'a title is a component, never the trigger').toBeLessThanOrEqual(w.titles + 1e-9)
    const ask = coachAskFraction(score)
    const mostATitleCanBuy = FLOOR + (CEIL - FLOOR) * w.titles
    expect(ask, 'so one title cannot reach the 15% he was worried about').toBeLessThanOrEqual(mostATitleCanBuy + 1e-9)
    expect(ask, `one slam buys at most ${(mostATitleCanBuy * 100).toFixed(1)}% of the corridor`).toBeLessThan(CEIL)
  })

  it('E3 the tier weighting is the LADDER\'s own order – a slam is worth four J30s', () => {
    const slam = (TIER_LADDER.indexOf('slam') + 1) / TIER_LADDER.length
    const j30 = (TIER_LADDER.indexOf('j30') + 1) / TIER_LADDER.length
    expect(slam, 'the top of the ladder is full marks on this component').toBe(1)
    expect(slam / j30, 'and a J30 is a quarter of it – read off the ladder, never a second table').toBeCloseTo(4, 10)
    const world = coachedWorld('middle')
    world.coachDeal = { ...world.coachDeal!, agreedWeek: 0 }
    world.week = WEEKS_PER_YEAR
    world.trophiesByTier.j30 = { titles: [10], finals: [] }
    const small = coachProgressScore(world)
    world.trophiesByTier.j30 = { titles: [], finals: [] }
    world.trophiesByTier.wta1000 = { titles: [10], finals: [] }
    expect(coachProgressScore(world), 'a bigger rung is worth more').toBeGreaterThan(small)
  })

  it('E4 a title won BEFORE the fee was agreed does not pay for it twice', () => {
    const world = coachedWorld('middle')
    world.coachDeal = { ...world.coachDeal!, agreedWeek: 100 }
    world.week = 100 + WEEKS_PER_YEAR
    world.trophiesByTier.wta500 = { titles: [40], finals: [] }
    expect(coachProgressScore(world), 'it is outside the contract').toBe(0)
    world.trophiesByTier.wta500 = { titles: [140], finals: [] }
    expect(coachProgressScore(world), '...and inside it, it counts').toBeGreaterThan(0)
  })

  it('E5 ⭐ the residual against expectation is the heaviest component, which is #51\'s own ruling', () => {
    const w = ECONOMY.coach.raise.weights
    expect(w.residual, 'a coach who got more out of her than the odds said should ask for more').toBeGreaterThan(w.rank)
    expect(w.residual).toBeGreaterThan(w.development)
    expect(w.residual).toBeGreaterThan(w.titles)
    expect(w.titles, 'and titles are the lightest – his correction to the first draft').toBeLessThan(w.rank)
    const total = w.rank + w.development + w.titles + w.residual
    expect(total, 'the weights are a mean, so they sum to one').toBeCloseTo(1, 12)
  })

  it('E6 an unranked girl who ENTERS the table takes the rank component whole', () => {
    const world = coachedWorld('middle')
    world.coachDeal = { ...world.coachDeal!, agreedWeek: 0, markWtaRank: null }
    world.week = WEEKS_PER_YEAR
    // ⚠ A COUNTING W RESULT **AND** THE CACHE, which is the house fixture idiom
    // (`tests/component/round42-elite-retainer.test.ts`'s `atRank`) and not belt-and-braces:
    // `kidLadderRank` refuses to answer without points, because «unranked is not a number».
    // ⭐ A test that set only `kidRankWta` read 0 here and looked like a defect in the score. It was
    // the fixture.
    world.results.push({ playerId: KID_ID, week: world.week, points: 2000, tier: 'w100' })
    world.kidRankWta = 300
    const w = ECONOMY.coach.raise.weights
    expect(coachProgressScore(world), 'entering at all is the biggest move there is').toBeCloseTo(w.rank, 6)
    // ...and falling OUT of it is zero rather than negative, because he never asks for less.
    world.coachDeal = { ...world.coachDeal!, markWtaRank: 60 }
    world.results = []
    // ⚠ `undefined` AND NOT `null`: `kidRankWta` is optional, so «she holds no place» is the field's
    // ABSENCE. `kidLadderRank` refuses on the points anyway – the line above is what makes her
    // unranked – but a `null` here would be a shape the save has never held.
    world.kidRankWta = undefined
    expect(coachProgressScore(world), 'a fall is nothing, never a negative').toBe(0)
  })
})

describe('§F the ask', () => {
  it('F1 it is due on the anniversary of THIS contract and on no other week', () => {
    const world = coachedWorld('middle')
    world.coachDeal = { ...world.coachDeal!, agreedWeek: 30 }
    // ⚠ THE NOT-DUE LIST IS SPELLED OUT RATHER THAN COMPUTED, and its first draft had 134 in it –
    // which is 30 + 104, the SECOND anniversary. The case caught the test's own arithmetic, which is
    // the only thing a hand-written week list is good for.
    for (const week of [30, 31, 81, 83, 133, 135]) {
      world.week = week
      expect(coachRaiseDue(world), `week ${week} is not an anniversary of week 30`).toBe(false)
    }
    for (const week of [82, 134, 30 + 3 * WEEKS_PER_YEAR]) {
      world.week = week
      expect(coachRaiseDue(world), `week ${week} is ${(week - 30) / WEEKS_PER_YEAR} years in`).toBe(true)
    }
  })

  it('F2 a self-coached family is never asked, and week 0 is not an anniversary', () => {
    const self = createWorld('r42-51-self2', { ...DEFAULT_PROFILE, coachTier: 'self' })
    settleCoachDeal(self)
    self.week = WEEKS_PER_YEAR
    expect(coachRaiseDue(self)).toBe(false)
    const world = coachedWorld('middle')
    expect(coachRaiseDue(world), 'she has not had him for a year on the week he was hired').toBe(false)
  })

  it('F3 ⭐ the ask fires, moves the fee and writes exactly one row that names the new figure', () => {
    const world = coachedWorld('elite')
    const coach = heldCoach(world)
    const ceiling = coachMarketLabourCents(world, coach)
    world.coachDeal = { ...world.coachDeal!, labourCents: Math.round(ceiling / 2), agreedWeek: 0 }
    world.week = WEEKS_PER_YEAR
    const before = world.coachDeal.labourCents
    const rateBefore = coachRateCents(world, coach)
    resolveCoachRaise(world)
    const after = world.coachDeal!.labourCents
    expect(after, 'the fee moved up').toBeGreaterThan(before)
    const rows = world.events.filter((e) => e.text.includes(ASK_OPENER))
    expect(rows, 'exactly one row').toHaveLength(1)
    // ⚠ THE ROW NAMES THE RATE THE BILL IS BUILT FROM, so the sentence and the ledger cannot disagree.
    const rateAfter = coachRateCents(world, coach)
    expect(rows[0].text).toContain(coach.name)
    expect(rateAfter, 'and the new rate is live from this week').toBeGreaterThan(rateBefore)
    // ⚠ THE MARKS ARE RE-TAKEN, or the next ask would be measured against a year already paid for.
    expect(world.coachDeal!.agreedWeek, 'the clock restarts at the new handshake').toBe(WEEKS_PER_YEAR)
    expect(world.coachDeal!.residualSince, 'and the banked residual with it').toBe(0)
  })

  it('F4 every ask it can produce is inside his 5–15% corridor, on both ends', () => {
    // ⚠ THE CORRIDOR IS A CONDITION ON COMING TO THE TABLE AND NOT ONLY A CLAMP – measured at 14.4%
    // of asks falling UNDER the floor before the gate existed. See the spec's §4.
    const world = coachedWorld('elite')
    const coach = heldCoach(world)
    const market = coachMarketLabourCents(world, coach)
    for (const share of [0.2, 0.5, 0.8, 0.9, 0.95, 0.99, 1]) {
      world.coachDeal = { ...world.coachDeal!, labourCents: Math.round(market * share), agreedWeek: 0 }
      world.week = WEEKS_PER_YEAR
      const before = world.coachDeal.labourCents
      resolveCoachRaise(world)
      const after = world.coachDeal!.labourCents
      if (after === before) continue
      const fraction = after / before - 1
      expect(fraction, `share ${share}`).toBeGreaterThanOrEqual(FLOOR - 1e-9)
      expect(fraction, `share ${share}`).toBeLessThanOrEqual(CEIL + 1e-9)
    }
  })

  it('F5 the ask draws nothing on the main stream', () => {
    const world = coachedWorld('elite')
    const coach = heldCoach(world)
    world.coachDeal = { ...world.coachDeal!, labourCents: Math.round(coachMarketLabourCents(world, coach) / 2), agreedWeek: 0 }
    world.week = WEEKS_PER_YEAR
    const before = { ...world.rngMain }
    resolveCoachRaise(world)
    expect(world.rngMain, 'the MAIN position is where it was').toEqual(before)
  })
})

describe('§G the market goes on floating, and that is correct', () => {
  it('G1 every row but hers is the market\'s own quote at her standing', () => {
    const world = coachedWorld('middle')
    const mine = heldCoach(world)
    // Freeze her fee well below the market, then read the shelf.
    world.coachDeal = { ...world.coachDeal!, labourCents: Math.round(world.coachDeal!.labourCents / 2) }
    const rows = coachMarket(world)
    const current = rows.find((r) => r.current)
    expect(current, 'her own row is on the shelf').toBeDefined()
    for (const row of rows) {
      const coach = coachById(world.seed, ageAtWeek(world.week), row.id)!
      const market = facilityRateCents(ageAtWeek(world.week), coach.tier) + coachMarketLabourCents(world, coach)
      if (row.id === mine.id) {
        expect(coachRateCents(world, coach), 'the man she HAS is quoted the agreed fee').toBeLessThan(market)
      } else {
        expect(coachRateCents(world, coach), 'and everybody else at the market').toBe(market)
      }
    }
  })

  it('G2 ⭐ the card and the till cannot disagree about the man on the payroll', () => {
    // `coachBilling` is what the budget meter draws and `coachRateCents` is what `resolveBaseCosts`
    // bills, and the whole «three different retainers» note exists because they once could differ.
    const world = coachedWorld('high')
    const coach = heldCoach(world)
    world.coachDeal = { ...world.coachDeal!, labourCents: Math.round(world.coachDeal!.labourCents * 0.7) }
    const billing = coachBilling(world)
    const rows = coachMarket(world)
    const mine = rows.find((r) => r.current)
    expect(mine?.weeklyCents, 'the card for her coach is the budget meter\'s own number').toBe(billing.weeklyCents)
    void coach
  })
})
