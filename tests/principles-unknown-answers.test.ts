import { describe, it, expect } from 'vitest'
import {
  answerFork,
  answerShootClash,
  closeTournament,
  createWorld,
  decideKnock,
  pendingKnock,
  revealTournamentRound,
  setWeightEnabled,
  shootClashOpen,
  skipTournament,
  type WorldState,
} from '../src/engine/world'
import { CAREER_ENDED_REFUSAL, UNKNOWN_CHOICE_REFUSAL } from '../src/engine/world/constants'
import { adOfferId } from '../src/engine/offers'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type AdOfferTerms, type ForkAnswer, type KnockChoice, type ShootClashChoice } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'

// =================================================================================================
// ⭐⭐ #9 · B-05 · B-P3-01 · B-P3-02 (principles review of 26.09,
// docs/review-principles-2026-09-26/02-engine-core.md) – FAIL FAST ON AN ANSWER THE GAME NEVER
// OFFERED.
//
// Three answer commands took a value of their own choice union and never checked it against the list
// they themselves offer, so an unknown member fell through to a DEFAULT ARM:
//   * `decideKnock` – anything that is not `'rest'` is a push, and the bond delta and the feed row
//     that come with it are written for a decision nobody made;
//   * `answerShootClash` – anything the three `if`s do not match falls off the end into «play both»,
//     the arm that LATCHES the week so the question is never asked again;
//   * `answerFork` – anything that is not `'college'` is handed to `endingForForkAnswer`, so an
//     unknown enum **silently ends the career**. That is B-P3-02's concrete case and the reason the
//     three are one task: the other two cost a wrong row, this one costs the career.
//
// Invariant 1 is what they were missing: «every command is re-validated engine-side, so a stale
// screen cannot corrupt a career». `setPsychologistFocus` is the shape they now take
// (`PSY_FOCUSES.includes(focus)`), and the sentence is one shared DRAFT for all three – reachable
// only by a malformed command, so it is a diagnostic the player should never see.
//
// ⭐ THE FOURTH ARM IS B-P3-01, a different question about the same class: `setWeightEnabled` had no
// `guardNotEnded` while its own note claimed it had «`setCoachOnEventWeeks`'s shape and nothing
// more». It gains the guard and its EXISTING sentence – no new copy for that one.
//
// ⚠ THE REVEAL NO-OPS STAY IDEMPOTENT (the owner's ruling 9, and B-05's own proposal). The last
// block asserts that, because «check the argument» and «refuse a no-op» look like one tidy-up and are
// not: `blockingOverlay.ts` relies on the guaranteed exit, and refusing would need a sentence.
//
// ⚠ EVERY ARM ASSERTS TWICE – the REFUSAL and the STATE it did not move. A command that threw after
// writing would pass a message-only assertion while leaving exactly the damage the finding is about.
//
// ⚠ MUTATION ARMS, one per command, each named above its own block.
//
// ⚠ RNG: nothing here draws. All four commands are zero-draw on every stream (their own notes say
// so), and a refusal draws less than that. The frozen capture (41550 / e6b0c709) cannot see this file.
// =================================================================================================

/** An unknown member of each union, cast at the boundary exactly as a malformed wire payload would
 *  arrive. ⚠ The cast is the POINT: these commands are reachable from `sim.worker.ts`'s dispatch,
 *  where the payload is JSON and the compiler has already been left behind. */
const NOT_A_KNOCK_CHOICE = 'sprint' as KnockChoice
const NOT_A_CLASH_CHOICE = 'reschedule' as ShootClashChoice
const NOT_A_FORK_ANSWER = 'university' as ForkAnswer

// -------------------------------------------------------------------------------------------------
// decideKnock · MUTATION: remove the `KNOCK_CHOICES.includes(choice)` line in world/knock.ts
// -------------------------------------------------------------------------------------------------
function knockWorld(seed: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = 120
  world.knock = { part: 'shoulder', sinceWeek: world.week, repeat: false, choice: null, untilWeek: world.week }
  return world
}

describe('#9 · decideKnock refuses an answer that is not one of its two', () => {
  it('the refusal is the shared sentence, and nothing about the knock moved', () => {
    const world = knockWorld('p9-knock')
    const bondBefore = world.bond
    const rowsBefore = world.events.length
    expect(() => decideKnock(world, NOT_A_KNOCK_CHOICE)).toThrow(UNKNOWN_CHOICE_REFUSAL)
    expect(world.knock?.choice, 'the knock is still waiting for a real answer').toBeNull()
    expect(pendingKnock(world), 'and the week is still blocked by it').toBe(true)
    expect(world.bond, 'no bond was spent on a decision nobody made').toBe(bondBefore)
    expect(world.events.length, 'and no feed row claims she rested or trained through it').toBe(rowsBefore)
  })

  it('both real answers still work', () => {
    const rest = knockWorld('p9-knock-rest')
    decideKnock(rest, 'rest')
    expect(rest.knock?.choice).toBe('rest')
    const push = knockWorld('p9-knock-push')
    decideKnock(push, 'push')
    expect(push.knock?.choice).toBe('push')
  })
})

// -------------------------------------------------------------------------------------------------
// answerShootClash · MUTATION: remove the `SHOOT_CLASH_CHOICES.includes(choice)` line in
// world/shootClash.ts – the unknown answer then falls off the end into the «play both» latch.
// -------------------------------------------------------------------------------------------------
const CLASH = 216
const AT = CLASH - 1

