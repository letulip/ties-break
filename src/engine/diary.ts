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
// ⭐ #16: the ONE place a table is named (`LADDER_LABEL`), so the diary cannot invent a word for a
// ladder that every other screen already has a name for. Imported as a VALUE, unlike the types below.
import { LADDER_LABEL } from '../shared/protocol'
import type {
  DiaryFacts,
  DiarySnapshot,
  MemoryCard,
  Milestone,
  MilestoneType,
  WeekScene,
} from '../shared/protocol'
import { isExamWeek, isOffSeasonWeek } from './season/calendar'
import { rngFromSeed } from './rng'
import { seasonYear, weekLabel } from '../shared/dates'
// W6c: the anatomy, so a line about her body can know which body it is about. A leaf module – see the
// note at the top of body.ts for why the twelve parts do not live in world.ts any more.
import {
  lastKidResultOf,
  lastKidTitleOf,
  milestoneKey,
  MEMORY_EMOTION,
  conditionBandOf,
  fundsPressureOf,
  diaryLifeStageFor,
} from './diary/facts'
import { TRAVEL_NOTES, travelNoteFor, coachTripNoteFor } from './diary/travelNotes'
export { TRAVEL_NOTES, travelNoteFor, coachTripNoteFor }
export type { TravelClaims, TravelNote } from './diary/travelNotes'
import { WEEK_NOTE_GRIND, WEEK_NOTE_LIGHT, WEEK_NOTE_CHANCE, WEEK_NOTES, weekNoteFor } from './diary/weekNotes'
export { WEEK_NOTE_GRIND, WEEK_NOTE_LIGHT, WEEK_NOTE_CHANCE, WEEK_NOTES, weekNoteFor }
export type { WeekClaims, WeekNote } from './diary/weekNotes'
import { DIARY_POOL, diaryLine } from './diary/pool'
export { DIARY_POOL, diaryLine }
export type { DiarySurface, DiaryClaims, DiaryPhrase } from './diary/pool'
import { short } from './diary/words'
import type { DiaryWorldView } from './diary/facts'
import { travelHomeSceneFor, TRAVEL_SLEEP_CHANCE_EMPTY, TRAVEL_SLEEP_CHANCE_FRESH, travelSleepChance, TRAVEL_FINAL_SLEEP_CHANCE_EMPTY, TRAVEL_FINAL_SLEEP_CHANCE_FRESH, travelFinalSleepChance, travelHomeMoodFor, travelHomeFactsFor } from './diary/travelHome'
export { travelHomeSceneFor, TRAVEL_SLEEP_CHANCE_EMPTY, TRAVEL_SLEEP_CHANCE_FRESH, travelSleepChance, TRAVEL_FINAL_SLEEP_CHANCE_EMPTY, TRAVEL_FINAL_SLEEP_CHANCE_FRESH, travelFinalSleepChance, travelHomeMoodFor, travelHomeFactsFor }
export type { TravelHomeFacts } from './diary/travelHome'
export { lastKidResultOf, lastKidTitleOf, milestoneKey, MEMORY_EMOTION, conditionBandOf, fundsPressureOf, diaryLifeStageFor }
export type { DiaryWorldView } from './diary/facts'


// THE FACTS moved to diary/facts.ts; imported back and re-exported below.

// THE JOURNEY HOME moved to diary/travelHome.ts; imported back and re-exported below.
/** Which of this week's captured milestones the diary calls THE fresh one (a title week also
 *  captures its final – the louder fact wins). R15-5: `prize` sits under the results themselves -
 *  a first W15 title week also banks the first cheque, and "she won it" is the louder fact than
 *  "it paid" - but above the passport and the rest. */
// ⚠ 'school' IS LAST ON PURPOSE (W4-SCHOOL). Leaving school lands on a fixed September week and a
// title can land on the same one; a result she played for outranks a date on a calendar, every time.
const MILESTONE_PRIORITY: readonly MilestoneType[] = ['title', 'final', 'prize', 'international', 'injury', 'season-rank', 'school']

