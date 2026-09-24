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
// ⚠ AND THE INSTRUMENT IS `assertInlineRowFits`, NOT `assertDismissReachable`. The card is NOT a
// dialog – it is a block in Home's own flow – so it has no dismiss control to measure and no
// overlay that can strand a career. What it has is a ROW: `.college-league-match` is
// `display: flex` with three spans competing for the width of a phone (`.rubber-who`, which is
// `white-space: nowrap`, `.rubber-score`, also nowrap, and `.rubber-watch`). A red verdict here is
// not «the control is unreachable», it is the claim `fits.ts` states for this shape: the three
// pieces do not stand beside each other, so the row the owner reads as one line is two lines on his
// screen – with `.rubber-who`'s `text-overflow: ellipsis` eating the opponent's name to pay for it.
//
// ⚠⚠ THE WORST CASE IS ASKED OF THE ENGINE'S OWN POOL AND NEVER TYPED. `.rubber-who` is the stage
// word plus `formatShortName(oppName)`, and the stage words of a draw of eight are fixed by
// `stageLabel` («Quarterfinal» is the longest of the three). The variable half is the surname, so
// the fixture takes the LONGEST entry of `SURNAMES` – the same pool `collegeLeagueOpponent` draws
// from – and puts it on every row. A fixture that typed «Kovac» would measure a row the draw can
// beat.
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
// WHAT IT MEASURES, AS THE NUMBERS RATHER THAN AS «IT FITS» (24.09, one quiet machine). Room for a
// row: 375 − 2×16 (the frame) − 30 (the Card's border and padding) = 313 to the `li`, less the row's
// own 10px padding and 1px border a side = **291.0px**, with two 8px gaps inside it. Demanded, worst
// case per shape, with the Watch label credited (see `assertLeagueRowFits`):
//
//     «Quarterfinal – C. Ostergaard  Won 6-3 6-4   Watch»   275.2 of 291.0   (15.8 spare)
//     «Semifinal – C. Ostergaard     Won 6-3 6-4   Watch»   256.9 of 291.0   (34.1 spare)
//     «Final – C. Ostergaard         Won 6-3 6-4   Watch»   232.4 of 291.0   (58.6 spare)
//     «Quarterfinal – C. Ostergaard  Lost 4-6 5-7  Watch»   281.1 of 291.0   ( 9.9 spare)
//
// ⚠ THOSE FOUR ARE THE MODEL'S NUMBERS AND THEY ARE OPTIMISTIC. Read the block below before quoting
// any of them: charged honestly, the first row needs 296.1 of the same 291.0.
//
// ⚠⚠⚠ AND THE FLOOR ABOVE IS NOT THE TRUTH: MEASURED IN A REAL BROWSER THE WORST SHIPPED ROW IS
// ~5px OVER ITS 291.0px, AND THE OPPONENT'S NAME IS ALREADY BEING ELLIPSISED ON A 375px PHONE.
//
// This was NOT found by the assertions below and cannot be – they are `fits.ts`'s model, and the
// model is a documented FLOOR. It was found by charging the two things this file's own report says
// the floor omits. Instrument: one-off headless Chromium (playwright, `deviceScaleFactor: 1`) over
// the row's verbatim markup, `src/style.css` and the repo's own self-hosted Manrope – the same
// harness `fits.ts`'s header describes for fitting `ADVANCE`. Nothing of it is committed; it was a
// measurement, not a test, and the numbers are recorded here because the run is gone.
//
//   the Watch span at 10px, decomposed:  «Watch» 400 = 29.75   800 = 31.61
//                                        800+uppercase = 36.33   +`letter-spacing: 0.1em` = 41.33
//   -> the model charges 23.5 for that span (and the SHARED helper charges 0.0). Real cost 41.33.
//   the score, widest straight sets:     «Won 6-3 6-4» 72.3  (⚠ WIDER than «Lost 4-6 5-7», 71.8 –
//                                        `tabular-nums` makes every digit the same width, so the
//                                        model's character count had the two the wrong way round,
//                                        and the TITLE run's Quarterfinal row is the worst, not the
//                                        early exit's. The claim that stood here said the opposite.)
//   -> so `.rubber-who`'s real budget is 291.0 − 16 (gaps) − 72.3 − 41.33 = **161.4px**
//   «Quarterfinal – C. Ostergaard» measures **166.5px** -> needed 296.1 of 291.0, **OVER by 5.1**,
//   and the rendered span confirms it: `scrollWidth` 166.5 against `clientWidth` 161.9, truncated.
//
// HOW MUCH OF THE DRAW THIS TOUCHES, counted over all 211 `SURNAMES` rather than argued:
//
//                          straight sets            after a retirement («… ret.», score 94.6)
//     Quarterfinal          11 of 211 overflow       129 of 211
//     Semifinal              0 of 211                 25 of 211
//     Final                  0 of 211                  0 of 211
//
// So on a 375px phone this is the LONG-NAME TAIL of one round – ~5% of the draw – and it becomes the
// COMMON case in any round she or her opponent retired in, because `ret.` costs the score span
// 22.3px. ⚠ It is a legibility defect and NOT a stranded control: `.college-rubber` declares no
// `flex-wrap`, so the row cannot wrap and nothing leaves the screen – `.rubber-who` gives way
// through its own `text-overflow: ellipsis`, which `src/style.css` calls «the safety net at 375px,
// not the plan». The Watch button and the score are never touched.
//
// ⚠ NOT FIXED HERE, AND DELIBERATELY. Every repair is a wording or a layout change to a card that
// shipped on 22.08 – shortening the label, dropping the stage word, wrapping the row, restyling the
// Watch pill – and invariant 4 says that is the owner's call and not this wave's. T2 was asked to
// MEASURE this surface; the measurement found something and the number is recorded rather than
// smoothed. The architect has it as a question.
//
// ⚠ 320x568 IS NOT MEASURED BY AN ARM IN THIS FILE, ON THE COORDINATOR'S RULING (24.09): 375x667 is
// the house's phone law by name and a permanently red arm is not a measurement anybody can act on.
// The number, for the record: room **236.0px**, the same row needs 296.1, **OVER by 60.1** – on
// straight sets every one of the 211 surnames overflows the Quarterfinal and the Semifinal row, and
// 52 overflow even «Final». The narrow phone is not a tail case on this surface, it is the shape.
//
// THE MUTATION LEDGER – each arm run RED before this file was believed:
//   * `LONGEST_SURNAME` lengthened by a second barrel (`Ostergaard` -> `Ostergaard-Vandenberg`),
//     the structure and every class untouched -> BOTH shape arms RED with the helper's own
//     arithmetic: «the controls demand 319px of a 291px row» (title) and «325px of a 291px row»
//     (early exit). This is the honest failure mode – the draw hands the card a longer name than the
//     fixture did – and it is the arm that says the two green verdicts above are not vacuous.
//   * `.college-card`'s own padding grown from the Card's 14px to 80px a side, nothing else ->
//     RED, which is `fits.ts`'s own sentence about a walked room («a card that grows 8px of padding
//     takes those px off every row inside it»).
//   * the row's `display` taken off flex -> the helper REFUSES rather than passing, which is what
//     stops a green verdict from surviving the block being rebuilt as a grid or a list.
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
// app's own sheet the cascade is empty and the measurement passes vacuously – `assertInlineRowFits`
// refuses outright if no `<style>` reached the document, which is the guard that says so out loud.
import '../../src/style.css'
import CollegeYearCard from '../../src/components/CollegeYearCard.vue'
import { useGameStore } from '../../src/stores/game'
import { ENDINGS } from '../../src/engine/ending'
import { SURNAMES } from '../../src/engine/season/names'
import { COLLEGE_LEAGUE } from '../../src/engine/collegeLeague'
import { stageLabel } from '../../src/engine/world/labels'
import { formatShortName } from '../../src/shared/format'
import { assertInlineRowFits, availableWidth, PHONE, setViewport } from './fits'
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
 *  rather than measuring two of three: `assertInlineRowFits` would happily call a row of two
 *  controls a fit, and «the Watch control disappeared» must not read as «it fits better now». */
