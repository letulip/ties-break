// ⭐⭐⭐ ROUND 48 #7 – «THE WHOLE RECORD»: THE SEASON CLOSE AND THE TITLES, BOTH OFF WHAT THE SAVE ALREADY HOLDS.
//
// THE OWNER, 07.10: «The whole record - там какая-то ерунда в каждом season close написана, а еще с 2036
// начиная нет никаких титулов вообще».
//
// ⚠ BOTH HALVES WERE REPRODUCED ON HIS 20-SEASON SAVE BEFORE ANY LINE WAS WRITTEN, and neither was a
// data problem – the truth was in the save the whole time:
//   7a  the Season close row printed `Milestone.rank`, which is `world.kidRank` at the wrap = the
//       INTERNATIONAL table, always. His 2044 (97-11, world #1) read «#71»; his 2035 (#3) read «#79».
//       The wrap had banked the real figures per table in `seasonHistory[].byTrack`.
//   7b  `title` / `final` milestones are FIRST-PER-TIER, so 127 titles and 30 lost finals were a
//       handful of rows, and 2036 – four titles – showed none. `trophiesByTier` has every week.
//
// ⚠ WHAT THESE ARMS HOLD, AND WHY THE SECOND ONE IS THE IMPORTANT ONE. `buildScroll` now keeps a copy of
// `dominantTrackOfSeason`'s rule that reads the BANKED row instead of the live counters (the wrap resets
// them, so nothing live survives a season). A copy is a predicate the engine also holds – the parity
// class CLAUDE.md names – so arm 7 does not trust the mirror: it walks real careers and asks the
// engine's own verdict (`lastSeasonSummary.rankTrack` / `rankInTrack`, banked by the wrap in the same
// breath as the row) at every wrap, and the scroll must agree with the card the player saw.
//
// ⭐ MUTATIONS, run one at a time in a worktree holding this file and the change (07.10), against this
// file alone. THE CONTROL FIRST: the unmutated pair is 15 of 15 green there, so a red below is the
// mutation's and nobody else's.
//   M1  season-close detail pointed back at `m.rank`                        6 RED (every 7a arm bar the nothing-banked one, which IS today's line)
//   M2  tie-break `>=` -> `>` in the dead-heat walk                         1 RED (the dead-heat arm)
//   M3  points ahead of matches in the comparator                           3 RED (matches-first, unranked, parity)
//   M4  the old walk restored (milestone Title/Final rows, no cabinet)      5 RED (every 7b arm bar the untouched-types one)
//   M5  title/final milestones walked AS WELL AS the cabinet                3 RED (no-duplicates, real careers, the 3+1 arm)
//   M6  the no-`byTrack` fallback removed                                   1 RED (the nothing-banked arm)
//   M7  the nobody-played fallback removed                                  1 RED (the nobody-played arm)
//   M8  the cabinet's finals not emitted                                    4 RED
import { describe, it, expect } from 'vitest'
import { createWorld, type WorldState } from '../src/engine/world'
import { buildScroll } from '../src/engine/world/album'
import { TIERS, OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import type { Milestone, ScrollSeason, SeasonHistoryEntry, SeasonTrackRow } from '../src/shared/protocol'
import { engineModuleSource } from './worldSource'
import { codeOf } from './helpers/source'
import { runCareer } from './radarFixtures'

// --- fixtures ------------------------------------------------------------------------------------

/** One table's season, the way the wrap banks it (`SeasonTrackRow`). `endRank` omitted = not ranked. */
function table(wins: number, losses: number, points: number, endRank?: number): SeasonTrackRow {
  return { wins, losses, points, ...(endRank === undefined ? {} : { endRank }) }
}

/** A banked season. `itfEndRank` is the bare `endRank`, the ITF one by its own documentation. */
function banked(
  seasonIndex: number,
  by: Partial<Record<'domestic' | 'itf' | 'wta', SeasonTrackRow>>,
  itfEndRank = 83,
): SeasonHistoryEntry {
  return {
    seasonIndex,
    endRank: itfEndRank,
    points: 0,
    wins: 0,
    losses: 0,
    byTrack: { domestic: table(0, 0, 0), itf: table(0, 0, 0), wta: table(0, 0, 0), ...by },
    fundsDeltaCents: 0,
    endFundsCents: 0,
  }
}

/** The wrap week of a season – where `captureMilestone` puts the `season-rank` row. */
const wrapWeek = (seasonIndex: number) => seasonIndex * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)

