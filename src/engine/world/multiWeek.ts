// ⭐ R2-13 PHASE 1 – THE FOUR-WEEK ADVANCE, AND THE TWO FACTS A SECOND WEEK BUTTON NEEDS.
//
// The review's own success criterion is «quiet stretches of a career no longer require a press every
// week» (docs/review-principles-2026-08-23/07-proposals-and-roadmap.md, R2-13). The engine has
// supported `advanceWeeks(world, rng, 4)` since the very first slice and the worker has carried
// `weeks: 1 | 4` for as long; what has been missing since 28.07 is a control, and the control was
// removed for a reason worth quoting rather than paraphrasing (App.vue, A3): "The skip-4 button went
// with the bar: it was a testing shortcut that offered to skip the thing the player came to play."
//
// ⚠⚠ SO PHASE 1 IS A GATE AND NOT A BUTTON. R2-13 says the span may be exposed "only when the engine
// can stop before a blocking event", and that sentence has exactly two halves, which is why this file
// exports exactly two things beside the span itself:
//
//   1. `advanceRefusal` – CAN THE ENGINE TICK AT ALL? Six states refuse a tick outright, and a
//      control offered in one of them is the R10-16 dead click. This IS `advanceWeeks`'s own entry
//      gate: the function calls this, so there is one refusal in the engine and not a copy of it
//      behind a button. (The UI cannot call it – it holds a `Snapshot`, not a `WorldState` – so it
//      re-asks the same six through `blockingOverlay` + `snapshot.pending`, and
//      `tests/r2-13-advance-span.test.ts` walks a world into every one of them and asserts the two
//      readers agree. That is the discipline App.vue's birthday and injury gates already keep:
//      "the identical predicate `advanceWeeks` blocks on", asked of the snapshot.)
//
//   2. `spanDigest` – WHAT HAPPENED IN BETWEEN. Four weeks that swallow a sponsor letter, a bill or a
//      diary beat are worse than four presses, and this is the class of defect this codebase has
//      already paid for twice: R12-15's walkover ("the only trace was one line in a news feed the
//      player had no reason to open") and round-23 #16's academy verdict, which landed on `week % 52
//      === 0` while the advance hard-stops at `% 52 === 49` – so a player stepping by FOUR could
//      never land on it, and it passed in silence for a whole career. A span control that reports
//      only its last week re-opens both wounds at once, so the span reports every week it spent.
//
// NOTHING IS ADDED TO THE SAVE AND NOTHING IS ADDED TO THE SNAPSHOT. Every fact below is already
// persisted (`world.events`) or already on the wire (`Snapshot.events`); the schema does not move.
import type { SnapshotInjury, StopReason, WorldEvent } from '../../shared/protocol'
import { isOfferLive } from '../offers'
import type { WorldState } from '../world'
import { pendingBirthday } from './birthday'
import { UPCOMING_WEEKS } from './constants'
import { pendingKnock } from './knock'
import { layoffCoversWeek } from './medical'

/** THE SPAN, as one number. Four is the engine's own step (`ToWorker`'s `weeks: 1 | 4`) and the step
 *  every stop in the game was tuned against – round-23 #16 is written in terms of "a player stepping
 *  by four", and the dev fast-forward's 52 is the other, deliberately unsafe, end of the same dial.
 *  Phase 2 ("advance to the next decision") is explicitly NOT in this branch: R2-13 sequences it
 *  behind playtest evidence, so a second number here would be a guess dressed as a feature. */
export const MULTI_WEEK_SPAN = 4

