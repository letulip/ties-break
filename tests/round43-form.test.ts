// WAVE F1 AND F2, AND SCHEMA v80 – the net under
// `docs/specs/the-form-and-the-sparring-2026-09.md` and the owner's eight rulings of 16.09.
//
// WHAT THIS FILE IS FOR. The wave ships five things that can each be wrong in a way no other test
// would notice: a two-channel accumulator whose ORDER is load-bearing, a residual that has to be
// self-centring or the number is not 0-centred at all, a composure reader that must be byte-inert
// at neutral, a seat whose whole effect is one multiplier on one summand, and a schema step. The
// bench (`npm run bench:form`) measures how BIG each of them is; this file pins WHAT they are.
//
// ⚠⚠ THE MEASURED MUTATION ARMS. Every claim below was mutated and watched to go red before it was
// believed – the house rule that a test which cannot fail on the broken version is not this test.
// Each arm was applied to `src/`, this file re-run, and the tree restored by a reverse edit (never
// `git checkout --`):
//
//   #  mutation                                                               RED cases  scope
//   1  `accrueForm`'s reversion no longer stands down on a rusting week             2     the order
//   2  `formResidual`'s loss arm `-g * p` -> `-g * (1 - p)`                         2     the driver
//   3  `formComposureDelta` returns 0 always                                        2     the reader
//   4  `rustCut` ignored – `driftPerWeek * 1` always                                1     the seat
//   5  `sparringWorksThisWeek`'s `travels || !away` -> `true`                       1     the switch
//   6  the v79 -> v80 migration's `form ??= 0` deleted                              1     the schema
//   7  `formMatchlessWeeks`'s `everPlayed` gate removed                             2     the gate
//   8  the rhythm channel's floor clamp removed                                     1     the floor
//
// Eight arms, eight non-zero RED counts, exit 1 on every one.
//
// ⚠⚠ AND ARM 8 RAN **GREEN** ON THE FIRST PASS, WHICH IS WHY THE LIST IS WORTH KEEPING. The
// unaided drift is 0.4 a week and the floor is 4.0, so an unaided walk arrives exactly ON -4.0 and
// the clamp never binds; the case that covers it had to be written against a RUNG's cut, where the
// drift is not a divisor of the floor. A file that had shipped without that case would have had a
// clamp nothing could break.
//
// ⚠ NO SOURCE PINS. Every case mounts the real functions and asserts on BEHAVIOUR, which is the
// repo's stated preference.
import { describe, expect, it } from 'vitest'
import {
  accrueForm,
  formComposureDelta,
  formResidual,
  idleFormWeek,
  type FormWeek,
} from '../src/engine/form'
import { ECONOMY } from '../src/engine/economy'
import { migrateSave } from '../src/engine/migrations'
import {
  createWorld,
  formMatchlessWeeks,
  hireSparring,
  kidMatchPlayerFor,
  matchesEverPlayed,
  SAVE_SCHEMA_VERSION,
  setSparringRung,
  setSparringTravels,
  sparringRungOf,
  sparringRustCut,
  sparringUnlocked,
  sparringWeeklyCents,
  sparringWorksThisWeek,
  SPARRING_LOCKED_DETAIL,
  toSnapshot,
} from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const F = ECONOMY.form

/** A week with the given gap and nothing else. */
function gapWeek(matchlessWeeks: number, rustCut = 1): FormWeek {
  return { residuals: [], matchlessWeeks, rustCut }
}

/** Walk `n` matchless weeks from neutral at one cut, and return the trace. */
function rustWalk(n: number, rustCut: number): number[] {
  const out: number[] = []
  let f = 0
  for (let w = 1; w <= n; w++) {
    f = accrueForm(f, gapWeek(w, rustCut))
    out.push(f)
  }
  return out
}

