// ⭐⭐ ONE NUMBER, IN ALL FOUR PLACES A PLAYER CAN MEET IT.
//
// The owner, 06.09: «Ограничение имени 200 символов – а зачем нам такие длинные имена? мы же не
// твиттер. Мне кажется надо разумное ограничение поставить здесь, например 20 (или это имя +
// фамилия 200? если так, то там 50 вполне должно хватить)».
//
// HIS QUESTION HAS AN ANSWER AND IT IS THE FIRST ARM BELOW: the cap is PER FIELD. `kidName` and
// `kidLastName` each got 200, not 200 for the pair – so the pair could run to four hundred
// characters. It is twenty each now, which is his own suggested number and still twice the longest
// surname the game itself draws (`engine/season/names.ts`: six characters for a first name, ten for
// a surname).
//
// ⚠ WHY A MOUNTED TEST AND NOT A SOURCE PIN. The claim is that the SCREEN and the ENGINE agree, and
// a source pin on `:maxlength="PROFILE_NAME_MAX_CHARS"` would pass while the binding resolved to
// anything at all. Reading the attribute off a real input in a real DOM is the only form of this
// test that can see the number the player's browser will enforce (CLAUDE.md: prefer a mounted test).
//
// ⚠ MUTATION-VERIFIED. What each mutation reddened is written above the block it belongs to.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import { DEFAULT_PROFILE, PROFILE_NAME_MAX_CHARS, profileShapeError } from '../../src/shared/protocol'
import { FIRST_NAMES, SURNAMES } from '../../src/engine/season/names'
import { PHONE, setViewport } from './fits'

/** ⚠ THE NUMBER IS WRITTEN OUT HERE ON PURPOSE and not read off the constant. Every other assertion
 *  in this file compares the sites to `PROFILE_NAME_MAX_CHARS`, which proves they AGREE; this one
 *  line is what makes them agree on TWENTY rather than on whatever the constant happens to say. */
const CAP = 20

describe('round 37 – the name cap is twenty, per field, and every site says so', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  // MUTATION-VERIFIED: `PROFILE_NAME_MAX_CHARS` put back to 200 -> this arm goes red on the number,
  // and so does every arm below it, which is the point of one constant.
  it('site 1 of 4 – the engine\'s constant is 20', () => {
    expect(PROFILE_NAME_MAX_CHARS).toBe(CAP)
  })

  // MUTATION-VERIFIED: `nameError`'s bound changed to `>= PROFILE_NAME_MAX_CHARS` -> the "twenty is
  // inside" arm red; the sentence's `${PROFILE_NAME_MAX_CHARS}` replaced by a literal 200 -> both
  // sentence arms red.
  it('sites 2 and 3 of 4 – the two refusal sentences carry the same number', () => {
    const twentyOne = 'a'.repeat(CAP + 1)
    expect(profileShapeError({ ...DEFAULT_PROFILE, kidName: twentyOne })).toBe(
      'A first name is at most 20 characters',
    )
    expect(profileShapeError({ ...DEFAULT_PROFILE, kidLastName: twentyOne })).toBe(
      'A family name is at most 20 characters',
    )
    // ...and twenty itself is INSIDE the cap, which is where an off-by-one would live.
    const twenty = 'a'.repeat(CAP)
    expect(profileShapeError({ ...DEFAULT_PROFILE, kidName: twenty, kidLastName: twenty })).toBeNull()
  })

  // ⭐ HIS OWN QUESTION, ANSWERED AS A MEASUREMENT: «или это имя + фамилия 200?»
  it('⚠ the cap is PER FIELD – twenty each, not twenty between them', () => {
    const twenty = 'a'.repeat(CAP)
    expect(twenty.length + twenty.length).toBe(2 * CAP)
    expect(profileShapeError({ ...DEFAULT_PROFILE, kidName: twenty, kidLastName: twenty })).toBeNull()
  })

  // The number is a product decision, but it has to clear the game's own vocabulary or the dice
  // beside the field could roll a name the field cannot hold.
  it('⚠ and it still holds every name the game itself draws, with room to spare', () => {
    const longestFirst = FIRST_NAMES.reduce((a, b) => (b.length > a.length ? b : a), '')
    const longestLast = SURNAMES.reduce((a, b) => (b.length > a.length ? b : a), '')
    expect(longestFirst.length, `${longestFirst} does not fit the cap`).toBeLessThanOrEqual(CAP)
    expect(longestLast.length, `${longestLast} does not fit the cap`).toBeLessThanOrEqual(CAP)
    // Twice the longest surname, which is the margin that makes twenty a comfortable number rather
    // than a tight one.
    expect(CAP).toBeGreaterThanOrEqual(2 * longestLast.length)
  })

  // MUTATION-VERIFIED: `:maxlength="PROFILE_NAME_MAX_CHARS"` deleted from the wizard's first-name
  // input -> red naming the field; the binding replaced with a literal `maxlength="200"` -> red on
  // the number, which is the drift this arm exists for.
  it('site 4 of 4 – the wizard\'s two name fields carry the cap as maxlength', async () => {
    const wrapper = mount(OnboardingWizard, { attachTo: document.body, global: { stubs: { teleport: true } } })
    await nextTick()
    // Step O is one Next away from the welcome; the fields do not exist before it.
    await wrapper.find('.ob-cta').trigger('click')
    await nextTick()

    for (const id of ['ob-first', 'ob-last']) {
      const field = wrapper.find(`#${id}`)
      expect(field.exists(), `the wizard has no #${id}`).toBe(true)
      expect(field.attributes('maxlength'), `#${id} does not carry the engine's cap`).toBe(String(PROFILE_NAME_MAX_CHARS))
      expect(field.attributes('maxlength'), `#${id} carries a different number`).toBe(String(CAP))
    }
    wrapper.unmount()
  })

  // MUTATION-VERIFIED: the `:maxlength` deleted from `prologue-first` -> red naming the field. This
  // card asks for her name on the same path into `newCareer`, so a cap it does not have is a refusal
  // a player reaches by typing – the risk E-06 named, and the one the drop from 200 to 20 makes real.
  it('⚠ …and so do the prologue\'s, because the age-5 card asks the same question', async () => {
    const wrapper: VueWrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    await nextTick()
    for (const id of ['prologue-first', 'prologue-last']) {
      const field = wrapper.find(`#${id}`)
      expect(field.exists(), `the age-5 card has no #${id}`).toBe(true)
      expect(field.attributes('maxlength'), `#${id} does not carry the engine's cap`).toBe(String(PROFILE_NAME_MAX_CHARS))
    }
    wrapper.unmount()
  })
})
