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
//
// ⚠ T3 ADDS FIVE IMPORTS AND NO NEW ARROW INTO THIS FILE, which is worth one line because the year's
// focus is the first thing here that reads anything about HER. `bondBandOf` (the consent band),
// `kidAgeExact` (the joint-choice age), `isOffSeasonWeek` (the off-season window) and
// `seasonIndexOf` (the season arithmetic) are all leaves `spirit.ts` already reaches for in exactly
// this combination, so the direction of every arrow is unchanged: sideways, into leaves, never back
// into `world.ts`.
//
// ⚠⚠ AND IT IS `isOffSeasonWeek` RATHER THAN `isBlackoutWeek`, WHICH IS T3b's FIRST EDIT (ruling I,
// problem 1). T3 took the wider predicate from its brief; `isBlackoutWeek` is the off-season OR an
// exam fortnight while school is not over, and the professional unlock can precede school's end
// (`TIERS.w15.minAgeYears` is 14 in `season/calendar.ts`, while `kidLife.ts`'s `schoolEndWeek`
// lands at 18.0-19.0 for every birth month the game can generate). A still-at-school
// professional therefore got a SECOND change window in June – mid-season switching, which is
// exactly what O1 forbids. The window is the TRUE off-season and nothing else, which also retires
// the `schoolIsOver` plumbing the wider predicate needed: this file no longer imports `../kidLife`
// at all.
import { ECONOMY } from '../economy'
import { addEvent, seasonIndexOf } from './ledger'
import { guardNotEnded } from './constants'
import { activeLadderOf } from './ladder'
import { inCollege } from './college'
import { vacationForWeek } from './bookings'
import { kidAgeExact } from './age'
import { bondBandOf } from '../spirit'
import { isOffSeasonWeek } from '../season/calendar'
import type { PsyFocus } from './state'
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
 *  masseur's own `MASSEUR_LOCKED_DETAIL` beside it).
 *
 *  ⭐⭐ NOT A DRAFT ANY MORE – HIS, FROM THE 17.09 SHEET. It read «A psychologist joins a professional
 *  operation – her first counting W-series result opens the door» and the sheet strikes that phrase;
 *  the shape that replaced it is `SPARRING_LOCKED_DETAIL`'s, which is the unlock he wrote himself for
 *  this exact meaning one seat over. So the three seats open with one sentence each in one shape. */
export const PSYCHOLOGIST_LOCKED_DETAIL =
  'Her first counting W-series result opens a place for a psychologist.'

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
    // that is. ⭐⭐ BOTH LINES ARE HIS SINCE THE 17.09 SHEET – «on the payroll» / «off the payroll»
    // became JOINS THE TEAM and LEAVES THE TEAM, the hitting partner's own pair asked of this seat.
    text: hire
      ? 'A psychologist joins the team – one call a week, wherever she is.'
      : 'The psychologist leaves the team – the calls stop at the end of the week.',
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

/** ⭐⭐ THE RUNG HE IS WORKING **THIS** FOCUS AT THIS WEEK, or `undefined` when he is not working it
 *  at all – not hired, hired for a different year, or stood down. The three questions a focus pass
 *  has to ask, answered once, in the file that owns all three of their answers (v76 T5).
 *
 *  ⚠⚠ THE WORKING WEEK IS THE BILLING WEEK – the architect's ruling J, and the same predicate
 *  `resolvePsychologist` opens with, so a college freeze and a booked family week stand the WORK down
 *  exactly as they stand the INVOICE down. Pay nothing, receive nothing; and the flag survives both,
 *  so the work resumes by itself the first week after. A focus pass that spelled
 *  `psychologistHired && focus === …` instead would be T4's own defect, corrected one commit later.
 *
 *  ⚠ THE `??` FALLBACK IS `psychologistRungOf`'s, MIRRORED for exactly its reason: the rung is
 *  validated at its one writer (`setPsychologistRung`), but a hand-built probe world may hold
 *  anything, so an unknown value reads as the DEFAULT rung rather than poisoning a reader's
 *  arithmetic. ⚠ And `undefined` here means ONE thing – «he is not working this focus» – which is why
 *  a missing rung falls back rather than returning `undefined` and silently switching the effect off.
 *
 *  ⚠ WHY THIS LIVES HERE AND `recoverySlopeFor` DOES NOT. `spirit.ts` cannot import this file – the
 *  cycle ruling J measured – so T4's focus had to re-spell the rung read in its own module; T5's
 *  caller (`world/phaseGrowth.ts`) reaches this file by zero paths and can simply ask. One home for
 *  the answer wherever the graph allows one. Pure read, ZERO draws. */
