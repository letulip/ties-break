// ROUND 23 ITEM 16 – DOES THE ACADEMY'S ARRIVAL GET ANNOUNCED, AND CAN THE PLAYER SEE IT?
//
// The owner, 19.08: «Что-то я не увидел когда академия появилась, покрывающая расходы на поездки.
// Проверь функционал оповещения пожалуйста»
//
// THREE QUESTIONS, ASKED IN ORDER, because the answer to each decides whether the next one matters:
//
//   1. DID THE ACADEMY APPEAR?  Yes. His own save (`alice-cfbv_w257`) carries
//      `academy = { level 0.4399, sinceWeek 52, seasonIndex 4, coveredCents 2_087_945 }` – a 33%
//      travel scholarship taken on at week 52 that has paid $20,879.45 of fares this season alone.
//
//   2. DID AN EVENT FIRE?  Yes, exactly once, and it is still in his ledger 205 weeks later:
//      `academy-in-1`, `type: 'milestone'`, `keep: true`, stamped week 52 –
//      «An academy has taken her on – a scholarship covering 33% of her travel.» The three later
//      reviews (weeks 104 / 156 / 208) said nothing because `reviewAcademy` only speaks when the
//      ROUNDED percentage moves, and his never did.
//
//   3. DID IT REACH A SURFACE HE READS?  ⚠ NO – and it is arithmetic, not luck. `reviewAcademy` runs
//      at `week % 52 === 0`. `advanceWeeks` has a hard stop at `week % 52 === 49` (the season wrap),
//      and the shell's own bigger step is FOUR weeks. 49 + 4 = 53. The verdict week is the one week
//      of the season a `+4` player systematically cannot land on, and `WeekRecapCard` renders only
//      the CURRENT week's events – so the one card the line appears on is never drawn.
//
// WHAT THIS FILE IS FOR. The first three tests are the regression net the item asked for: they go
// red if the notice stops firing on any of its three arms. The last one is the MEASUREMENT of (3),
// pinned so the collision cannot quietly change shape – see its own comment for what to do with it
// on the day the advance learns to stop here.
import { describe, it, expect, vi } from 'vitest'

// The rise/fall arm ticks two full seasons of a real career to reach its second review.
vi.setConfig({ testTimeout: 120_000 })

import {
  advanceWeeks,
  createWorld,
  reviewAcademy,
  tickWeek,
  enterEvent,
  skipTournament,
  closeTournament,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type FamilyBackground } from '../src/shared/protocol'

/** A real career of the given background, ticked with a policy that enters whatever the gate allows
 *  – the academy's hard gate is that she COMPETES, so a world that never entered anything can only
 *  ever prove the "she stopped playing" arm. Lifted from tests/academy.test.ts's own `runCareer`. */
