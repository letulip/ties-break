// THE WORDS: the diary, the memory, her life off the court, and the fog-of-war radar.
//
// Milestones are captured AT THE MOMENT they happen; `DiaryFacts` is everything a phrase is
// licensed to know; the birthday DTOs are here because the diary is the only thing that reads them.
//
// Part of the `shared/protocol` module set – see src/shared/protocol.ts, which re-exports every
// name below under the historical public path. Nothing here imports that barrel back.

import type { SkillKey } from '../../engine/development'
import type { TierId } from '../../engine/season/types'
import type { AvatarEmotion, PortraitEmotion, PortraitStage } from '../avatarEmotion'
import type { KnockChoice } from './health'

// --- Diary-1 + Memory (docs/specs/family-diary.md, D1/D2/D3 + D10) -------------
// The diary speaks in WORDS licensed by FACTS. The engine assembles the facts at snapshot time
// (nothing here is persisted except the milestone ledger), selects at most one line per surface
// off the `seed:diary:<week>` sub-stream, and the UI renders the strings verbatim – so a phrase
// can never assert something the simulation did not do. src/engine/diary.ts owns the whole system.

/** The durable moments a career keeps forever (D10, schema v18). Captured AT THE MOMENT they
 *  happen; a dozen rows per career, so the ledger needs no pruning.
 *
 *  ⚠ `prize` joined in round 15 (owner, 01.08: «я believe it's a very memorable moment») – the week
 *  the tennis first PAID her, which on this ladder means her first W-family finish deep enough to
 *  cash. No schema bump: the milestones array is opaque to the migration ladder (rows pass through
 *  untouched), so widening the union is a new capture, not a new shape. */
export type MilestoneType =
  | 'title'
  | 'final'
  | 'prize'
  | 'international'
  | 'injury'
  | 'season-rank'
  /** ⚠ THE TURN, AND IT CANNOT BE RECONSTRUCTED AT THE END (contract §9.4). Slot 6 of the album is
   *  the week her cumulative prize money first passed her cumulative costs – the break-even the
   *  whole game is about. The finance ledger keeps SIXTY WEEKS, and the crossing may happen in
   *  season seven, so by the time the epilogue asks, the arithmetic behind the answer has been
   *  pruned out of the save. It has to be captured the week it happens or the album's central page
   *  is empty for everybody who earned it. Career-total counters (`careerTotals`, v39) are what
   *  make the test cheap enough to run every week. */
  | 'break-even'
  /** ⚠ W4-SCHOOL: THE LAST DAY OF SCHOOL, and it is here because the owner's ruling on how this game
   *  tells a story requires it. School ending is a thing that happens to a family, and a flag that
   *  flipped silently between two weeks would be the wrong shape for it: «Школа должна когда-то
   *  закончиться». Captured the week it happens, back-filled by the v43 migration for every career
   *  already past it - his own is twenty-two - so the scroll never has a hole where a life changed. */
  | 'school'

/** One captured milestone. Deliberately tiny: type + week + the minimal payload its memory line
 *  needs. Identity (for idempotent capture) is `milestoneKey` in engine/diary.ts. */
export interface Milestone {
  type: MilestoneType
  /** the absolute career week it happened */
  week: number
  /** title/final: the tier it happened at. international: the tier of the first entry (absent on
   *  a migrated save that only knows the week). prize: the tier that paid her first cheque. */
  tier?: TierId
  /** injury: the injury kind, e.g. "ankle soreness" */
  kind?: string
  /** season-rank: the season it closed */
  seasonIndex?: number
  /** season-rank: her rank at that season's wrap-up */
  rank?: number
}

// =================================================================================================
// THE BIRTHDAY AND THE GIFT (v48) – docs/specs/birthday-and-gifts.md
// =================================================================================================
//
// ⚠ ONLY THE THREE WIRE ROWS ARE HERE. The catalogue's own shape (`BirthdayGift`) and the diary's
// one spelling of the day (`BIRTHDAY_DAY_NOUN`) went back to the engine in R2-09 – see
// src/engine/world/birthdayGift.ts. They never crossed this boundary.

