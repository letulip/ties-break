// THE SPARRING PARTNER: the third seat of the travelling team, and the one with the narrowest job
// in the game. docs/specs/the-form-and-the-sparring-2026-09.md §4.
//
// ⚠⚠ THE FENCE SENTENCE IS THE DESIGN, AND EVERY LINE BELOW SERVES IT: **the slump is the
// psychologist's patient, the rust is the sparring partner's.** Form has two channels (engine/form.ts
// §1a and §1b) and this seat reaches exactly ONE of them – the RHYTHM channel's drift, through
// `FormWeek.rustCut` and through nothing else. He does not touch the results channel, the reversion
// rate, condition, development, or her head. A slumping girl who plays every week gets NOTHING from
// him, and that is the seat working rather than the seat failing: a seat that touched both channels
// would be the two-levers-one-number failure the whole staff layer was built to avoid.
//
// ⭐ WHAT THE FAMILY IS BUYING, IN ONE SENTENCE: practice weeks stand in for match weeks. The drift
// a matchless week costs her is cut by his rung while he is at her – so an off-season, a layoff and
// an empty stretch of calendar all dull her less than they would have.
//
// ⚠⚠ AND THE TRAVEL SWITCH IS THE LUXURY, WHICH IS THE OPPOSITE OF THE SPEC'S OWN FIRST DRAFT AND
// HAS A NUMBER BEHIND IT. §4 originally read «he TRAVELS, always – travelling is the job»; the owner
// overruled that on 15.09 («а если семья в начале пути и на w15 не за что платить? у остальных есть
// галочка "ездит"») and round 42 #48 then PRICED the switch rather than guessing at it: a tournament
// occupies ONE week and writes its result that week, so the only «away and matchless» week this
// engine can produce is a withdrawal or a comeback week – and the NOT-travelling seat therefore
// covers **89.4% of the rust**, while travelling costs **$60,604 a season** to buy the other 10.6%.
// Against the research's $50-80k/yr band, only the not-travelling top rung ($72,800) lands inside it
// at all. So «stays home» is the DEFAULT and the shape a junior career buys; travelling is what a
// top-100 buys later, and the card says which.
//
// ⚠ RNG: NOTHING HERE DRAWS, on any stream. The salary is a flat contract per rung (the masseur's own
// legibility rule: «a salary is a negotiated number the player can read»), the hire, the rung and the
// stance are plain state, and the drift cut is a multiply. The frozen MAIN capture (41550 /
// e6b0c709) cannot see this file, by construction.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. Everything needed at runtime comes from SIBLING leaves
// – ledger, ladder, college, bookings, constants – which is `masseur.ts`'s import list exactly.
// Deliberately NOT from coachMarket.ts and NOT from world/knock.ts: importing either here would
// close a runtime cycle through the phase that calls this file. «Is she away this week» is therefore
// HANDED DOWN as a boolean by the caller that already holds it (`resolveBodyAndPlanner` computes it
// once as `playedThisWeek` and threads it), which is the dependency inversion `accrueSpirit`'s
// `psychologistWorks` argument established.
import { ECONOMY } from '../economy'
import { addEvent } from './ledger'
import { guardNotEnded } from './constants'
import { activeLadderOf } from './ladder'
import { inCollege } from './college'
import { vacationForWeek } from './bookings'
import type { WorldState } from '../world'

/** THE GATE: he joins a professional operation – the masseur's and the psychologist's own boundary,
 *  quoted rather than re-argued («эти специалисты могут открываться в про карьере»). Her first
 *  counting W-series result makes the professional table her table (`activeLadderOf` reads the
 *  never-pruned mark), so the gate can never close behind a layoff or a pruned window. */
export function sparringUnlocked(world: WorldState): boolean {
  return activeLadderOf(world) === 'wta'
}

