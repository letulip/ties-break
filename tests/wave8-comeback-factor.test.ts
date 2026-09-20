// THE RETURN, WAVE 8 – T6 HALF 2: THE STAGED FACTOR (life/wave-8;
// docs/plans/life-wave-8-builder-2026-09.md §2 T6, constants in `ECONOMY.motherhood`).
//
// −40% → −20% → −10% → full over 0–3 / 3–6 / 6–12 / 12+ months after the week she came back – the
// research's own staircase (`docs/research/life-events-motherhood.md:35`), landing on
// `kidMatchPlayerFor`'s narrow arg type beside `spirit` and `form`.
//
// ⚠⚠ THE WHOLE OF THIS FILE IS THE PARKED-SPEC BOUNDARY MADE MECHANICAL.
// `docs/specs/form-and-slump.md` (results-driven form) is OWNER-PARKED – «форму и спад тоже давай
// распишем спеком, но уже на потом» – and §0 of the wave brief says the staged factor «is NOT that
// spec and must not become it by the back door»: a time-shaped multiplier on the ABSENCE, dead at
// 1.0 for every career that never paused, reading NOTHING from results.
//
//   §A  the staircase, pinned at every boundary week, plus a week BEFORE the return
//   §B  ABSENT ⇒ 1.0 and the composed player is BYTE-IDENTICAL
//   §C  it really is applied, on the seam `condition` and `spirit` are on
//   §D  ⚠⚠ IT READS NO RESULTS – a career's whole match history mutated and the factor does not
//       move. Pinned behaviourally AND structurally, because a behavioural arm cannot see a clause
//       that happens not to matter yet (T4's and T5's own instrument)
//   §E  zero draws
//
// MUTATION LEDGER – every arm run red-first against THIS file, applied by a scripted exact-string
// edit with an md5 receipt and reverted by md5, each on a re-verified 12-green baseline. ⚠ THE
// COUNTS ARE **MEASURED** REDS, NOT PREDICTIONS:
//   ARM 1  the factor applied UNCONDITIONALLY – an absent   → 4 RED: §B.2, §B.3, §C.1, §C.2. The arm
//          comeback read as «she came back this week»           this file exists for: it is what
//          rather than as 1.0                                     «dead at 1.0 for every career that
//                                                                 never paused» means mechanically
//   ARM 2  the staircase read FIRST-rung-wins (the           → 4 RED: §A.1, §B.3, §C.1, §C.2
//          ascending table walked backwards)
//   ARM 3  a boundary off by one (`>=` → `>` in the rung     → 5 RED: §A.1, §B.2, §B.3, §C.1, §C.2
//          loop)
//   ARM 4  the factor dropped from the five wings, kept in   → 3 RED: §B.2, §C.1, §C.2 – a constant
//          the function – CLAUDE.md's own named null-arm         with no reader, caught by its readers
//          shape
//   ARM 5  a results term folded in AT THE CALL SITE, which  → 5 RED: §B.2, §B.3, §C.1, §C.2 and
//          is the only place the world is in scope – THE         §D.1. ⚠ NOT §D.2, correctly: the
//          PARKED SPEC BY THE BACK DOOR                           structural pin reads the FACTOR's
//                                                                 own text and this lands outside it
//   ARM 6  the FACTOR ITSELF widened to take `results` and   → 1 RED: §D.2, AND ONLY §D.2. ⭐⭐ THE
//          fold them into its initialiser                         MEASUREMENT THAT JUSTIFIES HAVING A
//                                                                 STRUCTURAL PIN AT ALL: the rung loop
//                                                                 OVERWRITES the initialiser, so the
//                                                                 arm changes the TEXT and not the
//                                                                 number – «a behavioural arm cannot
//                                                                 see a clause that happens not to
//                                                                 matter yet», measured rather than
//                                                                 quoted
//   ARM 7  the same term applied AFTER the loop, so it       → 6 RED: §B.2, §B.3, §C.1, §C.2, §D.1 and
//          really bites                                           §D.2 – both nets, which is what a
//                                                                 real back door should trip
//
// ⚠⚠ ONE HARNESS FINDING IS IN THIS LEDGER ON PURPOSE, AND IT CHANGED THE TEST RATHER THAN THE
// LEDGER. ARM 7's FIRST run measured 5 RED with §D.1 GREEN, which looked like the behavioural net
// working and was not: `createWorld` hands back a career already holding **671** result rows, so a
// §D.1 that merely REPLACED the book with sixty left a saturating results term reading the same
// number at both ends. §D.1 now replaces the history in BOTH directions – emptied and stuffed – which
// is the pair nothing monotonic in the history can sit still across, and ARM 7 re-measured at 6.
// ⚠ A SECOND HARNESS FAILURE IS RECORDED TOO: a diagnostic probe crashed between its write and its
// revert and left `world/player.ts` mutated. It was caught by the next run's anchor assertion, the
// file was restored by hand and the suite re-verified green BEFORE any arm was re-measured – T3's
// own lesson («an arm measured on a tree that still carries the previous arm is not a measurement»),
// arriving through a probe rather than through an arm.

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's §B apparatus, carried by T2..T6's suites. Every
// draw is the engine's own; the mock exists only so §E can COUNT the keys a step reached.
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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { comebackMatchFactor, createWorld, kidMatchPlayerFor, type WorldState } from '../src/engine/world'
import { engineModuleSource } from './worldSource'
import { region, scriptCodeOf } from './helpers/source'
import type { MatchPlayer, Surface } from '../src/engine/match/types'

