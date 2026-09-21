// THE DIARY BAND, WAVE 8b – T2 (C6): the engine half. `motherhoodBandAt`, and nothing else.
//
// The wave-8 hand-back listed «the diary half of T3's pregnancy texture» as one of two things the
// brief asked for and did not ship, stated rather than quietly dropped, with the reason: «a diary
// band needs a new `DiaryFacts` field and claims plumbing». His word of 21.09 is what makes it this
// batch's – and the reason it costs NO SCHEMA MOVE is the whole subject of this file: the fact is
// new, the STATE is not. `pregnancy`, `children` and `comeback` have all been on the world since
// v85, and every band is a read of them.
//
//   §A  the seven bands, walked in order, at their own boundary weeks
//   §B  the seams are DERIVED and not drafted – move the record's dates and they move with it
//   §C  a career that never paused reads null on every week of it
//   §D  the words pool's half is in tests/week-notes.test.ts (`HOLDS.motherhood`, the per-line
//       reached arm, the husband-agnostic arm and his two 21.09 baselines)
//   §E  zero draws
//
// MUTATION LEDGER – measured reds against THIS file and against tests/week-notes.test.ts, each arm
// applied by an exact-string edit and reverted from a copy:
//   ARM 1  line 7's `&& f.motherhoodSupport === 'warm'` dropped   → 2 RED in week-notes.test.ts:
//          from the licence – the warm gate the brief names          the honesty pin and the new
//                                                                    per-line reached arm, by name
//   ARM 2  a band line reworded to name the one she married       → 1 RED: the husband-agnostic arm
//   ARM 3  a band line's `motherhood` claim changed to a          → 2 RED: the honesty pin and the
//          different band than its licence                           per-line reached arm
//   ARM 4  `motherhoodBandAt`'s roster test replaced by           → ⚠⚠ **0 RED ON THE FIRST RUN, AND
//          `week >= dueWeek` (the calendar reading the                THAT IS WHY §A.3 EXISTS.** It
//          function's own comment refuses)                            was predicted at 3 and measured
//                                                                     at 0: every fixture here lands
//                                                                     the birth exactly on the due
//                                                                     week, so the calendar and the
//                                                                     roster agreed everywhere the
//                                                                     file looked. §A.3 («the due
//                                                                     week with no row is not a
//                                                                     birth») was added for it and
//                                                                     the arm RE-MEASURED at 1 RED.
//                                                                     ⭐ The prediction is kept beside
//                                                                     the measurement on purpose: a
//                                                                     ledger that only records the
//                                                                     arms that worked is a ledger
//                                                                     that teaches nothing.
//
// ⚠ ZERO DRAWS ANYWHERE: the band is a pure read. §E counts keys with a positive control rather than
// comparing alignments (wave 3's measured finding, the wave-4 brief's §0.1 law).

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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  comebackAtReturn,
  createWorld,
  kidAgeExact,
  landBirth,
  motherhoodBandAt,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { PREGNANT_LAST_WEEKS } from '../src/shared/avatarEmotion'
import type { LoveEpisode } from '../src/shared/protocol'

// ⚠⚠ THE BRIEF'S OWN LITERALS, TRANSCRIBED AND NEVER READ OFF `ECONOMY.motherhood` – wave 3's ARM 2
// law, kept by every file of this wave: an expectation read out of the thing under test moves with
// it, so a silent retune has to walk past THIS line.
const BRIEF = { playsOnWeeks: 8, termWeeks: 31, lastWeeks: 12, firstRungWeeks: 13 } as const

beforeEach(() => {
  rngKeys.length = 0
})

/** The FIRST week she reads at or above `years` – walked on the engine's own clock. */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** A married career standing at 28, carrying a pregnancy announced on her current week. The RECORD
 *  is the T3 suite's own `expectingFrom` shape – the dates are the brief's arithmetic, not the
 *  economy's – so a retune cannot quietly move what this file measures. */
function expecting(seed: string): WorldState {
  const world = createWorld(seed)
  const week = weekAtAge(world, 28)
  world.season = []
  world.week = week
  world.loveEpisodes = [married(week - 104, week - 52)]
  world.condition = 100
  world.pregnancy = {
    episodeId: world.loveEpisodes[0].id,
    announcedWeek: week,
    pausesWeek: week + BRIEF.playsOnWeeks,
    dueWeek: week + BRIEF.playsOnWeeks + BRIEF.termWeeks,
    support: null,
    rankAtPause: null,
  }
  return world
}

/** The band at a given week, without touching anything else about the world. */
function bandAt(world: WorldState, week: number) {
  world.week = week
  return motherhoodBandAt(world)
}

