// WAVE 5 T5 – «COOL HEAD»: THE BOUNDED COMPOSURE WALK, AND THE ONE PLACE THE SEAT TOUCHES A SKILL.
//
// The spec (docs/specs/the-psychologists-year-2026-09.md §2, the Cool head row) and the wave-5
// brief's §2 T5: on a week the family is paying a psychologist whose chosen year is `'coolhead'`,
// `ECONOMY.psychologist.coolheadPerSeason[rung] / 52` is added to `composure`, toward HER OWN CEILING
// and never past it, with EXACTLY ZERO effect at it. The term is its own named summand beside the
// week's training growth, inside `growWeek` – never a change to the plan, the rate, the aim, the
// headroom or the luck draw.
//
// WHAT THIS FILE IS ORGANISED AROUND, in the order the risks rank:
//   §A  the term itself – the rate, the rungs, the clamp, and ZERO AT THE CEILING pinned as a zero
//   §B  the term inside `growWeek` – the four physical skills untouched, the out-of-scope list held
//   §C  ⚠⚠ THE DRAW SEQUENCE. The term lives inside a function that DRAWS (`seed:growth:<week>`), so
//       the sharpest risk in the task is a growth pass whose draws shifted by one – which would move
//       every career in existence, silently. Proven with a key recorder AND with the four physical
//       skills held byte-identical across the arms: a moved or consumed draw moves all five.
//   §D  the training-only control arm IN CODE, key by key over a walked career – four paired walks
//   §E  the stand-down in both halves – a college freeze and a booked family week – and the resume
//   §F  the receipt: whose crossing it is, and the honesty that decides it
//
// TWELVE MUTATION ARMS, TWELVE RED, NO NULLS – every one applied and undone by the INVERSE edit
// (never `git checkout`), with every touched file's md5 asserted back to pristine afterwards, and the
// control green first (27/27 here, 24/24 on the re-aimed T2 file). What each red SAID:
//
//   ARM 1  `coolheadGain` returns the rate with NO own-ceiling clamp.                     **7 RED**
//          «rung 0: she is at her ceiling: expected 0.028846… to be +0» – plus the above-ceiling
//          case, the lands-ON-it case, the inside-`growWeek` ceiling case, the measured residual
//          (0.066 against the 0.007 bound) and §F's silence at the ceiling.
//   ARM 2  the clamp keeps `Math.min` but drops `Math.max(0, …)`.                         **1 RED**
//          «rung 0: already past her ceiling: expected -7.5999… to be +0» – the veteran case, and
//          the ONE case that separates "zero at the ceiling" from "never negative past it".
//   ARM 3  the SEASON rate spent every week (× 52).                                       **3 RED**
//          «expected 1.5 to be close to 0.0288…», «a held season IS the season rate: expected 40 to
//          be close to 3.5», and §E's comparative arm.
//   ARM 4  the term applied to EVERY skill (`isPhysicalSkill` no longer asked).           **5 RED**
//          «rung 0: serve is not his to move», «exactly the non-physical one: expected ['serve',
//          'ret', 'composure', …] to deeply equal ['composure']», and §D's positive control grew a
//          fourth moved key (`peakPhysical` – the physical mean had moved).
//   ARM 5  `psychologistWorkingRung` gated on `psychologistHired` instead of the billing
//          predicate – T4's own defect, posed here one focus over.                        **5 RED**
//          «frozen – no rung is working: expected 2 to be undefined», «booked off … expected 1 to be
//          undefined», and BOTH stand-down key-hash walks.
//   ARM 6  the receipt fires on any week he works (`return gain > 0`).                     **2 RED**
//          «training had already crossed – not his line to claim: expected true to be false» and
//          «...and never a weekly status line: expected 52 to be less than or equal to 4» – the
//          sign-not-a-subscription claim, biting at exactly 52.
//   ARM 7a the term CONSUMES a draw before `luck` (one `rng()`, no new key).               **6 RED**
//          ⚠⚠ THE KEY LIST STAYED GREEN AND THE SKILLS WENT RED: «serve after 30 weeks of his year
//          on her head: expected 53.5834… to be 53.6324…». This is the arm that proves §C's second
//          case is not decoration – a key counter cannot see a consumed value, and four physical
//          skills held byte-identical can.
//   ARM 7b the term derives a key of its own (`seed:coolhead:<week>`).                     **2 RED**
//          «key for key, in order: expected [1243 keys] to deeply equal [1213]» – and the same red
//          in the short-circuit case, so both halves of the count-keys law are alive.
//   ARM 8  `coolheadPerSeason` = [1.5, 2.5, 2.5] – the top rung stops beating the middle. **3 RED**
//   ARM 9  the term fed INTO training's headroom instead of standing beside it.           **2 RED**
//          «rung 0: exactly the week's term: expected 0.028687… to be close to 0.028846…», and the
//          measured residual collapsed to 0 – which is precisely what tells "beside" from "into".
//   ARM 10 the receipt's `addEvent` never raised.                                          **2 RED**
//          «expected ['skills'] to deeply equal ['events', 'nextEventId', 'skills']» and «one to
//          three a year at the top rung: expected 0 to be greater than 0».
//
// AND TWO MORE ON THE ONE PIN T5 RE-AIMED, because growing a closed set is the builder's own
// responsibility to prove still closed – tests/wave5-psychologist-seat.test.ts's `ECONOMY.psychologist`
// key list, which T2 wrote, T4 grew by `recoverySlope` and this commit grows by `coolheadPerSeason`:
//
//   ARM 11  a `seatFareCents` key lands in the seat's block.                                **1 RED**
//           «expected ['coolheadPerSeason', …(4)] to deeply equal ['coolheadPerSeason', …(3)]».
//   ARM 11b the same key, AND the expected list grown to admit it – the edit a future builder makes
//           without thinking.                                                                **1 RED**
//           «ruling Б: expected ['seatFareCents'] to deeply equal []». ⚠ The two arms are needed
//           separately: the negative line sits BELOW the closed-set line, so ARM 11 never reaches it.
//
// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's, wave 4's and T2/T4's §B apparatus, verbatim.
// Every call is delegated to the real `rngFromSeed`, so any number this file measures is the engine's
// own; the mock exists only so §C can COUNT AND ORDER the keys the pass reached. Hoisted, because
// `vi.mock`'s factory is lifted above the imports.
import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'

