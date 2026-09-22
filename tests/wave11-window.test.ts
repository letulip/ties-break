// =================================================================================================
// WAVE 11, T2 – THE HIDDEN WINDOW: THE ONE-NUMBER LAW, THE DRAW, AND THE WEEKS NOTHING PRICES
// =================================================================================================
//
// `docs/specs/the-weight-2026-09.md` §2, the design `docs/design/the-months-before-she-says-2026-09.md`
// §3, the plan's §T2. In life there are four to eight weeks between conception and «I have something
// to tell you», and she does not always tell at the end of them. The whole of it is one persisted
// week and one draw.
//
// ⚠⚠ THE TWO CLAIMS THIS FILE EXISTS FOR, AND THEY PULL IN OPPOSITE DIRECTIONS.
//   1. THE ONE-NUMBER LAW (§A). `termWeeks: 31` assumed conception AT the announcement, so a window
//      added on top of it would make her pregnancy 43–47 weeks long. The birth therefore rides the
//      CONCEPTION clock, and a zero-window draw has to reproduce every date this engine wrote before
//      the window existed – EXACTLY, against the wave-8 BRIEF's own literals rather than against the
//      new constant, so the two claims cannot prove each other.
//   2. NOTHING PRICES THE WINDOW (§C). «What the parent does inside the window is his own, and
//      innocent… No mechanic prices those weeks» – the design's §3, and the one sentence of this
//      wave that a later refactor is most likely to break by accident, because the record really is
//      sitting there for anything to read.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED. Control GREEN first; each arm applied by a
// scripted string edit and UNDONE by the inverse edit, never `git checkout`.
//
//   ARM 1  `dueWeek: conceivedWeek + termTotalWeeks` ->             2 RED  §A's term-length sweep and
//          `pausesWeek + termWeeks` (the wave-8 formula, which is             §A's announcement-to-birth
//          what a builder who forgot the law would write)                     case. ⚠ §A's ZERO-WINDOW
//                                                                            IDENTITY STAYS GREEN, and
//                                                                            that is the measurement
//                                                                            rather than a gap: at a
//                                                                            zero window the two
//                                                                            formulas are the SAME
//                                                                            arithmetic, which is
//                                                                            exactly what that case
//                                                                            asserts. It is the sweep
//                                                                            over real draws that can
//                                                                            see the law at all
//   ARM 2  the window draw forced to 0 (`return 0` at the head      8 RED  §B's spread, openness and
//          of `drawConceptionWindow`)                                        key cases, both of §C's,
//                                                                            both of §D's and §A's
//                                                                            term sweep. ⚠ THE COUNT IS
//                                                                            FOUR TIMES THE PREDICTION
//                                                                            AND THE REASON IS THE
//                                                                            FIXTURES: `longWindowCareer`
//                                                                            searches 200 seeds for a
//                                                                            real window and THROWS BY
//                                                                            NAME when none exists, so
//                                                                            an arm that kills the
//                                                                            window takes every case
//                                                                            built on one with it. A
//                                                                            fixture that cannot be
//                                                                            built is a louder red than
//                                                                            an assertion, and it is
//                                                                            the right one here
//   ARM 3  the window draw gated on `world.weightEnabled`           6 RED  §B's not-the-weight case –
//          (`enabled ? draw : 0`)                                            the arm the spec warns
//                                                                            about by name – plus the
//                                                                            five cases whose fixtures
//                                                                            need a window, because no
//                                                                            career in this file turns
//                                                                            the switch ON. ⚠ That is
//                                                                            the arm's own finding:
//                                                                            gating the window would
//                                                                            delete it from the
//                                                                            DEFAULT career, which is
//                                                                            every career the game
//                                                                            makes
//   ARM 4  `landPregnancyAnnouncement`'s `world.week <              1 RED  §C's silence walk. ⚠ §D's
//          announcedWeek` guard deleted                                      raise-once case stays
//                                                                            GREEN, measured rather
//                                                                            than predicted: the log
//                                                                            RECEIPT alone already
//                                                                            makes the raise
//                                                                            once-only, so the week
//                                                                            guard's whole job is the
//                                                                            SILENCE and §C is the only
//                                                                            case that can see it
//   ARM 5  the raise re-pointed at `latchedEpisode(world)!`         1 RED  §D's ended-inside-the-
//          instead of `pregnancy.episodeId`                                  window case, which throws
//                                                                            on a null episode – the
//                                                                            decoupling law's own arm
// =================================================================================================

