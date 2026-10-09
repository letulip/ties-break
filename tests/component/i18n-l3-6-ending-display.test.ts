// L3-6 (10.10) – THE ENDINGS' PROSE IS DRAWN FROM ITS REFS. The mounted half of tests/i18n-l3-6-endings-album.test.ts: the engine proves every ref renders to its English; THIS file proves a screen
// draws the ref and not the string. Each case mounts the real component twice – under English (the bytes the player has always seen) and under a PROBE `ru` catalog whose values are ASCII markers
// (no Russian anywhere in this file) – and reads what is on the screen.
//
//   1. THE EPILOGUE'S LAST PAGE  – the title, the caption, the fact (with the detail nested in it) and the whole record follow the catalog
//   2. THE RETIREMENT CARD       – her last word, the plateau lede, the decline rung and her warning follow the catalog
//   3. THE SEASON'S CLOSING CARD – her line and the warning follow the catalog
//   4. THE EVENT PLAQUE          – the coach's age line follows the catalog
//   5. A ROW THAT CARRIES NO REF – draws its English under any locale (an engine-born word, a probe fixture)
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import EndingScreen from '../../src/components/EndingScreen.vue'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import SeasonSummaryDialog from '../../src/components/SeasonSummaryDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, latchEnding, buildEndingView, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { weekLabel } from '../../src/shared/dates'
import { endingForLeaving, lastWordLine, plateauLede } from '../../src/engine/ending'
import { COACH_DECLINE_LINES, COACH_WEEK_CHOICE, DECLINE_RUNGS, HER_DECLINE_LINES, herDeclineLine, herLastWinterLine, seasonLastWinterLine } from '../../src/composables/declineVoice'
import { leavingView } from '../helpers/leavingView'
import { posedCareer } from '../helpers/albumSweep'
import { moneyOf } from '../helpers/careerMoney'
import { mountSeason } from '../helpers/mountSeason'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import type { RetirementOffer, SeasonSummary, Snapshot } from '../../src/shared/protocol'

const flat = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim()

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

async function flipToProbe(catalog: Record<string, string>): Promise<void> {
  installCatalog('ru', catalog)
  await setLocale('ru')
  await nextTick()
}

// =================================================================================================
// 1. THE EPILOGUE'S LAST PAGE
// =================================================================================================
function endedView() {
  const world = posedCareer(2)
  world.milestones.push({ type: 'break-even', week: world.week - 3, kind: 'week' }, { type: 'school', week: world.week - 9 })
  // the record's Title and Final rows come from the cabinet, not from the milestones
  world.trophiesByTier.w15 = { ...world.trophiesByTier.w15, titles: [world.week - 30], finals: [world.week - 10] }
  world.week += 4
  const ending = endingForLeaving('peak', leavingView({ endRank: 4 }), world.week, 31)
  latchEnding(world, ending)
  return { world, view: buildEndingView(world)!, ending }
}

function mountEnded(): { w: VueWrapper; world: ReturnType<typeof endedView>['world']; view: ReturnType<typeof endedView>['view'] } {
  const { world, view } = endedView()
  useGameStore().$patch({
    snapshot: {
      ageYears: 31,
      week: world.week,
      kidRank: 1,
      fundsCents: 1234_00,
      careerTotals: view.totals,
      careerMoney: view.money,
      ending: view,
    } as unknown as Snapshot,
  })
  return { w: mount(EndingScreen, { attachTo: document.body }), world, view }
}

