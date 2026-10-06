// ⭐⭐ THE WEEK ITSELF – the tick, the multi-week advance, and the two exits that spend weeks through
// them (A-04 (a) / T6.5, the last of P4's span-moves; docs/review/proposals/P4-world-decomposition.md).
//
// WHAT IS HERE AND WHY IT IS ONE MODULE. `tickWeek` is the weekly resolution's ORDER – eight phases,
// each of which lives in its own `world/phase*.ts` – and everything else here is a caller of it:
// `advanceWeeks` (the span, one week at a time, stopping on the first thing worth reading),
// `skipEvent` (a week closed without playing the event she entered), `resumeFromCollege` /
// `endCollegeEarly` / `finishCollege` (the college exit, which spends the rest of a paused year by
// ticking it), and `replayMainState` (the one remaining probe replay). The 26.09 lane measured the
// cluster at zero call-backs into the integration core
// (`docs/review-principles-2026-09-26/probes/world-callbacks.mjs`), so it moved whole, by P4's rule,
// with no dependency inversion and no changed signature.
//
// ⚠ WHY THE COLLEGE EXIT IS IN THE TICK'S MODULE AND NOT IN `world/college.ts`. Because it is the
// ONLY caller of `tickWeek` besides `advanceWeeks`: `resumeFromCollege` spends the remainder of a
// paused year by ticking it. Put it in `college.ts` and `college.ts` imports the tick pipeline –
// while this file imports `college.ts` for the year's own state – which is a runtime cycle, and P4's
// rule is that the callee moves DOWN, never that an import points back up. A-04's own cluster map
// draws the line in the same place.
//
// ⚠ THE ONE CROSS-CLUSTER EDGE, AND WHICH WAY IT POINTS. `replayMainState` calls `createWorld` and
// `tickWeek`, so it had to live on one side of the birth/advance line. It lives HERE, with the tick,
// and this file imports `./create` – not the other way round – for two reasons: A-04's map assigns
// the MAIN-draw bookkeeping (`replayMainState`, `maxMainDraws`, `MAIN_DRAWS_*`) to the advance
// cluster, and creation is the more primitive layer of the two. `create.ts` therefore depends on
// nothing in the tick pipeline, which is what keeps the package a DAG.
//
// ⚠ RNG: THE MAIN STREAM'S ONE HOME, AND ITS BUDGET. `tickWeek` is where the weekly MAIN draws are
// spent – `resolveBaseCosts` and `driftCohort`, in that fixed order, and nothing else (the tick's own
// header below says it again in the shape a reader needs). Not one statement moved inside any body
// here, so the per-week draw count and its order are what they were: the frozen capture (41550 draws
// / hash e6b0c709) reproduces byte-for-byte, and `MAIN_DRAWS_PER_WEEK_MAX` still bounds it.
import { lifeMomentOf } from './lifeMoment'
import { type Rng, type MainRngState, initMainState, resumeMain } from '../rng'
import { STOP_PRECEDENCE, type PlayerProfile, type StopReason } from '../../shared/protocol'
import { TIERS, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../season/calendar'
import { COHORT_SIZE } from '../season/cohort'
import { clamp } from '../condition'
import { ECONOMY } from '../economy'
import { ENDINGS } from '../ending'
import { addEvent } from './ledger'
import { eventById } from './bookings'
import { kidAgeYears } from './age'
import { entryStatus, withheldFreeWeekRecovery } from './medical'
import { chargeMandatoryPenalty, mandatoryBinds } from './mandatory'
import { academyCoverOf, travelCostFor } from './sponsors'
import { guardNotEnded, latchEnding } from './endings'
import { advanceRefusal, openQuestions, SPAN_REPORTS_ONLY, stoppableOfferWeek } from './multiWeek'
import { housekeep, recomputeRankAndMilestones } from './bookkeeping'
import { deriveWeekField } from './weekField'
import { playHerWeek, resolveBodyAndPlanner } from './phaseHerWeek'
import { growAndLive } from './phaseGrowth'
import { weeklyFinance } from './phaseFinance'
import { academySpokeThisWeek, seasonBoundaryAndObligations } from './phaseObligations'
import { closeTheWeek } from './phaseAiWeek'
// ⭐ ROUND 35 #14 – the two ends of the published draw. `tickWeek` calls both; nothing else does.
import { recordDrawnFirstRounds, pruneDrawnFirstRounds } from './draw'
import { announceCampusInterlude } from './fieldNews'
import {
  bankCollegeYear,
  callUpPlayedThisWeek,
  callUpRevealOpen,
  collegeEpilogueLine,
  collegeLeaguePlayedThisWeek,
  collegeLeagueRevealOpen,
  leaveCollege as leaveCollegeState,
  openCollegeYear,
} from './college'
import { createWorld } from './create'
// ⚠ TYPE-ONLY, AND THAT IS THE WHOLE OF WHY THIS IS NOT A CYCLE (CLAUDE.md's P4 rules): the barrel
// imports the values back and re-exports them under their historical names, and this import is erased
// at compile time, so no runtime edge points from the package back at `world.ts`.
import type { WorldState } from '../world'

// --- v35: the ONE remaining replay, and the budget its verifier is bounded by --------------------

/** The probe replay: a fresh world on the same seed, ticked `weeks` times, drawing through a
 *  resumed position so the returned state carries BOTH the register and the count.
 *
 *  This is byte-for-byte what the worker's `restoreRng` used to do on EVERY load. Under v35 it has
 *  exactly two callers left, and both are terminal: the v34 -> v35 migration (which stamps its
 *  output into the save, once per career, and never runs again) and the worker's
 *  `recoverMainState` (reachable only from a failed consistency check on a corrupted save). It is
 *  valid for the same reason the old replay was — the per-week MAIN draw count is independent of
 *  player input, so a probe with no entries walks the same positions the real career did — and it
 *  is best-effort in the same way too: it replays under CURRENT code, so it lands where current
 *  code says, not where history did. v35 freezes that answer once instead of re-rolling it on
 *  every load for ever (see the migration block's note in migrations.ts). */
export function replayMainState(seed: string, profile: PlayerProfile, weeks: number): MainRngState {
  const st = initMainState(seed)
  const rng = resumeMain(st)
  const probe = createWorld(seed, profile)
  for (let w = 0; w < weeks; w++) tickWeek(probe, rng)
  return st
}

/** The per-rival half of the weekly budget: `driftCohort` draws exactly 4 per rival, and that
 *  number is the tick's own (see its header). It is the part of the bound that is ACCOUNTING. */
const MAIN_DRAWS_PER_RIVAL = 4

/** The flat head of the weekly budget – everything the tick spends that is not per-rival, plus the
 *  slack that makes this a corruption detector rather than a ledger.
 *
 *  ⭐⭐ E-04 (05.09 engine review): WIDENED FROM 8, BECAUSE 8 WAS NOT SLACK. `resolveBaseCosts`
 *  spends 3 (jitter, flavour, sponsor roll) plus a 4th when the roll hits, so the flat cost is at
 *  most 4 and the comment called the remaining 4 "generous". Measured on the review's A/B probe –
 *  `rngMain.n = 124,654` after 156 weeks – the real cost is **799.06 draws a week against a bound
 *  of 804: a margin of five draws, 0.6 %.** A wave that legitimately adds one MAIN draw per rival,
 *  or six flat ones, updates the frozen capture as CLAUDE.md prescribes and ships – and from that
 *  day every career played more than a few weeks fails this bound on EVERY load, is replayed under
 *  current code on every load (the O(career) path v35 retired), and shows the repair flag every
 *  time. The bound would have turned from a corruption detector into a silent performance and
 *  determinism regression, and nothing would have gone red.
 *
 *  `2 * COHORT_SIZE` is the widening: 406 + 4×199 = **1,202 a week against 799.06 measured**, room
 *  for half again the tick's whole cost. It is still an order of magnitude below any corruption
 *  pattern (the s/n redundancy check in `rng.ts` is the sharp half of the verifier and is
 *  untouched), and widening can only ACCEPT more positions, never refuse a save that loads today. */
const MAIN_DRAWS_FLAT_PER_WEEK = 8 + 2 * COHORT_SIZE

/** ⭐ The weekly bound at the standard field size, named so a test can relate it to the live tick's
 *  measured cost – which is the other half of E-04: `maxMainDraws` had no test that compared it to
 *  what a week actually spends, only two that compared stored fixtures to it. See
 *  `tests/sim-worker-rng.test.ts`, "the bound is slack the tick can grow into". */
export const MAIN_DRAWS_PER_WEEK_MAX = MAIN_DRAWS_FLAT_PER_WEEK + MAIN_DRAWS_PER_RIVAL * COHORT_SIZE

/** The MOST MAIN draws `weeks` of career can legitimately have spent — the plausibility half of
 *  the load-time verifier (the redundancy check `mainStateConsistent` is the other, sharper half).
 *
 *  Derived from what the weekly tick actually spends TODAY, not from a remembered cost table:
 *  `resolveBaseCosts` draws 3 (jitter, flavor, sponsor roll) plus 1 more when the roll hits, and
 *  `driftCohort` draws exactly 4 per rival (see the tick's own header). It is corruption detection,
 *  not accounting, and a bound that has to be re-derived every time a draw is added would be the old
 *  frozen-capture tax wearing a new hat – see `MAIN_DRAWS_FLAT_PER_WEEK` for how much slack that
 *  argument actually needs and what it measured. Floored at COHORT_SIZE because the draws were made
 *  against the GENERATED field: a v6/v7-era fixture persists a trimmed shape-sample of its
 *  cohort, but the probe that computed its position drifted all 199. */
export function maxMainDraws(weeks: number, cohortSize: number): number {
  return weeks * (MAIN_DRAWS_FLAT_PER_WEEK + MAIN_DRAWS_PER_RIVAL * Math.max(cohortSize, COHORT_SIZE))
}


// --- R8-7a, RETIRED 05.08: AN ENTRY ALREADY TAKEN IS HONOURED -------------------------------------
//
// THE STEP THAT USED TO BE HERE. `releaseOutgrownEntries` ran at the top of every tick, walked the
// still-refundable (pre-deadline) entries, and cancelled any whose rung had closed under her -
// refunding the fee and writing «Entry released – she's outgrown W50. Fee refunded.» into the feed.
// Both ceilings triggered it: `outgrewTier` (her domestic points passed the band) and `tierOutgrown`
// (the ladder's own sliding window, act2-pro-tour.md §11). It was read from a real rule - «players
// out of band at close are removed and refunded» (owner 25.07) - and applied to the wrong moment.
//
// ⚠ THE OWNER PLAYED IT AND IT WAS WRONG (05.08): «моя уже 22 летняя выиграла 2 w50 подряд и ее
// автоматом сняли с 3-го письмом без объяснения причины – я понимаю, что она переросла, но это
// ощущается очень странно. Надо поправить.» She won two W50s, the points those wins earned closed
// the rung, and the game cancelled the W50 she had ALREADY ENTERED.
//
// ⚠⚠ IN THE SPORT, ACCEPTANCE INTO A DRAW IS NOT REVOKED BECAUSE YOUR RANKING IMPROVED. You play,
// and it is your last event at that level. Outgrowing a rung is a statement about what she may enter
// NEXT; it is not a retroactive claim on what she has already committed to. So a rung closing now
// removes it from the FEED and the OFFER LIST - which is what `tierOpenFor` and `entryStatus` have
// always done, untouched by this change - and never from her SCHEDULE.
//
// ⚠ THE TWO CEILINGS STILL AGREE, which is what the retired comment demanded of them: `outgrewTier`
// and `tierOutgrown` "are the same event for the player and must have the same consequence". They
// do - the consequence is now identically NOTHING for a committed entry and identically "closed" for
// the next one, on both. The asymmetry this deletes is the one that was actually visible: the
// PRE-deadline entry was cancelled while the POST-deadline entry played on, so which of two
// identical commitments survived depended on a date the player was not thinking about.
//
// ⚠ AND THE DEAD END IT ONCE GUARDED IS GUARDED ELSEWHERE, twice over, which is why this can simply
// go. R10-3's trap - an entry to a rung she outgrew that could be neither played, planned nor
// abandoned - was closed by `cancelEntry` (R10-13, the escape hatch, still there) and by
// `arrivalStatus` returning `verdict: 'play'` with `outgrown: true` (R12-3, pinned in
// tests/round12.test.ts, still there). The week is playable, the card is visible, the button says
// "(outgrown)", and the parent may still pull her out himself if he wants the fee back.
//
// MEASURED before it was removed (tools/outgrown-entry-probe.ts, and see the report on this branch):
// the release fired on the domestic rungs at fourteen in almost every career and on a professional
// rung only for the careers strong enough to climb past one - exactly the owner's case. Honouring
// the entry costs her a low-paying draw she was going to play anyway.

// Full weekly resolution. The MAIN stream carries exactly TWO things, in this fixed order:
// resolveBaseCosts (3 draws, 4 when the sponsor roll hits) and driftCohort (4 per cohort player).
// Nothing else – both tournament sides run on EVENT-scoped streams (`seed:kidtour:<id>` for the
// kid's shadow run, `seed:aitour:<id>` for the canonical AI bracket), so the weekly draw count is
// independent of player input AND of how much content the calendar carries.
//
// When the kid has an entered event this week the resolution PAUSES: the shadow tournament is
// computed (byte-identical to the old inline run) and stashed in `world.pendingTournament`, but its
// match/summary/milestone events, ranking points and the week's rank recompute are all deferred to
// the reveal/finalize flow (revealTournamentRound / skipTournament). The main-stream work (base
// costs, drift) and the AI brackets still run, so the per-week draw count is unchanged.
export function tickWeek(world: WorldState, rng: Rng): void {
  // 0. ⭐⭐⭐ ROUND 35 #14 – THE DRAW THAT IS ON SCREEN RIGHT NOW BECOMES A FACT BEFORE THE WEEK MOVES.
  //    The world here is EXACTLY the one the card the player is looking at was rendered from, and
  //    the events one week out are the ones it has already named – so recording them here writes
  //    down what he was told rather than a re-derivation of it.
  //
  //    ⚠ THIS CALL IS THE NET AND THE ONE AT THE BOTTOM IS THE PRIMARY. On a continuously played
  //    career the bottom call has already recorded these events at the end of last week's tick and
  //    this one is a no-op (the writer only fills absent keys). It earns its place on the two paths
  //    where no previous tick can have run under this build: a save written before v70, and a save
  //    resumed at week − 1 of an event. Without it his live career would lose the very first draw it
  //    is holding – which is the one on screen.
  recordDrawnFirstRounds(world)
  world.week += 1

  // 1. THE SEASON BOUNDARY AND THE RECURRING OBLIGATIONS (R2-10 step 2, phase 1) – steps 0a00 to
  //    0a0c-ter, moved whole into world/phaseObligations.ts and unchanged there. Zero MAIN draws:
  //    the phase takes no `rng`, which is the guarantee rather than a claim about it.
  seasonBoundaryAndObligations(world)

  // 2. WHAT THE WEEK COSTS (R2-10 step 2, phase 2) – steps 0a0 to 1b, moved whole into
  //    world/phaseFinance.ts and unchanged there. ⚠ THIS IS THE PHASE THAT HOLDS THE MAIN STREAM:
  //    `resolveBaseCosts` spends its 3 (4 on a sponsor hit) inside it, in the same position in the
  //    tick they have always been, ahead of `driftCohort`'s 4-per-rival below.
  weeklyFinance(world, rng)

  // 3. HER BODY AND THE WEEK'S PLAN (R2-10 step 2, phase 3a) – step 1c and everything in it, moved
  //    whole into world/phaseHerWeek.ts. Zero MAIN draws: the phase takes no `rng`.
  //    ⚠ `playedThisWeek` is THREADED, not re-asked – the medical arm of step 2 below removes her
  //    entry, so a second `isCompetitionWeek` would answer differently on the weeks it matters.
  const playedThisWeek = resolveBodyAndPlanner(world)

  // 4. THE WEEK, DERIVED ONCE – the standings, the rivals' condition, the AER ledger and the
  //    professional side, folded before any bracket runs so her competition and the AI's see ONE
  //    world (world/weekField.ts). Zero draws. ⚠ IT IS THE SAME OBJECT BOTH COMPETITIONS ARE HANDED,
  //    at step 5 and again at step 7, which is the whole point of folding it: two calls to this
  //    function would be two agreeing derivations rather than one, and agreeing is not identical.
  const field = deriveWeekField(world)

  // 5. HER OWN COMPETITION (R2-10 step 2, phase 3b) – step 2 and the masseur's bill, moved whole
  //    into world/phaseHerWeek.ts. Event-scoped RNG only (`seed:kidtour:<event.id>`).
  playHerWeek(world, field, playedThisWeek)

  // 6. BOTH SIDES OF THE LADDER MOVE, AND SHE HAS A LIFE (R2-10 step 2, phase 4) – steps 3 to 3f,
  //    moved whole into world/phaseGrowth.ts and unchanged there. ⚠ `driftCohort`'s 4-per-rival is
  //    the tick's SECOND and last MAIN draw, in the same position it has always been: after her
  //    competition, before the canonical brackets below.
  //    ⚠ `playedThisWeek` IS THREADED HERE TOO SINCE ROUND 44, for step 3's own reason one screen
  //    up: the hitting partner's share of the decline stands down on an away week unless the family
  //    paid a fare, and `sparringWorksThisWeek` has to be asked with the SAME answer the bill was
  //    taken against at step 5. Re-asking `isCompetitionWeek` inside phase 6 would read the world
  //    AFTER the medical arm of phase 3 removed her entry, which is exactly the weeks it matters on.
  growAndLive(world, rng, playedThisWeek)

  // 7. THE REST OF THE WORLD PLAYS, AND THE WEEK CLOSES (R2-10 step 2, phase 5) – steps 4 to 7,
  //    moved whole into world/phaseAiWeek.ts. Event-scoped RNG only (`seed:aitour:<event.id>`):
  //    the MAIN stream ended one phase ago carrying base costs + the cohort drift, which is exactly
  //    what the frozen capture (41550 / e6b0c709) measures.
  closeTheWeek(world, field)

  // 8. ⭐⭐⭐ ROUND 35 #14 – AND THE WEEK CLOSES BY WRITING DOWN THE DRAW IT HAS JUST MADE. The events
  //    one week out are the ones whose cards now carry a NAME (`DRAW_LEAD_WEEKS`), and the world
  //    they are read from here is the same world the next snapshot will render them from – so what
  //    is stored is what he will be shown, to the letter.
  //
  //    ⚠ LAST, AND AFTER `closeTheWeek`, FOR TWO REASONS THAT BOTH BITE. The AI brackets and the
  //    housekeeping inside it move the standings and roll the calendar forward, so a record taken
  //    any earlier would describe a world that no longer exists by the time a card is drawn. And on
  //    a REVEAL week the flow can be pushed aside (`tournamentHidden` in App.vue) and the Season
  //    screen read before the run is finalised – recording here, ahead of the finalize, is what
  //    stops the name moving under him between two looks at the same card. Measured before the fix:
  //    the name moved on 3 of 466 pre/post-finalize card pairs (tools/r35-draw-fact.ts).
  //
  //    ⚠ ZERO MAIN DRAWS – the writer is a pure read of the snapshot path, so the tick's draw count
  //    and the frozen capture are untouched. And the prune runs beside it, because a table of
  //    published draws is only worth the ones that have not been played yet.
  recordDrawnFirstRounds(world)
  pruneDrawnFirstRounds(world)
}

// entries: moved to world/entries.ts (P4 extraction). Imported back below and re-exported under
// the historical names, so every existing `from '...engine/world'` call site keeps working.

/** R9-9: skip an entered tournament AT its event week – entering the begin flow is no longer a
 *  one-way door. A POST-deadline withdrawal, real-world style: the entry fee stays committed
 *  (the list closed with her on it), the travel charge tickWeek took is refunded in full (she
 *  never boards), NO run is committed (no points, no W-L, no strain – the shadow result is
 *  discarded), and the week then closes exactly like a normal non-playing week (the same
 *  deferred steps finalizeTournament would have run). Only callable before the first reveal;
 *  once a match has been shown the run is under way. Zero draws – the discarded shadow already
 *  ran on its event-scoped stream, so the MAIN weekly sequence is untouched either way. */
export function skipEvent(world: WorldState, eventId: string): void {
  // ⚠ W2-ENDINGS: the engine re-validates every command; the worker is not the gate.
  guardNotEnded(world)
  const p = world.pendingTournament
  if (!p || p.eventId !== eventId) throw new Error('No tournament to skip this week')
  if (p.finished || p.revealedRounds > 0) throw new Error('The tournament is already under way')
  const event = eventById(world, eventId)
  if (!event) {
    // calendar lost the event (defensive – finalize handles this the same way): just clear.
    world.pendingTournament = null
    return
  }
  // v21: refund WHAT SHE PAID, not what the calendar prints. `travelCostFor` is the same function
  // chargeTravel used minutes ago, so a scholarship can never be turned into free money by entering
  // and withdrawing; the covered part is handed back to the academy's season tally at the same time.
  const paid = travelCostFor(world, event)
  // ...and the academy's tally is handed back exactly what it was credited, never the brand's share
  // as well (see `academyCoverOf`): two payers, two ledgers, and a withdrawal must unwind each of
  // them by its own contribution.
  const covered = academyCoverOf(world, event)
  world.fundsCents += paid
  if (world.academy && covered > 0) world.academy.coveredCents = Math.max(0, world.academy.coveredCents - covered)
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'travel',
    text: `Travel refunded: ${TIERS[event.tier].label}`,
    amountCents: paid,
  })
  world.entries = world.entries.filter((id) => id !== eventId)
  world.pendingTournament = null
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `Skipped ${TIERS[event.tier].label} – entry fee forfeited.`,
  })
  // ⚠ THE NO-SHOW, AND IT IS THE DEAREST OF THE THREE SOURCES (W3-ACT2 §6, `noShowPoints` 4 against
  // a late withdrawal's 3 and a plain skip's 2). The ordering is about what the TOURNAMENT lost, not
  // about her: never entering costs it an entry, pulling out after the list closed costs it a hole
  // in a published draw, and not appearing on the day costs it the hole AND an empty court on a
  // court schedule that cannot be refilled.
  //
  // ⚠ THE MEDICAL WITHDRAWAL IS NOT THIS PATH, which is the real tour's own distinction and the one
  // that keeps «мы ни за что не наказываем» true here. `mandatoryBinds` answers false while she is
  // injured, so a body that gives out on the Sunday is never a no-show; the doctor's veto in
  // tickWeek pulls her out through its own route and this line simply does not fire.
  if (mandatoryBinds(world, event)) {
    chargeMandatoryPenalty(world, world.week, ECONOMY.mandatory.noShowPoints, 'no-show', event)
  }
  // The week ends match-free after all, so she earns the slider recovery bonus that tickWeek
  // withheld when it still believed she would play (accrueCondition ran with played = true).
  // Integer, clamped – "the week then resolves as a normal non-playing week".
  //
  // ⭐⭐ AND THE BASE RECOVERY WITH IT SINCE 18.08 – THE SAME EXPRESSION THE MEDICAL WITHDRAWAL USES.
  // This line handed back the slider bonus ALONE, and the note left for the architect beside the
  // withdrawal explained why: it was exactly right when written, because `matchWeekRecoveryBase` and
  // `recoveryBase` were both 2 and the difference was zero. The V2 flip set `matchWeekRecoveryBase`
  // to 0 and the two paths silently parted by `recoveryBase` – EIGHT condition points for the same
  // match-free week, depending only on whether the doctor pulled her out or the parent chose not to
  // enter.
  //
  // ⚠ IT WAS NEVER A DESIGNED PENALTY, WHICH IS WHY THIS IS A FIX AND NOT A TUNING CHANGE. The owner,
  // 18.08: «мне кажется тут всё явно: она и в одном случае не играла и в другом» - and the standing
  // ruling it offends is «мы ни за что не наказываем». A week with no match is a week with no match.
  //
  // ⚠ THE THIRD CASE IS DELIBERATELY UNTOUCHED, and the owner named it: retiring MID-MATCH through
  // injury. She walked on court and played, so that week is not match-free and never reaches here.
  //
  // ⭐ SHOOT-AWARE SINCE AD STEP 2 (§4a): the oracle pays nothing on a shoot week – the travel
  // figure was banked and the travel figure is what that week's rest is worth, skipped event or no.
  // ⭐ ROUND-25 COLLECT: the oracle also carries the phase base (variant C) and the masseur's
  // table since the merge – the two waves' parallel edits to this seam, folded into one expression.
  world.condition = clamp(
    world.condition + withheldFreeWeekRecovery(world, 'tournament'),    ECONOMY.condition.min,
    ECONOMY.condition.max,
  )
  // Close the week: the rank recompute + housekeeping that tickWeek deferred to the flow.
  recomputeRankAndMilestones(world)
  housekeep(world)
}

