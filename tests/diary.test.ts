// Diary-1 + Memory (docs/specs/family-diary.md, D1/D2/D3 + D10) – the copy system, the milestone
// ledger, the face-rect table move, and the third loss softener (rankClimbed).
//
// THE TEST THAT MATTERS MOST here is the HONESTY PIN: a diary that contradicts the simulation
// kills the whole effect, so every phrase's claims are swept against every fact state its licence
// admits – the avatarEmotion truth-table pattern, applied to words.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  assembleDiaryFacts,
  conditionBandOf,
  DIARY_POOL,
  diaryLine,
  fundsPressureOf,
  lastKidResultOf,
  lastKidTitleOf,
  MEMORY_EMOTION,
  MEMORY_LINES,
  MEMORY_MIN_WEEKS,
  milestoneKey,
  selectMemory,
  type DiaryClaims,
  type DiaryWorldView,
} from '../src/engine/diary'
import { avatarEmotion } from '../src/shared/avatarEmotion'
import type { DiaryFacts, Milestone, WorldEvent } from '../src/shared/protocol'
import {
  closeTournament,
  createWorld,
  enterEvent,
  KID_ID,
  SAVE_SCHEMA_VERSION,
  skipTournament,
  tickWeek,
  toSnapshot,
  withdrawEvent,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, TIER_SHORT, tierFromLabel } from '../src/engine/season/calendar'
import { TIER_SHORT as TIER_SHORT_VIA_UI } from '../src/composables/weekAhead'
import { CROPS, facePoint } from '../src/art/faceRects'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

// ---------------------------------------------------------------------------
// The face-rect table: ONE source of truth, shared by the cutter and the photo card.
// ---------------------------------------------------------------------------
describe('faceRects – the one crop table', () => {
  it('the cutter script re-exports THE SAME table object (no second copy can drift)', async () => {
    const script = await import('../scripts/cut-avatar-crops.mjs')
    expect(script.CROPS).toBe(CROPS)
  })

  it('facePoint turns a centre into clamped object-position percentages', () => {
    // teen-norm is [275, 103, 154] – the percentages are the centre over the 512px canvas.
    const p = facePoint('teen-norm')
    expect(p.x).toBeCloseTo((275 / 512) * 100, 5)
    expect(p.y).toBeCloseTo((103 / 512) * 100, 5)
  })

  it('is total: an unknown stem centres the frame instead of breaking the card', () => {
    expect(facePoint('never-painted')).toEqual({ x: 50, y: 50 })
  })

  it('every rectangle yields percentages inside [0, 100] – the cover window stays in the painting', () => {
    for (const stem of Object.keys(CROPS)) {
      const p = facePoint(stem)
      expect(p.x, stem).toBeGreaterThanOrEqual(0)
      expect(p.x, stem).toBeLessThanOrEqual(100)
      expect(p.y, stem).toBeGreaterThanOrEqual(0)
      expect(p.y, stem).toBeLessThanOrEqual(100)
    }
  })
})

