// Diary-1 – THE COPY SYSTEM (docs/specs/family-diary.md §2), shared by the Home photo card (D2),
// the condition note (D1) and the Memory card (D10).
//
// One idea, three rules:
//
//  1. FACTS FIRST. The engine assembles a `DiaryFacts` object at snapshot time, from state that
//     already exists (the emotion decision, this week's events, the condition, the milestone
//     ledger). A phrase is selected BY facts and may assert nothing they do not carry — the
//     honesty pin in tests/diary.test.ts sweeps the licence space and fails the moment a line can
//     contradict the simulation, because a diary that lies kills the whole effect ("Can't stop
//     smiling" after a loss is worse than any table).
//
//  2. PURPOSE-SCOPED RANDOMNESS ONLY. Selection draws from `seed:diary:<week>:<surface>` and the
//     Memory cadence from `seed:memory:<week>` — stable per week (no flicker across re-renders or
//     reloads), and ZERO draws on the MAIN weekly stream, so the frozen capture
//     (41550 / e6b0c709) cannot move by construction: nothing here runs inside the tick at all.
//
//  3. SILENCE IS ALLOWED. An ordinary week may say nothing on the photo card — the pool carries
//     deliberate null entries, because the quiet weeks are what make the loud ones matter (the
//     design doc's own recommendation). The condition note, by contrast, always answers WHY.
//
// The module is PURE: it never imports world.ts (world.ts imports it), and everything it needs
// arrives as a narrow `DiaryWorldView` the engine assembles in toSnapshot. Tone source:
// docs/lore/setting.md — quiet, domestic, never melodramatic; the parent observes, and never
// narrates feelings she cannot see. Player copy: English, short dash "–" only.

import {
  avatarEmotion,
  portraitStage,
  resultShowsOnHerFace,
  type AvatarEmotion,
  type LastKidResult,
  type LastKidTitle,
} from '../shared/avatarEmotion'
import type {
  ConditionBand,
  DiaryFacts,
  DiarySnapshot,
  FundsPressure,
  LossStreak,
  MemoryCard,
  Milestone,
  MilestoneType,
  TravelHomeMood,
  TravelHomeScene,
  WorldEvent,
} from '../shared/protocol'
import { isExamWeek, isOffSeasonWeek, TIERS, TIER_SHORT, tierFromLabel } from './season/calendar'
import type { TierId } from './season/types'
import { rngFromSeed } from './rng'
import { seasonYear, weekLabel } from '../shared/dates'

const TIER_IDS = Object.keys(TIERS) as TierId[]

// --- the one emotion walk (moved here from composables/kidEmotion.ts) -----------------------
// The walk that answers "what is her latest result / title" used to live in the UI composable;
// Diary-1 gave it a second consumer on the engine side (the facts object), and one walk in one
// place is the only way the painting and the phrase can never disagree. The composable now reads
// the engine's decision off the snapshot instead of re-deriving it.

/** `${year}-w${week}-${tier}` → tier (undefined for an unparseable/foreign id). */
function tierFromEventId(eventId: string | undefined): TierId | undefined {
  if (!eventId) return undefined
  const tail = eventId.split('-').pop()
  return TIER_IDS.find((t) => t === tail)
}

/** The kid's most recent TOURNAMENT match off the event feed (newest first). A result emotion
 *  only lasts until the next weekly tick, so walking the trailing feed is enough. R11-2: a
 *  practice friendly is skipped outright – it is not a result her face reports on. */
export function lastKidResultOf(events: readonly WorldEvent[], kidId: string): LastKidResult | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    const match = e.match
    if (!match || !resultShowsOnHerFace(e)) continue
    const won = match.winnerId === kidId
    // R8-6a: a loss in the FINAL = runner-up = a good result. The same week's tournament
    // summary carries finishIdx 1 exactly when her run ended in the final.
    const lostFinal =
      !won && events.some((t) => t.type === 'tournament' && t.week === e.week && t.finishIdx === 1)
    return { week: e.week, won, lostFinal, tier: tierFromEventId(match.eventId) }
  }
  return null
}

/** R9-11: the kid's most recent TITLE (finishIdx 0 on a tournament summary), for win-immunity. */
export function lastKidTitleOf(events: readonly WorldEvent[]): LastKidTitle | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.type !== 'tournament' || e.finishIdx !== 0) continue
    const tier = tierFromLabel(e.text)
    if (tier) return { tier, week: e.week }
  }
  return null
}

// --- milestones (D10) -----------------------------------------------------------------------

/** A milestone's IDENTITY, for idempotent capture: first title/final are per tier, the first
 *  international entry and the first injury are per career, a season's rank is per season. */
export function milestoneKey(m: Milestone): string {
  switch (m.type) {
    case 'title':
    case 'final':
      return `${m.type}:${m.tier ?? '?'}`
    case 'international':
    case 'injury':
      return m.type
    case 'season-rank':
      return `season-rank:${m.seasonIndex ?? -1}`
  }
}

/** The painting a memory of each milestone type shows. `happy` only for the title – the one
 *  moment that earned it; everything else stays in the composed half of the set.
 *
 *  R14-1: `injury` STAYS here and is one of the two surfaces that can still request that painting.
 *  A Memory is a picture of a week that happened – "ankle strain – her first injury" is the week
 *  she went down, not the nine that followed it – so the moment face is the right one and the
 *  layoff's `rehab` would be wrong. Typed on the NARROW union for that reason: nothing a milestone
 *  maps to is painting-only, so the Memory polaroid keeps a crop it could fall back on. */
export const MEMORY_EMOTION: Record<MilestoneType, AvatarEmotion> = {
  title: 'happy',
  final: 'serious',
  international: 'norm',
  injury: 'injury',
  'season-rank': 'norm',
}

// --- the facts ------------------------------------------------------------------------------

/** The narrow slice of the world the diary is allowed to read. Assembled by toSnapshot – the
 *  structural type is what keeps this module free of a world.ts import cycle. */
export interface DiaryWorldView {
  seed: string
  week: number
  kidId: string
  startAgeYears: number
  condition: number
  fundsCents: number
  injury: { kind: string; weeksRemaining: number; totalWeeks: number } | null
  /** the FULL retained event log (not the snapshot's trailing 60) */
  events: readonly WorldEvent[]
  /** the engine's streak, computed once per snapshot (computeLossStreak) */
  lossStreak: LossStreak | null
  kidRank: number
  prevKidRank: number | null
  /** a tournament reveal is in progress and NOT yet finalized: the week's rank recompute has not
   *  run, so `rankClimbed` must not read last week's movement as this week's. */
  pendingUnfinished: boolean
  /** R13-2: the ranking points the kid's run AWARDED this week (sum of her result rows at
   *  `week`). 0 on a first-round exit – see DiaryFacts.runPointsThisWeek. */
  runPointsThisWeek: number
  milestones: readonly Milestone[]
  /** a booked family vacation resolved this week */
  vacationWeek: boolean
  /** W2: `plan.train` – the percentage of the week the PLAYER put on court. */
  trainPct: number
}

/** Condition, as the word Home speaks (D3). The 80/60/40 rungs mirror the idle-emotion ladder
 *  (tired < 40, serious < 60) plus the "genuinely fresh" line the honesty pin holds tired-copy
 *  against: no tired phrase at 80+. */
export function conditionBandOf(condition: number): ConditionBand {
  if (condition >= 80) return 'fresh'
  if (condition >= 60) return 'ok'
  if (condition >= 40) return 'worn'
  return 'drained'
}

/** The family wallet as a pressure band – the diary never quotes the balance. $2,000 is the
 *  D7 licence line the spec names for money worry; $8,000 covers "watching it" (a working-class
 *  season of base costs). */
export function fundsPressureOf(fundsCents: number): FundsPressure {
  if (fundsCents < 2_000_00) return 'tight'
  if (fundsCents < 8_000_00) return 'watchful'
  return 'ok'
}

// --- the journey home (R14-2) ----------------------------------------------------------------
//
// The owner, 29.07: «sleepy показываем рандомно после выездов на турниры в конце на экране Week
// story как в макете». Four paintings of her asleep on the way back, on the Weekly Story.
//
// (a) WHAT COUNTS AS COMING HOME FROM AN AWAY TRIP — three clauses, all conservative, because on
//     the Weekly Story this scene REPLACES the week's painting rather than sitting beside it. A
//     false positive does not add decoration; it swaps correct art for wrong art.
//
//     1. IT IS THE WEEK AFTER, not the week of. Two reasons, and they agree. The screen: a week
//        with a `tournament` event has NO recap at all (composables/weekRecap.ts recapExists), so a
//        scene set on the tournament week would be a fact no surface can ever render. The fiction:
//        «после выездов» is *after* the trips – she plays on the Saturday, and the following week's
//        story opens on her asleep on the way back. So the rule reads WEEK - 1.
//     2. SHE ACTUALLY PLAYED THERE. A competitive match of hers at that event, off the ledger –
//        which rules out every way an entry can exist without a journey: the walkover (too injured
//        to travel), the doctor's medical withdrawal, and the friendly, which is not a trip and not
//        a result (R11-2). No matches, no journey home.
//     3. THE FAMILY PAID TO GET HER THERE, net over the week. Same test `travelled` uses and for
//        the same reason: a skipped tournament refunds its travel in the same week and nets to 0 –
//        she never boarded.
//     4. AND SHE STAYED HOME. Back-to-back tournament weeks are ordinary on the calendar (j30 runs
//        every 2 weeks), and on one of them the journey back is not the week's story – she came in
//        on Sunday and was gone again by Tuesday, and what happened is the SECOND tournament. The
//        picture would replace a week of competing with a picture of a car. This clause is also the
//        one that makes the fact renderable: it is `recapExists`'s own tournament test, read off
//        the same events plus the in-flight reveal, so a scene can never land on a week that has no
//        Weekly Story to put it on. Caught by tests/travel-home.test.ts against a live career –
//        the first draft of this rule had it, and week 43 of seed `travel-home-1` was invisible.
//
//     ...and then the LINE: every tier except `local`. A Local Open is the club down the road (the
//     calendar prices its travel at $60-120 against a Regional's $150-400) and nobody comes home
//     from it; a Regional Championship is a выезд in the plain sense of the word – another town,
//     a night away, a drive back. TIER AND NOT COST, deliberately: the academy scholarship pays up
//     to 80% of a fare, and a J300 abroad is the same journey whether the family or the academy
//     bought the ticket. Cost is what she paid; tier is where she went.
//
// (b) WHICH OF THE FOUR — correlated with the trip, not uniform, because the data supports it and
//     uniform noise would put her in an airport coming back from the next county. Every tier
//     already carries a `track`: `itf` is the junior international tour (the calendar's own words:
//     "international travel out"), `domestic` is local/regional/national. So the international
//     ladder flies home (airport, plane) and the domestic one drives (bus, car) – which also means
//     a career that never leaves the domestic ladder never sees an airport, and the first J30 trip
//     brings a picture she has not seen before.
//
//     THE DRAW is a purpose-scoped sub-stream, `seed:travel:<week>` – the same week always produces
//     the same scene, on any device and any replay, and ZERO draws land on the MAIN weekly stream
//     (nothing here runs inside the tick at all, so the frozen capture 41550 / e6b0c709 cannot move
//     by construction). Keyed on the week she comes HOME, which is the week the picture is shown.