// =================================================================================================
// ⭐⭐ ROUND 26 #1, SECOND PASS – WHEN THE SPAN IS *WORTH* OFFERING, WHICH IS NOT THE SAME QUESTION
// AS WHETHER THE ENGINE CAN MOVE
// =================================================================================================
//
// The first pass offered the pill wherever `advanceRefusal` was null and the week ahead was quiet –
// which is very nearly every week of a career – and the owner overturned it in one sentence
// (25.08): «появляться она должна на тех моментах, где либо в календаре нет ни одного события в
// ближайшие 5 недель, либо у нее травма на 5+ недель или до конца травмы осталось не меньше 5
// недель. Иначе это совершенно дурной элемент управления получается, с которым пропускается всё.»
//
// ⚠⚠ IT IS A SECOND GATE AND NOT A REPLACEMENT, and the direction matters. `advanceRefusal` and
// `STOP_PRECEDENCE` are untouched: they say when the advance MAY RUN, and nothing here narrows or
// widens them. This says when the advance is OFFERED as a second button, and it can only ever
// REMOVE the pill from weeks the first gate already allowed. A player who wants to spend a week
// still presses the week button; nothing in the game becomes unreachable because this returns false.
//
// ⚠⚠ AND IT IS ONE FUNCTION WITH TWO CALLERS, WHICH IS THE POINT OF PUTTING IT HERE RATHER THAN IN
// THE COMPOSABLE. «Is there anything in the next five weeks» is a question the shell and the engine
// can each answer, and this repo's most expensive recurring defect is two surfaces answering the
// same question their own way – the arrival gate's three readings (world.ts, "THE ARRIVAL GATE"),
// R10-17's four spellings of the layoff window, `entryStatus`'s private copy of the point band. So
// the predicate takes PRIMITIVES – a week, a list of dated events, an injury – and both sides hand
// it what they hold: the engine passes `world.season` / `world.injury`, the shell passes
// `snapshot.upcoming` / `snapshot.injury`. They agree BY CONSTRUCTION rather than by inspection,
// because `upcoming` is `world.season` clipped to `(week, week + UPCOMING_WEEKS]` and
// UPCOMING_WEEKS (8) is wider than the five weeks this asks about, so the clip cannot hide a member
// of the window. `tests/round26-span-gate.test.ts` walks a real career and asserts the two readings
// week by week rather than taking that argument's word for it.

/** «в календаре нет ни одного события в ближайшие 5 недель» – his number, and the ONLY place it is
 *  written. Five, not `MULTI_WEEK_SPAN`: a span of four lands on week +4 and he asked for one clear
 *  week beyond it, so the two are deliberately different constants that happen to be near each
 *  other. Must stay <= `UPCOMING_WEEKS` or the snapshot's clipped list stops being a faithful
 *  window – asserted, not trusted. */
export const QUIET_WINDOW_WEEKS = 5

/** «травма на 5+ недель ... не меньше 5 недель» – the other half of the same sentence, same number,
 *  named separately because it measures a different thing and could move on its own. */
export const LONG_LAYOFF_WEEKS = 5

/** IS THIS EVENT ON *HER* CALENDAR? She is in it, or she may still walk into it.
 *
 * ⚠⚠ THE FUNCTION MOVED HERE FROM `composables/weekDays.ts`, WHERE IT WAS `isSuitable`, AND THAT
 * FILE RE-EXPORTS IT UNDER ITS HISTORICAL NAME – the `TIER_SHORT` / `layoffCoversWeek` pattern, for
 * the identical reason. It is the rule the LOOK-AHEAD MARKERS under the week grid are drawn from,
 * and the pill's first arm has to be the same question or the screen and the control disagree about
 * what an empty fortnight is. One implementation, two readers, and the calendar's own tests
 * (`tests/calendar-screen.test.ts`) still pin it through the old path.
 *
 * ⚠ THE NARROWNESS IS THE POINT AND IT IS THE CALENDAR'S OWN DOCTRINE, quoted from the note this
 * function used to sit under: «a week whose only tournament is one she cannot enter reads as the
 * training week it IS for her – the same reading SeasonScreen's `plannable` rule takes: empty means
 * empty FOR HER.» A locked-ahead rung, a closed entry list and an outgrown draw are all rows she
 * cannot act on.
 *
 * Both terms are the ENGINE's verdicts, carried on the event by `upcomingEvents`: `entered` off
 * `world.entries` and `eligible` off `entryStatus`, the same gate `enterEvent` and `advanceWeeks`
 * ask. Nothing is judged here – this composes two answers, it does not produce them. */
