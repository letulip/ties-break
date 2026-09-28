// A-06 / T6.10 – `world/lifeBeat.ts` §11 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠ THE HAZARD DIRECTION, as `world/lifeBeat/bereavement.ts`'s header sets it out: this module imports
// the hub – `hasBeatFor`, `kidAgeNow`, `lifeLogOf`, `raiseLifeBeat` – so the hub re-exports NOTHING of
// it. `src/engine/world.ts` takes the five names off `./world/lifeBeat/wedding` and re-exports them on
// its existing export statement, so the barrel's frozen name set (T6.6) does not move a specifier;
// `world/phaseHerWeek.ts` asks this module for `landWedding` and `rollWedding` directly. The edge runs
// world.ts → wedding → lifeBeat, and the hub reaches `world.ts` only as `import type`, erased.
//
// ⚠ THE COPY IS A SEPARATE MODULE AND THAT IS THE RULE RATHER THAN AN ACCIDENT.
// `world/lifeBeat/weddingCopy.ts` holds `'engaged'`'s words and the HUB imports it (the prompt is
// assembled hub-side); this file holds the hazard and imports the hub. Never one file with both halves
// – the hub would import it and it would import the hub, which is the cycle
// `tests/import-cycles.test.ts` refuses. CLAUDE.md's life-beat rule says exactly this.
//
// ⚠ `seed:life:wedding:<week>` AND `seed:life:partner-name:<episodeId>` LIVE HERE NOW, and they
// are in T3.9's inventory (`tests/life-beat-keys.test.ts`, set equality) through `engineModuleSource`,
// which reads this package. The file therefore sits FLAT in `world/lifeBeat/`.
//
// `WorldState` comes from `../state`, the module that declares it (CLAUDE.md's P4 rule).
import { pickInt, rngFromSeed } from '../../rng'
import { ECONOMY } from '../../economy'
import { activeEpisode, loveEpisodesOf } from '../loveEpisodes'
import { captureMilestone, fireMilestone } from '../milestones'
import { hasBeatFor, kidAgeNow, lifeLogOf, raiseLifeBeat } from '../lifeBeat'
import type { WorldState } from '../state'

// =================================================================================================
// 11. THE WEDDING – ⚠⚠ THE WEEK SHE DECIDES TO MARRY (the wedding, wave 7: T2)
// =================================================================================================
//
// `docs/plans/life-wave-7-builder-2026-09.md` §2 T2, constants in `ECONOMY.wedding`. §5 decides
// whether someone appears and §8 whether they are still there; this decides whether the episode
// becomes a MARRIAGE, and it is the step the whole branch has been building toward since the slot
// learned to latch. ⚠ It is §11 for §8's own stated reason: appended rather than renumbered.
//
// ⚠⚠ THE WAVE'S FIRST STREAM, RESERVED BY THE BRIEF'S §0 AND CREATED HERE:
//
//     seed:life:wedding:<week>              does she decide, this week
//
// (seed, calendar)-keyed like every sibling, so a player cannot conjure or dodge a wedding by
// playing the week differently – input-independence is permanent law, and nothing here takes an
// `Rng`, so MAIN is structurally out of reach and the frozen capture (41550 / e6b0c709) cannot see
// this section. `seed:life:partner-name:<episodeId>` is T3's and `seed:life:spouse-view:<week>` is
// T5's – neither exists on this tree and neither may be created early (§5's own reservation rule,
// third use).
//
// ⚠⚠ ZERO DRAWS ON AN INELIGIBLE WEEK – the gate returns BEFORE the stream is derived, never
// draw-and-discard, §5's load-bearing rule inherited whole. And the test for it is a KEY COUNT, not
// an alignment comparison (wave 3's finding, the wave-4 brief's §0.1 law): every key carries its own
// week, so tests/wave7-wedding.test.ts counts the keys the gate reaches, with a positive control.
//
// ⚠ SHE DECIDES; THE HAZARD IS THE DECIDING. No parent action opens or closes this – the gate reads
// her age (RULED 23+, 11.09, art-driven), the slot (an active episode) and the episode's own DEPTH
// (its age in weeks – derived, no new state). The parent's part arrives one screen later, as three
// answers priced on `bond`, and none of them stops the wedding (T3).

