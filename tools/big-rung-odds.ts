/**
 * big-rung-odds – WHAT SHOULD A BUILD LIKE HERS DO AT W100 AND ABOVE, and what did it do?
 *
 *   npx vite-node tools/big-rung-odds.ts -- --save ~/Downloads/a.tsave [--runs 400] [--band 15]
 *
 * THE QUESTION (owner, round 21, sharpened): «по победам меня снова интересуют w100+, особенно w250+
 * у Инес, где она показывает довольно слабые результаты – это ок для ее билда или нет … она за 2
 * последних сезона даже до QF нигде на больших турнирах ни разу не дошла.»
 *
 * TWO HALVES, BOTH MEASURED HERE, BECAUSE ONE WITHOUT THE OTHER CANNOT SETTLE IT:
 *
 *   1. WHAT THE MODEL ITSELF PREDICTS. Her real build is put into the real field the engine draws at
 *      each rung and the bracket is run many times off scratch sub-streams. The result is the finish
 *      DISTRIBUTION the shipped match engine says this build should produce. A build that ought to
 *      lose in round two is not a bug; a build that ought to reach quarter-finals and never does is.
 *   2. IS SHE ALONE. The same replay is run for the professionals who are actually STANDING at her
 *      rank – their builds are `fieldProsFor` rows and can be read exactly – so "is this normal for
 *      the band" is answered against the band rather than against an intuition.
 *
 * ⚠⚠ AND THE THIRD THING, WHICH HAD TO BE CHECKED FIRST: THE SEEDING INPUT. Round-21 #4 was exactly
 * this shape – she entered every draw as the lowest-ranked player because `kidSeedIndexIn` was handed
 * a table she is deliberately folded OUT of, so she was never found and never found meant bottom.
 * That fix is commit b790ea0 (15.08) and it is ON THIS WAVE BRANCH, so this tool prints her seed
 * index BOTH WAYS – fixed and pre-fix – and the gap between the two arms is how much of her record
 * the bug can account for.
 *
 * ⚠ THE SAVE IS PERSONAL AND IS NEVER COMMITTED, and neither is anything derived from one beyond the
 * aggregate facts quoted in docs/.
 *
 * ⚠ MEASUREMENT ONLY. Read-only on the world; every replay runs on its own `bigrung:` sub-stream and
 * nothing is written back, so the save's own MAIN position is untouched.
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { kidPoints } from '../src/engine/world'
import { kidMatchPlayerFor } from '../src/engine/world/player'
import { cohortIds, fieldProsOf, inTrack, rankingFor } from '../src/engine/world/ladder'
import { KID_ID } from '../src/engine/world/constants'
import { rngFromSeed } from '../src/engine/rng'
import { BEST_N_BY_TRACK, computeRanking } from '../src/engine/season/ranking'
import {
  buildDraw,
  kidSeedIndexIn,
  runTournament,
  seedsFor,
  selectEntrants,
} from '../src/engine/season/tournament'
import { mergedWtaRanking, universeForTier, type FieldPro } from '../src/engine/season/fieldPros'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { TIERS } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import type { SeasonEvent, TierId, RankingRow, AiPlayer } from '../src/engine/season/types'
import type { MatchPlayer } from '../src/engine/match/types'

const args = process.argv.slice(2)
const strOf = (n: string): string | null => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
const numOf = (n: string, d: number): number => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const RUNS = numOf('runs', 400)
/** how many professionals from her own rank band get the same replay, for the "is she alone" half */
const BAND = numOf('band', 12)

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const rule = (n = 112) => '-'.repeat(n)
const section = (t: string) => console.log(`\n${rule()}\n${t}\n${rule()}`)
const core4 = (s: { serve: number; ret: number; composure: number; stamina: number }) =>
  (s.serve + s.ret + s.composure + s.stamina) / 4

const BIG: TierId[] = ['w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam']
const FINISH_NAMES = ['CHAMPION', 'final', 'semi', 'QF', 'R16', 'R32', 'R64', 'R128']

