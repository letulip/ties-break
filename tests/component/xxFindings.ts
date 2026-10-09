// THE CARPET'S FINDINGS LEDGER – wave L4-2. One row per thing the `xx` carpet found on a surface, with the file that holds it.
// The suite asserts «observed == this list» BOTH ways (xxCarpet.ts): a new leak/overflow/dismiss failure is red, and a row nobody
// observes any more is red too – so the list only ever shrinks, and fixing a finding means deleting its row in the same commit.
//
// ⚠ NOBODY FIXES THESE IN THIS FILE'S WAVE. Layout and copy are the owner's: the rows are his morning pile.
//   kind     `leak`        an unbracketed text node/attribute that is neither allowlisted nor an engine word (an unwrapped literal)
//            `overflow`    a text box whose unbreakable run is wider than its room under xx (and was not in English)
//            `overflow-en` the same, already in ENGLISH – the xx pad only deepens it
//            `dismiss`     a blocking surface's decision block leaves the phone under xx, and did not in English
//            `dismiss-en`  it leaves the phone in ENGLISH already
//   detail   the text with its digits written `N` / the viewport + failure class – NEVER a ratio (a layout nudge, or a tuning pass that moves a
//            threshold, must not churn the ledger)
//   area     the carpet file that mounts the surface (a row naming a surface of another file would never be compared)
//
// ⚠ THE FIRST LOOK (10.10): 75 rows on 13 surfaces, ZERO overflows and ZERO dismiss failures across the 86 surfaces. Every leak row is a
// literal in a template or a composable; none is an engine word (the allowlist absolves those by EXACT snapshot value, never by pattern).
export interface Finding {
  area: 'screens' | 'cards' | 'overlays' | 'takeovers'
  surface: string
  kind: 'leak' | 'overflow' | 'overflow-en' | 'dismiss' | 'dismiss-en'
  detail: string
  note: string
}

const N_HOMESCREEN = 'the tier strip\'s chip titles: tierState.ts:1142 builds `<tier> – open to her, next one <weeks>`, tierState.ts:977 builds the `locked: N more ... (she has X of Y)` line, HomeScreen.vue:853 passes `spoken: \'Unlocked – enter your first!\'`. L2-3\'s arm still allowlists `/^(?:Local|Regional|National|Junior|Pro|...)\\b/`, which matches all three; L2-4 dropped the same pattern at L2-6 step 0 (L2-5 finding 2)'
const N_THISWEEKSCREEN = 'the weekday initials of the week strip: WeekRecapCard.vue:156 `DAY_LETTERS = [\'M\',\'T\',\'W\',\'T\',\'F\',\'S\',\'S\']` is a literal array (L2-3\'s recap arm asserts exactly these seven letters as a named leftover); ThisWeekScreen shows the same strip'
const N_CALENDARSCREEN = 'the calendar grid\'s block lexicon (weekGrid.ts:1243 onward: `Serve work`, `Point play`, `Speed work`, ...) and its day-summary sentences – RU-03 §15, L2-3\'s named leftover for a later commit of its batch'
const N_KIDSCREEN = '`National Unranked`: KidScreen.vue:239 reads `rankLabel` (shared/format.ts), an English formatter with no catalog row; StatsScreen, SeasonScreen and kidIdentity.ts wrap the same word with t(\'Unranked\')'
const N_WEEKRECAPCARD = 'the weekday initials: WeekRecapCard.vue:156 `DAY_LETTERS` – L2-3\'s named leftover (see ThisWeekScreen)'
const N_RAILDASHBOARD = 'RailDashboard.vue:99 – `<Eyebrow>In the account</Eyebrow>` is a literal; no wave swept the rail'
const N_WEEKSPANREPORT = 'WeekSpanReport.vue – the heading sentence and the Close button are literals; no wave swept the span report (the rows are the engine\'s diary text)'
const N_INBOXSHEET_SIGN_QUESTION = 'ConfirmDialog.vue:46 – the DEFAULT `cancelLabel: \'Cancel\'` (and `confirmLabel: \'Confirm\'`) are English prop defaults; a caller that passes a label is wrapped, a caller that relies on the default (the inbox\'s sign question) is not'
const N_TOURBRIEFINGDIALOG = 'TourBriefingDialog.vue:147,160 and the kicker/lead/Continue – the card is the L1b sweep\'s named \'unwrapped\' dialog and no wave wrapped its chrome; the body rides L3-3\'s CopyRefs'
const N_SEASONSUMMARYDIALOG = 'SeasonSummaryDialog.vue – the whole wrap-up card is literal (title, kicker, every key and the money block); no wave swept it'
const N_SHOOTCLASHDIALOG = 'ShootClashDialog.vue:73 onward – the kicker, the lead, the four answers\' verbs and consequences are literals; no wave swept the collision card'
const N_RANKHELPDIALOG = 'RankHelpDialog.vue:95 onward – the title, the lede, the three table headings and their rules are literals; no wave swept the help card (RailIdentity wraps only its trigger\'s label)'
const N_APP_SHELL = 'the shell mounts Home and the dashboard rail, so it carries their findings (HomeScreen and RailDashboard rows)'

