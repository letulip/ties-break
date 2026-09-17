// ROUND 45 – THE TWO DOORS SHE DECIDES HERSELF: leaving at the peak, leaving after the fall.
// Spec: docs/specs/the-two-more-doors-2026-09.md. Copy: docs/specs/the-two-doors-corpus-2026-09.md.
//
// ⚠ WHAT THIS FILE IS FOR, AND WHAT IT DELIBERATELY IS NOT. It pins the RULES (which season opens
// which door, and for whom), the PARTITION (one door per girl, and temperament may not move how
// likely a leaving is), the STREAM (a purpose-scoped sub-stream, never MAIN), and the LAW THE COPY
// OBEYS. It does NOT pin the RATE: a rate is a measurement and it lives in `tools/two-doors-bench.ts`
// and in the spec's §6, because a test that asserts a balance number is a test that goes red every
// time the owner re-tunes one (CLAUDE.md invariant 5's own division of labour).
//
// ⚠ AND IT DOES NOT PIN THE SENTENCES THEMSELVES. Every line here is a DRAFT until he has read it
// (invariant 4), so what is pinned is the PROPERTY each line must have – four distinct voices, no
// blame, no grade – through the engine's own symbol, never through a spelling. A pin on the wording
// would be a pin that has to move the day he edits a word, which is exactly the diff no test catches.
import { describe, it, expect } from 'vitest'
import {
  DOOR_BY_TEMPERAMENT,
  ENDINGS,
  endingForLeaving,
  fallLeavingDue,
  leavingDoorDue,
  leavingLine,
  peakLeavingDue,
  ENDING_BLURB,
  ENDING_TITLE,
} from '../src/engine/ending'
import { leavingView } from './helpers/leavingView'
import { TEMPERAMENTS, type Temperament } from '../src/engine/spirit'
import {
  createWorld,
  latchEnding,
  leavingViewOf,
  resolveLeaving,
  wonTopTitleInSeason,
  buildEndingView,
  type WorldState,
} from '../src/engine/world'
import { DEFAULT_PROFILE, LADDER_TRACKS } from '../src/shared/protocol'
import type { SeasonHistoryEntry, SeasonTrackRow } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS, TIER_LADDER } from '../src/engine/season/calendar'
import { rngFromSeed } from '../src/engine/rng'

// =================================================================================================
// A. THE PARTITION – §4's table, and the arithmetic that keeps it from being a career script
// =================================================================================================

describe('A. one door per girl, and temperament moves WHICH and never HOW LIKELY', () => {
  it('maps each of the four voices to exactly one door, and covers all four', () => {
    expect(DOOR_BY_TEMPERAMENT).toEqual({ fiery: 'fall', quiet: 'fall', deep: 'peak', sunny: 'peak' })
    // ⚠ THROUGH `TEMPERAMENTS` RATHER THAN A RE-LISTED ARRAY: a fifth temperament added to the
    // engine has to arrive here with a door rather than slipping past a hand-written list of four.
    for (const t of TEMPERAMENTS) expect(DOOR_BY_TEMPERAMENT[t], t).toMatch(/^(peak|fall)$/)
    expect(Object.keys(DOOR_BY_TEMPERAMENT).sort()).toEqual([...TEMPERAMENTS].sort())
  })

  it('⚠ the two doors split the four evenly, so no temperament is likelier to leave than another', () => {
    const peak = TEMPERAMENTS.filter((t) => DOOR_BY_TEMPERAMENT[t] === 'peak')
    const fall = TEMPERAMENTS.filter((t) => DOOR_BY_TEMPERAMENT[t] === 'fall')
    expect(peak.length).toBe(fall.length)
    // ...AND THE CHANCE IS THE SAME NUMBER ON BOTH SIDES, which is the other half of the same
    // argument. Two equal halves at two different rates would be a career script wearing a partition.
    expect(ENDINGS.peakLeavingChance).toBe(ENDINGS.fallLeavingChance)
  })

  it('⚠ a girl can only ever be offered HER door, whatever the season did', () => {
    // The same collapse, read for all four voices: the two `fall` girls see it, the two `peak` girls
    // cannot, and no draw is involved in any of the four answers.
    const collapse = { endRank: 59, prevEndRank: 13, points: 1584, prevPoints: 4008 }
    const top = { endRank: 4, prevEndRank: 6, points: 5000, prevPoints: 4800 }
    for (const t of TEMPERAMENTS) {
      const door = DOOR_BY_TEMPERAMENT[t]
      expect(leavingDoorDue(leavingView({ temperament: t, ...collapse })), `${t} on a collapse`).toBe(
        door === 'fall' ? 'fall' : null,
      )
      expect(leavingDoorDue(leavingView({ temperament: t, ...top })), `${t} at the top`).toBe(
        door === 'peak' ? 'peak' : null,
      )
    }
  })
})