/** The collision, built the way `tests/round29-shoot-clash.test.ts` builds it (its own `clashWorld`,
 *  the shipped watch paper's shape): a signed campaign naming `CLASH` and an entry for the same week,
 *  with the world standing the week before – the only week the question can be asked on. */
function clashWorld(seed: string): WorldState {
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
    deadlineWeek: AT - 2,
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
    untilWeek: AT - 10 + 52 - 1,
    terms: {
      brand: ECONOMY.advertising.categories.watches.houses[0],
      cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[1]!,
      termWeeks: 52,
      shootCount: 2,
      shootWeeks: [CLASH, CLASH + 21],
    },
  })
  return world
}

const termsOf = (world: WorldState): AdOfferTerms => world.offers.find((o) => o.kind === 'ad')!.terms as AdOfferTerms

describe('#9 · answerShootClash refuses an answer that is not one of its four', () => {
  it('the refusal is the shared sentence, and the week is not latched as «play both»', () => {
    const world = clashWorld('p9-clash')
    expect(shootClashOpen(world), 'the fixture is a real collision').toBe(true)
    const entriesBefore = [...world.entries]
    const weeksBefore = [...(termsOf(world).shootWeeks ?? [])]
    const fundsBefore = world.fundsCents
    expect(() => answerShootClash(world, NOT_A_CLASH_CHOICE)).toThrow(UNKNOWN_CHOICE_REFUSAL)
    expect(world.shootClashAccepted ?? [], 'the week was NOT accepted as a double').toEqual([])
    expect(shootClashOpen(world), 'so the question is still open and can still be answered').toBe(true)
    expect(world.entries, 'her entry stands').toEqual(entriesBefore)
    expect(termsOf(world).shootWeeks, 'the shoot was not moved').toEqual(weeksBefore)
    expect(world.fundsCents, 'and nothing was charged').toBe(fundsBefore)
  })

  it('the real «play both» still latches', () => {
    const world = clashWorld('p9-clash-both')
    answerShootClash(world, 'play-both')
    expect(world.shootClashAccepted).toEqual([CLASH])
  })
})

// -------------------------------------------------------------------------------------------------
// answerFork · MUTATION: remove the `FORK_ANSWERS.includes(answer)` line in world/endings.ts – the
// unknown answer then reaches `endingForForkAnswer` and the career ends.
// -------------------------------------------------------------------------------------------------
function forkWorld(seed: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = 260
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: null }
  return world
}

describe('#9 · answerFork refuses an answer that is not one of its three (B-P3-02)', () => {
  it('an unknown answer does not end the career', () => {
    const world = forkWorld('p9-fork')
    const curveBefore = world.ageCurve
    expect(() => answerFork(world, NOT_A_FORK_ANSWER)).toThrow(UNKNOWN_CHOICE_REFUSAL)
    expect(world.ending, 'THE defect: an unknown enum used to latch an ending here').toBeNull()
    expect(world.fork?.answer, 'the fork is still open, so the player can still answer it').toBeNull()
    expect(world.ageCurve, 'and the route was not resolved off an answer nobody gave').toEqual(curveBefore)
  })

  it('all three real answers are still accepted', () => {
    for (const answer of ['continue', 'college', 'stop'] as const) {
      const world = forkWorld(`p9-fork-${answer}`)
      answerFork(world, answer)
      expect(world.fork?.answer, `«${answer}» is answerable`).toBe(answer)
    }
  })
})

// -------------------------------------------------------------------------------------------------
// setWeightEnabled · MUTATION: remove the `guardNotEnded(world)` line in world/lifeBeat.ts
// -------------------------------------------------------------------------------------------------
describe('B-P3-01 · setWeightEnabled refuses on an ended career', () => {
  it('the retirement latch refuses the setting, with the existing guard sentence', () => {
    const world = forkWorld('p9-weight')
    answerFork(world, 'stop')
    expect(world.ending, 'the fork latched a real ending').not.toBeNull()
    const before = world.weightEnabled
    expect(() => setWeightEnabled(world, !before)).toThrow(CAREER_ENDED_REFUSAL)
    expect(world.weightEnabled, 'the flag did not move behind the epilogue').toBe(before)
  })

  it('and it is still writable on a live career, both ways', () => {
    const world = forkWorld('p9-weight-live')
    setWeightEnabled(world, false)
    expect(world.weightEnabled).toBe(false)
    setWeightEnabled(world, true)
    expect(world.weightEnabled).toBe(true)
  })
})

// -------------------------------------------------------------------------------------------------
// the reveal no-ops · the owner's ruling 9 – they stay IDEMPOTENT
// -------------------------------------------------------------------------------------------------
describe('ruling 9 · the reveal no-ops stay idempotent', () => {
  it('revealTournamentRound, skipTournament and closeTournament do nothing on a world with no reveal', () => {
    const world = createWorld('p9-noop', { ...DEFAULT_PROFILE, coachTier: 'self' })
    expect(world.pendingTournament, 'the fixture has no reveal').toBeNull()
    expect(() => revealTournamentRound(world)).not.toThrow()
    expect(() => skipTournament(world)).not.toThrow()
    expect(() => closeTournament(world)).not.toThrow()
    expect(world.pendingTournament).toBeNull()
  })
})