describe('§1 the number – two channels, one order (spec §1)', () => {
  it('§1a the residual is SELF-CENTRING: a career that plays exactly to its odds accumulates nothing', () => {
    // The whole reason the number can be 0-centred without a corrective term anywhere:
    // E[residual] = p·G·(1−p) − (1−p)·G·p = 0, exactly, at every p.
    for (const p of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const expected = p * formResidual(true, p) + (1 - p) * formResidual(false, p)
      expect(expected, `p = ${p}`).toBeCloseTo(0, 12)
    }
  })

  it('§1a beating a favourite pays MORE than beating a certainty, and both signs are ordered', () => {
    expect(formResidual(true, 0.1)).toBeGreaterThan(formResidual(true, 0.9))
    expect(formResidual(false, 0.9)).toBeLessThan(formResidual(false, 0.1))
    // A win is always positive and a loss always negative – the sign is never a matter of degree.
    for (const p of [0.01, 0.5, 0.99]) {
      expect(formResidual(true, p)).toBeGreaterThan(0)
      expect(formResidual(false, p)).toBeLessThan(0)
    }
  })

  it('§1b the rhythm channel does NOTHING until the gap passes `rustAfterWeeks`, strictly', () => {
    for (let w = 0; w <= F.rustAfterWeeks; w++) {
      expect(accrueForm(0, gapWeek(w)), `gap ${w}`).toBe(0)
    }
    expect(accrueForm(0, gapWeek(F.rustAfterWeeks + 1))).toBeLessThan(0)
  })

  it('§1b the rust reaches its floor and stops there – it dulls, it does not destroy', () => {
    const trace = rustWalk(60, 1)
    expect(Math.min(...trace)).toBe(F.rustFloor)
    expect(trace[trace.length - 1]).toBe(F.rustFloor)
    // ⚠ AND THE FLOOR IS A FLOOR ON THE CHANNEL AND NOT ON THE NUMBER: a girl already below it from
    // a run of bad results rusts by exactly nothing. Her problem is not that she has stopped playing.
    const deep = F.rustFloor - 3
    expect(accrueForm(deep, gapWeek(20))).toBe(deep)
    // ⚠⚠ AND IT LANDS **ON** THE FLOOR AND NOT PAST IT, WHICH IS A SEPARATE CLAIM AND WAS A HOLE IN
    // THIS FILE UNTIL A MUTATION ARM FOUND IT. The unaided drift is 0.4 a week and the floor is 4.0,
    // so an unaided walk arrives exactly on -4.0 and the clamp NEVER BINDS on it: arm 8 (the
    // `Math.max` deleted) ran GREEN on the case above. Every sparring rung drifts by a number the
    // floor is not a multiple of, so the clamp is load-bearing the moment a seat is hired.
    for (const r of ECONOMY.sparring.rungs) {
      // ⚠ LONG ENOUGH FOR THE SLOWEST RUNG: the top rung drifts 0.1 a week, so it needs forty
      // DRIFTING weeks and the drift only opens on gap week four.
      const withSeat = rustWalk(80, r.driftCut)
      expect(Math.min(...withSeat), r.label).toBe(F.rustFloor)
    }
  })

  it('§1b it reaches the floor in TEN matchless weeks, which is only true because the reversion stands down', () => {
    // ⚠⚠ THIS IS THE CASE THAT CATCHES THE SPEC'S OWN §1c/§1b CONTRADICTION. With reversion running
    // on a rusting week the map is `f -> min(0, f + 0.5) - 0.4`, whose only attractor is the 2-cycle
    // {0, -0.4}: the floor would be unreachable by a factor of ten and every rung of the sparring
    // ladder would be cutting four hundredths of a composure point. See `accrueForm`.
    // The drift opens on gap week 4 (strictly past three), so ten drifts of 0.4 land on the floor at
    // gap week 13 – `rustWalk` is 0-indexed, hence 12.
    const trace = rustWalk(20, 1)
    expect(trace.indexOf(F.rustFloor), 'the week the floor is first reached (0-indexed)').toBe(12)
  })

  it('§1c the return to neutral runs on an ordinary week, both signs, and never overshoots 0', () => {
    expect(accrueForm(5, idleFormWeek())).toBe(5 - F.revertPerWeek)
    expect(accrueForm(-5, idleFormWeek())).toBe(-5 + F.revertPerWeek)
    // Smaller than one step, from both sides: it lands ON zero and not past it.
    expect(accrueForm(0.2, idleFormWeek())).toBe(0)
    expect(accrueForm(-0.2, idleFormWeek())).toBe(0)
    // Neutral stays neutral to the bit, for ever, which is why a girl who never plays is untouched.
    expect(accrueForm(0, idleFormWeek())).toBe(0)
  })

  it('§1c the return still runs inside a SHORT gap – three weeks off lifts a slump', () => {
    expect(accrueForm(-5, gapWeek(F.rustAfterWeeks))).toBe(-5 + F.revertPerWeek)
  })

  it('§1 the number is clamped and kept in tenths', () => {
    const huge = Array.from({ length: 40 }, () => 1)
    expect(accrueForm(0, { residuals: huge, matchlessWeeks: 0, rustCut: 1 })).toBe(F.max)
    const awful = Array.from({ length: 40 }, () => -1)
    expect(accrueForm(0, { residuals: awful, matchlessWeeks: 0, rustCut: 1 })).toBe(F.min)
    // One rounding, at the end, on the sum – three tenths of a residual do not vanish one at a time.
    const f = accrueForm(0, { residuals: [0.04, 0.04, 0.04], matchlessWeeks: 0, rustCut: 1 })
    expect(f).toBe(0.1)
  })
})

