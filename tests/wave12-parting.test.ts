// =================================================================================================
// WAVE 12, T2 – THE PARTING: THE SPLIT AT `rollEnds`, AND THE ZERO IT DOES NOT SPEND
// =================================================================================================
//
// `docs/specs/the-parting-2026-09.md` §4, the plan `docs/plans/life-wave-12-builder-2026-09.md` §T2.
// One boolean – `over.latchedWeek !== null` – decides the shock's kind, the card's kind, the kept
// row's sentence and its stamp. Nothing else in the wave's engine exists.
//
// ⚠⚠ THE LOAD-BEARING CLAIM IS THE ONE ABOUT THE **DICE**, and it is what §B measures rather than
// describes: this wave changes ZERO draws. The hazard already knew about the latch (it is the
// `latchEndFactor` in the product, since v83), so by the time the branch runs the uniform has been
// spent and the only question left is what to call what it did. A wave that quietly added a key
// here would move no test in §A and every career in the game.
//
// ⚠ THE FIXTURES WALK **ONE WORLD PER SEED**, which is wave 11's own repair applied before it could
// go wrong again: the loss bench built 52 worlds per seed to find a firing week and measured three
// dice sequences wearing twelve careers' clothes. Here the firing week is found by evaluating the
// ends key DIRECTLY against the latched hazard (`firstLatchedHit`), with no world built at all, and
// then ONE world is posed on it.
//
// ⚠⚠ EVERY ARM IS RECORDED AND EVERY COUNT IS MEASURED. Control GREEN first; every arm applied by a
// scripted string edit and UNDONE by the inverse edit, never `git checkout`. The scope is SIX files
// – this one, wave4-ends, wave4-life-row-stamp, wave7-wedding, spirit and wave3-reaction – 204
// cases, CONTROL GREEN before the first arm and GREEN AGAIN after the last revert.
//
//   ARM 1  the branch condition flipped                          11 RED   over 4 of the 6 files:
//          (`latchedWeek !== null` -> `=== null`)                          6 here, 3 in the row-stamp
//                                                                          reader, 1 in wave4-ends
//                                                                          and 1 in wave7-wedding.
//                                                                          ⭐ The three in the STAMP
//                                                                          reader are the most
//                                                                          useful of the eleven:
//                                                                          flip the branch and an
//                                                                          ordinary break-up starts
//                                                                          writing a 'divorced' row,
//                                                                          which that file catches
//                                                                          without knowing this wave
//                                                                          exists.
//   ARM 2  the shock kind not split (`married ? 'divorce' :       3 RED   §A's two split cases and
//          'breakup'` -> `'breakup'`)                                      wave 7's re-aimed door
//                                                                          case – which is the pin
//                                                                          that was WAITING for this
//                                                                          wave, so its red here is
//                                                                          the re-aim proving itself.
//   ARM 3  the kept row stamped `'ended'` instead of              1 RED   §A's kept-row case alone.
//          `'divorced'` (the card left correct)                            ⚠ ONE, and that is the
//                                                                          measurement rather than
//                                                                          the prediction: the
//                                                                          row-stamp reader only
//                                                                          asks that the stamp be ON
//                                                                          the roster, so a stamp
//                                                                          that is wrong-but-legal
//                                                                          is invisible to it.
//   ARM 4  the divorce path calls `listenHeardNow`                0 RED   ⚠⚠ **A FINDING, WRITTEN
//          (a second consumer of the ending's coin)                        DOWN RATHER THAN A GAP
//                                                                          PAPERED OVER.** §B counts
//                                                                          keys DERIVED, and
//                                                                          `listenHeardNow` returns
//                                                                          `null` without touching a
//                                                                          stream unless a listen
//                                                                          rung is actually working –
//                                                                          which no fixture here has.
//                                                                          So the net cannot see a
//                                                                          call that is gated in
//                                                                          front of its own draw, and
//                                                                          saying so is worth more
//                                                                          than a fixture bolted on
//                                                                          to make the number look
//                                                                          better.
//   ARM 4b the divorce path derives an unconditional              2 RED   §B's both cases – the
//          `seed:life:divorce:react:<week>` key                            same-keys compare and the
//                                                                          no-divorce-stream pin. ⭐
//                                                                          THIS is the arm the net
//                                                                          is actually for, and the
//                                                                          pair 4 / 4b is what says
//                                                                          exactly how far it
//                                                                          reaches.
//
// T4's own arms, scope FOUR files – this one, week-notes, diary and wave3-diary-band – 149 cases,
// control GREEN before the first arm and GREEN AGAIN after the last revert:
//
//   ARM 5  the `<= DIVORCED_WEEKS` window dropped from the         1 RED   week-notes' reached-with-
//          divorce scrap's licence                                         its-window case: the
//                                                                          `{ divorcedWeeksAgo: 60 }`
//                                                                          sweep shapes are what it
//                                                                          reaches.
//   ARM 6  the fork scrap's licence reads the FACT without its     2 RED   week-notes' cross-arm case
//          VALUE (`!== null` instead of `=== arm`)                         and the honesty sweep. ⭐
//                                                                          This is the worst thing
//                                                                          the pool could do – a line
//                                                                          written for «she was
//                                                                          overridden» landing on a
//                                                                          week she was heard – and
//                                                                          it is the reason
//                                                                          `HOLDS.forkAftermath`
//                                                                          takes the value.
//   ARM 7  `forkAftermath` loses its one-week gate                 1 RED   §G's one-week-only case.
//          (`fork.askedWeek !== world.week` removed)
//   ARM 8  `divorcedWeeksAgo` ignores the latch – a plain          1 RED   §G's «an UNLATCHED episode
//          break-up counted as a parting                                   that ended is not a
//                                                                          divorce» case, which is
//                                                                          exactly what that case was
//                                                                          written for.
//
// T5's own arms, scope EIGHT files – this one, the six wave-6 spotlight suites and commentary –
// 243 cases, control GREEN before the first arm and GREEN AGAIN after the last revert:
//
//   ARM 9  `boothMentionDue`'s kind not split (always `'ended'`)    1 RED   §H's due-fact case.
//   ARM 10 `boothPrivateLifeAt`'s read-back not split               2 RED   §H's read-back case and
//                                                                          the wrong-story one.
//   ARM 11 the booth's LICENCE broken – `publicWeek === null`       1 RED   §H's «a world that never
//          dropped from the ended clause                                    knew says nothing» case.
//                                                                           ⭐ THE ARM THAT MATTERS
//                                                                           MOST, because §6's whole
//                                                                           claim is that this wave
//                                                                           adds WORDS to the
//                                                                           publicity rail and not a
//                                                                           dial.
//   ARM 12 `exposureEventsOf` priced differently for a divorce      0 RED   ⚠⚠ **A FINDING ABOUT THE
//          (`'aired'` -> `'stage'` on a latched row)                        TEST, NOT ABOUT THE
//                                                                           CODE**, and it is why
//                                                                           the deep-equal case now
//                                                                           poses a standing and
//                                                                           carries a positive
//                                                                           control. That function
//                                                                           gates EVERY kind on
//                                                                           `newsStandingOf !==
//                                                                           'quiet'`, so the first
//                                                                           draft's fixture returned
//                                                                           `[]` on both arms and
//                                                                           the assertion passed
//                                                                           without ever reaching
//                                                                           the line it is about.
//   ARM 12b the same arm against the REPAIRED case                  1 RED   which is the receipt for
//                                                                           the repair.

