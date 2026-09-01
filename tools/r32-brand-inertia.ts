/**
 * r32-brand-inertia – ROUND 32 #4 + #5, MEASURED TOGETHER. Invariant 5's bench.
 *
 * ⚠⚠ ONE TOOL FOR TWO ITEMS ON PURPOSE, and it is the owner's own instruction: «совместный эффект –
 * мерить, да». Brand inertia (#4) and collaborations-as-early-fame (#5) both push on the SAME number
 * – the brand's worth – so two separately measured features summed is not the answer. The headline
 * table below is the COMBINED arm; each feature alone is reported beside it so the interaction is
 * visible rather than assumed.
 *
 * ⭐ THE FOUR ARMS, and how each is built:
 *
 *   A   control      strength := fame,  shootFloorByBand zeroed   – the pre-wave arithmetic exactly
 *   B   inertia only strength derived,  shootFloorByBand zeroed
 *   C   collabs only strength := fame,  shootFloorByBand shipped
 *   D   COMBINED     strength derived,  shootFloorByBand shipped  – what ships
 *
 * ⚠⚠ THE INERTIA AXIS NEEDS NO SECOND TREE AND NO SECOND WALK, and that is not a shortcut. Round 32
 * #4 makes the WORTH read `signals.strength` through `brandBuiltSignals`; substituting
 * `strength := fame` makes that substitution the identity, so `brandGrossWorthCents` reduces to the
 * expression it had before the wave, term for term, through the SHIPPED function. There is nothing
 * here to drift from the engine – the same argument `brand-dynamics.ts`' `pre32MultipleX` makes for
 * round 32 #3, and the same reason the arm-divergence hazard CLAUDE.md records cannot arise.
 *
 * ⚠⚠ THE COLLABORATION AXIS *DOES* NEED ITS OWN WALK, because it changes what FAME IS – and fame
 * reaches the merch income, which reaches the wallet. So the bench runs the walk once per arm, with
 * `ECONOMY.fame.shootFloorByBand` set before each walk and restored after. The knob is CLI-only and
 * never written back to a save; every function it drives is a pure fold, so nothing here can move the
 * frozen MAIN capture (41550 / e6b0c709).
 *
 * ⚠ HIS SAVES ARE READ-ONLY. `--save` reads one through the game's own import door
 * (`decodeExportFile`), prints DERIVED numbers, and copies nothing: no fixture, no committed byte.
 * The same law tools/injury-saves-read.ts and tools/real-vs-bench.ts run under.
 *
 * Run:  npx vite-node tools/r32-brand-inertia.ts -- --save ~/Downloads/<career>.tsave
 *       npx vite-node tools/r32-brand-inertia.ts -- --seeds 8 --weeks 780
 *       npx vite-node tools/r32-brand-inertia.ts -- --save <path> --skip-bench
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import {
  acceptOffer,
  brandReachOf,
  createWorld,
  fameFloorOf,
  brandGrossWorthCents,
  brandMultipleX,
  brandSignalsOf,
  brandWeeklyGrossCents,
  completedShootsByBand,
  shopItem,
  type BrandSignals,
  type WorldState,
} from '../src/engine/world'
import { isOfferLive } from '../src/engine/offers'
import { decodeExportFile } from '../src/engine/saveCodec'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, type Preset, type Policy } from './econ-bench'

const argv = process.argv.slice(2)
const num = (name: string, fallback: number): number => {
  const i = argv.indexOf(name)
  return i >= 0 ? Number(argv[i + 1]) : fallback
}
const WEEKS = num('--weeks', 780)
const SEEDS = num('--seeds', 8)
const SAVES: string[] = []
for (let i = 0; i < argv.length; i++) if (argv[i] === '--save' && argv[i + 1]) SAVES.push(argv[++i])

const MERCH = shopItem('merch-brand')!
const PRICE_CENTS = MERCH.entryCents
const BASE_X = MERCH.earningsMultipleX!
const FLOOR_CENTS = PRICE_CENTS * ECONOMY.shop.businessValueFloorShare
const SHIPPED_BANDS = ECONOMY.fame.shootFloorByBand
const ZERO_BANDS = SHIPPED_BANDS.map(() => 0)

const usd = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const musd = (cents: number): string => `$${(cents / 100 / 1_000_000).toFixed(2)}M`
const pct = (ratio: number): string => `${(ratio * 100).toFixed(1)}%`
const q = (xs: number[], p: number): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(p * s.length))]
}

/** ⭐ THE COLLABORATION KNOB. CLI-only, restored by the caller, never persisted. */
function setBands(bands: readonly number[]): void {
  ;(ECONOMY.fame as { shootFloorByBand: readonly number[] }).shootFloorByBand = bands
}

/** ⭐⭐ THE PRE-WAVE WORTH, THROUGH THE SHIPPED FUNCTION. Since the 31.08 revision the whole of #4
 *  reaches the pricing through `brandReachOf` = `max(fame, retention x strength)`; hand it a signal
 *  set whose strength IS its fame and – because `retention < 1` – the max resolves to `fame`, so
 *  `brandGrossWorthCents` reduces to its own pre-wave expression term for term. Nothing here is a
 *  copy of the engine and nothing can drift from it. */
const flatWorthCents = (s: BrandSignals): number => brandGrossWorthCents({ ...s, strength: s.fame }, BASE_X)

/** ...and the same identity for the INCOME, which the revision moved onto the reach as well. */
const flatWeeklyCents = (s: BrandSignals): number => brandWeeklyGrossCents({ ...s, strength: s.fame })

// ---------------------------------------------------------------------------------------------
// §1 HIS OWN CAREER – the measurement that forced #4, and the five-year projection in every arm
// ---------------------------------------------------------------------------------------------

