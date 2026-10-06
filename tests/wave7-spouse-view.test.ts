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
//
// ROUND 46 R3 – THE LINE WITHIN THE OCCASION (§I; §G strengthened). Same protocol, 06.10; each arm restored and
// `cmp`-checked against a copy taken before it:
//   ARM 7  the second draw dropped (`rollSpouseView` raises line 0 every time)                 → 4 RED: I1, I2, I3, I4
//   ARM 8  the line memory deleted (`fresh = all`: the draw may land on the line he said last)  → 2 RED: I3, I4
//   ARM 9  the second draw on a FRESH stream (the purpose key derived a second time)            → 4 RED: B's positive
//          control, H3 and H4 (all three count keys) and I1 (the replayed second tap)
//   ARM 10 entry 0 of every pool swapped back for its pre-R3 opening («The one she married…»)  → 2 RED: §G's
//          no-introduction property and the assembled-card arm. ⚠ §G's three-word property stays GREEN on that
//          pool – the old openings never began «her spouse has» – which is the owner's complaint in one line: the
//          first property was blind to the tautology he meant, and is no longer the only one.

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
import type { LifeBeatRecord, LoveEpisode, SpouseViewOccasion } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'
import { weekAtAge } from './helpers/career'
import { pickInt, rngFromSeed } from '../src/engine/rng'
import { SPOUSE_VIEW_HEADING, SPOUSE_VIEW_SAID } from '../src/engine/world/lifeBeat/spouseViewCopy'

const WEDDING = ECONOMY.wedding

beforeEach(() => {
  rngKeys.length = 0
})

// -------------------------------------------------------------------------------------------------
// FIXTURES – tests/wave7-wedding.test.ts's own, carried into the married half of the same wave
// -------------------------------------------------------------------------------------------------

/** The FIRST week she reads at or above `years` – walked on the engine's own clock, never our
 *  arithmetic (`tests/wave4-ends.test.ts`'s helper). */
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
    // ⭐ ROUND 46 R3 – `detail` is still the occasion; the line is a key of its own, ALWAYS stamped by a raise (even line 0).
    expect(Object.keys(rows[0]).sort(), 'the v83 row plus the one new optional key, and nothing else').toEqual(['answer', 'detail', 'kind', 'line', 'week'])
    expect(rows[0]).toMatchObject({ week: world.week, kind: 'spouse-view', detail: 'distant-swing', answer: null })
    expect(Number.isInteger(rows[0].line), 'the raise stamped its line').toBe(true)
    expect(rows[0].line!, 'inside the occasion\'s pool').toBeGreaterThanOrEqual(0)
    expect(rows[0].line!, 'inside the occasion\'s pool').toBeLessThan(SPOUSE_VIEW_SAID['distant-swing'].length)
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
    expect(invite!.prompt.heading).toBe('Her spouse has something to say about this season')
    // ⭐ ROUND 46 R3 – the pool holds several lines per occasion, so the card says exactly the line its row was stamped with.
    const stamped = lifeLogOf(world).find((r) => r.kind === 'spouse-view')!.line!
    expect(invite!.prompt.said).toBe(SPOUSE_VIEW_SAID['distant-swing'][stamped])
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

