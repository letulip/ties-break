// Lane B probe (26.09 review, baseline 03d92221). Read-only: imports repo code, writes nothing.
// Question: does `advanceWeeks(world, rng, n > 1)` stop when a shoot/tournament clash OPENS mid-span?
// `advanceRefusal` refuses on `shootClashOpen` at ENTRY; the mid-loop stop list in `advanceWeeks`
// (world.ts) carries no `shoot-clash` line. Fixture = tests/round29-shoot-clash.test.ts `clashWorld`,
// started TWO weeks earlier so the question opens inside the span rather than in front of it.
import { advanceWeeks, createWorld, shootClashOpen, tickWeek, type WorldState } from '../../../src/engine/world'
import { adOfferId } from '../../../src/engine/offers'
import { resumeMain } from '../../../src/engine/rng'
import { ECONOMY } from '../../../src/engine/economy'
import { DEFAULT_PROFILE } from '../../../src/shared/protocol'
import type { SeasonEvent } from '../../../src/engine/season/types'

const CLASH = 216
const AT = CLASH - 1
const WATCH = {
  brand: ECONOMY.advertising.categories.watches.houses[0],
  cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[1]!,
  termWeeks: 52,
}
function clashWorld(seed: string, startWeek: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = startWeek
  world.plan = { train: 60, rest: 40 }
  world.physioActive = false
  world.condition = 50
  world.fundsCents = 500_000_00
  const event: SeasonEvent = { id: `${seed}-event`, week: CLASH, tier: 'local', surface: 'hard', travelCostCents: 100_00, deadlineWeek: AT - 2 }
  world.season = [event]
  world.entries = [event.id]
  world.offers.push({
    id: adOfferId(AT - 10), kind: 'ad', week: AT - 10, deadlineWeek: AT - 7, state: 'signed', decidedWeek: AT - 10,
    fromWeek: AT - 10, untilWeek: AT - 10 + WATCH.termWeeks - 1,
    terms: { brand: WATCH.brand, cashCents: WATCH.cashCents, termWeeks: WATCH.termWeeks, shootCount: 2, shootWeeks: [CLASH, CLASH + 21] },
  } as never)
  return world
}

for (const seed of ['b-clash-a', 'b-clash-b', 'b-clash-c']) {
  // Arm 1 – the control: standing ON the question week, advance refuses (the pinned behaviour).
  const w1 = clashWorld(seed, AT)
  const s1 = advanceWeeks(w1, resumeMain(w1.rngMain), 4)
  console.log(`${seed} control   start=${AT} open=${shootClashOpen(clashWorld(seed, AT))} stops=${JSON.stringify(s1)} endWeek=${w1.week}`)
  // Arm 2 – two weeks earlier, a four-week span: does the loop stop on the week the question opens?
  const w2 = clashWorld(seed, AT - 2)
  const trace: string[] = []
  const s2 = advanceWeeks(w2, resumeMain(w2.rngMain), 4)
  console.log(`${seed} mid-span  start=${AT - 2} stops=${JSON.stringify(s2)} endWeek=${w2.week} clashOpenNow=${shootClashOpen(w2)} accepted=${JSON.stringify(w2.shootClashAccepted ?? [])} entries=${JSON.stringify(w2.entries)} pendingT=${w2.pendingTournament !== null}`)
  // Arm 3 – the same span tick by tick, recording where the question stood.
  const w3 = clashWorld(seed, AT - 2)
  const rng = resumeMain(w3.rngMain)
  for (let i = 0; i < 4; i++) {
    tickWeek(w3, rng)
    trace.push(`w${w3.week}:open=${shootClashOpen(w3)}:pendingT=${w3.pendingTournament !== null}`)
    if (w3.pendingTournament) break
  }
  console.log(`${seed} trace     ${trace.join(' ')}`)
}
