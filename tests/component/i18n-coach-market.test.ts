// RU-23 (11.10) – THE COACH MARKET AND HOME'S PLATE, MOUNTED, UNDER THE REAL ru.json AND UNDER ENGLISH. docs/localization/ru-profile-coaching-2026-10.md (the RU-23 section).
//
// The unit net (tests/i18n-coach-market.test.ts) holds the refs: the key law, the oracle, the Russian at every count. This file holds what a player SEES: the real screens on real snapshots, the bold label
// where the engine put it, no English word left on the card, and – the control – the same screens in English reading the snapshot's own strings to the character.
//
//   §1 growing   – the room note above the list: the Russian label in bold, the argument after the dash; the bios, the load notes and the profile, every card
//   §2 declining – the decline read on the card of the coach she has, the self-coached fallthrough above the list, Home's plate in each third of the season
//   §3 the plaque and the travel line
//   §4 English   – the control: the same mounts read the snapshot's strings byte for byte (invariant 4)
//   §5 mutation  – the screen printing the raw string, and a catalogue row removed, are both seen
//   §6 the pseudo-locale – each half of a read is its own bracketed unit (a sentence cut AFTER it was translated would leave a bracket open on each side)
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, setCoachOnEventWeeks, toSnapshot } from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'
import { ROOM_NOTE_SEP, coachBlurb, coachLoadNote, coachProfileNote, coachRoomArgument, coachRoomBand } from '../../src/engine/world/coachMarket'
import { HIREABLE_TIERS } from '../../src/engine/coach'
import { physicalMean } from '../../src/engine/development'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { SeasonHistoryEntry, SeasonTrackRow, Snapshot } from '../../src/shared/protocol'
import type { LadderTrack } from '../../src/engine/season/types'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { SHELL } from './xxCarpet'
import { installPseudoLocale } from './pseudoloc'

Element.prototype.scrollIntoView = function () {}

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const LATIN = /[A-Za-z]/
const CYRILLIC = /\p{Script=Cyrillic}/u
const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()

const EMPTY_ROW: SeasonTrackRow = { points: 0, wins: 0, losses: 0 }
function season(seasonIndex: number, wtaRank: number): SeasonHistoryEntry {
  const byTrack = { domestic: { ...EMPTY_ROW }, itf: { ...EMPTY_ROW }, wta: { ...EMPTY_ROW, endRank: wtaRank } } as Record<LadderTrack, SeasonTrackRow>
  return { seasonIndex, endRank: wtaRank, points: 0, wins: 0, losses: 0, fundsDeltaCents: 0, endFundsCents: 0, byTrack }
}
/** r39-decline-surfaces' fixture: a career past its peak, every arm of the long read true (a fall of 57 on the year, 105 below her best), the season week under the test's hand. */
function pastPeak(opts: { seasonWeek?: number; coachTier?: 'middle' | 'self'; travels?: boolean } = {}): WorldState {
  const world = createWorld('ru23-market', { ...DEFAULT_PROFILE, coachTier: opts.coachTier ?? 'middle' })
  world.week = Math.round((35 - 14) * WEEKS_PER_YEAR) + (opts.seasonWeek ?? 0)
  world.peakPhysical = physicalMean(world.skills) / 0.8
  world.seasonHistory = [season(16, 20), season(19, 68), season(20, 125)]
  if (opts.travels) setCoachOnEventWeeks(world, true)
  return world
}
const young = (coachTier: 'middle' | 'self' = 'middle'): WorldState => createWorld('ru23-young', { ...DEFAULT_PROFILE, coachTier })

async function ru(): Promise<void> {
  resetI18nForTests(null)
  installCatalog('ru', RU)
  await setLocale('ru')
}
async function en(): Promise<void> {
  resetI18nForTests(null)
  await setLocale('en')
}

