/**
 * r42-composure-bonus – ROUND 42 #35, MEASURED: what «past the ceiling» actually does to a career
 * over ten seasons, and whether it ever reaches the owner's +5.
 *
 * THE OWNER, 15.09: «может быть даже сделать какую-то возможность превосходить заложенную с сидом
 * выдержку с помощью психолога. Пусть и не сильно, но тем не менее» – and the three numbers the same
 * day: «+5 потолок, по очку за сезон… 0.2пп за сезон без этой тренировки».
 *
 * The shipped mechanic (engine/development.ts, «PAST THE CEILING»): `composureBonus` is HEADROOM
 * above her rolled ceiling, earned at 1/52 of a point a week while the psychologist works the
 * `'coolhead'` focus and lost at 0.2/52 a week while he does not, bounded at 0 and at +5. Ordinary
 * development does the climbing, so a bonus point is earned twice.
 *
 * ⚠ CLAUDE.md INVARIANT 5 – a balance change ships with a bench run and a spec recording predicted
 * vs measured. The predictions this run was written against, before it was ever executed:
 *
 *   P1  five seasons of continuous work reach the cap exactly, and season six buys nothing
 *   P2  her composure ends ABOVE her rolled ceiling by very nearly the whole bonus – «earned twice»
 *       says she has to climb into the room, and `coolheadGain` at the top rung is 3.5 points a
 *       season against a ceiling rising 1.0, so the climb should keep up easily
 *   P3  the number is small enough to be «пусть и не сильно»: +5 against a ceiling band of +4..+26
 *   P4  a BAND crosses on some careers and not most – `COMPOSURE_BANDS` cuts at 45 / 60 / 75, so a
 *       +5 only matters to a career sitting within 5 points under a cut
 *   P5  the idle arm unwinds at a fifth of the rate and keeps almost all of it over ten seasons
 *
 * ⚠ THREE ARMS, AND THE CONTROL IS THE SAME TREE WITH THE SEAT EMPTY (CLAUDE.md's own rule about
 * building the A arm where its reader is present): `none` never hires, `worked` works the focus
 * every week of ten seasons, `lapsed` works five and then stops. One code path, three careers.
 *
 * ⚠⚠ THE POLICY IS `player` AND THE FIRST RUN OF THIS FILE WAS A NULL ARM, recorded here rather than
 * quietly fixed – it is CLAUDE.md's own «prove the arm contains both the change and its reader»,
 * earned again. Written against `POLICIES[0]` (`grinder`) it reported a bonus of 0.00 on fifteen of
 * sixteen careers, which reads exactly like «the mechanic does nothing». It was not: the grinder
 * enters everything and goes BANKRUPT at weeks 97-191, long before the seat is ever posed at week
 * 364, so the walk measured zero weeks of work and reported it as zero effect. Under `player` –
 * the policy the owner's own careers use – all sixteen survive the ten seasons and the seat is
 * reachable. The tell was the shape of the null: an effect that is exactly 0.000 on every career but
 * one is not a weak effect, it is an arm that never ran.
 *
 * ⚠ Synthetic careers only; the owner's saves are read-only and are never read here.
 *
 * Run: npx vite-node tools/r42-composure-bonus.ts [-- --seeds 24 --seasons 10]
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { psychologistWorkingRung } from '../src/engine/world/psychologist'
import { ECONOMY } from '../src/engine/economy'
import { composureWord } from '../src/engine/kidLife'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const numArg = (flag: string, dflt: number): number => {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : dflt
}
const SEEDS = numArg('--seeds', 24)
const SEASONS = numArg('--seasons', 10)
/** She is ~15 here, which is the earliest age the seat is worth buying and well inside the growth
 *  window – so the ten seasons below are ten seasons she is actually developing through. */
const START_WEEK = 364

type Arm = 'none' | 'worked' | 'lapsed'

type Row = {
  preset: string
  seed: number
  ceiling: number
  startComposure: number
  endComposure: Record<Arm, number>
  endBonus: Record<Arm, number>
  startWord: string
  endWord: Record<Arm, string>
  /** the season index (1-based) the worked arm first sat on the cap, or 0 if it never did */
  cappedAtSeason: number
  /** how many of the ten seasons' weeks the seat actually WORKED – the stand-downs made visible */
  workedWeeks: number
}

/** The seat, posed for an arm at a given season. ⚠ POSED AND NOT HIRED THROUGH THE COMMAND: this
 *  measures the growth arithmetic, and `hirePsychologist`'s gate, price and ledger row are their own
 *  suite's claim. The BILL is deliberately not paid here either – a wallet that ran dry would end
 *  careers and turn a growth measurement into an economy one. */
function poseSeat(world: WorldState, arm: Arm, seasonsDone: number): void {
  const working = arm === 'worked' || (arm === 'lapsed' && seasonsDone < 5)
  world.psychologistHired = working
  world.psychologistFocus = working ? 'coolhead' : null
  world.psychologistRung = 2
}

