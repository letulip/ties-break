// =================================================================================================
// WAVE 4, T2 – THE ENDS HAZARD: THE WEEK IT IS OVER, AND NOTHING ELSE
// =================================================================================================
//
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T2 and `docs/plans/life-wave-4-rulings-2026-09.md`
// (rulings E and F), constants from `docs/specs/who-she-is-2026-09.md` §4's `end` column.
//
// ⚠⚠ WHAT THIS STEP IS, SAID ONCE, BECAUSE HALF THIS FILE IS ABOUT WHAT IT IS **NOT**. T2 writes
// `endedWeek` and nothing else. It does not raise the `'ended'` beat or its told-late branch (T4),
// writes no feed row and stamps no `lifeKind` (T5). The commit order IS the design: ship the hazard
// alone, let the derived readings fall out of it, and then anything that moves in a frozen career
// moved because somebody's romance ended and for no other reason. §D is that claim as a test rather
// than as a promise.
//
// ⚠⚠ ONE CLAUSE OF THAT PARAGRAPH WAS RE-AIMED BY T3 (12.09) AND THE OLD WORDING IS KEPT HERE so the
// re-aim reads as one: it said «It does not set `world.spiritShock` (T3)», and T3 is the step it was
// written to be re-read on. `rollEnds` now sets the MARK – one `{week, kind}` fact – alongside the
// date. §D's own case moved with it, from `toBeNull()` to the exact object, which is a STRONGER
// assertion than the one it replaces and not a relaxed one; every other negative in that case
// (`spirit`, `bond`, `lifeLog`, `events`, `lifeKind`) is untouched, because the POINTS the mark is
// worth are `accrueSpirit`'s and the beat and the row are still T4's and T5's.
//
// ⚠ IT ASSERTS NO PLAYER-FACING SENTENCE, because this step raises none (CLAUDE.md invariant 4): no
// beat, no feed row, no string. The strings are T6's, after the architect's read.
//
// ⚠ EXACT MEDIANS ARE NOT HERE EITHER. The census bars (romance counts, duration medians per
// temperament, the cooldown census) are T7's bench and its acceptance table; every corridor below is
// deliberately WIDE and exists to catch a wiring defect, not to measure the design.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was watched fail, and what it said is written here
// =================================================================================================
//
//   ⚠ SEVEN MUTATIONS, RUN 12.09.2026, CONTROL GREEN FIRST (22 passed) AND RE-EDITED BACK BY HAND
//   – never `git checkout`. The counts below are MEASURED, and three of them are not what this
//   ledger first predicted; where they differ the measurement stands and the prediction is named.
//
//   ARM 1  ⚠⚠ THE ZERO-DRAW SHORT-CIRCUIT (§0.1 of the wave-4 brief is THE LAW for this one). The
//          mutation: the roll hoisted above the gate in `rollEnds` – the uniform derived, then
//          `if (!endsEligible(world)) return`, i.e. draw-and-discard on a career with nobody in it.
//          **6 RED – the WHOLE of §B**, where four were predicted: «the gate returned before any key
//          existed: expected [ 'ends-zero-empty:life:ends:400' ] to deeply equal []», the ended-row
//          case, «52 weeks with nobody there, not one key: expected [ …(52) ] to deeply equal []»,
//          the untold case, AND BOTH POSITIVE CONTROLS – «one key on a hit, exactly as on a miss:
//          expected [ 'ends-zero-hit:life:ends:531', …(1) ] to deeply equal [ …:531 ]». The hoist
//          duplicates the key on an ELIGIBLE week too, which the prediction missed and which is the
//          section's shape working: a count net catches a spurious draw wherever it happens.
//          ⚠ AND THE ALIGNMENT COMPARISON THE BRIEF ORIGINALLY ASKED FOR WOULD HAVE STAYED GREEN
//          UNDER IT, which is why it is not in this file: every key carries its own week, so a
//          discarded draw shifts no other week's value. Wave 3 measured that twice
//          (tests/wave3-arrival.test.ts ARM 2b) and the brief made the count-keys shape law.
//
//   ARM 2  `endsHazardFor` reads `ECONOMY.life.temperamentMult` (the ARRIVAL column) instead of
//          `endsMult` – RULING E's own mistake, compiled.
//          ⚠⚠ **AND IT CAUGHT A DEFECT IN THIS FILE BEFORE IT CAUGHT ONE IN THE ENGINE, which is the
//          entry worth reading.** First run: **2 RED** – the literal table pin («sunny: the hazard is
//          base × the END multiplier: expected 0.0144 to be close to 0.0072») and the NESTING ladder
//          («sunny is rarer than deep: expected 53 to be less than 19»). The CORRIDOR STAYED GREEN on
//          all four arms, because its first draft built its prediction with `endsHazardFor(t)` – the
//          very function the mutation moved. Both sides moved together: the «equality comparing two
//          arms to each other» family, third instance in this layer. The corridor now reads
//          `LIFE.endsPerWeek * LIFE.endsMult[t]` off the table, and the arm was re-run: **3 RED**,
//          the corridor among them («sunny: 0.013983333333333334 against 0.0072: expected … to be
//          less than 0.00936»). Control re-run green (22 passed) between the two.
//          ⚠ Note what still does NOT go red: `fiery` alone, at ×1.6 against ×1.5, is inside any bar
//          this file could defensibly draw. The LITERAL TABLE PIN is what makes ruling E enforceable
//          on every row, and that is why it is not decoration.
//
//   ARM 3  `endEpisode` writes `knownWeek = null` beside the date – the «tidy up the row» defect the
//          function's own note names.
//          **1 RED** (two were predicted; both assertions live in one case) · §D «the row is the same
//          row with one more date on it: expected { id: 'p:300', sinceWeek: 300, …(4) } to deeply
//          equal { … }». ⚠ It is caught by the DEEP COPY taken before the call and by nothing else –
//          an expectation built from the live row would have moved with the mutation.
//
//   ARM 4  the call site REVERSED – `rollArrival(world)` moved above `rollEnds(world)` in
//          `world/phaseHerWeek.ts`.
//          **2 RED, one in each file** · §E «the tick runs the ends hazard BEFORE the arrival:
//          expected [ 'rollArrival(world)', …(1) ] to deeply equal [ 'rollEnds(world)', …(1) ]» and
//          tests/spirit.test.ts's ordered-list pin, re-aimed there («only the private life's four
//          weekly calls separate them»).
//          ⚠ §E READS THE SPAN OUT OF THE SOURCE AND RUNS THE TWO ROLLS IN THE ORDER IT FINDS THEM,
//          so the walk under it measures the consequence of the real call site rather than of this
//          file's own typing. That is deliberate: a walk that hard-coded the order would have proved
//          a property of the test.
//
//   ARM 5  `rollEnds` compares `>` instead of `>=` (a hazard of 0 becoming reachable).
//          **0 RED**, and it is recorded as a null arm rather than quietly dropped – an arm that goes
//          red in no case is a fact about the net, not a proof. No row in `endsMult` is zero, so the
//          two comparisons can differ only on an exact 0.0 uniform, which no key in these sweeps
//          produces. The `>=` is kept for `rollArrival`'s stated reason – a hazard of 0 must be
//          impossible rather than merely unlikely – and the honest statement is that nothing in this
//          file holds it to that today, because nothing in this file can.
//
//   ARM 6  `endEpisode` PRUNES the row instead of dating it (`world.loveEpisodes.pop()`).
//          **10 RED** where three were predicted – every case that reads the row back, including all
//          of §C and §E · §D «the whole life is still on the record: expected [ { id: 'p:200', …(5) }
//          ] to have a length of 2 but got 1», «the row is the same row with one more date on it:
//          expected undefined to deeply equal { … }», and «Cannot read properties of undefined
//          (reading 'endedWeek')» from the sweeps.
//
//   ARM 7  `endsEligible` reads `knownPartner(world, world.week)` instead of `activeEpisode` – «it
//          can only end if he knows», the reading ruling A's told-late scene dies on.
//          **3 RED** · §A «a romance the parent has NOT been told about is exactly as endable:
//          expected false to be true», §B's told-late key count («expected [] to deeply equal
//          [ 'ends-zero-untold:life:ends:600' ]») and §C's keying case («week 409: expected null to
//          be 409»).
//
// ⚠⚠ AND A WORD ON WHY THE LEDGER IS RUN AND NOT REASONED, kept from wave 3's own headers: an
// assertion can be vacuous and still look green. Three structural habits below exist for that reason
// – every «never happens» sweep is PAIRED with a positive control in the same case; §B holds the keys
// the code reached in an array the code under test cannot see; and §D's «nothing else moved»
// assertions hold a DEEP COPY taken before the call, which is the one shape a mutation of the thing
// under test cannot reach.
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's §B apparatus, verbatim and for its reason. Every
// call is delegated to the real `rngFromSeed`, so the numbers this file measures are the engine's
// own; the mock exists only so §B can COUNT the keys the gate reached. Hoisted, because `vi.mock`'s
// factory is lifted above the imports.
const rngKeys = vi.hoisted(() => [] as string[])
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      rngKeys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  activeEpisode,
  arrivalEligible,
  createWorld,
  endEpisode,
  endsEligible,
  endsHazardFor,
  kidAgeExact,
  lifeLogOf,
  loveEpisodesOf,
  rollArrival,
  rollEnds,
  TEMPERAMENTS,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import type { Temperament } from '../src/engine/spirit'
