// L2-11 – THE NET UNDER RU-13A / RU-13B (THE MORE SCREEN: THE SAVES TAB, THE PLAY TAB, THE ABOUT BLOCK AND ITS BUILD LINE) AND RU-15's F-ROWS (THE FEEDBACK DIALOG),
// AND, IN THE SECOND COMMIT, RU-13D (THE 24 COUNTRY NAMES AND THE UI-SIDE FORMATTER SHELLS).
// docs/specs/i18n-2026-10.md §8, docs/localization/ru-saves-settings-2026-10.md, ru-play-about-settings-2026-10.md, ru-current-main-delta-2026-10.md (F01–F16),
// ru-formatters-countries-2026-10.md.
//
// Six questions, asked of the REAL components mounted and of the REAL catalog (the L2-3 … L2-10 nets' shape):
//   1. PARITY. With no catalog the English renders as it shipped – the wiring changed no word (invariant 4). Every expectation below is the OLD composition,
//      retyped as English in this file – never read back from the code under test.
//   2. COMPLETENESS. Every CERTAIN string homed in these modules is a wired key; what is raw on purpose (the date formatter, the store's error text, the
//      shared dialog's own defaults) is asserted raw, so a well-meant wrap later is a decision.
//   3. THE SEAMS. A locale flip re-labels a MOUNTED screen AND a BLOCKING confirmation that is already open; what the player wrote and what the engine
//      printed – names, save names, seeds, week labels, dates, sizes – is left exactly as it was.
//   4. THE CONTEXT TAGS. Measured against every table with the importer's own row reader; the verdicts are asserted here.
//   5. THE RUSSIAN SMOKE. The REAL `src/i18n/ru.json` is installed and the locale flipped. ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE – every expectation is
//      READ from ru.json (or from the importer's rows) by key.
//   6. THE `xx` SWEEP, AT 375x667: the saves slot list and the destructive confirmations (BLOCKING cards whose Cancel is the only way out), plus the feedback
//      dialog – the dismiss control's box inside the phone, proven by mutating the cap away.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'

import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import { COUNTRIES, COUNTRY_NAMES, POPULAR_COUNTRIES } from '../../src/composables/countries'
import { PLAYABLE_COUNTRIES } from '../../src/shared/countries'
import { MONTHS, monthDayLabel } from '../../src/composables/identityCopy'
import { birthDateLabel, monthLabel, seasonWeekRange, weekDateLine, weekRange, weekSpan, weekYearLabel, weeksLeftBracket } from '../../src/shared/dates'
import { useGameStore } from '../../src/stores/game'
import { ageAtWeek } from '../../src/engine/world'
import { SAVE_SCHEMA_VERSION } from '../../src/engine/world'
import { LIFE_EVENT_BOOST_FACTOR } from '../../src/engine/world/lifeBoost'
import { weekLabel } from '../../src/shared/dates'
import { buildDay, buildLine, shortSha } from '../../src/composables/buildInfo'
import { RAW_BUILD_DATE, RAW_BUILD_SHA } from '../../src/buildStamp'
import { AUDIO_COPY } from '../../src/composables/audioCopy'
import { DAY_CROSS_PACE_LABEL } from '../../src/composables/dayCross'
import { MATCH_SPEED_LABEL, MATCH_VIEW_LABEL, MATCH_VIEW_TITLE } from '../../src/composables/matchDefaults'
import {
  FEEDBACK_ADDRESS,
  FEEDBACK_CLOSE_LABEL,
  FEEDBACK_HOLDS_LINE,
  FEEDBACK_LABEL,
  FEEDBACK_PRIVACY_LINE,
  FEEDBACK_SAVE_LINE,
  FEEDBACK_SAVE_PENDING_LINE,
  FEEDBACK_SEND_LABEL,
  REPORT_ATTACH_LINE,
  REPORT_NO_CAREER_LINE,
  REPORT_NO_ERRORS_LINE,
  REPORT_SUBJECT,
  REPORT_TAIL_HEADING,
  REPORT_TRUNCATED_LINE,
  assembleReport,
  errorCountLine,
  feedbackAddressLine,
} from '../../src/feedback'
import { request } from '../../src/worker/client'
import { careerSnapshot } from '../helpers/career'
import { buildCatalog } from '../../tools/i18n-extract'
import { listDocs, readRows, splitRow } from '../../tools/i18n-import'
import { installCatalog, missCount, missedKeys, resetI18nForTests, resetMisses, setLocale } from '../../src/i18n'
import { privacyUrl } from '../../src/composables/privacyRoute'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, PHONE, assertDismissReachable, availableWidth, demandedWidth, setViewport, type Viewport } from './fits'
import { DEFAULT_ALLOW, expandRendered, hardcodeLeaks, installPseudoLocale } from './pseudoloc'
import type { CareerMeta, SavePeek, SlotMeta } from '../../src/shared/protocol'

vi.mock('../../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/worker/client')>()
  return { ...actual, request: vi.fn() }
})
const requestMock = vi.mocked(request)

