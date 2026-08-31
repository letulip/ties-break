/**
 * r31 – CAN A PLAYER LIVE AT THE TOP? Three questions the owner asked, against real WTA reference:
 *   1. weeks in the top 10, consecutive and total   (WTA elite: 2-3 years consecutive; legends far more)
 *   2. seasons with at least one title, and the longest CONSECUTIVE run of them
 *      (WTA record 21 straight years; Serena's best 11; modern streaks much shorter)
 *   3. defending the same title a year later        (WTA: under 10% at Slam level)
 *
 * Read-only on the engine; walks fresh bench careers, records nothing to disk but its own report.
 *   npx vite-node tools/r31-elite-tenure.ts -- --seeds 12 --preset 8
 */
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import { rankingFor } from '../src/engine/world/ladder'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { KID_ID } from '../src/engine/world/constants'

const args = process.argv.slice(2)
const argOf = (n: string, d: number) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 ? Number(args[i + 1]) : d
}
const SEEDS = argOf('seeds', 12)
/** ⚠ `track: 'wta'` spans w15..slam – the whole professional ladder, feeder events included. A
 *  "title" in his question means a MAIN-TOUR title, which is these four rungs and no others.
 *  Counting the feeder rungs made the first honest-looking run report 54.7 titles a career. */
const MAIN = new Set(['wta250', 'wta500', 'wta1000', 'slam'])
const PRESET = PRESETS[argOf('preset', PRESETS.length - 1)]
const POLICY = POLICIES[argOf('policy', 1)]  // 1 = 'player' – the realistic career; 0 = 'grinder' never leaves the junior rungs

type Career = {
  topTenWeeks: number
  topTenLongest: number
  bestRank: number
  titleSeasons: Set<number>
  titleStreak: number
  titles: { season: number; tier: string; slot: number; track: string }[]
  defences: number
  seasonsPlayed: number
}

const careers: Career[] = []
for (let s = 0; s < SEEDS; s++) {
  const { world, rng } = openCareer(PRESET, s, POLICY)
  const c: Career = {
    topTenWeeks: 0, topTenLongest: 0, bestRank: 9999,
    titleSeasons: new Set(), titleStreak: 0, titles: [], defences: 0, seasonsPlayed: 0,
  }
  let run = 0
  const seenResults = new Set<string>()
  for (let w = 0; w < FULL_CAREER_WEEKS; w++) {
    stepCareerWeek(world, rng, POLICY)
    // TITLES AS THEY HAPPEN – `world.results` is a rolling 52-week window and prunes, so a career
    // read only at the end loses most of them.
    for (const r of world.results) {
      if (r.playerId !== KID_ID || !r.tier) continue
      const key = `${r.week}|${r.tier}|${r.points}`
      if (seenResults.has(key)) continue
      seenResults.add(key)
      const t = TIERS[r.tier as keyof typeof TIERS]
      if (t && r.points === t.points[0]) {
        c.titles.push({ season: Math.floor(r.week / WEEKS_PER_YEAR), tier: r.tier, slot: r.week % WEEKS_PER_YEAR, track: t.track })
        // ⚠ ONLY A TOUR TITLE COUNTS TOWARD THE STREAK. A junior or domestic trophy is not what he
        // is asking about, and counting it made the first run report 11 titles for a #1800 player.
        if (MAIN.has(r.tier)) c.titleSeasons.add(Math.floor(r.week / WEEKS_PER_YEAR))
      }
    }
    const rank = rankingFor(world, 'wta').findIndex((x) => x.playerId === KID_ID) + 1
    if (rank > 0) {
      c.bestRank = Math.min(c.bestRank, rank)
      if (rank <= 10) { c.topTenWeeks++; run++; c.topTenLongest = Math.max(c.topTenLongest, run) }
      else run = 0
    }
    if (world.ending) break
  }
  // longest run of CONSECUTIVE seasons carrying a title
  const seasons = [...c.titleSeasons].sort((a, b) => a - b)
  let best = 0, cur = 0, prev = -99
  for (const y of seasons) { cur = y === prev + 1 ? cur + 1 : 1; best = Math.max(best, cur); prev = y }
  c.titleStreak = best
  c.seasonsPlayed = seasons.length ? Math.max(...seasons) - Math.min(...seasons) + 1 : 0
  // DEFENCE: the same tier in the same calendar slot, a year apart
  for (const t of c.titles.filter((x) => MAIN.has(x.tier))) {
    if (c.titles.some((o) => o.tier === t.tier && o.slot === t.slot && o.season === t.season - 1)) c.defences++
  }
  careers.push(c)
  console.log(
    `seed ${s}: best #${c.bestRank === 9999 ? '-' : c.bestRank}  top10 ${c.topTenWeeks}w (run ${c.topTenLongest}w)  main titles ${c.titles.filter((t) => MAIN.has(t.tier)).length} (slams ${c.titles.filter((t) => t.tier === 'slam').length}) in ${c.titleSeasons.size} seasons  streak ${c.titleStreak}y  defences ${c.defences}`,
  )
}

const n = careers.length
const sum = (f: (c: Career) => number) => careers.reduce((a, c) => a + f(c), 0)
const max = (f: (c: Career) => number) => Math.max(...careers.map(f))
console.log(`\n${'='.repeat(78)}\n${PRESET.label} – ${n} careers, ${POLICY.label}\n${'='.repeat(78)}`)
console.log(`reached the top 10 at all      : ${careers.filter((c) => c.bestRank <= 10).length} of ${n}`)
console.log(`longest top-10 run, mean       : ${(sum((c) => c.topTenLongest) / n / WEEKS_PER_YEAR).toFixed(1)} years   max ${(max((c) => c.topTenLongest) / WEEKS_PER_YEAR).toFixed(1)} years`)
console.log(`total weeks in the top 10, mean: ${(sum((c) => c.topTenWeeks) / n).toFixed(0)}w   max ${max((c) => c.topTenWeeks)}w`)
console.log(`careers with a MAIN-TOUR title : ${careers.filter((c) => c.titles.some((t) => MAIN.has(t.tier))).length} of ${n}`)
const mainT = (c: Career) => c.titles.filter((t) => MAIN.has(t.tier)).length
const slamT = (c: Career) => c.titles.filter((t) => t.tier === 'slam').length
const feeder = (c: Career) => c.titles.filter((t) => t.track === 'wta' && !MAIN.has(t.tier)).length
console.log(`MAIN-TOUR titles per career    : mean ${(sum(mainT) / n).toFixed(1)}   max ${max(mainT)}`)
console.log(`  of which Slams               : mean ${(sum(slamT) / n).toFixed(1)}   max ${max(slamT)}`)
console.log(`feeder titles (W15..W100)      : mean ${(sum(feeder) / n).toFixed(1)}`)
console.log(`longest run of title SEASONS   : mean ${(sum((c) => c.titleStreak) / n).toFixed(1)}y   max ${max((c) => c.titleStreak)}y`)
console.log(`title defences (same slot+tier): ${sum((c) => c.defences)} across ${sum((c) => c.titles.length)} titles`)
console.log(`\nREAL WTA REFERENCE: top-10 tenure 2-3 years consecutive for an elite player (Navratilova 1000w,`)
console.log(`Evert 746w, Swiatek/Sabalenka 4y+); longest run of seasons-with-a-title 21y (Navratilova),`)
console.log(`Serena's best 11y; defending the same Slam title under 10% over the last two decades.`)
