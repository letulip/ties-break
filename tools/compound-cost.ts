/* THE COMPOUND COST PROBE – what two rulings cost TOGETHER that neither costs alone.
 *
 * `tests/econ-reach.test.ts`'s 14→18 arm reads 1 of 30 on the assembled tree, against a floor of 12.
 * The two waves in that tree (docs/specs/ladder-floor-2026-08.md, docs/specs/coach-retainer-2026-08.md)
 * were each measured in isolation from the other, so nothing in the record says whether they collide
 * or simply push the same number the same way. This tool runs the SAME fixture the tripwire runs –
 * `middleHigh` (25k · middle · high coach), 30 careers, the grinder policy, 208 weeks – and reports
 * the reach count alongside the money and the entries, so the SHAPE of the loss is visible and not
 * just its size.
 *
 * ⚠ THE ARM IS THE TREE, NOT A FLAG. Reverting a ruling in code to measure it would be a second
 * implementation of it; this file is copied unchanged into a detached worktree per arm
 * (`git worktree add --detach ../tb-arm-* <commit>`) and the ENGINE around it is what differs. The
 * `RUN` banner prints cwd + HEAD for exactly that reason: a number is only attributable if the tree
 * that produced it is on the same line.
 *
 *   baseline     d9efb4e  the assembly before either wave
 *   ladder       6d80792  + fix/ladder-window-floor
 *   coach        d9efb4e + bf00acb  (the coach wave merged onto the same base)
 *   both         HEAD     the assembled tree
 *
 * WHAT IT REPLICATES, and why it is not just `runCareer`: the listening arm needs `stepCareerWeek`'s
 * optional veto, which `runCareer` does not take. So the loop is written out once here, in the same
 * order `runCareer` uses (step, then read), with the H18 reach predicate copied off `reachedTarget`
 * verbatim. `--verify` re-runs the same careers through `runCareer` itself and asserts the reach
 * counts agree, which is what makes the other arms' numbers comparable to the tripwire's own.
 *
 * Usage:
 *   npx vite-node tools/compound-cost.ts                       # the plain arm
 *   npx vite-node tools/compound-cost.ts -- --listen           # + the parent takes his coach's advice
 *   npx vite-node tools/compound-cost.ts -- --float 10000000   # + a wallet that cannot empty ($100k)
 *   npx vite-node tools/compound-cost.ts -- --verify           # cross-check against runCareer
 */
import { execSync } from 'node:child_process'
import {
  PRESETS,
  POLICIES,
  HORIZONS,
  openCareer,
  stepCareerWeek,
  runCareer,
  REACH_PRO_RANK,
  REACH_PRO_POINTS,
  WEEKS_PER_YEAR,
} from './econ-bench'
// ⚠ A NAMESPACE IMPORT AND NOT A NAMED ONE, because this file runs in FOUR trees and two of them
// predate `coachLadderNote` – a named import of a symbol the module does not export is a link-time
// error, so the baseline arm would not start. A namespace read is `undefined` there, which is
// exactly what the pre-wave arms should hear from a coach who has no scheduling voice yet.
import * as worldMod from '../src/engine/world'
import { kidPoints, ageAtWeek, type WorldState } from '../src/engine/world'
import { coachById, tierOf } from '../src/engine/coach'
import { coachManagesLoad } from '../src/engine/coachLoad'
import { TIER_LADDER } from '../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { WorldEventCategory } from '../src/shared/protocol'

const argv = process.argv.slice(2)
const numOf = (name: string, fallback: number): number => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : fallback
}
const has = (name: string): boolean => argv.includes(`--${name}`)

const CAREERS = numOf('careers', 30)
const WEEKS = HORIZONS.find((h) => h.weeks === 208)!.weeks
/** The tripwire's own fixture: the cell where both branches of the tracker fire. */
const preset = PRESETS.find((p) => p.background === 'middle' && p.coachTier === 'high')!
/** The tripwire runs the DEFAULT policy, which is the grinder. Named rather than assumed. */
const policy = POLICIES[0]

