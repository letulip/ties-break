/**
 * skill-gap-odds – DOES SKILL DECIDE A MATCH, and by how much? The owner's oldest complaint,
 * measured rather than argued (docs/specs/the-skill-gap-2026-08.md).
 *
 *   npx vite-node tools/skill-gap-odds.ts [--worlds N] [--sims N] [--gain X] [--floor Y]
 *
 * THE QUESTION HAS TWO HALVES AND THIS TOOL ANSWERS BOTH IN THE SAME UNITS:
 *
 *   [A] THE SPORT'S UNIT – a RANK GAP. «топ-50 против топ-200 или топ-300». So section C puts the
 *       professional standing at rank R1 against the one at rank R2, drawn from the game's OWN
 *       population (`fieldProsFor` → `mergedWtaRanking`), built through the SAME `rivalMatchPlayer`
 *       path a real bracket builds them with, and reports the share of matches the LOWER-ranked one
 *       wins. That is directly comparable to `docs/research/the-upset-rate.md`.
 *
 *   [B] THE ENGINE'S UNIT – a CORE gap in skill points. Section B sweeps it, so the two tables can
 *       be laid over each other and the exchange rate between a rank and a skill point read off.
 *
 * ⚠ BOTH ARMS OF THE SHIPPED ENGINE ARE REPORTED, because the game uses two. An AI-vs-AI match is
 * ONE draw against `fastMatchProbability` (a closed form, no momentum, no fatigue); the kid's own
 * matches are `simulateMatch`, point by point, momentum ON. If those disagree, the owner's careers
 * and the world's careers are being decided by different physics – so the tool measures both and
 * prints the gap.
 *
 * ⚠ MEASUREMENT ONLY BY DEFAULT. `--gain` and `--floor` re-run section C against a PROPOSED curve
 * computed in this file – nothing in `src/` is touched, no constant moves, and the proposal arm is
 * clearly labelled. That is deliberate: the proposal has to be measurable before it is shippable,
 * and shipping it is the owner's call, not this tool's.
 *
 * ZERO RNG DISCIPLINE: every draw is `rngFromSeed` on a purpose-scoped key private to this bench
 * (`skillgap:*`). Nothing here touches MAIN, and the tool never constructs a World.
 */
import { pMatchBo3 } from '../src/engine/match/closedForm'
import { basePServe } from '../src/engine/match/point'
import { fastMatchProbability, simulateMatch } from '../src/engine/match/engine'
import type { MatchPlayer, MatchOptions } from '../src/engine/match/types'
import { fieldProsFor, mergedWtaRanking, FIELD, type FieldPro } from '../src/engine/season/fieldPros'
import { rivalMatchPlayer } from '../src/engine/season/rival'

const argv = process.argv.slice(2)
const num = (flag: string, dflt: number): number => {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] !== undefined ? Number(argv[i + 1]) : dflt
}
const WORLDS = num('--worlds', 40)
const SIMS = num('--sims', 25) // per world per pair
const GAIN = num('--gain', 0) // proposal arm: multiplier on the skill term (0 = arm off)
const FLOOR = num('--floor', 0) // proposal arm: minimum upset probability

const OPTS: MatchOptions = { surface: 'hard', tour: 'wta', seed: '' }
const pct = (x: number): string => (100 * x).toFixed(1).padStart(5)

