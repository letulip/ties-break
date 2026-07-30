// =================================================================================================
// THE COACH AS LOAD MANAGER (docs/specs/coach-as-load-manager.md, engine/coachLoad.ts)
// =================================================================================================
//
// The owner, 30.07: «тогда у нашего self coach появятся ручки ... А остальные будут с автонастройкой и
// эффективностью зависимо от тира напрямую.»
//
// WHAT IS PINNED HERE, and the first two would each sink the slice on their own:
//
//   1. ⚠ THE ROUTING. Self-coached still stops the week and asks; hired answers the routine calls itself.
//      That is the product, and it is one `if` in `rollKnock` away from being wrong in either direction.
//   2. ⚠ W4'S CONTENT SURVIVES IT. `DEFAULT_PROFILE.coachTier` is 'middle', so if the routing were
//      unconditional the DEFAULT career would never see a knock dialog again - which hands the owner back
//      the complaint W4 was built to answer. The escalation zone is what stops that, so its rate is
//      asserted rather than assumed.
//   3. THE MECHANISM IS THE FOG, NOT AN ORACLE. The rule reads only observable state, and the rung enters
//      through `shownStamina`. A grep-level pin, because "the coach cannot see the future" is exactly the
//      kind of property a later convenience-fix quietly breaks.
//   4. BOTH DIRECTIONS OF ERROR. A cheap rung must be able to be wrong EITHER way (see coachLoad.ts) -
//      a single-signed error would be a tax pretending to be a model.
//   5. THE ADVICE IS ADVICE. `coachWarnsEntry` never blocks an entry, at any rung.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  coachEscalates,
  coachKnockCall,
  coachManagesLoad,
  coachWarnsEntry,
  strainOf,
  ESCALATE_BAND_MAX,
  PUSH_TOLERANCE,
  REPEAT_DOUBT,
  STRAIN_PER_REPEAT,
  type CoachLoadView,
} from '../src/engine/coachLoad'
import {
  availabilityStatus,
  closeTournament,
  coachLoadViewOf,
  createWorld,
  decideKnock,
  enterEvent,
  pendingKnock,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { COACH_TIERS } from '../src/engine/coach'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CoachTier } from '../src/shared/protocol'

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')

const view = (over: Partial<CoachLoadView> = {}): CoachLoadView => ({
  tier: 'middle',
  shownStamina: 55,
  condition: 70,
  playedWeeks: 0,
  confidence: 0.9,
  ...over,
})

/** Walk a career the way a player does, answering only what reaches him. */
function play(seed: string, tier: CoachTier, weeks: number, plan = WEEK_PLAN_PRESETS.balanced) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: tier })
  const rng = rngFromSeed(world.seed)
  world.plan = { ...plan }
  let taps = 0
  for (let w = 0; w < weeks; w++) {
    for (const e of world.season.filter((x) => x.week > world.week && x.week <= world.week + 4)) {
      if (world.entries.includes(e.id)) continue
      try {
        if (availabilityStatus(world, e).level === 'blocked') continue
        enterEvent(world, e.id)
      } catch {
        /* locked or unaffordable */
      }
    }
    tickWeek(world, rng)
    if (pendingKnock(world)) {
      decideKnock(world, 'rest')
      taps++
    }
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
  }
  const knocks = world.knockHistory.length + (world.knock ? 1 : 0)
  return { world, taps, knocks, handled: knocks - taps }
}

// =================================================================================================
// 1. ⚠ THE ROUTING
// =================================================================================================

