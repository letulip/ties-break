// ⭐⭐ ROUND 46 #22 – THE DEV LIFE-EVENT BOOST, TWO ARMS (bundle B1).
//
// The owner, round 46 #22 (05.10, verbatim): «хотел дождаться, чтобы она родила, но так и не случилось - может
// быть в целях разработки можно в найстройках сделать переключатель, поднимающий шансы наступления этих событий
// в разы для отладки?» The design was DECIDED (docs/rounds/round-46.md, B1): a transient worker-session flag
// multiplying the probability ONLY where a big-life-event hazard compares its rolled uniform, never persisted,
// never touching MAIN. This file is the evidence the brief asked for – one arm each way:
//
//   ARM A (OFF) – the regression arm. `boostedChance(p)` is `p` bit for bit; a world driven through every
//   boosted hazard with the switch untouched is BYTE-IDENTICAL to one driven after the switch was turned on and
//   off again; and none of the four rolls moves `world.rngMain`. The pinned MAIN capture (`tests/condition.test.ts`,
//   41550 draws / `e6b0c709`) is the other half of this arm and is run alongside it.
//   ARM B (ON) – under ONE seed the event comes EARLIER, never later, and by years on average. «Never later» is
//   a theorem rather than a measurement here: each hazard rolls the SAME uniform `u(week)` on its own
//   sub-stream whatever the switch says, and `u < p` implies `u < 8p`, so the first firing week with the switch on
//   is at most the first with it off. The test asserts the theorem per seed and the size of the gain in aggregate.
//
// ⚠ A POSED WORLD, NOT A SIMULATED CAREER, for `life-moment-engine.test.ts`'s reason: what is under test is the
// compare, so the world is advanced one `world.week` at a time and the real roll function is called – no tick, no
// MAIN, nothing else that could differ between the arms.
//
// ⚠ MUTATIONS, each really run and watched, then put back:
//   * `boostedChance` returning `p` regardless -> RED (every ON arm: nothing moves).
//   * `boostedChance` multiplying by 8 even when off -> RED (the identity arm and the byte-identity case).
//   * the wedding's compare reverted to `>= ECONOMY.wedding.perWeek` -> RED (the wedding ON arm only – which is
//     what says each site is wired separately).
import { afterEach, describe, expect, it } from 'vitest'
import { createWorld, toSnapshot } from '../src/engine/world'
import { kidAgeNow, lifeLogOf } from '../src/engine/world/lifeBeat'
import { rollArrival } from '../src/engine/world/lifeBeat'
import { rollBereavement } from '../src/engine/world/lifeBeat/bereavement'
import { rollPregnancy } from '../src/engine/world/lifeBeat/pregnancy'
import { rollWedding } from '../src/engine/world/lifeBeat/wedding'
import { loveEpisodesOf } from '../src/engine/world/loveEpisodes'
import { LIFE_EVENT_BOOST_FACTOR, boostedChance, lifeEventBoostOn, setLifeEventBoost } from '../src/engine/world/lifeBoost'
import { REPLY_BY_COMMAND } from '../src/shared/protocol'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { WorldState } from '../src/engine/world'
import type { LoveEpisode } from '../src/shared/protocol/narrative'

afterEach(() => setLifeEventBoost(false))

function episode(sinceWeek: number, over: Partial<LoveEpisode> = {}): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek, wants: 'open', partnerId: `p:${sinceWeek}`,
    publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null, latchedWeek: null, partnerName: 'Anton',
    ...over,
  }
}

function ageUp(world: WorldState, age: number): void {
  while (kidAgeNow(world) < age) world.week += 13
}

interface Arm {
  name: string
  horizon: number
  setup: (seed: string) => WorldState
  roll: (world: WorldState) => void
  fired: (world: WorldState) => boolean
}

const ARMS: Arm[] = [
  {
    name: 'wedding (the engaged announcement)',
    horizon: 1500,
    setup: (seed) => {
      const world = createWorld(seed, DEFAULT_PROFILE)
      ageUp(world, 24)
      world.loveEpisodes = [episode(world.week - 300)]
      return world
    },
    roll: rollWedding,
    fired: (world) => lifeLogOf(world).some((r) => r.kind === 'engaged'),
  },
  {
    name: 'pregnancy',
    horizon: 572,
    setup: (seed) => {
      const world = createWorld(seed, DEFAULT_PROFILE)
      ageUp(world, 24)
      world.loveEpisodes = [episode(world.week - 400, { latchedWeek: world.week - 100 })]
      return world
    },
    roll: rollPregnancy,
    fired: (world) => world.pregnancy !== null,
  },
  {
    name: 'a partner arriving (the chain starts there)',
    horizon: 400,
    setup: (seed) => {
      const world = createWorld(seed, DEFAULT_PROFILE)
      ageUp(world, 20)
      world.loveEpisodes = []
      return world
    },
    roll: rollArrival,
    fired: (world) => loveEpisodesOf(world).length > 0,
  },
  {
    name: 'bereavement (the funeral)',
    horizon: 1500,
    setup: (seed) => {
      const world = createWorld(seed, DEFAULT_PROFILE)
      world.weightEnabled = true
      ageUp(world, ECONOMY.weight.bereavement.fromAgeYears)
      return world
    },
    roll: rollBereavement,
    fired: (world) => lifeLogOf(world).some((r) => r.kind === 'bereavement'),
  },
]

