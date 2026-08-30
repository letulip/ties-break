/**
 * MERCH INCOME AGAINST RANK – round 30 #13, and it is a MEASUREMENT, not a fix.
 *
 * The owner, playing: «Почему-то merch brand приносил 600+, а через несколько месяцев стал 500+,
 * хотя позиция в таблице уже 15».
 *
 * TWO THINGS COULD BE TRUE AND THEY NEED DIFFERENT ANSWERS.
 *
 *   (a) THE MECHANIC WORKING. Merch follows FAME and fame DECAYS on a 104-week half-life
 *       (`ECONOMY.fame.halfLifeWeeks`) – deliberately, because a stock that only rises is a trophy
 *       cabinet and not a lever (world/fame.ts' own header). Rank is a 52-week rolling window over
 *       POINTS; fame is a decaying fold over TITLES, lost Slam finals, top-10 seasons and lived
 *       shoot weeks. A season of steady quarter-finals moves the first and feeds the second
 *       nothing, so a rising rank beside a falling fame stock is not a contradiction, it is the two
 *       instruments measuring two different things – which is exactly what P7 built them to do.
 *
 *   (b) THE MECHANIC MISCONFIGURED. If the decay routinely outruns what PLAY can add, then a player
 *       who is climbing watches his business shrink for as long as he keeps climbing – the opposite
 *       of what «мерч, растущий от частоты и обилия рекламных контрактов, съемок, выступлений,
 *       титулов» asks for. The tell is not that income ever falls; it is whether the fall is the
 *       COMMON case at a rank that is improving, and whether the window that produced it contained
 *       any fame-earning event at all.
 *
 * SO THIS FILE COUNTS WINDOWS, NOT CAREERS. For every career week that has a professional standing
 * at both ends of a window, it asks two independent yes/no questions – did the RANK improve, did the
 * INCOME fall – and reports the 2x2. The cell (a) and (b) disagree about is «rank improved AND
 * income fell»: (a) predicts it is a minority of climbing windows and that the ones it does produce
 * are windows with NO fame-earning event in them; (b) predicts it is the majority, event or no
 * event.
 *
 * ⚠⚠ INCOME IS NOT SAMPLED, IT IS DERIVED, AND THAT IS WHY THE DEFAULT ARM BUYS NOTHING.
 * `merchWeeklyIncomeCents` is `round(fameAt(world) x ECONOMY.business.merch.perFamePointCents)` –
 * a LINEAR function of fame with no other input – so the fame series IS the income series to the
 * cent, and «rank improved, income fell» and «rank improved, fame fell» are the same event. Buying
 * the brand would cost the career $250,000 and move every downstream week (the arm-divergence note
 * `tools/sponsor-ladder-reach.ts` carries about `--buy-business`) to learn nothing the fame series
 * does not already say. `--buy` runs the owning arm anyway, so the claim above is checkable rather
 * than asserted: it reports the income series read off the TILL, and the two must agree.
 *
 * ⚠ MEASUREMENT ONLY. It imports the career loop and the preset ladder from tools/econ-bench.ts, so
 * the world evolution is defined in one place, and it writes to no engine constant. `fameAt` draws
 * nothing on any stream (world/fame.ts is a pure fold), so nothing here can move the frozen capture.
 *
 * Run:  npx vite-node tools/merch-fame-vs-rank.ts
 *       npx vite-node tools/merch-fame-vs-rank.ts -- --weeks 780 --seeds 6 --json out.json
 *       npx vite-node tools/merch-fame-vs-rank.ts -- --buy        (the owning arm, income off the till)
 */
import { writeFileSync } from 'node:fs'
import {
  brandMultipleX,
  brandSignalsOf,
  brandWeeklyGrossCents,
  buyAsset,
  fameAt,
  merchWeeklyIncomeCents,
  type WorldState,
} from '../src/engine/world'
import { completedShootWeeks } from '../src/engine/world/fame'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, type Preset, type Policy } from './econ-bench'

