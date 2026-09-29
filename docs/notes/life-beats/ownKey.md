---
type: reference
status: current
area: engine
last-reviewed: 2026-09-29
---

# Life beat – ownKey

The comment chronicles that stood in `ownKey.ts` and `ownKeyCopy.ts` under `src/engine/world/lifeBeat/`, moved here verbatim (T7.4 of the principles fix). The source keeps each site's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to the site's heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## Hazard module – `ownKey.ts`

### `ownKey.ts` header

```ts
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
```

### `ownKey.ts` §13 – the independent life

```ts
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
```

### `ownKeyDue` – The gate – and the age constant is not new

```ts
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
```

### `deliverOwnKey` – The delivery, and the one writer of an 'own-key' row

```ts
/** ⭐⭐ THE DELIVERY, and the ONE writer of an `'own-key'` row – zero draws, `deliverKnownPartner`'s
 *  own two-surface order: the kept feed row is what HAPPENED, the soft row is the family's moment
 *  with it, so the news is on the record before the card can be answered.
 *
 *  ⚠ THE ROW IS `keep: true` AND STAMPED `lifeKind: 'own-key'` – the private-life thread's glyph
 *  column reads the stamp (`lifeRowGlyphs.ts`), and an unpicked kind wears the owner's standing
 *  white heart by that file's own fallback; the glyph itself stays his to pick (§5a).
 *  ⚠ NO `amountCents` (rule 4) – the week she moved out is not a purchase the game recorded. */
```

## Copy leaf – `ownKeyCopy.ts`

### `ownKeyCopy.ts` header

```ts
// A-06 / T6.8 – `world/lifeBeat.ts` §3i MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is the OWN KEY's copy half – the
// week she lives behind her own door – and a pure leaf by the review's matrix: §3i referenced nothing
// at all. Two readers, both in the hub: the dispatcher (`lifeBeatSaid`, `lifeBeatHeading`) and §13's
// `deliverOwnKey`, which writes `OWN_KEY_ROW` into the feed. Hub -> here, never back, so this module
// imports nothing whatsoever.
//
// ⚠ §13, the independent life's HAZARD half, is still in the hub: it calls back into it
// (`lifeStageOf`, `lifeLogOf`, `pendingLifeBeat`, `liveSoftBeat`, `raiseLifeBeat`) and its three names
// reach `world.ts`, `world/phaseHerWeek.ts` and `world/snapshot.ts` through the hub's re-export, so
// the hub would both import it and be imported by it. «If both are true, it is not ready to move.»
// =================================================================================================
// 3i. `'own-key'` – THE WEEK SHE LIVES BEHIND HER OWN DOOR (wave 7: T10, backlog §8).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T7's table).
// =================================================================================================
//
// ONE SCENE, TOLD ONCE, IN THE PARENT'S OWN NARRATION – deliberately NO quoted line of hers, and
// that absence is what keeps this a one-cell pool without breaking the voice law: the completeness
// rule («a `quiet` girl can never silently receive a `fiery` girl's line») binds pools that QUOTE
// her, and this card quotes nobody. Giving the scene a voiced line of hers – four cells, two
// presences – is a wording decision the owner may take at T7's table; a draft that jumped ahead of
// it would be choosing for him.
//
// ⚠⚠ AND IF HE EVER TAKES IT, THE SHAPE IS **FOUR CELLS AND NO PRESENCE AXIS** – 26.09, ruling 19 on
// B-08, said here rather than left for the test to say. `'own-key'` fires on the week she lives behind
// her own door, which is past the age at which any stage is still `roof`: school is over by 18.92 for
// every girl the game can generate and `diaryLifeStageFor` sends everyone past 22 to `independent`,
// `college` being away as well. A `roof` column written here would be four lines the owner had read
// and no player could ever be shown – the exact defect ruling 19 removed from §3g, §3j and §3l. ⚠ IT
// IS ALSO ENFORCED: `tests/principles-b08-presence-reach.test.ts` §C measures which kinds read the
// stage and refuses a presence-keyed pool whose roof is unreachable, NAMING the kind – so a voiced
// `'own-key'` pool with two columns goes red there, and this paragraph is how the author connects
// that red to the banner that invited it.
```
