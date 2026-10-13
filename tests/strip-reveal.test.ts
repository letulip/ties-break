// R51 №1a – THE ARITHMETIC THAT KEEPS A SCROLLING PILL STRIP'S PRESSED PILL IN SIGHT (src/composables/stripReveal.ts).
//
// WHY THIS IS A UNIT FILE AND NOT ONLY THE MOUNTED ONE. The arithmetic is a pure function of six numbers, so it can be
// asked every edge case for nothing – the first pill, the last, a pill wider than the strip, a strip that does not
// overflow – whereas happy-dom has no layout and a mounted screen can only be handed stubbed rectangles
// (`tests/component/r51-money-tabs-strip.test.ts` does that once, to prove the WIRING). The real geometry is
// `e2e/r51-money-tabs.spec.ts`, in Chromium.
//
// ⚠ THE ONE NEGATIVE CLAIM IS BEHAVIOURAL, NOT A SOURCE PIN: the wrapper must never call `scrollIntoView`. That call
// walks every scrollable ancestor and on the Family-budget screen the ancestor that scrolls is the DOCUMENT, so a
// chapter switch from the bottom of Spending would drag the page up with it. The arm hands the wrapper a pill whose
// `scrollIntoView` is a spy; a grep of the source for the word would pass on a comment and fail on a rename.
import { describe, expect, it, vi } from 'vitest'
import { REVEAL_AIR, revealActivePill, revealScrollLeft, type StripView } from '../src/composables/stripReveal'

/** A strip 343 px wide holding 437 px of pills (the Russian chapter row at 375, measured), scrolled to `scrollLeft`. */
const strip = (scrollLeft: number, clientWidth = 343, scrollWidth = 437): StripView => ({ scrollLeft, clientWidth, scrollWidth })

describe('revealScrollLeft – the smallest move that brings a pill fully into sight', () => {
  it('a pill already fully inside the strip does not move it – no re-centring under the player\'s thumb', () => {
    expect(revealScrollLeft(strip(0), { left: 98, right: 244 })).toBe(0)
    expect(revealScrollLeft(strip(50), { left: 98, right: 244 })).toBe(50)
  })

  it('a pill cut by the right edge is brought to that edge, plus the air', () => {
    // pill spans 300..400 in scroll coordinates, the strip shows 0..343: its right edge needs 400 + air - 343.
    expect(revealScrollLeft(strip(0), { left: 300, right: 400 })).toBe(400 + REVEAL_AIR - 343)
  })

  it('a pill cut by the left edge is brought to that edge, minus the air', () => {
    // strip scrolled to 90 shows 90..433; the pill at 60..150 is cut on the left.
    expect(revealScrollLeft(strip(90), { left: 60, right: 150 })).toBe(60 - REVEAL_AIR)
  })

  it('never asks for a negative offset (the first pill) or one past the end (the last pill)', () => {
    expect(revealScrollLeft(strip(40), { left: 0, right: 95 })).toBe(0)
    // the last pill ends at 437 = the content's end: air would overshoot, the clamp returns max = 437 - 343.
    expect(revealScrollLeft(strip(0), { left: 342, right: 437 })).toBe(437 - 343)
  })

  it('a strip that does not overflow never moves, whatever it is asked', () => {
    expect(revealScrollLeft(strip(0, 343, 343), { left: 200, right: 340 })).toBe(0)
    expect(revealScrollLeft(strip(0, 343, 300), { left: 250, right: 340 })).toBe(0)
  })

  it('a pill WIDER than the strip: its leading edge wins, because the first letters say which pill it is', () => {
    expect(revealScrollLeft(strip(0, 200, 500), { left: 120, right: 400 })).toBe(120 - REVEAL_AIR)
    expect(revealScrollLeft(strip(300, 200, 500), { left: 120, right: 400 })).toBe(120 - REVEAL_AIR)
  })
})

/** A duck-typed strip and pill: the wrapper needs no DOM, only the handful of members it reads. `stripLeft` is where the
 *  strip sits on screen; `pillLeft` where the pressed pill sits on screen. */
function fakes(opts: { stripLeft: number; pillLeft: number; pillWidth: number; scrollLeft: number; withScrollTo?: boolean }) {
  const scrollIntoView = vi.fn()
  const pill = {
    getBoundingClientRect: () => ({ left: opts.pillLeft, width: opts.pillWidth }),
    scrollIntoView,
  }
  const scrollTo = vi.fn()
  const el = {
    scrollLeft: opts.scrollLeft,
    clientWidth: 343,
    scrollWidth: 437,
    clientLeft: 0,
    getBoundingClientRect: () => ({ left: opts.stripLeft }),
    querySelector: vi.fn((selector: string) => (selector === '[aria-pressed="true"]' ? pill : null)),
    ...(opts.withScrollTo === false ? {} : { scrollTo }),
  }
  return { el: el as unknown as HTMLElement, raw: el, pill, scrollIntoView, scrollTo }
}

describe('revealActivePill – the wrapper moves the strip and only the strip', () => {
  it('reads the pressed pill, converts the screen rectangles to scroll coordinates and scrolls the strip once', () => {
    // strip on screen from x=16; the pressed pill is on screen at 340..435 while the strip is already scrolled 20:
    // in the strip's own coordinates the pill is at 340 - 16 + 20 = 344 .. 439, which overshoots the 20..363 view; the
    // pill's right edge plus the air asks for 104, and the strip can only scroll 437 - 343 = 94, so the clamp answers.
    const f = fakes({ stripLeft: 16, pillLeft: 340, pillWidth: 95, scrollLeft: 20 })
    revealActivePill(f.el, 'smooth')
    expect(f.scrollTo).toHaveBeenCalledTimes(1)
    expect(f.scrollTo).toHaveBeenCalledWith({ left: 94, behavior: 'smooth' })
  })

  it('⚠ NEVER calls scrollIntoView on the pill – that is the call that drags the page vertically too', () => {
    const f = fakes({ stripLeft: 16, pillLeft: 340, pillWidth: 95, scrollLeft: 0 })
    revealActivePill(f.el, 'auto')
    expect(f.scrollTo).toHaveBeenCalled()
    expect(f.scrollIntoView).not.toHaveBeenCalled()
  })

  it('a pill already in view is a no-op: the strip is not touched at all', () => {
    const f = fakes({ stripLeft: 16, pillLeft: 18, pillWidth: 95, scrollLeft: 0 })
    revealActivePill(f.el)
    expect(f.scrollTo).not.toHaveBeenCalled()
    expect(f.raw.scrollLeft).toBe(0)
  })

  it('no strip, or a strip with nothing pressed, is a no-op rather than a throw', () => {
    expect(() => revealActivePill(null)).not.toThrow()
    expect(() => revealActivePill(undefined)).not.toThrow()
    const f = fakes({ stripLeft: 16, pillLeft: 340, pillWidth: 95, scrollLeft: 0 })
    f.raw.querySelector.mockReturnValue(null)
    revealActivePill(f.el)
    expect(f.scrollTo).not.toHaveBeenCalled()
  })

  it('a runner without Element.scrollTo still gets the write, only without the glide', () => {
    const f = fakes({ stripLeft: 16, pillLeft: 340, pillWidth: 95, scrollLeft: 0, withScrollTo: false })
    revealActivePill(f.el, 'smooth')
    expect(f.raw.scrollLeft).toBeGreaterThan(0)
  })
})
