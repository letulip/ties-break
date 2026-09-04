// ⭐⭐⭐ ROUND 36 PHASE 5 – THE WEEK'S HORIZONTAL PAGER, IN JAVASCRIPT INSTEAD OF IN CSS.
//
// The owner's ruling, 04.09: «Давай уберем свайп css и сделаем js функционал для листания
// горизонтального, тогда будет полный паритет на всех устройствах и ничего не надо изобретать.»
// And on the controls that come with it: «у нас на всех устройствах могут появиться стрелки для
// листания в дополнение к JS свайпу.»
//
// -------------------------------------------------------------------------------------------------
// ⚠⚠ WHY A CSS STRIP WAS NOT ENOUGH, AND IT IS A MEASUREMENT RATHER THAN A PREFERENCE
// -------------------------------------------------------------------------------------------------
// Round 34 #14 made a week with several enterable rungs a scroll-snapping strip. On a finger that is
// a swipe. ON A MOUSE THERE IS NO SWIPE. What a pointer actually has on an `overflow-x` strip is
// shift+wheel and a trackpad's two-finger gesture – neither of which a player guesses – plus
// drag-to-select autoscroll, which was accidental and which the `user-select: none` this file's
// stylesheet half carries has removed on purpose. And there was no tab stop on the strip at all, so
// a keyboard could not reach the third card of a week by any route.
//
// ⭐ THAT IS ALSO WHY THE ARROWS ARE LEGAL. Phase 3's D16 refused an arrow pager because it would
// have been two controls on the DESKTOP and on no other format, which `e2e/parity.spec.ts` fails by
// name. These are on every DEVICE – a finger, a mouse and a keyboard reach the same rule – which is
// the half of the owner's «ничего нового по идее не должно появиться, как и старого уйти ничего не
// должно» that D16's refusal was actually about.
//
// ⚠⚠ PHASE 7 NARROWED THE OTHER HALF, AT HIS LATER RULING, AND IT COST A STATED EXEMPTION. The
// arrows are no longer on every WIDTH: «показываем только если есть что листать», so they are drawn
// where the strip overflows and nowhere else. Measured, on a two-card week: overflow 273 / 383 /
// 407px at 375 / 520 / 576 and EXACTLY 0 from 768 up. The 375 and 1280 fingerprints therefore stop
// matching, `e2e/parity.spec.ts` exempts this pager's own container to say so out loud, and the
// exemption's honest half asserts the converse – a strip that DOES overflow has its arrows. The full
// argument, including the one phase 5 made against this and which was right, is on `pagerEnds` below
// and in D35.
//
// -------------------------------------------------------------------------------------------------
// WHAT REPLACES WHAT
// -------------------------------------------------------------------------------------------------
//   GONE   `scroll-snap-type: x mandatory` / `scroll-snap-align: start` – the CSS swipe itself.
//   GONE   the browser's own horizontal pan on touch: `touch-action: pan-y` hands the horizontal
//          axis to this file and keeps the vertical one for the page.
//   HERE   a pointer drag (mouse, pen and finger through ONE code path – «полный паритет»), a snap
//          on release, two arrow buttons, and Left/Right on the keyboard.
//
// ⚠⚠ `touch-action: pan-y`, NEVER `pan-x`. The hotfix on `main` reached for `pan-x` first – «this
// box handles ONLY horizontal panning» – and a near-vertical gesture that began on a card then
// stopped reaching the page at all: on a run of multi-card weeks the page froze. `pan-y` is the
// safe half of that pair by construction: the browser keeps the axis the PAGE scrolls on, and the
// axis it gives up is the one this file drives. A vertical gesture here cancels the drag
// (`pointercancel`) and scrolls the page, which is what it did before round 34.
//
// -------------------------------------------------------------------------------------------------
// ⚠ THE ARITHMETIC IS PURE AND EXPORTED, AND THAT IS A TESTABILITY DECISION
// -------------------------------------------------------------------------------------------------
// `tests/component/` runs in happy-dom, which has NO LAYOUT ENGINE: every `scrollWidth`,
// `clientWidth` and `getBoundingClientRect()` there is zero, so a mounted test can prove the arrows
// EXIST and can prove nothing whatever about where a press sends the strip. The three functions
// below take numbers and return numbers, so the paging rule itself is testable – and mutable, which
// is the only way to know the test is testing it.

