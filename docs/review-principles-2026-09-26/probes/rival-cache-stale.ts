// Lane C probe – does the rivals' run index (`season/rival.ts` runsIndexCache) follow every knob it is built from?
// (review of 26.09.2026, baseline 03d92221)
//
// Usage (from the root of the baseline worktree): npx vite-node docs/review-principles-2026-09-26/probes/rival-cache-stale.ts
//
// METHOD. `rivalCondition` reconstructs each ledger row into a run whose strain is `tournamentRunStrain(tier,
// <matches> score-less)` – which reads runFatigueLadder / runFatigueLadderWta / runFatigueLadderDeep,
// matchFatigue.straightSets and tierMatchFatigue[tier] (engine/condition.ts). The index is memoised and keyed
// on the IDENTITY of the first two arrays only (rival.ts:100-128). For each knob the probe:
//   1. warms the index on the shipped knobs (one rivalCondition call);
//   2. patches the knob the way the repo's own benches do (in place for tierMatchFatigue / matchFatigue, as
//      tools/season-equation.ts `withDials` does; array replacement for runFatigueLadderDeep, as
//      tools/deep-run-cost.ts and tools/season-equation.ts do);
//   3. reads rivalCondition again (CACHED – what the engine serves after the patch);
//   4. forces a rebuild by replacing runFatigueLadder with a copy of itself (same values, new identity) and
//      reads again (FRESH – what the patched knob really implies);
//   5. restores everything.
// A knob whose CACHED reading differs from its FRESH reading is one the cache silently ignores.
// Also prints the tournamentRunStrain the KID pays for the same run before/after the patch – the kid's path
// reads the knobs live, so a stale rival index makes the two sides of one A/B measure different games.
import { ECONOMY } from '../../../src/engine/economy'
import { rivalCondition } from '../../../src/engine/season/rival'
import { tournamentRunStrain } from '../../../src/engine/condition'
import { TIERS } from '../../../src/engine/season/calendar'
import type { TierId } from '../../../src/engine/season/types'
import type { SeasonResult } from '../../../src/engine/season/ranking'

const C = ECONOMY.condition as unknown as {
  runFatigueLadder: number[]
  runFatigueLadderWta: number[]
  runFatigueLadderDeep: number[]
  matchFatigue: { straightSets: number; hardMatch: number; extraTiebreaks: number }
  tierMatchFatigue: Record<TierId, number>
}

// A rival who won a title at `tier` two weeks before `week`: one ledger row carrying the winner's points.
function ledger(tier: TierId, week: number): SeasonResult[] {
  const points = (TIERS[tier] as { points: number[] }).points[0]
  return [{ playerId: 'ai-x', week: week - 2, points, tier } as unknown as SeasonResult]
}
function forceRebuild(): void { C.runFatigueLadder = [...C.runFatigueLadder] }

type Case = { knob: string; tier: TierId; patch: () => void; restore: () => void }
const saved = { deep: C.runFatigueLadderDeep, ss: C.matchFatigue.straightSets, tmf: { ...C.tierMatchFatigue } }
const cases: Case[] = [
  {
    knob: 'tierMatchFatigue (in place, +3 on every rung – season-equation surcharge arm shape)', tier: 'w35',
    patch: () => { for (const t of Object.keys(C.tierMatchFatigue) as TierId[]) C.tierMatchFatigue[t] = saved.tmf[t] + 3 },
    restore: () => { for (const t of Object.keys(saved.tmf) as TierId[]) C.tierMatchFatigue[t] = saved.tmf[t] },
  },
  {
    knob: 'matchFatigue.straightSets (in place, +2 – season-equation noDrain / rivals.test sweep shape)', tier: 'j300',
    patch: () => { C.matchFatigue.straightSets = saved.ss + 2 },
    restore: () => { C.matchFatigue.straightSets = saved.ss },
  },
  {
    knob: 'runFatigueLadderDeep (replaced by the WTA ladder – deep-run-cost.ts shape)', tier: 'slam',
    patch: () => { C.runFatigueLadderDeep = [...C.runFatigueLadderWta, 9, 9] },
    restore: () => { C.runFatigueLadderDeep = saved.deep },
  },
]
const week = 400
console.log('knob | tier | shipped | CACHED after patch | FRESH after patch | kid run strain shipped -> patched | stale?')
for (const c of cases) {
  const rows = ledger(c.tier, week)
  const rounds = Math.log2((TIERS[c.tier] as { drawSize: number }).drawSize)
  const kidRun = Array.from({ length: rounds }, () => ({}))
  forceRebuild()
  const shipped = rivalCondition(rows, 'ai-x', week)
  const kidBefore = tournamentRunStrain(c.tier, kidRun)
  c.patch()
  const cached = rivalCondition(rows, 'ai-x', week)
  const kidAfter = tournamentRunStrain(c.tier, kidRun)
  forceRebuild()
  const fresh = rivalCondition(rows, 'ai-x', week)
  c.restore()
  forceRebuild()
  console.log(`${c.knob} | ${c.tier} | ${shipped} | ${cached} | ${fresh} | ${kidBefore} -> ${kidAfter} | ${cached !== fresh ? 'STALE' : 'ok'}`)
}
console.log(`restored: deep ${JSON.stringify(C.runFatigueLadderDeep) === JSON.stringify(saved.deep)}, straightSets ${C.matchFatigue.straightSets === saved.ss}, tierMatchFatigue ${JSON.stringify(C.tierMatchFatigue) === JSON.stringify(saved.tmf)}`)
// The size of what the memo saves: one runStrain per (tier, finish) pair, each a reduce over <= log2(drawSize)
// matches. (No timing is taken – Phase 1 lanes do not time; the count is the cost model.)
const pairs = Object.values(TIERS as Record<string, { points: number[]; drawSize: number }>).reduce((n, t) => n + t.points.length, 0)
const matches = Object.values(TIERS as Record<string, { points: number[]; drawSize: number }>).reduce((n, t) => n + t.points.length * Math.log2(t.drawSize), 0)
console.log(`index build: ${Object.keys(TIERS).length} tiers, ${pairs} (tier, finish) pairs, <= ${matches} matchDrain calls`)
