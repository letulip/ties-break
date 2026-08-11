// THE SKILLS RADAR, PART TWO: WHERE THE READING COMES FROM AND HOW IT SETTLES.
//
// Split out of tests/radar.test.ts on 11.08 when that file crossed birpc's 60s RPC window on CI -
// tests/radarFixtures.ts carries the whole story, and the section numbers below are the original
// suite's. Nothing here was rewritten, re-seeded or shortened in the move.
//
// The four sections are one chain, and they are together because they are one chain: a scoreline is
// EVIDENCE (§5), evidence becomes a confidence that converges without breathing (§4), the confidence
// licenses a SENTENCE (§7), and every draw any of it makes is purpose-scoped (§8). The honesty pins
// those numbers have to satisfy live in tests/radar.test.ts.
//
// The numbers quoted in the comments below come from tools/radar-bench.ts (`npm run bench:radar`).
import { describe, it, expect } from 'vitest'
import {
  axisEvidence,
  axisNote,
  buildRadar,
  composureUnitsOf,
  readScoreline,
  staminaUnitsOf,
  technicalUnitsOf,
  testedFraction,
  NOTE_MIN_CONFIDENCE,
} from '../src/engine/radar'
import { SKILL_KEYS, type SkillKey } from '../src/engine/development'
import { COACH_TIERS } from '../src/engine/coach'
import { createWorld, KID_ID, tickWeek, toSnapshot } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'
import { player, read, runCareer, synthView } from './radarFixtures'

// ---------------------------------------------------------------------------
// 4. NO SHIMMER
// ---------------------------------------------------------------------------
describe('radar – the estimate does not shimmer', () => {
  // ⚠ EXPLICIT TIMEOUT, NOT A WEAKENED ASSERTION. These sweep LIVE careers - 208 weeks x several
  // seeds x four axes - and take 1-3s alone. Under a loaded machine (this suite grew to 72 files,
  // and the wave was built by five agents at once) they crossed vitest's 5s default and went red
  // while passing in isolation. The pins below are untouched; only the clock is. CI runs
  // singleFork, which is slower still, so the headroom is not optional.
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
  }, 30_000)

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

  // ⚠ EXPLICIT TIMEOUT, NOT A WEAKENED ASSERTION. These sweep LIVE careers - 208 weeks x several
  // seeds x four axes - and take 1-3s alone. Under a loaded machine (this suite grew to 72 files,
  // and the wave was built by five agents at once) they crossed vitest's 5s default and went red
  // while passing in isolation. The pins below are untouched; only the clock is. CI runs
  // singleFork, which is slower still, so the headroom is not optional.
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
  }, 30_000)
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
              skills: { serve: 50 + skew, ret: 50 - skew, composure: 50 + skew, stamina: 50 - skew, groundstrokes: 50 + skew },
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
        skills: { serve: 50 + skew, ret: 50 - skew, composure: 50 + skew, stamina: 50 - skew, groundstrokes: 50 + skew },
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
