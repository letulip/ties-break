// Lane C gap-fill probe (26.09 review, baseline 03d92221). Read-only: every mutation is on a clone.
// Question (lane B's hand-off, 02-engine-core.md lead-3 note): the small-talk fact
// `'march-entry-open'` (world/lifeBeat.ts:1726-1733) gates two rows that declare `college`
// (R8 `alone-or-with-them`, R20 `the-money-she-did-not-ask-about`, smallTalkCorpus.ts:1203, :2127).
// The fact asks `entryStatus` (world/medical.ts:992), which has no college clause, while `enterEvent`
// (world/entries.ts:39) refuses every entry during the freeze through `guardNotEnded`
// (world/constants.ts:58-69). So: on how many college pause-weeks does the gate say "a March entry
// is open and there is time to decide", and what does the engine answer when that entry is tried?
// Recipe = lane B's b-college-beats.ts `toCollege` (fork forced at week 60), 8 seeds, 4 college years.
import {
  COLLEGE_FREEZE_REFUSAL, answerFork, callUpRevealOpen, closeTournament, collegeLeagueRevealOpen, createWorld,
  decideKnock, enterEvent, entryStatus, lifeLogOf, pendingBirthday, pendingKnock, reachableSituations,
  resumeFromCollege, revealTournamentRound, skipTournament, tickWeek, TEMPERAMENTS, type WorldState,
} from '../../../src/engine/world'
import { WEEKS_PER_YEAR } from '../../../src/engine/season/calendar'
import { resumeMain } from '../../../src/engine/rng'
import { weekMonth } from '../../../src/shared/dates'
import { DEFAULT_PROFILE } from '../../../src/shared/protocol'
import { answerBirthdayNeutral } from '../../../tools/_birthday'
import { drainLifeBeats } from '../../../tools/_lifeBeats'

const TARGETS = ['alone-or-with-them', 'the-money-she-did-not-ask-about'] as const

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
function toCollege(seed: string): { world: WorldState; rng: ReturnType<typeof resumeMain> } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) live(world, rng)
  world.fork = { askedWeek: world.week, answer: null, offer: null }
  world.fundsCents = 500_000_00
  answerFork(world, 'college')
  for (let i = 0; i < WEEKS_PER_YEAR + 2 && world.ending === null; i++) live(world, rng)
  if (world.ending?.type !== 'college') throw new Error(`no college latch: ${world.ending?.type}`)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
  return { world, rng }
}
/** The fact's own predicate, mirrored for the probe only (it is not exported): which event makes it true. */
function marchEventOpen(world: WorldState) {
  return world.season.find(
    (e) => weekMonth(e.week) === 3 && e.week > world.week && !world.entries.includes(e.id) &&
      world.week < e.deadlineWeek && entryStatus(world, e).level !== 'blocked',
  )
}

let pauses = 0, gateTrue = 0, mirrorAgrees = 0, refusedFreeze = 0, refusedOther = 0, accepted = 0
let rowsAtCollege = 0
const refusalSamples = new Set<string>()
for (let s = 0; s < 8; s++) {
  const { world, rng } = toCollege(`c-march-${s}`)
  const from = world.college!.fromWeek
  for (let press = 0; press < 12 && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    answerCollegeReveal(world)
    if (world.ending?.type !== 'college') break
    pauses++
    const pooled = TEMPERAMENTS.some((t) => reachableSituations(world, t, 'college').some((r) => (TARGETS as readonly string[]).includes(r.id)))
    const ev = marchEventOpen(world)
    if (pooled) gateTrue++
    if (pooled === (ev !== undefined)) mirrorAgrees++
    if (pooled && ev) {
      const clone = structuredClone(world)
      try {
        enterEvent(clone, ev.id)
        accepted++
      } catch (e) {
        const msg = (e as Error).message
        if (msg === COLLEGE_FREEZE_REFUSAL) refusedFreeze++
        else { refusedOther++; refusalSamples.add(msg.slice(0, 80)) }
      }
    }
    if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
    drainLifeBeats(world)
  }
  const until = world.college!.untilWeek
  for (const row of lifeLogOf(world)) {
    if (row.kind === 'small-talk' && row.week >= from && row.week < until && TARGETS.some((t) => row.detail.includes(t))) rowsAtCollege++
  }
}
console.log(`seeds 8 · college pause-weeks asked ${pauses}`)
console.log(`gate true (R8 or R20 in reachableSituations(college), any voice): ${gateTrue} / ${pauses}`)
console.log(`probe mirror agrees with the gate: ${mirrorAgrees} / ${pauses}`)
console.log(`enterEvent on the gate's own March event: refused with COLLEGE_FREEZE_REFUSAL ${refusedFreeze} · refused otherwise ${refusedOther} · accepted ${accepted}`)
for (const m of refusalSamples) console.log(`  other refusal: ${m}`)
console.log(`R8/R20 small-talk rows raised inside the freeze (lifeLog, college weeks): ${rowsAtCollege}`)
