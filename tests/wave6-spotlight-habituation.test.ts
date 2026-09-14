// =================================================================================================
// WAVE 6, T4 – HABITUATION: THE WEEKS SHE LIVED KNOWN, AND WHAT THEY SAVE HER
// =================================================================================================
//
// `docs/plans/life-wave-6-builder-2026-09.md` §2 T4; the model is `docs/specs/who-she-is-2026-09.md`
// §3c («sustained fame slowly shrinks her own pressure scale – unless walls are up: walls freeze
// habituation. A veteran star from a good home shrugs at cameras that once cost her sleep»). Two of
// the architect's rulings decide this file's shape and each is named where it lands: **H** (either
// axis freezes her, and it is the FLAG and never the lean – settled, not a builder question) and
// **Q** (the writer is a SIBLING that runs AFTER the pass, it reads the wave's ONE horizon, and
// habituation 0 scales to exactly 1 as a BYTE-IDENTITY pin rather than an endpoint assertion).
//
// ⚠⚠ RULING N GOVERNS HERE TOO: PIN THE SHAPE, NEVER THE SIZE. `habituationFullWeeks 104` and
// `habituationFloor 0.25` are both §4 PROPOSALS and neither is ruled – T9 prices them and the owner
// rules. So every expectation below is computed FROM `ECONOMY`, and the only absolute numbers in the
// file are the ones the model itself fixes: `1` at zero weeks, the floor at the cap, and `0` growth
// on a frozen or unknown week. A re-tune moves both sides of every case together.
//
// ⚠⚠ THE ORDER IS THE MECHANIC, AND ONE HALF OF IT IS PINNED IN ANOTHER FILE ON PURPOSE. The
// habituation pass sits BETWEEN `accrueSpirit` and `driftWalls`, and the second half of that – «and
// before the walls pass» – is asserted by wave 5's own ruling-P case
// (tests/wave5-psychologist-walls.test.ts §H), which T4 re-aimed from `toBe(i + 1)` to a total list
// equality over what may sit between the two. It is not restated here: one claim, one home, and that
// home is the file whose ruling the adjacency belongs to.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED, the wave-2/3/4/5/T2/T3 duty kept – a net
// nobody watched fail proves nothing. Control GREEN first; every arm applied by a scripted string
// edit with UNIQUE mutation text and UNDONE by the inverse edit, never `git checkout`, with the md5
// of every touched file checked back to pristine after each one and a mismatch a HARD STOP. Counts
// are CASES – vitest counts cases and the first failing assertion ends the case, which is why claims
// are one per case here rather than five fixtures under one title (T2's ARM 1).
//
//   ARM 16 the freeze reads `wallsLean` instead of `wallsFlipped`   3 RED  §D's two wall cases and
//          – ruling H's own named hole                                     §D's lean case. ⚠ §D's
//                                                                          «pause, never a reset»
//                                                                          stays GREEN and that is
//                                                                          correct, not a weak arm:
//                                                                          that girl is at the CAP,
//                                                                          so a growth that fires
//                                                                          when it should not still
//                                                                          clamps to the same number
//   ARM 17 the freeze on ONE axis only (`flipped.open` alone)       1 RED  §D's regulation-wall case.
//                                                                          ⚠ the openness one stays
//                                                                          GREEN, correctly – it is
//                                                                          the axis the arm keeps –
//                                                                          and the PAIR is what makes
//                                                                          ruling H's either-axis
//                                                                          claim a claim
//   ARM 18 the growth moved BELOW `driftWalls`                      1 RED  the wave-5 walls pin, run
//                                                                          against THAT file. ⚠ the
//                                                                          T4 suite stays green, by
//                                                                          construction: this arm
//                                                                          breaks WHO she is read as
//                                                                          on a flip week, which is
//                                                                          the half wave 5's pin owns
//   ARM 19 the growth moved ABOVE `accrueSpirit` – ruling Q's       2 RED  §F's off-by-one case and
//          off-by-one, the one no test would otherwise name                the wave-5 walls pin.
//                                                                          ⚠⚠ THE ARM THAT DECIDED
//                                                                          §F's SHAPE: against §F's
//                                                                          FIRST draft – which called
//                                                                          `accrueSpirit` and then
//                                                                          `growHabituation` itself –
//                                                                          this arm was GREEN, since
//                                                                          that case proved the order
//                                                                          IT wrote. Re-aimed at the
//                                                                          real phase, it reddens
//   ARM 20 the news gate dropped from the growth                    3 RED  §E's unknown-girl case,
//                                                                          §F's one-clock case and
//                                                                          §C's byte-identity walk
//   ARM 21 the clamp dropped (`held + 1`, no `Math.min`)            1 RED  §E's cap case
//   ARM 22 `habituationScale` returns the constant `1` T4 replaces  7 RED  §B's floor, monotone and
//                                                                          linearity cases, §D's
//                                                                          pause case, §E's cap and
//                                                                          discount cases, and –
//                                                                          ⭐ UNPREDICTED – §F's
//                                                                          off-by-one case, which
//                                                                          finds a flat scale from
//                                                                          the other end
//   ARM 23 the horizon at `world.week` instead of `world.week - 1`  2 RED  §F's one-clock case and
//                                                                          the wave-5 walls pin
//
// ⚠ ALL EIGHT RUN, ALL EIGHT RED, NONE AT ZERO. Control green first; md5 of both touched engine files
// pristine after every one.
//
// ⚠⚠ AND ONE DECLARED **NULL** CONTROL, LABELLED SO IT CANNOT BE READ AS A WEAK ARM. CONTROL 22b runs
// ARM 22's mutation against tests/wave6-spotlight-schema.test.ts and expects 0 RED: 0 of 18 cases, as
// predicted – T1's schema suite walks careers that are never news, so the scale is read at 0 on every
// one of them and a flat scale is the same number.
//
// ⭐⭐ AND THE SAME MUTATION LEAVES **T3's WHOLE PRESSURE SUITE** GREEN, which is the measurement that
// justifies this file existing at all: every fixture in tests/wave6-spotlight-pressure.test.ts sits at
// habituation 0, where the shipped scale and the literal T3 wrote are the same number. T3's suite is
// blind to the factor by construction, so a T4 that added cases there would have been adding them to
// a file that cannot see the change.
import { describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's, 4's, 5's, T2's and T3's apparatus, verbatim and
// for its reason. Every call is delegated to the real `rngFromSeed`, so nothing this file measures is
// a fiction; the mock exists only so §G can COUNT the keys the habituation pass reaches for.
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

import {
  accrueSpirit,
  growHabituation,
  habituationScale,
  temperamentIntensity,
  temperamentOpenness,
  type Temperament,
} from '../src/engine/spirit'
import {
  closeTournament,
  createWorld,
  sheIsNewsAt,
  skipTournament,
  tickWeek,
  type ExposureEvent,
  type ExposureKind,
  type WorldState,
} from '../src/engine/world'
import { resolveBodyAndPlanner } from '../src/engine/world/phaseHerWeek'
import { resumeMain } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { isBlackoutWeek } from '../src/engine/season/calendar'
import { schoolIsOver } from '../src/engine/kidLife'
import { birthdayTurning } from '../src/engine/world/age'

const SRC = fileURLToPath(new URL('../src/', import.meta.url))

const SPOT = ECONOMY.spotlight
const FULL = SPOT.habituationFullWeeks
const FLOOR = SPOT.habituationFloor

/** §D's and §F's girl: `'quiet'` is the steady·private corner, chosen for arithmetic rather than for
 *  character – every product it makes lands on an EXACT TENTH (3 × 0.8 × 1.5 = 3.6, 4 × 0.8 × 1.5 =
 *  4.8), so the pass's single `roundTenth` cannot move a value by half a tenth and turn an exact
 *  claim into an approximate one. T3 measured that trap on the intensity axis and this file inherits
 *  the lesson rather than re-learning it. */
const GIRL: Temperament = 'quiet'

/** Every `.ts`/`.vue` file under `src/`, as (relative path, source) – the whole-tree form the other
 *  three wave-6 suites use, because «nothing prints it» is a claim about `src/` and a census scoped
 *  to `engine/` would be silent about a component that reached for the field. */
function srcFiles(dir = SRC, prefix = ''): [string, string][] {
  const out: [string, string][] = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) out.push(...srcFiles(`${dir}${entry.name}/`, `${prefix}${entry.name}/`))
    else if (/\.(ts|vue)$/.test(entry.name)) out.push([prefix + entry.name, readFileSync(dir + entry.name, 'utf8')])
  }
  return out
}