export function psychologistWorkingRung(world: WorldState, focus: PsyFocus): 0 | 1 | 2 | undefined {
  if (!psychologistWorksThisWeek(world)) return undefined
  if ((world.psychologistFocus ?? null) !== focus) return undefined
  return world.psychologistRung ?? ECONOMY.psychologist.defaultRung
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

// =================================================================================================
// THE YEAR-FOCUS (wave 5 T3) – WHAT THE SEAT IS WORKING ON, CHOSEN ONE YEAR AT A TIME
// =================================================================================================
//
// ⭐⭐ THE RECONCILIATION THIS WHOLE SEAT IS BUILT ON, in the spec's own sentence
// (`docs/specs/the-psychologists-year-2026-09.md` §1): «THE YEAR-FOCUS is the choice of channel; the
// RUNG is how well the chosen work goes». The rung dial above buys WHO takes the call; this buys what
// the call is FOR. Everything the four focuses actually DO is T4-T7 – T3 is the decision, its
// refusals and the row that shows them.
//
// ⚠⚠ AND THE DECISION IS THE PARENT'S STAFFING DECISION, NOT A LIFE BEAT. Named here so nobody adds
// them later: a pick writes NO `lifeLog` row (the wave brief's own rule – it is not something that
// happened to her), NO bond delta of any kind (the pick is not a parenting act and the price list is
// universal), NO money beyond the retainer that is already running, and NO feed row at all. The
// hire and the rung change write ledger lines because the BILL moves; nothing about the bill moves
// here, and the standing legibility law is answered by each focus's own receipt as it lands (T4's
// clear line, T5's growth, T6's wording), never by a line announcing an intention.

/** ⭐ THE FIVE, IN THE ORDER THE CARD RENDERS THEM (four at v76; `'publicLife'` APPENDED LAST by
 *  v77's T5). A list rather than a re-typed union so the engine, the wire and the screen iterate ONE
 *  order. ⚠ It is also the id re-validation list: `setPsychologistFocus` refuses anything not in it,
 *  the roster dial's own discipline one function up.
 *
 *  ⚠⚠ AND THIS LINE IS THE ONE THE COMPILER WILL **NOT** DEFEND – the architect's RULING O, measured
 *  14.09, and the sentence v76 wrote here («a compile error here and not a silently missing option»)
 *  was FALSE and is struck. `Record<PsyFocus, …>` below is total and really does go red when the type
 *  widens; this is a `readonly PsyFocus[]`, and **an array of four is a perfectly valid array of a
 *  five-member union**. Left at four, a new focus would have a type, a label and a line and would
 *  never be OFFERED: absent from the seat's iteration, from `psychologistFocusOpen`'s filter, from
 *  `setPsychologistFocus`'s id list and from the string tests that read their corpus off this very
 *  array. Nothing would go red.
 *
 *  ⚠⚠ SO THE GUARD IS A TEST AND IT IS A **MEMBERSHIP** GUARD, NOT A COUNT. Wave 5 left the tripwire
 *  (`tests/wave5-psychologist-focus.test.ts` §A, whose message named this wave); T5 re-aimed it to
 *  `[...PSY_FOCUSES].sort()` against `Object.keys(PSY_FOCUS_LABEL).sort()` – total by construction,
 *  because the compiler already holds the complete list of the union in the type-forced Record. A
 *  length is not a membership: five entries with a duplicate pass `toBe(5)`. A SIXTH focus therefore
 *  goes red the day it is forgotten here. */
export const PSY_FOCUSES: readonly PsyFocus[] = ['coolhead', 'recovery', 'listen', 'herself', 'publicLife']

/** The five names, DRAFTS (invariant 4) – the spec §2's own working names, which the wave brief
 *  names as the base for the вычитка. ⚠ `publicLife` is the spec §2's fifth row read verbatim («The
 *  public life») and is T8's to move. */
export const PSY_FOCUS_LABEL: Record<PsyFocus, string> = {
  coolhead: 'Cool head',
  recovery: 'Back on her feet',
  listen: 'Learning to listen',
  herself: 'Working on herself',
  publicLife: 'The public life',
}

/** ...and what each year is FOR, one line each, DRAFTS.
 *
 *  ⚠ THEY SAY WHAT THE WORK IS AIMED AT AND NEVER WHAT IT HAS ACHIEVED, which is the card's standing
 *  rule one block up («a hired line boasting today would be "вы заплатили и не можете этого
 *  заметить" written the other way round»): the effects arrive with T4-T7 and each brings its own
 *  receipt. ⚠ `listen` is written as the PARENT's year deliberately – the 09.09 re-cut: the seat
 *  coaches you and never reports her sessions.
 *
 *  ⚠⚠ AND EVERY ONE OF THEM HAS TO READ IN **TWO** FRAMES SINCE THE OWNER'S Q9 RULING (14.09):
 *  alone, as the focus row's own note, AND SPLICED – `SupportStaffTab.vue` composes the hired card's
 *  line as «On retainer – » + this sentence with its first letter lowered, which is the surface that
 *  is on screen all 52 weeks rather than the ~3 the change window is open. So the shape is load-
 *  bearing and not a habit: each line opens «The year goes on …», which lowers cleanly to «…the year
 *  goes on …» and reads as one sentence after the dash. A line opening on a proper noun, a figure or
 *  a quotation mark would splice into nonsense, and no test would say so in words. ⚠ v77's T5 wrote
 *  `publicLife` to that shape deliberately and pins BOTH frames
 *  (`tests/wave6-spotlight-focus.test.ts` §B, plus the mounted splice case in
 *  tests/component/psychologist-card.test.ts). DRAFT, like its four siblings – T8 and the вычитка own
 *  the words. */
export const PSY_FOCUS_LINE: Record<PsyFocus, string> = {
  coolhead: 'The year goes on the big points – the head she takes into them.',
  recovery: 'The year goes on the weeks after something breaks – the walk back up.',
  listen: 'The year goes on your own ear for her – the sessions themselves stay hers.',
  herself: 'The year goes on the things she never says out loud – and she has to want it.',
  publicLife: 'The year goes on the weeks under the cameras – and what being looked at takes out of her.',
}

/** The stale-screen refusal: a year of work with nobody to work it. ⭐ HIS SINCE THE 17.09 SHEET –
 *  «somebody on the payroll first» became «somebody on the team first», the one word the sheet moves
 *  in this sentence. */
export const PSYCHOLOGIST_FOCUS_UNHIRED_REFUSAL =
  'Nobody is taking the call – a year of work needs somebody on the team first.'

/** The roster refusal's twin for the focus id – `setPsychologistRung`'s own shape, so a stale screen
 *  can no more invent a year than it can invent a specialist. DRAFT.
 *
 *  ⚠⚠ IT SAID «FOUR» WHILE THE ROSTER HELD FIVE, AND THE ARCHITECT'S **RULING S** (14.09) TOOK THE
 *  COUNT OUT RATHER THAN BUMPING IT – v77's T8 landing it. T5 flagged the false sentence and did not
 *  touch it, which was right; the ruling is what licenses the edit, and it turns on TWO facts and not
 *  on taste. First, reachability: this is thrown by `setPsychologistFocus` only when
 *  `!PSY_FOCUSES.includes(focus)`, and the card offers exactly `psychologistFocusOpen`, which filters
 *  that same roster – so **no action the interface permits can produce it**, unlike its `..._SEASON_`
 *  and `..._NOT_READY_` siblings, which fire on legitimate player acts. Invariant 4 protects the
 *  player's SCREEN from silent redesign and this sentence cannot reach it. Second, kind: T1's stale
 *  `knownWeek: 139` row was a RECORD of a measurement, so it was annotated; this is an ASSERTION
 *  about the present state, so it is corrected – and the task that made it false is this wave.
 *
 *  ⚠⚠ AND THE COUNT COMES **OUT**, NEVER BUMPED TO FIVE (ruling S's own words): «a number in that
 *  sentence rots on every roster change and has now done so once; removing it retires the class
 *  instead of resetting the clock». A sixth focus can no longer falsify this line. ⚠ It remains a
 *  DRAFT like every word in this block – the вычитка and the owner's playtest are the gate. */
export const PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL =
  'No such year of work – that is not one of them.'

/** ⭐⭐ O1 MADE MECHANICAL – «в ближайший год» is the owner's own grain, so a focus is not a dial.
 *  ONE sentence for both halves of the rule (the off-season WINDOW and the once-a-season FACT),
 *  because they are one story and the R10-16 doctrine forbids two sentences racing: whichever half
 *  refused, what is true is that the year already has its work and the next choice is an off-season
 *  one, once. DRAFT. */
export const PSYCHOLOGIST_FOCUS_SEASON_REFUSAL =
  'The year already has its work – the next one is chosen in the off-season, once a season.'

/** ⭐⭐ FROM 18 THE CHOICE IS JOINT, AND AT A STRAINED OR COLD BOND SHE DECLINES IT (ruled 09.09 –
 *  «в зрелости рычаг – влияние через отношения», made mechanical). HER line, and the register is the
 *  FLAT POOL's by the bibles' own law rather than by a choice of mine: the decline exists ONLY at
 *  `strained` and `cold`, and `docs/specs/voice-bibles-2026-09.md` («The flat pool») rules that at
 *  those two bands the four voices collapse into one shared pool – «the player cannot reliably tell
 *  which girl this is from the reply». So there is ONE sentence here and not four, which is what the
 *  wave brief means by «the flat-pool law applies by construction». ⚠ A per-voice set would have to
 *  be complete over all four temperaments AND would be a voice speaking where the bibles say the
 *  voice is obscured – the completeness law and the pool law pointing the same way. DRAFT. */
export const PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL =
  'This is her call as much as yours now – and she is not saying yes to it.'

/** ⭐ `'herself'` NEEDS HER READINESS AT ANY AGE (the spec §2's ruled line: «⚠ Requires HER
 *  readiness: at a strained/cold bond the card says she is not ready»). Its own sentence and its own
 *  gate: it closes ONE option where the decline above closes the whole row. DRAFT. */
export const PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL =
  'She is not ready for that one – it is the year she has to want first.'

/** ⭐⭐ THE SEASON A PICK MADE IN THIS WEEK IS *FOR* – T3b's second edit, and the whole of ruling I's
 *  problem 2. It is written ONCE and read by both the stamp and the guard, which is the only reason
 *  the two can never drift: `setPsychologistFocus` writes what this returns and
 *  `psychologistFocusRefusal` refuses when the stored stamp already equals it.
 *
 *  ⚠⚠ WHY IT IS NOT `seasonIndexOf(week)`, IN THE ARITHMETIC RATHER THAN IN THE INTENTION.
 *  `isOffSeasonWeek` is the LAST THREE weeks of the 52-week block (offsets 49-51,
 *  `OFF_SEASON_WEEKS = 3`) and `seasonIndexOf` is `floor(week / WEEKS_PER_YEAR)` – so the off-season
 *  sits INSIDE the same season index as the year it ends. T3 stamped the week the click happened in,
 *  and a mid-season hire therefore could not change until the NEXT block's off-season: between 50
 *  and 101 weeks after a FREE pick made before the player knew anything. «Мы ни за что не
 *  наказываем» governs, and an up-to-two-year lock is a punishment by arithmetic.
 *
 *  The +1 says the thing the field was always named for: a pick taken in the off-season buys the
 *  year that is about to start, not the one that is ending. A mid-season pick buys the year it is
 *  standing in, so its own coming off-season is a real boundary and opens normally. Pure, total,
 *  zero draws. */
export function psychologistFocusSeasonFor(week: number): number {
  return seasonIndexOf(week) + (isOffSeasonWeek(week) ? 1 : 0)
}

/** ⚠⚠ CONSENT IS A BAND READ AND NOTHING ELSE – §0.4 of the wave's laws, and the gravest thing this
 *  task could get wrong. NO DRAW, EVER: her yes is never dice, so the same band gives the same answer
 *  on every call, on every world, for ever. `bondBandOf` is the ONE reader of the number (spirit.ts),
 *  and the number itself never crosses to the UI – the card is handed the SENTENCE, never the band
 *  and never the figure (the fog law, `Snapshot`'s own). */
function bondWithholdsConsent(world: WorldState): boolean {
  const band = bondBandOf(world.bond ?? ECONOMY.bond.start)
  return band === 'strained' || band === 'cold'
}

/** ⭐⭐ WHAT WOULD HAPPEN IF THIS FOCUS WERE SET THIS WEEK – the sentence `setPsychologistFocus`
 *  would throw, or `null` when it would be accepted. ONE function, because the R10-16 one-story
 *  doctrine is only cheap when there is literally one place the story is written: the command throws
 *  what this returns, and the card prints what this returns (through the snapshot's
 *  `psychologistFocusOpen` / `psychologistFocusDetail`). A disabled option and the click it refuses
 *  cannot tell two stories when neither of them owns a sentence.
 *
 *  THE ORDER IS THE RULE, and each step is load-bearing:
 *
 *  1. **NOT HIRED** – the year belongs to the seat, so there is no year without one.
 *  2. **⚠⚠ THE JOINT DECLINE IS THE OUTER GATE AND WINS.** At 18+ with a strained/cold bond she
 *     declines ANY set or change, so `'herself'` never reaches its own readiness test and the two
 *     sentences never race. The overlap is real – both gates read the same two bands – and this is
 *     where it is resolved, once.
 *  3. **`'herself'` READINESS**, at any age – the per-OPTION gate, the only one that closes a single
 *     row member rather than the row.
 *  4. **⚠⚠ THE FIRST PICK IS FREE, AND «FREE» MEANS `psychologistFocus === null`, NEVER «just
 *     hired».** The year starts when the work starts – but firing keeps the focus as a dead letter
 *     (`hirePsychologist`'s own ⚠⚠ note and the field's in state.ts), so if a re-hire counted as a
 *     fresh free pick, fire-and-re-hire would be a free mid-season switch and O1 would be
 *     decorative. Once a focus exists, a change is a change.
 *  5. **THE WINDOW**, `isOffSeasonWeek(week)` – the TRUE off-season and nothing else (ruling I,
 *     problem 1: the exam fortnight is not a season boundary, and a still-at-school professional
 *     must not get a second change window in June).
 *  6. **ONCE A SEASON**, `psychologistFocusSeason` against `psychologistFocusSeasonFor(week)` – the
 *     SAME expression the stamp is written from, so the three-week window cannot be spent twice.
 *     ⚠ Read it as «is the year this week would buy the year already bought»: inside one off-season
 *     every week answers the same, and the answer only changes a year later.
 *
 *  Pure read, ZERO draws – see `bondWithholdsConsent`. */
export function psychologistFocusRefusal(world: WorldState, focus: PsyFocus): string | null {
  if (!(world.psychologistHired ?? false)) return PSYCHOLOGIST_FOCUS_UNHIRED_REFUSAL
  const withheld = bondWithholdsConsent(world)
  if (withheld && kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay) >= 18) {
    return PSYCHOLOGIST_FOCUS_DECLINE_REFUSAL
  }
  if (withheld && focus === 'herself') return PSYCHOLOGIST_FOCUS_NOT_READY_REFUSAL
  if ((world.psychologistFocus ?? null) === null) return null
  if (!isOffSeasonWeek(world.week)) return PSYCHOLOGIST_FOCUS_SEASON_REFUSAL
  if ((world.psychologistFocusSeason ?? -1) === psychologistFocusSeasonFor(world.week)) {
    return PSYCHOLOGIST_FOCUS_SEASON_REFUSAL
  }
  return null
}