const LISTEN = has('listen')
/** ⚠ A PROBE ARM AND NOT A PROPOSAL: cents added to the opening balance so the family can never run
 *  out. It answers one question and only one – is the compound loss FINANCIAL (bills refuse trips and
 *  the ending latches) or PHYSICAL (she plays the wrong events and never develops)? Nothing about it
 *  is shippable and nothing here suggests it should be. */
const FLOAT_CENTS = numOf('float', 0)

/** ⚠ IS ANYBODY BEING PAID TO HAVE A VIEW – the gate `toSnapshot` puts on the coach's opinions, so
 *  this tool cannot hear a line the screen would not print. Copied off tools/ladder-floor.ts, which
 *  is where the listening arm was first measured. */
function coachSays(world: WorldState, e: SeasonEvent): string | null {
  const tier = tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId))
  if (!coachManagesLoad(tier)) return null
  // The scheduling voice only exists on the trees that have it; the pre-wave arms get silence.
  const note = (worldMod as Record<string, unknown>).coachLadderNote
  if (typeof note !== 'function') return null
  return (note as (w: WorldState, e: SeasonEvent, t: string) => string | null)(world, e, tier)
}

/** THE 14→18 REACH PREDICATE, copied verbatim off `reachedTarget`'s pro arm in econ-bench.ts – which
 *  is not exported, and re-deriving it is the one thing this probe must not get wrong. */
function reachedH18(world: WorldState): boolean {
  const points = kidPoints(world, 'itf')
  const hasResults = points > 0
  return (hasResults && world.kidRank <= REACH_PRO_RANK) || points >= REACH_PRO_POINTS
}

interface Row {
  seed: string
  reachedWeek: number | null
  entries: number
  byTier: Record<TierId, number>
  /** every expense category, cumulative over the horizon, as a positive magnitude */
  spendCents: number
  coachingCents: number
  entryCents: number
  travelCents: number
  prizeCents: number
  /** ⚠ THE SAME MONEY, COUNTED ONLY WHILE THE CAREER IS ALIVE. `tickWeek` has no ended-world early
   *  return on purpose (see world/endings.ts) – the LATCH is read at `advanceWeeks`, so the game
   *  stops and the bench does not. With most of this fixture latching bankruptcy inside two seasons,
   *  a horizon-wide spend figure is over half dead-career weeks and is not what any family paid. */
  liveWeeks: number
  liveSpendCents: number
  liveCoachingCents: number
  /** weeks that carried a NON-ZERO coaching charge – the R4 stand-down made visible as a count */
  coachedWeeks: number
  endFundsCents: number
  /** first week fundsCents < 0, or null */
  bankruptWeek: number | null
  /** the W2-ENDINGS latch: the career STOPPED, and its reason */
  endingType: string | null
  endingWeek: number | null
  /** entries the coach argued against (0 unless --listen) */
  vetoed: number
  endRank: number
  endItfPoints: number
  peakItf: number | null
}

function zeroByTier(): Record<TierId, number> {
  return Object.fromEntries(TIER_LADDER.map((t) => [t, 0])) as Record<TierId, number>
}

