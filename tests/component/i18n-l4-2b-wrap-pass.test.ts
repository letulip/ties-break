// L4-2b (10.10) – THE WRAP PASS: the 75 rows the carpet's first look left in `xxFindings.ts` are wrapped, and the ledger is empty. Pure wrapping: English is byte-identical (the
// carpet's own English numbers before/after, and a hash of every tier title and every grid block label over a wide input grid, are in the wave note), nothing is reworded, and
// no Russian is written – a stub catalog in this file carries ASCII sentinels, never a translation.
//
//   1. WIRED SITES   every key the wave added is a CALL-SITE key of the file that calls it (`wrapped`, `home`), and is spelled in that file's source.
//   2. CONFIRMDIALOG the two default labels are computed over the bare keys; a caller's own label is untouched; they follow the locale.
//   3. DAY INITIALS  seven keys by position – English `T` and `S` stand for two days each, so a bare key could not carry the seven distinct words the owner's table asks for.
//   4. BLOCK LEXICON every label the grid's tables can write has a row, and no row is for a label nothing writes (both ways), and the exit translates what the tables wrote.
//   5. WHOLE MESSAGES the shoot clash's withdraw line (four forms) and the span report's lead (one count form and the plural) – the old English compositions, recomputed.
//
// ⚠ MUTATION ARMS (watched red, in the wave note): a lexicon row deleted -> 4 (both ways); `day4|T` mistyped as `day2|T` -> 3; the `??` in ConfirmDialog made a prop default -> 2; a key in a
// table here renamed without the extract -> 1.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ConfirmDialog from '../../src/components/ConfirmDialog.vue'
import ShootClashDialog from '../../src/components/ShootClashDialog.vue'
import WeekSpanReport from '../../src/components/WeekSpanReport.vue'
import { installCatalog, resetI18nForTests, setLocale, t } from '../../src/i18n'
import { blockWord, weekGridFor } from '../../src/composables/weekGrid'
import { calendarWeekFor, type CalendarWeekFacts } from '../../src/composables/weekDays'
import { formatCents } from '../../src/shared/money'
import { weekDayNumbers } from '../../src/shared/dates'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type Snapshot } from '../../src/shared/protocol'
import { useGameStore } from '../../src/stores/game'
import { installMemoryStorage } from './setup'
import { installPseudoLocale } from './pseudoloc'

const read = (path: string): string => readFileSync(path, 'utf8')

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
  resetI18nForTests(null)
})

// --- 1. the wired sites, per surface ------------------------------------------------------------------------------------------------------------

interface CatalogEntry {
  home?: string[]
  wrapped?: boolean
}
const CATALOG = JSON.parse(read('src/i18n/catalog.en.json')) as { keys: Record<string, CatalogEntry> }

