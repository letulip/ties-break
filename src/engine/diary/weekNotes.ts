// THE ORDINARY WEEK GETS THE SAME SCRAP AND THE SAME HAND (W2): the notes for a week with no
// tournament in it, so a training week stops being a week that merely skips.
//
// ⚠ A DATA TABLE, same argument as diary/travelNotes.ts: ~430 of these lines are the pool itself.
//
// ⚠ DEPENDENCY DIRECTION. Reads diary/words.ts and the protocol's facts shape; never diary.ts.
//
// ⚠ RNG: `weekNoteFor` picks on a PURPOSE-SCOPED sub-stream from the passed seed, never MAIN. The
// note is also RATIONED (WEEK_NOTE_CHANCE) - a quiet week that says nothing is the point.
import { rngFromSeed } from '../rng'
import { bodyGroupOf, bodyPartOf, type BodyGroup } from '../body'
import { BIRTHDAY_DAY_NOUN, type DiaryFacts } from '../../shared/protocol'
import { ageWord, capitalise } from './words'

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
export const athome = (f: DiaryFacts): boolean =>
  !f.playedTournament && !f.travelled && f.travelHomeScene === null

/** An ordinary training week: at home, healthy, and the calendar is holding nothing.
 *
 *  ⚠ W4 ADDED `knockChoice === null`, AND IT IS AN HONESTY FIX, NOT A TIDY-UP. The grind band says
 *  things like "Six days on court. She ate like someone twice her size." – a sentence that is FALSE
 *  on a week she spent resting a sore ankle, and the pin in tests/diary.test.ts sweeps exactly this
 *  space. A week under a knock is no longer an ordinary week: it has its own band below, the way an
 *  exam week and a layoff do. */

/** W6c: WHERE HER LIVE INJURY IS, as the pool is allowed to ask. Null when she is healthy, and null
 *  when the part cannot be resolved from the persisted `kind` string - both mean the same thing to a
 *  line that wants to describe her body, which is "say nothing about it". */
export const injuredGroup = (f: DiaryFacts): BodyGroup | null =>
  f.injured === null ? null : bodyGroupOf(f.injured.kind)

/** ...and the part, to name it. The fallback is UNREACHABLE IN SHIPPED COPY by construction: every
 *  template that calls this is licensed on `injuredGroup(f) !== null`, and a resolved group implies a
 *  resolved part. It exists so `renderAll` in the test can resolve every template in the pool against
 *  one fixture without throwing, which is how the voice and length guards read the real sentences. */
export const injuredPart = (f: DiaryFacts): string =>
  (f.injured === null ? null : bodyPartOf(f.injured.kind)) ?? 'injury'

export const plainTraining = (f: DiaryFacts): boolean =>
  athome(f) &&
  f.injured === null &&
  f.knockChoice === null &&
  !f.examsWeek &&
  !f.offSeasonWeek &&
  !f.vacationWeek &&
  !f.playedPractice

/** Narrative distance only. `athome` means "not travelling"; it never proves that a grown woman
 *  spent the week in her parents' house. */
const familyHomeVoice = (f: DiaryFacts): boolean =>
  f.lifeStage === 'school' || f.lifeStage === 'after-school'