// ---------------------------------------------------------------------------
// The third loss softener: a loss that still climbed the table reads composed.
// ⚠ RE-AIMED by R13-2 (owner's first Diary-1 playtest: the line fired on a FIRST-ROUND exit).
// Rank is relative – she can climb on a zero-point week purely because rivals' results decayed out
// of their 52-week windows – so the softener now demands the climb be EARNED: run points > 0 this
// week (post-first-round-zero, that means she won matches). Every softened case below therefore
// carries `runPointsThisWeek`; the new passive-climb cases pin the sad verdict the owner asked for.
// ---------------------------------------------------------------------------
describe('rankClimbed – the owner\'s "good loss" softener (earned climbs only, R13-2)', () => {
  const base = { week: 10, condition: 80, injured: false, lastTitle: null }
  const loss = { week: 10, won: false, lostFinal: false }

  it('a fresh loss that EARNED its climb is serious, not sad', () => {
    expect(avatarEmotion({ ...base, lastResult: loss, rankClimbed: true, runPointsThisWeek: 30 })).toBe('serious')
  })

  it('a PASSIVE climb (zero run points) no longer softens – R1 exit + decayed rivals reads sad', () => {
    expect(avatarEmotion({ ...base, lastResult: loss, rankClimbed: true, runPointsThisWeek: 0 })).toBe('sad')
    // an absent field is the same verdict: a climb that cannot be shown to be earned never soothes
    expect(avatarEmotion({ ...base, lastResult: loss, rankClimbed: true })).toBe('sad')
  })

  it('the same loss without the climb stays sad – and so does an absent flag (old callers)', () => {
    expect(avatarEmotion({ ...base, lastResult: loss, rankClimbed: false, runPointsThisWeek: 30 })).toBe('sad')
    expect(avatarEmotion({ ...base, lastResult: loss })).toBe('sad')
  })

  it('the anger crossing BEATS the climb – anger is about the run, not the table', () => {
    const streak = { losses: 5, startWeek: 6, angerAt: 5 }
    expect(
      avatarEmotion({ ...base, lastResult: loss, lossStreak: streak, rankClimbed: true, runPointsThisWeek: 30 }),
    ).toBe('angry')
    // ...past the crossing she is back to hurting, and an EARNED climb may soften THAT week again
    const past = { losses: 6, startWeek: 6, angerAt: 5 }
    expect(
      avatarEmotion({ ...base, lastResult: loss, lossStreak: past, rankClimbed: true, runPointsThisWeek: 30 }),
    ).toBe('serious')
    expect(avatarEmotion({ ...base, lastResult: loss, lossStreak: past, rankClimbed: false })).toBe('sad')
  })

  it('never touches a win, a runner-up, or a stale result', () => {
    expect(
      avatarEmotion({ ...base, lastResult: { week: 10, won: true, lostFinal: false }, rankClimbed: true, runPointsThisWeek: 90 }),
    ).toBe('happy')
    expect(
      avatarEmotion({ ...base, lastResult: { week: 10, won: false, lostFinal: true }, rankClimbed: true, runPointsThisWeek: 40 }),
    ).toBe('serious')
    // stale result + climb -> pure idle state, the climb colours nothing
    expect(avatarEmotion({ ...base, lastResult: { ...loss, week: 9 }, rankClimbed: true, runPointsThisWeek: 30 })).toBe('norm')
  })

  it('the ENGINE captures it: strictly-better rank, gated off while a reveal is unfinished', () => {
    const view = (over: Partial<DiaryWorldView>): DiaryWorldView => ({
      seed: 's',
      week: 10,
      kidId: KID_ID,
      startAgeYears: 14,
      condition: 80,
      fundsCents: 100_000_00,
      injury: null,
      events: [],
      lossStreak: null,
      kidRank: 50,
      prevKidRank: 60,
      pendingUnfinished: false,
      runPointsThisWeek: 0,
      milestones: [],
      vacationWeek: false,
      ...over,
    })
    expect(assembleDiaryFacts(view({})).rankClimbed).toBe(true)
    expect(assembleDiaryFacts(view({ kidRank: 60, prevKidRank: 60 })).rankClimbed).toBe(false)
    expect(assembleDiaryFacts(view({ kidRank: 70 })).rankClimbed).toBe(false)
    expect(assembleDiaryFacts(view({ prevKidRank: null })).rankClimbed).toBe(false)
    // mid-reveal the cached movement is LAST week's – it must not colour this week's face
    expect(assembleDiaryFacts(view({ pendingUnfinished: true })).rankClimbed).toBe(false)
    // deterministic: the same view twice is the same facts object, field for field
    expect(assembleDiaryFacts(view({}))).toEqual(assembleDiaryFacts(view({})))
  })
})

// ---------------------------------------------------------------------------
// The facts sweep + THE HONESTY PIN.
// ---------------------------------------------------------------------------

/** Build a coherent facts object the way the engine would: the emotion is avatarEmotion over the
 *  same inputs, and the week-shape flags come from a named scenario. */
interface SweepResult {
  won: boolean
  lostFinal: boolean
}
function makeFacts(input: {
  condition: number
  injured: boolean
  result: SweepResult | null
  rankClimbed: boolean
  /** R13-2: the points her run awarded this week – the earned half of the climb licence */
  runPoints?: number
  losses: number
  angerAt?: number
  scenario: 'quiet' | 'tournament' | 'travelOnly' | 'exams' | 'vacation' | 'offSeason' | 'practice'
  fundsCents?: number
  titleThisWeek?: boolean
}): DiaryFacts {
  const week = 10
  const injured = input.injured ? { kind: 'ankle soreness', weeksRemaining: 2, totalWeeks: 3 } : null
  const lastResult = input.result ? { week, won: input.result.won, lostFinal: input.result.lostFinal } : null
  const lossStreak =
    input.losses > 0 && input.result && !input.result.won
      ? { losses: input.losses, startWeek: 5, angerAt: input.angerAt ?? 99 }
      : null
  const emotion = avatarEmotion({
    week,
    condition: input.condition,
    injured: input.injured,
    lastResult,
    lastTitle: null,
    lossStreak,
    rankClimbed: input.rankClimbed,
    runPointsThisWeek: input.runPoints ?? 0,
  })
  const s = input.scenario
  return {
    week,
    emotion,
    resultFresh: input.result !== null,
    won: input.result?.won ?? false,
    lostFinal: input.result?.lostFinal ?? false,
    titleThisWeek: input.titleThisWeek ?? false,
    resultTier: null,
    rankClimbed: input.rankClimbed,
    runPointsThisWeek: input.runPoints ?? 0,
    lossStreak: input.losses,
    condition: input.condition,
    conditionBand: conditionBandOf(input.condition),
    injured,
    travelled: s === 'tournament' || s === 'travelOnly',
    playedTournament: s === 'tournament',
    playedPractice: s === 'practice',
    examsWeek: s === 'exams',
    offSeasonWeek: s === 'offSeason',
    vacationWeek: s === 'vacation',
    fundsPressure: fundsPressureOf(input.fundsCents ?? 50_000_00),
    freshMilestone: null,
  }
}

