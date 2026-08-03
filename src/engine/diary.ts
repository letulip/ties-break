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
  type PortraitStage,
} from '../shared/avatarEmotion'
import type {
  DiaryFacts,
  DiarySnapshot,
  MemoryCard,
  Milestone,
  MilestoneType,
  WeekScene,
} from '../shared/protocol'
import { isExamWeek, isOffSeasonWeek, TIER_SHORT } from './season/calendar'
import type { TierId } from './season/types'
import { rngFromSeed } from './rng'
import { seasonYear, weekLabel } from '../shared/dates'
// W6c: the anatomy, so a line about her body can know which body it is about. A leaf module – see the
// note at the top of body.ts for why the twelve parts do not live in world.ts any more.
import { bodyGroupOf, bodyPartOf, type BodyGroup } from './body'
import { lastKidResultOf, lastKidTitleOf, milestoneKey, MEMORY_EMOTION, conditionBandOf, fundsPressureOf } from './diary/facts'
import type { DiaryWorldView } from './diary/facts'
import { travelHomeSceneFor, TRAVEL_SLEEP_CHANCE_EMPTY, TRAVEL_SLEEP_CHANCE_FRESH, travelSleepChance, TRAVEL_FINAL_SLEEP_CHANCE_EMPTY, TRAVEL_FINAL_SLEEP_CHANCE_FRESH, travelFinalSleepChance, travelHomeMoodFor, travelHomeFactsFor } from './diary/travelHome'
import type { TravelHomeFacts } from './diary/travelHome'
export { travelHomeSceneFor, TRAVEL_SLEEP_CHANCE_EMPTY, TRAVEL_SLEEP_CHANCE_FRESH, travelSleepChance, TRAVEL_FINAL_SLEEP_CHANCE_EMPTY, TRAVEL_FINAL_SLEEP_CHANCE_FRESH, travelFinalSleepChance, travelHomeMoodFor, travelHomeFactsFor }
export type { TravelHomeFacts } from './diary/travelHome'
export { lastKidResultOf, lastKidTitleOf, milestoneKey, MEMORY_EMOTION, conditionBandOf, fundsPressureOf }
export type { DiaryWorldView } from './diary/facts'


// THE FACTS moved to diary/facts.ts; imported back and re-exported below.

// THE JOURNEY HOME moved to diary/travelHome.ts; imported back and re-exported below.
/** Which of this week's captured milestones the diary calls THE fresh one (a title week also
 *  captures its final – the louder fact wins). R15-5: `prize` sits under the results themselves -
 *  a first W15 title week also banks the first cheque, and "she won it" is the louder fact than
 *  "it paid" - but above the passport and the rest. */