import { onBeforeUnmount, reactive } from 'vue'

/** How far a pointer must travel before this is a DRAG and not a press.
 *
 *  ⚠ IT EXISTS SO A TAP STILL REACHES THE CARD. Every card carries an `Enter` (or a `Withdraw`, or
 *  the planner's own button) and a strip that began scrolling on the first pixel of movement would
 *  eat those presses on any hand that is not perfectly still. 6px is the usual slop for a click;
 *  below it nothing moves and the click goes where the player aimed it. */
export const PAGER_DRAG_PX = 6

export interface PagerEnds {
  /** the strip is at its left end – or does not overflow at all, which is the same for a pager */
  atStart: boolean
  atEnd: boolean
  /** ⭐ PHASE 7: there is something past the strip's edge – and this is now what decides whether the
   *  arrows are DRAWN at all, not merely whether they are live. See the header below. */
  overflows: boolean
}

/**
 * WHICH ARROWS ARE LIVE, AND – SINCE PHASE 7 – WHETHER THERE ARE ANY, from the three numbers a
 * scroll container reports.
 *
 * -------------------------------------------------------------------------------------------------
 * ⭐⭐⭐ THE OWNER OVERRULED THIS FUNCTION'S OWN ARGUMENT, KNOWINGLY, AND BOTH HALVES ARE KEPT HERE
 * -------------------------------------------------------------------------------------------------
 * His ruling, 04.09, after playing the phase-5 build: «на десктопе неделя из двух карточек показывает
 * две серые стрелки, которые ей никогда не понадобятся. Спрятать – да, показываем только если есть
 * что листать.»
 *
 * ⚠ AND PHASE 5 ARGUED THE OTHER WAY, IN THIS EXACT PLACE. Its sentence stood here and it is right:
 *
 *     «A STRIP THAT DOES NOT OVERFLOW IS AT BOTH ENDS AT ONCE, and the arrows are then disabled
 *      rather than absent. That is not tidiness: which weeks overflow DEPENDS ON THE WIDTH – three
 *      cards fit at 1280 and two do not at 375 – so a pager that hid itself when everything fitted
 *      would be a control present at one width and missing at another, which `e2e/parity.spec.ts`
 *      fails by name.»
 *
 * Every clause of that is still TRUE. D35 put the price to him in those words – «the price is that
 * `e2e/parity.spec.ts` then needs a stated exemption for them, because the sets at 375 and 1280 stop
 * matching» – and he answered «да». So this is a trade he has made and not a mistake to correct, and
 * the exemption is the thing that pays for it: `e2e/parity.spec.ts` exempts the arrows' own container
 * and NOTHING else, and asserts the honest half – that a strip which DOES overflow at a width has its
 * arrows there. «Hidden when idle» is the ruling; «hidden whenever» is what the guards forbid.
 *
 * ⚠ `atStart` / `atEnd` ARE UNCHANGED, and that is deliberate: they still describe a non-overflowing
 * strip as at both ends at once, which is what they mean. Nothing about the paging arithmetic moved –
 * the only new thing is a third fact about the same three numbers.
 *
 * The 1px tolerance is fractional-pixel slack, not a fudge: a card width of `calc(33.333% - 8px)`
 * lands `scrollLeft` on a fraction, and `>= max` would be false forever at the right-hand end. It
 * does the same job for `overflows`: three cards of `calc(33.333% - 8px)` in a 948px row can leave a
 * sub-pixel of scroll that is not a card hanging past the edge, and a pager drawn for half a pixel
 * would be exactly the control «которая ей никогда не понадобится».
 */