function* sweepFacts(): Generator<DiaryFacts> {
  const scenarios = ['quiet', 'tournament', 'travelOnly', 'exams', 'vacation', 'offSeason', 'practice'] as const
  const results: (SweepResult | null)[] = [
    null,
    { won: true, lostFinal: false },
    { won: false, lostFinal: true },
    { won: false, lostFinal: false },
  ]
  for (const condition of [0, 25, 39, 40, 59, 60, 79, 80, 100])
    for (const injuredFlag of [false, true])
      for (const result of results)
        for (const rankClimbed of [false, true])
          // R13-2: the earned/passive split – 0 = a passive climb (rivals decayed), 30 = a real run
          for (const runPoints of [0, 30])
            for (const losses of [0, 2, 5])
              for (const angerAt of losses === 5 ? [5, 99] : [99])
                for (const scenario of scenarios)
                  for (const fundsCents of [500_00, 50_000_00])
                    yield makeFacts({ condition, injured: injuredFlag, result, rankClimbed, runPoints, losses, angerAt, scenario, fundsCents })
}

/** The pin's independent reading of what each claim means – a SECOND spelling on purpose, so a
 *  licence and its claims cannot be wrong together. Returns the violated claim, or null. */
function claimViolation(c: DiaryClaims, f: DiaryFacts): string | null {
  if (c.affect === 'positive' && (f.emotion === 'sad' || f.emotion === 'angry' || f.emotion === 'injury')) {
    return `positive affect on a ${f.emotion} week`
  }
  if (c.won && !(f.resultFresh && f.won)) return 'claims a fresh win'
  if (c.lost && !(f.resultFresh && !f.won)) return 'claims a fresh loss'
  if (c.title && !f.titleThisWeek) return 'claims a title'
  if (c.runnerUp && !(f.resultFresh && f.lostFinal)) return 'claims a runner-up finish'
  // R13-2: the claim asserts an EARNED climb – table movement alone (a passive climb off rivals'
  // decayed windows) does not license it.
  if (c.rankClimbed && !(f.rankClimbed && f.runPointsThisWeek > 0)) return 'claims an earned rank climb'
  if (c.angry && f.emotion !== 'angry') return 'claims the anger crossing'
  if (c.injured && f.injured === null) return 'claims an injury'
  if (c.tired && f.condition >= 80) return `claims tiredness at condition ${f.condition}`
  if (c.freshBody && f.condition < 80) return `claims freshness at condition ${f.condition}`
  if (c.travel && !f.travelled) return 'claims travel'
  if (c.tournament && !f.playedTournament) return 'claims a tournament'
  if (c.practice && !f.playedPractice) return 'claims a practice match'
  if (c.exams && !f.examsWeek) return 'claims exams'
  if (c.vacation && !f.vacationWeek) return 'claims a vacation'
  if (c.offSeason && !f.offSeasonWeek) return 'claims the off-season'
  if (c.fundsTight && f.fundsPressure !== 'tight') return 'claims money trouble'
  if (
    c.quietWeek &&
    (f.resultFresh || f.injured !== null || f.travelled || f.playedTournament || f.playedPractice ||
      f.examsWeek || f.offSeasonWeek || f.vacationWeek)
  ) {
    return 'claims an ordinary week'
  }
  return null
}