/** His approved Russian, as the importer compiled it. Every Russian expectation below is read from here by key. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
/** The LIVE catalog – the extractor walking the source as it stands, not the committed file (which `i18n:check` holds equal to it): a key the code stopped asking for must redden here. */
const CATALOG = buildCatalog().catalog
const SRC = (path: string): string => readFileSync(path, 'utf8')
const ROWS = readRows(listDocs()).rows
/** The rows of every table whose clean English cell is exactly `english`, with the importer's own reader. */
const rowsFor = (english: string) => ROWS.filter((r) => r.english === english)
/** The cells of the first doc line that contains `needle`, backticks stripped – for the rows the importer cannot join (a pair or a list in one cell). */
function cellsOf(doc: string, needle: string): string[] {
  const line = readFileSync(`docs/localization/${doc}`, 'utf8').split('\n').find((l) => l.includes(needle))
  if (line === undefined) throw new Error(`${doc}: no line carries «${needle}»`)
  return splitRow(line).map((c) => c.replace(/`/g, '').trim())
}
const parts = (cell: string): string[] => cell.split(' / ').map((p) => p.trim())

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  requestMock.mockReset()
  requestMock.mockResolvedValue({ ok: false } as never)
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
  vi.restoreAllMocks()
})

const flat = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim()
/** The text nodes under `el`, trimmed and joined with ONE space – a row's words as a player reads them (sibling elements carry no space in `textContent`). */
function words(el: Element): string {
  const out: string[] = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = (n.nodeValue ?? '').replace(/\s+/g, ' ').trim()
    if (t) out.push(t)
  }
  return out.join(' ')
}
const pct = (r: number): string => `${(r * 100).toFixed(0)}%`
// ===================================================================================================================
// THE FIXTURE – a real career through the real protocol, two careers on the device, an autosave pair and two named saves
// ===================================================================================================================

const NOW = (): number => Date.now()
const SEED = 'l2-11-more'
// ⚠ the slot names are what `sanitizeName` leaves of a typed name (lower case, `a-z0-9-` only, 24 characters) – the shape a real named save has
const NAMES = { other: 'Ines', saveOne: 'backup-one', saveTwo: 'before-the-final' }

type TabName = 'play' | 'saves' | 'about'
const TAB_INDEX: Record<TabName, number> = { play: 0, saves: 1, about: 2 }

interface Fixture {
  w: VueWrapper
  store: ReturnType<typeof useGameStore>
  activeId: string
  active: CareerMeta
  other: CareerMeta
  slots: SlotMeta[]
  peek: ReturnType<typeof vi.fn>
  imp: ReturnType<typeof vi.fn>
}

/** More, mounted ATTACHED (happy-dom resolves the stylesheet only for connected nodes), on `tab`, with a known device: two careers, four slots. */
async function mountMore(tab: TabName, opts: { snapshot?: boolean; persisted?: boolean | null; vp?: Viewport; peek?: SavePeek | null; kidName?: string } = {}): Promise<Fixture> {
  setViewport(opts.vp ?? PHONE)
  const store = useGameStore()
  const withCareer = opts.snapshot !== false
  if (withCareer) store.snapshot = careerSnapshot(4, SEED)
  const activeId = store.snapshot?.careerId ?? 'c-active'
  const active: CareerMeta = { careerId: activeId, kidName: opts.kidName ?? 'Mira', country: 'US', seed: SEED, createdAt: 1, lastPlayedAt: NOW() - 3 * 86_400_000, week: 4 }
  const other: CareerMeta = { careerId: 'c-ines', kidName: NAMES.other, country: 'ES', seed: 'ines-xgv7', createdAt: 1, lastPlayedAt: NOW() - 86_400_000, week: 400 }
  const slots: SlotMeta[] = [
    { slot: `auto:${activeId}:a`, careerId: activeId, savedAt: NOW() - 5 * 60_000, week: 4, seed: SEED, bytes: 20_480, revision: 5 },
    { slot: `auto:${activeId}:b`, careerId: activeId, savedAt: NOW() - 3 * 3_600_000, week: 3, seed: SEED, bytes: 20_000, revision: 4 },
    { slot: `manual:${activeId}:${NAMES.saveOne}`, careerId: activeId, savedAt: NOW() - 2 * 86_400_000, week: 2, seed: SEED, bytes: 1_536, revision: 3 },
    { slot: `manual:${activeId}:${NAMES.saveTwo}`, careerId: activeId, savedAt: NOW() - 86_400_000, week: 3, seed: SEED, bytes: 2_048, revision: 4 },
  ]
  store.careers = [active, other]
  store.slots = slots
  store.persisted = opts.persisted === undefined ? true : opts.persisted
  store.refreshCareers = async () => {}
  store.refreshSlots = async () => {}
  store.exportSave = vi.fn(async () => {}) as never
  const peek = vi.spyOn(store, 'peekSave').mockResolvedValue(opts.peek === undefined ? { careerId: 'c-ines', kidName: NAMES.other, week: 362 } : opts.peek)
  const imp = vi.spyOn(store, 'importSave').mockResolvedValue(undefined)
  const w = mount(MoreScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
  await w.findAll('.more-tabs .tab-pill')[TAB_INDEX[tab]]!.trigger('click')
  await flushPromises()
  return { w, store, activeId, active, other, slots, peek: peek as never, imp: imp as never }
}

const texts = (w: VueWrapper, selector: string): string[] => w.findAll(selector).map((n) => flat(n.text()))
const dialogEl = (): HTMLElement | null => document.querySelector<HTMLElement>('.dialog-overlay [role="dialog"]')
const dialogMessage = (): string => flat(dialogEl()?.querySelector('.dialog-message')?.textContent ?? null)
const dialogButtons = (): string[] => [...(dialogEl()?.querySelectorAll('.dialog-actions button') ?? [])].map((b) => flat(b.textContent))
const fmtDate = (ts: number): string => new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const startYear = (f: Fixture): number | undefined => f.store.snapshot?.startYear

/** Open each confirmation the screen can raise, the way a player does, and return [message, buttons] for it. */
async function ask(f: Fixture, which: 'load-career' | 'delete-career' | 'delete-slot' | 'restore' | 'overwrite' | 'import-unreadable' | 'import-replace' | 'import-add'): Promise<[string, string[]]> {
  const { w } = f
  // ⚠ SELECTED BY STRUCTURE, never by an English name: the same helper drives the xx sweep, where every accessible name is bracketed
  const otherRow = () => w.findAll('.career-row').find((r) => r.text().includes(NAMES.other))!
  if (which === 'load-career') await otherRow().findAll('button')[0]!.trigger('click')
  if (which === 'delete-career') await otherRow().findAll('button')[1]!.trigger('click')
  if (which === 'delete-slot') await w.get('table tbody tr:first-child td:last-child').findAll('button')[1]!.trigger('click')
  if (which === 'restore') await w.get('.save-row button.link').trigger('click')
  if (which === 'overwrite') {
    const input = w.get('input[type="text"]')
    await input.setValue(NAMES.saveOne)
    await input.element.parentElement!.querySelector('button')!.dispatchEvent(new Event('click'))
  }
  if (which.startsWith('import')) {
    const peek = which === 'import-unreadable' ? null : which === 'import-replace' ? { careerId: 'c-ines', kidName: NAMES.other, week: 362 } : { careerId: 'c-new', kidName: 'Noor', week: 120 }
    f.peek.mockResolvedValue(peek as never)
    const input = w.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [new File([new Uint8Array([1, 2, 3])], 'x.tsave')], configurable: true })
    await input.trigger('change')
  }
  await flushPromises()
  return [dialogMessage(), dialogButtons()]
}

// ===================================================================================================================
// 1 · PARITY – RU-13A, the Saves tab and its confirmations, as they shipped
// ===================================================================================================================

describe('L2-11 parity – the Saves tab as it shipped, with no catalog', () => {
  it('headings, the careers list, the slot list, the table, the controls and the two hints read exactly what they read before the wiring', async () => {
    const f = await mountMore('saves', { persisted: false })
    const { w } = f
    const yr = startYear(f)
    expect(texts(w, '.more-tabs .tab-pill')).toEqual(['Play', 'Saves', 'About'])
    expect(w.find('[aria-label="Which settings"]').exists()).toBe(true)
    expect(texts(w, 'h2')).toEqual(['Careers', 'Saves', 'Language', 'Danger zone'])
    // the careers list: the name, the active pill, the hint line (week label, age, last played), the two buttons and their accessible names
    const rows = w.findAll('.career-row')
    expect(rows.map((r) => words(r.get('.career-name').element))).toEqual([`Mira 🇺🇸 Active`, `${NAMES.other} 🇪🇸`])
    expect(flat(rows[0]!.get('.hint').text())).toBe(`${weekLabel(f.active.week, yr)} · age ${ageAtWeek(f.active.week)} · last played ${fmtDate(f.active.lastPlayedAt)}`)
    expect(flat(rows[1]!.get('.hint').text())).toBe(`${weekLabel(f.other.week, yr)} · age ${ageAtWeek(f.other.week)} · last played ${fmtDate(f.other.lastPlayedAt)}`)
    expect(rows[1]!.findAll('button').map((b) => [flat(b.text()), b.attributes('aria-label')])).toEqual([
      ['Load', `Load career – ${NAMES.other}`],
      ['Delete', `Delete career – ${NAMES.other}`],
    ])
    // the autosave row: its relative time and the restore control
    expect(words(w.get('.save-row').element)).toBe('Autosave 5 min ago Restore previous')
    // the named-saves table: its accessible name, the four headers, the cells (a size is one decimal and the unit `KB`), the two row buttons
    const table = w.get('table')
    expect(table.attributes('aria-label')).toBe('Named saves')
    expect(texts(w, 'table thead th')).toEqual(['Name', 'Saved', 'Week', 'Size', ''])
    const body = w.findAll('table tbody tr')
    expect(body).toHaveLength(2)
    expect(body.map((r) => r.findAll('td').slice(0, 4).map((c) => flat(c.text())))).toEqual([
      [NAMES.saveOne, fmtDate(f.slots[2]!.savedAt), weekLabel(2, yr), '1.5 KB'],
      [NAMES.saveTwo, fmtDate(f.slots[3]!.savedAt), weekLabel(3, yr), '2.0 KB'],
    ])
    expect(body[0]!.get('button').attributes('aria-label')).toBe(`Load save ${NAMES.saveOne}`)
    expect(flat(body[0]!.get('button').text())).toBe('Load')
    expect(body[0]!.find(`[aria-label="Delete save ${NAMES.saveOne}"]`).exists()).toBe(true)
    // the save-as row, the file row and the storage pill (best-effort) with the two hints under them
    const input = w.get('input[type="text"]')
    expect(input.attributes('placeholder')).toBe('save name')
    expect(input.attributes('aria-label')).toBe('Save name')
    expect(w.findAll('button').map((b) => flat(b.text()))).toEqual(expect.arrayContaining(['Save as…', 'Export to file', 'Import from file']))
    expect(flat(w.findAll('.pill').find((p) => p.text().startsWith('storage'))!.text())).toBe('storage: best-effort')
    const hints = texts(w, 'p.hint')
    expect(hints).toContain('Your browser may clear saves under storage pressure – export a backup file now and then.')
    expect(hints).toContain("Export files hold this career's readable data – name, progress, finances – so treat a backup like the personal file it is.")
    // the feedback control, the danger zone and its fast-forward, the dev switch
    expect(flat(w.get('button.primary').text())).toBe('Send feedback')
    expect(w.findAll('button').some((b) => flat(b.text()) === 'New career')).toBe(true)
    expect(w.findAll('button').some((b) => flat(b.text()) === '▶▶ 52 (dev)')).toBe(true)
    expect(flat(w.get('.dev-life-boost').text())).toBe(`▶ life events ×${LIFE_EVENT_BOOST_FACTOR} (dev)`)
    w.unmount()
  })

  it('the storage pill in its other two states, the relative-time ladder, and a device with no careers', async () => {
    const unknown = await mountMore('saves', { persisted: null })
    expect(flat(unknown.w.findAll('.pill').find((p) => p.text().startsWith('storage'))!.text())).toBe('storage: unknown')
    unknown.w.unmount()
    const persistent = await mountMore('saves', { persisted: true })
    expect(flat(persistent.w.findAll('.pill.ok').find((p) => p.text().startsWith('storage'))!.text())).toBe('storage: persistent')
    persistent.w.unmount()
    // relative time: just now, minutes, hours, days – each the old composition, a number printed as `String(n)`
    const ladder: [number, string][] = [[0, 'just now'], [7 * 60_000, '7 min ago'], [5 * 3_600_000, '5h ago'], [3 * 86_400_000, '3d ago'], [1_300 * 86_400_000, '1300d ago']]
    for (const [age, expected] of ladder) {
      const f = await mountMore('saves')
      // the row shows the NEWEST autosave, so the older generation moves back with it
      f.store.slots = f.slots.map((s, i) => (i === 0 ? { ...s, savedAt: NOW() - age } : i === 1 ? { ...s, savedAt: NOW() - age - 3_600_000 } : s))
      await nextTick()
      expect(flat(f.w.get('.save-row .hint').text()), `age ${age}ms`).toBe(expected)
      f.w.unmount()
    }
    const none = await mountMore('saves')
    none.store.careers = []
    none.store.slots = []
    await nextTick()
    expect(flat(none.w.get('section .hint').text())).toBe('No careers yet.')
    expect(flat(none.w.get('.save-row .hint').text())).toBe('none yet')
    none.w.unmount()
  })

  it('the eight confirmations: each message, its buttons and which of them is red', async () => {
    const expected: Record<Parameters<typeof ask>[1], [string, string[]]> = {
      'load-career': [`Load ${NAMES.other}'s career? Your currently active career stays saved.`, ['Cancel', 'Confirm']],
      'delete-career': [`Delete ${NAMES.other}'s career? This removes ALL of its saves – autosave and named – for good.`, ['Cancel', 'Delete']],
      'delete-slot': [`Delete the save "${NAMES.saveOne}"? There is no undo.`, ['Cancel', 'Delete']],
      restore: ['Restore the previous autosave? This replaces your current progress with the earlier generation.', ['Cancel', 'Confirm']],
      overwrite: [`A save named "${NAMES.saveOne}" already exists. Overwrite it?`, ['Cancel', 'Overwrite']],
      'import-unreadable': ['This file could not be read here. Import it anyway? If it holds a career you already have, importing replaces it – there is no undo.', ['Cancel', 'Import']],
      'import-replace': [
        `Overwrite ${NAMES.other}'s career? You have her at ${weekLabel(400)} and this file is ${weekLabel(362)}. The file becomes the career you play from now on – there is no undo.`,
        ['Cancel', 'Overwrite'],
      ],
      'import-add': [
        `Import Noor's career at ${weekLabel(120)}? It is not on this device, so nothing here is replaced – it is added alongside your careers and becomes the one you play. Your current career stays saved.`,
        ['Cancel', 'Import'],
      ],
    }
    for (const which of Object.keys(expected) as (keyof typeof expected)[]) {
      const f = await mountMore('saves')
      const got = await ask(f, which)
      expect(got, which).toEqual(expected[which])
      const danger = ['delete-career', 'delete-slot', 'overwrite', 'import-replace'].includes(which)
      expect(dialogEl()!.querySelector('.dialog-actions .danger') !== null, `${which}: the red button is for the irreversible ones only`).toBe(danger)
      f.w.unmount()
    }
  })

  it('the status row in every state: pending, done and failed (with Retry) for each of the six operations, and the store\'s own error text is untouched', async () => {
    const OPS: Record<string, string> = { save: 'Save', load: 'Load', delete: 'Delete save', 'delete-career': 'Delete career', export: 'Export', import: 'Import' }
    const f = await mountMore('saves')
    await f.w.findAll('button').find((b) => b.text() === 'Export to file')!.trigger('click') // arms Retry (the tracked operation)
    for (const [op, label] of Object.entries(OPS)) {
      f.store.saveOp = { op: op as never, status: 'pending' }
      await nextTick()
      expect(flat(f.w.get('.save-op-row').text()), `${op} pending`).toBe(`${label}…`)
      f.store.saveOp = { op: op as never, status: 'ok' }
      await nextTick()
      expect(flat(f.w.get('.save-op-row').text()), `${op} done`).toBe(`${label} – done`)
      f.store.saveOp = { op: op as never, status: 'error', message: 'The disk said no (E-1)' }
      await nextTick()
      expect(flat(f.w.get('.save-op-row').text()), `${op} failed`).toBe(`${label} failed – The disk said no (E-1) Retry`)
    }
    f.w.unmount()
  })
})