async function main(): Promise<void> {
  const p = strOf('save')
  if (!p) {
    console.error('usage: big-rung-odds.ts -- --save <path.tsave>')
    process.exit(2)
  }
  const w = (await decodeExportFile(new Uint8Array(readFileSync(p.replace('~', process.env.HOME ?? '')))) ) as WorldState

  // ---------------------------------------------------------------------------------------------
  // The field machinery, rebuilt exactly as `computeShadowTournament` builds it (world.ts ~1520).
  // `rivalField` is not exported, so it is re-spelled here from `rivalMatchPlayer` – the one line it
  // is. Fatigue is empty: field pros carry no ledger in phase W and the cohort's own conditions are
  // a week-local derivation, so everybody reads fresh, which is what world.ts's own comment calls
  // "conservative in the right direction (the field she meets is at its best)".
  const pros = fieldProsOf(w)
  const selRanking: RankingRow[] = mergedWtaRanking(
    computeRanking(
      w.results.filter((r) => r.playerId !== KID_ID),
      w.week,
      BEST_N_BY_TRACK.wta,
      cohortIds(w),
      inTrack('wta'),
    ),
    pros,
  )
  const seedRanking = rankingFor(w, 'wta')
  const fresh = new Map<string, number>()
  const fieldOf = (entrants: AiPlayer[], surface: SeasonEvent['surface']): MatchPlayer[] =>
    entrants.map((x) => rivalMatchPlayer(x, surface, fresh.get(x.id) ?? ECONOMY.condition.max))

  /** A synthetic event of a given rung. Real calendar rows carry a surface and a cost; only the tier
   *  and the surface reach the bracket, and the surface is swept rather than picked so no single
   *  court favours or punishes her play style. */
  const eventFor = (tier: TierId, i: number): SeasonEvent => ({
    id: `probe-${tier}-${i}`,
    week: w.week,
    tier,
    surface: (['hard', 'clay', 'grass'] as const)[i % 3],
    travelCostCents: 0,
    deadlineWeek: w.week,
  })

  console.log(
    `BIG-RUNG ODDS – ${w.profile.kidName} ${w.profile.kidLastName}, week ${w.week}, WTA #${w.kidRankWta} on ${kidPoints(w, 'wta')} pts` +
      `\n  build: serve ${w.skills.serve.toFixed(1)} · ret ${w.skills.ret.toFixed(1)} · comp ${w.skills.composure.toFixed(1)}` +
      ` · stam ${w.skills.stamina.toFixed(1)} · grnd ${w.skills.groundstrokes.toFixed(1)}  ·  core ${core4(w.skills).toFixed(1)}` +
      `\n  ${RUNS} bracket replays per rung, on scratch \`bigrung:\` sub-streams (MAIN untouched)`,
  )

  // =============================================================================================
  section('1. THE SEEDING INPUT – checked first, because round-21 #4 was exactly this shape')
  console.log(
    `\n  ${padE('rung', 10)}${pad('draw', 6)}${pad('seeds', 7)}${pad('entrants', 10)}${pad('her seed idx', 14)}` +
      `${pad('SEEDED?', 10)}${pad('pre-fix idx', 13)}${pad('pre-fix seeded?', 17)}`,
  )
  const seedIdxOf: Partial<Record<TierId, number>> = {}
  for (const tier of BIG) {
    const ev = eventFor(tier, 0)
    const universe = universeForTier(tier, w.cohort, pros)
    const entrants = selectEntrants(ev, universe, selRanking, rngFromSeed(`bigrung:${tier}:seedcheck`))
    const field = fieldOf(entrants, ev.surface)
    const idx = kidSeedIndexIn(field, seedRanking, KID_ID)
    seedIdxOf[tier] = idx
    const s = seedsFor(TIERS[tier].drawSize)
    // PRE-FIX: `kidSeedIndexIn` was handed a table she is folded out of, so `posOf.get(kid)` missed
    // and `mine` fell back to `ranking.length` – i.e. every entrant outranked her.
    const preIdx = kidSeedIndexIn(field, selRanking, KID_ID)
    console.log(
      `  ${padE(tier, 10)}${pad(TIERS[tier].drawSize, 6)}${pad(s, 7)}${pad(field.length, 10)}${pad(idx, 14)}` +
        `${pad(idx < s ? 'YES' : 'no', 10)}${pad(preIdx, 13)}${pad(preIdx < s ? 'YES' : 'no', 17)}`,
    )
  }
  console.log(
    `\n  ⚠ "pre-fix" is the arm HER SAVE WAS PLAYED ON if the build predates b790ea0 (15.08). Where the` +
      `\n  two SEEDED columns agree, the bug changed nothing at that rung and her record there is clean` +
      `\n  evidence. Where they differ, the record at that rung is contaminated and cannot be read.`,
  )

  // =============================================================================================
  section('2. WHAT THE MODEL PREDICTS FOR HER BUILD – the finish distribution, per rung')
  const kid = kidMatchPlayerFor(w, 'hard', false)
  interface Dist { counts: number[]; pts: number; fieldCore: number[]; stronger: number[] }

  /** N replays of one rung for one player. `who` is spliced in at `seedIndex`, exactly as the engine
   *  splices the kid, so seeding, the bumped weakest entrant and the shuffle are all the real ones. */
  function replay(tier: TierId, who: MatchPlayer, seedIndexOverride: number | null, tag: string): Dist {
    const rounds = Math.log2(TIERS[tier].drawSize)
    const d: Dist = { counts: new Array(rounds + 1).fill(0), pts: 0, fieldCore: [], stronger: [] }
    for (let i = 0; i < RUNS; i++) {
      const ev = eventFor(tier, i)
      const universe = universeForTier(tier, w.cohort, pros)
      const entrants = selectEntrants(ev, universe, selRanking, rngFromSeed(`bigrung:${tier}:${tag}:sel:${i}`))
      const field = fieldOf(entrants, ev.surface)
      const idx = seedIndexOverride ?? kidSeedIndexIn(field, seedRanking, who.id)
      const res = runTournament(ev, field, who, w.seed, rngFromSeed(`bigrung:${tier}:${tag}:run:${i}`), idx)
      const f = res.finishes[who.id]
      if (f === undefined) continue
      d.counts[f] += 1
      d.pts += TIERS[tier].points[f] ?? 0
      if (i < 40) {
        const drawn = buildDraw(ev, field, who, idx, rngFromSeed(`bigrung:${tier}:${tag}:draw:${i}`))
        const mine = core4(who)
        d.fieldCore.push(drawn.reduce((s, x) => s + core4(x), 0) / drawn.length)
        d.stronger.push(drawn.filter((x) => core4(x) > mine).length / drawn.length)
      }
    }
    return d
  }

  console.log(
    `\n  ${padE('rung', 10)}${pad('P(QF+)', 9)}${pad('P(SF+)', 9)}${pad('P(title)', 10)}${pad('exp pts', 9)}` +
      `${pad('modal finish', 14)}${pad('field core', 12)}${pad('% stronger', 12)}${pad('accepts', 9)}`,
  )
  const herDist: Partial<Record<TierId, Dist>> = {}
  for (const tier of BIG) {
    const d = replay(tier, kid, null, 'her')
    herDist[tier] = d
    const n = d.counts.reduce((a, b) => a + b, 0)
    const rounds = Math.log2(TIERS[tier].drawSize)
    const atLeast = (f: number) => d.counts.slice(0, f + 1).reduce((a, b) => a + b, 0) / n
    const modal = d.counts.indexOf(Math.max(...d.counts))
    const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
    console.log(
      `  ${padE(tier, 10)}${pad(`${(100 * atLeast(3)).toFixed(1)}%`, 9)}${pad(`${(100 * atLeast(2)).toFixed(1)}%`, 9)}` +
        `${pad(`${(100 * atLeast(0)).toFixed(2)}%`, 10)}${pad((d.pts / n).toFixed(1), 9)}` +
        `${pad(FINISH_NAMES[modal] ?? `f${modal}`, 14)}${pad(mean(d.fieldCore).toFixed(1), 12)}` +
        `${pad(`${(100 * mean(d.stronger)).toFixed(0)}%`, 12)}${pad(TIERS[tier].acceptsRank ? '#' + TIERS[tier].acceptsRank : 'open', 9)}` +
        (rounds > 5 ? '' : ''),
    )
  }
  console.log(`\n  the same, as a full finish histogram (share of ${RUNS} replays):`)
  console.log(`  ${padE('rung', 10)}${FINISH_NAMES.map((x) => pad(x, 10)).join('')}`)
  for (const tier of BIG) {
    const d = herDist[tier]!
    const n = d.counts.reduce((a, b) => a + b, 0)
    console.log(
      `  ${padE(tier, 10)}` +
        FINISH_NAMES.map((_, f) => pad(f < d.counts.length ? `${((100 * d.counts[f]) / n).toFixed(1)}%` : '–', 10)).join(''),
    )
  }

  // =============================================================================================
  section('3. HOW MANY EVENTS A QF AT EACH RUNG IS WORTH WAITING FOR')
  console.log(
    `\n  If P(QF+) is p, the chance of NOT reaching one in k events is (1-p)^k. Her last two seasons` +
      `\n  are the k below, read off the ledger where it survives and off the trophy weeks where it does not.\n`,
  )
  console.log(`  ${padE('rung', 10)}${pad('P(QF+)', 9)}${pad('k=3', 9)}${pad('k=6', 9)}${pad('k=10', 9)}${pad('k=20', 9)}   P(no QF in k events)`)
  for (const tier of BIG) {
    const d = herDist[tier]!
    const n = d.counts.reduce((a, b) => a + b, 0)
    const p = d.counts.slice(0, 4).reduce((a, b) => a + b, 0) / n
    console.log(
      `  ${padE(tier, 10)}${pad(`${(100 * p).toFixed(1)}%`, 9)}` +
        [3, 6, 10, 20].map((k) => pad(`${(100 * Math.pow(1 - p, k)).toFixed(1)}%`, 9)).join(''),
    )
  }

  // =============================================================================================
  section(`4. IS SHE ALONE? – the same replay for the professionals STANDING at her rank`)
  {
    const byId = new Map<string, FieldPro>(pros.map((x) => [x.id, x]))
    const me = w.kidRankWta ?? 0
    const neighbours = selRanking
      .filter((r) => r.rank >= me - 25 && r.rank <= me + 25 && byId.has(r.playerId))
      .slice(0, BAND)
      .map((r) => byId.get(r.playerId)!)
    console.log(
      `\n  ${neighbours.length} professionals from #${me - 25}-#${me + 25}, each given HER OWN replay at the rungs in question.` +
        `\n  ⚠ Their seed index is computed the same way hers is, so nobody in this table gets a rule she does not.\n`,
    )
    const RUNGS: TierId[] = ['w100', 'wta125', 'wta250', 'wta500']
    console.log(`  ${padE('who', 22)}${pad('age', 5)}${pad('core', 7)}${pad('pts', 7)}   ${RUNGS.map((t) => pad(`P(QF+) ${t}`, 16)).join('')}`)
    const rows: { name: string; core: number; qf: number[] }[] = []
    const qfOf = (d: Dist) => {
      const n = d.counts.reduce((a, b) => a + b, 0)
      return n ? d.counts.slice(0, 4).reduce((a, b) => a + b, 0) / n : 0
    }
    for (const pro of neighbours) {
      const mp = rivalMatchPlayer(pro, 'hard', ECONOMY.condition.max)
      const qf = RUNGS.map((t) => qfOf(replay(t, mp, null, `pro-${pro.id}`)))
      rows.push({ name: pro.name, core: core4(pro), qf })
      console.log(
        `  ${padE(pro.name, 22)}${pad(pro.ageYears, 5)}${pad(core4(pro).toFixed(1), 7)}${pad(pro.wtaPoints, 7)}   ` +
          qf.map((x) => pad(`${(100 * x).toFixed(1)}%`, 16)).join(''),
      )
    }
    const herQf = RUNGS.map((t) => qfOf(herDist[t]!))
    console.log(
      `  ${padE('>> ' + w.profile.kidName + ' <<', 22)}${pad(Math.floor(22), 5)}${pad(core4(w.skills).toFixed(1), 7)}${pad(kidPoints(w, 'wta'), 7)}   ` +
        herQf.map((x) => pad(`${(100 * x).toFixed(1)}%`, 16)).join(''),
    )
    console.log(`\n  ${padE('BAND MEAN', 22)}${pad('', 5)}${pad((rows.reduce((s, r) => s + r.core, 0) / rows.length).toFixed(1), 7)}${pad('', 7)}   ` +
      RUNGS.map((_, i) => pad(`${(100 * rows.reduce((s, r) => s + r.qf[i], 0) / rows.length).toFixed(1)}%`, 16)).join(''))
    console.log(
      `\n  ⭐ IF THE BAND'S NUMBERS LOOK LIKE HERS, THE DISTRIBUTION IS THE ANSWER AND NOT A DEFECT.` +
        `\n  If hers is far below a band she out-cores, the probability is wrong somewhere and this is the row that says so.`,
    )
  }
}

void main()