const rngKeys = vi.hoisted(() => [] as string[])
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      rngKeys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import { createHash } from 'node:crypto'
import {
  coolheadCrossedAPoint,
  coolheadGain,
  growWeek,
  isPhysicalSkill,
  PHYSICAL_SKILL_KEYS,
  SKILL_KEYS,
  COOLHEAD_RECEIPT,
  type KidSkills,
} from '../src/engine/development'
import { createWorld, type WorldState } from '../src/engine/world'
import { growAndLive } from '../src/engine/world/phaseGrowth'
import { psychologistWorkingRung, psychologistWorksThisWeek } from '../src/engine/world/psychologist'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_IN_SEASON } from '../src/shared/dates'

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

type Seat = {
  hired: boolean
  rung?: 0 | 1 | 2
  focus?: 'coolhead' | 'recovery' | null
  /** a college freeze covering the whole walk */
  college?: boolean
  /** every week of the walk booked off */
  vacation?: number
}

/** A world at a professional age with the seat posed. ⚠ THE SEAT IS POKED AND THE HIRE IS NOT UNDER
 *  TEST HERE – `hirePsychologist`'s gate, its refusals and its ledger row are
 *  tests/wave5-psychologist-seat.test.ts's claims, walked there through the command. What T5 adds is
 *  arithmetic on a hired seat, so the seat is posed and the arithmetic is walked. */
function posed(seed: string, week: number, seat: Seat): WorldState {
  const world = createWorld(seed)
  world.week = week
  world.psychologistHired = seat.hired
  if (seat.rung !== undefined) world.psychologistRung = seat.rung
  world.psychologistFocus = seat.focus ?? null
  if (seat.college === true) {
    world.college = {
      fromWeek: week - 10,
      untilWeek: week + 200,
      doneWeek: null,
      years: [],
      pendingCallUp: null,
      pendingLeague: null,
    }
  }
  if (seat.vacation !== undefined) {
    // ⚠ FROM `week + 1`, BECAUSE `walkGrowth` INCREMENTS BEFORE IT GROWS – `tickWeek`'s own order.
    // Booking from `week` instead leaves the LAST week of the walk unbooked, which is a fixture that
    // measures a stand-down on eleven weeks and a working week on the twelfth while claiming twelve.
    world.vacations = Array.from({ length: seat.vacation }, (_, k) => ({
      week: week + 1 + k,
      packageId: 'beach',
      paidCents: 0,
    }))
  }
  return world
}

/** Walk `weeks` ticks of PHASE 4 ONLY – `world.week` forward one, then `growAndLive`, which is what
 *  `tickWeek` does at its step 3 (the week is incremented at the tick's first statement). Deliberately
 *  not a whole career week: this file's claims are about growth, and a full tick would let a changed
 *  composure reach the match engine and diverge the arms for reasons that are the FEATURE rather than
 *  the pin. */
function walkGrowth(world: WorldState, weeks: number): WorldState {
  const rng = rngFromSeed(`${world.seed}:walk`)
  for (let k = 0; k < weeks; k++) {
    world.week += 1
    growAndLive(world, rng)
  }
  return world
}

