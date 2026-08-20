// THE DOMESTIC LADDER, MEASURED – round 23 items 10, 11, 12 and 13.
//
//   npx vite-node tools/domestic-ladder-probe.ts [--seeds N] [--weeks N] [--section A|B|C|D]
//
// Four owner reports about the same three rungs (local / regional / national), measured together
// because they are one ladder and three of the four share a cause:
//
//   A. NATIONS IN A DOMESTIC DRAW (item 10). How many entrants of each domestic event carry her
//      flag today, and how many of the 199-strong cohort could ever carry it. The second number is
//      the one that decides whether "filter the draw to her compatriots" is even expressible.
//   B. UNRANKED IN A NATIONAL DRAW (item 11). The reproduction: the world, the week, the entrant,
//      and whether she legitimately holds no DOMESTIC counting result.
//   C. A RIVAL'S TOTAL ACROSS THE WEEK HE WON (item 12). One named rival's counting results,
//      printed row by row, on the week before and the week after – with the reason any row left.
//   D. CHURN AT THE TOP (item 13). How much of the domestic top-10 at week N is still there at the
//      season wrap, over a sweep of seeds.
//
// MEASUREMENT ONLY. No engine constant is written from here.

import { createWorld, tickWeek, inTrack, KID_ID, skipTournament, closeTournament, enterEvent } from '../src/engine/world'
import { cohortIds } from '../src/engine/world/ladder'
import { computeRanking, windowedBestSum, BEST_N_BY_TRACK, isCountingResult } from '../src/engine/season/ranking'
import type { SeasonResult } from '../src/engine/season/ranking'
import { selectEntrants } from '../src/engine/season/tournament'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { rivalConditions } from '../src/engine/season/rival'
import { rngFromSeed, resumeMain } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { NATION_POOL, COHORT_SIZE } from '../src/engine/season/cohort'
import type { TierId } from '../src/engine/season/types'

/** The onboarding's own twenty-four (`OnboardingWizard.vue`'s COUNTRIES), copied because the engine
 *  may not import a component (invariant 1). `tests/season/wildCard.test.ts` already pins the two
 *  lists against each other by source, so this copy cannot drift silently. */
const PLAYABLE_COUNTRIES = [
  'US', 'GB', 'FR', 'ES', 'IT', 'DE', 'RU', 'RS', 'CH', 'CZ', 'PL', 'UA',
  'KZ', 'BY', 'AU', 'JP', 'CN', 'KR', 'IN', 'BR', 'AR', 'CA', 'NL', 'SE',
]

const arg = (name: string, dflt: number): number => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? Number(process.argv[i + 1]) : dflt
}
const SEEDS = arg('seeds', 5)
const WEEKS = arg('weeks', 60)
const only = (() => {
  const i = process.argv.indexOf('--section')
  return i >= 0 ? process.argv[i + 1].toUpperCase() : null
})()
const DOMESTIC: TierId[] = ['local', 'regional', 'national']

function seedName(i: number): string {
  return `dom-probe-${i}`
}

/** A world walked `weeks` weeks with the kid entering whatever the calendar will let her into –
 *  the "action-laden" arm, so the tables she reads are the tables he reads. */
function walk(seed: string, weeks: number, onWeek?: (w: any) => void): any {
  const world: any = createWorld(seed, DEFAULT_PROFILE)
  world.fundsCents = 5_000_000_00
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) {
    const byRung = [...world.season].sort(
      (a: any, b: any) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier),
    )
    for (const e of byRung as any[]) {
      if (world.entries.includes(e.id)) continue
      if (world.week > e.deadlineWeek || e.deadlineWeek - world.week > 3) continue
      if (world.season.some((x: any) => x.week === e.week && world.entries.includes(x.id))) continue
      try { enterEvent(world, e.id) } catch { /* gated */ }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) { skipTournament(world); closeTournament(world) }
    onWeek?.(world)
  }
  return world
}

/** The very table `drawAiEntrants` positions candidates by: mixed tracks, best-6, kid folded out. */
function aiRankingOf(world: any) {
  return computeRanking(
    world.results.filter((r: SeasonResult) => r.playerId !== KID_ID),
    world.week,
    BEST_N_BY_TRACK.itf,
    cohortIds(world),
  )
}

/** The canonical entrants of `event` at the world's current week, off the event's own sub-stream –
 *  exactly what `drawAiEntrants` builds, without running the bracket. */
