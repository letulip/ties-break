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
// ⚠ THE SEASON'S LENGTH, AND IT IS THE CALENDAR'S OWN (round 43 #4). `season/calendar.ts` is a leaf
// with no runtime edge back into `world/` – `world/ledger.ts` reads the same constant for
// `seasonIndexOf`, which is the definition of «this season» every money surface is cut on.
import { WEEKS_PER_YEAR } from '../season/calendar'
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

// =================================================================================================
// ROUND 43 #4 – THE ANNUAL ASK (his 16.09 ruling, complete)
// =================================================================================================
//
// «Мы начинаем работать с массажистом по нашим текущим ценам, а дальше он приходит и просит
// прибавку, либо (так как альтернативы нет) добавить денег, но убавить количество процедур…
// может просить надбавок за свои часы ежегодно, может быть не так интенсивно как тренер.»
//
// ⭐⭐ IT ADDS NO NEW DIAL. The ask moves `perSessionCents` FOR THIS CAREER, once a year; the
// family's answer is the rung dial (2 / 4 / 7) that has been on the card since round 24 – pay more
// for the same hands, or hold the bill and drop a rung. Both branches are his own words.
//
// ⚠⚠ AND THERE IS NO THIRD «REFUSE» BRANCH, DELIBERATELY. «Альтернативы нет» means a refusal cannot
// mean «he leaves and you hire another», and a punishment with no counterplay contradicts his
// standing «мы ни за что не наказываем». Two branches, neither of them losing – the second one is
// free, it just buys fewer hours.
//
// ⚠⚠ THE DRIVER IS TIME SERVED AND NEVER HER RESULTS. The coach asks against a progress basket
// because DEVELOPING her is his job; the masseur MAINTAINS her, and his value is his hours. Letting
// him read her titles would make him a second coach AND charge her success twice – the exact
// double-count the chemistry wave's C13 had to damp.
//
// ⚠⚠ AND NOTHING IS PERSISTED FOR IT: `coachSinceWeek`'s own doctrine (world/coachMarket.ts – «the
// radar's weeks together, derived rather than stored: no schema bump, no migration, no golden
// save»). `hireMasseur` already writes ONE KEPT, TAGGED row per change of the arrangement
// (`MASSEUR_CHANGE_KEY`, the week in the key) and `pruneEvents` never touches a kept row, so the
// whole employment history is already in every save that has ever had a masseur in it.
//
// ⚠ RNG: STILL NOTHING HERE DRAWS. The drift is a deterministic function of weeks served, not a
// corridor and not a jitter – the file's own legibility rule («a salary is a negotiated number the
// player can read») held rather than broken, and the frozen MAIN capture still cannot see this file.

/** ⭐⭐ EVERY WEEK THE MASSEUR HAS BEEN ON THIS FAMILY'S PAYROLL, AS AT `week`.
 *
 *  ⚠⚠ IT IS THE SUM OF THE HIRED SPANS AND NOT «WEEKS SINCE THE FIRST HIRE», and the difference is
 *  the whole reason this walks the rows instead of taking a `max`. Weeks he was not employed are
 *  weeks he did not work, which is «his value is his hours» taken literally. It also closes the one
 *  exploit the design cannot survive: if the clock reset on a re-hire, a family could fire him for a
 *  single week and buy back the entry price – a THIRD branch, free, and strictly better than either
 *  of the two he named. Under the span sum a release costs the weeks it costs and resets nothing.
 *
 *  ⚠ THE ROWS ALTERNATE HIRE / RELEASE BY CONSTRUCTION, which is what makes the parity read sound:
 *  `hireMasseur` is the only writer of this tag, it returns before writing when the flag is not
 *  actually flipping, and `masseurHired` starts false – so the first tagged row of a career is
 *  always a hire, the second always a release, and so on.
 *
 *  ⚠ A HAND-BUILT PROBE WORLD with `masseurHired: true` and no tagged row reads as ZERO weeks
 *  served, not as a crash and not as «since week 0» – the identity element, which prices him at
 *  today's rate. That is the same courtesy `masseurRungOf` extends to an unknown rung.
 *
 *  ⚠ COLLEGE AND BOOKED FAMILY WEEKS COUNT. They suspend the BILL, not the arrangement
 *  (`masseurWorksThisWeek`'s own note: «suspends, does not cancel»), and the years he has been the
 *  family's masseur pass while she is at a university. Pure read over the ledger, zero draws. */
