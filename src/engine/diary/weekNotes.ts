// THE ORDINARY WEEK GETS THE SAME SCRAP AND THE SAME HAND (W2): the notes for a week with no
// tournament in it, so a training week stops being a week that merely skips.
//
// ⚠ A DATA TABLE, same argument as diary/travelNotes.ts: ~500 of these lines are the pool itself.
//
// ⚠ DEPENDENCY DIRECTION. Reads diary/words.ts and the protocol's facts shape; never diary.ts.
//
// ⚠ RNG: `weekNoteFor` picks on a PURPOSE-SCOPED sub-stream from the passed seed, never MAIN. The
// note is also RATIONED (WEEK_NOTE_CHANCE) - a quiet week that says nothing is the point.
import { rngFromSeed } from '../rng'
import { bodyGroupOf, bodyPartOf, type BodyGroup } from '../body'
// ⭐ R2-09: the noun moved to an engine leaf; the FACTS shape is still the wire's (see the cycle
// note in world/birthdayGift.ts – this module is inside world/birthday.ts's own import closure).
import { BIRTHDAY_DAY_NOUN } from '../world/birthdayGift'
import type { DiaryFacts, DiaryLifeStage, MoodRegister } from '../../shared/protocol'
// ⭐ v72: who she is, type-only – the four ids and their physics live in engine/spirit.ts.
import type { Temperament } from '../spirit'
import { ageWord, capitalise, familyHomeVoice, independentVoice, underOneRoof } from './words'

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
  /** asserts NO TOURNAMENT AND NO JOURNEY this week, and nothing beyond that.
   *
   *  ⚠⚠ R2-18 – IT WAS CALLED `athome` AND THE NAME WAS THE DEFECT. Its docstring said "she was at
   *  home this week" while the predicate says only "she did not travel", and the two are the same
   *  sentence for a fifteen-year-old and different sentences for a woman of thirty with a flat of
   *  her own. A licence named for a house is one an author reaches for when writing about a house,
   *  so adult lines came to describe the hall mirror and the television on the strength of a TRAVEL
   *  fact. The claim that licenses a house is `domestic`, below, and it is a different question. */
  notTravellingWeek?: true
  /** ⚠⚠ THE KNOWLEDGE LICENCE (R2-18 / PROD-10). Asserts THE PARENT WAS THERE TO SEE IT: the line
   *  describes her day at close range – the hall, the television, the floor, her counting reps out
   *  loud – which only a parent sharing the house can honestly write.
   *
   *  Every line carrying it is licensed on `underOneRoof` (words.ts), and the honesty pin re-derives
   *  the same thing from `lifeStage` independently, so a domestic line that reaches a college or
   *  independent week is a failing test rather than a sentence somebody has to notice. The canonical
   *  rule it enforces: from 22 her ordinary life reaches the parent through calls, messages and
   *  visits, so a note that watches her do rehab in the hall is the game claiming to be somewhere it
   *  is not. */
  domestic?: true
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
  // ===============================================================================================
  // ⭐⭐ v72 (THE PRIVATE LIFE, WAVE 1) – THE THREE CLAIMS HER OWN VOICE NEEDS
  // ===============================================================================================
  //
  // who-she-is §5b's composition rule, as three claims rather than three pools: TEMPERAMENT owns the
  // SHAPE of a line, SPIRIT the REGISTER of the moment, BOND the CHANNEL it arrives through. They
  // compose, so eleven spoken moments cost 52 lines instead of 4 × 3 × 4 = 528.
  /** ⚠ ASSERTS THE LINE IS IN *HER* VOICE – the second valued claim on this pool, after `bodyGroup`,
   *  and for the same reason: "sounds like her" is not one thing to assert, it is four mutually
   *  exclusive ones. A `fiery` girl's storm handed to a `quiet` girl is not a style slip, it is the
   *  game telling the player he has a different daughter. Unselectable unless `f.temperament` is
   *  this id, and the honesty pin re-derives that off the facts. */
  voice?: Temperament
  /** ⚠ ASSERTS THE SPIRIT REGISTER THE LINE IS WRITTEN AT, and the three values do NOT all mean
   *  "equals": `'bright'` and `'low'` assert exactly themselves, while `'level'` asserts **not a low
   *  week** – which is the approved doc's own definition of the level variant («the one variant that
   *  is not a low week», voice-bibles §D preamble). A line at `level` says nothing about whether her
   *  week was ordinary or good; it says only that it was not a bad one, which is all its words rest
   *  on. The honesty pin re-derives each of the three separately. */
  register?: MoodRegister
  /** ⚠ ASSERTS WHICH STAGE DICTIONARY THE WORDS ARE WRITTEN IN (wave B, the 11.09 four-stage
   *  ruling: the two rails collapsed a fourteen-year-old and a thirty-year-old into one adult, the
   *  second editorial review's exact finding). The value is the stage itself – school (today, the
   *  court, the bus, dinner), after-school (the season, the weeks, still home), college (campus,
   *  the term, a call home), independent (her own schedule, a peer's channel) – and a line is
   *  licensed on EXACTLY that stage, never a band of them. Valued, like `voice`, and for the same
   *  reason: «sounds her age» is four mutually exclusive things, and a table-side line reaching a
   *  college week would be the game sharing a house it does not share. The honesty pin re-derives
   *  it off `f.lifeStage` independently.
   *
   *  ⚠ THE STAGE OWNS DICTION AND SCALE, NOT PRESENCE (the 11.09 doc review's finding 3, taken):
   *  at the two roof stages cohabitation licenses household observation, but at college and
   *  independent the stage only restricts the AVAILABLE frames – every away line must carry its
   *  own delivery frame (a call, a text, a forwarded plan, a named visit), because the stage
   *  cannot prove the parent saw the week. */
  rail?: DiaryLifeStage
  /** ⚠ ASSERTS SHE IS CLOSE ENOUGH TO SPEAK IN HER OWN VOICE – `close` OR `steady`, the two bands
   *  who-she-is §5b lets her voice through, and NOT «her bond is 80+».
   *
   *  ⚠⚠ THE NAME IS THE DOC'S AND THE PREDICATE IS THE DESIGN'S, so it is spelled out here rather
   *  than inferred from the word: what a warm line rests on is that the channel is open, and the
   *  channel is open on both warm bands. The claim it is the opposite of is `strainedBond`, and the
   *  pair exists so a warm line cannot fire in a cold week (voice-bibles §D, the OWED table). */
  closeBond?: true
  /** ⚠ ASSERTS THE WALLS ARE UP – `strained` exactly, which is the ONE band the shared flat pool is
   *  licensed on. `cold` is not a band with a quieter line in it: tier 0 is «rare at strained;
   *  ABSENT at cold» (who-she-is §5b's tier table), so a cold week has no quoted line at all and the
   *  parent's own sentence stands alone under the painting. That is the third rung of the ladder and
   *  it is the loss the player is meant to hear. */
  strainedBond?: true
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

/** Nothing competitive happened and she went nowhere – the weeks this pool is for. Note this is
 *  WIDER than `quiet` above: an exam week, a holiday and a layoff are all weeks with a note here,
 *  and `quiet` deliberately excludes them.
 *
 *  ⚠⚠ IT SAYS NOTHING ABOUT WHERE SHE SLEPT, and that is why it stopped being called `athome`
 *  (R2-18). A twenty-nine-year-old on tour has fifteen of these a year and spends none of them in
 *  her parents' kitchen. `underOneRoof` is the question about the house; this is the question about
 *  the calendar, and a line that needs both has to ask for both. */
export const notTravellingWeek = (f: DiaryFacts): boolean =>
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

// --- v72: the three questions her own voice asks, one function each ---------------------------
//
// ⚠ SAME DOCTRINE AS `underOneRoof` NEXT DOOR: a predicate per question, written once, so the
// fifty-two lines below cannot each carry their own spelling of "is she talking to us this week".

/** THE CHANNEL. She is close enough to speak in her own voice – `close` or `steady`. */
export const inHerVoice = (f: DiaryFacts): boolean =>
  f.bondBand === 'close' || f.bondBand === 'steady'

