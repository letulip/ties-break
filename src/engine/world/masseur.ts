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
// ⭐ STEP 2 (owner, round 24): THE DIAL AND THE SEAT. The flat $150 contract became a three-rung
// sessions-per-week dial (`ECONOMY.masseur.rungs` – the owner's own idea, «настройки сколько раз в
// неделю он дает свои услуги»), priced per session at a professional's rate; and he TRAVELS now,
// through `coachTravelFareFor`'s own price rule asked for one more seat (`masseurTravelFareFor` in
// sponsors.ts – the same `staffSeatFareCents`, never a second implementation). What the fare buys
// is `masseurTourRelief` below: recovery between rounds, scaled by the depth of the run.
//
// ⚠ RNG: NOTHING HERE DRAWS, on any stream. The salary is a flat contract per rung (deliberately
// not a corridor draw – a salary is a negotiated number the player can read, unlike the physio's
// per-session band), the hire, the rung and the travel stance are plain state, and the rehab
// acceleration in injury.ts is a deterministic cadence off (week − sinceWeek). The frozen MAIN
// capture (41550 / e6b0c709) cannot see this file, by construction.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. Everything needed at runtime comes from SIBLING
// leaves – ledger, ladder, college, bookings, constants. Deliberately NOT from coachMarket.ts:
// importing it here would close a runtime cycle through endings → entries → medical → this file.
import { ECONOMY } from '../economy'
import { clamp } from '../condition'
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

/** THE RUNG SHE IS ON – the one lookup the bill, the cadence and the condition bonus all read, so
 *  the three can never disagree about what the family is buying. `masseurSessionsPerWeek` is
 *  validated at the one writer (`setMasseurSessions`), but a hand-built probe world may hold
 *  anything, so an unknown value falls back to the default rung rather than to a crash – the same
 *  identity-element discipline `kit ?? null` uses. Pure read, zero draws. */
export function masseurRungOf(world: WorldState) {
  const rungs = ECONOMY.masseur.rungs
  return (
    rungs.find((r) => r.sessions === (world.masseurSessionsPerWeek ?? ECONOMY.masseur.defaultSessions)) ??
    rungs.find((r) => r.sessions === ECONOMY.masseur.defaultSessions) ??
    rungs[0]
  )
}

/** WHAT A WEEK COSTS AT HER FAMILY'S CHOSEN RUNG – sessions × the professional session rate, flat.
 *  The coach's own shape (`coachWeeklyCents` = rate × hours), asked of a second seat: the rung is
 *  chosen, the bill is flat per rung, and the card's quote IS the ledger's row. Zero draws. */
export function masseurWeeklyCents(world: WorldState): number {
  return masseurRungOf(world).sessions * ECONOMY.masseur.perSessionCents
}

/** THE DIAL (owner, round 24: «настройки сколько раз в неделю он дает свои услуги»). Sets the
 *  sessions-per-week rung; the engine re-validates against `ECONOMY.masseur.rungs`, so a stale
 *  screen cannot buy an arrangement the market does not sell. Works with or without a live hire –
 *  a stance recorded before the hire simply prices the card – but only a HIRED change writes a
 *  ledger line, because only then does the bill move. `guardNotEnded` FIRST: inside the college
 *  freeze this refuses with the college sentence, the same order `hireMasseur` documents.
 *  ZERO draws on any stream. */
export function setMasseurSessions(world: WorldState, sessions: number): void {
  guardNotEnded(world)
  const rung = ECONOMY.masseur.rungs.find((r) => r.sessions === sessions)
  if (!rung) throw new Error('No such arrangement – the masseur works twice a week, every other day, or daily.')
  if ((world.masseurSessionsPerWeek ?? ECONOMY.masseur.defaultSessions) === sessions) return
  world.masseurSessionsPerWeek = sessions
  if (world.masseurHired ?? false) {
    addEvent(world, {
      week: world.week,
      type: 'info',
      // The label, not a number: the price change is on the next weekly bill, which is the row
      // that may carry figures. Gender-free by construction (R15-7's standing order).
      text: `The masseur's week is re-cut – ${rung.label.toLowerCase()} on the table from the next bill.`,
    })
  }
}

