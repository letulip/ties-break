---
type: reference
status: current
area: engine
last-reviewed: 2026-09-29
---

# Life beat – forkCounsel

The comment chronicles that stood in `forkCounselCopy.ts` under `src/engine/world/lifeBeat/`, moved here verbatim (T7.4 of the principles fix). The source keeps each site's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to the site's heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## Copy leaf – `forkCounselCopy.ts`

### `forkCounselCopy.ts` header

```ts
// A-06 / T6.8 – `world/lifeBeat.ts` §3d MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is `'fork-counsel'` – the coach's
// read on a `stop` – and a pure leaf: §3d referenced nothing else in the old file except the exported
// `ForkStopDriver` type, and only the dispatcher hub read it. Hub -> here, never back.
//
// ⚠ `ForkStopDriver` COMES BACK AS `import type`, which is the one arrow allowed to point at the hub:
// TypeScript erases it, so `tests/import-cycles.test.ts` does not count it and cannot – that is the
// same licence every `world/*` module uses for `WorldState` (CLAUDE.md's P4 rules).
```

### `forkCounselCopy.ts` §3d – 'fork-counsel' – the coach's read on a stop

```ts
// =================================================================================================
// 3d. `'fork-counsel'` – THE COACH'S READ ON A `stop` (wave 3, T17). EVERY WORD BELOW IS A DRAFT.
// =================================================================================================
//
// ⭐⭐⭐ THE OWNER'S «обсуждать с тренером», RULED 11.09 off his own playtest. When the want she states
// at the fork is `stop`, answering her raises ONE more row before the fork may be answered: the coach
// says what he sees. It is the second half of «always with readable roots» – the arithmetic gives the
// want a cause, this gives the player somebody who can name it.
//
// ⚠⚠ THE VOICE IS NOT HERS AND THIS POOL IS THEREFORE **NOT INDEXED BY TEMPERAMENT**. `HER_LINE`,
// `MET_HER_LINE` and `SMALL_TALK_LINE` are indexed by it because they are her speaking; the coach is
// a man with a professional opinion, and giving him four voices would be the supporting-cast rule
// (who-she-is §5c) broken on its first use. He is keyed on the DRIVER and on nothing else.
//
// ⚠ AND NOT BY THE BOND BAND EITHER. The band is the distance between HER and the parent; the coach
// is not in that relationship, and his read of a cold home is exactly the read the flat pool cannot
// give – see `HER_STOP_LINE`'s own note on why `strained` reaches the player through him.
//
// ⚠⚠ THE PSYCHOLOGIST'S COUNSEL IS WAVE 5's AND HE DOES NOT EXIST. His beat slots BESIDE this one –
// another kind, raised from the same place in `answerLifeBeat`, keyed on the same driver, blocking in
// the same way – and layer 3 (the pressed-through stop remembered and re-read later) is his too. This
// pool is deliberately shaped so that adding him is a second table and not a rewrite of this one.
```

### `COACH_COUNSEL` – What the coach says, by driver – 3 drafts

```ts
/** ⭐⭐ WHAT THE COACH SAYS, BY DRIVER – 3 drafts, the «the tennis is not the question» family.
 *
 *  ⚠ THE SHARED OPENING IS THE POINT OF THE FAMILY and not a lazy prefix: whatever the root, the one
 *  thing the man paid to make her better says first is that this is not a tennis problem. Everything
 *  after it is what he can see and what he cannot.
 *
 *  ⚠ THE HONESTY LAW BINDS HIM AS HARD AS IT BINDS HER. He may name what he has seen in a session and
 *  what he cannot reach; he may not name a duration, a date, a count, a result or another person –
 *  the sim holds none of them for him, and «he has coached her for years» is a fact nobody wrote. */
```
