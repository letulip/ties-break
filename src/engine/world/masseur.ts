// THE MASSEUR: the first seat of the travelling team (docs/plans/the-travelling-team-2026-08.md,
// step 1 – the owner's ruling Б, re-cut 22.08). A salaried person on the family payroll who works
// on HER BODY, and nothing else: condition recovery week to week, and the rehab of a layoff she is
// already in. The psychologist is deliberately NOT here – he ships with the private-life layer,
// where his only legible effect exists.
//
// ⚠⚠ HOW HE DIFFERS FROM THE PHYSIO, because two levers both buying "condition" that the player
// cannot tell apart is the decorative-staff failure the owner banned («вы заплатили и не можете
// этого заметить»). The physio is a CLINIC SERVICE: it comes bundled with a hired coach, its
// quality follows the coach's rung (`physioQuality`), and its work is PREVENTION – it cuts the odds
// an injury happens (`physioRiskFactor`, a tau multiply) and the size of the layoff DEALT at onset
// (`physioRecoveryFactor`) – all of it silent, inside numbers the player never sees the
// counterfactual of. The masseur is a PERSON on salary whose work is RECOVERY YOU CAN WATCH: he
// shortens the layoff she is ALREADY IN, week by week, which moves the "back in N weeks" the
// player is staring at, and every week he buys back prints a receipt in the feed. Prevention is
// insurance; recovery is receipts. That is the legible line between the two hires.
//
// ⚠ STEP 1 IS SALARY + EFFECT ONLY. The fare – he travels, through `coachTravelFareFor`'s rule
// asked for a second seat – is step 2 of the plan and none of it is built here. His work in step 1
// happens AT HOME: the weekly table between trips, and the rehab room during a layoff.
//
// ⚠ RNG: NOTHING HERE DRAWS, on any stream. The salary is a flat contract (deliberately not a
// corridor draw – a salary is a negotiated number the player can read, unlike the physio's
// per-session band), the hire is a boolean, and the rehab acceleration in injury.ts is a
// deterministic cadence off (week − sinceWeek). The frozen MAIN capture (41550 / e6b0c709) cannot
// see this file, by construction.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. Everything needed at runtime comes from SIBLING
// leaves – ledger, ladder, college, bookings, constants. Deliberately NOT from coachMarket.ts:
// importing it here would close a runtime cycle through endings → entries → medical → this file.
import { ECONOMY } from '../economy'
import { addEvent } from './ledger'
import { guardNotEnded } from './constants'
import { activeLadderOf } from './ladder'
import { inCollege } from './college'
import { vacationForWeek } from './bookings'
import type { WorldState } from '../world'

/** THE GATE: he joins a professional operation (the plan's own ruling – «эти специалисты могут
 *  открываться в про карьере»). The boundary is the game's own one-way door: her first counting
 *  W-series result makes the professional table her table (`activeLadderOf` reads the never-pruned
 *  mark), so the gate can never close behind a layoff or a pruned window. */
export function masseurUnlocked(world: WorldState): boolean {
  return activeLadderOf(world) === 'wta'
}

/** The refusal, written once – the market card prints it and `hireMasseur` throws it, so the
 *  disabled state and the refused click can never tell two stories (the R10-16 doctrine). */
export const MASSEUR_LOCKED_DETAIL =
  'A masseur joins a professional operation – her first counting W-series result opens the door.'

/** THE HIRE, the coach's own shape: no signing fee, no notice period, effective from the next
 *  weekly bill, and firing must always be allowed – a family that cannot pay has to be able to
 *  stop paying.
 *
 *  ⚠ `guardNotEnded` FIRST, which is also the whole college rule for hiring: inside the freeze the
 *  latch throws `COLLEGE_FREEZE_REFUSAL` – the college sentence, not the ended one – and no second
 *  guard is built here. No specialist decision reaches a girl the programme is coaching.
 *
 *  ZERO RNG on any stream – the flag is a boolean and the events draw nothing. */
export function hireMasseur(world: WorldState, hire: boolean): void {
  // ⚠ W2-ENDINGS: the engine re-validates every command, because the worker is not the gate – a
  // tab left open behind the epilogue must not be able to spend money for a girl who has retired.
  guardNotEnded(world)
  if ((world.masseurHired ?? false) === hire) return
  if (hire && !masseurUnlocked(world)) throw new Error(MASSEUR_LOCKED_DETAIL)
  world.masseurHired = hire
  addEvent(world, {
    week: world.week,
    type: 'info',
    // The coach's own trick (COACH_CHANGE_KEY): kept and tagged, so "when did this arrangement
    // start" stays a read over the ledger rather than a persisted field. Bounded by construction –
    // one row per hire, and a career has a handful.
    keep: true,
    milestoneKey: `${MASSEUR_CHANGE_KEY}${world.week}`,
    // ⚠ THE PRONOUN IS SAFE HERE, unlike the coach's (R15-7): "masseur" is the male word by its own
    // grammar (the female hire would be a masseuse), there is no portrait roster to swap under it,
    // and the plan's flagship line is the owner's own «the weeks his hands did not lose». The copy
    // below still avoids pronouns where it costs nothing.
    text: hire
      ? 'A masseur is on the payroll now – table work at home, every week.'
      : 'The masseur is let go – her body is back on the physio rota alone.',
  })
}

