// ROUND 42 #26 – A DURABLE GIFT WE HAVE ALREADY GIVEN LEAVES THE CARD FOR GOOD.
//
// THE OWNER, 15.09: «Если мы уже дарили депозит на её жилье, то его больше не надо вообще
// показывать.» That overrides a RECORDED DESIGN – `birthdayOptions`' own block calls the repeat
// «licensed» (spec §5.2, round-18 #10c) and the licence was his. It is now withdrawn for the
// one-shot kind and kept for the repeatable one.
//
// ⚠⚠ THE HARD PART OF THE ITEM IS NOT THE FILTER, IT IS THAT THE CARD MAY NEVER RENDER SHORT, and
// §2 is that claim exhaustively. Four rows at every age is spec §2a, and it is load-bearing in the
// RNG as well as on screen: three rows are ordered by three draws on `seed:birthday:<age>` and the
// ask is the fourth (round 26 #9b, pinned in `tests/birthday-ask.test.ts`). A band that emptied
// would silently drop that to two draws and move every ask in the career.
//
// ⚠ THE SPEC AMENDMENT IS docs/specs/birthday-and-gifts.md §5.2, dated 15.09.
//
// MUTATIONS, each applied alone to `world/birthday.ts`, run, reverted. Control 11/11 green before
// and after. ⚠ THE COUNTS ARE READ OFF THE RUNS, NOT PREDICTED:
//   N1 `retiredGift` dropping the `durable` test (repeatables retired too), run
//      across this file plus birthday-ask / birthday-career / birthday-gifts -> 3 red
//   N2 the neighbour-band refill deleted (the pool simply shrinks)           -> 2 red
//   N3 the refill capped at `rows` instead of at the band's own size         -> 1 red (§3)
//   N4 `birthdayOffer` passing no `given` at all (the pre-item behaviour)    -> 3 red
import { describe, it, expect } from 'vitest'
import { BIRTHDAY_BANDS, birthdayOffer, birthdayOptions } from '../src/engine/world/birthday'
import type { BirthdayGift } from '../src/engine/world/birthdayGift'

const ALL: BirthdayGift[] = [...new Map(BIRTHDAY_BANDS.flatMap((b) => b.gifts).map((g) => [g.id, g])).values()]
const DURABLE = ALL.filter((g) => g.repeat === 'durable').map((g) => g.id)
const REPEATABLE = ALL.filter((g) => g.repeat === 'repeatable').map((g) => g.id)
/** Every age a birthday card can be built for, plus a little past either end. */
const AGES = Array.from({ length: 31 }, (_, i) => i + 10)

/** ⚠ FOUR ROWS, AT EVERY AGE. Below sixteen the day-ask is off the card (round 42 #1) and a fourth
 *  MATERIAL row takes its place, so the count is four either way – which is the point. */
const ROWS = 4