// =================================================================================================
// B. THE PEAK GATE – §2, and the four named cases it was written from
// =================================================================================================

describe('B. #7 – she leaves at the peak', () => {
  const her = (over = {}) => leavingView({ temperament: 'deep', ...over })

  it('opens on a top-ten place on the paid table', () => {
    expect(peakLeavingDue(her({ endRank: ENDINGS.peakRankBand }))).toBe(true)
    expect(peakLeavingDue(her({ endRank: ENDINGS.peakRankBand + 1 }))).toBe(false)
    expect(peakLeavingDue(her({ endRank: 1 }))).toBe(true)
  })

  it("⭐ all four of his named cases pass on the rank clause alone", () => {
    // Barty #1 · Henin #1 · Bartoli #7 · Dementieva inside the ten. §2's own ⚠: what they share is
    // not an age, which is why there is no age in this predicate to assert against.
    for (const rank of [1, 1, 7, 10]) expect(peakLeavingDue(her({ endRank: rank })), `#${rank}`).toBe(true)
  })

  it('⚠ ...and the title clause only ever ADDS – the champion who finished the year at #15', () => {
    expect(peakLeavingDue(her({ endRank: 15 }))).toBe(false)
    expect(peakLeavingDue(her({ endRank: 15, topTitleThisSeason: true }))).toBe(true)
    // ...and it does not need a place at all: a title is a peak even if she held no counting place.
    expect(peakLeavingDue(her({ endRank: null, topTitleThisSeason: true }))).toBe(true)
  })

  it('⚠ refuses on any table but the paid one – #4 on a domestic ladder at fifteen is not a peak', () => {
    expect(peakLeavingDue(her({ endRank: 4, professional: false }))).toBe(false)
    expect(peakLeavingDue(her({ endRank: 4, professional: false, topTitleThisSeason: true }))).toBe(false)
  })

  it('takes the band as a parameter, so the bench can sweep it without a second copy of the rule', () => {
    expect(peakLeavingDue(her({ endRank: 30 }), 50)).toBe(true)
    expect(peakLeavingDue(her({ endRank: 30 }), 20)).toBe(false)
  })
})

// =================================================================================================
// C. THE FALL GATE – §3, anchored on his own worked example
// =================================================================================================

