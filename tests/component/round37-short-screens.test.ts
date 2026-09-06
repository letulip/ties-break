// ⭐⭐⭐ ROUND 37, 06.09 – THE TWO RULES A SHORT SCREEN BREAKS, MOUNTED.
//
// His two items of that morning are one subject seen twice: a window that is WIDE ENOUGH for the
// rebuilt tablet/desktop interface and NOT TALL ENOUGH for it. His words are in
// `docs/rounds/round-37.md` and, in the original, beside each rule; nothing here restates a sentence
// of his in Cyrillic, the same habit round36-review-home.test.ts states in its own header.
//
//   * the live match's grid squeezed its own first row under the panel's content and the panel –
//     an `overflow: hidden` photo Card – clipped the difference, with no scroller left anywhere in
//     the chain to reach it;
//   * the prologue's choice buttons sat in two columns and, on the desktop band, against the very
//     bottom edge of the painting.
//
// ⚠⚠ WHAT THIS LAYER CAN AND CANNOT SAY, and for this defect the line matters more than usual.
// happy-dom parses CSS and does NO layout: it can read a declared track list through the real
// cascade, and it can never tell you that a track collapsed. So the two claims are split by
// instrument rather than by taste – the RULES are here, and the GEOMETRY they produce is measured in
// a real Chromium by `e2e/responsive.spec.ts`, which is where the 81px and the 0px live. Neither
// file is the whole claim; a rule with no measurement is a hope, and a measurement with no rule goes
// green again the moment somebody re-words the sheet.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read. happy-dom evaluates a media query on an
// element's FIRST computed-style read and caches it (fits.ts says so beside `TABLET`).
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import PrologueCard from '../../src/components/PrologueCard.vue'
import { PROLOGUE_CARDS } from '../../src/prologue/cards'
import { EMPTY_RUN, cardFor, moodAt, warmthAt } from '../../src/prologue/run'
import { OPENING_IDENTITY } from '../../src/prologue/identity'
import { readFileSync } from 'node:fs'
import { after } from '../helpers/source'
import { DESKTOP, PHONE, setViewport, type Viewport } from './fits'

/** ⭐ THE PLATEAU, which neither `TABLET` nor `DESKTOP` reaches. His ladder fixes the tablet layout
 *  at 900 and centres it from 901 to 1023 (docs/specs/responsive-2026-09.md), and both items below
 *  are rules that start at 768 – so a band nobody measures is a band where one of them could be off
 *  and every arm here would still be green. */
const PLATEAU: Viewport = { width: 900, height: 620 }

/** ⚠ SHORT, AND THAT IS THE WHOLE SUBJECT. `TABLET` is 768x1024 and `DESKTOP` is 1280x800 – both
 *  tall enough that the defect this file is about does not appear at all. The declared rules do not
 *  depend on the height, so the arms below can use either; naming these makes it impossible to read
 *  the file as claiming the fit was measured here, which it was not. */
const SHORT_TABLET: Viewport = { width: 768, height: 640 }

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

function css(selector: string): CSSStyleDeclaration {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`nothing matches ${selector} – the measurement below would be vacuous`)
  return getComputedStyle(el)
}

/** ⚠ A PLAIN VARIABLE AND NEVER AN INLINE LITERAL – Vite rewrites `new URL('…', import.meta.url)`
 *  into its own asset resolver and the result is not a `file:` URL under this runner. Same helper,
 *  same reason, as the three round-36 files. */
function sfc(rel: string): string {
  return readFileSync(new URL(rel, import.meta.url), 'utf8')
}

let wrapper: VueWrapper | null = null