/** A gift as the DIALOG sees it: what to print on the row, and the id to send back.
 *
 *  ⚠ `ask` AND `short` ARE DELIBERATELY ABSENT, and so is any marker of which row answers the ask.
 *  The owner, 11.08: «не помечай, пусть игрок читает». The client is never told the answer – it is
 *  re-derived engine-side – so no future component can mark it even by accident. */
export interface BirthdayOption {
  id: string
  label: string
  note: string
}

/** THE POPUP, on her birthday week. Always fires (owner: «я бы оставил попап на ДР всегда»), and
 *  because it always fires "nothing" has to be an explicit BUTTON rather than a dismissal – so the
 *  four options are three gifts plus "just the day together" and the dialog closes no other way. */
export interface BirthdayPrompt {
  week: number
  /** the age she turns – `birthdayTurning`, which is day-exact since round-16 #100 */
  age: number
  /** A deterministic, age-aware heading. The component does not flatten every year into the same
   *  "She is N today" sentence. */
  heading: string
  /** ⭐ what she has been asking for, in prose. EXACTLY ONE of the four options answers it, and
   *  nothing marks which (spec §2ab / §5.4). */
  ask: string
  /** four, in a COLUMN (owner: «в колонку ставь, там хватит места»), in the order to show them.
   *  The order is drawn, so the answer's position carries no information. */
  options: BirthdayOption[]
}

/** ⭐ ONE ROW PER BIRTHDAY (v48). The DIARY reads it and nothing else does: no morale, no condition,
 *  no mood modifier – that system does not exist yet and this slice only lays the ground (spec §2b,
 *  owner: «мораль и психологи у нас в будущем, так что сейчас можно просто подготовку сделать»).
 *
 *  ⚠ IT SPLITS THE OUTCOME INTO THREE WHERE THERE WERE TWO, which is the whole gain for the future:
 *  she got what she asked for (`asked === given`), she got something else and it was a real present
 *  (they differ), or she got nothing (`given` is null). "Gave the wrong thing" and "gave nothing" are
 *  not the same act and a parent knows it; one field buys that distinction. */
export interface BirthdayRecord {
  /** the career week the birthday fell in */
  week: number
  /** the age she turned */
  age: number
  /** the gift id she had been asking for – always one of the four she was offered */
  asked: string
  /** what was chosen: a gift id, `'day'` for the day together, or null for nothing.
   *
   *  ⚠ NULL IS NOT REACHABLE THROUGH THE POPUP, and that is the popup working. All four buttons are
   *  real answers and the dialog has no other exit, so a parent who is asked always answers. It is
   *  carried because the outcome above is a real one the record must be able to state, and because
   *  ABSENT IS NOT ZERO: a birthday nobody was asked about (a migrated career, or the four years at
   *  college) has NO ROW AT ALL rather than a row saying he gave nothing. Spec §5.5.
   *
   *  ⚠ AND WHEN MORALE ARRIVES, THIS IS THE FIELD IT WILL READ – see the TIME_TOGETHER note in
   *  engine/world/birthday.ts. A day together and a week at home are two different ids on purpose
   *  (round-18 #10b, the owner: «когда будем мораль делать может быть надо будет учитывать оба»), so
   *  a weighting can tell them apart without a schema change. Collapsing them into one id would make
   *  that impossible after the fact. */
  given: string | null
}

/** How drained she is, as a WORD (D3 – Home speaks words; Stats keeps the number). */
export type ConditionBand = 'fresh' | 'ok' | 'worn' | 'drained'

/** How the family wallet is breathing, as a band – the diary never quotes the balance. */
export type FundsPressure = 'tight' | 'watchful' | 'ok'

/** The narrator's relationship to her week. Derived at snapshot time; never persisted. */
export type DiaryLifeStage = 'school' | 'after-school' | 'college' | 'independent'

