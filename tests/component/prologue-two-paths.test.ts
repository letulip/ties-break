// ⭐⭐ THE TWO PATHS INTO A CAREER, MOUNTED – phase 4 of
// docs/specs/childhood-prologue-build-2026-09.md §6.
//
//     new game -+- the prologue (default) -- 9 cards -- the handover -- the game
//               +- skip ------------------- the existing wizard
//
// What this file proves is the SEAM: that the nine cards reach the handover, that what they came to
// is what `createWorld` is handed, that the skip exists and leaves, and that «start again» drops the
// career and starts the childhood over with nothing carried.
//
// ⚠ THE STORE'S TWO ACTIONS ARE STUBBED AND NOTHING ELSE IS. `newCareer` and `deleteCareer` are the
// only two things this component asks of the world, and both of them talk to a Web Worker that does
// not exist under happy-dom. The stub records the ARGUMENTS and publishes a REAL snapshot built by
// the real engine, so everything downstream of the seam – the rose, the band, the coach's line – is
// the genuine article rather than a fixture.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed:
//   * the skip offered on every card -> the «first card only» test goes red.
//   * `spentCents` dropped from the payload -> the payload test goes red naming the field.
//   * «start again» leaving the run in place -> the restart test goes red on the card it lands on.
//   * the career made on the FIRST card instead of the ninth -> the ordering test goes red, because
//     it asserts the handover is absent on every card before the last one.
//   ⚠ AND ONE MUTATION THAT DID NOT REDDEN, RECORDED RATHER THAN QUIETLY DROPPED: taking
//     `handoverOpen` out of the template guard and leaving `game.snapshot` alone changes nothing
//     here, because the snapshot IS null until the ninth card is answered. The guard's two conjuncts
//     are not independent in this test's world; what `handoverOpen` really protects is the moment
//     AFTER the career exists, which is a claim about App.vue's route and is made there.
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { setViewport, PHONE } from './fits'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { CARD_AGES, PROLOGUE_CARDS } from '../../src/prologue/cards'
import { WALK_COPY, HANDOVER_COPY } from '../../src/prologue/handover'
import { EMPTY_RUN, chosenYears, spentCents, withOrigin, withPick } from '../../src/prologue/run'
import { DEFAULT_PROFILE, type PlayerProfile, type PrologueHandover } from '../../src/shared/protocol'

/** The road that buys her everything on every card – so the payload the engine is handed is the
 *  dearest childhood the table can produce, which is the arm with the most in it to get wrong. */
const CARRIED: Record<number, string> = {
  8: 'club', 9: 'one-to-one', 10: 'enter', 11: 'sports-school', 12: 'give-her-the-year',
}

function stubStore() {
  const game = useGameStore()
  const calls: { prologue?: PrologueHandover; profile: PlayerProfile }[] = []
  game.newCareer = vi.fn(
    async (_seed: string, profile: PlayerProfile = DEFAULT_PROFILE, prologue?: PrologueHandover) => {
      calls.push({ prologue, profile })
      // A REAL career, with the prologue the component actually assembled – so the handover below
      // draws the rose and the band the player would see.
      game.snapshot = toSnapshot(createWorld('two-paths', profile, 'c', prologue))
    },
  )
  game.deleteCareer = vi.fn(async () => {
    game.snapshot = null
  })
  return { game, calls }
}

/** Click the answer whose label matches, on whatever card is up. */
async function answer(wrapper: ReturnType<typeof mount>, label: string): Promise<void> {
  const button = wrapper.findAll('.prologue-answer').find((b) => b.text().startsWith(label))
  expect(button, `no control labelled «${label}» on this card: ${wrapper.text().slice(0, 120)}`).toBeTruthy()
  await button!.trigger('click')
  await Promise.resolve()
  await wrapper.vm.$nextTick()
}

/** Answer whichever card is up, taking the carried road. */
async function answerCurrent(wrapper: ReturnType<typeof mount>, age: number): Promise<void> {
  const card = PROLOGUE_CARDS.find((c) => c.age === age)!
  if (card.origins) return answer(wrapper, card.origins[1].label)
  if (age === 12) {
    // The twelfth has two faces and the carried road earns the other one, so the pick is taken off
    // the card that is actually on the screen rather than off the table's default row.
    const buttons = wrapper.findAll('.prologue-answer-label').map((b) => b.text())
    return answer(wrapper, buttons[1])
  }
  if (card.options) {
    const wanted = card.options.find((o) => o.id === CARRIED[age])!
    return answer(wrapper, wanted.label)
  }
  return answer(wrapper, card.continueLabel)
}