// =================================================================================================
// A. THE SEVEN BANDS, IN THE ORDER A CAREER MEETS THEM
// =================================================================================================
describe('wave 8b T2 A – the arc, walked at its own boundaries', () => {
  it('⭐⭐⭐ announced · (silence) · early · mid · last, each at the first and last week of its window', () => {
    const world = expecting('w8b-t2-arc')
    const p = world.pregnancy!
    const lastOpens = p.dueWeek - BRIEF.lastWeeks
    const midOpens = p.pausesWeek + Math.ceil((lastOpens - p.pausesWeek) / 2)

    expect(bandAt(world, p.announcedWeek), 'the week she told him').toBe('announced')
    // ⚠ THE EIGHT WEEKS SHE PLAYS ON CARRY NO BAND, and that is a decision rather than a gap: they
    // look like any other week, and a band that spoke about them would say something the player
    // cannot yet see. Both ends of the silence are pinned so a later widening is visible.
    expect(bandAt(world, p.announcedWeek + 1), 'the week after – she is still entering').toBeNull()
    expect(bandAt(world, p.pausesWeek - 1), 'and the last week before the calendar shuts').toBeNull()

    expect(bandAt(world, p.pausesWeek), 'the week entries close').toBe('early')
    expect(bandAt(world, midOpens - 1), 'the last week of the early half').toBe('early')
    expect(bandAt(world, midOpens), 'and the seam').toBe('mid')
    expect(bandAt(world, lastOpens - 1), 'the last week before the picture changes').toBe('mid')
    expect(bandAt(world, lastOpens), 'the portrait\'s own late window opens').toBe('last')
    expect(bandAt(world, p.dueWeek - 1), 'and runs to the week before the birth').toBe('last')
  })

  it('⭐⭐⭐ birth and postpartum – and the boundary is the ROSTER, written by the engine', () => {
    // ⚠⚠ THE ROW IS WRITTEN BY `landBirth`, NEVER POSED. Posing `world.children` would prove this
    // function agrees with a test's idea of a birth rather than with the engine's, and posed state
    // was wave 8's recurring defect class.
    const world = expecting('w8b-t2-birth')
    const p = world.pregnancy!
    world.week = p.dueWeek
    landBirth(world)
    expect(world.children.length, 'the engine really wrote the row').toBe(1)
    expect(world.children[0].bornWeek, 'on the due week').toBe(p.dueWeek)

    expect(bandAt(world, p.dueWeek), 'the week her daughter was born').toBe('birth')
    expect(bandAt(world, p.dueWeek + 1), 'and every week after it, while the record stands').toBe('postpartum')
    expect(bandAt(world, p.dueWeek + 19), 'out to the last week of the decision window').toBe('postpartum')
  })

  it('⭐⭐⭐ the band follows the CHILD and not the calendar – the due week with no row is not a birth', () => {
    // ⚠⚠ THIS CASE EXISTS BECAUSE ARM 4 MEASURED **GREEN** WITHOUT IT, and that is recorded in the
    // ledger rather than quietly fixed. Replacing the roster test with `week >= dueWeek` passed all
    // nine cases: every fixture above lands the birth exactly on the due week, so the calendar and
    // the roster agreed everywhere the file looked – «a behavioural arm cannot see a clause that
    // happens not to matter yet», measured here rather than quoted.
    //
    // ⚠ WHAT THE CLAUSE IS ACTUALLY FOR, and what this pins: `landBirth` is the ONE writer of
    // `world.children` and it carries the guards. A band that read the calendar would call a week a
    // birth because a date had passed – and the day W5 lets a second pregnancy stand beside an older
    // sibling's row, «is there a child» and «is THIS pregnancy's child here» stop being one question.
    const world = expecting('w8b-t2-roster')
    const p = world.pregnancy!
    world.week = p.dueWeek
    expect(world.children, 'the fixture deliberately has not run the birth').toEqual([])
    expect(motherhoodBandAt(world), 'the due week with no row is still the late window').toBe('last')
    landBirth(world)
    expect(motherhoodBandAt(world), '...and the row is what makes it a birth').toBe('birth')
  })

  it('⚠ the record OUTLIVES the birth, so «is there a pregnancy» is not «is she carrying»', () => {
    // The T3 finding this band had to be written around: `landBirth` deliberately clears nothing and
    // `pauseCovering` has no upper bound of its own, so a band hung on the record's nullness would
    // print a pregnancy line for twenty weeks after the child arrived. This is the case that says so.
    const world = expecting('w8b-t2-outlives')
    const p = world.pregnancy!
    world.week = p.dueWeek
    landBirth(world)
    expect(world.pregnancy, 'the record is still there – that is the whole hazard').not.toBeNull()
    for (const week of [p.dueWeek + 2, p.dueWeek + 8, p.dueWeek + 20]) {
      expect(bandAt(world, week), `W${week} is after the child, not before her`).toBe('postpartum')
    }
  })

  it('⭐⭐ and `returned` is the ramp\'s FIRST RUNG, not the rest of her career', () => {
    // ⚠ `world.comeback` NEVER CLEARS, so a band hung on «is there a comeback» would say «the bag is
    // packed again» for fifteen more seasons. The staircase's second rung is where the first step
    // ends, and reading it there means the band cannot drift from the table it is about.
    const world = expecting('w8b-t2-returned')
    const p = world.pregnancy!
    const back = p.dueWeek + 20
    // ⚠ BUILT BY THE ENGINE'S OWN CONSTRUCTOR, `comebackAtReturn` – not a hand-made record – and the
    // pregnancy is cleared exactly as `resolveReturnDecision` clears it on both of its arms.
    world.comeback = comebackAtReturn(p, back)
    world.pregnancy = null

    expect(bandAt(world, back), 'the week she came back').toBe('returned')
    expect(bandAt(world, back + BRIEF.firstRungWeeks - 1), 'the last week of the first rung').toBe('returned')
    expect(bandAt(world, back + BRIEF.firstRungWeeks), 'and the rung ends').toBeNull()
    expect(bandAt(world, back + 400), '...and stays ended, for the rest of the career').toBeNull()
  })

  it('the first rung really is the research\'s three months – 13 weeks of a 52-week year', () => {
    // A claim about the CALENDAR and about the shipped staircase, checked against each other rather
    // than one read out of the other (the wave's own BRIEF discipline).
    expect(BRIEF.firstRungWeeks, 'three months of a 52-week year').toBe(52 / 4)
    expect(ECONOMY.motherhood.comebackStages[1].fromWeeksBack, 'and the table\'s own second rung')
      .toBe(BRIEF.firstRungWeeks)
    expect(BRIEF.lastWeeks, 'and the portrait\'s late stretch is the one the words use')
      .toBe(PREGNANT_LAST_WEEKS)
  })
})

