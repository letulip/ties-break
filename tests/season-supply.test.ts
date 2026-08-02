// THE PLANNING COUNTER (owner, 02.08: «мне кажется мы где-то можем сделать каунтер сколько
// доступных турниров и какого уровня у нас до конца года вообще осталось, это даст человеку
// возможность планировать»), and the ruling it rides on: «пустые недели это нормально, она же не
// может постоянно играть» - roughly twenty events a year is one a fortnight, with more on offer
// than she can take. So the counter is not a promise of a full calendar; it is the SUPPLY, which is
// what makes resting a visible choice rather than a hole she fell into.
//
// WHAT IT MUST NOT BE, and this is the whole reason it exists separately from `upcoming`: the feed
// is eight weeks long and passes through the two-type rule, so on a sparse tail it can honestly
// show almost nothing while the season still holds a dozen entries she could make.
import { describe, expect, it } from 'vitest'
import { KID_ID, createWorld, enterEvent, recomputeKidRank, toSnapshot } from '../src/engine/world'
import { TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

function supplyOf(world: ReturnType<typeof createWorld>) {
  return toSnapshot(world).seasonSupply
}

describe('the season supply counter', () => {
  it('counts the whole season ahead, not the eight-week feed', () => {
    const world = createWorld('supply-horizon')
    recomputeKidRank(world)
    const snap = toSnapshot(world)
    const feedWeeks = new Set(snap.upcoming.map((e) => e.week))
    const supply = snap.seasonSupply
    const total = supply.rows.reduce((n, r) => n + r.open, 0)
    // A fresh career opens with Local every other week, so a season holds far more than the feed's
    // window can show. The exact number is the calendar's business; the RELATION is this test's.
    expect(total).toBeGreaterThan(feedWeeks.size)
    expect(supply.weeksLeft).toBeGreaterThan(8)
  })

  it('stops at the season boundary - next year is not this year\'s supply', () => {
    const world = createWorld('supply-boundary')
    // Two weeks before the season turns: whatever is left is small, and nothing from the next
    // season block may leak into it.
    world.week = WEEKS_PER_YEAR - 2
    recomputeKidRank(world)
    const supply = supplyOf(world)
    expect(supply.weeksLeft).toBe(1)
    for (const row of supply.rows) expect(row.open).toBeLessThanOrEqual(2)
  })

  it('counts only rungs the engine opens to her, in ladder order', () => {
    const world = createWorld('supply-gate')
    recomputeKidRank(world)
    const supply = supplyOf(world)
    const tiers = supply.rows.map((r) => r.tier)
    // A fresh fourteen-year-old is offered the domestic bottom and nothing above it: no J rung has
    // opened, and every W rung is age-blocked as well as points-blocked.
    expect(tiers).not.toContain('j300' as TierId)
    expect(tiers).not.toContain('w15' as TierId)
    // Ladder order, weakest first - the one order every surface reads.
    const positions = tiers.map((t) => TIER_LADDER.indexOf(t))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    // ...and a rung with nothing left is absent rather than present with a zero.
    for (const row of supply.rows) expect(row.open).toBeGreaterThan(0)
  })

  it('an entry she has made stays counted, and is reported as hers', () => {
    const world = createWorld('supply-entered')
    recomputeKidRank(world)
    const before = supplyOf(world)
    const target = world.season.find(
      (e) => e.week > world.week && e.tier === 'local' && e.deadlineWeek >= world.week,
    )!
    enterEvent(world, target.id)
    const after = supplyOf(world)
    const rowBefore = before.rows.find((r) => r.tier === 'local')!
    const rowAfter = after.rows.find((r) => r.tier === 'local')!
    // Entering does not REDUCE the supply - the event is still tennis she is playing - but it moves
    // into the `entered` half, which is what lets a surface say "3 left, 1 of them booked".
    expect(rowAfter.open).toBe(rowBefore.open)
    expect(rowAfter.entered).toBe(rowBefore.entered + 1)
    expect(world.entries).toContain(target.id)
    expect(KID_ID).toBe('kid') // the ledger this all hangs off is hers
  })
})
