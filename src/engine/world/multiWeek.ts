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
import type { StopReason, WorldEvent } from '../../shared/protocol'
import type { WorldState } from '../world'
import { pendingBirthday } from './birthday'
import { pendingKnock } from './knock'

/** THE SPAN, as one number. Four is the engine's own step (`ToWorker`'s `weeks: 1 | 4`) and the step
 *  every stop in the game was tuned against – round-23 #16 is written in terms of "a player stepping
 *  by four", and the dev fast-forward's 52 is the other, deliberately unsafe, end of the same dial.
 *  Phase 2 ("advance to the next decision") is explicitly NOT in this branch: R2-13 sequences it
 *  behind playtest evidence, so a second number here would be a guess dressed as a feature. */
export const MULTI_WEEK_SPAN = 4

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