/** Everything a diary phrase is allowed to know – assembled by the ENGINE at snapshot time, all
 *  read off facts that already exist on the world. A phrase is selected BY these and may assert
 *  nothing they do not carry (the honesty pin in tests/diary.test.ts sweeps exactly that). */
export interface DiaryFacts {
  week: number
  /** Her actual age and the corresponding narrative viewpoint. These keep a late-career diary
   *  from observing a grown woman's homework, bedroom, or breakfast as if she still lived at home. */
  ageYears: number
  lifeStage: DiaryLifeStage
  /** the ONE face decision, computed engine-side (same inputs the paintings render).
   *  `PortraitEmotion`, not `AvatarEmotion`: the decision can land on the painting-only `rehab`
   *  (R14-1 – the layoff is a state and wears its own picture), and nothing renders a crop of it. */
  emotion: PortraitEmotion
  /** a competitive result from THIS week is on her face (the emotion above is a result emotion) */
  resultFresh: boolean
  /** fresh result: she won her last match this week */
  won: boolean
  /** fresh result: the loss was the FINAL – runner-up, a good result (R8-6a) */
  lostFinal: boolean
  /** a tournament TITLE landed this week (finishIdx 0 on this week's summary) */
  titleThisWeek: boolean
  /** tier of the fresh result, when it could be resolved */
  resultTier: TierId | null
  /** her rank after this week's standings recompute is strictly better than before it –
   *  the engine's capture (never derived in the UI) behind the third loss softener */
  rankClimbed: boolean
  /** R13-2: the ranking points her run AWARDED this week (the kid's result rows at `week`).
   *  finalizeTournament writes a row only when points > 0, so since wave B's first-round zero
   *  "> 0" is exactly "she WON matches this week" – the licence the climb softener and the
   *  good-loss diary lines require, because rank is relative and can climb on a zero-point week
   *  purely off rivals' results decaying out of their 52-week windows. */
  runPointsThisWeek: number
  /** consecutive competitive losses ending at her most recent competitive match (0 = none) */
  lossStreak: number
  /** raw condition 0..100 – the diary module bands it; surfaces print words, not this number */
  condition: number
  conditionBand: ConditionBand
  /** the active injury, or null when healthy */
  injured: { kind: string; weeksRemaining: number; totalWeeks: number } | null
  /** this week's drains, read off the week's own events/state */
  travelled: boolean
  playedTournament: boolean
  playedPractice: boolean
  examsWeek: boolean
  /** ROUND-18 #9: is she past her last school year? `DiaryWorldView` has carried this since W4-SCHOOL
   *  and it stopped at the exam pool – `examsWeek` is simply never true past school, which silences
   *  revision notes but says nothing to any OTHER line. So the off-season phrase went on naming
   *  school to a twenty-one-year-old (the owner, on his own save at W50 '38, 171 weeks after her last
   *  September). A licence can only read what the facts carry, so the fact comes down to them.
   *  DERIVED at snapshot time like everything here, never persisted – no schema move. */
  schoolOver: boolean
  offSeasonWeek: boolean
  vacationWeek: boolean
  /** WHICH family package that week was – the catalogue's own id, or null when she was not away (or
   *  when the booking has aged off the four-week retention and the save no longer knows).
   *
   *  ⚠ IT FEEDS COPY LICENCES NOW, which is a change of category rather than a new field: it reached
   *  the diary from the day the paintings shipped, but only `weekSceneFor` read it, so six different
   *  holidays were captioned with one sentence (owner, 31.07: «куда бы ни поехала ... week recap, ну
   *  кроме картинки»). The photo and condition pools now license on it, one line per package, and the
   *  sentences climb with `conditionGain` so a staycation cannot claim what the clinic delivers. */
  vacationPackageId: string | null
  /** HOW HARD SHE WORKED THIS WEEK – `plan.train`, the percentage the player set (60 / 75 / 85 on
   *  the presets). W2: the one fact about an ordinary week the diary had no access to, and the only
   *  one that is the PLAYER's decision rather than the world's. Every other field here is something
   *  that happened to her; this is something he chose, which is why the week-note pool is licensed on
   *  it. Derived (the plan lives on the world already) – no schema. */
  trainPct: number
  fundsPressure: FundsPressure
  /** a milestone captured THIS week, if any */
  freshMilestone: MilestoneType | null
  /** the scene of the journey home, on a week she came back from an away tournament; null
   *  otherwise. See engine/diary.ts travelHomeSceneFor for the rule and the draw. */
  travelHomeScene: TravelHomeScene | null
  /** HOW she came home, on exactly the weeks `travelHomeScene` is non-null (null on every other
   *  week, and the two are null together by construction). The owner's rule, read off the tournament
   *  she is coming back FROM and the state she is in: reached the final → happy, or sleepy if she is
   *  running on empty; fell short → sad, or sleepy if she was worn out anyway. Both branches are a
   *  coin weighted by her condition, and the final's sits strictly below the other one at every
   *  condition (W7). See engine/diary.ts travelHomeMoodFor. */
  travelHomeMood: TravelHomeMood | null
  /** W4 – WHAT THE KNOCK IS DOING TO THIS WEEK, or null. `'rest'` = she is spending the week off the
   *  training court; `'push'` = she is training on it and the coach knows.
   *
   *  ⚠ THE WEEK-NOTE POOL HAD TO LEARN ABOUT THIS OR IT WOULD LIE. W2's ordinary-week band is licensed
   *  on `plainTraining`, and a rested week would otherwise still be eligible for "Six days on court.
   *  She ate like someone twice her size." – which the honesty pin exists to catch. So the fact rides
   *  on the facts object, `plainTraining` excludes it, and the knock gets its own band of lines.
   *  Derived: `world.knock` is persisted, this is a reading of it. */
  knockChoice: KnockChoice | null
  /** W4: where the live knock is, on exactly the weeks `knockChoice` is non-null. Null together with
   *  it by construction – the note pool needs the part to name it. */
  knockPart: string | null
  /** THE AGE SHE TURNS THIS WEEK, or null on the other fifty-one (owner, 30.07). Derived from her birth
   *  month against the calendar - no schema, and it cannot disagree with `kidAgeExact` because both read
   *  the same two facts.
   *
   *  It is a NUMBER rather than a boolean because the age is the point. A December girl turning fourteen in
   *  the last month of a season she played as a thirteen-year-old is the relative-age story told in one
   *  line, and it is where the player first meets it. */
  birthdayAge: number | null
  /** ⭐ v48: WHAT HE GAVE HER, as the diary's own noun – "the headphones". Null on every week that is
   *  not a birthday, and on a birthday week he has not answered yet (the note completes when he does).
   *
   *  A NOUN AND NOT AN ID, so the diary imports no catalogue and stays a reporter: `giftNoun` is
   *  resolved once, in the engine, over the WHOLE catalogue rather than this year's band – a callback
   *  is by definition about a gift given at a different age. */
  birthdayGift: string | null
  /** ⭐ v48: did it answer what she had been asking for? False when he gave her something else, which
   *  is a different act from giving nothing and the record keeps them apart (spec §2ab). */
  birthdayWanted: boolean
  /** ⭐ v48: the age she was the last time she was given THIS EXACT THING, or null the first time.
   *
   *  The owner ruled the catalogue may repeat (11.08: «вполне можно») «and the diary is expected to
   *  notice» – so a repeat is content the system gets for free, and this is the field that buys it. */
  birthdayRepeatAge: number | null
}

