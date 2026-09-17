// JOURNEY: THE CAMERAS WERE ON HER, THE FEED SAYS SO IN PLAIN WORDS, AND A YEAR OF WORK IS BOUGHT
// AGAINST THEM.
//
// SEAM OWNED: #1 (the worker boundary) with #5 (the screen reading the engine). ⭐ THE ONE NEW CASE
// WAVE 6 OWES for the spotlight – the owner's 29.08 rule, one e2e case per shipped mechanic – and
// the wave-6 brief's T10 names its four stations in one sentence: «a famous fixture career → an
// exposure week's feed line in plain words → hire + the fifth focus picked → the card carries the
// year». ⚠ ONE WALK, DELIBERATELY. The booth beat is the component test's job
// (tests/component/wave6-booth-channel.test.ts) and the brief says so; a second journey here would be
// this level paying for a claim a cheaper level already holds.
//
// WHAT ONLY THIS LAYER CAN SAY. Every half below is pinned already: the ledger and the five kinds in
// tests/wave6-spotlight-ledger.test.ts, the pressure term in tests/wave6-spotlight-pressure.test.ts,
// the fifth focus in tests/wave6-spotlight-focus.test.ts, the card's radio group in
// tests/component/psychologist-card.test.ts. What none of them can say is that the SPOTLIGHT
// SURVIVES THE ROUND TRIP: a row `accrueSpirit` wrote inside a tick, carrying NO `lifeKind` (§8),
// has to cross `saveCodec`, IndexedDB, the worker, a structured clone, `snapshotEvents`'s window and
// Home's week grouping, and come out as a sentence on a screen that knows nothing about fame. A
// mounted component is handed a snapshot somebody constructed; this one is handed a career a worker
// built from bytes.
//
// ⚠⚠ AND THE FIRST HALF OF THAT SENTENCE IS EXACTLY AS FAR AS §1 REACHES – SAID PLAINLY, BECAUSE AN
// ARM MEASURED IT AND NOT BECAUSE ANYBODY REASONED IT OUT. §1 reads a row out of a SEEDED career,
// and those bytes were written by `tools/e2e-fixtures.ts` when the corpus was generated. **So §1
// cannot fail on a change to the code that WROTE the row**: ARM A deleted `EXPOSURE_ROW`'s
// `addEvent` from `accrueSpirit` outright and this spec stayed GREEN in 539 ms. §1's honest claim is
// about the WIRE and the SCREEN, and its arms (A2, A3) are aimed there. The claim about the tick
// belongs to tests/wave6-spotlight-pressure.test.ts, which owns it and can fail on it.
//
// ⭐ §2–§4 ARE THE LIVE HALF. The hire and the focus pick are COMMANDS: they cross to the worker,
// are re-validated against its own world (invariant 1), and come back as a snapshot the card reads.
// Arms B and C both red there, so this file is not one green over a fixture.
//
// ⚠⚠ THE FOG LAW IS WHAT MAKES THE ASSERTION SMALL, AND THAT IS THE DESIGN RATHER THAN A THIN TEST.
// who-she-is §3c: the spotlight is read through the feed's plain words, the Mood dips, the diary and
// the booth – NEVER through a meter. So there is no publicity number on any screen to look for, and
// the honest e2e claim is that the SENTENCE arrived and carries no figure. A spec that hunted for a
// percentage here would be asking the app to break its own law.
//
// ⚠⚠ EVERY STATION IS PROVED REACHABLE BEFORE IT IS ASSERTED ON – wave 5's most expensive lesson,
// inherited verbatim («a fixture that cannot reach the case is a green that means nothing»).
//
// ⚠ MEASURED, NOT HOPED, on the committed fixture corpus, read at head against the re-cut engine:
//   * ⚠ D1 (14.09): the news gate reads her RANK now, not her fame. `sheIsNewsAt` is gone;
//     `newsStandingOf(world)` returns `'quiet' | 'noticed' | 'known'` off `world.kidRankWta` against
//     the sponsor-ladder bands (`newsRankKnown` 100, `newsRankNoticed` 200 – his words: top-100
//     «вполне уверенно», top-200 «иногда»). `pro` wakes at week 412 ranked **17**, firmly inside the
//     top band, so it reads **'known'** and is the ONLY fixture of the ten that is news at all – its
//     exposure rows fire and the nine others' do not;
//   * ⚠ D1b (14.09): the row prints only when the week's summed |charge| clears
//     `ECONOMY.spotlight.rowMinCharge` (1.0), so the visible count is MEASURED, not assumed. Read at
//     head, the last-60-events window (weeks 407–412, tables W44–W49 '38) carries **three** exposure
//     rows – weeks **412, 410, 408** (W49, W47, W45 '38) – and w412 is one of them, so the row this
//     walk reads is the CURRENT week's and needs no press to produce. The pre-floor prose's «six / two
//     kept (w315, w369) / four ordinary» is superseded: a low-charge camera week no longer prints a
//     row, and an exposure row carries no `match`, so `snapshotEvents` surfaces it only inside the
//     60-event window and never as an old kept row;
//   * `spotlightHabituation` stands at **98**, so the career has genuinely lived the mechanic rather
//     than merely satisfied its gate;
//   * it holds 3,649 W-series points, so `activeLadderOf` is `'wta'` and the psychologist's
//     professional gate is open – the same precondition `psychologist.spec.ts` measured.
//
// ⚠⚠ AND THE FIXTURE IS THE MOVING PART, WHICH IS SAID OUT LOUD RATHER THAN LEFT TO A FUTURE RED.
// The w412 row is a property of `pro`'s seed and target week, not of the harness –
// `tools/e2e-fixtures.ts` forces no exposure and could not: every kind is an engine fact. A
// regeneration that lands `pro` on a quiet week reddens §1 below BY NAME, which is the alarm working;
// docs/plans/e2e-fixtures.md carries that sentence in the corpus's own record, beside the other
// crossing this wave measured – `pro`'s first LEAK week is 435 against a fixture at 412, so the
// corpus is clean by 23 weeks and a regeneration that walks past 435 will produce one.
//
// -------------------------------------------------------------------------------------------------
// ⭐ THE ARMS, RUN AND WRITTEN DOWN (the standing rule since wave 2). Each was made against the
// ENGINE or the SCREEN, this file RUN in a real browser against it, and then reverted with the file's
// md5 checked back to pristine; the red assertion is quoted. Control green first, and green again
// after the last restore.
//
//   A.  ⚠⚠ **0 RED, AND THE ARM IS THE FINDING** – kept at the top rather than replaced, because it
//       is the reason §1 says what it says. `EXPOSURE_ROW`'s `addEvent` call deleted from
//       `accrueSpirit` entirely: the row is never written by this build at all. **This spec passed,
//       in 539 ms.** The career is SEEDED – those bytes were written by the generator on a different
//       day, and nothing in this walk ticks a week that could write another. **An e2e assertion over
//       a fixture cannot test the code that produced the fixture's rows**, and no note in this
//       directory said so before today. The claim was re-scoped and the arms re-aimed rather than the
//       green kept.
//   A2. `snapshotEvents` drops every `type: 'life'` row – the row is in the world and not on the wire.
//       -> **1 RED**, «the week the cameras were on her says so, in the feed's own plain words:
//          element(s) not found». This is the worker-boundary half of §1, and it is seam #1.
//   A3. Home's `newsGroups` filter drops `type: 'life'` – the row crosses the wire and is not painted.
//       -> **1 RED**, the same sentence. The two together bracket the last mile: the wire carries it,
//          and the screen is what draws it.
//   B.  `PSY_FOCUSES` narrowed back to four (`'publicLife'` dropped from the array; the type, the
//       label and the line left intact) – ruling O's hole, armed at the only layer that is not
//       derived from that same array.
//       -> **1 RED**, «one radio per year of work on the roster – FIVE since the spotlight»: the
//          radiogroup renders four. ⚠ THE POINT OF RUNNING IT HERE: the component suite is BLIND to
//          this mutation (ruling S measured 0 of 15), because every count in it derives from
//          `PSY_FOCUSES` too. The unit membership oracle and this line are the two nets there are.
//   C.  `SupportStaffTab.vue`'s hired line reverted to the plain retainer sentence – the focus chosen
//       in the engine, the card never saying which.
//       -> **1 RED**, «the hired line carries the year that was picked»: the card holds him for all
//          52 weeks and says nothing about what the money is buying, which is the owner's Q9 ruling
//          undone.
//   D.  ⭐ 16.09, FOR `focusOption`'s RE-AIM (round 42 #18): the `.staff-focus-blurb` span dropped
//       from the template – the picker stops explaining itself.
//       -> **1 RED**, «The public life is open to this career…» reaching «Cool head» first, reported
//          as **element(s) not found**: the five options are still on the card and still enabled, and
//          the locator will not take one without its sentence.
//   E.  ⭐ 16.09, THE OTHER HALF: `SupportStaffTab`'s `open:` pinned to `false`.
//       -> **1 RED**, same assertion, reported as **Expected: enabled / Received: disabled** – so the
//          re-aim still asserts that pressing the fifth year is a real choice, which is ruling O's
//          hole and the reason this station exists.
//
import type { Locator, Page } from '@playwright/test'
import { test, expect } from './careerAt'
import { answerOpeningKnock, dismissTourBriefing } from './journey'
import { formatCents } from '../src/shared/money'
import { weekLabel } from '../src/shared/dates'