describe('THE HONESTY PIN – no selectable phrase contradicts its facts', () => {
  it('sweeps the licence space: licence(f) implies every claim holds on f', () => {
    let checked = 0
    for (const f of sweepFacts()) {
      for (const p of DIARY_POOL) {
        if (!p.license(f)) continue
        checked++
        const label = typeof p.text === 'function' ? p.text(f) : (p.text ?? '<silence>')
        const violated = claimViolation(p.claims, f)
        expect(violated, `"${label}" is selectable but ${violated}`).toBeNull()
      }
    }
    // the sweep must actually have exercised the pool, or the pin proves nothing
    expect(checked).toBeGreaterThan(5_000)
  })

  it('the named negative cases from the spec, concretely', () => {
    // a sad fresh loss licenses no positive-affect phrase
    const sad = makeFacts({ condition: 80, injured: false, result: { won: false, lostFinal: false }, rankClimbed: false, losses: 1, scenario: 'tournament' })
    expect(sad.emotion).toBe('sad')
    expect(DIARY_POOL.filter((p) => p.license(sad) && p.claims.affect === 'positive')).toEqual([])
    // no tired phrase at condition >= 80
    const fresh = makeFacts({ condition: 85, injured: false, result: null, rankClimbed: false, losses: 0, scenario: 'quiet' })
    expect(DIARY_POOL.filter((p) => p.license(fresh) && p.claims.tired)).toEqual([])
    // no travel phrase without the travel fact
    const home = makeFacts({ condition: 70, injured: false, result: null, rankClimbed: false, losses: 0, scenario: 'quiet' })
    expect(DIARY_POOL.filter((p) => p.license(home) && p.claims.travel)).toEqual([])
    // the good-loss lines need ALL THREE facts (R13-2): a loss alone, a climb alone, or a loss
    // with a PASSIVE climb (zero run points – rivals decayed out of their windows) licenses none
    const lossOnly = makeFacts({ condition: 80, injured: false, result: { won: false, lostFinal: false }, rankClimbed: false, losses: 1, scenario: 'tournament' })
    const climbOnly = makeFacts({ condition: 80, injured: false, result: null, rankClimbed: true, runPoints: 30, losses: 0, scenario: 'quiet' })
    const passiveClimb = makeFacts({ condition: 80, injured: false, result: { won: false, lostFinal: false }, rankClimbed: true, runPoints: 0, losses: 1, scenario: 'tournament' })
    expect(passiveClimb.emotion).toBe('sad') // the R1 exit the owner saw – no softening either
    for (const f of [lossOnly, climbOnly, passiveClimb]) {
      expect(DIARY_POOL.filter((p) => p.license(f) && p.claims.rankClimbed)).toEqual([])
    }
    // ...and a loss WITH an EARNED climb does license them
    const goodLoss = makeFacts({ condition: 80, injured: false, result: { won: false, lostFinal: false }, rankClimbed: true, runPoints: 30, losses: 1, scenario: 'tournament' })
    expect(goodLoss.emotion).toBe('serious')
    expect(DIARY_POOL.filter((p) => p.license(goodLoss) && p.claims.rankClimbed).length).toBeGreaterThan(0)
  })

  it('player copy discipline: short dash only, no Cyrillic, in every line of every surface', () => {
    const sample = makeFacts({ condition: 30, injured: true, result: null, rankClimbed: false, losses: 0, scenario: 'tournament' })
    for (const p of DIARY_POOL) {
      const text = typeof p.text === 'function' ? p.text(sample) : p.text
      if (text === null) continue
      expect(text, text).not.toMatch(/[—А-Яа-яЁё]/)
    }
    const m: Milestone = { type: 'season-rank', week: 49, seasonIndex: 0, rank: 12 }
    for (const line of MEMORY_LINES) {
      const text = line.text({ ...m, type: line.type, tier: 'j30', kind: 'ankle soreness' })
      expect(text, text).not.toMatch(/[—А-Яа-яЁё]/)
    }
  })
})

// ---------------------------------------------------------------------------
// Selection: deterministic per week, silent sometimes, never silent on the condition note.
// ---------------------------------------------------------------------------
describe('selection – stable per week, quiet weeks exist', () => {
  const quietAt = (week: number): DiaryFacts => ({
    ...makeFacts({ condition: 90, injured: false, result: null, rankClimbed: false, losses: 0, scenario: 'quiet' }),
    week,
  })

  it('the same week always draws the same line (no flicker, no reload lottery)', () => {
    for (const week of [8, 21, 34]) {
      const f = quietAt(week)
      expect(diaryLine('photo', f, 'seedX')).toBe(diaryLine('photo', f, 'seedX'))
      expect(diaryLine('condition', f, 'seedX')).toBe(diaryLine('condition', f, 'seedX'))
    }
  })

  it('SILENCE IS ALLOWED: over a run of ordinary weeks the photo card sometimes says nothing – and sometimes speaks', () => {
    const lines = Array.from({ length: 60 }, (_, w) => diaryLine('photo', quietAt(w), 'seedY'))
    expect(lines.some((l) => l === null)).toBe(true)
    expect(lines.some((l) => l !== null)).toBe(true)
  })

  it('the condition note always answers WHY, across every engine-coherent state', () => {
    for (const f of sweepFacts()) {
      // engine coherence: a fresh result implies a played (travelled) tournament week; an injured
      // or blacked-out week cannot play one. Impossible combinations are not the note's problem.
      if (f.resultFresh && !(f.playedTournament && f.travelled)) continue
      if (f.injured !== null && (f.playedTournament || f.playedPractice)) continue
      if ((f.examsWeek || f.offSeasonWeek) && (f.playedTournament || f.travelled)) continue
      expect(diaryLine('condition', f, 'seedZ'), JSON.stringify(f)).not.toBeNull()
    }
  })

  it('the WHY line reads the real fact: travel+tournament names the trip, exams name the exams', () => {
    const trip = {
      ...makeFacts({ condition: 60, injured: false, result: { won: false, lostFinal: false }, rankClimbed: false, losses: 1, scenario: 'tournament' }),
      resultTier: 'j30' as const,
    }
    const line = diaryLine('condition', trip, 'seedT')
    expect(line).toBeTruthy()
    // whichever of the two licensed lines is drawn, it speaks the tournament week honestly
    expect([`Still tired from the ${TIER_SHORT.j30} trip.`, 'Match week – the travel and the tennis both took their cut.']).toContain(line)
    const exams = makeFacts({ condition: 60, injured: false, result: null, rankClimbed: false, losses: 0, scenario: 'exams' })
    expect(['Exams took the week.', 'School week – the court waited.']).toContain(diaryLine('condition', exams, 'seedT'))
  })
})

