/**
 * r38-closed-form-residual – WHAT THE CLOSED FORM CANNOT SEE, IN PERCENTAGE POINTS.
 *
 * Round 38, item C4. `basePServe` reads serve, return, groundstrokes, an age-pace term and the
 * surface. It does NOT read `composure` and it does NOT read `stamina`. Her OWN matches run the
 * point loop, which reads both – nerve through the break-point penalty in `modifiedPServe`, fatigue
 * through `fatigueTerm`, and exhaustion again through `retireHazard`. Every AI-vs-AI match resolves
 * through the closed form, and so does the percentage on the calendar card.
 *
 * So there are two prices for the same defect, and this tool measures the one that can be measured:
 *
 *   THE CARD LIES BY THE SIZE OF THE RESIDUAL. `fastMatchProbability` says one thing; the loop she
 *   actually plays says another.
 *
 *   THE FIELD DOES NOT AGE THE WAY SHE DOES. Round 38 gave `ECONOMY.development.ageWeight` its
 *   steepest decay on STAMINA (1.45 against the serve's 0.55), so an ageing player pays for lost
 *   stamina in her own matches while the field pays for it nowhere.
 *
 * ⚠ MEASUREMENT FIRST, AND THE TABLE IS WHAT THE FIT IS FITTED TO. Nothing here is a proposal: the
 * grid below is the ground truth, produced by the REAL point loop at the real defaults (momentum
 * ON, retirements live), and both the fit and the "after" are graded against it.
 *
 * ⚠ THE LOOP IS THE TRUTH AND THE CLOSED FORM IS THE APPROXIMATION. That ordering is the whole
 * design of the fix: the correction is applied where the CLOSED FORM is read and NOT to
 * `basePServe`, whose value the loop consumes per point. A term added inside `basePServe` moves the
 * loop and the closed form together by the same amount and closes nothing – §4 measures exactly
 * that, so the placement is a reading rather than a preference.
 *
 * THREE SECTIONS:
 *
 *   §1 THE GRID – over (stamina gap x composure gap) at three skill levels and all three surfaces,
 *      N simulated matches per cell against `pMatchBo3(basePServe(...))`. Residual in pp.
 *   §2 THE FIT – the two constants of a DIFFERENCE term, searched to minimise RMS residual over
 *      every cell. Printed with the residual they achieve, before and after.
 *   §3 OFF THE DIAGONAL – the same fit graded on cells that also carry a SKILL gap, which is where
 *      a real card lives. Held out of the fit, so it is a test rather than a restatement.
 *   §4 THE PLACEMENT CONTROL – one cell replayed with the candidate term pushed INSIDE `basePServe`
 *      (so the loop sees it too). If the residual does not move, the term does not belong there.
 *
 * ⚠ THE "AFTER" COLUMN NEEDS NO SECOND MONTE-CARLO RUN, and that is a property of the fix rather
 * than a shortcut: the correction never touches `basePServe`, so the loop is byte-identical and the
 * measured win rates are the same numbers on both sides of the change. The tool reads BOTH the raw
 * closed form (`pMatchBo3(basePServe...)`, always available) and whatever `fastMatchProbability`
 * currently ships, so one run before the fix and one after print directly comparable tables.
 *
 * ZERO RNG DISCIPLINE: every match is seeded off a key private to this bench (`c4res:*`). Nothing
 * touches MAIN and no World is constructed.
 *
 * Run:
 *   npx vite-node tools/r38-closed-form-residual.ts                 # the grid, at the shipped model
 *   npx vite-node tools/r38-closed-form-residual.ts -- --fit        # ...and search the two constants
 *   npx vite-node tools/r38-closed-form-residual.ts -- --n 2000     # a fast pass while iterating
 *   npx vite-node tools/r38-closed-form-residual.ts -- --out grid.json
 */
import { writeFileSync } from 'node:fs'
import { simulateMatch, fastMatchProbability } from '../src/engine/match/engine'
import { basePServe } from '../src/engine/match/point'
import { pMatchBo3 } from '../src/engine/match/closedForm'
import type { MatchPlayer, MatchOptions, Surface } from '../src/engine/match/types'

// --- arguments -----------------------------------------------------------------------------------

