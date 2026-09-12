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
import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { assertLegible, contrastRatio, effectiveBackground, parseColor } from './contrast'
import { setViewport, PHONE } from './fits'
import PrologueCardView from '../../src/components/PrologueCard.vue'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import { finishCard } from './prologueLanding'
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

/** Source-over compositing, for the one colour `effectiveBackground` cannot walk to: a BORDER. The
 *  empty ball's whole visible state is its ring, and the ring is `rgba(207, 225, 82, 0.45)` – read
 *  as an element background it would report an alpha nobody can compare against anything. */
function overRow(fg: [number, number, number, number], bg: [number, number, number]): [number, number, number] {
  return [
    fg[0] * fg[3] + bg[0] * (1 - fg[3]),
    fg[1] * fg[3] + bg[1] * (1 - fg[3]),
    fg[2] * fg[3] + bg[2] * (1 - fg[3]),
  ]
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
    //
    // ⚠ ROUND 40, THE OWNER'S VISUAL (08.09) – THE MARK IS THE BALL NOW, and one expected value
    // below legitimately moved with it: the UNTAKEN mark's own background was `--bg`, a well punched
    // into the row, and it is `transparent` now, because the ring alone is the empty ball and a
    // second edge nobody can see (1.19:1, measured) is not minimalism. The claim this arm makes is
    // unchanged and still passes as written – taken and untaken are painted differently, and the
    // taken one is the accent – and the ball's own describe block below measures both states, the
    // ring included, against the row they sit on.
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

// =================================================================================================
// ⭐⭐⭐ THE OWNER'S VISUAL (08.09) – THE RADIO IS OUR OWN BALL
// =================================================================================================
//
// He named the picture after wave A shipped the behaviour: the radio should be a CUSTOM control
// built as a tennis ball – the yellow dot off our own logo, minimal, with nothing extra on it. His
// words are in docs/rounds/round-40.md, item 1, which is where they are allowed to live.
//
// ⚠ «MINIMAL, WITH NOTHING EXTRA» IS READ STRICTLY HERE, and that is what makes it testable: no
// seam curve, no gloss, no gradient, no shadow. A ball with none of those IS a circle of one
// colour, so the assertions below are about a circle, a token and two contrast ratios – not about a
// class name, which would pass on a sheet where the rule had been deleted.
//
// ⚠ AND THE UNSELECTED STATE KEEPS ITS RING. That is not an extra element; it is the control being
// findable before anyone has pressed it, and wave A's ring – `--line` around a `--bg` well – was
// not: 1.23:1 and 1.19:1 against the row, measured, which is under the 3:1 WCAG 2.1 asks of a
// control's own boundary (1.4.11 Non-text Contrast). The numbers below are the fix, and they are
// printed on every run so a future edit that quietly returns the old ring fails with a number.
//
// ⚠ MUTATION-VERIFIED, like everything above it, and the numbers below are what the runs printed:
//   * the checked ball's `background: var(--accent)` changed to `var(--line)` -> four go red: the
//     ball's own test, the theme test, this block's «taken and untaken are told apart» arm, and
//     wave A's older «a choice does not look like the way on» arm.
//   * the ring's `var(--accent-soft)` put back to wave A's `var(--line)` -> the empty-ball test goes
//     red at exactly 1.2256:1, and the theme test with it, since a `--line` ring no longer follows
//     the brand. Nothing else moves.
describe("⭐⭐⭐ the owner's visual – the mark a choice carries is the product's own ball", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  const ELEVEN = () => PROLOGUE_CARDS.find((c) => c.age === 11)!
  const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const rgb = (css: string): [number, number, number] => {
    const [r, g, b] = parseColor(css)
    return [r, g, b]
  }
  /** ⚠ THE MEASUREMENT REFUSES TO RUN BLIND, exactly as `assertLegible` does: with no stylesheet in
   *  the document every element computes to its initial values and every claim here is vacuous. */
  const notBlind = () => {
    expect(document.head.querySelector('style'), 'no stylesheet – the component project needs `css: true`').toBeTruthy()
    expect(token('--accent'), 'the theme did not load – this whole file would be measuring nothing').not.toBe('')
  }

  it('⭐⭐⭐ the taken answer wears the ball – a round accent dot on the row, measured', () => {
    const wrapper = mountScene(ELEVEN(), EMPTY_RUN, 'ordinary-school')
    notBlind()
    const row = document.querySelector('.prologue-choice[aria-checked="true"]')!
    const ball = row.querySelector('.prologue-mark')!
    const cs = getComputedStyle(ball)
    // a circle, and a circle of ONE colour
    expect(cs.borderRadius, 'the ball is not round').toBe('50%')
    expect(cs.width, 'the ball is an oval').toBe(cs.height)
    expect(parseFloat(cs.width), 'the ball is too small to be a mark').toBeGreaterThanOrEqual(14)
    // ...and the colour is the app's own lime, read through the cascade rather than off a class
    const paint = effectiveBackground(ball)
    const ground = effectiveBackground(row)
    expect(paint, 'the ball is painted in the row it sits on – there is no dot').not.toEqual(ground)
    expect(paint, 'the taken ball is not the accent').toEqual(rgb(token('--accent')))
    const ratio = contrastRatio(paint, ground)
    console.log(`  the taken ball on its row: ${ratio.toFixed(2)}:1 (accent ${token('--accent')} on ${token('--card-top')})`)
    expect(ratio, `the ball is invisible on its own row at ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3)
    wrapper.unmount()
  })

  // ⭐⭐ AND IT IS THE TOKEN RATHER THAN THE HEX – PROVEN BY MOVING THE THEME UNDER IT. `public/ball.svg`
  // carries a literal `#C6E12B`; a control painted in a literal would sit still while the app it
  // belongs to changed colour, and no equality check against today's value can tell the two apart.
  // This one can: swap the two tokens the ball is built from and watch the paint follow.
  it('⭐⭐ the ball follows the THEME, which is what a hard-coded hex could not do', () => {
    const wrapper = mountScene(ELEVEN(), EMPTY_RUN, 'ordinary-school')
    notBlind()
    const ball = document.querySelector('.prologue-choice[aria-checked="true"] .prologue-mark')!
    const empty = document.querySelector('.prologue-choice[aria-checked="false"] .prologue-mark')!
    const before = { ball: getComputedStyle(ball).backgroundColor, ring: getComputedStyle(empty).borderTopColor }
    try {
      document.documentElement.style.setProperty('--accent', '#ff00ff')
      document.documentElement.style.setProperty('--accent-rgb', '255, 0, 255')
      expect(getComputedStyle(ball).backgroundColor, 'the taken ball is a literal, not `--accent`').toBe('#ff00ff')
      // the empty ball's ring is built from the same brand, through `--accent-soft`
      expect(parseColor(getComputedStyle(empty).borderTopColor).slice(0, 3), 'the ring is a literal too').toEqual([255, 0, 255])
    } finally {
      document.documentElement.style.removeProperty('--accent')
      document.documentElement.style.removeProperty('--accent-rgb')
    }
    // ...and the probe put the theme back, or every test after this one would be measuring magenta.
    expect(getComputedStyle(ball).backgroundColor, 'the theme was left swapped').toBe(before.ball)
    expect(getComputedStyle(empty).borderTopColor, 'the theme was left swapped').toBe(before.ring)
    wrapper.unmount()
  })

  // ⚠⚠ THE HALF THAT IS NOT THE PICTURE: A CONTROL NOBODY CAN SEE IS NOT A CONTROL. Before the ball
  // the untaken mark was a `--line` hairline round a `--bg` well – 1.23:1 and 1.19:1 on this row,
  // which is a radio that appears only once you have pressed it.
  it('⚠⚠ the empty ball is findable – its ring measured against the row it sits on', () => {
    const wrapper = mountScene(ELEVEN(), EMPTY_RUN, 'ordinary-school')
    notBlind()
    const row = document.querySelector('.prologue-choice[aria-checked="false"]')!
    const empty = row.querySelector('.prologue-mark')!
    const ground = effectiveBackground(row)
    // the centre is the row's own ground: the ring is the whole of the empty state, and a second
    // edge inside it would be the «extra element» the ruling excludes AND unreadable anyway.
    expect(effectiveBackground(empty), 'the empty ball punches a well nobody can see').toEqual(ground)
    const cs = getComputedStyle(empty)
    const ring = parseColor(cs.borderTopColor)
    expect(ring[3], 'the ring is not painted at all').toBeGreaterThan(0)
    expect(parseFloat(cs.borderTopWidth), 'a ring with no width').toBeGreaterThan(0)
    const seen = overRow(ring, ground)
    const ratio = contrastRatio(seen, ground)
    console.log(`  the empty ball's ring on its row: ${ratio.toFixed(2)}:1 (${cs.borderTopColor} on ${token('--card-top')})`)
    expect(ratio, `the empty ball is invisible at ${ratio.toFixed(2)}:1 – it was 1.23:1 before the ball`).toBeGreaterThanOrEqual(3)

    // ...and the two states are told apart by more than a name: the ball and the empty ring are
    // themselves 3:1 apart, so «taken» is legible without reading the label beside it.
    const taken = effectiveBackground(document.querySelector('.prologue-choice[aria-checked="true"] .prologue-mark')!)
    const apart = contrastRatio(taken, seen)
    console.log(`  taken ball against empty ring: ${apart.toFixed(2)}:1`)
    expect(apart, `taken and untaken look alike at ${apart.toFixed(2)}:1`).toBeGreaterThanOrEqual(3)
    wrapper.unmount()
  })

  // ⚠ «WITH NOTHING EXTRA ON IT» – the ball file's white seam belongs on the logo, not on an 18px
  // control, and neither does a gloss, a gradient or a shadow. This is the arm that keeps the next
  // hand from prettying it up.
  it('⚠ nothing but the dot – no seam, no gloss, no gradient, no shadow', () => {
    const wrapper = mountScene(ELEVEN(), EMPTY_RUN, 'ordinary-school')
    notBlind()
    const marks = [...document.querySelectorAll('.prologue-mark')]
    expect(marks.length, 'the walk is not seeing the marks').toBe(4)
    const NOTHING = ['none', '', 'initial']
    for (const mark of marks) {
      const cs = getComputedStyle(mark)
      // `initial` is what happy-dom reports for a property nobody declared, and it is the same
      // answer as `none` here – a real gradient or shadow reports its own text and fails either way.
      expect(NOTHING, 'a gradient on the ball').toContain(cs.backgroundImage)
      expect(NOTHING, 'a shadow under the ball').toContain(cs.boxShadow)
      // the seam, the gloss and every other picture would have to be drawn by a child of the mark
      expect(mark.childElementCount, 'something is drawn inside the ball').toBe(0)
      expect(mark.getAttribute('aria-hidden'), 'the decorative ball announces itself').toBe('true')
    }
    // ⚠ AND THE READER CAN SEE THE THING IT FORBIDS, or the four claims above are a green light on a
    // blind measurement: declare the gloss and the shadow on one mark and watch them arrive.
    const probe = marks[0] as HTMLElement
    probe.style.backgroundImage = 'linear-gradient(#ffffff, #000000)'
    probe.style.boxShadow = '0 1px 2px #000000'
    expect(getComputedStyle(probe).backgroundImage, 'a gradient is invisible to this arm').toContain('linear-gradient')
    expect(NOTHING, 'a shadow is invisible to this arm').not.toContain(getComputedStyle(probe).boxShadow)
    probe.style.removeProperty('background-image')
    probe.style.removeProperty('box-shadow')
    wrapper.unmount()
  })

  // ⚠ AND THE KEYBOARD CAN STILL SEE WHERE IT IS. The app declares ONE focus ring (`:focus-visible`
  // in style.css) and the ball must not have taken it: the mark is a decorative span, the control is
  // the button around it.
  //
  // ⚠ WHAT THIS ARM CAN AND CANNOT SAY. happy-dom matches `:focus-visible` without gating it on
  // focus, so this measures that the app's one ring REACHES this control and resolves to a legible
  // hairline at an offset – not that the browser toggles it. The toggling was watched in a real
  // Chromium on the wave-A walk.
  it('⚠ focus is still visible, and it is the control that carries it rather than the ball', () => {
    const wrapper = mountScene(ELEVEN(), EMPTY_RUN, 'ordinary-school')
    notBlind()
    const row = document.querySelector<HTMLElement>('.prologue-choice')!
    row.focus()
    expect(document.activeElement, 'an answer cannot take the keyboard').toBe(row)
    const cs = getComputedStyle(row)
    expect(cs.outlineStyle, 'the focused answer draws no ring').not.toBe('none')
    expect(parseFloat(cs.outlineWidth), 'the focus ring has no width').toBeGreaterThan(0)
    expect(cs.outlineColor, 'the focus ring is not the app`s own').toBe(token('--accent'))
    // it is drawn at an offset, so what it is read against is the surface BEHIND the row
    const behind = effectiveBackground(row.parentElement!)
    const ratio = contrastRatio(rgb(cs.outlineColor), behind)
    console.log(`  the focus ring behind the row: ${ratio.toFixed(2)}:1 (${cs.outlineWidth} at ${cs.outlineOffset})`)
    expect(ratio, `the focus ring is invisible at ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3)
    // ...and the ball is not in the focus path at all: it cannot be tabbed to and it draws no ring.
    const ball = row.querySelector<HTMLElement>('.prologue-mark')!
    expect(ball.tabIndex, 'the decorative ball is in the tab order').toBeLessThan(0)
    expect(ball.matches('button, a, input, select, textarea'), 'the ball became a control').toBe(false)
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
    // ⚠⚠ RE-AIMED BY ROUND 41 #9, NOT LOOSENED – and the item it used to serve is the one this same
    // file's third block builds, which round 41 has now retired. The 200 ms hold is gone: a radio
    // only selects, so a finished card waits on Proceed instead of on a clock. This presses the
    // answer and then the Proceed it produced (`finishCard`). ⚠ ITEM 2'S OWN CLAIM IS UNTOUCHED –
    // the disclosure still happens on the press, with no Proceed in between: see the acceptance
    // below, which asserts the ask arrives while the card is still up.
    await finishCard(wrapper, () => button!.trigger('click'))
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

  // ⚠⚠ AND AVAILABILITY IS DERIVED, NOT LATCHED – the owner's own refinement of this item (08.09,
  // in the ledger): with the upper choice released, the lower one must not be reachable. A
  // disclosure that opens once and stays open satisfies every arm above and still breaks that rule,
  // because all of them only ever walk FORWARD.
  //
  // ⚠ SO THIS ONE WALKS BACK, and it is honest about how. A player cannot un-press a radio here:
  // the container only ever WRITES a pick (`withPick` in run.ts – there is no un-pick anywhere in
  // the prologue), so the card's answer travels in one direction on a real walk. What the card is
  // handed is `picked`, recomputed off the run by `ChildhoodPrologue` on every render, and THAT is
  // the input this arm moves – forward and back. What it pins is exactly the owner's rule: the
  // second group is a function of the CURRENT value, not a flag remembering that a value once
  // existed. Mutation-verified by latching `askOpen` open (a `ref` set true on the first pick and
  // never cleared): every other test in this file stays green and this one goes red on the last two
  // assertions.
  it('⚠⚠ the second group is a function of the first answer, not a door that stays open', async () => {
    const eleven = PROLOGUE_CARDS.find((c) => c.age === 11)!
    const wrapper = mountScene(eleven, EMPTY_RUN)
    const asked = () => wrapper.find('.prologue-ask').exists()
    const controls = () => wrapper.findAll('.prologue-choice').length

    // 1. unset – the year's own two answers, and nothing under them
    expect(asked(), 'the question is up before the year is answered').toBe(false)
    expect(controls(), 'the card starts with more than its own answers').toBe(2)

    // 2. answered – the question arrives on the same screen
    await wrapper.setProps({ picked: 'ordinary-school' })
    expect(asked(), 'answering the year did not disclose the question').toBe(true)
    expect(controls()).toBe(4)

    // 3. ⚠ and back to unset: the disclosure goes with the answer it was derived from
    await wrapper.setProps({ picked: undefined })
    expect(asked(), 'the disclosure LATCHED – it is open with nothing answered above it').toBe(false)
    expect(controls(), 'the second pair is still reachable with the first question unanswered').toBe(2)
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

// =================================================================================================
// ⭐⭐⭐ ITEM 3, RE-RULED BY ROUND 41 #9 – THE CARD DOES NOT LEAVE AT ALL UNTIL Proceed IS PRESSED
// =================================================================================================
//
// ⚠⚠ WHAT THIS BLOCK USED TO ASSERT, AND WHY IT IS RE-AIMED RATHER THAN DELETED OR LOOSENED.
// Round 40 #3 was the LANDING HOLD: the owner asked, on 08.09, that the card «land» rather than
// vanish, and the fix held a finished card for `PROLOGUE_LANDING_MS` (200) so the ball a press had
// just filled could be seen. The diagnosis was the promo recorder's – on the eight, the nine and
// the ten the card's one question IS the card, so the answer that filled the ball was the answer
// that moved the screen, and the affordance was never on screen for a frame.
//
// ⭐ ROUND 41 #9 ANSWERS THE SAME COMPLAINT WITH A CONTROL INSTEAD OF A CLOCK, AND IT IS HIS OWN
// RULING, NOT AN AGENT'S READ – «8+9 as cut, верно» (docs/rounds/round-41.md, «The owner's
// rulings»). His sentence for the item: «радиобатон на прологе не должен переключать сразу, он
// только про выбор … при выборе всех будет появляться наша желтая кнопка proceed». A radio that
// never advances makes the hold unreachable by construction: the taken answer stays on screen for
// as long as the player looks at it, which is strictly more than 200 ms, and the player – rather
// than a timer – decides when the card leaves. So the ITEM survives, the MECHANISM is retired, and
// the four arms below are re-aimed onto what replaced it rather than dropped.
//
// ⚠ THE FOUR ARMS, RE-AIMED ONE FOR ONE:
//   * the eight  – the press that answers the card now schedules NOTHING and moves NOTHING; the
//                  ball is filled, the card is still there, and Proceed has appeared. Pressing
//                  Proceed is what advances.
//   * the eleven – the year's answer only DISCLOSES (item 2, unchanged, and still no Proceed while
//                  the ask is open); the ask's answer FINISHES the card, and that press too leaves
//                  the card standing with Proceed under it.
//   * the six    – the way on off a quiet card is untouched and advances on the press. It is the
//                  proof Proceed did not leak onto a card that selects nothing, which is round 40
//                  #1's negative arm still holding.
//   * the last   – an unmount after the answering press advances nothing and creates nothing,
//                  because there is nothing in flight to outlive the screen; and the career is made
//                  by the Proceed on the thirteenth and by nothing else.
//
// ⚠ MUTATION-VERIFIED, like everything above it:
//   * the landing hold put back (`land(() => void advanceYear(age))` at the foot of `answer()`) ->
//     the eight's arm goes red on «the card advanced on the answer itself», and the last card's on
//     a career created by a press that should only select.
//   * `cardFinished` loosened to `cardAnswered` alone -> the five would offer Proceed before an
//     origin is taken; asserted by name in the block below.
//   * the `id !== null` return deleted from `answer()` (i.e. a selection advancing again) -> the
//     eight's and the eleven's arms both go red.
//   * Proceed rendered unconditionally (its `v-if` dropped) -> the quiet-card arm goes red on a
//     second way on, and the eleven's on a Proceed offered while the ask is still open.
describe('⭐⭐⭐ item 3, re-ruled – a radio never advances, and Proceed is what does', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })
  // ⚠ THE NET UNDER EVERY ARM. An assertion that throws while the clock is faked would leave it
  // faked for every file sharing this worker, and the failure would land somewhere else entirely.
  afterEach(() => {
    vi.useRealTimers()
  })

  const titleOf = (age: number) => PROLOGUE_CARDS.find((c) => c.age === age)!.title
  const onScreen = (wrapper: ReturnType<typeof mount>) => wrapper.find('.prologue-title').text()
  /** ⚠ ONLY `setTimeout` / `clearTimeout` – `vi.useFakeTimers()` with no argument also takes `Date`,
   *  `performance` and `requestAnimationFrame`, none of which this item touches.
   *
   *  ⚠⚠ AND IT IS KEPT AFTER ROUND 41 RETIRED THE HOLD, WHICH IS THE POINT OF KEEPING IT. The arms
   *  below assert `getTimerCount() === 0` on presses that used to schedule one, so the fake clock is
   *  now the instrument that proves the hold is GONE rather than moved somewhere else. A mutation
   *  that put `land(...)` back is caught here and nowhere else in the repository. */
  const holdTheClock = () => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

  /** Answer whatever card is up the cheapest way there is, and finish it. ⚠ THE ASK IS ALWAYS
   *  DECLINED, so this road buys no tennis: a weekend is a takeover with the real match viewer on it
   *  and none of the arms below is about weekends.
   *
   *  ⚠ RE-AIMED BY ROUND 41 #9: `finishCard` presses the Proceed the answer produced, where it
   *  produced one. On a card with two questions the first call only discloses and the second is what
   *  finishes it, so the loop in `walkTo` reaches every card the same way it always did. */
  async function answerCurrent(wrapper: ReturnType<typeof mount>): Promise<void> {
    const groups = wrapper.findAll('[role="radiogroup"]')
    const target = groups.length
      ? (() => {
          const group = groups[groups.length - 1]
          const radios = group.findAll('[role="radio"]')
          return group.attributes('aria-labelledby') === 'prologue-ask' ? radios[radios.length - 1] : radios[0]
        })()
      : wrapper.findAll('.prologue-answer')[0]
    expect(target, `nothing to press: ${wrapper.text().slice(0, 140)}`).toBeTruthy()
    await finishCard(wrapper, () => target.trigger('click'))
    await wrapper.vm.$nextTick()
  }

  /** The real component, walked to the card at `age` and stopped ON it. */
  async function walkTo(wrapper: ReturnType<typeof mount>, age: number): Promise<void> {
    for (let guard = 0; guard < 24; guard++) {
      if (onScreen(wrapper) === titleOf(age)) return
      await answerCurrent(wrapper)
    }
    throw new Error(`the walk never reached the card at ${age}: ${wrapper.text().slice(0, 140)}`)
  }

  // ⭐⭐⭐ THE ACCEPTANCE, ON THE FIRST OF THE THREE CARDS THE RECORDER NAMED – and on round 41's
  // reading of it, the card the OWNER named too: «я на радиобатон нажал и не ожидал, что меня
  // переключит дальше сразу» (item 8, which is the same surprise from the other side).
  it('⭐⭐⭐ the eight takes the answer, keeps the card, and offers Proceed', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    await walkTo(wrapper, 8)
    expect(wrapper.find('.prologue-proceed').exists(), 'Proceed is up before anything is answered').toBe(false)

    holdTheClock()
    await wrapper.findAll('.prologue-choice')[1].trigger('click')
    await nextTick()

    // 1. THE ANSWER IS TAKEN AND THE CARD IS STILL THERE – which is his complaint, stated as a pass.
    expect(onScreen(wrapper), 'the radio advanced the walk on its own').toBe(titleOf(8))
    expect(
      wrapper.findAll('.prologue-choice')[1].attributes('aria-checked'),
      'the card stayed, but the ball it is showing is empty',
    ).toBe('true')
    // ⚠ AND NOTHING IS IN FLIGHT. This is the round-40 hold's retirement asserted rather than
    // assumed: a press that only selects schedules no advance at all, so there is no timer that
    // could move the screen after the fact.
    expect(vi.getTimerCount(), 'something is still holding the card on a clock').toBe(0)

    // 2. AND THE WAY ON HAS APPEARED, which is the whole of item 9.
    const proceed = wrapper.find('.prologue-proceed')
    expect(proceed.exists(), 'the card is answered and offers no way on').toBe(true)
    expect(proceed.attributes('role'), 'Proceed is drawn as a choice').toBeUndefined()
    expect(proceed.attributes('aria-checked'), 'Proceed reports a taken state it does not have').toBeUndefined()
    await proceed.trigger('click')
    await nextTick()
    expect(onScreen(wrapper), 'Proceed did not advance the walk').not.toBe(titleOf(8))
    wrapper.unmount()
  })

  // ⚠⚠ AND THE FIVE IS THE ONE CARD WHOSE PREDICATE IS NOT `cardAnswered` – see `cardFinished` in
  // ChildhoodPrologue.vue. That function reads true for the five from the moment it arrives (the
  // card has no `options`, so `yearAt` returns its own row), and the five's real decision is its
  // ORIGIN. Keyed on `cardAnswered` alone the very first screen of the game would offer a way on
  // before the player had chosen where the family is from.
  // MUTATION: `cardFinished` reduced to `cardAnswered(age, run)` -> this reddens on the first line.
  it('⚠⚠ the five offers Proceed only once the family has an origin', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    await nextTick()
    expect(onScreen(wrapper), 'the walk is not on the five').toBe(titleOf(5))
    expect(wrapper.find('.prologue-proceed').exists(), 'the five offers a way on with no origin taken').toBe(false)

    await wrapper.findAll('.prologue-choice')[1].trigger('click')
    await nextTick()
    expect(onScreen(wrapper), 'the origin advanced the walk on its own').toBe(titleOf(5))
    expect(wrapper.find('.prologue-proceed').exists(), 'the origin is taken and there is no way on').toBe(true)
    wrapper.unmount()
  })

  // ⚠⚠ THE CARD WITH TWO QUESTIONS, AND Proceed WAITS FOR BOTH. The eleventh's own answer only
  // DISCLOSES the tournament question (item 2, above and untouched), so a way on offered there would
  // be inviting the player off a screen that is still asking. The ask's answer is what finishes the
  // card – and that press, too, leaves the card exactly where it is.
  // ⚠ THE HALF THIS ARM USED TO MAKE – «the disclosure is not held, the finishing press is» – is the
  // same claim with the clock taken out of it: NEITHER press moves anything, and what tells them
  // apart now is whether Proceed is on the screen afterwards.
  it('⚠⚠ the eleventh discloses on one answer and offers Proceed only after the other', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    await walkTo(wrapper, 11)

    holdTheClock()
    await wrapper.findAll('.prologue-choice')[0].trigger('click')
    await nextTick()
    expect(vi.getTimerCount(), 'the disclosure was put behind a clock').toBe(0)
    expect(wrapper.find('.prologue-ask').exists(), 'the second question did not arrive').toBe(true)
    expect(onScreen(wrapper), 'answering the year left the card').toBe(titleOf(11))
    expect(
      wrapper.find('.prologue-proceed').exists(),
      'the card offers a way on while its second question is still open',
    ).toBe(false)

    // ...and the ask's own answer, which IS the one that finishes this card
    await wrapper.findAll('.prologue-choice')[3].trigger('click')
    await nextTick()
    expect(vi.getTimerCount(), 'the finishing answer was put behind a clock').toBe(0)
    expect(onScreen(wrapper), 'the finishing answer advanced the walk on its own').toBe(titleOf(11))
    expect(
      wrapper.findAll('.prologue-choice')[3].attributes('aria-checked'),
      'the card stayed with nothing marked on it',
    ).toBe('true')
    const proceed = wrapper.find('.prologue-proceed')
    expect(proceed.exists(), 'both questions are answered and there is no way on').toBe(true)
    await proceed.trigger('click')
    await nextTick()
    expect(onScreen(wrapper), 'both questions were answered, Proceed pressed, and the card never moved').not.toBe(
      titleOf(11),
    )
    wrapper.unmount()
  })

  // ⚠⚠ AND THE QUIET CARD IS UNTOUCHED, WHICH IS THE ARM THAT PROVES Proceed DID NOT LEAK. The six
  // selects nothing, so there is nothing for a way on to wait behind: it keeps the ONE control it
  // always had, that control still advances on the press, and no second way on appeared beside it.
  // Item 1's negative arm, still holding after two rounds have rewritten the column around it.
  it('⚠⚠ the way on off a quiet card is untouched – one control, and it still advances', async () => {
    stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    await walkTo(wrapper, 6)
    // ⚠ «ONE CONTROL» IS NOW «ONE WAY ON», AND THE DIFFERENCE IS ROUND 41 #8 RATHER THAN A LOOSENING.
    // The six is the second card, so it also carries the way BACK (`.prologue-back`) – a quiet
    // control at the foot of the column, in the slot the first card gives to the way out. What this
    // arm is about is unchanged: the card that SELECTS NOTHING has exactly one control that moves
    // the walk forward, and it is not a Proceed.
    const ways = wrapper.findAll('.prologue-answers button').filter((b) => !b.classes('prologue-back'))
    expect(ways, 'the six is not the one-way-on card this arm is about').toHaveLength(1)
    expect(ways[0].attributes('role'), 'the way on is a choice on this card').toBeUndefined()
    expect(
      wrapper.find('.prologue-proceed').exists(),
      'Proceed leaked onto a card that selects nothing – there are two ways on',
    ).toBe(false)

    holdTheClock()
    await ways[0].trigger('click')
    await nextTick()
    expect(vi.getTimerCount(), 'the way on was put behind a hold it has no state to show').toBe(0)
    expect(onScreen(wrapper), 'the way on did not advance the walk').not.toBe(titleOf(6))
    wrapper.unmount()
  })

  // ⚠⚠ AND THE CAREER IS MADE BY Proceed AND BY NOTHING ELSE. Measured on the LAST card, because
  // that is where the advance has a consequence outside this component: it creates the career.
  //
  // ⚠ THIS ARM USED TO ASSERT THAT AN UNMOUNT MID-HOLD CANCELLED THE TIMER (`onUnmounted
  // (clearLanding)`). Round 41 retired the hold, so the same hazard is asserted at its root instead:
  // after the answering press there is nothing in flight AT ALL, so a walk the player leaves cannot
  // make a career for a childhood nobody is in – and the thing that does make one is a press the
  // player has to take deliberately.
  it('⚠⚠ answering the last card creates nothing – pressing Proceed on it is what makes the career', async () => {
    const game = stubStore()
    const wrapper = mount(ChildhoodPrologue, { attachTo: document.body })
    await walkTo(wrapper, 13)
    expect(game.newCareer, 'the career exists before the last card is answered').not.toHaveBeenCalled()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    holdTheClock()
    await wrapper.findAll('.prologue-choice')[1].trigger('click')
    await nextTick()
    expect(vi.getTimerCount(), 'the last card put an advance on a clock').toBe(0)
    expect(game.newCareer, 'answering the last card made the career by itself').not.toHaveBeenCalled()
    expect(wrapper.find('.prologue-proceed').exists(), 'the last card is answered and offers no way on').toBe(true)

    // the player leaves the walk instead of pressing it
    wrapper.unmount()
    expect(vi.getTimerCount(), 'something outlived the card and will fire into nothing').toBe(0)
    await nextTick()
    expect(game.newCareer, 'a career was created for a childhood the player had left').not.toHaveBeenCalled()
    expect(warn.mock.calls, 'the walk warned after its component was gone').toEqual([])
    expect(error.mock.calls, 'the walk errored after its component was gone').toEqual([])
    warn.mockRestore()
    error.mockRestore()
    vi.useRealTimers()

    // ...and on a walk that stays, it is Proceed that creates it.
    document.body.innerHTML = ''
    const stayed = mount(ChildhoodPrologue, { attachTo: document.body })
    await walkTo(stayed, 13)
    await stayed.findAll('.prologue-choice')[1].trigger('click')
    await nextTick()
    expect(game.newCareer, 'the second walk made a career without pressing Proceed').not.toHaveBeenCalled()
    await stayed.find('.prologue-proceed').trigger('click')
    await nextTick()
    await Promise.resolve()
    expect(game.newCareer, 'Proceed on the thirteenth did not create the career').toHaveBeenCalled()
    stayed.unmount()
  })
})
