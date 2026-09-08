// =================================================================================================
// ⭐⭐⭐ ROUND 39 #2b (REOPENED 08.09) – ONE SHORT READ ON HOME, DERIVED WHERE THE LONG ONES ARE
// =================================================================================================
//
// The owner, 08.09, ruling on wave A's three draft arms for Home's short plate:
//
//     «Past her peak хорошо и коротко, остальное всё пусть на карточке тренера живет, может быть
//      разве что – about 4 seasons left еще можно оставить. И до этого были фразочки про то, что
//      ей недалеко до потолка, что потолок достигнут и прочее, вот это тоже всё-таки можно
//      показывать буквально в 3-5 слов на home»
//
// Three engine-level claims, each pinned below (the RENDERED plate is pinned in tests/component/ –
// r39-decline-surfaces, round24-coach-card, r38-decline-voice):
//
//   1. THE DECLINE SHORT IS THE LABEL PLUS THE ONE CLAUSE HE KEPT – «about N seasons left» – and
//      wave A's two rank arms are gone from it: they live in the coach card's long sentence alone.
//      The N is the long sentence's own, read off the same `declineRead`.
//   2. THE GROWING SHORT IS THE HEADROOM BAND IN 3-5 WORDS, resolved through the SAME row lookup
//      the long room note reads (`roomBandRow` – one realisation, one threshold walk, one table
//      row). Walk the realisation across the four bands and the sentence and the short move
//      together, rung for rung – which is the "mutate the band, both move" evidence.
//   3. EXACTLY ONE OF THE TWO READS CAN EVER BE IN THE STRING – `coachRoomShort` is
//      `coachRoomNote`'s own fallthrough shape – and it is '' where the engine says nothing, which
//      is the round-34 child guarantee at its data-level core.
import { describe, it, expect } from 'vitest'
import {
  COACH_BODY_END_SHARE,
  ROOM_NOTE_SEP,
  coachDeclineNote,
  coachDeclineShort,
  coachRoomBandLabel,
  coachRoomBandOf,
  coachRoomBandShort,
  coachRoomNote,
  coachRoomShort,
  declinePhaseOf,
  seasonRankRead,
} from '../src/engine/world/coachMarket'
import { createWorld, toSnapshot } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { startingSkills } from '../src/engine/world/player'
import { physicalMean, reachableHeadroomShare, SKILL_KEYS } from '../src/engine/development'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonHistoryEntry, SeasonTrackRow } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'

/** A growing world pinned to one realisation share – round23-coach-copy's own construction: 20
 *  points of headroom on every attribute and `shown` of what is REACHABLE taken, so the band index
 *  is exactly the one asked for (see that file for why the multiply is derived, not written). */
function worldAt(shown: number): WorldState {
  const world = createWorld('r39-short-grow', DEFAULT_PROFILE)
  const born = startingSkills(world.seed, world.profile)
  for (const k of SKILL_KEYS) {
    world.potential[k] = born[k] + 20
    world.skills[k] = born[k] + 20 * shown * reachableHeadroomShare()
  }
  return world
}

const EMPTY_ROW: SeasonTrackRow = { points: 0, wins: 0, losses: 0 }
function season(seasonIndex: number, wtaRank: number | null): SeasonHistoryEntry {
  const byTrack = {
    domestic: { ...EMPTY_ROW },
    itf: { ...EMPTY_ROW },
    wta: wtaRank === null ? { ...EMPTY_ROW } : { ...EMPTY_ROW, endRank: wtaRank },
  } as Record<LadderTrack, SeasonTrackRow>
  return {
    seasonIndex,
    endRank: wtaRank ?? 0,
    points: 0,
    wins: 0,
    losses: 0,
    fundsDeltaCents: 0,
    endFundsCents: 0,
    byTrack,
  }
}

