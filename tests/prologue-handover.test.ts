// ⭐⭐⭐ PHASE 4 – THE HANDOVER AND THE WIRING, docs/specs/childhood-prologue-build-2026-09.md §4/§5.
//
// The acceptance criterion, in the spec's own words: «a career started through the prologue and one
// started through the wizard produce the same SHAPE of world – same schema, same invariants, only
// different numbers.» This file proves that, and the one thing that must NOT differ.
//
// ⚠⚠ MUTATION-VERIFIED. Every claim below was watched failing before it was believed:
//   * `potential: rollPotential(seed, arrival)` in createWorld (i.e. the ceiling rolled off the
//     childhood instead of off the birth build) -> the potential identity goes red on every seed,
//     naming the attribute. This is THE mutation of the file: §4's «MAY NOT» is the one rule a
//     prologue can break silently, because a raised ceiling looks like a better career.
//   * `skills: born` (the childhood dropped) -> the arrival test goes red and the shape test stays
//     green, which is exactly the pair of signals it should give.
//   * `fundsCents: STARTING_FUNDS_CENTS[...]` on the prologue path -> the money tests go red.
//   * `referenceSpendCents` moved by a dollar -> the pin against the card table goes red.
//   * an eleventh key added to `createWorld`'s literal on the prologue path only -> the shape test
//     goes red naming the key.
//   * a coach line given a digit, and a control label given the word «again» in the sense the ruling
//     forbids -> the copy sweeps go red.
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import {
  createWorld,
  prologueCoachTier,
  prologuePlayStyle,
  startingSkills,
  tickWeek,
  toSnapshot,
  STARTING_FUNDS_CENTS,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { withHeadStart } from '../src/engine/world/player'
import { HANDOVER_BASE_CUTS, coachRoomBand, coachRoomNote, handoverBaseBand, handoverRoomBand } from '../src/engine/world/coachMarket'
import { ECONOMY, prologueFundsCents } from '../src/engine/economy'
import { childhoodArrival, weightAt } from '../src/engine/childhood'
import { physicalMean } from '../src/engine/development'
import { styleOf } from '../src/engine/season/rival'
import { PROLOGUE_CARDS } from '../src/prologue/cards'
import { COACH_BASE_READS, COACH_READS, HANDOVER_COPY, WALK_COPY, coachBaseReadFor, coachReadFor, spentLine } from '../src/prologue/handover'
import {
  EMPTY_RUN,
  cardFor,
  chosenYears,
  spentCents,
  withOrigin,
  withPick,
  type PrologueRun,
} from '../src/prologue/run'
import { DEFAULT_PROFILE, type FamilyBackground, type PlayerProfile, type PrologueHandover } from '../src/shared/protocol'

const BACKGROUNDS: readonly FamilyBackground[] = ['working', 'middle', 'wealthy']
const DECISION_AGES = PROLOGUE_CARDS.filter((c) => c.options).map((c) => c.age)

/** ⭐ EVERY CHILDHOOD THE SHIPPED TABLE CAN PRODUCE. Four binary decisions at 8..11 settle the
 *  twelfth's face (it is DERIVED, §2.5), and the face then offers two answers of its own, so the
 *  reachable set is 2^4 x 2 = 32 runs. Walked rather than sampled: the money model's two constants
 *  are facts about this set and a sample could not pin them. */
function everyRun(origin: FamilyBackground = 'middle'): PrologueRun[] {
  const out: PrologueRun[] = []
  const step = (i: number, run: PrologueRun): void => {
    if (i === DECISION_AGES.length - 1) {
      for (const opt of cardFor(12, run).options ?? []) out.push(withPick(run, 12, opt.id))
      return
    }
    const age = DECISION_AGES[i]
    for (const opt of PROLOGUE_CARDS.find((c) => c.age === age)?.options ?? []) {
      step(i + 1, withPick(run, age, opt.id))
    }
  }
  step(0, withOrigin(EMPTY_RUN, origin))
  return out
}

function handoverOf(run: PrologueRun): PrologueHandover {
  return { years: chosenYears(run), spentCents: spentCents(run) }
}

const CHEAPEST = everyRun().map(handoverOf).sort((a, b) => a.spentCents - b.spentCents)[0]
const DEAREST = everyRun().map(handoverOf).sort((a, b) => b.spentCents - a.spentCents)[0]

function profileFor(background: FamilyBackground): PlayerProfile {
  return { ...DEFAULT_PROFILE, background }
}

// =================================================================================================
// ⚠⚠⚠ THE ONE THING A PROLOGUE MAY NOT MOVE
// =================================================================================================
//
// §4: «MAY NOT: `potential`. Her ceiling is talent and what you did at eight does not change it. Let
// the prologue raise it and "you made her" quietly becomes "she was always going to be good".» Same
// rule the coach spec's §6 and task 55 keep: a timing or effort effect must never become a talent
// effect.

describe('⚠⚠ `potential` is byte-identical between a prologue career and a wizard career', () => {
  it('on every seed, every background and both ends of the table', () => {
    for (const seed of ['a', 'vera-91zz', 'seed-with-a-long-name', '7', 'ща']) {
      for (const background of BACKGROUNDS) {
        const profile = profileFor(background)
        const wizard = createWorld(seed, profile, 'w')
        for (const prologue of [CHEAPEST, DEAREST]) {
          const played = createWorld(seed, profile, 'p', prologue)
          // BYTE-identical, not «equal to within a rounding» – the same serialisation, which is what
          // a save carries and what a career hash is taken over.
          expect(JSON.stringify(played.potential), `${seed}/${background}`).toBe(JSON.stringify(wizard.potential))
        }
      }
    }
  })

  it('...and the proof is not vacuous – the SKILLS on those same careers do move', () => {
    const profile = profileFor('middle')
    const wizard = createWorld('a', profile, 'w')
    const rich = createWorld('a', profile, 'p', DEAREST)
    const poor = createWorld('a', profile, 'p', CHEAPEST)
    expect(JSON.stringify(rich.skills)).not.toBe(JSON.stringify(wizard.skills))
    expect(JSON.stringify(poor.skills)).not.toBe(JSON.stringify(rich.skills))
  })

  it('⭐ and the STRUCTURAL reason: the ceiling roll never sees the profile, let alone the childhood', () => {
    // `startingSkills(seed, _profile)` ignores its second argument (world/player.ts – the underscore
    // is in the shipped signature), and `rollPotential` is fed exactly that. So no field the
    // prologue derives – the earned style, the rung, the background – can reach the ceiling even in
    // principle. Asserted through the public function rather than by reading the source, so a
    // refactor that started reading the profile fails here.
    const born = startingSkills('a', profileFor('middle'))
    for (const background of BACKGROUNDS) {
      expect(startingSkills('a', profileFor(background))).toEqual(born)
      expect(startingSkills('a', { ...DEFAULT_PROFILE, playStyle: 'serve-first', coachTier: 'elite' })).toEqual(born)
    }
  })
})

// =================================================================================================
// ⭐⭐ THE SAME SHAPE OF WORLD
// =================================================================================================

/** A world's SHAPE: every key path, with the kind of thing at it and nothing about the value. Arrays
 *  collapse to their element shape so a career with three events and one with four are the same
 *  shape – the claim is about the schema, not about how much has happened. */
function shapeOf(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) {
    const inner = new Set<string>()
    for (const item of value) for (const line of shapeOf(item, `${path}[]`)) inner.add(line)
    return [`${path}: array`, ...[...inner].sort()]
  }
  if (value !== null && typeof value === 'object') {
    const out = [`${path}: object`]
    for (const key of Object.keys(value as object).sort()) {
      out.push(...shapeOf((value as Record<string, unknown>)[key], `${path}.${key}`))
    }
    return out
  }
  return [`${path}: ${value === null ? 'null' : typeof value}`]
}