import { beforeEach, describe, expect, it, vi } from 'vitest'

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's §B apparatus, verbatim and for its reason. Every
// call is delegated to the real `rngFromSeed`, so the numbers this file measures are the engine's
// own; the mock exists only so §B can COUNT the keys the branch reached.
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
  activeEpisode,
  airBoothMention,
  answerLifeBeat,
  createWorld,
  deliverKnownPartner,
  endsHazardFor,
  kidAgeExact,
  landWedding,
  lifeBeatOptionsFor,
  boothMentionDue,
  boothPrivateLifeAt,
  buildScroll,
  exposureEventsOf,
  lifeLogOf,
  pendingLifeBeat,
  rollEnds,
  rollWedding,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
// ⚠ FROM `engine/spirit` AND NOT FROM THE `engine/world` BARREL – the barrel does not re-export it
// (`node scripts/world-map.mjs expressedTemperamentOf` says so), and importing it from its owner is
// what the map is for.
import { expressedTemperamentOf } from '../src/engine/spirit'
import { ECONOMY } from '../src/engine/economy'
import type { LoveEpisode } from '../src/shared/protocol'
import { DRAIN_ANSWER, drainCostOf } from '../tools/_lifeBeats'
// ⚠ THE FIXTURE HELPER AND NOT A HAND-SET RANK: `newsStandingOf` reads `kidPoints`, which folds the
// RESULTS ledger, so a posed `kidRankWta` alone leaves the gate shut. `standHerAt` poses both and
// throws if the fold does not count its own row.
import { standHerAt } from './helpers/newsStanding'

const WEDDING = ECONOMY.wedding

beforeEach(() => {
  rngKeys.length = 0
})

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

/** A row of the v83 shape. `latchedWeek` is what this whole file is about, so it is a parameter. */
function episode(sinceWeek: number, latchedWeek: number | null = null, knownWeek: number | null = null): LoveEpisode {
  return {
    id: `p:${sinceWeek}`,
    sinceWeek,
    endedWeek: null,
    knownWeek: knownWeek ?? sinceWeek + 2,
    wants: 'open',
    partnerId: `p:${sinceWeek}`,
    publicWeek: null,
    publicWrong: false,
    airedMetWeek: null,
    airedEndedWeek: null,
    latchedWeek,
    partnerName: null,
  }
}

function careerAt(seed: string, week: number, ...rows: LoveEpisode[]): WorldState {
  const world = createWorld(seed)
  world.season = []
  world.week = week
  world.loveEpisodes = rows
  return world
}

/** ⭐⭐ THE FIRING WEEK, FOUND WITHOUT BUILDING A WORLD PER WEEK – the wave-11 repair, and the reason
 *  this file can pose its cases on ONE world per seed. The ends stream is `seed:life:ends:<week>`
 *  and the LATCHED threshold is the ordinary hazard times `latchEndFactor`, so the week a married
 *  episode ends is readable straight off the key. ⚠ It takes the temperament from a probe world
 *  rather than assuming one: `endsHazardFor` reads the expressed register, and a sweep that guessed
 *  it would be measuring a threshold the engine does not use. */
