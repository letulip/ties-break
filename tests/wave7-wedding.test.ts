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
//          ⚠ RE-RUN 18.09, after the cost was ruled out («я думаю как с подарками, никто и
//          нисколько» – the re-bill no longer exists to red on): still 1 RED, now §F's DATE
//          assertion – the second pass re-stamped the wedding onto the later week (582 vs 577).
//          Without that added assertion this arm measured GREEN, which is why it was added.
//   ARM 6  the name's `??=` flattened to `=`                     → 1 RED: §E's persistence case –
//          a husband renamed on a re-walk, T1's law broken
//   ARM 7  the latch seam removed from `rollEnds`                → 1 RED: §G's discriminating week –
//          the marriage ended at the unlatched hazard
//   ARM 8  the charge smuggled back into `landWedding` (18.09,   → 1 RED: §F's day-comes guard –
//          run red-first for the ruling's flip: a `fundsCents`      the kept row is no longer the
//          write plus an expense row re-added, then removed)        only event (4 vs 3); the
//          funds-untouched assertion sits one line behind it in the same case

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
  endsHazardFor,
  kidAgeExact,
  lifeLogOf,
  pendingLifeBeat,
  landWedding,
  partnerNameFor,
  rollEnds,
  rollWedding,
  weddingEligible,
  LIFE_BEAT_BLOCKING,
  PARTNER_NAME_POOL,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { expressedTemperamentOf } from '../src/engine/spirit'