function rowItems(row: Element): Element[] {
  return ['.rubber-who', '.rubber-score', '.rubber-watch'].map((sel) => {
    const el = row.querySelector(sel)
    if (!el) throw new Error(`a league row has no ${sel} – the measurement below would be vacuous`)
    return el
  })
}

/**
 * ⭐⭐ ONE LEAGUE ROW, MEASURED TWICE, AND THE SECOND READ IS THE ONE THAT MATTERS ON THIS SURFACE.
 *
 * ⚠⚠ THE SHARED FLOOR SCORES `.rubber-watch` AT ZERO PX, AND THAT IS A REAL HOLE HERE RATHER THAN A
 * QUIBBLE. `demandedWidth` credits a control's own label only when it is `white-space: nowrap`
 * («an ellipsis is not credited» – its own ⚠), and reads `min-width` otherwise. `.rubber-watch`
 * declares neither, and carries no padding, so the shared instrument measures the Watch control as
 * costing NOTHING across – measured here: `needed` 251.7px of a 291.0px row on the worst title row,
 * of which the button the owner presses contributed 0.0.
 *
 * ⚠ IT IS CLOSED WITHOUT TOUCHING `fits.ts`, by telling the model what the row already is: «Watch»
 * is one word in a 10px span that cannot break, so it behaves as `nowrap` whether or not it says so.
 * Setting that inline for the length of the read makes `demandedWidth` credit the label, and the
 * property is restored afterwards. The stricter number is the one this file believes: 275.2px of
 * 291.0 on the worst title row, 281.1 on the early exit's.
 *
 * ⚠ AND EVEN THE STRICT READ IS STILL A FLOOR, DELIBERATELY, in `fits.ts`'s own direction: the model
 * charges nothing for `.rubber-watch`'s `letter-spacing: 0.1em` (five characters, so ~5px) and
 * nothing for `text-transform: uppercase` being wider than the lower-case glyphs it measures. So a
 * green verdict here means «there is room», never «there is 10px of room».
 */
