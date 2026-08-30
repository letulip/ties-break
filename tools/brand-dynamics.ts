/**
 * THE BRAND OVER A CAREER – round 30 #23 and #24, and it is the DYNAMICS he asked for.
 *
 * THE OWNER, 30.08: «Давай математику и динамику оценим и станет понятно всё. У нас есть её
 * профессионализм, сколько играет, сколько выигрывает, как глубоко проходит и вся остальная
 * информация. Даже то, сколько зрителей на трибуны приходит. Всё это можно использовать в расчете
 * так или иначе.»
 *
 * ⚠⚠ SO THIS FILE REPORTS CURVES AND NOT A PEAK. `tools/merch-fame-vs-rank.ts` answers round 30 #13
 * («did the rank improve while the income fell») and keeps that job; this one walks the same career
 * loop and prints, for four ARCHETYPES, what the brand earned and what it was worth season by
 * season – a top-10 reign, a top-30 journeywoman, a career cut short by injury, and a late bloomer.
 * A single peak number cannot show a fall, and the fall is half of what an asset is.
 *
 * ⚠ THE ONLY FALL IN FRAME IS THE IN-CAREER ONE, which is the owner's own correction to the case
 * that was put to him («но это уже будет после завершения игры, по сути нас это не очень интересует,
 * разве нет?»). Federer's retired On stake losing half its value is out of frame – the game ends
 * with the career. What is in frame is the slump the player sits through: an injury year, a season
 * with no title, fame decaying while she is not winning. §4 counts those and only those.
 *
 * ⚠⚠ CROWD/ATTENDANCE IS A `[GAP]` AND THIS FILE DOES NOT PROXY IT. He named it. The engine DOES
 * model a crowd – `engine/season/preview.ts` `eventCrowd`, a corridor per TIER drawn off the event's
 * own `seed:crowd:` sub-stream – but it is decorative by construction and read by nothing, it is a
 * property of the TOURNAMENT and not of her, and it is never persisted: no attendance total, no
 * per-match figure, nothing attributable to a player exists anywhere in a save. Feeding it into the
 * brand would be feeding the tier ladder in through a second door under a different name. Reported
 * as absent rather than substituted – see the spec's §5.
 *
 * ⚠ MEASUREMENT ONLY. It imports the career loop and the preset ladder from tools/econ-bench.ts, so
 * world evolution is defined in one place, and it writes to no engine constant except through the
 * declared counterfactual arms below, which are CLI-only and never persisted. Every engine function
 * it reads is a pure fold (`world/brand.ts`, `world/fame.ts`), so nothing here can move the frozen
 * MAIN capture (41550 / e6b0c709).
 *
 * Run:  npx vite-node tools/brand-dynamics.ts
 *       npx vite-node tools/brand-dynamics.ts -- --weeks 780 --seeds 8
 *       npx vite-node tools/brand-dynamics.ts -- --bands0   (round 30 #24's OLD one-rung ladder)
 *       npx vite-node tools/brand-dynamics.ts -- --json out.json
 */
import { writeFileSync } from 'node:fs'
import {
  brandMultipleX,
  brandSignalsOf,
  brandWeeklyGrossCents,
  shopItem,
  type BrandSignals,
  type WorldState,
} from '../src/engine/world'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, type Preset, type Policy } from './econ-bench'

const DEFAULT_WEEKS = 780
const DEFAULT_SEEDS = 8

const MERCH = shopItem('merch-brand')!
const PRICE_CENTS = MERCH.entryCents
/** the rung's own base multiple – read, never typed, so a retune moves this reading with it. */
const BASE_X = MERCH.earningsMultipleX!

/** ⭐ ROUND 30 #24's COUNTERFACTUAL ARM, POINTING BACKWARDS. The two lower rungs SHIPPED in this
 *  wave, so the arm that has to be reachable is the OLD one – a single top-10 band – and it is CLI
 *  only, never written back. The arm is printed in the header so no output can be misfiled
 *  (`injury-audit.ts`'s own rule, and `merch-fame-vs-rank.ts --seasonBands` pointing the other way). */