/** The two buckets, and the scenes that tell each journey. */
const TRAVEL_HOME_SCENES: Record<'air' | 'road', readonly TravelHomeScene[]> = {
  air: ['airport', 'plane'],
  road: ['bus', 'car'],
}

/** Her competitive tournament tier in `week`, off the event feed – null when she played none.
 *  Only the kid's own matches are ever recorded as `match` events (the AI brackets resolve without
 *  a scoreline), which is the same assumption `lastKidResultOf` above rests on. A friendly is
 *  skipped by the predicate her face uses (R11-2): a hit-out at the club is not a trip. */
function playedTierIn(events: readonly WorldEvent[], week: number): TierId | null {
  for (const e of events) {
    if (e.week !== week || !e.match || !resultShowsOnHerFace(e)) continue
    return tierFromEventId(e.match.eventId) ?? null
  }
  return null
}

/** Net travel spend in `week`, in signed cents (negative = the family paid). */
function travelCentsIn(events: readonly WorldEvent[], week: number): number {
  return events
    .filter((e) => e.week === week && e.category === 'travel')
    .reduce((sum, e) => sum + (e.amountCents ?? 0), 0)
}

/**
 * The scene of the journey home for `week`, or null. See the note above for the whole argument.
 * Pure and deterministic: the same arguments always answer the same scene.
 *
 * `pendingUnfinished` is clause 4's second half – a reveal in flight belongs to THIS week and has
 * not written its summary event yet, so the walk alone would not see it.
 */
export function travelHomeSceneFor(args: {
  /** the full retained event log */
  events: readonly WorldEvent[]
  /** the week she is HOME – the week the picture would be shown on */
  week: number
  seed: string
  /** a tournament reveal of hers is in flight this week (DiaryWorldView.pendingUnfinished) */
  pendingUnfinished?: boolean
}): TravelHomeScene | null {
  const { events, week, seed } = args
  const away = week - 1
  if (away < 0) return null
  // 4. she stayed home this week – no tournament of hers, resolved or in flight
  if (args.pendingUnfinished) return null
  if (playedTierIn(events, week) !== null) return null
  if (events.some((e) => e.week === week && e.type === 'tournament')) return null
  // 1-2. she played an away tournament last week...
  const tier = playedTierIn(events, away)
  if (tier === null || tier === 'local') return null
  // 3. ...and the family paid to get her there
  if (travelCentsIn(events, away) >= 0) return null
  const pool = TRAVEL_HOME_SCENES[TIERS[tier].track === 'itf' ? 'air' : 'road']
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
  /** the week she is HOME – the week the picture and the note are shown on */
  week: number
  /** the week she PLAYED – always `week - 1` */
  awayWeek: number
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
  /** how long that injury keeps her out in total, in weeks – 0 when she is healthy. A niggle and a
   *  season-ending one are not the same note, and the pool splits on it. */
  injuryWeeks: number
  conditionBand: ConditionBand
}

/** Her competitive matches at `week`, newest last. Only the kid's own matches are ever recorded as
 *  `match` events, and a practice friendly is skipped by the same predicate her face uses (R11-2). */
function kidMatchesIn(events: readonly WorldEvent[], week: number): readonly WorldEvent[] {
  return events.filter((e) => e.week === week && e.match && resultShowsOnHerFace(e))
}

/**
 * Is `awayWeek` her FIRST trip on the international ladder?
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
function firstAbroadIn(
  events: readonly WorldEvent[],
  milestones: readonly Milestone[],
  awayWeek: number,
): boolean {
  const first = milestones.find((m) => m.type === 'international')
  if (!first) return false
  if (!events.some((e) => e.week <= first.week)) return false
  for (const e of events) {
    if (e.week >= awayWeek || !e.match || !resultShowsOnHerFace(e)) continue
    const tier = tierFromEventId(e.match.eventId)
    if (tier && TIERS[tier].track === 'itf') return false
  }
  return true
}

/** ⚠ IT IS A COIN, AND THE COIN IS WEIGHTED BY HOW EMPTY SHE IS.
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

/** The owner's rule. BOTH branches are a coin now, on the same sub-stream keyed to the week she
 *  comes home - one draw, whichever way the week went. */
export function travelHomeMoodFor(args: {
  reachedFinal: boolean
  condition: number
  seed: string
  week: number
}): TravelHomeMood {
  const roll = rngFromSeed(`${args.seed}:travelmood:${args.week}`)()
  if (args.reachedFinal) return roll < 0.5 ? 'happy' : 'sleepy'
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
  /** the active injury the week she gets home, or null */
  injury: { totalWeeks: number } | null
  pendingUnfinished?: boolean
}): TravelHomeFacts | null {
  const scene = travelHomeSceneFor(args)
  if (scene === null) return null
  const awayWeek = args.week - 1
  const tier = playedTierIn(args.events, awayWeek)!
  const matches = kidMatchesIn(args.events, awayWeek)
  const matchesWon = matches.filter((e) => e.match!.winnerId === args.kidId).length
  const summary = args.events.find((e) => e.week === awayWeek && e.type === 'tournament')
  const finishIdx = summary?.finishIdx ?? null
  const wonTitle = finishIdx === 0
  const lostFinal = finishIdx === 1
  const conditionBand = conditionBandOf(args.condition)
  const reachedFinal = wonTitle || lostFinal
  const abroad = TIERS[tier].track === 'itf'
  return {
    week: args.week,
    awayWeek,
    scene,
    mood: travelHomeMoodFor({ reachedFinal, condition: args.condition, seed: args.seed, week: args.week }),
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
    // milestone answers "has she ever signed up for one"; only the away week's own tier answers
    // "was THIS the trip". Pinned on a live career in tests/travel-home.test.ts.
    firstAbroad: abroad && firstAbroadIn(args.events, args.milestones, awayWeek),
    injured: args.injury !== null,
    injuryWeeks: args.injury?.totalWeeks ?? 0,
    conditionBand,
  }
}

/** Which of this week's captured milestones the diary calls THE fresh one (a title week also
 *  captures its final – the louder fact wins). */
const MILESTONE_PRIORITY: readonly MilestoneType[] = ['title', 'final', 'international', 'injury', 'season-rank']

/** Assemble the facts – every field read off state that already exists, and (since R14-2) exactly
 *  TWO that are drawn: `travelHomeScene` and the coin inside `travelHomeMood`, each on its own
 *  purpose-scoped sub-stream. Rule 2 at the top of this file is unchanged and is what matters –
 *  zero draws on the MAIN weekly stream, from anything in this module, ever. */
export function assembleDiaryFacts(view: DiaryWorldView): DiaryFacts {
  const { week } = view
  const lastResult = lastKidResultOf(view.events, view.kidId)
  const lastTitle = lastKidTitleOf(view.events)
  // The engine's capture behind the third loss softener: strictly better rank than before this
  // week's recompute. Gated off while a reveal is mid-flight – the recompute is deferred to
  // finalize, so until then the cached movement is LAST week's and must not colour this week's.
  const rankClimbed =
    !view.pendingUnfinished && view.prevKidRank !== null && view.kidRank < view.prevKidRank
  const emotion = avatarEmotion({
    week,
    condition: view.condition,
    injured: view.injury !== null,
    lastResult,
    lastTitle,
    lossStreak: view.lossStreak,
    rankClimbed,
    runPointsThisWeek: view.runPointsThisWeek,
  })
  const resultFresh = lastResult !== null && lastResult.week === week
  const thisWeek = view.events.filter((e) => e.week === week)
  // Net, not any-event: a skipped tournament refunds its travel in the same week and nets to 0 –
  // she never boarded, so the diary must not claim the trip.
  const travelCents = thisWeek
    .filter((e) => e.category === 'travel')
    .reduce((sum, e) => sum + (e.amountCents ?? 0), 0)
  const freshMilestone =
    MILESTONE_PRIORITY.find((t) => view.milestones.some((m) => m.type === t && m.week === week)) ?? null
  const travelHome = travelHomeFactsFor({
    events: view.events,
    milestones: view.milestones,
    week,
    seed: view.seed,
    kidId: view.kidId,
    condition: view.condition,
    injury: view.injury,
    pendingUnfinished: view.pendingUnfinished,
  })
  return {
    week,
    emotion,
    resultFresh,
    won: resultFresh && lastResult.won,
    lostFinal: resultFresh && lastResult.lostFinal,
    titleThisWeek: thisWeek.some((e) => e.type === 'tournament' && e.finishIdx === 0),
    resultTier: resultFresh ? (lastResult.tier ?? null) : null,
    rankClimbed,
    runPointsThisWeek: view.runPointsThisWeek,
    lossStreak: view.lossStreak?.losses ?? 0,
    condition: view.condition,
    conditionBand: conditionBandOf(view.condition),
    injured: view.injury,
    travelled: travelCents < 0,
    playedTournament: thisWeek.some(
      (e) => e.type === 'tournament' || (e.match !== undefined && !e.friendly),
    ),
    playedPractice: thisWeek.some((e) => e.match !== undefined && e.friendly === true),
    examsWeek: isExamWeek(week),
    offSeasonWeek: isOffSeasonWeek(week),
    vacationWeek: view.vacationWeek,
    trainPct: view.trainPct,
    fundsPressure: fundsPressureOf(view.fundsCents),
    freshMilestone,
    // R14-2: the two facts here that are drawn rather than read, and they are drawn because there is
    // no state to read them off – which of four equally-true pictures of the same journey to show,
    // and (when she reached the final) whether the parent remembers her laughing or asleep, are
    // questions the simulation does not answer. Purpose-scoped sub-streams (`seed:travel:<week>` and
    // `seed:travelmood:<week>`), stable for the whole week, zero MAIN draws. Everything else about
    // the journey IS read – see travelHomeFactsFor.
    travelHomeScene: travelHome?.scene ?? null,
    travelHomeMood: travelHome?.mood ?? null,
  }
}

