// THE PREGNANCY, WAVE 8 – T5: HER DECISION, AND THE ENDING CALLED `'family'` (life/wave-8;
// docs/plans/life-wave-8-builder-2026-09.md §2 T5, constants in `ECONOMY.motherhood`).
//
// T2 shipped the hazard and the record, T3 shut the calendar, T4 brought the child and deliberately
// left `world.pregnancy` whole. This is the week it resolves, and the file has one obligation above
// every other: ⚠⚠ T3's REFUSAL HAS NO UPPER BOUND OF ITS OWN. `pauseCovering` returns the record for
// every event week from `pausesWeek` on and ends only when the record goes null, so a live career
// left holding a pregnancy with no ending and no return has its entries shut FOR EVER – and nothing
// in the suite would say so. §F is that net.
//
//   §A  THE WEEK AND THE **ONE** DRAW – a key COUNT with a positive control, never an alignment
//       comparison (wave 3's finding), and ZERO keys on every other week of the window.
//   §B  THE CHANCE – every grade pinned, the drafted ordering, the clamp, and ⭐ the honest split:
//       a net that goes red if a comeback-SUCCESS constant ever joins `ECONOMY.motherhood`.
//   §C  SHE TRIES – the record cleared, `world.ending` null, and the gate byte-for-byte a career
//       that was never pregnant.
//   §D  SHE DOES NOT – `'family'` latched, `resumesWeek: null`, and the ending view and the album
//       assembled with NO new branch (reached, not merely asserted about).
//   §E  ⭐⭐⭐ THE DECOUPLING ARM, SECOND HALF – the marriage ends mid-term and nothing changes.
//   §F  ⚠⚠ THE TOTALITY OBLIGATION – every path out of the window, and exactly two terminal shapes.
//
// MUTATION LEDGER – every arm run red-first against THIS file, applied by a scripted exact-string
// edit with an md5 receipt before the run and reverted by md5 after it (never `git checkout`,
// CLAUDE.md's own note on what a staged revert restores), each on a re-verified 26-green baseline.
// ⚠ EVERY ARM IS **ONE FILE WRITE**, including the MOVE – T3's harness failure was a move done as
// two edits, whose revert threw and left the tree mutated under the next two arms. ⚠ THE COUNTS ARE
// **MEASURED** REDS AND NOT PREDICTIONS; every one of them was read off the run.
//   ARM 1  the key changed from the record's `decisionWeek` to         → 1 RED: §A.4, the late walk –
//          `world.week` – the coin re-rollable by taking a reveal          and it is the ONLY case
//          late, which invariant 2 forbids by name                        that can see this, which
//                                                                         is why it is written
//   ARM 2  `world.week < decisionWeek` tightened to `!==` – the        → 2 RED: §F.2's jump and §A.4,
//          window that can be MISSED, which is the trap T3 named          whose late world the `!==`
//                                                                         also refuses. That second
//                                                                         red is a coincidence of two
//                                                                         rules, recorded as one
//   ARM 3  `world.pregnancy = null` deleted from the TRY arm – a       → 7 RED: §A.2, §A.5, all three
//          comeback whose entries never re-open, which is T3's            of §C, §E.2 and §F.1
//          finding made real
//   ARM 4  `returnSupportShift` flattened to all-zero – support        → 4 RED: §B.1, §B.2, §B.5's
//          reaching nothing, the digest's own claim deleted                ceiling and §B.7's
//                                                                         read-through
//   ARM 5  a liveness clause added to the head of                      → 4 RED: all three of §E and
//          `resolveReturnDecision` – the decoupling law broken in         §F.1's divorced arm.
//          the one way the 20.09 ruling says is wrong. ⚠ SPELT           `latchedEpisode` is not
//          `world.loveEpisodes.every((e) => e.endedWeek !== null)`        imported into endings.ts,
//                                                                         and adding the import would
//                                                                         have made the arm two edits
//   ARM 6  the `'family'` latch replaced by a bare clear – «she just   → 6 RED: §D.1, §D.2, §D.3,
//          does not come back and nothing happens»                        §B.7, §F.1 and §F.2
//   ARM 7  `resolveReturnDecision(world)` moved BELOW                  → 1 RED: §D.4's call-order pin
//          `resolveLeaving(world)` in `resolveEndings` – the slot          (and nothing else, which is
//          whose upper half this task argued is load-bearing               the pin earning its place:
//                                                                         no behavioural case on this
//                                                                         tree can reach the
//                                                                         collision – see §D.4)
//   ARM 8  `world.pregnancy = null` deleted from the ENDING arm –      → 4 RED: §A.5, §D.3, §F.1 and
//          the half T4's own reasoning would have kept                    §F.2

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's §B apparatus, verbatim and for its reason (T2's,
// T3's and T4's suites carry the same block). Every draw is the engine's own; the mock exists only
// so §A can COUNT the keys a step reached.
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
import { readFileSync } from 'node:fs'
import {
  assembleAlbum,
  buildEndingView,
  closeTournament,
  createWorld,
  decisionWeekOf,
  endEpisode,
  entryStatus,
  guardNotEnded,
  kidAgeExact,
  kidAgeYears,
  pauseCovering,
  resolveEndings,
  resolveLeaving,
  resolveReturnDecision,
  returnChanceFor,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { ALBUM_CLOSING_FAMILY } from '../src/engine/world/albumBook'
import { ENDING_BLURB, ENDING_TITLE, endingForFamily } from '../src/engine/ending'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { at, scriptCodeOf } from './helpers/source'
import type { AlbumPage, LoveEpisode } from '../src/shared/protocol'
import type { PregnancyState } from '../src/engine/world/state'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// ⚠⚠ THE BRIEF'S OWN LITERALS, TRANSCRIBED AND NEVER READ OFF `ECONOMY` – wave 3's ARM 2 law,
// inherited through T2's, T3's and T4's own `BRIEF` blocks: an expectation read out of the thing
// under test moves with it, so a silent retune has to walk past THIS line. `decisionWeeksAfterBirth`
// and `returnBase` are the BRIEF's two numbers here; the four WEIGHTS are the builder's drafts and
// are transcribed too, because §B is exactly the section T9 re-aims when his word lands on them.
const BRIEF = {
  playsOnWeeks: 8,
  termWeeks: 31,
  decisionWeeksAfterBirth: 20,
  returnBase: 0.65,
  warm: 0.15,
  cold: -0.2,
  spiritPerPoint: 0.004,
  bondPerPoint: 0.002,
  agePivot: 30,
  agePerYear: 0.015,
  floor: 0.1,
  ceiling: 0.9,
} as const

/** The neutral career the weights are read against: `ECONOMY.spirit.baseline` and `ECONOMY.bond.start`
 *  are both 70, and a girl under the age pivot takes no age term. */
const NEUTRAL = { spirit: 70, bond: 70, age: 28 } as const

beforeEach(() => {
  rngKeys.length = 0
})

// -------------------------------------------------------------------------------------------------
// FIXTURES – T3's and T4's own, one task on
// -------------------------------------------------------------------------------------------------

/** The FIRST week she reads at or above `years` – walked on the engine's own clock (T2's helper). */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

/** A married row of the v83 shape – `latchedWeek` non-null, `endedWeek` null (T2's helper). */
function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** A married career standing at `age`, funded, fit, with an EMPTY calendar and both meters at their
 *  baselines, so §B's weights are read against a known point.
 *
 *  ⚠ `world.fork` IS SET, AND IT IS NOT DECORATION. `forkDue` is `schoolIsOver(week, birthMonth)`,
 *  which is TRUE of every week of a 28-year-old, so `resolveEndings`' step 7c would raise the fork on
 *  the first call and RETURN – and every case below that drives the real `resolveEndings` would then
 *  be testing a function that stopped two steps above the one under test. A real career at 28 has
 *  answered it a decade ago; this says so. */
function wedded(seed: string, age = 28): WorldState {
  const world = createWorld(seed)
  const week = weekAtAge(world, age)
  world.season = []
  world.week = week
  world.loveEpisodes = [married(week - 104, week - 52)]
  world.condition = 100
  world.fundsCents = 5_000_00
  world.spirit = NEUTRAL.spirit
  world.bond = NEUTRAL.bond
  world.fork = { askedWeek: 0, answer: 'continue', offer: null }
  return world
}

/** The record `rollPregnancy` writes, hand-built on the BRIEF's own arithmetic (T3's `expectingFrom`
 *  with T4's grade argument). */
function expecting(world: WorldState, announcedWeek: number, support: PregnancyState['support']): WorldState {
  const pausesWeek = announcedWeek + BRIEF.playsOnWeeks
  world.pregnancy = {
    episodeId: world.loveEpisodes[0].id,
    // ⚠ v87 – THE HAND-BUILT RECORD KEEPS THE PRE-WINDOW SHAPE, which is what the v86 -> v87
    // migration back-fills on a real save: conception AT the announcement. The window is T2's, and a
    // test about a birth, a return or a pause must not be quietly measuring a window as well.
    conceivedWeek: announcedWeek,
    announcedWeek,
    pausesWeek,
    dueWeek: pausesWeek + BRIEF.termWeeks,
    support,
    // ⚠ v85 T6 – no pause week is walked on this hand-built world, so nothing is frozen.
    rankAtPause: null,
  }
  return world
}

/** What the engine's own coin will say on this world's decision week, computed WITHOUT spending it –
 *  `rngFromSeed` is pure and re-derived at every call site, so reading it here changes nothing. Used
 *  only to SELECT a fixture, never to assert one. */
function coinSaysTry(world: WorldState): boolean {
  const week = decisionWeekOf(world.pregnancy!)
  const chance = returnChanceFor(
    world.pregnancy!.support,
    world.spirit!,
    world.bond!,
    kidAgeYears(week, world.profile.birthMonth, world.profile.birthDay),
  )
  return rngFromSeed(`${world.seed}:life:return:${week}`)() < chance
}

/** ⭐⭐ A CAREER PARKED ON ITS DECISION WEEK WHOSE COIN FALLS THE WAY THE CASE NEEDS – SEARCHED OVER
 *  SEEDS RATHER THAN FORCED.
 *
 *  ⚠ NOTHING IS STUBBED AND NO CHANCE IS BENT: every case below runs the ENGINE's own draw on the
 *  engine's own key, and the search only decides WHICH career the case is posed on. A `Math.random`
 *  replaced, or a chance overwritten to 0 / 1, would make every assertion about the outcome an
 *  assertion about the stub. */
function decided(prefix: string, want: 'tries' | 'stops', support: PregnancyState['support'], age = NEUTRAL.age): WorldState {
  for (let i = 0; i < 500; i++) {
    const world = wedded(`${prefix}-${i}`, age)
    expecting(world, world.week, support)
    world.week = decisionWeekOf(world.pregnancy!)
    if (coinSaysTry(world) === (want === 'tries')) return world
  }
  throw new Error(`no seed under '${prefix}' whose coin says '${want}' at grade ${support}`)
}

/** A controlled event on a world's calendar (T3's helper). */
function injectEvent(world: WorldState, partial: { week: number; tier?: TierId; id?: string }): SeasonEvent {
  const e: SeasonEvent = {
    id: partial.id ?? `t5-${partial.week}-${partial.tier ?? 'local'}`,
    week: partial.week,
    tier: partial.tier ?? 'local',
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: partial.week - 2,
  }
  world.season = [e]
  return e
}

/** Tick one week and answer anything the reveal opens, so a walk cannot stall (T3's helper). */
function tickThrough(world: WorldState, rng: () => number): void {
  tickWeek(world, rng)
  if (world.pendingTournament) {
    skipTournament(world)
    closeTournament(world)
  }
}

/** The BODY of an exported engine function, comments stripped – so a structural claim about the code
 *  cannot be satisfied or broken by prose. ⚠ Cut with an explicit start marker and a brace walk
 *  rather than a raw `indexOf` slice, which is CLAUDE.md's own gotcha: a rotted marker must throw
 *  instead of silently widening the region to the rest of the file. (T4's helper, with the FILE now
 *  an argument – T5's step lives in `world/endings.ts`, because only that file may latch.) */
function engineFunctionSource(file: string, name: string): string {
  const src = readFileSync(file, 'utf8')
  const start = src.indexOf(`export function ${name}(`)
  if (start < 0) throw new Error(`no exported function '${name}' in ${file}`)
  let depth = 0
  const i = src.indexOf('{', start)
  if (i < 0) throw new Error(`no body for '${name}'`)
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth += 1
    else if (src[j] === '}') {
      depth -= 1
      if (depth === 0) {
        return src
          .slice(i, j + 1)
          .split('\n')
          .map((line) => line.replace(/(^|\s)\/\/.*$/, '$1'))
          .join('\n')
      }
    }
  }
  throw new Error(`unbalanced body for '${name}'`)
}