export function masseurWeeksServedAt(world: WorldState, week: number): number {
  const marks: number[] = []
  for (const e of world.events) {
    if (e.milestoneKey?.startsWith(MASSEUR_CHANGE_KEY) && e.week <= week) marks.push(e.week)
  }
  marks.sort((a, b) => a - b)
  let served = 0
  for (let i = 0; i < marks.length; i += 2) {
    // An odd tail is the span still running – it closes at the week being asked about.
    const until = i + 1 < marks.length ? marks[i + 1] : week
    served += Math.max(0, until - marks[i])
  }
  return served
}

/** ...as at today. The one form the bill, the card and the ask all read. */
export function masseurWeeksServed(world: WorldState): number {
  return masseurWeeksServedAt(world, world.week)
}

/** HOW MANY ANNUAL ASKS HE HAS EARNED – one per completed year on the payroll. `WEEKS_PER_YEAR` and
 *  not a private 52: the same season the Money screen's window and the wrap-up are cut on. */
export function masseurYearsServed(world: WorldState): number {
  return Math.floor(masseurWeeksServed(world) / WEEKS_PER_YEAR)
}

/** ⭐⭐⭐ WHAT ONE SESSION COSTS THIS FAMILY TODAY – `ECONOMY.masseur.perSessionCents` drifted by the
 *  years he has served them, and the ONE definition of his rate. The bill, the tour week, the rung
 *  prices on the card and the ask's own sentence all read it, so the four can never disagree.
 *
 *  ⚠ COMPOUNDING, because that is what a rise IS – each year's ask is against what he is paid now,
 *  not against what he was paid when he started. ⚠ AND ROUNDED TO WHOLE DOLLARS from the UNROUNDED
 *  power, never year-on-year from the rounded one: the house prices this seat in whole dollars
 *  (`75_00`), the card quotes `sessions × this`, and rounding once keeps the quote, the ledger row
 *  and the arithmetic a player can do in his head all the same number.
 *
 *  ⚠ THE INTENSITY IS MEASURED AGAINST THE COACH AND NOT AGAINST A MARKET (his «не так интенсивно
 *  как тренер», and round 43 #6 withdrew the item that asked for an outside figure): today's price
 *  IS the anchor and the mechanic is the drift away from it. See `ECONOMY.masseur.raisePerYear`.
 *
 *  Pure integer arithmetic over the ledger, zero draws on any stream. */
export function masseurSessionCents(world: WorldState): number {
  const drifted = ECONOMY.masseur.perSessionCents * (1 + ECONOMY.masseur.raisePerYear) ** masseurYearsServed(world)
  return Math.round(drifted / 100) * 100
}

/** IS THIS THE WEEK HE ASKS – the week his service count crosses a whole year.
 *
 *  ⚠⚠ IT ASKS LAST WEEK TOO, AND THAT SECOND READ IS NOT BELT-AND-BRACES. Without it the ask would
 *  fire a second time on a RE-HIRE week whose running total happened to already sit on a multiple of
 *  52: the count does not move on the week a span opens, so «divisible by 52» alone is true on that
 *  week as well as on the anniversary it already announced. The honest question is whether the
 *  counter INCREMENTED into a year this week. Pure, zero draws. */
