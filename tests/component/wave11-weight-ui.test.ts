// WAVE 11 / T7 – THE THREE SURFACES THE WEIGHT PUTS ON A PHONE, MOUNTED.
//
// docs/specs/the-weight-2026-09.md §1 and §4, the plan's §T7.1: «the creation ask inside 375×667 on
// BOTH paths; the settings row; the funeral beat dialog under the popup law».
//
// ⚠⚠ THE FIT ASSERTIONS ARE ROUND-20 #3's OWN, and they are here because this wave ADDS a blocking
// takeover and LENGTHENS two creation screens. CLAUDE.md's gotcha asks for exactly this test in
// those two cases, and for the mutation beside it: «a test that cannot fail on the too-tall version
// is not this test».
//
// MUTATION-VERIFIED 22.09, each applied, RUN and reverted – and TWO OF THE THREE CAME IN AT **0
// RED**, which is the finding rather than a gap and is why they are written down at length.
//
//   · `.dialog-card`'s `max-height`/`overflow-y` stripped (round-20 #3's defect re-created):
//     **42 files / 121 tests red** across the whole component project, THIS FILE AMONG THEM, through
//     «the card declares no height bound that fits». THAT is the arm the popup law is about, and it
//     is the one that bites. ⚠ The count is two tests and one file up on the same arm measured on
//     22.09 before this wave, and the difference is exactly this file's own bereavement case plus
//     the shared `.dialog-card` tenants it now joins.
//   · the funeral `<img>`'s `aspect-ratio: 3 / 2` raised to `3 / 8` – a picture four times as tall
//     as it should be: **0 RED.** ⚠⚠ AND IT CANNOT BE OTHERWISE ON A CAPPED, SCROLLING CARD, which
//     is the healed helper's own claim read back: `.dialog-card` declares a `max-height` and
//     `overflow-y: auto`, so content height CANNOT push the way out off the screen – the card
//     scrolls instead. `assertDismissReachable` throws on «taller than the screen AND nothing
//     scrolls», and this card scrolls. The picture is counted by the floor model (`boxOf` reads
//     `aspect-ratio`) and the number simply does not decide anything.
//   · `WEIGHT_COPY.lead` tripled in length (an honest sentence added three times over, which is how
//     round-20 #3 actually happened): **0 RED**, for the same reason one line up, and on the
//     prologue card for the same reason again.
//
// ⚠⚠ SO THE PICTURE IS GUARDED WHERE IT CAN BE, AND IT IS A DIFFERENT ASSERTION: the case below
// reads the image's DECLARED aspect ratio and refuses a portrait one. A landscape picture in a
// scrolling card cannot strand a control; a portrait one would still be wrong, and «wrong» is not
// the same property as «unreachable». Two claims, two assertions, rather than one assertion asked
// to carry both.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import PrologueCardView from '../../src/components/PrologueCard.vue'
import { createWorld } from '../../src/engine/world'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { useGameStore } from '../../src/stores/game'
import { WEIGHT_COPY } from '../../src/composables/identityCopy'
import { PROLOGUE_CARDS } from '../../src/prologue/cards'
import { OPENING_IDENTITY } from '../../src/prologue/identity'
import { assertDismissReachable, PHONE, setViewport } from './fits'
// ⚠⚠ THE SHEET, IMPORTED, AND IT IS NOT SCAFFOLDING: `fits.ts` measures through the REAL cascade
// (`css: true`), and without this line `.dialog-overlay`'s `position: fixed` is simply not in the
// document – the helper throws by name rather than measuring a scrim that is not there. Every fit
// file in this folder carries it (prologue-walk, round35-prologue); it is the first thing a new one
// forgets, and the helper's own error message is what says so.
import '../../src/style.css'

/** A career old enough for the bereavement card, with the switch on – the shape every surface here
 *  is about. */
function weightWorld() {
  const world = createWorld('w11-ui', undefined, 'c-w11', undefined, undefined, true)
  // ⚠⚠ THE WEEK IS WALKED TO THE AGE THE SNAPSHOT REPORTS, never computed from an assumed
  // starting age. The opening age is a function of her birthday and the profile, and a test that
  // subtracted a remembered 8 landed on THIRTY-ONE – `lateCareer`, where the funeral painting falls
  // back to that band's own `norm` and the assertion below would have failed for a reason that has
  // nothing to do with the wiring. Measured on the first run of this file rather than reasoned about.
  for (let w = 0; w < 40 * 52; w++) {
    world.week = w
    if ((toSnapshot(world).ageYears ?? 0) >= 26) break
  }
  return world
}

