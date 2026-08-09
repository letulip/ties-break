/**
 * two-cells – the owner's two saves as two BENCH CELLS, run side by side.
 *
 * ⚠ MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture, reads
 * no save. The two arms are shaped like his two careers from their SETTINGS alone (background,
 * coach, offer policy) – nothing is copied out of a `.tsave` and nothing personal is committed.
 *
 * THE QUESTION, in his words (09.08): «кажется мы немного подрастеряли баланс игровой, пока по
 * ощущениям за 8к проще играть, чем за 25к из-за поддержки всех и вся, а надо как-то чтобы более
 * сложно было». Two claims, and both are measurable:
 *   (a) is the 8k career actually EASIER than the 25k one?
 *   (b) if it is, WHERE does the money come from – and does the player have any say in it?
 *
 * And his second ask, the same message: «можешь ли ты смоделировать разные карьеры по образу моих
 * сейвов, чтобы увидеть кто с каким шансом играет вообще, выигрывает, получает спонсоров,
 * поддержку и прочее?» – so every arm reports RATES over the seed population, not one career.
 *
 * Run:
 *   npx vite-node tools/two-cells.ts -- [--seeds 60] [--weeks 208]
 */
import { rngFromSeed } from '../src/engine/rng'
import {
  acceptOffer,
  createWorld,
  hireCoach,
  type WorldState,
} from '../src/engine/world'
import { buildCoachRoster } from '../src/engine/coach'
import { stepCareerWeek, POLICIES } from './econ-bench'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { ECONOMY, parentIncomeForWeekCents } from '../src/engine/economy'
import { DEFAULT_PROFILE, type FamilyBackground, type PlayerProfile } from '../src/shared/protocol'
import type { CoachTier } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

const DEFAULT_SEEDS = 60
const DEFAULT_WEEKS = 4 * WEEKS_PER_YEAR

interface Arm {
  label: string
  background: FamilyBackground
  /** the rung she hires at week 0, or null for the self-coached arm */
  coach: CoachTier | null
  /** sign every kit letter, whatever its rung – both his careers took the first one offered */
  signKit: boolean
}

const ARMS: Arm[] = [
  { label: 'olivia  8k · self-coached', background: 'working', coach: null, signKit: true },
  { label: 'ines   25k · middle coach', background: 'middle', coach: 'middle', signKit: true },
  // The two controls that separate BACKGROUND from COACH – without them a difference between the
  // arms above cannot be attributed to either.
  { label: 'control 8k · middle coach', background: 'working', coach: 'middle', signKit: true },
  { label: 'control 25k · self-coached', background: 'middle', coach: null, signKit: true },
]

interface Career {
  endFundsCents: number
  minFundsCents: number
  bankrupt: boolean
  prizeCents: number
  sponsorCents: number
  academyCents: number
  incomeCents: number
  spentCents: number
  titles: number
  finals: number
  entries: number
  endRankItf: number
  endRankDom: number
  endRankWta: number | null
  bestTier: TierId | null
  everSignedKit: boolean
  everAcademy: boolean
}

function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}

