/**
 * fifth-skill-probe – DID THE COHORT ACTUALLY GET A FIFTH SKILL? (round 22)
 *
 * The owner's ask: «ты же вроде сделал хорошую формулу для него [power()]. Мне кажется надо на нее
 * опираться, тогда у всех появится аналог пятого навыка». Before this wave `rivalGroundstrokes` was
 * `(serve + ret) / 2 + offset(±8)` – a THIRD READING OF THE FIRST TWO, not a fifth axis – and it had
 * no ceiling of its own, so it never developed toward anything. This measures whether the re-anchor
 * onto `mean(four) + offset` fixed both halves, on the SHIPPED cohort, in points rather than in prose.
 *
 * ⚠ BOTH ARMS RUN IN ONE PROCESS ON ONE COHORT, WHICH IS THE WHOLE PROVENANCE STORY (CLAUDE.md's
 * "before you believe a null result, prove the arm contains both the change and its reader"). The
 * AFTER arm is the SHIPPED `rivalGroundstrokes`, imported; the BEFORE arm is the pre-wave formula
 * copied verbatim below, including its `gs:<id>` sub-stream draw. There is no worktree, no second
 * commit and therefore no way to accidentally measure a tree against itself – and `movedCount` below
 * is the tripwire that says so out loud if the two arms ever coincide.
 *
 * WHAT IT PRINTS
 *   1. INDEPENDENCE – r(groundstrokes, (serve+ret)/2) before vs after, plus the deviation
 *      `gs - (serve+ret)/2` in points: its sd, its range, and how many rivals sit beyond ±8 and ±12.
 *      ±8 is the interesting cut because the OLD formula could not produce one, ever, by construction.
 *   2. SPECIALISTS – the named rivals furthest above and below what their serve/ret predicts.
 *   3. GROWTH – `driftCohort` run forward five seasons, showing the gap to `rivalGroundstrokePotential`
 *      closing (and never being crossed). The before arm has no ceiling to close on; that is the defect.
 *   4. SPREAD SWEEP – the same independence numbers at hypothetical `RIVAL_GS_SPREAD` values, so a
 *      later tuning decision on that knob is a measurement rather than a taste. NOTHING IS TUNED HERE.
 *
 * MEASUREMENT ONLY: no engine change, no new RNG stream, no world ticked. Deterministic.
 *
 * Run:
 *   npx vite-node tools/fifth-skill-probe.ts
 *   npx vite-node tools/fifth-skill-probe.ts -- --seasons 8
 */
import { generateCohort, driftCohort, ageCohort, power } from '../src/engine/season/cohort'
import { RIVAL_GS_SPREAD, rivalGroundstrokes, rivalGroundstrokePotential } from '../src/engine/season/rival'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { AiPlayer } from '../src/engine/season/types'

const arg = (name: string, fallback: number): number => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? Number(process.argv[i + 1]) : fallback
}
const SEASONS = arg('seasons', 5)
const SEEDS = ['bench-working-0', 'bench-middle-1', 'bench-wealthy-2', 'probe-3', 'probe-4']

const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x)

/** ⚠ THE BEFORE ARM, COPIED VERBATIM from src/engine/season/rival.ts as it stood at cacf5b8 –
 *  the anchor this wave replaced. Kept here rather than reconstructed from memory so the comparison
 *  is against the code that actually shipped, and so this file keeps measuring the same thing after
 *  the engine moves on. */
function rivalGroundstrokesBefore(p: Pick<AiPlayer, 'id' | 'serve' | 'ret'>): number {
  const base = (p.serve + p.ret) / 2
  const u = rngFromSeed(`gs:${p.id}`)()
  return clamp(base + RIVAL_GS_SPREAD * (2 * u - 1), 0, 100)
}

/** Her personal tilt, re-derived off the same one draw the engine spends, so the sweep in §4 can ask
 *  "what would this look like at spread X" without the engine having a knob it does not need. */
function tilt(id: string): number {
  return 2 * rngFromSeed(`gs:${id}`)() - 1
}

const firstStrike = (p: AiPlayer): number => (p.serve + p.ret) / 2
const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length
const sd = (xs: number[]): number => {
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}
function pearson(xs: number[], ys: number[]): number {
  const mx = mean(xs)
  const my = mean(ys)
  let cov = 0
  for (let i = 0; i < xs.length; i++) cov += (xs[i] - mx) * (ys[i] - my)
  cov /= xs.length
  return cov / (sd(xs) * sd(ys))
}
const f = (x: number, d = 2): string => x.toFixed(d).padStart(d === 0 ? 4 : d + 4)

