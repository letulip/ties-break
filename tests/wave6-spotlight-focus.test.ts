// =================================================================================================
// WAVE 6, T5 – «THE PUBLIC LIFE»: THE FIFTH YEAR-FOCUS, AND WHAT HOLDING IT BUYS
// =================================================================================================
//
// `docs/plans/life-wave-6-builder-2026-09.md` §2 T5; the ruled row is
// `docs/specs/the-psychologists-year-2026-09.md` §2 («while held, the spotlight's pressure shrinks by
// rung and habituation accelerates») and O7, ruled 13.09 – «ships WITH the spotlight wave, not before
// it has something to shrink». The architect's **RULING O** decides this file's first section, and the
// masseur spec's §4 law («each rung measurably better than the one below AT THE CHOSEN FOCUS, or it is
// re-priced») decides its shape.
//
// ⚠⚠ WHY THIS FILE EXISTS AT ALL, AND IT IS A MEASUREMENT RATHER THAN A HABIT. T4 measured that T3's
// whole pressure suite is BLIND to the habituation factor – every fixture there sits at habituation 0,
// so flattening that scale left the suite green (its ARM 22). The lesson it wrote down is aimed at
// this task by name: «a factor that ships as a literal `1` has no witnesses until its own task builds
// them». T5 replaces TWO such literals – the fifth factor of `exposurePressure`'s product and the
// multiplier on `growHabituation`'s `+1` – so each one gets an arm that FLATTENS it back to the
// literal, and each arm has to redden cases HERE. An arm that neuters one of the two and leaves
// everything green would mean a third invisible literal had shipped.
//
// ⚠⚠ RULING N GOVERNS HERE AS IT DOES IN T3 AND T4: PIN THE SHAPE, NEVER THE SIZE.
// `publicLifeShrink [0.85, 0.70, 0.55]` and `publicLifeAccel [1.5, 2.0, 2.5]` are §4 PROPOSALS and
// NEITHER IS RULED – T9's psy-grid prices them and the owner rules. So every expectation below is
// computed FROM `ECONOMY`, and the only absolute numbers in the file are the ones the model itself
// fixes: `1` with no seat, `×0` behind a wall, and the cap. A re-tune moves both sides of every case.
//
// ⚠⚠ AND EVERY ARM OF A RUNG CLAIM CARRIES ITS FIXTURE CHECK, T4's own lesson one task back: the
// pass rounds to tenths exactly once, so two rungs can land on the SAME tenth after a re-tune and a
// monotone assertion would then pass on a flattened ladder. Each monotone case asserts the arms are
// DISTINGUISHABLE before asserting the order.
//
// ⚠⚠ AND NO CASE IS ALLOWED TO BE VACUOUS ABOUT THE SEAT. The effects ride the rung the seat is
// WORKING this focus at, so every arm asserts `psychologistWorkingRung(world, 'publicLife')` – the
// engine's own function, never the re-spelling under test – returns the rung the case thinks it does.
// A monotone pin on a seat that was never working is a pin about nothing.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was watched fail, and the counts are CASES
// =================================================================================================
//
// Counts are CASES and every one of them is MEASURED, run against a fixed set of seven unit files
// (this one, wave5-psychologist-focus, wave5-psy-counsel, wave5-psychologist-seat,
// wave5-psychologist-walls, wave6-spotlight-pressure, wave6-spotlight-habituation – 213 cases):
//
//   ARM 24 the shrink flattened back to the literal `1` T3 shipped    6 RED  §C's shrink sweep, §D's
//          – the first of this task's two invisible literals                 monotone, held and
//                                                                            every-kind cases, §F's
//                                                                            pressure case, §G's
//                                                                            full-habituation case.
//                                                                            ⚠ §D's stand-down stays
//                                                                            GREEN and that is right:
//                                                                            that arm asserts the
//                                                                            stood-down girl equals a
//                                                                            SEATLESS twin, and a flat
//                                                                            factor makes them equal
//                                                                            the other way round
//   ARM 25 the acceleration flattened back to the literal `1` T4      4 RED  §C's accel sweep, §E's
//          shipped – the second literal                                      monotone and held cases,
//                                                                            §F's habituation case
//   ARM 26 the focus id mis-read (`'herself'` instead of             11 RED  every held case of both
//          `'publicLife'`) – one year buying another year's work             effects, plus §D's
//                                                                            no-stacking case from the
//                                                                            other side
//   ARM 27 the billing predicate dropped from the rung read           2 RED  §D's and §E's stand-down
//          (`psychologistHired` instead of `psychologistWorks`)              cases, and nothing else –
//          – ruling J's own defect, pre-booked on a new focus                the two cases that exist
//                                                                            for exactly this
//   ARM 28 the seat buys her out of the walls freeze – the            1 RED  §E's composition case, on
//          `Math.max` shape, written as «the freeze does not                 its own, which is why it
//          apply while somebody is paying»                                   is its own case
//   ARM 29 `publicLifeShrink` flattened to [0.7, 0.7, 0.7]            2 RED  §A's ladder, §D's monotone
//   ARM 30 `publicLifeAccel` flattened to [2, 2, 2]                   2 RED  §A's ladder, §E's monotone
//   ARM 31 ⚠⚠ RULING O ITSELF – the fifth focus left OFF              5 RED  wave 5's re-aimed
//          `PSY_FOCUSES` while the type, the label and the line               MEMBERSHIP oracle, §B's
//          all stay. THE ARM THE COMPILER DOES NOT MAKE FOR US              two offered cases, §C's
//                                                                            non-vacuity case and §H's
//                                                                            no-schema-move case
//   ARM 32 the line written so it cannot splice (a lowercase          1 RED  §B's both-frames case
//          opening) – the owner's Q9 frame, broken
//
// ⚠⚠ TWO DECLARED NULL CONTROLS, AND BOTH CAME BACK AT ZERO AS PREDICTED – this is the measurement
// that justifies the file rather than a formality. ARM 24's mutation against
// tests/wave6-spotlight-pressure.test.ts: **0 RED of 51**. ARM 25's against
// tests/wave6-spotlight-habituation.test.ts: **0 RED of 27**. Every fixture in those two suites is
// SEATLESS, so the shipped readers and the literals they replace are the same number there – T3's and
// T4's suites are blind to T5's factors exactly as T3's was blind to T4's.
//
// ⚠⚠ AND ONE MEASURED NULL THAT WAS **NOT** PREDICTED AND IS CARRIED BACK RATHER THAN BURIED: ARM 31
// run against the MOUNTED CARD (tests/component/psychologist-card.test.ts) is **0 RED of 15**. Every
// count in that file is derived from `PSY_FOCUSES` – `options.length` against `PSY_FOCUSES.length`,
// the open-set fixtures filtered off the same array – so a focus dropped from the roster takes the
// card's expectations down with it and the mounted suite goes green on a card that silently offers
// four years instead of five. **The component layer is blind to ruling O's hole for exactly the reason
// the array is**, which means the membership oracle in wave5-psychologist-focus.test.ts §A is not one
// net among several: on this tree it is the ONLY thing that catches it.
//
// ⚠ CONTROL GREEN FIRST; every arm a scripted string edit with UNIQUE mutation text, undone by the
// inverse edit and never by `git checkout`, with the md5 of all three touched engine files verified
// pristine after each one and a mismatch a HARD STOP.
import { describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's, 4's, 5's and T2-T4's apparatus, verbatim and for
// its reason. Every call is delegated to the real `rngFromSeed`, so nothing this file measures is a
// fiction; the mock exists only so §H can COUNT the keys the two effects reach for.
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
  publicLifeAccelAt,
  publicLifeShrinkAt,
  temperamentIntensity,
  temperamentOpenness,
  type Temperament,
} from '../src/engine/spirit'
import {
  PSY_FOCUSES,
  PSY_FOCUS_LABEL,
  PSY_FOCUS_LINE,
  createWorld,
  hirePsychologist,
  psychologistFocusOpen,
  psychologistFocusRefusal,
  psychologistWeeklyCents,
  psychologistWorksThisWeek,
  resolvePsychologist,
  setPsychologistFocus,
  setPsychologistRung,
  sheIsNewsAt,
  toSnapshot,
  type ExposureEvent,
  type ExposureKind,
  type PsyFocus,
  type WorldState,
} from '../src/engine/world'
import { psychologistWorkingRung } from '../src/engine/world/psychologist'
import { resolveBodyAndPlanner } from '../src/engine/world/phaseHerWeek'
import { engineModuleFunction } from './worldSource'
import { ECONOMY } from '../src/engine/economy'
import { isBlackoutWeek } from '../src/engine/season/calendar'
import { schoolIsOver } from '../src/engine/kidLife'
import { birthdayTurning } from '../src/engine/world/age'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const SRC = fileURLToPath(new URL('../src/', import.meta.url))

