// JOURNEY: A PSYCHOLOGIST GOES ON THE PAYROLL, GETS A YEAR OF WORK, AND IS BILLED FOR IT.
//
// SEAM OWNED: #1 (the worker boundary) with #5 (the screen reading the engine) carrying it. ⭐ THE
// ONE NEW CASE WAVE 5 OWES for the psychologist's seat – the owner's 29.08 rule, one e2e case per
// shipped mechanic – and the wave-5 brief's T11 names its five stations: a pro-unlocked fixture
// career, the hire at the DEFAULT rung, the focus pick, the weekly salary row in the feed, and the
// staff card holding him afterwards.
//
// WHAT ONLY THIS LAYER CAN SAY. Every half of the seat is pinned below already: the engine's
// commands and their refusals in tests/wave5-psychologist-seat.test.ts and its siblings, the card's
// two radio groups mounted in tests/component/psychologist-card.test.ts. What neither can say is
// that the seat SURVIVES THE ROUND TRIP: `hirePsychologist` and `setPsychologistFocus` are commands
// the worker re-validates against its own world (invariant 1), the salary is charged inside a tick
// nobody on this side watches, and the row comes back through a structured clone into a ledger on a
// different screen. A mounted component is handed a snapshot somebody constructed; this one is
// handed a career a worker built from bytes, and then made to spend a week of it.
//
// ⚠⚠ EVERY STATION IS PROVED REACHABLE BEFORE IT IS ASSERTED ON, which is this wave's own most
// expensive lesson (ruling O's second blind spot, and T6b's forty-week walk that contained none of
// the thing it was walking for: «a fixture that cannot reach the case is a green that means
// nothing»). It bit twice in this wave, so each station below is preceded by the assertion that the
// career can reach it – the ladder from the MANIFEST, the unlock from the card's own control, the
// consent gates from every option on the roster being live – and each of those goes red NAMING the state
// rather than letting a click time out somewhere later.
//
// ⚠ MEASURED, NOT HOPED, before a line of this file was written (probe on the regenerated fixture):
// `pro` wakes at week 412 holding 3,649 W-series points (so `activeLadderOf` is `'wta'` and the seat
// is unlocked), a bond of 71 – `steady` – so every year of work is open to a 21-year-old under
// the 18+ joint-consent rule, no college freeze, and no blocking decision but the top-50 briefing.
// One press then bills him: the salary row is stamped with the week the tick ARRIVES at, so a single
// advance is enough and the booked family holiday sitting on week 412 never comes into it.
//
// -------------------------------------------------------------------------------------------------
// ⭐ THE ARMS, RUN AND WRITTEN DOWN (the standing rule since wave 2). Each was made against the
// ENGINE or the SCREEN, this file RUN in a real browser against it, and then reverted with the file's
// md5 checked back to pristine; the red assertion is quoted. Control green first (1 passed, 11.9 s),
// and green again after the last restore.
//
//   A. `resolvePsychologist` returns before it charges – the seat hired, the year set, nothing billed.
//      -> **1 RED**, «the ledger carries his weekly salary»: the ledger draws every other row of the
//         same week and his is simply not there. This is the arm that says the assertion is about the
//         ENGINE's tick and not about the card that sent the command.
//   B. `SupportStaffTab.vue`'s focus row `v-if="m.focus && m.hired"` widened to `v-if="m.focus"` –
//      the year offered before there is anybody to work it.
//      -> **1 RED**, «no year of work is offered before there is somebody to work it»: the radiogroup
//         is on the card while the seat is empty, which is the round-20 #1 defect (a control that lies
//         about itself) and the one thing the engine cannot refuse its way out of.
//   C. `psychologistFocusRefusal`'s season guard short-circuited – every year stays open after the
//      pick.
//      -> **1 RED**, «the card explains the closed year with the engine's own sentence»: O1's
//         one-choice-a-year is the only thing that closes the row, and this is the layer that watches
//         the closing cross the wire.
//   D. ⭐ 16.09, FOR `focusOption`'s RE-AIM (round 42 #18): the `.staff-focus-blurb` span dropped
//      from the template – the picker stops explaining itself.
//      -> **1 RED**, «Cool head is open to this career…», reported as **element(s) not found**: the
//         option is still on the card and still enabled, and the locator will not take it without
//         the sentence. That is the line that says the re-aim is not a loosening.
//   E. ⭐ 16.09, THE OTHER HALF OF THE SAME RE-AIM: `SupportStaffTab`'s `open:` pinned to `false`.
//      -> **1 RED**, same assertion, reported as **Expected: enabled / Received: disabled**. Two arms
//         and two different messages is what makes the pair a diagnosis rather than a tripwire: D is
//         a name that moved, E is a permission that closed, and this file can tell them apart.
//
// ⚠⚠ AND THE «UNABLE TO FAIL» FAMILY TOOK A TENTH COSTUME IN THIS FILE'S FIRST DRAFTING, caught by
// the browser rather than by review. «The week advanced» was written
// `getByText(onScreenWeek(week + 1))`, and that **passes on a page that has not moved**: the
// week-ahead strip already carries the next week's date line before any press. Measured, not
// reasoned – the run that passed that line went on to reach a Money screen still showing the SEEDED
// funds and the seeded week. It is Home's own H1 now, and the wait before it is the app's own
// navigation to the week story, which only happens when the worker has answered.
//
// ⚠ A SECOND EXPECTATION WAS SIMPLY WRONG, WHICH IS THE OPPOSITE PROBLEM AND WORTH AS MUCH. The note
// under the focus row was expected to read `PSY_FOCUS_LINE.coolhead` after the pick. It does not: the
// note is the ENGINE's refusal whenever anything is closed, so the focus's own sentence is on screen
// only during the three off-season weeks a year when the change window is open. A real red, on a real
// expectation, from the one layer that could have produced it – and a finding about four of the
// wave's strings, carried to the architect as one.
//
import type { Locator, Page } from '@playwright/test'
import { test, expect } from './careerAt'
import { answerOpeningKnock, dismissTourBriefing, openMoney, onScreenWeek, weekButton } from './journey'
import { navTab } from './stations'
import { formatCents, formatCentsSigned } from '../src/shared/money'

