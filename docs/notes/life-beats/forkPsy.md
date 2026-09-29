---
type: reference
status: current
area: engine
last-reviewed: 2026-09-29
---

# Life beat – forkPsy

The comment chronicles that stood in `forkPsyCopy.ts` under `src/engine/world/lifeBeat/`, moved here verbatim (T7.4 of the principles fix). The source keeps each site's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to the site's heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## Copy leaf – `forkPsyCopy.ts`

### `forkPsyCopy.ts` header

```ts
// A-06 / T6.8 – `world/lifeBeat.ts` §3f (the FIRST of the two sections the old file numbered «3f»)
// MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is `'fork-psy'` – the
// psychologist's read on the same `stop` the coach counsels on – and a pure leaf: §3f referenced
// nothing else in the old file except the exported `ForkStopDriver` type, and only the dispatcher hub
// read it. Hub -> here, never back.
//
// ⚠⚠ AND THE SECTION WAS FOUND BY ITS BANNER TEXT RATHER THAN BY ITS NUMBER, because the old file's
// numbering is broken: TWO sections were numbered «3f» (this one, the psychologist's counsel, and
// «learning to listen», which stays in the hub) and «3k» sat after «3m». The review flagged it;
// renumbering is NOT this task and would collide with a hundred comment references, so every move in
// T6.8 was located by reading the banner.
//
// ⚠ `ForkStopDriver` and `WorldState` both come back as `import type` – erased at compile time, so
// `tests/import-cycles.test.ts` does not count either, which is the licence every `world/*` module
// uses (CLAUDE.md's P4 rules).
```

### `forkPsyCopy.ts` §3f – 'fork-psy' – the psychologist's read on the same stop

```ts
// =================================================================================================
// 3f. `'fork-psy'` – THE PSYCHOLOGIST'S READ ON THE SAME `stop` (wave 5, T8). EVERY WORD IS A DRAFT.
// =================================================================================================
//
// ⭐⭐⭐ THE SECOND TABLE §3d PROMISED, AND NOT A REWRITE OF THE FIRST. The banner above ends «This
// pool is deliberately shaped so that adding him is a second table and not a rewrite of this one» –
// this is that table. Not one byte of `COACH_COUNSEL` or `COUNSEL_HEADING` moved for it.
//
// ⚠⚠ THE SEAT AND NOT A FOCUS. The gate is `psychologistWorksThisWeek` – the architect's ruling J,
// superseding the wave brief's own «gated `world.psychologistHired`»: a seat stood down by a college
// freeze or a booked family week is NOT BILLED, so it gives no counsel either. Any focus, or none: a
// retainer buys the man, and the man has a view about the biggest week of the career whatever year he
// is working on.
//
// ⚠⚠ HE READS `spiritShock` FOR THE **WORDING REGISTER ONLY**, and that fence is the whole reason he
// is allowed to read it at all (the architect, 13.09). «A girl under her line, and a girl under her
// line because somebody left» is exactly what he exists to tell apart – `engine/spirit.ts`' own
// promise – so the shock picks WHICH COLUMN of the table below is read and nothing else. Never a
// weight, never the option set, never a price: both of his answers are priced ZERO in both columns,
// so the priced set `answerLifeBeat` re-validates against is byte-identical with a shock live and
// with none. It is `forkStopDriverOf`'s own fence (§3, applied one level in) for a second reading.
//
// ⚠⚠ AND HE NEVER NAMES WHAT LANDED. The two-tier honesty law binds him harder than it binds the
// coach, for a reason neither of them chose: a told-LATE ending means `spiritShock` is live on a
// career where the parent has not yet been told there was anybody at all. A line naming a break-up
// would put a fact on screen that the player does not hold and that she has not said. So the shock
// column says «something outside the court, and it has not lifted» and stops – which is also what the
// 09.09 ruling requires of him («listen coaches the parent and never reports her sessions»).
//
// ⚠ NOT INDEXED BY HER VOICE AND NOT BY THE BOND BAND, for `COACH_COUNSEL`'s reasons exactly: he is
// supporting cast (who-she-is §5c) and he is not in the relationship the band measures.
```

### `PSY_REGISTER_TOTAL` – v85 T1 – postpartum joined the union and this record

```ts
// ⭐⭐⭐ v85 T1 – `postpartum` JOINED THE UNION AND THIS RECORD WENT RED, WHICH IS THE DESIGN ABOVE
// WORKING EXACTLY AS IT SAYS IT WILL («the day one lands this record is a compile error until somebody
// writes the column»). It is listed here – the register EXISTS – and its COLUMN is `null` in
// `PSY_COUNSEL` below, because the column is six sentences of player-facing copy and **wording is not
// an agent's to write** (invariant 4): T8 drafts it and the owner passes it. Listing the register
// while owing the column is the only split that keeps both halves honest – the roster stays total, so
// step 8's kind still reds here, and no line of copy is invented by a schema task.
// ⭐⭐⭐ v87 – AND STEP 8 LANDED WITH TWO, so this record went red twice more and both registers are
// listed with their COLUMNS owed for `postpartum`'s own reason, below.
```

### `PSY_COUNSEL` – What the psychologist says – 6 drafts, his register

```ts
/** ⭐⭐ WHAT THE PSYCHOLOGIST SAYS – 6 drafts, his register x the coach's driver.
 *
 *  ⚠ THE SHARED OPENING PER COLUMN IS THE POINT OF THE FAMILY, exactly as «The tennis is not the
 *  question» is of the coach's: the first thing the man paid to read her says is whether anything is
 *  sitting on top of this week. Everything after it is the driver, read his way.
 *
 *  ⚠ THE NARRATION SAYS «after the coach» BECAUSE IT ALWAYS IS. Both rows are raised on one condition
 *  (`counselDriver !== null`) and his is raised second, so the coach's card has always just been
 *  answered when this one opens. It is a fact about the queue, not a hope about it.
 *
 *  ⚠ THE HONESTY LAW: he may name what he can see and what he cannot reach; never a duration, a date,
 *  a count, a result, another person, or one word of what she said in a session.
 *
 *  ⚠⚠ TWO CELLS CARRY THE ARCHITECT'S ВЫЧИТКА (13.09) AND HIS WORDING, VERBATIM. Both were replaced
 *  at the delivery gate, both in the `breakup` column, and the reasons are kept here because the next
 *  editor is the person who could put either back:
 *    · `strained` CLAIMED A DISTANCE THE DRIVER DOES NOT CARRY. It read «She has been carrying it a
 *      long way from home, and distance makes a weight feel permanent when it is not» – and
 *      `strained` is `stopRootsOf`'s BOND reading, the distance BELOW `ECONOMY.bond.start`, i.e. a
 *      strained HOME. The beat is reachable on a girl who still lives under the roof and has never
 *      been far from it, so the line was true-sounding and false on part of the ladder – exactly the
 *      family of error the legible pools' own lints were built for. The replacement keeps the best
 *      clause («feel permanent when it is not») and says what the driver actually means: nowhere to
 *      set it down. ⚠ A GEOGRAPHIC READING MAY NOT COME BACK HERE unless a driver is added that
 *      carries one; this pool is keyed on `ForkStopDriver` and nothing in that union is a place.
 *    · `own`'s closing clause read «only that a want stated this month is partly the month», which
 *      was flagged by its own author as clumsy for a reading that is correct. The reading is
 *      unchanged – the month is doing some of the wanting – and only the phrasing moved.
 *  ⚠ The other four cells did not move, and the shared openings are the point of the family (above),
 *  not a thing to harmonise away. */
