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
} from '../src/engine/world/coachMarket'
import { createWorld } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
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

/** A career past its peak – r38-decline-voice's fixture shape, ranks under the test's own hand. */
function pastPeakWorld(opts: { seasons: SeasonHistoryEntry[]; share?: number; ageYears?: number }): WorldState {
  const world = createWorld('r39-short-peak', { ...DEFAULT_PROFILE, coachTier: 'middle' })
  const years = opts.ageYears ?? 35
  world.week = Math.round((years - 14) * 52)
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

describe('round 39 #2b – the decline short is the seasons clause, and nothing else survives on Home', () => {
  it('⭐⭐ THE RULING: all three of wave A\'s worlds now read «Past her peak – about N seasons left»', () => {
    // The three fixtures that used to pick three different arms – fell on the year, below her best,
    // sitting on her best. The LONG note keeps its three arms on the coach card; the short says the
    // one clause the owner kept, in his own words, on every one of them.
    const fell = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)] })
    const belowBest = pastPeakWorld({ seasons: [season(16, 20), season(20, 125)] })
    const atBest = pastPeakWorld({ seasons: [season(20, 30)] })
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
    const tail = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)], share: COACH_BODY_END_SHARE + 0.005 })
    expect(coachDeclineShort(tail)).toBe('Past her peak – about 1 season left')
    expect(coachDeclineShort(tail)).not.toContain('1 seasons')
    // ...and the plural form on a body with more in it, so the singular is a branch, not the rule.
    expect(coachDeclineShort(pastPeakWorld({ seasons: [season(20, 30)] }))).toMatch(/about \d+ seasons left$/)
  })
})

describe('round 39 #2b – exactly one read, and the empty string where the engine says nothing', () => {
  it('⭐ the fallthrough mirrors the long note\'s own: declining → seasons read, growing → band short', () => {
    const declining = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)] })
    // Past the peak, both shorts are the same string – `coachRoomShort` IS the decline read there,
    // exactly as `coachRoomNote` is `coachDeclineNote` (the round 38 #7b fallthrough, mirrored).
    expect(coachDeclineShort(declining)).not.toBe('')
    expect(coachRoomShort(declining)).toBe(coachDeclineShort(declining))
    expect(coachRoomNote(declining)).toBe(coachDeclineNote(declining))
    // ⚠ and the band half is really unreachable there: no band short survives in the string even
    // though her realisation still resolves to a band index.
    expect(coachRoomShort(declining).startsWith('Past her peak')).toBe(true)
    for (const [band] of BAND_POINTS) {
      expect(coachRoomShort(declining)).not.toContain(coachRoomBandShort(band))
    }
    // Growing: the decline half is '' (the round-38 gate) and the plate string is the band's short.
    const growing = worldAt(0.5)
    expect(coachDeclineShort(growing)).toBe('')
    expect(coachRoomShort(growing)).toBe(coachRoomBandShort(1))
    expect(coachRoomShort(growing)).not.toContain('Past her peak')
  })

  it('⚠ the two halves partition every world: «Past her peak» in the short iff the decline gate is open', () => {
    const worlds: [string, WorldState][] = [
      ['band 0', worldAt(0.2)],
      ['band 3', worldAt(0.95)],
      ['fell', pastPeakWorld({ seasons: [season(19, 68), season(20, 125)] })],
      ['at best', pastPeakWorld({ seasons: [season(20, 30)] })],
      ['fresh world', createWorld('r39-short-fresh', DEFAULT_PROFILE)],
    ]
    for (const [name, world] of worlds) {
      const short = coachRoomShort(world)
      expect(short, name).not.toBe('')
      expect(short.startsWith('Past her peak'), `${name}: the two halves overlap or invert`).toBe(coachDeclineNote(world) !== '')
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