const independentVoice = (f: DiaryFacts): boolean => f.lifeStage === 'independent'

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
    license: (f) => plainTraining(f) && familyHomeVoice(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'She fell asleep on the sofa with her shoes on. Twice.',
    claims: { grind: true, tired: true, athome: true },
    license: (f) => plainTraining(f) && familyHomeVoice(f) && f.trainPct >= WEEK_NOTE_GRIND && f.conditionBand !== 'fresh' && f.conditionBand !== 'ok',
  },
  {
    text: 'Three shirts a day this week. The machine has not stopped.',
    claims: { grind: true, athome: true },
    license: (f) => plainTraining(f) && familyHomeVoice(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'She asked for an extra hour on Sunday. We said no. She went anyway.',
    claims: { grind: true, athome: true },
    license: (f) => plainTraining(f) && familyHomeVoice(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'A blister on her serving hand. She taped it and said nothing.',
    claims: { grind: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'Three voice notes this week, all sent after dark.',
    claims: { grind: true, athome: true },
    license: (f) => plainTraining(f) && independentVoice(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'She asked about Sunday. By the time we replied, she had booked the court.',
    claims: { grind: true, athome: true },
    license: (f) => plainTraining(f) && independentVoice(f) && f.trainPct >= WEEK_NOTE_GRIND,
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
    license: (f) => plainTraining(f) && f.ageYears === 15 && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'Light week. She and the neighbour argued about a film for an hour.',
    claims: { light: true, athome: true },
    license: (f) => plainTraining(f) && familyHomeVoice(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'Rest days, and she was restless by the second one.',
    claims: { light: true, athome: true },
    license: (f) => plainTraining(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'A light week. She called before nine, which is how we knew she was bored.',
    claims: { light: true, athome: true },
    license: (f) => plainTraining(f) && independentVoice(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  // --- THE MIDDLE, AND ANY TRAINING WEEK AT ALL -------------------------------------------------
  // Licensed on the plain training week alone, so the long stretches at Balanced are not four
  // sentences deep. Nothing here mentions how hard the week was, because that is the one thing
  // these do not know.
  // ROUND-18 #9: the school half of an ordinary week has to stop when school does – see the note on
  // `DiaryFacts.schoolOver`. `plainTraining` already excludes exam weeks, which is what hid this:
  // no exams past eighteen, but the drills-and-dinner week runs for the rest of her career.
  {
    text: 'Drills, school, dinner, bed. She did not complain once.',
    claims: { athome: true },
    license: (f) => plainTraining(f) && !f.schoolOver,
  },
  {
    text: 'Drills, dinner, bed. She did not complain once.',
    claims: { athome: true },
    license: (f) => plainTraining(f) && f.lifeStage === 'after-school',
  },
  {
    text: 'Training, physio, groceries, sleep. Her own little circuit.',
    claims: { athome: true },
    license: (f) => plainTraining(f) && independentVoice(f),
  },
  {
    text: 'Same courts, same hours. She is getting quietly better at this.',
    claims: { athome: true },
    license: plainTraining,
  },
  {
    text: 'She practised her toss against the garage door until it got dark.',
    claims: { athome: true },
    license: (f) => plainTraining(f) && familyHomeVoice(f),
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
    license: (f) => plainTraining(f) && familyHomeVoice(f),
  },
  {
    text: 'Rain all week. She hit against the wall in the car park instead.',
    claims: { athome: true },
    license: plainTraining,
  },
  {
    text: 'A photo of the new strings. No caption; apparently none was needed.',
    claims: { athome: true },
    license: (f) => plainTraining(f) && independentVoice(f),
  },
  {
    text: 'She called after practice and talked about everything except practice.',
    claims: { athome: true },
    license: (f) => plainTraining(f) && independentVoice(f),
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
    text: 'She offered to drop a session. We found something else to cut.',
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
    license: (f) => athome(f) && familyHomeVoice(f) && f.offSeasonWeek && !f.vacationWeek && f.injured === null,
  },
  {
    text: 'December. She is teaching her cousin to serve, badly.',
    claims: { offSeason: true, athome: true },
    license: (f) => athome(f) && f.offSeasonWeek && !f.vacationWeek && f.injured === null,
  },
  {
    text: 'Off-season. She came over without the racquet bag. We noticed.',
    claims: { offSeason: true, athome: true },
    license: (f) => athome(f) && independentVoice(f) && f.offSeasonWeek && !f.vacationWeek && f.injured === null,
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
    license: (f) => athome(f) && familyHomeVoice(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: (f) => `Ice, stretching, no court. The ${f.knockPart} is quieter than it was.`,
    claims: { restingKnock: true, athome: true },
    license: (f) => athome(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: 'She asked twice if she could go in for an hour. Twice we said no.',
    claims: { restingKnock: true, athome: true },
    license: (f) => athome(f) && familyHomeVoice(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: 'Rest week. She asked the physio twice. The answer stayed no.',
    claims: { restingKnock: true, athome: true },
    license: (f) => athome(f) && independentVoice(f) && f.injured === null && f.knockChoice === 'rest',
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
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. She cut the first slice too large.`,
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && familyHomeVoice(f) && f.birthdayAge !== null && f.injured === null,
  },
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. She says nothing feels different.`,
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && familyHomeVoice(f) && f.birthdayAge !== null && f.injured === null,
  },
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. We worked around her calendar for once.`,
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && independentVoice(f) && f.birthdayAge !== null && f.injured === null,
  },
  {
    text: 'Her birthday. She chose the time; we kept the cake ready.',
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && independentVoice(f) && f.birthdayAge !== null && f.injured === null,
  },
  // =============================================================================================
  // ⭐ v48 – AND WHAT HE GAVE HER. docs/specs/birthday-and-gifts.md §2b: «the DIARY reads it
  // immediately, which is the whole visible payoff today – and it can call back in later years».
  // =============================================================================================
  //
  // ⚠ FOUR ARMS, AND THEY ARE THE FOUR THINGS THAT CAN HAVE HAPPENED, which is exactly the outcome
  // split the record was shaped to buy (spec §2ab): she got what she was asking for, she got
  // something else, she got the day, or she has been given this same thing before. "Gave the wrong
  // thing" and "gave nothing" are not the same act and a parent knows it – so no line here says
  // "nothing", because the fourth option is a DAY and the copy has to treat it as the present it is.
  //
  // ⚠ THEY LICENSE OFF `birthdayGift`, WHICH IS NULL UNTIL HE ANSWERS. So the birthday week's scrap
  // reads as one of the four above while the dialog is up and gains the present the moment he
  // chooses – the same week reading back richer, rather than a second entry about the same day.
  //
  // ⚠ AND NOTHING HERE PRICES ANYTHING. The owner: «про цену момент, давай не будем это учитывать в
  // нашем кошельке вообще.» There is no number to print, and a diary that admired an expensive
  // present would put the wealth gate back through the one door §0 could not close from the engine.
  // ⚠ AND THEY FIT ON THE SCRAP – 80 characters, RENDERED WITH THE LONGEST NOUN THE CATALOGUE HOLDS
  // ("the one thing she would not buy", 31). The first draft of these four blew the budget by up to
  // 28 characters and the guard did not catch it, because `renderAll` was building facts with
  // `birthdayGift: null` and measuring the string "null". Two fixes, and both were needed: the lines
  // are shorter, and the builder in tests/week-notes.test.ts now supplies a worst-case noun so the
  // budget is measured on what the player actually reads. The catalogue's three longest nouns were
  // shortened in the same pass, which is why 31 is the number.
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))}. ${capitalise(f.birthdayGift ?? '')}, and a smile she tried to hide.`,
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && f.birthdayAge !== null && f.injured === null &&
      f.birthdayGift !== null && f.birthdayWanted && f.birthdayRepeatAge === null && f.birthdayGift !== BIRTHDAY_DAY_NOUN,
  },
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))}. ${capitalise(f.birthdayGift ?? '')}. A pause, then a very good thank-you.`,
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && f.birthdayAge !== null && f.injured === null &&
      f.birthdayGift !== null && !f.birthdayWanted && f.birthdayRepeatAge === null && f.birthdayGift !== BIRTHDAY_DAY_NOUN,
  },
  // THE DAY, and it gets its own arm because it is the one answer that is not a thing. It must read
  // as one of the good choices or the scene collapses into a menu with a correct order (spec §0).
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. She left the day blank, so we took it slowly.`,
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && f.birthdayAge !== null && f.injured === null && f.birthdayGift === BIRTHDAY_DAY_NOUN,
  },
  // ⭐ THE CALLBACK, and it is the line this whole slice was built to be able to write.
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))}. ${capitalise(f.birthdayGift ?? '')} again – a tradition since ${f.birthdayRepeatAge}.`,
    claims: { birthday: true, athome: true },
    license: (f) => athome(f) && f.birthdayAge !== null && f.injured === null && f.birthdayRepeatAge !== null,
  },
  // ...and the same week with a brace on it. Both facts, one sentence each.
  {
    // ⚠ NOT "with her leg up", WHICH IS WHAT I WROTE AND WHAT W6c's SWEEP CAUGHT WITHIN THE MINUTE - on a
    // wrist strain. The owner found that class of error by reading; the guard found this one before it
    // shipped, which is the whole return on having written it. A birthday line has no business naming a
    // body part in the first place.
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. Candles, a brace, and very bad timing.`,
    claims: { birthday: true, injured: true, athome: true },
    license: (f) => athome(f) && familyHomeVoice(f) && f.birthdayAge !== null && f.injured !== null,
  },
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. The physio got the first call; we got the second.`,
    claims: { birthday: true, injured: true, athome: true },
    license: (f) => athome(f) && independentVoice(f) && f.birthdayAge !== null && f.injured !== null,
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
    license: (f) => athome(f) && f.lifeStage === 'school' && f.injured !== null && !f.examsWeek,
  },
  {
    text: 'The physio says it is going well. She wanted a second opinion.',
    claims: { injured: true, athome: true },
    license: (f) => athome(f) && f.injured !== null && !f.examsWeek,
  },
  {
    text: 'A photo from rehab: three bands, one coffee, no patience.',
    claims: { injured: true, athome: true },
    license: (f) => athome(f) && independentVoice(f) && f.injured !== null && !f.examsWeek,
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