const WIRED: Record<string, string[]> = {
  'src/components/SeasonSummaryDialog.vue': [
    'Season {0} · wrap-up', "That's a season.", 'Ranking', 'Final {0} rank', '#{rank}', 'Unranked', 'from #{0}',
    'She has not played a Junior Tour event yet. Her national standing is on the Stats tab.',
    'No result counted on that table this season. Her other standings are on the Stats tab.',
    'Season points', 'Matches', 'Record', 'Best result', 'Lost to injury', '{0} wk', 'Tournaments entered', '{0} could not move her {1} ranking',
    'Money', 'Spent this season', 'Sold at a loss', 'Earned this season', 'Academy covered', 'Holdings and upkeep', 'Funds this season',
    "Family's portfolio", 'Portfolio growth', 'Off-season now: rest, school, family time.',
    'Off-season now: rest, family time, and the block where next year gets built.', 'Continue',
  ],
  'src/components/RankHelpDialog.vue': [
    'Close', 'How ranking points work', 'She has three rankings and they are counted separately – a result pays into one table only, and the totals never add up together.',
    '{0} – {1} · {2} pts', '#{rank}', 'Unranked', 'Her best 6 results from the last 52 weeks.', 'Her best 6 Junior Tour results from the last 52 weeks.',
    'Her best 18 results from the last 52 weeks. She appears on it after 3 scoring tournaments, or 10 points.', 'Nothing here until she plays her first Local Open.',
    'Nothing here until she plays a Junior Tour event – national results do not count towards this ranking.',
    'Nothing here until she plays a W-series event – junior points do not cross over.', 'A new result only raises the total if it beats the weakest counted one.',
    'On every table, results older than 52 weeks drop out – points must be defended.', 'National points are what open her next tier. The Junior Tour reads her international rank.',
  ],
  'src/components/ShootClashDialog.vue': [
    'Two things at once – {0}', '{0} want her that week, and so does the {1}.', 'Something has to give. All four answers are hers to make.', 'Pull out of the {0}',
    'She shoots, and the {0} entry comes back.', 'She shoots, and the {0} entry comes back, and a late withdrawal counts against her.',
    'She shoots, and the {0} entry is forfeited.', 'She shoots, and the {0} entry is forfeited, and a late withdrawal counts against her.', 'Move the shoot to {0}',
    'She plays as planned and the campaign waits – nothing is paid for it.', 'Cancel the shoot', 'She plays as planned, and {0} take back {1} of the campaign fee.', 'Do both',
    'Lights, flights and a draw in one week – {0} condition off the week.',
  ],
  'src/components/WeekSpanReport.vue': ['1 week passed. Everything they raised is below.', '{n} weeks passed. Everything they raised is below.', 'Nothing was raised in that time.', 'Close'],
  'src/components/RailDashboard.vue': ['In the account', 'My entries'],
  'src/components/TourBriefingDialog.vue': ['Tour office · {0}', 'The commitment rules now apply.', 'What the tour asks for', 'What declining costs', 'Continue'],
  'src/components/ConfirmDialog.vue': ['Cancel', 'Confirm'],
  'src/components/WeekRecapCard.vue': ['day1|M', 'day2|T', 'day3|W', 'day4|T', 'day5|F', 'day6|S', 'day7|S'],
  'src/components/screens/KidScreen.vue': ['#{rank}', 'Unranked'],
  'src/components/screens/HomeScreen.vue': [
    'Best {0} finish · {1}', 'Outgrown – her best {0} result stays on the books · {1}', 'Unlocked – enter your first!',
  ],
  'src/composables/tierState.ts': [
    'Outgrown', '{tier} is under-{n} – at {age} she has aged out of it.', '{tier} – opens at {when}', '{tier} – she is past this level.',
    'National points come from Local, Regional and National events.', 'International points come from Junior Tour events.',
    '{tier} – locked: {more} more {unit} (she has {has} of {need}) – {gap}. {earned}', '{tier} – locked: {more} more {unit} (she has {has} of {need}). {earned}',
    '{tier} – outgrown: she is past this level',
    '{tier} – opens at {when}. Entry here is an acceptance list read off her international ranking – she is #{rank}.',
    '{tier} – opens at {when}. Entry here is an acceptance list read off her international ranking – she has no international ranking yet.',
    '{tier} – open to her, next one {when}',
    '{tier} – open to her, but none is scheduled in the next {weeks} weeks. This tier comes round less often than the others; it is not locked.',
  ],
  'src/composables/weekDays.ts': [
    'No sessions – a full week off court.', '{sessions} sessions over {days} days – {doubled} of them two sessions a day.',
    '{sessions} sessions, one a day – no school, so there is room to double up.', '{sessions} sessions, all of them on court.',
    '{sessions} sessions – {court} on court, {gym} in the gym.',
  ],
}

describe('L4-2b – every key the wave added is a call-site key of the file that calls it', () => {
  for (const [file, keys] of Object.entries(WIRED)) {
    it(`${file}: ${keys.length} keys, each wrapped, homed here, and spelled in the source`, () => {
      const source = read(file)
      for (const key of keys) {
        const entry = CATALOG.keys[key]
        expect(entry, `«${key}» is not in the catalog – run npm run i18n:extract`).toBeDefined()
        expect(entry?.wrapped, `«${key}» is in the catalog but nothing wraps it`).toBe(true)
        expect(entry?.home, `«${key}» is not homed in ${file}`).toContain(file)
        expect(source, `«${key}» is not spelled in ${file}`).toContain(key)
      }
    })
  }
})

// --- 2. ConfirmDialog's two default labels ------------------------------------------------------------------------------------------------------

describe('L4-2b – ConfirmDialog: the defaults are computed over the bare keys, a caller\'s own label is untouched', () => {
  const buttons = (props: Record<string, unknown>): string[] =>
    mount(ConfirmDialog, { props: { message: 'Q?', ...props }, attachTo: document.body })
      .findAll('button')
      .map((b) => b.text())

  it('English: Cancel and Confirm by default, a passed label wins, and passing only one leaves the other default', () => {
    expect(buttons({})).toEqual(['Cancel', 'Confirm'])
    document.body.innerHTML = ''
    expect(buttons({ confirmLabel: 'Delete' })).toEqual(['Cancel', 'Delete'])
    document.body.innerHTML = ''
    expect(buttons({ cancelLabel: 'Keep it', confirmLabel: 'Delete' })).toEqual(['Keep it', 'Delete'])
  })

  it('a locale flip reaches a card that is already up (a prop default would have been cached once per instance)', async () => {
    const w = mount(ConfirmDialog, { props: { message: 'Q?' }, attachTo: document.body })
    expect(w.findAll('button').map((b) => b.text())).toEqual(['Cancel', 'Confirm'])
    installCatalog('ru', { Cancel: 'CANCEL*', Confirm: 'CONFIRM*' })
    await setLocale('ru')
    expect(w.findAll('button').map((b) => b.text())).toEqual(['CANCEL*', 'CONFIRM*'])
    await w.setProps({ cancelLabel: 'Own label' })
    expect(w.findAll('button').map((b) => b.text()), 'a passed label is not looked up').toEqual(['Own label', 'CONFIRM*'])
  })

  it('under xx both defaults are bracketed – the inbox sign question was the carpet\'s one `Cancel` finding', async () => {
    await installPseudoLocale()
    expect(buttons({}).every((text) => text.startsWith('⟦'))).toBe(true)
  })
})

