/**
 * deep-run-cost – the owner's question, 14.08: «какой расход кондишна на шлемах и 1000? выдай
 * мин-макс пожалуйста и колонку с тотал промежуточным на каждом этапе.»
 *
 * ⚠ IT ASKS THE ENGINE, IT DOES NOT RESTATE IT. Every number comes out of `tournamentRunStrain` –
 * the same function `finalizeTournament` charges the kid with and `rival.ts` charges the cohort
 * with – so this table cannot drift from the game the way a hand-computed one would. The per-round
 * cost is read as a DIFFERENCE of two run totals, which is the only honest way to ask "what did the
 * n-th match cost" of a function whose whole subject is that the answer depends on n.
 *
 * ⚠ AND THE ROUND NAMES ARE THE ROUNDS SHE PLAYS, not the places she can go out at – the owner's
 * second correction on the same message: «у тебя расписаны очки за места вылетов, а не раунды игры.
 * в игре будет только F SF QF R16 R32 R64 R128.» A 128 draw is SEVEN rounds; the points array is
 * EIGHT long because seven of its entries are exits and the eighth is the champion, who exits
 * nowhere. `stageLabel(round, drawSize)` is the engine's own namer and is what this prints.
 *
 * MEASUREMENT ONLY. Run:
 *   npx vite-node tools/deep-run-cost.ts
 */
import { ECONOMY } from '../src/engine/economy'
import { matchDrain, tournamentRunStrain } from '../src/engine/condition'
import { TIERS } from '../src/engine/season/calendar'
import { stageLabel, finishLabel } from '../src/engine/world/labels'
import type { TierId } from '../src/engine/season/types'

/** The cheapest and dearest match the engine can price, read off `matchDrain` rather than asserted.
 *  Cheapest: straight sets, no tiebreak. Dearest: three sets, three of them tiebreaks (the cap). */
const EASIEST = '6-4 6-2'
const HARDEST = '7-6 6-7 7-6'

const RUNGS: TierId[] = ['slam', 'wta1000', 'wta500', 'w100']

function table(tier: TierId): void {
  const def = TIERS[tier]
  const rounds = Math.log2(def.drawSize)
  const surcharge = ECONOMY.condition.tierMatchFatigue[tier]
  console.log(`\n${'='.repeat(104)}`)
  console.log(
    `${def.label} – draw ${def.drawSize}, ${rounds} ROUNDS to the title, tier surcharge ${surcharge}` +
      ` (charged on the first ${ECONOMY.condition.surchargeMatchesPerRun} matches of a run)`,
  )
  console.log('='.repeat(104))
  console.log('  match  she plays          if she wins, she is   | cheapest match  total | dearest match  total | condition left')
  let prevMin = 0
  let prevMax = 0
  for (let n = 1; n <= rounds; n++) {
    const easy = tournamentRunStrain(tier, Array.from({ length: n }, () => ({ score: EASIEST })))
    const hard = tournamentRunStrain(tier, Array.from({ length: n }, () => ({ score: HARDEST })))
    const stepMin = easy - prevMin
    const stepMax = hard - prevMax
    prevMin = easy
    prevMax = hard
    // What winning THIS match makes her: the finish index one better than going out here.
    const finishIfSheWins = rounds - n
    console.log(
      `  ${String(n).padStart(5)}  ${stageLabel(n - 1, def.drawSize).padEnd(18)} ${finishLabel(finishIfSheWins).padEnd(21)} |` +
        `${String(stepMin).padStart(15)}${String(easy).padStart(7)} |${String(stepMax).padStart(14)}${String(hard).padStart(7)} |` +
        `${String(100 - hard).padStart(11)}–${100 - easy}`,
    )
  }
  console.log(
    `\n  A TITLE COSTS ${prevMin} AT BEST AND ${prevMax} AT WORST` +
      `   (she starts a week at 100 at most, so she comes home on ${100 - prevMax}–${100 - prevMin})`,
  )
}

function main(): void {
  const c = ECONOMY.condition
  console.log('deep-run-cost · every figure read out of tournamentRunStrain, the engine\'s own charge\n')
  console.log(`  one match = scoreline (${c.matchFatigue.straightSets} straight sets / ${c.matchFatigue.hardMatch} a 3-setter or a tiebreak` +
    ` / +${c.matchFatigue.extraTiebreaks} for a third tiebreak set) + the tier surcharge`)
  console.log(`  cheapest match priced here: "${EASIEST}" (${matchDrain('slam', EASIEST)} at a Slam)` +
    `   ·   dearest: "${HARDEST}" (${matchDrain('slam', HARDEST)} at a Slam)`)
  console.log(`  plus the cumulative ladder ${JSON.stringify(ECONOMY.condition.runFatigueLadderWta)} – the EXTRA the n-th match of one run costs`)
  console.log(`  minus the surcharge past match ${c.surchargeMatchesPerRun}: a deep round is not another flight (14.08)`)
  console.log(`\n  recovery, for scale: ${ECONOMY.condition.matchWeekRecoveryBase} in a week she plays, and a full rest week or a holiday pays far more.`)
  for (const t of RUNGS) table(t)

  // ⚠ THE COMPARISON THAT ANSWERS "IS A DEEP DRAW BRUTAL": the same title, at the draw we shipped
  // and at the draw we had. Patch-and-restore, the licensed idiom (tools/best16-bench.ts).
  console.log(`\n${'='.repeat(104)}\nWHAT THE DEEPER DRAW ACTUALLY COST HER – the same title, before and after 14.08\n${'='.repeat(104)}`)
  console.log('  rung        rounds  title cost (best–worst)   at draw 32 (best–worst)   difference')
  for (const tier of ['slam', 'wta1000'] as TierId[]) {
    const def = TIERS[tier] as { drawSize: number }
    const now = Math.log2(def.drawSize)
    const nowMin = tournamentRunStrain(tier, Array.from({ length: now }, () => ({ score: EASIEST })))
    const nowMax = tournamentRunStrain(tier, Array.from({ length: now }, () => ({ score: HARDEST })))
    const wasMin = tournamentRunStrain(tier, Array.from({ length: 5 }, () => ({ score: EASIEST })))
    const wasMax = tournamentRunStrain(tier, Array.from({ length: 5 }, () => ({ score: HARDEST })))
    console.log(
      `  ${TIERS[tier].label.padEnd(10)} ${String(now).padStart(6)}  ${`${nowMin}–${nowMax}`.padStart(22)}   ${`${wasMin}–${wasMax}`.padStart(22)}   ` +
        `+${nowMin - wasMin} / +${nowMax - wasMax}`,
    )
  }
}

main()
