// THE WEDDING, WAVE 7 – T5: THE SPOUSE'S OPINION SURFACE (life/wave-7;
// docs/plans/life-wave-7-builder-2026-09.md §2 T5, constants in `ECONOMY.wedding`).
//
// The shapes are the standing ones and each section names its donor: §A is the gate as
// tests/wave7-wedding.test.ts §A tests `weddingEligible`; §B is the count-keys net (wave 3's
// finding, the standing LAW for every zero-draw claim – the honest net COUNTS the keys the gate
// reached, with a positive control); §C is the raise and the SOFT contract; §D is the answer
// through the one `answerLifeBeat` seam, priced against THE BUILDER'S OWN DRAFTED LITERALS and
// never against `ECONOMY.wedding` (tests/wave3-reaction.test.ts ARM 2's law: an expectation read
// out of the thing under test moves with it); §E is the four occasion gates, each against a posed
// world; §F is the cooldown.
//
// MUTATION LEDGER (run red-first before this file was believed, wave 4's own protocol – the counts
// are the MEASURED reds, not predictions):
//   ARM 1  the draw hoisted above the gate in `rollSpouseView`     → 2 RED: §B.1 (keys on
//          ineligible weeks) and §B.2 (keys on an eligible week with no occasion)
//   ARM 2  `LIFE_BEAT_BLOCKING['spouse-view']` flipped to true     → 3 RED: §C.2's own pin plus
//          the two soft-surface cases that then see a blocking row
//   ARM 3  `spouseViewHearBond` re-priced to 0 in the engine       → 1 RED: §D's `hear`, the
//          drafted +1 transcribed here is exactly what a silent re-price cannot get past
//   ARM 4  the cooldown clause deleted from `spouseViewEligible`   → 2 RED: §F.1 and §B.1's
//          inside-the-cooldown refusal, which then takes a draw
//   ARM 5  the `'distant-swing'` track test flipped to `=== 'itf'` → 12 RED: §E.1's wta arm – the
//          exact wrong spelling the gate's comment warns about – and every fixture that poses a
//          `w35` entry to raise the beat, which is most of the file
//   ARM 6  the `'money'` after-the-latch clamp removed             → 1 RED: §E.4's wedding-bill
//          arm – the spouse complaining about the wedding's own cost
//          ⚠ RE-RUN 18.09, after the wedding's cost was ruled out («я думаю как с подарками, никто
//          и нисколько») and the fixture's bill became a plain latch-week spend: still 1 RED – the
//          boundary is the gate's own and outlives the bill

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
  answerLifeBeat,
  buildLifeBeatPrompt,
  buildSoftBeatInvite,
  createWorld,
  kidAgeExact,
  latchedEpisode,
  lifeLogOf,
  liveSoftBeat,
  pendingLifeBeat,
  raiseLifeBeat,
  rollSpouseView,
  spouseViewEligible,
  spouseViewOccasionsAt,
  spouseViewOccasionThisWeek,
  LIFE_BEAT_BLOCKING,
  SPOUSE_VIEW_OCCASIONS,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { drainCostOf } from '../tools/_lifeBeats'
import type { LoveEpisode } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'

const WEDDING = ECONOMY.wedding

beforeEach(() => {
  rngKeys.length = 0
})

// -------------------------------------------------------------------------------------------------
// FIXTURES – tests/wave7-wedding.test.ts's own, carried into the married half of the same wave
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

/** A career, parked at `week`, with whatever love life the case needs – a REAL `createWorld`.
 *  ⚠ `season = []` and `financeWeeks = []`, so no occasion is true unless a case poses it. */
function careerAt(seed: string, week: number, ...rows: LoveEpisode[]): WorldState {
  const world = createWorld(seed)
  world.season = []
  world.financeWeeks = []
  world.week = week
  world.loveEpisodes = rows
  return world
}

