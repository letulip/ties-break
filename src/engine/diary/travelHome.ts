// THE JOURNEY HOME (R14-2): how she travelled back from a tournament, what mood she was in, and the
// facts the scrap-note pool draws on.
//
// ⚠ DEPENDENCY DIRECTION. Reads diary/facts.ts (the tier walk and the condition band) and the
// engine's own leaves; nothing here imports diary.ts. Measured at 2 callbacks before facts.ts
// existed and 0 after, which is what made the cut mechanical.
//
// ⚠ RNG: the scene and sleep rolls draw on PURPOSE-SCOPED sub-streams keyed on (seed, week), never
// MAIN - the same discipline the rest of the engine uses, so the frozen capture cannot notice this
// file.
import { TIERS } from '../season/calendar'
import type { TierId } from '../season/types'
import { rngFromSeed } from '../rng'
import { resultShowsOnHerFace } from '../../shared/avatarEmotion'
import type {
  ConditionBand,
  DiaryLifeStage,
  Milestone,
  TravelHomeMood,
  TravelHomeScene,
  WorldEvent,
} from '../../shared/protocol'
import { tierFromEventId, conditionBandOf } from './facts'

// --- the journey home (R14-2) ----------------------------------------------------------------
//
// The owner, 29.07: «sleepy показываем рандомно после выездов на турниры в конце на экране Week
// story как в макете». Four paintings of her asleep on the way back, on the Weekly Story.
//
// ⚠ W4 MOVED IT ONTO THE WEEK IT IS A PICTURE OF (owner, 30.07: «ставить week recap сразу после
//   турнира, как будто домой едем»). This rule used to read WEEK - 1, and clause 1 below said why in
//   its own words: a week with a `tournament` event had no recap at all, so a scene set on the
//   tournament week was a fact no surface could ever render. That limitation is gone – the story now
//   opens the moment the tournament flow lets go of the week (composables/weekRecap.ts) – and with it
//   go the two clauses that existed only to dodge it. The picture was always of the drive home from
//   THIS tournament; it is on this week now, under the finale that just closed.
//
//   TWO CLAUSES DELETED, and neither had any other job:
//     * "it is the week AFTER" – the offset itself. `away` was `week - 1`; it is `week`.
//     * "and she stayed home" – no tournament of hers this week. Its stated purpose was "the one
//       that makes the fact renderable: it is `recapExists`'s own tournament test". With the story on
//       the tournament week, that test is the thing being contradicted rather than mirrored. Its
//       second argument – that back-to-back tournament weeks should tell the SECOND tournament's
//       story rather than the first one's drive home – dissolves too: each of those weeks now has its
//       own story, and each one's painting is its own journey back.
//   What SURVIVES the move is the pendingUnfinished half: a reveal in flight has not finished being
//   a week, so there is no journey home yet. It is the same fact the story's own gate refuses on.
//
// (a) WHAT COUNTS AS COMING HOME FROM AN AWAY TRIP — three clauses, all conservative, because on
//     the Weekly Story this scene REPLACES the week's painting rather than sitting beside it. A
//     false positive does not add decoration; it swaps correct art for wrong art.
//
//     1. IT IS THE WEEK SHE PLAYED, which is the week she came back. «после выездов» is *after the
//        trips*, and after a trip is the Sunday of the same week: she plays on the Saturday, gets in
//        the car, and the week's story opens on her asleep in it. The mockup's own handwriting under
//        the painting says exactly this – «Bianca quietly fell asleep in the car after the
//        tournament» – on a page whose header is one week.
//     2. SHE ACTUALLY PLAYED THERE. A competitive match of hers at that event, off the ledger –
//        which rules out every way an entry can exist without a journey: the walkover (too injured
//        to travel), the doctor's medical withdrawal, and the friendly, which is not a trip and not
//        a result (R11-2). No matches, no journey home. It is also what keeps a bare tournament
//        SUMMARY from claiming a trip: no revealed match of hers, no scene.
//     3. THE FAMILY PAID TO GET HER THERE, net over the week. Same test `travelled` uses and for
//        the same reason: a skipped tournament refunds its travel in the same week and nets to 0 –
//        she never boarded.
//
//     ...and W5 DELETED THE LINE THAT USED TO BE HERE, on the owner's own correction. It read
//     "every tier except `local`", and its argument was that a Local Open is the club down the road
//     (the calendar prices its travel at $60-120 against a Regional's $150-400) so "nobody comes home
//     from it". The owner, 30.07: «писал выше, очень даже едут, на автобусе или машине» – they very
//     much do travel, by bus or by car. HE IS RIGHT AND THE OLD ARGUMENT WAS A CATEGORY ERROR: it
//     answered "is this journey far enough to be a story" when the question is "did she go somewhere
//     and come back", and the ledger already answers that – the family paid a travel charge, so
//     somebody drove her. The distance is not what makes the picture true; it is what decides WHICH
//     picture, which is clause (b)'s job and now genuinely is.
//     WHAT SURVIVES is the pair of ledger tests above (she played there, the family paid), which is
//     what keeps a club hit-out down the road from claiming a journey: a friendly is skipped by
//     `resultShowsOnHerFace`, and a refunded entry nets to zero.
//
// (b) WHICH OF THE FOUR — and this is TIER-GATED, in the owner's own words (30.07): «если локальные
//     или региональные, то без самолетов, если национальные и выше, то все виды транспорта и
//     настроений».
//
//       local, regional          → GROUND ONLY: bus or car. No airports, no planes.
//       national, j30, j60, j300 → all four modes.
//
//     ⚠ IT IS NOT `track` ANY MORE, and that is the whole change. The rule used to read the
//     calendar's own axis – `itf` flies, `domestic` drives – which put NATIONAL in the driving
//     bucket. A National Series is six events a season across a whole country; a family flies to
//     one of those, and the owner drew the line one rung lower than `track` does. So the modes are
//     a table over `TierId` rather than a fold over `track`: total, so a new tier cannot be added
//     without somebody deciding how she gets home from it, and readable as the sentence he wrote.
//     A career that never climbs past Regional still never sees an airport – that half of the old
//     rule is intact – and the first National trip can now bring a picture she has not seen before,
//     one rung earlier than it used to.
//
//     THE MOODS ARE UNCHANGED AND ARE NOT TIER-GATED. «и настроений» lists what the top of the ladder
//     has rather than taking anything off the bottom: `travelHomeMoodFor` below is the owner's
//     earlier rule (reached the final → a weighted coin between happy and sleepy; fell short → a
//     weighted coin between sad and sleepy) and it reads her RESULT and her CONDITION, neither of
//     which knows what tier she was at. A local title should be allowed to look like a title.
//
//     THE DRAW is a purpose-scoped sub-stream, `seed:travel:<week>` – the same week always produces
//     the same scene, on any device and any replay, and ZERO draws land on the MAIN weekly stream
//     (nothing here runs inside the tick at all, so the frozen capture 41550 / e6b0c709 cannot move
//     by construction). Keyed on the week she comes HOME, which is the week the picture is shown.
//     ⚠ W4 changed WHICH week that is (the tournament week, not the one after) and W5 changed the
//     POOL SIZE on four of the six tiers; both are arithmetic on an existing sub-stream – the same
//     `rngFromSeed` call, a different value out of it – and neither adds a call anywhere. The
//     invariance pin in tests/travel-home.test.ts re-derives 41550 / e6b0c709 from the live engine
//     with a snapshot taken every week, so it is measured rather than assumed.

