// A SCROLLING PILL STRIP KEEPS ITS PRESSED PILL IN SIGHT (round 51 №1a, owner 13.10: the Family-budget
// chapter strip is wider than a phone in Russian, and the ruling was that the PILLS scroll sideways
// inside their own strip while the page never does).
//
// WHY A STRIP THAT SCROLLS NEEDS THIS AT ALL. A tap on a pill that is already on screen needs nothing.
// But the chapter can also change from somewhere else - the ledger button on the summary opens
// History, the shop's front door opens Shop - and then the pressed pill may be the one hanging off the
// right edge. A row of buttons none of which shows which one is pressed is a row that has lost its
// only job, so on mount and on every change the pressed pill is brought in.
//
// ⚠ NOT `scrollIntoView`, AND THAT IS THE WHOLE POINT OF WRITING THE ARITHMETIC OUT. `scrollIntoView`
// walks EVERY scrollable ancestor of the element to bring it into view, and on this screen the
// ancestor that scrolls is the DOCUMENT: switching to Shop from the bottom of the Spending chapter
// would also drag the page vertically to wherever the pill sits. `Element.scrollTo` on the strip moves
// the strip and nothing else. (`composables/scrollReset.ts` makes the same call for the opposite
// reason - it wants the document moved and says so; the two never contend, because this file only
// ever writes the strip's own `scrollLeft`.)
//
// ⚠ THE MOVE IS THE SMALLEST THAT WORKS. A pill already fully inside the strip is left where it is -
// re-centring on every tap would make the whole row slide under the player's thumb - and one that is
// cut by an edge is brought to that edge plus a little air, so the next pill stays half-visible and
// the strip still says "there is more this way" without a scrollbar (the house hides the bar on its
// horizontal strips; see `.bt-tabs`).
import { nextTick, onMounted, watch, type WatchSource } from 'vue'
import { prefersReducedMotion } from './reducedMotion'

/** The three numbers of a scroll container that the arithmetic needs – a plain object so a test needs no DOM. */
export interface StripView {
  scrollLeft: number
  clientWidth: number
  scrollWidth: number
}

/** A pill's horizontal extent in the strip's OWN scroll coordinates (0 = the strip's content start, not the screen's left edge). */
export interface PillSpan {
  left: number
  right: number
}

/** Air left between the revealed pill and the edge it was brought to, in px. */
export const REVEAL_AIR = 8

/**
 * The `scrollLeft` that puts `pill` fully inside `view` by the smallest move, clamped to what the strip can scroll.
 *
 * A pill WIDER than the strip (a long word on a very narrow phone) cannot fit whole, so its leading edge wins: the
 * first letters are what tell the player which pill it is.
 */
export function revealScrollLeft(view: StripView, pill: PillSpan, air: number = REVEAL_AIR): number {
  const max = Math.max(0, view.scrollWidth - view.clientWidth)
  let next = view.scrollLeft
  if (pill.right - pill.left + 2 * air >= view.clientWidth || pill.left - air < next) next = pill.left - air
  else if (pill.right + air > next + view.clientWidth) next = pill.right + air - view.clientWidth
  return Math.min(max, Math.max(0, next))
}

/**
 * Scroll `strip` sideways – and ONLY sideways – until its pressed pill (`aria-pressed="true"`, `SegmentedRow`'s own
 * contract) is fully in view. A missing strip, a missing pressed pill, or a pill already in view is a no-op.
 */
export function revealActivePill(strip: HTMLElement | null | undefined, behavior: ScrollBehavior = 'auto'): void {
  if (!strip) return
  const pill = strip.querySelector<HTMLElement>('[aria-pressed="true"]')
  if (!pill) return
  const s = strip.getBoundingClientRect()
  const p = pill.getBoundingClientRect()
  // The pill's left edge in the strip's scroll coordinates: where it is on screen, minus where the strip's content box
  // starts on screen (its border counts, hence `clientLeft`), plus how far the strip is already scrolled.
  const left = p.left - s.left - strip.clientLeft + strip.scrollLeft
  const target = revealScrollLeft(strip, { left, right: left + p.width })
  if (Math.abs(target - strip.scrollLeft) < 1) return
  // Feature-guarded: a runner without `Element.scrollTo` still gets the write, only without the glide.
  if (typeof strip.scrollTo === 'function') strip.scrollTo({ left: target, behavior })
  else strip.scrollLeft = target
}

/**
 * Reveal the pressed pill once the strip is mounted and again every time `source` (the chosen value) changes.
 *
 * The change waits one tick (`nextTick`): the pressed state is what the pill is found BY, and it is only written to the
 * DOM when the render that follows the change has run. The glide is a nicety and the ARRIVAL is the promise, so the
 * behaviour is chosen: a player who asked their system for less motion is taken there at once (the app's one predicate,
 * `composables/reducedMotion.ts`). The mount is always instant – nothing has been pressed yet, the strip is just opening.
 */
export function useRevealActivePill(strip: () => HTMLElement | null | undefined, source: WatchSource): void {
  onMounted(() => revealActivePill(strip(), 'auto'))
  watch(source, () => {
    void nextTick(() => revealActivePill(strip(), prefersReducedMotion() ? 'auto' : 'smooth'))
  })
}
