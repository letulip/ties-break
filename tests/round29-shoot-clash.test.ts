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
/** ⚠ THE CATALOGUE BECAME A LADDER (round 29 part two #19/#20) AND THEN A PORTFOLIO (part four
 *  P6/§8). Every claim in this file is about the shipped watch deal's SHAPE – a watchmaker,
 *  $20,000, two shoot weeks over a one-year term – and papers exactly like it are persisted in
 *  real saves, so `WATCH` freezes that LEGACY paper here: the fee read off the watches category's
 *  ≤200 cell (the anchor, unchanged to the cent), the brand its first house, the term and the
 *  two-shoot ask as the old letters carry them. `AD` still carries the mechanics every house
 *  shares (the age bar, the weekly chance, the decide weeks, the lead, the clash price). */
// ⚠ INDEX 1 SINCE ROUND 34 #7/#11/#12/#13 (03.09), AND IT IS THE SAME ≤200 CELL. A fifth band was
// prepended to `advertising.bands` at ≤400, so every band index moved one to the right; the cheque
// itself was lifted tenfold at that rung by the owner's approved table.
const WATCH = {
  brand: ECONOMY.advertising.categories.watches.houses[0],
  maxWtaRank: ECONOMY.advertising.bands[1].maxWtaRank,
  cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[1]!,
  termWeeks: 52,
  shootWeeksPerTerm: 2,
}
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
      // ⚠ RE-AIMED 23.09 (the cancel-share repair): the default paper carries the REAL WATCH shape
      // – two booked shoots over the year – because the divisor is the paper's list now, and the
      // old single-week default would have read as «the whole campaign in one shoot» and priced a
      // cancel at the full cheque. Cases that need another shape still pose their own.
      shootWeeks: opts.shootWeeks ?? [CLASH, CLASH + 21],
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
    // ⚠ RE-AIMED 23.09 with the fixture's default paper (two booked shoots) – the claim is
    // unchanged: the withdraw arm leaves the LIST exactly as posed.
    expect(termsOf(world).shootWeeks, 'the shoot moved too – the arms are not independent').toEqual([CLASH, CLASH + 21])
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
    // arithmetic – the cheque stands behind the shoots ON THE PAPER – and not an invented number.
    // ⚠ RE-AIMED 23.09, NOT WEAKENED: the divisor was `shootCount` and that is the PER-YEAR figure
    // (`bands[band].shootWeeksPerYear` under a shorter name), so on a multi-season paper it refunded
    // a season's share, not a shoot's. On this one-year two-shoot paper the two spellings agree –
    // the /2 below is now the POSED LIST's length, and the multi-season split lives in its own
    // describe at the end of this file.
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

// =================================================================================================
// 23.09 – THE CANCEL SHARE READS THE PAPER (his «оставшиеся»; the spec is
// docs/specs/the-cancel-share-2026-09.md and the function's own note carries the argument)
// =================================================================================================
describe('23.09 – the cancel share is the paper\'s own fraction', () => {
  it('⭐⭐⭐ a three-season paper refunds a SHOOT\'s share, never a season\'s', () => {
    // The defect's probe shape (found preparing the round-29 video): $400,000 over three seasons,
    // `shootCount` 2 – the PER-YEAR figure – and SIX weeks on the paper. The old divisor handed
    // back $200,000, half the campaign, for one cancelled shoot of six.
    const weeks = [CLASH, CLASH + 21, CLASH + 52, CLASH + 54, CLASH + 104, CLASH + 106]
    const world = clashWorld('r29-3-three-seasons', { shootWeeks: weeks })
    const terms = termsOf(world)
    terms.cashCents = 400_000_00
    terms.termWeeks = 156
    const funds = world.fundsCents
    answerShootClash(world, 'cancel-shoot')
    // ⚠ 1/6 of the cheque – and the FUNDS moved by that number, which also pins the ORDER: were
    // the share computed after the removal, the arm would charge 1/5 ($80,000) and this reddens.
    expect(funds - world.fundsCents, 'one shoot of six, to the cent').toBe(Math.round(400_000_00 / 6))
    expect(termsOf(world).shootWeeks).toHaveLength(5)
  })

  it('⭐⭐ a `shootCount: 1` paper no longer refunds the whole cheque', () => {
    // The defect report's own edge: with the old divisor, `Math.max(1, shootCount)` handed the
    // ENTIRE cheque back for one cancelled week of several.
    const weeks = [CLASH, CLASH + 30, CLASH + 41]
    const world = clashWorld('r29-3-count-one', { shootWeeks: weeks })
    termsOf(world).shootCount = 1
    const funds = world.fundsCents
    answerShootClash(world, 'cancel-shoot')
    expect(funds - world.fundsCents, 'one shoot of three, whatever the per-year figure says').toBe(
      Math.round(WATCH.cashCents / 3),
    )
  })

  it('⚠ the stated drift: a REPEAT cancel divides by the shrunken paper, one step dearer', () => {
    // DESIGNED and pinned as a fact rather than hidden (the function's own note): the signature
    // count is not persisted, and re-deriving it would be a second spelling of the booking law.
    const weeks = [CLASH, CLASH + 21, CLASH + 52, CLASH + 54, CLASH + 104, CLASH + 106]
    const world = clashWorld('r29-3-drift', { shootWeeks: weeks })
    answerShootClash(world, 'cancel-shoot')
    expect(shootCancelCents(termsOf(world)), 'six booked, one cancelled – the next share is 1/5').toBe(
      Math.round(WATCH.cashCents / 5),
    )
  })

  it('⚠ a paper with no list at all falls back to the season figure, never to 1', () => {
    // The belt: every 'ad' signature has written the list since the kind exists, but a poked or
    // ancient paper must not refund a whole cheque through the Math.max floor.
    const terms: AdOfferTerms = { brand: 'x', cashCents: 300_000_00, termWeeks: 52, shootCount: 2 }
    expect(shootCancelCents(terms)).toBe(Math.round(300_000_00 / 2))
  })
})