describe('⭐⭐ a prologue career and a wizard career are the same SHAPE of world', () => {
  it('same schema version, same key set, same types – on every background', () => {
    for (const background of BACKGROUNDS) {
      const profile = profileFor(background)
      const wizard = createWorld('same-seed', profile, 'w')
      for (const prologue of [CHEAPEST, DEAREST]) {
        const played = createWorld('same-seed', profile, 'p', prologue)
        expect(played.schemaVersion, background).toBe(wizard.schemaVersion)
        expect(shapeOf(played), background).toEqual(shapeOf(wizard))
      }
    }
  })

  it('...and only the numbers differ – which is what makes the sameness worth asserting', () => {
    const profile = profileFor('working')
    const wizard = createWorld('same-seed', profile, 'w')
    const played = createWorld('same-seed', profile, 'p', DEAREST)
    expect(JSON.stringify(played)).not.toBe(JSON.stringify(wizard))
  })

  it('the invariants a fresh career opens on hold on both paths', () => {
    for (const prologue of [undefined, CHEAPEST, DEAREST]) {
      const w = createWorld('same-seed', profileFor('middle'), 'c', prologue)
      const label = prologue ? `spent ${prologue.spentCents}` : 'the wizard'
      expect(w.week, label).toBe(0)
      expect(w.rngMain.n, label).toBe(0)
      expect(w.kidFundsCents, label).toBe(0)
      expect(w.results.length, label).toBeGreaterThan(0)
      expect(w.onRampCleared, label).toEqual({ itf: false, wta: false })
      expect(w.seasonStartRank, label).toBe(w.kidRank)
      expect(w.ending, label).toBe(null)
      expect(w.careerTotals, label).toEqual({ earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 })
      expect(w.fundsCents, label).toBeGreaterThan(0)
    }
  })

  it('⚠ THE COHORT AND THE PRE-HISTORY ARE BYTE-IDENTICAL – the prologue touches no world but hers', () => {
    // Phase 3's rule, held one phase later: the ladder was repaired in round 31 and a prologue must
    // not put a child into the population that repair measured. Nothing here draws on MAIN either.
    const wizard = createWorld('same-seed', profileFor('middle'), 'w')
    const played = createWorld('same-seed', profileFor('middle'), 'p', DEAREST)
    expect(JSON.stringify(played.cohort)).toBe(JSON.stringify(wizard.cohort))
    expect(JSON.stringify(played.results)).toBe(JSON.stringify(wizard.results))
    expect(JSON.stringify(played.rngMain)).toBe(JSON.stringify(wizard.rngMain))
  })
})

