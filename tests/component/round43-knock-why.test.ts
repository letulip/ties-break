// =================================================================================================
// ⭐⭐⭐ ROUND 43 #10 – THE KNOCK WINDOW ANSWERS «WHY», MOUNTED.
// =================================================================================================
//
// The owner, 16.09: «мой первый вопрос – ПОЧЕМУ? мне кажется, в этом окошке можно игроку подсветить,
// что может быть причиной… или хотя бы предложить, на что посмотреть.»
//
// The SENTENCE is the engine's and its four branches are pinned in tests/knock.test.ts §5b, off the
// pure `knockCause`. What only a mounted test can say is the other three things:
//
//   1. the sentence actually reaches the card, VERBATIM and from the engine – a surface that
//      rendered a nicely-worded local string would pass every engine test in the repo;
//   2. the card that says «nothing we did» really is the careful career's and not a constant –
//      asked by building two real prompts and mounting both;
//   3. ⚠⚠ THE CARD STILL FITS A PHONE. This is a BLOCKING overlay with no way out that is not an
//      answer, and round-20 #3 stopped the owner's career on exactly this shape: a dialog grows by
//      one honest sentence at a time and nothing objects until the dismiss control is off the
//      screen. CLAUDE.md's rule is that «any dialog you add or lengthen gets a mounted assertion
//      that its dismiss control's box is inside a 375x667 viewport», and this item LENGTHENS one.
//
// ⚠ MUTATION-VERIFIED – the ARMS table at the foot of the file.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { assertDismissReachable, setViewport, NARROW_PHONE, PHONE } from './fits'
import KnockDialog from '../../src/components/KnockDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { buildKnockPrompt } from '../../src/engine/knock'
import { WEEK_PLAN_PRESETS, type Knock, type Snapshot } from '../../src/shared/protocol'

const KNOCK: Knock = { part: 'hip', sinceWeek: 8, repeat: false, choice: null, untilWeek: 8 }
const REPEATED: Knock = { ...KNOCK, repeat: true }

/** The three careers the four branches live on, built through the REAL `buildKnockPrompt` so that
 *  what the card shows is what a snapshot would have carried.
 *   · grinding  – condition 60 at train 85: fatigue .088 over load .060, the family's .148 on a .100 floor
 *   · hard week – condition 95 at train 85: load .060 over fatigue .011
 *   · careful   – condition 90 at train 60: the two sum to nothing at all */
const PROMPTS = {
  grinding: () => buildKnockPrompt(KNOCK, 'r43-why', 60, WEEK_PLAN_PRESETS.grind),
  hardWeek: () => buildKnockPrompt(KNOCK, 'r43-why', 95, WEEK_PLAN_PRESETS.grind),
  careful: () => buildKnockPrompt(KNOCK, 'r43-why', 90, WEEK_PLAN_PRESETS.light),
  repeated: () => buildKnockPrompt(REPEATED, 'r43-why', 60, WEEK_PLAN_PRESETS.grind),
}

function mountWith(prompt: ReturnType<typeof PROMPTS.grinding>) {
  const game = useGameStore()
  game.$patch({ snapshot: { week: 8, knockPrompt: prompt } as unknown as Snapshot })
  return mount(KnockDialog, { attachTo: document.body })
}