/** Source with every comment removed – this file's subject is a module whose COMMENTS name
 *  `habituationScale`, `wallsFlipped` and `spotlightHabituation` in order to argue about them. */
function codeOnly(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

/** Does `week` fire NO row of the perturbation table for this girl? T3's helper, so a case can pose
 *  exactly one fact and read exactly one delta. */
function quietWeek(base: WorldState, week: number): boolean {
  const schoolOver = schoolIsOver(week, base.profile.birthMonth)
  return (
    !isBlackoutWeek(week, schoolOver) && birthdayTurning(week, base.profile.birthMonth, base.profile.birthDay) === null
  )
}

/** A world parked at a QUIET week, at both baselines, wearing the temperament under test – built by
 *  `createWorld` and then MOVED, never hand-assembled, so the shapes are the engine's own. */
function probe(seed = 'spotlight-habituation', temperament: Temperament = GIRL, week = 210): WorldState {
  const world = createWorld(seed)
  world.temperament = temperament
  let w = week
  while (!quietWeek(world, w) || !quietWeek(world, w + 1)) w++
  world.week = w
  world.spirit = ECONOMY.spirit.baseline
  world.bond = ECONOMY.bond.start
  return world
}

/** Make her news at every week from `world.week` back – two OLD Slam titles in the cabinet, the
 *  construction T3's §B and §F both use. ⚠ THE STAMPS ARE OLD ON PURPOSE: a fixture whose fame comes
 *  from the very week under test would measure the gate instead of the thing being asked about
 *  (ruling E-bis's own warning). */
function makeNews(world: WorldState, at = world.week): WorldState {
  const slam = (world.trophiesByTier.slam ??= { titles: [], finals: [] })
  slam.titles.push(at - 40, at - 41)
  return world
}

/** `n` events of one kind – the list the caller hands down. */
function events(kind: ExposureKind, n = 1): ExposureEvent[] {
  return Array.from({ length: n }, () => ({ kind }))
}

/** ONE event's pressure for §D's girl, BEFORE habituation and before the focus – the three factors
 *  T3 shipped, computed from `ECONOMY` so a re-tune moves both sides of every expectation together
 *  (ruling N). This is the expression `habituationScale` multiplies, and at habituation 0 it is the
 *  whole of it – which is what ruling Q part 3's byte-identity claim means arithmetically. */
function preT4Product(kind: ExposureKind, temperament: Temperament = GIRL): number {
  return (
    Math.abs(SPOT.pressureBase[kind]) *
    ECONOMY.spirit.perturbationScale[temperamentIntensity(temperament)] *
    SPOT.opennessScale[temperamentOpenness(temperament)]
  )
}

/** What one pass costs her, in spirit points from baseline – positive numbers are costs, raw so a
 *  case can ask about tenths. */
function costOf(world: WorldState, exposure: readonly ExposureEvent[]): number {
  accrueSpirit(world, false, exposure)
  return ECONOMY.spirit.baseline - world.spirit
}

/** A plain deterministic walk – the schema suites' helper verbatim, and `resumeMain` for its reason:
 *  it is what the WORKER threads through the tick (v35) and it mutates `world.rngMain` in place, so
 *  the persisted MAIN position advances with the walk and lands inside §C's key-for-key comparison. */
function walk(world: WorldState, weeks: number): WorldState {
  const rng = resumeMain(world.rngMain)
  for (let w = 0; w < weeks; w++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

// =================================================================================================
// A. THE TWO CONSTANTS – both §4 proposals, both unruled, and pinned for MEANING rather than size
// =================================================================================================
describe('wave 6 T4 A – ECONOMY.spotlight gains exactly the two constants T4 needs', () => {
  it('⭐⭐ the floor is a SHRUG and never an immunity – strictly between 0 and 1', () => {
    // ⚠⚠ THE SHAPE CLAIM AND NOT THE NUMBER (ruling N). §3c's sentence is «a veteran star from a good
    // home SHRUGS at cameras that once cost her sleep» – a shrug, not an exemption. A floor of 0
    // would switch the whole mechanic off in exactly the careers it was written for; a floor of 1
    // would make habituation a no-op that ships as a feature. The value 0.25 is a §4 PROPOSAL the
    // owner has not ruled on and T9 prices, so what is pinned is the interval it has to live in.
    expect(FLOOR, 'a long-famous girl still pays something').toBeGreaterThan(0)
    expect(FLOOR, '...and she really does pay less than the first time').toBeLessThan(1)
  })

  it('⭐⭐ the span is a positive whole number of WEEKS – the denominator and the cap in one constant', () => {
    // ⚠ ONE CONSTANT FOR BOTH JOBS IS THE DESIGN: `growHabituation` clamps the counter here and
    // `habituationScale` divides by the same value, so the floor is reached exactly when the ceiling
    // is and never passed. Two constants could disagree; one cannot. ⚠ 104 is a §4 proposal.
    expect(FULL, 'a division by zero is not a mechanic').toBeGreaterThan(0)
    expect(Number.isInteger(FULL), 'weeks are counted, never fractioned').toBe(true)
  })
})

// =================================================================================================
// B. THE READ – `habituationScale`, its two exact endpoints, its direction and its shape
// =================================================================================================
describe('wave 6 T4 B – the scale runs from 1 down to the floor, linearly', () => {
  it('⭐⭐⭐ zero weeks scale to EXACTLY 1 – ruling Q part 3, and the literal T4 replaces', () => {
    // ⚠⚠ `toBe(1)` AND NOT `toBeCloseTo(1)`, deliberately: the subtracted product is `× 0`, so the
    // expression is `1 − 0` and there is no float tail to forgive. The whole of §C rests on this
    // being exact rather than nearly exact – a career that has never been news must take the same
    // factor T3 shipped as a literal, to the last bit.
    expect(habituationScale(0)).toBe(1)
  })

  it('⭐⭐⭐ a full `habituationFullWeeks` scales to EXACTLY the floor', () => {
    // The other endpoint, and the reason the cap and the denominator are one constant: at the ceiling
    // the veteran pays exactly `habituationFloor` of what the same week cost her the first time.
    expect(habituationScale(FULL)).toBe(FLOOR)
  })

  it('⭐⭐ it never rises – a longer-known girl is never charged more for the same week', () => {
    // ⚠ MONOTONE OVER THE WHOLE SPAN, walked at every week rather than sampled at three points: «it
    // only ever grows» (§0.5) is worth nothing if the READ is not monotone in it.
    let previous = habituationScale(0)
    for (let weeks = 1; weeks <= FULL; weeks++) {
      const now = habituationScale(weeks)
      expect(now, `week ${weeks} must not cost her more than week ${weeks - 1}`).toBeLessThan(previous)
      previous = now
    }
  })

  it('⭐⭐ and it is LINEAR – halfway along the span is exactly halfway to the floor', () => {
    // ⚠ THE CASE THAT SEPARATES THE RULED FORMULA FROM EVERY OTHER CURVE WITH THE SAME TWO ENDPOINTS.
    // A quadratic, an exponential and a step function all satisfy the two cases above; the brief's
    // own «linear from 1 down to `habituationFloor`» is what this asserts, and it is the half a
    // «tidier» re-spelling would silently drop.
    const midpoint = habituationScale(FULL / 2)
    expect(midpoint).toBeCloseTo(1 - (1 - FLOOR) / 2, 12)
  })
})

// =================================================================================================
// C. ⭐⭐⭐ BYTE-IDENTITY AT ZERO – ruling Q part 3, with the null-arm check it asks for by name
// =================================================================================================
//
// «Every career that has never been news must play exactly the tennis it played before T4 existed,
// and the T3 literal `1` this task replaces is what made that true yesterday.» Two directions, and
// the second is what stops the first being vacuous: ruling Q asks for it out loud – «pin it against a
// world that HAS been news as well … so the pin cannot pass by never having grown anything».
describe('wave 6 T4 C – a career that was never news plays the tennis it played before T4', () => {
  it('⭐⭐⭐ at habituation 0 the week costs EXACTLY the three-factor product T3 shipped', () => {
    // ⚠ THE ARITHMETIC HALF, on all five kinds under one claim BECAUSE THE CLAIM IS KIND-INDEPENDENT:
    // the habituation factor multiplies every kind identically, so a mutation of it moves all five
    // together and a per-kind split would buy nothing here. (T3's own per-kind split exists for a
    // different hazard – a single zeroed §4 BASE, which is per-kind by construction.)
    for (const kind of Object.keys(SPOT.pressureBase) as ExposureKind[]) {
      const world = probe(`habituation-identity-${kind}`)
      expect(world.spotlightHabituation, `${kind}: the fixture really is at zero`).toBe(0)
      expect(costOf(world, events(kind)), `${kind}: the pre-T4 product, to the tenth the pass rounds to`)
        .toBeCloseTo(Math.round(preT4Product(kind) * 10) / 10, 10)
    }
  })

  it('⭐⭐⭐ 52 weeks of a never-news career walk the same with the key and without it, key for key', () => {
    // ⚠⚠ THE CONTROL IS THE CHANGE NEUTRALISED IN PLACE AND NEVER A SECOND COMMIT – CLAUDE.md's own
    // rule for a shared checkout, and the shape wave 5's §E and T1's §D both use. The A arm is this
    // tree with the key DELETED off a live world, which is precisely the v76 shape.
    const withKey = walk(probe('habituation-zero-walk'), 52)

    const stripped = probe('habituation-zero-walk') as unknown as Record<string, unknown>
    delete stripped.spotlightHabituation
    expect('spotlightHabituation' in stripped, 'the A arm really has no habituation').toBe(false)
    const withoutKey = walk(stripped as unknown as WorldState, 52) as unknown as Record<string, unknown>

    expect(withKey.spotlightHabituation, 'she was never news, so nothing counted a week').toBe(0)
    expect('spotlightHabituation' in withoutKey, '...and the pass wrote nothing onto the stripped arm').toBe(false)

    const b = JSON.parse(JSON.stringify(withKey)) as Record<string, unknown>
    delete b.spotlightHabituation
    expect(Object.keys(withoutKey).sort(), 'the two arms end with the same key set once the v77 key is off')
      .toEqual(Object.keys(b).sort())
    for (const key of Object.keys(b)) {
      expect(JSON.stringify(withoutKey[key]), `${key} is byte-identical across the two arms`).toBe(JSON.stringify(b[key]))
    }
    // ⚠ AND THE WALK REALLY WALKED, so the identity above is not the identity of two empty worlds.
    expect(withKey.rngMain.n, 'the arms really spent MAIN draws').toBeGreaterThan(0)
    expect(withKey.events.length, '...and really lived a career').toBeGreaterThan(10)
  }, 120_000)

  it('⭐⭐⭐ ⚠ THE NULL-ARM CHECK – the same construction on a NEWS career DIVERGES', () => {
    // ⚠⚠ RULING Q ASKS FOR THIS BY NAME: «pin it against a world that HAS been news as well … so the
    // pin cannot pass by never having grown anything». Without it the case above could be measuring a
    // world the mechanic can never reach, which is the «unable to fail» family this pair of waves has
    // now found more than a dozen times. Same seed, same walk, one cabinet apart.
    const withKey = walk(makeNews(probe('habituation-news-walk')), 52)
    const stripped = makeNews(probe('habituation-news-walk')) as unknown as Record<string, unknown>
    delete stripped.spotlightHabituation
    const withoutKey = walk(stripped as unknown as WorldState, 52) as unknown as Record<string, unknown>

    expect(withKey.spotlightHabituation, 'the apparatus really can count a week').toBeGreaterThan(0)
    expect(withoutKey.spotlightHabituation, '...and it counts on the stripped arm too, from the same zero')
      .toBe(withKey.spotlightHabituation)
  }, 120_000)
})

// =================================================================================================
// D. ⭐⭐⭐ THE FREEZE – ruling H: EITHER axis, and the FLAG, never the lean
// =================================================================================================
//
// who-she-is §3c: «unless walls are up: walls freeze habituation.» Ruling H settles both halves the
// brief left open – «up» is the spec's word for the FLIPPED state, and both axes are walls (the
// openness wall makes her expressed-closed, the regulation wall dysregulated). The mechanical
// confirmation is that the pressure ALREADY reads both axes, so a one-axis freeze would acclimatise
// a girl the same pass has just charged double.
//
// ⚠⚠ EQUAL FAME IN BOTH ARMS AND BOTH PROVED NEWS, which is the ⚠ the task attaches to this pin:
// grow a walled and an unwalled twin at EQUAL fame, or the pin passes because neither grew.
describe('wave 6 T4 D – walls freeze habituation, on either axis', () => {
  /** Twins that differ by ONE boolean and nothing else – same seed, same week, same cabinet. */
  function twins(flip: 'open' | 'reg'): { walled: WorldState; free: WorldState } {
    const free = makeNews(probe('habituation-walls'))
    const walled = makeNews(probe('habituation-walls'))
    walled.wallsFlipped = { ...walled.wallsFlipped, [flip]: true }
    return { walled, free }
  }

  it('⭐⭐⭐ the fixture is not vacuous: BOTH twins are news at the week the pass asks about', () => {
    // ⚠⚠ THE CASE THE WHOLE SECTION RESTS ON. A freeze pin whose walled twin simply was not famous
    // enough to grow is a pin that measures the news gate and reports the walls. Both arms are
    // asserted news at the SAME week, so the only difference the cases below can be reading is the
    // flag itself.
    for (const axis of ['open', 'reg'] as const) {
      const { walled, free } = twins(axis)
      expect(sheIsNewsAt(free, free.week), `${axis}: the unwalled twin is news`).toBe(true)
      expect(sheIsNewsAt(walled, walled.week), `${axis}: and so is the walled one`).toBe(true)
    }
  })

  it('⭐⭐⭐ the OPENNESS wall freezes her while her twin at equal fame grows', () => {
    const { walled, free } = twins('open')
    growHabituation(walled, true)
    growHabituation(free, true)
    expect(walled.spotlightHabituation, 'behind walls she acclimatises to nothing').toBe(0)
    expect(free.spotlightHabituation, '...and her twin lived the same week known').toBe(1)
  })

  it('⭐⭐⭐ the REGULATION wall does it on its own – ruling H\'s either-axis half', () => {
    // ⚠ ITS OWN CASE AND NOT A SECOND FIXTURE UNDER THE ONE ABOVE: a one-axis freeze is exactly the
    // reading ruling H refuses, and a mutation that ships it must redden a case of its own rather
    // than hide behind the openness arm's assertion failing first (T2's ARM 1, measured).
    const { walled, free } = twins('reg')
    growHabituation(walled, true)
    growHabituation(free, true)
    expect(walled.spotlightHabituation, 'dysregulated is behind walls too').toBe(0)
    expect(free.spotlightHabituation).toBe(1)
  })

  it('⚠ the LEAN is not the flag – a girl leaning hard toward walls has not raised them', () => {
    // ⚠⚠ RULING H's OWN SENTENCE, AS A CASE: «the FLAG, never the lean – `wallsLean` is a continuous
    // leaning and a girl leaning toward walls has not raised them». The leaning is invisible on every
    // surface and moves every week of every career; a freeze keyed on it would stop habituation for
    // almost everybody almost always, silently.
    const leaning = makeNews(probe('habituation-lean'))
    leaning.wallsLean = { open: ECONOMY.life.walls.flipArm, reg: ECONOMY.life.walls.flipArm }
    leaning.wallsFlipped = { open: false, reg: false }
    growHabituation(leaning, true)
    expect(leaning.spotlightHabituation, 'leaning is not up').toBe(1)
  })

  it('⚠ and the freeze is a PAUSE, never a reset – she keeps what she already learned', () => {
    // §0.5's «it only ever grows» seen from the other end: walls stop the counter, they do not empty
    // it. A veteran who closes up for a season is still a veteran when she opens again, and her
    // pressure stays discounted the whole time she is behind them.
    //
    // ⚠⚠ AND THE SECOND ASSERTION IS THE SCALE AND DELIBERATELY NOT THE SPIRIT COST, WHICH IS A
    // MEASUREMENT WORTH CARRYING: a flipped wall also INVERTS the axis `expressedTemperamentOf`
    // reports, so a walled girl is priced as the opposite pole on that axis and her spirit cost moves
    // for a reason that has nothing to do with habituation (measured 14.09: this girl's `publicLoss`
    // goes 1.2 -> 0.9 on a double flip, because `'quiet'` expressed behind both walls is steady·
    // private read as intense·open). Asserting the cost here would have made one case about two
    // mechanics and tied the freeze's pin to wave 5's inversion table.
    const held = makeNews(probe('habituation-pause'))
    held.spotlightHabituation = FULL
    held.wallsFlipped = { open: true, reg: true }
    growHabituation(held, true)
    expect(held.spotlightHabituation, 'the walls froze it where it stood').toBe(FULL)
    expect(habituationScale(held.spotlightHabituation), 'and the veteran still reads the veteran\'s scale')
      .toBe(FLOOR)
  })
})

// =================================================================================================
// E. THE GROWTH – the rate, the gate, the monotone and the clamp
// =================================================================================================
describe('wave 6 T4 E – +1 per week lived known, capped at the span', () => {
  it('⭐⭐⭐ one known week counts exactly one', () => {
    const world = makeNews(probe('habituation-rate'))
    growHabituation(world, true)
    expect(world.spotlightHabituation).toBe(1)
  })

  it('⭐⭐⭐ an unknown girl counts nothing, whatever else is true of her week', () => {
    // The gate every mechanic in this wave shares: «an unknown girl has no spotlight, whatever she
    // wins», so there is nothing for her to get used to.
    const world = probe('habituation-unknown')
    expect(sheIsNewsAt(world, world.week), 'the fixture really is unknown').toBe(false)
    growHabituation(world, false)
    expect(world.spotlightHabituation).toBe(0)
  })

  it('⭐⭐⭐ it is MONOTONE in weeks held – more known weeks is always more habituation', () => {
    const short = makeNews(probe('habituation-monotone'))
    const long = makeNews(probe('habituation-monotone'))
    for (let i = 0; i < 10; i++) growHabituation(short, true)
    for (let i = 0; i < 30; i++) growHabituation(long, true)
    expect(short.spotlightHabituation).toBe(10)
    expect(long.spotlightHabituation, 'and the longer-known girl is further along').toBeGreaterThan(
      short.spotlightHabituation,
    )
  })

  it('⭐⭐⭐ THE CLAMP – it cannot pass `habituationFullWeeks` however long she stays famous', () => {
    // ⚠ THREE TIMES THE SPAN, so the case is about the clamp and not about arriving exactly at it.
    // ⚠ AND THE SECOND ASSERTION IS WHY THE CLAMP MATTERS: the scale divides by the same constant, so
    // an uncapped counter would drive it below the floor and, far enough, through zero into a
    // spotlight that PAYS her. The cap is the only thing standing between.
    const veteran = makeNews(probe('habituation-clamp'))
    for (let i = 0; i < FULL * 3; i++) growHabituation(veteran, true)
    expect(veteran.spotlightHabituation, 'the counter stops at the span').toBe(FULL)
    expect(habituationScale(veteran.spotlightHabituation), '...and the scale rests exactly on the floor').toBe(FLOOR)
  })

  it('⚠ a habituated girl really is charged less for the same week than she was on day one', () => {
    // The two halves of the mechanic met: the counter grows, the scale reads it, and the SAME event
    // costs a veteran a quarter of what it cost the newcomer. Computed from `ECONOMY` so a re-tune
    // of either constant moves both sides.
    const newcomer = makeNews(probe('habituation-discount-a'))
    const veteran = makeNews(probe('habituation-discount-b'))
    veteran.spotlightHabituation = FULL
    const first = costOf(newcomer, events('publicLoss'))
    const later = costOf(veteran, events('publicLoss'))
    expect(later, 'she shrugs, she is not immune').toBeGreaterThan(0)
    expect(later, '...and the shrug is exactly the floor').toBeCloseTo(first * FLOOR, 1)
  })
})

// =================================================================================================
// F. ⚠⚠ THROUGH THE REAL PHASE – the call site, the off-by-one and the wave's ONE horizon
// =================================================================================================
//
// ⚠ EVERY CASE HERE RUNS `resolveBodyAndPlanner`, the function that HOLDS the call site, and not a
// hand-spelled composition of `sheIsNewsAt` and `growHabituation`. A case that re-spells the call
// site proves the spelling it wrote; these run the statements that ship.
describe('wave 6 T4 F – the sibling, in the phase that calls it', () => {
  it('⭐⭐⭐ a known week is counted by the weekly phase itself', () => {
    const world = makeNews(probe('habituation-phase'))
    resolveBodyAndPlanner(world)
    expect(world.spotlightHabituation, 'the tick counted the week she lived known').toBe(1)
  })

  it('⭐⭐⭐ ⚠⚠ THE OFF-BY-ONE RULING Q NAMES – the scale is read with the habituation she CAME INTO the week holding', () => {
    // ⚠⚠ THE CASE THE PLACEMENT EXISTS FOR, and the defect it refuses is the one «no test would name»:
    // a growth that ran BEFORE the pass would discount this week's own exposure by this week's own
    // growth, which from the outside reads as «the constants came out slightly too weak».
    //
    // ⚠⚠ IT RUNS THE **REAL PHASE** AND HAND-SPELLS NOTHING, WHICH IS THE WHOLE DIFFERENCE BETWEEN
    // THIS CASE AND A CASE THAT CANNOT FAIL. A version that called `accrueSpirit` and then
    // `growHabituation` itself would prove the order IT wrote and stay green through the two
    // statements being swapped in `world/phaseHerWeek.ts` – measured: that was this case's first
    // draft, and ARM 19 (the growth moved above the pass) left it green. Driving
    // `resolveBodyAndPlanner` puts the shipped statements under test instead of restating them.
    //
    // ⚠ THE EXPOSURE IS DERIVED BY THE PHASE, NOT HANDED IN: a big-stage title stamped in the week
    // that has CLOSED, which is the horizon the call site reads. Both expectations are computed from
    // `ECONOMY`; the FIXTURE CHECK asserts the two orders are distinguishable at all after the pass's
    // single `roundTenth` – without it a quantised tie would let this case pass on either order.
    const held = 40
    const world = makeNews(probe('habituation-order'))
    world.spotlightHabituation = held
    const slam = (world.trophiesByTier.slam ??= { titles: [], finals: [] })
    slam.titles.push(world.week - 1)
    expect(sheIsNewsAt(world, world.week - 1), '⚠ the fixture is news at the week that closed').toBe(true)

    const per = preT4Product('stage')
    const round = (x: number): number => Math.round(x * 10) / 10
    const cameInto = round(ECONOMY.spirit.baseline - per * habituationScale(held))
    const grownFirst = round(ECONOMY.spirit.baseline - per * habituationScale(held + 1))
    expect(cameInto, '⚠ the fixture can tell the two orders apart').not.toBe(grownFirst)

    resolveBodyAndPlanner(world)
    expect(world.spirit, 'the week was priced by the girl who walked into it').toBe(cameInto)
    expect(world.spotlightHabituation, '...and the week she just lived is counted after it').toBe(held + 1)
  })

  it('⭐⭐⭐ ⚠ ONE CLOCK – the gate is asked about the LAST CLOSED week, exactly like the pressure', () => {
    // ⚠⚠ RULING Q PART 2, MEASURED RATHER THAN READ OFF THE CALL TEXT. The fixture is a girl whose
    // fame arrives in the week she is parked in and in no earlier one: `fameAt` derives from stamps,
    // and `decayAt` returns 0 for anything in the future, so she is news AT `world.week` and NOT at
    // `world.week − 1`. A pass that asked about `world.week` would count this week; the shipped one
    // must not, because ruling P gave this wave one clock and the pressure reads the closed week.
    const world = probe('habituation-horizon')
    makeNews(world, world.week + 40)
    expect(sheIsNewsAt(world, world.week), 'she is news this week').toBe(true)
    expect(sheIsNewsAt(world, world.week - 1), '...and was not last week').toBe(false)
    resolveBodyAndPlanner(world)
    expect(world.spotlightHabituation, 'the pass reads the week that CLOSED, not the one being lived').toBe(0)
  })

  it('⚠ the pass writes `spotlightHabituation` and NOTHING else, key by key', () => {
    // `driftWalls`'s own §H shape, applied to the wave's second slow counter: a pass that quietly
    // moved spirit, bond or a leaning would be a second writer of a field with exactly one.
    const world = makeNews(probe('habituation-writes'))
    const before = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
    growHabituation(world, true)
    const after = world as unknown as Record<string, unknown>
    expect(Object.keys(after).sort(), 'no key appears or disappears').toEqual(Object.keys(before).sort())
    for (const key of Object.keys(before)) {
      if (key === 'spotlightHabituation') continue
      expect(JSON.stringify(after[key]), `${key} is where the pass found it`).toBe(JSON.stringify(before[key]))
    }
    expect(after.spotlightHabituation, 'and the one field it owns did move').toBe(1)
  })
})

// =================================================================================================
// G. THE DELIBERATE ABSENCES – no decay, no surface, no draw (§0.5, §8, the fog law)
// =================================================================================================
//
// ⚠⚠ NAMED SO NOBODY ADDS THEM. Each of these is a thing a later reader would plausibly supply as an
// obvious omission, and each is a design decision the owner has not been asked to make.
describe('wave 6 T4 G – what T4 deliberately does not do', () => {
  it('⚠⚠ NO DECAY – the counter never falls, not even after seasons out of the light', () => {
    // v1, brief §0.5: «she does not unlearn living known». The girl is grown to the cap, then the
    // gate is closed for two full seasons; the counter must still read the cap.
    const world = makeNews(probe('habituation-no-decay'))
    for (let i = 0; i < FULL; i++) growHabituation(world, true)
    expect(world.spotlightHabituation, 'she is a veteran').toBe(FULL)
    for (let i = 0; i < 104; i++) growHabituation(world, false)
    expect(world.spotlightHabituation, 'and two quiet seasons take none of it back').toBe(FULL)
  })

  it('⚠⚠ NO SURFACE – nothing outside `src/engine` names the field or either constant', () => {
    // ⚠ THE FOG LAW (§3c, §8: «no publicity meter, no habituation surface»). The spotlight is READ
    // through the feed's plain words, the Mood dips, the diary and the booth – never through a
    // number on screen. A whole-tree census, comments stripped, so the claim cannot be repaired by
    // deleting a sentence.
    const names = ['spotlightHabituation', 'habituationScale', 'habituationFullWeeks', 'habituationFloor']
    const reaching = srcFiles()
      .filter(([path]) => !path.startsWith('engine/'))
      .filter(([, source]) => names.some((n) => codeOnly(source).includes(n)))
      .map(([path]) => path)
    expect(reaching, 'no component, no viz, no snapshot field, no store').toEqual([])
  })

  it('⚠ ZERO DRAWS – the pass derives no stream and MAIN is where it was', () => {
    const world = makeNews(probe('habituation-draws'))
    const before = JSON.stringify(world.rngMain)
    rngKeys.length = 0
    growHabituation(world, true)
    expect(rngKeys, 'three reads and one assignment').toEqual([])
    expect(JSON.stringify(world.rngMain), 'and MAIN is untouched').toBe(before)
  })

  it('⚠ and `world.spotlightHabituation` has exactly ONE writer in `src/`', () => {
    // The law wave 5 wrote for `world.spirit`, applied to the field this task creates a writer for.
    const writers = srcFiles()
      .filter(([, text]) => /world\.spotlightHabituation\s*=[^=]/.test(codeOnly(text)))
      .map(([p]) => p)
    expect(writers.sort(), 'one writer, one file').toEqual(['engine/spirit.ts'])
  })
})
