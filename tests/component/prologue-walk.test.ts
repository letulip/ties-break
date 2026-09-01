// ⭐⭐ THE WALK THROUGH ALL NINE CARDS, MOUNTED, ON A 375x667 PHONE – phase 2's acceptance criterion
// (docs/specs/childhood-prologue-build-2026-09.md §7): «a mounted walk through all nine on a 375x667
// phone, every card's dismiss control inside the viewport (the round-20 #3 rule). Ten minutes
// measured, not assumed – time the walk.»
//
// ⚠⚠ WHY THE ROUND-20 #3 RULE BINDS HARDEST HERE. `TourBriefingDialog` shipped as a lead, a list,
// five bullets and a closing line on the shared `dialog-card`, and on a 375x667 phone Continue sat
// 188px below the bottom of the screen on a BLOCKING overlay – the owner's career stopped there and
// could not be resumed («сейчас его даже не закрыть»). These nine cards are the same shape and worse
// placed: they are the FIRST thing a new player ever sees, so a card that does not fit stops a
// career before it starts, and there are NINE chances for it – ten, counting the twelfth's other
// face. CLAUDE.md's gotcha asks for exactly this assertion on any dialog that is added or
// lengthened, and it asks for it to be proved by mutation.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed:
//   * `max-height: 100%; overflow-y: auto` removed from `.dialog-card` in src/style.css (i.e. the
//     stylesheet put back exactly as it shipped before round-20 #3) -> every one of the ten scenes
//     goes red, naming the content floor and «cap NONE, NOT scrollable».
//   * one card's `lede` tripled in length -> that scene alone goes red on the height cap.
//   * `.prologue-answers` moved above `.prologue-read` in the template -> the dismiss box is no
//     longer readable off the card's bottom edge and the fit assertion goes red.
//   * the reading budget's `WORDS_PER_MINUTE` halved -> the ten-minute assertion goes red.
//   * a digit put into any card string -> the no-numbers walk goes red naming the card.
import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN STYLESHEET. Without it `.dialog-card`'s height bound is not in the cascade and
// every measurement below is vacuous – the same reason tour-briefing.test.ts imports it.
import '../../src/style.css'
import { assertLegible } from './contrast'
import { assertDismissReachable, measureDialog, setViewport, PHONE, NARROW_PHONE } from './fits'
import PrologueCardView from '../../src/components/PrologueCard.vue'
import { PROLOGUE_CARDS, TWELFTH_WANTS_MORE, type PrologueCard } from '../../src/prologue/cards'
import {
  EMPTY_RUN,
  cardFor,
  readTwelfth,
  warmthAt,
  withOrigin,
  withPick,
  type PrologueRun,
} from '../../src/prologue/run'

/** The two roads through the table, named by what the player did rather than by what they got. */
const LIGHT_ROAD: Record<number, string> = { 8: 'municipal', 9: 'group', 10: 'stay-home', 11: 'ordinary-school', 12: 'let-her-stop' }
const CARRIED_ROAD: Record<number, string> = { 8: 'club', 9: 'one-to-one', 10: 'enter', 11: 'sports-school', 12: 'give-her-the-year' }

/** Mount one card the way the player meets it: attached to the document, so the cascade being
 *  measured is the real one, and with the viewport set FIRST – happy-dom resolves lengths at
 *  `getComputedStyle` time, so a viewport set after the mount measures the previous screen. */
function mountCard(card: PrologueCard, run: PrologueRun, vp: { width: number; height: number }) {
  setViewport(vp)
  const wrapper = mount(PrologueCardView, {
    attachTo: document.body,
    props: {
      card,
      warmth: warmthAt(card.age, run),
      reasons: card.age === 12 ? readTwelfth(run).reasons : undefined,
    },
  })
  const el = document.querySelector('.prologue-card')!
  const answers = document.querySelector('.prologue-answers')!
  expect(el, `age ${card.age} – the card is up, so nothing below is vacuous`).toBeTruthy()
  expect(answers.querySelector('button'), `age ${card.age} – and there is a way on`).toBeTruthy()
  return { wrapper, el, answers }
}

/** One player's whole run: nine cards in order, each answered, with the twelfth resolved from what
 *  was chosen before it. Returns every scene that was actually drawn. */
function walk(road: Record<number, string>, origin: 'working' | 'middle' | 'wealthy'): { card: PrologueCard; run: PrologueRun }[] {
  const seen: { card: PrologueCard; run: PrologueRun }[] = []
  let run = EMPTY_RUN
  for (const row of PROLOGUE_CARDS) {
    const card = cardFor(row.age, run)
    seen.push({ card, run })
    if (card.origins) run = withOrigin(run, origin)
    else if (card.options) run = withPick(run, card.age, road[card.age])
  }
  return seen
}