/** A career standing married: 23+, the episode deep and LATCHED `since` weeks ago. */
function married(seed: string, latchAgo = 4): WorldState {
  const probe = createWorld(seed)
  const week = weekAtAge(probe, WEDDING.ageGate) + 30
  const row = episode(week - WEDDING.minEpisodeWeeks * 2)
  row.latchedWeek = week - latchAgo
  row.partnerName = 'Anton'
  return careerAt(seed, week, row)
}

/** A minimal entered event `inWeeks` ahead, on `tier` – the two fields the gate reads plus the
 *  structural rest. */
function enter(world: WorldState, inWeeks: number, tier: SeasonEvent['tier']): void {
  const week = world.week + inWeeks
  const id = `ev-${week}-${tier}`
  world.season.push({ id, week, tier, surface: 'hard', travelCostCents: 90000, deadlineWeek: week - 2 })
  world.entries.push(id)
}

/** `n` travel-billed weeks inside the trailing window – the finance ledger's own shape, negative
 *  cents for a spend (snapshot.ts's read: «a travel bill was actually paid»). */
function roadWeeks(world: WorldState, n: number): void {
  for (let i = 0; i < n; i++) {
    world.financeWeeks.push({ week: world.week - i, byCategory: { travel: -50000 } })
  }
}

const spouseKeys = () => rngKeys.filter((k) => k.includes(':life:spouse-view:'))

// =================================================================================================
// A. THE GATE – all four clauses, and each one alone refuses
// =================================================================================================
describe('wave 7 T5 A – `spouseViewEligible`, the four clauses', () => {
  it('⭐ no latch refuses, and an ENDED latch refuses – the surface belongs to the living marriage', () => {
    const world = married('w7s-latch')
    expect(spouseViewEligible(world), 'the married fixture clears').toBe(true)
    world.loveEpisodes[0].latchedWeek = null
    expect(latchedEpisode(world), 'an unlatched episode is not a marriage').toBeNull()
    expect(spouseViewEligible(world), 'no latch, no spouse').toBe(false)
    world.loveEpisodes[0].latchedWeek = world.week - 4
    world.loveEpisodes[0].endedWeek = world.week - 1
    expect(spouseViewEligible(world), 'an ended latch is an ended surface').toBe(false)
  })

  it('a pending BLOCKING beat refuses – the week she was asked the big question is not his', () => {
    const world = married('w7s-pending')
    raiseLifeBeat(world, 'engaged', world.loveEpisodes[0].id)
    expect(pendingLifeBeat(world), 'the fixture really blocks').not.toBeNull()
    expect(spouseViewEligible(world)).toBe(false)
  })

  it('a LIVE soft row refuses – one at a time, tier 1\'s own law', () => {
    const world = married('w7s-soft')
    raiseLifeBeat(world, 'small-talk', 'worry')
    expect(pendingLifeBeat(world), 'nothing blocks').toBeNull()
    expect(liveSoftBeat(world), 'but a soft row is live').not.toBeNull()
    expect(spouseViewEligible(world)).toBe(false)
  })
})

