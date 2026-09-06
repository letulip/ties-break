/**
 * r38-decline-cliff – WHY A TOP-50 PLAYER STOPS WINNING W35s IN TWO SEASONS.
 *
 * Round 38, the owner 06.09: «как 1-2 года назад она была в топ-50 и топ-100 и вполне могла играть,
 * даже на шлеме куда-то продвигалась немного, а потом внезапно вообще не смогла и проигрывает даже
 * w35 турниры. Значит у нас с деградацией скиллов какие-то вопросы. Вот куда надо смотреть: что у
 * нас деградирует и по какому механизму.»
 *
 * ⚠ MEASUREMENT ONLY. It changes no constant and writes nothing. Two questions, and the second is
 * the one his sentence is really about:
 *
 *   §1 THE RECOVERY DECOMPOSITION – what a free week actually returns, term by term, and how much of
 *      it the age fade is allowed to touch. His «у 35 летней всё равно приходит по 9 в неделю».
 *
 *   §2 THE CLIFF – her match-win probability against three real opponents, walked down the body she
 *      actually had at each age. If the fall in results is steeper than the fall in skills, the
 *      cause is the SHAPE OF THE CURVE FROM SKILL TO RESULT and not the decline rate.
 *
 * ⚠ THE SAVE IS PERSONAL: read through the game's own import door, never copied, never a fixture.
 *
 * Run: npx vite-node tools/r38-decline-cliff.ts -- --save /path/career.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { ageCurveOf, declineFactor, physicalMean, SKILL_KEYS } from '../src/engine/development'
import { kidAgeExact } from '../src/engine/world/age'
import { recoveryBaseFor, recoveryAgeFade, restRecoveryBonus } from '../src/engine/world/medical'
import { masseurRungOf, masseurWorksThisWeek } from '../src/engine/world/masseur'
import { rankingFor, fieldProsOf, tierOpenFor, tierOutgrown, isTierEligible, kidPoints, acceptanceRank, activeLadderOf } from '../src/engine/world/ladder'
import { TIER_LADDER, TIERS } from '../src/engine/season/calendar'
import { basePServe } from '../src/engine/match/point'
import { pMatchBo3 } from '../src/engine/match/closedForm'
import { kidMatchPlayer } from '../src/engine/world/player'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { conditionMatchFactor } from '../src/engine/condition'
import type { MatchOptions } from '../src/engine/match/types'
import type { KidSkills, WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
let savePath = ''
for (let i = 0; i < args.length; i++) if (args[i] === '--save' && args[i + 1]) savePath = args[++i]!
if (!savePath) {
  console.error('usage: npx vite-node tools/r38-decline-cliff.ts -- --save /path/career.tsave')
  process.exit(1)
}

const f2 = (n: number) => n.toFixed(2)
const pad = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)

async function main() {
  const world = (await decodeExportFile(new Uint8Array(readFileSync(savePath)))) as WorldState
  const age = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
  const bounds = ageCurveOf(world.ageCurve, world.careerTotals?.weeksLostToInjury ?? 0)

  // ============================================================================================
  console.log('='.repeat(100))
  console.log(`§1 THE RECOVERY DECOMPOSITION – a FREE week at age ${f2(age)}`)
  console.log('='.repeat(100))
  const fade = recoveryAgeFade(world)
  const phaseBase = ECONOMY.condition.proPhaseRecoveryBase
  const body = recoveryBaseFor(world)
  const rest = restRecoveryBonus(world.plan.rest)
  const physio = world.physioActive ? ECONOMY.physio.conditionBonusPerWeek : 0
  const masseur = masseurWorksThisWeek(world) ? masseurRungOf(world).conditionBonusPerWeek : 0
  const total = body + rest + physio + masseur
  console.log(`  her body            ${f2(phaseBase)} x fade ${f2(fade)}  = ${f2(body)}`)
  console.log(`  the rest slider     (plan.rest ${world.plan.rest})            = ${f2(rest)}`)
  console.log(`  the physio          (${world.physioActive ? 'on' : 'off'})                     = ${f2(physio)}`)
  console.log(`  the masseur         (${world.masseurSessionsPerWeek ?? 0} sessions)            = ${f2(masseur)}`)
  console.log(`  ${'-'.repeat(56)}`)
  console.log(`  a free week returns                        = ${f2(total)}`)
  console.log()
  console.log(`  ⚠ the fade reaches ${f2(body)} of ${f2(total)} points – ${f2((body / total) * 100)}%.`)
  console.log(`    ${f2(total - body)} of them are BOUGHT services that do not age at all.`)
  const floorBody = phaseBase * ECONOMY.condition.recoveryAgeFloor
  console.log(`  ⚠ and the floor is ${ECONOMY.condition.recoveryAgeFloor}: her body can never return less than ${f2(floorBody)},`)
  console.log(`    so the worst free week she can ever have still returns ${f2(floorBody + rest + physio + masseur)}`)
  console.log(`    against the ${f2(phaseBase + rest + physio + masseur)} of a twenty-year-old with the same staff.`)

  // ============================================================================================
  console.log()
  console.log('='.repeat(100))
  console.log('§2 THE CLIFF – the same woman, walked back up her own decline')
  console.log('='.repeat(100))

  const wta = rankingFor(world, 'wta')
  const pros = new Map(fieldProsOf(world).map((p: { id: string }) => [p.id, p]))
  const pick = (rank: number) => {
    const row = wta[rank - 1]
    return row ? pros.get(row.playerId) : undefined
  }
  const opponents: { label: string; player: unknown }[] = []
  for (const [label, rank] of [['#3 (tour elite)', 3], ['#50', 50], ['#150', 150], ['#400 (a w35 field)', 400]] as [string, number][]) {
    const p = pick(rank)
    if (p) opponents.push({ label, player: p })
  }

  /** Her skills at `atAge`, reconstructed exactly: past declineStart nothing else moves a physical
   *  attribute, so each is TODAY's value divided by the product of the weekly factors since then. */
  function skillsAt(atAge: number): KidSkills {
    const out = { ...world.skills }
    let factor = 1
    for (let a = atAge; a < age; a += 1 / WEEKS_PER_YEAR) factor *= 1 - declineFactor(a, bounds)
    for (const k of SKILL_KEYS) if (k !== 'composure') out[k] = world.skills[k] / factor
    return out
  }

  const AGES = [30, 31, 32, 33, 34, Math.round(age * 100) / 100]
  console.log(pad('age', 7) + padL('physMean', 10) + padL('serve', 8) + padL('ret', 8) + padL('grnd', 8) +
    opponents.map((o) => padL(o.label.slice(0, 17), 19)).join(''))
  for (const a of AGES) {
    const s = skillsAt(a)
    const her = kidMatchPlayer({ seed: world.seed, profile: world.profile, skills: s })
    her.age = a
    const cells = opponents.map((o) => {
      const him = rivalMatchPlayer(o.player as never, 'hard', ECONOMY.condition.max)
      const opts: MatchOptions = { surface: 'hard', tour: 'wta', seed: 'cliff' }
      const p = pMatchBo3(basePServe(her, him, opts), basePServe(him, her, opts))
      return padL(f2(p * 100) + '%', 19)
    })
    console.log(pad(f2(a), 7) + padL(f2(physicalMean(s)), 10) + padL(f2(s.serve), 8) + padL(f2(s.ret), 8) + padL(f2(s.groundstrokes), 8) + cells.join(''))
  }

  console.log()
  console.log('  ⚠ READ THE TWO COLUMNS TOGETHER. If `physMean` falls by X% and the win probabilities')
  console.log('    fall by much more than X%, the cliff is in the SKILL-TO-RESULT curve, not in the')
  console.log('    decline rate – and softening `declineAccel` cannot fix it.')

  // ============================================================================================
  console.log()
  console.log('='.repeat(100))
  console.log('§3 WHAT CONDITION IS WORTH, for comparison – the other lever he named')
  console.log('='.repeat(100))
  console.log('  «может она должна больше уставать и больше терять за матч своей кондиции»')
  console.log()
  console.log(pad('condition', 12) + padL('matchFactor', 14) + padL('effective physMean', 20))
  for (const cond of [100, 90, 80, 70, 60, 50, 40]) {
    const factor = conditionMatchFactor(cond)
    console.log(pad(cond, 12) + padL(f2(factor), 14) + padL(f2(physicalMean(world.skills) * factor), 20))
  }
  console.log()
  console.log('  ⚠ `conditionMatchFactor` scales ALL FIVE attributes at the composition point, which is')
  console.log('    exactly the shape a skill loss has – so condition and decline are already the same')
  console.log('    lever wearing two names. What differs is that condition COMES BACK and skills do not.')

  await ladderBlock(world)
}