describe('⭐⭐ nine cards on a 375x667 phone, and the way on is on every one of them', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⭐ THE ACCEPTANCE CRITERION ITSELF. Both roads, because the twelfth has two faces and only one
  // of them is drawn on any single run – a fit test that walked one road would never measure the
  // other card at all.
  it('every card on both roads fits, with its answers inside the screen', () => {
    for (const [name, road] of [['the light road', LIGHT_ROAD], ['the carried road', CARRIED_ROAD]] as const) {
      for (const { card, run } of walk(road as Record<number, string>, 'middle')) {
        const { wrapper, el, answers } = mountCard(card, run, PHONE)
        assertDismissReachable(el, answers, PHONE, `${name}, age ${card.age}`)
        wrapper.unmount()
      }
    }
  })

  // The twelfth's other face is reached only by the road that earns it, so it is asserted by name
  // rather than left to a road happening to cover it.
  it('...including the face of the twelfth the other road never sees', () => {
    const wantsMore = walk(CARRIED_ROAD, 'middle').find((s) => s.card.age === 12)!
    const tired = walk(LIGHT_ROAD, 'middle').find((s) => s.card.age === 12)!
    expect(wantsMore.card).toBe(TWELFTH_WANTS_MORE)
    expect(tired.card).toBe(PROLOGUE_CARDS[7])
    for (const scene of [wantsMore, tired]) {
      const { wrapper, el, answers } = mountCard(scene.card, scene.run, PHONE)
      assertDismissReachable(el, answers, PHONE, `the twelfth (${scene.card === TWELFTH_WANTS_MORE ? 'wants more' : 'tired'})`)
      wrapper.unmount()
    }
  })

  // 320x568 is the narrowest screen the app is expected to survive. Not part of the ask; measured
  // because the cards are the first surface a player meets and the cost of knowing is one loop.
  it('and on the narrowest phone the app supports', () => {
    for (const { card, run } of walk(CARRIED_ROAD, 'working')) {
      const { wrapper, el, answers } = mountCard(card, run, NARROW_PHONE)
      assertDismissReachable(el, answers, NARROW_PHONE, `narrow, age ${card.age}`)
      wrapper.unmount()
    }
  })

  // ⚠⚠ AND THE ORDERING IS ASSERTED RATHER THAN ASSUMED, WHICH A MUTATION PASS IS WHAT FOUND.
  // `measureDialog` reads the dismiss control's box off the card's own bottom edge once the card is
  // scrolled to its end – its own docstring says the control «must be the LAST thing in the card's
  // flow» – so a template that puts a paragraph AFTER the answers makes every fit number above
  // quietly wrong while every one of them stays green. Nothing in `fits.ts` can notice that, because
  // happy-dom does no layout and the helper is handed the element to measure. So the precondition is
  // a test of its own: moving `.prologue-answers` above `.prologue-read` was the one mutation of
  // twenty that survived the first pass, and this is what it bought.
  it('the answers are the last thing on the card – the precondition every fit number above rests on', () => {
    for (const { card, run } of walk(CARRIED_ROAD, 'middle')) {
      const { wrapper, el, answers } = mountCard(card, run, PHONE)
      expect(el.lastElementChild, `age ${card.age} – something follows the way out`).toBe(answers)
      wrapper.unmount()
    }
  })

  // ⚠ ROUND-17 #3, THE OTHER WAY A NEW DIALOG SHIPS UNREADABLE. `BirthdayDialog` painted its four
  // choice rows `var(--card, #fff)` on `var(--ink, #1c1c1e)` – a light-theme pair in a dark app,
  // with `--card` declared nowhere, so the fallbacks won and four buttons shipped at a MEASURED
  // 1.09:1 on a dialog the player could not dismiss. Every structural test passed. This card uses
  // the same tokens as `.birthday-choice` and no fallback anywhere; here is the number.
  it('every line on the card clears AA against what is actually behind it', () => {
    for (const { card, run } of walk(CARRIED_ROAD, 'middle')) {
      const { wrapper } = mountCard(card, run, PHONE)
      assertLegible(document.querySelector('.prologue-title')!, `age ${card.age} title`)
      assertLegible(document.querySelector('.prologue-lede')!, `age ${card.age} lede`)
      assertLegible(document.querySelector('.prologue-read-line')!, `age ${card.age} her`)
      for (const el of document.querySelectorAll('.prologue-answer-label')) assertLegible(el, `age ${card.age} answer`)
      for (const el of document.querySelectorAll('.prologue-answer-note')) assertLegible(el, `age ${card.age} note`)
      wrapper.unmount()
    }
  })

  // ⚠ THE CONTENT-INDEPENDENT HALF, STATED ONCE ON ITS OWN. Everything above is true of TODAY'S
  // draft copy; this is what still holds after the owner replaces a card with three sentences of his
  // own, and it is the actual fix round-20 #3 asked for.
  it('the card is bounded by the screen and scrolls, whatever the copy grows into', () => {
    const { wrapper, el, answers } = mountCard(PROLOGUE_CARDS[0], EMPTY_RUN, PHONE)
    const fit = measureDialog(el, answers, PHONE)
    expect(fit.cap).toBeLessThanOrEqual(fit.available.height)
    expect(fit.scrollable, 'the card scrolls, so copy past the fold can still be reached').toBe(true)
    wrapper.unmount()
  })
})