const BANDS0 = process.argv.includes('--bands0')
if (BANDS0) {
  ;(ECONOMY.fame as { seasonEndBands: readonly { maxEndRank: number; add: number }[] }).seasonEndBands = [
    { maxEndRank: 10, add: 10 },
  ]
}

/** ⭐⭐ THE PRE-30.08 MODEL, RE-DERIVED HERE ON PURPOSE. Both arms read the SAME fame series off the
 *  SAME walk, so the before/after is exact and needs no second run and no second worktree – the
 *  arm-divergence hazard CLAUDE.md records («prove the arm contains both the change and its reader»)
 *  cannot arise when there is one arm and two readings of it.
 *
 *  ⚠ IT IS A COPY OF A FORMULA THAT NO LONGER EXISTS IN THE ENGINE, which is the one case where a
 *  copy cannot drift: there is nothing left for it to drift FROM. The old shape was
 *  `weekly = fame x perFamePointCents` and `worth = weekly x 52 x 16`, both linear, one dial. */
const OLD_MULTIPLE_X = 16
const oldWeeklyCents = (fame: number): number => Math.round(fame * ECONOMY.business.merch.perFamePointCents)
const oldWorthCents = (fame: number): number => Math.round(oldWeeklyCents(fame) * WEEKS_PER_YEAR * OLD_MULTIPLE_X)

interface WeekRow {
  week: number
  alive: boolean
  wtaRank: number | null
  fame: number
  signals: BrandSignals
  multipleX: number
  /** what a WHOLE brand takes in this week, cents – the engine's own `brandWeeklyGrossCents`. */
  weeklyCents: number
  /** ...and what a whole brand is worth, cents, BEFORE the owned row's mark floor. */
  worthCents: number
}

interface CareerRun {
  label: string
  seed: string
  rows: WeekRow[]
  bestWtaRank: number | null
  /** the first week the wallet could carry twice the price – the shelf's own affordability rule. */
  affordWeek: number | null
  affordRow: WeekRow | null
  endedWeek: number | null
  weeksLostToInjury: number
  proSeasons: number
  topTenSeasons: number
  /** the index of the LAST live row, so every peak below is read inside the career. */
  lastAliveIndex: number
}

function runCareer(preset: Preset, policy: Policy, index: number, weeks: number): CareerRun {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const rows: WeekRow[] = []
  let bestWtaRank: number | null = null
  let affordWeek: number | null = null
  let affordRow: WeekRow | null = null
  let endedWeek: number | null = null
  let lastAliveIndex = 0

  for (let i = 0; i < weeks; i++) {
    const week = world.week
    stepCareerWeek(world, rng, policy)
    // ⚠ READ AFTER THE TICK AND KEYED ON `week` – `stepCareerWeek` advances the clock, so
    // `world.week` is already the NEXT week here. The trap `sponsor-ladder-reach.ts` and
    // `merch-fame-vs-rank.ts` both write up at their own folds.
    const signals = brandSignalsOf(world, week)
    const standing = sponsorStandingOf(world)
    const alive = world.ending === null
    if (!alive && endedWeek === null) endedWeek = week
    const row: WeekRow = {
      week,
      alive,
      wtaRank: standing.wtaRanked ? standing.wtaRank : null,
      fame: signals.fame,
      signals,
      multipleX: brandMultipleX(signals, BASE_X),
      weeklyCents: brandWeeklyGrossCents(signals),
      worthCents: 0,
    }
    row.worthCents = Math.round(row.weeklyCents * WEEKS_PER_YEAR * row.multipleX)
    if (alive) lastAliveIndex = rows.length
    if (affordWeek === null && world.fundsCents >= PRICE_CENTS * 2) {
      affordWeek = week
      affordRow = row
    }
    if (standing.wtaRanked && (bestWtaRank === null || standing.wtaRank < bestWtaRank)) {
      bestWtaRank = standing.wtaRank
    }
    rows.push(row)
  }
  let topTenSeasons = 0
  for (const s of world.seasonHistory ?? []) {
    const r = s.byTrack?.wta?.endRank
    if (r != null && r <= 10) topTenSeasons++
  }
  return {
    label: preset.label,
    seed,
    rows,
    bestWtaRank,
    affordWeek,
    affordRow,
    endedWeek,
    weeksLostToInjury: world.careerTotals.weeksLostToInjury,
    proSeasons: rows[rows.length - 1].signals.proSeasons,
    topTenSeasons,
    lastAliveIndex,
  }
}