```

### `PSY_COUNSEL` – v85 T1 – the column is owed

```ts
  /** ⭐⭐⭐ v85 T1 – THE COLUMN IS OWED, AND `null` IS THE ONLY HONEST CELL A SCHEMA TASK CAN PUT HERE.
   *  Wave 8's T1 widened `spiritShock.kind` with `'postpartum'` (the build plan's step-7 row reserved
   *  it) and this table went red, which is the totality above doing its job. What the red asks for is
   *  THREE MORE SENTENCES IN HIS VOICE, under the honesty law two blocks up – and ⚠⚠ USER-FACING
   *  WORDING IS NOT AN AGENT'S TO WRITE (invariant 4, the owner's ruling of 30.08). T8 drafts this
   *  column and the owner passes it; §0 of the wave brief makes the same call for the new
   *  `CareerEndingType` member in as many words: «the ending cannot ship without its copy, and the
   *  copy is HIS».
   *
   *  ⚠ THE TEMPTING SHORTCUT IS REFUSED AND NAMED, so nobody re-discovers it as a good idea: aliasing
   *  this column to `plain`'s would compile, keep every test green, and make the psychologist tell a
   *  woman eight weeks after a birth that «nothing is sitting on top of this one» – a sentence that is
   *  false about the one week it would be shown in. A missing column is a bug that announces itself;
   *  a wrong column is a bug that reads well.
   *
   *  ⚠⚠ AND IT IS UNREACHABLE FOR A STRUCTURAL REASON, NOT MERELY «UNTIL T4» – the architect's
   *  gate-1 finding, written here because the weaker sentence would have gone stale the week T4
   *  landed and left a reader believing this cell was one task from being needed. Three facts, each
   *  one grep-checkable:
   *
   *    1. the register is stamped at EXACTLY ONE site – the single `raiseLifeBeat(…, 'fork-psy', …)`
   *       in `src/`, at the bottom of this file, which reads `world.spiritShock?.kind ?? 'plain'`;
   *    2. that site fires only off a `'fork-opinion'` row answered `stop`, and `'fork-opinion'` is
   *       raised in exactly one place (`raiseForkOpinion`, called once, from `resolveEndings` under
   *       `world.fork === null && forkDue(…)`) – the fork at nineteen, asked on `schoolEndWeek`;
   *    3. it BLOCKS (`LIFE_BEAT_BLOCKING`), and the advance refuses while a blocking row is
   *       unanswered, so the career cannot tick past it. She answers it at 18.0–18.9 or not at all.
   *
   *  ⭐ A `'postpartum'` shock needs a marriage (`ECONOMY.wedding.ageGate` 23), a pregnancy and a
   *  birth, so it cannot exist before ~24 – and THE TWO WINDOWS CANNOT OVERLAP. This column is owed
   *  only if a later wave raises `'fork-psy'` from somewhere other than the fork, and T8 is
   *  therefore NOT asked to draft three sentences for a card that cannot be shown. ⚠ The throw
   *  below is what makes that safe to rely on: the day a second raise site appears it names this
   *  cell by register instead of reading `undefined[driver]`. */