function run(index: number): Row {
  const { world, rng, seed } = openCareer(preset, index, policy)
  if (FLOAT_CENTS > 0) world.fundsCents += FLOAT_CENTS
  const row: Row = {
    seed,
    reachedWeek: null,
    entries: 0,
    byTier: zeroByTier(),
    spendCents: 0,
    coachingCents: 0,
    entryCents: 0,
    travelCents: 0,
    prizeCents: 0,
    liveWeeks: 0,
    liveSpendCents: 0,
    liveCoachingCents: 0,
    coachedWeeks: 0,
    endFundsCents: 0,
    bankruptWeek: world.fundsCents < 0 ? 0 : null,
    endingType: null,
    endingWeek: null,
    vetoed: 0,
    endRank: 0,
    endItfPoints: 0,
    peakItf: null,
  }
  // ⚠ THE LISTENING ARM IS A PLAYER, NOT A RULE – the same veto tools/ladder-floor.ts measured the
  // ladder wave's §4c arm with. The engine refuses nothing; the parent does what his coach tells him.
  const veto = LISTEN
    ? (w: WorldState, e: SeasonEvent) => {
        const said = coachSays(w, e)
        if (said !== null) row.vetoed++
        return said !== null
      }
    : undefined

  // THE PER-WEEK LEDGER SCAN, and it is a DELTA scan rather than a seen-once one.
  //
  // ⚠ A SEEN-ONCE SCAN LOSES THE ENTRY FEES ENTIRELY, which is a bug this probe shipped for one
  // sweep and which cross-checking against `runCareer`'s own category fold is what caught – $20 a
  // season against the bench's $895. `accrueFinance` FINDS-OR-CREATES a week's row and adds into it,
  // and `enterEvent` books the fee BEFORE the tick, at the week the parent commits. So the fee for a
  // trip committed in week N lands on the row for week N – the row this loop already read and marked
  // seen at the end of step N-1. Every fee after the first week was therefore invisible.
  //
  // The fix is to re-read every live row each step and count only what is NEW, which is correct
  // whatever order the engine accrues in. `financeWeeks` prunes to sixty weeks so a horizon-end read
  // is not available either; the counted map keeps the whole horizon and the ledger keeps the tail.
  const counted = new Map<number, Record<string, number>>()

  for (let i = 0; i < WEEKS; i++) {
    // `stepCareerWeek`'s fourth parameter exists only on the trees that have the ladder wave. The
    // cast is what lets ONE copy of this file run in all four worktrees; undefined is the historical
    // arm byte for byte either way.
    const entered = (
      stepCareerWeek as (w: WorldState, r: unknown, p: unknown, v?: unknown) => Record<TierId, number>
    )(world, rng, policy, veto)
    for (const t of TIER_LADDER) row.byTier[t] += entered[t] ?? 0
    if (row.bankruptWeek === null && world.fundsCents < 0) row.bankruptWeek = world.week
    if (row.reachedWeek === null && reachedH18(world)) row.reachedWeek = world.week
    if (row.endingType === null && world.ending) {
      row.endingType = world.ending.type
      row.endingWeek = world.ending.week
    }
    const itf = kidPoints(world, 'itf')
    if (itf > 0 && (row.peakItf === null || world.kidRank < row.peakItf)) row.peakItf = world.kidRank
    for (const fw of world.financeWeeks) {
      let seen = counted.get(fw.week)
      if (!seen) {
        seen = {}
        counted.set(fw.week, seen)
        // "Alive" is decided by the ending's own WEEK, never by when the row is read.
        if (row.endingWeek === null || fw.week <= row.endingWeek) row.liveWeeks++
      }
      const alive = row.endingWeek === null || fw.week <= row.endingWeek
      for (const [cat, amt] of Object.entries(fw.byCategory) as [WorldEventCategory, number][]) {
        const delta = amt - (seen[cat] ?? 0)
        if (delta === 0) continue
        seen[cat] = amt
        if (delta < 0) row.spendCents += -delta
        if (delta < 0 && alive) row.liveSpendCents += -delta
        // ⚠ THE TRAINING BILL IS TWO ROWS SINCE v44 (docs/specs/split-the-bill-2026-08.md): the
        // coach's labour under 'coaching' and the court's hire under 'facility'. This column means
        // "what training cost", so it sums both and keeps reading the same quantity every compound
        // -cost run before the split measured.
        if ((cat === 'coaching' || cat === 'facility') && delta < 0) {
          row.coachingCents += -delta
          if (alive) row.liveCoachingCents += -delta
        }
        // ...but the WEEK is counted once, off the row every billed week has exactly one of. Counting
        // it on 'coaching' would miss a self-coached family entirely (it has no coach line at all)
        // and counting it on both would double every hired week.
        if (cat === 'facility' && delta < 0) row.coachedWeeks++
        if (cat === 'entry' && delta < 0) row.entryCents += -delta
        if (cat === 'travel' && delta < 0) row.travelCents += -delta
        if (cat === 'prize' && delta > 0) row.prizeCents += delta
      }
    }
  }
  row.entries = Object.values(row.byTier).reduce((a, b) => a + b, 0)
  row.endFundsCents = world.fundsCents
  row.endRank = world.kidRank
  row.endItfPoints = kidPoints(world, 'itf')
  return row
}