export const AIR_SCENES: readonly TravelHomeScene[] = ['airport', 'plane']
export const ROAD_SCENES: readonly TravelHomeScene[] = ['bus', 'car']

/** How she can come home from each rung – the owner's tier gate, as a table. TOTAL over `TierId`
 *  on purpose: adding a tier to the ladder must not silently inherit somebody else's transport. */
export const TRAVEL_HOME_MODES: Record<TierId, readonly TravelHomeScene[]> = {
  // «если локальные или региональные, то без самолетов» – another town, a night away, a drive back.
  local: ROAD_SCENES,
  regional: ROAD_SCENES,
  // «если национальные и выше, то все виды транспорта» – a country is big enough to fly across.
  national: [...ROAD_SCENES, ...AIR_SCENES],
  j30: [...ROAD_SCENES, ...AIR_SCENES],
  j60: [...ROAD_SCENES, ...AIR_SCENES],
  j300: [...ROAD_SCENES, ...AIR_SCENES],
  // The adult rungs take the J family's own bucket, unchanged. «Национальные и выше» is a rule about
  // DISTANCE, and a W15 is the same trip as a J30 to within a couple of hundred dollars of airfare –
  // the calendar prices them at $1,000-2,200 against $900-2,000. She is older and the tournament pays
  // her something, but the journey home is the same journey home, and this slice deliberately gives
  // the adult tour NO narrative voice of its own: the four scenes she has always come back in are the
  // four she comes back in now. When 19 becomes a fork with its own writing (§4 of
  // docs/specs/adult-tour-and-endings.md), that is where a different register belongs – not here,
  // where it would only mean the art library grew a fifth mode nobody drew.
  w15: [...ROAD_SCENES, ...AIR_SCENES],
  w35: [...ROAD_SCENES, ...AIR_SCENES],
  w50: [...ROAD_SCENES, ...AIR_SCENES],
  w75: [...ROAD_SCENES, ...AIR_SCENES],
  w100: [...ROAD_SCENES, ...AIR_SCENES],
  wta125: [...ROAD_SCENES, ...AIR_SCENES],
  // W3-ACT2 takes the same bucket, for the same reason and one storey higher: this is a rule about
  // DISTANCE, and the act-3 rungs are simply further ($2,300-6,000 against the 125's $2,100-4,200).
  // Whether the flight home from a major should read differently from the flight home from a J30 is
  // a WRITING question, and this slice deliberately answers it the way the W2-LADDER one did –
  // not here, where a fifth mode would only mean art nobody drew.
  wta250: [...ROAD_SCENES, ...AIR_SCENES],
  wta500: [...ROAD_SCENES, ...AIR_SCENES],
  wta1000: [...ROAD_SCENES, ...AIR_SCENES],
  slam: [...ROAD_SCENES, ...AIR_SCENES],
}