// ===================================================================================================================
// 1 · PARITY – RU-13B, the Play tab and the About block, as they shipped
// ===================================================================================================================

describe('L2-11 parity – the Play tab and the About block as they shipped, with no catalog', () => {
  it('Play: every section, label, hint, switch state and option pill', async () => {
    const f = await mountMore('play')
    const { w } = f
    expect(texts(w, 'h2')).toEqual(['Sound', 'Week story', 'The weight', 'Interface tour', 'Calendar animation', 'Match playback'])
    const rows = w.findAll('.career-row').map((r) => words(r.element))
    expect(rows[0]).toBe('Sound effects ON')
    expect(rows[1]).toBe('Music ON')
    expect(rows[2]).toMatch(/^Haptics (Not supported on this device )?ON$/)
    expect(rows[3]).toBe('Open at the end of a week Off: the story stays on the This week tab – tap over whenever you like ON')
    expect(rows[5]).toBe('The coach marks for new players Walks the header, the cards and every tab, one tap at a time Show the tour')
    expect(rows[6]).toBe('Cross out the days Off: the week plays straight through, as before ON')
    expect(rows[7]).toBe('Pace Brisk 3s Gentle 5s')
    expect(rows[8]).toBe('Speed How fast a match plays when it opens 1× 2× 4×')
    expect(rows[9]).toBe('How much to watch Full: every point · Key: key points only · Skip: straight to the result Full Key Skip')
    // the pills carry the viewer's titles
    expect(w.findAll('.option-pill').filter((p) => p.attributes('title')).map((p) => p.attributes('title'))).toEqual(['Every point', 'Key points only', 'Skip to the result'])
    // the switches say ON/OFF and keep their roles and names
    await w.findAll('.sound-switch')[0]!.trigger('click')
    expect(flat(w.findAll('.sound-switch-label')[0]!.text())).toBe('OFF')
    await w.findAll('.sound-switch')[0]!.trigger('click') // …and back: the preference is module state in this runner, and the next test reads it
    expect(w.findAll('[role="switch"]').map((s) => s.attributes('aria-labelledby'))).toEqual(['more-sfx-label', 'more-music-label', 'more-haptics-label', 'more-weekstory-label', 'more-weight-label', 'more-daycross-label'])
    // the shared tables read as they always did
    expect([AUDIO_COPY.sfx, AUDIO_COPY.music]).toEqual(['Sound effects', 'Music'])
    expect([DAY_CROSS_PACE_LABEL.brisk, DAY_CROSS_PACE_LABEL.gentle]).toEqual(['Brisk 3s', 'Gentle 5s'])
    expect([MATCH_SPEED_LABEL[1], MATCH_SPEED_LABEL[2], MATCH_SPEED_LABEL[4]]).toEqual(['1×', '2×', '4×'])
    expect([MATCH_VIEW_LABEL.full, MATCH_VIEW_LABEL.key, MATCH_VIEW_LABEL.skip]).toEqual(['Full', 'Key', 'Skip'])
    expect([MATCH_VIEW_TITLE.full, MATCH_VIEW_TITLE.key, MATCH_VIEW_TITLE.skip]).toEqual(['Every point', 'Key points only', 'Skip to the result'])
    w.unmount()
  })

  it('Play with the sweep off hides the pace row; with no career the weight section is absent', async () => {
    const f = await mountMore('play', { snapshot: false })
    expect(texts(f.w, 'h2')).not.toContain('The weight')
    await f.w.findAll('.sound-switch')[4]!.trigger('click') // the calendar switch (the weight row is absent with no career)
    expect(f.w.findAll('.career-row').map((r) => words(r.element)).some((t) => t.startsWith('Pace'))).toBe(false)
    await f.w.findAll('.sound-switch')[4]!.trigger('click') // …and back on: the preference is module state in this runner, and the next test reads it
    f.w.unmount()
  })

  it('About: the heading, the table, the product mark, the seed button, the privacy row, the two links and the build line', async () => {
    const f = await mountMore('about')
    const { w } = f
    expect(texts(w, 'h2')).toEqual(['About'])
    expect(w.get('table').attributes('aria-label')).toBe('About this app')
    expect(w.findAll('table tr').map((r) => words(r.element))).toEqual([
      'App Ties Break Ace Parent',
      `Save schema v${f.store.snapshot!.schemaVersion}`,
      `Seed ${SEED} 📋`,
      'Privacy Everything stays on this device – no accounts, no analytics. Privacy note · GitHub Issues',
    ])
    expect(w.get('.seed-value').attributes('title')).toBe('Copy seed')
    expect(w.findAll('a').map((a) => [flat(a.text()), a.attributes('href')])).toEqual([
      ['Privacy note', 'https://github.com/letulip/ties-break/blob/main/PRIVACY.md'],
      ['GitHub Issues', 'https://github.com/letulip/ties-break/issues'],
    ])
    // the build line: the frame is the old one and the SHA / date / schema are the baked constants, unlocalised
    expect(flat(w.get('.build-line').text())).toBe(`Build ${shortSha(RAW_BUILD_SHA)} · ${buildDay(RAW_BUILD_DATE)} · save schema v${SAVE_SCHEMA_VERSION}`)
    expect(buildLine('0123abc9999', '2026-10-08', 66)).toBe('Build 0123abc · 2026-10-08 · save schema v66')
    expect(buildLine(undefined, 'not a date', 66)).toBe('Build unknown · unknown · save schema v66')
    w.unmount()
  })
})

// ===================================================================================================================
// 1 · PARITY – the feedback dialog and the report it assembles (RU-15 F01–F16)
// ===================================================================================================================

describe('L2-11 parity – the feedback dialog and its report as they shipped, with no catalog', () => {
  it('the sixteen F-rows read the English they read as constants', async () => {
    expect([
      FEEDBACK_LABEL(),
      FEEDBACK_HOLDS_LINE(),
      FEEDBACK_SAVE_LINE(),
      FEEDBACK_SAVE_PENDING_LINE(),
      FEEDBACK_PRIVACY_LINE(),
      FEEDBACK_SEND_LABEL(),
      FEEDBACK_CLOSE_LABEL(),
      feedbackAddressLine(),
      REPORT_SUBJECT(),
      REPORT_ATTACH_LINE(),
      REPORT_NO_CAREER_LINE(),
      REPORT_TAIL_HEADING(),
      REPORT_NO_ERRORS_LINE(),
      REPORT_TRUNCATED_LINE(),
      errorCountLine(1),
      errorCountLine(7),
    ]).toEqual([
      'Send feedback',
      'The report contains:',
      'The save of the active career',
      'Checking for a save…',
      'Nothing is sent until you choose where to send it.',
      'Send',
      'Close',
      `Send it to ${FEEDBACK_ADDRESS}`,
      'Ties Break feedback',
      'Please attach the save file that was just downloaded before sending this email.',
      'No save is attached: no career is open, or it could not be read.',
      'Recent errors, newest first:',
      'No errors were recorded in this session.',
      '[The rest was cut to fit an email link.]',
      '1 recent error',
      '7 recent errors',
    ])
    expect(errorCountLine(0)).toBe('No errors were recorded in this session.')
    expect(FEEDBACK_ADDRESS).toBe('feedback@ties-break.com')
  })

  it('the report text with no career: the build line, the no-save sentence, a blank line, and the empty-ring sentence', async () => {
    const report = await assembleReport()
    expect(report.file).toBeNull()
    const lines = report.text.split('\n')
    expect(lines[0]).toBe(`Build ${shortSha(RAW_BUILD_SHA)} · ${buildDay(RAW_BUILD_DATE)} · save schema v${SAVE_SCHEMA_VERSION}`)
    expect(lines[1]).toBe('No save is attached: no career is open, or it could not be read.')
    expect(lines[2]).toBe('')
  })

  it('the dialog opened from More, in its ready state and in its attach state', async () => {
    const f = await mountMore('saves')
    await f.w.get('button.primary').trigger('click')
    await flushPromises()
    const card = dialogEl()!
    expect(flat(card.querySelector('.dialog-title')!.textContent)).toBe('Send feedback')
    expect(flat(card.querySelector('.feedback-lead')!.textContent)).toBe('The report contains:')
    expect([...card.querySelectorAll('li')].map((li) => flat(li.textContent))).toEqual([
      `Build ${shortSha(RAW_BUILD_SHA)} · ${buildDay(RAW_BUILD_DATE)} · save schema v${SAVE_SCHEMA_VERSION}`,
      'No errors were recorded in this session.',
      'No save is attached: no career is open, or it could not be read.',
    ])
    expect([...card.querySelectorAll('.hint')].map((p) => flat(p.textContent))).toEqual([`Send it to ${FEEDBACK_ADDRESS}`, 'Nothing is sent until you choose where to send it.'])
    expect([...card.querySelectorAll('.dialog-actions button')].map((b) => flat(b.textContent))).toEqual(['Close', 'Send'])
    f.w.unmount()
  })
})

