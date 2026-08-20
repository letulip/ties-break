// THE DOMESTIC TABLE, ROLLING-52 vs SEASON-TO-DATE – round 23 items 12 and 13, the owner's ruling.
//
//   npx vite-node tools/domestic-season-to-date.ts [--seeds N] [--weeks N] [--career N]
//                                                  [--section C|D|E|F] [--arm A|B|AB]
//
// He was shown three options for the national table and chose (b): count the season, not a rolling
// 52 weeks. «да, это мелочь, а будет хорошо, мне кажется. Тем более, что первый сезон у нас
// показательный.» This is the before/after for that ruling, in the same shapes the ledger already
// carries so the two are directly comparable:
//
//   C. HIS EXACT SYMPTOM (item 12). Every fall in the domestic top 3 over `seeds x weeks`,
//      classified: a row left the window / a row was pushed out of the best-6 / unexplained. The
//      claim to prove is that the WINDOW column goes to zero and the UNEXPLAINED column stays there.
//   D. CHURN AT THE TOP (item 13). The very table in the ledger: how much of the domestic top-10 at
//      week N is still top-10 at that season's wrap, two seasons, mean of the seeds.
//   E. ⚠ WHAT IT DOES TO HER. Her own domestic points, rank and rung access across a career - the
//      half of the question a table-side measurement cannot answer. If season-to-date makes her
//      climb trivial, or freezes the table, it shows up here.
//   F. THE COST OF A RESET. How many weeks of each season the domestic table is entirely at zero,
//      because in a table where everybody has nothing, competition ranking hands everybody rank 1.
//
// ⚠ THE TWO ARMS ARE ONE TREE AND ONE PROCESS, BY PATCHING `WINDOW_BY_TRACK.domestic` – the licensed
// patch-and-restore idiom `BEST_N_BY_TRACK` already carries for tools/best16-bench.ts and
// tools/ceiling-walk.ts. That is deliberate and it is the CLAUDE.md rule about null results: a
// worktree A/B in a SHARED checkout measures whatever else landed between the two commits, and an A
// arm built before the constant existed is an arm whose reader is missing. Here the reader is
// provably present in both arms because it is the same loaded module, and the only thing that
// differs between them is one string. `--arm A` alone reproduces the ledger's own numbers.
//
// MEASUREMENT ONLY. No engine constant is written from here except the arm switch, which is restored.

import { createWorld, tickWeek, inTrack, KID_ID, skipTournament, closeTournament, enterEvent } from '../src/engine/world'
import { cohortIds, kidLadderRank, hasOutgrown, tierOpenFor } from '../src/engine/world/ladder'
import {
  BEST_N_BY_TRACK,
  WINDOW_BY_TRACK,
  computeRanking,
  isCountingResult,
  windowFromWeek,
  type RankingWindow,
  type SeasonResult,
} from '../src/engine/season/ranking'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { resumeMain } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

const arg = (name: string, dflt: number): number => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? Number(process.argv[i + 1]) : dflt
}
const pick = (name: string, dflt: string): string => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1].toUpperCase() : dflt
}
const SEEDS = arg('seeds', 6)
const WEEKS = arg('weeks', 110)
const CAREER = arg('career', 4 * WEEKS_PER_YEAR)
const only = (() => {
  const i = process.argv.indexOf('--section')
  return i >= 0 ? process.argv[i + 1].toUpperCase() : null
})()
const ARMS: { label: string; window: RankingWindow }[] = (() => {
  const a = { label: 'A rolling52', window: 'rolling52' as RankingWindow }
  const b = { label: 'B seasonToDate', window: 'seasonToDate' as RankingWindow }
  const which = pick('arm', 'AB')
  return which === 'A' ? [a] : which === 'B' ? [b] : [a, b]
})()
const DOMESTIC: TierId[] = ['local', 'regional', 'national']

/** ⚠ THE SAME SEED NAMES THE LEDGER'S OWN NUMBERS WERE MEASURED ON (`tools/domestic-ladder-probe.ts`),
 *  so the A arm here must reproduce them line for line. If it does not, the harness is wrong before
 *  the hypothesis is. */
