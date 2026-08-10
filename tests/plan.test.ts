import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  DAY_CAPACITY_FREE,
  DAY_CAPACITY_SCHOOL,
  PLAN_DAYS,
  PLAN_MAX_SESSIONS,
  PLAN_MIN_SESSIONS,
  doubledDays,
  doublingShare,
  planFromWeek,
  planSessions,
  planShapeError,
  planTrainPct,
  planWeek,
  resolveWeek,
  sessionCounts,
  sessionDays,
  sessionsForPlan,
} from '../src/engine/plan'
import {
  SESSION_AIM,
  SKILL_KEYS,
  aimWeights,
  growWeek,
  trainFactor,
  type KidSkills,
} from '../src/engine/development'
import {
  KNOCK_PARTS,
  drawKnock,
  knockChance,
  knockPartWeights,
  type KnockWorldView,
} from '../src/engine/knock'
import { coachHoursForPlan } from '../src/engine/coach'
import { restRecoveryBonus, SAVE_SCHEMA_VERSION } from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed } from '../src/engine/rng'
import { WEEK_PLAN_PRESETS, SESSION_KINDS, type SessionKind, type WeekPlan } from '../src/shared/protocol'

// =================================================================================================
// THE WEEK IS THE PLAN (v47, docs/specs/training-dials.md) – the four invariants this slice can break
// =================================================================================================
//
// This file is written against the four properties the spec names, in the order the wave brief ranks
// them by danger. The RNG half of invariant 1 lives in tests/condition.test.ts's B1 block, beside the
// pins it has to be read against; everything else is here.
//
//   1. RNG input-independence – the plan is a PLAYER CHOICE, so nothing about which days he ticks may
//      change how many draws are taken or in what order. §5 below proves the knock's part draw did not
//      move; B1 in condition.test.ts proves the MAIN stream did not.
//   2. The migration is byte-identical – §2.
//   3. Emphasis REDISTRIBUTES a fixed weekly rate, never adds one – §3.
//   4. A whole week of one thing is legal, and no channel special-cases it – §4.

const FIXTURES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const loadFixture = (v: number): unknown => JSON.parse(readFileSync(`${FIXTURES}/v${v}.json`, 'utf8'))

/** A week of `n` ordinary practice sessions, laid out exactly as the migration lays one out. */
function generalWeek(n: number): SessionKind[][] {
  const days = new Set(sessionDays(n))
  const out: SessionKind[][] = []
  for (let d = 0; d < PLAN_DAYS; d++) out.push(days.has(d) ? ['general'] : [])
  return out
}

/** `n` sessions of ONE kind, one a day, Monday first – §5's "whole week of one thing". */
function monoWeek(kind: SessionKind, n: number): SessionKind[][] {
  const out: SessionKind[][] = []
  for (let d = 0; d < PLAN_DAYS; d++) out.push(d < n ? [kind] : [])
  return out
}

const SKILLS: KidSkills = { serve: 50, ret: 47, composure: 44, stamina: 52, groundstrokes: 49 }
const POTENTIAL: KidSkills = { serve: 72, ret: 70, composure: 68, stamina: 75, groundstrokes: 71 }

function grow(plan: WeekPlan, over: Partial<Parameters<typeof growWeek>[0]> = {}): KidSkills {
  return growWeek({
    skills: SKILLS,
    potential: POTENTIAL,
    ageYears: 15.5,
    plan,
    coach: null,
    playStyle: 'all-court',
    matchesThisWeek: 0,
    seed: 'plan-test',
    week: 30,
    ...over,
  })
}

// =================================================================================================
// §1  THE SHAPE – seven days, five kinds, 4..6 sessions, and rest as the absence of a tick
// =================================================================================================