// ===================================================================================================================
// 2 · COMPLETENESS
// ===================================================================================================================

const HOMES = [
  'src/components/screens/MoreScreen.vue',
  'src/feedback.ts',
  'src/composables/audioCopy.ts',
  'src/composables/dayCross.ts',
  'src/composables/matchDefaults.ts',
  'src/composables/buildInfo.ts',
] as const

describe('L2-11 completeness – the chrome is wired; the date formatter and the store\'s error text are left raw on purpose (the shared dialog\'s defaults were wired by L4-2b)', () => {
  it('no CERTAIN string homed in the six modules is left unwrapped', () => {
    for (const home of HOMES) {
      const unwrapped = Object.entries(CATALOG.keys).filter(([, v]) => v.home.includes(home) && !v.wrapped).map(([k]) => k)
      expect(unwrapped, home).toEqual([])
    }
    // …and the dialog (whose sentences live in feedback.ts) carries no literal copy of its own
    expect(Object.entries(CATALOG.keys).filter(([, v]) => v.home.includes('src/components/FeedbackDialog.vue'))).toEqual([])
  })

  it('the keys the family wakes exist as wired keys in the right homes, the shared ones with BOTH homes', () => {
    const wired = (k: string): boolean => CATALOG.keys[k]?.wrapped === true
    for (const k of [
      'op|Save', 'op|Load', 'op|Delete save', 'op|Delete career', 'op|Export', 'op|Import', 'saves|Name', 'friendly|Seed', 'view|Skip',
      '{0}…', '{0} – done', '{0} failed – {1}', '{0} min ago', '{0}h ago', '{0}d ago', 'just now', '{0} KB', 'storage: unknown', 'storage: persistent', 'storage: best-effort',
      '{0} · age {1} · last played {2}', 'Load career – {0}', 'Delete career – {0}', 'Load save {0}', 'Delete save {0}',
      "Load {0}'s career? Your currently active career stays saved.",
      'Delete the save "{0}"? There is no undo.',
      'A save named "{0}" already exists. Overwrite it?',
      'Build {0} · {1} · save schema v{2}', 'unknown', 'Send it to {0}', '{0} recent errors', '1 recent error', 'Which settings', '▶ life events ×{0} (dev)',
    ]) {
      expect(wired(k), k).toBe(true)
    }
    // the viewer's keys are SHARED with the settings pickers (L2-8): same words, one key, two homes
    for (const k of ['1×', '2×', '4×', 'Full', 'Key', 'Every point', 'Key points only', 'Skip to the result']) {
      expect(CATALOG.keys[k]?.home, k).toEqual(expect.arrayContaining(['src/components/MatchControls.vue', 'src/composables/matchDefaults.ts']))
    }
    expect(CATALOG.keys.Close?.home).toContain('src/feedback.ts')
    expect(CATALOG.keys['Ties Break']?.home).toContain('src/components/screens/MoreScreen.vue')
    expect(CATALOG.keys['Ace Parent']?.home).toContain('src/components/screens/MoreScreen.vue')
    // `storage: {0}` (the census's reading of the old conditional) gave way to the three whole messages
    expect(CATALOG.keys['storage: {0}']).toBeUndefined()
  })

  it('left raw on purpose, and asserted raw: the date formatter, the store\'s error text, and no engine edge – and the shared dialog\'s defaults are read through t()', () => {
    const more = SRC('src/components/screens/MoreScreen.vue')
    // the last-played and saved dates keep ONE form across locales until the formatter rows are approved (§9.6)
    expect(more).toContain("toLocaleString('en-GB'")
    // the error text is a HOLE of the frame, not a key of its own – ⭐ L3-7 (10.10) RE-AIM, NOT RELAXED: it used to be the store's raw English («RU-13A asks for typed error codes: a classifier, not this wave»);
    // this is that wave, so the hole is now read THROUGH THE SENTENCE'S CODE (`errorText`): a code the build knows is the `t()` of that very sentence, any other is the raw message as before
    // (tests/i18n-l3-7-errors.test.ts holds each key equal to the engine's / the store's own spelling; tests/component/i18n-l3-7-errors-display.test.ts mounts it)
    expect(more).toContain("t('{0} failed – {1}', [OP_LABEL[game.saveOp.op], errorText(game.saveOp.code, game.saveOp.message ?? '')])")
    // ⭐ L4-2b (10.10) RE-AIM, NOT RELAXED. The shared dialog's own defaults were «left raw on purpose» (L2-6: its `Cancel` is a conflict between tables, his call) and this pin asserted the
    // file held no `t(` at all. The carpet then found the one caller that relies on them (the inbox's sign question), so they are wired – as COMPUTED defaults over the BARE keys `Cancel`
    // and `Confirm` (what every other wired caller of the bare word says; no context tag was needed), not as prop defaults (Vue resolves a prop default once per instance, so it could
    // neither carry a call the extractor reads nor follow a locale flip). The conflict is not decided here: a caller that passes its own label – More does, `plan|Cancel` does – is untouched.
    const confirm = SRC('src/components/ConfirmDialog.vue')
    expect(confirm).toContain("props.cancelLabel ?? t('Cancel')")
    expect(confirm).toContain("props.confirmLabel ?? t('Confirm')")
    expect(confirm, 'the props carry no English default any more – the whole defaults object is the boolean').toContain('  { danger: false },\n)')
    expect(more).toContain(`:cancel-label="t('Cancel')"`)
    // the build line's identifiers are never keys
    expect(SRC('src/composables/buildInfo.ts')).toContain('shaOrNull(rawSha) ?? t(\'unknown\')')
    // nothing in the engine, the worker or shared learned a `t()` from this wave
    for (const f of ['src/shared/dates.ts', 'src/shared/money.ts', 'src/engine/world.ts']) expect(SRC(f), f).not.toMatch(/from '[^']*i18n'/)
  })

  it('a confirmation is a READER, not a held string: the message and the confirm label are thunks the template calls', () => {
    const more = SRC('src/components/screens/MoreScreen.vue')
    expect(more).toContain('message: () => string')
    expect(more).toContain(':message="pendingConfirm.message()"')
    expect(more).toContain('confirmLabel?: () => string')
  })
})

// ===================================================================================================================
// 3 · THE SEAMS – a flip re-labels a MOUNTED screen and an OPEN confirmation; names, seeds, weeks, dates and sizes stay as they were
// ===================================================================================================================

