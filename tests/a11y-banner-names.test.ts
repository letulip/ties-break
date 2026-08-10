// THE TWO TOP BANNERS, AND THE ONE CLAIM THIS REPO CAN HONESTLY MAKE ABOUT THEM.
//
// Defect D11 (docs/specs/e2e-coverage.md §12): App.vue draws two strips at the top of the page - the
// damaged-autosave notice and the stop toast - they can be on screen together, and each carried a
// button that said `Dismiss` and nothing else. Two identical names, one shape, one position: a
// strict-mode collision for a test, and for anyone reading the screen, two grey strips with the same
// word on the same button. Fixed in the VISIBLE copy rather than under an `aria-label`, because a
// label that disagrees with what is printed on a control is its own defect (WCAG 2.5.3) and would
// have left a sighted player with the ambiguity that started this.
//
// ⚠ WHY THIS IS A SOURCE PIN WHEN EVERY OTHER FIX IN THIS SWEEP GOT A MOUNTED TEST, and both reasons
// are measured rather than assumed. CLAUDE.md's rule is "prefer a mounted test to a source pin", and
// this is the one surface in the sweep where neither of the two layers that could mount it can:
//
//   1. THE E2E LAYER CANNOT PRODUCE THE BANNER. A stop speaks through the toast only when its reason
//      has copy, and `injury` / `tournament` / `season-end` deliberately have none (each owns a
//      dialog instead). That leaves `funds`, and the only fixture under water - `broke` - sits at
//      ELEVEN debt weeks against a twelve-week grace window, so the advance that would raise the
//      toast raises the bankruptcy ENDING and the epilogue replaces the shell. That is not a guess:
//      the spec was written, run, and failed on the epilogue. The note in e2e/week-advance.spec.ts
//      records what a fixture would have to look like for the journey to exist.
//   2. THE COMPONENT LAYER CANNOT MOUNT `App.vue`. It imports `src/pwa.ts`, which imports the
//      `virtual:pwa-register` module the VitePWA plugin injects at build time; under the component
//      project that import does not resolve and the mount dies before a single line renders. Making
//      it mountable means an alias in the shared vite.config.ts - a change to everyone's harness,
//      which is not a thing to smuggle in beside an accessibility fix.
//
// ⚠ SO THE CLAIM IS DELIBERATELY THE NEGATIVE ONE, WHICH IS THE HALF A SOURCE PIN CAN ACTUALLY MAKE.
// "The rename reaches a player" is not assertable here and is not asserted. "No control in this file
// is called `Dismiss` and nothing else" is exactly what the file's own text can answer, it is the
// defect stated backwards, and it is the assertion that goes red the moment somebody adds a third
// banner with the old label. `componentFile` and not `componentLogic` for precisely that reason -
// the widened corpus would drag in composables this claim was never about (see tests/worldSource.ts).
import { describe, it, expect } from 'vitest'
import { componentFile } from './worldSource'

describe('D11 - the two top banners do not answer to the same name', () => {
  const app = componentFile('App.vue')

  it('no button in the shell is called `Dismiss` and nothing else', () => {
    // The defect, stated backwards. Whitespace-tolerant because a Vue template is free to break the
    // line, and matching the label rather than the element keeps this readable.
    expect(app, 'a bare `Dismiss` is back - which banner is it?').not.toMatch(/>\s*Dismiss\s*</)
  })

  it('each banner says what it is dismissing, in the words on the button', () => {
    expect(app).toContain('>Dismiss autosave notice<')
    expect(app).toContain('>Dismiss stop notice<')
    // ...and they are still two different sentences. One button renamed and the other left behind is
    // the failure mode this pair exists to catch.
    expect(new Set(app.match(/>Dismiss [^<]+</g) ?? []).size).toBe(2)
  })
})
