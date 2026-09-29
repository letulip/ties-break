// A-06 / T6.10 – `world/lifeBeat.ts` §11 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ wedding: THE HAZARD DIRECTION, as `world/lifeBeat/bereavement.ts`'s header sets it out: this module imports the hub – `hasBeatFor`…
// ⚠ wedding: THE COPY IS A SEPARATE MODULE AND THAT IS THE RULE RATHER THAN AN ACCIDENT.
// ⚠ `seed:life:wedding:<week>` AND `seed:life:partner-name:<episodeId>` LIVE HERE NOW
// → docs/notes/life-beats/wedding.md#weddingts-header
import { pickInt, rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { activeEpisode, loveEpisodesOf } from '../loveEpisodes'
import { captureMilestone, fireMilestone } from '../milestones'
import { hasBeatFor, kidAgeNow, lifeLogOf, raiseLifeBeat } from '../lifeBeat'
import type { WorldState } from '../state'

// 11. THE WEDDING – ⚠⚠ THE WEEK SHE DECIDES TO MARRY (the wedding, wave 7: T2) –
// `docs/plans/life-wave-7-builder-2026-09.md` §2 T2, constants in `ECONOMY.wedding`. §5
// decides whether someone appears and §8 whether they are still there; this decides whether
// the episode becomes a MARRIAGE, and it is the step the whole branch has been building toward
// since the slot learned to latch.
//
// ⚠ wedding: It is §11 for §8's own stated reason: appended rather than renumbered.
// ⚠⚠ wedding: THE WAVE'S FIRST STREAM, RESERVED BY THE BRIEF'S §0 AND CREATED HERE
// ⚠⚠ wedding: ZERO DRAWS ON AN INELIGIBLE WEEK
// ⚠ wedding: SHE DECIDES; THE HAZARD IS THE DECIDING.
// → docs/notes/life-beats/wedding.md#weddingts-11--the-wedding

/** ⭐⭐ THE GATE – ALL FOUR, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one. A
 *  predicate of its own for `arrivalEligible`'s stated reason: a reader must see, in one place,
 *  that the whole of eligibility is decided before any stream exists. Pure, zero draws, no
 *  writes.
 *
 *  owner (weddingEligible): «свадьба на 23+ – мне вполне ок»
 *  ⚠ weddingEligible: From `sinceWeek` and never `knownWeek` – how long THEY have been together, not how long the parent has known…
 *  ⚠ weddingEligible: And the threshold is what makes an `'engaged'` beat on an UNDELIVERED episode unreachable on engine-born rows…
 *  → docs/notes/life-beats/wedding.md#weddingeligible--the-gate--all-four-and-a-false-here-means-zero
 */
export function weddingEligible(world: WorldState): boolean {
  const wedding = ECONOMY.wedding
  if (kidAgeNow(world) < wedding.ageGate) return false
  const episode = activeEpisode(world)
  if (episode === null) return false
  if (world.week - episode.sinceWeek < wedding.minEpisodeWeeks) return false
  if (hasBeatFor(world, episode.id, ['engaged'])) return false
  return true
}

/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE raise site of an `'engaged'` row.
 *
 *  ⚠⚠ rollWedding: THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED
 *  ⚠ rollWedding: `<` AND NOT `<=`, `rollArrival`'s own note: `rngFromSeed` can return exactly 0…
 *  ⚠ rollWedding: NO TEMPERAMENT TERM, AND THAT IS THE DRAFTED SHAPE RATHER THAN AN OVERSIGHT
 *  ⚠ rollWedding: IT RAISES THE BEAT AND WRITES NOTHING ELSE
 *  → docs/notes/life-beats/wedding.md#rollwedding--the-weekly-roll--the-one-raise-site-of-engaged
 */
export function rollWedding(world: WorldState): void {
  if (!weddingEligible(world)) return
  if (rngFromSeed(`${world.seed}:life:wedding:${world.week}`)() >= ECONOMY.wedding.perWeek) return
  // ⚠ THE ROW IS TAKEN AFTER THE DRAW AND IS THE GATE'S OWN – `weddingEligible` just proved it
  // non-null, and `rollEnds` runs before this at the call site, so the episode the beat is about is
  // the episode still standing this week.
  const episode = activeEpisode(world)!
  // ⭐⭐⭐ v83 T3 – HE GETS A NAME, AT THE ENGAGEMENT AND NOWHERE ELSE (the design's own moment: «a
  // latched partner finally needs one»). ONE call per episode ever – the raise below writes the
  // receipt that makes this line unreachable a second time – and the RESULT IS PERSISTED, never
  // re-derived at read (T1's law on the field): a later pool edit must never rename a husband an
  // old career already has. ⚠ The `??=` is belt on braces for hand-carried worlds: an episode that
  // somehow already holds a name keeps it, exactly as the migration's `??=` would keep it.
  episode.partnerName ??= partnerNameFor(world.seed, episode.id)
  raiseLifeBeat(world, 'engaged', episode.id)
}

/** ⚠ ⚠ DRAFT – THE POOL, ≥ 24 FICTIONAL FIRST NAMES AND NOT ONE SURNAME ANYWHERE IN THE WAVE,
 *  so no real person's name is CONSTRUCTIBLE…
 *
 *  ⚠ PARTNER_NAME_POOL: SINGLE TOKENS ONLY – no spaces, no initials – which is what keeps «no surname» a property a test can assert rather…
 *  ⚠ PARTNER_NAME_POOL: APPEND-ONLY once shipped, `SURNAMES`' own law and for the weaker of its two reasons only…
 *  → docs/notes/life-beats/wedding.md#partner_name_pool--draft--the-pool--24-fictional-first-names
 */
export const PARTNER_NAME_POOL: readonly string[] = [
  'Anton', 'Bruno', 'Casper', 'Daniel', 'Elias', 'Felix', 'Gabriel', 'Henrik',
  'Ivo', 'Jonas', 'Karel', 'Lukas', 'Matteo', 'Niko', 'Oskar', 'Pavel',
  'Rafael', 'Samuel', 'Tomas', 'Viktor', 'Willem', 'Xavier', 'Yann', 'Zeno',
  'Andrei', 'Marco', 'Ruben', 'Stefan',
]

/** ⭐⭐⭐ v83 T6's ONE DERIVATION FUNCTION, landed with T3 because the engagement is its one call
 *  site: WHO SHE IS MARRYING, drawn uniformly on `seed:life:partner-name:<episodeId>` – the…
 *
 *  ⚠⚠ partnerNameFor: CALLED EXACTLY ONCE PER EPISODE, AT THE ENGAGEMENT, AND THE RESULT IS PERSISTED (`LoveEpisode.partnerName`)
 *  ⚠ partnerNameFor: `pickInt` over the whole pool – uniform, one draw, `drawPartnerWants`' own shape.
 *  → docs/notes/life-beats/wedding.md#partnernamefor--v83-t6s-one-derivation-function-landed-with-t3
 */
export function partnerNameFor(seed: string, episodeId: string): string {
  const r = rngFromSeed(`${seed}:life:partner-name:${episodeId}`)
  return PARTNER_NAME_POOL[pickInt(r, 0, PARTNER_NAME_POOL.length - 1)]
}

/** ⭐⭐⭐ v83 T3 – THE WEDDING LANDS, and the ONE writer of `latchedWeek`.
 *
 *  ⚠⚠ landWedding: `weeksAfterEngagement` WEEKS AFTER THE BEAT WAS ANSWERED, ON **ANY** ANSWER
 *  ⚠⚠ landWedding: FOUR GATES, EACH ONE LOAD-BEARING AND NONE A DRAW
 *  ⚠ landWedding: NO MONEY – the drafted `costCents` charge and its ledger event stood here until the 18.09 ruling closed Q-1 in his own…
 *  ⚠ landWedding: NO name in any line – whether a surface speaks the husband's name is T7's wording question, not a default.
 *  → docs/notes/life-beats/wedding.md#landwedding--v83-t3--the-wedding-lands
 */
export function landWedding(world: WorldState): void {
  for (const row of lifeLogOf(world)) {
    if (row.kind !== 'engaged' || row.answer === null) continue
    if (world.week - row.week < ECONOMY.wedding.weeksAfterEngagement) continue
    const episode = loveEpisodesOf(world).find((e) => e.id === row.detail)
    if (episode === undefined || episode.endedWeek !== null) continue
    if (episode.latchedWeek !== null) continue
    episode.latchedWeek = world.week
    // ⚠ DRAFT – the kept line is the builder's draft (invariant 4).
    fireMilestone(world, `wedding:${episode.id}`, 'Her wedding day. The family was there, whatever had been said about it.')
    captureMilestone(world, { type: 'wedding', week: world.week, kind: episode.id })
    // ⚠ The ledger charge (the `fundsCents` write and its expense row) stood here and was RULED OUT
    // 18.09 («я думаю как с подарками, никто и нисколько») – the wedding follows the gifts' law:
    // no money mechanics. The spec's §3c keeps the record of what the drafted charge weighed.
  }
}