// ⚠⚠ THE RESEARCH'S OWN LITERALS, TRANSCRIBED AND NEVER READ OFF `ECONOMY` – wave 3's ARM 2 law,
// inherited through T2..T5's own `BRIEF` blocks: an expectation read out of the thing under test
// moves with it, so a silent retune has to walk past THIS line. The digest's sentence is
// «staged penalties ≈ −40% (0–3 mo) → −20% (3–6) → −10% (6–12) → full recovery 12+ mo», and the
// months are converted here exactly as the constant converts them, so the two conversions are
// checked against each other rather than one being read out of the other.
const BRIEF = {
  early: 0.6,
  mid: 0.8,
  late: 0.9,
  full: 1,
  threeMonths: 13,
  sixMonths: 26,
  twelveMonths: 52,
} as const

/** ⚠⚠ **THE REALISED RATIO IS NOT EXACTLY THE DRAFTED FACTOR, AND THE RESIDUE IS MEASURED RATHER
 *  THAN TOLERATED.** The factor multiplies at the same point `condition` and `spirit` do – BEFORE
 *  `applySurfaceStyle` and `applyKit` – and the kit step ends with an ADDITIVE term, so a wing scaled
 *  by 0.6 comes out a few thousandths above 0.6 of the unscaled one and converges as the factor rises.
 *  Measured over five seeds x five wings: max deviation **0.0041 at 0.6, 0.0021 at 0.8, 0.0011 at
 *  0.9**, always upward and always shrinking, which is the signature of exactly that additive tail
 *  and of nothing else. Two decimal places is comfortably inside it and nowhere near the 1.0 an
 *  unconditional factor (ARM 1) would produce, which is the arm this tolerance has to keep catching.
 *  ⚠ The EXACT statement lives in §B.1 and §B.3 instead, where `toEqual` on the whole object is the
 *  right instrument: absent ⇒ byte-identical is not a claim about a ratio. */
const RATIO_PLACES = 2

const SURFACE: Surface = 'hard'
const WINGS = ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const

beforeEach(() => {
  rngKeys.length = 0
})

/** A plain career parked on a real week, with no comeback and nothing exotic about her. */
function career(seed: string, week = 600): WorldState {
  const world = createWorld(seed)
  world.week = week
  world.condition = 100
  return world
}

/** The same career with a comeback that started `back` weeks ago. ⚠ A CLONE and not a mutation, so
 *  every case compares two worlds that differ in exactly one field. */
function withComeback(world: WorldState, back: number): WorldState {
  return {
    ...world,
    comeback: { returnedWeek: world.week - back, protectedRank: null, returnPlan: null },
  }
}

/** Her five wings, as the match engine would receive them. */
function wings(world: WorldState): number[] {
  const p: MatchPlayer = kidMatchPlayerFor(world, SURFACE)
  return WINGS.map((w) => p[w])
}

