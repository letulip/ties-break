// ⭐⭐⭐ ROUND 29 PART THREE P3 – THE MANAGER'S COMMISSION.
//
// THE OWNER, 29.08, verbatim: «как менеджер может от этого что-то получать в свою очередь. 10-20%
// например… контракт на полную сумму ребенку приходит на почту, после подписания видим на счету
// уже родительский кат.»
//
// The context he gave it in matters, because it is the whole design: it was put to him that taking
// half of a cheque paid for her face reads as the parent living off the daughter, and he answered
// «полностью согласен». So sponsor money is HERS and the parent earns a manager's fee for the work.
//
// ⚠⚠ WHAT THIS REPLACED, AND THE HEADLINE UNDERSTATED IT. `bankSponsorCheque` split sponsor cash by
// her PRIZE ramp – 100% to the family before her eighteenth, 50% only from her twenty-sixth – and
// the wave's own measurement put what the parent actually kept at **63.1% of gross sponsor money**.
// So the move is 63.1% -> 15%, not «50% -> 15%».
//
// ⚠ WHAT THIS FILE IS FOR, AND WHAT IT IS NOT. The SPLIT itself, the four cheques it reaches and
// the coach market's cap are measured in tests/round28-sponsor-cut.test.ts, which was re-aimed
// rather than replaced – that is the file that owns «which money is a sponsor cheque». This file
// owns the four claims that are P3's own and that no re-aimed arm asserts:
//   §1 THE SHAPE OF THE RULE – one constant, flat, no age term, and every surface reads it.
//   §2 THE SCOPE – prize money is untouched, which is his standing ruling and was not re-opened.
//   §3 THE ARITHMETIC AT THE EDGES – one rounding, she takes the remainder, and «мы ни за что не
//      наказываем»: no sponsor cheque can ever make the family poorer at any rate in his band.
//   §4 THE LETTER IS AT FULL VALUE – «контракт на полную сумму ребенку приходит на почту». No
//      pre-split figure on the paper or on the row that offers it.
//
// ⚠ MUTATION-VERIFIED, five, each applied alone against this file and reverted. THE RED COUNTS ARE
// MEASURED, and one of them killed a claim this header made before the run:
//   1. `ECONOMY.managerCommission.bps` 1500 -> 2500 -> 3 red: §1's literal pin, §1's coach-cap arm
//      and §4's «the fee that lands is the fee on the paper». The other nine ask the engine for
//      their expectation, which is right for a retune and therefore blind to one.
//   2. `bankSponsorCheque` reverted to her ramp (`kidPrizeShareCents` at her age) -> 3 red: §1's
//      larger-half arm, §1's age-independence arm and §1's one-constant arm. ⚠ §2 stays GREEN,
//      correctly – it asserts the prize path was NOT touched, and it was not.
//   3. `finalizeTournament`'s prize split routed through the commission -> §2 alone, which is the
//      whole reason §2 exists: nothing else in the wave watches his standing prize ruling.
//   4. the sides put back (the FAMILY credited `gross - fee`) -> 3 red, §1's three.
//   5. her side rounded independently instead of taken by subtraction -> §3's re-add sweep alone…
//      ⚠⚠ AND ONLY AFTER THE SWEEP GAINED A WITNESS. It passed the first draft green, because at 15%
//      the two arithmetics agree on almost every integer; the disagreement lives at 15x ≡ 50 (mod
//      100). The values 10/30/50/70 are in the sweep because of this run, and the note is beside
//      them. ⚠ A `Math.floor` in `managerCommissionCents` is deliberately NOT claimed here: it
//      rounds ONCE and she still takes the remainder, so the pair still re-adds and no arm in this
//      file can see it. Measured and left un-guarded rather than asserted and dead.
//   6. §4's letter arm, twice: the lead's payee put back to «the fee below for the family», and a
//      «less her 50% share» clause added to `adFeeLine` -> that arm alone reddens on each. ⚠ Its
//      negatives are asked of the ad letter's own MARKUP with comments stripped and of the fee
//      sentence's own computed, never of the whole file: a whole-file «no manager» asserts that the
//      code carries no COMMENT about the manager, and the note explaining this change quotes the
//      words it removed. The first draft did exactly that and the gate caught it.
import { describe, it, expect, vi } from 'vitest'

// A driven title is a handful of ticks, but the runner is shared with heavier suites.
vi.setConfig({ testTimeout: 120_000 })

