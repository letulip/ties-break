// ⭐ ROUND 41 #16 – THE WILD-CARD CHIP GETS ITS OWN COLOUR, ON BOTH SCREENS THAT SHOW IT.
//
// The owner: «мне достался wild card на шлем в 16 лет - это очень круто! А давай этот wild card
// как-то другим цветом на карточке выделим, чтобы он прямо в глаза бросался и отличался от наших
// желтых плашек?» (quoted here rather than in a template – tests/template-copy-rules.test.ts bans
// Cyrillic inside one).
//
// Round 21 #2b's badge shared ONE declaration with the defending chip ("ONE RULE, TWO CHIPS, AND NO
// NEW COLOUR IS INVENTED HERE") – split in SeasonScreen.vue, onto a new `--wildcard` token in
// src/style.css (DRAFT: amber). CalendarScreen's marker card is the SAME event card and had never
// drawn the chip at all – `UpcomingEvent.wildCard` already reaches it unchanged through
// `preferredWeekEvent` (composables/tierState.ts), so nothing needed wiring, only the markup.
//
// ⚠ MUTATION-VERIFIED (recorded in the round-41 ledger and the executor's report):
//   * re-merge `.defend-chip, .wildcard-chip { color: var(--accent); ... }` – the colour-inequality
//     arm goes red (both chips read `--accent` again).
//   * drop the `v-if="marker.wildCard"` block from CalendarScreen.vue – the calendar arm goes red.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { assertLegible } from './contrast'
import type { Snapshot } from '../../src/shared/protocol'

/** Every upcoming event flagged, exactly as season-screen.test.ts's own
 *  `withFlagOnFirstCard` does – flagging the set, not "the first row of `upcoming`", is the claim
 *  that is actually about rendering (the screen's `calendarRows`/`lookAhead` do not necessarily
 *  lead with `upcoming[0]`). */
function withWildCard(snap: Snapshot, flag: boolean): Snapshot {
  return { ...snap, upcoming: snap.upcoming.map((e) => (flag ? { ...e, wildCard: true } : e)) }
}

/** ⚠ ATTACHED, ALWAYS, FOR THESE TWO SCREENS. `--wildcard` and `--accent` are `:root` custom
 *  properties with no fallback (`color: var(--wildcard)`, no comma-separated second value) – a
 *  detached `mount()` tree does not inherit from the real document's `:root` at all, so the
 *  declaration is invalid at computed-value time and the chip's `color` reads back as `''`. Found
 *  by running this file: the very first draft asserted on a detached tree and every colour read
 *  empty. `.pill`'s own `color: var(--muted)` fails the identical way underneath it, which is why
 *  the failure was blank rather than some other colour. */
function mountSeasonAttached(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(SeasonScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

/** The two tokens as the sheet declares them (src/style.css) – read once, so a retune of either
 *  fails here with a name rather than a bare hex mismatch. `--wildcard: var(--amber)` resolves to
 *  `--amber: #f5b942`; `--accent: #cfe152` is the defending badge's colour. happy-dom's
 *  `getComputedStyle(...).color` returns the hex form it was declared in, not a normalised `rgb()`. */
const AMBER_HEX = '#f5b942'
const ACCENT_HEX = '#cfe152'

describe('round 41 #16 – SeasonScreen: the wild-card chip is no longer the defending chip', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('⭐⭐ the chip reads the new token, and it is not the defending badge’s accent', () => {
    const wrapper = mountSeasonAttached(withWildCard(careerSnapshot(8, 'r41-wildcard-color'), true))
    const chip = wrapper.find('.wildcard-chip')
    expect(chip.exists(), 'the wild-card chip is on this card').toBe(true)
    const color = getComputedStyle(chip.element).color
    expect(color, 'the chip paints in --wildcard (amber)').toBe(AMBER_HEX)
    expect(color, 'and --wildcard is not an alias of --accent, the defending badge’s colour').not.toBe(ACCENT_HEX)
    wrapper.unmount()
  })

  it('is legible against the card it sits on', () => {
    const wrapper = mountSeasonAttached(withWildCard(careerSnapshot(8, 'r41-wildcard-contrast'), true))
    const chip = wrapper.find('.wildcard-chip')
    expect(chip.exists()).toBe(true)
    assertLegible(chip.element, 'season wildcard-chip')
    wrapper.unmount()
  })

  it('⚠ says nothing at all when the engine did not flag it – the pair the arm above needs', () => {
    const wrapper = mountSeasonAttached(withWildCard(careerSnapshot(8, 'r41-wildcard-off'), false))
    expect(wrapper.findAll('.wildcard-chip')).toHaveLength(0)
    wrapper.unmount()
  })
})

describe('round 41 #16 – CalendarScreen: the marker card gains the same chip', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** The calendar's marker card, opened the way round36-funds-short.test.ts's own
   *  `calendarMarkerCard` does – click the first enterable marker. */
  async function openFirstMarker(snapshot: Snapshot) {
    useGameStore().snapshot = snapshot
    const wrapper = mount(CalendarScreen, { global: { stubs: { teleport: true } } })
    const markers = wrapper.findAll('.cal-marker')
    expect(markers.length, 'the calendar drew no enterable marker to open').toBeGreaterThan(0)
    await markers[0].trigger('click')
    return wrapper
  }

  it('⭐⭐ shows the chip for a wildCard event, with the engine’s own count in the tooltip', async () => {
    const wrapper = await openFirstMarker(withWildCard(careerSnapshot(8, 'r41-cal-wildcard-on'), true))
    const chip = wrapper.find('.wildcard-chip')
    expect(chip.exists(), 'the marker card carries the same chip Season does').toBe(true)
    expect(chip.text().toLowerCase()).toContain('wild card')
    expect(chip.attributes('title') ?? '').toContain('host nation')
    wrapper.unmount()
  })

  it('⚠ says nothing when the engine did not flag it – the pair the arm above needs', async () => {
    const wrapper = await openFirstMarker(withWildCard(careerSnapshot(8, 'r41-cal-wildcard-off'), false))
    expect(wrapper.findAll('.wildcard-chip')).toHaveLength(0)
    wrapper.unmount()
  })
})
