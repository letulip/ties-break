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
import { comebackMatchFactor, createWorld, kidMatchPlayer, kidMatchPlayerFor, type WorldState } from '../src/engine/world'
import { SKILL_LAW } from '../src/engine/season/fieldPros'
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
  // ⭐⭐⭐ RE-DENOMINATED AT WAVE 8b T3 ON HIS WORD OF 21.09, «да, деноминируем». These were
  // `0.6 / 0.8 / 0.9 / 1` – MULTIPLIERS on her wings – and the research measured what that meant:
  // x0.6 on a #31 is -477 Elo at this engine's own rate, a returner playing like #380 for three
  // months. The rungs are now the handicap itself, in the currency `fieldPros.ts` keeps its whole
  // table in, and the four are the staircase document's §5 proposal.
  earlyElo: 200,
  midElo: 100,
  lateElo: 50,
  fullElo: 0,
  threeMonths: 13,
  sixMonths: 26,
  twelveMonths: 52,
  // ⚠⚠ TRANSCRIBED HERE AND **IMPORTED IN THE ENGINE**, AND THE ASYMMETRY IS THE POINT OF BOTH
  // RULES. The engine may hold exactly ONE spelling of this rate (`SKILL_LAW.eloPerCore`, by import
  // - a copied 20.2 there is the drift CLAUDE.md's barrel lesson exists for); a TEST must hold its
  // own, or the expectation moves with the thing under test. The receipt case below is what keeps
  // the two honest: they are checked AGAINST each other, never read out of one another.
  eloPerCore: 20.2,
} as const

/** The factor the re-denominated staircase owes a player of this build at this rung – the same
 *  arithmetic the constant's own note states, written out once here rather than at six call sites. */
const factorFor = (core: number, dElo: number): number => Math.max(0.5, (core - dElo / BRIEF.eloPerCore) / core)

/** Her overall(4) as `kidMatchPlayerFor` computes it – the BUILD, before condition, spirit, the
 *  surface and the kit, which is the scale `eloPerCore` was measured on. */
