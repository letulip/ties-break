// HER FORM, AS THE WORLD SEES IT – the world-reading half of `engine/form.ts`.
// docs/specs/the-form-and-the-sparring-2026-09.md §1, and the owner's eight rulings of 16.09.
//
// `engine/form.ts` is the MODEL (a leaf: `ECONOMY` and nothing else). This file is the one place
// that turns a `WorldState` into the `FormWeek` that model consumes, and the ONE WRITER of
// `world.form`. The split is `engine/chemistry.ts` / `phaseGrowth.ts`'s own shape one wave earlier,
// and it is what lets `world/player.ts` read the model's arithmetic without pointing at the
// integration layer – and what would let `engine/radar.ts` read the SAME arithmetic when O3's reader
// lands (see `engine/form.ts`'s header for why it has not).
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time). Everything
// needed at runtime comes from the model, from `match/engine.ts` (a leaf – the scoring FSM, the
// point model and the closed form) and from two sibling leaves. Deliberately NOT from
// `coachMarket.ts`, which is `masseur.ts`'s own fence for its own reason: importing it here would
// close a runtime cycle through endings → entries → medical → the phase that calls this.
//
// ⚠⚠ ZERO DRAWS. Every number below is a filter, a subtraction or a closed-form evaluation over
// facts the world already holds, so the frozen MAIN capture (41550 / e6b0c709) cannot see this file.
// `seed:form:<week>` stays RESERVED AND UNUSED (O4).
import { accrueForm, formResidual, type FormWeek } from '../form'
import { ECONOMY } from '../economy'
import { fastMatchProbability } from '../match/engine'
import { JUNIOR_TOUR } from '../season/tournament'
import type { WorldState } from '../world'
import { KID_ID } from './constants'
import { sparringRustCut, sparringWorksThisWeek, SPARRING_RECEIPT } from './sparring'
import { addEvent } from './ledger'

/** ⭐ HOW LONG SINCE SHE LAST FINISHED A COMPETITIVE MATCH, counted at the week that has just
 *  CLOSED: 0 if she played in it, 1 on her first week off, and up from there.
 *
 *  ⚠⚠ `world.week - 1`, WHICH IS `matchesThisWeek`'s AND `herWeekForChemistry`'s OWN READ AND NOT A
 *  THIRD CONVENTION. `tickWeek` increments the week at its first statement and the current week's
 *  tournament is only COMPUTED at step 5 – its result rows are written later, by the reveal flow,
 *  which the caller issues after the tick returns. `advanceWeeks` refuses to move while a reveal is
 *  open, so by the time this pass runs the previous week's rows are complete and final. Asking
 *  about `world.week` here is the off-by-one that made `matchBonus` dead code for three waves
 *  (phaseGrowth.ts §3b carries the measurement); this file is not going to repeat it.
 *
 *  ⚠ SHE MUST HAVE PLAYED AT LEAST ONE MATCH IN HER LIFE, or there is no rhythm to have lost. A girl
 *  who has never entered anything returns 0 here for ever, and that is a design decision rather than
 *  a guard: rust is the LOSS of match sharpness, and charging it to a twelve-year-old who has not
 *  started competing would be charging her for the game not having begun. Her first tournament would
 *  otherwise open at the rust floor, every career, invisibly.
 *
 *  ⚠ AND THE LEDGER IS PRUNED, WHICH IS WHY «EVER PLAYED» IS ASKED SEPARATELY FROM «WHEN». `results`
 *  keeps a rolling 52 weeks (`RESULTS_WINDOW`, world/bookkeeping.ts), so a layoff longer than a year
 *  leaves NO row behind and a naive `max(week)` would read it as «she has never played» – the rust
 *  would silently switch off at exactly the moment it matters most. The two facts are therefore
 *  taken from two places: WHEN from the pruned ledger, WHETHER from the three never-pruned counters.
 *
 *  ⚠ THE THREE COUNTERS ARE `matchesEverPlayed`'s OWN EXPRESSION (world/coachMarket.ts) AND ARE
 *  RE-SPELLED RATHER THAN IMPORTED, which is `player.ts`'s `coachTravelsWithHer` fence applied a
 *  second time and for the same reason: that module reaches the ledger, the ladder and the market at
 *  runtime, and this file is a leaf the weekly phase calls. `tests/round43-form.test.ts` pins the two
 *  to the same answer on real worlds, which is the anti-drift device the structural read always
 *  carries here. */
export function formMatchlessWeeks(world: WorldState): number {
  const everPlayed =
    world.seasonWins + world.seasonLosses + world.seasonHistory.reduce((s, h) => s + h.wins + h.losses, 0) > 0
  if (!everPlayed) return 0
  const closed = world.week - 1
  let last = -1
  for (const r of world.results) {
    if (r.playerId === KID_ID && r.week > last) last = r.week
  }
  // No row inside the window and she HAS played: the gap is at least the window, which is far past
  // `rustAfterWeeks` either way – the channel saturates at `rustFloor` long before this number
  // matters, so the exact value is only ever «a lot».
  if (last < 0) return closed
  return Math.max(0, closed - last)
}

