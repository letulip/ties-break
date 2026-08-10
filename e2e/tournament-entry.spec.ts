// JOURNEY: ENTERING A TOURNAMENT, AND THE THREE SURFACES THAT HAVE TO AGREE ABOUT IT AFTERWARDS.
//
// SEAMS OWNED: #1 (the Web Worker boundary) and #5 (real input). One press on a Season card is a
// command across `postMessage`; the engine validates it, spends the entry fee, writes the entry onto
// the world and commits an autosave; and the snapshot that comes back has to repaint THREE
// independent readers of it - the card itself, the app's sticky week button, and the Calendar's own
// takeover for that week, which is a different screen composing a different view of the same fact.
//
// WHY NO CHEAPER LAYER REACHES IT. `tests/component/` mounts these screens against a hand-written
// snapshot, so it can say what a card renders GIVEN an entered event - and that is worth having. What
// it cannot say is that pressing Enter is what produces one. The three surfaces are the point: a
// mounted test would hand each of them the same object by construction, which is the very thing in
// question. Agreement is only evidence when the surfaces got there independently.
//
// ⚠ THIS IS GAP 8.1, AND IT EXISTED FOR A REASON THAT WAS FIXED RATHER THAN WORKED AROUND. Until
// 10.08 every event card on Season drew a button whose entire accessible name was the word "Enter",
// so a feed of five cards was five controls no selector could tell apart, and this journey could not
// be written at all (defect D4). `src/composables/eventName.ts` now names them
// `Enter the <event>, <dates>`, from ONE helper both screens read - which is why the Calendar step
// below can address the same event by a name it never had to be told.
//
// ⚠ WHAT IS DELIBERATELY NOT HERE: what happens when the entered week ARRIVES. The reveal, the draw
// and the result are e2e/tournament.spec.ts's journey, and the pause surviving a reload is
// e2e/persistence.spec.ts's. This file stops at the entry, which is the seam it owns.

import { test, expect } from './careerAt'
import { answerOpeningKnock, enterConfirmButton } from './journey'
import { formatCents } from '../src/shared/money'

