// ⭐⭐⭐ THE LONG GOODBYE, STEP 4 – HER OWN LAST WORD (docs/specs/the-long-goodbye-2026-08.md §4).
//
// WHAT CHANGED, AND WHAT THESE TESTS ARE FOR. Until this step the parent was handed a question with
// exactly one legal answer: at the final offer the card drew a single button and `answerRetirement`
// THREW on a refusal, with an apology in its own header saying the copy had to carry the difference
// between "we are retiring you" and "nobody is going to ask again". Step 4 stops carrying that
// difference in the wording and carries it in the VOICE – the last offer is her statement, the card
// acknowledges it, and there is no refusal control on it because there is nothing to refuse.
//
// Four claims, and each one is a way this could go wrong later:
//   1. the final card presents NO refusal control, and no control on it can file one;
//   2. the NON-final path is byte-identical – every offer she may still answer is untouched;
//   3. the line is HERS, pinned through the engine's exported symbol rather than a copied string;
//   4. the house law holds in the rendered interface: no Cyrillic, no long dash.
//
// ⚠ MOUNTED, NOT SOURCE-PINNED (CLAUDE.md's own gotcha). A source pin on this card would go green
// against a template that renders nothing.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { LAST_WORD_OPENING, lastWordLine } from '../../src/engine/ending'
import { LAST_OFFER_NOT_A_QUESTION, answerRetirement, createWorld } from '../../src/engine/world'
import type { RetirementOffer, Snapshot } from '../../src/shared/protocol'

function showOffer(offer: RetirementOffer, over: Record<string, unknown> = {}): void {
  const game = useGameStore()
  game.$patch({
    snapshot: {
      ageYears: 41,
      week: 1453,
      kidRank: 88,
      fundsCents: 1234_00,
      oneMoreYearCount: 0,
      careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
      retirementOffer: offer,
      ...over,
    } as unknown as Snapshot,
  })
}

const AGE: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: false }
const PLATEAU: RetirementOffer = { askedWeek: 700, seasonIndex: 12, reason: 'plateau', final: false }
const FINAL: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: true }

/** Rendered text with the template's own indentation collapsed – what a reader sees, not how the
 *  `.vue` file happens to be wrapped. */
const said = (text: string): string => text.replace(/\s+/g, ' ').trim()