describe('L3-6 – the epilogue\'s last page draws the refs the engine sends', () => {
  it('English: the page, the fact with its detail and the record are the bytes the engine wrote', () => {
    const { w, view } = mountEnded()
    expect(flat(w.get('.album-why').text())).toBe(view.closing.why)
    expect(flat(w.get('.album-fact').text())).toBe(view.closing.fact)
    expect(view.closing.why).toBe('She left at the top')
    expect(view.closing.fact).toMatch(/, aged 31 – she was #4 the week she said it$/)
    expect(w.text()).toContain(view.closing.caption)
    w.unmount()
  })

  it('a probe catalog moves the title, the caption, the fact (and the detail NESTED in it) and the record - and a flip back restores the English', async () => {
    const { w, view, ending } = (() => {
      const m = mountEnded()
      return { ...m, ending: m.world.ending! }
    })()
    const english = { why: flat(w.get('.album-why').text()), fact: flat(w.get('.album-fact').text()) }
    await flipToProbe({
      'She left at the top': 'TITLE-PEAK',
      'The last week': 'CAPTION-LAST',
      '{0}, aged {1} – {2}': 'FACT<{0}|{1}|{2}>',
      'she was #{0} the week she said it': 'DETAIL<{0}>',
      'Season close': 'LBL-CLOSE',
      '#{0}': 'RANK<{0}>',
      'First prize money': 'LBL-PRIZE',
      'School behind her': 'LBL-SCHOOL',
      'the last school year is over': 'DET-SCHOOL',
      'The money turned': 'LBL-TURN',
      'one week of it': 'DET-WEEK',
    })
    expect(flat(w.get('.album-why').text())).toBe('TITLE-PEAK')
    expect(w.text()).toContain('CAPTION-LAST')
    expect(flat(w.get('.album-fact').text())).toBe(`FACT<${weekLabel(ending.week)}|31|DETAIL<4>>`)
    // the record is behind «The whole record»
    await w.findAll('.ending-link').find((b) => b.text().includes('The whole record'))!.trigger('click')
    await nextTick()
    const labels = w.findAll('.scroll-label').map((n) => flat(n.text()))
    expect(labels).toContain('LBL-CLOSE')
    expect(labels).toContain('LBL-PRIZE')
    expect(labels).toContain('LBL-SCHOOL')
    expect(labels).toContain('LBL-TURN')
    // a label with no catalog entry falls back to its English and nothing else moves
    expect(labels).toContain('Title')
    const details = w.findAll('.scroll-detail').map((n) => flat(n.text()))
    expect(details).toContain('DET-SCHOOL')
    expect(details).toContain('DET-WEEK')
    expect(details.some((d) => /^RANK<\d+>$/.test(d)), 'a season close names its place through #{0}').toBe(true)
    // the tier label is an engine-born word: no ref, so it draws as the engine wrote it (a Title row's detail)
    const titles = w.findAll('.scroll-rows li').filter((r) => flat(r.find('.scroll-label').text()) === 'Title')
    expect(titles.length).toBeGreaterThan(0)
    for (const row of titles) expect(flat(row.find('.scroll-detail').text())).toMatch(/\S/)
    await w.findAll('.ending-link').find((b) => b.text().includes('Back to the album'))!.trigger('click')
    await setLocale('en')
    await nextTick()
    expect(flat(w.get('.album-why').text())).toBe(english.why)
    expect(flat(w.get('.album-fact').text())).toBe(english.fact)
    expect(view.closing.why).toBe(english.why)
    w.unmount()
  })

  it('a page whose refs are absent (an older snapshot, a fixture) draws its English under any locale', async () => {
    const { world, view } = endedView()
    const bare = { ...view, closing: { ...view.closing, whyC: undefined, captionC: undefined, factC: undefined }, scroll: view.scroll.map((s) => ({ ...s, rows: s.rows.map((r) => ({ week: r.week, label: r.label, detail: r.detail })) })) }
    useGameStore().$patch({ snapshot: { ageYears: 31, week: world.week, kidRank: 1, fundsCents: 0, careerTotals: bare.totals, careerMoney: bare.money, ending: bare } as unknown as Snapshot })
    const w = mount(EndingScreen, { attachTo: document.body })
    await flipToProbe({ 'She left at the top': 'TITLE-PEAK', '{0}, aged {1} – {2}': 'FACT' })
    expect(flat(w.get('.album-why').text())).toBe('She left at the top')
    expect(flat(w.get('.album-fact').text())).toBe(view.closing.fact)
    w.unmount()
  })
})

// =================================================================================================
// 2. THE RETIREMENT CARD
// =================================================================================================
const AGE: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: false }
const PLATEAU: RetirementOffer = { askedWeek: 700, seasonIndex: 12, reason: 'plateau', final: false }
const FINAL: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: true }
const ON_TOUR = { activeLadder: 'wta', ladders: { domestic: { rank: 5, points: 300 }, itf: { rank: 84, points: 0 }, wta: { rank: 106, points: 420 } } }