/** The offset, in weeks from the arm's start, of the first week its roll fires – or the horizon if it never does. */
function firstFire(arm: Arm, seed: string, boost: boolean): number {
  setLifeEventBoost(boost)
  try {
    const world = arm.setup(seed)
    const start = world.week
    for (let i = 0; i < arm.horizon; i++) {
      world.week = start + i
      arm.roll(world)
      if (arm.fired(world)) return i
    }
    return arm.horizon
  } finally {
    setLifeEventBoost(false)
  }
}

const SEEDS = Array.from({ length: 30 }, (_, i) => `boost-seed-${i}`)
const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0)

describe('ARM A – the switch OFF is today, bit for bit', () => {
  it('boostedChance(p) is p, exactly, for every probability a hazard can hold', () => {
    expect(lifeEventBoostOn(), 'off by default').toBe(false)
    for (const p of [0, 1e-9, 0.02 / 52, 0.006, 0.025, 0.5, 1]) expect(Object.is(boostedChance(p), p), `p=${p}`).toBe(true)
  })

  it('a world driven through all four hazards is byte-identical whether or not the switch was ever touched', () => {
    function drive(touch: boolean): string {
      if (touch) {
        setLifeEventBoost(true)
        setLifeEventBoost(false)
      }
      const world = createWorld('boost-identity', DEFAULT_PROFILE)
      world.weightEnabled = true
      ageUp(world, 24)
      world.loveEpisodes = [episode(world.week - 400, { latchedWeek: world.week - 100 })]
      const start = world.week
      for (let i = 0; i < 700; i++) {
        world.week = start + i
        rollArrival(world)
        rollWedding(world)
        rollPregnancy(world)
        rollBereavement(world)
      }
      return JSON.stringify(world)
    }
    const untouched = drive(false)
    expect(drive(true), 'on-then-off leaves no residue').toBe(untouched)
    expect(untouched.length, 'and the run really did something to the world').toBeGreaterThan(5000)
  })

  it('MAIN is untouched by every boosted roll, with the switch on and off', () => {
    for (const boost of [false, true]) {
      setLifeEventBoost(boost)
      for (const arm of ARMS) {
        const world = arm.setup('boost-main')
        const before = JSON.stringify(world.rngMain)
        const start = world.week
        for (let i = 0; i < 300; i++) {
          world.week = start + i
          arm.roll(world)
        }
        expect(JSON.stringify(world.rngMain), `${arm.name}, boost ${boost}`).toBe(before)
      }
    }
  })
})

describe('ARM B – the switch ON brings the event earlier under the same seed', () => {
  for (const arm of ARMS) {
    it(`${arm.name}: never later on any seed, and earlier on some`, () => {
      const off = SEEDS.map((s) => firstFire(arm, s, false))
      const on = SEEDS.map((s) => firstFire(arm, s, true))
      off.forEach((o, i) => expect(on[i], `${SEEDS[i]}: ON ${on[i]} vs OFF ${o}`).toBeLessThanOrEqual(o))
      const earlier = on.filter((v, i) => v < off[i]).length
      expect(earlier, 'the switch moved something – or this proves nothing').toBeGreaterThan(0)
    })
  }

  it('the wedding comes YEARS earlier on average (the owner waited the one he wanted and it never came)', () => {
    const wedding = ARMS[0]
    const off = SEEDS.map((s) => firstFire(wedding, s, false))
    const on = SEEDS.map((s) => firstFire(wedding, s, true))
    const meanGainWeeks = (sum(off) - sum(on)) / SEEDS.length
    expect(meanGainWeeks, `mean OFF ${(sum(off) / SEEDS.length).toFixed(0)}w vs ON ${(sum(on) / SEEDS.length).toFixed(0)}w`).toBeGreaterThan(52)
  })

  it('the pregnancy is far likelier inside her window (OFF mostly never arrives; ON mostly does)', () => {
    const preg = ARMS[1]
    const offFired = SEEDS.filter((s) => firstFire(preg, s, false) < preg.horizon).length
    const onFired = SEEDS.filter((s) => firstFire(preg, s, true) < preg.horizon).length
    expect(onFired, `ON ${onFired}/${SEEDS.length} vs OFF ${offFired}/${SEEDS.length}`).toBeGreaterThanOrEqual(offFired + 5)
  })

  it('the factor is the decided one, and it is a number the More screen reads rather than re-states', () => {
    expect(LIFE_EVENT_BOOST_FACTOR).toBe(8)
    setLifeEventBoost(true)
    expect(boostedChance(0.01)).toBeCloseTo(0.08, 12)
  })
})

describe('the switch is transient and reports itself – it is in no save', () => {
  it('the snapshot carries the worker\'s own state, and the world carries nothing', () => {
    const world = createWorld('snapshot-flag', DEFAULT_PROFILE)
    const saved = JSON.stringify(world)
    expect(toSnapshot(world).devLifeBoost).toBe(false)
    setLifeEventBoost(true)
    expect(toSnapshot(world).devLifeBoost, 'the More screen shows this').toBe(true)
    expect(JSON.stringify(world), 'turning it on wrote nothing to the world, so no save can hold it').toBe(saved)
    expect(saved, 'and no field of the world is named for it').not.toMatch(/lifeEventBoost|devLifeBoost/)
  })

  it('it rides the existing RPC: a dev command whose reply is the snapshot', () => {
    expect(REPLY_BY_COMMAND.devLifeBoost).toBe('snapshot')
  })
})