describe('the routing: who answers the knock', () => {
  it('self-coached is the only rung the parent holds the knobs on', () => {
    expect(coachManagesLoad('self')).toBe(false)
    for (const tier of COACH_TIERS.filter((t) => t !== 'self')) {
      expect(coachManagesLoad(tier), tier).toBe(true)
    }
  })

  it('⚠ SELF-COACHED: every knock reaches the parent, and none is answered for him', () => {
    // The half the owner asked for in his own words: «у нашего self coach появятся ручки».
    const { taps, knocks, handled } = play('routing-self', 'self', 156, WEEK_PLAN_PRESETS.grind)
    expect(knocks, 'three seasons of grinding must produce knocks').toBeGreaterThan(0)
    expect(handled, 'nobody may answer for a self-coached parent').toBe(0)
    expect(taps).toBe(knocks)
  })

  it('⚠ HIRED: the coach answers the routine ones himself, and the week does not stop', () => {
    const { taps, knocks, handled } = play('routing-hired', 'elite', 156, WEEK_PLAN_PRESETS.grind)
    expect(knocks, 'the fixture must produce knocks').toBeGreaterThan(0)
    expect(handled, 'an elite coach must handle most of them alone').toBeGreaterThan(taps)
  })

  it('⚠ AND W4 SURVIVES ON THE DEFAULT CAREER, which is the one that could have been gutted', () => {
    // `DEFAULT_PROFILE.coachTier` is 'middle'. If the routing were unconditional, a brand-new career would
    // never see the knock dialog again - and W4 exists because the owner complained that training weeks
    // «просто скипались». So the default career MUST still be asked something.
    expect(DEFAULT_PROFILE.coachTier, 'the premise of this test').not.toBe('self')
    const { taps, knocks } = play('routing-default', DEFAULT_PROFILE.coachTier, 156, WEEK_PLAN_PRESETS.grind)
    expect(knocks).toBeGreaterThan(0)
    expect(taps, 'the default career must still be asked about her body').toBeGreaterThan(0)
  })

  it('the escalation ladder: a cheaper coach interrupts you MORE', () => {
    // THE SECOND THING THE RUNG SELLS, and the one the spec did not ask for because the mechanism did not
    // exist when it was written: "buying your attention back" is a number.
    //
    // Asserted as a TREND over the whole ladder rather than rung-by-rung: the escalation zone is driven by
    // `axisConfidence`, which ramps with tenure and evidence, so adjacent rungs can tie on a given seed.
    // What may never happen is the ladder running backwards end to end.
    const taps = COACH_TIERS.map((t) => play(`escal-${t}`, t, 208).taps)
    const self = taps[0]
    const budget = taps[1]
    const elite = taps[taps.length - 1]
    expect(self, 'self-coached is asked about all of them').toBeGreaterThan(budget)
    expect(budget, 'a budget coach must ask more often than an elite one').toBeGreaterThan(elite)
  })

  it('a knock the coach answered still costs, still shows, and still owns the week', () => {
    // The event may not vanish with the dialog. Same three consequences as a parent's answer.
    const world = createWorld('coach-answer', { ...DEFAULT_PROFILE, coachTier: 'elite' })
    const rng = rngFromSeed(world.seed)
    world.plan = { ...WEEK_PLAN_PRESETS.grind }
    let seen = false
    for (let w = 0; w < 208 && !seen; w++) {
      tickWeek(world, rng)
      if (pendingKnock(world)) {
        decideKnock(world, 'rest')
        continue
      }
      const k = world.knock
      if (k === null || k.choice === null) continue
      seen = true
      // the FEED says what was decided, in his voice
      const said = world.events.filter((e) => e.week === k.sinceWeek).map((e) => e.text).join(' | ')
      expect(said, 'the coach has to say what he did').toMatch(/coach/i)
      // ...and the week he governs really carries it into the story
      world.week = k.sinceWeek + 1
      const snap = toSnapshot(world)
      expect(snap.diary.facts.knockChoice, 'the governed week must carry the choice').toBe(k.choice)
    }
    expect(seen, 'the fixture has to reach a coach-answered knock').toBe(true)
  })
})

// =================================================================================================
// 2. ⚠ THE MECHANISM IS THE FOG, NOT AN ORACLE
// =================================================================================================