// --- the phrase pool ------------------------------------------------------------------------

export type DiarySurface = 'photo' | 'condition'

/** What a line ASSERTS, as data the honesty pin can hold against the facts. Every tag is a claim
 *  the pin re-checks independently: a `won: true` line licensed on a loss is a failing test, not
 *  a matter of taste. `affect: 'positive'` is the spec's own concrete rule – unselectable while
 *  the emotion is sad, angry or rehab (R14-1 renamed the last one: the layoff face, formerly
 *  `injury`). */
export interface DiaryClaims {
  affect: 'positive' | 'neutral' | 'negative'
  /** asserts a fresh win this week */
  won?: true
  /** asserts a fresh competitive loss this week */
  lost?: true
  /** asserts a title landed this week */
  title?: true
  /** asserts a fresh lost final (runner-up) */
  runnerUp?: true
  /** asserts the table moved up despite the loss AND that she EARNED the move (run points > 0,
   *  i.e. she won matches this week) – the owner's "good loss". R13-2: a passive climb – rivals'
   *  results decaying out of their windows on her zero-point week – licenses none of these. */
  rankClimbed?: true
  /** asserts the anger crossing – the loss that broke her composure */
  angry?: true
  /** asserts an active injury */
  injured?: true
  /** R14-1: asserts the injury happened THIS week – the onset, not a week of the layoff. A
   *  strictly stronger claim than `injured`, and the pin checks it separately. */
  justHurt?: true
  /** asserts a worn body – unselectable at condition ≥ 80 */
  tired?: true
  /** asserts a genuinely fresh body – unselectable below 80 */
  freshBody?: true
  /** asserts the family travelled this week */
  travel?: true
  /** asserts a tournament was played this week */
  tournament?: true
  /** asserts a practice friendly this week */
  practice?: true
  exams?: true
  vacation?: true
  offSeason?: true
  /** asserts money is tight */
  fundsTight?: true
  /** asserts an ordinary week: no fresh result, no drains, healthy */
  quietWeek?: true
}

export interface DiaryPhrase {
  surface: DiarySurface
  /** the line, a facts-aware template, or null – a DELIBERATE quiet week (photo surface only) */
  text: string | ((f: DiaryFacts) => string) | null
  claims: DiaryClaims
  license: (f: DiaryFacts) => boolean
}

