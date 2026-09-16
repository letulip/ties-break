// THE HITTING PARTNER'S CARD ON SCREEN T (v80, wave F2 – docs/specs/the-form-and-the-sparring-2026-09.md §4).
//
// ⭐⭐ THE THIRD ENTRY IN A LIST THAT WAS BUILT FOR EXACTLY THIS, and the two files beside it
// (masseur-card.test.ts, psychologist-card.test.ts) are where the promise was written down twice:
// «adding him is ONE ENTRY in that array plus his own computed block». This file is the other side
// of it a third time – it addresses him by his own `data-staff` hook, so no card's pins can answer
// for another's.
//
// ⚠ IT MOUNTS THE SCREEN AND PRESSES THE TAB rather than mounting `SupportStaffTab` directly, on the
// masseur file's own reasoning: «can he get to it» IS the defect that made this tab exist, and a
// test that mounted the tab component would be green on the shape that shipped the bug.
//
// ⭐⭐ AND IT IS THE ITEM THAT FINALLY HANGS THE PORTRAIT. Round 43 #2 placed the masseur's and the
// psychologist's faces and had to park the third – «`sparring` has no seat to sit on: the three keys
// are RESERVED with no reader anywhere on this tree». This wave reads them, so the file that has
// been shipping in every install since round 42 #53 is finally on a screen.
//
// What the card has to get right, and each is a case below:
//   1. LOCKED before the professional career, with the ENGINE's own refusal (R10-16), no controls.
//   2. UNLOCKED + UNHIRED: the SNAPSHOT's flat weekly contract, and a Hire that asks first.
//   3. HIRED: the release direction, which also asks.
//   4. ⭐ THE ROSTER DIAL – three rungs, prices off the catalogue, the ACTIVE one off the snapshot.
//   5. ⭐ THE TRAVEL SWITCH – he HAS one (the owner's 15.09 override), it defaults OFF, and the
//      sub-line says which shape it buys without printing a bench figure.
//   6. every number is the snapshot's – a doctored salary moves the card.
//   7. ⭐ the household strip at the head of this tab moves by exactly his salary.
//   8. the house dialog rule at 375x667, on both of his confirms.
//   9. the portrait is rendered, from the folder `src/art/preload.ts` spells once.
//
// ⚠ MUTATION-VERIFIED. §5's arm: `travel` removed from the `sparring` member – §5 goes red and §5's
// positive control on the masseur stays green, so «rendered» is a fact about this member. §8's arm:
// the `max-height` stripped off the real card, inline below, because a fit test that cannot fail on
// the unbounded version is not this test.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, hireSparring, setSparringRung, toSnapshot, SPARRING_LOCKED_DETAIL } from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { formatCents } from '../../src/shared/money'
import { assertDismissReachable, PHONE, setViewport } from './fits'

const SEAT = '[data-staff="sparring"]'

/** A junior career (locked), a professional one (unlocked), and the same one hired – all through the
 *  real protocol. The pro door is her first counting W finish on the never-pruned mark, which is the
 *  SAME door the other two seats open behind. */
