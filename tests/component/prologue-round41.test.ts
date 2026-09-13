// ⭐⭐⭐ ROUND 41, ITEMS 8 AND 9 – THE PROLOGUE'S NAVIGATION: A RADIO ONLY SELECTS, Proceed ADVANCES,
// AND THERE IS A WAY BACK.
//
// THE OWNER, 12.09, both items in one message and the second explaining the first:
//
//   #9  «радиобатон на прологе не должен переключать сразу, он только про выбор, давай сделаем где
//        нет активных кнопок, а есть только радиобатоны при выборе всех будет появляться наша желтая
//        кнопка proceed – это будет хорошее удобное поведение»
//   #8  «На прологе добавить возможность вернуться к первому экрану с созданием персонажа со второго
//        экрана … а то я на радиобатон нажал и не ожидал, что меня переключит дальше сразу»
//
// (his Russian lives in docs/rounds/round-41.md, where it is allowed to.)
//
// ⚠⚠ #9 CONSCIOUSLY SUPERSEDES ROUND 40 #3 – his ruling, «8+9 as cut, верно». The 200 ms landing
// hold existed so the ball a press had just filled could be seen before the card left; a card that
// no longer leaves on a press shows it for as long as the player looks. What that item asserted is
// re-aimed in round40-prologue-choices.test.ts rather than deleted, and the fake clock survives
// there as the instrument that proves the hold is GONE rather than moved.
//
// ⚠ OF HIS TWO ROADS FOR #8 THE ROUND TOOK BACK AND NOT THE CONFIRM POPUP, because #9 removes the
// surprise itself: with passive radios and an explicit Proceed, a confirmation would be a second
// answer to one complaint. round-41.md, item 8, records that and leaves the popup as its own item if
// the playtest still wants it.
//
// ⚠ MUTATION-VERIFIED, every arm – the table is in the round's ledger. The short of it:
//   * Proceed moved after `.prologue-skip` -> the placement arm and the smoke precondition redden.
//   * `canGoBack`'s `run.opens` clause dropped -> the played-weekend arm reddens on a card that
//     offers to un-buy a tournament she has already played.
//   * `goBack` decrementing nothing -> the walk-back arm reddens on the title.
//   * `proceed()`'s own `cardFinished` re-read dropped -> the stale-press arm reddens.
//   * the container passing the FIRST answer instead of the run's -> the re-answer arm reddens on
//     the years `newCareer` was given.
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN STYLESHEET – without it the treatment measured below is not in the cascade and
// the contrast arm is vacuous. Same reason prologue-walk.test.ts imports it.
import '../../src/style.css'
import { assertLegible } from './contrast'
import { setViewport, PHONE } from './fits'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { LOCAL_OPEN_COPY, PROLOGUE_CARDS, TOURNAMENT_ANSWER, type PrologueCard } from '../../src/prologue/cards'
import { WALK_COPY } from '../../src/prologue/handover'
import { EMPTY_RUN, cardFor, withPick, type PrologueRun } from '../../src/prologue/run'
import {
  DEFAULT_PROFILE,
  type PlayerProfile,
  type PrologueHandover,
  type PrologueYear,
} from '../../src/shared/protocol'

/** The cheapest road, and it buys no tennis at all – every ask is declined, so the walk stays on
 *  cards and a weekend never takes the screen. `enter` at ten is the one that would. */
const LIGHT_ROAD: Record<number, string> = {
  8: 'municipal', 9: 'group', 10: 'stay-home', 11: 'ordinary-school', 12: 'let-her-stop',
}
/** The road that enters her at ten, which is the only way to get a PLAYED weekend into the run. */
const CARRIED_ROAD: Record<number, string> = { ...LIGHT_ROAD, 10: 'enter' }

function stubStore() {
  const game = useGameStore()
  const years: PrologueYear[][] = []
  game.newCareer = vi.fn(async (_seed: string, profile: PlayerProfile = DEFAULT_PROFILE, prologue?: PrologueHandover) => {
    if (prologue) years.push([...prologue.years])
    game.snapshot = toSnapshot(createWorld('r41', profile, 'c', prologue))
  })
  game.deleteCareer = vi.fn(async () => {
    game.snapshot = null
  })
  return { game, years }
}

type Wrapper = ReturnType<typeof mount>

async function flush(w: Wrapper): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await w.vm.$nextTick()
}

const titleNow = (w: Wrapper) => w.find('.prologue-title').text()
const titleOf = (card: PrologueCard) => card.title