const argv = process.argv.slice(2)
function flag(name: string): boolean {
  return argv.includes(`--${name}`)
}
function opt(name: string, fallback: number): number {
  const i = argv.indexOf(`--${name}`)
  if (i < 0 || i + 1 >= argv.length) return fallback
  const v = Number(argv[i + 1])
  return Number.isFinite(v) ? v : fallback
}
function optStr(name: string, fallback: string): string {
  const i = argv.indexOf(`--${name}`)
  return i < 0 || i + 1 >= argv.length ? fallback : (argv[i + 1] as string)
}

const N = Math.max(200, Math.round(opt('n', 6000)))
const DO_FIT = flag('fit')
const OUT = optStr('out', '')

// --- the grid ------------------------------------------------------------------------------------

/** The tour the game actually plays. `JUNIOR_TOUR` is 'wta' and every professional rung is 'wta'
 *  too, so the residual is measured where the game lives rather than averaged over a tour the
 *  cohort never enters. */
const TOUR = 'wta' as const
const SURFACES: Surface[] = ['hard', 'clay', 'grass']
/** Three skill levels, because the loop's two blind terms are NOT level-free: the break-point
 *  penalty fires at the break-point RATE, which rises as holds get harder, and fatigue integrates
 *  over the match LENGTH, which is longest between evenly matched players. */
const CORES = [40, 55, 70]
const STAMINA_GAPS = [-60, -40, -20, 0, 20, 40, 60]
const COMPOSURE_GAPS = [-50, -25, 0, 25, 50]
/** §3's held-out block: the same two axes, coarser, carried on top of a real SKILL gap. */
const SKILL_GAPS = [-16, -8, 8, 16]

const clamp100 = (x: number): number => (x < 0 ? 0 : x > 100 ? 100 : x)

// ⚠ MIRRORED FROM point.ts, WHICH DOES NOT EXPORT THEM – and mirrored on purpose rather than
// exported for a probe. They exist here only to state the ANALYTIC PREDICTION in §1b; every number
// this tool GRADES anything against comes from the engine's own functions, so a mirror that rotted
// would move the prediction and never the measurement.
const FATIGUE_START = 120
const FATIGUE_RATE = 0.0003
const BIG_POINT_MAX_PENALTY = 0.03

/** One side of a cell. `age` and `condition` are deliberately left absent: the pace term is a
 *  difference (exactly 0 between two players built without an age) and an absent condition is a
 *  retirement multiplier of exactly 1, so neither can smuggle a second effect into a grid that is
 *  about composure and stamina alone. */
function build(id: string, core: number, stamina: number, composure: number): MatchPlayer {
  return {
    id,
    name: id,
    serve: clamp100(core),
    ret: clamp100(core),
    groundstrokes: clamp100(core),
    stamina: clamp100(stamina),
    composure: clamp100(composure),
  }
}

interface Cell {
  surface: Surface
  core: number
  skillGap: number
  staminaGap: number
  composureGap: number
  a: MatchPlayer
  b: MatchPlayer
  /** the measured share of `N` matches side A won, through the real point loop */
  mc: number
  /** `pMatchBo3(basePServe(a,b), basePServe(b,a))` – the closed form WITHOUT any correction */
  raw: number
  /** whatever `fastMatchProbability` ships today – equal to `raw` before the fix */
  shipped: number
  /** ⭐ THE RETIREMENT CHANNEL, MEASURED RATHER THAN ARGUED. `retireHazard` reads `stamina` too, so
   *  part of every stamina residual is not "she plays worse when tired" but "she stops". This is the
   *  share of matches side B stopped in MINUS the share side A stopped in – a direct upper bound on
   *  how much of the cell's residual the hazard can be responsible for. */
  retirementSwing: number
  /** mean points played, and the share of served points that were break points – the two numbers the
   *  ANALYTIC prediction of the two constants is built out of (§1b). */
  meanPoints: number
  breakPointRate: number
  /** E over PLAYED POINTS of `max(0, n - FATIGUE_START)` – the exact quantity the fatigue leg of the
   *  analytic prediction integrates. Measured rather than derived from the mean match length,
   *  because the offset is quadratic in it and a mean of a square is not the square of a mean. */
  meanFatigueOffset: number
}

type CellSpec = Omit<
  Cell,
  'mc' | 'raw' | 'shipped' | 'retirementSwing' | 'meanPoints' | 'breakPointRate' | 'meanFatigueOffset'
>