// =================================================================================================
// A. THE WEEK AND THE ONE DRAW
// =================================================================================================
//
// ⚠⚠ «ONE draw on `seed:life:return:<week>`» is the brief's own sentence and the whole model hangs
// off it: a hazard rolled once a week for twenty weeks at the same constant compounds to
// 1 − 0.35^20, which is certainty, and T9 would be benching a number nobody wrote. The net is a KEY
// COUNT with a positive control (wave 3's measured finding, never an alignment comparison).
describe('wave 8 T5 A – ONE draw, on the window\'s own week, and none on any other', () => {
  it('⭐ the decision week is `dueWeek` + the drafted window, in ONE spelling', () => {
    const world = wedded('w8-ret-week')
    expecting(world, world.week, 'measured')
    const p = world.pregnancy!
    expect(decisionWeekOf(p)).toBe(p.dueWeek + BRIEF.decisionWeeksAfterBirth)
    // ⚠ AND THE WHOLE ABSENCE IS 51 WEEKS – `termWeeks` + this, the span `pauseCovering` refuses over
    // and the number the `'family'` ending's own detail line prints.
    expect(decisionWeekOf(p) - p.pausesWeek).toBe(BRIEF.termWeeks + BRIEF.decisionWeeksAfterBirth)
  })

  it('⭐⭐⭐ the WHOLE window takes exactly ONE key, and it is the decision week\'s', () => {
    const world = decided('w8-ret-count', 'tries', 'measured')
    const p = world.pregnancy!
    const decisionWeek = decisionWeekOf(p)
    rngKeys.length = 0
    // walk from the birth to twelve weeks past the decision, calling the step on every week of it
    for (let w = p.dueWeek; w <= decisionWeek + 12; w++) {
      world.week = w
      resolveReturnDecision(world)
    }
    expect(rngKeys, 'thirty-three weeks, one coin').toEqual([`${world.seed}:life:return:${decisionWeek}`])
    // ⭐ THE POSITIVE CONTROL: the counter is not simply blind. A career whose window has not come
    // round takes zero keys from the same recorder, in the same test, one line apart.
    const early = decided('w8-ret-count-early', 'tries', 'measured')
    early.week = decisionWeekOf(early.pregnancy!) - 1
    rngKeys.length = 0
    resolveReturnDecision(early)
    expect(rngKeys, 'the week before the date is an ordinary week').toEqual([])
    expect(early.pregnancy, 'and nothing resolved').not.toBeNull()
  })

  it('⚠ ZERO draws on every week of the pause before the date – the pregnancy, the pause and the birth', () => {
    const world = decided('w8-ret-silent', 'stops', 'warm')
    const p = world.pregnancy!
    for (const w of [p.announcedWeek, p.pausesWeek, p.dueWeek, p.dueWeek + 1, decisionWeekOf(p) - 1]) {
      world.week = w
      rngKeys.length = 0
      resolveReturnDecision(world)
      expect(rngKeys, `week ${w}: nothing is decided yet`).toEqual([])
      expect(world.ending, `week ${w}: and nothing latched`).toBeNull()
    }
  })

  it('⭐⭐ the KEY carries the RECORD\'s week, not `world.week` – a late reveal cannot re-roll her', () => {
    // ⚠ INPUT-INDEPENDENCE IS PERMANENT LAW (invariant 2). `resolveEndings` runs every week, but a
    // player who leaves a reveal unopened reaches it late, and `resolveLeaving`'s own key carries the
    // SEASON for exactly this reason. ARM 1 is the version keyed on `world.week`.
    const punctual = decided('w8-ret-key', 'stops', 'cold')
    const decisionWeek = decisionWeekOf(punctual.pregnancy!)
    const late = decided('w8-ret-key', 'stops', 'cold')
    late.week = decisionWeek + 3

    rngKeys.length = 0
    resolveReturnDecision(punctual)
    const onTime = [...rngKeys]
    rngKeys.length = 0
    resolveReturnDecision(late)
    expect(rngKeys, 'three weeks late, the same coin').toEqual(onTime)
    expect(rngKeys).toEqual([`${punctual.seed}:life:return:${decisionWeek}`])
    expect(late.ending?.type, 'and the same outcome').toBe(punctual.ending?.type)
  })

  it('⚠⚠ it is IDEMPOTENT ON BOTH ARMS, standalone – a second call draws nothing and changes nothing', () => {
    for (const want of ['tries', 'stops'] as const) {
      const world = decided(`w8-ret-once-${want}`, want, 'measured')
      resolveReturnDecision(world)
      const events = world.events.length
      const ending = world.ending
      rngKeys.length = 0
      world.week += 5
      resolveReturnDecision(world)
      resolveReturnDecision(world)
      expect(rngKeys, `${want}: the coin is spent`).toEqual([])
      expect(world.events.length, `${want}: and no second row`).toBe(events)
      expect(world.ending, `${want}: and no second latch`).toBe(ending)
    }
  })
})