import { drainLifeBeats, DRAIN_ANSWER, drainCostOf } from '../tools/_lifeBeats'
import type { LoveEpisode } from '../src/shared/protocol'
import { MEMORY_EMOTION } from '../src/engine/diary'
import { paintedFaceFor, portraitStage } from '../src/shared/avatarEmotion'

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
    // BEAT rather than to the day – and the latch and the rows stay `landWedding`'s,
    // `weeksAfterEngagement` weeks after the answer. §E owns the name's own assertions.
    // (⚠ 18.09: the money since left `landWedding` too – ruled out, «как с подарками» – so the
    // funds check below is now the raise's own no-money guard, same as the landing's in §F.)
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

  it('⭐⭐ the day comes: the latch, ONE kept feed row, ONE album entry – and funds UNTOUCHED', () => {
    // ⚠ RE-AIMED 18.09 – THE COST WAS RULED OUT while T8's bench was being read, in his own words:
    // «я думаю как с подарками, никто и нисколько» – the wedding follows the gifts' law, nobody pays
    // and nothing (docs/specs/the-wedding-2026-09.md §3c keeps the drafted charge's measured
    // record). The old assertion (funds down by the drafted charge, one expense row) FLIPS into the guard: funds
    // untouched and the kept row the ONLY event – a smuggled charge must redden here (ARM 8's red).
    const world = answered('w7-land', 'bless', WEDDING.weeksAfterEngagement)
    const funds = world.fundsCents
    const eventsBefore = world.events.length
    landWedding(world)
    const episodeRow = world.loveEpisodes[0]
    expect(episodeRow.latchedWeek, 'the latch is the wedding week, on the row').toBe(world.week)
    const kept = world.events.filter((e) => e.milestoneKey === `wedding:${episodeRow.id}`)
    expect(kept, 'one feed row, kept past every prune').toHaveLength(1)
    expect(kept[0].keep).toBe(true)
    expect(world.events.length, '…and that kept row is the ONLY event the landing writes').toBe(eventsBefore + 1)
    expect(world.milestones.filter((m) => m.type === 'wedding'), 'one album entry').toEqual([
      { type: 'wedding', week: world.week, kind: episodeRow.id },
    ])
    expect(world.fundsCents, '⚠ funds are UNTOUCHED by the landing – nobody pays and nothing (18.09)').toBe(funds)
  })

  it('⭐ ANY answer lands it – opposing bought the bond price, never the calendar', () => {
    for (const answer of ['bless', 'distance', 'oppose'] as const) {
      const world = answered(`w7-any-${answer}`, answer, WEDDING.weeksAfterEngagement)
      landWedding(world)
      expect(world.loveEpisodes[0].latchedWeek, `${answer}: she married anyway`).toBe(world.week)
    }
  })

  it('⭐⭐⭐ THE PAINTED BRIDE IS DRAWN – the picture the 23+ ruling was about, finally wired', () => {
    // ⚠⚠ WHAT WAS WRONG, AND THE DRAFT NOTE IN THE CODE IS WHAT FOUND IT. The wedding shipped with
    // `MEMORY_EMOTION.wedding = 'happy'` and an argument that read «the bride art the 11.09 ruling
    // gated the whole branch on is painted smiling» – right about the painting, wrong about which
    // painting was being DRAWN. `'happy'` is her ordinary adult face, so the polaroid of her wedding
    // day showed a girl with a trophy, while `fem-euro-brunnet-adult-bride.webp` sat on disk
    // referenced by nothing in `src/`.
    //
    // ⚠⚠ THE ARM. Put `'happy'` back and this goes red on its first line – measured 18.09, RED
    // [1 test, 1 assertion]. ⚠ NOTE WHAT THE ARM DOES NOT COVER, said out loud: the BAND fallback is
    // the other half of this wiring and it lives in tests/portrait-bands.test.ts, where the files on
    // disk are. A milestone pointing at a picture proves nothing about the picture existing.
    expect(MEMORY_EMOTION.wedding, 'her wedding day wears the wedding painting').toBe('bride')

    // ...and the milestone this type is keyed on really is the one `landWedding` writes, so the two
    // halves are joined rather than adjacent.
    const world = answered('w7-bride', 'bless', WEDDING.weeksAfterEngagement)
    landWedding(world)
    const row = world.milestones.find((m) => m.type === 'wedding')
    expect(row, 'the landing wrote it').toBeDefined()
    expect(MEMORY_EMOTION[row!.type], 'and the memory of it draws the bride').toBe('bride')

    // ⚠⚠ THE GATE IS 23+ AND THAT IS TWO BANDS, NOT ONE – which is the whole reason the fallback had
    // to be built rather than argued away. `adult` is 23-30 and HAS the art; `lateCareer` is 31+ and
    // does not, and a first marriage in the thirties is an ordinary career, not an edge case. The
    // band a walked fixture lands in is the hazard's business, so it is READ rather than asserted:
    // what this arm states is that whichever of the two she reaches, the face resolves and the file
    // it names is one that ships.
    const age = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
    expect(age, 'the 23+ gate held on the walked career').toBeGreaterThanOrEqual(WEDDING.ageGate)
    expect(['adult', 'lateCareer'], 'a 23+ bride is in one of these two bands').toContain(portraitStage(age))
    expect(paintedFaceFor('adult', MEMORY_EMOTION.wedding)).toBe('bride')
    expect(paintedFaceFor('lateCareer', MEMORY_EMOTION.wedding), 'a first marriage at 31 is a woman of 31').toBe('norm')
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
    const day = world.loveEpisodes[0].latchedWeek
    world.week += 5
    landWedding(world)
    expect(world.fundsCents, 'no money on the second pass either (18.09: none on the first)').toBe(funds)
    expect(world.events.length, 'no second row').toBe(events)
    expect(world.milestones.filter((m) => m.type === 'wedding'), 'no second entry').toHaveLength(1)
    // ⚠ RE-AIMED 18.09: with the charge ruled out («как с подарками») the re-bill that was this
    // case's red is gone, and the milestone channel is idempotent by key on its own – so the DATE is
    // what now keeps ARM 5 honest: a latch gate removed re-stamps the wedding onto the later week.
    expect(world.loveEpisodes[0].latchedWeek, '…and the DATE stands – the second pass re-writes nothing').toBe(day)
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
    expect(rngKeys, 'four gates and three writes, not one stream').toEqual([])
  })
})