/** ...and the band where the four voices collapse into the shared flat pool. `cold` is deliberately
 *  NOT here: at `cold` there is no tier-0 line at all (who-she-is §5b's tier table). */
export const wallsUp = (f: DiaryFacts): boolean => f.bondBand === 'strained'

/** THE SHAPE. Her voice AND the channel, which is what every one of the 44 voiced lines needs. */
export const voiceOf = (t: Temperament) => (f: DiaryFacts): boolean =>
  f.temperament === t && inHerVoice(f)

/** THE REGISTER, in the three spellings the claim uses – see `WeekClaims.register` for why `level`
 *  is "not low" rather than "exactly level". */
export const brightWeek = (f: DiaryFacts): boolean => f.moodRegister === 'bright'
export const levelWeek = (f: DiaryFacts): boolean => f.moodRegister !== 'low'
export const lowWeek = (f: DiaryFacts): boolean => f.moodRegister === 'low'

export const plainTraining = (f: DiaryFacts): boolean =>
  notTravellingWeek(f) &&
  f.injured === null &&
  f.knockChoice === null &&
  !f.examsWeek &&
  !f.offSeasonWeek &&
  !f.vacationWeek &&
  !f.playedPractice

// ⚠ R2-18: THE WARNING THAT USED TO SIT HERE IS NOW A FUNCTION. It read "Narrative distance only.
// `notTravellingWeek` means 'not travelling'; it never proves that a grown woman spent the week in her parents'
// house." – true, correctly worried, and enforced by nothing, which is how the lines below came to
// license household observation off a travel fact. The predicates live in `words.ts` now and the
// missing one, `underOneRoof`, is the sentence that paragraph was reaching for.

// =================================================================================================
// ⭐⭐⭐ v72 – THE ELEVEN SPOKEN MOMENTS, AND THE FOUR VOICES CROSSED OVER THEM
// =================================================================================================
//
// ⚠ THE LICENCE IS WRITTEN ONCE PER MOMENT AND THE WORDS ONCE PER VOICE, which is the mechanical
// half of «bond selects, register licenses, temperament shapes». Forty-four entries whose licences
// were hand-copied would be forty-four chances for a `quiet` line to be selectable on a week a
// `fiery` line is not, and the difference between two voices would quietly become a difference in
// what is TRUE of the week – which is the one failure the honesty pin exists to prevent.
//
// ⚠ AND THE CROSS IS TOTAL BY TYPE. `Record<Temperament, Record<SpokenMoment, ...>>` means a missing
// variant is a COMPILE error, not a silent hole a girl falls into – so `tests/week-notes.test.ts`'s
// completeness pin is the second net over the same mistake rather than the only one.

/** The eleven moments wave 1 gives her a line for, in the order voice-bibles §D lists them. */
type SpokenMoment =
  | 'grind'
  | 'light'
  | 'freshBody'
  | 'exams'
  | 'vacation'
  | 'restingKnock'
  | 'pushingKnock'
  | 'injured'
  | 'tired'
  | 'birthday'
  | 'offSeason'

/** What each moment asserts and when it may be spoken – the voice-neutral half of a voiced line.
 *
 *  ⚠ EVERY LICENCE HERE IS THE POOL'S EXISTING ONE FOR THAT WEEK PLUS THE REGISTER, so a voiced line
 *  can never reach a week the parent's own band for it could not. The register is what the approved
 *  doc puts on the row: `bright` for the fresh-body line, `low` for the tired one (the single moment
 *  in eleven where a low week changes the words), and `level` – "not a low week" – everywhere else. */