describe('wave 11 T7 – the creation ask, on BOTH paths, inside a phone', () => {
  // ⚠ THE BODY IS CLEARED, `prologue-walk.test.ts`'s own `beforeEach`: `attachTo: document.body`
  // APPENDS, so a second mount in one file leaves two cards in the document and
  // `document.querySelector` answers the first – which by then is the unmounted one.
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ the prologue asks it on the card that creates the career, and the way on is reachable', () => {
    // ⚠⚠ THE LAST CARD AND NOT THE FIRST, and the reason is a MEASUREMENT this suite made: the
    // age-5 card carries the identity fields, the origins question and its three answers, and round
    // 35 #2 cut it to a ceiling of 2100px of content. The block measured 2339 there. The ceiling is
    // the owner's, so the ask moved – see `weight` on the card in src/prologue/cards.ts.
    setViewport(PHONE)
    const card = PROLOGUE_CARDS.find((c) => c.weight)!
    expect(card.age, 'the ask is on the last card of the walk').toBe(13)
    const wrapper = mount(PrologueCardView, {
      attachTo: document.body,
      props: { card, warmth: 'warm', mood: 'norm', identity: { ...OPENING_IDENTITY }, weight: false },
    })
    const el = document.querySelector('.prologue-card')!
    expect(document.querySelector('.prologue-weight'), 'the block is on the card').not.toBeNull()
    // ⚠ THE WAY ON IS THE LAST CONTROL IN `.prologue-answers`, which is the card's own structural
    // rule (`PrologueCard.vue`'s template says so) and what the helper measures against.
    const answers = document.querySelector('.prologue-answers')!
    expect(answers.querySelector('button'), 'and there is a way on').toBeTruthy()
    assertDismissReachable(el, answers, PHONE, 'the prologue card that asks the weight')
    wrapper.unmount()
  })

  it('⭐⭐ the wizard asks it on its last step, and the start control is reachable', async () => {
    setViewport(PHONE)
    const wrapper = mount(OnboardingWizard, { attachTo: document.body })
    // ⚠ WALKED TO THE LAST STEP THROUGH THE REAL CONTROLS rather than by poking `step`: the ask is
    // on the step the player presses Start on, and a test that set the ref would not be asserting
    // the screen a player meets.
    // ⚠⚠ WALKED THROUGH THE REAL CONTROLS AND NOT BY POKING `step`, because the ask is on the step
    // the player presses Start on – and the walk has to ANSWER step 3, since `nextDisabled` refuses
    // to advance until a country is chosen. A loop that only pressed Next stopped there and reported
    // the block missing, which is the walk failing rather than the wizard.
    for (let i = 0; i < 10 && !wrapper.html().includes(WEIGHT_COPY.title); i++) {
      const next = wrapper.findAll('button').find((b) => /^(Begin|Next)$/.test(b.text().trim()))
      if (next && next.attributes('disabled') === undefined) {
        await next.trigger('click')
        continue
      }
      // the one gate on the way: a country has to be picked before Next opens
      const country = wrapper.findAll('.ob-country button').find((b) => b.text().trim().length > 0)
      if (!country) break
      await country.trigger('click')
    }
    expect(wrapper.html().includes(WEIGHT_COPY.title), 'the block is on the wizard\'s last step').toBe(true)
    expect(wrapper.html().includes(WEIGHT_COPY.note), 'with the ruling\'s second half under it').toBe(true)
    // ⚠⚠ AND THE FIT IS **NOT** MEASURED WITH `assertDismissReachable` HERE, which is a decision
    // rather than an omission: the wizard is a full-screen SHELL and not a `.dialog-overlay`, so the
    // helper would throw by name on the first line («the overlay is …, not `fixed`»). Its shell
    // SCROLLS, which is the second safe shape the helper learned on 22.09 – any content height is
    // reachable – so what a phone assertion can honestly say here is that the control exists and is
    // pressable at 375x667, and it says that.
    const start = wrapper.findAll('button').find((b) => b.text().trim() === 'Start career')
    expect(start, 'the way into the career is on the same step as the ask').toBeDefined()
    expect(start!.attributes('disabled'), 'and it is pressable').toBeUndefined()
    wrapper.unmount()
  })
})

