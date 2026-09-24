// =================================================================================================
// ⭐⭐⭐ THE COLLEGE SCENE / T2 – THE CHAMPIONSHIP BLOCK'S ROWS, MEASURED AGAINST A PHONE
// =================================================================================================
//
// ⚠⚠ THIS FILE ADDS NO FEATURE AND THE FEATURE IT MEASURES IS A MONTH OLD. The wave's spec §3 asked
// for «the championship's own block on the year card» as if nothing were there; it SHIPPED in
// `1356712f`, 22.08 («Wave 3 / G1: a college year gets a tournament, and the call-up is earned»).
// `CollegeYearCard.vue` already draws `.college-league` with one `.college-league-match` row per
// played match – `leagueLabel(m)` («Quarterfinal – I. Rusu», `stageLabel` off the run's OWN persisted
// `rounds`), `rubberOutcome(m)` (the score, with `ret.` where somebody walked off) and a **Watch**
// control – and `collegeProgressOf` (engine/world/college.ts) already crosses `league` and
// `leagueMatches` on `CollegeProgressView`, so there is no new state and no new RPC either.
//
// ⚠ SO THE WATCH CONTROL IS NOT TOUCHED, AND THAT IS A RULING RATHER THAN AN OVERSIGHT. Spec §3 and
// §5 both call a replay button «his to ask for later, not this wave's to invent»; it was invented in
// August and he has been pressing it since. Invariant 4 binds a CONTROL exactly as it binds a label,
// and a card that quietly loses a button nobody asked to lose is the round-29 rename in a different
// hat. Nothing in this file changes a string, a class or a control.
//
// ⚠⚠ WHAT THE WAVE ACTUALLY OWED HERE IS THE HALF THAT WAS NEVER MEASURED: THE PHONE LAW. The block
// shipped with mounted coverage of what it SAYS (tests/component/college-second-act.test.ts: the
// three rows, their labels, their scores, the viewer they open, the block's absence on a null run)
// and with NOTHING about what a 375px screen can HOLD across – which is precisely the blind spot
// round-20 #3 is a record of: «every check was about what the card SAYS, none about what the screen
// can HOLD» (CLAUDE.md).
//
// ⚠ THE CARD IS NOT A DIALOG, so `assertDismissReachable` is the wrong instrument: there is no
// dismiss control to measure and no blocking overlay that can strand a career. What it has is a ROW.
// `.college-league-match` is `display: flex` with three spans competing for the width of a phone –
// `.rubber-who` (`nowrap` + `text-overflow: ellipsis`), `.rubber-score` (`nowrap`, `tabular-nums`)
// and `.rubber-watch` (10px/800, uppercased, `letter-spacing: 0.1em`) – so the question is width, and
// the failure mode is the opponent's name being eaten rather than a control leaving the screen.
//
// ⚠⚠ THE WORST CASE IS ASKED OF THE ENGINE'S OWN POOL AND NEVER TYPED. `.rubber-who` is the stage
// word plus `formatShortName(oppName)`, and the stage words of a draw of eight are fixed by
// `stageLabel` («Quarterfinal» is the longest of the three). The variable half is the surname, so the
// fixture takes the LONGEST entry of `SURNAMES` – the same pool `collegeLeagueOpponent` draws from –
// and puts it on every row. A fixture that typed «Kovac» would measure a row the draw can beat.
//
// ⚠ THE MOUNT IS THE CARD INSIDE THE APP FRAME, because the row's room is walked rather than
// assumed (`availableWidth`) and the frame is where the gutter lives. The production chain from the
// viewport to a league row is: `#app` (`padding: … var(--app-pad-x)`, 16px a side) ->
// `main.app-content` (`max-width: var(--app-col-max)`, no horizontal inset) -> ScreenShell's two
// divs (flex column, `min-height: 0`, and NO horizontal padding – read in
// `src/components/ui/ScreenShell.vue`, whose gutter is opt-IN and which Home does not opt into) ->
// `Card` (`.tb-card`: 1px border + 14px padding a side) -> `.college-year` -> `.college-league` ->
// `ul.college-rubbers` (`padding: 0`) -> `li` -> the row. So the two elements this mount skips
// contribute zero px across at 375, and the container below supplies the two that do not.
//
// =================================================================================================
// ⚠⚠⚠ THE VERDICT: THE WORST SHIPPED ROW IS 5.1px OVER ITS ROOM AT 375x667, AND THE OPPONENT'S NAME
// IS ALREADY BEING ELLIPSISED ON THE PHONE THIS HOUSE MEASURES AGAINST.
// =================================================================================================
//
// ⚠⚠ AND THE FIRST VERSION OF THIS FILE SAID THE OPPOSITE, WHICH IS WHY THE HISTORY IS KEPT HERE. It
// asserted «every row fits» through `fits.ts` and it was GREEN – because that helper is a documented
// FLOOR and it charged `.rubber-watch` **0.0px** (`demandedWidth` credited a label only under
// `white-space: nowrap`, which this span does not declare), while charging nothing anywhere for
// `letter-spacing`, for `uppercase` being wider than the glyphs it counts, or for `tabular-nums`.
// Against a row with ~5px of real margin that floor does not merely under-count, it INVERTS THE
// VERDICT. A green test that says the opposite of the measurement is worse than no test: it is
// round-20 #3's failure with the polarity reversed, a reassurance where a number belongs. So the
// assertions below are the ROOM AND THE DEMAND AS NUMBERS with the deficit PINNED, and the per-span
// widths come from a browser.
//
// ⚠⚠ THE 0.0px HALF OF THAT WAS REPAIRED IN THE SHARED HELPER ON 24.09, AND THE PIN BELOW DID NOT
// MOVE. `demandedWidth` now charges a label that has nowhere to break whatever `white-space` says, so
// it scores **23.50px** for «Watch» instead of 0.0 (its own docstring carries the census and the
// browser table). ⚠ THAT DOES NOT HAND THIS ROW BACK TO THE SHARED HELPER, which is the part worth
// stating rather than assuming: measured through the repaired helper the row demands **275.2px of
// 291.0** and is still GREEN, against the browser's 296.1 – because `ADVANCE` charges nothing for
// weight 800, for `uppercase`, for the 0.1em tracking or for `tabular-nums`, and because the SAME
// constant over-charges `.rubber-who` (171.08 modelled against 166.47 measured). The repair closed
// 23.5px of a 44.4px gap and the remaining 20.9px still inverts the verdict, so `MEASURED_PX` stays
// and the arithmetic below is unchanged. `⭐⭐ the shared helper's own verdict on this row` pins that
// relationship as a DIRECTION rather than as a value – the model's demand is strictly below the
// browser's – so a later wave cannot quietly swap the browser numbers for the model's, and a
// legitimate `ADVANCE` re-fit does not redden a college test for no defect.
//
// ⚠ AND THERE IS NO DOUBLE CHARGE: `rowDemand` bills each span ONCE, from `MEASURED_PX`, and never
// calls `demandedWidth` – only `availableWidth` comes from `fits.ts`. The repair changed which
// sentences about the shared helper are true, not one number in this file.
//
// THE NUMBERS. Room for a row: 375 − 2x16 (the frame) − 30 (the Card's border and padding) = 313 to
// the `li`, less the row's own 10px padding and 1px border a side = **291.0px**, two 8px gaps inside.
// Demand, per shape, from `MEASURED_PX` (the provenance of every figure is at that constant):
//
//     «Quarterfinal – C. Ostergaard  Won 6-3 6-4   Watch»   296.1 of 291.0   OVER by 5.1   <- worst
//     «Semifinal – C. Ostergaard     Won 6-3 6-4   Watch»   279.3 of 291.0   11.7 spare
//     «Final – C. Ostergaard         Won 6-3 6-4   Watch»   251.5 of 291.0   39.5 spare
//     «Quarterfinal – C. Ostergaard  Lost 4-6 5-7  Watch»   295.6 of 291.0   OVER by 4.6
//
//   the Watch span at 10px, decomposed:   «Watch» at 400 = 29.75, at 800 = 31.61,
//                                         800 + uppercase = 36.33, + the tracking = **41.33**
//   ⚠ «Won 6-3 6-4» (72.28) IS WIDER THAN «Lost 4-6 5-7» (71.80) despite being the shorter string,
//     because `tabular-nums` gives every figure the same advance. Counting characters had these two
//     the wrong way round, which is how «the early exit is the worst row» came to be written here and
//     then struck: the worst row is the TITLE run's QUARTERFINAL.
//   -> `.rubber-who`'s real budget is 291.0 − 16 − 72.28 − 41.33 = **161.4px**, and
//     «Quarterfinal – C. Ostergaard» measures **166.5px**. The rendered span confirms it
//     independently: `scrollWidth` 166.5 against `clientWidth` 161.9, truncated.
//
// HOW MUCH OF THE DRAW THIS TOUCHES, counted over all 211 `SURNAMES` rather than argued:
//
//                          straight sets            after a retirement («… ret.», score 94.6)
//     Quarterfinal          11 of 211 overflow       129 of 211
//     Semifinal              0 of 211                 25 of 211
//     Final                  0 of 211                  0 of 211
//
// By surname length on the Quarterfinal row: <=7 chars all fit; 8 chars over by 1.4, 9 by 8.4, 10 by
// 9.9. So on a 375px phone this is the LONG-NAME TAIL of one round – ~5% of the draw – and it becomes
// the COMMON case in any round somebody retired in, because `ret.` costs the score span 22.3px more.
//
// ⚠⚠ IT IS A LEGIBILITY DEFECT AND NOT A STRANDED CONTROL, and that distinction is asserted rather
// than asserted-about: `.college-rubber` declares no `flex-wrap`, so the row cannot spend a second
// line and nothing leaves the screen; `.rubber-who` gives way through its own `text-overflow:
// ellipsis`, which `src/style.css` calls «the safety net at 375px, not the plan»; and the two spans
// that CANNOT yield cost 129.6 of the 291.0, leaving 161.4 for the name. Round-20 #3 is 161.4px away.
//
// ⚠ NOT FIXED HERE, AND DELIBERATELY. Every repair – shortening the label, dropping the stage word,
// wrapping the row, restyling the Watch pill, trading the tracking – is a wording or a layout change
// to a card that shipped on 22.08, which invariant 4 puts in the owner's hands and nobody else's. T2
// was asked to MEASURE this surface; it measured it, the numbers are here rather than smoothed, and
// the repair is a question in the wave's report.
//
// ⚠ 320x568 IS NOT MEASURED BY AN ARM IN THIS FILE, ON THE COORDINATOR'S RULING (24.09): 375x667 is
// the house's phone law by name and a permanently red arm is not a measurement anybody can act on.
// The figures, for the record: room **236.0px**, the same worst row needs 296.1, **OVER by 60.1** –
// on straight sets **211 of 211** surnames overflow the Quarterfinal row and **211 of 211** the
// Semifinal, and **52 of 211** overflow even «Final» (after a retirement: 211, 211, 193). The narrow
// phone is not a tail case on this surface, it is the shape.
//
// THE MUTATION LEDGER – each arm run RED before this file was believed:
//   * `LONGEST_SURNAME` lengthened by a second barrel (`Ostergaard` -> `Ostergaard-Vandenberg`), the
//     structure and every class untouched -> RED, and with the RIGHT red: `measuredPx` REFUSES a
//     string no browser ever measured instead of extrapolating a number and under-reporting the
//     deficit. That refusal is the tripwire – change what a row holds and the pin demands a new read.
//   * `.college-card`'s padding grown from the Card's 14px to 80px a side, nothing else -> the room
//     drops by 132px and the deficit grows by exactly 132px, which is `fits.ts`'s own sentence about
//     a walked room («a card that grows 8px of padding takes those px off every row inside it»).
//   * the row given `flex-wrap: wrap` -> the «nothing is displaced» pass goes RED. That is the
//     repair a later wave reaches for to «fix the truncation», and it trades a cut name for a row of
//     unpredictable height – the shape round-20 #3 is a record of.
//   * (24.09, for the shared-helper arm) `.college-card`'s padding grown by 8px A SIDE, so the room
//     drops from 291.0 to 275.0 -> the REPAIRED shared helper goes RED on this row («the controls
//     demand 275px of a 275px row»), and against the helper as it stood BEFORE the repair the same
//     mutation is green with 23.3px to spare. That pair is what says the Watch charge is load-bearing
//     rather than decorative, and it is in the wave's report with both outputs.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// ⚠ A RUNNER-SIZED CEILING, AND IT IS `round26-college-card.test.ts`'s ARITHMETIC, NOT A NEW ONE.
// The heavy half is the walk under the fixtures – ~114 ticks to the college departure – and it is
// paid ONCE for the file. The documented slow-machine signature is a case crossing vitest's default
// with zero assertion failures (CLAUDE.md), so the ceiling is set where only a genuine wedge reaches
// it. ⚠ If a case here ever takes tens of seconds ALONE, that is a real regression and this must not
// be raised to hide it.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE REAL STYLESHEET. Every number below is read through `getComputedStyle`, and without the
// app's own sheet the cascade is empty and every measurement passes vacuously – so `openCard`
// refuses outright if no `<style>` reached the document, which is the guard that says so out loud.
import '../../src/style.css'
import CollegeYearCard from '../../src/components/CollegeYearCard.vue'
import { useGameStore } from '../../src/stores/game'
import { ENDINGS } from '../../src/engine/ending'
import { SURNAMES } from '../../src/engine/season/names'
import { COLLEGE_LEAGUE } from '../../src/engine/collegeLeague'
import { stageLabel } from '../../src/engine/world/labels'
import { formatShortName } from '../../src/shared/format'
// ⚠ THE ROW'S ARITHMETIC DOES NOT COME FROM `fits.ts` AND THAT IS THE POINT – `availableWidth` reads
// the real cascade from the viewport down to the row's parent, which is exactly right and is not the
// part that was wrong; the per-span DEMAND comes from `MEASURED_PX`, see the ⚠⚠ above it. The two
// demand helpers are imported for ONE arm – `⭐⭐ the shared helper's own verdict on this row` – which
// compares the repaired shared floor with the browser and pins the DIRECTION they disagree in. ⚠ They
// are READ there and never asserted through, so a future `ADVANCE` re-fit that reddens the row cannot
// throw before the comparison that arm is about.
import { availableWidth, demandedWidth, PHONE, rowItemWidth, setViewport } from './fits'
// ⚠ v74 (wave 3, T8): the shared bond-NEUTRAL drain – a walked opener must pass a tier-1 row.
import { answerBirthdayNeutral, drainLifeBeats } from '../helpers/career'
import {
  answerFork,
  callUpRevealOpen,
  closeTournament,
  collegeLeagueRevealOpen,
  createWorld,
  measureCollegeOffer,
  pendingBirthday,
  resumeFromCollege,
  revealTournamentRound,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import {
  DEFAULT_PROFILE,
  type CollegeProgressView,
  type CollegeYear,
  type Snapshot,
  type WorldMatch,
} from '../../src/shared/protocol'
import type { MatchPlayer } from '../../src/engine/match/types'

// =================================================================================================
// THE FIXTURES – a real career underneath, the championship's OUTCOME posed
// =================================================================================================
//
// ⚠ THE SPLIT IS `college-second-act.test.ts`'s AND ITS REASONING IS QUOTED RATHER THAN RE-ARGUED:
// what lives in `CollegeProgressView` is the ROLL – she won it, she went out in the first round –
// so a test that waited for the RNG to hand it a title would be a test that runs sometimes.
// Everything under the posed field is a career that was really played to the fork and really
// answered «college».

/** The longest surname the student draw can actually produce, off the pool
 *  `collegeLeagueOpponent` draws from. ⚠ ASKED, NEVER TYPED: the pool is append-only (its own note
 *  in engine/season/names.ts), so a longer name arriving in a later wave tightens this measurement
 *  by itself instead of leaving it measuring a name nobody has. */
const LONGEST_SURNAME = SURNAMES.reduce((a, b) => (b.length > a.length ? b : a))

function leaguePlayer(id: string, name: string): MatchPlayer {
  return { id, name, serve: 62, ret: 60, composure: 61, stamina: 63, groundstrokes: 62, age: 21 }
}

/** ONE CHAMPIONSHIP MATCH, AS THE ENGINE FILES IT – `collegeLeagueMatchId`'s own id shape
 *  (`college-w<week>-r<round>`), because the card reads the round off `WorldMatch.round` and the
 *  block's row label is composed from it. `kidWon` is the caller's, so a run and its rows cannot
 *  come to disagree about how far she got. */
function leagueMatch(round: number, kidWon: boolean, surname: string = LONGEST_SURNAME): WorldMatch {
  const opp = leaguePlayer(`college-w293-r${round}`, `Camila ${surname}`)
  return {
    round,
    aId: 'kid',
    bId: opp.id,
    winnerId: kidWon ? 'kid' : opp.id,
    seed: `fixture:collegematch:293:${round}`,
    score: kidWon ? '6-3 6-4' : '4-6 5-7',
    eventId: `college-w293-r${round}`,
    surface: 'hard',
    oppName: opp.name,
    a: leaguePlayer('kid', 'Mila Adler'),
    b: opp,
  }
}

function collegeYear(over: Partial<CollegeYear> = {}): CollegeYear {
  return {
    index: 1,
    fromWeek: 281,
    untilWeek: 333,
    startSkill: 58.6,
    endSkill: 58.9,
    startRank: null,
    endRank: null,
    fundsDeltaCents: -3_806_075,
    callUp: null,
    league: { week: 293, roundsWon: 2, rounds: 3 },
    ...over,
  }
}

function collegeView(over: Partial<CollegeProgressView> = {}): CollegeProgressView {
  return {
    yearsDone: 1,
    totalYears: ENDINGS.collegeYears,
    last: collegeYear(),
    final: false,
    billPerYearCents: 8_673_00,
    tier: 'state',
    // The call-up is a 40% roll and it draws its OWN rows on this card. Every case here is about the
    // championship's rows, so the letter never arrives – which keeps `.college-rubber` and
    // `.college-league-match` from being the same set and makes the counts below unambiguous.
    rubbers: [],
    league: { week: 293, roundsWon: 2, rounds: 3 },
    leagueMatches: [],
    yearInProgress: false,
    leagueIsNextStop: false,
    callUpIsNextStop: false,
    ...over,
  }
}

/** ⭐ A TITLE RUN – three rounds of a draw of eight, all won. `wonTheLeague` is `roundsWon >= rounds`
 *  and `leagueMatchesPlayed` caps at `rounds` («the champion plays no extra match»), so three is
 *  both the count of rows and the whole of the result. THE LONGEST LABELS THE BLOCK CAN HOLD:
 *  Quarterfinal, Semifinal, Final. */
function titleRun(surname: string = LONGEST_SURNAME): CollegeProgressView {
  const run = { week: 293, roundsWon: 3, rounds: 3 }
  return collegeView({
    last: collegeYear({ league: run }),
    league: run,
    leagueMatches: [0, 1, 2].map((r) => leagueMatch(r, true, surname)),
  })
}

/** ⚠ AN EARLY EXIT – ONE ROUND, LOST, AND ONE ROW. `playCollegeLeague` breaks the knockout loop on a
 *  loss (`if (!kidWon) break`), so the feed holds exactly the matches she played and
 *  `collegeLeagueMatchesOf` can answer with nothing else. The shape is the point: the block reports
 *  the rounds she reached and invents no bracket she never stood in. */
function earlyExit(surname: string = LONGEST_SURNAME): CollegeProgressView {
  const run = { week: 293, roundsWon: 0, rounds: 3 }
  return collegeView({
    last: collegeYear({ league: run }),
    league: run,
    leagueMatches: [leagueMatch(0, false, surname)],
  })
}

// =================================================================================================
// A WALKED CAREER UNDER THE FIXTURES, BUILT ONCE
// =================================================================================================

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** The player's own two presses at a mid-year reveal – the championship's and the tie's. A walk that
 *  answered one and not the other stalls on the first league week and banks zero years, which is the
 *  failure `round26-college-card.test.ts` records against its own earlier version of this helper. */
function answerCollegeReveal(world: WorldState): void {
  if (!collegeLeagueRevealOpen(world) && !callUpRevealOpen(world)) return
  skipTournament(world)
  closeTournament(world)
}

let walked: Snapshot | null = null

/** A career really played to the fork, really answered «college», and really one year into it. The
 *  walk is deterministic and it is the expensive half, so it is paid once for the file. */
function walkedCollegeSnapshot(): Snapshot {
  if (walked) return walked
  const world = createWorld('college-scene-ui', { ...DEFAULT_PROFILE })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
    drainLifeBeats(world)
  }
  // ⚠ THE ONE THUMB ON THE SCALE, and it is `college-freeze.test.ts`'s: four years is 208 weeks of
  // base costs and a career that went bankrupt inside them would be measuring the family budget.
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  // Tier-1 small talk raises an answerable `lifeLog` row from week 0 and `answerFork` refuses while
  // any row is unanswered – bond-neutral drain, the shared helper.
  drainLifeBeats(world)
  answerFork(world, 'college')
  for (let i = 0; i < 54 && world.ending === null; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
    drainLifeBeats(world)
  }
  resumeFromCollege(world, rng)
  answerCollegeReveal(world)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  const snap = toSnapshot(world)
  if (snap.ending === null || snap.ending.ending.type !== 'college' || snap.ending.college === null) {
    throw new Error('the walked career is not at college – the fixture under every case below is wrong')
  }
  walked = snap
  return snap
}

