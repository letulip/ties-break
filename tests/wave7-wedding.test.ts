// THE WEDDING, WAVE 7 – T2: THE HAZARD AND THE ENGAGEMENT BEAT (life/wave-7;
// docs/plans/life-wave-7-builder-2026-09.md §2 T2, constants in `ECONOMY.wedding`).
//
// The shapes are the standing ones and each section names its donor: §A is the gate as
// tests/wave4-ends.test.ts §A tests `endsEligible`; §B is the count-keys net (wave 3's finding, the
// wave-4 brief's §0.1 LAW for every zero-draw claim – a two-worlds alignment stays green under
// draw-and-discard because every key carries its own week, so the honest net COUNTS the keys the
// gate reached, with a positive control); §C is the raise; §D is the answer through the one
// `answerLifeBeat` seam, priced against the BRIEF'S OWN LITERALS and never against `ECONOMY.wedding`
// (tests/wave3-reaction.test.ts ARM 2's law: an expectation read out of the thing under test moves
// with it).
//
// MUTATION LEDGER (run red-first before this file was believed, wave 4's own protocol – the counts
// are the MEASURED reds, not predictions):
//   ARM 1  the draw hoisted above the gate in `rollWedding`      → 2 RED: §B.1 (keys on ineligible
//          weeks) and §B.2 (the eligible week now derives two keys where one is asserted)
//   ARM 2  `LIFE_BEAT_BLOCKING.engaged` flipped to false         → 5 RED: §C.2's own pin plus every
//          case that answers through `pendingLifeBeat` – the block contract is load-bearing
//   ARM 3  `blessBond` re-priced to 0 in the engine's table      → 1 RED: §D.2, the drafted +2.5
//          transcribed from the brief is exactly what a silent re-price cannot get past

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's §B apparatus, verbatim and for its reason. Every
// draw is the engine's own; the mock exists only so §B can COUNT the keys the gate reached.
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
  activeEpisode,
  answerLifeBeat,
  buildLifeBeatPrompt,
  createWorld,
  kidAgeExact,
  lifeLogOf,
  pendingLifeBeat,
  rollWedding,
  weddingEligible,
  LIFE_BEAT_BLOCKING,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { drainLifeBeats, DRAIN_ANSWER, drainCostOf } from '../tools/_lifeBeats'
import type { LoveEpisode } from '../src/shared/protocol'

const WEDDING = ECONOMY.wedding

beforeEach(() => {
  rngKeys.length = 0
})

// -------------------------------------------------------------------------------------------------
// FIXTURES – wave 4's own, verbatim in a newer situation
// -------------------------------------------------------------------------------------------------

/** The FIRST week she reads at or above `years` – walked on the engine's own clock, never our
 *  arithmetic (`tests/wave4-ends.test.ts`'s helper). */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

/** A row of the v83 shape. `endedWeek: null` is «still going». */
function episode(sinceWeek: number, endedWeek: number | null = null): LoveEpisode {
  return { id: `p:${sinceWeek}`, sinceWeek, endedWeek, knownWeek: sinceWeek + 2, wants: 'open', partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null, latchedWeek: null, partnerName: null }
}

/** A career, parked at `week`, with whatever love life the case needs – a REAL `createWorld`. */
function careerAt(seed: string, week: number, ...rows: LoveEpisode[]): WorldState {
  const world = createWorld(seed)
  world.season = []
  world.week = week
  world.loveEpisodes = rows
  return world
}

/** A career standing at 23+ with an episode DEEP enough to marry – the eligible fixture every
 *  section starts from. The episode began `depth` weeks before «now». */
function marriageable(seed: string, depth = WEDDING.minEpisodeWeeks): WorldState {
  const probe = createWorld(seed)
  const week = weekAtAge(probe, WEDDING.ageGate)
  return careerAt(seed, week, episode(week - depth))
}

