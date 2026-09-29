// Lane C gap-fill probe (26.09 review, baseline 03d92221). Read-only: every refused command runs on a clone.
// Found while settling lead 3's `VOICE_LINES` knock cells at `college` (c-knock-at-college.ts threw).
// Question: the tick rolls the knock in phase 3 (`if (!inCollege(world)) rollKnock(world)`,
// world/phaseGrowth.ts:399) and latches the departure in phase 7 (`resolveCollegeDeparture`,
// world/endings.ts:509, :962-975). So a knock can ARRIVE on the departure week and stand unanswered
// under the college latch. `decideKnock` opens with `guardNotEnded` (world/knock.ts:361), which throws
// COLLEGE_FREEZE_REFUSAL under that latch (world/constants.ts:68). `blockingOverlay` puts the knock
// ahead of the birthday once a birthday or life beat is laid over the college latch
// (composables/blockingOverlay.ts:91-95). How often, and what does a player then see and get?
// Arms: 'forced60' – the fork opened by hand at week 60 (b-college-beats.ts' recipe, which
// `tests/collegeBirthdayFixtures.ts` also uses); 'age19' – the fork at its own age, every beat answered.
// The walk answers every earlier knock 'rest' (the fixture's own policy).
import {
  COLLEGE_FREEZE_REFUSAL, answerFork, callUpRevealOpen, closeTournament, collegeLeagueRevealOpen, createWorld,
  decideKnock, pendingBirthday, pendingKnock, pendingLifeBeat, resumeFromCollege, revealTournamentRound,
  skipTournament, tickWeek, toSnapshot, type WorldState,
} from '../../../src/engine/world'
import { blockingOverlay } from '../../../src/composables/blockingOverlay'
import { WEEKS_PER_YEAR } from '../../../src/engine/season/calendar'
import { resumeMain } from '../../../src/engine/rng'
import { DEFAULT_PROFILE } from '../../../src/shared/protocol'
import { answerBirthdayNeutral } from '../../../tools/_birthday'
import { drainLifeBeats } from '../../../tools/_lifeBeats'

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) revealTournamentRound(world)
  if (world.pendingTournament) closeTournament(world)
}
function tryDecide(world: WorldState): string {
  const clone = structuredClone(world)
  try { decideKnock(clone, 'rest'); return 'accepted' } catch (e) {
    return (e as Error).message === COLLEGE_FREEZE_REFUSAL ? 'COLLEGE_FREEZE_REFUSAL' : `other: ${(e as Error).message.slice(0, 60)}`
  }
}

const out: string[] = []
const counts: Record<string, { careers: number; latched: number; knockAtLatch: number; birthdayOverKnock: number; stillPendingAtEnd: number }> = {}
for (const arm of ['forced60', 'age19'] as const) {
  const c = (counts[arm] = { careers: 0, latched: 0, knockAtLatch: 0, birthdayOverKnock: 0, stillPendingAtEnd: 0 })
  const N = arm === 'forced60' ? 60 : 30
  for (let s = 0; s < N; s++) {
    const world = createWorld(`c-latch-${arm}-${s}`, { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
    const rng = resumeMain(world.rngMain)
    c.careers++
    const live = (): void => {
      tickWeek(world, rng)
      finishAnyReveal(world)
      if (pendingKnock(world) && world.ending === null) decideKnock(world, 'rest')
      if (world.ending === null && pendingBirthday(world) !== null) answerBirthdayNeutral(world)
      if (world.ending === null) drainLifeBeats(world)
    }
    if (arm === 'forced60') {
      for (let i = 0; i < 60; i++) live()
      world.fork = { askedWeek: world.week, answer: null, offer: null }
    } else {
      for (let i = 0; i < 520 && world.fork === null && world.ending === null; i++) live()
      if (world.fork === null) continue
      drainLifeBeats(world)
    }
    world.fundsCents = 500_000_00
    answerFork(world, 'college')
    for (let i = 0; i < WEEKS_PER_YEAR + 2 && world.ending === null; i++) live()
    if (world.ending?.type !== 'college') continue
    c.latched++
    if (!pendingKnock(world)) continue
    c.knockAtLatch++
    const k = world.knock!
    const snap0 = toSnapshot(world)
    out.push(`${arm} ${world.seed}: latch wk ${world.week} (college.fromWeek ${world.college!.fromWeek}), knock sinceWeek ${k.sinceWeek}; ` +
      `overlay at latch = ${blockingOverlay(snap0)}; decideKnock -> ${tryDecide(world)}; lifeBeat pending ${pendingLifeBeat(world) !== null}`)
    // Walk the freeze the way the Home shell does, stopping at the first press whose snapshot puts the knock on screen.
    let shown = false
    for (let press = 0; press < 12 && world.ending?.type === 'college'; press++) {
      let stops: string[] = []
      try { stops = resumeFromCollege(world, rng) } catch (e) { out.push(`   press ${press}: resumeFromCollege threw ${(e as Error).message.slice(0, 70)}`); break }
      if (collegeLeagueRevealOpen(world) || callUpRevealOpen(world)) { skipTournament(world); closeTournament(world) }
      const snap = toSnapshot(world)
      const overlay = blockingOverlay(snap)
      if (!shown && overlay === 'knock') {
        shown = true
        c.birthdayOverKnock++
        out.push(`   press ${press} wk ${world.week}: stops [${stops.join(',')}] birthdayPrompt ${snap.birthdayPrompt !== null} lifeBeatPrompt ${snap.lifeBeatPrompt != null} ` +
          `-> overlay 'knock'; decideKnock -> ${tryDecide(world)}; resumeFromCollege again -> [${resumeFromCollege(structuredClone(world), resumeMain(world.rngMain)).join(',')}]`)
      }
      if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
      if (pendingLifeBeat(world) !== null) drainLifeBeats(world)
    }
    if (pendingKnock(world)) c.stillPendingAtEnd++
    out.push(`   after the freeze: ending ${world.ending?.type ?? 'null'}, knock still pending ${pendingKnock(world)}`)
  }
}
for (const [arm, c] of Object.entries(counts)) {
  console.log(`${arm}: careers ${c.careers} · college latched ${c.latched} · unanswered knock standing under the latch ${c.knockAtLatch} · ` +
    `knock dialog put on screen at a freeze pause ${c.birthdayOverKnock} · still pending after the walk ${c.stillPendingAtEnd}`)
}
for (const l of out) console.log(l)