// =================================================================================================
// G. ROUND 46 #12 + R3 – THE CARD INTRODUCES ITS SPEAKER ONCE, IN THE HEADING
// =================================================================================================
// The owner, 05.10: «The one she married» twice in two lines – the dialog's heading and the first line of the
// card. #12 reworded the heading. His 06.10 answer: the heading «already says he wants to say something, and
// the first phrase repeats it – слова ради слов». So the property is no longer about three words: the HEADING
// introduces the speaker, and no line of the pool may do it again – a line is a scene and then the quoted
// speech. It is the PAIR's property and not one string's, so it survives whichever side is reworded next.
// DRAFT R46-S7, and R46-S26 on for the pool.
describe('round 46 #12 / R3 – the spouse card introduces its speaker once, in the heading', () => {
  const opening = (text: string): string => text.trim().split(/\s+/).slice(0, 3).join(' ').toLowerCase()
  /** The narration around the quotation – everything before the first quotation mark. The speech is the counsel
   *  pool's own licence (first person inside it); the frame is the part that can introduce somebody. */
  const frameOf = (text: string): string => text.split('"')[0]
  /** What introducing the speaker looks like: a noun for him, a pronoun for him, or «the one she married». */
  const SPEAKER = /\b(spouse|husband|wife|partner|married|he|she)\b|the one she/i
  const everyLine = () =>
    SPOUSE_VIEW_OCCASIONS.flatMap((occasion) => SPOUSE_VIEW_SAID[occasion].map((text, index) => ({ occasion, index, text })))

  // ⚠ THE CONTROL – the pool as it stood before R3, transcribed (never read out of the thing under test): every
  // one of those lines opened by naming him, and the property below must be able to say so.
  const BEFORE_R3_OPENINGS = [
    'The one she married stayed back after the plates were cleared.',
    'The one she married said it plainly, on a quiet evening.',
    'The one she married brought it up as the season closed.',
    'The one she married asked it without an edge.',
  ]
  // ...and what each of them QUOTED, word for word: entry 0 of each pool keeps all of it, because a row with no
  // `line` reads as entry 0 and must be told what it was told.
  const BEFORE_R3_QUOTES: Record<SpouseViewOccasion, string> = {
    'distant-swing': '"The next tournament is half a world away. I knew the life I married into. Some weeks I would just like it nearer."',
    'road-stretch': '"The family has been on the road for weeks now. The house does not really get lived in between the trips."',
    'no-vacation': '"A whole season, and not one week of it belonged to the family. Next year I would like one on the calendar before the tennis takes them all."',
    money: '"That was a large bill, and the season sits in her account now. I am not counting anybody\'s money. I am asking how this house plans."',
  }

  it('⭐ the pool is not vacuous: every occasion holds several lines, and entry 0 keeps the old line\'s whole quotation', () => {
    expect(SPOUSE_VIEW_OCCASIONS.length, 'the loop is not vacuous').toBeGreaterThan(0)
    for (const occasion of SPOUSE_VIEW_OCCASIONS) {
      expect(SPOUSE_VIEW_SAID[occasion].length, `${occasion} holds a pool`).toBeGreaterThanOrEqual(3)
      expect(SPOUSE_VIEW_SAID[occasion][0].endsWith(BEFORE_R3_QUOTES[occasion]), `${occasion}: entry 0 ends on every quoted word it always had`).toBe(true)
    }
  })

  it('⭐ the heading and EVERY line of EVERY occasion open on different three words', () => {
    for (const { occasion, index, text } of everyLine()) {
      expect(opening(SPOUSE_VIEW_HEADING), `the heading against ${occasion}[${index}]`).not.toBe(opening(text))
    }
  })

  it('⭐⭐ R3 no line introduces its speaker: the narration around the quotation names no spouse, no pronoun, no «the one she married»', () => {
    for (const old of BEFORE_R3_OPENINGS) {
      expect(frameOf(old), `control: the old opening «${old}» is caught – the property can fail`).toMatch(SPEAKER)
    }
    for (const { occasion, index, text } of everyLine()) {
      expect(frameOf(text), `${occasion}[${index}]: the heading already introduced him`).not.toMatch(SPEAKER)
    }
  })

  it('⭐ within one occasion no two lines open the same way, and none is told twice', () => {
    for (const occasion of SPOUSE_VIEW_OCCASIONS) {
      const pool = SPOUSE_VIEW_SAID[occasion]
      expect(new Set(pool.map(opening)).size, `${occasion}: openings`).toBe(pool.length)
      expect(new Set(pool).size, `${occasion}: lines`).toBe(pool.length)
    }
  })

  it('⚠ the house law on the pool: the short dash only, no figure and no price', () => {
    for (const { occasion, index, text } of [...everyLine(), { occasion: 'heading', index: 0, text: SPOUSE_VIEW_HEADING }]) {
      expect(text, `${occasion}[${index}] carries no long dash`).not.toContain('—')
      expect(text, `${occasion}[${index}] carries no figure or price`).not.toMatch(/[\d$€£]/)
    }
  })

  it('⭐ and on the card the engine assembles – heading above, line below – for every line of every occasion', () => {
    for (const { occasion, index, text } of everyLine()) {
      const world = married(`w7s-g-${occasion}-${index}`)
      raiseLifeBeat(world, 'spouse-view', occasion, undefined, undefined, index)
      const prompt = buildSoftBeatInvite(world)!.prompt
      expect(prompt.said, `the card tells the line its row was stamped with: ${occasion}[${index}]`).toBe(text)
      expect(opening(prompt.heading), `the assembled card for ${occasion}[${index}]`).not.toBe(opening(prompt.said ?? ''))
      expect(frameOf(prompt.said ?? ''), `the assembled card for ${occasion}[${index}] introduces nobody`).not.toMatch(SPEAKER)
    }
  })
})

