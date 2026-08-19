// ⭐⭐ THE ALTERNATES LIST – the rung's MIDDLE, and the owner's answer to "every rung of ours is a cliff".
//
// THE PROBLEM IT REPLACES, in the spec's own words (docs/specs/the-acceptance-tail-2026-08.md §4):
// "a hard cut has no middle. The rung is hers or it does not exist, so the only way to make it
// selective is to make it empty" – and P3 shipped a `j300` number it knew to be FIVE TIMES looser than
// reality for exactly that reason.
//
// ⚠⚠ AND IT IS NOT THE PROBABILISTIC TAIL THAT SPEC PROPOSED, which the owner refused twice: «заявка
// станет частично броском кубика, а это реальная потеря в игре про планирование сезона». His design
// (18.08): «давай сделаем доп. окно допуска здесь просто, тогда как раз и проще планировать будет».
//
// So the file's claims are the two halves of that ruling:
//   * THE WORLD ROLLS – how many of the field withdrew, once per event, on its own sub-stream;
//   * SHE DOES NOT – her place in the queue is arithmetic, and BOTH numbers are on the card before
//     she commits.
import { describe, it, expect } from 'vitest'
import { createWorld, toSnapshot, entryStatus, tierOpenFor } from '../src/engine/world'
import { alternateQueuePosition, alternateListPlace } from '../src/engine/world/ladder'
import { ALTERNATES, alternatePlacesOpen } from '../src/engine/season/tournament'
import { TIERS } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

const KID_ID = 'kid'

/** A career standing exactly `behind` places below the wta500 cut, with a real professional book.
 *
 *  ⚠ AGED PAST THE RUNG'S OWN FLOOR, and the first draft was not - which is the fixture reading the
 *  engine correctly and the test being wrong. `wta500.minAgeYears` is 15 and a fresh world is at week
 *  zero, so `entryStatus` refused her on AGE while `alternateListPlace` was quite right that the queue
 *  had reached her. The list is not a way past the age gate and must never become one. */
function atRank(seed: string, behind: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE }) as unknown as WorldState
  const w = world as unknown as Record<string, unknown>
  w.week = 4 * 52
  w.condition = 100
  w.fundsCents = 5_000_000_00
  w.onRampCleared = { itf: true, wta: true }
  // ⚠ THE RESULT IS RECENT, and the second draft of this fixture learned why: the ranking window is
  // rolling, so a book banked at week 0 is worth nothing at week 208 and she reads as unranked - which
  // correctly takes her off every queue in the game.
  w.results = [{ playerId: KID_ID, week: 4 * 52 - 4, points: 500, tier: 'w100' }]
  w.kidRankWta = (TIERS.wta500.acceptsRank as number) + behind
  return world
}

function slamAt(world: WorldState, weeksAhead: number, standsFor: number): SeasonEvent {
  const e: SeasonEvent = {
    id: `alt-${weeksAhead}-${standsFor}`,
    week: world.week + weeksAhead,
    tier: 'wta500',
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: world.week + weeksAhead - standsFor,
  }
  world.season.push(e)
  return e
}

describe('§1 her place in the queue is arithmetic, and never a roll', () => {
  it('⭐ above the cut she is not on the list at all', () => {
    expect(alternateQueuePosition(atRank('alt-above', -5), 'wta500')).toBe(0)
    expect(alternateQueuePosition(atRank('alt-at', 0), 'wta500')).toBe(0)
  })

  it('⭐⭐ within four places below it she is 1st, 2nd, 3rd, 4th – and the fifth is off the list', () => {
    // This is the shape the owner asked for: a MIDDLE. The rung stops being "hers or nothing".
    for (const behind of [1, 2, 3, 4]) {
      expect(alternateQueuePosition(atRank(`alt-q${behind}`, behind), 'wta500'), `${behind} behind`).toBe(behind)
    }
    expect(alternateQueuePosition(atRank('alt-q5', ALTERNATES.places + 1), 'wta500'), 'past the list').toBe(0)
  })

  it('⚠ an unranked girl is not first in every queue in the game', () => {
    // The guard `meetsAcceptanceCut` carries for the same reason: with nobody holding a point the
    // whole field ties at zero and a fresh fourteen-year-old reads as world #1.
    const world = createWorld('alt-unranked', { ...DEFAULT_PROFILE }) as unknown as WorldState
    expect(alternateQueuePosition(world, 'wta500')).toBe(0)
  })
})

