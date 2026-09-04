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
//   * `pageTarget`'s final clamp -> `return target` reddens TWO: the two-card-phone arm and the
//     range arm. That is the sharpest verdict here, because the clamp is what actually runs a strip
//     to its end – the last card's own edge lies PAST `maxScroll` on every layout the app ships.
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
//   1280  the row is 948px wide (the rail takes 220 of the 1168 column – phase 3's D21) and a card
//         is `calc(33.333% - 8px)` -> 308px, the 307.98 phase 3 recorded. THREE FIT, which is
//         exactly D16's finding; the fourth does not.
const PHONE = strip(343, 343 * 0.88, 4)
const DESKTOP = strip(948, 948 / 3 - 8, 4)

/** Is a card WHOLLY inside the strip's window at this scroll position? The reachability question,
 *  written once: an edge showing past the frame is the affordance, not the answer. */
function fullyVisible(g: ReturnType<typeof strip>, card: number, scrollLeft: number, width: number): boolean {
  const left = g.offsets[card] - scrollLeft
  return left >= -0.5 && left + width <= g.room + 0.5
}

describe('round 36 phase 5 – which arrows are live', () => {
  it('a strip that does not overflow is at BOTH ends, so both arrows go quiet', () => {
    // ⚠ THIS IS THE PARITY-CRITICAL ONE. Which weeks overflow depends on the WIDTH, so a pager that
    // vanished when everything fitted would be a control present at 375 and absent at 1280 – which
    // `e2e/parity.spec.ts` fails by name. Disabled, never hidden.
    expect(pagerEnds(0, 900, 948)).toEqual({ atStart: true, atEnd: true })
    expect(pagerEnds(0, 948, 948)).toEqual({ atStart: true, atEnd: true })
  })

  it('...and one that does reports the end it is actually at', () => {
    const max = PHONE.maxScroll
    expect(pagerEnds(0, max + 343, 343)).toEqual({ atStart: true, atEnd: false })
    expect(pagerEnds(max, max + 343, 343)).toEqual({ atStart: false, atEnd: true })
    expect(pagerEnds(max / 2, max + 343, 343)).toEqual({ atStart: false, atEnd: false })
  })

  it('a fractional last pixel is still the end – the card widths are calc()s', () => {
    // `calc(33.333% - 8px)` does not land on an integer, so `scrollLeft >= max` is false for ever at
    // the right-hand end and the Next arrow would stay live with nothing left to show.
    expect(pagerEnds(319.6, 1268, 948).atEnd).toBe(true)
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

  it('⭐⭐ AT 1280 THREE FIT, SO THE PRESS THAT MATTERS IS THE ONE THAT REACHES THE FOURTH', () => {
    const card = 948 / 3 - 8
    // D16's finding, read back: at this width the third card needs no pager at all.
    expect(fullyVisible(DESKTOP, 2, 0, card), 'three fit at 1280').toBe(true)
    expect(fullyVisible(DESKTOP, 3, 0, card), 'and the fourth does not').toBe(false)
    const at = pageTarget(0, DESKTOP.maxScroll, DESKTOP.offsets, 1)
    // ⚠ THE FOURTH CARD'S OWN EDGE IS PAST THE END OF THE SCROLL – it is the tail of the row, not
    // the head of a page – so this lands on `maxScroll` rather than on `offsets[3]`. A pager that
    // only ever scrolled to a card edge could never bring the last card fully on screen.
    expect(at).toBeCloseTo(DESKTOP.maxScroll, 5)
    expect(at).toBeLessThan(DESKTOP.offsets[3])
    expect(fullyVisible(DESKTOP, 3, at, card), 'one press and the fourth card is wholly on screen').toBe(true)
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