/** THE JOURNEY HOME (owner, 29.07: «sleepy показываем рандомно после выездов на турниры в конце на
 *  экране Week story как в макете»). Four paintings of the same girl asleep on the way back –
 *  `fem-euro-brunnet-travel-{mood}-{scene}.webp`.
 *
 *  NOT PART OF THE PORTRAIT MATRIX, and deliberately not typed as one: they are NOT band-scoped.
 *  The same four serve a fourteen-year-old and a woman of thirty-one, because the picture is of a
 *  journey rather than of a face – she is asleep in all four. Forcing them into `PortraitEmotion`
 *  would have implied five copies of each that do not exist and never will. */
/** THE MOOD OF THE JOURNEY HOME. The owner's 29.07 art drop turned four paintings into twelve:
 *  «если дошла до финала можем рандомно показывать happy/sleepy разные, если не дошла - sad или
 *  sleepy если сильно устала при этом». The ENGINE picks it; nothing here decides. */
export type TravelHomeMood = 'sleepy' | 'happy' | 'sad'

export type TravelHomeScene = 'airport' | 'plane' | 'bus' | 'car'

/** W5 — WHICH PAINTING A WEEK SHOWS (owner, 30.07: «week recap сделаем на каждую неделю ... Для
 *  недель с тренировками можем использовать наши арты тренировки, для недель с восстановлением после
 *  травмы соответственно. Если был отпуск - есть соответствующие картинки отпуска»).
 *
 *  A DISCRIMINATED UNION AND NOT A URL, because the two are different jobs: the ENGINE decides what
 *  the week was (`engine/diary.ts weekSceneFor`, which is where the priority order is written down and
 *  argued), the ART LAYER spells the filename (`art/weeks.ts weekSceneArtUrl`) and the CARD writes the
 *  description. A screen handed a URL cannot be asked what the week was; a screen handed this cannot
 *  answer it differently from any other screen.
 *
 *  Every arm carries `week`, so the filename builder needs no second argument and the vacation arm can
 *  fall back to the week frame for a package whose picture has not been painted yet.
 *
 *  W6 ADDED `exam` AND `knock` (owner's art, 30.07), and each closed a week the frame was contradicting
 *  rather than merely generalising:
 *    `exam`  – the school fortnight drew ladder drills on a week she cannot enter anything.
 *    `knock` – the owner, reading the trace: «Неделя с заминкой показывает заминку в записке и в сводке
 *              - но картинка ей противоречит». A rested knock is a FOURTH state the art had no frame
 *              for: not training, not a holiday, not a layoff (`world.injury` stays null and she is
 *              still entry-eligible) - she is at home, off the court, back on Monday.
 *  Both are BAND-SCOPED like `rehab`, because both are pictures of HER rather than of a place. */
