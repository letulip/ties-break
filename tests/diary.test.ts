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
  diaryLifeStageFor,
  fundsPressureOf,
  lastKidResultOf,
  lastKidTitleOf,
  MEMORY_DEBUT_WEEKS,
  MEMORY_EMOTION,
  MEMORY_LINES,
  MEMORY_LINE_MAX,
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
  recomputeKidRank,
  SAVE_SCHEMA_VERSION,
  skipTournament,
  tickWeek,
  toSnapshot,
  withdrawEvent,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { isExamWeek, TIER_SHORT, tierFromLabel } from '../src/engine/season/calendar'
import { TIER_SHORT as TIER_SHORT_VIA_UI } from '../src/composables/weekAhead'
import { CROPS, facePoint } from '../src/art/faceRects'
import { region, regionToLast } from './helpers/source'

/** ⭐ D-01 (05.09 review) – THE AGE CLOCK A FIXTURE CARRIES WHEN ITS SUBJECT IS NOT HER AGE.
 *
 *  `DiaryWorldView.startAgeYears: 14` became `kidAgeAt: (week) => number` – the diary no longer
 *  rebuilds an age from a starting number and a season count (the BAND clock, which parted from her
 *  real age by up to a year for a girl born late in the calendar). Every fixture in this file was
 *  written about the WORDS, so it wants the simplest total clock there is: she is fourteen in every
 *  week, which is exactly what `startAgeYears: 14` meant here. An arm about the PORTRAIT passes its
 *  own clock. */
const FIXTURE_AGE_AT = (): number => 14

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
      ageYears: 14,
      inCollege: false,
      // W4-SCHOOL: a schoolgirl, which is what every fixture in this file was written about.
      schoolOver: false,
      kidId: KID_ID,
      kidAgeAt: FIXTURE_AGE_AT,
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
      vacationPackageId: null,
      // ⚠ W2 added `trainPct` to the view (how hard the PLAYER worked her). This test is about
      // `rankClimbed` and nothing else; the balanced preset is what a career starts on.
      // ⭐ ROUND-21 #2: he stayed home, which is what every fixture in this file was written about.
      coachTravelled: false,
      trainPct: 75,
      // ⚠ W4: no knock on this view - see the DiaryFacts note in tests/week-notes.test.ts.
      knockChoice: null,
      birthdayAge: null,
      // v48: the birthday gift, unread by this builder - the default is "he has not answered".
      birthdayGift: null,
      birthdayWanted: false,
      birthdayRepeatAge: null,
      knockPart: null,
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

describe('the diary viewpoint grows up with her', () => {
  it('derives one narrative stage without adding a save field', () => {
    expect(diaryLifeStageFor(16, false, false)).toBe('school')
    expect(diaryLifeStageFor(19, true, false)).toBe('after-school')
    expect(diaryLifeStageFor(20, true, true)).toBe('college')
    expect(diaryLifeStageFor(22, true, false)).toBe('independent')
    expect(diaryLifeStageFor(31, true, false)).toBe('independent')
  })
})

/** Build a coherent facts object the way the engine would: the emotion is avatarEmotion over the
 *  same inputs, and the week-shape flags come from a named scenario. */