/** A career past its peak – r38-decline-voice's fixture shape, ranks under the test's own hand.
 *
 *  ⚠⚠ ROUND 39 #2b (RE-REOPENED 08.09) – `seasonWeek` IS PART OF THE FIXTURE NOW, because the plate
 *  rotates on where the week sits in its own season. `(years - 14) * 52` is a whole number of
 *  seasons, so the default lands on season-week 0 – the EARLY third – and every arm below that
 *  wants one particular variant has to NAME its phase. An arm that names none is claiming something
 *  true of every week of the year, which is a stronger claim and is used deliberately where it is. */
const MID_SEASON_WEEK = 20
function pastPeakWorld(opts: {
  seasons: SeasonHistoryEntry[]
  share?: number
  ageYears?: number
  seasonWeek?: number
}): WorldState {
  const world = createWorld('r39-short-peak', { ...DEFAULT_PROFILE, coachTier: 'middle' })
  const years = opts.ageYears ?? 35
  world.week = Math.round((years - 14) * 52) + (opts.seasonWeek ?? 0)
  world.peakPhysical = physicalMean(world.skills) / (opts.share ?? 0.8)
  world.seasonHistory = opts.seasons
  return world
}

/** One realisation point inside each band – the samples round23-coach-copy walks the edges with. */
const BAND_POINTS: [number, number][] = [
  [0, 0.2],
  [1, 0.6],
  [2, 0.8],
  [3, 0.95],
]

describe('round 39 #2b – the growing short and the long room note move together', () => {
  it('⭐⭐ THE DERIVATION: walk the four bands – one row under both surfaces, rung for rung', () => {
    // This is the "mutate the band → both move together" arm: the realisation is the only lever,
    // and at every rung the long sentence and the short land on the SAME `ROOM_BANDS` row. A second
    // derivation for either surface – a copied threshold, a second table – fails here the week it
    // drifts.
    for (const [band, shown] of BAND_POINTS) {
      const world = worldAt(shown)
      expect(coachRoomBandOf(world), `realised ${shown} is not band ${band} – re-place the sample`).toBe(band)
      expect(coachRoomNote(world).startsWith(`${coachRoomBandLabel(band)}${ROOM_NOTE_SEP}`), `note off row ${band}`).toBe(true)
      expect(coachRoomShort(world), `short off row ${band}`).toBe(coachRoomBandShort(band))
    }
  })

  it('⭐ each band short is 3-5 words («буквально в 3-5 слов»), no digit, not a sentence', () => {
    for (const [band, shown] of BAND_POINTS) {
      const short = coachRoomBandShort(band)
      const words = short.split(/\s+/).filter(Boolean)
      expect(words.length, `band ${band} "${short}" is outside the 3-5 word window`).toBeGreaterThanOrEqual(3)
      expect(words.length, `band ${band} "${short}" is outside the 3-5 word window`).toBeLessThanOrEqual(5)
      // The fog rule crosses to Home with the read: no digit, no percent, and a clause, not a verdict
      // dressed as prose.
      expect(short, `a figure leaked into band ${band}`).not.toMatch(/[\d%]/)
      expect(short, `band ${band} grew into a sentence`).not.toMatch(/[.!?]$/)
      // ...and it is the band's OWN vocabulary: every word already stands in that row's label or
      // note (owner's rule for the drafts – compress, do not invent).
      const row = `${coachRoomBandLabel(band)} ${coachRoomNote(worldAt(shown))}`.toLowerCase()
      for (const word of words) {
        expect(row, `"${word}" in band ${band}'s short is invented vocabulary`).toContain(word.toLowerCase())
      }
    }
  })

  it('⚠ swept across the whole scale: the short is always the row of the band actually read', () => {
    for (let shown = 0; shown <= 1.001; shown += 0.05) {
      const world = worldAt(Math.min(shown, 1))
      const band = coachRoomBandOf(world)
      expect(band, `no band at realised ${shown}`).not.toBeNull()
      expect(coachRoomShort(world), `realised ${shown}`).toBe(coachRoomBandShort(band!))
    }
  })
})

