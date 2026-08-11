// THE SKILLS RADAR, PART THREE: THE COACH'S EYE, AND THE TRAINING CARD IT GATES.
//
// Split out of tests/radar.test.ts on 11.08 when that file crossed birpc's 60s RPC window on CI -
// tests/radarFixtures.ts carries the whole story, and the section numbers below are the original
// suite's. Nothing here was rewritten, re-seeded or shortened in the move.
//
// §6 and the Training card belong in one file because they are one mechanism seen from two ends: the
// coach ladder buys the confidence (§6), and the card is the surface that spends it - "the same
// movement is INVISIBLE in thick fog and readable in thin" (§11) is the ladder, drawn on the card.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  axisConfidence,
  buildTrainingRead,
  radarConfidence,
  tenureRamp,
  COACH_ACCURACY,
  COACH_EYE,
  RADAR_AXIS_LABEL,
  TRAINING_FOG_FLOOR,
  TRAINING_FOG_ROTATE_WEEKS,
  TRAINING_MIN_CONFIDENCE,
} from '../src/engine/radar'
import { SKILL_KEYS } from '../src/engine/development'
import { COACH_TIERS } from '../src/engine/coach'
import { coachSinceWeek, createWorld, hireCoach, tickWeek, toSnapshot } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'
import { allTrainingReads, movedView, read, runCareer, synthView } from './radarFixtures'

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

  // ⚠ EXPLICIT TIMEOUT, NOT A WEAKENED ASSERTION. These sweep LIVE careers - 208 weeks x several
  // seeds x four axes - and take 1-3s alone. Under a loaded machine (this suite grew to 72 files,
  // and the wave was built by five agents at once) they crossed vitest's 5s default and went red
  // while passing in isolation. The pins below are untouched; only the clock is. CI runs
  // singleFork, which is slower still, so the headroom is not optional.
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
  }, 30_000)

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

  it('THE CARD CANNOT ADD ONE EITHER – the Training tile binds the read and nothing else', () => {
    // A template fact, and templates are exactly what rots quietly. The tile is allowed two numbers,
    // and they are the PLAYER'S OWN slider (`plan.train` / `plan.rest`) - a decision he made, not a
    // measurement of her. Anything else interpolated into this block is a leak.
    const card = readFileSync(new URL('../src/components/WeekRecapCard.vue', import.meta.url), 'utf8')
    const from = card.indexOf('<Eyebrow>Training</Eyebrow>')
    const to = card.indexOf('</Card>', from)
    expect(from, 'the Training tile moved – re-aim this pin, do not delete it').toBeGreaterThan(0)
    const tile = card.slice(from, to)
    const bindings = [...tile.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)].map((m) => m[1])
    expect(bindings.length).toBeGreaterThan(3)
    for (const b of bindings) {
      expect(b, `Training tile interpolates ${b}`).toMatch(
        /^(plan\.(train|rest)|trainingRead\.(label|text)|DAY_LETTERS\[i\])$/,
      )
    }
    // ...and the wing's NAME is the engine's, never a table in the screen. Both halves: no literal
    // axis word typed into the markup, and no second `RADAR_AXIS_LABEL` declared in the script -
    // which is the shape the leak would actually take, and which would print "Ret" at a parent.
    expect(tile).toContain('trainingRead.label')
    expect(tile).not.toMatch(/>\s*(Ret|Serve|Return|Composure|Stamina)\s*</)
    expect(card).not.toMatch(/\bret:\s*['"]/)
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