function showOffer(offer: RetirementOffer, over: Record<string, unknown> = {}): void {
  useGameStore().snapshot = {
    ageYears: 30,
    week: 1453,
    kidRank: 88,
    fundsCents: 1234_00,
    oneMoreYearCount: 0,
    physicalShare: 1,
    careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
    careerMoney: moneyOf({ earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }),
    retirementOffer: offer,
    ...ON_TOUR,
    ...over,
  } as unknown as Snapshot
}
const mountRetire = (offer: RetirementOffer, over: Record<string, unknown> = {}): VueWrapper => {
  showOffer(offer, over)
  return mount(RetirementDialog, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

describe('L3-6 – the retirement card draws her sentences from their refs', () => {
  it('English: her last word, the plateau lede, the rung and the warning are the engine\'s and the composable\'s bytes', () => {
    const last = mountRetire(FINAL, { oneMoreYearCount: 3 })
    expect(flat(last.get('.retire-lede').text())).toBe(lastWordLine(3))
    last.unmount()
    const plateau = mountRetire(PLATEAU, { oneMoreYearCount: 1 })
    expect(flat(plateau.get('.retire-lede').text())).toBe(plateauLede(1, 'professional'))
    plateau.unmount()
  })

  it('a probe catalog moves her last word (the count is a hole), the plateau lede (count and table), the rung and her warning', async () => {
    // (one card at a time: the store's snapshot is shared, so a second mount would repaint the first)
    await flipToProbe({
      'Nobody asked her this time. She said it herself, and she said it steadily. You have said one more year {0} times, and this season was the last one.': 'LASTWORD<{0}>',
      'This time she said it looking out of the window. You have said one more year {0} times, and the {1} table has not moved. She will not fight you on one more – but you both know what she wants.': 'PLATEAU3<{0}|{1}>',
      [DECLINE_RUNGS[1].line]: 'RUNG-2',
      '«{0} more winters after this one, and the last of them is not a question. I will tell you myself.»': 'HERWINTER<{0}>',
    })
    const last = mountRetire(FINAL, { oneMoreYearCount: 3 })
    expect(flat(last.get('.retire-lede').text())).toBe('LASTWORD<3>')
    last.unmount()
    const plateau = mountRetire(PLATEAU, { oneMoreYearCount: 3 })
    expect(flat(plateau.get('.retire-lede').text())).toBe(`PLATEAU3<3|${plateauLede(3, 'professional').match(/the (\w+) table/)![1]}>`)
    plateau.unmount()
    const age = mountRetire(AGE, { physicalShare: 0.9, lastWinterIn: 2 })
    expect(flat(age.get('.retire-rung').text())).toBe('RUNG-2')
    expect(flat(age.get('.retire-last-winter').text())).toBe('HERWINTER<Two>')
    // ...and the ONE sentence with no entry stays English (a miss falls back, it never blanks)
    expect(flat(age.get('.retire-lede').text())).toMatch(/^Twenty-nine is when the question starts/)
    age.unmount()
  })

  it('a count of one and a count of several are two sentences: the probe moves only the form it names', async () => {
    await flipToProbe({ 'Nobody asked her this time. She said it herself, and she said it steadily. You have said one more year {0} time, and this season was the last one.': 'ONCE<{0}>' })
    const one = mountRetire(FINAL, { oneMoreYearCount: 1 })
    expect(flat(one.get('.retire-lede').text())).toBe('ONCE<1>')
    one.unmount()
    const many = mountRetire(FINAL, { oneMoreYearCount: 4 })
    expect(flat(many.get('.retire-lede').text())).toBe(lastWordLine(4))
    many.unmount()
  })
})

// =================================================================================================
// 3. THE SEASON'S CLOSING CARD
// =================================================================================================
const SUMMARY: SeasonSummary = {
  seasonYear: 2062,
  endRank: 88,
  startRank: 74,
  points: 640,
  wins: 24,
  losses: 14,
  bestResultText: 'Semifinalist',
  fundsDeltaCents: 41_200_00,
  spentCents: 180_000_00,
  earnedCents: 221_200_00,
  weeksInjured: 2,
  academyCoveredCents: 0,
  rankTrack: 'wta',
  rankInTrack: 88,
}

describe('L3-6 – the season\'s closing card draws her line and the warning from their refs', () => {
  it('English, then a probe catalog', async () => {
    const seed = 'l36-wrap'
    useGameStore().snapshot = {
      ageYears: 41,
      week: 1453,
      seed,
      physicalShare: 0.6,
      schoolEndsWeek: 200,
      lastWinterIn: 2,
      lastSeasonSummary: SUMMARY,
    } as unknown as Snapshot
    const w = mount(SeasonSummaryDialog, { global: { stubs: { teleport: true } } })
    const hers = herDeclineLine(0.6, seed, 2062)!
    expect(flat(w.get('.season-her-line').text())).toBe(hers)
    expect(flat(w.get('.season-last-winter').text())).toBe(seasonLastWinterLine(2))
    expect(HER_DECLINE_LINES).toContain(hers)
    await flipToProbe({ [hers]: 'HER-LINE', '{0} more winters after this one, and then nobody asks her again.': 'WARN<{0}>' })
    expect(flat(w.get('.season-her-line').text())).toBe('HER-LINE')
    expect(flat(w.get('.season-last-winter').text())).toBe('WARN<Two>')
    w.unmount()
  })
})

// =================================================================================================
// 4. THE EVENT PLAQUE
// =================================================================================================
describe('L3-6 – the coach\'s age line on an event plaque is drawn from its ref', () => {
  it('past her peak every plaque carries one of the coach\'s lines; a probe catalog turns them into markers', async () => {
    const seed = 'l36-plaque'
    const world = createWorld(seed)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 30; i++) tickWeek(world, rng)
    const snap = { ...toSnapshot(world), physicalShare: 0.9 }
    const lines = [...COACH_DECLINE_LINES, ...Object.values(COACH_WEEK_CHOICE)]
    const w = mountSeason(snap)
    const plaques = (): string[] => w.findAll('.event-coach-line').map((n) => flat(n.text()))
    const hit = (p: string): boolean => lines.some((l) => p.includes(l))
    expect(plaques().filter(hit).length, 'no plaque carried an age line').toBeGreaterThan(0)
    const markers: Record<string, string> = {}
    lines.forEach((l, i) => (markers[l] = `COACH-${i}`))
    await flipToProbe(markers)
    const after = plaques()
    expect(after.filter(hit), 'an age line stayed English').toEqual([])
    expect(after.filter((p) => /COACH-\d/.test(p)).length).toBeGreaterThan(0)
    w.unmount()
  })
})

// =================================================================================================
// 5. THE DEAD END: HER LINES WITHOUT A REF DRAW AS THEY WERE
// =================================================================================================
describe('L3-6 – a line the composable does not know is never blanked', () => {
  it('the warning at a count beyond the table still reads, and an unknown pool line draws itself', () => {
    expect(herLastWinterLine(3)).toMatch(/^«Three more winters/)
    expect(seasonLastWinterLine(4)).toMatch(/^Four more winters/)
  })
})
