// =================================================================================================
// ⭐⭐ B-05 / T2.5 – THE REVEAL TRIO RE-VALIDATES: A CLOSE ON AN UNFINISHED RUN FINISHES IT
// =================================================================================================
//
// `closeTournament` is documented «Dismiss a finished reveal» and did not check `finished`: after the
// college and call-up dispatch it ran `world.pendingTournament = null` unconditionally. So a `close`
// sent on an unfinished run DROPPED it – her points, her match rows, her season record and the
// condition the week cost all went with it, and the next tick ran normally on top of the hole.
//
// MEASURED by `docs/review-principles-2026-09-26/probes/b-close-unfinished.ts` on three seeds walked
// to an open week-3 reveal (close-only against the UI's own skip-then-close):
//
//     close-only   0 match rows, 0 kid result rows, a 0-0 season record, condition 100
//     skip+close   2 / 3 / 1 match rows, 1 / 1 / 0 kid result rows, records 1-1 / 2-1 / 0-1,
//                  condition 92 / 88 / 97
//
// ⚠ INVARIANT 1 IS WHAT THIS IS ABOUT, NOT A BUG THE SHIPPED APP CAN REACH. `TournamentFlow` sends
// `close` only from the finale, so no player press arrives here; the promise invariant 1 makes is
// that a STALE OR FOREIGN command cannot corrupt a career, and a free tournament – no condition
// cost, no loss on the record – is exactly the shape the caller order was silently protecting.
//
// ⚠⚠ THE FIX IS TOTAL AND NOT A REFUSAL (the owner's ruling 9, 26.09): `if (p && !p.finished)
// skipTournament(world)` before the clear. The guaranteed exit `composables/blockingOverlay.ts`
// relies on stays guaranteed – `close` still always closes – and NO NEW SENTENCE is needed, which a
// refusal would have needed and which is his to write.
//
// ⚠⚠ AND THE TWO SIBLING NO-OPS STAY IDEMPOTENT, which is the same ruling's other half.
// `revealTournamentRound` and `skipTournament` silently return when nothing is pending, exactly as
// their docs say. Block C pins that, so a later wave cannot read this file as a mandate to make them
// refuse – refusing needs a sentence, and the sentence is the owner's.
import { describe, expect, it } from 'vitest'
import {
  closeTournament,
  createWorld,
  enterEvent,
  entryStatus,
  revealTournamentRound,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

/** A career walked to an OPEN, unfinished reveal – `tests/dev-fast-forward.test.ts`'s own
 *  `pendingTournamentWorld` recipe, which the review's probe copied and this case walks again: enter
 *  whatever the gate allows and tick until a run is waiting to be read out. Walked rather than
 *  hand-built, deliberately: the claim is about a REAL run's points, rows and condition, and a
 *  fabricated `pendingTournament` would prove only that the clear was reordered. */
function pendingTournamentWorld(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let guard = 0; guard < 156 && !world.pendingTournament; guard++) {
    const e = world.season.find(
      (ev) => ev.week > world.week && !world.entries.includes(ev.id) && entryStatus(world, ev).level !== 'blocked',
    )
    if (e) {
      try {
        enterEvent(world, e.id)
      } catch {
        /* deadline race – the gate's answer is the point */
      }
    }
    tickWeek(world, rng)
  }
  if (!world.pendingTournament) throw new Error(`${seed}: the walk did not reach a reveal`)
  return world
}

const SEEDS = ['devff-reveal', 'b-close-1', 'b-close-2']