const SPOT = ECONOMY.spotlight
const PSY = ECONOMY.psychologist
const RUNGS = [0, 1, 2] as const
const FULL = SPOT.habituationFullWeeks

/** The focus this whole file is about, written once. */
const FOCUS: PsyFocus = 'publicLife'

/** T4's girl, and inherited for T4's reason rather than for character: `'quiet'` is the steady·private
 *  corner, where every product the model makes lands on an EXACT TENTH (3 × 0.8 × 1.5 = 3.6,
 *  4 × 0.8 × 1.5 = 4.8). The pass rounds to tenths exactly once, so a girl whose products land
 *  mid-tenth would turn an exact claim into an approximate one – T3 measured that trap on the
 *  intensity axis and this file inherits the lesson rather than re-learning it. */
const GIRL: Temperament = 'quiet'

/** The deepest kind the wave has, used wherever a case wants the largest legible signal. */
const DEEP: ExposureKind = 'publicLoss'

const roundTenth = (x: number): number => Math.round(x * 10) / 10

/** Every `.ts`/`.vue` file under `src/`, as (relative path, source) – the whole-tree form the other
 *  wave-6 suites use, because «nothing prints it» is a claim about `src/` and a census scoped to
 *  `engine/` would be silent about a component that reached for a constant. */
function srcFiles(dir = SRC, prefix = ''): [string, string][] {
  const out: [string, string][] = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) out.push(...srcFiles(`${dir}${entry.name}/`, `${prefix}${entry.name}/`))
    else if (/\.(ts|vue)$/.test(entry.name)) out.push([prefix + entry.name, readFileSync(dir + entry.name, 'utf8')])
  }
  return out
}

/** Source with every comment removed – this file's subject is a module whose COMMENTS name
 *  `publicLifeShrink`, `publicLifeAccel` and `'publicLife'` in order to argue about them. */