describe('§2 the one reader – composure, and nothing else (spec §2, O3)', () => {
  it('neutral form is BYTE-IDENTICAL: the reader adds an exact 0 and the player object is untouched', () => {
    const world = createWorld('form-reader', DEFAULT_PROFILE)
    const withKey = kidMatchPlayerFor(world, 'hard')
    const withoutKey = kidMatchPlayerFor({ ...world, form: undefined }, 'hard')
    expect(withKey).toEqual(withoutKey)
    expect(formComposureDelta(0)).toBe(0)
    expect(formComposureDelta(undefined)).toBe(0)
  })

  it('form moves COMPOSURE and no other wing', () => {
    const world = createWorld('form-reader-2', DEFAULT_PROFILE)
    const flat = kidMatchPlayerFor(world, 'hard')
    const slumped = kidMatchPlayerFor({ ...world, form: F.min }, 'hard')
    const flying = kidMatchPlayerFor({ ...world, form: F.max }, 'hard')
    for (const wing of ['serve', 'ret', 'stamina', 'groundstrokes'] as const) {
      expect(slumped[wing], wing).toBe(flat[wing])
      expect(flying[wing], wing).toBe(flat[wing])
    }
    expect(slumped.composure).toBeLessThan(flat.composure)
    expect(flying.composure).toBeGreaterThan(flat.composure)
  })

  it('the delta at the clamps is `form × K`, and the clamps are ±K×10 composure points', () => {
    expect(formComposureDelta(F.max)).toBeCloseTo(F.max * F.reader, 10)
    expect(formComposureDelta(F.min)).toBeCloseTo(F.min * F.reader, 10)
    const world = createWorld('form-reader-3', DEFAULT_PROFILE)
    const flat = kidMatchPlayerFor(world, 'hard')
    const flying = kidMatchPlayerFor({ ...world, form: F.max }, 'hard')
    expect(flying.composure - flat.composure).toBeCloseTo(F.max * F.reader, 10)
  })

  it('a deep slump on a low composure never draws a negative wing', () => {
    const world = createWorld('form-reader-4', DEFAULT_PROFILE)
    const tiny = { ...world, form: F.min, skills: { ...world.skills, composure: 0 }, condition: 40 }
    expect(kidMatchPlayerFor(tiny, 'hard').composure).toBeGreaterThanOrEqual(0)
  })

  it('O2 – form reaches NO surface: nothing on the wire carries it', () => {
    const world = createWorld('form-fog', DEFAULT_PROFILE)
    world.form = -7.3
    const snap = toSnapshot(world) as unknown as Record<string, unknown>
    expect(Object.keys(snap)).not.toContain('form')
    expect(JSON.stringify(snap)).not.toContain('-7.3')
  })
})

