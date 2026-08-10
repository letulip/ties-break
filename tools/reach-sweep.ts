/**
 * REACH-TARGET SWEEP – the measurement behind every re-basing of `REACH_TARGET_MONEY`.
 *
 * `tests/econ-reach.test.ts` is a tripwire that has now fired six times: each calendar re-spacing
 * moves careers across the reach proxy and the pinned counts go stale. The note in that file says,
 * at every flip, "re-basing it is a tuning decision with its own SWEEP" – and until now nobody
 * committed the sweep, so each pass rebuilt it from scratch. This is that sweep.
 *
 * WHAT IT MEASURES, and why one pass answers every candidate at once. `runCareer` records
 * `reachedWeek` = the first week `reachedTarget` holds, so a career "reaches" a threshold T ⇔ the
 * MAXIMUM the tracked quantity ever attains over the horizon is >= T. So a single replay per career
 * recording running maxima answers the whole grid of candidate thresholds, instead of one replay
 * per (threshold, career). 270 careers, not 270 x |candidates|.
 *
 * ⚠ THE TWO HORIZONS DO NOT READ THE SAME CONSTANT, which is the thing to know before reading the
 * table. `reachedTarget` keys on `targetAge`: 14→16 is the DOMESTIC arm (`kidPoints(world,
 * 'domestic') >= REACH_TARGET_MONEY`), 14→18 and 14→20 are the PRO arm ((ranked AND kidRank <=
 * REACH_PRO_RANK) OR `kidPoints(world, 'itf') >= REACH_PRO_POINTS`). Re-basing REACH_TARGET_MONEY
 * therefore cannot move a single 14→18 number – that horizon is governed by REACH_PRO_RANK and
 * REACH_PRO_POINTS – so both arms are swept here or the second horizon is being guessed at.
 *
 * The first 104 weeks of a 208-week replay are byte-identical to a 104-week replay (neither
 * `openCareer` nor `stepCareerWeek` reads the horizon), so each career is replayed ONCE to 208 and
 * both horizons are read off the same pass.
 *
 * ⚠ AND SINCE 10.08 IT ALSO ANSWERS "FOR TENNIS REASONS?", WHICH IS A SECOND PROPERTY A FIXTURE HAS
 * TO HAVE (docs/specs/compound-cost-2026-08.md §9). Both branches firing is necessary and is what the
 * tables below were built for; it is not sufficient. `middleHigh` split 18/30 when it was chosen and
 * still split when the compound-cost probe read it – but §5 of that spec showed ELEVEN of its fifteen
 * lost careers were the family going bankrupt and only four were the tennis, so a 14→18 PRO proxy was
 * being decided by the bank balance. `--float=<cents>` replays every career a second time with a
 * wallet that cannot empty, exactly as that probe's arm 6 did, and prints the split per preset. The
 * flag is OFF by default, so a bare run is byte-identical in behaviour and runtime to every earlier
 * one.
 *
 *   npx vite-node tools/reach-sweep.ts              # all 9 presets x 30 indices (~the full bench)
 *   npx vite-node tools/reach-sweep.ts --indices=5  # a quick shape check
 *   npx vite-node tools/reach-sweep.ts --float=100000000   # + the solvency-vs-tennis split ($1M)
 */
import { openCareer, stepCareerWeek, PRESETS, REACH_TARGET_MONEY, REACH_PRO_RANK, REACH_PRO_POINTS } from './econ-bench'
import { kidPoints } from '../src/engine/world'

const arg = (name: string, fallback: number): number => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? Number(hit.slice(name.length + 3)) : fallback
}