function makeCell(surface: Surface, core: number, skillGap: number, sGap: number, cGap: number): CellSpec {
  // The gap is split across the pair so the pair's MEAN stays at `core`: a cell is a difference,
  // never a level, which is the same shape the correction itself has to have.
  const a = build('a', core + skillGap / 2, core + sGap / 2, core + cGap / 2)
  const b = build('b', core - skillGap / 2, core - sGap / 2, core - cGap / 2)
  return { surface, core, skillGap, staminaGap: sGap, composureGap: cGap, a, b }
}

function optsFor(surface: Surface, seed: string): MatchOptions {
  return { surface, tour: TOUR, seed }
}

/** The loop's own answer: the share of `n` matches side A wins, momentum ON and retirements live,
 *  i.e. exactly the match she plays. */
function measure(cell: CellSpec, n: number): Cell {
  const tag = `c4res:${cell.surface}:${cell.core}:${cell.skillGap}:${cell.staminaGap}:${cell.composureGap}`
  let wins = 0
  let retA = 0
  let retB = 0
  let points = 0
  let bpFaced = 0
  let fatigueIntegral = 0
  for (let i = 0; i < n; i++) {
    const r = simulateMatch(cell.a, cell.b, optsFor(cell.surface, `${tag}:${i}`))
    if (r.winner === 0) wins++
    if (r.retired) {
      if (r.retired.side === 0) retA++
      else retB++
    }
    points += r.totalPoints
    bpFaced += r.stats[0].breakPointsFaced + r.stats[1].breakPointsFaced
    const past = r.totalPoints - FATIGUE_START
    if (past > 0) fatigueIntegral += (past * (past + 1)) / 2
  }
  const o = optsFor(cell.surface, '')
  return {
    ...cell,
    mc: wins / n,
    raw: pMatchBo3(basePServe(cell.a, cell.b, o), basePServe(cell.b, cell.a, o)),
    shipped: fastMatchProbability(cell.a, cell.b, o),
    retirementSwing: (retB - retA) / n,
    meanPoints: points / n,
    breakPointRate: bpFaced / points,
    meanFatigueOffset: fatigueIntegral / points,
  }
}

// --- the candidate correction --------------------------------------------------------------------

/** The corrected closed form for one cell, given a candidate pair of constants. The shape is the
 *  one `groundstrokes` already uses: a DIFFERENCE, so it is exactly 0 for a pair level in both and
 *  every symmetric fixture is untouched by construction. */
function corrected(cell: Cell, kStamina: number, kComposure: number): number {
  const o = optsFor(cell.surface, '')
  const edge = (cell.a.stamina - cell.b.stamina) * kStamina + (cell.a.composure - cell.b.composure) * kComposure
  return pMatchBo3(basePServe(cell.a, cell.b, o) + edge, basePServe(cell.b, cell.a, o) - edge)
}

interface Score {
  rms: number
  max: number
  maxAt: string
}

function score(cells: Cell[], kStamina: number, kComposure: number): Score {
  let sum = 0
  let max = 0
  let maxAt = ''
  for (const c of cells) {
    const r = c.mc - corrected(c, kStamina, kComposure)
    sum += r * r
    if (Math.abs(r) > Math.abs(max)) {
      max = r
      maxAt = label(c)
    }
  }
  return { rms: Math.sqrt(sum / cells.length), max, maxAt }
}

function label(c: Cell): string {
  const skill = c.skillGap === 0 ? '' : ` skill${c.skillGap > 0 ? '+' : ''}${c.skillGap}`
  return `${c.surface} core${c.core}${skill} dStam${c.staminaGap >= 0 ? '+' : ''}${c.staminaGap} dComp${c.composureGap >= 0 ? '+' : ''}${c.composureGap}`
}

// --- printing ------------------------------------------------------------------------------------

const pp = (x: number): string => (x * 100).toFixed(2)
const padL = (s: string | number, n: number): string => String(s).padStart(n)
const padR = (s: string | number, n: number): string => String(s).padEnd(n)

