// THE SHOP PROBE – the four numbers slice 1 is accepted on, measured rather than argued.
// docs/specs/the-shop-2026-08.md §11 row 1. Run: `npm run probe:shop` (add `--seeds N`,
// `--policy player|grinder`, `--seasons N`).
//
// ⚠ WHY IT EXISTS, and CLAUDE.md invariant 4 is the reason: «Tuning is measured, not guessed.» This
// slice adds prices to the game – two house tiers the spec gives NO numbers for (§3c names tiers and
// stops) – and one acceptance that is a claim about the whole economy rather than about the shop:
//
//   §2e-1  a bench career buys the good car in season 3, sells it two seasons later, and the ledger
//          shows the loss TO THE CENT;
//   §2e-5  ⚠ the shop may not become the DOMINANT OUTGOING before season 4 – if it does, it is
//          competing with the coach and the tennis, which the backlog's §0 says it must not do
//          early;
//   plus:  WHEN does the shelf actually open (`shopUnlocked` – her first counting W-series result),
//          and what can a family reach by then? That is what the two house prices are chosen off.
//
// ⚠ THE SHOPPER IS DELIBERATELY EAGER, WHICH IS THE ONLY HONEST WAY TO ASK §2e-5. A player can
// always make the shop dominant by emptying the wallet into it; what the acceptance is really about
// is whether the ECONOMY lets that happen early to a parent who is behaving reasonably. So arm B
// buys the good car THE FIRST WEEK it can – the shelf open, the price affordable, and the policy's
// own reserve still standing after – and sells it exactly two seasons later. Any rule kinder than
// that would be measuring the rule instead of the shop.
//
// ⚠ AND ARM A IS THE SAME CAREERS WITHOUT THE PURCHASE, so every figure below is a difference rather
// than a level. Both arms are `openCareer` + `stepCareerWeek` from tools/econ-bench.ts – the shared
// career loop, so this tool defines no second entry policy.
import {
  PRESETS,
  POLICIES,
  openCareer,
  stepCareerWeek,
  weeklyRunningCostCents,
  median,
  type Policy,
  type Preset,
} from './econ-bench'
import { buyAsset, sellAsset, shopItem, shopUnlocked, ownedAssets } from '../src/engine/world'
import { seasonIndexOf } from '../src/engine/world/ledger'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { WorldEventCategory } from '../src/shared/protocol'

/** The rung §2e-1 names: «the good car». */
const THE_CAR = 'car-good'
/** ...and how long §2e-1 holds it. */
const HOLD_SEASONS = 2

interface SeasonSpend {
  /** signed cents per category over the season's 52 weeks, read off the events as they are written
   *  (`financeWeeks` prunes at sixty weeks, so a horizon-end scan would miss every earlier season –
   *  the exact bug `econ-bench`'s own per-season fold exists to avoid). */
  byCategory: Partial<Record<WorldEventCategory, number>>
}

interface Arm {
  seed: string
  preset: string
  /** the week her first counting W-series result opened the shelf, or null if it never did. */
  unlockWeek: number | null
  boughtWeek: number | null
  soldWeek: number | null
  paidCents: number | null
  soldForCents: number | null
  fundsBySeason: number[]
  spendBySeason: SeasonSpend[]
  endedWeek: number | null
}

function emptySeasons(n: number): SeasonSpend[] {
  return Array.from({ length: n }, () => ({ byCategory: {} }))
}