describe('the mechanism: what he is allowed to know', () => {
  it('⚠ THE RULE READS NO FUTURE AND NO TRUTH – a grep-level pin, on purpose', () => {
    // The rejected implementation (spec §8) is the OBVIOUS one: the injury roll is deterministic given the
    // seed, so a coach could be made to know whether pushing actually breaks her. It must stay impossible
    // to reach from here, and the cheapest durable way to say that is that this module cannot see any of
    // the machinery it would need.
    const src = read('../src/engine/coachLoad.ts')
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    for (const forbidden of ['rngFromSeed', 'injuryTau', 'rollInjury', 'potential', 'WorldState', 'world.']) {
      expect(code, `coachLoad must not reach for ${forbidden}`).not.toContain(forbidden)
    }
    // and it takes nothing but the narrow view - one import, of types
    expect(code).toContain("from '../shared/protocol'")
  })

  it('the call is a pure function of the view: same inputs, same answer, every time', () => {
    const v = view({ condition: 52, playedWeeks: 2 })
    const first = coachKnockCall(v, false)
    for (let i = 0; i < 50; i++) expect(coachKnockCall(v, false)).toBe(first)
  })

  it('⚠ BOTH DIRECTIONS: a misread HIGH pushes what should be rested, a misread LOW rests what could be pushed', () => {
    // The property that makes this a model of ignorance rather than a penalty. Same girl, same week; only
    // what the coach BELIEVES about her differs, and the two beliefs give opposite answers.
    const truth = 55
    const v = (shownStamina: number) => view({ shownStamina, condition: 46, playedWeeks: 0 })
    expect(strainOf(v(truth), false), 'the fixture must sit near the flip').toBeCloseTo(54, 0)
    expect(coachKnockCall(v(truth - 12), false), 'reads her frail -> rests').toBe('rest')
    expect(coachKnockCall(v(truth + 12), false), 'reads her tough -> pushes').toBe('push')
  })

  it('the threshold is her believed robustness, with no free parameter', () => {
    // PUSH_TOLERANCE is 1.0 - "rest when the strain exceeds what he thinks she can carry". If a later pass
    // reintroduces a factor, this says so out loud rather than letting the rule drift into taste.
    expect(PUSH_TOLERANCE).toBe(1)
    const v = view({ shownStamina: 60, condition: 41, playedWeeks: 0 }) // strain 59 < 60
    expect(coachKnockCall(v, false)).toBe('push')
    const v2 = view({ shownStamina: 60, condition: 39, playedWeeks: 0 }) // strain 61 > 60
    expect(coachKnockCall(v2, false)).toBe('rest')
  })

  it('a repeat weighs on the call but does not force the parent into it', () => {
    // The first draft escalated every repeat at every rung, which flattened the whole ladder (see
    // REPEAT_DOUBT). It must still WEIGH - knock.ts prices it at 3.0 tau against 2.2 - so a repeat on an
    // otherwise identical week moves the call towards rest, and a coach who knows her can still handle it.
    const v = view({ shownStamina: 60, condition: 70, playedWeeks: 0 })
    expect(strainOf(v, true) - strainOf(v, false)).toBe(STRAIN_PER_REPEAT)
    // ...and an elite coach can absorb one rather than always passing it up
    const sure = view({ confidence: 0.99, shownStamina: 60, condition: 90, playedWeeks: 0 })
    expect(coachEscalates(sure, true), 'a sure coach handles even a repeat').toBe(false)
    // ...while a blurry one wants the parent
    const unsure = view({ confidence: 0.3, shownStamina: 60, condition: 38, playedWeeks: 0 })
    expect(coachEscalates(unsure, true)).toBe(true)
  })

  it('the escalation zone is his own uncertainty, and it closes as he learns her', () => {
    const near = { shownStamina: 60, condition: 40, playedWeeks: 0 } // strain 60, right on the flip
    expect(coachEscalates(view({ ...near, confidence: 0 }), false), 'blind -> asks').toBe(true)
    expect(coachEscalates(view({ ...near, confidence: 1 }), false), 'certain -> decides').toBe(false)
    // the widths are the documented arithmetic, not a feeling
    expect(ESCALATE_BAND_MAX).toBeGreaterThan(0)
    expect(REPEAT_DOUBT).toBeGreaterThan(1)
  })
})

// =================================================================================================
// 3. THE ADVICE IS ADVICE
// =================================================================================================

