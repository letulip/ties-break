// THE PSYCHOLOGIST: the second seat of the travelling team, and the one that does not travel
// (docs/plans/the-travelling-team-2026-08.md §2, the owner's ruling Б – «массажист ездит, психолог
// работает дистанционно и стоит только зарплату»; the whole seat is specced in
// docs/specs/the-psychologists-year-2026-09.md and briefed in
// docs/plans/life-wave-5-builder-2026-09.md §2 T2). A salaried person on the family payroll who
// works on HER HEAD for a YEAR AT A TIME: one chosen focus a season, one session a week, and the
// rung buys WHO comes to the call rather than a busier calendar.
//
// ⚠⚠ THIS FILE IS `masseur.ts`'s TWIN BY CONSTRUCTION AND ITS OPPOSITE BY RULING, which is the only
// way to read the two together. Same import discipline, same guard order, same hire shape, same
// stand-down pair, same flat-contract-per-rung bill. And then: NO FARE (`staffSeatFareCents` is
// never asked for this seat), NO TRAVEL STANCE, NO RESULTS SHARE (`ECONOMY.staffShare` stays
// `'coach' | 'masseur'` – O3, ruled 13.09: he is not in the box on match day), and no tournament
// week that swaps the weekly bill for a per-match one, because he never boards. What is left is the
// cleanest retainer in the game: one number, every week he is not stood down.
//
// ⚠⚠ AND THE SEAT SHIPPED HERE DOES NOTHING YET. That is the wave's design and not an unfinished
// step: every effect this man has arrives with the FOCUS that names it – the recovery slope inside
// `accrueSpirit` (T4), the bounded composure walk (T5), the legible-wording draw (T6), the walls'
// slow-down (T7). T2 puts a person on a retainer and charges for him; a reader looking here for the
// effect is in the wrong file by exactly one commit.
//
// ⚠ RNG: NOTHING HERE DRAWS, on any stream, and it is a STRONGER claim than the masseur's because
// there is nothing in this file that could. A salary is a negotiated number the player can read
// (the masseur's own legibility argument, one seat over), the hire and the rung are plain state, and
// the two focus streams this wave opens (`seed:psy:listen:…`, `seed:life:walls:…`) belong to T6 and
// T7 and live where they are drawn. The frozen MAIN capture (41550 / e6b0c709) cannot see this file,
// by construction – tests/wave5-psychologist-seat.test.ts §B proves it with a key counter rather
// than with this sentence.
//
// ⚠ DEPENDENCY DIRECTION, `masseur.ts`'s note asked of the second seat. `WorldState` is a TYPE-ONLY
// import (erased at compile time), so world.ts imports these values with no runtime cycle, and
// everything needed at runtime comes from SIBLING leaves – ledger, ladder, college, bookings,
// constants. The same four the masseur reaches for, and for the same reasons.
import { ECONOMY } from '../economy'
import { addEvent } from './ledger'
import { guardNotEnded } from './constants'
import { activeLadderOf } from './ladder'
import { inCollege } from './college'
import { vacationForWeek } from './bookings'
import type { WorldState } from '../world'

/** THE GATE, `masseurUnlocked`'s twin on the SAME one-way door (the travelling-team §2 ruled table:
 *  both seats unlock with the professional career). Her first counting W-series result makes the
 *  professional table her table – `activeLadderOf` reads the never-pruned mark – so the gate can
 *  never close again behind a layoff or a pruned window. Pure read, zero draws. */
export function psychologistUnlocked(world: WorldState): boolean {
  return activeLadderOf(world) === 'wta'
}

/** The refusal, written once – the staff card prints it and `hirePsychologist` throws it, so the
 *  disabled state and the refused click can never tell two stories (the R10-16 doctrine, and the
 *  masseur's own `MASSEUR_LOCKED_DETAIL` beside it). DRAFT (invariant 4). */
export const PSYCHOLOGIST_LOCKED_DETAIL =
  'A psychologist joins a professional operation – her first counting W-series result opens the door.'

/** The tag on a psychologist-change event – the coach's `COACH_CHANGE_KEY` pattern through the
 *  masseur's copy of it, week in the key so two changes can never collide. */
export const PSYCHOLOGIST_CHANGE_KEY = 'psychologist-since-'

/** THE HIRE, the coach's own shape through the masseur's: no signing fee, no notice period,
 *  effective from the next weekly bill, and firing must always be allowed – a family that cannot pay
 *  has to be able to stop paying.
 *
 *  ⚠ `guardNotEnded` FIRST, which is also the whole college rule for hiring: inside the freeze the
 *  latch throws `COLLEGE_FREEZE_REFUSAL` – the college sentence, not the ended one – and no second
 *  guard and no second sentence are built here. The existing string is the college's own and this
 *  wave does not write a new one for it.
 *
 *  ⚠⚠ FIRING KEEPS `psychologistFocus` AS A DEAD LETTER and that is deliberate (the brief's own
 *  rule, and `state.ts`'s note on the field): re-hiring mid-season resumes the year that was already
 *  started, and T3's once-a-season guard still refuses a CHANGE. A field cleared on fire would make
 *  «fire and re-hire» a free way round the season rule.
 *
 *  ZERO RNG on any stream – the flag is a boolean and the events draw nothing. */