// =================================================================================================
// B. THE CHANCE – every grade pinned, and the honest split held open
// =================================================================================================
describe('wave 8 T5 B – `support` is the biggest term, and nothing here is a success rate', () => {
  it('⭐⭐⭐ the three grades at the neutral point – 0.80 / 0.65 / 0.45, and the base IS `measured`', () => {
    const { spirit, bond, age } = NEUTRAL
    expect(returnChanceFor('warm', spirit, bond, age)).toBeCloseTo(BRIEF.returnBase + BRIEF.warm, 10)
    expect(returnChanceFor('measured', spirit, bond, age)).toBeCloseTo(BRIEF.returnBase, 10)
    expect(returnChanceFor('cold', spirit, bond, age)).toBeCloseTo(BRIEF.returnBase + BRIEF.cold, 10)
    // ⚠ A `null` GRADE READS THE `measured` CELL and is not a fourth column – the same `??` courtesy
    // `postpartumSupportScale` gives a probe world one task down.
    expect(returnChanceFor(null, spirit, bond, age)).toBeCloseTo(BRIEF.returnBase, 10)
  })

  it('⭐⭐ the spread is BIGGER than every other term put together at realistic inputs', () => {
    const { spirit, bond, age } = NEUTRAL
    const spread = returnChanceFor('warm', spirit, bond, age) - returnChanceFor('cold', spirit, bond, age)
    expect(spread, 'warm to cold').toBeCloseTo(BRIEF.warm - BRIEF.cold, 10)
    // the rest, at the bands a career really sits in at the decision week: spirit ±10, bond ±15, and
    // the age term from the pivot to the oldest reachable decision (conception at 35 → ~36.7)
    const others =
      2 * 10 * BRIEF.spiritPerPoint + 2 * 15 * BRIEF.bondPerPoint + (36 - BRIEF.agePivot) * BRIEF.agePerYear
    expect(spread, 'the digest\'s own «support only» made arithmetic').toBeGreaterThan(others)
  })

  it('⚠ `spirit` and `bond` move it in the drafted direction, and bond is HALF of spirit per point', () => {
    const { spirit, bond, age } = NEUTRAL
    const base = returnChanceFor('measured', spirit, bond, age)
    expect(returnChanceFor('measured', spirit + 20, bond, age) - base).toBeCloseTo(20 * BRIEF.spiritPerPoint, 10)
    expect(returnChanceFor('measured', spirit - 20, bond, age) - base).toBeCloseTo(-20 * BRIEF.spiritPerPoint, 10)
    expect(returnChanceFor('measured', spirit, bond + 20, age) - base).toBeCloseTo(20 * BRIEF.bondPerPoint, 10)
    // §4a's law in arithmetic: her life moves `spirit`, his words move `bond`, so his number sits
    // behind hers in a decision that is hers.
    expect(BRIEF.bondPerPoint * 2).toBeCloseTo(BRIEF.spiritPerPoint, 10)
  })

  it('⚠ the age term is ONE-SIDED and counts WHOLE years past the pivot', () => {
    const { spirit, bond } = NEUTRAL
    const base = returnChanceFor('measured', spirit, bond, BRIEF.agePivot)
    expect(returnChanceFor('measured', spirit, bond, BRIEF.agePivot - 6), 'youth is the default').toBeCloseTo(base, 10)
    expect(returnChanceFor('measured', spirit, bond, BRIEF.agePivot), 'and the pivot itself pays nothing').toBeCloseTo(
      BRIEF.returnBase,
      10,
    )
    expect(returnChanceFor('measured', spirit, bond, BRIEF.agePivot + 4) - base).toBeCloseTo(-4 * BRIEF.agePerYear, 10)
    // a birthday and not a fortnight – `kidAgeYears`' own grain everywhere else this layer reads an age
    expect(returnChanceFor('measured', spirit, bond, BRIEF.agePivot + 4.9)).toBeCloseTo(
      returnChanceFor('measured', spirit, bond, BRIEF.agePivot + 4),
      10,
    )
  })

  it('⚠⚠ the band holds at both ends – no career is ever CERTAIN either way', () => {
    // the sum really does run off the end: cold + spirit 0 + bond 0 + 40 is −0.12 before the clamp
    expect(returnChanceFor('cold', 0, 0, 40)).toBeCloseTo(BRIEF.floor, 10)
    expect(returnChanceFor('warm', 100, 100, 24)).toBeCloseTo(BRIEF.ceiling, 10)
    // ...and the unclamped arithmetic is what the floor is catching, said out loud so the case cannot
    // pass because the terms happened to be small.
    const raw =
      BRIEF.returnBase + BRIEF.cold + (0 - 70) * BRIEF.spiritPerPoint + (0 - 70) * BRIEF.bondPerPoint -
      (40 - BRIEF.agePivot) * BRIEF.agePerYear
    expect(raw, 'without the band this is a negative probability').toBeLessThan(0)
  })

  it('⭐⭐⭐ THE HONEST SPLIT – no constant in `ECONOMY.motherhood` decides whether the comeback WORKED', () => {
    // ⚠⚠ THE RESEARCH'S «~40%» IS «of mothers, return SUCCESSFULLY» AND THE MODEL SPLITS IT: this
    // draw answers «does she TRY», and whether the comeback succeeds is EMERGENT from T6's pricing
    // and MEASURED, never drawn. T9 checks the PRODUCT (0.65 × ~0.6 ≈ 0.4) rather than forcing either
    // factor, and that check is only meaningful while the second factor has no constant of its own.
    // So the block's keys are enumerated: a `comebackSuccessChance` added here goes RED on this line
    // instead of quietly collapsing an honest two-factor model into one number.
    expect(Object.keys(ECONOMY.motherhood).sort()).toEqual(
      [
        'careerFirstBond',
        // ⚠ RE-AIMED 21.09 BY WAVE 9's T2, third time this guard has asked its question and third
        // time the answer is no. `childSmallWeeks` is the AGE WINDOW a spirit perturbation reads off
        // the child's own `bornWeek` (`awayFromSmallChild`, `engine/spirit.ts`) – how long «small»
        // lasts, nothing more. It decides no probability, it is read by no decision, and the
        // comeback's success stays emergent and measured.
        'childSmallWeeks',
        'decisionWeeksAfterBirth',
        // ⚠ RE-AIMED 23.09 BY WAVE 11's REVIEW – fourth time this guard has asked its question,
        // fourth time the answer is no. `firstTrimesterWeeks` is the CAP on the pause (the builder's
        // question 1: a 12-week window put her last event at pregnancy week 20, against the
        // research), read in exactly one place beside `playsOnWeeks` at the announcement. It prices
        // a CALENDAR – when the entries close – and no probability anywhere; the comeback's success
        // stays emergent and measured.
        'firstTrimesterWeeks',
        'joyBond',
        'perWeekByAge',
        'playsOnWeeks',
        'returnAgePerYearOver',
        'returnAgePivotYears',
        'returnBase',
        'returnBondPerPoint',
        'returnChanceMax',
        'returnChanceMin',
        'returnSpiritPerPoint',
        // ⚠ RE-AIMED 21.09 BY WAVE 9's T3 – three keys at once, and the guard's question gets the
        // same answer for all three. `repeatPerWeekByAge` and `repeatCountFactor` are the SECOND
        // child's hazard (his digest's «28–38 | 1–2%» and the design's «a third stays rare»), and
        // `repeatCooldownWeeks` is how soon after a birth the next may start. All three decide
        // whether a pregnancy BEGINS; not one of them reads, writes or scales whether a comeback
        // worked, which stays emergent and measured.
        'repeatCooldownWeeks',
        'repeatCountFactor',
        'repeatPerWeekByAge',
        // ⚠ RE-AIMED 21.09 BY WAVE 9's T5, and this pair is the closest the guard has come to a real
        // catch: `returnPoiseCeiling` and `returnPoiseMax` are the only skill-adjacent numbers this
        // branch has. They are still not success rates – they raise her composure CEILING
        // (`motherhoodPoiseOf`, `engine/development.ts`), which ordinary development then climbs
        // into, and nothing reads them to decide whether a comeback worked. ⚠ What they DO need, and
        // have, is a bench and a spec row: invariant 5, because a skill number is exactly the kind of
        // thing this guard cannot check.
        'returnPoiseCeiling',
        'returnPoiseMax',
        'returnSupportShift',
        // ⚠⚠ RE-AIMED 22.09 BY WAVE 11's T2 (the hidden window), and the guard asked its question a
        // seventh time and got the same answer. `termTotalWeeks` is the WHOLE TERM measured from the
        // conception – the one-number law (docs/specs/the-weight-2026-09.md §2), written as the sum
        // `playsOnWeeks + termWeeks` it is. It decides a DATE and not a probability: the birth's week.
        // Nothing reads it to decide whether a comeback worked, which stays emergent and measured.
        'termTotalWeeks',
        // ⚠⚠ RE-AIMED 21.09 BY HIS HOLD RULING, and once again the guard did its job: a key joined
        // the block and somebody had to look at it and say whether it is a success rate. IT IS NOT.
        // `smallFirstHoldWeeks` is how long the `small-first` ANSWER keeps calling a big draw
        // off-plan (`EntryStatus.offReturnPlan`, `world/medical.ts`) – a LABEL on a preference the
        // player overrides week to week, never a refusal and never a probability. Nothing reads it
        // to decide whether a comeback worked; what it moves is which of her own entries the card
        // calls off-plan, and the comeback's success stays EMERGENT and measured (§15.5's five arms).
        'smallFirstHoldWeeks',
        'termWeeks',
        'worryBond',
        // ⚠⚠ RE-AIMED 20.09 BY v85 T6, AND THE RE-AIM IS THIS GUARD DOING EXACTLY WHAT IT WAS BUILT
        // FOR rather than an inconvenience: two keys joined the block and somebody had to look at
        // them and say whether either is a success rate. NEITHER IS, and the reason is the same for
        // both – they are the RULED freeze (20.09: 12 entries / 156 weeks), an ENTITLEMENT about which
        // entry lists will take her, and nothing anywhere reads them to decide whether a comeback
        // WORKED. What decides that is still emergent: the staged factor loses her the matches, the
        // ranking window ages her points out, and T9 MEASURES the share. A
        // `comebackSuccessChance` added here would still go RED on this line, which is the whole
        // property T5 wrote it for and it is unchanged.
        'protectedRankEntries',
        'protectedRankWeeks',
        // ⚠ AND THE STAGED FACTOR'S STAIRCASE, T6's half 2 – four factors over four windows, a
        // function of `world.comeback.returnedWeek` and NOTHING ELSE. It prices MATCHES, not
        // outcomes: it is the mechanism whose RESULT T9 measures, which is the opposite of a constant
        // that decides the result. §0's parked-spec fence is written at its definition.
        'comebackStages',
      ].sort(),
    )
    // and the sanity line itself, as the PRODUCT it is – stated here so nobody has to reconstruct it
    const tries = returnChanceFor('measured', NEUTRAL.spirit, NEUTRAL.bond, NEUTRAL.age)
    expect(tries * 0.6, 'the digest\'s ~40%, read as two factors').toBeGreaterThan(0.35)
    expect(tries * 0.6).toBeLessThan(0.45)
  })

  it('⚠ the grades really reach the ENGINE – three careers on one seed, three different outcomes', () => {
    // ⭐ THE READ-THROUGH, so §B is not twelve assertions about a pure function nobody calls. One
    // seed, one decision week, one coin – and the coin lands between the cold and the warm rates, so
    // the SAME career comes back on `warm` and does not on `cold`. ARM 4 (support flattened) is red
    // here because all three then take the same answer.
    for (let i = 0; i < 500; i++) {
      const seed = `w8-ret-through-${i}`
      const worlds = (['warm', 'measured', 'cold'] as const).map((grade) => {
        const world = wedded(seed)
        expecting(world, world.week, grade)
        world.week = decisionWeekOf(world.pregnancy!)
        return world
      })
      const roll = rngFromSeed(`${worlds[0].seed}:life:return:${worlds[0].week}`)()
      if (roll < BRIEF.returnBase + BRIEF.cold || roll >= BRIEF.returnBase + BRIEF.warm) continue
      for (const world of worlds) resolveReturnDecision(world)
      expect(worlds[0].ending, 'warm: she tries').toBeNull()
      expect(worlds[2].ending?.type, 'cold: the same coin ends the career').toBe('family')
      return
    }
    throw new Error('no seed whose coin falls between the cold and the warm rates')
  })
})