// =================================================================================================
// B. ZERO DRAWS – the count-keys net, with its positive control
// =================================================================================================
describe('wave 7 T5 B – the gate and the occasion filter both return before any stream exists', () => {
  it('⚠⚠ an ineligible week derives NO spouse-view key – every refusal, counted', () => {
    for (const [name, world] of [
      ['no latch', (() => { const w = married('w7s-b1'); w.loveEpisodes[0].latchedWeek = null; enter(w, 2, 'w35'); return w })()],
      ['ended latch', (() => { const w = married('w7s-b2'); w.loveEpisodes[0].endedWeek = w.week - 1; enter(w, 2, 'w35'); return w })()],
      ['blocking pending', (() => { const w = married('w7s-b3'); enter(w, 2, 'w35'); raiseLifeBeat(w, 'engaged', w.loveEpisodes[0].id); return w })()],
      ['inside the cooldown', (() => { const w = married('w7s-b4'); enter(w, 2, 'w35'); w.lifeLog = [{ week: w.week - 2, kind: 'spouse-view', detail: 'distant-swing', answer: 'hear' }]; return w })()],
    ] as const) {
      rngKeys.length = 0
      rollSpouseView(world)
      expect(spouseKeys(), `⚠⚠ ${name}: an ineligible week took a draw`).toEqual([])
    }
  })

  it('⚠⚠ an ELIGIBLE week with no true occasion derives nothing either – a spouse with nothing to say says nothing', () => {
    const world = married('w7s-b5')
    expect(spouseViewEligible(world), 'the gate itself clears').toBe(true)
    expect(spouseViewOccasionsAt(world), 'and no occasion is true').toEqual([])
    rngKeys.length = 0
    rollSpouseView(world)
    expect(spouseKeys(), 'no occasion, no key').toEqual([])
    expect(lifeLogOf(world), 'and no row').toEqual([])
  })

  it('⭐ the positive control: a raising week derives exactly its own key, and nothing else', () => {
    const world = married('w7s-b6')
    enter(world, 2, 'w35')
    rngKeys.length = 0
    rollSpouseView(world)
    expect(spouseKeys(), 'one pick, one week, its own key').toEqual([`${world.seed}:life:spouse-view:${world.week}`])
    expect(rngKeys.filter((k) => k.includes(':life:') && !k.includes(':life:spouse-view:')), 'no sibling stream is touched').toEqual([])
    expect(lifeLogOf(world).filter((r) => r.kind === 'spouse-view'), 'and the row is on the record').toHaveLength(1)
  })
})

// =================================================================================================
// C. THE RAISE AND THE SOFT CONTRACT – the row, the card, the prompt
// =================================================================================================
describe('wave 7 T5 C – a `spouse-view` row is SOFT and speaks through the standing surface', () => {
  it('⭐ a raise writes one row: her week, the kind, the OCCASION as detail, unanswered', () => {
    const world = married('w7s-raise')
    enter(world, 2, 'w35')
    rollSpouseView(world)
    const rows = lifeLogOf(world).filter((r) => r.kind === 'spouse-view')
    expect(rows, 'exactly one row').toHaveLength(1)
    expect(rows[0]).toEqual({ week: world.week, kind: 'spouse-view', detail: 'distant-swing', answer: null })
  })

  it('⚠⚠ it does NOT block – declared per kind, and the week rolls on', () => {
    expect(LIFE_BEAT_BLOCKING['spouse-view'], 'declared soft, per kind and by type').toBe(false)
    const world = married('w7s-soft2')
    enter(world, 2, 'w35')
    rollSpouseView(world)
    expect(pendingLifeBeat(world), 'nothing stops the week').toBeNull()
    expect(buildLifeBeatPrompt(world), 'no blocking prompt exists').toBeNull()
    expect(liveSoftBeat(world)?.kind, 'the soft selector holds it').toBe('spouse-view')
  })

  it('⭐ the Home card wears this kind\'s own line, and the prompt is the engine\'s assembly', () => {
    const world = married('w7s-card')
    enter(world, 2, 'w35')
    rollSpouseView(world)
    const invite = buildSoftBeatInvite(world)
    expect(invite, 'the invite exists while the row is live').not.toBeNull()
    // ⚠ DRAFT PINS – they assert what the strings ARE and move with the owner's pass (T7).
    expect(invite!.card).toBe('The one she married wants a word.')
    expect(invite!.prompt.heading).toBe('The one she married has something to say about this season')
    expect(invite!.prompt.said).toContain('The next tournament is half a world away.')
    expect(invite!.prompt.options.map((o) => o.id)).toEqual(['hear', 'level', 'brush'])
    // ⚠ the wire carries ids and labels and never a bond – the fence, unchanged for this kind.
    for (const option of invite!.prompt.options) expect(Object.keys(option).sort()).toEqual(['id', 'label'])
  })

  it('⚠ the small-talk card is BYTE-UNTOUCHED by the per-kind map (invariant 4)', () => {
    const world = careerAt('w7s-card2', 400)
    raiseLifeBeat(world, 'small-talk', 'worry')
    expect(buildSoftBeatInvite(world)!.card).toBe('She came by with something small.')
  })

  it('⭐ the diary\'s reader: the raise week answers the occasion, every other week null', () => {
    const world = married('w7s-diary')
    enter(world, 2, 'w35')
    rollSpouseView(world)
    expect(spouseViewOccasionThisWeek(world)).toBe('distant-swing')
    world.week += 1
    expect(spouseViewOccasionThisWeek(world), 'the scene happened once – the note must not stutter').toBeNull()
  })
})