describe('§1 the plan is seven days of session kinds', () => {
  it('reads an absent `week` back as the week the calendar has been drawing all along', () => {
    // ⚠ THE LOAD-BEARING PROPERTY OF THE OPTIONAL FIELD. A `{ train, rest }` literal is not a hole –
    // it is the old week, and it has to expand to exactly what the migration writes into a save.
    for (const [train, sessions] of [[60, 4], [75, 5], [85, 6]] as const) {
      const week = planWeek({ train, rest: 100 - train })
      expect(planSessions(week)).toBe(sessions)
      expect(week).toEqual(generalWeek(sessions))
      expect(week.filter((d) => d.length === 0)).toHaveLength(PLAN_DAYS - sessions)
    }
  })

  it('does not clamp a legacy plan to 4..6 – train:100 still draws seven session days', () => {
    // The RNG-invariance guard pokes `train: 100` on purpose. `trainFactor` and `coachHoursForPlan`
    // both clamp on their own, and that IS the shipped behaviour; clamping here would be the reader
    // editing a career rather than describing it.
    expect(planSessions(planWeek({ train: 100, rest: 0 }))).toBe(7)
    expect(planSessions(planWeek({ train: 0, rest: 100 }))).toBe(0)
  })

  it('projects a ticked week back onto train/rest, and setPlan is the only writer of either', () => {
    expect(planTrainPct(4)).toBe(WEEK_PLAN_PRESETS.light.train)
    expect(planTrainPct(5)).toBe(WEEK_PLAN_PRESETS.balanced.train)
    expect(planTrainPct(6)).toBe(WEEK_PLAN_PRESETS.grind.train)
    for (const n of [4, 5, 6]) {
      const plan = planFromWeek(generalWeek(n))
      expect(plan.train + plan.rest).toBe(100)
      // ...and the projection round-trips through every legacy reader unchanged.
      expect(sessionsForPlan(plan.train)).toBe(n)
      expect(coachHoursForPlan(plan)).toBe(n)
    }
  })

  it('counts the kinds once, and rest is the absence of a tick rather than a sixth kind', () => {
    const week: SessionKind[][] = [['serve'], ['serve', 'fitness'], [], ['rally'], [], ['matchplay'], []]
    expect(sessionCounts(week)).toEqual({ general: 0, serve: 2, rally: 1, fitness: 1, matchplay: 1 })
    expect(planSessions(week)).toBe(5)
    // Nothing in the union is a rest kind – a day off is an empty array and there is nothing to paint.
    expect(SESSION_KINDS).not.toContain('rest')
  })

  it('refuses a shape the game cannot contain, and accepts every one it can', () => {
    expect(planShapeError(generalWeek(5))).toBeNull()
    expect(planShapeError(monoWeek('serve', 6))).toBeNull()
    expect(planShapeError([['serve', 'rally'], ['fitness', 'general'], ['matchplay'], [], [], [], []])).toBeNull()
    expect(planShapeError(generalWeek(3))).toMatch(/4 to 6/)
    expect(planShapeError(generalWeek(7))).toMatch(/4 to 6/)
    expect(planShapeError([['serve', 'serve', 'serve'], ['serve'], ['serve'], [], [], [], []])).toMatch(/more than 2/)
    expect(planShapeError([['nap'], ['serve'], ['serve'], ['serve'], [], [], []])).toMatch(/Unknown session kind/)
    expect(planShapeError([[], [], []])).toMatch(/7 days/)
  })

  it('moves a session it cannot double rather than dropping it, so the bill never changes', () => {
    // ⚠ THE PLAN OUTLIVES THE WEEK IT WAS BUILT IN. Three doubled days in July are still three doubled
    // days in September, when school takes the second session back – and the only thing school may take
    // away is the DOUBLING, never a session off the bill.
    const july: SessionKind[][] = [['serve', 'serve'], ['rally', 'rally'], ['fitness', 'fitness'], [], [], [], []]
    const september = resolveWeek(july, DAY_CAPACITY_SCHOOL)
    expect(planSessions(september)).toBe(planSessions(july))
    expect(sessionCounts(september)).toEqual(sessionCounts(july))
    expect(september.every((d) => d.length <= DAY_CAPACITY_SCHOOL)).toBe(true)
    expect(doubledDays(september)).toBe(0)
    // ...and a week that already fits is returned unchanged.
    expect(resolveWeek(generalWeek(5), DAY_CAPACITY_SCHOOL)).toEqual(generalWeek(5))
    expect(resolveWeek(july, DAY_CAPACITY_FREE)).toEqual(july)
  })

  it('measures doubling against what the week COULD have doubled, not against seven', () => {
    expect(doublingShare(generalWeek(6))).toBe(0)
    expect(doublingShare([['serve', 'serve'], ['rally', 'rally'], ['fitness', 'fitness'], [], [], [], []])).toBe(1)
    // six sessions can double three times; this one doubles once
    expect(
      doublingShare([['serve', 'serve'], ['rally'], ['fitness'], ['rally'], ['general'], [], []]),
    ).toBeCloseTo(1 / 3, 12)
    // Five sessions can double twice – the leftover odd session has no partner, so `floor`, not `ceil`.
    expect(doublingShare([['serve', 'serve'], ['rally', 'rally'], ['fitness'], [], [], [], []])).toBe(1)
    expect(doublingShare([])).toBe(0)
  })

  it('states the per-day limit the engine already believed', () => {
    expect(DAY_CAPACITY_SCHOOL).toBe(1)
    expect(DAY_CAPACITY_FREE).toBe(2)
    expect([PLAN_MIN_SESSIONS, PLAN_MAX_SESSIONS]).toEqual([4, 6])
  })
})

