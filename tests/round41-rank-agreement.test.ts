import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  skipTournament,
  closeTournament,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { TIER_LADDER } from '../src/engine/season/calendar'
import { fieldProsOf, kidLadderRank, kidLadderRankFolded, kidPoints, rankIn } from '../src/engine/world/ladder'
import type { LadderTrack } from '../src/engine/season/types'

// =================================================================================================
// ROUND 41 #26 – THE TILE AND THE TABLE ANSWER ONE QUESTION
// =================================================================================================
//
// The owner, 12.09: «в тайле под аватаркой professional #3 а реальный в таблице #4».
//
// Both numbers were right. `ladders[track].rank` read the persisted cache (`world.kidRankWta`,
// written by the tick's `recomputeRankAndMilestones`); `ladders[track].standings` beside it is a
// fresh `rankingFor` fold at snapshot time. ONE aggregate, TWO evaluation moments – and the tick
// opens a gap between them at least three ways: the season wrap clears `world.fieldSeasonPoints`
// AFTER the weekly recompute, the reveal week defers the recompute to `finalizeTournament`, and
// `settleMandatoryQuota` writes later still.
//
// ⚠ SO WHAT IS PINNED IS THE AGREEMENT, NEVER EITHER NUMBER. Both stale paths below are deliberate
// engine orderings and this round does not reprice them; what the fix removes is the VIEW's second
// question. A test that pinned a rank would have to move every time the field or the calendar is
// retuned, and would still not be about the thing the owner reported.

const TRACKS: LadderTrack[] = ['domestic', 'itf', 'wta']

/** Her row IN THE TABLE THE SAME VIEW SHIPPED – `computeStandings`' window always contains her
 *  (top 10 plus a window around her), which is what makes this the honest comparison rather than a
 *  second fold of our own. */
function tableRankOf(standings: { isKid: boolean; rank: number }[]): number | undefined {
  return standings.find((r) => r.isKid)?.rank
}

/** THE WHOLE PROPERTY, asked of a snapshot: every ladder's headline number is the number its own
 *  table seats her at. */
function expectAgreement(world: WorldState, where: string): void {
  const snap = toSnapshot(world)
  for (const track of TRACKS) {
    const view = snap.ladders[track]
    const seated = tableRankOf(view.standings)
    if (view.rank === null) continue
    expect(seated, `${where}: ${track} – she is not in her own standings window`).toBeDefined()
    expect(view.rank, `${where}: the ${track} tile says #${view.rank}, the table seats her #${seated}`).toBe(seated)
  }
  // And the tournament overlay prints the same place as the screens behind it – `PendingView.kidRank`
  // moved onto the same fold in the same commit, for the reason its own note gives.
  if (snap.pending && snap.pending.ladder) {
    expect(snap.pending.kidRank, `${where}: the VS card and the ${snap.pending.ladder} tile disagree`).toBe(
      snap.ladders[snap.pending.ladder].rank,
    )
  }
}

describe('round 41 #26 — the season-wrap week, where he photographed it', () => {
  // ⚠ THE MUTATION THAT MUST FAIL THIS: put `rank: kidLadderRank(world, track)` back in
  // `computeLadderView` (world/snapshot.ts) and this arm reds – the tile prints the stale cache and
  // the table beneath it prints the fold, eight places apart on the fixture below.
  it('a cache written BEFORE `fieldSeasonPoints` is cleared cannot reach the screen', () => {
    // The exact ordering of `maybeFireSeasonWrapUp`: `recomputeRankAndMilestones` at phaseAiWeek.ts
    // :503 writes the rank; the wrap clears the field's season tally at :512, after it. The tally is
    // an input to the merged W table (`mergedWtaRanking`), so from that line until the next tick the
    // cache is one week's arithmetic behind the fold – once per season, which is exactly the era his
    // screenshot is from. Reproduced here rather than walked to, because walking a career to a
    // professional season wrap is several hundred weeks to observe one week's derivation.
    const world = createWorld('r41-rank-agree')
    // On the W table at all: §VIII.A.2.b wants three scoring tournaments or ten points.
    for (let i = 0; i < 3; i++) {
      world.results.push({ playerId: KID_ID, week: world.week - i, points: 15, tier: 'w15' })
    }
    expect(kidPoints(world, 'wta')).toBeGreaterThan(0)

    // A season's tally over the pros who actually got a draw, spread around her own book so the
    // movement lands where she is standing.
    const near = fieldProsOf(world).filter((p) => p.wtaPoints >= 40 && p.wtaPoints <= 60).slice(0, 40)
    expect(near.length, 'the field has rows around her book to move').toBeGreaterThan(10)
    const tally: Record<string, number> = {}
    near.forEach((p, i) => (tally[p.id] = i % 2 === 0 ? p.wtaPoints * 2 : 1))

    world.fieldSeasonPoints = tally
    const atRecompute = kidLadderRankFolded(world, 'wta')
    expect(atRecompute).not.toBeNull()
    world.kidRankWta = atRecompute! // :503 – the tick's own write
    world.fieldSeasonPoints = {} //    :512 – the wrap, after it

    // THE DISCRIMINATOR: the two moments really do disagree here, so the assertion below is not a
    // tautology. Without this line a fix that changed nothing would still pass.
    expect(kidLadderRank(world, 'wta'), 'the cached number').toBe(atRecompute)
    expect(kidLadderRankFolded(world, 'wta'), 'the folded number').not.toBe(atRecompute)

    expectAgreement(world, 'the season-wrap week')
  })

  it('and the ENGINE still reads the cache – only the projection layer moved', () => {
    // `world.kidRankWta` decides home wild-card places, the acceptance cuts and the entry gates,
    // where a rank is a DECISION the tick made. Re-folding underneath those would be a balance
    // change nobody asked for, so the cache and its readers are deliberately untouched.
    const world = createWorld('r41-rank-cache')
    for (let i = 0; i < 3; i++) {
      world.results.push({ playerId: KID_ID, week: world.week - i, points: 15, tier: 'w15' })
    }
    world.kidRankWta = 4242
    expect(rankIn(world, 'wta')).toBe(4242)
    expect(kidLadderRank(world, 'wta')).toBe(4242)
    // ...and building a snapshot neither reads it for the tile nor writes over it.
    const shown = toSnapshot(world).ladders.wta.rank
    expect(shown).not.toBe(4242)
    expect(world.kidRankWta, 'the snapshot is a projection and writes nothing').toBe(4242)
  })
})

