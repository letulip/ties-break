// THE OUTGROWN-ENTRY PROBE – how often the deadline release fires, what it reaches the player
// through, and what honouring the entry instead would cost.
//
//   npm run bench:outgrown -- [--seeds N] [--weeks N] [--policy grinder|player|both] [--lookahead N]
//
// ⚠ WHY IT EXISTS. The owner, 05.08: «моя уже 22 летняя выиграла 2 w50 подряд и ее автоматом сняли
// с 3-го письмом без объяснения причины». `releaseOutgrownEntries` (world.ts) cancels a
// still-refundable entry the moment either ceiling closes under her - the domestic band
// (`outgrewTier`) or the ladder's own sliding window (`tierOutgrown`). CLAUDE.md invariant 4 says
// a balance change ships with a measurement, so this is the measurement, and it is deliberately
// runnable on BOTH sides of the fix with the same command: arm A (the tree before) counts the
// releases off the feed rows they write, arm B (the tree after) counts the draws she plays instead.
//
// WHAT IT REPORTS
//   1. FIRE RATE - releases per career, per rung, and the ages they land at.
//   2. THE TWO SURFACES - for the first release of each career, whether the `info` row is still in
//      the SNAPSHOT the UI reads (`world.events.slice(-SNAPSHOT_EVENTS)`, 60 rows) at the end of the
//      week it was written and 1/4/12 weeks later, and whether an inbox letter went out beside it.
//      That is the "he never saw the reason" claim, checked rather than assumed.
//   3. THE COST OF HONOURING IT - draws played at a rung she had already outgrown when she arrived,
//      the points they paid, the longest unbroken run of them, and her peak rank in all three
//      tables. Arm B's delta against arm A is what the change buys or costs.
//
// ⚠ ZERO ENGINE CHANGES AND ZERO EXTRA DRAWS: it reads `world`, it never writes to it. The careers
// are the published bench's own (`econ-bench` presets x policies, the fork answered "continue"),
// so the rank column is comparable with docs/specs/population-1600-2026-08.md §4.
import { PRESETS, POLICIES, ENTRY_LOOKAHEAD, openCareer, stepCareerWeek, mean, median, type Policy } from './econ-bench'
import {
  answerFork,
  answerRetirement,
  enterEvent,
  entryStatus,
  kidPoints,
  outgrewTier,
  tierOutgrown,
  travelCostFor,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const strOf = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const SEEDS = argOf('seeds', 10)
/** 14 -> 30. Long enough to walk the professional rungs (the owner's own case is a 22-year-old)
 *  without paying for the full 24-season endings horizon on every run. */
const WEEKS = argOf('weeks', 16 * WEEKS_PER_YEAR)
const POLICY_ARG = strOf('policy', 'both')
/** HOW EARLY THE PARENT COMMITS, and it is the axis the bench's own policy cannot express.
 *
 *  ⚠ THIS IS THE DIFFERENCE BETWEEN THE BENCH AND THE OWNER. `stepCareerWeek` enters an event only
 *  as its deadline NEARS (`ENTRY_LOOKAHEAD` = 3 weeks), so a bench career is exposed to the ceiling
 *  for at most three weeks between committing and the list closing – and the ceiling therefore
 *  almost never catches a professional entry in that window. A human plans a season: he sees a W50
 *  in the calendar and enters it. Above 3 this probe commits the SAME events the policy would, just
 *  earlier, through the engine's own `enterEvent` and its own gate – nothing is forced past a rule. */
const LOOKAHEAD = argOf('lookahead', ENTRY_LOOKAHEAD)

/** The text `releaseOutgrownEntries` writes. Matched as a PREFIX so the rung label can be read off
 *  the same row - if the copy ever changes this probe reports zero and says so loudly, which is the
 *  honest failure for a tool that measures a string. */
const RELEASE_PREFIX = "Entry released – she's outgrown "

interface Release {
  week: number
  ageYears: number
  tier: TierId | null
  /** was an inbox letter raised the same week for an `entry` offer? */
  letter: boolean
  /** is the row in the snapshot the UI reads, now / +1 / +4 / +12 weeks? */
  inSnapshot: boolean[]
}

interface CareerRow {
  label: string
  policy: string
  seed: string
  releases: Release[]
  /** draws PLAYED at a rung she had already outgrown when she arrived */
  outgrownDraws: number
  outgrownPoints: number
  maxOutgrownRun: number
  drawsByTier: Record<TierId, number>
  outgrownByTier: Record<TierId, number>
  bestWtaRank: number | null
  bestItfRank: number | null
  bestDomesticRank: number | null
  seasons: number
  ended: string | null
}

function zeroByTier(): Record<TierId, number> {
  return Object.fromEntries(TIER_LADDER.map((t) => [t, 0])) as Record<TierId, number>
}

function tierFromLabel(label: string): TierId | null {
  for (const t of TIER_LADDER) if (TIERS[t].label === label) return t
  return null
}

/** Both ceilings, exactly as `releaseOutgrownEntries` asks them – the domestic band and the
 *  ladder's own sliding window. Read here for MEASUREMENT only. */
function outgrownNow(world: WorldState, tier: TierId): boolean {
  return outgrewTier(tier, kidPoints(world, 'domestic')) || tierOutgrown(world, tier)
}

/** The bench's own fork/retirement answers – `continue` at nineteen, her own words at the end, so
 *  the population matches endings-bench's slot-6 rows and the published rank table. */
function answerWhateverIsOpen(world: WorldState): void {
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) {
    answerRetirement(world, world.retirementOffer.reason === 'plateau' || world.retirementOffer.final)
  }
}

