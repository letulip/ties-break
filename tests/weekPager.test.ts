// ⭐⭐⭐ ROUND 36 PHASE 5 – THE PAGING RULE ITSELF, AS ARITHMETIC.
//
// The owner: «Давай уберем свайп css и сделаем js функционал для листания горизонтального, тогда
// будет полный паритет на всех устройствах и ничего не надо изобретать.» What replaced the CSS is a
// rule about numbers, and this file is where that rule is held.
//
// ⚠⚠ WHY IT IS HERE AND NOT IN `tests/component/`. `tests/component/` runs in happy-dom, which has
// no layout engine: every `scrollWidth`, `clientWidth` and `getBoundingClientRect()` there is ZERO,
// so a mounted test of the pager could prove the arrows exist and could prove NOTHING about where a
// press sends the strip. Splitting the arithmetic out is what makes the reach measurable at all – it
// takes numbers and returns numbers, and the numbers below are the app's own MEASURED geometry at
// two of the owner's four widths rather than round ones invented for the test.
//
// ⚠ MUTATION-VERIFIED. Each mutation applied alone to src/composables/weekPager.ts, and the verdicts
// differ, which is what says these are separate claims:
//   * `pageTarget`'s final clamp -> `return target` reddens THREE: the two-card-phone arm, the range
//     arm and the desktop arm. That is the sharpest verdict here, because the clamp is what actually
//     runs a strip to its end – the last card's own edge lies PAST `maxScroll` on every layout the
//     app ships. ⚠ IT SAID «TWO» UNTIL R37-3 (05.09), and the third is not a new claim: the desktop
//     arm was re-aimed onto the two-across grid he asked for, and its second press now lands on the
//     clamp where the old three-across arm's first press did. Re-measured, not assumed.
//   * `pagerEnds`'s `scrollLeft >= max - 1` -> `>= max` reddens the fractional-end arm ALONE.
//   * `PAGER_DRAG_PX` -> 0 reddens the threshold arm ALONE.
//
// ⚠⚠ AND TWO MUTATIONS WENT GREEN, WHICH ARE RECORDED BECAUSE A NULL RESULT IS A CLAIM TOO:
//   * gutting `pageTarget`'s `ahead ?? (…)` fallback changes nothing. With every card NARROWER than
//     the strip (which round34-week-stack.test.ts pins) there is always a card ahead until the strip
//     is already at its end, so the fallback is the guard for an empty strip and never the mechanism.
//     The first draft of this file's header claimed it was the mechanism; the mutation is what
//     corrected that, and the source comment was rewritten to match.
//   * removing `snapTarget`'s right-hand-end guard changes nothing either, for the same reason from
//     the other side: `maxScroll` can only exceed the last card's offset when that card is wider
//     than the strip, and the same pin forbids it. Both stay, both are honestly labelled.
import { describe, it, expect } from 'vitest'
import { pageTarget, pagerEnds, snapTarget, PAGER_DRAG_PX } from '../src/composables/weekPager'

/** A strip's geometry, from a card width and a gutter – the way the stylesheet builds one. */
function strip(room: number, card: number, cards: number, gap = 12) {
  const offsets = Array.from({ length: cards }, (_, i) => i * (card + gap))
  const scrollWidth = cards * card + (cards - 1) * gap
  return { offsets, room, maxScroll: Math.max(0, scrollWidth - room) }
}

// THE TWO GEOMETRIES, MEASURED ON THE SHIPPED BUILD rather than chosen.
//
//   375   `.app-content` is 343px (round 36 phase 1's census) and `.week-stack.swipeable >
//         .event-card` is `width: 88%` -> 301.84px. Two cards already overflow, which is why the
//         phone has needed a way to reach the second one since round 34.
//   1280  the row is 948px wide (the rail takes 220 of the 1168 column – phase 3's D21).
//
// ⚠ RE-AIMED BY R37-3 (05.09) – THE DESKTOP GEOMETRY IS NOT THE ONE PHASE 5 MEASURED, and a constant
// that kept the old one would be this file quietly describing a screen that is gone. It was
// `strip(948, 948 / 3 - 8, 4)` – a card of `calc(33.333% - 8px)` -> 308px, three across, D16's
// finding. The owner then asked for the tablet's grid on the desktop: «сетку на 2 карточки desktop
// (как на tablet) по дефолту, а те недели, где 3 карточки будет и больше … будут иметь листалки», so
// a stacked week of three or more is `calc(44% - 6px)` at every width from 768 up -> 411.12px in a
// 948px row. TWO FIT AND A SLIVER OF THE THIRD SHOWS, which is what the pager pages to. Measured in
// Chromium on `sinking` at 1280: card 411.1px, scrollWidth 1257, overflow 309.
// ⚠ NOT ONE ASSERTION BELOW WAS DROPPED OR LOOSENED – the clamp arm, the range arm and the snap arm
// all still run on this constant; what changed is which press hits the clamp, and the arm that names
// it says so.
const PHONE = strip(343, 343 * 0.88, 4)
const DESKTOP = strip(948, 948 * 0.44 - 6, 4)

