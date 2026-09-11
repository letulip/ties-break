// THE FIXTURE EVERY MOUNTED TEST BUILDS: a real career, walked through the real engine, read back
// through the real protocol. Eight component suites had written this out locally.
//
// ⚠ THE SEED STAYS AT THE CALL SITE, and that is not laziness. The eight copies differed in exactly
// one thing – their default seed – and a seed is not boilerplate: it IS the fixture. `component-home`
// and `recap-money` are different careers, and a suite that silently started walking somebody else's
// would keep passing while asserting about the wrong world. So this module owns the WALK; each file
// keeps a one-line binding that names its own career.
//
// ⚠ NO `import.meta.url` ANYWHERE IN HERE. The `component` project runs under happy-dom, where
// `import.meta.url` resolves to an http scheme and `new URL(rel, import.meta.url)` throws "The URL
// must be of scheme file" at COLLECT time – the whole file then reports "no tests" rather than one
// red assertion. Nothing here touches the filesystem; keep it that way.
import { answerLifeBeat, createWorld, pendingLifeBeat, tickWeek, toSnapshot, LIFE_BEAT_OPTIONS, type WorldState } from '../../src/engine/world'
import type { LifeBeatKind } from '../../src/shared/protocol'
import { rngFromSeed } from '../../src/engine/rng'
import type { PlayerProfile, Snapshot } from '../../src/shared/protocol'

/**
 * A career on `seed`, ticked `weeks` weeks, as a `Snapshot`.
 *
 * ⚠ `profile` is passed through only when given, so the seven suites that call `createWorld(seed)`
 * make byte-for-byte the call they made before this helper existed. `createWorld`'s own default is
 * `DEFAULT_PROFILE`; spreading it here instead would be equivalent today and a place for a silent
 * drift tomorrow.
 */
export function careerSnapshot(weeks: number, seed: string, profile?: PlayerProfile): Snapshot {
  const world = profile ? createWorld(seed, profile) : createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

/** ⭐⭐ v74 (the private life, wave 3 – T6) – ANSWER WHATEVER BEAT IS WAITING, WITH THE ANSWER THAT
 *  COSTS NOTHING, AND KEEP ANSWERING UNTIL THE QUEUE IS EMPTY. Returns how many it cleared.
 *
 *  ⚠⚠ WHY THIS EXISTS, AND IT IS A FINDING RATHER THAN A CONVENIENCE. Until T6 there was exactly ONE
 *  beat kind, so `answerLifeBeat(world, 'listen')` was a complete answer and a dozen walk helpers
 *  across this suite wrote it out by hand. T6 adds `'met'`, raised on `knownWeek` – any week from her
 *  sixteenth on – and `'listen'` is not one of ITS answers: every one of those call sites threw «That
 *  is not one of the answers this beat offered» the moment a career met somebody, and the walkers
 *  that handled no beat at all simply stalled, because `advanceWeeks` refuses to tick while a row is
 *  unanswered. One helper, asked of the row's OWN kind, is what stops the next beat kind doing it
 *  again.
 *
 *  ⚠ BOND-NEUTRAL BY CONSTRUCTION. It takes the option whose delta is zero, so a beat a fixture never
 *  meant to live cannot move the number that fixture is measuring – and it THROWS if a kind has no
 *  such option rather than picking one, because a silently chosen answer would move every bond
 *  assertion in the suite by an unknown amount. */
export function drainLifeBeats(world: WorldState, except?: LifeBeatKind): number {
  let cleared = 0
  for (let guard = 0; guard < 200; guard++) {
    const row = pendingLifeBeat(world)
    // ⚠ `except` IS FOR A FIXTURE WHOSE SUBJECT IS ONE OF THE KINDS: a walk that drained the beat it
    // was built to reach would delete the thing the file is about. Everything else is cleared.
    if (row === null || row.kind === except) return cleared
    const free = LIFE_BEAT_OPTIONS[row.kind].find((o) => o.bond === 0)
    if (!free) throw new Error(`${row.kind} has no bond-neutral answer – a walk cannot drain it without moving the number`)
    answerLifeBeat(world, free.id)
    cleared++
  }
  throw new Error('a life-beat queue that will not drain')
}