/** One (stamina gap x composure gap) table per surface x core, in percentage points of residual. */
function printGrid(cells: Cell[], title: string, valueOf: (c: Cell) => number): void {
  console.log(`\n${title}`)
  for (const surface of SURFACES) {
    for (const core of CORES) {
      const block = cells.filter((c) => c.surface === surface && c.core === core && c.skillGap === 0)
      if (block.length === 0) continue
      console.log(`\n  ${surface}, core ${core}  (rows = stamina gap A-B, cols = composure gap A-B; pp)`)
      console.log(`    ${padR('dStam', 7)}${COMPOSURE_GAPS.map((g) => padL(`${g >= 0 ? '+' : ''}${g}`, 9)).join('')}`)
      for (const sg of STAMINA_GAPS) {
        const row = COMPOSURE_GAPS.map((cg) => {
          const cell = block.find((c) => c.staminaGap === sg && c.composureGap === cg)
          return padL(cell ? pp(valueOf(cell)) : '-', 9)
        })
        console.log(`    ${padR(`${sg >= 0 ? '+' : ''}${sg}`, 7)}${row.join('')}`)
      }
    }
  }
}

// --- run -----------------------------------------------------------------------------------------

console.log('r38-closed-form-residual – the closed form against the point loop it claims to predict')
console.log(`  tour ${TOUR} · ${N} simulated matches per cell · momentum ON · retirements live`)
console.log(`  standard error per cell ~${pp(0.5 / Math.sqrt(N))} pp`)

const fitSpecs: CellSpec[] = []
for (const surface of SURFACES) {
  for (const core of CORES) {
    for (const sg of STAMINA_GAPS) {
      for (const cg of COMPOSURE_GAPS) fitSpecs.push(makeCell(surface, core, 0, sg, cg))
    }
  }
}
const holdoutSpecs: CellSpec[] = []
for (const surface of SURFACES) {
  for (const skill of SKILL_GAPS) {
    for (const sg of [-40, 0, 40]) {
      for (const cg of [-50, 0, 50]) holdoutSpecs.push(makeCell(surface, 55, skill, sg, cg))
    }
  }
}

const started = Date.now()
console.log(`\n  playing ${((fitSpecs.length + holdoutSpecs.length) * N).toLocaleString('en-US')} matches …`)
const fitCells = fitSpecs.map((s) => measure(s, N))
const holdoutCells = holdoutSpecs.map((s) => measure(s, N))
console.log(`  done in ${((Date.now() - started) / 1000).toFixed(0)}s`)

// =================================================================================================
// §1 THE GRID
// =================================================================================================
console.log('\n\n=================================================================================')
console.log('§1  THE RESIDUAL – what the loop produces MINUS what the closed form promises, in pp')
console.log('=================================================================================')
console.log('\n  A positive cell = side A wins MORE often than the card says she will.')
printGrid(fitCells, '  [BEFORE] mc - pMatchBo3(basePServe...)  – the uncorrected closed form', (c) => c.mc - c.raw)

const before = score(fitCells, 0, 0)
console.log(`\n  BEFORE, over all ${fitCells.length} cells:  rms ${pp(before.rms)} pp   worst ${pp(before.max)} pp  (${before.maxAt})`)

// The two headline pairs the round-38 ledger quotes, read straight off the grid.
for (const [sg, cg, what] of [
  [60, 0, 'stamina 30 against 90, composure level'],
  [0, 50, 'composure 30 against 80, stamina level'],
] as const) {
  const hits = fitCells.filter((c) => c.staminaGap === sg && c.composureGap === cg)
  const worst = hits.reduce((m, c) => (Math.abs(c.mc - c.raw) > Math.abs(m.mc - m.raw) ? c : m), hits[0]!)
  console.log(`    ${padR(what, 42)} worst cell ${pp(worst.mc - worst.raw)} pp  (${label(worst)})`)
}

// =================================================================================================
// §1b THE DECOMPOSITION – how much of the stamina residual is the RETIREMENT HAZARD
// =================================================================================================
console.log('\n\n=================================================================================')
console.log('§1b  WHERE THE STAMINA RESIDUAL COMES FROM – points lost, or a player who stopped')
console.log('=================================================================================')
console.log('\n  `retireHazard` reads `stamina` as well as `modifiedPServe` does, so a stamina cell has')
console.log('  TWO channels and only one of them is "she plays worse when tired". The swing column is')
console.log('  the share of matches B stopped in minus the share A stopped in – an upper bound on the')
console.log('  contribution of the hazard, since a retirement does not always flip a match she would have lost.')
console.log('\n    dStam   residual(pp)   retirement swing(pp)   share')
for (const sg of STAMINA_GAPS) {
  const hits = fitCells.filter((c) => c.staminaGap === sg && c.composureGap === 0)
  const res = hits.reduce((s, c) => s + (c.mc - c.raw), 0) / hits.length
  const swing = hits.reduce((s, c) => s + c.retirementSwing, 0) / hits.length
  const share = Math.abs(res) < 1e-9 ? '-' : `${((100 * swing) / (100 * res)).toFixed(2)}x`
  console.log(`    ${padR(`${sg >= 0 ? '+' : ''}${sg}`, 8)}${padL(pp(res), 9)}${padL(pp(swing), 22)}${padL(share, 9)}`)
}