describe('wave 11 T7 – the settings row', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ renders with a career loaded, reads the world, and is named by its own label', () => {
    const store = useGameStore()
    store.snapshot = toSnapshot(weightWorld())
    // ⚠ MoreScreen ASKS THE WORKER FOR THE CAREER LIST ON MOUNT and there is no worker in this
    // runner – a11y-sweep's own note, and the same stub.
    store.refreshCareers = async () => {}
    const wrapper = mount(MoreScreen, { global: { stubs: { teleport: true } } })
    const row = wrapper.findAll('[role="switch"]').find((s) => s.attributes('aria-labelledby') === 'more-weight-label')
    expect(row, 'the row is a real switch').toBeDefined()
    expect(row!.attributes('aria-checked'), 'and it reads the WORLD rather than a local ref').toBe('true')
    expect(wrapper.text()).toContain(WEIGHT_COPY.settingsHint)
    wrapper.unmount()
  })

  it('⚠ and it is ABSENT with no career – it is a fact about a career, not a device preference', () => {
    const store = useGameStore()
    store.snapshot = null
    store.refreshCareers = async () => {}
    const wrapper = mount(MoreScreen, { global: { stubs: { teleport: true } } })
    const row = wrapper.findAll('[role="switch"]').find((s) => s.attributes('aria-labelledby') === 'more-weight-label')
    expect(row, 'a switch with nothing to switch would be a control that lies').toBeUndefined()
    wrapper.unmount()
  })
})

describe('wave 11 T7 – the funeral beat, under the popup law', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐⭐ the card carries the painting AND its one answer is inside a 375×667 phone', () => {
    setViewport(PHONE)
    const store = useGameStore()
    const world = weightWorld()
    world.bereavementWeeks.push(world.week)
    world.spiritShock = { week: world.week, kind: 'bereavement' }
    world.lifeLog.push({ week: world.week, kind: 'bereavement', detail: String(world.week), answer: null })
    store.snapshot = toSnapshot(world)
    const wrapper = mount(LifeBeatDialog, { attachTo: document.body })
    const card = document.querySelector('.life-beat-dialog')!
    expect(card, 'the beat is up').not.toBeNull()
    // ⭐⭐⭐ THE PAINTING, WIRED AT LAST – `fem-euro-brunnet-adult-funeral.webp` has been in every
    // install and on no screen since 11.09.
    const art = card.querySelector('img.life-beat-art') as HTMLImageElement | null
    expect(art, 'the card carries a picture').not.toBeNull()
    expect(art!.getAttribute('src'), 'and it is the funeral painting for her band').toContain('adult-funeral')
    expect(art!.getAttribute('alt'), 'atmosphere beside a heading that already says what happened').toBe('')
    // ⚠⚠ THE PICTURE'S SHAPE, ASSERTED DIRECTLY, because the FIT below structurally cannot see it:
    // the card scrolls, so no content height can strand a control. A portrait-shaped painting would
    // still be wrong – it would push every word of the card past the fold and make a player scroll
    // to read a sentence – and that is a claim about the IMAGE rather than about reachability.
    const ratio = getComputedStyle(art!).aspectRatio
    const [w, h] = ratio.split('/').map((part) => Number(part.trim()))
    expect(Number.isFinite(w) && Number.isFinite(h), `the image declares a ratio (${ratio})`).toBe(true)
    expect(w / h, 'a landscape frame – a portrait one pushes the whole card past the fold').toBeGreaterThan(1)
    // ⚠⚠ THE POPUP LAW. The dialog is a BLOCKING overlay with one way off it, so a control past the
    // fold is a career that stops there – round-20 #3's own defect, which is what this measures.
    const choices = card.querySelectorAll('.life-beat-choices button')
    expect(choices.length, 'one answer, as the table declares').toBe(1)
    const fit = assertDismissReachable(card, choices[0], PHONE, 'the bereavement card')
    expect(fit.shape, 'it is a scrim with a bounded card – round-20 #3\'s own shape').toBe('card-scrolls')
    wrapper.unmount()
  })
})
