// =================================================================================================
// WAVE 3, T4 – THE ATTACHMENT LIFT: THE EFFECTIVE BASELINE, AND THE WEEK IT STARTS
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T4, design `docs/plans/the-private-life-build.md`
// §1b, constant from `docs/specs/who-she-is-2026-09.md` §4 (`attachmentLift: +5 spirit baseline`).
//
// THE WHOLE RULE, IN ONE SENTENCE: while `activeEpisode` returns a row, `accrueSpirit`'s weekly
// return walks toward `baseline + attachmentLift` instead of a flat `baseline`. Nothing else moves –
// no bump, no row in `perturb`, no second writer. «Lifts a little and stays lifted» is a TARGET
// being moved, and every case below is about the difference between those two shapes: a lift that
// ARRIVES over ~2 weeks through the standing return rule and LEAVES the same way, against a spike
// that would decay.
//
// ⚠ WHAT THIS FILE DOES NOT DO. It asserts no player-facing sentence (CLAUDE.md invariant 4): this
// step raises no beat, no feed row and no string, and neither number is ever printed – the fog law
// (who-she-is §5) is `tests/spirit.test.ts`'s to hold and it is untouched here.
//
// ⚠ AND IT DOES NOT RE-ASSERT THE WAVE-1 PERTURBATION TABLE. Those pins live in
// `tests/spirit.test.ts`, they build worlds with NO episodes, and they must stay green and untouched
// – which is itself part of this step's evidence: a career with nobody in it still walks toward a
// flat 70.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was watched fail, and what it said is written here
// =================================================================================================
//
// The house format is `tests/wave3-arrival.test.ts`'s, and so is the reason it exists: an assertion
// can be vacuous and still look green. ⚠⚠ THE TRAP THE BRIEF NAMED FOR THIS STEP IN PARTICULAR is
// that an EQUILIBRIUM test can pass because the value never moved at all – «slot full -> 75» is
// satisfied by a baseline of 75 and no lift whatsoever. ARMS 1 and 2 are the two halves of that trap
// and both were run.
//
//   ARM 1  `ECONOMY.spirit.attachmentLift` set to 0
//          6 RED · §A «⭐⭐ slot FULL – she parks at 75 …: sunny from 70: expected 70 to be 75»,
//          §A «the two numbers ARE the design's: expected +0 to be 5», §B «the lift ARRIVES …: a
//          steady girl closes the whole 5 in one step: expected [ 70, 70, 70, 70 ] to deeply equal
//          [ 75, 75, 75, 75 ]», §B «the lift DISAPPEARS …: lifted first: expected 70 to be 75»,
//          §C «sunny at W=146: expected 70 to be 75», and tests/spirit.test.ts's RE-AIMED guard
//          «expected +0 to be 5».
//          ⚠ AND ONE PIN STAYED GREEN UNDER IT, correctly: tests/spirit.test.ts's Mood-ladder case
//          asserts `baseline + attachmentLift < glowingFrom`, which is a BOUND and is still true at
//          a lift of 0. It is not an equilibrium test and was never meant to be one.
//
//   ARM 2  the read IGNORES `activeEpisode` – `const target = s.baseline + s.attachmentLift`
//          52 RED, and the blast radius is the finding rather than the count. From this file:
//          §A «⭐⭐ slot EMPTY …: sunny from 70: expected 75 to be 70», §A «an ENDED row is nobody:
//          expected 75 to be 70», §B «the lift DISAPPEARS …: expected [ 75, 75, 75 ] to deeply equal
//          [ 70, 70, 70 ]», §B «no single week …: and she is home again: expected 75 to be 70», both
//          §C cases, and the guard's «it is gated on somebody actually being there: expected 'const
//          target = s.baseline + s.attachm…' to contain 'activeEpisode(world)'».
//          ⭐⭐ THE OTHER 44 ARE THE WAVE-1 FROM-BASELINE PERTURBATION PINS, every row of the table
//          on every intensity arm («an untouched week at baseline moves nothing: expected 5 to be
//          +0», «injury onset shows the FULL scaled −8: expected -1.4 to be -6.4», …). They build
//          worlds with NO episodes, so an ungated lift moves all of them at once – which is the
//          measured proof that those pins are the guard against exactly this mistake and that this
//          step left them alone.
//
//   ARM 3  the ORDER reversed at the call site – `rollArrival(world)` moved BELOW `accrueSpirit(world)`
//          in `world/phaseHerWeek.ts`
//          2 RED · §C «⭐⭐ a career that meets somebody in week W is already lifted at the END of
//          week W: sunny at W=146: expected 70 to be 75» – the lift arriving a week late, exactly the
//          defect the call-site order exists to prevent – and tests/spirit.test.ts's adjacency pin
//          «only the arrival roll separates them: expected [] to deeply equal [ 'rollArrival(world)' ]».
//
//   ARM 4  ⚠⚠ THE LIFT AS A BUMP – the target put back to a flat `s.baseline` and the constant added
//          as a ROW of `weekPerturbation` instead. This is the shape the design explicitly refuses,
//          and it is the one a careless reading of «+5 spirit» would produce.
//          6 RED · §A «sunny from 70: expected 74 to be 75» (a bump scaled by 0.8 parks a steady girl
//          at 74, not 75), §B «expected [ 74, 74, 74, 74 ] to deeply equal [ 75, 75, 75, 75 ]»,
//          §B «lifted first: expected 74 to be 75», §C «expected 74 to be 75», the guard's «one read,
//          and it is inside accrueSpirit: expected [] to have a length of 1 but got +0» – and the one
//          that names the SHAPE rather than the value: §B «⚠ no single week ever moves her by more
//          than her own return step: fiery never jumps: expected 6.299999999999997 to be less than or
//          equal to 3».
//
//   ARM 5  a SECOND reader of the constant – `const lift = ECONOMY.spirit.attachmentLift` added to
//          `arrivalEligible` in `world/lifeBeat.ts`
//          1 RED · the re-aimed guard's first line, «exactly one file in src/ reads it: expected
//          [ 'engine/spirit.ts', …(1) ] to deeply equal [ 'engine/spirit.ts' ]». The arm exists
//          because the guard was RE-AIMED rather than deleted, and a re-aimed guard that nobody
//          watched fail is a guard that was quietly dropped.
//
// ⚠ Every arm was reverted by restoring a byte-identical copy of the file (`diff -q` clean) and the
// pair re-run green afterwards – `git checkout -- src` is not used here, for the reason CLAUDE.md's
// own gotcha gives.
import { describe, it, expect } from 'vitest'
import {
  activeEpisode,
  birthdayTurning,
  createWorld,
  loveEpisodesOf,
  tickWeek,
  vacationForWeek,
  type WorldState,
} from '../src/engine/world'
import {
  accrueSpirit,
  seasonWrapsWithNoVacation,
  temperamentIntensity,
  TEMPERAMENTS,
  type Temperament,
} from '../src/engine/spirit'
import { ECONOMY } from '../src/engine/economy'
import { resumeMain } from '../src/engine/rng'
import { schoolIsOver } from '../src/engine/kidLife'
import { isBlackoutWeek } from '../src/engine/season/calendar'
import type { LoveEpisode } from '../src/shared/protocol'

