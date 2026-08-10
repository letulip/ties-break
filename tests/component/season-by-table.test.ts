// ROUND 14, GROUP E - the two things the owner asked for twice, MOUNTED.
//
//   1. «Season by season в stats в разных вкладках всё ещё одно и то же показывает» (09.08, and once
//      before). The table now follows the ladder picker, because v46 gave a finished season a row per
//      table (`SeasonHistoryEntry.byTrack`). It could not have been fixed on the screen: before v46 the
//      record held one rank and three folds, so the three tabs had nothing to differ by.
//   2. «я просил возраста девочек добавить в stats доп колонкой и в турнирах перед матчем тоже можно
//      показывать» (06.08 item 12, again 09.08). A column in the standings, and both girls' ages on
//      the tournament card.
//
// ⚠ WHY MOUNTED AND NOT PINNED. Every claim here is about what the player SEES after pressing
// something. "The file contains byTrack" would have passed on the day the bug was reported - the
// screen was reading a record that had nothing else in it - and a source pin cannot tell a table that
// changes with the picker from one that does not, which is the entire defect.
//
// ⚠ THE FIXTURE IS THE v46 GOLDEN SAVE, ON PURPOSE. It is a REAL career (the migration's own output on
// v45.json, walked through one more wrap-up), so it carries all three cases at once and none of them
// is hand-written: two seasons banked BEFORE v46 with no per-track figures, one banked after with all
// three tables non-zero - including a professional row that has points and NO rank, because
// `rankableTotal` refuses a W ranking until the tour's minimum activity is met. That last one is
// exactly the row a zero would have lied about.
//
// ⚠ MUTATION-VERIFIED. Every `it` below was watched failing before it was believed:
//   * `cellsFor` returning `r.byTrack?.domestic` whatever the track -> "the three tabs disagree" goes
//     red on the international points.
//   * the legacy arm's `track === 'itf' ? r.endRank : null` changed to a bare `r.endRank` -> "an old
//     season shows no rank outside International" goes red: the fixture's junior #76 appears under
//     National and Professional, which is the false claim this whole branch exists to refuse.
//   * the same arm changed to a bare `null` -> "an old season keeps its international rank" goes red,
//     so the two halves of the rule are pinned separately and neither can be dropped quietly.
//   * `split.endRank ?? null` changed to `split.endRank ?? 0` -> "a table she was never ranked in
//     prints a dash" goes red on '#0'.
//   * the `sh-fold` star dropped from the points cell -> the marker test goes red.
//   * `anyLegacy` pinned to false -> the footnote test goes red.
//   * `ageYears` dropped from `computeStandings`' `enrich` -> the age-column test goes red on every
//     row printing a dash.
//   * `meta.set(KID_ID, ...)` given `ageAtWeek(world.week)` instead of `kidAgeAt` -> the one-clock
//     test goes red on a December career (band 14 against her own 13).
//   * `showAges` pinned to false -> the VS-panel test goes red ("expected ... to contain 'Age 13'").
//   * `opponent.ageYears` fed off `world.cohort` rather than the frozen player, one season on
//     (`ageYears + 1`) -> the "her age at the match" test goes red with "expected 17 to be 16", which
//     is precisely the drift the frozen field exists to prevent.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// The tournament overlay plays cues on mount; the audio module has no business in a table test.
vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import StatsScreen from '../../src/components/screens/StatsScreen.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, enterEvent, tickWeek, toSnapshot, KID_ID, type WorldState } from '../../src/engine/world'
import { migrateSave } from '../../src/engine/migrations'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, LADDER_TRACKS, type Snapshot } from '../../src/shared/protocol'

/** The v46 golden save, migrated and snapshotted - a real career, not a hand-written record. */
function goldenSnapshot(): Snapshot {
  const world = migrateSave(
    JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8')),
  ) as WorldState
  return toSnapshot(world)
}

function mountStats(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  return mount(StatsScreen, { global: { stubs: { teleport: true } } })
}

/** The season-by-season table's cells, as text, one string per row. */
function historyRows(wrapper: ReturnType<typeof mountStats>): string[] {
  const table = wrapper.findAll('table').find((t) => (t.attributes('aria-label') ?? '').startsWith('Season by season'))
  expect(table, 'the season-by-season table must be findable BY NAME (D8)').toBeTruthy()
  return table!.findAll('tbody tr').map((tr) => tr.findAll('th, td').map((c) => c.text().trim()).join(' | '))
}

/** Press one of the three ladder pills. */
async function showTrack(wrapper: ReturnType<typeof mountStats>, label: string): Promise<void> {
  const button = wrapper.findAll('button').find((b) => b.text().trim() === label)
  expect(button, `the ${label} pill must exist`).toBeTruthy()
  await button!.trigger('click')
}