// =================================================================================================
// B. THE SEAMS ARE DERIVED – move the record and they move with it
// =================================================================================================
describe('wave 8b T2 B – no band boundary is a second copy of a constant', () => {
  it('⭐⭐⭐ the `early`/`mid` seam follows the record\'s own dates, with no constant of its own', () => {
    // ⚠ THE POINT OF DERIVING IT. A drafted «ten weeks» would have been a third number about the
    // same term, and a retune of `termWeeks` or of the portrait's window would have left it behind.
    // Move the due date and the seam moves; that is what a derivation buys and what this measures.
    const world = expecting('w8b-t2-seam')
    const p = world.pregnancy!
    const seamOf = (): number => {
      for (let w = p.pausesWeek; w < p.dueWeek; w++) if (bandAt(world, w) === 'mid') return w
      throw new Error('no mid band at all')
    }
    const before = seamOf()
    p.dueWeek += 20
    const after = seamOf()
    expect(after, 'a longer term moves the seam later').toBeGreaterThan(before)
    // ...and it lands where the arithmetic says: the midpoint of what is left after the late window.
    const lastOpens = p.dueWeek - BRIEF.lastWeeks
    expect(after, 'the midpoint of the pause before the picture changes')
      .toBe(p.pausesWeek + Math.ceil((lastOpens - p.pausesWeek) / 2))
  })

  it('⚠ and the `last` window is the PORTRAIT\'s, so the words and the painting change together', () => {
    const world = expecting('w8b-t2-portrait-seam')
    const p = world.pregnancy!
    let firstLast = -1
    for (let w = p.pausesWeek; w < p.dueWeek; w++) {
      if (bandAt(world, w) === 'last') { firstLast = w; break }
    }
    expect(firstLast, 'the band opens exactly where `pregnancyFaceAt` switches paintings')
      .toBe(p.dueWeek - PREGNANT_LAST_WEEKS)
  })
})

// =================================================================================================
// C. A CAREER THAT NEVER PAUSED
// =================================================================================================
describe('wave 8b T2 C – null is every week of every other career', () => {
  it('⭐⭐ no pregnancy, no children, no comeback – the band is null across twenty seasons', () => {
    const world = createWorld('w8b-t2-plain')
    expect(world.pregnancy, 'the fixture really has nothing').toBeNull()
    expect(world.children, 'and nobody was born').toEqual([])
    expect(world.comeback, 'and she never came back from anything').toBeNull()
    for (let w = 0; w < 20 * 52; w += 17) {
      expect(bandAt(world, w), `W${w}: a career with no pregnancy licenses nothing`).toBeNull()
    }
  })
})

// =================================================================================================
// E. THE DRAWS – zero
// =================================================================================================
describe('wave 8b T2 E – the band moves no stream at all', () => {
  it('⚠⚠ the derivation derives NO key – counted, with a positive control', () => {
    const world = expecting('w8b-t2-draws')
    const p = world.pregnancy!
    // ⚠ THE POSITIVE CONTROL FIRST AND ON THE SAME INSTRUMENT: `createWorld` inside `expecting`
    // above really does reach this recorder, so a run that saw nothing anywhere would be a broken
    // recorder rather than a draw-free read.
    expect(rngKeys.length, 'control: the fixture really reached the recorder').toBeGreaterThan(0)
    rngKeys.length = 0
    for (let w = p.announcedWeek; w < p.dueWeek + 40; w++) bandAt(world, w)
    expect(rngKeys, '⚠ the band is a pure read').toEqual([])
  })
})
