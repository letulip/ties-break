// ⭐⭐⭐ ROUND 40 – THE PROLOGUE'S CHOICES: A CONTROL THAT SELECTS SAYS SO, AND THE SECOND QUESTION
// ARRIVES WHEN THE FIRST IS ANSWERED. Mounted, on a 375x667 phone, through the real cascade.
//
// ITEM 1, his testers through him: «у нас там есть ряд кнопок, которые, как говорят мои тестеры "не
// делают ничего", например выбор ordinary school/sports school. Надо их найти все там (точно не
// только это две) и переделать интерфейсно на более явный выбор, не чекбокс, а как радио может, но
// что-то, что их отличит от обычных кнопок как-то визуально.»
//
// ITEM 2: «когда есть 2 группы кнопок, пока верхние не нажаты нижние ничего не делают, может быть
// сделать, чтобы человек сначала делал верхний выбор, а потом на этом же экране появлялись
// следующие кнопки, чтобы флоу был более явным?»
//
// ⚠⚠ THE DIAGNOSIS IS THE ITEM AND IT IS NOT «THE BUTTON IS BROKEN». Those controls do what they
// are asked: they SELECT. What they do not do is move the screen - a card carrying two questions
// stays until both are answered (`cardAnswered`) - and they were drawn IDENTICALLY to the control
// that does move it. So this file's claims are about what a control SAYS IT IS, in three registers
// that a player, a keyboard and a screen reader each read separately:
//
//   1. THE CENSUS – every control in the prologue that sets a value is a radio in a named group,
//      and it announces which answer is taken. The list is walked off the TABLE rather than typed,
//      so a card that grows an answer is covered the day it is added.
//   2. THE NEGATIVE ARM – the controls that ADVANCE carry none of it. Without this the first claim
//      is satisfied by putting `role="radio"` on everything, which would say nothing at all.
//   3. THE DISCLOSURE – the tournament question is not on the card until the year is answered, the
//      year's own answers stay and stay re-choosable under it, and nothing above them is replaced.
//
// ⚠ MUTATION-VERIFIED. Every `it` below was watched failing before it was believed:
//   * `role="radio"` dropped from the choice button -> the census test goes red naming the age; the
//     radiogroup dropped -> the group test goes red on its own, and the census stays green, which
//     is why they are two.
//   * `aria-checked` bound to `undefined` -> "it announces which answer is taken" goes red.
//   * the mark (`.prologue-mark`) deleted -> the appearance test goes red on the mark arm; the
//     `.prologue-answers .prologue-choice` paint rule deleted (so a choice keeps `.prologue-answer`'s
//     wash) -> the same test goes red on the "apart from the advance" arm.
//   * `askOpen` returning `Boolean(props.ask)` (the second group rendered unconditionally) -> the
//     disclosure test goes red on its first arm, and prologue-tournaments.test.ts's own goes red too.
//   * `v-if="picked === undefined"` on `.prologue-picks` (the first group frozen once it is
//     answered) -> the re-choosable arm goes red.
//   * the arrow-key handler deleted -> the keyboard test goes red on the focus arm while the rest
//     stays green.
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { assertLegible } from './contrast'
import { setViewport, PHONE } from './fits'
import PrologueCardView from '../../src/components/PrologueCard.vue'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import {
  CARD_AGES,
  LOCAL_OPEN_COPY,
  PROLOGUE_CARDS,
  TOURNAMENT_ANSWER,
  TWELFTH_WANTS_MORE,
  localOpenCard,
  type PrologueCard,
} from '../../src/prologue/cards'
import { OPENING_IDENTITY } from '../../src/prologue/identity'
import {
  EMPTY_RUN,
  cardFor,
  moodAt,
  readTwelfth,
  warmthAt,
  withOrigin,
  withPick,
  type PrologueRun,
} from '../../src/prologue/run'
import { DEFAULT_PROFILE, type PlayerProfile, type PrologueHandover } from '../../src/shared/protocol'

const CARRIED_ROAD: Record<number, string> = {
  8: 'club', 9: 'one-to-one', 10: 'enter', 11: 'sports-school', 12: 'give-her-the-year',
}

