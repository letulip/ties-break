// ONE `presetOf`, WALKED OVER EVERY LEGAL WEEK – E-02 (docs/review-principles-2026-09-26/05-ui.md),
// T4.12, the owner's ruling 7a of 26.09.
//
// THE RULING IS HERWEEKTAB'S, NOT A BLEND. Three screens lit a training preset and they gave two
// answers: `HerWeekTab` matched the laid-out WEEK, `CoachMarketScreen` matched `plan.train`, and
// `ThisWeekScreen` matched `train` and `rest` – which is the same test, because `planFromWeek` derives
// `rest = 100 - train`. The owner chose the first, so `engine/plan.ts`'s `presetOf` carries that note
// verbatim and the other two call it.
//
// ⚠ WHAT THIS FILE MEASURES THAT THE MOUNT CANNOT. The rendered witness
// (tests/component/principles-w4-preset-parity.test.ts) poses ONE week on all three screens. This one
// poses the whole legal space against the rule the primitive was asked to carry – an oracle written
// out below from `HerWeekTab.vue`'s baseline body, so the primitive is compared with its brief rather
// than with itself. It also measures the DISAGREEMENT the finding asserted arithmetically, which is
// what makes the space discriminating rather than merely large.
//
// ⚠ WHY THESE TWO SPACES ARE "EVERY LEGAL WEEK" FOR THIS QUESTION. The full space is unbounded in
// practice (31 ordered day-fillings to the seventh power), but a preset's own week is total: one
// `general` session on each of `sessionDays` days and nothing else. So a week can only BE a preset's
// if every day holds at most one session and every session is `general` – and the two enumerations
// below are complete over exactly that frontier and one step past it on each axis:
//   * EVERY LAYOUT, over the one kind that can match: 0..2 `general` sessions a day, 3^7 candidates,
//     filtered by `planShapeError`. This is the complete space in which a match is possible, plus the
//     doubled days that must refuse.
//   * EVERY KIND ASSIGNMENT at one session a day: each day empty or one of the five kinds, 6^7
//     candidates, filtered the same way. This is the complete space of "right volume, wrong session".
//
// ⚠ MUTATION-VERIFIED – the arms are named in the component file's header, and this file's share of
// them is the ASYMMETRY (docs/specs/engine-ui-parity-2026-09.md §2): arm A (breaking `presetOf`)
// reddens THIS file and the mounted one together; arms B and C (reverting one reader, or adding a term
// to the row's template) redden the mounted file ALONE and cannot move a line here.
import { describe, it, expect } from 'vitest'
import {
  PLAN_DAYS,
  PLAN_MAX_SESSIONS,
  PLAN_MIN_SESSIONS,
  PLAN_PRESET_KEYS,
  planFromWeek,
  planShapeError,
  planWeek,
  presetOf,
  type PlanPresetKey,
} from '../src/engine/plan'
import { SESSION_KINDS, WEEK_PLAN_PRESETS, type SessionKind, type WeekPlan } from '../src/shared/protocol'

type Week = SessionKind[][]

/** THE RULE AS `HerWeekTab.vue` SPELLED IT AT THE BASELINE (26.09), re-written here rather than
 *  imported: an oracle that called `presetOf` would assert that a function equals itself. Its own note
 *  is the one that moved into the engine – «a preset is selected when the week is its week, not when
 *  the train percentage matches» – and this is the body that note was attached to. */
function herWeekTabRule(week: Week): PlanPresetKey | null {
  const order = ['light', 'balanced', 'grind'] as const
  return (
    order.find((key) => {
      const preset = planWeek(WEEK_PLAN_PRESETS[key])
      return preset.every((day, d) => {
        const mine = week[d] ?? []
        return day.length === mine.length && day.every((kind, i) => kind === mine[i])
      })
    }) ?? null
  )
}

/** `CoachMarketScreen.vue`'s `activePlan` as it shipped – `plan.train` alone. */
function coachMarketRule(plan: WeekPlan): PlanPresetKey | null {
  const order = ['light', 'balanced', 'grind'] as const
  return order.find((k) => WEEK_PLAN_PRESETS[k].train === plan.train) ?? null
}