/** Press a control in the answers column by the first characters of its label. ⚠ IT PRESSES AND
 *  NOTHING ELSE – no Proceed, no flush past the render – because every arm in this file is about
 *  what a single press does and does not do. */
async function press(w: Wrapper, label: string): Promise<void> {
  const button = w.findAll('.prologue-answer').find((b) => b.text().startsWith(label))
  expect(button, `no control «${label}» on this card: ${w.text().slice(0, 140)}`).toBeTruthy()
  await button!.trigger('click')
  await flush(w)
}

const proceedOn = (w: Wrapper) => w.find('.prologue-proceed')
/** ⚠⚠ THE WAY BACK IS FOUND BY ITS ACCESSIBLE NAME AND NOT BY A PRIVATE CLASS, because of the
 *  standing law (owner, 30.07: «Для back я просил везде сделать один компонент и его консистентно
 *  использовать, просто иконка с белым fill»). Item 8 shipped this control as a hand-written text
 *  button and `tests/ui-control-system.test.ts` refused it on exactly that sentence; it is the house
 *  `IconButton variant="bare" icon="back"` now, so there is no word on the card to read and the only
 *  handle a player with a screen reader – or this file – has is the name the component puts on it.
 *  Pressing what the law names is also what keeps these arms alive through the next restyling of the
 *  column. ⚠ The gate itself did not move: `canGoBack` is the same `run.opens` predicate. */
const backOn = (w: Wrapper) => w.find('button[aria-label="Back"]')

/** The label of the option with `id` on whatever face of the card at `age` this run is drawing. */
function optionLabel(age: number, run: PrologueRun, id: string): string {
  const card = cardFor(age, run)
  const found = (card.origins ?? card.options)?.find((o) => o.id === id)
  expect(found, `no option «${id}» on the card at ${age}`).toBeTruthy()
  return found!.label
}

/** Answer the card at `age` the way `road` says, and press Proceed. Returns the run as the container
 *  now holds it, so the caller can look the next card's labels up off the right face of the twelfth.
 *
 *  ⚠ THE ASK IS ALWAYS DECLINED except where the road enters her, which is the tenth's own option
 *  rather than an ask. `TOURNAMENT_ANSWER.decline`'s label is read off the card, never typed. */
async function answerCard(
  w: Wrapper,
  age: number,
  run: PrologueRun,
  road: Record<number, string>,
  enterAsk = false,
): Promise<PrologueRun> {
  const card = cardFor(age, run)
  let next = run
  if (card.origins) {
    await press(w, optionLabel(age, run, 'middle'))
    next = { ...next, origin: 'middle' }
  } else if (card.options) {
    await press(w, optionLabel(age, run, road[age]))
    next = withPick(next, age, road[age])
  } else if (!card.tournament) {
    await press(w, card.continueLabel)
    return next
  }
  if (card.tournament) {
    await press(w, enterAsk ? card.tournament.enterLabel : card.tournament.declineLabel)
    const answer = enterAsk ? TOURNAMENT_ANSWER.enter : TOURNAMENT_ANSWER.decline
    next = { ...next, entries: { ...next.entries, [age]: answer } }
  }
  const proceed = proceedOn(w)
  expect(proceed.exists(), `the card at ${age} is answered and offers no way on`).toBe(true)
  await proceed.trigger('click')
  await flush(w)
  return next
}