export function eventIsHers(e: { entered: boolean; eligible: boolean; deadlineWeek: number }, currentWeek: number): boolean {
  return e.entered || (e.eligible && currentWeek <= e.deadlineWeek)
}

/** ARM 1 – NOTHING ON HER CALENDAR IN THE NEXT FIVE WEEKS.
 *
 *  ⚠⚠ "NO EVENT" IS "NO EVENT OF HERS", AND THAT READING IS MEASURED RATHER THAN ASSUMED. The
 *  literal reading – any dated row in `world.season` – was built first and walked: over three
 *  careers of 300 weeks it fired on **0 of 900 weeks**, because the generated tour always has
 *  something at some rung within five weeks. A rule that can never be true is not a rule, and the
 *  pill would simply have been deleted by it. Asked of HER calendar instead (`eventIsHers`, the
 *  look-ahead marker's own predicate) the same walk gives **6 / 5 / 7 of 300 weeks (~2 %)**, which
 *  is the shape he described: a control that appears on the stretches where there is nothing to do.
 *  ⚠ The Season feed's rung window was measured as a third reading (`isSuitable && feedShows`) and
 *  agreed with this one on all 900 weeks, so it is not carried – it would drag `tierOpen`,
 *  `activeLadder` and today's age into an engine predicate to change no answer.
 *
 *  ⚠ THE WINDOW IS `(week, week + 5]`, WHICH IS `upcoming`'S OWN LOWER BOUND. The current week is
 *  excluded because it is the week the OTHER button is about to spend and `useWeekAhead` already
 *  gates on what it holds; including it here would be a second opinion about the same week. And the
 *  list must be an `upcoming`-shaped one: `UPCOMING_WEEKS` (8) is wider than five, so the snapshot's
 *  clip cannot hide a member of this window – asserted in `tests/round26-span-gate.test.ts`. */
export function calendarClearAhead(
  week: number,
  calendar: readonly { week: number; entered: boolean; eligible: boolean; deadlineWeek: number }[],
): boolean {
  return !calendar.some((e) => e.week > week && e.week <= week + QUIET_WINDOW_WEEKS && eventIsHers(e, week))
}

/** ARM 2 – SHE IS LAID UP LONG ENOUGH THAT THE CALENDAR DOES NOT MATTER.
 *
 *  Both terms he named, in his order, because he named both: the layoff as DEALT (`totalWeeks`, the
 *  figure the injury report prints and the album records) and the layoff as it STANDS
 *  (`weeksRemaining`).
 *
 *  ⚠ THE REMAINING TERM IS R10-17'S OWN WINDOW AND NOT A FIFTH SPELLING OF IT. `layoffCoversWeek`
 *  is the extracted arithmetic every surface with a Snapshot already uses (`medical.ts` says why),
 *  and "five weeks still to run" is exactly "the layoff still covers week + 4": the function reads
 *  `week < currentWeek + weeksRemaining`, so `currentWeek + 4 < currentWeek + remaining` is
 *  `remaining >= 5`. Written this way the term cannot drift from the window the entry gate, the
 *  planner and the onset sweep are all reading.
 *
 *  ⚠ AND THE SECOND TERM IS SUBSUMED BY THE FIRST AS THE ENGINE STANDS TODAY, MEASURED RATHER THAN
 *  ASSUMED: `rollInjury` opens a layoff with `weeksRemaining === totalWeeks` and nothing ever
 *  increases it (`injury.ts` decrements, the masseur decrements again), so `remaining >= 5` implies
 *  `total >= 5` and no career can reach a state only the second term catches. It is kept because
 *  the owner named it and because it is the term that stays TRUE if a layoff is ever extended or
 *  `totalWeeks` re-based – and the subsumption is pinned in `tests/round26-span-gate.test.ts` so
 *  the day it stops holding is a red test rather than a surprise. */
