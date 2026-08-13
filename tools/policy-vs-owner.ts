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
import type { CoachTier } from '../src/shared/protocol'
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
  /** ⚠ THE DISCRIMINATORS. The first replay proved the bench player is far behind on the SAME girl
   *  with the SAME skills – so the gap is in what she DOES, and these are the four things she can
   *  do differently: how often she enters, at what rungs, how fresh she is when she does, and how
   *  much of the calendar she spends not playing. Printed for both arms so the cause is named by a
   *  number rather than by a hypothesis (my first one - «he hires the coach later» - is already
   *  dead: his Naomi carries `coachTier: middle` from ONBOARDING, exactly the bench's preset). */
  entries: number
  matches: number
  byTier: Record<string, number>
  meanCondition: number
  weeksInjured: number
}

function replay(w: WorldState, weeks: number, policyIndex: number, coachTier?: CoachTier): Run {
  // ⚠ THE COACH OVERRIDE IS WHAT MAKES THIS AN EXPERIMENT RATHER THAN AN ANECDOTE. I first compared
  // Olivia (self-coached) against Naomi (middle coach) and blamed the coach - but those two differ
  // in SEED as well, so the comparison was confounded and the conclusion unearned. Holding the seed
  // and sweeping only the tier is the isolation that claim needed and did not have.
  const world = createWorld(w.seed, coachTier ? { ...w.profile, coachTier } : w.profile)
  const policy = POLICIES[policyIndex]
  world.coachOnEventWeeks = policy.coachOnEventWeeks
  const rng = rngFromSeed(world.seed)
  let bestWta: number | null = null
  const byTier: Record<string, number> = {}
  let entries = 0
  let conditionSum = 0
  let injured = 0
  let lived = 0
  for (let i = 0; i < weeks; i++) {
    const entered = stepCareerWeek(world, rng, policy)
    for (const [t, n] of Object.entries(entered)) {
      if (n > 0) {
        byTier[t] = (byTier[t] ?? 0) + n
        entries += n
      }
    }
    conditionSum += world.condition
    if (world.injury !== null) injured += 1
    lived += 1
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
    entries,
    // ⚠ FROM seasonHistory, NOT world.results - that list is PRUNED to the ranking window, so it
    // would report the bench's LAST YEAR against the owner's WHOLE CAREER. I made exactly that
    // mistake once and reported '717 against 18'; this is the like-for-like counter.
    matches: world.seasonHistory.reduce((n, s) => n + s.wins + s.losses, 0),
    byTier,
    meanCondition: lived ? conditionSum / lived : 0,
    weeksInjured: injured,
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

  // ⚠ HIS OWN ROW CANNOT REPORT ENTRIES OR CONDITION HISTORY - `world.results` is pruned to the
  // ranking window and condition is a scalar, not a series. What a save DOES carry per season is
  // wins and losses, so his matches are summed from `seasonHistory` and the bench's from the same
  // counter it ticks. Stated because an unexplained blank invites a wrong reading.
  const ownerMatches = w.seasonHistory.reduce((n, s) => n + s.wins + s.losses, 0)
  const rows: Run[] = [
    {
      label: 'THE OWNER (the save itself)',
      bestWta: null,
      endWta: w.kidRankWta ?? null,
      fundsCents: w.fundsCents,
      skills: sum(w.skills),
      endedWeek: null,
      ending: null,
      entries: -1,
      matches: ownerMatches,
      byTier: {},
      meanCondition: w.condition,
      weeksInjured: -1,
    },
  ]
  for (let pi = 0; pi < POLICIES.length; pi++) rows.push(replay(w, w.week, pi))

  // ⭐ THE COACH SWEEP, on ONE seed – the owner's challenge, 13.08: «стенд может проверять на
  // бюджетном тренере, не вижу проблем, там не сильно большая разница в приросте». Measured, his
  // memory is a little out: `middle` is 1.6-1.7x `budget` per hour ($40-60 against $24-36 young,
  // $52-78 against $32-48 old). Whether that is what stops her entering is the question this
  // answers, and it answers it on HER OWN seed with everything else held.
  const sweep: Run[] = []
  for (const tier of ['self', 'budget', 'middle', 'high'] as CoachTier[]) {
    const r = replay(w, w.week, 1, tier)
    sweep.push({ ...r, label: `player · ${tier}` })
  }

  console.log('who                            end rank   best rank        funds     skills   ended')
  for (const r of rows) {
    console.log(
      `${r.label.padEnd(30)}${(r.endWta ? `#${r.endWta}` : '–').padStart(8)}   ${(r.bestWta ? `#${r.bestWta}` : '–').padStart(8)}   ${money(r.fundsCents).padStart(12)}   ${r.skills.toFixed(1).padStart(7)}   ${r.ending ? `${r.ending} @${r.endedWeek}` : '–'}`,
    )
  }

  console.log(`\n${'-'.repeat(92)}\nWHAT SHE ACTUALLY DID – the discriminators\n${'-'.repeat(92)}`)
  console.log('who                             entries   matches   mean cond   wks injured')
  for (const r of rows) {
    console.log(
      `${r.label.padEnd(30)}${(r.entries < 0 ? 'n/a' : String(r.entries)).padStart(9)}${String(r.matches).padStart(10)}${r.meanCondition.toFixed(1).padStart(12)}${(r.weeksInjured < 0 ? 'n/a' : String(r.weeksInjured)).padStart(14)}`,
    )
  }
  for (const r of rows.slice(1)) {
    const tiers = Object.entries(r.byTier).sort((a, b) => b[1] - a[1])
    console.log(`\n  ${r.label} entered: ${tiers.map(([t, n]) => `${t} ${n}`).join(' · ') || 'nothing'}`)
  }
  console.log(`\n${'-'.repeat(92)}\nTHE COACH SWEEP – one seed, one policy, only the tier moves\n${'-'.repeat(92)}`)
  console.log('tier            end rank   best      funds     entries   matches   wta-track entries')
  for (const r of sweep) {
    const wta = Object.entries(r.byTier)
      .filter(([t]) => t.startsWith('w') || t.startsWith('slam'))
      .reduce((n, [, v]) => n + v, 0)
    console.log(
      `${r.label.padEnd(16)}${(r.endWta ? `#${r.endWta}` : '–').padStart(8)}${(r.bestWta ? `#${r.bestWta}` : '–').padStart(8)}${money(r.fundsCents).padStart(12)}${String(r.entries).padStart(10)}${String(r.matches).padStart(10)}${String(wta).padStart(18)}`,
    )
  }

  console.log(
    `\n⚠ "entries" and "wks injured" are n/a for the owner: a save prunes its results to the ranking\n` +
      `  window and keeps no condition series. His MATCHES are the sum of wins+losses over every\n` +
      `  banked season, which is the one comparable figure a save does carry.`,
  )
}

void main()