/** WHICH OF THE FIVE THE ENGINE WOULD ACCEPT THIS WEEK (four until v77's T5 appended «The public
 *  life») – the card disables everything else, so the screen can never offer a permission the engine
 *  does not hold. `[]` means the row is closed outright. ⚠ IT READS `PSY_FOCUSES` AND NEVER A RE-TYPED
 *  LIST, which is what makes the fifth focus OFFERED by the same line that offered the first four and
 *  is exactly the property ruling O says the type system does not supply. Zero draws. */
export function psychologistFocusOpen(world: WorldState): PsyFocus[] {
  return PSY_FOCUSES.filter((f) => psychologistFocusRefusal(world, f) === null)
}

/** ...AND THE ROW'S OWN SENTENCE, `''` while every year on the roster is open.
 *
 *  ⚠ `'coolhead'` IS THE ROW PROBE, and the reason is a property of the gates rather than a
 *  preference: every refusal except the readiness one is ROW-LEVEL and identical for every focus on
 *  the roster (not hired · the joint decline · the season rule), so asking any non-`'herself'` member
 *  answers for the row – which is why v77's fifth focus needed no line here. `'herself'`'s own refusal is asked second, because the ONE case where the
 *  row is open and something is still closed is exactly the not-ready one.
 *
 *  ⚠ AND IT IS `''` RATHER THAN THE CHOSEN FOCUS'S LINE WHEN NOTHING IS REFUSED: what the year IS
 *  belongs to `PSY_FOCUS_LINE`, a static catalogue the card reads directly, and duplicating it onto
 *  the wire would be a second source for one sentence. Zero draws. */