// =================================================================================================
// §1 – A GIVEN DURABLE DOES NOT COME BACK
// =================================================================================================
describe('§1 the gift is already in the house', () => {
  it('⭐⭐⭐ HIS OWN CASE: the deposit given at nineteen is on no later card', () => {
    let seen = 0
    for (const seed of ['deposit-a', 'deposit-b', 'deposit-c', 'deposit-d']) {
      for (const age of [19, 20, 21]) {
        const fresh = birthdayOffer(seed, age, [])
        if (fresh.options.some((o) => o.id === 'deposit')) seen++
        const after = birthdayOffer(seed, age, ['deposit'])
        expect(after.options.map((o) => o.id), `${seed} at ${age}`).not.toContain('deposit')
        expect(after.askedId, 'and she does not ask for it either').not.toBe('deposit')
      }
    }
    // ⚠ THE ARM HAS TO CONTAIN THE THING IT IS PROVING: the deposit must really be offerable in the
    // band, or the `not.toContain` above would pass with the whole item deleted.
    expect(seen, 'the deposit really is on the untouched card').toBeGreaterThan(0)
  })

  it('⭐⭐⭐ ...and it holds for EVERY durable in the catalogue, at every age, college included', () => {
    for (const atCollege of [false, true]) {
      for (const age of AGES) {
        const offered = new Set(birthdayOffer('sweep', age, [], atCollege, atCollege ? 0 : null).options.map((o) => o.id))
        for (const id of DURABLE) {
          if (!offered.has(id)) continue
          const after = birthdayOffer('sweep', age, [id], atCollege, atCollege ? 0 : null)
          expect(after.options.map((o) => o.id), `${id} at ${age}${atCollege ? ' (college)' : ''}`).not.toContain(id)
        }
      }
    }
  })

  it('⭐⭐ a REPEATABLE she was given is still offered – and still says so', () => {
    // «A week at home, a day, a trip, tickets, paints – she can want those every year of her life.»
    // His ruling names durables; this is the half that must NOT have moved.
    let proven = 0
    for (const seed of ['rep-a', 'rep-b', 'rep-c', 'rep-d', 'rep-e']) {
      for (const age of AGES) {
        for (const id of REPEATABLE) {
          const fresh = birthdayOffer(seed, age, [])
          if (!fresh.options.some((o) => o.id === id)) continue
          const after = birthdayOffer(seed, age, [id])
          expect(after.options.map((o) => o.id), `${id} at ${age}`).toContain(id)
          // ⚠ AND THE «again» LINE IS STILL THE ONE IT PRINTS, which is what round-18 #10c bought.
          const row = birthdayOptions(after.options, [id]).find((o) => o.id === id)!
          const gift = ALL.find((g) => g.id === id)!
          expect(row.note, `${id}: the repeat still owns itself`).toBe(gift.again)
          proven++
        }
      }
    }
    expect(proven, 'the sweep really met repeatable rows').toBeGreaterThan(20)
  })
})

// =================================================================================================
// §2 – ⚠⚠ THE CARD NEVER RENDERS SHORT. THIS IS THE ITEM'S REAL RISK.
// =================================================================================================
describe('§2 four rows, whatever the family has already given', () => {
  it('⭐⭐⭐ EXHAUSTIVE: every age x every college index x five given-sets, always four distinct rows', () => {
    const GIVEN_SETS: string[][] = [
      [],
      DURABLE.slice(0, 5),
      DURABLE.slice(0, 12),
      DURABLE,
      ALL.map((g) => g.id), // the impossible career: literally everything already given
    ]
    let checked = 0
    for (const atCollege of [false, true]) {
      for (const age of AGES) {
        for (const given of GIVEN_SETS) {
          for (let ci = 0; ci < 4; ci++) {
            const { options } = birthdayOffer(`short-${age}`, age, given, atCollege, atCollege ? ci : null)
            expect(options.length, `age ${age}, ${given.length} given, college ${atCollege}`).toBe(ROWS)
            expect(new Set(options.map((o) => o.id)).size, 'and no row is printed twice').toBe(ROWS)
            checked++
          }
        }
      }
    }
    expect(checked, 'the sweep is the size it claims to be').toBe(2 * AGES.length * GIVEN_SETS.length * 4)
  })

  it('⭐⭐⭐ ...and the ask is always one of the four on screen', () => {
    for (const given of [[], DURABLE, ALL.map((g) => g.id)]) {
      for (const age of AGES) {
        const { options, askedId } = birthdayOffer('ask-in-pool', age, given)
        expect(options.map((o) => o.id), `age ${age}, ${given.length} given`).toContain(askedId)
      }
    }
  })

  it('⭐⭐ band by band: emptying a band of its durables one at a time never shortens the card', () => {
    // The 17 and 18 bands hold exactly three material gifts and share `watch` and `suitcase` with
    // their neighbours, so they are the two that a single earlier gift can strip. Walked explicitly.
    for (const band of BIRTHDAY_BANDS) {
      const ids = band.gifts.map((g) => g.id)
      for (let take = 1; take <= ids.length; take++) {
        const given = ids.slice(0, take)
        const age = band.to > 90 ? 30 : band.to
        const atCollege = band.from === 0 && band.to === 99
        const { options } = birthdayOffer(`band-${band.from}`, age, given, atCollege, atCollege ? 1 : null)
        expect(options.length, `band ${band.from}-${band.to}, ${take} of its own gifts given`).toBe(ROWS)
      }
    }
  })
})

