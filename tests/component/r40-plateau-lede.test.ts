// ⭐⭐⭐ ROUND 39 #14a – THE PLATEAU CARD RENDERS THE BAND, ON A MOUNTED CARD.
//
// THE OWNER, 08.09: «„She said it in the car. Three seasons on the professional table and it has not
// moved…" – одно и то же опять, давай какую-то вариативность в этих фразах сделаем». `plateauLede`
// (src/engine/ending.ts) is the four sentences and `tests/r40-plateau-lede.test.ts` proves the
// function. This file proves the CARD: that the sentence reaches a player, that it is picked by her
// own `oneMoreYearCount`, and that the other two readings this card draws did not move.
//
// ⚠ MOUNTED, NOT SOURCE-PINNED (CLAUDE.md's own gotcha, and `last-word.test.ts`'s header): a source
// pin on this card would go green against a template that renders nothing at all.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { lastWordLine, plateauLede } from '../../src/engine/ending'
import { assertDismissReachable, measureDialog, setViewport, PHONE } from './fits'
import type { RetirementOffer, Snapshot } from '../../src/shared/protocol'
// ⚠ THE APP'S OWN SHEET, or §4's fit is vacuous: `.dialog-overlay` and `.dialog-card` live in
// src/style.css, and `fits.ts` measures through the REAL cascade rather than a model of it. Without
// this import the overlay computes `position: ''` and `measureDialog` refuses to guess.
import '../../src/style.css'

const PLATEAU: RetirementOffer = { askedWeek: 700, seasonIndex: 12, reason: 'plateau', final: false }
const AGE: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: false }
const FINAL: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: true }

/** The professional table, which is what `activeLadderOfSnapshot` resolves off these three rows –
 *  the same fixture `last-word.test.ts` and `endings-ui.test.ts` use for the plateau card. */
const ON_TOUR = {
  activeLadder: 'wta',
  ladders: { domestic: { rank: 5, points: 300 }, itf: { rank: 84, points: 0 }, wta: { rank: 106, points: 420 } },
}

function showOffer(offer: RetirementOffer, over: Record<string, unknown> = {}): void {
  useGameStore().$patch({
    snapshot: {
      ageYears: 26,
      week: 700,
      kidRank: 106,
      fundsCents: 1234_00,
      oneMoreYearCount: 0,
      physicalShare: 1,
      careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
      retirementOffer: offer,
      ...ON_TOUR,
      ...over,
    } as unknown as Snapshot,
  })
}

/** Rendered text with the template's own indentation collapsed – `last-word.test.ts`'s own helper. */
const said = (text: string): string => text.replace(/\s+/g, ' ').trim()

/** The lede the card draws for a career that has already said «one more year» `n` times. */
function ledeAt(n: number, over: Record<string, unknown> = {}): string {
  showOffer(PLATEAU, { oneMoreYearCount: n, ...over })
  const w = mount(RetirementDialog)
  const text = said(w.get('.retire-lede').text())
  w.unmount()
  return text
}