export function longLayoff(week: number, injury: SnapshotInjury | null): boolean {
  if (injury === null) return false
  if (injury.totalWeeks >= LONG_LAYOFF_WEEKS) return true
  return layoffCoversWeek(week, injury.weeksRemaining, week + LONG_LAYOFF_WEEKS - 1)
}

/** THE OWNER'S RULE, AS ONE PREDICATE: the two arms, ORed, and nothing else. Pure, no RNG, no
 *  mutation, no persistence – so the shell may call it on a `Snapshot` and a test on a `WorldState`
 *  and get the same answer. */
export function spanWorthOffering(
  week: number,
  calendar: readonly { week: number; entered: boolean; eligible: boolean; deadlineWeek: number }[],
  injury: SnapshotInjury | null,
): boolean {
  return calendarClearAhead(week, calendar) || longLayoff(week, injury)
}

// =================================================================================================
// ⭐⭐ ROUND 29 #6 – HOW LONG THE SLOT ACTUALLY IS, WHICH IS NOT THE SAME QUESTION AS WHETHER THERE
// IS ONE
// =================================================================================================
//
// The owner, on the shipped control: «Листалка на 4 недели кажется весьма бессмысленной: у меня был
// слот 6 недель, я нажал, увидел сообщение о конце года и странное окошко с отчётом о двух
// пройденных днях, а календарь так и остался на 51й неделе.» (docs/rounds/round-29.md #6, and this
// is round 26 #1 coming back a second time.)
//
// ⚠⚠ THE PRESS TOLD HIM THREE THINGS AND ALL THREE WERE WRONG BY A DIFFERENT MECHANISM, which is why
// the repair is in three places rather than one:
//
//   1. IT OFFERED FOUR AGAINST A SLOT OF SIX. `MULTI_WEEK_SPAN` was a CONSTANT – the engine's
//      historical step, the number `weeks: 1 | 4` carried on the wire – so the button's label was a
//      fact about the code and never about the week it was standing on. That is this function.
//   2. THE YEAR END TRUNCATED IT. `advanceWeeks` broke on 'season-end', so a press made at the tail
//      of a season bought the two or three weeks before the wrap and stopped. See `SPAN_REPORTS_ONLY`
//      below and the note in `advanceWeeks`.
//   3. AND THE CALENDAR "DID NOT MOVE" because 1 and 2 together left him three weeks further into
//      the same dead stretch he pressed from, which is not a place a career visibly moves to.
//
// ⚠ NOTHING HERE WIDENS WHEN THE PILL IS OFFERED. `spanWorthOffering` above is untouched and still
// the owner's own 25.08 rule; this only answers "how many" once that has already answered "yes".

/** HOW MANY WEEKS THE PRESS SHOULD BUY – the consecutive weeks ahead with nothing of HERS in them,
 *  and never more than the shell can actually see.
 *
 *  ⚠ THE CAP IS `UPCOMING_WEEKS` AND IT IS DERIVED, NOT PICKED. `Snapshot.upcoming` is clipped to
 *  `(week, week + UPCOMING_WEEKS]`, so beyond that horizon the shell has NO information about her
 *  calendar at all – a longer offer would be the button asserting a quiet week it cannot see. That
 *  also keeps the control modest without a second tuning knob: the owner's objection to the first
 *  pass was «с которым пропускается всё», and a span can never exceed two months of a career.
 *
 *  ⚠ ONE RULE FOR BOTH OF HIS ARMS, DELIBERATELY. A long layoff does not get its own length: a girl
 *  laid up for nine weeks who is still ENTERED in something in three is a walkover the engine stops
 *  on (R12-15), so counting to the entry is the honest number in both arms and the layoff needs no
 *  clause of its own. `eventIsHers` is the same predicate `calendarClearAhead` and the look-ahead
 *  markers read, so the pill counts the weeks the calendar draws as empty and no others.
 *
 *  Pure, zero draws, primitives in – the shell hands it `snapshot.upcoming`, a test hands it
 *  `world.season`, exactly as `spanWorthOffering` above. */
