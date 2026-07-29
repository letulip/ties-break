// THE SKILLS RADAR (docs/specs/skills-radar.md, decisions.md #11) – the fog-of-war contour.
//
// THE TESTS THAT MATTER MOST here are the two HONESTY PINS and the FLOOR, because everything this
// slice builds is invisible by design and cannot be eyeballed on a screen:
//
//   1. THE FOG IS AN HONEST CLAIM. `band` says "the truth is within this much" and it must be true
//      of EVERY axis of EVERY career at EVERY week – otherwise the contour is not uncertain, it is
//      simply wrong. Same for the outer haze: the true ceiling always lies inside it.
//   2. THE SCREEN NEVER SEES THE TRUTH. The snapshot carries no `skills` and no `potential`; a
//      surface cannot leak what it has never been given.
//   3. THE CEILING BAND HITS A FLOOR AND STOPS. `potential` is rolled once and never moves, so an
//      outer band that narrowed without limit would let a patient player read the exact ceiling off
//      the screen. This is the difference between "talent is discovered" and "talent is displayed
//      after a delay", and it is one constant.
//
// The numbers quoted in the comments below come from tools/radar-bench.ts (`npm run bench:radar`).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  axisConfidence,
  axisEvidence,
  axisNote,
  buildRadar,
  bandFor,
  ceilingHalfWidth,
  composureUnitsOf,
  radarConfidence,
  readScoreline,
  staminaUnitsOf,
  technicalUnitsOf,
  tenureRamp,
  testedFraction,
  CEILING_CENTRE_DRIFT,
  CEILING_FLOOR_HALF,
  CEILING_MAX_HALF,
  COACH_ACCURACY,
  COACH_EYE,
  NOTE_MIN_CONFIDENCE,
  RADAR_BAND_MAX,
  type RadarWorldView,
} from '../src/engine/radar'
import { SKILL_KEYS, type KidSkills, type SkillKey } from '../src/engine/development'
import { COACH_TIERS } from '../src/engine/coach'
import {
  availabilityStatus,
  closeTournament,
  coachSinceWeek,
  createWorld,
  enterEvent,
  hireCoach,
  KID_ID,
  matchesEverPlayed,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CoachTier, type WorldMatch } from '../src/shared/protocol'
import type { MatchPlayer } from '../src/engine/match/types'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

// --- fixtures ----------------------------------------------------------------------------------

function player(id: string, over: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id, name: id, serve: 50, ret: 50, composure: 50, stamina: 50, ...over }
}

/** A history of `n` identical matches – the only way to hold everything about a career still except
 *  what the scorelines say happened. */
function synthView(over: Partial<RadarWorldView> & { n?: number; score?: string; opp?: Partial<MatchPlayer> } = {}): RadarWorldView {
  const n = over.n ?? 20
  const score = over.score ?? '6-4 6-3'
  const matches: WorldMatch[] = Array.from({ length: n }, (_, i) => ({
    round: 0,
    aId: KID_ID,
    bId: `ai-${i}`,
    winnerId: KID_ID,
    score,
    eventId: `e${i}`,
    surface: 'hard' as const,
    oppName: `Opp ${i}`,
    a: player(KID_ID),
    b: player(`ai-${i}`, over.opp),
  }))
  const skills: KidSkills = { serve: 50, ret: 50, composure: 50, stamina: 50 }
  const potential: KidSkills = { serve: 66, ret: 66, composure: 66, stamina: 66 }
  return {
    seed: 'radar-test',
    week: 52,
    kidId: KID_ID,
    skills,
    potential,
    coachTier: 'middle',
    coachSinceWeek: 0,
    matchesPlayed: n,
    matches,
    ...over,
  }
}

/** A career driven the way the bench drives one: enter everything, resolve everything. */
function runCareer(seed: string, tier: CoachTier, weeks: number, onWeek?: (w: WorldState) => void): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: tier })
  const rng = rngFromSeed(world.seed)
  world.plan = { ...WEEK_PLAN_PRESETS.balanced }
  for (let w = 0; w < weeks; w++) {
    for (const e of world.season.filter((e) => e.week > world.week && e.week <= world.week + 4)) {
      if (world.entries.includes(e.id)) continue
      try {
        if (availabilityStatus(world, e).level === 'blocked') continue
        enterEvent(world, e.id)
      } catch {
        /* a lock the player would see on the card */
      }
    }
    tickWeek(world, rng)
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
    onWeek?.(world)
  }
  return world
}

