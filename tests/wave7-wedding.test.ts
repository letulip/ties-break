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
//   ARM 4  `landWedding`'s ended-episode gate removed            → 1 RED: §F's dead-episode case –
//          a wedding landed on a partner already gone
//   ARM 5  `landWedding`'s latch gate removed                    → 1 RED: §F's idempotency case –
//          the second pass re-billed the family
//   ARM 6  the name's `??=` flattened to `=`                     → 1 RED: §E's persistence case –
//          a husband renamed on a re-walk, T1's law broken

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
  landWedding,
  partnerNameFor,
  rollWedding,
  weddingEligible,
  LIFE_BEAT_BLOCKING,
  PARTNER_NAME_POOL,
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
function marriageable(seed: string, depth: number = WEDDING.minEpisodeWeeks): WorldState {
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
function onHitWeek(seed: string, depth: number = WEDDING.minEpisodeWeeks): WorldState {
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

  it('⚠ a raise writes the NAME and nothing else – no latch, no feed row, no cents', () => {
    // ⚠ RE-AIMED BY T3 IN ITS OWN WAVE, exactly as the case's first title («on this tree») was
    // written to be: the engagement now writes `partnerName` – the one T3 write that belongs to the
    // BEAT rather than to the day – and the latch, the rows and the money stay `landWedding`'s,
    // `weeksAfterEngagement` weeks after the answer. §E owns the name's own assertions.
    const world = onHitWeek('w7-silent')
    const events = world.events.length
    const funds = world.fundsCents
    rollWedding(world)
    expect(world.loveEpisodes[0].latchedWeek, 'the latch is the day\'s, weeks after the answer').toBeNull()
    expect(world.loveEpisodes[0].partnerName, 'the name lands at the announcement').not.toBeNull()
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

// =================================================================================================
// E. THE NAME – wave 7 T3: written once, at the engagement, and persisted
// =================================================================================================
describe('wave 7 T3 E – `partnerNameFor` and the one write', () => {
  it('⭐ the raise writes the name, from the pool, on the episode row', () => {
    const world = onHitWeek('w7-name')
    rollWedding(world)
    const name = world.loveEpisodes[0].partnerName
    expect(name, 'he has a name from the moment she says it').not.toBeNull()
    expect(PARTNER_NAME_POOL, 'and it is one of the drafted pool').toContain(name!)
  })

  it('⭐⭐ the draw is (seed, episode)-keyed and deterministic – the same husband every time', () => {
    expect(partnerNameFor('w7-det', 'p:100'), 'same key, same name').toBe(partnerNameFor('w7-det', 'p:100'))
    // ...and the key is the EPISODE, so a later episode may meet a different man while a reload
    // meets the same one. (Two ids CAN draw one name – the pool is finite – so the assertion is
    // determinism, never distinctness.)
    const first = partnerNameFor('w7-det', 'p:100')
    const names = ['p:200', 'p:300', 'p:400', 'p:500', 'p:600'].map((id) => partnerNameFor('w7-det', id))
    expect(names.some((n) => n !== first), 'the episode id really is in the key').toBe(true)
  })

  it('⚠⚠ the raise derives exactly TWO keys – the hazard and the name – and no MAIN', () => {
    const world = onHitWeek('w7-name-keys')
    rngKeys.length = 0
    rollWedding(world)
    expect(rngKeys, 'one uniform each, own keys, in raise order').toEqual([
      `${world.seed}:life:wedding:${world.week}`,
      `${world.seed}:life:partner-name:${world.loveEpisodes[0].id}`,
    ])
  })

  it('⚠⚠ PERSISTED, NEVER RE-DERIVED AT READ – a name already on the row survives the raise', () => {
    // The `??=` arm: the write happens once, and a row that already holds a name (a re-walked or
    // hand-carried world) keeps it – the same property the migration's `??=` gives the two seats.
    const world = onHitWeek('w7-keep')
    world.loveEpisodes[0].partnerName = 'Igorek'
    rollWedding(world)
    expect(world.loveEpisodes[0].partnerName, 'nobody is renamed').toBe('Igorek')
  })

  it('⚠ house trademark law, by construction: ≥ 24 single-token first names, no surname anywhere', () => {
    expect(PARTNER_NAME_POOL.length, 'the brief\'s floor').toBeGreaterThanOrEqual(24)
    expect(new Set(PARTNER_NAME_POOL).size, 'no duplicate rows').toBe(PARTNER_NAME_POOL.length)
    for (const name of PARTNER_NAME_POOL) {
      expect(/^[A-Z][a-z]+$/.test(name), `«${name}» is one capitalised token – no spaces, no initials, no surname to construct`).toBe(true)
    }
  })
})

// =================================================================================================
// F. THE LANDING – wave 7 T3: `weeksAfterEngagement` later, on ANY answer
// =================================================================================================
describe('wave 7 T3 F – `landWedding`', () => {
  /** An engagement asked and answered, parked N weeks after the answer week. */
  function answered(seed: string, answer: 'bless' | 'distance' | 'oppose', weeksOn: number): WorldState {
    const world = onHitWeek(seed)
    world.bond = 70
    rollWedding(world)
    answerLifeBeat(world, answer)
    world.week += weeksOn
    return world
  }

  it('⭐⭐ the day comes: the latch, ONE kept feed row, ONE album entry, ONE ledger event', () => {
    const world = answered('w7-land', 'bless', WEDDING.weeksAfterEngagement)
    const funds = world.fundsCents
    landWedding(world)
    const episodeRow = world.loveEpisodes[0]
    expect(episodeRow.latchedWeek, 'the latch is the wedding week, on the row').toBe(world.week)
    const kept = world.events.filter((e) => e.milestoneKey === `wedding:${episodeRow.id}`)
    expect(kept, 'one feed row, kept past every prune').toHaveLength(1)
    expect(kept[0].keep).toBe(true)
    expect(world.milestones.filter((m) => m.type === 'wedding'), 'one album entry').toEqual([
      { type: 'wedding', week: world.week, kind: episodeRow.id },
    ])
    expect(world.fundsCents - funds, 'the cost, once, through the family wallet').toBe(-WEDDING.costCents)
    const bill = world.events.filter((e) => e.type === 'expense' && e.amountCents === -WEDDING.costCents)
    expect(bill, 'as ONE ledger event').toHaveLength(1)
  })

  it('⭐ ANY answer lands it – opposing bought the bond price, never the calendar', () => {
    for (const answer of ['bless', 'distance', 'oppose'] as const) {
      const world = answered(`w7-any-${answer}`, answer, WEDDING.weeksAfterEngagement)
      landWedding(world)
      expect(world.loveEpisodes[0].latchedWeek, `${answer}: she married anyway`).toBe(world.week)
    }
  })

  it('not a week early', () => {
    const world = answered('w7-early', 'bless', WEDDING.weeksAfterEngagement - 1)
    const funds = world.fundsCents
    landWedding(world)
    expect(world.loveEpisodes[0].latchedWeek, 'the clock has not come due').toBeNull()
    expect(world.fundsCents, 'and nothing was charged').toBe(funds)
  })

  it('⚠⚠ idempotent by the latch: the day lands ONCE, however many weeks walk past it', () => {
    const world = answered('w7-once', 'bless', WEDDING.weeksAfterEngagement)
    landWedding(world)
    const funds = world.fundsCents
    const events = world.events.length
    world.week += 5
    landWedding(world)
    expect(world.fundsCents, 'no second bill').toBe(funds)
    expect(world.events.length, 'no second row').toBe(events)
    expect(world.milestones.filter((m) => m.type === 'wedding'), 'no second entry').toHaveLength(1)
  })

  it('⚠ an episode that ENDED inside the eight weeks is a wedding that never happens', () => {
    const world = answered('w7-gone', 'bless', WEDDING.weeksAfterEngagement)
    world.loveEpisodes[0].endedWeek = world.week - 2
    const funds = world.fundsCents
    landWedding(world)
    expect(world.loveEpisodes[0].latchedWeek, 'no latch on a dead episode').toBeNull()
    expect(world.fundsCents, 'no bill for a day that never came').toBe(funds)
    // ...and forever: the receipt on the row keeps the gate shut, so it cannot land later either.
    world.week += 100
    landWedding(world)
    expect(world.loveEpisodes[0].latchedWeek).toBeNull()
  })

  it('an unanswered beat starts no clock – crafted, because the block contract hides this in play', () => {
    const world = onHitWeek('w7-unanswered')
    rollWedding(world)
    world.week += WEDDING.weeksAfterEngagement + 3
    landWedding(world)
    expect(world.loveEpisodes[0].latchedWeek, 'no answer, no date').toBeNull()
  })

  it('⚠ landing draws NOTHING – zero keys on the landing path', () => {
    const world = answered('w7-nodraw', 'distance', WEDDING.weeksAfterEngagement)
    rngKeys.length = 0
    landWedding(world)
    expect(rngKeys, 'four gates and four writes, not one stream').toEqual([])
  })
})