// =================================================================================================
// D. THE ANSWER – through the one seam, priced against the DRAFTED LITERALS
// =================================================================================================
describe('wave 7 T5 D – the parent answers, `bond` moves small', () => {
  /** A married career with a live spouse-view row and mid-rail bond, ready to answer. */
  function withRow(seed: string): WorldState {
    const world = married(seed)
    enter(world, 2, 'w35')
    rollSpouseView(world)
    world.bond = 50
    return world
  }

  // ⚠ THE NUMBERS ARE THE BRIEF'S CORRIDOR (±0.5..±1.5) CARRIED AS THE BUILDER'S DRAFTED LITERALS,
  // transcribed – never read off `ECONOMY.wedding` (ARM 2's law): a silent re-price must go red here.
  for (const [id, delta] of [
    ['hear', 1],
    ['level', -0.5],
    ['brush', -1.5],
  ] as const) {
    it(`«${id}» prices ${delta} – and writes NO feed row (the null is the statement)`, () => {
      const world = withRow(`w7s-d-${id}`)
      const events = world.events.length
      answerLifeBeat(world, id)
      expect(world.bond).toBeCloseTo(50 + delta, 10)
      expect(lifeLogOf(world).find((r) => r.kind === 'spouse-view')?.answer).toBe(id)
      expect(world.events.length, 'ANSWER_EVENT is null for this kind – the log is the record').toBe(events)
    })
  }

  it('⚠ an unoffered id is refused by the engine (rule 3), and the row stays open', () => {
    const world = withRow('w7s-d-bad')
    expect(() => answerLifeBeat(world, 'bless')).toThrow('not one of the answers')
    expect(lifeLogOf(world).find((r) => r.kind === 'spouse-view')?.answer).toBeNull()
  })

  it('⚠ the drain registry prices it read-independently at the mildest answer', () => {
    expect(drainCostOf('spouse-view')).toBe(-0.5)
  })
})

