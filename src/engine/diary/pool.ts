// THE PHOTO/CONDITION PHRASE POOL: every line the diary can say about the week just gone, and the
// licence that decides which ones are true.
//
// ⚠ THIS IS A DATA TABLE, and that is why it is its own file. ~500 of these lines are the pool
// itself - one entry per phrase, each with the claim it makes and the licence that must hold for it
// to be allowed. It is the largest single thing in the diary and it changes for editorial reasons,
// not structural ones, so keeping it beside the selection logic made every copy tweak a diff against
// the engine.
//
// ⚠ DEPENDENCY DIRECTION. Reads diary/words.ts for the shared vocabulary and predicates and the
// protocol for the facts shape; nothing here imports diary.ts.
//
// ⚠ RNG: `diaryLine` picks on a PURPOSE-SCOPED sub-stream derived from the passed seed, never MAIN.
import { rngFromSeed } from '../rng'
import type { DiaryFacts } from '../../shared/protocol'
import { short, plural, justHurt, quiet, ageWord, capitalise } from './words'

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
    license: (f) => quiet(f) && f.emotion === 'norm' && !f.schoolOver,
  },
  {
    surface: 'photo',
    text: 'An ordinary week – practice, pasta, an early night.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.emotion === 'norm' && f.schoolOver,
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
    license: (f) => quiet(f) && f.emotion === 'norm' && !f.schoolOver,
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
  // ⚠ ROUND-18 #9: this line named SCHOOL at twenty-one. `facts.ts` has carried `schoolOver` since
  // it was written - for exactly this - and every other surface that says the word already branches
  // on it (`milestones.ts`, `SeasonSummaryDialog.vue`); the pool was simply never wired to the fact.
  // Two entries rather than an interpolation, because the pool's whole design is one text per
  // licence, and a girl three years out of school does not get a shorter sentence about it.
  {
    surface: 'condition',
    text: 'Off-season – rest, school, family.',
    claims: { affect: 'neutral', offSeason: true },
    license: (f) => f.offSeasonWeek && f.injured === null && !f.vacationWeek && !f.schoolOver,
  },
  {
    surface: 'condition',
    text: 'Off-season – rest, family, and the block where next year gets built.',
    claims: { affect: 'neutral', offSeason: true },
    license: (f) => f.offSeasonWeek && f.injured === null && !f.vacationWeek && f.schoolOver,
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
  // ROUND-18 #9, the one the owner did NOT report – found by the sweep that was written for the
  // off-season line. Same defect, an ordinary training week instead of December, and it would have
  // outlived the reported one. Its twin says what a quiet week is once the school half is gone.
  {
    surface: 'condition',
    text: 'Training, school, repeat.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && !f.schoolOver,
  },
  {
    surface: 'condition',
    text: 'Training, sleep, repeat.',
    claims: { affect: 'neutral', quietWeek: true },
    license: (f) => quiet(f) && f.schoolOver,
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