describe('L2-11 seams – a flip re-labels a mounted More and a blocking confirmation that is already open', () => {
  it('Saves: headings, the list, the table, the status row and an open Delete-career card follow the locale; what the player and the engine wrote does not', async () => {
    const f = await mountMore('saves')
    const { w } = f
    const yr = startYear(f)
    const before = {
      nameCells: texts(w, 'table tbody td:first-child'),
      dates: texts(w, 'table tbody td:nth-child(2)'),
      weeks: texts(w, 'table tbody td:nth-child(3)'),
      names: w.findAll('.career-name').map((n) => words(n.element)),
    }
    await w.get(`button[aria-label="Delete career – ${NAMES.other}"]`).trigger('click')
    await flushPromises()
    expect(dialogMessage()).toBe(`Delete ${NAMES.other}'s career? This removes ALL of its saves – autosave and named – for good.`)
    installCatalog('ru', {
      Careers: 'CAREERS-H',
      Saves: 'SAVES-H',
      Autosave: 'AUTOSAVE',
      'Restore previous': 'RESTORE-PREV',
      'Named saves': 'NAMED-SAVES',
      'saves|Name': 'COL-NAME',
      Saved: 'COL-SAVED',
      Size: 'COL-SIZE',
      '{0} KB': '{0} KB-X',
      '{0} min ago': '{0} MIN-AGO',
      Active: 'ACTIVE-PILL',
      Load: 'LOAD-B',
      Delete: 'DELETE-B',
      Cancel: 'CANCEL-B',
      'Load career – {0}': 'LOAD-CAREER<{0}>',
      'Delete career – {0}': 'DEL-CAREER<{0}>',
      "Delete {0}'s career? This removes ALL of its saves – autosave and named – for good.": 'DELETE-CAREER?<{0}>',
      'storage: persistent': 'STORAGE-P',
      'op|Save': 'OP-SAVE',
      'op|Load': 'OP-LOAD',
      'op|Delete save': 'OP-DELSAVE',
      'op|Delete career': 'OP-DELCAREER',
      'op|Export': 'OP-EXPORT',
      'op|Import': 'OP-IMPORT',
      '{0} failed – {1}': 'FAILED<{0}|{1}>',
      Retry: 'RETRY-B',
      'Danger zone': 'DANGER-H',
      'Which settings': 'WHICH-SETTINGS',
    })
    await setLocale('ru')
    await nextTick()
    // the OPEN card re-labelled in place: its message and both buttons
    expect(dialogMessage()).toBe(`DELETE-CAREER?<${NAMES.other}>`)
    expect(dialogButtons()).toEqual(['CANCEL-B', 'DELETE-B'])
    expect(texts(w, 'h2').slice(0, 2)).toEqual(['CAREERS-H', 'SAVES-H'])
    expect(w.find('[aria-label="WHICH-SETTINGS"]').exists()).toBe(true)
    expect(words(w.get('.save-row').element)).toBe('AUTOSAVE 5 MIN-AGO RESTORE-PREV')
    expect(w.get('table').attributes('aria-label')).toBe('NAMED-SAVES')
    expect(texts(w, 'table thead th').slice(0, 4)).toEqual(['COL-NAME', 'COL-SAVED', 'Week', 'COL-SIZE'])
    expect(texts(w, 'table tbody td:nth-child(4)')).toEqual(['1.5 KB-X', '2.0 KB-X'])
    expect(w.get('.career-row .pill').text()).toBe('ACTIVE-PILL')
    expect(w.findAll('.career-row')[1]!.findAll('button').map((b) => [flat(b.text()), b.attributes('aria-label')])).toEqual([
      ['LOAD-B', `LOAD-CAREER<${NAMES.other}>`],
      ['DELETE-B', `DEL-CAREER<${NAMES.other}>`],
    ])
    expect(w.find(`[aria-label="Load save ${NAMES.saveOne}"]`).exists()).toBe(true) // no catalog row in the stand-in for this one: still English, and still carrying the player's save name
    // what the player and the engine wrote is exactly as it was: save names, saved-at dates, week labels, career names and flags
    expect(texts(w, 'table tbody td:first-child')).toEqual(before.nameCells)
    expect(texts(w, 'table tbody td:nth-child(2)')).toEqual(before.dates)
    expect(texts(w, 'table tbody td:nth-child(3)')).toEqual(before.weeks)
    expect(before.weeks[0]).toBe(weekLabel(2, yr))
    expect(w.findAll('.career-name').map((n) => words(n.element).replace('ACTIVE-PILL', 'Active'))).toEqual(before.names.map((n) => n))
    // the status row: the operation noun is the `op|` key, the failure text stays the store's own words
    f.store.saveOp = { op: 'export', status: 'error', message: 'The disk said no (E-1)' }
    await nextTick()
    expect(flat(w.get('.save-op-row').text())).toBe('FAILED<OP-EXPORT|The disk said no (E-1)>')
    // every one of the six nouns is its own `op|` key – none fell back to the button's verb
    const NOUNS: Record<string, string> = { save: 'OP-SAVE', load: 'OP-LOAD', delete: 'OP-DELSAVE', 'delete-career': 'OP-DELCAREER', export: 'OP-EXPORT', import: 'OP-IMPORT' }
    for (const [op, marker] of Object.entries(NOUNS)) {
      f.store.saveOp = { op: op as never, status: 'error', message: 'x' }
      await nextTick()
      expect(flat(w.get('.save-op-row').text()), op).toBe(`FAILED<${marker}|x>`)
    }
    w.unmount()
  })

  it('Play and About: switches, pills, headings and the build line follow the locale; the SHA, the date, the schema and the seed do not', async () => {
    const f = await mountMore('play')
    installCatalog('ru', {
      Sound: 'SOUND-H',
      'Sound effects': 'SFX-L',
      Music: 'MUSIC-L',
      ON: 'ON-X',
      OFF: 'OFF-X',
      'Brisk 3s': 'BRISK-X',
      'Gentle 5s': 'GENTLE-X',
      '1×': 'ONE-X',
      Full: 'FULL-X',
      'view|Skip': 'SKIP-X',
      'Skip to the result': 'SKIP-TITLE-X',
      'Match playback': 'PLAYBACK-H',
      About: 'ABOUT-X',
      'Build {0} · {1} · save schema v{2}': 'BUILD<{0}|{1}|{2}>',
      Seed: 'SEED-X',
      'Copy seed': 'COPY-SEED-X',
      'Ties Break': 'TB-X',
    })
    await setLocale('ru')
    await nextTick()
    expect(texts(f.w, 'h2')[0]).toBe('SOUND-H')
    expect(texts(f.w, 'h2')).toContain('PLAYBACK-H')
    expect(words(f.w.findAll('.career-row')[0]!.element)).toBe('SFX-L ON-X')
    expect(words(f.w.findAll('.career-row')[1]!.element)).toBe('MUSIC-L ON-X')
    expect(texts(f.w, '.option-pill')).toEqual(['BRISK-X', 'GENTLE-X', 'ONE-X', '2×', '4×', 'FULL-X', 'Key', 'SKIP-X'])
    expect(f.w.findAll('.option-pill').filter((p) => p.attributes('title')).map((p) => p.attributes('title'))).toEqual(['Every point', 'Key points only', 'SKIP-TITLE-X'])
    await f.w.findAll('.more-tabs .tab-pill')[2]!.trigger('click')
    await flushPromises()
    expect(flat(f.w.get('.build-line').text())).toBe(`BUILD<${shortSha(RAW_BUILD_SHA)}|${buildDay(RAW_BUILD_DATE)}|${SAVE_SCHEMA_VERSION}>`)
    expect(texts(f.w, 'table th')).toEqual(['App', 'Save schema', 'SEED-X', 'Privacy'])
    expect(f.w.get('.seed-value').attributes('title')).toBe('COPY-SEED-X')
    expect(flat(f.w.get('.seed-value').text())).toBe(`${SEED} 📋`) // the seed is an identifier – untouched
    expect(words(f.w.findAll('table tr')[0]!.element)).toBe('App TB-X Ace Parent')
    f.w.unmount()
  })

  it('the feedback card follows the locale while it is open, and its report text is composed in the language it was opened in', async () => {
    const f = await mountMore('saves')
    await f.w.get('button.primary').trigger('click')
    await flushPromises()
    installCatalog('ru', { 'The report contains:': 'CONTAINS-X', Close: 'CLOSE-X', Send: 'SEND-X', 'Send it to {0}': 'SEND-TO<{0}>', 'Send feedback': 'FEEDBACK-X', 'Build {0} · {1} · save schema v{2}': 'BUILD<{0}|{1}|{2}>' })
    await setLocale('ru')
    await nextTick()
    const card = dialogEl()!
    expect(flat(card.querySelector('.dialog-title')!.textContent)).toBe('FEEDBACK-X')
    expect(flat(card.querySelector('.feedback-lead')!.textContent)).toBe('CONTAINS-X')
    expect([...card.querySelectorAll('.dialog-actions button')].map((b) => flat(b.textContent))).toEqual(['CLOSE-X', 'SEND-X'])
    expect(flat(card.querySelectorAll('.hint')[0]!.textContent)).toBe(`SEND-TO<${FEEDBACK_ADDRESS}>`)
    expect(flat(card.querySelectorAll('li')[0]!.textContent)).toBe(`BUILD<${shortSha(RAW_BUILD_SHA)}|${buildDay(RAW_BUILD_DATE)}|${SAVE_SCHEMA_VERSION}>`)
    // the report is assembled when the dialog OPENS (an iOS gesture law), so a card opened in English keeps an English report; one assembled now speaks the new language
    const report = await assembleReport()
    expect(report.text.split('\n')[0]).toBe(`BUILD<${shortSha(RAW_BUILD_SHA)}|${buildDay(RAW_BUILD_DATE)}|${SAVE_SCHEMA_VERSION}>`)
    f.w.unmount()
  })
})

// ===================================================================================================================
// 4 · THE CONTEXT TAGS – measured with the importer's own row reader and his tables
// ===================================================================================================================