/** THE TRAVEL STANCE – the coach's `setCoachOnEventWeeks`, asked of the second seat (the plan's
 *  ruling Б: «массажист ездит»). Default OFF, the owner's own framing for the coach: the automatic
 *  behaviour is that competition weeks are not staff weeks, and the switch is what adds the seat.
 *  The fare itself is `masseurTravelFareFor` (sponsors.ts – the coach's price rule, one more
 *  seat), charged in the play arm beside the coach's; what it buys is `masseurTourRelief` below.
 *  ZERO draws on any stream. */
export function setMasseurTravels(world: WorldState, on: boolean): void {
  guardNotEnded(world)
  if ((world.masseurTravels ?? false) === on) return
  world.masseurTravels = on
  if (world.masseurHired ?? false) {
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: on
        ? 'The masseur travels to tournaments now – one more fare on every trip, and table work between rounds.'
        : 'The masseur stays home on tournament weeks – the table waits for her return.',
    })
  }
}

/** ⭐ WHAT THE FARE BUYS (the owner's deep-run question, «влияет ли он на восстановление на
 *  глубоких играх»): the relief taken off a committed run's strain at `finalizeTournament`, when
 *  the masseur actually made the trip (`pendingTournament.masseurThere` – recorded in the same arm
 *  that charged the fare, so the effect and the bill can never disagree about the week).
 *
 *  PER NIGHT BETWEEN ROUNDS – × (matches − 1) – which is what makes it the owner's question
 *  answered rather than a flat discount: a first-round exit has no nights between rounds and buys
 *  NOTHING (honest – the fare was insurance she did not need that week), a deep run has the most.
 *  Capped at the strain itself: hands cannot make a week restful, only less expensive.
 *
 *  Pure integer arithmetic, zero draws on any stream. */
export function masseurTourRelief(matchesPlayed: number, strain: number, masseurThere: boolean): number {
  if (!masseurThere) return 0
  return Math.min(Math.max(0, strain), ECONOMY.masseur.tourRecoveryPerRound * Math.max(0, matchesPlayed - 1))
}

/** IS HE WORKING THIS WEEK – the one predicate the bill, the condition bonus and the rehab
 *  acceleration all read, so the three can never disagree about whether he was there.
 *
 *  The two stand-downs are the COACH'S OWN PRECEDENT (`coachWorksThisWeek`), asked of
 *  a second seat: at COLLEGE the retainer is SUSPENDED, not cancelled – the family stops paying
 *  and the programme has her body, but the hire survives the freeze and resumes with the tour –
 *  and on a booked FAMILY HOLIDAY nobody is on his table, so nothing is billed and nothing is
 *  bought. It is deliberately not `coachWorksThisWeek` itself: the two seats answer the same two
 *  questions about DIFFERENT people, and folding them would make one stand-down edit change both.
 *  ⚠ THE REASON RECORDED HERE UNTIL R2-10 STEP 2 WAS A DIFFERENT ONE AND IS NO LONGER TRUE – it
 *  read "that lives in world.ts, which a leaf may not import at runtime". `coachWorksThisWeek`
 *  moved to `world/phaseFinance.ts` with the bill that is its first reader, so a leaf CAN reach it
 *  now; the separation above is the reason it stays two predicates. Same two questions, second
 *  person; a third stand-down added to either should be weighed for the other (see the note beside
 *  `coachWorksThisWeek`).
 *
 *  ⚠ AND HE WORKS THROUGH A LAYOFF – that is when the salary earns hardest (the rehab room is
 *  his), so an injury is deliberately NOT a stand-down. Pure state, zero draws. */
export function masseurWorksThisWeek(world: WorldState): boolean {
  if (!(world.masseurHired ?? false)) return false
  if (inCollege(world)) return false
  return vacationForWeek(world, world.week) === undefined
}

/** ⭐ WHAT A TOUR WEEK COSTS (owner 22.08: «на неделе выезда по-матчевая цена заменяет
 *  недельную») – matches played × the professional session rate, the same $75 every rung's home
 *  week is built from. The draw table prices itself: a Slam title week is 7 matches = $525 –
 *  exactly the daily rung's home week – a wta1000 up to 6 ($450), a 32-draw up to 5 ($375), and a
 *  first-round exit is one session's worth ($75). Billed at `finalizeTournament`, where the
 *  matches are known; the weekly rung bill stands down for that week (see `resolveMasseur`).
 *  Pure integer arithmetic, zero draws. */
export function masseurTourWeekCents(matchesPlayed: number): number {
  return Math.max(0, matchesPlayed) * ECONOMY.masseur.perSessionCents
}

