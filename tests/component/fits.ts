// DOES IT FIT ON A PHONE, AS A NUMBER A MOUNTED TEST CAN ASSERT ON.
//
// ⚠ WHY THIS EXISTS. Round-20 #3, and it is the second time the same box has produced the same bug.
// `TourBriefingDialog` shipped on the shared `dialog-card`, which declared no `max-height` and no
// `overflow`; `.dialog-overlay` is `position: fixed; inset: 0; display: flex; align-items: center`,
// so a card taller than the screen is centred and OVERFLOWS BOTH ENDS with nothing to scroll. On a
// 375x667 phone the card measured 1078 px against 635 px of room and Continue sat at y=821..855 –
// 188 px below the bottom of the screen, on a BLOCKING overlay. The career stopped there.
// `MatchReplay.vue`'s own header records the first occurrence, at 375x812: "the card grew to 1243px
// inside an 812px viewport, sitting at y=-215.5, which put the COURT, the close button and the
// bottom of the box score outside the window with no way to reach any of them."
//
// CLAUDE.md's gotcha asks for the guard in the layer that can run on every commit: "any dialog you
// add or lengthen gets a mounted assertion that its dismiss control's box is inside a 375x667
// viewport". That is what this file is for.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT ENGINE, so `getBoundingClientRect()` is all zeros here and nothing wraps
// on its own – the same wall `round17-surfaces.test.ts`, `round18-coach.test.ts` and
// `e2e/responsive.spec.ts` all name. So the boxes are COMPUTED from the real cascade, exactly the
// way `contrast.ts` composites colours the browser would have composited: `getComputedStyle` is real
// (vitest's component project sets `css: true`), happy-dom resolves `vh` against the window, and
// `window.happyDOM.setViewport` makes the viewport a parameter of the measurement.
//
// ⚠⚠ AND THE CONTENT MODEL IS A FLOOR, DELIBERATELY – IT UNDER-COUNTS AND NEVER OVER-COUNTS.
// A red verdict from an under-counting model is therefore always true: if the floor already does not
// fit, the real card does not fit either. A green verdict is only trustworthy because of the OTHER
// half of `fitsViewport` – the height CAP – which is content-independent: once the card is bounded by
// the viewport and scrolls, no amount of future copy can push the dismiss control off the screen, so
// the floor's accuracy stops mattering the moment the cap is in place. That is the property round-20
// #4 actually asked for ("a dialog grows by one honest sentence at a time and nothing objects").
//
// ⚠ THE GLYPH ADVANCE IS MEASURED, NOT GUESSED (CLAUDE.md invariant 4). The one constant this model
// needs is the average character advance, and it was fitted against the SHIPPED card rendered in a
// real headless Chromium – the repo's own `src/style.css` and its own self-hosted Manrope/Sora, at
// five widths. Predicted (this model) vs measured (Chromium), card border-box height in px:
//
//     card width    343     288     360     544     880
//     Chromium     1078.1  1169.8  1034.5   835.7   724.3
//     this model   1015.3  1135.3   997.8   781.5   670.2
//     ratio         0.942   0.970   0.965   0.935   0.925
//
// Under on all five, by 3–7.5%, which is the margin a floor is supposed to have. `ADVANCE` below is
// the fitted number; re-fit it with the same harness if the type stack ever changes.
import { expect } from 'vitest'

export interface Viewport {
  width: number
  height: number
}

/** The three the app is measured against. 375x667 is the one CLAUDE.md's gotcha names and the one
 *  `.injury-stop-art` was already sized against ("the shortest screen the app supports"); 320x568 is
 *  the narrowest anything is expected to survive; the desktop entry is where the width cap is read. */
export const PHONE: Viewport = { width: 375, height: 667 }
export const NARROW_PHONE: Viewport = { width: 320, height: 568 }
export const DESKTOP: Viewport = { width: 1280, height: 800 }

interface HappyWindow {
  happyDOM?: { setViewport?: (size: { width: number; height: number }) => void }
}

/** ⚠ CALL BEFORE READING ANY STYLE. happy-dom resolves `vh` at `getComputedStyle` time against the
 *  window's current size, so a viewport set afterwards measures the previous screen. */
export function setViewport(vp: Viewport): void {
  const w = window as unknown as HappyWindow
  if (!w.happyDOM?.setViewport) {
    throw new Error('happy-dom exposes no setViewport – this measurement cannot be trusted')
  }
  w.happyDOM.setViewport({ width: vp.width, height: vp.height })
}

/** A computed length in px. `%` resolves against `base`; `calc(<a>px ± <b>px)` is folded (happy-dom
 *  substitutes `vh`/`vw` into the calc but does not evaluate it). Anything unresolvable – `none`,
 *  `auto`, an empty string, a calc with a unit still in it – is NaN, which callers read as "no
 *  bound" rather than as zero. A silent zero here would turn a missing cap into a perfect fit. */
