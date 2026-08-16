// ⭐ 16.08, MOUNTED – THE COACH-MARK TOUR: IT WALKS, IT CLOSES, AND IT STAYS ON THE PHONE.
//
// The owner, after a playtester met the app cold: the onboarding that explained the functions and
// the interface is gone, and the interface is not the simplest. Two different things had to be true
// again, and only one of them is about the shell's gate (that half is e2e/onboarding-tour.spec.ts,
// which reproduces the actual defect across a real reload). This file owns the other half: the
// component itself – what it says, that a player can get through it, and that the card carrying its
// only two buttons cannot leave the screen.
//
// ⚠ WHY THE LAST ONE IS NOT OPTIONAL. CLAUDE.md's gotcha, from round-20 #3: "any dialog you add or
// lengthen gets a mounted assertion that its dismiss control's box is inside a 375x667 viewport."
// This wave lengthened the tour from five marks to eleven and gave several of them a second
// sentence, and `.coach-tooltip` declares no `max-height` and no `overflow` – exactly the shape that
// took `TourBriefingDialog`'s Continue button 188px below the fold. The tour is worse in one respect
// and better in another: it is NOT blocking (`.coach-tour` is `pointer-events: none` everywhere but
// the card, so a career cannot stop here), but its card is positioned from a MEASURED ANCHOR RECT
// rather than centred, so it can be pushed off the screen by an element that is merely low on the
// page. docs/review/05-ux-ui-pwa.md filed that as [MEDIUM] before this wave; composables/coachTour.ts
// is the fix and this file is the proof.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT ENGINE, so the card's real height cannot be read here – see
// `./fits.ts`'s header for the whole argument and for the fitted glyph advance. The same content
// model is used: `boxOf` computes the card's border-box height from the REAL cascade (the component
// project runs with `css: true` and this file imports the app's own stylesheet), and that number is
// then fed back into the component through a stubbed `getBoundingClientRect`, so the arithmetic
// under test is the component's own, on the height a browser would have given it.
//
// ⚠ MUTATION-VERIFIED, each naming what was broken to watch it fail:
//   * the final `clamp(top, …)` in `tooltipBox` replaced by the raw `top`
//                                        -> the phone-fit block goes red on the marks that point at
//                                           the bottom bar, naming the step and the y it left at.
//   * the horizontal clamp dropped       -> the same block goes red on `left`.
//   * `STEPS` cut back to the first five -> "it introduces every part of the shell" goes red.
//   * `emit('done')` dropped from `skip()`
//                                        -> "Skip tour closes it from any step" goes red.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
// The app's own stylesheet: without it `.coach-tooltip`'s width, padding and type sizes resolve to
// nothing and every measurement below is vacuous.
import '../../src/style.css'
import { boxOf, setViewport, PHONE, NARROW_PHONE } from './fits'
import { TOOLTIP_WIDTH, TOUR_MARGIN, tooltipBox } from '../../src/composables/coachTour'
import OnboardingTour from '../../src/components/OnboardingTour.vue'

/** The anchors the tour names, with the rects a 375x667 phone really produces for them.
 *
 *  ⚠ THESE ARE THE HARD ONES ON PURPOSE. The hero is a full-bleed SQUARE, so on a 375-wide screen it
 *  is 375 tall and a card hung BELOW it starts at y=389 with 278px of screen left – which is where
 *  the old five-step tour still just fitted, and why nobody noticed. The bottom bar sits at the very
 *  bottom, so the four tab marks hang their card ABOVE it, and Home's two cards are below the fold
 *  entirely (`scrollIntoView` brings them up in a real browser; here the rect is given as measured
 *  after that scroll). `next-week` is the floating pill just above the bar. */