let wrapper: VueWrapper | null = null

/**
 * The card, on a college week, inside the app's own frame.
 *
 * ⚠ THE CONTAINER IS `#app > main.app-content` AND BOTH CLASSES ARE THE APP'S OWN, declared in
 * `src/style.css` rather than here – `#app` is where the frame's 16px side gutter lives
 * (`padding: var(--app-pad-top) var(--app-pad-x) var(--app-pad-bottom)`) and it is the one inset
 * between the viewport and the card. Five component files already name a container `#app` for the
 * same reason (`round36-desktop-shell`, `round36-pass2-home`, `round36-review-home`,
 * `round36-rail-dashboard`, `round37-frame`). Attaching to a bare `body` would hand every row 32
 * more px than the player has, which is the one direction a fit measurement may never err in.
 */
function openCard(college: CollegeProgressView | null): VueWrapper {
  // ⚠ VIEWPORT FIRST, THEN MOUNT. happy-dom evaluates a media query on an element's first
  // computed-style read and caches it, so a viewport set after mounting measures the last screen
  // (`fits.ts`'s own ⚠⚠ on `TABLET`).
  setViewport(PHONE)
  // ⚠ THE GUARD THAT MOVED OUT OF `assertInlineRowFits` WITH THE ARITHMETIC, and it may not be lost:
  // every figure below is read through `getComputedStyle`, so a document with no sheet in it would
  // hand this file a cascade of zeros and a set of confidently wrong numbers.
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – without it every measurement here is vacuous')
  }
  const base = walkedCollegeSnapshot()
  const game = useGameStore()
  game.snapshot = { ...base, ending: { ...base.ending!, college } } as Snapshot
  const frame = document.createElement('div')
  frame.id = 'app'
  const column = document.createElement('main')
  column.className = 'app-content'
  frame.appendChild(column)
  document.body.appendChild(frame)
  wrapper = mount(CollegeYearCard, { attachTo: column })
  return wrapper
}