const usd = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const mean = (xs: number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length)
const median = (xs: number[]): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function head(): string {
  let rev = '(no git)'
  try {
    rev = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    /* detached / no repo – the cwd is still the attribution */
  }
  return rev
}

const seasons = (CAREERS * WEEKS) / WEEKS_PER_YEAR
const label = `${LISTEN ? ' + LISTENS' : ''}${FLOAT_CENTS > 0 ? ` + FLOAT ${usd(FLOAT_CENTS)}` : ''}`
console.log('')
console.log(`RUN compound-cost · ${process.cwd()} · HEAD ${head()}`)
console.log(`  fixture ${preset.label} · policy ${policy.label} · ${CAREERS} careers x ${WEEKS} weeks${label}`)

const rows: Row[] = []
for (let i = 0; i < CAREERS; i++) rows.push(run(i))

const reached = rows.filter((r) => r.reachedWeek !== null).length
const everRed = rows.filter((r) => r.bankruptWeek !== null).length
const latched = rows.filter((r) => r.endingType === 'bankruptcy').length
const ended = rows.filter((r) => r.endingType !== null).length

console.log('')
const liveSeasons = rows.reduce((s, r) => s + r.liveWeeks, 0) / WEEKS_PER_YEAR
console.log(`  reachedH18 (the tripwire's own number)          : ${reached} of ${CAREERS}`)
console.log(`  season spend                                   : ${usd(rows.reduce((s, r) => s + r.spendCents, 0) / seasons)}`)
console.log(`  ...coaching                                    : ${usd(rows.reduce((s, r) => s + r.coachingCents, 0) / seasons)}`)
console.log(`  ⚠ season spend, LIVE WEEKS ONLY                 : ${usd(rows.reduce((s, r) => s + r.liveSpendCents, 0) / liveSeasons)}`)
console.log(`  ⚠ ...coaching, LIVE WEEKS ONLY                  : ${usd(rows.reduce((s, r) => s + r.liveCoachingCents, 0) / liveSeasons)}`)
console.log(
  `  weeks the coach was BILLED                     : ${rows.reduce((s, r) => s + r.coachedWeeks, 0)} of ${CAREERS * WEEKS} ` +
    `(${((100 * rows.reduce((s, r) => s + r.coachedWeeks, 0)) / (CAREERS * WEEKS)).toFixed(1)}%)`,
)
console.log(`  ...entry fees                                  : ${usd(rows.reduce((s, r) => s + r.entryCents, 0) / seasons)}`)
console.log(`  ...travel                                      : ${usd(rows.reduce((s, r) => s + r.travelCents, 0) / seasons)}`)
console.log(`  prize money / season                           : ${usd(rows.reduce((s, r) => s + r.prizeCents, 0) / seasons)}`)
console.log(`  events entered / season                        : ${(rows.reduce((s, r) => s + r.entries, 0) / seasons).toFixed(1)}`)
const byTier = zeroByTier()
for (const r of rows) for (const t of TIER_LADDER) byTier[t] += r.byTier[t]
console.log(
  `  the tier mix (entries/season)                   : ` +
    TIER_LADDER.filter((t) => byTier[t] > 0)
      .map((t) => `${t} ${(byTier[t] / seasons).toFixed(2)}`)
      .join(' · '),
)
console.log(`  ever under water                               : ${everRed} of ${CAREERS} (${((100 * everRed) / CAREERS).toFixed(1)}%)`)
console.log(`  BANKRUPTCY latched (the career stopped)         : ${latched} of ${CAREERS} (${((100 * latched) / CAREERS).toFixed(1)}%)`)
console.log(`  ...any ending at all                           : ${ended} of ${CAREERS}`)
const redWeeks = rows.filter((r) => r.bankruptWeek !== null).map((r) => r.bankruptWeek!)
if (redWeeks.length) console.log(`  median week she first goes red                  : ${median(redWeeks)}`)
console.log(`  median end funds                               : ${usd(median(rows.map((r) => r.endFundsCents)))}`)
console.log(`  median end ITF points · rank                    : ${median(rows.map((r) => r.endItfPoints))} · #${median(rows.map((r) => r.endRank))}`)
const peaks = rows.map((r) => r.peakItf).filter((p): p is number => p !== null)
console.log(`  peak ITF rank, best / median (of ${peaks.length} ranked)   : #${peaks.length ? Math.min(...peaks) : 0} / #${median(peaks)}`)
if (LISTEN) console.log(`  entries he talked her out of                    : ${rows.reduce((s, r) => s + r.vetoed, 0)}`)
console.log(`  mean reach week (of those that reach)           : ${Math.round(mean(rows.filter((r) => r.reachedWeek !== null).map((r) => r.reachedWeek!)))}`)

