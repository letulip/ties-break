// THE RETIREMENT BENCH - `npm run bench:retire`. Same shape as the knock / econ / fatigue benches: a
// measurement harness, run by hand, never part of a gate.
//
// THE QUESTION IT EXISTS TO ANSWER, and it is a calibration rather than a curiosity. The research
// (docs/research/retirement-and-withdrawal.md §7) anchors the rate at **2.73% of matches** on the
// women's ITF World Tennis Tour - 7,291 of ~266,900, PLOS ONE June 2024 - counting a match as
// retired if EITHER player stopped. `RETIRE_K` in engine/match/point.ts is the one number that moves
// it, and this file is where it is measured rather than guessed (CLAUDE.md invariant 4).
//
// ⚠ IT MEASURES THE MATCHES THE GAME ACTUALLY PLAYS, not a synthetic population, and that is the
// point. The hazard reads in-match fatigue, so the rate is a consequence of how long her matches run
// - which is a consequence of her draws, her opponents, her stamina and the tier she is on. A bench
// over hand-built players would calibrate against a distribution the game does not have.
//
// The policy is best16-bench's, deliberately: enter the strongest rung that will take her, one entry
// a week, money never the reason. That is the heaviest schedule the gates allow, which is the arm
// where a retirement rate is worth knowing.
//
// It also prints the per-tier breakdown, because the design claim under `retireHazard` is that
// TIER-DEPENDENCE ARRIVES FOR FREE: nothing in the hazard reads the tier, so any spread across the
// ladder here is the draws playing longer, and is the evidence for that claim.
import { createWorld, tickWeek, enterEvent, skipTournament, closeTournament, KID_ID } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import { RETIRE_K } from '../src/engine/match/point'
import type { TierId } from '../src/engine/season/types'

const CAREERS = Number(process.env.CAREERS ?? 12)
const WEEKS = Number(process.env.WEEKS ?? 52 * 6)

let matches = 0
let retirements = 0
let kidRetirements = 0
let oppRetirements = 0
let points = 0
const byTier = new Map<TierId, { m: number; r: number; pts: number }>()

for (let s = 0; s < CAREERS; s++) {
  const world = createWorld(`retire-${s}`)
  const rng = rngFromSeed(world.seed)
  const strongestFirst = [...TIER_LADDER].reverse()
  for (let i = 0; i < WEEKS; i++) {
    world.fundsCents = Math.max(world.fundsCents, 1_000_000_00) // money never decides an entry here
    if (world.condition >= ECONOMY.condition.matchStrengthKnee) {
      for (const tier of strongestFirst) {
        const e = world.season.find(
          (x) =>
            x.tier === tier &&
            x.deadlineWeek >= world.week &&
            x.deadlineWeek - world.week <= 2 &&
            !world.entries.includes(x.id) &&
            !world.season.some((y) => y.week === x.week && world.entries.includes(y.id)),
        )
        if (!e) continue
        try {
          enterEvent(world, e.id)
          break
        } catch {
          /* a gate said no - the policy tries the next rung down */
        }
      }
    }
    tickWeek(world, rng)
    const pending = world.pendingTournament
    if (pending) {
      const tier = world.season.find((e) => e.id === pending.eventId)?.tier
      for (const m of pending.result.matches) {
        if (m.aId !== KID_ID && m.bId !== KID_ID) continue
        matches++
        // Her matches' LENGTH is the quantity the hazard integrates, so it is reported alongside the
        // rate: a number that drifted because her matches got shorter is a different finding from a
        // mis-set K, and without this the two are indistinguishable.
        points += (m.score ?? '').split(' ').reduce((n, set) => {
          const [g1, g2] = set.split('-').map(Number)
          return n + (g1 + g2)
        }, 0)
        if (m.retiredId) {
          retirements++
          if (m.retiredId === KID_ID) kidRetirements++
          else oppRetirements++
        }
        if (tier) {
          const row = byTier.get(tier) ?? { m: 0, r: 0, pts: 0 }
          row.m++
          if (m.retiredId) row.r++
          byTier.set(tier, row)
        }
      }
      skipTournament(world)
      closeTournament(world)
    }
  }
}

const pct = (n: number, d: number) => (d === 0 ? '   n/a' : `${((100 * n) / d).toFixed(2)}%`)
console.log(`RETIRE_K = ${RETIRE_K}   ${CAREERS} careers x ${WEEKS} weeks`)
console.log(`matches ${matches}   retirements ${retirements}   = ${pct(retirements, matches)}   (target 2.73%)`)
console.log(`  of which HERS ${kidRetirements} = ${pct(kidRetirements, matches)}   opponent's ${oppRetirements} = ${pct(oppRetirements, matches)}`)
console.log(`  mean games per match ${(points / matches).toFixed(1)} - the length the hazard integrates over`)
console.log('')
console.log('BY TIER - nothing in the hazard reads the tier, so this spread is match LENGTH alone:')
for (const tier of TIER_LADDER) {
  const row = byTier.get(tier)
  if (!row || row.m === 0) continue
  console.log(`  ${TIERS[tier].label.padEnd(12)} ${String(row.m).padStart(6)} matches   ${String(row.r).padStart(4)} ret   ${pct(row.r, row.m)}`)
}
void points