/** A `season-rank` milestone carrying the ITF rank the OLD scroll printed, 83 unless said otherwise –
 *  and `null` means the milestone carries no rank at all (a default of `undefined` would swallow it). */
function close(seasonIndex: number, rank: number | null = 83): Milestone {
  return { type: 'season-rank', week: wrapWeek(seasonIndex), seasonIndex, ...(rank === null ? {} : { rank }) }
}

/** A fresh world with a hand-written record: nothing is ticked, so the arms read only what they set. */
function worldWith(over: {
  milestones?: Milestone[]
  seasonHistory?: SeasonHistoryEntry[]
  titles?: Partial<Record<TierId, number[]>>
  finals?: Partial<Record<TierId, number[]>>
}): WorldState {
  const world = createWorld('r48-b2-constructed')
  world.milestones = over.milestones ?? []
  world.seasonHistory = over.seasonHistory ?? []
  for (const [tier, weeks] of Object.entries(over.titles ?? {})) world.trophiesByTier[tier as TierId].titles = weeks!
  for (const [tier, weeks] of Object.entries(over.finals ?? {})) world.trophiesByTier[tier as TierId].finals = weeks!
  return world
}

const rowsOf = (scroll: ScrollSeason[]) => scroll.flatMap((s) => s.rows)

/** What the scroll prints on a season's Season close line, or `undefined` if there is no such row. */
function closeDetail(world: WorldState, seasonIndex: number): string | null | undefined {
  const season = buildScroll(world).find((s) => s.seasonIndex === seasonIndex)
  return season?.rows.find((r) => r.label === 'Season close')?.detail
}

// --- 7a ------------------------------------------------------------------------------------------