describe('C. #8 – she leaves after the fall', () => {
  /** HIS OWN CASE, from §1's table: #13 -> #59, 4,008 points expiring against 1,584 replacing them.
   *  Every threshold in `ENDINGS` was anchored on it, so it is the one row this file may not lose. */
  const HIS_FALL = { temperament: 'fiery' as Temperament, endRank: 59, prevEndRank: 13, points: 1584, prevPoints: 4008 }

  it('⭐ fires on the collapse the door was written for', () => {
    expect(fallLeavingDue(leavingView(HIS_FALL))).toBe(true)
  })

  it('⚠ needs all three terms, and each one alone is a bad year rather than a collapse', () => {
    // points kept, but the place went: a girl who was #13 and is #59 on the same points did not
    // collapse, the table moved past her.
    expect(fallLeavingDue(leavingView({ ...HIS_FALL, points: 4000 }))).toBe(false)
    // the points went, but the place held: a thin season at the same rank is not a collapse either.
    expect(fallLeavingDue(leavingView({ ...HIS_FALL, endRank: 14 }))).toBe(false)
    // the place at least doubled AND moved a long way – #2 -> #5 doubles and is three places.
    expect(fallLeavingDue(leavingView({ ...HIS_FALL, prevEndRank: 2, endRank: 5 }))).toBe(false)
    // ...and #300 -> #340 is forty places and no doubling.
    expect(fallLeavingDue(leavingView({ ...HIS_FALL, prevEndRank: 300, endRank: 340 }))).toBe(false)
  })

  it('⚠ refuses when the season she fell FROM was never a real one', () => {
    expect(fallLeavingDue(leavingView({ ...HIS_FALL, prevPoints: ENDINGS.fallPointsFloor - 1, points: 0 }))).toBe(false)
    expect(fallLeavingDue(leavingView({ ...HIS_FALL, prevPoints: ENDINGS.fallPointsFloor, points: 0 }))).toBe(true)
  })

  it('⚠ declines rather than guesses when a season is not comparable – the same refusal the plateau makes', () => {
    // She held no counting place on that table last season: a fall has to be FROM somewhere.
    expect(fallLeavingDue(leavingView({ ...HIS_FALL, prevEndRank: null }))).toBe(false)
    // ...or none this season, which a v46-era row also reads as.
    expect(fallLeavingDue(leavingView({ ...HIS_FALL, endRank: null }))).toBe(false)
  })

  it('⚠ refuses on any table but the paid one – a junior points collapse is a different story', () => {
    expect(fallLeavingDue(leavingView({ ...HIS_FALL, professional: false }))).toBe(false)
  })
})

// =================================================================================================
// D. THE WORLD SIDE – the view, the week, and the stream
// =================================================================================================

/** Season 11's wrap-up week – the ONE week of the year either door may open on. Same arithmetic as
 *  `resolveEndings`' own gate, written from the constants so a calendar change moves it. */
const WRAP_S11 = 11 * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)

function bankedSeason(seasonIndex: number, per: Partial<Record<LadderTrack, SeasonTrackRow>>): SeasonHistoryEntry {
  const byTrack = {} as Record<LadderTrack, SeasonTrackRow>
  for (const track of LADDER_TRACKS) byTrack[track] = { points: 0, wins: 0, losses: 0, ...(per[track] ?? {}) }
  return { seasonIndex, endRank: 0, points: 0, wins: 0, losses: 0, byTrack, fundsDeltaCents: 0, endFundsCents: 0 }
}

/** A professional parked on season 11's wrap week with the fork long answered – the exact state
 *  `resolveEndings` runs step 7c″ in. `bestFinishByTier` is what makes the paid table hers for good
 *  (`wtaEverCounted` / `activeLadderOf`, the one-way door). */
function atTheWrap(seed: string, temperament: Temperament, history: SeasonHistoryEntry[]): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  world.week = WRAP_S11
  world.temperament = temperament
  world.fork = { askedWeek: 300, answer: 'continue', offer: null }
  world.seasonHistory = history
  world.bestFinishByTier = { w75: 2 }
  return world
}

const AT_THE_TOP = [
  bankedSeason(10, { wta: { endRank: 6, points: 4800, wins: 0, losses: 0 } }),
  bankedSeason(11, { wta: { endRank: 4, points: 5000, wins: 0, losses: 0 } }),
]
const THE_COLLAPSE = [
  bankedSeason(10, { wta: { endRank: 13, points: 4008, wins: 0, losses: 0 } }),
  bankedSeason(11, { wta: { endRank: 59, points: 1584, wins: 0, losses: 0 } }),
]

