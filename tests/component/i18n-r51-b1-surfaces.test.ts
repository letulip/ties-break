// ⭐ ROUND 51 B1 – THREE SURFACES THAT PRINTED THE ENGINE'S ENGLISH UNDER A RUSSIAN LOCALE (docs/rounds/round-51.md №9, №16, №12).
//
//   №9  – Home's «Next tournament» plate printed the court as the engine's id ('hard' | 'clay' | 'grass').
//   №16 – Season: a booked family week reached the feed, the planner pane and both confirms under its English package label.
//   №12 – the Calendar: the vacation week's readout (label AND blurb) and its look-ahead band read the package text raw. (The wedding band's
//         bare literal is pinned in calendar-wedding-mark.test.ts, where its fixture lives.)
//
// ⚠ EVERY RUSSIAN EXPECTATION IS READ FROM THE REAL src/i18n/ru.json BY KEY – no Cyrillic literal lives in this file, so a re-worded row
// follows the screen instead of reddening it, and an absent row fails loudly (an `undefined` expectation) instead of passing on English.
// ⚠ ENGLISH IS PINNED TOO: wiring a reader must not move a byte under the default locale, so each surface has an English arm.
// ⚠ MUTATION-VERIFIED 13.10: the five src files put back to their raw-string form (`git apply -R` of this change's src diff, then re-applied and the tree compared
// byte-identical) turned SEVEN arms red – the six Russian arms here (the three courts, the Season card/pane/cancel arm, the BOOK-confirm arm, the Calendar
// readout/band arm) and the new Russian arm in calendar-wedding-mark.test.ts – and left the five English arms here and the four older wedding tests green.
// Each of the seven sinks has its own assertion: the court, `packageLabel` (card + cancel confirm), the sheet's `bookedLabel` (the `.plan-lead`), `confirmVacation`,
// the readout's label and blurb, the look-ahead note, and the wedding band.
// (That run predates `packageEnglish`, the eighth edit: it has no arm of its own because the branch it serves is unreachable from the screen – see the note in the №16 block.)
//
// The labels and blurbs are a CLOSED engine set whose English text IS the catalog key (words.ts `text`, the seat `engine.text`), read through
// `engineText`; the court is read through `eventCard.surfaceName`, the reader NextTournamentPanel and Season already use.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { bookVacation, createWorld, enterEvent, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { vacationPackage } from '../../src/engine/economy'
import type { Surface } from '../../src/engine/match/types'
import { installCatalog, missedKeys, resetI18nForTests, setLocale, t } from '../../src/i18n'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { mountSeason } from '../helpers/mountSeason'
import { installMemoryStorage } from './setup'

/** His approved Russian, as the importer compiled it. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>

const PACKAGE = vacationPackage('seaside')!
const lowerFirst = (s: string): string => `${s.charAt(0).toLowerCase()}${s.slice(1)}`

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

// --- №9 · Home's Next tournament plate ------------------------------------------------------------------------------

/** A career with something ENTERED – the only state the plate opens onto (the round 30 / 36 fixture shape, engine-built). */
function enteredCareer(): Snapshot {
  const world = createWorld('r51-b1-home', DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 12; i++) tickWeek(world, rng)
  const target = toSnapshot(world).upcoming.find((e) => e.eligible && !e.entered)
  expect(target, 'the fixture must have something she may enter').toBeTruthy()
  enterEvent(world, target!.id)
  return toSnapshot(world)
}
/** The same career, its entered event played on `surface` – the plate reads the snapshot's field, so all three courts are reachable from one seed. */
const onCourt = (snap: Snapshot, surface: Surface): Snapshot => ({
  ...snap,
  upcoming: snap.upcoming.map((e) => (e.entered ? { ...e, surface } : e)),
})
function mountHome(snapshot: Snapshot): VueWrapper {
  useGameStore().snapshot = snapshot
  return mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } }, attachTo: document.body })
}

const COURTS: Array<[Surface, string]> = [
  ['hard', 'Hard'],
  ['clay', 'Clay'],
  ['grass', 'Grass'],
]