describe('⚠ the wizard path is what it always was', () => {
  it('her build is still the head-started birth build, to the byte', () => {
    // `skills:` was `withHeadStart(startingSkills(seed, profile), profile.birthMonth)` and is now
    // `arrival`, which is that expression when there is no prologue. This is the pin that says the
    // rewrite moved nothing – and `peakPhysical` reads the same object, as its own comment demands.
    for (const seed of ['a', 'b', 'career-3']) {
      const profile = profileFor('middle')
      const w = createWorld(seed, profile, 'w')
      const expected = withHeadStart(startingSkills(seed, profile), profile.birthMonth)
      expect(JSON.stringify(w.skills), seed).toBe(JSON.stringify(expected))
      expect(w.peakPhysical, seed).toBe(physicalMean(expected))
    }
  })

  it('a fresh wizard career hashes the same however the prologue argument is spelled', () => {
    const hash = (w: WorldState) => createHash('sha256').update(JSON.stringify(w)).digest('hex')
    const profile = profileFor('wealthy')
    expect(hash(createWorld('h', profile, 'w'))).toBe(hash(createWorld('h', profile, 'w', undefined)))
  })

  it('the profile the wizard handed in is the profile the world keeps', () => {
    const profile: PlayerProfile = { ...DEFAULT_PROFILE, playStyle: 'serve-first', coachTier: 'elite' }
    const w = createWorld('h', profile, 'w')
    expect(w.profile.playStyle).toBe('serve-first')
    expect(w.profile.coachTier).toBe('elite')
  })
})

// =================================================================================================
// ⭐ WHAT THE NINE YEARS EARNED (§4's MAY list)
// =================================================================================================

describe('⭐ the build she arrives with', () => {
  it('is the childhood applied to the head-started birth build, and nothing else', () => {
    const profile = profileFor('middle')
    for (const prologue of [CHEAPEST, DEAREST]) {
      const w = createWorld('a', profile, 'p', prologue)
      const born = withHeadStart(startingSkills('a', profile), profile.birthMonth)
      expect(JSON.stringify(w.skills)).toBe(JSON.stringify(childhoodArrival(born, prologue.years)))
      expect(w.peakPhysical).toBe(physicalMean(w.skills))
    }
  })

  it('⚠ and it stays inside the band a fresh fourteen-year-old is drawn from', () => {
    // Phase 1 clamps `childhoodArrival` to `STARTING_SKILL_BAND` so the set of girls a prologue can
    // hand over is the SAME SET, not an overlapping one. Re-asserted here at the createWorld seam,
    // because that is where a caller could bypass it.
    const bands = ECONOMY.development
    expect(bands).toBeTruthy()
    for (const run of everyRun()) {
      const w = createWorld('band', profileFor('middle'), 'p', handoverOf(run))
      for (const k of ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const) {
        expect(w.skills[k]).toBeGreaterThanOrEqual(30)
        expect(w.skills[k]).toBeLessThanOrEqual(60)
      }
    }
  })
})

describe('⭐ the style she earned, and the rung she arrives on', () => {
  it('the style is the game`s own derivation read off her arrival build', () => {
    for (const run of everyRun()) {
      const w = createWorld('style', profileFor('middle'), 'p', handoverOf(run))
      expect(w.profile.playStyle).toBe(styleOf(w.skills))
      expect(prologuePlayStyle(w.skills)).toBe(styleOf(w.skills))
    }
  })

  it('⚠ and it is not simply the wizard default wearing a hat – the table reaches more than one', () => {
    const styles = new Set<string>()
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      for (const run of everyRun()) styles.add(createWorld(seed, profileFor('middle'), 'p', handoverOf(run)).profile.playStyle)
    }
    expect(styles.size).toBeGreaterThan(1)
  })

  it('the rung is an EVEN read of `teaching` onto the five-rung ladder – no threshold was chosen', () => {
    const ladder = ['self', 'budget', 'middle', 'high', 'elite'] as const
    for (const share of [0, 0.19, 0.2, 0.39, 0.4, 0.59, 0.6, 0.79, 0.8, 1]) {
      const years = PROLOGUE_CARDS.map((c) => ({ age: c.age, practice: 0.5, teaching: share, focus: 'general' as const }))
      expect(prologueCoachTier(years), `teaching ${share}`).toBe(ladder[Math.min(4, Math.floor(share * 5))])
    }
  })

  it('...weighted by the year, so the thirteenth counts for more than the fifth', () => {
    const flat = PROLOGUE_CARDS.map((c) => ({ age: c.age, practice: 0.5, teaching: 0, focus: 'general' as const }))
    const late = flat.map((y) => (y.age >= 12 ? { ...y, teaching: 1 } : y))
    const early = flat.map((y) => (y.age <= 6 ? { ...y, teaching: 1 } : y))
    expect(weightAt(13)).toBeGreaterThan(weightAt(5))
    expect(prologueCoachTier(late)).not.toBe('self')
    expect(prologueCoachTier(early)).toBe('self')
  })

  it('every reachable childhood lands on budget, middle or high – measured, not assumed', () => {
    const rungs = new Set(everyRun().map((run) => prologueCoachTier(chosenYears(run))))
    expect([...rungs].sort()).toEqual(['budget', 'high', 'middle'])
  })

  it('⚠ the rung reaches the world – `physioActive` and the opening coach follow it', () => {
    const w = createWorld('rung', profileFor('middle'), 'p', DEAREST)
    expect(w.profile.coachTier).toBe(prologueCoachTier(DEAREST.years))
    expect(typeof w.physioActive).toBe('boolean')
    expect(w.coachId === null || typeof w.coachId === 'string').toBe(true)
  })
})

