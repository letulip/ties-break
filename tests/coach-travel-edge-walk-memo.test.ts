// ⭐⭐⭐ THE MEMO AND THE FREEZE, ASSERTED – W5's T5.1, findings G-02 = H-01 (26.09).
//
// The family's 111 `careerHashAtSchema` calls reach three careers, so `walkFrozenCareer` now memoises
// per process and hands out a DEEP-FROZEN world. The family's own rungs prove the hashes did not move
// (every rung IS a hash comparison), and they would go on passing if the memo were quietly removed
// again, or if the freeze were – so the two properties that make the memo SAFE rather than merely fast
// are asserted here, where a regression names itself.
//
// ⚠ THE MUTATION ARMS, each run before this file was believed:
//   1. delete the `FROZEN_WALKS` lookup in `walkFrozenCareer` -> «the same key is the same walk» red
//      («expected false to be true» on the identity), and «one walk per key» red.
//   2. delete the `deepFreeze` call -> all four write cases red («expected [Function] to throw an
//      error»), because a plain object accepts every one of these writes in silence.
//   3. key the memo on `(presetIndex, policyIndex)` alone -> «the old name is its own career» red: the
//      Vera career comes back as the shipped-name career and the two hashes become equal.
//
// ⚠ WHY A WRITE MUST THROW AND NOT BE IGNORED. `tests/` is ESM, so every module body is strict mode
// and an assignment to a frozen object is a `TypeError` at the site that made it. Without that, a
// reader that started mutating the shared world would leave every LATER rung hashing a dirtied
// fixture – green, and unexplainable from the hash. That is the one failure mode a whole-world hash
// cannot describe, which is why the freeze is the memo's other half rather than a precaution.
import { describe, it, expect } from 'vitest'
import { walkFrozenCareer, careerHash, careerHashUnderTheOldName } from './coachTravelEdgeFixtures'

// The three careers the family actually reaches are `(0,1)`, `(5,0)` and `(8,0)`; one of them is
// enough for every claim here, and using one keeps this file at two walks.
const PRESET = 0
const POLICY = 1

describe('⭐⭐⭐ T5.1 · the frozen walk is memoised per process and handed out frozen', () => {
  it('the same key is the same walk – one object, not two equal ones', () => {
    const first = walkFrozenCareer(PRESET, POLICY)
    const second = walkFrozenCareer(PRESET, POLICY)
    // Identity, not equality: two separately walked worlds would be `toEqual` and this is the only
    // assertion that can tell them apart.
    expect(first === second, 'the second call returned the memoised world itself').toBe(true)
    // And the memo is not a wrapper that hands out a copy: a copy would defeat the freeze, since a
    // reader could dirty its own copy and the next reader would never know.
    expect(Object.isFrozen(first), 'the memoised world is frozen').toBe(true)
  })

  it('a write to the handed-out world throws, at the site that made it', () => {
    const world = walkFrozenCareer(PRESET, POLICY)
    // A top-level scalar – the shape a careless `world.week = 0` fixture pose takes.
    expect(() => {
      ;(world as { week: number }).week = 0
    }, 'a top-level write').toThrow(TypeError)
    // A NESTED object, which a shallow `Object.freeze` would have let through. This is the assertion
    // that says the freeze is deep.
    expect(() => {
      ;(world.plan as { train: number }).train = 99
    }, 'a write one layer down').toThrow(TypeError)
    // An array PUSH – the shape the peel's readers would take if one of them ever stopped being pure
    // (`underTheWindowRule` maps today, and a `.push` there is exactly the drift this catches).
    expect(() => {
      ;(world.offers as unknown[]).push({})
    }, 'a push onto a frozen array').toThrow(TypeError)
    // And a write to a row INSIDE an array, which is two layers down through an index rather than a
    // key – `Object.values` walks arrays too, and this is what proves it.
    expect(() => {
      ;(world.events[0] as { text: string }).text = 'dirtied'
    }, 'a write to a row inside an array').toThrow(TypeError)
  })

  it('the key is all four arguments – the old name is its own career', () => {
    // `careerHashUnderTheOldName` differs from `careerHash` ONLY in its fourth argument
    // (`{ kidName: 'Vera' }`). A memo keyed on the first two would serve the shipped-name world here
    // and these two hashes would collide.
    expect(
      careerHashUnderTheOldName(PRESET, POLICY),
      'a profileOverride is part of the memo key, so the two careers stay two',
    ).not.toBe(careerHash(PRESET, POLICY))
  })

  it('one walk per key, however many readers ask', () => {
    // The cheap proxy for "it walked once": the identity above holds across the OTHER exported
    // readers too, which is what turns 111 walks into three.
    const direct = walkFrozenCareer(PRESET, POLICY)
    careerHash(PRESET, POLICY)
    expect(walkFrozenCareer(PRESET, POLICY) === direct, 'careerHash did not walk a second career').toBe(true)
  })
})
