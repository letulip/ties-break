/**
 * policy-vs-owner – THE DECISIVE EXPERIMENT: is "the wall" a fact about the game, or about the
 * bench's player?
 *
 * ⚠ WHY (owner, 13.08). `ladder-vs-targets-2026-08.md` measured top-100 at **0.0% of 1530 careers**
 * and a best rank of **#115 in 160**, and the whole of `the-wall-2026-08.md` is built on that. His
 * own Olivia is **#51 at twenty-one**, self-coached, from a SMALLER talent draw than his other save.
 * One of those two statements is about the game and the other is about `tools/econ-bench.ts`'s
 * policy, and until we know which, every verdict measured through that policy is on loan.
 *
 * THE DESIGN. Two careers cannot be compared across seeds - different girl, different world,
 * different rivals. So this replays the bench's policy on HIS OWN seed and profile: the same girl,
 * the same draw, the same field, the same number of weeks. The ONLY difference is who decided.
 *
 * ⚠ WHAT IT CANNOT SETTLE, stated up front. His coach changed over the career and the bench fixes
 * one tier at birth; his sponsors and academy answers were his. So a gap here is "the bench's whole
 * management vs his", not "entry policy alone". It is still decisive for the question asked: if the
 * bench's player lands hundreds of places below him on his own seed, the wall is the player's.
 *
 * MEASUREMENT ONLY. Read-only on the save, changes no constant, ships no fixture. The save is
 * personal and is never committed.
 *
 * Run:
 *   npx vite-node tools/policy-vs-owner.ts -- --save ~/Downloads/a.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { createWorld, type WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { POLICIES, stepCareerWeek } from './econ-bench'
import { startingSkills } from '../src/engine/world/player'
import { rollPotential, SKILL_KEYS, type KidSkills } from '../src/engine/development'
import { kidAgeYears } from '../src/engine/world/age'

function money(cents: number): string {
  const s = cents < 0 ? '-' : ''
  return `${s}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}
const sum = (o: KidSkills): number => SKILL_KEYS.reduce((n, k) => n + o[k], 0)

interface Run {
  label: string
  bestWta: number | null
  endWta: number | null
  fundsCents: number
  skills: number
  endedWeek: number | null
  ending: string | null
}

function replay(w: WorldState, weeks: number, policyIndex: number): Run {
  const world = createWorld(w.seed, w.profile)
  const policy = POLICIES[policyIndex]
  world.coachOnEventWeeks = policy.coachOnEventWeeks
  const rng = rngFromSeed(world.seed)
  let bestWta: number | null = null
  for (let i = 0; i < weeks; i++) {
    stepCareerWeek(world, rng, policy)
    const r = world.kidRankWta
    if (r !== null && r !== undefined && (bestWta === null || r < bestWta)) bestWta = r
    if (world.ending) break
  }
  return {
    label: policy.label,
    bestWta,
    endWta: world.kidRankWta ?? null,
    fundsCents: world.fundsCents,
    skills: sum(world.skills),
    endedWeek: world.ending ? world.week : null,
    ending: world.ending?.type ?? null,
  }
}

async function main(): Promise<void> {
  const i = process.argv.indexOf('--save')
  const path = i >= 0 ? process.argv[i + 1].replace('~', process.env.HOME ?? '') : ''
  const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState

  const start = startingSkills(w.seed, w.profile)
  const pot = rollPotential(w.seed, start)
  console.log(`\n${'='.repeat(92)}`)
  console.log(`THE SAME GIRL, THE SAME WORLD, ${w.week} WEEKS – only the decisions differ`)
  console.log('='.repeat(92))
  console.log(`seed ${w.seed}  ·  background ${w.profile.background}  ·  onboarding coach ${w.profile.coachTier}`)
  console.log(`her draw: start ${sum(start).toFixed(1)}  ceiling ${sum(pot).toFixed(1)}  (headroom ${(sum(pot) - sum(start)).toFixed(1)})`)
  console.log(`age at the save: ${kidAgeYears(w.week, w.profile.birthMonth)}\n`)

  const rows: Run[] = [
    {
      label: 'THE OWNER (the save itself)',
      bestWta: null,
      endWta: w.kidRankWta ?? null,
      fundsCents: w.fundsCents,
      skills: sum(w.skills),
      endedWeek: null,
      ending: null,
    },
  ]
  for (let pi = 0; pi < POLICIES.length; pi++) rows.push(replay(w, w.week, pi))

  console.log('who                            end rank   best rank        funds     skills   ended')
  for (const r of rows) {
    console.log(
      `${r.label.padEnd(30)}${(r.endWta ? `#${r.endWta}` : '–').padStart(8)}   ${(r.bestWta ? `#${r.bestWta}` : '–').padStart(8)}   ${money(r.fundsCents).padStart(12)}   ${r.skills.toFixed(1).padStart(7)}   ${r.ending ? `${r.ending} @${r.endedWeek}` : '–'}`,
    )
  }
  console.log(
    `\n⚠ "best rank" is blank for the owner's row: a save keeps the CURRENT rank, not the career minimum.\n` +
      `  Compare his END rank against the bench's END rank – the bench's best is printed only to show it\n` +
      `  never got near him at any point either.`,
  )
}

void main()