async function ladderBlock(world: WorldState) {
  console.log()
  console.log('='.repeat(100))
  console.log('§4 WHICH RUNGS SHE IS ALLOWED TO PLAY – the half his sentence is really about')
  console.log('='.repeat(100))
  const track = activeLadderOf(world)
  console.log(`  active ladder ${track} · her points ${kidPoints(world, track)} · WTA rank ${world.kidRankWta} · ITF rank ${world.kidRank}`)
  console.log()
  console.log(pad('tier', 10) + padL('eligible', 10) + padL('outgrown', 10) + padL('open', 8) + padL('acceptRank', 12))
  for (const tier of TIER_LADDER) {
    if (TIERS[tier].track !== 'wta') continue
    const pts = kidPoints(world, TIERS[tier].track)
    console.log(
      pad(tier, 10) +
        padL(String(isTierEligible(tier, pts)), 10) +
        padL(String(tierOutgrown(world, tier)), 10) +
        padL(String(tierOpenFor(world, tier)), 8) +
        padL(String(acceptanceRank(world, tier) ?? '-'), 12),
    )
  }
  console.log()
  console.log('  ⚠ `outgrown: true` means the rung is SHUT BEHIND HER – she may not enter it however')
  console.log('    badly she is playing. It is keyed on POINTS, and points are a 52-week trailing sum,')
  console.log('    so a falling player is barred from the tennis she could still win on the strength of')
  console.log('    results she can no longer repeat.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
