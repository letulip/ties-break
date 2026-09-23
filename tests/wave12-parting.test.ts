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
  answerLifeBeat,
  createWorld,
  deliverKnownPartner,
  endsHazardFor,
  kidAgeExact,
  landWedding,
  lifeBeatOptionsFor,
  buildScroll,
  lifeLogOf,
  pendingLifeBeat,
  rollEnds,
  rollWedding,
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
    expect(rows[0].text).toBe('Her marriage ended this week, and there is nobody in her life now.')
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
    expect(kept[0].text).toBe('The marriage ended. Nothing about it was decided in this house, and the phone still rang.')
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
    expect(rows[0].text, 'the news says what this week did').toBe('Her marriage ended this week, and there is nobody in her life now.')
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
    lifeLogOf(world).push({ week: secondWeek - 118, kind: 'met', detail: 'p:second', answer: 'wary' })
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