export type WeekScene =
  | { kind: 'travel'; week: number; scene: TravelHomeScene; mood: TravelHomeMood }
  | { kind: 'rehab'; week: number; stage: PortraitStage }
  | { kind: 'vacation'; week: number; packageId: string }
  | { kind: 'exam'; week: number; stage: PortraitStage }
  | { kind: 'knock'; week: number; stage: PortraitStage }
  | { kind: 'week'; week: number }

/** The Memory card (D10): a past milestone, the painting from the age band she was in THEN, and
 *  one line.
 *    `anniversary` – the milestone's week is ~52 weeks ago (±1). The loud one.
 *    `debut`       – the career's OPENING WEEK (W3, owner 30.07). Carries no milestone: week 0 is a
 *                    fact of every career, so it needs no ledger entry and persists nothing.
 *    `echo`        – an older memory the rotation came round to.
 *    `recent`      – the rotation landed on her newest. A3: the card is titled "Recent memory", and a
 *                    quiet week used to make it say "Too early for memories" to a girl four seasons
 *                    into her career. Silence is a fine thing for a diary LINE; on a card with a
 *                    heading it is a lie. The distinction survives in `kind` so the loud weeks can
 *                    still look different from the quiet ones. */
export interface MemoryCard {
  kind: 'anniversary' | 'debut' | 'echo' | 'recent'
  /** null on the `debut` card ONLY – see `kind`. Widening this costs no schema: `MemoryCard` is
   *  derived at snapshot time and never saved; the milestone LEDGER behind it is untouched. */
  milestone: Milestone | null
  /** e.g. "one year ago" (anniversary) or the milestone's week label "W14 '31" (echo/recent) */
  whenLabel: string
  /** the age band she was in at the milestone's week – what makes time felt */
  stage: PortraitStage
  /** the painting emotion the memory shows (title → happy, injury → injury, …).
   *  Stays the NARROW union on purpose: a memory is a picture of a WEEK THAT HAPPENED, so every
   *  value here is a moment face – `injury` is the week she went down, never the layoff after it
   *  (R14-1). Nothing a milestone can map to is painting-only. */
  emotion: AvatarEmotion
  line: string
}

