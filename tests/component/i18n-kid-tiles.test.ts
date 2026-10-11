// RU-23 (11.10) – THE KID SCREEN'S TILES, MOUNTED, UNDER THE REAL ru.json AND UNDER ENGLISH. docs/localization/ru-profile-coaching-2026-10.md (the RU-23 section; RU-05 §4 – §6).
//
// The unit net (tests/i18n-kid-tiles.test.ts) holds the reader: every line the engine writes, the case of a friend's name, the lead that tells two sentences apart. This file holds what a player SEES: the
// real KidScreen on a real career's snapshot with the engine's own `life` over it, the personality, the school and college tile and the friends tile in Russian, and – the control – the same screen in English
// reading the engine's strings to the character. The relationships tile and the own-account card are the named leftovers: they stay as the engine wrote them, and a test says so.
//
//   §1 Russian   – the personality line, the school years, the college years, the rungs after school, the friends tile
//   §2 English   – the control (invariant 4: not a character of English moved)
//   §3 leftovers – the relationships tile is returned as written until its own wave
//   §4 mutation  – a tile printed raw, a row removed
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { buildKidLife, personalityLine, type KidLifeWorldView } from '../../src/engine/kidLife'
import { ENDINGS } from '../../src/engine/ending'
import { seasonYear } from '../../src/shared/dates'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { Snapshot } from '../../src/shared/protocol'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { SHELL } from './xxCarpet'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const LATIN = /[A-Za-z]/

const base = (): Snapshot => toSnapshot(createWorld('ru23-kid-screen', { ...DEFAULT_PROFILE, birthMonth: 10 }))
const view = (over: Partial<KidLifeWorldView>): KidLifeWorldView => {
  const snap = base()
  return {
    seed: snap.seed,
    week: 300,
    ageYears: 20,
    seasonYear: seasonYear(Math.floor((over.week ?? 300) / 52)),
    temperament: snap.diary.facts.temperament,
    composure: 50,
    playStyle: snap.profile.playStyle,
    birthMonth: 10,
    injured: false,
    weeksAway: 0,
    lossStreak: 0,
    weeksSinceTitle: null,
    college: null,
    kidFundsCents: 0,
    kidSharePausedYears: 0,
    ownsBrand: false,
    ...over,
  }
}

async function ru(catalog: Record<string, string> = RU): Promise<void> {
  resetI18nForTests(null)
  installCatalog('ru', catalog)
  await setLocale('ru')
}
async function en(): Promise<void> {
  resetI18nForTests(null)
  await setLocale('en')
}
function mountKid(over: Partial<KidLifeWorldView>): { w: VueWrapper; life: Snapshot['life'] } {
  const snap = base()
  const life = buildKidLife(view(over))
  useGameStore().snapshot = { ...snap, life }
  return { w: mount(KidScreen, SHELL) as VueWrapper, life }
}
/** the lines of the tile under a label, by label */
function tile(w: VueWrapper, label: string): string[] {
  const cell = w.findAll('.kid-tile').find((t) => t.find('.kid-tile-label').text() === label)
  if (!cell) throw new Error(`no tile labelled «${label}» – the labels on screen: ${w.findAll('.kid-tile-label').map((l) => l.text()).join(' / ')}`)
  return cell.findAll('.kid-tile-line').map((l) => l.text())
}

beforeEach(() => {
  installMemoryStorage()
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  resetI18nForTests(null)
  document.documentElement.lang = 'en'
})