function entrantsOf(world: any, event: any) {
  const rng = rngFromSeed(`${world.seed}:aitour:${event.id}`)
  const fatigue = rivalConditions(world.results, world.week)
  return selectEntrants(event, world.cohort, aiRankingOf(world), rng, fatigue)
}

// --- A. NATIONS IN A DOMESTIC DRAW --------------------------------------------------------------
function sectionA(): void {
  console.log('\n=== A. NATIONS IN A DOMESTIC DRAW (item 10) ===')
  console.log('home = her flag; the draw is filled from a 199-strong cohort whose nations are drawn from NATION_POOL.\n')
  // FIRST, THE CEILING: what any playable country could EVER expect, before a draw is made. This is
  // the number that decides whether a filter is expressible at all – the onboarding offers 24
  // countries, `NATION_POOL` is 118 weighted slots over 36 nations, and the cohort is COHORT_SIZE.
  const weights = new Map<string, number>()
  for (const n of NATION_POOL) weights.set(n, (weights.get(n) ?? 0) + 1)
  console.log('playable country -> expected compatriots in a 199-strong cohort (draws: local 8, regional 16, national 32)')
  const line = PLAYABLE_COUNTRIES.map(
    (c) => `${c} ${((COHORT_SIZE * (weights.get(c) ?? 0)) / NATION_POOL.length).toFixed(1)}`,
  ).join('   ')
  console.log(`  ${line}`)
  console.log(`  ⇒ the deepest tennis nation we ship expects ${((COHORT_SIZE * Math.max(...weights.values())) / NATION_POOL.length).toFixed(1)} against a National draw of 32; BY expects 0.0.\n`)
  console.log('seed              country  cohort-compatriots  tier      draw  home-flag entrants')
  for (let s = 0; s < SEEDS; s++) {
    const world = walk(seedName(s), 30)
    const home = world.profile.country
    const compatriots = world.cohort.filter((p: any) => p.nation === home).length
    for (const tier of DOMESTIC) {
      const ev = world.season.find((e: any) => e.tier === tier && e.week >= world.week)
      if (!ev) continue
      const ent = entrantsOf(world, ev)
      const hits = ent.filter((p: any) => p.nation === home).length
      console.log(
        `${seedName(s).padEnd(17)} ${String(home).padEnd(8)} ${String(compatriots).padStart(18)}  ${tier.padEnd(9)} ${String(TIERS[tier].drawSize).padStart(4)}  ${hits} / ${ent.length}`,
      )
    }
  }
}

// --- B. UNRANKED IN A NATIONAL DRAW -------------------------------------------------------------
function sectionB(): void {
  console.log('\n=== B. UNRANKED IN A NATIONAL DRAW (item 11) ===')
  console.log('"Unranked" on the VS card = windowedBestSum(domestic, best-6) === 0 for that entrant (snapshot.ts oppRankIn).\n')
  for (let s = 0; s < SEEDS; s++) {
    const seed = seedName(s)
    const world = walk(seed, WEEKS)
    const ev =
      [...world.season].reverse().find((e: any) => e.tier === 'national' && e.week <= world.week) ??
      world.season.find((e: any) => e.tier === 'national')
    if (!ev) { console.log(`${seed}: no national event in the season`); continue }
    const ent = entrantsOf(world, ev)
    const rows: string[] = []
    let unranked = 0
    for (const p of ent as any[]) {
      const dom = windowedBestSum(world.results, world.week, p.id, BEST_N_BY_TRACK.domestic, inTrack('domestic'))
      const anyRows = world.results.filter((r: SeasonResult) => r.playerId === p.id).length
      const domRows = world.results.filter(
        (r: SeasonResult) => r.playerId === p.id && r.tier !== undefined && TIERS[r.tier].track === 'domestic',
      )
      const counting = domRows.filter(isCountingResult).length
      if (dom === 0) {
        unranked++
        if (rows.length < 4) {
          rows.push(
            `    ${p.id.padEnd(12)} ${String(p.name).padEnd(20)} age ${String(p.ageYears).padStart(2)}  ledger rows ${String(anyRows).padStart(3)}  domestic rows ${String(domRows.length).padStart(2)} (counting ${counting})  domestic pts 0`,
          )
        }
      }
    }
    console.log(`${seed}  week ${world.week}  event ${ev.id}: ${unranked} of ${ent.length} entrants read Unranked in the domestic table`)
    for (const r of rows) console.log(r)
  }
}