// =================================================================================================
// E. THE FOUR OCCASIONS – each gate against a posed world, both arms
// =================================================================================================
describe('wave 7 T5 E – every occasion is a read of an existing seam', () => {
  it('⭐ `distant-swing`: the NEXT entered event, and its track – wta and itf are away, domestic is not', () => {
    const world = married('w7s-e1')
    expect(spouseViewOccasionsAt(world)).toEqual([])
    enter(world, 3, 'w35')
    expect(spouseViewOccasionsAt(world), 'a W event is a border crossed – the wta track her age actually plays').toEqual(['distant-swing'])
    world.season = []
    world.entries = []
    enter(world, 3, 'j60')
    expect(spouseViewOccasionsAt(world), 'the itf ladder reads away too').toEqual(['distant-swing'])
    world.season = []
    world.entries = []
    enter(world, 3, 'national')
    expect(spouseViewOccasionsAt(world), 'a domestic event is not a distant swing').toEqual([])
    // ⚠ and it is the NEXT event that answers: a domestic one first, the abroad one behind it.
    enter(world, 5, 'w35')
    expect(spouseViewOccasionsAt(world), 'the nearest entered event is domestic, so the swing is not «next»').toEqual([])
  })

  it('⭐ `road-stretch`: travel-billed weeks in the friends-tile window, at the tile\'s own band', () => {
    const world = married('w7s-e2')
    roadWeeks(world, 3)
    expect(spouseViewOccasionsAt(world), 'three weeks is the in-between band, not a stretch').toEqual([])
    roadWeeks(world, 4)
    expect(spouseViewOccasionsAt(world), 'four of the trailing twelve is «mostly by phone» – the stretch').toEqual(['road-stretch'])
  })

  it('⭐ `no-vacation`: spirit.ts\'s own season-boundary predicate, true on the wrap week alone', () => {
    const world = married('w7s-e3')
    // park the career on the next season-wrap week (the first off-season week), latch kept alive
    world.week = Math.ceil((world.week + 1) / 52) * 52 + 49
    expect(spouseViewOccasionsAt(world), 'a season with no family week wraps – the spouse noticed').toEqual(['no-vacation'])
    world.week += 1
    expect(spouseViewOccasionsAt(world), 'one week later the boundary is past').toEqual([])
  })

  it('⭐ `money`: a large spend AFTER the latch, while her account holds more than the wallet', () => {
    const world = married('w7s-e4', 6)
    world.kidFundsCents = 5_000_000
    world.fundsCents = 2_000_000
    world.financeWeeks = [{ week: world.week - 2, byCategory: { gear: -WEDDING.spouseViewSpendCents } }]
    expect(spouseViewOccasionsAt(world)).toEqual(['money'])
    // ⚠ her account NOT holding the season – the same spend says nothing
    world.kidFundsCents = 1_000_000
    expect(spouseViewOccasionsAt(world), 'the claim is the split, not the bill alone').toEqual([])
    world.kidFundsCents = 5_000_000
    // ⚠ a spend under the line is not «large»
    world.financeWeeks = [{ week: world.week - 2, byCategory: { gear: -(WEDDING.spouseViewSpendCents - 100) } }]
    expect(spouseViewOccasionsAt(world)).toEqual([])
    // ⚠⚠ a spend ON `latchedWeek` can never be the complaint: the window opens strictly after it
    // (ARM 6's red). ⚠ RE-AIMED 18.09 – the fixture billed the wedding's own drafted charge here until
    // the cost was RULED OUT («я думаю как с подарками, никто и нисколько» – no money mechanics;
    // spec §3c keeps its record). The boundary is the GATE's and outlives the bill, so the fixture
    // now plants a plain at-the-line spend on the latch week – large by the same test as above.
    world.financeWeeks = [{ week: world.loveEpisodes[0].latchedWeek!, byCategory: { other: -WEDDING.spouseViewSpendCents } }]
    expect(spouseViewOccasionsAt(world), 'a latch-week spend sits outside the marriage\'s window').toEqual([])
  })

  it('⭐ several true occasions: the pick is uniform on the one purpose key, and the roster order is the draw order', () => {
    const world = married('w7s-e5')
    enter(world, 3, 'w35')
    roadWeeks(world, 4)
    expect(spouseViewOccasionsAt(world)).toEqual(['distant-swing', 'road-stretch'])
    rollSpouseView(world)
    const row = lifeLogOf(world).find((r) => r.kind === 'spouse-view')!
    expect(SPOUSE_VIEW_OCCASIONS).toContain(row.detail)
  })
})

// =================================================================================================
// F. THE COOLDOWN – the log is the counter
// =================================================================================================
describe('wave 7 T5 F – at most once per `spouseViewCooldownWeeks`', () => {
  it('⚠ a raised row silences the surface for the window, answered or not, and the boundary week reopens it', () => {
    const world = married('w7s-f1')
    enter(world, 2, 'w35')
    rollSpouseView(world)
    expect(lifeLogOf(world).filter((r) => r.kind === 'spouse-view')).toHaveLength(1)
    // still unanswered – the raised row spent the marriage's turn to speak
    world.week += WEDDING.spouseViewCooldownWeeks - 1
    expect(spouseViewEligible(world), 'one week short of the window refuses').toBe(false)
    world.week += 1
    expect(spouseViewEligible(world), 'the boundary week itself clears').toBe(true)
  })
})