/** the row a save (or a bench week) reads, in one arm. */
function readRow(world: WorldState, week: number, inertia: boolean): {
  fame: number
  strength: number
  reach: number
  weeklyCents: number
  multipleX: number
  worthCents: number
  /** ⭐⭐⭐ THE HEADLINE OF THE REVISION – worth over a YEAR of what the brand takes in. */
  ratioX: number
  signals: BrandSignals
} {
  const raw = brandSignalsOf(world, week)
  // ⚠ THE INERTIA ARM IS ONE SUBSTITUTION AND NOT A SECOND FUNCTION – see `flatWorthCents`.
  const s: BrandSignals = inertia ? raw : { ...raw, strength: raw.fame }
  const weeklyCents = brandWeeklyGrossCents(s)
  const worthCents = brandGrossWorthCents(s, BASE_X)
  return {
    fame: s.fame,
    strength: s.strength,
    // ⭐⭐ SINCE THE REVISION THE INCOME READS THE REACH, so the memory is in the revenue and the
    // valuation is floored THROUGH it rather than beside it.
    reach: brandReachOf(s),
    weeklyCents,
    multipleX: brandMultipleX(s, BASE_X),
    worthCents,
    ratioX: worthCents / Math.max(1, weeklyCents * WEEKS_PER_YEAR),
    signals: s,
  }
}

async function projectSave(path: string): Promise<void> {
  const bytes = new Uint8Array(readFileSync(path))
  console.log(`\n${'='.repeat(112)}`)
  console.log(`⭐⭐⭐ §1 ${basename(path).replace('.tsave', '')} – FIVE YEARS FORWARD WITH NOTHING NEW WON`)
  console.log(`${'='.repeat(112)}`)
  for (const [armLabel, bands, inertia] of [
    ['A  control  (neither)', ZERO_BANDS, false],
    ['B  inertia only', ZERO_BANDS, true],
    ['C  collabs only', SHIPPED_BANDS, false],
    ['D  COMBINED (ships)', SHIPPED_BANDS, true],
  ] as [string, readonly number[], boolean][]) {
    setBands(bands)
    // ⚠⚠ DECODED INSIDE THE ARM, AND THAT IS NOT WASTE. `decodeExportFile` runs `migrateSave`, whose
    // v69 step pins the stock at THE SAVE'S OWN FAME – which is itself a reading of the arm's
    // constants, because #5 changes what fame is. A decode reused across arms would carry arm A's pin
    // into arm D and quietly measure the wrong thing.
    const world = await decodeExportFile(bytes)
    const w0 = world.week
    const base = readRow(world, w0, inertia)
    console.log(`\n   ${armLabel}`)
    console.log(
      `      ${'when'.padEnd(10)}${'fame'.padStart(7)}${'strength'.padStart(10)}${'reach'.padStart(8)}` +
        `${'weekly'.padStart(10)}${'a year'.padStart(11)}${'multiple'.padStart(10)}${'worth'.padStart(14)}` +
        `${'worth/yr'.padStart(10)}${'vs now'.padStart(9)}`,
    )
    // ⭐⭐⭐ EVERY WEEK OF THE FIVE YEARS IS ASKED, and the printed rows are a sample of it. The
    // acceptance is «inside the band at EVERY point», so the extremes below are a sweep and not five
    // spot readings – a ratio that spikes in month seven would not show in an annual table.
    let lo = Infinity
    let hi = 0
    for (let w = w0; w <= w0 + 5 * WEEKS_PER_YEAR; w++) {
      const r = readRow(world, w, inertia)
      if (r.weeklyCents <= 0) continue
      lo = Math.min(lo, r.ratioX)
      hi = Math.max(hi, r.ratioX)
    }
    for (const years of [0, 1, 2, 3, 5]) {
      const r = readRow(world, w0 + years * WEEKS_PER_YEAR, inertia)
      console.log(
        `      ${(years === 0 ? 'now' : `+${years} year${years > 1 ? 's' : ''}`).padEnd(10)}` +
          `${r.fame.toFixed(1).padStart(7)}${r.strength.toFixed(1).padStart(10)}${r.reach.toFixed(1).padStart(8)}` +
          `${usd(r.weeklyCents).padStart(10)}${usd(r.weeklyCents * WEEKS_PER_YEAR).padStart(11)}` +
          `${`${r.multipleX.toFixed(2)}x`.padStart(10)}` +
          `${usd(r.worthCents).padStart(14)}${`${r.ratioX.toFixed(1)}x`.padStart(10)}` +
          `${pct(r.worthCents / Math.max(1, base.worthCents)).padStart(9)}`,
      )
    }
    const five = readRow(world, w0 + 5 * WEEKS_PER_YEAR, inertia)
    console.log(
      `      ⭐ five-year fall:  worth ${pct(1 - five.worthCents / Math.max(1, base.worthCents))}` +
        `   ·   income ${pct(1 - five.weeklyCents / Math.max(1, base.weeklyCents))}` +
        `   ·   fame ${pct(1 - five.fame / Math.max(1e-9, base.fame))}`,
    )
    console.log(
      `      ⭐⭐ worth / a year of income over the WHOLE five years: ${lo.toFixed(1)}x – ${hi.toFixed(1)}x` +
        `   (the multiple's own band is ${ECONOMY.business.merch.value.unknownX}x – ${ECONOMY.business.merch.value.maxX}x)` +
        `   ·   three-year income fall ${pct(1 - readRow(world, w0 + 3 * WEEKS_PER_YEAR, inertia).weeklyCents / Math.max(1, base.weeklyCents))}`,
    )
    if (inertia && bands === SHIPPED_BANDS) {
      const s = base.signals
      const shoots = completedShootsByBand(world, w0)
      const byBand = SHIPPED_BANDS.map((_, i) => shoots.filter((x) => x.band === i).length)
      console.log(
        `      the record: week ${w0}, ${s.proSeasons} pro seasons, ${s.topSeasons} top-${ECONOMY.business.merch.value.topEndRank}, ` +
          `${s.finalsLost} finals lost, win rate ${pct(s.winRate)}, room ${Math.round(s.roomSize).toLocaleString('en-US')}`,
      )
      console.log(`      delivered shoots by band (weakest first): ${byBand.join(' / ')}   (${shoots.length} in all)`)
      console.log(`      the v69 pin the migration wrote: week ${world.brandStrengthSeed?.week}, value ${world.brandStrengthSeed?.value.toFixed(4)}`)
    }
  }
  setBands(SHIPPED_BANDS)
}

// ---------------------------------------------------------------------------------------------
// §1b THE TWO DIALS THE REVISION ADDS, SWEPT ON HIS OWN ROW
//
// ⚠ `retention` is not a guess and neither is the half-life ladder: both are chosen against a stated
// criterion and the frontier either side of them is printed here so the trade stays the owner's.
// ---------------------------------------------------------------------------------------------

