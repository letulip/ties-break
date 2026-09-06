// ⭐⭐ U-11 AND E-06, ON THE ONE SCREEN THEY BOTH LAND ON.
//
// U-11 (docs/review-principles-2026-09-05/03-ui.md): `OnboardingWizard.vue`'s welcome section
// carries `aria-labelledby="ob-hero-title"` and NOTHING in the file owned that id – the heading it
// names had it as a CLASS. A dangling `aria-labelledby` is not a degraded label, it is no label:
// the browser resolves the reference to nothing and the section's accessible name is the empty
// string. One attribute, no wording moved.
//
// E-06 is the other half, and it is here because the owner's own gotcha demands it: "a dialog grows
// by one honest sentence at a time" is how a blocking overlay's dismiss control left the screen and
// stopped a career (round-20 #3, tests/component/fits.ts). The three refusals proposed on 06.09 are
// player-facing, and the ONE that renders on a takeover renders here – `<p v-if="game.error">` on
// the wizard's last step. So its screen is measured on a phone.
//
// ⚠ THE MEASUREMENT IS STRUCTURAL RATHER THAN A HEIGHT BUDGET, and that is the stronger claim. The
// wizard is `.onboarding` (`position: fixed; inset: 0`, a column) -> `.ob-shell` (`flex: 1;
// min-height: 0`) -> `.tb-screen-body` (the same pair) -> `.ob-pane` (`flex: 1; min-height: 0;
// overflow-y: auto`), with the CTA in `ScreenShell`'s `.tb-screen-foot`, which is `flex: none`. So
// the refusal lands in a bounded SCROLLPORT and the control sits under it: the sentence cannot push
// the button off the screen however long it grows. That is exactly `assertDismissReachable`'s
// content-independent half, which is the half round-20 #4 actually asked for – and it is why the
// arms below assert the chain rather than today's pixel count.
//
// ⚠ THE ORDER IS `setViewport` -> mount -> read (fits.ts, beside TABLET): happy-dom evaluates a
// media query on an element's FIRST computed-style read and caches it.
//
// ⚠ MUTATION-VERIFIED – what each mutation reddened is written above the block.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import { useGameStore } from '../../src/stores/game'
import { PROFILE_NAME_MAX_CHARS } from '../../src/shared/protocol'
import { PHONE, boxOf, setViewport } from './fits'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

function mountWizard(): VueWrapper {
  return mount(OnboardingWizard, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

describe('U-11 – the welcome section really is labelled by the heading it names', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })
  afterEach(() => setViewport(PHONE))

  // MUTATION-VERIFIED: the `id="ob-hero-title"` removed from the `<h1>` -> both arms red, the first
  // on "no element owns it" and the second on the empty accessible name.
  it('the id the attribute points at exists, and it is the hero heading', async () => {
    const wrapper = mountWizard()
    await nextTick()

    const section = document.querySelector('.ob-welcome')
    expect(section, 'the welcome step is on screen').not.toBeNull()
    const names = section!.getAttribute('aria-labelledby')
    expect(names, 'the section still declares a label').toBe('ob-hero-title')

    // The whole of U-11: every id in the list resolves to an element that is really there.
    for (const id of names!.split(/\s+/)) {
      const target = document.getElementById(id)
      expect(target, `nothing in the document owns id="${id}", so the section has no name`).not.toBeNull()
      // ...and it is a heading with words in it, not an empty box that merely has the id.
      expect(target!.textContent?.trim().length, `#${id} is empty, so the name is still nothing`).toBeGreaterThan(0)
    }
    const heading = document.getElementById('ob-hero-title')!
    expect(heading.tagName).toBe('H1')
    expect(heading.classList.contains('ob-hero-title'), 'the class it always had is untouched').toBe(true)

    wrapper.unmount()
  })

  // MUTATION-VERIFIED: `id="ob-gender-label"` removed from the Gender span -> red. It is the file's
  // OTHER `aria-labelledby` and it was already sound; this arm is what proves the sweep above is
  // testing the reference and not the one id it was pointed at.
  it('...and so is every other aria-labelledby in the wizard, on every step', async () => {
    const wrapper = mountWizard()
    await nextTick()
    for (let step = 1; step <= 6; step += 1) {
      for (const el of document.querySelectorAll('[aria-labelledby]')) {
        for (const id of el.getAttribute('aria-labelledby')!.split(/\s+/)) {
          expect(document.getElementById(id), `step ${step}: nothing owns id="${id}"`).not.toBeNull()
        }
      }
      const cta = wrapper.find('.ob-cta')
      if (cta.exists()) await cta.trigger('click')
      await nextTick()
    }
    wrapper.unmount()
  })
})