// =================================================================================================
describe('⭐⭐⭐ item 9 – the radios are passive and the yellow button is the way on', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  // ⚠⚠ WHERE IT SITS IS LOAD-BEARING IN THREE PLACES AT ONCE, and this is the one arm that says so.
  // `.prologue-answers` must stay the card's LAST element or `measureDialog` reads the way out off
  // the wrong edge and every fit number on the walk goes quietly wrong (prologue-walk.test.ts's own
  // precondition test); the way out must stay the LAST control in it, because `e2e/smoke.spec.ts`
  // presses the last button on the five expecting the skip; and Proceed has to be under the ask
  // rather than over it, or it offers to leave a screen that is still asking.
  it('⭐⭐⭐ Proceed comes after every question on the card and before the way out', async () => {
    stubStore()
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    await nextTick()
    await press(w, optionLabel(5, EMPTY_RUN, 'middle'))

    const answers = document.querySelector('.prologue-answers')!
    const card = document.querySelector('.prologue-card')!
    expect(card.lastElementChild, 'something follows the answers column').toBe(answers)
    const column = [...answers.querySelectorAll('button')]
    expect(column.at(-1)!.classList.contains('prologue-skip'), 'the way out is no longer the last control').toBe(true)
    expect(column.at(-2)!.classList.contains('prologue-proceed'), 'Proceed is not the control before it').toBe(true)
    w.unmount()
  })

  // ⚠ THE e2e SMOKE WALK'S OWN PRECONDITION, ASSERTED HERE SO IT FAILS IN 40 ms RATHER THAN IN A
  // BROWSER. `e2e/smoke.spec.ts` takes the way out of the prologue as «the LAST button on the first
  // card» – by position, deliberately, because every sentence in the prologue is a draft it may not
  // name. Proceed on that card must therefore never be after it.
  it('⚠ the last button on the five is still the way out, answered or not', async () => {
    stubStore()
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    await nextTick()
    const last = () => [...document.querySelectorAll('.prologue-card button')].at(-1)!
    expect(last().textContent, 'the way out is not the last button before an answer').toContain(WALK_COPY.skip)
    await press(w, optionLabel(5, EMPTY_RUN, 'middle'))
    expect(proceedOn(w).exists(), 'the origin is taken and there is no way on').toBe(true)
    expect(last().textContent, 'Proceed pushed the way out off the bottom of the card').toContain(WALK_COPY.skip)
    w.unmount()
  })

  // ⚠ IT IS THE ADVANCE TREATMENT AND NOT THE SELECTION'S, which is round 40 #1's split held to from
  // the other side: `.prologue-answer`'s accent wash means «advance and nothing else» since that
  // item, and this is the control that advances. Measured through the real cascade, not off a class
  // name – round-17 #3 is why every colour rule on this card is written that way.
  it('⚠ Proceed wears the advance treatment, and its label clears AA on it', async () => {
    stubStore()
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    await nextTick()
    await press(w, optionLabel(5, EMPTY_RUN, 'middle'))

    const proceed = document.querySelector<HTMLElement>('.prologue-proceed')!
    const anAnswer = document.querySelector<HTMLElement>('.prologue-choice')!
    const paint = getComputedStyle(proceed)
    expect(paint.backgroundColor, 'Proceed is painted the field tone a SELECTION wears').not.toBe(
      getComputedStyle(anAnswer).backgroundColor,
    )
    expect(proceed.getAttribute('role'), 'Proceed announces itself as a choice').toBeNull()
    expect(proceed.getAttribute('aria-checked'), 'Proceed reports a taken state it cannot have').toBeNull()
    expect(proceed.querySelector('.prologue-mark'), 'Proceed carries the selection ball').toBeNull()
    assertLegible(proceed.querySelector<HTMLElement>('.prologue-answer-label')!, 'the way on')
    w.unmount()
  })

  // ⚠⚠ AND THE PRESS IS RE-VALIDATED RATHER THAN TRUSTED. `proceed()` reads `cardFinished` again
  // before it advances, so a press arriving from a card the run has stopped agreeing with cannot
  // walk the player past a year – the screen-side spelling of the engine's «every command is
  // re-validated» rule. Reached here by emitting the event straight at the container, which is the
  // only way to produce the stale press a rendered control cannot.
  it('⚠⚠ a Proceed that arrives when the card is not finished advances nothing', async () => {
    stubStore()
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    await nextTick()
    const five = PROLOGUE_CARDS[0]
    expect(titleNow(w), 'the walk is not on the five').toBe(titleOf(five))
    expect(proceedOn(w).exists(), 'the five offers a way on with no origin taken').toBe(false)

    w.findComponent({ name: 'PrologueCard' }).vm.$emit('proceed')
    await flush(w)
    expect(titleNow(w), 'an unearned Proceed walked the player off the five').toBe(titleOf(five))
    w.unmount()
  })
})