/** ⭐⭐ THE GATE – ALL FOUR, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one. A predicate
 *  of its own for `arrivalEligible`'s stated reason: a reader must see, in one place, that the whole
 *  of eligibility is decided before any stream exists. Pure, zero draws, no writes.
 *
 *  1. ⭐ TWENTY-THREE – RULED 11.09 («свадьба на 23+ – мне вполне ок»), art-driven: the bride lives
 *     in the `adult` portrait set. Fractional (`kidAgeExact`), `life.ageGate`'s own reading, so she
 *     turns eligible the week she turns 23 and not in the January of that year.
 *  2. AN ACTIVE EPISODE – `activeEpisode`'s answer, never a second spelling of it. Nobody marries
 *     out of an empty slot, and an episode that ended this very tick (`rollEnds` runs FIRST at the
 *     call site) refuses here by construction.
 *  3. THE DEPTH – the episode is at least `ECONOMY.wedding.minEpisodeWeeks` old, DERIVED from
 *     `sinceWeek` (no new state; the brief's own «depth is derived» clause). ⚠ From `sinceWeek` and
 *     never `knownWeek` – how long THEY have been together, not how long the parent has known; §8's
 *     own clause-1 argument, pointed the other way. ⚠ And the threshold is what makes an `'engaged'`
 *     beat on an UNDELIVERED episode unreachable on engine-born rows: the raw lag tops out at 12
 *     weeks, far under 52, so by the time a row is deep enough to marry, `deliverKnownPartner` has
 *     long since raised its `'met'` – she is not announcing a fiancé nobody has heard of.
 *  4. THE RECEIPT – no `'engaged'` row exists for this episode yet (`hasBeatFor`, `'met'`'s own
 *     once-per-episode doctrine: the record is the queue AND the receipt). This is also what makes a
 *     SECOND wedding the same machinery on a LATER row: a latched episode necessarily carries the
 *     receipt, so it can never be asked again, while a new episode's own row starts clean. */
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
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED – an ineligible week takes ZERO
 *  draws, never draw-and-discard. The line order below IS the rule (§5's own note, third time).
 *
 *  ⚠ `<` AND NOT `<=`, `rollArrival`'s own note: `rngFromSeed` can return exactly 0, and a hazard
 *  of 0 must be impossible rather than merely unlikely.
 *
 *  ⚠ NO TEMPERAMENT TERM, AND THAT IS THE DRAFTED SHAPE RATHER THAN AN OVERSIGHT: `ECONOMY.wedding`
 *  drafts one flat `perWeek` and no multiplier table – who she is already shaped WHICH episodes
 *  exist and how long they last (the arrival and ends tables), so the decision-to-marry hazard
 *  starts uniform and T8's census measures whether the two trajectories both reach it. A per-voice
 *  column here would be a design decision wearing a constant (the `endsPerWeek` note's own law).
 *
 *  ⚠ IT RAISES THE BEAT AND WRITES NOTHING ELSE – no latch, no name, no feed row, no cents. The
 *  latch and the cost are T3's, `weeksAfterEngagement` weeks after the answer; the name is written
 *  at THIS beat but by T3's `partnerNameFor`, and until that task lands the row's `partnerName`
 *  stays null and every reader keeps its unnamed phrasing. The raise stops the week by
 *  `LIFE_BEAT_BLOCKING` alone – no new guard anywhere. */
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

/** ⚠ ⚠ DRAFT – THE POOL, ≥ 24 FICTIONAL FIRST NAMES AND NOT ONE SURNAME ANYWHERE IN THE WAVE, so no
 *  real person's name is CONSTRUCTIBLE (house trademark law satisfied by construction – the same
 *  guarantee `season/names.ts` engineers with curated pools, achieved here by never holding the
 *  second half at all). Every name is a draft for the owner's pass (invariant 4; T7's table).
 *
 *  ⚠ SINGLE TOKENS ONLY – no spaces, no initials – which is what keeps «no surname» a property a
 *  test can assert rather than a habit. ⚠ APPEND-ONLY once shipped, `SURNAMES`' own law and for the
 *  weaker of its two reasons only: the draw indexes by pool LENGTH, so a reorder or removal re-maps
 *  future draws – and though every DRAWN name is persisted (nobody is renamed), a grown pool changes
 *  which husband a NEW career on an old seed meets, which is the price of any pool change and the
 *  reason to append rather than edit. */
export const PARTNER_NAME_POOL: readonly string[] = [
  'Anton', 'Bruno', 'Casper', 'Daniel', 'Elias', 'Felix', 'Gabriel', 'Henrik',
  'Ivo', 'Jonas', 'Karel', 'Lukas', 'Matteo', 'Niko', 'Oskar', 'Pavel',
  'Rafael', 'Samuel', 'Tomas', 'Viktor', 'Willem', 'Xavier', 'Yann', 'Zeno',
  'Andrei', 'Marco', 'Ruben', 'Stefan',
]

/** ⭐⭐⭐ v83 T6's ONE DERIVATION FUNCTION, landed with T3 because the engagement is its one call
 *  site: WHO SHE IS MARRYING, drawn uniformly on `seed:life:partner-name:<episodeId>` – the wave's
 *  second and last new stream, (seed, episode)-keyed so no week's play and no other draw can shift
 *  it, and MAIN is never reached.
 *
 *  ⚠⚠ CALLED EXACTLY ONCE PER EPISODE, AT THE ENGAGEMENT, AND THE RESULT IS PERSISTED
 *  (`LoveEpisode.partnerName`) – `temperamentFor`'s own arrangement: the function is pure and
 *  re-derivable for the LIFE OF THE POOL, and it is precisely the pool's freedom to grow that makes
 *  the persisted copy the fact and this function only the pen it was written with. A reader that
 *  called this instead of reading the row would rename a husband the day a name is appended.
 *
 *  ⚠ `pickInt` over the whole pool – uniform, one draw, `drawPartnerWants`' own shape. */
export function partnerNameFor(seed: string, episodeId: string): string {
  const r = rngFromSeed(`${seed}:life:partner-name:${episodeId}`)
  return PARTNER_NAME_POOL[pickInt(r, 0, PARTNER_NAME_POOL.length - 1)]
}

/** ⭐⭐⭐ v83 T3 – THE WEDDING LANDS, and the ONE writer of `latchedWeek`.
 *
 *  ⚠⚠ `weeksAfterEngagement` WEEKS AFTER THE BEAT WAS ANSWERED, ON **ANY** ANSWER – opposing does
 *  not stop it, SHE decided; what opposing bought is the bond price already paid and the diary's
 *  memory of it. The beat is BLOCKING, so the answer landed on the raise week (`row.week` – time
 *  could not move between them) and the arithmetic below reads the row's own week.
 *
 *  ⚠⚠ FOUR GATES, EACH ONE LOAD-BEARING AND NONE A DRAW (zero draws in this function, on any path):
 *    · an `'engaged'` row, ANSWERED – an unanswered row cannot start the clock (unreachable in play,
 *      the block contract holds time; real on a crafted world);
 *    · its episode still ACTIVE – §8's ordinary hazard keeps running between the answer and the
 *      day, and an episode that ends inside those weeks is a wedding that never happens: the row
 *      keeps its receipt (no second ask of a dead episode) and the latch is never written. The
 *      bench REPORTS this frequency (T8) rather than hiding it;
 *    · not yet LATCHED – the latch is the receipt and the once-ness, `lifeLog.answer`'s own shape:
 *      one nullable field says both «has it happened» and «when», so a later week walks past;
 *    · the day has COME – `>=` rather than `===`, so a crafted world that jumped the calendar still
 *      lands exactly once (the latch refuses the second pass) and play, which ticks by one, lands
 *      ON the day.
 *
 *  WHAT LANDING WRITES, in one place: the latch (`latchedWeek = world.week`), ONE kept feed row and
 *  ONE album entry through the milestone channel (`markSchoolEnd`'s own two-surface idiom:
 *  `fireMilestone` keeps the line past every prune, `captureMilestone` gives the scroll its row,
 *  both idempotent per `wedding:<episodeId>` – so the SECOND wedding of a later episode captures
 *  its own line). ⚠ NO MONEY – the drafted `costCents` charge and its ledger event stood here until
 *  the 18.09 ruling closed Q-1 in his own words: «я думаю как с подарками, никто и нисколько» – the
 *  wedding follows the gifts' law, nobody pays and nothing; what the drafted $12,000 weighed is
 *  recorded in docs/specs/the-wedding-2026-09.md §3c. ⚠ NO name in any
 *  line – whether a surface speaks the husband's name is T7's wording question, not a default. */
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

