// =================================================================================================
// ROUND 41 #19 – THE CARD SAYS BOTH NUMBERS, AND STILL FITS A PHONE
// =================================================================================================
//
// The owner, 12.09: «мне написали, что травма отнимет 7 недель, а в итогах года было 4 недели.
// Видимо массажист очень хорошо работает, но в этом случае вообще на экране травмы можно писать
// сколько реально займет восстановление с текущим тиром массажиста.»
//
// The engine arms live beside this file (tests/round41-injury-forecast.test.ts) and share its
// fixture; what is measured HERE is the surface: that the «Out for» row carries the clinic's number
// AND the masseur's, that a career without him renders the row it always did, and – because the card
// GREW – that Continue is still on a 375x667 screen (CLAUDE.md, round-20 #3).
//
// ⚠ THE FIT ARM IS NOT A DUPLICATE OF `injury-cancelled-row.test.ts`'s. That one measures the longest
// card as it stood BEFORE this round: a retirement plus two cancelled entries. This one adds the new
// line on top of exactly that shape, so it is the longest card that can now ship – and it carries its
// own mutation proof, because an arm that cannot fail on the unbounded version is not this arm.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// The dialog plays a cue on mount; audio has no business in a copy test (the shim
// injury-surfacing.test.ts and injury-cancelled-row.test.ts both use).
vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import InjuryStopDialog from '../../src/components/InjuryStopDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { toSnapshot } from '../../src/engine/world'
import { sevenWeeksAndADailyMasseur } from '../helpers/r41InjuryForecast'
import { weekLabel } from '../../src/shared/dates'
import type { Snapshot } from '../../src/shared/protocol'
import { assertDismissReachable, NARROW_PHONE, PHONE, setViewport } from './fits'
// ⚠ THE REAL CASCADE, or the 375x667 measurement below is vacuous – `measureDialog` refuses without
// it. The height bound it reads lives on the shared `.dialog-card` rule, not on this component.
import '../../src/style.css'

function mountReport(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(InjuryStopDialog)
}

/** The «Out for» cell, which is the one row this round touches. */
function outForCell(w: ReturnType<typeof mount>): string {
  const row = w.findAll('tr').find((r) => r.find('th').text() === 'Out for')
  expect(row, 'the card has an Out for row').toBeTruthy()
  return row!.find('td').text()
}

describe('round 41 #19 — the «Out for» row carries both numbers', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ dealt 7, daily masseur: the clinic\'s number stays and his is named beside it', () => {
    // ⚠ THE MUTATION THAT MUST FAIL THIS: fill `expectedWeeks` from `world.injury.totalWeeks` in
    // world/snapshot.ts and the second line reads «more like 7 wks» – the card then says one number
    // twice, which is the shape this item exists to stop.
    const world = sevenWeeksAndADailyMasseur('r41-19-ui-seven')
    const snap = toSnapshot(world)
    const w = mountReport(snap)
    const cell = outForCell(w)

    expect(cell, 'the clinic still speaks first').toContain('~7 wks')
    expect(cell, 'back around, off the countdown').toContain(weekLabel(snap.week + 7))
    expect(cell, 'and the masseur is named, with his own number').toContain('With the masseur – more like 4 wks')
    expect(cell, 'and his own return week').toContain(weekLabel(snap.week + 4))
    w.unmount()
  })

  it('a career with no masseur renders the row it always did – one number, no extra line', () => {
    const world = sevenWeeksAndADailyMasseur('r41-19-ui-none', false)
    const w = mountReport(toSnapshot(world))
    const cell = outForCell(w)
    expect(cell).toContain('~7 wks')
    expect(cell).not.toContain('With the masseur')
    expect(w.find('.injury-stop-projection').exists(), 'the line is not merely empty – it is absent').toBe(false)
    w.unmount()
  })

  it('the countdown row is NOT rewritten – «recovery you can watch» survives the forecast', () => {
    // The ruling this round supersedes is narrower than it looks: the ANNOUNCEMENT gains a second
    // number, the COUNTDOWN keeps the clinic's. If the fix had rewritten `weeksRemaining` the first
    // line would read «~4 wks» and every weekly receipt would have nothing left to report.
    const world = sevenWeeksAndADailyMasseur('r41-19-ui-countdown')
    const snap = toSnapshot(world)
    expect(snap.injury!.weeksRemaining).toBe(7)
    expect(outForCell(mountReport(snap))).toMatch(/^~7 wks/)
  })
})

describe('⭐ round 41 #19 — and the longer card still fits a phone', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** The longest shape this card can now take: `injury-cancelled-row.test.ts`'s own longest (a
   *  retirement, the longest `How` sentence there is, plus two cancelled rows and their refund) with
   *  THIS round's projection line on top. Spliced onto a real snapshot rather than hand-built, so
   *  every other row is the engine's. */
  function mountLongest(vp = PHONE) {
    setViewport(vp)
    const world = sevenWeeksAndADailyMasseur('r41-19-ui-longest')
    const snap = toSnapshot(world)
    snap.injuryReport = {
      ...snap.injuryReport!,
      kind: 'retired-match',
      oppName: 'Aleksandra Vukovic-Delacroix',
      stage: 'Quarterfinal',
      eventLabel: 'National Series',
      cancelled: [
        { id: 'a', label: 'National Series', week: snap.week + 3 },
        { id: 'b', label: 'Junior Tour 300', week: snap.week + 4 },
      ],
      refundCents: 24_000,
    }
    useGameStore().snapshot = snap
    const w = mount(InjuryStopDialog, { attachTo: document.body })
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card, 'the report is up – nothing below is vacuous').toBeTruthy()
    expect(card.textContent ?? '', 'and it really is carrying the new line').toContain('With the masseur')
    expect(dismiss.querySelectorAll('button').length, 'the actions ARE the way out').toBeGreaterThan(0)
    return { w, card, dismiss }
  }

  it('Continue is inside the screen at 375x667 with the projection line on the card', () => {
    const { w, card, dismiss } = mountLongest()
    assertDismissReachable(card, dismiss, PHONE, 'InjuryStopDialog (retirement + cancelled + projection)')
    w.unmount()
  })

  it('...and on the narrowest screen the app supports', () => {
    const { w, card, dismiss } = mountLongest(NARROW_PHONE)
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'InjuryStopDialog (retirement + cancelled + projection)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – strip the height cap and the SAME assertion goes red', () => {
    // Without this the two above prove only that the shared cascade exists. The card's content DOES
    // overflow a phone – art, five table rows, two notes and now a projection – so removing the bound
    // is exactly the shape `TourBriefingDialog` shipped in and the owner's career stopped in.
    const { w, card, dismiss } = mountLongest()
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() =>
      assertDismissReachable(card, dismiss, PHONE, 'InjuryStopDialog (cap removed)'),
    ).toThrow(/dismiss control|taller than the screen/)
    w.unmount()
  })
})
