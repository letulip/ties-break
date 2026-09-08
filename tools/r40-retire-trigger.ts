/**
 * r40-retire-trigger – WHEN WOULD SHE SAY «ENOUGH», UNDER EACH CANDIDATE TRIGGER.
 *
 * ⚠ THE OWNER'S OBJECTION IS THE WHOLE REASON THIS FILE EXISTS (08.09): «интересный механизм, давай
 * только подумаем когда его реально включать, потому что сейчас получается она буквально на пике
 * карьеры начинает говорить, что "всё". Может быть это тоже на какие-то показатели завязать?
 * например хладнокровие+выносливость или вроде того, тогда это будет менее предсказуемо, более
 * вариативно и живо». Invariant 5 forbids picking a trigger without measuring it, and the number
 * that decides this is not «how often does it fire» but «did she GET BETTER afterwards» – a card
 * that says «I would rather go now» to a career still climbing is the defect he reported.
 *
 * WHAT IS MEASURED, per career, on the off-season week the engine itself asks (`isSponsorReviewWeek`
 * equivalent - one reading a season, exactly where `world/endings.ts` reads it):
 *   * every season the shipped plateau card fires, with her rank, age, physical share, composure and
 *     stamina at that moment;
 *   * WHETHER SHE LATER BEAT the best rank she held when it fired (the premature test);
 *   * when each candidate trigger would first turn the question FINAL.
 *
 * ⚠ Synthetic careers only – the owner's saves in ~/Downloads are read-only and never fixtures.
 *
 * Run: npx vite-node tools/r40-retire-trigger.ts [-- --seeds 6 --weeks 900]
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { plateauReading, ENDINGS } from '../src/engine/ending'
import { plateauViewOf } from '../src/engine/world/endings'
import { physicalMean } from '../src/engine/development'
import { kidAgeYears } from '../src/engine/world/age'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const numArg = (flag: string, dflt: number) => {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : dflt
}
const seeds = numArg('--seeds', 6)
const weeks = numArg('--weeks', 900)

type Fire = {
  season: number
  age: number
  rank: number
  share: number
  composure: number
  stamina: number
  oneMoreYears: number
}
type Career = { label: string; fires: Fire[]; bestRankEver: number; endAge: number }

const careers: Career[] = []

for (const preset of PRESETS) {
  for (const policy of POLICIES) {
    for (let i = 0; i < seeds; i++) {
      const { world, rng } = openCareer(preset, i, policy)
      const w = world as WorldState & { kidRankWta?: number; peakPhysical?: number; oneMoreYearCount?: number }
      const fires: Fire[] = []
      let bestRankEver = 9999
      let asks = 0
      for (let n = 0; n < weeks; n++) {
        stepCareerWeek(world, rng, policy)
        const rank = w.kidRankWta ?? 9999
        if (rank > 0 && rank < bestRankEver) bestRankEver = rank
        // The engine's own asking week: the first off-season week and no other.
        if (world.week % WEEKS_PER_YEAR !== WEEKS_PER_YEAR - OFF_SEASON_WEEKS) continue
        const age = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
        const seasonIndex = Math.floor(world.week / WEEKS_PER_YEAR)
        // ⚠ Only the PLATEAU branch is probed: past `askFromAgeYears` the shipped `retirementDue`
        // returns the age reason first, so the plateau card cannot fire there and neither may this.
        if (age >= ENDINGS.askFromAgeYears) continue
        // ⚠ THE ENGINE'S OWN VIEW, NOT A HAND-BUILT ONE. The first draft passed
        // `lastRungSeasonIndex: null`, which switches OFF plateauReading's first condition - no
        // rung cleared inside the window - so it fired on careers the shipped card DECLINES and
        // every rate it printed was an over-count. `plateauViewOf` is what world/endings.ts calls.
        const fired = plateauReading(plateauViewOf(world))
        if (!fired) continue
        asks++
        const peak = w.peakPhysical ?? physicalMean(world.skills)
        fires.push({
          season: seasonIndex,
          age,
          rank,
          share: peak > 0 ? physicalMean(world.skills) / peak : 1,
          composure: world.skills.composure,
          stamina: world.skills.stamina,
          oneMoreYears: asks,
        })
      }
      careers.push({
        label: `${preset.label} · ${policy.label} · seed ${i}`,
        fires,
        bestRankEver,
        endAge: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
      })
    }
  }
}

const n = careers.length
const withFires = careers.filter((c) => c.fires.length > 0)
const pct = (k: number, of = n) => `${((k / of) * 100).toFixed(1)}%`

console.log(`\nCORPUS: ${PRESETS.length} presets x ${POLICIES.length} policies x ${seeds} seeds = ${n} careers, ${weeks} weeks\n`)
console.log('THE SHIPPED PLATEAU CARD, AS IT FIRES TODAY')
console.log(`  careers it ever asks          ${withFires.length} of ${n}   ${pct(withFires.length)}`)
const allFires = withFires.flatMap((c) => c.fires)
console.log(`  asks in total                 ${allFires.length}`)
if (allFires.length) {
  const ages = allFires.map((f) => f.age).sort((a, b) => a - b)
  console.log(`  age at the ask                min ${ages[0]} · median ${ages[Math.floor(ages.length / 2)]} · max ${ages[ages.length - 1]}`)
  const asksPer = withFires.map((c) => c.fires.length).sort((a, b) => a - b)
  console.log(`  asks per career               min ${asksPer[0]} · median ${asksPer[Math.floor(asksPer.length / 2)]} · max ${asksPer[asksPer.length - 1]}`)
}

// ⭐⭐ THE NUMBER THE DECISION HANGS ON: after the card said «she would rather go now», did she
// go on to a BETTER rank than she held that day? Every yes is a career the card was wrong about.
console.log('\n⭐ WAS IT PREMATURE? – did she beat that day\'s rank later in the career')
let premature = 0
let firstAskPremature = 0
for (const c of withFires) {
  const worst = c.fires[0]
  if (c.bestRankEver < worst.rank) firstAskPremature++
  if (c.fires.some((f) => c.bestRankEver < f.rank)) premature++
}
console.log(`  careers where SOME ask preceded a better rank   ${premature} of ${withFires.length}   ${pct(premature, withFires.length)}`)
console.log(`  careers where the FIRST ask did                 ${firstAskPremature} of ${withFires.length}   ${pct(firstAskPremature, withFires.length)}`)

console.log('\nCANDIDATE TRIGGERS – when each would first turn the question FINAL')
type Candidate = { label: string; hit: (f: Fire) => boolean }
const CANDIDATES: Candidate[] = [
  { label: 'K = 4 one-more-years (the count)', hit: (f) => f.oneMoreYears >= 4 },
  { label: 'K = 3 one-more-years', hit: (f) => f.oneMoreYears >= 3 },
  { label: 'physical share <= 0.90', hit: (f) => f.share <= 0.9 },
  { label: 'physical share <= 0.80', hit: (f) => f.share <= 0.8 },
  { label: 'composure + stamina below their own mean', hit: (f) => (f.composure + f.stamina) / 2 < 50 },
  { label: 'age >= 27 AND K >= 2', hit: (f) => f.age >= 27 && f.oneMoreYears >= 2 },
]
for (const cand of CANDIDATES) {
  const fired = withFires.filter((c) => c.fires.some(cand.hit))
  const prem = fired.filter((c) => {
    const first = c.fires.find(cand.hit)!
    return c.bestRankEver < first.rank
  })
  const ages = fired.map((c) => c.fires.find(cand.hit)!.age).sort((a, b) => a - b)
  console.log(
    `  ${cand.label.padEnd(38)} fires on ${String(fired.length).padStart(3)} of ${withFires.length} (${pct(fired.length, withFires.length).padStart(6)})` +
      (ages.length ? ` · median age ${ages[Math.floor(ages.length / 2)]}` : '') +
      ` · PREMATURE ${prem.length} (${pct(prem.length, Math.max(1, fired.length))})`,
  )
}

console.log('\nA SAMPLE, so the shape is readable')
for (const c of withFires.slice(0, 8)) {
  console.log(`  ${c.label}  best #${c.bestRankEver}`)
  for (const f of c.fires) {
    console.log(
      `      season ${String(f.season).padStart(2)} · age ${f.age} · rank #${f.rank} · share ${(f.share * 100).toFixed(1)}%` +
        ` · comp ${f.composure.toFixed(1)} · stam ${f.stamina.toFixed(1)} · ask #${f.oneMoreYears}` +
        (c.bestRankEver < f.rank ? '   <- she got BETTER after this' : ''),
    )
  }
}