describe('⭐ what the walk shows about her – and it is nothing numeric', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⭐⭐ THE DESIGN ANSWER, MEASURED ON THE RENDERED SCREEN RATHER THAN ON THE TABLE. cards.ts
  // carries the argument; this is the claim a player could check. No skill number, no rating, no
  // percentage, no money, no running balance – at any age, on either road. The formed rose is the
  // HANDOVER's payload (§5) and phase 4's to spend.
  it('not one digit appears on any of the ten scenes, on either road', () => {
    const offenders: string[] = []
    for (const road of [LIGHT_ROAD, CARRIED_ROAD]) {
      for (const { card, run } of walk(road, 'wealthy')) {
        const { wrapper } = mountCard(card, run, PHONE)
        const text = wrapper.text()
        if (/\d/.test(text) || text.includes('$') || text.includes('%')) {
          offenders.push(`age ${card.age}: ${(text.match(/.{0,40}[\d$%].{0,40}/) ?? [''])[0]}`)
        }
        wrapper.unmount()
      }
    }
    expect(offenders).toEqual([])
  })

  // The two sentences a parent actually has, and the screen shows both.
  it('every card shows her and the person teaching her', () => {
    for (const { card, run } of walk(CARRIED_ROAD, 'middle')) {
      const { wrapper } = mountCard(card, run, PHONE)
      expect(wrapper.text(), `age ${card.age} – her`).toContain(card.her[warmthAt(card.age, run)])
      expect(wrapper.text(), `age ${card.age} – the coach`).toContain(card.coach[warmthAt(card.age, run)])
      wrapper.unmount()
    }
  })

  // ⭐ THE FORK SAYS WHAT IT READ, so a derived reading cannot be mistaken for a die.
  it('the twelfth prints the three facts it read off the years before it', () => {
    const scene = walk(LIGHT_ROAD, 'middle').find((s) => s.card.age === 12)!
    const { wrapper } = mountCard(scene.card, scene.run, PHONE)
    for (const reason of readTwelfth(scene.run).reasons) expect(wrapper.text()).toContain(reason)
    wrapper.unmount()
  })

  it('a quiet card offers exactly one way on, and a decision card offers its answers', () => {
    for (const { card, run } of walk(CARRIED_ROAD, 'middle')) {
      const { wrapper } = mountCard(card, run, PHONE)
      const buttons = wrapper.findAll('.prologue-answer')
      const expected = (card.origins ?? card.options)?.length ?? 1
      expect(buttons.length, `age ${card.age}`).toBe(expected)
      wrapper.unmount()
    }
  })

  it('answering emits the id the table holds, and a quiet card emits nothing but a step', async () => {
    const quiet = mountCard(PROLOGUE_CARDS[2], EMPTY_RUN, PHONE)
    await quiet.wrapper.findAll('.prologue-answer')[0].trigger('click')
    expect(quiet.wrapper.emitted('answer')).toEqual([[null]])
    quiet.wrapper.unmount()

    const decision = mountCard(PROLOGUE_CARDS[3], EMPTY_RUN, PHONE)
    await decision.wrapper.findAll('.prologue-answer')[1].trigger('click')
    expect(decision.wrapper.emitted('answer')).toEqual([['club']])
    decision.wrapper.unmount()
  })
})