import type { LoveEpisode } from '../src/shared/protocol'
import { worldFunction } from './worldSource'

const LIFE = ECONOMY.life
/** `src/`, for §F's whole-tree reader. ⚠ `import.meta.url` is legal here – this file runs in the UNIT
 *  project (node), never under happy-dom, where the URL scheme would throw at collect time. */
const SRC_ROOT = fileURLToPath(new URL('../src/', import.meta.url))

// ⚠ THE RECORDER IS EMPTIED BEFORE EVERY CASE, not only before §B's. The sweeps below take a quarter
// of a million draws between them and the array would otherwise hold every key of every case that ran
// before – tens of megabytes of strings kept alive for nothing. §B resets again inside its own
// `beforeEach`, deliberately: the reset is part of what that section is saying and it should be
// readable there rather than inferred from here.
beforeEach(() => {
  rngKeys.length = 0
})

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

/** The FIRST week she reads at or above `years` – found by walking the same clock the engine reads,
 *  never by arithmetic of our own, so a walk that needs her to be an adult starts where the engine
 *  says she is one (`tests/wave3-arrival.test.ts`'s own helper). */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

/** A row of the v74 shape. `endedWeek: null` is «still going». */
function episode(sinceWeek: number, knownWeek: number | null = null, endedWeek: number | null = null): LoveEpisode {
  return { id: `p:${sinceWeek}`, sinceWeek, endedWeek, knownWeek, wants: 'open', partnerId: `p:${sinceWeek}` }
}

/** A career, parked at `week`, with whatever love life the case needs. ⚠ A REAL `createWorld` rather
 *  than a cast: the profile, the seed and the temperament are then the engine's own, which is what
 *  makes the numbers below the engine's numbers. */
function careerAt(seed: string, week: number, temperament?: Temperament, ...rows: LoveEpisode[]): WorldState {
  const world = createWorld(seed)
  world.week = week
  if (temperament !== undefined) world.temperament = temperament
  world.loveEpisodes = rows
  return world
}

/** One roll on a career reset to «somebody arrived long ago and is still here», so a sweep measures
 *  the HAZARD rather than the slot emptying after the first ending. Returns the week it ended on, or
 *  null. */
