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
import {
  createWorld,
  hirePsychologist,
  setPsychologistRung,
  toSnapshot,
  PSYCHOLOGIST_LOCKED_DETAIL,
  // v76 T3 – the year-focus catalogue and the two refusal sentences these cases render. Imported
  // from the engine that authors them, never retyped, so the вычитка moves the draft and the pin.
  PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL,
  PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL,
  PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
  PSY_FOCUSES,
  PSY_FOCUS_LABEL,
  PSY_FOCUS_LINE,
} from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { formatCents } from '../../src/shared/money'
import { assertDismissReachable, availableWidth, boxOf, setViewport, DESKTOP, PHONE, TABLET, type Viewport } from './fits'

/** ⭐ HIS STANDING RULE OF 14.09 – the visual pass is a deliverable, at the wave gate's own parity
 *  widths. 900 is the top of his tablet band and has no entry in `fits.ts`. */
const WIDE: Viewport = { width: 900, height: 900 }
const SWEEP: Viewport[] = [PHONE, TABLET, WIDE, DESKTOP]

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

  it('§3b – ⭐ THE RUNNING YEAR LIVES ON THE HIRED LINE (the owner, 14.09 – wave-5 question 9)', async () => {
    // The four PSY_FOCUS_LINE sentences were readable ~3 weeks a year (the focus row's note is
    // correctly the engine's refusal the other 49 – R10-16, untouched). His «да, вписывай строку
    // с годом» gives them the surface that is visible all 52: the hired line splices the running
    // year's own sentence after the retainer's opening, first letter lowered.
    //
    // ⚠ THE EXPECTATION IS THE IMPORTED CONSTANT SPLICED HERE, NEVER RETYPED – this file's own
    //   doctrine (§1's note), so a вычитка pass over PSY_FOCUS_LINE moves this pin with it.
    // ⚠ ARM (watched red before landing): the splice dropped from `psychologistLine`'s hired arm
    //   – the with-focus half fails on the exact composed sentence; the no-focus half stays
    //   green, which is why BOTH halves are asserted.
    const { hired } = snapshots()
    expect(hired.psychologistFocus, 'the plain-hire fixture really has no year chosen').toBeNull()
    const plain = await mountCard(hired)
    expect(plain.find(SEAT).text()).toContain('On retainer – one call a week, wherever she is.')
    plain.unmount()

    const focused = { ...hired, psychologistFocus: 'coolhead' as const }
    const year = PSY_FOCUS_LINE.coolhead
    const wrapper = await mountCard(focused)
    const text = wrapper.find(SEAT).text()
    expect(text, 'the hired line carries the running year, spliced').toContain(
      `On retainer – ${year.charAt(0).toLowerCase()}${year.slice(1)}`,
    )
    expect(text, 'and the plain retainer line stepped aside').not.toContain(
      'On retainer – one call a week, wherever she is.',
    )
    wrapper.unmount()
  })

  it('§3c – ⭐⭐ v77 T5: THE FIFTH YEAR SPLICES TOO, and the card is where that is provable', async () => {
    // ⚠⚠ THE ONE THING T5's ENGINE SUITE CANNOT SAY. «The public life» (O7) brings a new
    // `PSY_FOCUS_LINE` row, and the owner's Q9 ruling (14.09) means every row has to read in TWO
    // frames: alone, as the focus row's note, and spliced after «On retainer – » with its first
    // letter lowered. A catalogue test can check the second frame's ARITHMETIC; only a mounted card
    // can check that the splice the SCREEN performs lands on the sentence the reader sees, which is
    // this file's own doctrine («prefer a mounted test to a source pin»).
    //
    // ⚠ THE EXPECTATION IS THE IMPORTED CONSTANT SPLICED HERE, NEVER RETYPED – §3b's rule, so T8's
    // вычитка moves this pin with the draft.
    const { hired } = snapshots()
    const focused = { ...hired, psychologistFocus: 'publicLife' as const }
    const year = PSY_FOCUS_LINE.publicLife
    const wrapper = await mountCard(focused)
    const text = wrapper.find(SEAT).text()
    expect(text, 'the hired line carries the fifth year, spliced').toContain(
      `On retainer – ${year.charAt(0).toLowerCase()}${year.slice(1)}`,
    )
    // ⚠ AND THE SPLICE REALLY DID SOMETHING – a line already starting lowercase, or starting on a
    // digit or a quotation mark, would satisfy the `toContain` above while reading as nonsense in the
    // OTHER frame. So: the first character is a cased letter that the splice actually lowers.
    expect(year.charAt(0), 'the line opens on a capital, so it reads alone as a sentence')
      .not.toBe(year.charAt(0).toLowerCase())
    wrapper.unmount()

    // ...AND THE SAME LINE ALONE, in the note, which is the frame it was written for first.
    const open = {
      ...hired,
      psychologistFocus: 'publicLife' as const,
      psychologistFocusOpen: [...PSY_FOCUSES],
      psychologistFocusDetail: '',
    }
    const second = await mountCard(open)
    expect(second.find(`${SEAT} .staff-focus-note`).text(), 'and unspliced it is the catalogue`s own row')
      .toBe(year)
    second.unmount()
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
  // §9-§11 – ⭐⭐ THE YEAR'S WORK (v76 T3), the second radio group under this seat
  // ===============================================================================================
  //
  // ⭐⭐ THIS IS THE READER RULING G DEMANDED. `psychologistFocus` was kept OFF the wire in T2 because
  // E-07's contract test («a Snapshot member with no reader is a promise to the UI that nothing
  // collects») refuses a member nobody reads – so the field and this row ship in one commit, and
  // these three cases are the «its reader» half of that sentence.
  //
  // ⚠ AND EVERY FACT IN THE ROW IS THE ENGINE'S, which is stricter here than on the dial above: the
  // consent gates read the bond BAND, and the fog law forbids `bond` reaching the UI in any shape, so
  // this card CANNOT derive which options are live. It is handed `psychologistFocusOpen` and
  // `psychologistFocusDetail` and renders exactly them – the R10-16 doctrine, where a disabled button
  // and the click it refuses come from one function (`psychologistFocusRefusal`).
  it('§9 – ⭐ the row appears with the HIRE and not before it', async () => {
    // A year of work with nobody on the payroll is refused engine-side, so a row offered before the
    // hire would be a control lying about itself (round-20 #1, and the travel switch's own rule).
    const { pro, hired } = snapshots()
    const unhired = await mountCard(pro)
    expect(unhired.find(`${SEAT} .staff-focus`).exists(), 'nothing to work on without somebody to work it')
      .toBe(false)
    unhired.unmount()

    const wrapper = await mountCard(hired)
    const row = wrapper.find(`${SEAT} .staff-focus`)
    expect(row.exists(), 'hired, and the year is now a question').toBe(true)
    // Round 40's conventions, the dial's own one block up.
    expect(row.attributes('role')).toBe('radiogroup')
    const options = wrapper.findAll(`${SEAT} .staff-focus-option`)
    // ⚠ THE COUNT IS THE ROSTER'S AND ALWAYS WAS, so v77's fifth focus («The public life», O7) moved
    // this line's MESSAGE and not its assertion – the card renders whatever `PSY_FOCUSES` holds.
    expect(options.length, 'one option per focus on the roster – five since v77 T5').toBe(PSY_FOCUSES.length)
    // ⚠⚠ RE-AIMED BY ROUND 42 #18 (15.09) – AN OPTION IS A NAME OVER A SENTENCE NOW, so «the
    // button's whole text is the label» stopped being the claim. The owner: «в пунктах психолога на
    // выбор немного расписать эффект от работы». The name is asserted on its own element here and
    // the sentence beside it in the case below; leaving this as a whole-text equality would have
    // made the item's own change read as a regression.
    for (const [i, focus] of PSY_FOCUSES.entries()) {
      expect(options[i].attributes('role')).toBe('radio')
      expect(options[i].find('.staff-focus-name').text()).toBe(PSY_FOCUS_LABEL[focus])
      expect(options[i].attributes('aria-checked'), 'nothing is chosen yet').toBe('false')
    }
    // ⚠ AND THE RUNG DIAL IS UNTOUCHED BESIDE IT – three buttons, not seven. The two groups are
    // deliberately different classes: `.staff-rung` is the roster, `.staff-focus-option` is the year,
    // and the masseur's own pins sweep the first by name.
    expect(wrapper.findAll(`${SEAT} .staff-rung`).length).toBe(ECONOMY.psychologist.rungs.length)
    wrapper.unmount()
  })

  it('⭐⭐ ROUND 42 #18 – every option says what its year is FOR, in the catalogue`s own sentence', async () => {
    // His ask, and the whole of it: the picker rendered five labels and the five owner-gated
    // sentences existed the whole time, reaching only the hired line's splice – which is read AFTER
    // the decision rather than while it is being taken. Zero new wording; what moved is where the
    // words are.
    const { hired } = snapshots()
    const wrapper = await mountCard(hired)
    const options = wrapper.findAll(`${SEAT} .staff-focus-option`)
    expect(options.length, 'one per focus on the roster').toBe(PSY_FOCUSES.length)
    for (const [i, focus] of PSY_FOCUSES.entries()) {
      // ⚠ OFF THE IMPORTED CONSTANT, never a copy typed here – the wave-5 §3b idiom, and the reason
      // a вычитка pass over `PSY_FOCUS_LINE` moves this pin with the screen instead of against it.
      expect(options[i].find('.staff-focus-blurb').text(), focus).toBe(PSY_FOCUS_LINE[focus])
    }
    // ...AND THE SENTENCES REALLY ARE FIVE DIFFERENT ONES, which is what makes the row worth reading:
    // a picker that printed one sentence five times would satisfy every assertion above.
    const blurbs = options.map((o) => o.find('.staff-focus-blurb').text())
    expect(new Set(blurbs).size, 'five years, five sentences').toBe(PSY_FOCUSES.length)
    // ⚠⚠ AND THE SENTENCE IS ALLOWED TO WRAP, which is the one way this row can break. These are
    // 60-90 characters inside half a phone's width; under the `nowrap` the pill row could easily
    // have inherited, every option would read «The year goes on the b…» and the item would have
    // shipped as a truncation. Read through the real cascade, so a future rule reddens it.
    for (const o of options) {
      expect(getComputedStyle(o.find('.staff-focus-blurb').element).whiteSpace, 'the sentence wraps')
        .not.toBe('nowrap')
    }
    // ⚠ AND THE NOTE UNDER THE ROW IS UNTOUCHED: before the first pick it stays empty, because the
    // labelled options now say what is on offer and a placeholder would be this screen inventing
    // copy (`psychologistFocusNote`'s own rule).
    expect(wrapper.find(`${SEAT} .staff-focus-note`).exists(), 'nothing chosen, nothing to report').toBe(false)
    wrapper.unmount()
  })

  it('§10 – ⭐⭐ the live options are the ENGINE`s, and the row prints the ENGINE`s sentence', async () => {
    const { hired } = snapshots()
    // A RUNNING YEAR: the snapshot says nothing may be chosen and why, and the card obeys both.
    const running = {
      ...hired,
      psychologistFocus: 'coolhead' as const,
      psychologistFocusOpen: [],
      psychologistFocusDetail: PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
    }
    const wrapper = await mountCard(running)
    const options = wrapper.findAll(`${SEAT} .staff-focus-option`)
    expect(options[0].attributes('aria-checked'), 'the running year is the checked one').toBe('true')
    for (const [i, focus] of PSY_FOCUSES.entries()) {
      expect(options[i].attributes('disabled'), `${focus} is withheld`).toBeDefined()
    }
    expect(wrapper.find(`${SEAT} .staff-focus-note`).text(), 'the engine`s own words').toBe(
      PSYCHOLOGIST_FOCUS_SEASON_REFUSAL,
    )
    wrapper.unmount()

    // AND THE OPEN STATE: four live buttons, and the note says what the running year is FOR – the
    // catalogue's line, never a sentence this screen composed.
    const open = {
      ...hired,
      psychologistFocus: 'listen' as const,
      psychologistFocusOpen: [...PSY_FOCUSES],
      psychologistFocusDetail: '',
    }
    const second = await mountCard(open)
    for (const b of second.findAll(`${SEAT} .staff-focus-option`)) {
      expect(b.attributes('disabled'), 'every year is on offer').toBeUndefined()
    }
    expect(second.find(`${SEAT} .staff-focus-note`).text()).toBe(PSY_FOCUS_LINE.listen)
    second.unmount()
  })

  it('§11 – ⭐⭐ HER CONSENT REACHES THE CARD AS A SENTENCE AND NEVER AS A NUMBER', async () => {
    // ⚠⚠ THE FOG LAW ON THE SURFACE IT PROTECTS. Both consent gates read the bond BAND; the card is
    // told only which buttons are live and what to say. So this case mounts the two consent states
    // and asserts the ROW, then asserts the negative that matters: no band word and no figure.
    const { hired } = snapshots()
    // Under 18 at a strained bond: `herself` alone is closed, and the card says she is not ready.
    // ⚠⚠ RE-AIMED 14.09 BY WAVE 6's T5, AND THE FIXTURE IS NOW DERIVED RATHER THAN TYPED. «The public
    // life» (O7) joined `PsyFocus`, so a hand-typed three-item open set turned this case into «the
    // readiness gate closes `herself` AND the fifth focus», which is a claim the engine does not make
    // and nobody meant. The list is what `psychologistFocusOpen` really returns in this state –
    // everything but `herself` – so a SIXTH focus needs no edit here and cannot silently fall out of
    // the offer. The assertions below are unchanged; only the message's count moved with the roster.
    const notReady = {
      ...hired,
      psychologistFocusOpen: PSY_FOCUSES.filter((f) => f !== 'herself'),
      psychologistFocusDetail: PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL,
    }
    const wrapper = await mountCard({ ...notReady, psychologistFocusOpen: [...notReady.psychologistFocusOpen] })
    const options = wrapper.findAll(`${SEAT} .staff-focus-option`)
    const herself = PSY_FOCUSES.indexOf('herself')
    expect(options[herself].attributes('disabled'), 'the one year she has to want').toBeDefined()
    for (const [i] of PSY_FOCUSES.entries()) {
      if (i !== herself) expect(options[i].attributes('disabled'), 'every other year stays hers to be given').toBeUndefined()
    }
    expect(wrapper.find(`${SEAT} .staff-focus-note`).text()).toBe(PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL)
    const seatText = wrapper.find(SEAT).text()
    for (const band of ['strained', 'cold', 'steady', 'close', 'bond']) {
      expect(seatText.toLowerCase(), `the card never prints «${band}»`).not.toContain(band)
    }
    wrapper.unmount()

    // From 18 at the same bond: she declines the whole decision, and that is the sentence shown.
    const declined = {
      ...hired,
      psychologistFocusOpen: [],
      psychologistFocusDetail: PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL,
    }
    const second = await mountCard(declined)
    for (const b of second.findAll(`${SEAT} .staff-focus-option`)) {
      expect(b.attributes('disabled'), 'she declines any set or change').toBeDefined()
    }
    expect(second.find(`${SEAT} .staff-focus-note`).text()).toBe(PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL)
    second.unmount()
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

  it('⭐ ROUND 42 #18 – THE PICKER FITS at 375 / 768 / 900 / 1280, with the sentences in it', async () => {
    // ⚠ HIS STANDING RULE OF 14.09 («визуальную проверку на всех экранах надо тоже заложить»), and
    // this row is exactly the kind that needs it: four labels became five names each carrying a
    // 60-90 character sentence, inside a control that is half a phone wide by declaration.
    //
    // ⚠ WHAT IS MEASURED IS THE LAYOUT PROMISE, not an opinion. `.staff-focus` is a wrapping flex row
    // whose items declare `flex: 1 1 calc(50% - 3px)` – the 2x2 shape v76 T3 chose on purpose – so
    // the claim is that two options really do sit side by side at every width, and that the block
    // they make has real height and never asks for more width than the card leaves it.
    const { hired } = snapshots()
    for (const vp of SWEEP) {
      setViewport(vp)
      const wrapper = await mountCard(hired, true)
      const row = wrapper.find(`${SEAT} .staff-focus`).element
      const options = wrapper.findAll(`${SEAT} .staff-focus-option`)
      expect(options.length, `${vp.width}: the row drew every year`).toBe(PSY_FOCUSES.length)

      const room = availableWidth(row, vp)
      const gap = parseFloat(getComputedStyle(row).columnGap || getComputedStyle(row).gap) || 0
      // The declared basis, resolved against the room the card actually leaves the row.
      const basis = (room - gap) / 2
      expect(basis, `${vp.width}: an option has real width`).toBeGreaterThan(80)
      expect(basis * 2 + gap, `${vp.width}: two really fit side by side`).toBeLessThanOrEqual(room + 0.5)

      const heights = options.map((o) => boxOf(o.element, basis).h)
      for (const [i, h] of heights.entries()) {
        expect(h, `${vp.width}: option ${i} has a rendered box`).toBeGreaterThan(0)
      }
      if (process.env.R42_SWEEP) {
        console.log(
          `SWEEP psy-picker ${vp.width}: room ${room.toFixed(1)}px, option ${basis.toFixed(1)}px, ` +
            `tallest option ${Math.max(...heights).toFixed(1)}px, block ~${(Math.max(...heights) * Math.ceil(PSY_FOCUSES.length / 2)).toFixed(1)}px`,
        )
      }
      wrapper.unmount()
    }
    setViewport(DESKTOP)
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