// =================================================================================================
// A. THE STAIRCASE – every boundary week, and the week before the return
// =================================================================================================
describe('wave 8 T6 A – the research\'s own staircase, at its boundaries', () => {
  it('⭐⭐⭐ −40% → −20% → −10% → full, pinned at the first and last week of every window', () => {
    const r = 1000
    // ⚠ THE BOUNDARY IS THE POINT. A rung's window opens ON its own week, so `r + 13` is the first
    // week of the −20% band and `r + 12` is the last of the −40% one. Every pair below is a
    // both-sides pin rather than a spot check, which is what catches an off-by-one (ARM 3).
    expect(comebackMatchFactor(r, r), 'the week she came back').toBe(BRIEF.early)
    expect(comebackMatchFactor(r, r + BRIEF.threeMonths - 1), 'the last week under −40%').toBe(BRIEF.early)
    expect(comebackMatchFactor(r, r + BRIEF.threeMonths), 'three months, and the ramp steps').toBe(BRIEF.mid)
    expect(comebackMatchFactor(r, r + BRIEF.sixMonths - 1), 'the last week under −20%').toBe(BRIEF.mid)
    expect(comebackMatchFactor(r, r + BRIEF.sixMonths), 'six months').toBe(BRIEF.late)
    expect(comebackMatchFactor(r, r + BRIEF.twelveMonths - 1), 'the last week under −10%').toBe(BRIEF.late)
    expect(comebackMatchFactor(r, r + BRIEF.twelveMonths), 'twelve months, and it is over').toBe(BRIEF.full)
    expect(comebackMatchFactor(r, r + 400), '...and stays over, for the rest of the career').toBe(BRIEF.full)
  })

  it('⚠ a week BEFORE the return takes no rung at all and reads 1.0', () => {
    // She was not back yet, so it is not a comeback match – and a stored `WorldMatch` from before the
    // pause must replay byte-identically even if something one day hands this its week.
    expect(comebackMatchFactor(1000, 999), 'the week before she came back').toBe(BRIEF.full)
    expect(comebackMatchFactor(1000, 500), 'and a season before that').toBe(BRIEF.full)
  })

  it('the windows are the research\'s MONTHS, converted once – 13 / 26 / 52 weeks', () => {
    // Stated as arithmetic rather than as three integers, which is how the constant states it: a
    // reader sees the digest's own staircase, and this line is the receipt that our weeks are its
    // months. ⚠ It is a claim about the CALENDAR (52 weeks a year) and not about a tuning knob.
    expect(BRIEF.threeMonths, 'three months of a 52-week year').toBe(52 / 4)
    expect(BRIEF.sixMonths, 'six months').toBe(52 / 2)
    expect(BRIEF.twelveMonths, 'twelve months').toBe(52)
  })
})

// =================================================================================================
// B. ABSENT ⇒ 1.0 – and the composed player is BYTE-IDENTICAL
// =================================================================================================
describe('wave 8 T6 B – a career that never paused composes exactly as it did', () => {
  it('⭐⭐⭐ `comeback: null` and the key ABSENT ENTIRELY compose to the same object', () => {
    const world = career('w8-t6-absent')
    const bare = { ...world } as Partial<WorldState>
    delete bare.comeback
    expect(kidMatchPlayerFor(bare as WorldState, SURFACE), 'no key and a null key are one state')
      .toEqual(kidMatchPlayerFor(world, SURFACE))
  })

  it('⭐⭐⭐ AND THE FACTOR IS REALLY 1.0 – not «1.0 because the ramp happens to be over»', () => {
    // ⚠⚠ THE ARM THIS CASE IS FOR IS THE ONE THE WHOLE HALF TURNS ON (ARM 1): a version that applied
    // the factor unconditionally – reading an absent comeback as «she came back this week» – would
    // make every career in the game a −40% player. The ratio is what says so: with no comeback her
    // wings are exactly 1/0.6 of the same girl's inside the first window, and under the arm the two
    // are equal.
    const world = career('w8-t6-ratio')
    const none = wings(world)
    const fresh = wings(withComeback(world, 0))
    expect(none.every((v) => v > 0), 'the fixture really produces a player').toBe(true)
    for (let i = 0; i < none.length; i++) {
      expect(fresh[i] / none[i], `${WINGS[i]}: the first window is the research's −40%`)
        .toBeCloseTo(BRIEF.early, RATIO_PLACES)
    }
  })

  it('a comeback more than twelve months old is byte-identical to no comeback at all', () => {
    // The other end of the same statement: the ramp really ends, and when it does the composition is
    // the one that shipped before this wave rather than one that merely rounds to it.
    const world = career('w8-t6-over')
    expect(kidMatchPlayerFor(withComeback(world, BRIEF.twelveMonths), SURFACE), 'full recovery is the identity')
      .toEqual(kidMatchPlayerFor(world, SURFACE))
  })
})

