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
// ⚠⚠⚠ THE SENTENCE ABOVE WAS FALSE OF THE WIDTH ARM UNTIL 24.09, AND THIS IS THE REPAIR RATHER THAN
// THE NOTE. `demandedWidth` charged `text.length * fontSize * ADVANCE`, billing a SPACE (0.200 of the
// font size in the app's own Manrope) and a `.` (0.253) at the AVERAGE 0.47 – so on a label whose
// glyphs run narrow the model asked for MORE than the browser draws, and a red verdict there was a
// FALSE RED. It is now charged per glyph (`labelWidth`), and the arm's own census is below.
//
// ⚠⚠⚠ AND THE RE-FIT IS **WIDTH-ONLY**, WHICH IS THE LOAD-BEARING HALF OF THIS WAVE. The one constant
// had TWO readers whose conservative directions are OPPOSITE: `lineCount` feeds `stackChildren` ->
// `boxOf` -> every HEIGHT assertion in this file, and there a SMALLER advance means fewer lines, a
// shorter modelled card, and a dialog that does not fit passing – round-20 #3 itself. So the accurate
// per-glyph model is given to the width arm alone and the height arm keeps the fitted average under
// its own name; see `WRAP_ADVANCE` / `LABEL_ADVANCE` for the two of them and why they are two.
//
// ⚠ AND THE HEIGHT ARM IS NOT MERELY «UNCHANGED BY INTENTION» – IT WAS MEASURED UNCHANGED. The
// helper was instrumented behind an env flag, the whole component project was run before and after,
// and two sets were diffed: every `lineCount` call's (text, width) input with its line count –
// **3,520 records** – and every `measureDialog` result (`contentFloor`, `cardHeight`, `cardTop`,
// `cardBottom`, `dismissTop`, `dismissBottom`) – **261 calls**. Both sets came back IDENTICAL, 0
// records on either side of the diff.
//
// ⚠ AND THE FALSE-GREEN QUESTION WAS ASKED OF THE HEIGHT ARM BEFORE ANYTHING WAS
// TOUCHED, because an under-counting height is the LAX direction: of the 261 `measureDialog` calls in
// the project, 257 are `card-scrolls` and 4 `overlay-scrolls`; **0** are the one shape whose verdict
// could turn on the content floor (a finite cap that does not scroll); the 45 uncapped `card-scrolls`
// cases are red on the cap assertion whatever the content measures; and in `overlay-scrolls` the
// dismiss box rests on the overlay's content-box bottom, which no advance can move. Replayed as
// arithmetic rather than argued: all 261 calls re-scored with `contentFloor` multiplied by each of 107
// factors from 1.00 to 100 – 216 green and 45 red at k=1, and **0 calls cross between green and red**
// at any factor. So the height model's under-count is not producing a false green anywhere today, and
// the cap is why.
//
// ⚠ THE GLYPH ADVANCES ARE MEASURED, NOT GUESSED (CLAUDE.md invariant 4). The HEIGHT model's one
// constant was fitted against the SHIPPED card rendered in a real headless Chromium – the repo's own
// `src/style.css` and its own self-hosted Manrope/Sora, at five widths. Predicted (this model) vs
// measured (Chromium), card border-box height in px:
//
//     card width    343     288     360     544     880
//     Chromium     1078.1  1169.8  1034.5   835.7   724.3
//     this model   1015.3  1135.3   997.8   781.5   670.2
//     ratio         0.942   0.970   0.965   0.935   0.925
//
// Under on all five, by 3–7.5%, which is the margin a floor is supposed to have. `WRAP_ADVANCE` is
// that fitted number; re-fit it with the same harness if the type stack ever changes.
//
// =================================================================================================
// ⚠⚠⚠ THE WIDTH ARM'S OWN CENSUS – EVERY LABEL THIS FILE CHARGES, AGAINST A BROWSER (24.09)
// =================================================================================================
//
// THE HARNESS, in the same idiom: a one-off node script serves the worktree over http (mapping
// `/fonts/*` onto `public/fonts/*` so `src/style.css`'s own `@font-face` rules resolve), loads a page
// FROM that origin – `page.setContent` leaves the document on `about:blank`, where a web font is a
// cross-origin request and every face fails CORS – and measures each string's intrinsic width
// (`width: max-content; white-space: pre`) with every font property copied off the shipped span, so
// the browser charges tracking, weight, case and figure width rather than a model. It reproduces
// `college-scene-ui.test.ts`'s `MEASURED_PX` to the last digit (166.4688 for «Quarterfinal –
// C. Ostergaard» at 13px/400), which is what says the harness is the same one. An advance scales
// linearly with the font size in Chromium – checked at 10 / 10.5 / 11.5 / 12 / 12.5 / 13 / 14.5 / 16 /
// 20px against a 100px reference, worst disagreement 0.013px – so the table is a fraction of the size.
//
// THE POPULATION, taken by instrumenting the helper and running the whole project: **76 charged calls,
// 32 distinct (label, font)**, across 8 test files. Every one of them is Manrope, at 10–14.5px and
// weights 400–800. Model against browser, as a ratio:
//
//                         over 1.0     min     median     max
//     before (flat 0.47)     5/32     0.569     0.918    1.043
//     after  (per glyph)     0/32     0.552     0.798    0.875
//
// The five the old model REFUSED, and what the new one charges (browser in the last column):
//
//     «7.74 units at $6,457 each»   11.5px/400    135.12 -> 113.39   of 129.56
//     «Sell»                          12px/700     22.56 ->  16.80   of  21.84
//     «Quarterfinal – C. Ostergaard»  13px/400    171.08 -> 142.35   of 166.47
//     «1 year»                      11.5px/700     32.43 ->  27.14   of  31.58
//     «8.55 units at $5,846 each»   11.5px/400    135.12 -> 113.39   of 133.33
//
// ⚠⚠ WHAT THIS COSTS, SAID OUT LOUD: the floor moves DOWN, from a median 0.918 of the browser to
// 0.798. A width guard that charges 80% of the truth catches a row that overflows by more than ~20%
// of its text, where the old one caught ~8% – and `assertInlineRowFits` has no height cap to fall back
// on, so that is the price of the false red going away. It is the price this file already pays by
// design (`demandedWidth`'s own docstring: the charges were under the truth by 4–43% before this
// wave), and the surface where 5px of margin decides the verdict does not use the shared floor at all
// – see `college-scene-ui.test.ts`'s `MEASURED_PX`, which is browser numbers for exactly that reason.
//
// ⚠⚠ AND THE OBVIOUS BETTER MODEL WAS MEASURED AND REJECTED: a full per-character table (every glyph
// charged its own advance, not just the narrow ones) lands at a median 0.978 – far tighter – but it is
// **NOT A FLOOR**. A shaped run is narrower than the sum of its glyphs' advances: over the census's 749
// Manrope strings the sum is OVER the browser on **46.5%** of them, by up to 2.96% («Rubber 1 –
// P. Kovac» 113.68 modelled of 110.42 measured) from kerning alone, and by **73%** on a two-code-point
// flag that shapes into one glyph. Keeping it a floor would need a ~0.58 blanket haircut, which throws
// away everything it bought. So the card's «a per-character table is exact for the strings it covers»
// is false against a shaping engine, and the narrow-glyph half – which only ever LOWERS a charge, so
// it can never over-ask where the old model did not – is the half that is safe to take.
//
// THE MUTATION LEDGER for this wave – each arm run after the re-fit, and each one RED. Full outputs
// are in the wave's report:
//   * a row that really overflows on TEXT: the league row's surname tripled
//     («Quarterfinal – C. Ostergaard-Ostergaard-Ostergaard»), every declaration untouched ->
//     `assertInlineRowFits` RED, «the controls demand 363px of a 291px row». The same row shipped is
//     green through the floor with 53.2px spare.
//   * a row that really overflows on its CONTAINER: `.college-card`'s padding grown 14 -> 42px a side
//     -> RED, «the controls demand 238px of a 235px row».
//   * a row that really overflows on a MIN-WIDTH: `.span-weeks-btn` given `.next-week-btn`'s own
//     `min-width: 206px` -> `assertRowFits` RED at 320x568, «the controls demand 342px of a 288px
//     bar». ⚠ AT 375x667 THAT ARM WENT GREEN BY 0.9px AND IT IS RE-AIMED RATHER THAN SILENCED – the
//     CTA's own label is what it was charging, the browser says the mutated bar is 14.3px over, and
//     `round26-span-gate-ui.test.ts` now carries both halves with the date and the numbers.
//   * a dialog that really does not fit a phone: `.dialog-card`'s `max-height`/`overflow-y` killed by
//     an injected `!important` override (the test layer, so `src/` is untouched), which is the shipped
//     round-20 defect -> `assertDismissReachable` RED on `TourBriefingDialog` at 375x667, «content
//     wants at least 1015, cap NONE, card does NOT scroll, 635px of room». **1015** is this header's
//     own fit-table figure for a 343px card, unchanged by the re-fit; with the shipped rules back the
//     same mount is green at 635 of 635.
//   * the height model itself, which is the ruling above as a number: `lineCount` given the per-glyph
//     width model by hand -> the same briefing's modelled floor drops **1015.3 -> 923.6px** against
//     Chromium's real 1078.1, i.e. from 0.94 of the truth to 0.86. Every height verdict in this file
//     would have been 9% laxer. That is why the two constants are two.
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
/** ⭐ ROUND 36 PHASE 2 – the bottom of his tablet band (docs/specs/responsive-2026-09.md: «768 как
 *  раз тоже можно до 900 тянуть вполне»), so a rule that only exists past 768 can be measured by a
 *  mounted test instead of only by the browser suite. A tablet in portrait, because the height is
 *  what `vh` reads and 768x1024 is the real device this band was drawn for.
 *
 *  ⚠⚠ AND A MEDIA QUERY IS EVALUATED ON AN ELEMENT'S FIRST COMPUTED-STYLE READ AND THEN CACHED –
 *  measured on happy-dom 04.09, and it is a trap worth stating here rather than rediscovering.
 *  `setViewport` AFTER a read does not change what that element computes; a FRESH element does
 *  re-evaluate. So the order is always: `setViewport(...)`, then mount, then read. Setting the width
 *  after mounting reads the previous screen's answer and looks exactly like a rule that is missing. */