/** The diary as the UI sees it: the facts, plus at most ONE selected line per surface. The photo
 *  line may be null – silence is allowed and meaningful (an ordinary week may say nothing). */
export interface DiarySnapshot {
  facts: DiaryFacts
  /** the one phrase under her name on the Home photo card (D2), or null for a quiet week */
  photoLine: string | null
  /** epic/redesign-home: the time-of-day word the diary page opens with – "Good morning" before the
   *  week is played, "Good evening" once its tournaments have resolved, otherwise varied off
   *  `seed:greet:<week>` and never repeating a word the caption already used. See greetingFor. */
  greeting: string
  /** the one WHY line beside the condition bar (D1) – never empty */
  conditionNote: string
  /** THE NOTE ON THE SCRAP UNDER THE JOURNEY PAINTING (screen D). Non-null on exactly the weeks
   *  `facts.travelHomeScene` is non-null, and never null on those – the picture is of a journey and
   *  a picture of a journey wants a caption, the same argument that keeps `conditionNote` from being
   *  silent. Written in the PARENT's voice, about her, in the third person; every line is licensed
   *  by facts of the trip she is coming back from, so it can never describe a final she did not
   *  reach. See engine/diary.ts TRAVEL_NOTES. */
  travelNote: string | null
  /** THE ORDINARY WEEK'S NOTE, on the same scrap `travelNote` uses (screen D) and in the same
   *  parent's hand – null on most weeks, and null on every week `travelNote` speaks. W2: the owner's
   *  «чтобы тренировочные недели не просто скипались ... что происходит на этих неделях». See
   *  engine/diary.ts WEEK_NOTES for the cadence and the licences. */
  weekNote: string | null
  /** ⭐ ROUND-21 #2 – THE COACH WAS THERE, in the week's story. Non-null on exactly the weeks she
   *  came home from a tournament AND the coach travelled with her; null on every other week,
   *  including every trip he stayed home for.
   *
   *  ⚠ IT IS ITS OWN FIELD RATHER THAN ENTRIES IN `TRAVEL_NOTES`, and that is the difference between
   *  presence and decoration. The travel pool is a LICENSED lottery – a line joins ~370 others and is
   *  drawn some weeks – which is right for colour and wrong for a fact the player just paid a second
   *  fare for: he would be in the story on maybe one trip in twenty. This says it on every trip he
   *  came on and on none that he did not.
   *
   *  Parent's voice, like the scrap it sits under (diary/travelNotes.ts rule 1): the family noticing
   *  him, never him assessing her. */
  coachNote: string | null
  /** the Memory card to show this week, or null */
  memory: MemoryCard | null
  /** W5: WHICH PAINTING THIS WEEK SHOWS – the journey home, the layoff, the holiday, or the week's
   *  own frame. One decision, taken in engine/diary.ts (`weekSceneFor`) where the priority order is
   *  written down, so no surface can derive a different answer. Derived at snapshot time from facts
   *  that already exist; adds no draw and bumps no schema. `art/weeks.ts weekSceneArtUrl` turns it
   *  into a filename. */
  scene: WeekScene
}

// --- her life off the court (engine/kidLife.ts) -------------------------------
// The three tiles of screen C's attribute grid that are about the GIRL rather than her results:
// Personality, School and Friends. The design draws all three; the engine derives all three, from
// her play style, her age and birth month, and the week's own facts. Derived at snapshot time
// exactly like `radar` and `coachMarket` – it persists nothing and bumps no schema.