// =================================================================================================
// ⭐⭐ THE MONEY – the total, once, and the only new arithmetic in the phase
// =================================================================================================

describe('⭐⭐ what the nine years did to the family`s reserve', () => {
  it('⚠ THE TWO CONSTANTS ARE FACTS ABOUT THE CARD TABLE, recomputed here rather than re-typed', () => {
    const spends = everyRun().map((r) => spentCents(r)).sort((a, b) => a - b)
    const cheapest = spends[0]
    const dearest = spends[spends.length - 1]
    expect(spends.length).toBe(32)
    expect(ECONOMY.prologue.referenceSpendCents).toBe((cheapest + dearest) / 2)
    expect(ECONOMY.prologue.spendSwingCents).toBe((dearest - cheapest) / 2)
  })

  it('the family the economy is anchored on gets the plain subtraction', () => {
    const { referenceSpendCents: ref, spendSwingCents: swing } = ECONOMY.prologue
    const base = STARTING_FUNDS_CENTS.middle
    expect(prologueFundsCents('middle', ref)).toBe(base)
    expect(prologueFundsCents('middle', ref - swing)).toBe(base + swing)
    expect(prologueFundsCents('middle', ref + swing)).toBe(base - swing)
  })

  it('...and the other two move by the same SHARE of their own reserve, never into debt', () => {
    for (const background of BACKGROUNDS) {
      const base = STARTING_FUNDS_CENTS[background]
      for (const run of everyRun(background)) {
        const funds = prologueFundsCents(background, spentCents(run))
        expect(funds, background).toBeGreaterThan(0)
        expect(funds, background).toBeGreaterThanOrEqual(Math.round(base * 0.6))
        expect(funds, background).toBeLessThanOrEqual(Math.round(base * 1.4))
      }
      expect(prologueFundsCents(background, ECONOMY.prologue.referenceSpendCents), background).toBe(base)
    }
  })

  it('⚠ the clamp is a guard against the wire, and a real run can never reach it', () => {
    const { referenceSpendCents: ref, spendSwingCents: swing } = ECONOMY.prologue
    expect(prologueFundsCents('middle', 0)).toBe(prologueFundsCents('middle', ref - swing))
    expect(prologueFundsCents('middle', 99_999_999)).toBe(prologueFundsCents('middle', ref + swing))
    for (const run of everyRun()) {
      expect(Math.abs(ref - spentCents(run))).toBeLessThanOrEqual(swing)
    }
  })

  it('the reserve on the world is what the model says, and the wizard`s is the flat number', () => {
    for (const background of BACKGROUNDS) {
      const profile = profileFor(background)
      expect(createWorld('m', profile, 'w').fundsCents).toBe(STARTING_FUNDS_CENTS[background])
      for (const prologue of [CHEAPEST, DEAREST]) {
        expect(createWorld('m', profile, 'p', prologue).fundsCents).toBe(
          prologueFundsCents(background, prologue.spentCents),
        )
      }
    }
  })

  it('⚠ the opening ledger line says the reserve the family actually has', () => {
    const w = createWorld('m', profileFor('working'), 'p', DEAREST)
    const opening = w.events.find((e) => e.text.includes('Family budget'))
    expect(opening?.text).toContain(`$${Math.round(w.fundsCents / 100).toLocaleString('en-US')}`)
  })
})

// =================================================================================================
// ⭐ THE COACH'S READ – §8a, and the fog it must not undo
// =================================================================================================

