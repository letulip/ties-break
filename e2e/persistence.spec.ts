// JOURNEY: A CAREER SURVIVES A RELOAD - INCLUDING MID-PAUSE.
//
// SEAM OWNED: #2, persistence across a real reload, on top of #1. The unit layer tests IndexedDB
// through `fake-indexeddb`, which is a JavaScript reimplementation - it has no `versionchange`
// queue a second connection can block on, no page lifecycle, and no browser to destroy the
// worker and rebuild it from disk. This file is the only place in the repo where a real browser
// tears down a real worker, reopens a real database and rebuilds a career from bytes it wrote
// itself moments earlier.
//
// ⚠ THE LOAD-BEARING ASSERTION IS `week + 1`, NOT `week`, AND THAT IS THE WHOLE DESIGN OF THIS FILE.
// The seeded bytes are the career at `facts.week`. A spec that reloaded and asserted the SEEDED
// state would pass in three different broken worlds: one where the autosave never happened, one
// where the reload silently re-seeded, and one where persistence works. So every assertion below is
// on state that exists ONLY because the app wrote it after the tick - a week the fixture has never
// been at. `careerAt`'s seed is a one-shot for exactly this reason (its header has the argument);
// this is the spec that would catch it if it ever stopped being one.

import { test, expect } from './careerAt'
import { answerOpeningKnock, onScreenWeek, weekButton } from './journey'

/** Come back to the app the way a player does - a full navigation, a cold boot, a fresh worker.
 *
 *  The splash is on every launch and it waits for `game.init()` to settle, so clicking it by name is
 *  also the wait for the store to have finished asking the worker to reopen the database. */
async function reload(page: import('@playwright/test').Page): Promise<void> {
  await page.reload()
  await page.getByRole('button', { name: 'Tap to start' }).click()
}

test.describe('a career survives a reload', () => {
  test('mid-week: the week it was left on, not the week it was seeded at', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts } = await careerAt('junior')
    await answerOpeningKnock(page)

    await weekButton(page).click()
    await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()

    await reload(page)

    // The claim, in one line: the browser threw away the page, the worker and every byte of memory,
    // and the week that came back is the week the ENGINE reached - not the week the fixture holds.
    await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()
    // And the negative half. If the init script had re-seeded on this navigation, or if the tick's
    // autosave had not been durable, this is the week that would be on screen instead.
    await expect(page.getByText(onScreenWeek(facts.week))).toHaveCount(0)
    // Nor did the app fall through to onboarding, which is what an unreadable database looks like.
    await expect(page.getByRole('heading', { name: 'Raise a Champion. Together.' })).toHaveCount(0)

    expect(crashes, 'the app threw while reloading a career').toEqual([])
  })

  test('mid-reveal: the engine\'s tournament pause is part of the save, and the app re-enters it', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts } = await careerAt('junior')
    await answerOpeningKnock(page)

    // She is entered for the week ahead, so this tick computes the whole draw and parks the career on
    // `world.pendingTournament`. The reveal is pure presentation over a decision the engine has
    // already made and written down - which is exactly why it is the interesting reload case.
    await weekButton(page).click()
    const begin = page.getByRole('button', { name: 'Begin', exact: true })
    await expect(begin).toBeVisible()

    await reload(page)

    // ⚠ NOTHING RESTORED THE OVERLAY. `App.vue` holds `tournamentHidden` in a plain `ref(false)`, so
    // the reveal is not remembered by the UI at all - it comes back because `pendingTournament`
    // survived in the WORLD, was rehydrated by a brand-new worker, and arrived in the first snapshot
    // the new page ever saw. A component test cannot make this claim: it would have to hand itself
    // the pending snapshot, which is the thing under test.
    await expect(begin).toBeVisible()
    await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()

    // AND THE PAUSE IS A REAL STOP, not a screen the player can walk past. `advanceWeeks` returns
    // `['tournament']` without ticking while it holds, and the UI's advance control switches to a
    // free "resume" that re-opens the reveal instead of moving the week. So: park it, press the
    // advance control, and the reveal comes back with the week exactly where it was.
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await expect(begin).toHaveCount(0)
    await weekButton(page).click()
    await expect(begin).toBeVisible()
    await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()
    await expect(page.getByText(onScreenWeek(facts.week + 2))).toHaveCount(0)

    expect(crashes, 'the app threw while reloading into a pending tournament').toEqual([])
  })
})