function rollFresh(world: WorldState, week: number): number | null {
  world.week = week
  world.loveEpisodes = [episode(1, 1)]
  rollEnds(world)
  return world.loveEpisodes[0].endedWeek
}

const SWEEP_SEEDS = Array.from({ length: 40 }, (_, i) => `ends-sweep-${i}`)

// =================================================================================================
// A. THE GATE – ONE CLAUSE, AND IT IS «IS SOMEBODY THERE», NEVER «DOES HE KNOW»
// =================================================================================================
describe('wave 4 T2 A – eligibility', () => {
  it('⭐ nobody there, nothing to end – and the same world with an open row IS eligible', () => {
    // The positive control sits in the same case on purpose: «false» means the clause refused, not
    // that the function is broken in a way that could never return true.
    const world = careerAt('ends-gate-empty', 400)
    expect(loveEpisodesOf(world), 'the fixture really is an empty life').toEqual([])
    expect(endsEligible(world)).toBe(false)
    world.loveEpisodes = [episode(300, 302)]
    expect(endsEligible(world), 'and now there is somebody').toBe(true)
  })

  it('⭐ a row that has ALREADY ENDED is not endable again, and the row is still on the record', () => {
    const world = careerAt('ends-gate-over', 400, undefined, episode(300, 302, 340))
    expect(endsEligible(world)).toBe(false)
    expect(loveEpisodesOf(world), 'an ended row is still on the record').toHaveLength(1)
    // ...and the tail is what decides, exactly as `activeEpisode` rules it: an ended row followed by
    // an open one is endable again.
    world.loveEpisodes = [episode(300, 302, 340), episode(380, 381)]
    expect(endsEligible(world), 'the NEXT attachment is endable').toBe(true)
  })

  it('⚠⚠ a romance the parent has NOT been told about is exactly as endable as one he has', () => {
    // ⚠⚠ THE PREMISE OF THE WHOLE TOLD-LATE SCENE (ruling A), and the one reading of this gate that
    // would quietly destroy it: `knownPartner` instead of `activeEpisode`. Eligibility counts from
    // `sinceWeek` and never from `knownWeek` – a romance can begin AND end before the parent ever
    // hears of it, and that late row is what wave 4's strongest scene is made of.
    const untold = careerAt('ends-gate-untold', 400, undefined, episode(300, null))
    const told = careerAt('ends-gate-told', 400, undefined, episode(300, 302))
    expect(untold.loveEpisodes![0].knownWeek, 'the fixture really is untold').toBeNull()
    expect(endsEligible(untold)).toBe(true)
    expect(endsEligible(told), 'and the told one, which is the control').toBe(true)
  })

  it('⚠ there is NO age gate on the ending, and there must not be one', () => {
    // `arrivalEligible` has one because sixteen is when somebody may first APPEAR. By the time a row
    // exists she has already passed it, so a second reading of the same ruling here would be dead
    // code that looked like a rule – and would refuse to end an attachment the engine itself wrote.
    const child = careerAt('ends-gate-age', 10, undefined, episode(5, 5))
    expect(kidAgeExact(child.week, child.profile.birthMonth, child.profile.birthDay))
      .toBeLessThan(LIFE.ageGate)
    expect(endsEligible(child), 'the gate asks one question and it is not her age').toBe(true)
  })
})

// =================================================================================================
// B. ⚠⚠ ZERO DRAWS WHILE INELIGIBLE – THE LOAD-BEARING RULE, IN THE SHAPE §0.1 MAKES LAW
// =================================================================================================
//
// ⚠⚠ THE SHAPE IS NOT A PREFERENCE. The wave-4 brief's §0.1 makes wave 3's third-instance finding the
// law for every zero-draw claim: «a stream-alignment test on per-week keys holds by construction and
// proves nothing – prove eligibility short-circuits with a key COUNTER the code cannot see, plus a
// positive control». Every key here carries its own week, so a discarded draw shifts no other week's
// value and a two-worlds comparison stays GREEN under the very draw-and-discard mutation it would be
// written to catch (measured in tests/wave3-arrival.test.ts, ARM 2b). `rngKeys` above is the counter,
// it lives in an array `rollEnds` cannot see, and the last two cases are the positive control that
// makes «no keys» mean the gate returned rather than the recorder being broken.
describe('wave 4 T2 B – an ineligible week takes ZERO draws', () => {
  beforeEach(() => {
    rngKeys.length = 0
  })

  /** The life-layer keys reached since the last reset. ⚠ Filtered, because `createWorld` legitimately
   *  derives `:temperament` and a dozen others – this section is a claim about THIS wave's stream. */
  function lifeKeys(): string[] {
    return rngKeys.filter((k) => k.includes(':life:'))
  }

  it('⭐⭐ a career nobody has arrived in derives no stream at all – not one, not discarded', () => {
    const world = careerAt('ends-zero-empty', 400)
    rngKeys.length = 0
    rollEnds(world)
    expect(lifeKeys(), 'the gate returned before any key existed').toEqual([])
  })

  it('⭐⭐ a career whose attachment is already OVER derives no stream at all', () => {
    const world = careerAt('ends-zero-over', 500, undefined, episode(300, 302, 340))
    rngKeys.length = 0
    rollEnds(world)
    expect(lifeKeys(), 'the gate returned before any key existed').toEqual([])
  })

  it('⭐⭐ ...and neither does over a WHOLE SEASON of weeks', () => {
    // The single-week cases above could pass on a gate that refuses one particular week. This is the
    // same claim over 52 of them, on a career that has lived one romance and is past it.
    const world = careerAt('ends-zero-season', 0, undefined, episode(300, 302, 340))
    rngKeys.length = 0
    for (let w = 500; w < 552; w++) {
      world.week = w
      rollEnds(world)
    }
    expect(lifeKeys(), '52 weeks with nobody there, not one key').toEqual([])
  })

  it('⭐ an ELIGIBLE week that MISSES takes exactly one draw, on the ends key and nothing else', () => {
    // ⚠⚠ THE POSITIVE CONTROL for the three cases above: the same call on an occupied career DOES
    // reach a stream, so «no keys» up there is a property of the gate and not of the recorder.
    const world = careerAt('ends-zero-eligible', 0, 'quiet')
    const week = firstMiss(world)
    rngKeys.length = 0
    rollFresh(world, week)
    expect(lifeKeys()).toEqual([`${world.seed}:life:ends:${week}`])
    expect(activeEpisode(world), 'and it really was a miss – she is still attached').not.toBeNull()
  })

  it('⭐⭐ an ENDING takes exactly one draw too – the date is WRITTEN, never drawn', () => {
    const world = careerAt('ends-zero-hit', 0, 'fiery')
    const week = firstHit(world)
    rngKeys.length = 0
    rollFresh(world, week)
    expect(lifeKeys(), 'one key on a hit, exactly as on a miss').toEqual([`${world.seed}:life:ends:${week}`])
    expect(activeEpisode(world), 'and it really was a hit').toBeNull()
    // ⚠ AND T4's SIBLING DOES NOT EXIST ON THIS TREE. `seed:life:ends:<week>:react` is the
    // space-vs-company read (ruling G) and belongs to the NEXT commit; the split-key law is what
    // makes it a second key rather than a second read of this one, and T2 may not create it early.
    expect(lifeKeys().some((k) => k.includes(':react')), 'T4 has not started early').toBe(false)
  })

  it('⭐⭐ an UNTOLD attachment draws exactly as a told one does – the told-late scene needs it to', () => {
    // The mirror of §A's untold case, as a key count: the gate does not merely RETURN true on an
    // untold row, it goes on to derive the stream and roll. A `knownPartner` gate would read as «zero
    // draws» here, which is indistinguishable from the short-circuit above without this case.
    const world = careerAt('ends-zero-untold', 600, undefined, episode(300, null))
    rngKeys.length = 0
    rollEnds(world)
    expect(lifeKeys()).toEqual([`${world.seed}:life:ends:600`])
  })
})

