// THE TWO TOP BANNERS, AND THE ONE CLAIM THIS FILE CAN HONESTLY MAKE ABOUT THEM.
//
// Defect D11 (docs/specs/e2e-coverage.md §12): App.vue draws two strips at the top of the page - the
// damaged-autosave notice and the stop toast - they can be on screen together, and each carried a
// button that said `Dismiss` and nothing else. Two identical names, one shape, one position: a
// strict-mode collision for a test, and for anyone reading the screen, two grey strips with the same
// word on the same button.
//
// ⚠⚠ RE-AIMED, ROUND 28 #10 – THE OWNER OVERRULED D11's CHOICE OF LAYER, NOT ITS FINDING. D11 fixed
// it in the VISIBLE copy (`Dismiss autosave notice` / `Dismiss stop notice`) on the reasoning that a
// label under the button would leave a sighted player with the ambiguity that started it. The owner,
// playing the build, read the result the other way round - his words are in docs/rounds/round-28.md
// item 10 - and ruled the visible word back to `Dismiss` alone. So the visible copy is one word and
// the DISAMBIGUATION MOVED TO `aria-label`, which is where this file now points.
//
// ⚠ NOTHING WAS WEAKENED, AND THE CLAIM GOT STRONGER RATHER THAN SOFTER. D11's assertion was the
// defect stated backwards - "no control in this file is called `Dismiss` and nothing else" - because
// a source pin cannot say what a rendered control looks like, and App.vue could not be mounted:
// `src/pwa.ts` imports `virtual:pwa-register`, which the VitePWA plugin injects at build time and
// which therefore did not resolve under Vitest. THAT IS FIXED IN THIS ROUND (an alias on the
// `component` project alone - see vite.config.ts and tests/component/stubs/pwa-register.ts), so the
// forward claim is made where it belongs: **tests/component/round28-top-notices.test.ts** mounts the
// shell, raises both strips at once and asserts the rendered text is exactly `Dismiss` on each and
// that their accessible names still differ.
//
// ⚠ THE E2E LAYER STILL CANNOT PRODUCE THE BANNER, and that finding is kept because it is measured
// rather than assumed: a stop speaks through the toast only when its reason has copy, and
// `injury` / `tournament` / `season-end` deliberately have none (each owns a dialog instead). That
// leaves `funds`, and the only fixture under water - `broke` - sits at ELEVEN debt weeks against a
// twelve-week grace window, so the advance that would raise the toast raises the bankruptcy ENDING
// and the epilogue replaces the shell. The spec was written, run, and failed on the epilogue; the
// note in e2e/week-advance.spec.ts records what a fixture would have to look like. The component
// layer is what changed in this round, not that one.
//
// What is left here is the half a source pin is genuinely good at, re-pointed at the new copy: the
// two labels EXIST, they are DIFFERENT, and no third banner may appear without one. That is the
// assertion that goes red the moment somebody adds a strip with no name on its button, which is the
// regression D11 was really about. `componentFile` and not `componentLogic` for D11's own reason -
// the widened corpus would drag in composables this claim was never about (see tests/worldSource.ts).
import { describe, it, expect } from 'vitest'
import { componentFile } from './worldSource'

describe('D11 - the two top banners do not answer to the same name', () => {
  const app = componentFile('App.vue')

  it('every dismiss control in the shell carries an accessible name of its own', () => {
    // The defect, stated backwards, at the layer the name now lives on. A bare `Dismiss` with no
    // `aria-label` in front of it is exactly the collision D11 found.
    expect(app, 'a `Dismiss` button with no accessible name is back - which banner is it?').not.toMatch(
      /<button(?![^>]*aria-label)[^>]*>\s*Dismiss\s*</,
    )
  })

  it('each banner says what it is dismissing, in its accessible name', () => {
    expect(app).toContain('aria-label="Dismiss autosave notice"')
    expect(app).toContain('aria-label="Dismiss stop notice"')
    // ...and they are still two different sentences. One button renamed and the other left behind is
    // the failure mode this pair exists to catch.
    expect(new Set(app.match(/aria-label="Dismiss [^"]+"/g) ?? []).size).toBe(2)
  })

  it('...and the VISIBLE word is the owner\'s one word, on both', () => {
    // Round 28 #10, stated forwards at the only layer this file can see it. The mounted test is the
    // real evidence; this keeps the source honest for anyone reading App.vue rather than running it.
    expect(app.match(/>\s*Dismiss\s*</g)?.length ?? 0).toBe(2)
    expect(app, 'the three-word copy is back on a button').not.toMatch(/>\s*Dismiss [^<]+</)
  })
})