const S = ECONOMY.spirit

/** Does `week` fire NO row of the perturbation table for this girl? `tests/spirit.test.ts`'s own
 *  helper, copied rather than exported: the two files ask the same question of different worlds and
 *  a shared helper between test files is a dependency neither of them wants. */
function quiet(base: WorldState, week: number): boolean {
  const schoolOver = schoolIsOver(week, base.profile.birthMonth)
  return (
    !isBlackoutWeek(week, schoolOver) &&
    birthdayTurning(week, base.profile.birthMonth, base.profile.birthDay) === null
  )
}

/** The first week ≥ `from` on which `pred` holds – so a case's week is FOUND rather than guessed. */
function weekWhere(pred: (w: number) => boolean, from = 1, limit = 600): number {
  for (let w = from; w < from + limit; w++) if (pred(w)) return w
  throw new Error('no such week inside the search window')
}

/** A career parked on a QUIET week, wearing the temperament under test and sitting at `spirit`.
 *  Built by `createWorld` and then MOVED, never hand-assembled – `tests/spirit.test.ts`'s doctrine:
 *  the shapes have to be the engine's own. */
function probeWorld(temperament: Temperament, spirit: number, seed = 'lift-probe'): WorldState {
  const world = createWorld(seed)
  world.temperament = temperament
  world.week = weekWhere((w) => quiet(world, w), 40)
  world.spirit = spirit
  world.bond = ECONOMY.bond.start
  return world
}