function coreOf(world: WorldState): number {
  const raw = kidMatchPlayer(world)
  return (raw.serve + raw.ret + raw.composure + raw.stamina) / 4
}

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
  it('⭐⭐⭐ −200 → −100 → −50 → 0 Elo, pinned at the first and last week of every window', () => {
    const r = 1000
    // ⚠ THE BOUNDARY IS THE POINT. A rung's window opens ON its own week, so `r + 13` is the first
    // week of the −100 band and `r + 12` is the last of the −200 one. Every pair below is a
    // both-sides pin rather than a spot check, which is what catches an off-by-one (ARM 3).
    // ⚠ A REAL BUILD RATHER THAN A ROUND NUMBER: the factor is per PLAYER since the re-denomination,
    // so the case has to hand it one. 60 is squarely inside the professional band (`SKILL_LAW.top`
    // is 76.4, the tourElite floor 67, elite 56–66), which is where a returner actually lives.
    const C = 60
    const at = (w: number) => comebackMatchFactor(r, w, C)
    expect(at(r), 'the week she came back').toBe(factorFor(C, BRIEF.earlyElo))
    expect(at(r + BRIEF.threeMonths - 1), 'the last week under −200 Elo').toBe(factorFor(C, BRIEF.earlyElo))
    expect(at(r + BRIEF.threeMonths), 'three months, and the ramp steps').toBe(factorFor(C, BRIEF.midElo))
    expect(at(r + BRIEF.sixMonths - 1), 'the last week under −100 Elo').toBe(factorFor(C, BRIEF.midElo))
    expect(at(r + BRIEF.sixMonths), 'six months').toBe(factorFor(C, BRIEF.lateElo))
    expect(at(r + BRIEF.twelveMonths - 1), 'the last week under −50 Elo').toBe(factorFor(C, BRIEF.lateElo))
    expect(at(r + BRIEF.twelveMonths), 'twelve months, and it is over').toBe(1)
    expect(at(r + 400), '...and stays over, for the rest of the career').toBe(1)
  })

  it('⭐⭐⭐ THE SAME HANDICAP IS A DIFFERENT FRACTION OF A DIFFERENT PLAYER – the whole re-denomination', () => {
    // ⚠⚠ THIS IS THE CASE THE OLD FILE COULD NOT HAVE HAD, and it is what «denominated in Elo»
    // MEANS: a rating handicap costs every player the same number of RATING points and therefore a
    // different share of her wings. Under the shipped multipliers a #15 and a #200 both lost 40% of
    // themselves, which is how the first rung came to be worth −477 Elo on a #31.
    const r = 1000
    const strong = comebackMatchFactor(r, r, 70)
    const weak = comebackMatchFactor(r, r, 50)
    expect(strong, 'the stronger build keeps more of herself').toBeGreaterThan(weak)
    // ...and the ELO cost is the same for both, which is the property the factor exists to express.
    expect((1 - strong) * 70 * BRIEF.eloPerCore, 'the handicap in Elo').toBeCloseTo(BRIEF.earlyElo, 6)
    expect((1 - weak) * 50 * BRIEF.eloPerCore, '...and it is the same handicap').toBeCloseTo(BRIEF.earlyElo, 6)
  })

  it('⚠ a week BEFORE the return takes no rung at all and reads EXACTLY 1.0', () => {
    // She was not back yet, so it is not a comeback match – and a stored `WorldMatch` from before the
    // pause must replay byte-identically even if something one day hands this its week. ⚠ `toBe(1)`
    // and not `toBeCloseTo`: `(C − 0) / C` is exact in IEEE-754, and the exactness is what the
    // byte-identity in §B rests on.
    expect(comebackMatchFactor(1000, 999, 60), 'the week before she came back').toBe(1)
    expect(comebackMatchFactor(1000, 500, 60), 'and a season before that').toBe(1)
  })

  it('⚠⚠ the rate is ONE number in the engine, and this file\'s copy is checked AGAINST it', () => {
    // ⚠ THE DRIFT THE BRIEF NAMES, MADE MECHANICAL. `SKILL_LAW.eloPerCore` is measured off this
    // engine's own closed form and its note says it moves only if `SKILL_K`/`RALLY_K` move, «in which
    // case every anchor must be re-derived, not rescaled by eye». Two spellings of it is exactly the
    // barrel lesson – so the ENGINE imports, this FILE transcribes, and this line is the receipt.
    // The day the rate is re-measured, this goes red and somebody re-derives the rungs on purpose.
    expect(BRIEF.eloPerCore, 'the transcription still matches the engine\'s one spelling')
      .toBe(SKILL_LAW.eloPerCore)
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
    // make every career in the game a −200 Elo player. The ratio is what says so: with no comeback
    // her wings are the same girl's inside the first window divided by the rung's own factor, and
    // under the arm the two are equal.
    const world = career('w8-t6-ratio')
    const none = wings(world)
    const fresh = wings(withComeback(world, 0))
    const expected = factorFor(coreOf(world), BRIEF.earlyElo)
    expect(none.every((v) => v > 0), 'the fixture really produces a player').toBe(true)
    // ⚠ AND THE EXPECTATION IS NOT 1: a case whose target happened to be the identity would pass
    // under ARM 1 and prove nothing at all.
    expect(expected, 'the first rung really costs her something').toBeLessThan(0.95)
    for (let i = 0; i < none.length; i++) {
      expect(fresh[i] / none[i], `${WINGS[i]}: the first window is −${BRIEF.earlyElo} Elo of her build`)
        .toBeCloseTo(expected, RATIO_PLACES)
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
    const C = coreOf(world)
    for (const [back, dElo] of [[0, BRIEF.earlyElo], [BRIEF.threeMonths, BRIEF.midElo], [BRIEF.sixMonths, BRIEF.lateElo]] as const) {
      const on = wings(withComeback(world, back))
      for (let i = 0; i < none.length; i++) {
        expect(on[i] / none[i], `${WINGS[i]} at ${back} weeks back`).toBeCloseTo(factorFor(C, dElo), RATIO_PLACES)
        expect(on[i], `${WINGS[i]}: and it really is lower`).toBeLessThan(none[i])
      }
    }
  })

  it('⚠ THE RAMP CLIMBS – each window is strictly stronger than the one before', () => {
    // ARM 2 (the table read first-rung-wins) is what this catches: it would hand every week the
    // −200 Elo cell and the four bands would flatten into one.
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
    const C = coreOf(world)
    const factorBefore = comebackMatchFactor(world.comeback!.returnedWeek, world.week, C)
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
        comebackMatchFactor(world.comeback!.returnedWeek, world.week, C),
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
    // ⭐⭐⭐ WAVE 8b T3 – AND THE RATE IS THE ENGINE'S ONE SPELLING, STRUCTURALLY. The brief's own
    // sentence: «IMPORT `SKILL_LAW.eloPerCore` – NEVER a copied `20.2`: two spellings of one rate is
    // exactly the drift CLAUDE.md's barrel lesson exists for.» A behavioural arm cannot see this –
    // a pasted literal produces the identical number today and drifts silently the day the rate is
    // re-measured – so it is pinned where it can be seen at all.
    expect(body.includes('eloPerCore'), '⚠ the factor no longer names the exchange rate').toBe(true)
    expect(body.includes('20.2'), '⚠⚠ the rate is COPIED here – import it from season/fieldPros').toBe(false)
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
    comebackMatchFactor(world.comeback!.returnedWeek, world.week, coreOf(world))
    kidMatchPlayerFor(world, SURFACE)
    // ⚠ THE POSITIVE CONTROL IS THE COMPOSITION ITSELF: `kidMatchPlayerFor` DOES reach
    // purpose-scoped streams (the birth build and the kit's wear), so a recorder that saw nothing
    // would be a broken recorder. What must be absent is a `:life:` key – this half asks her life
    // nothing.
    expect(rngKeys.length, 'control: the composer really does reach the recorder').toBeGreaterThan(0)
    expect(rngKeys.filter((k) => k.includes(':life:')), '⚠ and nothing of the life layer is drawn').toEqual([])
  })
})
