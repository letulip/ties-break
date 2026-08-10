// THE SMOKE SPEC (S0 of docs/plans/playwright.md). One test, and deliberately one.
//
// WHAT IT CLAIMS, in the plan's own words: "the app boots, a new career starts, week 1 renders."
// Nothing more. S0 exists to prove the HARNESS - that a real production build served by
// `vite preview` boots in real Chromium, that the worker answers, that IndexedDB opens, and that the
// shell paints - before anything is built on it. Coverage is S2's job, and it arrives one seam at a
// time on top of S1's state seeding.
//
// ⚠ WHY THIS IS NOT A COMPONENT TEST IN DISGUISE - the plan's §2, and the rule this whole layer
// lives by. `tests/component/` mounts these components with the worker mocked away, so the one thing
// it can never say is that a real `postMessage` round trip happened at all. The date line asserted
// at the end is rendered off a `Snapshot` that a real Web Worker built and shipped across that
// boundary, and the news row beside it is the engine's own diary event, written by the same tick.
// A spec that asserted the label on the "Next" button instead would be a slower copy of a mounted
// test that already exists.
//
// ⚠ NO `waitForTimeout`, HERE OR ANYWHERE IN THIS DIRECTORY, and there is no reason to want one. The
// UI is fed by an async RPC to a worker, so a sleep is a guess about a queue you cannot observe -
// too short and it flakes, too long and the suite is slow for everyone forever. Every step below is
// a Playwright action or a web-first assertion, and both retry until the thing is really there.
//
// SELECTORS: role and accessible name only, which is §4 of the plan. Not one `data-testid` was
// needed to write this, and that is a fact about the app rather than about the test - every control
// on the boot path already carries an accessible name.

import { test, expect, type Page } from '@playwright/test'

/** Advance the wizard and say which step we expect to land on.
 *
 *  The step rail is a real `<ol aria-label="Step N of 6">`, so "did the click land" is answerable by
 *  role and name rather than by counting DOM nodes - and asserting it between clicks is what keeps
 *  the walk honest: a "Next" that quietly did nothing fails here instead of three steps later, where
 *  the error would name the wrong control. */
async function next(page: Page, arriveAtStep: number): Promise<void> {
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('list', { name: `Step ${arriveAtStep} of 6` })).toBeVisible()
}

test('the app boots, a new career starts, and week 1 renders', async ({ page }) => {
  // An uncaught exception in the app is a failure even if every assertion below still passes - a
  // worker that dies after painting is exactly the kind of thing this layer exists to notice.
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  // --- it boots -------------------------------------------------------------------------------
  await page.goto('/')
  // The splash is the first thing a player meets on EVERY launch, and it waits for `game.ready` -
  // so seeing it means the store initialised and IndexedDB opened. It is a div with role="button",
  // which is why it is reachable at all; see e2e/README.md on that.
  await page.getByRole('button', { name: 'Tap to start' }).click()

  // --- a new career starts --------------------------------------------------------------------
  // With no save in this browser profile, the app hands over to the six-step wizard. Walking it is
  // the real "a new career starts" path, and every control on it is addressed by name.
  await expect(page.getByRole('heading', { name: 'Raise a Champion. Together.' })).toBeVisible()
  await page.getByRole('button', { name: 'Begin' }).click()

  await expect(page.getByRole('list', { name: 'Step 2 of 6' })).toBeVisible()
  await next(page, 3) // her name and birthday come pre-filled, so step 2 needs no input
  // ⚠ THE ONE STEP THAT NEEDS AN ANSWER. Step 3's "Next" is disabled until a country is picked, so
  // this click is load-bearing rather than decoration: without it the walk stops here with a
  // timeout on a disabled control, which is the spec catching itself.
  await page.getByRole('button', { name: 'United States' }).click()
  await next(page, 4)
  await next(page, 5) // family background and coaching default to Middle class / Hire a coach
  await next(page, 6) // play style defaults to All-court

  await expect(page.getByRole('heading', { name: 'All Set!' })).toBeVisible()
  await page.getByRole('button', { name: 'Start career' }).click()

  // The first-run tour lands on top of Home. Dismissed by name, so what follows is asserted against
  // the screen a player is actually looking at rather than one behind a scrim.
  await page.getByRole('button', { name: 'Skip tour' }).click()

  // --- week 1 renders -------------------------------------------------------------------------
  // "W1 2031 · Jan 6 – Jan 12" - the Home header's date line, built by `weekDateLine` off the week
  // in the snapshot. The year is matched loosely on purpose: WHICH week she is in is this layer's
  // claim, while the calendar arithmetic behind the date already has unit tests of its own (§2 -
  // this layer must not duplicate them).
  await expect(page.getByText(/^W1 \d{4} · /)).toBeVisible()
  // ⚠ AND IT HAS A ROLE NOW (a11y D10, docs/specs/e2e-coverage.md §12). The line above is kept
  // exactly as it was - it is the claim this test came for - and this one is the same string asked
  // for the way the rest of this suite asks for everything: by role and name. A diary page whose
  // subject is a WEEK carried its subject in a bare <p> until this wave, so `getByText` was the only
  // way to reach the app's most-asserted string.
  await expect(page.getByRole('heading', { name: /^W1 \d{4} · /, level: 1 })).toBeVisible()

  // The engine's own first diary line, rendered through the snapshot. It carries the seed the world
  // was built from, so this asserts the worker really built one - not that a component can print a
  // string. The name is randomised by the wizard, so nothing here names her.
  await expect(page.getByText(/career started \(seed "/)).toBeVisible()

  // And the shell is live around it: the tab bar a career is played from.
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Home' })).toBeVisible()
  // ⚠ THE BAR IS A NAMED LANDMARK AND THE ACTIVE TAB SAYS SO (a11y D7). Both are new this wave and
  // both are asserted here rather than in a file of their own, because this is the spec that already
  // owns "the shell painted". The name matters because the epilogue's photo album is a `<nav>` too -
  // seeded-careers.spec.ts found that the hard way - so "the navigation" was never a unique thing to
  // ask for. `aria-current` matters because which tab you are on lived only in a CSS class: a screen
  // reader was told nothing, and no test could ask.
  const bar = page.getByRole('navigation', { name: 'Main' })
  await expect(bar.getByRole('button', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page')
  // ...and a tab you are NOT on does not claim it. A bar where every button is current says as
  // little as one where none is, and only the negative half can tell those two apart. Both halves
  // are reached by role and name - no CSS selector, per the policy at the top of e2e/journey.ts.
  await expect(bar.getByRole('button', { name: 'Season', exact: true })).not.toHaveAttribute(
    'aria-current',
    'page',
  )

  // --- the harness's own contract -------------------------------------------------------------
  // ⚠ THIS ASSERTS THE TEST BUILD, NOT THE APP, and it is here because a decision nobody enforces is
  // a decision that quietly stops being true. `playwright.config.ts` builds with VITE_TB_SW=off so
  // no service worker can activate mid-run, precache a previous build, or raise an update banner
  // over a control a spec was about to click. If that switch is ever lost, this line goes red on the
  // next run instead of the suite going mysteriously flaky three waves later.
  const workers = await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length))
  expect(workers, 'the e2e build must not register a service worker - see e2e/README.md').toBe(0)

  expect(crashes, 'the app threw while the smoke spec was running').toEqual([])
})