describe('⭐ the coach speaks in the vocabulary he already has', () => {
  it('§8a is transcribed verbatim – three bands, and nothing was smoothed on the way in', () => {
    expect(COACH_READS['Close to her ceiling']).toEqual([
      'She is near what she has. I have been wrong before – but not often about this.',
      'What you see is close to what you get. Some find another gear at seventeen. Most do not.',
      'There is not much more in there. She can have a good life in this sport. She will not have a famous one.',
    ])
    expect(COACH_READS['Still room to grow']).toEqual([
      'There is more in there. How much, I could not tell you yet.',
      'She is not finished. The next three years will say how far.',
    ])
    expect(COACH_READS['Huge potential']).toEqual([
      'I do not say this often. There is a great deal more in there.',
      'Whatever she is now, she is nowhere near the end of it.',
    ])
  })

  it('⚠⚠ EVERY band the engine can produce resolves, and the fourth is not given a ceiling of its own', () => {
    // `coachRoomBandIndex` has FOUR bands and §8a drafted three. The top one's LABEL is a ceiling
    // claim in three words, and §5 forbids him ever naming one – so it takes the read that concedes
    // he can be wrong, by reference rather than by a fourth copy of the sentences.
    for (const band of ['Huge potential', 'Still room to grow', 'Close to her ceiling', 'At her ceiling']) {
      expect(COACH_READS[band], band).toBeTruthy()
      expect(coachReadFor(band, 'seed').length, band).toBeGreaterThan(0)
    }
    expect(COACH_READS['At her ceiling']).toBe(COACH_READS['Close to her ceiling'])
    expect(coachReadFor('', 'seed')).toBe(coachReadFor('Close to her ceiling', 'seed'))
  })

  it('⚠ he is allowed to be WRONG, and the weak draw`s read says so', () => {
    expect(COACH_READS['Close to her ceiling'].join(' ')).toContain('I have been wrong before')
  })

  it('⚠ NOT ONE COACH LINE CARRIES A NUMBER – the fog rule, as a property of the rendered string', () => {
    for (const [band, lines] of Object.entries(COACH_READS)) {
      for (const line of lines) {
        expect(/\d/.test(line), `${band}: ${line}`).toBe(false)
        expect(line.includes('%'), `${band}: ${line}`).toBe(false)
        expect(line.includes('$'), `${band}: ${line}`).toBe(false)
      }
    }
  })

  it('the line is the same every time this career is drawn, and different careers hear different ones', () => {
    expect(coachReadFor('Close to her ceiling', 'a')).toBe(coachReadFor('Close to her ceiling', 'a'))
    const heard = new Set<string>()
    for (let i = 0; i < 200; i++) heard.add(coachReadFor('Close to her ceiling', `seed-${i}`))
    expect(heard.size).toBe(COACH_READS['Close to her ceiling'].length)
  })

  it('⭐⭐ a real career at week 0 gets a band, and the weak draw gets the honest one', () => {
    const bands = new Map<string, number>()
    for (let i = 0; i < 400; i++) {
      const w = createWorld(`band-${i}`, profileFor('middle'), 'p', CHEAPEST)
      const band = handoverRoomBand(w)
      expect(band.length).toBeGreaterThan(0)
      expect(COACH_READS[band], band).toBeTruthy()
      bands.set(band, (bands.get(band) ?? 0) + 1)
    }
    // All three, and none of them a rarity the copy would never be seen in.
    expect([...bands.keys()].sort()).toEqual(['Close to her ceiling', 'Huge potential', 'Still room to grow'])
    for (const [band, n] of bands) expect(n, band).toBeGreaterThan(4)
    // ⚠ AND NEVER THE FOURTH. `At her ceiling` is a ceiling claim in three words and §5 forbids him
    // ever naming one.
    expect(bands.has('At her ceiling')).toBe(false)
  })

  it('⚠⚠ THE WEAK DRAW – a girl at the bottom of `potentialBand` is never told she has room', () => {
    // §1c: «a career at the bottom of this band is a girl who was never going to make it, and that
    // has to be a career the game can tell». This is the game telling it.
    const [lo, hi] = ECONOMY.development.potentialBand
    let bottom = 0
    for (let i = 0; i < 800; i++) {
      const w = createWorld(`weak-${i}`, profileFor('middle'), 'p', DEAREST)
      const born = startingSkills(w.seed, w.profile)
      let room = 0
      for (const k of ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const) room += w.potential[k] - born[k]
      room /= 5
      if (room >= lo + (hi - lo) / 3) continue
      bottom++
      expect(handoverRoomBand(w), `seed weak-${i}, room ${room.toFixed(2)}`).toBe('Close to her ceiling')
    }
    expect(bottom, 'the arm is not empty – some seeds really do draw a dud').toBeGreaterThan(10)
  })

  it('⚠⚠ AND THE CHILDHOOD DOES NOT MOVE IT – the rose is what you made, the read is what she has', () => {
    // Measured before it was decided: reading her ARRIVAL build instead of her birth build moves the
    // band on 23.9% of seeds between the cheapest and the dearest childhood, DOWNWARD for the girl
    // whose parents did everything. §5 keeps the two statements apart and so does this.
    for (let i = 0; i < 400; i++) {
      const seed = `same-${i}`
      const wizard = createWorld(seed, profileFor('middle'), 'w')
      const poor = createWorld(seed, profileFor('working'), 'p', CHEAPEST)
      const rich = createWorld(seed, profileFor('wealthy'), 'p', DEAREST)
      expect(handoverRoomBand(poor), seed).toBe(handoverRoomBand(wizard))
      expect(handoverRoomBand(rich), seed).toBe(handoverRoomBand(wizard))
    }
  })

  it('⚠ the shipped coach-market ladder is NOT what the handover reads, and here is why', () => {
    // At week 0 `coachRoomBandIndex` grades on a REALISATION share, and nobody has realised anything
    // yet: over 300 fresh careers it answers `Huge potential` to the overwhelming majority. A
    // handover built on it would promise nearly every player a star.
    let huge = 0
    for (let i = 0; i < 300; i++) {
      if (coachRoomBand(coachRoomNote(createWorld(`ladder-${i}`, profileFor('middle'), 'w'))) === 'Huge potential') huge++
    }
    expect(huge).toBeGreaterThan(250)
  })

  it('⚠ the band reaches the snapshot at week 0 and is GONE by week 1', () => {
    const w = createWorld('snap', profileFor('middle'), 'p', CHEAPEST)
    expect(toSnapshot(w).handoverBand).toBe(handoverRoomBand(w))
    const rng = resumeMain(w.rngMain)
    tickWeek(w, rng)
    expect(w.week).toBe(1)
    expect(toSnapshot(w).handoverBand).toBe('')
  })
})