function runCareer(seed: string, background: FamilyBackground, weeks: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  for (let w = 0; w < weeks; w++) {
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* gated on points / funds / availability – the policy just moves on */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/** Every line the academy has written into the feed, in order. */
function academyLines(world: WorldState) {
  return world.events.filter((e) => /academy|scholarship/i.test(e.text))
}

describe('Round 23 #16 – the academy says so when it takes her on', () => {
  it('the ARRIVAL fires, as a milestone the ledger prune can never lose, and it quotes the share', () => {
    const world = runCareer('r23-academy-arrival', 'working', 60)
    expect(world.academy, 'a working family with a real junior year gets backed').not.toBeNull()

    const arrival = world.events.filter((e) => e.milestoneKey?.startsWith('academy-in-'))
    expect(arrival, 'exactly one arrival line, and it is idempotent per season').toHaveLength(1)
    const line = arrival[0]
    expect(line.type).toBe('milestone')
    // ⚠ `keep` is what stops the 400-row prune deleting the only trace. His save proves it works:
    // the line is still there 205 weeks and ~2,000 events later.
    expect(line.keep, 'the arrival survives the ledger prune').toBe(true)
    expect(line.week, 'the verdict is handed down on a season boundary').toBe(world.academy!.sinceWeek)
    expect(line.week % WEEKS_PER_YEAR).toBe(0)

    // The percentage on the line is the one the travel discount really uses – not the raw level.
    const pct = Math.round(world.academy!.level * ECONOMY.academy.travelCover * 100)
    expect(line.text).toBe(`An academy has taken her on – a scholarship covering ${pct}% of her travel.`)
  })

  it('a CHANGED share fires its own line, and an unchanged one deliberately stays quiet', () => {
    const world = runCareer('r23-academy-review', 'working', 60)
    expect(world.academy).not.toBeNull()

    /** Hold the review's gates open at `week`: a year of tournaments behind her, so the only input
     *  left free is her rank. `reviewLevel` reads nothing else that can move. */
    const reviewAt = (week: number, rank: number) => {
      world.week = week
      world.kidRank = rank
      world.results = Array.from({ length: ECONOMY.academy.minEventsPerYear + 2 }, (_, i) => ({
        playerId: 'kid',
        week: week - 4 - i,
        points: 0,
      }))
      reviewAcademy(world)
      return world.academy!.level
    }

    // Two reviews a season apart with the SAME rank. Identical inputs, identical verdict.
    const first = reviewAt(2 * WEEKS_PER_YEAR, 150)
    const same = reviewAt(3 * WEEKS_PER_YEAR, 150)
    expect(same, 'nothing the academy looks at moved').toBeCloseTo(first, 10)
    // Silence is the DESIGNED behaviour – a line every January saying nothing changed is noise – and
    // it is also half of why his career went quiet after week 52: his share stayed at 33% for four
    // reviews, so four reviews said nothing at all.
    expect(
      academyLines(world).filter((e) => e.week === 3 * WEEKS_PER_YEAR && e.type === 'info'),
      'an unchanged share is not announced',
    ).toHaveLength(0)

    // ...and now move it for real: a rank at the top of the band lifts the share, and THAT is said.
    const wasPct = Math.round(same * ECONOMY.academy.travelCover * 100)
    const now = reviewAt(4 * WEEKS_PER_YEAR, ECONOMY.academy.rankFull)
    const nowPct = Math.round(now * ECONOMY.academy.travelCover * 100)
    expect(nowPct, 'the top of the results band really is a better verdict').toBeGreaterThan(wasPct)
    const said = world.events.filter(
      (e) => e.week === 4 * WEEKS_PER_YEAR && e.type === 'info' && /scholarship/.test(e.text),
    )
    expect(said, 'a share that moved is announced').toHaveLength(1)
    expect(said[0].text).toBe(`Academy review: her scholarship rises to ${nowPct}% of her travel.`)
  })

  it('the END fires, and it names WHICH of the three reasons it was', () => {
    const world = runCareer('r23-academy-end', 'working', 60)
    expect(world.academy).not.toBeNull()

    // She aged out: the one arm a player cannot argue with, and the one whose wording matters most.
    // ⚠ REACHED BY MOVING THE WORLD, NOT BY EDITING HER BIRTHDAY. The review reads HER clock and not
    // the band's (owner ruling 1, 09.08 – world/age.ts), so eight seasons of weeks is the honest way
    // past `ECONOMY.academy.ageBand[1]`, and it exercises the same `kidAgeAt` the engine reads.
    const aged = { ...world } as WorldState
    aged.events = [...world.events]
    aged.week = world.week + WEEKS_PER_YEAR * 8
    reviewAcademy(aged)
    expect(aged.academy, 'the scholarship really ended').toBeNull()
    const ended = aged.events.filter((e) => e.week === aged.week && /ended her scholarship/.test(e.text))
    expect(ended, 'the end is announced rather than a field going quietly null').toHaveLength(1)
    expect(ended[0].text).toBe('The academy has ended her scholarship – she has aged out of their junior programme.')
  })

  // ===============================================================================================
  // ⚠⚠ THE MEASUREMENT, AND IT IS THE ANSWER TO HIS QUESTION. Everything above passes today: the
  // notice fires, on every arm, and survives the prune. What fails is the last hop.
  //
  // ⚠ THIS PINS A DEFECT, WHICH IS WHY IT SAYS SO IN ITS NAME. On the day `advanceWeeks` learns to
  // stop on the academy's verdict (the shape R12-15 gave the walkover: a StopReason, one
  // `stops.add`, one line of toast copy), this test goes red on the `landed` assertion and should be
  // REPLACED by one that asserts the stop, not repaired. It is here so the collision cannot change
  // shape unnoticed in the meantime – if the off-season length or the advance step ever moves, this
  // is the file that says the arithmetic moved with it.
  // ===============================================================================================
  it('⚠ DEFECT, PINNED: the verdict week is the one week a +4 advance steps over', () => {
    // The two constants that collide, read from the engine rather than written out.
    const wrapWeek = WEEKS_PER_YEAR - OFF_SEASON_WEEKS // 49 – where `advanceWeeks` adds 'season-end'
    const verdictWeek = WEEKS_PER_YEAR // 52 – where `reviewAcademy` runs (`week % 52 === 0`)
    expect(verdictWeek - wrapWeek, 'the verdict lands inside one +4 step of the wrap').toBeLessThan(4)

    const world = createWorld('r23-academy-skip', { ...DEFAULT_PROFILE, background: 'working' })
    const rng = rngFromSeed(world.seed)
    // Stand her on the week before the wrap. Nothing has been entered, so nothing blocks: the two
    // presses below are the shell's own `advance(1)` and `advance(4)`, with no dialog in between.
    world.week = wrapWeek - 1
    const landed: number[] = []

    const toWrap = advanceWeeks(world, rng, 1)
    landed.push(world.week)
    expect(world.week, 'the first press closes the season').toBe(wrapWeek)
    expect(toWrap, 'and the advance really does halt on it').toContain('season-end')

    // ...and now the press he would have made: the season is over, so +4.
    advanceWeeks(world, rng, 4)
    landed.push(world.week)
    expect(world.week, 'one +4 from the wrap lands past the verdict').toBe(wrapWeek + 4)
    expect(
      landed,
      'the verdict week is never a landing week, so its recap card is never rendered',
    ).not.toContain(verdictWeek)
  })
})