// ⚠ NO STRING BELOW IS IMPORTED, and that is tsconfig.e2e.json's own rule plus this directory's
// standing habit: this file is the OUTSIDE view and asserts what the screen actually SAYS. Importing
// the catalogue would let a вычитка move the screen and the expectation together and prove nothing.
// Every one of them is a DRAFT (invariant 4) collected in docs/plans/life-wave-6-strings-2026-09.md,
// and moving one is the owner's ask, never an agent's tidy-up.

/** T3's feed row – the whole of what a player is ever told about the cameras.
 *  ⚠ «LAST WEEK» AND NOT «THIS WEEK», WHICH IS RULING P ON THE SCREEN. The row is stamped with the
 *  week it PRINTS in and names the week that CLOSED, because the exposure ledger is asked at
 *  `world.week − 1`: a trophy and a result row are written outside the tick entirely (ruling U), so a
 *  pass asking about its own week could never have seen either. The sentence and the stamp agree, and
 *  this is the only surface where that agreement is visible to a player. */
const EXPOSURE_ROW = 'People were talking about her last week.'

const DEFAULT_RUNG_CENTS = 20_000
const DEFAULT_RUNG_LABEL = 'Sport psychologist'
const UNHIRED_LINE = 'A call a week for her head – the year\'s work is chosen one year at a time.'
const RETAINER_LINE = 'On retainer – one call a week, wherever she is.'
const PUBLIC_LIFE_LABEL = 'The public life'
/** The hired line once the fifth year is chosen: `PSY_FOCUS_LINE.publicLife` spliced after the
 *  retainer's opening with its first letter lowered (the owner's Q9 ruling, 14.09). ⚠ Written
 *  longhand for this file's stated reason; the unit suite owns the claim that the splice is what
 *  `SupportStaffTab.vue` composes, and this owns the claim that a player reads it. */