describe('round 39 #2b – mid-season the decline short is the seasons clause, and nothing else', () => {
  it('⭐⭐ THE RULING: all three of wave A\'s worlds read «Past her peak – about N seasons left» (⚠ re-aimed: MID season)', () => {
    // The three fixtures that used to pick three different arms – fell on the year, below her best,
    // sitting on her best. The LONG note keeps its three arms on the coach card; the short says the
    // one clause the owner kept, in his own words, on every one of them.
    //
    // ⚠⚠ RE-AIMED BY THE 08.09 RE-REOPEN, AND THE GUARD IS INTACT – it now names its week. The owner
    // asked the plate to rotate («можно же чередовать как раз на спаде эти фразочки … уберет
    // статичность»), so the clause he kept holds the MIDDLE third of the season and is what every
    // other third falls back to; the early and late thirds say his two shorter phrasings, pinned in
    // the rotation describe below. Nothing here weakened: the same three worlds, the same string,
    // at the week the string is the engine's answer.
    const fell = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)], seasonWeek: MID_SEASON_WEEK })
    const belowBest = pastPeakWorld({ seasons: [season(16, 20), season(20, 125)], seasonWeek: MID_SEASON_WEEK })
    const atBest = pastPeakWorld({ seasons: [season(20, 30)], seasonWeek: MID_SEASON_WEEK })
    for (const [name, world] of [
      ['fell', fell],
      ['belowBest', belowBest],
      ['atBest', atBest],
    ] as const) {
      const short = coachDeclineShort(world)
      expect(short, name).toMatch(/^Past her peak – about \d+ seasons? left$/)
      // Wave A's two rank arms are OFF the short – «остальное всё пусть на карточке тренера живет».
      expect(short, name).not.toContain('places')
      expect(short, name).not.toContain('on the year')
      expect(short, name).not.toContain('below her best')
      // ...and the N is the long sentence's own seasons figure, read off the same `declineRead`.
      const long = coachDeclineNote(world).match(/about (\d+) more seasons? in it/)
      expect(long, `${name}: the long note lost its body clause`).not.toBeNull()
      const n = Number(long![1])
      expect(short, name).toBe(`Past her peak – about ${n} ${n === 1 ? 'season' : 'seasons'} left`)
    }
    // Non-vacuity for the arms above: the LONG note really does still distinguish the three worlds.
    expect(coachDeclineNote(fell)).toContain('down 57 places on the year')
    expect(coachDeclineNote(belowBest)).toContain('105 places below her best season')
    expect(coachDeclineNote(atBest)).toContain('no coach buys that back')
  })

  it('⚠ #13c\'s singular care carries to the surviving clause: «about 1 season left»', () => {
    // A body just above the walk's stop has the honest floor of 1 – r38-decline-voice's own edge.
    // ⚠ re-aimed 08.09: at MID season, where the seasons clause is the phase's own variant.
    const tail = pastPeakWorld({
      seasons: [season(19, 68), season(20, 125)],
      share: COACH_BODY_END_SHARE + 0.005,
      seasonWeek: MID_SEASON_WEEK,
    })
    expect(coachDeclineShort(tail)).toBe('Past her peak – about 1 season left')
    expect(coachDeclineShort(tail)).not.toContain('1 seasons')
    // ...and the plural form on a body with more in it, so the singular is a branch, not the rule.
    expect(coachDeclineShort(pastPeakWorld({ seasons: [season(20, 30)], seasonWeek: MID_SEASON_WEEK }))).toMatch(
      /about \d+ seasons left$/,
    )
  })
})

