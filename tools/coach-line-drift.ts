// THE COACH AND THE RING ARE TALKING ABOUT DIFFERENT THINGS.
//
// Owner, 31.07: «на карточках турниров иногда попадается "On paper this is hers to lose" при 92% =)
// и в обратную сторону тоже бывает».
//
// He is right, and the two clauses are not even about the same question:
//   * the RING is `preview.firstMatchChance` - P(she beats ONE named opponent in the first round);
//   * the COACH's line is picked off `preview.fieldStrength` - the share of the WHOLE field ranked
//     ahead of her, banded at 0.75 / 0.35 (`strengthOf`, engine/season/preview.ts).
// A strong field can hand her a soft first round, and a field she towers over can hand her the one
// player in it who can beat her. Both facts are true; printed side by side with no seam, they read
// as one claim contradicting itself.
//
// SO: MEASURE THE JOINT DISTRIBUTION BEFORE WRITING ANY COPY. A contradiction that fires once in a
// thousand cards wants a different fix from one that fires in a fifth of them, and the copy should be
// aimed at what the player really sees rather than at what I imagine he sees.
//
// Run: npx vite-node tools/coach-line-drift.ts

import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { toSnapshot } from '../src/engine/world'

const WEEKS = 260 // 14 -> 19
const SEEDS = 6

type Field = 'strong' | 'even' | 'favourite'
type Band = 'hard' | 'tight' | 'comfortable'

// The bands the copy will have to speak in. Deliberately wide in the middle: a card at 55% contradicts
// nothing, and calling it a clash would make the seam fire constantly and mean nothing when it did.
function bandOf(chance: number): Band {
  if (chance >= 0.65) return 'comfortable'
  if (chance <= 0.35) return 'hard'
  return 'tight'
}

const counts = new Map<string, number>()
const chanceIn = new Map<string, number[]>()
let cards = 0

for (const preset of PRESETS) {
  for (const policy of POLICIES) {
    for (let i = 0; i < SEEDS; i++) {
      const { world, rng } = openCareer(preset, i, policy)
      for (let w = 0; w < WEEKS; w++) {
        stepCareerWeek(world, rng, policy)
        // Read the cards the Season screen would really be showing - through `toSnapshot`, the same
        // path the screen uses, so this measures the GAME and not a re-derivation of it. Every fourth
        // week keeps the sweep spread across the season without paying a snapshot per week.
        if (w % 4 !== 0) continue
        for (const e of toSnapshot(world).upcoming) {
          const field = e.preview.fieldStrength as Field
          const key = `${field}|${bandOf(e.preview.firstMatchChance)}`
          counts.set(key, (counts.get(key) ?? 0) + 1)
          chanceIn.set(key, [...(chanceIn.get(key) ?? []), e.preview.firstMatchChance])
          cards++
        }
      }
    }
  }
}

const FIELDS: Field[] = ['strong', 'even', 'favourite']
const BANDS: Band[] = ['hard', 'tight', 'comfortable']
const pct = (n: number) => `${((n / cards) * 100).toFixed(1)}%`
const med = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0)

console.log(`\nWHAT THE COACH SAYS x WHAT THE RING SHOWS - ${cards} cards\n`)
console.log(`${'field verdict'.padEnd(14)} ${BANDS.map((b) => b.padStart(16)).join(' ')}`)
for (const f of FIELDS) {
  const row = BANDS.map((b) => {
    const n = counts.get(`${f}|${b}`) ?? 0
    return `${n} (${pct(n)})`.padStart(16)
  }).join(' ')
  console.log(`${f.padEnd(14)} ${row}`)
}

// The two cells that read as a contradiction on the card.
const clash = ['favourite|hard', 'strong|comfortable']
console.log(`\nTHE CELLS THAT CONTRADICT THEMSELVES ON SCREEN`)
for (const key of clash) {
  const n = counts.get(key) ?? 0
  const [f, b] = key.split('|')
  console.log(
    `  coach says "${f}", ring reads ${b.padEnd(11)} : ${String(n).padStart(5)} cards (${pct(n)}), median ring ${(med(chanceIn.get(key) ?? []) * 100).toFixed(0)}%`,
  )
}
const total = clash.reduce((n, k) => n + (counts.get(k) ?? 0), 0)
console.log(`  TOTAL                                   : ${total} of ${cards} cards (${pct(total)})`)

// And the owner's exact sighting: a favourite line on a ring that reads as a near-certainty is not a
// contradiction at all - it is an UNDERSTATEMENT ("hers to lose" is a hedge; 92% is not a hedge).
// Counted separately so the two do not get fixed with the same tool.
const overwhelming = (chanceIn.get('favourite|comfortable') ?? []).filter((c) => c >= 0.85).length
console.log(`\n  a favourite line on a ring of 85%+      : ${overwhelming} cards (${pct(overwhelming)})`)
