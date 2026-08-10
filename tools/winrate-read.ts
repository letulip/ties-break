/**
 * winrate-read – WHAT «ВЫИГРЫВАЕМОСТЬ» ACTUALLY IS, measured off the owner's own careers.
 *
 * The owner, 10.08, while deciding whether a federation grant should be earned on merit:
 * «А заодно надо проверить "выигрываемость" – можешь с моих профилей 4х снять показатели
 * пожалуйста, чтобы мы точно поняли что и как? И что вообще влияет на этот параметр.»
 *
 * So this prints TWO things per save, and the second is the one that answers his question:
 *
 *   [A] THE OUTCOME – her win rate, per season and per TABLE, off `seasonHistory[].byTrack`
 *       (schema v46) plus the live season's `seasonRecord`. Never re-derived from results rows:
 *       `pruneResults` keeps a rolling 52 weeks, so a career's early seasons no longer HAVE rows
 *       and any attempt to count them would silently report a career that started three years late.
 *
 *   [B] THE CAUSE – the decomposition of `basePServe`, which is the only place in the engine where
 *       a match is decided. Every term is printed with its own contribution in probability points,
 *       against the FIELD SHE ACTUALLY MEETS (the live cohort at her rung), so "what influences it"
 *       stops being a list of field names and becomes a ranked list of numbers.
 *
 * ⚠ MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
 *
 * ⚠ THE SAVES ARE PERSONAL AND ARE NEVER COMMITTED, and neither is anything derived from one
 * beyond the aggregate statistics quoted in docs/specs/. Same rule as tools/round15-read.ts and
 * tools/real-vs-bench.ts.
 *
 * Run:
 *   npx vite-node tools/winrate-read.ts -- --save /path/a.tsave [--save /path/b.tsave ...]
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { kidMatchPlayer, kidMatchPlayerFor } from '../src/engine/world/player'
import { conditionMatchFactor } from '../src/engine/condition'
import { paceAdvantage } from '../src/engine/match/point'
import { fastMatchProbability } from '../src/engine/match/engine'

import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { rivalConditions, rivalMatchPlayer } from '../src/engine/season/rival'
import { fieldProsFor, fieldSeasonOf, universeForTier } from '../src/engine/season/fieldPros'
import { isEntrantBand, JUNIOR_TOUR as TOUR } from '../src/engine/season/tournament'
import { rankingFor } from '../src/engine/world/ladder'
import { kidAgeExact } from '../src/engine/world/age'
import { seasonYear } from '../src/shared/dates'
import type { MatchPlayer, Surface } from '../src/engine/match/types'
import type { LadderTrack, TierId } from '../src/engine/season/types'

const TRACKS: readonly LadderTrack[] = ['domestic', 'itf', 'wta']

function pct(n: number, d: number): string {
  return d === 0 ? '  –  ' : `${((100 * n) / d).toFixed(1).padStart(5)}%`
}

function pad(s: string | number, n: number): string {
  return String(s).padStart(n)
}

async function load(path: string): Promise<WorldState> {
  return (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
}

function section(title: string): void {
  console.log(`\n${'='.repeat(86)}\n${title}\n${'='.repeat(86)}`)
}

/** The rung she is actually competing on right now – the highest tier she holds entries or recent
 *  results at. The field she meets is the field of THAT rung, not of the ladder's top. */
function currentTier(w: WorldState): TierId {
  const recent = w.results.filter((r) => r.playerId === 'kid' && r.tier)
  const tiers = new Set(recent.map((r) => r.tier as TierId))
  for (const t of [...TIER_LADDER].reverse()) if (tiers.has(t)) return t
  return 'local'
}