const MILESTONE_PRIORITY: readonly MilestoneType[] = ['title', 'final', 'prize', 'international', 'injury', 'season-rank']

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
    vacationPackageId: view.vacationPackageId ?? null,
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
    // W4: what the knock is doing to this week. Read, not drawn - it is a decision the player made
    // and the world persisted, which is the whole reason the knock cost a schema bump.
    birthdayAge: view.birthdayAge,
    knockChoice: view.knockChoice,
    knockPart: view.knockPart,
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
  /** asserts SHE HAS A BIRTHDAY this week - unselectable unless `birthdayAge` is non-null.
   *
   *  ⚠ ALWAYS PAIRED WITH `affect: 'neutral'`, and that is the point rather than a shrug. The pin refuses a
   *  positive-affect line on a sad, angry or laid-up week, and rightly - but "She is fifteen today" makes no
   *  claim about how the week went. It is a fact, true whether she won, lost or is in a brace, and neutral
   *  affect is what lets it survive a bad week without lying about one. */
  birthday?: true
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
  // --- HER BIRTHDAY, on the Home photo card (owner, 30.07: «может на home тоже про это писать») ----
  //
  // ⚠ FIRST IN THE POOL, AND THAT IS THE DESIGN DECISION. `photoLine` is one line under her name on the
  // screen the player opens every week, and every other phrase in it is about TENNIS - a win, a loss, a
  // rank, a body. A birthday is the one week where the honest headline is not a result, and it is also the
  // only place the game can say her birth month somewhere he will actually look.
  //
  // NO `affect` CLAIM, deliberately. The honesty pin refuses a positive-affect line on a sad, angry or
  // laid-up week, and rightly - but "She is fifteen today" is not a claim about how the week went. It is a
  // fact, and it is true whether she won, lost or is in a brace. Claiming `birthday` and nothing else is
  // what lets it survive a bad week without lying about one.
  {
    surface: 'photo',
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today.`,
    claims: { affect: 'neutral', birthday: true },
    license: (f) => f.birthdayAge !== null,
  },
  {
    surface: 'photo',
    text: (f) => `She is ${ageWord(f.birthdayAge)}.`,
    claims: { affect: 'neutral', birthday: true },
    license: (f) => f.birthdayAge !== null,
  },
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
  // ⚠ ONE CAPTION PER PACKAGE (owner, 31.07: «Со своими итоговыми записками на week recap, а то
  // сейчас куда бы ни поехала и расписание одинаковое, и week recap, ну кроме картинки»). He is
  // exactly right about the cause: `vacationPackageId` already reaches the diary and was being used
  // for the PICTURE alone, so six different weeks were captioned with one sentence.
  // The generic line below is kept and NARROWED to the case it is actually for - a week whose booking
  // has aged off the four-week retention, where the save genuinely no longer knows where she went.
  {
    surface: 'photo',
    text: 'A week away. The racquet stayed home.',
    claims: { affect: 'neutral', vacation: true },
    license: (f) =>
      f.vacationWeek && !f.resultFresh && f.emotion === 'norm' && (f.vacationPackageId ?? null) === null,
  },
  {
    surface: 'photo',
    text: 'Her own bed all week. Half the street in the kitchen.',
    claims: { affect: 'neutral', vacation: true },
    license: (f) => f.vacationWeek && !f.resultFresh && f.emotion === 'norm' && f.vacationPackageId === 'staycation',
  },
  {
    surface: 'photo',
    text: 'Two trains and a bus. She slept on both trains.',
    claims: { affect: 'neutral', vacation: true },
    license: (f) => f.vacationWeek && !f.resultFresh && f.emotion === 'norm' && f.vacationPackageId === 'grandma',
  },
  {
    surface: 'photo',
    text: 'The racquet did not come. The tent did.',
    claims: { affect: 'neutral', vacation: true },
    license: (f) => f.vacationWeek && !f.resultFresh && f.emotion === 'norm' && f.vacationPackageId === 'camping',
  },
  {
    surface: 'photo',
    text: 'Sea, sleep, sun – in that order, every day.',
    claims: { affect: 'neutral', vacation: true },
    license: (f) => f.vacationWeek && !f.resultFresh && f.emotion === 'norm' && f.vacationPackageId === 'seaside',
  },
  {
    surface: 'photo',
    text: 'A week of swimming pools and physio beds.',
    claims: { affect: 'neutral', vacation: true },
    license: (f) => f.vacationWeek && !f.resultFresh && f.emotion === 'norm' && f.vacationPackageId === 'resort',
  },
  {
    surface: 'photo',
    text: 'A clinic full of people who do this for a living.',
    claims: { affect: 'neutral', vacation: true },
    license: (f) => f.vacationWeek && !f.resultFresh && f.emotion === 'norm' && f.vacationPackageId === 'elite',
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
  // ⚠ AND THE CONDITION NOTE CLIMBS WITH `conditionGain`, WHICH IS THE HALF THAT MAKES THIS HONEST.
  // The packages are 18 / 22 / 26 / 32 / 40 / 48 (W2-FATIGUE lifted the whole table; the ORDER,
  // which is all these licences read, is untouched), so the sentences do not merely differ - they say
  // more the more the week actually gave her. A staycation that read like the clinic would be the
  // diary's cardinal sin (a note claiming something the ledger does not support), just quieter.
  // Generic line narrowed to a booking that has aged off retention, exactly as the photo pool above.
  {
    surface: 'condition',
    text: 'A family week away – she came back lighter.',
    claims: { affect: 'positive', vacation: true },
    license: (f) => f.vacationWeek && f.injured === null && !f.resultFresh && (f.vacationPackageId ?? null) === null,
  },
  {
    surface: 'condition',
    text: 'A week at home – nothing special, and it worked.',
    claims: { affect: 'positive', vacation: true },
    license: (f) => f.vacationWeek && f.injured === null && !f.resultFresh && f.vacationPackageId === 'staycation',
  },
  {
    surface: 'condition',
    text: "A week at her grandmother's – slow food, slow days, and it shows.",
    claims: { affect: 'positive', vacation: true },
    license: (f) => f.vacationWeek && f.injured === null && !f.resultFresh && f.vacationPackageId === 'grandma',
  },
  {
    surface: 'condition',
    text: 'A week outdoors – tired legs, clear head.',
    claims: { affect: 'positive', vacation: true },
    license: (f) => f.vacationWeek && f.injured === null && !f.resultFresh && f.vacationPackageId === 'camping',
  },
  {
    surface: 'condition',
    text: 'A week by the sea, and she slept through most of it.',
    claims: { affect: 'positive', vacation: true },
    license: (f) => f.vacationWeek && f.injured === null && !f.resultFresh && f.vacationPackageId === 'seaside',
  },
  {
    surface: 'condition',
    text: 'Rest with a programme – she came back moving properly.',
    claims: { affect: 'positive', vacation: true },
    license: (f) => f.vacationWeek && f.injured === null && !f.resultFresh && f.vacationPackageId === 'resort',
  },
  {
    surface: 'condition',
    text: 'The full programme, and it worked – she came back new.',
    claims: { affect: 'positive', vacation: true },
    license: (f) => f.vacationWeek && f.injured === null && !f.resultFresh && f.vacationPackageId === 'elite',
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
  /** asserts she won at least TWO of them – a line that says "two days of winning", "a couple of
   *  wins", anything that counts.
   *
   *  ⚠ W-ITEM-3 SPLIT THIS OFF `wonMatches`, and it is the same shape of split as `abroad` → `air`
   *  (see that claim's note). The owner, 31.07, after a trip where she won her opener and lost the
   *  next one: the story said «2 days of wins and one not». It was licensed on `matchesWon > 0`,
   *  which is what "she won some" needs and NOT what "two days of winning" needs, and the honesty pin
   *  could not see the difference because the vocabulary had only the one claim in it. One claim
   *  doing two jobs held only while no line in the pool counted; two lines did.
   *
   *  ⚠ AND THE FIX IS THE COUNT, NOT THE WORDING. Softening "Two days" to "some days" would have
   *  bought the honesty with the only thing these lines have – a parent noticing a specific thing –
   *  and it is not what was wrong. The sentence is true; it was being said about the wrong week. */
  wonTwo?: true
  /** asserts one match and no wins – the first-round exit */
  firstRound?: true
  /** asserts she is carrying an injury */
  injured?: true
  /** asserts a worn-out girl – unselectable above the `drained` rung */
  tired?: true
  /** asserts the trip crossed a BORDER – the ITF ladder. Says nothing about the vehicle.
   *
   *  ⚠ W5 SPLIT THIS CLAIM IN TWO, and it was a lie waiting for the first National flight. It used to
   *  read "the trip crossed a border (the ITF ladder, so the journey home is air)" – one claim doing
   *  two jobs, which held only while `track` decided the transport. Under the owner's tier gate a
   *  National trip is domestic AND can come home by plane, and a J30 abroad can come home by bus, so
   *  "abroad" and "by air" are now independent facts about the same week. Lines that name a vehicle
   *  (a gate, a flight, a landing, the motorway) claim `air`/`road`; lines that name the DISTANCE
   *  ("her first one in another country") keep `abroad`. */
  abroad?: true
  /** asserts this was her FIRST tournament abroad */
  firstAbroad?: true
  /** asserts a journey by ROAD – the bus or the car painting. Read off the SCENE, never off the tier:
   *  it is a claim about the picture the line is the caption of. */
  road?: true
  /** asserts a journey by AIR – the airport or the plane painting. Same rule, other bucket. */
  air?: true
  /** asserts THE FAMILY CAR specifically – a back seat, a car park, stopping for chips. A stricter
   *  claim than `road`, and W5 needed it: the road bucket is a bus AND a car, and a trophy on the back
   *  seat under a picture of a coach is the same class of error as a gate under a picture of a bus. It
   *  was survivable while the only road trips were Regionals (four a season); the owner's correction
   *  made the Local Open a journey too, so the road pictures went from a handful a season to twenty. */
  car?: true
  /** asserts HOURS of journey – a motorway, a ring road, "the long way back".
   *
   *  ⚠ W5 ADDED THIS, and it is the honesty bill for letting the Local Open send her home. Until now
   *  no note had ever landed on a local trip (the rule refused the tier outright), so a pool full of
   *  "three hours of motorway" and "a long way back for it" was safe. It is not any more: the calendar
   *  prices a Local Open's travel at $60-120 against a Regional's $150-400, which is the difference
   *  between the club two towns over and the next county. A line about hours of driving under a
   *  picture of a girl on a twenty-minute bus is exactly the failure this pool's licences exist to
   *  stop, so the distance lines are gated and the short hop gets lines of its own. */
  longWay?: true
  /** asserts she was asleep on the way: only the `sleepy` paintings show that, and the other two
   *  show her awake, so this is a claim about the ART as much as about the week */
  slept?: true
}

export interface TravelNote {
  text: string
  claims: TravelClaims
  license: (t: TravelHomeFacts) => boolean
}

/** ⚠ W5: THE SCENE, NOT THE TIER. This was `!t.abroad` – true while `track` decided the transport,
 *  false the moment the owner's tier gate let a National fly home and a J30 come back on a bus. The
 *  note is the CAPTION of the picture above it, so "we were out of the car park" has to be licensed
 *  by there being a car in the frame, and nothing else. */
const road = (t: TravelHomeFacts): boolean => t.scene === 'bus' || t.scene === 'car'
/** ...and its other half, for the lines that name a gate, a flight or a landing. */
const air = (t: TravelHomeFacts): boolean => t.scene === 'airport' || t.scene === 'plane'
/** ...and the narrow half of the road, for the lines that name the family car. See the `car` claim. */
const inCar = (t: TravelHomeFacts): boolean => t.scene === 'car'
/** A journey with hours in it – every rung above the Local Open. See the `longWay` claim. */
const longWay = (t: TravelHomeFacts): boolean => t.tier !== 'local'
/** ...and its complement: the club two towns over, which W5 made a journey at all. */
const shortHop = (t: TravelHomeFacts): boolean => t.tier === 'local'
const asleep = (t: TravelHomeFacts): boolean => t.mood === 'sleepy'
const awake = (t: TravelHomeFacts): boolean => t.mood !== 'sleepy'
/** Everything below the injury and the first passport, which take a week to themselves. */
const ordinary = (t: TravelHomeFacts): boolean => !t.injured && !t.firstAbroad
/** She lost, and the loss was not the final – the ordinary weeks the junior road is mostly made of. */
const plainLoss = (t: TravelHomeFacts): boolean => ordinary(t) && !t.reachedFinal

export const TRAVEL_NOTES: readonly TravelNote[] = [
  // --- SHE WON IT --------------------------------------------------------------------------------
  {
    // ⚠ W5: `inCar`, not `road` – a coach does not pull over for chips. Same edit on the five lines
    // below that name a back seat, a car park or the car itself; see the `car` claim for why.
    text: 'She won it, and then asked if we could stop for chips.',
    claims: { title: true, road: true, car: true },
    license: (t) => ordinary(t) && t.wonTitle && inCar(t),
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
    claims: { title: true, road: true, car: true },
    license: (t) => ordinary(t) && t.wonTitle && inCar(t),
  },
  {
    // ⚠ W5: a GATE is an airport gate, so this is licensed on the picture being an airport or a
    // plane – not on the tier being an international one. Same edit on every line below that names
    // a vehicle; see the `abroad` claim's own note for why the two came apart.
    text: 'She won it. The first thing she did at the gate was ring her grandmother.',
    claims: { title: true, air: true },
    license: (t) => ordinary(t) && t.wonTitle && air(t),
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
    claims: { runnerUp: true, lost: true, slept: true, road: true, longWay: true },
    license: (t) => ordinary(t) && t.lostFinal && asleep(t) && road(t) && longWay(t),
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
  // ⚠ AND TWO THAT ARE TRUE OF EXACTLY ONE WIN, because tightening the counting lines below left the
  // commonest trip in the game short of words. After a first-round exit, "won the opener and lost the
  // next" is the way a junior week most often ends – it is what the owner was playing when he found
  // this – and it had two lines to itself, one of which needs an aeroplane. Same voice, same rule: a
  // detail noticed, nothing graded.
  {
    text: 'She won her first and lost her second. She only talked about the first.',
    claims: { lost: true, wonMatches: true },
    license: (t) => plainLoss(t) && t.matchesWon === 1,
  },
  {
    text: 'One win, and out the next day. She asked what was for dinner.',
    claims: { lost: true, wonMatches: true },
    license: (t) => plainLoss(t) && t.matchesWon === 1,
  },
  // ⚠ THE TWO THAT COUNT. A junior tournament is one week and one match a day, so a parent writing
  // "two days of winning" is writing `matchesWon === 2` – and these two were licensed on
  // `matchesWon > 0`, i.e. on ONE win as readily as on three. The owner saw it on the commonest
  // possible shape of trip: she won her first match, lost her second, and the week's story told him
  // she had won on two days. It is EXACTLY two, not "two or more": `plainLoss` reaches a semi-final
  // exit, where three wins would make "two days" as wrong in the other direction.
  {
    text: 'Two days of winning and one of not. She only wanted to talk about the last one.',
    claims: { lost: true, wonMatches: true, wonTwo: true },
    license: (t) => plainLoss(t) && t.matchesWon === 2,
  },
  {
    text: 'A couple of wins, and then not. She still wanted the window seat home.',
    claims: { lost: true, wonMatches: true, wonTwo: true, air: true },
    license: (t) => plainLoss(t) && t.matchesWon === 2 && air(t),
  },
  // --- ONE MATCH, AND THE LONG WAY BACK ----------------------------------------------------------
  // The junior road is MOSTLY THIS – a first-round exit is the single commonest way a trip ends, and
  // the pool is sized for that: a family that goes away every other week for four years must not be
  // handed the same eight sentences. Nothing here grades her. She is noticed, and that is all.
  {
    text: 'One match, and a long way back for it. She kept her hood up the whole time.',
    claims: { lost: true, firstRound: true, longWay: true },
    license: (t) => ordinary(t) && t.firstRound && longWay(t),
  },
  {
    text: 'She lost the first one and stayed to watch the rest of it anyway.',
    claims: { lost: true, firstRound: true },
    license: (t) => ordinary(t) && t.firstRound,
  },
  {
    text: 'Out on the first day. Two flights, for one match.',
    claims: { lost: true, firstRound: true, air: true },
    license: (t) => ordinary(t) && t.firstRound && air(t),
  },
  {
    text: 'The long way home. She did not want to talk and we did not make her.',
    claims: { lost: true, firstRound: true, longWay: true },
    license: (t) => ordinary(t) && t.firstRound && longWay(t),
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
    claims: { lost: true, firstRound: true, road: true, car: true },
    license: (t) => ordinary(t) && t.firstRound && inCar(t),
  },
  {
    text: 'Beaten in an hour, and then three hours of motorway.',
    claims: { lost: true, firstRound: true, road: true, longWay: true },
    license: (t) => ordinary(t) && t.firstRound && road(t) && longWay(t),
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
    claims: { lost: true, road: true, car: true },
    license: (t) => plainLoss(t) && inCar(t),
  },
  {
    text: 'She put her headphones in somewhere outside the city and left them in.',
    claims: { lost: true, longWay: true },
    license: (t) => plainLoss(t) && longWay(t),
  },
  {
    text: 'Home late. She ate standing up at the counter and went straight to bed.',
    claims: { lost: true },
    license: plainLoss,
  },
  {
    text: 'A long way for a short week. She slept from the ring road onward.',
    claims: { lost: true, slept: true, road: true, longWay: true },
    license: (t) => plainLoss(t) && asleep(t) && road(t) && longWay(t),
  },
  {
    text: 'She slept from the gate to the taxi rank and never saw the airport.',
    claims: { lost: true, slept: true, air: true },
    license: (t) => plainLoss(t) && asleep(t) && air(t),
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
    claims: { tired: true, slept: true, road: true, car: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained' && asleep(t) && inCar(t),
  },
  {
    // ⚠ W5 LEFT THIS ONE ON `abroad`, deliberately: it names no vehicle. A whole day of travelling is
    // what the DISTANCE costs, and it is equally true of a bus down a country and a pair of flights.
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
    claims: { tired: true, slept: true, road: true, car: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained' && asleep(t) && inCar(t),
  },
  {
    text: 'Two days home and she is still catching up on the sleep.',
    claims: { tired: true },
    license: (t) => plainLoss(t) && t.conditionBand === 'drained',
  },
  // --- W5: THE SHORT HOP, which is the commonest journey in the game -----------------------------
  //
  // The Local Open runs `everyNWeeks: 2` and is the only tier a fresh career can enter at all, so for
  // the first season and a half this is what "she came home from a tournament" MEANS. Until W5 it
  // produced no journey and no note; the owner's "очень даже едут, на автобусе или машине" turned it
  // into roughly twenty pictures a season, and a band of its own is what keeps those twenty from being
  // the long-haul pool with its distance lines filtered out. Nothing here mentions hours, a motorway
  // or a gate: the whole register of a local Saturday is that she was back for dinner.
  {
    text: 'The club two towns over, and home before dark.',
    claims: { road: true },
    license: (t) => ordinary(t) && shortHop(t) && road(t),
  },
  {
    text: 'A short trip back, and she slept through all of it anyway.',
    claims: { slept: true, road: true },
    license: (t) => ordinary(t) && shortHop(t) && road(t) && asleep(t),
  },
  {
    text: 'Home in time for dinner, and she talked through the whole of it.',
    claims: {},
    license: (t) => ordinary(t) && shortHop(t) && awake(t),
  },
  {
    text: 'A packed lunch, one draw, and she stayed to watch the final.',
    claims: { lost: true },
    license: (t) => plainLoss(t) && shortHop(t),
  },
  // --- THE FIRST PASSPORT WEEK -------------------------------------------------------------------
  // A once-in-a-career journey, so it takes the note to itself rather than competing with the result
  // lines. Written result-agnostic on purpose: what the week is about is the distance, not the draw.
  //
  // ⚠ W5 IS WHY THIS BAND HAS TWO HALVES NOW, and it is the sharpest consequence of the tier gate. It
  // used to be five lines that all said "airport", because under the old `track` rule the ITF ladder
  // ALWAYS came home by air – the comment above this band literally read "the first time the airport
  // painting can appear at all". The J tiers draw from all four modes now, so her first trip abroad can
  // come home on a bus, and three of these five would then be captions of a picture that has no
  // aeroplane in it. So: the three that name the flight are licensed on `air`, and the two that name
  // the DISTANCE are licensed on the trip alone and cover the road case. Both halves are non-empty for
  // every mode, which is what the coverage sweep checks.
  {
    text: 'Her first time through an airport with a racquet bag. She kept the ticket.',
    claims: { firstAbroad: true, abroad: true, air: true },
    license: (t) => !t.injured && t.firstAbroad && air(t),
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
    claims: { firstAbroad: true, abroad: true, air: true, slept: true },
    license: (t) => !t.injured && t.firstAbroad && air(t) && asleep(t),
  },
  {
    text: 'She listed everyone she met, the whole flight home.',
    claims: { firstAbroad: true, abroad: true, air: true },
    license: (t) => !t.injured && t.firstAbroad && air(t) && awake(t),
  },
  {
    // ...and the road half of the same week, which W5 made reachable. Same register, no vehicle in
    // the first line and a bus in the second, because a first border crossing on a coach is a
    // fourteen-year-old's whole month.
    text: 'Her first border, and she watched the signs change the whole way.',
    claims: { firstAbroad: true, abroad: true, road: true },
    license: (t) => !t.injured && t.firstAbroad && road(t),
  },
  {
    text: 'Two countries in one week, and she never left the ground.',
    claims: { firstAbroad: true, abroad: true, road: true },
    license: (t) => !t.injured && t.firstAbroad && road(t),
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
 *  reachable trip; the fallback is a sentence that is true of every journey there has ever been.
 *
 *  ⚠ W5 REWROTE THE FALLBACK, because the old one was «A long way there, and a long way back.» and
 *  that is now a CLAIM the week may not carry – the Local Open sends her home too, and it is not a
 *  long way (see the `longWay` claim). The replacement asserts only that she went and came back,
 *  which is the definition of the week this function is reached on. */
export function travelNoteFor(travel: TravelHomeFacts, seed: string): string {
  const pool = TRAVEL_NOTES.filter((n) => n.license(travel))
  if (pool.length === 0) return 'There and back, and the bag is by the door again.'
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
  /** W4: asserts she is spending the week RESTING a knock – unselectable unless knockChoice==='rest' */
  restingKnock?: true
  /** W4: asserts she is TRAINING THROUGH a knock – unselectable unless knockChoice==='push' */
  pushingKnock?: true
  /** asserts SHE HAS A BIRTHDAY this week - unselectable unless `birthdayAge` is non-null. */
  birthday?: true
  /** W6c: asserts WHERE THE INJURY IS – unselectable unless her live injury is in this group.
   *
   *  ⚠ THE FIRST CLAIM ON THIS POOL THAT CARRIES A VALUE rather than being a bare `true`, and it had to:
   *  "names a body part" is not one thing to assert, it is three mutually exclusive ones. A line that
   *  puts her leg up on a chair is honest for a knee and a lie for a wrist, and a boolean claim cannot
   *  express the difference - which is exactly how «She revised with her leg up on a chair» shipped
   *  licensed on every injury there is.
   *
   *  The honesty pin was skipping non-`true` claim values outright (`if (value !== true) continue`), so
   *  this would have been decoration; that skip is gone and the pin reads the value. See
   *  tests/week-notes.test.ts. */
  bodyGroup?: BodyGroup
}

export interface WeekNote {
  /** W4: a facts-aware TEMPLATE is allowed here now, the same shape `DiaryPhrase.text` has always
   *  had. The knock band needs it – "A week off the ankle" has to name the part, and a pool of eight
   *  hard-coded parts × four sentences is not a pool, it is a table. Unlike `DiaryPhrase` there is no
   *  `null` arm: the ordinary week's silence is decided by the coin in `weekNoteFor`, not by a null
   *  entry, because silence here means the scrap falls back to the ledger line. */
  text: string | ((f: DiaryFacts) => string)
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

/** An ordinary training week: at home, healthy, and the calendar is holding nothing.
 *
 *  ⚠ W4 ADDED `knockChoice === null`, AND IT IS AN HONESTY FIX, NOT A TIDY-UP. The grind band says
 *  things like "Six days on court. She ate like someone twice her size." – a sentence that is FALSE
 *  on a week she spent resting a sore ankle, and the pin in tests/diary.test.ts sweeps exactly this
 *  space. A week under a knock is no longer an ordinary week: it has its own band below, the way an
 *  exam week and a layoff do. */
/** The age she turns, in words. A parent's register, not a scoreboard's - and total on any number a
 *  career can reach, falling back to the numeral past the years that read naturally as words. */
const AGE_WORD: Record<number, string> = {
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
  20: 'twenty',
}
const ageWord = (age: number | null): string => (age === null ? 'a year older' : (AGE_WORD[age] ?? String(age)))
const capitalise = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/** W6c: WHERE HER LIVE INJURY IS, as the pool is allowed to ask. Null when she is healthy, and null
 *  when the part cannot be resolved from the persisted `kind` string - both mean the same thing to a
 *  line that wants to describe her body, which is "say nothing about it". */
const injuredGroup = (f: DiaryFacts): BodyGroup | null =>
  f.injured === null ? null : bodyGroupOf(f.injured.kind)

/** ...and the part, to name it. The fallback is UNREACHABLE IN SHIPPED COPY by construction: every
 *  template that calls this is licensed on `injuredGroup(f) !== null`, and a resolved group implies a
 *  resolved part. It exists so `renderAll` in the test can resolve every template in the pool against
 *  one fixture without throwing, which is how the voice and length guards read the real sentences. */
const injuredPart = (f: DiaryFacts): string =>
  (f.injured === null ? null : bodyPartOf(f.injured.kind)) ?? 'injury'

const plainTraining = (f: DiaryFacts): boolean =>
  athome(f) &&
  f.injured === null &&
  f.knockChoice === null &&
  !f.examsWeek &&
  !f.offSeasonWeek &&
  !f.vacationWeek &&
  !f.playedPractice

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
  // ⚠ THESE LINES USED TO SAY SHE DID NOT TRAIN, AND THE LEDGER DISAGREED. The owner caught it: «на
  // неделях экзаменов и деньги за тренера берут ... и записку пишут, что ракетка простояла в углу».
  // Measured, elite coach: $933 and $873 billed across the fortnight while the scrap said the racquet
  // never left the hall.
  //
  // AND THE COPY IS THE WRONG HALF, not the money - his call, and the right one: «на тренировку можно
  // доехать». An exam week is a TOURNAMENT blackout, not a training one. She is at home, she cannot enter
  // anything, and she still goes to the court - less, and around the revision. So the band now says a week
  // where tennis came SECOND, which is true, instead of a week where it stopped, which was not.
  {
    text: 'Exams. She trained early and revised late, and looked tired both ways.',
    claims: { exams: true, athome: true },
    license: (f) => athome(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'Revision at the kitchen table until eleven. Tennis got the mornings.',
    claims: { exams: true, athome: true },
    license: (f) => athome(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'She revised with the television on and somehow it worked.',
    claims: { exams: true, athome: true },
    license: (f) => athome(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'Two sessions all week instead of five. The rest of it was papers.',
    claims: { exams: true, athome: true },
    license: (f) => athome(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'A week away as a family. Nobody mentioned rankings once.',
    claims: { vacation: true, athome: true },
    license: (f) => athome(f) && f.vacationWeek && f.injured === null,
  },
  {
    // ⚠ W5 REWROTE THIS LINE, and the trace is what found it. It read «She swam every day and came back
    // with a line across her nose.» – water, which three of the six packages do not have (a campsite, a
    // village at her grandmother's, friends at home). It was invisible while the picture on a holiday
    // week was the generic off-season frame; now the frame is that package's own painting, so W50 of the
    // live trace showed hens by a village wall over a sentence about swimming. The band knows THAT she
    // was away, not WHERE – so the copy may not either.
    text: 'A week off the court. She came back browner, and louder at dinner.',
    claims: { vacation: true, athome: true },
    license: (f) => athome(f) && f.vacationWeek && f.injured === null,
  },
  {
    text: 'Seven days, no drills. She did not ask about the calendar once.',
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
  // --- W4: THE WEEK UNDER A KNOCK. These ALWAYS speak, like the calendar's own weeks. -------------
  //
  // AND THAT IS THE POINT. The week he made a decision about is the one week that must never come
  // back as a receipt for restrung gut – he chose something, and the scrap is where the game tells him
  // what it looked like. So no coin: `weekNoteFor` gates only `plainTraining`, which a knock week is
  // not, and these are licensed on the choice he made.
  //
  // NOTE THE ASYMMETRY IN THE WRITING, because it is the feature. The rest lines are about a girl
  // with nothing to do; the push lines are about a girl working with something wrong. Neither judges
  // him – the register is the pool's own (somebody who loves her holding the pen) – but the push
  // lines are allowed to be uneasy, because that is what he bought.
  // ⚠ `f.injured === null` ON EVERY ONE, and the honesty pin is why it is not decoration. THE INJURY
  // TAKES THE NOTE is a rule this pool already keeps (see the layoff band below), and the pin sweeps
  // the licence SPACE rather than the states the engine happens to reach – so a line about a quiet
  // rest week that could co-exist with a live layoff is a failing test, even though `rollInjury`
  // retires the knock at onset and the combination cannot actually occur.
  {
    text: (f) => `A week off the ${f.knockPart}. She was bored by Tuesday and said so by Wednesday.`,
    claims: { restingKnock: true, athome: true },
    license: (f) => athome(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: "Rest week – doctor's orders, and ours. She watched the others hit.",
    claims: { restingKnock: true, athome: true },
    license: (f) => athome(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: (f) => `Ice, stretching, no court. The ${f.knockPart} is quieter than it was.`,
    claims: { restingKnock: true, athome: true },
    license: (f) => athome(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: 'She asked twice if she could go in for an hour. Twice we said no.',
    claims: { restingKnock: true, athome: true },
    license: (f) => athome(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: (f) => `She trained on the ${f.knockPart} all week and did not mention it once.`,
    claims: { pushingKnock: true, athome: true },
    license: (f) => athome(f) && f.injured === null && f.knockChoice === 'push',
  },
  {
    text: 'Full week on court. She strapped it up herself before every session.',
    claims: { pushingKnock: true, athome: true },
    license: (f) => athome(f) && f.injured === null && f.knockChoice === 'push',
  },
  {
    text: (f) => `The ${f.knockPart} held. We watched her serve more closely than usual.`,
    claims: { pushingKnock: true, athome: true },
    license: (f) => athome(f) && f.injured === null && f.knockChoice === 'push',
  },
  {
    text: 'She trained through it. The coach said nothing and watched everything.',
    claims: { pushingKnock: true, athome: true },
    license: (f) => athome(f) && f.injured === null && f.knockChoice === 'push',
  },
  // --- HER BIRTHDAY (owner, 30.07). ONE WEEK A YEAR, and it ALWAYS speaks. -----------------------
  //
  // «нам точно стоит на месяц рождения девочки где-то в записочках может быть писать какие-то
  // поздравления» - so the scrap says it, and this is the one band with no competing claim on the week:
  // a birthday is not a tennis fact, so it does not care whether she trained, travelled or was laid up.
  //
  // ⚠ AND IT SPLITS ON THE LAYOFF, WHICH A TEST MADE ME DO AND WHICH IS THE BETTER DESIGN. My first version
  // was licensed on `athome` alone, on the argument that a birthday is not a tennis fact and so does not
  // compete with a knee brace. That broke the standing rule that A LAYOFF TAKES THE NOTE (every line
  // licensable on an injured week must claim `injured`) - the rule that stops the page reading as though the
  // game had not noticed she is hurt. Weakening it for one band would have been the wrong trade for a line
  // that appears once a year.
  //
  // So the birthday gets a LAYOFF VARIANT instead, exactly as the exam fortnight did (W6b): it still always
  // speaks, and on a week she is laid up it says both things at once. Better copy, too - «Cake, and then she
  // asked to go and hit» is a lie about a girl in a brace, and I would not have noticed by reading.
  //
  // The one thing every arm needs is that she is HOME: a birthday spent in an airport belongs to
  // TRAVEL_NOTES, which owns that scrap entirely.
  //
  // THE AGE IS NAMED IN WORDS, because a parent does not say "she is 15 today", and because the number is
  // the whole point - a December girl turning fourteen in the last month of a season she played as a
  // thirteen-year-old is the relative-age story in one line.
  {
    text: (f) => `She is ${ageWord(f.birthdayAge)} today. Cake, and then she asked to go and hit.`,
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && f.birthdayAge !== null && f.injured === null,
  },
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. She says she feels exactly the same.`,
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && f.birthdayAge !== null && f.injured === null,
  },
  {
    text: (f) => `Her birthday. ${capitalise(ageWord(f.birthdayAge))}, and taller than her mother now.`,
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && f.birthdayAge !== null && f.injured === null,
  },
  {
    text: 'Her birthday. She wanted a restring and a new grip, and nothing else.',
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && f.birthdayAge !== null && f.injured === null,
  },
  // ...and the same week with a brace on it. Both facts, one sentence each.
  {
    // ⚠ NOT "with her leg up", WHICH IS WHAT I WROTE AND WHAT W6c's SWEEP CAUGHT WITHIN THE MINUTE - on a
    // wrist strain. The owner found that class of error by reading; the guard found this one before it
    // shipped, which is the whole return on having written it. A birthday line has no business naming a
    // body part in the first place.
    text: (f) => `Her birthday, spent on the sofa. ${capitalise(ageWord(f.birthdayAge))}, and furious about it.`,
    claims: { birthday: true, injured: true, athome: true },
    license: (f) => athome(f) && f.birthdayAge !== null && f.injured !== null,
  },
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today, and eight weeks of rehab for a present.`,
    claims: { birthday: true, injured: true, athome: true },
    license: (f) => athome(f) && f.birthdayAge !== null && f.injured !== null,
  },
  {
    text: 'Her birthday. She blew out the candles and asked the physio how long.',
    claims: { birthday: true, injured: true, athome: true },
    license: (f) => athome(f) && f.birthdayAge !== null && f.injured !== null,
  },
  // --- THE LAYOFF WEEKS. An injury takes the note, the way it does on the journey home. ----------
  //
  // ⚠ W6b ADDED `!f.examsWeek`, AND IT IS THE WORDS FOLLOWING THE PICTURE. The exam fortnight now
  // outranks the layoff for the FRAME (the owner's ruling – see weekSceneFor's W6b note), and these
  // three lines under a painting of her revising at the kitchen table would be the page contradicting
  // itself. The fortnight inside a layoff gets its own band below instead, which says both things.
  {
    text: 'Rehab, three times this week. She counts the sessions down out loud.',
    claims: { injured: true, athome: true },
    license: (f) => athome(f) && f.injured !== null && !f.examsWeek,
  },
  {
    text: 'She sat by the court with her homework and watched the others hit.',
    claims: { injured: true, athome: true },
    license: (f) => athome(f) && f.injured !== null && !f.examsWeek,
  },
  {
    text: 'The physio says it is going well. She wanted a second opinion.',
    claims: { injured: true, athome: true },
    license: (f) => athome(f) && f.injured !== null && !f.examsWeek,
  },
  // --- W6b: THE FORTNIGHT INSIDE A LAYOFF. Both facts, in one sentence each. ---------------------
  //
  // The one week of the year where the two loudest things about her are true at once and neither is
  // tennis. The register is the pool's own and the joke is HERS, not the writer's: a girl who cannot
  // play anyway is the only girl in the house for whom exam fortnight is convenient, and she knows it.
  {
    text: 'Exams, and rehab between the papers. She said the timing was almost funny.',
    claims: { exams: true, injured: true, athome: true },
    license: (f) => athome(f) && f.examsWeek && f.injured !== null,
  },
  {
    text: 'A week of papers and physio. The one fortnight she is not missing anything.',
    claims: { exams: true, injured: true, athome: true },
    license: (f) => athome(f) && f.examsWeek && f.injured !== null,
  },
  // W6c: ...and the posture line, which is now THREE. It shipped as one - «She revised with her leg up
  // on a chair» - licensed on `f.injured !== null`, i.e. on every injury, so a girl with a strained
  // wrist revised with her leg up. The owner caught it: «у нас разные есть, не только нога ... чтобы
  // нога на спину не показывалась». Each is licensed on its own group and unselectable outside it.
  {
    text: 'She revised with her leg up on a chair. Nobody had to tell her to sit still.',
    claims: { exams: true, injured: true, athome: true, bodyGroup: 'leg' },
    license: (f) => athome(f) && f.examsWeek && injuredGroup(f) === 'leg',
  },
  {
    text: (f) => `She revised one-handed, the ${injuredPart(f)} strapped up beside her on the table.`,
    claims: { exams: true, injured: true, athome: true, bodyGroup: 'arm' },
    license: (f) => athome(f) && f.examsWeek && injuredGroup(f) === 'arm',
  },
  {
    text: 'She revised standing up half the time. Sitting is what it likes least.',
    claims: { exams: true, injured: true, athome: true, bodyGroup: 'trunk' },
    license: (f) => athome(f) && f.examsWeek && injuredGroup(f) === 'trunk',
  },
  // --- W6c: THE LAYOFF, IN THE PART IT IS ACTUALLY IN -------------------------------------------
  //
  // The three generic layoff lines above cover up to a 22-week absence, which is thin - and now that
  // the anatomy is legible, the obvious place to spend it is the longest band in the game. Two per
  // group, and every one has to be true of EVERY member of its group (a hip and a foot are both `leg`,
  // so "twice a day, and she times it herself" is in and "her foot up on a cushion" is out).
  {
    text: (f) => `Ice on the ${injuredPart(f)}, twice a day. She times it herself.`,
    claims: { injured: true, athome: true, bodyGroup: 'leg' },
    license: (f) => athome(f) && !f.examsWeek && injuredGroup(f) === 'leg',
  },
  {
    text: 'She is walking almost normally now. The limp only shows when she is tired.',
    claims: { injured: true, athome: true, bodyGroup: 'leg' },
    license: (f) => athome(f) && !f.examsWeek && injuredGroup(f) === 'leg',
  },
  {
    text: (f) => `Band exercises for the ${injuredPart(f)}, in front of the hall mirror.`,
    claims: { injured: true, athome: true, bodyGroup: 'arm' },
    license: (f) => athome(f) && !f.examsWeek && injuredGroup(f) === 'arm',
  },
  {
    // ⚠ NOT "eating left-handed", WHICH IS THE OWNER'S OWN BUG ONE LEVEL DOWN. That is what I wrote
    // first, and it names WHICH arm - a fact the model does not have. There is no handedness anywhere in
    // the engine (grep: none), so a left-handed girl with a left wrist would be eating with the injured
    // one. Same error as a leg on a back, just smaller: the copy asserting something nobody rolled.
    text: 'She has been doing everything one-handed and finding it funnier than we do.',
    claims: { injured: true, athome: true, bodyGroup: 'arm' },
    license: (f) => athome(f) && !f.examsWeek && injuredGroup(f) === 'arm',
  },
  {
    text: 'Ten minutes of core work on a mat in the hall, three times a day.',
    claims: { injured: true, athome: true, bodyGroup: 'trunk' },
    license: (f) => athome(f) && !f.examsWeek && injuredGroup(f) === 'trunk',
  },
  {
    text: 'She has stopped picking things up off the floor without thinking about it first.',
    claims: { injured: true, athome: true, bodyGroup: 'trunk' },
    license: (f) => athome(f) && !f.examsWeek && injuredGroup(f) === 'trunk',
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
  // ⚠ A BAND THAT ALWAYS SPEAKS STEPS THROUGH ITS POOL; THE QUIET BAND DRAWS FROM IT.
  //
  // THE LIVE TRACE FOUND THIS, not the suite, and it found it twice. W17/W18 of one season both read
  // "The lower back held. We watched her serve more closely than usual." (a pushed knock governs three
  // consecutive weeks off a pool of four); W50/W51 of the same season both read "The season is over.
  // She slept until nine and it was glorious." (the off-season is four weeks off a pool of three). Both
  // lines were honest and correctly licensed. Both read as a bug.
  //
  // THE SHAPE OF THE FIX IS `buildTrainingRead`'s FOG_POOL, and the load-bearing half is WHERE THE DRAW
  // IS KEYED. Stepping a PER-WEEK draw by an offset achieves nothing, because that draw already moves
  // every week - which is exactly how the first attempt failed. So the ENTRY POINT is drawn ONCE PER
  // CAREER, off a stream with no week in it at all, and the WEEK NUMBER walks the pool from there.
  // Consecutive weeks then land on adjacent indices and cannot collide, and a long band (a 22-week
  // layoff, a December) is guaranteed to cycle its whole pool instead of repeating its favourites.
  //
  // ⚠ AND IT APPLIES ONLY TO THE BANDS THAT ALWAYS SPEAK - `!plainTraining`, which is the calendar's own
  // weeks, the layoff and the knock. The ordinary training band keeps its free per-week draw, because
  // WEEK_NOTE_CHANCE already means two speaking weeks rarely sit next to each other, and a rotation
  // there would make the one band a player sees most often perfectly predictable.
  const idx = plainTraining(facts)
    ? Math.floor(rng() * pool.length)
    : (Math.floor(rngFromSeed(`${seed}:weeknote:entry`)() * pool.length) + facts.week) % pool.length
  const { text } = pool[idx]
  return typeof text === 'function' ? text(facts) : text
}

// =================================================================================================
// W5 — THE WEEK'S OWN PICTURE, AS ONE DECISION
// =================================================================================================
//
// The owner, 30.07: «давай пожалуйста week recap сделаем на каждую неделю, это реально результат, на
// всех поездках он станет живым ... Для недель с тренировками можем использовать наши арты тренировки,
// для недель с восстановлением после травмы соответственно. Если был отпуск - есть соответствующие
// картинки отпуска ... это то, что делает игру невероятно живой».
//
// A STORY ON EVERY WEEK, and the picture is the half that makes a week a week rather than a page of
// figures. `recapExists` already answers true on all 52 (it refuses exactly two things and both are
// right: week 0, which is a career start with nothing behind it, and a reveal still in flight, which
// has not finished being a week). What was missing is that the PICTURE only knew about two kinds of
// week – a journey home and a holiday – and everything else fell through to `weekArtStem`, which
// answers `training` for every in-year week. So a nine-week layoff drew nine paintings of her doing
// ladder drills.
//
// ⚠ WHY IT IS ONE FUNCTION IN THE ENGINE AND NOT FOUR TERNARIES IN A CARD. It was three ternaries in
// WeekRecapCard.vue, which is how a screen ends up deciding what a week WAS. That is a fact about the
// week, not a fact about the layout: the Weekly Story renders it, the Season feed draws week frames of
// its own, and a future surface (a season album, a share card) will want the same answer. A screen
// that derives it can disagree with a screen that does not, and neither would be wrong on its own
// terms. So the decision is `weekSceneFor` and it is on the snapshot; the art layer only spells the
// filename (`art/weeks.ts weekSceneArtUrl`) and the card only writes the alt text.
//
// ⚠ AND IT IS CHOSEN FROM FACTS THAT ALREADY EXIST. Not one draw is added: the journey's mode and mood
// were already drawn (their own sub-streams, `seed:travel:` / `seed:travelmood:`), and the other three
// arms are pure reads – the live injury, the week's booking, the week number. Nothing in this module
// runs inside the tick, so the frozen MAIN capture (41550 / e6b0c709) cannot move; the pin in
// tests/travel-home.test.ts re-derives it with a snapshot taken every single week.
//
// -------------------------------------------------------------------------------------------------
// THE PRIORITY ORDER, WHICH IS THE ONLY REAL DESIGN DECISION HERE
// -------------------------------------------------------------------------------------------------
//
// A week can be several things at once – she came home from a tournament AND is now injured; she was
// on holiday during the off-season – and there is one frame. The order is:
//
//   1. THE JOURNEY HOME     she played somewhere and came back
//   2. THE SCHOOL FORTNIGHT the exam blackout (W6, her age band) – W6b moved it up here
//   3. THE LAYOFF           she is carrying an injury (the rehab painting, her age band)
//   4. THE HOLIDAY          a booked family week resolved (that package's own frame)
//   5. THE RESTED KNOCK     she is at home off the court (W6, her age band)
//   6. THE WEEK FRAME       `weekArtUrl` – the off-season's three in order, else `training`
//
// AND IT IS NOT AN INVENTION: IT IS `WEEK_NOTES`' OWN ORDER, READ OFF THE LICENCES. The scrap under
// the painting and the painting itself are two authors on one page, and if they rank the week's facts
// differently the page contradicts itself. So:
//
//   * a journey takes the scrap from every other note (`athome` – the licence every WEEK_NOTES line
//     carries – is false on a week `travelHomeScene` is non-null), so it takes the frame too;
//   * the layoff outranks the holiday, the exams, the off-season and the training week in the words:
//     every one of those licences carries `f.injured === null` and the layoff band carries none. So
//     rehab outranks the holiday here;
//   * the holiday outranks the off-season in the words (`offSeason` carries `!f.vacationWeek`), so it
//     does here. Which is also the right answer on its own terms: the holiday names ONE week out of
//     the year, December's three frames are a sequence over a block of three.
//
// THE TWO COLLISIONS THE BRIEF NAMES, ANSWERED IN THOSE TERMS:
//
//   «she came home from a tournament AND is now injured» → THE JOURNEY. On the engine's own timing
//     `rollInjury` runs at the TOP of a week, and an injury the week before would have walked the
//     tournament over and left no journey at all – so this is a girl who got home and THEN got the
//     news. The week she lived was the trip. It is also the one week the frame and the scrap are about
//     different things, and deliberately: TRAVEL_NOTES' injured band takes the words on exactly that
//     week, so the picture says where she was and the note says how she is. Two halves of one week,
//     which is what a week that big deserves.
//   «she was on holiday during the off-season» → THE HOLIDAY, per the rule above.
//
// AND THE ONE THE BRIEF DOES NOT NAME: a holiday DURING a layoff → the rehab painting, because that is
// where WEEK_NOTES already puts the words. A seaside frame on a week his daughter is in a knee brace
// would read as the game not noticing, and the scrap on that week says «Rehab, three times this week.»
//
// -------------------------------------------------------------------------------------------------
// W6: WHERE THE TWO NEW FRAMES GO, AND WHY THEY GO UNDER THE HOLIDAY RATHER THAN OVER IT
// -------------------------------------------------------------------------------------------------
//
// ⚠ THE REST WEEK IS THE WEEK AFTER THE ARRIVAL WEEK, which is the fact the whole ordering turns on.
// `rollKnock` only fires on an `ordinaryTrainingWeek` – no tournament, no blackout, no holiday, no
// friendly – so the week he DECIDES on is always a plain one. But the decision governs
// `sinceWeek + 1 .. untilWeek`, and NOTHING constrains what that next week is: the calendar can put
// exams, the off-season, a booked holiday or an entered tournament there, and a rested knock blocks
// none of them (it is not an injury – `world.injury` stays null and she stays entry-eligible). So
// every collision below is reachable, and two of them were found by walking a season rather than by
// reasoning about one.
//
//   A RESTED KNOCK ON A WEEK SHE STILL TRAVELLED → THE JOURNEY, by rule 1, unchanged. Same shape as
//     the injured journey: the week she LIVED was the trip, and the scrap can carry the other half.
//   A RESTED KNOCK DURING A HOLIDAY → THE HOLIDAY. He booked that week and paid a quoted price for
//     it; its painting is the closest thing the Season feed has to a receipt, and a sore ankle at the
//     seaside is still the seaside. Same reason the holiday outranks the off-season.
//   A RESTED KNOCK DURING THE EXAM FORTNIGHT → THE EXAMS, and this is the one that needed an argument
//     rather than a preference. The exam block is TWO weeks and a rest week can only ever cover ONE of
//     them, so a knock that outranked exams would draw the block as two different things – ice on the
//     sofa, then the racquet in the hall. That is precisely the failure the off-season's fixed
//     three-in-order exists to prevent: a BLOCK has to read as a block. The blackout is also the
//     stronger fact about the week (she could not have entered anything either way), and it is why
//     resting inside it costs her less: the week was never going to be a training week.
//
// ⚠ AND WHAT THIS DOES *NOT* CLAIM ABOUT THE WORDS. On a collision week the note pool holds BOTH
// bands – `weekNoteFor` filters by licence and the rotation walks the union – so an exams-plus-rest
// week can be painted `study` and captioned «A week off the ankle.» That is NOT the contradiction W5
// found in the vacation band (a sentence about swimming over a picture of a village wall): both
// sentences are true of the same week and neither describes the picture. The frame answers "what was
// this week", the scrap answers "what was it like"; they are allowed to pick different true halves,
// and on this week they cannot pick contradictory ones because the licences that would clash
// (`f.injured === null` on both) already rule each other out.
//
// A PUSHED KNOCK GETS NO FRAME AT ALL, deliberately. She trains as planned – that is the entire
// meaning of the branch – so `training` is not a compromise there, it is the correct picture, and the
// scrap's push band ("Full week on court. She strapped it up herself") is what says the rest.
//
// -------------------------------------------------------------------------------------------------
// W6b: THE EXAM FORTNIGHT MOVED ABOVE THE LAYOFF – the owner's ruling, and it costs less than it looks
// -------------------------------------------------------------------------------------------------
//
// The owner, 30.07: «мне кажется картинка с экзаменами в свои недели может превалировать над
// картинками восстановления на итогах недели». So exams now sit at 2, above the layoff.
//
// ⚠ ONLY ONE COLLISION IS REACHABLE, AND IT IS THE ONE HE NAMED. Moving exams above the layoff moves
// them above the holiday and the knock too, by transitivity – and both of those are inert:
//   * exams + HOLIDAY cannot happen. `assertPlannable` refuses the booking outright («School exams
//     that week - no matches, no trips»), so there is no week that is both.
//   * exams + JOURNEY cannot happen. A blackout week carries no event, so `travelHomeScene` is null on
//     it, and the journey arm keeps the head of the order regardless.
//   * exams + a rested KNOCK was already decided the same way one rung lower (the block-reads-as-a-
//     block argument above), so the move changes nothing there.
// What is left is exams DURING A LAYOFF, which is common: she is out ~10 weeks a season, so a long one
// swallows the fortnight roughly a fifth of the time. That is the case the ruling is about and the only
// behaviour that changes.
//
// AND IT IS THE BETTER ANSWER FOR THE REASON HE GAVE – atmosphere. A nine-week layoff draws the same
// rehab painting nine times; the two exam weeks inside it are a real thing that happened to her, and
// breaking the sequence with them makes the layoff read as a stretch of her LIFE rather than as a
// progress bar. It also costs the layoff nothing it needs: the injury still owns the Mood card, the
// condition note, the availability chips and the Season feed's red band.
//
// ⚠ THE WORDS HAD TO MOVE WITH IT, and that is the half a priority change usually forgets. WEEK_NOTES'
// exam band carries `f.injured === null`, so before this the scrap on an exams-during-a-layoff week said
// «Rehab, three times this week.» - which under a picture of her revising is the page contradicting
// itself, the one failure this whole ordering exists to prevent. So the layoff band now carries
// `!f.examsWeek` and the fortnight inside a layoff has its own three lines, which say BOTH things. Same
// shape as `offSeason`'s `!f.vacationWeek`.

/**
 * THE ONE ANSWER to "which painting does this week show". See the order above.
 *
 * Pure, deterministic, draw-free: `facts` already carries the journey's mode and mood (drawn on their
 * own sub-streams when the facts were assembled), and the other three arms are reads.
 *
 * ⚠ THE ONSET WEEK OF AN INJURY DRAWS `rehab`, NOT `injury`, and that is R14-1's own split rather than
 * a shortcut. The owner, 29.07: «rehab – показываем ... до момента восстановления, травму показываем
 * ТОЛЬКО в момент самой травмы в попапе». The moment she went down belongs to the blocking popup
 * (InjuryStopDialog) and to the Memory card; the WEEK belongs here, and every week of a layoff is a
 * week she is not playing.
 */
export function weekSceneFor(args: {
  facts: DiaryFacts
  /** her age band this week – the layoff painting ships one per band */
  stage: PortraitStage
  /** the package a booked holiday resolved into this week, or null */
  vacationPackageId: string | null
}): WeekScene {
  const { facts, stage, vacationPackageId } = args
  const week = facts.week
  // 1. she went somewhere and came back
  if (facts.travelHomeScene !== null) {
    return { kind: 'travel', week, scene: facts.travelHomeScene, mood: facts.travelHomeMood ?? 'sleepy' }
  }
  // 2. school took the fortnight – ABOVE THE LAYOFF, on the owner's ruling (see W6b below)
  if (facts.examsWeek) return { kind: 'exam', week, stage }
  // 3. she is out
  if (facts.injured !== null) return { kind: 'rehab', week, stage }
  // 4. the family went away
  if (facts.vacationWeek && vacationPackageId !== null) return { kind: 'vacation', week, packageId: vacationPackageId }
  // 5. she is at home, off the court, resting something sore
  if (facts.knockChoice === 'rest') return { kind: 'knock', week, stage }
  // 6. the calendar's own frame – December's three, or training
  return { kind: 'week', week }
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
  // R15-5: the first cheque, in the parent's voice and inside the 39-char budget the card sets.
  { type: 'prize', text: (m) => (m.tier ? `First prize money – a ${short(m.tier)} cheque.` : 'First prize money – a real cheque.') },
  { type: 'prize', text: () => 'The first week the tennis paid her.' },
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
    // W5: WHICH PAINTING THIS WEEK SHOWS, decided once, here, beside the facts it reads. The age band
    // is the same arithmetic `selectMemory` uses below (start age plus completed years), so no new
    // view field was needed for it.
    scene: weekSceneFor({
      facts,
      stage: portraitStage(view.startAgeYears + Math.floor(view.week / 52)),
      vacationPackageId: view.vacationPackageId ?? null,
    }),
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