describe('D. the seam – what the world hands the leaf', () => {
  it('reads the season that just closed and the one before it, off her own table', () => {
    const view = leavingViewOf(atTheWrap('two-doors-view', 'fiery', THE_COLLAPSE))
    expect(view.seasonIndex).toBe(11)
    expect(view.professional).toBe(true)
    expect({ endRank: view.endRank, prevEndRank: view.prevEndRank }).toEqual({ endRank: 59, prevEndRank: 13 })
    expect({ points: view.points, prevPoints: view.prevPoints }).toEqual({ points: 1584, prevPoints: 4008 })
    expect(view.temperament).toBe('fiery')
  })

  it('⚠ a season that is not the immediately preceding one is a GAP, not a season she fell from', () => {
    // Season 9 and 11 banked, 10 missing (a college year, or a row from before v46). `prevEndRank`
    // must be null – reading "the last row in the list" would compare across a two-year hole.
    const gapped = [
      bankedSeason(9, { wta: { endRank: 13, points: 4008, wins: 0, losses: 0 } }),
      bankedSeason(11, { wta: { endRank: 59, points: 1584, wins: 0, losses: 0 } }),
    ]
    const view = leavingViewOf(atTheWrap('two-doors-gap', 'fiery', gapped))
    expect(view.prevEndRank).toBeNull()
    expect(fallLeavingDue(view)).toBe(false)
  })

  it('⚠ a career that never turned professional is not on the paid table, whatever its numbers say', () => {
    const world = atTheWrap('two-doors-junior', 'deep', AT_THE_TOP)
    world.bestFinishByTier = {}
    expect(leavingViewOf(world).professional).toBe(false)
    expect(leavingDoorDue(leavingViewOf(world))).toBeNull()
  })

  it('reads a title at the top rung inside this season, and not one from a season before it', () => {
    const world = atTheWrap('two-doors-title', 'deep', AT_THE_TOP)
    const top = TIER_LADDER[TIER_LADDER.length - 1]
    expect(wonTopTitleInSeason(world)).toBe(false)
    world.trophiesByTier[top] = { titles: [WRAP_S11 - 20], finals: [] }
    expect(wonTopTitleInSeason(world)).toBe(true)
    // ...one season earlier is a different season and no longer this peak.
    world.trophiesByTier[top] = { titles: [WRAP_S11 - WEEKS_PER_YEAR - 1], finals: [] }
    expect(wonTopTitleInSeason(world)).toBe(false)
  })
})

