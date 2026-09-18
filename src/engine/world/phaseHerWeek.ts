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
import { accrueSpirit, applyBondDelta, driftWalls, growHabituation } from '../spirit'
import { KNOCK_REST_CONDITION, knockRestWeek } from '../knock'
import { TIERS } from '../season/calendar'
import { BEST_N_BY_TRACK, computeRanking } from '../season/ranking'
import { mergedWtaRanking, universeForTier } from '../season/fieldPros'
import { kidSeedIndexIn, runTournament, selectEntrants, weekFieldExclusion } from '../season/tournament'
import { KID_ID } from './constants'
import { addEvent } from './ledger'
// ⚠ ONE-WAY ARROW. `world/lifeBeat.ts` imports `./ledger`, `./constants`, `./age`, `../spirit`,
// `../economy` and `../rng` – never a phase – so this import closes no runtime loop, the same shape
// `world/endings.ts` already uses to raise the fork-opinion row.
// ⭐⭐ AND TIER 1'S ROLL IS BACK ON THIS LINE SINCE v74 T15 (11.09) – `rollSmallTalk`, through the
// SOFT path the owner ruled into the wave. It left for one commit («вариант 3»: the raise reverted,
// the engine kept) because §5b prices tier 1 «soft – answerable, never lost» and what T8 shipped was
// tier 2's hard pause; the row it raises now blocks nothing (see the call site below).
// ⭐⭐⭐ AND THE ENDS HAZARD JOINS IT IN v75 T2 (12.09) – `rollEnds`, §8 of the same module. It is the
// FIRST of the four at the call site and not the last, which is the whole of rulings F and A; the
// import line's order is alphabetical and says nothing.
// ⭐⭐⭐ AND THE LEAK JOINS THEM IN v77 T6 (14.09) – `rollLeak`, §9 of the same module, the
// architect's ruling M («it is a life call and belongs among its siblings»). It sits THIRD at the
// call site, between the arrival and the delivery, and that slot is load-bearing in both directions:
// see the call site below.
// ⭐⭐⭐ AND THE BOOTH JOINS THEM IN v77 T7 (14.09) – `airBoothMention`, §10 of the same module. ⚠ IT
// IS THE ONE NAME OFF THIS MODULE THAT IS **NOT** CALLED FROM THE LIFE BLOCK: it runs in
// `playHerWeek` below, in the arm where she has actually boarded, because its licence is about a
// MATCH and the match does not exist two phases earlier. See the call site for the measurement and
// for why that is ruling P working rather than a second clock.
import { airBoothMention, deliverKnownPartner, deliverOwnKey, landWedding, rollArrival, rollEnds, rollLeak, rollSmallTalk, rollSpouseView, rollWedding } from './lifeBeat'
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
import { resolveMasseur, resolveMasseurRaise, resolveMasseurReturn } from './masseur'
import { psychologistWorksThisWeek, resolvePsychologist } from './psychologist'
// ⭐⭐⭐ v80, WAVE F1 + F2 – the form pass and the third salaried seat. Both are LEAVES in the sense
// this phase needs (`world/form.ts` imports the model, the closed form and `world/sparring.ts`;
// `world/sparring.ts` imports the same five siblings `masseur.ts` does), so neither arrow closes a
// runtime cycle – the same measurement `./masseur` and `./psychologist` carry one line up.
import { accrueFormWeek } from './form'
import { resolveSparring } from './sparring'
// ⭐⭐⭐ v82, ROUND 42 #51 – the coach's annual ask, beside the masseur's. ⚠ ONE-WAY ARROW, and
// measured the same way the two above were: `world/coachMarket.ts` imports no phase at all
// (`coachWorksThisWeek` deliberately lives in `phaseFinance.ts`, with the bill that is its first
// reader), so this import closes no runtime loop.
import { bankCoachResidual, resolveCoachRaise } from './coachMarket'
// ⚠ ONE-WAY ARROW, AND MEASURED: `world/spotlight.ts` imports `../economy`, `../season/calendar`,
// `./constants`, `./fame` and `./loveEpisodes` – never a phase and never `../spirit` – so this
// import closes no runtime loop, the same shape `./lifeBeat` above already has. It is the VALUE side
// of §0.1's dependency inversion: this file calls the derivation and hands the LIST to
// `accrueSpirit`, so `engine/spirit.ts` gains no arrow of its own.
// ⭐ v77's T4 TAKES THE SECOND NAME OFF THE SAME MODULE AND FOR THE SAME REASON: the news gate is
// asked HERE and handed to `growHabituation` as a boolean, so the habituation pass lives beside the
// pressure it scales (`engine/spirit.ts`) while the GATE stays where it was derived. One arrow, two
// facts, no new edge in the graph.
import { exposureEventsOf, newsStandingOf } from './spotlight'
import { chargeCoachTravel, chargeMasseurTravel, chargeSparringTravel, chargeTravel, coachTravelFareFor } from './sponsors'

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
  // ⭐⭐⭐ ROUND 35 #14 – AND THE DRAW SHE WAS SHOWN A WEEK AGO IS HONOURED HERE. The card at week − 1
  // is the moment the draw HAPPENS (`DRAW_LEAD_WEEKS`), `recordDrawnFirstRounds` writes the girl it
  // named onto the world, and this is the one line that makes the promise binding on the bracket
  // rather than on the readout alone. Without it the field below is reassembled from a week-later
  // ranking, a week-later condition map and a week-later standing, and the same stable stream draws
  // somebody else out of it – measured at 59.9% of draw weeks (tools/r35-draw-fact.ts).
  //
  // ⚠ ZERO RNG. `withPinnedFirstRound` exchanges two finished slots and takes no stream; `kidRng` is
  // read in the same order and to the same depth. See `runTournament`'s parameter and the note on
  // `WorldState.drawnFirstRounds`.
  //
  // ⚠ THE ID BECOMES A PLAYER HERE, AND ONLY HERE, because only this function knows what this week's
  // field is made of: `rivalField` is the SAME composition every other entrant in `field` gets
  // (surface style, this week's fatigue), applied to the same `universe` row, so a promised girl who
  // has to be put back into the draw is not a second model of an opponent – she is one more entrant
  // built by the one builder. Undefined when nothing was published, when the id names nobody the
  // world still holds, or when she is already in the field (the swap path needs no composition).
  const promisedId = world.drawnFirstRounds?.[event.id]
  const promisedRow = promisedId ? universe.find((p) => p.id === promisedId) : undefined
  const promised = promisedId
    ? (field.find((p) => p.id === promisedId) ??
      (promisedRow ? rivalField([promisedRow], event, fatigue)[0] : undefined))
    : undefined
  const result = runTournament(
    event,
    field,
    kid,
    world.seed,
    kidRng,
    kidSeedIndexIn(field, seedRanking, KID_ID),
    promised,
  )
  // ⚠ THE ROSTER, NOT THE FIELD, and the difference is one player: a promised girl put back into the
  // draw is not in `field`, and `field.find` would hand her to `fallbackPlayer` – a placeholder name
  // and placeholder skills on the very opponent this item exists to name correctly.
  const roster = promised && !field.some((p) => p.id === promised.id) ? [...field, promised] : field
  const players: Record<string, MatchPlayer> = { [KID_ID]: { ...kid } }
  for (const m of result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    const oppId = m.aId === KID_ID ? m.bId : m.aId
    const ai = roster.find((p) => p.id === oppId)
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
  // ⭐⭐ 1c-arrival (v74, the private life wave 3 – T3/T5): DOES SOMEONE EXIST, THIS WEEK.
  //
  //        ⚠⚠ THE ORDER IS THE POINT, AND IT IS «IMMEDIATELY BEFORE `accrueSpirit`», NOT MERELY
  //        «somewhere in the phase». The attachment lifts spirit's effective baseline while the slot
  //        is full (wave 3's T4, the next step, reads `activeEpisode` inside `accrueSpirit`), so a
  //        roll placed AFTER the spirit pass would hand the lift its first return-step a week late –
  //        an arrival in week W that starts lifting her in W+1, for no reason a player could ever be
  //        told. Rolling first means the week someone appears is the week she is lifted.
  //
  //        ⚠ AND THE MIRROR OF THAT ORDER IS DELIBERATE TOO: `rollArrival` shaves the disclosure lag
  //        with the bond band, and running before `accrueSpirit` means it reads LAST week's settled
  //        bond rather than the value this same tick is about to regress. «The bond band AT the
  //        arrival week» is what the parent had built by the time someone appeared.
  //
  //        ITS OWN CALL, for `accrueSpirit`'s own reason one line down – `accrueCondition`'s arity-2,
  //        zero-RNG contract is pinned by B1 in tests/condition.test.ts and must not gain a
  //        parameter. ⚠ ZERO MAIN DRAWS: it takes no `rng` and pulls only from the private
  //        `seed:life:arrival:<week>` / `seed:life:partner:<sinceWeek>:*` sub-streams, and an
  //        INELIGIBLE week derives none of them at all (world/lifeBeat.ts §5). The frozen capture
  //        (41550 / e6b0c709) is untouched by construction.
  //
  // ⭐⭐⭐ 1c-ends (v75, the private life wave 4 – T2): ...AND FIRST, WHETHER THEY ARE STILL THERE.
  //
  //        ⚠⚠ IT RUNS **BEFORE** THE ARRIVAL, AND THAT IS A RULING WITH TWO CONSEQUENCES THE LAYER
  //        LEANS ON RATHER THAN A TIDY READING ORDER (wave-4 rulings F and A). The row this week's
  //        arrival may be about to append DOES NOT EXIST YET when the ends hazard rolls, so:
  //
  //          · AN ATTACHMENT CAN NEVER END IN ITS OWN ARRIVAL WEEK. `endedWeek >= sinceWeek + 1` by
  //            construction and the shortest romance the engine can produce is exactly one week – the
  //            premise ruling A's told-late discriminator rests on, and it is a property of THIS LINE
  //            being above the next one rather than of anything inside either function.
  //          · AND THE COOLDOWN REFUSES SAME-TICK RE-ARRIVAL BY CONSTRUCTION. `endEpisode` writes the
  //            date before `arrivalEligible` is next asked, so on the week of a break-up the slot is
  //            already free AND the clock is already running: clause 3 turns a freed slot down with
  //            `week − endedWeek = 0`. Nobody arrives on the afternoon somebody left. That clause has
  //            been unreachable since wave 3 shipped it dormant; this line is what makes it bite.
  //
  //        ⚠ AND THE MIRROR ORDER IS DELIBERATE TOO, for `rollArrival`'s own reason one line down:
  //        running before `accrueSpirit` means the week an attachment ends is the week the effective
  //        baseline drops back to the flat one – `activeEpisode` goes null the moment the date is
  //        written and `accrueSpirit` reads it derived, so the lift leaves through the standing weekly
  //        return rule and through no new code at all (wave 3's T4, and the ZERO-new-code half of
  //        wave 4's T3).
  //
  //        ITS OWN CALL, for `accrueSpirit`'s own reason five lines down – `accrueCondition`'s
  //        arity-2, zero-RNG contract is pinned by B1 in tests/condition.test.ts and must not gain a
  //        parameter. ⚠ ZERO MAIN DRAWS: it takes no `rng` and pulls only from the private
  //        `seed:life:ends:<week>` sub-stream, and a career with nobody in it derives none of it at
  //        all (world/lifeBeat.ts §8). The frozen capture (41550 / e6b0c709) is untouched by
  //        construction. ⚠ AND IT WRITES ONE DATE AND NOTHING ELSE – the shock is T3, the `'ended'`
  //        beat is T4, the feed row is T5; on this tree an ending is silent on every surface.
  //        ⭐⭐ RE-AIMED AT v75 T5 (12.09) AND THE SENTENCE ABOVE IS KEPT AS THE RECORD OF THE COMMIT
  //        ORDER. All three steps have landed, so the last clause has stopped being true: this call
  //        now writes the date, sets `world.spiritShock`, raises the told-now `'ended'` card and
  //        appends its kept feed row (stamped `lifeKind: 'ended'`) – the last three behind the
  //        `'met'` receipt, so an ending the parent was never told about is still silent here and
  //        surfaces at `deliverKnownPartner` instead. ⚠ WHAT IT STILL DOES NOT WRITE IS `world.spirit`
  //        – `accrueSpirit`, five lines down, stays the one writer of it in the engine.
  rollEnds(world)
  rollArrival(world)
  // ⭐⭐⭐ 1c-wed (v83, the wedding – wave 7 T2): AND THE WEEK SHE DECIDES TO MARRY.
  //
  //        ⚠ THE SLOT IS ARGUED ON BOTH SIDES, its siblings' own way:
  //          · **AFTER `rollEnds`**, so an episode that ended THIS tick cannot be proposed into –
  //            `endEpisode` has already written the date, `activeEpisode` answers null, and the gate
  //            refuses before any stream is derived. Nobody announces a wedding on the afternoon of
  //            a break-up.
  //          · **AFTER `rollArrival`**, and the order is free there rather than load-bearing: a row
  //            appended this very tick is 0 weeks deep against a 52-week threshold, so the gate
  //            refuses it either way. It sits beside the arrival because the two are one hazard
  //            family (§5 / §8 / §11), and before the leak so the beat a week raises precedes the
  //            press finding out – the household hears her before the papers do.
  //
  //        ⚠ ZERO MAIN DRAWS: it takes no `rng` and pulls only from the private
  //        `seed:life:wedding:<week>` sub-stream, and an INELIGIBLE week – every week before 23,
  //        every empty slot, every episode under `minEpisodeWeeks` deep – derives nothing at all
  //        (world/lifeBeat.ts §11). The frozen capture (41550 / e6b0c709) is untouched by
  //        construction, and a frozen career (156 weeks, age 16.6) can never reach the gate's first
  //        clause. ⚠ ITS OWN CALL, for `accrueSpirit`'s own reason below – `accrueCondition`'s
  //        arity-2, zero-RNG contract is pinned by B1 in tests/condition.test.ts.
  //
  //        ⚠ IT RAISES THE BLOCKING `'engaged'` BEAT AND WRITES THE NAME (T3's `partnerNameFor`,
  //        persisted at the moment she says it) – the latch and the feed row are `landWedding`'s,
  //        one line down, `weeksAfterEngagement` weeks after the answer.
  rollWedding(world)
  // ⭐⭐⭐ 1c-land (v83, the wedding – wave 7 T3): AND THE DAY ITSELF. Zero draws on ANY path – four
  //        gates and three writes, so MAIN cannot move and the frozen capture cannot see it. It runs
  //        directly after the roll so the week the clock comes due is the week it lands, and BEFORE
  //        `rollLeak`/`deliverKnownPartner` for the reading's sake alone (nothing between them
  //        shares state with it: the latch is this call's own, and §9 reads `publicWeek`, not the
  //        latch). ⚠ NO MONEY SINCE 18.09 – the drafted `costCents` charge was RULED OUT in his own
  //        words («я думаю как с подарками, никто и нисколько» – the gifts' law; the spec's §3c
  //        keeps its measured record) – and
  //        the two kept surfaces (feed line, album row) go through the milestone channel, idempotent
  //        per episode. An ineligible week writes nothing at all.
  landWedding(world)
  // ⭐⭐⭐ 1c-leak (v77, the spotlight – T6): AND THE WEEK THE **WORLD** FINDS OUT.
  //
  //        ⚠⚠ THE SLOT IS THE ARCHITECT'S RULING M AND BOTH OF ITS NEIGHBOURS ARE ARGUED. It is a
  //        LIFE call – it reads an episode, writes two stamps on it and appends a life row – so it
  //        belongs among its siblings between `accrueCondition` and `accrueSpirit`, which is the
  //        position two pins already defend (`wave4-ended-beat.test.ts`, `wave4-ends.test.ts`).
  //
  //          · **BEFORE `deliverKnownPartner`, AND THAT IS A REQUIREMENT RATHER THAN A READING.**
  //            The overtake writes `knownWeek = world.week` and raises nothing; the delivery one
  //            line down is what finds the row due and raises the standing `'met'` card in this same
  //            tick. Placed after it, the founding scene would need its own delivery path – which
  //            the brief forbids in as many words – or would arrive a week late for ever.
  //          · **AFTER `rollArrival`**, so the leak sees the row the arrival may have just appended.
  //            The hazard's gate is `activeEpisode` and the week someone appears is a week they can
  //            be photographed («a hand held at an airport», §3c-bis); running first would give every
  //            career a systematic blind week for no reason a player could be told. ⚠ IT IS NOT
  //            `rollEnds`' MIRROR AND DOES NOT WANT TO BE: that call runs BEFORE the arrival to buy
  //            two mechanical properties (an attachment cannot end in its own arrival week, and the
  //            cooldown refuses same-tick re-arrival), and a leak has no such consequence to buy.
  //
  //        ⚠ ZERO MAIN DRAWS: it takes no `rng` and pulls only from the private
  //        `seed:life:leak:<episodeId>:<week>` / `:story:` sub-streams, and an INELIGIBLE week
  //        derives neither of them (world/lifeBeat.ts §9). The frozen capture (41550 / e6b0c709) is
  //        untouched by construction. ⚠ ITS OWN CALL, for `accrueSpirit`'s own reason below –
  //        `accrueCondition`'s arity-2, zero-RNG contract is pinned by B1 in tests/condition.test.ts.
  //
  //        ⚠⚠ AND ITS GATE ASKS ABOUT `world.week − 1`, THE WAVE'S ONE HORIZON (ruling P), exactly
  //        like the pressure four calls down and habituation after it. The consequence is stated so
  //        nobody reads it as a lag somebody added: a story that breaks this week carries its
  //        `'wrongStory'` exposure event on `publicWeek`, and the pass that prices it asks about the
  //        week that closed – so the pressure lands in the NEXT tick. One clock, three readers.
  rollLeak(world)
  // ⭐⭐ 1c-told (v74, the private life wave 3 – T6): AND THE WEEK HE IS TOLD ABOUT IT.
  //
  // ⚠ ONE LINE MOVED ABOVE THIS BLOCK IN v75 (wave 4's T2) AND NOTHING ELSE IN THIS PHASE DID – see
  // 1c-ends, immediately before `rollArrival`. Delivery's own placement argument below is untouched
  // by it: the ends hazard writes a date and raises nothing, so it cannot put news in front of this.
  // ⚠⚠ RE-AIMED BY v77's T6 AND THE SENTENCE ABOVE IS KEPT AS THE RECORD. A SECOND line now sits
  // above this block – 1c-leak – and the difference is worth naming rather than glossed: the ends
  // hazard could not put news in front of the delivery, and the LEAK DELIBERATELY CAN. The overtake
  // writes `knownWeek = world.week` and the scan below is what turns that into the card, in this
  // same tick and through no new code. That is the one thing about this call site that T6 changed,
  // and delivery's own «immediately after the roll» argument is untouched by it: the leak moves a
  // date EARLIER and never later, so no week's news is held back by it.
  //
  //        ⚠⚠ IMMEDIATELY AFTER THE ROLL, AND THE ORDER IS A BEHAVIOUR RATHER THAN A STYLE. A shaved
  //        lag of ZERO is a real and common outcome (an open girl draws it at p 0.45 before the bond
  //        even shaves it), and `knownWeek === sinceWeek` on those careers. Delivery placed before
  //        the roll would hold that news back a whole week for no reason a player could be told –
  //        the mirror of the argument `rollArrival`'s own placement above makes about the lift.
  //
  //        ⚠ ZERO DRAWS AND ZERO NEW STREAMS: it reads `loveEpisodes`, `lifeLog` and `week`, takes no
  //        `rng`, and derives nothing. `accrueCondition`'s arity-2 contract (B1, tests/condition.test.ts)
  //        is untouched for the same reason every line in this block is its own call.
  //
  //        ⚠ IT CAN STOP THE WEEK. The row it raises is a pending `lifeLog` row, so `advanceWeeks`
  //        reports `'life'` and refuses to tick again until the parent answers – wave-2 machinery,
  //        called and not duplicated. `STOP_PRECEDENCE` already puts the birthday's card in front of
  //        it on a week that is both.
  deliverKnownPartner(world)
  // ⭐ 1c-key (v83, wave 7 – T10, backlog §8): AND THE WEEK SHE LIVES BEHIND HER OWN DOOR. One-time,
  //        NON-blocking, narrative-only – a kept `'life'` row and a soft card, no mechanic, no cost,
  //        no bond move. ⚠ ZERO DRAWS ON EVERY PATH (the section's own argument: nothing to decide,
  //        so no coin), and the gate reads the `independent` STAGE rather than a raw age, so a
  //        college week can never say «her own front door» over a diary that says dorm.
  //        ⚠ BEFORE the spouse and tier 1 – the three share ONE soft surface, and the once-a-career
  //        story outranks both when several could speak; the surface clauses DEFER it (never cancel)
  //        on a week something else already holds the card. A frozen career (age 16.6) never reads
  //        `independent`, so the frozen identity is untouched by construction.
  deliverOwnKey(world)
  // ⭐⭐ 1c-spouse (v83, the wedding – wave 7 T5): AND THE WEEK THE ONE SHE MARRIED HAS SOMETHING TO
  //        SAY. Raised only while a latched episode lives, at most once per
  //        `ECONOMY.wedding.spouseViewCooldownWeeks`, NON-blocking – the row rides the same soft
  //        surface as tier 1 (Home card, three-week window) and the tick rolls on regardless.
  //
  //        ⚠ THE SLOT IS ARGUED ON BOTH SIDES, its siblings' way:
  //          · AFTER `deliverKnownPartner`, so a week that is both news and a word from the spouse
  //            stops for the news – the blocking row wins the week, and this gate refuses behind it.
  //          · BEFORE `rollSmallTalk`, because the two share ONE soft surface («one at a time») and
  //            the rarer, bigger voice takes the week when both could speak: the spouse has at most
  //            one word in ten weeks, tier 1 has four a season. Small talk's own gate then refuses
  //            on the live row exactly as it refuses on its own, and neither draws a key that week.
  //
  //        ⚠ ZERO MAIN DRAWS: it takes no `rng` and pulls only from the private
  //        `seed:life:spouse-view:<week>` sub-stream – and ONLY on a week that raises: an ineligible
  //        week AND an eligible week with no true occasion derive nothing at all
  //        (world/lifeBeat.ts §12). No latch can exist on a frozen career (156 weeks, age 16.6), so
  //        the frozen capture (41550 / e6b0c709) and the frozen per-key identity are untouched by
  //        construction. ⚠ ITS OWN CALL, for `accrueSpirit`'s own reason below.
  rollSpouseView(world)
  // ⭐⭐⭐ 1c-smalltalk (v74, the private life wave 3 – T8's roll, T15's surface): AND THE WEEK SHE
  //        COMES WITH SOMETHING SMALL. who-she-is §5b's tier 1, on the position T8 chose and the
  //        deferral's note reserved – after the delivery, because a week that is both «there is
  //        someone» and «something small» is a week the small thing loses; before `accrueSpirit`,
  //        because the bond band it reads and the Mood register that decides WHAT she comes with are
  //        both LAST week's settled values.
  //
  //        ⚠⚠ AND IT DOES NOT STOP THE WEEK, WHICH IS THE WHOLE OF WHAT T15 CHANGED ABOUT IT. The
  //        row it raises is declared NON-BLOCKING by kind (`LIFE_BEAT_BLOCKING`, world/lifeBeat.ts
  //        §1), `pendingLifeBeat` narrows to blocking rows, and `advanceWeeks` therefore never
  //        reports `'life'` for it: she is answered from a Home card, inside a three-week window
  //        derived from `week − row.week`, and the tick rolls on whether the parent listens or not.
  //
  //        WHY THE HISTORY IS KEPT HERE. T8 shipped this same call through tier 2's HARD pause – the
  //        brief asked for «the standard machinery (pause, queue, re-validation)», §5b's own table
  //        prices tier 1 «soft – answerable, never lost», and because `bond` starts at 70
  //        (`steady`, a live band) the beat then fired from week 0 on every career and BLOCKED THE
  //        WEEK behind a row with no on-screen home, breaking 136 walked fixtures. The owner ruled
  //        «вариант 3» (raise reverted, engine kept) and, the same day, «расписать вариант 2
  //        подробнее сейчас в спеке и тоже всё-таки в эту волну загнать» – §5b's SOFT BLOCK
  //        CONCRETIZED amendment, built as T15. This line is what that amendment turns back on.
  //
  //        ⚠ NO AGE GATE, and it is a RULING rather than an omission: «she talks at any age» – a
  //        child bringing a parent a worry, a joy or a question is natural at any age, and tier 1 is
  //        TEXTURE rather than part of the romance layer. `smallTalkEligible` has none.
  //
  //        ⚠ ITS OWN CALL, for `accrueSpirit`'s own reason one line down – `accrueCondition`'s
  //        arity-2, zero-RNG contract is pinned by B1 in tests/condition.test.ts and must not gain a
  //        parameter. ⚠ ZERO MAIN DRAWS: it takes no `rng` and pulls only from the private
  //        `seed:life:smalltalk:<week>` sub-stream, and an INELIGIBLE week derives none of it at all
  //        (world/lifeBeat.ts §7). The frozen capture (41550 / e6b0c709) is untouched by
  //        construction.
  rollSmallTalk(world)
  // ⭐⭐ 1c-life (v72, the private life wave 1): AND WHAT THE WEEK DID TO HER SPIRIT, and to what the
  //        parent has built with her. ITS OWN CALL, immediately after the body's – never a parameter
  //        of `accrueCondition`, whose arity-2, zero-RNG contract is pinned by B1 in
  //        tests/condition.test.ts (`expect(accrueCondition.length).toBe(2)`) and must not gain one:
  //        the identical reason the knock's credit and the summer block's bill below are their own
  //        lines. Pure arithmetic, ZERO draws on any stream. See engine/spirit.ts for both rules,
  //        and in particular for the order the weekly one runs in (return first, then this week).
  //
  //        ⚠⚠ AND THE SECOND ARGUMENT IS THE PSYCHOLOGIST'S WORKING WEEK, HANDED DOWN – the
  //        architect's ruling J (13.09, T4b), and it is dependency inversion rather than a
  //        convenience. T4's recovery slope gated itself on `psychologistHired`, which is TRUE on a
  //        college-freeze week and on a booked family week – the two weeks `resolvePsychologist`
  //        (1c-psy below, same tick) bills NOTHING for, its own opening line. So the family paid
  //        nothing and received the work. `engine/spirit.ts` cannot ask the predicate itself: an
  //        import of it closes a measured value cycle (`spirit -> psychologist -> college -> player
  //        -> spirit`, through `world/player.ts`'s `spiritMatchFactor`), and cutting the
  //        `bondBandOf` edge leaves the `inCollege` one closing it anyway. THIS function already
  //        holds every piece – it imports `accrueSpirit`, `inCollege` and `resolvePsychologist` –
  //        so the fact travels down the stack instead of the arrow travelling up it.
  //        ⚠ IT IS THE SAME CALL THE BILL MAKES, four calls later in this same tick and off this
  //        same week, so the week he is paid for and the week his work lands are ONE set by
  //        construction – «his effects ride the same predicate», the sentence 1c-masseur below
  //        already writes for the twin seat. ⚠ A `boolean`, never an `Rng`: `accrueSpirit`'s
  //        zero-draw contract is untouched and tests/spirit.test.ts asserts that of the signature.
  //
  //        ⭐⭐⭐ AND THE THIRD ARGUMENT IS THE EXPOSURE OF THE LAST CLOSED WEEK, HANDED DOWN THE SAME
  //        WAY (v77 T3, wave-6 brief §0.1) – what put her in the light, derived by
  //        `world/spotlight.ts` and summed into one named term inside the spirit pass. It is ruling
  //        J's inversion applied a second time to a second fact, and it costs no arrow:
  //        `engine/spirit.ts` imports the LIST's type off the barrel it already read and never the
  //        function that builds it.
  //        ⚠ THE DOUBLE ASK ON THIS LINE IS DELIBERATE AND DID NOT MOVE – ruling M's own ⚠. The
  //        argument is APPENDED and nothing else about the statement changed, because hoisting
  //        `psychologistWorksThisWeek(world)` into a local is exactly what would let a raw flag be
  //        handed down in the predicate's place («ruling J's own hole»), and FOUR SITES read this
  //        line's text verbatim – five CASES, because one of the four holds its anchor in a helper
  //        two of its cases share (measured by T3b's ARM 12b; a census of the sites is not a census
  //        of what goes red).
  //        ⚠ REQUIRED, NEVER DEFAULTED (ruling A): `Function.length` stops counting at the first
  //        default, so an `= []` would leave the arity pin reading 2 and green through the very
  //        change it exists to notice.
  //
  //        ⚠⚠ AND THE WEEK IT ASKS ABOUT IS `world.week − 1`, WHICH IS THE ARCHITECT'S **RULING P**
  //        (wave 6, 14.09) AND THE FIX FOR A DEFECT T3 SHIPPED CORRECTLY-AS-SPECIFIED. Ruling M had
  //        said `world.week`; T3 measured that two of the five kinds can NEVER be seen from here at
  //        that horizon, and ruling P overturned M. THE TICK'S OWN ORDER IS THE WHOLE ARGUMENT and it
  //        is written out here so the next reader never re-derives it (`tickWeek`, `world.ts`):
  //
  //            0 recordDrawnFirstRounds · `world.week += 1`   ⚠ THE INCREMENT IS FIRST
  //            1 seasonBoundaryAndObligations
  //            2 weeklyFinance
  //            3 resolveBodyAndPlanner   ← THIS PHASE. the life block, then `accrueSpirit`
  //            4 deriveWeekField
  //            5 playHerWeek             ← `finalizeTournament` is reached from here
  //            6 growAndLive
  //            7 closeTheWeek
  //            8 recordDrawnFirstRounds again – the week closes by writing down its own draw
  //
  //        `'stage'` and `'publicLoss'` are stamped by `finalizeTournament`, whose only writers are
  //        `cabinet.titles/finals.push(world.week)` and `world.results.push({ week: world.week, … })`
  //        (`world.ts:673-674` and `:1039`) – both with the CURRENT week, from step 5, TWO PHASES
  //        AFTER this one. So at `world.week` those two kinds return nothing here, every week, for
  //        ever: the ledger is right, the kinds are right, and the MOMENT was starving them. Asked
  //        about the week that has CLOSED, every record it names is already written.
  //        ⚠ ONE HORIZON FOR ALL FIVE KINDS, NEVER A SPLIT ONE – ruling P refuses tournament kinds at
  //        `week − 1` and life kinds at `week`, because that makes `exposureEventsOf` lie about its
  //        own parameter and puts two clocks in one ledger. T6's leak and T7's booth stamp keep their
  //        homes in the life block above and are simply seen one tick later.
  //        ⚠ AND `accrueSpirit` DID NOT MOVE: it is the one writer of `world.spirit`, the life block
  //        must sit between `accrueCondition` and it, and six pins defend that position – ruling P
  //        refuses the move by name. The lag is the truer reading anyway: the cameras were on her at
  //        the weekend and the week she pays for it is the week after. Nothing about the SIZE changes
  //        («мы ни за что не наказываем» is untouched), only which pass carries it.
  //        ⚠ THE FIRST TICK ASKS ABOUT WEEK **0**, NOT −1, because step 0 above increments BEFORE
  //        this phase runs – so the earliest week this line can name is 0, and week 0 holds no
  //        record of any kind. `exposureEventsOf` answers a negative week with an empty list in any
  //        case, by its own stated guard rather than by luck; both halves are pinned
  //        (tests/wave6-spotlight-pressure.test.ts §F).
  accrueSpirit(world, psychologistWorksThisWeek(world), exposureEventsOf(world, world.week - 1))
  // ⭐⭐⭐ 1c-hab (v77, the spotlight – T4): AND WHAT THE WEEK ADDED TO WHAT SHE IS USED TO.
  //
  //        who-she-is §3c: «sustained fame slowly shrinks her own pressure scale (she learns to live
  //        known) – unless walls are up: walls freeze habituation.» `engine/spirit.ts`'s §3c-hab
  //        carries the whole model; the two numbers are `ECONOMY.spotlight`'s.
  //
  //        ⚠⚠ ITS OWN CALL, **IMMEDIATELY AFTER** `accrueSpirit` AND NOT INSIDE IT – the architect's
  //        RULING Q part 1, and the reason is an off-by-one rather than a taste: the scale the pass
  //        above applied must be read with the habituation she CAME INTO the week holding. A growth
  //        that ran first would discount this week's own exposure by this week's own growth –
  //        invisible to every test, and legible only as «the constants came out slightly too weak».
  //        Calling it AFTER makes that unspellable. It also keeps `accrueSpirit` the one writer of
  //        `world.spirit`, and keeps `engine/spirit.ts`'s import list closed (§0.1).
  //
  //        ⚠⚠ AND **BEFORE** `driftWalls`, WHICH RULING Q DOES NOT SAY AND WHICH IS LOAD-BEARING.
  //        The line below is the pass that FLIPS a wall, and its own ⚠ promises that «whatever flips
  //        here is first read on the NEXT tick». This is a new reader of `wallsFlipped` inside the
  //        same tick, so it must sit on THIS side of the drift or that promise stops being true: a
  //        girl who flips this very week would then be CHARGED as the girl she was all week (the
  //        expression `accrueSpirit` read at its head) and FROZEN as the girl she became at the end
  //        of it. Wave 5's «one girl for the whole week», applied to a third reader.
  //        ⚠ THE COST OF THAT PLACEMENT IS ONE RE-AIMED PIN AND IT IS PAID OUT LOUD: wave 5's own
  //        ruling P case asserted `driftWalls` was the VERY NEXT statement (`toBe(i + 1)`). It now
  //        asserts that the ONLY statement between the two is this one, by a total list equality –
  //        as strict as before against anything else sliding in, and red on a re-order of these
  //        three. See tests/wave5-psychologist-walls.test.ts's §H.
  //
  //        ⚠⚠ THE GATE IS ASKED **HERE** AND HANDED DOWN AS A BOOLEAN – §0.1's dependency inversion
  //        for the third time on this phase (`psychologistWorks`, the exposure list, and now the news
  //        gate). `engine/spirit.ts` gains no arrow to `world/spotlight.ts`.
  //        ⚠⚠ AND IT IS `world.week - 1`, THE SAME HORIZON AS THE LINE ABOVE – ruling Q part 2, and
  //        ruling P's one clock kept as one clock. A reader that asked about `world.week` here while
  //        the pressure asked about `world.week - 1` would put two clocks in one pass, and «which
  //        week is this about» is exactly the question that cost this wave two dead kinds. ⚠ At this
  //        phase it is also the same ANSWER – `fameAt` derives from stamps written in earlier weeks,
  //        and nothing between the two lines writes one – so the coherent spelling costs nothing.
  //        ⚠ A NEGATIVE WEEK IS SAFE FOR THE SAME REASON IT IS ABOVE: the first tick asks about week
  //        0 (step 0 increments first), and `fameAt` answers a future week with 0 in any case.
  //        ⭐⭐⭐ AND SINCE v77's T5 IT CARRIES THE SEAT'S BILLING PREDICATE TOO – the third argument,
  //        `psychologistWorksThisWeek(world)`, exactly the expression `accrueSpirit` is given one
  //        line up and `driftWalls` one line down. «The public life» (O7, the fifth year-focus)
  //        ACCELERATES this counter by rung while it is held, and the acceleration has to stand down
  //        on a college-freeze week and a booked family week with the invoice – ruling J, pay nothing
  //        and receive nothing. ⚠ IT IS HANDED DOWN RATHER THAN READ INSIDE for the same reason the
  //        news gate is: `engine/spirit.ts` cannot import `./psychologist` at all (ruling J's two live
  //        back-edges, argued at that file's §3c-psy), so the caller answers what the caller already
  //        holds. ⚠ THE THREE CALLS NOW SPELL THE SAME PREDICATE THREE TIMES AND NOT INTO A LOCAL,
  //        which is `driftWalls`'s own note one block down: a local would let a stale flag be threaded
  //        where a live read belongs, and the call TEXT of all three is pinned.
  growHabituation(world, newsStandingOf(world) === 'known', psychologistWorksThisWeek(world))
  // ⭐⭐⭐ 1c-walls (v76, the psychologist's year – T7): AND WHAT THE WEEK DID TO HER WALLS.
  //
  //        who-she-is §2a, the 09.09 third-sitting re-cut: identity is IMMUTABLE and what drifts is
  //        WALLS AND REGULATION – two slow leanings of EXPRESSION away from an unchanging nature,
  //        plus the hysteresis state a flip lives in. `engine/spirit.ts` §4 carries the whole model.
  //
  //        ⚠⚠ ITS OWN CALL, **IMMEDIATELY AFTER** `accrueSpirit` AND NOT INSIDE IT – the architect's
  //        RULING P (13.09), which corrected ruling F's guess about the LOCATION while keeping its
  //        reason whole. The reason: `accrueSpirit` reads `intensity` ONCE at its head and spends it
  //        three ways, so a flip that fired mid-pass would price half the week as one person and half
  //        as another – the 09.09 ORDER FIX's own defect in a second costume. «After `accrueSpirit`
  //        returns» satisfies that more exactly than «at its tail», which is a place an editor can
  //        drift away from. And the location buys the property the tail could not: `accrueSpirit`
  //        reaches NO stream at all, this pass's flip hazard is a DRAW, and the zero-draw contract
  //        two lines up is the thing three pins lean on. ⚠ SO WHATEVER FLIPS HERE IS FIRST READ ON
  //        THE **NEXT** TICK: every reader of `expressedTemperamentOf` in this tick has already run.
  //
  //        ⚠⚠ THE SECOND ARGUMENT IS THE SAME BILLING PREDICATE, AND IT IS THE SAME CALL – ruling J's
  //        law and ruling P's own ⚠ («a standing-down seat slows nothing»). All three of the seat's
  //        walls effects ride it: O6's ×0.75 on the rise, the `'herself'` ×1.5 on the repair, and the
  //        beyond-baseline hazard scale. ⚠ THE DRIFT ITSELF DOES NOT: walls rise from neglect and
  //        fall for free on EVERY week of EVERY career, hire or no hire, college freeze or not –
  //        §2a's «no purchase, no work», and §0.3's «repair is free».
  //
  //        ⚠ ZERO MAIN DRAWS: it takes no `rng` and pulls only from the private
  //        `seed:life:walls:<axis>:<week>` sub-streams, and an UNARMED axis-week derives none of them
  //        at all. The frozen capture (41550 / e6b0c709) is untouched by construction.
  //        ⚠ AND NO SURFACE SHOWS ANY OF IT – no leaning, no flip line, nothing on the wire. The
  //        face, the Mood word, the diary's bands and the feed's silence ARE the telegraph.
  //
  //        ⚠ THE PREDICATE IS ASKED A SECOND TIME RATHER THAN HOISTED INTO A LOCAL, AND THAT IS
  //        DELIBERATE: it is pure, it reads three facts (the flag, `inCollege`, the week's booking)
  //        and NOTHING runs between these two lines, so the two answers are one answer by
  //        construction. A local would have re-spelled the `accrueSpirit` call as
  //        `accrueSpirit(world, psychologistWorks)` – and the exact text of that call is PINNED in
  //        tests/spirit.test.ts precisely so the raw flag can never be handed down in the
  //        predicate's place (ruling J's own hole). Cheaper to ask twice than to weaken that pin.
  driftWalls(world, psychologistWorksThisWeek(world))
  // ⭐⭐⭐ 1c-form (v80, wave F1): AND WHAT THE WEEK DID TO HER TENNIS.
  //
  //        `docs/specs/the-form-and-the-sparring-2026-09.md` §1: the RESULTS channel (the residual
  //        against the odds ring's own expectation), the RHYTHM channel (the rust once a matchless
  //        gap passes three weeks), and the return to neutral. `engine/form.ts` holds the model,
  //        `world/form.ts` the world-reading half; this is the one call that writes the number.
  //
  // ⚠⚠ THIS PHASE AND NOT `growAndLive`, AND THE REASON IS THE TICK'S OWN ORDER. Form's one reader is
  //        `composureEff` at `MatchPlayer` build time, and `playHerWeek` builds her at STEP 5 – two
  //        phases after this one. A pass in phase 6 would move a number that this week's matches had
  //        already been played against, so a slump would first be felt a week after it arrived and
  //        the sparring partner would cut a drift she had already carried onto court. Beside
  //        `accrueCondition` and `accrueSpirit` is therefore where the spec's «one weekly update
  //        beside condition's» has to mean: the three numbers she plays this week's tennis at are
  //        settled together, before she plays it.
  //
  // ⚠ AFTER `driftWalls` AND NOT BETWEEN IT AND `accrueSpirit`: wave 5's §H pins the statement list
  //        between those two by total equality, and nothing here needs to sit inside it – form reads
  //        results and a calendar, neither of which any pass in this phase writes.
  //
  // ⚠ `playedThisWeek` IS THREADED AND NEVER RE-ASKED, the phase's own rule at its head. It is «is
  //        she at an event this week», which is the ONE fact the not-travelling sparring seat stands
  //        down on (`sparringWorksThisWeek`), and `resolveSparring` at step 5 is handed the identical
  //        local – so the week he is PAID for and the week he CUTS are the same week by construction
  //        rather than by two agreeing derivations.
  //
  // ⚠ ZERO MAIN DRAWS, and zero draws on any stream at all (O4, the owner's 16.09 ruling): the pass
  //        is a filter, a closed-form evaluation over snapshots the save already holds, a sum and a
  //        clamp. `seed:form:<week>` stays reserved and unused, so the frozen capture
  //        (41550 / e6b0c709) is untouched by construction.
  // ⭐⭐⭐ v82, ROUND 42 #51 – AND THE PHASE WIRES THE COACH'S CONTRACT TO THE SAME RESIDUALS, which
  //        is why `accrueFormWeek` hands them back instead of banking them itself: `world/form.ts`
  //        may not import `coachMarket.ts` (its own header names the runtime cycle that would close),
  //        and a cross-concern wire belongs in the phase that already holds both. One derivation of
  //        «what she did against expectation», read by her form and by the man who is paid to produce
  //        it. Zero draws: a sum over a list this line already has.
  bankCoachResidual(world, accrueFormWeek(world, playedThisWeek))
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
    // ⭐⭐ v80 WAVE F2 – AND THE THIRD SEAT, on the same line of reasoning and in the same arm. ⚠ IT
    // RECORDS NOTHING ON THE PENDING RUN, unlike the masseur's fare one line up, and the asymmetry is
    // the design rather than an omission: what the masseur's fare buys is applied AT FINALIZE (the
    // between-rounds relief), so it has to be remembered; what this fare buys is applied in the
    // WEEKLY PASS (`sparringWorksThisWeek` stops standing him down on an away week), which reads the
    // live stance in the same tick and needs no carried fact.
    chargeSparringTravel(world, enteredThisWeek)
    // ...and the WARNING BAND: cleared, but only just. She plays; the doctor goes on record. Emitted
    // after the travel charge so the week reads chronologically in the news feed (trip → the doctor
    // sees her → her matches). Type 'info' rather than 'injury': nothing has happened to her body,
    // somebody SAID something, which is what the 💬 channel is for.
    if (clearance === 'warn') {
      // ⭐ v72 – AND SHE NOTICES WHO SENT HER OUT. The one `bond` delta in this file (−4, build plan
      // §1d): the doctor said she was cleared "but only just", the parent read that and entered her
      // anyway, and playing hurt is a decision about HER, not about a scoreline. It lands in this
      // arm and no other, because this is the only place the warning band and a real entry meet –
      // the walkover and medical-withdrawal arms above never reach it, which is right: she did not
      // play. Pure arithmetic, zero draws; see engine/spirit.ts.
      // ⚠ INVARIANT 4: the sentence below is untouched. This adds a number nobody can see.
      applyBondDelta(world, ECONOMY.bond.delta.playedHurt)
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
    // ⭐⭐⭐ 2-booth (v77, the spotlight – T7): AND WHETHER THE BOOTH TOUCHES HER PRIVATE LIFE AT THIS
    //        ONE. `world/lifeBeat.ts` §10 carries the licence, the window and the once-ness; the
    //        ruling behind the channel is the-way-she-sounds C4 (10.09) and the loop it closes is the
    //        owner's own: «a booth mention of her private life IS an exposure event for the
    //        spotlight». ZERO DRAWS – the mention is deterministic by design (the wave's §3).
    //
    //        ⚠⚠ **THIS ARM AND THIS STEP**, WHICH IS THE ARCHITECT'S RULING P ASKED OF T7 («your
    //        «this week has a big-stage match» read must be honest about which step it runs in»).
    //        The life block – §5-§9, two phases of this same tick ABOVE (step 3 against this one's
    //        step 5, with `deriveWeekField` between them) – runs before `enteredThisWeek` exists,
    //        before the doctor sees her and before the three arms that
    //        decide whether she plays at all; a licence spelled there would have re-derived the
    //        match from the calendar and re-stated the injury, college and medical rules a second
    //        time. Here the match is IN HAND, and the arm is the one where she actually BOARDED: the
    //        walkover and medical-withdrawal arms above never reach this line, which is right – a
    //        booth cannot fill a changeover at a match she did not play.
    //        ⚠ SO THE TIER IS HANDED DOWN AND NOT RE-DERIVED (§0.1's dependency inversion, the third
    //        time this phase makes the move): `airBoothMention` cannot be called from a matchless
    //        phase, because there would be nothing to pass it.
    //        ⚠⚠ AND IT IS NOT A SECOND CLOCK. The stamp names THIS week – the week the booth spoke,
    //        `rollLeak`'s own rule for `publicWeek` – and T3's pass sees the `'aired'` exposure event
    //        on the NEXT tick, where `exposureEventsOf(world, world.week − 1)` reads it. Ruling P's
    //        one horizon, working; nothing about `accrueSpirit`'s position or the life block's moved
    //        to buy this line.
    //        ⚠ AFTER THE SHADOW RUN IS STASHED, and deliberately so: the run is what the family is
    //        about to watch, and a stamp written before it would be a booth speaking at a match that
    //        `computeShadowTournament` had not yet composed. Nothing here reads `pendingTournament`.
    airBoothMention(world, enteredThisWeek.tier)
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
  // ⭐⭐ ROUND 43 #4 – AND ONCE A YEAR HE ASKS FOR MORE, IMMEDIATELY BEFORE THE BILL HE HAS JUST
  // MOVED. His 16.09 ruling: «дальше он приходит и просит прибавку, либо (так как альтернативы нет)
  // добавить денег, но убавить количество процедур». The rate is DERIVED from weeks served
  // (`masseurSessionCents`), so this line raises no state – it writes the notice, and it is on this
  // side of `resolveMasseur` so the week the ask lands is the week the new bill is charged and the
  // ledger reads in the order it happened. Zero draws on any stream.
  resolveMasseurRaise(world)
  resolveMasseur(world)
  // ⭐⭐⭐ 1c-coach, v82 (ROUND 42 #51, ruled 17.09) – AND ONCE A YEAR THE COACH ASKS TOO, on the
  // masseur's tested annual mechanism one line up. His ruling: «"зафиксировать при найме и пусть
  // просит, как массажист" – верно».
  //
  // ⚠ BESIDE THE MASSEUR'S AND NOT INSIDE THE TILL, deliberately. `resolveBaseCosts` (phase 4) is
  // where the coach's week is CHARGED, and this phase is where the seats' arrangements change – so
  // the ask lands in the same slot the masseur's does, on the week its own anniversary turns, and
  // the bill that follows is already the new one. ⚠ The two seats' models are different and that is
  // by design, stated in `docs/specs/the-masseurs-ask-2026-09.md` §1: the masseur's driver is TIME
  // SERVED because his value is his hours; the coach's is a PROGRESS BASKET because developing her
  // is his job. Letting the masseur read her titles would charge her success twice.
  //
  // ⚠ ZERO DRAWS on any stream – a weighted mean over state the tick has already written, a clamp
  // and an integer multiply. The frozen MAIN capture (41550 / e6b0c709) cannot see it.
  resolveCoachRaise(world)
  // ⭐ ...AND THE RETURN-WEEK SESSION (owner 22.08: «довесить послетурнирное восстановление 1
  // сеанс массажа по возвращении»): when he was NOT flown to her last tournament, the first
  // non-played week after it gets one extra session's worth of recovery, receipt included.
  resolveMasseurReturn(world, playedThisWeek)
  // 1c-psychologist (v76, the psychologist's year – wave 5 T2). THE SECOND SALARIED SEAT, settled in
  // this same arm and immediately after the masseur's, because it is the same kind of line: a flat
  // weekly retainer on the family payroll, zero draws on any stream, suspended – not cancelled – at
  // college and on booked family weeks (the SAME stand-down pair, mirrored rather than re-derived;
  // see `psychologistWorksInWeek`).
  //
  // ⚠⚠ AND THE BOARD-WEEK STAND-DOWN THE BLOCK ABOVE SPENDS ITS LAST FOUR LINES ON DOES NOT EXIST
  // HERE, which is the one thing to read before believing these two rows are the same row. The
  // masseur's weekly bill steps aside on the week he BOARDS because the fare replaced it
  // (`pendingTournament.masseurThere`, and finalize bills the week per match). This seat NEVER
  // boards – the travelling-team §2's ruling Б, «психолог работает дистанционно и стоит только
  // зарплату» – so there is no such week, no `masseurThere` twin to read and no exception to make:
  // the retainer runs on a tournament week exactly as the coach's does.
  //
  // ⚠ HE IS BILLED AND HE DOES NOTHING YET, and that is this commit rather than a defect: every
  // effect arrives with the FOCUS that names it (T4-T7). The one thing that must be true today is
  // that the money and the stand-downs are already honest, because a seat whose bill and whose weeks
  // disagree is the «вы заплатили и не можете этого заметить» failure the travelling-team plan bans
  // specialists for.
  resolvePsychologist(world)
  // 1c-sparring (v80, wave F2). THE THIRD SALARIED SEAT, settled beside the other two and for the
  // same reasons: a flat weekly contract per rung on the family payroll, zero draws on any stream,
  // suspended – not cancelled – at college and on booked family weeks (the SAME stand-down pair,
  // mirrored rather than re-derived; see `sparringWorksThisWeek`).
  //
  // ⚠⚠ AND HE HAS A FOURTH STAND-DOWN THE OTHER TWO DO NOT, which is the whole of what his travel
  // switch buys: a partner who does not travel is not paid for a week she is AWAY at an event,
  // because he cannot hit with her there. That is the owner's 15.09 override («у остальных есть
  // галочка "ездит"») made mechanical, and round 42 #48's measurement – the not-travelling seat
  // reaches 89.4% of the rust – is a measurement of exactly this line.
  //
  // ⚠ `playedThisWeek` IS THE IDENTICAL LOCAL THE FORM PASS WAS HANDED at 1c-form, two phases up.
  // Nothing between the two calls writes `sparringHired`, `inCollege` or the week's booking, so the
  // week he is PAID for and the week he CUTS the drift of are one week by construction – «pay
  // nothing and receive nothing», ruling J, taken as an identity rather than as a pair of rules.
  resolveSparring(world, playedThisWeek)
}