/** ⭐ THE RETENTION KNOB. CLI-only, restored by the caller, never persisted. */
function setRetention(x: number): void {
  ;(ECONOMY.business.merch.strength as { retention: number }).retention = x
}

/** ⭐ THE HALF-LIFE LADDER KNOB. Same rules. */
function setHalfLives(ladder: readonly number[]): void {
  ;(ECONOMY.fame as { shootFloorHalfLifeByBand: readonly number[] }).shootFloorHalfLifeByBand = ladder
}

const SHIPPED_RETENTION = ECONOMY.business.merch.strength.retention
const SHIPPED_HALFLIVES = ECONOMY.fame.shootFloorHalfLifeByBand

async function sweepSave(path: string): Promise<void> {
  const bytes = new Uint8Array(readFileSync(path))
  console.log(`\n  ⭐⭐⭐ §1b THE FRONTIER on ${basename(path).replace('.tsave', '')}, COMBINED arm`)
  console.log(
    `      ⚠ the sizing criterion for retention is the one documented case of an off-court income when the winning stops:`,
  )
  console.log(
    `        Osaka ~$60M (2021) -> $12.0M (2024), −75% in three years with essentially no sponsors lost (research §4e).`,
  )
  console.log(
    `      ${'retention'.padStart(10)}${'reach +5y'.padStart(11)}${'income now'.padStart(12)}${'income +3y'.padStart(12)}` +
      `${'3y fall'.padStart(9)}${'income +5y'.padStart(12)}${'5y fall'.padStart(9)}${'worth +5y'.padStart(12)}` +
      `${'5y fall'.padStart(9)}${'ratio band'.padStart(16)}`,
  )
  for (const r of [0.0, 0.5, 0.7, 0.75, 0.78, 0.8, 0.82, 0.85, 0.9, 0.95, 0.99]) {
    setRetention(r)
    const world = await decodeExportFile(bytes)
    const w0 = world.week
    const base = readRow(world, w0, true)
    const three = readRow(world, w0 + 3 * WEEKS_PER_YEAR, true)
    const five = readRow(world, w0 + 5 * WEEKS_PER_YEAR, true)
    let lo = Infinity
    let hi = 0
    for (let w = w0; w <= w0 + 5 * WEEKS_PER_YEAR; w++) {
      const row = readRow(world, w, true)
      if (row.weeklyCents <= 0) continue
      lo = Math.min(lo, row.ratioX)
      hi = Math.max(hi, row.ratioX)
    }
    console.log(
      `      ${r.toFixed(2).padStart(10)}${five.reach.toFixed(1).padStart(11)}` +
        `${usd(base.weeklyCents * WEEKS_PER_YEAR).padStart(12)}${usd(three.weeklyCents * WEEKS_PER_YEAR).padStart(12)}` +
        `${pct(1 - three.weeklyCents / Math.max(1, base.weeklyCents)).padStart(9)}` +
        `${usd(five.weeklyCents * WEEKS_PER_YEAR).padStart(12)}` +
        `${pct(1 - five.weeklyCents / Math.max(1, base.weeklyCents)).padStart(9)}` +
        `${usd(five.worthCents).padStart(12)}${pct(1 - five.worthCents / Math.max(1, base.worthCents)).padStart(9)}` +
        `${`${lo.toFixed(1)}x – ${hi.toFixed(1)}x`.padStart(16)}${r === SHIPPED_RETENTION ? '  <- shipped' : ''}`,
    )
  }
  setRetention(SHIPPED_RETENTION)

  console.log(`\n      the half-life ladder – his own row, and the shop row's «N years» is round 32 #3's binding criterion`)
  console.log(`      ${'ladder'.padStart(20)}${'fame now'.padStart(10)}${'worth now'.padStart(13)}${'shop row'.padStart(10)}`)
  for (const ladder of [
    [52, 52, 52, 52],
    [39, 45, 52, 65],
    [26, 39, 52, 78],
    [26, 45, 65, 91],
    [26, 52, 78, 103],
  ]) {
    setHalfLives(ladder)
    const world = await decodeExportFile(bytes)
    const row = readRow(world, world.week, true)
    console.log(
      `      ${ladder.join('/').padStart(20)}${row.fame.toFixed(2).padStart(10)}${usd(row.worthCents).padStart(13)}` +
        `${String(Math.round(row.multipleX)).padStart(10)}` +
        `${ladder.join('/') === SHIPPED_HALFLIVES.join('/') ? '  <- shipped' : ''}`,
    )
  }
  setHalfLives(SHIPPED_HALFLIVES)
}

// ---------------------------------------------------------------------------------------------
// §2 THE BENCH – four walks, one per arm
// ---------------------------------------------------------------------------------------------

interface WeekRow {
  week: number
  alive: boolean
  wtaRank: number | null
  signals: BrandSignals
  weeklyCents: number
  worthCents: number
  /** the same week priced by the PRE-#4 arithmetic – both readings off the SAME walk. */
  flatWorthCents: number
}

interface CareerRun {
  label: string
  seed: string
  rows: WeekRow[]
  bestWtaRank: number | null
  proTitles: number
  topSeasons: number
  affordRow: WeekRow | null
  lastAliveIndex: number
  /** how many advertising letters the arm actually signed – the null-arm check, printed. */
  signed: number
  /** ...and how many shoot weeks it actually lived, which is what #5 reads. */
  shoots: number
}