import { describe, it, expect } from 'vitest'
import {
  createWorld,
  drawConceptionWindow,
  endEpisode,
  kidAgeExact,
  landPregnancyAnnouncement,
  lifeLogOf,
  motherhoodBandAt,
  pendingLifeBeat,
  pregnancyChanceAt,
  rollPregnancy,
  setWeightEnabled,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { pregnancyFaceAt } from '../src/shared/avatarEmotion'
import type { LoveEpisode } from '../src/shared/protocol'

// ⚠⚠ THE WAVE-8 BRIEF'S OWN LITERALS, TRANSCRIBED AND NEVER READ OFF `ECONOMY.motherhood`
// (tests/wave3-reaction.test.ts ARM 2's law, and tests/wave8-pregnancy.test.ts's own `BRIEF`). The
// whole of §A is «the new arithmetic reproduces the old one», and an expectation read out of the new
// constant would be the new arithmetic agreeing with itself.
const BRIEF = { playsOnWeeks: 8, termWeeks: 31 } as const

/** The FIRST week she reads at or above `years`, on the engine's own clock. */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

function married(latchedWeek: number, sinceWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** A married career parked on a week the pregnancy hazard really lands on – the engine's own chance
 *  and the engine's own stream, never a transcribed curve. */
function onHitWeek(base: string): WorldState {
  for (let i = 0; i < 200; i++) {
    const seed = i === 0 ? base : `${base}-${i}`
    const probe = createWorld(seed)
    const to = weekAtAge(probe, 35)
    for (let w = weekAtAge(probe, 24); w < to; w++) {
      probe.week = w
      const chance = pregnancyChanceAt(probe)
      if (chance > 0 && rngFromSeed(`${seed}:life:pregnancy:${w}`)() < chance) {
        const world = createWorld(seed)
        world.week = w
        world.season = []
        world.loveEpisodes = [married(w - 104, w - 52)]
        return world
      }
    }
  }
  throw new Error(`no pregnancy hit inside the window for any seed from ${base}`)
}

// =================================================================================================
// A. THE ONE-NUMBER LAW – the birth rides the conception clock
// =================================================================================================

describe('wave 11 T2 A – the one number', () => {
  it('⭐⭐⭐ `termTotalWeeks` IS `playsOnWeeks + termWeeks` – the pin a literal sum cannot keep alone', () => {
    // ⚠⚠ AN OBJECT LITERAL CANNOT REFERENCE ITS OWN SIBLINGS, so `termTotalWeeks: 8 + 31` is written
    // out and would go stale in silence the day somebody retuned either part. This line is what the
    // constant's own note promises instead of a comment.
    const m = ECONOMY.motherhood
    expect(m.termTotalWeeks, 'the whole term is the two shipped halves').toBe(m.playsOnWeeks + m.termWeeks)
    expect(m.termTotalWeeks, 'and the halves are still the brief\'s').toBe(BRIEF.playsOnWeeks + BRIEF.termWeeks)
  })

  it('⭐⭐⭐ a ZERO-window pregnancy reproduces every wave-8 date, exactly', () => {
    // ⚠⚠ THE IDENTITY THE WHOLE LAW IS FOR, and it is asserted against the BRIEF's literals rather
    // than against `ECONOMY.motherhood.termTotalWeeks`, so a retune that moved both could not make
    // this case agree with itself.
    const world = zeroWindowCareer('w11-zero')
    const at = world.week
    rollPregnancy(world)
    const p = world.pregnancy!
    expect(p.conceivedWeek, 'the hazard fired here').toBe(at)
    expect(p.announcedWeek, 'and a zero window means she says it here too').toBe(at)
    expect(p.pausesWeek, 'the entries close eight weeks on, exactly as wave 8 wrote it').toBe(at + BRIEF.playsOnWeeks)
    expect(p.dueWeek, 'and the birth is `pausesWeek + termWeeks`, the wave-8 formula\'s own answer')
      .toBe(at + BRIEF.playsOnWeeks + BRIEF.termWeeks)
  })

  it('⭐⭐ a pregnancy is 39 weeks LIVED whatever the window drew', () => {
    // ⚠ THE SWEEP IS OVER REAL CAREERS AND REAL DRAWS, never over a hand-set window: the claim is
    // about what the engine produces, and a fixture that chose its own windows would be asserting the
    // arithmetic of the test.
    const windows = new Set<number>()
    for (let i = 0; i < 14; i++) {
      const world = onHitWeek(`w11-term-${i}`)
      const at = world.week
      rollPregnancy(world)
      const p = world.pregnancy!
      windows.add(p.announcedWeek - p.conceivedWeek)
      expect(p.dueWeek - p.conceivedWeek, `seed ${i}: conception to birth is the term`).toBe(39)
      expect(p.dueWeek - at, 'and the hazard week IS the conception week').toBe(39)
    }
    // ⚠ THE SWEEP HAS TO CONTAIN MORE THAN ONE WINDOW OR IT IS NOT A SWEEP – a corpus that happened
    // to draw 0 fourteen times would make the claim above vacuous and green.
    expect(windows.size, 'the corpus really did draw more than one window length').toBeGreaterThan(1)
  })

  it('⭐⭐ announcement-to-birth SHRINKS by exactly the window – §8 row 3\'s own sentence', () => {
    for (let i = 0; i < 8; i++) {
      const world = onHitWeek(`w11-shrink-${i}`)
      rollPregnancy(world)
      const p = world.pregnancy!
      const windowWeeks = p.announcedWeek - p.conceivedWeek
      expect(p.dueWeek - p.announcedWeek, `seed ${i}`).toBe(39 - windowWeeks)
    }
  })
})

// =================================================================================================
// B. THE DRAW – its own key, the shipped table, and NOT the weight
// =================================================================================================

describe('wave 11 T2 B – the window is drawn', () => {
  it('⭐ it spreads over the shipped `ECONOMY.life.lag` table and never past its ends', () => {
    const table = ECONOMY.life.lag
    for (const openness of ['open', 'private'] as const) {
      const seen = new Set<number>()
      for (let w = 0; w < 400; w++) seen.add(drawConceptionWindow('w11-spread', w, openness))
      const row = table[openness]
      for (const v of seen) {
        expect(v === 0 || (v >= row.min && v <= row.max), `${openness} drew ${v}`).toBe(true)
      }
      expect(seen.size, `${openness} really spreads`).toBeGreaterThan(1)
    }
  })

  it('⭐⭐ a PRIVATE girl waits longer than an OPEN one – the table read, not a new constant', () => {
    // ⚠ THE CLAIM IS THE TABLE'S, not this wave's: who-she-is §4's openness register, and the same
    // two rows `drawRawLag` reads for an attachment. What this asserts is that the window reads THEM
    // rather than something of its own.
    const mean = (openness: 'open' | 'private'): number => {
      let total = 0
      for (let w = 0; w < 600; w++) total += drawConceptionWindow('w11-mean', w, openness)
      return total / 600
    }
    expect(mean('private'), 'private is the longer wait, by a wide margin').toBeGreaterThan(mean('open') * 2)
  })

  it('⭐⭐⭐ THE WINDOW IS NOT THE WEIGHT – the switch does not gate it', () => {
    // ⚠⚠ THE ARM THE SPEC WARNS ABOUT BY NAME (§2 T2.1: «No draw when the switch is off? ⚠ NO – the
    // window is NOT weight and exists for every pregnancy; only the LOSS is gated»). A builder
    // tidying the two mechanics together would gate this draw and every career with the weight off
    // would announce on the week it conceived – a quiet, invisible regression of the whole T2.
    const off = onHitWeek('w11-switch')
    setWeightEnabled(off, false)
    rollPregnancy(off)
    const on = onHitWeek('w11-switch')
    setWeightEnabled(on, true)
    rollPregnancy(on)
    expect(off.pregnancy!.announcedWeek, 'the same seed draws the same window with the switch off')
      .toBe(on.pregnancy!.announcedWeek)
    expect(off.weightEnabled, 'and the arm really was off').toBe(false)
  })

  it('⚠ the key is the window\'s own and is keyed on the conception week', () => {
    // ⚠ TWO DIFFERENT FACTS MAY NOT SHARE A KEY – the split-key law. `drawRawLag` answers «how late
    // did the parent hear about an ATTACHMENT» on `seed:life:partner:<sinceWeek>:lag`; this answers
    // a different question and has a key of its own. Asserted by the VALUE differing on the same
    // inputs, which is what a shared key could not do.
    const a = drawConceptionWindow('w11-key', 500, 'private')
    const b = drawConceptionWindow('w11-key', 501, 'private')
    const c = drawConceptionWindow('w11-key-other', 500, 'private')
    expect([a, b, c].every((v) => Number.isInteger(v) && v >= 0), 'all three are real weeks').toBe(true)
    expect(a === b && a === c, 'the draw moves with the week AND with the seed').toBe(false)
  })
})

// =================================================================================================
// C. ⭐⭐⭐ NOTHING PRICES THE WINDOW – the design's §3, as a walk
// =================================================================================================

describe('wave 11 T2 C – the weeks he plans in innocence', () => {
  it('⭐⭐⭐ every parent-facing reader is silent from the conception to the week she says it', () => {
    // ⚠⚠ THE LIST IS THE POINT AND IT IS WRITTEN OUT RATHER THAN SUMMARISED: these are the four
    // surfaces that can see a pregnancy at all, and the window has to be invisible to every one of
    // them. A fifth reader added by a later wave belongs on this list on the day it is written.
    const world = longWindowCareer('w11-silence')
    rollPregnancy(world)
    const p = world.pregnancy!
    expect(p.announcedWeek - p.conceivedWeek, 'the fixture really has a window to be silent through')
      .toBeGreaterThan(0)
    for (let w = p.conceivedWeek; w < p.announcedWeek; w++) {
      world.week = w
      landPregnancyAnnouncement(world)
      expect(lifeLogOf(world).filter((r) => r.kind === 'expecting'), `week ${w}: no card`).toHaveLength(0)
      expect(pendingLifeBeat(world), `week ${w}: nothing blocking`).toBe(null)
      expect(motherhoodBandAt(world), `week ${w}: the diary has nothing to say`).toBe(null)
      expect(
        pregnancyFaceAt({ week: w, announcedWeek: p.announcedWeek, dueWeek: p.dueWeek }),
        `week ${w}: and she wears her own face`,
      ).toBe(null)
      expect(w, 'and the entries are open – the gate reads `pausesWeek`, eight weeks past the telling')
        .toBeLessThan(p.pausesWeek)
    }
  })

  it('⭐⭐ the band opens ON the announcement and not one week before it', () => {
    const world = longWindowCareer('w11-band')
    rollPregnancy(world)
    const p = world.pregnancy!
    world.week = p.announcedWeek - 1
    expect(motherhoodBandAt(world), 'the last week of the window is still silent').toBe(null)
    world.week = p.announcedWeek
    expect(motherhoodBandAt(world), 'and the week she says it is `announced`').toBe('announced')
  })
})

// =================================================================================================
// D. THE ANNOUNCEMENT – raised once, and by the RECORD rather than by the marriage
// =================================================================================================

describe('wave 11 T2 D – the week she says it', () => {
  it('⭐⭐⭐ a marriage that ENDS inside the window still gets its announcement', () => {
    // ⚠⚠ THE DECOUPLING LAW'S OWN ARM, and the window is what made it reachable: a divorce inside
    // the window leaves `latchedEpisode` answering `null` on the very week she says she is having a
    // child. §14's banner has always said the id is a reference and never a liveness check; this is
    // the call site that would have broken it, and «a mid-pregnancy divorce is ordinary life»
    // (RULED 20.09) is the sentence it protects.
    const world = longWindowCareer('w11-divorce')
    rollPregnancy(world)
    const p = world.pregnancy!
    const episodeId = p.episodeId
    world.week = p.conceivedWeek + 1
    endEpisode(world, world.week)
    world.week = p.announcedWeek
    landPregnancyAnnouncement(world)
    const rows = lifeLogOf(world).filter((r) => r.kind === 'expecting')
    expect(rows, 'she still says it').toHaveLength(1)
    expect(rows[0].detail, 'and the row still names WHOSE – a reference, not a gate').toBe(episodeId)
  })

  it('⚠ a jumped calendar still raises it – `>=` plus the log\'s own receipt', () => {
    // ⚠ `landPregnancyPause` can afford `===` because a missed feed row is a missed line of texture.
    // A missed ANNOUNCEMENT is a pregnancy that runs to a birth nobody was told about, so the week
    // is a FLOOR and the receipt is the log. The dev fast-forward and any future span-mover are what
    // this is for.
    const world = longWindowCareer('w11-jump')
    rollPregnancy(world)
    const p = world.pregnancy!
    world.week = p.announcedWeek + 9
    landPregnancyAnnouncement(world)
    expect(lifeLogOf(world).filter((r) => r.kind === 'expecting'), 'the card is not lost').toHaveLength(1)
  })
})

// -------------------------------------------------------------------------------------------------
// FIXTURES that need a particular WINDOW – searched for on the engine's own draw, never set by hand
// -------------------------------------------------------------------------------------------------

/** A career whose hazard week draws a window of exactly 0 – the identity §A is about. */
function zeroWindowCareer(base: string): WorldState {
  return careerWithWindow(base, (w) => w === 0)
}

/** ...and one whose window is long enough to walk through. */
function longWindowCareer(base: string): WorldState {
  return careerWithWindow(base, (w) => w >= 3)
}

/** ⚠ THE WINDOW IS FOUND, NOT FORCED. A fixture that wrote `pregnancy.announcedWeek` by hand would
 *  be asserting the test's arithmetic rather than the engine's, which is exactly what §A exists to
 *  refuse. This walks seeds until the engine's own draw produces the shape the case needs, and
 *  throws by name if none does. */
function careerWithWindow(base: string, wants: (windowWeeks: number) => boolean): WorldState {
  for (let i = 0; i < 200; i++) {
    const world = onHitWeek(i === 0 ? base : `${base}-${i}`)
    const probe = { ...world, pregnancy: null } as WorldState
    rollPregnancy(probe)
    if (probe.pregnancy !== null && wants(probe.pregnancy.announcedWeek - probe.pregnancy.conceivedWeek)) {
      return world
    }
  }
  throw new Error(`no seed from ${base} produced the window this case needs`)
}