const ANCHORS: Record<string, { top: number; height: number; left: number; width: number }> = {
  'home-header': { top: 0, height: 387, left: 0, width: 375 },
  'kid-avatar': { top: 22, height: 36, left: 12, width: 36 },
  'home-news': { top: 22, height: 30, left: 258, width: 30 },
  'home-settings': { top: 22, height: 30, left: 334, width: 30 },
  'family-budget': { top: 300, height: 190, left: 192, width: 170 },
  'next-tournament': { top: 300, height: 190, left: 13, width: 170 },
  'tab-play': { top: 611, height: 56, left: 0, width: 75 },
  'tab-calendar': { top: 611, height: 56, left: 75, width: 75 },
  'tab-stats': { top: 611, height: 56, left: 225, width: 75 },
  'tab-trophies': { top: 611, height: 56, left: 300, width: 75 },
  'next-week': { top: 540, height: 48, left: 24, width: 327 },
}

function rectOf(a: { top: number; height: number; left: number; width: number }): DOMRect {
  return {
    top: a.top,
    bottom: a.top + a.height,
    height: a.height,
    left: a.left,
    right: a.left + a.width,
    width: a.width,
    x: a.left,
    y: a.top,
    toJSON: () => ({}),
  } as DOMRect
}

/** Put a real element in the document for every anchor, each answering with its phone rect. The tour
 *  finds them by `document.querySelector`, exactly as it does in the app. */
function plantAnchors(rects: Record<string, { top: number; height: number; left: number; width: number }>): void {
  for (const [anchor, box] of Object.entries(rects)) {
    const el = document.createElement('div')
    el.setAttribute('data-tour', anchor)
    Object.defineProperty(el, 'getBoundingClientRect', { value: () => rectOf(box) })
    document.body.appendChild(el)
  }
}

/** Feed the component the height the card would really have, computed from the real cascade, and
 *  make it re-measure. Returns that height so the assertions can use the same number. */
function syncCardHeight(): number {
  const card = document.querySelector('.coach-tooltip') as HTMLElement
  const height = boxOf(card, TOOLTIP_WIDTH).h
  Object.defineProperty(card, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ ...rectOf({ top: 0, height, left: 0, width: TOOLTIP_WIDTH }) }),
  })
  window.dispatchEvent(new Event('resize'))
  return height
}

/** The card's own top/left, as the component put them in its inline style. */
function cardPosition(): { left: number; top: number } {
  const card = document.querySelector('.coach-tooltip') as HTMLElement
  return { left: parseFloat(card.style.left), top: parseFloat(card.style.top) }
}

let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = ''
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

async function openTour(vp = PHONE): Promise<VueWrapper> {
  setViewport(vp)
  plantAnchors(ANCHORS)
  const w = mount(OnboardingTour, { attachTo: document.body })
  await w.vm.$nextTick()
  wrapper = w
  return w
}

const nextButton = (w: VueWrapper) => w.findAll('.coach-tooltip-actions button').at(1)!
const skipButton = (w: VueWrapper) => w.findAll('.coach-tooltip-actions button').at(0)!

// =================================================================================================
// What it says
// =================================================================================================
describe('the tour introduces every part of the shell', () => {
  it('walks from the diary to the week button, one mark at a time', async () => {
    const w = await openTour()
    const titles: string[] = []
    const bodies: string[] = []
    for (;;) {
      titles.push(w.find('.coach-tooltip-title').text())
      bodies.push(w.find('.coach-tooltip-text').text())
      const btn = nextButton(w)
      if (btn.text() === 'Got it') break
      await btn.trigger('click')
    }

    // ⚠ THE CLAIM IS COVERAGE, NOT WORDING. The owner's complaint is that the interface was never
    // explained, so what is asserted is that each surface a player has to find is NAMED - the header
    // markers, the money, the week ahead, and every tab that is not Home. Rewriting a sentence must
    // not break this test; deleting a step must.
    const all = `${titles.join(' | ')} :: ${bodies.join(' ')}`
    for (const surface of ['Home', 'photo', 'bell', 'envelope', 'budget', 'Season', 'Calendar', 'Stats', 'Trophies', 'Settings']) {
      expect(all, `the tour never mentions ${surface}`).toContain(surface)
    }
    // The loop, said out loud - the thing a player has to understand to play at all.
    expect(all).toMatch(/one week|a week/)
    expect(titles.length, 'the tour is longer than the five marks it used to be').toBeGreaterThanOrEqual(10)
    // One dot per step, so the player can see how far in they are.
    expect(w.findAll('.coach-dots .dot').length).toBe(titles.length)
  })

  it('every step points at an anchor that exists on Home or in the bottom bar', async () => {
    const w = await openTour()
    // The tour must never highlight nothing: an anchor it cannot find leaves the spotlight hidden
    // and the card floating in the middle of the screen with no referent.
    for (;;) {
      expect(
        (w.find('.coach-highlight').element as HTMLElement).style.display,
        `step "${w.find('.coach-tooltip-title').text()}" found no element to point at`,
      ).not.toBe('none')
      const btn = nextButton(w)
      if (btn.text() === 'Got it') break
      await btn.trigger('click')
    }
  })
})