describe('L2-11 context tags – four decisions, nine tagged keys, and the bare ones, each measured against every batch table', () => {
  it('⚠ THE OPERATION NOUNS: RU-13A\'s status row writes six NOUNS in one cell; two of them collide with a VERB on the same screen, so the family takes one tag', () => {
    const [english, russian] = cellsOf('ru-saves-settings-2026-10.md', '(`OP_LABEL`)')
    const en = parts(english!.replace(' (OP_LABEL)', ''))
    const ru = parts(russian!)
    expect(en).toEqual(['Save', 'Load', 'Delete save', 'Delete career', 'Export', 'Import'])
    expect(ru).toHaveLength(6)
    // `Load` the button has a clean row and a Russian; the noun in the status row is a DIFFERENT Russian
    const verb = rowsFor('Load')
    expect(verb.length).toBeGreaterThanOrEqual(1)
    expect(new Set(verb.map((r) => r.russian)).size).toBe(1)
    expect(ru[1]).not.toBe(verb[0]!.russian)
    // `Import` the confirmation's VERB has no clean row of its own; the shell table's verb phrase for the same act is a different word from the noun
    const importFile = rowsFor('Import a save file')
    expect(importFile).toHaveLength(1)
    expect(importFile[0]!.russian).not.toBe(ru[5])
    // the tagged keys exist; the bare `Load` and `Import` stay the buttons'
    for (const k of ['op|Save', 'op|Load', 'op|Delete save', 'op|Delete career', 'op|Export', 'op|Import']) expect(CATALOG.keys[k]?.home, k).toEqual(['src/components/screens/MoreScreen.vue'])
    expect(CATALOG.keys.Load?.home).toEqual(['src/components/screens/MoreScreen.vue'])
    expect(CATALOG.keys.Import?.home).toEqual(['src/components/screens/MoreScreen.vue'])
  })

  it('⚠ THE NAME TRAP: the saves table\'s column `Name` and the wizard\'s summary term `Name` are two Russians – the column takes `saves|Name`', () => {
    const [columnsEn, columnsRu] = cellsOf('ru-saves-settings-2026-10.md', 'columns `Name`')
    const columns = parts(columnsEn!.replace('columns ', ''))
    const russianColumns = parts(columnsRu!)
    expect(columns).toEqual(['Name', 'Saved', 'Week', 'Size'])
    const wizard = rowsFor('Name')
    expect(wizard).toHaveLength(1)
    expect(wizard[0]!.doc).toContain('onboarding')
    expect(russianColumns[0]).not.toBe(wizard[0]!.russian)
    expect(CATALOG.keys.Name?.home).toContain('src/components/OnboardingWizard.vue')
    expect(CATALOG.keys.Name?.home).not.toContain('src/components/screens/MoreScreen.vue')
    expect(CATALOG.keys['saves|Name']?.home).toEqual(['src/components/screens/MoreScreen.vue'])
    // …while `Week` agrees across the two tables, so the column header stays on the bare key
    expect(rowsFor('Week')).toHaveLength(1)
    expect(russianColumns[2]).toBe(rowsFor('Week')[0]!.russian)
    expect(CATALOG.keys.Week?.home).toContain('src/components/screens/MoreScreen.vue')
  })

  it('⚠ THE SEED TRAP: the About row `Seed` and the friendly match\'s seed field are two surfaces with two Russians – the BARE key follows the one CLEAN row (About\'s), so the FIELD takes `friendly|Seed`', () => {
    const about = rowsFor('Seed')
    expect(about, 'RU-13B\'s is the only clean row for the word').toHaveLength(1)
    expect(about[0]!.doc).toContain('play-about-settings')
    const friendly = cellsOf('ru-season-tournaments-2026-10.md', 'RU04-F06')
    expect(friendly[1], 'the field\'s row is DESCRIBED, not quoted: its English cell can never join a key').toBe('seed field label')
    expect(friendly[2]).not.toBe(about[0]!.russian)
    // the importer joins a clean row to the bare key – so the bare key must be About\'s, or the About Russian would land on the field silently
    expect(CATALOG.keys.Seed?.home).toEqual(['src/components/screens/MoreScreen.vue'])
    expect(CATALOG.keys['friendly|Seed']?.home).toEqual(['src/components/screens/SeasonScreen.vue'])
    expect(CATALOG.keys['about|Seed']).toBeUndefined()
  })

  it('⚠ THE SKIP TRAP: the settings pill `Skip` (its compact word) and the tournament flow\'s `Skip` button are two Russians – the pill takes `view|Skip`', () => {
    const pills = parts(cellsOf('ru-play-about-settings-2026-10.md', 'amount pills')[2]!)
    expect(pills).toHaveLength(3)
    const tournament = rowsFor('Skip')
    expect(tournament).toHaveLength(1)
    expect(tournament[0]!.doc).toContain('season-tournaments')
    expect(pills[2]).not.toBe(tournament[0]!.russian)
    expect(CATALOG.keys.Skip?.home).toEqual(['src/components/TournamentFlow.vue'])
    expect(CATALOG.keys['view|Skip']?.home).toEqual(['src/composables/matchDefaults.ts'])
    // `Full` and `Key` agree with RU-08's compact words, so they SHARE the viewer's keys
    const viewer = cellsOf('ru-match-viewer-commentary-2026-10.md', 'Every point` / `Full')
    expect(pills[0]).toBe(viewer[2])
    const viewerKey = cellsOf('ru-match-viewer-commentary-2026-10.md', 'Key points only` / `Key')
    expect(pills[1]).toBe(viewerKey[2])
    // …and the three FULL titles on the settings pills are RU-08's own words (the settings row's cell says so: «(RU-08)»)
    const titles = parts(cellsOf('ru-play-about-settings-2026-10.md', 'pill titles')[2]!.replace(' (RU-08)', ''))
    expect(titles.slice(0, 2)).toEqual([viewer[1], viewerKey[1]])
    expect(titles[2]).toBe(rowsFor('Skip to the result')[0]!.russian)
    // the speed words are the same compact forms in both tables
    const speeds = parts(cellsOf('ru-play-about-settings-2026-10.md', 'speed pills')[2]!)
    expect(speeds).toEqual(['Normal speed', 'Double speed', 'Quadruple speed'].map((row) => cellsOf('ru-match-viewer-commentary-2026-10.md', row)[2]))
  })

  it('bare because every table agrees: Delete, Retry, Close, Confirm, Overwrite; and `Cancel` stays bare although two tables disagree – the L2-6 decision (his call) stands', () => {
    for (const english of ['Delete', 'Retry', 'Close', 'Confirm', 'Overwrite', 'Saves', 'About', 'Careers', 'Active', 'Speed', 'Pace', 'Sound', 'Music', 'Haptics', 'Privacy', 'App', 'unknown']) {
      const rows = rowsFor(english)
      expect(rows.length, english).toBeGreaterThanOrEqual(1)
      expect(new Set(rows.map((r) => r.russian)).size, english).toBe(1)
    }
    const cancel = rowsFor('Cancel')
    expect(cancel.length).toBeGreaterThanOrEqual(4)
    expect(new Set(cancel.map((r) => r.russian)).size, 'two Russians across the tables: reported, not frozen by a tag').toBe(2)
    // …More's own `Cancel` is the bare key; the one tag this word already has belongs to the planner's sheet, homed elsewhere
    expect(CATALOG.keys.Cancel?.home).toContain('src/components/screens/MoreScreen.vue')
    expect(CATALOG.keys['plan|Cancel']?.home).not.toContain('src/components/screens/MoreScreen.vue')
    // the dialog's own sentences have one row each and no second reader
    for (const english of ['The report contains:', 'Checking for a save…', 'Ties Break feedback', 'Recent errors, newest first:']) expect(rowsFor(english), english).toHaveLength(1)
  })
})

// ===================================================================================================================
// 5 · THE RUSSIAN SMOKE – ru.json read by key, no Cyrillic typed here
// ===================================================================================================================

describe('L2-11 Russian smoke – ru.json read by key, no Cyrillic typed here', () => {
  it('⭐ L4-3 (RU-13C) – the privacy row is locale-aware: under ru the link still names the English document, because the Russian slot is empty until his policy rows land', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const f = await mountMore('about')
    expect(f.w.findAll('a').map((a) => a.attributes('href'))).toEqual([privacyUrl('en'), 'https://github.com/letulip/ties-break/issues'])
    expect(privacyUrl('ru')).toBe(privacyUrl('en'))
    f.w.unmount()
  })

  it('⭐ no RU-13A / RU-13B / RU-15 row is approved yet: the product mark (an identity row) is the only approved word wired on More, and every other word renders English and is counted', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const wired = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.includes('src/components/screens/MoreScreen.vue')).sort()
    expect(wired, 'exactly the two identity rows of the product mark are approved AND wired on More').toEqual(['Ace Parent', 'Ties Break'])
    const f = await mountMore('about')
    expect(words(f.w.findAll('table tr')[0]!.element)).toBe(`App ${RU['Ties Break']} ${RU['Ace Parent']}`) // identity: the brand is itself in both languages
    expect(texts(f.w, 'h2')).toEqual(['About']) // no approved row → English, counted
    expect(missedKeys()).toEqual(expect.arrayContaining(['About', 'About this app', 'Privacy', 'Save schema', 'Build {0} · {1} · save schema v{2}']))
    expect(missedKeys()).not.toEqual(expect.arrayContaining(['Ties Break', 'Ace Parent']))
    const aboutMisses = missedKeys().length
    f.w.unmount()
    resetMisses()
    const saves = await mountMore('saves')
    const playOnSaves = missedKeys().length
    saves.w.unmount()
    resetMisses()
    const play = await mountMore('play')
    const playMisses = missedKeys().length
    play.w.unmount()
    console.log(
      `[L2-11 smoke] ru.json: ${Object.keys(RU).length} keys; approved AND wired on More: ${wired.length} -> «${RU['Ties Break']}» «${RU['Ace Parent']}» (identity rows); ` +
        `distinct misses: About ${aboutMisses}, Saves ${playOnSaves}, Play ${playMisses}; none of RU-13A / RU-13B / RU-15 is approved`,
    )
    expect(aboutMisses).toBeGreaterThan(5)
    expect(playOnSaves).toBeGreaterThan(30)
    expect(playMisses).toBeGreaterThan(20)
    expect(missCount()).toBeGreaterThan(0)
  })

  it('the feedback card and an open confirmation, under the real ru.json: English as written, each word a counted miss', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const f = await mountMore('saves')
    await f.w.get('button.primary').trigger('click')
    await flushPromises()
    expect(flat(dialogEl()!.querySelector('.dialog-title')!.textContent)).toBe('Send feedback')
    expect(missedKeys()).toEqual(expect.arrayContaining(['Send feedback', 'The report contains:', 'Nothing is sent until you choose where to send it.', 'Send it to {0}']))
    f.w.unmount()
  })
})

// ===================================================================================================================
// 6 · THE `xx` SWEEP, AT 375x667
// ===================================================================================================================

