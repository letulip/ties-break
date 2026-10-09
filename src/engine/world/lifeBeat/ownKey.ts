// A-06 / T6.10 – `world/lifeBeat.ts` §13 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ ownKey: IT COULD NOT MOVE WITH THE OTHER FIVE, AND THE REASON IS WORTH KEEPING
// ⚠ ownKey: THE HAZARD DIRECTION, as `world/lifeBeat/bereavement.ts`'s header sets it out: this module imports the hub – `lifeLogOf`…
// ⚠⚠ ownKey: AND `tests/import-cycles.test.ts` IS NOT THE WITNESS TO THAT DIRECTION TODAY.
// ⚠ ownKey: THE COPY IS A SEPARATE MODULE, `world/lifeBeat/ownKeyCopy.ts` (T6.8)
// → docs/notes/life-beats/ownKey.md#ownkeyts-header
import { addEvent } from '../ledger'
import { OWN_KEY_ROW } from './ownKeyCopy'
import { lifeLogOf, lifeStageOf, liveSoftBeat, pendingLifeBeat, raiseLifeBeat } from '../lifeBeat'
import type { WorldState } from '../state'

// 13. THE INDEPENDENT LIFE – ⚠ THE WEEK SHE LIVES BEHIND HER OWN DOOR (wave 7: T10, backlog
// §8) – One-time, NON-blocking, narrative-only (the brief's own three words): a kept feed row,
// a soft card for three weeks, one diary line – and NO mechanic, NO cost, NO bond move,
// because a residence mechanic is explicitly gated on the owner's word (backlog §8's own
// sentence).
//
// ⚠⚠ ownKey: ZERO DRAWS, ON EVERY PATH, AND THE DETERMINISM IS ARGUED RATHER THAN ASSUMED (the brief asks).
// → docs/notes/life-beats/ownKey.md#ownkeyts-13--the-independent-life

/** ⭐ THE GATE – and the AGE CONSTANT IS DELIBERATELY NOT NEW: «her own door» already has one
 *  spelling in this engine, the `independent` life stage (`diaryLifeStageFor`: 22+, school
 *  over, not at college – read through `lifeStageOf`, this file's one reading of it).
 *
 *  ⚠ ownKeyDue: THE RECEIPT IS THE LOG (`'met'`'s doctrine)
 *  ⚠ ownKeyDue: THE TWO SURFACE CLAUSES DEFER, NEVER CANCEL
 *  → docs/notes/life-beats/ownKey.md#ownkeydue--the-gate--and-the-age-constant-is-not-new
 */
export function ownKeyDue(world: WorldState): boolean {
  if (lifeStageOf(world) !== 'independent') return false
  if (lifeLogOf(world).some((row) => row.kind === 'own-key')) return false
  if (pendingLifeBeat(world) !== null) return false
  return liveSoftBeat(world) === null
}

/** ⭐⭐ THE DELIVERY, and the ONE writer of an `'own-key'` row – zero draws…
 *  ⚠ deliverOwnKey: THE ROW IS `keep: true` AND STAMPED `lifeKind: 'own-key'`
 *  ⚠ deliverOwnKey: NO `amountCents` (rule 4) – the week she moved out is not a purchase the game recorded.
 *  → docs/notes/life-beats/ownKey.md#deliverownkey--the-delivery-and-the-one-writer-of-an-own-key-row
 */
export function deliverOwnKey(world: WorldState): void {
  if (!ownKeyDue(world)) return
  addEvent(world, {
    week: world.week,
    type: 'life',
    keep: true,
    // ⚠ DRAFT (§3i)
    text: OWN_KEY_ROW,
    // ⭐ L3-5 (10.10): `c` beside the text – the constant is its own key
    c: { k: OWN_KEY_ROW },
    lifeKind: 'own-key',
  })
  // ⚠ THE DETAIL IS THE LITERAL KIND – machine-readable and empty of variation, because the row
  // records nothing per-instance: there is exactly one of these in a life.
  raiseLifeBeat(world, 'own-key', 'own-key')
}

/** ⭐ THE WEEK'S OWN FLAG, FOR THE DIARY ALONE – `spouseViewOccasionThisWeek`'s twin: true exactly
 *  on the raise week, so the one diary line lands once and the note cannot stutter. */
export function ownKeyThisWeek(world: WorldState): boolean {
  return lifeLogOf(world).some((row) => row.kind === 'own-key' && row.week === world.week)
}