describe('⭐⭐⭐ round 48 #7a – the season close reads the table the season was played on', () => {
  it('⭐⭐⭐ the owner\'s defect: a professional\'s 50-10 year reads her professional place, not the stale junior one', () => {
    const world = worldWith({
      milestones: [close(3, 83)],
      seasonHistory: [banked(3, { wta: table(50, 10, 900, 4), itf: table(0, 0, 0) }, 83)],
    })
    // ⚠⚠ THE ARM. Point the detail back at `m.rank` and this reads «#83» – the junior number the owner
    // called nonsense. (M1.)
    expect(closeDetail(world, 3)).toBe('#4')
  })

  it('⭐⭐ MATCHES DECIDE FIRST: the table with more matches speaks even when another table earned more points', () => {
    // itf: 40 matches, 100 points, #12. wta: 25 matches, 900 points, #300. The comparator counts matches
    // before points, so the junior table speaks. (M3.)
    const world = worldWith({
      milestones: [close(2)],
      seasonHistory: [banked(2, { itf: table(30, 10, 100, 12), wta: table(20, 5, 900, 300) })],
    })
    expect(closeDetail(world, 2)).toBe('#12')
  })

  it('⭐⭐ A DEAD HEAT ON MATCHES goes to the table with more points, and a dead heat on points to the HIGHER table', () => {
    const matchesTied = { itf: [20, 10] as const, wta: [25, 5] as const } // 30 matches each
    // more points on the lower table: the lower table stays
    expect(
      closeDetail(
        worldWith({
          milestones: [close(1)],
          seasonHistory: [banked(1, { itf: table(...matchesTied.itf, 500, 12), wta: table(...matchesTied.wta, 100, 300) })],
        }),
        1,
      ),
      '30 matches each, more points on the junior table: the junior table speaks',
    ).toBe('#12')
    // more points on the higher table: the higher table speaks
    expect(
      closeDetail(
        worldWith({
          milestones: [close(1)],
          seasonHistory: [banked(1, { itf: table(...matchesTied.itf, 100, 12), wta: table(...matchesTied.wta, 500, 300) })],
        }),
        1,
      ),
      '30 matches each, more points on the professional table',
    ).toBe('#300')
    // dead heat on both: `LADDER_TRACKS` is lowest-first and the tie-break is `>=`, so the higher table wins (M2)
    expect(
      closeDetail(
        worldWith({
          milestones: [close(1)],
          seasonHistory: [banked(1, { itf: table(...matchesTied.itf, 300, 12), wta: table(...matchesTied.wta, 300, 300) })],
        }),
        1,
      ),
      'a dead heat on matches AND points: the higher table',
    ).toBe('#300')
    expect(
      closeDetail(
        worldWith({
          milestones: [close(1)],
          seasonHistory: [
            banked(1, { domestic: table(15, 15, 300, 7), itf: table(20, 10, 300, 12) }),
          ],
        }),
        1,
      ),
      'the same rule one rung down: itf over domestic',
    ).toBe('#12')
  })

  it('⭐⭐ an UNRANKED dominant table prints nothing – it never borrows another table\'s number', () => {
    // wta: 60 matches and no counting result (no endRank); itf: 10 matches and #12. The season was a
    // professional one, so the cell is silent. «Unranked is not a number.»
    const world = worldWith({
      milestones: [close(4)],
      seasonHistory: [banked(4, { wta: table(40, 20, 0), itf: table(5, 5, 60, 12) })],
    })
    expect(closeDetail(world, 4)).toBeNull()
  })

  it('⭐⭐ WHEN NOTHING IS BANKED THE LINE IS TODAY\'S – a season past the cap, a milestone with no season, a pre-v46 row', () => {
    // (a) the season is not in `seasonHistory` at all (it fell out of SEASON_HISTORY_CAP)
    expect(
      closeDetail(worldWith({ milestones: [close(0)], seasonHistory: [banked(7, { wta: table(50, 10, 900, 4) })] }), 0),
      'season absent from the history',
    ).toBe('#83')
    // (b) a migrated milestone that carries no season index cannot be matched to a row
    const noIndex: Milestone = { type: 'season-rank', week: wrapWeek(2), rank: 83 }
    expect(
      closeDetail(worldWith({ milestones: [noIndex], seasonHistory: [banked(2, { wta: table(50, 10, 900, 4) })] }), 2),
      'milestone without seasonIndex',
    ).toBe('#83')
    // (c) a row banked before v46 has no `byTrack`, and none can be recovered (the migration back-filled nothing)
    const preV46: SeasonHistoryEntry = { ...banked(2, {}), byTrack: undefined }
    expect(closeDetail(worldWith({ milestones: [close(2)], seasonHistory: [preV46] }), 2), 'row without byTrack').toBe(
      '#83',
    )
    // (d) and with no rank on the milestone either, there is nothing to say
    expect(closeDetail(worldWith({ milestones: [close(5, null)], seasonHistory: [] }), 5)).toBeNull()
  })

  it('⭐ NOBODY PLAYED: the highest table she held a rank in speaks – the banked twin of `activeLadderOf` – and no rank at all is silence', () => {
    const noMatches = { domestic: table(0, 0, 0), itf: table(0, 0, 0, 40), wta: table(0, 0, 0, 650) }
    expect(closeDetail(worldWith({ milestones: [close(6)], seasonHistory: [banked(6, noMatches)] }), 6)).toBe('#650')
    expect(
      closeDetail(worldWith({ milestones: [close(6)], seasonHistory: [banked(6, { ...noMatches, wta: table(0, 0, 0) })] }), 6),
      'only the junior table ranked',
    ).toBe('#40')
    expect(
      closeDetail(
        worldWith({ milestones: [close(6)], seasonHistory: [banked(6, { itf: table(0, 0, 0), wta: table(0, 0, 0) })] }),
        6,
      ),
      'unranked everywhere: the card says «Unranked» and so does this',
    ).toBeNull()
  })

  it(
    '⭐⭐⭐ PARITY ON REAL WRAPS: at every wrap of two walked careers the scroll agrees with the table and rank the season card named',
    () => {
      let sawCardDifferFromMilestone = 0
      let sawTableOtherThanItf = 0
      let wraps = 0
      for (const seed of ['r48-b2-a', 'r48-b2-b']) {
        const cards = new Map<number, { rankTrack: string | undefined; rankInTrack: number | null | undefined }>()
        let seen = 0
        const world = runCareer(seed, 'middle', 260, (w) => {
          if (w.seasonHistory.length > seen) {
            seen = w.seasonHistory.length
            const row = w.seasonHistory[w.seasonHistory.length - 1]
            cards.set(row.seasonIndex, {
              rankTrack: w.lastSeasonSummary?.rankTrack,
              rankInTrack: w.lastSeasonSummary?.rankInTrack,
            })
          }
        })
        expect(cards.size, `${seed}: the career wrapped five seasons`).toBeGreaterThanOrEqual(4)
        for (const [seasonIndex, card] of cards) {
          const expected = card.rankInTrack == null ? null : `#${card.rankInTrack}`
          expect(closeDetail(world, seasonIndex), `${seed} season ${seasonIndex}: card named ${card.rankTrack}`).toBe(expected)
          wraps++
          const milestone = world.milestones.find((m) => m.type === 'season-rank' && m.seasonIndex === seasonIndex)!
          if (milestone.rank !== card.rankInTrack) sawCardDifferFromMilestone++
          if (card.rankTrack !== 'itf') sawTableOtherThanItf++
        }
      }
      // ⚠ NON-VACUITY, and it is part of the claim: the arm only means something over wraps where the OLD
      // line (`m.rank`) and the card disagreed, and where the card's table was not the junior one.
      expect(wraps).toBeGreaterThanOrEqual(8)
      expect(sawCardDifferFromMilestone, 'wraps where the old line was wrong').toBeGreaterThanOrEqual(3)
      expect(sawTableOtherThanItf, 'wraps on a table other than the junior one').toBeGreaterThanOrEqual(3)
    },
    120_000,
  )
})