// -------------------------------------------------------------------------------------------------
// A. DOES A POINT EDGE COMPOUND? – our closed form against the literature's own published values.
// -------------------------------------------------------------------------------------------------
function sectionA(): void {
  console.log('\n=== A. POINT EDGE -> MATCH EDGE (the compounding check) ===')
  console.log('   docs/research/03-match-engine-math.md quotes these as the iid Markov truth.')
  console.log('   pA     pB    ours    published')
  const cases: [number, number, string][] = [
    [0.63, 0.62, '55%'],
    [0.65, 0.62, '~65%'],
    [0.67, 0.62, '73%'],
    [0.7, 0.6, '89%'],
    [0.6, 0.6, '50%'],
  ]
  for (const [pA, pB, lit] of cases) {
    console.log(`  ${pA.toFixed(3)}  ${pB.toFixed(3)}  ${pct(pMatchBo3(pA, pB))}%   ${lit}`)
  }
  // The amplification ratio: how many match-probability points does one point of p buy?
  console.log('\n   amplification, per 0.01 of p held by A alone (B fixed at the WTA average 0.57):')
  for (const d of [0.005, 0.01, 0.02, 0.03, 0.05, 0.08]) {
    console.log(`     +${d.toFixed(3)} -> ${pct(pMatchBo3(0.57 + d, 0.57))}%`)
  }
  console.log('   ...and when BOTH sides move (the real shape of a skill gap: she gains, he loses):')
  for (const d of [0.005, 0.01, 0.02, 0.03, 0.05, 0.08]) {
    console.log(`     +/-${d.toFixed(3)} -> ${pct(pMatchBo3(0.57 + d, 0.57 - d))}%`)
  }
}

// -------------------------------------------------------------------------------------------------
// B. THE SKILL AXIS – what one core point is worth, and where (if anywhere) it stops being worth it.
// -------------------------------------------------------------------------------------------------
function flat(id: string, core: number, age = 22): MatchPlayer {
  return { id, name: id, serve: core, ret: core, composure: core, stamina: core, groundstrokes: core, age }
}

function simWinRate(a: MatchPlayer, b: MatchPlayer, key: string, n: number): number {
  let wins = 0
  for (let i = 0; i < n; i++) {
    const res = simulateMatch(a, b, { ...OPTS, seed: `skillgap:${key}:${i}` })
    if (res.winner === 0) wins++
  }
  return wins / n
}

function sectionB(): void {
  console.log('\n=== B. THE CORE-SKILL AXIS (two flat builds, hard court, full condition) ===')
  console.log('   A core   B core   dCore    pA     pB    closed   simulated   base-clamped?')
  const B = 50
  for (const A of [50, 52, 55, 57, 60, 62, 65, 70, 75, 80, 90, 100]) {
    const pa = flat('A', A)
    const pb = flat('B', B)
    const pA = basePServe(pa, pb, OPTS)
    const pB = basePServe(pb, pa, OPTS)
    const closed = fastMatchProbability(pa, pb, OPTS)
    const sim = simWinRate(pa, pb, `core:${A}:${B}`, 400)
    const clamped = pA === 0.82 || pA === 0.42 || pB === 0.82 || pB === 0.42 ? 'YES' : 'no'
    console.log(
      `    ${String(A).padStart(4)}     ${B}     ${String(A - B).padStart(4)}   ${pA.toFixed(3)}  ${pB.toFixed(3)}  ${pct(closed)}%   ${pct(sim)}%      ${clamped}`,
    )
  }
  console.log('\n   THE PLAYER\'S OWN THROTTLE – what the levers she can actually pull are worth:')
  const base = fastMatchProbability(flat('A', 50), flat('B', 50), OPTS)
  for (const [d, label] of [
    [0.06, 'four years of the dear college squad (round 21)'],
    [0.12, 'the whole coached / un-coached gap (P5)'],
    [1, 'one core point'],
    [2.4, 'one year of junior development (SKILL_POINTS_PER_YEAR)'],
    [6.7, "Ines's measured edge over her rank band"],
  ] as [number, string][]) {
    const p = fastMatchProbability(flat('A', 50 + d), flat('B', 50), OPTS)
    console.log(`     +${String(d).padStart(4)} core -> ${pct(p)}%  (+${((p - base) * 100).toFixed(2)} pts)   ${label}`)
  }
}

