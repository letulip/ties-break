// Weather stage 1 bench (round 53, step 10) – spec docs/specs/weather-2026-10.md §3.4 / §3.5.
// Run: npx vite-node tools/weather-bench.ts
import { eventWeather, climateSeason } from '../src/engine/season/preview'
import { conditionsNote } from '../src/viz/preview'
import { weatherLinePicks } from '../src/engine/season/preview'
import type { MatchPlayer, MatchWeather, Surface } from '../src/engine/match/types'
import { simulateMatch, fastMatchProbability } from '../src/engine/match/engine'
import { basePServe } from '../src/engine/match/point'

const SURFACES: Surface[] = ['hard', 'clay', 'grass']
const PER_SURFACE = 2000
const SEED = 'bench'

for (const surface of SURFACES) {
  const temps: Record<string, number[]> = { winter: [], shoulder: [], summer: [] }
  const rain = { none: 0, possible: 0, falling: 0 }
  const wind = { none: 0, fresh: 0, strong: 0 }
  const lines = new Map<string, number>()
  let summerHeat = 0
  let summerN = 0
  for (let i = 0; i < PER_SURFACE; i++) {
    const week = i % 52
    const year = 2031 + Math.floor(i / 52)
    const w = eventWeather(SEED, { id: `${year}-w${week}-j60`, surface, week })
    const season = climateSeason(week)
    temps[season].push(w.temperatureC)
    rain[w.rain]++
    wind[w.wind]++
    if (season === 'summer') {
      summerN++
      if (w.temperatureC >= 30) summerHeat++
    }
    const text = conditionsNote(w.temperatureC, weatherLinePicks(w.linePick).temp).text
    lines.set(text, (lines.get(text) ?? 0) + 1)
  }
  const mean = (a: number[]) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-')
  const pct = (n: number) => `${((100 * n) / PER_SURFACE).toFixed(1)}%`
  const top = [...lines.entries()].sort((a, b) => b[1] - a[1])[0]
  const comfy = lines.get('A comfortable day for it, and no excuses in the air.') ?? 0
  console.log(`[${surface}] mean temp winter/shoulder/summer = ${mean(temps.winter)} / ${mean(temps.shoulder)} / ${mean(temps.summer)}` +
    `  min-max = ${Math.min(...Object.values(temps).flat())}-${Math.max(...Object.values(temps).flat())}`)
  console.log(`[${surface}] summer >=30C = ${((100 * summerHeat) / summerN).toFixed(1)}% (n=${summerN})`)
  console.log(`[${surface}] rain none/possible/falling = ${pct(rain.none)} / ${pct(rain.possible)} / ${pct(rain.falling)}; wind none/fresh/strong = ${pct(wind.none)} / ${pct(wind.fresh)} / ${pct(wind.strong)}`)
  console.log(`[${surface}] most common single conditions line = ${pct(top[1])} ("${top[0].slice(0, 40)}..."); comfortable line 0 = ${pct(comfy)}; distinct lines = ${lines.size}`)
}
// ⭐ r53 step 11 – THE MATCH ARM (weather stage 2, spec §4.1 / §4.2: the prediction is written there
// before this ran). Monte-Carlo through `simulateMatch` against the closed form `fastMatchProbability`
// on the same day – the parity of the two is measured cell by cell, not assumed. Every cell plays the
// SAME N seeds (`wb:<i>`), so a shift between two cells is a paired difference, not two noises.
const N = Number(process.env.WB_N ?? 20000)
const P = (o: Partial<MatchPlayer> & { id: string }): MatchPlayer =>
  ({ name: o.id, serve: 55, ret: 55, composure: 55, stamina: 55, groundstrokes: 55, ...o }) as MatchPlayer