// =================================================================================================
// §2  THE MIGRATION PROOF – §12 criterion 8, and it is proved rather than asserted
// =================================================================================================

describe('§2 a career saved under the old single-number plan reads back as itself', () => {
  it('the migration writes the week the calendar was drawing – general sessions, no gym day', () => {
    const migrated = migrateSave(loadFixture(46))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    const week = migrated.plan.week!
    expect(week).toEqual(generalWeek(sessionsForPlan(migrated.plan.train)))
    // ⚠ THE DRAWN GYM DAY MIGRATES TO `general`, NOT `fitness` – it has never been simulated, so
    // promoting it on load would be the migration changing his game.
    expect(sessionCounts(week).fitness).toBe(0)
    expect(sessionCounts(week).general).toBe(sessionsForPlan(migrated.plan.train))
    // ...and it never invents a doubled day, which is why the summer change is the ruled one (§6).
    expect(doubledDays(week)).toBe(0)
  })

  it('a migrated week aims at EXACTLY one on every skill, at every session count', () => {
    // ⚠ THIS IS THE WHOLE OF THE BYTE-IDENTITY, AND `Object.is` IS THE POINT. `toBeCloseTo` would pass
    // on 0.9999999999999999 and that number moves a shipped career's skills in the seventh decimal –
    // invisible on screen, and a failed criterion 8. `general` aims at all five and the aim is
    // accumulated in integer units so the exactness is structural, not floating-point luck.
    for (let n = 0; n <= PLAN_DAYS; n++) {
      const w = aimWeights(generalWeek(n))
      for (const k of SKILL_KEYS) expect(Object.is(w[k], 1), `${n} sessions, ${k} = ${w[k]}`).toBe(true)
    }
    const migrated = migrateSave(loadFixture(46))
    for (const k of SKILL_KEYS) expect(Object.is(aimWeights(migrated.plan.week!)[k], 1)).toBe(true)
  })

  it('growWeek on the migrated plan is byte-identical to growWeek on the plan before it', () => {
    const migrated = migrateSave(loadFixture(46))
    const after = migrated.plan
    // The plan as v46 held it – the same career, without the field this slice added.
    const before: WeekPlan = { train: after.train, rest: after.rest }
    expect(after.week).toBeDefined()
    for (const age of [14.2, 15.5, 18.0, 22.5, 27.0, 31.0]) {
      expect(grow(after, { ageYears: age })).toEqual(grow(before, { ageYears: age }))
    }
  })

  it('...and so is every other channel the week is read through', () => {
    const migrated = migrateSave(loadFixture(46))
    const after = migrated.plan
    const before: WeekPlan = { train: after.train, rest: after.rest }
    expect(trainFactor(after)).toBe(trainFactor(before))
    expect(coachHoursForPlan(after)).toBe(coachHoursForPlan(before))
    expect(knockChance(63, after)).toBe(knockChance(63, before))
    expect(restRecoveryBonus(after.rest)).toBe(restRecoveryBonus(before.rest))
    // ...and the knock's part table is the SHIPPED array itself, not a renormalised copy of it.
    expect(knockPartWeights(after.week!)).toBe(KNOCK_PARTS)
  })

  it('every fixture in the corpus migrates to a plan whose week is the one its scalar drew', () => {
    for (let v = 4; v <= SAVE_SCHEMA_VERSION; v++) {
      const migrated = migrateSave(loadFixture(v))
      const week = migrated.plan.week
      expect(week, `v${v} has no week`).toBeDefined()
      expect(planSessions(week!), `v${v}`).toBe(sessionsForPlan(migrated.plan.train))
    }
  })
})