async function market(world: WorldState): Promise<{ w: VueWrapper; snap: Snapshot }> {
  const snap = toSnapshot(world)
  useGameStore().snapshot = snap
  const w = mount(CoachMarketScreen, SHELL) as VueWrapper
  await flushPromises()
  // the market lands on the coaches tab for a coached career and on «Her week» for a self-coached one: open the coaches either way
  const pill = w.findAll('.tb-seg .tab-pill').find((b) => ['Coaches', 'Тренеры'].includes(b.text()))
  if (pill) {
    await pill.trigger('click')
    await flushPromises()
  }
  return { w, snap }
}
function home(world: WorldState): { w: VueWrapper; snap: Snapshot } {
  const snap = toSnapshot(world)
  useGameStore().snapshot = snap
  return { w: mount(HomeScreen, { props: { recapFresh: false }, ...SHELL }) as VueWrapper, snap }
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

describe('§1 growing – the room note, the bios, the load notes and the profile, in Russian', () => {
  it('⭐ the room note above the list: the Russian label in bold, then the dash, then the argument; not a Latin letter', async () => {
    await ru()
    const { w } = await market(young())
    const note = w.get('.cm-room-note')
    expect(w.get('.cm-room-band').text()).toBe('Огромный потенциал')
    expect(flat(note.text())).toBe('Огромный потенциал – большая часть её игры ещё впереди, и здесь тренер даёт больше всего.')
    expect(note.text()).not.toMatch(LATIN)
    w.unmount()
  })

  // ⚠ RE-AIMED, R53 L1 (21.10): the load note is no longer ON the card (the owner: «шумит» – four repeats); it is the
  // tier block's one sentence under the title, `.tier-note`. The claim is unchanged – Russian, no Latin, one per rung –
  // and is now asserted on the block; tests/component/r53-tier-note.test.ts holds the placement.
  it('⭐ every card: the bio and the profile are Russian (and each tier block\'s load note), the profile\'s bold label is the Russian label and band + tail is the sentence', async () => {
    await ru()
    const { w, snap } = await market(young())
    const cards = w.findAll('.cm-row')
    expect(cards.length, 'the market lists the whole roster').toBe(ECONOMY.coach.roster.length)
    const loads = new Set<string>()
    for (const card of cards) {
      for (const sel of ['.cm-blurb', '.cm-profile']) {
        const el = card.get(sel)
        expect(el.text(), `${sel} of ${card.get('.cm-name').text()}`).toMatch(CYRILLIC)
        expect(el.text(), `${sel} of ${card.get('.cm-name').text()}`).not.toMatch(LATIN)
      }
      const band = card.get('.cm-profile-band').text()
      expect(flat(card.get('.cm-profile').text()), 'band + tail is the sentence shown').toMatch(new RegExp(`^${band} – `))
      expect(['Выше уровня', 'Темп уровня', 'Ниже уровня', 'Медленнее ваших тренировок']).toContain(band)
    }
    for (const note of w.findAll('.tier-note')) {
      expect(note.text()).toMatch(CYRILLIC)
      expect(note.text()).not.toMatch(LATIN)
      loads.add(note.text())
    }
    expect(loads.size, 'one load note per rung').toBe(HIREABLE_TIERS.length)
    // the sixteen bios are the owner's RU-05 §16.2 sentences, woken by the seat: pinned here against the catalogue, by portrait
    const shown = new Set(cards.map((c) => c.get('.cm-blurb').text()))
    const expected = new Set(snap.coachMarket.map((r) => RU[coachBlurb(r.id)]!))
    expect(shown).toEqual(expected)
    expect(shown.size).toBe(16)
    w.unmount()
  })

  it('the four rungs of the ladder, each with its Russian label (the sweep that reaches every band lives in the unit net; this holds the labels on the screen)', async () => {
    await ru()
    // a band is a function of how much of her room she has filled: walk it by moving her skills toward her ceiling
    const seen = new Set<string>()
    for (const share of [0.05, 0.5, 0.85, 0.99]) {
      const world = young()
      for (const k of Object.keys(world.skills) as (keyof typeof world.skills)[]) world.skills[k] = world.skills[k] + (world.potential[k] - world.skills[k]) * share
      world.week = 400
      const { w } = await market(world)
      const band = w.find('.cm-room-band')
      if (band.exists()) seen.add(band.text())
      w.unmount()
      document.body.innerHTML = ''
    }
    expect([...seen].sort()).toEqual(['Близко к потолку', 'Огромный потенциал', 'Ещё есть куда расти', 'У своего потолка'].sort())
  })
})

describe('§2 declining – the read past her peak, in each place the player meets it', () => {
  it('⭐ the card of the coach she has carries the whole read, Russian, and the hint above the list stands down', async () => {
    await ru()
    const { w, snap } = await market(pastPeak())
    const line = w.get('.cm-row.current .cm-decline')
    expect(flat(line.text())).toBe('Пик позади – за год опустилась на 57 мест, и у организма осталось около 3 сезонов.')
    expect(line.text()).not.toMatch(LATIN)
    expect(w.find('.cm-room-note').exists(), 'the hint stands down while a card carries the read').toBe(false)
    expect(snap.coachNotesC.decline, 'the engine sent the ref').not.toBeNull()
    w.unmount()
  })

  it('⭐ self-coached: no card to carry it, so the hint above the list keeps the read – and its bold label is «Пик позади»', async () => {
    await ru()
    const { w } = await market(pastPeak({ coachTier: 'self' }))
    expect(w.get('.cm-room-band').text()).toBe('Пик позади')
    expect(flat(w.get('.cm-room-note').text())).toBe('Пик позади – за год опустилась на 57 мест, и у организма осталось около 3 сезонов.')
    w.unmount()
  })

  it('⭐ Home\'s plate in each third of the season: the rotation\'s pick, Russian, one sentence', async () => {
    await ru()
    const plate = async (seasonWeek: number): Promise<string> => {
      const { w } = home(pastPeak({ seasonWeek }))
      const text = flat(w.get('.coach-room-short').text())
      w.unmount()
      document.body.innerHTML = ''
      return text
    }
    expect(await plate(0), 'early: she\'s down N places').toBe('Она опустилась на 57 мест')
    expect(await plate(20), 'mid: the seasons left').toBe('Пик позади – осталось около 3 сезонов')
    expect(await plate(51), 'late: the below-her-best ladder (105 places is «far below»)').toBe('Она значительно ниже своего лучшего уровня')
  })

  it('Home\'s plate on a growing career: the band\'s short, Russian', async () => {
    await ru()
    const { w } = home(young())
    expect(flat(w.get('.coach-room-short').text())).toBe('Большая часть игры впереди')
    w.unmount()
  })
})

describe('§3 the plaque and the travel line', () => {
  it('⭐ the verdict a coach has earned over the seasons, and the sentence under the second figure – Russian, on the card of the coach she has', async () => {
    await ru()
    const { w, snap } = await market(pastPeak({ travels: true }))
    expect(snap.coachEdge.plaqueLine, 'the fixture\'s coach has been hers for seasons').toMatch(/^Season after season – /)
    const plaque = w.get('.cm-row.current .cm-plaque').text()
    expect(plaque).toMatch(/^Сезон за сезоном: темп /)
    expect(plaque).not.toMatch(LATIN)
    const travel = w.get('.cm-row.current .cm-travel-edge').text()
    expect(travel).toBe('На турнирах, куда едет тренер, эффект вдвое выше.')
    w.unmount()
  })

  it('before the verdict: the two arms of «Her progress»', async () => {
    await ru()
    const { w, snap } = await market(young())
    expect(snap.coachEdge.plaqueLine).toBe('Her progress – I will know in the off-season.')
    expect(w.get('.cm-row.current .cm-plaque').text()).toBe('Её прогресс – в межсезонье будет понятнее.')
    w.unmount()
  })
})

describe('§4 English – the control: the same mounts read the snapshot\'s own strings, to the character', () => {
  it('the market: the room note, the decline read, the bios, the load notes and the profile are the engine\'s English', async () => {
    await en()
    const g = await market(young())
    expect(flat(g.w.get('.cm-room-note').text())).toBe(flat(g.snap.coachRoomNote))
    expect(g.w.get('.cm-room-band').text()).toBe(coachRoomBand(g.snap.coachRoomNote))
    for (const r of g.snap.coachMarket) {
      const card = g.w.findAll('.cm-row').find((c) => c.get('.cm-name').text() === r.name)!
      expect(card.get('.cm-blurb').text()).toBe(coachBlurb(r.id))
      // ⚠ R53 L1 (21.10): the sentence moved off the card to the tier block – asserted there, and the card prints none.
      expect(card.find('.cm-load').exists()).toBe(false)
      expect(g.w.get(`#coach-tier-${r.tier} .tier-note`).text()).toBe(coachLoadNote(r.tier))
      const note = coachProfileNote(r.tier, r.fit)
      expect(card.get('.cm-profile-band').text() + card.get('.cm-profile').text().slice(card.get('.cm-profile-band').text().length)).toBe(note)
      expect(card.get('.cm-profile-band').text()).toBe(coachRoomBand(note))
      expect(card.get('.cm-profile').text()).toBe(`${coachRoomBand(note)}${ROOM_NOTE_SEP}${coachRoomArgument(note)}`)
    }
    g.w.unmount()
    document.body.innerHTML = ''
    const d = await market(pastPeak())
    expect(flat(d.w.get('.cm-row.current .cm-decline').text())).toBe(flat(d.snap.coachDeclineNote))
    expect(d.snap.coachDeclineNote).toBe('Past her peak – down 57 places on the year, and her body has about 3 more seasons in it.')
    d.w.unmount()
    document.body.innerHTML = ''
    const s = await market(pastPeak({ coachTier: 'self' }))
    expect(flat(s.w.get('.cm-room-note').text())).toBe(flat(s.snap.coachRoomNote))
    expect(s.w.get('.cm-room-band').text()).toBe('Past her peak')
    s.w.unmount()
  })

  it('Home: the plate in each third of the season is the snapshot\'s string', async () => {
    await en()
    for (const seasonWeek of [0, 20, 51]) {
      const { w, snap } = home(pastPeak({ seasonWeek }))
      expect(flat(w.get('.coach-room-short').text())).toBe(snap.coachRoomShort)
      w.unmount()
      document.body.innerHTML = ''
    }
    const g = home(young())
    expect(flat(g.w.get('.coach-room-short').text())).toBe('Most of her game ahead')
    g.w.unmount()
  })

  it('and a snapshot with no ref at all (a worker that predates the wave) still shows its string, split by the one splitter', async () => {
    await en()
    const snap = toSnapshot(young())
    delete (snap as { coachNotesC?: unknown }).coachNotesC
    useGameStore().snapshot = snap
    const w = mount(CoachMarketScreen, SHELL) as VueWrapper
    await flushPromises()
    const pill = w.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
    if (pill) await pill.trigger('click')
    await flushPromises()
    expect(w.get('.cm-room-band').text()).toBe('Huge potential')
    expect(flat(w.get('.cm-room-note').text())).toBe(flat(snap.coachRoomNote))
    w.unmount()
  })
})

describe('§5 mutation – a screen that prints the raw string, and a row that is gone, are both seen', () => {
  it('M1 – the raw string on a Russian screen reads English: the predicate §1–§3 use sees it (the control: the ref reads Russian)', async () => {
    await ru()
    const world = pastPeak({ coachTier: 'self' })
    const snap = toSnapshot(world)
    useGameStore().snapshot = { ...snap, coachNotesC: { room: null, decline: null, short: null } } as Snapshot
    const w = mount(CoachMarketScreen, SHELL) as VueWrapper
    await flushPromises()
    const pill = w.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Тренеры')
    if (pill) await pill.trigger('click')
    await flushPromises()
    expect(w.get('.cm-room-note').text(), 'with no ref the screen can only show the English string').toMatch(LATIN)
    w.unmount()
  })

  it('M2 – the label\'s row removed: the bold label falls back to English and is counted as a miss', async () => {
    resetI18nForTests(null)
    const gone = { ...RU }
    delete gone['Past her peak']
    installCatalog('ru', gone)
    await setLocale('ru')
    const { w } = await market(pastPeak({ coachTier: 'self' }))
    expect(w.get('.cm-room-band').text()).toBe('Past her peak')
    w.unmount()
  })
})

describe('§5b the cut is the engine\'s, not the translator\'s', () => {
  it('M3 – a label that contains the dash itself is still ONE bold label (the screen takes the engine\'s two parts apart; it does not look for a dash in what the translator wrote)', async () => {
    resetI18nForTests(null)
    installCatalog('ru', { ...RU, 'Past her peak': 'Пик – позади' })
    await setLocale('ru')
    const { w } = await market(pastPeak({ coachTier: 'self' }))
    expect(w.get('.cm-room-band').text()).toBe('Пик – позади')
    expect(flat(w.get('.cm-room-note').text())).toBe('Пик – позади – за год опустилась на 57 мест, и у организма осталось около 3 сезонов.')
    w.unmount()
  })
})

describe('§6 the pseudo-locale – the bold label and the tail are each a whole bracketed unit', () => {
  const closed = (text: string): boolean => text.includes('⟦') && text.includes('⟧') && text.indexOf('⟦') < text.lastIndexOf('⟧')

  it('⭐ the room note above the list, and the profile of every card: the label is `⟦…⟧` and the tail carries its own pair (the pseudo-locale wraps one message, so a cut after the wrap leaves a half)', async () => {
    resetI18nForTests(null)
    await installPseudoLocale()
    const { w } = await market(young())
    const band = w.get('.cm-room-band').text()
    const tail = w.get('.cm-room-note').text().slice(band.length)
    expect(band.startsWith('⟦') && band.endsWith('⟧'), `the label «${band}» is one whole unit`).toBe(true)
    expect(closed(tail), `the tail «${tail}» carries a pair of its own`).toBe(true)
    for (const card of w.findAll('.cm-row')) {
      const b = card.get('.cm-profile-band').text()
      const t = card.get('.cm-profile').text().slice(b.length)
      expect(b.startsWith('⟦') && b.endsWith('⟧'), b).toBe(true)
      expect(closed(t), t).toBe(true)
    }
    w.unmount()
  })

  it('and the decline read on the card is bracketed throughout (the join, the label and the argument are three messages)', async () => {
    resetI18nForTests(null)
    await installPseudoLocale()
    const { w } = await market(pastPeak())
    expect(closed(w.get('.cm-row.current .cm-decline').text())).toBe(true)
    w.unmount()
  })
})
