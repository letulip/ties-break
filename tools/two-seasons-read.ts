/**
 * two-seasons-read – WHERE HER WINS ACTUALLY COME FROM, and who else is standing at her rank.
 *
 *   npx vite-node tools/two-seasons-read.ts -- --save ~/Downloads/a.tsave [--seasons 2]
 *
 * THE QUESTION (owner, round 21): «Проверь пожалуйста в свежем сейве 2 последних сезона у Инес,
 * посмотри на ее скиллы и процент побед. Мне кажется снова что-то не то у нас там происходит, но
 * может быть мне кажется и такой результат ок для её уровня.»
 *
 * A win rate on its own cannot answer that, and the shape he is describing – "won a lot, ranked
 * lower" – has exactly one diagnosis: the wins are at rungs that pay nothing. So this tool refuses to
 * print a win percentage without the rung beside it. Three blocks:
 *
 *   1. THE LEDGER, PER RUNG. `world.results` carries points and tier but NOT a scoreline, so wins are
 *      DERIVED: a tier's `points` array is indexed by finish, so a row's points value identifies the
 *      round she went out in, and `log2(drawSize) - finish` is how many matches she won to get there.
 *      Cross-checked against `seasonHistory[].byTrack[].wins` – if the two disagree the derivation is
 *      wrong and the run says so rather than quietly reporting the wrong number.
 *   2. THE TABLE AROUND HER. `fieldProsFor` is a pure function of (seed, season), so the professionals
 *      standing at her rank can be re-derived exactly and their skills read off. That is the only
 *      honest answer to "is this right for her level": her level, against the level at her place.
 *   3. THE COUNTING WINDOW. What her ranking is actually made of, best-N, with the rung of each row.
 *
 * ⚠ THE SAVE IS PERSONAL AND IS NEVER COMMITTED, and neither is anything derived from one beyond the
 * aggregate facts quoted in docs/. Same rule as tools/round18-read.ts and tools/round17-read.ts.
 *
 * ⚠ MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { kidPoints } from '../src/engine/world'
import { computeCountingResults } from '../src/engine/world/snapshot'
import { kidAgeExact } from '../src/engine/world/age'
import { KID_ID } from '../src/engine/world/constants'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { BEST_N_BY_TRACK } from '../src/engine/season/ranking'
import { fieldProsFor, mergedWtaRanking, careerArc, type FieldPro } from '../src/engine/season/fieldPros'
import { weekLabel } from '../src/shared/dates'
import type { LadderTrack, TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const strOf = (n: string): string | null => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
const numOf = (n: string, d: number): number => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const SEASONS_BACK = numOf('seasons', 2)

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const rule = (n = 108) => '-'.repeat(n)
const section = (t: string) => console.log(`\n${rule()}\n${t}\n${rule()}`)
const money = (c: number) => `${c < 0 ? '-' : ''}$${Math.abs(Math.round(c / 100)).toLocaleString('en-US')}`
const core4 = (s: { serve: number; ret: number; composure: number; stamina: number }) =>
  (s.serve + s.ret + s.composure + s.stamina) / 4

/** WHICH ROUND A RESULT ROW IS – the inverse of `TIERS[t].points`, which is indexed by finish.
 *  Returns null when the points value is not on the tier's own board, which is the only way this
 *  derivation can lie; the caller counts those separately rather than folding them in. */
function finishOf(tier: TierId, points: number): number | null {
  const board = TIERS[tier].points
  const i = board.indexOf(points)
  return i >= 0 ? i : null
}
function roundsOf(tier: TierId): number {
  return Math.log2(TIERS[tier].drawSize)
}