// ⚠ THE PRICE IS WRITTEN OUT, NOT IMPORTED, and that is tsconfig.e2e.json's own rule («what must
// never be listed is anything that reaches the engine»). `ECONOMY.psychologist.rungs[1]` is the
// DEFAULT rung at 20,000 cents a week; the unit layer owns the claim that the default index IS 1 and
// that its price IS that number. What this file owns is that the number the engine charged is the
// number the card promised – so both are rendered through the product's own formatter rather than
// spelled «$200» by hand, exactly as `formatCents(facts.fundsCents)` is elsewhere in this directory.
const DEFAULT_RUNG_CENTS = 20_000
const DEFAULT_RUNG_LABEL = 'Sport psychologist'

// ⚠ NO STRING BELOW IS TRANSCRIBED FOR CONVENIENCE. Every one is a DRAFT the вычитка has already
// read (docs/plans/life-wave-5-strings-2026-09.md §1–§2), and it is written longhand here for the
// reason tests/component/round21-coach.test.ts gives about the plaque sentences: a change to any of
// them has to be deliberate, and invariant 4 says a change is the owner's to ask for.
const SALARY_ROW = 'Psychologist – weekly salary'
const RETAINER_LINE = 'On retainer – one call a week, wherever she is.'
/** The hired line once a year is chosen (the owner's question-9 ruling, 14.09): the coolhead
 *  sentence spliced after the retainer's opening, first letter lowered. ⚠ A deliberate literal,
 *  like every string this file pins – it is what a player READS; the component suite (§3b of the
 *  card test) derives the same splice from the imported `PSY_FOCUS_LINE`, so a вычитка move over
 *  that catalogue reds the pair together rather than only one of them. */
const RETAINER_YEAR_LINE = 'On retainer – the year goes on the big points – the head she takes into them.'
const UNHIRED_LINE = 'A call a week for her head – the year\'s work is chosen one year at a time.'
const COOLHEAD_LABEL = 'Cool head'
const FOCUS_SEASON_REFUSAL =
  'The year already has its work – the next one is chosen in the off-season, once a season.'