export const TABLET: Viewport = { width: 768, height: 1024 }

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

// =================================================================================================
// ⭐⭐⭐ THE TWO GLYPH MODELS, AND THEY ARE TWO CONSTANTS BECAUSE THEIR SAFE DIRECTIONS ARE OPPOSITE
// =================================================================================================
//
// ⚠⚠ ONE CONSTANT SERVED BOTH UNTIL 24.09 AND THAT WAS THE DEFECT UNDER THE DEFECT. `ADVANCE = 0.47`
// was read by `lineCount` (HEIGHT: a bigger advance means more lines, a taller modelled card, a
// CONSERVATIVE verdict) and by `demandedWidth` (WIDTH: a bigger advance means a bigger demand, which
// is a FALSE RED). So the two readers wanted the number moved in opposite directions, and a re-fit
// for one silently re-aimed the other. They are two constants now, with the same number today and
// two names, and each docstring says which way its own conservatism runs.

/** ⭐ THE **HEIGHT** MODEL'S CONSTANT – the average character advance, read by `lineCount` and by
 *  nothing else. It is the number the header's five-width fit table was fitted against, and it has
 *  NOT moved: the 24.09 re-fit changed the width arm alone, so every height this file has ever
 *  modelled is unchanged to the last decimal – the whole component project was run before and after
 *  with the helper instrumented, and the 3,520 `lineCount` records and 261 `measureDialog` results
 *  came back identical (the header carries the diff). ⚠ BIGGER IS SAFER HERE. More lines is a taller card is a stricter verdict, so a
 *  future re-fit that LOWERS this number makes `measureDialog` and `assertDismissReachable` laxer,
 *  which is the round-20 #3 failure. Re-fit it with the header's harness, and never to make a red
 *  dialog green. */