/** A hash per TOP-LEVEL KEY of the world – `tools/frozen-key-diff.ts`'s own instrument, brought
 *  in-process so a control arm can be compared key by key rather than on an end state (ruling K: a
 *  terminal diff is blind to a convergent change, and a composure walk toward a ceiling she reaches
 *  anyway is exactly that shape). */
function keyHashes(world: WorldState): Record<string, string> {
  const record = world as unknown as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const key of Object.keys(record).sort()) {
    out[key] = createHash('sha256').update(JSON.stringify(record[key] ?? null)).digest('hex').slice(0, 12)
  }
  return out
}

/** Which keys differ between two walks – named, never counted, so a red says what moved. */
function movedKeys(a: Record<string, string>, b: Record<string, string>): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...keys].filter((k) => a[k] !== b[k]).sort()
}

/** The week's term at a rung, from the constant rather than from a typed-out decimal. */
const perWeek = (rung: 0 | 1 | 2): number => ECONOMY.psychologist.coolheadPerSeason[rung] / WEEKS_IN_SEASON

/** A `growWeek` argument bundle with nothing unusual in it – an ordinary training week for a
 *  fifteen-year-old on the shipped plan, so every case below differs from the next in ONE field. */
function growArgs(world: WorldState, over?: Partial<Parameters<typeof growWeek>[0]>) {
  return {
    skills: world.skills,
    potential: world.potential,
    ageYears: 15,
    plan: world.plan,
    coach: null,
    playStyle: world.profile.playStyle,
    matchesThisWeek: 0,
    seed: world.seed,
    week: world.week,
    ...over,
  }
}

// =================================================================================================
// A. THE TERM – the rate, the rungs, the clamp, and the zero that is the spec's own bar
// =================================================================================================
describe('wave 5 T5 A – the composure term, and what bounds it', () => {
  it('⭐ the constant is the spec §2 row, and it is strictly increasing', () => {
    // ⚠ THE SOURCE IS THE SPEC AND THE NUMBERS ARE O5 PROPOSALS INSIDE A RULED SHAPE – T10 prices
    // them against a training-only arm. What is RULED and pinned here is the shape: three rungs,
    // increasing, read per season.
    expect(ECONOMY.psychologist.coolheadPerSeason, 'spec §2: +1.5 / +2.5 / +3.5 per held season').toEqual([
      1.5, 2.5, 3.5,
    ])
    const rates = ECONOMY.psychologist.coolheadPerSeason
    expect(rates[0] < rates[1] && rates[1] < rates[2], 'each rung strictly above the one below').toBe(true)
  })

  it('⭐⭐ a week is the season rate over 52, at every rung – and NOTHING at all with no rung', () => {
    // Far below the ceiling, so the clamp cannot be what is being measured.
    for (const rung of [0, 1, 2] as const) {
      expect(coolheadGain(50, 90, rung), `rung ${rung}: one week of the season rate`).toBeCloseTo(perWeek(rung), 12)
    }
    expect(coolheadGain(50, 90, undefined), 'no rung – not hired, another year, or stood down').toBe(0)
  })

  it('⭐⭐ the fraction genuinely accrues – `KidSkills` is plain `number` and `growWeek` rounds nothing', () => {
    // ⚠ MEASURED BEFORE THE MECHANIC WAS WRITTEN, because an integer skill would have made the whole
    // focus dead on arrival: 3.5/52 = 0.0673 a week truncates to nothing on every single week.
    let composure = 50
    for (let k = 0; k < WEEKS_IN_SEASON; k++) composure += coolheadGain(composure, 90, 2)
    expect(composure - 50, 'a held season at the top rung IS the season rate').toBeCloseTo(3.5, 10)
  })

  it('⭐⭐⭐ ZERO AT THE CEILING – as a zero, not as a small number, at every rung', () => {
    // The spec's own bar for this focus. `toBe(0)` and never `toBeCloseTo`: the claim is that the
    // work is finished, not that it is small.
    for (const rung of [0, 1, 2] as const) {
      expect(coolheadGain(72.4, 72.4, rung), `rung ${rung}: she is at her ceiling`).toBe(0)
    }
  })

  it('⭐⭐ ...and zero ABOVE it, which is a real world rather than a defensive flourish', () => {
    // `veteranPoise` pushes composure past `potential.composure` on a long career and nothing clamps
    // it (growWeek's decline branch: composure gains `d.veteranPoise` every week past the peak). A
    // term that read a negative headroom would take points OFF a veteran.
    for (const rung of [0, 1, 2] as const) {
      expect(coolheadGain(80, 72.4, rung), `rung ${rung}: already past her ceiling`).toBe(0)
    }
  })

  it('⭐⭐ the last week of the walk lands ON the ceiling and not past it', () => {
    const ceiling = 72.4
    const composure = ceiling - 0.01 // headroom smaller than a week's rate at every rung
    for (const rung of [0, 1, 2] as const) {
      expect(coolheadGain(composure, ceiling, rung), `rung ${rung}: the headroom, not the rate`).toBeCloseTo(0.01, 12)
      expect(composure + coolheadGain(composure, ceiling, rung), 'exactly her own ceiling').toBeCloseTo(ceiling, 12)
    }
  })

  it('⭐⭐ monotone in the rung below the ceiling, and equal – at zero – on it', () => {
    // ⚠ T10's BENCH OWNS MONOTONICITY AS A MEASURED CLAIM. What is asserted here is that the
    // ARITHMETIC CAN produce it, which is the half the builder is asked to answer now: a strictly
    // increasing constant through `min(rate, headroom)` is strictly increasing wherever the headroom
    // is not the binding term, and flat at 0 where it is.
    expect(coolheadGain(50, 90, 0) < coolheadGain(50, 90, 1)).toBe(true)
    expect(coolheadGain(50, 90, 1) < coolheadGain(50, 90, 2)).toBe(true)
    expect(coolheadGain(90, 90, 0) === coolheadGain(90, 90, 2), 'at the ceiling all three are finished').toBe(true)
  })
})

