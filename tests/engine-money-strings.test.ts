import { describe, it, expect } from 'vitest'
import { formatCents, formatCentsSigned } from '../src/shared/money'
import { ECONOMY, prologueFundsCents } from '../src/engine/economy'
import { createWorld, maybeFireSeasonWrapUp, type WorldState } from '../src/engine/world'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { FamilyBackground } from '../src/shared/protocol'

// =================================================================================================
// ⭐⭐ E-12 / D-02 (05.09 REVIEW) – THE ENGINE'S HAND-ROLLED DOLLAR STRINGS, PINNED ACROSS THE SWAP.
//
// Five engine sites built a dollar string by hand while `shared/money.ts` produced the identical
// one. Three were replaced by the helper (`world.ts` first-prize, `world/sponsors.ts` kit worth,
// `world/milestones.ts` season funds delta); `world/college.ts`'s `moneyClause` stays, because its
// sign is a different SENTENCE and not a different number, which its own comment argues.
//
// ⚠⚠ THE POINT OF THIS FILE IS THAT THE STRINGS DID NOT MOVE, AND IT IS AN INDEPENDENT
// RESTATEMENT ON PURPOSE. `oldUnsigned` / `oldSigned` below are the deleted expressions, copied
// character for character out of the pre-change source, so what is compared is the two
// implementations and not `formatCents` against itself. The same discipline `tests/plan.test.ts`
// and `tests/season/surnames.test.ts` state for their own restatements: «re-spelled in the test so
// the reproduction is independent of the implementation it is checking».
//
// ⚠ AND ONE OF THE FIVE WAS *NOT* REPLACED, BECAUSE THE REVIEW'S «BYTE-IDENTICAL» IS FALSE THERE.
// `world.ts:1487`, the career-opening line, prints `$${(fundsCents / 100).toLocaleString('en-US')}`
// with NO rounding. D-02 called that a latent risk – "until a background's opening balance is
// retuned to a non-whole figure" – and the childhood prologue has already retuned it:
// `prologueFundsCents` rounds to integer CENTS, so 32 of 75 sampled prologue openings print a
// decimal (`$29,583.33`) that `formatCents` would round away. That is a change to a player-visible,
// persisted feed line, so it is the owner's, not this wave's. The measurement is pinned below so the
// decision has a number attached and cannot be lost.
// =================================================================================================

