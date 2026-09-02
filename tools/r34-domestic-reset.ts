// ROUND 34 #1 – DO HER NATIONAL POINTS ZERO AT A SEASON BOUNDARY, AND DO THE GATES RE-CLOSE?
//
//   npx vite-node tools/r34-domestic-reset.ts [--seasons 3]
//
// HIS WORDS: «в начале 2го сезона все очки в региональном уровне у меня обнулились, мне снова
// закрылся регионарный и национальный чемпионаты, хотя мы до них добрались. И кажется, что оно
// обнуляется каждой год. Или это так надо? … совершенно непонятно как выйти в j уровень»
//
// Two separate questions with two different answers, so the walk records both, week by week, off a
// real `toSnapshot` and through the SHIPPED `tierState`:
//
//   POINTS   `snapshot.ladders.domestic.points` – her national best-6
//   GATE     `snapshot.tierOpen[rung]` – the engine's own floor verdict
//   CHIP     what the Home strip / Season ladder plaque says for that rung that week
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'
import { answerFork, answerRetirement, toSnapshot, type WorldState } from '../src/engine/world'
import { tierState } from '../src/composables/tierState'
import { TIER_SHORT, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { UPCOMING_WEEKS } from '../src/engine/world/constants'
import type { TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEASONS = argOf('seasons', 3)
const PRESET = argOf('preset', 4)
const SEED = argOf('seed', 0)

function answerWhateverIsOpen(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) {
    answerRetirement(world, world.retirementOffer.reason === 'plateau' || world.retirementOffer.final)
  }
}

const WATCH: TierId[] = ['regional', 'national', 'j30']

const { world, rng } = openCareer(PRESETS[PRESET], SEED, POLICIES[1])
console.log(`ROUND 34 #1 – ${PRESETS[PRESET].label} seed ${SEED}, ${SEASONS} seasons from week 0\n`)
console.log('  week  offset  domestic pts   regional   national   j30      j30 chip')
let prevOpen: Record<string, boolean> = {}
const closures: string[] = []
for (let w = 0; w < SEASONS * WEEKS_PER_YEAR; w++) {
  answerWhateverIsOpen(world)
  if (world.ending) break
  const snap = toSnapshot(world)
  const pts = snap.ladders.domestic.points
  const open: Record<string, boolean> = {}
  for (const t of WATCH) open[t] = snap.tierOpen?.[t] === true
  const j30 = tierState('j30', {
    ageYears: snap.ageYears,
    points: pts,
    upcoming: snap.upcoming,
    horizonWeeks: UPCOMING_WEEKS,
    entryCap: snap.entryCap,
    proEntryCap: snap.proEntryCap,
    engineOpen: snap.tierOpen?.j30,
    engineOutgrown: snap.tierOutgrown?.j30,
    refusal: snap.tierRefusal?.j30,
    acceptsRank: snap.tierAcceptance?.j30,
    itfRank: snap.ladders.itf.rank ?? null,
    itfPoints: snap.ladders.itf.points,
  })
  const offset = world.week % WEEKS_PER_YEAR
  // Print the season boundary in full, and any week a watched gate CHANGES.
  const changed = WATCH.some((t) => prevOpen[t] !== undefined && prevOpen[t] !== open[t])
  if (offset <= 1 || offset >= WEEKS_PER_YEAR - 1 || changed) {
    console.log(
      `  ${String(world.week).padStart(4)}  ${String(offset).padStart(6)}  ${String(pts).padStart(12)}   ` +
        WATCH.map((t) => (open[t] ? 'open ' : 'SHUT ').padEnd(10)).join(' ') +
        `  ${j30.note}`,
    )
  }
  for (const t of WATCH) {
    if (prevOpen[t] === true && open[t] === false) {
      closures.push(`  w${world.week} (season week ${offset}): ${TIER_SHORT[t]} RE-CLOSED at ${pts} national pts`)
    }
  }
  prevOpen = open
  stepCareerWeek(world, rng, POLICIES[1])
}
console.log('\nGATES THAT RE-CLOSED AFTER BEING OPEN:')
for (const line of closures) console.log(line)
if (!closures.length) console.log('  none')