// --- C. A RIVAL'S TOTAL ACROSS ONE WEEK ---------------------------------------------------------
//
// ⚠ THE LEDGER MUST BE CAPTURED AT THE WEEK, NEVER RECONSTRUCTED AFTERWARDS. `housekeep` prunes
// `world.results` on the same 52-week rule the window uses, so asking a week-60 world what a rival
// held at week 33 answers "nothing" - the rows are gone. The first version of this section did
// exactly that and printed an empty ledger for a real 120-point fall.
type Snap = { week: number; total: number; rows: SeasonResult[]; counted: SeasonResult[] }

function ledgerAt(world: any, id: string): Snap {
  const week = world.week
  const rows = world.results
    .filter(
      (r: SeasonResult) =>
        r.playerId === id && isCountingResult(r) && r.tier !== undefined && TIERS[r.tier].track === 'domestic' && r.week <= week && week - r.week <= 52,
    )
    .map((r: SeasonResult) => ({ ...r }))
    .sort((a: SeasonResult, b: SeasonResult) => b.points - a.points || b.week - a.week)
  const counted = rows.slice(0, BEST_N_BY_TRACK.domestic)
  return { week, rows, counted, total: counted.reduce((s: number, r: SeasonResult) => s + r.points, 0) }
}

function printSnap(id: string, s: Snap): void {
  console.log(`\n  --- ${id} at week ${s.week}: total ${s.total} (best-${BEST_N_BY_TRACK.domestic} of ${s.rows.length} counting domestic rows in the 52w window) ---`)
  for (const r of s.rows) {
    const counted = s.counted.includes(r)
    console.log(
      `    result week ${String(r.week).padStart(4)}  ${String(r.tier).padEnd(9)} ${String(r.points).padStart(4)} pts  age ${String(s.week - r.week).padStart(2)}w  ${counted ? 'COUNTS' : 'dropped by best-6'}`,
    )
  }
}

function sectionC(): void {
  console.log('\n=== C. A RIVAL\'S DOMESTIC TOTAL ACROSS ONE WEEK (item 12) ===')
  const agg = { falls: 0, byWindow: 0, byBestSix: 0, unexplained: 0, onHerWeek: 0, kidWeeks: 0, weeks: 0, biggest: 0, biggestLine: '' }
  for (let s = 0; s < SEEDS; s++) sectionCSeed(seedName(s), s === 0, agg)
  console.log(`\n${'#'.repeat(96)}`)
  console.log(`ALL ${SEEDS} SEEDS x ${WEEKS} weeks – every fall in the domestic top 3:`)
  console.log(`  falls:                               ${agg.falls}`)
  console.log(`  a row LEFT the 52-week window:       ${agg.byWindow}`)
  console.log(`  a row was PUSHED OUT of the best-6:  ${agg.byBestSix}`)
  console.log(`  ⚠ UNEXPLAINED by either:             ${agg.unexplained}   (anything but 0 is a defect)`)
  console.log(`  landing on a week SHE banked a domestic result: ${agg.onHerWeek} of ${agg.falls}`)
  console.log(`  she banked one on ${agg.kidWeeks} of ${agg.weeks} weeks ⇒ ${((100 * agg.kidWeeks) / agg.weeks).toFixed(0)}% of ALL weeks are "her" weeks`)
  console.log(`  biggest single-week fall: ${agg.biggest} pts   ${agg.biggestLine}`)
}

type Agg = { falls: number; byWindow: number; byBestSix: number; unexplained: number; onHerWeek: number; kidWeeks: number; weeks: number; biggest: number; biggestLine: string }