function walkArm(presetIndex: number, seed: number, arm: Arm): { world: WorldState; capped: number; worked: number } {
  const policy = POLICIES[1]
  const { world, rng } = openCareer(PRESETS[presetIndex], seed, policy)
  // Run her forward to the start week with nobody hired – the three arms must share one history up
  // to the moment they diverge, or the comparison measures the run-up as well as the seat.
  while (world.week < START_WEEK && world.ending === null) stepCareerWeek(world, rng, policy)
  let capped = 0
  let worked = 0
  for (let season = 0; season < SEASONS; season++) {
    for (let w = 0; w < WEEKS_PER_YEAR && world.ending === null; w++) {
      poseSeat(world, arm, season)
      if (psychologistWorkingRung(world, 'coolhead') !== undefined) worked++
      stepCareerWeek(world, rng, policy)
    }
    if (capped === 0 && world.composureBonus >= ECONOMY.psychologist.composureBonusCap - 1e-9) capped = season + 1
  }
  return { world, capped, worked }
}

const rows: Row[] = []
for (const presetIndex of [5, 8]) {
  for (let seed = 0; seed < SEEDS; seed++) {
    const none = walkArm(presetIndex, seed, 'none').world
    const workedRun = walkArm(presetIndex, seed, 'worked')
    const worked = workedRun.world
    const lapsed = walkArm(presetIndex, seed, 'lapsed').world
    const start = openCareer(PRESETS[presetIndex], seed, POLICIES[1]).world
    rows.push({
      preset: PRESETS[presetIndex].label,
      seed,
      ceiling: none.potential.composure,
      startComposure: start.skills.composure,
      endComposure: { none: none.skills.composure, worked: worked.skills.composure, lapsed: lapsed.skills.composure },
      endBonus: { none: none.composureBonus, worked: worked.composureBonus, lapsed: lapsed.composureBonus },
      startWord: composureWord(none.skills.composure),
      endWord: {
        none: composureWord(none.skills.composure),
        worked: composureWord(worked.skills.composure),
        lapsed: composureWord(lapsed.skills.composure),
      },
      cappedAtSeason: workedRun.capped,
      workedWeeks: workedRun.worked,
    })
  }
}

const mean = (xs: number[]): number => xs.reduce((t, x) => t + x, 0) / Math.max(1, xs.length)
const f2 = (x: number): string => x.toFixed(2)

console.log(`# r42-composure-bonus – ${rows.length} careers, ${SEASONS} seasons from week ${START_WEEK}`)
console.log(`# cap ${ECONOMY.psychologist.composureBonusCap} · +${ECONOMY.psychologist.composureBonusPerSeason}/season`
  + ` · −${ECONOMY.psychologist.composureBonusDecayPerSeason}/idle season · rung 2`)
console.log('')
console.log('preset                        seed  ceiling  none   worked  lapsed  bonusW  bonusL  word(none) -> word(worked)')
for (const r of rows) {
  console.log(
    `${r.preset.padEnd(28)}  ${String(r.seed).padStart(4)}  ${f2(r.ceiling).padStart(7)}`
      + `  ${f2(r.endComposure.none).padStart(5)}  ${f2(r.endComposure.worked).padStart(6)}`
      + `  ${f2(r.endComposure.lapsed).padStart(6)}  ${f2(r.endBonus.worked).padStart(6)}`
      + `  ${f2(r.endBonus.lapsed).padStart(6)}  ${r.endWord.none} -> ${r.endWord.worked}`,
  )
}

const gainW = rows.map((r) => r.endComposure.worked - r.endComposure.none)
const gainL = rows.map((r) => r.endComposure.lapsed - r.endComposure.none)
const overCeilingW = rows.map((r) => r.endComposure.worked - r.ceiling)
const overCeilingNone = rows.map((r) => r.endComposure.none - r.ceiling)
const crossed = rows.filter((r) => r.endWord.none !== r.endWord.worked)
const cappedW = rows.filter((r) => r.endBonus.worked >= ECONOMY.psychologist.composureBonusCap - 1e-9)

console.log('')
const cappedSeasons = rows.filter((r) => r.cappedAtSeason > 0).map((r) => r.cappedAtSeason)
console.log(`P1  bonus at the cap after ${SEASONS} worked seasons: ${cappedW.length}/${rows.length}`
  + `  (mean ${f2(mean(rows.map((r) => r.endBonus.worked)))})`)
console.log(`    first season on the cap: mean ${f2(mean(cappedSeasons))}`
  + `, min ${Math.min(...cappedSeasons)}, max ${Math.max(...cappedSeasons)}`
  + ` – the seat STANDS DOWN on booked family weeks, so a calendar season is not a worked one:`
  + ` ${f2(mean(rows.map((r) => r.workedWeeks)))} weeks worked of ${SEASONS * WEEKS_PER_YEAR}`)
console.log(`P2  composure above her ROLLED ceiling, worked arm: mean ${f2(mean(overCeilingW))}`
  + `  (control arm: ${f2(mean(overCeilingNone))})`)
console.log(`P3  worked − none: mean ${f2(mean(gainW))}, min ${f2(Math.min(...gainW))}, max ${f2(Math.max(...gainW))}`)
console.log(`P4  a band word CHANGED on ${crossed.length}/${rows.length} careers`
  + (crossed.length > 0 ? `: ${crossed.map((r) => `${r.endWord.none}->${r.endWord.worked}`).join(', ')}` : ''))
console.log(`P5  lapsed (5 worked + 5 idle): bonus mean ${f2(mean(rows.map((r) => r.endBonus.lapsed)))}`
  + `, composure gain mean ${f2(mean(gainL))}`)
