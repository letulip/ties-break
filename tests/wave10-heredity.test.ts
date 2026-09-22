// WAVE 10 / T3 – THE HEREDITY: ONE AXIS, LEANED, AND PINNED IDENTICAL WHEN THERE IS NO MOTHER.
//
// docs/specs/the-dynasty-2026-09.md §7. His ruling, 22.09: «наследственность темперамента – можно и
// забенчить, мне кажется».
//
// ⚠⚠ THE HASH IN §A IS THE WHOLE POINT OF THIS FILE. It was taken on the commit BEFORE
// `temperamentFor` grew its second parameter – `f5e9f20293cf5a68`, over the 4000 seeds
// `w10-lean-0` … `w10-lean-3999` – so «byte-identical to today» is a MEASUREMENT against the old
// code rather than a claim about the new code's shape. Every shipped save, every migrated career and
// every frozen career depends on that arm holding.
//
// MUTATION-VERIFIED 22.09, each applied, RUN and reverted, with the count of what went red:
//   · `ECONOMY.dynasty.opennessLean` 0.65 -> 1.0: **1 red** – §B's «not a copy» case – and **§A did
//     not move a bit**, which is the pair this file exists to assert. ⚠ ONLY ONE, AND THE REASON IS
//     WORTH READING: §B's RATE case reads the constant it is checking, so its bounds move with the
//     mutation. That is deliberate (see the note on that case) and it is exactly why the «not a
//     copy» case is beside it – measured, not assumed, and the measurement is what put it there.
//   · the lean's `===` flipped to `!==` in `temperamentFor`: **1 red** – §B's rate case; she takes the
//     OPPOSITE pole, and a rate that follows the constant still notices THAT.
//   · `openRoll < 0.5` changed to `openRoll < 0.6` on the no-mother path: **3 red, all of §A**, which
//     is what makes writing `pickInt`'s body out at that one site safe to have done at all.
//   · an extra `r()` before the intensity draw, on the mother path only: **1 red** – §D's byte-identity
//     of the second axis, the case that exists to measure the draw count.

import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { ECONOMY } from '../src/engine/economy'
import {
  TEMPERAMENTS,
  temperamentFor,
  temperamentIntensity,
  temperamentOpenness,
  type Temperament,
} from '../src/engine/spirit'
import { createWorld } from '../src/engine/world'
import { DEFAULT_PROFILE, type DynastyHandover } from '../src/shared/protocol'

const N = 4000
const seeds = Array.from({ length: N }, (_, i) => `w10-lean-${i}`)
const hashOf = (xs: string[]): string => createHash('sha256').update(xs.join(',')).digest('hex').slice(0, 16)

/** ⭐ THE VALUE THIS FUNCTION PRODUCED BEFORE THE SECOND PARAMETER EXISTED, captured at `2ec96cbe`
 *  (the branch head wave 10 was cut from) and written here as a constant so the arm is a comparison
 *  with the PAST and not with itself. */
const PRE_LEAN_HASH = 'f5e9f20293cf5a68'

// =================================================================================================
// A. ABSENT THE ARGUMENT, NOTHING MOVED
// =================================================================================================

describe('wave 10 T3 A – the no-mother arm is the girl the game has always drawn', () => {
  it('⭐⭐⭐ 4000 seeds hash to the value this function produced before the parameter existed', () => {
    expect(hashOf(seeds.map((s) => temperamentFor(s)))).toBe(PRE_LEAN_HASH)
  })

  it('⚠ ...and passing `undefined` explicitly is the same call, which is what `?.` at the one caller does', () => {
    // `createWorld` writes `temperamentFor(seed, dynasty?.motherTemperament)`, so on a wizard career
    // the second argument really is `undefined` rather than absent. A branch that treated the two
    // differently would move every career the game has ever created.
    expect(hashOf(seeds.map((s) => temperamentFor(s, undefined)))).toBe(PRE_LEAN_HASH)
  })

  it('⭐⭐ the four temperaments are still 25/25/25/25 by construction', () => {
    const counts: Record<Temperament, number> = { sunny: 0, fiery: 0, quiet: 0, deep: 0 }
    for (const s of seeds) counts[temperamentFor(s)] += 1
    for (const t of TEMPERAMENTS) {
      expect(counts[t] / N, `${t} is uniform to within 2 pp`).toBeGreaterThan(0.23)
      expect(counts[t] / N, `${t} is uniform to within 2 pp`).toBeLessThan(0.27)
    }
  })
})

// =================================================================================================
// B. PRESENT, THE LEAN SHOWS – AND IT IS THE CONSTANT THAT SHOWS
// =================================================================================================