// =================================================================================================
// [A] THE OUTCOME
// =================================================================================================
function outcome(w: WorldState): void {
  console.log(`\n[A] WIN RATE – per season, per table (v46 byTrack; "–" = the row predates v46)`)
  console.log(`    season  year │        DOMESTIC        │          ITF           │          WTA           │   ALL`)
  console.log(`    ${'─'.repeat(78)}`)

  let allW = 0
  let allL = 0
  const trackTotals: Record<string, { w: number; l: number }> = {
    domestic: { w: 0, l: 0 },
    itf: { w: 0, l: 0 },
    wta: { w: 0, l: 0 },
  }

  for (const h of w.seasonHistory) {
    const cells = TRACKS.map((t) => {
      const row = h.byTrack?.[t]
      if (!row) return '     –  (not recorded) '
      trackTotals[t].w += row.wins
      trackTotals[t].l += row.losses
      const rank = row.endRank ? `#${row.endRank}` : '––'
      return ` ${pad(row.wins, 3)}-${pad(row.losses, 3)} ${pct(row.wins, row.wins + row.losses)} ${pad(rank, 5)}`
    })
    allW += h.wins
    allL += h.losses
    console.log(
      `    ${pad(h.seasonIndex, 6)}  ${seasonYear(h.seasonIndex)} │${cells.join('│')}│ ${pad(h.wins, 3)}-${pad(h.losses, 3)} ${pct(h.wins, h.wins + h.losses)}`,
    )
  }

  // The season in progress is not in `seasonHistory` yet – it is banked at the wrap-up.
  const live = w.seasonRecord
  if (live) {
    const cells = TRACKS.map((t) => {
      const r = live[t]
      if (!r) return '       (none)          '
      return ` ${pad(r.wins, 3)}-${pad(r.losses, 3)} ${pct(r.wins, r.wins + r.losses)}   live`
    })
    const lw = TRACKS.reduce((s, t) => s + (live[t]?.wins ?? 0), 0)
    const ll = TRACKS.reduce((s, t) => s + (live[t]?.losses ?? 0), 0)
    console.log(
      `    ${pad(Math.floor(w.week / WEEKS_PER_YEAR), 6)}  in-progress │${cells.join('│')}│ ${pad(lw, 3)}-${pad(ll, 3)} ${pct(lw, lw + ll)}`,
    )
  }

  console.log(`    ${'─'.repeat(78)}`)
  const t = TRACKS.map(
    (k) => ` ${pad(trackTotals[k].w, 3)}-${pad(trackTotals[k].l, 3)} ${pct(trackTotals[k].w, trackTotals[k].w + trackTotals[k].l)}       `,
  )
  console.log(`    CAREER (banked) │${t.join('│')}│ ${pad(allW, 3)}-${pad(allL, 3)} ${pct(allW, allW + allL)}`)
}