function assertLeagueRowFits(row: Element, label: string): { loose: number; strict: number } {
  const items = rowItems(row)
  const loose = assertInlineRowFits(row, items, PHONE, label)
  const watch = items[2] as HTMLElement
  const prior = watch.style.whiteSpace
  watch.style.whiteSpace = 'nowrap'
  try {
    return { loose, strict: assertInlineRowFits(row, items, PHONE, `${label}, with the Watch label credited`) }
  } finally {
    watch.style.whiteSpace = prior
  }
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
// ⚠⚠ THE PHONE LAW – THREE SPANS, 375px, AND THE MEASUREMENT CAN FAIL
// =================================================================================================
describe('⚠⚠ T2 – a league row stands on one line of a 375x667 phone', () => {
  for (const [name, view, count] of [
    ['a TITLE run (Quarterfinal, Semifinal, Final)', titleRun, 3],
    ['an EARLY EXIT (one round)', earlyExit, 1],
  ] as [string, () => CollegeProgressView, number][]) {
    it(`⭐⭐⭐ ${name}: every row fits at ${PHONE.width}x${PHONE.height}`, () => {
      const w = openCard(view())
      const rows = w.findAll('.college-league-match')
      expect(rows, 'the arm is not vacuous – the rows really are drawn').toHaveLength(count)
      for (const row of rows) {
        const label = `the league row «${row.text().replace(/\s+/g, ' ').trim()}»`
        const { loose, strict } = assertLeagueRowFits(row.element, label)
        // ⚠ THE HELPER'S RETURN IS THE PX LEFT OVER, and the two are recorded rather than discarded:
        // an unresolvable length reaches `lengthPx` as NaN, and NaN compares true against nothing –
        // so a room that quietly stopped being a number would pass the helper's `<=` and be believed.
        expect(Number.isFinite(loose) && Number.isFinite(strict), 'the room left over is a number').toBe(true)
        // ...and the stricter read can only ever be the smaller of the two, which is the sanity check
        // on the credit itself: a Watch label that measured FREE under `nowrap` would mean the inline
        // property never reached the cascade and this whole arm was the loose one twice.
        expect(strict, 'crediting the Watch label costs the row width rather than giving it some').toBeLessThan(loose)
      }
      w.unmount()
    })
  }

  it('⭐⭐ THE MUTATION PROOF: a longer opponent name and the same assertion goes red', () => {
    // THE HONEST FAILURE MODE, and it is one the DRAW can produce rather than one a wave has to
    // write: `.rubber-who` is `white-space: nowrap` with `text-overflow: ellipsis`, and `fits.ts`
    // refuses to credit the ellipsis on its own stated grounds – «a control cut down to "Trai…" is
    // not a control the measurement should score as fitting». So a surname long enough pushes the
    // three spans past the row's width, and what the player gets is a truncated opponent.
    const w = openCard(titleRun())
    const row = w.find('.college-league-match')
    // Green first, or the arm below proves nothing about the assertion.
    assertLeagueRowFits(row.element, 'the league row')
    w.unmount()

    const long = openCard(titleRun(`${LONGEST_SURNAME}-${LONGEST_SURNAME}`))
    const wide = long.find('.college-league-match')
    expect(wide.text(), 'the arm is not vacuous – the long name really is on the row').toContain(LONGEST_SURNAME)
    expect(() => assertLeagueRowFits(wide.element, 'the league row')).toThrow(
      /cannot stand beside each other and the row wraps/,
    )
    long.unmount()
  })

  it('⭐⭐ ...AND THE ROOM HALF FAILS TOO – a card that grows padding takes it off every row inside', () => {
    // `fits.ts`'s own sentence about why the room is WALKED rather than assumed: «a card that grows
    // 8px of padding takes those px off every row inside it». This is the slow regression the phone
    // law exists for – nothing about the row changes, and it stops fitting.
    const w = openCard(titleRun())
    const row = w.find('.college-league-match')
    assertLeagueRowFits(row.element, 'the league row')
    const card = w.find('.college-card').element as HTMLElement
    card.style.padding = '14px 80px'
    expect(() => assertLeagueRowFits(row.element, 'the league row')).toThrow(
      /cannot stand beside each other and the row wraps/,
    )
    w.unmount()
  })

  it('⚠ and a row that stops being a row is REFUSED, not passed', () => {
    // The helper's first guard, and the reason it matters here: the block could be rebuilt as a grid
    // or a definition list in a later wave, and a measurement that silently answered "fits" about a
    // non-flex row would be a green test about nothing.
    const w = openCard(titleRun())
    const row = w.find('.college-league-match').element as HTMLElement
    row.style.display = 'block'
    expect(() => assertLeagueRowFits(row, 'the league row')).toThrow(/so its children are not on a line at all/)
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
