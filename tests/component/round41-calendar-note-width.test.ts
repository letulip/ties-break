// ⭐ ROUND 41 #10 – THE CALENDAR'S FRIDGE NOTE WIDENS PAST 768.
//
// The owner: «на экране с анимацией прохода недели давай записочку под таблицей недели сделаем
// по-шире на дестоп и планшетах?» (quoted here rather than in a template –
// tests/template-copy-rules.test.ts bans Cyrillic inside one).
//
// ⚠ THE FLAT 280PX WAS THE DESIGN'S OWN SCRAP-BESIDE-A-PHONE-CARD NUMBER (see the comment at
// `.cal-note` in CalendarScreen.vue) and never had to answer for a screen with room to spare –
// WeekRecapCard.vue's own note-beside-photo item measured the identical shape in words: 280px
// "reads as half a scrap at 768 and a quarter at 1280". `min(px, %)` reads the raw string back
// rather than a resolved pixel count – happy-dom does not evaluate CSS math functions – which is
// still an honest assertion that THIS rule, and not some other, is the one in force at each width.
//
// ⚠ MUTATION-VERIFIED (recorded in the round-41 ledger and the executor's report):
//   * delete both `@media` blocks – the 768 and 1024 arms both go red (back to the phone's 280px).
//   * swap the two blocks' bodies – the 768 arm reads 1024's value and vice versa, both red.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { PHONE, TABLET, DESKTOP, setViewport } from './fits'

function snapshotAt(weeks: number, seed: string): Snapshot {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

/** ⚠ SET BEFORE MOUNT, ALWAYS – happy-dom evaluates a media query on an element's first
 *  computed-style read and caches it (round36-pass2-shop-recap.test.ts's header). */
function mountAt(vp: typeof PHONE) {
  setViewport(vp)
  useGameStore().snapshot = snapshotAt(3, 'cal-note-width-41')
  return mount(CalendarScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

const WIDE_1024: typeof PHONE = { width: 1024, height: 800 }

describe('round 41 #10 – the fridge note is wider past 768', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    setViewport(PHONE)
    document.body.innerHTML = ''
  })

  it('⚠ a phone keeps the design’s own 280px – nothing below 768 moved', () => {
    expect(document.head.querySelector('style'), 'no stylesheet – this would be vacuous').toBeTruthy()
    const w = mountAt(PHONE)
    const note = w.find('.cal-note')
    expect(note.exists(), 'the note is on screen').toBe(true)
    expect(getComputedStyle(note.element).maxWidth).toBe('280px')
    w.unmount()
  })

  it('⭐ a tablet at 768 gets the first, wider step', () => {
    const w = mountAt(TABLET)
    const note = w.find('.cal-note')
    expect(getComputedStyle(note.element).maxWidth).toBe('min(420px, 62%)')
    w.unmount()
  })

  it('⭐ 1024 and 1280 both get the second, wider-still step', () => {
    for (const vp of [WIDE_1024, DESKTOP]) {
      const w = mountAt(vp)
      const note = w.find('.cal-note')
      expect(getComputedStyle(note.element).maxWidth, `at ${vp.width}`).toBe('min(480px, 54%)')
      w.unmount()
    }
  })
})