// =================================================================================================
// H. ROUND 46 #15 – HE DOES NOT RAISE THE SAME WORRY TWICE INSIDE A SEASON
// =================================================================================================
// The owner, 05.10: the same line, verbatim, twice a month or two apart – «и вообще он очень
// разговорчивый и часто повторяется». THE MEMORY IS THE LOG (every raised row carries its occasion as
// `detail`, and the log is never pruned), so no arm here touches a schema: H5 round-trips a world
// through JSON to prove it.
//
// ⚠ THE CONTROL ARM IS THE ROLL AS IT STOOD BEFORE ROUND 46, replicated below line for line. It is what
// the new roll must EQUAL wherever the memory binds nothing (H2), and what must REPEAT where it does
// (H1's control) – a property whose control cannot fail is not a property.
const NO_REPEAT = WEDDING.spouseViewNoRepeatWeeks

function rollBeforeRound46(world: WorldState): void {
  if (!spouseViewEligible(world)) return
  const occasions = spouseViewOccasionsAt(world)
  if (occasions.length === 0) return
  const at = pickInt(rngFromSeed(`${world.seed}:life:spouse-view:${world.week}`), 0, occasions.length - 1)
  raiseLifeBeat(world, 'spouse-view', occasions[at])
}

/** `distant-swing`, `road-stretch` and `money` all true at once, this week – a marriage with three things
 *  to say, which is what saturated the cooldown in the wedding bench (5.13 of a possible 5.2 a season). */
function holdThreeTrue(world: WorldState): void {
  enter(world, 2, 'w35')
  roadWeeks(world, 4)
  world.kidFundsCents = 5_000_000
  world.fundsCents = 2_000_000
  world.financeWeeks.push({ week: world.week - 1, byCategory: { gear: -WEDDING.spouseViewSpendCents } })
}

/** One week of a posed marriage: pose the three occasions, roll, and let the parent answer whatever was
 *  raised so a live soft row never holds the surface shut. */
function marriageWeek(world: WorldState, week: number, roll: (w: WorldState) => void): void {
  world.week = week
  holdThreeTrue(world)
  roll(world)
  if (liveSoftBeat(world) !== null) answerLifeBeat(world, 'hear')
}

type Said = { week: number; detail: string; line: number | undefined }
const saidOf = (world: WorldState, since: number): Said[] =>
  lifeLogOf(world)
    .filter((r) => r.kind === 'spouse-view')
    .map((r) => ({ week: r.week - since, detail: r.detail, line: r.line }))
const spouseRows = (world: WorldState) => lifeLogOf(world).filter((r) => r.kind === 'spouse-view')