describe('round 39 #2b – exactly one read, and the empty string where the engine says nothing', () => {
  it('⭐ the fallthrough mirrors the long note\'s own: declining → decline read, growing → band short', () => {
    // ⚠ SWEPT OVER EVERY WEEK OF THE SEASON since the 08.09 re-reopen: the exclusivity is a claim
    // about the FIELD and the rotation may not be allowed to leak a band short into a declining
    // career's plate on some week of the year. What used to be one assertion at season-week 0 is
    // fifty-two of them.
    for (let sw = 0; sw < WEEKS_PER_YEAR; sw++) {
      const declining = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)], seasonWeek: sw })
      // Past the peak, both shorts are the same string – `coachRoomShort` IS the decline read there,
      // exactly as `coachRoomNote` is `coachDeclineNote` (the round 38 #7b fallthrough, mirrored).
      expect(coachDeclineShort(declining), `week ${sw}`).not.toBe('')
      expect(coachRoomShort(declining), `week ${sw}`).toBe(coachDeclineShort(declining))
      expect(coachRoomNote(declining), `week ${sw}`).toBe(coachDeclineNote(declining))
      // ⚠ and the band half is really unreachable there: no band short survives in the string even
      // though her realisation still resolves to a band index.
      for (const [band] of BAND_POINTS) {
        expect(coachRoomShort(declining), `week ${sw}`).not.toContain(coachRoomBandShort(band))
      }
    }
    // Growing: the decline half is '' (the round-38 gate) and the plate string is the band's short.
    const growing = worldAt(0.5)
    expect(coachDeclineShort(growing)).toBe('')
    expect(coachRoomShort(growing)).toBe(coachRoomBandShort(1))
    expect(coachRoomShort(growing)).not.toContain('Past her peak')
  })

  it('⚠ the two halves partition every world: the DECLINE read in the short iff the gate is open (⚠ re-aimed)', () => {
    // ⚠⚠ RE-AIMED BY THE 08.09 RE-REOPEN, WITH THE GUARD MADE STRONGER RATHER THAN LOOSER. The
    // discriminator used to be «starts with Past her peak», and the rotation legitimately moved
    // that: two of the three decline variants are his own «she's …» phrasings and carry no label.
    // So the partition is now stated on the two DERIVATIONS – a declining world's plate is exactly
    // its decline read, a growing one's is exactly its band row – and the vocabulary check runs
    // both ways: no «Past her peak» AND no «she's» on a growing plate, no band short on a declining
    // one. Swept over every week, so no phase can be the hole.
    const worlds: [string, WorldState][] = [
      ['band 0', worldAt(0.2)],
      ['band 3', worldAt(0.95)],
      ['fell', pastPeakWorld({ seasons: [season(19, 68), season(20, 125)] })],
      ['below best', pastPeakWorld({ seasons: [season(16, 20), season(20, 125)] })],
      ['at best', pastPeakWorld({ seasons: [season(20, 30)] })],
      ['fresh world', createWorld('r39-short-fresh', DEFAULT_PROFILE)],
    ]
    for (const [name, world] of worlds) {
      for (let sw = 0; sw < WEEKS_PER_YEAR; sw++) {
        const probe = { ...world, week: world.week - (world.week % WEEKS_PER_YEAR) + sw } as WorldState
        const short = coachRoomShort(probe)
        expect(short, `${name} week ${sw}`).not.toBe('')
        if (coachDeclineNote(probe) !== '') {
          expect(short, `${name} week ${sw}: the halves overlap or invert`).toBe(coachDeclineShort(probe))
        } else {
          expect(short, `${name} week ${sw}: the halves overlap or invert`).toBe(coachRoomBandShort(coachRoomBandOf(probe)!))
          expect(short, `${name} week ${sw}: a decline verdict on a growing career`).not.toContain('Past her peak')
          expect(short, `${name} week ${sw}: a decline phrasing on a growing career`).not.toContain("she's")
        }
      }
    }
  })

  it("⚠ '' where the engine says nothing – the round-34 child guarantee, held in the data", () => {
    // round23-coach-copy's no-room world: nothing to realise, so the long note says nothing, and
    // the short may not say more than the long. A plate rendering this field shows a child with an
    // empty engine read NOTHING – no band, no verdict – with no template condition involved.
    const world = createWorld('r39-short-empty', DEFAULT_PROFILE)
    for (const k of SKILL_KEYS) {
      world.potential[k] = 0
      world.skills[k] = 0
    }
    expect(coachRoomNote(world)).toBe('')
    expect(coachRoomShort(world)).toBe('')
    expect(coachDeclineShort(world)).toBe('')
  })
})