describe('№9 – the Next tournament plate says the court in the player\'s words', () => {
  let entered: Snapshot
  beforeEach(() => {
    entered ??= enteredCareer()
  })

  it.each(COURTS)('%s reads as the catalog row «%s», lowercase as the id read before', async (surface, key) => {
    await inRussian()
    const w = mountHome(onCourt(entered, surface))
    const cell = w.find('.note-meta span')
    expect(cell.exists(), 'the plate must be on screen or this arm is vacuous').toBe(true)
    expect(RU[key], `${key} must be a catalog row`).toBeTruthy()
    expect(cell.text()).toBe(RU[key].toLowerCase())
    expect(cell.text(), 'the raw engine id is the bug').not.toBe(surface)
    w.unmount()
  })

  it.each(COURTS)('English is byte-identical: %s still prints the engine id', (surface) => {
    const w = mountHome(onCourt(entered, surface))
    expect(w.find('.note-meta span').text()).toBe(surface)
    w.unmount()
  })
})

// --- №16 · Season, the booked family week ---------------------------------------------------------------------------

/** A career with a family week booked inside Season's feed, found by asking the engine (round14-group-c's fixture shape). */
function careerWithVacation(packageId = 'seaside'): { snapshot: Snapshot; week: number } {
  const world = createWorld('r51-b1-season')
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 20; i++) tickWeek(world, rng)
  world.fundsCents = 500_000_00 // the trip must be affordable; the price itself is not under test
  for (let w = world.week + 1; w <= world.week + 8; w++) {
    try {
      bookVacation(world, w, packageId)
      return { snapshot: toSnapshot(world), week: w }
    } catch {
      // that week refuses a trip – try the next one
    }
  }
  throw new Error('no bookable week in the feed horizon')
}

describe('№16 – a booked family week names its package in the player\'s words', () => {
  it('the feed card, the planner pane and the cancel confirm all read the Russian label', async () => {
    await inRussian()
    expect(RU[PACKAGE.label], 'the label must be a catalog row').toBeTruthy()
    const { snapshot } = careerWithVacation()
    const w = mountSeason(snapshot)

    const card = w.find('.week-card.vacation')
    expect(card.exists(), 'the booked card must be in the feed or this arm is vacuous').toBe(true)
    expect(card.find('.week-title').text()).toBe(RU[PACKAGE.label])

    await card.trigger('click')
    const sheet = w.findComponent(PlanWeekSheet)
    expect(sheet.exists()).toBe(true)
    expect(sheet.find('.plan-lead').text()).toContain(RU[PACKAGE.label])
    expect(sheet.find('.plan-lead').text(), 'the English label is the bug').not.toContain(PACKAGE.label)

    await sheet.findAll('button').find((b) => b.text() === t('Cancel the trip'))!.trigger('click')
    const dialog = w.find('.dialog-card')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain(RU[PACKAGE.label])
    expect(dialog.text()).not.toContain(PACKAGE.label)
    w.unmount()
  })

  it('the BOOK confirm reads it too: the sheet hands over the engine\'s English label as data, the screen turns it into the sentence', async () => {
    await inRussian()
    const { snapshot, week } = careerWithVacation()
    const w = mountSeason(snapshot)
    await w.find('.week-card.vacation').trigger('click')
    const sheet = w.findComponent(PlanWeekSheet)
    // ⚠ THE PAYLOAD IS THE SHEET'S REAL SHAPE (`askVacation`: `label: row.label`, the economy's English) – emitted from the open sheet so the
    // screen's own `confirmVacation` is the code under test.
    sheet.vm.$emit('bookVacation', { week, packageId: 'seaside', label: PACKAGE.label, priceCents: 120_000, gain: 9 })
    await w.vm.$nextTick()
    const dialog = w.find('.dialog-card')
    expect(dialog.exists(), 'the confirm must be raised').toBe(true)
    expect(dialog.text()).toContain(RU[PACKAGE.label])
    expect(dialog.text()).not.toContain(PACKAGE.label)
    w.unmount()
  })

  // ⚠ THE ONE SINK WITH NO SCREEN ARM, AND WHY. `SeasonScreen.lockLabel`'s vacation branch (`Family vacation – {package}`) hands a `{package}` hole to the display boundary, which
  // reads it itself (wordHoles.ts, class eco) – so the screen passes the English (`packageEnglish`) and must not pre-read it. A week with a trip is `kind: 'vacation'` in the row
  // builder and event cards draw only for `kind: 'event'`, so no render path reaches that branch today (tried 13.10: a card shaped into the refusal never reaches the screen).
  // What CAN be pinned is the boundary's contract that makes the helper necessary: English into the hole reads once; the finished Russian is looked up as a key and counts a miss.
  it('the `{package}` hole of the lock reason belongs to the display boundary: English into it reads once, the finished Russian counts a miss', async () => {
    await inRussian()
    expect(t('Family vacation – {package}', { package: PACKAGE.label })).toContain(RU[PACKAGE.label])
    expect(missedKeys(), 'English into the hole is the single read').not.toContain(RU[PACKAGE.label])
    t('Family vacation – {package}', { package: RU[PACKAGE.label] })
    expect(missedKeys(), 'the Russian read a second time is looked up as a key').toContain(RU[PACKAGE.label])
  })

  it('English is byte-identical: the card, the pane and the confirm still print the economy\'s label', async () => {
    const { snapshot } = careerWithVacation()
    const w = mountSeason(snapshot)
    expect(w.find('.week-card.vacation .week-title').text()).toBe(PACKAGE.label)
    await w.find('.week-card.vacation').trigger('click')
    expect(w.findComponent(PlanWeekSheet).find('.plan-lead').text()).toContain(PACKAGE.label)
    w.unmount()
  })
})

