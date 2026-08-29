// =================================================================================================
// ⭐⭐ ROUND 29 #3 – THE SHOOT THAT LANDS ON A TOURNAMENT WEEK: THE WEEK ASKS, AND EACH ANSWER COSTS
// SOMETHING DIFFERENT
// =================================================================================================
//
// Round 28 shipped the shoot week and deliberately exempted a tournament week. The owner looked at
// the exemption and rejected it – «но она же осталась на турнирной неделе, значит надо понять как с
// ней быть. И варианты пользователю предложить.» – and then ruled the CHOICE the player's, naming
// the arms himself: cancel the tournament; cancel or move the shoot; or shoot and play, «+1 в день,
// т.к. съемка занимает не один час, то нагрузка будет мощной на всю неделю». His words are in
// docs/rounds/round-29.md, where they may be quoted in his own language.
//
// ⚠⚠ WHAT THIS FILE IS FOR, AND WHY IT IS NOT A SOURCE PIN. Every claim below is read out of a
// TICKED world: the condition price is `world.condition` before and after a real tick, the
// withdrawal is `world.entries` after a real command, the move is the letter's own `shootWeeks`
// after a real command. `ECONOMY.advertising.clashConditionPerDay` is used to build the EXPECTATION
// and never read back off the thing under test – the trap `round28-household-block.test.ts` recorded
// when its income assertion survived halving the income.
//
// ⚠ MUTATION-VERIFIED; each block names its own mutation.
import { describe, expect, it } from 'vitest'
import {
  accrueCondition,
  advanceWeeks,
  answerShootClash,
  createWorld,
  shootCancelCents,
  shootClashOpen,
  shootClashWeek,
  shootMoveTarget,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { adShootWeek, adOfferId } from '../src/engine/offers'
import { resumeMain } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { PLAN_DAYS } from '../src/engine/plan'
import { TIERS, isOffSeasonWeek } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type AdOfferTerms } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'

const AD = ECONOMY.advertising
/** ⚠ THE CATALOGUE BECAME A LADDER (round 29 part two #19/#20), so the five per-house numbers
 *  moved out of `ECONOMY.advertising` into `ECONOMY.advertising.houses`. Every claim in this
 *  file is about the rung that already shipped – Quiet Hour, $20,000, two shoot weeks – so it
 *  is REPOINTED and not re-aimed: `AD` still carries the mechanics every house shares (the age
 *  bar, the weekly chance, the decide weeks, the lead, the clash price) and `WATCH` carries
 *  that one house's own terms, which have not moved by a cent. */
const WATCH = ECONOMY.advertising.houses.watch
/** Week 216 – offset 8 of season 5, an ordinary in-season adult week (asserted in the fixture
 *  block). `tests/ad-offer.test.ts`'s own probe week, for the same reason: one condition varies. */
const CLASH = 216
const AT = CLASH - 1

/** THE COLLISION, BUILT: a signed campaign that names `CLASH`, and an entry she holds for the same
 *  week, with the world standing the week before – which is the only week the question can be asked
 *  on, because two of its four answers stop being possible once the week begins.
 *
 *  The `shootProbe` idiom of `tests/ad-offer.test.ts`: a fresh world handed a signed deal whose
 *  shoot weeks the test controls. Walking a career until a house happened to write AND the dice
 *  happened to name a week she was entered in would be testing `chooseShootWeeks` and `rollInjury`
 *  at once; what is under test here is what the collision DOES. */
function clashWorld(seed: string, opts: { shootWeeks?: number[]; deadlineWeek?: number } = {}): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = AT
  world.plan = { train: 60, rest: 40 }
  world.physioActive = false
  world.condition = 50
  world.fundsCents = 500_000_00
  const event: SeasonEvent = {
    id: `${seed}-event`,
    week: CLASH,
    tier: 'local',
    surface: 'hard',
    travelCostCents: 100_00,
    // Past the deadline by default – the realistic case, and the one where a withdrawal forfeits.
    deadlineWeek: opts.deadlineWeek ?? AT - 2,
  }
  world.season = [event]
  world.entries = [event.id]
  world.offers.push({
    id: adOfferId(AT - 10),
    kind: 'ad',
    week: AT - 10,
    deadlineWeek: AT - 7,
    state: 'signed',
    decidedWeek: AT - 10,
    fromWeek: AT - 10,
    untilWeek: AT - 10 + WATCH.termWeeks - 1,
    terms: {
      brand: WATCH.brand,
      cashCents: WATCH.cashCents,
      termWeeks: WATCH.termWeeks,
      shootCount: 2,
      shootWeeks: opts.shootWeeks ?? [CLASH],
    },
  })
  return world
}