/** The first week this career MISSES on – a positive control found by asking, never assumed. */
function firstMiss(world: WorldState): number {
  for (let w = 400; w < 800; w++) if (rollFresh(world, w) === null) return w
  throw new Error('no miss found')
}

/** ...and the first it HITS on. */
function firstHit(world: WorldState): number {
  for (let w = 400; w < 3000; w++) if (rollFresh(world, w) !== null) return w
  throw new Error('no hit found')
}

// =================================================================================================
// C. THE HAZARD – the corridor, the table, the nesting, and determinism
// =================================================================================================
describe('wave 4 T2 C – the weekly hazard', () => {
  /** How many of `count` weeks this career ends on, with the attachment restored between every roll. */
  function hits(temperament: Temperament, count: number): number {
    let n = 0
    for (const seed of SWEEP_SEEDS) {
      const world = careerAt(seed, 0, temperament)
      for (let w = 400; w < 400 + count; w++) if (rollFresh(world, w) !== null) n++
    }
    return n
  }

  const WEEKS = 1500
  const SAMPLES = SWEEP_SEEDS.length * WEEKS

  it('⭐⭐ the table is who-she-is §4\'s **END** column, and never the arrival one – RULING E', () => {
    // ⚠⚠ THE LOAD-BEARING PIN OF THIS SECTION, AND IT IS LITERAL ON PURPOSE. The two columns are
    // different numbers in the same spec table, and a `temperamentMult` read here would leave both
    // values looking plausible: a fiery girl at ×1.6 instead of ×1.5 is inside any corridor this file
    // could defensibly draw, and only `deep` (×0.5 against ×0.9) is far enough out to be caught by a
    // sampled bar. Measured in that direction rather than assumed – ARM 2 in the ledger.
    expect(LIFE.endsMult, 'the END column, verbatim').toEqual({ sunny: 0.6, fiery: 1.5, quiet: 0.35, deep: 0.9 })
    expect(LIFE.endsPerWeek, 'and the base rate, §4: «end 1.2%/wk»').toBe(0.012)
    // ...and the two columns really are different tables, so the pin above is not restating the one
    // below it. This is the whole of ruling E in one line.
    expect(LIFE.temperamentMult, 'the ARRIVAL column, untouched by this wave').toEqual({ sunny: 1.2, fiery: 1.6, quiet: 0.6, deep: 0.5 })
    expect(LIFE.endsMult).not.toEqual(LIFE.temperamentMult)
    for (const temperament of TEMPERAMENTS) {
      expect(endsHazardFor(temperament), `${temperament}: the hazard is base × the END multiplier`)
        .toBeCloseTo(0.012 * LIFE.endsMult[temperament], 10)
    }
    // ⚠ AND NO AGE TERM. §4's end column is ONE rate for the whole life, unlike the arrival's two –
    // a second row here would be a design decision wearing a constant. The signature is where that is
    // enforced: `endsHazardFor` takes a temperament and nothing else.
    expect(endsHazardFor.length, 'one parameter – there is no age step to pass it').toBe(1)
  })

  it('⭐ the measured rate lands in a WIDE corridor around the table, per temperament', () => {
    // ⚠ WIDE AND NON-FLAKY BY DESIGN. 60,000 (seed, week) samples per arm and the corridor is ±30% of
    // the predicted rate; every seed is a fixed string, so this is deterministic rather than sampled
    // afresh each run. The duration medians are T7's bench and its acceptance table, never this
    // file's.
    //
    // ⚠⚠ THE PREDICTION IS BUILT FROM THE **TABLE** AND NEVER FROM `endsHazardFor`, AND THAT IS THE
    // WHOLE OF WHETHER THIS CASE CAN FAIL – found by running ARM 2 rather than by reading it. The
    // first draft wrote `const predicted = endsHazardFor(temperament)`, which is the same function
    // `rollEnds` rolls against: under a wrong multiplier BOTH SIDES MOVE TOGETHER and the corridor
    // stays green on all four arms. Measured: with `temperamentMult` compiled in, the first draft of
    // this case PASSED. It is the «equality comparing two arms to each other» family, and this is its
    // third recorded instance in the layer.
    for (const temperament of TEMPERAMENTS) {
      const predicted = LIFE.endsPerWeek * LIFE.endsMult[temperament]
      const measured = hits(temperament, WEEKS) / SAMPLES
      expect(measured, `${temperament}: ${measured} against ${predicted}`).toBeGreaterThan(predicted * 0.7)
      expect(measured, `${temperament}: ${measured} against ${predicted}`).toBeLessThan(predicted * 1.3)
    }
  })

  it('⭐⭐ the four temperaments NEST exactly, because the multiplier is all that separates them', () => {
    // ⚠ A STRONGER STATEMENT THAN A CORRIDOR AND NOT A FLAKY ONE – wave 3's arrival pin, in this
    // wave's own table. The ends key carries no temperament, so all four arms compare the SAME
    // uniform against different hazards: the weeks a quiet girl's romance ends on must be a strict
    // subset of a sunny girl's, and so on up the table. It goes red the moment the multiplier stops
    // being a pure scale on one shared draw.
    const weeksFor = (temperament: Temperament): Set<number> => {
      const world = careerAt('ends-nesting', 0, temperament)
      const out = new Set<number>()
      for (let w = 400; w < 3400; w++) if (rollFresh(world, w) !== null) out.add(w)
      return out
    }
    const ladder: Temperament[] = ['quiet', 'sunny', 'deep', 'fiery']
    expect(ladder.map((t) => LIFE.endsMult[t]), 'the ladder really is ascending').toEqual([0.35, 0.6, 0.9, 1.5])
    // ⚠ AND IT IS A DIFFERENT LADDER FROM THE ARRIVAL'S, which is the design speaking rather than a
    // coincidence of two tables: openness owns the meeting, intensity owns the breaking, so `deep`
    // sits third here and last there. A reader who assumed one order for both would have written this
    // list wrong and the subset walk below would have told them so.
    expect(ladder.map((t) => LIFE.temperamentMult[t]), 'the ARRIVAL column read in THIS order is not ascending at all')
      .toEqual([0.6, 1.2, 0.5, 1.6])
    const sets = ladder.map(weeksFor)
    for (let i = 0; i + 1 < sets.length; i++) {
      expect(sets[i].size, `${ladder[i]} ended at all`).toBeGreaterThan(0)
      expect(sets[i].size, `${ladder[i]} is rarer than ${ladder[i + 1]}`).toBeLessThan(sets[i + 1].size)
      for (const w of sets[i]) expect(sets[i + 1].has(w), `${ladder[i]} ended in ${w}, ${ladder[i + 1]} did not`).toBe(true)
    }
  })

  it('⭐ DETERMINISM – same seed, same week, same verdict', () => {
    const a = careerAt('ends-determinism', 0, 'sunny')
    const b = careerAt('ends-determinism', 0, 'sunny')
    const rowsA: (number | null)[] = []
    const rowsB: (number | null)[] = []
    for (let w = 400; w < 1200; w++) {
      rowsA.push(rollFresh(a, w))
      rowsB.push(rollFresh(b, w))
    }
    expect(rowsA.filter((r) => r !== null).length, 'the run had verdicts of both kinds').toBeGreaterThan(2)
    expect(rowsA.filter((r) => r === null).length).toBeGreaterThan(2)
    expect(rowsB).toEqual(rowsA)
  })

  it('⚠ the verdict is keyed on (seed, week) and on nothing about the attachment it ends', () => {
    // The key carries the WEEK and no part of the row, so the same girl ends in the same weeks
    // whether the romance started last month or two years ago, and whether or not her parent was ever
    // told. That is what makes the hazard a property of the calendar – and it is what stops a player
    // moving a break-up by playing the weeks before it differently.
    const world = careerAt('ends-keying', 0, 'deep')
    for (let w = 400; w < 900; w++) {
      world.week = w
      world.loveEpisodes = [episode(1, 1)]
      rollEnds(world)
      const young = world.loveEpisodes[0].endedWeek
      world.loveEpisodes = [episode(w - 1, null)]
      rollEnds(world)
      expect(world.loveEpisodes[0].endedWeek, `week ${w}`).toBe(young)
    }
  })
})