/** The first week at or after `world.week` whose wedding uniform lands under the drafted hazard –
 *  found on the engine's own stream, so a case that needs a HIT stands on a real one. */
function firstHit(world: WorldState): number {
  for (let w = world.week; w < world.week + 2000; w++) {
    if (rngFromSeed(`${world.seed}:life:wedding:${w}`)() < WEDDING.perWeek) return w
  }
  throw new Error('no wedding hit inside 2000 weeks')
}

/** Park an eligible career on its first hit week, keeping the episode exactly `depth` weeks old. */
function onHitWeek(seed: string, depth = WEDDING.minEpisodeWeeks): WorldState {
  const world = marriageable(seed, depth)
  const hit = firstHit(world)
  world.week = hit
  world.loveEpisodes = [episode(hit - depth)]
  return world
}

// =================================================================================================
// A. THE GATE – all four clauses, and each one alone refuses
// =================================================================================================
describe('wave 7 T2 A – `weddingEligible`, the four clauses', () => {
  it('⭐ under 23 refuses, however deep the episode – the RULED gate lives in the hazard', () => {
    const probe = createWorld('w7-age')
    const week = weekAtAge(probe, 22)
    const world = careerAt('w7-age', week, episode(week - WEDDING.minEpisodeWeeks * 2))
    expect(activeEpisode(world), 'the fixture holds a deep, live episode').not.toBeNull()
    expect(weddingEligible(world), 'a 22-year-old is refused by the age clause alone').toBe(false)
    // ...and the SAME world one year on clears, which is what makes the refusal the age's own doing.
    world.week = weekAtAge(world, WEDDING.ageGate)
    world.loveEpisodes = [episode(world.week - WEDDING.minEpisodeWeeks * 2)]
    expect(weddingEligible(world), 'the same shape at 23 clears').toBe(true)
  })

  it('an empty slot refuses, and an ENDED episode is an empty slot', () => {
    const world = marriageable('w7-slot')
    world.loveEpisodes = []
    expect(weddingEligible(world), 'nobody to marry').toBe(false)
    world.loveEpisodes = [episode(world.week - WEDDING.minEpisodeWeeks * 2, world.week - 1)]
    expect(activeEpisode(world), 'an ended row is not an active episode').toBeNull()
    expect(weddingEligible(world), 'and it cannot be married into').toBe(false)
  })

  it('⭐ the depth clears ON the boundary week – 51 weeks refuses, 52 clears, from `sinceWeek` alone', () => {
    const world = marriageable('w7-depth', WEDDING.minEpisodeWeeks - 1)
    expect(weddingEligible(world), 'one week short of the threshold refuses').toBe(false)
    world.loveEpisodes = [episode(world.week - WEDDING.minEpisodeWeeks)]
    expect(weddingEligible(world), 'the boundary week itself clears').toBe(true)
  })

  it('⚠ the receipt refuses forever – once per episode, answered or not, which is the second-wedding shape', () => {
    const world = onHitWeek('w7-receipt')
    rollWedding(world)
    expect(pendingLifeBeat(world)?.kind, 'the fixture really raised the beat').toBe('engaged')
    expect(weddingEligible(world), 'an asked episode cannot be asked again while pending').toBe(false)
    answerLifeBeat(world, 'bless')
    expect(weddingEligible(world), '…nor after the answer – the record is the receipt').toBe(false)
    // ⚠ AND A LATER EPISODE'S OWN ROW STARTS CLEAN – the 11.09 re-shape's whole point: end this one,
    // seat a new deep one, and the machinery is re-entered with zero migrations.
    world.loveEpisodes[0].endedWeek = world.week
    world.week += WEDDING.minEpisodeWeeks + 10
    world.loveEpisodes.push(episode(world.week - WEDDING.minEpisodeWeeks))
    expect(weddingEligible(world), 'a second wedding is the same machinery on a later row').toBe(true)
  })
})