const WRAP_ADVANCE = 0.47

/** ⚠ THE **WIDTH** MODEL'S BASE, and it is what a glyph the table below does not cover is charged –
 *  which is exactly what EVERY glyph was charged before 24.09. So an unlisted character can never
 *  make this model ask for more than the model it replaced, whatever face it is set in. ⚠ SMALLER IS
 *  SAFER HERE, the opposite of `WRAP_ADVANCE`: a demand over the browser's is a false RED. */
const LABEL_ADVANCE = 0.47

/** ⭐⭐⭐ THE GLYPHS THAT RUN NARROWER THAN THE AVERAGE, CHARGED THEIR OWN MEASURED ADVANCE – which is
 *  the whole of the 24.09 width re-fit. The average billed a SPACE (0.20) and a `.` (0.25) at 0.47,
 *  so a label whose glyphs run narrow was charged MORE than the browser draws.
 *
 *  ⚠ MEASURED, NOT GUESSED, AND THE GUESS WAS WRONG ABOUT THE DASH. The card that asked for this
 *  named `–` as a narrow glyph; the en dash advances **0.540** in Manrope, WIDER than the average, so
 *  it is not here. What made «Quarterfinal – C. Ostergaard» a false red was its two spaces, its `.`
 *  and its `l i t f r`, not its dash.
 *
 *  ⚠⚠ EVERY ENTRY IS THE **MINIMUM** ACROSS THE TEN FACES THE APP ACTUALLY ASKS FOR – Manrope and
 *  Sora at 400/500/600/700/800 – so no entry can be over the truth on any of them. Verified over 195
 *  glyphs x 10 faces in headless Chromium: **0 over-charges**. (The `@font-face` range goes down to
 *  200, but no rule in `src/` asks for a weight under 400: `grep -rE 'font-weight:\s*(200|300)' src/`
 *  finds only the range declaration itself.) ⚠ CAVEAT IS THE ONE FACE THIS TABLE IS STILL OVER, on 38
 *  of its 53 entries – the hand face is ~30% narrower than Manrope everywhere. It was over before
 *  too, and by MORE: measured over the census's 17 distinct Caveat strings the old flat model ran up to
 *  **1.478** of the browser and this table runs up to **1.172**. Every Caveat string in the census
 *  reaches the HEIGHT model, where over-asking is the conservative direction, and none reaches
 *  `demandedWidth` at all.
 *
 *  Each value is the measured advance rounded DOWN to two decimals, so the rounding is a charge the
 *  model gives up rather than one it invents. */
const NARROW_ADVANCE: Readonly<Record<string, number>> = narrowTable([
  [' ', 0.2],
  ["'", 0.21],
  ['·‘’', 0.22],
  ['IilÌÍÎÏìíîï', 0.23],
  ['.j|', 0.25],
  [',:;', 0.26],
  ['!¡', 0.29],
  ['`', 0.3],
  ['ª', 0.31],
  ['‹›', 0.32],
  ['/\\º', 0.34],
  ['f', 0.35],
  ['r', 0.36],
  ['()[]{}°“”„', 0.37],
  ['"1†‡', 0.39],
  ['t', 0.4],
  ['-‑', 0.42],
  ['*•', 0.43],
  ['J', 0.46],
])

function narrowTable(groups: [string, number][]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [chars, advance] of groups) for (const ch of chars) out[ch] = advance
  return out
}

/** ⭐⭐ WHAT A RUN OF TEXT TAKES ACROSS WHEN IT CANNOT WRAP – the width model, per glyph.
 *
 *  ⚠ IT ITERATES CODE POINTS, NOT UTF-16 UNITS, AND THAT ALONE FIXED AN OVER-CHARGE THE CENSUS
 *  FOUND: `text.length` bills a flag twice. «🇺🇸» at 19px measured 22.00px in Chromium against
 *  `4 * 19 * 0.47 = 35.72` from the old model – 1.62x over – and 2 code points at the base is 17.86,
 *  under. (A combining mark would be the other direction, one code point too many; the census over
 *  the whole component project holds none, and the app's names are ASCII by CLAUDE.md's Style rule.)
 *
 *  ⚠⚠ AND IT IS STILL A FLOOR AND STILL BLIND TO THE SAME FOUR THINGS, which is why the charge stays
 *  well under the browser rather than level with it: nothing here reads WEIGHT (800 is wider than
 *  400), `text-transform: uppercase`, `letter-spacing` or `font-variant-numeric: tabular-nums`. ⚠ AND
 *  IT CANNOT: happy-dom does not resolve an inherited font property – measured, `getComputedStyle`
 *  hands back the literal string `inherit` for `font-family` and `font-weight` on almost every
 *  element in this app – and it computes an `em` letter-spacing as `NaNpx`. A face-aware or
 *  tracking-aware model is not implementable in this instrument, so the model is deliberately
 *  face-blind and the table is the narrowest face's. */
function labelWidth(text: string, fontSize: number): number {
  let advance = 0
  for (const ch of text) advance += NARROW_ADVANCE[ch] ?? LABEL_ADVANCE
  return advance * fontSize
}