// =================================================================================================
// §3  EMPHASIS REDISTRIBUTES A FIXED WEEKLY RATE. IT NEVER ADDS ONE.
// =================================================================================================

describe('§3 the rows decide where the week lands, never how much of it there is', () => {
  it('the weight vector always sums to the number of skills – its mean is exactly 1', () => {
    // ⚠ IF EMPHASIS WERE ADDITIVE IT WOULD BE A BUTTON MARKED "yes please", and knock.ts's standing
    // rule is that a branch which always ends better is not a decision. The vector renormalises, so
    // the week's RATE is conserved by construction rather than by tuning.
    const weeks: SessionKind[][][] = [
      generalWeek(4), generalWeek(5), generalWeek(6),
      monoWeek('serve', 6), monoWeek('rally', 6), monoWeek('fitness', 4), monoWeek('matchplay', 5),
      [['serve'], ['rally', 'fitness'], [], ['serve'], ['matchplay'], ['general'], []],
      [['serve', 'serve'], ['rally', 'rally'], ['fitness', 'fitness'], [], [], [], []],
    ]
    for (const week of weeks) {
      const w = aimWeights(week)
      const sum = SKILL_KEYS.reduce((t, k) => t + w[k], 0)
      expect(sum, JSON.stringify(week)).toBeCloseTo(SKILL_KEYS.length, 10)
    }
  })

  it('a week of pure serve work puts everything into serve and return and nothing anywhere else', () => {
    const w = aimWeights(monoWeek('serve', 6))
    expect(w.serve).toBeCloseTo(2.5, 12)
    expect(w.ret).toBeCloseTo(2.5, 12)
    expect(w.groundstrokes).toBe(0)
    expect(w.stamina).toBe(0)
    expect(w.composure).toBe(0)
    // ...and the block really is the first TWO shots of the point: a serve block with no return in it
    // would leave `ret` with no home anywhere in the five.
    expect(SESSION_AIM.serve).toEqual(['serve', 'ret'])
    // ...and `general` is the one kind that aims at everything, which is what makes it the migration's
    // honest answer: it IS the week every shipped career has been running.
    for (const k of SKILL_KEYS) expect(SESSION_AIM.general, k).toContain(k)
    expect(SESSION_AIM.general).toHaveLength(SKILL_KEYS.length)
  })

  it('aiming at a wing that is nearly full converts into almost nothing – and no rule says so', () => {
    // §4's second cost, the one he cannot see: growth is a share of REMAINING headroom, so the
    // self-limiting behaviour is already in the model and no new penalty term exists or is needed.
    const nearlyFull: KidSkills = { ...SKILLS, serve: POTENTIAL.serve - 0.1, ret: POTENTIAL.ret - 0.1 }
    const plan = planFromWeek(monoWeek('serve', 6))
    const out = grow(plan, { skills: nearlyFull })
    const gained = out.serve - nearlyFull.serve
    expect(gained).toBeGreaterThan(0)
    expect(gained).toBeLessThan(0.02)
    // ...while the same six sessions pointed at a wing with room convert into real progress.
    const roomy = grow(planFromWeek(monoWeek('fitness', 6)), { skills: nearlyFull })
    expect(roomy.stamina - nearlyFull.stamina).toBeGreaterThan(gained * 10)
  })

  it('six serve sessions and six mixed ones bank the SAME total rate, spent differently', () => {
    // The proof that this is a redistribution: the sum of (gain / headroom) over the five skills – the
    // week's rate, stripped of where it landed – is identical whatever the week aimed at.
    const rateSpent = (plan: WeekPlan): number => {
      const out = grow(plan)
      return SKILL_KEYS.reduce((t, k) => t + (out[k] - SKILLS[k]) / (POTENTIAL[k] - SKILLS[k]), 0)
    }
    const mixed = rateSpent(planFromWeek(generalWeek(6)))
    for (const kind of SESSION_KINDS) {
      expect(rateSpent(planFromWeek(monoWeek(kind, 6))), kind).toBeCloseTo(mixed, 10)
    }
  })
})