/** Fifteen seasons – the horizon `tools/sponsor-ladder-reach.ts` settled on, and the length of the
 *  owner's own save. A shorter one cannot see a career reach the ranks he is asking about. */
const DEFAULT_WEEKS = 780
const DEFAULT_SEEDS = 6

/** The merch brand's price, read off the catalogue rather than typed – round 30 #9 sizes its VALUE
 *  against exactly this number, so a retune of the price has to move this reading with it. */
const MERCH_PRICE_CENTS = ECONOMY.shop.catalogue.find((r) => r.id === 'merch-brand')!.entryCents

/** ⭐⭐⭐ ROUND 30 #9 – THE CANDIDATE *BASE* MULTIPLE UNDER TEST. What the brand is worth, as a
 *  multiple of what it takes in over a year, BEFORE the career earns more on top of it. The
 *  research's band is wide and thin (Beckham ~10.9x profit, the Nadal academy ~31x – see
 *  docs/research/player-brands-and-what-they-are-worth.md §5.4), so the number is a CHOICE and the
 *  measurement is what chooses it.
 *
 *  ⚠⚠ ROUND 30 #23 SPLIT THIS IN TWO AND THIS FILE READS BOTH. The default is the CATALOGUE's own
 *  base rather than a typed 16 – a retune of the rung has to move this reading with it – and the
 *  worth below goes through `brandMultipleX`, so what this tool prints is what the shelf prices.
 *  `--multiple` still overrides the base for a sweep. */
const CANDIDATE_MULTIPLE = Number(process.argv.includes('--multiple')
  ? process.argv[process.argv.indexOf('--multiple') + 1]
  : (ECONOMY.shop.catalogue.find((r) => r.id === 'merch-brand') as { earningsMultipleX: number }).earningsMultipleX)

/** ⭐⭐⭐ ROUND 30 #24 – THE END-RANK LADDER, AS A COUNTERFACTUAL ARM. CLI ONLY, NEVER WRITTEN BACK.
 *
 *  THE OWNER, three times: «она же топ-20 в мире». The fame floor used to count titles, lost Slam
 *  finals and seasons ended in the TOP TEN and nothing else, so a career built on quarter- and
 *  semi-finals had a floor of ZERO and its brand was worth nothing however high it ranked. ⚠ THERE
 *  IS NO DEEP-RUN LEDGER TO READ AT THE TOURNAMENT LEVEL – `TierTrophies` stores `titles` and
 *  `finals` and nothing below a final – so the measurable answer is the END-RANK ladder
 *  `ECONOMY.fame.seasonEndBands` expresses: a season finished at #18 IS her deep runs, summed and
 *  sorted by the tour.
 *
 *  ⚠⚠ THE TOP-20 AND TOP-50 RUNGS SHIPPED ON 30.08, so this arm now REPLACES the ladder rather than
 *  appending to it – appending to a three-rung ladder would have measured the shipped state plus
 *  duplicates and reported it as a counterfactual. `--seasonBands 10:10` restores the old one-rung
 *  floor for a run; `--seasonBands 20:4,50:1.5` re-states today's. No engine value is persisted from
 *  here – `injury-audit.ts`'s own counterfactual-arm idiom, and the same rule: the arm is printed in
 *  the header so no output can be misfiled. */
const BANDS_ARG = process.argv.includes('--seasonBands')
  ? process.argv[process.argv.indexOf('--seasonBands') + 1]
  : ''
if (BANDS_ARG) {
  const swapped = BANDS_ARG.split(',').map((pair) => {
    const [rank, add] = pair.split(':').map(Number)
    return { maxEndRank: rank, add }
  })
  ;(ECONOMY.fame as { seasonEndBands: readonly { maxEndRank: number; add: number }[] }).seasonEndBands =
    swapped.sort((a, b) => a.maxEndRank - b.maxEndRank)
}

/** The windows the question is asked over, in weeks. 13 is «несколько месяцев» – his own span –
 *  and the other two bracket it so a finding cannot be an artefact of one window length. */
