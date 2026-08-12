// THE TOP RUN-OFF BAND HAS FOUR TENANTS AND TWO OWNERS, AND THIS IS THE ONLY PLACE THEY MEET.
//
// ⚠ WHY IT EXISTS. Owner, 12.08: «Change sides на время наезжает, надо чуть ниже рисовать эту
// плашку». The "Changing ends" plaque is painted by `courtRenderer` onto the canvas; the Live badge,
// the elapsed clock and the weather plate are HTML inside `.mv-chrome`, absolutely positioned over
// the same canvas. Neither side can see the other, so when R17 #24 put a CLOCK in the middle of that
// band – the plaque had been centred there since 29.07, and the clock did not exist then – the two
// landed on top of each other and nothing anywhere could notice.
//
// ⚠ AND WHY THE HTML HALF IS A DOCUMENTED MEASUREMENT RATHER THAN A MEASURED BOX. `tests/component`
// runs under happy-dom, which has no layout engine: `getBoundingClientRect()` is all zeros and the
// canvas has no 2D context (tests/component/match-viewer.test.ts says so at the top). So the clock's
// rectangle cannot be READ in a test. It is written down here instead, with the arithmetic that
// produces it from declarations a test CAN read, and `round17-surfaces.test.ts` pins those
// declarations so this file's premise fails loudly if anybody moves the row.
import { describe, it, expect } from 'vitest'
import { changingEndsPillBox, CHANGING_ENDS_TEXT } from '../../src/viz/courtRenderer'
import { courtToCanvas } from '../../src/viz/geometry'
import { COURT } from '../../src/viz/types'

/** The fixed logical viewport every match screen draws through – MatchViewer's `CSS_W`/`CSS_H`. It
 *  does not vary with the phone: the canvas is scaled by CSS, so all of this arithmetic is in one
 *  coordinate system at every width. */
const VP = { width: 680, height: 420 }

/** 375pt is the shortest supported phone (style.css) and the owner's own. The canvas paints 341px
 *  wide there – 375 less `--app-pad-x` twice, less the viewer panel's own padding – measured in
 *  Chromium on the shipped build. */
const DISPLAY_SCALE = 341 / VP.width

/** WHAT THE CLOCK OCCUPIES, in display px measured down from the canvas's top edge.
 *
 *  WHERE IT COMES FROM. `.mv-chrome` is `position: absolute; top: 6px` on `.mv-court`; the row is
 *  19px tall because `.mv-live` is 10px text at 1.5 line-height plus 2px of padding each side; and
 *  `.mv-clock` is 11px, centred in that row by `align-items: center`. Those four are declarations in
 *  MatchViewer's style block and `round17-surfaces.test.ts` reads them back off the mounted
 *  component, so this is not a number somebody remembered.
 *
 *  ⚠ AND IT IS AN ENVELOPE, NOT THE BOX. Read live in Chromium at 375pt the clock sits at 7.0..18.0
 *  display px below the canvas edge (`.mv-court` starts a shade above the canvas). 7..21 CONTAINS
 *  that, which is the safe direction for an assertion that says "the plaque is below the clock" -
 *  a band wider than the real one can only make this test stricter, never vacuous. */
const CLOCK_TOP_DISPLAY = 7
const CLOCK_BOTTOM_DISPLAY = 21

/** ⚠ A WIDTH GENEROUS ENOUGH THAT THE TEST CANNOT PASS BY BEING NARROW. `ctx.measureText` needs a
 *  real canvas, so the box function takes the width as a parameter – and the collision this file is
 *  about is vertical, so the number only has to be big enough to guarantee the horizontal overlap
 *  the assertions below claim. 92px is `Changing ends` at 600 13px system-ui, measured in Chromium. */
const TEXT_WIDTH = 92

describe('the top run-off band: the plaque and the clock', () => {
  const pill = changingEndsPillBox(VP, TEXT_WIDTH)
  const surfaceTop = courtToCanvas({ x: -COURT.doublesHalfWidth, y: 0 }, VP).y
  const clockTop = CLOCK_TOP_DISPLAY / DISPLAY_SCALE
  const clockBottom = CLOCK_BOTTOM_DISPLAY / DISPLAY_SCALE

  it('the two are horizontally on top of each other, which is why the fix had to be vertical', () => {
    // Both are centred on the court on purpose. Stated as an assertion rather than a comment so that
    // a future "just move one sideways" is refused by a test rather than by a memory.
    const clockCentre = VP.width / 2
    expect(clockCentre).toBeGreaterThan(pill.x)
    expect(clockCentre).toBeLessThan(pill.x + pill.w)
  })

  it('the plaque clears the clock', () => {
    // ⚠ THE REGRESSION, IN ONE NUMBER, AND BOTH SIDES OF IT WERE READ IN CHROMIUM AT 375pt. Under
    // the shipped `Math.min(surfaceTop / 2, ...)` the pill sat at 26.60..51.60 against a clock at
    // 13.96..35.89 – 9.29 units of OVERLAP, the reading inside the plaque. It now sits at
    // 51.19..76.19: 15.30 units of clear air, and its foot is 2 units off the surface at 78.19.
    // MUTATION: put that `Math.min` back and this line goes red.
    expect(pill.y).toBeGreaterThan(clockBottom)
    // ...and the clock is genuinely the thing above it, not something off the band entirely - which
    // is what makes the assertion above a clearance rather than an accident of two numbers.
    expect(clockTop).toBeGreaterThanOrEqual(0)
    expect(clockTop).toBeLessThan(pill.y)
  })

  it('...and still never touches the playing surface, which is the older rule', () => {
    // Owner, 29.07: nothing overlaps the playing surface. Moving the plaque DOWN is the direction
    // that could break it, so the two rules are asserted together or the fix trades one for the
    // other. MUTATION: drop the `- h / 2 - 2` term and this goes red while the one above stays green.
    expect(pill.y + pill.h).toBeLessThanOrEqual(surfaceTop)
  })

  it('sits at the foot of the band rather than in the middle of it', () => {
    // The positive statement of the fix, so that a change of placement has to be deliberate: the
    // plaque is nearer the surface than it is to the canvas edge.
    const gapAbove = pill.y
    const gapBelow = surfaceTop - (pill.y + pill.h)
    expect(gapBelow).toBeLessThan(gapAbove)
  })

  it('the text and the box are the same fact (the paint cannot drift from the geometry)', () => {
    // `drawChangingEndsOverlay` calls `changingEndsPillBox` with `ctx.measureText(CHANGING_ENDS_TEXT)`,
    // so the only way the painted pill differs from the box asserted above is a different string.
    expect(CHANGING_ENDS_TEXT).toBe('Changing ends')
    expect(pill.w).toBe(TEXT_WIDTH + 24)
    expect(pill.h).toBe(25)
  })

  it('clamps to the canvas edge rather than onto the court if the band is ever too short', () => {
    // The pre-existing guarantee, kept: a viewport whose run-off band cannot hold the pill pins it
    // 2 units below the canvas top instead of letting it back over the playing surface.
    const squashed = changingEndsPillBox({ width: 680, height: 120 }, TEXT_WIDTH)
    expect(squashed.y).toBe(2)
  })
})
