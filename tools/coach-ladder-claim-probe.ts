// THE COACH'S LADDER CLAIM, CHECKED AGAINST THE ARITHMETIC IT BORROWS ITS SENTENCE FROM.
//
//   npx vite-node tools/coach-ladder-claim-probe.ts -- [--seeds N] [--weeks N]
//
// ⚠ WHY IT EXISTS. The owner, 12.08, reading an entry confirm: «the National Series is the week -
// this one will not move anything. Enter World Tour 35?» ... «что вообще довольно странно по самой
// формулировке». The grammar is the visible half. This probe is about the other half.
//
// THE CLAIM AND WHERE IT CAME FROM. `coachLadderNote` (engine/world/coachMarket.ts) speaks in
// clauses. Clause 2 says "even a title here would not move her ranking" and it EARNS that sentence:
// it is gated on `bookClosedTo(world, event.tier)`, which is the best-N arithmetic, and on
// `coachReadsTheBook(tier)`, because keeping her book is a job a budget coach does not do.
// Clause 1 - the one the owner read - said "this one will not move anything" and asked NEITHER. Its
// whole test was `hasOutgrown(world, event.tier)` plus the existence of a same-week rung she had not
// outgrown. So the strongest claim in the function was made by the branch that did the least work.
//
// ⚠ AND THE TWO RUNGS NEEDED NOT BE ON THE SAME TABLE. `better()` ranked candidates by `TIER_LADDER`
// and never compared `TIERS[t].track`, so the alternative it held up could pay DOMESTIC points while
// the card it argued against paid PROFESSIONAL ones - which is the defect `entryCouldNotMove`
// records having been caught in the browser once already ("«Final national rank #3» over «13 could
// not move her ranking», and all thirteen were the domestic events that had made her third",
// engine/world/ladder.ts). The owner's own line is that shape: National Series is domestic, World
// Tour 35 is professional.
//
// MEASURED ON THAT CODE (this probe, defaults, before the 12.08 fix): clause 1 fired on 2658 cards,
// the alternative was on ANOTHER table for 84.5% of them, and the card's own book HAD ROOM - the
// sentence was false - for 87.1%. The control was 0 of 237, as construction promises.
//
// ⚠ RE-SYNCED TO THE FIX (12.08). The strong sentence now fires only on a card that pays into a
// table she is climbing whose book really is shut (`bookClosedTo` + `coachReadsTheBook`); a card on
// a table she is NOT climbing gets the track sentence instead, whatever its dead window holds; and
// every alternative must be on a table she is climbing (`activeLadderOf` and up). The replicated
// conditions below mirror that code - and because a copy can drift, the probe now ALSO calls the
// real `coachLadderNote` on every card and counts every disagreement between the sentence and the
// replica. A non-zero disagreement line means the probe is wrong, not the engine.
//
// WHAT IT REPORTS, over real careers:
//   1. for every card where the STRONG sentence ("will not move anything") fires: how often
//      `bookClosedTo` is FALSE (the false-sentence rate), how often the alternative is OFF her
//      climbing tables or BELOW the card's own table (the two directions of the steering defect,
//      and the second is the owner's own card: National Series held up against a World Tour 35).
//      All three are 0 by construction now, and this probe is what holds the construction to its
//      word. A fourth line counts the alternative crossing a seam UPWARD - a J30 named on a shut
//      Local card - which is the ladder's own on-ramp and is reported so nobody re-reads it as the
//      defect;
//   2. the same book test for clause 2, the control - 0% by construction, before and after;
//   3. where the OLD firing set went: every card the pre-fix clause 1 would have dismissed,
//      classified by what the coach says about it today.
//
// ⚠ ZERO ENGINE CHANGES AND ZERO EXTRA DRAWS: it reads `world` and never writes to it. Careers are
// the published econ bench's own, so the rungs and the book are the ones a player actually meets.
import { PRESETS, POLICIES, openCareer, stepCareerWeek, type Policy } from './econ-bench'
import { activeLadderOf, bookClosedTo, coachLadderNote, hasOutgrown, tierOpenFor, type WorldState } from '../src/engine/world'
import { COACH_HORIZON_WEEKS, coachReadsTheBook } from '../src/engine/world/coachMarket'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { LADDER_TRACKS } from '../src/shared/protocol'
import type { CoachTier } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 24)
const WEEKS = argOf('weeks', 52 * 5)

/** `coachLadderNote`'s own candidate picker, copied rather than imported because the function does
 *  not export it. Any drift here makes the probe wrong, so it is one expression, stays one, and the
 *  disagreement counter below is what catches it drifting anyway. */
function better(world: WorldState, from: number, to: number) {
  const firstClimbed = LADDER_TRACKS.indexOf(activeLadderOf(world))
  const climbs = (track: LadderTrack): boolean => LADDER_TRACKS.indexOf(track) >= firstClimbed
  return world.season
    .filter(
      (e) =>
        e.week >= from && e.week <= to && climbs(TIERS[e.tier].track) && tierOpenFor(world, e.tier) && !hasOutgrown(world, e.tier),
    )
    .sort((a, b) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier))[0]
}

/** ...and the PRE-FIX picker, kept so the report can say where the old firing set went. */
function betterBlind(world: WorldState, from: number, to: number) {
  return world.season
    .filter((e) => e.week >= from && e.week <= to && tierOpenFor(world, e.tier) && !hasOutgrown(world, e.tier))
    .sort((a, b) => a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier))[0]
}

