// WHERE THE TWO DOORS ACTUALLY OPEN. The coin is common (2% and 1%, enumerable in milliseconds);
// the DOOR is the rare half – `peakLeavingDue` wants a paid table, age 25+, and a top-ten season or
// the top title. So this walks careers that ASK FOR ONE MORE YEAR every time (the only way a career
// lives long enough to be at the top at 25+) and reports every winter either door opened, with that
// winter's own coin beside it.
//
// ⚠ NOTHING IS TUNED: `peakLeavingDue` / `fallLeavingDue` / `ENDINGS` are read, never written.
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../econ-bench'
import { answerBirthdayNeutral } from '../_birthday'
import { drainLifeBeats } from '../_lifeBeats'
import { answerFork, answerRetirement, pendingBirthday, kidAgeYears, leavingViewOf } from '../../src/engine/world'
import { ENDINGS, peakLeavingDue, fallLeavingDue } from '../../src/engine/ending'
import { rngFromSeed } from '../../src/engine/rng'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import type { ForkAnswer } from '../../src/shared/protocol'

// ⭐ ONLY THE PRESETS THAT CAN REACH THE TOP. `peakLeavingDue` wants a top-ten season at 25+, and a
// self-coached working-class career does not get there – so the scan walks the three well-resourced
// presets (indices 6, 7, 8 of `PRESETS`) rather than burning ten seconds a career on the six that
// cannot open the door. That is where to LOOK, not what the door IS.
const INDICES = (process.env.INDICES || '')
  .split(',')
  .filter(Boolean)
  .map(Number)
const FROM = Number(process.env.FROM || 0)
const N = Number(process.env.N || 20)
const list = INDICES.length ? INDICES : Array.from({ length: N }, (_, k) => FROM + k)
const POLICY = POLICIES[1] ?? POLICIES[0]
const coin = (seed: string, door: 'peak' | 'fall', s: number) => rngFromSeed(`${seed}:ending:${door}:${s}`)()

for (const i of list) {
  const preset = PRESETS[i % PRESETS.length]
  const { world, rng, seed } = openCareer(preset, i, POLICY)
  let seen = 0
  const opens: string[] = []
  for (let w = 0; w < 45 * WEEKS_PER_YEAR && !world.ending; w++) {
    if (pendingBirthday(world)) answerBirthdayNeutral(world)
    drainLifeBeats(world)
    if (world.fork !== null && world.fork.answer === null) {
      drainLifeBeats(world)
      answerFork(world, 'continue' as ForkAnswer)
    }
    // ⭐ ONE MORE YEAR, EVERY TIME IT IS STILL A QUESTION. Declining is an ordinary player answer and
    // the only way a career is still on the paid table, near the top, at twenty-five.
    // ⚠ THE LAST OFFER IS NOT A QUESTION. `answerRetirement` THROWS on a declined `final` offer
    // (`LAST_OFFER_NOT_A_QUESTION`), which is the engine saying the career has run out of winters –
    // so "one more year, every time" means every offer that still has a next one.
    if (world.retirementOffer) answerRetirement(world, world.retirementOffer.final ? true : false)
    if (world.ending) break
    stepCareerWeek(world, rng, POLICY)
    if (world.seasonHistory.length > seen) {
      seen = world.seasonHistory.length
      const v = leavingViewOf(world)
      for (const [door, due, chance] of [
        ['peak', peakLeavingDue(v), ENDINGS.peakLeavingChance],
        ['fall', fallLeavingDue(v), ENDINGS.fallLeavingChance],
      ] as const) {
        if (!due) continue
        const c = coin(seed, door, v.seasonIndex)
        opens.push(`${door}@s${v.seasonIndex} age${v.ageYears} #${v.endRank ?? '-'} coin ${c.toFixed(4)}${c < chance ? ' ⭐LANDS' : ''}`)
      }
    }
  }
  const age = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
  console.log(`  ${seed.padEnd(22)} ${(world.ending?.type ?? 'playing').padEnd(11)} age${String(age).padStart(3)} s${String(world.seasonHistory.length).padStart(3)} | ${opens.join(' | ') || '(neither door opened)'}`)
}
