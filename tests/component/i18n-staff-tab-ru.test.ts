// r51 №2 (13.10) – THE SPECIALISTS TAB UNDER RUSSIAN, MOUNTED. The owner: «На Экране Специалистов остались английские надписи в русской версии».
//
// WHY THE EXISTING NETS DID NOT SEE IT. The carpet and the L2-6 arm pose this tab with every seat UNLOCKED and the engine's free-text fields EMPTY (no `masseurNote`, no chosen year, no refusal), so the sentences that
// were still English – the three locked lines, the masseur's room note, the year's-work note – were never drawn. This file poses the states those fields are non-empty in, mounts the real tab under the real
// ru.json (installed the way the app does it), and asks two questions of every one of them:
//   · the NAMED SINKS (`.staff-line`, `.staff-focus-note`, `.cm-travel-sub`, `.staff-fare`) draw THAT sentence's Russian row, read by key;
//   · nothing on the tab – text node or copy attribute – holds an English word, and the session's miss counter stays at zero (a sentence the screen printed raw never counts as a miss, which is how the note under
//     the year's row stayed English beside a catalog that held its Russian: the Latin scan is what sees it, the counter is what sees a t()/engineText that found no row).
//
// ⚠ NO CYRILLIC IS TYPED HERE: every expectation is read from ru.json by key, the display-boundary net's rule. «Latin word» is two or more Latin letters in a row – the single `W` of «серия W» is a tier's code.
// ⚠ MUTATED BEFORE IT WAS BELIEVED (13.10, r51 B3): the change under test is six `engineText` calls in SupportStaffTab.vue plus one row of the hole table (wordHoles.ts, class `eco`). Reverting both: 25 of 27 arms red – the two
// that stay green are the English control and the nobody-hired pose, which draw no sink. Reverting the hole-table row ALONE: exactly the year-ask arm and the year-ask English scan red. Reverting the component ALONE: 24 red,
// the year-ask arm green. Restored each time and checked by file hash. (A first attempt reverted nothing – an unquoted `$FILES` in zsh – and reported 27 green: print the denominator.)
import { vi } from 'vitest'

vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))
vi.mock('../../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/worker/client')>()
  return { ...actual, request: vi.fn(async () => ({ ok: false })) }
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import SupportStaffTab from '../../src/components/SupportStaffTab.vue'
import { createWorld, masseurRoomNote, MASSEUR_LOCKED_DETAIL, SPARRING_LOCKED_DETAIL } from '../../src/engine/world'
import {
  PSY_FOCUSES,
  PSY_FOCUS_LABEL,
  PSY_FOCUS_LINE,
  PSYCHOLOGIST_LOCKED_DETAIL,
  PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL,
  PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL,
  PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
} from '../../src/engine/world/psychologist'
import { useGameStore } from '../../src/stores/game'
import { installCatalog, missedKeys, resetI18nForTests, setLocale } from '../../src/i18n'
import type { Snapshot } from '../../src/shared/protocol'
import { installMemoryStorage } from './setup'
import { coached } from './xxPoses'

Element.prototype.scrollIntoView = function () {}

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const reading = (english: string): string => {
  const v = RU[english]
  expect(v, `ru.json carries a row for «${english}»`).toBeDefined()
  return v as string
}
const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1)

const MOUNT = { attachTo: document.body, global: { stubs: { teleport: true } } }

/** Every seat open and hired, the engine's free-text fields set by `over`. */
const pose = (over: Record<string, unknown> = {}): Snapshot =>
  ({
    ...coached(),
    masseurUnlocked: true,
    psychologistUnlocked: true,
    sparringUnlocked: true,
    masseurHired: true,
    psychologistHired: true,
    sparringHired: true,
    ...over,
  }) as unknown as Snapshot
const LOCKED = { masseurUnlocked: false, psychologistUnlocked: false, sparringUnlocked: false, masseurHired: false, psychologistHired: false, sparringHired: false }
const OPEN = { masseurHired: false, psychologistHired: false, sparringHired: false }

/** The masseur's room note in each of its four states, off the real function (the same pose `tools/i18n-seats.ts` enumerates the seat from). */
function roomNotes(): string[] {
  const world = createWorld('r51-b3-room-note-test')
  world.masseurHired = true
  const fresh = masseurRoomNote(world)
  world.injuryHistory = [{ kind: 'strain', severity: 'minor', week: world.week, weeksOut: 2, weeksSaved: 1 }]
  const bought = masseurRoomNote(world)
  world.injuryHistory = []
  world.injury = { weeksSaved: 1 } as unknown as typeof world.injury
  const working = masseurRoomNote(world)
  world.injury = { weeksSaved: 0 } as unknown as typeof world.injury
  return [fresh, bought, working, masseurRoomNote(world)]
}
const ROOM_NOTES = roomNotes()
const REFUSALS = [PSYCHOLOGIST_FOCUS_SEASON_REFUSAL, PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL, PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL]