// =================================================================================================
// B. ZERO DRAWS ON AN INELIGIBLE WEEK – the count-keys net, with its positive control
// =================================================================================================
describe('wave 7 T2 B – the gate returns before any stream exists', () => {
  const weddingKeys = () => rngKeys.filter((k) => k.includes(':life:wedding:'))

  it('⚠⚠ an ineligible week derives NO wedding key – all four refusals, counted', () => {
    for (const [name, world] of [
      ['under-age', (() => { const w = createWorld('w7-b1'); w.week = weekAtAge(w, 22); w.loveEpisodes = [episode(w.week - 104)]; w.season = []; return w })()],
      ['empty slot', (() => { const w = marriageable('w7-b2'); w.loveEpisodes = []; return w })()],
      ['shallow episode', marriageable('w7-b3', WEDDING.minEpisodeWeeks - 1)],
      ['the receipt', (() => { const w = onHitWeek('w7-b4'); rollWedding(w); answerLifeBeat(w, 'distance'); return w })()],
    ] as const) {
      rngKeys.length = 0
      rollWedding(world)
      expect(weddingKeys(), `⚠⚠ ${name}: an ineligible week took a draw`).toEqual([])
    }
  })

  it('⭐ the positive control: an eligible week derives exactly its own key, and nothing else', () => {
    const world = marriageable('w7-b5')
    rngKeys.length = 0
    rollWedding(world)
    expect(weddingKeys(), 'one uniform, one week, its own key').toEqual([`${world.seed}:life:wedding:${world.week}`])
    // ⚠ AND ONLY that key – the roll reaches no sibling's stream, §5's «no section may read another
    // section's key» law counted rather than trusted.
    expect(rngKeys.filter((k) => k.includes(':life:') && !k.includes(':life:wedding:')), 'no sibling stream is touched').toEqual([])
  })
})

// =================================================================================================
// C. THE RAISE – the row, the block, and what a raise does NOT write
// =================================================================================================
describe('wave 7 T2 C – the `engaged` beat', () => {
  it('⭐ a hit raises one row: her week, the kind, the EPISODE ID as detail, unanswered', () => {
    const world = onHitWeek('w7-raise')
    const episodeId = world.loveEpisodes[0].id
    rollWedding(world)
    const rows = lifeLogOf(world).filter((r) => r.kind === 'engaged')
    expect(rows, 'exactly one row').toHaveLength(1)
    expect(rows[0], 'the record is the queue').toEqual({ week: world.week, kind: 'engaged', detail: episodeId, answer: null })
  })

  it('⚠⚠ it BLOCKS – the biggest ask so far stops the week until it is answered', () => {
    expect(LIFE_BEAT_BLOCKING.engaged, 'declared blocking, per kind and by type').toBe(true)
    const world = onHitWeek('w7-block')
    rollWedding(world)
    expect(pendingLifeBeat(world)?.kind, 'and the queue reports it as the pending beat').toBe('engaged')
  })

  it('⚠ a raise writes NOTHING else on this tree – no latch, no name, no feed row, no cents', () => {
    const world = onHitWeek('w7-silent')
    const events = world.events.length
    const funds = world.fundsCents
    rollWedding(world)
    expect(world.loveEpisodes[0].latchedWeek, 'the latch is T3\'s, weeks after the answer').toBeNull()
    expect(world.loveEpisodes[0].partnerName, 'the name is T3\'s, at this beat but not on this tree').toBeNull()
    expect(world.events.length, 'no feed row at the raise').toBe(events)
    expect(world.fundsCents, 'and no money moved').toBe(funds)
  })

  it('a miss raises nothing – the hazard is a hazard, not a schedule', () => {
    const world = marriageable('w7-miss')
    // park on a week whose uniform is a miss (≥ perWeek): scan for one on the engine's own stream
    for (let w = world.week; w < world.week + 2000; w++) {
      if (rngFromSeed(`${world.seed}:life:wedding:${w}`)() >= WEDDING.perWeek) {
        world.week = w
        world.loveEpisodes = [episode(w - WEDDING.minEpisodeWeeks)]
        break
      }
    }
    rollWedding(world)
    expect(lifeLogOf(world).filter((r) => r.kind === 'engaged'), 'no row on a missed week').toHaveLength(0)
  })
})