// =================================================================================================
// A. THE CLOSE FINISHES WHAT IT IS HANDED
// =================================================================================================
describe('B-05 A – a close on an unfinished run finishes it instead of dropping it', () => {
  it('⚠⚠ close-only and the UI\'s skip-then-close leave BYTE-IDENTICAL worlds', () => {
    // The sharpest form of «total, not refusing»: the engine's answer to a bare `close` is the same
    // career the player's own two presses produce. Deep equality covers the four things the drop was
    // costing (match rows, the result row, the season record, the condition) and also `rngMain`,
    // which is the house law here – finalising draws NOTHING new, because the run was simulated at
    // the tick and only the reading out was left.
    //
    // ⚠ MUTATION ARM: delete `if (p && !p.finished) skipTournament(world)` from `closeTournament` →
    // the two worlds diverge on every one of those fields, and this case names the first.
    for (const seed of SEEDS) {
      const base = pendingTournamentWorld(seed)
      expect(base.pendingTournament!.finished, `${seed}: the fixture really is unfinished`).toBe(false)
      expect(base.pendingTournament!.revealedRounds, `${seed}: and nothing has been read out`).toBe(0)

      const closeOnly = structuredClone(base)
      closeTournament(closeOnly)

      const skipThenClose = structuredClone(base)
      skipTournament(skipThenClose)
      closeTournament(skipThenClose)

      expect(closeOnly.pendingTournament, `${seed}: the close still always closes`).toBeNull()
      expect(closeOnly, `${seed}: a bare close is the player's own two presses`).toEqual(skipThenClose)
      // ...and it really did cost her something, so the equality above is not two empty worlds.
      expect(
        closeOnly.events.filter((e) => e.type === 'match').length,
        `${seed}: her matches are on the record`,
      ).toBeGreaterThan(0)
      expect(closeOnly.condition, `${seed}: and the week was paid for`).toBeLessThan(base.condition)
    }
  })

  it('⚠ the season record and the result row survive a bare close', () => {
    // The three fields the finding names, read one at a time so a failure says WHICH was dropped.
    const base = pendingTournamentWorld('devff-reveal')
    const world = structuredClone(base)
    closeTournament(world)
    const record = world.seasonRecord!.domestic
    expect(record.wins + record.losses, 'the matches reached the season record').toBeGreaterThan(0)
    expect(world.results.filter((r) => r.playerId === 'kid').length, 'and her result row was written').toBe(1)
    expect(world.condition, 'and the run charged its condition').toBeLessThan(100)
  })

  it('⚠ time moves on afterwards, exactly as it did when the run was dropped', () => {
    // The close is still an EXIT: whatever it had to finish, the week closes and the next tick runs.
    const world = pendingTournamentWorld('b-close-1')
    const at = world.week
    closeTournament(world)
    tickWeek(world, rngFromSeed('b-close-1:after'))
    expect(world.week, 'the next week happened').toBe(at + 1)
  })
})

// =================================================================================================
// B. A FINISHED REVEAL IS UNTOUCHED – the path every shipped press takes
// =================================================================================================
describe('B-05 B – the finale\'s own close is byte-identical', () => {
  it('⚠⚠ on a FINISHED run the close does exactly what it always did', () => {
    for (const seed of SEEDS) {
      const world = pendingTournamentWorld(seed)
      skipTournament(world)
      expect(world.pendingTournament!.finished, `${seed}: the run is finished and waiting`).toBe(true)
      const before = structuredClone(world)
      closeTournament(world)
      expect(world.pendingTournament, `${seed}: cleared`).toBeNull()
      // Nothing else moved: the only difference between the two worlds is the cleared field.
      expect({ ...world, pendingTournament: before.pendingTournament }, `${seed}: and nothing else`).toEqual(before)
    }
  })
})

// =================================================================================================
// C. THE TWO NO-OPS STAY IDEMPOTENT – the owner's ruling 9, pinned as an ABSENCE
// =================================================================================================
describe('B-05 C – reveal and skip on an empty world are no-ops, and that is a ruling', () => {
  it('⚠⚠ with nothing pending, all three commands return silently and change NOTHING', () => {
    // ⚠ THIS IS A PIN ON A DECISION, NOT ON AN OVERSIGHT. The review offered «refuse instead», and
    // the owner ruled the no-ops stay idempotent (ruling 9, 26.09) because a refusal needs a
    // player-facing sentence and the copy is his. A later wave that makes one of these throw has to
    // come through this case and fetch that sentence first.
    const world = createWorld('b05-empty', DEFAULT_PROFILE)
    tickWeek(world, rngFromSeed(world.seed))
    expect(world.pendingTournament, 'nothing is pending').toBeNull()
    const before = structuredClone(world)

    expect(() => revealTournamentRound(world), 'reveal does not throw').not.toThrow()
    expect(() => skipTournament(world), 'skip does not throw').not.toThrow()
    expect(() => closeTournament(world), 'close does not throw').not.toThrow()

    expect(world, 'and not one field moved').toEqual(before)
  })

  it('⚠ a SECOND close after a real one is the same no-op', () => {
    const world = pendingTournamentWorld('b-close-2')
    closeTournament(world)
    const after = structuredClone(world)
    closeTournament(world)
    expect(world, 'closing twice is closing once').toEqual(after)
  })
})
