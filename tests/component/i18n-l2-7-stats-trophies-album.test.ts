// L2-7 – THE NET UNDER RU-07: THE RANKING TABLES, THE SEASON STATISTICS AND THE COUNTING RESULTS (commit 1) – then the trophy cabinet and the album's chrome (commit 2).
// docs/specs/i18n-2026-10.md §8, docs/localization/ru-stats-trophies-album-2026-10.md.
//
// Six questions, asked of the REAL screens mounted and of the REAL catalog (the L2-3 … L2-6 nets' shape):
//   1. PARITY. With no catalog the English renders as it shipped – the wiring changed no word (invariant 4). The existing stats / trophy / album pin
//      families (through `tTransparent` where they assert a spelling) and the whole mounted project are the wide net; what is here are the anchors for the
//      new seams – the three projections of a table's name, the three banked sentences, the singular and the plural of the drop line.
//   2. COMPLETENESS. Every CERTAIN string of the batch files is a WIRED key, and every site this wave says it wired really calls `t()` in its own file.
//   3. THE SEAMS. The tables of words are getters (they keep their type and read the catalog when READ); the computed rows follow the locale.
//   4. THE CONTEXT TAGS. Every tag this wave added is a wired key, renders the bare English, and the mounted sites ask for the TAGGED key.
//   5. THE RUSSIAN SMOKE. The REAL `src/i18n/ru.json` is installed and the locale flipped. ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE – every
//      expectation is READ from ru.json by key. As of this wave no RU-07 row is APPROVED, so the unapproved arm is the one that bites today.
//   6. THE `xx` SWEEP. No unbracketed text where a string is wired, and the tightest surfaces still hold a 375x667 phone with every word longer.
//      The numbers print.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import '../../src/style.css'

import StatsScreen from '../../src/components/screens/StatsScreen.vue'
import SeasonHistoryTable from '../../src/components/SeasonHistoryTable.vue'
import CountingResultsTable from '../../src/components/CountingResultsTable.vue'
import { useGameStore } from '../../src/stores/game'
import { toSnapshot, type WorldState } from '../../src/engine/world'
import { migrateSave } from '../../src/engine/migrations'
import { TIERS, TIER_SHORT } from '../../src/engine/season/calendar'
import { BEST_N_BY_TRACK, RANKABLE_MIN } from '../../src/engine/season/ranking'
import { finishPhrase } from '../../src/composables/tierState'
import { LADDER_LABEL, LADDER_TRACKS, type Snapshot } from '../../src/shared/protocol'
import { formatShortName } from '../../src/shared/format'
import type { LadderTrack } from '../../src/engine/season/types'
import { installCatalog, missCount, missedKeys, resetI18nForTests, resetMisses, setLocale, t } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { PHONE, availableWidth, demandedWidth, setViewport } from './fits'
import { DEFAULT_ALLOW, hardcodeLeaks, installPseudoLocale } from './pseudoloc'

/** His approved Russian, as the importer compiled it. Every Russian expectation below is read from here by key. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const CATALOG = JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as { keys: Record<string, { home: string[]; wrapped?: true }> }
const SRC = (path: string): string => readFileSync(path, 'utf8')

/** The v46 golden save, migrated and snapshotted – a REAL career (round 37's fixture). Measured: she is 16, her active table is the professional one
 *  (rank null, 6 points BANKED), all three tables hold counting results, and the season history holds two pre-v46 folded rows and one split row. */
function goldenSnapshot(): Snapshot {
  const world = migrateSave(JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8'))) as WorldState
  return toSnapshot(world)
}
let golden: Snapshot

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  golden ??= goldenSnapshot()
  Element.prototype.scrollIntoView = function () {}
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

// --- the mounts ------------------------------------------------------------------------------------------------

type Deep = Record<string, unknown>
const patched = (snap: Snapshot, over: Deep): Snapshot => ({ ...snap, ...over }) as unknown as Snapshot
/** The golden career with one table's view patched (its rank, points, banked fact, counting list). */
function withLadder(snap: Snapshot, track: LadderTrack, over: Deep): Snapshot {
  return patched(snap, { ladders: { ...snap.ladders, [track]: { ...snap.ladders[track], ...over } } })
}

function mountStats(snapshot: Snapshot = golden): VueWrapper {
  setViewport(PHONE)
  useGameStore().snapshot = snapshot
  return mount(StatsScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
}
const PICKER = '[role="group"][aria-label="Which ranking table"]'
async function showTrack(w: VueWrapper, track: LadderTrack): Promise<void> {
  // by the row's own class, not its accessible name: under `xx` and in Russian the name is a translated sentence
  const button = w.get('.stats-ladder-row').findAll('button')[LADDER_TRACKS.indexOf(track)]
  expect(button, `the ${track} pill`).toBeTruthy()
  await button!.trigger('click')
}

/** Every player-visible string under `root`: text nodes and the four copy attributes, in one string – for «is this word on screen». */
function seen(root: Element): string {
  const parts: string[] = [root.textContent ?? '']
  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const a of ['title', 'aria-label', 'placeholder', 'alt']) {
      const v = el.getAttribute(a)
      if (v) parts.push(v)
    }
  }
  return parts.join('\n')
}
const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()
const LABEL: Record<LadderTrack, string> = LADDER_LABEL