describe('the entry advice', () => {
  it('⚠ NEVER BLOCKS – eligible stays true at every rung, however tired she is', () => {
    // "The parent may push" is a standing rule and the doctor's veto is its single exception. A coach's
    // opinion is not a second one.
    for (const tier of COACH_TIERS) {
      const world = createWorld('advice-block', { ...DEFAULT_PROFILE, coachTier: tier })
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 8; i++) tickWeek(world, rng)
      world.condition = 30 // tired, but well above the medical floor
      const snap = toSnapshot(world)
      for (const e of snap.upcoming) {
        if (e.coachCaution === undefined) continue
        expect(e.eligible, `${tier}: a coach's opinion must not lock a card`).toBe(true)
        expect(e.ineligibleReason, `${tier}`).toBeUndefined()
      }
    }
  })

  it('only a HIRED coach has an opinion – a self-coached career gets no line', () => {
    const world = createWorld('advice-self', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 8; i++) tickWeek(world, rng)
    world.condition = 20
    for (const e of toSnapshot(world).upcoming) {
      expect(e.coachCaution, 'nobody is being paid to have a view').toBeUndefined()
    }
  })

  it('he warns on a tired girl and stays quiet on a fresh one', () => {
    const floor = ECONOMY.availability.minConditionToEnter.j30
    expect(coachWarnsEntry(view({ condition: floor - 10 }), floor)).toBe(true)
    expect(coachWarnsEntry(view({ condition: floor + 40 }), floor)).toBe(false)
  })

  it('what he believes about her scales the margin – the fog reaches entries too', () => {
    // A coach who thinks she is tough waves her onto a plane an accurate one would not.
    const floor = 40
    const tough = view({ shownStamina: 90 })
    const frail = view({ shownStamina: 25 })
    // a condition where the two disagree exists, which is the whole claim
    const disagree = [...Array(60).keys()].map((c) => c + 20).filter(
      (c) => coachWarnsEntry({ ...tough, condition: c }, floor) !== coachWarnsEntry({ ...frail, condition: c }, floor),
    )
    expect(disagree.length, 'his read must be able to change the advice').toBeGreaterThan(0)
  })

  it('the copy obeys the app rules: short dash only, no Cyrillic, third person', () => {
    const world = createWorld('advice-copy', { ...DEFAULT_PROFILE, coachTier: 'budget' })
    const rng = rngFromSeed(world.seed)
    const said = new Set<string>()
    for (let i = 0; i < 60; i++) {
      tickWeek(world, rng)
      world.condition = Math.max(16, 60 - i)
      for (const e of toSnapshot(world).upcoming) if (e.coachCaution) said.add(e.coachCaution)
      while (world.pendingTournament) {
        if (!world.pendingTournament.finished) skipTournament(world)
        closeTournament(world)
      }
      if (pendingKnock(world)) decideKnock(world, 'rest')
    }
    expect(said.size, 'the sweep must actually produce lines').toBeGreaterThan(0)
    for (const line of said) {
      expect(line, `long dash in "${line}"`).not.toContain('—')
      expect(line, `Cyrillic in "${line}"`).not.toMatch(/[Ѐ-ӿ]/)
      expect(line, `second person in "${line}"`).not.toMatch(/\byou\b/i)
    }
  })
})

// =================================================================================================
// 4. THE VIEW THE WORLD HANDS HIM
// =================================================================================================

describe('coachLoadViewOf', () => {
  it('condition is EXACT and stamina is not – the deliberate asymmetry', () => {
    const world: WorldState = createWorld('view-1', { ...DEFAULT_PROFILE, coachTier: 'budget' })
    world.condition = 63
    const v = coachLoadViewOf(world)
    expect(v.condition, 'the condition bar is printed for the player, so he can read it too').toBe(63)
    // his stamina estimate is a belief: inside the plausible range, and not asserted equal to the truth
    expect(v.shownStamina).toBeGreaterThanOrEqual(0)
    expect(v.shownStamina).toBeLessThanOrEqual(100)
    expect(v.confidence).toBeGreaterThanOrEqual(0)
    expect(v.confidence).toBeLessThanOrEqual(1)
  })

  it('a better rung knows her better – the fog IS the ladder', () => {
    // The spec's §8 claim, end to end: the same girl in the same week, read by five different coaches.
    const conf = COACH_TIERS.map((tier) => {
      const world = createWorld('view-fog', { ...DEFAULT_PROFILE, coachTier: tier })
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 104; i++) {
        tickWeek(world, rng)
        if (pendingKnock(world)) decideKnock(world, 'rest')
        while (world.pendingTournament) {
          if (!world.pendingTournament.finished) skipTournament(world)
          closeTournament(world)
        }
      }
      return coachLoadViewOf(world).confidence
    })
    expect(conf[0], 'self-coached reads her worst').toBeLessThan(conf[conf.length - 1])
    for (let i = 1; i < conf.length; i++) {
      expect(conf[i], `${COACH_TIERS[i]} must not read her worse than ${COACH_TIERS[i - 1]}`).toBeGreaterThanOrEqual(conf[i - 1])
    }
  })
})