function firstLatchedHit(world: WorldState, from: number): number {
  const hazard = endsHazardFor(expressedTemperamentOf(world)) * WEDDING.latchEndFactor
  // ⚠ THE WINDOW IS WIDE BECAUSE THE EVENT IS RARE, and the first draft's 4,000 weeks was measured
  // too narrow – `w12-album-0` found no hit and threw. At `endsPerWeek x endsMult x latchEndFactor`
  // the weekly chance is ~0.0004..0.0018, so a four-thousand-week search misses a real seed roughly
  // one time in five. 40,000 is the wedding suite's own habit (it searches 200,000) and costs
  // milliseconds, because nothing is being built – this is arithmetic on a key.
  for (let w = from; w < from + 40000; w++) {
    if (rngFromSeed(`${world.seed}:life:ends:${w}`)() < hazard) return w
  }
  throw new Error('no latched ending inside 40000 weeks')
}

/** A married career parked ONE week before its marriage ends, with the `'met'` receipt on record –
 *  which is what a real latched row always carries (§C proves it rather than assuming it). */
function marriedOnTheWeekItEnds(seed: string): WorldState {
  const probe = createWorld(seed)
  const adult = weekAtAge(probe, WEDDING.ageGate)
  const world = careerAt(seed, adult, episode(adult - WEDDING.minEpisodeWeeks))
  // the receipt: the parent was told there was somebody, the ordinary way – and the card is ANSWERED,
  // because `'met'` BLOCKS and an unanswered row would still be at the head of the queue when the
  // ending raises its own. ⚠ `wary` is the bond-neutral answer (`DRAIN_ANSWER.met`), so posing the
  // receipt costs the fixture no bond and the priced cases below measure this wave's numbers alone.
  deliverKnownPartner(world)
  answerLifeBeat(world, DRAIN_ANSWER.met)
  const hit = firstLatchedHit(world, adult)
  world.week = hit
  world.loveEpisodes[0].latchedWeek = adult + 1
  return world
}

/** The same career with the latch taken off – the other half of every split case. ⚠ ONE WORLD, ONE
 *  SEED, ONE WEEK: the two arms differ in the latch and in nothing else, which is what makes the
 *  comparison a measurement of the BRANCH rather than of two careers. */
function unmarriedOnTheSameWeek(seed: string): WorldState {
  const world = marriedOnTheWeekItEnds(seed)
  world.loveEpisodes[0].latchedWeek = null
  return world
}

const SPLIT_SEEDS = Array.from({ length: 12 }, (_, i) => `w12-split-${i}`)

// =================================================================================================
// A. THE SPLIT – one boolean, four consequences
// =================================================================================================

describe('wave 12 T2 A – a latched ending is a divorce', () => {
  it('⭐⭐⭐ writes `kind: divorce` and raises `divorced`', () => {
    const world = marriedOnTheWeekItEnds(SPLIT_SEEDS[0])
    rollEnds(world)
    expect(world.loveEpisodes[0].endedWeek, 'the hazard really did fire on this week').toBe(world.week)
    expect(world.spiritShock, 'the mark says which ending it was').toEqual({ week: world.week, kind: 'divorce' })
    expect(pendingLifeBeat(world)?.kind, 'and the card is the marriage’s own').toBe('divorced')
  })

  it('⭐⭐⭐ ...and an UNLATCHED ending on the same seed and week is still a break-up', () => {
    // THE OTHER HALF, and it is the case that makes the one above mean anything: same career, same
    // week, same uniform, and the ONLY difference is the latch.
    const world = unmarriedOnTheSameWeek(SPLIT_SEEDS[0])
    rollEnds(world)
    expect(world.loveEpisodes[0].endedWeek, 'the same uniform fires under the WIDER threshold too').toBe(world.week)
    expect(world.spiritShock).toEqual({ week: world.week, kind: 'breakup' })
    expect(pendingLifeBeat(world)?.kind).toBe('ended')
  })

  it('the kept row carries the divorce’s own sentence and its own stamp', () => {
    const world = marriedOnTheWeekItEnds(SPLIT_SEEDS[1])
    const before = world.events.length
    rollEnds(world)
    const rows = world.events.slice(before)
    // ⚠ RE-AIMED BY T3, NOT WEAKENED: this said «ONE kept row and no second event», which was true
    // of T2 and is the thing T3 changes – the album's own milestone row lands on the same week (his
    // «можно» of 23.09). What this case is about is the `'life'` row, so it now names its position
    // and §F's own case owns the pair. A THIRD row appearing still reddens here.
    expect(rows, 'the news row and the album\u2019s – and nothing else').toHaveLength(2)
    expect(rows[0].type).toBe('life')
    expect(rows[0].keep, 'the album keeps it past every prune').toBe(true)
    expect(rows[0].lifeKind).toBe('divorced')
    // ⚠ RE-AIMED 23.09 BY HIS STRINGS REVIEW (must-fix 3), NOT WEAKENED: the second clause («and
    // there is nobody in her life now») described the SLOT and read as a claim about her LIFE –
    // parents, children and friends stand – so the row now states the one fact. Same pin, new words.
    expect(rows[0].text).toBe('Her marriage ended this week.')
    expect(rows[0].amountCents, 'no money in this wave, anywhere').toBeUndefined()
  })

  it('⭐⭐ the split holds across twelve seeds, both arms, every time', () => {
    for (const seed of SPLIT_SEEDS) {
      const married = marriedOnTheWeekItEnds(seed)
      rollEnds(married)
      const single = unmarriedOnTheSameWeek(seed)
      rollEnds(single)
      expect(married.spiritShock?.kind, `${seed}: married`).toBe('divorce')
      expect(single.spiritShock?.kind, `${seed}: single`).toBe('breakup')
      expect(pendingLifeBeat(married)?.kind, `${seed}: married card`).toBe('divorced')
      expect(pendingLifeBeat(single)?.kind, `${seed}: single card`).toBe('ended')
    }
  })

  it('⭐⭐ the beat’s detail is the EPISODE ID – machine-readable, never a rendered word', () => {
    const world = marriedOnTheWeekItEnds(SPLIT_SEEDS[2])
    const id = activeEpisode(world)!.id
    rollEnds(world)
    expect(pendingLifeBeat(world)?.detail).toBe(id)
  })

  it('⭐⭐ and it carries NO `heard` stamp – the listen coin is not derived on this path', () => {
    // ⚠ THIS IS THE ONE THING THE WAVE TAKES AWAY, pinned rather than left to a comment: a break-up
    // can carry a legible heading on a coached week and a divorce cannot, because `DIVORCED_HEADING`
    // has two cells and no legible arm. See `rollEnds`' own note; carried to the report as a
    // question for the owner.
    const world = marriedOnTheWeekItEnds(SPLIT_SEEDS[3])
    rollEnds(world)
    expect(pendingLifeBeat(world)?.heard).toBeUndefined()
  })
})

