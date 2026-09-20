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
  coachFormNote,
  resolveSparring,
  sparringRungOf,
  sparringRustCut,
  sparringStoodDown,
  sparringUnlocked,
  sparringWeeklyCents,
  sparringWorksThisWeek,
  SPARRING_CHANGE_KEY,
  SPARRING_LOCKED_DETAIL,
  SPARRING_RECEIPT,
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
  // ⚠ THE LADDER'S HEAD MOVED PAST THIS WAVE AND THE SECTION TITLE DID NOT. `form` arrived AT v80 and
  // still does; round 44 took the head to v81 with an optional row key of its own. The pin follows
  // the head, because what it is really asserting is «the constant a fresh career is stamped with».
  // ⚠ RE-AIMED AT v82 (17.09, round 42 #51 – `coachDeal`, the coach's fee fixed at hire), NOT
  // WEAKENED: 82 was taken by that item's own full move, `form` still arrives at v80, and this line
  // still asserts what a fresh career is stamped with rather than when this wave landed.
  // ⚠ RE-AIMED AT v83 (18.09, wave 7 T1 – the wedding: `LoveEpisode.latchedWeek`/`partnerName`),
  // NOT WEAKENED, the same sentence again: 83 was taken by that wave's own full move, `form` still
  // arrives at v80, and this line still asserts what a fresh career is stamped with.
  // ⚠ RE-AIMED AT v84 (19.09, the album's one schema move – `world.prologueTrace`), NOT WEAKENED,
  // the same sentence again: 84 was taken by that spec's own full move, `form` still arrives at
  // v80, and this line still asserts what a fresh career is stamped with.
  it('the version is the ladder\'s head and a fresh career opens at neutral', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(84)
    expect(createWorld('form-schema', DEFAULT_PROFILE).form).toBe(0)
  })

  it('a v79 save migrates with form at neutral, and the back-fill is the identity', () => {
    const v79 = createWorld('form-migrate', DEFAULT_PROFILE) as unknown as Record<string, unknown>
    delete v79.form
    v79.schemaVersion = 79
    const migrated = migrateSave(v79)
    // ⚠ THE WALK RUNS TO THE LADDER'S HEAD AND NOT TO THIS WAVE'S RUNG, which is what `migrateSave`
    // has always done – it stops at `SAVE_SCHEMA_VERSION`. Round 44 added a v81 step that writes
    // nothing, so a v79 save now comes out at 81 with `form` back-filled by v80 exactly as before.
    // The claim this case makes is about the BACK-FILL and the line below is where it lives.
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
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

// =================================================================================================
// §7 HIS COPY REVIEW OF 17.09 – THE TERMINOLOGY SHEET, AS A TEST
// =================================================================================================
//
// The owner reviewed every DRAFT string this round shipped and returned a diagnosis before he
// returned replacements: «much of the wording currently sounds translated, procedural, or
// conspicuously written … repeated abstractions such as "a body", "practice weeks", "somebody
// across the net" … poetic phrases appearing inside confirmations and accessibility labels, where
// literal clarity matters.» And the root cause, which is the part that had to be built into the
// files rather than applied once: «trying to give every surface the same lyrical house voice is what
// currently makes several lines feel AI-written» – so the voices differ BY SURFACE (a knock window
// observes, a coach is terse, a letter is professional, a confirmation is literal, a feed entry is a
// compact consequence, a receipt is restrained).
//
// ⚠⚠ WHY THIS SECTION EXISTS AT ALL, AND IT IS THE ONE THING THAT MAKES HIS SHEET DURABLE. Before it,
// not one of the seat's engine sentences was pinned by VALUE anywhere in the repo – the cases above
// assert the mechanic and would stay green under any wording at all, which is exactly how five of
// these strings drifted into the register he objected to. ⭐ A copy sheet nothing enforces is a
// preference; a copy sheet with a test is a contract.
//
// ⚠ THE SHEET, HIS OWN TABLE: role = hitting partner · recruitment = hire · departure = let go /
// leaves the team · recurring cost = WEEKLY SALARY (one wording, chosen and used everywhere) ·
// function = match-style practice · home = home club · travel = on tour · travel cost = one
// additional fare per trip · benefit = helps her keep her timing.
describe('§7 his 17.09 copy review – one vocabulary for the seat, and it is the engine`s', () => {
  /** Every sentence about this seat the ENGINE owns, gathered off a real career rather than quoted:
   *  the hire, the release, a rung change, both travel stances, and the two exported constants.
   *  A string that never reaches a feed cannot be checked, and a string quoted into a test from the
   *  source it is checking is not checked either. */
  function everySeatSentence(): string[] {
    const world = createWorld('sparring-voice', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    hireSparring(world, true)
    setSparringRung(world, 2)
    setSparringTravels(world, true)
    setSparringTravels(world, false)
    hireSparring(world, false)
    resolveSparring(world, false)
    const said = world.events.map((e) => e.text)
    said.push(SPARRING_LOCKED_DETAIL, SPARRING_RECEIPT)
    // Not vacuous: six writes above, and the two constants.
    expect(said.length, 'the gather really gathered something').toBeGreaterThan(6)
    return said
  }

  it('⭐ the five feed sentences are his, word for word', () => {
    const world = createWorld('sparring-words', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    const last = (): string => world.events[world.events.length - 1].text

    hireSparring(world, true)
    expect(last()).toBe('A hitting partner joins the team – regular match-style practice on weeks without a match.')
    setSparringRung(world, 2)
    // ⚠⚠ «THE ARRANGEMENT CHANGES» AND NOT «A NEW HITTING PARTNER JOINS», AND THE CHOICE IS A FACT
    // ABOUT THE MODEL RATHER THAN A TASTE. He offered both and warned that the personnel line
    // «asserts a personnel change the model may not track». It does not track one: there is no
    // identity of any kind here, and `SPARRING_CHANGE_KEY` is written by `hireSparring` ALONE – so a
    // rung change does not restart the arrangement, which the next case asserts directly.
    expect(last()).toBe('The hitting-partner arrangement changes with the next bill – a top-100 partner.')
    setSparringTravels(world, true)
    expect(last()).toBe(
      'The hitting partner will travel from now on – one additional fare per trip, and a regular practice opponent on tour.',
    )
    setSparringTravels(world, false)
    expect(last()).toBe(
      'The hitting partner will stay at the home club – no additional fare, and no regular practice opponent on tour.',
    )
    hireSparring(world, false)
    expect(last()).toBe('The hitting partner leaves the team – regular match-style practice between events ends.')
  })

  it('⚠⚠ a rung change really does NOT restart the arrangement – the evidence behind that sentence', () => {
    // The check that decided which of his two lines to take, asserted rather than asserted about. If
    // a future wave makes a rung change write its own tagged row, the sentence above becomes the
    // wrong one of the two and this case is what says so.
    const world = createWorld('sparring-tenure', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    hireSparring(world, true)
    const tagged = (): number => world.events.filter((e) => e.milestoneKey?.startsWith(SPARRING_CHANGE_KEY)).length
    expect(tagged(), 'the hire opens the arrangement').toBe(1)
    world.week += 40
    setSparringRung(world, 0)
    setSparringRung(world, 2)
    expect(tagged(), 'two rung changes, and the arrangement never restarted').toBe(1)
  })

  it('⭐ the coach`s eye is terse tennis language, and both lines are his', () => {
    const world = createWorld('sparring-eye', DEFAULT_PROFILE)
    world.coachId = 'c1'
    // The GOOD line: a crossing UP through `goodNoteAt`, which is all that branch is gated on.
    expect(coachFormNote(world, F.goodNoteAt - 0.1, F.goodNoteAt)).toBe('She is striking the ball cleanly.')
    // ...and it is a CROSSING, so a week that starts above it says nothing at all.
    expect(coachFormNote(world, F.goodNoteAt, F.goodNoteAt + 1)).toBeNull()
    // The RUST line needs the gap that caused it as well as the number – the fence between the two
    // channels, which is why this world is walked to a week with a real matchless run behind it.
    world.week = 200
    world.seasonWins = 1
    world.results = [{ playerId: 'kid', week: 100, points: 0, tier: 'local', wins: 1, losses: 0 }] as never
    expect(formMatchlessWeeks(world), 'the gap the rust line is gated on').toBeGreaterThan(F.rustAfterWeeks)
    expect(coachFormNote(world, F.rustNoteAt + 0.1, F.rustNoteAt)).toBe('She needs match play.')
    // ⚠ AND NEITHER IS SAID TO A FAMILY WITH NOBODY IN THE CORNER – the eye belongs to the man.
    world.coachId = null
    expect(coachFormNote(world, F.goodNoteAt - 0.1, F.goodNoteAt)).toBeNull()
  })

  it('⭐⭐ THE STRUCK IMAGES ARE GONE FROM EVERY SENTENCE THIS SEAT OWNS, not from the one he quoted', () => {
    // His objection to «somebody across the net» is that it is «used often enough that it begins to
    // feel generated» – which is a claim about the SET of strings and cannot be checked one string at
    // a time. That is the whole reason this case gathers them all first.
    for (const line of everySeatSentence()) {
      expect(line, `«across the net» survives in: ${line}`).not.toContain('across the net')
      expect(line, `«practice weeks» survives in: ${line}`).not.toMatch(/practice weeks/i)
      expect(line, `«payroll» survives in: ${line}`).not.toMatch(/payroll/i)
      expect(line, `a professional operation survives in: ${line}`).not.toContain('professional operation')
    }
  })

  it('⭐⭐ ONE WORDING PER MEANING – the recurring cost is a WEEKLY SALARY and nothing else', () => {
    // «In management copy, semantic consistency is more valuable than synonym variety.» The cost had
    // three names across this seat's surfaces (a salary, the payroll, a weekly fee); the sheet picks
    // one, and this is what stops the fourth appearing.
    for (const line of everySeatSentence()) {
      expect(line, `a second name for the recurring cost in: ${line}`).not.toMatch(/weekly fee/i)
    }
    const world = createWorld('sparring-bill-words', DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    hireSparring(world, true)
    resolveSparring(world, false)
    const bill = world.events.find((e) => e.category === 'staff' && (e.amountCents ?? 0) < 0)
    expect(bill?.text, 'the ledger row is the sheet`s own wording').toBe('Hitting partner – weekly salary')
  })

  it('⭐⭐⭐ THE ONE LINE HE KEPT IS STILL EXACTLY THE LINE HE KEPT', () => {
    // «Her first match back did not look like a first match back» – «the repetition gives it rhythm
    // and makes it feel like an observation rather than a tooltip». It is the only string of this
    // round he returned unchanged, and a rewrite that tidied the repetition away would be undoing
    // the one thing he praised.
    expect(SPARRING_RECEIPT).toBe('Her first match back did not look like a first match back.')
  })
})

// =================================================================================================
// §8 RETAINED, BUT NOT WORKING THIS WEEK – the first of the two states his 17.09 review said were
//    missing, and it was missing from the SCREEN rather than from the engine
// =================================================================================================
//
// HIS WORDS: «if family/school weeks temporarily stop billing: *The hitting partner remains with the
// team, but is not working this week. No salary is charged.*» ⚠ He asked for the state to be CHECKED
// before the string was written, and it was there: `sparringWorksThisWeek` has stood down at the
// college freeze and on a booked family week since the seat shipped, silently. A salaried seat that
// charges nothing for four college years and says nothing about either half is the shape the card
// could not be left in.
//
// ⚠⚠ THE ASSERTION THAT MATTERS IS THE BICONDITIONAL, not the flag. A card free to claim «no salary
// is charged» on a week the ledger took the money would be worse than no line at all, so the flag and
// the bill are read off ONE predicate and this section proves they cannot part company.
describe('§8 his 17.09 review – the seat stands down without leaving, and the card may say so', () => {
  function proWithSeat(seed: string) {
    const world = createWorld(seed, DEFAULT_PROFILE)
    world.bestFinishByTier.w15 = 0
    hireSparring(world, true)
    return world
  }

  it('⭐ an ordinary hired week is NOT a stand-down – the arm is not vacuously true', () => {
    const world = proWithSeat('stand-none')
    expect(sparringStoodDown(world)).toBe(false)
    expect(sparringWorksThisWeek(world, false), 'and the seat works').toBe(true)
  })

  it('⭐ the college freeze stands him down, and does not cancel the arrangement', () => {
    const world = proWithSeat('stand-college')
    world.college = { fromWeek: world.week - 1, untilWeek: world.week + 208, doneWeek: null, years: [], pendingCallUp: null, pendingLeague: null }
    expect(sparringStoodDown(world)).toBe(true)
    expect(world.sparringHired, 'suspends, does not cancel').toBe(true)
    expect(sparringWorksThisWeek(world, false)).toBe(false)
    // ⚠⚠ AND THE SEAT IS STILL UNLOCKED, which is what makes the new line REACHABLE in the one state
    // it matters most in. The card's ladder tries LOCKED first: if the college freeze closed the gate
    // the player would read the refusal for four years instead of «not working this week», and every
    // assertion about the sentence would still pass. `sparringUnlocked` reads the never-pruned W mark,
    // so the door cannot close behind her – asserted here rather than trusted to a docblock.
    expect(sparringUnlocked(world), 'the gate does not close behind a college career').toBe(true)
    expect(toSnapshot(world).sparringUnlocked).toBe(true)
  })

  it('⭐ a booked family week stands him down too (ruling J – pay nothing, receive nothing)', () => {
    const world = proWithSeat('stand-family')
    world.vacations = [{ week: world.week, packageId: 'seaside', paidCents: 400_00 }]
    expect(sparringStoodDown(world)).toBe(true)
    expect(world.sparringHired).toBe(true)
    expect(sparringWorksThisWeek(world, false)).toBe(false)
  })

  it('⚠ nobody hired is not a stand-down – there is nothing to stand down', () => {
    const world = createWorld('stand-empty', DEFAULT_PROFILE)
    world.vacations = [{ week: world.week, packageId: 'seaside', paidCents: 400_00 }]
    expect(sparringStoodDown(world), 'an empty seat is not a suspended one').toBe(false)
  })

  it('⚠⚠ THE FLAG AND THE BILL CANNOT DISAGREE – no week is ever both stood down and charged', () => {
    // The one failure this line could cause: the card telling a family no salary is charged on a week
    // the ledger took it. Swept over the two stand-downs and an ordinary week, at both stances.
    for (const [label, doctor] of [
      ['ordinary', () => {}],
      ['college', (w: ReturnType<typeof proWithSeat>) => {
        w.college = { fromWeek: w.week - 1, untilWeek: w.week + 208, doneWeek: null, years: [], pendingCallUp: null, pendingLeague: null }
      }],
      ['family week', (w: ReturnType<typeof proWithSeat>) => {
        w.vacations = [{ week: w.week, packageId: 'seaside', paidCents: 400_00 }]
      }],
    ] as const) {
      for (const travels of [false, true]) {
        const world = proWithSeat(`stand-sweep-${label}-${travels}`)
        setSparringTravels(world, travels)
        doctor(world as never)
        const funds = world.fundsCents
        resolveSparring(world, false)
        const charged = world.fundsCents < funds
        expect(
          sparringStoodDown(world) ? !charged : true,
          `${label} (travels=${travels}): the card would claim a free week the ledger charged for`,
        ).toBe(true)
      }
    }
  })

  it('⭐ the state crosses the wire, so the card reads it rather than re-deriving it', () => {
    const world = proWithSeat('stand-wire')
    expect(toSnapshot(world).sparringStoodDown).toBe(false)
    world.vacations = [{ week: world.week, packageId: 'seaside', paidCents: 400_00 }]
    expect(toSnapshot(world).sparringStoodDown).toBe(true)
  })

  it('⚠ and the AWAY stand-down is deliberately NOT this flag', () => {
    // The third stand-down – a partner who does not travel cannot hit with her in another country –
    // is what the travel switch SELLS rather than a suspension, and the switch's own row says so. A
    // second sentence calling that week a suspension would be two stories about one fact.
    const world = proWithSeat('stand-away')
    expect(sparringWorksThisWeek(world, true), 'he does stand down on an away week').toBe(false)
    expect(sparringStoodDown(world), '...and it is not what this flag reports').toBe(false)
  })
})
