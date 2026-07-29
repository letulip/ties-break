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
  buildTrainingRead,
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
  RADAR_AXIS_LABEL,
  RADAR_BAND_MAX,
  TRAINING_FOG_FLOOR,
  TRAINING_FOG_ROTATE_WEEKS,
  TRAINING_MIN_CONFIDENCE,
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
  // ⚠ `skills` IS READ OFF `over` FIRST, not merely spread over afterwards, so that `startSkills`
  // can default to whatever build the case actually asked for. A girl who has not developed at all
  // is the neutral fixture: `startSkills` feeds only the Weekly Story's training line, and every
  // case that cares about movement sets it explicitly. Defaulting it to a FIXED fifty would have
  // silently handed a +14 career to every lopsided-skills case in the note sweep below.
  const skills: KidSkills = over.skills ?? { serve: 50, ret: 50, composure: 50, stamina: 50 }
  const potential: KidSkills = over.potential ?? { serve: 66, ret: 66, composure: 66, stamina: 66 }
  return {
    seed: 'radar-test',
    week: 52,
    kidId: KID_ID,
    skills,
    startSkills: { ...skills },
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

  // ⚠ RE-AIMED, NOT WEAKENED. The training read (`buildTrainingRead`) added four purposes to this
  // module - `trainstep` / `trainsay` / `trainline` / `trainfog` - so the list of allowed names
  // grew by four. THE PROTECTED FACT IS UNCHANGED AND IS STILL THE ONLY ONE THIS TEST MAKES: every
  // draw in radar.ts is on a sub-stream derived from the seed AND NAMED FOR ITS PURPOSE. A bare
  // `rngFromSeed(view.seed)` - the one thing that could move the frozen MAIN capture (41550 draws /
  // e6b0c709) - still fails here, and so does a purpose nobody has declared.
  it('every draw the module makes is purpose-scoped – the source names no bare stream', () => {
    const source = read('../src/engine/radar.ts')
    const keys = source.match(/rngFromSeed\(`[^`]*`\)/g) ?? []
    for (const key of keys) {
      expect(key, key).toMatch(
        /\$\{(view\.)?seed\}:(read|ceil|radarnote|trainstep|trainsay|trainline|trainfog):/,
      )
    }
    expect(keys.length).toBeGreaterThanOrEqual(7) // the sweep found the draws, not an empty file
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

  it('the axis labels are the ENGINE\'s, and cover the four keys – "ret" never reaches a player', () => {
    for (const k of SKILL_KEYS) {
      expect(RADAR_AXIS_LABEL[k], k).toBeTruthy()
      expect(RADAR_AXIS_LABEL[k]).not.toMatch(/[0-9—]|[Ѐ-ӿ]/)
    }
    expect(RADAR_AXIS_LABEL.ret).toBe('Return')
    expect(new Set(Object.values(RADAR_AXIS_LABEL)).size).toBe(SKILL_KEYS.length)
  })

  it('bandFor is total and clamped, so a degenerate view still draws', () => {
    expect(bandFor(0)).toBe(RADAR_BAND_MAX)
    expect(bandFor(1)).toBe(0)
    expect(bandFor(-5)).toBe(RADAR_BAND_MAX)
    expect(bandFor(5)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 10. WHAT MOVED THIS WEEK – the Weekly Story's Training card, in the fog
// ---------------------------------------------------------------------------
// Design D lists her skill gains on that card ("Serve +8%") and this game may not, because a weekly
// delta handed to the UI integrates into her exact build and every constant above becomes theatre.
// So the card gets a WING AND A SENTENCE. The pins here are the three claims that makes:
//
//   1. NO NUMBER REACHES THE CARD. Not in the text, not as a field on the payload, and not by a
//      later hand adding one to the template. Sibling of the note's own digit pin at §7.
//   2. IT IS FOGGED, NOT ROUNDED. Below the confidence floor no wing is EVER named, however far she
//      has actually come - the card says nobody can tell, which is the honest thing and also the
//      only thing that cannot be inverted.
//   3. IT IS NOT A DELTA CHANNEL. Movement inside one notch is invisible, so the card cannot be
//      differenced week to week to recover a gain.

/** A girl who has moved `gained` points on one axis, seen by a coach of a given rung. `n` matches
 *  of the given kind is what buys the confidence, exactly as a live career would. */
function movedView(over: { gained: number; key?: SkillKey; n?: number; tier?: CoachTier; week?: number } ): RadarWorldView {
  const key = over.key ?? 'serve'
  const base = synthView({ n: over.n ?? 40, score: '6-4 3-6 6-4', coachTier: over.tier ?? 'middle', week: over.week ?? 104 })
  return {
    ...base,
    skills: { ...base.skills, [key]: base.skills[key] + over.gained },
    startSkills: { ...base.skills },
  }
}

/** Every read a broad sweep of careers and rungs can produce – the counterpart of `allNotes`.
 *
 *  ⚠ THE WEEK AXIS HAS TO BE WIDE, and it is worth saying why. A line is keyed on
 *  (wing, notch, WEEK) and spoken on only TRAINING_SAY_CHANCE of weeks, so a sweep over four weeks
 *  reaches nine sentences out of a pool of thirty-six and a digit pin over it would be proving
 *  almost nothing. The tier/`n` axis is deliberately NOT crossed with everything instead: those two
 *  only move confidence, and once a wing is over the floor they change no word. */
function allTrainingReads(): { key: SkillKey | null; label: string | null; text: string }[] {
  const out: { key: SkillKey | null; label: string | null; text: string }[] = []
  const weeks = Array.from({ length: 60 }, (_, i) => 4 + i * 4)
  // read her well / barely / not at all – the three regimes, not the whole ladder.
  const eyes: [number, CoachTier][] = [[60, 'elite'], [24, 'middle'], [0, 'self']]
  for (const [n, tier] of eyes) {
    for (const gained of [0, 1, 3, 6, 10, 16, 24]) {
      for (const key of SKILL_KEYS) {
        for (const week of weeks) {
          const r = buildTrainingRead(movedView({ gained, key, n, tier, week }))
          if (r) out.push(r)
        }
      }
    }
  }
  return out
}

describe('training read – NOT ONE NUMBER reaches the card', () => {
  it('NEVER A NUMBER – EVERY line in the pools, reachable by a sweep or not', () => {
    // Read off the SOURCE, like the note's own copy pin at §7, and for the reason that pin exists:
    // a behavioural sweep reaches about twenty of the forty-one sentences (a line is spoken on
    // TRAINING_SAY_CHANCE of weeks), and "the ones we happened to reach have no digits" is not the
    // claim. This is the claim.
    const source = read('../src/engine/radar.ts')
    const from = source.indexOf('const MOVE_POOL')
    const to = source.indexOf('export function buildTrainingRead')
    expect(from, 'the training pools moved – re-aim this pin, do not delete it').toBeGreaterThan(0)
    expect(to).toBeGreaterThan(from)
    const lines = [...source.slice(from, to).matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1])
    expect(lines.length).toBeGreaterThanOrEqual(41) // 4 wings x 3 tiers x 3 + 5 fog lines
    for (const text of lines) {
      expect(text, text).not.toMatch(/[0-9]/) // decisions.md #11: "axes without numbers"
      expect(text, text).not.toMatch(/[+\-±]/) // ...nor an arrow, nor a sign
    }
  })

  it('...and no sentence a live sweep actually produces has one either', () => {
    const reads = allTrainingReads()
    expect(reads.length).toBeGreaterThan(50)
    // ...and the sweep is not all one line: a pin over a single reachable state proves nothing.
    expect(new Set(reads.map((r) => r.text)).size).toBeGreaterThan(18)
    for (const r of reads) {
      expect(r.text, r.text).not.toMatch(/[0-9]/)
      expect(r.label ?? '', r.text).not.toMatch(/[0-9]/)
    }
  })

  it('...on a LIVE career too, every week of it', () => {
    runCareer('train-digits', 'elite', 60, (world) => {
      const t = toSnapshot(world).trainingRead
      if (!t) return
      expect(t.text, `w${world.week}`).not.toMatch(/[0-9]/)
    })
  })

  it('THE PAYLOAD HAS NO NUMERIC FIELD AT ANY DEPTH – so nobody can add "+0.4" to the shape', () => {
    // The structural half of the pin, and the one that outlives the copy: a later hand that wanted
    // to be helpful would add `delta: 0.4` to TrainingRead, and the sentences would still be clean
    // while the card leaked. Every value on the object is walked.
    let checked = 0
    const walk = (v: unknown, path: string): void => {
      if (typeof v === 'number') throw new Error(`a number reached the training read at ${path}: ${v}`)
      if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`))
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`)
      else checked++
    }
    for (const r of allTrainingReads()) walk(r, 'trainingRead')
    expect(checked).toBeGreaterThan(100)
  })

  it('player copy: short dash only, no em dash, no Cyrillic, and short enough for the tile', () => {
    const source = read('../src/engine/radar.ts')
    const pools = source.slice(source.indexOf('const MOVE_POOL'), source.indexOf('export function buildTrainingRead'))
    const lines = [...pools.matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1])
    expect(lines.length).toBeGreaterThanOrEqual(41)
    for (const text of lines) {
      expect(text, text).not.toMatch(/—/) // the long dash: never, in any player copy
      expect(text, text).not.toMatch(/ - /) // ...and a spaced hyphen is not the short dash either
      expect(text, text).not.toMatch(/[Ѐ-ӿ]/)
      // The tile is half of a 390px frame. Anything much past this wraps to a fourth line and the
      // two cards in the top row stop ruling off together.
      expect(text.length, text).toBeLessThanOrEqual(50)
    }
  })
})

describe('training read – fogged, not rounded', () => {
  it('BELOW THE FLOOR NO WING IS EVER NAMED, however far she has actually come', () => {
    // Twenty-four points is more than a whole career's development on one axis. It buys her nothing
    // here: nobody has watched her enough to claim they saw it happen. A confident read on an axis
    // with no evidence behind it is the same leak in nicer words.
    for (const tier of COACH_TIERS) {
      const view = movedView({ gained: 24, n: 0, tier, week: 2 })
      const conf = radarConfidence(view)
      expect(Math.max(...SKILL_KEYS.map((k) => conf[k]))).toBeLessThan(TRAINING_MIN_CONFIDENCE)
      expect(buildTrainingRead(view)?.key, tier).toBeNull()
    }
  })

  it('a fourteen-year-old with a new coach is told nobody can tell yet – every week, in words', () => {
    const world = createWorld('train-empty', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const t = toSnapshot(world).trainingRead
    expect(t).not.toBeNull()
    expect(t!.key).toBeNull()
    expect(t!.label).toBeNull()
    expect(t!.text).toMatch(/too early|nobody|still learning|nothing to read/i)
  })

  it('THE FOG LINE IS ABOUT THE FOG, NOT ABOUT HER – two different girls get the same sentence', () => {
    // The structural guarantee is that the fog branch reads nothing off `skills` at all; this
    // demonstrates it. If it ever started to, a player would learn from the WORDING that something
    // had moved, which is the leak wearing its politest disguise.
    const still = movedView({ gained: 0, n: 0, tier: 'self', week: 6 })
    const flying = movedView({ gained: 22, n: 0, tier: 'self', week: 6 })
    expect(buildTrainingRead(still)).toEqual(buildTrainingRead(flying))
  })

  it('the fog line SETTLES for four weeks and then rotates – Home\'s own idiom, not a weekly flip', () => {
    const at = (week: number) => buildTrainingRead(movedView({ gained: 0, n: 0, tier: 'self', week }))!.text
    // Same block, same sentence...
    for (let w = 0; w < TRAINING_FOG_ROTATE_WEEKS; w++) expect(at(40 + w)).toBe(at(40))
    // ...and the next block is a different one, by construction rather than by luck.
    expect(at(40 + TRAINING_FOG_ROTATE_WEEKS)).not.toBe(at(40))
  })

  it('⚠ "he can read her" is the MEAN of the four wings, not his best-understood one', () => {
    // A career of straight-sets wins teaches serve and return a great deal and the two scoreline
    // axes NOTHING (spec §1, source 3). Keyed on the MAXIMUM, the serve alone would switch the
    // "nobody can tell yet" line off while three wings were still strangers - and the card then
    // sits blank for the fifty-odd cards before anything has moved a whole fog-width, which
    // measured as the longest silence the card produced and sat at the very start of the game.
    const view = { ...synthView({ n: 40, score: '6-1 6-2', coachTier: 'self', week: 104 }) }
    const conf = radarConfidence(view)
    // The premise: one wing well understood, and the girl as a whole not.
    expect(Math.max(...SKILL_KEYS.map((k) => conf[k]))).toBeGreaterThan(TRAINING_MIN_CONFIDENCE)
    const mean = SKILL_KEYS.reduce((s, k) => s + conf[k], 0) / SKILL_KEYS.length
    expect(mean).toBeLessThan(TRAINING_MIN_CONFIDENCE)
    // ...so he still says he cannot tell, rather than saying nothing at all.
    expect(buildTrainingRead(view)?.key).toBeNull()
  })

  it('the same movement is INVISIBLE in thick fog and readable in thin – the coach ladder, on this card', () => {
    const seen = (tier: CoachTier) => buildTrainingRead(movedView({ gained: 9, n: 26, tier, week: 78 }))
    // The self-coached parent has watched every one of the same matches and still cannot say it.
    expect(seen('self')?.key ?? null).toBeNull()
    // The Elite rung can - `gained` is identical, only the reading of her differs.
    expect(radarConfidence(movedView({ gained: 9, n: 26, tier: 'elite', week: 78 })).serve).toBeGreaterThan(
      TRAINING_MIN_CONFIDENCE,
    )
  })
})

describe('training read – it is not a delta channel', () => {
  it('MOVEMENT INSIDE ONE NOTCH IS INVISIBLE – the card cannot be differenced to recover a gain', () => {
    // The attack this defeats: watch the card every week, note when it changes, integrate. Here the
    // fog is held still and only her true gain is swept, a tenth of a point at a time - the finest
    // resolution a weekly delta could ever have. Across a whole notch's width the read does not
    // move at all, so the sweep cannot be inverted into points.
    const texts = new Set<string>()
    for (let g = 60; g <= 60 + 10 * TRAINING_FOG_FLOOR; g++) {
      const r = buildTrainingRead(movedView({ gained: g / 10, n: 40, tier: 'elite', week: 104 }))
      texts.add(r ? `${r.key}/${r.text}` : 'silent')
    }
    // One notch of true gain produces at most two states (the notch she was on, the next one) -
    // never the thirty distinct readings a delta channel would give.
    expect(texts.size).toBeLessThanOrEqual(2)
  })

  it('the card is QUIET most weeks, on a live career, and not because it is broken', () => {
    let cards = 0
    let spoke = 0
    let named = 0
    let gap = 0
    let worstGap = 0
    runCareer('train-quiet', 'middle', 160, (world) => {
      const t = toSnapshot(world).trainingRead
      cards++
      if (t) spoke++
      if (t?.key) {
        named++
        gap = 0
      } else if (spoke > 0) {
        gap++
        if (gap > worstGap) worstGap = gap
      }
    })
    // Silence is the norm: a card that named a wing every week would be handing over the sign of
    // every weekly delta, which is the whole thing rule 2 exists to prevent.
    expect(named / cards).toBeLessThan(0.35)
    // ...and it is not dead. It says the fog line early and finds real things to say later.
    expect(named).toBeGreaterThan(3)
    expect(spoke).toBeGreaterThan(named)
    // ⚠ AND THE SILENCES ARE NOT A SEASON LONG. This is the pin that caught two design bugs at
    // once: per-wing say-coins (which made the rhythm swing with how many wings happened to be
    // eligible) and a max-keyed fog line (which went blank the moment ONE wing became readable).
    // Both showed up here as runs of forty-plus weeks in which the card said nothing whatever.
    expect(worstGap).toBeLessThan(40)
  })

  it('the read is DERIVED, not persisted, and asking twice gives the same answer', () => {
    const world = runCareer('train-stable', 'high', 40)
    expect(toSnapshot(world).trainingRead).toEqual(toSnapshot(world).trainingRead)
    // ...and it bumps no schema: the whole thing is a function of state that already existed.
    expect(toSnapshot(world).schemaVersion).toBe(world.schemaVersion)
  })

  it('the label is always the ENGINE\'s word for the wing – "ret" cannot reach a parent', () => {
    let named = 0
    for (const r of allTrainingReads()) {
      if (r.key === null) {
        expect(r.label).toBeNull()
        continue
      }
      named++
      expect(r.label).toBe(RADAR_AXIS_LABEL[r.key])
      expect(r.label).not.toBe('Ret')
    }
    expect(named).toBeGreaterThan(20)
  })
})