// =================================================================================================
// B. THE DICE DID NOT MOVE – the wave's own law, counted rather than claimed
// =================================================================================================

describe('wave 12 T2 B – zero new draws', () => {
  it('⭐⭐⭐ a married ending derives exactly the keys an unmarried one does', () => {
    // ⚠⚠ THE KEY COUNT AND NOT A WORLD COMPARE, wave 4's own net and its own reason: a discarded
    // draw changes no other week's value, so two worlds can agree byte for byte while one of them
    // spent a key the other did not. The counter sees keys.
    const married = marriedOnTheWeekItEnds(SPLIT_SEEDS[4])
    rngKeys.length = 0
    rollEnds(married)
    const marriedKeys = [...rngKeys]

    const single = unmarriedOnTheSameWeek(SPLIT_SEEDS[4])
    rngKeys.length = 0
    rollEnds(single)
    const singleKeys = [...rngKeys]

    expect(marriedKeys, 'the same keys, in the same order, on both arms').toEqual(singleKeys)
    // ...and the positive control: the section is not measuring an empty list.
    expect(marriedKeys.length, 'an ending really does derive keys – the net is not vacuous')
      .toBeGreaterThan(0)
  })

  it('⭐⭐ the ONE key an ending spends is the ends stream, and it carries no kind', () => {
    const world = marriedOnTheWeekItEnds(SPLIT_SEEDS[5])
    rngKeys.length = 0
    rollEnds(world)
    // ⚠ NO `:divorce:` AND NO `:react` ANYWHERE. A wave that gave the divorce a stream of its own
    // would put a new key on every marriage ending in every career, the frozen corpus included.
    expect(rngKeys.some((k) => k.includes('divorce')), 'no divorce-scoped stream exists').toBe(false)
    expect(rngKeys.filter((k) => k === `${world.seed}:life:ends:${world.week}`), 'the ends key, once')
      .toHaveLength(1)
  })

  it('⭐⭐ the latched THRESHOLD is the only thing the latch moves in the hazard', () => {
    // The wedding's own seam, re-read here because this wave rests on it: same key, same uniform,
    // `latchEndFactor` on the threshold. A wave that had moved the DRAW would fail this.
    const world = marriedOnTheWeekItEnds(SPLIT_SEEDS[6])
    const u = rngFromSeed(`${world.seed}:life:ends:${world.week}`)()
    const plain = endsHazardFor(expressedTemperamentOf(world))
    expect(u, 'the week fires under the latched threshold').toBeLessThan(plain * WEDDING.latchEndFactor)
    expect(WEDDING.latchEndFactor, 'and the factor is a scale, never a gate').toBeGreaterThan(0)
  })
})

// =================================================================================================
// C. THE RECEIPT – why there is no told-late divorce, proved rather than assumed
// =================================================================================================