const RUNG_GROUP = 'Psychologist – who takes the weekly call'
const FOCUS_GROUP = 'Psychologist – the year\'s work'
/** ⚠ RE-AIMED 14.09 BY WAVE 6's T5: «The public life» (O7, the fifth year-focus) joined the roster,
 *  so the card offers FIVE years and this list – and every count below that reads it – grew with it.
 *  ⚠ HAND-TYPED ON PURPOSE, unchanged as a decision: this file is the OUTSIDE view and asserts what
 *  the screen actually says, so importing `PSY_FOCUS_LABEL` here would let a вычитка move the screen
 *  and the expectation together and prove nothing. T8's read of the drafts moves this line by hand.
 *  ⚠ AND THE COUNTS BELOW ARE `FOCUS_LABELS.length` RATHER THAN A LITERAL `4`, so the next focus
 *  costs one edit here instead of four scattered ones. */
const FOCUS_LABELS = ['Cool head', 'Back on her feet', 'Learning to listen', 'Working on herself', 'The public life']

/**
 * ONE YEAR OF WORK ON THE CARD, BY THE NAME IT WEARS.
 *
 * ⚠⚠ RE-AIMED 16.09 BY ROUND 42 #18 – AN OPTION IS A NAME OVER A SENTENCE NOW, so every line that
 * used `{ name: label, exact: true }` stopped matching anything and died with «element(s) not
 * found». The owner asked for it: «в пунктах психолога на выбор немного расписать эффект от работы»,
 * so each year carries `PSY_FOCUS_LINE`'s own sentence under its name and the accessible name folds
 * the two together – «Cool head The year goes on the big points – the head she takes into them.»
 * ⚠ ZERO NEW WORDING WAS INVOLVED, in the item and here: the sentences already existed and reached
 * only the hired line's splice. What moved is where the words are, and therefore what this locator
 * has to say.
 *
 * ⭐ THE CLAIM IS NOT WEAKENED, AND THE TWO ANCHORS ARE WHY. `^` pins the label to the START of the
 * name, so this addresses exactly one option and can never drift onto a neighbour the way a bare
 * substring could; ` .+` pins that the sentence is actually THERE, so a picker that lost its blurb
 * reddens here rather than sliding past a looser locator.
 *
 * ⚠ AND THE FIVE SENTENCES ARE DELIBERATELY NOT RE-TYPED IN THIS FILE, which is the one place this
 * file's own «no string is transcribed for convenience» rule points the other way. The component
 * suite already owns them off the IMPORTED `PSY_FOCUS_LINE` (tests/component/psychologist-card.test.ts,
 * «every option says what its year is FOR»), so a вычитка pass moves that pin WITH the screen; a
 * second hand-typed copy here would move against it and would make five prose edits red two layers
 * for one change. What this file owns is that the option is on the card, addressed by the year's
 * name, and that pressing it is a real choice.
 */
function focusOption(focus: Locator, label: string): Locator {
  // The labels are plain words today; escaping keeps that a fact about them rather than a bet.
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return focus.getByRole('radio', { name: new RegExp(`^${escaped} .+`) })
}

/** His own block on the Support-staff tab, addressed by the `data-staff` hook the card was given for
 *  exactly this (SupportStaffTab.vue's own note). Scoped rather than global because the tab is a LIST
 *  and the masseur one block up offers a button with the same word on it. */
const SEAT = '[data-staff="psychologist"]'

/** Home's door to the Coach Market, by the accessible name `e2e/stations.ts` walks. */
const COACH_NOTE = { name: 'Coach note - open the Coach Market' }

/** Coach Market -> the third tab, which is where the seats live. */
async function openSupportStaff(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Support staff', exact: true }).click()
  await expect(page.locator(SEAT)).toBeVisible()
}