function runCareer(preset: Preset, policy: Policy, index: number, weeks: number): CareerRun {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const rows: WeekRow[] = []
  let bestWtaRank: number | null = null
  let affordRow: WeekRow | null = null
  let lastAliveIndex = 0
  let signed = 0
  for (let i = 0; i < weeks; i++) {
    const week = world.week
    // ⚠⚠⚠ THE ARM HAS TO CONTAIN ITS READER, AND THE FIRST DRAFT OF THIS BENCH DID NOT.
    // `econ-bench`'s policies NEVER SIGN AN ADVERTISING LETTER – measured: 102 ad letters raised over
    // 780 weeks on preset 0 and every one of them `expired`, so `fameShootMultOf` reads exactly 1.000
    // on every career it walks and a shoot-week ledger that is empty cannot show a shoot-week
    // feature. The C and D arms came back byte-identical to A and B, which is what a null arm looks
    // like when it is mistaken for a null result (CLAUDE.md, 17.08). So this arm answers the post,
    // eagerly, the week a letter lands – `sponsor-ladder-reach.ts`' own `answerThePost` policy, and
    // for the same stated reason: «if even this arm never sees a cell, nobody does».
    // ⚠ IT IS A PLAYER ACTION THROUGH THE ENGINE'S OWN DOOR (`acceptOffer` re-validates), it is
    // applied IDENTICALLY in every arm, and the collaboration constant cannot reach the decision – so
    // the four walks stay aligned week for week and only the fame they read differs.
    for (const offer of world.offers ?? []) {
      if (offer.kind !== 'ad' || !isOfferLive(offer, world.week)) continue
      try {
        acceptOffer(world, offer.id)
        signed++
      } catch {
        // the engine refusing – a career that has ended, or a slot already spoken for.
      }
    }
    stepCareerWeek(world, rng, policy)
    const signals = brandSignalsOf(world, week)
    const standing = sponsorStandingOf(world)
    const alive = world.ending === null
    const row: WeekRow = {
      week,
      alive,
      wtaRank: standing.wtaRanked ? standing.wtaRank : null,
      signals,
      weeklyCents: brandWeeklyGrossCents(signals),
      worthCents: brandGrossWorthCents(signals, BASE_X),
      flatWorthCents: flatWorthCents(signals),
    }
    if (alive) lastAliveIndex = rows.length
    if (affordRow === null && world.fundsCents >= PRICE_CENTS * 2) affordRow = row
    if (standing.wtaRanked && (bestWtaRank === null || standing.wtaRank < bestWtaRank)) bestWtaRank = standing.wtaRank
    rows.push(row)
  }
  let proTitles = 0
  for (const tier of Object.keys(ECONOMY.fame.titleFloor)) {
    proTitles += world.trophiesByTier?.[tier as keyof typeof world.trophiesByTier]?.titles.length ?? 0
  }
  let topSeasons = 0
  for (const s of world.seasonHistory ?? []) {
    const r = s.byTrack?.wta?.endRank
    if (r != null && r <= ECONOMY.business.merch.value.topEndRank) topSeasons++
  }
  return { label: preset.label, seed, rows, bestWtaRank, proTitles, topSeasons, affordRow, lastAliveIndex, signed, shoots: completedShootsByBand(world, world.week).length }
}

function walk(bands: readonly number[]): CareerRun[] {
  setBands(bands)
  const runs: CareerRun[] = []
  for (const preset of PRESETS) for (let i = 0; i < SEEDS; i++) runs.push(runCareer(preset, POLICIES[1], i, WEEKS))
  setBands(SHIPPED_BANDS)
  return runs
}

function peakLive(run: CareerRun, read: (r: WeekRow) => number): { value: number; row: WeekRow } {
  let best = -1
  let at = run.rows[0]
  for (let i = 0; i <= run.lastAliveIndex; i++) {
    const v = read(run.rows[i])
    if (v > best) {
      best = v
      at = run.rows[i]
    }
  }
  return { value: best, row: at }
}

/** the 52-week fall, live at both ends – `brand-dynamics.ts` §4's own window. */
function fallStats(runs: CareerRun[], read: (r: WeekRow) => number): { n: number; down: number; median: number; worst: number } {
  let n = 0
  let down = 0
  const drops: number[] = []
  for (const run of runs) {
    for (let i = WEEKS_PER_YEAR; i <= run.lastAliveIndex; i++) {
      const a = read(run.rows[i - WEEKS_PER_YEAR])
      const b = read(run.rows[i])
      if (a <= 0 || !run.rows[i - WEEKS_PER_YEAR].alive) continue
      n++
      if (b < a) {
        down++
        drops.push((b / a - 1) * 100)
      }
    }
  }
  return { n, down, median: q(drops, 0.5), worst: q(drops, 0) }
}

function armSummary(label: string, runs: CareerRun[], read: (r: WeekRow) => number): void {
  const famous = runs.filter((r) => peakLive(r, (x) => x.signals.fame).value >= 1)
  const peaks = famous.map((r) => peakLive(r, read).value)
  const afforders = runs.filter((r) => r.affordRow !== null)
  const dayOne = afforders.map((r) => read(r.affordRow!))
  const fall = fallStats(runs, read)
  // ⭐⭐ THE HOLD – what a career's brand is still worth at the END of the walk, as a share of its own
  // peak. THAT is the owner's complaint measured on a population instead of on one save, and it is
  // read at the last LIVE week rather than five years after the peak: peaks land late, so a fixed
  // five-year offset falls off the horizon for most careers and reports nothing (measured – the
  // first draft printed 0.0% for every arm because the sample was empty).
  // ⚠⚠ ONLY CAREERS WHOSE PEAK IS AT LEAST THREE YEARS BEHIND THEM, and that restriction is the
  // finding rather than a filter. The first draft read the last live week against the peak for every
  // career and printed 100.0% in all four arms: the bench's elite careers are still CLIMBING at week
  // 780, so their peak IS their last week and the question was never asked. A hold means nothing
  // until there is a decline to hold through.
  const holds: number[] = []
  for (const run of famous) {
    const peak = peakLive(run, read)
    const idx = run.rows.findIndex((r) => r.week === peak.row.week)
    if (peak.value <= 0 || idx < 0 || run.lastAliveIndex - idx < 3 * WEEKS_PER_YEAR) continue
    holds.push(read(run.rows[run.lastAliveIndex]) / peak.value)
  }
  console.log(
    `    ${label.padEnd(22)} peak ${musd(q(peaks, 0.5)).padStart(8)} med / ${musd(Math.max(...peaks)).padStart(8)} best` +
      ` · day-one ${usd(q(dayOne, 0.5)).padStart(9)} med, ${dayOne.filter((c) => c < FLOOR_CENTS).length}/${dayOne.length} under the mark` +
      ` · 52w fall ${((fall.down / Math.max(1, fall.n)) * 100).toFixed(1)}% of windows, median ${fall.median.toFixed(1)}%` +
      ` · 3y+ past the peak (${holds.length} careers) it still holds ${pct(q(holds, 0.5))} of it`,
  )
}

