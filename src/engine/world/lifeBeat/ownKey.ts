// A-06 / T6.10 – `world/lifeBeat.ts` §13 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ IT COULD NOT MOVE WITH THE OTHER FIVE, AND THE REASON IS WORTH KEEPING because it is the shape of
// the whole task. `world/snapshot.ts` imports `ownKeyThisWeek` from the hub at RUNTIME, with a specifier
// that names neither the package nor the path – `from './lifeBeat'` – so the importer census that said
// «`world.ts` is the hub's only importer» could not see it. THE GENERAL FORM, on the record 28.09: a
// module inside a package is imported by its SIBLINGS with a relative specifier, so an importer census
// needs both spellings or a resolver. `git grep -ln "world/lifeBeat'"` finds one file;
// `git grep -n "from '\./lifeBeat'"` finds four.
//
// ⚠ THE HAZARD DIRECTION, as `world/lifeBeat/bereavement.ts`'s header sets it out: this module imports
// the hub – `lifeLogOf`, `lifeStageOf`, `liveSoftBeat`, `pendingLifeBeat`, `raiseLifeBeat` – so the hub
// re-exports NOTHING of it. `src/engine/world.ts` takes the three names off `./world/lifeBeat/ownKey` and
// re-exports them on its existing export statement, so the barrel's frozen name set (T6.6) does not move
// a specifier. `world/phaseHerWeek.ts` asks this module for `deliverOwnKey` and `world/snapshot.ts` for
// `ownKeyThisWeek`. The edge runs those three → ownKey → lifeBeat, and the hub reaches `world.ts` only as
// `import type`, erased.
//
// ⚠⚠ AND `tests/import-cycles.test.ts` IS NOT THE WITNESS TO THAT DIRECTION TODAY. Its comment strip runs
// block comments before line comments, and a line comment naming a path glob in backticks puts a slash
// immediately before a star, which the block matcher reads as an opener – so it deletes real code as far
// as the next JSDoc close. Measured on 28.09: 121 runtime edges lost across 24 files, including EVERY
// edge of `leak.ts`, `booth.ts` and `bereavement.ts`. It stayed GREEN on a hand-armed 2-cycle in three
// positions. The guard that holds this arrow is
// `tests/principles-a06-life-beat-direction.test.ts`, which has the strip order fixed.
//
// ⚠ THE COPY IS A SEPARATE MODULE, `world/lifeBeat/ownKeyCopy.ts` (T6.8) – the hub reads it because the
// prompt is assembled hub-side, and this file reads `OWN_KEY_ROW` off it as a sibling. A copy leaf may be
// read by the hub and by a hazard alike; what it may never do is import one back.
//
// `WorldState` comes from `../state`, the module that declares it (CLAUDE.md's P4 rule).
import { addEvent } from '../ledger'
import { OWN_KEY_ROW } from './ownKeyCopy'
import { lifeLogOf, lifeStageOf, liveSoftBeat, pendingLifeBeat, raiseLifeBeat } from '../lifeBeat'
import type { WorldState } from '../state'

// =================================================================================================
// 13. THE INDEPENDENT LIFE – ⚠ THE WEEK SHE LIVES BEHIND HER OWN DOOR (wave 7: T10, backlog §8)
// =================================================================================================
//
// One-time, NON-blocking, narrative-only (the brief's own three words): a kept feed row, a soft
// card for three weeks, one diary line – and NO mechanic, NO cost, NO bond move, because a
// residence mechanic is explicitly gated on the owner's word (backlog §8's own sentence).
//
// ⚠⚠ ZERO DRAWS, ON EVERY PATH, AND THE DETERMINISM IS ARGUED RATHER THAN ASSUMED (the brief asks).
// The house draws when the world has something to DECIDE – which week among many (a hazard), which
// member of a pool (a name, a frame). This moment has neither: the week is the stage's own first
// week, and the scene is one scene. A purpose-scoped coin here would be randomness with no question
// under it. So nothing in this section takes or derives an `Rng`, MAIN is structurally out of
// reach, and the frozen capture (41550 / e6b0c709) cannot see it – nor can the frozen per-key
// identity move: a 156-week career stands at 16.6 and never reads `independent`.

/** ⭐ THE GATE – and the AGE CONSTANT IS DELIBERATELY NOT NEW: «her own door» already has one
 *  spelling in this engine, the `independent` life stage (`diaryLifeStageFor`: 22+, school over,
 *  not at college – read through `lifeStageOf`, this file's one reading of it). Backlog §8's «near
 *  the first week at 22+» is that cut, and reading it keeps the two surfaces honest at once: a
 *  college girl at 22 lives in a dorm, her diary says so, and a spare-key card over that diary
 *  would be the two surfaces contradicting each other on one screen. Her beat waits for the week
 *  the stage itself turns – which for a college career is the week the campus is behind her.
 *
 *  ⚠ THE RECEIPT IS THE LOG (`'met'`'s doctrine): one `'own-key'` row per career, ever. ⚠ THE TWO
 *  SURFACE CLAUSES DEFER, NEVER CANCEL – `deliverKnownPartner`'s `<=` courtesy: a week the soft
 *  surface is busy leaves the receipt unwritten, and the next tick asks again. «Near the first
 *  week», the brief's own word. */
export function ownKeyDue(world: WorldState): boolean {
  if (lifeStageOf(world) !== 'independent') return false
  if (lifeLogOf(world).some((row) => row.kind === 'own-key')) return false
  if (pendingLifeBeat(world) !== null) return false
  return liveSoftBeat(world) === null
}

/** ⭐⭐ THE DELIVERY, and the ONE writer of an `'own-key'` row – zero draws, `deliverKnownPartner`'s
 *  own two-surface order: the kept feed row is what HAPPENED, the soft row is the family's moment
 *  with it, so the news is on the record before the card can be answered.
 *
 *  ⚠ THE ROW IS `keep: true` AND STAMPED `lifeKind: 'own-key'` – the private-life thread's glyph
 *  column reads the stamp (`lifeRowGlyphs.ts`), and an unpicked kind wears the owner's standing
 *  white heart by that file's own fallback; the glyph itself stays his to pick (§5a).
 *  ⚠ NO `amountCents` (rule 4) – the week she moved out is not a purchase the game recorded. */
export function deliverOwnKey(world: WorldState): void {
  if (!ownKeyDue(world)) return
  addEvent(world, {
    week: world.week,
    type: 'life',
    keep: true,
    // ⚠ DRAFT (§3i)
    text: OWN_KEY_ROW,
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

