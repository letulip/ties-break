// RU-23 (11.10) – THE KID SCREEN'S TILES SPEAK RUSSIAN, READ BY SHAPE AT THE DISPLAY BOUNDARY. docs/localization/ru-profile-coaching-2026-10.md (the RU-23 section; RU-05 §4 – §6), src/i18n/words.ts (`tile`).
//
// WHAT THE WAVE DID. `kidLife.ts` composes the lines of three tiles in English – the personality line (two of eight words), the school and college tile (a grade, a class standing, a year of a course, the
// rungs after school) and the friends tile's lead (a name inside a phrase) – and the screen printed them as they came. The reader `tile` (words.ts, `engineTile` in src/i18n) matches the SHAPE of a line and asks
// the catalogue for its whole sentence, so Russian owns the order and the plural; the engine is untouched (the English is the same bytes, the twin holds them), and a line that matches no shape comes back as
// written. The relationships tile and the own-account card are NOT read here – named leftovers (RU-17 R02 – R05 / R11, RU-05 §8: both flagged `QUESTION`).
//
//   §1 the vocabularies    – each lexicon is exactly the words the engine can write (swept from the real constants, never retyped)
//   §2 the Russian         – every line the engine writes over a grid of careers, read under the real ru.json: no miss, no English, the exact sentence for the canonical cases
//   §3 the friend          – sixteen names, two shapes, the case each shape wants
//   §4 the English         – a line is returned as written under English and when it matches no shape
//   §5 the mutations       – a row removed, the lead ignored, a name left out: each goes red
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { translate, type MissReason, type RenderContext } from '../src/shared/i18n'
import { createWordReaders } from '../src/i18n/words'
import { engineTile, resetI18nForTests, setLocale } from '../src/i18n'
import { TEMPERAMENTS } from '../src/engine/spirit'
import { ENDINGS } from '../src/engine/ending'
import { ECONOMY } from '../src/engine/economy'
import { seasonYear } from '../src/shared/dates'
import { COMPOSURE_BANDS, FRIEND_NAMES, TEMPERAMENT_WORD, buildKidLife, friendNameAt, friendsTile, lifeStageTile, personalityLine, type KidLifeWorldView } from '../src/engine/kidLife'
import type { CollegeTier } from '../src/shared/protocol'

const ROOT = resolve(__dirname, '..')
const RU = JSON.parse(readFileSync(join(ROOT, 'src/i18n/ru.json'), 'utf8')) as Record<string, string>
const CATALOG = (JSON.parse(readFileSync(join(ROOT, 'src/i18n/catalog.en.json'), 'utf8')) as { keys: Record<string, { wrapped?: true }> }).keys
const LATIN = /[A-Za-z]/

function rig(catalog: Readonly<Record<string, string>> = RU): { tile: (english: string, lead?: string) => string; readers: ReturnType<typeof createWordReaders>; missing: Set<string> } {
  const missing = new Set<string>()
  const onMiss = (key: string, why: MissReason): void => void (why === 'missing' && missing.add(key))
  const ctx: RenderContext = { locale: 'ru', lookup: (k) => catalog[k], onMiss }
  const readers = createWordReaders((key, params) => translate(key, params, ctx))
  return { tile: readers.tile, readers, missing }
}

const view = (over: Partial<KidLifeWorldView> = {}): KidLifeWorldView => ({
  seed: 'ru23-kid',
  week: 60,
  ageYears: 14,
  // the display year follows the week it is asked at, unless the case names one
  seasonYear: seasonYear(Math.floor((over.week ?? 60) / 52)),
  temperament: 'sunny',
  composure: 50,
  playStyle: 'all-court',
  birthMonth: 6,
  injured: false,
  weeksAway: 0,
  lossStreak: 0,
  weeksSinceTitle: null,
  college: null,
  kidFundsCents: 0,
  kidSharePausedYears: 0,
  ownsBrand: false,
  ...over,
})