/** Tick up to `weeks`, stopping early when a tournament week spawns a reveal (the week is not
 *  closed until it resolves), an imminent affordable regional+ deadline appears, or funds cross
 *  below zero. A reveal already in progress blocks any advance until it is closed.
 *
 *  Returns EVERY reason the advance stopped, in STOP_PRECEDENCE order (empty = it ran its full
 *  course). R11-1 – THE BUG this shape fixes (owner 26.07, "the injury popup does not always
 *  appear – once it did, once it did not"): the old signature carried ONE reason and `break`ed on
 *  the first match in source order, so a fresh injury that landed on the season wrap-up week was
 *  reported as 'season-end' alone. The injury dialog never mounted, the toast had no copy for
 *  'injury' either (R10-16 moved it onto the dialog), and her auto-withdrawals happened with
 *  NOTHING shown. One week can be several things at once; the caller gets all of them and decides
 *  the order to show them in. ZERO extra RNG draws and the identical number of ticks – the loop
 *  still breaks on the first week that stops it, it just no longer forgets the rest of the news. */
export function advanceWeeks(world: WorldState, rng: Rng, weeks: number): StopReason[] {
  // ⚠⚠ THE REFUSALS MOVED TO `world/multiWeek.ts` (R2-13 phase 1), COMMENTS AND ORDER INTACT,
  // AND THEY MOVED FOR ONE REASON: a second week control has to know whether this function will move
  // time at all, and a button that answers that question for itself is the arrival gate's three
  // disagreeing answers all over again (composables/weekAction.ts spells that lesson out). One
  // predicate, two readers: the engine calls it here, and the shell re-asks the same list of the
  // snapshot through `blockingOverlay` + `pending`, pinned agreeing in tests/r2-13-advance-span.ts.
  // Nothing about the behaviour changed – zero ticks, one reason, the identical order.
  //
  // ⚠ THE COUNT USED TO BE WRITTEN «SIX» HERE and the list has held EIGHT since round 29 #3; the
  // number is `ADVANCE_REFUSALS`' and is not restated in prose any more (26.09, B-04 / T2.1).
  const refusal = advanceRefusal(world)
  if (refusal) return [refusal]
  const stops = new Set<StopReason>()
  for (let i = 0; i < weeks; i++) {
    const nextWeek = world.week + 1
    // Pre-tick guards bite only after the first tick, so a single step always progresses.
    if (i > 0) {
      // Round-9 leftover FIX (owner-visible bug, season-planner slice): the stop must only fire
      // for an event she could ACTUALLY enter. The availability gate alone let the sim halt at
      // W1/W3 with 0 points for regional/national deadlines she was nowhere near qualifying for,
      // so the point-band eligibility is now AND-ed in – the same isTierEligible enterEvent uses,
      // which also silences a tier she has OUTGROWN (points past the ceiling).
      const deadlineSoon = world.season.some(
        (e) =>
          // Ladder-up: "regional or national" was "anything above the entry tier" – it now reads
          // that way literally, so the J levels (the most expensive commitments in the game) stop
          // the sim too. NOTE for the tuning pass: with j30 every 2 weeks this roughly doubles how
          // often an advance halts once she is J-eligible; if that proves noisy the fix belongs in
          // a player-side "don't stop for tier X" preference, not in silently skipping the stop.
          e.tier !== 'local' &&
          !world.entries.includes(e.id) &&
          world.fundsCents >= TIERS[e.tier].entryFeeCents &&
          (e.deadlineWeek === world.week || e.deadlineWeek === nextWeek) &&
          // Round-10 R10-5: the point band AND the availability gate, read through the ONE helper
          // every other surface reads (`entryStatus` = band + availability). This used to be
          // `isTierEligible(...) && availabilityStatus(...) !== 'blocked'` spelled out here – the
          // same verdict, but a third independent copy of the rule. Don't stop-for-deadline on an
          // event she HARD-cannot enter (locked/outgrown on points, school exams, a booked family
          // vacation, injured); a FATIGUED event is still enterable (soft caution), so the sim MAY
          // stop so the player can make the tough call.
          entryStatus(world, e).level !== 'blocked',
      )
      if (deadlineSoon) {
        stops.add('deadline')
        break
      }
    }
    tickWeek(world, rng)
    // EVERY reason this week stops the advance is collected – no `break` between them, because a
    // week that is two things at once (the classic: she gets hurt in the season's last playing
    // week) must report both. The loop still breaks ONCE, after the week has been read out.
    //
    // ⭐⭐⭐ B-04 / T2.1 (26.09) – AND THE BLOCKING QUESTIONS ARE NOW READ FROM THEIR ONE OWNER,
    // WHICH IS THE ITEM. This stood as seven hand-written lines – tournament, knock, birthday, life,
    // and (below the reports) ending, fork, retirement – against `ADVANCE_REFUSALS`' EIGHT, and the
    // missing one was `'shoot-clash'`: a collision that opened mid-span was collected by nothing, so
    // the span rolled past the one question two of whose four answers stop being possible once the
    // week has begun. `openQuestions` (world/multiWeek.ts) is the list, once, and this reads it.
    //
    // ⚠ WHY IT MATTERED WHEN NOTHING A PLAYER CAN REACH CHANGED. The shell offers a span only inside
    // a layoff (`spanWeeksFor`) and a layoff nulls the clash (`shootClashWeek`'s first guard), so no
    // shipped press could arrive here – but the worker accepts `advance` for 1 to 52 weeks, so the
    // engine was leaning on the SCREEN's span arithmetic to stay correct, which is exactly what
    // invariant 1 forbids. The measured record for that lean: the life beat was missing from the
    // worker's copy of this list from v73 to v85, and the college year's copy has no beat today
    // (B-01, and that one is reached).
    //
    // ⚠ STILL COLLECTED, NEVER RETURNED EARLY, and the reasons each of the seven carried are in the
    // owner's own clauses now: R11-1's rule is that a week which is several things reports all of
    // them, and this member needs it more than most – the beat that raises the fork-opinion row
    // raises the FORK on the same tick by construction, so that week is two things every time it
    // happens. `STOP_PRECEDENCE` puts her dialog first, `answerFork` refuses until she is answered,
    // and the ORDER the owner returns is `ADVANCE_REFUSALS`' rather than precedence's – which costs
    // nothing here, because `stops` is a Set read out through `STOP_PRECEDENCE` at the bottom.
    //
    // ⚠ 'ending' COMES DOWN THIS ROAD TOO, from the same owner and for the same R11-1 reason it was
    // collected rather than returned for before: a week that is BOTH an ending and something else
    // (the classic: the season wraps up and she takes the offer on the same week) reports both, and
    // the epilogue is the surface that renders last anyway.
    for (const r of openQuestions(world)) stops.add(r)
    // Season just wrapped up (the tick landed on the year's first off-season week, week 49 of
    // the year): stop AFTER the wrap-up resolved, before week 50, so the season-summary popup
    // shows. Off-season weeks never carry a tournament, so this can't collide with 'tournament'.
    if (world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS) stops.add('season-end')
    // A FRESH injury (onset this very tick) halts the advance so the medical event surfaces;
    // an ongoing recovery never re-stops the sim on every week she sits out.
    if (world.injury !== null && world.injury.sinceWeek === world.week) stops.add('injury')
    // A medical withdrawal costs her an entry AND its fee, so it halts the advance for the same
    // reason a fresh injury does: the player must see it happen, not read about it later.
    if (world.medicalWithdrawalWeek === world.week) stops.add('medical')
    // R12-15: ...and so does a WALKOVER, for exactly the same reason. This was the owner's dead
    // click: the entry fee was forfeited, the trip never happened, and the only trace was one line
    // in a news feed the player had no reason to open – because the click that caused it had just
    // promised a tournament. Note this fires INDEPENDENTLY of 'injury': the walkover usually lands
    // a week or more AFTER the onset, when the injury is no longer fresh and nothing else stops.
    if (world.walkoverWeek === world.week) stops.add('walkover')
    // ⭐⭐ ROUND 23 #16 – THE ACADEMY'S VERDICT, and the reason it needed a stop is arithmetic rather
    // than luck. The owner: «Что-то я не увидел когда академия появилась, покрывающая расходы на
    // поездки». It fired correctly and it is still in his ledger 205 weeks later – but
    // `reviewAcademy` speaks at `week % 52 === 0`, this loop hard-stops at `% 52 === 49`, and the
    // shell's step is FOUR. 49 + 4 = 53, so the verdict week is the one week of the season a player
    // stepping by four can never land on, and `WeekRecapCard` renders only the current week. Measured
    // across seven careers: the landings round the boundary are `…, 49, 53, 57, …` in every one.
    //
    // ⚠ A SCHOLARSHIP IS NOT A COST, so it sits below the medical trio and the walkover – it can wait
    // a click, which is exactly what a stop is for. What it may not do is pass in silence, which is
    // the same complaint R12-15's walkover answered.
    if (academySpokeThisWeek(world)) stops.add('academy')
    // ⭐⭐ ROUND 46 #11c – A SPAN ENDS ON THE DAY SHE MARRIES OR THE CHILD IS BORN (the owner, 05.10: «Я дождался свадьбы, но
    // самого экрана этого события не было!»). `lifeMomentOf` is non-null exactly on the week a wedding or birth landed, and this
    // loop collects-then-breaks, so a four-week span that would have run THROUGH that day – and handed back a snapshot where the
    // moment is already gone – stops on it instead, the way the academy's verdict and an offer do. A one-week press is unchanged
    // (the loop runs once). RNG-safe: fewer ticks than asked, never different ones.
    if (lifeMomentOf(world) !== null) stops.add('life-moment')
    // ⭐ R2-13's OWN ITEM TEXT LISTS «OFFERS» AND PHASE 1 DID NOT STOP FOR ONE. The digest reported
    // the letter and the inbox dot lit, which is exactly the pair of surfaces round-23 #16 proved
    // insufficient for the academy's verdict: the parent has no reason to open an inbox he was not
    // told had anything in it, and unlike every other row a span can bury, this one EXPIRES.
    //
    // ⚠ THE RULE IS `stoppableOfferWeek`'s, NOT THIS LINE'S, and it is deliberately narrow: a
    // DECISION (`state: 'open'`) that ARRIVED this week. A notice does not stop the span and a letter
    // already lying open does not stop it a second time – see world/multiWeek.ts for both halves.
    // No new stopping model: one more `stops.add` in the same collect-then-break loop as the twelve
    // above it, so a week that is an offer AND something else still reports both (R11-1).
    if (stoppableOfferWeek(world)) stops.add('offer')
    if (world.fundsCents < 0) stops.add('funds')
    // ⚠ W2-ENDINGS' THREE – 'ending', 'fork' and 'retirement' – USED TO BE SPELLED HERE and are the
    // owner's now (B-04 / T2.1, 26.09); their argument rides with the `openQuestions` read above.
    // ⭐⭐ ROUND 29 #6 – THE LOOP BREAKS ON A REASON THAT HALTS, NOT ON EVERY REASON IT COLLECTED.
    // It used to be `if (stops.size > 0) break`, and the one member that difference is about is
    // 'season-end': a press made at the tail of a season bought two weeks of a six-week gap and
    // handed back the wrap-up, which is the owner's «увидел сообщение о конце года ... а календарь
    // так и остался на 51й неделе». `SPAN_REPORTS_ONLY` carries the whole argument for why that one
    // reason may pass and no other may – including the measured half, that the recap dialog reads
    // the SNAPSHOT and not this reason, so nothing about it is lost.
    //
    // ⚠ A ONE-WEEK PRESS IS BYTE-IDENTICAL EITHER WAY: the loop runs once and ends on its own
    // counter, so this line can only ever be reached by a span.
    if ([...stops].some((r) => !SPAN_REPORTS_ONLY.has(r))) break
  }
  // Precedence order, not insertion order: the caller renders them in this sequence, and the
  // medical pair leads it so nothing can bury them (see STOP_PRECEDENCE).
  return STOP_PRECEDENCE.filter((r) => stops.has(r))
}