/** The three spans of one league row, in the order they stand in. ⚠ IT THROWS on a missing span
 *  rather than measuring two of three: a row of two controls would score as cheaper than the real
 *  one, and «the Watch control disappeared» must not read as «it fits better now». */
function rowItems(row: Element): { who: Element; score: Element; watch: Element } {
  const pick = (sel: string): Element => {
    const el = row.querySelector(sel)
    if (!el) throw new Error(`a league row has no ${sel} – the measurement below would be vacuous`)
    return el
  }
  return { who: pick('.rubber-who'), score: pick('.rubber-score'), watch: pick('.rubber-watch') }
}

// =================================================================================================
// ⭐⭐⭐ THE PER-SPAN WIDTHS, FITTED IN A REAL BROWSER – AND THIS IS WHY THIS FILE DOES NOT USE
// `assertInlineRowFits` FOR THE NUMBER
// =================================================================================================
//
// ⚠⚠ THE SHARED HELPER CANNOT ANSWER THIS ROW, AND IT IS NOT ITS FAULT. `fits.ts` is a documented
// FLOOR, and its model charges nothing for `letter-spacing`, for `uppercase` being wider than the
// glyphs it counts, or for `tabular-nums`. Against a row with ~5px of real margin that floor does not
// merely under-count – it inverts the verdict. So the numbers below are the browser's.
//
// ⚠ UNTIL 24.09 THE BIGGEST SINGLE HOLE WAS WORSE THAN A FITTED CONSTANT AND IT IS NOW FIXED:
// `demandedWidth` credited a control's own label only under `white-space: nowrap` and read
// `min-width` otherwise, and `.rubber-watch` declares NEITHER and carries no padding – so the shared
// instrument scored the button the owner presses at **0.0px**. It now charges an unbreakable label
// whatever `white-space` says (23.50px for «Watch»), because content with nowhere to break cannot
// wrap and so gives no ground vertically. ⚠⚠ THE HELPER STILL CANNOT ANSWER THIS ROW: repaired, it
// makes the worst row **275.2px of 291.0 – GREEN** where the browser says 296.1 and RED. The
// remaining 20.9px is the fitted glyph advance against real type, which is a different card again;
// see `⭐⭐ the shared helper's own verdict on this row`, where that gap is pinned rather than
// described.
//
// PROVENANCE, in `fits.ts`'s own idiom for how `ADVANCE` was fitted. One-off headless Chromium
// (playwright, `deviceScaleFactor: 1`), **24.09**, over this row's verbatim markup with the repo's
// real `src/style.css` and its own self-hosted **Manrope** (`public/fonts/manrope-var.woff2`) –
// `.rubber-who` at 13px/400, `.rubber-score` at 12.5px/400 with `font-variant-numeric:
// tabular-nums`, `.rubber-watch` at 10px/800 with `letter-spacing: 0.1em` and
// `text-transform: uppercase`. Each figure is the span's INTRINSIC width (`width: max-content`,
// `white-space: nowrap`) with every font property copied off the shipped span, so the browser
// charged tracking, weight, case and figure width rather than a model.
//
// ⚠ RE-FIT THESE WITH THE SAME HARNESS IF THE TYPE STACK, A FONT SIZE OR THE TRACKING EVER MOVES.
// A stale constant here would be a pin arguing with the screen.
const MEASURED_PX: Readonly<Record<string, number>> = {
  // `.rubber-who` – the stage word, a dash, and the opponent in `formatShortName`'s short form
  'Quarterfinal – C. Ostergaard': 166.46875,
  'Semifinal – C. Ostergaard': 149.671875,
  'Final – C. Ostergaard': 121.9375,
  // `.rubber-score` – ⚠ «Won 6-3 6-4» is WIDER than «Lost 4-6 5-7» despite being shorter, because
  // `tabular-nums` gives every figure the same advance. Counting characters got these two the wrong
  // way round, which is how «the early exit is the worst row» came to be written and then struck.
  'Won 6-3 6-4': 72.28125,
  'Lost 4-6 5-7': 71.796875,
  // `.rubber-watch` – 29.75 plain, 31.61 at weight 800, 36.33 uppercased, 41.33 with the tracking.
  Watch: 41.328125,
}