describe('round 41 #26 — and it holds every week of a real career', () => {
  /** Enter the strongest thing she is allowed into, one event at a time (the sweep idiom from
   *  tests/season/domestic-nation.test.ts). */
  const enterWhatSheCan = (w: WorldState): void => {
    const busy = new Set(w.season.filter((e) => w.entries.includes(e.id)).map((e) => e.week))
    const byRung = [...w.season].sort((a, b) => TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier))
    for (const e of byRung) {
      if (e.week <= w.week || w.week > e.deadlineWeek) continue
      if (w.entries.includes(e.id) || busy.has(e.week)) continue
      if (entryStatus(w, e).level === 'blocked') continue
      enterEvent(w, e.id)
      return
    }
  }

  it('including the REVEAL weeks, where the tick defers the recompute on purpose', () => {
    // The second stale path (`ladder.ts`, `kidLadderRank`'s own note): while a run is open the tick
    // hands the rank recompute to `finalizeTournament`, so the week's AI results are already banked
    // in the ledger the fold reads while the cache still holds last week's place. The snapshot below
    // is taken WITH the reveal open – which is exactly when the flow is on screen.
    const world = createWorld('r41-rank-walk')
    world.fundsCents = 9_999_999_00
    const rng = rngFromSeed(world.seed)
    let revealWeeksSeen = 0
    let rankedWeeksSeen = 0

    enterWhatSheCan(world)
    for (let i = 0; i < 130; i++) {
      world.fundsCents = 9_999_999_00
      tickWeek(world, rng)
      if (world.pendingTournament && !world.pendingTournament.finished) {
        revealWeeksSeen++
        expectAgreement(world, `reveal week ${world.week}`)
      }
      expectAgreement(world, `week ${world.week}`)
      if (toSnapshot(world).ladders.domestic.rank !== null) rankedWeeksSeen++
      if (world.pendingTournament) {
        if (!world.pendingTournament.finished) skipTournament(world)
        closeTournament(world)
      }
      enterWhatSheCan(world)
    }

    // Both counters are discriminators: a career that entered nothing would satisfy every assertion
    // above by never being ranked and never opening a reveal.
    expect(revealWeeksSeen, 'the walk never opened a reveal – the deferral arm proves nothing').toBeGreaterThan(5)
    expect(rankedWeeksSeen, 'the walk was never ranked anywhere – the agreement is vacuous').toBeGreaterThan(50)
  })
})

describe('round 41 #26 — «unranked is not a number» survives the move', () => {
  it('rank is null exactly when she holds nothing in that table, on both functions', () => {
    const world = createWorld('r41-rank-null')
    for (const track of TRACKS) {
      expect(kidPoints(world, track)).toBe(0)
      expect(kidLadderRankFolded(world, track), `${track} on a fresh career`).toBeNull()
      expect(toSnapshot(world).ladders[track].rank).toBeNull()
    }
    // ...and the guard is the SAME question `kidLadderRank` asks, so the nullability of the two
    // functions cannot drift apart.
    world.results.push({ playerId: KID_ID, week: world.week, points: 25, tier: 'national' })
    expect(kidLadderRank(world, 'domestic') === null).toBe(kidLadderRankFolded(world, 'domestic') === null)
    expect(kidLadderRankFolded(world, 'domestic')).not.toBeNull()
    expect(toSnapshot(world).ladders.domestic.rank).not.toBeNull()
  })
})