/** Assemble the facts – every field read off state that already exists, and (since R14-2) exactly
 *  TWO that are drawn: `travelHomeScene` and the coin inside `travelHomeMood`, each on its own
 *  purpose-scoped sub-stream. Rule 2 at the top of this file is unchanged and is what matters –
 *  zero draws on the MAIN weekly stream, from anything in this module, ever. */
export function assembleDiaryFacts(view: DiaryWorldView): DiaryFacts {
  const { week } = view
  const lifeStage = diaryLifeStageFor(view.ageYears, view.schoolOver, view.inCollege)
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
    lifeStage,
    birthdayAge: view.birthdayAge,
    injury: view.injury,
    pendingUnfinished: view.pendingUnfinished,
  })
  return {
    week,
    ageYears: view.ageYears,
    lifeStage,
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
    // W4-SCHOOL: `schoolOver` comes off the view rather than being re-derived here – the diary is
    // a reporter and this module owns no calendar arithmetic of its own.
    examsWeek: isExamWeek(week, view.schoolOver),
    // ROUND-18 #9: and the fact ITSELF travels, not only its effect on exam weeks – see the note on
    // `DiaryFacts.schoolOver`. Same rule as the line above: taken off the view, never re-derived.
    schoolOver: view.schoolOver,
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
    // ⭐ v48: ...and what he gave her for it. Read, not drawn – a decision the player made and the
    // world persisted, exactly like the knock above, and the whole reason the birthday cost a bump.
    birthdayGift: view.birthdayGift,
    birthdayWanted: view.birthdayWanted,
    birthdayRepeatAge: view.birthdayRepeatAge,
    knockChoice: view.knockChoice,
    knockPart: view.knockPart,
  }
}

// THE PHRASE POOL moved to diary/pool.ts; imported back and re-exported below.

// THE TRAVEL NOTES moved to diary/travelNotes.ts; imported back and re-exported below.

// THE WEEK NOTES moved to diary/weekNotes.ts; imported back and re-exported below.

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
  // ⭐ ROUND-17 #16 – A RANK PRINTED WITHOUT ITS TABLE IS NOT A FACT. These two lines read "Season
  // 2035 closed at #79." and named no table, on a career that has THREE of them. The number is
  // `Milestone.rank`, and `captureMilestone` writes `world.kidRank` into it - which is the
  // INTERNATIONAL (junior) table, always and by construction (see `recomputeKidRank`). So a
  // twenty-year-old professional read her junior placing as if it were her standing, in the same
  // sentence a season is summed up in.
  //
  // ⚠ THE TABLE IS A CONSTANT HERE, NOT A LOOKUP, AND THAT IS WHY THIS NEEDS NO SCHEMA MOVE.
  // `Milestone` is PERSISTED (`world.milestones`) and carries no track; giving it one is a
  // three-part move (CLAUDE.md invariant 3) and is NOT done here. It does not need one to stop
  // lying: every `season-rank` milestone ever written holds the international number, so naming
  // that table is simply saying what the field already means. What a track WOULD buy is printing
  // the professional rank for an adult, which is a different and larger change - reported, not made.
  { type: 'season-rank', text: (m) => `Season ${seasonYear(m.seasonIndex ?? 0)}: #${m.rank ?? 0} ${LADDER_LABEL.itf.toLowerCase()}.` },
  { type: 'season-rank', text: (m) => `She ended ${seasonYear(m.seasonIndex ?? 0)} #${m.rank ?? 0} ${LADDER_LABEL.itf.toLowerCase()}.` },
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
    lifeStage: facts.lifeStage,
    birthdayAge: view.birthdayAge,
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
    // ⭐ ROUND-21 #2: ...and whether the coach was on the trip. Gated on `travelHome` for the same
    // reason `travelNote` is – this is the caption of the journey painting, so it only exists on the
    // weeks that painting does – and on the engine's own `coachTravelsWithHer`, carried on the view
    // rather than re-derived, so the flow, the commentary and this scrap describe the same trip.
    coachNote: travelHome && view.coachTravelled ? coachTripNoteFor(view.week, view.seed) : null,
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