describe('D2. the step – the one week, the one draw, and the stream it is on', () => {
  /** ⚠ THE DRAW IS THE SHIPPED ONE, RE-DERIVED RATHER THAN MOCKED: the same key `resolveLeaving`
   *  builds, so a test can say what a seed's winter answers without a second copy of the rule. */
  function coin(seed: string, door: 'peak' | 'fall', seasonIndex: number): number {
    return rngFromSeed(`${seed}:ending:${door}:${seasonIndex}`)()
  }

  /** A seed whose season-11 coin lands under the chance, and one whose does not – found by search so
   *  the cases below are about the STEP rather than about luck.
   *
   *  ⚠ THE BOUND IS DELIBERATELY FAR PAST WHAT TODAY'S CHANCE NEEDS. At the shipped 2% a «fires»
   *  seed turns up in about fifty tries; at 0.1% it would take a thousand. The whole point of these
   *  cases is that they survive a RE-TUNE of the rate, so the search has to outlive one – and it
   *  THROWS rather than falling back to a seed that does not fire, because a silent fallback would
   *  turn «the door latched» into a test that cannot fail. */
  function seedWhere(door: 'peak' | 'fall', wants: 'fires' | 'refuses'): string {
    for (let i = 0; i < 20000; i++) {
      const seed = `two-doors-${door}-${i}`
      const under = coin(seed, door, 11) < (door === 'peak' ? ENDINGS.peakLeavingChance : ENDINGS.fallLeavingChance)
      if (under === (wants === 'fires')) return seed
    }
    throw new Error(`no seed found for ${door}/${wants}`)
  }

  it('latches the peak ending, in her voice, on a winter whose coin lands under the chance', () => {
    const seed = seedWhere('peak', 'fires')
    const world = atTheWrap(seed, 'deep', AT_THE_TOP)
    resolveLeaving(world)
    expect(world.ending?.type).toBe('peak')
    expect(world.ending?.week).toBe(WRAP_S11)
    // HER SENTENCE FIRST, then the record – the natural end's own order.
    const rows = world.events.filter((e) => e.type === 'milestone').map((e) => e.text)
    expect(rows).toContain(leavingLine('deep'))
    expect(rows).toContain(`${ENDING_TITLE.peak} – ${world.ending!.detail}.`)
    expect(rows.indexOf(leavingLine('deep'))).toBeLessThan(rows.indexOf(`${ENDING_TITLE.peak} – ${world.ending!.detail}.`))
  })

  it('latches the fall ending on a collapse, and it is the `fall` voice that speaks', () => {
    const seed = seedWhere('fall', 'fires')
    const world = atTheWrap(seed, 'quiet', THE_COLLAPSE)
    resolveLeaving(world)
    expect(world.ending?.type).toBe('fall')
    expect(world.ending?.detail).toBe('#13 to #59 in one season')
    expect(world.events.some((e) => e.text === leavingLine('quiet'))).toBe(true)
  })

  it('⚠ leaves the career alone on a winter whose coin does not land – most who fall keep playing', () => {
    const seed = seedWhere('fall', 'refuses')
    const world = atTheWrap(seed, 'fiery', THE_COLLAPSE)
    resolveLeaving(world)
    expect(world.ending).toBeNull()
  })

  it('⚠ is inert on every week but the off-season wrap, however open the gate is', () => {
    const seed = seedWhere('peak', 'fires')
    for (const offset of [0, 1, WEEKS_PER_YEAR - OFF_SEASON_WEEKS - 1, WEEKS_PER_YEAR - 1]) {
      const world = atTheWrap(seed, 'deep', AT_THE_TOP)
      world.week = 11 * WEEKS_PER_YEAR + offset
      resolveLeaving(world)
      expect(world.ending, `week offset ${offset}`).toBeNull()
    }
  })

  it('⚠ never runs behind a latch, and never inside the college freeze', () => {
    const seed = seedWhere('peak', 'fires')
    const latched = atTheWrap(seed, 'deep', AT_THE_TOP)
    latchEnding(latched, { type: 'natural', week: WRAP_S11, ageYears: 30, detail: 'x', resumesWeek: null })
    resolveLeaving(latched)
    expect(latched.ending?.type).toBe('natural')

    const enrolled = atTheWrap(seed, 'deep', AT_THE_TOP)
    enrolled.college = {
      fromWeek: WRAP_S11 - 10,
      untilWeek: WRAP_S11 + 200,
      doneWeek: null,
      years: [],
      pendingCallUp: null,
      pendingLeague: null,
    }
    resolveLeaving(enrolled)
    expect(enrolled.ending).toBeNull()
  })

  it('⚠⚠ the draw is on a purpose-scoped sub-stream and MAIN never moves (invariant 2)', () => {
    const seed = seedWhere('peak', 'fires')
    const world = atTheWrap(seed, 'deep', AT_THE_TOP)
    const before = { ...world.rngMain }
    resolveLeaving(world)
    expect(world.ending?.type).toBe('peak')
    // The MAIN position is byte-identical across a leaving – the frozen capture (41550 / e6b0c709)
    // cannot see this step, which is why round 45 owed it no re-pin.
    expect(world.rngMain).toEqual(before)
  })

  it('⚠⚠ the coin is keyed on the SEASON, so replaying the winter cannot re-roll it', () => {
    const seed = seedWhere('fall', 'fires')
    const a = atTheWrap(seed, 'fiery', THE_COLLAPSE)
    const b = atTheWrap(seed, 'fiery', THE_COLLAPSE)
    resolveLeaving(a)
    resolveLeaving(b)
    expect(a.ending?.type).toBe(b.ending?.type)
    // ...and the two doors never share a number: the key carries the door.
    expect(coin(seed, 'peak', 11)).not.toBe(coin(seed, 'fall', 11))
  })
})

// =================================================================================================
// E. THE COPY – the law it obeys, never the words themselves
// =================================================================================================