// =================================================================================================
// C. SHE TRIES – the record cleared, the career alive, T6's seat untouched
// =================================================================================================
describe('wave 8 T5 C – the try arm leaves an ordinary career and an open calendar', () => {
  it('⭐⭐⭐ the record is cleared, nothing latches, and ONE kept row says so', () => {
    const world = decided('w8-ret-try', 'tries', 'warm')
    const before = world.events.length
    resolveReturnDecision(world)
    expect(world.pregnancy, 'the window closes with the record').toBeNull()
    expect(world.ending, 'and the career is still hers to play').toBeNull()
    const rows = world.events.slice(before)
    expect(rows, 'one row, and one only').toHaveLength(1)
    expect(rows[0].keep, 'kept past the sixty-week prune – the arc is longer than the window').toBe(true)
    // ⚠ IT SAYS SHE IS TRYING AND NEVER THAT SHE IS BACK: whether the comeback works is T6's pricing
    // and T9's measurement, and a row that announced an outcome would be the model claiming one.
    expect(rows[0].text).not.toMatch(/\bis back\b/i)
    expect(() => guardNotEnded(world), 'and every command still runs').not.toThrow()
  })

  it('⭐⭐ the ENTRY GATE is identical to a career that was never pregnant – the whole point of the clear', () => {
    // ⚠⚠ T3's REFUSAL HAS NO UPPER BOUND OF ITS OWN, so this is the assertion that the 51 weeks really
    // ended. The control is the SAME seed with no record at all – a comparison against a career, not
    // against a hard-coded verdict. ARM 3 (the clear deleted) is red here and stays red for ever after.
    const world = decided('w8-ret-open', 'tries', 'warm')
    const week = world.week
    const control = wedded(world.seed)
    control.week = week

    resolveReturnDecision(world)
    expect(world.pregnancy).toBeNull()
    for (const w of [week, week + 1, week + 9]) {
      expect(pauseCovering(world, w), `week ${w}: nothing covers it any more`).toBeNull()
      const event = injectEvent(world, { week: w + 2, id: `open-${w}` })
      const same = injectEvent(control, { week: w + 2, id: `open-${w}` })
      expect(entryStatus(world, event), `week ${w}: the gate answers as it would for anybody`).toEqual(
        entryStatus(control, same),
      )
    }
  })

  it('⚠ the career TICKS ON – the engine\'s own weeks, past the decision and out the other side', () => {
    const world = decided('w8-ret-tick', 'tries', 'measured')
    const decisionWeek = world.week
    world.week = decisionWeek - 4
    const rng = rngFromSeed(`${world.seed}:main`)
    while (world.week <= decisionWeek + 6) tickThrough(world, rng)
    expect(world.pregnancy, 'the real tick resolved it').toBeNull()
    expect(world.ending, 'and did not end her').toBeNull()
    expect(world.week, 'and the weeks went on').toBeGreaterThan(decisionWeek + 6)
  })

  it('⚠⚠ `world.comeback` IS FILLED AT THE SEAM – T6 landed, and it is the ONE writer that key has', () => {
    // ⚠ RE-AIMED 20.09 BY v85 T6, AND THE RE-AIM IS THE POINT RATHER THAN A REPAIR. T5 asserted the
    // seat was UNTOUCHED because T5 was the task that left the seam; asserting that again would be
    // asserting that the next task never ran. What survives, and is what the line was really about,
    // is «T6 is the only writer this key will ever have» – so the case now reads the same claim from
    // the other side: the record appears on the TRY arm, on the week the decision resolves, and it
    // appears nowhere else in this file's walks.
    const world = decided('w8-ret-seam', 'tries', 'warm')
    expect(world.comeback, 'nothing before the decision writes it').toBeNull()
    const week = world.week
    resolveReturnDecision(world)
    expect(world.comeback, 'the try arm fills the seat').not.toBeNull()
    expect(world.comeback!.returnedWeek, 'stamped with the week she came back').toBe(week)
    // ⚠ AND NOTHING WAS FROZEN, which is right and is the reason this case can stay in T5's file:
    // `decided` builds its record by hand and never walks a pause week, so `rankAtPause` is null and
    // a comeback with no entitlement is exactly what that career earned. The freeze's own cases live
    // in tests/wave8-protected-rank.test.ts.
    expect(world.comeback!.protectedRank, 'she paused with nothing this fixture ever captured').toBeNull()
  })
})