// -------------------------------------------------------------------------------------------------
// THE ANALYTIC PREDICTION – what the two constants SHOULD be if the only channel were the per-point
// arithmetic in `modifiedPServe`. Invariant 5 wants a prediction beside the measurement, and this is
// the honest one: it is derivable from the loop's own constants and it does NOT include the
// retirement hazard or the fact that both terms act hardest in the matches that are still undecided.
// A measured constant ABOVE its prediction is therefore the finding, not an error.
// -------------------------------------------------------------------------------------------------
{
  const level = fitCells.filter((c) => c.staminaGap === 0 && c.composureGap === 0)
  const meanPoints = level.reduce((s, c) => s + c.meanPoints, 0) / level.length
  const bpRate = level.reduce((s, c) => s + c.breakPointRate, 0) / level.length
  const fatOffset = level.reduce((s, c) => s + c.meanFatigueOffset, 0) / level.length
  // Composure: the server loses `(1 - c/100) * BIG_POINT_MAX_PENALTY` on a break point, so the PAIR's
  // edge moves by `bpRate * PENALTY * (cA - cB) / 100`. A difference term moves it by `2 * K * (cA - cB)`.
  const predComp = (bpRate * BIG_POINT_MAX_PENALTY) / 200
  // Stamina: the server's p moves by `(n - 120) * FATIGUE_RATE * (sA - sB) / 100` on every point past
  // the gate, so the pair's edge moves by twice the mean of that. Same halving.
  const predStam = (fatOffset * FATIGUE_RATE) / 100
  console.log('\n  THE PREDICTION, from the constants the loop itself uses, at the level cells:')
  console.log(`    mean points per match          ${meanPoints.toFixed(1)}`)
  console.log(`    break points / served point    ${(100 * bpRate).toFixed(2)}%`)
  console.log(`    mean max(0, n - ${FATIGUE_START}) per point ${fatOffset.toFixed(2)}`)
  console.log(`    => K_COMP predicted            ${predComp.toExponential(4)}`)
  console.log(`    => K_STAM predicted            ${predStam.toExponential(4)}   (per-point fatigue ONLY)`)
}

// =================================================================================================
// §2 THE FIT
// =================================================================================================
console.log('\n\n=================================================================================')
console.log('§2  THE SHIPPED MODEL – the same cells against `fastMatchProbability` as it stands')
console.log('=================================================================================')
printGrid(fitCells, '  [SHIPPED] mc - fastMatchProbability(...)', (c) => c.mc - c.shipped)
let shipSum = 0
let shipMax = 0
let shipMaxAt = ''
for (const c of fitCells) {
  const r = c.mc - c.shipped
  shipSum += r * r
  if (Math.abs(r) > Math.abs(shipMax)) {
    shipMax = r
    shipMaxAt = label(c)
  }
}
console.log(
  `\n  SHIPPED, over all ${fitCells.length} cells:  rms ${pp(Math.sqrt(shipSum / fitCells.length))} pp   worst ${pp(shipMax)} pp  (${shipMaxAt})`,
)
let holdSum = 0
let holdMax = 0
let holdMaxAt = ''
for (const c of holdoutCells) {
  const r = c.mc - c.shipped
  holdSum += r * r
  if (Math.abs(r) > Math.abs(holdMax)) {
    holdMax = r
    holdMaxAt = label(c)
  }
}
console.log(
  `  SHIPPED, over the ${holdoutCells.length} held-out SKILL-GAP cells:  rms ${pp(Math.sqrt(holdSum / holdoutCells.length))} pp   worst ${pp(holdMax)} pp  (${holdMaxAt})`,
)

