// WAVE 10 T10 – THE LINE THROUGH THE SKIP, AND THE RECORDED BIRTHDAY (his rulings of 22.09:
// «по 2-5 всё да, делай как рекомендуешь» – the skip stays and the wizard learns the block; the
// birthday is the real birth's date, locked, with a choice when the mother raised more than one).
//
// Two surfaces, one contract: `OnboardingWizard.vue` (the skip branch) and `PrologueCard.vue`'s
// age-5 card must carry the SAME deviations off the same block – locked surname, answered origins,
// the three birthday states – and both read their words from `DYNASTY_COPY`, one declaration.
//
// MUTATION-VERIFIED 22.09 (each applied to src, this file run, reverted):
//   · the wizard surname's `:readonly="Boolean(dynasty)"` dropped → §A's lock case red.
//   · the wizard's `v-if="!dynasty"` on the die dropped → §A's die case red.
//   · step 4's `v-if="dynasty"` statement branch removed → §C red (buttons back on a dynasty run).
//   · `skipToDefaults` passing `DEFAULT_PROFILE` (the pre-T10 body) → §D red on the surname, the
//     band and the seed at once – the arm that says the skip no longer abandons the line.
//   · the card's `recordedBirthdays.length === 1` lock branch removed → §B red.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import { useGameStore } from '../../src/stores/game'
import { dynastyOf } from '../helpers/dynastyHandover'
import { DYNASTY_COPY, MONTHS } from '../../src/composables/identityCopy'
import '../../src/style.css'

// happy-dom has no localStorage on this project's window and the shell reads one at mount – the
// round18-coach shim, quoted in full there.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

const ONE = [{ month: 3, day: 14 }]
const TWO = [
  { month: 3, day: 14 },
  { month: 11, day: 2 },
]

function mountWizard(dynasty?: ReturnType<typeof dynastyOf>) {
  return mount(OnboardingWizard, {
    props: dynasty ? { dynasty } : {},
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })
}

/** The wizard's forward control by its own visible word – «Begin» on the hero step, «Next» after,
 *  which is the footer's own three-fillings rule. Resilient to class churn, exact to the labels. */
async function next(w: ReturnType<typeof mountWizard>): Promise<void> {
  const btn = w.findAll('button').find((b) => b.text().includes('Next') || b.text().includes('Begin'))
  expect(btn, 'a forward control exists on this step').toBeTruthy()
  await btn!.trigger('click')
}

beforeEach(() => setActivePinia(createPinia()))

// =================================================================================================
// A. THE WIZARD'S IDENTITY STEP, ON A DYNASTY RUN
// =================================================================================================

describe('wave 10 T10 A – the wizard locks what the line settled', () => {
  it('⭐⭐⭐ the surname opens on her mother\'s, readonly, with no die beside it – and the note explains', async () => {
    const w = mountWizard(dynastyOf({ childBirthdays: ONE }))
    await next(w)
    const last = w.get('input#ob-last')
    expect((last.element as HTMLInputElement).value).toBe('Martin')
    expect(last.attributes('readonly'), 'readonly, never disabled – the value is the point').toBeDefined()
    expect(w.find('button[aria-label="Random last name"]').exists(), 'the die is not drawn at all').toBe(false)
    expect(w.text()).toContain(DYNASTY_COPY.lineNote)
    w.unmount()
  })

  it('⭐⭐ ...and an ordinary run is byte-for-byte the wizard it has always been', async () => {
    const w = mountWizard()
    await next(w)
    expect(w.get('input#ob-last').attributes('readonly')).toBeUndefined()
    expect(w.find('button[aria-label="Random last name"]').exists()).toBe(true)
    expect(w.find('select#ob-month').exists(), 'the birthday selects as ever').toBe(true)
    expect(w.text()).not.toContain(DYNASTY_COPY.lineNote)
    w.unmount()
  })
})

// =================================================================================================
// B. THE THREE BIRTHDAY STATES – both surfaces
// =================================================================================================