export function pagerEnds(scrollLeft: number, scrollWidth: number, clientWidth: number): PagerEnds {
  const max = Math.max(0, scrollWidth - clientWidth)
  return { atStart: scrollLeft <= 1, atEnd: scrollLeft >= max - 1, overflows: max > 1 }
}

/**
 * WHERE ONE PRESS OF AN ARROW SENDS THE STRIP: to the next card's own left edge.
 *
 * ⚠ CARD OFFSETS, NOT A FIXED STEP. The card is 88% of a phone, half a tablet row and a third of a
 * desktop one, and a page written as "scroll by `clientWidth`" would land mid-card at two of those
 * three widths. Reading where the cards actually are is the same rule at every width – which is what
 * «полный паритет на всех устройствах» asks for – and it needs no number from the stylesheet.
 *
 * @param offsets each card's left edge, in the strip's own scroll coordinates, ascending.
 */
export function pageTarget(
  scrollLeft: number,
  maxScroll: number,
  offsets: readonly number[],
  direction: -1 | 1,
): number {
  const ahead = direction === 1
    ? offsets.find((o) => o > scrollLeft + 1)
    : [...offsets].reverse().find((o) => o < scrollLeft - 1)
  // ⚠⚠ THE CLAMP IS WHAT RUNS THE STRIP TO ITS END, AND THAT IS A CORRECTION TO WHAT THIS COMMENT
  // FIRST SAID. The last card starts BEYOND `maxScroll` (it is the tail of the row, not the head of
  // a page), so «next» on the second-to-last card asks for a scroll position that does not exist and
  // the clamp turns it into the end – which is exactly what brings the final card fully on screen.
  // MEASURED: replacing the clamp with `return target` reddens two arms of tests/weekPager.test.ts,
  // while gutting the `??` below reddens NOTHING, because with every card narrower than the strip
  // there is always a card ahead until the strip is already at its end. The fallback is the guard
  // for a strip with no cards at all, and it is recorded as a mutation that did not bite rather than
  // dressed up as the mechanism.
  const target = ahead ?? (direction === 1 ? maxScroll : 0)
  return Math.min(Math.max(target, 0), Math.max(maxScroll, 0))
}

/**
 * WHERE A RELEASED DRAG SETTLES: the nearest card edge. This is `scroll-snap-align: start` written
 * out, which is the CSS the owner asked to remove – so it is here rather than gone.
 */
export function snapTarget(
  scrollLeft: number,
  maxScroll: number,
  offsets: readonly number[],
): number {
  if (offsets.length === 0) return scrollLeft
  // ⚠ THE RIGHT-HAND END WINS OVER THE NEAREST CARD: dragged to the very end of a strip whose last
  // card starts before it, the nearest edge would be BEHIND the finger and snapping back to it would
  // undo the drag the player just made.
  // ⚠⚠ AND IT IS UNREACHABLE ON TODAY'S LAYOUTS, WHICH IS RECORDED RATHER THAN HIDDEN. Removing this
  // line reddens nothing: `maxScroll` can only exceed the last card's own offset when that card is
  // WIDER than the strip, and `tests/component/round34-week-stack.test.ts` pins that every card is
  // narrower than the viewport by construction. It stays as the guard for the day that pin moves,
  // and the null mutation is written into this round's ledger.
  if (scrollLeft >= maxScroll - 1) return maxScroll
  let best = offsets[0]
  for (const o of offsets) {
    if (Math.abs(o - scrollLeft) < Math.abs(best - scrollLeft)) best = o
  }
  return Math.min(Math.max(best, 0), Math.max(maxScroll, 0))
}

/** The DOM-facing half. One instance per screen; the strips register themselves by week. */
export interface WeekPager {
  /** `:ref` for a strip. Vue calls it with the element on mount and with `null` on unmount. */
  bind: (week: number, el: unknown) => void
  ends: (week: number) => PagerEnds
  /** an arrow press */
  page: (week: number, direction: -1 | 1) => void
  /** a pointer landing on the strip – the swipe, on every device */
  down: (week: number, event: PointerEvent) => void
  /** Left / Right anywhere inside the week's row */
  key: (week: number, direction: -1 | 1, event: KeyboardEvent) => void
}

