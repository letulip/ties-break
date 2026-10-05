// ⭐⭐ ROUND 46 #11c – THE DAY IS NOT BURIED BY A SPAN (bundle B1), through the REAL weekly step.
//
// The owner, round 46 #11 (05.10, verbatim): «Я дождался свадьбы, но самого экрана этого события не было!»
//
// WHY THIS FILE EXISTS. `tests/life-moment-engine.test.ts` poses a world and calls `landWedding` by hand, which proves
// what the writers leave behind – and could not have caught the defect this file is about: the span pill advances
// SEVERAL weeks per command (`advanceWeeks` loops `tickWeek`), and a day that lands in week 2 of 4 would have handed
// back a snapshot at week 4 where `lifeMomentOf` (this week only) is already null. The screen would have been
// missing again, in the most common way a player advances. So `advanceWeeks` collects a `'life-moment'` stop reason
// the way it collects the academy's verdict and an offer, and a span ENDS on the day.
//
// ⚠ A POSED EPISODE CAN END BY CHANCE (`rollEnds`) inside the eight weeks, and the claim under test is about the
// SPAN, not about the ending hazard – so the fixture takes the first of a fixed list of seeds on which the day
// really lands under plain `tickWeek`s. Deterministic, and the list is asserted non-empty.
//
// ⚠ MUTATION, really run and watched: the `stops.add('life-moment')` line in `advanceWeeks` removed -> RED on the
// «span ends ON the day» case (the span runs through, the moment is gone) and on the one-week report.
import { describe, expect, it } from 'vitest'
import { advanceWeeks, createWorld, raiseLifeBeat, tickWeek, toSnapshot } from '../src/engine/world'
import { lifeLogOf } from '../src/engine/world/lifeBeat'
import { lifeMomentOf } from '../src/engine/world/lifeMoment'
import { loveEpisodesOf } from '../src/engine/world/loveEpisodes'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, STOP_PRECEDENCE, type StopReason } from '../src/shared/protocol'
import type { WorldState } from '../src/engine/world'

const ID = 'p:0'
const DAY = ECONOMY.wedding.weeksAfterEngagement

function posed(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.loveEpisodes = [
    {
      id: ID, sinceWeek: 0, endedWeek: null, knownWeek: 0, wants: 'open', partnerId: ID,
      publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null, latchedWeek: null, partnerName: 'Anton',
    },
  ]
  // ⚠ THE `'met'` CARD IS POSED AS ALREADY ANSWERED: the episode's `knownWeek` is 0, so the real weekly step would raise it,
  // and a pending blocking card makes `advanceWeeks` (rightly) refuse to move – which would test the refusal, not the span.
  raiseLifeBeat(world, 'met', ID)
  lifeLogOf(world).at(-1)!.answer = 'listen'
  raiseLifeBeat(world, 'engaged', ID)
  lifeLogOf(world).at(-1)!.answer = 'bless'
  return world
}

/** Does the posed wedding really land on its day under plain ticks? (The ending hazard may have ended the episode.) */
function lands(seed: string): boolean {
  const world = posed(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < DAY; i++) tickWeek(world, rng)
  return loveEpisodesOf(world)[0].latchedWeek === DAY
}

const SEED = ['span-a', 'span-b', 'span-c', 'span-d', 'span-e', 'span-f', 'span-g', 'span-h'].find(lands)

describe('the day ends the span it lands in', () => {
  it('the fixture exists: a posed wedding that really lands on its day under the real weekly step', () => {
    expect(SEED, 'no seed in the list lands the wedding – widen the list, do not weaken the cases below').toBeDefined()
  })

  it('a one-week press on the day: the stop is reported and the snapshot carries the moment', () => {
    const world = posed(SEED!)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < DAY - 1; i++) tickWeek(world, rng)
    expect(lifeMomentOf(world), 'the week before the day holds no moment').toBeNull()
    const stops = advanceWeeks(world, rng, 1)
    expect(world.week).toBe(DAY)
    expect(stops).toContain('life-moment')
    const snap = toSnapshot(world, stops)
    expect(snap.lifeMoment?.kind, 'right after the tick that landed it, on the snapshot the player sees').toBe('wedding')
    expect(snap.stopReasons).toContain('life-moment')
  })

  it('a span that would run THROUGH the day ends ON it – and the moment is on that snapshot', () => {
    const world = posed(SEED!)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < DAY - 2; i++) tickWeek(world, rng)
    const stops = advanceWeeks(world, rng, 6)
    expect(world.week, 'asked for six weeks, stopped on the day').toBe(DAY)
    expect(stops).toContain('life-moment')
    expect(toSnapshot(world, stops).lifeMoment?.kind).toBe('wedding')
  })

  it('without an announced wedding a span runs its full length and reports no life-moment', () => {
    const world = createWorld('life-moment-span-none', DEFAULT_PROFILE)
    const rng = rngFromSeed(world.seed)
    const stops: StopReason[] = advanceWeeks(world, rng, 3)
    expect(stops).not.toContain('life-moment')
    expect(toSnapshot(world, stops).lifeMoment).toBeNull()
  })

  it('it sits in the precedence list, last: a day that costs her nothing waits behind every reason that does', () => {
    expect(STOP_PRECEDENCE.at(-1)).toBe('life-moment')
  })
})