function stubStore() {
  const game = useGameStore()
  game.newCareer = vi.fn(async (_seed: string, profile: PlayerProfile = DEFAULT_PROFILE, prologue?: PrologueHandover) => {
    game.snapshot = toSnapshot(createWorld('r40', profile, 'c', prologue))
  })
  game.deleteCareer = vi.fn(async () => {
    game.snapshot = null
  })
  return game
}

/** ⭐ THE CENSUS, TAKEN OFF THE TABLE RATHER THAN TYPED. Every scene the walk can draw, with the run
 *  that reaches it – both faces of the twelfth, because only one of them is ever on a single road. */
function everyScene(): { name: string; card: PrologueCard; run: PrologueRun }[] {
  const seen: { name: string; card: PrologueCard; run: PrologueRun }[] = []
  let run = EMPTY_RUN
  for (const row of PROLOGUE_CARDS) {
    const card = cardFor(row.age, run)
    seen.push({ name: `age ${row.age}`, card, run })
    if (card.origins) run = withOrigin(run, 'middle')
    else if (card.options) run = withPick(run, card.age, CARRIED_ROAD[card.age])
  }
  // The face the carried road never reaches, asserted by name rather than left to a road.
  const tired = PROLOGUE_CARDS.find((c) => c.age === 12)!
  const carried = seen.find((s) => s.card === TWELFTH_WANTS_MORE)
  seen.push({ name: 'the twelfth (tired)', card: tired, run: carried?.run ?? EMPTY_RUN })
  return seen
}

/** One scene, mounted the way the container mounts it. `picked` is what the run holds for the card's
 *  own question, so a card carrying an ask is drawn in the state where BOTH are on the screen. */
function mountScene(card: PrologueCard, run: PrologueRun, picked?: string) {
  setViewport(PHONE)
  const wrapper = mount(PrologueCardView, {
    attachTo: document.body,
    props: {
      card,
      warmth: warmthAt(card.age, run),
      mood: moodAt(card.age, run),
      reason: card.age === 12 ? readTwelfth(run).reason : undefined,
      ask: card.tournament,
      picked,
      identity: { ...OPENING_IDENTITY },
    },
  })
  return wrapper
}

/** The first two steps of the accessible-name algorithm, which are the only two this surface uses –
 *  the same helper `tests/component/a11y-sweep.test.ts` introduced, kept identical on purpose. */
function accName(el: Element): string {
  const label = el.getAttribute('aria-label')
  if (label !== null) return label
  const ids = el.getAttribute('aria-labelledby')
  if (ids !== null) {
    return ids
      .split(/\s+/)
      .map((id) => document.querySelector(`#${id}`)?.textContent?.trim() ?? '')
      .join(' ')
  }
  return el.textContent?.trim() ?? ''
}