/** An attachment row of the v74 shape. `endedWeek` null is «someone is there»; a number is «it is
 *  over» – which wave 3 never writes and wave 4 will (T4's brief: write the unit now). */
function episode(sinceWeek: number, endedWeek: number | null): LoveEpisode {
  return { id: `p:${sinceWeek}`, sinceWeek, endedWeek, knownWeek: sinceWeek, wants: 'open', partnerId: `p:${sinceWeek}` }
}

/** Where the weekly return PARKS her: the same quiet week, accrued until nothing moves any more.
 *  ⚠ THE WEEK NEVER ADVANCES, on purpose – a fixed quiet week means `weekPerturbation` contributes
 *  exactly zero every time, so what this measures is the RETURN's target and nothing else. */
function hoversAt(world: WorldState, weeks = 40): number {
  for (let i = 0; i < weeks; i++) accrueSpirit(world)
  return world.spirit
}

/** Her spirit after each of `weeks` accruals on one quiet week – the SHAPE of the approach, which is
 *  what tells a moved target apart from a one-off bump. */
function walk(world: WorldState, weeks: number): number[] {
  const out: number[] = []
  for (let i = 0; i < weeks; i++) {
    accrueSpirit(world)
    out.push(world.spirit)
  }
  return out
}

// =================================================================================================
// A. THE EQUILIBRIUM – 75 WHILE SOMEONE IS THERE, 70 WHEN NOBODY IS
// =================================================================================================
describe('wave 3 T4 A – the effective baseline', () => {
  // ⚠⚠ THE NUMBERS BELOW ARE WRITTEN AS LITERALS AND THAT IS DELIBERATE, not laziness. Spelling them
  // `ECONOMY.spirit.baseline + ECONOMY.spirit.attachmentLift` would move the EXPECTATION with the
  // constant, and the first arm of this file is «set `attachmentLift` to 0»: a case whose expected
  // value follows the constant survives that mutation green and measures nothing. The literals are
  // tied back to the design in the last case of this section instead, which is where a retune is
  // supposed to be argued.

  it('⭐⭐ slot FULL – she parks at 75, from below, from above and from baseline', () => {
    for (const temperament of TEMPERAMENTS) {
      for (const from of [S.baseline, 40, 100]) {
        const world = probeWorld(temperament, from)
        world.loveEpisodes = [episode(world.week - 3, null)]
        expect(activeEpisode(world), 'the fixture really is an open row').not.toBeNull()
        expect(hoversAt(world), `${temperament} from ${from}`).toBe(75)
      }
    }
  })

  it('⭐⭐ slot EMPTY – she parks at 70, and the same three starts prove it is a TARGET', () => {
    // ⚠ THIS CASE IS HALF OF THE PREVIOUS ONE'S MEANING. «Full parks at 75» alone is satisfiable by a
    // baseline of 75 and no lift at all; the two cases together say the slot is what decides, and
    // the `from 100` arm in both says it is a target she walks DOWN to rather than a floor.
    for (const temperament of TEMPERAMENTS) {
      for (const from of [S.baseline, 40, 100]) {
        const world = probeWorld(temperament, from)
        expect(activeEpisode(world), 'a fresh career has nobody in it').toBeNull()
        expect(hoversAt(world), `${temperament} from ${from}`).toBe(70)
      }
    }
  })

  it('⭐ an ENDED row is nobody – the list is not the slot', () => {
    // The archive keeps every attachment for ever (`loveEpisodes` is append-only), so «has she ever»
    // and «is someone there now» must not be the same question. A career whose only row has ended
    // reads the flat baseline.
    for (const temperament of TEMPERAMENTS) {
      const world = probeWorld(temperament, S.baseline)
      world.loveEpisodes = [episode(world.week - 30, world.week - 10)]
      expect(loveEpisodesOf(world), 'and the row is still on the record').toHaveLength(1)
      expect(hoversAt(world), temperament).toBe(70)
    }
  })

  it('⚠ the two numbers ARE the design’s – 70 baseline, +5 lift, and 75 under the Glowing cut', () => {
    // who-she-is §4. This is where the literals above are anchored, and it is deliberately a separate
    // case: a retune argues HERE, and every equilibrium above goes red rather than quietly following.
    expect(S.baseline).toBe(70)
    expect(S.attachmentLift).toBe(5)
    expect(S.baseline + S.attachmentLift).toBe(75)
    // ...and the reason the lift is 5 and not more: a lifted girl is Bright, never permanently
    // Glowing. `tests/spirit.test.ts` pins the same relation from the ladder's side.
    expect(S.baseline + S.attachmentLift).toBeLessThan(S.mood.glowingFrom)
  })
})