// --- №12 · the Calendar's vacation week -----------------------------------------------------------------------------

function mountCalendar(snapshot: Snapshot): VueWrapper {
  useGameStore().snapshot = snapshot
  return mount(CalendarScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
}
/** The engine-booked trip, set on THIS week and the week ahead (the top card's readout speaks for one of them – the arm must not depend on which) and on the first two
 *  weeks of the look-ahead, which starts at week + 2 (`lookAheadFor`). The bookings are plain transport objects: the feed reads `snapshot.vacations` and decides
 *  nothing about whether a week was bookable. */
function bookedHereAndLater(): Snapshot {
  const { snapshot } = careerWithVacation()
  const trip = snapshot.vacations[0]
  const at = (week: number) => ({ ...trip, week })
  return { ...snapshot, vacations: [0, 1, 2, 3].map((ahead) => at(snapshot.week + ahead)) }
}
/** The names the look-ahead prints: a band for a plain week, a marker when an enterable tournament shares the week – both carry the row's `note`. */
const aheadNames = (w: VueWrapper): string[] =>
  w.findAll('.cal-ahead-item .cal-band-name, .cal-ahead-item .cal-marker-name').map((n) => n.text())

describe('№12 – the Calendar\'s family week reads its package in the player\'s words', () => {
  it('the readout carries the Russian label and blurb, composed as the English one is; the look-ahead band carries the label', async () => {
    await inRussian()
    expect(RU[PACKAGE.label], 'the label must be a catalog row').toBeTruthy()
    expect(RU[PACKAGE.blurb], 'the blurb must be a catalog row').toBeTruthy()
    const w = mountCalendar(bookedHereAndLater())
    expect(w.find('.cal-readout').text()).toBe(`${RU[PACKAGE.label]} – ${lowerFirst(RU[PACKAGE.blurb])}`)
    const names = aheadNames(w)
    expect(names.filter((n) => n === RU[PACKAGE.label]), 'both booked look-ahead weeks wear the Russian label').toHaveLength(2)
    expect(names, 'the English label is the bug').not.toContain(PACKAGE.label)
    w.unmount()
  })

  it('English is byte-identical: the readout and the band still print the economy\'s text', () => {
    const w = mountCalendar(bookedHereAndLater())
    expect(w.find('.cal-readout').text()).toBe(`${PACKAGE.label} – ${lowerFirst(PACKAGE.blurb)}`)
    expect(aheadNames(w).filter((n) => n === PACKAGE.label)).toHaveLength(2)
    w.unmount()
  })
})