/** The browser-measured width of a span's exact text. ⚠ IT THROWS ON AN UNMEASURED STRING, WHICH IS
 *  THE TRIPWIRE THIS WHOLE APPROACH EXISTS FOR: the moment anybody changes what a league row holds –
 *  a longer stage word, a tiebreak score, a fourth span – the pin cannot quietly keep reporting the
 *  old arithmetic. It demands a new browser read, which is exactly the conversation that should
 *  happen. */
function measuredPx(text: string): number {
  const w = MEASURED_PX[text.trim()]
  if (w === undefined) {
    throw new Error(
      `«${text.trim()}» was never measured in a browser – re-fit MEASURED_PX with the harness this ` +
        'file documents before asserting anything about a row that holds it',
    )
  }
  return w
}

interface RowDemand {
  /** the row's content box, walked from the viewport through the real cascade */
  room: number
  who: number
  score: number
  watch: number
  gaps: number
  /** who + score + watch + gaps */
  demand: number
  /** room − demand: NEGATIVE is the shipped defect this file records */
  slack: number
  /** score + watch + gaps – what CANNOT give way, so the floor under «nothing is displaced» */
  rigid: number
}

/** One league row's arithmetic: the walked room against the browser-measured demand. */
function rowDemand(row: Element): RowDemand {
  const cs = getComputedStyle(row)
  const outer = availableWidth(row, PHONE)
  const room =
    outer -
    parseFloat(cs.paddingLeft) -
    parseFloat(cs.paddingRight) -
    parseFloat(cs.borderLeftWidth) -
    parseFloat(cs.borderRightWidth)
  const gap = parseFloat(cs.columnGap || cs.gap)
  const { who, score, watch } = rowItems(row)
  const parts = {
    who: measuredPx(who.textContent ?? ''),
    score: measuredPx(score.textContent ?? ''),
    watch: measuredPx(watch.textContent ?? ''),
    gaps: gap * 2,
  }
  const demand = parts.who + parts.score + parts.watch + parts.gaps
  return { room, ...parts, demand, slack: room - demand, rigid: parts.score + parts.watch + parts.gaps }
}

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

