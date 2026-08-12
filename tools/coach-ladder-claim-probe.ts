// THE COACH'S LADDER CLAIM, CHECKED AGAINST THE ARITHMETIC IT BORROWS ITS SENTENCE FROM.
//
//   npx vite-node tools/coach-ladder-claim-probe.ts -- [--seeds N] [--weeks N]
//
// ⚠ WHY IT EXISTS. The owner, 12.08, reading an entry confirm: «the National Series is the week -
// this one will not move anything. Enter World Tour 35?» ... «что вообще довольно странно по самой
// формулировке». The grammar is the visible half. This probe is about the other half.
//
// THE CLAIM AND WHERE IT COMES FROM. `coachLadderNote` (engine/world/coachMarket.ts) has four
// clauses. Clause 2 says "even a title here would not move her ranking" and it EARNS that sentence:
// it is gated on `bookClosedTo(world, event.tier)`, which is the best-N arithmetic, and on
// `coachReadsTheBook(tier)`, because keeping her book is a job a budget coach does not do.
// Clause 1 - the one the owner read - says "this one will not move anything" and asks NEITHER. Its
// whole test is `hasOutgrown(world, event.tier)` plus the existence of a same-week rung she has not
// outgrown. So the strongest claim in the function is made by the branch that does the least work.
//
// ⚠ AND THE TWO RUNGS NEED NOT BE ON THE SAME TABLE. `better()` ranks candidates by `TIER_LADDER`
// and never compares `TIERS[t].track`, so the alternative it holds up can pay DOMESTIC points while
// the card it is arguing against pays PROFESSIONAL ones - which is the defect `entryCouldNotMove`
// records having been caught in the browser once already ("«Final national rank #3» over «13 could
// not move her ranking», and all thirteen were the domestic events that had made her third",
// engine/world/ladder.ts). The owner's own line is that shape: National Series is domestic, World
// Tour 35 is professional.
//
// WHAT IT REPORTS, over real careers, for every card where clause 1 fires:
//   1. how often the alternative is on a DIFFERENT track from the card it is arguing against;
//   2. how often `bookClosedTo(world, event.tier)` is FALSE - i.e. the card's own table still had
//      room, so a title there WOULD have moved her ranking and the sentence is not true;
//   3. the same two counts for clause 2, which is the control: it should be 0% and 0% by
//      construction, and if it is not, the reading is wrong rather than the engine.
//
// ⚠ ZERO ENGINE CHANGES AND ZERO EXTRA DRAWS: it reads `world` and never writes to it. Careers are
// the published econ bench's own, so the rungs and the book are the ones a player actually meets.
import { PRESETS, POLICIES, openCareer, stepCareerWeek, type Policy } from './econ-bench'
import { bookClosedTo, hasOutgrown, tierOpenFor, type WorldState } from '../src/engine/world'
import { COACH_HORIZON_WEEKS, coachReadsTheBook } from '../src/engine/world/coachMarket'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import type { CoachTier } from '../src/shared/protocol'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 24)
const WEEKS = argOf('weeks', 52 * 5)

/** `coachLadderNote`'s own candidate picker, copied rather than imported because the function does
 *  not export it. Any drift here makes the probe wrong, so it is one expression and stays one. */
function better(world: WorldState, from: number, to: number) {
  return world.season
    .filter((e) => e.week >= from && e.week <= to && tierOpenFor(world, e.tier) && !hasOutgrown(world, e.tier))
    .sort((a, b) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier))[0]
}

interface Tally {
  fired: number
  crossTrack: number
  bookHadRoom: number
}
const blank = (): Tally => ({ fired: 0, crossTrack: 0, bookHadRoom: 0 })

const clause1 = blank()
const clause2 = blank()
const examples: string[] = []

/** The rung the note is spoken from. Middle keeps the book (`coachReadsTheBook`) and has a horizon,
 *  so both clauses are reachable from one arm and the control is honest. */
const TIER: CoachTier = 'middle'

for (let s = 0; s < SEEDS; s++) {
  const preset = PRESETS[s % PRESETS.length]
  const policy: Policy = POLICIES[s % POLICIES.length]
  const { world, rng } = openCareer(preset, s, policy)
  for (let w = 0; w < WEEKS; w++) {
    for (const e of world.season) {
      if (e.week !== world.week) continue
      if (COACH_HORIZON_WEEKS[TIER] < 0) continue
      if (!hasOutgrown(world, e.tier)) continue
      const sameWeek = better(world, e.week, e.week)
      const shut = bookClosedTo(world, e.tier)
      if (sameWeek) {
        clause1.fired++
        const cross = TIERS[sameWeek.tier].track !== TIERS[e.tier].track
        if (cross) clause1.crossTrack++
        if (!shut) clause1.bookHadRoom++
        if (cross && !shut && examples.length < 8) {
          examples.push(
            `  w${world.week}: card ${TIERS[e.tier].label} (${TIERS[e.tier].track}) vs ` +
              `alternative ${TIERS[sameWeek.tier].label} (${TIERS[sameWeek.tier].track}) - book had room`,
          )
        }
      } else if (coachReadsTheBook(TIER) && shut) {
        clause2.fired++
        if (!bookClosedTo(world, e.tier)) clause2.bookHadRoom++
      }
    }
    if (world.ending) break
    stepCareerWeek(world, rng, policy)
  }
}

const pct = (n: number, d: number) => (d === 0 ? '  n/a' : `${((100 * n) / d).toFixed(1)}%`)
console.log(`seeds ${SEEDS}, weeks ${WEEKS}, coach rung ${TIER}`)
console.log('')
console.log('CLAUSE 1 - "the X is the week - this one will not move anything"')
console.log(`  fired on                       ${clause1.fired} cards`)
console.log(`  alternative on ANOTHER table   ${clause1.crossTrack} (${pct(clause1.crossTrack, clause1.fired)})`)
console.log(`  card's own book HAD ROOM       ${clause1.bookHadRoom} (${pct(clause1.bookHadRoom, clause1.fired)})`)
console.log('    ^ every one of these is the sentence asserting something false about her ranking')
console.log('')
console.log('CLAUSE 2 - "even a title here would not move her ranking" (the control)')
console.log(`  fired on                       ${clause2.fired} cards`)
console.log(`  card's own book HAD ROOM       ${clause2.bookHadRoom} (expected 0)`)
if (examples.length) {
  console.log('')
  console.log('first cross-table cards where the book still had room:')
  for (const line of examples) console.log(line)
}