/** Is a card WHOLLY inside the strip's window at this scroll position? The reachability question,
 *  written once: an edge showing past the frame is the affordance, not the answer. */
function fullyVisible(g: ReturnType<typeof strip>, card: number, scrollLeft: number, width: number): boolean {
  const left = g.offsets[card] - scrollLeft
  return left >= -0.5 && left + width <= g.room + 0.5
}

describe('round 36 phase 5 – which arrows are live', () => {
  it('a strip that does not overflow is at BOTH ends', () => {
    // ⚠ THE ARITHMETIC HERE IS PHASE 5'S AND DID NOT MOVE. What phase 7 changed is what the SCREEN
    // does with it: a strip in this state used to draw two grey arrows and now draws none. `atStart`
    // and `atEnd` still describe it exactly as they did, which is why they were left alone.
    expect(pagerEnds(0, 900, 948)).toEqual({ atStart: true, atEnd: true, overflows: false })
    expect(pagerEnds(0, 948, 948)).toEqual({ atStart: true, atEnd: true, overflows: false })
  })

  it('...and one that does reports the end it is actually at', () => {
    const max = PHONE.maxScroll
    expect(pagerEnds(0, max + 343, 343)).toEqual({ atStart: true, atEnd: false, overflows: true })
    expect(pagerEnds(max, max + 343, 343)).toEqual({ atStart: false, atEnd: true, overflows: true })
    expect(pagerEnds(max / 2, max + 343, 343)).toEqual({
      atStart: false,
      atEnd: false,
      overflows: true,
    })
  })

  it('a fractional last pixel is still the end – the card widths are calc()s', () => {
    // ⚠ RE-AIMED BY R37-3 – THE NUMBERS ARE THE NEW DESKTOP'S, the claim is untouched. `calc(44% -
    // 6px)` does not land on an integer either: three of them in a 948px row come to 1257.36, so the
    // scroll ends at 309.36 while the browser parks `scrollLeft` on 309 (both measured in Chromium,
    // on `sinking` at 1280). `scrollLeft >= max` would then be false for ever at the right-hand end,
    // leaving the Next arrow live with nothing left to show.
    expect(pagerEnds(309, 1257.36, 948).atEnd).toBe(true)
  })
})