const termsOf = (world: WorldState): AdOfferTerms => world.offers.find((o) => o.kind === 'ad')!.terms as AdOfferTerms

// =================================================================================================
// 0 – THE FIXTURE IS A REAL COLLISION
// =================================================================================================
describe('round 29 #3 – the fixture', () => {
  it('an in-season week that is both a named shoot week and a week she is entered in', () => {
    expect(isOffSeasonWeek(CLASH), 'an off-season shoot is not one the engine ever names').toBe(false)
    const world = clashWorld('r29-3-fixture')
    expect(adShootWeek(world.offers, CLASH), 'the letter does not name the week under test').toBe(true)
    expect(world.entries, 'she is not entered in the colliding week').toHaveLength(1)
    expect(world.season[0].week).toBe(CLASH)
    expect(world.week, 'the question is asked the week BEFORE').toBe(CLASH - 1)
  })
})

// =================================================================================================
// 1 – THE WEEK ASKS, AND TIME DOES NOT MOVE UNTIL IT IS ANSWERED
// =================================================================================================
describe('round 29 #3 – the week raises the choice', () => {
  // ⚠ MUTATION: drop the `shootClashOpen` clause from `advanceRefusal` and the refusal below becomes
  // a four-week advance – the week is spent and the decision is made for him.
  it('⭐⭐ the advance REFUSES with zero ticks, and names the reason', () => {
    const world = clashWorld('r29-3-refuse')
    const before = world.week
    expect(shootClashOpen(world)).toBe(true)
    const stops = advanceWeeks(world, resumeMain(world.rngMain), 4)
    expect(stops, 'the collision is not the reason time stopped').toEqual(['shoot-clash'])
    expect(world.week - before, 'a refusal ticks NOTHING – the week the press asked for never happened').toBe(0)
  })

  it('⚠ ...and the snapshot carries the whole card, so the dialog cannot be missing on a refused week', () => {
    const snap = toSnapshot(clashWorld('r29-3-prompt'))
    expect(snap.shootClash, 'the engine refused a week the screen has nothing to draw for').not.toBeNull()
    expect(snap.shootClash!.week).toBe(CLASH)
    expect(snap.shootClash!.brand).toBe(WATCH.brand)
    expect(snap.shootClash!.eventLabel).toBe(TIERS.local.label)
    expect(snap.shootClash!.conditionCost).toBe(AD.clashConditionPerDay * PLAN_DAYS)
  })

  it('⚠ a shoot week with no tournament in it asks NOTHING – the round 28 week is untouched', () => {
    // The negative that keeps the rule honest: round 28's shoot week is «not blocked and not
    // double-charged», and this item did not change that. Without this case, "the week asks" would
    // be satisfied by a build that asked on every shoot week.
    const world = clashWorld('r29-3-shoot-alone')
    world.entries = []
    expect(shootClashOpen(world)).toBe(false)
    expect(shootClashWeek(world)).toBeNull()
    expect(advanceWeeks(world, resumeMain(world.rngMain), 1), 'the plain shoot week stopped for something').toEqual([])
  })

  it('⚠ ...and neither does a tournament week with no shoot on it', () => {
    const world = clashWorld('r29-3-event-alone', { shootWeeks: [] })
    expect(shootClashOpen(world)).toBe(false)
  })

  it('⚠ nor a collision she is laid up for – the layoff owns that week and the walkover reports it', () => {
    const world = clashWorld('r29-3-injured')
    world.injury = { kind: 'wrist', severity: 'moderate', sinceWeek: AT, weeksRemaining: 6, totalWeeks: 6 }
    expect(shootClashOpen(world), 'a question with no consequence is the R10-16 dead control').toBe(false)
  })
})