const WINDOWS = [13, 26, 52] as const

/** One career week, as this probe reads it. */
interface WeekRow {
  week: number
  /** her live professional standing, or null on a week she holds no WTA points at all. */
  wtaRank: number | null
  /** the fame stock, fractional – `fameAt`, unrounded (the house rule rounds the display). */
  fame: number
  /** what the brand would pay THIS week, in cents. Derived from fame in the default arm; read off
   *  the till in `--buy`. */
  incomeCents: number
  /** fame-earning events dated to THIS week – titles at a professional tier, a lost Slam final, a
   *  top-10 season wrap, a shoot week lived. The number the (a)/(b) fork turns on. */
  fameEvents: number
  /** ⭐⭐⭐ ROUND 30 #23 – what a whole brand would be WORTH this week, cents. Recorded HERE, on the
   *  week, because the worth is no longer a function of fame alone: `brandMultipleX` reads the
   *  career, so it can only be asked while the world is in front of you. The old shape asked it
   *  afterwards off a fame quantile, which stopped being answerable the day the multiple was
   *  earned – and «the worth of the median fame» was never the same statistic as «the median
   *  worth» anyway. */
  worthCents: number
}

/** How many fame-earning events the career's own records date to `week` – the same four sources
 *  `world/fame.ts` folds, counted rather than weighted. ⚠ COUNTED FROM THE RECORDS AND NOT FROM A
 *  FAME DELTA: fame falls every week by construction, so «did fame rise» would answer a different
 *  question (it would score a small title inside a big decay as «no event»). */
function fameEventsAt(world: WorldState, week: number): number {
  let n = 0
  for (const tier of Object.keys(ECONOMY.fame.titleFloor) as TierId[]) {
    const shelf = world.trophiesByTier?.[tier]
    if (!shelf) continue
    n += shelf.titles.filter((w) => w === week).length
  }
  n += (world.trophiesByTier?.slam?.finals ?? []).filter((w) => w === week).length
  for (const row of world.seasonHistory ?? []) {
    const endRank = row.byTrack?.wta?.endRank
    if (endRank == null || endRank > 10) continue
    if ((row.seasonIndex + 1) * WEEKS_PER_YEAR === week) n++
  }
  n += completedShootWeeks(world, week + 1).filter((w) => w === week).length
  return n
}

interface CareerRun {
  label: string
  seed: string
  rows: WeekRow[]
  /** the week the merch brand was bought in the `--buy` arm, or null. */
  merchBoughtWeek: number | null
  bestWtaRank: number | null
  peakFame: number
  peakFameWeek: number
  /** ⭐⭐ ROUND 30 #9 – THE FIRST WEEK THE WALLET COULD CARRY THE BRAND, on the shelf's own
   *  affordability rule (twice the price – `sponsor-ladder-reach.ts`'s business arm keeps half the
   *  wallet), and the fame the family held that week.
   *
   *  ⚠ IT IS AN UPPER BOUND ON THE FAME AND THIS ARM CANNOT DO BETTER, which is worth saying rather
   *  than hiding: the default arm buys NOTHING, so its wallet is richer than a shopper's and it
   *  crosses the line a little earlier – earlier means LESS fame, so the reading is conservative in
   *  the direction that matters (it sizes the multiple against a poorer brand). */
  affordWeek: number | null
  fameAtAfford: number
  /** ⭐ ROUND 30 #23 – and what it would have been WORTH that week, cents. */
  worthAtAfford: number
  /** ...and at the peak of her fame, cents. */
  peakWorthCents: number
}