function median(xs: number[]): number {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

function pct(n: number, of: number): string {
  return of ? `${((100 * n) / of).toFixed(1)}%` : '-'
}

function runCareer(arm: Arm, seed: string, weeks: number): Career {
  // ⚠ BUILT OFF `DEFAULT_PROFILE` (09.08, fix/sponsor-floor). The literal below carried a `name`
  // field that `PlayerProfile` does not have and was missing five that it does, so the cast was a
  // TS2352 and `vue-tsc -b --force` was red on this file - the shared gate with it. Spreading the
  // shipped default is what every other bench does (`openCareer`, econ-bench.ts) and it means a new
  // profile field cannot silently leave this tool behind.
  const profile: PlayerProfile = {
    ...DEFAULT_PROFILE,
    background: arm.background,
  }
  const world: WorldState = createWorld(seed, profile)
  const rng = rngFromSeed(`${seed}:bench`)

  if (arm.coach) {
    const roster = buildCoachRoster(world.seed, 14)
    const pick = roster.find((c) => c.tier === arm.coach)
    if (pick) hireCoach(world, pick.id)
  }

  let minFunds = world.fundsCents
  let entries = 0
  let everSignedKit = false
  let everAcademy = false
  // The four money lines, folded from the EVENT ledger as it is written – `financeWeeks` is pruned
  // to 60 weeks and `careerTotals` does not split income by category, so neither can answer this.
  let sponsorCents = 0
  let academyCents = 0
  let incomeCents = 0
  let seenEvent = 0

  for (let i = 0; i < weeks; i++) {
    if (!world.ending && arm.signKit) {
      for (const o of world.offers) {
        if (o.kind !== 'kit' || o.state !== 'open') continue
        if (world.week > o.deadlineWeek) continue
        try {
          acceptOffer(world, o.id)
          everSignedKit = true
        } catch {
          /* one brand at a time – a parent who has a deal does not sign a second */
        }
      }
    }
    const e = stepCareerWeek(world, rng, POLICIES[1])
    for (const t of Object.keys(e) as TierId[]) entries += e[t]
    if (world.fundsCents < minFunds) minFunds = world.fundsCents
    if (world.academy) everAcademy = true
    // ⚠ FOLD THE WEEK JUST RESOLVED, NOT A SUFFIX OF THE ARRAY. `world.events` is COUNT-pruned
    // (EVENTS_CAP, oldest-first), so an index high-water mark silently double-counts the moment a
    // prune shortens the array under it – the same ledger-cap family as the wallet bug. Rows for
    // `world.week - 1` are this tick's own and cannot have been pruned yet, so this is exact.
    seenEvent++
    for (const ev of world.events) {
      if (ev.week !== world.week - 1) continue
      if (ev.type !== 'income' || ev.amountCents === undefined) continue
      if (ev.category === 'sponsor') sponsorCents += ev.amountCents
      else if (ev.category === 'academy') academyCents += ev.amountCents
      else if (ev.category === 'income') incomeCents += ev.amountCents
    }
  }

  let titles = 0
  let finals = 0
  let bestTier: TierId | null = null
  for (const [tier, t] of Object.entries(world.trophiesByTier ?? {})) {
    const row = t as { titles?: number[]; finals?: number[] }
    titles += row?.titles?.length ?? 0
    finals += row?.finals?.length ?? 0
    if (row?.titles?.length) bestTier = tier as TierId
  }

  const totals = world.careerTotals as unknown as { prizeCents?: number; spentCents?: number }
  return {
    endFundsCents: world.fundsCents,
    minFundsCents: minFunds,
    // ⚠ `type`, NOT `kind` (09.08): `CareerEnding`'s discriminant is `type`, so this read undefined
    // and every bankruptcy was counted only by the funds fallback beside it.
    bankrupt: world.ending?.type === 'bankruptcy' || minFunds < 0,
    prizeCents: totals?.prizeCents ?? 0,
    sponsorCents,
    academyCents,
    incomeCents,
    spentCents: totals?.spentCents ?? 0,
    titles,
    finals,
    entries,
    endRankItf: world.kidRank,
    endRankDom: world.kidRankDomestic ?? 0,
    endRankWta: world.kidRankWta ?? null,
    bestTier,
    everSignedKit,
    everAcademy,
  }
}

function report(arm: Arm, cs: Career[]): void {
  const n = cs.length
  console.log(`\n${'-'.repeat(78)}\n${arm.label}   (${n} careers)\n${'-'.repeat(78)}`)
  const weekly = parentIncomeForWeekCents('seed-0', arm.background, 0)
  console.log(`  parent income at season 0: ${money(weekly)}/wk`)
  console.log(`  end funds     median ${money(median(cs.map((c) => c.endFundsCents)))}` +
    `   worst ${money(Math.min(...cs.map((c) => c.endFundsCents)))}` +
    `   best ${money(Math.max(...cs.map((c) => c.endFundsCents)))}`)
  console.log(`  went under water at any point: ${cs.filter((c) => c.minFundsCents < 0).length}/${n}` +
    `   (${pct(cs.filter((c) => c.minFundsCents < 0).length, n)})`)
  console.log(`  bankrupt ending:               ${cs.filter((c) => c.bankrupt).length}/${n}`)
  console.log(`\n  MONEY IN, median over the career:`)
  console.log(`    parent income   ${money(median(cs.map((c) => c.incomeCents))).padStart(12)}`)
  console.log(`    local sponsor   ${money(median(cs.map((c) => c.sponsorCents))).padStart(12)}` +
    `   fired for ${cs.filter((c) => c.sponsorCents > 0).length}/${n}`)
  console.log(`    academy         ${money(median(cs.map((c) => c.academyCents))).padStart(12)}` +
    `   held by  ${cs.filter((c) => c.everAcademy).length}/${n}`)
  console.log(`    prize money     ${money(median(cs.map((c) => c.prizeCents))).padStart(12)}` +
    `   any prize at all ${cs.filter((c) => c.prizeCents > 0).length}/${n}`)
  console.log(`    TOTAL SPENT     ${money(median(cs.map((c) => c.spentCents))).padStart(12)}`)
  const subsidy = cs.map((c) => (c.incomeCents ? c.sponsorCents / c.incomeCents : 0))
  console.log(`    local sponsor as a share of parent income: median ` +
    `${(100 * median(subsidy.map((x) => Math.round(x * 10000))) / 10000).toFixed(1)}%`)
  console.log(`\n  TENNIS, median:`)
  console.log(`    entries ${median(cs.map((c) => c.entries))}` +
    `   titles ${median(cs.map((c) => c.titles))}` +
    `   lost finals ${median(cs.map((c) => c.finals))}`)
  console.log(`    end rank  itf #${median(cs.map((c) => c.endRankItf))}` +
    `   domestic #${median(cs.map((c) => c.endRankDom))}`)
  const wta = cs.map((c) => c.endRankWta).filter((r): r is number => r !== null && r > 0)
  console.log(`    wta ranked: ${wta.length}/${n}` + (wta.length ? `, median #${median(wta)}` : ''))
  const tiers: Record<string, number> = {}
  for (const c of cs) if (c.bestTier) tiers[c.bestTier] = (tiers[c.bestTier] ?? 0) + 1
  console.log(`    best tier ever won: ${Object.entries(tiers).map(([t, k]) => `${t}=${k}`).join(' ') || 'none'}`)
  console.log(`    signed a kit deal: ${cs.filter((c) => c.everSignedKit).length}/${n}`)
}

function main(): void {
  const args = process.argv.slice(2)
  let seeds = DEFAULT_SEEDS
  let weeks = DEFAULT_WEEKS
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seeds') seeds = Number(args[++i])
    if (args[i] === '--weeks') weeks = Number(args[++i])
  }
  console.log(`two-cells: ${seeds} seeds x ${weeks} weeks (${(weeks / WEEKS_PER_YEAR).toFixed(0)} seasons)`)
  console.log(`the local-sponsor cameo as shipped: ${(100 * ECONOMY.sponsor.rollChance).toFixed(0)}% a week, ` +
    `${money(ECONOMY.sponsor.amountCents[0])}-${money(ECONOMY.sponsor.amountCents[1])}, ` +
    `eligible: ${ECONOMY.sponsor.eligible.join('/')}`)

  const all: Array<[Arm, Career[]]> = []
  for (const arm of ARMS) {
    const cs: Career[] = []
    for (let s = 0; s < seeds; s++) cs.push(runCareer(arm, `seed-${s}`, weeks))
    all.push([arm, cs])
    report(arm, cs)
  }

  console.log(`\n${'='.repeat(78)}\nTHE COMPARISON\n${'='.repeat(78)}`)
  for (const [arm, cs] of all) {
    console.log(
      `  ${arm.label.padEnd(30)} end ${money(median(cs.map((c) => c.endFundsCents))).padStart(10)}` +
        `  under water ${pct(cs.filter((c) => c.minFundsCents < 0).length, cs.length).padStart(6)}` +
        `  titles ${String(median(cs.map((c) => c.titles))).padStart(2)}` +
        `  itf #${String(median(cs.map((c) => c.endRankItf))).padStart(3)}`,
    )
  }
}

main()