describe('wave 12 T2 C – a latched row always holds the `met` receipt', () => {
  it('⭐⭐⭐ walking a career to a real latch leaves a `met` row on the record', () => {
    // ⚠ THE WHOLE CHAIN, WALKED RATHER THAN POSED: the episode is delivered (`'met'`), the
    // engagement is raised and ANSWERED, and only then can `landWedding` write the latch. That is
    // the spec's §2.2 argument in code – the latch needs an answered `'engaged'` beat, which needs
    // the delivered episode – and it is why the divorce card can never be told-late.
    const probe = createWorld('w12-receipt')
    const adult = weekAtAge(probe, WEDDING.ageGate)
    const world = careerAt('w12-receipt', adult, episode(adult - WEDDING.minEpisodeWeeks))
    world.bond = 70
    deliverKnownPartner(world)
    answerLifeBeat(world, 'wary')
    // walk to a wedding hit on the engine's own stream
    let hit = world.week
    while (rngFromSeed(`${world.seed}:life:wedding:${hit}`)() >= WEDDING.perWeek) hit++
    world.week = hit
    rollWedding(world)
    expect(pendingLifeBeat(world)?.kind, 'the engagement was raised').toBe('engaged')
    answerLifeBeat(world, 'distance')
    world.week += WEDDING.weeksAfterEngagement
    landWedding(world)

    const row = world.loveEpisodes[0]
    expect(row.latchedWeek, 'she is married, by the engine’s own road').not.toBeNull()
    const kinds = lifeLogOf(world).map((r) => r.kind)
    expect(kinds, '...and the `met` receipt is on the record, which is what makes the ending told-now')
      .toContain('met')
  })

  it('⭐⭐ an ended LATCHED row never reaches the told-late path', () => {
    // ⚠ THE OTHER HALF: `deliverKnownPartner` owns the told-late scene, and it refuses an episode
    // that already holds a `'met'` row. So even asked directly, on the very tick the marriage ended,
    // it raises nothing – there is no second card about this girl this week.
    const world = marriedOnTheWeekItEnds(SPLIT_SEEDS[7])
    rollEnds(world)
    expect(pendingLifeBeat(world)?.kind).toBe('divorced')
    answerLifeBeat(world, DRAIN_ANSWER.divorced)
    deliverKnownPartner(world)
    expect(pendingLifeBeat(world), 'nothing late follows a divorce').toBeNull()
    const kinds = lifeLogOf(world).map((r) => r.kind)
    expect(kinds.filter((k) => k === 'ended'), 'and no break-up card was ever raised for it').toHaveLength(0)
  })
})

// =================================================================================================
// D. THE PRICED SET – four answers, the flip, and the drain
// =================================================================================================

describe('wave 12 T2 D – what the card offers', () => {
  it('the four ids are the spec’s four, in order', () => {
    expect(lifeBeatOptionsFor('divorced', 'open').map((o) => o.id)).toEqual(['space', 'company', 'sort', 'dismiss'])
  })

  it('⭐⭐ the flip moves the PRICE and never the words', () => {
    const base = lifeBeatOptionsFor('divorced', 'open', 'space')
    const flipped = lifeBeatOptionsFor('divorced', 'open', 'company')
    expect(flipped.map((o) => o.label), 'same four sentences under both readings')
      .toEqual(base.map((o) => o.label))
    expect(base.find((o) => o.id === 'space')!.bond).toBe(ECONOMY.divorce.matched)
    expect(flipped.find((o) => o.id === 'space')!.bond).toBe(ECONOMY.divorce.mismatched)
    expect(flipped.find((o) => o.id === 'company')!.bond).toBe(ECONOMY.divorce.matched)
  })

  it('⭐⭐ `sort` and `dismiss` are read-INDEPENDENT, which is what the drain rests on', () => {
    for (const read of ['space', 'company'] as const) {
      const set = lifeBeatOptionsFor('divorced', 'open', read)
      expect(set.find((o) => o.id === 'sort')!.bond, `sort under ${read}`).toBe(ECONOMY.divorce.sortItOut)
      expect(set.find((o) => o.id === 'dismiss')!.bond, `dismiss under ${read}`).toBe(ECONOMY.divorce.dismiss)
    }
    // ⚠ `drainCostOf` THROWS if the two readings disagree – so this line is the assertion, not the
    // expectation after it.
    expect(drainCostOf('divorced'), 'a harness can state this kind’s skew exactly')
      .toBe(ECONOMY.divorce.sortItOut)
  })

  it('⭐ answering writes the kind’s own feed row', () => {
    const world = marriedOnTheWeekItEnds(SPLIT_SEEDS[8])
    rollEnds(world)
    const before = world.events.length
    answerLifeBeat(world, 'space')
    const rows = world.events.slice(before)
    expect(rows).toHaveLength(1)
    expect(rows[0].text).toBe('Her marriage ended. We gave her room, and said we were there.')
  })
})

// =================================================================================================
// E. WHAT THE BRANCH DOES **NOT** TOUCH
// =================================================================================================

describe('wave 12 T2 E – the boundaries', () => {
  it('⭐⭐⭐ writes no `spirit` point – `accrueSpirit` is still the one writer', () => {
    const world = marriedOnTheWeekItEnds(SPLIT_SEEDS[9])
    const spirit = world.spirit
    rollEnds(world)
    expect(world.spirit, 'the mark is a fact; the arithmetic is four calls later').toBe(spirit)
  })

  it('⭐⭐ moves no money, in either arm', () => {
    for (const make of [marriedOnTheWeekItEnds, unmarriedOnTheSameWeek]) {
      const world = make(SPLIT_SEEDS[10])
      const funds = world.fundsCents
      rollEnds(world)
      expect(world.fundsCents, 'no settlement, no claim, no accounting (spec §2.4)').toBe(funds)
    }
  })

  it('⭐⭐ leaves the children and the pregnancy exactly where they were', () => {
    // §2.5: children stay state through it – no custody, his standing law – and a mid-pregnancy
    // divorce is ordinary life, so the record is untouched by the ending that happens beside it.
    const world = marriedOnTheWeekItEnds(SPLIT_SEEDS[11])
    world.children = [{ bornWeek: world.week - 40, sex: 'girl' }]
    world.pregnancy = {
      episodeId: world.loveEpisodes[0].id,
      conceivedWeek: world.week - 4,
      announcedWeek: world.week - 2,
      pausesWeek: world.week + 4,
      dueWeek: world.week + 35,
      support: 'warm',
      rankAtPause: null,
    }
    const children = JSON.stringify(world.children)
    const pregnancy = JSON.stringify(world.pregnancy)
    rollEnds(world)
    expect(JSON.stringify(world.children)).toBe(children)
    expect(JSON.stringify(world.pregnancy), 'the decoupling ruling, kept').toBe(pregnancy)
  })

  it('⭐⭐ the latch itself is not cleared – the row records that she WAS married', () => {
    const world = marriedOnTheWeekItEnds(SPLIT_SEEDS[0])
    const latch = world.loveEpisodes[0].latchedWeek
    rollEnds(world)
    expect(world.loveEpisodes[0].latchedWeek, 'a divorce does not unmake the wedding').toBe(latch)
  })
})