export function hirePsychologist(world: WorldState, hire: boolean): void {
  // ⚠ W2-ENDINGS: the engine re-validates every command, because the worker is not the gate – a tab
  // left open behind the epilogue must not be able to spend money for a girl who has retired.
  guardNotEnded(world)
  if ((world.psychologistHired ?? false) === hire) return
  if (hire && !psychologistUnlocked(world)) throw new Error(PSYCHOLOGIST_LOCKED_DETAIL)
  world.psychologistHired = hire
  addEvent(world, {
    week: world.week,
    type: 'info',
    // The coach's own trick (COACH_CHANGE_KEY), kept and tagged, so "when did this arrangement
    // start" stays a read over the ledger rather than a persisted field. Bounded by construction –
    // one row per hire, and a career has a handful.
    keep: true,
    milestoneKey: `${PSYCHOLOGIST_CHANGE_KEY}${world.week}`,
    // ⚠ NO PRONOUN (R15-7's standing order). The masseur's own note explains why HIS copy may carry
    // one – "masseur" is the male word by its own grammar – and none of that transfers: a
    // psychologist is a psychologist whoever comes to the call, and the rung is literally about who
    // that is. DRAFTS, both lines (invariant 4).
    text: hire
      ? 'A psychologist is on the payroll now – one call a week, wherever she is.'
      : 'The psychologist is off the payroll – the calls stop at the end of the week.',
  })
}

/** THE RUNG SHE IS ON – the one lookup the bill and the card both read, so the two can never
 *  disagree about what the family is buying. `psychologistRung` is validated at its one writer
 *  (`setPsychologistRung`), but a hand-built probe world may hold anything, so an unknown value
 *  falls back to the default rung rather than to a crash – `masseurRungOf`'s own identity-element
 *  discipline, and the same `?? rungs[0]` tail behind it. Pure read, zero draws. */
export function psychologistRungOf(world: WorldState) {
  const rungs = ECONOMY.psychologist.rungs
  return (
    rungs[world.psychologistRung ?? ECONOMY.psychologist.defaultRung] ??
    rungs[ECONOMY.psychologist.defaultRung] ??
    rungs[0]
  )
}

/** WHAT A WEEK COSTS AT HER FAMILY'S CHOSEN RUNG – the retainer, flat, no multiply.
 *
 *  ⚠ AND THE ABSENCE OF THE MULTIPLY IS THE SPEC, not a simplification: the masseur's week is
 *  `sessions × perSessionCents` because his dial buys a busier calendar; this seat is ONE SESSION A
 *  WEEK AT EVERY RUNG and the rung buys who takes it, so the person's retainer IS the week. The
 *  card's quote is this ledger row. Zero draws. */
export function psychologistWeeklyCents(world: WorldState): number {
  return psychologistRungOf(world).salaryCents
}

/** THE ROSTER DIAL – which of the three comes to the call. The engine re-validates against
 *  `ECONOMY.psychologist.rungs`, so a stale screen cannot buy a person the market does not have.
 *
 *  ⚠ ALLOWED AT ANY TIME, the masseur dial's precedent taken deliberately: only the FOCUS is
 *  season-guarded (O1 – «в ближайший год» is about what he WORKS ON, not about who he is), and that
 *  guard is T3's. Works with or without a live hire – a choice recorded before the hire simply
 *  prices the card – but only a HIRED change writes a ledger line, because only then does the bill
 *  move. `guardNotEnded` FIRST: inside the college freeze this refuses with the college sentence,
 *  the same order `hirePsychologist` documents. ZERO draws on any stream. */
export function setPsychologistRung(world: WorldState, rung: number): void {
  guardNotEnded(world)
  const chosen = ECONOMY.psychologist.rungs[rung]
  if (!chosen || !Number.isInteger(rung)) {
    throw new Error('No such arrangement – the call is taken by a counsellor, a sport psychologist or a tour-grade specialist.')
  }
  if ((world.psychologistRung ?? ECONOMY.psychologist.defaultRung) === rung) return
  world.psychologistRung = rung as 0 | 1 | 2
  if (world.psychologistHired ?? false) {
    addEvent(world, {
      week: world.week,
      type: 'info',
      // The label, not a number: the price change is on the next weekly bill, which is the row that
      // may carry figures (the masseur's re-cut line, same rule). DRAFT.
      text: `The weekly call changes hands – ${chosen.label.toLowerCase()} from the next bill.`,
    })
  }
}

