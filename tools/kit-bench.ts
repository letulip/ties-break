// DOES THE EQUIPMENT MATTER, AND DOES IT MATTER TOO MUCH?
// docs/specs/equipment-and-serve-speed.md §2, the constraint that decides whether the slice ships:
//
//   «Нам нужно совсем немного реализма, % там, половина там, и уже интересно.»
//   ...and, from the same conversation: «если девочка плохо играет - она и с лучшим тренером и в
//   лучшем экипе будет это делать точно так же».
//
// So equipment must be VISIBLE and must never be DESTINY. The wealthy family already buys better
// gear more often (ECONOMY.gear's price table), so a generous coefficient here would mean money buys
// strokes - and this project's own standing rule is that a timing or effort effect must never become
// a talent effect.
//
// THE YARDSTICK IS HUMAN, NOT A PERCENTAGE: `SKILL_POINTS_PER_YEAR` = 2.4, what one year of junior
// development is worth, which is also what the relative age effect pays a January girl over a
// December one. The whole equipment swing - worst kit to best, all three lines at once - must come in
// UNDER one year of relative age. §5 is the verdict.
//
// Run: npx vite-node tools/kit-bench.ts

import { ECONOMY } from '../src/engine/economy'
import {
  applyKit,
  FRESH_KIT,
  KIT_GRADES,
  SPENT_KIT,
  kitInjuryFactor,
  kitMultipliers,
  kitWearAt,
  type KitWear,
} from '../src/engine/equipment'
import type { KitState } from '../src/shared/protocol'
import { SKILL_POINTS_PER_YEAR, growWeek, rollPotential, SKILL_KEYS, type KidSkills } from '../src/engine/development'
import { COACH_TIERS, bestFitCoachAt, tierOf } from '../src/engine/coach'
import type { CoachTier } from '../src/shared/protocol'
import { startingSkills, kidAgeYears } from '../src/engine/world'
import { simulateMatch } from '../src/engine/match/engine'
import { paceAdvantage } from '../src/engine/match/point'
import { serveSpeedBase, expectedServeSpeed } from '../src/engine/match/serveSpeed'
import { DEFAULT_PROFILE, type FamilyBackground } from '../src/shared/protocol'
import type { MatchPlayer, MatchOptions } from '../src/engine/match/types'

const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']
const HORIZON = 208 // 14 -> 18, the horizon every other bench in this repo reports on
const MATCHES = 4000

/** A reference junior, at the mean attribute a real 14->18 career actually reaches. */
function ref(id: string, level: number, age = 16): MatchPlayer {
  return { id, name: id, serve: level, ret: level, composure: level, stamina: level, groundstrokes: level, age }
}

function meanAttr(p: MatchPlayer): number {
  return (p.serve + p.ret + p.composure + p.stamina + p.groundstrokes) / 5
}

/** Win rate of A over B across `MATCHES` seeded matches. */
function winRate(a: MatchPlayer, b: MatchPlayer, tag: string): number {
  const opts = (seed: string): MatchOptions => ({ surface: 'hard', tour: 'wta', seed })
  let won = 0
  for (let i = 0; i < MATCHES; i++) if (simulateMatch(a, b, opts(`${tag}:${i}`)).winner === 0) won++
  return won / MATCHES
}

/** THE COMMON CURRENCY. How many skill points on EVERY attribute reproduce a given win-rate gap -
 *  so a kit effect, a pace term and a coach rung can all be quoted in the same unit and compared.
 *  Bisected against the same match engine, so it is measured rather than derived from a coefficient. */