// --- 1. parity -------------------------------------------------------------------------------------------------

describe('L2-7 parity – the stats screen as it shipped, with no catalog', () => {
  it('the frame on the golden career (the professional table, 6 points banked): heading, picker and its tooltips, tiles, strip, no-exchange line', () => {
    const w = mountStats()
    expect(w.findAll('h2').map((n) => n.text())).toEqual(['Stats', 'Season by season', 'Professional ranking', 'Counting results'])
    const picker = w.get(PICKER)
    expect(picker.findAll('button').map((n) => n.text().trim())).toEqual(['National', 'International', 'Professional'])
    const tips = [
      'Local, Regional and National results. These are the points that open her next tier.',
      'Junior Tour results only. A national title is worth nothing here – the two tables never meet.',
      'W15 and up – the paid tour. Junior points never cross over.',
    ]
    expect(picker.findAll('button').map((n) => n.attributes('title') ?? n.attributes('aria-label'))).toEqual(tips)
    expect(w.findAll('.stats-tile-label').map((n) => n.text())).toEqual(['Professional rank', 'Points', 'Professional W–L'])
    expect(w.findAll('.stats-tile-value').map((n) => n.text())).toEqual(['Unranked', '0', '0–0'])
    expect(w.findAll('.stats-jump button').map((n) => n.text())).toEqual(['Season by season', 'Professional ranking', 'Counting results'])
    expect(w.get('.stats-jump').attributes('aria-label')).toBe('Stats')
    expect(w.get('.stats-no-exchange').text()).toBe('Professional points only. Junior and national results do not count here.')
    expect(flat(w.get('.stats-banked').text())).toBe(
      `6 pts banked. A professional ranking needs ${RANKABLE_MIN.tournaments} events with points, or ${RANKABLE_MIN.points} points – until then the table shows nothing, and every result below still counts towards it.`,
    )
    w.unmount()
  })

  it('the ranking table and its foot: the columns, the name, her rank, and the empty-table sentence', () => {
    const w = mountStats()
    const table = w.get('#stats-ranking table')
    expect(table.attributes('aria-label')).toBe('Professional ranking')
    expect(table.findAll('thead th').map((n) => n.text())).toEqual(['#', 'Player', 'Age', 'Pts'])
    const hints = w.findAll('#stats-ranking .hint').map((n) => n.text())
    expect(hints).toEqual(['Her rank: Unranked', 'She has not played a professional event yet. The paid tour starts at the World Tour 15, from age 16.'])
    w.unmount()
  })

  it('the counting list: the window sentences, the drop line and the table with its own name', () => {
    const w = mountStats()
    const res = golden.ladders.wta.countingResults
    const oldest = res[0]!
    const finish = TIERS[oldest.tier!].points.indexOf(oldest.points)
    const what = `${TIER_SHORT[oldest.tier!]} ${finishPhrase(finish, TIERS[oldest.tier!].drawSize)}`
    const weeks = oldest.week + 53 - golden.week
    expect(flat(w.get('.stats-window-line').text())).toBe(`Counting 1 of a best-${BEST_N_BY_TRACK.wta} window. The window has room – any scoring result counts in full.`)
    expect(flat(w.get('.stats-window-drop').text())).toBe(`Next drop: ${what}, ${oldest.points} pts – leaves the window in ${weeks} weeks.`)
    const table = w.get('#stats-results table')
    expect(table.attributes('aria-label')).toBe('Professional counting results')
    expect(table.findAll('thead th').map((n) => n.text())).toEqual(['Week', 'Tier', 'Pts'])
    expect(table.get('tfoot th').text()).toBe('Total')
    expect(table.findAll('tbody tr td:nth-child(2)').map((n) => n.text())).toEqual([TIERS.w15.label])
    w.unmount()
  })

  it('the other two tables: the tile words, the headings, the no-exchange lines and the rank text', async () => {
    const w = mountStats()
    await showTrack(w, 'domestic')
    expect(w.findAll('.stats-tile-label').map((n) => n.text())).toEqual(['National rank', 'Points', 'National W–L'])
    expect(w.findAll('.stats-tile-value')[0]!.text()).toBe('#87')
    expect(w.findAll('h2').map((n) => n.text())).toEqual(['Stats', 'Season by season', 'National ranking', 'Counting results'])
    expect(w.get('.stats-no-exchange').text()).toBe('National points open her next tier. They do not count towards her international ranking.')
    expect(w.find('.stats-banked').exists()).toBe(false)
    expect(w.get('#stats-ranking table').attributes('aria-label')).toBe('National ranking')
    expect(w.get('#stats-results table').attributes('aria-label')).toBe('National counting results')
    expect(w.findAll('#stats-ranking .hint').map((n) => n.text())).toEqual([expect.stringMatching(/^Her rank: #\d+$/)])
    await showTrack(w, 'itf')
    expect(w.findAll('.stats-tile-label').map((n) => n.text())).toEqual(['International rank', 'Points', 'International W–L'])
    expect(w.get('.stats-no-exchange').text()).toBe('Junior Tour points only. National results do not count here.')
    expect(w.get('#stats-ranking table').attributes('aria-label')).toBe('International ranking')
    w.unmount()
  })

  it('the three empty-table sentences, one per table (a career with no result on that table)', async () => {
    const bare = (over: Deep = {}): Snapshot => {
      let s = golden
      for (const track of LADDER_TRACKS) s = withLadder(s, track, { rank: null, points: 0, countingResults: [], banked: undefined, ...over })
      return s
    }
    const w = mountStats(bare())
    const want: Record<LadderTrack, string> = {
      domestic: 'No national results yet – her first Local Open will put her on this table.',
      itf: 'She has not played a Junior Tour event yet, so she has no international ranking. Her national standing is on the other tab.',
      wta: 'She has not played a professional event yet. The paid tour starts at the World Tour 15, from age 16.',
    }
    for (const track of LADDER_TRACKS) {
      await showTrack(w, track)
      expect(w.findAll('#stats-ranking .hint').map((n) => n.text()).slice(-1)[0], track).toBe(want[track])
    }
    // with no counting result the strip loses its third entry and the counting section goes
    expect(w.findAll('.stats-jump button').map((n) => n.text())).toEqual(['Season by season', 'Professional ranking'])
    expect(w.find('#stats-results').exists()).toBe(false)
    w.unmount()
  })

  it('the closed junior archive: the title, the peak and the note replace the tiles', async () => {
    const aged = patched(golden, { ageYears: 19 })
    const w = mountStats(aged)
    await showTrack(w, 'itf')
    const peak = Math.min(...aged.seasonHistory.map((h) => h.endRank).filter((r) => r > 0))
    const closedAt = TIERS.j30.maxAgeYears! + 1
    expect(w.get('.stats-archive-title').text()).toBe(`Junior career – closed at ${closedAt}`)
    expect(w.get('.stats-archive-peak').text()).toBe(`Peaked #${peak} at year-end`)
    expect(flat(w.get('.stats-archive-note').text())).toBe(`The Junior Tour is under-${closedAt}, so this table is hers for good – it cannot move again. Her live career is on the Pro tab.`)
    expect(w.find('.stats-header-row').exists()).toBe(false)
    expect(w.findAll('.stats-jump button').map((n) => n.text())).toEqual([])
    w.unmount()
  })

  it('the banked sentence is one whole message per table – the three grammars, «A international» included, character for character', async () => {
    const want = (word: string): string =>
      `7 pts banked. A ${word} ranking needs ${RANKABLE_MIN.tournaments} events with points, or ${RANKABLE_MIN.points} points – until then the table shows nothing, and every result below still counts towards it.`
    let s = golden
    for (const track of LADDER_TRACKS) s = withLadder(s, track, { banked: 7 })
    const w = mountStats(s)
    const said: string[] = []
    for (const track of LADDER_TRACKS) {
      await showTrack(w, track)
      said.push(flat(w.get('.stats-banked').text()))
    }
    expect(said).toEqual([want('national'), want('international'), want('professional')])
    expect(said.map((x, i) => x.includes(`A ${LABEL[LADDER_TRACKS[i]!].toLowerCase()} ranking`))).toEqual([true, true, true])
    w.unmount()
  })

  it('the drop line is a counted phrase: one week and many weeks are two whole messages, and a result with no tier is «Oldest result»', async () => {
    const one = withLadder(golden, 'wta', { countingResults: [{ week: golden.week - 52, tier: 'w15', points: 6 }] })
    const w1 = mountStats(one)
    const w15 = TIERS.w15
    const what = `${TIER_SHORT.w15} ${finishPhrase(w15.points.indexOf(6), w15.drawSize)}`
    expect(flat(w1.get('.stats-window-drop').text())).toBe(`Next drop: ${what}, 6 pts – leaves the window in 1 week.`)
    w1.unmount()
    const untiered = withLadder(golden, 'wta', { countingResults: [{ week: golden.week - 10, points: 5 }] })
    const w2 = mountStats(untiered)
    expect(flat(w2.get('.stats-window-drop').text())).toBe('Next drop: Oldest result, 5 pts – leaves the window in 43 weeks.')
    expect(w2.get('#stats-results table tbody tr td:nth-child(2)').text()).toBe('–')
    w2.unmount()
  })

  it('a full window says the weakest bar to beat', () => {
    const cap = BEST_N_BY_TRACK.wta
    const results = Array.from({ length: cap }, (_v, i) => ({ week: golden.week - 20 - i, tier: 'w15' as const, points: 6 + i }))
    const w = mountStats(withLadder(golden, 'wta', { countingResults: results }))
    expect(flat(w.get('.stats-window-line').text())).toBe(`Counting ${cap} of a best-${cap} window. Weakest counted: 6 pts – a new result must beat it to raise the total.`)
    w.unmount()
  })

  it('Season by season: the three heads, the empty states, the figures cells and the foot – on all three tables', async () => {
    const w = mountStats()
    const head = (): string[] => w.findAll('#stats-seasons thead th').map((n) => n.text())
    expect(head()).toEqual(['Season', 'Pro rank', 'Pts', 'W–L', 'Funds'])
    expect(w.get('#stats-seasons table').attributes('aria-label')).toBe('Season by season, professional figures')
    expect(w.get('#stats-seasons [role="group"]').attributes('aria-label')).toBe('Season by season, scrollable')
    expect(w.findAll('#stats-seasons tbody tr')).toHaveLength(1)
    expect(w.get('#stats-seasons .hint').text()).toBe("Funds is the season's net – the family's whole year, not this table's.")
    await showTrack(w, 'domestic')
    expect(head()).toEqual(['Season', 'Nat. rank', 'Pts', 'W–L', 'Funds'])
    expect(w.get('#stats-seasons table').attributes('aria-label')).toBe('Season by season, national figures')
    await showTrack(w, 'itf')
    expect(head()).toEqual(['Season', 'Int. rank', 'Pts', 'W–L', 'Funds'])
    expect(w.get('#stats-seasons table').attributes('aria-label')).toBe('Season by season, international figures')
    expect(w.findAll('#stats-seasons tbody tr')).toHaveLength(3)
    // a rank is «#N» or the dash; the golden pre-v46 rows keep their one rank on the international table
    const ranks = w.findAll('#stats-seasons tbody tr td:nth-child(2)').map((n) => n.text())
    expect(ranks.every((r) => r === '–' || /^#\d+$/.test(r))).toBe(true)
    expect(ranks.some((r) => /^#\d+$/.test(r))).toBe(true)
    w.unmount()
    const first = mountStats(patched(golden, { seasonHistory: [] }))
    expect(flat(first.get('#stats-seasons .hint').text())).toBe("Her first season is still running – it lands here at the year's wrap-up, and every season after it stacks on top.")
    first.unmount()
    const other = mountStats(patched(golden, { seasonHistory: golden.seasonHistory.filter((h) => !h.byTrack) }))
    expect(flat(other.get('#stats-seasons .hint').text())).toBe('Nothing on this table yet – her finished seasons were played on another one.')
    other.unmount()
  })

  it('the counting table on its own: the generic empty line, and a caller-supplied one is left alone', () => {
    const empty = mount(CountingResultsTable, { props: { results: [] } })
    expect(empty.get('.hint').text()).toBe('No counted results yet – enter a tournament to earn ranking points.')
    empty.unmount()
    const custom = mount(CountingResultsTable, { props: { results: [], emptyNote: 'A caller sentence.' } })
    expect(custom.get('.hint').text()).toBe('A caller sentence.')
    custom.unmount()
  })
})

// --- 2. completeness -------------------------------------------------------------------------------------------

describe('L2-7 completeness – every string of the stats files is a wired key, and the sites this wave names call t()', () => {
  const FILES = ['src/components/screens/StatsScreen.vue', 'src/components/SeasonHistoryTable.vue', 'src/components/CountingResultsTable.vue']
  it('no CERTAIN string homed in these files is left unwrapped', () => {
    const open = Object.entries(CATALOG.keys)
      .filter(([, v]) => v.home.some((h) => FILES.includes(h)) && !v.wrapped)
      .map(([k]) => k)
    expect(open).toEqual([])
  })

  it('the rows RU-07 names have a wired key each, and the file that owns each really calls t() with it', () => {
    const SITES: [string, string[]][] = [
      ['src/components/screens/StatsScreen.vue', ['Stats', 'Which ranking table', 'picker|National', 'picker|International', 'picker|Professional', 'tile|National', 'tile|International',
        'tile|Professional', 'Local, Regional and National results. These are the points that open her next tier.',
        'Junior Tour results only. A national title is worth nothing here – the two tables never meet.', 'W15 and up – the paid tour. Junior points never cross over.',
        'Junior career – closed at {0}', 'Peaked #{0} at year-end',
        'The Junior Tour is under-{0}, so this table is hers for good – it cannot move again. Her live career is on the Pro tab.', '{0} rank', 'Points', '{0} W–L',
        '{0} pts banked. A national ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.',
        '{0} pts banked. A international ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.',
        '{0} pts banked. A professional ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.',
        'National points open her next tier. They do not count towards her international ranking.', 'Junior Tour points only. National results do not count here.',
        'Professional points only. Junior and national results do not count here.', 'No national results yet – her first Local Open will put her on this table.',
        'She has not played a Junior Tour event yet, so she has no international ranking. Her national standing is on the other tab.',
        'She has not played a professional event yet. The paid tour starts at the World Tour 15, from age 16.', 'strip|Stats', 'Season by season', '{0} ranking', 'Counting results',
        '#', 'Player', 'Age', 'Pts', 'Her rank: {0}', '#{rank}', 'Unranked', 'Counting {0} of a best-{1} window.', 'Weakest counted: {0} pts – a new result must beat it to raise the total.',
        'The window has room – any scoring result counts in full.', 'Next drop: {0}, {1} pts – leaves the window in 1 week.', 'Next drop: {0}, {1} pts – leaves the window in {2} weeks.',
        'Oldest result', '{0} counting results']],
      ['src/components/SeasonHistoryTable.vue', ['Nat. rank', 'Int. rank', 'Pro rank', 'Season by season, national figures', 'Season by season, international figures',
        'Season by season, professional figures', 'Season by season', "Her first season is still running – it lands here at the year's wrap-up, and every season after it stacks on top.",
        'Nothing on this table yet – her finished seasons were played on another one.', 'Season by season, scrollable', 'Season', 'Pts', 'W–L', 'Funds', '#{rank}',
        "Funds is the season's net – the family's whole year, not this table's."]],
      ['src/components/CountingResultsTable.vue', ['Week', 'counting|Tier', 'Pts', 'Total', 'No counted results yet – enter a tournament to earn ranking points.']],
    ]
    const unwired: string[] = []
    const absent: string[] = []
    for (const [file, keys] of SITES) {
      const source = SRC(file)
      for (const key of keys) {
        if (!CATALOG.keys[key]?.wrapped) unwired.push(`${file}: ${key}`)
        // the file itself asks for the key (single, double or backtick quotes; escaped apostrophes as the source spells them)
        const literal = key.replaceAll("'", "\\'")
        if (!source.includes(`'${literal}'`) && !source.includes(`"${key}"`) && !source.includes(`\`${key}\``)) absent.push(`${file}: ${key}`)
      }
    }
    expect(unwired).toEqual([])
    expect(absent, 'a key the table names that its own file does not call').toEqual([])
  })
})

// --- 3. the seams ----------------------------------------------------------------------------------------------

describe('L2-7 seams – tables of words are getters, computed rows follow the locale', () => {
  it('the picker, the tiles, the headings and the strip follow a locale flip WITHOUT a remount', async () => {
    installCatalog('ru', {
      'picker|National': 'PICK-N*', 'picker|International': 'PICK-I*', 'picker|Professional': 'PICK-P*', 'tile|Professional': 'TILE-P*', '{0} rank': 'RANK* {0}', '{0} W–L': 'WL* {0}',
      Professional: 'FULL-P*', '{0} ranking': 'RK* {0}', 'Season by season': 'SEASONS*', 'Counting results': 'COUNTING*', 'strip|Stats': 'STRIP*', Stats: 'HEAD*', 'Which ranking table': 'WHICH*',
    })
    const w = mountStats()
    expect(seen(w.element)).toContain('Professional ranking')
    await setLocale('ru')
    await nextTick()
    const text = seen(w.element)
    for (const marker of ['PICK-N*', 'PICK-I*', 'PICK-P*', 'RANK* TILE-P*', 'WL* TILE-P*', 'RK* FULL-P*', 'SEASONS*', 'COUNTING*', 'STRIP*', 'HEAD*', 'WHICH*']) expect(text, marker).toContain(marker)
    expect(w.findAll('.stats-jump button').map((n) => n.text())).toEqual(['SEASONS*', 'RK* FULL-P*', 'COUNTING*'])
    expect(w.get('#stats-ranking table').attributes('aria-label')).toBe('RK* FULL-P*')
    w.unmount()
  })

  it('the tooltips, the no-exchange and the empty lines, the rank heads and the table names are getters: each reads the catalog when it is READ', async () => {
    installCatalog('ru', {
      'W15 and up – the paid tour. Junior points never cross over.': 'TIP*', 'Professional points only. Junior and national results do not count here.': 'NOEX*',
      'She has not played a professional event yet. The paid tour starts at the World Tour 15, from age 16.': 'EMPTY*', 'Pro rank': 'PRO-HEAD*',
      'Season by season, professional figures': 'TABLE-P*', 'Season by season, scrollable': 'SCROLL*', 'Funds is the season\'s net – the family\'s whole year, not this table\'s.': 'FUNDS-NOTE*',
    })
    await setLocale('ru')
    const w = mountStats()
    const text = seen(w.element)
    for (const marker of ['TIP*', 'NOEX*', 'EMPTY*', 'PRO-HEAD*', 'TABLE-P*', 'SCROLL*', 'FUNDS-NOTE*']) expect(text, marker).toContain(marker)
    w.unmount()
  })

  it('a banked sentence asks for ITS table\'s whole message: a stand-in that only knows the professional one leaves the other two in English', async () => {
    const pro = '{0} pts banked. A professional ranking needs {1} events with points, or {2} points – until then the table shows nothing, and every result below still counts towards it.'
    installCatalog('ru', { [pro]: 'BANKED* {0}/{1}/{2}' })
    await setLocale('ru')
    let s = golden
    for (const track of LADDER_TRACKS) s = withLadder(s, track, { banked: 7 })
    const w = mountStats(s)
    expect(w.get('.stats-banked').text()).toBe(`BANKED* 7/${RANKABLE_MIN.tournaments}/${RANKABLE_MIN.points}`)
    await showTrack(w, 'domestic')
    expect(w.get('.stats-banked').text()).toMatch(/^7 pts banked\. A national ranking needs /)
    w.unmount()
  })

  it('the drop line asks for the singular or the plural message by the week count, never by an English word', async () => {
    installCatalog('ru', { 'Next drop: {0}, {1} pts – leaves the window in 1 week.': 'ONE* {0}|{1}', 'Next drop: {0}, {1} pts – leaves the window in {2} weeks.': 'MANY* {0}|{1}|{2}' })
    await setLocale('ru')
    const one = mountStats(withLadder(golden, 'wta', { countingResults: [{ week: golden.week - 52, tier: 'w15', points: 6 }] }))
    expect(one.get('.stats-window-drop').text()).toMatch(/^ONE\* .+\|6$/)
    one.unmount()
    const many = mountStats()
    expect(many.get('.stats-window-drop').text()).toMatch(/^MANY\* .+\|6\|42$/)
    many.unmount()
  })
})

// --- 4. the context tags ---------------------------------------------------------------------------------------

describe('L2-7 context tags – added where one English needs two Russians (measured against every other batch table)', () => {
  const TAGS: [string, string][] = [
    ['picker|National', 'National'],
    ['picker|International', 'International'],
    ['picker|Professional', 'Professional'],
    ['tile|National', 'National'],
    ['tile|International', 'International'],
    ['tile|Professional', 'Professional'],
    ['counting|Tier', 'Tier'],
    ['strip|Stats', 'Stats'],
  ]
  it.each(TAGS)('%s is a wired key that renders the bare English', (tagged, bare) => {
    expect(CATALOG.keys[tagged]?.wrapped, `${tagged} is not wired`).toBe(true)
    expect(t(tagged)).toBe(bare)
  })

  it('the mounted sites ask for the TAGGED key, not the bare one (a stand-in catalog that only knows the tags and decoys for the bare words)', async () => {
    installCatalog('ru', {
      'picker|National': 'PN*', 'picker|International': 'PI*', 'picker|Professional': 'PP*', National: 'BARE*', International: 'BARE*',
      'tile|Professional': 'TP*', Professional: 'BARE*', 'strip|Stats': 'STRIP*', 'counting|Tier': 'TOURN*', Tier: 'BARE*', Stats: 'HEAD*',
    })
    await setLocale('ru')
    const w = mountStats()
    expect(w.findAll(`${PICKER} button`).map((n) => n.text().trim())).toEqual(['PN*', 'PI*', 'PP*'])
    expect(w.findAll('.stats-tile-label')[0]!.text()).toBe('TP* rank')
    expect(w.get('.stats-jump').attributes('aria-label')).toBe('STRIP*')
    expect(w.get('#stats-results thead th:nth-child(2)').text()).toBe('TOURN*')
    // the full display name is the BARE key (the rank chip's) and the heading is the bare `Stats`: the decoys are the real words there, so they may appear
    expect(w.get('h2').text()).toBe('HEAD*')
    expect(flat(w.get('#stats-ranking h2').text())).toBe('BARE* ranking')
    w.unmount()
  })

  it('`Total` and `Week` and `Pts` stay BARE: the counting table is the only wired surface of the first, and every table agrees on the others', async () => {
    // `Total`: the plan sheet has its own tag since L2-5, so the bare key is this table's alone (measured across all 61 docs)
    expect(CATALOG.keys['Total']?.home).toEqual(['src/components/CountingResultsTable.vue'])
    installCatalog('ru', { Total: 'ALL*', 'plan|Total': 'PLAN*', Week: 'WK*', Pts: 'PTS*' })
    await setLocale('ru')
    const table = mount(CountingResultsTable, { props: { results: golden.ladders.wta.countingResults } })
    expect(table.get('tfoot th').text()).toBe('ALL*')
    expect(table.findAll('thead th').map((n) => n.text())).toEqual(['WK*', 'Tier', 'PTS*'])
    table.unmount()
  })
})

// --- 5. the Russian smoke --------------------------------------------------------------------------------------

describe('L2-7 Russian smoke – ru.json read by key, no Cyrillic typed here', () => {
  it('a stand-in catalog proves the call sites ask the catalog (latin markers, one per surface)', async () => {
    installCatalog('ru', { Points: 'POINTS*', 'Counting results': 'COUNTING*', 'Season by season': 'SEASONS*', Funds: 'FUNDS*', Total: 'TOTAL*', Player: 'PLAYER*', 'Her rank: {0}': 'HERRANK* {0}' })
    await setLocale('ru')
    const w = mountStats()
    for (const word of ['POINTS*', 'COUNTING*', 'SEASONS*', 'FUNDS*', 'TOTAL*', 'PLAYER*', 'HERRANK* ']) expect(seen(w.element), word).toContain(word)
    w.unmount()
  })

  it('the REAL ru.json: every approved row on these surfaces renders his Russian; every unapproved one renders English and is counted', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const stats = mountStats()
    const itf = mountStats(patched(golden, { ageYears: 19, activeLadder: 'itf' }))
    const mounted = [stats, itf]
    const everything = mounted.map((m) => seen(m.element)).join('\n')
    const HERE = /StatsScreen|SeasonHistoryTable|CountingResultsTable/
    const wiredHere = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.some((h) => HERE.test(h)))
    // the approved arm: today `wiredHere` is empty (no RU-07 row is APPROVED) and the loop wakes by itself the day one is
    for (const key of wiredHere) expect(everything, `${key} is approved and wired, so his Russian must render`).toContain(RU[key]!)
    // the unapproved arm: English on screen, and the miss counter says so (ruling 4 as a number)
    expect(everything).toContain('Counting results')
    expect(missCount(), 'unapproved rows must be counted as misses').toBeGreaterThan(20)
    for (const key of ['Points', 'Counting results', 'Season by season', 'Funds', 'Total', 'picker|National', '{0} rank']) expect(missedKeys(), key).toContain(key)
    console.log(`[L2-7 smoke] ru.json: ${Object.keys(RU).length} keys; approved AND wired on these screens: ${wiredHere.length}; distinct misses on two mounted stats surfaces: ${missedKeys().length}`)
    mounted.forEach((m) => m.unmount())
  })
})

// --- 6. the xx sweep -------------------------------------------------------------------------------------------

describe('L2-7 xx sweep – no unwrapped literal in the stats frames, and the phone still holds longer words', () => {
  /** What is NOT frame copy and is allow-listed by SHAPE: week labels, ranks and bare numbers. ⚠ NO NAME-SHAPED PATTERNS (L2-5's rule): a name or an engine
   *  word is allowed because the SNAPSHOT or an engine table carries it – see `engineProse`. */
  const ENGINE_BORN: RegExp[] = [/^W\d+( \d{4}| ['’]\d{2})?$/, /^[−-]?\$[\d,.]+[KMB]?$/, /^[−-]?\$[\d,.]+/, /^#\d+$/, /^\d+$/, /^\d+–\d+$/, /^[—–-]$/, /^…$/, /^\d{4}$/]
  const engineProse = (snap: Snapshot): ((leak: string) => boolean) => {
    const shorts = Array.from(JSON.stringify(snap).matchAll(/"([A-Z][a-z]+ [A-Z][a-z]+)"/g), (m) => formatShortName(m[1]!))
    const corpus = [JSON.stringify(snap), ...shorts, JSON.stringify(Object.values(TIERS).map((x) => x.label)), JSON.stringify(TIER_SHORT)].join('\n')
    return (leak) => leak.length > 2 && corpus.includes(leak)
  }
  const allow = [...DEFAULT_ALLOW, ...ENGINE_BORN]
  const screenLeaks = (root: Element, snap: Snapshot): string[] => hardcodeLeaks(root, allow).filter((l) => !engineProse(snap)(l))

  it('the stats screen on all three tables, the closed junior archive, the banked and empty variants: nothing the SCREEN wrote is left unbracketed', async () => {
    await installPseudoLocale()
    const results: [string, string[]][] = []
    const banked = withLadder(golden, 'domestic', { banked: 5 })
    const w = mountStats(banked)
    for (const track of ['wta', 'domestic', 'itf'] as const) {
      await showTrack(w, track)
      results.push([`stats/${track}`, screenLeaks(w.element, banked)])
    }
    w.unmount()
    const aged = patched(golden, { ageYears: 19 })
    const a = mountStats(aged)
    await showTrack(a, 'itf')
    results.push(['stats/itf-archive', screenLeaks(a.element, aged)])
    a.unmount()
    const empty = patched(golden, { seasonHistory: [] })
    const e = mountStats(empty)
    results.push(['stats/no-seasons', screenLeaks(e.element, empty)])
    e.unmount()
    const none = patched(golden, { seasonHistory: golden.seasonHistory.filter((h) => !h.byTrack) })
    const n = mountStats(none)
    results.push(['stats/other-table', screenLeaks(n.element, none)])
    n.unmount()
    console.log(`[L2-7 xx] leaks: ${JSON.stringify(results)}`)
    for (const [surface, leaks] of results) expect(leaks, `${surface}: copy the SCREEN wrote that did not go through t()`).toEqual([])
  })

  /** TWO NUMBERS PER SURFACE, BOTH `fits.ts`' OWN INSTRUMENT, both as a share of the room the box has on a 375px phone (L2-3's `widest`):
   *   · `line` – every text box as it is drawn: a box that cannot wrap is charged its whole label, a wrapping one only its chrome;
   *   · `word` – the longest unbreakable word of every box STRETCHED BY 40%, on a probe at the box's own font size (the Russian failure mode). */
  function widest(root: Element): { boxes: number; chars: number; line: { r: number; at: string }; word: { r: number; at: string } } {
    let boxes = 0
    let chars = 0
    const line = { r: 0, at: '' }
    const word = { r: 0, at: '' }
    for (const el of Array.from(root.querySelectorAll('*'))) {
      const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.nodeValue ?? '').join(' ').replace(/\s+/g, ' ').trim()
      if (!/\p{L}/u.test(own)) continue
      boxes++
      chars += own.length
      const room = Math.max(1, availableWidth(el, PHONE))
      const lineRatio = demandedWidth(el, room) / room
      if (lineRatio > line.r) Object.assign(line, { r: lineRatio, at: own.slice(0, 28) })
      const longest = own.split(' ').reduce((a, b) => (b.length > a.length ? b : a), '')
      const probe = document.createElement('span')
      probe.textContent = longest + longest.slice(0, Math.ceil(longest.length * 0.4))
      probe.style.whiteSpace = 'nowrap'
      probe.style.fontSize = getComputedStyle(el).fontSize
      el.appendChild(probe)
      const wordRatio = demandedWidth(probe, room) / room
      probe.remove()
      if (wordRatio > word.r) Object.assign(word, { r: wordRatio, at: longest })
    }
    return { boxes, chars, line, word }
  }
  const pct = (r: number): string => `${(r * 100).toFixed(0)}%`

  it('the season-by-season row (five columns inside its own scroller) and the three summary tiles hold a 375x667 phone with every word longer (numbers printed)', async () => {
    const measure = (): { label: string; r: ReturnType<typeof widest> }[] => {
      const w = mountStats()
      const tiles = widest(w.get('.stats-header-row').element)
      const history = mount(SeasonHistoryTable, { props: { track: 'itf' as LadderTrack }, attachTo: document.body })
      const scroller = history.get('.season-history-scroll').element
      const row = widest(scroller)
      // THE SCROLLER IS THE CONTRACT: the five-column table may be wider than the phone, but it scrolls inside its own box and never widens the document
      expect(getComputedStyle(scroller).overflowX, 'the table scrolls in its own box, never the document').toMatch(/auto|scroll/)
      history.unmount()
      w.unmount()
      return [{ label: 'the three summary tiles', r: tiles }, { label: 'the season-by-season table (header + 3 rows)', r: row }]
    }
    const english = measure()
    resetI18nForTests(null)
    await installPseudoLocale()
    const xx = measure()
    console.log(
      '[L2-7 xx] 375x667, share of the box\'s room, English -> xx: ' +
        english
          .map((e, i) => {
            const x = xx[i]!
            return `${e.label}: ${e.r.boxes} text boxes, ${e.r.chars} -> ${x.r.chars} chars; widest line ${pct(e.r.line.r)} («${e.r.line.at}») -> ${pct(x.r.line.r)} («${x.r.line.at}»); longest word ${pct(e.r.word.r)} («${e.r.word.at}») -> ${pct(x.r.word.r)} («${x.r.word.at}»)`
          })
          .join(' · '),
    )
    // the tiles are captions that wrap or fit; the table's cells live in a scroller, so for it the bound that matters is a single WORD: no unbreakable word may be wider than the room itself
    expect(xx[0]!.r.line.r, `the tiles: «${xx[0]!.r.line.at}» cannot wrap and overflows its box under xx`).toBeLessThanOrEqual(1)
    for (const x of xx) expect(x.r.word.r, `${x.label}: the word «${x.r.word.at}» overflows its box under xx`).toBeLessThanOrEqual(1)
    expect(xx.every((x, i) => x.r.chars > english[i]!.r.chars), 'xx made a surface no longer – the measurement did not see the words').toBe(true)
  })
})