/** Regex-safe: an event label is the engine's string and a date range is `weekRange`'s, and neither
 *  is this spec's to promise the shape of. */
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test('a tournament is entered on Season, and Home and the Calendar both say so', async ({
  page,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  // `pro` boots with NOTHING entered ahead of her - Home says so in as many words - and with a full
  // feed of enterable events. That empty start is what makes every assertion below a change rather
  // than a coincidence.
  const { facts } = await careerAt('pro')
  await answerOpeningKnock(page)
  await expect(page.getByText(/Nothing entered yet/)).toBeVisible()

  await page.getByRole('navigation').getByRole('button', { name: 'Season', exact: true }).click()
  const enters = page.getByRole('button', { name: /^Enter the / })

  // ⚠ THE FIRST ASSERTION IS DEFECT D4, STATED AS THE THING IT COST. Her feed carries several
  // enterable events at once, and until 10.08 the whole accessible name of every one of those
  // controls was the word "Enter" - so a screen reader announced five identical buttons and no
  // selector could name one. Asserting that the names on a LIVE feed are all different is the claim
  // the shared helper exists to make good, and it is not a claim any mounted test makes: the
  // component layer renders one card at a time against a snapshot it wrote itself, so a feed is the
  // only place two names can collide.
  const names = await enters.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''))
  expect(names.length, 'the pro fixture is meant to boot with a feed of enterable events').toBeGreaterThan(1)
  expect(new Set(names).size, `two Enter controls answer to one name - D4 is back: ${names.join(' / ')}`).toBe(
    names.length,
  )

  // ⚠ THE SOONEST ONE SHE CAN ENTER - the top card of a feed ordered by week, which is the one a
  // player presses. Positional and deliberately so: WHICH event a fixture happens to be offered is
  // the generator's business, and pinning a tournament by name here would make this journey a
  // hostage to the calendar. What the test needs is one real, enterable event, and the name is then
  // READ OFF THE PAGE rather than composed - so everything below is checked against what the app
  // itself calls this tournament, on the surface a player pressed.
  //
  // ⚠ NOT "the event on week + 1", WHICH WAS TRIED AND IS NOT A THING THIS FIXTURE HAS. `pro` sits
  // at W49, inside the off-season - that is what puts her in the sponsor window - so the week ahead
  // of her carries no tournament at all and the sticky bar reads `Off-season week` throughout. The
  // bar's `Play <tier>` label is therefore NOT one of the surfaces this journey can watch; the three
  // it does watch are below.
  const entry = enters.first()
  const entryName = (await entry.getAttribute('aria-label')) ?? ''
  // ⚠ SPLIT AT THE FIRST COMMA, NOT THE LAST, and the difference is a real bug this line already had
  // once. `enterActionName` is `Enter the <label>, <weekRange>` and a week range carries commas of
  // its own - "Dec 27, 2038 – Jan 2, 2039" has two - so a `lastIndexOf` split hands back the year as
  // the dates and everything before it as the tournament. Tournament labels have no commas; the
  // first one is the separator. The match is asserted rather than assumed, because a silently
  // failed parse would leave both halves empty and every `toContainText` below trivially true.
  const parts = entryName.match(/^Enter the (.+?), (.+)$/)
  expect(parts, `the Enter control is not named "Enter the <event>, <dates>": "${entryName}"`).not.toBeNull()
  const [, eventLabel, eventDates] = parts!

  // --- the press ---------------------------------------------------------------------------------
  await entry.click()
  // The confirm quotes the fee, which is the only thing standing between the player and an
  // irreversible spend. Asserted as the app's own `formatCents` of a number read back off the
  // screen's own sentence would be circular, so this asserts the SHAPE and the event: this confirm
  // is about this tournament and it names a price.
  await expect(page.getByText(new RegExp(`Enter ${escapeRegExp(eventLabel)} \\(.*Entry fee \\$`))).toBeVisible()
  await enterConfirmButton(page).click()

  // --- 1. the card it was pressed on ------------------------------------------------------------
  // The engine accepted it, so the Enter for that event is gone and the withdrawal door has taken
  // its place. Asserting the disappearance as well as the arrival matters: a card offering both at
  // once would mean the screen had stopped reading the world it just changed.
  await expect(page.getByRole('button', { name: /^(Withdraw|Cancel entry)$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: entryName })).toHaveCount(0)

  // --- 2. Home, which was told nothing and knows anyway -----------------------------------------
  // The NEXT TOURNAMENT card reads `snapshot.upcoming.find(e => e.entered)` and composes its own
  // caption - the label, the surface, and `weekRange(event.week)`. That last one is the same
  // function `enterActionName` used to build the button this test pressed, arrived at
  // independently: two surfaces composing one fact, which is the whole reason D4's fix was a shared
  // helper rather than two template literals. So the card is asserted to carry BOTH halves of the
  // name that was read off Season - the tournament and the week - and to have stopped saying it has
  // nothing.
  await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
  const nextCard = page.getByRole('button', { name: /^Next tournament/ })
  await expect(nextCard).toContainText(eventLabel)
  await expect(nextCard).toContainText(eventDates)
  await expect(page.getByText(/Nothing entered yet/)).toHaveCount(0)

  // ...and while this screen is up: THE MONEY LEFT THE FAMILY. An entry is a spend, taken at the
  // moment it is made rather than when she travels. Asserted as "no longer the seeded figure": what
  // the fee IS belongs to the economy and the unit layer, and the claim here is that a command with
  // a price on it moved the balance WITHOUT A WEEK BEING TICKED - the one thing separating this
  // journey from every other spec in this suite, all of which move money by advancing time.
  await expect(page.getByRole('button', { name: /^Family budget/ })).not.toContainText(
    formatCents(facts.fundsCents),
  )

  // --- 3. and a third screen, which offers the same event and now refuses to ---------------------
  // The Calendar draws one marker per enterable week and opens a takeover about ONE event. Its Enter
  // reads the SAME `enterActionName` Season's feed does, so this marker is addressed by a name this
  // spec never had to be told - and what the takeover says now is the entry rather than an offer of
  // one.
  await page.getByRole('navigation').getByRole('button', { name: 'Calendar', exact: true }).click()
  await page.getByRole('button', { name: new RegExp(`^${escapeRegExp(eventLabel)}, W`) }).click()
  await expect(page.getByText('She is in. Withdrawing lives on the Season tab.')).toBeVisible()
  // ...and the door it replaced is closed on this screen too. Three surfaces, one world.
  await expect(page.getByRole('button', { name: entryName })).toHaveCount(0)

  expect(crashes, 'the app threw while entering a tournament').toEqual([])
})