/** §1a – THE RESIDUALS THE CLOSED WEEK HOLDS, one per completed competitive match.
 *
 *  ⚠ THE PROBABILITY IS RE-COMPUTED FROM THE SNAPSHOT AND IS NOT A NEW NUMBER ON THE ROW.
 *  `WorldMatch.a/.b` freeze the two `MatchPlayer`s exactly as they stepped on court – that is the
 *  property a re-watch three seasons later rests on – so `fastMatchProbability` over them IS her
 *  pre-match win probability, to the bit, and it is the SAME closed form the calendar card quotes
 *  («the odds ring already computes it», §1a). Nothing is persisted for this and no schema field is
 *  spent on a number the save already contains twice over.
 *
 *  ⚠ SIDE A IS NOT ALWAYS HER. `MatchRecord` is written from the BRACKET's perspective, so the
 *  argument order is swapped when she is `bId` – asking for `1 - p` instead would be a second
 *  spelling of the same thing and would round differently.
 *
 *  ⚠ RANKED MATCHES ONLY. A practice friendly awards no points, is not a test of anything, and is
 *  the flag the rest of the engine already reads for exactly this (`herWeekForChemistry`, the radar's
 *  own `matches` fold, «for the same reason it never shows on her face»).
 *
 *  ⚠ `tour` IS `JUNIOR_TOUR`, WHICH IS WHAT EVERY OTHER CALLER PASSES. `TOUR_AVG_P` is a constant
 *  added to both sides of `basePServe`, so a different tour would shift both players' hold and give
 *  a probability the card never quoted. One tour, one number. */
export function formResidualsOf(world: WorldState): number[] {
  const out: number[] = []
  for (const e of world.events) {
    if (e.week !== world.week - 1 || e.type !== 'match' || e.friendly) continue
    const m = e.match
    if (!m) continue
    const kidIsA = m.aId === KID_ID
    if (!kidIsA && m.bId !== KID_ID) continue
    const p = kidIsA
      ? fastMatchProbability(m.a, m.b, { surface: m.surface, tour: JUNIOR_TOUR, seed: '' })
      : fastMatchProbability(m.b, m.a, { surface: m.surface, tour: JUNIOR_TOUR, seed: '' })
    out.push(formResidual(m.winnerId === KID_ID, p))
  }
  return out
}

/** WHAT THE WEEK DID TO HER FORM, as the two channels read off the world.
 *
 *  ⚠ `away` IS THE CALLER'S – `resolveBodyAndPlanner` computes «is she at an event this week» ONCE,
 *  as `playedThisWeek`, and threads it here and into `resolveSparring`. See `sparringWorksThisWeek`
 *  for why this file cannot ask it itself. */
export function herWeekForForm(world: WorldState, away: boolean): FormWeek {
  const matchlessWeeks = formMatchlessWeeks(world)
  return {
    residuals: formResidualsOf(world),
    matchlessWeeks,
    // ⭐ THE SPARRING PARTNER'S ONE CHANNEL (§4) – and the only place in the engine it is read.
    rustCut: sparringRustCut(world, matchlessWeeks, away),
  }
}

/** ⭐ THE GAP SHE HAS JUST COME BACK FROM, in weeks, or `null` if the closed week was not a
 *  comeback. The two most recent rows of her own results ledger and nothing else: the gap is the
 *  distance between them, and it is only a COMEBACK if the newer of the two is the week that has
 *  just closed.
 *
 *  ⚠ THE LEDGER IS PRUNED TO 52 WEEKS, so a comeback from a longer layoff has only ONE row left and
 *  this returns `null` – the receipt is silent on the very layoffs it would speak loudest about.
 *  That is a known and accepted limit rather than an oversight: the alternative is a persisted
 *  «week she last played» field, which is a schema key for one sentence, and the standing rule is
 *  that a receipt may under-fire but must never over-claim. */
export function sparringComebackGap(world: WorldState): number | null {
  const weeks = world.results.filter((r) => r.playerId === KID_ID).map((r) => r.week).sort((a, b) => b - a)
  if (weeks.length < 2 || weeks[0] !== world.week - 1) return null
  // Several rows can share one week (two rungs in a week is the calendar's own edge); the gap is to
  // the newest week that is genuinely older.
  const previous = weeks.find((w) => w < weeks[0])
  if (previous === undefined) return null
  return weeks[0] - previous - 1
}

/** THE ONE WRITER OF `world.form`, called once a week from `resolveBodyAndPlanner` beside
 *  `accrueCondition`'s and `accrueSpirit`'s passes.
 *
 *  ⚠ A search for `world.form =` finds this line and nothing else, which is the property the wave
 *  after this one will depend on – the same guarantee `accrueCoachPair` makes about `coachPairs` and
 *  `growWeek` about `skills`.
 *
 *  ⚠ ZERO DRAWS (O4): `accrueForm` is a sum, a compare and a clamp; `formResidualsOf` is a filter and
 *  a closed form. The frozen MAIN capture cannot see this call. */