// =================================================================================================
// D. SHE DOES NOT – `'family'`, and the screens that must not need a new branch
// =================================================================================================
describe('wave 8 T5 D – the ninth ending latches through the ONE seam every other one uses', () => {
  it('⭐⭐⭐ the latch is `\'family\'`, `resumesWeek` null, and the feed carries the record', () => {
    const world = decided('w8-fam-latch', 'stops', 'cold')
    const p = world.pregnancy!
    const weeksAway = world.week - p.pausesWeek
    const ageYears = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
    resolveReturnDecision(world)
    expect(world.ending).toEqual({
      type: 'family',
      week: world.week,
      ageYears,
      // ⚠ OFF THE REAL PRODUCER, never a transcription – a hand-written fragment would pass this while
      // the engine wrote something else.
      detail: endingForFamily(world.week, ageYears, weeksAway).detail,
      resumesWeek: null,
    })
    expect(weeksAway, 'the absence the detail names').toBe(BRIEF.termWeeks + BRIEF.decisionWeeksAfterBirth)
    const row = world.events.find((e) => e.text.startsWith(ENDING_TITLE.family))
    expect(row, 'the latch wrote the record\'s own line').toBeDefined()
    expect(row!.text).toBe(`${ENDING_TITLE.family} – ${world.ending!.detail}.`)
    expect(row!.text, 'and no long dash reached the player\'s record').not.toMatch(/[—―]/)
  })

  it('⭐⭐⭐ the FOUR total records answer, and the epilogue and the album ASSEMBLE – no new branch', () => {
    // ⚠⚠ THIS IS THE ACCEPTANCE TEST OF WAVE 7½'s TOTALITY CLAIM AND IT IS REACHED, NOT ASSERTED
    // ABOUT: `buildEndingView` and `assembleAlbum` are CALLED on a `'family'` world and their output
    // is read. If either had needed an `if (type === 'family')` this case is where it would have been
    // discovered, and the finding would have gone to the owner rather than into a patch.
    const world = decided('w8-fam-screens', 'stops', 'cold')
    resolveReturnDecision(world)
    expect(ENDING_TITLE.family, 'the title').toBeTruthy()
    expect(ENDING_BLURB.family, 'the blurb').toBeTruthy()
    expect(ALBUM_CLOSING_FAMILY.family, 'the last page\'s family – «a life completed, not a career failed»').toBe(
      'decision',
    )

    const view = buildEndingView(world)
    expect(view, 'the epilogue built').not.toBeNull()
    expect(view!.ending.type).toBe('family')
    expect(view!.handoff.resumesWeek, 'nothing on the other side of this one').toBeNull()
    expect(view!.album, 'and the album came with it').toHaveLength(7)

    // ⭐⭐⭐ AND HERE IS THE TOTALITY CLAIM MEASURED RATHER THAN ASSERTED. The SAME world is read once
    // as `'family'` and once as `'stopped'` – the other `decision` ending – and the two epilogues
    // differ in the TITLE STRING and in nothing else at all. An ending the machinery had never seen
    // composes the same page as one it has known since v39, because the page is built out of the four
    // total records and not out of a branch. ARM 6 (the latch replaced by a bare clear) is red here
    // because there is no ending to read.
    const control = buildEndingView({
      ...world,
      ending: { ...world.ending!, type: 'stopped' },
    })
    const swap = (pages: AlbumPage[], title: string) =>
      pages.map((p) => (p.why === title ? { ...p, why: '<the title>' } : p))
    expect(swap(view!.album, ENDING_TITLE.family), 'page for page').toEqual(
      swap(control!.album, ENDING_TITLE.stopped),
    )
    // ...including HER FACE, which is the one of the four records this comparison would otherwise
    // hide: both take `serious`, and that is the drafted answer rather than an accident.
    expect(view!.album[6].emotion, 'the last week\'s face').toBe(control!.album[6].emotion)

    // ⚠ THE SCROLL AND THE BOOK ASSEMBLE TOO, and the scroll is EMPTY here for a reason that is not
    // about the ending: this probe has never banked a season (`world.seasonHistory` is []), so it has
    // no rows to write. What the case can honestly claim is that the call returns rather than throws.
    expect(Array.isArray(view!.scroll), 'the scroll assembled').toBe(true)
    const book = assembleAlbum(world)
    const stoppedBook = assembleAlbum({ ...world, ending: { ...world.ending!, type: 'stopped' } })
    expect(book.sheets.length, 'the book assembled for an ending it had never seen').toBeGreaterThan(0)
    expect(book.sheets.length, 'and `decision` really is what it read – `stopped` builds the same book').toBe(
      stoppedBook.sheets.length,
    )
  })

  it('⚠⚠ the record is cleared on THIS arm too – the record never survives the function', () => {
    // ⚠ THE ONE PLACE T5 PARTS FROM T4's REASONING, and it is what makes the obligation ONE sentence:
    // after this function `world.pregnancy` is null whichever way the coin fell, so the step is
    // idempotent standalone rather than only because `resolveEndings` checks `world.ending` above it.
    // ARM 8 is the version that keeps it.
    const world = decided('w8-fam-clear', 'stops', 'cold')
    resolveReturnDecision(world)
    expect(world.pregnancy, 'nothing is left for a gate to trip over').toBeNull()
    expect(() => guardNotEnded(world), 'and the career refuses every command').toThrow()
  })

  it('⭐⭐ THE SLOT – the decision is asked BELOW the two that happen to her and ABOVE the two doors', () => {
    // ⚠⚠ THE UPPER HALF IS LOAD-BEARING: `resolveLeaving` fires on the off-season wrap week and a
    // decision week can BE that week, so on a collision the fall door's own sentence («She stopped
    // after the fall») would be told about a season she spent off tour – his 20.09 blocker's defect
    // class exactly. Running first settles it through machinery that already exists. ARM 7 moves the
    // call below `resolveLeaving` and this is where it reds – and it reds ONLY here, which is the pin
    // earning its place rather than a weakness. ⚠ THE COLLISION IS NOT REACHABLE FROM A PROBE WORLD
    // ON THIS TREE: `fallLeavingDue` needs two banked `seasonHistory` rows on the WTA track, the
    // `activeLadderOf` read behind them, AND a 1% coin, so a behavioural case would be a fixture
    // built against five gates for one ordering claim. The ORDER is what the ruling is about,
    // and a call-order pin is this repo's own instrument for it (`tests/spirit.test.ts`'s, which has
    // fired for four waves running).
    const code = scriptCodeOf(readFileSync('src/engine/world/endings.ts', 'utf8'))
    expect(at(code, 'detectEnding('), 'below the two that happen to her').toBeLessThan(
      at(code, 'resolveReturnDecision(world)'),
    )
    expect(at(code, 'resolveReturnDecision(world)'), 'above the two she decides herself').toBeLessThan(
      at(code, 'resolveLeaving(world)'),
    )
    // ...and the mechanism the ordering leans on, asserted rather than assumed: once `'family'` is
    // latched, round 45's step declines on its own first line and needs no edit from this wave.
    const world = decided('w8-fam-order', 'stops', 'cold')
    resolveReturnDecision(world)
    const latched = world.ending
    resolveLeaving(world)
    expect(world.ending, 'the two doors decline a career that has already stopped').toBe(latched)
  })
})