/** Greedy word wrap at `WRAP_ADVANCE`, which is how a browser breaks a paragraph: whole words, ragged
 *  right, and a word longer than the line gets its own.
 *
 *  ⚠ IT DOES NOT USE `labelWidth`, AND THAT IS THE RULING RATHER THAN AN OVERSIGHT. The accurate
 *  per-glyph model is NARROWER, which here would mean FEWER lines, a SHORTER modelled card and a
 *  dialog that does not fit passing – round-20 #3 exactly. See `WRAP_ADVANCE`. */
function lineCount(text: string, fontSize: number, width: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0
  if (width <= 0) return words.length
  const adv = fontSize * WRAP_ADVANCE
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

/** ⭐⭐ `aspect-ratio: <w> / <h>` AS A CONTENT HEIGHT, and it closes a real blind spot rather than
 *  adding a nicety. A box sized by ratio has no `height` and – when it is a bare `<img>` or a
 *  painting under an absolute scrim – no children to stack either, so it used to measure as ZERO:
 *  `PrologueCard.vue` carried a note saying exactly that, and paid for it by declaring its hero's
 *  height in pixels so this instrument could see the box. That is the tail wagging the dog, and it
 *  blocked the owner's own «square, like the home screen» rule, which is `aspect-ratio: 1 / 1` in
 *  three components already.
 *
 *  ⚠ IT CAN ONLY ADD HEIGHT, NEVER REMOVE IT – an explicit `height` still wins, and a box with
 *  neither still stacks its children. So every existing verdict either stands or gets stricter.
 *
 *  ⚠ AND IT UNDER-COUNTS, which is the direction this file's header commits to: the width handed in
 *  is the PARENT's content width, so a full-bleed child that cancels its parent's padding measures
 *  as its parent's content box rather than as its true wider self.
 *
 *  Returns NaN when there is no usable ratio, which callers read as "no bound" exactly as they read
 *  an unresolvable `height`. */
export function aspectHeightPx(value: string, width: number): number {
  const v = value.trim()
  if (v === '' || v === 'auto') return NaN
  const m = /^(\d*\.?\d+)\s*(?:\/\s*(\d*\.?\d+))?$/.exec(v)
  if (!m) return NaN
  const w = Number(m[1])
  const h = m[2] === undefined ? 1 : Number(m[2])
  if (!(w > 0) || !(h > 0)) return NaN
  return (width * h) / w
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
  // The ratio is a FLOOR alongside the stacked children, not a replacement for them: `aspect-ratio`
  // yields to taller content in a real browser (`.nt-hero` in NextTournamentPanel.vue says so in as
  // many words), so the honest model is whichever of the two is larger.
  const ratio = aspectHeightPx(cs.aspectRatio ?? '', contentWidth)
  const inner = Number.isFinite(explicit)
    ? explicit
    : Math.max(stackChildren(el, contentWidth), Number.isFinite(ratio) ? ratio : 0)
  return {
    h: bt + pt + inner + pb + bb,
    marginTop: num(cs.marginTop),
    marginBottom: num(cs.marginBottom),
  }
}

// =================================================================================================
// ⭐ THE OTHER AXIS: A FIXED BOTTOM BAR, MEASURED ACROSS RATHER THAN DOWN (round 26 #1)
// =================================================================================================
//
// `measureDialog` answers "can the player reach the way out of this card". A bar pinned above the
// tab bar cannot fall below the fold – that half is structural – so what can go wrong is WIDTH: two
// controls in one row on a 375px phone, and `.next-week-btn` alone declares `min-width: 206px`.
// `tests/component/college-second-act.test.ts` measures its own two-answer bar with a private copy
// of this idea; this is the shared one, and it is strictly stronger in the way that matters for a
// row of PILLS: a control that declares no minimum but is `white-space: nowrap` still cannot shrink
// below its own text, and reading only the declared minimum would score such a row as free.

/** ⚠⚠ WHERE A LINE MAY BREAK, MEASURED RATHER THAN ASSUMED (24.09) – and it is what makes the rule
 *  below a floor instead of a guess. A browser breaks at whitespace and ALSO after a hyphen or a
 *  dash, so «one word» for this model's purposes is a run with no break opportunity in it at all.
 *  Measured in headless Chromium over the repo's own Manrope, `width: min-content` against
 *  `width: max-content` on one token at 13px: the hyphen breaks (79.7 of 158.9), and so do the en,
 *  em and figure dashes, the soft hyphen, the zero-width space and `?`. The NON-breaking hyphen
 *  U+2011 does NOT (158.9 of 158.9), and neither do `/`, `,`, `.`, `:` or `)`. Charging a token this
 *  set splits would OVER-count, which is the one thing this file may never do. */
const BREAKS = /[\s\u00ad\u200b\u2012\u2013\u2014?-]/

/** The width a control wants: its declared `min-width`, and – when its label cannot wrap – at least
 *  that label plus its padding and borders.
 *
 *  ⚠ AN ELLIPSIS IS NOT CREDITED, AND THAT IS THE DECISION. `.next-week-btn` declares
 *  `text-overflow: ellipsis`, and style.css says what it is for in its own words: «the safety net at
 *  375px, not the plan». A control cut down to «Trai…» is not a control the measurement should score
 *  as fitting – crediting the ellipsis would let any pair of pills pass by shrinking the CTA to its
 *  padding. A control that may WRAP is different: it gives ground vertically, so its declared
 *  minimum is the floor.
 *
 *  ⚠⚠ AND THAT LAST SENTENCE WAS TRUE OF THE WRONG SET OF CONTENT UNTIL 24.09 – THIS IS THE AMENDMENT
 *  RATHER THAN A NEW RULE. «Gives ground vertically» is sound for a label WITH a break opportunity in
 *  it; content with NONE cannot wrap whatever `white-space` says, so it gives no ground at all – it
 *  simply overflows. `lineCount` in this same file has always known it («a word longer than the line
 *  gets its own»), and the old branch charged such a control **0.0px of text** whenever it also
 *  declared no `min-width`, which is a set of two omissions that says nothing about how wide the
 *  thing is.
 *
 *  ⚠ THE COST OF THAT, MEASURED ON A SHIPPED SURFACE. `CollegeYearCard.vue`'s `.rubber-watch` – the
 *  **Watch** control on every championship row – declares neither, carries no padding, and was
 *  therefore scored at **0.0px** against a real browser width of **41.33px** (headless Chromium,
 *  the repo's own Manrope; `tests/component/college-scene-ui.test.ts`'s `MEASURED_PX` records the
 *  provenance). ⚠⚠ AND `assertInlineRowFits` HAS NO HEIGHT CAP TO FALL BACK ON, which is why this
 *  mattered more than the header's «a floor's red verdict is always true» allows for: in a dialog the
 *  cap makes the floor's accuracy stop mattering, in a ROW nothing does, so an under-charged control
 *  there produces a GREEN verdict on a row that really does not fit.
 *
 *  ⚠ THE CONTRACT IS UNTOUCHED AND THAT IS THE POINT: a single unbreakable word's width IS the
 *  browser's own min-content width for that run, so charging it can never over-count – which is why
 *  the change is to WHICH content the old branch was wrong about, not to how much a floor may charge.
 *  Measured against Chromium, the charges are still under the truth by 17–45% (the figures moved when
 *  the width model went per-glyph on 24.09; the browser's did not): `.seat-name`'s «Coach» 24.67 of
 *  32.48, «Masseur» 33.39 of 42.95, «Psychologist» 53.45 of 64.78, and `.rubber-watch`'s «Watch»
 *  22.80 of 41.33 – the last one because `labelWidth` charges nothing for weight 800, for `uppercase`
 *  being wider than the glyphs it counts, or for `letter-spacing`.
 *
 *  ⚠ WHY NOT THE LONGEST WORD OF EVERY LABEL, which is strictly more correct still (a browser cannot
 *  break a word wherever the label came from). It was measured too, over the whole component project:
 *  it MOVES 25 charges across 10 assertion sites against this rule's 19 across 7 – so it is not free,
 *  and the difference is six charges on labels that genuinely wrap («Raise her daughter»,
 *  «She came by with something small.»). A rule that moves a number nobody asked about is a rule for
 *  its own card, with its own arms. Neither rule reddens anything: both arms ran the whole project
 *  green at 218 files / 2354 tests. */
export function demandedWidth(el: Element, room: number): number {
  const cs = getComputedStyle(el)
  const chrome = num(cs.paddingLeft) + num(cs.paddingRight) + num(cs.borderLeftWidth) + num(cs.borderRightWidth)
  const declared = lengthPx(cs.minWidth, room)
  const floor = Number.isFinite(declared) ? declared : 0
  const text = (el.textContent ?? '').trim()
  // The label is charged when it CANNOT wrap: either the control forbids wrapping, or the label has
  // nowhere to break. Empty text charges nothing under either arm, as it always did.
  if (cs.whiteSpace !== 'nowrap' && (text === '' || BREAKS.test(text))) return Math.max(floor, chrome)
  return Math.max(floor, chrome + labelWidth(text, num(cs.fontSize)))
}

// =================================================================================================
// ⭐ AND THE THIRD SHAPE: A ROW INSIDE THE PAGE, WHICH IS NOT PINNED TO ANYTHING (round 34 #20)
// =================================================================================================
//
// `assertRowFits` above measures a bar that is `position: fixed`, so its room is the viewport minus
// its own padding and the arithmetic stops there. A row of controls sitting in a CARD, in a feed, in
// a screen shell has its room decided by everything above it – and that chain is exactly what a
// width regression hides in: a card that grows 8px of padding takes those px off every row inside
// it. So the room is WALKED rather than assumed, and the two functions below are the same
// measurement `assertRowFits` makes, read against a walked room instead of a viewport.

/** The content width `el` is left by its own ancestors on `vp` – the viewport, narrowed by every
 *  padding, border, margin and `max-width` between the document and `el`'s parent.
 *
 *  ⚠ IT STOPS AT `el`'s PARENT, so the caller can subtract `el`'s own box or not, as the question
 *  needs. `assertInlineRowFits` subtracts it. */
export function availableWidth(el: Element, vp: Viewport): number {
  const chain: Element[] = []
  for (let node = el.parentElement; node; node = node.parentElement) chain.unshift(node)
  let room = vp.width
  for (const node of chain) {
    const cs = getComputedStyle(node)
    const cap = lengthPx(cs.maxWidth, room)
    if (Number.isFinite(cap)) room = Math.min(room, cap)
    const declared = lengthPx(cs.width, room)
    if (Number.isFinite(declared)) room = Math.min(room, declared)
    room -=
      num(cs.marginLeft, room) +
      num(cs.marginRight, room) +
      num(cs.borderLeftWidth) +
      num(cs.borderRightWidth) +
      num(cs.paddingLeft, room) +
      num(cs.paddingRight, room)
  }
  return room
}

/** What a control in a row takes across: `demandedWidth`, and at least its own DECLARED width.
 *
 *  ⚠ THE DECLARED HALF IS WHY THIS EXISTS. `demandedWidth` answers for a pill – a box that is as
 *  wide as its label – and reads `min-width` only. A form field is the other kind of control: it
 *  declares a `width` (`.shop-stake-input` is `8.5em`) and carries no text of its own, so
 *  `demandedWidth` alone scores it as its padding and a field three times too wide measures as free. */
export function rowItemWidth(el: Element, room: number): number {
  const declared = lengthPx(getComputedStyle(el).width, room)
  return Math.max(demandedWidth(el, room), Number.isFinite(declared) ? declared : 0)
}

/**
 * `items` really do sit on ONE line inside `row` on `vp` – the in-page counterpart of
 * `assertRowFits`.
 *
 * ⚠ WHAT A RED VERDICT MEANS HERE, because it is not the same failure as the fixed bar's. A row
 * that declares `flex-wrap: wrap` cannot push a control off the side of the phone – it spends a
 * LINE instead. So this assertion is not «the control is unreachable», it is «the controls do not
 * fit beside each other, so the row the owner asked for is two rows on his screen». That is the
 * claim round 34 #20 is about, and a wrapping row is what stops the same measurement from being an
 * unreachable-control bug in the first place.
 */
export function assertInlineRowFits(row: Element, items: Element[], vp: Viewport, label: string): number {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – without it this measurement is vacuous')
  }
  const cs = getComputedStyle(row)
  if (!cs.display.includes('flex')) {
    throw new Error(`${label}: the row is \`display: ${cs.display}\`, so its children are not on a line at all`)
  }
  const outer = availableWidth(row, vp)
  const room =
    outer -
    num(cs.paddingLeft, outer) -
    num(cs.paddingRight, outer) -
    num(cs.borderLeftWidth) -
    num(cs.borderRightWidth)
  const gap = num(cs.columnGap || cs.gap, room)

  let needed = gap * Math.max(0, items.length - 1)
  for (const item of items) {
    const box = boxOf(item, room)
    expect(box.h, `${label} at ${vp.width}x${vp.height} – a control has no box, so there is nothing to press`).toBeGreaterThan(0)
    needed += rowItemWidth(item, room)
  }
  expect(
    needed,
    `${label} at ${vp.width}x${vp.height} – the controls demand ${needed.toFixed(0)}px of a ${room.toFixed(0)}px row, ` +
      'so they cannot stand beside each other and the row wraps',
  ).toBeLessThanOrEqual(room)
  return room - needed
}