describe('round 39 #14a – the plateau card says something different each time', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ===============================================================================================
  // 1. THE CARD RENDERS THE BAND, AND IT IS THE ENGINE'S OWN SENTENCE
  // ===============================================================================================
  //
  // ⚠ THROUGH THE SYMBOL, NOT A SPELLING – `lastWordLine`'s precedent, and the reason the copy lives
  // in the engine: a re-wording moves the assertion with it, while a card that stopped rendering the
  // band would go red here whatever the words were.
  it('⭐ every band reaches the card, picked by her own count', () => {
    for (const n of [0, 1, 2, 3, 7]) {
      expect(ledeAt(n), `count ${n}`).toBe(plateauLede(n, 'professional'))
    }
  })

  it('⭐ ...and they really are four different paragraphs on screen', () => {
    // The item itself: «одно и то же опять». Five counts, five rendered sentences, four shapes.
    const rendered = [0, 1, 2, 3, 7].map((n) => ledeAt(n))
    expect(new Set(rendered).size, 'the card repeated itself at two different counts').toBe(5)
    expect(rendered[3]).not.toBe(rendered[4])
  })

  it('⚠⚠ band 0 is the shipped sentence on the rendered card, byte-identical', () => {
    // Invariant 4 – the owner's copy. The same literal `last-word.test.ts` has held since round 19,
    // asserted here against the card that now builds it in the engine.
    expect(ledeAt(0)).toBe(
      'Three seasons on the professional table and it has not moved. If she cannot reach the top, she would rather go now – that is how she put it. She will keep playing if you want her to.',
    )
  })

  it('⚠ a snapshot carrying no count at all reads band 0 rather than nothing', () => {
    // Every hand-built snapshot in the older suites is one of these (`endings-ui.test.ts` patches no
    // count), and a poked save is the other. The shipped words are the safe answer.
    showOffer(PLATEAU, { oneMoreYearCount: undefined })
    const w = mount(RetirementDialog)
    expect(said(w.get('.retire-lede').text())).toBe(plateauLede(0, 'professional'))
    w.unmount()
  })

  it('⭐ the rendered number IS `oneMoreYearCount`, not a count of seasons', () => {
    // The drafts said «three more winters» in the open band, which is false at every value but one.
    // What the card prints is her answer count, and it moves with it.
    for (const n of [3, 4, 7, 12]) {
      expect(ledeAt(n), `count ${n}`).toContain(`one more year ${n} times`)
    }
    expect(ledeAt(4), 'the open band froze on one value').not.toContain('one more year 3 times')
  })

  it('⭐ ...and the table it names is HER table, at every band that names one', () => {
    const national = {
      activeLadder: 'domestic',
      ladders: { domestic: { rank: 42, points: 300 }, itf: { rank: null, points: 0 }, wta: { rank: null, points: 0 } },
    }
    for (const n of [0, 3]) {
      expect(ledeAt(n, national), `count ${n}`).toContain('national table')
      expect(ledeAt(n, national), `count ${n}`).not.toContain('professional')
    }
  })

  // ===============================================================================================
  // 2. THE CARD'S OTHER TWO READINGS ARE UNTOUCHED
  // ===============================================================================================
  //
  // ⚠ THE ITEM MOVED ONE PARAGRAPH OF ONE BRANCH. The age lede is the owner's round-30 sentence and
  // the final one is hers (`lastWordLine`); a count high enough to reach the plateau's open band is
  // used on both, because "the wrong branch reads the new copy" is exactly the way this could break.
  it('⚠ the age reading is untouched, at a count that would move the plateau', () => {
    showOffer(AGE, { ageYears: 30, oneMoreYearCount: 7 })
    const w = mount(RetirementDialog)
    expect(said(w.get('.retire-title').text())).toBe('Is there another year in this?')
    expect(said(w.get('.retire-lede').text())).toBe(
      'Twenty-nine is when the question starts being asked, not a countdown to anything. There is no wrong answer, and she can say no for as many winters as her body gives her.',
    )
    expect(w.text(), 'a plateau band leaked onto the age card').not.toContain('looking out of the window')
    expect(w.findAll('.retire-answer')).toHaveLength(2)
    w.unmount()
  })

  it('⚠ ...and so is the final one – it is still her own last word', () => {
    showOffer(FINAL, { ageYears: 41, oneMoreYearCount: 7 })
    const w = mount(RetirementDialog)
    expect(said(w.get('.retire-title').text())).toBe('She told you at the end of the season.')
    expect(said(w.get('.retire-lede').text())).toBe(lastWordLine(7))
    expect(w.text()).not.toContain('looking out of the window')
    expect(w.findAll('.retire-answer'), 'the final card grew a refusal').toHaveLength(1)
    w.unmount()
  })

  it('⚠ the plateau heading and both controls did not move either', () => {
    // Only the lede was asked for. The heading is the same sentence at every band – the escalation
    // is in her words, not in a second card – and the door stays open, which is 14b's business and
    // not this item's.
    for (const n of [0, 1, 2, 3, 7]) {
      showOffer(PLATEAU, { oneMoreYearCount: n })
      const w = mount(RetirementDialog)
      expect(said(w.get('.retire-title').text()), `count ${n}`).toBe('She said it in the car.')
      const controls = w.findAll('.retire-answer')
      expect(controls, `count ${n}: the plateau card stopped offering both answers`).toHaveLength(2)
      expect(said(controls[1].get('strong').text()), `count ${n}`).toBe('One more year')
      expect(w.find('.retire-rung').exists(), `count ${n}: the plateau drew a body rung`).toBe(false)
      w.unmount()
    }
  })

  it('⚠ and both of its answers still reach the engine at every band', async () => {
    // A copy pin cannot see this: the branch that picks the sentence must not touch what the
    // controls file. `answer(true)` retires, `answer(false)` is «one more year» – the very field
    // that picks the band.
    for (const n of [0, 3]) {
      const answers: boolean[] = []
      const store = useGameStore()
      store.answerRetirement = async (retire: boolean) => void answers.push(retire)
      showOffer(PLATEAU, { oneMoreYearCount: n })
      const w = mount(RetirementDialog)
      const controls = w.findAll('.retire-answer')
      await controls[0].trigger('click')
      await controls[1].trigger('click')
      expect(answers, `count ${n}`).toEqual([true, false])
      w.unmount()
    }
  })

  // ===============================================================================================
  // 3. THE HOUSE LAW ON THE RENDERED CARD
  // ===============================================================================================
  const CYRILLIC = /[Ѐ-ӿ]/
  const LONG_DASH = /[—―]/

  it('⚠ no Cyrillic and no long dash anywhere on the card, at any band', () => {
    for (const n of [0, 1, 2, 3, 7]) {
      showOffer(PLATEAU, { oneMoreYearCount: n })
      const w = mount(RetirementDialog)
      const text = w.text()
      expect(CYRILLIC.test(text), `count ${n}: Cyrillic on the card – ${text}`).toBe(false)
      expect(LONG_DASH.test(text), `count ${n}: a long dash on the card – ${text}`).toBe(false)
      // ⭐ NOT A VACUOUS PASS – the card really rendered, and the short dash is the one in use.
      expect(text).toContain('–')
      w.unmount()
    }
  })

  // ===============================================================================================
  // 4. ⭐⭐ THE HOUSE DIALOG RULE – A LENGTHENED CARD STILL FITS A PHONE
  // ===============================================================================================
  //
  // CLAUDE.md's gotcha: «any dialog you add or LENGTHEN gets a mounted assertion that its dismiss
  // control's box is inside a 375x667 viewport», earned by `TourBriefingDialog` shipping 1078px of
  // card into 635px of room on a BLOCKING overlay – and this card blocks the world exactly the same
  // way, with no Escape and no scrim handler. The three new ledes are longer than the shipped one,
  // so the measurement is owed here whether or not it passes easily.
  //
  // ⚠ MEASURED AT THE LONGEST BAND, not at band 0: a fit taken on the shortest sentence would be a
  // green verdict about copy the item did not add.
  it('⭐⭐ the longest band still leaves the answers inside a 375x667 phone', () => {
    setViewport(PHONE)
    // The longest lede this card can now print – proven, not assumed, so a future band that grows
    // past it cannot slip under this measurement.
    const longest = [0, 1, 2, 3, 7, 12].reduce((a, n) =>
      plateauLede(n, 'professional').length > plateauLede(a, 'professional').length ? n : a,
    )
    showOffer(PLATEAU, { oneMoreYearCount: longest })
    const w = mount(RetirementDialog, { attachTo: document.body })
    const card = document.querySelector('.dialog-overlay .retire-card')!
    const answers = document.querySelector('.dialog-overlay .retire-answers')!
    expect(card, 'the card is up – nothing here is vacuous without it').toBeTruthy()
    expect(card.lastElementChild, 'something follows the way out').toBe(answers)
    assertDismissReachable(card, answers, PHONE, `RetirementDialog (plateau, count ${longest})`)

    // ⚠ AND THE MUTATION `fits.ts` ASKS FOR: the content model deliberately UNDER-counts, so a green
    // verdict is only trustworthy because of the content-INDEPENDENT half – the height cap. Strip it
    // off the real card and the same call must go red, or this test cannot fail on the broken
    // version and is not this test.
    ;(card as HTMLElement).style.maxHeight = 'none'
    expect(() => assertDismissReachable(card, answers, PHONE, 'RetirementDialog (cap removed)')).toThrow(
      /declares no height bound/,
    )
    w.unmount()
    document.body.innerHTML = ''
  })

  it('⭐ ...and the card is bounded by the screen and scrolls, whatever the copy grows into', () => {
    setViewport(PHONE)
    showOffer(PLATEAU, { oneMoreYearCount: 7 })
    const w = mount(RetirementDialog, { attachTo: document.body })
    const card = document.querySelector('.dialog-overlay .retire-card')!
    const answers = document.querySelector('.dialog-overlay .retire-answers')!
    const fit = measureDialog(card, answers, PHONE)
    expect(fit.cap).toBeLessThanOrEqual(fit.available.height)
    expect(fit.scrollable, 'the card scrolls, so anything past the fold can still be reached').toBe(true)
    w.unmount()
    document.body.innerHTML = ''
  })
})