// =================================================================================================
// D. THE ANSWER – through the one seam, priced against the BRIEF'S literals
// =================================================================================================
describe('wave 7 T2 D – bless / keep distance / oppose, on `answerLifeBeat`', () => {
  /** An engaged beat standing, at the neutral bond 70 – inside her own voice (`speaksInHerOwnVoice`
   *  is false below 55) and far from both rails, so no delta can clamp and her line is hers. */
  function asked(seed: string): WorldState {
    const world = onHitWeek(seed)
    world.bond = 70
    rollWedding(world)
    return world
  }

  it('⭐ the prompt is the engine\'s: the drafted heading, her line, and exactly the three ids', () => {
    const world = asked('w7-prompt')
    const prompt = buildLifeBeatPrompt(world)!
    expect(prompt.kind).toBe('engaged')
    expect(prompt.heading, 'one frame, keyed on nothing').toBe('A wedding is coming, and she has made up her mind')
    expect(prompt.said, 'she announces, in her own voice at a mid bond').toContain('We are getting married')
    expect(prompt.options.map((o) => o.id), 'the research digest\'s own triple, in order').toEqual(['bless', 'distance', 'oppose'])
    expect(prompt.followUps, 'no listen detour – the decision is finished').toEqual([])
  })

  it('⭐⭐ the three prices are the BRIEF\'S drafted literals: +2.5 / −1 / −4 on `bond`', () => {
    // ⚠ TRANSCRIBED FROM THE WAVE-7 BRIEF'S T2 («drafted deltas +2.5 / −1 / −4»), never read off
    // `ECONOMY.wedding` – ARM 2's law: an expectation read out of the thing under test moves with it.
    for (const [id, delta] of [
      ['bless', 2.5],
      ['distance', -1],
      ['oppose', -4],
    ] as const) {
      const world = asked(`w7-price-${id}`)
      const before = world.bond
      answerLifeBeat(world, id)
      expect(world.bond - before, `${id}: the drafted delta, exactly`).toBeCloseTo(delta, 10)
      expect(pendingLifeBeat(world), `${id}: and the week is released`).toBeNull()
      expect(lifeLogOf(world).find((r) => r.kind === 'engaged')?.answer, `${id}: recorded on the row`).toBe(id)
    }
  })

  it('⚠ engine-side re-validation: an id this beat never offered is refused', () => {
    const world = asked('w7-reval')
    expect(() => answerLifeBeat(world, 'back'), 'the fork\'s answer is not this card\'s').toThrow()
    expect(pendingLifeBeat(world)?.kind, 'and the beat still stands').toBe('engaged')
  })

  it('the answer writes its feed line – an `info` row, no amount, no price in the words', () => {
    const world = asked('w7-row')
    answerLifeBeat(world, 'bless')
    const row = world.events[world.events.length - 1]
    expect(row.type).toBe('info')
    expect(row.text).toBe('She said she is getting married. We gave them our blessing.')
    expect(row.amountCents, 'a life beat is never a purchase (rule 4)').toBeUndefined()
  })

  it('⭐ the drain: `distance` at the one −1 a harness can state, under every reading', () => {
    expect(DRAIN_ANSWER.engaged, 'the registry names the mildest answer').toBe('distance')
    expect(drainCostOf('engaged'), 'read-independent by construction – no overlay names this kind').toBe(-1)
    const world = asked('w7-drain')
    const before = world.bond
    expect(drainLifeBeats(world), 'the shared helper answers the row').toBe(1)
    expect(world.bond - before, 'at the stated −1 exactly').toBeCloseTo(-1, 10)
  })
})