export function psychologistFocusDetailOf(world: WorldState): string {
  if (!(world.psychologistHired ?? false)) return ''
  return psychologistFocusRefusal(world, 'coolhead') ?? psychologistFocusRefusal(world, 'herself') ?? ''
}

/** ⭐⭐ THE PICK. Re-validated engine-side like every command (invariant 1), and it writes exactly two
 *  fields: the year, and the season that priced it.
 *
 *  ⚠ `guardNotEnded` FIRST, and NO NEW SENTENCE IS DRAFTED FOR THE COLLEGE FREEZE – the latch throws
 *  the existing `COLLEGE_FREEZE_REFUSAL`, exactly as `hirePsychologist` and `setPsychologistRung`
 *  document, and `tests/round24-college-refusals.test.ts` holds this command to the same table as
 *  theirs («no specialist decision should reach a girl the programme is coaching»).
 *
 *  ⚠ RE-CHOOSING THE YEAR ALREADY RUNNING IS A NO-OP AND NOT A REFUSAL – `setPsychologistRung`'s own
 *  idempotence, for its own reason: nothing is being decided, so nothing may be charged, written or
 *  thrown. It is deliberately BEFORE the refusal read: a stale screen pressing the live option must
 *  not be told the year is locked, because from the player's side nothing was asked for.
 *
 *  ZERO draws on any stream. */
export function setPsychologistFocus(world: WorldState, focus: PsyFocus): void {
  // ⚠ W2-ENDINGS: the engine re-validates every command – a tab left open behind the epilogue must
  // not be able to start a year of work for a girl who has retired.
  guardNotEnded(world)
  if (!PSY_FOCUSES.includes(focus)) throw new Error(PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL)
  if ((world.psychologistFocus ?? null) === focus) return
  const refusal = psychologistFocusRefusal(world, focus)
  if (refusal) throw new Error(refusal)
  world.psychologistFocus = focus
  // ⚠ STAMPED ON EVERY ACCEPTED PICK, the free first one included – and it is the season the choice
  // is FOR, never the week the click happened in (ruling I, and `psychologistFocusSeasonFor`'s own
  // note). The guard above compares against THIS function and not against a re-typed copy of it,
  // which is what makes «one choice a year» one rule instead of two that can disagree.
  world.psychologistFocusSeason = psychologistFocusSeasonFor(world.week)
}
