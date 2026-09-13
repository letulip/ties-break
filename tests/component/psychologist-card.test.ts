// THE PSYCHOLOGIST CARD ON SCREEN T (v76, the psychologist's year – wave 5 T2;
// docs/specs/the-psychologists-year-2026-09.md, docs/plans/life-wave-5-builder-2026-09.md §2 T2).
//
// ⭐⭐ THE SECOND ENTRY IN A LIST THAT WAS BUILT FOR HIM, and the file next door
// (masseur-card.test.ts) is where that promise was written down: «the psychologist is one entry in
// that array plus his own computed block, and nothing else on this tab has to move». This file is
// the other side of it – it addresses him by his own `data-staff` hook, so neither card's pins can
// answer for the other.
//
// ⚠ IT MOUNTS THE SCREEN AND PRESSES THE TAB rather than mounting `SupportStaffTab` directly, on the
// masseur file's own reasoning: «can he get to it» IS the defect that made this tab exist, and a
// test that mounted the tab component would be green on the shape that shipped the bug.
//
// What the card has to get right, and each is a test below:
//   1. LOCKED before the professional career, with the ENGINE's own refusal sentence
//      (PSYCHOLOGIST_LOCKED_DETAIL – the R10-16 doctrine: the disabled state and the refused click
//      tell one story), and no Hire control offered.
//   2. UNLOCKED + UNHIRED: the SNAPSHOT's flat retainer, and a Hire that asks before the family
//      starts paying somebody.
//   3. HIRED: the release direction, which also asks (the screen's own neutrality doctrine).
//   4. ⭐ THE ROSTER DIAL – three rungs, prices off the catalogue, the ACTIVE one off the snapshot,
//      round 40's radio conventions (`role="radiogroup"` / `role="radio"` / `aria-checked`).
//   5. ⚠⚠ NO TRAVEL SWITCH, EVER – ruling Б as a NEGATIVE on the rendered card, which is the only
//      place a «remote seat» can actually be proven remote.
//   6. every number is the snapshot's – a doctored salary moves the card.
//   7. ⭐ the household strip at the head of this very tab moves by exactly his salary – the
//      «HouseholdStrip follows by itself» claim, measured on the real surface.
//   8. the house dialog rule at 375x667, on both of his confirms.
//
// ⚠ MUTATION-VERIFIED – the arms are recorded in tests/wave5-psychologist-seat.test.ts's ledger and
// in the commit message; §8's own arm (the `max-height` stripped off the real card) is inline below,
// because a fit test that cannot fail on the unbounded version is not this test.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, hirePsychologist, setPsychologistRung, toSnapshot, PSYCHOLOGIST_LOCKED_DETAIL } from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { formatCents } from '../../src/shared/money'
import { assertDismissReachable, setViewport, PHONE } from './fits'

const SEAT = '[data-staff="psychologist"]'

/** A junior career (locked), a professional one (unlocked), and the same one with the hire made –
 *  all through the real protocol. The pro door is her first counting W finish on the never-pruned
 *  mark, which is the SAME door the masseur's card opens behind (the travelling-team §2 table). */
function snapshots() {
  const junior = createWorld('psy-card-junior', DEFAULT_PROFILE)
  const pro = createWorld('psy-card-pro', DEFAULT_PROFILE)
  pro.bestFinishByTier.w15 = 0
  const hired = createWorld('psy-card-hired', DEFAULT_PROFILE)
  hired.bestFinishByTier.w15 = 0
  hirePsychologist(hired, true)
  return { junior: toSnapshot(junior), pro: toSnapshot(pro), hired: toSnapshot(hired) }
}

async function mountCard(snapshot: Snapshot, attach = false) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Support staff')
  expect(pill, 'the Support staff tab is on the screen at all').toBeTruthy()
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

