// ROUND 46 #21 – «A DAUGHTER CAME LATER»: THE DAUGHTER'S NAME IS NEVER HER MOTHER'S.
//
// The owner, 05.10 (translated): choosing «A daughter came later», the daughter's name must surely not be
// the mother's. What he met: a mother who never touched her name field IS the default (`Alice`), and the
// dynasty childhood opened its first-name field on that same default – the daughter proposed under her
// mother's own name. The first-name die could also land on it.
//
// THE THREE SURFACES, and what this file pins about each (the mounted halves are in
// tests/component/round46-b6-ending-and-retirement.test.ts):
//   · `dynastyOpeningName` – the name a dynasty card OPENS on. The default stands unless it is the mother's.
//   · `randomName(exclude)` / `namePoolWithout` – the die, on the wizard and on the prologue card.
//   · THE STREAM. The pick is ONE draw on the purpose-scoped sub-stream `${childSeed}:daughter-name`, never
//     MAIN (there is no world yet to have a MAIN: the daughter's world is born on this very seed). The die
//     keeps the `Math.random` it has always had – identityDice.ts's header says why that is legal there – and
//     is filtered BEFORE the draw, so the draw count is unchanged (one) and there is no re-roll loop.
//
// ⚠ EVERY NEGATIVE HERE CARRIES ITS CONTROL: «never her mother's» is only a finding if the pick still
// ranges over the other names, so each exclusion arm has a sibling that counts what DID appear.
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  NAME_POOL,
  dynastyOpeningName,
  namePoolWithout,
  randomName,
  sameFirstName,
} from '../src/composables/identityDice'
import { rngFromSeed } from '../src/engine/rng'
import { createWorld } from '../src/engine/world'
import { dynastyHandoverOf } from '../src/engine/world/endings'
import { OPENING_IDENTITY } from '../src/prologue/identity'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const SEEDS = Array.from({ length: 200 }, (_, i) => `r46-21-seed-${i}`)
/** Every name a mother can carry: the default (which is NOT on the die) and every name that is. */
const MOTHERS = [DEFAULT_PROFILE.kidName, ...NAME_POOL]

afterEach(() => vi.restoreAllMocks())

describe('round 46 #21 – the name a dynasty card opens on', () => {
  it('⭐ is NEVER the mother\'s: 200 seeds × the default and all 24 names on the die', () => {
    const shared: string[] = []
    let drawn = 0
    for (const mother of MOTHERS) {
      for (const seed of SEEDS) {
        const got = dynastyOpeningName(`${seed}:dynasty:1`, mother, OPENING_IDENTITY.kidName)
        drawn += 1
        if (sameFirstName(got, mother)) shared.push(`${mother} / ${seed} -> ${got}`)
      }
    }
    expect(drawn, 'a non-empty denominator – 25 mothers × 200 seeds').toBe(MOTHERS.length * SEEDS.length)
    expect(shared).toEqual([])
  })

  it('control: the default STANDS whenever it is not hers – nothing is invented for a girl who needs no help', () => {
    for (const mother of NAME_POOL) {
      for (const seed of SEEDS.slice(0, 20)) {
        expect(dynastyOpeningName(`${seed}:dynasty:1`, mother, OPENING_IDENTITY.kidName)).toBe(OPENING_IDENTITY.kidName)
      }
    }
  })

  it('control: when the default IS hers, the OTHER names still appear – the pick is not one constant', () => {
    const mother = OPENING_IDENTITY.kidName
    const seen = new Set<string>()
    for (const seed of SEEDS) seen.add(dynastyOpeningName(`${seed}:dynasty:1`, mother, OPENING_IDENTITY.kidName))
    expect(seen.size, 'the 200 daughters of one mother are not all one name').toBeGreaterThan(15)
    for (const name of seen) expect(NAME_POOL, `${name} is on the die`).toContain(name)
    expect(seen.has(mother)).toBe(false)
  })

  it('is REPRODUCIBLE – the same line opens on the same name, and nothing else is read', () => {
    const a = SEEDS.map((s) => dynastyOpeningName(`${s}:dynasty:1`, 'Alice', 'Alice'))
    const b = SEEDS.map((s) => dynastyOpeningName(`${s}:dynasty:1`, 'Alice', 'Alice'))
    expect(a).toEqual(b)
  })

  it('⚠ THE STREAM: one draw on `${childSeed}:daughter-name` over the filtered menu – no Math.random, never MAIN', () => {
    const spy = vi.spyOn(Math, 'random')
    const pool = namePoolWithout('Alice')
    for (const seed of SEEDS) {
      const childSeed = `${seed}:dynasty:1`
      const expected = pool[Math.floor(rngFromSeed(`${childSeed}:daughter-name`)() * pool.length)]
      expect(dynastyOpeningName(childSeed, 'Alice', 'Alice'), 'the first value of that sub-stream picks it').toBe(expected)
    }
    expect(spy, 'the opening default consumes no Math.random at all').not.toHaveBeenCalled()
  })

  it('a name is the same name across case, spacing and accent – and only then', () => {
    expect(sameFirstName('Alice', ' ALICE ')).toBe(true)
    expect(sameFirstName('Amelie', 'Amélie')).toBe(true)
    expect(sameFirstName('Vera', 'Veronika')).toBe(false)
    expect(sameFirstName('', ''), 'two empty names are nobody').toBe(false)
    // …and it reaches the pick: a mother typed in capitals still leaves her name off the menu.
    for (const mother of [' alice ', 'ALICE']) {
      for (const seed of SEEDS.slice(0, 20)) expect(dynastyOpeningName(`${seed}:dynasty:1`, mother, 'Alice')).not.toBe('Alice')
    }
    expect(namePoolWithout('Amélie')).not.toContain('Amelie')
    expect(namePoolWithout('Amélie')).toHaveLength(NAME_POOL.length - 1)
  })
})