describe('R14-E - season by season answers to the tab (v46)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⚠ THE OWNER\'S REPORT: the three tabs no longer show the same figures', async () => {
    const snap = goldenSnapshot()
    // The fixture's newest season is the one banked on v46 - the only row that CAN differ per table.
    const banked = snap.seasonHistory.find((h) => h.byTrack)!
    expect(banked, 'the fixture must carry a v46 row').toBeTruthy()
    const seen: string[] = []
    const wrapper = mountStats(snap)
    for (const label of ['National', 'International', 'Professional']) {
      await showTrack(wrapper, label)
      seen.push(historyRows(wrapper)[0])
    }
    expect(new Set(seen).size, `all three tabs printed: ${seen.join(' /// ')}`).toBe(3)
    // ...and each one prints ITS OWN table's points, not the fold and not another table's.
    expect(seen[0]).toContain(String(banked.byTrack!.domestic.points))
    expect(seen[1]).toContain(String(banked.byTrack!.itf.points))
    expect(seen[2]).toContain(String(banked.byTrack!.wta.points))
  })

  it('a table she was never ranked in prints a dash, never #0 and never the tie floor', async () => {
    const snap = goldenSnapshot()
    const banked = snap.seasonHistory.find((h) => h.byTrack)!
    // The fixture's professional row has points and no rank - she scored on the paid tour but the
    // WTA's minimum-activity rule leaves her unranked. Absent must read as silence.
    expect(banked.byTrack!.wta.endRank).toBeUndefined()
    expect(banked.byTrack!.wta.points).toBeGreaterThan(0)
    const wrapper = mountStats(snap)
    await showTrack(wrapper, 'Professional')
    const row = historyRows(wrapper)[0]
    expect(row).toContain('–')
    expect(row).not.toContain('#0')
  })

  it('an old season keeps its international rank - that number always WAS the ITF one', async () => {
    const snap = goldenSnapshot()
    const legacy = snap.seasonHistory.find((h) => !h.byTrack)!
    const wrapper = mountStats(snap)
    await showTrack(wrapper, 'International')
    const rows = historyRows(wrapper)
    expect(rows.some((r) => r.includes(`#${legacy.endRank}`))).toBe(true)
  })

  it('⚠ ...and shows NO rank on the other two tabs, because the one it has is another table\'s', async () => {
    const snap = goldenSnapshot()
    const legacy = snap.seasonHistory.filter((h) => !h.byTrack)
    expect(legacy.length).toBeGreaterThan(0)
    const wrapper = mountStats(snap)
    for (const label of ['National', 'Professional']) {
      await showTrack(wrapper, label)
      const rows = historyRows(wrapper)
      for (const h of legacy) {
        expect(rows.some((r) => r.includes(`#${h.endRank}`)), `${label} printed a junior rank`).toBe(false)
      }
    }
  })

  it('an old season\'s points and W-L are MARKED as the fold they are, and the footnote says why', async () => {
    const snap = goldenSnapshot()
    const legacy = snap.seasonHistory.find((h) => !h.byTrack)!
    const wrapper = mountStats(snap)
    await showTrack(wrapper, 'National')
    const rows = historyRows(wrapper)
    const row = rows.find((r) => r.includes(`${legacy.points}*`))
    expect(row, `no starred fold in: ${rows.join(' /// ')}`).toBeTruthy()
    expect(row).toContain(`${legacy.wins}–${legacy.losses}*`)
    expect(wrapper.text()).toContain('kept one set of figures for all three tables')
  })

  it('a career with nothing but v46 seasons is never told about the star', async () => {
    const snap = goldenSnapshot()
    snap.seasonHistory = snap.seasonHistory.filter((h) => h.byTrack)
    const wrapper = mountStats(snap)
    expect(wrapper.text()).not.toContain('kept one set of figures for all three tables')
    expect(historyRows(wrapper).join(' ')).not.toContain('*')
  })

  it('D8: EVERY table on this screen answers to a name, and the name says which table', async () => {
    const snap = goldenSnapshot()
    const wrapper = mountStats(snap)
    const named = () => wrapper.findAll('table').map((t) => t.attributes('aria-label') ?? '')
    expect(named().length, 'the fixture must render more than one table').toBeGreaterThan(1)
    expect(named().every(Boolean), `unnamed table among: ${named().join(' /// ')}`).toBe(true)
    // The names FOLLOW the picker, which is the whole point: three tables render through one element,
    // so a fixed name would tell a reader arriving by role the wrong one.
    for (const label of ['National', 'International', 'Professional']) {
      await showTrack(wrapper, label)
      expect(named()).toContain(`${label} ranking`)
      expect(named().some((n) => n.startsWith('Season by season'))).toBe(true)
    }
  })
})

