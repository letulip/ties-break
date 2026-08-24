// ⭐ R2-10 STEP 2, PHASE 3 – HER BODY AND HER OWN COMPETITION.
//
// THE THIRD NAMED PHASE OF THE WEEKLY TICK, in two halves because the tick has always had two: what
// happens to HER (the injury roll, the condition she accrues, the knock's credit, the summer's
// bill, the booked week types, the physio) and then what happens at the tournament SHE entered (the
// doctor on arrival, the fares, the shadow run that is stashed for the reveal flow, and the
// masseur's own bill, which has to know whether a fare was charged this very week).
//
// ⚠ THE WEEK'S DERIVATIONS SIT BETWEEN THE TWO HALVES AND ARE NOT IN THIS FILE. `deriveWeekField`
// lives in world/weekField.ts because the AI side reads it too – see that module's header. The
// order in `tickWeek` is unchanged: body, then the fold, then her competition.
//
// ⚠ A MOVE AND NOT A REWRITE: `tickWeek`'s steps 1c and 2 in their original order, comment for
// comment, step numbers unrenumbered. Neither half takes `rng`: ZERO MAIN DRAWS, which is what
// makes the position of this phase between two MAIN-drawing steps (`resolveBaseCosts` above,
// `driftCohort` below) safe by construction rather than by inspection. Her run draws on
// `seed:kidtour:<event.id>`, the injury roll on `seed:injury:<week>`, the physio on
// `seed:physio:<week>` – all purpose-scoped, none of them MAIN.
import type { MatchPlayer } from '../match/types'
import type { AiPlayer, RankingRow, SeasonEvent } from '../season/types'
import type { PendingTournament, WorldState } from './state'
import type { WeekField } from './weekField'
import { rivalField } from './weekField'
import { rngFromSeed } from '../rng'
import { ECONOMY } from '../economy'
import { clamp } from '../condition'
import { KNOCK_REST_CONDITION, knockRestWeek } from '../knock'
import { TIERS } from '../season/calendar'
import { BEST_N_BY_TRACK, computeRanking } from '../season/ranking'
import { mergedWtaRanking, universeForTier } from '../season/fieldPros'
import { kidSeedIndexIn, runTournament, selectEntrants, weekFieldExclusion } from '../season/tournament'
import { KID_ID } from './constants'
import { addEvent } from './ledger'
import { cohortIds, fieldProsOf, inTrack, rankingFor } from './ladder'
import { withinAnnualEntryLimit } from './entryCaps'
import { fallbackPlayer } from './matchNews'
import { kidMatchPlayerFor } from './player'
import { expireRecoveryBuff, resolvePractice, resolveVacation } from './planner'
import { resolvePhysio, rollInjury } from './injury'
import { isCompetitionWeek } from './knock'
import { accrueCondition, arrivalStatus, medicalClearance, withheldFreeWeekRecovery } from './medical'
import { summerConditionCost } from './summer'
import { inCollege } from './college'
import { resolveMasseur, resolveMasseurReturn } from './masseur'
import { chargeCoachTravel, chargeMasseurTravel, chargeTravel, coachTravelFareFor } from './sponsors'