export function masseurRaiseDue(world: WorldState): boolean {
  if (!(world.masseurHired ?? false)) return false
  const served = masseurWeeksServed(world)
  if (served <= 0 || served % WEEKS_PER_YEAR !== 0) return false
  return masseurWeeksServedAt(world, world.week - 1) === served - 1
}

/** ⭐ THE ASK ITSELF – one kept-free `info` row on the anniversary week, and nothing else moves.
 *  The new rate is already live (`masseurSessionCents` reads the same counter), so the row is a
 *  NOTICE of a bill that has changed rather than an offer the player has to accept: the decision he
 *  is being handed is the rung dial, which is where it already lives.
 *
 *  ⚠⚠ EVERY WORD BELOW IS A **DRAFT** (invariant 4). The two branches are his design; the sentences
 *  are the build's and are in the handoff verbatim for his pass.
 *  ⚠ IT MAY CARRY THE FIGURE, unlike `masseurRoomNote`: this is the row whose whole job is the new
 *  price, and `setMasseurSessions` records the same split («the price change is on the next weekly
 *  bill, which is the row that may carry figures»).
 *  ⚠ NO MASCULINE PRONOUN IN EITHER LINE, which is R15-7's standing order and NOT covered by this
 *  file's «the pronoun is safe here» note beside `hireMasseur`: that note is about the NOUN, and
 *  `tests/coach-voice.test.ts` bans `he`/`his`/`him` from every engine literal a player can read.
 *  The first draft of the bottom-rung line said «to drop him to» and went red there, which is the
 *  guard doing exactly its job.
 *
 *  ⚠ AND THE SECOND SENTENCE TELLS THE TRUTH AT THE BOTTOM RUNG. A family already on two sessions a
 *  week has no rung to drop to, and a line offering one would be the screen lying about a choice –
 *  this round's own #5 is about exactly that failure one tab over.
 *
 *  Called from `world/phaseHerWeek.ts` immediately BEFORE `resolveMasseur`, so the week the ask
 *  lands is the week the new bill is charged and the ledger reads in the order it happened.
 *  ZERO draws on any stream. */
export function resolveMasseurRaise(world: WorldState): void {
  if (!masseurRaiseDue(world)) return
  const rate = masseurSessionCents(world)
  const bottom = masseurRungOf(world).sessions === ECONOMY.masseur.rungs[0].sessions
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: bottom
      ? `The masseur asks for more – ${dollars(rate)} a session from this week. There is no shorter week to drop to.`
      : `The masseur asks for more – ${dollars(rate)} a session from this week. The same hands at a higher bill, or the same bill for fewer visits.`,
  })
}

/** Whole dollars for the one row that quotes his rate. ⚠ NOT a formatter import: `shared/money.ts`
 *  is the UI's, and an engine leaf may not reach for it (invariant 1). The rate is rounded to whole
 *  dollars at its source, so there are never cents to lose here. */
function dollars(cents: number): string {
  return `$${Math.round(cents / 100)}`
}

/** WHAT A WEEK COSTS AT HER FAMILY'S CHOSEN RUNG – sessions × the professional session rate, flat.
 *  The coach's own shape (`coachWeeklyCents` = rate × hours), asked of a second seat: the rung is
 *  chosen, the bill is flat per rung, and the card's quote IS the ledger's row. Zero draws.
 *  ⭐ ROUND 43 #4 – THE RATE IS THE CAREER'S OWN NOW (`masseurSessionCents`) rather than the
 *  constant. Flat still means flat: no corridor, no jitter, no draw – it is simply a number that
 *  has been renegotiated once a year, which is the whole of his ruling. */
export function masseurWeeklyCents(world: WorldState): number {
  return masseurRungOf(world).sessions * masseurSessionCents(world)
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
  return masseurWorksInWeek(world.masseurHired ?? false, inCollege(world), vacationForWeek(world, world.week) !== undefined)
}