describe('⭐⭐⭐ item 1 – every control that SELECTS is drawn and announced as a selection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  // ⭐⭐ THE CENSUS ITSELF. «точно не только эти две» – the two he named are the eleventh's, and the
  // walk below covers TWENTY-THREE controls across ten scenes: three origins on the five, two
  // answers on each of 8, 9, 10, 11 and both faces of 12 (twelve), and the tournament question's two
  // on 11, 12 (both faces) and 13 (eight). The count is asserted so a card that quietly stopped
  // drawing its answers cannot pass this loop by having none to check.
  it('⭐⭐ every answer on every scene is a radio, and there are more of them than the two he named', () => {
    let radios = 0
    const missing: string[] = []
    for (const { name, card, run } of everyScene()) {
      const wrapper = mountScene(card, run, card.options?.[0].id)
      const own = card.origins ?? card.options ?? []
      const ask = card.tournament ? 2 : 0
      for (const button of document.querySelectorAll('.prologue-answers button')) {
        const isChoice = button.classList.contains('prologue-choice')
        if (!isChoice) continue
        radios += 1
        if (button.getAttribute('role') !== 'radio') missing.push(`${name}: ${button.textContent?.slice(0, 30)}`)
        // ...and the state is ON THE CONTROL, where a name cannot carry it.
        if (!/^(true|false)$/.test(button.getAttribute('aria-checked') ?? '')) {
          missing.push(`${name}: no state on ${button.textContent?.slice(0, 30)}`)
        }
      }
      // every answer the table holds for this scene is one of them, and nothing else is
      expect(document.querySelectorAll('.prologue-choice').length, `${name} – the answers`).toBe(own.length + ask)
      wrapper.unmount()
      document.body.innerHTML = ''
    }
    expect(missing, 'a control that sets a value is still drawn as a plain button').toEqual([])
    // ⚠ NON-VACUOUS, AND THE NUMBER IS THE ANSWER TO «точно не только эти две»: the loop really did
    // meet the whole census, not the one card the item names.
    expect(radios, 'the census is thin – this walk is not seeing the prologue`s choices').toBe(23)
  })

  // ⭐ A RADIO WITHOUT A GROUP IS A CHECKBOX WITH A DOT ON IT. Two questions can be on one card, so
  // there are two owners, and each one is named by the line it answers – no new string anywhere:
  // the five's own question, the title (which IS the question on 8..12, see `question` in cards.ts)
  // and the ask's own line.
  it('⭐ each set of answers is a named radiogroup, and two questions never share one', () => {
    for (const { name, card, run } of everyScene()) {
      const wrapper = mountScene(card, run, card.options?.[0].id)
      const groups = [...document.querySelectorAll('[role="radiogroup"]')]
      const expected = (card.origins || card.options ? 1 : 0) + (card.tournament ? 1 : 0)
      expect(groups.length, `${name} – the answers are owned by a group`).toBe(expected)
      for (const group of groups) {
        expect(accName(group).length, `${name} – a group of answers with no name`).toBeGreaterThan(0)
        expect(group.querySelectorAll('[role="radio"]').length, `${name} – an empty group`).toBeGreaterThan(1)
      }
      // ...and no radio is outside one, which is the half a per-control check cannot see.
      const owned = groups.flatMap((g) => [...g.querySelectorAll('[role="radio"]')])
      expect([...document.querySelectorAll('[role="radio"]')].length, `${name} – a loose radio`).toBe(owned.length)
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })

  // ⭐⭐ AND IT SAYS WHICH ANSWER IS TAKEN – the whole of «pressing one and seeing the screen stay
  // put». The eleventh is the card he named: two answers, and a tournament question under them.
  it('⭐⭐ the answer the player took is the one that reads as checked', () => {
    const eleven = PROLOGUE_CARDS.find((c) => c.age === 11)!
    const wrapper = mountScene(eleven, EMPTY_RUN)
    const state = () => [...document.querySelectorAll('.prologue-choice')].map((b) => b.getAttribute('aria-checked'))
    // nothing is taken, and every control says so rather than saying nothing
    expect(state()).toEqual(['false', 'false'])
    wrapper.unmount()

    const taken = mountScene(eleven, EMPTY_RUN, 'sports-school')
    expect(state(), 'the answer the parent took is not marked').toEqual(['false', 'true', 'false', 'false'])
    // ...and the mark is on the answer whose label he pressed, not on a position.
    const checked = document.querySelector('.prologue-choice[aria-checked="true"]')!
    expect(checked.textContent).toContain(eleven.options![1].label)
    taken.unmount()
  })

  // ⚠⚠ THE NEGATIVE ARM, AND IT IS WHAT MAKES EVERY CLAIM ABOVE MEAN ANYTHING. The controls that
  // ADVANCE the story carry none of it: the quiet cards' way on, a weekend's result scene, and the
  // way out of the prologue. If they did, «a selection looks like a selection» would be satisfied by
  // a prologue where everything looks the same again.
  it('⚠⚠ the controls that ADVANCE carry no selection affordance at all', () => {
    const scenes: { name: string; card: PrologueCard; skip?: string }[] = [
      { name: 'age 6', card: PROLOGUE_CARDS.find((c) => c.age === 6)! },
      { name: 'age 7', card: PROLOGUE_CARDS.find((c) => c.age === 7)! },
      { name: 'a won weekend', card: localOpenCard(10, 'won') },
      { name: 'a weekend she left hurt', card: localOpenCard(12, 'lost', true) },
    ]
    for (const { name, card } of scenes) {
      const wrapper = mountScene(card, EMPTY_RUN)
      const ways = [...document.querySelectorAll('.prologue-answers button')]
      expect(ways.length, `${name} – a quiet scene has one way on`).toBe(1)
      expect(ways[0].getAttribute('role'), `${name} – the way on is drawn as a choice`).toBeNull()
      expect(ways[0].getAttribute('aria-checked'), `${name} – the way on reports a state`).toBeNull()
      expect(ways[0].classList.contains('prologue-choice'), `${name} – the way on wears the choice`).toBe(false)
      expect(document.querySelectorAll('[role="radiogroup"]').length, `${name} – a group with nothing to choose`).toBe(0)
      wrapper.unmount()
      document.body.innerHTML = ''
    }

    // ...and the way OUT of the prologue, which sits in the same column as three real answers.
    const wrapper = mount(PrologueCardView, {
      attachTo: document.body,
      props: {
        card: PROLOGUE_CARDS[0],
        warmth: 'cool' as const,
        mood: moodAt(5, EMPTY_RUN),
        identity: { ...OPENING_IDENTITY },
        skipLabel: 'Skip',
      },
    })
    const skip = document.querySelector('.prologue-skip')!
    expect(skip.getAttribute('role'), 'the door out of the story is drawn as an answer to it').toBeNull()
    expect(skip.closest('[role="radiogroup"]'), 'the way out is inside the group of answers').toBeNull()
    expect(document.querySelectorAll('.prologue-choice').length, 'the three origins are the choices').toBe(3)
    wrapper.unmount()
  })

  // ⭐⭐⭐ «что-то, что их отличит от обычных кнопок как-то визуально» – MEASURED THROUGH THE REAL
  // CASCADE, not asserted on a class name. A selection is painted in the two tokens this card's own
  // FIELDS are painted in (`--card-top` on `--line`); the way on keeps the accent wash it always
  // had. A test that read the class would pass on a sheet where the two rules were identical.
  it('⭐⭐⭐ a choice does not look like the way on – different ground, and a mark of its own', () => {
    // ⚠ THE VALUES ARE READ OUT BEFORE THE MOUNT IS TAKEN DOWN. `getComputedStyle` hands back a LIVE
    // declaration: keeping the object and unmounting under it reads '' for every property, which is
    // a comparison two controls always pass. Cost one run to find.
    const paintOf = (selector: string) => {
      const cs = getComputedStyle(document.querySelector(selector)!)
      return { bg: cs.backgroundColor, edge: cs.borderTopColor }
    }
    const eleven = PROLOGUE_CARDS.find((c) => c.age === 11)!
    const wrapper = mountScene(eleven, EMPTY_RUN, 'ordinary-school')
    const choice = paintOf('.prologue-choice')
    wrapper.unmount()
    document.body.innerHTML = ''

    const quiet = mountScene(PROLOGUE_CARDS.find((c) => c.age === 6)!, EMPTY_RUN)
    const advance = paintOf('.prologue-answer')
    expect(choice.bg, 'the measurement is blind – neither control reports a ground').not.toBe('')
    expect(choice.bg, 'a selection is painted like the button that advances').not.toBe(advance.bg)
    expect(choice.edge, 'a selection is edged like the button that advances').not.toBe(advance.edge)
    // the field tokens, named – so a repaint that happened to differ from the CTA by accident still
    // has to be the app's own answer for «a thing you set».
    const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    expect(token('--card-top'), 'the token is not declared – this comparison would be vacuous').not.toBe('')
    expect(choice.bg).toBe(token('--card-top'))
    quiet.unmount()
    document.body.innerHTML = ''

    // ...and the mark, which is the part a player sees before reading anything.
    const marked = mountScene(eleven, EMPTY_RUN, 'ordinary-school')
    const marks = [...document.querySelectorAll('.prologue-choice .prologue-mark')]
    expect(marks.length, 'a radio with no ring on it').toBe(4)
    expect(getComputedStyle(marks[0]).borderRadius, 'the mark is not round').toBe('50%')
    // the taken one is filled and the untaken one is not – the state, said in paint as well as in
    // `aria-checked`.
    const fill = (at: number) => getComputedStyle(document.querySelectorAll('.prologue-mark')[at]).backgroundColor
    expect(fill(0), 'the chosen answer`s mark is not filled').not.toBe(fill(1))
    expect(fill(0)).toBe(token('--accent'))
    marked.unmount()
  })

  // ⚠ ROUND-17 #3 – AND THE NEW GROUND IS READABLE, IN BOTH STATES. The checked state is deliberately
  // the mark and the edge rather than a fill: `--accent-fill` over `--card-top` puts the note at a
  // measured 4.29:1, under AA, which is the exact shape of the defect that gate exists for.
  it('⚠ every line of a choice clears AA, taken and untaken', () => {
    for (const { name, card, run } of everyScene()) {
      const wrapper = mountScene(card, run, card.options?.[0].id)
      for (const el of document.querySelectorAll('.prologue-choice .prologue-answer-label')) {
        assertLegible(el, `${name} – a choice label`)
      }
      for (const el of document.querySelectorAll('.prologue-choice .prologue-answer-note')) {
        assertLegible(el, `${name} – a choice note`)
      }
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })

  // ⭐⭐ AND A KEYBOARD CAN REACH IT AND SET IT. Arrows walk the group the way arrows walk a radio
  // group; the press itself is the button's own, which is what Space does on a `<button>`.
  //
  // ⚠ THE ARROWS DELIBERATELY DO NOT SELECT – the documented WAI-ARIA variation for a group whose
  // selection «triggers a significant change», and here it does: on the eight, the nine and the ten
  // the card is finished the moment its one question is answered.
  it('⭐⭐ a keyboard reaches both groups and sets both answers', async () => {
    const eleven = PROLOGUE_CARDS.find((c) => c.age === 11)!
    const wrapper = mountScene(eleven, EMPTY_RUN, 'ordinary-school')
    const radios = [...document.querySelectorAll<HTMLButtonElement>('.prologue-choice')]
    expect(radios.length, 'both questions are on the screen').toBe(4)
    // Nothing is taken out of the tab order: every answer on this card is reachable by Tab alone.
    for (const r of radios) expect(r.getAttribute('tabindex'), 'an answer was taken off the keyboard').toBeNull()

    // the year's own group – ArrowDown moves the focus and does NOT answer for the player
    radios[0].focus()
    await wrapper.findAll('.prologue-choice')[0].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement, 'the arrow did not move inside the group').toBe(radios[1])
    expect(wrapper.emitted('answer'), 'the arrow answered the question by itself').toBeUndefined()
    // ...and it wraps, which is what stops the last answer being a dead end.
    await wrapper.findAll('.prologue-choice')[1].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement, 'the group does not wrap').toBe(radios[0])
    // ...and the press is the button's own.
    await wrapper.findAll('.prologue-choice')[0].trigger('click')
    expect(wrapper.emitted('answer')).toEqual([[eleven.options![0].id]])

    // the tournament question's group – its own owner, and its own arrows
    radios[2].focus()
    await wrapper.findAll('.prologue-choice')[2].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement, 'the second group has no keys of its own').toBe(radios[3])
    // ⚠ AND THE ARROW STOPPED AT THE GROUP'S EDGE rather than walking into the year's answers, which
    // is the whole reason there are two groups and not one.
    await wrapper.findAll('.prologue-choice')[3].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement, 'the two questions are one group to the keyboard').toBe(radios[2])
    await wrapper.findAll('.prologue-choice')[3].trigger('click')
    expect(wrapper.emitted('answer')).toEqual([[eleven.options![0].id], [TOURNAMENT_ANSWER.decline]])
    wrapper.unmount()
  })
})