// =================================================================================================
// [B] THE CAUSE – decompose basePServe against the field she actually meets
// =================================================================================================
function cause(w: WorldState): void {
  const tier = currentTier(w)
  // ⚠ HARD, DELIBERATELY, AND IT IS NOT THE RUNG'S SURFACE. Surface is a property of a `SeasonEvent`
  // (season/types.ts), not of `TierDef` – a rung plays on whatever its week's event drew. So there is
  // no "her rung's surface" to read, and picking one of the three would report a number that is a
  // third right. Hard is the NEUTRAL choice by construction: `SURFACE_SERVE_BONUS.hard` is exactly 0,
  // so the comparison below isolates the players instead of the court. The surface×style table still
  // applies to both sides, as it does in any match.
  const surface: Surface = 'hard'
  const raw = kidMatchPlayer(w)
  const onCourt = kidMatchPlayerFor(w, surface)
  const factor = conditionMatchFactor(w.condition)

  console.log(`\n[B] WHAT DECIDES A MATCH – decomposed at her current rung (${tier}, ${surface})`)
  console.log(`\n  HER BUILD, raw → on court (condition ${w.condition} → factor ${factor.toFixed(3)}, then surface×style, then kit)`)
  for (const k of ['serve', 'ret', 'groundstrokes', 'stamina', 'composure'] as const) {
    const r = raw[k] as number
    const c = onCourt[k] as number
    const delta = c - r
    console.log(
      `    ${k.padEnd(14)} ${r.toFixed(1).padStart(6)} → ${c.toFixed(1).padStart(6)}   (${delta >= 0 ? '+' : ''}${delta.toFixed(1)})`,
    )
  }

  // The field: everybody eligible for this rung, put on court exactly as the bracket puts them
  // (rivalMatchPlayer applies surface/style and their own condition factor).
  //
  // ⚠ THROUGH `universeForTier`, WHICH IS THE SEAM AND NOT A DETAIL. A W rung is contested by the
  // live cohort UNION the derived professionals; asking `world.cohort` at a wta250 would compare a
  // seventeen-year-old against the juniors she has already left behind and report a win rate the
  // game never gives her. Same call the snapshot and the bracket make.
  // ⚠ AND NARROWED BY `isEntrantBand`, WHICH IS THE OTHER HALF OF THE SAME SEAM. A rung does not
  // draw from its whole universe – `selectEntrants` keeps only the players whose RANKING PERCENTILE
  // falls in `TierDef.entrantPctBand`, and a wta250's band is a slice off the top. Without this the
  // "field" is the entire professional population from W15 upward, most of whom would never be in
  // her draw, and every win probability below reads ~20 points too kind.
  const min = TIERS[tier].minAgeYears ?? 0
  const max = TIERS[tier].maxAgeYears ?? 99
  const pros = fieldProsFor(w.seed, fieldSeasonOf(w.week))
  const universe = universeForTier(tier, w.cohort, pros)
  const ranking = rankingFor(w, TIERS[tier].track)
  const pos = new Map<string, number>()
  ranking.forEach((r, i) => pos.set(r.playerId, i))
  const total = ranking.length || universe.length
  const pctOf = (id: string) => ((pos.get(id) ?? total - 1) + 1) / total
  const field = universe.filter(
    (p) => p.ageYears >= min && p.ageYears <= max && p.id !== 'kid' && isEntrantBand(tier, pctOf(p.id)),
  )
  if (field.length === 0) {
    console.log(`\n  (no cohort players eligible at ${tier} – nothing to compare against)`)
    return
  }

  // ⚠ THEIR REAL CONDITION, NOT A FRESH DEFAULT. `rivalMatchPlayer`'s third parameter defaults to
  // `ECONOMY.condition.max`, so omitting it silently puts every opponent on court at 100 – and a
  // tired opponent is a WEAKER opponent (`conditionMatchFactor`), so a fresh default reports her as
  // worse than she is. `rivalConditions` is the same map `selectEntrants` and the bracket read.
  // A player absent from it has no results in the fatigue window and really is fresh; the derived
  // professionals are always fresh, which is fieldPros.ts's own documented simplification.
  const conditions = rivalConditions(w.results, w.week)
  const condOf = (id: string) => conditions.get(id) ?? 100
  const opts = { surface, tour: TOUR, seed: '' }
  const probs: number[] = []
  let sumServe = 0
  let sumRet = 0
  let sumGround = 0
  let sumPace = 0
  for (const p of field) {
    const opp: MatchPlayer = rivalMatchPlayer(p, surface, condOf(p.id))
    probs.push(fastMatchProbability(onCourt, opp, opts))
    sumServe += onCourt.serve - 50
    sumRet += 50 - opp.ret
    sumGround += onCourt.groundstrokes - opp.groundstrokes
    sumPace += paceAdvantage(onCourt, opp)
  }
  probs.sort((a, b) => a - b)
  const mean = probs.reduce((s, p) => s + p, 0) / probs.length
  const median = probs[Math.floor(probs.length / 2)]

  const proCount = field.filter((p) => p.id.startsWith('fp-')).length
  const who = proCount ? `${field.length - proCount} juniors + ${proCount} professionals` : `${field.length} juniors`
  console.log(`\n  AGAINST THE FIELD AT THIS RUNG (${who}, each put on court as the bracket does)`)
  console.log(`    match win probability   mean ${(100 * mean).toFixed(1)}%   median ${(100 * median).toFixed(1)}%`)
  console.log(`                            worst ${(100 * probs[0]).toFixed(1)}%   best ${(100 * probs[probs.length - 1]).toFixed(1)}%`)
  console.log(`    share of the field she is favoured against: ${pct(probs.filter((p) => p > 0.5).length, probs.length)}`)

  // The four terms of basePServe, as MEAN GAPS – the ranked answer to "what influences it".
  // SKILL_K / RALLY_K / PACE_K are private to point.ts, so the contribution is measured rather
  // than read off the constants: perturb one term by its own mean gap and see what p does.
  const n = field.length
  console.log(`\n  THE TERMS OF basePServe, as the mean gap she carries into a point`)
  console.log(`    serve   (her serve − 50)          ${(sumServe / n).toFixed(2).padStart(7)}`)
  console.log(`    return  (50 − their return)       ${(sumRet / n).toFixed(2).padStart(7)}`)
  console.log(`    rally   (her ground − theirs)     ${(sumGround / n).toFixed(2).padStart(7)}`)
  console.log(`    pace    (age band, km/h)          ${(sumPace / n).toFixed(2).padStart(7)}`)

  // Sensitivity: how many probability points ONE point of each attribute is worth, here, today.
  const probe = (mut: (p: MatchPlayer) => MatchPlayer): number => {
    let s = 0
    for (const p of field) s += fastMatchProbability(mut(onCourt), rivalMatchPlayer(p, surface, condOf(p.id)), opts)
    return s / n
  }
  console.log(`\n  SENSITIVITY – what ONE point of each attribute is worth to her win probability, here`)
  for (const k of ['serve', 'ret', 'groundstrokes'] as const) {
    const up = probe((p) => ({ ...p, [k]: (p[k] as number) + 1 }))
    console.log(`    +1 ${k.padEnd(14)} → ${(100 * (up - mean) >= 0 ? '+' : '')}${(100 * (up - mean)).toFixed(2)} pp`)
  }
  // Condition is not an attribute – it is the multiplier in front of four of them, so its own
  // sensitivity is the honest way to answer "does resting help her win?". Measured as a FIXED
  // contrast (100 vs 60) rather than "her condition → 100", so the figure is comparable across
  // saves: a girl already at 100 would otherwise report a zero and look condition-proof.
  const at = (c: number): number => {
    const p = kidMatchPlayerFor({ ...w, condition: c }, surface)
    return probe(() => p)
  }
  const p100 = at(100)
  const p60 = at(60)
  console.log(
    `    condition 100 → 60   → ${(100 * (p60 - p100)).toFixed(2)} pp   (factor ${conditionMatchFactor(100).toFixed(3)} → ${conditionMatchFactor(60).toFixed(3)})`,
  )

  // THE GAP THAT MATTERS FOR A MERIT TEST: what the model says she should win against a RANDOM
  // member of her rung, against what she actually won. A bracket is not a random draw – she meets
  // whoever survived the round before – so a negative gap is the tournament, not a defect.
  const banked = w.seasonHistory.reduce((s, h) => ({ w: s.w + h.wins, l: s.l + h.losses }), { w: 0, l: 0 })
  if (banked.w + banked.l > 0) {
    const actual = banked.w / (banked.w + banked.l)
    console.log(
      `\n  MODEL vs REALITY   flat-field mean ${(100 * mean).toFixed(1)}%   ·   career actual ${(100 * actual).toFixed(1)}%   ·   gap ${(100 * (actual - mean) >= 0 ? '+' : '')}${(100 * (actual - mean)).toFixed(1)} pp`,
    )
    console.log(
      `                     (a bracket is not a flat field: she meets survivors, and the field above is TODAY's while the record is the whole career)`,
    )
  }
}

function header(w: WorldState, name: string): void {
  const age = kidAgeExact(w.week, w.profile.birthMonth)
  section(`${name}  ·  v${w.schemaVersion}  ·  week ${w.week}  ·  age ${age.toFixed(1)}`)
  console.log(
    `  ${w.profile.kidName} ${w.profile.kidLastName} · ${w.profile.background} · coach ${w.profile.coachTier} · ${w.profile.playStyle} · condition ${w.condition}`,
  )
  console.log(`  rank: itf #${w.kidRank ?? '––'} · rung now: ${currentTier(w)}`)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const saves: string[] = []
  for (let i = 0; i < args.length; i++) if (args[i] === '--save') saves.push(args[++i])
  if (!saves.length) throw new Error('need at least one --save')

  for (const path of saves) {
    const w = await load(path)
    header(w, path.split('/').pop() ?? path)
    outcome(w)
    cause(w)
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
