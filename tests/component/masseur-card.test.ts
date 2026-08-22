// THE MASSEUR CARD ON SCREEN T (v59, travelling team step 1 – docs/specs/the-masseur-2026-08.md).
//
// What the card has to get right, and each is a test below:
//   1. LOCKED before the professional career, and the line is the ENGINE's own refusal sentence
//      (MASSEUR_LOCKED_DETAIL) – the R10-16 doctrine: the disabled state and the refused click tell
//      one story. No Hire control is offered while locked.
//   2. UNLOCKED + UNHIRED: the pitch, the SNAPSHOT's flat salary (never a number typed into the
//      template), and a Hire control that asks before the family starts paying somebody.
//   3. HIRED: ⭐ THE SENTENCE – the card prints `snapshot.masseurNote` verbatim, digit-free, and
//      offers the release direction, which also asks (the screen's own neutrality doctrine).
//   4. every fact on the card is the snapshot's: the salary read off a doctored snapshot moves the
//      card, which is what proves nothing is hard-coded.
//
// ⚠ MUTATION-VERIFIED (each arm run against this file, then reverted):
//   * template printing a literal note instead of `masseurLine` -> §3's verbatim test;
//   * `masseurLine` returning the pitch while hired -> §3;
//   * the lock state rendering the Hire button anyway (`v-else-if` -> `v-if`) -> §1's control test;
//   * the salary hard-coded as text -> §4's doctored-snapshot test;
//   * ConfirmDialog wired to fire immediately (no ask) -> §2's dialog test.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, hireMasseur, toSnapshot, MASSEUR_LOCKED_DETAIL } from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { formatCents } from '../../src/shared/money'

/** A junior career (locked), a professional one (unlocked), and the same one with the hire made –
 *  all through the real protocol: the pro door is her first counting W finish on the never-pruned
 *  mark, which is exactly what `masseurUnlocked` reads. */
function snapshots() {
  const junior = createWorld('masseur-card-junior', DEFAULT_PROFILE)
  const pro = createWorld('masseur-card-pro', DEFAULT_PROFILE)
  pro.bestFinishByTier.w15 = 0
  const hired = createWorld('masseur-card-hired', DEFAULT_PROFILE)
  hired.bestFinishByTier.w15 = 0
  hireMasseur(hired, true)
  return { junior: toSnapshot(junior), pro: toSnapshot(pro), hired: toSnapshot(hired) }
}

async function mountCard(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

describe('the masseur card on screen T', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('§1 – locked before the professional career, with the engine`s own sentence and no Hire control', async () => {
    const { junior } = snapshots()
    expect(junior.masseurUnlocked).toBe(false)
    const wrapper = await mountCard(junior)
    const card = wrapper.find('.masseur-card')
    expect(card.exists(), 'the card renders on the Coaches tab').toBe(true)
    expect(card.classes()).toContain('locked')
    // The line IS the refusal `hireMasseur` throws – imported, not retyped, so the two cannot drift.
    expect(card.text()).toContain(MASSEUR_LOCKED_DETAIL)
    expect(card.find('button').exists(), 'no control is offered while locked').toBe(false)
    wrapper.unmount()
  })

  it('§2 – unlocked and unhired: the snapshot`s salary, and hiring asks first', async () => {
    const { pro } = snapshots()
    expect(pro.masseurUnlocked).toBe(true)
    const wrapper = await mountCard(pro)
    const block = wrapper.find('.masseur-block')
    // The price is the snapshot's flat salary, asserted through the app's own formatter and the
    // engine knob together – a retune moves the expectation with it, and the claim stays "the
    // engine's number reaches the card", never a format.
    expect(block.text()).toContain(formatCents(ECONOMY.masseur.salaryPerWeekCents))
    const hire = block.findAll('button').find((b) => b.text() === 'Hire')
    expect(hire, 'the Hire control is offered').toBeTruthy()
    expect(wrapper.text()).not.toContain('Put a masseur on the payroll')
    await hire!.trigger('click')
    await nextTick()
    // Both directions ask (the screen's own doctrine) – the tap opens a confirm, it does not spend.
    expect(wrapper.text()).toContain('Put a masseur on the payroll')
    wrapper.unmount()
  })

  it('§3 – ⭐ hired: the card prints THE SENTENCE verbatim off the snapshot, digit-free, and release asks', async () => {
    const { hired } = snapshots()
    expect(hired.masseurHired).toBe(true)
    expect(hired.masseurNote.length).toBeGreaterThan(0)
    const wrapper = await mountCard(hired)
    const card = wrapper.find('.masseur-card')
    expect(card.text()).toContain(hired.masseurNote)
    expect(hired.masseurNote, 'the note quotes no figure').not.toMatch(/\d/)
    const release = card.findAll('button').find((b) => b.text() === 'Let go')
    expect(release, 'the release direction is offered').toBeTruthy()
    await release!.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Let the masseur go?')
    wrapper.unmount()
  })

  it('§4 – the salary on the card is the snapshot`s, not the template`s', async () => {
    const { pro } = snapshots()
    const doctored = { ...pro, masseurSalaryCents: 987_53 }
    const wrapper = await mountCard(doctored)
    expect(wrapper.find('.masseur-block').text()).toContain(formatCents(987_53))
    wrapper.unmount()
  })
})