/**
 * A fixed bar of side-by-side controls fits `vp`, and every control in it is pressable.
 *
 * Four things, each failing with its own sentence:
 *  1. the bar is `position: fixed` – it cannot scroll away from under the thumb;
 *  2. its own box lands inside the viewport with its `bottom` offset cleared;
 *  3. every control has a box at all (happy-dom does no layout, so this is the cascade through
 *     `boxOf`, the same instrument `measureDialog` uses);
 *  4. the controls' demanded widths plus the gaps fit the room the bar has. This is the
 *     content-independent half and it is the one a mutation must be able to take away.
 */
export function assertRowFits(bar: Element, items: Element[], vp: Viewport, label: string): number {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – without it this measurement is vacuous')
  }
  const cs = getComputedStyle(bar)
  if (cs.position !== 'fixed') {
    throw new Error(`${label}: the bar is \`${cs.position}\`, not \`fixed\` – it is not pinned to the screen`)
  }
  const maxWidth = lengthPx(cs.maxWidth, vp.width)
  const barWidth = Math.min(vp.width, Number.isFinite(maxWidth) ? maxWidth : Infinity)
  const room = barWidth - num(cs.paddingLeft) - num(cs.paddingRight)
  const gap = num(cs.columnGap || cs.gap)

  let needed = gap * Math.max(0, items.length - 1)
  for (const item of items) {
    const box = boxOf(item, room)
    expect(box.h, `${label} at ${vp.width}x${vp.height} – a control has no box, so there is nothing to press`).toBeGreaterThan(0)
    const top = vp.height - num(cs.bottom) - box.h
    expect(top, `${label} at ${vp.width}x${vp.height} – the bar starts above the top of the screen`).toBeGreaterThan(0)
    needed += demandedWidth(item, room)
  }
  expect(
    needed,
    `${label} at ${vp.width}x${vp.height} – the controls demand ${needed.toFixed(0)}px of a ${room.toFixed(0)}px bar, ` +
      'so one of them is off the side of the phone',
  ).toBeLessThanOrEqual(room)
  return room - needed
}