// =================================================================================================
describe('⭐⭐⭐ item 8 – the way back to the card before this one', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  // ⭐⭐⭐ HIS LITERAL ASK: the second screen, back to the first, with what was typed and chosen on it.
  it('⭐⭐⭐ the six goes back to the five, the origin is still marked, and it can be changed', async () => {
    stubStore()
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    await nextTick()
    const five = PROLOGUE_CARDS[0]
    const six = PROLOGUE_CARDS[1]
    expect(backOn(w).exists(), 'the first card offers a way back to nothing').toBe(false)

    await answerCard(w, 5, EMPTY_RUN, LIGHT_ROAD)
    expect(titleNow(w), 'the five did not advance').toBe(titleOf(six))

    const back = backOn(w)
    expect(back.exists(), 'the second card offers no way back').toBe(true)
    await back.trigger('click')
    await flush(w)
    expect(titleNow(w), 'the way back did not go back').toBe(titleOf(five))

    // ...and the answer is on the card, not lost with the screen.
    const marked = w.findAll('.prologue-choice').filter((b) => b.attributes('aria-checked') === 'true')
    expect(marked, 'the earlier card came back with nothing marked on it').toHaveLength(1)
    expect(marked[0].text()).toContain(optionLabel(5, EMPTY_RUN, 'middle'))
    expect(proceedOn(w).exists(), 'an already-answered card came back with no way on').toBe(true)

    // ...and re-choosing overwrites rather than adds
    await press(w, optionLabel(5, EMPTY_RUN, 'wealthy'))
    const now = w.findAll('.prologue-choice').filter((b) => b.attributes('aria-checked') === 'true')
    expect(now, 'the card is holding two origins at once').toHaveLength(1)
    expect(now[0].text()).toContain(optionLabel(5, EMPTY_RUN, 'wealthy'))

    // ...and forward still works
    await proceedOn(w).trigger('click')
    await flush(w)
    expect(titleNow(w), 'the walk could not go forward again').toBe(titleOf(six))
    w.unmount()
  })

  // ⚠⚠ THE SAFETY PREDICATE, AND IT IS THE WHOLE REASON THIS CONTROL IS NOT SIMPLY `at -= 1`.
  // `run.opens` is APPEND-ONLY BY DESIGN (run.ts) – a weekend that happened cannot un-happen – so a
  // Back that returned to a year whose Local Open has already been played would invite the player to
  // answer «Not this year» for a tournament the run still holds, and the childhood would then report
  // and bill a weekend it says was never entered. The eleventh is the first card that can be in that
  // state: the carried road enters her at ten, so the tenth's weekend is in the run by the time the
  // eleventh is on screen.
  it('⚠⚠ a year that has already played its weekend cannot be walked back into', async () => {
    stubStore()
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    await nextTick()
    let run: PrologueRun = EMPTY_RUN
    for (const age of [5, 6, 7, 8, 9]) run = await answerCard(w, age, run, CARRIED_ROAD)

    // the tenth, answered «Enter her» – its weekend takes the screen
    expect(backOn(w).exists(), 'the tenth offers no way back to a quiet ninth year').toBe(true)
    await press(w, optionLabel(10, run, 'enter'))
    await proceedOn(w).trigger('click')
    await flush(w)

    // ⚠ WALK THE WEEKEND OFF THE SCREEN THE WAY THE SKIPPING PLAYER DOES – its own header control,
    // then the one way on off the result scene. The bracket was resolved before the screen opened,
    // so the weekend is in `run.opens` either way.
    for (let guard = 0; guard < 8; guard++) {
      const skip = w.find('.plo-skip')
      if (skip.exists()) {
        await skip.trigger('click')
        await flush(w)
        continue
      }
      if (titleNow(w) === PROLOGUE_CARDS.find((c) => c.age === 11)!.title) break
      await w.find('.prologue-answer').trigger('click')
      await flush(w)
    }
    expect(titleNow(w), 'the walk never reached the eleventh').toBe(PROLOGUE_CARDS.find((c) => c.age === 11)!.title)
    expect(
      backOn(w).exists(),
      'the eleventh offers to walk back into a year whose tournament she has already played',
    ).toBe(false)
    w.unmount()
  })

  // ⚠⚠ AND WHAT THE PLAYER CHANGES IS WHAT THE CAREER IS MADE FROM. Nothing is cleared on the way
  // back and nothing is refreshed by hand – every reading is a computed off the run – so the only
  // honest test of that is the far end: walk to the handover twice from one mount, changing an
  // earlier year in between, and read the years `newCareer` was actually given.
  it('⚠⚠ an answer changed on the way back is the answer the career is built from', async () => {
    const { years } = stubStore()
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    await nextTick()
    let run: PrologueRun = EMPTY_RUN
    for (const age of [5, 6, 7, 8]) run = await answerCard(w, age, run, LIGHT_ROAD)

    // the ninth, answered the cheap way, and then re-answered the dear way from the card after it
    expect(titleNow(w)).toBe(PROLOGUE_CARDS.find((c) => c.age === 9)!.title)
    await press(w, optionLabel(9, run, 'group'))
    await proceedOn(w).trigger('click')
    await flush(w)
    await backOn(w).trigger('click')
    await flush(w)
    expect(titleNow(w), 'the way back did not return to the ninth').toBe(PROLOGUE_CARDS.find((c) => c.age === 9)!.title)
    await press(w, optionLabel(9, run, 'one-to-one'))
    await proceedOn(w).trigger('click')
    await flush(w)

    run = withPick(run, 9, 'one-to-one')
    for (const age of [10, 11, 12, 13]) run = await answerCard(w, age, run, LIGHT_ROAD)

    expect(years, 'the career was never created').toHaveLength(1)
    const ninth = years[0].find((y) => y.age === 9)!
    const group = cardFor(9, run).options!.find((o) => o.id === 'group')!
    const oneToOne = cardFor(9, run).options!.find((o) => o.id === 'one-to-one')!
    expect(group.teaching, 'the two answers to the ninth are the same year – this arm measures nothing').not.toBe(
      oneToOne.teaching,
    )
    expect(ninth.teaching, 'the career was built from the answer the player went back and changed').toBe(
      oneToOne.teaching,
    )
    w.unmount()
  })
})