describe('§1 Russian – the tiles', () => {
  it('⭐ the personality line: «Хх и хх», both words feminine, the «и» once; all sixteen readings are the unit net\'s, this holds the screen', async () => {
    await ru()
    for (const [composure, temper, expected] of [
      [80, 'fiery', 'Невозмутимая и упрямая'],
      [65, 'deep', 'Терпеливая и целеустремлённая'],
      [50, 'quiet', 'Нетерпеливая и сдержанная'],
      [10, 'sunny', 'Вспыльчивая и лёгкая в общении'],
    ] as const) {
      const { w } = mountKid({ composure, temperament: temper })
      expect(tile(w, 'Характер')).toEqual([expected])
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('⭐ the school years: the grade and the note under it', async () => {
    await ru()
    const { w, life } = mountKid({ week: 20, ageYears: 13 })
    expect(life.school.lead).toMatch(/^\d+th grade$/)
    const [lead, note] = tile(w, 'Школа')
    expect(lead).toMatch(/^\d+-й класс$/)
    expect(note).not.toMatch(LATIN)
    expect(['Одна из старших', 'Старше большинства', 'Одна из младших', 'Самая младшая', 'На этой неделе экзамены', 'Летние каникулы']).toContain(note)
    w.unmount()
  })

  it('the college years: the year of the course, and the final year', async () => {
    await ru()
    const a = mountKid({ college: { studying: true, yearsDone: 1, totalYears: ENDINGS.collegeYears, tier: 'national' } })
    expect(tile(a.w, 'Университет')).toEqual(['2-й курс из 4', 'Студенческий теннис'])
    a.w.unmount()
    document.body.innerHTML = ''
    const b = mountKid({ college: { studying: true, yearsDone: 3, totalYears: ENDINGS.collegeYears, tier: 'private' } })
    expect(tile(b.w, 'Университет')).toEqual(['4-й курс из 4', 'Выпускной курс'])
    b.w.unmount()
  })

  it('the rungs after school: «Последний звонок / Школа окончена» (the school, not a course), then «Только теннис», then «Взрослая»', async () => {
    await ru()
    const bell = mountKid({ week: 270, ageYears: 18 })
    // the last-bell tile exists in the first twelve months out; a career that is still at school at this week prints a grade instead – find the week the engine itself moves the tile
    bell.w.unmount()
    document.body.innerHTML = ''
    let found: string[] | null = null
    for (const week of [255, 262, 270, 280, 290, 300, 310]) {
      const m = mountKid({ week, ageYears: 18 })
      if (m.life.school.lead === 'The last bell') found = tile(m.w, 'После школы')
      m.w.unmount()
      document.body.innerHTML = ''
      if (found) break
    }
    expect(found, 'the engine reached «The last bell» somewhere in the first year out').toEqual(['Последний звонок', 'Школа окончена'])
    const full = mountKid({ week: 400, ageYears: 19 })
    expect(tile(full.w, 'После школы')).toEqual(['Только теннис', 'Больше никаких уроков'])
    full.w.unmount()
    document.body.innerHTML = ''
    const grown = mountKid({ week: 700, ageYears: 23 })
    // from twenty-two the cell is her relationships (a named leftover, §3): the grown-up rung is what the ladder says, but the cell shows the next one
    expect(grown.life.school.lead).toBe('Grown up')
    grown.w.unmount()
  })

  it('the graduate and the one who left: a degree of four years, and a course cut short with its plural', async () => {
    await ru()
    const done = buildKidLife(view({ week: 600, ageYears: 24, college: { studying: false, yearsDone: ENDINGS.collegeYears, totalYears: ENDINGS.collegeYears, tier: 'national' } }))
    expect(done.school).toEqual({ lead: 'Graduate', note: `${ENDINGS.collegeYears} years done` })
    const left = buildKidLife(view({ week: 600, ageYears: 24, college: { studying: false, yearsDone: 1, totalYears: ENDINGS.collegeYears, tier: 'national' } }))
    expect(left.school).toEqual({ lead: 'Left college', note: `1 of ${ENDINGS.collegeYears} years` })
  })

  it('⭐ the friends tile: the lead names her friend in the case its shape wants, and the line under it was already Russian', async () => {
    await ru()
    const seen = new Set<string>()
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const snap = base()
      const life = buildKidLife(view({ seed: `ru23-friends-${seed}`, week: 100 }))
      useGameStore().snapshot = { ...snap, life }
      const w = mount(KidScreen, SHELL) as VueWrapper
      const [lead, note] = tile(w, 'Друзья')
      expect(lead).toMatch(/^(?:Дружит с \S+|\S+ всегда рядом)$/)
      expect(lead).not.toMatch(LATIN)
      expect(note).not.toMatch(LATIN)
      seen.add(lead.startsWith('Дружит') ? 'close' : 'door')
      w.unmount()
      document.body.innerHTML = ''
    }
    expect(seen.size, 'both phrasings met').toBeGreaterThan(0)
  })
})

describe('§2 English – the control: not a character of the engine\'s English moved', () => {
  it('the personality, the school years, the college years and the friends lead are the engine\'s strings', async () => {
    await en()
    const a = mountKid({ composure: 80, temperament: 'quiet' })
    expect(tile(a.w, 'Personality')).toEqual([personalityLine(80, 'quiet')])
    expect(personalityLine(80, 'quiet')).toBe('Unshakeable and self-contained')
    expect(tile(a.w, 'Friends')[0]).toBe(a.life.friends.lead)
    a.w.unmount()
    document.body.innerHTML = ''
    const b = mountKid({ college: { studying: true, yearsDone: 1, totalYears: ENDINGS.collegeYears, tier: 'national' } })
    expect(tile(b.w, 'College')).toEqual(['Year 2 of 4', 'Student tennis'])
    b.w.unmount()
    document.body.innerHTML = ''
    const c = mountKid({ week: 20, ageYears: 13 })
    expect(tile(c.w, 'School')).toEqual([c.life.school.lead, c.life.school.note])
    c.w.unmount()
  })
})

describe('§3 the relationships tile – Russian since 11.10 («1 г 6 м – да, всё так, докинь»)', () => {
  it('«Сейчас одна / похоже» and «Вместе / 1 г 6 м» on a Russian screen – the leads are his parked RU-17 forms, the span is his typography', async () => {
    await ru()
    const alone = mountKid({ week: 700, ageYears: 23 })
    expect(tile(alone.w, 'Отношения')).toEqual(['Сейчас одна', 'похоже'])
    alone.w.unmount()
    document.body.innerHTML = ''
    const together = mountKid({ week: 700, ageYears: 23, together: { weeks: 78, married: false, engaged: false } })
    expect(tile(together.w, 'Отношения')).toEqual(['Вместе', '1 г 6 м'])
    together.w.unmount()
  })
})

describe('§4 mutation – a tile printed raw, a row removed', () => {
  it('M1 – a catalogue row removed: the tile falls back to English (the predicate §1 uses sees it)', async () => {
    const gone = { ...RU }
    delete gone['Patient']
    await ru(gone)
    const { w } = mountKid({ composure: 65, temperament: 'sunny' })
    expect(tile(w, 'Характер')[0]).toMatch(LATIN)
    w.unmount()
  })

  it('M2 – the friend\'s case reworded in its row: the screen shows the row\'s case, not a suffix the code appended', async () => {
    await ru({ ...RU, 'with|Hana': 'Хана' })
    // find a career whose lead is «Close to Hana»
    let shown: string | null = null
    for (let i = 0; i < 400 && shown === null; i++) {
      const snap = base()
      const life = buildKidLife(view({ seed: `ru23-hana-${i}`, week: 100 }))
      if (life.friends.lead !== 'Close to Hana') continue
      useGameStore().snapshot = { ...snap, life }
      const w = mount(KidScreen, SHELL) as VueWrapper
      shown = tile(w, 'Друзья')[0] ?? null
      w.unmount()
      document.body.innerHTML = ''
    }
    expect(shown, 'a seed with «Close to Hana» was found').toBe('Дружит с Хана')
  })
})