function sectionCSeed(seed: string, verbose: boolean, agg: Agg): void {
  const history: { week: number; leader: string; points: number; kidDomesticPoints: number }[] = []
  // Every week: the domestic leader, and a FULL ledger snapshot of everybody in the top 3.
  const snaps = new Map<string, Snap[]>()
  walk(seed, WEEKS, (w: any) => {
    const table = computeRanking(w.results, w.week, BEST_N_BY_TRACK.domestic, [...cohortIds(w), KID_ID], inTrack('domestic'))
    const kidRow = w.results.find(
      (r: SeasonResult) => r.playerId === KID_ID && r.week === w.week && r.tier !== undefined && TIERS[r.tier].track === 'domestic',
    )
    history.push({ week: w.week, leader: table[0].playerId, points: table[0].points, kidDomesticPoints: kidRow?.points ?? -1 })
    for (const r of table.slice(0, 3)) {
      const list = snaps.get(r.playerId) ?? []
      list.push(ledgerAt(w, r.playerId))
      snaps.set(r.playerId, list)
    }
  })
  if (verbose) {
    console.log(`seed ${seed}, ${WEEKS} weeks. Domestic leader by week (kid-dom = what SHE banked domestically that week; -1 = no domestic event):`)
    for (const h of history) {
      if (h.week % 4 === 0 || h.kidDomesticPoints >= 0) {
        console.log(`  w${String(h.week).padStart(3)}  leader ${h.leader.padEnd(12)} ${String(h.points).padStart(4)} pts   kid-dom ${h.kidDomesticPoints}`)
      }
    }
  }

  // THE OWNER'S CLAIM, EXACTLY: a week SHE played a domestic event, in which the leader's total fell.
  const kidWeeks = history.filter((h) => h.kidDomesticPoints >= 0).map((h) => h.week)
  const kidTitles = history.filter((h) => h.kidDomesticPoints >= 80).map((h) => h.week)
  if (verbose) {
    console.log(`\nweeks she banked a domestic result: ${kidWeeks.join(', ') || 'none'}`)
    console.log(`of those, deep runs (>= 80 pts): ${kidTitles.join(', ') || 'none'}`)
  }

  // EVERY fall in the domestic top 3, classified. If a single one cannot be accounted for by a row
  // leaving the 52-week window or being pushed out of the best-6, the arithmetic has a defect in it.
  let falls = 0
  let byWindow = 0
  let byBestSix = 0
  let unexplained = 0
  let onHerWeek = 0
  let printed = 0
  for (const [id, list] of snaps) {
    for (let i = 1; i < list.length; i++) {
      const before = list[i - 1]
      const after = list[i]
      if (after.week !== before.week + 1 || after.total >= before.total) continue
      falls++
      const gone = before.counted.filter((r) => !after.rows.some((x) => x.week === r.week && x.points === r.points))
      const demoted = before.counted.filter(
        (r) =>
          after.rows.some((x) => x.week === r.week && x.points === r.points) &&
          !after.counted.some((x) => x.week === r.week && x.points === r.points),
      )
      const added = after.counted.filter((r) => !before.counted.some((x) => x.week === r.week && x.points === r.points))
      const lost = gone.reduce((s, r) => s + r.points, 0) + demoted.reduce((s, r) => s + r.points, 0)
      const gained = added.reduce((s, r) => s + r.points, 0)
      if (gone.length) byWindow++
      if (demoted.length) byBestSix++
      if (before.total - after.total !== lost - gained) unexplained++
      const herWeek = kidWeeks.includes(after.week)
      if (herWeek) onHerWeek++
      if (before.total - after.total > agg.biggest) {
        agg.biggest = before.total - after.total
        agg.biggestLine = `(${seed}, ${id}, w${before.week}→w${after.week}: ${before.total}→${after.total}, out of window: ${gone.map((r) => `${r.tier} ${r.points}`).join(' + ') || 'nothing'})`
      }
      if (verbose && printed < 3) {
        printed++
        console.log(
          `\n${'='.repeat(96)}\n${id}: ${before.total} → ${after.total} pts across week ${before.week} → ${after.week}${herWeek ? '   <<< THE SAME WEEK SHE BANKED A DOMESTIC RESULT' : ''}`,
        )
        printSnap(id, before)
        printSnap(id, after)
        console.log(`\n  LEFT THE 52-WEEK WINDOW:   ${gone.map((r) => `w${r.week} ${r.tier} ${r.points}pts`).join(', ') || 'nothing'}`)
        console.log(`  PUSHED OUT OF THE BEST-6:  ${demoted.map((r) => `w${r.week} ${r.tier} ${r.points}pts`).join(', ') || 'nothing'}`)
        console.log(`  JOINED THE BEST-6:         ${added.map((r) => `w${r.week} ${r.tier} ${r.points}pts`).join(', ') || 'nothing'}`)
        console.log(`  ⇒ ${before.total} → ${after.total}   (accounted: −${lost} +${gained})`)
      }
    }
  }
  agg.falls += falls
  agg.byWindow += byWindow
  agg.byBestSix += byBestSix
  agg.unexplained += unexplained
  agg.onHerWeek += onHerWeek
  agg.kidWeeks += kidWeeks.length
  agg.weeks += WEEKS
  if (verbose) {
    console.log(`\n${'='.repeat(96)}`)
    console.log(`${seed}: falls in the domestic top 3 over ${WEEKS} weeks: ${falls}  (window ${byWindow}, best-6 ${byBestSix}, unexplained ${unexplained}, on her week ${onHerWeek})`)
  }
}