// =================================================================================================
// B. THE TERM INSIDE `growWeek` – one skill, and the out-of-scope list held as a pin
// =================================================================================================
describe('wave 5 T5 B – inside the weekly pass, and what it may not touch', () => {
  it('⭐⭐⭐ an absent field and an undefined one are the SAME WEEK – every existing call site is safe', () => {
    // `trainFactor`'s own promise, taken deliberately: «Defaults to 1, so every existing call site is
    // byte-identical and no shipped career's growth moves».
    const world = createWorld('t5-b-absent')
    const withoutField = growWeek(growArgs(world))
    const withUndefined = growWeek(growArgs(world, { coolheadRung: undefined }))
    expect(withUndefined, 'no field and an undefined field are one week').toEqual(withoutField)
  })

  it('⭐⭐⭐ ONE SKILL MOVES. The four physical ones are byte-identical at every rung', () => {
    const world = createWorld('t5-b-one-skill')
    const control = growWeek(growArgs(world))
    for (const rung of [0, 1, 2] as const) {
      const worked = growWeek(growArgs(world, { coolheadRung: rung }))
      for (const k of PHYSICAL_SKILL_KEYS) {
        expect(worked[k], `rung ${rung}: ${k} is not his to move`).toBe(control[k])
      }
      expect(worked.composure - control.composure, `rung ${rung}: exactly the week's term`).toBeCloseTo(
        coolheadGain(world.skills.composure, world.potential.composure, rung),
        12,
      )
    }
  })

  it('⭐⭐⭐ at the ceiling the whole week is byte-identical – the zero is a zero inside the pass too', () => {
    const world = createWorld('t5-b-ceiling')
    // Her ceiling is where she already stands: the focus has nothing left to buy.
    world.skills = { ...world.skills, composure: world.potential.composure }
    const control = growWeek(growArgs(world))
    for (const rung of [0, 1, 2] as const) {
      expect(growWeek(growArgs(world, { coolheadRung: rung })), `rung ${rung}: nothing at all`).toEqual(control)
    }
  })

  it('⚠ the residual, MEASURED rather than claimed away: the week she fills the last of her headroom', () => {
    // ⚠ THE HONEST LIMIT OF «NEVER PAST THE CEILING». His term clamps itself against the composure she
    // holds at the HEAD of the week – which is what makes it a pure function of three numbers the
    // caller also holds, and therefore what pays for the receipt with no stored state. So on the ONE
    // week her headroom is smaller than the week's rate, training's own gain still lands on top of a
    // term that has just filled the gap. It is bounded by `rate × headroom × luck × aim` on a headroom
    // already below 0.0673 – and training's rate is asymptotic (`peakRate` 0.0062 through the age,
    // plan, load, coach and match factors), never anywhere near 1.
    const world = createWorld('t5-b-residual')
    world.skills = { ...world.skills, composure: world.potential.composure - 0.001 }
    const over = growWeek(growArgs(world, { coolheadRung: 2 })).composure - world.potential.composure
    expect(over, 'his term stops at the ceiling; what is over it is training’s own asymptote').toBeLessThan(0.007)
    expect(over, '...and it is over it, which is why this case says so out loud').toBeGreaterThan(0)
    // And the control is what makes the attribution honest: training alone lands under the ceiling.
    expect(growWeek(growArgs(world)).composure).toBeLessThan(world.potential.composure)
  })

  it('⚠⚠ THE OUT-OF-SCOPE LIST, AS A PIN: no key added, no ceiling moved, no second spelling', () => {
    // The brief's own fence: «Anything that touches any other skill, or any ceiling, or `SKILL_KEYS`,
    // or `isPhysicalSkill`, or `veteranPoise`, or the age creep, is out of scope and is a finding».
    expect(SKILL_KEYS, 'APPEND-ONLY, and this wave appends nothing – it is a DRAW ORDER').toEqual([
      'serve',
      'ret',
      'composure',
      'stamina',
      'groundstrokes',
    ])
    expect(PHYSICAL_SKILL_KEYS, 'derived from the predicate, still the four').toEqual([
      'serve',
      'ret',
      'stamina',
      'groundstrokes',
    ])
    for (const k of SKILL_KEYS) {
      expect(isPhysicalSkill(k), `${k}: the predicate is still literally k !== 'composure'`).toBe(k !== 'composure')
    }
    // ⚠ THE TERM RIDES THAT PREDICATE RATHER THAN RE-SPELLING IT – proven behaviourally: the one skill
    // it moves is the one skill `isPhysicalSkill` refuses.
    const world = createWorld('t5-b-fence')
    const control = growWeek(growArgs(world))
    const worked = growWeek(growArgs(world, { coolheadRung: 2 }))
    const moved = SKILL_KEYS.filter((k) => worked[k] !== control[k])
    expect(moved, 'exactly the non-physical one').toEqual(SKILL_KEYS.filter((k) => !isPhysicalSkill(k)))
  })
})