/** ⭐ ROUND 24, RULE 2 – WHAT `resumeFromCollege` SAYS WHEN A REVEAL IS STILL OPEN. Exported so a
 *  test can pin the refusal without pinning a spelling, on the precedent of `RELEASE_LINE_PREFIX`:
 *  the wording is player-facing (it reaches the toast through the worker's error channel) and a
 *  string literal copied into a test is a rename that breaks a report in silence.
 *
 *  ⚠ IT NAMES THE STATE AND THE WAY OUT, which is R10-16's doctrine – a refused control with no
 *  reason on screen is the bug. Nothing here shames the player: it is the game's own bookkeeping. */
export const COLLEGE_REVEAL_REFUSAL =
  'A tournament is still waiting to be resolved – close it before spending another college year'

/** ⭐⭐⭐ THE QUESTIONS A COLLEGE YEAR MAY PAUSE ON – the two EXCEPTIONS to «it collects, it does not
 *  halt», which is the owner's own standing ruling for this loop (round 24, quoted at
 *  `resumeFromCollege`: «родители не будут посещать все игры в колледже», the year is ONE click).
 *
 *  ⚠⚠ THE RULING IS RECORDED HERE SO IT IS NOT REDISCOVERED AS A BUG. A reader who finds a loop
 *  that halts where its own note says it collects will «fix» the halt. Both members are exceptions
 *  he granted, each by name and each with a date:
 *    · `'birthday'` – ROUND 24, 22.08: «да, день рождения делай». `chooseGift` records the gift
 *      against `world.week`, so the answer has to land ON the birthday week: it cannot be collected,
 *      it has to be ASKED, on its own week.
 *    · `'life'` – RULING 2(a), 26.09 (B-01). The same argument one rung stronger: a beat is HER
 *      SPEAKING, so a year that outran one would answer her by walking away – an answer nobody chose
 *      and nobody would ever be told about (the worker's own sentence for why `▶▶ 52` stops for it).
 *      MEASURED before the ruling: 23 of 217 year-calls ticked past at least one unanswered blocking
 *      row, 15 `met` and 10 `ended`, and each of those cards then surfaced weeks late, worded as
 *      news, with its own break-up card queued behind it.
 *
 *  ⚠ AND THE SIX MEMBERS THAT ARE NOT HERE, because an absence in a set like this has to be read as
 *  a decision rather than as an oversight. `'ending'` is the college latch itself, which this command
 *  CLEARS – pausing for it would be pausing for the state it exists to lift. `'tournament'` has its
 *  own treatment two guards up, and it is a THROW rather than a pause for a stated reason (no surface
 *  in the app can draw a tour reveal behind the epilogue). `'knock'` cannot be raised inside the
 *  freeze (`world/phaseGrowth.ts`: `if (!inCollege(world)) rollKnock(world)`), `'fork'` is answered
 *  by the time the latch is on, `'retirement'` is the tour's own question, and `'shoot-clash'`
 *  requires an ENTERED event on the week ahead, which rule 1 releases at the fork and rule 3 keeps
 *  released. None of the six is reachable here; if one becomes reachable it needs its own ruling.
 *
 *  ⚠ THE REVEALS ARE NOT IN THIS SET EITHER, and that is not an omission: `'call-up'` and
 *  `'college-league'` are not `ADVANCE_REFUSALS` members at all (no advance can produce them –
 *  `tests/r2-13-advance-span.test.ts` pins that as an absence), so they are this loop's own clauses
 *  and keep their own `callUpPlayedThisWeek` / `collegeLeaguePlayedThisWeek` reads. */