// =================================================================================================
// E. ⭐⭐⭐ THE DECOUPLING ARM, SECOND HALF – «развелись и развелись, жизнь продолжается» (RULED 20.09)
// =================================================================================================
//
// T4 proved the BIRTH needs no `if` about the episode. The brief's acceptance test spans both tasks:
// «a test walks a career through a mid-term ending to the birth AND the return, and it must pass with
// zero special-case code». This is the return half.
describe('wave 8 T5 E – a marriage that ended mid-term reaches the same decision and the same ending', () => {
  it('⭐⭐⭐ the divorced arm and the intact arm are IDENTICAL, coin for coin', () => {
    const intact = decided('w8-ret-decoupled', 'stops', 'measured')
    const divorced = decided('w8-ret-decoupled', 'stops', 'measured')
    // the marriage ends halfway to the birth, through the engine's OWN writer
    endEpisode(divorced, divorced.pregnancy!.pausesWeek + 5)

    rngKeys.length = 0
    resolveReturnDecision(intact)
    const intactKeys = [...rngKeys]
    rngKeys.length = 0
    resolveReturnDecision(divorced)
    expect(rngKeys, 'the same coin on the same key').toEqual(intactKeys)
    expect(divorced.ending, 'the same ending, field for field').toEqual(intact.ending)
    expect(divorced.pregnancy, 'and the same clear').toEqual(intact.pregnancy)
  })

  it('⚠ and the TRY arm too, walked through the real tick from a dead marriage', () => {
    const world = decided('w8-ret-decoupled-try', 'tries', 'warm')
    const decisionWeek = world.week
    endEpisode(world, world.pregnancy!.pausesWeek)
    world.week = decisionWeek - 3
    const rng = rngFromSeed(`${world.seed}:main`)
    while (world.week <= decisionWeek + 2) tickThrough(world, rng)
    expect(world.pregnancy, 'life went on, and so did the calendar').toBeNull()
    expect(world.ending, 'and she was not ended for being alone').toBeNull()
  })

  it('⚠⚠ the SOURCE carries no liveness clause – the law, asserted structurally', () => {
    // ⚠ A STRUCTURAL PIN BECAUSE THE BEHAVIOURAL ONES CANNOT SEE THE SHAPE: the two arms above would
    // stay green if somebody read the episode for a reason that happens not to matter yet, and the
    // ruling is about the CODE. T4 pinned `landBirth` the same way with the same four names.
    const source = engineFunctionSource('src/engine/world/endings.ts', 'resolveReturnDecision')
    for (const forbidden of ['latchedEpisode', 'endedWeek', 'loveEpisodes', 'episodeId']) {
      expect(source, `the decision may not ask about ${forbidden}`).not.toContain(forbidden)
    }
    expect(source, 'it reads the record, and that is what it reads').toContain('world.pregnancy')
  })
})