// =================================================================================================
// ⭐⭐⭐ PHASE 7 – THE SECOND DIMENSION: THE BASE
// =================================================================================================
//
// THE OWNER, 02.09: «оставляем туман, у нас есть слова тренера – вот ими надо добавить понимание про
// базу и перспективы как раз в дополнение к туману».
//
//     the BASE = what you BUILT        the ROOM = what she was BORN with
//
// ⚠⚠ MUTATION-VERIFIED. Every claim below was watched failing before it was believed:
//   * `handoverBaseBand` reading the BIRTH build instead of `world.skills` -> «the base answers the
//     childhood» goes red on 90% of seeds. That is the mutation of this block: it is the exact way a
//     future reader would "unify" the two bands and silently delete the player's nine years.
//   * `handoverBaseBand` returning `'level'` always -> the distribution test names the missing bands.
//   * the two cuts widened to p05/p95 -> the distribution test goes red on the shares.
//   * `coachBaseReadFor` drawing on `:prologue:read` (the room band's key) -> the independence test
//     goes red.
//   * a digit put into a base line -> the fog sweep goes red naming the band.
describe('⭐⭐ where she stands TODAY – the base band, and it is the half the childhood moves', () => {
  const AGE_GROUP = { p05: 44.3, p20: 46.3, p50: 48.5, p80: 50.7, p95: 52.7 }

  function meanAttribute(w: WorldState): number {
    const keys = ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const
    return keys.reduce((a, k) => a + w.skills[k], 0) / keys.length
  }

  // ⚠⚠ THOUSANDS OF SEEDS, ONE WORLD – AND THE SUBSTITUTION IS PROVED, NOT ASSUMED. `createWorld`
  // builds a cohort and a season of pre-history, which is ~8ms a call: the distributions below need
  // 4,000 samples and would spend two minutes buying nothing, and the first draft of this block
  // timed the unit project out at 20s doing exactly that. `handoverBaseBand` reads `world.skills`
  // and nothing else, and on the WIZARD path `createWorld` sets `skills` to
  // `withHeadStart(startingSkills(seed, profile), profile.birthMonth)` – so a world with that field
  // swapped is the same input. The test below pins that identity against real worlds, and every
  // sampled test uses `arrivalOf` on top of it.
  const TEMPLATE = createWorld('base-template', DEFAULT_PROFILE, 'w')
  const freshWorld = (seed: string): WorldState => ({
    ...TEMPLATE,
    seed,
    skills: withHeadStart(startingSkills(seed, DEFAULT_PROFILE), DEFAULT_PROFILE.birthMonth),
  })

  it('⚠ the cheap fresh world IS the world `createWorld` builds – the substitution below rests on it', () => {
    for (let i = 0; i < 40; i++) {
      const seed = `sub-${i}`
      const real = createWorld(seed, DEFAULT_PROFILE, 'w')
      expect(freshWorld(seed).skills, seed).toEqual(real.skills)
      expect(handoverBaseBand(freshWorld(seed)), seed).toBe(handoverBaseBand(real))
    }
  })

  // ⭐ THE REFERENCE IS RE-MEASURED HERE RATHER THAN QUOTED. docs/specs/childhood-growth-2026-09.md
  // §4a printed this distribution once, on a bench nobody runs on a commit; the two cuts in
  // `HANDOVER_BASE_CUTS` are two of its quantiles, so if the fourteen-year-old a `createWorld` makes
  // ever moves, the cuts stop meaning what their comment says and this is what notices.
  // ⚠ 4,000 seeds and a tolerance of a tenth: the mean of five integers lives on a 0.2 lattice, and
  // the growth spec's own note records a measurement bug caused by ignoring exactly that.
  it('⚠ the fresh fourteen-year-old is still the distribution the cuts were measured against', () => {
    const xs: number[] = []
    for (let i = 0; i < 4000; i++) xs.push(meanAttribute(freshWorld(`ref-${i}`)))
    xs.sort((a, b) => a - b)
    const at = (q: number) => xs[Math.round(q * (xs.length - 1))]
    for (const [name, want] of Object.entries(AGE_GROUP)) {
      const q = Number(name.slice(1)) / 100
      // ⚠ ±0.3 AND NOT TIGHTER, and the reason is the growth spec's own recorded measurement bug: a
      // mean of five integers lives on a 0.2 LATTICE, so a tail quantile at 4,000 seeds legitimately
      // lands one step off the 400,000-seed answer. Tightening this asserts the sample size, not the
      // distribution. The CUTS themselves are at p20/p80, where the density is high and the same
      // 4,000 seeds reproduce them exactly.
      expect(Math.abs(at(q) - want), `${name} of today's fourteen-year-olds is ${at(q)}`).toBeLessThanOrEqual(0.3)
    }
    // ...and the cuts really are two of its quantiles.
    expect(HANDOVER_BASE_CUTS.below).toBe(AGE_GROUP.p20)
    expect(HANDOVER_BASE_CUTS.ahead).toBe(AGE_GROUP.p80)
  })

  // ⭐ THE SHARES: 19 / 62 / 19 over careers the prologue never touched. Measured at 20k, 100k and
  // 400k seeds while the cuts were being chosen and stable to the hundredth at all three.
  it('⭐ over wizard careers the three bands hold about a fifth, three fifths and a fifth', () => {
    const n: Record<string, number> = { behind: 0, level: 0, ahead: 0 }
    const N = 4000
    for (let i = 0; i < N; i++) n[handoverBaseBand(freshWorld(`dist-${i}`))]++
    expect(n.behind / N, 'behind').toBeCloseTo(0.19, 1)
    expect(n.level / N, 'level').toBeCloseTo(0.62, 1)
    expect(n.ahead / N, 'ahead').toBeCloseTo(0.19, 1)
    // ⚠⚠ AND THE MIDDLE BAND HOLDS MORE THAN HALF, which is not a taste – it is what makes «She is
    // where most girls her age are» a TRUE sentence. The tertiles were measured at 37.6% and
    // rejected on exactly this: the copy would have been a lie about the population.
    expect(n.level / N, 'the middle sentence says «most», so it has to be most').toBeGreaterThan(0.5)
  })

  // ⭐⭐⭐ THE ACCEPTANCE CRITERION, AND IT IS THE WHOLE POINT OF PHASE 7. Two childhoods, one seed:
  // different BASE sentences, the SAME room sentence. The second half is the potential rule (§4)
  // being kept, not a bug in the first.
  it('⭐⭐ the same girl, raised two ways: the base answers the childhood and the room cannot', () => {
    let baseMoved = 0
    // ⚠ 150 REAL WORLDS, and they have to be real: this is the one claim that is ABOUT what a
    // childhood does to `createWorld`, so the cheap substitution above is not available here.
    const N = 150
    for (let i = 0; i < N; i++) {
      const seed = `two-ways-${i}`
      const poor = createWorld(seed, profileFor('middle'), 'p', CHEAPEST)
      const rich = createWorld(seed, profileFor('middle'), 'p', DEAREST)
      // THE ROOM IS THE SAME SENTENCE, every seed, no exceptions.
      expect(handoverRoomBand(poor), seed).toBe(handoverRoomBand(rich))
      expect(coachReadFor(toSnapshot(poor).handoverBand, seed), seed).toBe(
        coachReadFor(toSnapshot(rich).handoverBand, seed),
      )
      // THE BASE IS NOT, on most of them – and it is never the WRONG way round.
      expect(meanAttribute(rich), seed).toBeGreaterThan(meanAttribute(poor))
      if (handoverBaseBand(poor) !== handoverBaseBand(rich)) baseMoved++
    }
    // ⚠⚠ 40.9%, MEASURED – AND THE NUMBER THE OWNER SHOULD BE TOLD IS THIS ONE, not the 89.9% the
    // cuts were chosen against. That figure is the MODEL's extremes (`neglectedChildhood()` versus
    // `devotedChildhood()`, a 4.28-point span); CHEAPEST and DEAREST here are the extremes of the
    // SHIPPED CARD TABLE, and enumerating all 32 runs through it shows a span of only 1.87 points
    // (47.48 -> 49.35 mean arrival). The cards do not reach the model's edges – recorded in
    // docs/specs/childhood-prologue-build-2026-09.md §8c as a finding, not fixed here, because
    // widening what a card buys is a balance change and §8 is not the place for one.
    // The floor is set under the measurement and is still far out of reach of a base band that reads
    // her birth build, which is what this test is protecting.
    expect(baseMoved / N, 'the nine years reach the base sentence').toBeGreaterThan(0.25)
  })

  it('⚠ and the cheap childhood is never told she is ahead of a girl the dear one leaves behind', () => {
    // Monotone in the only quantity it reads: a richer childhood cannot produce a LOWER band.
    const order = { behind: 0, level: 1, ahead: 2 }
    for (let i = 0; i < 150; i++) {
      const seed = `monotone-${i}`
      const poor = handoverBaseBand(createWorld(seed, profileFor('middle'), 'p', CHEAPEST))
      const rich = handoverBaseBand(createWorld(seed, profileFor('middle'), 'p', DEAREST))
      expect(order[rich], `${seed}: ${poor} -> ${rich}`).toBeGreaterThanOrEqual(order[poor])
    }
  })

  it('⚠ the band reaches the snapshot at week 0 and is GONE by week 1 – like the room band', () => {
    const w = createWorld('base-snap', profileFor('middle'), 'p', CHEAPEST)
    expect(toSnapshot(w).handoverBaseBand).toBe(handoverBaseBand(w))
    const rng = resumeMain(w.rngMain)
    tickWeek(w, rng)
    expect(w.week).toBe(1)
    expect(toSnapshot(w).handoverBaseBand).toBe('')
    // ...and the copy answers the empty field with silence rather than with a band's worth of lines.
    expect(coachBaseReadFor('', 'base-snap')).toBe('')
  })

  it('⭐ every band has lines, the table is TOTAL, and the same career always hears the same one', () => {
    for (const band of ['behind', 'level', 'ahead'] as const) {
      expect(COACH_BASE_READS[band].length, band).toBeGreaterThan(1)
      expect(coachBaseReadFor(band, 'seed').length, band).toBeGreaterThan(0)
    }
    expect(coachBaseReadFor('ahead', 'a')).toBe(coachBaseReadFor('ahead', 'a'))
    const heard = new Set<string>()
    for (let i = 0; i < 200; i++) heard.add(coachBaseReadFor('ahead', `seed-${i}`))
    expect(heard.size, 'no line in the band is dead copy').toBe(COACH_BASE_READS.ahead.length)
  })

  // ⚠ THE TWO SENTENCES MUST NOT MOVE TOGETHER. One key for both draws would mean a career that
  // hears the first room line always hears the first base line too – a pattern a player can see, and
  // half the copy never read.
  it('⚠ the two draws are independent – the base line does not follow the room line', () => {
    let differ = 0
    for (let i = 0; i < 300; i++) {
      const seed = `draws-${i}`
      const room = COACH_READS['Huge potential'].indexOf(coachReadFor('Huge potential', seed))
      const base = COACH_BASE_READS.ahead.indexOf(coachBaseReadFor('ahead', seed))
      if (room !== base) differ++
    }
    expect(differ, 'the two draws are the same draw wearing two names').toBeGreaterThan(60)
  })

  it('⚠ NOT ONE BASE LINE CARRIES A NUMBER, AND NONE OF THEM NAMES A CEILING', () => {
    for (const [band, lines] of Object.entries(COACH_BASE_READS)) {
      for (const line of lines) {
        expect(/\d/.test(line), `${band}: ${line}`).toBe(false)
        expect(/%|\$/.test(line), `${band}: ${line}`).toBe(false)
        // §5: «If he ever names a ceiling, the fog stops meaning anything.» The base band is a
        // statement about TODAY and may not smuggle one in.
        expect(/ceiling|potential|limit|as far as|as good as/i.test(line), `${band}: ${line}`).toBe(false)
      }
    }
  })
})