// =================================================================================================
// 2 – EACH ARM PRODUCES ITS OWN OUTCOME
// =================================================================================================
describe('round 29 #3 – the four answers, and each costs something different', () => {
  it('⭐ WITHDRAW – the entry goes, on the engine\'s existing terms and no new penalty', () => {
    const world = clashWorld('r29-3-withdraw')
    const fee = TIERS.local.entryFeeCents
    const funds = world.fundsCents
    answerShootClash(world, 'withdraw')
    expect(world.entries, 'she is still entered').toHaveLength(0)
    // Past the deadline, so `cancelEntry` forfeits – the same thing pulling out of that tournament
    // costs from the calendar on any other week. Nothing new is invented for this route.
    expect(world.fundsCents, 'the fee came back on a closed list').toBe(funds)
    expect(funds, 'the fixture would prove nothing if the fee were zero').toBeGreaterThan(fee)
    expect(termsOf(world).shootWeeks, 'the shoot moved too – the arms are not independent').toEqual([CLASH])
    expect(shootClashOpen(world), 'the question is still standing').toBe(false)
  })

  it('⚠ ...and INSIDE the deadline the same arm hands the fee back, because that is what the engine does', () => {
    const world = clashWorld('r29-3-withdraw-open', { deadlineWeek: AT + 3 })
    const funds = world.fundsCents
    answerShootClash(world, 'withdraw')
    expect(world.fundsCents - funds, 'the open-list refund is the engine\'s own').toBe(TIERS.local.entryFeeCents)
  })

  it('⭐ MOVE – the shoot leaves the week, the entry stands, and nothing is paid for it', () => {
    const world = clashWorld('r29-3-move')
    const to = shootMoveTarget(world, CLASH)
    const funds = world.fundsCents
    expect(to, 'the term has no room, so this arm proves nothing here').not.toBeNull()
    answerShootClash(world, 'move-shoot')
    expect(termsOf(world).shootWeeks, 'the shoot did not move').toContain(to)
    expect(termsOf(world).shootWeeks, '...and it is no longer on the colliding week').not.toContain(CLASH)
    expect(world.entries, 'the tournament was cancelled by the move arm').toHaveLength(1)
    expect(world.fundsCents, 'moving cost money – the owner said only CANCELLING should').toBe(funds)
    expect(shootClashOpen(world)).toBe(false)
  })

  it('⚠ ...and the week it moves to is one the letter could have named itself', () => {
    // `chooseShootWeeks`' own clauses, re-asked: in-season, inside the term, not adjacent to the
    // other shoot, and not a week she is entered in.
    const other = CLASH + 20
    const world = clashWorld('r29-3-move-rules', { shootWeeks: [CLASH, other] })
    const to = shootMoveTarget(world, CLASH)!
    expect(isOffSeasonWeek(to), 'an off-season shoot is a cost wearing a cost\'s clothes').toBe(false)
    expect(Math.abs(to - other), 'a campaign is not a tour – two shoots may not bunch').toBeGreaterThan(1)
    expect(to).toBeGreaterThan(CLASH)
    expect(to).toBeLessThanOrEqual(world.offers.find((o) => o.kind === 'ad')!.untilWeek!)
  })

  it('⭐ CANCEL THE SHOOT – the week is freed and the campaign takes back the shoot\'s own share of the fee', () => {
    // The owner: «явно должны быть последствия какие-то». The consequence is the CONTRACT's own
    // arithmetic – the cheque bought `shootCount` shoots – and not a number invented for this item.
    const world = clashWorld('r29-3-cancel')
    const funds = world.fundsCents
    const share = shootCancelCents(termsOf(world))
    answerShootClash(world, 'cancel-shoot')
    expect(termsOf(world).shootWeeks, 'the shoot is still on the week').not.toContain(CLASH)
    expect(world.entries, 'the tournament went with it').toHaveLength(1)
    expect(funds - world.fundsCents, 'cancelling cost nothing – the owner asked for consequences').toBe(share)
    expect(share, 'a zero share would make the assertion above vacuous').toBeGreaterThan(0)
    // ⚠ THE SHARE IS THE PAPER'S, REBUILT rather than read back off the thing under test.
    expect(share).toBe(Math.round(WATCH.cashCents / 2))
    const row = world.events.filter((e) => e.week === world.week && e.category === 'sponsor')
    expect(row, 'the money moved with no receipt in the ledger').toHaveLength(1)
    expect(row[0].amountCents).toBe(-share)
  })

  it('⭐⭐ DO BOTH – the week is latched, and it costs her exactly the owner\'s figure, read out of a ticked world', () => {
    // ⚠ MUTATION: drop the `shooting && playedThisWeek` term from `accrueCondition` and this goes red
    // while every other case in this file stays green.
    //
    // THE CONTROL IS THE SAME WORLD WITH THE SHOOT SOMEWHERE ELSE, so the only difference between
    // the two arms is the collision itself – not the plan, not the tier, not the week.
    const both = clashWorld('r29-3-both')
    answerShootClash(both, 'play-both')
    expect(both.shootClashAccepted, 'nothing was latched, so the question returns next press').toContain(CLASH)
    expect(shootClashOpen(both), 'the same question is still standing after it was answered').toBe(false)

    const control = clashWorld('r29-3-both', { shootWeeks: [CLASH + 20] })

    // Both worlds ticked into the collision week and their condition read straight off the world.
    // `accrueCondition` is called with the engine's own `isCompetitionWeek` verdict.
    const conditionAfter = (w: WorldState): number => {
      w.week = CLASH
      w.condition = 50
      accrueCondition(w, true)
      return w.condition
    }
    const withBoth = conditionAfter(both)
    const withoutShoot = conditionAfter(control)
    expect(withoutShoot - withBoth, 'the week did not cost what he priced it at').toBe(AD.clashConditionPerDay * PLAN_DAYS)
    // ...and the figure is his: one point per day of the week.
    expect(AD.clashConditionPerDay).toBe(1)
    expect(PLAN_DAYS).toBe(7)
  })

  it('⭐⭐ ...and the price lands through the REAL TICK, not only through the accumulator', () => {
    // The whole week, played: `tickWeek` from the week before, through the collision, with the
    // condition read off the world at both ends. A test that only called `accrueCondition` would not
    // notice a phase that never reaches it.
    const both = clashWorld('r29-3-both-tick')
    answerShootClash(both, 'play-both')
    // ⚠ THE CONTROL IS NOT ANSWERED AND CANNOT BE: it has no collision, so `answerShootClash` refuses
    // it. That is the arm's own proof that the latch is not what moves the number – the price is
    // charged off the WEEK (see `accrueCondition`), and the control simply never has the week.
    const control = clashWorld('r29-3-both-tick', { shootWeeks: [CLASH + 20] })
    expect(shootClashOpen(control), 'the control has a collision of its own').toBe(false)

    const spend = (w: WorldState): number => {
      const before = w.condition
      tickWeek(w, resumeMain(w.rngMain))
      return w.condition - before
    }
    const withBoth = spend(both)
    const withoutShoot = spend(control)
    expect(both.week, 'the tick did not reach the collision week').toBe(CLASH)
    expect(withoutShoot - withBoth, 'the shoot cost nothing through the real tick').toBe(AD.clashConditionPerDay * PLAN_DAYS)
  })
})

// =================================================================================================
// 3 – AND TIME MOVES AGAIN, WHICHEVER ANSWER HE GIVES
// =================================================================================================
describe('round 29 #3 – no answer can strand the career', () => {
  for (const choice of ['withdraw', 'move-shoot', 'cancel-shoot', 'play-both'] as const) {
    it(`after '${choice}' the advance ticks again`, () => {
      const world = clashWorld(`r29-3-unblock-${choice}`)
      answerShootClash(world, choice)
      const before = world.week
      advanceWeeks(world, resumeMain(world.rngMain), 1)
      expect(world.week, `'${choice}' left the career unable to spend a week`).toBe(before + 1)
    })
  }

  it('⚠ an answer to a collision that is not open is REFUSED – the worker is not the gate', () => {
    const world = clashWorld('r29-3-revalidate')
    world.entries = []
    expect(() => answerShootClash(world, 'play-both')).toThrow(/no shoot to decide/i)
  })
})
