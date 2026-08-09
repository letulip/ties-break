// JOURNEY: THE TOURNAMENT LOOP - ENTER THE WEEK, PLAY IT OUT, SEE THE RESULT LAND.
//
// SEAMS OWNED: #1 (the worker boundary) and #5 (real input), across the app's longest single
// interaction. This is the one journey that goes ALL THE WAY ROUND: a click ticks a week in the
// worker, the engine computes an entire draw and parks the career on `pendingTournament`, the UI
// takes the screen over to reveal it, the player's way out of that overlay is another command back
// across the boundary (`closeTournament`), and only then does the result exist in the world where
// two other screens can read it.
//
// WHY NO CHEAPER LAYER REACHES IT: `tests/component/match-viewer.test.ts` mounts the viewer against
// a hand-built fixture and is mutation-verified - it owns how a match RENDERS. What it cannot own is
// the round trip: that the draw the engine computed is the draw the overlay showed, that dismissing
// the overlay sent a command the engine accepted, and that the world afterwards is one the news feed
// and the ledger both agree about. There is no worker on the other side of a mounted test.
//
// ⚠ AND THE SCORELINES ARE NOT ASSERTED. Who wins is the match engine's property and the sim
// project calibrates it; a spec here that pinned "7-6 6-3" would be a slower duplicate of a test
// that exists AND a hostage to every balance wave. What is asserted is that A result - whichever the
// dice gave - crossed back into the world and reached two screens.

import { test, expect } from './careerAt'
import { answerOpeningKnock, onScreenWeek, openMoney, weekButton } from './journey'

test('a tournament is revealed, played out, and its result reaches the feed and the ledger', async ({
  page,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  const { facts, profile } = await careerAt('junior')
  await answerOpeningKnock(page)

  // --- the reveal -------------------------------------------------------------------------------
  await weekButton(page).click()
  const begin = page.getByRole('button', { name: 'Begin', exact: true })
  await expect(begin).toBeVisible()
  // The withdraw door is on the same splash. Naming it here is not decoration: it is the control an
  // accidental `Begin` regression would be confused with, and asserting both exist means the spec is
  // looking at the tournament splash rather than at some other screen that happens to say "Begin".
  await expect(page.getByRole('button', { name: 'Skip this event – withdraw' })).toBeVisible()

  await begin.click()

  // --- play it out ------------------------------------------------------------------------------
  // ⚠ `Skip all rounds` AND NOT `Watch match`, AND THIS IS A DELIBERATE COVERAGE DECISION. Watching
  // is minutes of animation whose content is the match engine's property (unit + sim) and whose
  // rendering is `match-viewer`'s (component). The skip path runs the same engine over the same draw
  // and produces the same world - it is the identical seam at a fraction of the wall clock, and this
  // suite's flake budget is zero, which is a budget you spend by making tests long.
  await page.getByRole('button', { name: 'Skip all rounds' }).click()

  // The finale poster is the end of the flow, and `Continue` is the command that actually closes the
  // tournament in the engine. Until it is pressed the career is still parked.
  const finish = page.getByRole('button', { name: 'Continue', exact: true })
  await expect(finish).toBeVisible()
  await finish.click()

  // --- and the world moved on -------------------------------------------------------------------
  // Closing the tournament finishes the week, and a finished week opens its own story by itself -
  // the tabless ThisWeekScreen, which has no route and can only be arrived at this way. The
  // tournament's rounds are in its Highlights, written by the engine during the tick.
  await expect(page.getByRole('region', { name: /^Week story/ })).toBeVisible()
  await page.getByRole('button', { name: 'Proceed to Home' }).click()

  // The pause is released: the overlay is gone and the advance control is a real advance again.
  await expect(begin).toHaveCount(0)
  await expect(weekButton(page)).toBeEnabled()
  await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()

  // 1. THE FEED. The engine's own result line, written by `finalizeTournament` during the tick and
  //    surfaced only now that the tournament is closed. Her name comes from the manifest and the
  //    finish is left open on purpose - the dice decide it, and pinning it would make this spec a
  //    hostage to the match engine.
  await expect(
    page.getByText(new RegExp(`🏁 .*${profile.kidName} – .*pts\\)`)).first(),
  ).toBeVisible()

  // 2. THE LEDGER, on a different screen, off the same snapshot. An event costs an entry fee and may
  //    pay a prize; either way the week's money is now in the transaction list. The arithmetic is
  //    unit-owned - what this asserts is that it arrived.
  await openMoney(page)
  await page.getByRole('group', { name: 'Which part of the budget' })
    .getByRole('button', { name: 'History' })
    .click()
  await expect(page.getByRole('heading', { name: 'All transactions' })).toBeVisible()
  await expect(page.getByText('No transactions yet.')).toHaveCount(0)

  expect(crashes, 'the app threw while playing a tournament').toEqual([])
})