/** The tag on a masseur-change event – the coach's `COACH_CHANGE_KEY` pattern, week in the key so
 *  two changes can never collide. */
export const MASSEUR_CHANGE_KEY = 'masseur-since-'

/** IS HE WORKING THIS WEEK – the one predicate the bill, the condition bonus and the rehab
 *  acceleration all read, so the three can never disagree about whether he was there.
 *
 *  The two stand-downs are the COACH'S OWN PRECEDENT (`coachWorksThisWeek` in world.ts), asked of
 *  a second seat: at COLLEGE the retainer is SUSPENDED, not cancelled – the family stops paying
 *  and the programme has her body, but the hire survives the freeze and resumes with the tour –
 *  and on a booked FAMILY HOLIDAY nobody is on his table, so nothing is billed and nothing is
 *  bought. It cannot be `coachWorksThisWeek` itself: that lives in world.ts, which a leaf may not
 *  import at runtime. Same two questions, second person; a third stand-down added to either
 *  should be weighed for the other (see the note beside `coachWorksThisWeek`).
 *
 *  ⚠ AND HE WORKS THROUGH A LAYOFF – that is when the salary earns hardest (the rehab room is
 *  his), so an injury is deliberately NOT a stand-down. Pure state, zero draws. */
export function masseurWorksThisWeek(world: WorldState): boolean {
  if (!(world.masseurHired ?? false)) return false
  if (inCollege(world)) return false
  return vacationForWeek(world, world.week) === undefined
}

/** WEEKLY SALARY (tick step 1c, beside `resolvePhysio`). A flat contract in cents – deliberately
 *  not a corridor draw and not jittered, so the line on the ledger is the number on the card, every
 *  week, and the player can read the deal he signed. Suspended weeks (college, family holiday)
 *  charge nothing and say nothing: the physio's own shape, and the card on screen T carries the
 *  standing fact. ZERO draws on any stream. */
export function resolveMasseur(world: WorldState): void {
  if (!masseurWorksThisWeek(world)) return
  const cost = ECONOMY.masseur.salaryPerWeekCents
  world.fundsCents -= cost
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'staff',
    text: 'Masseur – weekly salary',
    amountCents: -cost,
  })
}

/** How far back "recently" reaches for the note below – a quarter of a season, roughly the month
 *  or two a parent means by "lately". Beyond it a bought-back layoff is old news and the note
 *  returns to the quiet-work line. */
export const MASSEUR_NOTE_WINDOW_WEEKS = 13

/** ⭐ THE SENTENCE, the plan's own law (§4): the line that tells the player the masseur earned his
 *  salary this month, in plain words, quoting no figure – the coach's room note is the house
 *  pattern. If this could not be written, the effect would be in the wrong place.
 *
 *  Four states, most recent work first:
 *   1. a layoff is RUNNING and he has already taken weeks off it – the return date the player is
 *      staring at has visibly moved closer;
 *   2. a layoff is running and he has not yet – the rehab is his work now;
 *   3. a recent layoff ENDED EARLY under his hands (within `MASSEUR_NOTE_WINDOW_WEEKS`) – the
 *      flagship line, «the weeks his hands did not lose»;
 *   4. quiet weeks – the salary is buying recovery the grind would otherwise eat.
 *
 *  ⚠ NOT ONE OF THEM CONTAINS A DIGIT (the coach note's own fog rule, asked of a different card):
 *  the receipts in the feed carry the moments, the ledger carries the money, and this line carries
 *  the verdict. '' when nobody is hired – the card shows the pitch instead.
 *
 *  Pure state, zero draws, derived at snapshot time. */
export function masseurRoomNote(world: WorldState): string {
  if (!(world.masseurHired ?? false)) return ''
  if (world.injury !== null) {
    return (world.injury.weeksSaved ?? 0) > 0
      ? 'Working the rehab – her return is closer than the clinic promised.'
      : 'On the table twice a day – the rehab is his work now.'
  }
  const recentSave = world.injuryHistory.some(
    (h) => (h.weeksSaved ?? 0) > 0 && h.week >= world.week - MASSEUR_NOTE_WINDOW_WEEKS,
  )
  if (recentSave) return 'Weeks bought back – the last layoff ended sooner than it should have.'
  return 'Fresh legs – the weekly table work keeps her body ahead of the grind.'
}