interface Tally {
  fired: number
  offClimbing: number
  belowCard: number
  upSeam: number
  bookHadRoom: number
}
const blank = (): Tally => ({ fired: 0, offClimbing: 0, belowCard: 0, upSeam: 0, bookHadRoom: 0 })

const clause1 = blank()
const clause2 = blank()
/** The old firing set, classified by today's sentence. Keys are the sentences' own fragments. */
const rehoused = { strong: 0, wrongTable: 0, outgrown: 0, book: 0, saved: 0, silence: 0 }
let disagreements = 0
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
      const shut = coachReadsTheBook(TIER) && bookClosedTo(world, e.tier)
      const firstClimbed = LADDER_TRACKS.indexOf(activeLadderOf(world))
      const cardClimbs = LADDER_TRACKS.indexOf(TIERS[e.tier].track) >= firstClimbed
      const said = coachLadderNote(world, e, TIER)
      // The replica against the real sentence: the strong claim exactly when the card is on a
      // climbing table, its book is shut, and a same-week alternative on a climbing table exists.
      // Any mismatch is probe drift and is reported, never patched.
      const strongFires = Boolean(sameWeek && cardClimbs && shut)
      if ((said?.includes('will not move anything') ?? false) !== strongFires) disagreements++
      if (strongFires && sameWeek) {
        clause1.fired++
        const altIdx = LADDER_TRACKS.indexOf(TIERS[sameWeek.tier].track)
        const cardIdx = LADDER_TRACKS.indexOf(TIERS[e.tier].track)
        const offClimbing = altIdx < firstClimbed
        const belowCard = altIdx < cardIdx
        if (offClimbing) clause1.offClimbing++
        if (belowCard) clause1.belowCard++
        if (altIdx > cardIdx) clause1.upSeam++
        if (!bookClosedTo(world, e.tier)) clause1.bookHadRoom++
        if ((offClimbing || belowCard) && examples.length < 8) {
          examples.push(
            `  w${world.week}: card ${TIERS[e.tier].label} (${TIERS[e.tier].track}) vs ` +
              `alternative ${TIERS[sameWeek.tier].label} (${TIERS[sameWeek.tier].track})`,
          )
        }
      } else if (!sameWeek && shut) {
        clause2.fired++
        if (!bookClosedTo(world, e.tier)) clause2.bookHadRoom++
      }
      // Where the pre-fix firing set went. Its condition was: any same-week not-outgrown rung, no
      // track test, no book test - every one of those cards heard "will not move anything".
      if (betterBlind(world, e.week, e.week)) {
        if (said === null) rehoused.silence++
        else if (said.includes('will not move anything')) rehoused.strong++
        else if (said.includes('not the table she is climbing')) rehoused.wrongTable++
        else if (said.includes('has outgrown this one')) rehoused.outgrown++
        else if (said.includes('would not move her ranking')) rehoused.book++
        else if (said.includes('would save her')) rehoused.saved++
      }
    }
    if (world.ending) break
    stepCareerWeek(world, rng, policy)
  }
}

const pct = (n: number, d: number) => (d === 0 ? '  n/a' : `${((100 * n) / d).toFixed(1)}%`)
console.log(`seeds ${SEEDS}, weeks ${WEEKS}, coach rung ${TIER}`)
console.log('')
console.log('CLAUSE 1b - "the X is the week - this one will not move anything" (the STRONG claim)')
console.log(`  fired on                              ${clause1.fired} cards`)
console.log(`  card's own book HAD ROOM              ${clause1.bookHadRoom} (${pct(clause1.bookHadRoom, clause1.fired)}, expected 0 - the false-sentence rate)`)
console.log(`  alternative OFF her climbing tables   ${clause1.offClimbing} (${pct(clause1.offClimbing, clause1.fired)}, expected 0)`)
console.log(`  alternative BELOW the card's table    ${clause1.belowCard} (${pct(clause1.belowCard, clause1.fired)}, expected 0 - the owner's own card)`)
console.log(`  alternative one seam UP (an on-ramp)  ${clause1.upSeam} (${pct(clause1.upSeam, clause1.fired)}, legitimate - a J30 named on a shut Local card)`)
console.log('')
console.log('CLAUSE 2 - "even a title here would not move her ranking" (the control)')
console.log(`  fired on                       ${clause2.fired} cards`)
console.log(`  card's own book HAD ROOM       ${clause2.bookHadRoom} (expected 0)`)
console.log('')
console.log('WHERE THE PRE-FIX FIRING SET WENT (every card the old clause 1 dismissed):')
console.log(`  "will not move anything" and it is TRUE   ${rehoused.strong}`)
console.log(`  "not the table she is climbing"           ${rehoused.wrongTable}`)
console.log(`  "she has outgrown this one"               ${rehoused.outgrown}`)
console.log(`  "would not move her ranking" (the book)   ${rehoused.book}`)
console.log(`  "would save her for ..." (the horizon)    ${rehoused.saved}`)
console.log(`  silence                                   ${rehoused.silence}`)
console.log('')
console.log(`sentence vs replica disagreements: ${disagreements} (a non-zero here means the PROBE drifted)`)
if (examples.length) {
  console.log('')
  console.log('DEFECT CARDS - the strong claim with an off-climbing or below-card alternative (expected none):')
  for (const line of examples) console.log(line)
}
