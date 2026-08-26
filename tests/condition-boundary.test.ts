import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createWorld, toSnapshot, accrueCondition, recoveryBaseFor, kidAgeExact } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import { growAndLive } from '../src/engine/world/phaseGrowth'
import { rngFromSeed } from '../src/engine/rng'
import { componentFile } from './worldSource'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

// ⭐⭐⭐ FRACTIONAL IN THE LOGIC, WHOLE IN THE INTERFACE – a HOUSE RULE, not a detail of one spec.
// The owner, 26.08 (docs/specs/the-long-goodbye-2026-08.md §4a):
//
//   «у нас в логике могут быть дробные числа – это окей, а у пользователя целые в интерфейсе»
//   «пусть падает, но на фронт едет в отображение округленное значение»
//
// Any number that crosses into `Snapshot` for a person to read is whole; the fractions stay behind
// it. `Math.round` – half away from zero, «по правилам математики». Cents are already integers and
// stay integers.
//
// ⚠⚠ AND IT HAPPENS ONCE, AT THE BOUNDARY, NOT IN EACH COMPONENT. Until the long goodbye's fading
// recovery corridor made `world.condition` genuinely fractional, `toSnapshot` handed the field over
// RAW and TWO components rounded it themselves – `KidScreen` and `TournamentFlow` – while FIVE other
// readers of the same field rounded nothing at all. That is two sides answering one question
// separately, this repo's most-repeated defect class, and the third caller that forgets would have
// printed `73.41999999` on a screen. The rounding now lives in `toSnapshot` and the duplicates are
// gone.
//
// ⚠ THE MECHANIC IS NOT QUANTISED, and that is the other half of his ruling. The engine keeps the
// fraction and the corridor keeps closing continuously; only the number that reaches a screen is
// rounded. tests/recovery-fade.test.ts is the pair to this file and pins the fraction's existence.

const ageOf = (world: WorldState): number =>
  kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)

/** A thirty-five-year-old professional whose LAST rest week was paid at the faded base, so her
 *  condition carries a real engine-made fraction rather than one this test invented. */
function veteranWithAFraction(seed: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = rngFromSeed(world.seed)
  // Her first counting W-series finish: the one-way door `activeLadderOf` reads, so she is on the
  // professional base of 5 rather than the junior 8.
  world.bestFinishByTier.w15 = 0
  // The growth phase alone – it is the only writer of `world.skills` and of `world.peakPhysical`,
  // which are the two halves of the share the fade reads. Same harness as tests/peak-physical.ts.
  while (ageOf(world) < 35) {
    world.week += 1
    growAndLive(world, rng)
  }
  world.physioActive = false
  world.plan = { train: 85, rest: 15 }
  world.condition = 50
  accrueCondition(world, false)
  return world
}

describe('the snapshot boundary is where her condition becomes a whole number', () => {
  it('⭐ a genuinely fractional condition crosses as an integer – and the engine keeps its fraction', () => {
    const world = veteranWithAFraction('boundary-veteran')
    // ⚠⚠ THE ANTI-VACUITY HALF, AND IT IS THE ONE THAT MAKES THIS A MEASUREMENT. If the engine's own
    // number were still an integer this whole file would pass against a `toSnapshot` that did
    // nothing – the null arm CLAUDE.md names («a constant without its reader»). So the fraction is
    // asserted to EXIST before it is asserted to be rounded away.
    expect(recoveryBaseFor(world), 'the faded base really is fractional at 35').not.toBe(
      ECONOMY.condition.proPhaseRecoveryBase,
    )
    expect(Number.isInteger(world.condition), 'the engine really is carrying a fraction here').toBe(false)

    const snapshot = toSnapshot(world)
    expect(Number.isInteger(snapshot.condition)).toBe(true)
    expect(snapshot.condition).toBe(Math.round(world.condition))
    // ...and reading it changed nothing: the corridor behind the boundary keeps falling continuously.
    expect(Number.isInteger(world.condition)).toBe(false)
  })

  it('it is Math.round – half away from zero, not a floor and not a truncation', () => {
    // «по правилам математики». A floor would quietly cost her a point every single week she is
    // looked at, and the difference only shows on the halves.
    const world = createWorld('boundary-rounding', { ...DEFAULT_PROFILE })
    for (const [raw, shown] of [
      [72.4, 72],
      [72.5, 73],
      [72.6, 73],
      [73.41999999, 73],
      [99.5, 100],
    ] as const) {
      world.condition = raw
      expect(toSnapshot(world).condition, `condition ${raw}`).toBe(shown)
    }
  })

  it('an already-whole condition is untouched – the junior era sees no change at all', () => {
    const world = createWorld('boundary-junior', { ...DEFAULT_PROFILE })
    for (const whole of [0, 37, 64, 100]) {
      world.condition = whole
      expect(toSnapshot(world).condition).toBe(whole)
    }
  })
})