export function lengthPx(value: string, base: number): number {
  const v = value.trim()
  if (v === '' || v === 'none' || v === 'auto') return NaN
  if (v.endsWith('px')) return parseFloat(v)
  if (v.endsWith('%')) return (parseFloat(v) / 100) * base
  const calc = /^calc\(\s*(-?[\d.]+)px\s*([+-])\s*(-?[\d.]+)px\s*\)$/.exec(v)
  if (calc) return calc[2] === '+' ? Number(calc[1]) + Number(calc[3]) : Number(calc[1]) - Number(calc[3])
  return NaN
}

function num(value: string, base = 0): number {
  const n = lengthPx(value, base)
  return Number.isFinite(n) ? n : 0
}

/** Average character advance as a fraction of the font size. See the fit table in the header. */
const ADVANCE = 0.47

/** Greedy word wrap at `ADVANCE`, which is how a browser breaks a paragraph: whole words, ragged
 *  right, and a word longer than the line gets its own. */
function lineCount(text: string, fontSize: number, width: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0
  if (width <= 0) return words.length
  const adv = fontSize * ADVANCE
  const space = adv
  let lines = 1
  let used = 0
  for (const word of words) {
    const w = word.length * adv
    if (used === 0) used = w
    else if (used + space + w <= width) used += space + w
    else {
      lines++
      used = w
    }
  }
  return lines
}

interface Box {
  /** border-box height */
  h: number
  marginTop: number
  marginBottom: number
}

/** The stacked height of `parent`'s children inside a content box `width` wide. */
function stackChildren(parent: Element, width: number): number {
  const cs = getComputedStyle(parent)
  const kids = [...parent.children]
  if (kids.length === 0) {
    const text = (parent.textContent ?? '').trim()
    if (text === '') return 0
    const fontSize = num(cs.fontSize)
    const lh = cs.lineHeight
    // Every line-height in this app is a unitless number inherited off `body { font: 15px/1.45 }`;
    // a px value or `normal` is handled anyway so a future rule cannot silently measure as zero.
    const lineHeight = lh.endsWith('px') ? parseFloat(lh) : fontSize * (parseFloat(lh) || 1.2)
    return lineCount(text, fontSize, width) * lineHeight
  }

  const isFlex = cs.display.includes('flex')
  const column = cs.flexDirection === 'column'
  const gap = num(cs.rowGap || cs.gap)

  if (isFlex && !column) {
    // A row: the tallest item decides, and margins do not collapse in a flex container.
    let tallest = 0
    for (const kid of kids) {
      const box = boxOf(kid, width)
      tallest = Math.max(tallest, box.marginTop + box.h + box.marginBottom)
    }
    return tallest
  }

  let total = 0
  let prevBottom = 0
  let first = true
  for (const kid of kids) {
    const box = boxOf(kid, width)
    if (isFlex) {
      total += (first ? 0 : gap) + box.marginTop + box.h + box.marginBottom
    } else {
      // Adjacent block siblings COLLAPSE to the larger margin, which is what a browser does and is
      // also the conservative direction for a floor.
      total += (first ? box.marginTop : Math.max(prevBottom, box.marginTop)) + box.h
      prevBottom = box.marginBottom
    }
    first = false
  }
  if (!isFlex) total += prevBottom
  return total
}

/** One element's border box, given the content width available to it. */
export function boxOf(el: Element, availableWidth: number): Box {
  const cs = getComputedStyle(el)
  const bt = num(cs.borderTopWidth)
  const bb = num(cs.borderBottomWidth)
  const bl = num(cs.borderLeftWidth)
  const br = num(cs.borderRightWidth)
  const pt = num(cs.paddingTop)
  const pb = num(cs.paddingBottom)
  const pl = num(cs.paddingLeft)
  const pr = num(cs.paddingRight)
  const explicit = lengthPx(cs.height, 0)
  const contentWidth = Math.max(0, availableWidth - pl - pr - bl - br)
  const inner = Number.isFinite(explicit) ? explicit : stackChildren(el, contentWidth)
  return {
    h: bt + pt + inner + pb + bb,
    marginTop: num(cs.marginTop),
    marginBottom: num(cs.marginBottom),
  }
}

export interface Fit {
  /** the room `.dialog-overlay` leaves inside its own padding */
  available: { width: number; height: number }
  /** the used width: `min(available, max-width)` */
  cardWidth: number
  /** the used height: `min(content floor, max-height)` */
  cardHeight: number
  /** what the content alone would want, floor-modelled */
  contentFloor: number
  /** the declared height bound, Infinity when there is none */
  cap: number
  /** can anything past the cap be brought into view at all? */
  scrollable: boolean
  /** the card's own top/bottom in the viewport, centred by the overlay */
  cardTop: number
  cardBottom: number
  /** the dismiss control's box once the card is scrolled as far as it goes */
  dismissTop: number
  dismissBottom: number
}

