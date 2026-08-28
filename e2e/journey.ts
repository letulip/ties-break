// SHARED VOCABULARY FOR THE S2 JOURNEYS (docs/plans/playwright.md §5, S2).
//
// Everything here is a LOCATOR or a small navigation step, never an assertion helper: a spec that
// hides its claims behind `expectEverythingIsFine(page)` reads green and says nothing, which is the
// failure mode docs/specs/e2e-coverage.md's whole "what is NOT covered" section exists to avoid. The
// specs make their own assertions, in their own words, where a reader can see them.
//
// ⚠ ROLE AND ACCESSIBLE NAME ONLY (plan §4). Not one CSS selector, not one `data-testid` - the app
// still has zero of those and this wave added none. Where an element could NOT be reached that way,
// the fact is recorded in docs/specs/e2e-coverage.md's accessibility-gap table rather than worked
// around with a class selector, because the gap is a real defect and papering over it in the test
// layer is how a defect stops being visible.

import { expect, type Locator, type Page } from '@playwright/test'
import { weekDateLine } from '../src/shared/dates'

/**
 * THE ADVANCE CONTROL, and the reason it needs a regex is a fact about the app worth stating.
 *
 * There is exactly one advance button in the whole product - App.vue's sticky bar - and it has NO
 * `aria-label`, so its accessible name IS its label, which `src/composables/weekAhead.ts` rewrites
 * every week to say what the week ahead actually holds. This regex is that module's label set,
 * transcribed once. It is deliberately a CLOSED set rather than a loose `/.+/`:
 *
 *   - a spec that matched anything would happily click some other button after a layout change and
 *     report a green week that never advanced;
 *   - and when a wave adds a new week kind, this line goes red naming the control, which is the
 *     correct place to find out that the app's single most important button changed its contract.
 *
 * ⚠ IT IS NOT UNIQUE ON THE CALENDAR TAB. `CalendarScreen.vue` renders the same label as its own
 * CTA, so while a tournament is pending and that tab is open, two buttons carry this name. Every
 * journey here stays on Home, where the bar is the only one; a future calendar spec must scope it.
 *
 * ⚠⚠ AND SINCE R2-13 THERE IS A SECOND ADVANCE CONTROL ON HOME – the span pill, beside the bar on
 * quiet weeks (`composables/weekAction.ts`, `.span-weeks-btn`). It is deliberately named
 * "Next N weeks" and NOT "Play N weeks" precisely so that it falls outside the closed set above and
 * this locator stays unambiguous. Two things follow for whoever touches either side: renaming the
 * pill to anything beginning with "Play" breaks every journey in this suite under strict mode, and a
 * spec that wants the SPAN must ask for it by its own name rather than widen this one.
 */
// ⚠ ROUND 28 #6 ADDED `Shooting week`, WHICH IS THIS COMMENT'S OWN THIRD BULLET HAPPENING. The owner
// asked for the button before a sponsor's shoot week to name it (`composables/weekAhead.ts` gained a
// `shoot` kind), so a new week kind reached the app's single most important control – and the set is
// closed precisely so that arrives here as a decision rather than as a silently unmatched locator.
// Nothing else about the contract moved: it is a plain advance, it does not begin with "Play", and
// the span pill beside it is still "Next N weeks".
//
// ⚠ ROUND 29 #6 MADE THAT N A VARIABLE, AND THE CONTRACT IS UNCHANGED. The pill used to say "Next 4
// weeks" always; it now says however many weeks the quiet slot in front of it actually holds
// (`multiSpanOf` -> `spanWeeksFor`), because the owner read four on a gap of six. Nothing about this
// locator moves: the pill still begins with "Next", still never with "Play", and is still outside
// the closed set. A spec that wants the SPAN must still ask for it by its own name – and must now
// match the number rather than assume four.
export const WEEK_ACTION_NAME =
  /^(Training week|Shooting week|Practice match|Exam week|Off-season week|Leave on vacation|Injured – walkover|Play .+|.+ \(outgrown\))$/

export function weekButton(page: Page): Locator {
  return page.getByRole('button', { name: WEEK_ACTION_NAME })
}

/**
 * THE CONFIRM BEHIND AN ENTRY, whose button does not always say the same word - and that is a
 * product decision rather than an inconsistency, so it is transcribed here the way `WEEK_ACTION_NAME`
 * transcribes the advance bar's label set.
 *
 * `SeasonScreen.askEnter` picks one of three verbs, and each says what is being OVERRULED:
 *
 *   * `Enter`        - nobody objects;
 *   * `Push through` - she is fatigued, and pushing through is what you do to tiredness;
 *   * `Enter anyway` - the hired coach has an opinion about the SCHEDULE, which is not a body word.
 *
 * A CLOSED SET, for the same reason the advance bar's is: a loose `/.+/` would happily press some
 * other button after a layout change and report an entry that never happened, and a fourth verb
 * should go red here - on the control that spends the family's money - rather than pass quietly.
 *
 * ⚠ THE SET IS ALSO WHY THIS IS UNAMBIGUOUS. `ConfirmDialog` is one of the eight overlays that are
 * still roleless divs (defect D1), so it cannot be scoped by `getByRole('dialog')`; what keeps this
 * locator honest instead is that none of the three verbs is a whole accessible name anywhere else on
 * Season - the event pills are named `Enter the <event>, <dates>` (D4's fix), so `^Enter$` misses
 * them by construction.
 */
