// Weather stage 1 bench (round 53, step 10) – spec docs/specs/weather-2026-10.md §3.4 / §3.5.
// Run: npx vite-node tools/weather-bench.ts
import { eventWeather, climateSeason } from '../src/engine/season/preview'
import { conditionsNote } from '../src/viz/preview'
import { weatherLinePicks } from '../src/engine/season/preview'
import type { Surface } from '../src/engine/match/types'

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
console.log('WEATHER_BENCH_DONE')