// =================================================================================================
// F. THE ALBUM (T3) – one line that settles nothing, and one per marriage
// =================================================================================================

describe('wave 12 T3 F – the album keeps a line', () => {
  it('⭐⭐⭐ the two surfaces land together: the kept milestone row and the scroll row', () => {
    const world = marriedOnTheWeekItEnds('w12-album-0')
    const id = activeEpisode(world)!.id
    rollEnds(world)
    const kept = world.events.filter((e) => e.milestoneKey === `divorce:${id}`)
    expect(kept, 'one milestone row, kept past every prune').toHaveLength(1)
    expect(kept[0].type, '⚠ a `milestone` row and NOT a `life` one – the two channels are different questions').toBe('milestone')
    expect(kept[0].keep).toBe(true)
    // ⚠ RE-AIMED 23.09 BY HIS STRINGS REVIEW: «the phone still rang» asserted a delivery channel
    // the quiet voice contradicts. Same pin, his line.
    expect(kept[0].text).toBe('The marriage ended. We had no say in it, only in what we said next.')
    expect(world.milestones.filter((m) => m.type === 'divorce'), 'one album entry, keyed to the episode').toEqual([
      { type: 'divorce', week: world.week, kind: id },
    ])
  })

  it('⭐⭐ the week writes BOTH a `life` row and a `milestone` row – the one week in the game that does', () => {
    // ⚠ THE SPEC ASKS FOR BOTH (§4's kept row, §5's album line) and the two answer different
    // questions – `'life'` is news about her life, `'milestone'` is what the family keeps. Pinned
    // here because «two rows on one week» is a thing the owner sees on a screen: if he does not want
    // it, this is the case that says which one to drop.
    const world = marriedOnTheWeekItEnds('w12-album-1')
    const before = world.events.length
    rollEnds(world)
    const rows = world.events.slice(before)
    expect(rows.map((r) => r.type)).toEqual(['life', 'milestone'])
    // ⚠ RE-AIMED 23.09 BY HIS STRINGS REVIEW (must-fix 3) – the one-fact row, see the kept-row case.
    expect(rows[0].text, 'the news says what this week did').toBe('Her marriage ended this week.')
    expect(rows[1].text, '...and the album says what the career reads back later').not.toBe(rows[0].text)
  })

  it('⭐⭐⭐ a SECOND marriage\u2019s divorce captures its own line', () => {
    // The 11.09 re-shape inherited from the wedding this closes: the identity is the EPISODE, so two
    // marriages in one career leave two rows rather than one silently swallowing the other.
    const world = marriedOnTheWeekItEnds('w12-album-2')
    const first = activeEpisode(world)!.id
    rollEnds(world)
    // ...years later, she married again and that one ends too.
    const secondWeek = world.week + 300
    world.week = secondWeek
    world.loveEpisodes.push({
      ...episode(secondWeek - 120, secondWeek - 60),
      id: 'p:second',
      partnerId: 'p:second',
      knownWeek: secondWeek - 118,
    })
    // ⚠ `lifeLogOf` returns a READONLY view – the row goes onto the world's own array, which is what
    // the engine reads. The cast is the fixture stating that it is writing history, not reading it.
    ;(world.lifeLog as { week: number; kind: string; detail: string; answer: string | null }[]).push({
      week: secondWeek - 118, kind: 'met', detail: 'p:second', answer: 'wary',
    })
    world.spiritShock = null
    // force the ending rather than hunting a second hit: the branch is what is under test here.
    const hit = firstLatchedHit(world, secondWeek)
    world.week = hit
    rollEnds(world)
    expect(world.milestones.filter((m) => m.type === 'divorce').map((m) => m.kind), 'two marriages, two lines')
      .toEqual([first, 'p:second'])
  })

  it('⭐⭐ idempotent per episode – a replayed tick cannot double the line', () => {
    const world = marriedOnTheWeekItEnds('w12-album-3')
    rollEnds(world)
    const milestones = world.milestones.length
    const events = world.events.length
    // `rollEnds` is a no-op now (the slot is empty), but the two capture calls are keyed, so even a
    // hand-replayed write cannot double: assert through the engine's own idempotency.
    rollEnds(world)
    expect(world.milestones.length).toBe(milestones)
    expect(world.events.length).toBe(events)
  })

  it('⭐⭐ the scroll carries the row, labelled and with no detail beside it', () => {
    const world = marriedOnTheWeekItEnds('w12-album-4')
    rollEnds(world)
    const rows = buildScroll(world).flatMap((s) => s.rows).filter((r) => r.label === 'The marriage ended')
    expect(rows, 'the scroll shows it once').toHaveLength(1)
    // ⚠ NO DETAIL, and the absence is the assertion: the episode id is a machine value the scroll
    // must never print, and no duration, fault or name exists in the world to put there.
    expect(rows[0].detail ?? null).toBeNull()
  })
})