describe('wave 10 T3 B – the openness pole leans to the mother\'s', () => {
  it('⭐⭐⭐ over 4000 seeds, a daughter takes her mother\'s pole at the drafted rate', () => {
    // ⚠ THE TOLERANCE IS THE SAMPLING ERROR AND NOT A HEDGE. p = 0.65, N = 4000, so one standard
    // error is sqrt(p(1-p)/N) = 0.0075 and ±0.03 is four of them.
    //
    // ⚠⚠ AND THE BOUNDS READ THE CONSTANT RATHER THAN QUOTING 0.65, WHICH IS A DECISION WITH A COST
    // AND A REASON. The cost is measured: moving `opennessLean` to 1.0 does NOT redden this case,
    // because its bounds move with it. The reason is that this case is about the MECHANISM – «the
    // engine really leans by whatever the constant says» – and a hard-typed 0.65 here would be the
    // second spelling of a tunable, so re-tuning the dial on a bench measurement would mean editing a
    // test to match, which is how a pin stops meaning anything. The NUMBER is T7's bench (§8 row 1),
    // where it belongs; what catches a constant that has been quietly maxed out is the case below.
    for (const mother of TEMPERAMENTS) {
      const pole = temperamentOpenness(mother)
      const took = seeds.filter((s) => temperamentOpenness(temperamentFor(s, mother)) === pole).length
      expect(took / N, `mother ${mother} (${pole})`).toBeGreaterThan(ECONOMY.dynasty.opennessLean - 0.03)
      expect(took / N, `mother ${mother} (${pole})`).toBeLessThan(ECONOMY.dynasty.opennessLean + 0.03)
    }
  })

  it('⭐⭐ ...and it really is a LEAN and not a copy – the other pole happens, on the same seeds', () => {
    // The half a rate can hide: 0.65 and 1.0 both «show the lean». This asks for the minority arm by
    // name, so the absurd-value mutation in the header has something to break.
    for (const mother of TEMPERAMENTS) {
      const pole = temperamentOpenness(mother)
      const against = seeds.filter((s) => temperamentOpenness(temperamentFor(s, mother)) !== pole).length
      expect(against, `mother ${mother}: a third of her daughters are her opposite`).toBeGreaterThan(N * 0.3)
    }
  })

  it('⚠⚠ the lean is the ONLY thing that moves – the same seed, two mothers of opposite poles', () => {
    // A stronger statement than a rate: for every seed, the two openness answers a mother can produce
    // are exact opposites of each other, because ONE roll decides both through the same comparison.
    const open = seeds.map((s) => temperamentOpenness(temperamentFor(s, 'sunny')))
    const priv = seeds.map((s) => temperamentOpenness(temperamentFor(s, 'quiet')))
    for (let i = 0; i < N; i += 1) {
      expect(open[i] === priv[i], `seed ${seeds[i]}: one roll, two mothers, opposite answers`).toBe(false)
    }
  })
})

// =================================================================================================
// C. THE DETERMINISM LAW (§7) – THE SAME CHILD SEED AND THE SAME MOTHER GIVE THE SAME GIRL
// =================================================================================================

describe('wave 10 T3 C – determinism', () => {
  it('⭐⭐ the same pair always gives the same daughter', () => {
    for (const mother of TEMPERAMENTS) {
      for (const s of seeds.slice(0, 200)) {
        expect(temperamentFor(s, mother)).toBe(temperamentFor(s, mother))
      }
    }
  })

  it('⭐⭐⭐ and a dynasty career carries her at birth – `createWorld` is the one site that may lean', () => {
    const block: DynastyHandover = {
      generation: 1,
      childSeed: 'w10-her:dynasty:1',
      background: DEFAULT_PROFILE.background,
      raisedOnTour: false,
      motherName: { first: 'Alice', last: 'Martin' },
      motherCountry: 'US',
      motherTemperament: 'quiet',
      motherCareer: { titles: 0, bestRank: null, slams: 0, endedWeek: 900, endingKind: 'natural' },
    }
    const daughter = createWorld(block.childSeed, DEFAULT_PROFILE, 'c-w10-her', undefined, block)
    expect(daughter.temperament, 'the girl the leaned draw produced, stored once at birth').toBe(
      temperamentFor(block.childSeed, 'quiet'),
    )
    // ⚠ AND THE WIZARD CAREER ON THE SAME SEED IS THE UNLEANED GIRL, which is the other half: the
    // argument is what changes her, not the presence of a fifth parameter in the signature.
    const wizard = createWorld(block.childSeed, DEFAULT_PROFILE, 'c-w10-her')
    expect(wizard.temperament).toBe(temperamentFor(block.childSeed))
  })
})

// =================================================================================================
// D. THE AXIS THE LEAN MAY NOT TOUCH, AND THE DRAW IT MAY NOT ADD
// =================================================================================================

describe('wave 10 T3 D – one draw, re-mapped', () => {
  it('⭐⭐⭐ the INTENSITY axis is byte-identical with every mother – which is how we know no draw moved', () => {
    // ⚠⚠ THIS IS THE DRAW-COUNT MEASUREMENT AND NOT A SECOND FAIRNESS CLAIM. `temperamentFor` takes
    // its openness roll first and its intensity roll second, off one sub-stream. If the lean added a
    // draw, skipped one, or took the openness value from a different position, the SECOND roll would
    // land somewhere else and this sequence would move. It does not move, for any of the four
    // mothers, over 4000 seeds – so the lean re-maps an outcome and touches nothing else.
    const base = seeds.map((s) => temperamentIntensity(temperamentFor(s)))
    const baseHash = hashOf(base)
    for (const mother of TEMPERAMENTS) {
      expect(hashOf(seeds.map((s) => temperamentIntensity(temperamentFor(s, mother)))), `mother ${mother}`)
        .toBe(baseHash)
    }
  })

  it('⚠ ...and the intensity axis stays uniform under every mother – §7 leans ONE axis', () => {
    for (const mother of TEMPERAMENTS) {
      const steady = seeds.filter((s) => temperamentIntensity(temperamentFor(s, mother)) === 'steady').length
      expect(steady / N, `mother ${mother}: intensity is untouched`).toBeGreaterThan(0.47)
      expect(steady / N, `mother ${mother}: intensity is untouched`).toBeLessThan(0.53)
    }
  })
})