// ---------------------------------------------------------------------------
// 1. THE CONTRACT
// ---------------------------------------------------------------------------
describe('radar – the contract the UI is given', () => {
  it('a snapshot carries four axes, in SKILL_KEYS order, from week 1', () => {
    const world = createWorld('radar-contract', DEFAULT_PROFILE)
    const snap = toSnapshot(world)
    expect(snap.radar.map((a) => a.key)).toEqual([...SKILL_KEYS])
  })

  it('every axis carries exactly the six fields of the spec – no truth smuggled alongside', () => {
    const snap = toSnapshot(runCareer('radar-shape', 'middle', 30))
    for (const axis of snap.radar) {
      expect(Object.keys(axis).sort()).toEqual(
        ['band', 'ceilingHi', 'ceilingLo', 'key', 'note', 'shownValue'].sort(),
      )
    }
  })

  it('THE SNAPSHOT NEVER CARRIES HER TRUE BUILD – not skills, not potential, at any depth', () => {
    const world = runCareer('radar-noleak', 'elite', 40)
    const snap = toSnapshot(world)
    expect('skills' in snap).toBe(false)
    expect('potential' in snap).toBe(false)
    // ...and not buried inside anything either. The whole payload is walked, because a leak that
    // arrives by accident (a field added to a nested object one day) is exactly the kind this pin
    // is here to catch. `radar` is exempted only for the estimate, which is by definition not the
    // truth – every OTHER number is checked against her real four.
    const truths = SKILL_KEYS.map((k) => world.skills[k]).concat(SKILL_KEYS.map((k) => world.potential[k]))
    const seen: number[] = []
    const walk = (v: unknown): void => {
      if (typeof v === 'number') seen.push(v)
      else if (Array.isArray(v)) v.forEach(walk)
      else if (v && typeof v === 'object') Object.values(v).forEach(walk)
    }
    walk({ ...snap, radar: undefined })
    for (const t of truths) expect(seen).not.toContain(t)
  })

  it('the estimate is on the same 0..100 axis her attributes live on, and the shape is drawable', () => {
    for (const seed of ['radar-a', 'radar-b', 'radar-c']) {
      const snap = toSnapshot(runCareer(seed, 'middle', 40))
      for (const a of snap.radar) {
        expect(a.shownValue).toBeGreaterThanOrEqual(0)
        expect(a.shownValue).toBeLessThanOrEqual(100)
        expect(a.band).toBeGreaterThanOrEqual(0)
        expect(a.band).toBeLessThanOrEqual(RADAR_BAND_MAX)
        // The screen draws the haze OUTSIDE the contour: a ceiling below where she already stands
        // is incoherent and would put the outer shape inside the inner one.
        expect(a.ceilingLo).toBeGreaterThanOrEqual(a.shownValue - 1e-9)
        expect(a.ceilingHi).toBeGreaterThanOrEqual(a.ceilingLo)
        expect(a.ceilingHi).toBeLessThanOrEqual(100)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 2. THE HONESTY PINS
// ---------------------------------------------------------------------------
describe('radar – the fog is an honest claim', () => {
  // Both halves of the honesty claim are swept on the SAME live careers - one walk, two pins. The
  // three rungs are the ends of the ladder and its middle; the synthetic sweep below covers the
  // rest of the space far more cheaply than a fourth and fifth career would (and the suite already
  // spends two minutes of CPU inside the PR gate - see vite.config.ts).
  it('THE TRUTH IS ALWAYS INSIDE THE BANDS – every axis, every week, on a live career', () => {
    for (const tier of ['self', 'middle', 'elite'] as CoachTier[]) {
      for (const seed of ['radar-h1', 'radar-h2']) {
        runCareer(seed, tier, 40, (world) => {
          for (const a of toSnapshot(world).radar) {
            // the inner contour: `band` is a promise about where she really is...
            expect(Math.abs(a.shownValue - world.skills[a.key])).toBeLessThanOrEqual(a.band + 1e-9)
            // ...and the outer haze contains what it is a haze about.
            expect(a.ceilingHi + 1e-9).toBeGreaterThanOrEqual(world.potential[a.key])
          }
        })
      }
    }
  })

  it('...and the same holds at the extremes the live careers never reach', () => {
    // A synthetic sweep over the whole confidence range and both signs of every draw, because the
    // live sweep above can only test the confidences a career actually produces.
    for (let i = 0; i < 200; i++) {
      const view = synthView({
        seed: `sweep-${i}`,
        n: i % 40,
        score: ['6-0 6-0', '6-4 3-6 7-6', '7-6 7-5'][i % 3],
        coachTier: COACH_TIERS[i % COACH_TIERS.length],
        coachSinceWeek: 0,
        week: i,
        skills: { serve: 20 + (i % 60), ret: 90 - (i % 60), composure: 50, stamina: 35 },
        potential: { serve: 26 + (i % 60), ret: 96 - (i % 60), composure: 78, stamina: 36 },
      })
      for (const a of buildRadar(view)) {
        expect(Math.abs(a.shownValue - view.skills[a.key])).toBeLessThanOrEqual(a.band + 1e-9)
        expect(a.ceilingHi + 1e-9).toBeGreaterThanOrEqual(view.potential[a.key])
        expect(a.ceilingLo).toBeGreaterThanOrEqual(a.shownValue - 1e-9)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 3. THE LOAD-BEARING FLOOR
// ---------------------------------------------------------------------------
describe('radar – the ceiling band narrows to a floor and STOPS', () => {
  it('ceilingHalfWidth never goes below CEILING_FLOOR_HALF, at any confidence', () => {
    for (let c = -0.5; c <= 1.5; c += 0.01) {
      expect(ceilingHalfWidth(c)).toBeGreaterThanOrEqual(CEILING_FLOOR_HALF)
    }
    expect(ceilingHalfWidth(1)).toBe(CEILING_FLOOR_HALF)
  })

  it('...and it STOPS: past the crossing confidence it is flat, not merely small', () => {
    const crossing = 1 - CEILING_FLOOR_HALF / CEILING_MAX_HALF // 2/3 with the shipped knobs
    expect(ceilingHalfWidth(crossing - 0.05)).toBeGreaterThan(CEILING_FLOOR_HALF)
    for (const c of [crossing, 0.7, 0.8, 0.9, 0.99, 1]) {
      expect(ceilingHalfWidth(c)).toBe(CEILING_FLOOR_HALF)
    }
  })

  it('THE MIDPOINT IS NOT THE ANSWER EITHER – a fully discovered axis still misreports the ceiling', () => {
    // The floor would be theatre if the haze were drawn symmetrically about the truth: the player
    // would simply read (lo + hi) / 2. The centre carries its own permanent, per-career offset.
    let offAt1 = 0
    let worst = 0
    for (let i = 0; i < 60; i++) {
      const view = synthView({ seed: `mid-${i}`, n: 400, score: '7-6 6-7 7-6', coachTier: 'elite' })
      const conf = radarConfidence(view)
      for (const a of buildRadar(view)) {
        expect(conf[a.key]).toBeGreaterThan(0.99) // fully discovered by construction
        const off = Math.abs((a.ceilingLo + a.ceilingHi) / 2 - view.potential[a.key])
        if (off > 0.05) offAt1++
        worst = Math.max(worst, off)
      }
    }
    expect(offAt1).toBeGreaterThan(0)
    // ...and the offset is bounded, so the haze still CONTAINS the ceiling (see the honesty pin).
    expect(worst).toBeLessThanOrEqual(CEILING_CENTRE_DRIFT * CEILING_FLOOR_HALF + 1e-9)
  })

  it('on a live career the haze stops at its floor width and stays there', () => {
    const widths: number[] = []
    runCareer('radar-floor', 'elite', 120, (world) => {
      if (world.week % 20 !== 0) return
      widths.push(Math.max(...toSnapshot(world).radar.map((a) => a.ceilingHi - a.ceilingLo)))
    })
    // Wide at the start, and it lands on 2 x the floor rather than continuing toward zero.
    expect(widths[0]).toBeGreaterThan(2 * CEILING_FLOOR_HALF)
    expect(widths[widths.length - 1]).toBeLessThanOrEqual(2 * CEILING_FLOOR_HALF + 1e-9)
    expect(widths[widths.length - 1]).toBeGreaterThan(2 * CEILING_FLOOR_HALF - 1) // never collapses
  })
})

// ---------------------------------------------------------------------------
// 4. NO SHIMMER
// ---------------------------------------------------------------------------
describe('radar – the estimate does not shimmer', () => {
  it('THE MISREADING KEEPS ITS SIGN for the whole career – it converges, it does not breathe', () => {
    for (const seed of ['radar-s1', 'radar-s2']) {
      const signs = new Map<SkillKey, number>()
      runCareer(seed, 'middle', 90, (world) => {
        for (const a of toSnapshot(world).radar) {
          const err = a.shownValue - world.skills[a.key]
          if (Math.abs(err) < 1e-6) return // fully discovered: the error is gone, not flipped
          const sign = Math.sign(err)
          const known = signs.get(a.key)
          if (known === undefined) signs.set(a.key, sign)
          else expect(sign, `${seed}/${a.key} flipped side at w${world.week}`).toBe(known)
        }
      })
      expect(signs.size).toBe(SKILL_KEYS.length)
    }
  })

  it('the sub-stream is PER CAREER, not per week: the same view re-read gives the same reading', () => {
    const view = synthView({ n: 7, score: '6-4 3-6 6-4' })
    expect(buildRadar(view)).toEqual(buildRadar(view))
    // ...and a different week with the same evidence gives the same estimate, because the week is
    // not in the key. (The week only enters through weeks-together, held fixed here.)
    const later = buildRadar({ ...view, week: 90, coachSinceWeek: 38 })
    expect(later.map((a) => a.shownValue)).toEqual(buildRadar(view).map((a) => a.shownValue))
  })

  it('two careers on different seeds misread her differently', () => {
    const a = buildRadar(synthView({ seed: 'seed-A', n: 2 }))
    const b = buildRadar(synthView({ seed: 'seed-B', n: 2 }))
    expect(a.map((x) => x.shownValue)).not.toEqual(b.map((x) => x.shownValue))
  })

  it('⚠ MEASURED, NOT ASSUMED: the fog can re-widen slightly, and by no more than half a point', () => {
    // The evidence read is a COUNT that can only rise (matchesEverPlayed) times a RATE measured over
    // the retained event window, and that window rotates – so the rate can dip when a tight match
    // ages out of it, and the band can tick up. Measured over 18 careers x 260 weeks
    // (scratch sweep behind tools/radar-bench.ts): the worst weekly rise was 0.41 points, i.e. 3.4%
    // of the maximum fog, against a normal weekly NARROWING of the same order. The alternative –
    // a persisted per-axis high-water mark – costs the schema bump the spec rules out (§2).
    //
    // If this bound ever fails, the rate estimate has become unstable: look at axisEvidence, not at
    // the tolerance.
    let worst = 0
    for (const tier of ['self', 'elite'] as CoachTier[]) {
      let prev: Record<string, number> | null = null
      runCareer(`radar-mono-${tier}`, tier, 150, (world) => {
        const band: Record<string, number> = {}
        for (const a of toSnapshot(world).radar) band[a.key] = a.band
        if (prev) for (const k of SKILL_KEYS) worst = Math.max(worst, band[k] - prev[k])
        prev = band
      })
    }
    expect(worst).toBeLessThanOrEqual(0.5)
  })
})

// ---------------------------------------------------------------------------
// 5. EVIDENCE, PER AXIS – the part the whole design rests on
// ---------------------------------------------------------------------------
describe('radar – what a scoreline teaches', () => {
  it('reads sets, games, tiebreaks and the decider off the string', () => {
    expect(readScoreline('6-4 6-3')).toEqual({ sets: 2, games: 19, tiebreaks: 0, narrowSets: 0, decider: false })
    expect(readScoreline('7-6 6-7 7-6')).toEqual({ sets: 3, games: 39, tiebreaks: 3, narrowSets: 0, decider: true })
    expect(readScoreline('7-5 5-7 6-4')).toEqual({ sets: 3, games: 34, tiebreaks: 0, narrowSets: 2, decider: true })
    // Defensive: a record with no scoreline (a rival match, a corrupted row) teaches nothing.
    expect(readScoreline(undefined).sets).toBe(0)
  })

  it('STAMINA IS UNKNOWN UNTIL SHE HAS PLAYED A LONG MATCH', () => {
    expect(staminaUnitsOf(readScoreline('6-1 6-2'))).toBe(0)
    expect(staminaUnitsOf(readScoreline('6-4 6-3'))).toBe(0)
    expect(staminaUnitsOf(readScoreline('7-6 7-6'))).toBeGreaterThan(0) // 26 games, no decider
    expect(staminaUnitsOf(readScoreline('6-4 3-6 6-4'))).toBe(1)
  })

  it('COMPOSURE IS UNKNOWN UNTIL SHE HAS PLAYED A TIGHT ONE', () => {
    expect(composureUnitsOf(readScoreline('6-1 6-2'))).toBe(0)
    expect(composureUnitsOf(readScoreline('6-4 6-3'))).toBe(0)
    expect(composureUnitsOf(readScoreline('7-5 6-3'))).toBeGreaterThan(0)
    expect(composureUnitsOf(readScoreline('6-4 3-6 6-4'))).toBeGreaterThan(0)
    // ...and an epic teaches more than a routine decider, up to a cap.
    expect(composureUnitsOf(readScoreline('7-6 6-7 7-6'))).toBeGreaterThan(
      composureUnitsOf(readScoreline('6-4 3-6 6-4')),
    )
    expect(composureUnitsOf(readScoreline('7-6 6-7 7-6'))).toBeLessThanOrEqual(1.2)
  })

  it('SERVE AND RETURN SHARPEN FASTER AGAINST OPPONENTS WHO TESTED THEM', () => {
    const her = player(KID_ID, { serve: 50, ret: 50 })
    const bigReturner = player('x', { ret: 70, serve: 30 })
    const bigServer = player('y', { serve: 70, ret: 30 })
    expect(technicalUnitsOf('serve', her, bigReturner)).toBeGreaterThan(technicalUnitsOf('serve', her, bigServer))
    expect(technicalUnitsOf('ret', her, bigServer)).toBeGreaterThan(technicalUnitsOf('ret', her, bigReturner))
    // ...but a match always teaches SOMETHING about a wing.
    expect(technicalUnitsOf('serve', her, player('z', { ret: 0 }))).toBeGreaterThan(0)
    expect(testedFraction(0)).toBeCloseTo(0.5, 6)
    expect(testedFraction(-100)).toBe(0)
    expect(testedFraction(100)).toBe(1)
  })

  it('THE CLAIM THE DESIGN RESTS ON: easy wins leave composure foggy, three-setters lift it', () => {
    const easy = buildRadar(synthView({ n: 25, score: '6-1 6-2' }))
    const deciders = buildRadar(synthView({ n: 25, score: '6-4 3-6 6-4' }))
    const epics = buildRadar(synthView({ n: 25, score: '7-6 6-7 7-6' }))
    const comp = (r: ReturnType<typeof buildRadar>) => r.find((a) => a.key === 'composure')!.band
    const stam = (r: ReturnType<typeof buildRadar>) => r.find((a) => a.key === 'stamina')!.band
    expect(comp(easy)).toBeGreaterThan(comp(deciders))
    expect(comp(deciders)).toBeGreaterThan(comp(epics))
    expect(stam(easy)).toBeGreaterThan(stam(deciders))
    // ...and the serve axis is UNMOVED by the difference: only the axes the scoreline speaks for
    // are affected, which is what makes this per-axis evidence rather than a global timer.
    const serve = (r: ReturnType<typeof buildRadar>) => r.find((a) => a.key === 'serve')!.band
    expect(serve(easy)).toBeCloseTo(serve(epics), 9)
  })

  it('a hundred comfortable afternoons never lift composure at all', () => {
    const few = buildRadar(synthView({ n: 5, score: '6-1 6-2' }))
    const many = buildRadar(synthView({ n: 100, score: '6-1 6-2' }))
    const comp = (r: ReturnType<typeof buildRadar>) => r.find((a) => a.key === 'composure')!.band
    expect(comp(many)).toBe(comp(few))
    // ...while the serve axis, which every match speaks to, has resolved completely.
    const serve = (r: ReturnType<typeof buildRadar>) => r.find((a) => a.key === 'serve')!.band
    expect(serve(many)).toBeLessThan(serve(few) / 2)
  })

  it('⚠ THE PRUNED WINDOW IS IMPUTED, NOT LOST: matches the event feed dropped still count', () => {
    // `world.events` prunes at 400 rows, so a long career's match records are a rolling window. The
    // read counts the window at its own weights and the rest at the rate the window shows.
    const windowed = synthView({ n: 10, score: '6-4 3-6 6-4', matchesPlayed: 10 })
    const career = synthView({ n: 10, score: '6-4 3-6 6-4', matchesPlayed: 40 })
    expect(axisEvidence(career, 'composure').units).toBeCloseTo(
      4 * axisEvidence(windowed, 'composure').units,
      6,
    )
    // A career with no retained records at all learns nothing – there is no rate to impute with.
    expect(axisEvidence(synthView({ n: 0, matchesPlayed: 40 }), 'serve').units).toBe(0)
  })

  it('practice friendlies are not evidence (R11-2: nothing was on the line)', () => {
    const world = createWorld('radar-friendly', DEFAULT_PROFILE)
    const before = toSnapshot(world).radar.map((a) => a.band)
    world.events.push({
      id: 9999,
      week: 1,
      type: 'match',
      friendly: true,
      text: 'friendly',
      match: {
        round: 0,
        aId: KID_ID,
        bId: 'ai-1',
        winnerId: KID_ID,
        score: '7-6 6-7 7-6',
        eventId: 'friendly',
        surface: 'hard',
        oppName: 'Opp',
        a: player(KID_ID),
        b: player('ai-1'),
      },
    })
    expect(toSnapshot(world).radar.map((a) => a.band)).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// 6. THE COACH LADDER'S SECOND JOB
// ---------------------------------------------------------------------------
describe('radar – the coach reads her faster and more accurately', () => {
  it('every rung of the ladder is strictly sharper than the one below it, at the same evidence', () => {
    for (let i = 1; i < COACH_TIERS.length; i++) {
      const lower = axisConfidence(COACH_TIERS[i - 1], 30, 0.5)
      const upper = axisConfidence(COACH_TIERS[i], 30, 0.5)
      expect(upper, `${COACH_TIERS[i]} vs ${COACH_TIERS[i - 1]}`).toBeGreaterThan(lower)
    }
    // ...and the eye/accuracy tables cover the whole ladder, so a new rung cannot be forgotten.
    for (const t of COACH_TIERS) {
      expect(COACH_EYE[t]).toBeGreaterThan(0)
      expect(COACH_ACCURACY[t]).toBeGreaterThan(0)
      expect(COACH_ACCURACY[t]).toBeLessThanOrEqual(1)
    }
  })

  it('...and on a LIVE career the same order holds early AND late', () => {
    for (const week of [18, 90]) {
      const bands = COACH_TIERS.map((tier) => {
        const snap = toSnapshot(runCareer('radar-ladder', tier, week))
        return snap.radar.reduce((s, a) => s + a.band, 0) / snap.radar.length
      })
      for (let i = 1; i < bands.length; i++) {
        expect(bands[i], `${COACH_TIERS[i]} at w${week}`).toBeLessThan(bands[i - 1])
      }
    }
  })

  it('weeks together matter, and they saturate rather than run away', () => {
    expect(tenureRamp(0)).toBeGreaterThan(0) // a good coach has an opinion after one session
    expect(tenureRamp(30)).toBeGreaterThan(tenureRamp(0))
    expect(tenureRamp(200)).toBeGreaterThan(tenureRamp(30))
    expect(tenureRamp(10_000)).toBeLessThanOrEqual(1)
    expect(axisConfidence('elite', 200, 0.3)).toBeGreaterThan(axisConfidence('elite', 4, 0.3))
  })

  it('a new coach has to learn her: coachSinceWeek moves on BOTH hire and release', () => {
    const world = createWorld('radar-tenure', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const rng = rngFromSeed(world.seed)
    expect(coachSinceWeek(world)).toBe(0)
    for (let i = 0; i < 10; i++) tickWeek(world, rng)
    const someone = toSnapshot(world).coachMarket.find((c) => c.tier === 'budget')!
    hireCoach(world, someone.id)
    expect(coachSinceWeek(world)).toBe(world.week)
    for (let i = 0; i < 5; i++) tickWeek(world, rng)
    hireCoach(world, null)
    expect(coachSinceWeek(world)).toBe(world.week)
    // ...and the tag survives the event-feed pruning that would otherwise lose it.
    for (let i = 0; i < 120; i++) tickWeek(world, rng)
    expect(coachSinceWeek(world)).toBe(15)
  })

  it('a career whose ledger has no coach-change tag falls back to week 0, with no migration', () => {
    const world = runCareer('radar-legacy', 'middle', 20)
    // Simulate a save written before the tag existed: strip it, keep everything else.
    for (const e of world.events) delete e.milestoneKey
    expect(coachSinceWeek(world)).toBe(0)
    expect(() => toSnapshot(world)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// 7. THE COACH'S READ, IN WORDS
// ---------------------------------------------------------------------------
describe('radar – the note', () => {
  const allNotes = (): string[] => {
    const out = new Set<string>()
    for (const score of ['6-1 6-2', '6-4 3-6 6-4', '7-6 6-7 7-6']) {
      for (const n of [0, 1, 4, 12, 60]) {
        for (const tier of COACH_TIERS) {
          for (const skew of [-14, 0, 14]) {
            const view = synthView({
              n,
              score,
              coachTier: tier,
              skills: { serve: 50 + skew, ret: 50 - skew, composure: 50 + skew, stamina: 50 - skew },
            })
            for (const a of buildRadar(view)) if (a.note) out.add(a.note)
          }
        }
      }
    }
    return [...out]
  }

  it('NEVER A NUMBER – decisions.md #11 is "axes without numbers"', () => {
    const notes = allNotes()
    expect(notes.length).toBeGreaterThan(8)
    for (const n of notes) expect(n, n).not.toMatch(/[0-9]/)
  })

  it('player copy: short dash only, no em dash, no bare hyphen, no Cyrillic', () => {
    const source = read('../src/engine/radar.ts')
    // The pool is the only player-facing text in the module; the whole file is swept because a
    // comment quoting the owner in Russian would be fine but a STRING would not.
    let checked = 0
    for (const line of source.split('\n')) {
      const text = line.match(/text: '([^']*)'/)?.[1]
      if (!text) continue
      checked++
      expect(text, text).not.toMatch(/—/) // the long dash: never, in any player copy
      expect(text, text).not.toMatch(/ - /) // ...and a spaced hyphen is not the short dash either
      expect(text, text).not.toMatch(/[Ѐ-ӿ]/)
    }
    expect(checked).toBeGreaterThan(20) // the sweep found the pool, not an empty file
  })

  it('he says NOTHING until he has a read – silence is a state, not a fallback', () => {
    const cold = synthView({ n: 0, coachTier: 'self', week: 1, coachSinceWeek: 0 })
    const radar = buildRadar(cold)
    const notes = Object.fromEntries(radar.map((a) => [a.key, a.note]))
    expect(notes.serve).toBeNull()
    expect(notes.ret).toBeNull()
    // ...but the two axes whose EMPTINESS is itself a fact speak from the first week.
    expect(notes.composure).toMatch(/nobody knows|has not been|never been|open question/i)
    expect(notes.stamina).toMatch(/nobody knows|has not been|never been|open question/i)
  })

  it('"nobody knows yet" goes away the moment she has been in one', () => {
    const never = buildRadar(synthView({ n: 20, score: '6-1 6-2' }))
    const once = buildRadar(synthView({ n: 20, score: '6-4 3-6 6-4' }))
    const note = (r: ReturnType<typeof buildRadar>, k: SkillKey) => r.find((a) => a.key === k)!.note ?? ''
    expect(note(never, 'stamina')).toMatch(/third set|distance/i)
    expect(note(once, 'stamina')).not.toMatch(/nobody knows|never been taken/i)
    expect(note(never, 'composure')).toMatch(/tight|close one/i)
    expect(note(once, 'composure')).not.toMatch(/nobody knows|has not been in a close/i)
  })

  it('THE NOTE READS THE ESTIMATE, NEVER THE TRUTH – so a misread produces a confident wrong verdict', () => {
    // Two girls with the SAME shown values and opposite true builds get the same sentence: the note
    // is a function of what the family can see, which is what makes the fog a lie you can act on.
    // (`AxisRead` is the note's ENTIRE input, and it carries no true value at all - the guarantee is
    // structural, and these cases only demonstrate it.)
    const a = axisNote(
      { key: 'serve', confidence: 0.9, units: 20, tested: 0.5, shownValue: 70, shownEdge: 12, matchesPlayed: 30 },
      'note-seed',
    )
    const b = axisNote(
      { key: 'serve', confidence: 0.9, units: 20, tested: 0.5, shownValue: 70, shownEdge: 12, matchesPlayed: 30 },
      'note-seed',
    )
    expect(a).toBe(b)
    expect(a).toMatch(/weapon|holds serve/i)
    // ...and the opposite edge gets the opposite verdict.
    expect(
      axisNote(
        { key: 'serve', confidence: 0.9, units: 20, tested: 0.5, shownValue: 30, shownEdge: -12, matchesPlayed: 30 },
        'note-seed',
      ),
    ).toMatch(/the job|free points/i)
  })

  it('the line is stable for the career – it changes only when the READ changes', () => {
    const view = synthView({ n: 30, score: '6-4 3-6 6-4' })
    expect(buildRadar(view).map((a) => a.note)).toEqual(buildRadar({ ...view, week: 200 }).map((a) => a.note))
  })

  it('the pool covers every licence state a career can reach – nobody is left speechless mid-career', () => {
    for (const skew of [-14, -6, 0, 6, 14]) {
      const view = synthView({
        n: 40,
        score: '6-4 3-6 6-4',
        coachTier: 'elite',
        skills: { serve: 50 + skew, ret: 50 - skew, composure: 50 + skew, stamina: 50 - skew },
      })
      for (const a of buildRadar(view)) {
        expect(a.note, `${a.key} @ skew ${skew}`).not.toBeNull()
      }
    }
  })

  it('below the confidence floor a VERDICT is never spoken, however lopsided she looks', () => {
    const read = { key: 'serve' as SkillKey, confidence: NOTE_MIN_CONFIDENCE - 0.01, units: 3, tested: 0.9, shownValue: 80, shownEdge: 25, matchesPlayed: 3 }
    expect(axisNote(read, 'x')).toBeNull()
    expect(axisNote({ ...read, confidence: NOTE_MIN_CONFIDENCE }, 'x')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 8. RNG DISCIPLINE
// ---------------------------------------------------------------------------
describe('radar – RNG discipline', () => {
  it('the radar is computed at SNAPSHOT time and takes no stream: toSnapshot has no rng parameter', () => {
    expect(toSnapshot.length).toBe(2) // (world, stopReasons?) – no rng, so it cannot draw one
  })

  it('taking a snapshot does not advance the world stream a career is ticking on', () => {
    const world = createWorld('radar-rng', DEFAULT_PROFILE)
    let draws = 0
    const base = rngFromSeed(world.seed)
    const counting = () => {
      draws++
      return base()
    }
    tickWeek(world, counting)
    const after = draws
    for (let i = 0; i < 20; i++) toSnapshot(world)
    expect(draws).toBe(after)
  })

  it('every draw the module makes is purpose-scoped – the source names no bare stream', () => {
    const source = read('../src/engine/radar.ts')
    for (const key of source.match(/rngFromSeed\(`[^`]*`\)/g) ?? []) {
      expect(key, key).toMatch(/\$\{(view\.)?seed\}:(read|ceil|radarnote):/)
    }
  })

  it('the estimate is post-draw arithmetic: same world, same radar, however often it is asked', () => {
    const world = runCareer('radar-repeat', 'high', 25)
    expect(toSnapshot(world).radar).toEqual(toSnapshot(world).radar)
  })
})

// ---------------------------------------------------------------------------
// 9. THE EMPTY STATE (what the screen agent draws on week 1)
// ---------------------------------------------------------------------------
describe('radar – a fourteen-year-old in week 1', () => {
  it('four axes, maximum fog, a wide haze and two honest silences', () => {
    const world = createWorld('radar-empty', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const snap = toSnapshot(world)
    expect(snap.radar).toHaveLength(4)
    for (const a of snap.radar) {
      expect(a.band).toBeGreaterThan(RADAR_BAND_MAX * 0.9) // she is a stranger
      expect(a.ceilingHi - a.ceilingLo).toBeGreaterThan(2 * CEILING_FLOOR_HALF)
      expect(a.shownValue).toBeGreaterThan(0)
    }
    expect(snap.radar.filter((a) => a.note === null)).toHaveLength(2)
    expect(matchesEverPlayed(world)).toBe(0)
  })

  it('bandFor is total and clamped, so a degenerate view still draws', () => {
    expect(bandFor(0)).toBe(RADAR_BAND_MAX)
    expect(bandFor(1)).toBe(0)
    expect(bandFor(-5)).toBe(RADAR_BAND_MAX)
    expect(bandFor(5)).toBe(0)
  })
})