// =================================================================================================
// ⭐⭐⭐ ROUND 39 #2b (RE-REOPENED 08.09) – THE DECLINE PLATE ROTATES WITH THE SEASON
// =================================================================================================
//
// The owner, reading wave A2's single static sentence:
//
//     «слушай, а можно же чередовать как раз на спаде эти фразочки. давай оставим и «Past her peak
//      – about N seasons left», и «she's down N places» в начале сезона, например или в конце
//      наоборот, «she's below her best» или «she's way below her best» или «she's far below her
//      best», это даст живости и вариативности, уберет статичность.»
//
// Five claims, each an arm below:
//   1. THE PHASE DECIDES. Early → his year clause, late → his below-best clause, mid → the seasons
//      clause. On a world where all three are true the plate says three different things.
//   2. A VARIANT ONLY SHOWS WHEN IT IS TRUE, and the fallthrough order is pinned per phase.
//   3. IT IS ROTATION, NOT RANDOMNESS – the same world at the same week is the same string, twice
//      in a row and through a re-derived snapshot, and no stream is touched (invariant 2).
//   4. IT IS NOT STATIC – walked across one season, one career's plate says more than one thing.
//      That is his ask, stated as a measurement.
//   5. THE INTENSITY LADDER'S EDGES are where `tools/r39-decline-rotation.ts` measured them.

/** A past-peak career whose last season finished exactly `behind` places off its own best, with a
 *  GAP between the two rows so the year arm is absent and the ladder is what speaks. */
function behindBest(behind: number, seasonWeek: number): WorldState {
  return pastPeakWorld({ seasons: [season(15, 1), season(20, 1 + behind)], seasonWeek })
}

/** All three variants true at once: adjacent seasons that fell, and an older season better than
 *  both. s19 #68 → s20 #125 is a 57-place year; the career best #20 is 105 places up. */
const ALL_THREE = (seasonWeek: number): WorldState =>
  pastPeakWorld({ seasons: [season(16, 20), season(19, 68), season(20, 125)], seasonWeek })

const FELL_RE = /^she's down \d+ places?$/
const BELOW_RE = /^she's (below|far below|way below) her best$/
const SEASONS_RE = /^Past her peak – about \d+ seasons? left$/