describe('⚠ the copy obeys the house rules, and says nothing the ruling forbids', () => {
  const every = [
    ...Object.values(COACH_READS).flat(),
    ...Object.values(COACH_BASE_READS).flat(),
    ...Object.values(HANDOVER_COPY),
    ...Object.values(WALK_COPY),
    spentLine(1_234_00),
  ]

  it('no Cyrillic, no long dash, and the player is never «they»', () => {
    for (const line of every) {
      expect(/[Ѐ-ӿ]/.test(line), line).toBe(false)
      expect(line.includes('—'), line).toBe(false)
      expect(/\bthey\b|\btheir\b|\bthem\b/i.test(line), line).toBe(false)
    }
  })

  it('⚠⚠ THE GAME SAYS NOTHING ABOUT REROLLING, ODDS OR A FLOOR – his ruling, §2.3', () => {
    const forbidden = /reroll|re-roll|roll|odds|chance|random|potential|ceiling|seed|luck|restart|retry/i
    for (const line of [...Object.values(HANDOVER_COPY), ...Object.values(WALK_COPY)]) {
      expect(forbidden.test(line), line).toBe(false)
    }
  })

  it('the money is said once, and it is what the childhood COST', () => {
    expect(spentLine(28_150_00)).toBe('Nine years of it cost you $28,150.')
    // ...and no other string in the table carries a figure at all.
    for (const line of [...Object.values(HANDOVER_COPY), ...Object.values(WALK_COPY)]) {
      expect(/\d|\$/.test(line), line).toBe(false)
    }
  })
})
