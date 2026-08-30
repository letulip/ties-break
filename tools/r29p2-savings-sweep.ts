/**
 * ROUND 29 PART TWO #3 – DOES A PLAYER WHO MOVES HIS MONEY INTO SAVINGS LAND WHERE THE INTEREST
 * USED TO PUT HIM?
 *
 * ⚠ THIS IS ROUND 29 #12's OWN QUESTION, RE-ASKED ON HIS RULING. #12 removed the current account's
 * automatic interest and measured the cost at −$1,954 a career on the clean junior horizon (18 of 18
 * presets down) and survival 1,034 → 1,022 across all three. It then measured the replacement and
 * found it recovered **63%**, for two structural reasons rather than one:
 *   1. AVAILABILITY – `shopUnlocked` shut the whole shelf until her professional era, so the junior
 *      sink had no replacement at all. Part two #6 deleted that gate on his ruling.
 *   2. RATE – the deposit paid 2.00%/yr against the current account's 3.17%. Part two #3 moves the
 *      account's own rate onto the deposit, also on his ruling.
 * Both halves are now in, so the question is worth re-asking with the same seeds and the same shape.
 *
 * ⚠⚠ THREE ARMS, AND THE ONLY HONEST ONES ARE BUILT FROM DIFFERENT TREES.
 *   A – the interest, as it was:      a worktree at `origin/round/29-ledger` with `74cb407` reverted.
 *   B – neither:                      `origin/round/29-ledger` itself. No interest, no yield.
 *   C – Savings:                      this branch (shop open from week 0, deposit at 3.17%), with the
 *                                     sweep policy ON.
 * `A − B` reproduces what #12 measured. `C − B` is what the replacement is worth. The two are
 * comparable because every arm walks the SAME (preset, seed, horizon) careers.
 *
 * ⚠ AND THE NULL ARM IS NAMED HONESTLY. Run this on arm C's tree with `--sweep=off` and it must
 * reproduce arm B to the cent: nothing in part two #3 or #6 has a reader unless somebody BUYS. That
 * is not a weakness of the change, it is the proof that the sweep is the reader – CLAUDE.md's own
 * rule about an arm that contains the change but not its reader.
 *
 * THE SWEEP POLICY, in one sentence: keep a living reserve in the current account and put everything
 * above it into the deposit; when the reserve runs short, take back exactly what is needed. ⭐ The
 * second half is only expressible because part two #4 shipped PART sales – before it, a family that
 * dipped below its float had to liquidate the whole holding or nothing.
 *
 * MEASUREMENT ONLY: this file drives the engine and reads it back. It changes no engine number.
 *
 * Run:  npx vite-node tools/r29p2-savings-sweep.ts -- --sweep=on
 *       npx vite-node tools/r29p2-savings-sweep.ts -- --sweep=off
 *       ... --seeds=5 --horizons=104        (a smoke run)
 */
import {
  HORIZONS,
  PRESETS,
  POLICIES,
  SEEDS_PER_PRESET,
  openCareer,
  stepCareerWeek,
  mean,
} from './econ-bench'
import { buyAsset, sellAsset, shopItem, type WorldState } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'

const argv = process.argv.slice(2)
const arg = (name: string): string | undefined =>
  argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]

const SWEEP = (arg('sweep') ?? 'on') !== 'off'
/** The living float the family keeps in the current account. ⚠ $5,000 AND NOT #12's $25,000: that
 *  run only asked about the adult horizon, where the wallet is large. The horizon this item is about
 *  is the JUNIOR sink, where a working family starts on $8,000 – a $25,000 float there is a policy
 *  that never sweeps, which is a null arm wearing a number. */
const RESERVE_CENTS = Number(arg('reserve') ?? 5_000_00)
const SEEDS = Number(arg('seeds') ?? SEEDS_PER_PRESET)
const HORIZON_WEEKS = arg('horizons')
  ? arg('horizons')!.split(',').map(Number)
  : HORIZONS.map((h) => h.weeks)

/** ⭐⭐ `--rate=<bps>` – THE RATE ARM, AND IT IS THE ONLY HONEST WAY TO ISOLATE PART TWO #3 FROM ITS
 *  OWN SIDE-EFFECT. Sweeping money off the current account also makes the family LOOK poorer to
 *  every affordability check in the bench policy, so it enters less and spends less; end wealth
 *  therefore moves for two reasons at once and «the deposit earned that» would be a false
 *  attribution – the exact career-divergence trap round 29 #12 warned about in its own table.
 *  Running the SAME sweep at 0 / 200 / 317 bps holds the behaviour fixed and moves only the rate, so
 *  the difference between those arms IS the yield.
 *
 *  ⚠ THIS MUTATES AN ENGINE CONSTANT AND IS THE ONLY PLACE IN THE REPO THAT DOES. It is a
 *  measurement instrument, it is opt-in, and it prints what it did – nothing ships with it. */
