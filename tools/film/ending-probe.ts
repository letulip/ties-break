// WHICH ENDINGS A WALKED CAREER ACTUALLY REACHES, and how long the walk costs. The film needs one
// fixture per ending type and this is the reconnaissance: walk real careers through the bench's own
// harness (the same `openCareer` / `stepCareerWeek` every balance bench uses) and report what the
// SHIPPED resolvers latched, with no threshold touched.
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../econ-bench'
import { answerBirthdayNeutral } from '../_birthday'
import { drainLifeBeats } from '../_lifeBeats'
import { answerFork, answerRetirement, pendingBirthday, kidAgeYears } from '../../src/engine/world'
import type { ForkAnswer } from '../../src/shared/protocol'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'

const N = Number(process.env.N || 24)
const HORIZON = 40 * WEEKS_PER_YEAR

type Row = { seed: string; type: string; week: number; age: number; seasons: number; detail: string; lastTwo: string }

function walk(preset: (typeof PRESETS)[number], index: number, forkAnswer: ForkAnswer | null): Row {
  const { world, rng, seed } = openCareer(preset, index, POLICIES[1] ?? POLICIES[0])
  for (let i = 0; i < HORIZON && !world.ending; i++) {
    // the ordinary interruptions a player answers, answered neutrally so the walk never stalls
    if (pendingBirthday(world)) answerBirthdayNeutral(world)
    drainLifeBeats(world)
    if (world.fork !== null && world.fork.answer === null) {
      drainLifeBeats(world)
      answerFork(world, forkAnswer ?? 'continue')
    }
    if (world.retirementOffer) answerRetirement(world, true)
    if (world.ending) break
    stepCareerWeek(world, rng, POLICIES[1] ?? POLICIES[0])
  }
  const hist = world.seasonHistory.slice(-2)
  const wta = (e: any) => (e?.byTrack?.wta ? `#${e.byTrack.wta.endRank ?? '-'}/${e.byTrack.wta.points}` : '-')
  return {
    seed,
    type: world.ending?.type ?? '(still playing)',
    week: world.week,
    age: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
    seasons: world.seasonHistory.length,
    detail: world.ending?.detail ?? '',
    lastTwo: hist.map(wta).join(' -> '),
  }
}

const t0 = Date.now()
const rows: Row[] = []
for (let i = 0; i < N; i++) {
  const preset = PRESETS[i % PRESETS.length]
  rows.push(walk(preset, i, null))
}
console.log(`walked ${N} careers in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`)
console.log('  seed                       ending        wk   age  seasons  last two pro seasons   detail')
for (const r of rows)
  console.log(`  ${r.seed.padEnd(24)} ${r.type.padEnd(13)} ${String(r.week).padStart(4)} ${String(r.age).padStart(4)} ${String(r.seasons).padStart(8)}  ${r.lastTwo.padEnd(22)} ${r.detail.slice(0, 60)}`)
const tally: Record<string, number> = {}
for (const r of rows) tally[r.type] = (tally[r.type] ?? 0) + 1
console.log('\n  tally:', JSON.stringify(tally))