function runCareer(preset: Preset, policy: Policy, index: number, weeks: number, buy: boolean): CareerRun {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const rows: WeekRow[] = []
  let merchBoughtWeek: number | null = null
  let bestWtaRank: number | null = null
  let peakFame = 0
  let peakFameWeek = 0
  let affordWeek: number | null = null
  let fameAtAfford = 0
  let worthAtAfford = 0
  let peakWorthCents = 0

  for (let i = 0; i < weeks; i++) {
    const week = world.week
    stepCareerWeek(world, rng, policy)
    // ⚠ READ AFTER THE TICK AND KEYED ON `week` – `stepCareerWeek` advances the clock, so
    // `world.week` is already the NEXT week here. The same trap `sponsor-ladder-reach.ts` writes up
    // at its own event fold.
    if (buy && merchBoughtWeek === null && world.fundsCents >= 250_000_00 * 2) {
      try {
        buyAsset(world, 'merch-brand')
        merchBoughtWeek = week
      } catch {
        // an ended career refuses; the engine said so, which is the point of asking it
      }
    }
    const standing = sponsorStandingOf(world)
    const fame = fameAt(world, week)
    if (affordWeek === null && world.fundsCents >= MERCH_PRICE_CENTS * 2) {
      affordWeek = week
      fameAtAfford = fame
      worthAtAfford = Math.round(
        brandWeeklyGrossCents(brandSignalsOf(world, week)) *
          WEEKS_PER_YEAR *
          brandMultipleX(brandSignalsOf(world, week), CANDIDATE_MULTIPLE),
      )
    }
    if (fame > peakFame) {
      peakFame = fame
      peakFameWeek = week
      peakWorthCents = Math.round(
        brandWeeklyGrossCents(brandSignalsOf(world, week)) *
          WEEKS_PER_YEAR *
          brandMultipleX(brandSignalsOf(world, week), CANDIDATE_MULTIPLE),
      )
    }
    if (standing.wtaRanked && (bestWtaRank === null || standing.wtaRank < bestWtaRank)) {
      bestWtaRank = standing.wtaRank
    }
    const signals = brandSignalsOf(world, week)
    rows.push({
      week,
      wtaRank: standing.wtaRanked ? standing.wtaRank : null,
      fame,
      worthCents: Math.round(
        brandWeeklyGrossCents(signals) * WEEKS_PER_YEAR * brandMultipleX(signals, CANDIDATE_MULTIPLE),
      ),
      // ⭐ THE OWNING ARM READS THE TILL'S OWN FUNCTION rather than re-deriving it, so the two arms
      // can be compared without this file owning a second copy of the merch arithmetic.
      incomeCents: buy
        ? merchWeeklyIncomeCents(world)
        : Math.round(fame * ECONOMY.business.merch.perFamePointCents),
      fameEvents: fameEventsAt(world, week),
    })
  }
  return { label: preset.label, seed, rows, merchBoughtWeek, bestWtaRank, peakFame, peakFameWeek, affordWeek, fameAtAfford, worthAtAfford, peakWorthCents }
}

/** The 2x2 one window length produces, plus what the disputed cell looked like. */
interface Cross {
  window: number
  /** windows where BOTH ends carry a professional standing and the income at the older end is > 0 –
   *  a brand earning nothing cannot be seen to shrink, and counting those weeks would drown the
   *  question in a career's first decade. */
  n: number
  rankBetterIncomeDown: number
  rankBetterIncomeUp: number
  rankWorseIncomeDown: number
  rankWorseIncomeUp: number
  /** signed percentage moves of income inside the disputed cell, for the size of the complaint. */
  disputedFallPct: number[]
  /** ...and how many of those windows contained no fame-earning event at all. */
  disputedNoEvent: number
  /** the same, restricted to windows ENDING inside the top 25 – the part of a career he is in. */
  top25n: number
  top25RankBetterIncomeDown: number
}