const q = (xs: number[], p: number): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(p * s.length))]
}
const usd = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const musd = (cents: number): string => `$${(cents / 100 / 1_000_000).toFixed(2)}M`
const yr = (weeklyCents: number): string => usd(weeklyCents * WEEKS_PER_YEAR)

/** the peak of a series, restricted to the weeks the career was LIVE. */
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

// ⭐⭐⭐ THE FOUR ARCHETYPES. Classified from what the careers DID, never constructed by hand: a
// synthetic world would prove the arithmetic and say nothing about the game.
type Archetype = 'reign' | 'journeywoman' | 'cut short' | 'late bloomer'

function classify(run: CareerRun): Archetype | null {
  if (run.bestWtaRank === null) return null
  // A career cut short: it ENDED with seasons left on the horizon and a body that paid for it.
  // Checked FIRST, because a reign that ends at 26 is the injury story and not the reign story.
  if (run.endedWeek !== null && run.endedWeek < 620 && run.weeksLostToInjury >= 20) return 'cut short'
  if (run.topTenSeasons >= 2) return 'reign'
  if (run.bestWtaRank <= 60 && run.proSeasons >= 6) {
    // A late bloomer's first ranked season lands in the BACK half of the career.
    const firstRanked = run.rows.find((r) => r.wtaRank !== null)
    if (firstRanked && firstRanked.week >= 8 * WEEKS_PER_YEAR) return 'late bloomer'
    return 'journeywoman'
  }
  return null
}