/**
 * Measure a blocking dialog against a viewport.
 *
 * `card` is the `.dialog-card` element; `dismiss` is the control that closes it, and it must be the
 * LAST thing in the card's flow – which is what lets its box be read off the card's own bottom edge
 * once the card is scrolled to its end. Both must be attached to the document (`attachTo:
 * document.body`), or the cascade this reads is not the one the player gets.
 */
export function measureDialog(card: Element, dismiss: Element, vp: Viewport): Fit {
  const overlay = card.parentElement
  if (!overlay) throw new Error('the card is not in an overlay – measure it attached to the document')
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`, and without it this measurement is vacuous')
  }
  const ocs = getComputedStyle(overlay)
  // The overlay is `position: fixed; inset: 0`, so its border box IS the viewport and the room it
  // leaves is the viewport minus its own padding. Checked rather than assumed: a scrim that stopped
  // being fixed would silently change what "available" means.
  if (ocs.position !== 'fixed') {
    throw new Error(`the overlay is \`${ocs.position}\`, not \`fixed\` – this measurement assumes a full-screen scrim`)
  }
  const available = {
    width: vp.width - num(ocs.paddingLeft) - num(ocs.paddingRight),
    height: vp.height - num(ocs.paddingTop) - num(ocs.paddingBottom),
  }

  const ccs = getComputedStyle(card)
  const maxWidth = lengthPx(ccs.maxWidth, available.width)
  const cardWidth = Math.min(available.width, Number.isFinite(maxWidth) ? maxWidth : Infinity)

  const bl = num(ccs.borderLeftWidth)
  const br = num(ccs.borderRightWidth)
  const pl = num(ccs.paddingLeft)
  const pr = num(ccs.paddingRight)
  const contentWidth = Math.max(0, cardWidth - pl - pr - bl - br)
  const contentFloor =
    num(ccs.borderTopWidth) + num(ccs.paddingTop) + stackChildren(card, contentWidth) + num(ccs.paddingBottom) + num(ccs.borderBottomWidth)

  const declared = lengthPx(ccs.maxHeight, available.height)
  const cap = Number.isFinite(declared) ? declared : Infinity
  const cardHeight = Math.min(contentFloor, cap)
  const scrollable = ccs.overflowY === 'auto' || ccs.overflowY === 'scroll'

  // `align-items: center`: an item taller than the line box overflows it equally at both ends.
  const cardTop = num(ocs.paddingTop) + (available.height - cardHeight) / 2
  const cardBottom = cardTop + cardHeight

  // Scrolled to the end, the last child's bottom margin edge rests on the card's content-box bottom.
  // When the card cannot scroll, "scrolled to the end" is where it already was – which is the bug.
  const dismissBox = boxOf(dismiss, contentWidth)
  const dismissBottom = cardBottom - num(ccs.paddingBottom) - num(ccs.borderBottomWidth) - dismissBox.marginBottom
  const dismissTop = dismissBottom - dismissBox.h

  return { available, cardWidth, cardHeight, contentFloor, cap, scrollable, cardTop, cardBottom, dismissTop, dismissBottom }
}

/**
 * The whole of round-20 #3, as one assertion: on `vp`, the player can reach the control that closes
 * this dialog.
 *
 * Two things have to hold and they fail differently, so both are named:
 *  1. the control's box lands inside the screen once the card is scrolled as far as it goes, and
 *  2. the card is bounded and scrollable, so (1) keeps holding when somebody adds a paragraph.
 */
export function assertDismissReachable(card: Element, dismiss: Element, vp: Viewport, label: string): Fit {
  const fit = measureDialog(card, dismiss, vp)
  const where =
    `${label} at ${vp.width}x${vp.height}: card ${fit.cardWidth.toFixed(0)}x${fit.cardHeight.toFixed(0)} ` +
    `(content wants at least ${fit.contentFloor.toFixed(0)}, cap ${fit.cap === Infinity ? 'NONE' : fit.cap.toFixed(0)}, ` +
    `${fit.scrollable ? 'scrollable' : 'NOT scrollable'}), ${fit.available.height.toFixed(0)}px of room`

  if (fit.contentFloor > fit.available.height && !fit.scrollable) {
    throw new Error(`${where} – the content is taller than the screen and nothing scrolls, so the part past the fold cannot be reached at all`)
  }
  if (fit.dismissTop < 0 || fit.dismissBottom > vp.height) {
    throw new Error(`${where} – the dismiss control sits at y=${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)}, outside the viewport`)
  }
  // ⚠ AND THE CONTENT-INDEPENDENT HALF. Everything above is true of TODAY'S copy; this is the one
  // that still holds after the next sentence is added, and it is the actual fix.
  expect(
    fit.cap,
    `${where} – the card declares no height bound that fits, so its height is whatever its content happens to be`,
  ).toBeLessThanOrEqual(fit.available.height)
  return fit
}
