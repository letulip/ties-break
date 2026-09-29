// Lane C gap-fill probe (26.09 review, baseline 03d92221). Read-only. NO TIMING: Phase 1 forbids it.
// Question: Phase 0 §B.2 measured `stepCareerWeek` rising 5.07 -> 6.96 ms/week (+37 %) from the
// first to the last hundred weeks and nobody traced why. This probe replays Phase 0's own career
// (runtime-career.ts' driver: openCareer(PRESETS[5], 0, POLICIES[1]) + stepCareerWeek + resolveOpen,
// after the same 104-week warm-up career) and COUNTS, per week, what the tick works over. The per-week
// times are Phase 0's own (`RAW/0b/career-middle0-r2-bare.json`, `rows[].stepMs`); the join is by week,
// and the final world hash must equal Phase 0's (3272aa98f61626b3) or the join is refused.
// Usage: npx vite-node <this> -- <phase0 bare json> <out.json>
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from '../../../tools/econ-bench'
import { drainLifeBeats } from '../../../tools/_lifeBeats'
import { answerBirthdayNeutral } from '../../../tools/_birthday'
import { KID_ID, answerFork, answerRetirement, pendingBirthday, type WorldState } from '../../../src/engine/world'
import type { Rng } from '../../../src/engine/rng'
import { TIERS } from '../../../src/engine/season/calendar'

const argv = process.argv.slice(2).filter((a) => a !== '--')
const PHASE0 = argv[0]
const OUT = argv[1] ?? 'tick-growth.json'
const PLAYER = POLICIES[1]

function resolveOpen(world: WorldState): void {
  if (world.ending !== null) return
  drainLifeBeats(world)
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
}

type Row = Record<string, number>
/** Her own point-simulated matches written this week (`playMatch` point-simulates only a match she
 *  plays, season/tournament.ts:1033-1045; every rival match is the closed form), and their games –
 *  a proxy for points, read off the recorded score. */
function kidMatches(fresh: WorldState['events']): { kidMatches: number; kidGames: number } {
  let kidMatches = 0, kidGames = 0
  for (const e of fresh) {
    const m = e.match
    if (m === undefined || (m.aId !== KID_ID && m.bId !== KID_ID) || typeof m.score !== 'string') continue
    kidMatches++
    for (const set of m.score.split(' ')) {
      const [a, b] = set.split('-').map((x) => parseInt(x, 10))
      if (Number.isFinite(a) && Number.isFinite(b)) kidGames += a + b
    }
  }
  return { kidMatches, kidGames }
}
function walk(world: WorldState, rng: Rng, weeks: number, rows: Row[] | null): void {
  for (let i = 0; i < weeks && world.ending === null; i++) {
    const before = new Set(world.results)
    const eventsBefore = world.events.length
    const feedBefore = new Set(world.events)
    // The events this tick resolves are the ones scheduled on the week it starts at; split them by
    // rung family (junior `j*` against everything adult) and count the adult draw sizes.
    const resolving = world.season.filter((e) => e.week === world.week)
    const juniorEvents = resolving.filter((e) => e.tier.startsWith('j')).length
    const adultEvents = resolving.length - juniorEvents
    const adultDraw = resolving.filter((e) => !e.tier.startsWith('j')).reduce((n, e) => n + TIERS[e.tier].drawSize, 0)
    const juniorDraw = resolving.filter((e) => e.tier.startsWith('j')).reduce((n, e) => n + TIERS[e.tier].drawSize, 0)
    stepCareerWeek(world, rng, PLAYER)
    const row: Row = {
      week: world.week,
      newResults: world.results.filter((r) => !before.has(r)).length,
      results: world.results.length,
      season: world.season.length,
      offers: world.offers.length,
      events: world.events.length,
      eventsDelta: world.events.length - eventsBefore,
      entries: world.entries.length,
      lifeLog: (world as unknown as { lifeLog?: unknown[] }).lifeLog?.length ?? 0,
      milestones: world.milestones.length,
      seasonHistory: world.seasonHistory.length,
      financeWeeks: world.financeWeeks.length,
      cohort: world.cohort.length,
      juniorEvents,
      adultEvents,
      juniorDraw,
      adultDraw,
      ...kidMatches(world.events.filter((e) => !feedBefore.has(e))),
    }
    resolveOpen(world)
    if (rows) rows.push(row)
  }
}

const warm = openCareer(PRESETS[0], 99, PLAYER)
walk(warm.world, warm.rng, 104, null)
const { world, rng } = openCareer(PRESETS[5], 0, PLAYER)
const rows: Row[] = []
walk(world, rng, 2600, rows)
const hash = createHash('sha256').update(JSON.stringify(world)).digest('hex').slice(0, 16)

const phase0 = JSON.parse(readFileSync(PHASE0, 'utf8')) as { worldHash: string; rows: { week: number; stepMs: number }[] }
const lines: string[] = [`final week ${world.week} · hash ${hash} · Phase 0 hash ${phase0.worldHash} · ${hash === phase0.worldHash ? 'SAME CAREER' : 'DIFFERENT – JOIN REFUSED'}`]
if (hash === phase0.worldHash) {
  const ms = new Map(phase0.rows.map((r) => [r.week, r.stepMs]))
  for (const r of rows) r.stepMs = ms.get(r.week) ?? NaN
  const med = (xs: number[]): number => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }
  const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length
  const early = rows.filter((r) => r.week >= 1 && r.week <= 100)
  const late = rows.slice(-100)
  const keys = Object.keys(rows[0]).filter((k) => k !== 'week')
  lines.push('metric            early med  late med   early mean  late mean   pearson r with stepMs (all weeks)')
  const pear = (k: string): number => {
    const xs = rows.map((r) => r[k]), ys = rows.map((r) => r.stepMs)
    const mx = mean(xs), my = mean(ys)
    let sxy = 0, sxx = 0, syy = 0
    for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2 }
    return sxx === 0 || syy === 0 ? NaN : sxy / Math.sqrt(sxx * syy)
  }
  for (const k of keys) {
    lines.push(`${k.padEnd(17)} ${med(early.map((r) => r[k])).toFixed(2).padStart(9)} ${med(late.map((r) => r[k])).toFixed(2).padStart(9)} ` +
      `${mean(early.map((r) => r[k])).toFixed(2).padStart(11)} ${mean(late.map((r) => r[k])).toFixed(2).padStart(10)}   ${k === 'stepMs' ? '' : pear(k).toFixed(3)}`)
  }
  // stepMs split by whether any result was written that week (a tournament resolved) – early vs late.
  for (const [name, w] of [['early', early], ['late', late]] as const) {
    const quiet = w.filter((r) => r.newResults === 0), busy = w.filter((r) => r.newResults > 0)
    lines.push(`${name}: weeks with no new result ${quiet.length} (stepMs med ${med(quiet.map((r) => r.stepMs)).toFixed(2)}) · ` +
      `with new results ${busy.length} (stepMs med ${med(busy.map((r) => r.stepMs)).toFixed(2)}, newResults med ${med(busy.map((r) => r.newResults))})`)
  }
}
writeFileSync(OUT, JSON.stringify(rows))
console.log(lines.join('\n'))