/** Every text box under `root`: how much of the room its widest line wants, and the longest unbreakable word (the L2-7 instrument). */
function widest(root: Element, vp: Viewport): { boxes: number; chars: number; line: { r: number; at: string }; word: { r: number; at: string } } {
  let boxes = 0
  let chars = 0
  const line = { r: 0, at: '' }
  const word = { r: 0, at: '' }
  for (const el of Array.from(root.querySelectorAll('*'))) {
    const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.nodeValue ?? '').join(' ').replace(/\s+/g, ' ').trim()
    if (!/\p{L}/u.test(own)) continue
    boxes++
    chars += own.length
    const room = Math.max(1, availableWidth(el, vp))
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

/** What the §6 allowlist says, plus the shapes this screen prints that are DATA: a week label, a one-decimal size in the unit-less cell, the schema tag, and the
 *  date formatter's English form (§9.6: dates keep one form). The chrome around them is still charged. */
const ALLOW: readonly RegExp[] = [...DEFAULT_ALLOW, /^W\d+ '\d\d$/, /^v\d+$/, /^\d{2} [A-Z][a-z]{2},? \d{2}:\d{2}$/]
/** What the player and the engine wrote onto this screen: names, save names, the seed. */
const WRITTEN = new Set(['Mira', 'Mira 🇺🇸', NAMES.other, `${NAMES.other} 🇪🇸`, NAMES.saveOne, NAMES.saveTwo, SEED])

describe('L2-11 xx sweep – nothing the chrome wrote is unbracketed on the three tabs, the confirmations and the feedback card', () => {
  async function leaksOf(tab: TabName, then?: (f: Fixture) => Promise<void>): Promise<string[]> {
    await installPseudoLocale()
    const f = await mountMore(tab)
    if (then) await then(f)
    const found = hardcodeLeaks(document.body, ALLOW).filter((l) => !WRITTEN.has(l) && !l.startsWith(SEED))
    f.w.unmount()
    return found
  }

  it('zero leaks beyond what the player wrote: Saves (with an operation row), Play, About and the build line', async () => {
    const saves = await leaksOf('saves', async (f) => {
      f.store.saveOp = { op: 'import', status: 'error', message: 'engine words' }
      await nextTick()
    })
    // the one string on screen that is the STORE's: the failure text inside the bracketed message is part of it, so nothing leaks – and the dev switch is wired
    console.log(`[L2-11 xx] Saves leaks: ${JSON.stringify(saves)}`)
    expect(saves).toEqual([])
    const play = await leaksOf('play')
    console.log(`[L2-11 xx] Play leaks: ${JSON.stringify(play)}`)
    expect(play).toEqual([])
    const about = await leaksOf('about')
    console.log(`[L2-11 xx] About leaks: ${JSON.stringify(about)}`)
    expect(about).toEqual([])
  })

  it('zero leaks on every one of the eight confirmations and on the feedback card', async () => {
    for (const which of ['load-career', 'delete-career', 'delete-slot', 'restore', 'overwrite', 'import-unreadable', 'import-replace', 'import-add'] as const) {
      const leaks = await leaksOf('saves', async (f) => void (await ask(f, which)))
      expect(leaks, which).toEqual([])
    }
    const feedback = await leaksOf('saves', async (f) => {
      await f.w.get('button.primary').trigger('click')
      await flushPromises()
    })
    expect(feedback).toEqual([])
  })

  it('375x667: the saves slot list and the careers list, English -> xx – printed; no unbreakable word wider than its room', async () => {
    const measure = async (xx: boolean) => {
      if (xx) await installPseudoLocale()
      const f = await mountMore('saves', { kidName: 'Anna-Maria' })
      if (xx) expandRendered(f.w.element, ALLOW)
      const slotList = widest(f.w.get('table').element, PHONE)
      const row = widest(f.w.get('.save-row').element.parentElement!, PHONE)
      const careers = widest(f.w.findAll('section')[0]!.element, PHONE)
      const controls = widest(f.w.get('input[type="text"]').element.parentElement!, PHONE)
      f.w.unmount()
      return { slotList, row, careers, controls }
    }
    const en = await measure(false)
    resetI18nForTests(null)
    const xx = await measure(true)
    console.log(
      `[L2-11 xx] 375x667, English -> xx: slot list ${en.slotList.boxes} text boxes, ${en.slotList.chars} -> ${xx.slotList.chars} chars; widest line ${pct(en.slotList.line.r)} («${en.slotList.line.at}») -> ${pct(xx.slotList.line.r)} («${xx.slotList.line.at}»); ` +
        `longest word ${pct(en.slotList.word.r)} («${en.slotList.word.at}») -> ${pct(xx.slotList.word.r)} («${xx.slotList.word.at}»); ` +
        `careers list ${en.careers.chars} -> ${xx.careers.chars} chars, widest line ${pct(en.careers.line.r)} -> ${pct(xx.careers.line.r)}, longest word ${pct(en.careers.word.r)} -> ${pct(xx.careers.word.r)}; ` +
        `save-as and file rows ${en.controls.chars} -> ${xx.controls.chars} chars, widest line ${pct(en.controls.line.r)} -> ${pct(xx.controls.line.r)}`,
    )
    expect(xx.slotList.chars, 'xx made the slot list longer – the measurement saw the words').toBeGreaterThan(en.slotList.chars)
    expect(xx.slotList.word.r, `the slot list: «${xx.slotList.word.at}» overflows its box under xx`).toBeLessThanOrEqual(1)
    expect(xx.careers.word.r, `the careers list: «${xx.careers.word.at}» overflows its box under xx`).toBeLessThanOrEqual(1)
    expect(xx.controls.word.r, `the control rows: «${xx.controls.word.at}» overflows its box under xx`).toBeLessThanOrEqual(1)
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`${vp.width}x${vp.height}: the LONGEST confirmation (import adds a career) is a BLOCKING card – Cancel stays reachable in English and under xx with every line padded +30%; strip the cap and the SAME assertion goes red`, async () => {
      const f1 = await mountMore('saves', { vp })
      await ask(f1, 'import-add')
      let card = dialogEl() as HTMLElement
      const cancelEn = card.querySelector('.dialog-actions button') as HTMLElement
      const enFit = assertDismissReachable(card, cancelEn, vp, `ConfirmDialog (English, ${vp.width}x${vp.height})`)
      const english = (card.textContent ?? '').length
      f1.w.unmount()
      await installPseudoLocale()
      const f2 = await mountMore('saves', { vp })
      await ask(f2, 'import-add')
      card = dialogEl() as HTMLElement
      const cancel = card.querySelector('.dialog-actions button') as HTMLElement
      const confirm = card.querySelector('.dialog-actions button:last-child') as HTMLElement
      expandRendered(card, ALLOW)
      const xxChars = (card.textContent ?? '').length
      expect(xxChars, 'xx made the card longer').toBeGreaterThan(english)
      const fit = assertDismissReachable(card, cancel, vp, `ConfirmDialog (xx, ${vp.width}x${vp.height})`)
      assertDismissReachable(card, confirm, vp, `ConfirmDialog confirm (xx, ${vp.width}x${vp.height})`)
      console.log(
        `[L2-11 xx] confirmation ${vp.width}x${vp.height}: card text ${english} -> ${xxChars} chars; content wants ${enFit.contentFloor.toFixed(0)} -> ${fit.contentFloor.toFixed(0)}px of a ${fit.available.height.toFixed(0)}px room ` +
          `(${fit.contentFloor > fit.available.height ? 'scrolls inside the cap' : 'fits whole'}); Cancel at ${enFit.dismissTop.toFixed(0)}..${enFit.dismissBottom.toFixed(0)} -> ${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)} of ${vp.height}`,
      )
      expect(fit.dismissBottom).toBeLessThanOrEqual(vp.height)
      // THE MUTATION: the shared cap is what holds – strip it and the same assertion must go red, then put it back and it is green again
      card.style.maxHeight = 'none'
      card.style.overflowY = 'visible'
      expect(() => assertDismissReachable(card, cancel, vp, 'ConfirmDialog (xx, unbounded)')).toThrow(/declares no height bound|taller than the screen|outside the viewport/)
      card.style.maxHeight = ''
      card.style.overflowY = ''
      assertDismissReachable(card, cancel, vp, 'ConfirmDialog (xx, cap restored)')
      f2.w.unmount()
    })

    it(`${vp.width}x${vp.height}: the feedback card is a BLOCKING card too – Close stays reachable under xx with every line padded +30%; strip the cap and the SAME assertion goes red`, async () => {
      await installPseudoLocale()
      const f = await mountMore('saves', { vp })
      await f.w.get('button.primary').trigger('click')
      await flushPromises()
      const card = dialogEl() as HTMLElement
      const close = card.querySelector('.dialog-actions button') as HTMLElement
      const before = (card.textContent ?? '').length
      expandRendered(card, ALLOW)
      expect((card.textContent ?? '').length).toBeGreaterThan(before - 1)
      const fit = assertDismissReachable(card, close, vp, `FeedbackDialog (xx, ${vp.width}x${vp.height})`)
      console.log(`[L2-11 xx] feedback card ${vp.width}x${vp.height}: card text ${before} chars; Close at ${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)} of ${vp.height}`)
      card.style.maxHeight = 'none'
      card.style.overflowY = 'visible'
      expect(() => assertDismissReachable(card, close, vp, 'FeedbackDialog (xx, unbounded)')).toThrow(/declares no height bound|taller than the screen|outside the viewport/)
      card.style.maxHeight = ''
      card.style.overflowY = ''
      assertDismissReachable(card, close, vp, 'FeedbackDialog (xx, cap restored)')
      f.w.unmount()
    })
  }
})

// ===================================================================================================================
// RU-13D – THE 24 COUNTRY NAMES AND THE FORMATTER SHELLS (L2-11b)
// ===================================================================================================================

/** The table as it shipped, retyped: code -> English name, in the table's own order. */
const OLD_NAMES: [string, string][] = [
  ['US', 'United States'], ['GB', 'United Kingdom'], ['FR', 'France'], ['ES', 'Spain'], ['IT', 'Italy'], ['DE', 'Germany'],
  ['RU', 'Russia'], ['RS', 'Serbia'], ['CH', 'Switzerland'], ['CZ', 'Czechia'], ['PL', 'Poland'], ['UA', 'Ukraine'],
  ['KZ', 'Kazakhstan'], ['BY', 'Belarus'], ['AU', 'Australia'], ['JP', 'Japan'], ['CN', 'China'], ['KR', 'South Korea'],
  ['IN', 'India'], ['BR', 'Brazil'], ['AR', 'Argentina'], ['CA', 'Canada'], ['NL', 'Netherlands'], ['SE', 'Sweden'],
]
const POPULAR_NAMES = ['United States', 'United Kingdom', 'Australia', 'Canada', 'Germany', 'France', 'Spain', 'Italy', 'Japan']

/** The wizard, walked with its real controls to the country step (the picker with the nine popular tiles). */
async function mountPicker(vp: Viewport = PHONE): Promise<VueWrapper> {
  setViewport(vp)
  const w = mount(OnboardingWizard, { attachTo: document.body })
  for (let guard = 0; guard < 6 && !w.find('.ob-country').exists(); guard++) await w.get('.ob-cta').trigger('click')
  expect(w.find('.ob-country').exists(), 'the walk reached the country step').toBe(true)
  return w
}
const tileNames = (w: VueWrapper): string[] => w.findAll('.ob-tile-name').map((n) => flat(n.text()))

describe('L2-11b parity – the 24 names as they shipped, with no catalog', () => {
  it('every code reads the English the table gave it, in the table\'s order; the code list, the flags and the unknown-code fallback are untouched', () => {
    expect(Object.entries(COUNTRY_NAMES).map(([code, name]) => [code, name])).toEqual(OLD_NAMES)
    expect(new Set(Object.keys(COUNTRY_NAMES))).toEqual(new Set<string>(PLAYABLE_COUNTRIES))
    expect(COUNTRIES).toEqual(PLAYABLE_COUNTRIES)
    expect(POPULAR_COUNTRIES.map((code) => COUNTRY_NAMES[code])).toEqual(POPULAR_NAMES)
    // a code the table does not know is not an error: every call site writes `?? code`, and that is still what it prints
    expect(COUNTRY_NAMES.ZZ ?? 'ZZ').toBe('ZZ')
  })

  it('the picker on the country step: the nine popular tiles, their flags, and the search finding a name by its English letters', async () => {
    const w = await mountPicker()
    expect(tileNames(w)).toEqual(POPULAR_NAMES)
    expect(w.findAll('.ob-flag').map((n) => n.text())).toEqual(POPULAR_COUNTRIES.map((c) => String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65))))
    await w.get('.ob-search-input').setValue('fran')
    expect(tileNames(w)).toEqual(['France'])
    await w.get('.ob-search-input').setValue('')
    w.unmount()
  })
})