// =================================================================================================
// G. THE DIARY'S TWO FACTS (T4) – derived at snapshot time, persisted nowhere
// =================================================================================================

const factsOf = (world: WorldState) => toSnapshot(world).diary.facts

describe('wave 12 T4 G – `divorcedWeeksAgo`', () => {
  it('⭐⭐⭐ is null on a career that never married, and on one that is married still', () => {
    // ⚠ TWO DIFFERENT TRUE THINGS SAID BY ONE ABSENCE, which is the field's own note made checkable:
    // no line in the diary may tell them apart, because neither of them is «a divorce».
    const never = careerAt('w12-facts-0', 900)
    expect(factsOf(never).divorcedWeeksAgo, 'nobody was ever there').toBeNull()
    const married = careerAt('w12-facts-1', 900, episode(700, 760))
    expect(factsOf(married).divorcedWeeksAgo, 'she is married, and that is not a divorce').toBeNull()
  })

  it('⭐⭐ counts from the week the marriage ended', () => {
    const world = careerAt('w12-facts-2', 900, { ...episode(700, 760), endedWeek: 880 })
    expect(factsOf(world).divorcedWeeksAgo).toBe(20)
  })

  it('⭐⭐ an UNLATCHED episode that ended is not a divorce', () => {
    // The other half of the derivation, and the one a careless `endedWeek !== null` would get wrong:
    // a break-up is not a parting, however recent.
    const world = careerAt('w12-facts-3', 900, { ...episode(700, null), endedWeek: 880 })
    expect(factsOf(world).divorcedWeeksAgo).toBeNull()
  })

  it('⭐⭐ two marriages: the MOST RECENT one is what the diary sees', () => {
    const world = careerAt(
      'w12-facts-4',
      900,
      { ...episode(400, 440), endedWeek: 500 },
      { ...episode(700, 760), id: 'p:700b', partnerId: 'p:700b', endedWeek: 880 },
    )
    expect(factsOf(world).divorcedWeeksAgo, 'the maximum, never the tail\u2019s').toBe(20)
  })
})

describe('wave 12 T4 G – `forkAftermath`', () => {
  /** A career whose fork was asked THIS week, with her want on the record and an answer given. */
  function atTheFork(seed: string, want: 'college' | 'tour' | 'stop' | null, answer: 'college' | 'continue' | 'stop'): WorldState {
    const world = careerAt(seed, 990)
    world.fork = { askedWeek: 990, answer, offer: null }
    if (want !== null) {
      ;(world.lifeLog as { week: number; kind: string; detail: string; answer: string | null }[]).push({
        week: 990, kind: 'fork-opinion', detail: want, answer: 'listen',
      })
    }
    return world
  }

  it('⭐⭐⭐ `with` when the deed matched the want she stated', () => {
    expect(factsOf(atTheFork('w12-fork-0', 'college', 'college')).forkAftermath).toBe('with')
    expect(factsOf(atTheFork('w12-fork-1', 'tour', 'continue')).forkAftermath).toBe('with')
    expect(factsOf(atTheFork('w12-fork-2', 'stop', 'stop')).forkAftermath).toBe('with')
  })

  it('⭐⭐⭐ `against` when it did not', () => {
    expect(factsOf(atTheFork('w12-fork-3', 'college', 'continue')).forkAftermath).toBe('against')
    expect(factsOf(atTheFork('w12-fork-4', 'stop', 'continue')).forkAftermath).toBe('against')
    expect(factsOf(atTheFork('w12-fork-5', 'tour', 'stop')).forkAftermath).toBe('against')
  })

  it('⭐⭐⭐ a PRE-v73 career gets nothing – she was never asked, so there is nothing to have gone against', () => {
    // ⚠ THE ABSENCE DISCIPLINE, and it is the case a `?? 'with'` anywhere on that line would fail.
    expect(factsOf(atTheFork('w12-fork-6', null, 'college')).forkAftermath).toBeNull()
  })

  it('⭐⭐ ONE WEEK ONLY: the week after the fork resolved carries nothing', () => {
    const world = atTheFork('w12-fork-7', 'college', 'continue')
    expect(factsOf(world).forkAftermath, 'the week it resolved').toBe('against')
    world.week += 1
    expect(factsOf(world).forkAftermath, '...and the week after says nothing at all').toBeNull()
  })

  it('⭐⭐ an UNANSWERED fork carries nothing – the week is not over', () => {
    const world = atTheFork('w12-fork-8', 'college', 'college')
    world.fork = { askedWeek: 990, answer: null, offer: null }
    expect(factsOf(world).forkAftermath).toBeNull()
  })

  it('⭐ a career that has not reached its fork carries nothing', () => {
    expect(factsOf(careerAt('w12-fork-9', 990)).forkAftermath).toBeNull()
  })
})

// =================================================================================================
// H. THE BOOTH (T5) – the world names it where it already knew
// =================================================================================================

/** A career the world knows about, whose attachment ended `agoWeeks` ago. `latched` is what the
 *  booth's kind splits on and is the only difference between the two arms of every case below. */
