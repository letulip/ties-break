// Round 13 – the owner's first Diary-1 playtest, quick pass (28.07.2026). Eight small items, one
// branch: docs/rounds/round-13.md is the ledger; every re-aimed older pin names this round at the
// spot it moved.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { ECONOMY, parentIncomeForWeekCents } from '../src/engine/economy'
import { avatarEmotion } from '../src/shared/avatarEmotion'
import { DIARY_POOL, diaryLine } from '../src/engine/diary'
import type { DiaryFacts } from '../src/shared/protocol'
import {
  bookVacation,
  createWorld,
  KID_ID,
  recomputeKidRank,
  toSnapshot,
} from '../src/engine/world'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

// ---------------------------------------------------------------------------
// R13-1 — middle income 300 -> 425 (owner asked at "400-450"; 425 is the middle of his range).
// The net-burn calibration band moved with it, deliberately: tests/economy.test.ts BANDS.middle.
// ---------------------------------------------------------------------------
describe('R13-1 — middle parent income 425/wk', () => {
  it('the knob: 425 for middle, wealthy/working untouched', () => {
    expect(ECONOMY.parentIncomeCents).toEqual({ wealthy: 750_00, middle: 425_00, working: 245_00 })
  })

  it('season 0 pays the new base every week (growth starts at season 1)', () => {
    for (const week of [1, 25, 51]) {
      expect(parentIncomeForWeekCents('r13-income', 'middle', week)).toBe(425_00)
    }
  })
})

// ---------------------------------------------------------------------------
// R13-2 — the good-loss softener demands an EARNED climb (run points > 0 this week).
// ---------------------------------------------------------------------------

/** A coherent facts object the way the engine builds one: emotion = avatarEmotion over the same
 *  inputs. Base = a fresh regional first-round loss on a healthy, solvent, travelled week. */
function lossFacts(over: Partial<DiaryFacts>): DiaryFacts {
  const f: DiaryFacts = {
    // R14-2 – not a copy licence, so the loss suite holds it null. ⚠ `travelHomeMood` joined it with
    // ui/travel-set and is null on the same weeks, so the pair still says "she came home from nothing".
    travelHomeScene: null,
    travelHomeMood: null,
    week: 10,
    emotion: 'sad', // recomputed below
    resultFresh: true,
    won: false,
    lostFinal: false,
    titleThisWeek: false,
    resultTier: 'regional',
    rankClimbed: false,
    runPointsThisWeek: 0,
    lossStreak: 1,
    condition: 80,
    conditionBand: 'fresh',
    injured: null,
    travelled: true,
    playedTournament: true,
    playedPractice: false,
    examsWeek: false,
    offSeasonWeek: false,
    vacationWeek: false,
    // ⚠ W2 added `trainPct`; this suite is the loss softener and does not read it.
    trainPct: 75,
    // ⚠ W4 added `knockChoice`/`knockPart` (what a knock is doing to the week). Null here: this
    // fixture is a week with nothing wrong with her, which is what these suites are about.
    knockChoice: null,
    knockPart: null,
    fundsPressure: 'ok',
    freshMilestone: null,
    ...over,
  }
  f.emotion = avatarEmotion({
    week: f.week,
    condition: f.condition,
    injured: f.injured !== null,
    lastResult: f.resultFresh ? { week: f.week, won: f.won, lostFinal: f.lostFinal, tier: f.resultTier ?? undefined } : null,
    lastTitle: null,
    lossStreak: f.resultFresh && !f.won && f.lossStreak > 0 ? { losses: f.lossStreak, startWeek: 5, angerAt: 99 } : null,
    rankClimbed: f.rankClimbed,
    runPointsThisWeek: f.runPointsThisWeek,
  })
  return f
}