// Compute the kid's full shadow tournament: same event-scoped RNG, same entrant selection, same
// bracket. Emits NO events and awards NO points – that is deferred to reveal/finalize. Snapshots
// the kid + every opponent she faces at PRE-drift skills so the revealed match records are stable
// no matter how the cohort drifts afterwards; since rival-life those snapshots are the FATIGUED,
// surface-styled opponents, i.e. exactly who she played, so a replay reproduces the match.
function computeShadowTournament(
  world: WorldState,
  event: SeasonEvent,
  ranking: RankingRow[],
  fatigue: Map<string, number>,
  /** the field's professional entries in the trailing year (`rivalProEntries`), for the AER gate on
   *  the universe below. REQUIRED and not optional: an entry rule handed `undefined` is a rule that
   *  does nothing, and a silent null arm is the one failure mode this gate cannot afford. */
  entries: ReadonlyMap<string, number>,
): PendingTournament {
  // R9-19 coupling ON: the kid plays at her CURRENT condition (post this week's accrual –
  // step 1c runs before step 2), on the event's surface as her play style meets it (surface-style).
  // The SCALED player is both what runs the bracket and what is snapshotted into `players`, so
  // revealed records and replays stay byte-identical no matter how her condition moves afterwards –
  // and the run's every round shares this ONE build. Fractional skills are fine for the match engine.
  // ⭐ ...AND WHETHER HIS COACH IS AT THIS ONE, which is the FARE's own question and therefore the
  // fare's own answer: `coachTravelFareFor` carries the stance, the "somebody to send" clause and
  // the W-series gate together, so the helping cannot drift away from the money (owner, 15.08:
  // «поездки С тренером открываются на w серии с призами»).
  const kid = kidMatchPlayerFor(world, event.surface, coachTravelFareFor(world, event) > 0)
  const kidRng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
  // ⚠ HER W-TIER DRAWS ARE MADE OF THE MERGED FIELD (living-field phase W, 01.08). For a W-track
  // event the candidate universe becomes LIVE cohort ∪ field pros and the positions come from the
  // MERGED W standings – which is the whole fix: a W15 used to draw by percentile over the MIXED
  // table (median entrant ~53/200, mean skill 50.2, weaker than a J300 field), because the mixed
  // table was the only table there was. The percentile-band machinery on top is byte-identical.
  //
  // Built to the same independence rule as `aiRanking`: LIVE rows fold WITHOUT the kid (results
  // and roster both), so who turns up to her W15 never depends on what she has done – the exact
  // property the mixed `ranking` argument already has for every other tier. Field pros carry no
  // fatigue ledger in phase W, so `fatigue` simply has no entry for them and `rivalField` reads
  // them fresh at 100 – a real simplification, named in the spec as phase-2 work, and conservative
  // in the right direction (the field she meets is at its best).
  //
  // RNG: everything below stays on `seed:kidtour:<id>`, the event's own sub-stream. The candidate
  // COUNT changed for the three W rungs – a documented event-sub-stream composition change, the
  // same class as every band/age re-pick – and the MAIN capture is untouched by construction.
  const isW = TIERS[event.tier].track === 'wta'
  const pros = isW ? fieldProsOf(world) : null
  // ⭐⭐ AND THE AGE-ELIGIBILITY RULE NOW GATES THE FIELD TOO (owner, 19.08), on the universe and
  // before the bands, for the reason `withinAnnualEntryLimit` states in full: both of
  // `selectEntrants`' backfills reach outside the entrant window, so a gate applied later would be
  // walked around. Non-capped tiers get the identical universe back, by reference.
  const universe = withinAnnualEntryLimit(
    pros ? universeForTier(event.tier, world.cohort, pros) : world.cohort,
    event.tier,
    entries,
    TIERS[event.tier].drawSize,
  ) as AiPlayer[]
  const selRanking = pros
    ? mergedWtaRanking(
        computeRanking(
          world.results.filter((r) => r.playerId !== KID_ID),
          world.week,
          BEST_N_BY_TRACK.wta,
          cohortIds(world),
          inTrack('wta'),
        ),
        pros,
        world.fieldSeasonPoints,
      )
    : ranking
  // ⚠ AND ONE PRO PLAYS ONE EVENT A WEEK (W2-FIELD2, act2-pro-tour.md §8.2). When two W rungs land
  // on the same week the HIGHER one draws first and its field leaves this window – the professional
  // half of the rule `resolveDoubleBookings` already enforces on the canonical brackets, which
  // cannot reach here because a field pro has no ledger row to rearrange. Deterministic, ordered by
  // TIER_LADDER, and it draws nothing on THIS event's stream (see `weekFieldExclusion`).
  const excluded = pros
    ? weekFieldExclusion(event, world.season, universe, selRanking, world.seed, fatigue)
    : undefined
  const entrants = selectEntrants(event, universe, selRanking, kidRng, fatigue, excluded)
  const field = rivalField(entrants, event, fatigue)
  // v21b: she goes into the draw AT HER STANDING, not at the bottom of it - the same place the
  // acceptance list would give her - and is seeded, or not, on the terms everybody else gets.
  //
  // ⚠⚠ AND FOR THREE WAVES IT DID THE EXACT OPPOSITE, ON EVERY TRACK. Round-21 #4, the owner: «только
  // 1 раз за весь сезон смог пройти 1й раунд турнира из всех попыток». Measured on his own save with
  // tools/draw-vs-band.ts, a world #15: **seeded in 0.0% of draws, median standing in the draw #64
  // of 64**, and 89% of the field she met at a 1000 was stronger than her.
  //
  // THE CAUSE IS THE TABLE, NOT THE FUNCTION. `kidSeedIndexIn` counts how many entrants outrank her
  // by looking her up in the ranking it is handed, and falls back to LAST for a player it cannot
  // find. Both tables reaching this line are built to the INPUT-INDEPENDENCE rule and therefore fold
  // her out on purpose - `aiRanking` ("excludes the kid so AI-field selection never depends on the
  // kid's own results") and `selRanking` ("LIVE rows fold WITHOUT the kid"). So she was never found,
  // and never found means bottom of the draw, every event, every rung, since v21b shipped the line
  // above claiming she was not.
  //
  // ⚠ THE FIX IS A SECOND TABLE, NOT A RELAXED FIRST ONE. Who TURNS UP must not depend on her (that
  // is the invariant, and `selectEntrants`/`weekFieldExclusion` above keep reading the kid-free
  // fold). Where SHE STANDS among them must depend on her and on nothing else - it is the acceptance
  // list's own question, and `rankingFor` is the table every other surface answers it with, so the
  // draw now agrees with the Season card instead of contradicting it.
  //
  // RNG: `buildDraw` shuffles the unseeded TAIL, whose length is `field.length - seedsFor(...)` and
  // does not move when her slot does, so this consumes the same number of draws on the same
  // event-scoped sub-stream. Her bracket changes because her position changes - which is the fix.
  const seedRanking = rankingFor(world, TIERS[event.tier].track)
  const result = runTournament(event, field, kid, world.seed, kidRng, kidSeedIndexIn(field, seedRanking, KID_ID))
  const players: Record<string, MatchPlayer> = { [KID_ID]: { ...kid } }
  for (const m of result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    const oppId = m.aId === KID_ID ? m.bId : m.aId
    const ai = field.find((p) => p.id === oppId)
    players[oppId] = ai ? { ...ai } : fallbackPlayer(oppId)
  }
  return { eventId: event.id, result, revealedRounds: 0, finished: false, players }
}

