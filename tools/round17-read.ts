/**
 * round17-read – read the owner's save through the game's own import door and print the facts the
 * round-17 triage list asks about.
 *
 * MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
 *
 * ⚠ THE SAVE IS PERSONAL AND IS NEVER COMMITTED, and neither is anything derived from one beyond the
 * aggregate statistics quoted in docs/specs/. Same rule as tools/round15-read.ts.
 *
 * Run:
 *   npx vite-node tools/round17-read.ts -- --save ~/Downloads/a.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { birthdayWeek, birthdayTurning, kidAgeAt } from '../src/engine/world/age'
import { proEntryCapUsage, entryCapUsage } from '../src/engine/world/entryCaps'
import { seasonStartWeek } from '../src/engine/world/ledger'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { weekLabel, weekSpan, weekYear, seasonYear, daysInBirthMonth, WEEKS_IN_SEASON } from '../src/shared/dates'

function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}

async function load(path: string): Promise<WorldState> {
  return (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
}

function section(title: string): void {
  console.log(`\n${'='.repeat(78)}\n${title}\n${'='.repeat(78)}`)
}

/** ⚠ #7 WITHOUT A SAVE. The owner's own career cannot answer the question on its own – she is born
 *  15 March and every clock agrees for her – so the claim is put to all 365 birth dates instead.
 *
 *  THE QUERY vs THE PREDICATE. `birthdayTurning` (the predicate: is THIS week her birthday) tries
 *  both candidate calendar years, which is what round-16 #100 gave it. `birthdayWeek` (the query:
 *  WHICH week is her birthday) still asks `weekYear(week)` alone – the MONDAY's year – so where the
 *  two disagree, a surface that asks WHEN gets a different week from the one that fires. */
