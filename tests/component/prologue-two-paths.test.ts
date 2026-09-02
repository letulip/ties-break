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
import { OPENING_IDENTITY } from '../../src/prologue/identity'
import { IDENTITY_COPY } from '../../src/composables/identityCopy'
import { COUNTRY_NAMES } from '../../src/composables/countries'
import { kidAgeYears } from '../../src/engine/world'
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
    // ⭐⭐ PHASE 7 – TWO SENTENCES, THROUGH THE CONTAINER'S OWN BINDINGS. This is the seam the
    // mounted handover test cannot cover: `PrologueHandover.vue` renders whatever it is handed, and
    // what makes the second sentence appear in the real game is `ChildhoodPrologue.vue` reading
    // `snapshot.handoverBaseBand`. Dropping `:base` from the template reddens exactly here.
    const lines = wrapper.findAll('.handover-read-line')
    expect(lines.length, 'the base and the room').toBe(2)
    expect(lines[0].classes(), 'the base is first').toContain('handover-read-base')
    for (const line of lines) expect(line.text().length, 'a sentence').toBeGreaterThan(10)
    // ...and the two say different things, which is the whole of phase 7.
    expect(lines[0].text()).not.toBe(lines[1].text())
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

// =================================================================================================
// ⭐⭐ WHO SHE IS – the owner's correction of 02.09, end to end
// =================================================================================================
//
// «каждая прологовая карьера сейчас Вера Мартин … часть нашего текущего онбординга с датой рождения
// и именем должны остаться», and the same day «страну тоже добавь, да». Until this shipped, EVERY
// prologue career was the same girl. What is asserted here is the SEAM, in the same spirit as the
// payload test above: what the player typed on the age-5 card is what `createWorld` was handed and
// what the world came back holding – not what a component's local state says it holds.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed:
//   * `settleIdentity(identity.value)` dropped from `begin()`'s profile -> every field goes red.
//   * the spread put BEFORE `...DEFAULT_PROFILE` instead of after -> same, and it names the field.
//   * `identity` left in place by «start again» -> the restart test below goes red on the name.
//   * `birthDay`/`birthMonth` dropped from `PrologueIdentity` -> the world's age reading goes red.
describe('⭐⭐ the prologue asks who she is, and the answer reaches the world', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  /** Type a name into one of the two text fields on the card that is up. */
  async function type(wrapper: ReturnType<typeof mount>, id: string, value: string): Promise<void> {
    const field = wrapper.find(`#${id}`)
    expect(field.exists(), `no field #${id} on this card`).toBe(true)
    await field.setValue(value)
  }

  it('the five asks in the WIZARD\'s words – nothing on this card is a second wording', () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    const text = wrapper.text()
    for (const label of [IDENTITY_COPY.firstName, IDENTITY_COPY.lastName, IDENTITY_COPY.birthday]) {
      expect(text, `the five does not ask for «${label}»`).toContain(label)
    }
    // ⭐ THE COUNTRY PICKER OPENS CLOSED SINCE PHASE 7, and closed is ONE tile – the country the
    // career will actually be started with. The picker's parts are unchanged and none of them is a
    // new string: the way in is the wizard's own `Browse all countries`, and opening it puts the
    // search field and all twenty-four back on the card.
    expect(wrapper.findAll('.prologue-tile').length, 'closed, it is her country and nothing else').toBe(1)
    expect(wrapper.find('.prologue-tile').text()).toContain(COUNTRY_NAMES[OPENING_IDENTITY.country])
    expect(wrapper.find('.prologue-browse').text()).toBe(IDENTITY_COPY.browseAll)
    // ...and the fields open on the default profile rather than on nothing.
    expect((wrapper.find('#prologue-first').element as HTMLInputElement).value).toBe(OPENING_IDENTITY.kidName)
    expect((wrapper.find('#prologue-last').element as HTMLInputElement).value).toBe(OPENING_IDENTITY.kidLastName)
    wrapper.unmount()
  })

  it('⚠ and it asks on the FIVE and on no other card – it is a scene, not a tenth screen', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    expect(wrapper.find('.prologue-identity').exists(), 'the five asks').toBe(true)
    for (const age of CARD_AGES.slice(0, -1)) {
      await answerCurrent(wrapper, age)
      expect(wrapper.find('.prologue-identity').exists(), `age ${age + 1} asks again`).toBe(false)
    }
    wrapper.unmount()
  })

  it('⭐⭐ what the player typed is what the WORLD holds – name, birthday and country', async () => {
    const { calls, game } = stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })

    await type(wrapper, 'prologue-first', 'Nadia')
    await type(wrapper, 'prologue-last', 'Okonkwo')
    await wrapper.find('#prologue-month').setValue('11')
    await wrapper.find('#prologue-day').setValue('3')
    // ⭐ THE PICKER HAS TO BE OPENED FIRST (phase 7) – and this walks the player's own route in
    // rather than reaching past it: the browse control, then the tile, which is what a hand does.
    await wrapper.find('.prologue-browse').trigger('click')
    const spain = wrapper.findAll('.prologue-tile').find((t) => t.text().includes('Spain'))!
    await spain.trigger('click')
    // ...and taking one closes the picker again, so the card does not stay a list of countries.
    expect(wrapper.findAll('.prologue-tile').length, 'the picker closed on the answer').toBe(1)

    for (const age of CARD_AGES) await answerCurrent(wrapper, age)

    // 1. what `createWorld` was handed.
    expect(calls.length).toBe(1)
    expect(calls[0].profile.kidName).toBe('Nadia')
    expect(calls[0].profile.kidLastName).toBe('Okonkwo')
    expect(calls[0].profile.birthMonth).toBe(11)
    expect(calls[0].profile.birthDay).toBe(3)
    expect(calls[0].profile.country).toBe('ES')
    // ...and the origin is still the origin, so the identity did not overwrite the card's own answer.
    expect(calls[0].profile.background).toBe('middle')

    // 2. what the REAL world came back holding – the stub builds one with `createWorld`.
    const snapshot = game.snapshot!
    expect(snapshot.profile.kidName, 'the world is hers').toBe('Nadia')
    expect(snapshot.profile.kidLastName).toBe('Okonkwo')
    expect(snapshot.profile.birthMonth).toBe(11)
    expect(snapshot.profile.birthDay).toBe(3)
    expect(snapshot.profile.country).toBe('ES')
    wrapper.unmount()
  })

  it('⚠⚠ and the birthday is not cosmetic – the world opens her at the age it decides', async () => {
    // §2.1: the prologue starts at five «decided by her birthday, on exactly the machinery that
    // already decides 13-or-14», and `kidAgeYears` is that machinery. A November girl and a January
    // girl are NOT the same age in week 0, and a `birthDay`/`birthMonth` that never reached
    // `createWorld` would make both of them the default's June date – which is what this measures.
    const seen: number[] = []
    for (const [month, day] of [[1, 4], [11, 3]] as const) {
      setActivePinia(createPinia())
      document.body.innerHTML = ''
      const { game } = stubStore()
      const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
      await wrapper.find('#prologue-month').setValue(String(month))
      await wrapper.find('#prologue-day').setValue(String(day))
      for (const age of CARD_AGES) await answerCurrent(wrapper, age)
      const p = game.snapshot!.profile
      seen.push(kidAgeYears(0, p.birthMonth, p.birthDay))
      wrapper.unmount()
    }
    expect(seen[0], 'the two birthdays reach the engine and are read there').not.toBe(seen[1])
  })

  it('⚠ an emptied name is not a nameless career – it falls back the way the wizard does', async () => {
    const { calls } = stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    await type(wrapper, 'prologue-first', '   ')
    await type(wrapper, 'prologue-last', '')
    for (const age of CARD_AGES) await answerCurrent(wrapper, age)
    expect(calls[0].profile.kidName).toBe(DEFAULT_PROFILE.kidName)
    expect(calls[0].profile.kidLastName).toBe(DEFAULT_PROFILE.kidLastName)
    wrapper.unmount()
  })

  it('⚠ «start again» forgets her too – a new childhood is a different girl', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    await type(wrapper, 'prologue-first', 'Nadia')
    for (const age of CARD_AGES) await answerCurrent(wrapper, age)
    await wrapper.findAll('.handover-answer')[1].trigger('click')
    await wrapper.vm.$nextTick()
    expect((wrapper.find('#prologue-first').element as HTMLInputElement).value).toBe(OPENING_IDENTITY.kidName)
    wrapper.unmount()
  })
})