describe('wave 10 T10 B – the recorded birthday', () => {
  it('⭐⭐⭐ ONE recorded daughter locks the date to the real birth, and says why', async () => {
    const w = mountWizard(dynastyOf({ raisedOnTour: true, childBirthdays: ONE }))
    await next(w)
    expect(w.find('select#ob-month').exists(), 'no selects – the date is a fact').toBe(false)
    const locked = w.get('input#ob-month')
    expect((locked.element as HTMLInputElement).value).toBe(`${MONTHS[2]} 14`)
    expect(locked.attributes('readonly')).toBeDefined()
    expect(w.text()).toContain(DYNASTY_COPY.birthdayNote)
    w.unmount()
  })

  it('⭐⭐⭐ TWO recorded daughters open the choice over their real dates – «выбор из этих двух-трех дат»', async () => {
    const w = mountWizard(dynastyOf({ raisedOnTour: true, childBirthdays: TWO }))
    await next(w)
    expect(w.text()).toContain(DYNASTY_COPY.birthdayChoice)
    const radios = w.findAll('[role="radio"]')
    expect(radios.length, 'one control per daughter').toBe(2)
    expect(radios[0].attributes('aria-checked'), 'the first daughter is the opening value').toBe('true')
    await radios[1].trigger('click')
    expect(radios[1].attributes('aria-checked'), 'picking the second flips the date').toBe('true')
    expect(radios[0].attributes('aria-checked')).toBe('false')
    w.unmount()
  })

  it('⭐⭐ the prologue card wears the same three states off the same block', async () => {
    // Locked – one recorded birth: the identity card is the walk's first card, so it is on screen
    // at mount and no navigation is needed.
    const one = mount(ChildhoodPrologue, {
      props: { dynasty: dynastyOf({ raisedOnTour: true, childBirthdays: ONE }) },
      attachTo: document.body,
    })
    expect(one.find('select#prologue-month').exists()).toBe(false)
    expect((one.get('input#prologue-month').element as HTMLInputElement).value).toBe(`${MONTHS[2]} 14`)
    expect(one.text()).toContain(DYNASTY_COPY.birthdayNote)
    one.unmount()

    // The chooser – two recorded births, and picking writes through the ordinary identity event.
    const two = mount(ChildhoodPrologue, {
      props: { dynasty: dynastyOf({ raisedOnTour: true, childBirthdays: TWO }) },
      attachTo: document.body,
    })
    expect(two.text()).toContain(DYNASTY_COPY.birthdayChoice)
    const dates = two.findAll('[role="radio"]').filter((r) => r.text().includes(MONTHS[2]) || r.text().includes(MONTHS[10]))
    expect(dates.length).toBe(2)
    expect(dates[0].attributes('aria-checked'), 'the first daughter pre-fills the identity').toBe('true')
    await dates[1].trigger('click')
    expect(dates[1].attributes('aria-checked')).toBe('true')
    two.unmount()

    // Free – the epilogue variant has no recorded birth and the card stays the card it always was.
    const none = mount(ChildhoodPrologue, {
      props: { dynasty: dynastyOf({ childBirthdays: [] }) },
      attachTo: document.body,
    })
    expect(none.find('select#prologue-month').exists(), 'the selects, exactly as every career').toBe(true)
    none.unmount()
  })
})

// =================================================================================================
// C. THE ORIGINS ARE STATED, NOT ASKED
// =================================================================================================

describe('wave 10 T10 C – the family step on a dynasty run', () => {
  it('⭐⭐⭐ the three buttons are absent and the band is stated – the prologue\'s own rule for the origins card', async () => {
    const w = mountWizard(dynastyOf({ background: 'wealthy', childBirthdays: ONE }))
    await next(w)
    await next(w)
    await next(w)
    expect(w.text()).toContain(DYNASTY_COPY.familyNote)
    expect(w.find('[role="group"][aria-label="Family background"]').exists(), 'absent, not disabled').toBe(false)
    expect(w.text()).toContain('Wealthy')
    w.unmount()
  })
})

// =================================================================================================
// D. THE SKIP NO LONGER ABANDONS THE LINE
// =================================================================================================

describe('wave 10 T10 D – what «Skip for now» hands the store on a dynasty run', () => {
  it('⭐⭐⭐ the block, the child seed, the surname, the band and the recorded birthday all cross', async () => {
    const block = dynastyOf({ background: 'wealthy', raisedOnTour: true, childBirthdays: ONE })
    const w = mountWizard(block)
    const game = useGameStore()
    const spy = vi.spyOn(game, 'newCareer').mockResolvedValue(undefined as never)
    const skip = w.findAll('button').find((b) => b.text().includes('Skip for now'))
    expect(skip, 'the way out is still offered – his ruling, «скип остаётся»').toBeTruthy()
    await skip!.trigger('click')
    expect(spy).toHaveBeenCalledTimes(1)
    const [seed, profile, prologue, dynasty] = spy.mock.calls[0]
    expect(seed, 'the line\'s own seed, never a fresh draw').toBe(block.childSeed)
    expect(prologue).toBeUndefined()
    expect(dynasty, 'the block rides to createWorld').toEqual(block)
    expect(profile.kidLastName).toBe('Martin')
    expect(profile.background).toBe('wealthy')
    expect(profile.birthMonth).toBe(3)
    expect(profile.birthDay).toBe(14)
    w.unmount()
  })

  it('⭐ ...and on an ordinary run it hands over exactly what it always has', async () => {
    const w = mountWizard()
    const game = useGameStore()
    const spy = vi.spyOn(game, 'newCareer').mockResolvedValue(undefined as never)
    const skip = w.findAll('button').find((b) => b.text().includes('Skip for now'))
    await skip!.trigger('click')
    const [seed, , prologue, dynasty] = spy.mock.calls[0]
    expect(seed).toBe('')
    expect(prologue).toBeUndefined()
    expect(dynasty).toBeUndefined()
    w.unmount()
  })
})