// --- 3. the weekday initials: seven keys by position ----------------------------------------------------------------------------------------------

describe('L4-2b – the recap\'s seven day initials are seven context-tagged keys, Monday first', () => {
  const KEYS = ['day1|M', 'day2|T', 'day3|W', 'day4|T', 'day5|F', 'day6|S', 'day7|S']

  it('the source lists exactly those seven readers, in that order', () => {
    const source = read('src/components/WeekRecapCard.vue')
    const listed = Array.from(source.matchAll(/\(\) => t\('(day\d\|[A-Z])'\)/g), (m) => m[1])
    expect(listed).toEqual(KEYS)
  })

  it('English reads M T W T F S S, and a catalog can give the two Ts and the two Ss different words (a bare `T` or `S` could not)', async () => {
    expect(KEYS.map((k) => t(k))).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S'])
    installCatalog('ru', Object.fromEntries(KEYS.map((k, i) => [k, `D${i + 1}*`])))
    await setLocale('ru')
    expect(KEYS.map((k) => t(k))).toEqual(['D1*', 'D2*', 'D3*', 'D4*', 'D5*', 'D6*', 'D7*'])
  })

  it('no bare single-letter key was added for them (the stage code and the path letter already needed a tag)', () => {
    for (const bare of ['M', 'T', 'W', 'F', 'S']) expect(CATALOG.keys[bare], `a bare «${bare}» key`).toBeUndefined()
  })
})

// --- 4. the block lexicon, both ways ----------------------------------------------------------------------------------------------------------------

describe('L4-2b – the Calendar\'s block lexicon: every label the tables write has a row, and every row is written by a table', () => {
  const source = read('src/composables/weekGrid.ts')
  const rows = Array.from(source.matchAll(/^\s*'([^']+)': \(\) => t\('([^']+)'\),$/gm), (m) => ({ key: m[1]!, arg: m[2]! }))
  const pool = (name: string): string[] => {
    const body = new RegExp(`const ${name}: readonly string\\[\\] = \\[([\\s\\S]*?)\\]\\n`).exec(source)?.[1] ?? ''
    return Array.from(body.matchAll(/'([^']*)'/g), (m) => m[1]!)
  }
  const written = new Set<string>([
    ...Array.from(source.matchAll(/label:\s*'([^']*)'/g), (m) => m[1]!),
    ...pool('COURT_SESSIONS'),
    ...pool('GYM_SESSIONS'),
    /\? 'Physio' : '([^']+)'/.exec(source)![1]!, // the rehab-gym relabel
    /const SUMMER_STUDY_LABEL = '([^']*)'/.exec(source)![1]!,
  ])

  it('the table is read from the source: it exists, and each row reads its own English through t()', () => {
    expect(rows.length, 'no lexicon rows found').toBeGreaterThan(60)
    for (const r of rows) expect(r.arg, `row «${r.key}» reads another key`).toBe(r.key)
  })

  it('BOTH WAYS: a label added to a table without a row is red, and a row nothing writes is red', () => {
    const have = new Set(rows.map((r) => r.key))
    expect(Array.from(written).filter((l) => !have.has(l)).sort(), 'labels a table writes that the lexicon cannot translate').toEqual([])
    expect(Array.from(have).filter((l) => !written.has(l)).sort(), 'lexicon rows no table writes').toEqual([])
    expect(have.size, 'a row twice').toBe(rows.length)
  })

  it('every row is a wired call-site key of weekGrid.ts', () => {
    for (const r of rows) {
      expect(CATALOG.keys[r.key]?.wrapped, `«${r.key}»`).toBe(true)
      expect(CATALOG.keys[r.key]?.home, `«${r.key}»`).toContain('src/composables/weekGrid.ts')
    }
  })

  const facts = (over: Partial<CalendarWeekFacts> = {}): CalendarWeekFacts => ({
    week: 5, plan: WEEK_PLAN_PRESETS.balanced, profile: DEFAULT_PROFILE, injury: null, knock: null, vacations: [], practices: [], upcoming: [], arrival: null, pending: undefined, ...over,
  })
  const grid = (seed = 'l4-2b'): ReturnType<typeof weekGridFor> => weekGridFor(calendarWeekFor(facts(), 6), 14, weekDayNumbers(6), seed)

  it('English: the exit changes no label (every block still reads a label the tables wrote)', () => {
    const labels = grid().flatMap((d) => d.blocks.map((b) => b.label))
    expect(labels.length).toBeGreaterThan(10)
    for (const label of labels) expect(written.has(label), `«${label}» is not a label any table writes`).toBe(true)
  })

  it('a locale reaches the grid: a translated label replaces the English one block for block, every other label is left as written', async () => {
    const english = grid().flatMap((d) => d.blocks.map((b) => b.label))
    const stub: Record<string, string> = { Study: 'STUDY*', Rest: 'REST*', School: 'SCHOOL*' }
    for (const label of Object.keys(stub)) expect(english, `no «${label}» block in the grid – the case would be vacuous`).toContain(label)
    installCatalog('ru', stub)
    await setLocale('ru')
    const translated = grid().flatMap((d) => d.blocks.map((b) => b.label))
    expect(translated.length).toBe(english.length)
    english.forEach((label, i) => expect(translated[i], `block ${i}: «${label}»`).toBe(stub[label] ?? label))
    expect(blockWord('A label no table writes')).toBe('A label no table writes')
  })
})