/** every (lead, note) pair the school tile can print: all twelve birth months through the school years, the exam fortnight and the summer, then the rungs after the last grade and the three college states */
function schoolPairs(): { lead: string; note: string }[] {
  const out = new Map<string, { lead: string; note: string }>()
  const add = (v: KidLifeWorldView): void => {
    const tile = lifeStageTile(v)
    out.set(`${tile.lead}|${tile.note}`, tile)
  }
  for (let month = 1; month <= 12; month++) {
    for (let week = 0; week < 52 * 8; week += 3) add(view({ birthMonth: month, week, ageYears: 13 + Math.floor(week / 52) }))
  }
  const tiers: (CollegeTier | null)[] = ['national', 'private', 'home' as CollegeTier, null]
  for (const tier of tiers) {
    for (let done = 0; done <= ENDINGS.collegeYears; done++) {
      for (const studying of [true, false]) add(view({ week: 400, ageYears: 20, college: { studying, yearsDone: done, totalYears: ENDINGS.collegeYears, tier } }))
    }
  }
  for (const age of [18, 19, 20, 21, 22, 25, 30]) for (const week of [250, 290, 330, 400, 600, 900]) add(view({ week, ageYears: age }))
  return [...out.values()]
}
const PAIRS = schoolPairs()

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §1 the vocabularies
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§1 the vocabularies – each lexicon is exactly the words the engine can write', () => {
  const vocab = rig().readers.vocabulary

  it('the personality line: the four composure words and the four temperament words, from the real constants', () => {
    const engineWords = [...COMPOSURE_BANDS.map((b) => b.word), ...Object.values(TEMPERAMENT_WORD)]
    expect(engineWords.length).toBe(8)
    expect([...(vocab.trait ?? [])].sort()).toEqual([...engineWords].sort())
    expect(new Set(TEMPERAMENTS)).toEqual(new Set(Object.keys(TEMPERAMENT_WORD)))
  })

  it('the school tile\'s second line: the six notes of the school years, swept over every birth month and week of the school years', () => {
    const notes = new Set(PAIRS.filter((p) => /^\d+(?:st|nd|rd|th) grade$/.test(p.lead)).map((p) => p.note))
    expect([...notes].sort()).toEqual([...(vocab.schoolNote ?? [])].sort())
    expect(notes.size).toBe(6)
  })

  it('the stage lines after school: every fixed lead or note the engine writes there is in the lexicon, and the lexicon holds nothing the engine cannot write', () => {
    const fixed = new Set<string>()
    for (const p of PAIRS) {
      if (/^\d+(?:st|nd|rd|th) grade$/.test(p.lead)) continue
      for (const line of [p.lead, p.note]) if (!/\d/.test(line)) fixed.add(line)
    }
    expect([...fixed].sort()).toEqual([...(vocab.stageLine ?? [])].sort())
  })

  it('every shape with a number in it is matched: a grade, a year of the course, the years done, the years of the course left early', () => {
    const shaped = new Set<string>()
    for (const p of PAIRS) for (const line of [p.lead, p.note]) if (/\d/.test(line)) shaped.add(line.replace(/\d+/g, 'N'))
    expect([...shaped].sort()).toEqual(['Nth grade', 'Nst grade', 'Nnd grade', 'Nrd grade', 'N of N years', 'N years done', 'Year N of N'].sort().filter((s) => shaped.has(s)))
    expect(shaped.has('Year N of N') && shaped.has('N years done') && shaped.has('N of N years')).toBe(true)
  })

  it('the friends: the sixteen names of the engine, no more, no fewer – each a row in both forms', () => {
    expect(FRIEND_NAMES.length).toBe(16)
    for (const name of FRIEND_NAMES) {
      for (const key of [`friend|${name}`, `with|${name}`]) {
        expect(CATALOG[key]?.wrapped, key).toBe(true)
        expect(RU[key], key).toBeTruthy()
      }
    }
    const friendKeys = Object.keys(CATALOG).filter((k) => /^(?:friend|with)\|/.test(k))
    expect(friendKeys.length, 'a seventeenth name must come with its engine entry').toBe(32)
  })

  it('a friend\'s name is not a WORD of a class: the carpet\'s vocabulary does not hunt it (a rival called Sofia is a name nobody reads through a class)', () => {
    const all = Object.values(vocab).flat()
    for (const name of FRIEND_NAMES) expect(all, name).not.toContain(name)
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §2 the Russian
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§2 the Russian – the lines the engine writes, under the real ru.json', () => {
  const { tile, missing } = rig()

  it('⭐ the personality line: all sixteen readings, «X и Y», both words feminine and agreeing with her', () => {
    const composure: Record<string, string> = { Unshakeable: 'Невозмутимая', Patient: 'Терпеливая', Impatient: 'Нетерпеливая', 'Hot-headed': 'Вспыльчивая' }
    const temper: Record<string, string> = { stubborn: 'упрямая', 'single-minded': 'целеустремлённая', 'self-contained': 'сдержанная', 'easy-going': 'лёгкая в общении' }
    let n = 0
    for (const c of [80, 65, 50, 10]) {
      for (const t of TEMPERAMENTS) {
        const english = personalityLine(c, t)
        const [a, b] = english.split(' and ') as [string, string]
        const ru = tile(english)
        expect(ru, english).toBe(`${composure[a]!} и ${temper[b]!}`)
        expect(ru.split(' и ').length, 'the «и» exactly once (RU-05 §4)').toBe(2)
        n++
      }
    }
    expect(n).toBe(16)
  })

  it('⭐ every pair of the school tile is Russian, with the lead in hand: a grade is «N-й класс», a course is «N-й курс из M», the notes are the owner\'s', () => {
    for (const { lead, note } of PAIRS) {
      const l = tile(lead)
      const n = tile(note, lead)
      expect(l, `"${lead}"`).not.toMatch(LATIN)
      expect(n, `"${note}" under "${lead}"`).not.toMatch(LATIN)
    }
    expect([...missing], 'keys a Russian tile asked for and ru.json lacks').toEqual([])
  })

  it('the canonical lines, word for word', () => {
    expect(tile('8th grade')).toBe('8-й класс')
    expect(tile('12th grade')).toBe('12-й класс')
    expect(tile('Oldest in class')).toBe('Одна из старших')
    expect(tile('Older than most')).toBe('Старше большинства')
    expect(tile('Young in class')).toBe('Одна из младших')
    expect(tile('Youngest of all')).toBe('Самая младшая')
    expect(tile('Exams this week')).toBe('На этой неделе экзамены')
    expect(tile('Summer break')).toBe('Летние каникулы')
    expect(tile('Year 2 of 4')).toBe('2-й курс из 4')
    expect(tile('Year 4 of 4')).toBe('4-й курс из 4')
    expect(tile('Student tennis')).toBe('Студенческий теннис')
    expect(tile('Final year')).toBe('Выпускной курс')
    expect(tile('Graduate')).toBe('Выпускница')
    expect(tile('Left college')).toBe('Ушла из университета')
    expect(tile('The last bell')).toBe('Последний звонок')
    expect(tile('Tennis full-time')).toBe('Только теннис')
    expect(tile('No more classes')).toBe('Больше никаких уроков')
    expect(tile('Grown up')).toBe('Взрослая')
    expect(tile('Her own life now')).toBe('Теперь у неё своя жизнь')
  })

  it('⭐ «N years done» is two Russian sentences under two leads: the degree of four years under «Graduate», the school under «The last bell»', () => {
    expect(tile(`${ENDINGS.collegeYears} years done`, 'Graduate')).toBe('4 года учёбы')
    expect(tile('4 years done')).toBe('4 года учёбы')
    expect(tile('1 years done', 'Graduate')).toBe('1 год учёбы')
    expect(tile('5 years done', 'Graduate')).toBe('5 лет учёбы')
    // the school's twelve years is the engine's constant, so the Russian sentence cannot outlive it
    expect(`${ECONOMY.school.lastGrade} years done`).toBe('12 years done')
    expect(tile(`${ECONOMY.school.lastGrade} years done`, 'The last bell')).toBe('Школа окончена')
    expect(tile(`${ECONOMY.school.lastGrade} years done`, 'Graduate'), 'under another lead the same shape is a course').toBe('12 лет учёбы')
  })

  it('«N of M years» (left early) carries its plural: «1 курс из 4», «2 курса из 4», «3 курса из 4»', () => {
    expect([0, 1, 2, 3].map((n) => tile(`${n} of 4 years`))).toEqual(['0 курсов из 4', '1 курс из 4', '2 курса из 4', '3 курса из 4'])
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §3 the friend
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§3 the friend – sixteen names, two shapes, the case each shape wants', () => {
  const { tile, missing } = rig()
  // the nominative (`{0} next door`) and the instrumental (`Close to {0}`) of RU-05 §6 – written here, apart from the rows, so a row reworded by mistake is a red
  const NAMES: Record<string, [string, string]> = {
    Emma: ['Эмма', 'Эммой'], Mia: ['Миа', 'Мией'], Sofia: ['София', 'Софией'], Nina: ['Нина', 'Ниной'], Lena: ['Лена', 'Леной'], Zoe: ['Зои', 'Зои'], Iris: ['Ирис', 'Ирис'], Maja: ['Майя', 'Майей'],
    Noor: ['Нур', 'Нур'], Yuki: ['Юки', 'Юки'], Alba: ['Альба', 'Альбой'], Ines: ['Инес', 'Инес'], Sara: ['Сара', 'Сарой'], Elif: ['Элиф', 'Элиф'], Hana: ['Хана', 'Ханой'], Aida: ['Аида', 'Аидой'],
  }

  it('the table above covers the engine\'s names exactly', () => {
    expect(Object.keys(NAMES).sort()).toEqual([...FRIEND_NAMES].sort())
  })

  it('⭐ both shapes, every name', () => {
    for (const [name, [nom, ins]] of Object.entries(NAMES)) {
      expect(tile(`Close to ${name}`)).toBe(`Дружит с ${ins}`)
      expect(tile(`${name} next door`)).toBe(`${nom} всегда рядом`)
    }
    expect([...missing]).toEqual([])
  })

  it('the engine\'s own lead lines, over many careers and school years: both shapes occur and every one reads Russian', () => {
    const shapes = new Set<string>()
    const names = new Set<string>()
    for (let seed = 0; seed < 40; seed++) {
      for (let week = 0; week < 52 * 12; week += 26) {
        const lead = friendsTile(view({ seed: `ru23-friends-${seed}`, week })).lead
        shapes.add(lead.startsWith('Close to ') ? 'close' : 'door')
        const name = lead.startsWith('Close to ') ? lead.slice('Close to '.length) : lead.slice(0, -' next door'.length)
        names.add(name)
        expect(tile(lead), lead).not.toMatch(LATIN)
        expect(friendNameAt(`ru23-friends-${seed}`, 1) !== undefined).toBe(true)
      }
    }
    expect(shapes, 'both phrasings of the lead occur').toEqual(new Set(['close', 'door']))
    expect(names.size, 'the sweep met most of the sixteen').toBeGreaterThan(10)
    for (const n of names) expect(FRIEND_NAMES as readonly string[]).toContain(n)
  })

  it('a name the lexicon does not know comes back as written (a seventeenth friend is English on screen, never a blank)', () => {
    expect(tile('Close to Greta')).toBe('Close to Greta')
    expect(tile('Greta next door')).toBe('Greta next door')
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §4 the English
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§4 the English – a line is returned as written', () => {
  it('under English `engineTile` is the identity on every line the engine writes (the reader is never asked)', async () => {
    resetI18nForTests(null)
    await setLocale('en')
    for (const { lead, note } of PAIRS) {
      expect(engineTile(lead)).toBe(lead)
      expect(engineTile(note, lead)).toBe(note)
    }
    for (const c of [80, 65, 50, 10]) for (const t of TEMPERAMENTS) expect(engineTile(personalityLine(c, t))).toBe(personalityLine(c, t))
    expect(engineTile('')).toBe('')
  })

  it('the whole life of a career, under English: nothing in `buildKidLife` changed – the tile strings are the strings the engine always wrote', () => {
    const life = buildKidLife(view({ week: 300, ageYears: 20, college: { studying: true, yearsDone: 1, totalYears: ENDINGS.collegeYears, tier: 'national' } }))
    expect(life.school).toEqual({ lead: `Year 2 of ${ENDINGS.collegeYears}`, note: 'Student tennis' })
    expect(life.personality).toBe('Impatient and easy-going')
  })

  it('a line that matches no shape comes back as written under Russian too', () => {
    const { tile } = rig()
    // ⚠ RE-AIMED 11.10: the relationships tile GOT its wave («1 г 6 м – да, всё так, докинь»), so its
    // pieces left this list; `Balance` stays the named leftover (his QUESTION row).
    for (const line of ['Balance']) expect(tile(line), line).toBe(line)
  })

  it('⚠ 11.10 – the relationships tile reads Russian: his parked RU-17 forms on the leads, his «1 г 6 м» typography on the span', () => {
    const { tile } = rig()
    for (const [en, want] of [
      ['On her own', 'Сейчас одна'], ['it seems', 'похоже'], ['Married', 'В браке'], ['Engaged', 'Помолвлена'],
      ['Together for', 'Вместе'], ['together 4m', 'вместе 4 м'], ['1y 6m', '1 г 6 м'], ['3y', '3 г'], ['<1m', '<1 м'],
    ] as const) expect(tile(en), en).toBe(want)
  })

  // ⭐ R53 №2 (21.10) – ⚠ ⚠ DRAFT: his name on the relationships lead, nominative after a colon (docs/localization/ru-display-words-2026-10.md, R53-REL-01..03 and R53-REL-N01..N28).
  it('⭐ R53 №2 – the named leads read Russian, all 28 names of the pool, and an unknown name comes back as written', async () => {
    const { tile } = rig()
    for (const [en, want] of [
      ['Married: Anton', 'В браке: Антон'], ['Engaged: Gabriel', 'Помолвлена: Габриэль'], ['Dating: Xavier', 'Встречается: Ксавье'], ['Dating: Yann', 'Встречается: Ян'],
    ] as const) expect(tile(en), en).toBe(want)
    const { PARTNER_NAME_POOL } = await import('../src/engine/world/lifeBeat/wedding')
    for (const name of PARTNER_NAME_POOL) {
      const ruName = tile(`Married: ${name}`)
      expect(ruName, `${name} has a Russian row`).not.toBe(`Married: ${name}`)
      expect(ruName, `${name}: Cyrillic, no long dash`).toMatch(/^В браке: [А-Яа-яЁё]+$/)
    }
    expect(tile('Married: Zzzz'), 'a name the lexicon does not hold').toBe('Married: Zzzz')
  })
})

// ---------------------------------------------------------------------------------------------------------------------------------------------
// §5 the mutations
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('§5 the mutations – each of these must turn the net red, and does', () => {
  it('M1 – a Russian row removed: the line falls back to English and the miss is counted', () => {
    const gone = { ...RU }
    delete gone['Youngest of all']
    const r = rig(gone)
    expect(r.tile('Youngest of all')).toBe('Youngest of all')
    expect([...r.missing]).toContain('Youngest of all')
    expect(rig().tile('Youngest of all')).toBe('Самая младшая')
  })

  it('M2 – the lead ignored: «12 years done» under «The last bell» would read as a course, and the sentence the owner wrote for the school would never be asked', () => {
    const r = rig()
    expect(r.tile('12 years done', 'The last bell')).not.toBe(r.tile('12 years done', 'Graduate'))
    expect(r.tile('12 years done', 'The last bell')).toBe('Школа окончена')
  })

  it('M3 – a friend\'s row reworded: the case is the row\'s, so the test that holds the table above sees it', () => {
    const r = rig({ ...RU, 'with|Hana': 'Хана' })
    expect(r.tile('Close to Hana')).toBe('Дружит с Хана')
    expect(r.tile('Close to Hana')).not.toBe('Дружит с Ханой')
  })

  it('M4 – half a personality line is no personality line: a composure word beside a word the lexicon does not know is returned as written', () => {
    const r = rig()
    expect(r.tile('Patient and zany')).toBe('Patient and zany')
    expect(r.tile('zany and stubborn')).toBe('zany and stubborn')
  })

  it('M5 – the plural of a course: a row that forgets «курс/курса/курсов» would read «1 курса из 4» (the form RU-05 drafted and this wave fixed in place)', () => {
    const wrong = { ...RU, '{0} of {1} years': '{0} курса из {1}' }
    expect(rig(wrong).tile('1 of 4 years')).toBe('1 курса из 4')
    expect(rig().tile('1 of 4 years')).toBe('1 курс из 4')
  })
})
