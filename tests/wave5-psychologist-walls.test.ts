// =================================================================================================
// WAVE 5, T7 – HER WALLS: THE WEEKLY LEANING PASS, THE FLIP HAZARD, AND THE TWO HALVES OF RULING N
// =================================================================================================
//
// `docs/plans/life-wave-5-builder-2026-09.md` §2 T7; the model is `docs/specs/who-she-is-2026-09.md`
// §2a verbatim (identity IMMUTABLE · repair free, growth work · mechanics read expression, voices
// read birth) with the architect's rulings N (the SIGN and the one armable direction), F (a flip
// never bites its own week) and P (the pass is a SIBLING of `accrueSpirit`, not a block inside it).
//
// ⚠⚠ THE RE-POINTS ARE NOT IN THIS FILE. `expressedTemperamentOf`'s five call sites are ruling A's
// and they are pinned where the zero-diff proof lives – tests/wave5-psychologist-schema.test.ts §F,
// re-aimed by this task to count ruling A's 3/2 split per spelling. This file is about the two
// numbers and the one hazard.
//
// ⚠⚠ AND NO SURFACE SHOWS ANY OF IT, WHICH IS WHY THERE IS NO STRING, NO SNAPSHOT AND NO COMPONENT
// CASE BELOW. T7 ships no copy at all: no leaning on any screen, no flip line, no announcement. The
// existing surfaces – the face, the Mood word, the diary's bands, the feed's silence – ARE the
// telegraph, and the album reads the arc later. §H pins the absence so nobody adds one by accident.
//
//   §A  THE SIGN AND THE THREE DRIFT ROWS – ruling N's table, per birth, including the one that says
//       a positive lean is EATEN by a kick (the owner's 09.09 bidirectional re-cut).
//   §B  ⭐⭐⭐ THE ONE-ARMABLE-DIRECTION PAIR – the two halves of ruling N most likely to be built
//       wrong: a born-private girl's negative lean arms NOTHING however deep it goes, and a born-open
//       girl can never go positive.
//   §C  ⭐⭐⭐ THE ANTI-«HUGGED INTO AN EXTRAVERT» DAM – a hard invariant, not a corridor.
//   §D  HYSTERESIS AS STATE – the dead zone, the flip that does not reset the lean, the un-flip.
//   §E  ⭐⭐⭐ THE ZERO-DRAW PROOF – the count-keys net AND ruling L's value check (as AMENDED: the
//       expectation does not call the function under test, and the catching arm is the POSITIVE one).
//   §F  THE SEAT'S THREE MULTIPLIERS – and that repair is FREE without any of them.
//   §G  ⭐⭐ THE WALK CONTAINS THE THING (ruling O's blind spot, T6b's): a flip, an un-flip, a
//       dead-zone week, a clamp and a beyond-baseline week, asserted before anything is read off it.
//   §H  THE FENCE – the pass writes two keys and nothing else, and no surface names either.
//
// ⚠⚠ EVERY ARM IS RECORDED WITH ITS **MEASURED** RED, the wave's standing duty. Control GREEN first
// (31 cases here). Every arm applied by a scripted string edit and UNDONE by the inverse edit, never
// `git checkout`, with the file's md5 checked back to pristine after each one and the run refused if
// the edit did not apply. The scope each count was measured over is named, because a red count
// without its scope is a number and not a measurement. Counts are over THIS file unless another is
// named.
//
//   ARM 1  the rise's sign flipped (`value += w.risePerWeek…`)       12 RED  §A ×2, §B ×2, §C ×1,
//                                                                           §D ×2, §F ×2, §G ×2, §H ×1
//   ARM 2  the repair loses its `Math.min(0, …)` clamp                2 RED  §A's stop-at-nature case
//                                                                           and §F's acceleration case
//   ARM 3  the growth branch drops `herself` (`growable` alone)       3 RED  §C's dam, §C's stand-down
//                                                                           case, §E's count-keys net
//   ARM 5  `armed` reads `Math.abs(toward)` instead of `toward`       2 RED  §B's two one-armable-
//                                                                           direction cases – a
//                                                                           born-private girl's WALLS
//                                                                           would arm a flip
//   ARM 6  the dead zone removed (`if (!armed && false) continue`)    7 RED  §B ×2, §C ×1, §D ×2, §E ×2
//   ARM 7  ⭐⭐ A SECOND `rng()` CONSUMED ON THE SAME KEY –            3 RED  §E's VALUE check and §F's
//          `const _arm = rngFromSeed(key); _arm(); if (_arm() < …)`          two swept hazard vectors.
//                                                                           ⚠⚠ THE COUNT-KEYS NET
//                                                                           STAYED GREEN – same key,
//                                                                           same count.
//   ARM 8  the un-flip's release compared against `flipArm`           1 RED  §D's dead-zone case
//          (`toward <= w.flipArm`) – the hysteresis collapsed
//   ARM 9  O6's `retained` drops `psychologistWorks` (rung alone)     1 RED  §F's stand-down case
//   ARM 10 the hazard scale drops `!flipped[axis]`, so it scales      1 RED  §F's rung-scale case
//          the un-flip too
//   ARM 11 `driftWalls` commented out in `phaseHerWeek`               3 RED  §G's tick case, §H's
//                                                                           call-site pin, and
//                                                                           tests/wave5-psychologist-
//                                                                           schema.test.ts's walls-key
//                                                                           census. ⚠ tests/spirit.
//                                                                           test.ts stayed GREEN – its
//                                                                           call-order pin is about
//                                                                           the GAP above
//                                                                           `accrueSpirit`, so nothing
//                                                                           there watches this line.
//
// ⚠⚠ TWO ARMS CAME IN AT **0 RED** AND THEY ARE DECLARED RATHER THAN DROPPED, because a null arm
// hidden is a net nobody watched fail:
//
//   ARM 4   the growth branch drops `growable` (`herself` alone)      0 RED
//   ARM 2b  the `if (!growable) value = Math.min(0, value)` clamp     0 RED
//           neutralised
//   ARM 4b  ⭐ BOTH OF THE ABOVE AT ONCE                              3 RED  §B's born-open case, §B's
//                                                                           reg-axis case, §C's
//                                                                           positive control
//
// That pair is DEFENCE IN DEPTH and not redundancy to be tidied away: «a born-open girl can never go
// positive» is enforced twice over – once by the growth branch's `growable &&`, once by the clamp
// below it – so either guard alone keeps the claim true and neither alone is catchable. ARM 4b is the
// arm that proves the PAIR is load-bearing, and it is the honest form of the measurement. ⚠ A reader
// who deletes the clamp «because the branch already covers it» will find ARM 4b is the only thing
// standing between the model and a poked world that walks straight past ruling N.
//
// ⚠⚠ ARM 7 IS THE ENTRY WORTH READING AND IT IS RULING L's AMENDMENT MEASURED FOR A THIRD TIME. The
// key COUNTER saw nothing – same key, same count – and only the VALUE-level checks moved. It is also
// why §E's and §F's expectations re-derive `rngFromSeed(key)()` INSIDE the test instead of comparing
// two arms of the engine: an equality between two things the mutation moves together is invisible to
// it, which is what T6 found twice in one task.
//
// ⚠⚠ AND ARM 10 IS THE OTHER HALF OF THE SAME LESSON, MEASURED THE HARD WAY. Against the FIRST
// drafting of §F's hazard cases – which sampled ONE week – it came in at **0 RED**, because p = 0.05
// and two different hazards agree on about nineteen weeks in twenty. The cases were widened to a
// 240-week vector and the arm then reds. A hazard pin that spot-checks a single week is the
// «unable to fail» family wearing a probability, and it looks completely convincing.
import { describe, expect, it, vi } from 'vitest'

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's, wave 4's and T2/T4/T5/T6's own apparatus,
// verbatim. Every call is delegated to the real `rngFromSeed`, so any number this file measures is
// the engine's own; the mock exists only so §E can COUNT AND ORDER the keys a pass reached. Hoisted,
// because `vi.mock`'s factory is lifted above the imports.
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