// =================================================================================================
// §4  A WHOLE WEEK OF ONE THING IS LEGAL – «его право», and nothing special-cases it
// =================================================================================================

describe('§4 a monomaniac week costs exactly what a mixed one costs', () => {
  it('the bill, the rate, the recovery and the knock chance are all identical', () => {
    // ⚠ §5's TABLE, ASSERTED ROW BY ROW. Six serve sessions in a school week: six days ticked, one off.
    const mixed = planFromWeek(generalWeek(6))
    const serve = planFromWeek(monoWeek('serve', 6))
    expect(coachHoursForPlan(serve)).toBe(coachHoursForPlan(mixed))          // the bill
    expect(trainFactor(serve)).toBe(trainFactor(mixed))                      // the rate
    expect(restRecoveryBonus(serve.rest)).toBe(restRecoveryBonus(mixed.rest)) // the recovery
    expect(knockChance(70, serve)).toBe(knockChance(70, mixed))              // the knock chance
    expect(serve.train).toBe(mixed.train)
    // ...and what DOES change is where the week landed, which is the feature.
    const a = grow(mixed)
    const b = grow(serve)
    expect(b.serve).toBeGreaterThan(a.serve)
    expect(b.stamina).toBeLessThan(a.stamina)
  })

  it('is legal for every one of the five kinds at every legal volume', () => {
    for (const kind of SESSION_KINDS) {
      for (const n of [4, 5, 6]) {
        expect(planShapeError(monoWeek(kind, n)), `${kind} x${n}`).toBeNull()
        const plan = planFromWeek(monoWeek(kind, n))
        expect(coachHoursForPlan(plan)).toBe(coachHoursForPlan(planFromWeek(generalWeek(n))))
        // no clamp is hit and no arithmetic goes out of range
        const out = grow(plan)
        for (const k of SKILL_KEYS) expect(Number.isFinite(out[k]), `${kind} ${k}`).toBe(true)
      }
    }
  })
})

// =================================================================================================
// §5  A KNOCK LANDS WHERE SHE WORKED – and it costs NO NEW DRAW
// =================================================================================================