/** Her competitive tournament tier in `week`, off the event feed – null when she played none.
 *  Only the kid's own matches are ever recorded as `match` events (the AI brackets resolve without
 *  a scoreline), which is the same assumption `lastKidResultOf` above rests on. A friendly is
 *  skipped by the predicate her face uses (R11-2): a hit-out at the club is not a trip. */
export function playedTierIn(events: readonly WorldEvent[], week: number): TierId | null {
  for (const e of events) {
    if (e.week !== week || !e.match || !resultShowsOnHerFace(e)) continue
    return tierFromEventId(e.match.eventId) ?? null
  }
  return null
}

/** Net travel spend in `week`, in signed cents (negative = the family paid). */
export function travelCentsIn(events: readonly WorldEvent[], week: number): number {
  return events
    .filter((e) => e.week === week && e.category === 'travel')
    .reduce((sum, e) => sum + (e.amountCents ?? 0), 0)
}

/**
 * The scene of the journey home for `week`, or null. See the note above for the whole argument.
 * Pure and deterministic: the same arguments always answer the same scene.
 *
 * `pendingUnfinished` is the one guard that survived W4: a reveal in flight has not finished being a
 * week – her run is still being played out, so nobody is in a car yet – and it is the same fact the
 * Weekly Story's own gate refuses on (composables/weekRecap.ts).
 */
export function travelHomeSceneFor(args: {
  /** the full retained event log */
  events: readonly WorldEvent[]
  /** the week she PLAYED and drove back from – the week the picture is shown on */
  week: number
  seed: string
  /** a tournament reveal of hers is in flight this week (DiaryWorldView.pendingUnfinished) */
  pendingUnfinished?: boolean
}): TravelHomeScene | null {
  const { events, week, seed } = args
  // Week 0 is the career start: no story to put a picture on, whatever the ledger says.
  if (week <= 0) return null
  // her run is still being revealed – the week is not over and she is not on her way anywhere
  if (args.pendingUnfinished) return null
  // 1-2. she played a tournament this week...
  // ⚠ W5: `tier === 'local'` is NOT a refusal any more – see clause (a) above for the owner's
  // correction. Every rung she can play sends her home; the tier decides HOW, not WHETHER.
  const tier = playedTierIn(events, week)
  if (tier === null) return null
  // 3. ...and the family paid to get her there
  if (travelCentsIn(events, week) >= 0) return null
  const pool = TRAVEL_HOME_MODES[tier]
  const rng = rngFromSeed(`${seed}:travel:${week}`)
  return pool[Math.floor(rng() * pool.length)]
}