/** The early-committer arm: enter what the bench's policy would enter, only sooner. Same gate
 *  (`entryStatus`), same one-tournament-a-week rule, same affordability reading including the
 *  policy's reserve – so anything it commits to is something the shipped engine allowed. */
function commitEarly(world: WorldState, policy: Policy): void {
  if (world.ending) return
  const byRung = [...world.season].sort(
    (a, b) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier),
  )
  for (const e of byRung) {
    if (world.entries.includes(e.id)) continue
    if (world.week > e.deadlineWeek) continue
    const out = e.deadlineWeek - world.week
    if (out > LOOKAHEAD || out <= ENTRY_LOOKAHEAD) continue // the near window is the policy's own job
    if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
    if (entryStatus(world, e).level === 'blocked') continue
    if (world.condition < policy.restFloor) continue
    const cost = TIERS[e.tier].entryFeeCents + travelCostFor(world, e)
    if (world.fundsCents - cost < policy.reserveCents) continue
    enterEvent(world, e.id)
  }
}

function runCareer(presetIndex: number, index: number, policy: Policy): CareerRow {
  const preset = PRESETS[presetIndex]
  const { world, rng, seed } = openCareer(preset, index, policy)
  const row: CareerRow = {
    label: preset.label,
    policy: policy.id,
    seed,
    releases: [],
    outgrownDraws: 0,
    outgrownPoints: 0,
    maxOutgrownRun: 0,
    drawsByTier: zeroByTier(),
    outgrownByTier: zeroByTier(),
    bestWtaRank: null,
    bestItfRank: null,
    bestDomesticRank: null,
    seasons: 0,
    ended: null,
  }
  /** release rows still inside their 12-week snapshot watch */
  const watching: { release: Release; id: number; week: number }[] = []
  let run = 0

  for (let i = 0; i < WEEKS && world.ending === null; i++) {
    if (LOOKAHEAD > ENTRY_LOOKAHEAD) commitEarly(world, policy)
    // What is she about to play, and was that rung already closed under her when she arrived? Taken
    // BEFORE the step because the tick resolves the week: after it, the result's own points have
    // been banked and the ceiling reads a week too late.
    const arriving = world.season.filter((e) => e.week === world.week + 1 && world.entries.includes(e.id))
    const arrivedOutgrown = new Map<string, boolean>()
    for (const e of arriving) arrivedOutgrown.set(e.id, outgrownNow(world, e.tier))
    const eventsBefore = world.events.length
    const offersBefore = world.offers.length
    const resultsBefore = world.results.length

    stepCareerWeek(world, rng, policy)

    // 1. the release rows this week wrote
    for (const e of world.events.slice(eventsBefore)) {
      if (e.type !== 'info' || !e.text.startsWith(RELEASE_PREFIX)) continue
      const label = e.text.slice(RELEASE_PREFIX.length).replace(/\. Fee refunded\.$/, '')
      const letter = world.offers
        .slice(offersBefore)
        .some((o) => o.kind === 'entry')
      const release: Release = {
        week: world.week,
        ageYears: 14 + Math.floor(world.week / WEEKS_PER_YEAR),
        tier: tierFromLabel(label),
        letter,
        inSnapshot: [false, false, false, false],
      }
      row.releases.push(release)
      watching.push({ release, id: e.id, week: world.week })
    }

    // 2. the snapshot watch – the surface the news feed actually reads
    if (watching.length > 0) {
      const snapIds = new Set(toSnapshot(world).events.map((e) => e.id))
      for (let k = watching.length - 1; k >= 0; k--) {
        const w = watching[k]
        const age = world.week - w.week
        const slot = age === 0 ? 0 : age === 1 ? 1 : age === 4 ? 2 : age === 12 ? 3 : null
        if (slot !== null) w.release.inSnapshot[slot] = snapIds.has(w.id)
        if (age >= 12) watching.splice(k, 1)
      }
    }

    // 3. the draws she played, and which of them were at a rung already closed under her
    let playedOutgrownThisWeek = false
    for (const r of world.results.slice(resultsBefore)) {
      if (r.playerId !== KID_ID || !r.tier) continue
      row.drawsByTier[r.tier]++
      const ev = arriving.find((e) => e.tier === r.tier && e.week === r.week)
      if (ev && arrivedOutgrown.get(ev.id)) {
        row.outgrownDraws++
        row.outgrownPoints += r.points
        row.outgrownByTier[r.tier]++
        playedOutgrownThisWeek = true
      }
    }
    if (world.results.length > resultsBefore) {
      run = playedOutgrownThisWeek ? run + 1 : 0
      if (run > row.maxOutgrownRun) row.maxOutgrownRun = run
    }

    // 4. her peak in each table, read only while she actually holds a ranking there
    if (kidPoints(world, 'wta') > 0 && world.kidRankWta != null) {
      if (row.bestWtaRank === null || world.kidRankWta < row.bestWtaRank) row.bestWtaRank = world.kidRankWta
    }
    if (kidPoints(world, 'itf') > 0) {
      if (row.bestItfRank === null || world.kidRank < row.bestItfRank) row.bestItfRank = world.kidRank
    }
    if (kidPoints(world, 'domestic') > 0 && world.kidRankDomestic != null) {
      if (row.bestDomesticRank === null || world.kidRankDomestic < row.bestDomesticRank) {
        row.bestDomesticRank = world.kidRankDomestic
      }
    }

    answerWhateverIsOpen(world)
  }
  row.seasons = world.seasonHistory.length
  row.ended = world.ending?.type ?? null
  return row
}

