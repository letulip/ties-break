// THE CASTING CALL. Walk real careers through the bench's own harness and report, for each one:
// what the SHIPPED resolvers latched on their own, and – for the two rare doors – whether that
// career's OWN draw key would pass.
//
// ⚠ NOTHING HERE MOVES A THRESHOLD OR A CHANCE. `ENDINGS.peakLeavingChance` (0.02) and
// `fallLeavingChance` (0.01) are read, never written. The draw is `rngFromSeed(`${seed}:ending:
// ${door}:${seasonIndex}`)()` exactly as `resolveLeaving` makes it, so "does this career's coin land"
// is a FACT ABOUT THAT CAREER. Choosing which career to film by it is casting, not tuning: the same
// thing a demo save is.
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../econ-bench'
import { answerBirthdayNeutral } from '../_birthday'
import { drainLifeBeats } from '../_lifeBeats'
import { answerFork, answerRetirement, pendingBirthday, kidAgeYears, leavingViewOf, wonTopTitleInSeason } from '../../src/engine/world'
import { ENDINGS, peakLeavingDue, fallLeavingDue } from '../../src/engine/ending'
import { rngFromSeed } from '../../src/engine/rng'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import type { ForkAnswer } from '../../src/shared/protocol'

const FROM = Number(process.env.FROM || 0)
const N = Number(process.env.N || 24)
const HORIZON = 40 * WEEKS_PER_YEAR
const POLICY = POLICIES[1] ?? POLICIES[0]

/** Would this career's own coin land, at this door, on this season? The engine's key, verbatim. */
const coin = (seed: string, door: 'peak' | 'fall', seasonIndex: number) =>
  rngFromSeed(`${seed}:ending:${door}:${seasonIndex}`)()

for (let i = FROM; i < FROM + N; i++) {
  const preset = PRESETS[i % PRESETS.length]
  const { world, rng, seed } = openCareer(preset, i, POLICY)
  const peakWinters: number[] = []
  const fallWinters: number[] = []
  let peakHit: number | null = null
  let fallHit: number | null = null
  let lastSeasons = 0
  for (let w = 0; w < HORIZON && !world.ending; w++) {
    if (pendingBirthday(world)) answerBirthdayNeutral(world)
    drainLifeBeats(world)
    if (world.fork !== null && world.fork.answer === null) {
      drainLifeBeats(world)
      answerFork(world, 'continue' as ForkAnswer)
    }
    if (world.retirementOffer) answerRetirement(world, true)
    if (world.ending) break
    stepCareerWeek(world, rng, POLICY)
    // a wrap has landed when the history grew; read the door the same way `resolveLeaving` does
    if (world.seasonHistory.length > lastSeasons) {
      lastSeasons = world.seasonHistory.length
      const view = leavingViewOf(world)
      if (peakLeavingDue(view)) {
        peakWinters.push(view.seasonIndex)
        if (peakHit === null && coin(seed, 'peak', view.seasonIndex) < ENDINGS.peakLeavingChance) peakHit = view.seasonIndex
      }
      if (fallLeavingDue(view)) {
        fallWinters.push(view.seasonIndex)
        if (fallHit === null && coin(seed, 'fall', view.seasonIndex) < ENDINGS.fallLeavingChance) fallHit = view.seasonIndex
      }
    }
  }
  const age = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
  const last = world.seasonHistory.at(-1)
  const wta = last?.byTrack?.wta
  console.log(
    `  ${seed.padEnd(24)} ${(world.ending?.type ?? 'playing').padEnd(11)} wk${String(world.week).padStart(4)} age${String(age).padStart(3)} s${String(world.seasonHistory.length).padStart(3)}` +
      ` | last #${String(wta?.endRank ?? '-').padStart(3)}/${String(wta?.points ?? 0).padStart(5)}` +
      ` | peak-eligible ${String(peakWinters.length).padStart(2)}${peakHit !== null ? ` COIN@${peakHit}` : ''}` +
      ` | fall-eligible ${String(fallWinters.length).padStart(2)}${fallHit !== null ? ` COIN@${fallHit}` : ''}` +
      ` | topTitle ${wonTopTitleInSeason(world)}`,
  )
}
