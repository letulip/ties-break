// =================================================================================================
// W2 — THE ORDINARY WEEK'S NOTE (engine/diary.ts WEEK_NOTES / weekNoteFor)
// =================================================================================================
//
// The owner, 30.07: «Чтобы тренировочные недели не просто скипались нужно всё-таки видимо пришло
// время сделать какое-то пошаговый события Что происходит на этих неделях когда нет матчей а только
// тренировки».
//
// This suite is the same shape as tests/travel-home.test.ts's honesty pin, and for the same reason:
// the note is a line in the PARENT's hand on the week's own scrap, and the one failure that would
// kill the effect outright is a line that is not TRUE of the week it lands on. "Six days on court"
// on a Light 60/40 week, or "she baked something" on the week she tore an ankle, is worse than no
// note at all. So every `claims` entry is re-checked independently against the facts, over a sweep
// of the whole licence space, rather than trusted to a careful author.
//
// FOUR THINGS ARE PINNED HERE:
//   1. HONESTY. Every licensed line asserts only what the week's facts carry.
//   2. THE INJURY TAKES THE NOTE, the way it does on the journey home.
//   3. THE CADENCE. An ordinary training week is quiet roughly two weeks in three – the training
//      card's own lesson (a week that always speaks is as dull as one that never does) – while the
//      calendar's own weeks (exams, the holiday, the off-season, a friendly, a layoff) always speak.
//   4. THE VOICE AND THE SCRAP. Third person, about her, under 80 characters, short dash only.
//
// ⚠ RE-AIMED BY W4 (the knock), and the protected facts are UNCHANGED - they are now checked over a
// bigger space. Three things moved and none of them weakened:
//
//   (a) THE SWEEP GREW A KNOCK AXIS. `sweepWeeks` now crosses every week with knockChoice
//       null / 'rest' / 'push', so the honesty pin covers the new band instead of leaving it
//       unchecked. That is 3x the assertions it made before, on the same rule.
//   (b) `WeekNote.text` MAY NOW BE A TEMPLATE (a knock line has to name the part - "A week off the
//       ankle"). The voice and length guards therefore measure the RENDERED sentence, resolved
//       against a representative week, which is the string the player actually reads. Nothing is
//       skipped: `renderAll` asserts it has resolved every entry in the pool.
//   (c) 'exams/holiday/off-season/friendly/layoff always speak' GAINED THE TWO KNOCK WEEKS, because
//       they are the same kind of week - one the calendar (or the player) has put something in, so
//       the scrap must never fall back to a receipt on it. Same rule, two more members.
//
// ⚠ ZERO MAIN-STREAM DRAWS is proved next door, in tests/travel-home.test.ts's byte-identical
// capture (41550 / e6b0c709), which now touches `diary.weekNote` on every one of 52 weeks.
import { describe, expect, it } from 'vitest'
import { BANNED_TAILS } from './helpers/bannedTails'
import { worldSource, diarySource } from './worldSource'
import { readFileSync } from 'node:fs'
import {
  BEREAVED_WEEKS,
  DIVORCED_WEEKS,
  WEEK_NOTES,
  WEEK_NOTE_CHANCE,
  WEEK_NOTE_GRIND,
  WEEK_NOTE_LIGHT,
  conditionBandOf,
  weekNoteFor,
} from '../src/engine/diary'
import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type BondBand,
  type CoachFeel,
  type ConditionBand,
  type DiaryFacts,
  type DiaryLifeStage,
  type FundsPressure,
  type MoodRegister,
} from '../src/shared/protocol'
// ⭐ v72: who she is, and the five approved Mood words the ladder hands the tile.
import { MOOD_WORD, TEMPERAMENTS, type Temperament } from '../src/engine/spirit'
// W6c: the anatomy the pin re-derives from, so a claim about her body is checked against her body.
import { BODY_REGIONS, bodyGroupOf, bodyPartOf, type BodyGroup } from '../src/engine/body'
// v48: the birthday catalogue, so the scrap budget is measured on the longest noun it can produce.
import { BIRTHDAY_BANDS, giftNoun, PARTNER_NAME_POOL } from '../src/engine/world'
// R51 №13: the package catalogue, so the narrowing's id and the controls are read off the data and not retyped.
import { vacation } from '../src/engine/economy/vacation'
// ⭐ R52 F3 – the real-career arm: a played, coached career, the stint's ledger, and the constants the period is read off.
import { createHash } from 'node:crypto'
import { COACH_FEEL } from '../src/engine/chemistry'
import { createWorld, hireCoach, toSnapshot } from '../src/engine/world'
import { coachSinceWeek } from '../src/engine/world/coachStint'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')

// --- the sweep -----------------------------------------------------------------------------------

const BANDS: ConditionBand[] = ['fresh', 'ok', 'worn', 'drained']
const BAND_CONDITION: Record<ConditionBand, number> = { fresh: 90, ok: 70, worn: 50, drained: 10 }
const PRESSURES: FundsPressure[] = ['tight', 'watchful', 'ok']
/** The three presets the UI offers, plus the two ends of the range in case a future preset moves. */
const PLANS = [WEEK_PLAN_PRESETS.light.train, WEEK_PLAN_PRESETS.balanced.train, WEEK_PLAN_PRESETS.grind.train, 50, 100]

/** A week she spent AT HOME, as the pool is allowed to see it. Everything the pool does not read is
 *  held at the value the engine produces on such a week, so the fixture stays a coherent week. */
function homeWeek(over: Partial<DiaryFacts>): DiaryFacts {
  const condition = over.condition ?? 70
  return {
    week: 20,
    ageYears: 14,
    lifeStage: 'school',
    emotion: 'norm',
    // ⚠ ROUND 42 #29(a) – the HERO's narrower read of the same week (a fresh result, the layoff
    // painting, or the neutral portrait – never the mood or fatigue face). Unread by this suite;
    // on an ordinary uninjured week with no fresh result the two answers agree anyway.
    heroEmotion: 'norm',
    resultFresh: false,
    won: false,
    lostFinal: false,
    titleThisWeek: false,
    resultTier: null,
    rankClimbed: false,
    runPointsThisWeek: 0,
    lossStreak: 0,
    condition,
    conditionBand: conditionBandOf(condition),
    // ⚠ v72 – WHO SHE IS, HOW SHE IS, AND WHERE THE TWO OF THEM STAND. The defaults are a career's
    // opening state (ruling V4: 70/70 for everyone in v1), which reads `steady` on the bond and
    // `level` on the register, and the openness/steadiness pair the first bible was written for.
    // `sweepVoices` below crosses all four voices, all four bands and all three registers – holding
    // them fixed here would repeat R2-18's mistake, where a sweep of ~47,000 fixtures contained
    // exactly one answer to the question the item was about.
    temperament: 'sunny',
    moodWord: null,
    moodRegister: 'level',
    // ⚠ ROUND 42 #29(b) – the RUNG the register one line up is a collapse of, for the avatar's mood
    // ring. `steady` is the same opening state the note above describes.
    moodBand: 'steady',
    bondBand: 'steady',
    // ⭐ v74 T6 – the parent knows of nobody, which is what every fixture in this file was
    // written about (see `DiaryFacts.partnerKnown`).
    partnerKnown: false,
    // ⭐ v75 T6 – and nothing of hers has recently ended (see `DiaryFacts.freshBreakup`). The
    // `sweepStages` calendars below are the only place the axis is turned on, for R2-18's reason.
    freshBreakup: false,
    // ⭐ v83 (wave 7 – T5) – and the one she married said nothing this week (see `DiaryFacts.spouseOccasion`).
    spouseOccasion: null,
    ownKeyWeek: false,
    // ⭐ wave 8b T2 (C6) – and she is not carrying, has not given birth and has not come back (see
    // `DiaryFacts.motherhoodBand`). The `sweepStages` calendars below are the only place this axis
    // is turned on, for R2-18's reason – exactly as `freshBreakup` and `spouseOccasion` are.
    motherhoodBand: null,
    motherhoodSupport: null,
    // ⚠ v87 (wave 11 T5): nobody in this fixture's family has died – which is every career in
    // the game until the weight is switched on, and is what `null` means on the field.
    bereavedWeeksAgo: null,
    // ⚠ v88 (wave 12 T4): this fixture's marriage never ended – which is every career that never
    // married and every one still married, and is what `null` means on the field. `forkAftermath`
    // is `null` on every week but the one the fork resolves on, which this is not.
    divorcedWeeksAgo: null,
    forkAftermath: null,
    // ⚠ v86 (wave 10 T6b): a probe career continues no line. Both are REQUIRED for
    // `motherhoodBand`'s own reason – a fixture that forgot them would sweep a whole
    // generation out of the diary in silence.
    lineageTitles: null,
    lineageOpen: null,
    lineageEndedHurt: null,
    injured: null,
    travelled: false,
    playedTournament: false,
    playedPractice: false,
    examsWeek: false,
    schoolOver: false,
    offSeasonWeek: false,
    vacationWeek: false,
    vacationPackageId: null,
    trainPct: 75,
    // ⚠ W4 added `knockChoice`/`knockPart` (what a knock is doing to the week). Null here: this
    // fixture is a week with nothing wrong with her, which is what these suites are about.
    knockChoice: null,
    birthdayAge: null,
    // v48: the birthday gift, unread by this builder - the default is "he has not answered".
    birthdayGift: null,
    birthdayWanted: false,
    birthdayRepeatAge: null,
    knockPart: null,
    fundsPressure: 'ok',
    freshMilestone: null,
    travelHomeScene: null,
    travelHomeMood: null,
    ...over,
  }
}

/** The whole space of weeks she can spend at home: the plan, her body, the wallet, each of the
 *  calendar's own weeks in turn, healthy and hurt - and (W4) what a knock is doing to the week.
 *
 *  ⚠ THE KNOCK AXIS IS SWEPT AGAINST EVERY OTHER AXIS, including states the engine cannot reach (a
 *  live knock on an injured week - `rollInjury` retires it at onset). That is deliberate and is the
 *  pin's whole method: it checks the LICENCE SPACE, not the reachable space, so a licence that would
 *  become wrong the day some other rule changed fails today. */
const KNOCKS: Partial<DiaryFacts>[] = [
  { knockChoice: null, knockPart: null },
  { knockChoice: 'rest', knockPart: 'ankle' },
  { knockChoice: 'push', knockPart: 'shoulder' },
  { knockChoice: 'push', knockPart: 'shoulder' },
]

/**
 * W6c: THE ANATOMY AXIS, and without it the whole slice would have been unguarded.
 *
 * The sweep used to cross `[null, 'ankle strain']` - one injury, one group. Every `bodyGroup: 'arm'` and
 * `'trunk'` line would therefore have been UNLICENSED in every fixture the pin ever generated, so the
 * pin would have passed while proving nothing about them: the failure mode is a green suite, not a red
 * one, which is the kind worth writing a comment about.
 *
 * EVERY REGION, not one per group. Twelve is cheap, the table is closed, and a group mapping is exactly
 * the sort of thing that gets a thirteenth member added to one side of it. Plus one kind that resolves to
 * NO part, which is the case that proves the group lines go quiet rather than guessing - a persisted
 * `kind` from an older save, or a fixture written by hand.
 */
const INJURIES: (DiaryFacts['injured'])[] = [
  null,
  ...BODY_REGIONS.map((r) => ({ kind: `${r.part} strain`, weeksRemaining: 3, totalWeeks: 6 })),
  { kind: 'unspecified complaint', weeksRemaining: 3, totalWeeks: 6 },
]

function* sweepWeeks(): Generator<DiaryFacts> {
  const calendars: Partial<DiaryFacts>[] = [
    {},
    // her birthday, which is a week like any other as far as the honesty pin is concerned - and has to be
    // in the sweep or the new band would be unlicensed in every fixture and prove nothing.
    { birthdayAge: 15 },
    { examsWeek: true },
    { offSeasonWeek: true },
    { vacationWeek: true },
    { offSeasonWeek: true, vacationWeek: true },
    { playedPractice: true },
  ]
  for (const trainPct of PLANS) {
    for (const band of BANDS) {
      for (const fundsPressure of PRESSURES) {
        for (const calendar of calendars) {
          for (const knock of KNOCKS) {
            for (const injured of INJURIES) {
              yield homeWeek({
                trainPct,
                condition: BAND_CONDITION[band],
                fundsPressure,
                injured,
                ...calendar,
                ...knock,
              })
            }
          }
        }
      }
    }
  }
}

/**
 * ⚠⚠ R2-18 – THE LIFE-STAGE AXIS, and it is why the adult voice could go wrong unnoticed for a year.
 *
 * `sweepWeeks` above holds `lifeStage` at 'school' on every one of its ~47,000 fixtures, so every
 * stage-gated line in the pool was licensed in NONE of them and every stage-gated line's absence was
 * licensed in ALL of them: the honesty pin swept a large space that contained exactly one answer to
 * the question this item is about. Crossing the stage into the main sweep would multiply it by four
 * for no new information on the other axes, so the stage gets its own sweep at the shapes that
 * actually differ, and both feed the pin.
 *
 * ⚠ THE STAGE AND ITS TWO NEIGHBOURING FACTS ARE KEPT COHERENT, which the school pin in
 * tests/diary.test.ts learned the hard way: a sweep that invents a state the engine cannot produce
 * reports honest lines as bugs. `lifeStage === 'school'` is exactly `!schoolOver`, and `isExamWeek`
 * returns false once school is over - so an exam week is only ever generated for the school stage.
 */
const STAGES: DiaryLifeStage[] = ['school', 'after-school', 'college', 'independent']