const INDICES = arg('indices', 30)
const H16 = 104
const H18 = 208
/** ⚠ A MEASURING INSTRUMENT AND NOT A PROPOSAL, copied in intent from `tools/compound-cost.ts`'s
 *  arm 6: cents added to the opening balance so the family can never run out. It answers ONE
 *  question about a candidate fixture – are the careers that miss the 14→18 proxy missing it because
 *  the tennis is not there, or because the money is not? Nothing about it is shippable.
 *
 *  ⚠ AND WHAT THE DELTA IS, EXACTLY, because it is an upper bound and not an attribution. A float
 *  removes affordability refusal, the debt spell AND the bankruptcy latch in one move, so
 *  `reached(float) − reached(as charged)` is the MOST careers the bank balance could be deciding. A
 *  cell with a large delta is disqualified; a cell with a small one is cleared, and that direction is
 *  the one a bound can carry. */
const FLOAT_CENTS = arg('float', 0)

/** Candidate DOMESTIC thresholds for the 14→16 arm. Every one is a level the domestic ladder itself
 *  names, so whichever wins can be defended as a milestone rather than a number that made the test
 *  interesting: 150 = National's entry floor (the incumbent), 200 = one National title, 250 = J30's
 *  floor and Regional's graduation ceiling (the international door), 320/400 = a National title plus
 *  a National final / two National titles, 520/600 = deeper books of the same. */
const DOMESTIC_CANDIDATES = [150, 200, 250, 270, 280, 290, 300, 320, 400, 520]
/** Candidate ITF point thresholds for the 14→18 arm (60 = a J60 title, the incumbent). */
const ITF_CANDIDATES = [60, 120, 200, 300, 420, 600]
/** Candidate rank cut-offs for the 14→18 arm's rank half (50 = the incumbent). */
const RANK_CANDIDATES = [50, 30, 20, 10]

interface CareerSummary {
  preset: string
  index: number
  /** highest DOMESTIC best-6 reached inside 104 weeks – decides the 14→16 arm for any threshold. */
  maxDomestic104: number
  maxDomestic208: number
  /** highest ITF best-N reached inside 208 weeks – the 14→18 arm's points half. */
  maxItf208: number
  /** best (lowest) kidRank reached in any week she held a counting ITF result – the rank half.
   *  Infinity ⇔ she never held one, so the rank arm can never fire for her at any cut-off. */
  bestRankedRank208: number
  /** first week fundsCents went below zero, or null – the solvency half of the fixture question. */
  bankruptWeek: number | null
  /** the v39 ending latch, or null. 'bankruptcy' here means the CAREER STOPPED, not merely went red. */
  endingType: string | null
}

function replay(presetIndex: number, index: number, floatCents = 0): CareerSummary {
  const preset = PRESETS[presetIndex]
  const { world, rng } = openCareer(preset, index)
  if (floatCents > 0) world.fundsCents += floatCents
  let maxDomestic104 = 0
  let maxDomestic208 = 0
  let maxItf208 = 0
  let bestRankedRank208 = Infinity
  let bankruptWeek: number | null = world.fundsCents < 0 ? 0 : null
  let endingType: string | null = null
  for (let i = 0; i < H18; i++) {
    stepCareerWeek(world, rng)
    const dom = kidPoints(world, 'domestic')
    const itf = kidPoints(world, 'itf')
    if (i < H16 && dom > maxDomestic104) maxDomestic104 = dom
    if (dom > maxDomestic208) maxDomestic208 = dom
    if (itf > maxItf208) maxItf208 = itf
    // `hasResults` in reachedTarget is exactly `points > 0` – mirror it, do not re-derive it.
    if (itf > 0 && world.kidRank < bestRankedRank208) bestRankedRank208 = world.kidRank
    if (bankruptWeek === null && world.fundsCents < 0) bankruptWeek = world.week
    if (endingType === null && world.ending) endingType = world.ending.type
  }
  return {
    preset: preset.label,
    index,
    maxDomestic104,
    maxDomestic208,
    maxItf208,
    bestRankedRank208,
    bankruptWeek,
    endingType,
  }
}

