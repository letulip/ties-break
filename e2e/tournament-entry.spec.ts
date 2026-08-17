// JOURNEY: ENTERING A TOURNAMENT, AND THE THREE SURFACES THAT HAVE TO AGREE ABOUT IT AFTERWARDS.
//
// SEAMS OWNED: #1 (the Web Worker boundary) and #5 (real input). One press on a Season card is a
// command across `postMessage`; the engine validates it, spends the entry fee, writes the entry onto
// the world and commits an autosave; and the snapshot that comes back has to repaint THREE
// independent readers of it - the card itself, Home's next-tournament card, and the Calendar's own
// takeover for that week, each a different screen composing its own view of the same fact.
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
// `Enter the <event>, <dates>`, from ONE helper - and BOTH `Enter` controls in the app read it, the
// one on a Season card and the one inside the Calendar's takeover. That shared name is asserted
// positively below, across the two screens, which is the only place it can be.
//
// ⚠ THE CALENDAR'S GRID MARKER IS THE ONE CONTROL THAT DOES NOT READ IT (defect D16, added 10.08).
// The marker - the row you press to open the takeover - composes its own name in the template:
// `<event>, <weekLabel>, <weekSpan> – open this tournament`. Season says `Jan 3–9, 2039`
// (`weekRange`); the marker says `W2 '39, Jan 3 – Jan 9` (`weekLabel` + `weekSpan`). The two FORMATS
// are deliberate and argued in `weekSpan`'s own header - a span next to a week label that already
// carries the year must not repeat it - so this is not "one of them is wrong". What is missing is a
// shared TOKEN: no single string identifies one event across the app's three naming surfaces, and
// the cost lands here, as the `weekPrintedAs` translation below. §12 has the report.
//
// ⚠ WHAT IS DELIBERATELY NOT HERE: what happens when the entered week ARRIVES. The reveal, the draw
// and the result are e2e/tournament.spec.ts's journey, and the pause surviving a reload is
// e2e/persistence.spec.ts's. This file stops at the entry, which is the seam it owns.

import { test, expect } from './careerAt'
import { answerOpeningKnock, dismissTourBriefing, enterConfirmButton } from './journey'
import { weekLabel, weekRange } from '../src/shared/dates'
import { formatCents } from '../src/shared/money'

/** Regex-safe: an event label is the engine's string and a date range is `weekRange`'s, and neither
 *  is this spec's to promise the shape of. */
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * THE CAREER WEEK THE APP PRINTS AS `range` - the inverse of `weekRange`, by asking `weekRange`.
 *
 * ⚠ THIS EXISTS BECAUSE OF D16 AND SHOULD NOT SURVIVE ITS FIX. Season names an event with
 * `weekRange`; the Calendar's grid marker names the same event with `weekLabel`. To carry ONE event's
 * identity from the screen it was entered on to the screen that has to agree about it, this spec has
 * to translate between the two vocabularies - and the only honest translator is the app's own
 * formatter, run forwards until it produces the string that is already on screen. Nothing here
 * re-implements a date: `weekRange` is imported, and a week is identified by the app agreeing with
 * itself.
 *
 * The search is bounded and the failure is loud. `weekRange` is self-contained - it always carries
 * the year, in three widths depending on whether the week crosses a month or a year - so it is
 * injective and a hit is the week, not a week. `-1` is asserted on at the call site rather than
 * quietly flowing into a locator: an unfound week would otherwise build `^<label>, W-1 '…` and fail
 * ten seconds later, blaming the Calendar for a parse.
 */
