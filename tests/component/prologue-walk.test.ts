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
import { assertDismissReachable, boxOf, lengthPx, measureDialog, setViewport, PHONE, NARROW_PHONE } from './fits'
import PrologueCardView from '../../src/components/PrologueCard.vue'
import { WELCOME_AGES, prologueArtUrl } from '../../src/art/prologue'
import { PROLOGUE_CARDS, TWELFTH_WANTS_MORE, type PrologueCard } from '../../src/prologue/cards'
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
      // ⭐ PHASE 7 – THE PICTURE, and it is passed exactly where the container passes it. `mood` is
      // required on the component precisely so a mount that forgot it cannot compile: a card with no
      // painting is a quarter of a screen of height this file would otherwise never measure.
      mood: moodAt(card.age, run),
      reason: card.age === 12 ? readTwelfth(run).reason : undefined,
      // ⚠⚠ THE IDENTITY IS PASSED EXACTLY WHERE THE CONTAINER PASSES IT, and leaving it out was the
      // easy way to make this whole file lie. `ChildhoodPrologue.vue` hands the prop to every card
      // and the age-5 row is the only one that draws it (`card.identity`), so a mount without it
      // measures a five-year-old's card that has no name field, no birthday and no country picker on
      // it – the tallest card in the walk, measured short. The fit numbers below are only about the
      // card the player meets because this line is here.
      identity: { ...OPENING_IDENTITY },
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

  // ⭐⭐ THE CARD THE OWNER'S 02.09 CORRECTION MADE THE TALLEST IN THE WALK, MEASURED BY NAME rather
  // than left to the loop above to happen to cover. The five now carries her name, her family name,
  // her birthday and the country picker's three views on top of a scene, two read lines, three
  // origins and the way out – and CLAUDE.md's round-20 #3 rule is about exactly this shape: «a
  // dialog grows by one honest sentence at a time and nothing objects until it is taller than a
  // phone». The number is printed rather than only asserted, because how MUCH taller it got is a
  // product question for the owner and an assertion cannot ask it.
  it('⚠ the age-5 card still hands the player its answers, with the identity on it', () => {
    const { wrapper, el, answers } = mountCard(PROLOGUE_CARDS[0], EMPTY_RUN, PHONE)
    expect(document.querySelector('.prologue-identity'), 'the identity is on the five').toBeTruthy()
    // ⭐ PHASE 7 – THE PICKER OPENS CLOSED, so what is on the card is her country and the way in.
    expect(document.querySelectorAll('.prologue-tile').length, 'closed, it is one country').toBe(1)
    expect(document.querySelector('.prologue-browse'), 'and the wizard\'s own way into the list').toBeTruthy()
    const fit = assertDismissReachable(el, answers, PHONE, 'age 5 with the identity')
    // eslint-disable-next-line no-console
    console.log(
      `\n  THE AGE-5 CARD AT 375x667: content floor ${fit.contentFloor.toFixed(0)}px, ` +
        `card ${fit.cardWidth.toFixed(0)}x${fit.cardHeight.toFixed(0)}, ${fit.available.height.toFixed(0)}px of room, ` +
        `${(fit.contentFloor / fit.available.height).toFixed(1)} screens of scroll\n`,
    )
    wrapper.unmount()
  })

  // ⭐⭐⭐ AND IT CAME DOWN, WHICH IS A CEILING AND NOT A PRINTOUT (phase 7).
  //
  // THE OWNER, 02.09: «Это первое прикосновение к игре, оно должно быть "вау! интересно!"» – and
  // what he met instead was a form. The card the p6 identity slice left behind measured 2301px of
  // content against 635px of room on this instrument, 3.6 screens of scroll before the three origins.
  //
  // ⚠⚠ THE INSTRUMENT OVER-COUNTS THIS PARTICULAR CARD AND THE NUMBER IS STILL THE ONE TO ASSERT ON.
  // `fits.ts` documents itself as a FLOOR that «UNDER-COUNTS AND NEVER OVER-COUNTS», and on two of
  // this card's controls that is false, because happy-dom does no layout: a `<select>` stacks its
  // OPTIONS (the month/day pair modelled at 962px against a real 47px) and a `grid` stacks its cells
  // in one column (the nine-tile picker at 523px against a real 190px). Measured against a real
  // headless Chromium at 375x667 the same card was 1115px, not 2301. Both numbers are recorded in
  // docs/specs/childhood-prologue-build-2026-09.md §8c; the ceiling here is on the MODEL because it
  // is the model that runs on every commit, and the browser's own number is asserted in
  // e2e/prologue.spec.ts where a real layout exists to measure.
  //
  // ⚠ THE CEILING IS MEASURED, NOT GUESSED – the same rule e2e/responsive.spec.ts states for its
  // own – AND IT WAS RE-MEASURED IN PHASE 8, upward, which is a decision and not a slip.
  //
  //   phase 7 shipped     1940px   16:9 hero, closed country picker
  //   phase 8 measures    2058px   and the delta is three of the owner's own 02.09 corrections:
  //                                +118  the hero is SQUARE now («я просил арты делать в квадратном
  //                                      формате по аналогии с home экраном»), which on this
  //                                      instrument is the card's 311px content width against the
  //                                      193px the 16:9 box declared;
  //                                 +48  the question above the three origins («вообще непонятно к
  //                                      чему они, потому что вопроса нет»);
  //                                 -48  the country slot and `Browse all countries` share a line.
  //
  // 2200 leaves ~140px of headroom, which is a sentence or two of his own copy at this width – the
  // same margin the 2100 ceiling was set with, and still 240px under the 2301px form phase 6 left.
  // MUTATION-VERIFIED: reopening the country picker (`tiles` returning POPULAR_COUNTRIES when
  // closed) reddens this and the tile count above.
  // ⚠ AND ONE THING THIS INSTRUMENT CANNOT SEE, SAID PLAINLY RATHER THAN CLAIMED: putting the two
  // name fields back in a column (`.prologue-names` set to `display: block`) does NOT redden it.
  // The model has no grid – it stacks a grid's cells in one column – so a row and a column measure
  // identically here, even though the browser saves 69px. The same blindness now covers the country
  // row, which is a flex row of two: the model reads a row as its tallest item, so it DOES see that
  // one. Both halves are asserted where a layout exists in e2e/prologue.spec.ts.
  it('⭐ and the age-5 card is SHORTER than the form phase 6 left, painting included', () => {
    const { wrapper, el, answers } = mountCard(PROLOGUE_CARDS[0], EMPTY_RUN, PHONE)
    const fit = measureDialog(el, answers, PHONE)
    expect(
      fit.contentFloor,
      'the age-5 card has grown back past the form it was cut down from',
    ).toBeLessThanOrEqual(2200)
    // ⚠ AND THE COUNTRY FIELD IS THE PART THAT MOVED, asserted on its own so a future card that
    // grew somewhere ELSE cannot hide under the total. It was 631px on this instrument with the
    // nine tiles open; closed it is one tile and the way in.
    const country = [...document.querySelectorAll('.prologue-identity .prologue-field')].at(-1)!
    expect(country.querySelector('.prologue-tiles'), 'the last identity field is the country').toBeTruthy()
    expect(boxOf(country, 307).h, 'the country picker is open on the card again').toBeLessThanOrEqual(150)
    wrapper.unmount()
  })

  // ⭐⭐ THE QUESTION IS ON SCREEN, AND IT IS THE LAST THING SAID BEFORE THE ANSWERS (owner, 02.09:
  // «у нас есть 3 выбора перед игроком, и вообще непонятно к чему они, потому что вопроса нет»).
  // Asserted by POSITION as well as by presence, because a question that renders above the picture
  // answers nothing – it has to be the line the player's eye leaves before it reaches the buttons.
  // MUTATION-VERIFIED: moving the `p` above `.prologue-lede` reddens the ordering arm; deleting the
  // `v-if` block reddens the first.
  it('⭐⭐ the three origins are asked for – the question sits immediately above them', () => {
    const { wrapper, el } = mountCard(PROLOGUE_CARDS[0], EMPTY_RUN, PHONE)
    const q = document.querySelector('.prologue-question')
    expect(q, 'the five offers three answers to no question').toBeTruthy()
    expect(q!.textContent).toBe(PROLOGUE_CARDS[0].question)
    const kids = [...el.children]
    expect(kids.indexOf(q!), 'the question is not a child of the card').toBeGreaterThan(-1)
    expect(kids.indexOf(q!) + 1, 'something got between the question and the answers').toBe(
      kids.indexOf(document.querySelector('.prologue-answers')!),
    )
    wrapper.unmount()
    // ...and the eight, whose title IS its question, does not grow a second voice.
    const eight = walk(CARRIED_ROAD, 'middle').find((x) => x.card.age === 8)!
    const w = mountCard(eight.card, eight.run, PHONE)
    expect(document.querySelector('.prologue-question')).toBeNull()
    w.wrapper.unmount()
  })

  // ⭐ THE COUNTRY AND THE WAY INTO THE LIST SHARE A LINE (owner, 02.09: «Browse all countries и сам
  // слот выбранной страны давай сделаем на одной строчке тоже»).
  //
  // ⚠ ASSERTED THROUGH THE REAL CASCADE, not on a class name: `getComputedStyle` is live in this
  // project, so this reads the flex row the browser would build. Two controls, one row, and the
  // measurement agrees – `boxOf` reads a flex ROW as its tallest child, so a row that had silently
  // gone back to a column would measure taller and redden the ceiling above as well.
  // MUTATION-VERIFIED: dropping `.prologue-country.is-closed { display: flex }` reddens this.
  it('⭐ closed, the chosen country and `Browse all countries` are one line', () => {
    const { wrapper } = mountCard(PROLOGUE_CARDS[0], EMPTY_RUN, PHONE)
    const row = document.querySelector('.prologue-country')!
    const cs = getComputedStyle(row)
    expect(cs.display, 'the country slot and the way in are stacked again').toBe('flex')
    expect(cs.flexDirection === 'row' || cs.flexDirection === '', 'the row became a column').toBe(true)
    expect(row.querySelectorAll('.prologue-tile').length, 'closed, it is one country').toBe(1)
    expect(row.querySelector('.prologue-browse'), 'and the way in is inside the row').toBeTruthy()
    // the browse control gave up its full width to make room for the tile beside it
    expect(getComputedStyle(row.querySelector('.prologue-browse')!).width).not.toBe('100%')
    wrapper.unmount()
  })

  // ⚠ AND OPENING THE PICKER PUTS IT BACK EXACTLY AS IT WAS – the wizard's own three views are
  // untouched, which is the other half of «do not redesign the picker».
  it('⚠ open, the picker is the wizard`s three-column grid again', async () => {
    const { wrapper } = mountCard(PROLOGUE_CARDS[0], EMPTY_RUN, PHONE)
    await wrapper.find('.prologue-browse').trigger('click')
    const row = document.querySelector('.prologue-country')!
    expect(getComputedStyle(row).display, 'the open picker is still being squeezed into a row').not.toBe('flex')
    expect(getComputedStyle(document.querySelector('.prologue-tiles')!).gridTemplateColumns).toBe('repeat(3, 1fr)')
    expect(document.querySelectorAll('.prologue-tile').length, 'every country is reachable').toBeGreaterThan(9)
    wrapper.unmount()
  })

  // ⭐⭐⭐ EVERY CARD CARRIES ITS PAINTING (phase 7), AND THE MEASUREMENT CAN SEE IT.
  //
  // ⚠ HOW THAT IS TRUE CHANGED IN PHASE 8 AND THE OLD ACCOUNT WOULD NOW BE A LIE. It used to be a
  // pixel `height`, because «an `<img>` has no children, so a hero sized by `aspect-ratio` would
  // measure as ZERO and every fit number in this file would be optimistic by a quarter of a screen
  // while staying green» – which was a true statement about the INSTRUMENT, and the instrument is
  // what changed: `boxOf` in fits.ts folds `aspect-ratio` against the width it was handed. That is
  // the right way round, because the owner's «square, like the home screen» is a property of the
  // design and the pixel height was a concession to a measurement.
  // MUTATION-VERIFIED: removing the `aspect-ratio` branch from `boxOf` reddens this at every age.
  it('⭐ every card is drawn on a painting, and the painting has a height the measurement can see', () => {
    for (const { card, run } of walk(CARRIED_ROAD, 'middle')) {
      const { wrapper } = mountCard(card, run, PHONE)
      const hero = document.querySelector('.prologue-hero')!
      expect(hero, `age ${card.age} has no picture`).toBeTruthy()
      const img = hero.querySelector('img')!
      expect(img.getAttribute('src'), `age ${card.age} draws the wrong frame`).toBe(
        prologueArtUrl(card.age, moodAt(card.age, run)),
      )
      expect(boxOf(hero, 343).h, `age ${card.age}'s picture measures as nothing`).toBeGreaterThan(150)
      wrapper.unmount()
    }
  })

  // ⭐ THE OWNER'S OWN INSTRUCTION FOR THE FIRST CARD: «для этого у нас есть картинка где она первый
  // раз на корт приходит вообще» – `welcome-1`, the parent and the daughter arriving on a floodlit
  // court – and, 02.09, for the eighth as well: «вполне можно снова использовать первый арт, там как
  // раз про теннисный клуб», which is the card about the club across town.
  // MUTATION-VERIFIED: dropping either age from `WELCOME_AGES` reddens this at both ends.
  it('⭐ she walks onto a court on the five, and again at the club on the eight', () => {
    for (const { card, run } of walk(CARRIED_ROAD, 'middle')) {
      const { wrapper } = mountCard(card, run, PHONE)
      const src = document.querySelector('.prologue-hero img')!.getAttribute('src')!
      const scene = WELCOME_AGES.includes(card.age)
      expect(src.includes('welcome-1'), `age ${card.age} draws the wrong kind of painting`).toBe(scene)
      wrapper.unmount()
    }
    expect(WELCOME_AGES, 'and it is those two cards only').toEqual([5, 8])
  })

  // ⭐⭐⭐ «Заглавная картинка на экране обрезана (отец без головы)» – THE SHIPPED FIX, ON THE
  // RENDERED CARD. A 512x512 master inside a 16:9 window loses 44% of itself; a SQUARE window loses
  // nothing at all, at any width, which is the whole of «я просил арты делать в квадратном формате
  // по аналогии с home экраном». So the assertion is the geometry rather than a pixel count.
  //
  // ⚠ IT IS ONE RULE FOR ALL TEN SCENES AND THE LOOP IS WHAT SAYS SO. `.diary-hero` on Home and
  // `.nt-hero` on the tournament card declare exactly this, for exactly this reason, after he asked
  // the same thing of those screens.
  // MUTATION-VERIFIED: `aspect-ratio: 16 / 9` on `.prologue-hero` reddens every age.
  it('⭐⭐ every painting is shown SQUARE, so nothing is cropped through a face', () => {
    for (const { card, run } of walk(CARRIED_ROAD, 'middle')) {
      const { wrapper } = mountCard(card, run, PHONE)
      const hero = document.querySelector('.prologue-hero')!
      expect(getComputedStyle(hero).aspectRatio, `age ${card.age} is not square`).toBe('1 / 1')
      // ...and no per-card override sneaked in beside it: a declared height would win over the ratio
      // in a real browser and take the crop back.
      expect(lengthPx(getComputedStyle(hero).height, 0), `age ${card.age} declares a height`).toBeNaN()
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
  // ⚠⚠ RE-AIMED 02.09, NOT WEAKENED, AND THE NARROWING IS NAMED. The age-5 card now carries her
  // birthday (owner: «часть нашего текущего онбординга с датой рождения и именем должны остаться»),
  // and a day select is thirty-one digits by construction. The protected fact was never «no digit
  // exists on the card»: cards.ts states it as «No number ABOUT HER appears anywhere on this screen
  // at any age» – no skill, no rating, no percentage, no money, no running balance. A date the
  // PLAYER typed is not a reading of her, so the sweep now reads the card with the identity block
  // taken out and is otherwise unchanged. ⚠ The block is removed by its own container element and
  // the removal is CHECKED to have happened (below), so a renamed class cannot silently exempt the
  // whole card the way an absent marker silently widens a source region.
  it('not one digit appears on any of the ten scenes, on either road', () => {
    const offenders: string[] = []
    for (const road of [LIGHT_ROAD, CARRIED_ROAD]) {
      for (const { card, run } of walk(road, 'wealthy')) {
        const { wrapper } = mountCard(card, run, PHONE)
        const identityBlock = document.querySelector('.prologue-identity')
        expect(
          Boolean(identityBlock),
          `age ${card.age} – the identity block is drawn on exactly the card the table says asks`,
        ).toBe(Boolean(card.identity))
        identityBlock?.remove()
        const text = document.querySelector('.prologue-card')!.textContent ?? ''
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
  //
  // ⚠ AS ONE SENTENCE OF PROSE SINCE 02.09, AND BOTH HALVES OF THAT ARE ASSERTED. The owner met
  // three stacked declaratives and said «мне кажется вот это лишнее»; the FUNCTION had to survive
  // the list, so the card still prints what it read – and it prints it in a `p`, with no `li`
  // anywhere on the scene. MUTATION-VERIFIED: putting the `ul` back reddens the second half.
  it('the twelfth prints the facts it read, in one line of prose and not a list', () => {
    for (const road of [LIGHT_ROAD, CARRIED_ROAD]) {
      const scene = walk(road, 'middle').find((s) => s.card.age === 12)!
      const { wrapper } = mountCard(scene.card, scene.run, PHONE)
      expect(wrapper.text()).toContain(readTwelfth(scene.run).reason)
      expect(document.querySelectorAll('.prologue-card li').length, 'the card is stacking bullets again').toBe(0)
      expect(document.querySelector('.prologue-reason')!.tagName).toBe('P')
      wrapper.unmount()
    }
    // ...and no other card prints one, so the fork's account stays the fork's.
    const seven = walk(LIGHT_ROAD, 'middle').find((s) => s.card.age === 7)!
    const { wrapper } = mountCard(seven.card, seven.run, PHONE)
    expect(document.querySelector('.prologue-reason')).toBeNull()
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
  if (card.question) parts.push(card.question)
  if (card.age === 12) parts.push(readTwelfth(run).reason)
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

// =================================================================================================
// ⭐⭐⭐ HOW LONG THE WALK IS WITH THE TOURNAMENTS IN IT – phase 11, MEASURED AND REPORTED
// =================================================================================================
//
// ⚠⚠ AND IT IS NOT A GATE, WHICH IS THE OWNER'S OWN CORRECTION OF A NUMBER THAT WAS NEVER HIS:
// «Десять минут это ваша цифра, и турниры не должны её съесть – это была примерная цифра, ничего не
// случится, если у нас будут турниры, там есть больше скорости – вообще не проблема, и это одна из
// основных частей игры вообще-то.»
//
// So the section above still bounds THE COPY of the nine cards, which is what §7's estimate was
// really protecting and is the thing that grows one honest sentence at a time. This section measures
// the tournaments and PRINTS the numbers, because he should know what he is shipping – but nothing
// here is designed around a clock: no match is cut, no default sends the player past the viewer, and
// the draw is the draw. The assertions below are about the measurement being REAL, not about it
// being small.
//
// THE MODEL, stated so it can be argued with:
//   READING   the nine cards as above, PLUS the year's tournament question where a card asks one,
//             PLUS one result scene per weekend – the same words, the same rate.
//   SKIPPING  the two escapes, priced apart: the WEEKEND's own header control (one press per draw)
//             and the viewer's own «Skip to the result» (one press per match of hers). Both exist,
//             both are the player's choice, and neither is a default.
//   WATCHING  MEASURED, not guessed: `buildTimeline` returns the playback's length in seconds at
//             speed 1, and a match surface opens on `'key'` at 2x (`composables/matchDefaults.ts`).
//             The viewer's own pills reach 4x and «Full», so this is the middle of what a player can
//             choose rather than a ceiling.
import { buildTimeline } from '../../src/viz/timeline'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { KID_ID } from '../../src/engine/world'
import { LOCAL_OPEN_COPY, TOURNAMENT_ANSWER, localOpenCard } from '../../src/prologue/cards'
import { chosenYears, enteredAges, withEntry } from '../../src/prologue/run'
import { herMatches, outcomeOf, playLocalOpen, prologueEntrant, prologueSchedule } from '../../src/prologue/pool'

/** One press of an escape and a glance at the finished panel behind it. A flat guess, named as one –
 *  the same standing `DECIDE_SECONDS` and `QUIET_SECONDS` are given. */
const SKIP_SECONDS = 6
/** The shipped opening of a match surface: key points, double speed. The pills reach 4x and «Full». */
const DEFAULT_SPEED = 2

/** A whole run down one road, with every year's tournament question answered the same way. */
function runOn(road: Record<number, string>, enter: boolean): PrologueRun {
  let run = withOrigin(EMPTY_RUN, 'middle')
  for (const card of PROLOGUE_CARDS) if (card.options) run = withPick(run, card.age, road[card.age])
  const answer = enter ? TOURNAMENT_ANSWER.enter : TOURNAMENT_ANSWER.decline
  for (const age of [11, 12, 13]) run = withEntry(run, age, answer)
  return run
}

/** What one childhood's tennis costs, measured against real brackets on a real seed. */
function tennisOf(road: Record<number, string>, enter: boolean): {
  weekends: number
  matches: number
  askWords: number
  askSeconds: number
  skipWeekendSeconds: number
  skipMatchSeconds: number
  watchSeconds: number
  resultWords: number
} {
  const run = runOn(road, enter)
  const scheduled = prologueSchedule(chosenYears(run), enteredAges(run))
  const seed = 'budget'
  let matches = 0
  let watchSeconds = 0
  let resultWords = 0
  for (const slot of scheduled) {
    const kid = prologueEntrant(seed, KID_ID, 'Vera Novak', slot.age)
    const open = playLocalOpen(seed, kid, slot.age, slot.index)
    const mine = herMatches(open, KID_ID)
    matches += mine.length
    for (const rec of mine) {
      const oppId = rec.aId === KID_ID ? rec.bId : rec.aId
      const opp = open.field.find((p) => p.id === oppId)!
      const a = rec.aId === KID_ID ? kid : opp
      const b = rec.aId === KID_ID ? opp : kid
      const opts = { surface: open.event.surface, tour: JUNIOR_TOUR, seed: rec.seed! }
      const annotated = annotateMatch(simulateMatch(a, b, opts), a, b, opts)
      watchSeconds += buildTimeline(annotated, 'key').duration / DEFAULT_SPEED
    }
    resultWords += wordsOn(localOpenCard(slot.age, outcomeOf(open)), run)
  }
  // ⭐ THE ASK IS ITS OWN BEAT AND IS CHARGED AS A DECISION – it is one, whichever way it is
  // answered, and it happens whether or not a weekend follows.
  const asks = PROLOGUE_CARDS.map((c) => cardFor(c.age, run).tournament).filter(Boolean)
  const askWords = asks
    .map((a) => [a!.lede, a!.enterLabel, a!.enterNote, a!.declineLabel, a!.declineNote].join(' '))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  return {
    weekends: scheduled.length,
    matches,
    askWords,
    askSeconds: asks.length * DECIDE_SECONDS,
    skipWeekendSeconds: scheduled.length * SKIP_SECONDS,
    skipMatchSeconds: matches * SKIP_SECONDS,
    watchSeconds,
    resultWords,
  }
}

describe('⭐⭐⭐ how long the walk is with the tournaments in it – measured, and reported', () => {
  it('⭐⭐ the four arms, printed: reading, the two escapes, and watching every match', () => {
    const rows: string[] = []
    const measured: { name: string; skipping: number; watching: number; weekends: number }[] = []
    for (const [name, road, enter] of [
      ['light, no', LIGHT_ROAD, false],
      ['light, yes', LIGHT_ROAD, true],
      ['carried, no', CARRIED_ROAD, false],
      ['carried, yes', CARRIED_ROAD, true],
    ] as const) {
      const run = runOn(road as Record<number, string>, enter)
      let words = 0
      let seconds = 0
      for (const { card, run: at } of walk(road as Record<number, string>, 'middle')) {
        words += wordsOn(card, at)
        seconds += card.options || card.origins ? DECIDE_SECONDS : QUIET_SECONDS
      }
      const tennis = tennisOf(road as Record<number, string>, enter)
      words += tennis.resultWords + tennis.askWords
      seconds += tennis.weekends * QUIET_SECONDS + tennis.askSeconds
      const cards = words / WORDS_PER_MINUTE + seconds / 60
      const skipWeekend = cards + tennis.skipWeekendSeconds / 60
      const skipMatch = cards + tennis.skipMatchSeconds / 60
      const watching = cards + tennis.watchSeconds / 60
      measured.push({ name, skipping: Math.max(skipWeekend, skipMatch), watching, weekends: tennis.weekends })
      rows.push(
        `${name.padEnd(12)} ${String(tennis.weekends)} weekends, ${String(tennis.matches).padStart(2)} of her matches` +
          ` | reading ${cards.toFixed(1)} min | skip the weekend ${skipWeekend.toFixed(1)}` +
          ` | skip each match ${skipMatch.toFixed(1)} | WATCH every match ${watching.toFixed(1)}`,
      )
      void run
    }
    console.log(
      `\n  THE WALK, IN MINUTES (reading estimated at ${WORDS_PER_MINUTE} wpm; WATCHING measured off` +
        ` the real timelines at the shipped key/${DEFAULT_SPEED}x opening, which the viewer's own` +
        ` pills can halve again)\n  ${rows.join('\n  ')}\n`,
    )

    // ⚠ THE ASSERTIONS ARE ABOUT THE MEASUREMENT BEING REAL, NOT ABOUT IT BEING SMALL – the owner's
    // own ruling on the ten-minute figure. What must hold is that the numbers can SEE the
    // tournaments: a childhood that entered every year is measurably longer than one that entered
    // none, on both arms, or this whole block is printing a constant.
    // ⭐⭐ AND THE FOUR ARMS ARE THE OWNER'S CORRECTION MADE ARITHMETIC. The tenth's answer and the
    // three later ones are INDEPENDENT: «light, yes» is a childhood that refused at ten and played
    // three weekends afterwards, and «carried, no» is one that entered at ten and refused the other
    // three. Neither is reachable if the tenth is a switch.
    const yes = measured.find((m) => m.name === 'carried, yes')!
    const no = measured.find((m) => m.name === 'carried, no')!
    const refusedAtTen = measured.find((m) => m.name === 'light, yes')!
    const refusedAll = measured.find((m) => m.name === 'light, no')!
    expect(refusedAll.weekends).toBe(0)
    expect(no.weekends, 'the tenth`s own decision still buys its weekend').toBe(1)
    expect(refusedAtTen.weekends, 'a refusal at ten did not close the three years after it').toBe(3)
    expect(yes.weekends).toBe(4)
    expect(yes.skipping).toBeGreaterThan(no.skipping)
    expect(yes.watching).toBeGreaterThan(yes.skipping + 5)
  })

  it('⚠ the measurement is not vacuous – the weekends really are real brackets', () => {
    const none = tennisOf(LIGHT_ROAD, false)
    const every = tennisOf(CARRIED_ROAD, true)
    expect(none.weekends).toBe(0)
    expect(none.watchSeconds).toBe(0)
    expect(every.weekends).toBe(4)
    expect(every.matches).toBeGreaterThanOrEqual(every.weekends)
    expect(every.watchSeconds).toBeGreaterThan(60)
    expect(every.skipMatchSeconds).toBeGreaterThan(every.skipWeekendSeconds)
    // ...and both escapes exist, which is what makes the two skipping arms mean anything.
    expect(LOCAL_OPEN_COPY.skipRest.length).toBeGreaterThan(0)
  })

  it('⚠ every result scene and every ask is a card the walk`s own rules already bind', () => {
    const scenes = [10, 11, 12, 13].flatMap((age) =>
      (['won', 'final', 'lost'] as const).map((outcome) => ({ age, outcome, row: localOpenCard(age, outcome) })),
    )
    for (const { age, outcome, row } of scenes) {
      expect(wordsOn(row, EMPTY_RUN), `age ${age} ${outcome} is a page, not a card`).toBeLessThanOrEqual(170)
      const said = [row.kicker, row.title, row.lede, row.her.cool, row.coach.cool, row.continueLabel].join(' ')
      expect(/\d/.test(said), `age ${age} ${outcome} puts a digit on a card`).toBe(false)
      expect(/[А-Яа-яЁё]/.test(said), `age ${age} ${outcome} carries Cyrillic`).toBe(false)
      expect(said.includes('—'), `age ${age} ${outcome} uses a long dash`).toBe(false)
    }
    // ...and the asks, on both faces of the twelfth.
    const asks = [...PROLOGUE_CARDS, TWELFTH_WANTS_MORE].map((c) => c.tournament).filter(Boolean)
    expect(asks.length).toBe(4)
    for (const ask of asks) {
      const said = [ask!.lede, ask!.enterLabel, ask!.enterNote, ask!.declineLabel, ask!.declineNote].join(' ')
      expect(/\d/.test(said), `«${ask!.lede}» puts a digit on a card`).toBe(false)
      expect(/[А-Яа-яЁё]/.test(said), `«${ask!.lede}» carries Cyrillic`).toBe(false)
      expect(said.includes('—'), `«${ask!.lede}» uses a long dash`).toBe(false)
      expect(/\bthey own\b|\bthey bought\b/i.test(said)).toBe(false)
    }
    // ...and the weekend's own two controls obey the same rules.
    for (const label of [LOCAL_OPEN_COPY.kicker, LOCAL_OPEN_COPY.proceed, LOCAL_OPEN_COPY.skipRest]) {
      expect(/\d|[А-Яа-яЁё]|—/.test(label), `«${label}»`).toBe(false)
    }
  })
})
