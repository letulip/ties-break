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
// ⚠ ZERO MAIN-STREAM DRAWS is proved next door, in tests/travel-home.test.ts's byte-identical
// capture (41550 / e6b0c709), which now touches `diary.weekNote` on every one of 52 weeks.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  WEEK_NOTES,
  WEEK_NOTE_CHANCE,
  WEEK_NOTE_GRIND,
  WEEK_NOTE_LIGHT,
  conditionBandOf,
  weekNoteFor,
} from '../src/engine/diary'
import { WEEK_PLAN_PRESETS, type ConditionBand, type DiaryFacts, type FundsPressure } from '../src/shared/protocol'

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
    injured: null,
    travelled: false,
    playedTournament: false,
    playedPractice: false,
    examsWeek: false,
    offSeasonWeek: false,
    vacationWeek: false,
    trainPct: 75,
    fundsPressure: 'ok',
    freshMilestone: null,
    travelHomeScene: null,
    travelHomeMood: null,
    ...over,
  }
}

/** The whole space of weeks she can spend at home: the plan, her body, the wallet, and each of the
 *  calendar's own weeks in turn, healthy and hurt. */
function* sweepWeeks(): Generator<DiaryFacts> {
  const calendars: Partial<DiaryFacts>[] = [
    {},
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
          for (const injured of [null, { kind: 'ankle strain', weeksRemaining: 3, totalWeeks: 6 }]) {
            yield homeWeek({ trainPct, condition: BAND_CONDITION[band], fundsPressure, injured, ...calendar })
          }
        }
      }
    }
  }
}

/** ONE independent re-derivation per claim, off the facts and NOT off the licence that made it. */
const HOLDS: Record<string, (f: DiaryFacts) => boolean> = {
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
  athome: (f) => !f.playedTournament && !f.travelled && f.travelHomeScene === null,
}

describe('W2 — the ordinary week note is HONEST', () => {
  it('every licensed line asserts only what the week actually carries', () => {
    let checked = 0
    for (const f of sweepWeeks()) {
      for (const note of WEEK_NOTES) {
        if (!note.license(f)) continue
        for (const [claim, value] of Object.entries(note.claims)) {
          if (value !== true) continue
          expect(
            HOLDS[claim](f),
            `"${note.text}" claims ${claim} on: ${JSON.stringify({
              train: f.trainPct, band: f.conditionBand, funds: f.fundsPressure,
              exams: f.examsWeek, off: f.offSeasonWeek, vac: f.vacationWeek,
              practice: f.playedPractice, injured: f.injured !== null,
            })}`,
          ).toBe(true)
          checked++
        }
      }
    }
    expect(checked, 'the sweep has to actually reach the pool').toBeGreaterThan(500)
  })

  it('an injured week is not offered a line about baking', () => {
    // Same rule the journey home keeps: a layoff TAKES the note. A pool that also licensed "she had
    // time to be fifteen this week" on the week the ice pack came out would draw it most of the time.
    for (const f of sweepWeeks()) {
      if (f.injured === null) continue
      const licensed = WEEK_NOTES.filter((n) => n.license(f))
      expect(licensed.length, 'a layoff week must still have words').toBeGreaterThan(0)
      for (const n of licensed) expect(n.claims.injured, `"${n.text}" on a layoff week`).toBe(true)
    }
  })

  it('a hard week and an easy week can never be handed each other\'s words', () => {
    const grind = homeWeek({ trainPct: WEEK_PLAN_PRESETS.grind.train })
    const light = homeWeek({ trainPct: WEEK_PLAN_PRESETS.light.train })
    for (const n of WEEK_NOTES.filter((x) => x.license(grind))) expect(n.claims.light).toBeUndefined()
    for (const n of WEEK_NOTES.filter((x) => x.license(light))) expect(n.claims.grind).toBeUndefined()
    // ...and the middle of the ladder is offered neither.
    const balanced = homeWeek({ trainPct: WEEK_PLAN_PRESETS.balanced.train })
    for (const n of WEEK_NOTES.filter((x) => x.license(balanced))) {
      expect(n.claims.grind, n.text).toBeUndefined()
      expect(n.claims.light, n.text).toBeUndefined()
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

  it('exams, the holiday, the off-season, a friendly and a layoff speak EVERY time', () => {
    const always: [string, Partial<DiaryFacts>][] = [
      ['exams', { examsWeek: true }],
      ['vacation', { vacationWeek: true }],
      ['off-season', { offSeasonWeek: true }],
      ['practice', { playedPractice: true }],
      ['layoff', { injured: { kind: 'ankle strain', weeksRemaining: 3, totalWeeks: 6 } }],
    ]
    for (const [name, over] of always) {
      for (let week = 1; week <= 60; week++) {
        expect(weekNoteFor(homeWeek({ week, ...over }), 'always-seed'), `${name} w${week}`).not.toBeNull()
      }
    }
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
    for (const f of sweepWeeks()) {
      expect(
        WEEK_NOTES.some((n) => n.license(f)),
        `nothing licensed for ${JSON.stringify({ train: f.trainPct, band: f.conditionBand, exams: f.examsWeek, off: f.offSeasonWeek, vac: f.vacationWeek, practice: f.playedPractice, injured: f.injured !== null })}`,
      ).toBe(true)
    }
  })
})

describe('W2 — the note is the PARENT, and it fits on a scrap of paper', () => {
  const texts = WEEK_NOTES.map((n) => n.text)

  it('fits on a scrap: 80 characters, the same budget the journey note keeps', () => {
    for (const t of texts) expect(t.length, t).toBeLessThanOrEqual(80)
  })

  it('short dash only, no Cyrillic, and never addresses the player', () => {
    for (const t of texts) {
      expect(t, t).not.toContain('—')
      expect(t, t).not.toMatch(/[Ѐ-ӿ]/)
      expect(t, t).not.toMatch(/\bYou\b|\byour\b|\bYour\b/)
    }
  })

  it('is written ABOUT her, in the third person – never her name, never the coach\'s register', () => {
    for (const t of texts) {
      // The game rolls her name; a note that used it would read like a certificate.
      expect(t, t).not.toMatch(/\bI\b/)
      // Nothing here grades her or predicts her: that is the coach's job, two tiles away
      // (engine/radar.ts), and two identical voices on one card is the failure this guards.
      expect(t.toLowerCase(), t).not.toContain('potential')
      expect(t.toLowerCase(), t).not.toContain('we need')
      expect(t.toLowerCase(), t).not.toContain('the job is')
    }
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
    expect(read('../src/engine/world.ts')).toContain('trainPct: world.plan.train')
    // ...and the pool is licensed on it, which is the whole design decision: an ordinary week's
    // subject is the PLAYER's choice, not the world's.
    expect(read('../src/engine/diary.ts')).toContain('f.trainPct >= WEEK_NOTE_GRIND')
  })
})