function publicEnding(seed: string, latched: boolean, agoWeeks = 1): WorldState {
  const world = careerAt(seed, 900, {
    ...episode(600, latched ? 700 : null),
    endedWeek: 900 - agoWeeks,
    publicWeek: 750,
    airedMetWeek: 752,
  })
  return world
}

describe('wave 12 T5 H – the due fact splits on the latch', () => {
  it('⭐⭐⭐ a married ending is `divorced`, an unmarried one is `ended`', () => {
    expect(boothMentionDue(publicEnding('w12-booth-0', true), 900)?.kind).toBe('divorced')
    expect(boothMentionDue(publicEnding('w12-booth-1', false), 900)?.kind).toBe('ended')
  })

  it('⭐⭐⭐ the LICENCE is untouched – a world that never knew of them says nothing, married or not', () => {
    // ⚠ THIS IS §6's WHOLE CLAIM: openness decided whether the world ever knew (`publicWeek`) and
    // this wave adds words to that machinery rather than a dial. A divorce the press never heard of
    // is not news because the ROMANCE was not, which is the same gate it always was.
    for (const latched of [true, false]) {
      const world = publicEnding(`w12-booth-quiet-${latched}`, latched)
      world.loveEpisodes[0].publicWeek = null
      expect(boothMentionDue(world, 900), `latched=${latched}: nobody knew, so nobody says`).toBeNull()
    }
  })

  it('⭐⭐ and so is the news WINDOW – an old parting is not news either', () => {
    const world = publicEnding('w12-booth-2', true, ECONOMY.spotlight.newsWindowWeeks + 1)
    expect(boothMentionDue(world, 900)).toBeNull()
  })

  it('⭐⭐⭐ airing stamps the SAME field, and the fact can never be voiced twice', () => {
    const world = publicEnding('w12-booth-3', true)
    // ⚠ THE BOOTH'S TWO GATES, POSED RATHER THAN GUESSED (both measured against their own readers):
    // a BIG STAGE (`ECONOMY.spotlight.stageTierMin`) and a standing above `'quiet'`.
    standHerAt(world, 'known', world.week - 1)
    airBoothMention(world, ECONOMY.spotlight.stageTierMin)
    const aired = world.loveEpisodes[0].airedEndedWeek
    expect(aired, 'one «it is over» stamp, whatever it is called').toBe(900)
    airBoothMention(world, ECONOMY.spotlight.stageTierMin)
    expect(world.loveEpisodes[0].airedEndedWeek, 'and the once-ness holds').toBe(aired)
  })

  it('⭐⭐⭐ the read-back says `divorced` on the airing week and on every re-render of it', () => {
    const world = publicEnding('w12-booth-4', true)
    world.loveEpisodes[0].airedEndedWeek = 880
    expect(boothPrivateLifeAt(world, 880)).toEqual({ kind: 'divorced', wrong: false })
    // ⚠ AND IT CANNOT DRIFT: the latch is durable, so asking again years later gives the same
    // answer. A marriage cannot become a break-up.
    world.week = 1400
    expect(boothPrivateLifeAt(world, 880)).toEqual({ kind: 'divorced', wrong: false })
  })

  it('⭐⭐ the world\u2019s mistake is repeated and never re-judged', () => {
    const world = publicEnding('w12-booth-5', true)
    world.loveEpisodes[0].airedEndedWeek = 880
    world.loveEpisodes[0].publicWrong = true
    expect(boothPrivateLifeAt(world, 880)).toEqual({ kind: 'divorced', wrong: true })
  })

  it('⭐⭐⭐ `exposureEventsOf` is BYTE-IDENTICAL on the same world, married or not', () => {
    // ⚠ THE WAVE'S OWN BOUNDARY (§6: «`exposureEventsOf` is untouched»): the `'aired'` kind already
    // prices the pressure week, and pricing a divorce differently would be a dial this wave has no
    // ruling for. Deep-equal across the latch is the strongest form that claim can take.
    // ⚠⚠ THE STANDING IS POSED AND THE LIST IS PROVED NON-EMPTY, AND BOTH LINES ARE HERE BECAUSE
    // THE FIRST DRAFT HAD NEITHER. `exposureEventsOf` gates EVERY kind on `newsStandingOf !==
    // 'quiet'`, so a fixture with no rank returns `[]` on both arms and the deep-equal passes
    // without ever reaching the line it is about. The mutation arm caught it: pricing a divorce's
    // exposure differently left this case GREEN. It is a measurement of the test, not of the code,
    // and it is the reason the positive control below is not decoration.
    for (const week of [875, 880, 885]) {
      const married = publicEnding(`w12-booth-exp-${week}`, true)
      married.loveEpisodes[0].airedEndedWeek = 880
      standHerAt(married, 'known', 870)
      const single = publicEnding(`w12-booth-exp-${week}`, false)
      single.loveEpisodes[0].airedEndedWeek = 880
      standHerAt(single, 'known', 870)
      expect(exposureEventsOf(married, week), `week ${week}`).toEqual(exposureEventsOf(single, week))
    }
    // THE POSITIVE CONTROL: the airing week really does hold an event, so the three deep-equals
    // above are comparing something.
    const onTheWeek = publicEnding('w12-booth-exp-control', true)
    onTheWeek.loveEpisodes[0].airedEndedWeek = 880
    standHerAt(onTheWeek, 'known', 870)
    expect(exposureEventsOf(onTheWeek, 880), 'the airing week is an exposure event')
      .toContainEqual({ kind: 'aired' })
  })
})