/** The 14→18 PRO predicate at the INCUMBENT constants, i.e. exactly the number
 *  `tests/econ-reach.test.ts` reads. Written once because three tables below ask for it.
 *
 *  It is the disjunction of two per-career maxima and that is not an approximation: `reachedTarget`
 *  holds in SOME week iff (∃ week: itf > 0 ∧ rank <= R) ∨ (∃ week: itf >= P), which is exactly
 *  `bestRankedRank208 <= R ∨ maxItf208 >= P`. */
const reachedPro = (r: CareerSummary): boolean =>
  r.bestRankedRank208 <= REACH_PRO_RANK || r.maxItf208 >= REACH_PRO_POINTS

const pad = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)

const rows: CareerSummary[][] = []
const t0 = Date.now()
for (let p = 0; p < PRESETS.length; p++) {
  const list: CareerSummary[] = []
  for (let i = 0; i < INDICES; i++) list.push(replay(p, i))
  rows.push(list)
  console.log(`… ${PRESETS[p].label} done (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
}

console.log(`\nREACH SWEEP – ${PRESETS.length} presets x ${INDICES} careers, ${((Date.now() - t0) / 1000).toFixed(0)}s`)

console.log(`\n14→16, DOMESTIC arm: careers of ${INDICES} clearing each candidate REACH_TARGET_MONEY (incumbent ${REACH_TARGET_MONEY})`)
console.log(pad('preset', 30) + DOMESTIC_CANDIDATES.map((c) => padL(c, 6)).join('') + padL('median peak', 14))
for (let p = 0; p < PRESETS.length; p++) {
  const peaks = rows[p].map((r) => r.maxDomestic104).sort((a, b) => a - b)
  const median = peaks[Math.floor(peaks.length / 2)]
  console.log(
    pad(PRESETS[p].label, 30) +
      DOMESTIC_CANDIDATES.map((c) => padL(rows[p].filter((r) => r.maxDomestic104 >= c).length, 6)).join('') +
      padL(median, 14),
  )
}

console.log(`\n14→18, PRO arm: careers of ${INDICES} clearing (ranked AND rank<=R) OR itf>=P (incumbent R=${REACH_PRO_RANK}, P=${REACH_PRO_POINTS})`)
console.log(pad('preset', 30) + padL('rank arm alone', 16) + ITF_CANDIDATES.map((c) => padL(`P${c}`, 6)).join(''))
for (let p = 0; p < PRESETS.length; p++) {
  const rankArm = rows[p].filter((r) => r.bestRankedRank208 <= REACH_PRO_RANK).length
  console.log(
    pad(PRESETS[p].label, 30) +
      padL(rankArm, 16) +
      ITF_CANDIDATES.map((c) => padL(rows[p].filter((r) => r.bestRankedRank208 <= REACH_PRO_RANK || r.maxItf208 >= c).length, 6)).join(''),
  )
}

console.log(`\n14→18, rank half swept alone (points arm OFF) – careers of ${INDICES} ever ranked <= R while holding a counting result`)
console.log(pad('preset', 30) + RANK_CANDIDATES.map((c) => padL(`<=${c}`, 8)).join('') + padL('median best rank', 20))
for (let p = 0; p < PRESETS.length; p++) {
  const best = rows[p].map((r) => r.bestRankedRank208).sort((a, b) => a - b)
  const median = best[Math.floor(best.length / 2)]
  console.log(
    pad(PRESETS[p].label, 30) +
      RANK_CANDIDATES.map((c) => padL(rows[p].filter((r) => r.bestRankedRank208 <= c).length, 8)).join('') +
      padL(Number.isFinite(median) ? median : 'never ranked', 20),
  )
}

console.log(`\n14→18, ITF points half swept alone (rank arm OFF) – careers of ${INDICES} reaching P points`)
console.log(pad('preset', 30) + ITF_CANDIDATES.map((c) => padL(c, 7)).join('') + padL('median peak itf', 18))
for (let p = 0; p < PRESETS.length; p++) {
  const peaks = rows[p].map((r) => r.maxItf208).sort((a, b) => a - b)
  const median = peaks[Math.floor(peaks.length / 2)]
  console.log(
    pad(PRESETS[p].label, 30) +
      ITF_CANDIDATES.map((c) => padL(rows[p].filter((r) => r.maxItf208 >= c).length, 7)).join('') +
      padL(median, 18),
  )
}

// The per-career peaks, so a re-aim can see WHICH careers sit near the chosen line rather than only
// how many – the marginal seed is the whole story of this tripwire's first four flips.
for (let p = 0; p < PRESETS.length; p++) {
  console.log(`\nper-career 14→16 domestic peaks – ${PRESETS[p].label}`)
  console.log(rows[p].map((r) => `${r.index}:${r.maxDomestic104}`).join(' '))
}

// Raw summaries, so any candidate not in the grids above can be scored without a re-run.
console.log(`\nRAW ${JSON.stringify(rows.flat())}`)

// --- THE FIXTURE ARM: is this cell's 14→18 answer about the tennis or about the bank? -------------
//
// ⚠ THIS IS THE SECOND PROPERTY A FIXTURE NEEDS AND THE TABLES ABOVE CANNOT SEE IT. They answer "do
// both branches fire", which is necessary; `middleHigh` had it and was still the wrong fixture,
// because eleven of its fifteen lost careers were the family going broke (compound-cost-2026-08.md
// §5). Run with `--float=100000000` and every career is replayed with a wallet that cannot empty, so
// the careers that STILL miss are the ones the tennis missed.
//
// ⚠ AND THE CAVEAT THAT ARM CARRIES, CARRIED WITH IT: a float changes the world in more ways than
// one (no affordability refusal, no debt spell, no latch), so the delta is an UPPER BOUND on what the
// bank balance decides and never an attribution of it. Reading a small delta as "this cell is
// tennis-decided" is sound; reading a large one as "exactly N careers are the money" is not.
if (FLOAT_CENTS > 0) {
  const floatRows: CareerSummary[][] = []
  const tf = Date.now()
  for (let p = 0; p < PRESETS.length; p++) {
    const list: CareerSummary[] = []
    for (let i = 0; i < INDICES; i++) list.push(replay(p, i, FLOAT_CENTS))
    floatRows.push(list)
    console.log(`… float arm: ${PRESETS[p].label} done (${((Date.now() - tf) / 1000).toFixed(0)}s)`)
  }

  console.log(
    `\n14→18 SOLVENCY vs TENNIS – the same ${INDICES} careers replayed with $${Math.round(FLOAT_CENTS / 100).toLocaleString('en-US')} added to the opening balance`,
  )
  console.log(
    pad('preset', 30) +
      padL('as charged', 12) +
      padL('with float', 12) +
      padL('SOLVENCY', 10) +
      padL('TENNIS', 8) +
      padL('went red', 10) +
      padL('latched', 9),
  )
  for (let p = 0; p < PRESETS.length; p++) {
    const charged = rows[p].filter(reachedPro).length
    const floated = floatRows[p].filter(reachedPro).length
    const red = rows[p].filter((r) => r.bankruptWeek !== null).length
    const latched = rows[p].filter((r) => r.endingType === 'bankruptcy').length
    console.log(
      pad(PRESETS[p].label, 30) +
        padL(`${charged}/${INDICES}`, 12) +
        padL(`${floated}/${INDICES}`, 12) +
        // Of the careers that MISS as charged, how many would have reached with money (solvency) and
        // how many miss even with it (tennis). The two always sum to INDICES − charged.
        padL(floated - charged, 10) +
        padL(INDICES - floated, 8) +
        padL(`${red}/${INDICES}`, 10) +
        padL(`${latched}/${INDICES}`, 9),
    )
  }
  console.log(
    `\n  SOLVENCY = careers that miss as charged but reach with the float (upper bound on what the bank decides).` +
      `\n  TENNIS   = careers that miss even with a wallet that cannot empty.` +
      `\n  A fixture for the 14→18 PRO proxy wants both branches firing AND the SOLVENCY column small.`,
  )
}