function snapshots() {
  const junior = createWorld('spar-card-junior', DEFAULT_PROFILE)
  const pro = createWorld('spar-card-pro', DEFAULT_PROFILE)
  pro.bestFinishByTier.w15 = 0
  const hired = createWorld('spar-card-hired', DEFAULT_PROFILE)
  hired.bestFinishByTier.w15 = 0
  hireSparring(hired, true)
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

describe('the hitting partner`s card on screen T', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('§0 – he is the THIRD seat, and the masseur is still the first', async () => {
    // The order is the one thing this chapter exists to get right: the owner commissioned the
    // masseur, paid a wave for him and then could not find him. The newest seat goes last.
    const { pro } = snapshots()
    const wrapper = await mountCard(pro)
    const ids = wrapper.findAll('.staff-block').map((b) => b.attributes('data-staff'))
    expect(ids).toEqual(['masseur', 'psychologist', 'sparring'])
    wrapper.unmount()
  })

  it('§1 – locked before the professional career, with the engine`s own sentence and no controls', async () => {
    const { junior } = snapshots()
    expect(junior.sparringUnlocked).toBe(false)
    const wrapper = await mountCard(junior)
    const block = wrapper.find(SEAT)
    expect(block.exists(), 'his card renders on the Support staff tab').toBe(true)
    expect(block.find('.staff-card').classes()).toContain('locked')
    // The line IS the refusal `hireSparring` throws – imported, not retyped, so the two cannot drift
    // however the вычитка rewrites the draft.
    expect(block.text()).toContain(SPARRING_LOCKED_DETAIL)
    expect(block.find('.staff-card').find('button').exists(), 'no control while locked').toBe(false)
    expect(block.find('.staff-dial').exists(), 'and no ladder to choose from').toBe(false)
    expect(block.find('.staff-travel').exists(), 'and nothing to send anywhere').toBe(false)
    wrapper.unmount()
  })

  it('§2 – unlocked and unhired: the snapshot`s contract, and hiring asks first', async () => {
    const { pro } = snapshots()
    expect(pro.sparringUnlocked).toBe(true)
    const wrapper = await mountCard(pro)
    const block = wrapper.find(SEAT)
    expect(block.text()).toContain(formatCents(pro.sparringSalaryCents))
    expect(pro.sparringSalaryCents, 'the default rung`s price, engine-derived').toBe(
      ECONOMY.sparring.rungs[ECONOMY.sparring.defaultRung].weeklyCents,
    )
    const hire = block.find('.staff-card').findAll('button').find((b) => b.text() === 'Hire')
    expect(hire, 'the Hire control is offered').toBeTruthy()
    expect(wrapper.text()).not.toContain('Put a hitting partner on the payroll')
    await hire!.trigger('click')
    await nextTick()
    expect(wrapper.text(), 'the tap opens a confirm, it does not spend').toContain(
      'Put a hitting partner on the payroll',
    )
    wrapper.unmount()
  })

  it('§3 – hired: the release direction is offered, and it asks too', async () => {
    const { hired } = snapshots()
    expect(hired.sparringHired).toBe(true)
    const wrapper = await mountCard(hired)
    const card = wrapper.find(SEAT).find('.staff-card')
    const release = card.findAll('button').find((b) => b.text() === 'Let go')
    expect(release, 'the release direction is offered').toBeTruthy()
    await release!.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Let the hitting partner go?')
    wrapper.unmount()
  })

  it('§4 – ⭐ the roster dial: three rungs, prices off the catalogue, ACTIVE off the snapshot', async () => {
    const { pro } = snapshots()
    const doctored = { ...pro, sparringRung: 2 }
    const wrapper = await mountCard(doctored)
    const dial = wrapper.find(`${SEAT} .staff-dial`)
    expect(dial.exists()).toBe(true)
    expect(dial.attributes('role')).toBe('radiogroup')
    const rungs = wrapper.findAll(`${SEAT} .staff-rung`)
    expect(rungs.length).toBe(ECONOMY.sparring.rungs.length)
    for (const [i, rung] of ECONOMY.sparring.rungs.entries()) {
      expect(rungs[i].attributes('role')).toBe('radio')
      expect(rungs[i].text()).toContain(rung.label)
      expect(rungs[i].text()).toContain(formatCents(rung.weeklyCents))
      expect(rungs[i].attributes('aria-checked'), `active follows the snapshot (${rung.label})`).toBe(
        i === 2 ? 'true' : 'false',
      )
    }
    wrapper.unmount()
  })

  it('§5 – ⭐ HE HAS THE TRAVEL SWITCH (the owner`s 15.09 override), and it defaults OFF', async () => {
    // «серьезно? даже выбора нет? … у остальных есть галочка "ездит"». The switch exists, and the
    // DEFAULT is a measurement rather than a habit: round 42 #48 priced it at 10.6% of the rust for
    // $60,604 a season, so staying home is the shape a junior career buys.
    const { hired } = snapshots()
    expect(hired.sparringTravels, 'the stance defaults to staying home').toBe(false)
    const wrapper = await mountCard(hired)
    const row = wrapper.find(`${SEAT} .staff-travel`)
    expect(row.exists(), 'the switch is on his card').toBe(true)
    // THE NEGATIVE CONTROL: the psychologist has none, so «rendered» is a fact about this member and
    // not about the selector (ruling Б, one seat over).
    expect(wrapper.find('[data-staff="psychologist"] .staff-travel').exists()).toBe(false)
    // ⚠ AND THE SUB-LINE SAYS WHICH SHAPE IT BUYS AND CARRIES NO BENCH FIGURE – round 42 #46's rule:
    // the sentence states the SHAPE, which stays true when a constant moves.
    const sub = row.text()
    expect(sub, 'it says what the fare is').toContain('one more fare on every trip')
    expect(sub, 'and it says where the rust actually is').toContain('Most rust is made at home')
    expect(sub, 'no bench percentage on screen').not.toMatch(/\d+(\.\d+)?%/)
    wrapper.unmount()
  })

  it('§6 – the weekly figure on the card is the snapshot`s, not the template`s', async () => {
    const { pro } = snapshots()
    const doctored = { ...pro, sparringSalaryCents: 765_43 }
    const wrapper = await mountCard(doctored)
    expect(wrapper.find(SEAT).text()).toContain(formatCents(765_43))
    wrapper.unmount()
  })

  it('§7 – ⭐⭐ the household strip at the head of this tab moves by EXACTLY his salary', async () => {
    const world = createWorld('spar-card-strip', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    const before = await mountCard(toSnapshot(world))
    const outBefore = before.find('.budget-household').text()
    before.unmount()

    hireSparring(world, true)
    setSparringRung(world, 2)
    const snapshot = toSnapshot(world)
    const after = await mountCard(snapshot)
    expect(after.find('.budget-household').text(), 'the strip moved when the payroll did').not.toBe(outBefore)
    expect(after.find('.budget-household').text()).toContain(
      `${formatCents(snapshot.coachBilling.household.outgoingCents)} out`,
    )
    expect(snapshot.sparringSalaryCents).toBe(ECONOMY.sparring.rungs[2].weeklyCents)
    after.unmount()
  })

  it('§8 – ⭐⭐ both confirms` dismiss controls are inside a 375x667 phone', async () => {
    // CLAUDE.md's gotcha: «any dialog you add or lengthen gets a mounted assertion that its dismiss
    // control's box is inside a 375x667 viewport», earned by `TourBriefingDialog` shipping 1078px of
    // card into 635px of room on a BLOCKING overlay. Both of this seat's confirms are NEW sentences,
    // so both are measured.
    //
    // ⚠ MUTATION-VERIFIED THE WAY `fits.ts` ASKS: the cap arm below is what makes a green verdict
    // trustworthy (the content model deliberately UNDER-counts), so the `max-height` is stripped off
    // the real card and the same call must go red.
    setViewport(PHONE)
    const { pro, hired } = snapshots()

    const hiring = await mountCard(pro, true)
    await hiring.find(SEAT).find('.staff-card').findAll('button').find((b) => b.text() === 'Hire')!.trigger('click')
    await nextTick()
    const hireCard = document.querySelector('.dialog-overlay .dialog-card')!
    const hireDismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(hireCard, 'the confirm is up – nothing here is vacuous without it').toBeTruthy()
    assertDismissReachable(hireCard, hireDismiss, PHONE, 'ConfirmDialog (hitting partner hire)')
    ;(hireCard as HTMLElement).style.maxHeight = 'none'
    expect(() =>
      assertDismissReachable(hireCard, hireDismiss, PHONE, 'ConfirmDialog (cap removed)'),
    ).toThrow(/declares no height bound/)
    hiring.unmount()

    const releasing = await mountCard(hired, true)
    await releasing
      .find(SEAT)
      .find('.staff-card')
      .findAll('button')
      .find((b) => b.text() === 'Let go')!
      .trigger('click')
    await nextTick()
    const goCard = document.querySelector('.dialog-overlay .dialog-card')!
    const goDismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(goCard, 'the release confirm is up').toBeTruthy()
    assertDismissReachable(goCard, goDismiss, PHONE, 'ConfirmDialog (hitting partner release)')
    releasing.unmount()
  })

  it('§9 – ⭐ the portrait that has been shipping since round 42 #53 is finally on a screen', async () => {
    // `git grep support-stuff -- src/` returned NOTHING for a whole round while four .webp files were
    // in every install. Round 43 #2 hung two of them and had to park this one for want of a seat.
    const { pro } = snapshots()
    const wrapper = await mountCard(pro)
    const img = wrapper.find(`${SEAT} img`)
    expect(img.exists(), 'his face is rendered').toBe(true)
    expect(img.attributes('src')).toContain('support-stuff/sparring.webp')
    wrapper.unmount()
  })
})