// =================================================================================================
describe('⭐⭐⭐ item 4 – the coach line on the screen, across two weekends of one childhood', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  // ⭐⭐⭐ HIS COMPLAINT, END TO END: «а фраза та же самая пишется». The unit table
  // (tests/prologue-round41.test.ts) pins which sentence each shape of weekend gets; what this
  // measures is the half that table cannot – that the CONTAINER counts, that it counts the right
  // weekend, and that the second Local Open of a childhood therefore never prints a first-weekend
  // line whatever the brackets happened to come to.
  //
  // ⚠ THE CLAIM IS SEED-INDEPENDENT ON PURPOSE. The walk draws its own seed at mount and the two
  // brackets are whatever that seed gives, so an arm that named a sentence would be pinning a draw.
  // What is true of EVERY draw is the shape of the rule: ordinal one may print one of the scenes'
  // own lines, and ordinal two may not print any of them.
  // MUTATION-VERIFIED: `localOpenCard`'s fourth argument ignored -> the second weekend prints a
  // first-weekend line and this reddens, naming it.
  it('⭐⭐⭐ the second Local Open never repeats a first-weekend sentence', async () => {
    stubStore()
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    await nextTick()
    let run: PrologueRun = EMPTY_RUN
    for (const age of [5, 6, 7, 8, 9]) run = await answerCard(w, age, run, CARRIED_ROAD)

    /** Walk whatever tennis is on the screen off it, returning the coach line its result scene said.
     *  ⚠ THE RESULT SCENE IS RECOGNISED BY ITS KICKER, which is the weekend's own and is shared by
     *  all four of its faces – the three the bracket chooses between and the hurt one. */
    async function playWeekendOff(): Promise<string> {
      let said = ''
      for (let guard = 0; guard < 10; guard++) {
        const skip = w.find('.plo-skip')
        if (skip.exists()) {
          await skip.trigger('click')
          await flush(w)
          continue
        }
        if (w.find('.prologue-kicker').text() === LOCAL_OPEN_COPY.kicker) {
          said = w.find('.prologue-read-coach').text()
          await w.find('.prologue-answer').trigger('click')
          await flush(w)
          return said
        }
        break
      }
      throw new Error(`no weekend on the screen: ${w.text().slice(0, 140)}`)
    }

    // the tenth, entered – the card's OWN decision at that age
    await press(w, optionLabel(10, run, 'enter'))
    await proceedOn(w).trigger('click')
    await flush(w)
    const first = await playWeekendOff()
    run = withPick(run, 10, 'enter')

    // ...and the eleventh, whose lighter ask is answered yes
    expect(titleNow(w), 'the walk never reached the eleventh').toBe(PROLOGUE_CARDS.find((c) => c.age === 11)!.title)
    run = await answerCard(w, 11, run, CARRIED_ROAD, true)
    const second = await playWeekendOff()

    const scenes = [LOCAL_OPEN_COPY.result.won, LOCAL_OPEN_COPY.result.final, LOCAL_OPEN_COPY.result.lost]
    const firstWeekendLines = scenes.map((s) => s.coach)
    expect(first, `her first weekend said something no first weekend says: ${first}`).toBeTruthy()
    expect(
      [...firstWeekendLines, LOCAL_OPEN_COPY.coachAgain.pastFirstOnce, LOCAL_OPEN_COPY.hurt.coach].includes(first),
      `the first weekend said «${first}», which is not one of the sentences a first weekend has`,
    ).toBe(true)
    expect(
      firstWeekendLines.includes(second),
      `the second weekend repeated a first-weekend sentence: «${second}»`,
    ).toBe(false)
    expect(
      [...Object.values(LOCAL_OPEN_COPY.coachAgain), LOCAL_OPEN_COPY.hurt.coach].includes(second),
      `the second weekend said «${second}», which the counter cannot produce`,
    ).toBe(true)
    w.unmount()
  })
})