// =================================================================================================
// C. ⚠⚠ THE DRAW SEQUENCE – the sharpest risk in the task
// =================================================================================================
//
// `growWeek` DRAWS: `rngFromSeed(seed:growth:<week>)`, one pull, in a fixed position BEFORE the
// per-skill loop, and the file's own ⚠ says why that position is load-bearing («the luck value is
// drawn BEFORE the per-skill loop, in the same position, off the same key, so a career's week 30
// draws the same number under every week the player can possibly build»). A term that added a key,
// re-ordered one or consumed a value would shift every career's growth silently – so this is proven
// twice over: the KEYS the phase reached, in order, and the four physical skills, which are computed
// from the same shared `luck` and would move if it had.
describe('wave 5 T5 C – the term adds no key, consumes nothing, and re-orders nothing', () => {
  it('⭐⭐⭐ the same keys, in the same order, with the seat empty and with him working', () => {
    const control = posed('t5-c-keys', 300, { hired: false })
    const worked = posed('t5-c-keys', 300, { hired: true, rung: 2, focus: 'coolhead' })
    rngKeys.length = 0
    walkGrowth(control, 6)
    const controlKeys = [...rngKeys]
    rngKeys.length = 0
    walkGrowth(worked, 6)
    const workedKeys = [...rngKeys]
    expect(controlKeys.length, 'the walk really drew – an empty recorder proves nothing').toBeGreaterThan(0)
    expect(workedKeys, 'key for key, in order, including the walk’s own seed').toEqual(controlKeys)
    expect(workedKeys.filter((k) => k.includes(':growth:')).length, 'one growth key per week, both arms').toBe(6)
  })

  it('⭐⭐⭐ ...and the luck VALUE is unmoved, which no key list can prove: the four physical skills', () => {
    // ⚠ THE HALF A KEY COUNTER CANNOT SEE. A pass that drew the same key one extra time, or consumed
    // a value out of an existing stream, would hand `growWeek` a different `luck` – and `luck`
    // multiplies EVERY skill's gain. So four skills held byte-identical over a walk is the assertion
    // that the draw the growth pass spends is the same number it always was.
    const control = posed('t5-c-luck', 300, { hired: false })
    const worked = posed('t5-c-luck', 300, { hired: true, rung: 2, focus: 'coolhead' })
    walkGrowth(control, 30)
    walkGrowth(worked, 30)
    for (const k of PHYSICAL_SKILL_KEYS) {
      expect(worked.skills[k], `${k} after 30 weeks of his year on her head`).toBe(control.skills[k])
    }
    expect(worked.skills.composure, '...and the one he worked did move').toBeGreaterThan(control.skills.composure)
  })

  it('⭐⭐ the INELIGIBLE weeks derive nothing either – the short-circuit, not just the quiet path', () => {
    // The count-keys law's own half (wave-4 brief §0.1): a pass that only behaved when it was
    // eligible would pass the case above and still make a career's stream position depend on who is
    // on the payroll.
    //
    // ⚠⚠ THE ARMS ARE COMPARED WITHIN A WORLD SHAPE AND NEVER ACROSS ONE, and the first draft of this
    // case did it the wrong way and went red – usefully. A college freeze walks a DIFFERENT road
    // through this phase by design (the championship and the call-up replace the knock roll), and a
    // booked family week stands the COACH down too, so `coachById`'s `seed:coaches` derivation is
    // legitimately absent on it. Neither has anything to do with the psychologist; comparing across
    // shapes measures the college and the coach and calls the answer T5's.
    const shapes: { label: string; extra: Partial<Seat> }[] = [
      { label: 'an ordinary week', extra: {} },
      { label: 'a college freeze', extra: { college: true } },
      { label: 'booked family weeks', extra: { vacation: 6 } },
    ]
    const seats: Seat[] = [
      { hired: false, focus: null },
      { hired: false, focus: 'coolhead' },
      { hired: true, rung: 2, focus: null },
      { hired: true, rung: 2, focus: 'recovery' },
      { hired: true, rung: 2, focus: 'coolhead' },
    ]
    for (const shape of shapes) {
      let reference: string[] | null = null
      for (const seat of seats) {
        const world = posed('t5-c-short', 300, { ...seat, ...shape.extra })
        rngKeys.length = 0
        walkGrowth(world, 5)
        const keys = [...rngKeys]
        expect(keys.length, `${shape.label}: the walk really drew`).toBeGreaterThan(0)
        if (reference === null) reference = keys
        else expect(keys, `${shape.label}, seat ${JSON.stringify(seat)}: not one derivation more`).toEqual(reference)
      }
    }
  })
})