interface ArmStats {
  r: number
  level: number
  devSd: number
  devMin: number
  devMax: number
  beyond8: number
  beyond12: number
}

/** One arm's independence reading against the first-strike pair. `dev` is the deviation in POINTS
 *  from what serve/return alone predict – the quantity a player would actually feel. */
function armStats(cohort: AiPlayer[], gsOf: (p: AiPlayer) => number): ArmStats {
  const gs = cohort.map(gsOf)
  const fs = cohort.map(firstStrike)
  const dev = cohort.map((_, i) => gs[i] - fs[i])
  return {
    r: pearson(gs, fs),
    level: mean(gs),
    devSd: sd(dev),
    devMin: Math.min(...dev),
    devMax: Math.max(...dev),
    beyond8: dev.filter((d) => Math.abs(d) > 8).length,
    beyond12: dev.filter((d) => Math.abs(d) > 12).length,
  }
}

const line = (s: string): void => console.log(s)
const rule = (s: string): void => line(`\n${s}\n${'-'.repeat(s.length)}`)

line('fifth-skill-probe – is a rival`s groundstroke an axis of her own yet?')
line(`cohort = generateCohort(seed) (199 rivals, as shipped) · seeds = ${SEEDS.length} · spread = ±${RIVAL_GS_SPREAD}`)

// =================================================================================================
rule('1. INDEPENDENCE – groundstrokes vs (serve + ret) / 2, on the freshly generated cohort')
// =================================================================================================
line('                              r    mean gs   dev sd   dev range        |dev|>8   |dev|>12')
const before: ArmStats[] = []
const after: ArmStats[] = []
let movedCount = 0
let movedTotal = 0
let movedSum = 0
for (const seed of SEEDS) {
  const cohort = generateCohort(seed)
  const b = armStats(cohort, rivalGroundstrokesBefore)
  const a = armStats(cohort, rivalGroundstrokes)
  before.push(b)
  after.push(a)
  for (const p of cohort) {
    const d = Math.abs(rivalGroundstrokes(p) - rivalGroundstrokesBefore(p))
    movedTotal++
    movedSum += d
    if (d > 1e-9) movedCount++
  }
  const row = (tag: string, s: ArmStats): string =>
    `  ${(seed + ' ' + tag).padEnd(26)} ${f(s.r, 3)}  ${f(s.level)}    ${f(s.devSd)}   ${f(s.devMin, 1)} .. ${f(s.devMax, 1)}   ${String(s.beyond8).padStart(5)}      ${String(s.beyond12).padStart(5)}`
  line(row('BEFORE', b))
  line(row('AFTER ', a))
}
line('')
line(`  MEAN over ${SEEDS.length} seeds     BEFORE   r ${f(mean(before.map((s) => s.r)), 3)}   dev sd ${f(mean(before.map((s) => s.devSd)))}   |dev|>8 ${f(mean(before.map((s) => s.beyond8)), 1)}/199   |dev|>12 ${f(mean(before.map((s) => s.beyond12)), 1)}/199`)
line(`                        AFTER    r ${f(mean(after.map((s) => s.r)), 3)}   dev sd ${f(mean(after.map((s) => s.devSd)))}   |dev|>8 ${f(mean(after.map((s) => s.beyond8)), 1)}/199   |dev|>12 ${f(mean(after.map((s) => s.beyond12)), 1)}/199`)
line('')
// ⚠ THE ONE SIDE EFFECT WORTH DECLARING, and it is a LEVEL shift rather than a shape one. The cohort
// is generated on unequal bands - serve/ret 30-60 but composure 25-70 and stamina 30-70 - so an
// anchor that reads all four sits slightly ABOVE one that reads only the first-strike pair. The
// field's rally axis therefore rises by the difference below. It is not free: the kid meets a
// marginally better-hitting field, which is what moves the outcome pins in the guard suites.
line(
  `  ⚠ LEVEL SHIFT: the field's mean groundstroke moves ${f(mean(before.map((s) => s.level)))} -> ${f(mean(after.map((s) => s.level)))}` +
    ` (${f(mean(after.map((s) => s.level)) - mean(before.map((s) => s.level)), 2)} points), because composure`,
)
line("  and stamina are generated on higher bands than serve and ret. Declared, not hidden.")
line('')
line(`  PROVENANCE: ${movedCount}/${movedTotal} rivals moved between the arms, mean |Δ| ${f(movedSum / movedTotal)} points.`)
line('  (The handful that did not are the ones where composure + stamina happens to equal serve + ret,')
line('  so the old anchor and the new one coincide. Both arms are in this process, on one cohort.)')
if (movedCount === 0) line('  ⚠⚠ NULL ARM: the two formulas agree on every rival. The measurement below means nothing.')