/** ⭐ PHASE 3a – WHAT THE WEEK DID TO HER: the injury roll, the condition she accrues, the knock's
 *  credit, the summer block's bill, the booked week types and the physio.
 *
 *  Returns `playedThisWeek`, read here by `accrueCondition` and again, after her competition has
 *  resolved, by `resolveMasseurReturn`. ⚠ IT IS THREADED RATHER THAN RE-ASKED, and that is
 *  load-bearing: `isCompetitionWeek` is asked BEFORE the arrival verdict runs, and the medical arm
 *  of that verdict removes her entry – so a second call after phase 3b would answer differently on
 *  exactly the weeks the difference matters. */
export function resolveBodyAndPlanner(world: WorldState): boolean {
  // 1c. Season-Life availability. ZERO main-stream draws: rollInjury/resolvePhysio pull only
  //     from the private per-week `:injury:`/`:physio:` sub-streams and accrueCondition is pure
  //     arithmetic. Sits here (not inside the pendingTournament block) so it runs exactly once
  //     per real week, reveal weeks included. rollInjury runs FIRST so a fresh injury reads as
  //     the walkover it is (played = false ⇒ she keeps the match-free slider bonus). R9-7:
  //     match fatigue no longer accrues here – it lands per-match at finalizeTournament, so a
  //     walkover/skipped week costs none by construction.
  //     Season planner (v13): the booked week types resolve INSIDE this step, on private
  //     sub-streams only. Order matters – rollInjury first (so an injury can still cancel the
  //     friendly and refund the court), then the week-type accrual, then the vacation gain /
  //     the friendly's drain, exactly like finalizeTournament applies its strain after accrual.
  rollInjury(world)
  expireRecoveryBuff(world)
  const playedThisWeek = isCompetitionWeek(world) // injured on the play week => walkover
  accrueCondition(world, playedThisWeek)
  // 1c-w4. W4: the REST branch's small credit, applied beside the other week-type gains rather than
  //        inside `accrueCondition` – whose arity-2, zero-RNG contract is pinned by B1 in
  //        tests/condition.test.ts (`expect(accrueCondition.length).toBe(2)`) and must not gain a
  //        parameter. Same shape `resolveVacation` uses for its package gain: accrue first, then add.
  //
  //        ⚠ SMALL ON PURPOSE (KNOCK_REST_CONDITION = 3, against a Light week's free +3 total). It has
  //        to be worth less than what the plan slider hands out for nothing, or a knock becomes
  //        something a player wants – see knock.ts's farming note (b). The value of resting is that
  //        the injury roll never gets loaded, not this.
  if (knockRestWeek(world.knock, world.week)) {
    world.condition = clamp(
      world.condition + KNOCK_REST_CONDITION,
      ECONOMY.condition.min,
      ECONOMY.condition.max,
    )
  }
  // 1c-summer. W3-SUMMER – THE FULLER WEEK'S BILL. She has no school in the holidays, so she trains
  //        twice a day, and «реальная нагрузка» has to mean the week COSTS more as well as teaching
  //        more (the growth half is at step 3b). Applied HERE, beside the knock's credit and the
  //        vacation's gain, for the same reason both of those are: `accrueCondition`'s arity-2,
  //        zero-RNG contract is pinned by B1 in tests/condition.test.ts and must not gain a
  //        parameter. Integer, clamped, ZERO draws.
  //
  //        ⚠ SHE STILL COMES OUT AHEAD. A free training week returns recoveryBase 8 plus 0-2 from the
  //        rest slider; the block takes 3 of it back. So a summer week is still restorative - there is
  //        no travel and no competition in it - and a nine-week block run end to end still leaves her
  //        measurably more tired than nine ordinary weeks would. The injury model reads condition, so
  //        the block carries its own risk without a rule of its own.
  //
  //        ⚠ AND IT IS SKIPPED ON EVERY WEEK THAT IS NOT HERS TO TRAIN THROUGH - a layoff, a booked
  //        family week, a tournament, a rested knock. See `summerBlockWeek` for the whole list and for
  //        why a holiday in July is a trade rather than a punishment.
  const summerCost = summerConditionCost(world)
  if (summerCost > 0) {
    world.condition = clamp(world.condition - summerCost, ECONOMY.condition.min, ECONOMY.condition.max)
  }
  resolveVacation(world)
  resolvePractice(world)
  resolvePhysio(world)
  // 1c-masseur: MOVED BELOW THE PLAY ARM (owner 22.08, per-match tour pricing). The salary used to
  //        bill here beside `resolvePhysio`; since «на неделе выезда по-матчевая цена заменяет
  //        недельную» the bill must know whether the fare was charged this very week, and that fact
  //        is written by the play arm (`pendingTournament.masseurThere`) – so the charge now sits
  //        directly after it, reading the recorded fact instead of re-deriving the arm. Zero draws
  //        either way, and on a home week nothing between the two positions writes a ledger row, so
  //        the move is invisible everywhere the masseur is not travelling.
  return playedThisWeek
}