function codeOnly(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

/** Does `week` fire NO row of the perturbation table for this girl? T3's helper, inherited through
 *  T4, so a case can pose exactly one fact and read exactly one delta. */
function quietWeek(base: WorldState, week: number): boolean {
  const schoolOver = schoolIsOver(week, base.profile.birthMonth)
  return (
    !isBlackoutWeek(week, schoolOver) && birthdayTurning(week, base.profile.birthMonth, base.profile.birthDay) === null
  )
}

/** A world parked at a QUIET week, at both baselines, wearing the temperament under test – built by
 *  `createWorld` and then MOVED, never hand-assembled, so the shapes are the engine's own. */
function probe(seed = 'spotlight-focus', temperament: Temperament = GIRL, week = 210): WorldState {
  const world = createWorld(seed)
  world.temperament = temperament
  let w = week
  while (!quietWeek(world, w) || !quietWeek(world, w + 1)) w++
  world.week = w
  world.spirit = ECONOMY.spirit.baseline
  world.bond = ECONOMY.bond.start
  return world
}

/** Make her news at every week from `at` back – two OLD Slam titles in the cabinet, the construction
 *  T3's §B, T4's §D and §F all use. ⚠ THE STAMPS ARE OLD ON PURPOSE: a fixture whose fame comes from
 *  the very week under test would measure the news gate instead of the thing being asked about
 *  (ruling E-bis's own warning). */
function makeNews(world: WorldState, at = world.week): WorldState {
  const slam = (world.trophiesByTier.slam ??= { titles: [], finals: [] })
  slam.titles.push(at - 40, at - 41)
  return world
}

/** The seat, hired and working – poked rather than walked, because the hire is wave 5's T2 subject and
 *  not this one's (wave5-psy-counsel's own `withSeat`, and its reason). `null` means a seat with no
 *  year chosen at all. */
function withSeat(world: WorldState, focus: PsyFocus | null, rung: 0 | 1 | 2 = 1): WorldState {
  world.psychologistHired = true
  world.psychologistRung = rung
  world.psychologistFocus = focus
  return world
}

/** `n` events of one kind – the list the caller hands down. */
function events(kind: ExposureKind, n = 1): ExposureEvent[] {
  return Array.from({ length: n }, () => ({ kind }))
}

/** ONE event's pressure for this file's girl BEFORE the focus – the four factors T4 shipped, computed
 *  from `ECONOMY` so a re-tune moves both sides of every expectation together (ruling N). This is the
 *  expression `publicLifeShrinkAt` multiplies, and with no seat it is the whole of it. */
function preT5Product(kind: ExposureKind, habituation = 0, temperament: Temperament = GIRL): number {
  return (
    Math.abs(SPOT.pressureBase[kind]) *
    ECONOMY.spirit.perturbationScale[temperamentIntensity(temperament)] *
    SPOT.opennessScale[temperamentOpenness(temperament)] *
    habituationScale(habituation)
  )
}

/** Where the pass leaves a baseline girl on a quiet week after ONE event of `kind` at this shrink –
 *  the whole arithmetic of the section below, with the pass's single `roundTenth` applied where the
 *  pass applies it (on the sum, never on the term). */
function spiritAfter(kind: ExposureKind, shrink: number, habituation = 0): number {
  return roundTenth(ECONOMY.spirit.baseline - preT5Product(kind, habituation) * shrink)
}

/** Run the weekly spirit pass the way the PHASE runs it – the billing predicate read off the world by
 *  the engine's own predicate, never a hand-passed `true`. ⚠ THAT IS NOT A DETAIL: a case that passed
 *  `true` by hand would make every stand-down pin below vacuous, which is exactly the shape ruling J
 *  spent a wave correcting one focus over. */
function passOn(world: WorldState, exposure: readonly ExposureEvent[]): WorldState {
  accrueSpirit(world, psychologistWorksThisWeek(world), exposure)
  return world
}

/** ...and the growth the same way. */
function growOn(world: WorldState, isNews: boolean): WorldState {
  growHabituation(world, isNews, psychologistWorksThisWeek(world))
  return world
}

// =================================================================================================
// A. THE TWO LADDERS – both §4 proposals, both unruled, pinned for MEANING rather than size
// =================================================================================================
describe('wave 6 T5 A – the seat`s two new ladders, and the shape each has to keep', () => {
  it('⭐⭐ one entry per rung, on both ladders – the roster and the price list cannot disagree', () => {
    // ⚠ THE ROSTER IS `rungs` AND NOT A LITERAL 3: the dial and the price list are the same three
    // people, and a ladder with a missing rung would hand `undefined` to a multiplier. The `??`
    // fallbacks in `publicLifeShrinkAt` / `publicLifeAccelAt` exist for hand-built probe worlds, not
    // as cover for a short table.
    expect(PSY.publicLifeShrink.length, 'a shrink per rung').toBe(PSY.rungs.length)
    expect(PSY.publicLifeAccel.length, 'and an acceleration per rung').toBe(PSY.rungs.length)
  })

  it('⭐⭐⭐ the shrink is a SHRINK and never a shield – strictly between 0 and 1 at every rung', () => {
    // ⚠⚠ THE SHAPE CLAIM AND NOT THE NUMBERS (ruling N). Above 1 the seat would make the cameras cost
    // her MORE; at 0 the whole spotlight would switch off for anyone who can afford a retainer, which
    // is the shape who-she-is §3c forbids in its own words one block over about habituation («a SHRUG
    // and not an immunity»). The three values are §4 proposals the owner has not ruled, so what is
    // pinned is the interval they have to live in.
    for (const rung of RUNGS) {
      expect(PSY.publicLifeShrink[rung], `rung ${rung}: the cameras still cost her something`).toBeGreaterThan(0)
      expect(PSY.publicLifeShrink[rung], `rung ${rung}: ...and the year really does take some of it`).toBeLessThan(1)
    }
  })

  it('⭐⭐⭐ the acceleration is an ACCELERATION and never a brake – at least 1 at every rung', () => {
    // `wallsHerselfRepair`'s own law on the seat next door, and §0.3's: the counter grows at `+1` a
    // week with nobody hired, and this multiplies a walk that was already happening. Below 1 the seat
    // would SLOW her own acclimatising, which is the defect `wallsHazardScale` names in the other
    // direction («the seat accelerates her own work and never her collapse»).
    for (const rung of RUNGS) {
      expect(PSY.publicLifeAccel[rung], `rung ${rung}: never slower than paying nobody`).toBeGreaterThanOrEqual(1)
    }
  })

  it('⭐⭐⭐ both ladders are STRICTLY MONOTONE in rung – the masseur §4 law, in the constants', () => {
    // «Each rung measurably better than the one below AT THE CHOSEN FOCUS, or it is re-priced.» The
    // BENCH is T9's and measures the realised effect; this is the same law asserted where it is
    // cheapest, so a re-tune that flattens a step goes red before a bench run is spent on it.
    for (const rung of [1, 2] as const) {
      expect(PSY.publicLifeShrink[rung], `rung ${rung} shrinks the cameras more than rung ${rung - 1}`)
        .toBeLessThan(PSY.publicLifeShrink[rung - 1])
      expect(PSY.publicLifeAccel[rung], `rung ${rung} acclimatises her faster than rung ${rung - 1}`)
        .toBeGreaterThan(PSY.publicLifeAccel[rung - 1])
    }
  })

  it('⚠ the seat and the veteran TOGETHER still leave a cost standing – the two floors multiply', () => {
    // ⚠⚠ THE ONE CASE NEITHER CONSTANT CAN MAKE ALONE, and ruling N is why it is here: habituation
    // multiplies DOWN to `habituationFloor` and this ladder multiplies DOWN again, so the deepest
    // event the wave has, for the cheapest girl, at the top rung, at a full career of fame, is where
    // the mechanic comes closest to switching itself off. It must still be a cost.
    const cheapest = preT5Product(DEEP, FULL, 'sunny') * PSY.publicLifeShrink[2]
    expect(cheapest, 'a habituated, focus-held, calm open girl still pays something').toBeGreaterThan(0)
  })
})

// =================================================================================================
// B. THE ROSTER – the fifth focus is OFFERED, and its line reads in BOTH frames
// =================================================================================================
//
// ⚠⚠ RULING O's GROUND. The membership oracle itself lives in tests/wave5-psychologist-focus.test.ts
// §A, where wave 5 left the tripwire and where T5 re-aimed it – one claim, one home. What this
// section asks is the half a roster array cannot answer: does the ENGINE actually offer it, and does
// the sentence it brings survive the two frames the owner's Q9 ruling put it in.
describe('wave 6 T5 B – the fifth focus is really on the card, and its sentence works twice', () => {
  it('⭐⭐⭐ the engine OFFERS it – open at every rung, and a pick is accepted', () => {
    // ⚠ ASKED THROUGH `psychologistFocusOpen` AND `setPsychologistFocus`, never through
    // `PSY_FOCUSES.includes` – the array is the thing ruling O says the compiler does not defend, so
    // a case that read it would be asking the suspect for an alibi. O2's «the rung scales quality,
    // never unlocks menu items» is the other half of this claim and is why the sweep is per rung.
    for (const rung of RUNGS) {
      const world = createWorld(`t5-offered-${rung}`, DEFAULT_PROFILE)
      world.bestFinishByTier.w15 = 0
      world.week = 250
      hirePsychologist(world, true)
      setPsychologistRung(world, rung)
      expect(psychologistFocusOpen(world), `rung ${rung}: the year is on offer`).toContain(FOCUS)
      expect(psychologistFocusRefusal(world, FOCUS), `rung ${rung}: and nothing refuses it`).toBeNull()
      setPsychologistFocus(world, FOCUS)
      expect(world.psychologistFocus, `rung ${rung}: the pick lands`).toBe(FOCUS)
    }
  })

  it('⭐⭐ it reaches the WIRE as the chosen year and as an open option – the card reads the snapshot', () => {
    // The fog law's own shape: the screen is told WHICH years are live and WHAT is running, never why.
    // A focus that existed in the engine and never reached the snapshot would be offered by an array
    // and invisible on the card – ruling O's failure one layer out.
    const world = createWorld('t5-wire', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    world.week = 250
    hirePsychologist(world, true)
    setPsychologistFocus(world, FOCUS)
    const snap = toSnapshot(world)
    expect(snap.psychologistFocus, 'the running year crosses').toBe(FOCUS)
    expect(toSnapshot(createWorldOpen()).psychologistFocusOpen, 'and it is on the open list before a pick')
      .toContain(FOCUS)
  })

  it('⭐⭐⭐ EVERY line reads in BOTH frames – alone, and spliced after «On retainer – »', () => {
    // ⚠⚠ THE OWNER'S Q9 RULING (14.09) MADE MECHANICAL. `SupportStaffTab.vue` composes the hired
    // card's line as «On retainer – » + the focus's sentence with its first letter LOWERED, and that
    // surface is on screen all 52 weeks against the note's ~3. So a line has to be a sentence alone
    // AND a clause after a dash. What a test can hold is the structural half, and it is total over
    // the roster rather than aimed at the new row – a sixth focus inherits the pin.
    for (const focus of PSY_FOCUSES) {
      const line = PSY_FOCUS_LINE[focus]
      // Frame 1, alone: a real sentence, opening on a capital and closing on a full stop.
      expect(line.charAt(0), `${focus}: opens on a capital, so it reads alone`).toBe(line.charAt(0).toUpperCase())
      expect(line.charAt(0), `${focus}: ...and that capital is a LETTER, not a digit or a quote mark`)
        .not.toBe(line.charAt(0).toLowerCase())
      expect(line.endsWith('.'), `${focus}: ends where a sentence ends`).toBe(true)
      // Frame 2, spliced: the lowering changes exactly the first character and nothing else, and the
      // composed sentence still reads as one – no stray capital, no doubled dash, no doubled space.
      const spliced = `On retainer – ${line.charAt(0).toLowerCase()}${line.slice(1)}`
      expect(spliced, `${focus}: the splice composes`).toContain(line.slice(1))
      expect(spliced, `${focus}: no doubled space survives the join`).not.toMatch(/ {2}/)
      expect(spliced, `${focus}: and the retainer's own dash is not doubled`).not.toContain('– –')
    }
  })

  it('⚠ the label is a name and the line is a sentence – and neither is the other', () => {
    // The catalogue's two columns do different jobs: the LABEL is a radio button's name (short, no
    // full stop) and the LINE is the note under the row. A draft that put the sentence in both would
    // pass every string sweep in the tree. ⚠ TOTAL OVER THE ROSTER for ruling O's reason.
    for (const focus of PSY_FOCUSES) {
      expect(PSY_FOCUS_LABEL[focus].endsWith('.'), `${focus}: a button name, not a sentence`).toBe(false)
      expect(PSY_FOCUS_LABEL[focus], `${focus}: ...and short enough for a pill`).toHaveLength(
        PSY_FOCUS_LABEL[focus].length,
      )
      expect(PSY_FOCUS_LABEL[focus].length, `${focus}: a name, not a paragraph`).toBeLessThan(40)
      expect(PSY_FOCUS_LINE[focus], `${focus}: the two columns are not the same string`)
        .not.toBe(PSY_FOCUS_LABEL[focus])
    }
  })
})

/** A hired pro with no year chosen yet – §B's wire case needs one on each side of the pick. */
function createWorldOpen(): WorldState {
  const world = createWorld('t5-wire-open', DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  world.week = 250
  hirePsychologist(world, true)
  return world
}

// =================================================================================================
// C. ⭐⭐⭐ ONE QUESTION, ONE ANSWER – the re-spelling pinned EQUAL to the engine's own function
// =================================================================================================
//
// ⚠⚠ THE CORRECTION THIS SECTION EXISTS FOR. The T5 brief says both effects «ride
// `psychologistWorkingRung(world, 'publicLife')` (`psychologist.ts:242`)». They cannot: both effects
// live in `engine/spirit.ts`, and ruling J MEASURED that an import of `world/psychologist.ts` from
// that file closes a real value cycle by two live back-edges – `world/psychologist.ts` says so in its
// own words on that very function. So the billing predicate is handed down (the §0.1 inversion the
// pass already uses twice) and the focus and the rung are read off the world, which is ruling J's own
// closing sentence. What that costs is a second spelling of one question, and what it buys back is
// this: the two spellings are asked the SAME question over the whole grid, through the shipped
// readers, so they can never quietly give the family two answers.
describe('wave 6 T5 C – the seat`s year, asked twice, answering once', () => {
  it('⭐⭐⭐ over the whole grid the SHIPPED shrink equals `publicLifeWorkingRung``s own answer', () => {
    // Three rungs × every focus on the roster × hired and not: for each cell the pass is run and the
    // realised spirit is compared against `publicLifeShrinkAt(psychologistWorkingRung(world, FOCUS))`
    // – the ENGINE's function, never the re-spelling under test. A divergence anywhere is a divergence
    // the family would feel and nobody would see.
    for (const rung of RUNGS) {
      for (const focus of [null, ...PSY_FOCUSES]) {
        for (const hired of [false, true]) {
          const world = withSeat(probe(`t5-grid-${rung}-${focus}-${hired}`), focus, rung)
          world.psychologistHired = hired
          const oracle = publicLifeShrinkAt(psychologistWorkingRung(world, FOCUS))
          passOn(world, events(DEEP))
          expect(world.spirit, `rung ${rung} / ${focus} / hired ${hired}`).toBe(spiritAfter(DEEP, oracle))
        }
      }
    }
  })

  it('⭐⭐⭐ ...and so does the SHIPPED acceleration, over the same grid', () => {
    for (const rung of RUNGS) {
      for (const focus of [null, ...PSY_FOCUSES]) {
        for (const hired of [false, true]) {
          const world = withSeat(makeNews(probe(`t5-grid-h-${rung}-${focus}-${hired}`)), focus, rung)
          world.psychologistHired = hired
          const oracle = publicLifeAccelAt(psychologistWorkingRung(world, FOCUS))
          growOn(world, true)
          expect(world.spotlightHabituation, `rung ${rung} / ${focus} / hired ${hired}`)
            .toBe(roundTenth(Math.min(oracle, FULL)))
        }
      }
    }
  })

  it('⚠ the grid is not vacuous – the oracle really returns all three rungs AND `undefined`', () => {
    // ⚠⚠ THE CASE THAT STOPS THE TWO ABOVE BEING AN IDENTITY BETWEEN TWO CONSTANTS. If
    // `psychologistWorkingRung` answered `undefined` in every cell, both sweeps would pass on a
    // shipped reader that had switched the focus off entirely.
    const seen = new Set<string>()
    for (const rung of RUNGS) {
      for (const focus of [null, ...PSY_FOCUSES]) {
        const world = withSeat(probe(`t5-oracle-${rung}-${focus}`), focus, rung)
        seen.add(String(psychologistWorkingRung(world, FOCUS)))
      }
    }
    expect([...seen].sort(), 'the grid really visits every rung and the off state')
      .toEqual(['0', '1', '2', 'undefined'])
  })
})

// =================================================================================================
// D. ⭐⭐⭐ THE PRESSURE SHRINKS – by rung, while HELD, and never while the seat is stood down
// =================================================================================================
describe('wave 6 T5 D – what a year on her public life takes off the cameras', () => {
  it('⭐⭐⭐ MONOTONE IN RUNG – the same week costs her strictly less at every step up', () => {
    // ⚠ THE FIXTURE CHECK FIRST (T4's lesson): the pass rounds to tenths once, so a re-tune could
    // land two rungs on the same tenth and this case would then pass on a flattened ladder.
    const expected = RUNGS.map((r) => spiritAfter(DEEP, PSY.publicLifeShrink[r]))
    const noSeat = spiritAfter(DEEP, 1)
    expect(new Set([noSeat, ...expected]).size, '⚠ the four arms are distinguishable after rounding').toBe(4)

    let previous = noSeat
    for (const rung of RUNGS) {
      const world = withSeat(probe(`t5-monotone-${rung}`), FOCUS, rung)
      expect(psychologistWorkingRung(world, FOCUS), `rung ${rung}: the seat really is working it`).toBe(rung)
      passOn(world, events(DEEP))
      expect(world.spirit, `rung ${rung}: the exact shrink`).toBe(expected[rung])
      expect(world.spirit, `rung ${rung} leaves her better off than the rung below`).toBeGreaterThan(previous)
      previous = world.spirit
    }
  })

  it('⭐⭐⭐ HELD or not – with nobody on this year the week costs exactly what it cost before T5', () => {
    // ⚠⚠ THE IDENTITY CLAIM, and it is the twin of ruling Q part 3's for habituation: with no seat the
    // factor is EXACTLY `1`, so a career that never buys this year plays exactly the tennis it played
    // before T5 existed. `toBe` and not `toBeCloseTo` – `publicLifeShrinkAt(undefined)` returns the
    // literal, so there is no float tail to forgive.
    const bare = passOn(probe('t5-held-none'), events(DEEP))
    expect(bare.spirit, 'no seat, no shrink').toBe(spiritAfter(DEEP, 1))
    const held = withSeat(probe('t5-held-yes'), FOCUS, 2)
    passOn(held, events(DEEP))
    expect(held.spirit, 'and the year really does change it').toBeGreaterThan(bare.spirit)
  })

  it('⭐⭐⭐ a seat holding ANY OTHER year changes nothing at all – the focuses do not stack', () => {
    // The spec's own «focus effects never stack – one focus per year is the whole point», seen from
    // the side that could break silently: a rung read that forgot to check the FOCUS would hand every
    // paying family the shrink. ⚠ SWEPT OVER THE WHOLE ROSTER so a sixth focus cannot inherit it, and
    // ⚠ the fixture carries no live shock, so `'recovery'`'s own term cannot move the arm instead.
    const bare = passOn(probe('t5-stack-none'), events(DEEP)).spirit
    for (const other of PSY_FOCUSES.filter((f) => f !== FOCUS)) {
      const world = withSeat(probe(`t5-stack-${other}`), other, 2)
      expect(world.spiritShock ?? null, `${other}: the fixture carries no shock`).toBeNull()
      expect(psychologistWorkingRung(world, FOCUS), `${other}: he is not working HER PUBLIC LIFE`).toBeUndefined()
      passOn(world, events(DEEP))
      expect(world.spirit, `${other}: a different year buys nothing here`).toBe(bare)
    }
  })

  it('⭐⭐ THE STAND-DOWN COMES FREE – a booked family week pays nothing and receives nothing', () => {
    // ⚠⚠ RULING J's OWN DEFECT, PRE-BOOKED ON A NEW FOCUS. Its correction one wave ago was that the
    // seat's effects must ride the BILLING predicate: on a week `resolvePsychologist` charges nothing
    // for, the work does not happen either. A `psychologistHired` read here would take the shrink on a
    // family-holiday week the invoice skipped – «pay nothing, receive the work», the travelling-team
    // §4 legibility law read backwards.
    //
    // ⚠⚠ A TWIN AND NOT AN ABSOLUTE, WHICH IS A MEASUREMENT THIS CASE'S FIRST DRAFT PAID FOR: a
    // BOOKED FAMILY WEEK IS ITSELF A PERTURBATION ROW (`+5 × 0.8 = +4` for a steady girl, measured
    // here as 69.2 against a quiet week's 65.2). So the arm cannot be compared against a quiet-week
    // constant – it is compared against a twin standing on the same holiday with nobody on the
    // payroll, and the holiday's own lift lands identically on both.
    const world = withSeat(probe('t5-standdown'), FOCUS, 2)
    const bare = probe('t5-standdown')
    for (const w of [world, bare]) {
      w.vacations = [...w.vacations, { week: w.week, packageId: 'coast', paidCents: 0 }]
    }
    expect(world.psychologistHired, 'the seat IS hired and the year IS held').toBe(true)
    expect(psychologistWorksThisWeek(world), '...and the fixture really is stood down').toBe(false)
    expect(psychologistWorkingRung(world, FOCUS), '...so the engine says he is not working it').toBeUndefined()
    passOn(world, events(DEEP))
    passOn(bare, events(DEEP))
    expect(world.spirit, 'the week costs her exactly what a seatless week on the same holiday costs')
      .toBe(bare.spirit)
  })

  it('⚠ and the shrink rides EVERY kind, not the deep one only – it is a factor, not a special case', () => {
    // The factor multiplies the product, so it is kind-independent by construction; asserting it over
    // the five says so once rather than leaving a reader to infer it from one.
    for (const kind of Object.keys(SPOT.pressureBase) as ExposureKind[]) {
      const world = withSeat(probe(`t5-kinds-${kind}`), FOCUS, 1)
      passOn(world, events(kind))
      expect(world.spirit, `${kind}: shrunk by the same rung`).toBe(spiritAfter(kind, PSY.publicLifeShrink[1]))
    }
  })
})

// =================================================================================================
// E. ⭐⭐⭐ HABITUATION ACCELERATES – by rung, while HELD, and never past the walls or the cap
// =================================================================================================
describe('wave 6 T5 E – what a year on her public life does to the weeks she lives known', () => {
  it('⭐⭐⭐ MONOTONE IN RUNG – one known week counts strictly more at every step up', () => {
    const expected = RUNGS.map((r) => roundTenth(Math.min(PSY.publicLifeAccel[r], FULL)))
    expect(new Set([1, ...expected]).size, '⚠ the four arms are distinguishable').toBe(4)

    let previous = 1
    for (const rung of RUNGS) {
      const world = withSeat(makeNews(probe(`t5-hab-monotone-${rung}`)), FOCUS, rung)
      expect(psychologistWorkingRung(world, FOCUS), `rung ${rung}: the seat really is working it`).toBe(rung)
      expect(sheIsNewsAt(world, world.week), `rung ${rung}: and she really is news`).toBe(true)
      growOn(world, true)
      expect(world.spotlightHabituation, `rung ${rung}: the exact acceleration`).toBe(expected[rung])
      expect(world.spotlightHabituation, `rung ${rung} counts more than the rung below`).toBeGreaterThan(previous)
      previous = world.spotlightHabituation
    }
  })

  it('⭐⭐⭐ HELD or not – with nobody on this year the week counts exactly the `+1` T4 shipped', () => {
    const bare = growOn(makeNews(probe('t5-hab-none')), true)
    expect(bare.spotlightHabituation, 'no seat, no acceleration').toBe(1)
    const held = growOn(withSeat(makeNews(probe('t5-hab-yes')), FOCUS, 2), true)
    expect(held.spotlightHabituation, 'and the year really does shorten the walk').toBeGreaterThan(1)
  })

  it('⭐⭐⭐ ⚠⚠ WALLS BEAT THE ACCELERATOR – a walled girl holding this year grows exactly NOTHING', () => {
    // ⚠⚠ THE COMPOSITION THE TASK NAMES BY NAME, and the place a builder reaches for `Math.max`.
    // Ruling H freezes the counter on EITHER flipped axis; this focus multiplies the weekly step. The
    // two meet on one girl, and `×0` has to win: «a walled-up girl is not acclimatising, whichever
    // wall it is», and a seat cannot buy her out of that. It is structural rather than arithmetic –
    // the growth returns BEFORE the multiplier is read – and this case is what says so.
    for (const axis of ['open', 'reg'] as const) {
      const world = withSeat(makeNews(probe(`t5-walls-${axis}`)), FOCUS, 2)
      world.wallsFlipped = { ...world.wallsFlipped, [axis]: true }
      expect(psychologistWorkingRung(world, FOCUS), `${axis}: the seat IS working it, at the top rung`).toBe(2)
      expect(sheIsNewsAt(world, world.week), `${axis}: and she IS news`).toBe(true)
      growOn(world, true)
      expect(world.spotlightHabituation, `${axis}: behind walls the year buys her nothing`).toBe(0)
    }
  })

  it('⭐⭐⭐ ...and so does the news gate – the focus held over an unknown girl counts nothing', () => {
    // ⚠ ITS OWN CASE AND NOT A SECOND FIXTURE UNDER THE ONE ABOVE: the two gates are separate early
    // returns, and a mutation that moved the multiplier above only ONE of them must redden a case of
    // its own rather than hide behind the other's assertion failing first.
    const world = withSeat(probe('t5-hab-unknown'), FOCUS, 2)
    expect(sheIsNewsAt(world, world.week), 'the fixture really is unknown').toBe(false)
    expect(psychologistWorkingRung(world, FOCUS), '...and the seat really is working the year').toBe(2)
    growOn(world, false)
    expect(world.spotlightHabituation, 'there is no spotlight for a year of work to shorten').toBe(0)
  })

  it('⭐⭐ THE CAP IS UNMOVED – a faster walk arrives at the same ceiling and never passes it', () => {
    // `habituationFullWeeks` is both the clamp and `habituationScale`'s denominator, so a counter
    // driven past it would drive the scale below its floor and, far enough, through zero into a
    // spotlight that PAYS her. The acceleration is exactly the kind of thing that could do it.
    const veteran = withSeat(makeNews(probe('t5-cap')), FOCUS, 2)
    for (let i = 0; i < FULL * 2; i++) growOn(veteran, true)
    expect(veteran.spotlightHabituation, 'the counter stops at the span').toBe(FULL)
    expect(habituationScale(veteran.spotlightHabituation), '...and the scale rests exactly on the floor')
      .toBe(SPOT.habituationFloor)
  })

  it('⭐⭐ THE STAND-DOWN COMES FREE HERE TOO – a booked family week counts the plain `+1`', () => {
    // Ruling J on the second effect: the acceleration stands down with the invoice, and what is left
    // is the week she lived known, which she lived whether or not anybody was paid for it.
    const world = withSeat(makeNews(probe('t5-hab-standdown')), FOCUS, 2)
    world.vacations = [...world.vacations, { week: world.week, packageId: 'coast', paidCents: 0 }]
    expect(psychologistWorksThisWeek(world), 'the fixture really is stood down').toBe(false)
    growOn(world, true)
    expect(world.spotlightHabituation, 'she still lived the week, and nobody was paid to shorten it').toBe(1)
  })
})

// =================================================================================================
// F. ⚠⚠ THROUGH THE REAL PHASE – both effects, in the statements that ship
// =================================================================================================
//
// ⚠ EVERY CASE HERE RUNS `resolveBodyAndPlanner`, the function that HOLDS both call sites, and not a
// hand-spelled composition. T4 measured what that is worth: its first off-by-one draft re-spelled the
// call site and stayed green through the very mutation it existed to catch.
describe('wave 6 T5 F – the phase applies both halves of the year', () => {
  it('⭐⭐⭐ the PHASE shrinks the week`s pressure – twins that differ by the focus and nothing else', () => {
    // ⚠ TWINS RATHER THAN AN ABSOLUTE, so anything else the phase does lands identically on both arms
    // and the only difference readable here is the one the case is about. The exposure is DERIVED by
    // the phase, not handed in: a big-stage title stamped in the week that has CLOSED, which is the
    // horizon ruling P gave the whole wave.
    const held = withSeat(makeNews(probe('t5-phase-pressure')), FOCUS, 2)
    const other = withSeat(makeNews(probe('t5-phase-pressure')), 'coolhead', 2)
    for (const w of [held, other]) {
      const slam = (w.trophiesByTier.slam ??= { titles: [], finals: [] })
      slam.titles.push(w.week - 1)
    }
    expect(sheIsNewsAt(held, held.week - 1), '⚠ the fixture is news at the week that closed').toBe(true)
    expect(psychologistWorkingRung(held, FOCUS), 'the held arm really is working this year').toBe(2)
    expect(psychologistWorkingRung(other, FOCUS), '...and the control arm really is not').toBeUndefined()

    resolveBodyAndPlanner(held)
    resolveBodyAndPlanner(other)
    expect(other.spirit, 'the control took the unshrunk cost').toBe(spiritAfter('stage', 1))
    expect(held.spirit, 'and the year on her public life took some of it off')
      .toBe(spiritAfter('stage', PSY.publicLifeShrink[2]))
  })

  it('⭐⭐⭐ the PHASE accelerates the counter – on the same twins, in the same tick', () => {
    // ⚠⚠ AND IT IS THE SAME PHASE CALL, which is the half that matters: the shrink is read INSIDE
    // `accrueSpirit` and the acceleration one statement later inside `growHabituation`, on the same
    // world, through the same billing predicate. A phase that had wired one and not the other would
    // pass every case in §D and §E.
    const held = withSeat(makeNews(probe('t5-phase-habit')), FOCUS, 2)
    const other = withSeat(makeNews(probe('t5-phase-habit')), 'coolhead', 2)
    expect(sheIsNewsAt(held, held.week - 1), '⚠ the fixture is news at the week that closed').toBe(true)
    resolveBodyAndPlanner(held)
    resolveBodyAndPlanner(other)
    expect(other.spotlightHabituation, 'the control counted the plain week').toBe(1)
    expect(held.spotlightHabituation, 'and the year on her public life counted it faster')
      .toBe(roundTenth(Math.min(PSY.publicLifeAccel[2], FULL)))
  })
})

// =================================================================================================
// G. ⚠⚠ THE NEVER-FIRED CORRIDOR – weeks paid for that buy nothing, and that is BY DESIGN
// =================================================================================================
//
// The wave brief: «weeks paid with the focus held while she is NOT news (or habituation already full)
// are his idle weeks – T9 prints them, the academy-fares watch's law». So the corridor is pinned here
// rather than left as an absence, and it is pinned as a DESIGN and not as a defect: the family really
// can pay a retainer all season and receive nothing, exactly as a family can buy a masseur for a girl
// who never gets hurt.
describe('wave 6 T5 G – the idle weeks, named so nobody reads them as a bug', () => {
  it('⚠⚠ AN UNKNOWN GIRL: the money leaves, the year is held, and NOTHING happens', () => {
    // ⚠ THE MONEY IS HALF THE CLAIM. A corridor case that only asserted «nothing happened» would be
    // green on a seat that was never hired; the retainer really being charged is what makes it a
    // corridor rather than an absence.
    //
    // ⚠ THE ROW AND NOT THE BALANCE, and the BILLING PHASE AND NOT THE EFFECTS' ONE – both learned
    // by measuring rather than assumed, and both worth the sentences. (a) `resolveBodyAndPlanner`
    // moves money in more than one direction, so a net funds delta is not the retainer (measured:
    // −6 761, which is the physio row, against a −40 000 salary). (b) ⚠⚠ THE SEAT IS BILLED IN A
    // DIFFERENT PHASE FROM THE ONE ITS YEAR WORKS IN: `resolvePsychologist` is called from
    // `playHerWeek` (tick step 6) while both of T5's effects land in `resolveBodyAndPlanner` (step 4).
    // The two are kept in step by ONE predicate – `psychologistWorksThisWeek`, asked in both places –
    // which is exactly why ruling J made that predicate the thing the effects ride.
    const idle = withSeat(probe('t5-idle'), FOCUS, 2)
    const control = withSeat(probe('t5-idle'), 'coolhead', 2)
    expect(sheIsNewsAt(idle, idle.week - 1), 'she is nobody`s news').toBe(false)
    resolveBodyAndPlanner(idle)
    resolveBodyAndPlanner(control)
    resolvePsychologist(idle)
    const salary = idle.events.filter((e) => e.week === idle.week && e.category === 'staff' && (e.amountCents ?? 0) < 0)
    expect(salary.map((e) => e.amountCents), 'the retainer was charged in full, on its own row')
      .toContain(-psychologistWeeklyCents(idle))
    expect(idle.spirit, 'and the week went exactly as it would have without the year').toBe(control.spirit)
    expect(idle.spotlightHabituation, '...and nothing was learned about living known').toBe(0)
  })

  it('⚠ HABITUATION ALREADY FULL: the acceleration buys nothing, and the SHRINK still works', () => {
    // ⚠⚠ THE CORRIDOR IS PER-EFFECT AND NOT PER-WEEK, which is the half a one-line summary loses. A
    // veteran at the cap gets nothing more from the accelerator – there is nothing left to accelerate
    // – while the same week's pressure is still shrunk by the same rung. The idle-week count T9 prints
    // therefore cannot be a single number per week.
    const veteran = withSeat(makeNews(probe('t5-full')), FOCUS, 2)
    veteran.spotlightHabituation = FULL
    growOn(veteran, true)
    expect(veteran.spotlightHabituation, 'there is nothing left to learn').toBe(FULL)
    passOn(veteran, events(DEEP))
    expect(veteran.spirit, 'and the cameras are still cheaper for the year being held')
      .toBe(spiritAfter(DEEP, PSY.publicLifeShrink[2], FULL))
  })
})

// =================================================================================================
// H. §8 – ZERO NEW CONSENT CODE, ZERO DRAWS, ZERO SURFACE
// =================================================================================================
//
// «The year-focus machinery is wave 5's and does not move: free pick at hire, changes in the true
// off-season only, once a season, the 18+ joint choice and the not-ready card all apply to this focus
// exactly as to the other four – ZERO NEW CONSENT CODE.» Said as a claim rather than as an absence:
// the fifth focus must be answered by the SAME sentence a non-`herself` focus is answered by, in every
// state the gates can be in.
describe('wave 6 T5 H – what T5 deliberately does not do', () => {
  it('⭐⭐⭐ ZERO NEW CONSENT CODE – the fifth year answers exactly as `coolhead` does, in every state', () => {
    // ⚠⚠ THE STRONGEST FORM OF «no new consent code»: not «no new branch was written» (a grep) but
    // «the gates cannot tell this focus from an ordinary one» (a behaviour). Swept over the two things
    // the gates actually read – the bond BAND and the age – on both sides of the off-season window and
    // with and without a year already running.
    const bands = [ECONOMY.bond.band.close, ECONOMY.bond.band.steady, ECONOMY.bond.band.strained, 10]
    for (const week of [250, 250 + 50]) {
      for (const bond of bands) {
        for (const running of [null, 'listen' as const]) {
          for (const hired of [false, true]) {
            const world = createWorld(`t5-consent-${week}-${bond}-${running}-${hired}`, DEFAULT_PROFILE)
            world.bestFinishByTier.w15 = 0
            world.week = week
            world.psychologistHired = hired
            world.psychologistFocus = running
            world.bond = bond
            const label = `week ${week} bond ${bond} running ${running} hired ${hired}`
            expect(psychologistFocusRefusal(world, FOCUS), label)
              .toBe(psychologistFocusRefusal(world, 'coolhead'))
          }
        }
      }
    }
  })

  it('⚠ the sweep is not vacuous – those states really do produce a refusal AND an open answer', () => {
    // Without this, the case above would pass on gates that refused (or allowed) everything.
    const world = createWorld('t5-consent-control', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    world.week = 250
    expect(psychologistFocusRefusal(world, FOCUS), 'unhired refuses').not.toBeNull()
    hirePsychologist(world, true)
    expect(psychologistFocusRefusal(world, FOCUS), '...and hired, with no year running, allows').toBeNull()
  })

  it('⚠⚠ THE READINESS GATE STAYS `herself`s ALONE – no second per-option gate was written', () => {
    // The one focus-specific branch in the consent code names exactly one focus id. A reader that
    // deleted the comments would still see that `'herself'` is the only member the gate mentions.
    const refusal = codeOnly(engineModuleFunction('world', 'psychologistFocusRefusal'))
    const named = PSY_FOCUSES.filter((f) => refusal.includes(`'${f}'`))
    expect(named, 'one focus id in the whole gate, and it is the one she has to want').toEqual(['herself'])
  })

  it('⚠ ZERO DRAWS – neither effect derives a stream, and MAIN is where it was', () => {
    const world = withSeat(makeNews(probe('t5-draws')), FOCUS, 2)
    const before = JSON.stringify(world.rngMain)
    rngKeys.length = 0
    passOn(world, events(DEEP))
    growOn(world, true)
    expect(rngKeys, 'arithmetic over a list, and four reads').toEqual([])
    expect(JSON.stringify(world.rngMain), 'and MAIN is untouched').toBe(before)
  })

  it('⚠⚠ NO SURFACE – nothing outside `src/engine` names either ladder or either reader', () => {
    // ⚠ THE FOG LAW (§8: «no publicity meter, no habituation surface»). The fifth focus's LABEL and
    // LINE are on screen – that is the whole of what a player may see – and the two multipliers and
    // the two functions that read them are engine-only. A whole-tree census, comments stripped, so
    // the claim cannot be repaired by deleting a sentence.
    const names = ['publicLifeShrink', 'publicLifeAccel', 'publicLifeShrinkAt', 'publicLifeAccelAt']
    const reaching = srcFiles()
      .filter(([path]) => !path.startsWith('engine/'))
      .filter(([, source]) => names.some((n) => codeOnly(source).includes(n)))
      .map(([path]) => path)
    expect(reaching, 'no component, no viz, no snapshot field, no store').toEqual([])
  })

  it('⚠ NO SCHEMA MOVE – the fifth focus is a string in a field that already existed', () => {
    // §8: «no schema change (the focus is a string in an existing field)». `psychologistFocus` is
    // wave 5's, the migration that back-fills it is v76's, and T5 adds no key to `WorldState`.
    const world = createWorld('t5-schema', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    world.week = 250
    const before = Object.keys(world).sort()
    hirePsychologist(world, true)
    setPsychologistFocus(world, FOCUS)
    expect(Object.keys(world).sort(), 'the pick writes into fields that were already there')
      .toEqual(before)
  })
})