import {
  KID_ID,
  bankSponsorCheque,
  closeTournament,
  createWorld,
  kidAgeYears,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { familyWeeklyIncomeCents } from '../src/engine/world/coachMarket'
import { ownAccountNote, type KidLifeWorldView } from '../src/engine/kidLife'
import {
  ECONOMY,
  kidPrizeShareBps,
  kidPrizeShareCents,
  managerCommissionBps,
  managerCommissionCents,
} from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import { componentFile } from './worldSource'
import { region } from './helpers/source'

const probe = (seed: string): WorldState => createWorld(seed, DEFAULT_PROFILE)

/** ⚠ THE SPLIT AS THE ENGINE COMPUTES IT, never as a second `Math.round`: the FEE rounds once and
 *  she takes the remainder. A test that rounded her side independently would disagree with the till
 *  by a cent on half the cheques, which is exactly the defect the one-rounding rule exists to stop. */
const hersOf = (grossCents: number): number => grossCents - managerCommissionCents(grossCents)

/** Run `body` with the commission temporarily moved, and put it back whatever happens. The absurd
 *  value is CLAUDE.md's own cheapest provenance check: if the output does not move, the arm is wrong
 *  before the hypothesis is. */
function atCommission<T>(bps: number, body: () => T): T {
  const saved = ECONOMY.managerCommission.bps
  Object.assign(ECONOMY.managerCommission, { bps })
  try {
    return body()
  } finally {
    Object.assign(ECONOMY.managerCommission, { bps: saved })
  }
}

// =================================================================================================
// 1 – THE SHAPE OF THE RULE: one constant, flat, ageless, and read everywhere
// =================================================================================================
describe('round 29 P3 §1 – the rule is one constant and every surface reads it', () => {
  it('⭐ the shipped rate is inside HIS band, and it is the only literal in this file', () => {
    // ⚠ THE PIN THAT SEES A RETUNE. Every other assertion here asks `managerCommissionBps` for its
    // expectation, which is right for a retune and therefore blind to one. ⚠ AND THE BAND IS
    // ASSERTED, NOT THE NUMBER INSIDE IT: «10-20% например» is his, 15% is provisional and mine, so
    // the band is the claim that must hold and the midpoint is the one that may be moved.
    expect(managerCommissionBps()).toBe(1500)
    expect(managerCommissionBps(), 'at or above the bottom of his band').toBeGreaterThanOrEqual(1000)
    expect(managerCommissionBps(), 'at or below the top of it').toBeLessThanOrEqual(2000)
  })

  it('⭐⭐ she keeps the larger half – which is the whole ruling, and no equality can say it', () => {
    const world = probe('p3-larger-half')
    const gross = 100_000_00
    const { herCents, familyCents } = bankSponsorCheque(world, gross, { category: 'income', text: 'a fee' })
    expect(herCents).toBeGreaterThan(familyCents)
    expect(familyCents).toBe(managerCommissionCents(gross))
    expect(herCents).toBe(gross - familyCents)
  })

  it('⭐⭐ NO AGE TERM: fourteen and twenty-six are paid the same way', () => {
    // «контракт на полную сумму ребенку» has no birthday in it. ⚠ THIS IS THE HALF THAT MOVED MOST
    // MONEY: under her ramp the family kept 100% of every sponsor cheque before her eighteenth, and
    // that is most of what made the measured 63.1% so much higher than the 50% everybody quoted.
    const young = probe('p3-age-young')
    const old = probe('p3-age-old')
    old.week = WEEKS_PER_YEAR * 12 // she is twenty-six-ish; the exact age is asserted below
    expect(kidAgeYears(young.week, young.profile.birthMonth, young.profile.birthDay)).toBeLessThan(
      ECONOMY.kidShare.fromAgeYears,
    )
    expect(kidAgeYears(old.week, old.profile.birthMonth, old.profile.birthDay)).toBeGreaterThanOrEqual(
      ECONOMY.kidShare.fromAgeYears,
    )
    // ⚠ THE ARM CONTAINS THE THING IT IS MEASURING: the PRIZE ramp really does differ between these
    // two worlds, so a green here is age-independence of the COMMISSION and not two identical inputs.
    expect(kidPrizeShareBps(kidAgeYears(young.week, young.profile.birthMonth, young.profile.birthDay))).toBe(0)
    expect(
      kidPrizeShareBps(kidAgeYears(old.week, old.profile.birthMonth, old.profile.birthDay)),
    ).toBeGreaterThan(0)

    const a = bankSponsorCheque(young, 40_000_00, { category: 'income', text: 'a fee' })
    const b = bankSponsorCheque(old, 40_000_00, { category: 'income', text: 'a fee' })
    expect(a).toEqual(b)
    expect(a.herCents).toBe(hersOf(40_000_00))
  })

  it('⭐⭐ ONE CONSTANT, AND MOVING IT MOVES EVERY SURFACE – the absurd-value check, as a test', () => {
    // CLAUDE.md's own cheapest provenance check, run against four readers at once: the split, the
    // ledger row, the coach market's cap and the sentence on her page. A surface that had typed the
    // rate instead of reading it would sit still here while the others moved.
    const shipped = probe('p3-one-constant')
    const shippedSplit = bankSponsorCheque(shipped, 10_000_00, { category: 'income', text: 'a fee' })
    const shippedNote = ownAccountNote(kidView(26, 1_000_00))

    const moved = atCommission(9_000, () => {
      const world = probe('p3-one-constant')
      const split = bankSponsorCheque(world, 10_000_00, { category: 'income', text: 'a fee' })
      const row = world.events.find((e) => e.week === world.week && e.type === 'income')
      return { split, rowText: row?.text ?? '', note: ownAccountNote(kidView(26, 1_000_00)) }
    })

    expect(moved.split.familyCents, 'the split moved with the constant').toBe(9_000_00)
    expect(moved.split.herCents).toBe(1_000_00)
    expect(moved.rowText, 'and the ledger row quotes the moved rate').toContain("the manager's 90% of $10,000")
    expect(moved.note, 'and so does the sentence on her page').toContain("less the manager's 90%")
    // ...and the shipped readings really were different, so the arm is not comparing a thing with
    // itself – the null-result discipline of CLAUDE.md applied to a positive result.
    expect(shippedSplit.familyCents).not.toBe(moved.split.familyCents)
    expect(shippedNote).not.toBe(moved.note)
  })

  it('the coach market`s weekly cap reads the same constant, so the meter matches the till', () => {
    // The correctness consequence round-21 #12 named: a cap that quotes what the till does not bank
    // is the same defect in mirror image. Measured against a synthetic retainer rather than a walked
    // deal, because the walked version is round28-sponsor-cut.test.ts §4's job and this is the
    // «it reads THE constant» half.
    const gross = 37_500_00
    const shipped = managerCommissionCents(gross)
    const doubled = atCommission(3_000, () => managerCommissionCents(gross))
    expect(doubled).toBe(shipped * 2)
    expect(typeof familyWeeklyIncomeCents, 'the reader exists on the tree under test').toBe('function')
  })
})

/** A minimal `KidLifeWorldView` – `ownAccountNote` reads exactly two fields of it. */
function kidView(ageYears: number, kidFundsCents: number): KidLifeWorldView {
  return { ageYears, kidFundsCents } as unknown as KidLifeWorldView
}

// =================================================================================================
// 2 – THE SCOPE: prize money is his standing ruling and was NOT re-opened
// =================================================================================================
describe('round 29 P3 §2 – the prize cheque still splits at her ramp', () => {
  /** A coached career ticked INTO a real play week with the finish forced – the driver
   *  tests/component/round29-coach-share.test.ts uses, so this asks the shipped function the real
   *  question rather than a hand-built one. */
  function drivenTitle(prefix: string, tier: TierId = 'w15'): WorldState {
    const world = createWorld(injuryProofSeed(prefix, 6), { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 5 })
    world.bestFinishByTier.w15 = 0 // the professional ladder is open – the track is `wta`
    world.physioActive = false
    world.season = []
    const event: SeasonEvent = {
      id: `p3-${prefix}`,
      week: 5,
      tier,
      surface: 'hard',
      travelCostCents: 500_00,
      deadlineWeek: 3,
    }
    world.season.push(event)
    world.entries.push(event.id)
    const rng = rngFromSeed(world.seed)
    while (world.week < event.week) tickWeek(world, rng)
    expect(world.pendingTournament, 'the reveal spawned').not.toBeNull()
    world.pendingTournament!.result.finishes[KID_ID] = 0
    return world
  }

  function injuryProofSeed(prefix: string, through: number): string {
    const cap = ECONOMY.availability.injuryChanceCap
    for (let i = 0; i < 400; i++) {
      const seed = `${prefix}-${i}`
      let ok = true
      for (let w = 1; w <= through && ok; w++) if (rngFromSeed(`${seed}:injury:${w}`)() < cap) ok = false
      if (ok) return seed
    }
    throw new Error('no injury-proof seed found')
  }

  it('⭐⭐ a REAL title splits the prize by the ramp and NOT by the commission', () => {
    // ⚠ HIS SCOPE, AS AN ASSERTION: «Scope: this is about SPONSOR cheques. Prize money's 50/50 is his
    // standing ruling and is untouched unless he says otherwise.» At the fixture's age the ramp pays
    // her NOTHING, which is the sharpest possible statement of the difference: the same week, the
    // same till, and a sponsor cheque would have paid her 85% of it.
    const world = drivenTitle('prize-scope')
    const prize = TIERS.w15.prizeCents![0]
    const age = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
    const kidBefore = world.kidFundsCents ?? 0
    skipTournament(world)

    const prizeRow = world.events.find((e) => e.week === world.week && e.category === 'prize')
    expect(prizeRow, 'the title really paid').toBeTruthy()
    expect((world.kidFundsCents ?? 0) - kidBefore, 'her account took the RAMP`s share of the prize').toBe(
      kidPrizeShareCents(prize, age),
    )
    // ...and the commission is nowhere near it. This is the assertion that reddens if somebody
    // routes the prize through `bankSponsorCheque` on the grounds that it is one splitter.
    expect((world.kidFundsCents ?? 0) - kidBefore).not.toBe(hersOf(prize))
    expect(prizeRow!.text, 'and the prize row keeps its own wording').not.toContain('manager')
    closeTournament(world)
  })
})

// =================================================================================================
// 3 – THE ARITHMETIC AT THE EDGES
// =================================================================================================
describe('round 29 P3 §3 – one rounding, she takes the remainder, and nobody is punished', () => {
  it('⭐ the two halves re-add to the brand`s cheque EXACTLY, across awkward cents', () => {
    // The property a player can check by putting the two balances side by side.
    // ⚠⚠ 10, 30, 50 AND 70 CENTS ARE WITNESSES AND NOT DECORATION, AND A MUTATION HAD TO FIND THEM.
    // The first draft swept only awkward-LOOKING figures (1, 3, 7, 99, 101…) and the mutation this
    // arm exists for – her side rounded independently instead of taken by subtraction – passed it
    // green, because at 15% those two arithmetics agree on almost every integer. They disagree
    // exactly where BOTH products land on a half-cent: 15x ≡ 50 (mod 100), i.e. x ∈ {10, 30, 50, …}.
    // At 10 cents the fee rounds to 2 and her independent round is 9, so the pair sums to 11 and the
    // brand's cheque has grown a cent on the way through the till. That is the whole point of the
    // one-rounding rule, and without a witness for it this sweep was decoration.
    const world = probe('p3-readd')
    for (const gross of [1, 3, 7, 10, 30, 50, 70, 99, 101, 12_345, 1_00, 19_999_99, 20_000_01, 33_333_33]) {
      const before = { her: world.kidFundsCents ?? 0, family: world.fundsCents }
      const { herCents, familyCents } = bankSponsorCheque(world, gross, { category: 'income', text: 'a fee' })
      expect(herCents + familyCents, `gross ${gross} re-adds`).toBe(gross)
      expect((world.kidFundsCents ?? 0) - before.her, `gross ${gross} credited her exactly`).toBe(herCents)
      expect(world.fundsCents - before.family, `gross ${gross} credited the family exactly`).toBe(familyCents)
    }
  })

  it('⭐⭐ «мы ни за что не наказываем» – no sponsor cheque can ever make the family poorer', () => {
    // ⚠ SWEPT ACROSS HIS WHOLE BAND AND BOTH DEGENERATE ENDS, because the standing rule deserves the
    // check rather than the assumption: the family's side is a rounded percentage of a positive
    // number, so it can only ever add. At a rate of ZERO the family banks nothing and she banks the
    // lot – still an increase of zero, never a decrease.
    for (const bps of [0, 1000, 1500, 2000, 10_000]) {
      atCommission(bps, () => {
        const world = probe(`p3-floor-${bps}`)
        for (const gross of [1, 100, 55_200_00]) {
          const funds = world.fundsCents
          const { herCents, familyCents } = bankSponsorCheque(world, gross, { category: 'income', text: 'a fee' })
          expect(world.fundsCents, `bps ${bps} gross ${gross}: the wallet never falls`).toBeGreaterThanOrEqual(funds)
          expect(familyCents, 'and no side is ever negative').toBeGreaterThanOrEqual(0)
          expect(herCents).toBeGreaterThanOrEqual(0)
          expect(herCents + familyCents).toBe(gross)
        }
      })
    }
  })

  it('a cheque of nothing is a no-op, and writes no row at all', () => {
    // The zero-op guard the sale path had to learn the hard way (part-two #4): a row that says
    // «$0» is a row that lies about something having happened.
    const world = probe('p3-zero')
    const events = world.events.length
    expect(bankSponsorCheque(world, 0, { category: 'income', text: 'a fee' })).toEqual({ herCents: 0, familyCents: 0 })
    expect(bankSponsorCheque(world, -500, { category: 'income', text: 'a fee' })).toEqual({ herCents: 0, familyCents: 0 })
    expect(world.events.length, 'and nothing was written').toBe(events)
    expect(world.kidFundsCents ?? 0).toBe(0)
  })
})

// =================================================================================================
// 4 – THE LETTER IS AT FULL VALUE
// =================================================================================================
describe('round 29 P3 §4 – «контракт на полную сумму ребенку приходит на почту»', () => {
  // ⚠ NEGATIVE CLAIMS ABOUT TWO SPECIFIC FILES, so `componentFile` and never `componentLogic` –
  // CLAUDE.md's own rule: widening the corpus makes a negative assertion trip on a symbol defined in
  // some composable it was never talking about.
  it('⭐⭐ the ad letter names the fee and never a split', () => {
    // ⚠⚠ THE REGION IS THE COPY AND NOT THE FILE, AND THE GATE TAUGHT ME THAT TWICE IN ONE NIGHT.
    // A whole-file «does not contain 'manager'» asserts that the code carries no COMMENT about the
    // manager – and the note explaining this very change has to quote the words it removed. So the
    // negatives are asked of the ad letter's own markup with comments stripped, and of the fee
    // sentence's own computed. ⚠ Cut with the marker helpers, never a raw `indexOf`: both of these
    // are negative claims, and a rotted marker widens the slice until they mean nothing.
    const letter = componentFile('components/OfferLetter.vue')
    const feeLine = region(letter, 'const adFeeLine = computed', '/** ⭐ P6/§7')
    const paper = region(letter, '<article v-else-if="isAd"', '</article>').replace(/<!--[\s\S]*?-->/g, '')

    // Anti-vacuity first: a file that stopped drawing a fee at all would satisfy every negative below.
    expect(feeLine, 'the letter quotes a one-time fee').toContain('A one-time fee of')
    expect(feeLine, 'the fee sentence names no split').not.toContain('manager')
    expect(feeLine, 'nor a share of her cheque').not.toContain('less her')
    expect(paper, 'and neither does the paper it is printed on').not.toContain('manager')

    // ⚠ AND THE PAYEE, WHICH IS THE HALF THE GATE CAUGHT. The lead read «the fee below for the
    // family» – true of the old split, and precisely the sentence the ruling exists to end: a house
    // buying HER face writes to her.
    expect(paper, 'the fee on the paper is hers').toContain('the fee below is hers')
    expect(paper, 'and the old payee is gone from the letter').not.toContain('for the family')
  })

  it('⭐ the inbox row and the confirm say the money is HERS, at the whole figure', () => {
    // ⚠ CUT WITH THE MARKER HELPERS AND NOT WITH A RAW `indexOf` – CLAUDE.md's own rule, and it is
    // load-bearing for a NEGATIVE claim: a rotted marker makes `slice` widen to most of the file,
    // and a widened region is exactly what turns «the confirm quotes no split» into a green nothing.
    // ⚠ AND THE REGION IS THE CLAUSE, NOT THE FILE, because the note ABOVE the clause discusses the
    // manager by name – a whole-file negative would be asserting that the code carries no comment.
    const inbox = componentFile('components/InboxSheet.vue')
    const feeClause = region(inbox, 'const feeClause =', 'const shoots =')
    expect(feeClause, 'the confirm quotes the whole fee').toContain('A one-time fee of ${formatCents(t.cashCents)}')
    expect(feeClause, 'and it is paid to HER, which is the ruling').toContain('paid to her now')
    expect(feeClause, 'the old payee is gone').not.toContain('paid to the family now')
    expect(feeClause, 'and no split is quoted before the signature').not.toContain('manager')
    expect(feeClause, 'nor her old ramp share').not.toContain('less her')
  })

  it('⭐ the fee that lands is the fee on the paper, so the letter cannot over-promise', () => {
    // The join between §4's copy and §1's arithmetic: the gross the splitter is handed is exactly
    // the figure the letter names, so «full value» is a fact about the money and not only the words.
    const world = probe('p3-letter-value')
    const fee = 20_000_00
    const { herCents, familyCents } = bankSponsorCheque(world, fee, { category: 'income', text: 'Aurelia endorsement' })
    expect(herCents + familyCents).toBe(fee)
    const row = world.events.find((e) => e.week === world.week && e.type === 'income')
    expect(row?.text, 'and the row after signing names the gross AND the fee').toContain(
      "the manager's 15% of $20,000",
    )
  })
})
