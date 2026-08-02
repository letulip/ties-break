// THE ADOPTION-TIME RANK-CACHE REFRESH (wave/pro-prep, 02.08) – the "#9 chip over a #61 table"
// defect. The three rank caches are persisted state; a save written under an OLDER definition of a
// table wakes up stale (living-field phase W redefined the W table, and the owner's pre-phase-W
// career loaded a chip rank of #9 against a merged table that folds to #61 – audited on his own
// save with tools/points-audit.ts). `refreshDerivedRankCaches` is the class fix: every world the
// worker adopts recomputes the caches against today's tables, aligning prev* ONLY for tracks that
// moved, so a stale save heals on load while an ordinary reload keeps last week's real movement.
import { describe, expect, it } from 'vitest'
import { KID_ID, createWorld, recomputeKidRank, refreshDerivedRankCaches } from '../src/engine/world'

/** A world with a counting result on each of the three tracks, caches freshly written. */
function rankedWorld(seed: string) {
  const world = createWorld(seed)
  world.results.push(
    { playerId: KID_ID, week: world.week, points: 30, tier: 'national' },
    { playerId: KID_ID, week: world.week, points: 30, tier: 'j30' },
    { playerId: KID_ID, week: world.week, points: 10, tier: 'w15' },
  )
  recomputeKidRank(world)
  return world
}

describe('refreshDerivedRankCaches', () => {
  it('is a no-op on a world whose caches are already true (and says so)', () => {
    const world = rankedWorld('cache-noop')
    const before = {
      itf: world.kidRank,
      dom: world.kidRankDomestic,
      wta: world.kidRankWta,
      prevItf: world.prevKidRank,
      prevDom: world.prevKidRankDomestic,
      prevWta: world.prevKidRankWta,
    }
    expect(refreshDerivedRankCaches(world)).toBe(false)
    expect(world.kidRank).toBe(before.itf)
    expect(world.kidRankDomestic).toBe(before.dom)
    expect(world.kidRankWta).toBe(before.wta)
    // prev* untouched: an ordinary reload must keep last week's real movement arrow.
    expect(world.prevKidRank).toBe(before.prevItf)
    expect(world.prevKidRankDomestic).toBe(before.prevDom)
    expect(world.prevKidRankWta).toBe(before.prevWta)
  })

  it('heals a stale cache and aligns ONLY the moved track\'s prev*', () => {
    const world = rankedWorld('cache-stale')
    const fresh = { itf: world.kidRank, dom: world.kidRankDomestic, wta: world.kidRankWta }
    // The defect, reproduced: the persisted W cache says one thing (the pre-phase-W "#9"), the
    // table folds to another. The other two tracks stay true, with a real movement pair on ITF.
    world.kidRankWta = 9
    world.prevKidRankWta = 9
    const itfMovement = world.prevKidRank
    expect(refreshDerivedRankCaches(world)).toBe(true)
    // The moved track is healed, and its prev* is aligned – a movement arrow may only diff one
    // table with itself, never "old code's table minus new code's".
    expect(world.kidRankWta).toBe(fresh.wta)
    expect(world.prevKidRankWta).toBe(fresh.wta)
    // The unmoved tracks kept both their cache and their history.
    expect(world.kidRank).toBe(fresh.itf)
    expect(world.prevKidRank).toBe(itfMovement)
    expect(world.kidRankDomestic).toBe(fresh.dom)
  })

  it('is idempotent: the second call reports no movement', () => {
    const world = rankedWorld('cache-idem')
    world.kidRankWta = 9
    expect(refreshDerivedRankCaches(world)).toBe(true)
    expect(refreshDerivedRankCaches(world)).toBe(false)
  })
})