describe('...and no component asks the same question a second time', () => {
  const SRC = fileURLToPath(new URL('../src/', import.meta.url))

  /** Every `.vue` under src/components, recursively. */
  function componentPaths(): string[] {
    return readdirSync(`${SRC}components`, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.vue'))
      .map((f) => `components/${f}`)
  }

  it('⚠ THE RATCHET: nothing under src/components rounds a condition for itself', () => {
    // ⚠ A NEGATIVE CLAIM, SO IT READS THE `.vue` ALONE (`componentFile`, never `componentLogic` –
    // tests/pin-hygiene.test.ts enforces the distinction mechanically). What it guards is the defect
    // CLASS rather than the two files that had it: a screen that re-rounds `snapshot.condition` is a
    // second home for a decision the boundary already made, and the next one to be written is the
    // one that gets it wrong. The two shipped duplicates were KidScreen.vue and TournamentFlow.vue.
    //
    // ⚠ AIMED AT THE PAIRING, NOT AT THE WORD `Math.round`. Components round plenty of other things
    // – percentages, fares, hours – and must stay free to. What may not happen is `Math.round`
    // reaching a `condition`.
    const offenders: string[] = []
    for (const rel of componentPaths()) {
      const src = componentFile(rel)
      for (const line of src.split('\n')) {
        // A comment explaining why the rounding is gone is not a rounding.
        const code = line.replace(/\/\/.*$/, '').replace(/<!--.*?-->/g, '')
        if (/Math\.round\s*\([^)]*\bcondition\b/i.test(code)) offenders.push(`${rel}: ${line.trim().slice(0, 90)}`)
      }
    }
    expect(
      offenders,
      'toSnapshot rounds `condition` once at the boundary – a component that rounds it again is the duplicate §4a removed',
    ).toEqual([])
  })

  it('...and the ratchet can actually fail – the pattern it hunts is the one that used to be there', () => {
    // Anti-vacuity for the sweep above: the exact expression deleted from KidScreen.vue must still
    // be something this test would catch. A guard that cannot fail on the broken version is not this
    // guard.
    const shipped = 'const condition = computed(() => Math.round(game.snapshot?.condition ?? 0))'
    expect(/Math\.round\s*\([^)]*\bcondition\b/i.test(shipped)).toBe(true)
    expect(/Math\.round\s*\([^)]*\bcondition\b/i.test('const pct = Math.round(share * 100)')).toBe(false)
  })

  it('the two screens that carried the duplicate now read the field straight', () => {
    for (const rel of ['components/screens/KidScreen.vue', 'components/TournamentFlow.vue']) {
      const file = componentFile(rel)
      expect(file, `${rel} still reads her condition`).toContain('condition')
      expect(file.includes('Math.round(game.snapshot?.condition'), rel).toBe(false)
      expect(file.includes('Math.round(condition)'), rel).toBe(false)
    }
  })
})
