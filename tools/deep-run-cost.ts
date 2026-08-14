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
      ` ramping over ${ECONOMY.condition.runFatigueLadderDeep.length} matches`,
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
  console.log(`  ⚠ a DEEP rung (draw > 32) runs on the owner's own curve instead: ladder ${JSON.stringify(c.runFatigueLadderDeep)},`)
  console.log(`    i.e. the surcharge ramps to its full value over three matches – min 5 6 7 7 7 7 7, max 7 8 9 9 9 9 9 (14.08)`)
  console.log(`\n  recovery, for scale: ${ECONOMY.condition.matchWeekRecoveryBase} in a week she plays, and a full rest week or a holiday pays far more.`)
  for (const t of RUNGS) table(t)

  // ⚠⚠ THE OWNER'S OWN FOLLOW-UP, 14.08: «нам теперь надо только удостовериться, что в расписании
  // 1000 и шлем не идут подряд никогда, иначе мы сами противоречим.» A deep title costs up to 60
  // and these two rungs caution below 60, so the schedule has to leave her room to come back – or
  // the game is warning her off a week it scheduled itself.
  console.log(`\n${'='.repeat(104)}\nCAN SHE GET BACK IN TIME? – the big events' own weeks, against what a deep run costs\n${'='.repeat(104)}`)
  const BIG: TierId[] = ['slam', 'wta1000']
  const weeks = BIG.flatMap((t) => (TIERS[t].anchorWeeks ?? []).map((w) => ({ w, t }))).sort((a, b) => a.w - b.w)
  console.log(`  ${weeks.map((x) => `${x.w}${x.t === 'slam' ? '*' : ''}`).join(' · ')}      (* = Slam)`)
  let minGap = Infinity
  let minPair = ''
  for (let i = 1; i < weeks.length; i++) {
    const gap = weeks[i].w - weeks[i - 1].w
    if (gap < minGap) {
      minGap = gap
      minPair = `week ${weeks[i - 1].w} -> week ${weeks[i].w}`
    }
  }
  console.log(`\n  closest pair: ${minPair}, ${minGap} weeks apart – so ${minGap - 1} FREE week(s) in between.`)
  console.log(`  back to back would be a gap of 1. ${minGap > 1 ? 'They never are.' : '⚠ THEY ARE.'}`)

  const c2 = ECONOMY.condition
  const floor = ECONOMY.availability.minConditionToEnter.slam
  const worst = tournamentRunStrain('slam', Array.from({ length: 7 }, () => ({ score: HARDEST })))
  const free = c2.recoveryBase + c2.restRecoveryBonus[0].bonus // the most a match-free week can pay without physio
  const grind = c2.recoveryBase // ...and the least, on a training-heavy plan
  console.log(
    `\n  worst-case Slam title: she ends the week on ${c2.max - worst}. The entry floor for these two rungs is ${floor}.` +
      `\n  a free week pays ${grind} (grind plan) to ${free} (rest plan), before physio.`,
  )
  for (const [label, perWeek] of [['rest plan', free], ['grind plan', grind]] as [string, number][]) {
    const after = c2.max - worst + perWeek * (minGap - 1)
    console.log(
      `    ${label.padEnd(11)}: ${c2.max - worst} + ${minGap - 1} x ${perWeek} = ${after}` +
        `   ${after >= floor ? `– clears ${floor}, no warning` : `– ${floor - after} under ${floor}: she is WARNED, not refused`}`,
    )
  }
  const easyWorst = tournamentRunStrain('slam', Array.from({ length: 7 }, () => ({ score: EASIEST })))
  console.log(
    `  and the ORDINARY case, a straight-sets title: ${c2.max - easyWorst} + ${minGap - 1} x ${grind} = ` +
      `${c2.max - easyWorst + grind * (minGap - 1)} – clear either way.`,
  )
  // ⚠⚠ AND THE FLOOR IS A WARNING, NOT A GATE, WHICH IS THE HALF THAT DECIDES THIS QUESTION.
  // `entryVerdict` returns `{ level: 'caution', reason: 'fatigued' }` below `minConditionToEnter`;
  // the only thing that REFUSES an entry is `medicalBlock`, at ECONOMY.availability.medicalFloor.
  // So the schedule cannot contradict itself by making an event unenterable - the worst it can do
  // is make one unwise, which is the design («мы ни за что не наказываем»).
  console.log(
    `\n  ⚠ THE ${floor} IS A CAUTION, NOT A GATE: entryVerdict returns level 'caution' below it and only` +
      ` medicalBlock (${ECONOMY.availability.medicalFloor}) refuses.` +
      `\n    So the calendar can never make a big event UNENTERABLE - only unwise. What it can do is raise` +
      `\n    her injury risk, and \`mandatoryBinds\` deliberately does not ask her condition, so a` +
      ` top-${ECONOMY.mandatory.maxRank} player` +
      `\n    who wins a Slam is choosing between a tired entry and a penalty point. That is the interaction` +
      `\n    to watch - not whether the two rungs collide, which they do not.`,
  )

  // ⚠ THE COMPARISON THAT ANSWERS "IS A DEEP DRAW BRUTAL": the same title, at the draw we shipped
  // and at the draw we had. Patch-and-restore, the licensed idiom (tools/best16-bench.ts).
  console.log(`\n${'='.repeat(104)}\nWHAT THE DEEPER DRAW ACTUALLY COST HER – the same title, before and after 14.08\n${'='.repeat(104)}`)
  console.log('  rung        rounds  title cost (best–worst)   at draw 32 (best–worst)   difference')
  for (const tier of ['slam', 'wta1000'] as TierId[]) {
    const def = TIERS[tier] as { drawSize: number }
    const now = Math.log2(def.drawSize)
    const nowMin = tournamentRunStrain(tier, Array.from({ length: now }, () => ({ score: EASIEST })))
    const nowMax = tournamentRunStrain(tier, Array.from({ length: now }, () => ({ score: HARDEST })))
    // ⚠ THE "BEFORE" ARM HAS TO PUT THE OLD LADDER BACK, not just shorten the run: these rungs are
    // DEEP now, so `ladderFor` hands them the ramp, and five matches on the ramp is not what a
    // draw-32 Slam ever cost. Patch-and-restore on the knob `ladderFor` reads.
    const knob = ECONOMY.condition as unknown as { runFatigueLadderDeep: number[] }
    const shipped = knob.runFatigueLadderDeep
    knob.runFatigueLadderDeep = ECONOMY.condition.runFatigueLadderWta
    const wasMin = tournamentRunStrain(tier, Array.from({ length: 5 }, () => ({ score: EASIEST })))
    const wasMax = tournamentRunStrain(tier, Array.from({ length: 5 }, () => ({ score: HARDEST })))
    knob.runFatigueLadderDeep = shipped
    console.log(
      `  ${TIERS[tier].label.padEnd(10)} ${String(now).padStart(6)}  ${`${nowMin}–${nowMax}`.padStart(22)}   ${`${wasMin}–${wasMax}`.padStart(22)}   ` +
        `+${nowMin - wasMin} / +${nowMax - wasMax}`,
    )
  }
}

main()