export const FINDINGS: readonly Finding[] = [
  { area: 'screens', surface: 'HomeScreen', kind: 'leak', detail: 'Local Open – open to her, next one Oct N – Nov N, N', note: N_HOMESCREEN },
  { area: 'screens', surface: 'HomeScreen', kind: 'leak', detail: 'Local: Unlocked – enter your first!', note: N_HOMESCREEN },
  { area: 'screens', surface: 'HomeScreen', kind: 'leak', detail: 'Regional Championship – locked: N more national pts (she has N of N) – N more ', note: N_HOMESCREEN },
  { area: 'screens', surface: 'ThisWeekScreen', kind: 'leak', detail: 'M', note: N_THISWEEKSCREEN },
  { area: 'screens', surface: 'ThisWeekScreen', kind: 'leak', detail: 'T', note: N_THISWEEKSCREEN },
  { area: 'screens', surface: 'ThisWeekScreen', kind: 'leak', detail: 'W', note: N_THISWEEKSCREEN },
  { area: 'screens', surface: 'ThisWeekScreen', kind: 'leak', detail: 'F', note: N_THISWEEKSCREEN },
  { area: 'screens', surface: 'ThisWeekScreen', kind: 'leak', detail: 'S', note: N_THISWEEKSCREEN },
  { area: 'screens', surface: 'CalendarScreen', kind: 'leak', detail: 'Serve work', note: N_CALENDARSCREEN },
  { area: 'screens', surface: 'CalendarScreen', kind: 'leak', detail: 'Study', note: N_CALENDARSCREEN },
  { area: 'screens', surface: 'CalendarScreen', kind: 'leak', detail: 'Point play', note: N_CALENDARSCREEN },
  { area: 'screens', surface: 'CalendarScreen', kind: 'leak', detail: 'Rest', note: N_CALENDARSCREEN },
  { area: 'screens', surface: 'CalendarScreen', kind: 'leak', detail: 'Speed work', note: N_CALENDARSCREEN },
  { area: 'screens', surface: 'CalendarScreen', kind: 'leak', detail: 'N sessions, all of them on court.', note: N_CALENDARSCREEN },
  { area: 'screens', surface: 'KidScreen', kind: 'leak', detail: 'National Unranked', note: N_KIDSCREEN },
  { area: 'cards', surface: 'WeekRecapCard', kind: 'leak', detail: 'M', note: N_WEEKRECAPCARD },
  { area: 'cards', surface: 'WeekRecapCard', kind: 'leak', detail: 'T', note: N_WEEKRECAPCARD },
  { area: 'cards', surface: 'WeekRecapCard', kind: 'leak', detail: 'W', note: N_WEEKRECAPCARD },
  { area: 'cards', surface: 'WeekRecapCard', kind: 'leak', detail: 'F', note: N_WEEKRECAPCARD },
  { area: 'cards', surface: 'WeekRecapCard', kind: 'leak', detail: 'S', note: N_WEEKRECAPCARD },
  { area: 'cards', surface: 'RailDashboard', kind: 'leak', detail: 'In the account', note: N_RAILDASHBOARD },
  { area: 'cards', surface: 'WeekSpanReport', kind: 'leak', detail: 'N weeks passed. Everything they raised is below.', note: N_WEEKSPANREPORT },
  { area: 'cards', surface: 'WeekSpanReport', kind: 'leak', detail: 'Close', note: N_WEEKSPANREPORT },
  { area: 'cards', surface: 'InboxSheet: sign question', kind: 'leak', detail: 'Cancel', note: N_INBOXSHEET_SIGN_QUESTION },
  { area: 'overlays', surface: 'TourBriefingDialog', kind: 'leak', detail: 'Tour office · WN \'N', note: N_TOURBRIEFINGDIALOG },
  { area: 'overlays', surface: 'TourBriefingDialog', kind: 'leak', detail: 'The commitment rules now apply.', note: N_TOURBRIEFINGDIALOG },
  { area: 'overlays', surface: 'TourBriefingDialog', kind: 'leak', detail: 'What the tour asks for', note: N_TOURBRIEFINGDIALOG },
  { area: 'overlays', surface: 'TourBriefingDialog', kind: 'leak', detail: 'What declining costs', note: N_TOURBRIEFINGDIALOG },
  { area: 'overlays', surface: 'TourBriefingDialog', kind: 'leak', detail: 'Continue', note: N_TOURBRIEFINGDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Season N · wrap-up', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'That\'s a season.', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Ranking', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Final professional rank', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Season points', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Matches', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Record', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Best result', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Lost to injury', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'N wk', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Money', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Spent this season', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Earned this season', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Funds this season', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Off-season now: rest, school, family time.', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'SeasonSummaryDialog', kind: 'leak', detail: 'Continue', note: N_SEASONSUMMARYDIALOG },
  { area: 'overlays', surface: 'ShootClashDialog', kind: 'leak', detail: 'Two things at once – WN \'N', note: N_SHOOTCLASHDIALOG },
  { area: 'overlays', surface: 'ShootClashDialog', kind: 'leak', detail: 'Quiet Hour want her that week, and so does the Local Open.', note: N_SHOOTCLASHDIALOG },
  { area: 'overlays', surface: 'ShootClashDialog', kind: 'leak', detail: 'Something has to give. All four answers are hers to make.', note: N_SHOOTCLASHDIALOG },
  { area: 'overlays', surface: 'ShootClashDialog', kind: 'leak', detail: 'Pull out of the Local Open', note: N_SHOOTCLASHDIALOG },
  { area: 'overlays', surface: 'ShootClashDialog', kind: 'leak', detail: 'She shoots, and the $N entry is forfeited.', note: N_SHOOTCLASHDIALOG },
  { area: 'overlays', surface: 'ShootClashDialog', kind: 'leak', detail: 'Move the shoot to WN \'N', note: N_SHOOTCLASHDIALOG },
  { area: 'overlays', surface: 'ShootClashDialog', kind: 'leak', detail: 'She plays as planned and the campaign waits – nothing is paid for it.', note: N_SHOOTCLASHDIALOG },
  { area: 'overlays', surface: 'ShootClashDialog', kind: 'leak', detail: 'Cancel the shoot', note: N_SHOOTCLASHDIALOG },
  { area: 'overlays', surface: 'ShootClashDialog', kind: 'leak', detail: 'She plays as planned, and Quiet Hour take back $N,N of the campaign fee.', note: N_SHOOTCLASHDIALOG },
  { area: 'overlays', surface: 'ShootClashDialog', kind: 'leak', detail: 'Do both', note: N_SHOOTCLASHDIALOG },
  { area: 'overlays', surface: 'ShootClashDialog', kind: 'leak', detail: 'Lights, flights and a draw in one week – N condition off the week.', note: N_SHOOTCLASHDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'How ranking points work', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'She has three rankings and they are counted separately – a result pays into one ', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'National – Unranked · N pts', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'Her best N results from the last N weeks.', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'Nothing here until she plays her first Local Open.', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'International – Unranked · N pts', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'Her best N Junior Tour results from the last N weeks.', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'Nothing here until she plays a Junior Tour event – national results do not count', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'Professional – Unranked · N pts', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'Her best N results from the last N weeks. She appears on it after N scoring to', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'Nothing here until she plays a W-series event – junior points do not cross over.', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'A new result only raises the total if it beats the weakest counted one.', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'On every table, results older than N weeks drop out – points must be defended.', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'National points are what open her next tier. The Junior Tour reads her internati', note: N_RANKHELPDIALOG },
  { area: 'overlays', surface: 'RankHelpDialog', kind: 'leak', detail: 'Close', note: N_RANKHELPDIALOG },
  { area: 'takeovers', surface: 'App: shell', kind: 'leak', detail: 'In the account', note: N_APP_SHELL },
  { area: 'takeovers', surface: 'App: shell', kind: 'leak', detail: 'Local Open – open to her, next one Jan N – Feb N, N', note: N_APP_SHELL },
  { area: 'takeovers', surface: 'App: shell', kind: 'leak', detail: 'Local: Unlocked – enter your first!', note: N_APP_SHELL },
  { area: 'takeovers', surface: 'App: shell', kind: 'leak', detail: 'Regional Championship – locked: N more national pts (she has N of N) – N more ', note: N_APP_SHELL },
]