// --- the journey home, part two: HOW she came back, and what the parent wrote ------------------
//
// The owner's 29.07 art drop turned four paintings into twelve – three moods of the same four
// journeys – and named the rule, verbatim:
//
//   «если дошла до финала можем рандомно показывать happy/sleepy разные, если не дошла - sad или
//    sleepy если сильно устала при этом»
//
// Reached the final → happy or sleepy. Fell short → sad, or sleepy if she was worn out anyway.
//
// BOTH HALVES ARE FACTS THE ENGINE ALREADY HAS, and using anything else would be inventing a proxy
// for something the simulation answers outright:
//   "reached the final" is `finishIdx <= 1` on the away week's tournament summary – the same field
//       `lastKidResultOf` reads for the runner-up face and `finalizeTournament` writes from the
//       bracket (0 = champion, 1 = the girl who lost the final).
//   "worn out" is a WEIGHTED COIN on her condition, not a threshold – see travelSleepChance. It
//       began as the `drained` band, was loosened to a lower line, and the owner then rejected the
//       line itself: any hard threshold makes one of the two pictures unreachable for whole
//       stretches, because condition trends rather than wanders.
// Only the coin-flip inside "happy or sleepy" is drawn, on `seed:travelmood:<week>` – its own
// purpose-scoped sub-stream, so the frozen MAIN capture (41550 / e6b0c709) cannot move.
//
// WHAT THE PAINTINGS ACTUALLY SHOW, because the note under them is their caption and a caption that
// contradicts its picture is worse than no caption: `sleepy` is her ASLEEP (the car at night, head
// on the seat); `happy` and `sad` are both her AWAKE – laughing at a phone against a sunset, or
// curled against a rainy window at dusk. So every line that says she slept carries a `slept` claim
// and is licensed on the sleepy mood, and the honesty pin checks that separately.

/** The reading of the trip she is coming back FROM, plus the state she is in the week she gets home.
 *  Everything a journey-home note is allowed to know – and, like `DiaryFacts`, everything it may
 *  assert. Assembled from the event feed and the milestone ledger; nothing new is persisted. */
export interface TravelHomeFacts {
  /** the week she PLAYED and drove back from – the week the picture and the note are shown on.
   *  ⚠ W4 DELETED `awayWeek` rather than leaving it at `week`: it was documented as "always
   *  `week - 1`", and once the two are the same number, keeping both is a lie waiting for the first
   *  reader who trusts the name. Everything that used it reads `week` now. */
  week: number
  lifeStage: DiaryLifeStage
  /** Her birthday can fall on a tournament week; the journey note owns the scrap on those weeks. */
  birthdayAge: number | null
  scene: TravelHomeScene
  mood: TravelHomeMood
  tier: TierId
  /** the ITF ladder: the trip crossed a border, and she came home by air */
  abroad: boolean
  /** her finish at the away event – 0 champion, 1 runner-up, … ; null if no summary was written */
  finishIdx: number | null
  /** she won the thing */
  wonTitle: boolean
  /** she lost the final – the silver */
  lostFinal: boolean
  /** champion or runner-up: the owner's «дошла до финала» */
  reachedFinal: boolean
  /** how many matches she won on the trip */
  matchesWon: number
  /** one match, and she lost it */
  firstRound: boolean
  /** her FIRST tournament on the international ladder – see firstAbroadIn for why it is exact.
   *  Implies `abroad`: a Regional two towns over cannot be her first trip abroad. */
  firstAbroad: boolean
  /** she is carrying an injury the week she gets home */
  injured: boolean
  /** SHE DID NOT FINISH. She stopped in one of her matches at this event and came home hurt.
   *
   *  ⚠ STRICTLY STRONGER THAN `injured`, AND THE PAIR IS THE WHOLE POINT OF THE FIELD. The owner,
   *  10.08: «не забудь про соответствующие записочки по итогам недели если была травма с учетом
   *  момента, когда она была». `injured` says her week ends in a brace; this says WHEN it started,
   *  and the two produce genuinely different weeks – a girl who got home and then got the news, and
   *  a girl who walked off a court with a set and a half on the board and an umpire watching.
   *  `retired` implies `injured` by construction (`retirementInjury` opens the layoff at the same
   *  commit point that records the retirement); the reverse does not hold and is the common case.
   *
   *  Read off the match rows (`WorldMatch.retiredId`), which are persisted – so this survives a
   *  reload, unlike the derived `walkoverWeek` marker on the world. */
  retired: boolean
  /** how long that injury keeps her out in total, in weeks – 0 when she is healthy. A niggle and a
   *  season-ending one are not the same note, and the pool splits on it. */
  injuryWeeks: number
  conditionBand: ConditionBand
}

