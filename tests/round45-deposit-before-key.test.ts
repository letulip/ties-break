// =================================================================================================
// ⭐⭐⭐ ROUND 45 #9 – THE DEPOSIT TOWARDS HER OWN PLACE BELONGS TO THE YEARS BEFORE HER OWN DOOR
// =================================================================================================
//
// THE OWNER, round 45 #9: «Deposit towards her own place случился после того, как она пару лет назад
// принесла свой spare key. И мне кажется этот депозит вполне можно где-то на более ранних периодах
// делать, а не когда у неё на счёту уже 150+ млн».
//
// WHAT THE SWEEP FOUND (72 walked careers, the earning harness of tools/econ-bench, a parent who grants
// every ask – his own log): there is NO money or age corridor in the deposit's gate. It is a row of the
// 19-21 birthday band, and round 42 #26's refill (a GIVEN durable leaves the card; the shortfall is
// topped up from the neighbour bands, the independence band first) put it back on a card at 26-34 in
// 29 of the 69 careers that reached the key – 49 cards, her bank at them median $9.9M. The parent who
// never grants never met it after the key at all: the refill is what moves it.
//
// WHAT THIS FILE PINS, as built (the rule lives at the foot of `birthday.ts`, block `OWN_PLACE_DEPOSIT_ID`):
//   §A THE ORDER   once the own-key beat's receipt is in the life log the deposit is MOOT – on no card,
//                  never the ask, and the card stays four rows. The same parent without the key DOES
//                  meet it late (anti-vacuity: the defect is reachable on the pure walk).
//   §B THE CORRIDOR her NINETEENTH birthday carries the deposit and asks for it, every seed; it is on no
//                  fresh card below nineteen, so the rule moved WHEN and not what the bands hold.
//   §C THE STREAM  the nineteenth's ask is an override and never a skip: the age stream is still drawn
//                  four times, the cycle stream C(5,3)-1 = 9 times.
//   §D A WALKED CAREER the earning harness walks one of the careers that failed before the change.
//
// MUTATION LEDGER (run red-first – MEASURED reds, recorded in the commit message):
//   ARM 1  `mootGiftsOf` returns []                                  → 1 RED: §A's moot arm (§D stays green:
//          a parent who grants the nineteenth's ask retires the deposit himself, so the walked
//          granting career never reaches the refill – the receipt rule matters for the parent who declines)
//   ARM 2  the nineteenth-birthday ask override removed              → 2 RED: §B's ask arm, §D
//   ARM 3  the cycle swap in `materialFor` disabled                  → 2 RED: §B's card arm, §D
const draws = vi.hoisted(() => ({}) as Record<string, number>)
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      const g = actual.rngFromSeed(seed)
      return Object.assign(() => {
        draws[seed] = (draws[seed] ?? 0) + 1
        return g()
      }, g)
    },
  }
})

import { describe, expect, it, vi } from 'vitest'
import { chooseGift, createWorld, kidAgeExact, lifeLogOf, pendingBirthday } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { birthdayOffer, birthdayOfferFor } from '../src/engine/world/birthday'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { BirthdayRecord } from '../src/shared/protocol'
import { drainLifeBeats } from '../tools/_lifeBeats'
import { finishAnyReveal } from './helpers/scenarios/college'
import { POLICIES, PRESETS, openCareer, stepCareerWeek } from '../tools/econ-bench'

const DEPOSIT = 'deposit'
const SEEDS = Array.from({ length: 24 }, (_, i) => `r45-9-${i}`)
type LogRow = NonNullable<WorldState['lifeLog']>[number]

const freshWorld = (seed: string): WorldState =>
  createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })

/** The receipt `ownKeyDue` reads: the own-key row in the life log. Only `kind` is read by the offer. */
function keyFired(world: WorldState): void {
  world.lifeLog = [...(world.lifeLog ?? []), { kind: 'own-key', week: world.week } as unknown as LogRow]
}

interface Card {
  age: number
  ids: string[]
  asked: string
}

/** A parent who grants every ask (asked === given – the owner's own log) EXCEPT the deposit, which this
 *  parent never gives – so the row stays available for round 42 #26's refill to find, which is the
 *  late appearance §A is about (a parent who DID give it at nineteen retires it for good, and then
 *  there is nothing left to move). Walked through the engine's own seam with no ticking: the record
 *  grows by one row a year and `birthdayOfferFor` re-derives each card from it. `keyAge` is the age from
 *  which the own-key receipt is in the log (null = never). */
function grantingWalk(seed: string, keyAge: number | null): Card[] {
  const world = freshWorld(seed)
  const cards: Card[] = []
  for (let age = 14; age <= 36; age++) {
    world.week = (age - 14) * 52 + 20
    if (keyAge !== null && age >= keyAge && lifeLogOf(world).length === 0) keyFired(world)
    const { options, askedId } = birthdayOfferFor(world, age)
    cards.push({ age, ids: options.map((o) => o.id), asked: askedId })
    world.birthdays.push({ week: world.week, age, asked: askedId, given: askedId === DEPOSIT ? null : askedId } as unknown as BirthdayRecord)
  }
  return cards
}