describe('round 39 #2b (re-reopened) – the phase decides which of his phrasings the plate says', () => {
  it('⭐⭐ THE CLOCK: thirds of the season, off the ledger\'s own `seasonStartWeek`, repeating every year', () => {
    // The cuts, pinned as literals so moving them is a visible edit and not a silent drift.
    expect(declinePhaseOf(0)).toBe('early')
    expect(declinePhaseOf(16)).toBe('early')
    expect(declinePhaseOf(17)).toBe('mid')
    expect(declinePhaseOf(34)).toBe('mid')
    expect(declinePhaseOf(35)).toBe('late')
    expect(declinePhaseOf(WEEKS_PER_YEAR - 1)).toBe('late')
    // ...and it is the SEASON's clock, so week w and week w + a season are the same phase. A second
    // modulo, or a phase read off the absolute week, dies here.
    for (let sw = 0; sw < WEEKS_PER_YEAR; sw++) {
      expect(declinePhaseOf(sw), `season week ${sw}`).toBe(declinePhaseOf(sw + 20 * WEEKS_PER_YEAR))
    }
    // The off-season – where the year's row is actually banked (`milestones.ts`, week 49) – is
    // inside the LATE third, which is the whole reason the below-best clause lives there.
    for (let sw = WEEKS_PER_YEAR - OFF_SEASON_WEEKS; sw < WEEKS_PER_YEAR; sw++) {
      expect(declinePhaseOf(sw), `off-season week ${sw}`).toBe('late')
    }
    // Each phase is a real third and none of them is empty.
    const counts = { early: 0, mid: 0, late: 0 }
    for (let sw = 0; sw < WEEKS_PER_YEAR; sw++) counts[declinePhaseOf(sw)]++
    expect(counts).toEqual({ early: 17, mid: 18, late: 17 })
  })

  it('⭐⭐ THE ITEM: one world where all three are true says three different things across the season', () => {
    // The fixture really does support every variant – non-vacuity before the mapping is read.
    const probe = ALL_THREE(0)
    expect(seasonRankRead(probe).yearMove).toBe(57)
    expect(seasonRankRead(probe).belowBest).toBe(105)

    for (let sw = 0; sw < WEEKS_PER_YEAR; sw++) {
      const short = coachDeclineShort(ALL_THREE(sw))
      const phase = declinePhaseOf(sw)
      if (phase === 'early') expect(short, `week ${sw} (early)`).toMatch(FELL_RE)
      else if (phase === 'mid') expect(short, `week ${sw} (mid)`).toMatch(SEASONS_RE)
      else expect(short, `week ${sw} (late)`).toMatch(BELOW_RE)
    }
    // His words, verbatim, on this fixture's own numbers – the strings and not only their shapes.
    expect(coachDeclineShort(ALL_THREE(0))).toBe("she's down 57 places")
    expect(coachDeclineShort(ALL_THREE(MID_SEASON_WEEK))).toMatch(SEASONS_RE)
    // 105 places behind her best is the MIDDLE rung of the measured ladder (p33 = 79, p67 = 257),
    // so this fixture is also a live read of where the cuts fell – not merely of the shape.
    expect(coachDeclineShort(ALL_THREE(WEEKS_PER_YEAR - 1))).toBe("she's far below her best")
  })

  it('⭐⭐ HIS ASK, MEASURED: the plate is not static – walked over one season it says more than one thing', () => {
    // «это даст живости и вариативности, уберет статичность». The set of DISTINCT sentences one
    // career's Home shows across a single season is the whole complaint, so it is the assertion.
    const said = new Set<string>()
    for (let sw = 0; sw < WEEKS_PER_YEAR; sw++) said.add(coachRoomShort(ALL_THREE(sw)))
    expect(said.size, `the plate said only: ${[...said].join(' | ')}`).toBeGreaterThan(1)
    // ...and on this world it is all three of his registers, not two.
    expect([...said].some((s) => FELL_RE.test(s)), 'the year clause never appeared').toBe(true)
    expect([...said].some((s) => BELOW_RE.test(s)), 'the below-best clause never appeared').toBe(true)
    expect([...said].some((s) => SEASONS_RE.test(s)), 'the seasons clause never appeared').toBe(true)
    // ⚠ AND THE GROWING HALF IS UNTOUCHED – the four band shorts he has just approved do not rotate.
    const growingSaid = new Set<string>()
    for (let sw = 0; sw < WEEKS_PER_YEAR; sw++) {
      const world = worldAt(0.5)
      world.week = sw
      growingSaid.add(coachRoomShort(world))
    }
    expect([...growingSaid], 'the rotation leaked into the growing read').toEqual([coachRoomBandShort(1)])
  })

  it('⚠ THE FALLTHROUGH, PINNED: early → fell → below → seasons; late → below → fell → seasons', () => {
    // Each row of the table, walked by REMOVING the fact the phase would rather have. A variant may
    // only show when it is true, and what it degrades TO is as pinned as what it prefers.
    const EARLY = 0
    const LATE = WEEKS_PER_YEAR - 1

    // EARLY, first choice: the year fall exists → his year clause.
    expect(coachDeclineShort(ALL_THREE(EARLY))).toBe("she's down 57 places")
    // EARLY, no adjacent pair (s16 → s20 is four seasons, so `yearMove` is null) → falls to below-best.
    const gap = pastPeakWorld({ seasons: [season(16, 20), season(20, 125)], seasonWeek: EARLY })
    expect(seasonRankRead(gap).yearMove).toBeNull()
    expect(coachDeclineShort(gap)).toMatch(BELOW_RE)
    // EARLY, neither: one row, sitting on her own best → falls to the floor.
    const only = pastPeakWorld({ seasons: [season(20, 30)], seasonWeek: EARLY })
    expect(seasonRankRead(only).yearMove).toBeNull()
    expect(seasonRankRead(only).belowBest).toBe(0)
    expect(coachDeclineShort(only)).toMatch(SEASONS_RE)

    // LATE, first choice: below her best → the ladder.
    expect(coachDeclineShort(ALL_THREE(LATE))).toMatch(BELOW_RE)
    // LATE, sitting ON her best but having fallen in the year → falls to his year clause. She may
    // still be her own best while sliding: two adjacent seasons, the later one worse, no better one.
    const bestButFalling = pastPeakWorld({ seasons: [season(19, 30), season(20, 30)], seasonWeek: LATE })
    expect(seasonRankRead(bestButFalling).belowBest).toBe(0)
    const falling = pastPeakWorld({ seasons: [season(19, 30), season(20, 44)], seasonWeek: LATE })
    expect(seasonRankRead(falling).belowBest).toBe(14)
    // ...so the honest «below-best absent» world is the single-row one, and it falls through twice.
    expect(coachDeclineShort(pastPeakWorld({ seasons: [season(20, 30)], seasonWeek: LATE }))).toMatch(SEASONS_RE)

    // MID never reaches for a rank fact even when both are true – it is the one-element row.
    expect(coachDeclineShort(ALL_THREE(MID_SEASON_WEEK))).toMatch(SEASONS_RE)
  })

  it('⚠ A VARIANT IS NEVER SHOWN WITHOUT ITS NUMBER – swept over every phase and every shape', () => {
    const shapes: [string, SeasonHistoryEntry[]][] = [
      ['all three', [season(16, 20), season(19, 68), season(20, 125)]],
      ['gap, below best only', [season(16, 20), season(20, 125)]],
      ['single row, on her best', [season(20, 30)]],
      ['adjacent, improved', [season(19, 125), season(20, 68)]],
      ['no wta rows at all', [season(19, null), season(20, null)]],
      ['no history at all', []],
    ]
    for (const [name, seasons] of shapes) {
      for (let sw = 0; sw < WEEKS_PER_YEAR; sw++) {
        const world = pastPeakWorld({ seasons, seasonWeek: sw })
        const short = coachDeclineShort(world)
        const { yearMove, belowBest } = seasonRankRead(world)
        expect(short, `${name} week ${sw}`).not.toBe('')
        if (FELL_RE.test(short)) {
          expect(yearMove, `${name} week ${sw}: a year clause with no year fall`).not.toBeNull()
          expect(yearMove!, `${name} week ${sw}: a year clause on a move of ${yearMove}`).toBeGreaterThan(0)
          expect(short, `${name} week ${sw}`).toBe(`she's down ${yearMove} ${yearMove === 1 ? 'place' : 'places'}`)
        } else if (BELOW_RE.test(short)) {
          expect(belowBest, `${name} week ${sw}: a below-best clause with no best to be below`).not.toBeNull()
          expect(belowBest!, `${name} week ${sw}: a below-best clause at ${belowBest} places`).toBeGreaterThan(0)
        } else {
          expect(short, `${name} week ${sw}: not one of the three variants`).toMatch(SEASONS_RE)
        }
      }
    }
  })

  it('⚠ ROTATION, NOT RANDOMNESS: the same world at the same week is the same string – and taps no stream', () => {
    for (const sw of [0, 8, 17, 25, 34, 35, 44, WEEKS_PER_YEAR - 1]) {
      const world = ALL_THREE(sw)
      const before = JSON.stringify(world.rngMain)
      const first = coachDeclineShort(world)
      const second = coachDeclineShort(world)
      expect(second, `week ${sw}: two calls, two answers`).toBe(first)
      // ⚠ INVARIANT 2: the plate is derived, so the MAIN stream's persisted position may not move –
      // reading it a hundred times is what a snapshot on a redrawn screen does.
      for (let i = 0; i < 100; i++) coachRoomShort(world)
      expect(JSON.stringify(world.rngMain), `week ${sw}: the plate drew on MAIN`).toBe(before)
      // ...and through a re-derived snapshot, which is the path Home actually reads.
      expect(toSnapshot(world).coachRoomShort, `week ${sw}: snapshot disagrees with the engine`).toBe(first)
      expect(toSnapshot(world).coachRoomShort, `week ${sw}: two snapshots, two answers`).toBe(
        toSnapshot(world).coachRoomShort,
      )
    }
  })
})