// -------------------------------------------------------------------------------------------------
// C. THE RANK AXIS – the game's own population, at the gaps the owner named.
// -------------------------------------------------------------------------------------------------
interface Cell {
  closed: number[]
  sim: number[]
  coreA: number[]
  coreB: number[]
  baseClamps: number
  finalClamps: number
  points: number
  /** the built pair per world, kept so the proposal arm re-prices the SAME matchups */
  built: [MatchPlayer, MatchPlayer][]
}

const coreOf = (p: FieldPro): number => (p.serve + p.ret + p.composure + p.stamina) / 4

/** The PROPOSAL arm's win probability: the shipped closed form with the skill term re-geared by
 *  `GAIN` and an explicit upset floor. Implemented HERE and not in src/ on purpose – nothing ships
 *  from this bench. The re-gearing is applied to the p-gap the shipped model produced, which is
 *  exactly what raising SKILL_K/RALLY_K by the same factor would do to two flat builds. */
function proposalProbability(a: MatchPlayer, b: MatchPlayer): number {
  const pA = basePServe(a, b, OPTS)
  const pB = basePServe(b, a, OPTS)
  const mid = (pA + pB) / 2
  const gA = Math.min(0.82, Math.max(0.42, mid + (pA - mid) * GAIN))
  const gB = Math.min(0.82, Math.max(0.42, mid + (pB - mid) * GAIN))
  const p = pMatchBo3(gA, gB)
  return Math.min(1 - FLOOR, Math.max(FLOOR, p))
}

function sectionC(): void {
  const pairs: [number, number][] = [
    [1, 10],
    [1, 50],
    [1, 100],
    [1, 300],
    [10, 50],
    [10, 100],
    [50, 100],
    [50, 150],
    [50, 200],
    [50, 300],
    [50, 500],
    [100, 200],
    [100, 300],
    [200, 300],
    [200, 500],
    [300, 600],
    [500, 1000],
  ]
  const cells = new Map<string, Cell>()
  for (const [r1, r2] of pairs) {
    cells.set(`${r1}:${r2}`, { closed: [], sim: [], coreA: [], coreB: [], baseClamps: 0, finalClamps: 0, points: 0, built: [] })
  }

  for (let w = 0; w < WORLDS; w++) {
    const seed = `skillgap-world-${w}`
    const pros = fieldProsFor(seed, 0)
    const table = mergedWtaRanking([], pros)
    const byId = new Map(pros.map((p) => [p.id, p]))
    const at = (rank: number): FieldPro => byId.get(table[rank - 1].playerId)!

    for (const [r1, r2] of pairs) {
      const cell = cells.get(`${r1}:${r2}`)!
      const proA = at(r1)
      const proB = at(r2)
      const a = rivalMatchPlayer(proA, 'hard')
      const b = rivalMatchPlayer(proB, 'hard')
      cell.built.push([a, b])
      cell.coreA.push(coreOf(proA))
      cell.coreB.push(coreOf(proB))

      const pA = basePServe(a, b, OPTS)
      const pB = basePServe(b, a, OPTS)
      if (pA === 0.82 || pA === 0.42 || pB === 0.82 || pB === 0.42) cell.baseClamps++
      cell.closed.push(fastMatchProbability(a, b, OPTS))

      let wins = 0
      for (let i = 0; i < SIMS; i++) {
        const res = simulateMatch(a, b, { ...OPTS, seed: `skillgap:${w}:${r1}:${r2}:${i}` })
        if (res.winner === 0) wins++
        for (const entry of res.log) {
          cell.points++
          if (entry.pServe === 0.9 || entry.pServe === 0.3) cell.finalClamps++
        }
      }
      cell.sim.push(wins / SIMS)
    }
  }

  const mean = (xs: number[]): number => xs.reduce((s, x) => s + x, 0) / xs.length
  console.log(`\n=== C. THE RANK AXIS – OUR UPSET RATE (${WORLDS} worlds x ${SIMS} sims per pair) ===`)
  console.log('   share of matches the LOWER-ranked player wins')
  console.log('   favourite  underdog  coreA  coreB  dCore   UPSET(closed)  UPSET(sim)   base-clamp  final-clamp')
  for (const [r1, r2] of pairs) {
    const c = cells.get(`${r1}:${r2}`)!
    const cA = mean(c.coreA)
    const cB = mean(c.coreB)
    console.log(
      `      #${String(r1).padEnd(5)}    #${String(r2).padEnd(5)}  ${cA.toFixed(1).padStart(5)}  ${cB.toFixed(1).padStart(5)}  ${(cA - cB).toFixed(1).padStart(5)}   ${pct(1 - mean(c.closed))}%        ${pct(1 - mean(c.sim))}%       ${String(c.baseClamps).padStart(4)}/${WORLDS}    ${String(c.finalClamps).padStart(6)}/${c.points}`,
    )
  }

  if (GAIN > 0) {
    console.log(`\n   --- PROPOSAL ARM: skill gain x${GAIN}, upset floor ${FLOOR} ---`)
    console.log('   favourite  underdog   UPSET(shipped)  UPSET(proposed)')
    for (const [r1, r2] of pairs) {
      const c = cells.get(`${r1}:${r2}`)!
      const props = c.built.map(([a, b]) => proposalProbability(a, b))
      console.log(`      #${String(r1).padEnd(5)}    #${String(r2).padEnd(5)}   ${pct(1 - mean(c.closed))}%          ${pct(1 - mean(props))}%`)
    }
  }
}

