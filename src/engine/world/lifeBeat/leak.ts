// A-06 / T6.8 – `world/lifeBeat.ts` §9 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ WHY THE LEAK WENT FIRST.
// ⚠ leak: AND IT SITS FLAT IN `world/lifeBeat/`, WHICH IS NOT A PREFERENCE.
// → docs/notes/life-beats/leak.md#leakts-header
import { rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { expressedTemperamentOf, temperamentOpenness } from '../../spirit'
import { addEvent } from '../ledger'
import { activeEpisode } from '../loveEpisodes'
import { LEAK_EVENT } from './leakCopy'
import { fameAt } from '../fame'
import { newsStandingOf } from '../spotlight'
import type { WorldState } from '../state'

// 9. THE LEAK – ⚠⚠ THE WEEK THE **WORLD** FINDS OUT (the spotlight, wave 6: T6) –
// `docs/specs/who-she-is-2026-09.md` §3c-bis, `docs/plans/life-wave-6-builder-2026-09.md` §2
// T6, constants in `ECONOMY.spotlight`. Sections 5 to 8 above are one attachment's arc as the
// FAMILY lives it; this is the only place a third party ever enters it.
//
// owner (leak), 10.09: «слава + комментаторы + пресса + давление + темпераменты – мне кажется у нас как-то тоже можно понимать»…
// ⚠⚠ leak: THE TWO STREAMS OF THIS WAVE, AND THEY ARE THE ONLY TWO IT HAS
// ⚠ leak: THE SECOND IS DERIVED ONLY ON THE WEEK THE FIRST FIRES
// ⚠⚠ leak: ZERO DRAWS ON MAIN AND ZERO DRAWS ON AN INELIGIBLE WEEK.
// ⚠ leak: AND THE TEST FOR IT IS A KEY COUNT WITH A VALUE CHECK BESIDE…
// ⚠⚠ leak: THE GATE ASKS ABOUT THE **LAST CLOSED WEEK**, WHICH IS THE ARCHITECT'S RULING P APPLIED TO THIS CHANNEL AND NOT A SECOND CLOCK.
// ⚠ leak: THE STAMP STILL NAMES **THIS** WEEK
// ⚠ leak: SO T3's PASS SEES THE `'wrongStory'` EVENT ONE TICK LATER, and that is the wave's one clock working rather than a lag anybody…
// ⚠⚠ leak: IT RUNS ON THE **ACTIVE** EPISODE, WHICH IS A NARROWING OF THE BRIEF AND IS STATED RATHER THAN SLIPPED IN.
// ⚠ leak: AND «PER EPISODE-WEEK» IS UNTOUCHED BY THE NARROWING
// ⚠⚠ leak: AND `knownWeek === null` IS NOT REACHABLE, WHICH MOVES THE OVERTAKE'S CONDITION.
// ⚠ leak: IT WRITES THE TWO PUBLICITY STAMPS, ONE KEPT FEED ROW…
// → docs/notes/life-beats/leak.md#leakts-9--the-leak


/** ⭐⭐ THE GATE – ONE FUNCTION, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ leakEligible: A PREDICATE OF ITS OWN FOR `arrivalEligible`'s, `smallTalkEligible`'s AND `endsEligible`'s STATED REASON
 *  → docs/notes/life-beats/leak.md#leakeligible--the-gate--one-function-and-a-false-here-means-zero
 */
export function leakEligible(world: WorldState): boolean {
  const open = activeEpisode(world)
  if (open === null || open.publicWeek !== null) return false
  // ⭐ D1 (14.09): the standing read replaces the fame bar. Present-tense by the predicate's own
  // contract – the cached rank already describes the last closed fold, so ruling P's one-horizon
  // law is kept by construction rather than by a week argument.
  return newsStandingOf(world) !== 'quiet'
}

/** ⭐⭐⭐ THE WEEKLY LEAK HAZARD, as one probability – who-she-is §3c-bis's own formula, restored
 *  in full by the architect's RULING I:
 *
 *  ⚠⚠ leakHazardFor: THE FAME FACTOR IS THE RULING AND IT IS WHAT THE BRIEF DROPPED.
 *  ⚠ leakHazardFor: IT TAKES THE PRIMITIVES AND NOT THE WORLD
 *  ⚠ leakHazardFor: NO CLAMP AND NONE NEEDED
 *  → docs/notes/life-beats/leak.md#leakhazardfor--the-weekly-leak-hazard-as-one-probability
 */
export function leakHazardFor(openness: 'open' | 'private', fame: number): number {
  const S = ECONOMY.spotlight
  return S.leakBasePerWeek * S.leakOpennessMult[openness] * (fame / ECONOMY.fame.cap)
}

/** ⭐⭐ HOW OFTEN THE STORY LANDS WRONG, by EXPRESSED openness (`ECONOMY.spotlight.wrongShare`).
 *  Takes the axis rather than the world for `leakHazardFor`'s own reason one function up.
 *
 *  ⚠ THE **LATE** HALF OF «late and wrong» IS NOT HERE AND MUST NOT BE ADDED: it is emergent from
 *  the hazard above, where a private girl draws a quarter of an open one's rate and her story
 *  therefore breaks later in the episode. T9's census MEASURES the median lag; nothing SETS it. */
export function leakWrongShareFor(openness: 'open' | 'private'): number {
  return ECONOMY.spotlight.wrongShare[openness]
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE writer of `publicWeek` and `publicWrong` in the engine.
 *
 *  ⚠⚠ rollLeak: THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED
 *  ⚠ rollLeak: `<` AND NOT `<=`, `rollArrival`'s and `rollEnds`' own note: `rngFromSeed` can return exactly 0…
 *  ⚠⚠ rollLeak: EXPRESSION, NOT BIRTH, AND ONE READ FEEDS BOTH DRAWS
 *  ⚠⚠ rollLeak: AND THE OVERTAKE RAISES NOTHING ITSELF.
 *  → docs/notes/life-beats/leak.md#rollleak--the-weekly-roll-and-the-one-writer-of-publicweek
 */
export function rollLeak(world: WorldState): void {
  if (!leakEligible(world)) return
  const episode = activeEpisode(world)!
  const openness = temperamentOpenness(expressedTemperamentOf(world))
  // ⚠ THE HORIZON IS READ ONCE AND SPENT ONCE, on the same week the gate asked about – a second read
  // at `world.week` would be the split clock ruling P refused, hiding inside one function.
  let hazard = leakHazardFor(openness, fameAt(world, world.week - 1))
  // ⭐ D1 (14.09): at 'noticed' the world glances rather than watches – the hazard runs at
  // `noticedLeakScale`; at 'known' the scale is 1 by construction. The BAND is read once here,
  // beside the one fame read, so the roll composes exactly what the gate admitted.
  if (newsStandingOf(world) === 'noticed') hazard *= ECONOMY.spotlight.noticedLeakScale
  // ⭐⭐ D5 (14.09, the founding scene's lever, his «давай попробуем»): new couples get caught –
  // the first `leakFreshWeeks` of an episode run `leakFreshMult` hotter. Same key, same single
  // uniform, no draw-count change: only the threshold the same value is compared against moves,
  // which is what keeps the frozen protocol's diff a stamped expectation and not a re-shuffle.
  if (world.week - episode.sinceWeek <= ECONOMY.spotlight.leakFreshWeeks) hazard *= ECONOMY.spotlight.leakFreshMult
  // ⭐ ONE UNIFORM, ONE WEEK, ITS OWN KEY – and the key carries no temperament and no fame, so two
  // girls read the SAME uniform against two different hazards. That is what makes both multipliers
  // pure scales rather than unrelated dice, and it is the property §D's monotonicity pin rests on.
  if (rngFromSeed(`${world.seed}:life:leak:${episode.id}:${world.week}`)() >= hazard) return
  // ⭐⭐⭐ THE STAMP NAMES **THIS** WEEK though the gate asked about the last closed one – see the §9
  // banner's third reason. The week the world learned is the week the story ran.
  episode.publicWeek = world.week
  // ⭐⭐⭐ THE FILMS' GEM (§3c-bis): openness controls not only the SPEED of a leak but its ACCURACY.
  // ⚠ DRAWN ONLY ON THE WEEK THE STORY BREAKS, on its own key – an episode that never gets out never
  // reaches this stream at all, which is the half of the zero-draw claim §B's second stream counts.
  episode.publicWrong =
    rngFromSeed(`${world.seed}:life:leak:story:${episode.id}:${world.week}`)() < leakWrongShareFor(openness)
  // ⭐⭐ AND THE WORLD'S VERSION GOES IN THE ALBUM. ⚠ KEPT – `pruneEvents` drops ordinary rows at
  // sixty weeks and a career reads its own life back seasons later; the week it stopped being
  // private is not a line the album may be missing (`MET_EVENT`'s own reason, two sections up).
  // ⚠ NO `amountCents` – a headline is never a purchase (rule 4), and the absence of the field
  // is what keeps `accrueFinance` from ever seeing this row.
  //
  // ⚠⚠ rollLeak: AND NO `lifeKind`, WHICH IS T3's FINDING INHERITED RATHER THAN A GAP.
  // → docs/notes/life-beats/leak.md#rollleak--and-the-worlds-version-goes-in-the-album
  addEvent(world, {
    week: world.week,
    type: 'life',
    keep: true,
    lifeKind: 'exposure',
    text: LEAK_EVENT[episode.publicWrong ? 'wrong' : 'true'],
    // ⭐ L3-5 (10.10): the ref beside the text – one of the two cells above, each a key of the frozen v92 table
    c: { k: LEAK_EVENT[episode.publicWrong ? 'wrong' : 'true'] },
  })
  // ⭐⭐⭐ THE OVERTAKE – THE FOUNDING SCENE, AND IT IS ONE ASSIGNMENT. «A parent learning about a
  // boyfriend from a photograph» (the design plan §0) finally given its mechanism, and it is
  // strongest for exactly the girl whose walls kept him out: a private girl's lag is the
  // longest, so she is the one the world can get to first.
  //
  // ⚠⚠ rollLeak: THE CONDITION IS «HAS HE BEEN TOLD YET» AND NOT `knownWeek === null` – see the §9 banner's last ⚠⚠ for the measurement.
  // ⚠ rollLeak: IT NEVER PUSHES `knownWeek` LATER.
  // → docs/notes/life-beats/leak.md#rollleak--the-overtake--the-founding-scene
  if (episode.knownWeek === null || episode.knownWeek > world.week) episode.knownWeek = world.week
}
