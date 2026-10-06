// ⭐⭐ ROUND 46 #11b – THE ANNOUNCED WEDDING ON THE CALENDAR (bundle B1).
//
// The owner, round 46 #11 (05.10, verbatim): «И поставим ли мы свадьбу в календарь? Картинка есть.»
//
// TWO LAYERS, because the claim has two halves: the FEED (`weddingMarkFor`, off `snapshot.weddingWeek`, which
// is the engine's `upcomingWeddingWeek` – the engine decides the week, this only labels it) and the SCREEN (the
// band `CalendarScreen` draws from it). The week itself is proven against `landWedding` in
// `tests/life-moment-engine.test.ts`; here the snapshot is built from a world the real writers posed, so the
// feed is exercised on the shape the worker really sends.
//
// ⚠ MUTATIONS, each really run and watched, then put back:
//   * `weddingMarkFor` always returning null -> RED (feed + mounted).
//   * the `v-if="weddingMark"` band dropped from the template (always drawn) -> RED on «a plain career draws none».
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { weddingMarkFor } from '../../src/composables/weekDays'
import { createWorld, raiseLifeBeat, toSnapshot } from '../../src/engine/world'
import { kidAgeNow, lifeLogOf } from '../../src/engine/world/lifeBeat'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

const EPISODE_ID = 'p:300'
// ⚠ POSED AT AGE 24, the age the game can reach (the wedding gate is 23): the bride is painted for the `adult` band only.
const BASE = (() => {
  const w = createWorld('cal-wedding-mark', DEFAULT_PROFILE)
  while (kidAgeNow(w) < 24) w.week += 13
  return w.week
})()

/** A career whose parent answered the announcement card this week, so the day is `weeksAfterEngagement` away. */
function announced(answered = true): Snapshot {
  const world = createWorld('cal-wedding-mark', DEFAULT_PROFILE)
  world.loveEpisodes = [
    {
      id: EPISODE_ID, sinceWeek: 300, endedWeek: null, knownWeek: 300, wants: 'open', partnerId: EPISODE_ID,
      publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null, latchedWeek: null, partnerName: 'Anton',
    },
  ]
  world.week = BASE
  raiseLifeBeat(world, 'engaged', EPISODE_ID)
  if (answered) lifeLogOf(world).at(-1)!.answer = 'bless'
  // ⚠ `toSnapshot` on a world with a PENDING blocking beat is fine for the feed; the screen test only reads the mark.
  return toSnapshot(world)
}

const DAY = BASE + ECONOMY.wedding.weeksAfterEngagement

beforeEach(() => setActivePinia(createPinia()))

describe('the feed: weddingMarkFor', () => {
  it('an announced wedding carries the mark: the engine\'s week, the shared labels, the distance', () => {
    const snap = announced()
    expect(snap.weddingWeek, 'the engine named the day').toBe(DAY)
    const mark = weddingMarkFor(snap)
    expect(mark).not.toBeNull()
    expect(mark!.week).toBe(DAY)
    expect(mark!.weeksAway).toBe(DAY - snap.week)
    expect(mark!.label).toMatch(/\S/)
    expect(mark!.dates).toMatch(/\S/)
  })

  it('no mark without an announcement: not answered, a plain career, a null week, a week that has come', () => {
    expect(weddingMarkFor(announced(false)), 'the card is still unanswered').toBeNull()
    expect(weddingMarkFor(toSnapshot(createWorld('cal-wedding-none', DEFAULT_PROFILE))), 'nothing announced').toBeNull()
    expect(weddingMarkFor({ week: 400, weddingWeek: null })).toBeNull()
    expect(weddingMarkFor({ week: 400 })).toBeNull()
    expect(weddingMarkFor({ week: 408, weddingWeek: 408 }), 'the day itself is the moment\'s, not the calendar\'s').toBeNull()
  })
})

describe('the screen: the calendar draws the band', () => {
  function mountCalendar(snapshot: Snapshot) {
    useGameStore().snapshot = snapshot
    return mount(CalendarScreen, { global: { stubs: { teleport: true } } })
  }

  it('an announced wedding is on the calendar, with the picture and the week the engine named', () => {
    const snap = announced()
    const w = mountCalendar(snap)
    const band = w.find('.cal-wedding')
    expect(band.exists(), 'the band is drawn').toBe(true)
    const mark = weddingMarkFor(snap)!
    expect(band.text()).toContain(mark.label)
    expect(band.text()).toContain(mark.dates)
    expect(band.find('img.cal-wedding-art').attributes('src'), 'the bride painting').toMatch(/bride/)
    w.unmount()
  })

  it('a career with no announced wedding draws none', () => {
    const w = mountCalendar(toSnapshot(createWorld('cal-wedding-plain', DEFAULT_PROFILE)))
    expect(w.find('.cal-wedding').exists()).toBe(false)
    w.unmount()
  })
})