const COLLEGE_PAUSES: ReadonlySet<StopReason> = new Set<StopReason>(['birthday', 'life'])

/** «ANOTHER YEAR» – the one command that CLEARS an ending (contract §5.1).
 *
 *  College is the only ending that resumes, and this is where it does. The latch comes off, ONE year
 *  of weeks is spent, the year is banked, and the latch goes back on with the next year's date under
 *  it – until she has spent all four or answers `endCollegeEarly`.
 *
 *  ⭐⭐ P5 – IT USED TO SPEND FOUR YEARS IN ONE CALL AND THE BUTTON SAID «Four years later –».
 *  Reality's own case is one year and not four (Diana Shnaider left NC State after about a season
 *  and is inside the WTA top 15), so the four-year block was the wrong SHAPE as well as an empty
 *  one. Four years, one at a time, is three real questions and a fourth year that is not one –
 *  `CollegeProgressView.final` is what carries that difference to the screen.
 *
 *  ⚠ THE WEEKS ARE REALLY TICKED, not skipped over. The world has to LIVE those years: the cohort
 *  ages, the conveyor turns it over, the field she will come back to is not the field she left, and
 *  she keeps developing on the age curve. A `world.week += 52` would have handed back a world whose
 *  ranking table, calendar and rivals were all a year stale.
 *
 *  ⚠⚠ AND HER RANKING GOES ON ITS OWN, WITH NO RULE WRITTEN FOR IT – WHICH IS NOW MEASURED RATHER
 *  THAN ASSERTED. The old note here said she "arrives at twenty-two on zero points, below the whole
 *  field – «no ranking at all»". Half of that is false and the half that is true is not news:
 *  measured over 52 careers at the fork (docs/specs/college-as-a-second-act-2026-08.md §4) her
 *  professional rank is **#290 before the freeze and #290 after it**, IDENTICAL, because she was
 *  already off the list the week she walked in. What the four years actually cost is the ladder
 *  moving without her: the same seeds spent on tour finish at **#169**. The cost is 121 places she
 *  did not lose but never gained, and the price of them is **$106,699** – college banks $152,243
 *  against the tour's $45,544. That is the trade the year card now states, and it is why the
 *  question at each boundary is a real one.
 *
 *  ⚠ THE LOOP BREAKS ON A FRESH ENDING. A career-ending injury can land at college – she is playing
 *  a lot of tennis – and when it does she never comes back, which is a true story rather than an
 *  edge case to be defended against.
 *
 *  ⭐⭐⭐ AND IT NOW REPORTS THE WEEK THAT IS NOT HERS – the college wave, the owner's item 3:
 *  «в каждом году минимум одни соревнования, которые можно смотреть так же, как и наши текущие».
 *
 *  ⚠⚠ THE HAZARD THIS ANSWERS IS ROUND 23 #16's, ARRIVING FROM THE OTHER SIDE. That item was an
 *  academy verdict firing on the one week a `+4` advance could never land on; this is a national-team
 *  week firing inside a loop that spends FIFTY-TWO weeks with nobody watching. Now that the rubbers
 *  are really played (`world/college.ts`), a year that produced three matches and reported one
 *  sentence would be the same silence with better tennis behind it.
 *
 *  ⚠ IT COLLECTS, IT DOES NOT HALT – and that is the owner's own ruling rather than a shortcut. He
 *  designed college as the SHORTCUT: «1-2 национальных выезда в год и перелистывание 1 года за клик»,
 *  and «родители не будут посещать все игры в колледже» is why `COLLEGE_TRIP_WEEKS` shrank a
 *  thirteen-week season to two trips. A year that stopped in the middle and demanded a second click
 *  to finish itself would be the playable season the fork exists to skip. So the year is still ONE
 *  click, and what changes is that the click hands back the reason – `mutate` puts it on the
 *  snapshot exactly as it does for an advance, the epilogue's year card offers the rubbers to
 *  replay, and the toast says the week happened. `stops` is a Set filtered through STOP_PRECEDENCE
 *  for the identical reason `advanceWeeks` does it: one call can be several things at once (the
 *  classic here: a call-up in April and the ending re-latched in December), and the caller decides
 *  the order to show them in.
 *
 *  ⭐⭐⭐ ROUND 24 – WITH ONE EXCEPTION, AND IT IS A QUESTION RATHER THAN A REPORT: HER BIRTHDAY
 *  (the owner, 22.08: «да, день рождения делай»). A call-up is news and can be read at the year's
 *  end; a birthday is the one popup the owner asked to fire ALWAYS, all four of its buttons are
 *  answers, and `chooseGift` records against `world.week` – so it cannot be collected, it has to be
 *  ASKED, on its own week. The year therefore PAUSES there: the loop breaks, the latch goes back on
 *  with the SAME year's end under it (`pendingYearStart` keeps the opening measurements honest), the
 *  dialog renders over the live college Home shell, and the next press finishes the year. This does
 *  not reopen the playable-season trade above – it is one extra click in the years that hold a
 *  birthday, for the beat the owner explicitly asked to stop for, exactly as the tour's own `+4`
 *  stops for it. */
