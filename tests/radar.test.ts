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
// ⚠ AND THE SUITE IS THREE FILES SINCE 11.08, because at 61 tests it hit birpc's 60s RPC window on
// CI (all green, exit 1 - see the header of scripts/units.mjs, and tests/radarFixtures.ts for the
// cut). The three claims above all live HERE, which is why this file keeps the name. The rest are
// tests/radar-read.test.ts (§4 §5 §7 §8) and tests/radar-training.test.ts (§6 §10 §11 §13); the
// section numbers are the original suite's throughout and are quoted from src/, so they stand.
//
// The numbers quoted in the comments below come from tools/radar-bench.ts (`npm run bench:radar`).
import { describe, it, expect } from 'vitest'
import {
  bandFor,
  buildRadar,
  ceilingHalfWidth,
  radarConfidence,
  CEILING_CENTRE_DRIFT,
  CEILING_FLOOR_HALF,
  CEILING_MAX_HALF,
  RADAR_AXIS_LABEL,
  RADAR_BAND_MAX,
} from '../src/engine/radar'
import { SKILL_CEILING_MAX, SKILL_KEYS } from '../src/engine/development'
import { COACH_TIERS } from '../src/engine/coach'
import { createWorld, matchesEverPlayed, startingSkills, toSnapshot } from '../src/engine/world'
import { withHeadStart } from '../src/engine/world/player'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'
import { read, runCareer, synthView } from './radarFixtures'