/** One tile: two short lines, as the design's cells are drawn. Both are `white-space: nowrap` on
 *  screen C, so both are written to a hard 17-character budget (see TILE_LINE_MAX). */
export interface KidLifeTile {
  /** the first line – the fact ("10th grade", "Patient", "Close to Sofia") */
  lead: string
  /** the second line – what it means or how it is going ("Oldest in class", "And stubborn") */
  note: string
}

export interface KidLife {
  /** her play style, read as a person and never as tennis. Fixed for the career. */
  personality: KidLifeTile
  /** ⭐⭐ ROUND-23 #6 – HER LIFE STAGE, and it keeps moving after the last bell.
   *
   *  At school: her grade, on a 1-September school year, plus her place in the class by age. Moves
   *  once a year, and says "Exams this week" while the calendar is holding an exam blackout.
   *
   *  ⚠ IT USED TO SAY "School finished" FOR THE REMAINING TWENTY SEASONS. The owner: «Что можем
   *  вместо school finished на личной странице написать? Может быть разное что-то там можно
   *  отображать в течение взросления?» So past the last grade it walks a ladder – the year she left,
   *  the years tennis is the whole week, and the grown woman from 22 – and the college years take it
   *  over when she is on a scholarship (`engine/kidLife.ts afterSchoolTile`). */
  school: KidLifeTile
  /** ⭐ ROUND-23 #6 – WHAT THE CELL IS CALLED, which is a fact about her life and not a caption:
   *  "School", then "College", then "After school". A grid cell still headed School above "Year 2 of
   *  4" would be the same frozen tense the tile itself just lost. */
  schoolLabel: string
  /** ⭐ ROUND-21 #6 – WHY SHE IS STILL AT SCHOOL WHEN HER TENNIS YEAR HAS LEFT, or '' when there is
   *  nothing to explain.
   *
   *  ⚠ IT IS NOT A THIRD TILE LINE AND CANNOT BE. Both lines above are `white-space: nowrap` inside a
   *  115px cell on a 17-character budget (`TILE_LINE_MAX`); this is a sentence, so it renders under
   *  the grid, directly below the School tile it names. The owner's report is why it exists at all:
   *  «Если день рождения в декабре, то вся школа уже закончилась и в сентябре вроде бы её быть не
   *  должно» – measured last round and CORRECT, because the ITF band is one birth YEAR while the
   *  school year turns on 1 September, so a December girl sits her final school year in a September
   *  her own age group has already left. He ruled the cut-off STAYS; what was missing is that nothing
   *  on screen said so, and unexplained correct behaviour reads exactly like a bug. */
  schoolWhy: string
  /** ⭐⭐ ROUND-23 #6b – THE COLLEGE SENTENCE, or '' for a career that never took the place.
   *
   *  The owner asked for something to say «про колледж и его окончание (если пошла и закончила
   *  конечно)» and picked the shape that names the campus: one line for the whole course, another
   *  once it is over. There are THREE states behind it and not two – `resumeFromCollege` spends the
   *  four years one at a time and `endCollegeEarly` is a real answer at each boundary – so a course
   *  that stopped short says so rather than borrowing the graduate's line.
   *
   *  ⚠ A SENTENCE, FOR `schoolWhy`'S REASON: every college place is longer than the 16-character
   *  `nowrap` cell, so the tile carries the year and this carries the place. The two notes are
   *  mutually exclusive by construction (one speaks only at school, the other only once she is out). */
  collegeNote: string
  /** ⭐⭐ ROUND-23 #18 – HER OWN BANK BALANCE and the share that fills it, or '' before eighteen.
   *
   *  The only surface that tells a player the ramp exists: what the account holds, what she keeps of
   *  every cheque today, and where that stops. Every figure is read from `ECONOMY.kidShare` through
   *  `kidPrizeShareBps` – the same function the till divides by – so it cannot promise a percentage
   *  the engine is not transferring. */
  ownAccount: string
  /** who she is closest to this school year, and how that is going this week. Deterministic
   *  (purpose-scoped sub-streams, never Math.random), and it moves with both clocks. */
  friends: KidLifeTile
}