export function resumeFromCollege(world: WorldState, rng: Rng): StopReason[] {
  const college = world.college
  if (!college || college.doneWeek !== null) throw new Error('She is not at college')
  if (!world.ending || world.ending.type !== 'college') throw new Error('This career is not on the college branch')
  // ⭐⭐⭐ ROUND 24, RULE 2 – A YEAR MAY NOT BE SPENT OVER AN UNANSWERED REVEAL. THIS IS THE RULE THAT
  // CLOSES THE CLASS, and it is the guard `advanceWeeks` (`if (world.pendingTournament) return
  // ['tournament']`) and the worker's dev `tick` (P6 (c): "a refusal at entry, a stop mid-loop") have
  // both had for waves. This command – the only one in the game that CLEARS an ending, and the only
  // other producer of stop reasons – never had it, and that is the whole of why the owner's career
  // could die in silence: with a reveal open, `tickWeek` skips its entire step 5-6, so every week
  // after it costs its RNG draws and buys nothing. His save proves the weeks really ticked
  // (`rngMain.n` 166k at week 474) and that the world simply had nothing in it.
  //
  // ⚠⚠ A REFUSAL AND NOT A STOP, AND THE EPILOGUE IS THE REASON. `advanceWeeks` can return
  // 'tournament' because its caller is the app shell, where `TournamentFlow` mounts and the sticky
  // bar's primary button re-opens it on every tab. THIS caller is behind the epilogue: `App.vue`
  // branches `EndingScreen` with `v-else-if` ABOVE the shell, `TournamentFlow` lives inside the
  // `v-else`, and `blockingOverlay`'s INTERRUPTS set lets 'ending' show over a pending reveal – so
  // while the college latch is on there is no surface in the app that can draw the reveal at all. A
  // stop reason handed to a screen that cannot act on it is a silent no-op, which is the failure
  // being fixed rather than a fix. A throw is loud, and through the worker it is also FREE: `mutate`
  // runs on a candidate clone, so a refusal provably leaves the committed career without one tick
  // applied – close the reveal (or repair it) and the same click works.
  //
  // ⚠ MID-LOOP TOO, ON THE SAME CONTRACT AND FOR THE SAME REASON. After rule 3 no reveal can be
  // CONSTRUCTED inside the freeze, so this is a tripwire over a state that should not exist; if a
  // later wave finds a new way to open one, the career stops at that week with nothing committed
  // instead of ticking out the year and the three after it.
  if (world.pendingTournament) throw new Error(COLLEGE_REVEAL_REFUSAL)
  // ⭐⭐⭐ ROUND 26 #6 – AND NOT OVER A CHAMPIONSHIP HE HAS NOT WATCHED. The same contract as the
  // line above and the deliberate opposite treatment, which is the whole reconciliation this item
  // needed. Round 24's refusal THROWS because a `pendingTournament` inside the freeze had no surface
  // anywhere in the app – «a stop reason handed to a screen that cannot act on it is a silent no-op,
  // which is the failure being fixed rather than a fix». This state is the other case: it is
  // HEALTHY, it is raised on purpose, and D1's Home shell draws it – `snapshot.pending` carries it,
  // `TournamentFlow` mounts over the shell, the college bar stands down while it is up
  // (HomeScreen's own `!game.snapshot?.pending`) and App.vue's global week bar offers the resume
  // press on every tab. So it is a RETURN and not a throw, on `pendingBirthday`'s own argument one
  // line down: nothing is mutated, nothing is drawn, and the same click works the moment the reveal
  // is answered. Round 24's law is not weakened by this – `world.pendingTournament` is still never
  // written inside the freeze and the throw above is still unreachable.
  if (collegeLeagueRevealOpen(world)) return ['college-league']
  // ⭐⭐⭐ ROUND 27 #6 – AND NOT OVER A TIE HE HAS NOT WATCHED EITHER. The same contract, the same
  // treatment and the same reason as the line above: the state is HEALTHY, it is raised on purpose,
  // and the app draws it – `snapshot.pending` carries it, `TournamentFlow` mounts over the college
  // Home shell, and the global week bar offers the resume press. A RETURN and not a throw: nothing is
  // mutated, nothing is drawn, and the same click works the moment the reveal is answered.
  if (callUpRevealOpen(world)) return ['call-up']
  // ⭐⭐⭐ ROUND 24 – AND NOT OVER AN UNANSWERED BIRTHDAY EITHER (the owner's «да, день рождения
  // делай»). The identical contract `advanceWeeks` keeps at its own entry, engine-side because the
  // worker is not the gate (invariant 1): the dialog covers the button, but a stale screen must not
  // be able to spend a year past the one popup the owner asked to fire ALWAYS. A RETURN and not a
  // throw, like the college reveal above it and unlike round 24's `pendingTournament` throw two
  // guards up – the test is whether the state HAS A SURFACE, and this one does: the dialog is on
  // screen off the snapshot field, `chooseGift` is its exit, and the same click works the moment it
  // is answered.
  // Nothing is mutated and nothing is drawn; `['birthday']` is the same no-op report the advance
  // gives, so the caller cannot mistake a refusal for a spent year.
  //
  // ⭐⭐⭐ B-01 / T2.3 (26.09) – AND HER CARD JOINS THE BIRTHDAY HERE, READ FROM THE ONE OWNER. The
  // set is `COLLEGE_PAUSES` over `openQuestions(world)` (world/multiWeek.ts): the pause set is no
  // longer a fifth hand-written copy of «which questions stop time», which is the drift B-04 closed
  // and this loop was the one place it had already cost a player something. Both members return with
  // ZERO ticks, on the identical contract, for the identical reason – the state has a SURFACE, so the
  // same click works the moment it is answered. STOP_PRECEDENCE-ordered because a rest state can hold
  // both at once and R11-1's rule is that the caller gets all of it.
  const standing = openQuestions(world).filter((r) => COLLEGE_PAUSES.has(r))
  if (standing.length > 0) return STOP_PRECEDENCE.filter((r) => standing.includes(r))
  // ⭐ THE YEAR IN PROGRESS, OR A FRESH ONE. `pendingYearStart` is non-null exactly when the last
  // press paused the year mid-flight – on her birthday since round 24, and on the championship since
  // round 26 #6: the year's opening measurements are HISTORY by now (her
  // skill, her rank and the family balance have moved since), so they are persisted at the pause and
  // read back here rather than re-measured – or the banked year would open at the birthday week with
  // the wrong four numbers. `?? null` because the field is optional (see CollegeState: D2 owns
  // `answerFork` next, so enrolment does not write it; absent and null mean the same thing).
  const start = college.pendingYearStart ?? openCollegeYear(world)
  // Off the year's own OPENING, not off `world.week`: for a fresh year the two are the same week,
  // and for a resumed one this is what keeps the academic boundary where the first press put it –
  // a year paused for a cake is finished, not restarted.
  const yearEnds = Math.min(college.untilWeek, start.week + WEEKS_PER_YEAR)
  // ⭐⭐⭐ ROUND 26 #10, SECOND PASS – WHERE THE PRESS STARTED, so the row written when it stops can
  // be gated on the press having actually moved time. See `announceCampusInterlude` below the loop.
  const pressFrom = world.week
  world.ending = null
  const stops = new Set<StopReason>()
  while (world.week < yearEnds && world.ending === null) {
    tickWeek(world, rng)
    if (world.pendingTournament) throw new Error(COLLEGE_REVEAL_REFUSAL)
    // ⚠ ASKED AFTER THE TICK AND OF THE WORLD, never threaded back through `tickWeek` – the whole
    // point of `callUpPlayedThisWeek` being a predicate. One `stops.add`, exactly like the academy's.
    // ⚠ ONE `pauseHere` FOR ALL THREE QUESTIONS, hoisted above the first of them since round 27 #6:
    // the rule is R11-1's – a week can be several things at once, and every one of them has to reach
    // the `stops` set before anything breaks the loop.
    let pauseHere = false
    // ⭐⭐⭐ ROUND 27 #6 – AND IT NOW BREAKS, WHICH IS THE ITEM. Round 25 played the rubbers and round
    // 26 left the report where it was, so the week was over and forty weeks behind him by the time
    // the year handed the screen back: «матчи только постфактум». The year PAUSES on the tie instead,
    // in the shape the championship two branches down already uses.
    //
    // ⚠ THE PAUSE READS `callUpRevealOpen` AND NOT `callUpPlayedThisWeek`, and the two differ by two
    // things that matter: a career migrated from v63 mid-freeze has no reveal for a tie it already
    // lived, and a year in which she was NAMED AND SAT has no rubber to walk (`resolveCallUp` opens
    // no reveal on `rubbersPlayed === 0`). Neither may be halted in front of a flow with nothing in
    // it – and both still REPORT, because `stops.add` is outside the question.
    if (callUpPlayedThisWeek(world)) {
      stops.add('call-up')
      if (callUpRevealOpen(world)) pauseHere = true
    }
    // ⭐⭐⭐ ROUND 24 – AND THE ONE WEEK THAT ALWAYS HAPPENS. Unlike every other member of this set
    // the championship is not a roll, so this line fires in EVERY college year – which is the point:
    // a year that produced a tournament and reported nothing would be the silence round 23 #16 was
    // about, with better tennis behind it.
    // ⭐⭐⭐ ROUND 26 #6 – AND IT NOW BREAKS, WHICH IS THE ITEM. Round 24 reported the week and kept
    // ticking, so the championship was over, banked and forty weeks behind him by the time the year
    // handed the screen back: «опять сообщили только постфактум». The year PAUSES on the fixture
    // instead, in the shape her birthday already uses one branch down – the loop breaks, the latch
    // goes back on with the SAME year's end under it, the opening measurements are persisted for the
    // press that finishes it, and the reveal renders on the live Home shell.
    //
    // ⚠ THE STOP READS `collegeLeagueRevealOpen` AND NOT `collegeLeaguePlayedThisWeek`, and the two
    // differ by one thing that matters: a career migrated from v59 mid-freeze has no reveal for a
    // championship it already lived, and must not be halted in front of a flow with nothing to walk.
    if (collegeLeaguePlayedThisWeek(world)) {
      stops.add('college-league')
      if (collegeLeagueRevealOpen(world)) pauseHere = true
    }
    // ⭐⭐⭐ ROUND 24 – HER BIRTHDAY, THE ONE MID-YEAR STOP. Unlike the two reports above it BREAKS,
    // because it is a QUESTION: `chooseGift` records the gift against `world.week`, so the answer
    // has to land ON the birthday week and a blocking dialog cannot be answered inside this loop –
    // the exact sentence `pendingBirthday`'s old college exclusion was built on, now honoured by
    // pausing instead of by silence. Collected before the break so a birthday that lands on the
    // championship week reports both (R11-1's rule: one week can be several things at once).
    //
    // ⭐⭐⭐ B-01 / T2.3 (26.09) – AND IT IS NO LONGER THE ONE MID-YEAR STOP: HER CARD PAUSES THE YEAR
    // THE SAME WAY (the owner's ruling 2(a), 26.09), read from the one owner of «which questions stop
    // time» rather than re-listed here. `COLLEGE_PAUSES` above carries the ruling, its date and the
    // reason each of the other six members is NOT in it – the owner's standing rule for this loop is
    // «it collects, it does not halt», so every exception to it is recorded rather than inferred.
    //
    // ⚠ THE LIFE ROLLS RUN AT COLLEGE BY DESIGN and always have (`resolveBodyAndPlanner` carries no
    // `inCollege` guard – only the knock is suppressed), so this is the state the year was walking
    // past: MEASURED at 23 of 217 year-calls, 15 `met` and 10 `ended`.
    //
    // ⚠ RNG-SAFE, WHICH IS WHY A PAUSE COULD BE ADDED AT ALL. `rngMain` is persisted and the year
    // resumes from `pendingYearStart` – the birthday's own mechanism since round 24 – so the weeks,
    // the keys and the draws of every year that holds no blocking beat are byte-identical.
    for (const r of openQuestions(world)) {
      if (!COLLEGE_PAUSES.has(r)) continue
      stops.add(r)
      pauseHere = true
    }
    // ⚠⚠ ONE BREAK FOR BOTH, AND IT IS R11-1's RULE RATHER THAN A TIDY-UP. A birthday landing on the
    // championship week must report BOTH – the sentence above says so and `college-birthday.test.ts`
    // measures it – so a `break` inside the championship arm would swallow the cake exactly the way
    // the lost-injury popup was swallowed by the season wrap. Both questions are then open at the
    // pause, and the UI already knows what to do with that: `popupMayShow` holds the gift dialog
    // behind the reveal (`screenBusy`), the reveal has a guaranteed exit, and the birthday is the
    // next thing on screen when it closes.
    if (pauseHere) break
  }
  // ⭐⭐⭐ ROUND 26 #10, SECOND PASS – THE ONE ROW THAT CANNOT BE STALE. The owner, after the first
  // pass: «предпоследняя новость были из мира "до колледжа" на протяжении всей учебы… я бы хотел,
  // чтобы "мир жил" и пока она в колледже, пусть и сжато». Measured over 48 rest states, the card at
  // rest reaches ninety weeks back and covers 45% of the weeks a press actually spends, so a line
  // written on an ordinary freeze week is a line he sees by luck. This one is written ON the rest
  // week itself – the week at the very top of the feed he is handed – which is what makes it
  // CURRENT by construction rather than by budget. `world/fieldNews.ts` carries the whole argument,
  // the arithmetic and the two rejected alternatives.
  //
  // ⚠ HERE AND NOT IN THE FOUR RETURNS BELOW: every exit from this command – a banked year, a
  // birthday pause, a championship pause, the graduating press – hands back the same Home shell, and
  // four copies of one call is how three of them come to disagree. ⚠ GATED ON THE PRESS HAVING MOVED
  // TIME, so a press that only ticked into a refusal writes nothing; and gated on the freeze still
  // being the state, because a career-ending injury mid-year hands back an EPILOGUE, and the tour's
  // succession is not what that screen is for.
  if (world.week > pressFrom && world.ending === null) announceCampusInterlude(world)
  // ⭐⭐⭐ THE PAUSE – the year stops mid-flight (for her birthday, or since round 26 #6 for the
  // championship the player is being shown) and is NOT banked. The latch goes
  // back on with the SAME year's end under it, the opening measurements are persisted for the press
  // that finishes it, and the dialog renders over the college Home shell (blockingOverlay lets the
  // birthday through exactly this one latch). Assigned directly rather than through `latchEnding`,
  // deliberately: the latch writes a kept «College years – N of 4…» milestone per call, which is the
  // YEAR's row – a paused year is the same year continued, and a second row about it every birthday
  // would be the feed announcing an event that did not happen.
  //
  // ⭐⭐⭐ ROUND 26 #6 – AND THE CHAMPIONSHIP PAUSES IT THE SAME WAY, THROUGH THE SAME BLOCK. Two
  // causes, one pause, deliberately: the year's opening measurements, the latch and its `resumesWeek`
  // are the same three facts whichever question stopped the loop, and a second copy of this block is
  // how two pauses come to disagree about where the academic year ends. A birthday landing ON the
  // championship week takes this branch once and both stops are already in the set (R11-1).
  //
  // ⭐⭐⭐ B-01 / T2.3 (26.09) – AND HER CARD PAUSES IT THROUGH THIS SAME BLOCK, for round 26 #6's own
  // reason said once more: a THIRD copy of the latch and its `resumesWeek` is how three pauses come
  // to disagree about where the academic year ends. The cause is read from `openQuestions` through
  // `COLLEGE_PAUSES`, which is the same list the loop broke on – so the branch cannot be reachable by
  // a question the loop does not pause for, or unreachable by one it does.
  if (
    world.ending === null &&
    world.week < yearEnds &&
    (openQuestions(world).some((r) => COLLEGE_PAUSES.has(r)) || collegeLeagueRevealOpen(world) || callUpRevealOpen(world))
  ) {
    college.pendingYearStart = start
    world.ending = {
      type: 'college',
      week: world.week,
      ageYears: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay, world.startYear),
      detail: `${college.years.length} of ${ENDINGS.collegeYears} years on the scholarship`,
      resumesWeek: yearEnds,
    }
    stops.add('ending')
    return STOP_PRECEDENCE.filter((r) => stops.has(r))
  }
  // ⚠ A YEAR CUT SHORT BY AN ENDING IS STILL BANKED. The album's last page is allowed to say what
  // she was doing when it happened, and a row that stops mid-year is the honest record of that.
  // (`bankCollegeYear` also clears `pendingYearStart`, so a resumed year cannot leak its start into
  // the next one.) ⚠ A BIRTHDAY ON THE BOUNDARY WEEK ITSELF takes this path, not the pause: the year
  // is genuinely over, so it banks and re-latches (or graduates) as always – and the prompt simply
  // stays pending at the rest state, where the dialog shows and the entry guard above holds the next
  // press until it is answered. Nothing is swallowed; 'birthday' is already in the stops.
  bankCollegeYear(world, start)
  if (world.ending !== null) {
    college.doneWeek = world.week
    // ⚠ 'ending' JOINS THE SET RATHER THAN REPLACING IT, which is R11-1's rule kept on a second
    // caller: the year she got hurt out of the game may ALSO be the year her country called, and a
    // return that reported one of them would be the lost-injury-popup bug wearing college colours.
    stops.add('ending')
    return STOP_PRECEDENCE.filter((r) => stops.has(r))
  }
  if (world.week >= college.untilWeek) {
    finishCollege(world)
    // ⚠ NO 'ending' HERE, AND THE ASYMMETRY IS THE FACT. `finishCollege` takes the latch OFF for
    // good – she has graduated and the tab shell comes back – so the toast this returns is the one
    // the player can actually read, on the one call of the four where nothing covers the screen.
    return STOP_PRECEDENCE.filter((r) => stops.has(r))
  }
  // ⭐ THE LATCH GOES BACK ON, and this is the whole of "one year at a time". The screen that asks
  // «another year?» is the epilogue screen, so the epilogue has to still be there to ask it – and
  // `buildEndingView` fills `college` from `collegeProgressOf`, which is null the moment she leaves.
  latchEnding(world, {
    type: 'college',
    week: world.week,
    ageYears: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay, world.startYear),
    detail: `${college.years.length} of ${ENDINGS.collegeYears} years on the scholarship`,
    resumesWeek: Math.min(college.untilWeek, world.week + WEEKS_PER_YEAR),
  })
  stops.add('ending')
  return STOP_PRECEDENCE.filter((r) => stops.has(r))
}