/** ⭐⭐⭐ THE TWO SHAPES A BLOCKING TAKEOVER CAN BE SAFE IN, and the reason this type exists is that
 *  this file only knew one of them until 22.09 (wave 10).
 *
 *    `card-scrolls`    – round-20 #3's own shape: an INERT full-screen scrim (`.dialog-overlay`:
 *                        `position: fixed; inset: 0; align-items: center`) with a bounded, scrolling
 *                        CARD inside it. The card must declare a height bound that fits, or a card
 *                        taller than the screen is centred and overflows BOTH ends with no scroller
 *                        anywhere in the chain. This is the shape the whole model was fitted to.
 *
 *    `overlay-scrolls` – the OTHER safe shape: the takeover itself is the scroll container
 *                        (`position: fixed; inset: 0; overflow-y: auto`, laid out in flow), so its
 *                        content may be ANY height and every control in it is reachable by
 *                        scrolling. `EndingScreen.vue`'s epilogue is this shape.
 *
 *  ⚠⚠ SCORING THE SECOND SHAPE AS A FAILURE IS WHAT THIS TYPE FIXES, and it was a real false
 *  positive rather than a hypothetical: wave 10 asked this helper about the epilogue and was refused
 *  with «the content is taller than the screen and nothing scrolls» – which was the helper reading
 *  `overflow` off the CARD, where this shape does not put it. That wave asserted the law's two halves
 *  by hand rather than loosen a shared guard mid-wave, and reported the defect; this is the repair.
 *
 *  ⚠⚠ THE ROUND-20 GUARANTEE IS UNTOUCHED, AND IT WAS RE-MEASURED RATHER THAN ASSERTED. The shape is
 *  decided by the OVERLAY's own computed `overflow-y`, and `.dialog-overlay` declares none at all – so
 *  every one of this file's 110 callers still takes the `card-scrolls` path, cap and all. Measured
 *  twice on 22.09: the whole component project is green at **213 files / 2320 tests** with the shape
 *  in place, and stripping `max-height`/`overflow-y` off `.dialog-card` still reddens **41 files /
 *  119 tests** with «the card declares no height bound that fits». A repair that quietly let the
 *  round-20 cases pass would have shown up as a much smaller number there. */