// ⭐⭐⭐ ROUND 36 PHASE 7 – IS THERE ANYTHING TO PAGE AT ALL, which is now what decides whether the
// arrows are DRAWN. His ruling, 04.09: «на десктопе неделя из двух карточек показывает две серые
// стрелки, которые ей никогда не понадобятся. Спрятать – да, показываем только если есть что
// листать.»
//
// ⚠ THE APP'S OWN MEASURED GEOMETRIES, NOT ROUND NUMBERS – the same discipline as the block above.
// Phase 7 measured `sinking`'s two-card weeks in Chromium at seven widths: they overflow by 273 /
// 383 / 407px at 375 / 520 / 576 and by EXACTLY 0 from 768 up, where two cards at 50% of the row
// plus the 12px gutter come to the strip's own width. That is the whole of what the ruling turns on.
describe('round 36 phase 7 – whether there is anything to page', () => {
  it('⭐ the phone overflows and the desktop does not – the measured two-card week', () => {
    // 375: strip 343, two cards of 88% + a 12px gutter -> 616 (measured 616/343, overflow 273).
    expect(pagerEnds(0, 616, 343)).toMatchObject({ overflows: true })
    // 768: strip 736, two cards of 362 + 12 -> 736 exactly. Nothing hangs past the edge.
    expect(pagerEnds(0, 736, 736)).toMatchObject({ overflows: false })
    // ⚠ RE-AIMED BY R37-3 – SAME VERDICT, TIGHTER CASE, and that is worth saying out loud. It used to
    // read «1280: strip 948, two cards of 308 + 12 -> 628, well inside a row built for three», which
    // was the three-across desktop. His «сетку на 2 карточки desktop (как на tablet)» makes the pair
    // fill the row EXACTLY, as it already did at 768: 468 + 12 + 468 = 948. So the desktop's answer
    // is no longer «comfortably inside» but «on the boundary», which is precisely why the sub-pixel
    // arm below now matters more than it did – half a pixel of rounding is all that stands between
    // his ruling and two grey arrows on the commonest stacked week there is.
    expect(pagerEnds(0, 948, 948)).toMatchObject({ overflows: false })
    // ...and a THREE-card desktop week is the other half of his sentence: 411.12 x 3 + 24 -> 1257.36,
    // which overflows by 309 and is what «будут иметь листалки» pages. Measured in Chromium.
    expect(pagerEnds(0, 1257.36, 948)).toMatchObject({ overflows: true })
  })

  it('⚠ a sub-pixel of scroll is NOT something to page – the same 1px slack `atEnd` uses', () => {
    // ⚠ THIS IS THE ARM THAT STOPS THE RULING BEING DEFEATED BY ROUNDING, and R37-3 made it the arm
    // that carries the commonest week on the screen. Two cards of `calc(50% - 6px)` plus their gutter
    // come to the row EXACTLY at every width from 768 up, and a `calc` of a percentage does not land
    // on an integer – so a pager drawn because the strip scrolls by half a pixel would be exactly
    // «стрелки, которые ей никогда не понадобятся» on a two-card week, the control he asked to be rid
    // of, returned by arithmetic.
    expect(pagerEnds(0, 948.5, 948).overflows).toBe(false)
    expect(pagerEnds(0, 949, 948).overflows).toBe(false)
    expect(pagerEnds(0, 950, 948).overflows).toBe(true)
  })

  it('⚠ and it is not a restatement of `atStart && atEnd` – the two disagree', () => {
    // A strip scrolled to the middle of a real overflow is at NEITHER end and overflows; a strip
    // that fits is at BOTH ends and does not. Those two agree. The arm that matters is the third
    // state: a strip whose content is SHORTER than its window – which happens for a frame while the
    // cards are still being laid out – is at both ends AND has a negative `scrollWidth - clientWidth`.
    // `overflows` must be false there, and `Math.max(0, …)` is what makes it so.
    const short = pagerEnds(0, 200, 948)
    expect(short.atStart && short.atEnd, 'a strip shorter than its window is at both ends').toBe(true)
    expect(short.overflows, 'and there is still nothing to page').toBe(false)
  })
})