// =================================================================================================
// G. THE LATCH'S CONSEQUENCE – wave 7 T4: the ending hazard drops hard, at one seam
// =================================================================================================
describe('wave 7 T4 G – `rollEnds` on a latched episode', () => {
  /** Two worlds a byte apart: the same seed, the same week, the same episode – one married, one
   *  not. What separates their fates is the seam alone. */
  function pair(seed: string, week: number): { latched: WorldState; unlatched: WorldState } {
    const build = (): WorldState => careerAt(seed, week, episode(week - 200))
    const latched = build()
    latched.loveEpisodes[0].latchedWeek = week - 100
    return { latched, unlatched: build() }
  }

  /** The week's ends-uniform, read off the engine's own stream. */
  const endsRoll = (seed: string, week: number): number => rngFromSeed(`${seed}:life:ends:${week}`)()

  /** The unlatched hazard the engine would price this world at – its own reader, its own table. */
  function hazardOf(world: WorldState): number {
    return endsHazardFor(expressedTemperamentOf(world))
  }

  it('⭐⭐ the discriminating week: an ending the old hazard takes and the latch refuses', () => {
    // Found on the engine's own stream: a week whose uniform lands INSIDE [hazard × factor, hazard)
    // – big enough to end an unlatched episode, too big to end a married one. This is the seam
    // biting, measured on the one week that can tell the two products apart.
    const probe = careerAt('w7-latch', 1300, episode(1100))
    const h = hazardOf(probe)
    let week = -1
    for (let w = 1300; w < 1300 + 20000; w++) {
      const u = endsRoll(probe.seed, w)
      if (u >= h * WEDDING.latchEndFactor && u < h) { week = w; break }
    }
    expect(week, 'the stream really holds such a week').toBeGreaterThan(0)
    const { latched, unlatched } = pair('w7-latch', week)
    rollEnds(unlatched)
    rollEnds(latched)
    expect(unlatched.loveEpisodes[0].endedWeek, 'the unlatched episode ends').toBe(week)
    expect(latched.loveEpisodes[0].endedWeek, 'the married one holds').toBeNull()
  })

  it('⚠ and the door is NOT closed: a week under the scaled hazard ends a marriage too', () => {
    // The divorce door the schema pre-paid – possible and rare, wave-4's machinery untouched: the
    // date, the breakup shock, everything downstream exactly as an unlatched ending has it.
    const probe = careerAt('w7-door', 1300, episode(1100))
    const h = hazardOf(probe)
    let week = -1
    for (let w = 1300; w < 1300 + 200000; w++) {
      if (endsRoll(probe.seed, w) < h * WEDDING.latchEndFactor) { week = w; break }
    }
    expect(week, 'the stream really holds such a week (rare, not impossible)').toBeGreaterThan(0)
    const { latched } = pair('w7-door', week)
    rollEnds(latched)
    expect(latched.loveEpisodes[0].endedWeek, 'a latched episode can still end').toBe(week)
    expect(latched.loveEpisodes[0].latchedWeek, 'and the marriage stays in the biography – nothing un-writes a wedding').toBe(week - 100)
    expect(latched.spiritShock, 'wave-4\'s own mark, no new shock kind').toEqual({ week, kind: 'breakup' })
  })

  it('⚠⚠ zero RNG change: the same ONE key on a latched week as on an unlatched one', () => {
    const { latched, unlatched } = pair('w7-keys', 1500)
    rngKeys.length = 0
    rollEnds(unlatched)
    const unlatchedKeys = [...rngKeys]
    rngKeys.length = 0
    rollEnds(latched)
    expect(rngKeys, 'only the THRESHOLD moves – the stream is byte-identical').toEqual(unlatchedKeys)
    expect(rngKeys.filter((k) => k.includes(':life:ends:')), 'one uniform, one week, its own key').toEqual([`${latched.seed}:life:ends:1500`])
  })
})