function sweepBirthdayWeeks(): void {
  section('[#7] THE QUERY AGAINST THE PREDICATE, all 365 birth dates x 8 seasons')
  const seasons = 8
  let dates = 0
  const broken: string[] = []
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= daysInBirthMonth(m); d++) {
      dates++
      for (let s = 0; s < seasons; s++) {
        const w0 = s * WEEKS_PER_YEAR
        // the week that actually fires inside this season, if any
        let fires: number | null = null
        for (let k = w0; k < w0 + WEEKS_PER_YEAR; k++) if (birthdayTurning(k, m, d) !== null) { fires = k; break }
        // what every week of that season is told when it asks
        const answers = new Set<number | null>()
        for (let k = w0; k < w0 + WEEKS_PER_YEAR; k++) answers.add(birthdayWeek(k, m, d))
        for (const a of answers) {
          if (a === fires) continue
          // ⚠ ONLY A DISAGREEMENT INSIDE THE SEASON COUNTS AS "A WEEK EARLY". An answer that lands in
          // a different season is the OTHER failure (a birthday named in a season it does not fall
          // in); both are printed, told apart by the delta.
          broken.push(
            `${String(d).padStart(2)}/${String(m).padStart(2)} s${s}: fires ${fires === null ? 'never' : `w${fires} (${weekLabel(fires)})`}` +
              `  query says ${a === null ? 'null' : `w${a} (${weekLabel(a)})`}` +
              `${a !== null && fires !== null ? `  delta ${a - fires}` : ''}`,
          )
        }
      }
    }
  }
  console.log(`  ${dates} birth dates x ${seasons} seasons`)
  console.log(`  disagreements: ${broken.length}`)
  const byDelta: Record<string, number> = {}
  for (const b of broken) {
    const m = /delta (-?\d+)/.exec(b)
    const k = m ? `delta ${m[1]}` : 'no fire / null'
    byDelta[k] = (byDelta[k] ?? 0) + 1
  }
  for (const [k, v] of Object.entries(byDelta).sort((a, b) => b[1] - a[1])) console.log(`    ${k.padEnd(14)} ${v}`)
  for (const b of broken.slice(0, 30)) console.log(`    ${b}`)
  if (broken.length > 30) console.log(`    ...and ${broken.length - 30} more`)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const saves: string[] = []
  for (let i = 0; i < args.length; i++) if (args[i] === '--save') saves.push(args[++i])
  if (args.includes('--sweep')) sweepBirthdayWeeks()
  if (!saves.length) return

  for (const path of saves) {
    const w = await load(path)
    section(`${path.split('/').pop()}  ·  schema v${w.schemaVersion}  ·  week ${w.week}`)
    const bm = w.profile.birthMonth
    const bd = w.profile.birthDay

    // ---- #7  THE BIRTHDAY WEEK: does every clock name the same week? ---------------------------
    console.log(`\n[#7] BIRTHDAY WEEK  (born ${bd}/${bm}; WEEKS_PER_YEAR=${WEEKS_PER_YEAR}, WEEKS_IN_SEASON=${WEEKS_IN_SEASON})`)
    console.log(`  RECORDED rows (v48 birthdays[], written by chooseGift on the week it fired):`)
    for (const r of w.birthdays ?? [])
      console.log(`    w${r.week} (${weekLabel(r.week)}, ${weekSpan(r.week)})  age ${r.age}  asked ${r.asked}  given ${r.given}`)
    console.log(`  THE PREDICATE (birthdayTurning != null) over every week of the career:`)
    const fired: number[] = []
    for (let k = 0; k <= w.week; k++) if (birthdayTurning(k, bm, bd) !== null) fired.push(k)
    console.log(`    ${fired.map((k) => `w${k}(${weekLabel(k)})`).join(' ')}`)
    console.log(`  THE QUERY (birthdayWeek(seasonStart)) – what a surface asking "which week is it" gets:`)
    for (let s = 0; s * WEEKS_PER_YEAR <= w.week; s++) {
      const w0 = s * WEEKS_PER_YEAR
      const q = birthdayWeek(w0, bm, bd)
      const truth = fired.find((k) => k >= w0 && k < w0 + WEEKS_PER_YEAR)
      console.log(
        `    season ${s} (${seasonYear(s)}) from w${w0}: query w${q} (${q === null ? '-' : weekLabel(q)})` +
          `   predicate ${truth === undefined ? 'NEVER FIRED' : `w${truth} (${weekLabel(truth)})`}` +
          `${q !== (truth ?? null) ? '   <-- DISAGREE' : ''}`,
      )
    }
    console.log(`  ...and the same query asked from EVERY week of the career, against the season it is asked in:`)
    const disagree: string[] = []
    for (let k = 0; k <= w.week; k++) {
      const q = birthdayWeek(k, bm, bd)
      const s = Math.floor(k / WEEKS_PER_YEAR)
      const truth = fired.find((f) => f >= s * WEEKS_PER_YEAR && f < (s + 1) * WEEKS_PER_YEAR)
      if (q !== (truth ?? null)) disagree.push(`w${k}(${weekLabel(k)}) -> w${q} but the season's birthday is w${truth}`)
    }
    console.log(`    ${disagree.length} weeks disagree with their own season's birthday`)
    for (const d of disagree.slice(0, 12)) console.log(`      ${d}`)
    if (disagree.length > 12) console.log(`      ...and ${disagree.length - 12} more`)

    // ---- #2  THE PRO ENTRY CAP ACROSS THE SEASON BOUNDARY -------------------------------------
    console.log(`\n[#2] PRO ENTRY CAP`)
    console.log(`  proEntryWeeks (${w.proEntryWeeks.length}): ${JSON.stringify(w.proEntryWeeks)}`)
    console.log(`  internationalEntryWeeks (${w.internationalEntryWeeks.length}): ${JSON.stringify(w.internationalEntryWeeks)}`)
    console.log(`  now: pro ${JSON.stringify(proEntryCapUsage(w, w.week))}  itf ${JSON.stringify(entryCapUsage(w, w.week))}`)
    console.log(`  per season boundary – the last week of a season and the first of the next:`)
    for (let s = 0; s * WEEKS_PER_YEAR <= w.week; s++) {
      const last = Math.min((s + 1) * WEEKS_PER_YEAR - 1, w.week)
      const first = (s + 1) * WEEKS_PER_YEAR
      const a = proEntryCapUsage(w, last)
      console.log(
        `    s${s} w${last} (${weekLabel(last)}) seasonStart ${seasonStartWeek(last)} age ${kidAgeAt(w, last)}: pro ${a.used}/${a.limit}` +
          (first <= w.week
            ? `   ->  s${s + 1} w${first} (${weekLabel(first)}) seasonStart ${seasonStartWeek(first)} age ${kidAgeAt(w, first)}: pro ${proEntryCapUsage(w, first).used}/${proEntryCapUsage(w, first).limit}`
            : ''),
      )
    }

    // ---- #18  THE GIFT MEMORY -----------------------------------------------------------------
    console.log(`\n[#18] GIFT MEMORY`)
    for (const r of w.birthdays ?? []) console.log(`    age ${r.age}: asked ${r.asked}  given ${r.given}`)

    // ---- #27  DUPLICATE LETTERS ---------------------------------------------------------------
    console.log(`\n[#27] OFFERS BY ARRIVAL WEEK`)
    for (const o of [...w.offers].sort((a, b) => a.week - b.week)) {
      const t = o.terms as unknown as Record<string, unknown>
      console.log(`    w${o.week} (${weekLabel(o.week)}) ${o.kind} ${o.state} brand=${String(t.brand)} tier=${String(t.tier)}`)
    }

    // ---- #13  THE SEASON ROW ------------------------------------------------------------------
    console.log(`\n[#13] SEASON HISTORY – every term the row could print`)
    let prevEnd: number | null = null
    for (const r of w.seasonHistory) {
      const sp = r.spentCents
      const ea = r.earnedCents
      const identity =
        ea !== undefined && sp !== undefined
          ? `  in-spend=${money(ea - sp)} vs delta ${money(r.fundsDeltaCents)} ${ea - sp === r.fundsDeltaCents ? 'OK' : 'MISMATCH'}`
          : '  (gross not recorded)'
      const chain = prevEnd === null ? '' : `  prevEnd+delta=${money(prevEnd + r.fundsDeltaCents)} vs end ${money(r.endFundsCents)} ${prevEnd + r.fundsDeltaCents === r.endFundsCents ? 'OK' : 'MISMATCH'}`
      console.log(
        `    s${r.seasonIndex} (${seasonYear(r.seasonIndex)}) rank #${r.endRank} pts ${r.points} ${r.wins}W-${r.losses}L` +
          `  earned ${ea === undefined ? '-' : money(ea)}  spent ${sp === undefined ? '-' : money(sp)}` +
          `  delta ${money(r.fundsDeltaCents)}  end ${money(r.endFundsCents)}${identity}${chain}`,
      )
      prevEnd = r.endFundsCents
    }

    // ---- #28  WHAT AN ENTRY COSTS -------------------------------------------------------------
    console.log(`\n[#28] ENTRIES NOW`)
    console.log(`    ${JSON.stringify(w.entries)}`)
    console.log(`  the season's remaining events, by tier:`)
    for (const e of w.season.filter((x) => x.week >= w.week).slice(0, 20))
      console.log(`    w${e.week} (${weekLabel(e.week)}) ${e.tier}`)

    // ---- #11  VACATIONS / INJURY --------------------------------------------------------------
    console.log(`\n[#11] PLAN`)
    console.log(`    injury ${w.injury ? JSON.stringify(w.injury) : 'none'}  vacations ${JSON.stringify(w.vacations)}`)

    // ---- #6 / #16  WHICH RANK -----------------------------------------------------------------
    console.log(`\n[#6/#16] RANKS`)
    console.log(`    kidRank(itf) #${w.kidRank}  domestic #${w.kidRankDomestic ?? '-'}  wta #${w.kidRankWta ?? '-'}`)
    console.log(`    seasonHistory endRank (the number "Season NNNN closed at #N" prints): ${w.seasonHistory.map((r) => `${seasonYear(r.seasonIndex)}:#${r.endRank}`).join(' ')}`)
    console.log(`    weekYear(now) ${weekYear(w.week)}  fork ${JSON.stringify(w.fork ?? null)}  ending ${JSON.stringify(w.ending ?? null)}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