// =================================================================================================
rule('2. SPECIALISTS – who is furthest from what her serve and return predict (seed ' + SEEDS[0] + ')')
// =================================================================================================
{
  const cohort = generateCohort(SEEDS[0])
  const rows = cohort.map((p) => ({
    p,
    devB: rivalGroundstrokesBefore(p) - firstStrike(p),
    devA: rivalGroundstrokes(p) - firstStrike(p),
  }))
  const show = (r: (typeof rows)[number]): string =>
    `  ${r.p.name.padEnd(22)} serve ${f(r.p.serve, 0)} ret ${f(r.p.ret, 0)} comp ${f(r.p.composure, 0)} stam ${f(r.p.stamina, 0)} · gs ${f(rivalGroundstrokes(r.p), 1)} (dev ${r.devA >= 0 ? '+' : ''}${f(r.devA, 1)}, was ${r.devB >= 0 ? '+' : ''}${f(r.devB, 1)})`
  const byDev = [...rows].sort((x, y) => y.devA - x.devA)
  line('  BIG HITTERS (groundstroke well above her first-strike level):')
  for (const r of byDev.slice(0, 5)) line(show(r))
  line('  NO GROUNDSTROKE (well below):')
  for (const r of byDev.slice(-5).reverse()) line(show(r))
  line('')
  line(`  BEFORE, the widest deviation any of the 199 could have was ±${RIVAL_GS_SPREAD}.00 by construction`)
  line(`  (dev === the offset). AFTER, the observed range is ${f(Math.min(...rows.map((r) => r.devA)), 1)} .. ${f(Math.max(...rows.map((r) => r.devA)), 1)}.`)
}

// =================================================================================================
rule(`3. GROWTH – ${SEASONS} seasons of driftCohort: does it climb toward a ceiling of its own?`)
// =================================================================================================
{
  const cohort = generateCohort(SEEDS[0])
  const rng = rngFromSeed(`${SEEDS[0]}:probe:drift`)
  const snapshot = (label: string): void => {
    const gs = cohort.map(rivalGroundstrokes)
    const pot = cohort.map(rivalGroundstrokePotential)
    const gap = cohort.map((_, i) => pot[i] - gs[i])
    const over = gap.filter((g) => g < -1e-9).length
    const fourGap = mean(
      cohort.map((p) => (p.potential.serve - p.serve + (p.potential.ret - p.ret) + (p.potential.composure - p.composure) + (p.potential.stamina - p.stamina)) / 4),
    )
    line(
      `  ${label.padEnd(12)} mean gs ${f(mean(gs))}   mean ceiling ${f(mean(pot))}   gap to ceiling ${f(mean(gap))}` +
        `   (four-attribute gap ${f(fourGap)})   over ceiling: ${over}`,
    )
  }
  snapshot('week 0')
  for (let s = 0; s < SEASONS; s++) {
    for (let w = 0; w < WEEKS_PER_YEAR; w++) driftCohort(cohort, rng, SEEDS[0])
    ageCohort(cohort)
    snapshot(`season ${s + 1}`)
  }
  line('')
  line('  The gap tracks the four-attribute gap exactly – that IS the design: the fifth axis owns its')
  line('  level and its ceiling, and closes on that ceiling at the mean rate of her four. Nothing ever')
  line('  crosses its ceiling.')
  line('')
  // ...and the decline years take it back DOWN again, which is a claim and therefore measured rather
  // than asserted. `aiDeclineFactor` bites from 29, well past a junior cohort's span, so the ages are
  // forced forward here instead of waiting fifteen simulated seasons for one number.
  {
    const old = generateCohort(SEEDS[0])
    for (const p of old) p.ageYears = 31
    const oldRng = rngFromSeed(`${SEEDS[0]}:probe:decline`)
    const at0 = mean(old.map(rivalGroundstrokes))
    for (let w = 0; w < WEEKS_PER_YEAR * 3; w++) driftCohort(old, oldRng, SEEDS[0])
    const at3 = mean(old.map(rivalGroundstrokes))
    line(`  DECLINE (same cohort forced to 31, 3 seasons of drift): mean gs ${f(at0)} -> ${f(at3)}` +
      `  (${at3 < at0 ? 'falls with the rest of her game' : '⚠ DOES NOT FALL – the claim is wrong'})`)
  }
  line('')
  line('  ⚠ THE BEFORE ARM HAS NO ROW HERE, AND THAT IS THE SECOND DEFECT. `(serve + ret) / 2 + offset`')
  line('  has no ceiling to reach: it tracked the first-strike pair wherever it went and there was no')
  line('  quantity in the world it was developing toward.')
}

