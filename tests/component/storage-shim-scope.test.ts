// THE FILE THAT OPTS OUT – the scoping proof for T5.10 · F-03 (27.09).
//
// ⚠⚠ WHY THIS FILE EXISTS, and it is not a test of a test helper. `tests/component/setup.ts` is the
// component project's ONE `setupFiles` entry, so whatever it does at top level it does for every one
// of this directory's 236 test files. The 26.09 review's own verification of F-03 is the warning:
// 68 of those files install a fourteen-line in-memory `localStorage`, and moving that install into
// the setup file – the obvious, tidy version of the fix – would hand it to the other **168, which run
// today with no web storage at all**.
//
// ⚠ THAT WOULD BE THE SILENT KIND OF CHANGE, which is the only reason this file is worth its seconds.
// Not one of those 168 files would go red. Some of them would start passing for a different reason
// than the one they were written against, and at least two reason from the absence IN PROSE:
//
//   * `r47-raise-another-route.test.ts:193-198` – «`localStorage` is undefined here
//     (prologue-two-paths.test.ts records the same), so `useDeviceFlag` reads false and its write
//     throws and is swallowed – there is nothing to spy on and a spy-based arm measured NOTHING».
//     Its tour arm was REWRITTEN because of that, after the spy version scored 0 on the very
//     mutation it existed to catch.
//   * `prologue-two-paths.test.ts` – the same finding, recorded independently.
//
// So the shim is opt-in, and this file is the half of the proof that nobody can get for free: it
// imports the setup module – which is how the install would arrive if it were ever made global – and
// then asserts the runner STILL has no storage.
//
// ⚠ THE NAMED MUTATION, run 27.09: add `installMemoryStorage()` at the top level of
// `tests/component/setup.ts`. This file goes red on both cases below; `storage-shim-optin.test.ts`
// stays green, which is the pair working as designed. Restore the line and both are green again.
// The mutation's measured blast radius on the files that REASON from the absence is recorded in the
// task report – a file whose assertions survive the mutation is exactly the hazard, not a
// reassurance.
import { describe, it, expect } from 'vitest'
import { installMemoryStorage } from './setup'

describe('the component runner has no web storage unless a file asks for it', () => {
  it('⚠ importing the setup module does NOT install localStorage', () => {
    // The import above is the whole setup of this case. If `setup.ts` ever installs at top level –
    // directly, or through a helper called at module scope – this is the line that says so.
    expect(typeof globalThis.localStorage, 'the shim became global; see tests/component/setup.ts').toBe(
      'undefined',
    )
    // ...and the installer is still there to be called, so the absence above is a SCOPE and not a
    // deletion. Without this, the case would pass just as well if the shim had been removed
    // altogether, which is the vacuity `sim-serialisation.test.ts` spends a paragraph on.
    expect(typeof installMemoryStorage, 'the opt-in installer is gone').toBe('function')
  })

  it('⚠ ...and the absence is `localStorage` ALONE – `sessionStorage` is a real Storage here', () => {
    // ⚠⚠ MEASURED 27.09 WHILE WRITING THIS FILE, AND IT CORRECTS THE SENTENCE ALL 68 COPIES CARRY.
    // Every one of them says some version of «happy-dom is configured here without web storage».
    // happy-dom is not the mechanism: it supplies BOTH, and `sessionStorage` arrives intact as a real
    // `Storage` (happy-dom 20.11, vitest 3.2.7). What removes `localStorage` is NODE – under Node
    // 26.5 the global is its own experimental one, and the runner prints the reason out loud:
    // «localStorage is not available because --localstorage-file was not provided». It is an OWN
    // property of `globalThis` whose value is `undefined`, which is why `Object.defineProperty` with
    // `configurable: true` is the shape that installs over it.
    //
    // Pinned as an ASYMMETRY rather than as trivia: the day a Node or happy-dom upgrade starts
    // supplying `localStorage`, 68 files' shims become redundant and the 168 files that reason from
    // its absence quietly change meaning – and this is the line that will say so by name.
    expect(typeof globalThis.sessionStorage, 'sessionStorage vanished too – the runner changed').toBe('object')
    expect(globalThis.sessionStorage.constructor.name).toBe('Storage')
    expect(typeof globalThis.localStorage, 'the runner now SUPPLIES localStorage – see the note above').toBe(
      'undefined',
    )
  })
})