/** The refusal, written once – the card prints it and `hireSparring` throws it, so the disabled
 *  state and the refused click can never tell two stories (the R10-16 doctrine).
 *
 *  ⭐⭐ HIS SENTENCE, FROM THE 17.09 COPY REVIEW, AND «COUNTING» SURVIVED A CHECK HE ASKED FOR. He
 *  offered a longer form for the case where «counting» is internal terminology the player has never
 *  been taught – and it is not: `CountingResultsTable` is a real table on the Stats screen and on the
 *  Kid screen, titled «… counting results» in the player's own vocabulary, and `world/mandatory.ts`
 *  uses the phrase in a sentence the player reads. So the SHORT form ships.
 *
 *  ⭐⭐ AND THE TWO SIBLINGS ARE THIS SHAPE NOW TOO – HE OPENED THE PASS THE SAME DAY. This block used
 *  to record the opposite and is kept as an amendment rather than deleted, because the sequence is
 *  the point: the line shipped DIFFERENT from `world/masseur.ts` and `world/psychologist.ts`, which
 *  both carried «joins a professional operation»; the difference was reported to him rather than
 *  evened out by an agent, since invariant 4 forbids touching shipped copy on a task that did not
 *  ask; and his own wider note («the review could be applied to our existing letters too») then
 *  arrived as the ask. The three seats now open with one sentence each in one shape, and this one
 *  was the pattern the other two were written to. */
export const SPARRING_LOCKED_DETAIL =
  'Her first counting W-series result opens a place for a hitting partner.'

/** The tag on a sparring-change event – `MASSEUR_CHANGE_KEY`'s pattern, week in the key so two
 *  changes can never collide. Kept and tagged, so «when did this arrangement start» stays a read
 *  over the ledger rather than a persisted field. */
export const SPARRING_CHANGE_KEY = 'sparring-since-'

/** THE HIRE, the masseur's own shape: no signing fee, no notice period, effective from the next
 *  weekly bill, and firing must always be allowed – a family that cannot pay has to be able to stop
 *  paying. `guardNotEnded` FIRST, which is also the whole college rule: inside the freeze the latch
 *  throws `COLLEGE_FREEZE_REFUSAL` – the college sentence, not the ended one – and no second guard is
 *  built here. ZERO RNG on any stream. */
export function hireSparring(world: WorldState, hire: boolean): void {
  // ⚠ W2-ENDINGS: the engine re-validates every command, because the worker is not the gate.
  guardNotEnded(world)
  if ((world.sparringHired ?? false) === hire) return
  if (hire && !sparringUnlocked(world)) throw new Error(SPARRING_LOCKED_DETAIL)
  world.sparringHired = hire
  addEvent(world, {
    week: world.week,
    type: 'info',
    keep: true,
    milestoneKey: `${SPARRING_CHANGE_KEY}${world.week}`,
    // ⚠ NO PRONOUN NAMES HIM (R15-7's standing order): «hitting partner» is the role and carries no
    // gender, unlike the masseur's own noun.
    // ⭐⭐ BOTH SENTENCES ARE HIS, FROM THE 17.09 COPY REVIEW. The voice of a feed entry is a COMPACT
    // CONSEQUENCE, and both of the drafts these replace reached for the house's lyrical register
    // instead – «somebody across the net» is the image he singled out as used often enough that it
    // «begins to feel generated», and «the practice weeks are hers alone again» says nothing about
    // what stopped. His terminology sheet is what makes the pair read as one arrangement: JOINS and
    // LEAVES THE TEAM, and MATCH-STYLE PRACTICE for what the seat does.
    text: hire
      ? 'A hitting partner joins the team – regular match-style practice on weeks without a match.'
      : 'The hitting partner leaves the team – regular match-style practice between events ends.',
  })
}

/** THE RUNG HE IS ON – the one lookup the bill and the drift cut both read, so the two can never
 *  disagree about what the family is buying. `sparringRung` is validated at its one writer
 *  (`setSparringRung`), but a hand-built probe world may hold anything, so an unknown value falls
 *  back to the default rung rather than to a crash – `masseurRungOf`'s identity-element discipline.
 *  Pure read, zero draws. */