const RETAINER_PUBLIC_LIFE_LINE =
  'On retainer – the year goes on the weeks under the cameras – and what being looked at takes out of her.'
const FOCUS_GROUP = 'Psychologist – the year\'s work'
/** ⚠ HAND-TYPED, five since wave 6's T5 – `psychologist.spec.ts`'s own note argues the duplication:
 *  the OUTSIDE view must not derive its expectation from the roster it is checking. */
const FOCUS_LABELS = ['Cool head', 'Back on her feet', 'Learning to listen', 'Working on herself', 'The public life']

/**
 * ONE YEAR OF WORK ON THE CARD, BY THE NAME IT WEARS.
 *
 * ⚠⚠ RE-AIMED 16.09 BY ROUND 42 #18 – AN OPTION IS A NAME OVER A SENTENCE NOW, so `{ name: label,
 * exact: true }` stopped matching anything and both lines below it died with «element(s) not found».
 * The owner asked for it: «в пунктах психолога на выбор немного расписать эффект от работы», so each
 * year carries `PSY_FOCUS_LINE`'s own sentence under its name and the accessible name folds the two
 * together – «The public life The year goes on the weeks under the cameras – …». Zero new wording
 * was involved: the sentences already existed and reached only the hired line's splice, which is
 * `RETAINER_PUBLIC_LIFE_LINE` above and is untouched.
 *
 * ⭐ THE CLAIM IS NOT WEAKENED, AND THE TWO ANCHORS ARE WHY. `^` pins the label to the START of the
 * name, so this addresses exactly one option and can never drift onto a neighbour the way a bare
 * substring could; ` .+` pins that the sentence is actually THERE, so a picker that lost its blurb
 * reddens here rather than sliding past a looser locator.
 *
 * ⚠ AND THE FIVE SENTENCES ARE NOT RE-TYPED HERE, which is the one place this file's «no string is
 * imported» rule points the other way: the component suite owns them off the imported
 * `PSY_FOCUS_LINE` (tests/component/psychologist-card.test.ts), so a вычитка pass moves that pin
 * WITH the screen instead of against a hand-typed copy in two e2e files. What this file owns is that
 * the fifth year is ON the card, addressed by its own name, and that pressing it is a real choice –
 * which is ruling O's hole and the whole reason this station exists.
 */