function main(): void {
  console.log(`ROUND 32 #4 (brand inertia) + #5 (collaborations as early fame) – MEASURED TOGETHER`)
  console.log(
    `  strength: half-life ${ECONOMY.business.merch.strength.halfLifeWeeks}w ` +
      `(${(ECONOMY.business.merch.strength.halfLifeWeeks / WEEKS_PER_YEAR).toFixed(1)} years), ` +
      `floor ${ECONOMY.business.merch.strength.floorShare} of her own peak` +
      `   ·   fame half-life ${ECONOMY.fame.halfLifeWeeks}w`,
  )
  console.log(
    `  shoot floor by band: ${SHIPPED_BANDS.join(' / ')} points, half-lives ${ECONOMY.fame.shootFloorHalfLifeByBand.join('/')}w` +
      `   ·   retention ${ECONOMY.business.merch.strength.retention}` +
      `   ·   mark floor ${usd(FLOOR_CENTS)} on a ${usd(PRICE_CENTS)} rung`,
  )

  if (argv.includes('--skip-bench')) return
  console.log(`\n  ${PRESETS.length} presets x ${SEEDS} seeds x ${WEEKS} weeks, policy '${POLICIES[1].id}', one walk per collaboration arm`)

  const noCollab = walk(ZERO_BANDS)
  const withCollab = walk(SHIPPED_BANDS)
  // ⚠⚠ THE NULL-ARM CHECK, PRINTED RATHER THAN ASSUMED. If these are zero the collaboration arms
  // cannot possibly differ from the control and any «it does nothing» reading below is a null ARM,
  // not a null result.
  console.log(
    `  ⚠ the arm contains its reader: ${withCollab.reduce((n, r) => n + r.signed, 0)} advertising letters signed, ` +
      `${withCollab.reduce((n, r) => n + r.shoots, 0)} shoot weeks lived across the run`,
  )

  console.log(`\n  ⭐⭐⭐ §2 THE FOUR ARMS`)
  armSummary('A  control (neither)', noCollab, (r) => r.flatWorthCents)
  armSummary('B  inertia only', noCollab, (r) => r.worthCents)
  armSummary('C  collabs only', withCollab, (r) => r.flatWorthCents)
  armSummary('D  COMBINED (ships)', withCollab, (r) => r.worthCents)
  // ⚠⚠ AND SINCE THE 31.08 REVISION #4 REACHES THE INCOME TOO, which is the whole of it. The line
  // that stood here said «the income is untouched by #4 and moves only with #5» and it is no longer
  // true: the memory is now IN the revenue. What is still true, and is the top-is-unmoved half, is
  // that the PEAK income does not move – at a running peak `retention x strength < fame`, so the
  // floor cannot bind there. Both numbers are printed so the claim is read rather than believed.
  const peakIncome = (runs: CareerRun[], read: (r: WeekRow) => number): number =>
    q(runs.map((r) => peakLive(r, read).value), 0.5) * WEEKS_PER_YEAR
  console.log(
    `    ⭐ PEAK income, floored vs pre-wave: A/B ${usd(peakIncome(noCollab, (x) => x.weeklyCents))}/yr` +
      ` vs ${usd(peakIncome(noCollab, (x) => flatWeeklyCents(x.signals)))}/yr` +
      `  ·  C/D ${usd(peakIncome(withCollab, (x) => x.weeklyCents))}/yr` +
      ` vs ${usd(peakIncome(withCollab, (x) => flatWeeklyCents(x.signals)))}/yr`,
  )
  // ...and the income the floor actually lifts, measured where it lives: the LAST live week of a
  // career at least three years past its own peak fame.
  const lateLift: number[] = []
  const lateGap: number[] = []
  for (const run of withCollab) {
    const peak = peakLive(run, (r) => r.signals.fame)
    const idx = run.rows.findIndex((r) => r.week === peak.row.week)
    if (peak.value <= 0 || idx < 0 || run.lastAliveIndex - idx < 3 * WEEKS_PER_YEAR) continue
    const row = run.rows[run.lastAliveIndex]
    const flat = flatWeeklyCents(row.signals)
    if (flat <= 0) continue
    lateLift.push(row.weeklyCents / flat)
    lateGap.push(row.signals.strength / Math.max(1e-9, row.signals.fame))
  }
  // ⚠⚠ AND THE DIAGNOSTIC THAT EXPLAINS THE ANSWER RATHER THAN LEAVING IT TO BE GUESSED AT. The
  // floor binds only where `retention x strength > fame`, i.e. where the stock is more than
  // `1/retention` times this week's attention. If the median gap below is under that threshold the
  // population simply has not declined far enough to need a floor – which is a finding about the
  // BENCH (its careers are alive and competing at week 780) and not about the feature.
  console.log(
    `    ⭐⭐ ...and 3y+ past her own peak the INCOME is ${q(lateLift, 0.5).toFixed(2)}x median / ` +
      `${Math.max(...lateLift, 0).toFixed(2)}x best what it would be without the floor ` +
      `(${lateLift.length} careers, ${lateLift.filter((x) => x > 1.0001).length} of them lifted at all)`,
  )
  console.log(
    `    ⚠ the reason, measured: strength / fame at that week runs ${q(lateGap, 0.5).toFixed(2)}x median, ` +
      `${Math.max(...lateGap, 0).toFixed(2)}x worst, and the floor needs ` +
      `${(1 / ECONOMY.business.merch.strength.retention).toFixed(2)}x before it binds at all`,
  )

  // ---- §3 THE TOP DOES NOT MOVE ---------------------------------------------------------------
  // ⚠⚠ ROUND 32 #3's OWN STANDARD, RE-RUN FOR #4: re-ask the valuation on every career-week of the
  // run with fame at the cap. Strength is pinned to the cap there by construction (it is a max of
  // faded past fames, every one of them ≤ cap, and the term at t = week is fame itself), so the two
  // arms must agree to the cent. A single cent of drift means the shelf's top has moved.
  let moved = 0
  let worst = 0
  let weeks = 0
  for (const run of withCollab) {
    for (const row of run.rows) {
      weeks++
      const atCap: BrandSignals = { ...row.signals, fame: ECONOMY.fame.cap, strength: ECONOMY.fame.cap }
      const d = Math.abs(brandGrossWorthCents(atCap, BASE_X) - flatWorthCents(atCap))
      if (d > 0) moved++
      worst = Math.max(worst, d)
    }
  }
  console.log(`\n  ⭐⭐⭐ §3 THE TOP OF THE SHELF – at fame = ${ECONOMY.fame.cap} the WORTH is unchanged for ` +
    `${weeks - moved}/${weeks} career-weeks; worst |delta| ${worst} cents`)
  // ...and the same claim at every career's own PEAK week, which is the stronger reading: a career at
  // its own maximum has strength = fame, so its peak worth cannot move either.
  let peakMoved = 0
  let peakWorst = 0
  for (const run of withCollab) {
    const p = peakLive(run, (r) => r.signals.fame)
    const d = Math.abs(p.row.worthCents - p.row.flatWorthCents)
    if (d > 0) peakMoved++
    peakWorst = Math.max(peakWorst, d)
  }
  console.log(`    ⭐ and at each career's OWN peak-fame week: unchanged for ${withCollab.length - peakMoved}/${withCollab.length} careers; ` +
    `worst |delta| ${usd(peakWorst)}`)

  // ---- §3b ⭐⭐⭐ THE RATIO, ACROSS EVERY LIVE CAREER-WEEK OF THE RUN ---------------------------
  // The revision's own acceptance: «worth / annual income must stay inside a defensible band at
  // EVERY point». With the separate worth floor removed the ratio IS `brandMultipleX`, so the band
  // is the multiple's own – bounded by construction rather than by tuning. This measures it anyway,
  // because a claim of the form «by construction» is exactly the kind that hides an arithmetic slip.
  const V = ECONOMY.business.merch.value
  let ratioLo = Infinity
  let ratioHi = 0
  let ratioN = 0
  let outside = 0
  for (const run of withCollab) {
    for (const row of run.rows) {
      const annual = brandWeeklyGrossCents(row.signals) * WEEKS_PER_YEAR
      if (annual <= 0) continue
      const ratio = row.worthCents / annual
      ratioN++
      ratioLo = Math.min(ratioLo, ratio)
      ratioHi = Math.max(ratioHi, ratio)
      if (ratio < V.unknownX - 1e-6 || ratio > V.maxX + 1e-6) outside++
    }
  }
  console.log(
    `\n  ⭐⭐⭐ §3b WORTH / A YEAR OF INCOME across ${ratioN.toLocaleString('en-US')} earning career-weeks: ` +
      `${ratioLo.toFixed(2)}x – ${ratioHi.toFixed(2)}x, ${outside} outside the multiple's band ` +
      `[${V.unknownX}x, ${V.maxX}x]`,
  )

  namedCases()

  // ---- §4 THE CASE HE NAMED: A TOP-20 CAREER WITH NO TITLES ------------------------------------
  console.log(`\n  ⭐⭐⭐ §4 A TOP-20 CAREER WITH NO TITLES – «карьера топ-20 без титулов»`)
  for (const [label, runs, read] of [
    ['A  control (neither)', noCollab, (r: WeekRow) => r.flatWorthCents],
    ['B  inertia only', noCollab, (r: WeekRow) => r.worthCents],
    ['C  collabs only', withCollab, (r: WeekRow) => r.flatWorthCents],
    ['D  COMBINED (ships)', withCollab, (r: WeekRow) => r.worthCents],
  ] as [string, CareerRun[], (r: WeekRow) => number][]) {
    // ⚠ THE POOL IS «no professional title, and the tour ranked her inside the top 20» – his own
    // sentence. `topSeasons` alone is too narrow to find one: a career good enough to END a season
    // in the top 20 has almost always won something, which is itself the finding, so the reach is
    // the best RANK she ever held.
    const pool = runs.filter((r) => r.proTitles === 0 && r.bestWtaRank !== null && r.bestWtaRank <= 20)
    if (pool.length === 0) {
      console.log(`    ${label.padEnd(22)} none in this run`)
      continue
    }
    const peaks = pool.map((r) => peakLive(r, read).value)
    const fames = pool.map((r) => peakLive(r, (x) => x.signals.fame).value)
    const above = peaks.filter((c) => c > FLOOR_CENTS).length
    console.log(
      `    ${label.padEnd(22)} ${pool.length} careers · peak fame median ${q(fames, 0.5).toFixed(1)}` +
        ` · peak worth median ${usd(q(peaks, 0.5)).padStart(10)}` +
        ` · ABOVE the ${usd(FLOOR_CENTS)} mark: ${above}/${pool.length}`,
    )
  }

  // ---- §5 A CAREER WITH NO RESULTS AND NO DEALS GAINS NOTHING ----------------------------------
  const bare = withCollab.filter((r) => peakLive(r, (x) => x.signals.fame).value === 0)
  const bareMoved = bare.filter((r) => peakLive(r, (x) => x.worthCents).value !== peakLive(r, (x) => x.flatWorthCents).value)
  console.log(
    `\n  ⭐ §5 CAREERS THE WORLD NEVER NOTICED (fame 0 throughout): ${bare.length} in the run, ` +
      `${bareMoved.length} of them moved by either feature`,
  )
}

