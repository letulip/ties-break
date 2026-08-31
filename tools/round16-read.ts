/**
 * round16-read – read the owner's save through the game's own import door and REPRODUCE the four
 * round-16 findings that had to be measured before they could be fixed (#3, #6, #16, #2).
 *
 * MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
 *
 * ⚠ THE SAVE IS PERSONAL AND IS NEVER COMMITTED, and neither is anything derived from one beyond the
 * aggregate statistics quoted in docs/specs/. Same rule as tools/round15-read.ts.
 *
 * Run:
 *   npx vite-node tools/round16-read.ts -- --save /path/a.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { ageAtWeek, kidAgeAt } from '../src/engine/world/age'
import { TIERS, TIER_LADDER, isTierAgeOpen, isExamWeek, isSummerWeek, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { rankableTotal, BEST_N_BY_TRACK, windowSlots, type SeasonResult } from '../src/engine/season/ranking'
import { rankingFor, fieldProsOf, tierFloorOpen, tierOutgrown } from '../src/engine/world/ladder'
import { summerBlockWeek } from '../src/engine/world/summer'
import { schoolIsOver } from '../src/engine/kidLife'
import { universeForTier } from '../src/engine/season/fieldPros'
import { weekFieldExclusion, firstRoundOpponent, buildDraw, kidSeedIndexIn, selectEntrants } from '../src/engine/season/tournament'
import { rivalConditions, rivalMatchPlayer } from '../src/engine/season/rival'
import { previewEvent } from '../src/engine/season/preview'
import { kidMatchPlayerFor } from '../src/engine/world/player'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { weekLabel, weekMonth } from '../src/shared/dates'
import { KID_ID } from '../src/engine/world/constants'

async function load(path: string): Promise<WorldState> {
  const bytes = new Uint8Array(readFileSync(path))
  return (await decodeExportFile(bytes)) as WorldState
}

function section(title: string): void {
  console.log(`\n${'='.repeat(90)}\n${title}\n${'='.repeat(90)}`)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const saves: string[] = []
  for (let i = 0; i < args.length; i++) if (args[i] === '--save') saves.push(args[++i])
  if (!saves.length) throw new Error('need at least one --save')

  for (const path of saves) {
    const w = await load(path)
    section(`${path.split('/').pop()}  ·  schema v${w.schemaVersion}  ·  week ${w.week}`)

    // ---- #2  THE BAND AND THE GIRL -------------------------------------------------------------
    console.log(`\n[#2] AGE: which rungs the BAND opens and HER OWN AGE does not`)
    const bm = w.profile.birthMonth
    console.log(`  birthMonth ${bm}  ·  band ageAtWeek(${w.week}) = ${ageAtWeek(w.week)}  ·  real kidAgeAt = ${kidAgeAt(w, w.week)}`)
    for (let week = 0; week <= w.week + 60; week += 1) {
      const band = ageAtWeek(week)
      const real = kidAgeAt(w, week)
      if (band === real) continue
      const disagree = TIER_LADDER.filter((t) => isTierAgeOpen(t, band) !== isTierAgeOpen(t, real))
      if (!disagree.length) continue
      console.log(`   w${week} (${weekLabel(week)}): band ${band} vs real ${real} -> band opens ${disagree.join(', ')}`)
      week += 51 // one report per stretch is enough
    }
    console.log(`  minAgeYears by rung: ${TIER_LADDER.map((t) => `${t}=${TIERS[t].minAgeYears ?? '-'}`).join(' ')}`)

    // ---- #16 SCHOOL IN AUGUST ------------------------------------------------------------------
    console.log(`\n[#16] SCHOOL / HOLIDAYS: every week whose Monday is in JULY or AUGUST`)
    console.log(`  (summer window is SEASON weeks ${25}..${33}; the calendar shows REAL dates)`)
    for (let week = 0; week <= w.week + 60; week++) {
      const m = weekMonth(week)
      if (m !== 7 && m !== 8 && m !== 9) continue
      if (m === 9 && weekMonth(week - 1) === 9) continue
      const offset = ((week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
      const summer = isSummerWeek(week)
      const over = schoolIsOver(week, bm)
      const flag = m === 8 && !summer && !over ? '   <-- SCHOOL IN AUGUST' : ''
      console.log(
        `   w${String(week).padStart(3)} off ${String(offset).padStart(2)} ${weekLabel(week)}` +
          `  summer=${summer ? 'Y' : 'n'} exam=${isExamWeek(week, over) ? 'Y' : 'n'} pastSchool=${over ? 'Y' : 'n'}${flag}`,
      )
    }

    // ---- #3  THE PROFESSIONAL TABLE'S ZERO ------------------------------------------------------
    console.log(`\n[#3] PROFESSIONAL TABLE: what §VIII.A.2.b does to her first professional results`)
    const hers = w.results
      .filter((r) => r.playerId === KID_ID && r.tier !== undefined && TIERS[r.tier].track === 'wta' && r.points > 0)
      .sort((a, b) => a.week - b.week)
    console.log(`  W-track scoring rows still inside the 52-week window: ${hers.length}`)
    const acc: SeasonResult[] = []
    for (const r of hers) {
      acc.push(r)
      const sorted = acc.slice().sort((a, b) => b.points - a.points || b.week - a.week)
      const counted = windowSlots(sorted, BEST_N_BY_TRACK.wta)
      const raw = counted.reduce((s, x) => s + x.points, 0)
      const shown = rankableTotal(counted)
      console.log(
        `   after event ${String(acc.length).padStart(2)} (w${r.week} ${r.tier} +${r.points}):` +
          ` result rows sum ${String(raw).padStart(5)}   TABLE SHOWS ${String(shown).padStart(5)}` +
          `${shown === 0 && raw > 0 ? '   <-- 0 ON THE TABLE, POINTS ON THE ROW' : ''}`,
      )
    }
    console.log(`  live kidRankWta ${w.kidRankWta ?? '-'} ; wta table points now:`)
    const wtaRow = rankingFor(w, 'wta').find((r) => r.playerId === KID_ID)
    console.log(`   ${JSON.stringify(wtaRow)}`)

    // ---- #6  THE EMPTY W CARD -------------------------------------------------------------------
    console.log(`\n[#6] W-CARD PREVIEWS: every future W event, previewed exactly as upcomingEvents does`)
    const conditions = rivalConditions(w.results, w.week)
    const wtaRanking = rankingFor(w, 'wta')
    const pros = fieldProsOf(w)
    const future = w.season.filter((e) => e.week > w.week && TIERS[e.tier].track === 'wta').sort((a, b) => a.week - b.week)
    console.log(`  future W events in the loaded season: ${future.length}`)
    let empties = 0
    let throws = 0
    for (const e of future) {
      const universe = universeForTier(e.tier, w.cohort, pros)
      const excluded = weekFieldExclusion(e, w.season, universe, wtaRanking, w.seed, conditions)
      const kid = kidMatchPlayerFor(w, e.surface)
      // The field the card's draw is built from, so a SHORT field is visible as a number.
      const rng = rngFromSeed(`${w.seed}:kidtour:${e.id}`)
      const entrants = selectEntrants(e, universe, wtaRanking, rng, conditions, excluded).map((p) =>
        rivalMatchPlayer(p, e.surface, ECONOMY.condition.max),
      )
      const drawSize = TIERS[e.tier].drawSize
      const drawn = buildDraw(e, entrants, kid, kidSeedIndexIn(entrants, wtaRanking, kid.id), rng)
      const holes = drawn.filter((p) => p === undefined).length
      let opp: string
      try {
        const o = firstRoundOpponent(drawn, kid)
        opp = o ? o.name : 'NONE'
      } catch (err) {
        opp = `THREW: ${(err as Error).message}`
        throws++
      }
      let previewLine: string
      try {
        const p = previewEvent(
          { seed: w.seed, week: w.week, cohort: universe, results: w.results },
          e,
          wtaRanking,
          kid,
          excluded,
        )
        // ROUND 31 #4: no draw before week − 1, so a far-out card has no chance and no name.
        previewLine = p.drawMade
          ? `chance ${((p.firstMatchChance ?? 0) * 100).toFixed(0)}% vs "${p.opponentName}" (${p.fieldStrength})`
          : `no draw yet (${p.fieldStrength})`
        if (p.drawMade && p.opponentName === '') empties++
      } catch (err) {
        previewLine = `PREVIEW THREW: ${(err as Error).message}`
        throws++
      }
      const bad = opp === 'NONE' || holes > 0 || previewLine.includes('THREW') || previewLine.includes('""')
      console.log(
        `   w${String(e.week).padStart(3)} ${e.tier.padEnd(6)} draw ${String(drawSize).padStart(3)}` +
          ` entrants ${String(entrants.length).padStart(3)} excluded ${String(excluded.size).padStart(3)}` +
          ` drawn ${String(drawn.length).padStart(3)} holes ${holes}  ${previewLine}${bad ? '   <-- ' : ''}`,
      )
    }
    console.log(`  empty-opponent W cards: ${empties}   throwing: ${throws}`)

    // ---- context -------------------------------------------------------------------------------
    console.log(`\n[ctx] plan ${JSON.stringify(w.plan)}  injury ${w.injury ? JSON.stringify(w.injury) : 'none'}`)
    console.log(`  physioActive ${String((w as unknown as Record<string, unknown>).physioActive)}`)
    console.log(`  ranks itf #${w.kidRank} dom #${w.kidRankDomestic ?? '-'} wta #${w.kidRankWta ?? '-'}`)
    console.log(`  summerBlockWeek(now) ${summerBlockWeek(w)}  pastSchool(now) ${schoolIsOver(w.week, bm)}`)
    console.log(`  tierFloorOpen/outgrown by rung:`)
    for (const t of TIER_LADDER) {
      console.log(
        `    ${t.padEnd(8)} floor ${tierFloorOpen(w, t) ? 'open ' : 'shut '} outgrown ${tierOutgrown(w, t) ? 'Y' : 'n'}` +
          ` ageOpen(real) ${isTierAgeOpen(t, kidAgeAt(w, w.week)) ? 'Y' : 'n'} ageOpen(band) ${isTierAgeOpen(t, ageAtWeek(w.week)) ? 'Y' : 'n'}`,
      )
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