/** Her competitive matches at `week`, newest last. Only the kid's own matches are ever recorded as
 *  `match` events, and a practice friendly is skipped by the same predicate her face uses (R11-2). */
export function kidMatchesIn(events: readonly WorldEvent[], week: number): readonly WorldEvent[] {
  return events.filter((e) => e.week === week && e.match && resultShowsOnHerFace(e))
}

/**
 * Is the trip in `tripWeek` her FIRST on the international ladder?
 *
 * The event feed alone cannot answer this: it is capped (EVENTS_CAP = 400, pruned oldest-first), so
 * on a five-season career "no earlier ITF match in the log" eventually stops meaning "no earlier ITF
 * match" and the line would start lying about her tenth trip. The MILESTONE LEDGER is the durable
 * record – `international` is captured once per career, at the moment the first entry form goes in,
 * and is never pruned – so the question becomes a pair the two records answer together:
 *
 *   1. the ledger says she HAS a first international entry, and
 *   2. the feed still reaches back at least that far (so clause 3 is a statement about the whole
 *      career and not about a window), and
 *   3. the feed holds no ITF match of hers before this one.
 *
 * Clause 2 is what makes it degrade correctly: once the log has pruned past the milestone the answer
 * becomes `false` – silence – rather than a false "her first time". By then it is many seasons ago.
 */
export function firstAbroadIn(
  events: readonly WorldEvent[],
  milestones: readonly Milestone[],
  tripWeek: number,
): boolean {
  const first = milestones.find((m) => m.type === 'international')
  if (!first) return false
  if (!events.some((e) => e.week <= first.week)) return false
  for (const e of events) {
    // `>=` skips this trip's own matches, which is what makes the question "any EARLIER one".
    if (e.week >= tripWeek || !e.match || !resultShowsOnHerFace(e)) continue
    const tier = tierFromEventId(e.match.eventId)
    if (tier && TIERS[tier].track === 'itf') return false
  }
  return true
}

/** ⚠ IT IS A COIN, AND THE COIN IS WEIGHTED BY HOW EMPTY SHE IS.
 *
 *  This is the FELL-SHORT curve. The final has its own, one rung below - see
 *  `travelFinalSleepChance` and the W7 note under it for why it stopped being a flat 50/50.
 *
 *  Three rulings got us here, and the third overrides the second.
 *
 *  1. The owner's original rule: «если не дошла - sad или sleepy если сильно устала при этом».
 *     Implemented as a hard threshold on the `drained` band (below 40).
 *  2. Measured: condition never climbs back over 40 once the international calendar starts, so
 *     `sad` became an early-game-only picture. He loosened it - «они не совсем sad, скорее
 *     задумчиво спокойные» - and the threshold moved to 20.
 *  3. He rejected the threshold itself: «я тогда её вообще такую не увижу никогда, давай тоже
 *     рандом сделаем тогда между сном и sad».
 *
 *  He is right about the shape. ANY hard line makes one of the two pictures unreachable for long
 *  stretches of a career, because condition does not wander across a threshold - it trends. The
 *  rung above already draws a coin between happy and sleepy; this one should too, and now does.
 *
 *  WHAT THE WEIGHT IS FOR. A flat coin would throw away the thing he kept when he ruled on this the
 *  first time - «это задача игрока поддерживать её состояние, в его же интересах». So the coin is
 *  weighted, not fair: both pictures are reachable at every condition (his ask), and a parent who
 *  runs her into the ground still sees her asleep far more often (his design). Linear in condition,
 *  because a curve here would be a number nobody could explain from the screen.
 *
 *  A flat 50/50 is one line - drop the interpolation and return 0.5. */
