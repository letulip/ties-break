/**
 * round15-read – read the owner's two saves through the game's own import door and print
 * the facts the round-15 playtest list asks about.
 *
 * MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
 *
 * ⚠ THE SAVES ARE PERSONAL AND ARE NEVER COMMITTED, and neither is anything derived from one
 * beyond the aggregate statistics quoted in docs/specs/. Same rule as tools/real-vs-bench.ts.
 *
 * Run:
 *   npx vite-node tools/round15-read.ts -- --save /path/a.tsave [--save /path/b.tsave]
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { ageAtWeek, kidAgeExact, birthdayWeek } from '../src/engine/world/age'
import { WEEKS_PER_YEAR, TIER_LADDER } from '../src/engine/season/calendar'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { SPONSOR_TIERS, standingClears, rungFor, windowLadder, offerChanceFor, seasonSpokenFor } from '../src/engine/offers'
import { weekYear, weekMonth, seasonYear } from '../src/shared/dates'

function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}

async function load(path: string): Promise<WorldState> {
  const bytes = new Uint8Array(readFileSync(path))
  return (await decodeExportFile(bytes)) as WorldState
}

function section(title: string): void {
  console.log(`\n${'='.repeat(78)}\n${title}\n${'='.repeat(78)}`)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const saves: string[] = []
  for (let i = 0; i < args.length; i++) if (args[i] === '--save') saves.push(args[++i])
  if (!saves.length) throw new Error('need at least one --save')

  for (const path of saves) {
    const w = await load(path)
    const name = path.split('/').pop()
    section(`${name}  ·  schema v${w.schemaVersion}  ·  week ${w.week}`)

    // ---- 1. AGE AND BIRTHDAY -------------------------------------------------------------
    const bm = w.profile.birthMonth
    const bd = w.profile.birthDay
    console.log(`\n[1] AGE`)
    console.log(`  birth: day ${bd} of month ${bm}`)
    console.log(`  band  ageAtWeek(${w.week})      = ${ageAtWeek(w.week)}`)
    console.log(`  girl  kidAgeExact(${w.week})    = ${kidAgeExact(w.week, bm, 1).toFixed(2)}`)
    console.log(`  disagreement now: ${ageAtWeek(w.week) - Math.floor(kidAgeExact(w.week, bm, 1))} year(s)`)
    console.log(`  season boundaries – band vs girl, and when the birthday actually lands:`)
    for (let s = 0; s <= Math.floor(w.week / WEEKS_PER_YEAR); s++) {
      const w0 = s * WEEKS_PER_YEAR
      const bwk = birthdayWeek(w0, bm, bd)
      const band0 = ageAtWeek(w0)
      const girl0 = Math.floor(kidAgeExact(w0, bm, 1))
      console.log(
        `   season ${s} (${seasonYear(s)}) w${w0}: band ${band0} · girl ${girl0}` +
          `${band0 !== girl0 ? '  <-- MISMATCH' : ''}` +
          `   birthday week ${bwk} (${bwk === null ? '-' : `month ${weekMonth(bwk)}, ${weekYear(bwk)}`})`,
      )
    }

    // ---- 2. MONEY ------------------------------------------------------------------------
    console.log(`\n[2] MONEY`)
    console.log(`  funds now: ${money(w.fundsCents)}`)
    console.log(`  seasonHistory (${w.seasonHistory.length} rows):`)
    for (const r of w.seasonHistory) {
      console.log(
        `   s${r.seasonIndex} rank #${r.endRank}  pts ${r.points}  ` +
          `${r.wins}W-${r.losses}L  delta ${money(r.fundsDeltaCents)}  end ${money(r.endFundsCents)}` +
          (r.bestFinish !== undefined ? `  best ${r.bestFinish}` : ''),
      )
    }
    // ⚠ VIA `unknown`. `CareerTotals` is a closed interface with no index signature, so the direct
    // assertion is a compile error - it compiled under vite-node, which strips types, and only
    // `vue-tsc -b --force` in `npm run check` ever saw it. Type-level only: the value and everything
    // printed from it are unchanged.
    const totals = w.careerTotals as unknown as Record<string, number> | undefined
    if (totals) console.log(`  careerTotals: ${JSON.stringify(totals)}`)

    // finance categories over the retained window
    const cat: Record<string, number> = {}
    for (const fw of w.financeWeeks)
      for (const [k, v] of Object.entries(fw.byCategory)) cat[k] = (cat[k] ?? 0) + (v as number)
    const first = w.financeWeeks[0]?.week
    const last = w.financeWeeks[w.financeWeeks.length - 1]?.week
    console.log(`  financeWeeks retained: ${w.financeWeeks.length} (w${first}..w${last})`)
    for (const [k, v] of Object.entries(cat).sort((a, b) => a[1] - b[1]))
      console.log(`    ${k.padEnd(16)} ${money(v).padStart(12)}`)

    // ---- 3. SPONSOR / ACADEMY ------------------------------------------------------------
    console.log(`\n[3] OFFERS`)
    for (const o of w.offers) {
      // Same story as `careerTotals` above: `OfferTerms` is a union of closed shapes, so the widen
      // goes through `unknown`.
      const t = o.terms as unknown as Record<string, unknown>
      console.log(
        `   ${o.kind.padEnd(10)} ${o.state.padEnd(8)} arrived w${o.week} deadline w${o.deadlineWeek}` +
          ` ${o.decidedWeek !== undefined ? `decided w${o.decidedWeek}` : ''}` +
          ` ${o.fromWeek !== undefined ? `from w${o.fromWeek}` : ''}` +
          ` ${o.untilWeek !== undefined ? `until w${o.untilWeek}` : ''}` +
          // ⚠ `coveredCents`, WAS `spentCents` - a name that is not on `Offer` at all, so this
          // column took its `-` branch on every row of the round-15 triage and reported nothing
          // where the field had a number. `spentCents` lives on `CareerTotals`; the shop's spend
          // under one deal is `coveredCents`, the same job `AcademySupport.coveredCents` does.
          ` covered ${o.coveredCents !== undefined ? money(o.coveredCents) : '-'}`,
      )
      console.log(`     terms: ${JSON.stringify(t)}`)
    }
    console.log(`  academy: ${w.academy ? JSON.stringify(w.academy) : 'none'}`)

    // ---- 3b. WHICH SPONSOR RUNGS WOULD WRITE TO HER --------------------------------------
    // The owner, 09.08: «у нас 3 тира этих спонсоров, а мне достается только 1 самый первый…
    // у нее кончился контракт, а нового не дали». So: read her standing through the engine's own
    // predicate and print the ladder the last window WOULD have offered.
    const standing = sponsorStandingOf(w)
    console.log(`\n[3b] SPONSOR LADDER`)
    console.log(`  standing: ${JSON.stringify(standing)}`)
    for (const t of SPONSOR_TIERS) {
      const clears = standingClears(standing, t)
      console.log(`    ${t.padEnd(9)} ${clears ? 'CLEARS' : '  -   '}`)
    }
    console.log(`  best rung (rungFor): ${rungFor(standing) ?? 'none'}`)
    console.log(`  window ladder:       ${windowLadder(standing).join(' -> ') || 'empty'}`)
    console.log(`  offer chance at that rung: ${offerChanceFor(standing)}`)
    console.log(`  season already spoken for: ${seasonSpokenFor(w.offers, w.week)?.id ?? 'no'}`)

    // ---- 4. RESULTS / WINS ---------------------------------------------------------------
    console.log(`\n[4] RESULTS  (rolling window: ${w.results.length} rows)`)
    console.log(`  seasonWins ${w.seasonWins} / seasonLosses ${w.seasonLosses}`)
    if (w.seasonRecord) console.log(`  seasonRecord: ${JSON.stringify(w.seasonRecord)}`)
    console.log(`  bestFinishByTier: ${JSON.stringify(w.bestFinishByTier)}`)
    const trophies = w.trophiesByTier as Record<string, { titles?: number[]; finals?: number[] }>
    let titleCount = 0
    let finalCount = 0
    for (const [tier, t] of Object.entries(trophies ?? {})) {
      const ti = t?.titles?.length ?? 0
      const fi = t?.finals?.length ?? 0
      titleCount += ti
      finalCount += fi
      if (ti || fi) console.log(`    ${tier.padEnd(10)} titles ${ti}  lost finals ${fi}`)
    }
    console.log(`  TOTAL titles ${titleCount}, lost finals ${finalCount}`)
    console.log(`  internationalEntryWeeks: ${w.internationalEntryWeeks.length}`)
    console.log(`  proEntryWeeks: ${w.proEntryWeeks.length}`)

    // ---- 5. RANKS / LADDER ---------------------------------------------------------------
    console.log(`\n[5] RANKS`)
    console.log(
      `  itf #${w.kidRank}  domestic #${w.kidRankDomestic ?? '-'}  wta #${w.kidRankWta ?? '-'}` +
        `  onRamp ${JSON.stringify(w.onRampCleared)}`,
    )

    // ---- 6. CALENDAR / FEED --------------------------------------------------------------
    console.log(`\n[6] CALENDAR – what the season actually holds from here`)
    const future = w.season.filter((e) => e.week >= w.week)
    const byTier: Record<string, number> = {}
    for (const e of future) byTier[e.tier] = (byTier[e.tier] ?? 0) + 1
    console.log(`  future events: ${future.length} across weeks ${w.week}..${Math.max(...future.map((e) => e.week), w.week)}`)
    for (const t of TIER_LADDER) if (byTier[t]) console.log(`    ${t.padEnd(10)} ${byTier[t]}`)
    const missing = TIER_LADDER.filter((t) => !byTier[t])
    console.log(`  tiers ABSENT from the remaining season: ${missing.join(', ') || 'none'}`)

    // ---- 7. KIT / EQUIPMENT --------------------------------------------------------------
    console.log(`\n[7] KIT`)
    console.log(`  ${JSON.stringify(w.kit ?? null)}`)

    // ---- 8. BODY / PLAN ------------------------------------------------------------------
    console.log(`\n[8] BODY & PLAN`)
    console.log(`  condition ${w.condition}  injury ${w.injury ? JSON.stringify(w.injury) : 'none'}`)
    console.log(`  injuryHistory ${w.injuryHistory.length}: ${JSON.stringify(w.injuryHistory.slice(-4))}`)
    console.log(`  plan: ${JSON.stringify(w.plan)}`)
    console.log(`  vacations: ${JSON.stringify(w.vacations)}`)
    console.log(`  coachId ${w.coachId ?? 'none'}  coachOnEventWeeks ${w.coachOnEventWeeks}`)
    console.log(`  entries: ${JSON.stringify(w.entries)}`)
    console.log(`  suspendedUntilWeek ${w.suspendedUntilWeek ?? '-'}  penalties ${w.penalties.length}`)

    // ---- 9. SKILLS -----------------------------------------------------------------------
    console.log(`\n[9] SKILLS vs POTENTIAL`)
    const sk = w.skills as unknown as Record<string, number>
    const po = w.potential as unknown as Record<string, number>
    for (const k of Object.keys(sk))
      console.log(
        `    ${k.padEnd(14)} ${String(Math.round(sk[k])).padStart(4)} / ${String(Math.round(po[k])).padStart(4)}` +
          `  (${((sk[k] / po[k]) * 100).toFixed(1)}%)`,
      )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