// ⚠ THE HARNESS PROOF. Without a veto and without a float this loop must agree with `runCareer`
// career for career, or none of the arms above is comparable to the tripwire that started this.
if (has('verify')) {
  if (LISTEN || FLOAT_CENTS > 0) {
    console.log('')
    console.log('  --verify is meaningless on a modified arm (runCareer has neither a veto nor a float) – skipped')
  } else {
    const ref = Array.from({ length: CAREERS }, (_, i) => runCareer(preset, i, WEEKS, policy))
    const refReached = ref.filter((r) => r.reachedWeek !== null).length
    const mismatch = ref.filter((r, i) => r.reachedWeek !== rows[i].reachedWeek).length
    console.log('')
    console.log(`  VERIFY vs runCareer: reached ${refReached} (probe ${reached}) · per-career reachedWeek mismatches ${mismatch}`)
    const entryMismatch = ref.filter((r, i) => r.entries.total !== rows[i].entries).length
    console.log(`  VERIFY entries: runCareer/season ${(ref.reduce((s, r) => s + r.entries.total, 0) / seasons).toFixed(1)} · mismatching careers ${entryMismatch}`)
    // ⚠ AND THE CATEGORY FOLD, which is what caught the seen-once ledger bug. runCareer folds at the
    // season wrap and therefore stops at the last completed season; this loop runs to the horizon,
    // so the two agree to within the horizon's tail and no further. A category out by an ORDER is
    // the signal, not a few per cent.
    for (const cat of ['coaching', 'entry', 'travel'] as const) {
      const mine = rows.reduce((s, r) => s + (cat === 'coaching' ? r.coachingCents : cat === 'entry' ? r.entryCents : r.travelCents), 0)
      const theirs = ref.reduce((s, r) => s + r.cats[cat], 0)
      const ratio = theirs === 0 ? 0 : mine / theirs
      console.log(`  VERIFY ${cat.padEnd(9)}: probe ${usd(mine / seasons)}/season · runCareer ${usd(theirs / seasons)}/season · ratio ${ratio.toFixed(3)}`)
    }
    if (mismatch > 0) console.log('  ⚠⚠ THE PROBE AND THE BENCH DISAGREE – every number above is void until this reads 0')
  }
}
console.log('')
