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
import { worldSource, diarySource } from './worldSource'
import { readFileSync } from 'node:fs'
import {
  WEEK_NOTES,
  WEEK_NOTE_CHANCE,
  WEEK_NOTE_GRIND,
  WEEK_NOTE_LIGHT,
  conditionBandOf,
  weekNoteFor,
} from '../src/engine/diary'
import {
  WEEK_PLAN_PRESETS,
  type BondBand,
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
import { BIRTHDAY_BANDS, giftNoun } from '../src/engine/world'

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
    bondBand: 'steady',
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
  offSeason: (f) => f.offSeasonWeek,
  practice: (f) => f.playedPractice,
  fundsTight: (f) => f.fundsPressure === 'tight',
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
    for (const f of sweepWeeks()) {
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

  it('fits on a scrap: 80 characters, the same budget the journey note keeps', () => {
    for (const t of texts) expect(t.length, t).toBeLessThanOrEqual(80)
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
    const BANNED_TAILS = [
      'at speed',
      'at volume',
      'which is the tell',
      'which is how she says it',
      'nothing further',
      'nothing more',
      'in those words',
      'three times over',
      'more than once',
      'that was the whole answer',
      'did the whole week\'s work',
      'no second sentence',
      'she announced',
      'left it there',
    ]
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