if (DO_FIT) {
  console.log('\n\n=================================================================================')
  console.log('§2b  THE FREE FIT – two constants, searched against the grid above')
  console.log('=================================================================================')
  console.log('\n  shape:  basePServe(server, receiver) + (server.stamina - receiver.stamina) * K_STAM')
  console.log('                                        + (server.composure - receiver.composure) * K_COMP')
  console.log('  ⚠ a DIFFERENCE on both legs, so a pair level in both is unchanged to the last bit.')

  // Grid search, then two refinements around the winner. Deterministic and explicable – there is no
  // optimiser here whose behaviour a later reader would have to trust.
  let bestS = 0
  let bestC = 0
  let bestRms = score(fitCells, 0, 0).rms
  // ⚠ THE RANGE IS DELIBERATELY WIDER THAN THE ANSWER. A search whose winner sits on the edge of
  // its own window is not a fit, it is a clamp – the first cut of this ran to 6e-5 and landed at
  // 6.33e-5 by creeping out of the box one refinement at a time.
  let loS = 0
  let hiS = 2e-4
  let loC = 0
  let hiC = 2e-4
  for (let pass = 0; pass < 4; pass++) {
    const stepS = (hiS - loS) / 40
    const stepC = (hiC - loC) / 40
    for (let i = 0; i <= 40; i++) {
      for (let j = 0; j <= 40; j++) {
        const ks = loS + i * stepS
        const kc = loC + j * stepC
        const r = score(fitCells, ks, kc).rms
        if (r < bestRms) {
          bestRms = r
          bestS = ks
          bestC = kc
        }
      }
    }
    loS = Math.max(0, bestS - stepS * 2)
    hiS = bestS + stepS * 2
    loC = Math.max(0, bestC - stepC * 2)
    hiC = bestC + stepC * 2
    console.log(
      `    pass ${pass + 1}:  K_STAM ${bestS.toExponential(4)}   K_COMP ${bestC.toExponential(4)}   rms ${pp(bestRms)} pp`,
    )
  }

  const after = score(fitCells, bestS, bestC)
  const hold = score(holdoutCells, bestS, bestC)
  console.log(`\n  FITTED   K_STAM = ${bestS.toExponential(5)}   K_COMP = ${bestC.toExponential(5)}`)
  console.log(`    on the fit grid       rms ${pp(before.rms)} -> ${pp(after.rms)} pp    worst ${pp(before.max)} -> ${pp(after.max)} pp  (${after.maxAt})`)
  console.log(
    `    on the held-out cells rms ${pp(score(holdoutCells, 0, 0).rms)} -> ${pp(hold.rms)} pp    worst ${pp(score(holdoutCells, 0, 0).max)} -> ${pp(hold.max)} pp  (${hold.maxAt})`,
  )

  // Rounded candidates, so the constant that ships is a number a reader can hold in their head.
  console.log('\n  ROUNDED CANDIDATES (the constant that ships should be one of these):')
  for (const [ks, kc] of [
    [Number(bestS.toPrecision(2)), Number(bestC.toPrecision(2))],
    [Number(bestS.toPrecision(1)), Number(bestC.toPrecision(1))],
  ] as const) {
    const s = score(fitCells, ks, kc)
    const h = score(holdoutCells, ks, kc)
    console.log(
      `    K_STAM ${ks.toExponential(4)}  K_COMP ${kc.toExponential(4)}   fit rms ${pp(s.rms)} worst ${pp(s.max)}   holdout rms ${pp(h.rms)} worst ${pp(h.max)}`,
    )
  }

  console.log('\n  THE TWO HEADLINE PAIRS, before and after the free fit:')
  for (const [sg, cg, what] of [
    [60, 0, 'stamina 30 against 90, composure level'],
    [0, 50, 'composure 30 against 80, stamina level'],
  ] as const) {
    const hits = fitCells.filter((c) => c.staminaGap === sg && c.composureGap === cg)
    const worstBefore = hits.reduce((m, c) => (Math.abs(c.mc - c.raw) > Math.abs(m.mc - m.raw) ? c : m), hits[0]!)
    const worstAfter = hits.reduce(
      (m, c) => (Math.abs(c.mc - corrected(c, bestS, bestC)) > Math.abs(m.mc - corrected(m, bestS, bestC)) ? c : m),
      hits[0]!,
    )
    console.log(
      `    ${padR(what, 42)} worst ${pp(worstBefore.mc - worstBefore.raw)} -> ${pp(worstAfter.mc - corrected(worstAfter, bestS, bestC))} pp`,
    )
  }

  printGrid(fitCells, '  [AFTER, at the free fit] mc - corrected closed form', (c) => c.mc - corrected(c, bestS, bestC))

  // ===============================================================================================
  // §4 THE PLACEMENT CONTROL
  // ===============================================================================================
  console.log('\n\n=================================================================================')
  console.log('§4  THE PLACEMENT CONTROL – what happens if the term goes INSIDE `basePServe`')
  console.log('=================================================================================')
  console.log('\n  The loop reads `basePServe` per point. A term added there moves the loop AND the')
  console.log('  closed form by the same amount, so the residual between them cannot close. Measured')
  console.log('  by handing the loop a pair whose ATTRIBUTES already carry the shift the term would')
  console.log('  have made – identical arithmetic, no engine edit – on the worst cell of §1.')
  const worst = fitCells.reduce((m, c) => (Math.abs(c.mc - c.raw) > Math.abs(m.mc - m.raw) ? c : m), fitCells[0]!)
  // The term would add `edge` to A's base p and subtract it from B's. `SKILL_K` is the p per serve
  // point, so the same shift is reachable through the serve/return attributes the loop already
  // reads – which is what makes this a control rather than a second implementation.
  const SKILL_K = 0.0016
  const edge = (worst.a.stamina - worst.b.stamina) * bestS + (worst.a.composure - worst.b.composure) * bestC
  const shiftPoints = edge / (2 * SKILL_K) // split across serve and return, both of which move p
  const aShift: MatchPlayer = { ...worst.a, serve: clamp100(worst.a.serve + shiftPoints), ret: clamp100(worst.a.ret + shiftPoints) }
  const bShift: MatchPlayer = { ...worst.b, serve: clamp100(worst.b.serve - shiftPoints), ret: clamp100(worst.b.ret - shiftPoints) }
  let winsShift = 0
  const nControl = N
  // ⚠ THE SAME SEEDS THE CELL ITSELF WAS MEASURED ON, so the two loop readings are PAIRED: the only
  // difference between them is the shift, not the draw.
  const ctlTag = `c4res:${worst.surface}:${worst.core}:${worst.skillGap}:${worst.staminaGap}:${worst.composureGap}`
  for (let i = 0; i < nControl; i++) {
    if (simulateMatch(aShift, bShift, optsFor(worst.surface, `${ctlTag}:${i}`)).winner === 0) winsShift++
  }
  const o = optsFor(worst.surface, '')
  const mcShift = winsShift / nControl
  const closedShift = pMatchBo3(basePServe(aShift, bShift, o), basePServe(bShift, aShift, o))
  console.log(`\n  worst cell: ${label(worst)}`)
  console.log(`    term OUTSIDE basePServe (the fix):   loop ${pp(worst.mc)}%  closed ${pp(corrected(worst, bestS, bestC))}%  residual ${pp(worst.mc - corrected(worst, bestS, bestC))} pp`)
  console.log(`    term INSIDE  basePServe (control):   loop ${pp(mcShift)}%  closed ${pp(closedShift)}%  residual ${pp(mcShift - closedShift)} pp`)
  console.log(`    residual before any term:                                            ${pp(worst.mc - worst.raw)} pp`)
  console.log('\n  ⚠ READ THE THIRD LINE AGAINST THE SECOND. If the inside-placement residual is still')
  console.log('    about the size of the untouched one, the term inside `basePServe` bought nothing:')
  console.log('    both sides of the comparison moved together, which is what a per-point base does.')
}

if (OUT) {
  const rows = [...fitCells, ...holdoutCells].map((c) => ({
    surface: c.surface,
    core: c.core,
    skillGap: c.skillGap,
    staminaGap: c.staminaGap,
    composureGap: c.composureGap,
    n: N,
    mc: c.mc,
    raw: c.raw,
    shipped: c.shipped,
    retirementSwing: c.retirementSwing,
    meanPoints: c.meanPoints,
    breakPointRate: c.breakPointRate,
    meanFatigueOffset: c.meanFatigueOffset,
  }))
  writeFileSync(OUT, JSON.stringify({ tour: TOUR, n: N, rows }, null, 2))
  console.log(`\n  wrote ${rows.length} cells to ${OUT}`)
}
