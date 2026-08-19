import { createWorld, enterEvent, tickWeek, skipTournament, closeTournament, activeLadderOf } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { TIER_LADDER } from '../src/engine/season/calendar'
function walkNear(weeks: number, seed: string): any {
  const world: any = createWorld(seed, DEFAULT_PROFILE)
  world.fundsCents = 500_000_00
  const rng = resumeMain(world.rngMain)
  for (let w = 0; w < weeks; w++) {
    const byRung = [...world.season].sort((a: any, b: any) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier))
    for (const e of byRung as any[]) {
      if (world.entries.includes(e.id)) continue
      if (world.week > e.deadlineWeek || e.deadlineWeek - world.week > 3) continue
      if (world.season.some((x: any) => x.week === e.week && world.entries.includes(x.id))) continue
      try { enterEvent(world, e.id) } catch { /* gated */ }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) { skipTournament(world); closeTournament(world) }
  }
  return world
}
for (const wk of [49, 101, 153, 205, 257, 309]) {
  try {
    const w = walkNear(wk, 'golden-v45')
    const s = w.lastSeasonSummary
    if (!s?.rankTrack) { console.log(`w${wk}: no rankTrack`); continue }
    console.log(`w${wk}: card=${s.rankTrack} active=${activeLadderOf(w)}${s.rankTrack !== activeLadderOf(w) ? '   <<< DIVERGES' : ''}`)
  } catch (e) { console.log(`w${wk}: threw ${(e as Error).message.slice(0, 70)}`) }
}