/** WEEKLY SALARY (charged once per tick, after the play arm has decided the week's shape). A flat
 *  contract per RUNG in cents – sessions × the professional session rate, deliberately not a
 *  corridor draw and not jittered, so the line on the ledger is the number on the card, every
 *  week, and the player can read the deal he signed. Suspended weeks (college, family holiday)
 *  charge nothing and say nothing: the physio's own shape, and the card on screen T carries the
 *  standing fact. The retainer RUNS on a tournament week he STAYS HOME from – the coach's own
 *  08.08 rule: a weekly retainer does not stop being owed because she is away at an event.
 *
 *  ⭐ EXCEPT THE WEEK HE BOARDS (owner 22.08: «на неделе выезда по-матчевая цена заменяет
 *  недельную»): when the fare was charged this very tick, the play arm has recorded
 *  `pendingTournament.masseurThere` – the round-21 #2 "asked once, carried" doctrine, the same
 *  fact the tour relief reads – and the weekly bill STANDS DOWN: `finalizeTournament` bills
 *  matches played × the session rate instead (`masseurTourWeekCents`). One decision about one
 *  week, read where it was written; a stale pending cannot reach here because `advanceWeeks`
 *  refuses to tick past an open reveal. ZERO draws on any stream. */
export function resolveMasseur(world: WorldState): void {
  if (!masseurWorksThisWeek(world)) return
  const p = world.pendingTournament
  if (p !== null && !p.finished && (p.masseurThere ?? false)) return
  const cost = masseurWeeklyCents(world)
  world.fundsCents -= cost
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'staff',
    text: 'Masseur – weekly salary',
    amountCents: -cost,
  })
}

/** ⭐ THE RETURN-WEEK SESSION (owner 22.08: «довесить послетурнирное восстановление 1 сеанс
 *  массажа по возвращении»). `finalizeTournament` marks the debt – `world.masseurReturnDue` – when
 *  a hired masseur was NOT flown to the run (`!pendingTournament.masseurThere`: he waited at
 *  home); this settles it on the FIRST non-played week after, one extra session's worth of
 *  recovery (`ECONOMY.masseur.returnSessionBonus`) with its own receipt.
 *
 *  THE RULES, each one sentence: a played week postpones it (back-to-back trips – she is not home
 *  yet); the moment passes WHEN SHE RETURNS, so the mark is cleared on that first home week
 *  whether or not he still works it (released, or the family away on a booked week: no table, no
 *  session, no receipt – and no debt carried to some later hire); a run he was FLOWN to never
 *  writes the mark, because the between-rounds relief was that week's work (`masseurTourRelief`).
 *
 *  Called by `tickWeek` beside `resolveMasseur`. Integer, clamped, ZERO draws on any stream. */
export function resolveMasseurReturn(world: WorldState, playedThisWeek: boolean): void {
  if (playedThisWeek) return
  if (world.masseurReturnDue === undefined || world.masseurReturnDue === null) return
  // The mark comes OFF the world, not onto `undefined`: a serialised save never carries a spent
  // debt, and the per-key freeze tooling never meets a key that means nothing.
  delete world.masseurReturnDue
  if (!masseurWorksThisWeek(world)) return
  world.condition = clamp(
    world.condition + ECONOMY.masseur.returnSessionBonus,
    ECONOMY.condition.min,
    ECONOMY.condition.max,
  )
  addEvent(world, {
    week: world.week,
    type: 'info',
    // No digits, no pronoun for the masseur (R15-7), short dash – the receipt idiom of the house.
    text: 'Back from the tour – an extra session on the table works the trip out of her legs.',
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
 *   2. a layoff is running with no week bought yet – the rehab is in professional hands;
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
      : // ⚠ CADENCE-NEUTRAL SINCE THE DIAL: the old line said «twice a day», which the twice-a-week
        // rung would make a lie on its own card. The verdict survives; the schedule left it.
        'On the table through the layoff – the rehab is in professional hands.'
  }
  const recentSave = world.injuryHistory.some(
    (h) => (h.weeksSaved ?? 0) > 0 && h.week >= world.week - MASSEUR_NOTE_WINDOW_WEEKS,
  )
  if (recentSave) return 'Weeks bought back – the last layoff ended sooner than it should have.'
  return 'Fresh legs – the weekly table work keeps her body ahead of the grind.'
}