export function sparringRungOf(world: WorldState) {
  const rungs = ECONOMY.sparring.rungs
  return rungs[world.sparringRung ?? ECONOMY.sparring.defaultRung] ?? rungs[ECONOMY.sparring.defaultRung]
}

/** THE DIAL. Three rungs off the market catalogue; the engine re-validates the index, so a stale
 *  screen cannot buy an arrangement the market does not sell. Works with or without a live hire – a
 *  rung recorded before the hire simply prices the card – but only a HIRED change writes a ledger
 *  line, because only then does the bill move. `setMasseurSessions`'s shape exactly, including
 *  `guardNotEnded` first. ZERO draws. */
export function setSparringRung(world: WorldState, rung: number): void {
  guardNotEnded(world)
  const chosen = ECONOMY.sparring.rungs[rung]
  if (!chosen) throw new Error('No such hitting partner – the market offers three.')
  if ((world.sparringRung ?? ECONOMY.sparring.defaultRung) === rung) return
  world.sparringRung = rung as 0 | 1 | 2
  if (world.sparringHired ?? false) {
    addEvent(world, {
      week: world.week,
      type: 'info',
      // The label, not a number: the price change is on the next weekly bill, which is the row that
      // may carry figures.
      //
      // ⭐⭐ HIS SENTENCE, AND IT IS THE SECOND OF THE TWO HE OFFERED, BECAUSE THE MODEL WAS CHECKED.
      // He gave one line for «the game establishes a different person» and one for «only the service
      // level changes», and warned that «a new hitting partner joins» «asserts a personnel change the
      // model may not track». It does not track one. There is no identity here of any kind – no name,
      // no id, nothing a later screen could refer back to – and the decisive fact is the LEDGER:
      // `SPARRING_CHANGE_KEY` is written by `hireSparring` alone, so a rung change does not restart
      // the arrangement and «when did this arrangement start» still answers with the original hire.
      // The model holds ONE continuous arrangement whose level moves, and the sentence says that.
      text: `The hitting-partner arrangement changes with the next bill – ${chosen.label.toLowerCase()}.`,
    })
  }
}

/** THE TRAVEL STANCE – the owner's 15.09 override, and the same `staffSeatFareCents` switch the
 *  masseur has («у остальных есть галочка "ездит"»). Default OFF, and here that default is a
 *  MEASUREMENT rather than the usual «the automatic behaviour is that competition weeks are not
 *  staff weeks»: round 42 #48 priced the switch at 10.6% of the rust for $60,604 a season. ZERO
 *  draws. */
export function setSparringTravels(world: WorldState, on: boolean): void {
  guardNotEnded(world)
  if ((world.sparringTravels ?? false) === on) return
  world.sparringTravels = on
  if (world.sparringHired ?? false) {
    addEvent(world, {
      week: world.week,
      type: 'info',
      // ⭐⭐ BOTH SENTENCES ARE HIS, FROM THE 17.09 COPY REVIEW, and the terminology sheet is why the
      // pair now mirror each other clause for clause: ON TOUR and THE HOME CLUB for the two places,
      // ONE ADDITIONAL FARE PER TRIP for the cost, and a REGULAR PRACTICE OPPONENT for what the trip
      // buys. «A court on the road» named the wrong thing – the seat buys a person, not a venue.
      text: on
        ? 'The hitting partner will travel from now on – one additional fare per trip, and a regular practice opponent on tour.'
        : 'The hitting partner will stay at the home club – no additional fare, and no regular practice opponent on tour.',
    })
  }
}

