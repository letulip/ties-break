/**
 * run-cost-table – what a tournament run COSTS her, in condition, at every depth.
 *
 * The owner, 14.08: «какой расход кондишна на шлемах и 1000? выдай мин-макс пожалуйста». Fair –
 * the mechanism was explained and the number was not.
 *
 * Read straight off `tournamentRunStrain`, the one function both the kid (`finalizeTournament`) and
 * the rival cohort (`rival.ts reconstructRun`) charge through, so this is the shipped arithmetic and
 * not a restatement of it. MEASUREMENT ONLY.
 *
 *   npx vite-node tools/run-cost-table.ts
 */
import { matchDrain, tournamentRunStrain } from '../src/engine/condition'
import { ECONOMY } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import { finishLabel } from '../src/engine/world/labels'
import type { TierId } from '../src/engine/season/types'

/** The cheapest match this engine can produce: straight sets, no tiebreak. */
const EASIEST = '6-4 6-2'
/** The dearest: three sets, three of them tiebreaks – `matchDrain`'s hardMatch + extraTiebreaks. */
const HARDEST = '7-6 6-7 7-6'

const SHOW: TierId[] = ['slam', 'wta1000', 'wta500', 'w100', 'j300']

console.log('run-cost-table · condition spent on ONE tournament run, off the shipped tournamentRunStrain\n')
console.log(`  cheapest match = "${EASIEST}"   ·   dearest = "${HARDEST}"   ·   surcharge charged for the first ${ECONOMY.condition.surchargeMatchesPerRun} matches of a run\n`)

for (const tier of SHOW) {
  const def = TIERS[tier]
  const rounds = Math.log2(def.drawSize)
  console.log(`${'='.repeat(92)}`)
  console.log(
    `${def.label}  ·  draw ${def.drawSize}  ·  ${rounds} rounds to the title  ·  surcharge ${ECONOMY.condition.tierMatchFatigue[tier]}/match`,
  )
  console.log('='.repeat(92))
  console.log('  she reached        matches   MIN cost   MAX cost   |  that match alone: min / max')
  for (let played = 1; played <= rounds; played++) {
    // `played` matches means she LOST her `played`-th, unless she won them all - which is the title.
    const finish = rounds - played
    const easy = tournamentRunStrain(tier, new Array(played).fill({ score: EASIEST }))
    const hard = tournamentRunStrain(tier, new Array(played).fill({ score: HARDEST }))
    const easyPrev = played === 1 ? 0 : tournamentRunStrain(tier, new Array(played - 1).fill({ score: EASIEST }))
    const hardPrev = played === 1 ? 0 : tournamentRunStrain(tier, new Array(played - 1).fill({ score: HARDEST }))
    console.log(
      `  ${finishLabel(finish).padEnd(18)} ${String(played).padStart(5)}   ${String(easy).padStart(8)}   ${String(hard).padStart(8)}   |  ` +
        `${String(easy - easyPrev).padStart(3)} / ${String(hard - hardPrev).padStart(3)}${played > ECONOMY.condition.surchargeMatchesPerRun ? '   <- past the surcharge cap' : ''}`,
    )
  }
  // The two ends, said plainly.
  const one = tournamentRunStrain(tier, [{ score: EASIEST }])
  const oneHard = tournamentRunStrain(tier, [{ score: HARDEST }])
  const title = tournamentRunStrain(tier, new Array(rounds).fill({ score: EASIEST }))
  const titleHard = tournamentRunStrain(tier, new Array(rounds).fill({ score: HARDEST }))
  console.log(`\n  MIN-MAX for the whole rung: ${one}-${oneHard} for a first-round exit, ${title}-${titleHard} for the title.`)
  console.log(`  (out of 100 condition; recovery is ${ECONOMY.condition.matchWeekRecoveryBase}/week on a match week and more on a rest week)\n`)
}

// ⚠ THE COMPARISON THE OWNER'S QUESTION IS REALLY ABOUT: what the deeper draw did to the Slam.
console.log('='.repeat(92))
console.log('WHAT THE 128-DRAW COST, AND WHAT THE SURCHARGE CAP GAVE BACK')
console.log('='.repeat(92))
const slamSur = ECONOMY.condition.tierMatchFatigue.slam
const cap = ECONOMY.condition.surchargeMatchesPerRun
for (const [label, matches, extraSurcharged] of [
  ['a 5-match title, the OLD 32-draw', 5, 0],
  ['a 7-match title, if the surcharge were charged all 7 times', 7, 2],
  ['a 7-match title, AS SHIPPED (surcharge capped at 5)', 7, 0],
] as [string, number, number][]) {
  const base = tournamentRunStrain('slam', new Array(matches).fill({ score: EASIEST }))
  console.log(`  ${label.padEnd(58)} ${String(base + extraSurcharged * slamSur).padStart(3)}`)
}
console.log(
  `\n  So the two rounds a 128-draw added cost ${matchDrain('slam', EASIEST) - slamSur} each instead of ${matchDrain('slam', EASIEST)}:` +
    ` the match itself, without a second travel tax. The cap bites only past match ${cap}, and every rung`,
)
console.log('  below WTA 1000 draws 32 – five matches – so nothing outside the two deepened rungs moves at all.')