// =================================================================================================
// D. ⚠⚠ `endEpisode` – ONE DATE, THE ROW STAYS, AND **NOTHING ELSE IN THE WORLD MOVES**
// =================================================================================================
describe('wave 4 T2 D – what an ending is, and what it is not', () => {
  it('⭐⭐ it writes `endedWeek` and leaves every other field of the row exactly as it was', () => {
    // ⚠ THE EXPECTED VALUE IS A DEEP COPY TAKEN BEFORE THE CALL – wave 3's ARM-4 lesson, verbatim:
    // an assertion about PRESERVATION must hold something the code under test cannot reach, or both
    // sides of the comparison move together and the net is green under the mutation it was written
    // for. `before` below is frozen JSON, not the live row.
    const world = careerAt('ends-writes', 420, undefined, episode(300, 402))
    const before = JSON.parse(JSON.stringify(world.loveEpisodes[0])) as LoveEpisode
    endEpisode(world, 420)
    expect(world.loveEpisodes[0], 'the row is the same row with one more date on it')
      .toEqual({ ...before, endedWeek: 420 })
    expect(world.loveEpisodes[0].knownWeek, 'what he was told is a fact about the past and an ending does not un-tell it').toBe(402)
    expect(Object.keys(world.loveEpisodes[0]).sort(), 'and no field was invented')
      .toEqual(['endedWeek', 'id', 'knownWeek', 'partnerId', 'sinceWeek', 'wants'])
  })

  it('⭐⭐ the row STAYS – nothing is nulled, nothing is pruned, and the ACTIVE SLOT empties by itself', () => {
    const world = careerAt('ends-keeps', 420, undefined, episode(200, 201, 260), episode(300, 302))
    expect(activeEpisode(world)?.id, 'the fixture really has somebody in it').toBe('p:300')
    endEpisode(world, 420)
    expect(loveEpisodesOf(world), 'the whole life is still on the record').toHaveLength(2)
    expect(loveEpisodesOf(world)[0], 'and the OLDER attachment was not touched either').toEqual(episode(200, 201, 260))
    // ⚠ THE SLOT EMPTIES THROUGH THE DERIVATION AND THROUGH NOTHING ELSE: there is no `world.partner`
    // to clear, and `activeEpisode` is the one reading of «is somebody there now».
    expect(activeEpisode(world), 'she is single again, derived from the date and nothing else').toBeNull()
  })

  it('⚠ nothing to end is a quiet no-op, on a probe world and on an empty life alike', () => {
    const empty = careerAt('ends-noop', 420)
    endEpisode(empty, 420)
    expect(loveEpisodesOf(empty)).toEqual([])
    // Not a save – a hand-built object of the kind tests have always poked at the engine with. It has
    // no business crashing a write any more than it has crashing a read.
    const probe = {} as unknown as WorldState
    expect(() => endEpisode(probe, 420)).not.toThrow()
  })

  it('⚠⚠ THE HAZARD WRITES THE DATE AND THE MARK AND **NOTHING ELSE** – no beat, no feed row, no spirit, no bond', () => {
    // ⚠⚠ THE CLAIM THE WHOLE COMMIT ORDER RESTS ON, and every arm of it is a NEGATIVE – so each one
    // names a target that provably exists on this tree before asserting it did not move.
    // `lifeLog`/`events` are wave 2 and 3 machinery with live writers one section over, `spirit` and
    // `bond` are written every week by `accrueSpirit`. None of them is this function's to touch, and a
    // value appearing in any of them is the defect this case exists for.
    //
    // ⚠⚠ RE-AIMED 12.09 BY T3, AND NOT WEAKENED. WHAT MOVED: `world.spiritShock`. It was a NEGATIVE
    // here («the shock is T3's – not one point of it lands here», `toBeNull()`) and T3 is that step;
    // the assertion is now the exact `{week, kind}` object the hazard must write, which refuses three
    // failures the null could not even see – a mark written on the WRONG week, a mark carrying a kind
    // nobody ruled, and a mark not written at all. WHY IT BELONGS IN `rollEnds` RATHER THAN IN
    // `accrueSpirit`: this is the function that knows WHICH WEEK an attachment ended, and the split
    // ruled by the T3 brief is «`rollEnds` sets it, `accrueSpirit` applies it» so that the one writer
    // of `world.spirit` stays one writer.
    //
    // ⚠ AND THE OTHER FIVE NEGATIVES ARE UNTOUCHED, which is what makes this a re-aim. The POINTS the
    // mark is worth land four calls later; the `'ended'` beat is still T4's and the feed row still
    // T5's; and bond is parent-decision-only in every wave.
    const world = careerAt('ends-writes-nothing', 420, 'fiery', episode(300, 302))
    world.spirit = 75
    world.bond = 64
    expect('spiritShock' in world, 'the v75 seat exists on this tree – the negative has a target').toBe(true)
    expect(world.spiritShock, 'and it is empty before').toBeNull()
    const eventsBefore = JSON.parse(JSON.stringify(world.events))
    const before = { spirit: world.spirit, bond: world.bond, lifeLog: [...lifeLogOf(world)] }

    // ⚠⚠ THE WEEK IS FOUND BY WALKING THE HAZARD, NEVER PLACED BY HAND – the case used to call
    // `endEpisode` unconditionally so that it could not pass on a miss, and that was right while the
    // claim was a row of nulls. Now that `rollEnds` writes a mark, the mark has to be the FUNCTION's
    // and not the test's, so the roll is walked until its own dice fire and the assertions below read
    // what the engine put there. The `not.toBeNull()` is what refuses a silent pass on a career that
    // never ended.
    let ended: number | null = null
    for (let w = 420; w < 820 && ended === null; w++) {
      world.week = w
      rollEnds(world)
      ended = world.loveEpisodes[0].endedWeek
    }
    expect(ended, 'her romance really ended inside the search window').not.toBeNull()

    expect(world.spiritShock, '⭐ the MARK is this function\'s – the ending week and the ruled kind')
      .toEqual({ week: ended, kind: 'breakup' })
    expect(world.spirit, '⚠ but the POINTS are accrueSpirit\'s – this function writes no spirit at all').toBe(before.spirit)
    expect(world.bond, '⚠ bond is parent-decision-only (§4a.2) and an ending is not a decision').toBe(before.bond)
    // ⚠⚠ RE-AIMED 12.09 BY T4, AND THE CLAIM NARROWED TO THE ONE IT ALWAYS MEANT. It read «the
    // `'ended'` beat is T4's – nothing is raised», and T4 is the step it was written to be re-read on:
    // `rollEnds` now DOES raise the told-now card, and only ever behind the `'met'` receipt (ruling
    // B's split). This fixture has no receipt – its episode was never delivered – so the row stays
    // empty here, and the assertion would now pass for a reason it was not written for. That is a pin
    // going quietly vacuous, so it is made explicit instead: the precondition is asserted, and the
    // NEGATIVE is then the honest one – «an ending the parent never heard of raises nothing».
    // ⚠ THE POSITIVE HALF OF THE SAME LAW – «and behind a receipt it raises exactly one» – lives in
    // tests/wave4-ended-beat.test.ts §A, which is T4's own file. Measured: with the receipt condition
    // replaced by the brief's literal `knownWeek <= week`, this case goes RED here (T4's ARM 1).
    expect(lifeLogOf(world).some((r) => r.kind === 'met'), 'the fixture holds NO receipt – the negative below is about that')
      .toBe(false)
    expect(lifeLogOf(world), '⚠ an ending he was never told about raises nothing at all').toEqual(before.lifeLog)
    // ⭐⭐ RE-AIMED 12.09 BY T5, NOT WEAKENED, AND THE OLD MESSAGES ARE KEPT IN THIS NOTE SO THE RE-AIM
    // READS AS ONE HISTORY. They said «the feed row and its `lifeKind` stamp are T5's» and «no row on
    // this tree wears a kind», and T5 is the step they were written to be re-read on: both the kept
    // ending row and the two stamps exist now. WHAT DID NOT MOVE IS THIS FIXTURE'S ANSWER, and that is
    // why the assertions stand unchanged rather than being re-pointed: the row and the card share ONE
    // condition – the `'met'` receipt – and this career has none, so an ending the parent was never
    // told about still writes nothing at all. ⚠ The claim is now about THIS WORLD rather than about
    // the tree, which is the only thing the messages needed to stop saying.
    expect(world.events, '⚠ an ending he was never told about writes no feed row either').toEqual(eventsBefore)
    expect(world.events.some((e) => e.lifeKind !== undefined), 'and no row in THIS career wears a kind').toBe(false)
  })
})