// =================================================================================================
// C. IT IS APPLIED – on the seam condition and spirit are on
// =================================================================================================
describe('wave 8 T6 C – the ramp reaches the court', () => {
  it('⭐⭐ the same girl on the same week is a weaker player inside the ramp', () => {
    const world = career('w8-t6-applied')
    const none = wings(world)
    for (const [back, factor] of [[0, BRIEF.early], [BRIEF.threeMonths, BRIEF.mid], [BRIEF.sixMonths, BRIEF.late]] as const) {
      const on = wings(withComeback(world, back))
      for (let i = 0; i < none.length; i++) {
        expect(on[i] / none[i], `${WINGS[i]} at ${back} weeks back`).toBeCloseTo(factor, RATIO_PLACES)
        expect(on[i], `${WINGS[i]}: and it really is lower`).toBeLessThan(none[i])
      }
    }
  })

  it('⚠ THE RAMP CLIMBS – each window is strictly stronger than the one before', () => {
    // ARM 2 (the table read first-rung-wins) is what this catches: it would hand every week the −40%
    // cell and the four bands would flatten into one.
    const world = career('w8-t6-climb')
    const at = (back: number) => wings(withComeback(world, back))[0]
    expect(at(0)).toBeLessThan(at(BRIEF.threeMonths))
    expect(at(BRIEF.threeMonths)).toBeLessThan(at(BRIEF.sixMonths))
    expect(at(BRIEF.sixMonths)).toBeLessThan(at(BRIEF.twelveMonths))
    expect(at(BRIEF.twelveMonths), 'and the top of the ramp is her').toBeCloseTo(wings(world)[0], 10)
  })
})

