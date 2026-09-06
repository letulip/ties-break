// ⭐ U-12 (review of 05.09, docs/review-principles-2026-09-05/03-ui.md) – ONE `fundsShort`, TWO
// SCREENS, AND THE CLAIM IS MADE ON WHAT THEY DRAW.
//
// `SeasonScreen.vue:856-858` and `CalendarScreen.vue:265-267` were byte-identical
// (`return fundsCents.value < e.entryFeeCents`) and were listed as still open by two reviews
// running. The rule now lives in `useEventCard` beside the other card facts.
//
// ⚠ WHY A MOUNTED TEST AND NOT A SOURCE PIN. What the duplicate could do was let ONE screen offer an
// Enter the other refused – a disagreement that is only visible in what the two cards render, and
// invisible to any assertion about the composable itself. So both surfaces are mounted against the
// SAME snapshot and the same balance, and the two are compared to each other.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed: `fundsShort` returning a constant
// `false` reddens the broke arm on both screens; returning `true` reddens the flush arm on both.
// The log is in the wave's scratch as `u12-red.log`.
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { mountSeason } from '../helpers/mountSeason'
import { careerSnapshot } from '../helpers/career'
import type { Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage. The same shim and the same argument as
// tests/component/round28-top-notices.test.ts, quoted there in full.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

/** ⚠ `import.meta.url` IS NOT A FILE URL IN THIS PROJECT – the same wall tests/helpers/career.ts and
 *  tests/component/round14-group-c.test.ts both name: under happy-dom it resolves to an http scheme
 *  and `new URL(..., import.meta.url)` throws at COLLECT time, so the whole file reports "no tests"
 *  rather than one red assertion. Vitest's cwd is the repo root. The length bound at the call site
 *  is what would catch it if that stopped being true. */
const repoFile = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8')

const FLUSH = 500_000_00
const BROKE = 0

/** A career twelve weeks in – the same walk tests/component/round14-group-c.test.ts opens a marker
 *  from – with the family's balance set by the arm. */
function careerWith(fundsCents: number, seed = 'u12-funds'): Snapshot {
  const snapshot = careerSnapshot(12, seed)
  snapshot.fundsCents = fundsCents
  return snapshot
}

/** The Season feed's Enter controls, with the hint that sits beside each. */
function seasonEnters(fundsCents: number) {
  const wrapper = mountSeason(careerWith(fundsCents))
  const enters = wrapper.findAll('button').filter((b) => b.text() === 'Enter')
  return { wrapper, enters }
}

/** The Calendar's marker card, which is the only route to its Enter. */
async function calendarMarkerCard(fundsCents: number) {
  useGameStore().snapshot = careerWith(fundsCents)
  const wrapper = mount(CalendarScreen, { global: { stubs: { teleport: true } } })
  const markers = wrapper.findAll('.cal-marker')
  expect(markers.length, 'the calendar drew no enterable marker to open').toBeGreaterThan(0)
  await markers[0].trigger('click')
  const enter = wrapper.findAll('button').find((b) => b.text() === 'Enter')
  expect(enter, 'the marker card has no Enter on it').toBeTruthy()
  return { wrapper, enter: enter!, broke: wrapper.find('.cal-card-broke') }
}

describe('⭐ U-12 – the two screens ask one question about the account', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('the season feed refuses every fee-bearing entry to a family with nothing', () => {
    const { wrapper, enters } = seasonEnters(BROKE)
    // Anti-vacuity: a feed with no Enter on it would pass every assertion below by drawing nothing.
    expect(enters.length, 'the feed offered no entry at all').toBeGreaterThan(0)
    for (const enter of enters) {
      expect(enter.attributes('disabled'), `${enter.attributes('aria-label')} is still pressable`).toBeDefined()
    }
    expect(wrapper.text()).toContain('Not enough funds')
    wrapper.unmount()
  })

  it('...and offers them to a family that can pay', () => {
    const { wrapper, enters } = seasonEnters(FLUSH)
    expect(enters.length).toBeGreaterThan(0)
    expect(wrapper.text(), 'a flush family is being told it is broke').not.toContain('Not enough funds')
    wrapper.unmount()
  })

  it('⚠ the calendar marker card gives the SAME two answers on the same career', async () => {
    const broke = await calendarMarkerCard(BROKE)
    expect(broke.enter.attributes('disabled'), 'the marker card offers what the feed refuses').toBeDefined()
    expect(broke.broke.exists(), 'and says nothing about why').toBe(true)
    expect(broke.broke.text()).toBe('Not enough funds')
    broke.wrapper.unmount()

    setActivePinia(createPinia())
    const flush = await calendarMarkerCard(FLUSH)
    expect(flush.enter.attributes('disabled'), 'a flush family cannot enter from the calendar').toBeUndefined()
    expect(flush.broke.exists()).toBe(false)
    flush.wrapper.unmount()
  })

  it('⚠ and neither screen owns the rule any more', () => {
    // The negative half, and it is a claim about these two FILES rather than about their logic –
    // the `.vue` alone, never widened to the composables it imports (tests/pin-hygiene.test.ts),
    // because `< e.entryFeeCents` is exactly what now lives in one of those and the widened read
    // would find it there and pass on a tree where nothing had moved.
    for (const rel of ['SeasonScreen', 'CalendarScreen']) {
      const src = repoFile(`src/components/screens/${rel}.vue`)
      expect(src.length, `${rel} did not load`).toBeGreaterThan(500)
      expect(src, `${rel} still derives the answer itself`).not.toContain('< e.entryFeeCents')
      expect(src, `${rel} does not read the shared fact`).toContain('fundsShort')
    }
  })
})
