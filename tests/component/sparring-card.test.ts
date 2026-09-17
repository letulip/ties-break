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
    // ⚠ THE MARKER MOVED WITH HIS 17.09 REWRITE: a confirmation's voice is COMPLETELY LITERAL, so
    // «Put a hitting partner on the payroll» became «Hire a hitting partner for …».
    expect(wrapper.text()).not.toContain('Hire a hitting partner for')
    await hire!.trigger('click')
    await nextTick()
    expect(wrapper.text(), 'the tap opens a confirm, it does not spend').toContain(
      'Hire a hitting partner for',
    )
    expect(wrapper.text(), 'and it says the arrangement can be ended').toContain(
      'You can end the arrangement any week',
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
    // ⚠ AND IT NAMES WHAT STOPS. His rewrite replaced «the practice weeks are hers alone» – which
    // says what she is left with – with the two things that actually end.
    expect(wrapper.text()).toContain('The weekly salary stops')
    expect(wrapper.text()).toContain('regular match-style practice between events ends')
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
      // ⭐⭐ 17.09 – AND WHAT THE RUNG BUYS, his set A: «Рекомендую A - ок». The sentence is the
      // CATALOGUE's, asserted through `ECONOMY.sparring.rungs[i].note` rather than retyped, so a
      // re-fit of the ladder moves the expectation with the words and the two cannot drift.
      expect(rung.note, `the catalogue carries a sentence for ${rung.label}`).toBeTruthy()
      expect(rungs[i].find('.rung-note').text(), rung.label).toBe(rung.note)
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
    // ⚠ THE TWO MARKERS MOVED WITH HIS 17.09 REWRITE and the CLAIMS they assert did not: the fare is
    // still named, and the sub-line still says the seat already covers the weeks where the rust is
    // made. His terminology sheet fixes the wording of both – ONE ADDITIONAL FARE PER TRIP, ON TOUR.
    expect(sub, 'it says what the fare is').toContain('one additional fare per trip')
    expect(sub, 'and it says where the rust actually is').toContain('Home practice is already covered')
    expect(sub, 'no bench percentage on screen').not.toMatch(/\d+(\.\d+)?%/)
    wrapper.unmount()
  })

  it('§5b – ⚠⚠ the travel switch announces exactly what pressing it does, in both states', async () => {
    // HIS 17.09 RULE FOR THIS SURFACE, and it is the one he was most explicit about: «atmospheric but
    // unsuitable as an accessibility label – a screen reader should announce exactly what the control
    // changes». The old pair ended «for a court on the road», which names a venue the seat does not
    // buy. ⚠ Each label must state the CURRENT state and the state a press produces; a label that
    // said only one of the two is the failure this case exists to catch.
    const { hired } = snapshots()
    const off = await mountCard(hired)
    const offLabel = off.find(`${SEAT} .staff-travel button`).attributes('aria-label') ?? ''
    expect(offLabel, 'the state it is in').toContain('Hitting partner travel is off')
    expect(offLabel, 'and what a press does').toContain('Press to bring the hitting partner on tour')
    expect(offLabel, 'no image on a control label').not.toContain('court on the road')
    off.unmount()

    const on = await mountCard({ ...hired, sparringTravels: true })
    const onLabel = on.find(`${SEAT} .staff-travel button`).attributes('aria-label') ?? ''
    expect(onLabel, 'the state it is in').toContain('Hitting partner travel is on')
    expect(onLabel, 'and what a press does').toContain('Press to keep the hitting partner at the home club')
    // ⚠ THE TWO LABELS ARE NOT THE SAME STRING, which a `v-if` wired to the wrong flag would make
    // them, and which no single-state assertion can see.
    expect(onLabel).not.toBe(offLabel)
    on.unmount()
  })

  it('§5c – ⚠ the dial label says what the control CHANGES, and no surface of this seat says "across the net"', async () => {
    // Two of his 17.09 rulings in one case. The dial was labelled «Hitting partner – who is across
    // the net», and he struck that image twice over: once as a control label that describes a scene
    // rather than a setting, and once as a phrase «used often enough that it begins to feel
    // generated». `ECONOMY.sparring.rungs` is a ladder of standing («A college hitter» … «A top-100
    // partner»), so the label he gave for quality and experience is the one this dial takes.
    const { hired } = snapshots()
    const wrapper = await mountCard({ ...hired, sparringTravels: true })
    const seat = wrapper.find(SEAT)
    // ⚠ THE DIAL'S LABEL IS AN `aria-label` ON THE RADIOGROUP AND NOT VISIBLE TEXT, which puts it
    // squarely under his «accessibility labels, where literal clarity matters» rather than under the
    // card's prose – and is why the old «who is across the net» was the worst place of the four for
    // that image to be sitting.
    expect(seat.find('.staff-dial').attributes('aria-label'), 'the dial names what it sets').toBe(
      'Hitting partner – experience level',
    )
    // ⚠ THE WHOLE SEAT, not just the dial – the image had reached four surfaces and a check on one
    // of them would have let the other three through. `html()` rather than `text()`, because two of
    // those four are attributes that no `text()` can see.
    expect(seat.text(), 'nowhere on the card').not.toContain('across the net')
    expect(seat.html(), 'and in no label or title either').not.toContain('across the net')
    wrapper.unmount()
  })

  it('§5d – ⭐⭐ RETAINED BUT NOT WORKING: the first of the two states his 17.09 review said were missing', async () => {
    // «The hitting partner remains with the team, but is not working this week. No salary is charged.»
    // The state existed in the engine and on NO screen: the college freeze and a booked family week
    // suspend the arrangement without cancelling it. ⚠ The flag is the ENGINE's (`sparringStoodDown`),
    // so this case doctors the wire rather than the card.
    const { hired } = snapshots()
    expect(hired.sparringStoodDown, 'an ordinary hired week is not a stand-down').toBe(false)
    const ordinary = await mountCard(hired)
    expect(ordinary.find(SEAT).text()).toContain('Helps her keep her timing')
    expect(ordinary.find(SEAT).text(), 'and it does not claim a free week').not.toContain('No salary is charged')
    ordinary.unmount()

    const standing = await mountCard({ ...hired, sparringStoodDown: true })
    const said = standing.find(SEAT).text()
    expect(said, 'it stays with the team').toContain('remains with the team, but is not working this week')
    expect(said, 'and the bill stops').toContain('No salary is charged')
    // ⚠ AND IT REPLACES THE BENEFIT LINE RATHER THAN SITTING BESIDE IT. A card that said «helps her
    // keep her timing» on a week he is not there would be the screen claiming work nobody did.
    expect(said, 'the hired line is not also shown').not.toContain('Helps her keep her timing')
    standing.unmount()
  })

  it('§5e – ⚠ a stand-down on an UNHIRED seat changes nothing – the branch is gated on the hire', async () => {
    // The flag cannot be true without a hire engine-side, but the card must not be the only thing
    // standing between an odd wire and a sentence about a person nobody is paying.
    const { pro } = snapshots()
    const wrapper = await mountCard({ ...pro, sparringStoodDown: true })
    const said = wrapper.find(SEAT).text()
    expect(said, 'the unhired pitch still shows').toContain('A regular practice opponent')
    expect(said).not.toContain('remains with the team')
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
