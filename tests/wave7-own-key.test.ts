// WAVE 7 – T10: THE INDEPENDENT-LIFE BEAT (life/wave-7;
// docs/plans/life-wave-7-builder-2026-09.md §2 T10, backlog §8 adopted by the 18.09 go).
//
// One-time, NON-blocking, narrative-only – so what this file pins is the ONCE-ness, the ZERO-ness
// (zero draws, zero cents, zero bond) and the two surfaces (the kept feed row and the soft card),
// against the machinery's own selectors. The count-keys net is wave 3's standing law; here the
// claim is total silence – `deliverOwnKey` derives NO key on ANY path – which is stronger than a
// gate-ordering claim and is counted the same way.
//
// MUTATION LEDGER (run red-first, wave 4's protocol – MEASURED reds):
//   ARM 1  a purpose-scoped coin added to `deliverOwnKey`           → 2 RED: §B's zero-draw arms
//   ARM 2  the receipt clause deleted from `ownKeyDue`              → 1 RED: §A's receipt case
//          (§C's once-ness stays green there because the raise week's own live soft row still
//          defers the second pass – the receipt is what makes the once-ness hold FOREVER, and the
//          receipt case is where that is measured)
//   ARM 3  the stage test relaxed to a raw 22 (`ageYears >= 22`)    → 1 RED: §A's college arm –
//          a dorm week wearing «her own front door»
//   ARM 4  `LIFE_BEAT_BLOCKING['own-key']` flipped to true          → 1 RED: §C.2's own pin
//   ARM 5  a bond delta smuggled onto the `keep` answer (0 → 0.5)   → 2 RED: §D's no-move case and
//          §D's drain-registry zero

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
  answerLifeBeat,
  buildLifeBeatPrompt,
  buildSoftBeatInvite,
  createWorld,
  deliverOwnKey,
  kidAgeExact,
  lifeLogOf,
  liveSoftBeat,
  ownKeyDue,
  ownKeyThisWeek,
  pendingLifeBeat,
  raiseLifeBeat,
  LIFE_BEAT_BLOCKING,
  type WorldState,
} from '../src/engine/world'
import { drainCostOf } from '../tools/_lifeBeats'

beforeEach(() => {
  rngKeys.length = 0
})

/** The FIRST week she reads at or above `years` – the engine's own clock (wave 7's shared shape). */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

/** A career parked at its first `independent` week – 22+, school long over, no college. */
function independent(seed: string): WorldState {
  const world = createWorld(seed)
  world.season = []
  world.week = weekAtAge(world, 22) + 1
  return world
}

const ownKeyRows = (world: WorldState) => world.events.filter((e) => e.lifeKind === 'own-key')

// =================================================================================================
// A. THE GATE – the stage, the receipt, and the courteous deferral
// =================================================================================================
describe('wave 7 T10 A – `ownKeyDue`', () => {
  it('⭐ the INDEPENDENT stage is the gate – a schoolgirl and a college girl both refuse', () => {
    const young = createWorld('w7k-a1')
    young.season = []
    young.week = weekAtAge(young, 21)
    expect(ownKeyDue(young), 'under the stage cut').toBe(false)
    const world = independent('w7k-a1')
    expect(ownKeyDue(world), 'the first independent week clears').toBe(true)
    // ⚠ a dorm is not her own front door: the same week INSIDE a college span refuses (ARM 3).
    world.college = { fromWeek: world.week - 10, untilWeek: world.week + 42, doneWeek: null, years: [], pendingCallUp: null, pendingLeague: null }
    expect(ownKeyDue(world), 'a college week defers the beat to the week the campus is behind her').toBe(false)
  })

  it('⚠ the receipt refuses forever – the log answers «has this happened»', () => {
    const world = independent('w7k-a2')
    deliverOwnKey(world)
    expect(lifeLogOf(world).some((r) => r.kind === 'own-key'), 'the fixture really delivered').toBe(true)
    expect(ownKeyDue(world)).toBe(false)
    world.week += 200
    expect(ownKeyDue(world), 'not at any later age either').toBe(false)
  })

  it('⚠ a busy surface DEFERS, never cancels – the next free tick delivers', () => {
    const world = independent('w7k-a3')
    raiseLifeBeat(world, 'small-talk', 'worry')
    expect(liveSoftBeat(world), 'the soft surface is busy').not.toBeNull()
    deliverOwnKey(world)
    expect(lifeLogOf(world).some((r) => r.kind === 'own-key'), 'nothing lands on a busy week').toBe(false)
    // three weeks on the small-talk window has closed, and the delivery is still owed
    world.week += 3
    deliverOwnKey(world)
    expect(lifeLogOf(world).some((r) => r.kind === 'own-key'), 'the receipt was never written, so the next free tick asks again').toBe(true)
  })
})

