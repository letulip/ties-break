// ⭐ WHERE A COACH MARK'S CARD IS ALLOWED TO LAND – the tour's geometry, as arithmetic.
//
// ⚠ WHY THIS IS NOT IN THE COMPONENT. `OnboardingTour.vue` used to compute the card's position
// inline, and it clamped the HORIZONTAL axis only (`Math.min(Math.max(centre, 150), vw - 150)`).
// The vertical axis was whatever the anchor happened to be: `top: rect.bottom + 14` for a mark
// below, `translateY(-100%)` off `rect.top - 14` for one above. docs/review/05-ux-ui-pwa.md filed
// that as [MEDIUM] "Coach-mark tour can point off-screen", and it is the same family as round-20 #3:
// a box positioned from content, on a 667px phone, with no bound and no way back into view.
//
// A card that lands off the bottom of the screen takes its Skip and Next buttons with it, and the
// tour has no other exit – so the shape of the bug is exactly the blocking-dialog one, one layer
// quieter. Putting the rule in a module makes it a function a mounted test can call with a MODELLED
// card height, which is the only way to assert it at all: happy-dom has no layout engine, so the
// runtime measurement the component takes is zero there (see tests/component/fits.ts's header).
//
// ⚠ AND THE CLAMP IS LAST, DELIBERATELY. Flipping a card that does not fit below to above is a
// nicety; the clamp is the guarantee. Whatever the preferred side, whatever the anchor, whatever the
// copy, the returned box is inside the viewport – so a step whose anchor is off-screen entirely
// still shows its card, and a future sentence added to a step cannot push the buttons out.

/** The part of a `DOMRect` this file needs. Narrow on purpose: a plain object is what a test hands
 *  it, and the component passes a real rect, which structurally satisfies this. */
export interface AnchorRect {
  top: number
  bottom: number
  left: number
  width: number
}

/** Tooltip drawn above or below the highlighted element. The preference, not the outcome. */
export type Placement = 'above' | 'below'

/** = `.coach-tooltip`'s `width` in src/style.css. The card is a fixed width by design (a coach mark
 *  that reflowed with its anchor would change height as it moved), so the one number is shared here
 *  rather than measured; `tests/component/onboarding-tour.test.ts` pins the two together. */
export const TOOLTIP_WIDTH = 260

/** Breathing room between the card and the edge of the screen. */
export const TOUR_MARGIN = 12

/** Between the card and the element it points at. */
export const TOUR_GAP = 14

/** The height assumed until the real card has been measured – the first frame, and any environment
 *  without layout. Deliberately GENEROUS: over-estimating the card pushes it further inside the
 *  screen, and under-estimating is the failure this module exists to prevent. */
export const TOOLTIP_FALLBACK_HEIGHT = 200

function clamp(value: number, lo: number, hi: number): number {
  // `hi < lo` when the card is wider/taller than the room it has; the low edge wins, because a card
  // pinned to the top-left is still reachable and one pinned past the bottom is not.
  return Math.max(lo, Math.min(value, Math.max(lo, hi)))
}

export interface TooltipBox {
  left: number
  top: number
}

/**
 * The card's box for one step.
 *
 * `rect` is the anchor's viewport rect, or `null` when the step's element is not on screen at all
 * (a tab that is not rendered, a card the player scrolled past) – in which case the card centres
 * itself and the tour keeps running, because the words are the point and the highlight is not.
 */
export function tooltipBox(
  rect: AnchorRect | null,
  placement: Placement,
  tipHeight: number,
  viewport: { width: number; height: number },
): TooltipBox {
  const { width: vw, height: vh } = viewport
  const maxLeft = vw - TOOLTIP_WIDTH - TOUR_MARGIN
  const maxTop = vh - tipHeight - TOUR_MARGIN

  if (!rect) {
    return {
      left: clamp((vw - TOOLTIP_WIDTH) / 2, TOUR_MARGIN, maxLeft),
      top: clamp((vh - tipHeight) / 2, TOUR_MARGIN, maxTop),
    }
  }

  const left = clamp(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, TOUR_MARGIN, maxLeft)

  const below = rect.bottom + TOUR_GAP
  const above = rect.top - TOUR_GAP - tipHeight
  const fitsBelow = below <= maxTop
  const fitsAbove = above >= TOUR_MARGIN
  // The preferred side, then the other one, then the clamp. The last step is what makes the result
  // a guarantee rather than a preference.
  let top = placement === 'below' ? below : above
  if (placement === 'below' && !fitsBelow && fitsAbove) top = above
  if (placement === 'above' && !fitsAbove && fitsBelow) top = below

  return { left, top: clamp(top, TOUR_MARGIN, maxTop) }
}
