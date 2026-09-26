// Lane B probe (26.09 review, baseline 03d92221). Read-only.
// Question: `resumeFromCollege` ticks up to a year in one command and PAUSES for a birthday; the tick
// raises life beats at college (no `inCollege` guard on the rolls, phaseHerWeek.ts:321-623). Does the
// year loop stop on a BLOCKING beat, or tick past it the way the ▶▶ 52 loop did before v85 T11b?
// Recipe = tests/collegeBirthdayFixtures.ts `openedAtCollege` (fork forced at week ~60) + a real
// fork-age arm (walk to 19 with the player answering every beat, then answer 'college').
import {
  answerFork, callUpRevealOpen, closeTournament, collegeLeagueRevealOpen, createWorld, decideKnock,
  pendingBirthday, pendingKnock, pendingLifeBeat, resumeFromCollege, revealTournamentRound, skipTournament,
  tickWeek, type WorldState,
} from '../../../src/engine/world'
import { LIFE_BEAT_BLOCKING } from '../../../src/engine/world/lifeBeat'
import { WEEKS_PER_YEAR } from '../../../src/engine/season/calendar'
import { resumeMain } from '../../../src/engine/rng'
import { DEFAULT_PROFILE } from '../../../src/shared/protocol'
import { answerBirthdayNeutral } from '../../../tools/_birthday'
import { drainLifeBeats } from '../../../tools/_lifeBeats'

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) revealTournamentRound(world)
  if (world.pendingTournament) closeTournament(world)
}
function answerCollegeReveal(world: WorldState): void {
  if (!collegeLeagueRevealOpen(world) && !callUpRevealOpen(world)) return
  skipTournament(world)
  closeTournament(world)
}
function live(world: WorldState, rng: ReturnType<typeof resumeMain>): void {
  tickWeek(world, rng)
  finishAnyReveal(world)
  if (pendingKnock(world)) decideKnock(world, 'rest')
  if (world.ending === null && pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
}
function toCollege(seed: string, forkAtWeek: number | 'age19'): { world: WorldState; rng: ReturnType<typeof resumeMain> } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
  const rng = resumeMain(world.rngMain)
  if (forkAtWeek === 'age19') {
    for (let i = 0; i < 520 && world.fork === null; i++) live(world, rng)
    if (world.fork === null) throw new Error('no fork')
    drainLifeBeats(world)
  } else {
    for (let i = 0; i < forkAtWeek; i++) live(world, rng)
    world.fork = { askedWeek: world.week, answer: null, offer: null }
  }
  world.fundsCents = 500_000_00
  answerFork(world, 'college')
  for (let i = 0; i < WEEKS_PER_YEAR + 2 && world.ending === null; i++) live(world, rng)
  if (world.ending?.type !== 'college') throw new Error(`no college latch: ${world.ending?.type}`)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
  return { world, rng }
}

let yearsTotal = 0, yearsWithBlockingPassed = 0
const kinds: Record<string, number> = {}
for (const arm of ['forced60', 'age19'] as const) {
  for (let s = 0; s < 8; s++) {
    const seed = `b-college-${arm}-${s}`
    let world: WorldState, rng: ReturnType<typeof resumeMain>
    try { ({ world, rng } = toCollege(seed, arm === 'forced60' ? 60 : 'age19')) } catch (e) { console.log(seed, 'skip', String(e)); continue }
    for (let guard = 0; guard < 24 && world.ending?.type === 'college'; guard++) {
      const from = world.week
      const stops = resumeFromCollege(world, rng)
      const to = world.week
      // blocking rows raised INSIDE the year and still unanswered, whose week is BEFORE the week the call stopped on
      const passed = (world.lifeLog ?? []).filter((r) => r.answer === null && LIFE_BEAT_BLOCKING[r.kind] && r.week > from && r.week < to)
      yearsTotal++
      if (passed.length > 0) {
        yearsWithBlockingPassed++
        for (const r of passed) kinds[r.kind] = (kinds[r.kind] ?? 0) + 1
        console.log(`${seed} year ${from}->${to} stops=${JSON.stringify(stops)} passed=${JSON.stringify(passed.map((r) => `${r.kind}@${r.week}`))} pendingNow=${pendingLifeBeat(world)?.kind ?? null}`)
      }
      answerCollegeReveal(world)
      if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
      drainLifeBeats(world)
    }
  }
}
console.log(`college year-calls: ${yearsTotal}; calls that ticked past >=1 unanswered BLOCKING beat: ${yearsWithBlockingPassed}; by kind ${JSON.stringify(kinds)}`)