// =================================================================================================
// F. ⚠⚠ THE TOTALITY OBLIGATION – the net T3's builder asked T5 to hang
// =================================================================================================
//
// «A live career left holding a non-null pregnancy, with no ending and no return, has its entries
// shut FOR EVER, and nothing in the suite would say so.» So the sweep below walks real careers PAST
// the end of the window and asserts the world reached exactly one of TWO shapes – never a third.
describe('wave 8 T5 F – every path out of the window lands in one of two terminal shapes', () => {
  it('⭐⭐⭐ twenty-four careers walked past the window, and not one is left holding a record', () => {
    let tried = 0
    let ended = 0
    for (let i = 0; i < 12; i++) {
      for (const [grade, divorce] of [['warm', false], ['cold', true]] as const) {
        const world = wedded(`w8-total-${i}-${grade}`)
        expecting(world, world.week, grade)
        const decisionWeek = decisionWeekOf(world.pregnancy!)
        if (divorce) endEpisode(world, world.pregnancy!.pausesWeek + 3)
        // past the end of the window by a clear margin, one real `resolveEndings` per week
        for (let w = world.week; w <= decisionWeek + 15; w++) {
          world.week = w
          resolveEndings(world)
        }
        const label = `${i}/${grade}${divorce ? '/divorced' : ''}`
        // ⚠⚠ THE THIRD CASE IS THE TRAP AND THIS IS THE LINE THAT REFUSES IT
        expect(world.pregnancy, `${label}: the record never survives the window`).toBeNull()
        if (world.ending === null) {
          tried += 1
          expect(pauseCovering(world, world.week + 4), `${label}: and her entries really re-opened`).toBeNull()
        } else {
          ended += 1
          expect(world.ending.type, `${label}: the only ending this walk can reach`).toBe('family')
          expect(world.ending.resumesWeek, `${label}: nothing to come back to`).toBeNull()
        }
      }
    }
    // ⭐ BOTH SHAPES REALLY OCCUR – a sweep in which every career took the same arm would satisfy the
    // assertions above while measuring one branch. `warm` is 0.80 and `cold` 0.45, so twelve seeds of
    // each is a population, not a coincidence.
    expect(tried, 'careers that came back').toBeGreaterThan(0)
    expect(ended, 'careers that did not').toBeGreaterThan(0)
    expect(tried + ended).toBe(24)
  })

  it('⚠⚠ a world that JUMPS the decision week still resolves – `>=` and not `===`', () => {
    // ⚠ THE FAILURE DIRECTION IS THE WHOLE ARGUMENT. `landPregnancyPause` uses `===` because a missed
    // line of texture is better than a doubled one; a MISSED decision leaves a pregnancy that never
    // resolves and an entry gate that never re-opens, which is the exact shape T3's builder flagged.
    // ARM 2 is the `!==` version.
    const world = decided('w8-total-jump', 'stops', 'cold')
    world.week = decisionWeekOf(world.pregnancy!) + 26
    resolveReturnDecision(world)
    expect(world.pregnancy, 'half a year late, and still resolved').toBeNull()
    expect(world.ending?.type).toBe('family')
  })

  it('⚠ an ENDING from elsewhere is the other terminal shape, and it is not a leak', () => {
    // A career that goes under, or whose body gives out, inside the pause ends before this step is
    // ever reached – `resolveEndings`' own `if (world.ending) return` at 7a. The record then survives,
    // and that is harmless rather than the hazard: `guardNotEnded` refuses every mutating command, so
    // there is no entry gate left to be shut. Said out loud here because «the record survived» looks
    // like the trap and is not.
    const world = decided('w8-total-elsewhere', 'stops', 'cold')
    world.week = decisionWeekOf(world.pregnancy!)
    world.ending = { type: 'bankruptcy', week: world.week - 10, ageYears: 29, detail: 'probe', resumesWeek: null }
    resolveEndings(world)
    expect(world.ending.type, 'the earlier latch stands').toBe('bankruptcy')
    expect(world.pregnancy, 'and the record is left where it was').not.toBeNull()
    expect(() => guardNotEnded(world), 'but nothing can be entered anyway').toThrow()
  })
})
