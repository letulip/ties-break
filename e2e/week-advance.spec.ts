// JOURNEY: ONE CLICK CROSSES THE WORKER BOUNDARY.
//
// SEAM OWNED: #1, the Web Worker boundary (e2e/README.md, plan §2). The engine runs in a real
// worker and the UI only ever sees a `Snapshot` shipped across `postMessage`. `tests/component/`
// mounts these same screens with that boundary MOCKED - it hands them a snapshot object directly -
// so the one thing it can never say is that a click produced an RPC, that the worker ticked a week,
// that it committed an autosave, and that the snapshot which came back repainted more than one
// screen. That is this file's entire claim, and no cheaper layer can make it.
//
// WHAT THIS FILE DELIBERATELY DOES NOT ASSERT: what the money should BE. The weekly economy - coach
// retainer, living costs, travel, prize arithmetic - is ~2,400 unit tests' property and re-checking
// a figure here would be a slower duplicate of a test that already exists (plan §2's governing
// rule). The claim is that the number MOVED and that two different screens agree it moved, which is
// a statement about the pipeline, not about the balance model.

import { test, expect } from './careerAt'
import { answerOpeningKnock, onScreenWeek, openMoney, weekButton } from './journey'
import { formatCents } from '../src/shared/money'

test.describe('advancing a week', () => {
  // ⚠ THIS TEST IS THE SUITE'S ONE DELIBERATE CANARY ON FIXTURE STATE, and e2e/journey.ts's
  // `answerOpeningKnock` explains the arrangement at length. Every other journey steps through the
  // opening knock without caring whether it was there; this one asserts it WAS. If a future
  // `npm run e2e:fixtures` produces a `junior` that boots clean, this is the single spec that goes
  // red, and it names the reason - rather than a dozen journeys quietly testing a different app.
  test('a decision on the table stops the week, and the answer comes back as news', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts, profile } = await careerAt('junior')

    // THE GATE, and it is the engine's rule surfacing through two layers of machinery. `advanceWeeks`
    // refuses outright while `pendingKnock(world)` holds, and the worker's `tick` handler throws on
    // the same predicate; the UI's job is to make that refusal visible BEFORE the player presses
    // anything. So the claim here is not "a button is disabled" - a mounted test could say that from
    // a hand-written snapshot - it is that a real worker's real world state disabled it.
    await expect(
      page.getByRole('button', { name: /^Rest it/ }),
      `the '${profile.kidName}' fixture is expected to boot holding an open knock. If this is the ` +
        'only red test after a fixture regeneration, the new save no longer holds one: move this ' +
        'canary to a fixture that does, or teach tools/e2e-fixtures.ts to search for one.',
    ).toBeVisible()
    await expect(weekButton(page)).toBeDisabled()
    // ...and nothing moved while it was open.
    await expect(page.getByText(onScreenWeek(facts.week))).toBeVisible()

    // ⚠ AND IT IS A DIALOG NOW (a11y D1, docs/specs/e2e-coverage.md §12). Until this wave the thing
    // blocking the app was a `<div>`: `getByRole('dialog')` returned nothing while a knock was open,
    // so the ONE state in this game that stops the world could not be asked for by role, and a screen
    // reader was never told a decision was blocking. It is asserted here because this is the spec
    // that already owns "a decision on the table stops the week" - the role is the same claim, said
    // in the app's own vocabulary.
    const knock = page.getByRole('dialog')
    await expect(knock).toBeVisible()
    await expect(knock).toHaveAttribute('aria-modal', 'true')
    // Its name is the two lines a player reads on the card, so a listener knows which week's knock
    // and which part of her before the two costs are read out.
    await expect(knock).toHaveAccessibleName(/^(A knock|The same knock again) – W\d+ '\d{2} Her /)

    // Answer it. The button re-enabling is the worker's reply, not a guess about one.
    await page.getByRole('button', { name: /^Rest it/ }).click()
    await expect(weekButton(page)).toBeEnabled()

    await weekButton(page).click()
    await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()

    // AND THE ANSWER IS IN THE WORLD, not just in the UI that sent it. Resting writes its own diary
    // line, so this is the round trip closing: a choice made in the browser, applied by the engine
    // inside the worker, and rendered back out of the snapshot the worker shipped. A mocked boundary
    // cannot produce this line at all - there is nothing on the other side to write it.
    await expect(page.getByText(/Resting the /)).toBeVisible()

    expect(crashes, 'the app threw while resolving a knock and advancing a week').toEqual([])
  })

  // ⚠ `pro` AND NOT `junior`, AND THE REASON IS THE POINT OF HAVING FIVE FIXTURES. `junior` is
  // entered for the week ahead, so her tick lands on a tournament reveal - a fine journey, and it is
  // tournament.spec.ts's. `pro` sits one week from the end of her eighth season, so her tick crosses
  // a SEASON BOUNDARY: one click, and the engine resolves a week, closes a season, writes the
  // wrap-up and repaints three screens. That is the heaviest single tick the app can be asked for.
  //
  // ⚠ SECOND CANARY ON FIXTURE POSITION (the first is the knock above). That `pro` + 1 week lands on
  // the boundary is a property of where the generator put her, and `npm run e2e:fixtures` could move
  // it. If the wrap-up assertions below go red alone, that is what happened - and the fix is a
  // dedicated `season-eve` fixture rather than deleting the coverage.
  test('a week that ends a season: the wrap-up, then Home and the money screen', async ({ page, careerAt }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts } = await careerAt('pro')
    await answerOpeningKnock(page)

    await weekButton(page).click()

    // 1. THE WEEK, AND THE SCREEN THE ENGINE CHOSE TO SHOW. A resolved week opens its own story by
    //    itself (More > Week story > "Open at the end of a week"), so the first thing across the
    //    boundary is not a repaint of Home but a NAVIGATION the app performed on its own - the
    //    tabless ThisWeekScreen, which has no route and no URL and can only be arrived at this way.
    //    The region is named, which is the one place in this app a whole screen region is.
    await expect(page.getByRole('region', { name: /^Week story/ })).toBeVisible()
    await expect(page.getByText(onScreenWeek(facts.week + 1))).toBeVisible()

    // 1b. THE SEASON CLOSED INSIDE THE SAME TICK, and its card is waiting on top of the week's own
    //     story. `tests/component/season-wrapup-mirror.test.ts` owns what this card SAYS given a
    //     summary; what it cannot own is that a real engine produced one - the season roll-over is
    //     ~50 lines of accounting in the worker, and this is the only layer that sees it happen.
    //     The two labels asserted are the ones that do not depend on which ladder she ended on.
    await expect(page.getByText('Season points')).toBeVisible()
    await expect(page.getByText('Tournaments entered')).toBeVisible()
    // ⚠ AND THE CARD IS A DIALOG (a11y D1). Same defect and same fix as the knock above, one beat
    // later in the same tick: it covers the week's story, and until this wave it said so to nobody.
    // Named by the season it closes, because "That's a season." on its own does not say which.
    const wrapUp = page.getByRole('dialog')
    await expect(wrapUp).toHaveAttribute('aria-modal', 'true')
    await expect(wrapUp).toHaveAccessibleName(/^Season \d{4} · wrap-up/)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    // ...and it goes when it is answered, which is what makes the assertion above a statement about
    // THIS card rather than about any dialog that happens to be up.
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await page.getByRole('button', { name: 'Proceed to Home' }).click()

    // 2. THE MONEY, on Home. Asserted as "no longer the seeded figure" rather than as a number: the
    //    figure it becomes is the economy's business and the unit layer's property. What this line
    //    owns is that a week's worth of it crossed the boundary and reached the card.
    await expect(page.getByRole('button', { name: /^Family budget/ })).not.toContainText(
      formatCents(facts.fundsCents),
    )

    // 3. THE RANK, from the same snapshot. The chip prints her ladder and her place on it; that it
    //    renders at all means the ranking tables came across intact, which is the part of a
    //    412-field snapshot most likely to be dropped by a serialisation change.
    await expect(page.getByRole('button', { name: 'How ranking points work' })).toContainText('#')

    // 4. A SECOND SCREEN OFF THE SAME SNAPSHOT. MoneyScreen is tabless - Home's budget card is the
    //    only door - so this is also real navigation, seam #5. The History segment is reached through
    //    `SegmentedRow`, which is the one control in this app with a fully modelled accessible name
    //    (role=group + aria-label + per-button aria-label + aria-pressed).
    await openMoney(page)
    await page.getByRole('group', { name: 'Which part of the budget' })
      .getByRole('button', { name: 'History' })
      .click()
    await expect(page.getByRole('heading', { name: 'All transactions' })).toBeVisible()
    // The ledger is populated. `No transactions yet.` is the empty state, and asserting its ABSENCE
    // is the honest form of the claim: a spec that asserted a particular row would be re-testing the
    // ledger's arithmetic, which tests/ already owns.
    await expect(page.getByText('No transactions yet.')).toHaveCount(0)
    // ⚠ AND IT IS POPULATED WITH ROWS, NOT WITH TEXT (a11y D5). `StatRow` rendered a bare `<div>` of
    // `<span>`s, so a forty-row ledger was one undifferentiated run as far as this layer and a screen
    // reader were both concerned - which is why the line above had to be phrased as the absence of an
    // empty-state string. Each row is a named group now, so the claim can be about ROWS. Counted
    // rather than named: which transactions eight seasons produce is the economy's business.
    expect(
      await page.getByRole('group').filter({ hasText: /\$/ }).count(),
      'the ledger reached the page as rows a reader can be walked through',
    ).toBeGreaterThan(3)

    expect(crashes, 'the app threw while advancing a week').toEqual([])
  })

  // ⚠ THE THIRD KIND OF WEEK: ONE THAT STOPS AND SAYS WHY. The two above end in a dialog with a
  // Continue; this one ends in the top banner, which is the app's other way of reporting a week -
  // and the surface D11 was filed against. There are TWO of those banners (the damaged-autosave
  // notice is the other), they can be on screen together, and both carried a button that said
  // `Dismiss` and nothing else: identical to a strict-mode locator and, more to the point,
  // identical to anyone looking at them.
  //
  // ⚠ THIRD CANARY ON FIXTURE STATE, and it is the cheapest of the three. `broke` is eleven weeks
  // under water at -$2,070; the engine raises the `funds` stop on any week that ends below zero, so
  // one advance is enough. If a regenerated `broke` ever boots solvent this test goes red naming the
  // reason, exactly like the knock canary above.
  test('a week that stops: the notice says what it is, and no other control shares its name', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    await careerAt('broke')
    await answerOpeningKnock(page)
    await weekButton(page).click()

    // The engine's own countdown copy, so this is the stop reaching the player rather than a banner
    // that renders whatever it is handed.
    await expect(page.getByText(/^Stopped: /)).toBeVisible()
    // THE DEFECT, STATED: this used to be a button called `Dismiss`, and so was the other banner.
    const dismiss = page.getByRole('button', { name: /^Dismiss/ })
    await expect(dismiss).toHaveCount(1)
    await expect(dismiss).toHaveAccessibleName('Dismiss stop notice')
    // ...and the rename did not cost the control its job.
    await dismiss.click()
    await expect(page.getByText(/^Stopped: /)).toHaveCount(0)

    expect(crashes, 'the app threw while a week stopped').toEqual([])
  })
})