// =================================================================================================
// D. THE TRAINING-ONLY CONTROL ARM, IN CODE – key by key over a walked career
// =================================================================================================
//
// ⚠ RULING K IS WHY THESE ARE PAIRED WALKS AND NOT AN END-STATE DIFF. The frozen corpus compares end
// states and is blind to a convergent change; a composure walk toward a ceiling she reaches anyway is
// exactly that shape. Each arm below is walked against ITS OWN control – the identical world with the
// seat empty – so the only thing that can differ is the term.
describe('wave 5 T5 D – with the seat empty, another year, or stood down, growth is what it was', () => {
  it('⭐⭐⭐ hired for ANOTHER year: every key of a 40-week walk except the seat fields themselves', () => {
    const control = posed('t5-d-other', 260, { hired: false })
    const other = posed('t5-d-other', 260, { hired: true, rung: 2, focus: 'recovery' })
    walkGrowth(control, 40)
    walkGrowth(other, 40)
    expect(movedKeys(keyHashes(control), keyHashes(other)), 'the seat is posed; nothing it does is').toEqual([
      'psychologistFocus',
      'psychologistHired',
      'psychologistRung',
    ])
  })

  it('⭐⭐⭐ a COLLEGE FREEZE: he is stood down, so a 40-week walk is its own control key for key', () => {
    const control = posed('t5-d-college', 260, { hired: false, college: true })
    const frozen = posed('t5-d-college', 260, { hired: true, rung: 2, focus: 'coolhead', college: true })
    walkGrowth(control, 40)
    walkGrowth(frozen, 40)
    expect(movedKeys(keyHashes(control), keyHashes(frozen)), 'the freeze pays nothing and buys nothing').toEqual([
      'psychologistFocus',
      'psychologistHired',
      'psychologistRung',
    ])
    expect(psychologistWorksThisWeek(frozen), 'the predicate the BILL reads says he is stood down').toBe(false)
    expect(frozen.psychologistHired, 'SUSPENDED, NOT CANCELLED').toBe(true)
  })

  it('⭐⭐⭐ BOOKED FAMILY WEEKS: the same, for every week the invoice is not sent', () => {
    const control = posed('t5-d-booked', 260, { hired: false, vacation: 12 })
    const booked = posed('t5-d-booked', 260, { hired: true, rung: 2, focus: 'coolhead', vacation: 12 })
    walkGrowth(control, 12)
    walkGrowth(booked, 12)
    expect(movedKeys(keyHashes(control), keyHashes(booked)), 'pay nothing, receive nothing').toEqual([
      'psychologistFocus',
      'psychologistHired',
      'psychologistRung',
    ])
  })

  it('⭐⭐⭐ ...AND THE POSITIVE CONTROL: working, exactly TWO keys move, and one of them is `skills`', () => {
    // ⚠ A NULL RESULT IS A CLAIM AND NEEDS THE SAME PROVENANCE CHECK AS A POSITIVE ONE (CLAUDE.md).
    // The three cases above are nulls; this is the arm that proves the instrument can see the change
    // at all – same walk, same instrument, the seat actually working.
    const control = posed('t5-d-working', 260, { hired: false })
    const worked = posed('t5-d-working', 260, { hired: true, rung: 2, focus: 'coolhead' })
    walkGrowth(control, 40)
    walkGrowth(worked, 40)
    const moved = movedKeys(keyHashes(control), keyHashes(worked)).filter((k) => !k.startsWith('psychologist'))
    expect(moved, 'her skills, and the events the receipt is written into').toEqual(['events', 'nextEventId', 'skills'])
    expect(worked.skills.composure, 'a season of the top rung is worth about 3.5 points').toBeGreaterThan(
      control.skills.composure,
    )
  })
})