```

### `PSY_COUNSEL` – v87 – the same two columns owed, for the same reason

```ts
  /** ⭐⭐⭐ v87 – THE SAME TWO COLUMNS OWED, FOR THE SAME REASON AND WITH THE SAME STRUCTURAL
   *  UNREACHABILITY, and they are written as `null` rather than aliased to `plain`'s for the
   *  refusal named one cell up: a man telling a woman the week after a loss that «nothing is
   *  sitting on top of this one» is a bug that reads well.
   *
   *  ⚠⚠ UNREACHABLE BY THE SAME THREE FACTS, and this time the ages make it airtight rather than
   *  merely true today. The register is stamped at ONE site, off a `'fork-opinion'` row answered
   *  `stop`, which is the fork at NINETEEN and blocks the calendar until it is answered – and both
   *  of this wave's kinds are gated far above it: a pregnancy needs a marriage (23+, wave 7) and
   *  the bereavement needs the ADULT rung (`kidAgeExact ≥ 23`, §4). So no career can hold either
   *  mark on the one week this table is read, and the cells are owed by TYPE rather than by need.
   *
   *  ⚠ WHAT A FUTURE COLUMN WOULD OWE: three sentences per kind in his voice, under the honesty law
   *  two blocks up, drafted by a content task and passed by the owner – never by a schema task
   *  (invariant 4). And §4 adds one clause of its own for `bereavement`: **the deceased is UNNAMED
   *  in mechanics and copy** (RULED 22.09), so a column that named a relative would be unshippable
   *  whoever wrote it. */
```

### `PSY_COUNSEL` – v88 – a fourth column owed

```ts
  /** ⭐⭐⭐ v88 – A FOURTH COLUMN OWED, AND THE UNREACHABILITY ARGUMENT IS THE TIGHTEST OF THE FOUR.
   *  The register is stamped at ONE site, off a `'fork-opinion'` row answered `stop` – the fork at
   *  NINETEEN, which blocks the calendar until it is answered. A `'divorce'` shock needs a MARRIAGE
   *  first (`ECONOMY.wedding.ageGate` 23) and then an ending after it, so the earliest week this
   *  mark can exist is years past the last week this table is read. Owed by TYPE, never by need.
   *
   *  ⚠ `null` RATHER THAN AN ALIAS TO `breakup`'s COLUMN, and that is worth saying because the alias
   *  is far more tempting here than it was for the three above: a divorce IS «something outside the
   *  court landed on her and has not lifted», so `breakup`'s three sentences would read perfectly.
   *  They would also be the wave's whole claim thrown away in one line – the parting exists because
   *  a marriage ending is not a break-up wearing the same words, and a column that borrowed them
   *  would say the opposite in the one place a professional is supposed to be precise. */
```