/** The richest state: three hired seats, both travel switches on with trips booked, a year chosen, the room note set. */
const RICH = {
  masseurNote: ROOM_NOTES[0],
  masseurTravels: true,
  masseurTravelTrips: 2,
  masseurTravelFareCents: 300_00,
  sparringTravels: true,
  sparringTravelTrips: 1,
  sparringTravelFareCents: 100_00,
  psychologistFocus: 'coolhead',
  psychologistFocusDetail: '',
  psychologistFocusOpen: [...PSY_FOCUSES],
}

async function mountTab(snap: Snapshot): Promise<VueWrapper> {
  useGameStore().snapshot = snap
  const w = mount(SupportStaffTab, MOUNT) as VueWrapper
  await flushPromises()
  return w
}
const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()
const seat = (w: VueWrapper, id: string, selector: string): string => flat(w.get(`[data-staff="${id}"] ${selector}`).text())
const COPY_ATTRS = ['aria-label', 'title', 'alt', 'placeholder']
const ENGLISH_WORD = /[A-Za-z]{2,}/
/** Every English word the tab (and any dialog it opened) shows: text nodes and the attributes a screen reader reads. */
function englishWords(): string[] {
  const out: string[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const s = flat(n.nodeValue ?? '')
    if (ENGLISH_WORD.test(s)) out.push(s)
  }
  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    for (const a of COPY_ATTRS) {
      const v = el.getAttribute(a)
      if (v && ENGLISH_WORD.test(v)) out.push(`${a}=${flat(v)}`)
    }
  }
  return out
}

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  resetI18nForTests(null)
  document.documentElement.lang = 'en'
})
async function inRussian(): Promise<void> {
  installCatalog('ru', RU)
  await setLocale('ru')
}