export const TRAVEL_SLEEP_CHANCE_EMPTY = 0.85
export const TRAVEL_SLEEP_CHANCE_FRESH = 0.25

/** How likely the picture is of her ASLEEP rather than awake and quiet, at this condition. */
export function travelSleepChance(condition: number): number {
  const t = Math.max(0, Math.min(100, condition)) / 100
  return TRAVEL_SLEEP_CHANCE_EMPTY + (TRAVEL_SLEEP_CHANCE_FRESH - TRAVEL_SLEEP_CHANCE_EMPTY) * t
}

// =================================================================================================
// W7 — THE FINAL STOPS BEING A 50/50, AND WHY THAT WAS THE WHOLE BUG
// =================================================================================================
//
// The owner, twice, a career and a half apart:
//
//   «Ни разу не увидел после финала радостную итоговую картинку недели, все время спит. Было 3
//    финала уже. Состояние нормальное, выше 55%»
//   «Картинку с радостным общением про подиум увидел только один раз за 1,5 карьеры. В основном
//    спит.»
//
// ⚠ WHAT WAS MEASURED BEFORE ANYTHING WAS TOUCHED, because "make celebration likelier" is the fix
// you write when you have not found out which arm is winning. Driven on the live engine over 40
// careers x 4 seasons (a parent who paces her: one entry every three weeks, never below 55
// condition), reading `toSnapshot(world).diary.scene` - the very object WeekRecapCard binds:
//
//   * NO ARM SWALLOWS THE CASE. `weekSceneFor`'s journey arm is first and it won on 443 of 443
//     weeks she reached a final. Not one final drew the layoff, the exams, the holiday or the
//     calendar's own frame.
//   * THE KEY IS NOT WRONG. `happy` appeared on champion and runner-up weeks and on NOTHING else -
//     0% at semi-final, quarter-final and every early exit - which is `reachedFinal` doing exactly
//     what it says off `finishIdx`.
//   * THE ART, THE URL BUILDER AND THE ROUTE ARE ALL FINE. Twelve files ship, `weekSceneArtUrl`
//     spells the mood into the name, and App.vue opens the story on the tournament week itself.
//   * AND THE SUB-STREAM IS CLEAN: the first draw of `seed:travelmood:<week>` is uniform to within
//     1.4% per week over 4000 seeds, and 200k fresh streams fill ten buckets flat. No week bias, no
//     seed bias, nothing for a fresh career to land on.
//
// SO NOTHING WAS BLOCKED. THE CELEBRATION WAS HALVED, BY A COIN THIS FUNCTION TOSSED ITSELF:
//
//     if (args.reachedFinal) return roll < 0.5 ? 'happy' : 'sleepy'
//
// She WINS THE TITLE and the week's painting shows her asleep 53% of the time (measured, n=293).
// She loses the final: asleep 47% (n=150). Three finals in a row landing sleepy - the owner's first
// message - is a one-in-eight run, and he hit it; but the run is not the story. The story is that
// under this rule a title week and a first-round exit could draw THE SAME PICTURE, and half the
// time they did.
//
// ⚠ AND THE LOSING FACE OF THE COIN IS NOT A NEUTRAL PICTURE - it is the DEFAULT one. `sleepy` is
// also what an ordinary trip home draws (34-39% of non-final journeys at these conditions, and up
// to 85% when she is empty), so the coin was not choosing between two ways of saying "she reached a
// final". It was choosing between saying it and saying nothing at all. That is why the owner's
// sentence is «в основном спит» rather than «редко радуется»: on the one week of the season that
// earned its own picture, the game had a 50% chance of drawing the week it draws every other time.
//
// -------------------------------------------------------------------------------------------------
// THE FIX IS THE SHAPE THIS FILE ALREADY ARGUES FOR, ONE RUNG LOWER
// -------------------------------------------------------------------------------------------------
//
// The fell-short branch stopped being a threshold and became a WEIGHTED coin, for reasons written
// out above `travelSleepChance` - both pictures reachable at every condition (the owner's «давай
// тоже рандом сделаем»), and sleep likelier the emptier she is («это задача игрока поддерживать её
// состояние, в его же интересах»). The final branch never got that treatment; it kept the flat coin
// from the drop before. So it gets it now, with its own pair of endpoints:
//
//   * IT ANSWERS THE SENTENCE HE ACTUALLY WROTE. «Состояние нормальное, выше 55%» is him telling us
//     her condition and expecting it to count for something - and under the old rule it counted for
//     NOTHING on a final week. It does now: at 55 the drive home is the celebration ~72% of the
//     time, at the measured mean of a real final week (75) ~82%, and a fresh girl 90%.
//   * IT KEEPS «РАНДОМНО», which is his own word for this rule. It is still a coin and both faces
//     are still reachable at every condition - a finalist who has been run into the ground can
//     still fall asleep in the car, which is the true and the better picture of that week.
//   * IT SITS STRICTLY BELOW THE ORDINARY CURVE at every condition (0.55→0.05 against 0.85→0.25),
//     which is the one thing the two curves must never get wrong relative to each other: a girl who
//     has just played a final is LESS likely to be asleep than a girl at the same condition who
//     went out on Tuesday. Adrenaline is the reason and the gap is 0.20-0.30 the whole way across.
//
// ⚠ WHAT IS DELIBERATELY NOT TOUCHED, and it is the other half of what the measurement found. A
// deep run is charged its strain by `finalizeTournament` BEFORE the diary reads condition (a title
// run costs 18 points, a first-round exit 7), so on the fell-short branch the better she does the
// sleepier the painting is allowed to be. That is a real perversity and it is REPORTED rather than
// fixed here: that branch chooses between `sleepy` and `sad`, never `happy`, so it cannot be what
// the owner is missing - and re-weighting it would move how often the `sad` painting shows up,
// which is a separate ruling of his and not this fix's business.
//
// ⚠ NO DRAW MOVES. This is a comparison threshold on a value that was already drawn, on a
// purpose-scoped sub-stream that nothing in the tick reads. The frozen MAIN capture (41550 /
// e6b0c709) cannot move by construction, and tests/travel-home.test.ts re-derives it anyway.