// --- printing ------------------------------------------------------------------------------------

const padEnd = (s: string, w: number): string => (s.length >= w ? s : s + ' '.repeat(w - s.length))
const pct = (n: number, d: number): string => (d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1).padStart(5)}%`)

function rankLine(label: string, ranks: (number | null)[]): string {
  const held = ranks.filter((r): r is number => r !== null).sort((a, b) => a - b)
  if (held.length === 0) return `  ${padEnd(label, 22)} never ranked`
  const p10 = held[Math.floor(held.length * 0.1)]
  return (
    `  ${padEnd(label, 22)} best #${held[0]} · p10 #${p10} · median #${median(held).toFixed(0)} · ` +
    `worst #${held[held.length - 1]}   (${held.length}/${ranks.length} ever ranked)`
  )
}

function report(rows: CareerRow[], policyLabel: string): void {
  console.log('')
  console.log(`══ ${policyLabel} · ${rows.length} careers · ${WEEKS} weeks each ══`)
  const all = rows.flatMap((r) => r.releases)
  const withAny = rows.filter((r) => r.releases.length > 0)
  console.log('')
  console.log('  1. FIRE RATE – the deadline release')
  console.log(`     careers that saw at least one : ${withAny.length}/${rows.length} (${pct(withAny.length, rows.length).trim()})`)
  console.log(`     releases in total             : ${all.length}` +
    (rows.length ? ` · mean ${(all.length / rows.length).toFixed(2)}/career · worst ${Math.max(0, ...rows.map((r) => r.releases.length))}` : ''))
  if (all.length > 0) {
    const byTier = new Map<string, number>()
    for (const r of all) byTier.set(r.tier ?? '?', (byTier.get(r.tier ?? '?') ?? 0) + 1)
    console.log(`     by rung                      : ` +
      [...byTier.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(' · '))
    const ages = all.map((r) => r.ageYears).sort((a, b) => a - b)
    console.log(`     age it lands at              : median ${median(ages).toFixed(0)} · range ${ages[0]}-${ages[ages.length - 1]}`)
  }
  console.log('')
  console.log('  2. THE TWO SURFACES – what reached the player')
  if (all.length === 0) {
    console.log('     (no releases – nothing to reach him. This is the honoured-entry arm.)')
  } else {
    console.log(`     an inbox LETTER went out     : ${all.filter((r) => r.letter).length}/${all.length} (${pct(all.filter((r) => r.letter).length, all.length).trim()})`)
    const w = all.filter((r) => r.inSnapshot.length === 4)
    const at = (i: number) => `${w.filter((r) => r.inSnapshot[i]).length}/${w.length}`
    console.log(`     the info ROW in the snapshot : same week ${at(0)} · +1w ${at(1)} · +4w ${at(2)} · +12w ${at(3)}`)
    console.log('     (the snapshot is the 60 newest rows – what the News list on Home is built from)')
  }
  console.log('')
  console.log('  3. HONOURING IT – draws played at a rung already closed under her')
  const draws = rows.reduce((n, r) => n + Object.values(r.drawsByTier).reduce((a, b) => a + b, 0), 0)
  const outDraws = rows.reduce((n, r) => n + r.outgrownDraws, 0)
  const outPts = rows.reduce((n, r) => n + r.outgrownPoints, 0)
  console.log(`     draws played                 : ${draws} · of them at an outgrown rung ${outDraws} (${pct(outDraws, draws).trim()})`)
  console.log(`     points those draws paid      : ${outPts} · mean ${outDraws ? (outPts / outDraws).toFixed(1) : '0.0'}/draw`)
  console.log(`     longest unbroken run of them : ${Math.max(0, ...rows.map((r) => r.maxOutgrownRun))} tournaments · mean ${mean(rows.map((r) => r.maxOutgrownRun)).toFixed(2)}`)
  if (outDraws > 0) {
    const byTier = new Map<string, number>()
    for (const r of rows) for (const t of TIER_LADDER) if (r.outgrownByTier[t]) byTier.set(t, (byTier.get(t) ?? 0) + r.outgrownByTier[t])
    console.log(`     by rung                      : ` +
      [...byTier.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(' · '))
  }
  console.log('')
  console.log('  4. WHERE IT LEFT HER')
  console.log(rankLine('peak W rank', rows.map((r) => r.bestWtaRank)))
  console.log(rankLine('peak ITF junior rank', rows.map((r) => r.bestItfRank)))
  console.log(rankLine('peak domestic rank', rows.map((r) => r.bestDomesticRank)))
  console.log(`  ${padEnd('seasons completed', 22)} mean ${mean(rows.map((r) => r.seasons)).toFixed(1)}` +
    ` · careers that ended early ${rows.filter((r) => r.ended !== null).length}/${rows.length}`)
}

export function main(): void {
  const policies = POLICY_ARG === 'both' ? POLICIES : POLICIES.filter((p) => p.id === POLICY_ARG)
  console.log('')
  console.log('THE OUTGROWN-ENTRY PROBE')
  console.log(`  ${PRESETS.length} presets x ${SEEDS} seeds x ${policies.length} ${policies.length === 1 ? 'policy' : 'policies'} · ${WEEKS} weeks (to age ${14 + WEEKS / WEEKS_PER_YEAR})`)
  console.log(
    `  entry lookahead ${LOOKAHEAD} wk` +
      (LOOKAHEAD > ENTRY_LOOKAHEAD ? '  – THE EARLY-COMMITTER ARM (a parent planning a season, not the bench committing late)' : '  – the bench\'s own policy'),
  )
  for (const policy of policies) {
    const rows: CareerRow[] = []
    for (let p = 0; p < PRESETS.length; p++) {
      for (let i = 0; i < SEEDS; i++) rows.push(runCareer(p, i, policy))
    }
    report(rows, `POLICY ${policy.label}`)
  }
  console.log('')
}

// ⚠ vite-node 3.2.4 strips the entry file from `process.argv` – the same guard, for the same measured
// reason, as econ-bench.ts / endings-bench.ts / money-decomposition.ts carry.
const NAMED_ON_THE_COMMAND_LINE =
  process.argv.some((a) => a.includes('outgrown-entry-probe')) ||
  (process.env.npm_lifecycle_script ?? '').includes('outgrown-entry-probe')
if (!process.env.VITEST && NAMED_ON_THE_COMMAND_LINE) {
  main()
}