// =================================================================================================
// How it closes
// =================================================================================================
describe('a player can always get out of it', () => {
  it('the last step says Got it and closes', async () => {
    const w = await openTour()
    while (nextButton(w).text() !== 'Got it') await nextButton(w).trigger('click')
    expect(w.emitted('done')).toBeUndefined()
    await nextButton(w).trigger('click')
    expect(w.emitted('done')).toHaveLength(1)
  })

  it('Skip tour closes it from any step', async () => {
    for (const stepsIn of [0, 3, 7]) {
      document.body.innerHTML = ''
      const w = await openTour()
      for (let i = 0; i < stepsIn; i++) await nextButton(w).trigger('click')
      await skipButton(w).trigger('click')
      expect(w.emitted('done'), `Skip did nothing at step ${stepsIn}`).toHaveLength(1)
      w.unmount()
    }
    wrapper = null
  })
})

// =================================================================================================
// ⭐ THE ROUND-20 #3 GUARD, ONE LAYER OUT: THE CARD CANNOT LEAVE THE PHONE
// =================================================================================================
//
// The dismiss controls are the LAST row of content in the card (`.coach-tooltip-actions`, followed
// only by the progress dots), and the card has no scroll of its own – so "can the player reach Skip
// and Next" is answered by where the card's own box lands. Both are asserted: the card, and then the
// actions row inside it, because it is the row that is the control.
describe('⭐ the coach-mark card stays inside the screen', () => {
  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`every step fits at ${vp.width}x${vp.height}`, async () => {
      const w = await openTour(vp)
      for (;;) {
        const title = w.find('.coach-tooltip-title').text()
        const height = syncCardHeight()
        await w.vm.$nextTick()
        const { left, top } = cardPosition()

        expect(top, `"${title}": the card starts above the top of the screen`).toBeGreaterThanOrEqual(0)
        expect(
          top + height,
          `"${title}": the card ends at y=${(top + height).toFixed(0)} on a ${vp.height}px screen`,
        ).toBeLessThanOrEqual(vp.height)
        expect(left, `"${title}": the card starts left of the screen`).toBeGreaterThanOrEqual(0)
        expect(left + TOOLTIP_WIDTH, `"${title}": the card runs off the right edge`).toBeLessThanOrEqual(vp.width)

        // THE CONTROL ITSELF. Its box is stacked from the card's own top: border, padding, the title,
        // the text, and then the row. Modelled from the real cascade, the same floor `fits.ts` uses.
        const card = document.querySelector('.coach-tooltip') as HTMLElement
        const cs = getComputedStyle(card)
        const inner = TOOLTIP_WIDTH - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2 * parseFloat(cs.borderTopWidth)
        let offset = parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop)
        for (const child of [...card.children]) {
          const box = boxOf(child, inner)
          if (child.classList.contains('coach-tooltip-actions')) {
            const rowTop = top + offset + box.marginTop
            expect(rowTop, `"${title}": Skip/Next start above the screen`).toBeGreaterThanOrEqual(0)
            expect(
              rowTop + box.h,
              `"${title}": Skip and Next sit at y=${rowTop.toFixed(0)}..${(rowTop + box.h).toFixed(0)}, outside a ${vp.height}px screen`,
            ).toBeLessThanOrEqual(vp.height)
            break
          }
          offset += box.marginTop + box.h + box.marginBottom
        }

        const btn = nextButton(w)
        if (btn.text() === 'Got it') break
        await btn.trigger('click')
      }
    })
  }

  // ⚠ AND THE HALF THAT ANSWERS "A DIALOG GROWS BY ONE HONEST SENTENCE AT A TIME AND NOTHING
  // OBJECTS" – CLAUDE.md's own description of how round-20 #3 happened. The block above measures
  // TODAY'S copy, and today's copy fits at 375x667 whether or not anything clamps it: the hero step
  // ends at y=593 with 74px to spare, which is exactly the margin that let the unclamped version
  // ship. So the same anchors are re-run against a card that has GROWN – every real anchor, both
  // placements, up to a card two thirds taller than the tallest one shipped. Without the clamp this
  // fails at 375x667 by name, which is the viewport CLAUDE.md's gotcha names.
  it('⭐ the real anchors still hold a card that grew, on the phone', () => {
    for (const [anchor, a] of Object.entries(ANCHORS)) {
      const rect = { top: a.top, bottom: a.top + a.height, left: a.left, width: a.width }
      for (const placement of ['above', 'below'] as const) {
        for (const h of [150, 220, 300, 380]) {
          const box = tooltipBox(rect, placement, h, PHONE)
          const where = `${anchor}, card drawn ${placement} at ${h}px tall`
          expect(box.top, where).toBeGreaterThanOrEqual(0)
          expect(box.top + h, `${where}: it ends at y=${(box.top + h).toFixed(0)} on a 667px screen`).toBeLessThanOrEqual(PHONE.height)
          expect(box.left, where).toBeGreaterThanOrEqual(0)
          expect(box.left + TOOLTIP_WIDTH, where).toBeLessThanOrEqual(PHONE.width)
        }
      }
    }
  })

  // ⚠ THE HALF THAT SURVIVES THE NEXT SENTENCE SOMEBODY ADDS. Everything above is true of today's
  // copy; this is the content-independent property, and it is the actual fix: whatever the anchor
  // and whatever the height, the returned box is inside the viewport. Stated against the rule rather
  // than the component, because the adversarial inputs (an anchor off the bottom of the screen, a
  // card taller than the phone) are ones the app can produce but this mount cannot be posed in.
  it('the rule holds for anchors and heights the app has not produced yet', () => {
    const vp = { width: 375, height: 667 }
    const wild = [
      { top: -400, bottom: -320, left: -80, width: 40 },
      { top: 660, bottom: 900, left: 340, width: 200 },
      { top: 0, bottom: 667, left: 0, width: 375 },
      { top: 333, bottom: 334, left: 187, width: 1 },
    ]
    for (const rect of wild) {
      for (const placement of ['above', 'below'] as const) {
        for (const h of [80, 200, 320, 480]) {
          const box = tooltipBox(rect, placement, h, vp)
          const where = `${placement} of ${JSON.stringify(rect)} at h=${h}`
          expect(box.top, where).toBeGreaterThanOrEqual(0)
          expect(box.top + h, where).toBeLessThanOrEqual(vp.height)
          expect(box.left, where).toBeGreaterThanOrEqual(0)
          expect(box.left + TOOLTIP_WIDTH, where).toBeLessThanOrEqual(vp.width)
        }
      }
      // A step whose element is not on this screen at all still shows its words, centred.
      const centred = tooltipBox(null, 'below', 200, vp)
      expect(centred.top).toBeGreaterThanOrEqual(TOUR_MARGIN)
      expect(centred.top + 200).toBeLessThanOrEqual(vp.height)
    }
  })

  // The one number this model shares with the stylesheet. If the card is ever re-sized in CSS and
  // not here, every horizontal assertion above silently starts measuring the wrong box.
  it('TOOLTIP_WIDTH is the width the stylesheet actually gives the card', async () => {
    await openTour()
    const card = document.querySelector('.coach-tooltip') as HTMLElement
    expect(getComputedStyle(card).width).toBe(`${TOOLTIP_WIDTH}px`)
  })
})
