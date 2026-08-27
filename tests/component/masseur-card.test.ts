// THE MASSEUR CARD ON SCREEN T (v59, travelling team step 1 – docs/specs/the-masseur-2026-08.md).
//
// ⚠⚠ RE-AIMED 27.08 AT THE `Support staff` TAB, AND NOT ONE ASSERTION BELOW CHANGED ITS CLAIM. The
// owner could not find the feature he had commissioned: «он сейчас находится реально "на дне"
// страницы коучей, его там никто и никогда не найдет (я вот не нашел, кстати)». The card was the
// last block of CoachMarketScreen's 1223-line template, under the whole roster, and it moved whole
// into `SupportStaffTab.vue` – a third chapter of the same screen, at the level he named
// («на уровне Her week/Coaches -> Her week/Coaches/Support Stuff»).
//
// Exactly two things moved in this file, and neither is an assertion:
//   * `mountCard` presses the `Support staff` pill instead of `Coaches` – the ADDRESS of the card;
//   * the selectors read `.staff-*` where they read `.masseur-*`, because the block is now a v-for
//     over a LIST of staff members (the psychologist is one entry) and a rule named after one man
//     is exactly the "screen shaped around one person" the new tab exists not to be.
// ⚠ It still mounts the SCREEN and presses the tab rather than mounting the tab component, on
// purpose: "can he get to it" IS the defect, so a test that mounted `SupportStaffTab` directly would
// be green on the shape that shipped the bug.
//
// ⚠ ONE ASSERTION WAS ADDED (§7), and it is the house dialog rule rather than a new claim about the
// masseur: CLAUDE.md's «any dialog you add or lengthen gets a mounted assertion that its dismiss
// control's box is inside a 375x667 viewport». Both confirms changed file in the move, and the coach
// market's own confirms already carry this measurement (round21-coach-travel.test.ts:562), so its
// absence here was a gap the move is the right moment to close.
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
import { assertDismissReachable, setViewport, PHONE } from './fits'

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

async function mountCard(snapshot: Snapshot, attach = false) {
  const store = useGameStore()
  store.snapshot = snapshot
  // ⚠ `attachTo: document.body` FOR THE MEASURED CASE ONLY (§7), and `fits.ts` says why: a detached
  // tree gets none of the real cascade, so a fit measured off it would be vacuous rather than wrong.
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Support staff')
  expect(pill, 'the Support staff tab is on the screen at all – the whole point of the 27.08 move').toBeTruthy()
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
    const card = wrapper.find('.staff-card')
    expect(card.exists(), 'the card renders on the Support staff tab').toBe(true)
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
    const block = wrapper.find('.staff-block')
    // The price is the snapshot's rung-priced flat bill, asserted through the app's own formatter
    // and the snapshot together – a retune moves the expectation with it, and the claim stays "the
    // engine's number reaches the card", never a format.
    expect(block.text()).toContain(formatCents(pro.masseurSalaryCents))
    expect(pro.masseurSalaryCents, 'the default rung`s price, engine-derived').toBe(
      ECONOMY.masseur.defaultSessions * ECONOMY.masseur.perSessionCents,
    )
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
    const card = wrapper.find('.staff-card')
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
    expect(wrapper.find('.staff-block').text()).toContain(formatCents(987_53))
    wrapper.unmount()
  })

  it('§5 – ⭐ the dial: three rungs from the market, the ACTIVE one is the snapshot`s, locked juniors see none', async () => {
    const { junior, pro } = snapshots()
    const lockedWrapper = await mountCard(junior)
    expect(lockedWrapper.find('.staff-dial').exists(), 'no dial while locked').toBe(false)
    lockedWrapper.unmount()
    const doctored = { ...pro, masseurSessionsPerWeek: 7 }
    const wrapper = await mountCard(doctored)
    const rungs = wrapper.findAll('.staff-rung')
    expect(rungs.length).toBe(ECONOMY.masseur.rungs.length)
    for (const [i, rung] of ECONOMY.masseur.rungs.entries()) {
      expect(rungs[i].text()).toContain(rung.label)
      expect(rungs[i].text()).toContain(formatCents(rung.sessions * ECONOMY.masseur.perSessionCents))
      expect(rungs[i].attributes('aria-checked'), `active follows the snapshot (${rung.label})`).toBe(
        rung.sessions === 7 ? 'true' : 'false',
      )
    }
    wrapper.unmount()
  })

  it('§6 – ⭐ the travel switch: hired only, aria state off the snapshot, the as-if fare quoted on the sub-line', async () => {
    const { pro, hired } = snapshots()
    const unhiredWrapper = await mountCard(pro)
    expect(unhiredWrapper.find('.staff-travel').exists(), 'no switch while nobody is on the payroll').toBe(false)
    unhiredWrapper.unmount()
    const doctored = { ...hired, masseurTravels: true, masseurTravelTrips: 2, masseurTravelFareCents: 1234_00 }
    const wrapper = await mountCard(doctored)
    const row = wrapper.find('.staff-travel')
    expect(row.exists()).toBe(true)
    expect(row.find('.cm-switch').attributes('aria-checked')).toBe('true')
    expect(row.text(), 'the booked trips are priced off the snapshot').toContain(formatCents(1234_00))
    expect(row.text()).toContain('2 trips')
    wrapper.unmount()
  })

  // ===============================================================================================
  // §7 – ⭐⭐ THE HOUSE DIALOG RULE, on the two confirms that changed file in the move
  // ===============================================================================================
  //
  // CLAUDE.md's gotcha: «any dialog you add or lengthen gets a mounted assertion that its dismiss
  // control's box is inside a 375x667 viewport», earned by `TourBriefingDialog` shipping 1078px of
  // card into 635px of room on a BLOCKING overlay. Neither masseur confirm grew a word here – but
  // both moved into a new component, and every other confirm on this screen family already carries
  // this measurement (round21-coach-travel.test.ts:562, shop-tab.test.ts:184). This closes the gap.
  //
  // ⚠ MUTATION-VERIFIED THE WAY `fits.ts` ASKS: the cap arm below is what makes a green verdict
  // trustworthy (the content model deliberately UNDER-counts), so the `max-height` is stripped off
  // the real card and the same call must go red. A test that cannot fail on the unbounded version is
  // not this test.
  it('§7 – ⭐⭐ the hire confirm`s dismiss control is inside a 375x667 phone', async () => {
    setViewport(PHONE)
    const { pro } = snapshots()
    const wrapper = await mountCard(pro, true)
    await wrapper
      .find('.staff-block')
      .findAll('button')
      .find((b) => b.text() === 'Hire')!
      .trigger('click')
    await nextTick()
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card, 'the confirm is up – nothing here is vacuous without it').toBeTruthy()
    assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (masseur hire)')

    const el = card as HTMLElement
    el.style.maxHeight = 'none'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (cap removed)')).toThrow(
      /declares no height bound/,
    )
    wrapper.unmount()
  })
})