// =================================================================================================
// §3 – THE REFILL: A SHORTENED BAND BORROWS, AND IT BORROWS BACK TO ITS OWN SIZE
// =================================================================================================
describe('§3 pool exhaustion falls back to the neighbour band', () => {
  it('⭐⭐⭐ a career that gave the deposit still meets FIVE different rows across 19-21', () => {
    // Round 26 #9b's arithmetic is what this protects: the band holds five material gifts so that
    // C(5,3) = 10 cards seat her three birthdays without repeating. Refilling only to `rows` would
    // leave C(3,3) = 1 and undo it. The claim is read off the walk rather than off the pool.
    for (const seed of ['refill-a', 'refill-b', 'refill-c']) {
      const met = new Set<string>()
      for (const age of [19, 20, 21]) {
        for (const o of birthdayOffer(seed, age, ['deposit']).options) if (o.id !== 'day') met.add(o.id)
      }
      expect(met.size, `${seed}: the band is still as rich as it was`).toBeGreaterThanOrEqual(5)
      expect(met.has('deposit'), 'and the retired row is not one of them').toBe(false)
    }
  })

  it('⭐⭐ the borrowed rows come from a NEIGHBOUR band and not from anywhere in the catalogue', () => {
    // The 19-21 band's neighbours are 18 and 22-28 first; the childhood band is four steps away and
    // must not turn up on a twenty-year-old's card while nearer rows exist.
    const near = new Set(
      BIRTHDAY_BANDS.filter((b) => (b.from === 18 && b.to === 18) || (b.from === 22 && b.to === 28) || (b.from === 19 && b.to === 21))
        .flatMap((b) => b.gifts.map((g) => g.id)),
    )
    for (const seed of ['near-a', 'near-b', 'near-c', 'near-d']) {
      for (const age of [19, 20, 21]) {
        for (const o of birthdayOffer(seed, age, ['deposit']).options) {
          if (o.id === 'day') continue
          expect(near.has(o.id), `${seed} at ${age}: ${o.id} came from too far away`).toBe(true)
        }
      }
    }
  })

  it('⚠ a career with nothing retired walks the untouched cycle – the change is invisible to it', () => {
    // Passing a REPEATABLE she owns retires nothing, so the offer must be identical to the fresh one
    // row for row and in order. This is the arm that would go red if the filter ever widened.
    for (const seed of ['invisible-a', 'invisible-b']) {
      for (const age of AGES) {
        const fresh = birthdayOffer(seed, age, [])
        for (const id of REPEATABLE) {
          expect(birthdayOffer(seed, age, [id]).options.map((o) => o.id), `${seed} at ${age} with ${id}`)
            .toEqual(fresh.options.map((o) => o.id))
        }
      }
    }
  })
})

// =================================================================================================
// §4 – IMMUTABLE AND DETERMINISTIC, WHICH IS WHAT A RELOAD RELIES ON
// =================================================================================================
describe('§4 the offer is still a pure function of its inputs', () => {
  it('⭐⭐ the same (seed, age, given) answers identically however often it is asked', () => {
    for (const given of [[], ['deposit'], DURABLE.slice(0, 8)]) {
      for (const age of [14, 17, 20, 25, 31]) {
        const a = birthdayOffer('immutable', age, given)
        const b = birthdayOffer('immutable', age, [...given])
        expect(b.options.map((o) => o.id)).toEqual(a.options.map((o) => o.id))
        expect(b.askedId).toBe(a.askedId)
      }
    }
  })

  it('⚠ the ORDER of the given list does not move the card', () => {
    const given = DURABLE.slice(0, 8)
    for (const age of [19, 20, 21, 25]) {
      const a = birthdayOffer('order', age, given)
      const b = birthdayOffer('order', age, [...given].reverse())
      expect(b.options.map((o) => o.id), `age ${age}`).toEqual(a.options.map((o) => o.id))
    }
  })
})