describe('R13-2 — the climb softener requires run points, not just table movement', () => {
  const base = { week: 10, condition: 80, injured: false, lastTitle: null }
  const loss = { week: 10, won: false, lostFinal: false, tier: 'regional' as const }

  it('an EARNED climb (lost, climbed, run points > 0) still reads serious', () => {
    expect(avatarEmotion({ ...base, lastResult: loss, rankClimbed: true, runPointsThisWeek: 30 })).toBe('serious')
  })

  it('a PASSIVE climb (run points 0 – rivals decayed, she earned nothing) stays sad', () => {
    expect(avatarEmotion({ ...base, lastResult: loss, rankClimbed: true, runPointsThisWeek: 0 })).toBe('sad')
    // ...and an absent field is the same verdict: a climb that cannot be shown to be earned
    // must not soften (old callers get NO softening, never accidental softening).
    expect(avatarEmotion({ ...base, lastResult: loss, rankClimbed: true })).toBe('sad')
  })

  it('the other branches never read the new field', () => {
    expect(avatarEmotion({ ...base, lastResult: { ...loss, won: true }, rankClimbed: true, runPointsThisWeek: 0 })).toBe('happy')
    expect(
      avatarEmotion({ ...base, lastResult: { ...loss, lostFinal: true }, rankClimbed: true, runPointsThisWeek: 0 }),
    ).toBe('serious')
  })

  it('THE MECHANISM, reproduced: rank is relative – she climbs on a zero-point week when a rival\'s row decays out of the 52-week window', () => {
    const world = createWorld('r13-passive-climb')
    const rival = world.cohort[0].id
    // A clean ledger: her one counted result, and one rival result that is about to age out.
    //
    // BOTH ROWS SIT ON THE ITF TRACK (docs/specs/two-ladders.md), and they have to: `world.kidRank`
    // is her ITF rank now, so a domestic row moves the domestic table and leaves the number this
    // case is about untouched. The mechanism itself is track-blind – a 52-week window decaying a
    // rival's row out from under her – and it is reproduced here on the ladder the game gates on.
    world.results = [
      { playerId: KID_ID, week: 30, points: 9, tier: 'j30' }, // a J30 semi-final
      { playerId: rival, week: 1, points: 30, tier: 'j30' }, // ...against a J30 title
    ]
    world.week = 53 // rival's row is 52 weeks old – still inside the window
    recomputeKidRank(world)
    const before = world.kidRank
    world.week = 54 // ...and now it is out. Nothing else changed.
    recomputeKidRank(world)
    const after = world.kidRank
    expect(before).toBe(2)
    expect(after).toBe(1) // she climbed...
    // ...on a week her own ledger gained NOTHING – the exact state the owner saw the line fire on.
    expect(world.results.filter((r) => r.playerId === KID_ID && r.week === 54)).toEqual([])
  })

  it('the engine surfaces runPointsThisWeek off the results ledger (award rows at the current week)', () => {
    const world = createWorld('r13-runpts')
    expect(toSnapshot(world).diary.facts.runPointsThisWeek).toBe(0)
    world.results.push({ playerId: KID_ID, week: world.week, points: 30, tier: 'local' })
    expect(toSnapshot(world).diary.facts.runPointsThisWeek).toBe(30)
  })

  it('honesty: a first-round exit + passive climb licenses NO climb line (and reads sad)', () => {
    const passive = lossFacts({ rankClimbed: true, runPointsThisWeek: 0 })
    expect(passive.emotion).toBe('sad')
    expect(DIARY_POOL.filter((p) => p.license(passive) && p.claims.rankClimbed)).toEqual([])
    // the earned version keeps the owner's good-loss lines
    const earned = lossFacts({ rankClimbed: true, runPointsThisWeek: 40 })
    expect(earned.emotion).toBe('serious')
    expect(DIARY_POOL.filter((p) => p.license(earned) && p.claims.rankClimbed).length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// R13-3 — the Fit chip left Home's condition row (squares + D1 note carry it).
// ---------------------------------------------------------------------------
describe('R13-3 — no availability chip on Home', () => {
  const home = read('../src/components/screens/HomeScreen.vue')

  it('the chip is gone from Home – and only from Home (Season keeps its layoff chips)', () => {
    expect(home).not.toContain('avail-chip')
    expect(home).not.toContain('availabilityChip')
    const season = read('../src/components/screens/SeasonScreen.vue')
    expect(season).toContain('avail-chip red')
  })

  it('the D1 note still speaks, and the strain warning folded into the note area', () => {
    expect(home).toContain('diary.conditionNote')
    // the practice-strain read survives on the same pure predicate the planner sheet asks...
    expect(home).toContain('practiceCaution')
    // ...and keeps its two spoken arms, now as an amber note line instead of a chip
    expect(home).toContain('Worn out – she needs a rest week')
    expect(home).toContain('match weeks in a row')
    expect(home).toContain('condition-note warn')
  })

  it('the injured WHY was never the chip\'s alone: the engine note names the kind and the clock', () => {
    const diary = read('../src/engine/diary.ts')
    expect(diary).toContain('Out with the ${f.injured?.kind')
  })
})

// ---------------------------------------------------------------------------
// R13-4 — the runner-up gets her own words, exclusively.
// ---------------------------------------------------------------------------
describe('R13-4 — dedicated lostFinal lines', () => {
  const runnerUpPool = DIARY_POOL.filter((p) => p.surface === 'photo' && p.claims.runnerUp)

  it('the pool grew and carries the owner\'s line', () => {
    expect(runnerUpPool.length).toBeGreaterThanOrEqual(5)
    expect(runnerUpPool.map((p) => p.text)).toContain('Runner-up. She pushed the final all the way.')
  })

  it('a lost final selects ONLY from its own pool – never a plain-loss or climb line', () => {
    // Worst case: the final ALSO climbed the table with real points – the climb lines must still
    // stand down (they are for the non-final deep losses).
    const final = lossFacts({ lostFinal: true, rankClimbed: true, runPointsThisWeek: 40 })
    expect(final.emotion).toBe('serious')
    const licensed = DIARY_POOL.filter((p) => p.surface === 'photo' && p.license(final))
    expect(licensed.length).toBeGreaterThan(0)
    for (const p of licensed) expect(p.claims.runnerUp, String(p.text)).toBe(true)
  })

  it('the climb lines stay for NON-final deep losses that earned their climb', () => {
    const deepLoss = lossFacts({ rankClimbed: true, runPointsThisWeek: 40 })
    const climb = DIARY_POOL.filter((p) => p.license(deepLoss) && p.claims.rankClimbed)
    expect(climb.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// R13-5 / R13-8 — the sticky bar's buttons do what the label says.
// ---------------------------------------------------------------------------
describe('R13-5 — the practice week plays THROUGH the flow', () => {
  const app = read('../src/App.vue')

  it('the primary button routes through one handler, never a bare advance', () => {
    expect(app).toContain('async function playWeek')
    expect(app).not.toContain('@click="game.advance(1)"')
    expect(app).not.toContain('@click="game.advance(4)"')
  })

  it('a booked practice week opens the R10-12 flow on the resolved friendly', () => {
    expect(app).toContain("weekAhead.value.kind === 'practice'")
    expect(app).toContain('PracticeFlow')
    expect(app).toContain('practiceLive')
  })
})

describe('R13-8 — a paused tournament owns the primary button', () => {
  const app = read('../src/App.vue')
  const composable = read('../src/composables/weekAhead.ts')

  it('weekAhead answers the PENDING state first – before any week-ahead lookup', () => {
    expect(composable).toContain('if (snap.pending) return')
    expect(composable.indexOf('if (snap.pending) return')).toBeLessThan(composable.indexOf('const arrival = snap.arrival'))
    // the label keeps promising the championship, tier named off the pending run itself
    expect(composable).toContain('TIER_SHORT[snap.pending.tier]')
  })

  it('the click re-opens the overlay instead of ticking past the pause', () => {
    expect(app).toContain('if (game.snapshot?.pending) {')
    expect(app).toContain('tournamentHidden.value = false')
  })

  it('the resume banner is GONE everywhere – the global bar owns resume on every tab', () => {
    // ⚠ RE-AIMED by R13-12 (28.07). As first shipped, R13-8 dropped the banner on Home only
    // (the bar was Home-only, so off Home the banner was the sole resume control). R13-12 made
    // the bar global, which extends R13-8's own argument – "the banner duplicates the primary
    // button" – to every tab: the banner is deleted outright, and the R9-9a "no tab can strand
    // the career" property rides on the un-gated bar (pinned in tests/round9.test.ts).
    expect(app).not.toContain('tournament-paused')
    expect(app).not.toMatch(/tab !== 'home'/)
    // ⚠ RE-AIMED by wave 2: Home-only to advance, global to resume - see round13-nav.test.ts.
    expect(app).toContain(`class="next-week-bar"`)
    expect(app).toContain(`game.snapshot?.pending`)
  })
})

// ---------------------------------------------------------------------------
// R13-7a — the FREE package is bookable at negative funds.
// ---------------------------------------------------------------------------
describe('R13-7a — zero-price vacation at negative funds', () => {
  it('the staycation books in the red: nothing is charged, so nothing must be afforded', () => {
    const world = createWorld('r13-free-vacation')
    world.fundsCents = -50_00
    const week = world.week + 2
    bookVacation(world, week, 'staycation') // must not throw
    expect(world.vacations).toContainEqual({ week, packageId: 'staycation', paidCents: 0 })
    expect(world.fundsCents).toBe(-50_00)
  })

  it('a PAID package is still out of reach in the red', () => {
    const world = createWorld('r13-paid-vacation')
    world.fundsCents = -50_00
    expect(() => bookVacation(world, world.week + 2, 'seaside')).toThrow(/Not enough funds/)
  })

  it('the planner sheet mirrors the predicate (the Book button must not stay dead)', () => {
    const sheet = read('../src/components/PlanWeekSheet.vue')
    expect(sheet).toContain('priceCents === 0 ||')
  })
})

// ---------------------------------------------------------------------------
// R13-10 — quiet weeks say more: a bigger domestic pool, silence at roughly 1-in-4.
// ---------------------------------------------------------------------------
describe('R13-10 — the ordinary-week pool', () => {
  const quietFacts: DiaryFacts = {
    // R14-2 – a quiet week is a week she went nowhere. ⚠ The mood is null with the scene (ui/travel-set).
    travelHomeScene: null,
    travelHomeMood: null,
    week: 10,
    emotion: 'norm',
    resultFresh: false,
    won: false,
    lostFinal: false,
    titleThisWeek: false,
    resultTier: null,
    rankClimbed: false,
    runPointsThisWeek: 0,
    lossStreak: 0,
    condition: 90,
    conditionBand: 'fresh',
    injured: null,
    travelled: false,
    playedTournament: false,
    playedPractice: false,
    examsWeek: false,
    offSeasonWeek: false,
    vacationWeek: false,
    // ⚠ W2 added `trainPct`; the ordinary-week POOL this suite sweeps is DIARY_POOL, which is
    // not licensed on the plan (WEEK_NOTES is, and has its own sweep in tests/week-notes.test.ts).
    trainPct: 75,
    // ⚠ W4 added `knockChoice`/`knockPart` (what a knock is doing to the week). Null here: this
    // fixture is a week with nothing wrong with her, which is what these suites are about.
    knockChoice: null,
    knockPart: null,
    fundsPressure: 'ok',
    freshMilestone: null,
  }

  it('an ordinary week draws from 12 spoken lines and 4 silences – silence is exactly 1-in-4', () => {
    const pool = DIARY_POOL.filter((p) => p.surface === 'photo' && p.license(quietFacts))
    const silences = pool.filter((p) => p.text === null)
    expect(silences.length).toBe(4)
    expect(pool.length - silences.length).toBe(12)
    expect(silences.length / pool.length).toBe(0.25)
  })

  it('measured over a run of quiet weeks: mostly life, sometimes silence', () => {
    let silent = 0
    const WEEKS = 400
    for (let w = 0; w < WEEKS; w++) {
      if (diaryLine('photo', { ...quietFacts, week: w }, 'r13-quiet-seed') === null) silent++
    }
    // p = 0.25 over 400 deterministic draws – a wide, non-flaky corridor around 1-in-4
    expect(silent).toBeGreaterThanOrEqual(WEEKS * 0.15)
    expect(silent).toBeLessThanOrEqual(WEEKS * 0.35)
    expect(silent).toBeGreaterThan(0) // silence stays possible – it must remain meaningful
  })

  it('the new lines are domestic one-liners in the house style: short dash, no Cyrillic, quiet claims only', () => {
    const pool = DIARY_POOL.filter((p) => p.surface === 'photo' && p.license(quietFacts) && p.text !== null)
    for (const p of pool) {
      const text = typeof p.text === 'function' ? p.text(quietFacts) : p.text!
      expect(text, text).not.toMatch(/[—А-Яа-яЁё]/)
      expect(p.claims.quietWeek, text).toBe(true)
      expect(p.claims.affect, text).toBe('neutral')
    }
  })
})