// ---------------------------------------------------------------------------
// Memory (D10): the ledger's identity rule, the card's cadence, the band that makes time felt.
// ---------------------------------------------------------------------------
describe('Memory – selection', () => {
  const title: Milestone = { type: 'title', week: 10, tier: 'local' }

  it('no memories in the first ~8 weeks of a career – nothing to remember yet', () => {
    for (let week = 0; week < MEMORY_MIN_WEEKS; week++) {
      expect(selectMemory([{ type: 'title', week: 0, tier: 'local' }], week, 's', 14)).toBeNull()
    }
    expect(selectMemory([], 100, 's', 14)).toBeNull()
  })

  it('a milestone younger than ~8 weeks never echoes', () => {
    for (let week = 10; week < 10 + MEMORY_MIN_WEEKS; week++) {
      expect(selectMemory([title], week, 's', 14)).toBeNull()
    }
  })

  it('the anniversary path: ~52 weeks later (±1) the memory always shows, as "one year ago"', () => {
    for (const week of [61, 62, 63]) {
      const card = selectMemory([title], week, 'anniversary-seed', 14)
      expect(card, `week ${week}`).not.toBeNull()
      expect(card!.kind).toBe('anniversary')
      expect(card!.whenLabel).toBe('one year ago')
      expect(card!.milestone).toEqual(title)
    }
    const outside = selectMemory([title], 65, 'anniversary-seed', 14)
    if (outside) expect(outside.kind).toBe('echo')
  })

  it('the echo cadence: deterministic, roughly every 4-6 weeks, and the rest of the weeks are quiet', () => {
    // ⚠ WIDENED by A3 (28.07): the card is headed "Recent memory" and used to render "Too early for
    // memories." on every non-echo week – to a player four seasons into her career. So a week that
    // does not ECHO now falls back to her LATEST milestone (`kind: 'recent'`) and the card is never
    // empty once she has a memory at all. The cadence this test exists for is unchanged: `echo` is
    // still ~1 week in 5, and it is still the only kind that reaches back past the newest thing.
    const kinds: string[] = []
    for (let week = MEMORY_MIN_WEEKS + 10; week < MEMORY_MIN_WEEKS + 110; week++) {
      if (week >= 61 && week <= 63) continue // skip the anniversary window
      const a = selectMemory([title], week, 'cadence-seed', 14)
      const b = selectMemory([title], week, 'cadence-seed', 14)
      expect(a).toEqual(b) // pure function of (milestones, week, seed)
      expect(a, `week ${week} left the card empty`).not.toBeNull()
      kinds.push(a!.kind)
      expect(a!.whenLabel).toBe('W11 \'31') // weekLabel(10)
    }
    // p = 0.2 over ~97 weeks: a wide, non-flaky corridor around "every 4-6 weeks"
    const echoes = kinds.filter((k) => k === 'echo').length
    expect(echoes).toBeGreaterThanOrEqual(6)
    expect(echoes).toBeLessThanOrEqual(40)
    // ...and every other week is the quiet fallback, never nothing.
    expect(kinds.filter((k) => k === 'recent').length).toBe(kinds.length - echoes)
  })

  it('the card is only ever EMPTY before she has a memory to show', () => {
    // Before the eight-week floor, and for a career with nothing captured – those two, and no
    // other case. This is the pin that keeps "Too early for memories." honest.
    expect(selectMemory([title], MEMORY_MIN_WEEKS - 1, 'seed', 14)).toBeNull()
    expect(selectMemory([], 300, 'seed', 14)).toBeNull()
    // A milestone that has not aged yet does not count as one she can remember.
    expect(selectMemory([{ type: 'title', week: 298, tier: 'local' }], 300, 'seed', 14)).toBeNull()
    // ...but as soon as one HAS aged, every week answers.
    for (let week = 300; week < 340; week++) {
      expect(selectMemory([title], week, 'seed', 14), `week ${week}`).not.toBeNull()
    }
  })

  it('the quiet fallback shows her LATEST milestone, not an old one', () => {
    const first: Milestone = { type: 'title', week: 10, tier: 'local' }
    const later: Milestone = { type: 'final', week: 120, tier: 'regional' }
    // Week 200 is outside both anniversary windows, so anything showing is echo-or-recent.
    const card = selectMemory([first, later], 200, 'recent-seed', 14)!
    if (card.kind === 'recent') expect(card.milestone).toEqual(later)
  })

  it('the painting is from the band she was in THEN: a title at 17 shows the teen band at 22', () => {
    const late: Milestone = { type: 'title', week: 160, tier: 'j30' } // age 14 + 3 = 17 -> teen
    for (let week = 168; week < 400; week++) {
      const card = selectMemory([late], week, 'band-seed', 14)
      if (!card) continue
      expect(card.stage).toBe('teen')
      expect(card.emotion).toBe('happy')
      expect(card.line).toContain('J30')
      return
    }
    throw new Error('no echo fired in 232 weeks – cadence broken')
  })

  it('memory emotions stay in the composed register except the title', () => {
    expect(MEMORY_EMOTION.title).toBe('happy')
    expect(MEMORY_EMOTION.injury).toBe('injury')
    for (const t of ['final', 'international', 'season-rank'] as const) {
      expect(['norm', 'serious']).toContain(MEMORY_EMOTION[t])
    }
    // every milestone type has at least one line – a memory can never be a blank card
    for (const t of ['title', 'final', 'international', 'injury', 'season-rank'] as const) {
      expect(MEMORY_LINES.some((l) => l.type === t), t).toBe(true)
    }
  })

  it('milestone identity: one first per tier for title/final, one per career for the rest', () => {
    expect(milestoneKey({ type: 'title', week: 1, tier: 'local' })).not.toBe(milestoneKey({ type: 'title', week: 1, tier: 'j30' }))
    expect(milestoneKey({ type: 'final', week: 1, tier: 'local' })).not.toBe(milestoneKey({ type: 'title', week: 1, tier: 'local' }))
    expect(milestoneKey({ type: 'injury', week: 1, kind: 'a' })).toBe(milestoneKey({ type: 'injury', week: 9, kind: 'b' }))
    expect(milestoneKey({ type: 'international', week: 1 })).toBe(milestoneKey({ type: 'international', week: 5, tier: 'j60' }))
    expect(milestoneKey({ type: 'season-rank', week: 49, seasonIndex: 0 })).not.toBe(milestoneKey({ type: 'season-rank', week: 101, seasonIndex: 1 }))
  })
})