describe('Specialists tab, Russian – each engine sentence is its own row', () => {
  it('a closed seat prints the Russian row of the refusal the engine throws, for all three seats', async () => {
    await inRussian()
    const w = await mountTab(pose(LOCKED))
    expect(seat(w, 'masseur', '.staff-line')).toBe(reading(MASSEUR_LOCKED_DETAIL))
    expect(seat(w, 'psychologist', '.staff-line')).toBe(reading(PSYCHOLOGIST_LOCKED_DETAIL))
    expect(seat(w, 'sparring', '.staff-line')).toBe(reading(SPARRING_LOCKED_DETAIL))
    w.unmount()
  })

  it('the hired masseur prints the Russian row of his room note in every one of its four states', async () => {
    await inRussian()
    expect(new Set(ROOM_NOTES).size, 'the four states are four different sentences').toBe(4)
    for (const note of ROOM_NOTES) {
      const w = await mountTab(pose({ ...RICH, masseurNote: note }))
      expect(seat(w, 'masseur', '.staff-line'), note).toBe(reading(note))
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('the year\'s-work note is the Russian row of the chosen year\'s line, or of the refusal when one is showing', async () => {
    await inRussian()
    for (const f of PSY_FOCUSES) {
      const w = await mountTab(pose({ ...RICH, psychologistFocus: f }))
      expect(seat(w, 'psychologist', '.staff-focus-note'), f).toBe(reading(PSY_FOCUS_LINE[f]))
      // …and the hired line splices the same row after the retainer's opening, its first letter lowered (the hole table's `ecoLower`)
      const [opening] = reading('On retainer – {0}').split('{0}')
      expect(seat(w, 'psychologist', '.staff-line'), f).toBe(`${opening}${lowerFirst(reading(PSY_FOCUS_LINE[f]))}`)
      w.unmount()
      document.body.innerHTML = ''
    }
    for (const refusal of REFUSALS) {
      const w = await mountTab(pose({ ...RICH, psychologistFocus: 'recovery', psychologistFocusDetail: refusal }))
      expect(seat(w, 'psychologist', '.staff-focus-note'), refusal).toBe(reading(refusal))
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('the ask before a year is set names the year in Russian', async () => {
    await inRussian()
    const w = await mountTab(pose(RICH))
    const option = w.findAll('[data-staff="psychologist"] .staff-focus-option').find((o) => !o.attributes('disabled'))
    expect(option, 'an open year to press').toBeDefined()
    await option!.trigger('click')
    await flushPromises()
    // the first open year is the first on the roster: the Russian ask with that year's Russian row in its hole
    const key = "Set the psychologist's work for this season to {0}? The year's work is chosen once a season, and the next choice comes in the next off-season."
    expect(flat(w.get('.dialog-card').text())).toContain(reading(key).replace('{0}', reading(PSY_FOCUS_LABEL[PSY_FOCUSES[0]!])))
    w.unmount()
  })
})

describe('Specialists tab, Russian – no English word anywhere, and no row missed', () => {
  const POSES: Array<[string, Record<string, unknown>]> = [
    ['all three seats closed', LOCKED],
    ['open, nobody hired', OPEN],
    ['all hired, richest state', RICH],
    ['all hired, travel off, no year chosen, hitting partner stood down', { ...RICH, masseurTravels: false, masseurTravelTrips: 0, sparringTravels: false, sparringTravelTrips: 0, psychologistFocus: null, sparringStoodDown: true }],
    ['all hired, one trip booked each', { ...RICH, masseurTravelTrips: 1, sparringTravelTrips: 1 }],
    ...PSY_FOCUSES.map((f): [string, Record<string, unknown>] => [`psychologist year: ${f}`, { ...RICH, psychologistFocus: f }]),
    ...REFUSALS.map((r, i): [string, Record<string, unknown>] => [`psychologist refusal #${i + 1}`, { ...RICH, psychologistFocus: 'recovery', psychologistFocusDetail: r }]),
    ...ROOM_NOTES.map((n, i): [string, Record<string, unknown>] => [`masseur room note #${i + 1}`, { ...RICH, masseurNote: n }]),
  ]

  for (const [name, over] of POSES) {
    it(`${name}: the tab holds no English word and the counter stays at zero`, async () => {
      await inRussian()
      const w = await mountTab(pose(over))
      expect(englishWords(), `${name}: English left on the tab`).toEqual([])
      expect(missedKeys(), `${name}: a t()/engineText that found no Russian row`).toEqual([])
      w.unmount()
    })
  }

  it('the named sinks are all drawn in the richest state (a vacuous scan is red) and each holds no English word', async () => {
    await inRussian()
    const w = await mountTab(pose(RICH))
    for (const selector of ['.staff-line', '.staff-focus-note', '.cm-travel-sub', '.staff-fare']) {
      const drawn = w.findAll(selector)
      expect(drawn.length, `${selector} drawn`).toBeGreaterThanOrEqual(1)
      for (const el of drawn) expect(flat(el.text()), `${selector} holds an English word`).not.toMatch(ENGLISH_WORD)
    }
    w.unmount()
  })

  /** Mount the tab on `over`, press the first control `selector` finds, and hand the wrapper back with its dialog open. */
  async function asked(over: Record<string, unknown>, selector: string): Promise<VueWrapper> {
    const w = await mountTab(pose(over))
    await w.findAll(selector).find((b) => !b.attributes('disabled'))!.trigger('click')
    await flushPromises()
    expect(w.find('.dialog-card').exists(), `${selector} opened its ask`).toBe(true)
    return w
  }

  for (const id of ['masseur', 'psychologist', 'sparring']) {
    it(`${id}: the hire ask and the release ask hold no English word`, async () => {
      await inRussian()
      const hire = await asked(OPEN, `[data-staff="${id}"] .staff-right button`)
      expect(englishWords(), `${id}: the hire ask`).toEqual([])
      hire.unmount()
      document.body.innerHTML = ''
      const release = await asked(RICH, `[data-staff="${id}"] .staff-right button`)
      expect(englishWords(), `${id}: the release ask`).toEqual([])
      expect(missedKeys()).toEqual([])
      release.unmount()
    })
  }

  it('the year\'s-work ask holds no English word', async () => {
    await inRussian()
    const w = await asked(RICH, '[data-staff="psychologist"] .staff-focus-option')
    expect(englishWords()).toEqual([])
    expect(missedKeys()).toEqual([])
    w.unmount()
  })
})

describe('Specialists tab, English – the engine\'s sentences are drawn as written (the boundary changes nothing a player reads today)', () => {
  it('locked lines, room note, year note and the ask carry the engine\'s English byte for byte', async () => {
    const locked = await mountTab(pose(LOCKED))
    expect(seat(locked, 'masseur', '.staff-line')).toBe(MASSEUR_LOCKED_DETAIL)
    expect(seat(locked, 'psychologist', '.staff-line')).toBe(PSYCHOLOGIST_LOCKED_DETAIL)
    expect(seat(locked, 'sparring', '.staff-line')).toBe(SPARRING_LOCKED_DETAIL)
    locked.unmount()
    document.body.innerHTML = ''
    const note = ROOM_NOTES[1]!
    const rich = await mountTab(pose({ ...RICH, masseurNote: note, psychologistFocus: 'listen' }))
    expect(seat(rich, 'masseur', '.staff-line')).toBe(note)
    expect(seat(rich, 'psychologist', '.staff-focus-note')).toBe(PSY_FOCUS_LINE.listen)
    // the first open year is the first on the roster, and the ask is the English message with that year's English label in its hole
    await rich.findAll('[data-staff="psychologist"] .staff-focus-option').find((o) => !o.attributes('disabled'))!.trigger('click')
    await flushPromises()
    expect(flat(rich.get('.dialog-card').text())).toContain(
      `Set the psychologist's work for this season to ${PSY_FOCUS_LABEL[PSY_FOCUSES[0]!]}? The year's work is chosen once a season, and the next choice comes in the next off-season.`,
    )
    rich.unmount()
  })
})