export function spanWeeksFor(
  week: number,
  calendar: readonly { week: number; entered: boolean; eligible: boolean; deadlineWeek: number }[],
): number {
  let clear = 0
  for (let k = 1; k <= UPCOMING_WEEKS; k++) {
    if (calendar.some((e) => e.week === week + k && eventIsHers(e, week))) break
    clear = k
  }
  return clear
}

/** ⭐⭐ THE REASONS A SPAN REPORTS AND DOES NOT HALT ON, and there is exactly one.
 *
 *  ⚠⚠ WHY 'season-end' IS ALLOWED TO PASS AND NOTHING ELSE IS. Every other member of
 *  `STOP_PRECEDENCE` either COSTS her something the week it lands (the medical trio, the walkover,
 *  the academy's verdict, the funds line) or asks the parent a QUESTION with a clock on it (an
 *  entry deadline, an open letter) – and the whole of R2-13's licence to exist is that a span never
 *  buries one of those. The season wrap-up is neither. It costs nothing, asks nothing, and –
 *  measured rather than assumed – **its dialog does not depend on this stop at all**:
 *  `showSeasonSummary` in App.vue reads `snapshot.lastSeasonSummary` against a per-season watermark
 *  and has done since round-19 #2, precisely because a stop reason «dies with the command» and the
 *  recap was being lost behind questions that answered themselves. So the wrap-up still shows, once,
 *  on the week it was banked; what stops happening is the SPAN being cut in half to deliver it.
 *
 *  ⚠ IT IS STILL COLLECTED AND STILL RETURNED. The caller gets 'season-end' in its
 *  `STOP_PRECEDENCE` place exactly as before – R11-1's rule is that a week which is several things
 *  reports all of them, and a reason that stopped being reported would be that bug again. This list
 *  changes only whether the LOOP breaks.
 *
 *  ⚠ AND IT CANNOT SWALLOW A SECOND WRAP. A season is 52 weeks and a span is at most
 *  `UPCOMING_WEEKS` (8), so no press can cross two of them. */
export const SPAN_REPORTS_ONLY: ReadonlySet<StopReason> = new Set<StopReason>(['season-end'])

/** The six states in which `advanceWeeks` refuses to tick AT ALL, in the order it asks them.
 *
 *  ⚠ THE ORDER IS THE FUNCTION'S, NOT `STOP_PRECEDENCE`'S, and the difference is real: precedence
 *  orders reasons that all fired on ONE week, while this orders mutually exclusive questions about
 *  the world as it stands. They agree on the only pair where both are meaningful ('ending' first).
 *
 *  ⚠ EXPORTED FOR THE DRIFT GUARD. A seventh refusal added to `advanceWeeks` without a line here
 *  would leave the four-week control offered in a state the engine cannot move – the dead click
 *  again – so `tests/r2-13-advance-span.test.ts` counts the refusals in the function's own source
 *  against this list. Hand-written on the `STOP_PRECEDENCE` precedent (round11.test.ts): derived
 *  from the code it could never catch the member the code forgot. */
export const ADVANCE_REFUSALS: readonly StopReason[] = ['ending', 'tournament', 'knock', 'birthday', 'fork', 'retirement']

/** WHY THE ADVANCE WILL NOT MOVE, or `null` when it will. `advanceWeeks`'s entry gate, extracted
 *  verbatim so the gate and the button read one rule.
 *
 *  ⚠ IT IS A REFUSAL AND NOT A STOP. Every reason here is returned with ZERO ticks: the week the
 *  player pressed for does not happen, and the reason names the question standing in front of it.
 *  `resumeFromCollege` keeps the same contract at its own entry and says so in its own note. */