// ---------------------------------------------------------------------------------------------
// §4b / §5b THE TWO CAREERS HE NAMED, BUILT RATHER THAN HUNTED
//
// ⚠⚠ THEY ARE CONSTRUCTED BECAUSE THE WALK DOES NOT PRODUCE THEM, and that emptiness is itself the
// finding: over the run NOT ONE career reached the top 20 without winning a professional title. A
// career good enough to be ranked there has almost always won something, so «топ-20 без титулов» is
// a shape the bench cannot sample and must be stated. Every record below is written through the same
// fields the engine writes – dated titles, dated finals, banked seasons, signed letters with named
// shoot weeks – so the fold that prices it is the shipped one and nothing here is a mock.
// ---------------------------------------------------------------------------------------------

/** a career with N banked professional seasons ended at `endRank`, `finals` lost professional
 *  finals, and NO title anywhere. */
function buildCareer(opts: {
  seasons: number
  endRank: number
  finals: number
  winRate: number
  /** how many live advertising deals, and at which band index – 0 deals = «no deals at all». */
  deals: number
  band: number
  /** shoot weeks per deal per year, the gradient's own ask at that band. */
  shootsPerYear: number
  /** the season the career is READ at – `parkAt` in the guard tests. Defaults to the wrap of the
   *  last banked season; round 30 #24's own arm parks a season later, which is what gives it the
   *  fame ≈ 7 the owner's case is quoted at. */
  parkYears?: number
  label?: string
}): WorldState {
  const world = createWorld(`r32-case-${opts.label ?? `${opts.endRank}-${opts.deals}`}`)
  const week = (opts.parkYears ?? opts.seasons) * WEEKS_PER_YEAR
  world.week = week
  world.seasonHistory = []
  const played = 40
  const wins = Math.round(played * opts.winRate)
  const losses = played - wins
  for (let i = 0; i < opts.seasons; i++) {
    world.seasonHistory.push({
      seasonIndex: i,
      endRank: opts.endRank,
      points: 0,
      wins,
      losses,
      byTrack: {
        domestic: { points: 0, wins: 0, losses: 0 },
        itf: { points: 0, wins: 0, losses: 0 },
        wta: { endRank: opts.endRank, points: 0, wins, losses },
      },
      fundsDeltaCents: 0,
      endFundsCents: 0,
    })
  }
  world.trophiesByTier.wta250 ??= { titles: [], finals: [] }
  for (let i = 0; i < opts.finals; i++) {
    world.trophiesByTier.wta250!.finals.push(week - 1 - i * 13)
  }
  world.offers = []
  const fee = ECONOMY.advertising.categories.watches.feeCentsByBand[opts.band]!
  for (let d = 0; d < opts.deals; d++) {
    const shootWeeks: number[] = []
    // spread the deal's shoots back through the career at the gradient's own cadence
    // ⚠ THE SPAN IS THE CAREER'S OWN LENGTH, not its banked seasons – the «deals but no results»
    // case has zero seasons and would otherwise get zero shoots, which is the wrong row entirely.
    for (let k = 0; k < (opts.parkYears ?? opts.seasons) * opts.shootsPerYear; k++) {
      const w = week - 1 - Math.round((k * WEEKS_PER_YEAR) / opts.shootsPerYear) - d * 3
      if (w > 0) shootWeeks.push(w)
    }
    world.offers.push({
      id: `ad-${d}`,
      kind: 'ad',
      week: 1,
      deadlineWeek: 6,
      state: 'signed',
      terms: {
        brand: `House ${d}`,
        category: 'watches',
        cashCents: fee,
        termWeeks: week,
        shootCount: opts.shootsPerYear,
        shootWeeks,
      },
    })
  }
  return world
}