function seedName(i: number): string {
  return `dom-probe-${i}`
}

/** THE ARM SWITCH. Patch, run, restore – in a `finally`, so a throw inside a section cannot leave the
 *  module patched for the next one. */
function withWindow<T>(window: RankingWindow, fn: () => T): T {
  const before = WINDOW_BY_TRACK.domestic
  WINDOW_BY_TRACK.domestic = window
  try {
    return fn()
  } finally {
    WINDOW_BY_TRACK.domestic = before
  }
}

/** A world walked `weeks` weeks with the kid entering whatever the calendar will let her into – the
 *  "action-laden" arm, so the tables she reads are the tables he reads. Copied from
 *  `tools/domestic-ladder-probe.ts` rather than imported: that file runs its four sections at module
 *  load, so importing it would run them. */
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

function domesticTable(w: any) {
  return computeRanking(
    w.results,
    w.week,
    BEST_N_BY_TRACK.domestic,
    [...cohortIds(w), KID_ID],
    inTrack('domestic'),
    WINDOW_BY_TRACK.domestic,
  )
}

// --- C. EVERY FALL IN THE DOMESTIC TOP 3, CLASSIFIED (item 12) -----------------------------------
//
// ⚠ THE LEDGER IS CAPTURED AT THE WEEK, NEVER RECONSTRUCTED AFTERWARDS – `housekeep` prunes
// `world.results` on the 52-week rule, so asking a week-110 world what a rival held at week 33
// answers "nothing". The original probe learned this the expensive way.
//
// ⚠ AND THE SNAPSHOT'S OWN WINDOW IS THE ARM'S. Classifying a season-to-date fall against a
// hardcoded 52-week ledger would report every wrap as an "unexplained" fall – a measurement of the
// harness, not of the engine. `windowFromWeek` is the engine's own bound, read live.
type Snap = { week: number; total: number; rows: SeasonResult[]; counted: SeasonResult[] }

function ledgerAt(world: any, id: string): Snap {
  const week = world.week
  const from = windowFromWeek(week, WINDOW_BY_TRACK.domestic)
  const rows = world.results
    .filter(
      (r: SeasonResult) =>
        r.playerId === id &&
        isCountingResult(r) &&
        r.tier !== undefined &&
        TIERS[r.tier].track === 'domestic' &&
        r.week <= week &&
        r.week >= from,
    )
    .map((r: SeasonResult) => ({ ...r }))
    .sort((a: SeasonResult, b: SeasonResult) => b.points - a.points || b.week - a.week)
  const counted = rows.slice(0, BEST_N_BY_TRACK.domestic)
  return { week, rows, counted, total: counted.reduce((s: number, r: SeasonResult) => s + r.points, 0) }
}

type Agg = {
  falls: number
  byWindow: number
  byBestSix: number
  unexplained: number
  onHerWeek: number
  kidWeeks: number
  weeks: number
  biggest: number
  biggestLine: string
  atWrap: number
  withinSeason: number
}

function sectionC(): void {
  console.log('\n=== C. EVERY FALL IN THE DOMESTIC TOP 3, CLASSIFIED (item 12) ===')
  console.log(`${SEEDS} seeds x ${WEEKS} weeks per arm. "a row LEFT the window" is his own case: a National title ageing out.\n`)
  const rows: string[] = []
  for (const arm of ARMS) {
    const agg: Agg = { falls: 0, byWindow: 0, byBestSix: 0, unexplained: 0, onHerWeek: 0, kidWeeks: 0, weeks: 0, biggest: 0, biggestLine: '', atWrap: 0, withinSeason: 0 }
    withWindow(arm.window, () => {
      for (let s = 0; s < SEEDS; s++) sectionCSeed(seedName(s), agg)
    })
    console.log(`--- ${arm.label} ---`)
    console.log(`  falls in the domestic top 3:            ${agg.falls}`)
    console.log(`  a row LEFT the window:                  ${agg.byWindow}`)
    console.log(`    ...of those, AT a season wrap:        ${agg.atWrap}`)
    console.log(`    ...⚠ of those, MID-season (his bug):  ${agg.withinSeason}`)
    console.log(`  a row was PUSHED OUT of the best-6:     ${agg.byBestSix}`)
    console.log(`  ⚠ UNEXPLAINED by either:                ${agg.unexplained}   (anything but 0 is a defect)`)
    console.log(`  landing on a week SHE banked a domestic result: ${agg.onHerWeek} of ${agg.falls}`)
    console.log(`  biggest single-week fall: ${agg.biggest} pts   ${agg.biggestLine}`)
    rows.push(
      `${arm.label.padEnd(16)} ${String(agg.falls).padStart(6)} ${String(agg.byWindow).padStart(8)} ${String(agg.withinSeason).padStart(12)} ${String(agg.byBestSix).padStart(9)} ${String(agg.unexplained).padStart(12)} ${String(agg.biggest).padStart(8)}`,
    )
  }
  console.log(`\n${'#'.repeat(96)}`)
  console.log(`arm               falls  byWindow  mid-season   byBest6   unexplained  biggest`)
  for (const r of rows) console.log(r)
}