describe('⭐⭐⭐ §A THE ORDER – once her own door has opened the deposit is moot, and not queued for later', () => {
  it('the same parent DOES meet the deposit after twenty-two without the key (anti-vacuity)', () => {
    const late = SEEDS.filter((s) => grantingWalk(s, null).some((c) => c.age >= 22 && c.ids.includes(DEPOSIT)))
    expect(late.length, 'the refill defect has to be reachable on this walk, or §A proves nothing').toBeGreaterThan(0)
  })

  it('with the own-key receipt in the log: no card from twenty-two holds the deposit, it is never the ask, the card stays four rows', () => {
    for (const seed of SEEDS) {
      for (const c of grantingWalk(seed, 22)) {
        if (c.age >= 22) {
          expect(c.ids, `${seed} age ${c.age}: the deposit is on a card after the key`).not.toContain(DEPOSIT)
          expect(c.asked, `${seed} age ${c.age}: she asks for a deposit after the key`).not.toBe(DEPOSIT)
        }
        expect(c.ids, `${seed} age ${c.age}: the card renders short`).toHaveLength(4)
      }
    }
  })

  it('and the key moves NOTHING before itself: ages up to twenty-one are the same cards with and without the receipt', () => {
    for (const seed of SEEDS) {
      const before = grantingWalk(seed, null).filter((c) => c.age <= 21)
      const withKey = grantingWalk(seed, 22).filter((c) => c.age <= 21)
      expect(withKey, seed).toEqual(before)
    }
  })
})

describe('⭐⭐ §B THE CORRIDOR – her nineteenth birthday carries the deposit and asks for it', () => {
  it('every seed: the deposit is on the nineteenth card AND is the ask', () => {
    for (let s = 0; s < 40; s++) {
      const { options, askedId } = birthdayOffer(`corridor-r45-${s}`, 19)
      expect(options.map((o) => o.id), `seed ${s}: the deposit is on her nineteenth card`).toContain(DEPOSIT)
      expect(askedId, `seed ${s}: and it is what she asks for`).toBe(DEPOSIT)
    }
  })

  it('below the corridor: no fresh card from fourteen to eighteen holds the deposit', () => {
    for (let s = 0; s < 40; s++) {
      for (let age = 14; age <= 18; age++) {
        const { options } = birthdayOffer(`corridor-r45-${s}`, age)
        expect(options.map((o) => o.id), `seed ${s} age ${age}`).not.toContain(DEPOSIT)
      }
    }
  })

  it('the cycle is still a permutation: nineteen, twenty and twenty-one are three different dialogs', () => {
    for (let s = 0; s < 40; s++) {
      const cards = [19, 20, 21].map((a) =>
        birthdayOffer(`corridor-r45-${s}`, a).options.map((o) => o.id).sort().join('|'),
      )
      expect(new Set(cards).size, `seed ${s}: ${cards.join(' / ')}`).toBe(3)
    }
  })

  it('a deposit she was already asked about at eighteen is not forced again at nineteen', () => {
    // the career-scope ladder still outranks the override: a row with a count and a recent week is
    // not the pool's least-used, so the override finds nothing to force
    const record = [{ week: 4 * 52, asked: DEPOSIT, given: null }]
    for (let s = 0; s < 40; s++) {
      const { askedId } = birthdayOffer(`corridor-r45-${s}`, 19, [], false, null, DEPOSIT, record, 5 * 52)
      expect(askedId, `seed ${s}`).not.toBe(DEPOSIT)
    }
  })
})

describe('⭐ §C THE STREAM – the ask is overridden, never skipped', () => {
  it('the nineteenth birthday still draws the age stream four times and the cycle stream C(5,3)-1', () => {
    for (const key of Object.keys(draws)) delete draws[key]
    birthdayOffer('draws-r45', 19)
    expect(draws['draws-r45:birthday:19'], 'three to order the four rows, one for the ask').toBe(4)
    expect(draws['draws-r45:birthday:cycle:19-21'], 'one Fisher-Yates over C(5,3) = 10 combinations').toBe(9)
  })
})

describe('⭐⭐ §D A WALKED CAREER that failed before the change', () => {
  it('bench-middle-4 (key at 22, deposit on cards at 27 and 29 before): her nineteenth asks for it, and no card after the key holds it', () => {
    const preset = PRESETS[4]
    const policy = POLICIES[1]
    const { world, rng } = openCareer(preset, 4, policy)
    const cards: Array<{ age: number; week: number; ids: string[]; asked: string }> = []
    for (let w = 0; w < 1100; w++) {
      finishAnyReveal(world)
      const age = pendingBirthday(world)
      if (age !== null) {
        const offer = birthdayOfferFor(world, age)
        cards.push({ age, week: world.week, ids: offer.options.map((o) => o.id), asked: offer.askedId })
        chooseGift(world, offer.askedId)
      }
      drainLifeBeats(world)
      if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
      stepCareerWeek(world, rng, policy)
      if (world.ending && world.ending.type !== 'college') break
      if (kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay) >= 31) break
    }
    const key = lifeLogOf(world).find((r) => r.kind === 'own-key')
    expect(key, 'the own-key beat fired').toBeDefined()
    expect(cards.some((c) => c.age >= 27), 'the walk reached the window where the old code put the deposit back').toBe(true)
    const nineteen = cards.find((c) => c.age === 19)!
    expect(nineteen.ids, 'the deposit is on her nineteenth card').toContain(DEPOSIT)
    expect(nineteen.asked, 'and it is what she asked for').toBe(DEPOSIT)
    const after = cards.filter((c) => c.week > key!.week && c.ids.includes(DEPOSIT))
    expect(after.map((c) => c.age), 'no card after the key holds the deposit').toEqual([])
  }, 60_000)
})