function* sweepStages(): Generator<DiaryFacts> {
  const calendars: Partial<DiaryFacts>[] = [
    {},
    { birthdayAge: 22 },
    { examsWeek: true },
    { offSeasonWeek: true },
    { vacationWeek: true },
    { playedPractice: true },
    // ⭐ R51 №13 – THE HOLIDAY'S TWO SIDES, ARMED FOR R2-18's REASON ONCE MORE: `homeWeek` holds
    // `vacationPackageId` at null on every fixture of every sweep, so the staycation's three lines (licensed
    // on the package) would be licensed in NONE of them, and the narrowed pair would be reached only through
    // the null id. Three shapes, each arming a different half: the staycation at the default register is the
    // one that catches a `bright` line which forgot its licence (it would be licensed at `level` and fail
    // `HOLDS.register`); at `bright` it makes that line's TRUE state reachable; and the seaside gives the
    // narrowed pair a real away id. All three run at all four stages, which is what catches a house line
    // reaching a flat of her own (`HOLDS.domestic`).
    { vacationWeek: true, vacationPackageId: 'staycation' },
    { vacationWeek: true, vacationPackageId: 'staycation', moodRegister: 'bright' as const },
    { vacationWeek: true, vacationPackageId: 'seaside' },
    // ⭐ v74 T6 – NOT A CALENDAR, AND IT IS HERE ANYWAY, for R2-18's reason in this list's own
    // paragraph above: `sweepWeeks` and `sweepVoices` both hold `partnerKnown` at false on every
    // fixture, so a line licensed on it would be licensed in NONE of them and its absence in ALL of
    // them. One extra shape on the smallest sweep is the cheapest place the axis can exist at all.
    { partnerKnown: true },
    // ⭐ v74 T10 – ...AND THE SAME SHAPE AT `bright`, WIDENING THE SWEEP RATHER THAN RELAXING IT.
    // `homeWeek` holds `moodRegister` at 'level' and `sweepVoices` (the only sweep that moves it)
    // holds `partnerKnown` at false, so T10's two «lighter week» lines – licensed on BOTH – would
    // have been licensed in no fixture of any sweep and the honesty pin would have proved nothing
    // about them. The line above is still the one that catches a MISSING register licence (a line
    // claiming `bright` would be licensed there at 'level' and fail `HOLDS.register`); this one is
    // what makes the claim's true state reachable, which is the other half of the same guard.
    { partnerKnown: true, moodRegister: 'bright' as const },
    // ⭐ v75 T6 – THE ENDING'S MARK, ON THE SAME SWEEP AND FOR THE SAME R2-18 REASON as the two
    // shapes above: `sweepWeeks` and `sweepVoices` both hold `freshBreakup` at false on every
    // fixture, so all four lines of the new band would be licensed in NO fixture of ANY sweep and
    // the honesty pin would prove nothing whatever about them.
    { freshBreakup: true },
    // ⭐⭐ ...AND AT `low`, WHICH IS THE OTHER HALF AND IS NOT THE SAME SHAPE. The band's fourth line
    // claims `register: 'low'` as well, and `homeWeek` holds the register at `level`; without this
    // row that line alone would be unreachable here, exactly as T10's two «lighter» lines were.
    // ⚠ THE ROW ABOVE IS STILL THE ONE THAT CATCHES A MISSING REGISTER LICENCE – a line claiming
    // `low` while licensed at `level` fails `HOLDS.register` there – so the two rows arm opposite
    // halves of one guard and neither replaces the other.
    { freshBreakup: true, moodRegister: 'low' as const },
    // ⭐ v83 (wave 7 – T5) – THE SPOUSE'S WORD, ONE SHAPE PER OCCASION, for the same R2-18 reason as
    // every armed shape above: `sweepWeeks` and `sweepVoices` hold `spouseOccasion` at null on every
    // fixture, and the band's four lines license on four DIFFERENT occasion values – so any shape
    // left out would leave its line licensed in no fixture of any sweep, and the per-line reached
    // arm below (its own case) would fail by name.
    { spouseOccasion: 'distant-swing' as const },
    { spouseOccasion: 'road-stretch' as const },
    { spouseOccasion: 'no-vacation' as const },
    { spouseOccasion: 'money' as const },
    // ⭐ v83 (wave 7 – T10) – the week she got her own place, armed for the same R2-18 reason.
    { ownKeyWeek: true },
    // ⭐⭐⭐ wave 8b T2 (C6) – ONE SHAPE PER BAND OF THE MOTHERHOOD ARC, for the same R2-18 reason as
    // every armed shape above: `sweepWeeks` and `sweepVoices` hold `motherhoodBand` at null on every
    // fixture, and the band's eight lines license on SEVEN DIFFERENT values – so any band left out
    // would leave its line licensed in no fixture of any sweep, and the per-line reached arm below
    // (its own case) fails by name.
    // ⚠⚠⚠ RE-AIMED 21.09 BY WAVE 9's T4, AND THE PER-LINE ARM BELOW IS WHAT FORCED IT. The eight
    // shapes that used to be written out here armed the BAND and not the VOICE: `sweepStages` holds
    // `temperament` at one value, so with the four-voice cross in the pool the sweep reached 15 of
    // 36 lines and the reached-per-line case failed by name. The cross is DERIVED rather than
    // pasted – twenty-eight rows nobody has to keep in step – so a fifth voice or an eighth band
    // arms itself here the day it is added, which is the failure mode this list exists to prevent.
    ...VOICES.flatMap((temperament) =>
      (['announced', 'early', 'mid', 'last', 'birth', 'postpartum', 'returned'] as const).map(
        (motherhoodBand) => ({ motherhoodBand, temperament }),
      ),
    ),
    // ⚠⚠ POSTPARTUM IS ARMED TWICE AND THE PAIR IS THE POINT – it is the `freshBreakup`/`low` pair's
    // shape, one wave on. The band's SEVENTH line carries a second gate (`warmSupport`), so without
    // the warm row that line would be licensed in no fixture of any sweep; and without the plain row
    // – the grade at its commonest reading – a licence that FORGOT the warm gate would be licensed
    // nowhere it could be caught. The two rows arm opposite halves of one guard and neither replaces
    // the other.
    { motherhoodBand: 'postpartum' as const },
    { motherhoodBand: 'postpartum' as const, motherhoodSupport: 'warm' as const },
    { motherhoodBand: 'returned' as const },
    // ⭐⭐⭐ v87 (the weight, wave 11 – T5) – THE WEEKS AFTER A DEATH IN THE FAMILY, ARMED ACROSS
    // ALL FOUR VOICES AND ON BOTH SIDES OF THE LICENCE'S OWN WINDOW. Without the first row the four
    // new lines would be licensed in NO fixture of any sweep and every guard in this file – the
    // honesty pin, the 80-character scrap budget, the third person, the short dash – would pass over
    // them without looking, which is the «unable to fail» family wearing a corpus's clothes.
    // ⚠ THE SECOND ROW IS THE OTHER HALF AND IS WHY THERE ARE TWO: a licence that FORGOT its window
    // (`<= BEREAVED_WEEKS`) would be licensed here too, and the reached-per-line case is what catches
    // it. One row arms the claim; the pair arms the window.
    ...VOICES.map((temperament) => ({ bereavedWeeksAgo: 1, temperament })),
    ...VOICES.map((temperament) => ({ bereavedWeeksAgo: 60, temperament })),
    // ⭐⭐⭐ v88 (the parting, wave 12 – T4) – THE WEEKS AFTER A MARRIAGE ENDS, armed exactly as the
    // pair above is and for the pair above's reasons: the first row arms the claim (without it the
    // four new lines would be licensed in NO fixture and every guard in this file would pass over
    // them without looking), the second arms the WINDOW (a licence that dropped
    // `<= DIVORCED_WEEKS` would reach these and redden the reached-per-line case).
    ...VOICES.map((temperament) => ({ divorcedWeeksAgo: 1, temperament })),
    ...VOICES.map((temperament) => ({ divorcedWeeksAgo: 60, temperament })),
    // ⭐⭐⭐ v88 (wave 12 – T4.2) – THE WEEK THE FORK RESOLVES, both arms, all four voices. ⚠ TWO
    // ROWS AND NOT THREE: the `null` arm needs no shape of its own, because every other fixture in
    // every sweep already carries it – which is what makes «one week only» checkable.
    ...VOICES.map((temperament) => ({ forkAftermath: 'with' as const, temperament })),
    ...VOICES.map((temperament) => ({ forkAftermath: 'against' as const, temperament })),
    // ⭐ R52 F3 – HER FEEL FOR THE COACH, ONE SHAPE PER STEP THAT HAS A VOICE, for R2-18's reason once more: `homeWeek`
    // holds `coachFeelRead` absent on every fixture of every sweep, so the ten lines (licensed on it) would be licensed in
    // NONE of them and every guard in this file – the honesty pin, the scrap budget, the third person, the short dash –
    // would pass over them without looking. The five run at all four stages (which is what catches a house line reaching a
    // flat of her own, `HOLDS.domestic`) and cross every calendar of this sweep through `plainTraining` (which is what
    // catches one reaching a holiday, a journey, a knock or a layoff).
    ...(['unsure', 'seems-good', 'seems-off', 'good', 'off'] as const).map((coachFeelRead) => ({ coachFeelRead })),
    // ⭐ R52 J1 – THE CHECKPOINT THE BOND SHUT, ONE SHAPE PER BAND, for the same reason once more: `homeWeek` holds `coachTalkShut` absent on every fixture, so the four silence lines would be licensed in NONE of them and
    // every guard in this file would pass over them without looking. The band rides WITH the fact (`bondBand` is the independent second spelling `HOLDS.coachTalkShut` checks it against), at all four stages
    // (which catches a house line reaching a flat of her own) and across every calendar, knock and injury of this sweep (which catches one reaching a layoff).
    ...(['strained', 'cold'] as const).map((coachTalkShut) => ({ coachTalkShut, bondBand: coachTalkShut })),
  ]
  for (const lifeStage of STAGES) {
    const schoolOver = lifeStage !== 'school'
    for (const calendar of calendars) {
      if (schoolOver && calendar.examsWeek) continue // the engine cannot produce this week
      for (const trainPct of [WEEK_PLAN_PRESETS.light.train, WEEK_PLAN_PRESETS.grind.train]) {
        for (const band of BANDS) {
          for (const knock of KNOCKS) {
            for (const injured of INJURIES) {
              yield homeWeek({
                lifeStage,
                schoolOver,
                ageYears: schoolOver ? 24 : 15,
                trainPct,
                condition: BAND_CONDITION[band],
                injured,
                ...calendar,
                ...knock,
              })
            }
          }
        }
      }
    }
  }
}

/**
 * ⭐⭐ v72 – THE VOICE AXES, and the reason they are a sweep of their own is `sweepStages`' reason
 * one paragraph up, repeated for three new fields at once.
 *
 * `sweepWeeks` holds `temperament` at `sunny`, `bondBand` at `steady` and `moodRegister` at `level`
 * on every one of its ~47,000 fixtures – so all 33 lines of the other three voices, all 8 of the
 * flat pool and both register-scoped variants would be licensed in NONE of them, and their absence
 * would be licensed in ALL of them. Crossing four voices × four bands × three registers into the
 * main sweep would multiply it by 48 for no new information about the plan or the wallet, so the
 * three axes get their own sweep at the shapes that actually differ, and both feed the honesty pin.
 *
 * ⚠ IT SWEEPS STATES THE ENGINE CANNOT REACH – a `cold` bond in wave 1, a `heavy` register – on the
 * same method the knock axis states above: the pin checks the LICENCE SPACE, not the reachable one,
 * so a licence that would become wrong the day wave 4's break-up shock arrives fails today.
 */
const VOICES: Temperament[] = ['sunny', 'fiery', 'quiet', 'deep']
const BONDS: BondBand[] = ['close', 'steady', 'strained', 'cold']
const REGISTERS: MoodRegister[] = ['bright', 'level', 'low']