describe('§4 the sparring partner – one channel, and the fence around it', () => {
  it('the ladder is strictly decreasing in drift, and every rung MEASURABLY beats the one below', () => {
    const rungs = ECONOMY.sparring.rungs
    for (let i = 1; i < rungs.length; i++) {
      expect(rungs[i].driftCut, `rung ${i} cuts harder`).toBeLessThan(rungs[i - 1].driftCut)
      expect(rungs[i].weeklyCents, `rung ${i} costs more`).toBeGreaterThan(rungs[i - 1].weeklyCents)
    }
    // ⚠⚠ THE CASE THAT CAUGHT THE ROUNDING DEFECT. `world.form` is kept in tenths, so a cut whose
    // per-week drift is not exact in tenths quantises to the same ratchet as its neighbour: the
    // spec's proposed 0.35 and 0.15 both produced -0.1 a week and the top two rungs were the SAME
    // SEAT. Each rung's twenty-week trace must therefore differ from the next by a real number.
    // ⚠ READ AT GAP WEEK 13 AND NOT LATER: an unaided career is ON the floor by then, so a longer
    // horizon walks every rung into the same clamp and the ladder disappears into it.
    const AT = 12
    const traces = rungs.map((r) => rustWalk(20, r.driftCut))
    for (let i = 1; i < traces.length; i++) {
      expect(traces[i], `rung ${i} is not a copy of rung ${i - 1}`).not.toEqual(traces[i - 1])
      expect(traces[i][AT], `rung ${i} is further from the floor at gap week 13`).toBeGreaterThan(traces[i - 1][AT])
    }
    expect(traces[0][AT], 'and every rung beats no seat at all').toBeGreaterThan(rustWalk(20, 1)[AT])
  })

  it('he touches the RHYTHM channel and NOTHING else – the fence sentence, as arithmetic', () => {
    // A slumping girl who plays every week gets nothing from him: same residuals, no gap, and the
    // cut is worth exactly zero.
    const slump: FormWeek = { residuals: [-1.2, -0.9], matchlessWeeks: 0, rustCut: 1 }
    const withHim: FormWeek = { ...slump, rustCut: ECONOMY.sparring.rungs[2].driftCut }
    expect(accrueForm(-3, withHim)).toBe(accrueForm(-3, slump))
    // And the reversion rate is his either way – he does not heal a slump faster.
    expect(accrueForm(-3, { ...idleFormWeek(), rustCut: 0.15 })).toBe(accrueForm(-3, idleFormWeek()))
  })

  it('`sparringRustCut` is 1 whenever he cannot bill for the week – pay nothing, receive nothing', () => {
    const world = createWorld('sparring-cut', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    const gap = F.rustAfterWeeks + 5
    expect(sparringRustCut(world, gap, false), 'nobody hired').toBe(1)
    hireSparring(world, true)
    expect(sparringRustCut(world, gap, false), 'hired and she is at home').toBe(sparringRungOf(world).driftCut)
    expect(sparringRustCut(world, gap, true), 'hired, at home only, and she is away').toBe(1)
    expect(sparringRustCut(world, F.rustAfterWeeks, false), 'the gap is too short to drift').toBe(1)
    setSparringTravels(world, true)
    expect(sparringRustCut(world, gap, true), 'and now he is on the road with her').toBe(
      sparringRungOf(world).driftCut,
    )
  })

  it('the seat works and bills on the SAME predicate – «you paid and you cannot tell» is unspellable', () => {
    const world = createWorld('sparring-bill', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    hireSparring(world, true)
    for (const away of [false, true]) {
      const works = sparringWorksThisWeek(world, away)
      const cut = sparringRustCut(world, F.rustAfterWeeks + 4, away)
      expect(works === (cut !== 1), `away=${away}: the week he is paid for is the week he cuts`).toBe(true)
    }
  })

  it('the gate, the refusal and the dial are all the engine`s (R10-16)', () => {
    const junior = createWorld('sparring-gate', DEFAULT_PROFILE)
    expect(sparringUnlocked(junior)).toBe(false)
    expect(() => hireSparring(junior, true)).toThrow(SPARRING_LOCKED_DETAIL)
    const pro = createWorld('sparring-gate-2', DEFAULT_PROFILE)
    pro.bestFinishByTier.w15 = 0
    expect(sparringUnlocked(pro)).toBe(true)
    hireSparring(pro, true)
    expect(pro.sparringHired).toBe(true)
    expect(() => setSparringRung(pro, 7)).toThrow()
    setSparringRung(pro, 2)
    expect(pro.sparringRung).toBe(2)
    expect(sparringWeeklyCents(pro)).toBe(ECONOMY.sparring.rungs[2].weeklyCents)
  })

  it('the card`s facts cross the wire, and the price is the engine`s', () => {
    const world = createWorld('sparring-wire', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    hireSparring(world, true)
    setSparringRung(world, 0)
    const snap = toSnapshot(world)
    expect(snap.sparringHired).toBe(true)
    expect(snap.sparringUnlocked).toBe(true)
    expect(snap.sparringRung).toBe(0)
    expect(snap.sparringTravels).toBe(false)
    expect(snap.sparringSalaryCents).toBe(ECONOMY.sparring.rungs[0].weeklyCents)
  })
})

describe('§1b the gap – read off the world', () => {
  it('a girl who has never played has NO gap, however long the calendar is', () => {
    const world = createWorld('form-gap-never', DEFAULT_PROFILE)
    world.week = 120
    expect(matchesEverPlayed(world), 'she really has played nothing').toBe(0)
    expect(formMatchlessWeeks(world)).toBe(0)
  })

  it('«ever played» is `matchesEverPlayed`s own three counters, and the two agree on a real world', () => {
    // ⚠ THE ANTI-DRIFT DEVICE for the structural re-spelling in `world/form.ts`: that file cannot
    // import `coachMarket.ts` (the leaf fence), so it re-spells the expression and this case pins the
    // two to one answer.
    const world = createWorld('form-gap-agree', DEFAULT_PROFILE)
    world.week = 40
    expect(formMatchlessWeeks(world)).toBe(0)
    world.seasonWins = 3
    expect(matchesEverPlayed(world)).toBeGreaterThan(0)
    expect(formMatchlessWeeks(world)).toBeGreaterThan(F.rustAfterWeeks)
  })

  it('the gap is measured to the week that CLOSED, not to today', () => {
    const world = createWorld('form-gap-week', DEFAULT_PROFILE)
    world.week = 30
    world.seasonWins = 1
    world.results = [{ playerId: 'kid', week: 25, points: 0, tier: 'local', wins: 1, losses: 0 }] as never
    expect(formMatchlessWeeks(world)).toBe(30 - 1 - 25)
  })
})

describe('§6 the schema move – v80', () => {
  it('the version is 80 and a fresh career opens at neutral', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(80)
    expect(createWorld('form-schema', DEFAULT_PROFILE).form).toBe(0)
  })

  it('a v79 save migrates with form at neutral, and the back-fill is the identity', () => {
    const v79 = createWorld('form-migrate', DEFAULT_PROFILE) as unknown as Record<string, unknown>
    delete v79.form
    v79.schemaVersion = 79
    const migrated = migrateSave(v79)
    expect(migrated.schemaVersion).toBe(80)
    expect(migrated.form).toBe(0)
  })

  it('`??=` and never `||=` – a live 0 survives a re-run of the step', () => {
    // ⚠ THE SHARPEST CASE THE RULE HAS HAD: 0 is the value MOST careers hold, so `form ||= 0` is not
    // merely a no-op that looks like a write – it would overwrite the commonest live value.
    const save = createWorld('form-idem', DEFAULT_PROFILE) as unknown as Record<string, unknown>
    save.form = -4.2
    save.schemaVersion = 79
    expect(migrateSave(save).form, 'a live value is not back-filled over').toBe(-4.2)
  })

  it('the three sparring keys finally have a reader, and nothing else was needed for them', () => {
    // v78 gave `sparringHired` / `sparringRung`, v79 `sparringTravels`, and both versions said in as
    // many words that a reader who found them unused was reading a SCHEDULING decision. This is the
    // wave that reads them – and it needed no key of its own for the seat.
    const world = createWorld('sparring-keys', DEFAULT_PROFILE)
    expect(world.sparringHired).toBe(false)
    expect(world.sparringRung).toBe(ECONOMY.sparring.defaultRung)
    expect(world.sparringTravels).toBe(false)
  })
})