export const ENTER_CONFIRM_NAME = /^(Enter|Enter anyway|Push through)$/

export function enterConfirmButton(page: Page): Locator {
  return page.getByRole('button', { name: ENTER_CONFIRM_NAME })
}

/** Home's date line for a given career week, as the app itself writes it - "W18 2033 · May 2 – May 8".
 *
 *  Anchored at the start because the line continues past the dates. The absolute career week the
 *  manifest counts in never appears on screen; `weekDateLine` is the product's own translation, so a
 *  spec asserts "the manifest's week, rendered the way the app renders it" and cannot drift into
 *  asserting a format the app stopped using. Same argument as seeded-careers.spec.ts. */
export function onScreenWeek(week: number): RegExp {
  return new RegExp(`^${weekDateLine(week)}`)
}

/**
 * Answer the decision a seeded career happens to wake up holding, if it is holding one.
 *
 * ⚠ A CONDITIONAL IN A TEST IS A SMELL AND THIS ONE IS ARGUED FOR, NOT SHRUGGED AT. Both `junior`
 * and `pro` boot with an open knock - a modal that blocks every control on the page and disables the
 * advance bar until it is answered. That is FIXTURE STATE, not the thing any journey below is
 * testing, and it is exactly the kind of state a regeneration (`npm run e2e:fixtures`) can move: the
 * generator searches seeds for weeks and funds, and has never been asked to hold a knock.
 *
 * So the journeys treat it as a doorway and step through it, and the GATE ITSELF - "nothing moves
 * while a decision is open" - is asserted exactly once, strictly, in week-advance.spec.ts. If a
 * future fixture set boots clean, the journeys keep working and that one spec goes red with a
 * message saying which fixture stopped holding a decision. One canary, no silent tolerance.
 *
 * `Rest it` and not `Train through it`: resting writes its own diary line ("Resting the hip - a week
 * off the training court"), which is what week-advance.spec.ts follows across the worker boundary.
 */
export async function answerOpeningKnock(page: Page): Promise<void> {
  const rest = page.getByRole('button', { name: /^Rest it/ })
  if (await rest.isVisible().catch(() => false)) {
    await rest.click()
    // The click is an RPC to the worker; the bar re-enabling is the answer coming back. Web-first,
    // so this is the wait - there is no sleep anywhere in this directory.
    await expect(weekButton(page)).toBeEnabled()
  }
}

/**
 * DISMISS THE TOUR-COMMITMENT BRIEFING IF THIS CAREER HAS JUST CROSSED INTO THE TOP FIFTY.
 *
 * ⚠ WHY THIS EXISTS, AND IT ARRIVED AS THREE RED SPECS AT ONCE (17.08). `TourBriefingDialog` is a
 * BLOCKING overlay – the tour's commitment rules are the one thing the game stops the world to
 * explain – and it fires on the boot of any career already inside the top 50. The `pro` fixture was
 * outside it until the skill wave re-dealt every professional's strength off the live rank curve;
 * she is now world #15, so three journeys that had never met this dialog began timing out on a click
 * the overlay was intercepting.
 *
 * ⚠ IT IS STEPPED THROUGH, NOT ASSERTED, and that is the difference from `answerOpeningKnock`'s
 * canary. Whether a given fixture's career is inside the top 50 is a property of where the search
 * stopped and of the whole balance of the game; a spec about a kit letter or a tournament entry has
 * no business pinning it. The dialog's own suite is tests/component/, and week-advance.spec.ts still
 * owns the claim that a blocking decision stops the week.
 */
export async function dismissTourBriefing(page: Page): Promise<void> {
  const briefing = page.getByRole('heading', { name: 'The commitment rules now apply.' })
  if (await briefing.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(briefing).toHaveCount(0)
  }
}

/** Home -> Money, through the door a player actually uses.
 *
 *  MoneyScreen is TABLESS: the only ways in are Home's Family budget card and nothing else. That is
 *  why this is a navigation step and not a `goto` - there is no URL to go to, the app has no router,
 *  and the card is the product's own route. Its accessible name is its whole text content (a
 *  `Card as="button"` with no aria-label), so it is addressed by the start of that name. */
export async function openMoney(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Family budget/ }).click()
  await expect(page.getByRole('heading', { name: 'Family Budget' })).toBeVisible()
}

/** Home -> More (settings), the other tabless screen, reached by the gear. */
export async function openMore(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('group', { name: 'Which settings' })).toBeVisible()
}