// =================================================================================================
// E. THE STAND-DOWN, WEEK BY WEEK – and the resume that needs no re-hire
// =================================================================================================
describe('wave 5 T5 E – the two weeks the family is not billed, and the week after', () => {
  it('⭐⭐⭐ a college freeze: nothing while it holds, and his full week the moment it ends', () => {
    const world = posed('t5-e-college', 400, { hired: true, rung: 2, focus: 'coolhead' })
    world.college = {
      fromWeek: 390,
      untilWeek: 402,
      doneWeek: null,
      years: [],
      pendingCallUp: null,
      pendingLeague: null,
    }
    // `inCollege` is `college !== null && week < untilWeek`, so week 401 is frozen and 402 is not.
    world.week = 400
    expect(psychologistWorkingRung(world, 'coolhead'), 'frozen – no rung is working').toBeUndefined()
    world.week = 402
    expect(psychologistWorkingRung(world, 'coolhead'), 'out of the freeze, with no re-hire').toBe(2)
    expect(world.psychologistHired, 'the flag survived the freeze').toBe(true)
    expect(world.psychologistFocus, '...and so did the year’s pick').toBe('coolhead')
  })

  it('⭐⭐⭐ a booked family week: the same, and the week after is his again', () => {
    const world = posed('t5-e-booked', 400, { hired: true, rung: 1, focus: 'coolhead' })
    world.vacations = [{ week: 400, packageId: 'beach', paidCents: 0 }]
    world.week = 400
    expect(psychologistWorkingRung(world, 'coolhead'), 'booked off – the week the bill is not charged').toBeUndefined()
    world.week = 401
    expect(psychologistWorkingRung(world, 'coolhead'), 'back at work by himself').toBe(1)
  })

  it('⭐⭐ a walk THROUGH a freeze: the composure gained is exactly the weeks he was paid for', () => {
    // ⚠ THE CLAIM THE KEY-HASH CASES CANNOT MAKE: not «nothing moved» but «exactly the worked weeks
    // moved», counted against the predicate the BILL reads, week by week over one walk.
    // ⚠ MEASURED WHILE BUILDING THIS CASE: `inCollege` is `college !== null && week < untilWeek` and
    // does NOT read `fromWeek` (college.ts:165 – «derived from the span, never a second flag»). So a
    // record with any `fromWeek` freezes every week below `untilWeek`; the nine frozen weeks here are
    // 401–409 and not 404–409, and a fixture written on the other reading would have been measuring a
    // different set while looking right.
    const world = posed('t5-e-walk', 400, { hired: true, rung: 2, focus: 'coolhead' })
    world.college = {
      fromWeek: 404,
      untilWeek: 410,
      doneWeek: null,
      years: [],
      pendingCallUp: null,
      pendingLeague: null,
    }
    const control = posed('t5-e-walk', 400, { hired: false })
    control.college = { ...world.college }
    let expected = 0
    let worked = 0
    for (let k = 0; k < 20; k++) {
      world.week += 1
      control.week += 1
      expected += coolheadGain(world.skills.composure, world.potential.composure, psychologistWorkingRung(world, 'coolhead'))
      if (psychologistWorksThisWeek(world)) worked++
      growAndLive(world, rngFromSeed(`${world.seed}:e-walk`))
      growAndLive(control, rngFromSeed(`${control.seed}:e-walk`))
    }
    expect(worked, 'nine of the twenty weeks – 401 to 409 – were inside the freeze').toBe(11)
    const gained = world.skills.composure - control.skills.composure
    expect(gained, 'he was paid for eleven weeks and eleven weeks is what showed').toBeGreaterThan(0)
    expect(gained, 'NEVER MORE THAN THE WEEKS HE WORKED – the stand-down half, as an inequality').toBeLessThanOrEqual(
      expected + 1e-12,
    )
    // ⚠⚠ AND IT IS A LITTLE LESS, WHICH IS THE ASYMPTOTE AND NOT A LEAK – measured here rather than
    // assumed, because the first draft of this case asserted exact equality and went red at 0.7234
    // against 0.7404 (11 × 0.0673). `growWeek`'s training gain is `rate × HEADROOM × luck × aim`, so a
    // girl he has already lifted has marginally less headroom left for the training that follows and
    // the week gives ~2.3% of his term back. It is the opposite of the double-charge the spec's own ⚠
    // worries about: the two do not add up to more than the ceiling allows, they add up to slightly
    // LESS. ⚠ T10's grid will therefore measure a held season a shade under the 3.5 on the card.
    expect(expected - gained, 'the give-back is the asymptote’s, and it is small').toBeLessThan(expected * 0.05)

    // ...and the comparative half: the same career with no freeze in it is paid for twenty weeks.
    const free = posed('t5-e-walk', 400, { hired: true, rung: 2, focus: 'coolhead' })
    const freeControl = posed('t5-e-walk', 400, { hired: false })
    for (let k = 0; k < 20; k++) {
      free.week += 1
      freeControl.week += 1
      growAndLive(free, rngFromSeed(`${free.seed}:e-walk`))
      growAndLive(freeControl, rngFromSeed(`${freeControl.seed}:e-walk`))
    }
    expect(
      free.skills.composure - freeControl.skills.composure,
      'twenty worked weeks buy strictly more than eleven',
    ).toBeGreaterThan(gained)
  })
})

