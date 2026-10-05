// ⭐⭐⭐ SUCCESSION S2c – A COMPLETE CHILDHOOD, BUILT FROM THE RUN'S OWN FUNCTIONS.
//
// The dynasty door's tests need `isComplete(run)` – the gate on the ninth card's create call – without walking nine cards through a screen, and the
// worker-seam tests need a REAL prologue handover (skills, style, rung, trace) so that «the nine years are not thrown away at the last card» is a
// claim about a childhood and not about an empty list. Both come off the same three lines of the run's own reducers, so they live here once.
//
// ⚠ IT CHOOSES THE FIRST OPTION OF EVERY CARD AND DECLINES THE THREE TOURNAMENT ASKS. That is arbitrary on purpose: a test that needs a particular
// road writes its own, as tests/component/prologue-walk.test.ts does; this one only has to be a childhood the engine accepts, and it says so loudly
// (a thrown error, not a skipped test) the day the card table moves and the builder stops yielding one.
import { PROLOGUE_CARDS, TOURNAMENT_ANSWER } from '../../src/prologue/cards'
import {
  EMPTY_RUN,
  cardFor,
  chosenYears,
  isComplete,
  spentCents,
  traceOf,
  withEntry,
  withOrigin,
  withPick,
  type PrologueRun,
} from '../../src/prologue/run'
import type { FamilyBackground, PrologueHandover } from '../../src/shared/protocol'

/** Ages whose card carries the tournament ask as a second beat (prologue-walk.test.ts answers the same three). */
const ASK_AGES = [11, 12, 13] as const

export function completeRun(origin: FamilyBackground = 'middle'): PrologueRun {
  let run = withOrigin(EMPTY_RUN, origin)
  for (const row of PROLOGUE_CARDS) {
    const card = cardFor(row.age, run)
    if (card.options) run = withPick(run, card.age, card.options[0].id)
  }
  for (const age of ASK_AGES) run = withEntry(run, age, TOURNAMENT_ANSWER.decline)
  if (!isComplete(run)) {
    throw new Error('completeRun: the builder no longer yields a finished childhood – the prologue card table moved')
  }
  return run
}

/** The handover the ninth card hands the worker for `run` – the same three fields `ChildhoodPrologue.begin()` builds. */
export function handoverOf(run: PrologueRun): PrologueHandover {
  return { years: chosenYears(run), spentCents: spentCents(run), trace: traceOf(run) }
}