// =================================================================================================
// B. THE SHAPE – IT ARRIVES OVER ~2 WEEKS AND LEAVES THE SAME WAY. NO BUMP, EVER.
// =================================================================================================
describe('wave 3 T4 B – a moved target, not a one-off bump', () => {
  it('⭐⭐ the lift ARRIVES through the standing return rule – 5/wk steady, 3/wk intense', () => {
    // ⚠ THIS IS THE CASE THAT TELLS THE TWO SHAPES APART. A `+5` added to `weekPerturbation` would
    // put her at 75 on the FIRST week for both intensities and then DECAY her back to 70; a moved
    // target walks her up at her own return rate and holds her there. The sequences below are the
    // second shape and only the second shape.
    const steady = probeWorld('sunny', S.baseline)
    steady.loveEpisodes = [episode(steady.week, null)]
    expect(walk(steady, 4), 'a steady girl closes the whole 5 in one step').toEqual([75, 75, 75, 75])

    const intense = probeWorld('deep', S.baseline)
    intense.loveEpisodes = [episode(intense.week, null)]
    expect(walk(intense, 4), 'an intense girl takes two weeks and then holds').toEqual([73, 75, 75, 75])
  })

  it('⭐⭐ the lift DISAPPEARS the week the slot empties, and walks back down the same way', () => {
    // ⚠ WRITTEN NOW AGAINST A HAND-BUILT ENDED ROW – WAVE 4 INHERITS IT. Nothing in wave 3 writes
    // `endedWeek`, so the only way to see the far side of the rule today is to pose it, and the
    // brief asks for exactly that: the step that adds the ending must change nothing here.
    const world = probeWorld('sunny', S.baseline)
    const since = world.week
    world.loveEpisodes = [episode(since, null)]
    expect(hoversAt(world), 'lifted first').toBe(75)
    // ...and now it is over. The SAME row, closed – not a removal, because the record is append-only.
    world.loveEpisodes = [episode(since, world.week)]
    expect(activeEpisode(world), 'nobody is there any more').toBeNull()
    expect(walk(world, 3), 'and she walks back down at her own rate').toEqual([70, 70, 70])

    const intense = probeWorld('deep', S.baseline)
    intense.loveEpisodes = [episode(intense.week, null)]
    expect(hoversAt(intense)).toBe(75)
    intense.loveEpisodes = [episode(intense.week, intense.week)]
    expect(walk(intense, 3), 'two steps down, mirroring the two up').toEqual([72, 70, 70])
  })

  it('⚠ no single week ever moves her by more than her own return step', () => {
    // The «no bump» claim as a sweep rather than a sequence: over a quiet stretch that begins empty,
    // fills, and empties again, the biggest week-on-week move is the return rate itself.
    for (const temperament of TEMPERAMENTS) {
      const step = S.returnPerWeek[temperamentIntensity(temperament)]
      const world = probeWorld(temperament, S.baseline)
      let prev = world.spirit
      let worst = 0
      for (let i = 0; i < 12; i++) {
        if (i === 3) world.loveEpisodes = [episode(world.week, null)]
        if (i === 8) world.loveEpisodes = [episode(world.week, world.week)]
        accrueSpirit(world)
        worst = Math.max(worst, Math.abs(world.spirit - prev))
        prev = world.spirit
      }
      expect(worst, `${temperament} never jumps`).toBeLessThanOrEqual(step)
      expect(prev, 'and she is home again').toBe(70)
    }
  })
})