// =================================================================================================
// ⭐⭐ RULING B, VERIFIED RATHER THAN QUOTED – the shapes the block must keep
// =================================================================================================
//
// These three are not new coverage of a new feature; they are the SHAPES the shipped block has, made
// unable to rot quietly. `college-second-act.test.ts` pins the block's default run (two wins, the
// final lost) and its absence on a null run; what was never asserted anywhere is the TITLE run –
// the only shape that fills the bracket – and «one row per round she played» as a count that moves
// with the run rather than a literal three.
describe('⭐⭐ T2 / ruling B – the championship block draws the rounds she played, and only those', () => {
  it('⭐⭐⭐ a TITLE run is three rows – Quarterfinal, Semifinal, Final – and the block says she won it', () => {
    const w = openCard(titleRun())
    expect(w.find('.college-league').exists(), 'the championship has its own block').toBe(true)
    const rows = w.findAll('.college-league-match')
    expect(rows, 'one row per match she played').toHaveLength(3)
    // ⚠ THE STAGE WORDS ARE ASKED OF `stageLabel` AND NOT TYPED, because the card composes them with
    // it – a literal 'Quarterfinal' here would pin this test to a namer it does not use.
    expect(rows[0].text()).toContain(stageLabel(0, 8))
    expect(rows[1].text()).toContain(stageLabel(1, 8))
    expect(rows[2].text()).toContain(stageLabel(2, 8))
    // ...and the opponent, in the card's own short form, on every one of them.
    for (const row of rows) {
      expect(row.text(), 'the woman across the net is named').toContain(formatShortName(`Camila ${LONGEST_SURNAME}`))
    }
    // The champion's rows all read as wins, and the block's own sentence agrees with them.
    expect(rows.map((r) => r.text()).filter((t) => t.includes('Won'))).toHaveLength(3)
    expect(w.find('.college-league').text()).toContain('She won it')
    // ⚠ AND THE WATCH CONTROL IS STILL ON EVERY ROW (invariant 4 – it shipped 22.08 and this wave
    // does not take it away). Counted rather than found, so losing two of three would be red too.
    expect(w.findAll('.college-league-match .rubber-watch')).toHaveLength(3)
    w.unmount()
  })

  it('⚠ an EARLY EXIT draws the round she played and no bracket she never stood in', () => {
    const w = openCard(earlyExit())
    const rows = w.findAll('.college-league-match')
    expect(rows, 'she lost the first one, so there is one row').toHaveLength(1)
    expect(rows[0].text()).toContain(stageLabel(0, 8))
    expect(rows[0].text()).toContain('Lost')
    // The two rounds she never reached are not drawn as anything – not greyed, not empty, not there.
    const block = w.find('.college-league').text()
    expect(block, 'no semifinal she did not play').not.toContain(stageLabel(1, 8))
    expect(block, 'no final she did not play').not.toContain(stageLabel(2, 8))
    // ⚠ AND THE BLOCK STILL REPORTS THE RUN, because an exit is a result and not an absence.
    expect(block).toContain(`She went out in the ${stageLabel(0, 8)}`)
    expect(block).toContain('1 match, 0 wins')
    w.unmount()
  })

  it('⚠ a `null` run draws no block at all – today\'s absence, kept', () => {
    // A migrated career (v55 mid-freeze) and the weeks before her first championship: there is
    // genuinely no run, so the card says nothing rather than drawing an empty bracket.
    const w = openCard(collegeView({ last: collegeYear({ league: null }), league: null, leagueMatches: [] }))
    expect(w.find('.college-league').exists()).toBe(false)
    expect(w.findAll('.college-league-match')).toHaveLength(0)
    expect(w.find('.college-year').exists(), 'and the rest of the card is untouched').toBe(true)
    w.unmount()
  })
})

