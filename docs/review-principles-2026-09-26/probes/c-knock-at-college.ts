// Lane C gap-fill probe (26.09 review, baseline 03d92221). Read-only.
// Question (lead 3, the `VOICE_LINES` row lane B left "not settled", 02-engine-core.md): the
// `restingKnock` / `pushingKnock` moments carry a `college` cell per voice (diary/weekNotes.ts:585-596
// and the three other voices). Their licence needs `f.knockChoice !== null`
// (weekNotes.ts:455-463), which the snapshot sets only while `knockGoverns(world.knock, world.week)`
// (world/snapshot.ts:1698, knock.ts:381). The knock never rolls at college (world/phaseGrowth.ts:399),
// and the diary is built only at SNAPSHOT time (diary.ts:664-716). So: does any college-stage
// snapshot week ever carry a governing knock?
// Arm A (natural): the b-college-beats 'age19' recipe (the fork at its own age), the player answering every
// knock, alternating rest / push, 30 seeds; every college-stage snapshot is read – the latch week,
// the week after each knock answer, every press's pause, and the end of each year.
// Arm B (constructed, the best case): the same walk, but on the week BEFORE the departure week a
// pushed knock is planted by hand (sinceWeek = departsWeek - 1, choice 'push'), which is the latest
// a knock can arrive and still govern into the freeze.
import {
  answerFork, callUpRevealOpen, closeTournament, collegeLeagueRevealOpen, createWorld, decideKnock,
  pendingBirthday, pendingKnock, resumeFromCollege, revealTournamentRound, skipTournament, tickWeek, toSnapshot,
  type WorldState,
} from '../../../src/engine/world'
import { WEEKS_PER_YEAR } from '../../../src/engine/season/calendar'
import { resumeMain } from '../../../src/engine/rng'
import { DEFAULT_PROFILE } from '../../../src/shared/protocol'
import { answerBirthdayNeutral } from '../../../tools/_birthday'
import { drainLifeBeats } from '../../../tools/_lifeBeats'

type Tally = { collegeSnaps: number; governing: number; examples: string[] }
const tally = (): Tally => ({ collegeSnaps: 0, governing: 0, examples: [] })

function read(world: WorldState, t: Tally, where: string): void {
  const d = toSnapshot(world).diary
  const f = d.facts
  if (f.lifeStage !== 'college') return
  t.collegeSnaps++
  if (f.knockChoice !== null) {
    t.governing++
    if (t.examples.length < 5) t.examples.push(`${world.seed} wk ${world.week} ${where} choice=${f.knockChoice} travelled=${f.travelled || f.playedTournament} mood=${f.moodRegister} injured=${f.injured !== null} weekNote=${JSON.stringify(d.weekNote)}`)
  }
}
function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) revealTournamentRound(world)
  if (world.pendingTournament) closeTournament(world)
}
function run(seed: string, plant: boolean, t: Tally): void {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
  const rng = resumeMain(world.rngMain)
  let flip = false
  const live = (): void => {
    tickWeek(world, rng)
    if (plant && world.fork?.departsWeek != null && world.week === world.fork.departsWeek - 1 && world.knock === null) {
      world.knock = { part: 'ankle', sinceWeek: world.week, repeat: false, choice: null, untilWeek: world.week }
    }
    finishAnyReveal(world)
    if (world.ending?.type === 'college') read(world, t, 'after-tick')
    // An unanswered knock under the college latch cannot be answered at all (c-knock-at-latch.ts,
    // finding C-06), so the walk answers only while the career is open.
    if (pendingKnock(world) && world.ending === null) {
      flip = !flip
      decideKnock(world, plant || flip ? 'push' : 'rest')
      if (world.ending?.type === 'college') read(world, t, 'after-knock-answer')
    }
    if (world.ending === null && pendingBirthday(world) !== null) answerBirthdayNeutral(world)
    drainLifeBeats(world)
  }
  // The fork at its own age (lane B's 'age19' arm): the diary's `college` stage needs school to be
  // over (diary/facts.ts:423-431), which a fork forced at week 60 never reaches.
  for (let i = 0; i < 520 && world.fork === null && world.ending === null; i++) live()
  if (world.fork === null) return
  drainLifeBeats(world)
  world.fundsCents = 500_000_00
  answerFork(world, 'college')
  for (let i = 0; i < WEEKS_PER_YEAR + 2 && world.ending === null; i++) live()
  if (world.ending?.type !== 'college') throw new Error(`no college latch: ${world.ending?.type}`)
  read(world, t, 'latch')
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
  for (let press = 0; press < 12 && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    if (world.ending?.type === 'college') read(world, t, `press ${press}`)
    if (collegeLeagueRevealOpen(world) || callUpRevealOpen(world)) { skipTournament(world); closeTournament(world) }
    if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
    drainLifeBeats(world)
  }
}

const natural = tally()
for (let s = 0; s < 30; s++) run(`c-knock-${s}`, false, natural)
const planted = tally()
for (let s = 0; s < 20; s++) run(`c-knock-plant-${s}`, true, planted)
for (const [name, t] of [['A natural (30 seeds)', natural], ['B planted push on departsWeek-1 (20 seeds)', planted]] as const) {
  console.log(`${name}: college-stage snapshots read ${t.collegeSnaps} · with knockChoice !== null ${t.governing}`)
  for (const e of t.examples) console.log(`  ${e}`)
}