// --- 5. whole messages, recomputed against the old English compositions --------------------------------------------------------------------------

describe('L4-2b – the shoot clash\'s withdraw line is one whole message per form, and the span report\'s lead one per count', () => {
  const clash = (over: Record<string, unknown> = {}) => {
    useGameStore().snapshot = {
      shootClash: {
        weekLabel: "W12 '31", brand: 'Quiet Hour', eventLabel: 'Local Open', entryFeeCents: 4000, entryRefunded: false, mandatoryPenalty: false,
        moveToWeek: 14, moveToLabel: "W14 '31", cancelShootCents: 120000, conditionCost: 18, ...over,
      },
    } as unknown as Snapshot
    return mount(ShootClashDialog, { attachTo: document.body })
  }

  it('the four forms read exactly what the template + ternary composed before (refunded or forfeited, with or without the late-withdrawal clause)', () => {
    for (const refunded of [true, false]) {
      for (const penalty of [true, false]) {
        const w = clash({ entryRefunded: refunded, mandatoryPenalty: penalty })
        const old = `She shoots, and the ${formatCents(4000)} entry ${refunded ? 'comes back' : 'is forfeited'}${penalty ? ', and a late withdrawal counts against her.' : '.'}`
        expect(w.findAll('.knock-choice-cost')[0]!.text()).toBe(old)
        w.unmount()
      }
    }
  })

  it('the rest of the card reads the same words, and the kicker, title and verbs are bracketed under xx', async () => {
    const w = clash()
    expect(w.get('.season-summary-kicker').text()).toBe("Two things at once – W12 '31")
    expect(w.get('.season-summary-title').text()).toBe('Quiet Hour want her that week, and so does the Local Open.')
    expect(w.findAll('.knock-choice-cost').slice(1).map((c) => c.text())).toEqual([
      'She plays as planned and the campaign waits – nothing is paid for it.',
      `She plays as planned, and Quiet Hour take back ${formatCents(120000)} of the campaign fee.`,
      'Lights, flights and a draw in one week – 18 condition off the week.',
    ])
    w.unmount()
    await installPseudoLocale()
    const x = clash()
    for (const verb of x.findAll('.knock-choice-verb')) expect(verb.text().startsWith('⟦'), verb.text()).toBe(true)
    for (const cost of x.findAll('.knock-choice-cost')) expect(cost.text().startsWith('⟦'), cost.text()).toBe(true)
  })

  it('the span report: 0 and N weeks are the plural form, exactly one week is its own message, the locale owns both', async () => {
    const lead = (from: number, to: number): string =>
      mount(WeekSpanReport, { props: { from, to, digest: [] }, attachTo: document.body }).get('.week-span-lead').text()
    expect(lead(10, 10)).toBe('0 weeks passed. Everything they raised is below.')
    expect(lead(10, 11)).toBe('1 week passed. Everything they raised is below.')
    expect(lead(10, 14)).toBe('4 weeks passed. Everything they raised is below.')
    installCatalog('ru', { '1 week passed. Everything they raised is below.': 'ONE*', '{n} weeks passed. Everything they raised is below.': '{n} MANY*' })
    await setLocale('ru')
    expect(lead(10, 11)).toBe('ONE*')
    expect(lead(10, 14)).toBe('4 MANY*')
  })
})