describe('§2 the world rolls the chairs, once per event', () => {
  it('⭐ the same event answers the same number every time it is asked', () => {
    // The card, the turnstile and the calendar all ask this - they cannot be allowed to disagree
    // about how many places are open, or the number she planned against is not the number she gets.
    const world = atRank('alt-stable', 1)
    const e = slamAt(world, 6, 4)
    const first = alternatePlacesOpen(world.seed, e)
    for (let i = 0; i < 5; i++) expect(alternatePlacesOpen(world.seed, e)).toBe(first)
  })

  it('⭐⭐ a list that stands LONGER loses more players – the window is the calendar\'s own', () => {
    // The rate is `ECONOMY.availability.injuryBaseChance` and the window is `deadlineWeek` to `week`,
    // both already in the game. Asserted as a MONOTONE property over a corpus rather than as a figure,
    // so a re-pricing of the injury rate moves it honestly instead of reddening it.
    let shortTotal = 0
    let longTotal = 0
    for (let s = 0; s < 60; s++) {
      const world = atRank(`alt-window-${s}`, 1)
      shortTotal += alternatePlacesOpen(world.seed, slamAt(world, 8, 1))
      longTotal += alternatePlacesOpen(world.seed, slamAt(world, 8, 8))
    }
    expect(longTotal, 'an eight-week list loses more of its field than a one-week list').toBeGreaterThan(shortTotal)
  })

  it('⚠ and it never opens more chairs than the list has', () => {
    for (let s = 0; s < 40; s++) {
      const world = atRank(`alt-cap-${s}`, 1)
      expect(alternatePlacesOpen(world.seed, slamAt(world, 10, 10))).toBeLessThanOrEqual(ALTERNATES.places)
    }
  })
})

describe('§3 the calendar and the turnstile read ONE list', () => {
  it('⭐⭐ a chair that admits her at the door also opens the rung on the calendar', () => {
    // ⚠ THIS IS THE LESSON THE WILD CARD TAUGHT EARLIER THE SAME DAY, and the reason this arm exists
    // at all: `homeWildCardPlace` answered false without an event id while `Snapshot.tierOpen` is built
    // per rung, so a girl the turnstile admitted was shown a SHUT rung. Both doors ask one function.
    let admitted = 0
    for (let s = 0; s < 40; s++) {
      const world = atRank(`alt-agree-${s}`, 1)
      const e = slamAt(world, 6, 6)
      if (!alternateListPlace(world, 'wta500', e.id)) continue
      admitted++
      expect(entryStatus(world, e).level, `${s}: the door admits`).not.toBe('blocked')
      expect(tierOpenFor(world, 'wta500', e.id), `${s}: and the calendar agrees`).toBe(true)
    }
    expect(admitted, 'the sweep really found admissions, or it proves nothing').toBeGreaterThan(0)
  })
})

describe('§4 both numbers reach the card BEFORE she commits', () => {
  it('⭐⭐ the snapshot carries her queue position and the open chairs', () => {
    // The whole design. A hard cut tells her nothing about next week; this tells her where she stands
    // and what would have to happen - «тогда как раз и проще планировать будет».
    const world = atRank('alt-card', 2)
    const e = slamAt(world, 5, 5)
    const row = toSnapshot(world).upcoming.find((u) => u.id === e.id)
    expect(row, 'the event is on the card').toBeTruthy()
    expect(row!.alternateQueue, 'she is second in line').toBe(2)
    expect(row!.alternatesOpen, 'and the chairs are a number she can read').toBe(
      alternatePlacesOpen(world.seed, e),
    )
  })
})