describe('round 36 phase 5 – one press of an arrow, and where it lands', () => {
  it('⭐ ON THE PHONE THE THIRD CARD IS TWO PRESSES AWAY, and it arrives whole', () => {
    const card = 343 * 0.88
    let at = 0
    expect(fullyVisible(PHONE, 2, at, card), 'the third card is off-screen to begin with').toBe(false)
    at = pageTarget(at, PHONE.maxScroll, PHONE.offsets, 1)
    at = pageTarget(at, PHONE.maxScroll, PHONE.offsets, 1)
    expect(at).toBeCloseTo(PHONE.offsets[2], 5)
    expect(fullyVisible(PHONE, 2, at, card), 'two presses and the third card is wholly on screen').toBe(true)
  })

  // ⚠⚠ RE-AIMED BY R37-3 – IT WAS «AT 1280 THREE FIT, SO THE PRESS THAT MATTERS IS THE ONE THAT
  // REACHES THE FOURTH», which read D16's three-across desktop back off the arithmetic. The owner
  // replaced that grid with the tablet's, so at 1280 TWO fit and the third is the first card a press
  // has to reach – the same shape the phone has always had, one card further along. Every assertion
  // the old arm made is still made here: the card-edge step, the clamp that runs the strip to its
  // end, `maxScroll` sitting BELOW the last card's own offset, and the last card arriving whole.
  it('⭐⭐ AT 1280 TWO FIT, so a press reaches the third, and the clamp is what brings the fourth', () => {
    const card = 948 * 0.44 - 6
    expect(fullyVisible(DESKTOP, 1, 0, card), 'two fit at 1280 – his «сетка на 2 карточки»').toBe(true)
    expect(fullyVisible(DESKTOP, 2, 0, card), 'and the third does not, which is what pages').toBe(false)

    // ONE PRESS: a card edge, exactly as on the phone. The third card arrives whole.
    let at = pageTarget(0, DESKTOP.maxScroll, DESKTOP.offsets, 1)
    expect(at).toBeCloseTo(DESKTOP.offsets[1], 5)
    expect(fullyVisible(DESKTOP, 2, at, card), 'one press and the third card is wholly on screen').toBe(true)

    // ⚠ AND THE SECOND PRESS IS THE CLAMP. The fourth card's own edge is PAST the end of the scroll –
    // it is the tail of the row, not the head of a page – so this lands on `maxScroll` rather than on
    // `offsets[3]`. A pager that only ever scrolled to a card edge could never bring the last card
    // fully on screen, and `pageTarget`'s own header names this as the mutation that reddens here.
    at = pageTarget(at, DESKTOP.maxScroll, DESKTOP.offsets, 1)
    expect(at).toBeCloseTo(DESKTOP.maxScroll, 5)
    expect(at).toBeLessThan(DESKTOP.offsets[3])
    expect(fullyVisible(DESKTOP, 3, at, card), 'and the fourth card is wholly on screen').toBe(true)
  })

  it('Back walks the same steps in reverse and stops at the head', () => {
    // ⚠ FROM `maxScroll`, NOT FROM THE LAST CARD'S EDGE. The end of the scroll sits BETWEEN the
    // third card's edge and the fourth's (900.36 against 627.68 and 941.52), so the first press back
    // lands on the third – which is the card-edge rule doing exactly what it says and not an
    // off-by-one. Four cards, three presses home.
    let at = PHONE.maxScroll
    at = pageTarget(at, PHONE.maxScroll, PHONE.offsets, -1)
    expect(at).toBeCloseTo(PHONE.offsets[2], 5)
    at = pageTarget(at, PHONE.maxScroll, PHONE.offsets, -1)
    expect(at).toBeCloseTo(PHONE.offsets[1], 5)
    at = pageTarget(at, PHONE.maxScroll, PHONE.offsets, -1)
    expect(at).toBeCloseTo(0, 5)
    expect(pageTarget(at, PHONE.maxScroll, PHONE.offsets, -1), 'and it cannot walk past it').toBe(0)
  })

  it('⚠ a two-card phone week clamps to the END of the scroll, not to the second card\'s edge', () => {
    // THE SHIPPED 375 CASE, and the one the e2e reachability test drives: two cards at 88% overflow
    // by 272.68px while the second card's own edge is at 313.84. Aiming at the edge would ask for a
    // scroll position that does not exist – the browser would clamp it and the arrow would look
    // like it under-shot. Measured on `sinking`, whose Season feed draws exactly this week.
    const two = strip(343, 343 * 0.88, 2)
    expect(two.offsets[1]).toBeGreaterThan(two.maxScroll)
    expect(pageTarget(0, two.maxScroll, two.offsets, 1)).toBeCloseTo(two.maxScroll, 5)
  })

  it('neither direction can leave the scrollable range', () => {
    expect(pageTarget(0, DESKTOP.maxScroll, DESKTOP.offsets, 1)).toBeLessThanOrEqual(DESKTOP.maxScroll)
    expect(pageTarget(9_999, DESKTOP.maxScroll, DESKTOP.offsets, 1)).toBeLessThanOrEqual(DESKTOP.maxScroll)
    expect(pageTarget(-9_999, DESKTOP.maxScroll, DESKTOP.offsets, -1)).toBeGreaterThanOrEqual(0)
    // A week whose cards all fit has nowhere to go, and saying so is what keeps a live arrow honest.
    const flat = strip(948, 300, 2)
    expect(flat.maxScroll).toBe(0)
    expect(pageTarget(0, flat.maxScroll, flat.offsets, 1)).toBe(0)
  })
})

describe('round 36 phase 5 – where a released drag settles', () => {
  it('it is `scroll-snap-align: start` written out: the nearest card edge', () => {
    const near = PHONE.offsets[1] + 20
    expect(snapTarget(near, PHONE.maxScroll, PHONE.offsets)).toBeCloseTo(PHONE.offsets[1], 5)
    const past = PHONE.offsets[1] - 20
    expect(snapTarget(past, PHONE.maxScroll, PHONE.offsets)).toBeCloseTo(PHONE.offsets[1], 5)
  })

  it('⚠ ...except at the right-hand end, where snapping back would undo the drag', () => {
    // The last card starts BEFORE the end of the scroll, so at `maxScroll` the nearest edge is
    // behind the finger. Settling on it would drag the strip backwards out of the player's hand.
    const at = DESKTOP.maxScroll
    expect(at).toBeLessThan(DESKTOP.offsets[3])
    expect(snapTarget(at, DESKTOP.maxScroll, DESKTOP.offsets)).toBe(DESKTOP.maxScroll)
  })

  it('a strip with no cards is left exactly where it is', () => {
    expect(snapTarget(42, 100, [])).toBe(42)
  })
})

describe('round 36 phase 5 – a tap is not a drag', () => {
  it('the threshold is a real distance, so a still hand still presses Enter', () => {
    // Every card carries a control. A strip that began scrolling on the first pixel would eat those
    // presses; 6px is the usual click slop. The behaviour itself is measured in the browser
    // (e2e/responsive.spec.ts); this only pins that the number exists and is not zero.
    expect(PAGER_DRAG_PX).toBeGreaterThan(0)
    expect(PAGER_DRAG_PX).toBeLessThan(20)
  })
})