// --- 7b ------------------------------------------------------------------------------------------

/** THE OLD WALK, kept here as the red control: every `title` / `final` MILESTONE a row, nothing from the
 *  cabinet. It is not the code under test – it is what the scroll used to print, so an arm that cannot tell
 *  it from the new scroll is not measuring the change. */
function oldTitleFinalRows(world: WorldState): { label: string; week: number }[] {
  return world.milestones
    .filter((m) => m.type === 'title' || m.type === 'final')
    .map((m) => ({ label: m.type === 'title' ? 'Title' : 'Final', week: m.week }))
}

describe('⭐⭐⭐ round 48 #7b – Title and Final rows come from the cabinet, every week of it', () => {
  it('⭐⭐⭐ three titles and a final across two seasons, only one of them a first-per-tier milestone: all four print, sorted', () => {
    const world = worldWith({
      // the ONLY milestone: the first local title – exactly what `finalizeTournament` captured
      milestones: [{ type: 'title', week: 29, tier: 'local' }],
      titles: { local: [29, 60], regional: [70] },
      finals: { local: [66] },
    })
    // THE RED CONTROL: the old walk sees one row of the four. (M4.)
    expect(oldTitleFinalRows(world)).toEqual([{ label: 'Title', week: 29 }])

    const scroll = buildScroll(world)
    expect(scroll.map((s) => s.seasonIndex)).toEqual([0, 1])
    expect(scroll[0].rows).toEqual([{ week: 29, label: 'Title', detail: TIERS.local.label }])
    expect(scroll[1].rows).toEqual([
      { week: 60, label: 'Title', detail: TIERS.local.label },
      { week: 66, label: 'Final', detail: TIERS.local.label },
      { week: 70, label: 'Title', detail: TIERS.regional.label },
    ])
    expect(rowsOf(scroll).filter((r) => r.label === 'Title')).toHaveLength(3)
    expect(rowsOf(scroll).filter((r) => r.label === 'Final')).toHaveLength(1)
  })

  it('⭐⭐ a season whose only record is a cabinet week still gets its page – the rows are unified BEFORE they are grouped', () => {
    // no milestone anywhere, one title in season 1
    const lone = worldWith({ titles: { national: [60] } })
    const scroll = buildScroll(lone)
    expect(scroll).toHaveLength(1)
    expect(scroll[0].seasonIndex).toBe(1)
    expect(scroll[0].rows).toEqual([{ week: 60, label: 'Title', detail: TIERS.national.label }])
    // the page header is the same one a milestone would have made
    const withMilestone = worldWith({ milestones: [{ type: 'prize', week: 60, tier: 'local' }] })
    const reference = buildScroll(withMilestone)[0]
    expect({ year: scroll[0].year, ageYears: scroll[0].ageYears }).toEqual({
      year: reference.year,
      ageYears: reference.ageYears,
    })
  })

  it('⭐⭐ NOTHING PRINTS TWICE: a first-per-tier milestone and its cabinet week are one row, and a title week carries no Final row', () => {
    // `finalizeTournament` captures a `final` milestone for `kidFinish <= 1`, a title week included; the
    // cabinet's `finals` are LOST finals. So week 29 is a Title and nothing else. (M5.)
    const world = worldWith({
      milestones: [
        { type: 'title', week: 29, tier: 'local' },
        { type: 'final', week: 29, tier: 'local' },
        { type: 'final', week: 40, tier: 'regional' },
      ],
      titles: { local: [29] },
      finals: { regional: [40] },
    })
    const rows = rowsOf(buildScroll(world))
    expect(rows.filter((r) => r.week === 29)).toEqual([{ week: 29, label: 'Title', detail: TIERS.local.label }])
    expect(rows.filter((r) => r.week === 40)).toEqual([{ week: 40, label: 'Final', detail: TIERS.regional.label }])
    expect(rows).toHaveLength(2)
  })

  it('⭐⭐ A WEEK ORDERS BY WEEK, NOT BY TIER: rows from different tiers interleave, and a first cheque stays ahead of the title it led to', () => {
    const world = worldWith({
      milestones: [{ type: 'prize', week: 30, tier: 'regional' }],
      titles: { regional: [30, 51], local: [12, 44] },
      finals: { national: [20] },
    })
    const scroll = buildScroll(world)
    expect(scroll.map((s) => s.rows.map((r) => `${r.week}:${r.label}`))).toEqual([
      ['12:Title', '20:Final', '30:First prize money', '30:Title', '44:Title', '51:Title'],
    ])
  })

  it('⭐⭐ EVERY OTHER MILESTONE TYPE IS UNTOUCHED – label and detail, row for row', () => {
    const world = worldWith({
      milestones: [
        { type: 'prize', week: 5, tier: 'local' },
        { type: 'international', week: 8, tier: 'j30' },
        { type: 'injury', week: 9, kind: 'ankle soreness' },
        { type: 'break-even', week: 10, kind: 'week' },
        { type: 'break-even', week: 11, kind: 'career' },
        { type: 'school', week: 12 },
        { type: 'wedding', week: 13, kind: 'episode-1' },
        { type: 'birth', week: 14 },
        { type: 'divorce', week: 15, kind: 'episode-1' },
      ],
    })
    expect(rowsOf(buildScroll(world))).toEqual([
      { week: 5, label: 'First prize money', detail: TIERS.local.label },
      { week: 8, label: 'First trip abroad', detail: TIERS.j30.label },
      { week: 9, label: 'First injury', detail: 'ankle soreness' },
      { week: 10, label: 'The money turned', detail: 'one week of it' },
      { week: 11, label: 'The money turned', detail: 'the whole of it' },
      { week: 12, label: 'School behind her', detail: 'the last school year is over' },
      { week: 13, label: 'Her wedding', detail: null },
      { week: 14, label: 'Her daughter', detail: null },
      { week: 15, label: 'The marriage ended', detail: null },
    ])
  })

  it('⭐⭐⭐ NOTHING IS LOST ON REAL CAREERS: every title/final milestone is a cabinet week, the counts match, and the UI keys are unique', () => {
    let milestoneTitles = 0
    let milestoneFinals = 0
    for (const seed of ['r48-b2-a', 'r48-b2-b']) {
      const world = runCareer(seed, 'middle', 260)
      for (const m of world.milestones) {
        const cabinet = world.trophiesByTier[m.tier ?? 'local']
        if (m.type === 'title') {
          milestoneTitles++
          expect(cabinet.titles, `${seed}: title milestone ${m.tier}@${m.week} is a cabinet title`).toContain(m.week)
        }
        if (m.type === 'final') {
          milestoneFinals++
          // a final milestone is a lost final OR a title week – `kidFinish <= 1`
          expect(
            [...cabinet.titles, ...cabinet.finals],
            `${seed}: final milestone ${m.tier}@${m.week} is a cabinet week`,
          ).toContain(m.week)
        }
      }
      const rows = rowsOf(buildScroll(world))
      const cabinetTitles = Object.values(world.trophiesByTier).reduce((n, t) => n + t.titles.length, 0)
      const cabinetFinals = Object.values(world.trophiesByTier).reduce((n, t) => n + t.finals.length, 0)
      expect(rows.filter((r) => r.label === 'Title'), `${seed}: one Title row per cabinet title`).toHaveLength(cabinetTitles)
      expect(rows.filter((r) => r.label === 'Final'), `${seed}: one Final row per lost final`).toHaveLength(cabinetFinals)
      const keys = rows.map((r) => `${r.week}-${r.label}`)
      expect(new Set(keys).size, `${seed}: EndingScreen keys rows on week-label`).toBe(keys.length)
    }
    // ⚠ NON-VACUITY: the careers this walks must hold milestones of both kinds and a cabinet that outgrew them
    expect(milestoneTitles).toBeGreaterThanOrEqual(4)
    expect(milestoneFinals).toBeGreaterThanOrEqual(4)
  }, 120_000)
})

// --- the read stays a read -------------------------------------------------------------------------

describe('⭐⭐ round 48 #7 – the scroll is a pure read: no draw, no write', () => {
  it('builds the same scroll twice and leaves the world byte-identical', () => {
    const world = runCareer('r48-b2-b', 'middle', 200)
    const before = JSON.stringify(world)
    const first = buildScroll(world)
    const second = buildScroll(world)
    expect(second).toEqual(first)
    expect(JSON.stringify(world), 'buildScroll wrote to the world').toBe(before)
    expect(buildScroll.length, 'it takes the world and nothing else – no stream to draw from').toBe(1)
  }, 60_000)

  it('names no random source anywhere in album.ts', () => {
    // The whole file, comments stripped: its header says «RNG: nothing here draws» and this is that sentence as a gate.
    const code = codeOf(engineModuleSource('world/album'))
    expect(code).not.toMatch(/\brng\w*\b|rngFromSeed|resumeMain|Math\.random|new Date|Date\.now/i)
  })
})