function skillPointsFor(winGap: number, level: number, age: number, tag: string): number {
  if (winGap <= 0) return 0
  const opp = ref('opp', level, age)
  // ⚠ ONE SEED SET FOR EVERY PROBE, including the baseline. Letting the seed move with the candidate
  // makes each probe an independent sample and the bisection then converges on Monte-Carlo noise
  // rather than on the effect - which is how §4 first read non-monotonic across a monotonic input.
  const baseline = winRate(ref('a', level, age), opp, tag)
  let lo = 0
  let hi = 10
  for (let it = 0; it < 14; it++) {
    const mid = (lo + hi) / 2
    if (winRate(ref('a', level + mid, age), opp, tag) - baseline < winGap) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

console.log('='.repeat(92))
console.log('KIT BENCH - is the equipment visible, and is it destiny?')
console.log(`  yardstick: SKILL_POINTS_PER_YEAR = ${SKILL_POINTS_PER_YEAR} (one year of junior development / relative age)`)
console.log('='.repeat(92))

// ---------------------------------------------------------------------------------------------
// §1 THE NOMINAL SWING: best kit against worst kit, identical everything else.
// ---------------------------------------------------------------------------------------------
console.log('\n§1  NOMINAL SWING - fresh kit vs fully spent kit, same girl, same opponent')
const LEVEL = 57 // the mean attribute a real 14->18 career reaches (development.ts:152)
const best = applyKit(ref('best', LEVEL), FRESH_KIT)
const worst = applyKit(ref('worst', LEVEL), SPENT_KIT)
console.log('   attribute      fresh     spent      delta (skill points)')
for (const k of ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const) {
  const d = best[k] - worst[k]
  console.log(`   ${k.padEnd(13)} ${best[k].toFixed(2).padStart(6)}   ${worst[k].toFixed(2).padStart(6)}   ${d > 0 ? '-' : ' '}${d.toFixed(3).padStart(6)}`)
}
const nominalMean = meanAttr(best) - meanAttr(worst)
console.log(`   MEAN ATTRIBUTE DELTA: ${nominalMean.toFixed(3)} skill points`)

const wrBest = winRate(best, ref('opp', LEVEL), 'kit')
const wrWorst = winRate(worst, ref('opp', LEVEL), 'kit')
console.log(`\n   win rate vs an identical opponent: fresh ${(wrBest * 100).toFixed(2)}%  spent ${(wrWorst * 100).toFixed(2)}%`)
console.log(`   WIN-RATE GAP: ${((wrBest - wrWorst) * 100).toFixed(2)} points over ${MATCHES} matches per arm`)
const nominalSp = skillPointsFor(wrBest - wrWorst, LEVEL, 16, 'kit')
console.log(`   => WORTH ${nominalSp.toFixed(2)} SKILL POINTS on every attribute (measured by bisection, not derived)`)

// ---------------------------------------------------------------------------------------------
// §2 THE REALISED SWING: what a career actually experiences, and the background gap.
// ---------------------------------------------------------------------------------------------
console.log('\n§2  REALISED WEAR - what a real career actually lives at (the family always buys on cadence)')
console.log('   background   strings  frame  shoes   |  mean attribute penalty (skill points)')
const realised: Record<string, number> = {}
for (const bg of BACKGROUNDS) {
  const acc: KitWear = { strings: 0, frame: 0, shoes: 0 }
  let penalty = 0
  let n = 0
  for (let s = 0; s < 40; s++) {
    for (let w = 0; w <= HORIZON; w++) {
      const wear = kitWearAt(`kit-bench-${s}`, bg, w)
      acc.strings += wear.strings
      acc.frame += wear.frame
      acc.shoes += wear.shoes
      penalty += meanAttr(ref('x', LEVEL)) - meanAttr(applyKit(ref('x', LEVEL), wear))
      n++
    }
  }
  realised[bg] = penalty / n
  console.log(
    `   ${bg.padEnd(11)}  ${(acc.strings / n).toFixed(3)}   ${(acc.frame / n).toFixed(3)}  ${(acc.shoes / n).toFixed(3)}   |  ${(penalty / n).toFixed(3)}`,
  )
}
const bgGap = realised.working - realised.wealthy
console.log(`\n   ⚠ THE BACKGROUND GAP (working minus wealthy): ${bgGap.toFixed(3)} skill points`)
console.log('     This is the number that decides whether money buys strokes. Everything else in §1 is')
console.log('     a bound nobody reaches, because the family always restrings on its cadence.')

// ---------------------------------------------------------------------------------------------
// §3 THE COACH LADDER, measured in the SAME currency rather than quoted from a comment.
// ---------------------------------------------------------------------------------------------
console.log('\n§3  THE COACH LADDER - the same girl, 14 to 18, at each rung (mean attribute at 18)')
function careerAt(rung: CoachTier, seed: string): number {
  const profile = { ...DEFAULT_PROFILE }
  let skills: KidSkills = startingSkills(seed, profile)
  const potential = rollPotential(seed, skills)
  // ...through the SAME helper a real career opens with, so the rung really is the rung she would
  // actually have hired rather than a guessed roster id that silently resolves to nobody.
  const coach = rung === 'self' ? null : bestFitCoachAt(seed, 14, rung, profile.playStyle)
  for (let w = 0; w < HORIZON; w++) {
    skills = growWeek({
      skills,
      potential,
      // `growWeek` has always developed HER, not the band (world.ts) - so the bench feeds the same
      // clock the engine does rather than the market's restocking one.
      ageYears: kidAgeYears(w, profile.birthMonth, profile.birthDay),
      plan: { train: 70, rest: 30 },
      coach,
      playStyle: profile.playStyle,
      matchesThisWeek: 0,
      seed,
      week: w,
    })
  }
  return SKILL_KEYS.reduce((s, k) => s + skills[k], 0) / SKILL_KEYS.length
}
const rungMeans: Record<string, number> = {}
for (const rung of COACH_TIERS) {
  let total = 0
  const SEEDS = 24
  for (let s = 0; s < SEEDS; s++) total += careerAt(rung, `kit-coach-${s}`)
  rungMeans[rung] = total / SEEDS
  console.log(`   ${rung.padEnd(8)} ${rungMeans[rung].toFixed(2)}`)
}
const ladderSpread = rungMeans.elite - rungMeans.self
const hiredSpread = rungMeans.elite - rungMeans.budget
console.log(`   LADDER SPREAD self -> elite: ${ladderSpread.toFixed(2)} skill points`)
console.log(`   ...and across the HIRED rungs budget -> elite: ${hiredSpread.toFixed(2)} skill points`)

// ---------------------------------------------------------------------------------------------
// §4 THE PACE TERM, in the same currency.
// ---------------------------------------------------------------------------------------------
console.log('\n§4  THE PACE TERM in basePServe - the age half of the serve speed, as skill points')
console.log('   age gap   km/h of pace   win-rate gap   skill points')
for (const [younger, older] of [[14, 15], [14, 16], [14, 17], [14, 19]] as const) {
  const a = ref('a', LEVEL, older)
  const b = ref('b', LEVEL, younger)
  const pace = paceAdvantage(a, b)
  const wr = winRate(a, b, `pace-${younger}-${older}`)
  // Measured against the SAME-age baseline, so the pace term is the only thing separating them.
  const flat = winRate(ref('a', LEVEL, older), ref('b', LEVEL, older), `pace-${younger}-${older}`)
  const sp = skillPointsFor(wr - flat, LEVEL, older, `pace-sp-${younger}-${older}`)
  console.log(
    `   ${younger}->${older}      ${pace.toFixed(1).padStart(5)}          ${((wr - flat) * 100).toFixed(2).padStart(6)}         ${sp.toFixed(2)}`,
  )
}
console.log('   (exactly 0 inside one age band, by construction - see PACE_K)')

// ---------------------------------------------------------------------------------------------
// §6 THE QUALITY LADDER (W3-KIT) - the rung the PLAYER buys, in the same currency as everything else.
//
// ⚠ THE NOMINAL BOUND IS NOT RE-MEASURED HERE, BECAUSE THE LADDER CANNOT MOVE IT. A rung only
// decides where on the EXISTING wear curve she stands (`startWear`) and how long that curve is
// (`lifeFactor`), and both land inside `kitWearAt`'s `clamp01` - so every state the ladder can reach
// lies inside [FRESH_KIT, SPENT_KIT] and §1's 2.01 IS the ladder's ceiling too, structurally. What
// is worth measuring is the REALISED swing: what a career actually lives at on each rung.
// ---------------------------------------------------------------------------------------------
console.log('\n§6  THE QUALITY LADDER - realised wear and its cost, per rung (working family)')
console.log('   rung          strings  frame  shoes   |  mean attribute penalty  |  injury factor')
const rungPenalty: Record<string, number> = {}
const rungInjury: Record<string, number> = {}
for (const grade of KIT_GRADES) {
  const kit: KitState = { grade: { strings: grade, frame: grade, shoes: grade }, sinceWeek: { strings: 0, frame: 0, shoes: 0 } }
  const acc: KitWear = { strings: 0, frame: 0, shoes: 0 }
  let penalty = 0
  let injury = 0
  let n = 0
  for (let s = 0; s < 40; s++) {
    for (let w = 0; w <= HORIZON; w++) {
      const wear = kitWearAt(`kit-bench-${s}`, 'working', w, null, kit)
      acc.strings += wear.strings
      acc.frame += wear.frame
      acc.shoes += wear.shoes
      penalty += meanAttr(ref('x', LEVEL)) - meanAttr(applyKit(ref('x', LEVEL), wear))
      injury += kitInjuryFactor(wear)
      n++
    }
  }
  rungPenalty[grade] = penalty / n
  rungInjury[grade] = injury / n
  console.log(
    `   ${grade.padEnd(12)}  ${(acc.strings / n).toFixed(3)}   ${(acc.frame / n).toFixed(3)}  ${(acc.shoes / n).toFixed(3)}   |          ${(penalty / n).toFixed(3)}         |  ${(injury / n).toFixed(4)}`,
  )
}
const ladderGapAttr = rungPenalty.alloy - rungPenalty.pro
// Measured the same way §1 measures the wear swing: build the two REALISED states off the table
// above, play them against an identical opponent, and bisect the win-rate gap into skill points -
// so the ladder is quoted in the currency the yardstick is written in.
function realisedPlayer(grade: (typeof KIT_GRADES)[number]): MatchPlayer {
  const kit: KitState = { grade: { strings: grade, frame: grade, shoes: grade }, sinceWeek: { strings: 0, frame: 0, shoes: 0 } }
  // The MEAN wear over a career, applied as one state - the same fold §2 reports.
  const acc: KitWear = { strings: 0, frame: 0, shoes: 0 }
  let n = 0
  for (let s = 0; s < 40; s++) {
    for (let w = 0; w <= HORIZON; w++) {
      const wear = kitWearAt(`kit-bench-${s}`, 'working', w, null, kit)
      acc.strings += wear.strings
      acc.frame += wear.frame
      acc.shoes += wear.shoes
      n++
    }
  }
  return applyKit(ref(grade, LEVEL), { strings: acc.strings / n, frame: acc.frame / n, shoes: acc.shoes / n })
}
const wrAlloy = winRate(realisedPlayer('alloy'), ref('opp', LEVEL), 'rung')
const wrPro = winRate(realisedPlayer('pro'), ref('opp', LEVEL), 'rung')
const ladderSp = skillPointsFor(wrPro - wrAlloy, LEVEL, 16, 'rung-sp')
console.log(`\n   REALISED LADDER SWING alloy -> pro: ${ladderGapAttr.toFixed(3)} mean attribute points`)
console.log(`   win rate vs an identical opponent: alloy ${(wrAlloy * 100).toFixed(2)}%  pro ${(wrPro * 100).toFixed(2)}%`)
console.log(`   => WORTH ${ladderSp.toFixed(2)} SKILL POINTS on every attribute (bisected, same method as §1)`)
console.log(
  `   injury threshold multiplier: alloy ${rungInjury.alloy.toFixed(4)} vs pro ${rungInjury.pro.toFixed(4)}` +
    `  (+${(((rungInjury.alloy - rungInjury.pro) / rungInjury.pro) * 100).toFixed(1)}% weekly risk on the bottom rung)`,
)
console.log('   ...against composite, the rung every shipped save migrates onto:')
console.log(
  `     composite penalty ${rungPenalty.composite.toFixed(3)} attr / injury ${rungInjury.composite.toFixed(4)}` +
    `  – §2's working row is ${realised.working.toFixed(3)} / and MUST match (it is the same numbers)`,
)

// ---------------------------------------------------------------------------------------------
// §5 THE VERDICT.
// ---------------------------------------------------------------------------------------------
console.log('\n§5  VERDICT against the yardstick')
const checks: [string, number, number, boolean][] = [
  ['nominal kit swing (fresh -> spent)', nominalSp, SKILL_POINTS_PER_YEAR, nominalSp < SKILL_POINTS_PER_YEAR],
  ['nominal kit swing vs coach ladder', nominalSp, ladderSpread, nominalSp < ladderSpread],
  ['realised background gap', bgGap, SKILL_POINTS_PER_YEAR, bgGap < SKILL_POINTS_PER_YEAR],
  ['realised background gap vs ladder', bgGap, ladderSpread, bgGap < ladderSpread],
  ['QUALITY LADDER alloy -> pro', ladderSp, SKILL_POINTS_PER_YEAR, ladderSp < SKILL_POINTS_PER_YEAR],
  ['QUALITY LADDER vs coach ladder', ladderSp, ladderSpread, ladderSp < ladderSpread],
]
for (const [label, value, bound, ok] of checks) {
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(38)} ${value.toFixed(2)}  <  ${bound.toFixed(2)}`)
}
console.log('\n   The sentence all of this has to support: a girl in worn kit who manages her load still')
console.log('   beats a rich one who grinds. Equipment is a thing she can feel, never a thing she is.')

// A last readout for the owner: what the box score actually shows, since that is where he sees it.
console.log('\n   Serve speed readout, fresh kit vs spent kit at 16 with serve 60:')
const m = kitMultipliers(SPENT_KIT)
console.log(
  `     fresh ${expectedServeSpeed(16, 60).toFixed(1)} km/h   spent ${expectedServeSpeed(16, 60 * m.serve).toFixed(1)} km/h` +
    `   (delta ${(expectedServeSpeed(16, 60) - expectedServeSpeed(16, 60 * m.serve)).toFixed(1)})`,
)
console.log(`   ...against ${(serveSpeedBase(19) - serveSpeedBase(14)).toFixed(1)} km/h from growing 14 -> 19, which is what actually moves the number.`)
console.log(`   (ECONOMY.equipment.shoeInjuryRise = ${ECONOMY.equipment.shoeInjuryRise}: worn soles raise the weekly injury threshold by up to that much)`)
console.log(`   (coach rungs on the ladder: ${COACH_TIERS.join(', ')}; tierOf(null) = ${tierOf(null)})`)