describe('⭐⭐ §6 – the prologue is the default, and skip is the other path', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  it('it opens on the first card of the childhood, at five', () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    expect(wrapper.find('.prologue-kicker').text()).toBe(PROLOGUE_CARDS[0].kicker)
    expect(CARD_AGES[0]).toBe(5)
    wrapper.unmount()
  })

  it('⚠ the way out is on the FIRST card and on no other', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    expect(wrapper.text()).toContain(WALK_COPY.skip)
    await answerCurrent(wrapper, 5)
    expect(wrapper.text(), 'a skip that follows you to the sixth year').not.toContain(WALK_COPY.skip)
    wrapper.unmount()
  })

  it('...and taking it hands the player to the wizard', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    await wrapper.find('.prologue-skip').trigger('click')
    expect(wrapper.emitted('skip')?.length).toBe(1)
    expect(wrapper.emitted('done')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('⭐⭐ the nine cards reach the handover, carrying what they came to', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  it('the walk creates exactly one career, with the nine years and the total', async () => {
    const { calls } = stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    for (const age of CARD_AGES) {
      // ⚠ THE HANDOVER MAY NOT APPEAR BEFORE THE LAST CARD IS ANSWERED.
      expect(wrapper.find('.handover-card').exists(), `the handover is up at age ${age}`).toBe(false)
      await answerCurrent(wrapper, age)
    }
    expect(calls.length, 'one career, not nine').toBe(1)

    // What the engine was handed is exactly what the table says that road costs and comes to.
    let run = withOrigin(EMPTY_RUN, 'middle')
    for (const age of Object.keys(CARRIED).map(Number)) run = withPick(run, age, CARRIED[age])
    expect(calls[0].prologue?.spentCents).toBe(spentCents(run))
    expect(calls[0].prologue?.years).toEqual(chosenYears(run))
    expect(calls[0].prologue?.years.length).toBe(9)
    expect(calls[0].profile.background, 'the origin the player picked, not the default').toBe('middle')
    wrapper.unmount()
  })

  it('...and the handover is then on the screen, with the rose, the read and the choice', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    for (const age of CARD_AGES) await answerCurrent(wrapper, age)
    expect(wrapper.find('.handover-card').exists()).toBe(true)
    expect(wrapper.find('.radar-svg').exists(), 'the rose').toBe(true)
    expect(wrapper.find('.handover-read-line').text().length, 'his sentence').toBeGreaterThan(10)
    expect(wrapper.findAll('.handover-answer').map((b) => b.text())).toEqual([
      HANDOVER_COPY.goOn,
      HANDOVER_COPY.startAgain,
    ])
    wrapper.unmount()
  })

  it('«go on» hands the career to the app and says nothing else', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    for (const age of CARD_AGES) await answerCurrent(wrapper, age)
    await wrapper.findAll('.handover-answer')[0].trigger('click')
    expect(wrapper.emitted('done')?.length).toBe(1)
    expect(wrapper.emitted('skip')).toBeUndefined()
    wrapper.unmount()
  })

  it('⭐ «raise another child» drops the career and starts the childhood over, carrying nothing', async () => {
    const { game } = stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    for (const age of CARD_AGES) await answerCurrent(wrapper, age)
    await wrapper.findAll('.handover-answer')[1].trigger('click')
    await wrapper.vm.$nextTick()

    expect(game.deleteCareer, 'the career it just made is gone').toHaveBeenCalled()
    expect(game.snapshot).toBe(null)
    expect(wrapper.emitted('done'), 'and the app is not handed a career').toBeUndefined()
    // Back at the beginning, on the first card, with the run empty – the origin included.
    expect(wrapper.find('.handover-card').exists()).toBe(false)
    expect(wrapper.find('.prologue-kicker').text()).toBe(PROLOGUE_CARDS[0].kicker)
    expect(wrapper.findAll('.prologue-answer').length, 'the three origins and the skip').toBe(4)
    wrapper.unmount()
  })
})