/** IS HE WORKING THIS WEEK – the one predicate the bill reads today, and the one every focus pass
 *  (T4-T7) will read tomorrow, so they can never disagree about whether he was there.
 *
 *  ⚠⚠ THE STAND-DOWN PAIR IS THE MASSEUR'S, MIRRORED AND NOT RE-DERIVED, which is the brief's own
 *  instruction: at COLLEGE the retainer is SUSPENDED, not cancelled – the family stops paying and
 *  the programme has her – and on a booked FAMILY HOLIDAY nobody takes the call, so nothing is
 *  billed and nothing is bought. In BOTH cases `psychologistHired` survives untouched and the seat
 *  comes back by itself when the stand-down ends; that is what «suspends, does not cancel» means and
 *  it is the half a test has to pin separately from the billing half.
 *
 *  ⚠ AND IT IS DELIBERATELY NOT `masseurWorksThisWeek` ITSELF, on that function's own argument: the
 *  two seats answer the same two questions about DIFFERENT people, and folding them would make one
 *  stand-down edit change both. A third stand-down added to either should be weighed for the other.
 *
 *  ⚠ THE MASSEUR'S THIRD NOTE DOES NOT TRANSFER AND THE DIFFERENCE IS WORTH THE LINE. His bill
 *  stands down on the week he BOARDS, because the fare replaced it (`pendingTournament.masseurThere`
 *  – the owner's «на неделе выезда по-матчевая цена заменяет недельную»). This seat never boards –
 *  ruling Б – so there is no such week and no such exception: the retainer runs on a tournament week
 *  exactly as the coach's does, which is the 08.08 rule («a weekly retainer does not stop being owed
 *  because she is away at an event») with nothing subtracted from it.
 *
 *  ⚠ AND HE WORKS THROUGH A LAYOFF, for the masseur's reason in its own key: an injury is when the
 *  head needs the call most, so it is deliberately NOT a stand-down. Pure state, zero draws. */
export function psychologistWorksThisWeek(world: WorldState): boolean {
  return psychologistWorksInWeek(
    world.psychologistHired ?? false,
    inCollege(world),
    vacationForWeek(world, world.week) !== undefined,
  )
}

/** THE SAME RULE, TAKING PRIMITIVES, SO THE SCREEN CAN ASK IT TOO – `masseurWorksInWeek`'s shape
 *  byte for byte, and its round-29 #3 story is the reason it exists in this form rather than only as
 *  the world-reading predicate above. That defect was a SCREEN that had re-spelled the engine's
 *  stand-downs and invented a fourth, charging a salary on a week it drew nobody («вы заплатили и не
 *  можете этого заметить» – the exact failure the travelling-team plan bans specialists for). The
 *  fix was to make both sides ask ONE predicate, and a seat that ships without the primitive form is
 *  a seat whose screen will eventually re-spell it.
 *
 *  ⚠ THE PARAMETER NAMES ARE THE MASSEUR'S (`frozen`, `bookedOff`) and not the brief's descriptive
 *  `inCollege` / `familyWeek`: `inCollege` is an imported FUNCTION in this module and a parameter of
 *  that name would shadow it. Same three booleans, same order, same answer.
 *
 *  Pure, zero draws. */
export function psychologistWorksInWeek(hired: boolean, frozen: boolean, bookedOff: boolean): boolean {
  return hired && !frozen && !bookedOff
}

/** WEEKLY SALARY (charged once per tick, in `resolveBodyAndPlanner` beside the masseur's row). A
 *  flat retainer per RUNG in cents, deliberately not a corridor draw and not jittered, so the line
 *  on the ledger is the number on the card, every week, and the player can read the deal he signed.
 *  Suspended weeks (college, family holiday) charge nothing and say nothing – the physio's and the
 *  masseur's own shape, and the card on screen T carries the standing fact.
 *
 *  ⚠ ONE ARM AND NOT TWO. `resolveMasseur` has a second early return for the week he boards; this
 *  function has no such week (see `psychologistWorksThisWeek`), so the predicate IS the whole gate.
 *
 *  ⚠ THE CATEGORY IS `'staff'`, the masseur's own – which is what puts the row inside the household
 *  strip's OUT figure with no other wiring at all (`snapshot.ts`'s promised seam: a staff salary
 *  «joins `outgoingCents` and NOTHING else has to move»).
 *
 *  ZERO draws on any stream. */
export function resolvePsychologist(world: WorldState): void {
  if (!psychologistWorksThisWeek(world)) return
  const cost = psychologistWeeklyCents(world)
  world.fundsCents -= cost
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'staff',
    // DRAFT (invariant 4) – the brief's own proposed row, and the masseur's row one seat over is
    // `Masseur – weekly salary`, so the two read as one payroll.
    text: 'Psychologist – weekly salary',
    amountCents: -cost,
  })
}