// =================================================================================================
// E-06's SENTENCE, ON A 375x667 PHONE
// =================================================================================================
//
// MUTATION-VERIFIED: `.ob-pane`'s `overflow-y: auto` changed to `visible` -> the scrollport arm red;
// the error `<p>` moved out of the `<section>` and into the `#footer` slot -> the "it is inside the
// scrollport" arm red; `.tb-screen-foot`'s `flex: none` changed to `flex: 1` -> the room arm red.
describe('E-06 – the new-career refusal cannot push the wizard\'s own control off a phone', () => {
  /** The longest of the three sentences proposed on 06.09, in the form the store writes it. */
  const LONGEST_REFUSAL = `New career: A first name is at most ${PROFILE_NAME_MAX_CHARS} characters`

  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })
  afterEach(() => setViewport(PHONE))

  /** Walk to the last step, where the wizard renders `game.error`, and put `text` in it.
   *
   *  ⚠ THE COUNTRY STEP IS A REAL GATE, not furniture to click past: `profile.country` starts as ''
   *  and `nextDisabled` holds step 3 until a tile is pressed. Answering it the way a player does is
   *  also what keeps this walk honest – a `step.value = 6` shortcut would measure a screen no player
   *  can reach. */
  async function refusalOnScreen(text: string): Promise<VueWrapper> {
    const wrapper = mountWizard()
    await nextTick()
    for (let i = 0; i < 6 && !document.querySelector('.ob-summary'); i += 1) {
      const tile = wrapper.find('.ob-tile')
      if (tile.exists()) {
        await tile.trigger('click')
        await nextTick()
      }
      await wrapper.find('.ob-cta').trigger('click')
      await nextTick()
    }
    expect(document.querySelector('.ob-summary'), 'the wizard reached its last step').not.toBeNull()
    useGameStore().error = text
    await nextTick()
    return wrapper
  }

  it('the refusal renders inside the bounded scrollport, and the CTA is not in it', async () => {
    assertSheetPresent()
    const wrapper = await refusalOnScreen(LONGEST_REFUSAL)

    const line = document.querySelector('p.error')
    expect(line, 'the wizard shows the refusal at all').not.toBeNull()
    expect(line!.textContent).toBe(LONGEST_REFUSAL)

    // 1. IT IS INSIDE THE SCROLLPORT. `.ob-pane` is what absorbs a paragraph; a refusal rendered
    //    outside it would grow the column instead.
    const pane = line!.closest('.ob-pane')
    expect(pane, 'the refusal is not inside .ob-pane, so nothing bounds it').not.toBeNull()

    // 2. AND THE SCROLLPORT REALLY IS ONE – the `min-height: 0` / `overflow-y: auto` pair, which is
    //    the content-independent half: past this, no amount of future copy can move the control.
    const paneStyle = getComputedStyle(pane!)
    expect(paneStyle.overflowY, '.ob-pane does not scroll, so its content pushes the column').toBe('auto')
    // ⚠ happy-dom answers a unitless `0` here where a browser answers `0px`; both are the rule being
    // present, and `auto` / '' is its absence, which is the state this arm exists to catch.
    expect(['0', '0px'], '.ob-pane cannot bound itself without min-height: 0').toContain(paneStyle.minHeight)

    // 3. THE CONTROL IS THE FOOTER'S, and the footer is out of the body's flow.
    const foot = document.querySelector('.tb-screen-foot')
    expect(foot, 'the wizard has a footer').not.toBeNull()
    expect(foot!.contains(line!), 'the refusal is in the footer, where it CAN displace the control').toBe(false)
    expect(foot!.querySelector('.ob-cta'), 'the Start control is in the footer').not.toBeNull()

    // 4. AND THE TAKEOVER IS PINNED TO THE VIEWPORT, so the column above is the screen and not the page.
    const takeover = document.querySelector('.onboarding')!
    expect(getComputedStyle(takeover).position).toBe('fixed')

    wrapper.unmount()
  })

  it('⚠ …and the room is there for it: head + foot fit inside 375x667 with the refusal on screen', async () => {
    assertSheetPresent()
    const wrapper = await refusalOnScreen(LONGEST_REFUSAL)

    const head = document.querySelector('.tb-screen-head')!
    const foot = document.querySelector('.tb-screen-foot')!
    const headBox = boxOf(head, PHONE.width)
    const footBox = boxOf(foot, PHONE.width)
    const fixed = headBox.marginTop + headBox.h + headBox.marginBottom + footBox.marginTop + footBox.h + footBox.marginBottom

    expect(footBox.h, 'the footer has no box, so there is nothing to press').toBeGreaterThan(0)
    expect(
      fixed,
      `the rail and the footer alone demand ${fixed.toFixed(0)}px of a ${PHONE.height}px screen, ` +
        'so the body they sandwich has nowhere to be',
    ).toBeLessThan(PHONE.height)

    wrapper.unmount()
  })

  it('⚠ …and it still holds for a refusal ten times as long, which is the actual property', async () => {
    // The content-independent half, stated as a measurement: the fixed furniture does not move when
    // the sentence does, because the sentence is in the scrollport. A test that only measured
    // TODAY'S copy is the test round-20 #3 already had.
    assertSheetPresent()
    const wrapper = await refusalOnScreen(`${LONGEST_REFUSAL} `.repeat(10).trim())

    const foot = document.querySelector('.tb-screen-foot')!
    const footBox = boxOf(foot, PHONE.width)
    const head = document.querySelector('.tb-screen-head')!
    const headBox = boxOf(head, PHONE.width)
    expect(headBox.h + footBox.h).toBeLessThan(PHONE.height)
    expect(document.querySelector('p.error')!.closest('.ob-pane'), 'the long line is still bounded').not.toBeNull()

    wrapper.unmount()
  })
})