// =================================================================================================
// B. ZERO DRAWS, ON EVERY PATH – nothing to decide, so no coin
// =================================================================================================
describe('wave 7 T10 B – the delivery is draw-free', () => {
  it('⚠⚠ a delivering week derives NO key at all', () => {
    const world = independent('w7k-b1')
    rngKeys.length = 0
    deliverOwnKey(world)
    expect(lifeLogOf(world).some((r) => r.kind === 'own-key'), 'the fixture really delivered').toBe(true)
    expect(rngKeys, 'one scene, one week, zero randomness').toEqual([])
  })

  it('⚠⚠ and a refusing week derives nothing either', () => {
    const world = createWorld('w7k-b2')
    world.season = []
    world.week = weekAtAge(world, 20)
    rngKeys.length = 0
    deliverOwnKey(world)
    expect(rngKeys).toEqual([])
  })
})

// =================================================================================================
// C. THE TWO SURFACES – the kept row and the soft card, once
// =================================================================================================
describe('wave 7 T10 C – narrative-only, twice visible, once ever', () => {
  it('⭐ one kept `life` row, stamped with the kind, and one soft lifeLog row', () => {
    const world = independent('w7k-c1')
    deliverOwnKey(world)
    const rows = ownKeyRows(world)
    expect(rows, 'exactly one feed row').toHaveLength(1)
    expect(rows[0].type).toBe('life')
    expect(rows[0].keep, 'the album may not be missing the week she moved out').toBe(true)
    expect(rows[0].amountCents, 'no cents – rule 4').toBeUndefined()
    // ⚠ DRAFT PIN – asserts what the string IS and moves with the owner's pass (T7).
    expect(rows[0].text).toBe('She has her own place now. A spare key lives on the hook, and Sunday dinner stands.')
    expect(lifeLogOf(world)).toEqual([{ week: world.week, kind: 'own-key', detail: 'own-key', answer: null }])
    // ⚠⚠ and the SECOND pass writes nothing – the receipt is the once-ness (ARM 2).
    deliverOwnKey(world)
    expect(ownKeyRows(world)).toHaveLength(1)
    expect(lifeLogOf(world)).toHaveLength(1)
  })

  it('⚠⚠ it does NOT block, and the soft card wears its own line', () => {
    expect(LIFE_BEAT_BLOCKING['own-key'], 'declared narrative-only, per kind and by type').toBe(false)
    const world = independent('w7k-c2')
    deliverOwnKey(world)
    expect(pendingLifeBeat(world), 'the week never stops for a housewarming').toBeNull()
    expect(buildLifeBeatPrompt(world)).toBeNull()
    const invite = buildSoftBeatInvite(world)
    // ⚠ DRAFT PINS (T7's table).
    expect(invite!.card).toBe('She came by with a spare key.')
    expect(invite!.prompt.heading).toBe('She lives behind her own door now')
    expect(invite!.prompt.said).toContain('A spare key went onto the hook')
    expect(invite!.prompt.options.map((o) => o.id)).toEqual(['keep'])
  })

  it('⭐ the diary flag is the raise week alone', () => {
    const world = independent('w7k-c3')
    deliverOwnKey(world)
    expect(ownKeyThisWeek(world)).toBe(true)
    world.week += 1
    expect(ownKeyThisWeek(world), 'one line, once – the note must not stutter').toBe(false)
  })
})

// =================================================================================================
// D. THE ANSWER – an acknowledgment that moves NOTHING
// =================================================================================================
describe('wave 7 T10 D – NO mechanic, NO cost, NO bond move', () => {
  it('⚠⚠ answering `keep` moves neither bond, nor spirit, nor a cent, and writes no row', () => {
    const world = independent('w7k-d1')
    deliverOwnKey(world)
    world.bond = 50
    const spirit = world.spirit
    const funds = world.fundsCents
    const events = world.events.length
    answerLifeBeat(world, 'keep')
    expect(world.bond, 'backlog §8\'s own price: nothing').toBe(50)
    expect(world.spirit).toBe(spirit)
    expect(world.fundsCents).toBe(funds)
    expect(world.events.length, 'ANSWER_EVENT is null – the raise already wrote the kept row').toBe(events)
    expect(lifeLogOf(world)[0].answer).toBe('keep')
  })

  it('⚠ the drain registry prices it at the ruled zero', () => {
    expect(drainCostOf('own-key')).toBe(0)
  })
})
