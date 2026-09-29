// THE ORDER OF THE PROJECTS IS A MEASUREMENT, SO IT GETS AN INSTRUMENT – T5.9 · G-04 (a), 27.09.
//
// ⚠⚠ WHY THIS EXISTS. `playwright.config.ts` declares `chromium-wedding` FIRST, and that single fact
// is worth **25.6 s of every local e2e run** – 71.67 s down to 46.06 s, measured before and after on
// a quiet machine (load 1.74 and 1.58), 136 tests either way. Playwright fills its dispatch queue by
// walking the root suite in declaration order – projects, then files, then tests – so the project
// written first is the one a worker picks up first. `wedding.spec.ts` is ONE test of 36.5 s; started
// late it finished at +62.9 s while every other test in the suite was done by +30.5 s, leaving four
// of five workers idle for the last ~32 s of the run.
//
// ⚠ AND NOTHING BUT THIS FILE WOULD NOTICE THE ORDER CHANGING BACK. Reordering the array cannot fail
// a test, cannot fail a typecheck and cannot fail CI – every spec still runs, and the run is still
// green, just half a minute longer. That is the exact shape this repo keeps paying for: a number
// stated in a comment, correct on the day it was written, with no instrument behind it. Three counts
// went stale in this wave alone and a person caught each one.
//
// ⚠ THE GAIN IS LOCAL ONLY, AND THAT IS NOT A REASON TO DELETE THIS. `playwright.config.ts` sets
// `workers: 1` on CI, where the wall is the SUM of the tests and no ordering can shorten it. So a
// reader who reddens this file on CI will see no slowdown there – and would then be free to reorder
// and hand every local run, and every pre-PR check, its 25.6 s back. The floor underneath all of this
// is the spec's ten week-presses through the calendar sweep, which is G-04's option (b): it changes
// the route the spec walks, so it is the owner's call and not a builder's.
//
// This spec needs no browser: it requests no `page` fixture, so Playwright starts none for it. It
// runs in the `chromium` project purely to travel with the suite it guards – `coverage-map.spec.ts`'s
// own arrangement, and for the same reason.
//
// ⚠ MUTATION-VERIFIED (27.09): `chromium` moved above `chromium-wedding` in the config -> red on the
// first case by name. The second and third cases are the anti-vacuous half: first place bought by an
// EMPTY project, or a project that matches the spec while `chromium` still also runs it, would
// satisfy a bare `projects[0].name` check and change nothing about the wall.

import { test, expect } from '@playwright/test'
import config from '../playwright.config'

/** The spec whose position in the queue is the whole point. Written as the path Playwright matches
 *  a project's `testMatch` / `testIgnore` against, which is the resolved file path. */
const WEDDING = 'e2e/wedding.spec.ts'

const matches = (pattern: unknown, file: string): boolean => {
  if (pattern instanceof RegExp) return pattern.test(file)
  if (typeof pattern === 'string') return file.includes(pattern)
  if (Array.isArray(pattern)) return pattern.some((p) => matches(p, file))
  return false
}

test.describe('the suite`s longest test is still scheduled first', () => {
  test('`chromium-wedding` is the FIRST project declared, which is what starts it first', () => {
    const projects = config.projects ?? []
    expect(projects.length, 'playwright.config.ts declares no projects').toBeGreaterThan(1)
    expect(
      projects[0].name,
      'THE PROJECT ORDER MOVED, AND IT COSTS ~25.6 s OF EVERY LOCAL e2e RUN (71.7 s -> 46.1 s, ' +
        'measured 27.09). Playwright dispatches projects in declaration order, so `chromium-wedding` ' +
        'first is what starts the suite`s one 36.5-second test at +0 s instead of +26 s – without it, ' +
        'four of five workers idle for the last ~32 s. The gain is LOCAL: CI runs `workers: 1`, where ' +
        'the wall is a sum, so no CI timing will tell you this is wrong. Put it back rather than ' +
        'deleting this line; the reasoning is at the top of this file and in G-04 of the 26.09 review.',
    ).toBe('chromium-wedding')
  })

  test('⚠ ...and it is not first-and-empty – the project it is first FOR is the wedding spec', () => {
    const first = (config.projects ?? [])[0]
    expect(
      matches(first?.testMatch, WEDDING),
      'the first project no longer claims e2e/wedding.spec.ts, so being first buys nothing',
    ).toBe(true)
  })

  test('⚠ ...and `chromium` no longer runs it, so it cannot ALSO be queued late', () => {
    const ordinary = (config.projects ?? []).find((p) => p.name === 'chromium')
    expect(ordinary, 'the `chromium` project is gone – this rule has nothing to check').toBeDefined()
    expect(
      matches(ordinary?.testIgnore, WEDDING),
      'e2e/wedding.spec.ts is back in the `chromium` project: it would run TWICE, once at the front ' +
        'and once wherever the alphabet puts it, which is the slow order plus a duplicate',
    ).toBe(true)
  })
})