beforeEach(() => {
  setActivePinia(createPinia())
  assertSheetPresent()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

/** The age-5 card, which is the one that carries FOUR controls in its answer column – three family
 *  origins and the way out of the prologue. A card with one answer cannot tell a column from a grid,
 *  which is the vacuous-arm trap this round keeps writing down. */
function mountFirstCard(vp: Viewport): VueWrapper {
  setViewport(vp)
  const card = cardFor(PROLOGUE_CARDS[0].age, EMPTY_RUN)
  return mount(PrologueCard, {
    attachTo: document.body,
    props: {
      card,
      warmth: warmthAt(card.age, EMPTY_RUN),
      mood: moodAt(card.age, EMPTY_RUN),
      identity: { ...OPENING_IDENTITY },
    },
  })
}

// =================================================================================================
// ITEM 2 – «не в 2 колонки, а посередине просто одну под другой»
// =================================================================================================
//
// ⚠ MUTATION-VERIFIED. Putting `display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`
// back into PrologueCard.vue's 768 block reddens the tablet, plateau and desktop arms on `display`;
// deleting `width: 100%` from the same rule reddens the desktop arm's `width`; and taking the 14px
// off `.prologue-card > .prologue-hero.prologue-hero` in the 1024 block reddens the last arm.

describe('round 37 #2 – the prologue’s choices are one centred column at every width', () => {
  it('⭐ on a phone NOTHING moves: the column is the card, uncapped and unindented', () => {
    wrapper = mountFirstCard(PHONE)
    const answers = css('.prologue-answers')
    expect(answers.display, 'the phone column became something else').toBe('flex')
    expect(answers.flexDirection, 'the phone answers stopped stacking').toBe('column')
    // ⚠ THE NEGATIVE IS THE POINT. The 768 rule caps and centres; if it ever leaked below its own
    // media query the phone's buttons would go from the card's width to 500 and gain two margins,
    // which is precisely what «below 768 nothing may move» forbids.
    // (happy-dom returns `''` for a property nothing declares, where a browser returns `none`;
    // either answer is «the cap is not on», and naming both is cheaper than a shim.)
    expect(['', 'none'], 'the 500 cap reached the phone').toContain(answers.maxWidth)
    expect(answers.marginLeft, 'the phone answers gained a margin').not.toBe('auto')
    expect(answers.marginRight, 'the phone answers gained a margin').not.toBe('auto')
  })

  for (const [name, vp] of [
    ['a tablet', SHORT_TABLET],
    ['the 901–1023 plateau', PLATEAU],
    ['a desktop', DESKTOP],
  ] as const) {
    it(`⭐⭐ on ${name} the answers are ONE column, capped at his 500 and centred`, () => {
      wrapper = mountFirstCard(vp)
      const answers = css('.prologue-answers')
      expect(answers.display, 'the answers went back to two to a row').toBe('flex')
      expect(answers.flexDirection, 'the answers stopped stacking').toBe('column')
      // #18, and it is the half of the old rule that survived his 06.09 correction:
      // «кнопок в 700 пикселей не должно быть, максимум 500».
      expect(answers.maxWidth, 'his cap is not on the answer column').toBe('500px')
      // «посередине» – and the two longhands rather than `margin-inline`, because happy-dom does not
      // expand the logical shorthand and a centring no test can see is one the next wave deletes.
      expect(answers.marginLeft, 'the column is not centred').toBe('auto')
      expect(answers.marginRight, 'the column is not centred').toBe('auto')
      // ⚠ AND THE DEFINITE WIDTH, WITHOUT WHICH THE CAP IS A LIE ON A DESKTOP: past 1024 this
      // element is a grid item, and a grid item with auto inline margins does not stretch – it falls
      // back to max-content and the margins centre whatever is left. Measured in Chromium before
      // this line existed: 105px of button on the age-6 card at 1280.
      expect(answers.width, 'the column has no width to cap').toBe('100%')
    })
  }

  it('⭐⭐⭐ and on a desktop the painting no longer has the decision resting on its bottom edge', () => {
    wrapper = mountFirstCard(DESKTOP)
    // The card's rhythm is each block's own `margin-bottom` (`row-gap: 0` two rules up), and the
    // picture was the one block given none – so on every card where the picture is the taller of the
    // two columns the first answer began at the painting's last pixel. Measured in Chromium at
    // 1024x620 and 1280x600 alike: gap 0.
    const hero = css('.prologue-hero')
    expect(hero.gridColumn, 'the painting left the first column').toBe('1')
    expect(hero.marginBottom, 'the answers still rest on the painting').toBe('14px')
    // …and it is the band above's own number rather than a new one.
    const tablet = sfc('../../src/components/PrologueCard.vue')
    expect(tablet, 'the tablet band stopped spelling the 14 this borrows').toContain('margin: 0 auto 14px')
  })

  it('⚠ the answers are still the card’s last element – every fit number in the walk rests on it', () => {
    wrapper = mountFirstCard(DESKTOP)
    const card = document.querySelector('.prologue-card')!
    expect(card.lastElementChild!.className, 'something got below the way out').toContain(
      'prologue-answers',
    )
  })
})

// =================================================================================================
// ITEM 1 – the live match's two rows, and neither may be squeezed below what is in it
// =================================================================================================
//
// ⚠⚠ THIS ARM IS A SOURCE PIN AND SAYS SO, WHICH IS THE OPPOSITE OF THIS REPOSITORY'S USUAL ADVICE
// («prefer a mounted test to a source pin»). The reason is stated rather than assumed: the defect is
// a GRID TRACK COLLAPSING, and happy-dom has no grid – mounting the viewer here would read back
// whatever string the sheet declares and prove nothing about a track. The behavioural claim is
// `e2e/responsive.spec.ts`'s, in a real browser, at five viewports. What this pin buys is the one
// thing the browser suite cannot: it names the two keywords, so a well-meaning tidy-up back to
// `auto minmax(0, 1fr)` fails HERE, in the unit gate, instead of only in the e2e gate.
describe('round 37 #1 – the match grid’s rows keep the size of what is in them', () => {
  it('⚠ row 1 is `max-content` and row 2 floors at `auto`, past 768', () => {
    // ⚠ `after()` AND NEVER A RAW `indexOf` SLICE (CLAUDE.md's own gotcha, and `npm run pins:check`
    // is the ratchet): the helper THROWS on an absent marker, where the raw form silently widens the
    // region to the whole file and leaves the pin green.
    const at768 = after(sfc('../../src/components/MatchViewer.vue'), '@media (min-width: 768px)')
    expect(
      at768,
      'the panel row can be squeezed under its own content again – `auto` falls back to the item’s minimum, and an `overflow: hidden` photo Card’s minimum is zero',
    ).toContain('grid-template-rows: max-content minmax(auto, 1fr);')
  })
})