describe('L2-11b completeness – the names are wired; the formatters and the date words stay the single spelling they were', () => {
  it('all 24 names are wired keys homed ONLY in the countries module; the module keeps its type and imports `t` from the UI layer, not the engine', () => {
    for (const [, name] of OLD_NAMES) {
      expect(CATALOG.keys[name]?.wrapped, name).toBe(true)
      expect(CATALOG.keys[name]?.home, `${name}: no other surface asks for this word`).toEqual(['src/composables/countries.ts'])
    }
    const src = SRC('src/composables/countries.ts')
    expect(src).toContain("import { t } from '../i18n'")
    expect(src).toContain('const NAMES: Record<PlayableCountry, string> = {')
    expect(src).toContain('export const COUNTRY_NAMES: Record<string, string> = NAMES')
    expect(SRC('src/shared/countries.ts')).not.toMatch(/\bt\(|from '[^']*i18n'/)
  })

  it('⚠ THE FORMATTERS ARE NOT WIRED, ON PURPOSE: `shared/dates.ts` and `shared/money.ts` are engine-importable and call no `t()`, and every English shape still prints as it did', () => {
    for (const f of ['src/shared/dates.ts', 'src/shared/money.ts']) expect(SRC(f), f).not.toMatch(/\bt\(|from '[^']*i18n'/)
    const FORMS: [string, string][] = [
      [weekYearLabel(26), 'W27 2031'],
      [weekSpan(26), 'Jul 7 – Jul 13'],
      [weekDateLine(26), 'W27 2031 · Jul 7 – Jul 13'],
      [weekLabel(13), "W14 '31"],
      [monthLabel(0), "Jan '31"],
      [weekRange(0), 'Jan 6–12, 2031'],
      [weekRange(3), 'Jan 27 – Feb 2, 2031'],
      [weekRange(51), 'Dec 29, 2031 – Jan 4, 2032'],
      [seasonWeekRange(0, 9), 'W1-10'],
      [birthDateLabel(6, 12), '12 June'],
      [weeksLeftBracket(20, 6), '(14 weeks left)'],
      [weeksLeftBracket(7, 6), '(1 week left)'],
      [weeksLeftBracket(6, 6), '(last week)'],
    ]
    for (const [got, expected] of FORMS) expect(got).toBe(expected)
    // …and these ARE the English column of RU-13D's date rows – formatter OUTPUTS, not literals: no key in the catalog carries any of them, which is why those rows
    // stay `dead` (and the APPROVED short-year row `W14 '31` stays `unmatched`: no key can be spelled with a number in it). The importer would need a hint cell or a pattern row.
    for (const [, shape] of FORMS.filter(([, e]) => e !== 'W27 2031 · Jul 7 – Jul 13' && e !== 'Jul 7 – Jul 13' && e !== 'W27 2031')) expect(CATALOG.keys[shape], `«${shape}»`).toBeUndefined()
    const approved = rowsFor("W14 '31").filter((r) => r.status === 'APPROVED') // RU-03 writes the same form too, as a DRAFT; RU-13D's row is the one APPROVED (§9.9d)
    expect(approved).toHaveLength(1)
    expect(approved[0]!.doc).toContain('formatters-countries')
    expect(RU["W14 '31"], 'the approved short-year row compiles nowhere today').toBeUndefined()
  })

  it('the only UI-authored date words are already wired (L2-1 / L2-2): the twelve month names and the month-day shell read through `t()`; none is left over for this wave', () => {
    expect([...MONTHS]).toEqual(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
    expect(monthDayLabel(6, 12)).toBe('June 12')
    for (const k of ['January', 'December', 'June {day}', 'October {day}']) expect(CATALOG.keys[k]?.wrapped, k).toBe(true)
    // …and no unwrapped CERTAIN string in the UI layer is a bare week/date shell RU-13D's table could join
    const leftovers = Object.entries(CATALOG.keys)
      .filter(([k, v]) => !v.wrapped && v.home.some((h) => /^src\/(components|composables|viz)\//.test(h)) && /^(Week|W)\{?[0-9]?\}?( |$)|^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) /.test(k))
      .map(([k]) => k)
    expect(leftovers).toEqual([])
  })
})

describe('L2-11b seams – a flip re-labels the mounted picker and the search follows the displayed name; the codes and the flags stay', () => {
  it('tiles, the search and a wizard summary line read the locale; the flag and the code do not move', async () => {
    const w = await mountPicker()
    const flags = w.findAll('.ob-flag').map((n) => n.text())
    installCatalog('ru', { France: 'FR-NAME', Canada: 'CA-NAME', 'United States': 'US-NAME' })
    await setLocale('ru')
    await nextTick()
    expect(tileNames(w)).toEqual(['US-NAME', 'United Kingdom', 'Australia', 'CA-NAME', 'Germany', 'FR-NAME', 'Spain', 'Italy', 'Japan'])
    expect(w.findAll('.ob-flag').map((n) => n.text())).toEqual(flags)
    await w.get('.ob-search-input').setValue('fr-n')
    expect(tileNames(w)).toEqual(['FR-NAME']) // the search matches what is on screen
    await w.get('.ob-search-input').setValue('france')
    expect(tileNames(w)).toEqual([]) // …and not the English word it no longer shows
    await w.get('.ob-search-input').setValue('')
    w.unmount()
  })
})

describe('L2-11b context tags – none: each of the 24 has two rows in two tables and ONE Russian, all DRAFT, and nothing wakes', () => {
  it('24 names, 48 rows (RU-13D and RU-02A), one Russian each; none APPROVED, so ru.json holds none and every name renders English and is counted', async () => {
    for (const [, name] of OLD_NAMES) {
      // two tables write each name – RU-13D's list and RU-02A's country tiles – and they agree on ONE Russian, so no tag is needed
      const rows = rowsFor(name)
      expect(rows, name).toHaveLength(2)
      expect(rows.map((r) => r.doc).sort().map((d) => d.replace(/-2026-\d\d\.md$/, ''))).toEqual(['ru-formatters-countries', 'ru-onboarding'])
      expect(new Set(rows.map((r) => r.russian)).size, `${name}: one Russian in both tables`).toBe(1)
      expect(rows.map((r) => r.status), name).toEqual(['DRAFT', 'DRAFT'])
      expect(RU[name], `${name} is not in ru.json`).toBeUndefined()
    }
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const w = await mountPicker()
    expect(tileNames(w)).toEqual(POPULAR_NAMES)
    expect(missedKeys()).toEqual(expect.arrayContaining(POPULAR_NAMES))
    console.log(`[L2-11b smoke] 24 country keys wired, 24 DRAFT rows joined, 0 in ru.json (${Object.keys(RU).length} keys); the nine popular tiles render English and are ${POPULAR_NAMES.length} counted misses`)
    w.unmount()
  })
})

describe('L2-11b xx sweep – the picker: nothing the chrome wrote is unbracketed, and the nine tiles hold a 375x667 phone with every name longer', () => {
  it('zero leaks beyond the player\'s own text on the country step, and the tile grid measured English -> xx', async () => {
    const measure = async (xx: boolean) => {
      if (xx) await installPseudoLocale()
      const w = await mountPicker()
      if (xx) expandRendered(w.element, ALLOW)
      const grid = widest(w.get('.ob-tiles').element, PHONE)
      const leaks = xx ? hardcodeLeaks(w.get('.ob-country').element, ALLOW) : []
      const names = tileNames(w)
      w.unmount()
      return { grid, leaks, names }
    }
    const en = await measure(false)
    resetI18nForTests(null)
    const xx = await measure(true)
    console.log(
      `[L2-11b xx] 375x667, country tiles English -> xx: ${en.grid.boxes} text boxes, ${en.grid.chars} -> ${xx.grid.chars} chars; widest line ${pct(en.grid.line.r)} («${en.grid.line.at}») -> ${pct(xx.grid.line.r)} («${xx.grid.line.at}»); ` +
        `longest word ${pct(en.grid.word.r)} («${en.grid.word.at}») -> ${pct(xx.grid.word.r)} («${xx.grid.word.at}»); leaks on the step: ${JSON.stringify(xx.leaks)}`,
    )
    expect(xx.leaks).toEqual([])
    expect(xx.grid.chars).toBeGreaterThan(en.grid.chars)
    expect(xx.names.every((n) => n.startsWith('⟦'))).toBe(true)
    expect(xx.grid.word.r, `a tile name «${xx.grid.word.at}» overflows its tile under xx`).toBeLessThanOrEqual(1)
  })
})
