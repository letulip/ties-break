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
import { createWorld, tickWeek, toSnapshot, skipTournament, closeTournament, kidAgeExact } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type PlayerProfile, type Snapshot } from '../../src/shared/protocol'
import type { Rng } from '../../src/engine/rng'
import type { WorldState } from '../../src/engine/world'
// ⚠ `drainLifeBeats` LIVES IN `tools/` AND IS RE-EXPORTED HERE, NOT COPIED (v74, T6b). It was written
// in this file for T6 and then needed, word for word, by the 46 hand-written
// `answerLifeBeat(world, 'listen')` sites across 38 tools – so the body moved to
// `tools/_lifeBeats.ts` and this line is all that is left of it. The direction is the one the
// repository already runs: `tests/` imports `tools/` in 25 files and no tool imports `tests/`. Two
// copies of a helper whose whole job is «do not move the number» is exactly the drift that lets one
// of them start moving it.
export { drainLifeBeats } from '../../tools/_lifeBeats'
// ⚠ SAME ARRANGEMENT, ONE ROUND LATER (round 42 #1): the neutral birthday answer's body lives in
// `tools/_birthday.ts` because the college probes walk the same warm-up birthdays the suites do.
export { answerBirthdayNeutral } from '../../tools/_birthday'

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

// =================================================================================================
// THE THREE WALKS F-02's CENSUS FOUND (26.09, W5's T5.11)
// =================================================================================================
//
// F-02 counted 34 world walks with a local tick loop, 29 `careerAt`, 27 `weekAtAge` and one walk body
// that is byte-identical in 13 component files – beside this module, which exported ONE walk. The
// three below are the census's own three, in its own shapes, and the seed still stays at the call
// site for the reason this file's header gives.
//
// ⚠⚠ AND THE WORLD AND THE RNG STAY AT THE CALL SITE TOO, which is not symmetry for its own sake:
// **a walk's POLICY decides which MAIN draws the fixture taps** (F-02's own sentence), and so does
// WHICH STREAM it walks on. The 13-copy family opens with `rngFromSeed(world.seed)`; three more
// files open with `resumeMain(world.rngMain)`, because their world is about to be encoded and read
// back by the real worker, whose `ensureMainState` compares the two. A helper that picked one would
// have silently re-pointed the other family's dice. So `walkWeeks` takes the pair it is handed and
// owns only the LOOP.

/**
 * `weeks` ticks on a world that already exists, answering nothing but the tournament desk.
 *
 * The body is F-02's 13-copy majority verbatim: tick, and if a bracket is standing, skip it and close
 * it. `skipTournaments: false` is the 8-copy variant that wants the bracket left where it is.
 */
export function walkWeeks(
  world: WorldState,
  rng: Rng,
  weeks: number,
  opts: { skipTournaments?: boolean } = {},
): WorldState {
  const skip = opts.skipTournaments ?? true
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (skip && world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/**
 * A POKED world – no walk at all: a fresh career with its calendar emptied, standing on `week`.
 *
 * F-02 found 19 of the 29 `careerAt` definitions doing exactly this, 5 of them byte-identical
 * (`wave3-delivery.test.ts:122` and its siblings). It taps NO dice: nothing is ticked, so a case that
 * uses it is asserting about a shape and not about a career.
 *
 * ⚠ `DEFAULT_PROFILE` IS PASSED UNSPREAD, exactly as the five copies pass it. `createWorld` does not
 * retain it, and spreading here would be equivalent today and a place for a silent drift tomorrow –
 * `careerSnapshot`'s note above is the same ruling.
 */
export function pokedAt(seed: string, week: number, profile: PlayerProfile = DEFAULT_PROFILE): WorldState {
  const world = createWorld(seed, profile)
  world.season = []
  world.week = week
  return world
}

/**
 * The first week on which she is at least `years` old.
 *
 * ⚠ THE 20-COPY MAJORITY BODY, AND THE SIX VARIANTS WERE NOT A STYLE QUESTION. F-02: they differ in
 * bound (`2000` / `40*52` / `700` / unbounded), in comparator (`kidAgeExact >= years` against
 * `kidAgeAt === age`) and in failure (throw against `-1`) – so «the same helper» gave two answers, and
 * an `=== age` copy returns the first week of a whole year where this returns the first week she has
 * REACHED it. This is the `>=` / throw form, which is what 20 of the 27 files were already using.
 */
export function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}
