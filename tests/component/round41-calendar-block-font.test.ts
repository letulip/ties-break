// ⭐ ROUND 41 #12 – LARGER TYPE ON THE CALENDAR'S COLOURED PLATES, PAST 768.
//
// The owner: «на календаре на цветных плашках на десктоп и планшет сделать шрифт крупнее» (quoted
// here rather than in a template – tests/template-copy-rules.test.ts bans Cyrillic inside one).
//
// ⚠ tests/calendar-grid.test.ts and tests/calendar-screen.test.ts pin structure, colour tokens and
// the literal string 'cal-block' – recon confirmed neither pins a font-size, so this file is the
// first and only guard on the number.
//
// ⚠ MUTATION-VERIFIED (recorded in the round-41 ledger and the executor's report):
//   * delete both `@media` blocks – the 768 and 1024 arms both go red (back to 8.5px).
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
  useGameStore().snapshot = snapshotAt(3, 'cal-block-font-41')
  return mount(CalendarScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

const WIDE_1024: typeof PHONE = { width: 1024, height: 800 }

describe('round 41 #12 – the calendar plates read larger past 768', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    setViewport(PHONE)
    document.body.innerHTML = ''
  })

  it('⚠ a phone keeps the fitted 8.5px – nothing below 768 moved', () => {
    expect(document.head.querySelector('style'), 'no stylesheet – this would be vacuous').toBeTruthy()
    const w = mountAt(PHONE)
    const block = w.find('.cal-block')
    expect(block.exists(), 'the week grid drew at least one plate').toBe(true)
    expect(getComputedStyle(block.element).fontSize).toBe('8.5px')
    w.unmount()
  })

  it('⭐ a tablet at 768 steps up to 10px', () => {
    const w = mountAt(TABLET)
    const block = w.find('.cal-block')
    expect(block.exists()).toBe(true)
    expect(getComputedStyle(block.element).fontSize).toBe('10px')
    w.unmount()
  })

  it('⭐ 1024 and 1280 both step up again, to 11px', () => {
    for (const vp of [WIDE_1024, DESKTOP]) {
      const w = mountAt(vp)
      const block = w.find('.cal-block')
      expect(block.exists(), `at ${vp.width}`).toBe(true)
      expect(getComputedStyle(block.element).fontSize, `at ${vp.width}`).toBe('11px')
      w.unmount()
    }
  })

  it('the safety nets a larger font leans on are still declared, unmoved', () => {
    const w = mountAt(DESKTOP)
    const cs = getComputedStyle(w.find('.cal-block').element)
    expect(cs.overflow, 'a label that cannot fit clips rather than spilling out').toBe('hidden')
    expect(cs.wordBreak, 'and a long word still breaks inside the plate').toBe('break-word')
    w.unmount()
  })
})