// =================================================================================================
// E. ⚠⚠ THE ORDER, AND THE TWO RULINGS THAT ARE CONSEQUENCES OF IT (F, and the cooldown going live)
// =================================================================================================
//
// ⚠⚠ THIS SECTION READS THE CALL ORDER OUT OF THE SOURCE AND RUNS THE ROLLS IN THE ORDER IT FINDS,
// which is the difference between measuring the engine and measuring this file's own typing. A walk
// that hard-coded `rollEnds` then `rollArrival` would prove ruling F about the test rather than about
// the tick, and would stay green with the call site reversed. The ORDERED-LIST pin over the same span
// lives in tests/spirit.test.ts and is the guard against a fifth statement sliding in; this is its
// behavioural half.
const LIFE_ROLLS: Record<string, (world: WorldState) => void> = {
  'rollEnds(world)': rollEnds,
  'rollArrival(world)': rollArrival,
}

/** The private life's two HAZARD calls, in the order `resolveBodyAndPlanner` declares them. ⚠ Read
 *  through `worldFunction` (tests/worldSource.ts), which reads the whole decomposed world module set
 *  – so this survives the phase moving files and throws rather than widening if the anchors rot. */
function weeklyRollsInSourceOrder(): ((world: WorldState) => void)[] {
  const code = worldFunction('resolveBodyAndPlanner')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'))
  const i = code.indexOf('accrueCondition(world, playedThisWeek)')
  const j = code.indexOf('accrueSpirit(world)')
  expect(i, 'the accrueCondition call moved').toBeGreaterThan(-1)
  expect(j, 'the accrueSpirit call moved').toBeGreaterThan(i)
  const span = code.slice(i + 1, j).filter((l) => l in LIFE_ROLLS)
  expect(span, 'the tick runs the ends hazard BEFORE the arrival').toEqual([
    'rollEnds(world)',
    'rollArrival(world)',
  ])
  return span.map((l) => LIFE_ROLLS[l])
}