// =================================================================================================
// D. ⚠⚠ THE PARKED-SPEC BOUNDARY – it reads NOTHING from results
// =================================================================================================
describe('wave 8 T6 D – the factor is a function of time and of nothing else', () => {
  it('⭐⭐⭐ A CAREER\'S WHOLE MATCH HISTORY REPLACED, BOTH WAYS, AND THE FACTOR DOES NOT MOVE', () => {
    // ⚠⚠ THIS IS §0's FENCE MADE MECHANICAL AND IT IS THE CASE THE GATE LOOKS FOR FIRST.
    // `docs/specs/form-and-slump.md` is OWNER-PARKED; the staged factor is a time-shaped multiplier
    // on the ABSENCE and «any builder who finds themselves reading match outcomes into it stops and
    // brings it». So: the same world, the same week, the same comeback – and every result-shaped
    // thing the engine keeps replaced out from under it.
    //
    // ⚠⚠ **BOTH DIRECTIONS, AND THE SECOND ONE IS THERE BECAUSE THE FIRST DRAFT OF THIS CASE WAS A
    // WEAK NET – MEASURED, NOT SUSPECTED.** `createWorld` hands back a career that already holds
    // **671** result rows (the prologue's own book), so a mutation that merely *replaced* them with
    // sixty left a saturating results term reading the same number at both ends: ARM 7 went green
    // here and was caught only by the structural pin below. An EMPTY book and a STUFFED one are the
    // two ends nothing monotonic in the history can sit still across.
    const world = withComeback(career('w8-t6-parked'), 4)
    const before = wings(world)
    const factorBefore = comebackMatchFactor(world.comeback!.returnedWeek, world.week)
    expect(world.results.length, 'the fixture really starts with a book').toBeGreaterThan(100)

    const title = (i: number) => ({
      week: world.week - i, tier: 'slam', points: 2000, prize: 1_000_000, round: 'W', playerId: 'kid',
    })
    for (const [name, book] of [['emptied', []], ['stuffed', Array.from({ length: 200 }, (_, i) => title(i))]] as const) {
      world.results = book as never
      world.seasonHistory = [
        { seasonIndex: 10, byTrack: { wta: { endRank: 1, points: 12000 } } },
        { seasonIndex: 11, byTrack: { wta: { endRank: 400, points: 3 } } },
      ] as never
      world.kidRankWta = 1
      world.kidRank = 1
      world.kidRankDomestic = 1
      world.events = [] as never
      world.trophiesByTier = { slam: { titles: [world.week - 3], finals: [] } } as never
      expect(
        comebackMatchFactor(world.comeback!.returnedWeek, world.week),
        `⚠ ${name}: the factor is blind to every one of them`,
      ).toBe(factorBefore)
      expect(wings(world), `⚠⚠ ${name}: and so is the girl who steps on court`).toEqual(before)
    }
  })

  it('⭐⭐⭐ ...AND STRUCTURALLY, because a behavioural arm cannot see a clause that does not matter yet', () => {
    // T4's and T5's own instrument (the decoupling law's structural half), pointed at the parked
    // spec: the function's own text, comments stripped, may not name a single result-shaped thing.
    // ⚠ THE REGION IS CUT WITH THE MARKER HELPERS, never a raw `indexOf` – `tests/helpers/source.ts`
    // throws on an absent marker, and a silently-widened region is the failure mode the ratchet
    // exists for.
    const body = scriptCodeOf(
      region(
        engineModuleSource('world'),
        'export function comebackMatchFactor(',
        '/** THE COMPOSITION POINT:',
      ),
    )
    for (const banned of ['results', 'seasonHistory', 'points', 'kidRank', 'events', 'trophies', 'form', 'win']) {
      expect(body.includes(banned), `⚠ the factor names \`${banned}\` – the parked spec by the back door`).toBe(false)
    }
    // ...and the POSITIVE half, so the pin cannot pass by reading an empty string: it really is the
    // function, and it really does read the two weeks.
    expect(body.includes('returnedWeek'), 'it reads the week she came back').toBe(true)
    expect(body.includes('comebackStages'), 'and the research\'s own staircase').toBe(true)
  })

  it('⚠ the ARGUMENT TYPE carries `returnedWeek` and nothing else – the fence as a type', () => {
    // A factor that cannot be HANDED a result cannot read one. The narrow arg type declares
    // `comeback?: { returnedWeek: number } | null`, so the freeze, the world and every ledger on it
    // are out of scope at the call site rather than merely unread.
    const decl = scriptCodeOf(
      region(engineModuleSource('world'), 'comeback?: {', 'kidMatchPlayerFor'),
    )
    expect(decl.includes('returnedWeek'), 'the one field it is given').toBe(true)
    expect(decl.includes('protectedRank'), '⚠ and not the freeze, which would have carried a ledger in').toBe(false)
  })
})

// =================================================================================================
// E. THE DRAWS – zero
// =================================================================================================
describe('wave 8 T6 E – half 2 takes no draw at all', () => {
  it('the factor and the composition are draw-free on every stream', () => {
    const world = withComeback(career('w8-t6-draws'), 8)
    rngKeys.length = 0
    comebackMatchFactor(world.comeback!.returnedWeek, world.week)
    kidMatchPlayerFor(world, SURFACE)
    // ⚠ THE POSITIVE CONTROL IS THE COMPOSITION ITSELF: `kidMatchPlayerFor` DOES reach
    // purpose-scoped streams (the birth build and the kit's wear), so a recorder that saw nothing
    // would be a broken recorder. What must be absent is a `:life:` key – this half asks her life
    // nothing.
    expect(rngKeys.length, 'control: the composer really does reach the recorder').toBeGreaterThan(0)
    expect(rngKeys.filter((k) => k.includes(':life:')), '⚠ and nothing of the life layer is drawn').toEqual([])
  })
})