// --- D. CHURN AT THE TOP ------------------------------------------------------------------------
function sectionD(): void {
  console.log('\n=== D. CHURN AT THE TOP OF THE DOMESTIC TABLE (item 13) ===')
  const Y = WEEKS_PER_YEAR
  // TWO SEASONS, because season 1 has a cause season 2 cannot have: the pre-history rows the world
  // opens with sit at weeks -1..-51 and are all out of the 52-week window by week 52. If the churn
  // is the same in season 2 the pre-history is not the explanation.
  const seasons: { label: string; marks: number[]; wrap: number }[] = [
    { label: 'season 1', marks: [8, 16, 26, 36, 44], wrap: Y },
    { label: 'season 2', marks: [Y + 8, Y + 16, Y + 26, Y + 36, Y + 44], wrap: 2 * Y },
  ]
  const end = 2 * Y
  const survivors = new Map<number, number[]>()
  const rows: string[][] = []
  for (let s = 0; s < SEEDS; s++) {
    const seed = seedName(s)
    const snaps = new Map<number, string[]>()
    const prehAt = new Map<number, number>()
    const wanted = new Set<number>([...seasons.flatMap((x) => [...x.marks, x.wrap])])
    const stillInCohort = new Set<string>()
    walk(seed, end, (w: any) => {
      if (w.week === end) for (const p of w.cohort) stillInCohort.add(p.id)
      if (!wanted.has(w.week)) return
      const table = computeRanking(w.results, w.week, BEST_N_BY_TRACK.domestic, [...cohortIds(w), KID_ID], inTrack('domestic'))
      const top = table.slice(0, 10).map((r) => r.playerId)
      snaps.set(w.week, top)
      // How much of THIS top-10 is still standing on a PRE-HISTORY row (result week < 0)?
      prehAt.set(
        w.week,
        top.filter((id) =>
          w.results.some(
            (r: SeasonResult) => r.playerId === id && isCountingResult(r) && r.week < 0 && r.tier !== undefined && TIERS[r.tier].track === 'domestic',
          ),
        ).length,
      )
    })
    const cells: string[] = [seed]
    for (const season of seasons) {
      const endTop = snaps.get(season.wrap) ?? []
      for (const m of season.marks) {
        const kept = (snaps.get(m) ?? []).filter((id) => endTop.includes(id)).length
        ;(survivors.get(m) ?? survivors.set(m, []).get(m)!).push(kept)
        cells.push(`${kept}/10`)
      }
    }
    cells.push(`${prehAt.get(8) ?? 0}/10`, `${prehAt.get(Y) ?? 0}/10`)
    // ⚠ WHICH MECHANISM DID IT. Of the season-2 openers who are gone by the wrap, how many LEFT
    // THE WORLD (the conveyor retired them) rather than merely sliding down the table?
    const startTop = snaps.get(Y + 8) ?? []
    const endTop = snaps.get(end) ?? []
    const dropped = startTop.filter((id) => !endTop.includes(id))
    const retired = dropped.filter((id) => !stillInCohort.has(id)).length
    cells.push(`${retired}/${dropped.length}`)
    rows.push(cells)
  }
  const head = ['seed', ...seasons.flatMap((s) => s.marks.map((m) => `w${m}`)), 'preh@w8', `preh@w${Y}`, 'retired']
  console.log(`\ntop-10 at week N still in the top 10 at that season's wrap (w${Y} / w${end}):\n`)
  console.log(head.map((h, i) => (i === 0 ? h.padEnd(15) : h.padStart(8))).join(''))
  for (const r of rows) console.log(r.map((c, i) => (i === 0 ? c.padEnd(15) : c.padStart(8))).join(''))
  console.log('')
  for (const season of seasons) {
    const line = season.marks
      .map((m) => {
        const v = survivors.get(m) ?? []
        return `w${m}: ${(v.reduce((a, b) => a + b, 0) / Math.max(1, v.length)).toFixed(1)}`
      })
      .join('   ')
    console.log(`  mean survivors to the ${season.label} wrap – ${line}   (out of 10)`)
  }
}

if (!only || only === 'A') sectionA()
if (!only || only === 'B') sectionB()
if (!only || only === 'C') sectionC()
if (!only || only === 'D') sectionD()