async function main(): Promise<void> {
  const p = strOf('save')
  if (!p) {
    console.error('usage: two-seasons-read.ts -- --save <path.tsave>')
    process.exit(2)
  }
  const path = p.replace('~', process.env.HOME ?? '')
  const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
  const prof = w.profile
  const season = Math.floor(w.week / WEEKS_PER_YEAR)

  // =============================================================================================
  section('WHO, WHEN, AND WHAT SHE IS MADE OF')
  console.log(
    `  ${prof.kidName} ${prof.kidLastName}  ·  week ${w.week} (${weekLabel(w.week)})  ·  season ${season}` +
      `  ·  age ${kidAgeExact(w.week, prof.birthMonth).toFixed(2)}  ·  schema v${w.schemaVersion}`,
  )
  console.log(`  funds ${money(w.fundsCents)}  ·  coach ${w.coachId ?? 'self'} (${prof.coachTier})  ·  ${prof.background} family  ·  ${prof.country}`)
  console.log(`\n  ${padE('skill', 16)}${pad('now', 8)}${pad('potential', 11)}${pad('headroom', 10)}`)
  for (const k of ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const) {
    const now = w.skills[k]
    const pot = w.potential[k]
    console.log(`  ${padE(k, 16)}${pad(now.toFixed(1), 8)}${pad(pot.toFixed(1), 11)}${pad((pot - now).toFixed(1), 10)}`)
  }
  const core = core4(w.skills)
  console.log(
    `\n  ⭐ core (mean of the four the field's storeys are drawn in) = ${core.toFixed(1)}` +
      `   ·   at potential it would be ${core4(w.potential as never).toFixed(1)}`,
  )
  console.log(
    `  ranks now:  WTA #${w.kidRankWta}  (prev #${w.prevKidRankWta})   ·   ITF #${w.kidRank}   ·   domestic #${w.kidRankDomestic}`,
  )
  // ⚠ A RANK WITHOUT POINTS BEHIND IT IS NOT A RANK. `kidLadderRank` returns null when she holds
  // nothing in a table, precisely because a dense rank over a table whose tail all ties on zero
  // hands every member of that tie the head of the tie's place. The raw `world.kidRank*` fields do
  // NOT carry that guard, and `SeasonHistoryEntry.endRank` is written from the raw ITF one.
  console.log(`\n  ${padE('table', 12)}${pad('her points', 12)}${pad('raw rank field', 16)}${pad('is it a real rank?', 20)}`)
  for (const [t, raw] of [['domestic', w.kidRankDomestic], ['itf', w.kidRank], ['wta', w.kidRankWta]] as [LadderTrack, number][]) {
    const pts = kidPoints(w, t)
    console.log(
      `  ${padE(t, 12)}${pad(pts, 12)}${pad('#' + raw, 16)}` +
        `${pad(pts > 0 ? 'yes' : 'NO – zero-tie place', 20)}`,
    )
  }

  // =============================================================================================
  section(`SEASON HISTORY – every season, and ⚠ WHICH TABLE THE HEADLINE RANK IS FROM`)
  console.log(
    `\n  ${padE('season', 8)}${pad('endRank', 9)}${pad('pts', 7)}${pad('W', 5)}${pad('L', 5)}${pad('win%', 7)}` +
      `   |${pad('dom pts', 9)}${pad('W-L', 8)}  |${pad('itf pts', 9)}${pad('W-L', 8)}  |${pad('wta pts', 9)}${pad('W-L', 8)}`,
  )
  for (const h of w.seasonHistory) {
    const bt = h.byTrack
    const cell = (t: LadderTrack) => (bt ? `${pad(bt[t].points, 9)}${pad(`${bt[t].wins}-${bt[t].losses}`, 8)}` : `${pad('–', 9)}${pad('–', 8)}`)
    const wr = h.wins + h.losses > 0 ? `${((100 * h.wins) / (h.wins + h.losses)).toFixed(0)}%` : '–'
    console.log(
      `  ${padE(h.seasonIndex, 8)}${pad('#' + h.endRank, 9)}${pad(h.points, 7)}${pad(h.wins, 5)}${pad(h.losses, 5)}${pad(wr, 7)}` +
        `   |${cell('domestic')}  |${cell('itf')}  |${cell('wta')}`,
    )
  }
  console.log(
    `\n  ⚠⚠ READ THE endRank COLUMN AGAINST THE THREE BESIDE IT. \`SeasonHistoryEntry.endRank\` is the` +
      `\n  ITF fold and always has been (protocol.ts says so in its own comment: "the wrap writes` +
      `\n  world.kidRank"). Any season whose itf row is 0-0 earned NOTHING in the table its headline` +
      `\n  rank is quoted from.`,
  )

  // =============================================================================================
  const from = (season - SEASONS_BACK + 1) * WEEKS_PER_YEAR
  section(`WHERE THE WINS COME FROM – per rung, the last ${SEASONS_BACK} seasons (weeks ${from}+)`)
  // ⚠ `world.results` IS THE WHOLE COHORT'S LEDGER. Filter by playerId or the counts are the field's
  // (the mistake tools/round18-read.ts records making).
  const hers = (w.results ?? []).filter((r) => r.playerId === KID_ID)
  const oldest = hers.length ? Math.min(...hers.map((r) => r.week)) : w.week
  console.log(
    `\n  ⚠ THE LEDGER IS PRUNED TO A ROLLING 52 WEEKS, so the per-rung block below can only reach back` +
      `\n  to week ${oldest} (${weekLabel(oldest)}). Earlier seasons survive only as the season-history rows above and` +
      `\n  as the trophy weeks in the block after this one. Stated rather than silently truncated.`,
  )

  for (let s = season - SEASONS_BACK + 1; s <= season; s++) {
    const lo = s * WEEKS_PER_YEAR
    const hi = lo + WEEKS_PER_YEAR - 1
    const rows = hers.filter((r) => r.week >= lo && r.week <= hi)
    if (rows.length === 0) {
      console.log(`\n  season ${s} (weeks ${lo}-${hi}): no rows survive the prune window.`)
      continue
    }
    console.log(`\n  SEASON ${s} (weeks ${lo}-${hi}) – ${rows.length} events in the surviving window`)
    console.log(
      `    ${padE('rung', 10)}${pad('events', 8)}${pad('W', 5)}${pad('L', 5)}${pad('win%', 7)}${pad('points', 8)}` +
        `${pad('titles', 8)}${pad('pts/event', 11)}${pad('accepts', 9)}`,
    )
    const byTier: Record<string, { n: number; wins: number; losses: number; pts: number; titles: number; odd: number }> = {}
    for (const r of rows) {
      const t = r.tier ?? 'unknown'
      byTier[t] ??= { n: 0, wins: 0, losses: 0, pts: 0, titles: 0, odd: 0 }
      const b = byTier[t]
      b.n += 1
      b.pts += r.points
      if (r.mandatoryMiss) continue // a slot taken by a skipped mandatory, not a match played
      const f = r.tier ? finishOf(r.tier, r.points) : null
      if (f === null || !r.tier) {
        b.odd += 1
        continue
      }
      const won = roundsOf(r.tier) - f
      b.wins += won
      b.losses += f === 0 ? 0 : 1
      if (f === 0) b.titles += 1
    }
    let tw = 0
    let tl = 0
    let tp = 0
    for (const t of TIER_LADDER) {
      const b = byTier[t]
      if (!b) continue
      tw += b.wins
      tl += b.losses
      tp += b.pts
      const acc = TIERS[t as TierId].acceptsRank
      console.log(
        `    ${padE(t, 10)}${pad(b.n, 8)}${pad(b.wins, 5)}${pad(b.losses, 5)}` +
          `${pad(b.wins + b.losses ? `${((100 * b.wins) / (b.wins + b.losses)).toFixed(0)}%` : '–', 7)}` +
          `${pad(b.pts, 8)}${pad(b.titles, 8)}${pad((b.pts / b.n).toFixed(1), 11)}${pad(acc ? '#' + acc : 'open', 9)}` +
          (b.odd ? `   ⚠ ${b.odd} row(s) off the points board` : ''),
      )
    }
    console.log(`    ${padE('TOTAL', 10)}${pad(rows.length, 8)}${pad(tw, 5)}${pad(tl, 5)}${pad(tw + tl ? `${((100 * tw) / (tw + tl)).toFixed(0)}%` : '–', 7)}${pad(tp, 8)}`)
    const hist = w.seasonHistory.find((h) => h.seasonIndex === s)
    if (hist) {
      const ok = hist.wins === tw && hist.losses === tl
      console.log(
        `    cross-check vs seasonHistory: ${hist.wins}-${hist.losses} banked` +
          (ok ? '  ✅ derivation agrees' : `  ⚠ derived ${tw}-${tl} – the window is partial, or the derivation is wrong`),
      )
    }
  }

  // =============================================================================================
  section('THE WHOLE CAREER, BY RUNG – titles and finals, from the trophy cabinet (not pruned)')
  console.log(`\n  ${padE('rung', 10)}${pad('titles', 8)}${pad('finals', 8)}   weeks (season index in brackets)`)
  for (const t of TIER_LADDER) {
    const tr = (w.trophiesByTier as Record<string, { titles: number[]; finals: number[] } | undefined>)[t]
    if (!tr || (tr.titles.length === 0 && tr.finals.length === 0)) continue
    const label = (xs: number[]) => xs.map((wk) => `${wk}[s${Math.floor(wk / WEEKS_PER_YEAR)}]`).join(' ')
    console.log(`  ${padE(t, 10)}${pad(tr.titles.length, 8)}${pad(tr.finals.length, 8)}   T: ${label(tr.titles)}`)
    if (tr.finals.length) console.log(`  ${padE('', 26)}   F: ${label(tr.finals)}`)
  }

  // =============================================================================================
  section(`HER COUNTING WINDOW – what the ${w.kidRankWta} actually rests on`)
  {
    const counting = computeCountingResults(w, 'wta')
    console.log(`\n  best-${BEST_N_BY_TRACK.wta} window, ${counting.length} rows counted, ${kidPoints(w, 'wta')} points total\n`)
    console.log(`    ${padE('week', 8)}${padE('rung', 10)}${pad('points', 8)}   ${padE('finish', 12)}`)
    for (const r of counting) {
      const f = r.tier ? finishOf(r.tier as TierId, r.points) : null
      const names = ['CHAMPION', 'final', 'semi', 'quarter', 'R16', 'R32', 'R64', 'R128']
      console.log(
        `    ${padE(r.week, 8)}${padE(r.tier ?? '?', 10)}${pad(r.points, 8)}   ${padE(f === null ? '–' : (names[f] ?? `f${f}`), 12)}`,
      )
    }
  }

  // =============================================================================================
  section('THE FIELD AT HER RANK – same place, what skills do they carry?')
  {
    // The merged table exactly as the engine folds it: her LIVE row plus the derived field.
    const pros = fieldProsFor(w.seed, season, w.cohort.map((c) => c.name))
    const live = [{ playerId: KID_ID, points: kidPoints(w, 'wta'), rank: 0 }]
    const merged = mergedWtaRanking(live, pros)
    const byId = new Map<string, FieldPro>(pros.map((x) => [x.id, x]))
    const meIdx = merged.findIndex((r) => r.playerId === KID_ID)
    console.log(
      `\n  her merged place re-derived here: #${merged[meIdx]?.rank} on ${merged[meIdx]?.points} pts` +
        `   (the save carries #${w.kidRankWta} – any gap is the cohort's own live rows)\n`,
    )
    console.log(`  ${padE('rank', 7)}${padE('who', 22)}${pad('pts', 7)}${pad('age', 5)}${pad('core', 7)}${pad('serve', 7)}${pad('ret', 7)}${pad('comp', 7)}${pad('stam', 7)}${pad('grnd', 7)}   storey`)
    const lo = Math.max(0, meIdx - 8)
    for (let i = lo; i <= Math.min(merged.length - 1, meIdx + 8); i++) {
      const row = merged[i]
      if (row.playerId === KID_ID) {
        console.log(
          `  ${padE('#' + row.rank, 7)}${padE('>> ' + prof.kidName + ' <<', 22)}${pad(row.points, 7)}` +
            `${pad(Math.floor(kidAgeExact(w.week, prof.birthMonth)), 5)}${pad(core.toFixed(1), 7)}` +
            `${pad(w.skills.serve.toFixed(1), 7)}${pad(w.skills.ret.toFixed(1), 7)}${pad(w.skills.composure.toFixed(1), 7)}` +
            `${pad(w.skills.stamina.toFixed(1), 7)}${pad(w.skills.groundstrokes.toFixed(1), 7)}   (the player)`,
        )
        continue
      }
      const pro = byId.get(row.playerId)
      if (!pro) continue
      console.log(
        `  ${padE('#' + row.rank, 7)}${padE(pro.name, 22)}${pad(row.points, 7)}${pad(pro.ageYears, 5)}` +
          `${pad(core4(pro).toFixed(1), 7)}${pad(pro.serve.toFixed(1), 7)}${pad(pro.ret.toFixed(1), 7)}` +
          `${pad(pro.composure.toFixed(1), 7)}${pad(pro.stamina.toFixed(1), 7)}${pad(pro.groundstrokes.toFixed(1), 7)}   ${pro.strengthTier} (arc ${careerArc(pro.ageYears).toFixed(2)})`,
      )
    }

    // The band statistics – one career either side is anecdote; the band is the answer.
    const bandOf = (a: number, b: number) => {
      const xs = merged
        .filter((r) => r.rank >= a && r.rank <= b && r.playerId !== KID_ID)
        .map((r) => byId.get(r.playerId))
        .filter((x): x is FieldPro => Boolean(x))
      return xs
    }
    console.log(`\n  ${padE('band', 14)}${pad('n', 5)}${pad('mean core', 12)}${pad('mean age', 11)}${pad('mean pts', 11)}`)
    const me = w.kidRankWta ?? merged[meIdx]?.rank ?? 0
    for (const [a, b, label] of [
      [Math.max(1, me - 25), me + 25, `#${Math.max(1, me - 25)}-#${me + 25}`],
      [1, 50, '#1-#50'],
      [51, 100, '#51-#100'],
      [101, 150, '#101-#150'],
      [151, 250, '#151-#250'],
    ] as [number, number, string][]) {
      const xs = bandOf(a, b)
      if (!xs.length) continue
      const mean = (f: (p: FieldPro) => number) => xs.reduce((s, x) => s + f(x), 0) / xs.length
      console.log(
        `  ${padE(label, 14)}${pad(xs.length, 5)}${pad(mean(core4).toFixed(1), 12)}${pad(mean((x) => x.ageYears).toFixed(1), 11)}${pad(Math.round(mean((x) => x.wtaPoints)), 11)}`,
      )
    }
    console.log(`\n  ⭐ HER core is ${core.toFixed(1)}. Read it against the "mean core" of the band she is standing in.`)
  }

  // =============================================================================================
  section('WHICH RUNGS HER RANK OPENS, AND WHICH IT DOES NOT')
  {
    const r = w.kidRankWta ?? 0
    console.log(`\n  at WTA #${r} (was #${w.prevKidRankWta}):\n`)
    for (const t of ['w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam'] as TierId[]) {
      const a = TIERS[t].acceptsRank
      const open = a === undefined || r <= a
      console.log(
        `    ${padE(TIERS[t].label, 18)}${padE(a === undefined ? 'no rank cut' : `top ${a}`, 14)}` +
          `${open ? 'OPEN ' : 'shut '}   title pays ${pad(TIERS[t].points[0], 5)} pts / ${money(TIERS[t].prizeCents?.[0] ?? 0)}` +
          (!open && a !== undefined ? `   ⚠ ${r - a} place(s) short` : ''),
      )
    }
  }
}

void main()