/** `ThisWeekScreen.vue`'s `activePreset` as it shipped – `train` and `rest`, grind-first. */
function thisWeekRule(plan: WeekPlan): PlanPresetKey | null {
  const order = ['grind', 'balanced', 'light'] as const
  return (
    order.find(
      (k) => WEEK_PLAN_PRESETS[k].train === plan.train && WEEK_PLAN_PRESETS[k].rest === plan.rest,
    ) ?? null
  )
}

/** Every week `planShapeError` admits, over `general` alone, at 0..2 sessions a day. */
function* everyLegalLayout(): Generator<Week> {
  const per = [0, 1, 2]
  for (let mask = 0; mask < 3 ** 7; mask++) {
    const week: Week = []
    let n = mask
    for (let d = 0; d < 7; d++) {
      const count = per[n % 3]
      n = Math.floor(n / 3)
      week.push(Array.from({ length: count }, () => 'general' as SessionKind))
    }
    if (planShapeError(week) === null) yield week
  }
}

/** Every week `planShapeError` admits at one session a day, over all five kinds. */
function* everyLegalKindWeek(): Generator<Week> {
  const fills: (SessionKind | null)[] = [null, ...SESSION_KINDS]
  const base = fills.length
  for (let mask = 0; mask < base ** 7; mask++) {
    const week: Week = []
    let n = mask
    let sessions = 0
    for (let d = 0; d < 7; d++) {
      const kind = fills[n % base]
      n = Math.floor(n / base)
      week.push(kind ? [kind] : [])
      if (kind) sessions++
    }
    // The shape check is the engine's, but the volume is the cheap half and it rejects 98% of the
    // mask space – so it runs first, and `planShapeError` still has the final word on what is legal.
    if (sessions < 4 || sessions > 6) continue
    if (planShapeError(week) === null) yield week
  }
}

/** HOW MANY WEEKS THE SECOND ENUMERATION MUST YIELD, in closed form off the engine's own constants:
 *  choose which days hold a session, then a kind for each. ⚠ IT IS THE ANTI-VACUITY GUARD AND NOT a
 *  decoration – a generator that silently yielded a tenth of the space would pass every assertion
 *  below, which is this repo's own «a search that quietly answers a different question». Derived rather
 *  than written down, so the 4..6 band moving moves this with it instead of reddening for that. */
function expectedKindWeeks(): number {
  const choose = (n: number, k: number) => {
    let r = 1
    for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1)
    return Math.round(r)
  }
  let total = 0
  for (let k = PLAN_MIN_SESSIONS; k <= PLAN_MAX_SESSIONS; k++) {
    total += choose(PLAN_DAYS, k) * SESSION_KINDS.length ** k
  }
  return total
}

/** And the first one's size: the 4..6 slice of 3^7 day-counts. Measured, and stated here rather than in
 *  prose so something reads it (wave 9's lesson). */
const LEGAL_LAYOUTS = 784

