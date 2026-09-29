// Lane B probe (26.09 review, baseline 03d92221). Read-only.
// Question: `closeTournament` is documented "Dismiss a finished reveal" – does the ENGINE refuse it on
// an UNFINISHED reveal, or does it drop the run? Arm A: close straight away. Arm B: skip (finalise)
// then close – the UI's own path. Walk recipe = tests/dev-fast-forward.test.ts `pendingTournamentWorld`.
import { closeTournament, createWorld, enterEvent, entryStatus, skipTournament, tickWeek, type WorldState } from '../../../src/engine/world'
import { rngFromSeed } from '../../../src/engine/rng'
import { DEFAULT_PROFILE } from '../../../src/shared/protocol'

function pendingTournamentWorld(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let guard = 0; guard < 156 && !world.pendingTournament; guard++) {
    const e = world.season.find((ev) => ev.week > world.week && !world.entries.includes(ev.id) && entryStatus(world, ev).level !== 'blocked')
    if (e) { try { enterEvent(world, e.id) } catch { /* deadline race */ } }
    tickWeek(world, rng)
  }
  if (!world.pendingTournament) throw new Error('walk did not reach a reveal')
  return world
}
const view = (w: WorldState) => ({
  funds: w.fundsCents,
  pending: w.pendingTournament === null ? null : { finished: w.pendingTournament.finished, revealed: w.pendingTournament.revealedRounds },
  events: w.events.length,
  matchRows: w.events.filter((e) => e.type === 'match').length,
  kidResultRows: w.results.filter((r) => r.playerId === 'kid').length,
  seasonRecord: JSON.stringify(w.seasonRecord ?? null),
  condition: Math.round(w.condition * 100) / 100,
  milestones: w.milestones.length,
  careerPrize: w.careerTotals?.prizeCents ?? null,
})
for (const seed of ['devff-reveal', 'b-close-1', 'b-close-2']) {
  const base = pendingTournamentWorld(seed)
  const a = structuredClone(base)
  let aErr = 'none'
  try { closeTournament(a) } catch (e) { aErr = String(e) }
  const b = structuredClone(base)
  skipTournament(b)
  closeTournament(b)
  console.log(seed, 'week', base.week, 'event', base.pendingTournament!.eventId)
  console.log('  before      ', JSON.stringify(view(base)))
  console.log('  A close-only', JSON.stringify(view(a)), 'threw:', aErr)
  console.log('  B skip+close', JSON.stringify(view(b)))
  // does time move on after A?
  const rng = rngFromSeed(`${seed}:after`)
  tickWeek(a, rng)
  console.log('  A then tick  week', a.week, 'pending', a.pendingTournament === null ? 'none' : 'open')
}