/** ⭐ THE EARLY RETURN – «I am going back on tour now», answered at a year boundary.
 *
 *  ⚠ IT IS A SEPARATE COMMAND AND NOT A FLAG ON `resumeFromCollege`, because the two answers do
 *  opposite things to the latch: one puts it back on, this one takes it off for good. Folding them
 *  into one call with a boolean would have made the most expensive click in this part of the game
 *  depend on an argument nobody reads.
 *
 *  ⚠ AND IT REFUSES ON A CAREER THAT IS NOT AT A BOUNDARY, engine-side, because the worker is not
 *  the gate (CLAUDE.md invariant 1). The screen stops drawing the button; this is what makes that a
 *  rule rather than a decoration. */
export function endCollegeEarly(world: WorldState): void {
  const college = world.college
  if (!college || college.doneWeek !== null) throw new Error('She is not at college')
  if (!world.ending || world.ending.type !== 'college') throw new Error('This career is not on the college branch')
  if (college.years.length === 0) throw new Error('She has not spent a year there yet')
  // ⭐ ROUND 24 – "AT A BOUNDARY" GAINED A SECOND FAILURE MODE AND THIS CLOSES IT. The birthday
  // pause created the first mid-year rest state this command can be reached from, and taking the
  // latch off there would move `untilWeek` back to a week in the middle of an academic year and
  // leave the half-spent year unbanked – a shape no reader of `college.years` expects (`isFullYear`,
  // the album, the graduation card all assume years bank whole or are cut by an ENDING). The
  // early return is answered at year boundaries, which is this function's own stated contract; the
  // screen stands its button down too, and this is what makes that a rule rather than a decoration.
  if ((college.pendingYearStart ?? null) !== null) {
    throw new Error('The year she started is still running – it finishes first, then she can come back on tour')
  }
  leaveCollegeState(world)
  world.ending = null
  addEvent(world, {
    week: world.week,
    type: 'milestone',
    keep: true,
    text: collegeEpilogueLine(world),
  })
}

/** The four years, spent. One place, so the early return and the full course write the same row. */
function finishCollege(world: WorldState): void {
  leaveCollegeState(world)
  addEvent(world, {
    week: world.week,
    type: 'milestone',
    keep: true,
    text: collegeEpilogueLine(world),
  })
}
