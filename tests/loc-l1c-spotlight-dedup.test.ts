// L1c (the localization intake, 07.10 – the owner: «и это тоже чиним безусловно»): the spotlight
// row's first-of-season `keep` is answered by STATE (`world.spotlightKeepSeason`), not by a feed
// scan on text identity. Two hazards this file pins, each with the arm that dies under the wrong
// fix:
//   · TEXT identity breaks under localization – a stored row whose text a locale layer rewrites
//     stops matching and every week becomes «first» (§D is red under the old code);
//   · `lifeKind` identity breaks under the press leak – `lifeBeat/leak.ts` writes the SAME
//     `lifeKind: 'exposure'` with `keep: true`, so a leak week would eat the season's spotlight
//     keep (§C is red under the naive lifeKind swap).
// The harness is wave6-spotlight-pressure's own (probe built by `createWorld` and moved, never
// hand-assembled), trimmed to what these arms need.
import { describe, expect, it } from 'vitest'
import { accrueSpirit, EXPOSURE_ROW } from '../src/engine/spirit'
import { createWorld } from '../src/engine/world'
import { addEvent, seasonIndexOf } from '../src/engine/world/ledger'
import { ECONOMY } from '../src/engine/economy'
import { isBlackoutWeek, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { schoolIsOver } from '../src/engine/kidLife'
import { birthdayTurning } from '../src/engine/world/age'
import type { ExposureEvent, WorldState } from '../src/engine/world'

function quietWeek(base: WorldState, week: number): boolean {
  const schoolOver = schoolIsOver(week, base.profile.birthMonth)
  return (
    !isBlackoutWeek(week, schoolOver) &&
    birthdayTurning(week, base.profile.birthMonth, base.profile.birthDay) === null
  )
}

function probe(seed = 'l1c-spotlight', week = 210): WorldState {
  const world = createWorld(seed)
  world.temperament = 'sunny'
  let w = week
  while (!quietWeek(world, w)) w++
  world.week = w
  world.spirit = ECONOMY.spirit.baseline
  world.bond = ECONOMY.bond.start
  return world
}

/** Move the SAME world to the next quiet week ≥ `week`, spirit re-baselined for a clean pass. */
function parkAt(world: WorldState, week: number): void {
  let w = week
  while (!quietWeek(world, w)) w++
  world.week = w
  world.spirit = ECONOMY.spirit.baseline
}

const STAGE: ExposureEvent[] = [{ kind: 'stage' }]

function rowsAfter(world: WorldState, before: number) {
  return world.events.slice(before).filter((e) => e.text === EXPOSURE_ROW)
}

describe('L1c – the spotlight keep is a state question, per season', () => {
  it('A · first pass of a season keeps; a later week of the SAME season prints without keep', () => {
    const world = probe()
    const season = seasonIndexOf(world.week)
    let before = world.events.length
    accrueSpirit(world, false, STAGE)
    const [first] = rowsAfter(world, before)
    expect(first.keep, 'the first exposure row of the season is kept').toBe(true)
    expect(world.spotlightKeepSeason, 'the state remembers the season of the keep').toBe(season)

    parkAt(world, world.week + 2)
    expect(seasonIndexOf(world.week), 'the repeat arm must stay inside the season').toBe(season)
    before = world.events.length
    accrueSpirit(world, false, STAGE)
    const [repeat] = rowsAfter(world, before)
    expect(repeat, 'the repeat still prints – the dedup is about keep, never about the row').toBeDefined()
    expect(repeat.keep, 'a repeat inside the season is an ordinary, prunable row').toBeUndefined()
  })

  it('B · the season key rolls: the NEXT season keeps again on the same world', () => {
    const world = probe()
    accrueSpirit(world, false, STAGE)
    const firstSeason = seasonIndexOf(world.week)
    parkAt(world, world.week + WEEKS_PER_YEAR)
    expect(seasonIndexOf(world.week)).toBe(firstSeason + 1)
    const before = world.events.length
    accrueSpirit(world, false, STAGE)
    const [row] = rowsAfter(world, before)
    expect(row.keep, 'a new season earns its own kept row').toBe(true)
    expect(world.spotlightKeepSeason).toBe(firstSeason + 1)
  })

  it('C · THE LEAK GUARD – a kept leak row of the same kind does not eat the spotlight keep', () => {
    // `lifeBeat/leak.ts` writes { type: 'life', keep: true, lifeKind: 'exposure', text: <leak> }.
    // Under a naive `lifeKind === 'exposure'` dedup this arm goes red – which is exactly why the
    // answer lives in `spotlightKeepSeason` instead (state.ts carries the note).
    const world = probe()
    addEvent(world, {
      week: world.week - 1,
      type: 'life',
      keep: true,
      lifeKind: 'exposure',
      text: 'The story ran with a photograph.',
    })
    const before = world.events.length
    accrueSpirit(world, false, STAGE)
    const [row] = rowsAfter(world, before)
    expect(row.keep, 'the leak is a different row; the spotlight keep is still owed').toBe(true)
  })

  it('D · THE TRANSLATION GUARD – a rewritten stored text cannot re-arm the keep (red under the old feed scan)', () => {
    // Simulates the RU hazard the intake confirmed: the season's kept row exists but its stored
    // text no longer equals the English literal. The old code (`e.text === EXPOSURE_ROW` over the
    // feed) finds nothing and keeps AGAIN – this arm is its red control. State answers correctly.
    const world = probe()
    const season = seasonIndexOf(world.week)
    world.spotlightKeepSeason = season
    addEvent(world, {
      week: world.week - 1,
      type: 'life',
      keep: true,
      lifeKind: 'exposure',
      text: 'О ней говорили на прошлой неделе.',
    })
    const before = world.events.length
    accrueSpirit(world, false, STAGE)
    const [row] = rowsAfter(world, before)
    expect(row, 'the row itself still prints').toBeDefined()
    expect(row.keep, 'the season already has its kept row – state remembers what text no longer can').toBeUndefined()
  })

  it('E · the field is absent until earned, and survives a serialisation round-trip', () => {
    const world = probe()
    expect('spotlightKeepSeason' in world || world.spotlightKeepSeason === undefined).toBe(true)
    expect(world.spotlightKeepSeason, 'a fresh world has no keep season – the truthful old-save default').toBeUndefined()
    accrueSpirit(world, false, STAGE)
    const season = seasonIndexOf(world.week)
    const thawed = JSON.parse(JSON.stringify(world)) as WorldState
    expect(thawed.spotlightKeepSeason, 'the season index rides the save').toBe(season)
  })
})