/** The answer for a week whose strip has not been measured yet – between the render that creates the
 *  element and the `bind` that reads it.
 *
 *  ⚠ `overflows: false` IS THE SAFE DEFAULT AND NOT AN ARBITRARY ONE. Unmeasured means «we do not
 *  know that there is anything to page», and drawing a pager on that guess would flash two controls
 *  onto every stacked week for a frame. `bind` measures synchronously the moment Vue hands over the
 *  element, so the real answer lands in the same tick. */
const AT_BOTH_ENDS: PagerEnds = { atStart: true, atEnd: true, overflows: false }

export function useWeekPager(): WeekPager {
  const strips = new Map<number, HTMLElement>()
  const detach = new Map<number, () => void>()
  // ⚠ A PLAIN REACTIVE RECORD RATHER THAN A `ref(new Map())`: the arrows read this in a template on
  // every render, and a Map behind a `ref` needs `.value.get(...)` at every call site for no gain.
  const ends = reactive<Record<number, PagerEnds>>({})

  /** Set while a drag is in flight, so the click that follows it can be swallowed. */
  let dragging: { week: number; id: number; x: number; from: number; moved: boolean } | null = null
  /** Cleared by the next `pointerdown`, so it can never block a press that had no drag before it. */
  let blockClick = false

  const smooth = (): ScrollBehavior =>
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false) ? 'auto' : 'smooth'

  /** Each card's left edge in the strip's scroll coordinates. Read from the boxes rather than from
   *  a declared width, so a card whose width is a `calc` nobody parsed still lands in the right
   *  place. Returns [] under happy-dom, where every rect is zero – see the header. */
  function offsetsOf(strip: HTMLElement): number[] {
    const left = strip.getBoundingClientRect().left
    return Array.from(strip.children).map(
      (card) => card.getBoundingClientRect().left - left + strip.scrollLeft,
    )
  }

  function maxScrollOf(strip: HTMLElement): number {
    return Math.max(0, strip.scrollWidth - strip.clientWidth)
  }

  function measure(week: number): void {
    const strip = strips.get(week)
    if (!strip) return
    const next = pagerEnds(strip.scrollLeft, strip.scrollWidth, strip.clientWidth)
    const now = ends[week]
    // ⚠ `overflows` JOINS THE COMPARISON, and forgetting it here is the one way this change could
    // have shipped half-working: the record is only written back when something differs, so a field
    // left out of this line is a field that never updates after the first measurement.
    if (
      !now ||
      now.atStart !== next.atStart ||
      now.atEnd !== next.atEnd ||
      now.overflows !== next.overflows
    ) {
      ends[week] = next
    }
  }

  function scrollTo(strip: HTMLElement, left: number, behavior: ScrollBehavior): void {
    // ⚠ happy-dom implements neither `scrollTo` nor smooth scrolling, and a mounted test that threw
    // here would be reporting a jsdom gap as a defect in the screen.
    if (typeof strip.scrollTo === 'function') strip.scrollTo({ left, behavior })
    else strip.scrollLeft = left
  }

  function bind(week: number, el: unknown): void {
    const previous = detach.get(week)
    if (previous) {
      previous()
      detach.delete(week)
      strips.delete(week)
    }
    if (!(el instanceof HTMLElement)) return
    strips.set(week, el)

    const onScroll = (): void => measure(week)
    el.addEventListener('scroll', onScroll, { passive: true })
    // ⚠ THE CLICK BLOCKER IS ON THE CAPTURE PHASE, which is the only place it can win: a card's
    // `Enter` handles the click itself, so a listener that waited for the bubble would arrive after
    // the confirm dialog had already opened.
    const onClickCapture = (event: MouseEvent): void => {
      if (!blockClick) return
      event.stopPropagation()
      event.preventDefault()
    }
    el.addEventListener('click', onClickCapture, true)

    // A week's row is as wide as the column, and the column moves on his whole breakpoint ladder.
    //
    // ⭐⭐ PHASE 7 MADE THIS LOAD-BEARING. Until the ruling this observer only kept `atStart`/`atEnd`
    // honest across a resize; now it is what makes the arrows APPEAR AND DISAPPEAR as the window is
    // dragged across a breakpoint, which is the difference between «overflow is observed» and
    // «overflow was computed once on mount». A two-card week overflows at 375 and fits at 768: the
    // arrows have to go with it, in both directions, without a remount.
    //
    // ⚠ THE CARDS ARE OBSERVED TOO, NOT ONLY THE STRIP, and that is not belt-and-braces. Overflow is
    // `scrollWidth - clientWidth`: the strip's own box gives the second term, and the CARDS give the
    // first. Their width is a percentage that CHANGES ON HIS LADDER – 88% of a phone, 50% of a
    // tablet row, `calc(33.333% - 8px)` on a desktop – so a media query can move `scrollWidth`
    // without the strip's own box being the thing that moved. Observing only the strip would leave
    // that transition unmeasured.
    //
    // ⚠ AND IT CANNOT LOOP, WHICH IS THE USUAL HAZARD WITH A RESIZE OBSERVER THAT CHANGES THE DOM.
    // The arrows are `position: absolute` against `.week-row` and live in their own container, so
    // adding or removing them changes neither the strip's box nor any card's. Measured as part of
    // the identity census: 0 boxes moved.
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => measure(week))
    observer?.observe(el)
    for (const card of Array.from(el.children)) observer?.observe(card)

    detach.set(week, () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('click', onClickCapture, true)
      observer?.disconnect()
    })
    measure(week)
  }

  function page(week: number, direction: -1 | 1): void {
    const strip = strips.get(week)
    if (!strip) return
    const target = pageTarget(strip.scrollLeft, maxScrollOf(strip), offsetsOf(strip), direction)
    scrollTo(strip, target, smooth())
    measure(week)
  }

  function endDrag(): void {
    if (!dragging) return
    const strip = strips.get(dragging.week)
    if (strip && dragging.moved) {
      scrollTo(strip, snapTarget(strip.scrollLeft, maxScrollOf(strip), offsetsOf(strip)), smooth())
      measure(dragging.week)
    }
    dragging = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
  }

  function onMove(event: PointerEvent): void {
    if (!dragging || event.pointerId !== dragging.id) return
    const strip = strips.get(dragging.week)
    if (!strip) return
    const dx = event.clientX - dragging.x
    if (!dragging.moved) {
      if (Math.abs(dx) < PAGER_DRAG_PX) return
      dragging.moved = true
      blockClick = true
    }
    strip.scrollLeft = dragging.from - dx
    measure(dragging.week)
  }

  function down(week: number, event: PointerEvent): void {
    // A press always starts a fresh gesture, so a blocked click can never outlive its own drag.
    blockClick = false
    // Secondary mouse buttons open the context menu; they are not a swipe.
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const strip = strips.get(week)
    if (!strip) return
    endDrag()
    dragging = { week, id: event.pointerId, x: event.clientX, from: strip.scrollLeft, moved: false }
    // ⚠ ON `window`, NOT ON THE STRIP, AND WITHOUT POINTER CAPTURE. Capturing on `pointerdown`
    // retargets the `click` that follows to the capturing element, which would break every button
    // on every card; capturing later, mid-gesture, is a second state to get wrong. Window listeners
    // let a drag continue past the strip's own edge and cost one add/remove pair per gesture.
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
  }

  function key(week: number, direction: -1 | 1, event: KeyboardEvent): void {
    if (!strips.has(week)) return
    event.preventDefault()
    page(week, direction)
  }

  onBeforeUnmount(() => {
    for (const off of detach.values()) off()
    detach.clear()
    strips.clear()
    endDrag()
  })

  return {
    bind,
    ends: (week) => ends[week] ?? AT_BOTH_ENDS,
    page,
    down,
    key,
  }
}
