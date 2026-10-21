// ROUND 53 STEP 2 – the release confirm prints the consequences the engine states (docs/specs/injury-honest-week-2026-10.md §3).
// ⚠ MUTATION-VERIFIED: printing `backWithoutWeek` twice (instead of backWithWeek in the first slot) -> the
// weeks test goes red; deleting the atRisk sentence -> the entries test goes red.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import SupportStaffTab from '../../src/components/SupportStaffTab.vue'
import { useGameStore } from '../../src/stores/game'
import { toSnapshot } from '../../src/engine/world'
import { TIERS } from '../../src/engine/season/calendar'
import { weekLabel } from '../../src/i18n/dates'
import type { Snapshot } from '../../src/shared/protocol'
import { assertDismissReachable, setViewport, PHONE } from './fits'
import { NOW, layoffWithAMasseur } from '../helpers/r53MasseurRelease'

const OLD = 'Let the masseur go? The weekly salary stops, and rehab goes back to the clinic alone.'

async function openRelease(snapshot: Snapshot): Promise<string> {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(SupportStaffTab, { global: { stubs: { teleport: true } } })
  const release = wrapper.findAll('button').find((b) => b.text() === 'Let go')
  expect(release, 'the release direction is offered').toBeTruthy()
  await release!.trigger('click')
  await nextTick()
  const text = wrapper.text()
  wrapper.unmount()
  return text
}

describe('round 53 step 2 – the masseur release confirm', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('with the view: both return weeks and the entry it will withdraw, from the snapshot', async () => {
    const snap = toSnapshot(layoffWithAMasseur('r53-component'))
    const text = await openRelease(snap)
    expect(text).toContain(OLD)
    expect(text).toContain(`Her return moves from ${weekLabel(NOW + 4, snap.startYear)} to ${weekLabel(NOW + 6, snap.startYear)}.`)
    expect(text).toContain('These entries will be withdrawn – the doctor will not clear her in time: ')
    expect(text).toContain(`${TIERS.national.label} – ${weekLabel(NOW + 4, snap.startYear)}`)
  })

  it('the numbers are the snapshot`s: a doctored clinic week moves the sentence', async () => {
    const snap = toSnapshot(layoffWithAMasseur('r53-component-doctored'))
    const doctored = { ...snap, masseurRelease: { ...snap.masseurRelease!, backWithoutWeek: NOW + 9, atRisk: [] } }
    const text = await openRelease(doctored)
    expect(text).toContain(`to ${weekLabel(NOW + 9, snap.startYear)}.`)
    expect(text, 'no list when the gap holds no entry').not.toContain('These entries will be withdrawn')
  })

  it('without the view: the old message, byte for byte (control)', async () => {
    const snap = toSnapshot(layoffWithAMasseur('r53-component-control', { injured: false }))
    expect(snap.masseurRelease).toBeUndefined()
    const text = await openRelease(snap)
    expect(text).toContain(OLD)
    expect(text).not.toContain('Her return moves')
    expect(text).not.toContain('These entries will be withdrawn')
  })

  // CLAUDE.md: a dialog that grows gets a mounted assertion that its dismiss control stays inside 375x667.
  // The release confirm just gained two sentences. `setViewport` BEFORE the mount (happy-dom caches the query).
  it('the longest release confirm still keeps its dismiss control inside a 375x667 phone', async () => {
    setViewport(PHONE)
    const store = useGameStore()
    store.snapshot = toSnapshot(layoffWithAMasseur('r53-component-phone'))
    const wrapper = mount(SupportStaffTab, { global: { stubs: { teleport: true } }, attachTo: document.body })
    await wrapper.findAll('button').find((b) => b.text() === 'Let go')!.trigger('click')
    await nextTick()
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card.textContent).toContain('Her return moves')
    assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (masseur release, with consequences)')
    ;(card as HTMLElement).style.maxHeight = 'none'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'cap removed')).toThrow(/declares no height bound/)
    wrapper.unmount()
  })
})
