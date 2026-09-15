/**
 * seed-vs-model – a played career against the model that played it.
 *
 * ⚠ READ-ONLY LAW (tools/real-vs-bench.ts's header, same standing): the saves are personal, handed
 * in on the command line, read through the game's OWN import door (`decodeExportFile`) and NEVER
 * copied or committed. What the repo keeps is the DERIVED statistics printed here – recorded for
 * round 42 #32 in docs/rounds/round-42.md. Never the careers.
 *
 * WHY IT EXISTS (owner, 15.09): «две супер-талантливые, мне интересно насколько они соответствуют
 * всем нашим матчевым и победным механикам». Her results are a sample drawn from the match model;
 * the model's own prediction for that sample is computable from the SAME functions that draw the
 * event card, so «is she winning what a girl of her level should win» is a subtraction rather than
 * an opinion.
 *
 * ⭐⭐ WHAT MAKES THIS HONEST, AND IT IS ONE FIELD: `WorldEvent.match` freezes BOTH MatchPlayers as
 * they were on the day («skill snapshots at match time (AI skills drift week to week)»), plus the
 * surface and the winner. So every prediction below is made from the two girls who actually walked
 * on court – her condition and her kit wear that week included – and not from today's reading of
 * either of them. An earlier pass of this measurement matched opponents by their printed «F. Last»
 * name against today's universe; 137 short names collide in a universe this size and the first
 * reading of the top band was an artefact of exactly that. The frozen pair has no such hole.
 *
 * ⚠ WHAT IT STILL CANNOT SAY. `world.events` is the FEED and it is pruned to its last 400 rows, so
 * the sample is her recent window and not her career; a career that stopped entering is a small
 * sample; and `chanceFromRatings` is the Elo curve the RING quotes, which is the closed form's fit
 * to best-of-three and not the point loop itself. The residual between the two is precisely what
 * §COMPOSURE below is for.
 *
 * Run:
 *   npx vite-node tools/seed-vs-model.ts -- --save ~/Downloads/a.tsave [--save ~/Downloads/b.tsave]
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { decodeExportFile } from '../src/engine/saveCodec'
import { ECONOMY } from '../src/engine/economy'
import { FRESH_KIT } from '../src/engine/equipment'
import { kidMatchPlayerFor } from '../src/engine/world/player'
import { startingSkills } from '../src/engine/world/player'
import { rollPotential, SKILL_KEYS } from '../src/engine/development'
import { ratingOf, chanceFromRatings } from '../src/engine/match/rating'
import { rankingFor } from '../src/engine/world/ladder'
import { kidAgeExact } from '../src/engine/world/age'
import { KID_ID } from '../src/engine/world/constants'
import type { WorldState } from '../src/engine/world'
import type { KidSkills } from '../src/engine/development'
import type { MatchPlayer, Surface, Tour } from '../src/engine/match/types'
import type { WorldMatch } from '../src/shared/protocol'

/** `Tour` is `'wta' | 'atp'` and this game's tour is the women's one everywhere. */
const TOUR: Tour = 'wta'

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`
}

function sum(s: KidSkills): number {
  return SKILL_KEYS.reduce((a, k) => a + s[k], 0)
}

function section(title: string): void {
  console.log(`\n${title}`)
}

/** Her frozen side of a recorded match, and the other one. */
function sidesOf(m: WorldMatch): { kid: MatchPlayer; opp: MatchPlayer; kidWon: boolean } | null {
  const kidIsA = m.aId === KID_ID
  const kidIsB = m.bId === KID_ID
  if (!kidIsA && !kidIsB) return null
  return {
    kid: kidIsA ? m.a : m.b,
    opp: kidIsA ? m.b : m.a,
    kidWon: m.winnerId === KID_ID,
  }
}

/** Sets read off a scoreline like «6-4 3-6 7-6», from HER side. */
function setsOf(score: string | undefined, kidIsA: boolean): { total: number; tiebreaks: number; tbWon: number } {
  if (!score) return { total: 0, tiebreaks: 0, tbWon: 0 }
  let total = 0
  let tiebreaks = 0
  let tbWon = 0
  for (const set of score.trim().split(/\s+/)) {
    const [a, b] = set.split('-').map((n) => Number(n))
    if (Number.isNaN(a) || Number.isNaN(b)) continue
    total++
    if (Math.max(a, b) === 7 && Math.min(a, b) === 6) {
      tiebreaks++
      if (kidIsA ? a > b : b > a) tbWon++
    }
  }
  return { total, tiebreaks, tbWon }
}

function bandOf(p: number): string {
  if (p >= 0.9) return '90-100'
  if (p >= 0.8) return '80-90'
  if (p >= 0.7) return '70-80'
  if (p >= 0.6) return '60-70'
  if (p >= 0.5) return '50-60'
  return '<50'
}
const BANDS = ['90-100', '80-90', '70-80', '60-70', '50-60', '<50'] as const

function report(path: string, world: WorldState): void {
  const p = world.profile
  const age = kidAgeExact(world.week, p.birthMonth, p.birthDay)
  console.log(`\n${'='.repeat(96)}`)
  console.log(
    `${p.kidName} ${p.kidLastName} – ${basename(path)}, week ${world.week}, age ${age.toFixed(2)}, ` +
      `${p.background}, ${p.playStyle}, temperament ${world.temperament}`,
  )
  console.log('='.repeat(96))

  // --- 1. WHO SHE WAS BORN, WHO SHE IS, AND WHAT WAS EVER AVAILABLE ------------------------------
  // Both draws are seeded, so her birth reconstructs exactly rather than being remembered.
  const born = startingSkills(world.seed, p)
  const ceiling = rollPotential(world.seed, born)
  section('BORN / NOW / CEILING – the reconstruction, per wing')
  console.log('  wing            born     now   ceiling    room   taken')
  for (const k of SKILL_KEYS) {
    const room = ceiling[k] - born[k]
    const taken = world.skills[k] - born[k]
    console.log(
      `  ${k.padEnd(14)} ${born[k].toFixed(1).padStart(5)} ${world.skills[k].toFixed(1).padStart(7)} ` +
        `${ceiling[k].toFixed(1).padStart(9)} ${room.toFixed(1).padStart(7)} ${taken.toFixed(1).padStart(7)}`,
    )
  }
  const room = sum(ceiling) - sum(born)
  const taken = sum(world.skills) - sum(born)
  console.log(
    `  TOTAL          ${sum(born).toFixed(1).padStart(5)} ${sum(world.skills).toFixed(1).padStart(7)} ` +
      `${sum(ceiling).toFixed(1).padStart(9)} ${room.toFixed(1).padStart(7)} ${taken.toFixed(1).padStart(7)}` +
      `   = ${pct(taken / room)} of the room she was dealt`,
  )

  // --- 2. THE RATING, AND WHAT A WING IS WORTH IN IT ---------------------------------------------
  const rest = (surface: Surface): MatchPlayer =>
    kidMatchPlayerFor({ ...world, condition: ECONOMY.condition.max, kitWear: FRESH_KIT }, surface, false)
  const base = ratingOf(rest('hard'), 'hard', TOUR)
  section('RATING')
  console.log(
    `  hard ${base} at rest / ${ratingOf(kidMatchPlayerFor(world, 'hard', false), 'hard', TOUR)} as she stands ` +
      `(condition ${Math.round(world.condition)})`,
  )
  const exchange = SKILL_KEYS.map((k) => {
    const bumped = kidMatchPlayerFor(
      { ...world, condition: ECONOMY.condition.max, kitWear: FRESH_KIT, skills: { ...world.skills, [k]: world.skills[k] + 5 } },
      'hard',
      false,
    )
    return `${k} +5 => ${ratingOf(bumped, 'hard', TOUR) - base >= 0 ? '+' : ''}${ratingOf(bumped, 'hard', TOUR) - base}`
  })
  console.log(`  exchange rate, at her own build: ${exchange.join('   ')}`)

  // --- 3. THE CALIBRATION – every frozen pair in the retained feed -------------------------------
  const matches: WorldMatch[] = []
  for (const e of world.events) if (e.match && !e.friendly) matches.push(e.match)
  let n = 0
  let won = 0
  let expected = 0
  let retirements = 0
  let deciders = 0
  let decidersWon = 0
  let tbSets = 0
  let tbWon = 0
  const buckets = new Map<string, { n: number; w: number; p: number }>()
  /** The composure residual: her matches split by how much nerve she brought over the other girl. */
  const nerve = new Map<string, { n: number; w: number; p: number }>()
  for (const m of matches) {
    const sides = sidesOf(m)
    if (!sides) continue
    n++
    const mine = ratingOf(sides.kid, m.surface, TOUR)
    const theirs = ratingOf(sides.opp, m.surface, TOUR)
    const pWin = chanceFromRatings(mine, theirs)
    expected += pWin
    if (sides.kidWon) won++
    if (m.retiredId !== undefined) retirements++
    const b = buckets.get(bandOf(pWin)) ?? { n: 0, w: 0, p: 0 }
    b.n++
    b.w += sides.kidWon ? 1 : 0
    b.p += pWin
    buckets.set(bandOf(pWin), b)

    const gap = sides.kid.composure - sides.opp.composure
    const key = gap >= 15 ? '+15 and up' : gap >= 5 ? '+5..+15' : gap > -5 ? 'level' : gap > -15 ? '-5..-15' : '-15 and down'
    const g = nerve.get(key) ?? { n: 0, w: 0, p: 0 }
    g.n++
    g.w += sides.kidWon ? 1 : 0
    g.p += pWin
    nerve.set(key, g)

    const sets = setsOf(m.score, m.aId === KID_ID)
    if (sets.total >= 3) {
      deciders++
      if (sides.kidWon) decidersWon++
    }
    tbSets += sets.tiebreaks
    tbWon += sets.tbWon
  }
  section(`CALIBRATION – ${n} recorded matches in the retained feed (${retirements} ended in a retirement)`)
  if (n > 0) {
    // ⚠ THE SPREAD IS THE BAR, NOT THE POINT ESTIMATE. A win total is a sum of Bernoullis, so the
    // model's own noise is √Σp(1−p) – a gap inside one of those is agreement, not a finding.
    let variance = 0
    for (const b of buckets.values()) variance += b.p - (b.p * b.p) / Math.max(1, b.n)
    const sd = Math.sqrt(Math.max(0, variance))
    console.log(`  actual   ${won}-${n - won} = ${pct(won / n)}`)
    console.log(
      `  model    ${expected.toFixed(1)} expected = ${pct(expected / n)}   ` +
        `gap ${won - expected >= 0 ? '+' : ''}${(won - expected).toFixed(1)} wins ` +
        `(${(Math.abs(won - expected) / Math.max(0.001, sd)).toFixed(1)}σ of the model's own spread)`,
    )
    console.log('  predicted band    n    actual     model')
    for (const key of BANDS) {
      const b = buckets.get(key)
      if (!b) continue
      console.log(`  ${key.padEnd(15)} ${String(b.n).padStart(3)}   ${pct(b.w / b.n).padStart(6)}   ${pct(b.p / b.n).padStart(6)}`)
    }
    // --- 4. WHERE COMPOSURE IS SUPPOSED TO PAY ---------------------------------------------------
    // The rating prices nerve at almost nothing (the exchange rate above says how little), because
    // the point loop is where it is spent. So the question is not «does she win» – it is whether the
    // matches where she brought MORE nerve than the other girl beat their own prediction.
    section('COMPOSURE – the residual after the rating has been paid')
    console.log('  her nerve vs hers   n    actual     model      residual')
    for (const key of ['+15 and up', '+5..+15', 'level', '-5..-15', '-15 and down']) {
      const g = nerve.get(key)
      if (!g) continue
      const residual = g.w / g.n - g.p / g.n
      console.log(
        `  ${key.padEnd(17)} ${String(g.n).padStart(3)}   ${pct(g.w / g.n).padStart(6)}   ${pct(g.p / g.n).padStart(6)}   ` +
          `${residual >= 0 ? '+' : ''}${(residual * 100).toFixed(1)}pp`,
      )
    }
    section('BIG POINTS – the close sets, where the loop spends nerve')
    console.log(
      `  deciding sets ${decidersWon}/${deciders} = ${pct(decidersWon / Math.max(1, deciders))}   ` +
        `tiebreak sets ${tbWon}/${tbSets} = ${pct(tbWon / Math.max(1, tbSets))}   ` +
        `(her composure ${Math.round(world.skills.composure)}, her overall ${pct(won / n)})`,
    )
  }

  // --- 5. THE SEASONS, AND THE TABLE'S OWN CONSISTENCY -------------------------------------------
  section('SEASONS')
  console.log('  season  age    W-L      win%    points   endRank')
  for (const s of world.seasonHistory) {
    const w = s.wins ?? 0
    const l = s.losses ?? 0
    console.log(
      `  ${String(s.seasonIndex).padStart(5)}  ${String(14 + s.seasonIndex).padStart(3)}   ` +
        `${`${w}-${l}`.padEnd(8)} ${pct(w / Math.max(1, w + l)).padStart(6)}  ${String(s.points).padStart(7)}   ${String(s.endRank).padStart(6)}`,
    )
  }
  for (const track of ['wta', 'itf'] as const) {
    const table = rankingFor(world, track)
    const at = table.findIndex((r) => r.playerId === KID_ID)
    const stated = track === 'wta' ? world.kidRankWta : world.kidRank
    console.log(
      `  rank ${track.toUpperCase().padEnd(4)} stated #${stated}   recomputed #${at + 1} of ${table.length}` +
        `   points ${at >= 0 ? Math.round(table[at].points) : 0}`,
    )
  }
  const totals = world.careerTotals
  console.log(
    `  prize $${Math.round(totals.prizeCents / 100).toLocaleString('en-US')}   ` +
      `weeks lost to injury ${totals.weeksLostToInjury}`,
  )
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const paths: string[] = []
  for (let i = 0; i < args.length; i++) if (args[i] === '--save' && args[i + 1]) paths.push(args[++i])
  if (paths.length === 0) {
    console.error('usage: npx vite-node tools/seed-vs-model.ts -- --save /path/a.tsave [--save /path/b.tsave]')
    process.exit(1)
  }
  for (const path of paths) {
    const resolved = path.replace('~', process.env.HOME ?? '')
    report(resolved, await decodeExportFile(new Uint8Array(readFileSync(resolved))))
  }
}

await main()