/** ⭐ PHASE 3b – HER OWN COMPETITION: the tournament she entered, if she is on the tour this week.
 *
 *  `field` is the week folded once (world/weekField.ts); `playedThisWeek` is phase 3a's answer,
 *  threaded rather than re-asked – see the note there. */
export function playHerWeek(world: WorldState, field: WeekField, playedThisWeek: boolean): void {
  const { scheduled, aiRanking, rivalFatigue, rivalEntries } = field
  // 2. the kid's entered event this week (event-scoped RNG only): charge travel and stash the
  //    fully-computed shadow tournament. Nothing kid-specific is emitted/awarded here – the flow does.
  //
  // ⭐⭐⭐ ROUND 24, RULE 3 – AND SHE IS NOT ON THE TOUR THIS WEEK IF SHE IS AT COLLEGE. This line had
  // no `inCollege` guard, and that is the link in A1's chain where the owner's world actually died:
  // `resumeFromCollege` ticks fifty-two weeks with nobody watching, so an entry that outlived the
  // fork was PLAYED inside the freeze – `computeShadowTournament` stashed a reveal that the epilogue
  // screen (which replaces the app shell) had no surface to answer, and from that week `tickWeek`
  // skipped the whole of step 5-6 below. 204 weeks with no `housekeep`, no `ensureSeason`, no rank.
  //
  // ⚠ IT IS DEFENCE IN DEPTH, NOT THE FIX. Rule 1 (`answerFork`) releases the entries at the fork, so
  // after this wave there is nothing left for this line to find; rule 2 (`resumeFromCollege`) refuses
  // to tick past a reveal however one arrives. This guard is the third: it makes the reveal
  // UNCONSTRUCTIBLE inside the freeze rather than merely absent, which is what stops the next route
  // in from re-opening the same silent, total failure.
  //
  // ⚠ SIX OTHER STEPS OF THIS TICK ALREADY READ `inCollege` (the academy, the sponsors, the gear, the
  // knock, the birthday, the fork), so the freeze's own rule – she lives the weeks, she does not play
  // the tour in them – is not new here; only this step was missing from it.
  //
  // ⚠ RNG: ZERO. Everything this branch guards is event-scoped or pure – `chargeTravel`,
  // `chargeCoachTravel` and `computeShadowTournament` take no `rng` argument and the shadow run draws
  // on `seed:kidtour:<event.id>`. The frozen MAIN capture cannot move, and the probe's `rngDraws`
  // column is asserted identical across the wave.
  const enteredThisWeek = inCollege(world) ? undefined : scheduled.find((e) => world.entries.includes(e.id))
  // An injury turns an entered event into a walkover: no travel, no shadow run, 0 points.
  // Only a POST-deadline entry can still be live here – pre-deadline entries were auto-withdrawn
  // (and refunded) at onset by rollInjury; past the deadline the fee is forfeited (withdrawEvent
  // refuses), so the walkover event is all that remains of the trip that never happened.
  //
  // THE DOCTOR CHECKS HER ON ARRIVAL (owner 26.07). The medical floor used to gate ENTRY only, and
  // entries commit ENTRY_LOOKAHEAD weeks ahead of the play week – so a run entered healthy could
  // still be PLAYED at condition 0 and nothing intervened (the fatigue bench traced 14 straight
  // such weeks). The floor is therefore re-read HERE, on the play week, against the condition she
  // will actually take the court at (step 1c has already accrued, so this is the same number
  // computeShadowTournament would scale her by). Precedence mirrors availabilityStatus exactly –
  // injured > medical – so the two surfaces can never disagree about which beat fires.
  // Pure state: ZERO new RNG draws, on any stream.
  //
  // R12-3 / R12-15: the two comparisons above USED to be spelled out inline here – `world.injury
  // !== null` and `medicalClearance(world.condition)` – a private copy of two rules that already
  // had names. They now come from `arrivalStatus`, the ONE arrival verdict the sticky-bar button
  // also reads off the snapshot, so the week cannot resolve one way while the button that played it
  // promised another. Byte-identical by construction: on the play week `world.week === event.week`,
  // so `layoffCovering(world, event.week)` is `injury !== null && 0 < weeksRemaining`, which is
  // exactly `world.injury !== null` (rollInjury clears at 0 before this runs); and `medicalBlock` is
  // non-null exactly when `medicalClearance` returns 'withdraw'.
  const arrival = enteredThisWeek ? arrivalStatus(world, enteredThisWeek) : null
  const clearance = enteredThisWeek ? medicalClearance(world.condition) : 'clear'
  if (enteredThisWeek && arrival!.verdict === 'injured') {
    // R12-15: MARK THE WEEK, so `advanceWeeks` halts on it exactly once. A walkover forfeits the
    // entry fee just as surely as the medical withdrawal below does, and the owner's dead click was
    // this beat passing in total silence – no dialog, no toast, and a "Play" button that had just
    // promised a tournament. Derived state, deliberately not persisted (like
    // `medicalWithdrawalWeek`): a reload replays the tick and re-derives it.
    world.walkoverWeek = world.week
    addEvent(world, {
      week: world.week,
      type: 'injury',
      text: `Walkover: too injured to play the ${TIERS[enteredThisWeek.tier].label} – 0 pts, entry fee forfeited.`,
    })
  } else if (enteredThisWeek && arrival!.verdict === 'medical') {
    // WITHDRAWN ON MEDICAL GROUNDS: no travel charge (she never boards), no shadow run, 0 points.
    // The ENTRY FEE IS FORFEITED – the same rule skipEvent uses for a post-deadline pull-out, and
    // the same rule the injury walkover above uses. Chosen over a refund because it is the identical
    // real-world situation: the list closed with her on it, so the organisers keep the fee whatever
    // the reason she does not appear. Refunding here would also make the doctor's veto financially
    // FREE, i.e. a cheap late exit from any entry she regrets – the fee has to bite or "enter it and
    // see" becomes the dominant strategy.
    world.entries = world.entries.filter((id) => id !== enteredThisWeek.id)
    // Mark the week so advanceWeeks halts ONCE on it (see the stop below). The owner hit exactly this
    // trap with injuries – he skipped weeks, an entry was silently withdrawn, and he only found out
    // in the news three weeks later – so a forfeited entry must never pass by unseen either. The
    // marker is derived state, not saved: a reload replays the tick and re-derives it.
    world.medicalWithdrawalWeek = world.week
    addEvent(world, {
      week: world.week,
      type: 'injury',
      text: `Withdrawn from the ${TIERS[enteredThisWeek.tier].label} – not cleared to play on medical advice. 0 pts, entry fee forfeited.`,
    })
    // The week is match-free after all, so she earns the FULL free-week recovery ladder that
    // accrueCondition withheld when it still believed she would play (it ran with played = true, so
    // she banked matchWeekRecoveryBase instead of recoveryBase + the rest-slider bonus). The
    // difference is the ONE oracle `withheldFreeWeekRecovery` computes for all three refund sites
    // ('tournament' names the rung that was banked), so it lands on exactly what a non-playing week
    // pays, whatever the knobs are set to – and ⭐ on a SHOOT week (ad step 2, §4a) that is the
    // travel figure she already banked, so nothing is owed: the first ad-shoot bench caught this
    // exact site refunding a shoot week its rest (+9) through the doctor's arm. Integer, clamped,
    // zero draws.
    //
    // ⭐ THE NOTE THAT USED TO STAND HERE IS ANSWERED (18.08). It read: "skipEvent (R9-9) hands back
    // the rest-slider bonus ALONE … a skipped event week still under-pays by recoveryBase. NOT touched
    // here: fixing it moves shipped condition traces, which is a tuning call, not a merge call."
    // The owner ruled it a fix rather than a tuning call - the two weeks are the same week - and
    // `skipEvent` now reads the identical oracle. The paths cannot part again: there is one
    // expression left to edit.
    // ⭐ ROUND-25 COLLECT: the oracle also carries the phase base (variant C) and the masseur's
    // table since the merge – the two waves' parallel edits to this seam, folded into one expression.
    world.condition = clamp(
      world.condition + withheldFreeWeekRecovery(world, 'tournament'),      ECONOMY.condition.min,
      ECONOMY.condition.max,
    )
  } else if (enteredThisWeek) {
    chargeTravel(world, enteredThisWeek)
    // ⭐ ROUND-21 #2 - AND THE SECOND SEAT, IF HE CAME. Deliberately on this line and not in
    // `resolveBaseCosts`: the retainer is unconditional (owner, 08.08 - see `coachWorksThisWeek`,
    // which R4 got wrong by running travel and the retainer together and stood the coach down for
    // 43% of a season). This is a FARE, so it belongs in the arm where she actually boarded, beside
    // the fare it doubles - which is also what gives the two no-travel arms above their exemption
    // for free: an injury walkover and a medical withdrawal never pay it, because she never went.
    // Zero draws; see `coachTravelFareFor` for the price and whose figure it is.
    chargeCoachTravel(world, enteredThisWeek)
    // ⭐ v59 STEP 2 – AND THE NEXT SEAT OVER, on the same line of reasoning and in the same arm:
    // the masseur's fare is a fare, so it belongs where she actually boarded, and the two no-travel
    // arms above get their exemption for free. The fare it charged is remembered below on the
    // pending run itself, because it is the fare that BUYS the between-rounds relief at finalize –
    // recorded in the arm that paid, never re-derived from a stance that may have flipped since
    // (the round-21 #2 "asked once, carried" doctrine). Zero draws.
    const masseurFare = chargeMasseurTravel(world, enteredThisWeek)
    // ...and the WARNING BAND: cleared, but only just. She plays; the doctor goes on record. Emitted
    // after the travel charge so the week reads chronologically in the news feed (trip → the doctor
    // sees her → her matches). Type 'info' rather than 'injury': nothing has happened to her body,
    // somebody SAID something, which is what the 💬 channel is for.
    if (clearance === 'warn') {
      addEvent(world, {
        week: world.week,
        type: 'info',
        // ⚠ NO PRONOUN FOR THE DOCTOR EITHER (R15-7). The owner's sighting was the coach roster, where
        // women are on the list by construction – but the doctor is never named, never pictured and
        // never gendered anywhere in the engine, so "he" here was the same guess with nothing behind
        // it. Same fix, same dash.
        text: `Doctor's warning – she is cleared for the ${TIERS[enteredThisWeek.tier].label}, but only just. A warning is all it is; nobody can forbid it.`,
      })
    }
    world.pendingTournament = computeShadowTournament(world, enteredThisWeek, aiRanking, rivalFatigue, rivalEntries)
    // The presence the fare bought, carried on the run it was bought for. Written only when a fare
    // was actually charged, so absence keeps meaning "he stayed home" for every earlier save.
    if (masseurFare > 0) world.pendingTournament.masseurThere = true
  }

  // 1c-masseur, settled HERE since the per-match tour pricing (v59; the step-1 position was beside
  // `resolvePhysio` – see the note at 1c). The salary beside the physio bill it must stay
  // distinguishable from: a FLAT contract per rung, zero draws on any stream, suspended – not
  // cancelled – at college and on booked family weeks (the coach's own stand-down pair, asked of a
  // second seat; see masseurWorksThisWeek). His effects ride the same predicate: the rung bonus
  // inside accrueCondition above, and the rehab cadence inside rollInjury. ⭐ On the week he
  // BOARDS (`pendingTournament.masseurThere`, written three lines up in the arm that charged the
  // fare) the weekly bill stands down and finalize bills the week per match – the owner's «на
  // неделе выезда по-матчевая цена заменяет недельную». The walkover and medical arms above never
  // set the flag, so a trip that never happened is billed as the home week it really was.
  resolveMasseur(world)
  // ⭐ ...AND THE RETURN-WEEK SESSION (owner 22.08: «довесить послетурнирное восстановление 1
  // сеанс массажа по возвращении»): when he was NOT flown to her last tournament, the first
  // non-played week after it gets one extra session's worth of recovery, receipt included.
  resolveMasseurReturn(world, playedThisWeek)
}
