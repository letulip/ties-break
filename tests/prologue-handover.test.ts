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
  PROLOGUE_COACH_LADDER,
  prologuePlayStyle,
  startingSkills,
  tickWeek,
  toSnapshot,
  STARTING_FUNDS_CENTS,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { withHeadStart } from '../src/engine/world/player'
import { HANDOVER_BASE_CUTS, coachRoomBand, coachRoomNote, handoverBaseBand, handoverRealisation, handoverRoomBand } from '../src/engine/world/coachMarket'
import { ECONOMY, prologueFundsCents } from '../src/engine/economy'
import { childhoodArrival, weightAt } from '../src/engine/childhood'
import { SKILL_KEYS, physicalMean, rollPotential } from '../src/engine/development'
import { styleOf } from '../src/engine/season/rival'
import { PROLOGUE_CARDS } from '../src/prologue/cards'
import {
  COACH_BASE_READS,
  COACH_READS,
  HANDOVER_COPY,
  PLAYED_COPY,
  START_AGAIN_DRAFTS,
  WALK_COPY,
  playedLine,
  coachBaseReadFor,
  coachReadFor,
  spentLine,
} from '../src/prologue/handover'
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
      for (const prologue of [CHEAPEST, DEAREST]) {
        const played = createWorld('same-seed', profile, 'p', prologue)
        // ⚠⚠ THE WIZARD CONTROL CARRIES THE RUNG THE PROLOGUE DERIVED, and that is a correction the
        // coach ladder forced rather than a weakening. `coachId` is `string | null` – `openingCoachId`
        // returns null for a `self` rung, on BOTH paths – and since the ladder a working family's
        // cheap branch really does arrive self-coached, so a wizard control frozen on the default
        // `middle` rung was comparing a career with a coach against one without and calling the
        // difference a shape change. The claim is that the PATH does not change the shape; the rung
        // changes it, and it changes it identically whichever door the career came through.
        const wizard = createWorld('same-seed', { ...profile, coachTier: played.profile.coachTier }, 'w')
        expect(played.schemaVersion, background).toBe(wizard.schemaVersion)
        expect(shapeOf(played), background).toEqual(shapeOf(wizard))
      }
    }
  })

  it('⚠ ...and the rung is the ONLY thing that moves the shape – proved by moving it', () => {
    // The exemption above is only honest if it is narrow. A wizard career at `self` and one at
    // `middle` differ in exactly one line of the shape, and that line is `coachId`.
    const profile = profileFor('working')
    const selfCoached = shapeOf(createWorld('same-seed', { ...profile, coachTier: 'self' }, 'w'))
    const hired = shapeOf(createWorld('same-seed', { ...profile, coachTier: 'middle' }, 'w'))
    const only = selfCoached.filter((l) => !hired.includes(l))
    expect(only).toEqual(['.coachId: null'])
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

  // ⭐⭐ THE LADDER – his ruling of 02.09, and the six outcomes are the acceptance.
  // docs/specs/childhood-prologue-balance-2026-09.md §1.

  it('⭐⭐ the ladder is HIS TABLE, transcribed – where you start bounds where you can reach', () => {
    expect(PROLOGUE_COACH_LADDER).toEqual({
      working: ['self', 'budget'],
      middle: ['budget', 'middle'],
      wealthy: ['middle', 'high'],
    })
  })

  it('⭐⭐ every reachable childhood x origin lands on exactly one of his six outcomes', () => {
    const seen = new Map<string, Set<string>>()
    for (const background of BACKGROUNDS) {
      const rungs = new Set<string>()
      for (const run of everyRun(background)) rungs.add(prologueCoachTier(background, chosenYears(run)))
      seen.set(background, rungs)
    }
    expect([...(seen.get('working') ?? [])].sort()).toEqual(['budget', 'self'])
    expect([...(seen.get('middle') ?? [])].sort()).toEqual(['budget', 'middle'])
    expect([...(seen.get('wealthy') ?? [])].sort()).toEqual(['high', 'middle'])
  })

  it('⚠ ...and BOTH rungs of every pair are actually reached – a ladder with a dead half is not one', () => {
    for (const background of BACKGROUNDS) {
      const [cheap, dear] = PROLOGUE_COACH_LADDER[background]
      const rungs = everyRun(background).map((run) => prologueCoachTier(background, chosenYears(run)))
      expect(rungs.filter((r) => r === cheap).length, background).toBeGreaterThan(0)
      expect(rungs.filter((r) => r === dear).length, background).toBeGreaterThan(0)
    }
  })

  it('⚠⚠ THE DEFECT HE FOUND IN PLAY CANNOT RECUR – no middle family reaches high, whatever it spends', () => {
    // «карьера за 25к начала у меня с 15к на руках и тренером high тира». The old rule was an even
    // fifth of weighted `teaching` and knew nothing about the family, so the dearest branch of the
    // card table handed a middle family the same rung a wealthy one got.
    for (const run of everyRun('middle')) {
      expect(['budget', 'middle']).toContain(prologueCoachTier('middle', chosenYears(run)))
    }
    // ...and the SAME childhood on a wealthy origin does reach it, which is what makes the bound mean
    // something rather than being a cap nobody could have hit.
    expect(prologueCoachTier('wealthy', DEAREST.years)).toBe('high')
  })

  it('⭐ the branch cut is the ORDINARY childhood`s own teaching – no threshold was chosen', () => {
    // `medianChildhood()` is the anchor `childhoodWalk` normalises the level against, and its
    // teaching is flat 0.5, so this is where «an ordinary amount of coaching» is already defined.
    const flatAt = (teaching: number) =>
      PROLOGUE_CARDS.map((c) => ({ age: c.age, practice: 0.5, teaching, focus: 'general' as const }))
    for (const background of BACKGROUNDS) {
      const [cheap, dear] = PROLOGUE_COACH_LADDER[background]
      expect(prologueCoachTier(background, flatAt(0.49)), background).toBe(cheap)
      expect(prologueCoachTier(background, flatAt(0.5)), background).toBe(dear)
      expect(prologueCoachTier(background, flatAt(0.51)), background).toBe(dear)
      expect(prologueCoachTier(background, flatAt(0)), background).toBe(cheap)
      expect(prologueCoachTier(background, flatAt(1)), background).toBe(dear)
    }
  })

  it('...weighted by the year, so the thirteenth counts for more than the fifth', () => {
    const flat = PROLOGUE_CARDS.map((c) => ({ age: c.age, practice: 0.5, teaching: 0, focus: 'general' as const }))
    expect(weightAt(13)).toBeGreaterThan(weightAt(5))
    // ⭐ THE SAME FOUR YEARS OF GOOD TEACHING, BOUGHT LATE OR EARLY. Late crosses the cut and early
    // does not – a family that found the money at ten arrives with a coach, one that spent it on a
    // six-year-old does not, which is what actually happens.
    const late4 = flat.map((y) => (y.age >= 10 ? { ...y, teaching: 1 } : y))
    const early4 = flat.map((y) => (y.age <= 8 ? { ...y, teaching: 1 } : y))
    expect(prologueCoachTier('working', late4)).toBe('budget')
    expect(prologueCoachTier('working', early4)).toBe('self')
  })

  it('⚠ `elite` is unreachable from every origin – nine years does not buy an elite coach at fourteen', () => {
    for (const background of BACKGROUNDS) {
      for (const run of everyRun(background)) {
        expect(prologueCoachTier(background, chosenYears(run)), background).not.toBe('elite')
      }
    }
  })

  it('⚠ the rung reaches the world – `physioActive` and the opening coach follow it', () => {
    for (const background of BACKGROUNDS) {
      const w = createWorld('rung', profileFor(background), 'p', DEAREST)
      expect(w.profile.coachTier).toBe(prologueCoachTier(background, DEAREST.years))
      expect(typeof w.physioActive).toBe('boolean')
      expect(w.coachId === null || typeof w.coachId === 'string').toBe(true)
    }
    // ⭐ the same nine years, three origins, three different rungs – the ladder reaching the save
    const rungs = BACKGROUNDS.map((b) => createWorld('rung', profileFor(b), 'p', DEAREST).profile.coachTier)
    expect(new Set(rungs).size).toBe(3)
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

  it('⭐ the reference childhood is the flat number, and the ends are the named share of it', () => {
    const { referenceSpendCents: ref, spendSwingCents: swing, reserveSwingShare: share } = ECONOMY.prologue
    for (const background of BACKGROUNDS) {
      const base = STARTING_FUNDS_CENTS[background]
      expect(prologueFundsCents(background, ref), background).toBe(base)
      expect(prologueFundsCents(background, ref - swing), background).toBe(Math.round(base * (1 + share)))
      expect(prologueFundsCents(background, ref + swing), background).toBe(Math.round(base * (1 - share)))
    }
  })

  it('...and EVERY background moves by the same proportion – §2.4, the family is where she is FROM', () => {
    // the whole ruling in one assertion: two backgrounds walking the same childhood come off it at
    // the same MULTIPLE of their own reserve, never at the same number of cents.
    for (const run of everyRun()) {
      const ratios = BACKGROUNDS.map(
        (b) => prologueFundsCents(b, spentCents(run)) / STARTING_FUNDS_CENTS[b],
      )
      for (const r of ratios) expect(r).toBeCloseTo(ratios[0], 4)
    }
  })

  it('⚠ nothing reaches debt, and nothing crosses a background step of the price corridor', () => {
    const share = ECONOMY.prologue.reserveSwingShare
    // ⭐ THE CEILING ON THE SHARE IS THE GAME'S OWN. `wealthCorridor` puts one background step at
    // 0.25 of the middle centre (0.75 / 1.00 / 1.25), and §2.4 says the player picks where the
    // family is FROM – so a childhood able to move the reserve by a quarter could carry a family
    // across a class boundary. This is the bound, not a taste.
    const [wLo] = ECONOMY.wealthCorridor.working
    const [mLo, mHi] = ECONOMY.wealthCorridor.middle
    const step = (mLo + mHi) / 2 - (wLo + ECONOMY.wealthCorridor.working[1]) / 2
    expect(share).toBeLessThan(step)
    for (const background of BACKGROUNDS) {
      const base = STARTING_FUNDS_CENTS[background]
      for (const run of everyRun(background)) {
        const funds = prologueFundsCents(background, spentCents(run))
        expect(funds, background).toBeGreaterThan(0)
        expect(funds, background).toBeGreaterThanOrEqual(Math.round(base * (1 - share)))
        expect(funds, background).toBeLessThanOrEqual(Math.round(base * (1 + share)))
      }
      expect(prologueFundsCents(background, ECONOMY.prologue.referenceSpendCents), background).toBe(base)
    }
  })

  it('⭐⭐ the swing NARROWED, and by how much is the measurement – the poorest arrival is not sad', () => {
    // His words, 02.09: «По суммам минимальным как-то совсем грустно, особенно у рабочих и средних»,
    // and the aim «прийти как можно ближе к нашему коридору изначальному, который поигран и померян».
    // The shipped model divided the clamped spend by `startingFundsCents.middle`, which IS a share –
    // 0.399 – nobody had written down. This asserts the direction, not the value.
    const shipped = ECONOMY.prologue.spendSwingCents / STARTING_FUNDS_CENTS.middle
    expect(ECONOMY.prologue.reserveSwingShare).toBeLessThan(shipped)
    const poorest = Math.min(...everyRun('working').map((r) => prologueFundsCents('working', spentCents(r))))
    const before = Math.round(STARTING_FUNDS_CENTS.working * (1 - shipped))
    expect(poorest).toBeGreaterThan(before)
    expect(poorest / STARTING_FUNDS_CENTS.working).toBeGreaterThanOrEqual(0.75)
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
// ⭐⭐ ROUND 40 #4 – AND IT NOW READS HER REALISATION RATHER THAN HER ARRIVAL
// =================================================================================================
//
// THE OWNER, 02.09: «оставляем туман, у нас есть слова тренера – вот ими надо добавить понимание про
// базу и перспективы как раз в дополнение к туману». And 08.09: «что если мы здесь как раз будем
// говорить о той разнице в реализации, которой уже к этому моменту она достигла?» → «делай».
//
//     the BASE = what the YEARS DID     the ROOM = what she was BORN with
//
// ⚠⚠ THIS BLOCK WAS RE-AIMED, NOT LOOSENED, AND THE CLAIM IT WAS PROTECTING GOT STRONGER. Phase 7's
// acceptance criterion – «the same seed walked two ways gives two different base sentences and one
// room sentence» – used to be asserted with a floor of 25% because the arrival reading only moved on
// a measured 40.9%; it is now asserted on EVERY seed. What changed underneath is the two pins that
// were about the ARRIVAL's reference: the fresh-fourteen distribution and the shares over wizard
// careers. Neither says anything about realisation – a career with no prologue realises exactly
// nothing – so both are re-measured against the population the sentence is actually spoken to.
//
// ⚠⚠ MUTATION-VERIFIED. Every claim below was watched failing before it was believed:
//   * `handoverRealisation` dividing by the ASYMPTOTE (`world.potential[k]`) instead of by the room
//     -> round 34 #2b's small-ceiling arm goes red, and the acceptance criterion goes red on ~99% of
//     seeds. That is THE mutation of this block: it is round 34's own defect walking back in.
//   * the numerator counting her BIRTH BUILD (`world.skills[k]` instead of the difference) -> the
//     small-ceiling arm goes red naming the girl who gained nothing and read higher.
//   * the numerator subtracting the PRE-head-start build -> the birth-month arm goes red.
//   * either cut moved by a hundredth -> the measured-cuts arm goes red naming the quantile.
//   * `handoverBaseBand` returning `'level'` always -> the shares arm names the missing bands.
//   * a `behind` line put back to the shipped «She is behind most girls her age…» -> the copy arm
//     goes red; so does swapping either `ahead` or `level` line for a re-worded one.
//   * `coachBaseReadFor` drawing on `:prologue:read` (the room band's key) -> the independence test
//     goes red.
//   * a digit put into a base line -> the fog sweep goes red naming the band.
describe('⭐⭐ what the nine years added – the base band, and it is the half the childhood moves', () => {
  const order = { behind: 0, level: 1, ahead: 2 }

  /** ⭐ EVERY CHILDHOOD THE SHIPPED CARD TABLE CAN PRODUCE – the 32 `everyRun()` walks, which is the
   *  population this sentence is spoken to. ⚠ The Local Open questions are NOT a 33rd..64th run:
   *  `yearAt` builds a year out of the card's own pick and never reads `run.entries`, so an entry
   *  moves the money and the weekend she played and cannot move the arrival at all. */
  const CHILDHOODS = everyRun().map((r) => chosenYears(r))

  // ⚠⚠ THOUSANDS OF WORLDS, ONE `createWorld` – AND THE SUBSTITUTION IS PROVED, NOT ASSUMED. Building
  // a real career is ~8 ms (a cohort and a season of pre-history), which the distribution below cannot
  // afford; `handoverRealisation` reads `seed`, `profile`, `skills` and `potential` and nothing else,
  // so a template with those four replaced is the same input. The first arm pins that against real
  // careers, exactly as the arrival block pinned its own cheap world.
  const TEMPLATE = createWorld('base-template', DEFAULT_PROFILE, 'w')
  const worldFor = (seed: string, years: PrologueHandover['years']): WorldState => {
    const birth = startingSkills(seed, DEFAULT_PROFILE)
    const born = withHeadStart(birth, DEFAULT_PROFILE.birthMonth)
    return {
      ...TEMPLATE,
      seed,
      skills: years.length > 0 ? childhoodArrival(born, years) : born,
      potential: rollPotential(seed, birth),
    }
  }

  it('⚠ the cheap world IS the world `createWorld` builds – the distribution below rests on it', () => {
    for (let i = 0; i < 25; i++) {
      const seed = `sub-${i}`
      for (const prologue of [CHEAPEST, DEAREST]) {
        const real = createWorld(seed, profileFor('middle'), 'p', prologue)
        const cheap = worldFor(seed, prologue.years)
        expect(cheap.skills, seed).toEqual(real.skills)
        expect(handoverRealisation(cheap), seed).toBeCloseTo(handoverRealisation(real), 12)
        expect(handoverBaseBand(cheap), seed).toBe(handoverBaseBand(real))
      }
    }
  })

  // ⭐ THE CUTS ARE RE-MEASURED HERE RATHER THAN QUOTED (CLAUDE.md invariant 5). The two constants
  // are p20/p80 of the distribution this arm walks, so if the childhood, the potential roll or the
  // card table ever moves, the cuts stop meaning what their comment says and this is what notices.
  // ⚠ THE POPULATION IS THE CHILDHOODS THE TABLE CAN PRODUCE, not fresh fourteen-year-olds. That is
  // not a weakening of the old reference – it is the only one realisation HAS: with no prologue the
  // numerator is 0 by construction, so a wizard distribution is a spike at zero with no quantiles.
  it('⭐⭐ the cuts are the measured p20/p80 of realisation at fourteen', () => {
    const xs: number[] = []
    for (let i = 0; i < 500; i++) {
      for (const years of CHILDHOODS) xs.push(handoverRealisation(worldFor(`cut-${i}`, years)))
    }
    xs.sort((a, b) => a - b)
    const at = (q: number) => xs[Math.round(q * (xs.length - 1))]
    // The 3,200,000-childhood run (`tools/r40-handover-realisation-cuts.ts --seeds 100000`), which
    // reproduced to the thousandth at 64,000 and 640,000 as well.
    const MEASURED = { p05: -0.079, p20: -0.05, p50: -0.001, p80: 0.036, p95: 0.074 }
    for (const [name, want] of Object.entries(MEASURED)) {
      const q = Number(name.slice(1)) / 100
      expect(Math.abs(at(q) - want), `${name} of the table's childhoods is ${at(q).toFixed(4)}`).toBeLessThanOrEqual(0.004)
    }
    // ...and the shipped cuts really are two of its quantiles.
    expect(HANDOVER_BASE_CUTS.below, 'the lower cut is p20').toBeCloseTo(at(0.2), 2)
    expect(HANDOVER_BASE_CUTS.ahead, 'the upper cut is p80').toBeCloseTo(at(0.8), 2)
    // ⚠ AND THE LOWER ONE IS BELOW ZERO, which is the whole reason the bottom band was re-written: a
    // childhood can leave her under the build she started it with, and `behind` is that case. A cut
    // that drifted above zero would empty the band of exactly the girls the copy is about.
    expect(HANDOVER_BASE_CUTS.below, 'the bottom band is «the years added little», not «she is last»').toBeLessThan(0)
  })

  // ⭐ THE SHARES: a fifth, three fifths and a fifth, by construction of a p20/p80 cut.
  it('⭐ the three bands hold about a fifth, three fifths and a fifth of the childhoods the table makes', () => {
    const n: Record<string, number> = { behind: 0, level: 0, ahead: 0 }
    let total = 0
    for (let i = 0; i < 300; i++) {
      for (const years of CHILDHOODS) {
        n[handoverBaseBand(worldFor(`dist-${i}`, years))]++
        total++
      }
    }
    expect(n.behind / total, 'behind').toBeCloseTo(0.2, 1)
    expect(n.level / total, 'level').toBeCloseTo(0.6, 1)
    expect(n.ahead / total, 'ahead').toBeCloseTo(0.2, 1)
    // ⚠⚠ AND THE MIDDLE BAND HOLDS MORE THAN HALF, which is not a taste – it is what makes «She is
    // where most girls her age are» a TRUE sentence. The tertiles were measured at 37.6% and rejected
    // on exactly this when the arrival cuts were chosen; the same test binds the new pair.
    expect(n.level / total, 'the middle sentence says «most», so it has to be most').toBeGreaterThan(0.5)
  })

  // ⭐⭐⭐ THE ACCEPTANCE CRITERION, AND ROUND 40 #4 IS WHY IT IS NOW ABOUT EVERY SEED. Two childhoods,
  // one seed: different BASE sentences, the SAME room sentence. The second half is the potential rule
  // (§4) being kept, not a bug in the first.
  it('⭐⭐ the same girl, raised two ways: the base answers the childhood on EVERY seed', () => {
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
      // THE BASE IS NOT – and it is never the WRONG way round.
      expect(handoverRealisation(rich), seed).toBeGreaterThan(handoverRealisation(poor))
      if (handoverBaseBand(poor) !== handoverBaseBand(rich)) baseMoved++
    }
    // ⚠⚠ 100%, MEASURED – and it is the property the promo film could not get. The arrival reading
    // this replaced moved on 52% of seeds over the same corpus (200 seeds x 32 paired runs), so a
    // recorder that walked one seed down two childhoods drew the same sentence twice and was right to
    // report it. There is no floor here because there is nothing to leave room for.
    expect(baseMoved, 'the nine years reach the base sentence on every seed').toBe(N)
  })

  // ⚠⚠ THE ANTI-VACUITY ARM, AND IT IS NOT A FORMALITY. «The band differs» is satisfied by a band that
  // differs at random; the claim only means something if the SAME walk twice gives the same answer.
  it('⚠⚠ ...and two identical walks give the SAME band, so the arm above is about the childhood', () => {
    for (let i = 0; i < 60; i++) {
      const seed = `same-walk-${i}`
      const a = createWorld(seed, profileFor('middle'), 'p', CHEAPEST)
      const b = createWorld(seed, profileFor('middle'), 'p', CHEAPEST)
      expect(handoverBaseBand(a), seed).toBe(handoverBaseBand(b))
      expect(coachBaseReadFor(toSnapshot(a).handoverBaseBand, seed), seed).toBe(
        coachBaseReadFor(toSnapshot(b).handoverBaseBand, seed),
      )
      // ...and the dear walk against itself, so the arm is not vacuous at one end only.
      const c = createWorld(seed, profileFor('middle'), 'p', DEAREST)
      const d = createWorld(seed, profileFor('middle'), 'p', DEAREST)
      expect(handoverBaseBand(c), seed).toBe(handoverBaseBand(d))
    }
  })

  it('⚠ and the cheap childhood is never told it did more than the dear one', () => {
    // Monotone in the only quantity it reads: a richer childhood cannot produce a LOWER band.
    for (let i = 0; i < 150; i++) {
      const seed = `monotone-${i}`
      const poor = handoverBaseBand(createWorld(seed, profileFor('middle'), 'p', CHEAPEST))
      const rich = handoverBaseBand(createWorld(seed, profileFor('middle'), 'p', DEAREST))
      expect(order[rich], `${seed}: ${poor} -> ${rich}`).toBeGreaterThanOrEqual(order[poor])
    }
  })

  // =================================================================================================
  // ⭐⭐⭐ ROUND 34 #2b's TRAP, AND THE PROOF IT IS NOT RE-OPENED
  // =================================================================================================
  //
  // That round found the coach's headroom ladder computing `mean(skills) / mean(potential)` – the
  // birth build counted as achievement, divided by the asymptote – and the consequence was measured on
  // the owner's own save: «Close to her ceiling» arrived at 41.6% of realised headroom for the less
  // gifted girl and at 72.3% for the gifted one. THE VERDICT ARRIVED EARLIER FOR THE LESS TALENTED
  // GIRL. The fix was the subtraction on both terms, and this reading inherits it.
  describe('⚠⚠ the reading is the SHARE of her room, never the SIZE of it', () => {
    /** A girl with a chosen ROOM who has filled a chosen SHARE of it. ⚠ Her BIRTH BUILD cannot be
     *  handed in: `handoverRealisation` re-derives it from the seed (that is the point of it), so a
     *  build is CHOSEN BY WALKING SEEDS and everything else is arithmetic on top of the one it finds. */
    const meanOf = (s: WorldState['skills']) => SKILL_KEYS.reduce((n, k) => n + s[k], 0) / SKILL_KEYS.length
    const seedBornAt = (pick: 'high' | 'low'): string => {
      for (let i = 0; i < 4000; i++) {
        const seed = `born-${pick}-${i}`
        const mean = meanOf(startingSkills(seed, DEFAULT_PROFILE))
        if (pick === 'high' ? mean > 51 : mean < 45) return seed
      }
      throw new Error(`no seed in 4000 is born ${pick} – the arm is empty and the test below is vacuous`)
    }
    const filled = (seed: string, roomPerAxis: number, share: number): WorldState => {
      const birth = startingSkills(seed, DEFAULT_PROFILE)
      const born = withHeadStart(birth, DEFAULT_PROFILE.birthMonth)
      const skills = { ...born }
      const potential = { ...birth }
      for (const k of SKILL_KEYS) {
        potential[k] = birth[k] + roomPerAxis
        skills[k] = born[k] + share * roomPerAxis
      }
      return { ...TEMPLATE, seed, skills, potential }
    }

    it('⭐⭐ the same share of her own room reads the same, whatever the ceiling is', () => {
      for (const share of [-0.1, -0.02, 0.05, 0.2]) {
        const small = filled('ceil', 5, share)
        const large = filled('ceil', 24, share)
        expect(handoverRealisation(small), `share ${share}, small ceiling`).toBeCloseTo(share, 10)
        expect(handoverRealisation(large), `share ${share}, large ceiling`).toBeCloseTo(share, 10)
        expect(handoverBaseBand(small), `share ${share}`).toBe(handoverBaseBand(large))
      }
      // ⚠ THE MUTATION THIS ARM EXISTS FOR: divide by `world.potential[k]` (the asymptote) instead of
      // by `potential − born` and the two stop agreeing – at share −0.1 the small-ceiling girl reads
      // −0.010 against the big-ceiling girl's −0.034, i.e. BETTER for identical work. That is round 34
      // #2b's inversion in one line.
    })

    it('⭐⭐ a girl born high who gained nothing never out-reads a girl born low who gained a lot', () => {
      // The birth build is not an achievement, and this is that sentence as an assertion. Both girls
      // have the same room; the one BORN NEAR THE TOP of the band filled none of it and the one BORN
      // NEAR THE BOTTOM filled a fifth.
      const idle = filled(seedBornAt('high'), 20, 0)
      const worker = filled(seedBornAt('low'), 20, 0.2)
      expect(meanOf(startingSkills(idle.seed, DEFAULT_PROFILE)), 'the arm is not vacuous').toBeGreaterThan(
        meanOf(startingSkills(worker.seed, DEFAULT_PROFILE)) + 5,
      )
      // ⚠ THE ORDERING IS ASSERTED FIRST, ON PURPOSE: it is the claim this arm is named for, and an
      // assertion that fires before it would hide which property the mutation actually broke.
      expect(
        order[handoverBaseBand(worker)],
        'the girl who did nothing out-reads the girl who did the work',
      ).toBeGreaterThan(order[handoverBaseBand(idle)])
      expect(handoverRealisation(idle), 'nine years that added nothing realise nothing').toBeCloseTo(0, 10)
      expect(handoverRealisation(worker)).toBeCloseTo(0.2, 10)
      // ⚠ MUTATION: count `world.skills[k]` in the numerator instead of the difference and the girl
      // who did nothing reads 2.6 against the worker's 2.4 – her build is most of the number, so she
      // OUT-READS the girl who did the work. That is the defect round 34 #2b measured on his save.
    })
  })

  it('⚠ a career with no prologue realises exactly nothing, and that reads `level`', () => {
    for (let i = 0; i < 60; i++) {
      const seed = `wizard-${i}`
      const w = createWorld(seed, profileFor('middle'), 'w')
      expect(handoverRealisation(w), seed).toBeCloseTo(0, 10)
      expect(handoverBaseBand(w), seed).toBe('level')
    }
  })

  // ⚠ THE BIRTH MONTH ALMOST LEAVES THE READING, AND THE «ALMOST» IS THE CLAMP RATHER THAN THE MODEL.
  // `withHeadStart` runs BEFORE the childhood, so it stands in both terms of the numerator and
  // cancels – except where `childhoodArrival`'s `STARTING_SKILL_BAND` clamp truncates a January girl's
  // gain or a December girl's loss (measured: the clamp binds on 15.0% of attribute-childhoods at the
  // ends of the table). The arrival reading this replaces moved on 43.4% of seeds between the two
  // months; this is a fraction of that, and the assertion is the direction of travel rather than a
  // zero, because a zero is a claim the clamp makes false.
  it('⚠ her birthday is nearly out of this reading – it was 43.4% of seeds before', () => {
    let moved = 0
    const N = 200
    for (let i = 0; i < N; i++) {
      const seed = `month-${i}`
      const jan = createWorld(seed, { ...profileFor('middle'), birthMonth: 1 }, 'p', DEAREST)
      const dec = createWorld(seed, { ...profileFor('middle'), birthMonth: 12 }, 'p', DEAREST)
      if (handoverBaseBand(jan) !== handoverBaseBand(dec)) moved++
    }
    expect(moved / N, 'the birth month is most of the base band again').toBeLessThan(0.25)
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

  // =================================================================================================
  // ⭐⭐⭐ THE COPY ITSELF – TWO LINES REPLACED BY HIS, FOUR HELD BYTE-IDENTICAL (invariant 4)
  // =================================================================================================
  //
  // ⚠⚠ THE BOTTOM BAND'S TWO SENTENCES WERE REPLACED AND NOT ADDED TO. What stood there claimed a
  // COMPARISON AGAINST OTHER GIRLS – «She is behind most girls her age. That is the ground she starts
  // from.» / «There is ground to make up on the girls her age.» – which was true of a band that read
  // her arrival against the fresh-fourteen distribution and is not a thing realisation measures.
  // ⚠ THE OTHER FOUR ARE NOT AN AGENT'S TO TOUCH. The owner ruled on the bottom band, «давай смягчим
  // формулировку нижней банды» → variant B; he ruled on nothing else, and a wording change is the one
  // kind of diff no test catches unless the test spells the string out. This one does.
  it('⭐⭐ his two `behind` lines are shipped verbatim, and the old comparison is gone', () => {
    expect(COACH_BASE_READS.behind).toEqual([
      'Most of what she has, she was born with. The years added little to it.',
      'She comes with what she started with – the work has not reached it yet.',
    ])
    for (const line of COACH_BASE_READS.behind) {
      expect(/behind|ground to make up|most girls|girls her age/i.test(line), line).toBe(false)
    }
  })

  it('⭐⭐ `ahead` and `level` are byte-identical to what shipped – not one word moved with the band', () => {
    expect(COACH_BASE_READS.ahead).toEqual([
      'She is ahead of most girls her age. Somebody did the work.',
      'She is further along than the girls she will be playing.',
    ])
    expect(COACH_BASE_READS.level).toEqual([
      'She is where most girls her age are.',
      'She is level with the girls she will be playing.',
    ])
  })

  it('⚠ NOT ONE BASE LINE CARRIES A NUMBER, AND NONE OF THEM NAMES A CEILING', () => {
    for (const [band, lines] of Object.entries(COACH_BASE_READS)) {
      for (const line of lines) {
        expect(/\d/.test(line), `${band}: ${line}`).toBe(false)
        expect(/%|\$/.test(line), `${band}: ${line}`).toBe(false)
        // §5: «If he ever names a ceiling, the fog stops meaning anything.» The base band is a
        // statement about what the years did and may not smuggle one in.
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
    // ⚠ THE ALTERNATIVES ARE SWEPT TOO. The owner asked for options on one line (02.09) and every
    // one of them is a candidate for the screen, so a draft that broke a house rule or §2.3 would
    // be a landmine sitting in the table waiting for him to pick it.
    ...START_AGAIN_DRAFTS,
    spentLine(1_234_00),
    // ⭐ PHASE 11 – the one line the handover says about the weekends she played. Every clause of it
    // is swept, not just the fold: a table entry outside the sweep is copy outside the rules.
    PLAYED_COPY.sentence,
    ...PLAYED_COPY.counts,
    ...Object.values(PLAYED_COPY.best),
    playedLine([{ age: 10, index: 0, finish: 0, rounds: 3, wins: 3, outcome: 'won' }]),
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
    for (const line of [...Object.values(HANDOVER_COPY), ...Object.values(WALK_COPY), ...START_AGAIN_DRAFTS]) {
      expect(forbidden.test(line), line).toBe(false)
    }
  })

  // ⭐⭐ THE ONE LINE HE ASKED TO BE RE-THOUGHT (02.09): «по вордингу вроде всё ок, кроме "Raise
  // another child" – давай подумаем как еще можно написать». «another child» is the phrase a family
  // uses for a SECOND child, so on a screen that has just introduced the girl you raised it reads as
  // being offered a sibling rather than a different girl.
  //
  // ⚠ THE SHORTLIST IS DATA SO PICKING ONE IS A TABLE EDIT, and the shipped label has to BE one of
  // them – a shortlist the screen does not draw from is three sentences nobody is choosing between.
  // MUTATION-VERIFIED: setting `startAgain` to a fourth wording reddens the first arm; putting
  // «another child» back reddens the second.
  it('⭐⭐ «Raise another child» is gone, and what replaced it is one of the drafts on offer', () => {
    expect(START_AGAIN_DRAFTS).toContain(HANDOVER_COPY.startAgain)
    expect(START_AGAIN_DRAFTS.length, 'two or three, so it is a choice and not a rewrite').toBeGreaterThanOrEqual(2)
    for (const draft of [...START_AGAIN_DRAFTS, HANDOVER_COPY.startAgain]) {
      expect(/another child/i.test(draft), draft).toBe(false)
    }
    // ⚠⚠ RE-AIMED 02.09, AND THE REASON MATTERS. This asserted that EVERY draft names her
    // («girl|daughter|child|her|she»), which was right while all three drafts did. He then chose a
    // fourth that does not: «Raise another child – давай просто Start again и всё.»
    //
    // ⭐ The requirement was never that the LABEL names her – §2.3 says the CHOICE is «честный выбор
    // игрока», a choice about a child rather than about a mechanism – and on this screen the choice
    // is a PAIR. «Go on with her» carries the subject for both, the way a question carries it for
    // its answers. So the claim moves to the pair, where it was always true, and is not dropped.
    //
    // ⚠ NOT WEAKENED: the no-mechanism sweep two arms up is untouched and still reads every draft,
    // so «Start again» would still fail if it said reroll, odds, seed or restart.
    const pair = `${HANDOVER_COPY.goOn} ${HANDOVER_COPY.startAgain}`
    expect(/\b(girl|daughter|child|her|she)\b/i.test(pair), `the pair is not about her: ${pair}`).toBe(true)
  })

  it('the money is said once, and it is what the childhood COST', () => {
    expect(spentLine(28_150_00)).toBe('Nine years of it cost you $28,150.')
    // ...and no other string in the table carries a figure at all.
    for (const line of [...Object.values(HANDOVER_COPY), ...Object.values(WALK_COPY)]) {
      expect(/\d|\$/.test(line), line).toBe(false)
    }
  })
})