function focusOption(focus: Locator, label: string): Locator {
  // The labels are plain words today; escaping keeps that a fact about them rather than a bet.
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return focus.getByRole('radio', { name: new RegExp(`^${escaped} .+`) })
}

/** His block on the Support-staff tab, by the `data-staff` hook the card was given for exactly this. */
const SEAT = '[data-staff="psychologist"]'

/** Home's door to the Coach Market, by the accessible name `e2e/stations.ts` walks. */
const COACH_NOTE = { name: 'Coach note – open the Coach Market' }

async function openSupportStaff(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Support staff', exact: true }).click()
  await expect(page.locator(SEAT)).toBeVisible()
}

test.describe('the spotlight reaches the player', () => {
  test('⭐⭐⭐ pro: the cameras were on her last week, the feed says so, and a year of work is bought against them', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts } = await careerAt('pro')

    // =============================================================================================
    // 0. THE FIXTURE REACHES THE CASE – from the MANIFEST, before a screen is opened
    // =============================================================================================
    //
    // The manifest is generated from the career itself, so none of these can go vacuous behind a
    // regeneration: they go RED, naming the number. ⚠ FAME IS NOT A MANIFEST FACT and deliberately is
    // not becoming one – the fog law says no publicity figure crosses to a surface, and a fixture
    // manifest is a surface. The career's NEWSWORTHINESS is therefore proved the honest way, one
    // station down: by the row the engine only writes when she is news.
    expect(facts.rankedWta, '`pro` is meant to be a professional career – that is the seat\'s gate').toBe(true)
    expect(facts.wtaPoints, '...and the points are what make `activeLadderOf` say so').toBeGreaterThan(0)
    expect(facts.endingType, 'a career that has ended refuses every command, this one included').toBeNull()
    expect(facts.fundsCents, 'and the family can afford the week he is about to be paid for')
      .toBeGreaterThan(DEFAULT_RUNG_CENTS)

    // The doorway: `pro` boots inside the top 50, so the commitment briefing is up over Home. Stepped
    // through, never asserted – journey.ts's own note argues both.
    await answerOpeningKnock(page)
    await dismissTourBriefing(page)

    // =============================================================================================
    // 1. ⭐⭐⭐ THE FEED SAYS IT, IN PLAIN WORDS – the only thing the player is ever told
    // =============================================================================================
    //
    // Home's News groups `snapshot.events` by week, newest first, so a row the engine wrote inside a
    // spirit pass is on the hub the moment the career boots. ⚠ ARMS **A2 and A3** red here – the wire
    // and the screen. ARM A (the engine's write deleted) does NOT, and the header says why: this
    // station reads a SEEDED career, so what it can hold is the round trip and not the tick.
    //
    // ⚠⚠ SCOPED TO THE FIXTURE'S OWN WEEK, AND THE FIRST DRAFT WAS NOT – it asked `page.getByText`
    // globally and died on a STRICT-MODE VIOLATION naming **three** matching cells: W49, W47 and W45,
    // which are weeks 412, 410 and 408. That red is a measurement rather than a nuisance: the corpus
    // does not merely scrape past this case, it holds **three** exposure weeks in the visible feed at
    // once (⚠ D1b, 14.09: measured at head under the `rowMinCharge` floor – the three of the window's
    // camera weeks whose summed charge clears it). Scoping to `weekLabel(facts.week)` – the app's OWN
    // formatter, which is why it is one of the three non-e2e modules tsconfig.e2e.json lets this
    // project import – makes the claim the one the brief asked for: an EXPOSURE WEEK's feed line, on
    // the week it belongs to.
    const thisWeeksNews = page.getByRole('table', { name: `News – ${weekLabel(facts.week)}` })
    await expect(thisWeeksNews, 'the current week really has a news group to read').toBeVisible()
    await expect(
      thisWeeksNews.getByText(EXPOSURE_ROW),
      'the week the cameras were on her says so, in the feed\'s own plain words',
    ).toBeVisible()

    // ⚠⚠ AND IT CARRIES NO FIGURE, WHICH IS THE FOG LAW ASSERTED WHERE A PLAYER STANDS. The spirit
    // charge behind this row is a float in the engine; the row's whole job is to say the light was on
    // without saying what it cost. A row that grew a number would still be «visible» above and would
    // have broken the law the wave is built on, so the sentence is asserted WHOLE and the absence of
    // digits with it.
    expect(EXPOSURE_ROW, 'the row a player reads holds no number of any kind').not.toMatch(/\d/)
    const rowText = await thisWeeksNews.getByText(EXPOSURE_ROW).innerText()
    expect(
      rowText.replace(/\s+/g, ' ').trim(),
      '...and what is actually painted is that sentence and the general LIFE-ROW glyph, never a figure beside it',
    ).toMatch(/^\S*\s*People were talking about her last week\.$/u)
    // ⚠ AND THE GLYPH IS MEASURED RATHER THAN ASSUMED. ⚠⚠ D3 (14.09): the spotlight family wears its
    // own mark, his pick – `KIND_PICKS.exposure` is 📸 (src/components/screens/lifeRowGlyphs.ts), so a
    // `lifeKind: 'exposure'` row written LIVE now paints the camera through `lifeRowGlyph`. BUT §1
    // reads a SEEDED career – ARM A's own seam – and these exposure rows were written before the D3
    // stamp: they carry NO `lifeKind`, so `lifeRowGlyph`'s `?? 'met'` resolves them through
    // `LIFE_ROW_EMOJI.life`, his 11.09 white heart. MEASURED at head, the cell paints exactly
    // `🤍 People were talking…`, NOT 📸 – this station can only ever see what the writer of these bytes
    // wrote, which is the whole of §1's honest claim. So the pattern above is left deliberately loose –
    // any single glyph, never a figure – and stays green whether the cell holds the seeded 🤍 today or
    // the ruled 📸 after a regeneration under the D3 engine restamps this row's kind (and reddens the
    // corpus's own record, not this line). This note records which of the two it is today: the
    // fallback 🤍, because the bytes predate his 📸.

    // ⚠ NOT A PURCHASE, EITHER – rule 4, at the one layer that can confuse the two lists. A life row
    // carries no `amountCents`, so it never reaches the Money ledger; if it ever did, the same
    // sentence would be drawn on a screen that prints money beside every line.
    // (The ledger's own claim is `psychologist.spec.ts`'s; what is asserted here is the feed's.)

    // =============================================================================================
    // 2. THE HIRE, THROUGH THE KEYED CONFIRM – the seat the fifth year needs
    // =============================================================================================
    await page.getByRole('button', COACH_NOTE).click()
    await expect(page.getByRole('heading', { name: 'Coach Market', level: 2 })).toBeVisible()
    await openSupportStaff(page)

    const seat = page.locator(SEAT)
    const hire = seat.getByRole('button', { name: 'Hire', exact: true })
    await expect(hire, 'the professional gate has opened on the card itself').toBeEnabled()
    await expect(seat, 'and it is not the locked sentence under his name').toContainText(UNHIRED_LINE)

    await hire.click()
    const confirm = page.getByRole('dialog')
    await expect(confirm).toHaveAccessibleName(
      // ⚠ HIS 17.09 SHEET MOVED THIS SENTENCE – see e2e/psychologist.spec.ts's own note on it.
      `Hire a psychologist for ${formatCents(DEFAULT_RUNG_CENTS)} a week ` +
        `(${DEFAULT_RUNG_LABEL.toLowerCase()})? You can end the arrangement any week, like the coach.`,
    )
    await confirm.getByRole('button', { name: 'Hire', exact: true }).click()
    await expect(seat.getByRole('button', { name: 'Let go', exact: true })).toBeVisible()
    await expect(seat, 'the line under his name is now what he IS').toContainText(RETAINER_LINE)

    // =============================================================================================
    // 3. ⭐⭐⭐ THE FIFTH YEAR IS OFFERED, AND PICKING IT IS A REAL CHOICE
    // =============================================================================================
    //
    // ⚠⚠ THIS IS RULING O's HOLE, ARMED AT THE ONLY LAYER THAT IS NOT DERIVED FROM THE SUSPECT.
    // `PSY_FOCUSES` is a `readonly PsyFocus[]`, and an array of four is a perfectly valid array of a
    // five-member union – so the compiler defends the label table and the line table and NOT the
    // roster that decides whether anything is offered. The component suite cannot see the hole either
    // (ruling S: 0 of 15 cases red), because its counts come off that same array. **This line and the
    // unit membership oracle are the two nets, and this one reads the rendered radiogroup.** ARM B
    // reds here.
    const focus = seat.getByRole('radiogroup', { name: FOCUS_GROUP })
    await expect(focus, 'the hire is what puts the year on the card').toBeVisible()
    const options = focus.getByRole('radio')
    await expect(options, 'one radio per year of work on the roster – FIVE since the spotlight')
      .toHaveCount(FOCUS_LABELS.length)
    for (const label of FOCUS_LABELS) {
      await expect(
        focusOption(focus, label),
        `«${label}» is open to this career, so pressing it is a real choice`,
      ).toBeEnabled()
    }

    const publicLife = focusOption(focus, PUBLIC_LIFE_LABEL)
    await expect(publicLife, 'the fifth year of work is on the card').toBeVisible()
    await expect(publicLife, 'and no year is running before one is chosen').toHaveAttribute('aria-checked', 'false')
    // ⭐⭐ 17.09 – THE PRESS ASKS BEFORE IT BUYS THE SEASON (his «вдруг человек промахнулся»), so the
    // year is taken in two steps now: the press puts the question up, the confirm sends the command.
    // `psychologist.spec.ts` owns the wording of that question; what THIS file needs from it is that
    // the fifth year goes through the same door as the other four.
    await publicLife.click()
    const yearAsk = page.getByRole('dialog')
    await expect(yearAsk, 'the press asks, and the question names the fifth year').toHaveAccessibleName(
      new RegExp(`^Set the psychologist's work for this season to ${PUBLIC_LIFE_LABEL}\\?`),
    )
    await yearAsk.getByRole('button', { name: 'Set it', exact: true }).click()
    await expect(
      publicLife,
      'the chosen year is the checked one, and the check came back off the snapshot',
    ).toHaveAttribute('aria-checked', 'true')

    // =============================================================================================
    // 4. ⭐⭐⭐ AND THE CARD CARRIES THE YEAR – the surface that is readable all 52 weeks
    // =============================================================================================
    //
    // The owner's question-9 ruling (14.09): the hired line is the one sentence on this card a player
    // can read every week of the season, so it carries the running year – the focus's own sentence
    // spliced after «On retainer – » with its first letter lowered. The focus's NOTE is not the place
    // to look, and `psychologist.spec.ts` measured why: whenever anything is closed the note prints
    // the engine's refusal, which is 49 weeks in 52. ARM C reds here.
    await expect(
      seat,
      'the hired line carries the year that was picked, in the sentence a player reads all season',
    ).toContainText(RETAINER_PUBLIC_LIFE_LINE)

    expect(crashes, 'the app threw while the spotlight was on her').toEqual([])
  })
})