// ---------------------------------------------------------------------------
// 1. THE CONTRACT
// ---------------------------------------------------------------------------
describe('radar – the contract the UI is given', () => {
  it('a snapshot carries four axes, in SKILL_KEYS order, from week 1', () => {
    const world = createWorld('radar-contract', DEFAULT_PROFILE)
    const snap = toSnapshot(world)
    expect(snap.radar.map((a) => a.key)).toEqual([...SKILL_KEYS])
  })

  // ⚠ RE-AIMED FOR THE THIRD CONTOUR (11.08): six fields -> seven. The claim is NOT "six" and never
  // was - it is "an exhaustive list, so a truth cannot ride along unnoticed". `startValue` is an
  // ESTIMATE and not a truth: it goes through the same `readAs` misreading `shownValue` does, and the
  // honesty sweep below now holds it to the same promise the band makes about her current build. The
  // test that would catch a leak here is the one under it, which walks the payload for her real
  // numbers; this one is the guard that a field cannot appear without somebody deciding it should.
  it('every axis carries exactly the seven fields of the spec – no truth smuggled alongside', () => {
    const snap = toSnapshot(runCareer('radar-shape', 'middle', 30))
    for (const axis of snap.radar) {
      expect(Object.keys(axis).sort()).toEqual(
        ['band', 'ceilingHi', 'ceilingLo', 'key', 'note', 'shownValue', 'startValue'].sort(),
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
        // The third contour lives on the same axis, and on a career that has only gone forward it is
        // drawn INSIDE the second one - the two carry one misreading, so the order of the truths
        // survives into the drawing. A start contour outside the current one would tell a girl who
        // has improved for forty weeks that she has gone backwards.
        expect(a.startValue).toBeGreaterThanOrEqual(0)
        expect(a.startValue).toBeLessThanOrEqual(100)
        expect(a.startValue).toBeLessThanOrEqual(a.shownValue + 1e-9)
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
  // ⚠ EXPLICIT TIMEOUT, NOT A WEAKENED ASSERTION. These sweep LIVE careers - 208 weeks x several
  // seeds x four axes - and take 1-3s alone. Under a loaded machine (this suite grew to 72 files,
  // and the wave was built by five agents at once) they crossed vitest's 5s default and went red
  // while passing in isolation. The pins below are untouched; only the clock is. CI runs
  // singleFork, which is slower still, so the headroom is not optional.
  it('THE TRUTH IS ALWAYS INSIDE THE BANDS – every axis, every week, on a live career', () => {
    for (const tier of ['self', 'middle', 'elite'] as CoachTier[]) {
      for (const seed of ['radar-h1', 'radar-h2']) {
        runCareer(seed, tier, 40, (world) => {
          // WHERE SHE BEGAN, recomputed the way the engine does it - a pure function of the seed and
          // the profile, stored nowhere. It is the week-one build, head start included, which is
          // exactly the object `createWorld` seeded `world.skills` with.
          const born = withHeadStart(startingSkills(world.seed, world.profile), world.profile.birthMonth)
          for (const a of toSnapshot(world).radar) {
            // the inner contour: `band` is a promise about where she really is...
            expect(Math.abs(a.shownValue - world.skills[a.key])).toBeLessThanOrEqual(a.band + 1e-9)
            // ...the START contour makes the SAME promise about where she began. It is an estimate
            // and not a memory: the third shape may not claim a precision the other two do not have.
            expect(Math.abs(a.startValue - born[a.key])).toBeLessThanOrEqual(a.band + 1e-9)
            // ...and the outer haze contains what it is a haze about.
            expect(a.ceilingHi + 1e-9).toBeGreaterThanOrEqual(world.potential[a.key])
          }
        })
      }
    }
  }, 30_000)

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
        skills: { serve: 20 + (i % 60), ret: 90 - (i % 60), composure: 50, stamina: 35, groundstrokes: 45 + (i % 30) },
        potential: { serve: 26 + (i % 60), ret: 96 - (i % 60), composure: 78, stamina: 36, groundstrokes: 55 + (i % 30) },
        // A girl who has genuinely moved, so the start contour is a DIFFERENT shape from the current
        // one rather than the fixture's default of "she has not developed at all".
        startSkills: { serve: 18 + (i % 60), ret: 84 - (i % 60), composure: 41, stamina: 35, groundstrokes: 40 + (i % 30) },
      })
      for (const a of buildRadar(view)) {
        expect(Math.abs(a.shownValue - view.skills[a.key])).toBeLessThanOrEqual(a.band + 1e-9)
        expect(Math.abs(a.startValue - view.startSkills[a.key])).toBeLessThanOrEqual(a.band + 1e-9)
        expect(a.startValue).toBeLessThanOrEqual(a.shownValue + 1e-9)
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

  // ⚠ EXPLICIT TIMEOUT, NOT A WEAKENED ASSERTION. These sweep LIVE careers - 208 weeks x several
  // seeds x four axes - and take 1-3s alone. Under a loaded machine (this suite grew to 72 files,
  // and the wave was built by five agents at once) they crossed vitest's 5s default and went red
  // while passing in isolation. The pins below are untouched; only the clock is. CI runs
  // singleFork, which is slower still, so the headroom is not optional.
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
  }, 30_000)
})

// ---------------------------------------------------------------------------
// 9. THE EMPTY STATE (what the screen agent draws on week 1)
// ---------------------------------------------------------------------------
describe('radar – a fourteen-year-old in week 1', () => {
  // ⚠ RE-AIMED FOR THE FIFTH AXIS (v25): 4 -> 5 rows and 2 -> 3 silences. Both numbers are read off
  // `SKILL_KEYS` rather than written down, so the next axis re-aims this test by existing.
  //
  // WHY THREE SILENCES IS THE SAME CLAIM AS TWO, and it is worth spelling out because it looks like a
  // weakening: the split is not arbitrary. The two axes the SCORELINE speaks for (composure, stamina)
  // have "nobody knows yet" lines licensed on `units === 0` - never having been in a third set is a
  // FACT about her, sayable on day one. The three TECHNICAL axes (serve, return, groundstrokes) have
  // absence lines licensed on `tested`, i.e. on the OPPONENTS she has met, and she has met none, so
  // there is not yet anything true to say about them. Adding a technical axis therefore adds a
  // silence, exactly as adding a scoreline axis would have added a sentence. Silence is a state.
  it('five axes, maximum fog, a wide haze and three honest silences', () => {
    const world = createWorld('radar-empty', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const snap = toSnapshot(world)
    expect(snap.radar).toHaveLength(SKILL_KEYS.length)
    expect(snap.radar.map((a) => a.key)).toEqual([...SKILL_KEYS])
    for (const a of snap.radar) {
      expect(a.band).toBeGreaterThan(RADAR_BAND_MAX * 0.9) // she is a stranger
      expect(a.ceilingHi - a.ceilingLo).toBeGreaterThan(2 * CEILING_FLOOR_HALF)
      expect(a.shownValue).toBeGreaterThan(0)
      // ⚠ AND THE TWO CONTOURS COINCIDE, EXACTLY. In week 1 she has not moved, so "where she began"
      // and "where she is" are the same girl seen through the same misreading - the picture opens as
      // one line and the story is drawn by it coming apart. This is also the sharpest available check
      // that the third contour shares `readAs`'s draw rather than rolling one of its own.
      expect(a.startValue).toBe(a.shownValue)
    }
    // The three technical wings are silent; the two the scoreline speaks for are not.
    const silent = snap.radar.filter((a) => a.note === null).map((a) => a.key)
    expect([...silent].sort()).toEqual(['groundstrokes', 'ret', 'serve'])
    expect(snap.radar.filter((a) => a.note !== null).map((a) => a.key).sort()).toEqual([
      'composure', 'stamina',
    ])
    expect(matchesEverPlayed(world)).toBe(0)
  })

  it('the axis labels are the ENGINE\'s, and cover every key – "ret" never reaches a player', () => {
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
// 12. THE PICTURE HAS TO FIT THE WORDS (v25)
// ---------------------------------------------------------------------------
// ⚠ WHY THIS BLOCK EXISTS: the fifth axis shipped with a layout bug that the whole suite missed and
// a single glance in the browser caught. `RADAR_AXIS_LABEL` grew "Groundstrokes" (13 chars, ~96px at
// the note list's 10px/800/0.08em) and the note label column was a fixed 68px, sized when the longest
// label was "Composure" - so the label rendered straight over the coach's sentence beside it. Nothing
// failed, because the numbers live in scoped CSS and an SVG viewBox and no test read either.
//
// The column is fixed-width ON PURPOSE (the five sentences align down one edge), so "just let it
// grow" is not the fix - the fix is that the two layout numbers must be re-measured whenever the
// longest label changes. This block makes that a failure rather than a discovery: a sixth axis with a
// longer word fails HERE, with the two numbers named, instead of silently overprinting a sentence.
//
// It is a budget check and not a rendering test - vitest has no text metrics - so the per-character
// cost is stated as a measured constant and the assertion is arithmetic against it.
describe('the radar draws every word the engine can hand it', () => {
  const radar = read('../src/components/SkillsRadar.vue')

  /** MEASURED IN CHROME at the note list's own type (10px, weight 800, uppercase, 0.08em tracking),
   *  not estimated: "Composure" 69px / 9 chars, "Groundstrokes" 96px / 13 chars. 7.4px a character. */
  const NOTE_LABEL_PX_PER_CHAR = 7.4

  const longest = SKILL_KEYS.reduce((a, k) =>
    RADAR_AXIS_LABEL[k].length > RADAR_AXIS_LABEL[a].length ? k : a, SKILL_KEYS[0])

  it('gives the note list a column wide enough for the LONGEST axis label', () => {
    const block = radar.slice(radar.indexOf('.radar-note-axis {'))
    const width = Number(block.match(/width: (\d+)px/)![1])
    const needed = RADAR_AXIS_LABEL[longest].length * NOTE_LABEL_PX_PER_CHAR
    expect(
      width,
      `.radar-note-axis is ${width}px; "${RADAR_AXIS_LABEL[longest]}" needs about ${needed.toFixed(0)}px. ` +
        'Re-measure it in the browser rather than guessing - an overflowing label prints over the coach\'s sentence.',
    ).toBeGreaterThanOrEqual(needed)
  })

  it('keeps the svg centred on CX and keeps the flank labels visible', () => {
    // ⚠ WHAT THIS CAN AND CANNOT CHECK. vitest has no text metrics, so "the longest label fits" is not
    // assertable here - it was measured in the browser (viewBox 240 -> 300 at v25, because the flank
    // labels sit at CX +/- 1.16R*cos(angle) and run OUTWARD from there). What IS assertable are the two
    // structural properties the flanks depend on, and both were silently breakable:
    //   1. the box is centred on CX, so left and right flanks get equal room;
    //   2. `overflow: visible` survives on the svg, which is what lets a flank label use the gutter
    //      outside the viewBox at all. Setting it to hidden would crop the words with no test failing.
    const viewBox = radar.match(/viewBox="0 0 (\d+) (\d+)"/)!
    const boxWidth = Number(viewBox[1])
    const cx = Number(radar.match(/const CX = (\d+)/)![1])
    expect(cx * 2, 'the box is not centred on CX - one flank has less room than the other').toBe(boxWidth)
    expect(boxWidth, 'the box was widened to 300 for the five-axis labels; re-measure before shrinking it')
      .toBeGreaterThanOrEqual(300)
    const svgCss = radar.slice(radar.indexOf('.radar-svg {'))
    expect(svgCss.slice(0, svgCss.indexOf('}'))).toContain('overflow: visible')
  })

  it('reads its labels and its geometry OUT of the engine, so a sixth axis cannot half-land', () => {
    // No private copy of the axis union, no hand-written label map, no hard-coded corner count -
    // all three were real hazards here (the local `RadarAxis` block that v25 deleted was one).
    expect(radar).toContain('RADAR_AXIS_LABEL')
    expect(radar).toContain('const ORDER: readonly SkillKey[] = SKILL_KEYS')
    expect(radar).toContain('360 / ORDER.length')
    expect(radar).not.toMatch(/type RadarAxisKey/)
    expect(radar).not.toMatch(/index \* 90/)
    // ...and the guide rings are built from the axis count rather than listed.
    // ⚠ RE-AIMED 11.08: the ring used to be spelled `ORDER.map(() => 100)`. The top of the axis is no
    // longer 100 - see `SKILL_CEILING_MAX` - and the same claim now reads through the constant.
    expect(radar).toContain('ORDER.map(() => AXIS_MAX)')
  })

  // ⚠ THE AXIS TOP IS DERIVED, AND THIS IS THE HALF A MOUNTED TEST CANNOT ASK. The behavioural claim
  // - a skill at the maximum touches the outer ring - is asserted mounted, in
  // tests/component/radar-story.test.ts, which is the honest way round. TWO THINGS ONLY SOURCE CAN
  // SAY, and both were found by mutating the mounted tests and watching them stay green:
  //
  //   1. THE NUMBER WAS IMPORTED, NOT COPIED. A component with a hard-coded 86 draws an identical
  //      picture today and a wrong one on the commit that widens `potentialBand`. Every mounted
  //      assertion in the world stays green through exactly the regression this exists to stop.
  //   2. THE SCALE DIVISOR IS THE RING. Every shape on the rose - contours, guide rings, spokes and
  //      the label anchors - goes through `pointAt`, so dividing by 100 again while the rings sit at
  //      `AXIS_MAX` shrinks the WHOLE drawing to 86% and leaves it internally consistent: the maximum
  //      still lands on the ring, and the mounted tests are all still right. What that mutation costs
  //      is a seventh of the picture's size for nothing, which no comparison inside one rendering can
  //      see. Verified by doing it.
  it('takes the top of its axis from the engine and never writes the number down', () => {
    expect(radar).toContain('SKILL_CEILING_MAX')
    expect(radar).toContain('const AXIS_MAX = SKILL_CEILING_MAX')
    expect(radar, 'the rose is scaled by something other than the ring it draws').toContain(
      'const r = (clamp(value) / AXIS_MAX) * R',
    )
    const script = radar.slice(radar.indexOf('<script setup'), radar.indexOf('</script>', radar.indexOf('<script setup')))
    const code = script.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(code, 'the axis top is spelled out somewhere instead of derived').not.toMatch(
      new RegExp(`(?<![.\\d])${SKILL_CEILING_MAX}(?![.\\d])`),
    )
  })
})