describe('⭐⭐⭐ item 2 – the second group appears when the first is answered, on the same screen', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  /** Press the control whose label starts with `label`, on whatever scene is up. */
  async function press(wrapper: ReturnType<typeof mount>, label: string): Promise<void> {
    const button = wrapper.findAll('.prologue-answer').find((b) => b.text().startsWith(label))
    expect(button, `no «${label}»: ${wrapper.text().slice(0, 140)}`).toBeTruthy()
    await button!.trigger('click')
    await Promise.resolve()
    await wrapper.vm.$nextTick()
  }

  // ⭐⭐⭐ THE ACCEPTANCE, THROUGH THE REAL WALK. The player answers eight cards to reach the
  // eleventh - the card he named - and the tournament question is not on it until the year is.
  it('⭐⭐⭐ on the real walk, the eleventh asks its question only once the year is answered', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    for (const age of CARD_AGES.slice(0, 6)) {
      const card = PROLOGUE_CARDS.find((c) => c.age === age)!
      if (card.origins) await press(wrapper, card.origins[1].label)
      else if (card.options) await press(wrapper, card.options.find((o) => o.id === CARRIED_ROAD[age])!.label)
      else await press(wrapper, card.continueLabel)
      // ⚠ the tenth buys a weekend on this road; walk past it the way the skipping player does –
      // the weekend's own header control, then the one way on off the result scene.
      for (let guard = 0; guard < 8; guard++) {
        const skip = wrapper.find('.plo-skip')
        if (skip.exists()) {
          await skip.trigger('click')
          await Promise.resolve()
          await wrapper.vm.$nextTick()
          continue
        }
        if (wrapper.find('.prologue-kicker').text() === LOCAL_OPEN_COPY.kicker) {
          await wrapper.find('.prologue-answer').trigger('click')
          await Promise.resolve()
          await wrapper.vm.$nextTick()
          continue
        }
        break
      }
    }
    const eleven = PROLOGUE_CARDS.find((c) => c.age === 11)!
    expect(wrapper.find('.prologue-title').text(), 'the walk is not on the eleventh').toBe(eleven.title)

    // 1. the year's own answers, and NOTHING under them.
    expect(wrapper.find('.prologue-ask').exists(), 'the question is up before the year is answered').toBe(false)
    expect(wrapper.findAll('.prologue-choice')).toHaveLength(2)

    // 2. the year is answered - and the screen stays, with the question added under it.
    await press(wrapper, eleven.options![0].label)
    expect(wrapper.find('.prologue-title').text(), 'answering the year left the card').toBe(eleven.title)
    expect(wrapper.find('.prologue-ask').text(), 'the question did not arrive').toBe(eleven.tournament!.lede)
    expect(wrapper.findAll('.prologue-choice')).toHaveLength(4)
    // ...and the year's answer is marked, so the press it followed is visible.
    expect(wrapper.findAll('.prologue-choice')[0].attributes('aria-checked')).toBe('true')

    // 3. ⚠ THE FIRST CHOICE IS NOT A TRAP: it is still on the screen and still changeable, and
    //    changing it does not take the question away or answer it.
    await press(wrapper, eleven.options![1].label)
    expect(wrapper.find('.prologue-title').text(), 'changing the year left the card').toBe(eleven.title)
    expect(wrapper.findAll('.prologue-choice')[1].attributes('aria-checked'), 'the change did not take').toBe('true')
    expect(wrapper.findAll('.prologue-choice')[0].attributes('aria-checked')).toBe('false')
    expect(wrapper.find('.prologue-ask').exists(), 're-choosing the year took the question away').toBe(true)
    expect(
      wrapper.findAll('.prologue-choice').slice(2).map((b) => b.attributes('aria-checked')),
      'changing the year answered the question for the player',
    ).toEqual(['false', 'false'])

    // 4. and answering the question is what finishes the card.
    await press(wrapper, eleven.tournament!.declineLabel)
    expect(wrapper.find('.prologue-title').text(), 'both questions were answered and the card stayed').not.toBe(eleven.title)
    wrapper.unmount()
  })

  // ⚠ AND THE THIRTEENTH DISCLOSES IMMEDIATELY, which is the arm a rule keyed on «has an ask» would
  // get wrong: it has no decision of its own (`sameAsLastYear`), so there is no upper group for its
  // question to wait behind, and a card whose only control was hidden would be a dead end.
  it('⚠ a card with no decision of its own asks straight away', () => {
    const thirteen = PROLOGUE_CARDS.find((c) => c.age === 13)!
    const wrapper = mountScene(thirteen, EMPTY_RUN)
    expect(document.querySelector('.prologue-ask')!.textContent!.trim()).toBe(thirteen.tournament!.lede)
    expect(document.querySelectorAll('.prologue-choice').length, 'the thirteenth has nothing to press').toBe(2)
    expect(document.querySelectorAll('[role="radiogroup"]').length, 'the ask has no owner of its own').toBe(1)
    wrapper.unmount()
  })
})