// =================================================================================================
rule('4. SPREAD SWEEP – what the knob would buy (NOT a tuning change; shipped value is ±' + RIVAL_GS_SPREAD + ')')
// =================================================================================================
{
  line('  spread     r     dev sd   |dev|>8   |dev|>12   power sd')
  for (const spread of [0, 4, 8, 12, 16, 20]) {
    const rs: number[] = []
    const sds: number[] = []
    const b8: number[] = []
    const b12: number[] = []
    const psd: number[] = []
    for (const seed of SEEDS) {
      const cohort = generateCohort(seed)
      const gsAt = (p: AiPlayer): number =>
        clamp((p.serve + p.ret + p.composure + p.stamina) / 4 + spread * tilt(p.id), 0, 100)
      const s = armStats(cohort, gsAt)
      rs.push(s.r)
      sds.push(s.devSd)
      b8.push(s.beyond8)
      b12.push(s.beyond12)
      psd.push(sd(cohort.map((p) => (p.serve + p.ret + p.composure + p.stamina + gsAt(p)) / 5)))
    }
    const mark = spread === RIVAL_GS_SPREAD ? ' <- shipped' : ''
    line(`  ±${String(spread).padEnd(4)} ${f(mean(rs), 3)}   ${f(mean(sds))}    ${f(mean(b8), 1)}     ${f(mean(b12), 1)}      ${f(mean(psd))}${mark}`)
  }
  line('')
  line('  `power sd` is the cohort`s spread on `power()` itself – the number the conveyor retires on.')
  line('  It barely moves across the whole sweep (the fifth axis is one of five terms), which is the')
  line('  argument that widening this knob is a MATCH-FEEL decision and not a balance one.')
}

// =================================================================================================
rule('5. WHAT THE FIFTH AXIS CORRELATES WITH NOW (mean over seeds)')
// =================================================================================================
{
  const keys = ['serve', 'ret', 'composure', 'stamina'] as const
  // ⚠ THE LAST COLUMN IS `mean(four)` AND NOT `power()`, DELIBERATELY. `power()` CONTAINS the
  // groundstroke (that is the 18.08 fix), so correlating the fifth axis against it is one fifth
  // self-correlation and would flatter both arms. The anchor is the honest reference.
  const level = (p: AiPlayer): number => (p.serve + p.ret + p.composure + p.stamina) / 4
  const rowsB: number[][] = []
  const rowsA: number[][] = []
  let identityMax = 0
  for (const seed of SEEDS) {
    const cohort = generateCohort(seed)
    const gsB = cohort.map(rivalGroundstrokesBefore)
    const gsA = cohort.map(rivalGroundstrokes)
    rowsB.push([...keys.map((k) => pearson(gsB, cohort.map((p) => p[k]))), pearson(gsB, cohort.map(level))])
    rowsA.push([...keys.map((k) => pearson(gsA, cohort.map((p) => p[k]))), pearson(gsA, cohort.map(level))])
    // The no-double-counting claim, as an identity rather than a correlation: with the new anchor
    // `power()` is exactly `mean(four) + offset / 5`, so the fifth term contributes its OWN content
    // and nothing else. Anything above ~1e-9 here means the collapse in cohort.ts's note is wrong.
    for (const p of cohort) {
      identityMax = Math.max(identityMax, Math.abs(power(p) - (level(p) + (RIVAL_GS_SPREAD * tilt(p.id)) / 5)))
    }
  }
  const col = (rows: number[][], i: number): string => f(mean(rows.map((r) => r[i])), 3)
  line('              serve     ret   composure  stamina   mean(four)')
  line(`  BEFORE     ${col(rowsB, 0)}  ${col(rowsB, 1)}   ${col(rowsB, 2)}   ${col(rowsB, 3)}    ${col(rowsB, 4)}`)
  line(`  AFTER      ${col(rowsA, 0)}  ${col(rowsA, 1)}   ${col(rowsA, 2)}   ${col(rowsA, 3)}    ${col(rowsA, 4)}`)
  line('')
  line('  BEFORE the axis was a restatement of serve and return and knew nothing about the other two.')
  line('  AFTER it reads all four evenly – which is the owner`s «опираться на power()» – and keeps its')
  line('  own independent tilt on top, which is what makes a specialist possible at all.')
  line('')
  line(`  IDENTITY CHECK  max |power(p) - (mean(four) + offset/5)| over every rival = ${identityMax.toExponential(1)}`)
  line('  – so the fifth term in power() now adds exactly its own independent content. Under the old')
  line('  anchor it re-added 60% of serve/ret, pricing a first-strike rival up twice for one weapon.')
}