const RATE_BPS = arg('rate') === undefined ? null : Number(arg('rate'))
if (RATE_BPS !== null) {
  const row = ECONOMY.shop.catalogue.find((r) => r.id === 'deposit')
  if (row) (row as { annualRateBps: number }).annualRateBps = RATE_BPS
}

/** The deposit's own minimum, read off the catalogue rather than repeated here. */
const MIN_TRANCHE = shopItem('deposit')!.entryCents

/** What the family is worth: the wallet plus everything on the shelf. ⚠ THE WHOLE POINT OF THE
 *  MEASURE – a sweep that only moved money would look like a loss if only `fundsCents` were read. */
function wealthCents(world: WorldState): number {
  return world.fundsCents + (world.assets ?? []).reduce((s, a) => s + a.valueCents, 0)
}

/** ⚠ EVERY COMMAND IS TRIED, NOT ASSUMED. `buyAsset` and `sellAsset` re-validate the minimum, the
 *  wallet, the ceiling and the terminal latch, and a bench that swallowed a refusal silently would
 *  be measuring a policy nobody could play. A throw here means the policy asked for something the
 *  game refuses, and the honest response is to do nothing that week. */
function sweepWeek(world: WorldState): void {
  const held = (world.assets ?? []).find((a) => a.id === 'deposit')
  if (world.fundsCents < RESERVE_CENTS) {
    if (!held) return
    const want = Math.min(held.valueCents, RESERVE_CENTS - world.fundsCents)
    if (want <= 0) return
    try {
      sellAsset(world, 'deposit', want)
    } catch {
      /* the shelf refused – the family sits on what it has */
    }
    return
  }
  const spare = world.fundsCents - RESERVE_CENTS
  if (spare < MIN_TRANCHE) return
  try {
    buyAsset(world, 'deposit', spare)
  } catch {
    /* refused – see above */
  }
}

interface Row {
  endWealthCents: number
  survived: boolean
  everInvested: boolean
}

function runOne(presetIdx: number, policyIdx: number, seedIdx: number, weeks: number): Row {
  const preset = PRESETS[presetIdx]
  const policy = POLICIES[policyIdx]
  const { world, rng } = openCareer(preset, seedIdx, policy)
  let bankrupt = world.fundsCents < 0
  let everInvested = false
  for (let i = 0; i < weeks; i++) {
    stepCareerWeek(world, rng, policy)
    if (SWEEP) {
      sweepWeek(world)
      if ((world.assets ?? []).length > 0) everInvested = true
    }
    if (world.fundsCents < 0) bankrupt = true
  }
  return { endWealthCents: wealthCents(world), survived: !bankrupt, everInvested }
}

function usd(cents: number): string {
  const d = Math.round(cents / 100)
  return `${d < 0 ? '-' : ''}$${Math.abs(d).toLocaleString('en-US')}`
}

function main(): void {
  console.log(
    `savings sweep – sweep=${SWEEP ? 'on' : 'off'} reserve=${usd(RESERVE_CENTS)} seeds=${SEEDS} ` +
      `presets=${PRESETS.length}x${POLICIES.length} horizons=${HORIZON_WEEKS.join(',')} ` +
      `depositRate=${shopItem('deposit')!.annualRateBps}bps${RATE_BPS === null ? '' : ' (OVERRIDDEN)'}`,
  )
  let allSurvivors = 0
  let allCareers = 0
  for (const weeks of HORIZON_WEEKS) {
    const label = HORIZONS.find((h) => h.weeks === weeks)?.label ?? `${weeks}wk`
    const wealth: number[] = []
    let survivors = 0
    let careers = 0
    let invested = 0
    // ⚠ PER-CELL MEANS TOO: the headline is a mean of 540 careers, and #12's own reading was that
    // the honest signal is «every one of 18 presets fell», not the average. So both are printed.
    const cellMeans: string[] = []
    for (let p = 0; p < POLICIES.length; p++) {
      for (let i = 0; i < PRESETS.length; i++) {
        const cell: number[] = []
        for (let s = 0; s < SEEDS; s++) {
          const row = runOne(i, p, s, weeks)
          cell.push(row.endWealthCents)
          wealth.push(row.endWealthCents)
          if (row.survived) survivors += 1
          if (row.everInvested) invested += 1
          careers += 1
        }
        cellMeans.push(`${POLICIES[p].id}/${PRESETS[i].label.trim()} = ${usd(mean(cell))}`)
      }
    }
    allSurvivors += survivors
    allCareers += careers
    console.log(`\n${label} (${weeks} wk) – ${careers} careers`)
    console.log(`  end wealth mean = ${usd(mean(wealth))}`)
    console.log(`  survivors       = ${survivors}/${careers}`)
    console.log(`  ever invested   = ${invested}/${careers}`)
    for (const line of cellMeans) console.log(`    ${line}`)
  }
  console.log(`\nALL HORIZONS survivors = ${allSurvivors}/${allCareers}`)
}

main()