// ---------------------------------------------------------------------------
// The engine integration: capture at the moment, facts on the snapshot, zero surprises.
// ---------------------------------------------------------------------------
describe('capture + snapshot integration', () => {
  it('a long career captures its milestones AT THE MOMENT they happen', () => {
    const world = createWorld('diary-capture-1')
    const rng = rngFromSeed(world.seed)
    let firstInjuryOnset: { week: number; kind: string } | null = null
    const firstTitleByTier = new Map<string, number>()
    const firstFinalByTier = new Map<string, number>()
    for (let i = 0; i < 220; i++) {
      for (const e of world.season) {
        if (e.week > world.week && world.week <= e.deadlineWeek && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* blocked entries are not this test's business */
          }
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      if (firstInjuryOnset === null && world.injury) {
        firstInjuryOnset = { week: world.week, kind: world.injury.kind }
      }
      for (const e of world.events) {
        if (e.week !== world.week || e.type !== 'tournament' || e.finishIdx === undefined) continue
        const tier = tierFromLabel(e.text)
        if (!tier) continue
        if (e.finishIdx === 0 && !firstTitleByTier.has(tier)) firstTitleByTier.set(tier, e.week)
        if (e.finishIdx <= 1 && !firstFinalByTier.has(tier)) firstFinalByTier.set(tier, e.week)
      }
    }
    // injuries happen to every career this long; the ledger must hold the FIRST, at its onset week
    expect(firstInjuryOnset).not.toBeNull()
    const injuryMilestone = world.milestones.find((m) => m.type === 'injury')
    expect(injuryMilestone).toBeTruthy()
    expect(injuryMilestone!.week).toBe(firstInjuryOnset!.week)
    expect(injuryMilestone!.kind).toBe(firstInjuryOnset!.kind)
    // four seasons wrapped -> four season-rank rows, keyed on the season index
    const ranks = world.milestones.filter((m) => m.type === 'season-rank')
    expect(ranks.map((m) => m.seasonIndex)).toEqual([0, 1, 2, 3])
    for (const m of ranks) expect(m.week).toBe(m.seasonIndex! * 52 + 49)
    // she reached at least one final in 220 weeks of playing everything she could
    expect(firstFinalByTier.size).toBeGreaterThan(0)
    for (const [tier, week] of firstTitleByTier) {
      const m = world.milestones.find((x) => x.type === 'title' && x.tier === tier)
      expect(m, `title ${tier}`).toBeTruthy()
      expect(m!.week, `title ${tier}`).toBe(week)
    }
    for (const [tier, week] of firstFinalByTier) {
      const m = world.milestones.find((x) => x.type === 'final' && x.tier === tier)
      expect(m, `final ${tier}`).toBeTruthy()
      expect(m!.week, `final ${tier}`).toBe(week)
    }
    // and the ledger is bounded the way the schema note promises
    expect(world.milestones.length).toBeLessThanOrEqual(6 + 6 + 1 + 1 + 5)
  })

  it('the first INTERNATIONAL entry is captured at the entry, and survives a withdrawal', () => {
    const world = createWorld('diary-intl')
    const candidates = world.season.filter(
      (e) => (e.tier === 'j30' || e.tier === 'j60' || e.tier === 'j300') && e.week > world.week && world.week <= e.deadlineWeek,
    )
    expect(candidates.length).toBeGreaterThan(0)
    // grant each band's floor so the points gate opens (the world.test.ts marker pattern), and
    // take the first candidate whose week is not otherwise blocked (exams etc.)
    let entered: (typeof candidates)[number] | null = null
    for (const target of candidates) {
      const min = TIERS[target.tier].enterPointBand[0]
      const marker = { playerId: KID_ID, week: world.week, points: min, tier: target.tier }
      if (min > 0) world.results.push(marker)
      try {
        enterEvent(world, target.id)
        entered = target
        break
      } catch {
        world.results = world.results.filter((r) => r !== marker)
      }
    }
    expect(entered).toBeTruthy()
    const captured = world.milestones.find((m) => m.type === 'international')
    expect(captured).toBeTruthy()
    expect(captured!.week).toBe(world.week)
    expect(captured!.tier).toBe(entered!.tier)
    // withdrawing hands back the fee and the cap slot – but not the memory
    withdrawEvent(world, entered!.id)
    expect(world.milestones.find((m) => m.type === 'international')).toEqual(captured)
  })

  it('the snapshot diary is self-consistent: the facts\' emotion IS the walk over its own events', () => {
    const world = createWorld('diary-snap')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 30; i++) {
      for (const e of world.season) {
        if (e.week > world.week && world.week <= e.deadlineWeek && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* ignore */
          }
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const s = toSnapshot(world)
      expect(s.diary.conditionNote.length).toBeGreaterThan(0)
      const recomputed = avatarEmotion({
        week: s.week,
        condition: s.condition,
        injured: s.injury !== null,
        lastResult: lastKidResultOf(s.events, KID_ID),
        lastTitle: lastKidTitleOf(s.events),
        lossStreak: s.lossStreak,
        rankClimbed: s.diary.facts.rankClimbed,
        runPointsThisWeek: s.diary.facts.runPointsThisWeek,
      })
      expect(s.diary.facts.emotion).toBe(recomputed)
      // snapshotting is pure observation: doing it twice changes nothing and agrees with itself
      expect(toSnapshot(world).diary).toEqual(s.diary)
    }
  })

  it('a fresh career: no Memory card in its first 8 weeks, ever', () => {
    const world = createWorld('diary-fresh')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 8; i++) {
      expect(toSnapshot(world).diary.memory).toBeNull()
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Schema v18: the migration backfills what old saves still carry – and only that.
// ---------------------------------------------------------------------------
describe('v18 migration – the milestone backfill', () => {
  const loadFixture = (v: number) =>
    JSON.parse(read(`./fixtures/saves/v${v}.json`)) as Record<string, unknown>

  it('the v17 golden save gains a ledger read off its own surviving evidence', () => {
    const migrated = migrateSave(loadFixture(17))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    const keys = migrated.milestones.map((m) => milestoneKey(m)).sort()
    // kid result row: 48 pts at regional -> finish index 1 -> her first (surviving) final
    const final = migrated.milestones.find((m) => m.type === 'final')
    expect(final).toEqual({ type: 'final', week: 106, tier: 'regional' })
    // injuryHistory records at recovery (week 96, 2 out) -> onset week 94
    const injury = migrated.milestones.find((m) => m.type === 'injury')
    expect(injury).toEqual({ type: 'injury', week: 94, kind: 'ankle niggle' })
    // both banked seasons come back, keyed on the index, at their wrap-up weeks
    const ranks = migrated.milestones.filter((m) => m.type === 'season-rank')
    expect(ranks).toEqual([
      { type: 'season-rank', week: 49, seasonIndex: 0, rank: 128 },
      { type: 'season-rank', week: 101, seasonIndex: 1, rank: 74 },
    ])
    // first international: the earliest surviving entry-ledger slot (week 105); tier unknown -> absent
    const intl = migrated.milestones.find((m) => m.type === 'international')
    expect(intl).toEqual({ type: 'international', week: 105 })
    expect(new Set(keys).size).toBe(keys.length) // one row per identity, never a duplicate
  })

  it('is idempotent: a ledger that exists is never touched, so re-migration cannot rewrite memory', () => {
    const migrated = migrateSave(loadFixture(17))
    const before = JSON.parse(JSON.stringify(migrated.milestones))
    const again = migrateSave(migrated as unknown as Record<string, unknown>)
    expect(again.milestones).toEqual(before)
    // and the v18 golden fixture keeps its authored ledger byte-for-byte
    const fixture = loadFixture(18)
    const authored = JSON.parse(JSON.stringify(fixture.milestones))
    expect(migrateSave(fixture).milestones).toEqual(authored)
  })

  it('backfills the kept first-title event even when everything else is pruned away', () => {
    const save = loadFixture(17)
    ;(save as { results: unknown[] }).results = []
    ;(save as { events: WorldEvent[] }).events = [
      {
        id: 7,
        week: 12,
        type: 'milestone',
        keep: true,
        milestoneKey: 'first-title',
        text: '🏆 First career title: Local Open!',
      },
    ]
    ;(save as { injuryHistory: unknown[] }).injuryHistory = []
    ;(save as { seasonHistory: unknown[] }).seasonHistory = []
    ;(save as { internationalEntryWeeks: unknown[] }).internationalEntryWeeks = []
    ;(save as { injury: unknown }).injury = null
    const migrated = migrateSave(save)
    expect(migrated.milestones).toEqual([
      { type: 'title', week: 12, tier: 'local' },
      { type: 'final', week: 12, tier: 'local' },
    ])
  })

  it('earliest surviving evidence wins per identity', () => {
    const save = loadFixture(17)
    ;(save as { results: { playerId: string; week: number; points: number; tier: string }[] }).results = [
      // two locals: a week-40 title and a week-20 title – the ledger must keep week 20
      { playerId: KID_ID, week: 40, points: 30, tier: 'local' },
      { playerId: KID_ID, week: 20, points: 30, tier: 'local' },
    ]
    const migrated = migrateSave(save)
    const title = migrated.milestones.find((m) => m.type === 'title' && m.tier === 'local')
    expect(title?.week).toBe(20)
  })
})

// ---------------------------------------------------------------------------
// The surfaces: Home speaks words (D3), and the tables the copy shares stay single.
// ---------------------------------------------------------------------------
describe('surfaces + shared tables', () => {
  it('D3 REVERSED by the owner (28.07): the number is back, ONCE, inside the ring', () => {
    // D3 said "Home speaks words, not percentages". The owner reversed it when the ten squares
    // became a ProgressRing: a ring without its number is a decoration, because the fullness of an
    // arc is not readable to a percent. What D3 was actually protecting survives and is pinned
    // here – the number appears exactly ONCE, it is the engine's own condition rendered verbatim,
    // and none of the WORDS left with it.
    const home = read('../src/components/screens/HomeScreen.vue')
    const template = home.slice(home.indexOf('<template>'))
    expect(template.match(/\{\{ condition \}\}/g) ?? []).toHaveLength(1)
    expect(template).toContain('class="condition-ring-value"')
    // ...and the sign is its own element, so it can be the smaller half of the pair.
    expect(template).toMatch(/<b>\{\{ condition \}\}<\/b><i>%<\/i>/)
    expect(home).not.toMatch(/Math\.round\(condition\)/)
    // the note and the photo line still render the engine's strings verbatim
    expect(home).toContain('diary.conditionNote')
    expect(home).toContain('diary.photoLine')
    expect(home).toContain('diary.memory')
  })

  it('TIER_SHORT is ONE table: the UI re-export is the calendar object itself', () => {
    expect(TIER_SHORT_VIA_UI).toBe(TIER_SHORT)
  })

  it('the emotional surfaces still read the one composable, which reads the ENGINE\'s decision', () => {
    const composable = read('../src/composables/kidEmotion.ts')
    expect(composable).toContain('diary.facts.emotion')
    // the walk itself lives engine-side now – the composable must not have kept a copy
    expect(composable).not.toContain('lastResult')
    expect(composable).not.toContain('finishIdx')
  })
})