/** IS HE WORKING THIS WEEK – the one predicate the bill AND the drift cut read, so «you paid and you
 *  cannot tell» is unspellable here: a week he is not paid for is a week he cuts nothing.
 *
 *  THE THREE STAND-DOWNS ARE THE MASSEUR'S OWN, quoted rather than re-argued: not while the college
 *  freeze owns her tennis, and not on a week the family has booked off (ruling J – pay nothing and
 *  receive nothing).
 *
 *  ⭐ AND THE FOURTH IS THIS SEAT'S ALONE AND IS THE WHOLE OF WHAT THE SWITCH BUYS: a partner who
 *  does not travel stands down on a week she is AWAY at an event. He cannot hit with her in another
 *  country, so he is not paid for it and he cuts nothing that week – which is round 42 #48's
 *  measurement made mechanical rather than asserted.
 *
 *  ⚠ `away` IS HANDED DOWN AND NEVER ASKED HERE (see the file header): `isCompetitionWeek` lives in
 *  world/knock.ts and importing it would close a cycle through the phase that calls this. The caller
 *  computes it ONCE, as `playedThisWeek`, and threads it – so a doctor's withdrawal, which flips that
 *  answer to false earlier in the same phase, correctly reads as «she is at home» here. Pure state,
 *  zero draws. */
export function sparringWorksThisWeek(world: WorldState, away: boolean): boolean {
  if (!(world.sparringHired ?? false)) return false
  if (sparringStoodDown(world)) return false
  return (world.sparringTravels ?? false) || !away
}

/** ⭐⭐ RETAINED, BUT NOT WORKING THIS WEEK – the state his 17.09 review said was MISSING from the
 *  card, and it turned out to exist in the engine with nothing on any screen saying so.
 *
 *  HIS WORDS: «if family/school weeks temporarily stop billing: *The hitting partner remains with the
 *  team, but is not working this week. No salary is charged.*» Both halves are true here and both are
 *  the masseur's own stand-down pair, quoted rather than re-argued: not while the college freeze owns
 *  her tennis, and not on a week the family has booked off (ruling J – pay nothing and receive
 *  nothing). The arrangement is NOT cancelled by either.
 *
 *  ⚠⚠ IT IS THE FAMILY/SCHOOL PAIR AND DELIBERATELY NOT THE THIRD STAND-DOWN. A partner who does not
 *  travel also stands down on a week she is AWAY at an event – but that one is not a suspension the
 *  card should announce, it is the exact shape the travel switch sells, and its own row already says
 *  so in as many words («Home practice is already covered; this extends the arrangement to travel
 *  weeks»). A second sentence claiming the same week was a suspension would be the screen telling two
 *  stories about one fact. It is also the one of the three that needs `away`, which is a phase-local
 *  fact a snapshot has no honest access to.
 *
 *  ⚠ ONE SPELLING, WHICH IS WHY `sparringWorksThisWeek` NOW CALLS THIS rather than repeating the two
 *  guards. The card must never be able to say «no salary is charged» on a week the bill was taken;
 *  the two answers come from one predicate, so it cannot. Pure state, zero draws. */
export function sparringStoodDown(world: WorldState): boolean {
  if (!(world.sparringHired ?? false)) return false
  return inCollege(world) || vacationForWeek(world, world.week) !== undefined
}

/** ⭐⭐ THE SEAT'S ONE CHANNEL – the multiplier `accrueForm` applies to the rhythm channel's drift.
 *
 *  `1` is «nobody is cutting anything», which is every career that has not hired him, every week the
 *  seat stands down, and every week the gap is too short to drift at all. `ECONOMY.sparring.rungs[n]
 *  .driftCut` is a MULTIPLIER on the drift and not the share removed: x0.15 leaves 15% of a rusting
 *  week's drift standing.
 *
 *  ⚠ THE GAP IS TAKEN AS AN ARGUMENT AND NOT RE-DERIVED, so the one number `herWeekForForm` computed
 *  is the one number this reads: a second derivation would be a second opinion about the same week.
 *  Below the gap this returns 1 by construction, which costs nothing and states the fence – he is
 *  paid on weeks he cuts nothing, exactly as the masseur's fare buys nothing on a first-round exit.
 *
 *  ⚠ `away` IS THE CALLER'S, for `sparringWorksThisWeek`'s reason. Zero draws. */