// =================================================================================================
// ⚠⚠⚠ THE PHONE LAW, AS THE ARITHMETIC – AND IT DOES NOT SAY «IT FITS»
// =================================================================================================
//
// ⚠⚠ THIS DESCRIBE USED TO ASSERT THAT EVERY ROW FITS, AND IT WAS GREEN, AND IT WAS WRONG. It ran on
// `fits.ts`'s floor, which charged the Watch control 0.0px until the helper was repaired on 24.09 and
// charges 23.50px after it; the browser charges 41.33px, and the worst row therefore needs
// **296.1px of a 291.0px row**. A green test that says the opposite of the
// measurement is worse than no test – it is round-20's own failure with the polarity reversed, a
// reassurance where there should be a number. So the claim is not «it fits»: it is **the room and the
// demand, as numbers**, with the deficit pinned. That pin reddens the moment anybody changes what the
// row holds, which is the tripwire actually worth having on a shipped surface.
describe('⚠⚠⚠ T2 – the league row\'s arithmetic at 375x667, and the worst row is 5.1px OVER', () => {
  it('⚠⚠ the room is 291.0px, walked from the viewport through the real cascade', () => {
    const w = openCard(titleRun())
    const { room, gaps } = rowDemand(w.find('.college-league-match').element)
    // 375 − 2x16 (`#app`'s `--app-pad-x`) − 30 (the Card's border and padding) − 22 (the row's own)
    expect(room, 'the row\'s content box on a 375px phone').toBeCloseTo(291.0, 1)
    expect(gaps, 'two 8px gaps between three spans').toBeCloseTo(16.0, 1)
    w.unmount()
  })

  // ⚠ ONE ROW PER LINE OF THE TABLE, AND THE NUMBERS ARE THE CLAIM. A deficit is written as a
  // NEGATIVE slack rather than as a comment, so no future reader can mistake which rows pass.
  for (const [shape, view, expected] of [
    [
      'a TITLE run',
      titleRun,
      [
        { who: 'Quarterfinal – C. Ostergaard', score: 'Won 6-3 6-4', demand: 296.078125, slack: -5.078125 },
        { who: 'Semifinal – C. Ostergaard', score: 'Won 6-3 6-4', demand: 279.28125, slack: 11.71875 },
        { who: 'Final – C. Ostergaard', score: 'Won 6-3 6-4', demand: 251.546875, slack: 39.453125 },
      ],
    ],
    [
      'an EARLY EXIT',
      earlyExit,
      [{ who: 'Quarterfinal – C. Ostergaard', score: 'Lost 4-6 5-7', demand: 295.59375, slack: -4.59375 }],
    ],
  ] as [string, () => CollegeProgressView, { who: string; score: string; demand: number; slack: number }[]][]) {
    it(`⭐⭐⭐ ${shape}: every row's demand against its 291.0px, measured not modelled`, () => {
      const w = openCard(view())
      const rows = w.findAll('.college-league-match')
      expect(rows, 'the arm is not vacuous – the rows really are drawn').toHaveLength(expected.length)
      rows.forEach((row, i) => {
        const want = expected[i]
        const got = rowDemand(row.element)
        const { who, score } = rowItems(row.element)
        // The strings first, so a changed label cannot be absorbed by a number that still matches.
        expect(who.textContent?.trim(), 'the row holds the label this line is about').toBe(want.who)
        expect(score.textContent?.trim(), 'and the score this line is about').toBe(want.score)
        expect(got.demand, `«${want.who} / ${want.score} / Watch» demands`).toBeCloseTo(want.demand, 2)
        expect(got.slack, `...leaving, of ${got.room.toFixed(1)}px`).toBeCloseTo(want.slack, 2)
      })
      w.unmount()
    })
  }

  // ===============================================================================================
  // ⚠⚠⚠ THE DEFICIT ITSELF, PINNED – A SHIPPED LEGIBILITY DEFECT AND NOT THIS WAVE'S TO FIX
  // ===============================================================================================
  it('⚠⚠⚠ the worst row is 5.1px OVER its room, and that is the card as it shipped on 22.08', () => {
    // ⚠ WHAT THIS PIN IS AND IS NOT. It is not a wish and it is not a tolerance: it is the arithmetic
    // of a surface that has been in the owner's hands since `1356712f`, stated so that changing what
    // the row holds cannot pass unnoticed. The worst row is the TITLE run's QUARTERFINAL – the
    // longest stage word beside the widest straight-sets score – and `tabular-nums` is why
    // «Won 6-3 6-4» (72.28) beats «Lost 4-6 5-7» (71.80) despite being the shorter string.
    //
    // ⚠ THE MECHANISM THAT ABSORBS IT IS `.rubber-who`'s OWN `text-overflow: ellipsis`, which
    // `src/style.css` calls «the safety net at 375px, not the plan». So what the owner sees is the
    // opponent's name cut – «Quarterfinal – C. Ostergaar…» – and never a control he cannot reach.
    // The test after this one is what makes that difference an assertion rather than a claim.
    //
    // ⚠⚠ AND THE REPAIR IS HIS RULING, NOT A BUILDER'S. Every candidate – shorten the label, drop the
    // stage word, let the row wrap, restyle the Watch pill, trade the tracking – is a wording or a
    // layout change to a shipped card, which invariant 4 puts in his hands and nobody else's. T2 was
    // asked to MEASURE this surface. It measured it, the number is here, and the question is in the
    // wave's report.
    const w = openCard(titleRun())
    const worst = rowDemand(w.find('.college-league-match').element)
    expect(worst.room, 'the room').toBeCloseTo(291.0, 1)
    expect(worst.demand, 'the demand').toBeCloseTo(296.078125, 2)
    expect(worst.slack, 'the DEFICIT – negative, and pinned').toBeCloseTo(-5.078125, 2)
    expect(worst.slack, 'it is a deficit and not a fit').toBeLessThan(0)
    // The three parts, so a future change can be attributed rather than only detected.
    expect(worst.who).toBeCloseTo(166.46875, 2)
    expect(worst.score).toBeCloseTo(72.28125, 2)
    expect(worst.watch, 'the Watch control, which the shared floor scored at 0.0 until 24.09').toBeCloseTo(41.328125, 2)
    w.unmount()
  })

  // ===============================================================================================
  // ⭐⭐ THE RECONCILIATION WITH THE SHARED HELPER, AS NUMBERS (24.09)
  // ===============================================================================================
  it('⭐⭐ the shared helper\'s own verdict on this row – repaired, and STILL strictly under the browser', () => {
    // ⚠ WHY THIS ARM EXISTS AND WHAT IT PROTECTS. `demandedWidth` was repaired on 24.09: it used to
    // charge a control's label only under `white-space: nowrap`, so `.rubber-watch` – which declares
    // neither that nor a `min-width` – was scored at **0.0px** of a real 41.33. The obvious next move
    // for a later wave is «the helper is fixed, so delete `MEASURED_PX` and call
    // `assertInlineRowFits` like everybody else». THAT WOULD PUT THE FILE BACK WHERE IT STARTED, and
    // the numbers below are why, measured rather than argued:
    //
    //     span              declares              modelled     browser       model/browser
    //     .rubber-who       nowrap, min-width:0     171.08      166.47        1.028  ← OVER
    //     .rubber-score     nowrap                   64.63       72.28        0.894
    //     .rubber-watch     neither                  23.50       41.33        0.569
    //     + two 8px gaps                             16.00       16.00
    //     ------------------------------------------------------------------------------
    //     the worst row                             275.21      296.08
    //     of 291.0px of room                        GREEN       RED by 5.08
    //
    // The repair closed 23.5px of a 44.4px gap; the remaining 20.9px still inverts the verdict, so the
    // browser numbers stay and this file keeps its own arithmetic. ⚠ AND THE ROW IS BILLED ONCE: this
    // is the only place in the file that asks `fits.ts` for a DEMAND, and `rowDemand` never does – so
    // there is no double charge between the two measurements, only a comparison.
    //
    // ⚠⚠ THE PROPERTY IS PINNED AND THE NUMBERS ARE NOT, ON THE COORDINATOR'S RULING (24.09). An
    // `expect(...).toBeCloseTo(275.205)` here would rot on a change that is legitimate: `ADVANCE` is a
    // FITTED constant and a later wave may correctly re-fit it against a new type stack, which would
    // redden a college test with no defect anywhere. What must not rot is the reason `MEASURED_PX`
    // exists, and that is a DIRECTION rather than a value: **the shared model's demand for this row is
    // strictly below the browser's**. It survives any re-fit that stays a floor, and if a re-fit ever
    // overtakes the browser it goes red – which is right, because at that point the browser would no
    // longer be the more accurate of the two and somebody should look at this file again. The 275.205
    // and the 20.9px live in the table above and in the messages below, where a stale number is read
    // by a human instead of enforced against one.
    const w = openCard(titleRun())
    const row = w.find('.college-league-match').element
    const { who, score, watch } = rowItems(row)
    const got = rowDemand(row)
    // ⚠ THE REPAIR ITSELF, ON THE SPAN THAT WAS WRONG: a charge, not a zero – and still under the
    // browser's 41.33, which is the floor contract `fits.ts`'s own docstring commits to.
    const charged = demandedWidth(watch, got.room)
    expect(charged, 'the shared helper now charges the Watch control its label – it scored 0.0 until 24.09').toBeGreaterThan(0)
    expect(charged, `...and stays a floor: ${charged.toFixed(2)}px modelled of the browser's ${got.watch.toFixed(2)}`).toBeLessThan(got.watch)
    // ...and the whole row through the shared instrument, summed the way `assertInlineRowFits` sums it
    // – read rather than asserted, so a re-fit that reddens the row cannot throw before the comparison
    // this arm is actually about.
    const modelled = [who, score, watch].reduce((sum, el) => sum + rowItemWidth(el, got.room), 0) + got.gaps
    // ⚠⚠ THE ONE PIN: THE TWO MEASUREMENTS DISAGREE AND THE BROWSER IS THE BIGGER OF THEM. Measured
    // 24.09 the two are 275.21 and 296.08 – 20.9px apart, the model reading 15.8px of SPARE room on a
    // row the browser has 5.1px OVER – so while this holds the shared helper cannot be the instrument
    // here and `MEASURED_PX` is load-bearing.
    expect(
      modelled,
      `the shared floor demands ${modelled.toFixed(2)}px of this row where the browser measures ` +
        `${got.demand.toFixed(2)} – if the model ever overtakes the browser, MEASURED_PX has stopped being ` +
        'the more accurate source and this file needs re-reading',
    ).toBeLessThan(got.demand)
    expect(got.slack, 'and the deficit this file records is the browser\'s, unchanged').toBeCloseTo(-5.078125, 2)
    w.unmount()
  })

  // ===============================================================================================
  // ⭐⭐⭐ AND THE THING THAT IS TRUE AND MATTERS MOST: NOTHING IS DISPLACED, ONLY THE NAME GIVES WAY
  // ===============================================================================================
  it('⭐⭐⭐ the row cannot wrap, so the Watch control and the score are never displaced', () => {
    // ⚠ THIS IS THE DIFFERENCE BETWEEN THIS FINDING AND ROUND-20 #3, and it is why the deficit above
    // is a legibility defect rather than a stopped career. `TourBriefingDialog` put its dismiss
    // control 188px below the bottom of a BLOCKING overlay; here the overflow has nowhere to go but
    // into one span's ellipsis. Three declarations make that true, and all three are asserted:
    //   1. the row is `flex-wrap: nowrap`, so there is no second line for anything to fall onto;
    //   2. `.rubber-who` declares `min-width: 0` + `overflow: hidden` + `text-overflow: ellipsis`,
    //      which is what lets it shrink below its own text – it is the span that yields;
    //   3. the other two declare NO `min-width: 0` and no `overflow`, so their automatic min-content
    //      floor stands and the browser takes the width out of `.rubber-who` first.
    // ...and then the NUMBER that closes it: what cannot yield fits the row with room to spare.
    const w = openCard(titleRun())
    const row = w.find('.college-league-match').element
    const { who, score, watch } = rowItems(row)
    // ⚠ ASKED AS «NOT WRAPPING» AND NOT AS «== nowrap», FOR AN HONEST REASON. `.college-rubber`
    // DECLARES no `flex-wrap` at all – it relies on the CSS initial value, which IS `nowrap`, and the
    // Chromium probe that produced `MEASURED_PX` read it back as exactly that. happy-dom does not
    // supply initial values for undeclared properties, so here the same property computes to `''`.
    // Pinning the literal would therefore pin the RUNNER rather than the row; pinning «never wrap»
    // is the claim itself, passes on both spellings, and still reddens on the mutation below.
    expect(getComputedStyle(row).flexWrap, 'no second line exists for a control to fall onto').not.toBe('wrap')
    expect(getComputedStyle(row).flexWrap, '...in either direction').not.toBe('wrap-reverse')

    // ⚠ PARSED, NOT COMPARED AS A STRING. The sheet says `min-width: 0` and happy-dom hands back the
    // declared token `'0'` where a browser normalises to `'0px'` – so the NUMBER is the claim and the
    // spelling is the runner's business.
    const whoCs = getComputedStyle(who)
    expect(parseFloat(whoCs.minWidth), 'the name may shrink below its own text').toBe(0)
    expect(whoCs.overflow, '...and is clipped rather than spilling').toBe('hidden')
    expect(whoCs.textOverflow, '...with the ellipsis that says so to the reader').toBe('ellipsis')

    for (const [label, el] of [
      ['the score', score],
      ['the Watch control', watch],
    ] as [string, Element][]) {
      const cs = getComputedStyle(el)
      // Either it declares nothing (so `min-width: auto` leaves its min-CONTENT floor standing) or it
      // declares a positive floor. What it must never be is the 0 that lets a flex item be crushed.
      const floorIsZero = cs.minWidth !== '' && parseFloat(cs.minWidth) === 0
      expect(floorIsZero, `${label} declares no zero floor, so its min-content width stands`).toBe(false)
      expect(cs.overflow, `${label} is not clipped, so it cannot silently lose its text`).not.toBe('hidden')
    }

    // ⚠⚠ THE LOAD-BEARING ARITHMETIC: score + Watch + both gaps against the room. If THIS ever went
    // negative the row would genuinely push a control off a phone and the ellipsis could not save it –
    // that is the round-20 failure, and it is 161.4px away.
    const { room, rigid } = rowDemand(row)
    expect(rigid, 'what cannot give way: 72.28 + 41.33 + 16').toBeCloseTo(129.609375, 2)
    expect(room - rigid, 'px still left for the name once the two rigid spans are paid').toBeCloseTo(161.390625, 2)
    expect(rigid, 'the two spans that cannot yield fit the row on their own').toBeLessThan(room)
    w.unmount()
  })

  it('⭐⭐ THE MUTATION PROOF for that pass: give the row `flex-wrap: wrap` and the read goes red', () => {
    // A test that cannot fail on the broken version is not this test. `flex-wrap: wrap` is exactly the
    // repair a future wave reaches for to «fix the truncation» – and it converts a cut name into a row
    // of unpredictable height, which is the shape round-20 #3 is a record of. The assertion that must
    // not be lost is the one that notices.
    const w = openCard(titleRun())
    const row = w.find('.college-league-match').element as HTMLElement
    const cannotWrap = (): void => {
      expect(getComputedStyle(row).flexWrap, 'the row cannot spend a second line').not.toBe('wrap')
    }
    cannotWrap() // green before the mutation, or the arm below proves nothing
    row.style.flexWrap = 'wrap'
    expect(cannotWrap, 'the same read fails on the broken version').toThrow(/cannot spend a second line/)
    w.unmount()
  })

  it('⭐⭐ THE MUTATION PROOF for the arithmetic: a longer opponent name cannot pass quietly', () => {
    // THE HONEST FAILURE MODE, and it is one the DRAW can produce rather than one a wave has to write.
    // ⚠ AND THE RED IS THE RIGHT KIND: the model REFUSES a string it never measured in a browser
    // instead of extrapolating a number and reporting a smaller deficit than the truth. That refusal
    // is what stops this file going stale the way its own first version did.
    const w = openCard(titleRun())
    rowDemand(w.find('.college-league-match').element) // green first, or the arm below proves nothing
    w.unmount()

    const long = openCard(titleRun(`${LONGEST_SURNAME}-${LONGEST_SURNAME}`))
    const wide = long.find('.college-league-match')
    expect(wide.text(), 'the arm is not vacuous – the long name really is on the row').toContain(LONGEST_SURNAME)
    expect(() => rowDemand(wide.element)).toThrow(/was never measured in a browser/)
    long.unmount()
  })

  it('⭐⭐ ...AND THE ROOM HALF MOVES TOO – a card that grows padding takes it off every row inside', () => {
    // `fits.ts`'s own sentence about why the room is WALKED rather than assumed: «a card that grows
    // 8px of padding takes those px off every row inside it». The deficit is not a constant of the row
    // – it is the row against its container, and this is the half a width regression hides in.
    const w = openCard(titleRun())
    const row = w.find('.college-league-match').element
    expect(rowDemand(row).slack, 'the shipped deficit').toBeCloseTo(-5.078125, 2)
    const card = w.find('.college-card').element as HTMLElement
    card.style.padding = '14px 80px'
    const grown = rowDemand(row)
    expect(grown.room, 'the card took 132px off the row').toBeCloseTo(291.0 - 132, 1)
    expect(grown.slack, 'and the deficit grew by exactly that').toBeCloseTo(-5.078125 - 132, 2)
    w.unmount()
  })

  it('⚠ the room the rows are measured in is the FRAME\'s room, not the window\'s', () => {
    // The guard on the mount above: if the container ever stops carrying the app's gutter, every arm
    // in this describe silently gains 32px and the measurement goes quietly weaker. So the walked
    // room is compared with the frame's own arithmetic – the viewport less two `--app-pad-x`, less
    // the Card's border and padding – rather than trusted.
    const w = openCard(titleRun())
    const row = w.find('.college-league-match').element
    const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-pad-x'))
    expect(pad, 'the frame declares a gutter').toBeGreaterThan(0)
    const cardCs = getComputedStyle(w.find('.college-card').element)
    const cardInset = parseFloat(cardCs.paddingLeft) + parseFloat(cardCs.paddingRight) + parseFloat(cardCs.borderLeftWidth) + parseFloat(cardCs.borderRightWidth)
    expect(availableWidth(row, PHONE), 'the row is measured inside the frame and inside the card').toBeCloseTo(
      PHONE.width - 2 * pad - cardInset,
      1,
    )
    w.unmount()
  })
})

// =================================================================================================
// ⚠ AND NOT ONE STRING MOVED (invariant 4)
// =================================================================================================
describe('⚠ T2 changes no wording on a shipped card', () => {
  it('the block\'s own words are the engine\'s, and the row label is `stageLabel` + the short name', () => {
    const w = openCard(titleRun())
    const block = w.find('.college-league')
    // The head is the fixture's own label, never a second name for it.
    expect(block.find('.college-league-head').text()).toBe(COLLEGE_LEAGUE.label)
    // The row's first span is composed, not written: the stage word and the opponent, one dash apart.
    expect(w.find('.college-league-match .rubber-who').text()).toBe(
      `${stageLabel(0, 8)} – ${formatShortName(`Camila ${LONGEST_SURNAME}`)}`,
    )
    // CLAUDE.md Style, asserted rather than reviewed – and the long dash would be a wording change.
    expect(block.text()).not.toMatch(/[Ѐ-ӿ]/)
    expect(block.text()).not.toContain('—')
    w.unmount()
  })
})
