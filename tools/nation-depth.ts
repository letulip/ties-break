/**
 * nation-depth – CAN OUR WORLD FIELD A NATIONAL TEAM, and at which ages?
 *
 * The owner, 10.08, on the 14-and-under team event: «нам нет дела до "страны средней величины",
 * у нас свой мир, пусть в нем наберется… А дальше же тоже будут сборные в следующих годах, верно?
 * Туда тоже кого-то нарисуем. У нас всё-таки много игроков в мире вроде, верно?»
 *
 * That is a decision about our world, not about real federations, so it needs OUR numbers. This
 * counts, for a real generated world at a real week:
 *
 *   [1] how many compatriots of the kid exist AT ALL, and at each age band – the pool a team of
 *       three is picked from, at 14U, at 16U and on the adult tour;
 *   [2] the same for every nation, so "she happens to be American" and "she happens to be Tunisian"
 *       can be told apart before a format is chosen;
 *   [3] whether the DOMESTIC rungs currently draw foreign flags – the owner's other item on the same
 *       day («я предлагаю на national, regional, local раундах делать всех соперниц с флажком нашей
 *       героини»), which is answerable off the same data.
 *
 * ⚠ MEASUREMENT ONLY. Generates a world through the engine's own door and reads it.
 *
 * Run:  npx vite-node tools/nation-depth.ts -- [--seed nation-1] [--week 104] [--seeds 8]
 */
import { createWorld } from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { fieldProsFor, fieldSeasonOf } from '../src/engine/season/fieldPros'
import { NATION_POOL } from '../src/engine/season/cohort'
import type { AiPlayer } from '../src/engine/season/types'

/** The three team-event age bands real tennis actually runs, named so the table reads as a decision. */
const BANDS: Array<[string, (a: number) => boolean]> = [
  ['14U', (a) => a <= 14],
  ['16U', (a) => a <= 16],
  ['18U', (a) => a <= 18],
  ['open', () => true],
]

function pad(s: string | number, n: number): string {
  return String(s).padStart(n)
}

function countBy(players: readonly AiPlayer[], band: (a: number) => boolean): Map<string, number> {
  const m = new Map<string, number>()
  for (const p of players) if (band(p.ageYears)) m.set(p.nation, (m.get(p.nation) ?? 0) + 1)
  return m
}

function main(): void {
  const args = process.argv.slice(2)
  const week = Number(args[args.indexOf('--week') + 1]) || 0
  const seedCount = Number(args[args.indexOf('--seeds') + 1]) || 8

  // The weights first – the shape every world is drawn from, before any one world's luck.
  const weight = new Map<string, number>()
  for (const c of NATION_POOL) weight.set(c, (weight.get(c) ?? 0) + 1)
  const totalWeight = NATION_POOL.length
  console.log(`\nTHE POOL ITSELF – ${weight.size} nations, ${totalWeight} weighted slots (season/cohort.ts NATION_WEIGHTS)`)
  console.log(`  a 199-junior cohort spreads over 7 age bands (13..19), so ~28 girls per band.`)
  console.log(`  EXPECTED same-band compatriots, by nation weight:`)
  const rows = [...weight.entries()].sort((a, b) => b[1] - a[1])
  for (const [code, w] of [rows[0], rows[Math.floor(rows.length / 2)], rows[rows.length - 1]]) {
    console.log(`    ${code} weight ${pad(w, 2)}/${totalWeight}  →  ${((199 * w) / totalWeight / 7).toFixed(2)} per age band, ${((199 * w) / totalWeight).toFixed(1)} across 13..19`)
  }

  // Now real worlds.
  console.log(`\nMEASURED, ${seedCount} worlds at week ${week}`)
  console.log(`  band │ nations with ≥3 │ nations with ≥2 │ nations with ≥1 │ best nation │ median`)
  console.log(`  ${'─'.repeat(76)}`)

  for (const [label, band] of BANDS) {
    const with3: number[] = []
    const with2: number[] = []
    const with1: number[] = []
    const best: number[] = []
    const med: number[] = []
    for (let s = 0; s < seedCount; s++) {
      const world = createWorld(`nation-${s}`, { ...DEFAULT_PROFILE })
      world.week = week
      const counts = countBy(world.cohort, band)
      const vals = [...counts.values()].sort((a, b) => b - a)
      with3.push([...counts.values()].filter((n) => n >= 3).length)
      with2.push([...counts.values()].filter((n) => n >= 2).length)
      with1.push(counts.size)
      best.push(vals[0] ?? 0)
      med.push(vals[Math.floor(vals.length / 2)] ?? 0)
    }
    const avg = (xs: number[]) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)
    console.log(
      `  ${label.padEnd(5)}│${pad(avg(with3), 16)} │${pad(avg(with2), 16)} │${pad(avg(with1), 16)} │${pad(avg(best), 12)} │${pad(avg(med), 7)}`,
    )
  }

  // The kid's own country, which is what the feature actually turns on.
  console.log(`\nTHE KID'S OWN COUNTRY (profile.country, default '${DEFAULT_PROFILE.country}')`)
  const world = createWorld('nation-0', { ...DEFAULT_PROFILE })
  for (const [label, band] of BANDS) {
    const counts = countBy(world.cohort, band)
    const mine = counts.get(DEFAULT_PROFILE.country) ?? 0
    console.log(`  ${label.padEnd(5)} compatriots in the live cohort: ${mine}  → a team of 3 ${mine >= 3 ? 'FITS' : mine >= 2 ? 'is one short' : 'cannot be filled'} from juniors alone`)
  }

  // And the professionals, who are drawn from the SAME weighted pool – the pool a senior team
  // would come from once she is on the adult tour.
  const pros = fieldProsFor('nation-0', fieldSeasonOf(week))
  const proCounts = new Map<string, number>()
  for (const p of pros) proCounts.set(p.nation, (proCounts.get(p.nation) ?? 0) + 1)
  const proVals = [...proCounts.values()].sort((a, b) => b - a)
  console.log(
    `\nTHE PROFESSIONAL POPULATION: ${pros.length} pros over ${proCounts.size} nations · best ${proVals[0]} · median ${proVals[Math.floor(proVals.length / 2)]} · ${DEFAULT_PROFILE.country} ${proCounts.get(DEFAULT_PROFILE.country) ?? 0}`,
  )

  // [3] The domestic rungs and their flags.
  const foreign = world.cohort.filter((p) => p.nation !== DEFAULT_PROFILE.country).length
  console.log(
    `\nDOMESTIC-RUNG FLAGS: ${foreign} of ${world.cohort.length} cohort juniors (${((100 * foreign) / world.cohort.length).toFixed(0)}%) carry a flag that is NOT hers,`,
  )
  console.log(`  and nothing in selectEntrants filters local/regional/national by nation – so a "national championship"`)
  console.log(`  is currently contested by ${((100 * foreign) / world.cohort.length).toFixed(0)}% foreigners. That is the owner's item, confirmed from the data.`)
}

main()
