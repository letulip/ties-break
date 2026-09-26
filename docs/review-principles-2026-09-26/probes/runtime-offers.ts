/**
 * Phase 0b probe – what the only-growing `world.offers` holds over a whole career (principles review
 * 26.09, baseline 03d92221). Same driver as runtime-career.ts (stepCareerWeek, POLICIES[1] 'player',
 * the e2e fixtures' question answering), no per-command work. At weeks 200/400/800/1200 and the end
 * it counts offers by kind x state, and how many are still live (deadlineWeek >= week, or state
 * 'accepted' with untilWeek >= week); plus world.events length (the 400-row feed cap).
 *
 *   npx vite-node docs/review-principles-2026-09-26/probes/runtime-offers.ts -- <presetIdx> <careerIdx>
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from '../../../tools/econ-bench'
import { drainLifeBeats } from '../../../tools/_lifeBeats'
import { answerBirthdayNeutral } from '../../../tools/_birthday'
import { answerFork, answerRetirement, pendingBirthday } from '../../../src/engine/world'

const argv = process.argv.slice(2).filter((a) => a !== '--')
const { world, rng, seed } = openCareer(PRESETS[Number(argv[0] ?? 5)], Number(argv[1] ?? 0), POLICIES[1])
const MARKS = new Set([200, 400, 800, 1200])

function report(label: string): void {
  const byKindState: Record<string, number> = {}
  let live = 0
  for (const o of world.offers) {
    const k = `${o.kind}/${o.state}`
    byKindState[k] = (byKindState[k] ?? 0) + 1
    if (o.deadlineWeek >= world.week || (o.untilWeek !== undefined && o.untilWeek >= world.week)) live++
  }
  const bytes = Buffer.byteLength(JSON.stringify(world.offers))
  const kinds = Object.entries(byKindState).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')
  const kept = world.events.filter((e) => e.keep)
  const keptBytes = Buffer.byteLength(JSON.stringify(kept))
  console.log(`${seed} ${label} w${world.week}: offers ${world.offers.length} (${bytes} B, live ${live}); events ${world.events.length} (kept ${kept.length}, ${keptBytes} B); ${kinds}`)
}

for (let i = 0; i < 2600 && world.ending === null; i++) {
  stepCareerWeek(world, rng, POLICIES[1])
  if (world.ending === null) {
    drainLifeBeats(world)
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
    if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
    drainLifeBeats(world)
  }
  if (MARKS.has(world.week)) report(`w${world.week}`)
}
report(`end (${world.ending?.type ?? 'cap'})`)