const MOMENTS: Record<SpokenMoment, { claims: WeekClaims; license: (f: DiaryFacts) => boolean }> = {
  grind: {
    claims: { grind: true, notTravellingWeek: true, register: 'level' },
    license: (f) => plainTraining(f) && levelWeek(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  light: {
    claims: { light: true, notTravellingWeek: true, register: 'level' },
    license: (f) => plainTraining(f) && levelWeek(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  freshBody: {
    claims: { freshBody: true, notTravellingWeek: true, register: 'bright' },
    license: (f) => plainTraining(f) && brightWeek(f) && f.conditionBand === 'fresh',
  },
  exams: {
    claims: { exams: true, notTravellingWeek: true, register: 'level' },
    license: (f) => notTravellingWeek(f) && levelWeek(f) && f.examsWeek && f.injured === null,
  },
  vacation: {
    // ⚠ NO PLACE, NO DESTINATION, NO WEATHER: `vacation` has no `WeekClaims` member for the package
    // at all, so the words may not name one – the catalogue they would be guessing at holds no lake.
    claims: { vacation: true, notTravellingWeek: true, register: 'level' },
    license: (f) => notTravellingWeek(f) && levelWeek(f) && f.vacationWeek && f.injured === null,
  },
  restingKnock: {
    claims: { restingKnock: true, notTravellingWeek: true, register: 'level' },
    license: (f) =>
      notTravellingWeek(f) && levelWeek(f) && f.injured === null && f.knockChoice === 'rest',
  },
  pushingKnock: {
    claims: { pushingKnock: true, notTravellingWeek: true, register: 'level' },
    license: (f) =>
      notTravellingWeek(f) && levelWeek(f) && f.injured === null && f.knockChoice === 'push',
  },
  injured: {
    // ⚠ DURATION-FREE, EVERY VOICE. `injured` carries `{kind, weeksRemaining, totalWeeks}`, so a
    // LENGTH may be named only through a template that reads them; none of the four does, so none of
    // them may say how long. Same `!f.examsWeek` split the parent's own layoff band keeps (W6b).
    claims: { injured: true, notTravellingWeek: true, register: 'level' },
    license: (f) => notTravellingWeek(f) && levelWeek(f) && f.injured !== null && !f.examsWeek,
  },
  tired: {
    // ⚠⚠ THIS ONE ASSERTS TWO DIFFERENT THINGS AND THEY ARE TWO DIFFERENT NUMBERS. `tired` is a BODY
    // claim (the `worn`/`drained` rungs of `conditionBand`); `low` is the SPIRIT register. Neither
    // implies the other – a drained body on a level spirit is an ordinary hard week – and slot 9 is
    // the one moment in eleven that needs both at once.
    claims: { tired: true, notTravellingWeek: true, register: 'low' },
    license: (f) =>
      plainTraining(f) &&
      lowWeek(f) &&
      (f.conditionBand === 'worn' || f.conditionBand === 'drained'),
  },
  birthday: {
    // ⚠ WIDENED TO BOTH ROOF STAGES (11.09, the four-stage ruling): the old `lifeStage === 'school'`
    // gate would have made the after-school dictionary's cell dead copy. It carries `domestic`
    // because the parent is in the house for it – which is exactly `underOneRoof`, both stages.
    // Her voiced birthday at college/independent is DEFERRED CONTENT SCOPE, not an engine truth
    // (birthdays happen all career; the parent's own away birthday lines cover those weeks) – C1,
    // the birthday-voice wave, owns that decision.
    claims: { birthday: true, domestic: true, notTravellingWeek: true, register: 'level' },
    license: (f) =>
      notTravellingWeek(f) &&
      levelWeek(f) &&
      underOneRoof(f) &&
      f.birthdayAge !== null &&
      f.injured === null,
  },
  offSeason: {
    // ⚠ THE STAGE GATE MOVED INTO THE CELLS (11.09): her voiced December exists at college and
    // independent – each cell licensed on its exact stage below – while the roof stages keep the
    // parent's own off-season lines (the bag in the cupboard, the louder house). `offSeasonWeek`
    // itself is calendar-derived at every stage; scoping her VOICE to the away stages is a content
    // decision, recorded as such. No line may COUNT the weeks: `OFF_SEASON_WEEKS` is 3 and
    // `offSeason` says only that this is one of them.
    claims: { offSeason: true, notTravellingWeek: true, register: 'level' },
    license: (f) =>
      notTravellingWeek(f) &&
      levelWeek(f) &&
      f.offSeasonWeek &&
      !f.vacationWeek &&
      f.injured === null,
  },
}

/**
 * ⭐⭐ THE HUNDRED AND FORTY-EIGHT – RE-CUT 11.09 TO THE SECOND EDITORIAL REVIEW AND THE OWNER'S
 * «4 полосы» RULING (voice-bibles, the 11.09 amendment; wave B). What moved off the 80:
 *
 * 1. ⚠⚠ FOUR STAGE DICTIONARIES, NOT TWO RAILS. The two rails collapsed a fourteen-year-old and
 *    a thirty-year-old into one adult – the review's lead finding. Every all-stage moment now
 *    carries FOUR variants per voice: school (today, the court, the bus, dinner – co-present),
 *    after-school (the season, the weeks, still under the roof), college (campus, the term, a
 *    call home – CHANNEL), independent (her own schedule, a peer's channel). Stage owns diction
 *    and scale; it does NOT prove presence – away cells each carry their own delivery frame.
 *
 * 2. NO UNLICENSED FACTS, as law: no racquet counts, no serve quality, no exam scores, no rehab
 *    start dates, no vacation booking-status or destination (the catalogue holds packages the
 *    words cannot see), no homecoming on a week `travelHomeScene === null` denies.
 *
 * 3. THE AWAY CHANNELS ARE A PALETTE (call · text · voice note · photo with a line · forwarded
 *    plan · family chat · delayed reply · a named visit): «wrote» is retired, no channel repeats
 *    on adjacent rows of a column, college and independent differ on every shared row. This is
 *    corpus discipline, not a runtime guarantee – B5 owns the real rotor.
 *
 * 4. Quiet and deep split by SUBJECT: quiet says facts and arrangements, deep says meaning,
 *    cost and consequence – re-checked cell against cell, moment by moment.
 *
 * The bibles, one line each: `sunny` volunteers the week and connects it to what she wants next;
 * `fiery` reaches the verdict before the explanation; `quiet` says the schedule instead of
 * herself; `deep` waits until she knows which part matters, then names the cost.
 */
/** The eight moments that speak at every stage – the rectangular half of the cross. Exams, the
 *  birthday and the off-season live in their own stage-scoped tables below. */
type StagedMoment = Exclude<SpokenMoment, 'exams' | 'birthday' | 'offSeason'>

/** The four stages in career order – the emission order of the cross, and the вычитка's. */
const STAGES: readonly DiaryLifeStage[] = ['school', 'after-school', 'college', 'independent']

/** Which weeks a stage's words are honest on – exact equality, written once, the same doctrine
 *  as `underOneRoof` next door. The `rail` claim carries the same fact for the honesty pin to
 *  re-derive off `f.lifeStage` independently. */
const STAGE_LICENSE: Record<DiaryLifeStage, (f: DiaryFacts) => boolean> = {
  school: (f) => f.lifeStage === 'school',
  'after-school': (f) => f.lifeStage === 'after-school',
  college: (f) => f.lifeStage === 'college',
  independent: (f) => f.lifeStage === 'independent',
}

const VOICE_LINES: Record<Temperament, Record<StagedMoment, Record<DiaryLifeStage, WeekNote['text']>>> = {
  sunny: {
    grind: {
      school: 'She said it over dinner. "Hard week, good week, and I\'d take another."',
      'after-school': 'She weighed the week up after supper. "Hard graft, all six days, worth it."',
      college: 'She called between lectures. "Hard week, the good kind. I\'d redo it."',
      independent: 'She left a voice note after dark. "Six days flat out, and I\'d take more."',
    },
    light: {
      school: 'She sorted the week at breakfast. "Two mornings free, and I\'m taking both."',
      'after-school': 'Home between weeks, she took the sofa. "Two mornings off, and I earned them."',
      college: 'She texted midweek. "Two free mornings, and I slept right through one."',
      independent: 'She sent a photo of her coffee. "Two mornings clear, and both are mine."',
    },
    freshBody: {
      school: 'She bounced out to the car. "I feel good this week. Properly good."',
      'after-school': 'She was up first all week, no alarm. "I feel strong, all of me does."',
      college: 'She left a voice note before practice. "Everything feels good today."',
      independent: 'She messaged the family chat. "Body\'s saying yes to all of it this week."',
    },
    vacation: {
      school: 'She lingered at the table all morning. "A week off, and I\'m taking all of it."',
      'after-school': 'A gap in the season, and she slowed right down. "Off. Properly off, all week."',
      college: 'She sent a photo, one line under it. "A week of nothing, and I need it."',
      independent: 'She replied a few days later. "A whole week off, and it\'s all mine."',
    },
    restingKnock: {
      school: 'She left the racquet by the door. "I\'m resting it, and that\'s fine."',
      'after-school': 'Home nursing a knock, she shrugged. "Resting it this week. I\'m okay with that."',
      college: 'She called to head off the fuss. "I\'m resting it properly, promise."',
      independent: 'She forwarded the lighter plan. "A week\'s rest, then back at it."',
    },
    pushingKnock: {
      school: 'She showed it off at dinner. "It held all week, and I was careful."',
      'after-school': 'Mid-season, she waved off the worry. "It held, and I stayed careful with it."',
      college: 'She texted after training. "It held the whole week. All good."',
      independent: 'She left a voice note after her session. "It held. I played it safe."',
    },
    injured: {
      school: 'She had the rehab sheet on the fridge by evening. "Tell me what comes first."',
      'after-school': 'She talked it through that evening. "It\'s rehab now. Where do I start?"',
      college: 'She called with the news. "It\'s rehab. Tell me the first step."',
      independent: 'She messaged once she knew. "Rehab it is. What comes first?"',
    },
    tired: {
      school: 'She went up before dessert. "This one wiped me out."',
      'after-school': 'At home, she turned in early. "That whole week emptied me right out."',
      college: 'She texted, then went quiet. "Nothing left in me tonight. Sleep first."',
      independent: 'She replied days late. "All used up this week. Back to myself soon."',
    },
  },
  fiery: {
    grind: {
      school: 'She was still in her kit at dinner. "Six days, and I\'m not done!"',
      'after-school': 'She banged in from the last session. "Best training week of the season!"',
      college: 'She left a voice note after practice. "Six days. I\'m not slowing down!"',
      independent: 'She texted at midnight. "Whole block, flat out. That\'s how I like it!"',
    },
    light: {
      school: 'She was bored by the second free day. "Two mornings off? I\'ll train!"',
      'after-school': 'She had the week planned by Monday. "Downtime? I don\'t know how!"',
      college: 'She texted from campus. "Easy week? I\'ve found a court anyway!"',
      independent: 'She left a voice note at dawn. "Day off? I\'m climbing the walls!"',
    },
    freshBody: {
      school: 'She wouldn\'t come off the court. "Everything works today! Everything!"',
      'after-school': 'She added sets nobody asked for. "I feel unstoppable. It all works!"',
      college: 'She sent a photo of the court. "It all works! Don\'t jinx it!"',
      independent: 'She rang mid-session, breathless. "I\'m flying today. Nothing hurts!"',
    },
    vacation: {
      school: 'By day two she had a ball going off her wall. "I\'m resting! See? Resting!"',
      'after-school': 'She lasted three days off before pacing. "A whole week off? Torture!"',
      college: 'She dropped it in the family chat. "A week off and I\'m going stir-crazy!"',
      independent: 'She texted on day two. "Time off? I don\'t know what to do!"',
    },
    restingKnock: {
      school: 'She asked for the court twice a day. "It\'s resting, not me! Let me play!"',
      'after-school': 'She counted the days off out loud. "I\'m not sitting more than a week!"',
      college: 'She forwarded the blank week\'s plan. "Seven days. Then I\'m back on court!"',
      independent: 'She replied a day late. "One thing\'s resting. The rest of me isn\'t!"',
    },
    pushingKnock: {
      school: 'She played through it all week. "It held! I told you it would!"',
      'after-school': 'She got through the week on it. "It held! I was careful. Mostly!"',
      college: 'She answered days later. "Held all week! On court tomorrow!"',
      independent: 'She posted it to the family chat. "It held. Never doubted it!"',
    },
    injured: {
      school: 'She argued with the diagnosis at dinner. "There\'s a faster way. Find it!"',
      'after-school': 'She refused the timeline flat. "I\'ll be back before they say. Watch!"',
      college: 'She came home from the clinic, jaw set. "Fine. New plan. Watch me!"',
      independent: 'She called straight from the clinic. "It\'s bad. I\'m coming back fast!"',
    },
    tired: {
      school: 'The kit bag stayed where she dropped it. "Empty," she said.',
      'after-school': 'She barely made it to the table. "Done in," she said.',
      college: 'She left a voice note after dark. "Wiped. Talk tomorrow."',
      independent: 'She texted, hours late. "Spent. Speak tomorrow."',
    },
  },
  quiet: {
    grind: {
      school: '"Six days on court," she said, and asked what was for dinner.',
      'after-school': 'She dropped her bag by the door. "Heavy week. All of it done."',
      college: 'She forwarded the training plan from campus. "Done, all of it."',
      independent: 'She texted after the last session. "That\'s the week done. Monday again."',
    },
    light: {
      school: '"Two mornings free," she said, and read on the bus.',
      'after-school': 'A light week in the season. "Both mornings kept," she said, and slept in.',
      college: 'She sent a photo of the quad, one line. "Slow week here."',
      independent: 'She left a voice note that evening. "Quiet week. Caught up on sleep."',
    },
    freshBody: {
      school: 'She was first out and last off the court. "Body\'s ready this week."',
      'after-school': 'She came in from court still fresh. "Nothing aching. Set for the swing."',
      college: 'She texted from the campus courts. "No niggles. Trained full."',
      independent: 'She called after the first session. "Legs are back under me."',
    },
    vacation: {
      school: 'A week with no tennis in it. "The racquet stays home," she said.',
      'after-school': 'Between blocks, she put the week aside. "Off means off this time."',
      college: 'Into the family chat she put one line. "Break this week. Reading."',
      independent: 'She answered two days later. "On a break. Nothing to schedule."',
    },
    restingKnock: {
      school: '"The court can wait," she said, and put her feet up.',
      'after-school': 'She cleared her week\'s sessions. "A week down won\'t cost the season."',
      college: 'She forwarded a lighter week\'s plan. "Resting the knock. Back soon."',
      independent: 'She texted midweek. "Off it for the week. Nothing on the calendar."',
    },
    pushingKnock: {
      school: '"Manageable," she said, and taped it before the bus.',
      'after-school': 'She taped it each morning, unasked. "Holding up. No sessions missed."',
      college: 'She sent one line under a court photo. "Strapped up, playing on."',
      independent: 'She sent a voice note after training. "Strapping held. Played the week."',
    },
    injured: {
      school: '"When does rehab start?" she asked, pen already on the calendar.',
      'after-school': 'She pinned the rehab plan by the calendar. "What\'s first, and when?"',
      college: 'She called home with the diagnosis. "Rehab\'s set. I\'ll work the plan."',
      independent: 'She forwarded the rehab schedule. "This is the plan. I\'m on it."',
    },
    tired: {
      school: '"Just tired," she said, and for once let the kettle be someone else\'s job.',
      'after-school': 'Half the dinner stayed on the plate. "Worn out. Early night," she said.',
      college: 'She texted once, near midnight. "Run down. Early nights this week."',
      independent: 'She replied days later. "Wrung out. Sleeping the week off."',
    },
  },
  deep: {
    grind: {
      school: 'She said it in the car, engine off. "A lot. But I wanted it."',
      'after-school': 'Home late, she said it from the stairs. "The season takes what it takes."',
      college: 'She called late, the week behind her. "It was a lot. I am glad it was."',
      independent: 'She answered days later. "The work asks a lot. I keep saying yes."',
    },
    light: {
      school: 'She said it at the door, half in. "Sunday was mine."',
      'after-school': 'She said it late, the house already dark. "I gave the week back to myself."',
      college: 'She replied two days later. "The empty days were the point."',
      independent: 'She called, late. "I let the week go quiet. I earned it."',
    },
    freshBody: {
      school: '"Ready," she said before the first ball. She looked it.',
      'after-school': '"I forgot it could feel like this." She said it late on Sunday.',
      college: 'She texted at midnight. "The body came back. I had missed it."',
      independent: 'She sent a late voice note. "The body feels new. That is rare now."',
    },
    vacation: {
      school: 'She said it on the last night. "I feel like myself again."',
      'after-school': 'She said it once the week was done. "I needed to stop. I did not know it."',
      college: 'She called at the end of it, not during. "It helped. I did not expect it to."',
      independent: 'She answered at the week\'s end. "I stopped. I had forgotten how."',
    },
    restingKnock: {
      school: 'On the sofa she said it. "It waits. I wait too."',
      'after-school': 'She said it once, early, and held to it. "Sitting out costs. I will pay it."',
      college: 'She sent a voice note, late. "It gets the week. I get patience."',
      independent: 'She called late that night. "It rests, or I lose more later."',
    },
    pushingKnock: {
      school: 'She said it once, Monday, then went to train. "It is holding."',
      'after-school': 'She said it with the kit still on. "It holds. I am not stopping for it."',
      college: 'She replied a day on. "It is holding. That is all I will promise."',
      independent: 'She texted, gone midnight. "Holding. I know what I am risking."',
    },
    injured: {
      school: '"How long?" she asked at the kitchen table.',
      'after-school': 'She waited for the house to sit down. "It is what it is. I do the work."',
      college: 'She called with the diagnosis herself. "It is real. I am not pretending."',
      independent: 'She answered a day late. "This is the cost of the work. I knew it."',
    },
    tired: {
      school: '"Nothing left." She said it standing in the doorway, already turned to go.',
      'after-school': 'She said it and went straight up. "The season took all of it. All of it."',
      college: 'She left it as a voice note that night. "Nothing left. There will be."',
      independent: 'She texted past midnight. "Paid for the week tonight. It comes back."',
    },
  },
}

/** The three stage-scoped moments. ⚠ EXAMS ARE SCHOOL-ONLY BECAUSE THE ENGINE IS: `isExamWeek(week,
 *  schoolOver)` is false the day school ends (diary.ts hands it `view.schoolOver`; the sweeps in
 *  tests/week-notes.test.ts refuse to model the combination as «the engine cannot produce this
 *  week»). The 11.09 amendment's «exams × 3 stages» column was corrected against this fact –
 *  college exams, if ever wanted, are a new mechanic before they are new copy. The birthday and
 *  the off-season are stage-scoped by CONTENT DECISION, recorded at their MOMENTS entries. */
const EXAM_LINES: Record<Temperament, WeekNote['text']> = {
  sunny: 'She ran it like a timetable. "Papers first, then the court. In that order."',
  fiery: 'She stacked textbooks where the racquets live. "One hour on court. One!"',
  quiet: 'She kept the desk light on late all week. "The papers are on schedule."',
  deep: 'She said it with the last paper handed in. "Done. I want the court back."',
}

const BIRTHDAY_LINES: Record<Temperament, Record<'school' | 'after-school', WeekNote['text']>> = {
  sunny: {
    school: (f) => `${capitalise(ageWord(f.birthdayAge))} today. "Save me the corner piece," she said at the table.`,
    'after-school': (f) => `${capitalise(ageWord(f.birthdayAge))} today. She had the family round. "Let's make it big."`,
  },
  fiery: {
    school: (f) => `${capitalise(ageWord(f.birthdayAge))} today. She ran the whole day. "Cake first! Questions later!"`,
    'after-school': (f) => `${capitalise(ageWord(f.birthdayAge))} today. She had the day mapped by breakfast. "Make it a big one!"`,
  },
  quiet: {
    school: (f) => `${capitalise(ageWord(f.birthdayAge))} today. "Can we keep it small?" she asked.`,
    'after-school': (f) => `${capitalise(ageWord(f.birthdayAge))} today. "Dinner in is plenty," she said, setting the table.`,
  },
  deep: {
    school: (f) => `${capitalise(ageWord(f.birthdayAge))} today. "No fuss," she said. She let the cake wait.`,
    'after-school': (f) => `${capitalise(ageWord(f.birthdayAge))} today. "Older, and further in," she said, back home late.`,
  },
}

const OFF_SEASON_LINES: Record<Temperament, Record<'college' | 'independent', WeekNote['text']>> = {
  sunny: {
    college: 'She called on a weekday morning. "No matches for a while. Glad of the break."',
    independent: 'She came over and took the kitchen. "No matches now. I\'m taking the break."',
  },
  fiery: {
    college: 'She texted mid-December. "Off-season and I\'m already itching to play!"',
    independent: 'She sent a photo and a line. "Off-season already. Send me a draw!"',
  },
  quiet: {
    college: 'She dropped one line in the family chat. "Season\'s over. Resting up now."',
    independent: 'She came by with empty hands. "All quiet now till the new year."',
  },
  deep: {
    college: 'On her way out she said it. "The season is done. I needed it to be."',
    independent: 'She called once it felt over. "Done for now. Ask me in January."',
  },
}

/** The cross: four voices × (eight staged moments × four stages + exams at school + the birthday
 *  at both roof stages + the off-season at both away ones) = 37 each, 148 lines – each taking its
 *  moment's licence AND her voice's AND its exact stage's. Total by type for the rectangle – a
 *  missing cell is a compile error before it is a test failure – and explicit maps for the scoped
 *  moments, so their smaller shape is visible rather than defaulted. */
function voicedNotes(): WeekNote[] {
  const staged = (Object.keys(VOICE_LINES) as Temperament[]).flatMap((voice) =>
    (Object.keys(VOICE_LINES[voice]) as StagedMoment[]).flatMap((moment) =>
      STAGES.map((stage) => ({
        text: VOICE_LINES[voice][moment][stage],
        claims: { ...MOMENTS[moment].claims, voice, rail: stage, closeBond: true as const },
        license: (f: DiaryFacts) =>
          voiceOf(voice)(f) && STAGE_LICENSE[stage](f) && MOMENTS[moment].license(f),
      })),
    ),
  )
  const scoped = (Object.keys(EXAM_LINES) as Temperament[]).flatMap((voice) => [
    {
      text: EXAM_LINES[voice],
      claims: { ...MOMENTS.exams.claims, voice, rail: 'school' as const, closeBond: true as const },
      license: (f: DiaryFacts) =>
        voiceOf(voice)(f) && STAGE_LICENSE.school(f) && MOMENTS.exams.license(f),
    },
    ...(['school', 'after-school'] as const).map((stage) => ({
      text: BIRTHDAY_LINES[voice][stage],
      claims: { ...MOMENTS.birthday.claims, voice, rail: stage, closeBond: true as const },
      license: (f: DiaryFacts) =>
        voiceOf(voice)(f) && STAGE_LICENSE[stage](f) && MOMENTS.birthday.license(f),
    })),
    ...(['college', 'independent'] as const).map((stage) => ({
      text: OFF_SEASON_LINES[voice][stage],
      claims: { ...MOMENTS.offSeason.claims, voice, rail: stage, closeBond: true as const },
      license: (f: DiaryFacts) =>
        voiceOf(voice)(f) && STAGE_LICENSE[stage](f) && MOMENTS.offSeason.license(f),
    })),
  ])
  return [...staged, ...scoped]
}

/** A flat-pool line on an ordinary training week – rows 1-6 of §D5. */
function flat(): Pick<WeekNote, 'claims' | 'license'> {
  return {
    claims: { notTravellingWeek: true, strainedBond: true },
    license: (f) => plainTraining(f) && wallsUp(f),
  }
}

/** ...and rows 7-8, which claim the layoff because a line selectable on an injured week must. */
function flatLayoff(): Pick<WeekNote, 'claims' | 'license'> {
  return {
    claims: { injured: true, notTravellingWeek: true, strainedBond: true },
    license: (f) => notTravellingWeek(f) && wallsUp(f) && f.injured !== null && !f.examsWeek,
  }
}

export const WEEK_NOTES: readonly WeekNote[] = [
  // --- A GRIND WEEK: what 85/15 actually looks like from the kitchen -----------------------------
  {
    text: 'Six days on court. She ate like someone twice her size.',
    claims: { grind: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'Out before we were up, back after dark. All week.',
    claims: { grind: true, notTravellingWeek: true, domestic: true },
    license: (f) => plainTraining(f) && underOneRoof(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'She fell asleep on the sofa with her shoes on. Twice.',
    claims: { grind: true, tired: true, notTravellingWeek: true, domestic: true },
    license: (f) => plainTraining(f) && underOneRoof(f) && f.trainPct >= WEEK_NOTE_GRIND && f.conditionBand !== 'fresh' && f.conditionBand !== 'ok',
  },
  {
    text: 'Three shirts a day this week. The machine has not stopped.',
    claims: { grind: true, notTravellingWeek: true, domestic: true },
    license: (f) => plainTraining(f) && underOneRoof(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'She asked for an extra hour on Sunday. We said no. She went anyway.',
    claims: { grind: true, notTravellingWeek: true, domestic: true },
    license: (f) => plainTraining(f) && underOneRoof(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'A blister on her serving hand. She taped it and said nothing.',
    claims: { grind: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'Three voice notes this week, all sent after dark.',
    claims: { grind: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && independentVoice(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  {
    text: 'She asked about Sunday. By the time we replied, she had booked the court.',
    claims: { grind: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && independentVoice(f) && f.trainPct >= WEEK_NOTE_GRIND,
  },
  // --- A LIGHT WEEK: the slack he gave back, and what she did with it ----------------------------
  {
    text: 'Two mornings off. She spent both of them at the courts anyway.',
    claims: { light: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'A slow week. She baked something and it was mostly edible.',
    claims: { light: true, notTravellingWeek: true, domestic: true },
    license: (f) => underOneRoof(f) && plainTraining(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    // R2-18: the baking line above needs somebody to have tasted it. This one does not.
    text: 'A light week, and she filled the gaps with things that are not tennis.',
    claims: { light: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'She had time to be fifteen this week. It suited her.',
    claims: { light: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && f.ageYears === 15 && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'Light week. She and the neighbour argued about a film for an hour.',
    claims: { light: true, notTravellingWeek: true, domestic: true },
    license: (f) => plainTraining(f) && underOneRoof(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'Rest days, and she was restless by the second one.',
    claims: { light: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  {
    text: 'A light week. She called before nine, which is how we knew she was bored.',
    claims: { light: true, notTravellingWeek: true },
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
    claims: { notTravellingWeek: true, domestic: true },
    license: (f) => underOneRoof(f) && plainTraining(f) && !f.schoolOver,
  },
  {
    text: 'Drills, dinner, bed. She did not complain once.',
    claims: { notTravellingWeek: true, domestic: true },
    license: (f) => underOneRoof(f) && plainTraining(f) && f.lifeStage === 'after-school',
  },
  {
    text: 'Training, physio, groceries, sleep. Her own little circuit.',
    claims: { notTravellingWeek: true },
    license: (f) => plainTraining(f) && independentVoice(f),
  },
  {
    text: 'Same courts, same hours. She is getting quietly better at this.',
    claims: { notTravellingWeek: true },
    license: plainTraining,
  },
  {
    text: 'She practised her toss against the garage door until it got dark.',
    claims: { notTravellingWeek: true, domestic: true },
    license: (f) => plainTraining(f) && underOneRoof(f),
  },
  {
    text: 'A week of nothing much. She read a whole book on the bus.',
    claims: { notTravellingWeek: true },
    license: plainTraining,
  },
  {
    text: 'She has started keeping a notebook of what the coach says.',
    claims: { notTravellingWeek: true },
    license: plainTraining,
  },
  {
    text: 'New strings, an old grip she refuses to change. Superstition.',
    claims: { notTravellingWeek: true },
    license: plainTraining,
  },
  {
    text: 'She watched a match on her phone at the table and forgot to eat.',
    claims: { notTravellingWeek: true, domestic: true },
    license: (f) => plainTraining(f) && underOneRoof(f),
  },
  {
    text: 'Rain all week. She hit against the wall in the car park instead.',
    claims: { notTravellingWeek: true },
    license: plainTraining,
  },
  {
    text: 'A photo of the new strings. No caption; apparently none was needed.',
    claims: { notTravellingWeek: true },
    license: (f) => plainTraining(f) && independentVoice(f),
  },
  {
    text: 'She called after practice and talked about everything except practice.',
    claims: { notTravellingWeek: true },
    license: (f) => plainTraining(f) && independentVoice(f),
  },
  // --- HER BODY, on a week nothing else is the story --------------------------------------------
  {
    text: 'She is running on empty and pretending she is not.',
    claims: { tired: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && f.conditionBand === 'drained',
  },
  {
    text: 'Ice on her knee in front of the television. Not a word about it.',
    claims: { tired: true, notTravellingWeek: true, domestic: true },
    license: (f) => underOneRoof(f) && plainTraining(f) && f.conditionBand === 'drained',
  },
  {
    // ⚠ R2-18: THE STAGE-NEUTRAL HALF OF THE DRAINED BAND. Its sibling above watches her put ice on
    // a knee in front of OUR television, which is a sentence only a parent in the same house can
    // write; a woman of thirty has this week too, and the band would otherwise be a pool of one for
    // her. This one is true down a phone line, which is where her ordinary week reaches him from.
    text: 'She is answering in single words this week. That is the tell.',
    claims: { tired: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && f.conditionBand === 'drained',
  },
  {
    text: 'She has her legs back. It shows in the way she walks.',
    claims: { freshBody: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && f.conditionBand === 'fresh',
  },
  // --- MONEY, which is a training-week subject if ever there was one ----------------------------
  {
    text: 'We went through the coaching bill twice. It said the same thing both times.',
    claims: { fundsTight: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && f.fundsPressure === 'tight',
  },
  {
    text: 'She offered to drop a session. We found something else to cut.',
    claims: { fundsTight: true, notTravellingWeek: true },
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
    claims: { exams: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'Revision at the kitchen table until eleven. Tennis got the mornings.',
    claims: { exams: true, notTravellingWeek: true, domestic: true },
    license: (f) => underOneRoof(f) && notTravellingWeek(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'She revised with the television on and somehow it worked.',
    claims: { exams: true, notTravellingWeek: true, domestic: true },
    license: (f) => underOneRoof(f) && notTravellingWeek(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'Two sessions all week instead of five. The rest of it was papers.',
    claims: { exams: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'A week away as a family. Nobody mentioned rankings once.',
    claims: { vacation: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.vacationWeek && f.injured === null,
  },
  {
    // ⚠ W5 REWROTE THIS LINE, and the trace is what found it. It read «She swam every day and came back
    // with a line across her nose.» – water, which three of the six packages do not have (a campsite, a
    // village at her grandmother's, friends at home). It was invisible while the picture on a holiday
    // week was the generic off-season frame; now the frame is that package's own painting, so W50 of the
    // live trace showed hens by a village wall over a sentence about swimming. The band knows THAT she
    // was away, not WHERE – so the copy may not either.
    text: 'A week off the court. She came back browner, and louder at dinner.',
    claims: { vacation: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.vacationWeek && f.injured === null,
  },
  {
    text: 'Seven days, no drills. She did not ask about the calendar once.',
    claims: { vacation: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.vacationWeek && f.injured === null,
  },
  {
    text: 'The season is over. She slept until nine and it was glorious.',
    claims: { offSeason: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.offSeasonWeek && !f.vacationWeek && f.injured === null,
  },
  {
    text: 'Off-season. The bag is in the cupboard and the house is louder.',
    claims: { offSeason: true, notTravellingWeek: true, domestic: true },
    license: (f) => notTravellingWeek(f) && underOneRoof(f) && f.offSeasonWeek && !f.vacationWeek && f.injured === null,
  },
  {
    text: 'December. She is teaching her cousin to serve, badly.',
    claims: { offSeason: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.offSeasonWeek && !f.vacationWeek && f.injured === null,
  },
  {
    text: 'Off-season. She came over without the racquet bag. We noticed.',
    claims: { offSeason: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && independentVoice(f) && f.offSeasonWeek && !f.vacationWeek && f.injured === null,
  },
  {
    text: 'A hit-out at the club. She played the whole thing like it counted.',
    claims: { practice: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.playedPractice && f.injured === null,
  },
  {
    text: 'A practice match, and she still shook hands like it was a final.',
    claims: { practice: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.playedPractice && f.injured === null,
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
    claims: { restingKnock: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: "Rest week – doctor's orders, and ours. She watched the others hit.",
    claims: { restingKnock: true, notTravellingWeek: true, domestic: true },
    license: (f) => notTravellingWeek(f) && underOneRoof(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: (f) => `Ice, stretching, no court. The ${f.knockPart} is quieter than it was.`,
    claims: { restingKnock: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: 'She asked twice if she could go in for an hour. Twice we said no.',
    claims: { restingKnock: true, notTravellingWeek: true, domestic: true },
    license: (f) => notTravellingWeek(f) && underOneRoof(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: 'Rest week. She asked the physio twice. The answer stayed no.',
    claims: { restingKnock: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && independentVoice(f) && f.injured === null && f.knockChoice === 'rest',
  },
  {
    text: (f) => `She trained on the ${f.knockPart} all week and did not mention it once.`,
    claims: { pushingKnock: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.injured === null && f.knockChoice === 'push',
  },
  {
    text: 'Full week on court. She strapped it up herself before every session.',
    claims: { pushingKnock: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.injured === null && f.knockChoice === 'push',
  },
  {
    text: (f) => `The ${f.knockPart} held. We watched her serve more closely than usual.`,
    claims: { pushingKnock: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.injured === null && f.knockChoice === 'push',
  },
  {
    text: 'She trained through it. The coach said nothing and watched everything.',
    claims: { pushingKnock: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.injured === null && f.knockChoice === 'push',
  },
  // --- HER BIRTHDAY (owner, 30.07). ONE WEEK A YEAR, and it ALWAYS speaks. -----------------------
  //
  // «нам точно стоит на месяц рождения девочки где-то в записочках может быть писать какие-то
  // поздравления» - so the scrap says it, and this is the one band with no competing claim on the week:
  // a birthday is not a tennis fact, so it does not care whether she trained, travelled or was laid up.
  //
  // ⚠ AND IT SPLITS ON THE LAYOFF, WHICH A TEST MADE ME DO AND WHICH IS THE BETTER DESIGN. My first version
  // was licensed on `notTravellingWeek` alone, on the argument that a birthday is not a tennis fact and so does not
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
    claims: { birthday: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && familyHomeVoice(f) && f.birthdayAge !== null && f.injured === null,
  },
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. She says nothing feels different.`,
    claims: { birthday: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && familyHomeVoice(f) && f.birthdayAge !== null && f.injured === null,
  },
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. We worked around her calendar for once.`,
    claims: { birthday: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && independentVoice(f) && f.birthdayAge !== null && f.injured === null,
  },
  {
    text: 'Her birthday. She chose the time; we kept the cake ready.',
    claims: { birthday: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && independentVoice(f) && f.birthdayAge !== null && f.injured === null,
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
    claims: { birthday: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.birthdayAge !== null && f.injured === null &&
      f.birthdayGift !== null && f.birthdayWanted && f.birthdayRepeatAge === null && f.birthdayGift !== BIRTHDAY_DAY_NOUN,
  },
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))}. ${capitalise(f.birthdayGift ?? '')}. A pause, then a very good thank-you.`,
    claims: { birthday: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.birthdayAge !== null && f.injured === null &&
      f.birthdayGift !== null && !f.birthdayWanted && f.birthdayRepeatAge === null && f.birthdayGift !== BIRTHDAY_DAY_NOUN,
  },
  // THE DAY, and it gets its own arm because it is the one answer that is not a thing. It must read
  // as one of the good choices or the scene collapses into a menu with a correct order (spec §0).
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. She left the day blank, so we took it slowly.`,
    claims: { birthday: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.birthdayAge !== null && f.injured === null && f.birthdayGift === BIRTHDAY_DAY_NOUN,
  },
  // ⭐ THE CALLBACK, and it is the line this whole slice was built to be able to write.
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))}. ${capitalise(f.birthdayGift ?? '')} again – a tradition since ${f.birthdayRepeatAge}.`,
    claims: { birthday: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.birthdayAge !== null && f.injured === null && f.birthdayRepeatAge !== null,
  },
  // ...and the same week with a brace on it. Both facts, one sentence each.
  {
    // ⚠ NOT "with her leg up", WHICH IS WHAT I WROTE AND WHAT W6c's SWEEP CAUGHT WITHIN THE MINUTE - on a
    // wrist strain. The owner found that class of error by reading; the guard found this one before it
    // shipped, which is the whole return on having written it. A birthday line has no business naming a
    // body part in the first place.
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. Candles, a brace, and very bad timing.`,
    claims: { birthday: true, injured: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && familyHomeVoice(f) && f.birthdayAge !== null && f.injured !== null,
  },
  {
    text: (f) => `${capitalise(ageWord(f.birthdayAge))} today. The physio got the first call; we got the second.`,
    claims: { birthday: true, injured: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && independentVoice(f) && f.birthdayAge !== null && f.injured !== null,
  },
  {
    text: 'Her birthday. She blew out the candles and asked the physio how long.',
    claims: { birthday: true, injured: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.birthdayAge !== null && f.injured !== null,
  },
  // --- THE LAYOFF WEEKS. An injury takes the note, the way it does on the journey home. ----------
  //
  // ⚠ W6b ADDED `!f.examsWeek`, AND IT IS THE WORDS FOLLOWING THE PICTURE. The exam fortnight now
  // outranks the layoff for the FRAME (the owner's ruling – see weekSceneFor's W6b note), and these
  // three lines under a painting of her revising at the kitchen table would be the page contradicting
  // itself. The fortnight inside a layoff gets its own band below instead, which says both things.
  {
    text: 'Rehab, three times this week. She counts the sessions down out loud.',
    claims: { injured: true, notTravellingWeek: true, domestic: true },
    license: (f) => underOneRoof(f) && notTravellingWeek(f) && f.injured !== null && !f.examsWeek,
  },
  {
    // ⚠ R2-18: THE LAYOFF IS THE BAND THIS ITEM COST THE MOST, and these two are what pay it back.
    // Its lines watched her do rehab – counting out loud, timing the ice, the mat in the hall – and
    // every one of them is a claim to have been standing there. A twenty-two-week layoff on a career
    // that is at college or on tour would have been left with one sentence, repeated. So the band
    // gets its own stage-neutral pair: the same facts, reaching the parent the way they actually do.
    text: 'She reports in after every session. Short messages, and all of them fine.',
    claims: { injured: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.injured !== null && !f.examsWeek,
  },
  {
    text: 'The layoff has a routine now, and she keeps to it better than we would.',
    claims: { injured: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.injured !== null && !f.examsWeek,
  },
  {
    text: 'She sat by the court with her homework and watched the others hit.',
    claims: { injured: true, notTravellingWeek: true, domestic: true },
    license: (f) => underOneRoof(f) && notTravellingWeek(f) && f.lifeStage === 'school' && f.injured !== null && !f.examsWeek,
  },
  {
    text: 'The physio says it is going well. She wanted a second opinion.',
    claims: { injured: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.injured !== null && !f.examsWeek,
  },
  {
    text: 'A photo from rehab: three bands, one coffee, no patience.',
    claims: { injured: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && independentVoice(f) && f.injured !== null && !f.examsWeek,
  },
  // --- W6b: THE FORTNIGHT INSIDE A LAYOFF. Both facts, in one sentence each. ---------------------
  //
  // The one week of the year where the two loudest things about her are true at once and neither is
  // tennis. The register is the pool's own and the joke is HERS, not the writer's: a girl who cannot
  // play anyway is the only girl in the house for whom exam fortnight is convenient, and she knows it.
  {
    text: 'Exams, and rehab between the papers. She said the timing was almost funny.',
    claims: { exams: true, injured: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.examsWeek && f.injured !== null,
  },
  {
    text: 'A week of papers and physio. The one fortnight she is not missing anything.',
    claims: { exams: true, injured: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.examsWeek && f.injured !== null,
  },
  // W6c: ...and the posture line, which is now THREE. It shipped as one - «She revised with her leg up
  // on a chair» - licensed on `f.injured !== null`, i.e. on every injury, so a girl with a strained
  // wrist revised with her leg up. The owner caught it: «у нас разные есть, не только нога ... чтобы
  // нога на спину не показывалась». Each is licensed on its own group and unselectable outside it.
  {
    text: 'She revised with her leg up on a chair. Nobody had to tell her to sit still.',
    claims: { exams: true, injured: true, notTravellingWeek: true, bodyGroup: 'leg', domestic: true },
    license: (f) => underOneRoof(f) && notTravellingWeek(f) && f.examsWeek && injuredGroup(f) === 'leg',
  },
  {
    text: (f) => `She revised one-handed, the ${injuredPart(f)} strapped up beside her on the table.`,
    claims: { exams: true, injured: true, notTravellingWeek: true, bodyGroup: 'arm', domestic: true },
    license: (f) => underOneRoof(f) && notTravellingWeek(f) && f.examsWeek && injuredGroup(f) === 'arm',
  },
  {
    text: 'She revised standing up half the time. Sitting is what it likes least.',
    claims: { exams: true, injured: true, notTravellingWeek: true, bodyGroup: 'trunk' },
    license: (f) => notTravellingWeek(f) && f.examsWeek && injuredGroup(f) === 'trunk',
  },
  // --- W6c: THE LAYOFF, IN THE PART IT IS ACTUALLY IN -------------------------------------------
  //
  // The three generic layoff lines above cover up to a 22-week absence, which is thin - and now that
  // the anatomy is legible, the obvious place to spend it is the longest band in the game. Two per
  // group, and every one has to be true of EVERY member of its group (a hip and a foot are both `leg`,
  // so "twice a day, and she times it herself" is in and "her foot up on a cushion" is out).
  {
    text: (f) => `Ice on the ${injuredPart(f)}, twice a day. She times it herself.`,
    claims: { injured: true, notTravellingWeek: true, bodyGroup: 'leg', domestic: true },
    license: (f) => underOneRoof(f) && notTravellingWeek(f) && !f.examsWeek && injuredGroup(f) === 'leg',
  },
  {
    text: 'She is walking almost normally now. The limp only shows when she is tired.',
    claims: { injured: true, notTravellingWeek: true, bodyGroup: 'leg' },
    license: (f) => notTravellingWeek(f) && !f.examsWeek && injuredGroup(f) === 'leg',
  },
  {
    // R2-18: the leg group's other line times her ice packs, which needs a parent in the room.
    text: 'Stairs, then flat ground, then corners. The order is not negotiable.',
    claims: { injured: true, notTravellingWeek: true, bodyGroup: 'leg' },
    license: (f) => notTravellingWeek(f) && !f.examsWeek && injuredGroup(f) === 'leg',
  },
  {
    text: (f) => `Band exercises for the ${injuredPart(f)}, in front of the hall mirror.`,
    claims: { injured: true, notTravellingWeek: true, bodyGroup: 'arm', domestic: true },
    license: (f) => underOneRoof(f) && notTravellingWeek(f) && !f.examsWeek && injuredGroup(f) === 'arm',
  },
  {
    // ⚠ NOT "eating left-handed", WHICH IS THE OWNER'S OWN BUG ONE LEVEL DOWN. That is what I wrote
    // first, and it names WHICH arm - a fact the model does not have. There is no handedness anywhere in
    // the engine (grep: none), so a left-handed girl with a left wrist would be eating with the injured
    // one. Same error as a leg on a back, just smaller: the copy asserting something nobody rolled.
    text: 'She has been doing everything one-handed and finding it funnier than we do.',
    claims: { injured: true, notTravellingWeek: true, bodyGroup: 'arm', domestic: true },
    license: (f) => underOneRoof(f) && notTravellingWeek(f) && !f.examsWeek && injuredGroup(f) === 'arm',
  },
  {
    // R2-18: both of the arm group's lines were domestic – the hall mirror, and watching her manage
    // one-handed. These two say the same things without claiming to have watched.
    text: (f) => `Everything is one-handed for now. The ${injuredPart(f)} sets the terms.`,
    claims: { injured: true, notTravellingWeek: true, bodyGroup: 'arm' },
    license: (f) => notTravellingWeek(f) && !f.examsWeek && injuredGroup(f) === 'arm',
  },
  {
    text: 'She has learned which everyday things need two hands. There are many.',
    claims: { injured: true, notTravellingWeek: true, bodyGroup: 'arm' },
    license: (f) => notTravellingWeek(f) && !f.examsWeek && injuredGroup(f) === 'arm',
  },
  {
    text: 'Ten minutes of core work on a mat in the hall, three times a day.',
    claims: { injured: true, notTravellingWeek: true, bodyGroup: 'trunk', domestic: true },
    license: (f) => underOneRoof(f) && notTravellingWeek(f) && !f.examsWeek && injuredGroup(f) === 'trunk',
  },
  {
    text: 'She has stopped picking things up off the floor without thinking about it first.',
    claims: { injured: true, notTravellingWeek: true, bodyGroup: 'trunk', domestic: true },
    license: (f) => underOneRoof(f) && notTravellingWeek(f) && !f.examsWeek && injuredGroup(f) === 'trunk',
  },
  {
    // R2-18: as for the arm group – the mat in the hall and the floor were both our floor.
    text: 'Nothing heavy, nothing twisted, nothing sudden. Three rules, all week.',
    claims: { injured: true, notTravellingWeek: true, bodyGroup: 'trunk' },
    license: (f) => notTravellingWeek(f) && !f.examsWeek && injuredGroup(f) === 'trunk',
  },
  {
    text: (f) => `The ${injuredPart(f)} decides how she sits, stands and sleeps this week.`,
    claims: { injured: true, notTravellingWeek: true, bodyGroup: 'trunk' },
    license: (f) => notTravellingWeek(f) && !f.examsWeek && injuredGroup(f) === 'trunk',
  },
  // ===============================================================================================
  // ⭐⭐⭐ v72 (THE PRIVATE LIFE, WAVE 1) – HER OWN VOICE, INSIDE THE PARENT'S HAND
  // ===============================================================================================
  //
  // ⚠⚠ INVARIANT 4, AND WHERE THESE WORDS STAND IN IT. The 52 wave-1 strings were the owner's,
  // verbatim from an approved document (voice-bibles §D). The wave-B re-cuts – 80 on two rails,
  // then this four-stage 148 – are DRAFTS: written to his ruled matrix, architect-curated, and
  // MERGE-GATED on his вычитка of the full table (the branch's standing STOP). After his read
  // they are his by ruling; until it, nothing here ships. The claims each line carries are its
  // row of the amended bibles, and a line that looks wrong is the DOC's question first.
  //
  // WHAT THIS IS. Tier 0 of her voice (who-she-is §5b): her quoted line inside the parent's week
  // story. The diary stays HIS journal – she speaks in quotation marks within it – which is why
  // these are entries in this pool rather than a surface of their own. Tiers 1 and 2 (small talk,
  // the big life beats) are waves 3 and 2-4.
  //
  // ⚠ AND SHE MAY SPEAK IN THE FIRST PERSON *INSIDE THE QUOTATION MARKS* – the owner's ruling of
  // 09.09. Outside them the narration is unchanged: third person about her, no address to the
  // player. The pin that enforces the boundary is `tests/week-notes.test.ts`, re-aimed by this wave
  // to strip the quotation before it looks; see its own ⚠ note for what moved and on whose word.
  //
  // WHY IT DOES NOT EXPLODE, in one line: three owners, one line each (voice-bibles §E). The FOUR
  // VOICES own the shape, the REGISTER is a licence on a variant rather than a pool, and the BOND
  // SELECTS between her voice and the shared flat pool instead of multiplying it. Eleven moments ×
  // four voices × three registers × four bands would be 528 lines; wave 1 shipped 52, and wave B's
  // four stage dictionaries make it 148 – still one licence per moment, written once.
  ...voicedNotes(),
  // --- THE FALLIBLE PARENT (wave B, B4 – the 10.09 editorial ruling made six lines) ------------
  //
  // ⚠ THE RULED BOUNDARY: fallible in INTERPRETATION AND TIMING, never in fact. Each line admits a
  // miss – the wrong question first, the want heard as a promise, the quiet misread – and asserts
  // nothing about the world its claims do not carry. His self-doubt is his own journal's licence;
  // the honesty pins keep guarding every world-fact exactly as before.
  //
  // ⚠⚠ AND THE MISS MAY NOT KNOW ITS OWN ANSWER (11.09, the second editorial review's finding 6).
  // Four of the six shipped their ending as omniscience – «She heard the want», «She noticed the
  // order», «She would have planned it differently», «misremembered the wish» – a parent who
  // doubts himself and then states her inner state as fact. The arc is now: the parent ACTS, the
  // parent NOTICES the uncertainty, and it stays UNRESOLVED – what she made of it is not his to
  // report. The birthday line was also a live honesty bug: «misremembered the wish» asserts a
  // wrong-gift fact while the gift system holds `birthdayWanted` and can contradict it same-week.
  {
    text: 'We said the part would hold. The wanting was most of it. She said nothing.',
    claims: { pushingKnock: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.injured === null && f.knockChoice === 'push',
  },
  {
    text: 'We asked about the court first, the papers second. The order was ours.',
    claims: { exams: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.examsWeek && f.injured === null,
  },
  {
    text: 'We called it a good sign that she was quiet. It was not that kind of quiet.',
    claims: { tired: true, notTravellingWeek: true, register: 'low' },
    license: (f) =>
      plainTraining(f) && lowWeek(f) && (f.conditionBand === 'worn' || f.conditionBand === 'drained'),
  },
  {
    text: 'We planned her week off for her. She was not asked. We noticed too late.',
    claims: { vacation: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && f.vacationWeek && f.injured === null,
  },
  {
    text: 'We kept the day the shape it had last year. She may have wanted a new shape.',
    claims: { birthday: true, domestic: true, notTravellingWeek: true },
    license: (f) => notTravellingWeek(f) && underOneRoof(f) && f.birthdayAge !== null && f.injured === null,
  },
  {
    text: 'We filled her free morning with an errand. It had been free for a reason.',
    claims: { light: true, notTravellingWeek: true },
    license: (f) => plainTraining(f) && f.trainPct <= WEEK_NOTE_LIGHT,
  },
  // --- THE FLAT POOL – what `strained` sounds like (voice-bibles §B), 8 lines for all four voices --
  //
  // ⚠ THIS IS NOT A FIFTH TEMPERAMENT. It is the same girl with her walls up, and the point is that
  // the player CANNOT TELL WHICH of the four voices this is any more: one to four words, the smallest
  // vocabulary in the document, reused on purpose – a pool that read varied would have failed. She
  // answers and never offers, and she is never rude, because hostility would be a scene and a scene
  // is a relationship. What the player is meant to hear is that there is nothing there.
  //
  // ⚠ ROWS 1-6 ARE THE ORDINARY TRAINING WEEK; ROWS 7-8 CLAIM `injured`, because the standing rule of
  // this pool is the one the whole file keeps – A LAYOFF TAKES THE NOTE, so a line selectable on an
  // injured week must say so. Nothing else in wave 1 is licensed at `strained`: she has nothing to
  // say about the weeks that actually mattered, which is the truest sentence in §B.
  { text: '"Fine," she said. Nothing else, all week.', ...flat() },
  { text: '"It was okay," she said. That was all of it.', ...flat() },
  { text: 'Asked about training, she said: "Same." Nothing after it.', ...flat() },
  { text: 'Asked how the week went, she said only: "Fine."', ...flat() },
  { text: '"Nothing to report," she said, and that was the report.', ...flat() },
  { text: '"All right," she said. Two words, and no opening in them.', ...flat() },
  { text: '"It is healing," she said. Nothing about pain.', ...flatLayoff() },
  { text: '"On schedule," she said. That was the whole of the update.', ...flatLayoff() },
]

/**
 * The ordinary week's note, or null.
 *
 * Two decisions, one draw, on `seed:weeknote:<week>`: whether an ordinary training week speaks at
 * all (WEEK_NOTE_CHANCE – the calendar's own weeks skip this coin), and which of the licensed lines
 * it speaks. Pure and deterministic: the same week always says the same thing.
 *
 * Returns null on a come-home week without being asked to know about one – `notTravellingWeek` reads
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