describe('E-02 – `presetOf` IS HerWeekTab\'s rule, on every legal week', () => {
  it('agrees with the rule it was asked to carry over every legal LAYOUT', () => {
    let walked = 0
    const wrong: { week: Week; mine: PlanPresetKey | null; his: PlanPresetKey | null }[] = []
    for (const week of everyLegalLayout()) {
      walked++
      const mine = presetOf(week)
      const his = herWeekTabRule(week)
      if (mine !== his) wrong.push({ week, mine, his })
    }
    // Named with the count, because "some week disagrees" is the failure and the message should say
    // how big the space it disagreed in was.
    expect(walked, 'every 4..6 slice of the 3^7 day-counts').toBe(LEGAL_LAYOUTS)
    expect(wrong, `${wrong.length} of ${walked} legal layouts disagree`).toEqual([])
  })

  it('...and over every legal KIND assignment at one session a day', () => {
    let walked = 0
    const wrong: Week[] = []
    for (const week of everyLegalKindWeek()) {
      walked++
      if (presetOf(week) !== herWeekTabRule(week)) wrong.push(week)
    }
    expect(walked, 'every kind, every day, 4..6 sessions').toBe(expectedKindWeeks())
    expect(wrong, `${wrong.length} of ${walked} legal weeks disagree`).toEqual([])
  })

  it('⚠ EXACTLY THREE LEGAL WEEKS ARE A PRESET\'S, and they are the three presets\' own', () => {
    // The other side of the ruling: «the layout is the preset's» means a preset pill lights on the
    // week that pill would produce and on nothing else. Three presets, three weeks, in a space of
    // thousands.
    const lit = new Map<PlanPresetKey, number>()
    let walked = 0
    for (const week of everyLegalKindWeek()) {
      walked++
      const key = presetOf(week)
      if (key) lit.set(key, (lit.get(key) ?? 0) + 1)
    }
    expect([...lit.entries()].sort(), [...lit.keys()].join('/')).toEqual([
      ['balanced', 1],
      ['grind', 1],
      ['light', 1],
    ])
    expect(walked, 'out of this many legal weeks').toBe(expectedKindWeeks())
    // ...and each one is the week `planWeek` lays that preset's own plan out as.
    for (const key of PLAN_PRESET_KEYS) {
      expect(presetOf(planWeek(WEEK_PLAN_PRESETS[key])), key).toBe(key)
    }
  })

  it('⚠ THE FINDING, MEASURED – the two rules that shipped lit a pill on EVERY legal week', () => {
    // This is what made the disagreement live by construction rather than by coincidence:
    // `planShapeError` admits only 4..6 sessions and `planTrainPct` maps 4/5/6 onto exactly the three
    // presets' `train`, so a projected plan ALWAYS matched one of them. Both tabs of the Coach market
    // screen were reachable at once, so the player saw both answers.
    let walked = 0
    let byLayout = 0
    let byTrain = 0
    let byTrainAndRest = 0
    for (const week of everyLegalKindWeek()) {
      walked++
      const plan = planFromWeek(week)
      if (presetOf(week)) byLayout++
      if (coachMarketRule(plan)) byTrain++
      if (thisWeekRule(plan)) byTrainAndRest++
    }
    expect(byTrain, 'CoachMarketScreen lit one on every legal week').toBe(walked)
    expect(byTrainAndRest, 'and so did ThisWeekScreen – `rest` is `100 - train`').toBe(walked)
    expect(byLayout, "while the layout rule lights the three presets' own weeks").toBe(3)
    // The two shipped rules were the same predicate wearing two spellings, which is why fixing one
    // and not the other would have left the pair in place.
    for (const week of everyLegalKindWeek()) {
      const plan = planFromWeek(week)
      expect(coachMarketRule(plan)).toBe(thisWeekRule(plan))
      break
    }
  })

  it('a weekless plan still answers – the migration and a pre-v47 literal read the same preset', () => {
    // `WeekPlan.week` is optional; `planWeek` reads a plan without one back as the week the Calendar
    // has been drawing for that scalar, which is byte-for-byte what the v46 -> v47 migration writes.
    // So the primitive takes a WEEK and a caller holding a plan hands it `planWeek(plan)`.
    for (const key of PLAN_PRESET_KEYS) {
      const literal: WeekPlan = { train: WEEK_PLAN_PRESETS[key].train, rest: WEEK_PLAN_PRESETS[key].rest }
      expect(literal.week, 'the literal carries no matrix').toBeUndefined()
      expect(presetOf(planWeek(literal)), key).toBe(key)
    }
  })

  it('a week with a doubled day is no preset\'s, whatever it projects to', () => {
    // Six sessions on three doubled days is Grind's volume and Grind's projection, and it is not
    // Grind's week – which is the ruling applied to the axis the presets do not use at all.
    const doubled: Week = [
      ['general', 'general'], ['general', 'general'], [], ['general', 'general'], [], [], [],
    ]
    expect(planShapeError(doubled), 'legal, and the player can build it').toBeNull()
    expect(planFromWeek(doubled).train, "Grind's own projection").toBe(WEEK_PLAN_PRESETS.grind.train)
    expect(presetOf(doubled)).toBeNull()
  })
})