interface SweepResult {
  won: boolean
  lostFinal: boolean
}
function makeFacts(input: {
  condition: number
  injured: boolean
  /** R14-1: an injured week is either the ONSET (nothing ticked off yet) or a week of the layoff –
   *  two different weeks with two different sets of licensed copy, so the sweep visits both. */
  injuryOnset?: boolean
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
  const injured = input.injured
    ? { kind: 'ankle soreness', weeksRemaining: input.injuryOnset ? 3 : 2, totalWeeks: 3 }
    : null
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
    ageYears: 14,
    lifeStage: 'school',
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
    // ROUND-18 #9: the fixtures are about a schoolgirl, which is what every test here was written
    // around – the sweep flips this deliberately where it means to ask about the years after.
    schoolOver: false,
    offSeasonWeek: s === 'offSeason',
    vacationWeek: s === 'vacation',
    vacationPackageId: null,
    // ⚠ W2: the plan the player set. This sweep is the DIARY_POOL honesty pin and no line in that
    // pool is licensed on the plan, so the fixture holds the balanced preset – the week-note pool
    // that IS licensed on it has its own sweep, below, for the same reason the journey note does.
    trainPct: 75,
    // W4: no knock on this fixture - the default week is one with nothing wrong with her.
    knockChoice: null,
    birthdayAge: null,
    // v48: the birthday gift, unread by this builder - the default is "he has not answered".
    birthdayGift: null,
    birthdayWanted: false,
    birthdayRepeatAge: null,
    knockPart: null,
    fundsPressure: fundsPressureOf(input.fundsCents ?? 50_000_00),
    freshMilestone: null,
    // R14-2: this sweep is about the DIARY_POOL, and no phrase in it is licensed on the journey home
    // – so the fixture holds it null and tests/travel-home.test.ts exercises the rule.
    //
    // ⚠ THE JOURNEY GREW A SECOND FIELD AND A COPY POOL OF ITS OWN (ui/travel-set): the mood, and
    // `DiarySnapshot.travelNote`. The protected fact this sweep guards is UNCHANGED – it is that no
    // line in DIARY_POOL may assert something the week's facts do not carry, and the journey-home
    // note is not in DIARY_POOL. It lives in TRAVEL_NOTES with its own licence space and its own
    // honesty pin, in tests/travel-home.test.ts, for the same reason: its facts are the AWAY week's,
    // which this fixture does not model at all. Both fields stay null here, together, exactly as the
    // engine builds them on a week she went nowhere.
    travelHomeScene: null,
    travelHomeMood: null,
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
      // R14-1: the onset week and a mid-layoff week license DIFFERENT copy, so both are swept.
      // (`true` is a no-op when injuredFlag is false – makeFacts ignores it.)
      for (const injuryOnset of injuredFlag ? [false, true] : [false])
        for (const result of results)
          for (const rankClimbed of [false, true])
            // R13-2: the earned/passive split – 0 = a passive climb (rivals decayed), 30 = a real run
            for (const runPoints of [0, 30])
              for (const losses of [0, 2, 5])
                for (const angerAt of losses === 5 ? [5, 99] : [99])
                  for (const scenario of scenarios)
                    for (const fundsCents of [500_00, 50_000_00])
                      yield makeFacts({ condition, injured: injuredFlag, injuryOnset, result, rankClimbed, runPoints, losses, angerAt, scenario, fundsCents })
}

/** The pin's independent reading of what each claim means – a SECOND spelling on purpose, so a
 *  licence and its claims cannot be wrong together. Returns the violated claim, or null. */
function claimViolation(c: DiaryClaims, f: DiaryFacts): string | null {
  // ⚠ 'injury' -> 'rehab' AND 'injury' KEPT (R14-1). The spec's rule is "no positive line while she
  // is hurt", and the face that means "she is hurt" for the whole layoff is `rehab` now. `injury`
  // stays in the list as well: this is the pin's INDEPENDENT spelling, so it should hold for any
  // week the engine could put that face on, including the two moment surfaces – dropping it would
  // quietly narrow the guard instead of re-aiming it.
  if (
    c.affect === 'positive' &&
    (f.emotion === 'sad' || f.emotion === 'angry' || f.emotion === 'rehab' || f.emotion === 'injury')
  ) {
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
  if (c.birthday && f.birthdayAge === null) return 'claims a birthday'
  // R14-1: strictly stronger than `injured` – the line asserts the week it HAPPENED. Spelled here
  // independently of engine/diary.ts's `justHurt`, like every other claim in this function.
  if (c.justHurt && !(f.injured !== null && f.injured.weeksRemaining === f.injured.totalWeeks)) {
    return 'claims the injury happened this week'
  }
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

  // ⚠ ROUND-18 #9. The owner found "Off-season – rest, school, family." in a twenty-one-year-old's
  // diary, 171 weeks after her last September. The cause was structural rather than a typo: the
  // facts handed to a licence carried `examsWeek` but not `schoolOver`, so a phrase COULD NOT gate
  // on school even if its author wanted to. Pinning the one line would leave the next school phrase
  // free to repeat it, so this sweeps the catalogue by what the words SAY: any phrase that talks
  // about school must be unlicensed once school is behind her.
  it('no phrase names school after her last school year', () => {
    const saysSchool = (t: string): boolean => /\bschool\b|\bclass(es|room)?\b|\blesson/i.test(t)
    // ⚠ EXAM WEEKS ARE NOT A SEPARATE CASE, they are impossible: `isExamWeek(week, schoolOver)`
    // returns false once school is over, so an exam phrase naming school is already unreachable.
    // The sweep has to honour that coupling or it invents a state the engine cannot produce and
    // reports the exam lines as bugs – which it did, on the first run of this pin.
    for (let w = 0; w < 52; w++) expect(isExamWeek(w, true), `week ${w}`).toBe(false)
    let out = 0
    for (const f of sweepFacts()) {
      const past = { ...f, schoolOver: true, examsWeek: false }
      for (const p of DIARY_POOL) {
        if (!p.license(past)) continue
        const label = typeof p.text === 'function' ? p.text(past) : (p.text ?? '')
        if (!saysSchool(label)) continue
        out++
        expect.fail(`"${label}" is selectable ${past.week} weeks in, with school already over`)
      }
    }
    expect(out).toBe(0)
    // and the guard has to have something to guard: the phrase EXISTS while she is still at school
    const schoolgirl = [...sweepFacts()].some((f) =>
      DIARY_POOL.some((p) => {
        if (!p.license({ ...f, schoolOver: false })) return false
        const label = typeof p.text === 'function' ? p.text(f) : (p.text ?? '')
        return saysSchool(label)
      }),
    )
    expect(schoolgirl, 'the school phrasing vanished entirely – then this pin proves nothing').toBe(true)
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

  // ===========================================================================
  // R14-1 — injury is a MOMENT, rehab is the STATE, and the copy splits with the face.
  // ===========================================================================
  it('the layoff copy and the onset copy are different weeks, and neither leaks into the other', () => {
    const onset = makeFacts({ condition: 60, injured: true, injuryOnset: true, result: null, rankClimbed: false, losses: 0, scenario: 'quiet' })
    const week3 = makeFacts({ condition: 60, injured: true, injuryOnset: false, result: null, rankClimbed: false, losses: 0, scenario: 'quiet' })
    // Both weeks wear the layoff face – the owner's rule: rehab on the main screen for the WHOLE
    // layoff, the injury painting only in the popup at the moment.
    expect(onset.emotion).toBe('rehab')
    expect(week3.emotion).toBe('rehab')

    const photo = (f: typeof onset) =>
      DIARY_POOL.filter((p) => p.surface === 'photo' && p.license(f)).map((p) => p.text)
    const onsetLines = photo(onset)
    const layoffLines = photo(week3)

    // The ice pack is NEWS: it appears the week it happened and not in week three.
    expect(onsetLines).toContain('The ice pack lives on the kitchen counter now.')
    expect(layoffLines).not.toContain('The ice pack lives on the kitchen counter now.')
    // Watching from the bench and counting down need the layoff to have LENGTH.
    expect(layoffLines).toContain('She watches practice from the bench this week.')
    expect(layoffLines).toContain('She counts the weeks to her return out loud.')
    // Every injured week still has something to say – the split must not create a silent week.
    expect(onsetLines.length).toBeGreaterThan(0)
    expect(layoffLines.length).toBeGreaterThan(0)

    // ...and no line anywhere is still licensed on the retired meaning of `emotion === 'injury'`,
    // which the emotion ladder can no longer produce – that would be dead copy.
    const deadCopy = DIARY_POOL.filter((p) => {
      const neverAgain = { ...week3, emotion: 'injury' as const }
      return p.license(neverAgain) && !p.license(week3) && !p.license(onset)
    })
    expect(deadCopy.map((p) => p.text), 'lines reachable ONLY through the retired injury face').toEqual([])
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

  // ⚠ THE WHOLE BLOCK BELOW WAS RE-AIMED BY W3 (owner, 30.07): «Recent memory "too early for
  // memories" – why? ... Only after 10 weeks I saw a first memory. I believe we could pin it faster
  // and maybe make rotation of all previous?»
  //
  // TWO THINGS MOVED, and neither of them is a protected fact of this suite:
  //   1. THE FLOOR. `MEMORY_MIN_WEEKS` 8 -> 4 (how old a MILESTONE must be), and a new
  //      `MEMORY_DEBUT_WEEKS` (2) gates the function itself, because the career's OPENING WEEK is now
  //      a memory in its own right (`kind: 'debut'`, `milestone: null`). So "the card is empty at the
  //      start" is still true and is still pinned – for two weeks instead of eight.
  //   2. THE DEFAULT BRANCH ROTATES instead of pinning her newest milestone, which is the owner's
  //      second ask. The echo COIN is therefore gone: the rotation reaches back every week, so a
  //      probability deciding whether to reach back at all had nothing left to decide.
  //
  // WHAT IS STILL PROTECTED, unchanged, and is what these tests are for: the function is a pure
  // deterministic function of (milestones, week, seed); an anniversary always wins; the card is never
  // EMPTY once she has anything to remember; and the painting is the band she was in THEN.

  it('the card is empty only at the very start of a career – two weeks, not eight', () => {
    for (let week = 0; week < MEMORY_DEBUT_WEEKS; week++) {
      expect(selectMemory([{ type: 'title', week: 0, tier: 'local' }], week, 's', FIXTURE_AGE_AT)).toBeNull()
    }
    // ...and from then on it always answers, even with an empty ledger: the opening week IS the
    // first memory. This is the owner's "when would it not be too early" made concrete.
    for (let week = MEMORY_DEBUT_WEEKS; week < 40; week++) {
      const card = selectMemory([], week, 's', FIXTURE_AGE_AT)
      expect(card, `week ${week}`).not.toBeNull()
      expect(card!.kind).toBe('debut')
      expect(card!.milestone).toBeNull()
      expect(card!.line.length).toBeGreaterThan(10)
    }
  })

  it('a milestone younger than the floor is not yet a memory – the debut card holds the slot', () => {
    for (let week = 10; week < 10 + MEMORY_MIN_WEEKS; week++) {
      const card = selectMemory([title], week, 's', FIXTURE_AGE_AT)
      // Not null any more (W3), but it may not be the fresh milestone either: a thing she did this
      // month is not something she remembers. The debut is what fills the card until it ages in.
      expect(card!.kind).toBe('debut')
    }
    // ...and the moment it HAS aged, the rotation can reach it.
    const reached = Array.from({ length: 12 }, (_, i) => selectMemory([title], 10 + MEMORY_MIN_WEEKS + i, 's', FIXTURE_AGE_AT)!)
    expect(reached.some((c) => c.milestone !== null)).toBe(true)
  })

  it('the anniversary path: ~52 weeks later (±1) the memory always shows, as "one year ago"', () => {
    for (const week of [61, 62, 63]) {
      const card = selectMemory([title], week, 'anniversary-seed', FIXTURE_AGE_AT)
      expect(card, `week ${week}`).not.toBeNull()
      expect(card!.kind).toBe('anniversary')
      expect(card!.whenLabel).toBe('one year ago')
      expect(card!.milestone).toEqual(title)
    }
    // Outside the window it is the ordinary rotation again, whichever entry that lands on.
    const outside = selectMemory([title], 65, 'anniversary-seed', FIXTURE_AGE_AT)!
    expect(outside.kind).not.toBe('anniversary')
  })

  it('THE ROTATION: every entry in the album comes round, deterministically, with no stored cursor', () => {
    const first: Milestone = { type: 'title', week: 10, tier: 'local' }
    const mid: Milestone = { type: 'final', week: 60, tier: 'regional' }
    const last: Milestone = { type: 'international', week: 100, tier: 'j30' }
    const seen = new Set<string>()
    for (let week = 200; week < 240; week++) {
      const a = selectMemory([first, mid, last], week, 'rotation-seed', FIXTURE_AGE_AT)
      const b = selectMemory([first, mid, last], week, 'rotation-seed', FIXTURE_AGE_AT)
      expect(a).toEqual(b) // still a pure function of (milestones, week, seed)
      expect(a, `week ${week} left the card empty`).not.toBeNull()
      seen.add(a!.milestone === null ? 'debut' : `${a!.milestone.type}:${a!.milestone.week}`)
    }
    // The opening week and all three milestones, inside forty weeks – this is the owner's
    // "rotation of all previous". The old code could only ever have shown `last` plus a 1-in-5 echo.
    expect([...seen].sort()).toEqual(['debut', 'final:60', 'international:100', 'title:10'])
    // ...and only the newest of them is ever called `recent`, so the kinds still mean something.
    const kinds = Array.from({ length: 40 }, (_, i) => selectMemory([first, mid, last], 200 + i, 'rotation-seed', FIXTURE_AGE_AT)!)
    for (const c of kinds) {
      if (c.kind === 'recent') expect(c.milestone).toEqual(last)
      if (c.kind === 'debut') expect(c.milestone).toBeNull()
    }
  })

  it('the card is only ever EMPTY before she has a memory to show', () => {
    // ⚠ W3: "before the eight-week floor" became "before the two-week one", and an empty ledger is
    // no longer one of the cases – the opening week is itself a memory. This is still the pin that
    // keeps "Too early for memories." honest; it is just a far smaller window now.
    expect(selectMemory([title], MEMORY_DEBUT_WEEKS - 1, 'seed', FIXTURE_AGE_AT)).toBeNull()
    expect(selectMemory([], 300, 'seed', FIXTURE_AGE_AT)).not.toBeNull()
    for (let week = 300; week < 340; week++) {
      expect(selectMemory([title], week, 'seed', FIXTURE_AGE_AT), `week ${week}`).not.toBeNull()
    }
  })

  it('the painting is from the age she was THEN: a title at 17 shows the teen band at 23', () => {
    // ⚠⚠ RE-AIMED BY D-01 (05.09 review), AND ONTO A CLAIM THE OLD ARM COULD NOT MAKE. It read
    // `startAgeYears + Math.floor(pick.week / 52)` – one number and the calendar – so "her age then"
    // and "her age now" were the same arithmetic and the arm could not tell them apart. The card
    // now asks the world's own clock, and the clock this arm hands it ANSWERS DIFFERENTLY FOR THE
    // TWO WEEKS: seventeen at the milestone, twenty-three by the week the rotation reads it. Only a
    // card that asks about `pick.week` can come back 'teen'; one that asks about `week` says
    // 'adult'. Same protected fact – the painting is the girl who won it – proved properly.
    const ageAt = (w: number): number => (w <= 160 ? 17 : 23)
    const late: Milestone = { type: 'title', week: 160, tier: 'j30' }
    for (let week = 168; week < 400; week++) {
      const card = selectMemory([late], week, 'band-seed', ageAt)
      // ⚠ W3: the debut card is also reachable on these weeks and it is a picture of week 0, so the
      // band assertion belongs to the weeks the rotation lands on the MILESTONE. Same protected
      // fact: the painting is the band she was in when it happened, not the band she is in now.
      if (!card || card.milestone === null) continue
      expect(card.stage).toBe('teen')
      expect(card.emotion).toBe('happy')
      expect(card.line).toContain('J30')
      return
    }
    throw new Error('the rotation never reached the milestone in 232 weeks')
  })

  it('every memory line fits the polaroid card, debut lines included', () => {
    // ⚠ W3 ADDED THIS PIN because the browser caught what the suite could not: a fifty-character
    // debut line does not clip, it STRETCHES Home's 2x2 grid row from 138px to 207px and the memory
    // card stops matching the coach card beside it. The budget is the longest line the pool already
    // had; the real constraint is pixels in a handwriting face, and this is the cheap proxy for it.
    const samples: Milestone[] = [
      { type: 'title', week: 10, tier: 'j300' },
      { type: 'final', week: 10, tier: 'regional' },
      // R15-5: the cheque rung is always a W rung (junior tennis pays nothing), and the no-tier arm
      // covers a defensively-absent tier.
      { type: 'prize', week: 10, tier: 'w15' },
      { type: 'prize', week: 10 },
      { type: 'international', week: 10, tier: 'j30' },
      { type: 'injury', week: 10, kind: 'ankle soreness' },
      { type: 'season-rank', week: 10, seasonIndex: 3, rank: 145 },
    ]
    for (const m of samples) {
      const lines = MEMORY_LINES.filter((l) => l.type === m.type)
      expect(lines.length, `no line for ${m.type}`).toBeGreaterThan(0)
      for (const l of lines) {
        const text = l.text(m)
        expect(text.length, text).toBeLessThanOrEqual(MEMORY_LINE_MAX)
        expect(text, text).not.toContain('—')
      }
    }
    // The debut card's own lines go through selectMemory, so they are measured as rendered.
    const debut = new Set<string>()
    for (let week = 2; week < 200; week++) debut.add(selectMemory([], week, `s${week}`, FIXTURE_AGE_AT)!.line)
    expect(debut.size, 'the opening week must not be one sentence forever').toBeGreaterThan(2)
    for (const line of debut) {
      expect(line.length, line).toBeLessThanOrEqual(MEMORY_LINE_MAX)
      expect(line, line).not.toContain('—')
      expect(line, line).not.toMatch(/[Ѐ-ӿ]/)
    }
  })

  it('the debut card is a picture of the girl who STARTED – her band at week 0, composed', () => {
    // The onboarding hero is `jun-norm`; the first page of the album is the same picture, so the
    // card reads as the beginning rather than as a missing entry.
    const card = selectMemory([], 300, 'debut-seed', FIXTURE_AGE_AT)!
    expect(card.stage).toBe('young')
    expect(card.emotion).toBe('norm')
    expect(card.whenLabel).toBe("W1 '31")
    // ...and it is stable per week, like every other line in this module.
    expect(selectMemory([], 300, 'debut-seed', FIXTURE_AGE_AT)).toEqual(card)
  })

  it('memory emotions stay in the composed register except the title and the cheque', () => {
    expect(MEMORY_EMOTION.title).toBe('happy')
    // R15-5: the first cheque earned the same smile the first title did - the week the tennis
    // stopped being only a bill.
    expect(MEMORY_EMOTION.prize).toBe('happy')
    expect(MEMORY_EMOTION.injury).toBe('injury')
    for (const t of ['final', 'international', 'season-rank'] as const) {
      expect(['norm', 'serious']).toContain(MEMORY_EMOTION[t])
    }
    // every milestone type has at least one line – a memory can never be a blank card
    for (const t of ['title', 'final', 'prize', 'international', 'injury', 'season-rank'] as const) {
      expect(MEMORY_LINES.some((l) => l.type === t), t).toBe(true)
    }
  })

  it('milestone identity: one first per tier for title/final, one per career for the rest', () => {
    expect(milestoneKey({ type: 'title', week: 1, tier: 'local' })).not.toBe(milestoneKey({ type: 'title', week: 1, tier: 'j30' }))
    expect(milestoneKey({ type: 'final', week: 1, tier: 'local' })).not.toBe(milestoneKey({ type: 'title', week: 1, tier: 'local' }))
    expect(milestoneKey({ type: 'injury', week: 1, kind: 'a' })).toBe(milestoneKey({ type: 'injury', week: 9, kind: 'b' }))
    expect(milestoneKey({ type: 'international', week: 1 })).toBe(milestoneKey({ type: 'international', week: 5, tier: 'j60' }))
    // R15-5: the first cheque is per CAREER - a W35 cheque two seasons later is not a second first.
    expect(milestoneKey({ type: 'prize', week: 1, tier: 'w15' })).toBe(milestoneKey({ type: 'prize', week: 90, tier: 'w35' }))
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
    // ⚠ 220 -> 260 BY W3-ONRAMP (04.08), AND IT IS THE FIXTURE'S PREMISE THAT MOVED, NOT ITS CLAIM.
    // This case is about the CAPTURE ("the ledger holds the FIRST injury, at its onset week"); the
    // horizon is only here to make sure a career this long has one to capture. The AI on-ramp puts
    // cohort players on the merged W table, which pushes her a few places down it, which changes
    // which W rungs accept her, which changes what she plays – and on THIS seed the first onset
    // moved from loop index 90 to 236. Measured both arms with tools/w-onramp-probe.ts's own switch
    // (`ON_RAMP.slots` 0 vs 6): the career is not less injury-prone, it is a different career.
    // Every assertion below is unchanged in substance and two of them now DERIVE from the horizon
    // instead of hard-coding a season count, so the next content wave re-aims nothing.
    const HORIZON = 260
    for (let i = 0; i < HORIZON; i++) {
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
    // every season wrapped inside the horizon -> one season-rank row each, keyed on the season index
    // (the wrap fires on week 49 of each season, so the count is a function of HORIZON alone).
    const wrapped = []
    for (let w = 1; w <= HORIZON; w++) if (w % 52 === 49) wrapped.push((w - 49) / 52)
    const ranks = world.milestones.filter((m) => m.type === 'season-rank')
    expect(ranks.map((m) => m.seasonIndex)).toEqual(wrapped)
    for (const m of ranks) expect(m.week).toBe(m.seasonIndex! * 52 + 49)
    // she reached at least one final in a career of playing everything she could
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
    expect(world.milestones.length).toBeLessThanOrEqual(6 + 6 + 1 + 1 + wrapped.length)
  })

  it('the first INTERNATIONAL entry is captured at the entry, and survives a withdrawal', () => {
    const world = createWorld('diary-intl')
    const candidates = world.season.filter(
      (e) => (e.tier === 'j30' || e.tier === 'j60' || e.tier === 'j300') && e.week > world.week && world.week <= e.deadlineWeek,
    )
    expect(candidates.length).toBeGreaterThan(0)
    // TWO LADDERS (docs/specs/two-ladders.md): an international entry is no longer a points floor
    // she can be handed in one row, so the old per-candidate marker opened nothing. J30 is the
    // on-ramp and reads her DOMESTIC standing; J60 and J300 are an acceptance list and read her ITF
    // RANK, which they refuse to read at all until she owns a counting ITF result. She is therefore
    // given both halves of a real career before the entry – a national book that clears the on-ramp,
    // and four J300 titles that put her inside the top 50 – so that whichever rung comes up first is
    // one she could genuinely be on the list for. What this case is about is the CAPTURE, not the
    // gate, and the capture cannot be observed until she can make the entry at all.
    world.results.push({ playerId: KID_ID, week: world.week, points: 1000, tier: 'national' })
    for (let i = 0; i < 4; i++) {
      world.results.push({ playerId: KID_ID, week: world.week, points: 300, tier: 'j300' })
    }
    recomputeKidRank(world)
    // ...then take the first candidate whose week is not otherwise blocked (exams etc.)
    let entered: (typeof candidates)[number] | null = null
    for (const target of candidates) {
      try {
        enterEvent(world, target.id)
        entered = target
        break
      } catch {
        /* blocked for a reason that is not the ladder – try the next candidate */
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

  // ⚠ RE-AIMED BY W3 (owner, 30.07: «Only after 10 weeks I saw a first memory ... we could pin it
  // faster»). This test USED to walk the first eight weeks of a live career and demand `null` on
  // every one of them – which is precisely the behaviour he was complaining about, measured and
  // guarded. The protected fact underneath it survives and is what the walk now checks: the card
  // never lies about how far back it can see, and it is empty only while the career genuinely has
  // nothing behind it. That window is now two weeks (MEMORY_DEBUT_WEEKS), and from week 2 the card
  // shows the opening week.
  it('a fresh career: the card is empty for two weeks, then remembers the week it started', () => {
    const world = createWorld('diary-fresh')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 10; i++) {
      const memory = toSnapshot(world).diary.memory
      if (world.week < MEMORY_DEBUT_WEEKS) {
        expect(memory, `week ${world.week}`).toBeNull()
      } else {
        expect(memory, `week ${world.week}`).not.toBeNull()
        // Nothing has aged in yet on a career this young, so it can only be the opening week – and
        // it may never claim to be a milestone she has not reached.
        expect(memory!.kind).toBe('debut')
        expect(memory!.milestone).toBeNull()
      }
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
    const template = regionToLast(home, '<template>', '</template>')
    // ⚠ RE-AIMED TWICE, AND THE PROTECTED FACT HAS NOT MOVED EITHER TIME. U0 put the label inside
    // `ui/ProgressRing.vue` but left the `<b>…</b><i>%</i>` pair for each caller to hand-write; the
    // owner then asked for one entity instead of four – «вообще из этого надо компонент сделать и
    // везде использовать, зачем сущности плодить?» – so the ring now renders the figure ITSELF from
    // `value`. Home therefore no longer contains the markup, and asserting it here would be pinning
    // the duplication we were asked to remove.
    //
    // What D3 protects is unchanged and is now checked where it lives: the number appears exactly
    // ONCE, inside the ring, as the engine's own condition, with the sign as its own smaller
    // element on the same baseline. Home's half of that is that it passes the condition and writes
    // no percentage of its own.
    expect(template).toContain('<ProgressRing')
    expect(template).toContain(':value="condition / 100"')
    expect(template.match(/\{\{ condition \}\}/g) ?? []).toHaveLength(0)
    expect(home).not.toMatch(/<i>%<\/i>/)
    expect(home).not.toMatch(/Math\.round\(condition\)/)
    const ring = read('../src/components/ui/ProgressRing.vue')
    expect(ring).toContain('class="tb-ring-value"')
    // ONE place renders the figure, and the sign is its own element so it can be the smaller half.
    expect(ring.match(/Math\.round\(value \* 100\)/g) ?? []).toHaveLength(1)
    expect(ring).toMatch(/<b>\{\{ Math\.round\(value \* 100\) \}\}<\/b><i>%<\/i>/)
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

// =================================================================================================
// ⚠ SIX HOLIDAYS, SIX NOTES - AND THE SENTENCES CLIMB WITH WHAT THE WEEK ACTUALLY GAVE HER
// =================================================================================================
//
// Owner, 31.07: «Со своими итоговыми записками на week recap, а то сейчас куда бы ни поехала и
// расписание одинаковое, и week recap, ну кроме картинки».
//
// He named the cause precisely. `vacationPackageId` reached the diary from the day the paintings
// shipped, and `weekSceneFor` was the ONLY thing that read it - so six different weeks away were
// captioned with one sentence and told apart by the picture alone.
describe('a week away says which week away it was', () => {
  const IDS = ECONOMY.vacation.packages.map((p) => p.id)
  // Built off the file's own `makeFacts` so the week is a REAL vacation week in every other respect;
  // only the package id varies, which is the one thing under test.
  const away = (packageId: string | null): DiaryFacts => ({
    ...makeFacts({ condition: 90, injured: false, result: null, rankClimbed: false, losses: 0, scenario: 'vacation' }),
    vacationPackageId: packageId,
  })

  for (const surface of ['photo', 'condition'] as const) {
    it(`every package has its own ${surface} line, and no two are the same sentence`, () => {
      // Derived from the catalogue: a seventh package fails here rather than quietly inheriting the
      // generic sentence, which is the exact failure this whole block is about.
      const lines = IDS.map((id) => {
        const pool = DIARY_POOL.filter((p) => p.surface === surface && p.license(away(id)))
        const own = pool.filter((p) => typeof p.text === 'string' && p.license(away(id)) && !p.license(away(null)))
        expect(own.length, `${id} has no ${surface} line of its own`).toBeGreaterThan(0)
        return own.map((p) => p.text as string)
      })
      const flat = lines.flat()
      expect(new Set(flat).size, 'two packages share a sentence').toBe(flat.length)
    })
  }

  it('the generic line survives, and fires exactly where it is still right', () => {
    // ⚠ NOT DELETED. Bookings are retained four trailing weeks; past that the save genuinely does not
    // know where she went, and "A week away. The racquet stayed home." is the honest sentence for a
    // week whose destination has been forgotten. It is narrowed to that case, not removed.
    const forgotten = DIARY_POOL.filter((p) => p.surface === 'photo' && p.license(away(null)))
    expect(forgotten.some((p) => p.text === 'A week away. The racquet stayed home.')).toBe(true)
    // ...and it must NOT compete with a package's own line on a week that knows its package.
    const known = DIARY_POOL.filter((p) => p.surface === 'photo' && p.license(away('seaside')))
    expect(known.some((p) => p.text === 'A week away. The racquet stayed home.')).toBe(false)
  })

  it('⚠ a cheap week never claims what an expensive one delivers', () => {
    // The honesty rule of this file, applied to the new pool. The packages differ by `conditionGain`
    // (12 -> 30) and the sentences are written to climb with it; the machine-checkable half of that
    // is that the two ENDS of the ladder do not swap lines - a staycation reading like the clinic is
    // the diary's cardinal sin wearing a sun hat.
    const ladder = [...ECONOMY.vacation.packages].sort((a, b) => a.conditionGain - b.conditionGain)
    const lineFor = (id: string) =>
      DIARY_POOL.filter((p) => p.surface === 'condition' && p.license(away(id)) && !p.license(away(null)))
        .map((p) => p.text as string)
        .join(' ')
    expect(lineFor(ladder[0].id)).not.toBe(lineFor(ladder[ladder.length - 1].id))
    // Every one of them still claims a POSITIVE condition week, because every package is rest.
    for (const p of ECONOMY.vacation.packages) {
      const pool = DIARY_POOL.filter((x) => x.surface === 'condition' && x.license(away(p.id)) && !x.license(away(null)))
      for (const line of pool) expect(line.claims.affect, `${p.id} must read as a good week`).toBe('positive')
    }
  })
})

// =================================================================================================
// ⚠ A PERMANENT FACT IS NEVER READ OUT OF A WINDOW THAT MOVES
// =================================================================================================
//
// Owner, 31.07: «кажется в Important moments на экране профиля девочки вообще ничего не происходит.
// Может этот блок вообще стоит убрать из верстки?»
//
// It should not be removed - it had no data, for a reason that is a whole class of bug in this app
// rather than a feature being wrong. The strip scraped `snapshot.events` for milestone rows. Those
// rows carry `keep: true`, so `pruneEvents` never touches them IN THE WORLD - but the snapshot ships
// `events.slice(-60)`, and that slice is POSITIONAL. Sixty newer rows is a couple of months of play,
// so a first title from season one falls out and never comes back: the block works for a fortnight
// and then fails silently for ever, which is worse than never working because nothing tells you.
//
// The same shape has now bitten twice (the radar's evidence was the other). So this pins the rule.
describe('the durable ledger reaches the screen that needs it', () => {
  it('the snapshot carries `milestones` whole, not a slice of the feed', () => {
    const world = createWorld('moments-ledger')
    world.milestones = [
      { type: 'title', week: 3, tier: 'local' },
      { type: 'international', week: 40, tier: 'j30' },
    ]
    const snap = toSnapshot(world)
    expect(snap.milestones).toHaveLength(2)
    expect(snap.milestones.map((m) => m.type)).toEqual(['title', 'international'])
  })

  it('...and it survives a feed long enough to have flushed the milestone events out of it', () => {
    // The failing case, built exactly as a real career reaches it: far more than SNAPSHOT_EVENTS
    // ordinary rows on top of an old milestone. The feed forgets; the ledger must not.
    const world = createWorld('moments-flush')
    world.milestones = [{ type: 'title', week: 3, tier: 'local' }]
    for (let i = 0; i < 200; i++) {
      world.events.push({ id: i, week: 10 + i, type: 'expense', text: 'a bill' })
    }
    const snap = toSnapshot(world)
    expect(snap.events.some((e) => e.type === 'milestone'), 'the feed has flushed, as designed').toBe(false)
    expect(snap.milestones, 'the ledger has not').toHaveLength(1)
  })

  it('⚠ the Kid screen reads the LEDGER and not the feed', () => {
    // Source-level, and deliberately so: jsdom renders no layout and the failure mode here is not a
    // thrown error but an empty strip on a save nobody in CI plays for long enough to reach.
    const kid = readFileSync(new URL('../src/components/screens/KidScreen.vue', import.meta.url), 'utf8')
    const moments = region(kid, 'const moments = computed', '// --- THE SKILLS RADAR')
    expect(moments).toContain('snap.milestones')
    expect(moments, 'the moments strip is back on the volatile feed').not.toContain('snap.events')
  })
})