// =================================================================================================
// C. ⭐ THE ORDER PIN – THE FIRST RETURN-STEP LANDS IN THE ARRIVAL'S OWN WEEK, NOT THE NEXT ONE
// =================================================================================================
//
// This is the unit T3 could not write, and the reason `rollArrival` sits IMMEDIATELY BEFORE
// `accrueSpirit` in `world/phaseHerWeek.ts`. It is a REAL career walked with `tickWeek` – the whole
// week, in order – because the claim is about two calls inside one tick and nothing smaller can
// carry it. `tests/spirit.test.ts` holds the structural half (the gap between the two calls is
// exactly `rollArrival(world)`); this is the behavioural half.
describe('wave 3 T4 C – the week someone appears is the week she is lifted', () => {
  const SEEDS = Array.from({ length: 40 }, (_, i) => `lift-order-${i}`)

  /** Walk real careers until someone appears, and stop at the first one whose arrival week is
   *  ISOLATED – she went in sitting exactly at baseline and no row of the perturbation table fires
   *  on the way out. ⚠ THE SEARCH IS FOR A CLEAN MEASUREMENT AND NEVER FOR AN EXPECTED VALUE: what
   *  the case then asserts is the engine's own arithmetic, and the ARM ledger is what proves the
   *  assertion can fail. */
  function firstIsolatedArrival(temperament: Temperament): { world: WorldState; week: number } {
    for (const seed of SEEDS) {
      const world = createWorld(seed)
      world.temperament = temperament
      const rng = resumeMain(world.rngMain)
      for (let i = 0; i < 260 && world.ending === null; i++) {
        const had = loveEpisodesOf(world).length
        const spiritBefore = world.spirit
        tickWeek(world, rng)
        if (loveEpisodesOf(world).length === had) continue
        // ⚠ THE PREDICATE MIRRORS `weekPerturbation`'s ROWS, one for one, rather than asking for a
        // tidy-looking world: `quiet` covers the calendar rows (blackout, exam, birthday), and the
        // three beside it cover the body's. ⚠ A KNOCK RECORD IS NOT A KNOCK ROW – the table charges
        // only a knock the parent PUSHED through, so `world.knock !== null` is the wrong question and
        // asking it found no isolated week at all on the first run of this file.
        const clean =
          spiritBefore === S.baseline &&
          world.injury === null &&
          world.knock?.choice !== 'push' &&
          vacationForWeek(world, world.week) === undefined &&
          quiet(world, world.week) &&
          !seasonWrapsWithNoVacation(world)
        if (clean) return { world, week: world.week }
        break
      }
    }
    throw new Error(`no isolated arrival found for ${temperament}`)
  }

  it('⭐⭐ a career that meets somebody in week W is already lifted at the END of week W', () => {
    for (const temperament of TEMPERAMENTS) {
      const step = S.returnPerWeek[temperamentIntensity(temperament)]
      const { world, week } = firstIsolatedArrival(temperament)
      // The arrival really happened, in this week, and it is the only one.
      expect(loveEpisodesOf(world).map((r) => r.sinceWeek), temperament).toEqual([week])
      expect(activeEpisode(world)).not.toBeNull()
      // ⚠⚠ AND HERE IS THE ORDER, AS A NUMBER. She entered the week at 70. Under the shipped order
      // (`rollArrival` then `accrueSpirit`) the return step of this same tick already walks toward
      // 75, so she leaves the week at 70 + her own rate. Under the reversed order the spirit pass
      // would have run against an empty slot and she would leave at exactly 70, with the first step
      // arriving a week late – for no reason a player could ever be told.
      expect(world.spirit, `${temperament} at W=${week}`).toBe(S.baseline + step)
      expect(world.spirit, 'and that is strictly above the flat baseline').toBeGreaterThan(S.baseline)
    }
  })

  it('⚠ and nothing lifted her before it – the weeks up to W−1 sit flat at baseline', () => {
    // The other end of the same claim, and the anti-vacuity control for the case above: the number it
    // measures has to be a CHANGE. A career walking toward its sixteenth birthday has nobody, and a
    // quiet week for such a girl reads exactly 70.
    const { world } = firstIsolatedArrival('sunny')
    const seed = world.seed
    const control = createWorld(seed)
    control.temperament = 'sunny'
    const rng = resumeMain(control.rngMain)
    let flat = 0
    while (loveEpisodesOf(control).length === 0) {
      tickWeek(control, rng)
      if (control.spirit === S.baseline) flat++
      if (control.week > 300) throw new Error('the control never met anybody')
    }
    expect(flat, 'most of the walk before the arrival is a flat baseline').toBeGreaterThan(50)
  })
})