function* sweepVoices(): Generator<DiaryFacts> {
  const calendars: Partial<DiaryFacts>[] = [
    {},
    { birthdayAge: 15 },
    { examsWeek: true },
    { offSeasonWeek: true },
    { vacationWeek: true },
    { playedPractice: true },
  ]
  // ⚠ ALL FOUR (11.09, «4 полосы»). This held ['school', 'independent'] while the pool's rails were
  // two, and that was already the honest pair; with four stage dictionaries it would leave every
  // fiery/quiet/deep after-school and college cell licensed in NO fixture of ANY sweep – the exact
  // R2-18 failure this comment block describes, reborn one shelf down.
  const stages: DiaryLifeStage[] = ['school', 'after-school', 'college', 'independent']
  for (const temperament of VOICES) {
    for (const bondBand of BONDS) {
      for (const moodRegister of REGISTERS) {
        for (const lifeStage of stages) {
          for (const calendar of calendars) {
            if (lifeStage !== 'school' && calendar.examsWeek) continue // the engine cannot produce it
            for (const trainPct of [WEEK_PLAN_PRESETS.light.train, WEEK_PLAN_PRESETS.grind.train]) {
              for (const band of BANDS) {
                for (const knock of KNOCKS) {
                  for (const injured of [INJURIES[0], INJURIES[1]]) {
                    yield homeWeek({
                      temperament,
                      bondBand,
                      moodRegister,
                      lifeStage,
                      schoolOver: lifeStage !== 'school',
                      ageYears: lifeStage === 'school' ? 15 : 24,
                      trainPct,
                      condition: BAND_CONDITION[band],
                      injured,
                      ...calendar,
                      ...knock,
                    })
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

/** Every fixture the pins run over: the week shapes, then the stages, then the voices. */
function* sweepAll(): Generator<DiaryFacts> {
  yield* sweepWeeks()
  yield* sweepStages()
  yield* sweepVoices()
}

/** The sentence a note actually puts on the scrap. W4: an entry may be a facts-aware template, so the
 *  guards below read THIS and not the raw field - it is the string the player sees. */
function render(note: (typeof WEEK_NOTES)[number], f: DiaryFacts): string {
  return typeof note.text === 'function' ? note.text(f) : note.text
}

/** Every line in the pool, rendered against a week that names a part - so the templates resolve to a
 *  real sentence rather than to "undefined". */
function renderAll(): string[] {
  // ⚠ RE-AIMED (v48), AND THE MEASUREMENT IS WHY. This built facts with `birthdayGift: null`, so the
  // four birthday-present templates were rendered with the string "null" – four characters – and the
  // 80-character scrap budget below was measured on a sentence nobody will ever read. Their first
  // draft was up to 28 characters over and sailed straight through. It now renders the WORST CASE the
  // catalogue can actually produce: `giftNoun` swept over every band, longest first (31 characters,
  // "the one thing she would not buy"), plus a two-digit repeat age. Derived rather than pasted, so a
  // longer noun added to the catalogue tightens this guard automatically instead of ageing out of it.
  const longestGiftNoun = BIRTHDAY_BANDS.flatMap((b) => b.gifts)
    .map((g) => giftNoun(g.id) ?? '')
    .sort((a, b) => b.length - a.length)[0]
  const f = homeWeek({
    knockChoice: 'rest',
    knockPart: 'ankle',
    birthdayGift: longestGiftNoun,
    birthdayWanted: true,
    birthdayRepeatAge: 19,
  })
  const out = WEEK_NOTES.map((n) => render(n, f))
  // The whole point of resolving: an unresolved template would sail through every guard below.
  for (const t of out) expect(t, 'a template that did not resolve').not.toContain('undefined')
  return out
}

/** ONE independent re-derivation per claim, off the facts and NOT off the licence that made it.
 *
 *  ⚠ W6c: THE SIGNATURE GAINED THE CLAIM'S VALUE, because `bodyGroup` is the first claim on this pool
 *  that carries one. The pin used to skip anything that was not literally `true`, so a valued claim
 *  would have been silently unverified - decoration that looked like a guard. */
const HOLDS: Record<string, (f: DiaryFacts, value: unknown) => boolean> = {
  grind: (f) => f.trainPct >= WEEK_NOTE_GRIND,
  light: (f) => f.trainPct <= WEEK_NOTE_LIGHT,
  tired: (f) => f.conditionBand === 'worn' || f.conditionBand === 'drained',
  freshBody: (f) => f.conditionBand === 'fresh',
  injured: (f) => f.injured !== null,
  exams: (f) => f.examsWeek,
  vacation: (f) => f.vacationWeek,
  // ⭐ R51 №13 – WHICH SIDE OF THE FRONT DOOR THE HOLIDAY WAS ON, re-derived off the PACKAGE ID and not off
  // the `homeHoliday` / `awayHoliday` predicates in weekNotes.ts that produced the line: a second spelling,
  // so a licence and its claim cannot be wrong together. VALUED – `'home'` is the staycation and `'away'` is
  // anything else (a null id included, as the claim's own note explains) – and an unknown value fails, so a
  // third value added to the claim cannot be waved through by a table that only knows two.
  vacationAt: (f, value) =>
    f.vacationWeek &&
    (value === 'home' ? f.vacationPackageId === 'staycation' : value === 'away' && f.vacationPackageId !== 'staycation'),
  offSeason: (f) => f.offSeasonWeek,
  practice: (f) => f.playedPractice,
  fundsTight: (f) => f.fundsPressure === 'tight',
  // ⭐ v86 (wave 10 T6b) – the line's claim, re-derived off the FACT and not off the licence that made
  // it: a career that continues no line carries `null`, and `0` is a mother who won nothing, which is
  // a real state this claim deliberately DOES admit (the cabinet lines carry their own second gate).
  lineage: (f) => f.lineageTitles !== null,
  notTravellingWeek: (f) => !f.playedTournament && !f.travelled && f.travelHomeScene === null,
  // ⚠⚠ R2-18 – THE KNOWLEDGE LICENCE, RE-DERIVED FROM THE STAGE AND NOT FROM `underOneRoof`. The
  // whole method of this table is a SECOND spelling of every claim, so a licence and its claim
  // cannot be wrong together; calling the engine's own predicate here would make this line
  // decoration. `domestic` asserts the parent was in the house to see it, and the two stages where
  // that is true are the two below.
  //
  // ⚠ THIS IS THE ONE THAT REPLACES A BLACKLIST. The old adult guard listed seven forbidden
  // substrings ("garage door", "we said no", "homework"…) and was bypassed by the next synonym –
  // which is exactly how "in front of the television", "the hall mirror" and "the floor" were all
  // still reachable at thirty-one. This asks the fact instead: whatever the words are, a line that
  // CLAIMS the parent was there must be unlicensed on every week she was not.
  domestic: (f) => f.lifeStage === 'school' || f.lifeStage === 'after-school',
  // W4: re-derived off the fact, not off the licence that produced the line - same as every entry
  // above. A rest line on a week she trained through is the exact failure this catches.
  restingKnock: (f) => f.knockChoice === 'rest',
  pushingKnock: (f) => f.knockChoice === 'push',
  // W6c: re-derived through `bodyGroupOf` off the injury's own `kind`, independently of the licence -
  // so a leg line on a wrist week is a failing test, which is exactly what shipped and what the owner
  // caught by reading.
  bodyGroup: (f, value) => f.injured !== null && bodyGroupOf(f.injured.kind) === value,
  birthday: (f) => f.birthdayAge !== null,
  // ⭐ R52 F3 – the step her feel read, re-derived off the FACT and not off `heardAtTable` in weekNotes.ts that produced
  // the line: a second spelling, so a licence and its claim cannot be wrong together. VALUED, and `too-early` fails by
  // name – no line may claim it, and a table that only knew five values would wave a sixth through.
  coachFeelRead: (f, value) => f.coachFeelRead !== undefined && f.coachFeelRead === value && value !== 'too-early',
  // ⭐ R52 J1 – the band that shut the checkpoint, re-derived off the FACT and off the diary's own `bondBand` rather than off `silentAtTable` in weekNotes.ts that produced the line: a second spelling, and a third
  // (the bond band the fact was derived from) that must agree with it. VALUED, and only the two shut bands pass: a line may not claim `steady`, where she does confide.
  coachTalkShut: (f, value) => f.coachTalkShut !== undefined && f.coachTalkShut === value && f.bondBand === value && (value === 'strained' || value === 'cold'),
  // ⭐ v72 – the three claims her own voice carries, each re-derived off the facts and NOT off the
  // predicate in weekNotes.ts that produced the line. Same method as every entry above: a second
  // spelling, so a licence and its claim cannot be wrong together.
  voice: (f, value) => f.temperament === value,
  // ⭐ wave B – the stage dictionary, re-derived off `lifeStage` independently of STAGE_LICENSE,
  // the predicate that produced the line: a second spelling, so a table-side line reaching a
  // college week is a failing test, not a style slip. ⚠ FOUR EXACT VALUES NOW (11.09, «4 полосы»),
  // never a band: a band was the old rail, and a band is what let one dictionary serve a
  // fourteen-year-old and a nineteen-year-old – the second editorial review's lead finding.
  rail: (f, value) => f.lifeStage === value,
  // ⚠ THE THREE REGISTER VALUES DO NOT ALL MEAN "EQUALS", and the asymmetry is the approved doc's
  // rather than a convenience: `level` is defined there as «the one variant that is not a low week»,
  // so a level line says only that her week was not a bad one – which is all its words rest on.
  register: (f, value) => (value === 'level' ? f.moodRegister !== 'low' : f.moodRegister === value),
  // ⚠ "close enough to speak in her own voice" – BOTH warm bands, not «bond ≥ 80». See the claim's
  // own note in weekNotes.ts for why the doc's name and this predicate are not the same sentence.
  closeBond: (f) => f.bondBand === 'close' || f.bondBand === 'steady',
  strainedBond: (f) => f.bondBand === 'strained',
  // ⭐⭐ v74 (the private life, wave 3 – T6) – THE ONE THING THE DIARY MAY KNOW ABOUT HER PRIVATE
  // LIFE, re-derived off the FACT and not off the licence in weekNotes.ts that produced the line,
  // which is this whole table's method. It is an identity here for the same reason `vacation`,
  // `offSeason` and `exams` are: the fact is already a boolean the engine computed, and the second
  // spelling a valued claim needs (`bodyGroup`, `rail`) has nothing to re-derive from.
  //
  // ⚠⚠ AND WHAT IT FORBIDS IS THE POINT. A line licensed on this may say that the parent KNOWS there
  // is someone, and nothing further: no name, no gender, no «since when», no «how it is going» – the
  // schema persists none of them (see `LoveEpisode`), so any of those would be an unlicensed
  // consequential fact under the honesty law's first tier. The claim carries the knowledge and the
  // reviewer carries the rest.
  //
  // ⚠ THE CONSUMING LICENCE IS T10's (the wave's diary band) and lands in this same wave – R2-18's
  // law. The `{ partnerKnown: true }` shape in `sweepStages` is what keeps the axis from being the
  // R2-18 failure itself: without it every such line would be licensed in NO fixture of ANY sweep.
  partnerKnown: (f) => f.partnerKnown,
  // ⭐⭐ v75 (the private life, wave 4 – T6) – THE MARK AN ENDING LEFT ON HER, re-derived off the FACT
  // and not off the licence in weekNotes.ts that produced the line, which is this whole table's
  // method. An identity for `partnerKnown`'s own stated reason: the fact is already a boolean the
  // engine computed, and a valued claim's second spelling (`bodyGroup`, `rail`) has nothing here to
  // re-derive from.
  //
  // ⚠⚠ AND WHAT IT DOES **NOT** LICENSE IS THE HALF WORTH READING. It is not a claim about the
  // PARENT: `rollEnds` stamps the shock whether or not he has ever been told there was anybody, so a
  // line licensed on this is selectable across a whole band of weeks in which he knows of no person
  // and no ending. «We know it is over» and «She told us it ended» are both unlicensed here, and
  // neither would be caught by any mechanical check – the claim carries the mark on her, the reviewer
  // carries the rest. It licenses no CAUSE either: the engine writes a date and models no reason.
  //
  // ⚠ THE CONSUMING LICENCE IS T6's OWN (the four lines in `weekNotes.ts`) and lands in this same
  // task – R2-18's law. The two `{ freshBreakup: … }` shapes in `sweepStages` are what keep the axis
  // from being the R2-18 failure itself, and the case below counts the visits.
  freshBreakup: (f) => f.freshBreakup,
  // ⭐ v83 (wave 7 – T5) – THE SPOUSE SAID SOMETHING THIS WEEK: the second spelling of the claim,
  // re-derived off the fact and never off the licence (the table's whole method). The four
  // `{ spouseOccasion: … }` shapes in `sweepStages` arm it, and the reached case below counts the
  // visits PER LINE, because the band licenses on four different occasion values.
  spouseSpoke: (f) => f.spouseOccasion !== null,
  // ⭐ v83 (wave 7 – T10) – SHE GOT HER OWN PLACE THIS WEEK: the second spelling, off the fact.
  // The `{ ownKeyWeek: true }` shape in `sweepStages` arms it; the reached case below counts.
  ownKey: (f) => f.ownKeyWeek,
  // ⭐⭐⭐ wave 8b T2 (C6) – WHICH BAND OF THE MOTHERHOOD ARC THIS WEEK IS IN: a VALUED claim, so the
  // second spelling has something real to re-derive (`bodyGroup` and `rail` are the precedent, and
  // the reason a boolean would not do – seven bands and one flag would make «she is somewhere in the
  // arc» the whole of every claim, and an announcement line would be licensed on a birth week).
  //
  // ⚠⚠ WHAT IT DOES NOT LICENSE. Nothing about the one she married – §0's decoupling ruling, and the
  // band's own case below walks the pool and refuses any line that names a partner. Nothing about a
  // figure or a date. And nothing about her INTERIOR as fact: the parent sees a week and reports it,
  // which is the fallible-parent law the break-up band was built under.
  motherhood: (f, value) => f.motherhoodBand === value,
  // ⭐⭐ wave 8b T2 (C6) – AND THE GRADE HE ANSWERED WITH, off the fact. It is the second gate on
  // exactly one line of the band, and the `{ motherhoodBand: 'postpartum', motherhoodSupport: 'warm' }`
  // shape in `sweepStages` is what arms it.
  warmSupport: (f) => f.motherhoodSupport === 'warm',
  // ⭐⭐⭐ v87 (the weight, wave 11 – T5) – AND THE DEATH IN THE FAMILY, off the fact. A bare
  // membership rather than a value, because the claim is bare: there are no named stages of grief in
  // this model, so what the claim asserts is «there has been one», and WHICH WEEKS a line may speak
  // in is the licence's job. ⚠ It re-derives off `bereavedWeeksAgo` rather than off the licence,
  // which is R2-18's law and the whole reason this record exists.
  bereaved: (f) => f.bereavedWeeksAgo !== null,
  // ⭐⭐⭐ v88 (the parting, wave 12 – T4) – AND THE MARRIAGE THAT ENDED, off the fact. A bare
  // membership rather than a value, `bereaved`'s own call: there are no named stages of a parting in
  // this model, so what the claim asserts is «there has been one» and WHICH WEEKS a line may speak
  // in is the licence's job. ⚠ It re-derives off `divorcedWeeksAgo` rather than off the licence,
  // which is R2-18's law and the whole reason this record exists.
  divorced: (f) => f.divorcedWeeksAgo !== null,
  // ⭐⭐⭐ v88 (wave 12 – T4.2) – AND THE FORK'S AFTERMATH, off the fact AND ITS VALUE. The first
  // VALUED claim since `motherhood`, and the value is what makes the check worth having: a line
  // written for «she was overridden» licensed onto a week she was heard would be the single worst
  // thing this pool could do, and `f.forkAftermath === value` is the whole of the guard against it.
  forkAftermath: (f, value) => f.forkAftermath === value,
}

describe('W2 — the ordinary week note is HONEST', () => {
  it('every licensed line asserts only what the week actually carries', () => {
    let checked = 0
    for (const f of sweepAll()) {
      for (const note of WEEK_NOTES) {
        if (!note.license(f)) continue
        for (const [claim, value] of Object.entries(note.claims)) {
          // ⚠ W6c REMOVED `if (value !== true) continue`. It was defensive against nothing (every claim
          // was a bare `true`) right up until `bodyGroup` carried a value - at which point it would have
          // waved the one claim through that most needed checking. `undefined` still skips, because an
          // absent claim asserts nothing; anything present is now verified against its value.
          if (value === undefined) continue
          // ⚠⚠ THE MESSAGE IS BUILT ONLY WHEN THE CLAIM FAILS, AND THAT IS THE WHOLE FIX (09.09).
          // `expect(cond, msg)` evaluates `msg` EAGERLY, so the template below - a full `render()` of
          // the line plus a `JSON.stringify` of nine fields - was running on every PASSING combination
          // too. Wave 1 added `sweepVoices` (a nine-deep product) and 52 lines to the pool, and the
          // string work it multiplied is what put this test over CI's 20s per-test timeout while it
          // still passed locally in 5.2s. The assertion is unchanged and still visits every
          // combination; only the diagnostics moved off the hot path.
          if (!HOLDS[claim](f, value)) {
            expect(
              HOLDS[claim](f, value),
              `"${render(note, f)}" claims ${claim} on: ${JSON.stringify({
                train: f.trainPct, band: f.conditionBand, funds: f.fundsPressure,
                exams: f.examsWeek, off: f.offSeasonWeek, vac: f.vacationWeek,
                practice: f.playedPractice, injured: f.injured !== null,
                knock: f.knockChoice,
              })}`,
            ).toBe(true)
          }
          checked++
        }
      }
    }
    expect(checked, 'the sweep has to actually reach the pool').toBeGreaterThan(500)
  })

  it('⭐ v74 T10 – and `HOLDS.partnerKnown` is REACHED, not decoration', () => {
    // ⚠⚠ THE ENTRY LANDED IN T6 WITH THE FACT AND HAD NO CONSUMER UNTIL T10, which is precisely the
    // state R2-18's law forbids a wave to ship in: a checker for a claim nothing makes is green for
    // the same reason an empty pool is. The sweep above would pass identically with the band deleted,
    // so this counts the visits – if the band ever goes away, or its licence stops being reachable in
    // ANY fixture of ANY sweep, this fails by name rather than passing quietly.
    let licensed = 0
    for (const f of sweepAll()) {
      for (const note of WEEK_NOTES) {
        if (!note.license(f) || note.claims.partnerKnown === undefined) continue
        licensed++
        expect(
          HOLDS.partnerKnown(f, true),
          `"${render(note, f)}" claims partnerKnown on a career nobody has been mentioned in`,
        ).toBe(true)
      }
    }
    expect(licensed, 'no line claims the fact – then HOLDS.partnerKnown proves nothing').toBeGreaterThan(0)
  })

  it('⭐ v75 T6 – and `HOLDS.freshBreakup` is REACHED, not decoration', () => {
    // T10's case above, one wave on, and for the same reason: a checker for a claim nothing makes is
    // green exactly as an empty pool is, and the sweep would pass identically with the band deleted.
    let licensed = 0
    // ⭐⭐ AND IT COUNTS PER LINE, NOT JUST IN TOTAL, WHICH IS THE HALF T10's CASE DOES NOT HAVE.
    // A total above zero is satisfied by ONE reachable line, so a band whose register-scoped line is
    // licensed in no fixture of any sweep would pass on its three neighbours – which is precisely the
    // R2-18 failure this case is named after, surviving inside its own guard. The fourth line claims
    // `register: 'low'` and only the second `{ freshBreakup: … }` shape in `sweepStages` reaches it;
    // remove that shape and this goes red BY LINE rather than staying quietly green.
    const seen = new Set<string>()
    const band = WEEK_NOTES.filter((n) => n.claims.freshBreakup !== undefined)
    for (const f of sweepAll()) {
      for (const note of WEEK_NOTES) {
        if (!note.license(f) || note.claims.freshBreakup === undefined) continue
        licensed++
        seen.add(render(note, f))
        expect(
          HOLDS.freshBreakup(f, true),
          `"${render(note, f)}" claims freshBreakup on a career where nothing of hers has ended`,
        ).toBe(true)
      }
    }
    expect(licensed, 'no line claims the fact – then HOLDS.freshBreakup proves nothing').toBeGreaterThan(0)
    expect(seen.size, 'every line of the band is licensed in SOME fixture of SOME sweep').toBe(band.length)
  })

  it('⭐⭐⭐ v87 T5 – the bereaved band is REACHED, every voice, and the window is what bounds it', () => {
    // THE SAME CASE ONE WAVE ON, AND FOR THE SAME REASON: a checker for a claim nothing makes is
    // green exactly as an empty pool is. ⚠ IT COUNTS PER LINE, so a voice whose line is licensed in
    // no fixture goes red BY LINE rather than hiding behind its three neighbours – the R2-18 failure
    // this family of cases is named after.
    const seen = new Set<string>()
    const band = WEEK_NOTES.filter((n) => n.claims.bereaved !== undefined)
    expect(band.length, 'four voices over the weeks after').toBe(4)
    let licensed = 0
    for (const f of sweepAll()) {
      for (const note of WEEK_NOTES) {
        if (!note.license(f) || note.claims.bereaved === undefined) continue
        licensed++
        seen.add(render(note, f))
        expect(
          HOLDS.bereaved(f, true),
          `"${render(note, f)}" claims a death in the family on a career that has met none`,
        ).toBe(true)
        // ⚠⚠ AND THE WINDOW IS ASSERTED HERE RATHER THAN TRUSTED, which is the half the `bereaved`
        // claim cannot carry: the claim says «there has been one», and the LICENCE is what says the
        // diary may still speak of it. The `{ bereavedWeeksAgo: 60 }` shapes in `sweepStages` are a
        // real corpus of weeks outside the window, so a licence that dropped `<= BEREAVED_WEEKS`
        // would reach them and redden this line.
        expect(f.bereavedWeeksAgo, `"${render(note, f)}" speaks long after the week it is about`)
          .toBeLessThanOrEqual(BEREAVED_WEEKS)
      }
    }
    expect(licensed, 'no line claims the fact – then HOLDS.bereaved proves nothing').toBeGreaterThan(0)
    expect(seen.size, 'every voice of the band is licensed in SOME fixture of SOME sweep').toBe(band.length)
  })

  it('⭐⭐⭐ v88 (wave 12 T4) – and `HOLDS.divorced` is REACHED, per line, with its window', () => {
    // The bereavement case one wave on, same shape and same two halves: the claim is proved per
    // LINE (so a voice that rots unreachable reddens) and the WINDOW is asserted beside it (so a
    // licence that forgot `<= DIVORCED_WEEKS` reaches the `{ divorcedWeeksAgo: 60 }` shapes and
    // fails here rather than shipping a scrap about a marriage that ended a year ago).
    const seen = new Set<string>()
    const band = WEEK_NOTES.filter((n) => n.claims.divorced !== undefined)
    expect(band.length, 'four voices over the weeks after').toBe(4)
    let licensed = 0
    for (const f of sweepAll()) {
      for (const note of WEEK_NOTES) {
        if (!note.license(f) || note.claims.divorced === undefined) continue
        licensed++
        seen.add(render(note, f))
        expect(
          HOLDS.divorced(f, true),
          `"${render(note, f)}" claims a divorce on a career that has not had one`,
        ).toBe(true)
        expect(f.divorcedWeeksAgo, `"${render(note, f)}" speaks long after the week it is about`)
          .toBeLessThanOrEqual(DIVORCED_WEEKS)
      }
    }
    expect(licensed, 'no line claims the fact – then HOLDS.divorced proves nothing').toBeGreaterThan(0)
    expect(seen.size, 'every voice of the band is licensed in SOME fixture of SOME sweep').toBe(band.length)
  })

  it('⭐⭐⭐ v88 (wave 12 T4.2) – the fork\'s aftermath is ONE week, both arms, and never crossed', () => {
    // ⚠⚠ THE CROSS-ARM CHECK IS THE POINT OF THIS CASE and is what a bare «is it reached» would
    // miss: eight lines, four of them written for a parent who did as she asked and four for one who
    // did not, and a licence that read the FACT without its VALUE would license all eight on both
    // arms. `HOLDS.forkAftermath` takes the value for exactly this.
    const band = WEEK_NOTES.filter((n) => n.claims.forkAftermath !== undefined)
    expect(band.length, 'four voices x two arms').toBe(8)
    const seen = new Set<string>()
    let licensed = 0
    for (const f of sweepAll()) {
      for (const note of WEEK_NOTES) {
        if (!note.license(f) || note.claims.forkAftermath === undefined) continue
        licensed++
        seen.add(render(note, f))
        expect(
          HOLDS.forkAftermath(f, note.claims.forkAftermath),
          `"${render(note, f)}" claims the ${String(note.claims.forkAftermath)} arm on the other one`,
        ).toBe(true)
        // ⚠ AND IT IS ONE WEEK: the fact is null on every week but the one the fork resolves on, so
        // a licence that widened the window would reach a fixture with no aftermath at all.
        expect(f.forkAftermath, 'a scrap about the fork on a week the fork did not resolve').not.toBeNull()
      }
    }
    expect(licensed, 'no line claims the fact – then HOLDS.forkAftermath proves nothing').toBeGreaterThan(0)
    expect(seen.size, 'every one of the eight is licensed in SOME fixture of SOME sweep').toBe(band.length)
  })

  it('⭐ v83 (wave 7 T5) – and `HOLDS.spouseSpoke` is REACHED, per line, not decoration', () => {
    // The freshBreakup case above, one wave on and stricter by construction: the band's four lines
    // license on four DIFFERENT occasion values, so a total above zero would be satisfied by one
    // reachable occasion while three lines rot unreachable. The four `{ spouseOccasion: … }` shapes
    // in `sweepStages` are what this counts – remove any one and this goes red BY LINE.
    let licensed = 0
    const seen = new Set<string>()
    const band = WEEK_NOTES.filter((n) => n.claims.spouseSpoke !== undefined)
    expect(band.length, 'one line per occasion family – the brief\'s own count').toBe(4)
    for (const f of sweepAll()) {
      for (const note of WEEK_NOTES) {
        if (!note.license(f) || note.claims.spouseSpoke === undefined) continue
        licensed++
        seen.add(render(note, f))
        expect(
          HOLDS.spouseSpoke(f, true),
          `"${render(note, f)}" claims spouseSpoke on a week the spouse said nothing`,
        ).toBe(true)
      }
    }
    expect(licensed, 'no line claims the fact – then HOLDS.spouseSpoke proves nothing').toBeGreaterThan(0)
    expect(seen.size, 'every line of the band is licensed in SOME fixture of SOME sweep').toBe(band.length)
  })

  it('⭐ v83 (wave 7 T10) – and `HOLDS.ownKey` is REACHED, not decoration', () => {
    // T10's own one-line band, counted the way its three elder siblings are: the sweep would pass
    // identically with the line deleted, so the visits are counted and the `{ ownKeyWeek: true }`
    // shape in `sweepStages` is what this holds in place.
    let licensed = 0
    for (const f of sweepAll()) {
      for (const note of WEEK_NOTES) {
        if (!note.license(f) || note.claims.ownKey === undefined) continue
        licensed++
        expect(
          HOLDS.ownKey(f, true),
          `"${render(note, f)}" claims ownKey on a week she moved nowhere`,
        ).toBe(true)
      }
    }
    expect(licensed, 'no line claims the fact – then HOLDS.ownKey proves nothing').toBeGreaterThan(0)
  })

  it('⭐⭐⭐ wave 8b T2 – `HOLDS.motherhood` is REACHED, PER LINE, and the warm gate with it', () => {
    // The `spouseSpoke` case above, one wave on and wider: the band's eight lines license on SEVEN
    // different band values plus one support grade, so a total above zero would be satisfied by a
    // single reachable band while seven lines rot unreachable. The eight `{ motherhoodBand: … }`
    // shapes in `sweepStages` are what this counts – remove any one and this goes red BY LINE.
    let licensed = 0
    const seen = new Set<string>()
    const band = WEEK_NOTES.filter((n) => n.claims.motherhood !== undefined)
    // ⚠ RE-AIMED 21.09 BY WAVE 9's T4. His eight are untouched; what joined them is the four-voice
    // cross wave 8b deferred BY NAME («a four-voice pregnancy band would be 32 more; W5's, on the
    // record, not dropped»). Seven bands x four voices = 28, plus his 8 = 36. ⚠ The number is
    // spelled as the arithmetic rather than as «36» so a voice or a band going missing reads as the
    // hole it is instead of as an off-by-one.
    expect(band.length, 'his eight, plus seven bands in four voices').toBe(8 + 7 * 4)
    for (const f of sweepAll()) {
      for (const note of WEEK_NOTES) {
        if (!note.license(f) || note.claims.motherhood === undefined) continue
        licensed++
        seen.add(render(note, f))
        expect(
          HOLDS.motherhood(f, note.claims.motherhood),
          `"${render(note, f)}" claims ${note.claims.motherhood} on a week that is not in that band`,
        ).toBe(true)
        // ⚠ AND THE SECOND GATE, CHECKED WHERE IT IS CLAIMED. This is the half the task
        // mutation-verified: drop `&& f.motherhoodSupport === 'warm'` from line seven's licence and
        // this assertion goes red on the `measured`/null postpartum fixtures.
        if (note.claims.warmSupport !== undefined) {
          expect(
            HOLDS.warmSupport(f, true),
            `"${render(note, f)}" claims a warm answer on a career that did not get one`,
          ).toBe(true)
        }
      }
    }
    expect(licensed, 'no line claims the fact – then HOLDS.motherhood proves nothing').toBeGreaterThan(0)
    expect(seen.size, 'every line of the band is licensed in SOME fixture of SOME sweep').toBe(band.length)
  })

  it('⭐⭐⭐ wave 8b T2 – THE BAND IS HUSBAND-AGNOSTIC, and that is the acceptance criterion', () => {
    // ⚠⚠ §0's DECOUPLING RULING MADE MECHANICAL («развелись и развелись, жизнь продолжается»). The
    // pregnancy record reads `world.pregnancy` and NOTHING about whether the marriage still stands –
    // `pauseCovering`'s own note says a liveness check there would re-open the entries under a woman
    // seven months pregnant – so every band of this arc fires on a career whose marriage ended
    // mid-term, and the birth fires anyway. A line naming him would therefore be FALSE on exactly
    // the careers that ruling exists to protect.
    //
    // ⚠ THE POSITIVE CONTROL COMES FIRST AND IS NOT THE SAME ASSERTION: proving «no line does X» over
    // an empty band passes forever, so the band's existence is established before anything about it
    // is denied. And the ban is checked against the RENDERED text, which is what a player reads.
    const band = WEEK_NOTES.filter((n) => n.claims.motherhood !== undefined)
    expect(band.length, 'the band has to exist before anything is claimed about it').toBe(8 + 7 * 4)
    // ⚠ WORD BOUNDARIES, NOT SUBSTRINGS. «the» contains «he» and «brother» contains «other»; a
    // substring ban would either pass by accident or fail every line in the pool.
    const PARTNER_WORDS = /\b(he|him|his|husband|wife|spouse|partner|married|marriage|father|dad)\b/i
    for (const n of band) {
      const text = typeof n.text === 'string' ? n.text : n.text(homeWeek({}))
      expect(
        PARTNER_WORDS.test(text),
        `⚠ "${text}" names a partner – the band must read correctly on a career whose marriage ended`,
      ).toBe(false)
      // ...and no persisted partner NAME either. The episode has carried one since wave 7 and no
      // surface speaks it; this band does not become the first by accident.
      for (const name of PARTNER_NAME_POOL) {
        expect(text.includes(name), `⚠ "${text}" speaks the persisted partner name «${name}»`).toBe(false)
      }
    }
    // ⚠ AND THE BAN IS REAL RATHER THAN VACUOUS: the pattern must actually fire on a sentence that
    // names him. Without this the regex could rot to /$^/ and every line above would pass.
    expect(PARTNER_WORDS.test('The one she married said nothing.'), 'control: the ban can fire').toBe(true)
  })

  it('⭐⭐⭐ v75 T6 – THE BAND IS SELECTABLE WHILE THE PARENT KNOWS NOTHING, which is the whole finding', () => {
    // ⚠⚠ THE PROPERTY, AND WHY NO OTHER CASE IN THIS FILE HOLDS IT. `rollEnds` stamps `spiritShock`
    // on `endedWeek` whether or not the parent has ever been told there was anybody, and the
    // told-late scene is built on exactly that gap – so `freshBreakup` is TRUE across a reachable
    // band of weeks where `partnerKnown` is FALSE and he knows of no person and no ending. Every one
    // of the four lines is written to be true there. A later editor who "tidies" the licence by
    // adding `&& f.partnerKnown`, or who rewrites a line into «we know it is over», is making the
    // band false on its commonest week – and this is the case that says so by name.
    //
    // ⚠ THE POSITIVE CONTROL COMES FIRST AND IS NOT THE SAME ASSERTION. Proving «no line does X» over
    // an empty band passes forever, so the band's existence is established before anything about it
    // is denied.
    const band = WEEK_NOTES.filter((n) => n.claims.freshBreakup !== undefined)
    expect(band.length, 'the band has to exist before anything is claimed about it').toBeGreaterThanOrEqual(3)
    for (const n of band) {
      expect(n.claims.partnerKnown, `${render(n, homeWeek({}))}: the two facts are not one`).toBeUndefined()
      expect(n.claims.domestic, `${render(n, homeWeek({}))}: the hazard runs at every stage`).toBeUndefined()
    }
    // ...and it is really SELECTABLE in that state, at every stage, which is the licence half.
    for (const lifeStage of STAGES) {
      const f = homeWeek({
        lifeStage,
        schoolOver: lifeStage !== 'school',
        ageYears: lifeStage === 'school' ? 15 : 24,
        freshBreakup: true,
        partnerKnown: false,
        moodRegister: 'low',
      })
      const live = band.filter((n) => n.license(f))
      expect(live.length, `${lifeStage}: the band is unreachable while he knows nothing`).toBe(band.length)
    }
    // ...and it is NOT selectable when the mark has cleared – the other side of the same licence.
    const healed = homeWeek({ freshBreakup: false, partnerKnown: false, moodRegister: 'low' })
    expect(band.filter((n) => n.license(healed)), 'a cleared shock still speaks').toEqual([])
  })

  it('⚠ W6c: NO LINE NAMES A BODY PART THAT IS NOT HERS – read the sentence, not the claim', () => {
    // THE GUARD THE OWNER'S OWN READING IS. He found «She revised with her leg up on a chair» on a girl
    // with a strained wrist by looking at it, and no machine in this repo could have: `WeekClaims` is a
    // vocabulary of week TYPES, so "claims exams on a non-exam week" was catchable and "claims a leg on
    // an arm" was not expressible. The `bodyGroup` claim closes that for lines that DECLARE a group.
    //
    // This closes it for the ones that FORGET to. It reads the rendered sentence and asks whether any
    // anatomy word in it is hers - so a future line that names an ankle without claiming `bodyGroup`
    // fails here rather than shipping. Two independent nets over the same mistake, which is the right
    // number for a mistake that reached the owner.
    //
    // ⚠ THE VOCABULARY IS ANATOMY ONLY, AND DELIBERATELY NOT THE OBVIOUS LONGER LIST. "back" is absent:
    // «she is back on court» is a sentence this pool is entitled to write, and a guard that fails on it
    // would be retired within a week. So the words are the twelve region names plus the two group nouns
    // the new lines actually use. That leaves a hypothetical future line saying "her back" for an ankle
    // uncaught - a real gap, stated rather than papered over, and the `bodyGroup` claim is the net that
    // covers it.
    const ANATOMY: { word: string; group: BodyGroup }[] = [
      ...BODY_REGIONS.map((r) => ({ word: r.part, group: bodyGroupOf(r.part)! })),
      { word: 'leg', group: 'leg' as BodyGroup },
      { word: 'handed', group: 'arm' as BodyGroup }, // "one-handed", "left-handed"
    ]
    let checked = 0
    for (const f of sweepAll()) {
      const hers = f.injured === null ? null : bodyGroupOf(f.injured.kind)
      for (const note of WEEK_NOTES) {
        if (!note.license(f)) continue
        const sentence = render(note, f).toLowerCase()
        for (const { word, group } of ANATOMY) {
          if (!new RegExp(`\\b${word}\\b`).test(sentence)) continue
          checked++
          // it may name her own part, or any part in her own group - never another group's
          expect(
            group,
            `"${render(note, f)}" says "${word}" (${group}) on a ${hers ?? 'healthy'} week` +
              `${f.injured ? ` – she has a ${f.injured.kind}` : ''}`,
          ).toBe(hers ?? group)
        }
      }
    }
    expect(checked, 'the sweep has to actually reach lines that name a part').toBeGreaterThan(50)
  })

  it('W6c: a kind whose part cannot be resolved goes QUIET rather than guessing', () => {
    // A persisted `kind` from an older save, or one the table no longer recognises. The group lines must
    // be unselectable - not fall back to a plausible-looking leg - and the generic layoff lines must
    // still cover the week, or an unresolvable injury would leave the scrap empty.
    const f = homeWeek({ injured: { kind: 'unspecified complaint', weeksRemaining: 3, totalWeeks: 6 } })
    const licensed = WEEK_NOTES.filter((n) => n.license(f))
    expect(licensed.filter((n) => n.claims.bodyGroup), 'no group line may be selectable').toEqual([])
    expect(licensed.length, 'the week still has to have something to say').toBeGreaterThan(0)
    expect(weekNoteFor(f, 'unresolved-1')).not.toBeNull()
    // ...and nothing it can say names a part
    for (const n of licensed) expect(render(n, f)).not.toMatch(/\binjury\b/)
  })

  it('W6c: every region is placed in a group, in both directions', () => {
    // A thirteenth region added to the draw table without being placed would silently answer null and
    // go quiet - which is safe, and invisible. This makes it loud.
    for (const r of BODY_REGIONS) {
      expect(bodyGroupOf(r.part), `${r.part} has no group`).not.toBeNull()
      expect(bodyPartOf(`${r.part} strain`), `${r.part} is not resolvable from a kind`).toBe(r.part)
    }
    // and the multi-word region really survives the lookup, which the naive split-on-space does not
    expect(bodyPartOf('lower back soreness')).toBe('lower back')
    expect(bodyGroupOf('lower back soreness')).toBe('trunk')
    expect(bodyPartOf('nothing recognisable')).toBeNull()
    // every group is reachable, or a group-licensed band would be dead copy
    expect(new Set(BODY_REGIONS.map((r) => bodyGroupOf(r.part)))).toEqual(new Set(['leg', 'arm', 'trunk']))
  })

  it('an injured week is not offered a line about baking', () => {
    // Same rule the journey home keeps: a layoff TAKES the note. A pool that also licensed "she had
    // time to be fifteen this week" on the week the ice pack came out would draw it most of the time.
    //
    // ⚠ RE-AIMED BY v74 T10, AND WIDENED RATHER THAN CHANGED. What moved: the walk is `sweepAll()`
    // instead of `sweepWeeks()`. Why: `sweepWeeks` holds `lifeStage` at 'school', `partnerKnown` at
    // false and the three voice axes fixed, so this rule – the one that keeps the page from reading
    // as though the game had not noticed she is hurt – was structurally BLIND to every stage-gated,
    // voiced and (now) `partnerKnown`-licensed line in the pool. Measured: T10's own ARM 4 (the band
    // relaxed from `plainTraining` to `notTravellingWeek`, i.e. reaching a layoff) left this case
    // GREEN before the widening and reddens it after. The rule is unchanged; the space it is checked
    // over grew from one sweep to three.
    for (const f of sweepAll()) {
      if (f.injured === null) continue
      const licensed = WEEK_NOTES.filter((n) => n.license(f))
      expect(licensed.length, 'a layoff week must still have words').toBeGreaterThan(0)
      for (const n of licensed) expect(n.claims.injured, `"${render(n, f)}" on a layoff week`).toBe(true)
    }
  })

  // ===============================================================================================
  // ⚠⚠ R2-18 — THE ADULT KNOWLEDGE LICENCE, BY FACT AND NOT BY A LIST OF WORDS
  // ===============================================================================================
  //
  // THIS TEST USED TO BE A BLACKLIST and the review is right that a blacklist is the wrong shape:
  //
  //     expect(line).not.toMatch(/homework|garage door|we said no|doctor's orders, and ours|
  //                               taller than her mother|before we were up|machine has not stopped|
  //                               spent on the sofa/i)
  //
  // Seven substrings, hand-picked from the lines that existed the day it was written, run over five
  // fixtures. It passed for a year while «Ice on her knee in front of the television», «Band
  // exercises for the wrist, in front of the hall mirror», «Ten minutes of core work on a mat in the
  // hall» and «She has stopped picking things up off the floor» were all licensed on a woman of
  // thirty-one living four hundred miles away – because none of them contains one of the seven
  // words. A blacklist is bypassed by the next synonym, and here the next synonym was every one.
  //
  // ⚠ SO THE CLAIM REPLACES THE WORDS. `domestic` is what a line ASSERTS about the parent's
  // vantage point; `lifeStage` is what the week SAYS about it; and the honesty pin above already
  // holds every claim against its fact over the whole licence space, which now includes the stage.
  // A new line describing the airing cupboard is caught by the same rule as the hall mirror, with no
  // list to keep up to date - and a line that FORGETS the claim is caught by the second half below,
  // which is the mechanical net over the mistake the claim itself cannot see.
  it('⚠ NO LINE CLAIMS THE PARENT WAS THERE ON A WEEK SHE WAS NOT UNDER THEIR ROOF', () => {
    let away = 0
    let athome = 0
    for (const f of sweepAll()) {
      const underOneRoof = f.lifeStage === 'school' || f.lifeStage === 'after-school'
      for (const note of WEEK_NOTES) {
        if (!note.license(f) || !note.claims.domestic) continue
        if (underOneRoof) {
          athome++
          continue
        }
        away++
        expect.fail(`"${render(note, f)}" is licensed at lifeStage "${f.lifeStage}"`)
      }
    }
    expect(away).toBe(0)
    // ...and the guard has to have something to guard: these lines EXIST and are licensed at home.
    expect(athome, 'no domestic line is licensed anywhere - then this pin proves nothing').toBeGreaterThan(100)
  })

  it('⚠ ...AND EVERY STAGE STILL HAS WORDS – the licence is a filter, not a silence', () => {
    // THE COST OF THE RULE, MEASURED RATHER THAN HOPED FOR, and the LAYOFF is where it fell. Nine of
    // the lines gated by `domestic` are layoff lines – the ice timed twice a day, the counting out
    // loud, the mat in the hall, the floor – so before the replacements were written the college
    // arm and trunk pools were ONE line each. A layoff runs up to twenty-two weeks and the layoff
    // band ALWAYS SPEAKS, so a pool of one is the same sentence for five months: a different defect,
    // not a fix. Six stage-neutral lines were written for the bands that lost one.
    //
    // ⚠ THE FLOOR IS THREE AND IT IS SCOPED TO THE LAYOFF, both on measurement rather than taste.
    // Measured after the replacements, the injured pools are sch 5-9 / after-school 4-8 / college
    // 3-5 / independent 4-6, so three is the real floor with the thinnest case (college, an injury
    // whose `kind` resolves to no body group) sitting exactly on it. It is scoped because the
    // NON-injured bands have pre-existing minima of two that this wave did not create and does not
    // get to fail on – college off-season, a rested knock and a friendly were all two before it.
    for (const f of sweepStages()) {
      // ⚠ NOT THE EXAM FORTNIGHT. `examsWeek && injured` is its own two-line band (W6b) at the
      // school stage only, it is two lines today, it was two lines before this wave, and this wave
      // gated nothing in it. A floor that fails on a pre-existing state is a guard reporting
      // somebody else's decision as this branch's regression.
      if (f.injured === null || f.examsWeek) continue
      const pool = WEEK_NOTES.filter((n) => n.license(f))
      expect(
        pool.length,
        `only ${pool.length} line(s) for ${JSON.stringify({ stage: f.lifeStage, exams: f.examsWeek, injured: f.injured?.kind ?? null, knock: f.knockChoice })}`,
      ).toBeGreaterThanOrEqual(3)
    }
    // ...and the non-injured bands must still not go silent, which is the weaker claim they can bear.
    for (const f of sweepStages()) {
      expect(WEEK_NOTES.some((n) => n.license(f)), `nothing licensed at ${f.lifeStage}`).toBe(true)
    }
  })

  it('the adult weeks are still SPOKEN – the voice she gets is the one that reaches by phone', () => {
    const adult = { ageYears: 24, lifeStage: 'independent' as const, schoolOver: true }
    const weeks = [
      homeWeek({ ...adult, trainPct: 85, condition: 50 }),
      homeWeek({ ...adult, trainPct: 60 }),
      homeWeek({ ...adult, injured: { kind: 'ankle strain', weeksRemaining: 3, totalWeeks: 6 } }),
      homeWeek({ ...adult, knockChoice: 'rest', knockPart: 'ankle' }),
      homeWeek({ ...adult, birthdayAge: 24 }),
    ]
    const lines = weeks.flatMap((f) => WEEK_NOTES.filter((n) => n.license(f)).map((n) => render(n, f)))
    expect(lines.length).toBeGreaterThan(10)
    expect(lines.some((line) => /voice note|called|calendar|physio|her own/i.test(line))).toBe(true)
  })

  it('a hard week and an easy week can never be handed each other\'s words', () => {
    const grind = homeWeek({ trainPct: WEEK_PLAN_PRESETS.grind.train })
    const light = homeWeek({ trainPct: WEEK_PLAN_PRESETS.light.train })
    for (const n of WEEK_NOTES.filter((x) => x.license(grind))) expect(n.claims.light).toBeUndefined()
    for (const n of WEEK_NOTES.filter((x) => x.license(light))) expect(n.claims.grind).toBeUndefined()
    // ...and the middle of the ladder is offered neither.
    const balanced = homeWeek({ trainPct: WEEK_PLAN_PRESETS.balanced.train })
    for (const n of WEEK_NOTES.filter((x) => x.license(balanced))) {
      expect(n.claims.grind, render(n, balanced)).toBeUndefined()
      expect(n.claims.light, render(n, balanced)).toBeUndefined()
    }
  })

  it('never speaks on a week she was away – the journey note owns that scrap', () => {
    // One scrap, and it may not have two authors. `travelNote` is non-null on exactly the weeks
    // `travelHomeScene` is, so this pool's own licence has to be null on every one of them.
    for (const over of [
      { travelHomeScene: 'car' as const, travelHomeMood: 'sleepy' as const },
      { playedTournament: true },
      { travelled: true },
    ]) {
      expect(weekNoteFor(homeWeek(over), 'seed-a'), JSON.stringify(over)).toBeNull()
    }
  })
})

describe('W2 — the cadence: quiet most weeks, and the calendar always speaks', () => {
  it('an ordinary training week is quiet roughly two weeks in three', () => {
    let spoke = 0
    const weeks = 300
    for (let week = 1; week <= weeks; week++) {
      if (weekNoteFor(homeWeek({ week }), 'cadence-seed') !== null) spoke++
    }
    const share = spoke / weeks
    // A wide, non-flaky corridor around WEEK_NOTE_CHANCE. What matters is the SHAPE: it lands
    // sometimes and it is silent more often than not.
    expect(share).toBeGreaterThan(WEEK_NOTE_CHANCE - 0.12)
    expect(share).toBeLessThan(WEEK_NOTE_CHANCE + 0.12)
    expect(share, 'silence has to be the common case').toBeLessThan(0.5)
  })

  it('exams, the holiday, the off-season, a friendly, a layoff AND a knock speak EVERY time', () => {
    // ⚠ W4 ADDED THE LAST TWO, and for the pool's own reason rather than a new one: the coin exists
    // so that a week with NOTHING in it can be quiet. A week the player made a decision about is the
    // opposite of that - it is the one week the scrap must not fall back to a restringing receipt.
    const always: [string, Partial<DiaryFacts>][] = [
      ['exams', { examsWeek: true }],
      ['vacation', { vacationWeek: true }],
      ['off-season', { offSeasonWeek: true }],
      ['practice', { playedPractice: true }],
      ['layoff', { injured: { kind: 'ankle strain', weeksRemaining: 3, totalWeeks: 6 } }],
      ['knock rested', { knockChoice: 'rest', knockPart: 'ankle' }],
      ['knock pushed', { knockChoice: 'push', knockPart: 'shoulder' }],
    ]
    for (const [name, over] of always) {
      for (let week = 1; week <= 60; week++) {
        expect(weekNoteFor(homeWeek({ week, ...over }), 'always-seed'), `${name} w${week}`).not.toBeNull()
      }
    }
  })

  it('⚠ NO TWO CONSECUTIVE WEEKS of an always-speaking band read the same', () => {
    // BOTH OF THESE CAME OUT OF THE LIVE TRACE, not the suite, and they are the same bug:
    //   * W17/W18 both read "The lower back held. We watched her serve more closely than usual."
    //     (a pushed knock governs three weeks off a pool of four);
    //   * W50/W51 both read "The season is over. She slept until nine and it was glorious."
    //     (the off-season runs four weeks off a pool of three).
    // Every line was honest and correctly licensed, and the screen still looked broken. The bands that
    // ALWAYS speak now step through their pool off a career-stable entry point rather than drawing per
    // week, so adjacent weeks land on adjacent indices. This test walks every such band across a real
    // stretch of weeks and every seed it can reach.
    const bands: [string, Partial<DiaryFacts>][] = [
      ['knock pushed', { knockChoice: 'push', knockPart: 'lower back' }],
      ['knock rested', { knockChoice: 'rest', knockPart: 'ankle' }],
      ['off-season', { offSeasonWeek: true }],
      ['exams', { examsWeek: true }],
      ['vacation', { vacationWeek: true }],
      ['practice', { playedPractice: true }],
      ['layoff', { injured: { kind: 'ankle strain', weeksRemaining: 3, totalWeeks: 6 } }],
    ]
    for (const [name, over] of bands) {
      for (const seed of ['step-a', 'step-b', 'step-c', 'step-d']) {
        for (let week = 1; week < 60; week++) {
          const a = weekNoteFor(homeWeek({ week, ...over }), seed)
          const b = weekNoteFor(homeWeek({ week: week + 1, ...over }), seed)
          expect(a, `${name} must speak (w${week})`).not.toBeNull()
          expect(b, `${name} must speak (w${week + 1})`).not.toBeNull()
          expect(a, `${name} repeated across w${week}/w${week + 1} on ${seed}: "${a}"`).not.toBe(b)
        }
      }
    }
  })

  it('...and a long band walks its WHOLE pool rather than repeating its favourites', () => {
    // A 22-week layoff off a pool of three used to draw freely: the same sentence turned up in
    // clusters. Stepping guarantees the cycle.
    //
    // ⚠ RE-AIMED BY W6b, AND IT IS THE DENOMINATOR THAT WAS WRONG, NOT THE BEHAVIOUR. This counted the
    // band by CLAIM (`n.claims.injured`), which stopped meaning "the pool this week draws from" the
    // moment a second band claimed `injured` too - W6b's fortnight-inside-a-layoff lines. The sweep
    // still saw its correct 3 and the expectation had silently become 6. So the pool is now computed
    // the way `weekNoteFor` itself computes it - by LICENCE against these very facts - which is both
    // the honest denominator and immune to the next band that shares a claim.
    const layoff = { kind: 'ankle strain', weeksRemaining: 9, totalWeeks: 12 }
    const walk = (over: Partial<DiaryFacts>, seed: string) => {
      const said = new Set<string | null>()
      for (let week = 20; week < 32; week++) said.add(weekNoteFor(homeWeek({ week, ...over }), seed))
      return said
    }
    const poolFor = (over: Partial<DiaryFacts>) =>
      WEEK_NOTES.filter((n) => n.license(homeWeek({ week: 20, ...over }))).length

    expect(walk({ injured: layoff }, 'walk-1').size, 'a long layoff should see every line it has').toBe(
      poolFor({ injured: layoff }),
    )
    // W6b: and the fortnight INSIDE a layoff is a band like any other - it gets the same guarantee,
    // which is the whole reason it was written as a band instead of one line.
    expect(
      walk({ injured: layoff, examsWeek: true }, 'walk-2').size,
      'exams during a layoff should see every line that band has',
    ).toBe(poolFor({ injured: layoff, examsWeek: true }))
  })

  it('DETERMINISTIC, and stable for the whole week', () => {
    const f = homeWeek({ week: 31, trainPct: WEEK_PLAN_PRESETS.grind.train })
    const first = weekNoteFor(f, 'career-a')
    for (let i = 0; i < 40; i++) expect(weekNoteFor(f, 'career-a')).toBe(first)
    // ...and a different career says different things on the same week.
    const bySeed = new Set(Array.from({ length: 80 }, (_, i) => weekNoteFor(f, `career-${i}`)))
    expect(bySeed.size, 'a pool of one wearing a draw\'s clothes').toBeGreaterThan(2)
  })

  it('every week she spends at home has SOMETHING licensed – silence is the coin, not a gap', () => {
    // The distinction matters: the pool must never be empty for a reachable week, because then the
    // "quiet" weeks would be quiet for the wrong reason and no tuning of the coin could fix it.
    for (const f of sweepAll()) {
      expect(
        WEEK_NOTES.some((n) => n.license(f)),
        `nothing licensed for ${JSON.stringify({ train: f.trainPct, band: f.conditionBand, exams: f.examsWeek, off: f.offSeasonWeek, vac: f.vacationWeek, practice: f.playedPractice, injured: f.injured !== null, knock: f.knockChoice })}`,
      ).toBe(true)
    }
  })
})

describe('W2 — the note is the PARENT, and it fits on a scrap of paper', () => {
  // ⚠ RE-AIMED: RENDERED sentences, not raw fields (W4 templates). Same budget, same rules, and now
  // measured on the string the player reads - which for a template is the longer of the two.
  const texts = renderAll()

  // =================================================================================================
  // ⚠⚠⚠ WAVE 8b T2 – A **BASELINE WITH CUSTODY**, AND IT IS ON HIS DESK RATHER THAN CLOSED
  // =================================================================================================
  //
  // THE FINDING, measured while landing the eight motherhood lines he passed on 21.09: **his band
  // collides with two standing laws of this pool, and neither collision is a builder's to resolve.**
  //
  //   1. THE SCRAP (80 characters – «MUST, pinned» in `docs/specs/voice-bibles-2026-09.md`, the two
  //      other pools' own budget). FOUR of the eight are over it, measured on the rendered string:
  //        · «She stopped at the court by the school…»   **87** (+7)
  //        · «Some mornings she is at the window…»       **88** (+8)
  //        · «She asked me to hold the little one…»     **106** (+26)
  //        · «The bag is packed again…»                  **89** (+9)
  //      The other four fit (80 / 78 / 71 / 76), the first of them exactly.
  //   2. THE NARRATOR'S PERSON. Two of them put the diary in the SINGULAR first person outside any
  //      quotation – «**I** have not slept and **I** do not mind», «She asked **me** to hold the
  //      little one» – where the journal's own voice has been a household «we» for a year («We said
  //      no», «We watched her serve more closely than usual») and the 09.09 ruling put `I` / `me`
  //      inside HER quotation marks only.
  //
  // ⚠⚠ WHY THIS IS A BASELINE AND NOT AN EXEMPTION, AND THE DISTINCTION IS THIS FILE'S NEIGHBOUR'S.
  // `tests/wave3-tail-lint.test.ts` met exactly this shape and the repo's answer is written there:
  // «It was baselined rather than fixed because rewriting it is a WORDING change, which invariant 4
  // makes the owner's… ⚠ If a future violation is ever legitimately baselined here, it needs the same
  // custody – named, dated, and pointed at whoever owns the wording.» So: NAMED (each whole sentence,
  // never a pattern), DATED (21.09), and POINTED (his, both of them). An EXEMPTION would say the law
  // does not apply to this band; a BASELINE says these four sentences are outstanding and counts them
  // so a fifth cannot arrive quietly.
  //
  // ⚠ WHAT WAS **NOT** DONE, and both refusals are deliberate. Not one character of his copy was
  // changed – that is the move invariant 4 forbids outright. And neither law was loosened for the
  // pool: every other line in `WEEK_NOTES` is still held to 80 and to the third person, the count
  // assertions below stop the lists growing, and EDITING a baselined line re-arms both guards against
  // it, because the match is the whole sentence.
  //
  // ⚠ IT IS NOT A LAYOUT DEFECT, CHECKED RATHER THAN ASSUMED. `.recap-note-text` (WeekRecapCard.vue)
  // is a `<p>` with a font size and a line height and NO max-height, no clamp and no overflow, on a
  // scrollable card rather than a blocking overlay – so a 106-character note wraps to a third line
  // and the scrap grows. The budget's own stated reason is visual mass («the scrap has to stay a
  // scrap»), which is an editorial call and therefore his.
  //
  // THE ONE EDIT THAT CLOSES EACH, if he wants it: four shorter sentences, or one ruling that the
  // motherhood band keeps its own budget; and either his «I» stands as the band's voice or the two
  // lines move to «we».
  const HIS_2109_OVER_THE_SCRAP: readonly string[] = [
    'She stopped at the court by the school today and watched a whole set through the fence.',
    'Some mornings she is at the window before the baby wakes, looking at nothing we can see.',
    'She asked me to hold the little one while she stretched. Ten minutes, an old routine, and she was humming.',
    'The bag is packed again. Smaller than it used to be, and there are two of everything now.',
  ]
  const HIS_2109_FIRST_PERSON: readonly string[] = [
    'The house is louder and quieter at once. I have not slept and I do not mind.',
    'She asked me to hold the little one while she stretched. Ten minutes, an old routine, and she was humming.',
  ]

  it('fits on a scrap: 80 characters, the same budget the journey note keeps', () => {
    const over: string[] = []
    for (const t of texts) {
      if (t.length <= 80) continue
      over.push(t)
      // ⚠ THE BASELINE IS CHECKED HERE, LINE BY LINE, so a NEW long line fails by name and by
      // number rather than being absorbed into a count.
      expect(
        HIS_2109_OVER_THE_SCRAP.includes(t),
        `"${t}" is ${t.length} characters, over the pinned 80 and not on his 21.09 baseline`,
      ).toBe(true)
    }
    // ...and the baseline may not grow by accident, nor rot once he rules: both directions.
    expect(new Set(over).size, 'exactly the four he passed on 21.09, no more').toBe(HIS_2109_OVER_THE_SCRAP.length)
  })

  it('⚠⚠ the scrap baseline is REAL – every line on it is really over, and the law still bites', () => {
    // Without this the list could name four innocent sentences for ever and the guard above would
    // pass while proving nothing. Each entry is measured, and the control shows the law can fire.
    for (const t of HIS_2109_OVER_THE_SCRAP) {
      expect(t.length, `"${t}" is on the baseline and is not over budget – re-read the ruling`).toBeGreaterThan(80)
      expect(texts, `"${t}" is baselined and is no longer in the pool`).toContain(t)
    }
    const sibling = `${'x'.repeat(90)}`
    expect(HIS_2109_OVER_THE_SCRAP.includes(sibling), 'control: a NEW long line is not baselined').toBe(false)
  })

  // ===============================================================================================
  // ⚠⚠ v72 — THE PIN RE-AIMED AT THE NARRATION, ON THE OWNER'S RULING OF 09.09. NOT WEAKENED.
  // ===============================================================================================
  //
  // WHAT MOVED, exactly. Two assertions used to scan the WHOLE rendered sentence:
  //
  //     expect(t).not.toMatch(/\bYou\b|\byour\b|\bYour\b/)      // "never addresses the player"
  //     expect(t).not.toMatch(/\bI\b/)                          // "written ABOUT her, third person"
  //
  // ⭐ THE RULING (owner, 09.09): **she may speak in the first person inside her own quotation
  // marks.** `I`, `me`, `mine` and `we` are hers to use there, and so is addressing the parent
  // directly – that is how a person talks, and tier 0 of her voice is her quoted line inside the
  // parent's week story. THE NARRATOR'S LAW IS UNCHANGED: outside the quotation the diary is still
  // the parent's journal, third person about her, no address to the player. What was wrong was the
  // assertion's BOUNDARY – it scanned the rendered note without knowing where the quotation marks
  // were – so the pin is RE-AIMED at the narration, and it comes back ARMED RATHER THAN RELAXED:
  //
  //   * the address ban gains its LOWERCASE arm. The shipped regex was case-sensitive and caught
  //     `You` and `Your` but not `you` – the commonest spelling of the word it bans. Every line in
  //     the pool, quoted or not, is now held to `/\byou\b/i` and `/\byour\b/i`.
  //   * her narration gains `me`, `mine` and `we`, which the old pin had NO arm for at all.
  //
  // ⚠⚠ AND THE TWO SHAPE RULES ARE WHAT MAKE THE STRIP SAFE. Both are stated in the approved doc's
  // own preamble (`docs/specs/voice-bibles-2026-09.md` §"How she speaks") and all 52 lines obey them:
  //
  //   1. AT MOST ONE QUOTED SPAN PER LINE. A greedy `/".*"/` strip over two spans swallows the
  //      narration between them, so a two-span line could hide a first-person narrator from the
  //      check. This asserts the shape instead of trusting it.
  //   2. THE NARRATION OUTSIDE THE QUOTATION CONTAINS `she` OR `She`. A paired `/"[^"]*"/g` strip
  //      cannot tell HER quotation from anybody else's – `"You are not going back until I say so,"
  //      we said.` would sail straight through it – so the `she` is what names the speaker as her,
  //      and it is exactly the collapse the pin exists to prevent.
  //
  // ⚠ WHY `we` IS HELD AGAINST HER LINES AND NOT AGAINST THE PARENT'S. «We said no», «Out before we
  // were up», «We watched her serve more closely than usual» are the PARENT's own voice and have
  // shipped for a year – the diary is written by a household. `we` in the narration AROUND HER
  // QUOTATION is the different thing rule 2 is aimed at, and that is where it is banned.
  const ONE_SPAN = /"[^"]*"/g
  /** The line with her quotation taken out of it – the parent's own words, and only those. */
  const narrationOf = (t: string): string => t.replace(ONE_SPAN, ' ')
  /** ⚠ THE PRONOUN, NOT THE NOUN, and the lookbehind is measured rather than defensive: the first
   *  run of the lowercase arm failed on a SHIPPED birthday line – «A pause, then a very good
   *  thank-you.» – which addresses nobody and which CLAUDE.md invariant 4 forbids anyone to reword.
   *  A hyphen in front of it is what separates the compound noun from the address, so that is what
   *  the pin asks. Everything else the arm ever caught, it still catches. */
  const ADDRESS = /(?<!-)\byou\b/i
  const ADDRESS_POSSESSIVE = /(?<!-)\byour\b/i

  it('⚠ SHAPE RULE 1: at most ONE quoted span per line, or the strip below is unsafe', () => {
    for (const t of texts) {
      expect((t.match(ONE_SPAN) ?? []).length, t).toBeLessThanOrEqual(1)
    }
  })

  it('⚠ SHAPE RULE 2: a line that quotes her names her in the narration around it', () => {
    let quoted = 0
    for (const t of texts) {
      if ((t.match(ONE_SPAN) ?? []).length === 0) continue
      quoted++
      expect(narrationOf(t), t).toMatch(/\bshe\b/i)
    }
    // ...and the rule has to have something to rule on: her lines EXIST in this pool.
    expect(quoted, 'no line quotes her – then both rules above prove nothing').toBeGreaterThan(40)
  })

  it('short dash only, no Cyrillic, and never addresses the player', () => {
    for (const t of texts) {
      expect(t, t).not.toContain('—')
      expect(t, t).not.toMatch(/[Ѐ-ӿ]/)
      // ⚠ RE-AIMED at the narration, and armed with the lowercase arm the shipped pin never had.
      expect(narrationOf(t), t).not.toMatch(ADDRESS)
      expect(narrationOf(t), t).not.toMatch(ADDRESS_POSSESSIVE)
    }
  })

  it('is written ABOUT her, in the third person – never her name, never the coach\'s register', () => {
    for (const t of texts) {
      // The game rolls her name; a note that used it would read like a certificate.
      // ⚠ RE-AIMED at the narration (see the block above), and armed with `me` / `mine` / `we`.
      const narration = narrationOf(t)
      // ⚠⚠ HIS 21.09 BASELINE, line by line – see the block above the scrap guard for the whole
      // finding and for why it is a baseline with custody rather than an exemption. TWO lines of the
      // motherhood band put the journal in the singular first person; every OTHER line in the pool is
      // still held to the household voice, and a new one fails here by name.
      if (HIS_2109_FIRST_PERSON.includes(t)) continue
      expect(narration, t).not.toMatch(/\bI\b/)
      expect(narration, t).not.toMatch(/\bme\b/i)
      expect(narration, t).not.toMatch(/\bmine\b/i)
      if ((t.match(ONE_SPAN) ?? []).length > 0) expect(narration, t).not.toMatch(/\bwe\b/i)
      // Nothing here grades her or predicts her: that is the coach's job, two tiles away
      // (engine/radar.ts), and two identical voices on one card is the failure this guards.
      expect(t.toLowerCase(), t).not.toContain('potential')
      expect(t.toLowerCase(), t).not.toContain('we need')
      expect(t.toLowerCase(), t).not.toContain('the job is')
    }
    // ⚠ AND THE BASELINE MAY NOT GROW BY ACCIDENT. The `continue` above is a hole exactly two
    // sentences wide; this counts them, so a third first-person line has to walk past this number.
    const firstPerson = texts.filter((t) => /\b(I|me|mine)\b/i.test(narrationOf(t)))
    expect(new Set(firstPerson).size, 'exactly the two he passed on 21.09, no more')
      .toBe(HIS_2109_FIRST_PERSON.length)
  })

  it('⚠⚠ the first-person baseline is REAL – both lines really break the household voice', () => {
    // The scrap baseline's own net, one law over: without this the list could name two innocent
    // sentences for ever and the `continue` above would be waving through nothing.
    for (const t of HIS_2109_FIRST_PERSON) {
      expect(/\b(I|me|mine)\b/i.test(narrationOf(t)), `"${t}" is baselined and is not first-person`).toBe(true)
      expect(texts, `"${t}" is baselined and is no longer in the pool`).toContain(t)
    }
    // ...and a sibling carrying the same defect is NOT covered – per LINE, never per law.
    expect(HIS_2109_FIRST_PERSON.includes('I watched her train all week.'), 'control: a new one is not baselined')
      .toBe(false)
  })

  it('⚠ ...AND THE STRIP IS LOAD-BEARING – her quoted lines really do speak in the first person', () => {
    // The other half of "re-aimed, never weakened": if no line in the pool used a first person
    // INSIDE its quotation, the strip above would be free and the ruling would have bought nothing.
    // This is the arm that makes the re-aim mean something – and it is what fails if a future
    // rewrite silently narrows her back to reported speech.
    const inside = texts.flatMap((t) => t.match(ONE_SPAN) ?? [])
    expect(inside.filter((q) => /\bI\b/.test(q)).length, 'she never says I').toBeGreaterThan(5)
    expect(inside.filter((q) => /\bme\b|\bmine\b|\bwe\b/i.test(q)).length).toBeGreaterThan(2)
  })

  it('no line appears twice, and the pool is big enough for a five-year career', () => {
    expect(new Set(texts).size).toBe(texts.length)
    expect(texts.length, 'a family stays home most weeks of most seasons').toBeGreaterThan(28)
  })
})

describe('W2 — the wiring', () => {
  it('the Weekly Story scrap reads the engine, in falling order of what the week is worth saying', () => {
    const card = read('../src/components/WeekRecapCard.vue')
    expect(card).toContain('diary.travelNote ?? game.snapshot?.diary.weekNote ?? flavorText.value')
    // The prose treatment follows WHICH HAND wrote it rather than which picture is above it.
    expect(card).toContain("'recap-note--travel': noteIsProse")
  })

  it('the plan reaches the diary from the world, not from a component', () => {
    expect(worldSource()).toContain('trainPct: world.plan.train')
    // ...and the pool is licensed on it, which is the whole design decision: an ordinary week's
    // subject is the PLAYER's choice, not the world's.
    // diary.ts AND every diary/*.ts part: the week-note pool moved to diary/weekNotes.ts.
    expect(diarySource()).toContain('f.trainPct >= WEEK_NOTE_GRIND')
  })
})

// =================================================================================================
// ⭐⭐⭐ v72 — HER VOICE: COMPLETENESS, AND THE THREE LICENCES THAT SELECT IT
// =================================================================================================
//
// who-she-is §5b names the pin this block is: «a test walking beatKind × temperament × register that
// FAILS on a missing variant, so a `quiet` girl can never silently receive a `fiery` girl's line as
// a fallback. (The flat pool is the one legal shared fallback, and only at strained/cold.)»
//
// ⚠ WHY IT IS NOT ENOUGH THAT `VOICE_LINES` IS A TOTAL `Record`. The type makes a missing STRING a
// compile error; it says nothing about whether the line is REACHABLE. A moment whose licence is
// wrong for one voice – or a register that quietly excludes one – leaves that girl with silence
// while the other three speak, and the type is perfectly happy. So this walks the LICENCES, which is
// the property the design is actually about.
describe('v72 — the voice completeness pin', () => {
  const LAYOFF = { kind: 'ankle strain', weeksRemaining: 3, totalWeeks: 6 }
  /** The spoken moments × THE STAGES THE MATRIX GIVES THEM, as WEEKS rather than as ids – a second
   *  spelling of `MOMENTS`/`STAGE_LICENSE`, built from the facts side, so the pin cannot agree
   *  with the pool by copying it. ⚠ Wave B («4 полосы», 11.09): the eight all-stage moments walk
   *  all four stages; exams walk SCHOOL ONLY (the engine's own fact – see the sweeps' «cannot
   *  produce» guards above); the birthday walks the two roof stages and the off-season the two
   *  away ones (the matrix's content scope). A cell missing at any stage fails HERE by name. */
  const STAGE_FACTS: Record<DiaryLifeStage, Partial<DiaryFacts>> = {
    school: { lifeStage: 'school', schoolOver: false, ageYears: 15 },
    'after-school': { lifeStage: 'after-school', schoolOver: true, ageYears: 19 },
    college: { lifeStage: 'college', schoolOver: true, ageYears: 21 },
    independent: { lifeStage: 'independent', schoolOver: true, ageYears: 24 },
  }
  const SPOKEN: [string, Partial<DiaryFacts>][] = [
    ...STAGES.flatMap((stage): [string, Partial<DiaryFacts>][] => [
      [`grind@${stage}`, { trainPct: WEEK_PLAN_PRESETS.grind.train, ...STAGE_FACTS[stage] }],
      [`light@${stage}`, { trainPct: WEEK_PLAN_PRESETS.light.train, ...STAGE_FACTS[stage] }],
      [`freshBody@${stage}`, { condition: BAND_CONDITION.fresh, ...STAGE_FACTS[stage] }],
      [`vacation@${stage}`, { vacationWeek: true, ...STAGE_FACTS[stage] }],
      [`restingKnock@${stage}`, { knockChoice: 'rest', knockPart: 'ankle', ...STAGE_FACTS[stage] }],
      [`pushingKnock@${stage}`, { knockChoice: 'push', knockPart: 'shoulder', ...STAGE_FACTS[stage] }],
      [`injured@${stage}`, { injured: LAYOFF, ...STAGE_FACTS[stage] }],
      [`tired@${stage}`, { condition: BAND_CONDITION.drained, ...STAGE_FACTS[stage] }],
    ]),
    ['exams@school', { examsWeek: true, ...STAGE_FACTS.school }],
    ['birthday@school', { birthdayAge: 15, ...STAGE_FACTS.school }],
    ['birthday@after-school', { birthdayAge: 19, ...STAGE_FACTS['after-school'] }],
    ['offSeason@college', { offSeasonWeek: true, ...STAGE_FACTS.college }],
    ['offSeason@independent', { offSeasonWeek: true, ...STAGE_FACTS.independent }],
  ]

  /** Every line in HER voice that this week licenses – i.e. the ones carrying a `voice` claim. */
  const voicedAt = (over: Partial<DiaryFacts>): { voice: Temperament; text: string }[] =>
    WEEK_NOTES.filter((n) => n.claims.voice !== undefined && n.license(homeWeek(over))).map((n) => ({
      voice: n.claims.voice as Temperament,
      text: render(n, homeWeek(over)),
    }))

  it('⚠⚠ every moment × register that speaks for ONE girl speaks for ALL FOUR', () => {
    let spoke = 0
    for (const [moment, week] of SPOKEN) {
      for (const moodRegister of REGISTERS) {
        const counts = TEMPERAMENTS.map(
          (temperament) => voicedAt({ ...week, moodRegister, temperament }).length,
        )
        const label = `${moment} @ ${moodRegister}: ${JSON.stringify(
          Object.fromEntries(TEMPERAMENTS.map((t, i) => [t, counts[i]])),
        )}`
        expect(new Set(counts).size, `a missing variant – ${label}`).toBe(1)
        if (counts[0] > 0) spoke++
      }
    }
    // ...and the walk has to actually reach her voice, or the equality above is four zeros. The
    // floor is stage-aware now: 37 moment×stage cells, most speaking at two registers each.
    expect(spoke, 'no moment speaks at all – then this pin proves nothing').toBeGreaterThan(45)
  })

  it('⚠ and a girl is only ever handed HER OWN voice – never another one as a fallback', () => {
    for (const [, week] of SPOKEN) {
      for (const moodRegister of REGISTERS) {
        for (const temperament of TEMPERAMENTS) {
          for (const line of voicedAt({ ...week, moodRegister, temperament })) {
            expect(line.voice, `"${line.text}" reached a ${temperament} girl`).toBe(temperament)
          }
        }
      }
    }
  })

  it('⚠⚠ THE FLAT POOL IS THE ONLY SHARED FALLBACK, and only where the walls are up', () => {
    const flatAt = (over: Partial<DiaryFacts>) =>
      WEEK_NOTES.filter((n) => n.claims.strainedBond && n.license(homeWeek(over)))
    for (const temperament of TEMPERAMENTS) {
      // `strained` – her own voice is gone and the shared pool answers in its place.
      const strained = { temperament, bondBand: 'strained' as const }
      expect(voicedAt(strained), `${temperament} still has her voice at strained`).toEqual([])
      expect(flatAt(strained).length, 'the walls-up pool has to speak').toBeGreaterThan(0)
      // `cold` – the third rung of §B's ladder: nothing at all, and the parent's line stands alone.
      const cold = { temperament, bondBand: 'cold' as const }
      expect(voicedAt(cold)).toEqual([])
      expect(flatAt(cold), 'tier 0 is ABSENT at cold, not quieter').toEqual([])
      // ...and the flat pool never stands in for a girl who is still talking to her parent.
      for (const band of ['close', 'steady'] as const) {
        expect(flatAt({ temperament, bondBand: band }), `flat pool at ${band}`).toEqual([])
      }
      // ⚠ and a cold week still has the PARENT's own words – the loss is her voice, not the page.
      expect(WEEK_NOTES.some((n) => n.license(homeWeek(cold)))).toBe(true)
    }
  })

  it('⚠ the register is a licence on a VARIANT: low weeks and bright weeks are not interchangeable', () => {
    // The two register-scoped moments, from both sides. `freshBody` is written at `bright` and
    // `tired` at `low`; neither may fire in the other's week, and the eight-strong `level` band may
    // not fire on a low week at all («the one variant that is not a low week»).
    const fresh = { condition: BAND_CONDITION.fresh }
    const drained = { condition: BAND_CONDITION.drained }
    for (const temperament of TEMPERAMENTS) {
      const at = (over: Partial<DiaryFacts>) => voicedAt({ ...over, temperament })
      expect(at({ ...fresh, moodRegister: 'bright' }).length, 'the bright variant').toBe(1)
      expect(at({ ...fresh, moodRegister: 'level' })).toEqual([])
      expect(at({ ...fresh, moodRegister: 'low' })).toEqual([])
      expect(at({ ...drained, moodRegister: 'low' }).length, 'the low variant').toBe(1)
      expect(at({ ...drained, moodRegister: 'level' })).toEqual([])
      // ...and a level line is licensed on a bright week too, which is what `level` MEANS.
      const grind = { trainPct: WEEK_PLAN_PRESETS.grind.train, temperament }
      expect(voicedAt({ ...grind, moodRegister: 'level' }).length).toBe(1)
      expect(voicedAt({ ...grind, moodRegister: 'bright' }).length).toBe(1)
      expect(voicedAt({ ...grind, moodRegister: 'low' })).toEqual([])
    }
  })

  it('⚠ the hundred and fifty-six lines are all there, once each, and nothing else grew', () => {
    // wave B, «4 полосы» (11.09): 8 all-stage moments × 4 stages + exams at school only (the
    // ENGINE's fact – isExamWeek(week, schoolOver) dies with school, so the amendment's «×3»
    // column was corrected) + birthday × 2 roof stages + off-season × 2 away stages = 37 per
    // voice, × 4 = 148 voiced + 8 flat = 156 – the corrected voice-bibles §E arithmetic.
    const voiced = WEEK_NOTES.filter((n) => n.claims.voice !== undefined)
    const flat = WEEK_NOTES.filter((n) => n.claims.strainedBond)
    expect(voiced.length).toBe(148)
    expect(flat.length).toBe(8)
    // every voiced line claims the warm channel AND a stage, and no flat line claims a voice
    for (const n of voiced) expect(n.claims.closeBond, render(n, homeWeek({}))).toBe(true)
    for (const n of voiced) expect(n.claims.rail, 'wave B: a voiced line without a stage').toBeDefined()
    for (const n of flat) expect(n.claims.voice).toBeUndefined()
    // thirty-seven per voice, exactly – and the stages split 10 / 9 / 9 / 9
    const PER_STAGE: Record<DiaryLifeStage, number> = { school: 10, 'after-school': 9, college: 9, independent: 9 }
    for (const t of TEMPERAMENTS) {
      const hers = voiced.filter((n) => n.claims.voice === t)
      expect(hers.length).toBe(37)
      for (const stage of STAGES) {
        expect(hers.filter((n) => n.claims.rail === stage).length, `${t}: ${stage}`).toBe(PER_STAGE[stage])
      }
    }
    // ARM (wave B): one cell deleted from VOICE_LINES – a compile error first, and this count
    // second; the per-stage split above catches a school line pasted into a college slot.
  })

  it('⚠⚠ THE TAIL-LINT (wave B, the 10.09 ban list) – no narrator tail survives in any narration', () => {
    // The amended bibles' ban list, swept over the NARRATION of every note in the pool – voiced,
    // flat and the parent's own. The quotation is stripped first: the ban is on the narrator
    // interpreting her, never on words she might say herself. A new tail joins the list to
    // tighten the ratchet; removing one is the owner's call.
    // ⚠ RE-AIMED 11.09 AT THE SHARED LIST, NOT WEAKENED – and the list itself is byte-identical.
    // WHAT MOVED: `BANNED_TAILS` left this file for `tests/helpers/bannedTails.ts`. WHY: T10's
    // verification pass found the ban is marked «MUST, linted» while the lint swept `WEEK_NOTES`
    // and nothing else – wave 2 put two more narration pools in `engine/world/lifeBeat.ts` and wave 3
    // added five, none of them ever swept. `tests/wave3-tail-lint.test.ts` now sweeps those seven,
    // and TWO copies of a ban list are two lists that drift. This case is unchanged in every other
    // respect: same pool, same strip, same assertion, same message.
    for (const n of WEEK_NOTES) {
      const text = typeof n.text === 'function' ? n.text(homeWeek({ birthdayAge: 15 })) : n.text
      const narration = text.replace(/"[^"]*"/g, ' ').toLowerCase()
      for (const tail of BANNED_TAILS) {
        expect(narration.includes(tail), `banned tail «${tail}» in: ${text}`).toBe(false)
      }
    }
    // ARM (wave B): re-adding «at volume» to any fiery narration – RED here by name.
  })

  it('⚠ the five Mood words are the approved five, and the engine hands nothing else', () => {
    // ⚠⚠ CLAUDE.md INVARIANT 4: these are the owner's words, from an approved document. This pin is
    // here so a rename shows up as a failing test rather than as a screen nobody re-read.
    expect(Object.values(MOOD_WORD)).toEqual(['Glowing', 'Bright', 'Steady', 'Dimmed', 'Heavy'])
  })
})

// ⚠ ROUND-18 #9, THE SECOND CATALOGUE. The owner reported one off-season phrase naming school at
// twenty-one; sweeping `DIARY_POOL` for the words found three more, and this pool is the fourth
// place the same sentence lives. `plainTraining` already refuses exam weeks, which is exactly what
// hid it – exams end with school, but the ordinary drills-and-dinner week runs for another decade.
// The pin is by what the words SAY rather than by line, so the next school phrase cannot repeat it.
describe('ROUND-18 #9 — no week note names school after her last school year', () => {
  const saysSchool = (t: string): boolean => /\bschool\b|\bclass(es|room)?\b|\blesson/i.test(t)

  it('every school phrase is unlicensed once school is over', () => {
    const past = homeWeek({ schoolOver: true })
    const named = WEEK_NOTES.filter((n) => n.license(past) && saysSchool(render(n, past)))
    expect(named.map((n) => render(n, past))).toEqual([])
  })

  it('and it still speaks while she is at school – or the pin above proves nothing', () => {
    const now = homeWeek({ schoolOver: false })
    const named = WEEK_NOTES.filter((n) => n.license(now) && saysSchool(render(n, now)))
    expect(named.length).toBeGreaterThan(0)
  })
})

// =================================================================================================
// ⭐⭐⭐ v86 (wave 10 T6b) – THE LINE: THE FOUR STROKES, AND WHAT EACH OF THEM RESTS ON
// =================================================================================================
//
// docs/specs/the-dynasty-2026-09.md §1, his 22.09 ruling: «звучит интересно, давай попробуем
// реализовать». Eight lines, two per stroke, and every one of them rests on a fact the
// inheritance block really carries.
//
// ⚠ THEY LIVE HERE AND NOT IN tests/wave10-lineage.test.ts BECAUSE `homeWeek` LIVES HERE. A licence
// is a question about a whole week, and the fixture that builds one honestly is sixty fields long; a
// second copy in another file would be free to drift from this one and to go on passing while it did.
// The album half of T6 – which needs a WORLD rather than a week – is in that file.
describe('the line – the four strokes', () => {
  const lineage = WEEK_NOTES.filter((n) => n.claims.lineage === true)
  const selected = (f: DiaryFacts): number => lineage.filter((n) => n.license(f)).length

  it('⭐⭐ eight lines, inside the 8–12 the plan asked for', () => {
    expect(lineage.length).toBe(8)
  })

  it('⭐⭐⭐ a career that continues NO line reaches none of them, on any ordinary week', () => {
    for (const trainPct of PLANS) {
      expect(selected(homeWeek({ trainPct })), `train ${trainPct}`).toBe(0)
    }
  })

  it('⭐⭐⭐ A COLLEGE MOTHER LICENSES NO CABINET LINE, and no scar line either', () => {
    // She is in the house – the habit and the professional eye are hers whatever she won – but she
    // won nothing and her career did not end on her body, so four of the eight are unreachable.
    // ⚠ `lineageTitles: 0` IS A REAL STATE AND NOT AN ABSENCE, which is the whole reason the cabinet
    // lines ask `> 0` rather than `!== null`.
    const college = homeWeek({ lineageTitles: 0, lineageOpen: true, lineageEndedHurt: false })
    expect(selected(college), 'the habit and the eye, and nothing needing a fact she has not got').toBe(2)
  })

  it('⭐⭐ the cabinet is what opens the speech lines...', () => {
    const before = selected(homeWeek({ lineageTitles: 0, lineageOpen: true, lineageEndedHurt: false }))
    const after = selected(homeWeek({ lineageTitles: 6, lineageOpen: true, lineageEndedHurt: false }))
    expect(after - before, 'one speech line per pole, and this arm is one pole').toBe(1)
  })

  it('⭐⭐ ...and the ending on her body is what opens the scar lines', () => {
    const before = selected(homeWeek({ lineageTitles: 0, lineageOpen: false, lineageEndedHurt: false }))
    const after = selected(homeWeek({ lineageTitles: 0, lineageOpen: false, lineageEndedHurt: true }))
    expect(after - before).toBe(1)
  })

  it('⭐⭐⭐ the openness axis prices WHERE she is felt, and every line in the pool is reachable', () => {
    // ⚠ THE SHAPE THAT SAYS THE AXIS IS A FORK AND NOT A GATE: the fullest mother reaches exactly half
    // the pool on each pole, so nothing is unreachable and nothing fires on both.
    const open = homeWeek({ lineageTitles: 9, lineageOpen: true, lineageEndedHurt: true })
    const priv = homeWeek({ lineageTitles: 9, lineageOpen: false, lineageEndedHurt: true })
    expect(selected(open), 'an open mother is quoted').toBe(4)
    expect(selected(priv), 'a private one is noticed').toBe(4)
    expect(selected(open) + selected(priv)).toBe(lineage.length)
  })

  it('⚠ not one line names her, dates her, or carries a figure', () => {
    for (const note of lineage) {
      const text = render(note, homeWeek({ lineageTitles: 1, lineageOpen: true, lineageEndedHurt: true }))
      expect(text, `a figure reached the scrap: ${text}`).not.toMatch(/\d/)
      expect(text, text).not.toMatch(/\bVera\b|\bKowalski\b/)
    }
  })
})

// =================================================================================================
// R51 №13 — A STAYCATION WEEK IS NOT A JOURNEY
// =================================================================================================
//
// The owner's item №13, verbatim: «Неделя дома "с подружками" в качестве отпуска закончилась запиской
// "Неделя без корта. Вернулась загорелее и громче за ужином" - мне кажется здесь смыслово не очень подходит,
// это к деревне или морю больше, надо для этого варианта что-то другое добавить и проверить в английском
// чтобы тоже синхронизация была».
//
// FIVE THINGS ARE PINNED, and each is read off BOTH the licence and the draw, because a licence can be right
// and the selection still walk the wrong pool:
//   1. THE NARROWING. The two lines that were wrong at home («away as a family», «browner») are off on the
//      staycation, at every stage and mood.
//   2. THE CONTROL. The other six packages, and a booking the save no longer knows, still draw both – a
//      narrowing that killed the lines it was meant to keep would pass (1) on its own.
//   3. THE ADDITION. The staycation's three lines draw on a staycation week at a roof stage, and nowhere else.
//   4. THE GENERIC LINES stay on every kind, the staycation included.
//   5. BOTH LANGUAGES. The shipped English is byte-identical and each new line has its Russian row.
describe('R51 №13 — a staycation week is not a journey', () => {
  // The four lines that shipped BEFORE this change, copied here as data and not read back from the source:
  // an oracle that moves with the string it checks is a pin that cannot fail (CLAUDE.md invariant 4).
  const AWAY_LINES = [
    'A week away as a family. Nobody mentioned rankings once.',
    'A week off the court. She came back browner, and louder at dinner.',
  ] as const
  const GENERIC_HOLIDAY_LINES = [
    'Seven days, no drills. She did not ask about the calendar once.',
    'We planned her week off for her. She was not asked. We noticed too late.',
  ] as const
  const STAYCATION_LINES = [
    'A week at home with her friends. The kitchen was never empty.',
    'No court this week. Her friends were in and out, and the fridge paid for it.',
    'Home all week. Louder at dinner, happier too.',
  ] as const

  const PACKAGE_IDS: string[] = vacation.packages.map((p) => p.id)
  const NOT_STAYCATION: (string | null)[] = [...PACKAGE_IDS.filter((id) => id !== 'staycation'), null]
  const ROOF_STAGES: DiaryLifeStage[] = ['school', 'after-school']

  const stageOf = (lifeStage: DiaryLifeStage): Partial<DiaryFacts> => ({
    lifeStage,
    schoolOver: lifeStage !== 'school',
    ageYears: lifeStage === 'school' ? 15 : 24,
  })
  /** A holiday week as the pool sees it. */
  const holiday = (packageId: string | null, over: Partial<DiaryFacts> = {}): DiaryFacts =>
    homeWeek({ vacationWeek: true, vacationPackageId: packageId, ...over })
  /** Every text the pool LICENSES for a week, before any draw. */
  const licensedTexts = (f: DiaryFacts): string[] => WEEK_NOTES.filter((n) => n.license(f)).map((n) => render(n, f))
  /** Every text the pool actually DRAWS for a week shape: 24 careers x 60 weeks. A holiday band steps through
   *  its pool week by week off a career-stable entry point, so 60 weeks visits every licensed line. */
  function drawn(over: Partial<DiaryFacts>): Set<string> {
    const out = new Set<string>()
    for (let s = 0; s < 24; s++) {
      for (let week = 1; week <= 60; week++) {
        const t = weekNoteFor(homeWeek({ week, ...over }), `r51-13-career-${s}`)
        if (t !== null) out.add(t)
      }
    }
    return out
  }

  it('the narrowing has a reader: `staycation` is a real package id, and the six away packages are all in the control', () => {
    expect(PACKAGE_IDS, 'a renamed id would leave the narrowing licensing nothing and no sweep would notice').toContain('staycation')
    expect(NOT_STAYCATION).toEqual(expect.arrayContaining(['grandma', 'camping', 'seaside', 'resort', 'elite', 'yacht-week', null]))
  })

  it('1 – a staycation week is not LICENSED «away as a family» or «browner», at any stage or mood', () => {
    let checked = 0
    for (const stage of STAGES) {
      for (const moodRegister of REGISTERS) {
        const texts = licensedTexts(holiday('staycation', { ...stageOf(stage), moodRegister }))
        expect(texts.length, 'the staycation week is licensed something').toBeGreaterThan(0)
        for (const t of AWAY_LINES) expect(texts, `${stage}/${moodRegister}: "${t}" is licensed at home`).not.toContain(t)
        checked++
      }
    }
    expect(checked).toBe(STAGES.length * REGISTERS.length)
  })

  it('1 – ...and never DRAWS them, over 24 careers x 60 weeks, while the band still speaks', () => {
    for (const moodRegister of REGISTERS) {
      const seen = drawn({ vacationWeek: true, vacationPackageId: 'staycation', moodRegister })
      expect(seen.size, `staycation/${moodRegister}: the denominator – the band has to speak`).toBeGreaterThanOrEqual(4)
      for (const t of AWAY_LINES) expect(seen.has(t), `staycation/${moodRegister} drew "${t}"`).toBe(false)
    }
  })

  it('2 CONTROL – every other package, and a booking the save no longer knows, still licenses AND draws both', () => {
    for (const id of NOT_STAYCATION) {
      const licensed = licensedTexts(holiday(id))
      const seen = drawn({ vacationWeek: true, vacationPackageId: id })
      for (const t of AWAY_LINES) {
        expect(licensed, `${id}: "${t}" must still be licensed`).toContain(t)
        expect(seen.has(t), `${id}: "${t}" must still be drawable`).toBe(true)
      }
    }
  })

  it('3 – the staycation lines draw on a staycation week at a roof stage, the bright one only at bright', () => {
    for (const stage of ROOF_STAGES) {
      const level = drawn({ vacationWeek: true, vacationPackageId: 'staycation', ...stageOf(stage) })
      const bright = drawn({ vacationWeek: true, vacationPackageId: 'staycation', moodRegister: 'bright', ...stageOf(stage) })
      for (const t of STAYCATION_LINES) expect(bright.has(t), `${stage}/bright never drew "${t}"`).toBe(true)
      expect(level.has(STAYCATION_LINES[0]), `${stage}/level`).toBe(true)
      expect(level.has(STAYCATION_LINES[1]), `${stage}/level`).toBe(true)
      expect(level.has(STAYCATION_LINES[2]), `${stage}/level: «happier» needs a bright week`).toBe(false)
    }
  })

  it('3 – ...and on NO other week: not another package, not a plain week, not a flat of her own', () => {
    const elsewhere: [string, Partial<DiaryFacts>][] = [
      ['plain week', {}],
      ['exams', { examsWeek: true }],
      ['off-season', { offSeasonWeek: true }],
      ['practice', { playedPractice: true }],
      ['birthday', { birthdayAge: 15 }],
      ['the package id without the holiday', { vacationPackageId: 'staycation' }],
      ...NOT_STAYCATION.map((id): [string, Partial<DiaryFacts>] => [`holiday/${id}`, { vacationWeek: true, vacationPackageId: id }]),
      ...(['college', 'independent'] as const).map((s): [string, Partial<DiaryFacts>] => [
        `staycation at ${s}`,
        { vacationWeek: true, vacationPackageId: 'staycation', ...stageOf(s) },
      ]),
    ]
    for (const [name, over] of elsewhere) {
      const seen = drawn({ moodRegister: 'bright', ...over })
      for (const t of STAYCATION_LINES) expect(seen.has(t), `${name} drew "${t}"`).toBe(false)
    }
  })

  it('4 – the generic holiday lines stay on EVERY kind, the staycation included', () => {
    for (const id of [...PACKAGE_IDS, null]) {
      const licensed = licensedTexts(holiday(id))
      for (const t of GENERIC_HOLIDAY_LINES) expect(licensed, `${id}: "${t}" must stay licensed`).toContain(t)
    }
    const seen = drawn({ vacationWeek: true, vacationPackageId: 'staycation' })
    for (const t of GENERIC_HOLIDAY_LINES) expect(seen.has(t), `the staycation never drew "${t}"`).toBe(true)
  })

  it('the staycation band does not repeat itself in consecutive weeks, bright or level', () => {
    for (const moodRegister of ['bright', 'level'] as const) {
      for (const seed of ['step-a', 'step-b', 'step-c', 'step-d']) {
        for (let week = 1; week < 60; week++) {
          const over = { vacationWeek: true, vacationPackageId: 'staycation', moodRegister }
          const a = weekNoteFor(homeWeek({ week, ...over }), seed)
          const b = weekNoteFor(homeWeek({ week: week + 1, ...over }), seed)
          expect(a, `staycation must speak (w${week})`).not.toBeNull()
          expect(a, `staycation repeated across w${week}/w${week + 1} on ${seed}: "${a}"`).not.toBe(b)
        }
      }
    }
  })

  it('⭐ and `HOLDS.vacationAt` is REACHED, per line, on both sides and with real package ids', () => {
    const carriers = WEEK_NOTES.filter((n) => n.claims.vacationAt !== undefined)
    expect(carriers.map((n) => n.claims.vacationAt), 'two away lines, three home lines').toEqual(['away', 'away', 'home', 'home', 'home'])
    const reached = carriers.map(() => ({ n: 0, ids: new Set<string | null>(), moods: new Set<MoodRegister>() }))
    for (const f of sweepAll()) {
      if (!f.vacationWeek) continue
      carriers.forEach((note, i) => {
        if (!note.license(f)) return
        reached[i].n++
        reached[i].ids.add(f.vacationPackageId)
        reached[i].moods.add(f.moodRegister)
      })
    }
    carriers.forEach((note, i) => {
      const r = reached[i]
      expect(r.n, `"${note.text}" is licensed in no fixture – HOLDS.vacationAt proves nothing about it`).toBeGreaterThan(0)
      if (note.claims.vacationAt === 'home') {
        expect([...r.ids], `"${note.text}" reached outside the staycation`).toEqual(['staycation'])
      } else {
        expect(r.ids.has('seaside'), `"${note.text}" never reached through a real away id`).toBe(true)
        expect(r.ids.has('staycation'), `"${note.text}" reached on the staycation`).toBe(false)
      }
    })
    expect([...reached[4].moods], 'the «happier» line is reached at bright and only there').toEqual(['bright'])
  })

  it('5 ENGLISH – the shipped lines are byte-identical, once each, and the three new ones sit beside them', () => {
    const statics = WEEK_NOTES.map((n) => n.text).filter((t): t is string => typeof t === 'string')
    for (const t of [...AWAY_LINES, ...GENERIC_HOLIDAY_LINES, ...STAYCATION_LINES]) {
      expect(statics.filter((x) => x === t), `"${t}" must be in the pool exactly once`).toHaveLength(1)
    }
  })

  it('5 RUSSIAN – every line touched or added has a Russian row: Cyrillic, inside the scrap, the short dash only', () => {
    const ru = JSON.parse(read('../src/i18n/ru.json')) as Record<string, unknown>
    for (const t of [...AWAY_LINES, ...STAYCATION_LINES]) {
      const r = ru[t]
      expect(typeof r, `"${t}" has no Russian row`).toBe('string')
      const s = r as string
      expect(s, `"${t}" -> a row with no Russian in it`).toMatch(/[А-Яа-яЁё]/)
      expect(s.length, `"${t}" -> "${s}" is over the 80-character scrap`).toBeLessThanOrEqual(80)
      expect(s, `"${t}" -> the long dash`).not.toContain('—')
      expect(s, `"${t}" -> an exclamation mark`).not.toContain('!')
    }
  })
})

// =================================================================================================
// R52 F3 (14.10) – HER FEEL FOR THE COACH REACHES THE WEEK NOTE
// =================================================================================================
//
// THE OWNER: «изредка строка в дневнике голосом родителя». What this holds, in the order the change was built:
//   1. THE TABLE.   Ten lines, two for each step that has a voice, as data in THIS file; `too-early` has none.
//   2. THE LICENCE. A line is licensed on its own step's fact, on an ordinary training week, at a roof stage – and on no
//                   other week of any kind, no other step's fact, no leaked `too-early`, and no fact at all.
//   3. THE DRAW.    Each step draws its own two lines (both of them) and never another step's.
//   4. THE FACT.    On played, coached careers the fact is present on EXACTLY the weeks the leaf says – the first of a
//                   period, a week she has trained with this coach, a feel with a voice – carries the tile's step, and is
//                   ABSENT (not null) otherwise; an uncoached career never has the key; the week of a hire never has it,
//                   not even for a coach hired back whose gauge already speaks; a snapshot draws nothing from MAIN.
//   5. THE WORDS.   The rest of the pool is byte-identical, and the ten Russian rows are present.
describe('R52 F3 — her feel for the coach reaches the week note', () => {
  type Step = Exclude<CoachFeel, 'too-early'>
  const STEPS: Step[] = ['unsure', 'seems-good', 'seems-off', 'good', 'off']
  /** The ten lines as DATA, copied here and not read back from the source: an oracle that moves with the string it checks
   *  is a pin that cannot fail (CLAUDE.md invariant 4). */
  const LINES: Record<Step, readonly [string, string]> = {
    unsure: ['Asked how practice went, she shrugged: "Still working it out."', 'Practice was "different", she said. Not better, not worse. Different.'],
    'seems-good': ["She came home with one of the coach's drills and showed it to us twice.", '"It is starting to make sense," she said about practice. That was new.'],
    'seems-off': ['"Fine," she said about practice, and changed the subject.', 'She tried the new drill in the hall, stopped halfway. "It is fine."'],
    good: ['Practice came up three times at dinner. All of it good.', 'She quoted the coach at dinner. Twice.'],
    off: ['She does not talk about practice any more.', 'Practice came and went without a word at dinner.'],
  }
  const ALL: string[] = STEPS.flatMap((s) => [...LINES[s]])
  const ROOF_STAGES: DiaryLifeStage[] = ['school', 'after-school']
  const stageOf = (lifeStage: DiaryLifeStage): Partial<DiaryFacts> => ({
    lifeStage,
    schoolOver: lifeStage !== 'school',
    ageYears: lifeStage === 'school' ? 15 : 24,
  })
  /** Every text of the ten the pool LICENSES for a week, before any draw. */
  const feelTexts = (f: DiaryFacts): string[] =>
    WEEK_NOTES.filter((n) => n.license(f)).map((n) => render(n, f)).filter((t) => ALL.includes(t))
  /** The weeks that are NOT an ordinary training week – each takes the note off, because a line about practice needs one. */
  const NOT_PLAIN: [string, Partial<DiaryFacts>][] = [
    ['a tournament', { playedTournament: true }],
    ['a journey', { travelled: true }],
    ['a friendly', { playedPractice: true }],
    ['an exam week', { examsWeek: true }],
    ['the off-season', { offSeasonWeek: true }],
    ['a holiday', { vacationWeek: true }],
    ['a knock, rested', { knockChoice: 'rest', knockPart: 'ankle' }],
    ['a knock, pushed through', { knockChoice: 'push', knockPart: 'ankle' }],
    ['a layoff', { injured: INJURIES.find((i) => i !== null) ?? null }],
  ]

  it('1 – the table: ten lines, two per step with a voice, once each, claims valued, and none for `too-early`', () => {
    const carriers = WEEK_NOTES.filter((n) => n.claims.coachFeelRead !== undefined)
    expect(carriers, 'exactly the ten').toHaveLength(10)
    for (const step of STEPS) {
      expect(carriers.filter((n) => n.claims.coachFeelRead === step).map((n) => n.text), step).toEqual([...LINES[step]])
    }
    expect(carriers.map((n) => n.claims.coachFeelRead as string), 'no line claims `too-early`').not.toContain('too-early')
    const statics = WEEK_NOTES.map((n) => n.text).filter((t): t is string => typeof t === 'string')
    for (const t of ALL) expect(statics.filter((x) => x === t), `"${t}" must be in the pool exactly once`).toHaveLength(1)
    for (const n of carriers) expect(n.claims.domestic, `"${n.text}" watches her at the table: a house line`).toBe(true)
  })

  it('2 – licensed ONLY with its step present, on an ordinary training week, at a roof stage – and on nothing else', () => {
    for (const stage of STAGES) {
      const roof = ROOF_STAGES.includes(stage)
      for (const step of [undefined, ...STEPS]) {
        const f = homeWeek({ ...stageOf(stage), ...(step === undefined ? {} : { coachFeelRead: step }) })
        const expected = step !== undefined && roof ? [...LINES[step]] : []
        expect(feelTexts(f), `${stage} / ${step ?? 'no fact'}`).toEqual(expected)
        for (const [what, shape] of NOT_PLAIN) {
          if (stage !== 'school' && shape.examsWeek) continue // the engine cannot produce this week
          expect(feelTexts({ ...f, ...shape }), `${stage} / ${step ?? 'no fact'} / ${what}`).toEqual([])
        }
      }
    }
    expect(feelTexts(homeWeek({ coachFeelRead: 'too-early' as never })), 'a leaked `too-early` hints at nothing').toEqual([])
  })

  /** Every one of the ten that the pool actually DRAWS for a week shape: 40 careers x 60 weeks. */
  function drawnFeel(over: Partial<DiaryFacts>): Set<string> {
    const out = new Set<string>()
    for (let s = 0; s < 40; s++) {
      for (let week = 1; week <= 60; week++) {
        const t = weekNoteFor(homeWeek({ week, ...over }), `r52-f3-career-${s}`)
        if (t !== null && ALL.includes(t)) out.add(t)
      }
    }
    return out
  }

  it('3 – each step draws its own two lines, both of them, and never another step\'s; with no fact none is ever drawn', () => {
    for (const step of STEPS) expect([...drawnFeel({ coachFeelRead: step })].sort(), step).toEqual([...LINES[step]].sort())
    expect(drawnFeel({}).size, 'a week with no fact in it').toBe(0)
  })

  it('3b – and the claim is REACHED, per line, through the honesty pin\'s sweep (HOLDS.coachFeelRead is not decoration)', () => {
    const carriers = WEEK_NOTES.filter((n) => n.claims.coachFeelRead !== undefined)
    const reached = carriers.map(() => 0)
    for (const f of sweepAll()) {
      if (f.coachFeelRead === undefined) continue
      carriers.forEach((note, i) => {
        if (!note.license(f)) return
        reached[i]++
        expect(HOLDS.coachFeelRead(f, note.claims.coachFeelRead), `"${note.text}" licensed on a fact that is not its claim`).toBe(true)
      })
    }
    carriers.forEach((note, i) => expect(reached[i], `"${note.text}" is licensed in no fixture – the pin proves nothing about it`).toBeGreaterThan(0))
  })

  it('3c – THE LEAD: on a week her feel is heard the ten take the note whenever the coin lets the week speak, and nothing else of the pool does', () => {
    for (const step of STEPS) {
      let weeks = 0
      let spoke = 0
      for (let s = 0; s < 40; s++) {
        for (let week = 1; week <= 60; week++) {
          const t = weekNoteFor(homeWeek({ week, coachFeelRead: step }), `r52-f3-lead-${s}`)
          weeks++
          if (t === null) continue
          spoke++
          expect((LINES[step] as readonly string[]).includes(t), `${step}: "${t}" is a pool line on a heard week`).toBe(true)
        }
      }
      // the coin is WEEK_NOTE_CHANCE and the lead adds nothing to it: the share that speaks is the coin's own share
      expect(Math.abs(spoke / weeks - WEEK_NOTE_CHANCE), `${step}: ${spoke} of ${weeks} weeks spoke`).toBeLessThan(0.04)
    }
    // ...and a week that is NOT heard draws from the whole pool as it always did: ordinary lines, none of the ten
    const plain = new Set<string>()
    for (let s = 0; s < 40; s++) for (let week = 1; week <= 60; week++) {
      const t = weekNoteFor(homeWeek({ week }), `r52-f3-lead-${s}`)
      if (t !== null) plain.add(t)
    }
    expect(plain.size, 'an ordinary week still draws from the pool').toBeGreaterThanOrEqual(2)
    expect([...plain].filter((t) => ALL.includes(t)), 'and none of the ten, with no fact in the week').toEqual([])
  })

  /** One played career, handed week by week to `visit` as the diary and the tile see it. */
  function walk(presetIdx: number, index: number, weeks: number, visit: (world: ReturnType<typeof createWorld>, snap: ReturnType<typeof toSnapshot>) => void): void {
    const policy = POLICIES[0]!
    const { world, rng } = openCareer(PRESETS[presetIdx]!, index, policy)
    for (let w = 0; w < weeks; w++) {
      visit(world, toSnapshot(world))
      stepCareerWeek(world, rng, policy)
    }
  }

  // ⚠⚠ THE TWO PER-TEST BUDGETS OF 4a AND 4b (240 s, 120 s) ARE GONE 14.10 (ROUND 52 F5 – the closing check's catch; `tests/sim-serialisation.test.ts`: birpc's window is 60 s, and a budget above it
  // only turns a readable timeout into an opaque `Timeout calling "onTaskUpdate"` stall). MEASURED SOLO 14.10 (unit project, `--reporter=verbose`, 1-min load 3.1): 4a 10.32 s – six careers x 130
  // weeks, 780 snapshots, `coachedWeeks` asserted at exactly 2 x 3 x 130 – and 4b 0.97 s. At T5.3's strictest factor on record (x3.1, the two-core runner) 4a is ~32 s, 1.9x under the window, so
  // NOTHING WAS CUT AND NOTHING PROMOTED and the project default applies. If 4a ever needs margin the cheap knob is the careers per preset (`idx < 3`), not a bigger number.
  it('4a – on played, coached careers the fact is present on EXACTLY the first week of a period she has trained, carries the tile\'s step, and is absent otherwise; the note drawn is always that step\'s', () => {
    let coachedWeeks = 0
    let reads = 0
    let notesDrawn = 0
    const stepsSeen = new Set<string>()
    const reachedFromReal = new Set<string>()
    for (const preset of [2, 5]) {
      for (let idx = 0; idx < 3; idx++) {
        walk(preset, idx, 130, (world, snap) => {
          const f = snap.diary.facts
          const where = `preset ${preset}/${idx} w${world.week}`
          expect(world.coachId, `${where}: this preset starts with a coach`).not.toBeNull()
          coachedWeeks++
          const together = world.week - coachSinceWeek(world)
          const tile = snap.coachFeel
          const due = together > 0 && together % COACH_FEEL.periodWeeks === 0 && tile !== undefined && tile !== 'too-early'
          expect(f.coachFeelRead, `${where} (${together} weeks together, tile ${tile})`).toBe(due ? tile : undefined)
          if (!due) expect('coachFeelRead' in f, `${where}: the key is ABSENT, not undefined-valued`).toBe(false)
          const t = snap.diary.weekNote
          if (t !== null && ALL.includes(t)) {
            notesDrawn++
            expect(f.coachFeelRead !== undefined && (LINES[f.coachFeelRead] as readonly string[]).includes(t), `${where}: "${t}" is not the line of step ${f.coachFeelRead}`).toBe(true)
          }
          if (!due) return
          reads++
          stepsSeen.add(tile as string)
          // the REAL facts of a REAL week, drawn under 60 other careers' seeds: whatever is drawn of the ten is this step's
          if (feelTexts(f).length === 0) return
          for (let k = 0; k < 60; k++) {
            const drawn = weekNoteFor(f, `${world.seed}:alt${k}`)
            if (drawn === null || !ALL.includes(drawn)) continue
            expect((LINES[f.coachFeelRead as Step] as readonly string[]).includes(drawn), `${where}: alt ${k} drew "${drawn}" for step ${f.coachFeelRead}`).toBe(true)
            reachedFromReal.add(drawn)
          }
        })
      }
    }
    // the denominators: an arm that walked nothing, or reached nothing, would pass over everything above
    expect(coachedWeeks, 'the arm walked coached weeks').toBe(2 * 3 * 130)
    expect(reads, 'and reached weeks the fact is present on').toBeGreaterThan(20)
    expect(stepsSeen.size, 'with more than one step among them').toBeGreaterThanOrEqual(2)
    expect(reachedFromReal.size, 'and the real facts drew lines of the ten under other seeds').toBeGreaterThanOrEqual(2)
    expect(notesDrawn, 'the notes drawn on the careers\' own seeds are counted, not required').toBeGreaterThanOrEqual(0)
  })

  it('4b – an uncoached career never has the key, on any of its weeks', () => {
    let weeks = 0
    walk(0, 0, 80, (world, snap) => {
      expect(world.coachId, 'the self-coached preset has nobody employed').toBeNull()
      expect('coachFeelRead' in snap.diary.facts, `w${world.week}`).toBe(false)
      weeks++
    })
    expect(weeks).toBe(80)
  })

  it('4c – the week of a hire never carries the fact – not even for a coach hired back whose gauge already speaks – and the fourth and eighth weeks do', () => {
    for (const [chem, expected] of [[10, 'good'], [-10, 'off']] as const) {
      const world = createWorld(`r52-f3-rehire${chem}`, { ...DEFAULT_PROFILE, coachTier: 'middle' })
      world.week = 60
      const back = toSnapshot(world).coachMarket.find((r) => !r.current && r.lockedPoints === null)?.id
      if (back === undefined) throw new Error('no hireable stranger on this board')
      // the pair survives leaving and coming back (spec §7); a level of ±10 is past the clamp, so the tile speaks from the first week
      world.coachPairs[back] = { chem, phase: 0, standing: 0 }
      hireCoach(world, back)
      for (let k = 0; k <= 2 * COACH_FEEL.periodWeeks; k++) {
        world.week = 60 + k
        const snap = toSnapshot(world)
        expect(snap.coachFeel, `chem ${chem}, week ${k} of the new stint: the tile speaks (F1b)`).toBe(expected)
        const due = k > 0 && k % COACH_FEEL.periodWeeks === 0
        expect(snap.diary.facts.coachFeelRead, `chem ${chem}, week ${k} of the new stint`).toBe(due ? expected : undefined)
      }
    }
  })

  it('4d – ZERO MAIN draws: building the snapshot, the diary facts included, leaves the persisted MAIN position where it was', () => {
    const { world } = openCareer(PRESETS[2]!, 0, POLICIES[0]!)
    world.week = 64
    const at = JSON.stringify(world.rngMain)
    for (let i = 0; i < 5; i++) toSnapshot(world)
    expect(JSON.stringify(world.rngMain), 'the diary facts drew nothing from MAIN').toBe(at)
  })

  it('5 ENGLISH – every OTHER shipped line is byte-identical: the pool minus the ten still hashes to its value before this change', () => {
    const statics = WEEK_NOTES.map((n) => n.text).filter((t): t is string => typeof t === 'string')
    // ⚠ RE-AIMED 14.10 (R52 J1): four lines joined the pool – the checkpoint the bond shut (claim `coachTalkShut`). The count and the hash below are of the REST of the pool and do not move: the four are taken out of `rest` by
    // claim, the way the ten are taken out by text, and their words are pinned as data in tests/r52-checkpoint-silence.test.ts.
    const SILENCE = WEEK_NOTES.filter((n) => n.claims.coachTalkShut !== undefined).map((n) => n.text)
    const rest = statics.filter((t) => !ALL.includes(t) && !SILENCE.includes(t))
    expect(rest, 'the shipped static lines').toHaveLength(301)
    expect(WEEK_NOTES.length - statics.length, 'and the template lines').toBe(26)
    // ⚠ CAPTURED FROM THE PRISTINE TREE (HEAD 19d6c40f, weekNotes.ts clean) BEFORE the ten were added. A red here means an
    // existing line's English moved: that is the owner's to ask for (CLAUDE.md invariant 4) – re-capture only if he did.
    expect(createHash('sha1').update(rest.join('\n')).digest('hex').slice(0, 16)).toBe('4385c6f9b5d9048f')
  })

  it('5 RUSSIAN – the ten rows are present: Cyrillic, inside the scrap, the short dash only, the coach named only as a noun', () => {
    const ru = JSON.parse(read('../src/i18n/ru.json')) as Record<string, unknown>
    const naming: string[] = []
    for (const t of ALL) {
      const r = ru[t]
      expect(typeof r, `"${t}" has no Russian row`).toBe('string')
      const s = r as string
      expect(s, `"${t}" -> a row with no Russian in it`).toMatch(/[А-Яа-яЁё]/)
      expect(s.length, `"${t}" -> "${s}" is over the 80-character scrap`).toBeLessThanOrEqual(80)
      expect(s, `"${t}" -> the long dash`).not.toContain('—')
      expect(s, `"${t}" -> an exclamation mark`).not.toContain('!')
      expect(s, `"${t}" -> «всё плохо» is nobody's line`).not.toMatch(/всё плохо/i)
      if (/тренер/i.test(s)) naming.push(s)
    }
    expect(naming, 'R15-7: the coach appears in exactly the two rows that name one, as a noun').toEqual([
      'Пришла домой с одним из упражнений тренера и дважды показала его нам.',
      'За ужином она цитировала тренера. Дважды.',
    ])
  })
})