function weekPrintedAs(range: string, from: number, horizon = 104): number {
  for (let week = from; week < from + horizon; week++) {
    if (weekRange(week) === range) return week
  }
  return -1
}

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
  // Top-50 boot briefing - see dismissTourBriefing. This spec is about entering a tournament.
  await dismissTourBriefing(page)
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
  //
  // ⚠ AND SINCE THE v47 REGENERATION IT IS NO LONGER A HYPOTHETICAL. `enterActionName`'s own header
  // justifies including the week like this: "a season carries the same rung several times, and
  // 'Enter the World Tour 50' would be ambiguous the moment two of them sit in one feed". `pro` now
  // holds exactly that - TWO World Tour 35 weeks - so the line below is the first time this repo has
  // measured the case the helper was designed for rather than argued it. It passes because the week
  // is in the name; the same fixture change broke the Calendar step, which had no week in its
  // locator. One fixture, both halves of the lesson.
  //
  // ⚠ MUTATION-VERIFIED: `:aria-label="enterActionName(row.event)"` taken off the pill in
  // SeasonScreen.vue -> `Received: 0`, because with the name back to the bare visible word there is
  // no `Enter the …` control on the page at all. That zero is what this journey used to be.
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

  // THE WEEK, which is the other half of this event's identity and the half the Calendar uses. See
  // `weekPrintedAs` for why the translation is needed at all (D16) and why it is a lookup rather
  // than arithmetic. Asserted here, at the point it is derived, so a failure names the parse.
  const eventWeek = weekPrintedAs(eventDates, facts.week)
  expect(
    eventWeek,
    `no career week within two seasons of ${facts.week} is printed as "${eventDates}" - the Season ` +
      'pill and src/shared/dates.ts have stopped agreeing about how a week is written',
  ).toBeGreaterThan(facts.week)

  /** The Calendar's row for that one week: `<event>, <weekLabel>, <weekSpan> – open this tournament`.
   *
   *  ⚠ EVENT **AND** WEEK, AND THE TIER ALONE IS NOT AN EVENT. This locator was `^<label>, W` until
   *  the v47 fixtures landed, at which point `pro` grew a second World Tour 35 and it resolved to two
   *  elements. The tier is a rung she plays several times a season; only the week makes it an
   *  identity, which is the argument `enterActionName` already makes for the Season pill. A fixture
   *  carrying three W35s would not touch this. */
  const marker = page.getByRole('button', {
    name: new RegExp(`^${escapeRegExp(eventLabel)}, ${escapeRegExp(weekLabel(eventWeek))},`),
  })

  // --- 0. the two Enter controls in this app are ONE name -----------------------------------------
  // Before anything is pressed: the Calendar's takeover for this event offers an Enter whose
  // accessible name is CHARACTER-FOR-CHARACTER the one read off Season a moment ago. Neither screen
  // was told the other's string - they both call `enterActionName` - so this is the shared helper
  // doing the job it was added for, observed across two screens off one snapshot. `tests/component/`
  // can check the helper's output; it cannot check that two different screens both route through it.
  //
  // ⚠ THIS ALSO EARNS THE ABSENCE ASSERTION AT THE END, and that is why it is worth two extra taps.
  // "the Enter is gone from the Calendar" passes in a world where the Calendar never had that name
  // at all - a broken world, by the standard the rest of this suite is held to. Establish the
  // presence, act, then assert the absence: the same shape as the recovery spec's broken database.
  //
  // ⚠ MUTATION-VERIFIED, AND IT IS THE MUTATION THE OLD VERSION SURVIVED: `:aria-label` taken off
  // the takeover's pill in CalendarScreen.vue -> red HERE, on this line. Before this step existed,
  // that same mutation left the test GREEN - the closing `toHaveCount(0)` simply counted zero for
  // the wrong reason. One weak assertion, found by fixing an unrelated locator.
  await page.getByRole('navigation').getByRole('button', { name: 'Calendar', exact: true }).click()
  await marker.click()
  await expect(page.getByRole('button', { name: entryName, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close this tournament' }).click()
  await page.getByRole('navigation').getByRole('button', { name: 'Season', exact: true }).click()

  // --- the press ---------------------------------------------------------------------------------
  await entry.click()
  // The confirm quotes the fee, which is the only thing standing between the player and an
  // irreversible spend. Asserted as the app's own `formatCents` of a number read back off the
  // screen's own sentence would be circular, so this asserts the SHAPE and the event: this confirm
  // is about this tournament and it names a price.
  // ⚠ EITHER SENTENCE ABOUT THE MONEY, AND THE WIDENING IS A RE-AIM RATHER THAN A WEAKENING (17.08).
  // The claim above is that the confirm names THIS tournament and says what it costs. It pinned
  // `Entry fee $` because every event this fixture could reach had a fee; after the skill wave re-dealt
  // the field she is world #15, the strongest event on her Season screen is a Grand Slam, and a Slam's
  // own copy is "No entry fee – the trip is still yours to pay for". That is the same statement with a
  // zero in it, so the regex takes both forms and the assertion still fails on a confirm that names no
  // price at all - which is what it exists to catch.
  const confirmLine = page.getByText(new RegExp(`Enter ${escapeRegExp(eventLabel)} \\(.*(Entry fee \\$|No entry fee)`))
  await expect(confirmLine).toBeVisible()
  // Which of the two it said, kept for the balance assertion below - the confirm is the app's own
  // promise about the money, and step 2 holds it to it.
  const freeEntry = ((await confirmLine.textContent()) ?? '').includes('No entry fee')
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
  //
  // ⚠ AND SINCE 17.08 IT IS CHECKED AGAINST WHAT THE CONFIRM PROMISED, WHICH IS STRICTLY STRONGER
  // THAN THE OLD LINE. This asserted "no longer the seeded figure" unconditionally, which was true of
  // every event the fixture could reach while she was outside the top 50. The skill wave re-dealt the
  // field, she is world #15, the soonest enterable event is now a Grand Slam - and a Slam takes NO
  // entry fee, so the balance correctly does not move and the old assertion failed on correct
  // behaviour. Widening it to "either" would have been a weakening; instead the two surfaces are made
  // to agree: the confirm said what it costs, and the balance must show exactly that. A confirm
  // promising a fee that never leaves the account still fails here, which is what the line is for.
  //
  // ⚠ THE POSITIONAL CHOICE ABOVE IS DELIBERATE AND IS NOT REOPENED - see the note on `enters.first()`:
  // pinning a fee-bearing tournament by name would make this journey a hostage to the calendar.
  const budget = page.getByRole('button', { name: /^Family budget/ })
  if (freeEntry) await expect(budget).toContainText(formatCents(facts.fundsCents))
  else await expect(budget).not.toContainText(formatCents(facts.fundsCents))

  // --- 3. and the third screen, which offered the same event and now refuses to ------------------
  // The same marker, opened again. `preferredWeekEvent` is what decides which tournament a week IS,
  // and both this screen and the Season feed read it - so the row addressed here and the card pressed
  // above are the same event by construction, not by coincidence. What has changed is the takeover's
  // answer.
  await page.getByRole('navigation').getByRole('button', { name: 'Calendar', exact: true }).click()
  await marker.click()
  await expect(page.getByText('She is in. Withdrawing lives on the Season tab.')).toBeVisible()
  // ...and the Enter that step 0 saw here, under that exact name, is gone. Three surfaces, one world.
  await expect(page.getByRole('button', { name: entryName, exact: true })).toHaveCount(0)

  expect(crashes, 'the app threw while entering a tournament').toEqual([])
})