describe('round 43 #10 – the card says why', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('the sentence on the card is the ENGINE`s, verbatim', () => {
    const prompt = PROMPTS.grinding()
    const w = mountWith(prompt)
    const why = w.find('.knock-why')
    expect(why.exists(), 'the card has a row for the answer').toBe(true)
    // ⚠ VERBATIM, not «contains a word from it». The whole reason the copy lives in the engine is
    // that it can be tested there; a surface that paraphrased would put half the sentence beyond
    // every test in tests/knock.test.ts.
    expect(why.text()).toBe(prompt.cause)
    // ...and it is not the coach's opinion restated, which is the one way this row could be
    // redundant rather than new.
    expect(why.text()).not.toBe(prompt.read)
    expect(why.text()).not.toBe(prompt.line)
    w.unmount()
  })

  it('⚠⚠ the careful career is told that nothing it did caused this – and the grinding one is not', () => {
    // «мы ни за что не наказываем» – the rule this item could not ship without, asked of the
    // rendered card rather than of the pure function, because a template is free to drop a field.
    const careful = mountWith(PROMPTS.careful())
    expect(careful.find('.knock-why').text(), 'the careful week').toContain('Nothing we did')
    careful.unmount()
    document.body.innerHTML = ''
    setActivePinia(createPinia())

    const grinding = mountWith(PROMPTS.grinding())
    const said = grinding.find('.knock-why').text()
    expect(said, 'the grinding week names what the family added').toContain('tired')
    expect(said, 'and does not absolve it').not.toContain('Nothing we did')
    grinding.unmount()
  })

  it('the four weeks do not all read the same – the row is a derivation, not a constant', () => {
    const seen = new Set<string>()
    for (const make of [PROMPTS.grinding, PROMPTS.hardWeek, PROMPTS.careful, PROMPTS.repeated]) {
      document.body.innerHTML = ''
      setActivePinia(createPinia())
      const w = mountWith(make())
      seen.add(w.find('.knock-why').text())
      w.unmount()
    }
    // ⚠ FOUR, ON THE SCREEN. §5b-1 proves the engine has four; this proves none of them is lost
    // between the wire and the card.
    expect(seen.size, 'four weeks, four answers').toBe(4)
  })

  it('⚠ no digit on the card, the fog rule the rest of this dialog already keeps', () => {
    for (const make of [PROMPTS.grinding, PROMPTS.hardWeek, PROMPTS.careful, PROMPTS.repeated]) {
      document.body.innerHTML = ''
      setActivePinia(createPinia())
      const w = mountWith(make())
      // He asked for a CAUSE to be named, not for the arithmetic: a card that printed «+8.8%/wk»
      // would turn a decision into a sum that is solved once and clicked through afterwards. And
      // nothing hidden is revealed by the words either - condition is on screen and `plan.train`
      // follows the sessions he sets, so the row only points at what he already has.
      expect(w.find('.knock-why').text(), 'a number leaked onto the card').not.toMatch(/\d/)
      w.unmount()
    }
  })

  it('⚠⚠ ROUND-20 – the longer card still fits a phone, and the Proceed is still reachable', async () => {
    // The card is one row taller than round 42 #8 measured it. This is the same verdict re-taken on
    // the longest of the four sentences, at both phone widths, in the SELECTED state - which is the
    // state the player actually leaves by, and one control taller again.
    const longest = [PROMPTS.grinding, PROMPTS.hardWeek, PROMPTS.careful, PROMPTS.repeated]
      .map((make) => make())
      .sort((a, b) => b.cause.length - a.cause.length)[0]
    for (const vp of [PHONE, NARROW_PHONE]) {
      document.body.innerHTML = ''
      setActivePinia(createPinia())
      setViewport(vp)
      const w = mountWith(longest)
      const card = document.querySelector('.knock-dialog')!
      expect(card.querySelector('.knock-why'), 'the new row is really on the measured card').toBeTruthy()
      ;(document.querySelectorAll<HTMLButtonElement>('button.knock-choice')[1]).click()
      await nextTick()
      const proceed = card.querySelector('.knock-proceed')!
      expect(proceed, 'the way out is up – nothing here is vacuous').toBeTruthy()
      assertDismissReachable(card, proceed, vp, `KnockDialog with the why row (${vp.width}x${vp.height})`)
      w.unmount()
    }
  })

  it('⚠⚠ MUTATION PROOF – strip the card`s height cap and the same assertion goes red', async () => {
    // Round-20's own demand: «prove it by mutating – a test that cannot fail on the too-tall version
    // is not this test». The cap is the shared `.dialog-card`'s, and it is what makes the card safe
    // from THIS sentence and from the next honest one after it.
    setViewport(PHONE)
    const w = mountWith(PROMPTS.careful())
    const card = document.querySelector('.knock-dialog')!
    ;(document.querySelectorAll<HTMLButtonElement>('button.knock-choice')[0]).click()
    await nextTick()
    const proceed = card.querySelector('.knock-proceed')!
    assertDismissReachable(card, proceed, PHONE, 'KnockDialog with the why row (bounded)')
    ;(card as HTMLElement).style.maxHeight = 'none'
    expect(() => assertDismissReachable(card, proceed, PHONE, 'KnockDialog with the why row (unbounded)')).toThrow(
      /declares no height bound|taller than the screen|outside the viewport/,
    )
    w.unmount()
  })
})

// ===========================================================================
// THE ARMS. Each applied to src, this file run, then reverted.
//
//   1. `<p class="knock-why">` deleted from KnockDialog.vue
//      -> RED [5]: every case here except the mutation proof, which cannot find the row either.
//         The shipped state before this item.
//   2. the row hard-coded to a local string instead of `prompt.cause`
//      -> RED [2]: the verbatim case, and «four weeks, four answers» (one constant, one entry).
//   3. `v-if="!prompt.cause.startsWith('Nothing')"` added to the row (the shape a «say nothing by
//      rendering nothing» reading of the rule would produce)
//      -> RED [1]: the careful career finds no row at all. ⭐ RECORDED BECAUSE IT IS THE WRONG
//         READING THE ITEM WARNS ABOUT, in the direction nobody expects: the ledger's «the window
//         has to be able to say NOTHING» means it must be able to say that nothing was their fault,
//         and «the careful row is not a missing answer» is the sentence that settles it.
//   4. `.knock-why` given `margin: 0 0 160px` in style.css (this card lengthened past the phone)
//      -> ⚠⚠ GREEN, AND RECORDED RATHER THAN QUIETLY DROPPED, because «a test that cannot fail on
//         the too-tall version is not this test» (CLAUDE.md, round-20) reads as an accusation here
//         until the reason is written down. It is not a hole: `.dialog-card` carries
//         `max-height: 100%; overflow-y: auto`, so a taller CARD scrolls and the Proceed cannot
//         leave the screen however long the copy gets. `fits.ts`'s own header states this as the
//         contract – «once the card is bounded by the viewport and scrolls, no amount of future copy
//         can push the dismiss control off the screen» – and the content model is deliberately a
//         FLOOR that under-counts. So the load-bearing arm for a card that is being LENGTHENED is
//         arm 5, not this one, and the copy-length arm belongs to the day somebody removes the cap.
//   5. the height cap removed from `.dialog-card` (`max-height: 100%` deleted from src/style.css)
//      -> RED [2]: the round-20 fit case at both phone widths, and the mutation proof's bounded
//         half. ⭐ THIS IS THE ARM THAT PROVES THE FIT CASES ARE REAL, and it was run against src
//         rather than only through the in-test `style.maxHeight = 'none'` above, because the in-test
//         form mutates ONE element's inline style and this one deletes the rule the whole dialog
//         family depends on.
// ===========================================================================