/** ⭐⭐ ROUND 29 #3 – THE SAME RULE, TAKING PRIMITIVES, SO THE SCREEN CAN ASK IT TOO.
 *
 *  ⚠⚠ THIS EXISTS BECAUSE THE SCREEN HAD INVENTED A FOURTH STAND-DOWN THE ENGINE DOES NOT HOLD.
 *  `composables/weekDays.ts` re-spelled the three refusals above and added `&& !shooting`, so a
 *  shoot week CHARGED the salary (`resolveMasseur` reads the predicate above, which knows nothing
 *  about a shoot) and DREW none of his days – «вы заплатили и не можете этого заметить», the exact
 *  failure the travelling-team plan bans specialists for, written fifteen lines above the bug in
 *  that same file. The owner found it from first principles: «Если есть турнир или тренировки, то
 *  есть и массажист.» A shoot takes her FREE days and leaves her training days alone
 *  (`shootDaysFor`), so a shoot week has training in it, and therefore has him in it.
 *
 *  ⚠ THE FIX RUNS IN THE ENGINE'S DIRECTION, NOT THE SCREEN'S. The bill is CORRECT; what was wrong
 *  was the drawing, so `shooting` is not added here to make the two agree – the fourth term is
 *  deleted from the screen and the screen asks this instead.
 *
 *  ⚠ IT TAKES PRIMITIVES FOR `spanWorthOffering`'s OWN REASON (world/multiWeek.ts spells it out at
 *  length): the shell holds a `Snapshot`, never a `WorldState`, and it draws OTHER weeks than the
 *  current one, so a predicate keyed on `world.week` could not answer its question at all. Both
 *  sides hand it what they hold and they agree BY CONSTRUCTION rather than by inspection –
 *  `tests/component/round29-masseur-parity.test.ts` asserts it week by week rather than taking this
 *  paragraph's word for it. Pure, zero draws. */
export function masseurWorksInWeek(hired: boolean, frozen: boolean, bookedOff: boolean): boolean {
  return hired && !frozen && !bookedOff
}

/** ⭐⭐⭐ ROUND 34 #21 – THE WEEKS HIS HANDS WILL TAKE OFF THE LAYOFF SHE IS IN, counted NOW.
 *
 *  The owner: «С массажистом она выздоровела быстрее после травмы, а с турнира была снята тем не
 *  менее и теперь на турнир не зайти, надо учитывать наличие массажиста при автоматической отмене
 *  событий.»
 *
 *  ⚠⚠ THE DEFECT WAS AN ORDERING, AND THIS FUNCTION EXISTS TO CORRECT IT RATHER THAN TO EXEMPT HIM.
 *  `onsetInjury` applies the PHYSIO's shortening to `weeksOut` before it writes `world.injury`, and
 *  then sweeps the entries the layoff swallows – so the physio is inside the withdrawal decision. The
 *  masseur's shortening is paid out week by week in `rollInjury`, i.e. AFTER that sweep has already
 *  run, so the desk cancelled her tournaments against a return date only a girl with no masseur would
 *  ever have had. MEASURED at onset, the date the sweep read against the date she actually keeps:
 *  twice a week 1-3 weeks late, every other day 1-4, daily 1-6 (a 12-week layoff read as twelve and
 *  ran six). Every week of that gap is an entry pulled for a week she is fit.
 *
 *  ⚠ IT IS THE SAME CADENCE `rollInjury` RUNS, REPLAYED FORWARD, and it has to stay that way: the
 *  guard (`totalWeeks > 2` – nobody massages a one-week soreness away), the rung's N, the
 *  `weeksRemaining > 0` check that refuses to buy a week off a layoff already ending, and the two
 *  stand-downs. The loop below is that loop with the ledger writes removed.
 *
 *  ⚠ AND IT WALKS THE FUTURE'S OWN STAND-DOWNS rather than assuming this week's answer holds. A
 *  family holiday booked inside the layoff buys nothing that week and the college freeze suspends him
 *  outright, so `masseurWorksInWeek` is asked per week – the college half inlined exactly as
 *  `adShootHolds` inlines it (world/medical.ts), because `inCollege` can only answer about today.
 *
 *  ⚠ A FORECAST, AND ONLY EVER USED WHERE A FORECAST IS THE RIGHT INSTRUMENT. It can be wrong – the
 *  parent may fire him, or drop him to a cheaper rung, mid-layoff – which is exactly why the visible
 *  countdown is NOT rewritten from it: `weeksRemaining` stays the clinic's number and his weeks keep
 *  arriving one receipt at a time, because that is the product («recovery you can watch»). What it
 *  governs is the one decision that cannot be taken back later: cancelling an entry whose list then
 *  closes. Erring by keeping an entry is recoverable (`cancelEntry` is still there); erring by
 *  cancelling one is what the owner is reporting.
 *
 *  ⚠⚠ ROUND 41 #19 WIDENS «ONLY EVER USED WHERE» BY EXACTLY ONE SURFACE, at the owner's ask (12.09:
 *  «мне написали, что травма отнимет 7 недель, а в итогах года было 4 недели … можно писать сколько
 *  реально займет восстановление с текущим тиром массажиста»). `toSnapshot` now spends this function
 *  on `Snapshot.injury.expectedWeeks`, so the injury dialog can print the honest pair at ANNOUNCEMENT
 *  – the clinic's number, and his. The clause above that the countdown is not rewritten from it still
 *  holds word for word: `weeksRemaining` is untouched and every «bought a week back» receipt still
 *  arrives. A forecast SHOWN as a forecast, on the one week the parent plans against, is a third
 *  place a forecast is the right instrument; it is not the field, and it never becomes the field.
 *
 *  Pure arithmetic over persisted state, ZERO draws on any stream. 0 for every career without a
 *  masseur, without an injury, or with a layoff too short for the cadence to touch. */
