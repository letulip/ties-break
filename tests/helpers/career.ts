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
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
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