function sectionCSeed(seed: string, agg: Agg): void {
  const snaps = new Map<string, Snap[]>()
  const kidWeeks: number[] = []
  // ⚠ LAST WEEK'S TOP 3 IS CARRIED FORWARD, AND WITHOUT IT THE WRAP IS INVISIBLE. Snapshotting only
  // THIS week's top 3 loses a player the moment she leaves it, so the pair (w51, w52) never forms and
  // the reset – the one fall season-to-date genuinely does have – silently reports as zero. It bit
  // this harness on the first run: arm B printed 0 falls of every kind, which is the right answer to
  // "does a total fall mid-season" and a wrong answer to "does a total ever fall". Tracking the union
  // keeps every leader observable for one week past her leadership, which is exactly long enough.
  let prevTop: string[] = []
  walk(seed, WEEKS, (w: any) => {
    const table = domesticTable(w)
    const kidRow = w.results.find(
      (r: SeasonResult) => r.playerId === KID_ID && r.week === w.week && r.tier !== undefined && TIERS[r.tier].track === 'domestic',
    )
    if (kidRow) kidWeeks.push(w.week)
    const top = table.slice(0, 3).map((r) => r.playerId)
    for (const id of new Set([...top, ...prevTop])) {
      const list = snaps.get(id) ?? []
      list.push(ledgerAt(w, id))
      snaps.set(id, list)
    }
    prevTop = top
  })
  for (const [id, list] of snaps) {
    for (let i = 1; i < list.length; i++) {
      const before = list[i - 1]
      const after = list[i]
      if (after.week !== before.week + 1 || after.total >= before.total) continue
      agg.falls++
      const gone = before.counted.filter((r) => !after.rows.some((x) => x.week === r.week && x.points === r.points))
      const demoted = before.counted.filter(
        (r) =>
          after.rows.some((x) => x.week === r.week && x.points === r.points) &&
          !after.counted.some((x) => x.week === r.week && x.points === r.points),
      )
      const added = after.counted.filter((r) => !before.counted.some((x) => x.week === r.week && x.points === r.points))
      const lost = gone.reduce((s, r) => s + r.points, 0) + demoted.reduce((s, r) => s + r.points, 0)
      const gained = added.reduce((s, r) => s + r.points, 0)
      if (gone.length) {
        agg.byWindow++
        // A wrap fall is the RULE working – the season's race started again. A mid-season fall is the
        // thing he reported. Under season-to-date the second column must be empty.
        if (after.week % WEEKS_PER_YEAR === 0) agg.atWrap++
        else agg.withinSeason++
      }
      if (demoted.length) agg.byBestSix++
      if (before.total - after.total !== lost - gained) agg.unexplained++
      if (kidWeeks.includes(after.week)) agg.onHerWeek++
      if (before.total - after.total > agg.biggest) {
        agg.biggest = before.total - after.total
        agg.biggestLine = `(${seed}, ${id}, w${before.week}→w${after.week}: ${before.total}→${after.total}, out of window: ${gone.map((r) => `${r.tier} ${r.points}`).join(' + ') || 'nothing'}${after.week % WEEKS_PER_YEAR === 0 ? ' [SEASON WRAP]' : ' [MID-SEASON]'})`
      }
    }
  }
  agg.kidWeeks += kidWeeks.length
  agg.weeks += WEEKS
}