/** How likely the painting is of her ASLEEP rather than laughing, on a week she reached the FINAL.
 *
 *  Same linear shape as `travelSleepChance` and deliberately parallel to it, so the two rules read
 *  as one idea at two depths rather than as two inventions. Both faces reachable at every
 *  condition; strictly below the fell-short curve everywhere. */
export const TRAVEL_FINAL_SLEEP_CHANCE_EMPTY = 0.55
export const TRAVEL_FINAL_SLEEP_CHANCE_FRESH = 0.05

/** How likely the FINAL's picture is of her asleep, at this condition. */
export function travelFinalSleepChance(condition: number): number {
  const t = Math.max(0, Math.min(100, condition)) / 100
  return (
    TRAVEL_FINAL_SLEEP_CHANCE_EMPTY +
    (TRAVEL_FINAL_SLEEP_CHANCE_FRESH - TRAVEL_FINAL_SLEEP_CHANCE_EMPTY) * t
  )
}

/** The owner's rule. BOTH branches are a weighted coin now, on the same sub-stream keyed to the
 *  week she comes home - one draw, whichever way the week went. */
export function travelHomeMoodFor(args: {
  reachedFinal: boolean
  condition: number
  seed: string
  week: number
  /** SHE DID NOT FINISH – see `TravelHomeFacts.retired`. Optional and defaulted so every existing
   *  caller is byte-identical; only a retirement week passes it. */
  retired?: boolean
}): TravelHomeMood {
  const roll = rngFromSeed(`${args.seed}:travelmood:${args.week}`)()
  // W7: was `roll < 0.5 ? 'happy' : 'sleepy'`, a flat coin that drew a title week as an ordinary one
  // half the time. Note the direction went with it: a LOW roll is now "she slept" on both branches,
  // so one number means one thing whichever way the week went, and the two curves can be compared
  // at a glance instead of one of them reading backwards.
  //
  // ⚠ A RETIREMENT NEVER TAKES THE FINAL'S BRANCH, and this is the only line of the retirement slice
  // that touches a picture. `reachedFinal` is read off `finishIdx`, and the owner's ruling makes a
  // girl who stopped in the final a RUNNER-UP – correctly, that is the round she reached and she is
  // paid for it. But the happy painting is of a girl on a podium, and she was not on one: she was
  // being helped off a court. Everything else about her week is a runner-up's; her face is not.
  //
  // ⚠ POST-DRAW, ZERO NEW DRAWS. `roll` is taken above, unconditionally, off the same
  // `seed:travelmood:<week>` sub-stream; this only decides which curve the already-drawn number is
  // compared against. The invariance pin in tests/travel-home.test.ts re-derives 41550 / e6b0c709
  // from a live career and cannot see it.
  if (args.reachedFinal && !args.retired) return roll < travelFinalSleepChance(args.condition) ? 'sleepy' : 'happy'
  return roll < travelSleepChance(args.condition) ? 'sleepy' : 'sad'
}