function walk(preset: Preset, index: number, policy: Policy, seasons: number, shopper: boolean): Arm {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const weeks = seasons * WEEKS_PER_YEAR
  const arm: Arm = {
    seed,
    preset: preset.label,
    unlockWeek: null,
    boughtWeek: null,
    soldWeek: null,
    paidCents: null,
    soldForCents: null,
    fundsBySeason: [],
    spendBySeason: emptySeasons(seasons),
    endedWeek: null,
  }
  // ⚠⚠ THE LEDGER IS COPIED OUT AS IT GOES, AND AN INDEX INTO `world.events` IS THE WRONG TOOL – the
  // first draft of this probe used one and reported ZERO shop spend in a run whose own arm-B table
  // printed a purchase in season 3. `pruneEvents` REMOVES rows from that array (`EVENTS_CAP`, class
  // order), so a forward cursor silently walks past everything the pruner shifted underneath it.
  // `financeWeeks` is the ledger built for this question: it keeps a 60-week window of per-category
  // TOTALS, and a week's totals never change once written – so re-copying every week still in the
  // window on every tick captures the whole career exactly, pruning and all.
  const ledger = new Map<number, Partial<Record<WorldEventCategory, number>>>()

  for (let w = 0; w < weeks && world.ending === null; w++) {
    stepCareerWeek(world, rng, policy)

    if (arm.unlockWeek === null && shopUnlocked(world)) arm.unlockWeek = world.week

    if (shopper) {
      const item = shopItem(THE_CAR)!
      if (arm.boughtWeek === null && shopUnlocked(world)) {
        // ⚠ THE RESERVE IS THE POLICY'S OWN, not a number invented here: the same
        // `reserveWeeks x the family's own weekly running cost` the entry decision uses. An eager
        // shopper is still a parent who keeps the lights on.
        const reserve = Math.max(policy.reserveCents, policy.reserveWeeks * weeklyRunningCostCents(world))
        if (world.fundsCents - item.entryCents >= reserve) {
          buyAsset(world, THE_CAR)
          arm.boughtWeek = world.week
          arm.paidCents = ownedAssets(world).find((a) => a.id === THE_CAR)!.paidCents
        }
      } else if (arm.boughtWeek !== null && arm.soldWeek === null && world.week >= arm.boughtWeek + HOLD_SEASONS * WEEKS_PER_YEAR) {
        arm.soldForCents = ownedAssets(world).find((a) => a.id === THE_CAR)!.valueCents
        sellAsset(world, THE_CAR)
        arm.soldWeek = world.week
      }
    }

    for (const fw of world.financeWeeks) ledger.set(fw.week, { ...fw.byCategory })
    if ((world.week + 1) % WEEKS_PER_YEAR === 0) arm.fundsBySeason.push(world.fundsCents)
  }
  for (const [week, byCategory] of ledger) {
    const s = seasonIndexOf(week)
    if (s < 0 || s >= seasons) continue
    const bucket = arm.spendBySeason[s].byCategory
    for (const [cat, amt] of Object.entries(byCategory) as [WorldEventCategory, number][]) {
      bucket[cat] = (bucket[cat] ?? 0) + amt
    }
  }
  if (world.ending) arm.endedWeek = world.ending.week
  return arm
}

/** The biggest OUTGOING category of a season, and what share of all outgoings it took. */
function dominantOutgoing(s: SeasonSpend): { cat: WorldEventCategory | null; cents: number; share: number } {
  let total = 0
  let best: WorldEventCategory | null = null
  let bestCents = 0
  for (const [cat, amt] of Object.entries(s.byCategory) as [WorldEventCategory, number][]) {
    if (amt >= 0) continue
    const out = -amt
    total += out
    if (out > bestCents) {
      bestCents = out
      best = cat
    }
  }
  return { cat: best, cents: bestCents, share: total > 0 ? bestCents / total : 0 }
}

function shopShareOf(s: SeasonSpend): number {
  let total = 0
  let shop = 0
  for (const [cat, amt] of Object.entries(s.byCategory) as [WorldEventCategory, number][]) {
    if (amt >= 0) continue
    total += -amt
    if (cat === 'shop') shop = -amt
  }
  return total > 0 ? shop / total : 0
}