// =================================================================================================
// ⭐⭐ TEN MINUTES, MEASURED
// =================================================================================================
//
// ⚠⚠ THE WALL-CLOCK OF THIS TEST IS NOT THE MEASUREMENT AND MUST NOT BE MISTAKEN FOR ONE. Mounting
// ten Vue components takes tens of milliseconds and says nothing whatever about a player's ten
// minutes; §7's budget is about READING AND DECIDING. So what is measured here is the READING
// LENGTH of everything the nine cards put in front of a player, converted at a stated rate. IT IS AN
// ESTIMATE AND IT IS LABELLED ONE – the honest thing a test can do about a ten-minute budget is
// bound the copy, and that is exactly the quantity that will drift when somebody adds «one honest
// sentence at a time».
//
// THE MODEL, stated so it can be argued with rather than trusted:
//   * WORDS – every word the card renders: the kicker, the title, the lede, the two reads, the
//     fork's reasons, and EVERY answer's label and note (a player reads all the answers before
//     taking one, which is most of the point of a decision card).
//   * RATE – 200 words a minute. Adult silent reading of easy prose is usually put at 220-260; this
//     is prose the player has never seen, on a phone, while deciding, so the rate is deliberately
//     below the textbook number rather than at it.
//   * DECIDING – 12 seconds on each of the five decision cards, 3 on each of the four quiet ones.
//     A flat guess, named as one; it is the term that would change most if he plays it and says.
//
// ⚠ AND IT IS A CEILING, NOT A PREDICTION. Nobody re-reads, nobody puts the phone down, and nobody
// goes back – so the true first-play number is HIGHER than this, and the assertion below is a bound
// on the copy rather than a claim about a person. What the number is for is the thing round-20 #4
// named: catching the slow growth, one honest sentence at a time.
const WORDS_PER_MINUTE = 200
const DECIDE_SECONDS = 12
const QUIET_SECONDS = 3

function wordsOn(card: PrologueCard, run: PrologueRun): number {
  const parts = [card.kicker, card.title, card.lede, card.her[warmthAt(card.age, run)], card.coach[warmthAt(card.age, run)]]
  if (card.age === 12) parts.push(...readTwelfth(run).reasons)
  for (const o of card.origins ?? card.options ?? []) parts.push(o.label, o.note)
  if (!card.origins && !card.options) parts.push(card.continueLabel)
  return parts.join(' ').split(/\s+/).filter(Boolean).length
}

describe('⭐⭐ the ten-minute budget, measured as a reading length', () => {
  it('the longest road through the nine cards reads in well under ten minutes', () => {
    const rows: string[] = []
    let worstMinutes = 0
    for (const [name, road] of [['light', LIGHT_ROAD], ['carried', CARRIED_ROAD]] as const) {
      let words = 0
      let seconds = 0
      for (const { card, run } of walk(road as Record<number, string>, 'middle')) {
        const w = wordsOn(card, run)
        words += w
        seconds += (card.options || card.origins ? DECIDE_SECONDS : QUIET_SECONDS)
      }
      const minutes = words / WORDS_PER_MINUTE + seconds / 60
      worstMinutes = Math.max(worstMinutes, minutes)
      rows.push(`${name.padEnd(8)} ${String(words).padStart(4)} words + ${String(seconds).padStart(3)}s deciding = ${minutes.toFixed(1)} min`)
    }
    // Printed, because the number is the deliverable and a green test that prints nothing tells
    // nobody what it measured.
    console.log(`\n  THE NINE CARDS, AS A READING LENGTH (estimate, ${WORDS_PER_MINUTE} wpm)\n  ${rows.join('\n  ')}\n`)

    // §7: «Ten minutes, inside a free first fragment of 30-60 minutes … About a minute a card.»
    expect(worstMinutes, 'the nine cards read longer than the budget').toBeLessThanOrEqual(10)
    // ...and the floor matters too: nine cards a player can clear in ninety seconds is not a
    // prologue, it is a loading screen. MUTATION: cut every lede to four words -> red here.
    expect(worstMinutes, 'the nine cards are too thin to be the first ten minutes of the game').toBeGreaterThanOrEqual(3)
  })

  // ⚠ THE PER-CARD CEILING IS THE HALF THAT CATCHES SLOW GROWTH. A total under ten minutes can hide
  // one card of four hundred words behind eight short ones, and it is the single long card that
  // stops a player rather than the sum. 170 words is about fifty seconds of reading on the model
  // above – a ceiling for one card, not a target.
  //
  // ⚠ THE TWELFTH IS THE OUTLIER AND IT IS EARNED, not slack: it is the only card that prints the
  // three facts the fork read off the years before it, which is what stops a derived reading from
  // being taken for a die.
  it('no single card is long enough to be a wall of text', () => {
    const measured = [...walk(LIGHT_ROAD, 'middle'), ...walk(CARRIED_ROAD, 'middle')].map(({ card, run }) => ({
      age: card.age,
      words: wordsOn(card, run),
    }))
    console.log(
      `\n  WORDS PER CARD (the carried road)\n  ` +
        walk(CARRIED_ROAD, 'middle')
          .map(({ card, run }) => `age ${String(card.age).padStart(2)}: ${String(wordsOn(card, run)).padStart(3)} words`)
          .join('\n  ') +
        '\n',
    )
    expect(measured.filter((r) => r.words > 170), 'a card that long is a page, not a card').toEqual([])
    // ...and the scan is real: it can see the cards, so an empty offender list means something.
    expect(measured).toHaveLength(18)
    expect(Math.max(...measured.map((r) => r.words))).toBeGreaterThan(100)
  })
})