function priceCase(label: string, world: WorldState): void {
  const rows: string[] = []
  for (const [arm, bands, inertia] of [
    ['A  control', ZERO_BANDS, false],
    ['B  inertia', ZERO_BANDS, true],
    ['C  collabs', SHIPPED_BANDS, false],
    ['D  BOTH', SHIPPED_BANDS, true],
  ] as [string, readonly number[], boolean][]) {
    setBands(bands)
    const r = readRow(world, world.week, inertia)
    const owned = Math.max(FLOOR_CENTS, r.worthCents)
    rows.push(
      `      ${arm.padEnd(12)}fame ${r.fame.toFixed(2).padStart(6)}  strength ${r.strength.toFixed(2).padStart(6)}` +
        `  x ${r.multipleX.toFixed(2).padStart(5)}  gross ${usd(r.worthCents).padStart(11)}` +
        `  owned row ${usd(owned).padStart(11)}  ${r.worthCents > FLOOR_CENTS ? 'ABOVE the mark' : '(at the mark)'}`,
    )
  }
  setBands(SHIPPED_BANDS)
  console.log(`\n    ── ${label}`)
  for (const r of rows) console.log(r)
}

function namedCases(): void {
  console.log(`\n  ⭐⭐⭐ §4b THE CAREERS HE NAMED, built rather than hunted (mark floor ${usd(FLOOR_CENTS)})`)
  // ⭐⭐⭐ THE CASE, VERBATIM: round 30 #24's own guard arm – four seasons ended #18, no title, no Slam
  // final, no top-10 season, nothing signed. It is the fixture the shipped test file already prices,
  // it reads fame 7.24, and round 32 #3's spec §7a recorded that it fell UNDER the mark.
  priceCase(
    'THE NAMED CASE – round 30 #24\'s own arm: 4 seasons ended #18, no title, nothing signed',
    buildCareer({ seasons: 4, endRank: 18, finals: 0, winRate: 24 / 36, deals: 0, band: 2, shootsPerYear: 0, parkYears: 5, label: 'r30-24' }),
  )
  priceCase(
    '...the same career once she signs what her band already writes her – 2 deals at band 2, 2 shoots a year',
    buildCareer({ seasons: 4, endRank: 18, finals: 0, winRate: 24 / 36, deals: 2, band: 2, shootsPerYear: 2, parkYears: 5, label: 'r30-24-signed' }),
  )
  priceCase(
    'a longer TOP-20 career with NO titles – 8 seasons ended #15, 12 professional finals lost, a full band-2 shelf',
    buildCareer({ seasons: 8, endRank: 15, finals: 12, winRate: 0.65, deals: 5, band: 2, shootsPerYear: 2 }),
  )
  priceCase(
    '...the same career with NO deals at all – the multiplier has nothing to multiply either',
    buildCareer({ seasons: 8, endRank: 15, finals: 12, winRate: 0.65, deals: 0, band: 2, shootsPerYear: 2 }),
  )
  priceCase(
    'NO results and NO deals – a career the world never noticed',
    buildCareer({ seasons: 0, endRank: 400, finals: 0, winRate: 0, deals: 0, band: 0, shootsPerYear: 0 }),
  )
  // ⚠⚠ SAID PLAINLY RATHER THAN LEFT TO BE DISCOVERED: an ADD on the floor really does make fame out
  // of shoots alone, which is what «a source of fame in its own right» means and is the change. What
  // stops it arising in play is UPSTREAM – `adBandFor` refuses a standing that is not WTA-ranked, so
  // the post never writes a letter to a career with no professional result to sign one.
  priceCase(
    'deals but NO results – five band-2 campaigns the offers system would never have written',
    buildCareer({ seasons: 0, endRank: 400, finals: 0, winRate: 0, deals: 5, band: 2, shootsPerYear: 2, parkYears: 4, label: 'no-results' }),
  )
}