/** Pairs of rows that say the same occasion closer together than `window` weeks. */
function repeatsInside(rows: Said[], window: number): number {
  let n = 0
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      if (rows[i].detail === rows[j].detail && rows[j].week - rows[i].week < window) n++
    }
  }
  return n
}

describe('round 46 #15 – he does not raise the same worry twice inside a season', () => {
  const HORIZON = 2 * 52 + 6

  it('⭐ H1 a marriage with three things to say says each once a season: no line repeats inside the window, and the first season still holds three', () => {
    const world = married('w7s-h1', 6)
    const start = world.week
    for (let i = 0; i < HORIZON; i++) marriageWeek(world, start + i, rollSpouseView)
    const rows = saidOf(world, start)
    expect(rows.filter((r) => r.week < 52).length, 'three or more in the first season – the property is not vacuous').toBeGreaterThanOrEqual(3)
    expect(repeatsInside(rows, NO_REPEAT), `no line twice inside ${NO_REPEAT} weeks: ${JSON.stringify(rows)}`).toBe(0)
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].week - rows[i - 1].week, 'the cooldown still spaces every pair').toBeGreaterThanOrEqual(WEDDING.spouseViewCooldownWeeks)
    }
  })

  it('⚠ H1 CONTROL: the same marriage under the roll as it stood before round 46 repeats a line inside the window', () => {
    const world = married('w7s-h1', 6)
    const start = world.week
    for (let i = 0; i < HORIZON; i++) marriageWeek(world, start + i, rollBeforeRound46)
    const rows = saidOf(world, start)
    expect(rows.filter((r) => r.week < 52).length, 'the old roll fills the cooldown: six in the first season').toBeGreaterThanOrEqual(5)
    expect(repeatsInside(rows, NO_REPEAT), 'the old roll repeats – so the property above can fail').toBeGreaterThan(0)
  })

  it('⭐ H2 where the memory binds nothing the OCCASION is the one the roll before it picked, and the world differs from that roll\'s by the stamped `line` and nothing else – no history, and history exactly one window old', () => {
    for (let k = 0; k < 24; k++) {
      for (const age of [null, NO_REPEAT]) {
        const world = married(`w7s-h2-${k}`)
        enter(world, 2, 'w35')
        roadWeeks(world, 4)
        if (age !== null) world.lifeLog = [{ week: world.week - age, kind: 'spouse-view', detail: 'distant-swing', answer: 'hear' }]
        const twin = structuredClone(world)
        rollSpouseView(world)
        rollBeforeRound46(twin)
        // ⭐ ROUND 46 R3 – THE CLAIM IS NARROWER THAN IT WAS, AND HONESTLY SO. The roll now takes a second tap and
        // stamps the line it chose, so a world that FIRES is no longer byte-identical to the old roll's: it is that
        // world plus one key. Strip the key and nothing else may differ – not the occasion (the first tap is
        // untouched), not the log, not the MAIN position. The byte-identity that survives whole is H2b's.
        const told = world.lifeLog[world.lifeLog.length - 1]
        expect(Number.isInteger(told.line), `${world.seed}: the new row carries its line`).toBe(true)
        delete told.line
        expect(world, `${world.seed}, history ${age}`).toEqual(twin)
        expect(spouseRows(world).length, 'it fired – the arm is not vacuous').toBe(age === null ? 1 : 2)
      }
    }
  })

  it('⭐ H2b where NOTHING fires the world is byte-identical to itself and derives no stream – ineligible, nothing true, and every true occasion stale', () => {
    const worlds: [string, WorldState][] = [
      ['no latch', (() => { const w = married('w7s-h2b-1'); w.loveEpisodes[0].latchedWeek = null; enter(w, 2, 'w35'); return w })()],
      ['inside the cooldown', (() => { const w = married('w7s-h2b-2'); enter(w, 2, 'w35'); w.lifeLog = [{ week: w.week - 2, kind: 'spouse-view', detail: 'distant-swing', answer: 'hear' }]; return w })()],
      ['nothing true', married('w7s-h2b-3')],
      ['everything true is stale', (() => { const w = married('w7s-h2b-4'); enter(w, 2, 'w35'); w.lifeLog = [{ week: w.week - 20, kind: 'spouse-view', detail: 'distant-swing', answer: 'hear' }]; return w })()],
    ]
    for (const [name, world] of worlds) {
      const before = structuredClone(world)
      rngKeys.length = 0
      rollSpouseView(world)
      expect(world, `${name}: the roll changed nothing`).toEqual(before)
      expect(spouseKeys(), `${name}: and derived no stream`).toEqual([])
    }
  })

  it('⚠ H3 a worry said 51 weeks ago is still stale, the 52nd week reopens it, and a week of nothing but stale worries derives no stream', () => {
    const world = married('w7s-h3')
    enter(world, 2, 'w35')
    world.lifeLog = [{ week: world.week - (NO_REPEAT - 1), kind: 'spouse-view', detail: 'distant-swing', answer: 'hear' }]
    expect(spouseViewEligible(world), 'the gate is open – the cooldown ended long ago').toBe(true)
    expect(spouseViewOccasionsAt(world), 'and the occasion is TRUE').toEqual(['distant-swing'])
    rollSpouseView(world)
    expect(spouseRows(world), 'nothing new: he said it lately').toHaveLength(1)
    expect(spouseKeys(), 'a stale-only week derives no stream').toEqual([])
    world.week += 1
    rollSpouseView(world)
    expect(spouseRows(world).map((r) => r.detail), 'one window on it is news again').toEqual(['distant-swing', 'distant-swing'])
    expect(spouseKeys(), 'and the reopened week derives exactly its own key').toEqual([`${world.seed}:life:spouse-view:${world.week}`])
  })

  it('⭐ H4 the pick is still ONE KEY – the occasion over the fresh occasions alone, then the line: two taps on that one stream', () => {
    for (let k = 0; k < 24; k++) {
      rngKeys.length = 0
      const world = married(`w7s-h4-${k}`)
      enter(world, 2, 'w35')
      roadWeeks(world, 4)
      world.lifeLog = [{ week: world.week - 20, kind: 'spouse-view', detail: 'distant-swing', answer: 'hear' }]
      expect(spouseViewOccasionsAt(world)).toEqual(['distant-swing', 'road-stretch'])
      rollSpouseView(world)
      expect(spouseRows(world).map((r) => r.detail), `${world.seed}: the one fresh occasion`).toEqual(['distant-swing', 'road-stretch'])
      expect(spouseKeys(), 'one key derived – the second tap continues the same stream, it is not a second derivation').toEqual([`${world.seed}:life:spouse-view:${world.week}`])
    }
  })

  it('⭐ H5 the memory is the log: a marriage round-tripped through JSON half way remembers exactly what an unbroken one does – the occasions AND the lines', () => {
    const world = married('w7s-h5', 6)
    const start = world.week
    for (let i = 0; i < 40; i++) marriageWeek(world, start + i, rollSpouseView)
    const reloaded: WorldState = JSON.parse(JSON.stringify(world))
    for (let i = 40; i < HORIZON; i++) {
      marriageWeek(world, start + i, rollSpouseView)
      marriageWeek(reloaded, start + i, rollSpouseView)
    }
    const rows = saidOf(world, start)
    expect(rows.filter((r) => r.week >= 40).length, 'it speaks after the reload – the arm is not vacuous').toBeGreaterThan(0)
    expect(saidOf(reloaded, start)).toEqual(rows)
  })
})