describe('round 39 #2b (re-reopened) – the below-best intensity ladder, at its measured edges', () => {
  // ⚠⚠ THE TWO CUTS ARE LITERALS HERE ON PURPOSE. They are `tools/r39-decline-rotation.ts`'s
  // measured terciles over 21,196 past-peak weeks of 27 real careers (p33 = 79 places, p67 = 257),
  // and a pin that READ the constant could not fail when the constant moved – which is exactly the
  // event this arm exists to make loud. The distribution is in the ledger and in the table's header.
  const LADDER_FAR = 79
  const LADDER_WAY = 257
  const LATE = WEEKS_PER_YEAR - 1

  it('⭐⭐ both edges, from both sides – three rungs, his three phrasings', () => {
    expect(coachDeclineShort(behindBest(1, LATE))).toBe("she's below her best")
    expect(coachDeclineShort(behindBest(LADDER_FAR - 1, LATE))).toBe("she's below her best")
    expect(coachDeclineShort(behindBest(LADDER_FAR, LATE))).toBe("she's far below her best")
    expect(coachDeclineShort(behindBest(LADDER_WAY - 1, LATE))).toBe("she's far below her best")
    expect(coachDeclineShort(behindBest(LADDER_WAY, LATE))).toBe("she's way below her best")
    expect(coachDeclineShort(behindBest(738, LATE))).toBe("she's way below her best")
  })

  it('⚠ it is MONOTONE and it never skips: walked across the measured range, the rung only ever rises', () => {
    // The ladder is an ordering claim as much as a threshold one – «far» may not appear below
    // «below», and a table sorted the wrong way round would still pass a pair of edge assertions.
    const RUNGS = ["she's below her best", "she's far below her best", "she's way below her best"]
    let seen = -1
    const occurred = new Set<string>()
    for (let behind = 1; behind <= 800; behind++) {
      const said = coachDeclineShort(behindBest(behind, LATE))
      const rung = RUNGS.indexOf(said)
      expect(rung, `${behind} places said "${said}", which is not a rung of the ladder`).toBeGreaterThanOrEqual(0)
      expect(rung, `the ladder went backwards at ${behind} places`).toBeGreaterThanOrEqual(seen)
      seen = rung
      occurred.add(said)
    }
    // ...and all three really occur over the measured range, which is what the terciles bought.
    expect([...occurred].sort()).toEqual([...RUNGS].sort())
  })

  it('⚠ the ladder is the plate\'s alone – the coach card\'s long sentence still counts the places', () => {
    // The card keeps the digit («N places below her best season») and Home keeps the register. Two
    // lengths of one fact, which is the #2a/#2b split, and neither borrows the other's words.
    const world = behindBest(105, LATE)
    expect(coachDeclineNote(world)).toContain('105 places below her best season')
    expect(coachDeclineShort(world), 'a count leaked into the plate').not.toMatch(/\d/)
    expect(coachDeclineShort(world)).toBe("she's far below her best")
  })
})