describe('the psychologist card on screen T', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('§0 – he is the SECOND seat on the tab, and the masseur is still the first', async () => {
    // The order is the one thing this chapter exists to get right: the owner commissioned the
    // masseur, paid a wave for him and then could not find him.
    const { pro } = snapshots()
    const wrapper = await mountCard(pro)
    const ids = wrapper.findAll('.staff-block').map((b) => b.attributes('data-staff'))
    expect(ids).toEqual(['masseur', 'psychologist'])
    wrapper.unmount()
  })

  it('§1 – locked before the professional career, with the engine`s own sentence and no Hire control', async () => {
    const { junior } = snapshots()
    expect(junior.psychologistUnlocked).toBe(false)
    const wrapper = await mountCard(junior)
    const block = wrapper.find(SEAT)
    expect(block.exists(), 'his card renders on the Support staff tab').toBe(true)
    expect(block.find('.staff-card').classes()).toContain('locked')
    // The line IS the refusal `hirePsychologist` throws – imported, not retyped, so the two cannot
    // drift however the вычитка rewrites the draft.
    expect(block.text()).toContain(PSYCHOLOGIST_LOCKED_DETAIL)
    expect(block.find('.staff-card').find('button').exists(), 'no control is offered while locked').toBe(false)
    expect(block.find('.staff-dial').exists(), 'and no roster to choose from either').toBe(false)
    wrapper.unmount()
  })

  it('§2 – unlocked and unhired: the snapshot`s retainer, and hiring asks first', async () => {
    const { pro } = snapshots()
    expect(pro.psychologistUnlocked).toBe(true)
    const wrapper = await mountCard(pro)
    const block = wrapper.find(SEAT)
    expect(block.text()).toContain(formatCents(pro.psychologistSalaryCents))
    expect(pro.psychologistSalaryCents, 'the default rung`s price, engine-derived').toBe(
      ECONOMY.psychologist.rungs[ECONOMY.psychologist.defaultRung].salaryCents,
    )
    const hire = block.find('.staff-card').findAll('button').find((b) => b.text() === 'Hire')
    expect(hire, 'the Hire control is offered').toBeTruthy()
    expect(wrapper.text()).not.toContain('Put a psychologist on the payroll')
    await hire!.trigger('click')
    await nextTick()
    // Both directions ask – the tap opens a confirm, it does not spend.
    expect(wrapper.text()).toContain('Put a psychologist on the payroll')
    wrapper.unmount()
  })

  it('§3 – hired: the release direction is offered, and it asks too', async () => {
    const { hired } = snapshots()
    expect(hired.psychologistHired).toBe(true)
    const wrapper = await mountCard(hired)
    const card = wrapper.find(SEAT).find('.staff-card')
    const release = card.findAll('button').find((b) => b.text() === 'Let go')
    expect(release, 'the release direction is offered').toBeTruthy()
    await release!.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Let the psychologist go?')
    wrapper.unmount()
  })

  it('§4 – ⭐ the roster dial: three rungs, prices off the catalogue, ACTIVE off the snapshot, radio semantics', async () => {
    const { pro } = snapshots()
    const doctored = { ...pro, psychologistRung: 2 }
    const wrapper = await mountCard(doctored)
    const dial = wrapper.find(`${SEAT} .staff-dial`)
    expect(dial.exists()).toBe(true)
    // Round 40's conventions – the group and its members announce themselves as a radio set.
    expect(dial.attributes('role')).toBe('radiogroup')
    const rungs = wrapper.findAll(`${SEAT} .staff-rung`)
    expect(rungs.length).toBe(ECONOMY.psychologist.rungs.length)
    for (const [i, rung] of ECONOMY.psychologist.rungs.entries()) {
      expect(rungs[i].attributes('role')).toBe('radio')
      expect(rungs[i].text()).toContain(rung.label)
      expect(rungs[i].text()).toContain(formatCents(rung.salaryCents))
      expect(rungs[i].attributes('aria-checked'), `active follows the snapshot (${rung.label})`).toBe(
        i === 2 ? 'true' : 'false',
      )
    }
    wrapper.unmount()
  })

  it('§5 – ⚠⚠ NO TRAVEL SWITCH, hired or not: ruling Б, proven on the rendered card', async () => {
    // «психолог работает дистанционно и стоит только зарплату». The masseur's switch is one block up
    // on the same screen, so this negative is not vacuous – the control exists, and this seat does
    // not have it.
    const { pro, hired } = snapshots()
    const unhired = await mountCard(pro)
    expect(unhired.find(`${SEAT} .staff-travel`).exists()).toBe(false)
    unhired.unmount()

    const wrapper = await mountCard(hired)
    expect(wrapper.find(`${SEAT} .staff-travel`).exists(), 'hired, and still no seat on any plane').toBe(false)
    wrapper.unmount()

    // THE POSITIVE CONTROL: the same markup, on the seat that DOES travel, so «not rendered» above is
    // a fact about the member and not about the selector.
    const masseurHired = createWorld('psy-card-masseur-control', DEFAULT_PROFILE)
    masseurHired.bestFinishByTier.w15 = 0
    masseurHired.masseurHired = true
    const control = await mountCard(toSnapshot(masseurHired))
    expect(control.find('[data-staff="masseur"] .staff-travel').exists()).toBe(true)
    expect(control.find(`${SEAT} .staff-travel`).exists()).toBe(false)
    control.unmount()
  })

  it('§6 – the retainer on the card is the snapshot`s, not the template`s', async () => {
    const { pro } = snapshots()
    const doctored = { ...pro, psychologistSalaryCents: 876_54 }
    const wrapper = await mountCard(doctored)
    expect(wrapper.find(SEAT).text()).toContain(formatCents(876_54))
    wrapper.unmount()
  })

  it('§7 – ⭐⭐ the household strip at the head of this tab moves by EXACTLY his salary', async () => {
    // `shared/protocol/snapshot.ts`'s promise, measured on the surface rather than quoted: the strip
    // reads `coachBilling.household` itself and takes no props, so this is the whole road from the
    // engine's charge to the number a parent reads.
    const world = createWorld('psy-card-strip', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    const before = await mountCard(toSnapshot(world))
    const outBefore = before.find('.budget-household').text()
    before.unmount()

    hirePsychologist(world, true)
    setPsychologistRung(world, 2)
    const snapshot = toSnapshot(world)
    const after = await mountCard(snapshot)
    const outAfter = after.find('.budget-household').text()
    expect(outAfter, 'the strip moved when the payroll did').not.toBe(outBefore)
    expect(outAfter).toContain(`${formatCents(snapshot.coachBilling.household.outgoingCents)} out`)
    expect(snapshot.psychologistSalaryCents).toBe(ECONOMY.psychologist.rungs[2].salaryCents)
    after.unmount()
  })

  // ===============================================================================================
  // §8 – ⭐⭐ THE HOUSE DIALOG RULE, on the two confirms his messages now flow through
  // ===============================================================================================
  //
  // CLAUDE.md's gotcha: «any dialog you add or lengthen gets a mounted assertion that its dismiss
  // control's box is inside a 375x667 viewport», earned by `TourBriefingDialog` shipping 1078px of
  // card into 635px of room on a BLOCKING overlay. The two confirms are keyed on the member id and
  // serve the whole list, so a second seat puts NEW TEXT through an existing card – which is the
  // «lengthened» half of that rule, and the failure mode is slow by design.
  //
  // ⚠ MUTATION-VERIFIED THE WAY `fits.ts` ASKS: the cap arm is what makes a green verdict
  // trustworthy (the content model deliberately UNDER-counts), so the `max-height` is stripped off
  // the real card and the same call must go red.
  it('§8a – ⭐⭐ the hire confirm`s dismiss control is inside a 375x667 phone', async () => {
    setViewport(PHONE)
    const { pro } = snapshots()
    const wrapper = await mountCard(pro, true)
    await wrapper
      .find(SEAT)
      .find('.staff-card')
      .findAll('button')
      .find((b) => b.text() === 'Hire')!
      .trigger('click')
    await nextTick()
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card, 'the confirm is up – nothing here is vacuous without it').toBeTruthy()
    expect(card.textContent, 'and it is HIS confirm').toContain('Put a psychologist on the payroll')
    assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (psychologist hire)')

    const el = card as HTMLElement
    el.style.maxHeight = 'none'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (cap removed)')).toThrow(
      /declares no height bound/,
    )
    wrapper.unmount()
  })

  it('§8b – ...and so is the release confirm`s', async () => {
    setViewport(PHONE)
    const { hired } = snapshots()
    const wrapper = await mountCard(hired, true)
    await wrapper
      .find(SEAT)
      .find('.staff-card')
      .findAll('button')
      .find((b) => b.text() === 'Let go')!
      .trigger('click')
    await nextTick()
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card.textContent, 'it is HIS confirm').toContain('Let the psychologist go?')
    assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (psychologist release)')
    wrapper.unmount()
  })
})