// ---------------------------------------------------------------------------------------------
// §6 ⭐⭐⭐ REACH BUYS DURABILITY – two careers, the SAME delivered shoots, different bands
//
// «чем больше она была в сильных контрактах – тем больше у нее велосити». The claim is about YEARS
// LATER and not about the shoot week, so a comparison taken in the shoot week proves nothing: the
// sizes alone already differ 2.75x there and always did. What this measures is the SPREAD OPENING.
// ---------------------------------------------------------------------------------------------

function durabilityCareer(band: number, shootWeeks: number[], at: number, seasons: number, endRank: number): WorldState {
  const world = createWorld(`r32-durable-${band}`)
  world.week = at
  world.seasonHistory = []
  for (let i = 0; i < seasons; i++) {
    world.seasonHistory.push({
      seasonIndex: i,
      endRank,
      points: 0,
      wins: 26,
      losses: 14,
      byTrack: {
        domestic: { points: 0, wins: 0, losses: 0 },
        itf: { points: 0, wins: 0, losses: 0 },
        wta: { endRank, points: 0, wins: 26, losses: 14 },
      },
      fundsDeltaCents: 0,
      endFundsCents: 0,
    })
  }
  world.offers = [
    {
      id: 'ad-0',
      kind: 'ad',
      week: 1,
      deadlineWeek: 6,
      state: 'signed',
      terms: {
        brand: 'House',
        category: 'watches',
        cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[band]!,
        termWeeks: at,
        shootCount: 2,
        shootWeeks,
      },
    },
  ]
  return world
}

function durability(): void {
  console.log(`\n  ⭐⭐⭐ §6 REACH BUYS DURABILITY – the SAME delivered shoots, at the weakest band and the strongest`)
  console.log(`      half-life ladder: ${ECONOMY.fame.shootFloorHalfLifeByBand.join(' / ')} weeks  ·  sizes ${SHIPPED_BANDS.join(' / ')} points`)
  const top = ECONOMY.fame.shootFloorHalfLifeByBand.length - 1
  // ⚠⚠ TWO SHAPES, AND THE FIRST ONE IS THE CASE THE ITEM IS FOR. A career with a big tennis floor
  // swamps the collaboration term whatever band it was at – that is `fameFloorOf`'s title currency
  // and is filed rather than fixed – so a divergence measured only there would understate the effect
  // to the point of hiding it. The EARLY career is where «a lever on fame» means anything.
  for (const [label, seasons, endRank, years, perYear] of [
    ['⭐ THE EARLY CAREER the item is for – 3 seasons ended #45, four shoots a year', 3, 45, 4, 4],
    ['a settled top-20 career – 6 seasons ended #18, two shoots a year', 6, 18, 6, 2],
  ] as [string, number, number, number, number][]) {
    const last = years * WEEKS_PER_YEAR
    const shoots: number[] = []
    for (let k = 0; k < years * perYear; k++) shoots.push(last - 4 - Math.round((k * WEEKS_PER_YEAR) / perYear))
    console.log(`\n      ── ${label}`)
    console.log(
      `      ${'years after the last shoot'.padEnd(28)}${'band 0 fame'.padStart(13)}${'band 3 fame'.padStart(13)}` +
        `${'spread'.padStart(9)}${'band 0 worth'.padStart(14)}${'band 3 worth'.padStart(14)}${'spread'.padStart(9)}`,
    )
    for (const y of [0, 1, 2, 3, 5]) {
      const week = last + y * WEEKS_PER_YEAR
      const weak = durabilityCareer(0, shoots, week, seasons, endRank)
      const strong = durabilityCareer(top, shoots, week, seasons, endRank)
      // ⚠ THE SHOOT TERM ALONE for the fame columns, not the whole floor: both careers carry the same
      // banked seasons, so subtracting a shootless twin isolates what the collaborations bought.
      const bare = durabilityCareer(0, [], week, seasons, endRank)
      const base = fameFloorOf(bare, week)
      const a = fameFloorOf(weak, week) - base
      const b = fameFloorOf(strong, week) - base
      const wa = brandGrossWorthCents(brandSignalsOf(weak, week), BASE_X)
      const wb = brandGrossWorthCents(brandSignalsOf(strong, week), BASE_X)
      console.log(
        `      ${(y === 0 ? 'the shoot week itself' : `+${y} year${y > 1 ? 's' : ''}`).padEnd(28)}` +
          `${a.toFixed(4).padStart(13)}${b.toFixed(4).padStart(13)}${`${(b / Math.max(1e-12, a)).toFixed(1)}x`.padStart(9)}` +
          `${usd(wa).padStart(14)}${usd(wb).padStart(14)}${`${(wb / Math.max(1, wa)).toFixed(2)}x`.padStart(9)}`,
      )
    }
    // ⚠ THE CONTROL: on the SHIPPED-BEFORE flat 52w ladder the spread never opens at all.
    const week = last + 3 * WEEKS_PER_YEAR
    setHalfLives([52, 52, 52, 52])
    const fa = brandGrossWorthCents(brandSignalsOf(durabilityCareer(0, shoots, week, seasons, endRank), week), BASE_X)
    const fb = brandGrossWorthCents(brandSignalsOf(durabilityCareer(top, shoots, week, seasons, endRank), week), BASE_X)
    setHalfLives(SHIPPED_HALFLIVES)
    console.log(
      `      ⚠ the control – the flat 52w ladder at +3 years: ${usd(fa)} vs ${usd(fb)} = ` +
        `${(fb / Math.max(1, fa)).toFixed(2)}x, against ${(brandGrossWorthCents(brandSignalsOf(durabilityCareer(top, shoots, week, seasons, endRank), week), BASE_X) / Math.max(1, brandGrossWorthCents(brandSignalsOf(durabilityCareer(0, shoots, week, seasons, endRank), week), BASE_X))).toFixed(2)}x on the shipped ladder`,
    )
  }
}

if (SAVES.length > 0) for (const path of SAVES) await projectSave(path)
if (SAVES.length > 0 && argv.includes('--sweep')) for (const path of SAVES) await sweepSave(path)
durability()
main()