describe('wave 4 T2 E – the order is the mechanism', () => {
  it('⭐⭐⭐ RULING F – an attachment can never end in its own arrival week, and ONE week is reachable', () => {
    // ⚠⚠ TWO CLAIMS, AND THE SECOND IS WHAT STOPS THE FIRST BEING VACUOUS. «`endedWeek` is never
    // `sinceWeek`» would be satisfied by an engine that simply never ended anything quickly; the
    // measured MINIMUM gap being exactly 1 says the bound is TIGHT – the hazard really can fire on the
    // week right after an arrival, and the only week it cannot fire on is the arrival's own.
    //
    // ⚠ THE WALK RUNS THE TWO ROLLS IN THE ORDER READ OFF THE SOURCE (above), so reversing the call
    // site reverses this loop and the claim goes red. That is ARM 4.
    const rolls = weeklyRollsInSourceOrder()
    let ended = 0
    let arrived = 0
    let shortest = Number.POSITIVE_INFINITY
    for (const seed of SWEEP_SEEDS) {
      for (const temperament of TEMPERAMENTS) {
        const world = createWorld(`${seed}-${temperament}`)
        world.temperament = temperament
        world.loveEpisodes = []
        // ⚠ FROM HER EIGHTEENTH AND NOT FROM A NUMBER TYPED HERE: the arrival gate is `kidAgeExact`'s
        // and the adult rate is 2.5× the minor one, so a walk that started at a hard-coded week would
        // be measuring whichever side of the step the calendar happened to put it on.
        const start = weekAtAge(world, LIFE.adultFrom)
        for (let w = start; w < start + 400; w++) {
          world.week = w
          for (const roll of rolls) roll(world)
        }
        for (const row of loveEpisodesOf(world)) {
          arrived++
          if (row.endedWeek === null) continue
          ended++
          expect(row.endedWeek, `${seed}/${temperament} ${row.id}: an ending cannot precede its own beginning`)
            .toBeGreaterThan(row.sinceWeek)
          shortest = Math.min(shortest, row.endedWeek - row.sinceWeek)
        }
      }
    }
    expect(arrived, 'the sweep saw arrivals at all').toBeGreaterThan(60)
    expect(ended, 'the sweep saw endings at all').toBeGreaterThan(20)
    expect(shortest, 'the shortest attachment the engine can produce is exactly one week').toBe(1)
  })

  it('⭐⭐⭐ THE COOLDOWN GOES LIVE – an ending frees the slot and the SAME TICK refuses to refill it', () => {
    // ⚠⚠ `arrivalEligible`'s clause 3 has been unreachable since wave 3 shipped it («nothing writes
    // `endedWeek`, so no career can ever be inside a cooldown»). This is the case that says it bites.
    // It is built from a REAL ending – the hazard rolled until it fired – rather than from a row
    // placed by hand, which is what wave 3's own cooldown case had to do and what makes this one new.
    for (const temperament of TEMPERAMENTS) {
      const wait = LIFE.cooldownWeeks[temperament]
      const world = careerAt(`ends-cooldown-${temperament}`, 0, temperament)
      const week = firstHit(world) // leaves `world` holding the ended row, on the week it ended
      expect(world.loveEpisodes[0].endedWeek, `${temperament}: the ending is real`).toBe(week)
      expect(activeEpisode(world), '...and the slot is genuinely free').toBeNull()
      // ⚠ THE SAME TICK: the slot is empty and the clock already reads zero, so clause 3 turns it
      // down. Nobody arrives on the afternoon somebody left – and that is by CONSTRUCTION rather than
      // by a rule anybody wrote, because `rollEnds` runs before `rollArrival`.
      expect(arrivalEligible(world), `${temperament}: no re-arrival on the week of the break-up`).toBe(false)
      world.week = week + wait - 1
      expect(arrivalEligible(world), `${temperament}: one week short of ${wait} still refuses`).toBe(false)
      world.week = week + wait
      expect(arrivalEligible(world), `${temperament}: the boundary week itself clears`).toBe(true)
    }
    // ...and the four waits really are four different numbers, so the loop above is four cases.
    expect(new Set(TEMPERAMENTS.map((t) => LIFE.cooldownWeeks[t])).size).toBe(4)
  })
})