/** the season-by-season curve, printed. The row a player would see once a year. */
function printCurve(run: CareerRun): void {
  console.log(
    `      season  wta   fame   seasons/top20/finals/win%   xN     income/yr      worth` +
      `        (old model: income/yr, worth)`,
  )
  for (let s = 1; s * WEEKS_PER_YEAR - 1 < run.rows.length; s++) {
    const r = run.rows[s * WEEKS_PER_YEAR - 1]
    if (!r.alive && run.endedWeek !== null && r.week > run.endedWeek + WEEKS_PER_YEAR) break
    const g = r.signals
    console.log(
      `      ${String(s).padStart(6)}  ${String(r.wtaRank ?? '–').padStart(4)}  ` +
        `${r.fame.toFixed(1).padStart(5)}   ` +
        `${String(g.proSeasons).padStart(2)}/${String(g.topSeasons).padStart(2)}/${String(g.finalsLost).padStart(2)}/` +
        `${(g.winRate * 100).toFixed(0).padStart(3)}%   ` +
        `${r.multipleX.toFixed(1).padStart(5)}  ${yr(r.weeklyCents).padStart(12)}  ` +
        `${musd(r.worthCents).padStart(9)}   ${yr(oldWeeklyCents(r.fame)).padStart(10)}  ${musd(oldWorthCents(r.fame)).padStart(8)}` +
        `${r.alive ? '' : '   (career over)'}`,
    )
  }
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const num = (name: string, fallback: number): number => {
    const i = argv.indexOf(name)
    return i >= 0 ? Number(argv[i + 1]) : fallback
  }
  const weeks = num('--weeks', DEFAULT_WEEKS)
  const seeds = num('--seeds', DEFAULT_SEEDS)
  const policy = POLICIES[1]
  const V = ECONOMY.business.merch.value

  console.log(`THE BRAND OVER A CAREER – round 30 #23 (income + worth) and #24 (the fame floor)`)
  console.log(`  ${PRESETS.length} presets x ${seeds} seeds x ${weeks} weeks, policy '${policy.id}'`)
  console.log(
    `  income: ${usd(ECONOMY.business.merch.perFamePointCents)}/fame point x fame / ${ECONOMY.business.merch.famePivot}` +
      `  ·  multiple: base ${BASE_X} + career, capped ${V.maxX}  ·  price ${usd(PRICE_CENTS)}`,
  )
  console.log(
    `  season-end fame bands: ${ECONOMY.fame.seasonEndBands.map((b) => `top${b.maxEndRank}=+${b.add}`).join(' ')}` +
      `${BANDS0 ? '   <- ROUND 30 #24 ARM POINTING BACK AT THE OLD LADDER, not shipped' : '   (shipped)'}`,
  )

  const runs: CareerRun[] = []
  for (const preset of PRESETS) {
    for (let i = 0; i < seeds; i++) runs.push(runCareer(preset, policy, i, weeks))
  }

  // ---- §1 THE DISTRIBUTION, AND THE BIMODALITY RULING STANDS -------------------------------
  const famous = runs.filter((r) => peakLive(r, (x) => x.fame).value >= 1)
  const peakFames = famous.map((r) => peakLive(r, (x) => x.fame).value)
  const peakWorths = famous.map((r) => peakLive(r, (x) => x.worthCents).value)
  const peakIncomes = famous.map((r) => peakLive(r, (x) => x.weeklyCents).value)
  const oldPeakWorths = famous.map((r) => oldWorthCents(peakLive(r, (x) => x.fame).value))
  console.log(`\n  ⭐ §1 THE DISTRIBUTION – ${famous.length}/${runs.length} careers ever reached fame 1`)
  console.log(`    peak fame          median ${q(peakFames, 0.5).toFixed(1)}   p90 ${q(peakFames, 0.9).toFixed(1)}   best ${Math.max(...peakFames).toFixed(1)}`)
  console.log(`    peak brand income  median ${yr(q(peakIncomes, 0.5))}/yr   p90 ${yr(q(peakIncomes, 0.9))}/yr   best ${yr(Math.max(...peakIncomes))}/yr`)
  console.log(`    peak brand worth   median ${musd(q(peakWorths, 0.5))}   p90 ${musd(q(peakWorths, 0.9))}   best ${musd(Math.max(...peakWorths))}`)
  console.log(`    ...under the OLD model  median ${musd(q(oldPeakWorths, 0.5))}   p90 ${musd(q(oldPeakWorths, 0.9))}   best ${musd(Math.max(...oldPeakWorths))}`)
  // ⚠ AND WHAT A CAREER THAT IS NOT ONE OF THOSE SEES, because P5's bimodality ruling stands and the
  // median career is owed nothing: the top shelf is for exceptional careers.
  const nobody = runs.length - famous.length
  console.log(`    ⚠ ${nobody}/${runs.length} careers never reach fame 1 at all – their brand is worth the mark and nothing else`)
  const multAtPeak = famous.map((r) => peakLive(r, (x) => x.worthCents).row.multipleX)
  console.log(`    the MULTIPLE at that peak: p10 ${q(multAtPeak, 0.1).toFixed(1)}  median ${q(multAtPeak, 0.5).toFixed(1)}  p90 ${q(multAtPeak, 0.9).toFixed(1)}  max ${Math.max(...multAtPeak).toFixed(1)}`)

  // ---- §2 THE DAY-ONE CRITERION (round 30 #9) ----------------------------------------------
  const afforders = runs.filter((r) => r.affordRow !== null)
  const dayOne = afforders.map((r) => r.affordRow!.worthCents).sort((a, b) => a - b)
  const dayOneOld = afforders.map((r) => oldWorthCents(r.affordRow!.fame)).sort((a, b) => a - b)
  const dayOneMult = afforders.map((r) => r.affordRow!.multipleX)
  const dayOneFame = afforders.map((r) => r.affordRow!.fame)
  console.log(`\n  ⭐ §2 THE DAY-ONE CRITERION – «fair on the day they can afford it» (round 30 #9)`)
  console.log(`    ${afforders.length}/${runs.length} careers could ever carry it; median first week ${q(afforders.map((r) => r.affordWeek!), 0.5)}`)
  console.log(`    fame that week      p10 ${q(dayOneFame, 0.1).toFixed(1)}  median ${q(dayOneFame, 0.5).toFixed(1)}  p90 ${q(dayOneFame, 0.9).toFixed(1)}`)
  console.log(`    multiple that week  p10 ${q(dayOneMult, 0.1).toFixed(1)}  median ${q(dayOneMult, 0.5).toFixed(1)}  p90 ${q(dayOneMult, 0.9).toFixed(1)}`)
  console.log(`    worth that week     p10 ${usd(q(dayOne, 0.1))}  median ${usd(q(dayOne, 0.5))}  p90 ${usd(q(dayOne, 0.9))}   (price ${usd(PRICE_CENTS)})`)
  console.log(`    ...under the OLD model              median ${usd(q(dayOneOld, 0.5))}`)
  const square = dayOne.filter((c) => c >= PRICE_CENTS).length
  console.log(`    at or above what it cost on day one: ${square}/${dayOne.length}`)

  // ---- §3 THE FOUR ARCHETYPES, WITH THEIR CURVES -------------------------------------------
  console.log(`\n  ⭐⭐⭐ §3 THE DYNAMICS – four archetypes, season by season`)
  const byType = new Map<Archetype, CareerRun[]>()
  for (const run of runs) {
    const t = classify(run)
    if (!t) continue
    if (!byType.has(t)) byType.set(t, [])
    byType.get(t)!.push(run)
  }
  for (const type of ['reign', 'journeywoman', 'cut short', 'late bloomer'] as Archetype[]) {
    const pool = byType.get(type) ?? []
    console.log(`\n    ── ${type.toUpperCase()} – ${pool.length} careers in the run`)
    if (pool.length === 0) {
      console.log(`      none matched in this run`)
      continue
    }
    // the MEDIAN member by peak worth, so the printed curve is representative and not the best one
    const sorted = [...pool].sort((a, b) => peakLive(a, (x) => x.worthCents).value - peakLive(b, (x) => x.worthCents).value)
    const rep = sorted[Math.floor(sorted.length / 2)]
    const peak = peakLive(rep, (x) => x.worthCents)
    console.log(
      `      representative: ${rep.seed} (${rep.label.trim()}), best WTA #${rep.bestWtaRank}, ` +
        `${rep.proSeasons} pro seasons, ${rep.weeksLostToInjury}w lost to injury` +
        `${rep.endedWeek !== null ? `, career ended w${rep.endedWeek}` : ''}`,
    )
    console.log(`      peak worth ${musd(peak.value)} at week ${peak.row.week} (fame ${peak.row.fame.toFixed(1)}, multiple ${peak.row.multipleX.toFixed(1)})`)
    printCurve(rep)
    const groupPeaks = pool.map((r) => peakLive(r, (x) => x.worthCents).value)
    const groupInc = pool.map((r) => peakLive(r, (x) => x.weeklyCents).value)
    console.log(
      `      the GROUP: peak worth median ${musd(q(groupPeaks, 0.5))} (p10 ${musd(q(groupPeaks, 0.1))} – p90 ${musd(q(groupPeaks, 0.9))})` +
        `, peak income median ${yr(q(groupInc, 0.5))}/yr`,
    )
  }

  // ---- §4 THE IN-CAREER FALL ---------------------------------------------------------------
  // ⚠ LIVE WEEKS ONLY, at both ends. The owner ruled the post-career decline out of frame, so a
  // window that straddles the end of a career would be counting exactly the fall he does not care
  // about – and it is the biggest one, so leaving it in would flatter this section badly.
  console.log(`\n  ⭐⭐ §4 IT FALLS *DURING* HER CAREER – 52-week windows with the career live at both ends`)
  for (const [label, read] of [
    ['worth ', (r: WeekRow) => r.worthCents],
    ['income', (r: WeekRow) => r.weeklyCents],
  ] as [string, (r: WeekRow) => number][]) {
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
    console.log(
      `    ${label}: fell in ${down}/${n} windows  ${((down / Math.max(1, n)) * 100).toFixed(1)}%` +
        (drops.length > 0 ? `, median ${q(drops, 0.5).toFixed(1)}%, worst ${q(drops, 0).toFixed(1)}%` : ''),
    )
  }
  // ...and the same question asked of the OLD model, so «it falls more now» is a measurement.
  {
    let n = 0
    let down = 0
    const drops: number[] = []
    for (const run of runs) {
      for (let i = WEEKS_PER_YEAR; i <= run.lastAliveIndex; i++) {
        const a = oldWorthCents(run.rows[i - WEEKS_PER_YEAR].fame)
        const b = oldWorthCents(run.rows[i].fame)
        if (a <= 0 || !run.rows[i - WEEKS_PER_YEAR].alive) continue
        n++
        if (b < a) {
          down++
          drops.push((b / a - 1) * 100)
        }
      }
    }
    console.log(
      `    worth , OLD model: fell in ${down}/${n} windows  ${((down / Math.max(1, n)) * 100).toFixed(1)}%` +
        (drops.length > 0 ? `, median ${q(drops, 0.5).toFixed(1)}%, worst ${q(drops, 0).toFixed(1)}%` : ''),
    )
  }

  // ---- §5 AGAINST THE RESEARCH -------------------------------------------------------------
  // ⚠ THREE UNITS AND THEY ARE NOT AVERAGED (research §7d). Income is compared with Osaka's income
  // band; worth is compared with the two VALUATIONS.
  console.log(`\n  ⭐ §5 AGAINST docs/research/player-brands-and-what-they-are-worth.md`)
  console.log(`    income band for a top full own-brand (§7d, derived): $500,000 – $2,000,000 /yr NET`)
  console.log(`      our best peak income  ${yr(Math.max(...peakIncomes))}/yr      median peak ${yr(q(peakIncomes, 0.5))}/yr`)
  console.log(`    Osaka's businesses, stated as income (§7c): $5–10M/yr – an UPPER BOUND, it is a portfolio`)
  console.log(`    Sugarpova's peak VALUATION $20M · the RF mark ~$27M (§7c)`)
  console.log(`      our best peak worth   ${musd(Math.max(...peakWorths))}      median peak ${musd(q(peakWorths, 0.5))}`)
  console.log(`      the $12M academy, for scale: the shelf's most expensive rung`)

  const jsonAt = argv.indexOf('--json')
  if (jsonAt >= 0) {
    writeFileSync(
      argv[jsonAt + 1],
      JSON.stringify(
        {
          weeks,
          seeds,
          bands0: BANDS0,
          baseX: BASE_X,
          famePivot: ECONOMY.business.merch.famePivot,
          careers: runs.map((r) => ({
            seed: r.seed,
            label: r.label,
            archetype: classify(r),
            bestWtaRank: r.bestWtaRank,
            proSeasons: r.proSeasons,
            weeksLostToInjury: r.weeksLostToInjury,
            endedWeek: r.endedWeek,
            peakFame: peakLive(r, (x) => x.fame).value,
            peakWorthCents: peakLive(r, (x) => x.worthCents).value,
            peakWeeklyCents: peakLive(r, (x) => x.weeklyCents).value,
            dayOneWorthCents: r.affordRow?.worthCents ?? null,
            dayOneMultipleX: r.affordRow?.multipleX ?? null,
          })),
        },
        null,
        2,
      ),
    )
    console.log(`\n  wrote ${argv[jsonAt + 1]}`)
  }
}

main()