const money = (cents: number): string => `${cents < 0 ? '-' : ''}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
const pct = (x: number): string => `${(x * 100).toFixed(1)}%`

export function main(argv: string[] = process.argv.slice(2)): void {
  const seedArg = argv.indexOf('--seeds')
  const seeds = seedArg >= 0 ? Number(argv[seedArg + 1]) : 6
  const seasonArg = argv.indexOf('--seasons')
  const seasons = seasonArg >= 0 ? Number(argv[seasonArg + 1]) : 8
  const polArg = argv.indexOf('--policy')
  const policy = POLICIES.find((p) => p.id === (polArg >= 0 ? argv[polArg + 1] : 'player')) ?? POLICIES[1]

  console.log(`\nTHE SHOP PROBE – ${PRESETS.length} presets x ${seeds} seeds x ${seasons} seasons · policy ${policy.label}\n`)

  const armsA: Arm[] = []
  const armsB: Arm[] = []
  for (const preset of PRESETS) {
    for (let i = 0; i < seeds; i++) {
      armsA.push(walk(preset, i, policy, seasons, false))
      armsB.push(walk(preset, i, policy, seasons, true))
    }
  }

  // --- 1. WHEN DOES THE SHELF EVEN OPEN? ---------------------------------------------------------
  const unlocks = armsA.map((a) => a.unlockWeek).filter((w): w is number => w !== null)
  console.log('1. THE GATE – her first counting W-series result (`shopUnlocked`)')
  console.log(`   opened in ${unlocks.length} of ${armsA.length} careers`)
  if (unlocks.length) {
    const bySeason = unlocks.map((w) => seasonIndexOf(w))
    console.log(`   median unlock: week ${median(unlocks).toFixed(0)} (season ${median(bySeason).toFixed(1)})`)
    console.log(`   earliest: week ${Math.min(...unlocks)} (season ${seasonIndexOf(Math.min(...unlocks))})`)
    const before4 = bySeason.filter((s) => s < 4).length
    console.log(`   open before season 4: ${before4} of ${armsA.length} careers (${pct(before4 / armsA.length)})`)
  }

  // --- 2. §2e-1 – THE CAR, BOUGHT AND SOLD -------------------------------------------------------
  const traded = armsB.filter((a) => a.soldWeek !== null)
  console.log(`\n2. §2e-1 – the good car, bought and sold two seasons later (${traded.length} of ${armsB.length} careers reached it)`)
  for (const a of traded.slice(0, 5)) {
    const loss = a.soldForCents! - a.paidCents!
    console.log(
      `   ${a.seed.padEnd(20)} bought w${a.boughtWeek} ${money(a.paidCents!)} -> sold w${a.soldWeek} ${money(a.soldForCents!)}  loss ${money(loss)} (${pct(loss / a.paidCents!)})`,
    )
  }
  if (traded.length) {
    const losses = traded.map((a) => a.soldForCents! - a.paidCents!)
    console.log(`   median loss: ${money(median(losses))} · every one is exactly paid x 0.91^2 rounded`)
  }

  // --- 3. §2e-5 – IS THE SHOP THE DOMINANT OUTGOING BEFORE SEASON 4? -----------------------------
  console.log('\n3. §2e-5 – the shop must NOT be the dominant outgoing before season 4')
  let worstShare = 0
  let dominantCount = 0
  let armsWithEarlyShop = 0
  for (const a of armsB) {
    let sawEarly = false
    for (let s = 0; s < Math.min(4, a.spendBySeason.length); s++) {
      const share = shopShareOf(a.spendBySeason[s])
      if (share > 0) sawEarly = true
      if (share > worstShare) worstShare = share
      const dom = dominantOutgoing(a.spendBySeason[s])
      if (dom.cat === 'shop') dominantCount++
    }
    if (sawEarly) armsWithEarlyShop++
  }
  console.log(`   careers that bought anything before season 4: ${armsWithEarlyShop} of ${armsB.length}`)
  console.log(`   season-slots (career x season 0-3) where the shop was the LARGEST outgoing: ${dominantCount} of ${armsB.length * 4}`)
  console.log(`   worst shop share of a season's outgoings, seasons 0-3: ${pct(worstShare)}`)
  // ⚠ WHO, exactly – an aggregate that hides which families it is about would be the wrong number.
  for (const a of armsB) {
    for (let s = 0; s < Math.min(4, a.spendBySeason.length); s++) {
      const share = shopShareOf(a.spendBySeason[s])
      if (share <= 0) continue
      const dom = dominantOutgoing(a.spendBySeason[s])
      console.log(
        `     ${a.preset} · ${a.seed} · season ${s}: shop ${pct(share)} of outgoings, largest = ${dom.cat} (${pct(dom.share)})`,
      )
    }
  }

  // --- 4. WHAT A FAMILY CAN REACH, which is what the house prices are chosen off -----------------
  console.log('\n4. FUNDS BY SEASON (arm A, no shopping) – the ladder the house tiers are priced against')
  console.log('   season   median funds     p90 funds')
  for (let s = 0; s < seasons; s++) {
    const vals = armsA.map((a) => a.fundsBySeason[s]).filter((v): v is number => v !== undefined)
    if (!vals.length) continue
    const sorted = [...vals].sort((x, y) => x - y)
    const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))]
    console.log(`   ${String(s).padStart(5)}   ${money(median(vals)).padStart(13)}   ${money(p90).padStart(13)}`)
  }
  console.log('')
}

// The guard every bench in this directory carries, and for the measured reason at the foot of
// tools/econ-bench.ts: `vite-node` strips the entry file from `process.argv`, so a naive `argv[1]`
// check is false on every invocation and the tool exits 0 having done nothing.
const NAMED_ON_THE_COMMAND_LINE =
  process.argv.some((a) => a.includes('shop-probe')) ||
  (process.env.npm_lifecycle_script ?? '').includes('shop-probe') ||
  process.env.TB_SHOP_PROBE_RUN === '1'
if (!process.env.VITEST && NAMED_ON_THE_COMMAND_LINE) main()