describe('R14-E - the standings say how old the girls are', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('every ranked girl carries her own age, and the column is really rendered', () => {
    const snap = goldenSnapshot()
    const wrapper = mountStats(snap)
    const table = wrapper.findAll('table').find((t) => (t.attributes('aria-label') ?? '').endsWith('ranking'))!
    expect(table.findAll('thead th').map((h) => h.text())).toEqual(['#', 'Player', 'Age', 'Pts'])
    const rows = table.findAll('tbody tr').filter((tr) => !tr.classes('standings-gap'))
    expect(rows.length).toBeGreaterThan(3)
    const shown = snap.ladders[snap.activeLadder].standings
    for (const [i, tr] of rows.entries()) {
      const age = tr.findAll('td')[2].text()
      // A real age, never a zero and never a band-shaped constant shared by the whole field.
      expect(age, `row ${i} printed "${age}"`).toMatch(/^\d+$/)
      expect(Number(age)).toBe(shown[i].ageYears)
    }
    expect(new Set(rows.map((tr) => tr.findAll('td')[2].text())).size).toBeGreaterThan(1)
  })

  it('⚠ HERS IS THE ONE CLOCK: a December girl reads 13 in a January her rivals read 14 in', () => {
    // The 09.08 ruling. `ageAtWeek` (the band, and the coach market's restocking clock) would have
    // printed 14 for both, which is the two-ages bug that had Home and her own birthday note fifty
    // weeks apart.
    const december = toSnapshot(createWorld('r14e-dec', { ...DEFAULT_PROFILE, birthMonth: 12 }))
    const january = toSnapshot(createWorld('r14e-jan', { ...DEFAULT_PROFILE, birthMonth: 1 }))
    const kidAgeOn = (snap: Snapshot): number | undefined =>
      snap.ladders[snap.activeLadder].standings.find((r) => r.isKid)?.ageYears
    expect(kidAgeOn(december)).toBe(13)
    expect(kidAgeOn(january)).toBe(14)
    expect(kidAgeOn(december)).toBe(december.ageYears)
  })

  it('every table gets the column, including the professional one', () => {
    const snap = goldenSnapshot()
    for (const track of LADDER_TRACKS) {
      const rows = snap.ladders[track].standings
      if (!rows.length) continue
      expect(rows.every((r) => typeof r.ageYears === 'number' && r.ageYears > 0), track).toBe(true)
    }
  })
})

describe('R14-E - the tournament card introduces two girls with ages', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** A real career paused on a reveal, so `pending` is the engine's own view. */
  function pendingSnapshot(seed: string): Snapshot {
    const world = createWorld(seed, { ...DEFAULT_PROFILE })
    world.fundsCents = 500_000_00
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 60 && !world.pendingTournament; i++) {
      for (const e of world.season) {
        if (e.week > world.week && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* gated - fine */
          }
        }
      }
      tickWeek(world, rng)
    }
    expect(world.pendingTournament, 'the career must reach a reveal').toBeTruthy()
    return toSnapshot(world)
  }

  it('the VS panel prints both ages, hers and her opponent\'s', () => {
    const snap = pendingSnapshot('r14e-vs')
    expect(snap.pending!.opponent.ageYears).not.toBeNull()
    const store = useGameStore()
    store.snapshot = snap
    const wrapper = mount(TournamentFlow, { global: { stubs: { teleport: true } } })
    const text = wrapper.text()
    expect(text).toContain(`Age ${snap.ageYears}`)
    expect(text).toContain(`Age ${snap.pending!.opponent.ageYears}`)
    expect((text.match(/Age \d+/g) ?? []).length, 'both sides or neither').toBe(2)
  })

  it('⚠ the opponent\'s age is the one she played at, frozen with the match', () => {
    // `MatchPlayer.age` is composed when the bracket is built and stored with it, which is why a box
    // score re-read three seasons later still reports the girl who played. Reading today's cohort row
    // instead would silently re-age her at every season boundary - the same defect the field exists
    // to prevent for her serve.
    const snap = pendingSnapshot('r14e-frozen')
    const pending = snap.pending!
    const frozen = [pending.kidMatch!.a, pending.kidMatch!.b].find((p) => p.id !== KID_ID)!
    expect(frozen.age, 'the composed rival carries an age').toBeGreaterThan(0)
    expect(pending.opponent.ageYears).toBe(Math.floor(frozen.age!))
  })
})