// =================================================================================================
// I. ROUND 46 R3 – THE LINE WITHIN THE OCCASION
// =================================================================================================
// The owner, 06.10: the card's first line must stop re-introducing the speaker, and the occasions get several
// lines to say (the architect's batch, DRAFT R46-S26 on). The pick is now TWO taps on the one purpose stream:
// the occasion exactly as #15 left it, then the line inside it – never the line he said LAST for that occasion,
// read off the log (`LifeBeatRecord.line`, an optional key; absent reads as entry 0).
//
// ⚠ THE OCCASION LAYER MUST NOT MOVE – H2 pins that, world by world, against the roll as it stood a round ago.
// THE LINE LAYER IS PINNED HERE, each arm against a posed world and each with the mutation that reddens it (the
// ledger at the top of the file): I1 the draw structure, I2 reach, I3 the memory, I4 the memory over a long
// marriage, I5 the absent key, I6 the stamp.

/** A marriage in which EXACTLY ONE occasion is true – the fixtures §E poses, one per occasion. */
function poseOnly(seed: string, occasion: SpouseViewOccasion): WorldState {
  const world = married(seed, 6)
  if (occasion === 'distant-swing') enter(world, 3, 'w35')
  if (occasion === 'road-stretch') roadWeeks(world, 4)
  if (occasion === 'no-vacation') world.week = Math.ceil((world.week + 1) / 52) * 52 + 49
  if (occasion === 'money') {
    world.kidFundsCents = 5_000_000
    world.fundsCents = 2_000_000
    world.financeWeeks = [{ week: world.week - 2, byCategory: { gear: -WEDDING.spouseViewSpendCents } }]
  }
  expect(spouseViewOccasionsAt(world), `the fixture poses ${occasion} and nothing else`).toEqual([occasion])
  return world
}