describe('E. her four exits, and what none of them may say', () => {
  const lines = TEMPERAMENTS.map((t) => ({ t, line: leavingLine(t) }))

  it('gives each of the four voices its own exit, and no two are the same sentence', () => {
    const texts = lines.map((l) => l.line)
    expect(new Set(texts).size).toBe(TEMPERAMENTS.length)
    for (const { t, line } of lines) expect(line.length, t).toBeGreaterThan(40)
  })

  it('⚠⚠ no leaving blames a body, a load or a decision – the `lastWordLine` law, one level up', () => {
    // ⚠ THE FORBIDDEN VOCABULARY IS THE MEASURED ONE. The long goodbye measured that she opens her
    // LAST seasons better than her first (83/84/90/91/93/97 at 30-41), so nothing may imply she is
    // too tired to go on; and §3a measured the physical share as a function of age alone, so nothing
    // may imply her body, her schedule or the parent's management brought a leaving on.
    const banned = [
      /\btired\b/i, /\bexhaust/i, /\bworn\b/i, /\bburn(ed|t|out)\b/i,
      /\bbody\b/i, /\binjur/i, /\bknee\b/i, /\bback gave\b/i,
      /\bschedule\b/i, /\bcoach\b/i, /\bmoney\b/i, /\byour fault\b/i, /\bshould have\b/i,
    ]
    for (const { t, line } of lines) {
      for (const rx of banned) expect(line, `${t}: «${line}»`).not.toMatch(rx)
    }
  })

  it('⚠ none of the four grades her, consoles the player, or predicts what the world will do', () => {
    // §6: «The game never tells you that you failed. It tells you what happened.» And the plateau
    // lede's own rule: a line may say what SHE believes and may never say what the world is going to do.
    const banned = [/\bfail/i, /\bwast/i, /\bproud\b/i, /\bwell done\b/i, /\bat least\b/i, /\bwould have\b/i, /\bnever would\b/i]
    for (const { t, line } of lines) {
      for (const rx of banned) expect(line, `${t}: «${line}»`).not.toMatch(rx)
    }
  })

  it('⚠ the house dash rule holds in every line the player reads here', () => {
    const all = [...lines.map((l) => l.line), ENDING_BLURB.peak, ENDING_BLURB.fall, ENDING_TITLE.peak, ENDING_TITLE.fall]
    for (const text of all) expect(text, text).not.toMatch(/[—―]/)
  })

  it('⚠ the two details are FRAGMENTS, so `latchEnding` composes a sentence and not a stutter', () => {
    const peak = endingForLeaving('peak', leavingView({ temperament: 'deep', endRank: 4 }), 1200, 25)
    const fall = endingForLeaving(
      'fall',
      leavingView({ temperament: 'fiery', endRank: 59, prevEndRank: 13, points: 1584, prevPoints: 4008 }),
      900,
      22,
    )
    for (const ending of [peak, fall]) {
      expect(ending.detail).not.toMatch(/\.$/)
      expect(ending.resumesWeek).toBeNull()
      expect(`${ENDING_TITLE[ending.type]} – ${ending.detail}.`).toMatch(/^[A-Z].*\.$/)
    }
    expect(peak.detail).toBe('she was #4 the week she said it')
    expect(fall.detail).toBe('#13 to #59 in one season')
    // The peak's other branch: a champion with no counting place names the title instead.
    expect(
      endingForLeaving('peak', leavingView({ endRank: null, topTitleThisSeason: true }), 1200, 25).detail,
    ).not.toContain('#')
  })

  it('⚠ the epilogue can be built for both new endings – blurb, title and her face all answer', () => {
    for (const type of ['peak', 'fall'] as const) {
      const world = createWorld(`two-doors-epilogue-${type}`, { ...DEFAULT_PROFILE })
      latchEnding(world, { type, week: world.week, ageYears: 25, detail: 'a detail', resumesWeek: null })
      const view = buildEndingView(world)
      expect(view, type).not.toBeNull()
      expect(view!.ending.type).toBe(type)
      expect(ENDING_BLURB[type].length, type).toBeGreaterThan(40)
      expect(ENDING_TITLE[type].length, type).toBeGreaterThan(8)
      // Her face comes off the album, which is the third total record the widening went red in.
      expect(view!.album.length).toBeGreaterThan(0)
    }
  })
})