export function accrueFormWeek(world: WorldState, away: boolean): readonly number[] {
  const before = world.form ?? 0
  const week = herWeekForForm(world, away)
  world.form = accrueForm(before, week)
  // ⭐ THE COACH'S EYE, decided against the two values this pass already holds and nothing else.
  const eye = coachFormNote(world, before, world.form)
  if (eye) addEvent(world, { week: world.week, type: 'info', text: eye })
  // ⭐ THE SEAT'S RECEIPT, decided here because this is the pass that already holds both facts. See
  // `SPARRING_RECEIPT` and `sparringComebackGap` for the counterfactual it rests on.
  const gap = sparringComebackGap(world)
  if (gap !== null && gap > ECONOMY.form.rustAfterWeeks && sparringWorksThisWeek(world, away)) {
    addEvent(world, { week: world.week, type: 'info', text: SPARRING_RECEIPT })
  }
  // ⭐⭐⭐ v82, ROUND 42 #51 – AND THE WEEK'S RESIDUALS ARE HANDED BACK rather than banked here.
  //
  // ⚠⚠ THE RETURN TYPE IS THE FENCE AT THE TOP OF THIS FILE OBEYED. The coach's annual ask reads the
  // same residuals (#51's «fourth and best» component), and the obvious spelling – importing
  // `bankCoachResidual` from `coachMarket.ts` and calling it on this line – is EXACTLY what this
  // file's own dependency note forbids: it would close a runtime cycle through endings -> entries ->
  // medical -> the phase that calls this. So the pass returns what it computed and the PHASE wires
  // the two concerns together, which is where a cross-concern wire belongs and is the same shape
  // `playedThisWeek` is threaded in.
  //
  // ⚠ A LIST AND NOT A SUM, for `FormWeek.residuals`' own reason: a week with no matches is an empty
  // array rather than a zero that could also mean «she drew level». Callers that want neither simply
  // ignore the return, which is what every caller before v82 does.
  return week.residuals
}

/** ⭐⭐ THE COACH'S EYE ON HER FORM – the ONE window §3's fog rule leaves open («form speaks only
 *  through the coach's sentence and through the match itself»), and O2's ruling in full: no number,
 *  no Mood word, no diary line, nowhere, in v1.
 *
 *  Returns `null` on almost every week, which is the point: the sentence is a REMARK and not a
 *  subscription. `null` is also what a career with nobody in the corner gets – the eye belongs to the
 *  man, so a self-coached family reads her form off the match alone.
 *
 *  ⚠⚠ IT FIRES ON A CROSSING AND NOT ON A BAND, WHICH IS `coolheadCrossedAPoint`'s OWN RULE AND
 *  WHY NO SCHEMA FIELD IS SPENT ON IT. Asking «is she above 3 today» would print the same sentence
 *  every week of a good month; asking «did she cross 3 this week» prints it once, on the week it
 *  became true, and remembers nothing. Both facts are locals the weekly pass already holds.
 *
 *  ⚠⚠ TWO SENTENCES, TWO BANDS, AND THE BANDS ARE NOT SYMMETRICAL, because the two channels are
 *  not. The RUST line is gated on the gap that caused it as well as on the number, so «she needs
 *  match play» is never said about a girl who has been playing every week and losing – that
 *  girl is in a SLUMP, which is the psychologist's patient by §4's fence sentence and not a thing a
 *  hitting session fixes. The GOOD line has no gate but the number.
 *
 *  ⚠ A LIFE LINE IS NEVER A PURCHASE (the wave-3 brief §0.5): the caller writes it with NO
 *  `amountCents`, no category and no figure in the string.
 *
 *  ⭐⭐ BOTH SENTENCES ARE HIS, FROM THE 17.09 COPY REVIEW, AND THE VOICE OF THIS SURFACE IS TERSE
 *  TENNIS LANGUAGE. That is the whole of the change and it is his own diagnosis of why the round read
 *  as written rather than said: «trying to give every surface the same lyrical house voice is what
 *  currently makes several lines feel AI-written». A coach does not compose; he remarks. «Clean» went
 *  to «cleanly» because it is an adverb's job, and «matches under her» went to «match play», which is
 *  what the thing is called on a court. */
export function coachFormNote(world: WorldState, before: number, after: number): string | null {
  if (!world.coachId) return null
  const f = ECONOMY.form
  if (before < f.goodNoteAt && after >= f.goodNoteAt) return 'She is striking the ball cleanly.'
  if (before > f.rustNoteAt && after <= f.rustNoteAt && formMatchlessWeeks(world) > f.rustAfterWeeks) {
    return 'She needs match play.'
  }
  return null
}