/**
 * THE SEASON WRAP-UP, IF THIS PRESS HAPPENED TO CROSS A BOUNDARY.
 *
 * ⚠ A CONDITIONAL IN A TEST IS A SMELL, AND THIS ONE IS ARGUED FOR rather than shrugged at – the
 * same argument `answerOpeningKnock` makes one file over. `pro` wakes at week 412 and its season
 * closes on the very next tick, which is FIXTURE STATE: where the generator's search stopped, not
 * anything about a psychologist. The card is a blocking `role="dialog"` and would intercept every
 * click after the press, so it is stepped through here and asserted nowhere: `week-advance.spec.ts`
 * owns the claim that a season boundary raises it and that its labels are right. If a regeneration
 * moves `pro` off the boundary this keeps working, and that one spec is where it goes red.
 */
async function dismissSeasonWrapUp(page: Page): Promise<void> {
  const wrapUp = page.getByRole('dialog')
  if (await wrapUp.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
}

test.describe('the psychologist takes the weekly call', () => {
  test('pro: hired at the default rung, given a year of work, and on the ledger the week after', async ({
    page,
    careerAt,
  }) => {
    const crashes: string[] = []
    page.on('pageerror', (error) => crashes.push(error.message))

    const { facts } = await careerAt('pro')

    // =============================================================================================
    // 0. THE FIXTURE REACHES THE CASE – asserted from the MANIFEST, before a screen is opened
    // =============================================================================================
    //
    // The manifest is generated from the career itself, so neither line below can go vacuous behind a
    // regeneration: it would go RED, naming the number. `psychologistUnlocked` is
    // `activeLadderOf(world) === 'wta'`, and W-series points are one of the two things that make that
    // true – the sufficient half, which is all a precondition needs.
    expect(facts.rankedWta, '`pro` is meant to be a professional career – that is the seat\'s gate').toBe(true)
    expect(facts.wtaPoints, '...and the points are what make `activeLadderOf` say so').toBeGreaterThan(0)
    expect(facts.endingType, 'a career that has ended refuses every command, this one included').toBeNull()
    expect(
      facts.fundsCents,
      'and the family can afford the week he is about to be paid for',
    ).toBeGreaterThan(DEFAULT_RUNG_CENTS)

    // The doorway: `pro` boots inside the top 50, so the commitment briefing is up over Home. Stepped
    // through, never asserted - journey.ts's own note argues both.
    await answerOpeningKnock(page)
    await dismissTourBriefing(page)

    // =============================================================================================
    // 1. THE CARD, BEFORE ANYTHING IS BOUGHT
    // =============================================================================================
    await page.getByRole('button', COACH_NOTE).click()
    await expect(page.getByRole('heading', { name: 'Coach Market', level: 2 })).toBeVisible()
    await openSupportStaff(page)

    const seat = page.locator(SEAT)
    const hire = seat.getByRole('button', { name: 'Hire', exact: true })

    // ⚠ THE UNLOCK, READ OFF THE SCREEN AND NOT OFF THE MANIFEST. §0 says the career is professional;
    // this says the card AGREES - a locked seat draws the word `Locked` and no control at all, so a
    // live Hire button is the gate having crossed the worker boundary. Arm C reds here.
    await expect(hire, 'the professional gate has opened on the card itself').toBeEnabled()
    await expect(seat, 'and it is not the locked sentence under his name').toContainText(UNHIRED_LINE)
    await expect(seat, 'his head carries the retainer he would cost').toContainText(
      `${formatCents(DEFAULT_RUNG_CENTS)} /wk`,
    )

    // THE ROSTER IS OFFERED BEFORE THE HIRE and the default is already on it - choosing the
    // arrangement before buying it is what prices the confirm honestly (the dial's own note). This
    // walk never touches it: the brief asks for the hire AT THE DEFAULT RUNG, so the assertion is
    // that the default is what a parent who touches nothing gets.
    const rungs = seat.getByRole('radiogroup', { name: RUNG_GROUP }).getByRole('radio')
    await expect(rungs, 'the spec\'s three rungs').toHaveCount(3)
    await expect(
      rungs.filter({ hasText: DEFAULT_RUNG_LABEL }),
      'the middle rung is the one checked before anybody chooses',
    ).toHaveAttribute('aria-checked', 'true')

    // ⚠ AND NO YEAR OF WORK IS ON OFFER YET. The engine refuses a focus with nobody on the payroll,
    // so a row offered here would be a control lying about itself. Arm B reds on this line.
    await expect(
      seat.getByRole('radiogroup', { name: FOCUS_GROUP }),
      'no year of work is offered before there is somebody to work it',
    ).toHaveCount(0)

    // =============================================================================================
    // 2. THE HIRE, THROUGH THE KEYED CONFIRM
    // =============================================================================================
    await hire.click()
    const confirm = page.getByRole('dialog')
    // The message is the dialog's accessible NAME (ConfirmDialog's own doctrine: a confirm can never
    // be announced as a generic "Confirm"), and it quotes back the price and the rung being bought.
    await expect(confirm).toHaveAccessibleName(
      `Put a psychologist on the payroll at ${formatCents(DEFAULT_RUNG_CENTS)} a week ` +
        `(${DEFAULT_RUNG_LABEL.toLowerCase()})? Cancellable any week, like the coach.`,
    )
    await confirm.getByRole('button', { name: 'Hire', exact: true }).click()

    // The command crossed the wire and the world came back changed: the card offers the other
    // direction, and the line under his name is the retainer's rather than the offer's.
    await expect(seat.getByRole('button', { name: 'Let go', exact: true })).toBeVisible()
    await expect(seat, 'the line under his name is now what he IS').toContainText(RETAINER_LINE)

    // =============================================================================================
    // 3. THE YEAR'S WORK – the row that only exists once he does
    // =============================================================================================
    const focus = seat.getByRole('radiogroup', { name: FOCUS_GROUP })
    await expect(focus, 'the hire is what puts the year on the card').toBeVisible()
    const options = focus.getByRole('radio')
    await expect(options, 'one radio per year of work on the roster').toHaveCount(FOCUS_LABELS.length)

    // ⚠⚠ THE CONSENT GATES ARE PROVED OPEN BEFORE ONE IS PRESSED. Both of them read the bond BAND:
    // from 18 a strained/cold bond declines any pick, and «Working on herself» needs readiness at any
    // age. `pro` is 21 at a `steady` bond, so all five are live - and if a regeneration ever walks her
    // bond down, THIS line names it instead of a click timing out three stations later.
    for (const label of FOCUS_LABELS) {
      await expect(
        focusOption(focus, label),
        `«${label}» is open to this career, so pressing it is a real choice`,
      ).toBeEnabled()
    }
    for (let i = 0; i < FOCUS_LABELS.length; i++) {
      await expect(options.nth(i), 'no year is running before one is chosen').toHaveAttribute(
        'aria-checked',
        'false',
      )
    }

    await focusOption(focus, COOLHEAD_LABEL).click()
    await expect(
      focusOption(focus, COOLHEAD_LABEL),
      'the chosen year is the checked one, and the check came back off the snapshot',
    ).toHaveAttribute('aria-checked', 'true')
    // ⭐⭐ ...AND THE YEAR CLOSES BEHIND HIM, IN THE ENGINE'S OWN WORDS. The free pick is spent, this
    // week is not the off-season, so O1's «one choice a year, at the season boundary» now refuses a
    // change – and the card says so with the sentence the command throws, off the wire
    // (`psychologistFocusDetail`), never a sentence the screen wrote. The pills and the note are the
    // R10-16 pair: a refused control is actually refused AND is explained in one story.
    //
    // ⚠ MEASURED RATHER THAN EXPECTED, and the first drafting of this file expected the other thing.
    // `PSY_FOCUS_LINE.coolhead` («The year goes on the big points…») is what the note prints only
    // while NOTHING is closed – which, after a pick, is the three off-season weeks of each year and
    // nothing else. The focus LINES are therefore reachable on screen for 3 weeks in 52; the
    // refusal below is what a player sees for the other 49, and it is the honest thing to pin here.
    await expect(seat, 'the card explains the closed year with the engine\'s own sentence').toContainText(
      FOCUS_SEASON_REFUSAL,
    )
    // ⭐ 14.09, THE OWNER'S QUESTION-9 RULING, visible the moment the year is picked: the HIRED
    // line – the one surface on this card that is readable all 52 weeks – now carries the running
    // year, the focus's own sentence spliced after the retainer's opening. The paragraph above
    // stays true of the NOTE; this line is the answer it asked for.
    await expect(seat, 'the hired line carries the running year from the pick on').toContainText(
      RETAINER_YEAR_LINE,
    )
    for (const label of FOCUS_LABELS.filter((l) => l !== COOLHEAD_LABEL)) {
      await expect(
        focusOption(focus, label),
        `«${label}» is refused for the rest of this season, and the button says so by being dead`,
      ).toBeDisabled()
    }

    // =============================================================================================
    // 4. ONE WEEK LATER, THE MONEY – the row the whole seat is paid through
    // =============================================================================================
    // ⚠ HOME'S OWN H1 AND NOT `getByText`, and the first drafting of this file learned why: the date
    // line for the week AHEAD is already on Home before anything is pressed (the week-ahead strip
    // says where the press would go), so `getByText(onScreenWeek(week + 1))` passes on a page that
    // has not moved – an assertion unable to fail, in this wave's sixth costume. The H1 is the week
    // the career IS on, it is the locator `e2e/stations.ts` parks against, and it moves only when the
    // world does.
    const homeWeek = (week: number) =>
      page.getByRole('heading', { level: 1, name: onScreenWeek(week) })

    await navTab(page, 'Home')
    await expect(homeWeek(facts.week), 'Home is on the week the manifest describes').toBeVisible()
    await weekButton(page).click()
    // The tick resolved, and the app opened the week's own story by itself – a NAVIGATION the app
    // performs, which is the web-first wait for the worker having answered.
    await expect(page.getByRole('region', { name: /^Week story/ })).toBeVisible()
    await dismissSeasonWrapUp(page)

    await navTab(page, 'Home')
    await expect(homeWeek(facts.week + 1), 'the press really moved the world on a week').toBeVisible()
    await openMoney(page)
    await page
      .getByRole('group', { name: 'Which part of the budget' })
      .getByRole('button', { name: 'History' })
      .click()

    // ⚠ THE LEDGER AND NOT THE HOUSEHOLD STRIP, deliberately. The strip carries a TOTAL, and a total
    // moves for a dozen reasons; the ledger carries the engine's own row text and the engine's own
    // signed figure, which is the only surface where «he was paid, and this is what he was paid» is a
    // single readable fact. Arm A reds here.
    const salaryRow = page.locator('.ledger-week').filter({ hasText: SALARY_ROW })
    await expect(salaryRow, 'the ledger carries his weekly salary').toHaveCount(1)
    await expect(
      salaryRow,
      'and the figure is the retainer the card promised, to the cent',
    ).toContainText(formatCentsSigned(-DEFAULT_RUNG_CENTS))

    // =============================================================================================
    // 5. AND THE CARD STILL HOLDS HIM – the station the brief closes on
    // =============================================================================================
    //
    // A week has been played and a screen has been left and come back to, so this is the seat read
    // out of a world that has TICKED rather than out of the answer to the command that created it.
    //
    // ⚠ WHAT IS DELIBERATELY NOT ASSERTED HERE: the note under the row. Measured, `pro`'s next week
    // is an off-season week, so the change window reopens and the note becomes the focus's own
    // sentence again – true of this fixture and a fact about where its search stopped, not about the
    // seat. §3 pins the sentence a player meets for 49 weeks in 52; this station pins only what is
    // true of the seat on any week it lands on.
    await navTab(page, 'Home')
    await page.getByRole('button', COACH_NOTE).click()
    await openSupportStaff(page)
    await expect(seat.getByRole('button', { name: 'Let go', exact: true })).toBeVisible()
    // ⚠ RE-AIMED 14.09 by the question-9 ruling that landed mid-file: with a year running, the
    // hired line IS the year's line now – asserting the plain retainer here went red the honest
    // way, the same day the splice shipped.
    await expect(seat, 'still on retainer a week later, wearing the running year').toContainText(RETAINER_YEAR_LINE)
    await expect(
      focusOption(seat.getByRole('radiogroup', { name: FOCUS_GROUP }), COOLHEAD_LABEL),
      'and the year he was given is still the year he is working',
    ).toHaveAttribute('aria-checked', 'true')

    expect(crashes, 'the app threw while a psychologist went on the payroll').toEqual([])
  })
})