describe('the last offer is hers', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ===============================================================================================
  // 1. NO REFUSAL CONTROL, AND NO CONTROL THAT CAN FILE ONE
  // ===============================================================================================
  //
  // ⚠ TWO ASSERTIONS AND NOT ONE, because counting the buttons is the weaker half. A card that drew
  // one control wired to `answer(false)` would pass a count and would be the exact defect: it would
  // file «One more year, she said» against a career whose card never offered those words. So every
  // control that IS there is pressed, and what it files is read off the store.
  it('⚠ the FINAL offer presents no refusal control, and every control on it acknowledges', async () => {
    const answers: boolean[] = []
    const store = useGameStore()
    store.answerRetirement = async (retire: boolean) => void answers.push(retire)
    showOffer(FINAL, { oneMoreYearCount: 4 })

    const w = mount(RetirementDialog)
    const controls = w.findAll('.retire-answer')
    expect(controls, 'the last offer drew more than one control').toHaveLength(1)
    for (const c of controls) await c.trigger('click')
    expect(answers, 'a control on the final card filed a refusal').toEqual([true])
    w.unmount()
  })

  // ⚠ AND FROM OUTSIDE THE CARD IT IS STILL REFUSED, LOUDLY. The worker is not the gate (invariant
  // 1), so a hand-built message or a poked save can put `retire: false` against a final offer with
  // no card involved at all. The throw that used to mean «she may not refuse» means «there is
  // nothing here to answer» now, and it is the only thing standing between that message and a
  // career that records a year she never asked for.
  it('⚠ ...and a refusal that never came from the card is refused by the engine', () => {
    const world = createWorld('last-word-guard')
    world.retirementOffer = { ...FINAL }
    expect(() => answerRetirement(world, false)).toThrow(LAST_OFFER_NOT_A_QUESTION)
    expect(world.oneMoreYearCount).toBe(0)
    expect(world.retirementOffer, 'the refused command still cleared the offer').not.toBeNull()
    expect(world.ending, 'the refused command ended the career instead').toBeNull()
  })

  // ===============================================================================================
  // 2. THE NON-FINAL PATH IS BYTE-IDENTICAL
  // ===============================================================================================
  //
  // ⚠ LITERALS ARE CORRECT HERE AND NOWHERE ELSE IN THIS FILE. Every other assertion goes through a
  // symbol so a re-wording moves it; this one is a BYTE-IDENTITY claim about copy the step promised
  // not to touch, so the bytes are the assertion. If a future wave genuinely re-words the offers she
  // can still answer, this test is supposed to go red and be re-aimed deliberately.
  // ⚠⚠ RE-AIMED AT ROUND 30 #7 – THE FUTURE WAVE THE NOTE ABOVE PREDICTED, AND EXACTLY ONE LINE OF
  // THIS ARM MOVED. The owner asked for this lede and only this lede: «попап "теперь каждый год
  // начиная с 29 лет" звучит как механический приговор безысходности». The heading, the kicker and
  // both controls are the bytes step 4 promised not to touch and are unchanged, which is the whole
  // reason they are still written out here – a re-aim that rewrote the arm would stop being the
  // guard the note describes.
  it('⚠ every offer she may still answer is untouched – the age reading, to the byte', () => {
    showOffer(AGE, { ageYears: 30 })
    const w = mount(RetirementDialog)
    expect(said(w.get('.retire-kicker').text())).toBe('Off-season – she is 30')
    expect(said(w.get('.retire-title').text())).toBe('Is there another year in this?')
    expect(said(w.get('.retire-lede').text())).toBe(
      'Twenty-nine is when the question starts being asked, not a countdown to anything. There is no wrong answer, and she can say no for as many winters as her body gives her.',
    )
    const controls = w.findAll('.retire-answer')
    expect(controls).toHaveLength(2)
    expect(said(controls[0].get('strong').text())).toBe('That is enough')
    expect(said(controls[0].get('span').text())).toBe('She stops here, on her own terms.')
    expect(said(controls[1].get('strong').text())).toBe('One more year')
    expect(said(controls[1].get('span').text())).toBe('The same answer she gave last winter.')
    w.unmount()
  })

  it('⚠ ...and the plateau reading, to the byte – a mid-career question is not a body-driven one', () => {
    showOffer(PLATEAU, {
      ageYears: 26,
      activeLadder: 'wta',
      ladders: { domestic: { rank: 5, points: 300 }, itf: { rank: 84, points: 0 }, wta: { rank: 106, points: 420 } },
    })
    const w = mount(RetirementDialog)
    expect(said(w.get('.retire-title').text())).toBe('She said it in the car.')
    expect(said(w.get('.retire-lede').text())).toBe(
      'Three seasons on the professional table and it has not moved. If she cannot reach the top, she would rather go now – that is how she put it. She will keep playing if you want her to.',
    )
    expect(w.findAll('.retire-answer')).toHaveLength(2)
    w.unmount()
  })

  // ⚠ AND THE NON-FINAL CARD FILES BOTH ANSWERS, WHICH IS THE HALF A COPY PIN CANNOT SEE. The step
  // rewired the shared control's LABEL through a computed; if that had also rewired what it files,
  // every assertion above would still pass.
  it('⚠ ...and both of its answers still reach the engine, unchanged', async () => {
    const answers: boolean[] = []
    const store = useGameStore()
    store.answerRetirement = async (retire: boolean) => void answers.push(retire)
    showOffer(AGE, { ageYears: 30 })

    const w = mount(RetirementDialog)
    const controls = w.findAll('.retire-answer')
    await controls[0].trigger('click')
    await controls[1].trigger('click')
    expect(answers).toEqual([true, false])
    w.unmount()
  })

  // ===============================================================================================
  // 3. THE LINE IS HERS, AND IT IS THE ENGINE'S OWN SENTENCE
  // ===============================================================================================
  //
  // ⭐ `oneMoreYearCount` IS THE RICHEST STATE ON THIS CARD and nothing rendered it before: a woman
  // who has said «one more year» four times is telling a different story from one who never had to.
  // Three counts, three different sentences, all of them the engine's – so the card cannot drift
  // from the feed line and the epilogue, which render the same string.
  it('⭐ the lede IS the engine\'s line, and it reads her state', () => {
    for (const n of [0, 1, 4]) {
      showOffer(FINAL, { oneMoreYearCount: n })
      const w = mount(RetirementDialog)
      expect(said(w.get('.retire-lede').text()), `count ${n}`).toBe(lastWordLine(n))
      expect(w.get('.retire-lede').text(), `count ${n}: the opening is not hers`).toContain(LAST_WORD_OPENING)
      w.unmount()
    }
  })

  it('⭐ ...and the count really is spent – 0, 1 and 4 are three different sentences', () => {
    const lines = [0, 1, 4].map((n) => lastWordLine(n))
    expect(new Set(lines).size, 'the count is on the card but not in the sentence').toBe(3)
    expect(lines[0], 'a poked save with no count prints "one more year 0 times"').not.toContain('one more year 0')
    expect(lines[1], 'the singular is not singular').toContain('one more year 1 time,')
    expect(lines[2]).toContain('one more year 4 times,')
  })

  // ⚠ AND WHAT THE LINE MAY NOT SAY, MEASURED RATHER THAN GUESSED – the whole argument is on
  // `LAST_WORD_OPENING` in src/engine/ending.ts and the spec's §6.7. The proposed line was «she did
  // not come back from the winter»; step 3 measured that FALSE (she opens her last seasons at
  // 83/84/90/91/93/97 as she ages, BETTER not worse), and her body's share is a function of her age
  // alone, so nothing may read as "she wore out faster" or "you did this to her".
  //
  // ⚠ THIS IS A TRIPWIRE AND NOT A SPELL-CHECK. It cannot prove a sentence is honest; it can stop
  // the four specific words whose measured claim is false from being written back in by somebody
  // who has not read the spec. If a mechanism ever lands that makes fatigue true at the end, this
  // goes red and gets re-aimed at what was measured then, rather than deleted.
  it('⚠ her line claims nothing the engine cannot keep – no fatigue, no blame', () => {
    for (const n of [0, 1, 4]) {
      const line = lastWordLine(n).toLowerCase()
      for (const forbidden of ['tired', 'exhaust', 'worn out', 'wore out', 'did not come back', 'too old']) {
        expect(line, `count ${n}: "${forbidden}" is a claim the walk measured false`).not.toContain(forbidden)
      }
      // ⚠ «Мы ни за что не наказываем» – the line is hers and it is neutral about whether the career
      // was good. It may not grade her and it may not read as a verdict on the player's management.
      for (const forbidden of ['should have', 'you could have', 'wasted', 'never quite', 'if only']) {
        expect(line, `count ${n}: "${forbidden}" grades somebody`).not.toContain(forbidden)
      }
    }
  })

  // ===============================================================================================
  // 4. THE HOUSE LAW, IN THE RENDERED INTERFACE
  // ===============================================================================================
  //
  // ⚠ NO CYRILLIC IN USER-FACING TEXT and NO LONG DASH, both absolute. The comments in this repo
  // quote the owner in Russian on purpose and must go on being allowed to; what may never carry a
  // Cyrillic character is what a player reads. So the check is aimed at RENDERED text and at the
  // engine's exported sentences, never at source files.
  //
  // ⚠⚠ AND IT IS NOT A DUPLICATE OF `tests/template-copy-rules.test.ts` – IT IS THE HOLE THAT TEST
  // CANNOT SEE, OPENED BY THIS VERY STEP. That guard scans the `<template>` block of every `.vue`
  // file, which was the whole rendered surface while every sentence lived in a template. Her line
  // does not: it is written in `src/engine/ending.ts` and INTERPOLATED, so the template carries
  // `{{ lastWord }}` and a Cyrillic character in the engine's copy would render to a player with
  // the file-scanning guard green. Same two rules, aimed at where the words actually are now.
  const CYRILLIC = /[Ѐ-ӿ]/
  const LONG_DASH = /[—―]/

  it('⚠ no Cyrillic and no long dash in her line, at any count', () => {
    for (const n of [0, 1, 4, 17]) {
      const line = lastWordLine(n)
      expect(CYRILLIC.test(line), `count ${n}: Cyrillic in her line – ${line}`).toBe(false)
      expect(LONG_DASH.test(line), `count ${n}: a long dash in her line – ${line}`).toBe(false)
    }
    expect(CYRILLIC.test(LAST_WORD_OPENING)).toBe(false)
    expect(LONG_DASH.test(LAST_WORD_OPENING)).toBe(false)
    // ...and the refusal, which reaches a toast through the worker's error channel.
    expect(CYRILLIC.test(LAST_OFFER_NOT_A_QUESTION)).toBe(false)
    expect(LONG_DASH.test(LAST_OFFER_NOT_A_QUESTION)).toBe(false)
  })

  it('⚠ ...and none anywhere on the card, on any of the three readings it draws', () => {
    for (const [name, offer, over] of [
      ['final', FINAL, { oneMoreYearCount: 4 }],
      ['age', AGE, { ageYears: 30 }],
      ['plateau', PLATEAU, { ageYears: 26 }],
    ] as const) {
      showOffer(offer, over)
      const w = mount(RetirementDialog)
      const text = w.text()
      expect(CYRILLIC.test(text), `${name}: Cyrillic on the card – ${text}`).toBe(false)
      expect(LONG_DASH.test(text), `${name}: a long dash on the card – ${text}`).toBe(false)
      // ⭐ NOT A VACUOUS PASS – the card really did render, and the short dash really is the one in
      // use (the kicker's «Off-season – she is 41»), so a test that saw an empty string would fail.
      expect(text).toContain('–')
      w.unmount()
    }
  })
})