// =================================================================================================
// F. ONE CALL SITE UNDER `src/`, AND IT IS THE WEEKLY TICK'S OWN PHASE
// =================================================================================================
describe('wave 4 T2 F – the hazard is the tick\'s, and the tick\'s alone', () => {
  /** Every `.ts`/`.vue` file under `src/`, as (relative path, source) – spirit.test.ts's own reader,
   *  and the same reason: this is a claim about the whole production tree, not about one file. */
  function srcFiles(dir = SRC_ROOT, prefix = ''): [string, string][] {
    const out: [string, string][] = []
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isDirectory()) out.push(...srcFiles(`${dir}${entry.name}/`, `${prefix}${entry.name}/`))
      else if (/\.(ts|vue)$/.test(entry.name)) out.push([prefix + entry.name, readFileSync(dir + entry.name, 'utf8')])
    }
    return out
  }

  /** Source with every comment removed – block first, then line. ⚠ LOAD-BEARING HERE: the order and
   *  its two rulings are argued at length in prose at the call site and in the module, and a pin that
   *  tripped on the explanation would be repaired by deleting the explanation. */
  function codeOnly(text: string): string {
    return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  }

  it('⚠⚠ ONE ROLL SITE AND ONE WRITER, both named', () => {
    // Both a deleted roll (endings silently switched off again) and a SECOND roll site – a command, a
    // surface or a second phase ending somebody's romance behind the gate – go red here. The call
    // text is matched rather than the bare name, because the barrel legitimately re-exports the name
    // and the module legitimately declares it, and neither of those ends anything.
    const rollers = srcFiles()
      .filter(([, text]) => codeOnly(text).includes('rollEnds(world)'))
      .map(([path]) => path)
    expect(rollers, 'the roll is the tick\'s, and the tick\'s alone').toEqual(['engine/world/phaseHerWeek.ts'])
    // ⚠ AND THE WRITE ITSELF HAS EXACTLY ONE CALLER, which is the stronger half: `endEpisode` is the
    // ONE line in the engine that sets `endedWeek`, so «an attachment is over» cannot acquire a second
    // spelling written straight against the array.
    const enders = srcFiles()
      .filter(([, text]) => /\bendEpisode\(/.test(codeOnly(text)))
      .map(([path]) => path)
      // ⚠ SORTED HERE AND NOT AT THE READER: `srcFiles` walks a directory before its sibling FILE
      // (`engine/world/` precedes `engine/world.ts`), which is a fact about `readdirSync` and not
      // about this claim.
      .sort()
    expect(enders, 'declared in the leaf, called from the hazard, and nowhere else').toEqual([
      'engine/world/lifeBeat.ts',
      'engine/world/loveEpisodes.ts',
    ])
    // ...and nothing outside that leaf assigns the field by hand.
    // ⚠⚠ THE PATTERN WAS RE-AIMED BY v75 T4 (12.09) AND IT IS A TIGHTENING, NOT A RELAXATION. It read
    // `/\.endedWeek\s*=/`, which matches an EQUALITY as readily as an assignment – `=` is the first
    // character of `===` – and T4 gives `world/lifeBeat.ts` two honest READS of the field
    // (`episode.endedWeek === null` in `beatEndsRead`, and the told-late branch's own test). The old
    // pattern called that file a writer. `=(?!=)` says «assigned, not compared», so the claim this
    // line makes is the claim it always meant to make, and it still goes red on a real second writer.
    const writers = srcFiles()
      .filter(([, text]) => /\.endedWeek\s*=(?!=)/.test(codeOnly(text)))
      .map(([path]) => path)
    expect(writers, '`endedWeek` is written in exactly one place').toEqual(['engine/world/loveEpisodes.ts'])
  })
})