export function masseurRehabWeeksAhead(world: WorldState): number {
  const injury = world.injury
  if (injury === null || !(world.masseurHired ?? false) || injury.totalWeeks <= 2) return 0
  const everyN = masseurRungOf(world).rehabExtraEveryNWeeks
  let remaining = injury.weeksRemaining
  let saved = 0
  for (let week = world.week + 1; remaining > 0; week++) {
    remaining -= 1
    const rehabWeek = week - injury.sinceWeek
    const frozen = world.college !== null && week < world.college.untilWeek
    if (
      remaining > 0 &&
      rehabWeek > 0 &&
      rehabWeek % everyN === 0 &&
      masseurWorksInWeek(true, frozen, vacationForWeek(world, week) !== undefined)
    ) {
      remaining -= 1
      saved += 1
    }
  }
  return saved
}

/** ⭐ WHAT A TOUR WEEK COSTS (owner 22.08: «на неделе выезда по-матчевая цена заменяет
 *  недельную») – matches played × the professional session rate, the same rate every rung's home
 *  week is built from. The draw table prices itself: at the opening $75 a Slam title week is 7
 *  matches = $525 – exactly the daily rung's home week – a wta1000 up to 6 ($450), a 32-draw up to
 *  5 ($375), and a first-round exit is one session's worth ($75). Billed at `finalizeTournament`,
 *  where the matches are known; the weekly rung bill stands down for that week (see
 *  `resolveMasseur`).
 *
 *  ⚠ IT TAKES THE RATE RATHER THAN READING `ECONOMY` (round 43 #4), for `masseurWorksInWeek`'s own
 *  reason one function up: the caller holds the world, this does not, and a second reader of the
 *  constant would be a tour week still billed at the price the family stopped paying a year ago.
 *  The four figures above are the OPENING table and drift with `masseurSessionCents`.
 *  Pure integer arithmetic, zero draws. */
export function masseurTourWeekCents(matchesPlayed: number, sessionCents: number): number {
  return Math.max(0, matchesPlayed) * sessionCents
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
