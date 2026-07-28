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
 *  moment that earned it; everything else stays in the composed half of the set. */
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

/** Which of this week's captured milestones the diary calls THE fresh one (a title week also
 *  captures its final – the louder fact wins). */
const MILESTONE_PRIORITY: readonly MilestoneType[] = ['title', 'final', 'international', 'injury', 'season-rank']

/** Assemble the facts – every field read off state that already exists, zero draws anywhere. */
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
    fundsPressure: fundsPressureOf(view.fundsCents),
    freshMilestone,
  }
}

// --- the phrase pool ------------------------------------------------------------------------

export type DiarySurface = 'photo' | 'condition'

/** What a line ASSERTS, as data the honesty pin can hold against the facts. Every tag is a claim
 *  the pin re-checks independently: a `won: true` line licensed on a loss is a failing test, not
 *  a matter of taste. `affect: 'positive'` is the spec's own concrete rule – unselectable while
 *  the emotion is sad, angry or injury. */
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
  // --- photo card: injured (idle) --------------------------------------------------------------
  {
    surface: 'photo',
    text: 'The ice pack lives on the kitchen counter now.',
    claims: { affect: 'negative', injured: true },
    license: (f) => f.emotion === 'injury',
  },
  {
    surface: 'photo',
    text: 'She watches practice from the bench this week.',
    claims: { affect: 'negative', injured: true },
    license: (f) => f.emotion === 'injury',
  },
  {
    surface: 'photo',
    text: 'She counts the weeks to her return out loud.',
    claims: { affect: 'negative', injured: true },
    license: (f) => f.emotion === 'injury',
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

/** No memories in the first ~8 weeks of a career – there is nothing to remember yet. The same
 *  distance also ages the milestones an echo may pick from. */
export const MEMORY_MIN_WEEKS = 8
/** The echo cadence: ~1 week in 5 shows a card – "roughly every 4-6 weeks". */
export const MEMORY_ECHO_CHANCE = 0.2
/** An anniversary is the milestone's week ≈ one season ago, ±1 week. */
export const MEMORY_ANNIVERSARY_TOLERANCE = 1

/** The Memory card for this week, or null.
 *
 *  (a) ANNIVERSARY: a milestone whose week is ~52 weeks ago (±1) always shows – "one year ago".
 *  (b) ECHO: otherwise `seed:memory:<week>` decides, deterministically, whether this is one of the
 *      roughly-every-5 weeks that remembers at all, and which aged milestone it remembers.
 *
 *  The painting is the age band she was in at the milestone's week – that is what makes time felt:
 *  a 17-year-old's Memory of her first Local title shows the 14-year-old who won it. */
export function selectMemory(
  milestones: readonly Milestone[],
  week: number,
  seed: string,
  startAgeYears: number,
): MemoryCard | null {
  if (week < MEMORY_MIN_WEEKS) return null
  const aged = milestones.filter((m) => week - m.week >= MEMORY_MIN_WEEKS)
  if (aged.length === 0) return null
  const anniversary = aged.find((m) => Math.abs(week - 52 - m.week) <= MEMORY_ANNIVERSARY_TOLERANCE)
  const rng = rngFromSeed(`${seed}:memory:${week}`)
  let kind: MemoryCard['kind']
  let pick: Milestone
  if (anniversary) {
    kind = 'anniversary'
    pick = anniversary
  } else {
    if (rng() >= MEMORY_ECHO_CHANCE) return null
    kind = 'echo'
    pick = aged[Math.floor(rng() * aged.length)]
  }
  const lines = MEMORY_LINES.filter((l) => l.type === pick.type)
  if (lines.length === 0) return null
  const lineRng = rngFromSeed(`${seed}:diary:${week}:memory`)
  const line = lines[Math.floor(lineRng() * lines.length)].text(pick)
  return {
    kind,
    milestone: pick,
    whenLabel: kind === 'anniversary' ? 'one year ago' : weekLabel(pick.week),
    stage: portraitStage(startAgeYears + Math.floor(pick.week / 52)),
    emotion: MEMORY_EMOTION[pick.type],
    line,
  }
}

// --- the snapshot's diary object ------------------------------------------------------------

/** Everything the UI renders: facts + one line per surface. Called once per snapshot. */
export function buildDiarySnapshot(view: DiaryWorldView): DiarySnapshot {
  const facts = assembleDiaryFacts(view)
  return {
    facts,
    photoLine: diaryLine('photo', facts, view.seed),
    // The licences cover every state the engine can produce (the coverage sweep in
    // tests/diary.test.ts proves it); the fallback is a sentence that is true of any week at all.
    conditionNote: diaryLine('condition', facts, view.seed) ?? 'The week went by.',
    memory: selectMemory(view.milestones, view.week, view.seed, view.startAgeYears),
  }
}