export function advanceRefusal(world: WorldState): StopReason | null {
  // ⚠ W2-ENDINGS – AND THE STORY HAS NO NEXT WEEK. First, above every other block, because it is
  // not a pause: there is nothing left to resolve and nothing to come back to. The epilogue's
  // surface REPLACES the app shell rather than laying a dialog over it, so an advance behind it
  // would be ticking a world nobody can see. The one ending that resumes clears this latch through
  // `resumeFromCollege`, which is a command and not a tick.
  if (world.ending) return 'ending'
  // A pending reveal must resolve (and close) before time moves on.
  if (world.pendingTournament) return 'tournament'
  // ⚠ W4 – AND SO MUST AN UNANSWERED KNOCK. This line is the mechanical heart of the whole slice.
  //
  // The owner's complaint was that training weeks «просто скипались» – he pressed +4 and four weeks
  // of his daughter's life went past without asking him anything. Halting is not enough: a stop the
  // player can dismiss with one tap and then re-press is a notification, not a decision. So a knock
  // BLOCKS, on the identical contract `pendingTournament` has above – no tick at all until
  // `decideKnock` runs. Both branches of the dialog are valid answers, so this can never dead-end a
  // career (see KnockDialog: there is no third button and no way out that is not a choice).
  if (pendingKnock(world)) return 'knock'
  // ⭐ v48 – AND SO DOES AN UNANSWERED BIRTHDAY, on the identical contract, because the owner asked
  // for the popup to fire ALWAYS («я бы оставил попап на ДР всегда») and a popup a `+4` ticks past
  // does not always fire. It also forces the shape of the dialog: if the advance could roll on, then
  // walking away would silently become the "gave nothing" branch and the player would pick it by
  // accident, every year, and never know. Four buttons, all of them answers, and no other way out.
  if (pendingBirthday(world) !== null) return 'birthday'
  // ⚠ ...AND SO DOES AN UNANSWERED FORK OR AN UNANSWERED OFFER, on the identical contract. Two of
  // the fork's three answers END the career, so a player who could press +4 past it would have the
  // engine choosing "continue" for him – which is exactly the «просто скипались» complaint the knock
  // block above exists to answer, one order of magnitude more expensive.
  if (world.fork !== null && world.fork.answer === null) return 'fork'
  if (world.retirementOffer !== null) return 'retirement'
  return null
}