describe('round 46 R3 – the occasion picks first, then the line inside it', () => {
  const lines = (occasion: SpouseViewOccasion): number[] => SPOUSE_VIEW_SAID[occasion].map((_, i) => i)

  it('⭐ I1 one key, two taps: the same seed tells the same line, and the line is the SECOND draw of the occasion\'s own stream – replayed by hand', () => {
    for (let k = 0; k < 40; k++) {
      rngKeys.length = 0
      const world = married(`w7s-i1-${k}`)
      enter(world, 2, 'w35')
      const twin = structuredClone(world)
      rollSpouseView(world)
      rollSpouseView(twin)
      expect(spouseKeys(), 'two worlds, two rolls, one key each – never a second derivation inside a roll').toEqual(
        Array(2).fill(`${world.seed}:life:spouse-view:${world.week}`),
      )
      const row = spouseRows(world)[0]
      expect(row.line, `${world.seed}: a second world on the same seed tells the same line`).toBe(spouseRows(twin)[0].line)
      const replay = rngFromSeed(`${world.seed}:life:spouse-view:${world.week}`)
      pickInt(replay, 0, 0) // tap one – the occasion; only `distant-swing` is true, so its range is a single cell
      expect(row.line, `${world.seed}: the line is tap TWO of the one stream`).toBe(pickInt(replay, 0, SPOUSE_VIEW_SAID['distant-swing'].length - 1))
    }
  })

  it('⭐ I2 every line of every occasion is reachable – the second draw spans the whole pool, not its head', () => {
    for (const occasion of SPOUSE_VIEW_OCCASIONS) {
      const world = poseOnly(`w7s-i2-${occasion}`, occasion)
      const seen = new Set<number>()
      for (let k = 0; k < 60; k++) {
        world.seed = `w7s-i2-${occasion}-${k}`
        world.lifeLog = []
        rollSpouseView(world)
        seen.add(spouseRows(world)[0].line!)
      }
      expect([...seen].sort(), `${occasion}: every entry of its pool was told at least once`).toEqual(lines(occasion))
    }
  })

  it('⭐ I3 the line he said last is never the next one – and every OTHER line stays reachable, for each last line of each occasion', () => {
    for (const occasion of SPOUSE_VIEW_OCCASIONS) {
      const world = poseOnly(`w7s-i3-${occasion}`, occasion)
      for (const last of [...lines(occasion), 'legacy'] as const) {
        const seen = new Set<number>()
        for (let k = 0; k < 48; k++) {
          world.seed = `w7s-i3-${occasion}-${last}-${k}`
          // he told this occasion a year and a bit ago – outside the 52-week window, so the OCCASION is news again –
          // on `last`; 'legacy' is a row raised before the pools grew: no `line` key at all, which stood on entry 0
          const old: LifeBeatRecord = { week: world.week - NO_REPEAT - 8, kind: 'spouse-view', detail: occasion, answer: 'hear' }
          if (last !== 'legacy') old.line = last
          world.lifeLog = [old]
          rollSpouseView(world)
          const row = spouseRows(world)[1]
          expect(row?.detail, `${occasion}: the occasion is news again`).toBe(occasion)
          seen.add(row.line!)
        }
        const stood = last === 'legacy' ? 0 : last
        expect(seen.has(stood), `${occasion}: line ${stood} was told last (${last}) and is not told again`).toBe(false)
        expect([...seen].sort(), `${occasion}, last ${last}: every other line is reachable`).toEqual(lines(occasion).filter((i) => i !== stood))
      }
    }
  })

  it('⭐ I4 over a long marriage no occasion is told on the same line twice running, and each uses more than one line', () => {
    const world = married('w7s-i4', 6)
    const start = world.week
    for (let i = 0; i < 6 * 52 + 6; i++) marriageWeek(world, start + i, rollSpouseView)
    for (const occasion of ['distant-swing', 'road-stretch', 'money'] as const) {
      const heard = spouseRows(world).filter((r) => r.detail === occasion)
      const seq = heard.map((r) => r.line).join(',')
      expect(heard.length, `${occasion}: told in most seasons, so the arm is not vacuous (${seq})`).toBeGreaterThanOrEqual(4)
      for (let i = 1; i < heard.length; i++) {
        expect(heard[i].line, `${occasion}: telling ${i} repeats telling ${i - 1} (${seq})`).not.toBe(heard[i - 1].line)
      }
      expect(new Set(heard.map((r) => r.line)).size, `${occasion}: more than one line is used (${seq})`).toBeGreaterThan(1)
    }
  })

  it('⭐ I5 a row raised before the pools grew carries no `line` and reads as entry 0 – and a stamp the pool does not hold reads as entry 0 too, never a throw', () => {
    for (const occasion of SPOUSE_VIEW_OCCASIONS) {
      const legacy = married(`w7s-i5-${occasion}`)
      raiseLifeBeat(legacy, 'spouse-view', occasion) // exactly what a save from before this round holds
      expect(Object.keys(lifeLogOf(legacy)[0]).sort(), 'no `line` key on a legacy row').toEqual(['answer', 'detail', 'kind', 'week'])
      expect(buildSoftBeatInvite(legacy)!.prompt.said, `${occasion}: told entry 0 – what that row was told`).toBe(SPOUSE_VIEW_SAID[occasion][0])
      const stale = married(`w7s-i5b-${occasion}`)
      raiseLifeBeat(stale, 'spouse-view', occasion, undefined, undefined, 99)
      expect(buildSoftBeatInvite(stale)!.prompt.said, `${occasion}: an index the pool does not hold falls back to entry 0`).toBe(SPOUSE_VIEW_SAID[occasion][0])
    }
  })

  it('⭐ I6 the line is on the row: it survives a JSON round trip, and the card is read off the row – not off the seed, the week or a stream', () => {
    const world = married('w7s-i6')
    enter(world, 2, 'w35')
    rollSpouseView(world)
    const said = buildSoftBeatInvite(world)!.prompt.said
    const reloaded: WorldState = JSON.parse(JSON.stringify(world))
    expect(buildSoftBeatInvite(reloaded)!.prompt.said, 'a reload tells the same line').toBe(said)
    world.seed = 'a-different-seed-after-the-fact'
    world.week += 2 // the row is live for three weeks and re-assembled on every snapshot
    expect(buildSoftBeatInvite(world)!.prompt.said, 'the card is never re-drawn').toBe(said)
  })
})