describe('§5 the knock table is tilted by the week, at zero cost in draws', () => {
  const view = (plan: WeekPlan): KnockWorldView => ({
    seed: 'knock-aim',
    week: 12,
    condition: 40,
    plan,
    history: [],
  })

  /** Walk a weighted table cumulatively – `drawPart`'s own shape, re-spelled in the test so the
   *  reproduction below is independent of the implementation it is checking. */
  function partFor(u: number, table: readonly { part: string; weight: number }[]): string {
    let cum = 0
    for (const p of table) {
      cum += p.weight
      if (u < cum) return p.part
    }
    return table[table.length - 1].part
  }

  it('spends THREE draws off seed:knock:<week>, in that order, whatever the week contained', () => {
    // ⚠ THE SPEC'S CLAIM IS VERIFIED HERE RATHER THAN ASSUMED, and the verification is a reproduction:
    // three numbers are taken off the sub-stream by hand, and the knock `drawKnock` returns must be
    // rebuildable from exactly those three, in that order, for every week the player can build. A
    // fourth draw, a reordering, or a draw taken conditionally would all break the rebuild.
    for (const week of [
      generalWeek(4), generalWeek(6), monoWeek('serve', 6), monoWeek('fitness', 5),
      [['serve', 'rally'], ['fitness', 'matchplay'], ['general', 'serve'], [], [], [], []] as SessionKind[][],
    ]) {
      const plan = planFromWeek(week)
      const raw = rngFromSeed('knock-aim:knock:12')
      const arrival = raw()
      const repeatRoll = raw()
      const partRoll = raw()
      const knock = drawKnock(view(plan))
      // draw 1 decides arrival, against a chance that does not read the week at all
      expect(knock !== null, JSON.stringify(week)).toBe(arrival < knockChance(40, plan))
      if (knock) {
        // draw 2 is the repeat coin (no history here, so it decides nothing) and draw 3 is the part
        expect(repeatRoll).toBeGreaterThanOrEqual(0)
        expect(knock.part).toBe(partFor(partRoll, knockPartWeights(week)))
      }
    }
  })

  it('...and the arrival is the same coin under every week, which is the invariance half', () => {
    const arrived = new Set(
      SESSION_KINDS.map((kind) => drawKnock(view(planFromWeek(monoWeek(kind, 6)))) !== null),
    )
    expect(arrived.size).toBe(1)
  })

  it('an ordinary week draws through the SHIPPED table, the identical object', () => {
    // ⚠ THE IDENTITY RETURN IS LOAD-BEARING. The eight weights sum to 1.0 in decimal and not
    // necessarily in binary, so renormalising an untilted week could flip a boundary uniform into the
    // neighbouring part – a shipped career's knock moving for no reason anyone could see.
    for (const n of [4, 5, 6]) expect(knockPartWeights(generalWeek(n))).toBe(KNOCK_PARTS)
    expect(knockPartWeights([])).toBe(KNOCK_PARTS)
  })

  it('six weeks of serving develops a shoulder, and the table still sums to one', () => {
    const serve = knockPartWeights(monoWeek('serve', 6))
    const base = new Map(KNOCK_PARTS.map((p) => [p.part, p.weight]))
    const tilted = new Map(serve.map((p) => [p.part, p.weight]))
    for (const part of ['shoulder', 'elbow', 'wrist', 'lower back']) {
      expect(tilted.get(part)!, part).toBeGreaterThan(base.get(part)!)
    }
    for (const part of ['knee', 'ankle', 'hip', 'foot']) {
      expect(tilted.get(part)!, part).toBeLessThan(base.get(part)!)
    }
    // A tilt REDISTRIBUTES where a knock lands; it never changes how often one arrives.
    expect(serve.reduce((t, p) => t + p.weight, 0)).toBeCloseTo(1, 12)
    const fitness = knockPartWeights(monoWeek('fitness', 6))
    expect(new Map(fitness.map((p) => [p.part, p.weight])).get('knee')!).toBeGreaterThan(base.get('knee')!)
  })

  it('leaves knockChance alone – aiming a week cannot make her pick more things up', () => {
    for (const kind of SESSION_KINDS) {
      expect(knockChance(55, planFromWeek(monoWeek(kind, 6)))).toBe(
        knockChance(55, planFromWeek(generalWeek(6))),
      )
    }
  })
})