/**
 * ⭐ DID A LETTER THE PARENT CAN STILL ANSWER LAND ON THE WEEK JUST TICKED? The `'offer'` stop's
 * whole rule, in one predicate, and the two clauses are the two halves of the argument.
 *
 * ⚠⚠ 1. A DECISION, NEVER A NOTICE (`isOfferLive`, which reads `state === 'open'` and nothing else
 * as its first term). The inbox carries both kinds of paper and `OfferState` already draws the line:
 * an `open` letter is a proposal with a deadline that EXPIRES unanswered, an `info` letter «is born
 * terminal – there is nothing to sign and nothing to refuse». Everything the desks write is `info` –
 * the entry receipts and cancellations, the tour's due / penalty / suspension / season notices, the
 * academy's three letters, a brand's goodbye – and none of it is worth four weeks of a career: a
 * notice read four weeks late is the same notice, and it is still in the inbox a decade later. The
 * letters that are NOT the same four weeks late are the three that can be gone: a kit proposal
 * (`raiseKitOffers`), its renewal (`raiseKitRenewal`) and the advertising deal (`raiseAdOffer`).
 *
 * ⚠⚠ 2. ON THE WEEK IT ARRIVED, ONCE (`o.week === world.week`). Without this clause the stop would
 * read "there is a live offer", and a sponsor window is FIVE weeks wide – so one unanswered letter
 * would halt four consecutive spans and the four-week pill would be a press a week again, which is
 * the disease R2-13 exists to cure and not a stronger version of the cure. The parent is allowed to
 * let a letter lie: «the window is the feature, not a courtesy» (engine/offers.ts). What he is not
 * allowed to do is never be told it came. This is the same arrival shape every other collected stop
 * already uses – `academySpokeThisWeek`, `walkoverWeek === world.week`, `injury.sinceWeek ===
 * world.week` – and it is why the reason is collected and not a refusal: `advanceRefusal` does not
 * name it, so the next press moves time whatever he decided.
 *
 * ⚠⚠ AND BOTH CLAUSES ARE MEASURED RATHER THAN ARGUED. 12 careers walked six seasons each (3744
 * weeks, 72 seasons, 2551 presses at a span of four), the three candidate rules replayed over the
 * SAME walk – which is sound here because MAIN input-independence means the world does not depend on
 * the span rule, so one walk serves as all three arms:
 *
 *     rule                                   letters seen   extra presses vs no stop   longest run
 *     this one (open + arrived)                    57              +5   (+0.20 %)            2
 *     "any letter dated this week"                127              +5   (+0.20 %)            2
 *     "there is a live offer at all"              263            +152   (+6.0  %)            5
 *
 * The arrival clause is the expensive one to get wrong: without it a single unanswered letter halts
 * FIVE spans running, one per week of the window, which is the pill demoted back to a weekly press.
 * The decision/notice clause cost nothing measurable on this sample – all 70 notice-only weeks
 * already stopped for another reason, because the desks write their receipts on entry-deadline and
 * tournament weeks by construction – so it is kept for the reason a measurement cannot supply: the
 * toast tells the player there is something to ANSWER, and over a receipt that sentence is false.
 *
 * ⚠ AND IT IS DERIVED, SO NOTHING IS PERSISTED FOR IT. `Offer.week` is the week the paper is dated
 * and has been in the save since v32; no field is added, no shape gains a member, and
 * `SAVE_SCHEMA_VERSION` does not move. Pure, zero draws, no mutation.
 */
export function stoppableOfferWeek(world: WorldState): boolean {
  return world.offers.some((o) => o.week === world.week && isOfferLive(o, world.week))
}

/** One week of a span, with everything that week wrote in the feed. `rows` is never empty – a week
 *  with nothing to report is dropped rather than rendered as a heading over a blank. */
export interface SpanWeek {
  week: number
  rows: WorldEvent[]
}

/**
 * EVERYTHING THE SPAN RAISED, week by week, oldest first.
 *
 * ⚠⚠ IT FILTERS ON THE WEEK WINDOW AND ON NOTHING ELSE, AND THAT IS THE WHOLE DESIGN. The temptation
 * is to show "the interesting rows" – and every version of that idea is a second, private opinion
 * about what a parent is allowed to miss, which is precisely the opinion that lost the academy's
 * scholarship for a whole career and the walkover's forfeited fee for a season. A weekly coaching
 * bill is a bill; a sponsor letter is a letter; a diary line is a diary line. They all appear.
 *
 * `from` is EXCLUSIVE and `to` INCLUSIVE, so the caller passes the week it pressed on and the week it
 * landed on and gets exactly the weeks that happened in between, the last one included: the span's
 * final week is not special-cased into the ordinary recap, because on a stop it is the week the
 * player most needs to read.
 *
 * Pure, allocation-only, no RNG, no world mutation – so it can be called from the shell against
 * `Snapshot.events` and from a test against `world.events` and give the same answer.
 */
export function spanDigest(events: readonly WorldEvent[], from: number, to: number): SpanWeek[] {
  const byWeek = new Map<number, WorldEvent[]>()
  for (const e of events) {
    if (e.week <= from || e.week > to) continue
    const rows = byWeek.get(e.week)
    if (rows) rows.push(e)
    else byWeek.set(e.week, [e])
  }
  return [...byWeek.keys()].sort((a, b) => a - b).map((week) => ({ week, rows: byWeek.get(week)! }))
}

/** How many rows a digest carries in total – the number the "nothing was lost" assertion compares. */
export function spanRowCount(digest: readonly SpanWeek[]): number {
  return digest.reduce((n, w) => n + w.rows.length, 0)
}