export type DialogShape = 'card-scrolls' | 'overlay-scrolls'

export interface Fit {
  /** which of the two safe shapes this takeover is – see `DialogShape` */
  shape: DialogShape
  /** the OVERLAY is the scroll container, so any content height is reachable */
  overlayScrolls: boolean
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

/** Is this element in the parent's normal FLOW? An absolutely-positioned or fixed child stacks
 *  nothing and is stacked by nothing, and a `display: none` one is not there at all. */
function inFlow(el: Element): boolean {
  const cs = getComputedStyle(el)
  return cs.display !== 'none' && cs.position !== 'absolute' && cs.position !== 'fixed'
}

/** How far `node`'s BORDER-box bottom sits above its parent's CONTENT-box bottom – one level.
 *
 *  ⚠ A ROW PARENT CONTRIBUTES ONLY THE ELEMENT'S OWN MARGIN: siblings sit beside it, not under it,
 *  and under-counting is this file's committed direction.
 *  ⚠ A BLOCK PARENT COLLAPSES ADJACENT MARGINS to the larger – `stackChildren`'s own rule, written
 *  here in the same shape so the two cannot drift. */
function tailWithinParent(node: Element, parent: Element, room: number): number {
  const pcs = getComputedStyle(parent)
  const isFlex = pcs.display.includes('flex')
  const own = num(getComputedStyle(node).marginBottom)
  if (isFlex && pcs.flexDirection !== 'column') return own
  const kids = [...parent.children].filter(inFlow)
  // ⚠⚠ THE INDEX IS CHECKED, AND `npm run pins:check` IS WHAT ASKED FOR IT – rightly, and about the
  // substance rather than about the spelling. A bare `slice(indexOf(...) + 1)` returns EVERY sibling
  // when the index is −1, which here means a dismiss control that is out of its parent's flow
  // (`position: absolute`, `fixed`, `display: none`) would have everything ABOVE it counted as its
  // tail – and an over-counted tail puts the control HIGHER on the screen than it is, which is the
  // lax direction. So it refuses instead.
  const at = kids.indexOf(node)
  if (at < 0) {
    throw new Error(
      'the dismiss control is out of its parent\'s flow (absolute, fixed or display:none), so nothing ' +
        'under it can be measured – read the box a player actually presses',
    )
  }
  const after = kids.slice(at + 1)
  if (after.length === 0) return own
  if (isFlex) {
    const gap = num(pcs.rowGap || pcs.gap)
    let total = own
    for (const kid of after) {
      const box = boxOf(kid, room)
      total += gap + box.marginTop + box.h + box.marginBottom
    }
    return total
  }
  let total = 0
  let prevBottom = own
  for (const kid of after) {
    const box = boxOf(kid, room)
    total += Math.max(prevBottom, box.marginTop) + box.h
    prevBottom = box.marginBottom
  }
  return total + prevBottom
}

/** ⭐⭐ HOW FAR THE ELEMENT'S BORDER-BOX BOTTOM SITS ABOVE THE CARD'S CONTENT-BOX BOTTOM, walking up
 *  through every box between the two.
 *
 *  ⚠⚠ IT EXISTS BECAUSE «THE DISMISS CONTROL IS THE LAST THING IN THE CARD'S FLOW» STOPPED BEING
 *  TRUE. That was this file's standing precondition and it is what let the old model read the box off
 *  the card's bottom edge with one subtraction. The epilogue has TWO ways off it – «Raise another»
 *  and, since v86, the line beside it – so exactly one of them is last and the other could not be
 *  measured at all.
 *
 *  ⚠ WHEN THE CONTROL **IS** LAST THIS RETURNS ITS OWN `marginBottom`, which is precisely the single
 *  subtraction the old model made – so every caller this file had before is byte-identical. */
function tailBelow(card: Element, el: Element, room: number): number {
  let total = 0
  let node: Element = el
  for (;;) {
    const parent = node.parentElement
    if (parent === null) {
      throw new Error('the dismiss control is not inside the card it was measured against')
    }
    total += tailWithinParent(node, parent, room)
    if (parent === card) return total
    total += num(getComputedStyle(parent).paddingBottom) + num(getComputedStyle(parent).borderBottomWidth)
    node = parent
  }
}

/**
 * Measure a blocking takeover against a viewport, in whichever of the two safe shapes it is built in
 * (`DialogShape`).
 *
 * `card` is the box the content lives in – `.dialog-card` in the round-20 shape, the takeover's own
 * content section in the scrolling one; `dismiss` is a control that closes it. Both must be attached
 * to the document (`attachTo: document.body`), or the cascade this reads is not the one the player
 * gets.
 *
 * ⚠ `dismiss` NO LONGER HAS TO BE THE LAST THING IN THE CARD'S FLOW. It did until 22.09, and that
 * precondition is what made the epilogue's second way off it unmeasurable; `tailBelow` walks whatever
 * sits under it now, and returns exactly the old single subtraction when it is last.
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

  // ⭐⭐⭐ WHICH SHAPE IS THIS, AND IT IS READ OFF THE OVERLAY RATHER THAN ASSUMED (see `DialogShape`).
  // `.dialog-overlay` and every other scrim in the app declare no `overflow` at all, so this is
  // `visible` for every caller this file had before 22.09 and they all keep the round-20 rules.
  const overlayScrolls = ocs.overflowY === 'auto' || ocs.overflowY === 'scroll'
  const shape: DialogShape = overlayScrolls ? 'overlay-scrolls' : 'card-scrolls'
  if (shape === 'overlay-scrolls') {
    // ⚠⚠ THE MODEL PLACES ONE BOX IN THE SCROLL FLOW AND WILL NOT GUESS AT A SECOND. A takeover that
    // stacks two sections would need each one's own offset inside the scroller, and a measurement
    // that quietly assumed the card was alone would put the dismiss control at the wrong height while
    // staying green – which is the failure this whole file exists to refuse. Out-of-flow children (a
    // fixed mute button, an absolute scrim) are not in the stack and are not counted.
    const others = [...overlay.children].filter((k) => k !== card && inFlow(k))
    if (others.length > 0) {
      throw new Error(
        `the scrolling takeover has ${others.length} in-flow sibling(s) beside the card ` +
          `(${others.map((k) => k.className || k.tagName).join(', ')}) – this model places one box in the ` +
          'scroll flow, so measure the section that holds the dismiss control and nothing else',
      )
    }
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

  // WHERE THE CARD SITS, and the two shapes put it in two different places.
  //
  //  · `card-scrolls` – `align-items: center`: an item taller than the line box overflows it equally
  //    at both ends. Unchanged, character for character.
  //  · `overlay-scrolls` – the card is laid out in the scroller's FLOW from the top, and «scrolled as
  //    far as it goes» rests its bottom margin edge on the overlay's content-box bottom. A card that
  //    does not overflow never scrolls, so it stays where the flow put it.
  let cardTop: number
  if (shape === 'card-scrolls') {
    cardTop = num(ocs.paddingTop) + (available.height - cardHeight) / 2
  } else {
    const naturalTop = num(ocs.paddingTop) + num(ccs.marginTop)
    const floor = vp.height - num(ocs.paddingBottom) - num(ccs.marginBottom)
    cardTop = naturalTop + cardHeight > floor ? floor - cardHeight : naturalTop
  }
  const cardBottom = cardTop + cardHeight

  // Scrolled to the end, everything under the dismiss control rests on the card's content-box bottom.
  // When NOTHING can scroll, \"scrolled to the end\" is where it already was – which is the bug.
  const dismissBox = boxOf(dismiss, contentWidth)
  const dismissBottom =
    cardBottom - num(ccs.paddingBottom) - num(ccs.borderBottomWidth) - tailBelow(card, dismiss, contentWidth)
  const dismissTop = dismissBottom - dismissBox.h

  return {
    shape,
    overlayScrolls,
    available,
    cardWidth,
    cardHeight,
    contentFloor,
    cap,
    scrollable,
    cardTop,
    cardBottom,
    dismissTop,
    dismissBottom,
  }
}

/**
 * The whole of round-20 #3, as one assertion: on `vp`, the player can reach the control that closes
 * this takeover.
 *
 * Two things have to hold and they fail differently, so both are named:
 *  1. the control's box lands inside the screen once the thing that scrolls is scrolled as far as it
 *     goes, and
 *  2. SOMETHING is bounded and scrolls, so (1) keeps holding when somebody adds a paragraph.
 *
 * ⚠⚠ (2) IS WHERE THE TWO SHAPES PART, and that is the whole of the 22.09 repair. In the round-20
 * shape the CARD has to carry it – a bounded, scrolling card inside an inert scrim – because nothing
 * else in the chain can. In the scrolling-takeover shape the OVERLAY carries it, and a card inside it
 * needs no cap of its own: the content may be any height and every control in it is reachable. See
 * `DialogShape` for why this file only knew the first one until wave 10 refused to loosen it in a
 * hurry.
 */
export function assertDismissReachable(card: Element, dismiss: Element, vp: Viewport, label: string): Fit {
  const fit = measureDialog(card, dismiss, vp)
  const where =
    `${label} at ${vp.width}x${vp.height} [${fit.shape}]: card ${fit.cardWidth.toFixed(0)}x${fit.cardHeight.toFixed(0)} ` +
    `(content wants at least ${fit.contentFloor.toFixed(0)}, cap ${fit.cap === Infinity ? 'NONE' : fit.cap.toFixed(0)}, ` +
    `card ${fit.scrollable ? 'scrolls' : 'does NOT scroll'}, overlay ${fit.overlayScrolls ? 'scrolls' : 'does NOT scroll'}), ` +
    `${fit.available.height.toFixed(0)}px of room`

  if (!fit.overlayScrolls && fit.contentFloor > fit.available.height && !fit.scrollable) {
    throw new Error(`${where} – the content is taller than the screen and nothing scrolls, so the part past the fold cannot be reached at all`)
  }
  if (fit.dismissTop < 0 || fit.dismissBottom > vp.height) {
    throw new Error(`${where} – the dismiss control sits at y=${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)}, outside the viewport`)
  }
  // ⚠ AND THE CONTENT-INDEPENDENT HALF. Everything above is true of TODAY'S copy; this is the one
  // that still holds after the next sentence is added, and it is the actual fix.
  if (fit.shape === 'card-scrolls') {
    expect(
      fit.cap,
      `${where} – the card declares no height bound that fits, so its height is whatever its content happens to be`,
    ).toBeLessThanOrEqual(fit.available.height)
  }
  // ⚠⚠ A SCROLLING TAKEOVER NEEDS NO CAP, WHICH IS NOT THE SAME AS NEEDING NOTHING – and the guard
  // has its teeth through the branch ABOVE rather than through an assertion here. Take `overflow-y`
  // off the takeover and it stops being this shape, so the cap rule applies to a card that declares
  // none and the case goes red on the sentence one line up. Measured, not reasoned: the mutation is
  // in the ledger at the head of tests/component/wave10-dynasty-door.test.ts.
  return fit
}
