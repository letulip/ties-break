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
import { WEEK_PLAN_PRESETS, type ConditionBand, type DiaryFacts, type FundsPressure } from '../src/shared/protocol'
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
  athome: (f) => !f.playedTournament && !f.travelled && f.travelHomeScene === null,
  // W4: re-derived off the fact, not off the licence that produced the line - same as every entry
  // above. A rest line on a week she trained through is the exact failure this catches.
  restingKnock: (f) => f.knockChoice === 'rest',
  pushingKnock: (f) => f.knockChoice === 'push',
  // W6c: re-derived through `bodyGroupOf` off the injury's own `kind`, independently of the licence -
  // so a leg line on a wrist week is a failing test, which is exactly what shipped and what the owner
  // caught by reading.
  bodyGroup: (f, value) => f.injured !== null && bodyGroupOf(f.injured.kind) === value,
  birthday: (f) => f.birthdayAge !== null,
}

describe('W2 — the ordinary week note is HONEST', () => {
  it('every licensed line asserts only what the week actually carries', () => {
    let checked = 0
    for (const f of sweepWeeks()) {
      for (const note of WEEK_NOTES) {
        if (!note.license(f)) continue
        for (const [claim, value] of Object.entries(note.claims)) {
          // ⚠ W6c REMOVED `if (value !== true) continue`. It was defensive against nothing (every claim
          // was a bare `true`) right up until `bodyGroup` carried a value - at which point it would have
          // waved the one claim through that most needed checking. `undefined` still skips, because an
          // absent claim asserts nothing; anything present is now verified against its value.
          if (value === undefined) continue
          expect(
            HOLDS[claim](f, value),
            `"${render(note, f)}" claims ${claim} on: ${JSON.stringify({
              train: f.trainPct, band: f.conditionBand, funds: f.fundsPressure,
              exams: f.examsWeek, off: f.offSeasonWeek, vac: f.vacationWeek,
              practice: f.playedPractice, injured: f.injured !== null,
              knock: f.knockChoice,
            })}`,
          ).toBe(true)
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
    for (const f of sweepWeeks()) {
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
    for (const f of sweepWeeks()) {
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
    expect(worldSource()).toContain('trainPct: world.plan.train')
    // ...and the pool is licensed on it, which is the whole design decision: an ordinary week's
    // subject is the PLAYER's choice, not the world's.
    // diary.ts AND every diary/*.ts part: the week-note pool moved to diary/weekNotes.ts.
    expect(diarySource()).toContain('f.trainPct >= WEEK_NOTE_GRIND')
  })
})