const day = (t: number, wind: MatchWeather['wind'] = 'none', rain: MatchWeather['rain'] = 'none'): MatchWeather => ({ temperatureC: t, wind, rain })
function cell(label: string, a: MatchPlayer, b: MatchPlayer, surface: Surface, w: MatchWeather | undefined) {
  let wins = 0
  let retired = 0
  for (let i = 0; i < N; i++) {
    const r = simulateMatch(a, b, { surface, tour: 'wta', seed: `wb:${i}`, ...(w ? { weather: w } : {}) })
    if (r.winner === 0) wins++
    if (r.retired) retired++
  }
  const loop = wins / N
  const closed = fastMatchProbability(a, b, { surface, tour: 'wta', seed: '', ...(w ? { weather: w } : {}) })
  console.log(`  ${label.padEnd(34)} loop ${(100 * loop).toFixed(2)}%  closed ${(100 * closed).toFixed(2)}%  residual ${(100 * (loop - closed)).toFixed(2)} pp  retired ${((100 * retired) / N).toFixed(2)}%`)
  return { loop, closed, retired: retired / N }
}
console.log(`MATCH ARM, N=${N} per cell`)
// 1. heat, stamina gap 20
const fit = P({ id: 'fit', stamina: 70 })
const lesser = P({ id: 'lesser', stamina: 50 })
const h20 = cell('heat 20C stamina 70 v 50', fit, lesser, 'hard', day(20))
const h34 = cell('heat 34C stamina 70 v 50', fit, lesser, 'hard', day(34))
const h38 = cell('heat 38C stamina 70 v 50', fit, lesser, 'hard', day(38))
console.log(`  -> heat shift to the fitter: 34C ${(100 * (h34.loop - h20.loop)).toFixed(2)} pp, 38C ${(100 * (h38.loop - h20.loop)).toFixed(2)} pp (closed ${(100 * (h38.closed - h20.closed)).toFixed(2)} pp)`)
// 2. retirement share, an even pair of ordinary legs, 20C against 34..38C
const r1 = P({ id: 'r1', stamina: 40 })
const r2 = P({ id: 'r2', stamina: 40 })
const rBase = cell('retire 20C stamina 40 v 40', r1, r2, 'hard', day(20))
let hotRet = 0
for (const t of [34, 35, 36, 37, 38]) hotRet += cell(`retire ${t}C stamina 40 v 40`, r1, r2, 'hard', day(t)).retired / 5
console.log(`  -> retirement share 34-38C / 20C = ${(hotRet / rBase.retired).toFixed(2)}x (${(100 * hotRet).toFixed(2)}% vs ${(100 * rBase.retired).toFixed(2)}%)`)
// 3. wind, a favourite
const fav = P({ id: 'fav', serve: 65, ret: 62, groundstrokes: 62 })
const dog = P({ id: 'dog', serve: 52, ret: 52, groundstrokes: 52 })
const w0 = cell('wind none fav v dog', fav, dog, 'hard', day(20))
const w1 = cell('wind fresh fav v dog', fav, dog, 'hard', day(20, 'fresh'))
const w2 = cell('wind strong fav v dog', fav, dog, 'hard', day(20, 'strong'))
console.log(`  -> wind shift to the favourite: fresh ${(100 * (w1.loop - w0.loop)).toFixed(2)} pp, strong ${(100 * (w2.loop - w0.loop)).toFixed(2)} pp (closed ${(100 * (w1.closed - w0.closed)).toFixed(2)} / ${(100 * (w2.closed - w0.closed)).toFixed(2)})`)
// 4. rain on clay (and on hard, where it must be exactly nothing)
const c0 = cell('clay dry fav v dog', fav, dog, 'clay', day(20))
const c1 = cell('clay rain falling fav v dog', fav, dog, 'clay', day(20, 'none', 'falling'))
const hr = cell('hard rain falling fav v dog', fav, dog, 'hard', day(20, 'none', 'falling'))
console.log(`  -> rain on clay shift to the favourite ${(100 * (c1.loop - c0.loop)).toFixed(2)} pp; on hard ${(100 * (hr.loop - w0.loop)).toFixed(2)} pp (common seeds and no lever on hard: must be exactly 0)`)
// 5. serve and nerve in the wind – measured, not built in
const hold = (p: number) => {
  const q = 1 - p
  return p ** 4 * (1 + 4 * q + 10 * q * q) + (20 * p ** 3 * q ** 3 * p * p) / (1 - 2 * p * q)
}
const ret50 = P({ id: 'ret50', ret: 50 })
for (const sv of [50, 70]) {
  const srv = P({ id: `s${sv}`, serve: sv })
  const calm = basePServe(srv, ret50, { surface: 'hard', tour: 'wta', seed: '' })
  const windy = basePServe(srv, ret50, { surface: 'hard', tour: 'wta', seed: '', weather: day(20, 'strong') })
  const hc = hold(calm)
  const hw = hold(windy)
  console.log(`  serve ${sv}: p ${calm.toFixed(4)} -> ${windy.toFixed(4)}; hold ${(100 * hc).toFixed(2)}% -> ${(100 * hw).toFixed(2)}% (${(100 * (hw - hc)).toFixed(2)} pp, ${((100 * (hw - hc)) / hc).toFixed(2)}% relative)`)
}
const nerve = P({ id: 'nerve', composure: 70 })
const shaky = P({ id: 'shaky', composure: 50 })
const n0 = cell('nerve 70 v 50 calm', nerve, shaky, 'hard', day(20))
const n2 = cell('nerve 70 v 50 strong wind', nerve, shaky, 'hard', day(20, 'strong'))
console.log(`  -> the steadier nerve in a strong wind: ${(100 * (n2.loop - n0.loop)).toFixed(2)} pp`)
console.log('WEATHER_BENCH_DONE')