import { readFileSync } from 'node:fs'
import { region } from './helpers/source'
import { fileURLToPath } from 'node:url'
import { closeTournament, createWorld, skipTournament, tickWeek, TEMPERAMENTS, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import {
  driftWalls,
  expressedTemperamentOf,
  temperamentIntensity,
  temperamentOpenness,
  WALLS_AXES,
  type Temperament,
  type WallsAxis,
} from '../src/engine/spirit'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'

const SRC = fileURLToPath(new URL('../src/', import.meta.url))
const W = ECONOMY.life.walls
const P = ECONOMY.psychologist

/** Bond values that land squarely inside each band (`ECONOMY.bond.band`: close 80, steady 55,
 *  strained 35). Read off the constants rather than typed, so a `planka-3` retune moves them with
 *  the table instead of turning this file into four silent lies. */
const BOND = {
  close: ECONOMY.bond.band.close + 5,
  steady: ECONOMY.bond.band.steady + 5,
  strained: ECONOMY.bond.band.strained + 5,
  cold: ECONOMY.bond.band.strained - 5,
} as const

/** ONE SEED PER BIRTH TEMPERAMENT, found rather than asserted – `createWorld` draws her off
 *  `seed:temperament`, so a hand-picked seed would be a magic string that a re-order of the two
 *  `pickInt` calls would silently repoint at a different girl. */
const SEED_FOR: Record<Temperament, string> = (() => {
  const out = {} as Record<Temperament, string>
  for (let i = 0; i < 2000 && Object.keys(out).length < TEMPERAMENTS.length; i++) {
    const world = createWorld(`t7-${i}`)
    if (out[world.temperament] === undefined) out[world.temperament] = `t7-${i}`
  }
  return out
})()

/** THE BIRTH POLE ON AN AXIS, spelled from the engine's own two projections so this file cannot
 *  invent a third mapping (`temperamentFromAxes`' own ⚠⚠ argument, read from the test side). */
function growable(birth: Temperament, axis: WallsAxis): boolean {
  return axis === 'open' ? temperamentOpenness(birth) === 'private' : temperamentIntensity(birth) === 'intense'
}

type Seat = { hired?: boolean; focus?: string | null; rung?: 0 | 1 | 2; works?: boolean }

/** A world posed at a named bond, a named seat and a named pair of leanings. ⚠ It is a REAL
 *  `createWorld` and never a hand-built literal, so every field the pass reads is the field a career
 *  carries – `bond`, `temperament`, `wallsLean`, `wallsFlipped` and the four seat keys. */
function posed(
  birth: Temperament,
  bond: number,
  lean: Partial<Record<WallsAxis, number>> = {},
  flipped: Partial<Record<WallsAxis, boolean>> = {},
  seat: Seat = {},
): WorldState {
  const world = createWorld(SEED_FOR[birth])
  world.bond = bond
  world.wallsLean = { open: lean.open ?? 0, reg: lean.reg ?? 0 }
  world.wallsFlipped = { open: flipped.open ?? false, reg: flipped.reg ?? false }
  world.psychologistHired = seat.hired ?? false
  world.psychologistFocus = (seat.focus ?? null) as WorldState['psychologistFocus']
  world.psychologistRung = (seat.rung ?? 1) as WorldState['psychologistRung']
  return world
}

/** ⚠ THE SECOND ARGUMENT IS THE BILLING PREDICATE AND IT IS PASSED EXPLICITLY IN EVERY CASE, never
 *  derived from `hired` here: the whole of ruling J is that the two can disagree (a college freeze, a
 *  booked family week), and a helper that computed one from the other would make §F's stand-down case
 *  unable to fail. Default: «he is working iff he is hired», which is the ordinary week. */
function drift(world: WorldState, seat: Seat = {}, weeks = 1): WorldState {
  const works = seat.works ?? world.psychologistHired ?? false
  for (let i = 0; i < weeks; i++) {
    world.week += 1
    driftWalls(world, works)
  }
  return world
}

/** Only the keys THIS pass is about – the recorder sees every stream the engine derives, and a career
 *  tick derives many. */
function wallsKeys(): string[] {
  return rngKeys.filter((k) => k.includes(':life:walls:'))
}

/** THE WEEK RANGE EVERY HAZARD CLAIM IS SWEPT OVER, and it is a RANGE rather than a week for a
 *  measured reason: p = 0.05, so two different hazards agree on ~19 weeks in 20 and a spot check
 *  passes against the wrong constant almost always. ARM 10 proved it – applied against the
 *  single-week form of §F's un-flip case it came in at **0 RED**. 240 weeks carries ~12 bare fires
 *  and ~24 at the top of the scale, which is enough for the vectors to part. */
const HAZARD_WEEKS = Array.from({ length: 240 }, (_, i) => i)

/** The BARE hazard's own fires over that range, derived off the raw stream and never by calling the
 *  engine – ruling L as amended: «the value check's expectation must not call the function under
 *  test», because an equality between two arms is invisible to a mutation that moves both. */
function bareFires(seed: string, axis: WallsAxis = 'open'): boolean[] {
  return HAZARD_WEEKS.map((week) => rngFromSeed(`${seed}:life:walls:${axis}:${week}`)() < W.flipHazardPerWeek)
}

// =================================================================================================
// A. THE SIGN, AND THE THREE DRIFT ROWS – ruling N's table
// =================================================================================================
describe('wave 5 T7 A – the lean is ABSOLUTE, and zero is her nature', () => {
  it('⭐⭐ a `strained`/`cold` week takes BOTH axes negative, for every one of the four births', () => {
    // ⚠⚠ THE SIGN IS THE WHOLE OF RULING N AND A BUILD AGAINST THE OTHER CONVENTION LOOKS CORRECT AND
    // IS INSIDE-OUT. Negative = «more private / more intense» – walls up, dysregulated – on an
    // ABSOLUTE scale whose zero is her own nature, never a displacement relative to birth. So a kick
    // moves EVERY girl the same way, and what differs is only what that displacement can eventually
    // arm (§B).
    for (const birth of TEMPERAMENTS) {
      for (const band of ['strained', 'cold'] as const) {
        const world = drift(posed(birth, BOND[band]))
        expect(world.wallsLean, `${birth} at ${band}`).toEqual({ open: -W.risePerWeek, reg: -W.risePerWeek })
      }
    }
  })

  it('⭐⭐ a `close`/`steady` week walks a negative lean TOWARD 0 – and stops there, not past it', () => {
    // «Repair is free … time plus sustained care at a `close`/`steady` bond walks her back to HER OWN
    // baseline» – and the second half of that sentence is the assertion that matters: the walk ENDS
    // at her nature. Going further is a different thing entirely and has to be bought with her own
    // work (§C).
    for (const birth of TEMPERAMENTS) {
      for (const band of ['close', 'steady'] as const) {
        const one = drift(posed(birth, BOND[band], { open: -10, reg: -10 }))
        expect(one.wallsLean, `${birth} at ${band}, one week`)
          .toEqual({ open: -10 + W.repairPerWeek, reg: -10 + W.repairPerWeek })
        // ...and the step that would overshoot lands exactly on 0 instead.
        const home = drift(posed(birth, BOND[band], { open: -W.repairPerWeek / 2, reg: -W.repairPerWeek / 2 }))
        expect(home.wallsLean, `${birth} lands on her nature and not past it`).toEqual({ open: 0, reg: 0 })
      }
    }
  })

  it('⭐⭐ ...and a KICK EATS A POSITIVE LEAN FIRST – the owner\'s 09.09 bidirectional re-cut', () => {
    // «если она стала более открытой, а ее начали пинать, то она вполне может и назад откатиться».
    // The rise row carries no clamp at 0 on the way down, which is the one line that makes the door
    // swing both ways. Posed on `deep`, the girl who can hold a positive lean on BOTH axes.
    const world = drift(posed('deep', BOND.cold, { open: 10, reg: 10 }))
    expect(world.wallsLean, 'what she grew is spent before the walls start').toEqual({
      open: 10 - W.risePerWeek,
      reg: 10 - W.risePerWeek,
    })
  })

  it('⚠ the lean is stored to ONE DECIMAL, like spirit – no float dust accumulates over a career', () => {
    const world = posed('deep', BOND.cold)
    // A rate that does not land on a tenth by itself, driven for a hundred weeks.
    const before = W.risePerWeek
    for (let i = 0; i < 100; i++) {
      world.week += 1
      driftWalls(world, false)
      for (const axis of WALLS_AXES) {
        const v = world.wallsLean[axis]
        expect(Math.round(v * 10) / 10, `week ${i} / ${axis}`).toBe(v)
      }
    }
    expect(W.risePerWeek, 'the constant did not move under the walk').toBe(before)
  })

  it('⚠ the constants are the brief\'s §4 proposals, and the two thresholds are ordered', () => {
    expect(W.risePerWeek, 'wallsRisePerWeek').toBe(1.5)
    expect(W.repairPerWeek, 'wallsRepairPerWeek').toBe(1.0)
    expect(W.growthPerWeek, 'wallsGrowthPerWeek').toBe(0.5)
    expect(W.flipArm, 'flipArm').toBe(60)
    expect(W.flipRelease, 'flipRelease').toBe(40)
    expect(W.flipHazardPerWeek, 'flipHazardPerWeek').toBe(0.05)
    expect(P.wallsRetentionSlow, 'the O6 slow-down').toBe(0.75)
    expect(P.wallsHerselfRepair, 'the `herself` acceleration').toBe(1.5)
    expect(P.wallsHazardScale, 'the ruled beyond-baseline scale').toEqual([1, 1.5, 2])
    // ⚠⚠ THE ORDERING IS THE HYSTERESIS AND IS WORTH ASSERTING SEPARATELY FROM THE VALUES: release
    // STRICTLY inside arm, or the dead zone has no width and a flip is a flicker.
    expect(W.flipRelease, 'the release is strictly inside the arm').toBeLessThan(W.flipArm)
    // ...and the cap leaves room for both, or the arm is unreachable.
    expect(W.leanMax, 'the cap is past the arm, or nothing ever flips').toBeGreaterThan(W.flipArm)
    // ⚠ THE ROAD HOME FITS INSIDE A CAREER, which is the whole reason `leanMax` exists (§2a: «the
    // road back always exists»). Deepest hole, at the free repair rate, in weeks.
    expect(W.leanMax / W.repairPerWeek, 'the walk home from the deepest hole is inside ~2 seasons')
      .toBeLessThanOrEqual(2 * 52)
  })
})

// =================================================================================================
// B. ⭐⭐⭐ THE ONE-ARMABLE-DIRECTION PAIR – ruling N's two halves most likely to be built wrong
// =================================================================================================
describe('wave 5 T7 B – each girl has exactly ONE armable direction per axis, and birth decides it', () => {
  it('⭐⭐⭐ a born-PRIVATE girl\'s negative lean arms NOTHING, however deep it goes', () => {
    // «there is no pole more private than private». Her walls are REAL – the lean accumulates, and
    // it costs her the LADDER, because she must be walked back to 0 before a point of growth can be
    // bought – but no bucket moves and no hazard is ever rolled for. 400 weeks of cold, which is
    // deeper than the cap and more than six times the arm.
    for (const birth of TEMPERAMENTS.filter((t) => temperamentOpenness(t) === 'private')) {
      rngKeys.length = 0
      const world = drift(posed(birth, BOND.cold), {}, 400)
      expect(world.wallsLean.open, `${birth} really went deep`).toBe(-W.leanMax)
      expect(Math.abs(world.wallsLean.open), '...far past the arm').toBeGreaterThan(W.flipArm)
      expect(world.wallsFlipped.open, `${birth} is still read as private – there is no pole beyond it`).toBe(false)
      // ⚠⚠ AND IT IS ZERO DRAWS, NOT A DRAW THAT KEPT LOSING. The hazard is never armed at all, so the
      // stream is not derived – the difference between «arms nothing» and «is unlucky for 400 weeks».
      expect(wallsKeys().filter((k) => k.endsWith(':open:') || k.includes(':walls:open:')), `${birth} open axis`)
        .toEqual([])
    }
  })

  it('⭐⭐⭐ a born-OPEN girl can never go positive – there is nowhere to grow, so she is clamped at 0', () => {
    // The mirror half, and it is the one the dam (§C) rests on: no amount of care, no focus, no rung
    // and no number of seasons moves a `sunny` or `fiery` girl's openness past her own baseline.
    for (const birth of TEMPERAMENTS.filter((t) => temperamentOpenness(t) === 'open')) {
      const world = drift(
        posed(birth, BOND.close, {}, {}, { hired: true, focus: 'herself', rung: 2 }),
        { hired: true, focus: 'herself', rung: 2 },
        400,
      )
      expect(world.wallsLean.open, `${birth} stays at her nature`).toBe(0)
      expect(world.wallsFlipped.open, `${birth} never flips open`).toBe(false)
      // ⚠ THE CLAIM IS ABOUT THE **AXIS** AND NOT ABOUT THE BUCKET, which was measured rather than
      // assumed (the first drafting asserted the whole bucket and went red on `fiery`): a `fiery` girl
      // is open+INTENSE, so her REG axis is growable and four hundred weeks of her own work really do
      // flip it – she is read `sunny` at the end, and that is the model working. The two axes are
      // independent and a per-girl assertion averages two claims into one that is true of neither.
      expect(temperamentOpenness(expressedTemperamentOf(world)), `${birth} is still read OPEN, never private`)
        .toBe('open')
    }
  })

  it('⭐⭐ the same pair on the REGULATION axis – born-steady is clamped, born-intense arms nothing downward', () => {
    // ⚠ THE TWO AXES ARE INDEPENDENT AND THE PIN IS WRITTEN PER AXIS RATHER THAN PER GIRL, because
    // three of the four births are «growable on one axis and clamped on the other» and a case posed
    // per girl would average the two claims into one that is true of neither.
    for (const birth of TEMPERAMENTS) {
      const steadyBorn = temperamentIntensity(birth) === 'steady'
      // Clamped upward iff born steady.
      const grown = drift(
        posed(birth, BOND.close, {}, {}, { hired: true, focus: 'herself', rung: 2 }),
        { hired: true, focus: 'herself', rung: 2 },
        400,
      )
      if (steadyBorn) expect(grown.wallsLean.reg, `${birth} has nowhere to grow on reg`).toBe(0)
      else expect(grown.wallsLean.reg, `${birth} can learn tools her temperament never gave her`).toBe(W.leanMax)
      // Arms nothing downward iff born intense.
      rngKeys.length = 0
      const walled = drift(posed(birth, BOND.cold), {}, 400)
      expect(walled.wallsLean.reg, `${birth} walls up on reg either way`).toBe(-W.leanMax)
      expect(walled.wallsFlipped.reg, `${birth} reg flip`).toBe(steadyBorn ? true : false)
      if (!steadyBorn) {
        expect(wallsKeys().filter((k) => k.includes(':walls:reg:')), `${birth} draws nothing on reg`).toEqual([])
      }
    }
  })
})

// =================================================================================================
// C. ⭐⭐⭐ THE ANTI-«HUGGED INTO AN EXTRAVERT» DAM – a HARD invariant, not a corridor
// =================================================================================================
describe('wave 5 T7 C – beyond-baseline movement requires the held focus AND a close/steady bond', () => {
  it('⭐⭐⭐ a CARING career with NO focus produces ZERO beyond-baseline movement – ever', () => {
    // §2a: «without HER chosen work, her nature holds and only the relationship opens». The arm is
    // every birth × every rung × every OTHER focus × both caring bands, over four seasons, and the
    // claim is an exact 0 rather than a corridor. ⚠ It is also run with the seat UNHIRED, which is
    // the arm the bench's control is built on.
    const others = [null, 'recovery', 'coolhead', 'listen'] as const
    for (const birth of TEMPERAMENTS) {
      for (const band of ['close', 'steady'] as const) {
        for (const focus of others) {
          for (const rung of [0, 1, 2] as const) {
            const seat: Seat = { hired: focus !== null, focus, rung }
            const world = drift(posed(birth, BOND[band], {}, {}, seat), seat, 208)
            expect(world.wallsLean, `${birth}/${band}/${focus}/rung ${rung}`).toEqual({ open: 0, reg: 0 })
            expect(world.wallsFlipped, `${birth}/${band}/${focus}/rung ${rung} flips nothing`)
              .toEqual({ open: false, reg: false })
            expect(expressedTemperamentOf(world), `${birth} is still read as herself`).toBe(birth)
          }
        }
      }
    }
  })

  it('⭐⭐ `\'herself\'` at a STRAINED bond buys nothing either – the walls rise instead', () => {
    // The other leg of the AND. Consent and care are not the same fact, and the focus alone is not a
    // licence: at strained/cold the kick row is the one that fires, and it fires on a paid week.
    const seat: Seat = { hired: true, focus: 'herself', rung: 2 }
    for (const birth of TEMPERAMENTS) {
      const world = drift(posed(birth, BOND.strained, {}, {}, seat), seat, 10)
      for (const axis of WALLS_AXES) {
        expect(world.wallsLean[axis], `${birth}/${axis} went the other way`).toBeLessThan(0)
      }
    }
  })

  it('⭐⭐ THE POSITIVE CONTROL – held focus + caring bond + an axis with somewhere to grow DOES move', () => {
    // ⚠⚠ WITHOUT THIS THE THREE CASES ABOVE ARE WORTHLESS: «zero movement» is what a broken growth
    // branch produces too. The dam is only a dam if the river exists.
    const seat: Seat = { hired: true, focus: 'herself', rung: 1 }
    for (const birth of TEMPERAMENTS) {
      const world = drift(posed(birth, BOND.close, {}, {}, seat), seat, 20)
      for (const axis of WALLS_AXES) {
        if (growable(birth, axis)) {
          expect(world.wallsLean[axis], `${birth}/${axis} grows at the rate it is priced at`)
            .toBe(20 * W.growthPerWeek)
        } else {
          expect(world.wallsLean[axis], `${birth}/${axis} has nowhere to go`).toBe(0)
        }
      }
    }
  })

  it('⚠ and a STOOD-DOWN seat grows nothing – the focus is set, the week is not paid for', () => {
    // Ruling J's law, applied to the growth branch: a college-freeze week and a booked family week
    // bill nothing, so they buy nothing. The flag survives both and the walk resumes by itself.
    const seat: Seat = { hired: true, focus: 'herself', rung: 2 }
    const world = drift(posed('deep', BOND.close, {}, {}, seat), { ...seat, works: false }, 40)
    expect(world.wallsLean, 'nothing was bought on forty unbilled weeks').toEqual({ open: 0, reg: 0 })
    // ...and one billed week moves it, so the arm is not vacuous.
    expect(drift(world, seat, 1).wallsLean.open, 'the first paid week buys its half-point')
      .toBe(W.growthPerWeek)
  })
})

// =================================================================================================
// D. HYSTERESIS AS STATE – the dead zone, the flip that does not reset, and the un-flip
// =================================================================================================
describe('wave 5 T7 D – a flip is an event of seasons, never a flicker', () => {
  it('⭐⭐⭐ THE DEAD ZONE arms NOTHING in either direction – unflipped below the arm, flipped above the release', () => {
    // ⚠⚠ THE PIN THAT MAKES A FLIP «AN EVENT OF SEASONS» RATHER THAN A FLICKER. Without it a lean
    // sitting on the threshold would re-roll both ways every week and the bucket would chatter.
    // Posed at the midpoint of the band on BOTH sides of the flip boundary.
    const mid = (W.flipArm + W.flipRelease) / 2
    expect(mid, 'the band really has width').toBeGreaterThan(W.flipRelease)
    for (const birth of TEMPERAMENTS) {
      for (const axis of WALLS_AXES) {
        const toward = growable(birth, axis) ? mid : -mid
        // UNFLIPPED, inside the band: below the arm, so nothing arms.
        rngKeys.length = 0
        const up = posed(birth, BOND.steady, { [axis]: toward }, { [axis]: false })
        // ⚠ A CARING WEEK, so the lean does not walk further into the band and change the question.
        driftWalls(up, false)
        expect(up.wallsFlipped[axis], `${birth}/${axis} unflipped in the band`).toBe(false)
        expect(wallsKeys(), `${birth}/${axis} unflipped in the band draws nothing`).toEqual([])
        // FLIPPED, inside the band: above the release, so nothing arms either.
        rngKeys.length = 0
        const down = posed(birth, BOND.steady, { [axis]: toward }, { [axis]: true })
        driftWalls(down, false)
        expect(down.wallsFlipped[axis], `${birth}/${axis} flipped in the band`).toBe(true)
        expect(wallsKeys(), `${birth}/${axis} flipped in the band draws nothing`).toEqual([])
      }
    }
  })

  it('⭐⭐ a flip does NOT reset the lean – the boolean and the accumulator are independent', () => {
    // Ruling N, «hysteresis stated as state rather than as a rule of thumb»: the lean keeps drifting
    // under a flip, which is the only way the un-flip can ever be reached.
    const world = posed('sunny', BOND.cold, { open: -W.flipArm }, { open: false })
    // Walk until it fires, then read the lean.
    let fired = -1
    for (let i = 0; i < 300 && fired < 0; i++) {
      world.week += 1
      driftWalls(world, false)
      if (world.wallsFlipped.open) fired = i
    }
    expect(fired, 'the arm really fired inside the walk').toBeGreaterThanOrEqual(0)
    expect(world.wallsLean.open, 'the lean kept drifting through the flip, it was not zeroed')
      .toBeLessThan(-W.flipArm)
    // ...and it keeps drifting AFTER, down to the cap.
    const after = drift(world, {}, 200)
    expect(after.wallsLean.open, 'and it goes on under the flip, to the cap').toBe(-W.leanMax)
    expect(after.wallsFlipped.open, 'which does not un-flip her – the walls are still up').toBe(true)
  })

  it('⭐⭐ the UN-FLIP arms only once the lean is back inside the release, and it can fire', () => {
    // The road home, and the whole of «a closed-again girl can be opened again». Posed FLIPPED and
    // deep, then given a caring bond and nothing else – no hire, no focus, no money.
    const world = posed('sunny', BOND.close, { open: -W.leanMax }, { open: true })
    let releaseWeek = -1
    let unflipWeek = -1
    for (let i = 0; i < 400 && unflipWeek < 0; i++) {
      world.week += 1
      driftWalls(world, false)
      if (releaseWeek < 0 && world.wallsLean.open >= -W.flipRelease) releaseWeek = i
      if (!world.wallsFlipped.open) unflipWeek = i
    }
    expect(releaseWeek, 'the walk home really reached the release band').toBeGreaterThan(0)
    expect(unflipWeek, 'and the un-flip fired').toBeGreaterThanOrEqual(releaseWeek)
    expect(world.psychologistHired, '⭐⭐⭐ AND THE WHOLE ROAD WAS FREE – nobody was ever hired').toBe(false)
  })

  it('⚠ the lean is capped at ±`leanMax`, in both directions', () => {
    const walled = drift(posed('deep', BOND.cold), {}, 400)
    expect(walled.wallsLean).toEqual({ open: -W.leanMax, reg: -W.leanMax })
    const seat: Seat = { hired: true, focus: 'herself', rung: 2 }
    const grown = drift(posed('deep', BOND.close, {}, {}, seat), seat, 400)
    expect(grown.wallsLean).toEqual({ open: W.leanMax, reg: W.leanMax })
  })
})

// =================================================================================================
// E. ⭐⭐⭐ THE ZERO-DRAW PROOF – the count-keys net, AND ruling L's value check AS AMENDED
// =================================================================================================
describe('wave 5 T7 E – the leaning arithmetic is deterministic; only the armed hazard draws', () => {
  it('⭐⭐⭐ THE COUNT-KEYS NET – a career whose axes never arm reaches ZERO walls keys, over four seasons', () => {
    // Wave-4 §0.1's law: prove eligibility short-circuits with a key COUNTER the code cannot see.
    // A default career opens at bond 70 – `steady`, a CARING band – so the lean sits at 0 and neither
    // axis can ever arm. 208 weeks of it, for all four births.
    for (const birth of TEMPERAMENTS) {
      rngKeys.length = 0
      const world = drift(posed(birth, BOND.steady), {}, 208)
      expect(world.wallsLean, `${birth} never left her nature`).toEqual({ open: 0, reg: 0 })
      expect(wallsKeys(), `${birth} derived no walls stream at all`).toEqual([])
    }
  })

  it('⭐⭐⭐ ...AND THE POSITIVE CONTROL – an armed axis derives EXACTLY its own key, and the other does not', () => {
    // ⚠⚠ WITHOUT THIS THE NET ABOVE IS WORTHLESS – a function that never draws at all passes it. The
    // control also proves §1f's one-value-per-key law for this pair: the AXIS is in the key, so a week
    // on which both axes are armed is two keys and never one value spent twice.
    const seed = SEED_FOR.sunny
    // One axis armed, the other at her nature.
    // ⚠ POSED AT THE CAP, NOT AT THE ARM, AND THE REASON IS THE PASS'S OWN ORDER (drift first, then
    // the hazard): a lean sitting exactly on −`flipArm` is repaired to −59 by the caring week before
    // the question is asked, and −59 is inside the dead zone. Measured – the first drafting posed on
    // the arm and got an empty key list, which is the pass being right and the fixture being wrong.
    rngKeys.length = 0
    const one = posed('sunny', BOND.steady, { open: -W.leanMax }, {})
    one.week = 500
    driftWalls(one, false)
    expect(wallsKeys(), 'one armed axis, one key').toEqual([`${seed}:life:walls:open:500`])
    // Both armed: two keys, in `WALLS_AXES`' order.
    rngKeys.length = 0
    const both = posed('sunny', BOND.steady, { open: -W.leanMax, reg: -W.leanMax }, {})
    both.week = 500
    driftWalls(both, false)
    expect(wallsKeys(), 'two armed axes, two keys, one week').toEqual([
      `${seed}:life:walls:open:500`,
      `${seed}:life:walls:reg:500`,
    ])
    // ...and the two keys really disagree somewhere, which is what makes them two FACTS rather than
    // two spellings of one. A key that dropped the axis would flip both axes on the same weeks for
    // ever, and every count above would stay green.
    const disagrees = Array.from({ length: 300 }, (_, i) => i).filter(
      (i) =>
        (rngFromSeed(`${seed}:life:walls:open:${i}`)() < W.flipHazardPerWeek) !==
        (rngFromSeed(`${seed}:life:walls:reg:${i}`)() < W.flipHazardPerWeek),
    )
    expect(disagrees.length, 'the axis in the key really buys two independent hazards').toBeGreaterThan(0)
  })

  it('⭐⭐⭐ RULING L AS AMENDED – the VALUE check, whose expectation never calls the function under test', () => {
    // ⚠⚠ THE COUNT-KEYS NET SEES KEYS, NEVER CONSUMED VALUES (ruling L, T5's ARM 7a). A term added
    // inside a function that already draws can silently consume a value on an existing key and the
    // counter will not blink – and T7's hazard is exactly that shape. So: a VALUE-level check.
    //
    // ⚠⚠ AND IT IS BUILT THE WAY RULING L's AMENDMENT (T6) SAYS, WHICH IS THE HALF THE FIRST DRAFTS
    // OF THIS INSTRUMENT KEEP GETTING WRONG. The catching arm is the POSITIVE one – with nothing
    // armed no draw happens at all, so a negative arm cannot see a consumed value. And the
    // expectation is re-derived HERE, off the raw stream, rather than compared against a second call
    // into the engine: an equality between two arms is INVISIBLE to a mutation that moves both.
    //
    // ⚠ WIDE, because a consumed value only flips a coin-shaped outcome about half the time and the
    // coin is p = 0.05. 240 armed weeks, each posed fresh, so the vector carries ~12 fires and an arm
    // that shifts the stream one value along cannot agree with it by luck.
    const seed = SEED_FOR.sunny
    const got: boolean[] = []
    const want: boolean[] = []
    for (let week = 0; week < 240; week++) {
      const world = posed('sunny', BOND.steady, { open: -W.leanMax }, { open: false })
      world.week = week
      driftWalls(world, false)
      got.push(world.wallsFlipped.open)
      // ⚠ THE EXPECTATION, DERIVED INDEPENDENTLY: the FIRST value of the stream, against the bare
      // hazard (no seat, so no scale). Nothing in this line calls `driftWalls`.
      want.push(rngFromSeed(`${seed}:life:walls:open:${week}`)() < W.flipHazardPerWeek)
    }
    expect(got, 'the engine flipped on exactly the weeks the stream\'s FIRST value says it should')
      .toEqual(want)
    // ...and the vector is not all-false, which is the null-arm check this comparison needs: two
    // all-false vectors are equal for the wrong reason.
    expect(want.filter(Boolean).length, 'the sample really contains fires').toBeGreaterThan(4)
    expect(want.filter((x) => !x).length, '...and really contains misses').toBeGreaterThan(4)
  })

  it('⚠ MAIN is untouched by the pass, armed or not – the frozen capture cannot see this function', () => {
    for (const lean of [0, -W.flipArm]) {
      const world = posed('sunny', BOND.cold, { open: lean, reg: lean })
      const before = JSON.stringify(world.rngMain)
      drift(world, {}, 20)
      expect(JSON.stringify(world.rngMain), `lean ${lean}`).toBe(before)
    }
  })
})

// =================================================================================================
// F. THE SEAT'S THREE MULTIPLIERS – and the road home that needs none of them
// =================================================================================================
describe('wave 5 T7 F – what the retainer buys, and what it must never be required for', () => {
  it('⭐⭐ O6 – a RETAINED seat at rung ≥ 2 slows the walls\' RISE, at any focus', () => {
    for (const rung of [0, 1, 2] as const) {
      const seat: Seat = { hired: true, focus: 'coolhead', rung }
      const world = drift(posed('sunny', BOND.cold, {}, {}, seat), seat, 1)
      // ⚠⚠ THROUGH THE TENTHS GRID, WHICH IS A REAL PROPERTY OF THE FIELD AND NOT A TEST
      // CONVENIENCE: the lean is stored to one decimal (§A), so 1.5 × 0.75 = 1.125 lands at 1.1 and
      // the realised slow-down is ~×0.733 rather than ×0.75. Named here and at the constant, and
      // carried to T10 – a bench that predicts 0.75 will read a correct implementation as a miss,
      // which is ruling M's own lesson one focus over.
      const raw = rung >= 2 ? -W.risePerWeek * P.wallsRetentionSlow : -W.risePerWeek
      expect(world.wallsLean.open, `rung ${rung}`).toBe(Math.round(raw * 10) / 10)
    }
  })

  it('⭐⭐ ...and a STOOD-DOWN seat slows NOTHING – ruling P\'s own ⚠', () => {
    // The billing predicate again: a college-freeze week and a booked family week charge nothing, so
    // the walls rise at the full rate on them. ⚠ The seat is hired and at the top rung in BOTH arms –
    // the only thing that differs is the week being paid for.
    const seat: Seat = { hired: true, focus: 'listen', rung: 2 }
    const paid = drift(posed('sunny', BOND.cold, {}, {}, seat), { ...seat, works: true }, 1)
    const unpaid = drift(posed('sunny', BOND.cold, {}, {}, seat), { ...seat, works: false }, 1)
    expect(paid.wallsLean.open, 'a billed week is slowed')
      .toBe(Math.round(-W.risePerWeek * P.wallsRetentionSlow * 10) / 10)
    expect(unpaid.wallsLean.open, 'an unbilled one is not').toBe(-W.risePerWeek)
    expect(paid.wallsLean.open, '...and strictly less far than the unbilled one')
      .toBeGreaterThan(unpaid.wallsLean.open)
  })

  it('⭐⭐ O6 slows the DRIFT and NEVER the hazard – ruling N\'s warning about the two multipliers', () => {
    // «he does not make a flip less likely once they are up». Posed already armed, so the drift row
    // is irrelevant and only the draw is being compared: the same week, the same key, the same value.
    //
    // ⚠⚠ SWEPT OVER `HAZARD_WEEKS` AND NEVER SAMPLED ON ONE WEEK, WHICH WAS MEASURED RATHER THAN
    // ASSUMED. A hazard comparison on a single week is a coin that agrees with the wrong constant
    // about 95 % of the time: ARM 10 (the scale applied where it must not be) came in at **0 RED**
    // against the single-week form of the case below, because that one week's raw value did not
    // happen to fall in the window the two hazards disagree on. The vector does the work a spot check
    // cannot – ruling L's «widen the walk» amendment, in its other costume.
    for (const rung of [0, 1, 2] as const) {
      const seat: Seat = { hired: true, focus: 'coolhead', rung }
      const got = HAZARD_WEEKS.map((week) => {
        const world = posed('sunny', BOND.cold, { open: -W.leanMax }, { open: false }, seat)
        world.week = week
        driftWalls(world, true)
        return world.wallsFlipped.open
      })
      expect(got, `rung ${rung}: the walls-up hazard is the bare one`).toEqual(bareFires(SEED_FOR.sunny))
    }
  })

  it('⭐⭐ the rung scales the BEYOND-BASELINE flip and nothing else – never a collapse, never an un-flip', () => {
    // Ruling N: «the seat accelerates her own work and never her collapse». Three claims, one case,
    // each SWEPT over `HAZARD_WEEKS` for the reason the O6 case above records: a single week is a coin
    // that agrees with the wrong constant nineteen times in twenty, and ARM 10 walked straight through
    // the spot-check version of claim 2.
    const seed = SEED_FOR.deep
    const bare = bareFires(seed)
    // 1. THE BEYOND-BASELINE FLIP IS SCALED, per rung – and the three rungs really separate.
    const perRung = [0, 1, 2].map((rung) =>
      HAZARD_WEEKS.map((week) => {
        const seat: Seat = { hired: true, focus: 'herself', rung: rung as 0 | 1 | 2 }
        const world = posed('deep', BOND.close, { open: W.leanMax }, { open: false }, seat)
        world.week = week
        driftWalls(world, true)
        return world.wallsFlipped.open
      }),
    )
    for (const rung of [0, 1, 2] as const) {
      const want = HAZARD_WEEKS.map(
        (week) => rngFromSeed(`${seed}:life:walls:open:${week}`)() < W.flipHazardPerWeek * P.wallsHazardScale[rung],
      )
      expect(perRung[rung], `rung ${rung} scaled by ${P.wallsHazardScale[rung]}`).toEqual(want)
    }
    // ⚠ AND THE THREE VECTORS REALLY DIFFER, or the three assertions above are three spellings of one
    // claim. The top rung fires strictly more often than the bottom one on this sample.
    expect(perRung[2].filter(Boolean).length, 'the top rung really buys more fires than the bottom')
      .toBeGreaterThan(perRung[0].filter(Boolean).length)
    // 2. THE UN-FLIP IS NOT SCALED, at any rung – she is coming home and repair is free.
    for (const rung of [0, 1, 2] as const) {
      const seat: Seat = { hired: true, focus: 'herself', rung }
      const got = HAZARD_WEEKS.map((week) => {
        const world = posed('deep', BOND.close, { open: 0 }, { open: true }, seat)
        world.week = week
        driftWalls(world, true)
        // `wallsFlipped.open` starts TRUE, so a fire means it became false.
        return !world.wallsFlipped.open
      })
      expect(got, `rung ${rung} un-flip is bare`).toEqual(bare)
    }
    // 3. AND A WALLS-UP FLIP IS NOT SCALED EITHER, on the `'herself'` focus – so the two conditions of
    //    the scale are separated: the focus alone is not it, and neither is the rung.
    for (const rung of [0, 1, 2] as const) {
      const seat: Seat = { hired: true, focus: 'herself', rung }
      const got = HAZARD_WEEKS.map((week) => {
        const world = posed('sunny', BOND.cold, { open: -W.leanMax }, { open: false }, seat)
        world.week = week
        driftWalls(world, true)
        return world.wallsFlipped.open
      })
      expect(got, `rung ${rung}: a collapse is never accelerated`).toEqual(bareFires(SEED_FOR.sunny))
    }
  })

  it('⭐⭐⭐ REPAIR IS FREE – the whole road home measured with `psychologistHired === false`', () => {
    // §0.3, the layer's own law: «the seat only ever ACCELERATES the road home. Gating any part of
    // that road behind the retainer is a design violation, not a tuning miss.» The control arm is the
    // seatless one and it must complete the walk.
    for (const birth of TEMPERAMENTS) {
      const world = posed(birth, BOND.close, { open: -W.leanMax, reg: -W.leanMax })
      const weeks = Math.ceil(W.leanMax / W.repairPerWeek)
      drift(world, {}, weeks)
      expect(world.psychologistHired, `${birth}: nobody was hired`).toBe(false)
      expect(world.wallsLean, `${birth} is home, for free`).toEqual({ open: 0, reg: 0 })
    }
  })

  it('⭐⭐ ...and `\'herself\'` ACCELERATES that walk ×1.5 – an acceleration, never a gate', () => {
    const seat: Seat = { hired: true, focus: 'herself', rung: 0 }
    const free = drift(posed('deep', BOND.close, { open: -W.leanMax }), {}, 10)
    const helped = drift(posed('deep', BOND.close, { open: -W.leanMax }, {}, seat), seat, 10)
    expect(free.wallsLean.open, 'the free walk').toBe(-W.leanMax + 10 * W.repairPerWeek)
    expect(helped.wallsLean.open, 'and the accelerated one')
      .toBe(-W.leanMax + 10 * W.repairPerWeek * P.wallsHerselfRepair)
    expect(helped.wallsLean.open, 'strictly further along, never merely different')
      .toBeGreaterThan(free.wallsLean.open)
    // ⚠ AND IT STILL STOPS AT HER NATURE – the acceleration does not overshoot into growth.
    const landed = drift(posed('deep', BOND.close, { open: -W.repairPerWeek }, {}, seat), seat, 1)
    expect(landed.wallsLean.open, 'the accelerated step lands on 0, not past it').toBe(0)
  })
})

// =================================================================================================
// G. ⭐⭐ THE WALK CONTAINS THE THING – proved BEFORE anything is read off it
// =================================================================================================
describe('wave 5 T7 G – a fixture that cannot reach the case is a green that means nothing', () => {
  it('⭐⭐⭐ one scripted life reaches a flip, an un-flip, a dead-zone week, a clamp at 0 AND a beyond-baseline week', () => {
    // ⚠⚠ RULING O's SECOND BLIND SPOT, MEASURED RATHER THAN HOPED FOR. T6b walked forty weeks that
    // contained no told-now ending at all, so a change rewriting every such row left the digest
    // byte-identical. The same trap is wide open here: a walk at the default bond never arms
    // anything, and every count in this file would be a confident zero. So the schedule below is
    // driven, and each of the five cases is COUNTED and asserted non-zero before the walk is trusted.
    //
    // The life, in four movements, on one born-PRIVATE + born-INTENSE girl (the only birth that can
    // reach all five on one axis): kicked into walls -> cared back home -> her own work past the
    // baseline -> kicked again.
    const world = posed('deep', BOND.cold)
    const seat: Seat = { hired: true, focus: 'herself', rung: 2 }
    const seen = { flip: 0, unflip: 0, deadZone: 0, clampedAtNature: 0, beyondBaseline: 0 }
    const script: Array<{ weeks: number; bond: number; seat: Seat }> = [
      { weeks: 150, bond: BOND.cold, seat: {} }, // walls up, deep past the arm
      { weeks: 200, bond: BOND.close, seat: {} }, // the free road home
      { weeks: 260, bond: BOND.close, seat }, // her own work, beyond her nature
      { weeks: 150, bond: BOND.cold, seat: {} }, // and the collapse back
    ]
    for (const leg of script) {
      world.psychologistHired = leg.seat.hired ?? false
      world.psychologistFocus = (leg.seat.focus ?? null) as WorldState['psychologistFocus']
      world.psychologistRung = (leg.seat.rung ?? 1) as WorldState['psychologistRung']
      for (let i = 0; i < leg.weeks; i++) {
        world.week += 1
        world.bond = leg.bond
        const wasFlipped = world.wallsFlipped.reg
        const before = world.wallsLean.reg
        driftWalls(world, leg.seat.hired ?? false)
        const now = world.wallsLean.reg
        if (!wasFlipped && world.wallsFlipped.reg) seen.flip += 1
        if (wasFlipped && !world.wallsFlipped.reg) seen.unflip += 1
        // ⚠ THE DEAD ZONE IS COUNTED AS A STATE, not as «no flip happened»: strictly between the
        // release and the arm, measured along her own armable direction, on a week that therefore
        // could not have drawn at all.
        const toward = now // born intense: the armable direction on `reg` is positive
        const inBand = Math.abs(toward) > W.flipRelease && Math.abs(toward) < W.flipArm
        if (inBand) seen.deadZone += 1
        if (before < 0 && now === 0) seen.clampedAtNature += 1
        if (now > 0) seen.beyondBaseline += 1
      }
    }
    expect(seen.flip, '⚠ the walk reaches a FLIP').toBeGreaterThan(0)
    expect(seen.unflip, '⚠ the walk reaches an UN-FLIP').toBeGreaterThan(0)
    expect(seen.deadZone, '⚠ the walk reaches DEAD-ZONE weeks').toBeGreaterThan(0)
    expect(seen.clampedAtNature, '⚠ the walk reaches the CLAMP at 0 – the free walk ending at her nature')
      .toBeGreaterThan(0)
    expect(seen.beyondBaseline, '⚠ the walk reaches BEYOND-BASELINE weeks').toBeGreaterThan(0)
  })

  it('⭐⭐ and the pass really runs inside the tick – a walked career\'s leanings move under `tickWeek`', () => {
    // ⚠⚠ EVERY OTHER CASE IN THIS FILE CALLS `driftWalls` DIRECTLY, which proves the function and says
    // NOTHING about whether anything calls it. This is that half, and it is the arm that catches a
    // deleted call site. Bond is driven below the caring band each week – the default career opens at
    // `steady` and would never arm anything, which is precisely the T6b trap.
    const world = createWorld('t7-tick')
    const rng = resumeMain(world.rngMain)
    for (let i = 0; i < 60; i++) {
      world.bond = BOND.cold
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    expect(world.week, 'the walk really walked').toBeGreaterThan(50)
    expect(world.wallsLean.open, 'the leaning moved inside a real tick').toBeLessThan(0)
    expect(world.wallsLean.reg, '...on both axes').toBeLessThan(0)
    // ...and it moved by the weekly rate, not by some other amount.
    expect(world.wallsLean.open, 'at `risePerWeek` a week, capped').toBe(
      Math.max(-W.leanMax, -W.risePerWeek * world.week),
    )
  })
})

// =================================================================================================
// H. THE FENCE – two keys written, nothing else, and no surface anywhere
// =================================================================================================
describe('wave 5 T7 H – what the pass touches, and what it must never', () => {
  it('⭐⭐ `driftWalls` writes `wallsLean` and `wallsFlipped` and NOTHING else – key by key, over a walk', () => {
    // ⚠⚠ RULING K's INSTRUMENT, IN-PROCESS: hash every top-level key every week, so a convergent
    // change (a value that moves and comes back) cannot hide behind an end-state diff. The control is
    // the same world walked with the pass's own inputs held at «nothing happens».
    const walked = posed('sunny', BOND.cold)
    const before = new Map<string, string>()
    for (const key of Object.keys(walked as unknown as Record<string, unknown>)) {
      before.set(key, JSON.stringify((walked as unknown as Record<string, unknown>)[key] ?? null))
    }
    drift(walked, {}, 120)
    const moved: string[] = []
    for (const [key, was] of before) {
      const now = JSON.stringify((walked as unknown as Record<string, unknown>)[key] ?? null)
      if (now !== was) moved.push(key)
    }
    expect(moved.sort(), 'the pass moved exactly its own two keys plus the week the harness drives')
      .toEqual(['wallsFlipped', 'wallsLean', 'week'])
  })

  it('⭐⭐⭐ NO SURFACE SHOWS ANY OF IT – the leaning and the flip are on no screen, in no string, on no wire', () => {
    // ⚠⚠ DELIBERATELY ABSENT AND NAMED SO NOBODY ADDS IT (the wave-5 brief's T7, in bold). The
    // existing surfaces ARE the telegraph: the face, the Mood word, the diary's bands, the feed's
    // silence. The album reads the arc later. ⚠ The whole-tree census of the two keys lives in
    // tests/wave5-psychologist-schema.test.ts §F; this is the half about the PASS – it raises no beat,
    // writes no feed row and names no player-facing string.
    // ⚠ THROUGH `region`, WHICH THROWS ON AN ABSENT MARKER – the raw `slice(indexOf(…))` form hands
    // back a `-1` slice that silently WIDENS to the rest of the file, and a NEGATIVE pin read over
    // almost a whole module is the «two of them had been lying» case in CLAUDE.md's own gotcha.
    // Measured rather than recited: the first drafting of this case used the raw form and
    // `npm run pins:check` refused it (4 errors, baseline 3).
    const src = readFileSync(`${SRC}engine/spirit.ts`, 'utf8')
    const pass = region(src, 'export function driftWalls(', '/** THE ONE WRITER for every `bond` delta')
    expect(pass.length, 'the pin really found the function').toBeGreaterThan(200)
    for (const forbidden of ['addEvent', 'raiseLifeBeat', 'lifeLog', 'world.spirit', 'world.bond =']) {
      expect(pass, `driftWalls must not reach for ${forbidden}`).not.toContain(forbidden)
    }
    // ...and it names no capitalised sentence – the crude, honest test for a player-facing string.
    expect(pass.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''), 'and it holds no copy')
      .not.toMatch(/'[A-Z][a-z]+ [a-z]/)
  })

  it('⭐⭐ the call site is `phaseHerWeek`, immediately after `accrueSpirit`, on the same predicate – ruling P', () => {
    // ⚠⚠ THE POSITION IS THE RULING. Ruling F's requirement («a flip never bites its own week») is
    // met by this ordering and by nothing else: `accrueSpirit` reads `intensity` once at its head, so
    // a flip that fired before it returned would price half a week as one person and half as another.
    // ⚠ And ruling P's own half – it is a SIBLING and not a block inside `accrueSpirit`, because that
    // function's ZERO-DRAW contract is load-bearing and this pass draws.
    const src = readFileSync(`${SRC}engine/world/phaseHerWeek.ts`, 'utf8')
    const code = src
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'))
    // ⚠⚠ RE-AIMED 14.09 BY WAVE 6's T3, AND IT IS THE **FIRST** RE-AIM OF THIS ONE – the two wave-4
    // text pins were re-aimed once already on 13.09 and are on their second, but this case was BORN
    // in wave 5 carrying the anchor, so its counter starts here. WHAT MOVED: `accrueSpirit` takes a
    // third argument, `exposureEventsOf(world, world.week)` – the week's exposure list, handed down
    // at the call site (§0.1's dependency inversion, ruling J's shape applied to a second fact).
    // NOTHING about ruling P's claim moves: the walls pass is still asserted to be the VERY NEXT
    // statement after the spirit pass, still on the same predicate, and `toBe(i + 1)` is red on any
    // statement sliding between them. ⚠ `driftWalls` is deliberately NOT given the list: the leaning
    // pass is not a spirit term and §8 keeps `accrueSpirit` the one place the pressure is summed.
    //
    // ⚠ THIS PIN IS THE **FIFTH** SITE AND RULING A's TABLE NAMES THREE. Measured on the tree: the
    // arity/signature case and the ordered-list case in tests/spirit.test.ts, the two wave-4 text
    // pins, and this one. Carried back to the architect rather than quietly re-aimed.
    // ⚠⚠ RE-AIMED A **SECOND** TIME 14.09 BY WAVE 6's **T3b** – the re-aim AFTER T3's, on the same
    // day, and this one's counter runs one behind the wave-4 pair's because it was born in wave 5.
    // RULING P's REASON IN ONE SENTENCE: `'stage'` and `'publicLoss'` are stamped inside
    // `playHerWeek`, two phases after this pass, so asked about `world.week` they could never fire
    // and the horizon moves to the week that has CLOSED. WHAT MOVED: the anchor's third argument is
    // now `exposureEventsOf(world, world.week - 1)`. NOTHING about wave 5's ruling P (a different
    // ruling, the same letter, 13.09) moves: the walls pass is still asserted to be the VERY NEXT
    // statement after the spirit pass, still on the same predicate, and `toBe(i + 1)` is still red on
    // any statement sliding between them – ⚠ including the one wave-6 ruling P refuses by name,
    // moving `accrueSpirit` itself down the phase to where a trophy is already written.
    // ⚠⚠ RE-AIMED A **THIRD** TIME 14.09 BY WAVE 6's **T4**, AND THIS ONE MOVES AN ASSERTION RATHER
    // THAN AN ANCHOR – so what it may NOT do is weaken, and it does not. WHAT MOVED: `toBe(i + 1)`
    // becomes a TOTAL list equality over everything between the two passes. WHY: the architect's
    // ruling Q puts `growHabituation` on the line immediately after `accrueSpirit`, which is the slot
    // `toBe(i + 1)` reserved – ruling Q says «wave 5's ruling P precedent, where `driftWalls` already
    // sits» without noticing that the precedent is PINNED AS EXCLUSIVE. It has to be there and not
    // below `driftWalls`: habituation reads `wallsFlipped`, `driftWalls` WRITES it, and the pass
    // below promises in its own ⚠ that «whatever flips here is first read on the NEXT tick». A
    // habituation pass under it would freeze a girl the pass above has just charged as the girl she
    // was all week.
    // ⚠ WHY THIS IS THE SAME STRENGTH AND NOT A SOFTENING: `toEqual([...])` on the whole slice is red
    // on ANY other statement sliding between the two, red on a re-order of the three, and red if the
    // habituation pass is deleted or moved – strictly MORE than `toBe(i + 1)` said, since that form
    // said nothing about what sits on the line after. It is the shape tests/spirit.test.ts's own
    // ordered-list pin already uses for the four private-life calls. ARM 18 is the statement slid in
    // between, ARM 19 the habituation pass moved below the walls pass; both red here.
    const i = code.indexOf('accrueSpirit(world, psychologistWorksThisWeek(world), exposureEventsOf(world, world.week - 1))')
    const j = code.indexOf('driftWalls(world, psychologistWorksThisWeek(world))')
    expect(i, 'the spirit pass is where it was').toBeGreaterThan(-1)
    expect(j, 'and the walls pass still follows it').toBeGreaterThan(i)
    // ⚠⚠ RE-AIMED A **FOURTH** TIME 14.09 BY WAVE 6's **T5**, AND IT IS AN ANCHOR MOVE AGAIN RATHER
    // THAN AN ASSERTION ONE – the shape T4 installed is exactly what a fourth re-aim should cost.
    // WHAT MOVED: `growHabituation` gained a THIRD ARGUMENT, `psychologistWorksThisWeek(world)` – the
    // seat's billing predicate, the same expression the two passes on either side of it are given.
    // WHY: «The public life» (O7) is the psychologist's fifth year-focus and it ACCELERATES this
    // counter by rung while it is held, so the growth has to know whether the seat is working and
    // being paid this week; and `engine/spirit.ts` cannot import `./psychologist` to ask (ruling J's
    // two live back-edges), so the caller answers. ⚠ NOTHING ABOUT RULING P OR RULING Q MOVES: the
    // habituation pass is still the ONLY statement between the two, still above `driftWalls` so the
    // walls it reads are the ones the girl wore all week, and this equality is still red on any other
    // statement sliding in, on a re-order, and on the pass being deleted or moved.
    expect(code.slice(i + 1, j), '⚠ and ONLY v77 T4\'s habituation pass separates them – ruling Q').toEqual([
      'growHabituation(world, sheIsNewsAt(world, world.week - 1), psychologistWorksThisWeek(world))',
    ])
    expect(code.filter((l) => l.startsWith('driftWalls(')), 'called exactly once, and on the predicate')
      .toEqual(['driftWalls(world, psychologistWorksThisWeek(world))'])
    // ...and `accrueSpirit` did NOT swallow it, which is the other half of ruling P.
    const spirit = readFileSync(`${SRC}engine/spirit.ts`, 'utf8')
    const accrue = region(spirit, 'export function accrueSpirit(', 'HER WALLS AND HER REGULATION')
    expect(accrue, '`accrueSpirit` stays draw-free').not.toContain('rngFromSeed')
    // ...and the region really is the function and not a widened slice – it ends where the section
    // banner begins, so it must contain the tail this ruling is about and nothing past it.
    expect(accrue, 'the region really covers the pass').toContain('NOTHING GOES BELOW THIS LINE')
  })
})