// --- the skills radar (docs/specs/skills-radar.md, decisions.md #11) ----------
// ONE AXIS OF THE FOG-OF-WAR CONTOUR, and the whole of what the UI is ever told about her build.
// NOT ONE FIELD HERE IS A TRUE VALUE: `shownValue` is an estimate that is deliberately wrong while
// she is undiscovered, and the two ceiling edges are a haze over a `potential` the screen never
// receives. A surface cannot leak what it has never been given.
//
// Derived at snapshot time by engine/radar.ts, exactly like `coachMarket` – it persists nothing and
// bumps no schema. Every number is on the SAME 0..100 axis the four attributes live on.

export interface RadarAxis {
  /** which attribute – the engine's own `SkillKey`, in `SKILL_KEYS` order */
  key: SkillKey
  /** THE ESTIMATE, 0..100. At low confidence it is deliberately wrong, and wrong in a direction
   *  that is FIXED for the career (drawn once off `seed:read:<axis>`), so the contour converges
   *  instead of breathing week to week. */
  shownValue: number
  /** WHERE SHE BEGAN, 0..100 – the same estimate of her WEEK-ONE build, displaced by the same
   *  misreading (`engine/radar.ts`, `readAs`), so the true starting value is inside
   *  [startValue - band, startValue + band] exactly as `shownValue` is inside its own.
   *
   *  ⚠ THE RADAR USED TO DRAW ONLY THE GAP THAT WAS LEFT, and on a live career that is a verdict.
   *  Owner, 11.08: «на розе как раз показывать "старт" – т.е. с чего начала, может быть так будет
   *  приятнее и нагляднее». Measured on his own save at seventeen, her return had gone 50.7 -> 62.8
   *  and the chart said nothing whatever about it. It carries NO number and needs no storage: the
   *  starting build is a pure function of the seed and the profile, derived at snapshot time like
   *  everything else in this block. */
  startValue: number
  /** THE FOG: how far the estimate may be from the truth, in the same points. The true value is
   *  ALWAYS inside [shownValue - band, shownValue + band] – the band is an honest claim, not a
   *  decoration. 0 = fully discovered; `RADAR_BAND_MAX` (12) = she is a stranger. */
  band: number
  /** THE OUTER HAZE over her ceiling. The true potential always lies at or below `ceilingHi`; the
   *  width narrows with confidence toward a FLOOR (`CEILING_FLOOR_HALF`) and stops there, and the
   *  midpoint is deliberately off-centre – you learn the range, never the number. `ceilingLo` is
   *  never drawn below `shownValue` (a ceiling under where she already stands is incoherent). */
  ceilingLo: number
  ceilingHi: number
  /** the coach's sentence about this axis, or null when he has nothing to say yet. Words only –
   *  no numbers, ever (decisions.md #11: "axes without numbers"). */
  note: string | null
}

/** WHAT MOVED THIS WEEK, for the Weekly Story's Training card (screen D) – or null on a week with
 *  nothing worth saying, which is most of them.
 *
 *  ⚠ THIS IS THE SHAPE THAT EXISTS INSTEAD OF SKILL DELTAS, and the reason is the radar's, not the
 *  card's. Design D lists "Serve +8%"; a Snapshot that carried that number every week would let a
 *  player sum it from week one and reconstruct her exact build, and the fog above would be
 *  decoration. So the engine does the reading and hands over the RESULT: a wing, and a sentence.
 *  There is no number on this object and there must never be one – see engine/radar.ts
 *  (`buildTrainingRead`) for the four things that keep it from being a delta channel in prose. */
export interface TrainingRead {
  /** which wing the line is about, or null when the line is about the fog rather than about her */
  key: SkillKey | null
  /** the engine's own word for that wing (`RADAR_AXIS_LABEL`), so `ret` never reaches a player as
   *  "Ret". Null on a fog line. */
  label: string | null
  /** the coach's sentence – words only, never a digit and never an arrow with a value */
  text: string
}