// --- D. CHURN AT THE TOP (item 13) --------------------------------------------------------------
function sectionD(): void {
  console.log('\n=== D. CHURN AT THE TOP OF THE DOMESTIC TABLE (item 13) ===')
  const Y = WEEKS_PER_YEAR
  // ⚠⚠ TWO WRAP MARKS, AND THE SECOND ONE IS NOT PEDANTRY - IT IS THE DIFFERENCE BETWEEN MEASURING
  // THE CHURN AND MEASURING THE RESET. The ledger's own table ends each season at week 52 (`Y`),
  // which is a perfectly good "end of season 1" reading of a ROLLING table. Under season-to-date
  // week 52 is `seasonStartWeek(52)` - it is season TWO's week zero, and the table there is empty by
  // construction, so every survivor count against it reads 0/10 and the arm looks like total churn
  // when it is in fact perfectly stable. The season's LAST week is 51. Both are printed: `w52` so
  // the A arm reproduces docs/rounds/round-23.md #13 line for line, `w51` because it is the number
  // the two arms may honestly be compared on.
  const seasons: { label: string; marks: number[]; wrap: number; lastWeek: number }[] = [
    { label: 'season 1', marks: [8, 16, 26, 36, 44], wrap: Y, lastWeek: Y - 1 },
    { label: 'season 2', marks: [Y + 8, Y + 16, Y + 26, Y + 36, Y + 44], wrap: 2 * Y, lastWeek: 2 * Y - 1 },
  ]
  const end = 2 * Y
  for (const arm of ARMS) {
    const survivors = new Map<number, number[]>()
    const lastSurvivors = new Map<number, number[]>()
    const rows: string[][] = []
    withWindow(arm.window, () => {
      for (let s = 0; s < SEEDS; s++) {
        const seed = seedName(s)
        const snaps = new Map<number, string[]>()
        const prehAt = new Map<number, number>()
        const wanted = new Set<number>([...seasons.flatMap((x) => [...x.marks, x.wrap, x.lastWeek])])
        const stillInCohort = new Set<string>()
        walk(seed, end, (w: any) => {
          if (w.week === end) for (const p of w.cohort) stillInCohort.add(p.id)
          if (!wanted.has(w.week)) return
          const top = domesticTable(w).slice(0, 10).map((r) => r.playerId)
          snaps.set(w.week, top)
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
          const lastTop = snaps.get(season.lastWeek) ?? []
          for (const m of season.marks) {
            const at = snaps.get(m) ?? []
            const kept = at.filter((id) => endTop.includes(id)).length
            ;(survivors.get(m) ?? survivors.set(m, []).get(m)!).push(kept)
            const keptLast = at.filter((id) => lastTop.includes(id)).length
            ;(lastSurvivors.get(m) ?? lastSurvivors.set(m, []).get(m)!).push(keptLast)
            cells.push(`${kept}/${keptLast}`)
          }
        }
        cells.push(`${prehAt.get(8) ?? 0}/10`, `${prehAt.get(Y) ?? 0}/10`)
        // ⚠ AGAINST THE SEASON'S LAST WEEK, for the reason the two wrap marks exist: measured against
        // the reset week every opener is "dropped" and the column stops answering its own question,
        // which is «is it the conveyor retiring them, or are they merely losing points?».
        const startTop = snaps.get(Y + 8) ?? []
        const endTop = snaps.get(end - 1) ?? []
        const dropped = startTop.filter((id) => !endTop.includes(id))
        cells.push(`${dropped.filter((id) => !stillInCohort.has(id)).length}/${dropped.length}`)
        rows.push(cells)
      }
    })
    const head = ['seed', ...seasons.flatMap((s) => s.marks.map((m) => `w${m}`)), 'preh@w8', `preh@w${Y}`, 'retired']
    console.log(`\n--- ${arm.label} --- top-10 at week N still in the top 10 at [the wrap w${Y}/w${end}] / [the season's LAST week w${Y - 1}/w${end - 1}]:\n`)
    console.log(head.map((h, i) => (i === 0 ? h.padEnd(15) : h.padStart(8))).join(''))
    for (const r of rows) console.log(r.map((c, i) => (i === 0 ? c.padEnd(15) : c.padStart(8))).join(''))
    console.log('')
    const mean = (m: number, src: Map<number, number[]>) => {
      const v = src.get(m) ?? []
      return (v.reduce((a, b) => a + b, 0) / Math.max(1, v.length)).toFixed(1)
    }
    for (const season of seasons) {
      console.log(`  mean survivors to the ${season.label} WRAP  (w${season.wrap})     – ${season.marks.map((m) => `w${m}: ${mean(m, survivors)}`).join('   ')}   (out of 10)`)
      console.log(`  mean survivors to the ${season.label} LAST WEEK (w${season.lastWeek}) – ${season.marks.map((m) => `w${m}: ${mean(m, lastSurvivors)}`).join('   ')}   (out of 10)`)
    }
  }
}

// --- E. ⚠ WHAT IT DOES TO HER --------------------------------------------------------------------
type CareerRow = {
  seed: string
  arm: string
  perSeason: { best: number | null; median: number | null; endPoints: number; peakPoints: number; sponsorRead: number }[]
  j30Week: number | null
  outgrewLocalWeek: number | null
  localReopenWeeks: number
  unrankedWeeks: number
  domWeeks: number
}

function sectionE(): void {
  console.log('\n=== E. ⚠ WHAT IT DOES TO HER (the owner\'s fourth question) ===')
  console.log(`${SEEDS} seeds x ${CAREER} weeks (${CAREER / WEEKS_PER_YEAR} seasons) per arm.`)
  console.log('dom rank = `kidLadderRank(world, "domestic")`, i.e. exactly what the Kid/Home/Stats screens print (null = Unranked).')
  console.log('sponsor read = her domestic points at w47 of that season – the week `sponsorWindowOpensAt` reads her national standing.\n')
  const all: CareerRow[] = []
  for (const arm of ARMS) {
    withWindow(arm.window, () => {
      for (let s = 0; s < SEEDS; s++) all.push(careerOf(seedName(s), arm.label))
    })
  }
  const seasons = CAREER / WEEKS_PER_YEAR
  const head =
    'seed           arm             ' +
    Array.from({ length: seasons }, (_, i) => `s${i + 1} best/med`.padStart(13)).join('') +
    '   J30 latch  outgrew local  local re-opens  Unranked wks'
  console.log(head)
  for (const r of all) {
    const cells = r.perSeason
      .map((s) => `${s.best ?? '–'}/${s.median ?? '–'}`.padStart(13))
      .join('')
    console.log(
      `${r.seed.padEnd(15)}${r.arm.padEnd(16)}${cells}   ${String(r.j30Week ?? '–').padStart(9)}  ${String(r.outgrewLocalWeek ?? '–').padStart(13)}  ${String(r.localReopenWeeks).padStart(14)}  ${String(`${r.unrankedWeeks}/${r.domWeeks}`).padStart(12)}`,
    )
  }
  console.log('')
  for (const arm of ARMS) {
    const mine = all.filter((r) => r.arm === arm.label)
    const meanBest = (i: number) => {
      const v = mine.map((r) => r.perSeason[i]?.best).filter((x): x is number => x != null)
      return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '–'
    }
    const meanPts = (i: number) => {
      const v = mine.map((r) => r.perSeason[i]?.peakPoints ?? 0)
      return (v.reduce((a, b) => a + b, 0) / Math.max(1, v.length)).toFixed(0)
    }
    const meanSponsor = (i: number) => {
      const v = mine.map((r) => r.perSeason[i]?.sponsorRead ?? 0)
      return (v.reduce((a, b) => a + b, 0) / Math.max(1, v.length)).toFixed(0)
    }
    const latched = mine.map((r) => r.j30Week).filter((x): x is number => x != null)
    console.log(`  ${arm.label}:`)
    console.log(`    mean BEST domestic rank per season: ${Array.from({ length: seasons }, (_, i) => `s${i + 1} ${meanBest(i)}`).join('   ')}`)
    console.log(`    mean PEAK domestic points/season:   ${Array.from({ length: seasons }, (_, i) => `s${i + 1} ${meanPts(i)}`).join('   ')}`)
    console.log(`    mean domestic points at w47 (spons):${Array.from({ length: seasons }, (_, i) => `s${i + 1} ${meanSponsor(i)}`).join('   ')}`)
    console.log(`    ITF on-ramp latched: ${latched.length}/${mine.length} careers, mean week ${latched.length ? (latched.reduce((a, b) => a + b, 0) / latched.length).toFixed(0) : '–'}`)
    console.log(`    weeks she reads Unranked domestically: ${(mine.reduce((a, r) => a + r.unrankedWeeks, 0) / Math.max(1, mine.length)).toFixed(0)} of ${CAREER}`)
    console.log(`    weeks Local is open to her AFTER she first outgrew it: ${(mine.reduce((a, r) => a + r.localReopenWeeks, 0) / Math.max(1, mine.length)).toFixed(0)}`)
  }
}

function careerOf(seed: string, arm: string): CareerRow {
  const seasons = CAREER / WEEKS_PER_YEAR
  const perSeasonRanks: number[][] = Array.from({ length: seasons }, () => [])
  const perSeasonPts: number[][] = Array.from({ length: seasons }, () => [])
  const sponsorRead: number[] = Array.from({ length: seasons }, () => 0)
  let j30Week: number | null = null
  let outgrewLocalWeek: number | null = null
  let localReopenWeeks = 0
  let unrankedWeeks = 0
  walk(seed, CAREER, (w: any) => {
    const si = Math.floor(w.week / WEEKS_PER_YEAR)
    if (si >= seasons) return
    const rank = kidLadderRank(w, 'domestic')
    const domPts = domesticPointsOf(w)
    if (rank == null) unrankedWeeks++
    else perSeasonRanks[si].push(rank)
    perSeasonPts[si].push(domPts)
    if (w.week % WEEKS_PER_YEAR === 47) sponsorRead[si] = domPts
    if (j30Week == null && w.onRampCleared?.itf) j30Week = w.week
    const outLocal = hasOutgrown(w, 'local')
    if (outgrewLocalWeek == null && outLocal) outgrewLocalWeek = w.week
    // ⚠ THE RESET'S OWN RISK, COUNTED: once she has outgrown Local, how many weeks does the ladder
    // put her back inside it? On a rolling window this is ~0 by construction; a season reset can
    // re-open the beginner rung every January.
    if (outgrewLocalWeek != null && !outLocal && tierOpenFor(w, 'local')) localReopenWeeks++
  })
  const med = (xs: number[]): number | null => {
    if (!xs.length) return null
    const s = [...xs].sort((a, b) => a - b)
    return s[Math.floor(s.length / 2)]
  }
  return {
    seed,
    arm,
    perSeason: perSeasonRanks.map((ranks, i) => ({
      best: ranks.length ? Math.min(...ranks) : null,
      median: med(ranks),
      endPoints: perSeasonPts[i][perSeasonPts[i].length - 1] ?? 0,
      peakPoints: perSeasonPts[i].length ? Math.max(...perSeasonPts[i]) : 0,
      sponsorRead: sponsorRead[i],
    })),
    j30Week,
    outgrewLocalWeek,
    localReopenWeeks,
    unrankedWeeks,
    domWeeks: CAREER,
  }
}

/** Her domestic total, folded exactly as the engine folds it – through the arm's own window. */
function domesticPointsOf(w: any): number {
  const row = domesticTable(w).find((r) => r.playerId === KID_ID)
  return row?.points ?? 0
}

// --- F. THE COST OF A RESET ----------------------------------------------------------------------
function sectionF(): void {
  console.log('\n=== F. THE COST OF A RESET: weeks the domestic table has NOBODY on it ===')
  console.log('⚠ WHY THIS IS NOT COSMETIC. Competition ranking gives every member of a tie the same place, so a table')
  console.log('   where all 200 rows read 0 pts is a table where all 200 read "#1". `world.kidRankDomestic` is written')
  console.log('   from that fold and `sponsors.ts` reads the cache as `nationalRank`. This counts the exposure.\n')
  for (const arm of ARMS) {
    let flat = 0
    let total = 0
    let kidRank1 = 0
    const perSeed: string[] = []
    withWindow(arm.window, () => {
      for (let s = 0; s < SEEDS; s++) {
        let f = 0
        const flatWeeks: number[] = []
        walk(seedName(s), 2 * WEEKS_PER_YEAR, (w: any) => {
          total++
          const table = domesticTable(w)
          if (table.every((r) => r.points === 0)) {
            f++
            flat++
            flatWeeks.push(w.week)
            if (w.kidRankDomestic === 1) kidRank1++
          }
        })
        perSeed.push(`${seedName(s)}: ${f} flat weeks${f ? ` (${flatWeeks.join(',')})` : ''}`)
      }
    })
    console.log(`--- ${arm.label} --- ${flat} of ${total} weeks the whole domestic table is at zero; kidRankDomestic cached as 1 on ${kidRank1} of them`)
    for (const p of perSeed) console.log(`    ${p}`)
    console.log('    ⚠ sponsors read her national rank at week 47 of each season (sponsorWindowOpensAt), the FULLEST week of a season-to-date table – see E.')
  }
}

// --- G. HIS OWN ROW, SIDE BY SIDE ----------------------------------------------------------------
//
// The ledger's headline case for item 12: `dom-probe-3`, `ai-80`, week 17 -> 18, 600 -> 400, cause
// printed beside it as `out of window: national 200`. A summary that says "0 mid-season falls" is a
// claim ABOUT his case; this prints the case itself, row by row, in both arms.
function sectionG(): void {
  console.log('\n=== G. HIS OWN ROW – dom-probe-3 / ai-80 / week 17 → 18 ===')
  for (const arm of ARMS) {
    withWindow(arm.window, () => {
      const seen: Snap[] = []
      walk('dom-probe-3', 19, (w: any) => {
        if (w.week === 17 || w.week === 18) seen.push(ledgerAt(w, 'ai-80'))
      })
      console.log(`\n--- ${arm.label} ---`)
      for (const s of seen) {
        console.log(`  ai-80 at week ${s.week}: total ${s.total}  (best-6 of ${s.rows.length} counting domestic rows in the window, from w${windowFromWeek(s.week, WINDOW_BY_TRACK.domestic)})`)
        for (const r of s.rows) {
          const counted = s.counted.includes(r)
          console.log(`      result week ${String(r.week).padStart(4)}  ${String(r.tier).padEnd(9)} ${String(r.points).padStart(4)} pts  age ${String(s.week - r.week).padStart(2)}w  ${counted ? 'COUNTS' : 'dropped by best-6'}`)
        }
      }
      if (seen.length === 2) {
        const d = seen[1].total - seen[0].total
        console.log(`  ⇒ ${seen[0].total} → ${seen[1].total}   (${d < 0 ? `FELL by ${-d}` : d > 0 ? `rose by ${d}` : 'unchanged'})`)
      }
    })
  }
}

console.log(`arms: ${ARMS.map((a) => a.label).join(' vs ')}   (WINDOW_BY_TRACK.domestic ships as '${WINDOW_BY_TRACK.domestic}')`)
console.log(`domestic rungs: ${DOMESTIC.map((t) => `${t} ${TIERS[t].points[0]}pts band[${TIERS[t].enterPointBand[0]}, ${TIERS[t].enterPointBand[1] === Number.MAX_SAFE_INTEGER ? '∞' : TIERS[t].enterPointBand[1]}]`).join('   ')}`)
if (!only || only === 'C') sectionC()
if (!only || only === 'D') sectionD()
if (!only || only === 'E') sectionE()
if (!only || only === 'F') sectionF()
if (!only || only === 'G') sectionG()