function crossAt(runs: CareerRun[], window: number): Cross {
  const c: Cross = {
    window,
    n: 0,
    rankBetterIncomeDown: 0,
    rankBetterIncomeUp: 0,
    rankWorseIncomeDown: 0,
    rankWorseIncomeUp: 0,
    disputedFallPct: [],
    disputedNoEvent: 0,
    top25n: 0,
    top25RankBetterIncomeDown: 0,
  }
  for (const run of runs) {
    for (let i = window; i < run.rows.length; i++) {
      const now = run.rows[i]
      const then = run.rows[i - window]
      if (now.wtaRank === null || then.wtaRank === null) continue
      if (then.incomeCents <= 0) continue
      const rankBetter = now.wtaRank < then.wtaRank
      const incomeDown = now.incomeCents < then.incomeCents
      c.n++
      if (rankBetter && incomeDown) c.rankBetterIncomeDown++
      else if (rankBetter && !incomeDown) c.rankBetterIncomeUp++
      else if (!rankBetter && incomeDown) c.rankWorseIncomeDown++
      else c.rankWorseIncomeUp++
      if (rankBetter && incomeDown) {
        c.disputedFallPct.push((now.incomeCents / then.incomeCents - 1) * 100)
        let events = 0
        for (let k = i - window + 1; k <= i; k++) events += run.rows[k].fameEvents
        if (events === 0) c.disputedNoEvent++
      }
      if (now.wtaRank <= 25) {
        c.top25n++
        if (rankBetter && incomeDown) c.top25RankBetterIncomeDown++
      }
    }
  }
  return c
}