// =================================================================================================
// F. THE RECEIPT – whose crossing it is
// =================================================================================================
//
// The spec §2 gives every focus the line that tells the player it worked, and the travelling-team §4
// law makes «you paid, and you cannot tell» the failure. ⚠⚠ MEASURED, AND IT IS WHY THIS SHIPS: the
// screen never shows a composure NUMBER at all – the radar carries a fogged `shownValue` into a
// polygon path and no text (decisions.md #11, «axes without numbers»), so without this line the year
// is genuinely invisible. The trigger is the architect's: a WHOLE POINT crossed upward, with HIS term
// the thing that carried it across.
describe('wave 5 T5 F – the sentence, and the crossing it is allowed to claim', () => {
  it('⭐⭐⭐ it fires when his term carries the point, and NOT when training would have anyway', () => {
    // The counterfactual in its own function, asked directly, on the three worlds that matter.
    expect(coolheadCrossedAPoint(71.02, 0.0673), 'training left her at 70.95; he carried her over 71').toBe(true)
    expect(coolheadCrossedAPoint(71.5, 0.0673), 'training had already crossed – not his line to claim').toBe(false)
    expect(coolheadCrossedAPoint(71.02, 0), 'no term, no claim – the ceiling and the empty seat both').toBe(false)
  })

  it('⭐⭐ a line with no figure in it, and no money row behind it', () => {
    expect(COOLHEAD_RECEIPT, 'the spec §2 working sentence, a DRAFT').toBe(
      'The big points feel slower to her than they used to.',
    )
    expect(/\d/.test(COOLHEAD_RECEIPT), 'the no-cents law: no digits, no price, never a purchase').toBe(false)
  })

  it('⭐⭐⭐ a walked career prints it – as a sign and not a subscription', () => {
    const world = posed('t5-f-walk', 260, { hired: true, rung: 2, focus: 'coolhead' })
    walkGrowth(world, WEEKS_IN_SEASON)
    const rows = world.events.filter((e) => e.text === COOLHEAD_RECEIPT)
    expect(rows.length, 'one to three a year at the top rung – the architect’s own sizing').toBeGreaterThan(0)
    expect(rows.length, '...and never a weekly status line').toBeLessThanOrEqual(4)
    for (const row of rows) {
      expect(row.amountCents, 'a life line is never a purchase').toBeUndefined()
      expect(row.type).toBe('info')
    }
  })

  it('⭐⭐⭐ the seat empty prints nothing at all, over the same walk', () => {
    const world = posed('t5-f-empty', 260, { hired: false })
    walkGrowth(world, WEEKS_IN_SEASON)
    expect(world.events.filter((e) => e.text === COOLHEAD_RECEIPT), 'nobody was working on it').toEqual([])
  })

  it('⭐⭐ at the ceiling the year buys nothing and says nothing – the two halves of the same bar', () => {
    const world = posed('t5-f-ceiling', 260, { hired: true, rung: 2, focus: 'coolhead' })
    world.skills = { ...world.skills, composure: world.potential.composure }
    const before: KidSkills = { ...world.skills }
    walkGrowth(world, 20)
    expect(world.events.filter((e) => e.text === COOLHEAD_RECEIPT), 'no crossing, no claim').toEqual([])
    expect(world.skills.composure, 'and no walk either – training’s own headroom is zero too').toBe(
      before.composure,
    )
  })
})