describe('round 46 #21 – the die', () => {
  it('⭐ never lands on the mother\'s name: the whole unit interval, for every name on the menu', () => {
    for (const mother of NAME_POOL) {
      const landed = new Set<string>()
      for (let k = 0; k <= 1000; k += 1) {
        vi.spyOn(Math, 'random').mockReturnValue(Math.min(k / 1000, 0.9999999))
        landed.add(randomName(mother))
      }
      expect(landed.has(mother), `${mother} came up for her own daughter`).toBe(false)
      expect(landed.size, `every OTHER name is still reachable (control) for ${mother}`).toBe(NAME_POOL.length - 1)
      vi.restoreAllMocks()
    }
  })

  it('FILTERED BEFORE THE DRAW: exactly one Math.random per roll, even on the roll that would have hit her name', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0) // index 0 of the whole menu
    const mother = NAME_POOL[0]
    expect(randomName(mother)).not.toBe(mother)
    expect(spy).toHaveBeenCalledTimes(1)
    // control: no exclusion is the die as it always was, byte for byte
    expect(randomName()).toBe(NAME_POOL[0])
    expect(spy).toHaveBeenCalledTimes(2)
  })
})

describe('round 46 #21 – over a real world', () => {
  it('⭐ a kid whose name is on the die (or the default) hands over a block whose daughter never shares it – 200 worlds', () => {
    let checked = 0
    for (let i = 0; i < 200; i += 1) {
      const kidName = i % 25 === 24 ? DEFAULT_PROFILE.kidName : NAME_POOL[i % 24]
      const world = createWorld(`r46-21-world-${i}`, { ...DEFAULT_PROFILE, kidName })
      const block = dynastyHandoverOf(world)
      expect(block.motherName.first, 'the block really carries the kid\'s name – the denominator is not vacuous').toBe(kidName)
      const daughter = dynastyOpeningName(block.childSeed, block.motherName.first, OPENING_IDENTITY.kidName)
      expect(sameFirstName(daughter, block.motherName.first), `${kidName} / ${block.childSeed} -> ${daughter}`).toBe(false)
      checked += 1
    }
    expect(checked).toBe(200)
  }, 60_000)
})