export function sparringRustCut(world: WorldState, matchlessWeeks: number, away: boolean): number {
  if (matchlessWeeks <= ECONOMY.form.rustAfterWeeks) return 1
  if (!sparringWorksThisWeek(world, away)) return 1
  return sparringRungOf(world).driftCut
}

/** What the seat costs a week at the rung the family is on – the card's headline figure and the
 *  ledger row's amount, one derivation. Pure, zero draws. */
export function sparringWeeklyCents(world: WorldState): number {
  return sparringRungOf(world).weeklyCents
}

/** THE WEEKLY BILL. `resolveMasseur`'s shape, one seat over: the predicate that decides the money is
 *  the predicate that decides the work, so the two can never disagree about a week.
 *
 *  ⚠ NO PER-MATCH RE-PRICING, unlike the masseur's travel week. His 22.08 rule («на неделе выезда
 *  по-матчевая цена заменяет недельную») is about a seat sold BY THE SESSION; this one is sold by the
 *  week at every rung, so there is no session price for a trip to replace it with and inventing one
 *  would be a second travel model – the round-22 refusal.
 *
 *  Called from `resolveBodyAndPlanner` beside `resolveMasseur`. ZERO draws on any stream. */
export function resolveSparring(world: WorldState, away: boolean): void {
  if (!sparringWorksThisWeek(world, away)) return
  const cost = sparringWeeklyCents(world)
  world.fundsCents -= cost
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'staff',
    // ⚠ THE SAME BUCKET THE MASSEUR AND THE PSYCHOLOGIST USE ('staff'), and for its own stated
    // reason: a salary the player cannot find on the breakdown is the academy's $20,879 mistake.
    // ⭐ KEPT VERBATIM BY HIS 17.09 REVIEW, and it is the phrase his terminology sheet then made
    // binding for the recurring cost: WEEKLY SALARY, everywhere, never «weekly fee» and never
    // «payroll». The two confirmations on the card were re-worded onto it.
    text: 'Hitting partner – weekly salary',
    amountCents: -cost,
  })
}

/** ⭐ THE RECEIPT (the travelling-team §4 law – no sentence, no seat). Fires on her FIRST match back
 *  from a gap he covered, and on nothing else: the one week in a season or three when a seat whose
 *  whole work is an absence has something visible to show.
 *
 *  ⚠⚠ IT IS A COUNTERFACTUAL AND NOT A CELEBRATION, which is `COOLHEAD_RECEIPT`'s own rule: it
 *  fires when the gap was long enough to have dulled her AND he was cutting it, so the sentence
 *  «her first match back did not look like a first match back» is backed by arithmetic rather than
 *  by optimism.
 *
 *  ⚠ NO STORED STATE AT ALL: the question is asked about a single week's two facts inside that week
 *  and nothing is remembered. No schema field, no migration, no fixture.
 *
 *  ⚠ A LIFE LINE IS NEVER A PURCHASE (the wave-3 brief §0.5): `addEvent` with NO `amountCents`, no
 *  category and no figure in the string – so it writes no money row and folds into no ledger.
 *  ZERO draws.
 *
 *  ⭐⭐⭐ THE ONE LINE OF THIS ROUND HE KEPT EXACTLY AS WRITTEN, AND HE SAID WHY: «the repetition gives
 *  it rhythm and makes it feel like an observation rather than a tooltip» (17.09). ⚠ DO NOT TOUCH IT.
 *  It is also the model for the voice of a RECEIPT – vivid but restrained observation – which is a
 *  different voice from the feed entries two functions up and from the confirmations on the card. */
export const SPARRING_RECEIPT = 'Her first match back did not look like a first match back.'