/** The deleted expression from `world.ts:808` and `world/sponsors.ts:487`, verbatim. */
const oldUnsigned = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`

/** The deleted expression from `world/milestones.ts:406-407`, verbatim – sign read off the CENTS. */
const oldSigned = (cents: number): string =>
  `${cents >= 0 ? '+' : '-'}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`

/** The values these three sites actually carry: a prize cheque, what a kit deal covered, and a
 *  season's change in the family balance. Cents, spanning four orders of magnitude and both signs. */
const AMOUNTS = [
  0, 1, 49, 50, 51, 99, 100, 101, 999, 1_000, 12_345, 130_00, 2_200_00, 25_000_00, 120_000_00,
  999_999_99, 1_234_567,
]

describe('E-12 – the engine builds its dollar strings with shared/money, and they did not move', () => {
  it('`formatCents` reproduces the unsigned hand-roll for every non-negative amount', () => {
    // The two replaced unsigned sites – a prize and a kit deal's cover – can only be >= 0, which is
    // the whole reason the swap is byte-identical rather than merely equivalent.
    for (const cents of AMOUNTS) {
      expect(formatCents(cents), `${cents} cents`).toBe(oldUnsigned(cents))
    }
  })

  it('`formatCentsSigned` reproduces the signed hand-roll everywhere EXCEPT the -0 edge', () => {
    // ⚠ THE EXCEPTION IS THE FIX, NOT A TOLERANCE. `shared/money.ts` calls this edge LOAD-BEARING:
    // `Math.round(-49 / 100)` is negative zero and `-0 < 0` is false, so the signed form prints
    // `+$0`. The hand-roll read the sign off the cents and printed `-$0` – the engine's own text
    // disagreeing with the money contract, which is the defect D-02 named.
    const subDollarDebt = (c: number) => c < 0 && Math.round(c / 100) === 0
    for (const cents of [...AMOUNTS, ...AMOUNTS.map((c) => -c)]) {
      if (subDollarDebt(cents)) {
        expect(oldSigned(cents), `${cents} cents – the hand-roll's answer`).toBe('-$0')
        expect(formatCentsSigned(cents), `${cents} cents – the contract's answer`).toBe('+$0')
      } else {
        expect(formatCentsSigned(cents), `${cents} cents`).toBe(oldSigned(cents))
      }
    }
    // ...and the range is named rather than left to the reader: -1 to -50 cents, nothing else.
    const differing = Array.from({ length: 400 }, (_, i) => -(i + 1)).filter(
      (c) => formatCentsSigned(c) !== oldSigned(c),
    )
    expect(differing).toEqual(Array.from({ length: 50 }, (_, i) => -(i + 1)))
  })

  it('the first-prize feed line is the string it was, to the byte', () => {
    // The line itself, not a model of it: `${formatCents(prize)}` inside the sentence the engine
    // writes. A cheque of $130 for a first-round exit and $2,200 for a title are the two figures
    // the site's own comment names.
    for (const prize of [130_00, 2_200_00, 0, 47_531]) {
      expect(`💰 First prize money – ${formatCents(prize)} at the World Tour 15!`).toBe(
        `💰 First prize money – ${oldUnsigned(prize)} at the World Tour 15!`,
      )
    }
  })

  it('⚠ THE ENGINE ITSELF now says +$0 for sub-dollar debt – the season wrap-up, end to end', () => {
    // ⭐ THE ONE ARM HERE THAT REDDENS ON THE UNFIXED TREE, and it goes through the real writer
    // rather than a model of it: `maybeFireSeasonWrapUp` builds the season line and the hand-roll it
    // used printed `-$0` for a season that ended 49 ¢ down. `shared/money.ts` rules `+$0`.
    const world = createWorld('e12-wrap', { ...DEFAULT_PROFILE })
    world.week = WEEKS_PER_YEAR - OFF_SEASON_WEEKS // the wrap-up week of season 0
    // A season that ended forty-nine cents down: rounded to dollars that is zero, and zero is not
    // negative – which is the whole content of the -0 ruling.
    world.financeWeeks = [{ week: 1, byCategory: { other: -49 } }]
    maybeFireSeasonWrapUp(world)

    const line = world.events.find((e) => e.week === world.week && e.text.includes('(W-L) · funds '))
    expect(line, 'the wrap-up must have fired, or this arm proves nothing').toBeTruthy()
    expect(line!.text).toContain('funds +$0')
    expect(line!.text).not.toContain('funds -$0')
  })

  it('⚠ HELD FOR THE OWNER – the career-opening line still prints the reserve to the cent', () => {
    // ⭐ THE MEASUREMENT BEHIND THE ONE SITE THIS WAVE DID NOT TOUCH. A career started WITHOUT the
    // prologue opens on a whole number of dollars, so the old spelling and `formatCents` agree and
    // the line could be swapped today with nothing moving:
    for (const background of ['wealthy', 'middle', 'working'] as FamilyBackground[]) {
      const cents = ECONOMY.startingFundsCents[background]
      expect(cents % 100, `${background} opens on whole dollars`).toBe(0)
      expect(`$${(cents / 100).toLocaleString('en-US')}`).toBe(formatCents(cents))
    }

    // ...and a career started THROUGH the prologue does not, because `prologueFundsCents` rounds to
    // integer cents. This is the number the decision needs: how often the two spellings disagree
    // across the whole spend swing the shipped card table can produce.
    const { referenceSpendCents, spendSwingCents } = ECONOMY.prologue
    let sampled = 0
    let differing = 0
    for (const background of ['wealthy', 'middle', 'working'] as FamilyBackground[]) {
      for (let k = -12; k <= 12; k++) {
        const spentCents = Math.max(0, Math.round(referenceSpendCents + (k / 12) * spendSwingCents))
        const cents = prologueFundsCents(background, spentCents)
        sampled += 1
        if (`$${(cents / 100).toLocaleString('en-US')}` !== formatCents(cents)) differing += 1
      }
    }
    expect(sampled).toBe(75)
    // 32 of 75 measured on 05.09. Asserted as a RANGE, not a literal: the point is that it is
    // common and non-zero, and a retune of the card table moves the exact count without changing
    // the finding. A zero here would mean the question has answered itself and this arm can go.
    expect(differing, 'prologue openings whose spelling differs').toBeGreaterThan(20)
    expect(differing).toBeLessThan(sampled)

    // And the line the engine actually writes still carries the unrounded spelling – recorded, not
    // blessed. When the owner rules, this arm becomes `toContain(formatCents(w.fundsCents))`.
    const w: WorldState = createWorld('e12-opening', { ...DEFAULT_PROFILE })
    const opening = w.events.find((e) => e.text.includes('Family budget'))
    expect(opening?.text).toContain(`$${(w.fundsCents / 100).toLocaleString('en-US')}`)
  })
})