// -------------------------------------------------------------------------------------------------
// D. WHAT THE POPULATION ACTUALLY HOLDS – rank to core, so the exchange rate is readable.
// -------------------------------------------------------------------------------------------------
function sectionD(): void {
  console.log('\n=== D. RANK -> CORE, in the shipped population ===')
  console.log('   the storeys, top first:')
  let n = 0
  for (const t of FIELD.tiers) {
    console.log(`     #${String(n + 1).padStart(4)}-#${String(n + t.count).padStart(4)}  ${t.id.padEnd(11)} core ${t.core[0]}-${t.core[1]}`)
    n += t.count
  }
  const pros = fieldProsFor('skillgap-world-0', 0)
  const table = mergedWtaRanking([], pros)
  const byId = new Map(pros.map((p) => [p.id, p]))
  console.log('\n   measured (world 0), mean of four:')
  const ranks = [1, 10, 25, 50, 100, 150, 200, 300, 500, 800, 1200, 1600]
  const line = ranks.map((r) => {
    const p = byId.get(table[r - 1].playerId)!
    return `#${r}=${coreOf(p).toFixed(1)}`
  })
  console.log(`     ${line.join('  ')}`)
  console.log('\n   THE CLAMP REACHABILITY PROBE – can BASE_CLAMP be hit by anything at all?')
  const monster = { id: 'm', name: 'm', serve: 100, ret: 100, composure: 100, stamina: 100, groundstrokes: 100, age: 22 }
  const worm = { id: 'w', name: 'w', serve: 0, ret: 0, composure: 0, stamina: 0, groundstrokes: 0, age: 22 }
  console.log(`     core 100 vs core 0:  pA=${basePServe(monster, worm, OPTS).toFixed(3)}  pB=${basePServe(worm, monster, OPTS).toFixed(3)}  (clamp bounds 0.42 / 0.82)`)
  const widest = FIELD.tiers[0].core[1] - FIELD.tiers[FIELD.tiers.length - 1].core[0]
  const top = flat('top', FIELD.tiers[0].core[1])
  const bottom = flat('bot', FIELD.tiers[FIELD.tiers.length - 1].core[0])
  console.log(
    `     widest gap the population can produce = ${widest} core:  pA=${basePServe(top, bottom, OPTS).toFixed(3)}  pB=${basePServe(bottom, top, OPTS).toFixed(3)}  -> P(win)=${pct(fastMatchProbability(top, bottom, OPTS))}%`,
  )
}

sectionA()
sectionB()
sectionD()
sectionC()