const q = (xs: number[], p: number): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(p * s.length))]
}
const pct = (a: number, b: number): string => (b === 0 ? '  n/a' : `${((a / b) * 100).toFixed(1)}%`)
const usd = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`

export function main(argv: string[] = process.argv.slice(2)): void {
  const num = (name: string, fallback: number): number => {
    const i = argv.indexOf(name)
    return i >= 0 ? Number(argv[i + 1]) : fallback
  }
  const weeks = num('--weeks', DEFAULT_WEEKS)
  const seeds = num('--seeds', DEFAULT_SEEDS)
  const buy = argv.includes('--buy')
  const jsonAt = argv.indexOf('--json')
  const policy = POLICIES[1] // the reasonable-parent arm; the grinder never reaches these ranks

  console.log(`MERCH INCOME AGAINST RANK – round 30 #13`)
  console.log(
    `  ${PRESETS.length} presets x ${seeds} seeds x ${weeks} weeks, policy '${policy.id}'` +
      `${buy ? ', OWNING arm (income off the till)' : ', income derived from fame'}`,
  )
  console.log(
    `  fame half-life ${ECONOMY.fame.halfLifeWeeks}w · merch dial ` +
      `${usd(ECONOMY.business.merch.perFamePointCents)}/fame point/week`,
  )
  // ⚠ THE ARM, PRINTED, so no run's output can be misfiled – `injury-audit.ts`'s own rule. The
  // shipped ladder is one rung and says so; a `--seasonBands` run says which rungs it added.
  console.log(
    `  season-end fame bands: ${ECONOMY.fame.seasonEndBands.map((b) => `top${b.maxEndRank}=+${b.add}`).join(' ')}` +
      `${BANDS_ARG ? '   <- ROUND 30 #24 COUNTERFACTUAL ARM, not shipped' : '   (shipped)'}`,
  )

  const runs: CareerRun[] = []
  for (const preset of PRESETS) {
    for (let i = 0; i < seeds; i++) runs.push(runCareer(preset, policy, i, weeks, buy))
  }

  const ever = runs.filter((r) => r.bestWtaRank !== null)
  const famous = runs.filter((r) => r.peakFame >= 1)
  console.log(`\n  ${ever.length}/${runs.length} careers ever held a WTA standing;` +
    ` ${famous.length} ever reached fame 1 (${usd(1 * ECONOMY.business.merch.perFamePointCents)}/wk)`)
  const peaks = famous.map((r) => r.peakFame).sort((a, b) => a - b)
  if (peaks.length > 0) {
    console.log(
      `  peak fame: median ${q(peaks, 0.5).toFixed(1)} (${usd(q(peaks, 0.5) * 3_000)}/wk)` +
        `  p90 ${q(peaks, 0.9).toFixed(1)}  best ${peaks[peaks.length - 1].toFixed(1)}`,
    )
  }

  console.log(`\n  ⭐ THE 2x2 – did the rank improve, did the income fall, over the same window`)
  const crosses = WINDOWS.map((w) => crossAt(runs, w))
  for (const c of crosses) {
    const climbing = c.rankBetterIncomeDown + c.rankBetterIncomeUp
    console.log(`\n    window ${String(c.window).padStart(2)} weeks – ${c.n} windows with a standing at both ends and a live brand`)
    console.log(`      rank BETTER, income DOWN  ${String(c.rankBetterIncomeDown).padStart(6)}   ${pct(c.rankBetterIncomeDown, c.n)} of all` +
      `   ${pct(c.rankBetterIncomeDown, climbing)} OF CLIMBING WINDOWS   <- his observation`)
    console.log(`      rank BETTER, income UP    ${String(c.rankBetterIncomeUp).padStart(6)}   ${pct(c.rankBetterIncomeUp, c.n)} of all`)
    console.log(`      rank WORSE,  income DOWN  ${String(c.rankWorseIncomeDown).padStart(6)}   ${pct(c.rankWorseIncomeDown, c.n)} of all`)
    console.log(`      rank WORSE,  income UP    ${String(c.rankWorseIncomeUp).padStart(6)}   ${pct(c.rankWorseIncomeUp, c.n)} of all`)
    const f = c.disputedFallPct
    if (f.length > 0) {
      console.log(
        `      the fall, inside the disputed cell: median ${q(f, 0.5).toFixed(1)}%` +
          `  p10 ${q(f, 0.1).toFixed(1)}%  worst ${q(f, 0).toFixed(1)}%`,
      )
      console.log(`      ...of which contained NO fame-earning event: ${c.disputedNoEvent}  ${pct(c.disputedNoEvent, f.length)}`)
    }
    console.log(`      windows ENDING inside WTA #25: ${c.top25n}, of which rank better + income down ${c.top25RankBetterIncomeDown}  ${pct(c.top25RankBetterIncomeDown, c.top25n)}`)
  }

  // ⭐⭐ HIS OWN SHAPE, LOOKED FOR RATHER THAN ARGUED: a career sitting near WTA #15 with the brand
  // paying in his band. If the game produces this exact week, the observation is reproduced and not
  // merely modelled.
  console.log(`\n  ⭐ HIS SHAPE – weeks at WTA #10-20 with the brand paying $400-800/wk`)
  let hits = 0
  const trails: string[] = []
  for (const run of runs) {
    for (let i = 26; i < run.rows.length; i++) {
      const r = run.rows[i]
      if (r.wtaRank === null || r.wtaRank < 10 || r.wtaRank > 20) continue
      if (r.incomeCents < 400_00 || r.incomeCents > 800_00) continue
      const before = run.rows[i - 26]
      if (before.incomeCents <= r.incomeCents) continue
      hits++
      if (trails.length < 8) {
        let events = 0
        for (let k = i - 25; k <= i; k++) events += run.rows[k].fameEvents
        trails.push(
          `    ${run.seed} w${r.week}: WTA #${before.wtaRank} -> #${r.wtaRank}, ` +
            `${usd(before.incomeCents)}/wk -> ${usd(r.incomeCents)}/wk over 26 weeks, ` +
            `${events} fame-earning events in the window`,
        )
      }
    }
  }
  console.log(`    ${hits} such weeks across the run`)
  for (const t of trails) console.log(t)

  // ⭐⭐⭐ ROUND 30 #9 – WHAT A BRAND VALUED AT `CANDIDATE_MULTIPLE` YEARS OF ITS OWN INCOME WOULD BE
  // WORTH, against the $250,000 it cost. Three questions, and the first one is the one that decides
  // the multiple: is the family roughly square on the day it can afford to buy?
  console.log(`\n  ⭐ THE BRAND AS AN ASSET – worth = (${CANDIDATE_MULTIPLE} + what the career earned) x a year of its own income, price ${usd(MERCH_PRICE_CENTS)}`)
  // ⭐⭐⭐ ROUND 30 #23 – EVERY FIGURE BELOW IS A MEDIAN OF PER-CAREER WORTHS, recorded on the week
  // it happened (`WeekRow.worthCents`), never the worth of a median fame. The two were the same
  // number while the multiple was a constant and stopped being the same number the day it became
  // something the career EARNS – `brandMultipleX` reads the seasons, the finals and the win rate, so
  // it can only be asked while a world is in front of you.
  // ⚠ THE SEASON-BY-SEASON CURVES AND THE FOUR ARCHETYPES LIVE IN `tools/brand-dynamics.ts`. This
  // file keeps round 30 #13's question and reports the asset only as a distribution.
  const afforders = runs.filter((r) => r.affordWeek !== null)
  const fameThen = afforders.map((r) => r.fameAtAfford).sort((a, b) => a - b)
  const worthThen = afforders.map((r) => r.worthAtAfford).sort((a, b) => a - b)
  console.log(`    ${afforders.length}/${runs.length} careers could ever carry it; median first week ${q(afforders.map((r) => r.affordWeek!), 0.5)}`)
  if (fameThen.length > 0) {
    console.log(
      `    fame the week they could: p10 ${q(fameThen, 0.1).toFixed(1)}  median ${q(fameThen, 0.5).toFixed(1)}` +
        `  p90 ${q(fameThen, 0.9).toFixed(1)}`,
    )
    console.log(
      `    ...so the brand was worth p10 ${usd(q(worthThen, 0.1))}` +
        `  median ${usd(q(worthThen, 0.5))}  p90 ${usd(q(worthThen, 0.9))} on the day they bought it`,
    )
    const square = worthThen.filter((c) => c >= MERCH_PRICE_CENTS).length
    console.log(`    at or above what it cost on day one: ${square}/${worthThen.length}  ${pct(square, worthThen.length)}`)
  }
  // ...and what it is worth at the PEAK of the career, which is the reward half.
  const peakWorth = famous.map((r) => r.peakWorthCents).sort((a, b) => a - b)
  if (peakWorth.length > 0) {
    console.log(
      `    at the career's peak fame: median ${usd(q(peakWorth, 0.5))} (${(q(peakWorth, 0.5) / MERCH_PRICE_CENTS).toFixed(1)}x the price)` +
        `  p90 ${usd(q(peakWorth, 0.9))}  best ${usd(peakWorth[peakWorth.length - 1])}`,
    )
  }
  // ⚠ AND IT MUST BE ABLE TO FALL. Seasons, over every career that ever had a brand worth anything.
  let seasons = 0
  let down = 0
  const drops: number[] = []
  for (const run of runs) {
    for (let i = WEEKS_PER_YEAR; i < run.rows.length; i++) {
      const a = run.rows[i - WEEKS_PER_YEAR].worthCents
      const b = run.rows[i].worthCents
      if (a <= 0) continue
      seasons++
      if (b < a) {
        down++
        drops.push((b / a - 1) * 100)
      }
    }
  }
  console.log(`    seasons in which the VALUE fell: ${down}/${seasons}  ${pct(down, seasons)}` +
    (drops.length > 0 ? `, median ${q(drops, 0.5).toFixed(1)}%, worst ${q(drops, 0).toFixed(1)}%` : ''))

  if (jsonAt >= 0) {
    writeFileSync(
      argv[jsonAt + 1],
      JSON.stringify(
        {
          weeks,
          seeds,
          buy,
          halfLifeWeeks: ECONOMY.fame.halfLifeWeeks,
          perFamePointCents: ECONOMY.business.merch.perFamePointCents,
          crosses: crosses.map((c) => ({ ...c, disputedFallPct: undefined, fallMedian: q(c.disputedFallPct, 0.5) })),
          careers: runs.map((r) => ({
            seed: r.seed,
            bestWtaRank: r.bestWtaRank,
            peakFame: r.peakFame,
            peakFameWeek: r.peakFameWeek,
            merchBoughtWeek: r.merchBoughtWeek,
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