/** The whole journey-home reading for `week`, or null on a week she did not come home from one.
 *  `travelHomeSceneFor` above owns the WHETHER and the mode; this owns the mood and the facts the
 *  note is licensed by, so the two questions stay one answer. */
export function travelHomeFactsFor(args: {
  events: readonly WorldEvent[]
  milestones: readonly Milestone[]
  week: number
  seed: string
  kidId: string
  condition: number
  lifeStage: DiaryLifeStage
  birthdayAge?: number | null
  /** the active injury the week she gets home, or null */
  injury: { totalWeeks: number } | null
  pendingUnfinished?: boolean
}): TravelHomeFacts | null {
  const scene = travelHomeSceneFor(args)
  if (scene === null) return null
  const tier = playedTierIn(args.events, args.week)!
  const matches = kidMatchesIn(args.events, args.week)
  const matchesWon = matches.filter((e) => e.match!.winnerId === args.kidId).length
  // ⚠ THE SUMMARY IS ALREADY WRITTEN when this can be rendered, and the ordering is worth stating
  // now that the two are the same week: `finalizeTournament` emits the `tournament` event the moment
  // her LAST match is revealed and keeps `pending` alive (`finished: true`) for the finale, and the
  // story does not open until `closeTournament`. So `finishIdx` is never missing on a week the player
  // can see. The `finishIdx === null` branch below stays anyway – the facts must not depend on that
  // ordering holding for ever, and the note pool is swept over the null case.
  const summary = args.events.find((e) => e.week === args.week && e.type === 'tournament')
  const finishIdx = summary?.finishIdx ?? null
  const wonTitle = finishIdx === 0
  const lostFinal = finishIdx === 1
  const conditionBand = conditionBandOf(args.condition)
  const reachedFinal = wonTitle || lostFinal
  const abroad = TIERS[tier].track === 'itf'
  const retired = matches.some((e) => e.match!.retiredId === args.kidId)
  return {
    week: args.week,
    lifeStage: args.lifeStage,
    birthdayAge: args.birthdayAge ?? null,
    scene,
    mood: travelHomeMoodFor({ reachedFinal, condition: args.condition, seed: args.seed, week: args.week, retired }),
    tier,
    abroad,
    finishIdx,
    wonTitle,
    lostFinal,
    reachedFinal,
    matchesWon,
    // Read off the MATCHES rather than off `finishIdx === log2(drawSize)`: one played, none won is
    // the same fact without needing the draw size, and it survives a summary that never arrived.
    firstRound: matches.length === 1 && matchesWon === 0,
    // ⚠ `abroad &&` IS THE WHOLE CLAUSE, and leaving it out shipped a lie for one playtest: the
    // `international` milestone is captured when the ENTRY FORM GOES IN, weeks before the trip, so
    // from the moment she enters her first J30 the ledger answers yes – and a Regional Championship
    // she drove to the following Saturday came home under "Her first one in another country". The
    // milestone answers "has she ever signed up for one"; only the trip's own tier answers
    // "was THIS the trip". Pinned on a live career in tests/travel-home.test.ts.
    firstAbroad: abroad && firstAbroadIn(args.events, args.milestones, args.week),
    injured: args.injury !== null,
    // Off the same `matches` list every other fact here is read from – no new argument, no new
    // state. `retiredId` is written by the tournament and rides on the persisted match row, so a
    // reload re-reads the same week rather than re-deriving it.
    retired,
    injuryWeeks: args.injury?.totalWeeks ?? 0,
    conditionBand,
  }
}