/** Short tier name for the diary's voice, total over null ("the J30 trip" / "the tournament trip"). */
function short(tier: TierId | null): string {
  return tier ? TIER_SHORT[tier] : 'tournament'
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/** THE WEEK IT HAPPENED (R14-1). Nothing has been ticked off the layoff yet – `rollInjury` sets
 *  `weeksRemaining = totalWeeks` at onset and decrements at the TOP of every later week, so this is
 *  true on the onset week and on no other, a one-week injury included.
 *
 *  It exists because the split the owner asked for on her FACE has to hold in her PARENT'S VOICE
 *  too: `idleEmotion` no longer returns `injury` at all, so a licence reading `emotion === 'injury'`
 *  would be dead copy – but the lines it used to carry are not interchangeable. One of them is
 *  about the day the ice pack came out; the others are about week six. Derived from facts the diary
 *  already carries, so no new field and no schema question. */
const justHurt = (f: DiaryFacts): boolean =>
  f.injured !== null && f.injured.weeksRemaining === f.injured.totalWeeks

/** An ordinary, healthy, event-free week – the licence behind every quiet line AND the silences. */
const quiet = (f: DiaryFacts): boolean =>
  !f.resultFresh &&
  f.injured === null &&
  !f.travelled &&
  !f.playedTournament &&
  !f.playedPractice &&
  !f.examsWeek &&
  !f.offSeasonWeek &&
  !f.vacationWeek

// The Diary-1 pool. ~60 lines across the three surfaces (memory lines live in MEMORY_LINES below
// – they read a Milestone, not the week's facts). Every line: player-facing English, short dash,
// the parent's own quiet register. At most ONE line per surface per week, drawn deterministically.
export const DIARY_POOL: readonly DiaryPhrase[] = [
  // --- photo card (D2): fresh WIN --------------------------------------------------------------
  { surface: 'photo', text: "Can't stop smiling.", claims: { affect: 'positive', won: true }, license: (f) => f.won },
  {
    surface: 'photo',
    text: 'She hummed in the car the whole way home.',
    claims: { affect: 'positive', won: true },
    license: (f) => f.won,
  },
  {
    surface: 'photo',
    text: 'She replayed the last point for us at dinner – twice.',
    claims: { affect: 'positive', won: true },
    license: (f) => f.won,
  },
  {
    surface: 'photo',
    text: 'The trophy went straight onto the kitchen table.',
    claims: { affect: 'positive', won: true, title: true },
    license: (f) => f.won && f.titleThisWeek,
  },
  {
    surface: 'photo',
    text: 'She fell asleep holding the draw sheet.',
    claims: { affect: 'positive', won: true, title: true },
    license: (f) => f.won && f.titleThisWeek,
  },
  // --- photo card: runner-up (serious by R8-6a) ------------------------------------------------
  // R13-4: a final lost is a GOOD result and deserves its own words – the pool grew, and while it
  // is non-empty a lostFinal week selects ONLY from it (the climb lines below exclude lostFinal),
  // so the runner-up can never catch a generic loss line or a mere table-movement line.
  {
    surface: 'photo',
    text: 'Second place. The medal stayed in her bag.',
    claims: { affect: 'neutral', lost: true, runnerUp: true },
    license: (f) => f.resultFresh && !f.won && f.lostFinal,
  },
  {
    surface: 'photo',
    text: 'A final. She knows what that is worth.',
    claims: { affect: 'neutral', lost: true, runnerUp: true },
    license: (f) => f.resultFresh && !f.won && f.lostFinal,
  },
  {
    surface: 'photo',
    text: 'Runner-up. She pushed the final all the way.',
    claims: { affect: 'neutral', lost: true, runnerUp: true },
    license: (f) => f.resultFresh && !f.won && f.lostFinal,
  },
  {
    surface: 'photo',
    text: 'Lost the final, and walked off with her head up.',
    claims: { affect: 'neutral', lost: true, runnerUp: true },
    license: (f) => f.resultFresh && !f.won && f.lostFinal,
  },
  {
    surface: 'photo',
    text: 'A finalist. We let that word sit at dinner.',
    claims: { affect: 'neutral', lost: true, runnerUp: true },
    license: (f) => f.resultFresh && !f.won && f.lostFinal,
  },
  // --- photo card: the owner's "good loss" – lost, and the table moved up anyway ---------------
  // R13-2: licensed by (lost AND rankClimbed AND runPointsThisWeek > 0) – she must have EARNED the
  // climb by winning matches this week, not inherited it from rivals' decayed windows. The extra
  // emotion check keeps line and face in lockstep, but the points licence is asserted here in its
  // own right so no future softener re-order can let a passive climb speak.
  // R13-4: `!f.lostFinal` – a lost final keeps its own pool above; these are for the QF/SF exits
  // that still climbed.
  {
    surface: 'photo',
    text: 'Not a win – but she moved up the table.',
    claims: { affect: 'neutral', lost: true, rankClimbed: true },
    license: (f) => f.resultFresh && !f.won && !f.lostFinal && f.rankClimbed && f.runPointsThisWeek > 0 && f.emotion === 'serious',
  },
  {
    surface: 'photo',
    text: 'She lost late, and climbed anyway.',
    claims: { affect: 'neutral', lost: true, rankClimbed: true },
    license: (f) => f.resultFresh && !f.won && !f.lostFinal && f.rankClimbed && f.runPointsThisWeek > 0 && f.emotion === 'serious',
  },
  {
    surface: 'photo',
    text: 'Beaten on Saturday. Higher on Monday.',
    claims: { affect: 'neutral', lost: true, rankClimbed: true },
    license: (f) => f.resultFresh && !f.won && !f.lostFinal && f.rankClimbed && f.runPointsThisWeek > 0 && f.emotion === 'serious',
  },
  // --- photo card: a softened loss (local exit / a shielded champion) --------------------------
  {
    surface: 'photo',
    text: 'An early bus home. She was fine by evening.',
    claims: { affect: 'neutral', lost: true },
    license: (f) => f.resultFresh && !f.won && !f.lostFinal && f.emotion === 'serious',
  },
  // --- photo card: a real loss (sad) -----------------------------------------------------------
  {
    surface: 'photo',
    text: "She didn't say much on the way home.",
    claims: { affect: 'negative', lost: true },
    license: (f) => f.resultFresh && f.emotion === 'sad',
  },
  {
    surface: 'photo',
    text: 'She went straight to her room after dinner.',
    claims: { affect: 'negative', lost: true },
    license: (f) => f.resultFresh && f.emotion === 'sad',
  },
  {
    surface: 'photo',
    text: 'Quiet in the car. Quiet at the table.',
    claims: { affect: 'negative', lost: true },
    license: (f) => f.resultFresh && f.emotion === 'sad',
  },
  {
    surface: 'photo',
    text: 'Her bag is still packed by the door.',
    claims: { affect: 'negative', lost: true },
    license: (f) => f.resultFresh && f.emotion === 'sad',
  },
  // --- photo card: the crossing (angry) --------------------------------------------------------
  {
    surface: 'photo',
    text: 'The bag hit the hallway floor harder than it needed to.',
    claims: { affect: 'negative', lost: true, angry: true },
    license: (f) => f.emotion === 'angry',
  },
  {
    surface: 'photo',
    text: 'She slammed the car door. We let it go.',
    claims: { affect: 'negative', lost: true, angry: true },
    license: (f) => f.emotion === 'angry',
  },
  // --- photo card: THE MOMENT she got hurt ------------------------------------------------------
  // R14-1: these three lines all read `emotion === 'injury'` when that was one meaning wearing two
  // hats. It is two weeks, and they are not the same week – so each line went to the meaning it was
  // written for. The ice pack is NEWS: it appears on the counter the evening she comes home hurt,
  // and by week six it is furniture. Licensed on the onset, which is also the week the blocking
  // popup fires and the week the `injury` painting is shown – caption, picture and dialog all
  // naming the same moment.
  {
    surface: 'photo',
    text: 'The ice pack lives on the kitchen counter now.',
    claims: { affect: 'negative', injured: true, justHurt: true },
    license: justHurt,
  },
  // --- photo card: the LAYOFF (idle rehab) ------------------------------------------------------
  // ...and these two are about the weeks that follow. Watching from the bench and counting down are
  // both things you can only do once the news has stopped being news – they need the layoff to have
  // length, which is exactly what the rehab painting behind them shows.
  {
    surface: 'photo',
    text: 'She watches practice from the bench this week.',
    claims: { affect: 'negative', injured: true },
    license: (f) => f.emotion === 'rehab',
  },
  {
    surface: 'photo',
    text: 'She counts the weeks to her return out loud.',
    claims: { affect: 'negative', injured: true },
    license: (f) => f.emotion === 'rehab',
  },
  // --- photo card: worn down (idle tired) ------------------------------------------------------
  {
    surface: 'photo',
    text: 'Asleep before nine, two nights running.',
    claims: { affect: 'negative', tired: true },
    license: (f) => f.emotion === 'tired',
  },
  {
    surface: 'photo',
    text: 'Slow mornings. Heavy bag.',
    claims: { affect: 'negative', tired: true },
    license: (f) => f.emotion === 'tired',
  },
  {
    surface: 'photo',
    text: 'The racquet stayed by the door all weekend.',
    claims: { affect: 'negative', tired: true },
    license: (f) => f.emotion === 'tired',
  },
  // --- photo card: composed but low (idle serious, 40-59) --------------------------------------
  {
    surface: 'photo',
    text: 'Quieter than usual this week.',
    claims: { affect: 'neutral', tired: true },
    license: (f) => !f.resultFresh && f.emotion === 'serious',
  },
  {
    surface: 'photo',
    text: 'Focused, and a little far away at dinner.',
    claims: { affect: 'neutral', tired: true },
    license: (f) => !f.resultFresh && f.emotion === 'serious',
  },
  // --- photo card: the week itself (idle norm, something domestic happened) --------------------
  {
    surface: 'photo',
    text: 'Textbooks where the grips usually are.',
    claims: { affect: 'neutral', exams: true },
    license: (f) => f.examsWeek && !f.resultFresh && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'A week away. The racquet stayed home.',
    claims: { affect: 'neutral', vacation: true },
    license: (f) => f.vacationWeek && !f.resultFresh && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'A hit-out at the club, nothing on the line.',
    claims: { affect: 'neutral', practice: true },
    license: (f) => f.playedPractice && !f.resultFresh && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'We talk about money after she goes to bed.',
    claims: { affect: 'negative', fundsTight: true },
    license: (f) => f.fundsPressure === 'tight' && !f.resultFresh && f.emotion !== 'happy',
  },
  // --- photo card: an ordinary week (idle norm) – lines AND silences ---------------------------
  // R13-10 (owner, first Diary-1 playtest: «там же тоже жизнь продолжается»): the ordinary-week
  // pool grew from three lines to twelve – school, kitchen, bus, phone, homework, weather, all
  // domestic one-liners licensed by the quiet-week facts alone, asserting nothing about her tennis
  // or her body the facts do not carry. The silences moved from three-in-six to four-in-sixteen:
  // an ordinary week now SPEAKS roughly three times in four and stays quiet the fourth – silence
  // is still possible and still meaningful, it just stopped being the default.
  {
    surface: 'photo',
    text: 'She seems calm.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'An ordinary week – school, practice, pasta.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'Nothing to report. That is its own kind of good.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'Homework at the kitchen table, racquet by the door.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'She missed the bus and ran for it, laughing.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'Pasta again. Nobody complained.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'Rain most of the week – practice moved indoors.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'Her phone buzzed all evening. The homework got done anyway.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'A school project took the evenings – glue on everything.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'Groceries together on Saturday. She pushed the cart.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'A new month on the kitchen calendar. The same routine.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  {
    surface: 'photo',
    text: 'Warm evenings – dinner ran long on the balcony.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm',
  },
  // Four deliberate silences against the twelve lines above: roughly one quiet week in four says
  // nothing at all (R13-10 – down from one-in-two).
  { surface: 'photo', text: null, claims: { affect: 'neutral', quietWeek: true }, license: (f) => quiet(f) && f.emotion === 'norm' },
  { surface: 'photo', text: null, claims: { affect: 'neutral', quietWeek: true }, license: (f) => quiet(f) && f.emotion === 'norm' },
  { surface: 'photo', text: null, claims: { affect: 'neutral', quietWeek: true }, license: (f) => quiet(f) && f.emotion === 'norm' },
  { surface: 'photo', text: null, claims: { affect: 'neutral', quietWeek: true }, license: (f) => quiet(f) && f.emotion === 'norm' },

  // --- condition note (D1): WHY the bar reads the way it does ----------------------------------
  {
    surface: 'condition',
    text: (f) => `Still tired from the ${short(f.resultTier)} trip.`,
    claims: { affect: 'neutral', travel: true, tournament: true },
    license: (f) => f.travelled && f.playedTournament,
  },
  {
    surface: 'condition',
    text: 'Match week – the travel and the tennis both took their cut.',
    claims: { affect: 'neutral', travel: true, tournament: true },
    license: (f) => f.travelled && f.playedTournament,
  },
  // A tournament week mid-reveal: the trip is real and charged, the matches not yet shown.
  {
    surface: 'condition',
    text: 'On the road this week.',
    claims: { affect: 'neutral', travel: true },
    license: (f) => f.travelled && !f.playedTournament,
  },
  {
    surface: 'condition',
    text: (f) => `Out with the ${f.injured?.kind ?? 'injury'} – ${plural(f.injured?.weeksRemaining ?? 1, 'week')} to go.`,
    claims: { affect: 'negative', injured: true },
    license: (f) => f.injured !== null,
  },
  {
    surface: 'condition',
    text: 'Rehab sets the pace this week.',
    claims: { affect: 'negative', injured: true },
    license: (f) => f.injured !== null,
  },
  {
    surface: 'condition',
    text: 'Exams took the week.',
    claims: { affect: 'neutral', exams: true },
    license: (f) => f.examsWeek && f.injured === null,
  },
  {
    surface: 'condition',
    text: 'School week – the court waited.',
    claims: { affect: 'neutral', exams: true },
    license: (f) => f.examsWeek && f.injured === null,
  },
  {
    surface: 'condition',
    text: 'A family week away – she came back lighter.',
    claims: { affect: 'positive', vacation: true },
    license: (f) => f.vacationWeek && f.injured === null && !f.resultFresh,
  },
  {
    surface: 'condition',
    text: 'Off-season – rest, school, family.',
    claims: { affect: 'neutral', offSeason: true },
    license: (f) => f.offSeasonWeek && f.injured === null && !f.vacationWeek,
  },
  {
    surface: 'condition',
    text: 'A practice match, and the usual training.',
    claims: { affect: 'neutral', practice: true },
    license: (f) => f.playedPractice && f.injured === null,
  },
  {
    surface: 'condition',
    text: 'A quiet training week.',
    claims: { affect: 'neutral', quietWeek: true },
    license: quiet,
  },
  {
    surface: 'condition',
    text: 'Training, school, repeat.',
    claims: { affect: 'neutral', quietWeek: true },
    license: quiet,
  },
  {
    surface: 'condition',
    text: 'Fresh – the rest is paying off.',
    claims: { affect: 'positive', quietWeek: true, freshBody: true },
    license: (f) => quiet(f) && f.conditionBand === 'fresh',
  },
  {
    surface: 'condition',
    text: 'She is running on empty – a rest week would not hurt.',
    claims: { affect: 'negative', quietWeek: true, tired: true },
    license: (f) => quiet(f) && f.conditionBand === 'drained',
  },
]

// --- selection ------------------------------------------------------------------------------

/** At most ONE line for a surface, drawn deterministically off `seed:diary:<week>:<surface>` –
 *  stable for the whole week (no flicker, no reload lottery), zero MAIN draws. Null = silence:
 *  either nothing is licensed, or a deliberate quiet entry was drawn. */
export function diaryLine(surface: DiarySurface, facts: DiaryFacts, seed: string): string | null {
  const pool = DIARY_POOL.filter((p) => p.surface === surface && p.license(facts))
  if (pool.length === 0) return null
  const rng = rngFromSeed(`${seed}:diary:${facts.week}:${surface}`)
  const pick = pool[Math.floor(rng() * pool.length)]
  if (pick.text === null) return null
  return typeof pick.text === 'function' ? pick.text(facts) : pick.text
}

// --- the note on the scrap under the journey painting -----------------------------------------
//
// The owner, 29.07: «про неё родительской рукой – так и делай, надо прям красиво, жизненно и уютно
// сделать. Если травму получила - поддержать как-то словами на записке, если проиграла - тоже».
//
// A PARENT WROTE THIS, ABOUT THEIR DAUGHTER, AFTER THE DRIVE HOME. It is not a match report and it
// is not the game talking. Four rules, and they are what separate this pool from every other string
// in the app:
//
//  1. THIRD PERSON, AND SOMEBODY WHO LOVES HER IS HOLDING THE PEN. "She slept the whole way back" –
//     never "You reached the final", never her name (the game rolls it; a note that uses it reads
//     like a certificate). The narrator says "we" where a family would and never says "I".
//  2. WARM, PLAIN, SMALL. No cheerleading, no lessons, no "champions are made in weeks like this".
//     The best lines here are almost nothing: one observed detail that happens to carry the week.
//  3. A LOSS GETS SUPPORT, NOT A CONSOLATION PRIZE. Not one line congratulates her on a good effort.
//     What a parent actually does is NOTICE her rather than grade her, so that is what these do:
//     the hood stayed up, she was mostly hungry, she asked what was for dinner.
//  4. AN INJURY GETS TENDERNESS, and usually by talking about something else entirely.
//
// ⚠ NOT THE COACH'S VOICE. The Weekly Story has a second writer on it – the radar's axis notes
// (engine/radar.ts: "Long matches suit her. The other girl tires first.") speak in the coach's
// register, and two voices on one card only work if they are audibly different people. The coach
// ASSESSES and talks about the tennis; the parent OBSERVES and talks about the girl. If a line here
// could sit in a coaching note, it is in the wrong voice and does not belong in this pool.
//
// EVERY LINE MUST BE TRUE OF THE WEEK IT LANDS ON, which is why the pool lives here beside the facts
// and not in a component: a note about a final on a week she went out in the first round is the one
// failure that would kill the whole effect. Same discipline as DIARY_POOL – a `claims` object the
// honesty pin re-checks independently against `TravelHomeFacts`, so a mis-licensed line is a failing
// test rather than a matter of taste.

/** What a journey-home line ASSERTS, as data the honesty pin can hold against the trip's facts. */
export interface TravelClaims {
  /** asserts she won the tournament */
  title?: true
  /** asserts she reached the final and lost it */
  runnerUp?: true
  /** asserts she did not win it */
  lost?: true
  /** asserts she won at least one match on the trip */
  wonMatches?: true
  /** asserts one match and no wins – the first-round exit */
  firstRound?: true
  /** asserts she is carrying an injury */
  injured?: true
  /** asserts a worn-out girl – unselectable above the `drained` rung */
  tired?: true
  /** asserts the trip crossed a border (the ITF ladder, so the journey home is air) */
  abroad?: true
  /** asserts this was her FIRST tournament abroad */
  firstAbroad?: true
  /** asserts a journey by road – bus or car */
  road?: true
  /** asserts she was asleep on the way: only the `sleepy` paintings show that, and the other two
   *  show her awake, so this is a claim about the ART as much as about the week */
  slept?: true
}

export interface TravelNote {
  text: string
  claims: TravelClaims
  license: (t: TravelHomeFacts) => boolean
}

const road = (t: TravelHomeFacts): boolean => !t.abroad
const asleep = (t: TravelHomeFacts): boolean => t.mood === 'sleepy'
const awake = (t: TravelHomeFacts): boolean => t.mood !== 'sleepy'
/** Everything below the injury and the first passport, which take a week to themselves. */
const ordinary = (t: TravelHomeFacts): boolean => !t.injured && !t.firstAbroad
/** She lost, and the loss was not the final – the ordinary weeks the junior road is mostly made of. */
const plainLoss = (t: TravelHomeFacts): boolean => ordinary(t) && !t.reachedFinal

export const TRAVEL_NOTES: readonly TravelNote[] = [
  // --- SHE WON IT --------------------------------------------------------------------------------
  {
    text: 'She won it, and then asked if we could stop for chips.',
    claims: { title: true, road: true },
    license: (t) => ordinary(t) && t.wonTitle && road(t),
  },
  {
    text: 'Champion, and she still wanted to know who won the other draw.',
    claims: { title: true },
    license: (t) => ordinary(t) && t.wonTitle,
  },
  {
    text: 'She fell asleep with the cup still in the bag on her knees.',
    claims: { title: true, slept: true },
    license: (t) => ordinary(t) && t.wonTitle && asleep(t),
  },
  {
    text: 'She won it, and talked the whole way home about one point in the second round.',
    claims: { title: true, wonMatches: true },
    license: (t) => ordinary(t) && t.wonTitle && awake(t),
  },
  {
    text: 'A trophy on the back seat and a hoodie she has not taken off since Saturday.',
    claims: { title: true, road: true },
    license: (t) => ordinary(t) && t.wonTitle && road(t),
  },
  {
    text: 'She won it. The first thing she did at the gate was ring her grandmother.',
    claims: { title: true, abroad: true },
    license: (t) => ordinary(t) && t.wonTitle && t.abroad,
  },
  // --- THE SILVER --------------------------------------------------------------------------------
  // The owner named this one himself («победила, серебро, старалась»). It is a good result and it
  // still stings, and a parent's note does not try to fix that – it just sits next to her.
  {
    text: 'One match short. She has not said a word about it, and neither have we.',
    claims: { runnerUp: true, lost: true },
    license: (t) => ordinary(t) && t.lostFinal,
  },
  {
    text: 'She got to the final. On the way back she talked about everything else.',
    claims: { runnerUp: true, lost: true },
    license: (t) => ordinary(t) && t.lostFinal && awake(t),
  },
  {
    text: 'Second, and she watched the final back on her phone twice before we were home.',
    claims: { runnerUp: true, lost: true },
    license: (t) => ordinary(t) && t.lostFinal && awake(t),
  },
  {
    text: 'She lost the last one and was asleep before the motorway.',
    claims: { runnerUp: true, lost: true, slept: true, road: true },
    license: (t) => ordinary(t) && t.lostFinal && asleep(t) && road(t),
  },
  {
    text: 'A final. Asleep the whole way home, the medal still round her neck.',
    claims: { runnerUp: true, lost: true, slept: true },
    license: (t) => ordinary(t) && t.lostFinal && asleep(t),
  },
  {
    text: 'Second. She is fine. She said so about four times.',
    claims: { runnerUp: true, lost: true },
    license: (t) => ordinary(t) && t.lostFinal,
  },
  {
    text: 'She lost the last match of the week and won every one before it.',
    claims: { runnerUp: true, lost: true, wonMatches: true },
    license: (t) => ordinary(t) && t.lostFinal,
  },
  // --- SHE WON MATCHES, AND THEN SHE DID NOT -----------------------------------------------------
  {
    text: 'She won some and lost the last one. It is the last one that comes home with us.',
    claims: { lost: true, wonMatches: true },
    license: (t) => plainLoss(t) && t.matchesWon > 0,
  },
  {
    text: 'Out on Friday. She was mostly hungry on the way back.',
    claims: { lost: true, wonMatches: true },
    license: (t) => plainLoss(t) && t.matchesWon > 0,
  },
  {
    text: 'Two days of winning and one of not. She only wanted to talk about the last one.',
    claims: { lost: true, wonMatches: true },
    license: (t) => plainLoss(t) && t.matchesWon > 0,
  },
  {
    text: 'A couple of wins, and then not. She still wanted the window seat home.',
    claims: { lost: true, wonMatches: true, abroad: true },
    license: (t) => plainLoss(t) && t.matchesWon > 0 && t.abroad,
  },
  // --- ONE MATCH, AND THE LONG WAY BACK ----------------------------------------------------------
  // The junior road is MOSTLY THIS – a first-round exit is the single commonest way a trip ends, and
  // the pool is sized for that: a family that goes away every other week for four years must not be
  // handed the same eight sentences. Nothing here grades her. She is noticed, and that is all.
  {
    text: 'One match, and a long way back for it. She kept her hood up the whole time.',
    claims: { lost: true, firstRound: true },
    license: (t) => ordinary(t) && t.firstRound,
  },
  {
    text: 'She lost the first one and stayed to watch the rest of it anyway.',
    claims: { lost: true, firstRound: true },
    license: (t) => ordinary(t) && t.firstRound,
  },
  {
    text: 'Out on the first day. Two flights, for one match.',
    claims: { lost: true, firstRound: true, abroad: true },
    license: (t) => ordinary(t) && t.firstRound && t.abroad,
  },
  {
    text: 'The long way home. She did not want to talk and we did not make her.',
    claims: { lost: true, firstRound: true },
    license: (t) => ordinary(t) && t.firstRound,
  },
  {
    text: 'She lost her opener. On the way back she slept with her shoes still on.',
    claims: { lost: true, firstRound: true, slept: true },
    license: (t) => ordinary(t) && t.firstRound && asleep(t),
  },
  {
    text: 'One match. She wanted to know how far the girl who beat her got.',
    claims: { lost: true, firstRound: true },
    license: (t) => ordinary(t) && t.firstRound,
  },
  {
    text: 'Out first, and asking about the next draw before we had found the car.',
    claims: { lost: true, firstRound: true, road: true },
    license: (t) => ordinary(t) && t.firstRound && road(t),
  },
  {
    text: 'Beaten in an hour, and then three hours of motorway.',
    claims: { lost: true, firstRound: true, road: true },
    license: (t) => ordinary(t) && t.firstRound && road(t),
  },
  {
    text: 'First match, last match. She carried her own bag all the way to the door.',
    claims: { lost: true, firstRound: true },
    license: (t) => ordinary(t) && t.firstRound,
  },
  // --- ANY WEEK SHE CAME BACK WITHOUT IT ---------------------------------------------------------
  // Licensed on the loss alone, so they thin out the repetition on the long grinding stretches where
  // every trip ends the same way.
  {
    text: 'She asked what was for dinner before we were out of the car park.',
    claims: { lost: true, road: true },
    license: (t) => plainLoss(t) && road(t),
  },
  {
    text: 'She put her headphones in somewhere outside the city and left them in.',
    claims: { lost: true },
    license: plainLoss,
  },
  {
    text: 'Home late. She ate standing up at the counter and went straight to bed.',
    claims: { lost: true },
    license: plainLoss,
  },
  {
    text: 'A long way for a short week. She slept from the ring road onward.',
    claims: { lost: true, slept: true, road: true },
    license: (t) => plainLoss(t) && asleep(t) && road(t),
  },
  {
    text: 'She slept from the gate to the taxi rank and never saw the airport.',
    claims: { lost: true, slept: true, abroad: true },
    license: (t) => plainLoss(t) && asleep(t) && t.abroad,
  },
  // --- SHE CAME HOME EMPTY ----------------------------------------------------------------------
  // Licensed on the BODY rather than on the result – but not on a week she reached a final. She got
  // to the last match of a J300 and the scrap said she went to bed early: true, and a wasted moment.
  // The loud results speak for themselves; exhaustion speaks on the weeks nothing else is the story.
  // `tired` is the bottom rung (below 40) – the same one the condition note calls running on empty.
  {
    text: 'She slept the whole way back and then went up to bed anyway.',
    claims: { tired: true, slept: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained' && asleep(t),
  },
  {
    text: 'She was asleep before we were out of the car park.',
    claims: { tired: true, slept: true, road: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained' && asleep(t) && road(t),
  },
  {
    text: 'A whole day of travelling, and she slept most of it.',
    claims: { tired: true, slept: true, abroad: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained' && asleep(t) && t.abroad,
  },
  {
    text: 'She ate, she showered, she was gone by half past eight.',
    claims: { tired: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained',
  },
  {
    text: 'She was asleep in her kit before we had the bags out of the car.',
    claims: { tired: true, slept: true, road: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained' && asleep(t) && road(t),
  },
  {
    text: 'Two days home and she is still catching up on the sleep.',
    claims: { tired: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained',
  },
  // --- THE FIRST PASSPORT WEEK -------------------------------------------------------------------
  // A once-in-a-career journey, and the first time the airport painting can appear at all, so it
  // takes the note to itself rather than competing with the result lines. Written result-agnostic
  // on purpose: what the week is about is the distance, not the draw.
  {
    text: 'Her first time through an airport with a racquet bag. She kept the ticket.',
    claims: { firstAbroad: true, abroad: true },
    license: (t) => !t.injured && t.firstAbroad,
  },
  {
    text: 'The furthest she has ever been from this kitchen. She came back somehow taller.',
    claims: { firstAbroad: true, abroad: true },
    license: (t) => !t.injured && t.firstAbroad,
  },
  {
    text: 'Her first one in another country. She wanted to know when the next one is.',
    claims: { firstAbroad: true, abroad: true },
    license: (t) => !t.injured && t.firstAbroad,
  },
  {
    text: 'First trip abroad. She slept through the landing and half the drive back.',
    claims: { firstAbroad: true, abroad: true, slept: true },
    license: (t) => !t.injured && t.firstAbroad && asleep(t),
  },
  {
    text: 'She listed everyone she met, the whole flight home.',
    claims: { firstAbroad: true, abroad: true },
    license: (t) => !t.injured && t.firstAbroad && awake(t),
  },
  // --- SHE CAME HOME HURT ------------------------------------------------------------------------
  // ⚠ THE INJURY TAKES THE NOTE, whatever else the week held. A line about chips on a week she has
  // just been told she is out for six is tone-deaf, so the licences above all carry `!t.injured` and
  // these are the only ones left standing. On the engine's own timing the news lands the week she
  // gets back (`rollInjury` runs at the top of a week, and an injury the week BEFORE would have
  // walked the tournament over and left no journey at all), so none of these claims she was hurt at
  // the tournament – they are about a girl who got home and then got the news.
  {
    text: 'The bag has not been unpacked. She is not allowed to lift it anyway.',
    claims: { injured: true },
    license: (t) => t.injured,
  },
  {
    text: 'We watched something stupid on television and did not mention tennis once.',
    claims: { injured: true },
    license: (t) => t.injured,
  },
  {
    // A niggle only. On a layoff of a season this reads as a parent not listening, so it is capped:
    // three weeks is the band where "it is nothing" is roughly what it turns out to be.
    text: 'She keeps saying it is nothing. We are getting it looked at anyway.',
    claims: { injured: true },
    license: (t) => t.injured && t.injuryWeeks <= 3,
  },
  {
    text: 'A long time to be off it. She has already asked what she can still do.',
    claims: { injured: true },
    license: (t) => t.injured && t.injuryWeeks >= 6,
  },
  {
    text: 'She has the calendar out, counting. We took it off her and made tea.',
    claims: { injured: true },
    license: (t) => t.injured && t.injuryWeeks >= 6,
  },
  {
    text: 'She is on the sofa with the ice on, working out who she would have played next.',
    claims: { injured: true },
    license: (t) => t.injured,
  },
  {
    text: 'She is worried about the wrong thing. She asked if the entry fee comes back.',
    claims: { injured: true },
    license: (t) => t.injured,
  },
]

/** The note for this journey. Drawn off `seed:travelnote:<week>` – its own purpose-scoped
 *  sub-stream, stable for the whole week, zero MAIN draws.
 *
 *  NEVER SILENT, unlike the photo caption. `diaryLine` is allowed to say nothing because an ordinary
 *  week saying nothing is itself a statement; this note is the CAPTION of a painting the player is
 *  looking at, and a picture of a girl asleep in a car with no words under it is a missing string,
 *  not a quiet week. The coverage sweep in tests/travel-home.test.ts proves the pool answers every
 *  reachable trip; the fallback is a sentence that is true of every journey there has ever been. */
export function travelNoteFor(travel: TravelHomeFacts, seed: string): string {
  const pool = TRAVEL_NOTES.filter((n) => n.license(travel))
  if (pool.length === 0) return 'A long way there, and a long way back.'
  const rng = rngFromSeed(`${seed}:travelnote:${travel.week}`)
  return pool[Math.floor(rng() * pool.length)].text
}

// --- W2: THE ORDINARY WEEK GETS THE SAME SCRAP AND THE SAME HAND ------------------------------
//
// The owner, 30.07: «Чтобы тренировочные недели не просто скипались нужно всё-таки видимо пришло
// время сделать какое-то пошаговый события Что происходит на этих неделях когда нет матчей а только
// тренировки».
//
// WHERE THE HOLE ACTUALLY IS, because "add events" could mean a month of work and the answer turned
// out to be an object that already exists. The Weekly Story has exactly one thing on it that is a
// STORY: the handwritten scrap under the painting, in the parent's own hand. On a come-home week it
// says «She asked what was for dinner before we were out of the car park.» On a training week – the
// week the owner is complaining about – the same scrap says «Restring – multifilament», because its
// fallback is the base-cost expense line. The most story-shaped thing on the screen is a RECEIPT on
// precisely the weeks the screen has nothing else to offer. So the ordinary week gets its own note,
// on the same scrap, in the same hand, under the same honesty discipline as TRAVEL_NOTES.
//
// THE FOUR RULES OF THE TRAVEL POOL HOLD WORD FOR WORD, and they are what stop this being decoration:
// third person, somebody who loves her holding the pen; warm, plain, small; no grading her; and every
// line TRUE of the week it lands on, licensed by facts and re-checked by the honesty pin.
//
// WHAT IT IS ALLOWED TO TALK ABOUT, and this is the design decision rather than the writing:
//
//   THE PLAYER'S OWN DECISION IS THE SUBJECT. `trainPct` is the one fact in DiaryFacts that is HIS
//   choice and not the world's, and it is the whole content of a training week. Grind (85) is a week
//   he spent her; Light (60) is a week he gave back. So the pool's biggest band is the three plan
//   bands, and the notes report the COST and the SLACK of the decision he made – in the kitchen, not
//   on a chart. That is what makes an ordinary week worth reading rather than tapping through: it is
//   the only place the game ever says out loud what Grind 85/15 does to a fifteen-year-old.
//
//   THE CALENDAR'S OWN WEEKS ALWAYS SPEAK. Exams, the off-season, a family holiday, a practice match
//   and a layoff are events in her life that happen to have no tournament in them; those weeks are
//   not "ordinary" and they get a note every time.
//
// ...AND IT IS QUIET MOST WEEKS. The training card learned that lesson this wave (buildTrainingRead)
// and it is the right one: a week that always says something is as dull as a week that never does.
// The ordinary bands are gated on a coin – `WEEK_NOTE_CHANCE` – so roughly one training week in three
// carries a note and the rest keep the ledger line they have always had. That fallback is why the
// gate can exist at all: unlike `travelNote`, silence here is not a missing string, it is the scrap
// going back to being a receipt.
//
// ⚠ THE COIN AND THE PICK ARE ONE SUB-STREAM, `seed:weeknote:<week>` – purpose-scoped, stable for the
// whole week, and ZERO draws on the MAIN weekly stream (nothing in this module runs inside the tick),
// so the frozen capture 41550 / e6b0c709 cannot move by construction.

/** What a week note ASSERTS, as data the honesty pin can hold against the week's facts. Same idea as
 *  `TravelClaims`: a mis-licensed line is a failing test, not a matter of taste. */
export interface WeekClaims {
  /** asserts a hard training week – unselectable below WEEK_NOTE_GRIND */
  grind?: true
  /** asserts an easy week – unselectable above WEEK_NOTE_LIGHT */
  light?: true
  /** asserts a worn body – unselectable above the `worn` rung */
  tired?: true
  /** asserts a genuinely fresh body – unselectable below `fresh` */
  freshBody?: true
  /** asserts an active injury */
  injured?: true
  exams?: true
  vacation?: true
  offSeason?: true
  /** asserts a practice friendly this week */
  practice?: true
  /** asserts money is tight */
  fundsTight?: true
  /** asserts no tournament and no journey – she was at home this week */
  athome?: true
}

export interface WeekNote {
  text: string
  claims: WeekClaims
  license: (f: DiaryFacts) => boolean
}

/** At or above this the week was a grind; at or below it, a light one. The preset ladder is
 *  60 / 75 / 85 (WEEK_PLAN_PRESETS), so these are the two ends of it and 75 is the quiet middle. */
export const WEEK_NOTE_GRIND = 85
export const WEEK_NOTE_LIGHT = 60
/** How often an ORDINARY training week says something. The calendar's own weeks ignore this. */
export const WEEK_NOTE_CHANCE = 1 / 3

/** She was at home and nothing competitive happened – the weeks this pool is for. Note this is
 *  WIDER than `quiet` above: an exam week, a holiday and a layoff are all weeks with a note here,
 *  and `quiet` deliberately excludes them. */
const athome = (f: DiaryFacts): boolean =>
  !f.playedTournament && !f.travelled && f.travelHomeScene === null

/** An ordinary training week: at home, healthy, and the calendar is holding nothing. */
const plainTraining = (f: DiaryFacts): boolean =>
  athome(f) && f.injured === null && !f.examsWeek && !f.offSeasonWeek && !f.vacationWeek && !f.playedPractice

export const WEEK_NOTES: readonly WeekNote[] = [
  // --- A GRIND WEEK: what 85/15 actually looks like from the kitchen -----------------------------
  {
    text: 'Six days on court. She ate like someone twice her size.',
    claims: { grind: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'Out before we were up, back after dark. All week.',
    claims: { grind: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'She fell asleep on the sofa with her shoes on. Twice.',
    claims: { grind: true, tired: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct >= WEEK_NOTE_GRIND && f.conditionBand !== 'fresh' && f.conditionBand !== 'ok',
  },
  {
    text: 'Three shirts a day this week. The machine has not stopped.',
    claims: { grind: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'She asked for an extra hour on Sunday. We said no. She went anyway.',
    claims: { grind: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'A blister on her serving hand. She taped it and said nothing.',
    claims: { grind: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  // --- A LIGHT WEEK: the slack he gave back, and what she did with it ----------------------------
  {
    text: 'Two mornings off. She spent both of them at the courts anyway.',
    claims: { light: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'A slow week. She baked something and it was mostly edible.',
    claims: { light: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'She had time to be fifteen this week. It suited her.',
    claims: { light: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'Light week. She and the neighbour argued about a film for an hour.',
    claims: { light: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'Rest days, and she was restless by the second one.',
    claims: { light: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  // --- THE MIDDLE, AND ANY TRAINING WEEK AT ALL -------------------------------------------------
  // Licensed on the plain training week alone, so the long stretches at Balanced are not four
  // sentences deep. Nothing here mentions how hard the week was, because that is the one thing
  // these do not know.
  {
    text: 'Drills, school, dinner, bed. She did not complain once.',
    claims: { athome: true },
    license: plainTraining,
  },
  {
    text: 'Same courts, same hours. She is getting quietly better at this.',
    claims: { athome: true },
    license: plainTraining,
  },
  {
    text: 'She practised her toss against the garage door until it got dark.',
    claims: { athome: true },
    license: plainTraining,
  },
  {
    text: 'A week of nothing much. She read a whole book on the bus.',
    claims: { athome: true },
    license: plainTraining,
  },
  {
    text: 'She has started keeping a notebook of what the coach says.',
    claims: { athome: true },
    license: plainTraining,
  },
  {
    text: 'New strings, an old grip she refuses to change. Superstition.',
    claims: { athome: true },
    license: plainTraining,
  },
  {
    text: 'She watched a match on her phone at the table and forgot to eat.',
    claims: { athome: true },
    license: plainTraining,
  },
  {
    text: 'Rain all week. She hit against the wall in the car park instead.',
    claims: { athome: true },
    license: plainTraining,
  },
  // --- HER BODY, on a week nothing else is the story --------------------------------------------
  {
    text: 'She is running on empty and pretending she is not.',
    claims: { tired: true, athome: true },
    license: (f) => plainTraining(f) && f.conditionBand === 'drained',
  },
  {
    text: 'Ice on her knee in front of the television. Not a word about it.',
    claims: { tired: true, athome: true },
    license: (f) => plainTraining(f) && f.conditionBand === 'drained',
  },
  {
    text: 'She has her legs back. It shows in the way she walks.',
    claims: { freshBody: true, athome: true },
    license: (f) => plainTraining(f) && f.conditionBand === 'fresh',
  },
  // --- MONEY, which is a training-week subject if ever there was one ----------------------------
  {
    text: 'We went through the coaching bill twice. It said the same thing both times.',
    claims: { fundsTight: true, athome: true },
    license: (f) => plainTraining(f) && f.fundsPressure === 'tight',
  },
  {
    text: 'She offered to skip a session to save the money. We did not let her.',
    claims: { fundsTight: true, athome: true },
    license: (f) => plainTraining(f) && f.fundsPressure === 'tight',
  },
  // --- THE CALENDAR'S OWN WEEKS. These ALWAYS speak – see the note above. -----------------------
  {
    text: 'Exams. The racquet stood in the hall all week and she looked at it a lot.',
    claims: { exams: true, athome: true },
    license: (f) => athome(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'Revision at the kitchen table until eleven. Tennis waited.',
    claims: { exams: true, athome: true },
    license: (f) => athome(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'She revised with the television on and somehow it worked.',
    claims: { exams: true, athome: true },
    license: (f) => athome(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'A week away as a family. Nobody mentioned rankings once.',
    claims: { vacation: true, athome: true },
    license: (f) => athome(f) && f.vacationWeek && f.injured === null,
  },
  {
    text: 'She swam every day and came back with a line across her nose.',
    claims: { vacation: true, athome: true },
    license: (f) => athome(f) && f.vacationWeek && f.injured === null,
  },
  {
    text: 'The season is over. She slept until nine and it was glorious.',
    claims: { offSeason: true, athome: true },
    license: (f) => athome(f) && f.offSeasonWeek && !f.vacationWeek && f.injured === null,
  },
  {
    text: 'Off-season. The bag is in the cupboard and the house is louder.',
    claims: { offSeason: true, athome: true },
    license: (f) => athome(f) && f.offSeasonWeek && !f.vacationWeek && f.injured === null,
  },
  {
    text: 'December. She is teaching her cousin to serve, badly.',
    claims: { offSeason: true, athome: true },
    license: (f) => athome(f) && f.offSeasonWeek && !f.vacationWeek && f.injured === null,
  },
  {
    text: 'A hit-out at the club. She played the whole thing like it counted.',
    claims: { practice: true, athome: true },
    license: (f) => athome(f) && f.playedPractice && f.injured === null,
  },
  {
    text: 'A practice match, and she still shook hands like it was a final.',
    claims: { practice: true, athome: true },
    license: (f) => athome(f) && f.playedPractice && f.injured === null,
  },
  // --- THE LAYOFF WEEKS. An injury takes the note, the way it does on the journey home. ----------
  {
    text: 'Rehab, three times this week. She counts the sessions down out loud.',
    claims: { injured: true, athome: true },
    license: (f) => athome(f) && f.injured !== null,
  },
  {
    text: 'She sat by the court with her homework and watched the others hit.',
    claims: { injured: true, athome: true },
    license: (f) => athome(f) && f.injured !== null,
  },
  {
    text: 'The physio says it is going well. She wanted a second opinion.',
    claims: { injured: true, athome: true },
    license: (f) => athome(f) && f.injured !== null,
  },
]

/**
 * The ordinary week's note, or null.
 *
 * Two decisions, one draw, on `seed:weeknote:<week>`: whether an ordinary training week speaks at
 * all (WEEK_NOTE_CHANCE – the calendar's own weeks skip this coin), and which of the licensed lines
 * it speaks. Pure and deterministic: the same week always says the same thing.
 *
 * Returns null on a come-home week without being asked to know about one – `athome` reads
 * `travelHomeScene`, so the scrap can never have two authors in one week.
 */
export function weekNoteFor(facts: DiaryFacts, seed: string): string | null {
  const pool = WEEK_NOTES.filter((n) => n.license(facts))
  if (pool.length === 0) return null
  const rng = rngFromSeed(`${seed}:weeknote:${facts.week}`)
  // The coin first, so the pick is drawn off the same stream in the same order every time.
  const coin = rng()
  if (plainTraining(facts) && coin >= WEEK_NOTE_CHANCE) return null
  return pool[Math.floor(rng() * pool.length)].text
}

// --- the greeting (epic/redesign-home) --------------------------------------------------------

/** The four words the diary page can open with. Time of day, nothing else – the greeting is
 *  CHROME above the date line, and the girl's week is the hero caption's job. */
export const GREETINGS = ['Good morning', 'Good afternoon', 'Good evening', 'Good night'] as const
export type Greeting = (typeof GREETINGS)[number]

/** The greeting for this week's diary page.
 *
 *  THE OWNER'S RULE, and it comes first: morning before the week is played, evening once the
 *  tournaments have resolved. Both arms are FACTS, so they win outright –
 *   - `week === 0` is a career that has not played a week yet: the page is opened in the morning
 *     of the whole story, which is exactly the beat the word is for;
 *   - `playedTournament` is the engine's own "a tournament resolved inside this week".
 *
 *  Everything else – the training weeks, the exam weeks, the layoffs – has no time of day the facts
 *  can name, so it VARIES, deterministically, off `seed:greet:<week>`: stable for the whole week
 *  (no flicker across re-renders or reloads) and drawn on its own purpose-scoped sub-stream, so the
 *  frozen MAIN capture cannot move. Nothing here runs inside the tick.
 *
 *  NOT A DUPLICATE OF THE CAPTION. The hero already speaks one line about her week, and the two sit
 *  a thumb apart; a page that says "Good night" over "Asleep before nine, two nights running." has
 *  said the same thing twice. The varying arm therefore drops any word the photo line has already
 *  used ("morning" / "afternoon" / "evening" / "night"), and falls back to the full set if a future
 *  caption should ever manage to use all four. */
export function greetingFor(facts: DiaryFacts, photoLine: string | null, seed: string): Greeting {
  if (facts.playedTournament) return 'Good evening'
  if (facts.week === 0) return 'Good morning'
  const line = (photoLine ?? '').toLowerCase()
  const free = GREETINGS.filter((g) => !line.includes(g.slice('Good '.length)))
  const pool = free.length > 0 ? free : GREETINGS
  const rng = rngFromSeed(`${seed}:greet:${facts.week}`)
  return pool[Math.floor(rng() * pool.length)]
}

// --- Memory (D10) ---------------------------------------------------------------------------

/** One memory line per milestone type; same licence discipline (the licence IS the type match,
 *  and the honesty pin holds each line's template to its milestone's own payload). */
export interface MemoryLine {
  type: MilestoneType
  text: (m: Milestone) => string
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s
}

/** How long a memory line may be. The Memory polaroid is a `card-short` (138px) in Home's 2x2 grid,
 *  and the line is set in the handwriting face beside a 68px photograph – so a long sentence does not
 *  clip, it STRETCHES the grid row and the card stops matching the coach card next to it. 39 is the
 *  longest line the pool already had ("First time through to a Regional final.") and it wraps to two
 *  lines; W3's debut lines were written to the same budget after the first draft's fifty characters
 *  pushed the card to 207px in the browser. Pinned in tests/diary.test.ts. */
export const MEMORY_LINE_MAX = 39

export const MEMORY_LINES: readonly MemoryLine[] = [
  { type: 'title', text: (m) => `Her first ${short(m.tier ?? null)} title.` },
  { type: 'title', text: (m) => `The week she won her first ${short(m.tier ?? null)}.` },
  { type: 'final', text: (m) => `Her first ${short(m.tier ?? null)} final.` },
  { type: 'final', text: (m) => `First time through to a ${short(m.tier ?? null)} final.` },
  { type: 'international', text: (m) => (m.tier ? `Her first international entry – ${short(m.tier)}.` : 'Her first international entry.') },
  { type: 'international', text: (m) => (m.tier ? `The first passport week – ${short(m.tier)}.` : 'The first passport week.') },
  { type: 'injury', text: (m) => `${capitalize(m.kind ?? 'an injury')} – her first injury.` },
  { type: 'season-rank', text: (m) => `Season ${seasonYear(m.seasonIndex ?? 0)} closed at #${m.rank ?? 0}.` },
  { type: 'season-rank', text: (m) => `She ended ${seasonYear(m.seasonIndex ?? 0)} ranked #${m.rank ?? 0}.` },
]

/** How old a MILESTONE has to be before she remembers it rather than just having done it.
 *
 *  ⚠ W3 (owner, 30.07): 8 → 4. «Only after 10 weeks I saw a first memory. I believe we could pin it
 *  faster». Eight weeks was two months of a card reading "Too early for memories" AFTER her first
 *  title had already happened – on the live trace her first Local came at W3 and the card stayed
 *  empty until W11. Four weeks is a month, which is far enough back that "remember" is the right
 *  word and near enough that the first thing she ever won is on the wall before the first season is
 *  a third gone. */
export const MEMORY_MIN_WEEKS = 4
/** ...and the card is not empty before even that. W3: the career's OPENING WEEK is a memory from
 *  week 2 onward – see `debutMemory`. Two weeks, because "the week she started" needs one week to
 *  have finished and one more to be behind her. */
export const MEMORY_DEBUT_WEEKS = 2
/** An anniversary is the milestone's week ≈ one season ago, ±1 week. */
export const MEMORY_ANNIVERSARY_TOLERANCE = 1

/** THE FIRST MEMORY OF ALL – the week the whole thing started.
 *
 *  The owner asked when it would stop being "too early", and the answer the card gave was "after
 *  something has happened to her". That is the wrong answer, because something HAS: she walked into
 *  a club with a bag she could barely carry, and the game's own onboarding hero is a painting of
 *  exactly that girl. So the album opens with the week it opens.
 *
 *  IT IS NOT A LEDGER ENTRY, and that is the whole reason this is cheap: week 0 happens in every
 *  career, so there is nothing to capture, nothing to persist and no schema to bump (`MemoryCard`
 *  is derived). It carries `milestone: null` and is the only card that ever does.
 *
 *  The painting is `norm` in the band she started in – the same picture the onboarding hero shows,
 *  which is what makes this read as the first page of the album rather than as a missing entry.
 *
 *  ⚠ AND IT IS WRITTEN TO THE CARD'S OWN BUDGET (MEMORY_LINE_MAX). The first draft ran to fifty
 *  characters, which is a fine sentence and four lines of handwriting on a 375pt phone: the polaroid
 *  card grew from 138px to 207px and stopped matching the coach card beside it in the 2x2 grid. The
 *  existing lines top out at 39 ("First time through to a Regional final."), so that is the family
 *  these have to join. Measured in the browser, then pinned in tests/diary.test.ts. */
const DEBUT_LINES: readonly string[] = [
  'The week it all started.',
  'Her very first week at the club.',
  'Week one. New grips, new nerves.',
  'The first walk through those gates.',
]

function debutMemory(week: number, seed: string, startAgeYears: number): MemoryCard {
  const rng = rngFromSeed(`${seed}:memory:debut:${week}`)
  return {
    kind: 'debut',
    milestone: null,
    whenLabel: weekLabel(0),
    stage: portraitStage(startAgeYears),
    emotion: 'norm',
    line: DEBUT_LINES[Math.floor(rng() * DEBUT_LINES.length)],
  }
}

/** The Memory card for this week, or null.
 *
 *  (a) ANNIVERSARY: a milestone whose week is ~52 weeks ago (±1) always shows – "one year ago".
 *  (b) THE ROTATION: otherwise the card walks her album, one entry per week, cursor = the week.
 *      `kind` reports where the walk landed – `recent` on her newest, `debut` on the opening week,
 *      `echo` on anything older in between.
 *
 *  ⚠ W3 – THE ROTATION REPLACES "ALWAYS THE NEWEST" (owner, 30.07: «maybe make rotation of all
 *  previous? Is it difficult to do?»). It is not difficult, and the reason is worth writing down: it
 *  needs NO STATE. A cursor that has to be remembered would be a new persisted field, a schema bump
 *  and a golden save; the WEEK NUMBER is already a monotonic counter every surface agrees on, so
 *  `week % pool.length` is a rotation that is stable per week, identical on every device and every
 *  replay, and survives a reload without storing a byte. What it costs is the old guarantee that the
 *  card showed her latest thing – which was the behaviour the owner asked us to change. The echo coin
 *  (`MEMORY_ECHO_CHANCE`, ~1 week in 5) is gone with it: the rotation reaches back every week now, so
 *  a probability that decided whether to reach back at all has nothing left to decide.
 *
 *  Only null before she HAS a memory: the first two weeks of a brand-new career, and nothing else.
 *
 *  The painting is the age band she was in at the milestone's week – that is what makes time felt:
 *  a 17-year-old's Memory of her first Local title shows the 14-year-old who won it. */
export function selectMemory(
  milestones: readonly Milestone[],
  week: number,
  seed: string,
  startAgeYears: number,
): MemoryCard | null {
  if (week < MEMORY_DEBUT_WEEKS) return null
  const aged = milestones.filter((m) => week - m.week >= MEMORY_MIN_WEEKS)
  // An anniversary is the one thing loud enough to interrupt the rotation.
  const anniversary = aged.find((m) => Math.abs(week - 52 - m.week) <= MEMORY_ANNIVERSARY_TOLERANCE)
  const debut = debutMemory(week, seed, startAgeYears)
  if (!anniversary && aged.length === 0) return debut
  // The album, oldest first: the opening week, then the milestones in capture order.
  const pick = anniversary ?? (week % (aged.length + 1) === 0 ? null : aged[(week % (aged.length + 1)) - 1])
  if (pick === null) return debut
  const lines = MEMORY_LINES.filter((l) => l.type === pick.type)
  if (lines.length === 0) return debut
  const lineRng = rngFromSeed(`${seed}:diary:${week}:memory`)
  const line = lines[Math.floor(lineRng() * lines.length)].text(pick)
  return {
    kind: anniversary ? 'anniversary' : pick === aged[aged.length - 1] ? 'recent' : 'echo',
    milestone: pick,
    whenLabel: anniversary ? 'one year ago' : weekLabel(pick.week),
    stage: portraitStage(startAgeYears + Math.floor(pick.week / 52)),
    emotion: MEMORY_EMOTION[pick.type],
    line,
  }
}

// --- the snapshot's diary object ------------------------------------------------------------

/** Everything the UI renders: facts + one line per surface. Called once per snapshot. */
export function buildDiarySnapshot(view: DiaryWorldView): DiarySnapshot {
  const facts = assembleDiaryFacts(view)
  // The caption is selected FIRST: the greeting is allowed to see it, so the two can never say the
  // same thing (greetingFor).
  const photoLine = diaryLine('photo', facts, view.seed)
  // The journey's full reading, for the note. `assembleDiaryFacts` above has already taken the same
  // reading for the two fields the FACTS carry (scene and mood) – both calls are pure functions of
  // the same view, so they agree by construction, and the alternative (threading the object out of
  // assembleDiaryFacts) would change a signature three suites call directly. Cheap: two filters over
  // a capped event list, on the weeks it is non-null and on no others.
  const travelHome = travelHomeFactsFor({
    events: view.events,
    milestones: view.milestones,
    week: view.week,
    seed: view.seed,
    kidId: view.kidId,
    condition: view.condition,
    injury: view.injury,
    pendingUnfinished: view.pendingUnfinished,
  })
  return {
    facts,
    photoLine,
    greeting: greetingFor(facts, photoLine, view.seed),
    travelNote: travelHome ? travelNoteFor(travelHome, view.seed) : null,
    // W2: the other author of the same scrap. The two can never both speak – `weekNoteFor`'s own
    // `athome` licence reads `facts.travelHomeScene`, which is non-null on exactly the weeks
    // `travelHome` is – so this is one object with two writers rather than two notes.
    weekNote: weekNoteFor(facts, view.seed),
    // The licences cover every state the engine can produce (the coverage sweep in
    // tests/diary.test.ts proves it); the fallback is a sentence that is true of any week at all.
    conditionNote: diaryLine('condition', facts, view.seed) ?? 'The week went by.',
    memory: selectMemory(view.milestones, view.week, view.seed, view.startAgeYears),
  }
}
