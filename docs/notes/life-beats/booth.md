---
type: reference
status: current
area: engine
last-reviewed: 2026-09-29
---

# Life beat – booth

The comment chronicles that stood in `booth.ts` under `src/engine/world/lifeBeat/`, moved here verbatim (T7.4 of the principles fix). The source keeps each site's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to the site's heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## Hazard module – `booth.ts`

### `booth.ts` header

```ts
// A-06 / T6.8 – `world/lifeBeat.ts` §10 MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). §10 is the second of the two the
// review measured at 0 outbound / 0 inbound references inside the old file – it touches nothing in
// the hub and nothing in the hub touches it – so, like `leak.ts`, the arrow runs one way: the hub
// re-exports the two names below under their historical spelling and this module never imports the
// hub. `WorldState`, `LoveEpisode` and `TierId` all come in as `import type`, erased at compile time.
//
// ⚠ FLAT IN `world/lifeBeat/`, for the reason `leak.ts`'s header states in full: `engineModuleSource`
// globs `<name>/*.ts` without recursing, and T3.9's key inventory reads this module set through it.
```

### `booth.ts` §10 – the booth

```ts
// =================================================================================================
// 10. THE BOOTH – ⚠⚠ THE WEEK IT SAYS IT OUT LOUD (the spotlight, wave 6: T7)
// =================================================================================================
//
// `docs/plans/the-way-she-sounds-2026-09.md` C4, `docs/plans/life-wave-6-builder-2026-09.md` §2 T7,
// the window in `ECONOMY.spotlight.newsWindowWeeks`. §9 above is the week the WORLD finds out; this
// is the week a commentator fills a changeover with it, and the two are one system by the owner's
// own 10.09 ruling.
//
// THE OWNER, 10.09: «личная жизнь спортсменов часто на виду, т.е. что-то вполне может быть и про
// частную жизнь, как в Wimbledon фильме в конце было» – and the loop that ruling closes: «a booth
// mention of her private life IS an exposure event for the spotlight», so what is said on air costs
// her spirit through T3's pass like every other week in the light.
//
// ⚠⚠ ZERO DRAWS, ON ANY STREAM, AND IT IS THE WAVE'S DESIGN RATHER THAN A LIMITATION (§3: «the booth
// mention is DETERMINISTIC by design – the licence conditions fire it, no dice; variety is the
// persona wave's business»). Nothing below takes an `Rng`, derives a key or reads a clock: the
// licence is four facts about records the world already keeps, and on a week all four hold, the
// booth speaks. The frozen MAIN capture (41550 / `e6b0c709`) cannot see this section by
// construction, and `src/viz` – where the WORDS live – has no draw in it at all.
//
// ⚠⚠ AND IT READS THE STAMPS WITHOUT RE-JUDGING THEM – the architect's RULING T, which is T6's
// narrowing pointing this way. The licence asks «did the world learn of this» (`publicWeek`) and
// never «is it still true»; that is honest ONLY because §9 leaks the ACTIVE episode alone, so a
// public fact is a fact about a romance that was live when the world learned of it. If a later wave
// ever adds a retrospective leak, THIS licence is the second thing it has to re-read: «a face in the
// players' box» about somebody long gone is exactly what the narrowing prevents.
//
// ⚠⚠ WHERE IT RUNS, AND THE STEP IS THE ARCHITECT'S OWN QUESTION (ruling P's ⚠ to this task: «your
// «this week has a big-stage match» read must be honest about which step it runs in»). MEASURED, and
// it decides the placement:
//
//     step 3  resolveBodyAndPlanner – the life block (§5-§9) and `accrueSpirit`
//     step 5  playHerWeek           – the entered event, the fares, the shadow run  ← **HERE**
//
// At step 3 `world.week` holds no match at all: `enteredThisWeek` has not been resolved, the doctor
// has not seen her, and the three arms that decide whether she plays (walkover / medical withdrawal
// / she boards) are two phases away. A licence spelled there would have had to re-derive «is there a
// big-stage match this week» from the calendar and then get the injury, the college freeze and the
// medical veto right a second time – four rules with two spellings, which is the defect ruling P
// spent a whole task removing, rebuilt one concern over. At step 5 the match is IN HAND: the caller
// holds the event she is actually about to play, and it passes the tier down (§0.1's dependency
// inversion, the same move `psychologistWorksThisWeek` and `newsStandingOf` already make).
//
// ⚠⚠ AND THAT IS NOT A SECOND CLOCK – RULING P's ONE HORIZON IS UNTOUCHED. The stamp names THIS week
// (the week the booth spoke), exactly as §9's `publicWeek` does; T3's pass asks
// `exposureEventsOf(world, world.week − 1)` on the NEXT tick and prices the `'aired'` event there.
// One horizon, one pass, one tick later – the ruling working rather than a lag anybody added. What
// this placement changes is not WHEN the pressure lands but whether the licence can see a match at
// all, and nothing in the tick moved to buy it: `accrueSpirit` is where it was, the life block is
// where it was, and the six pins on that position are untouched.
//
// ⚠ A RUN SHE DOES NOT WATCH IS STILL A RUN THAT AIRED. The stamp is spent whether the player
// reveals the match, skips the tournament or closes the app – which is the model being honest rather
// than a hole: the booth said it on television, and whether the parent was watching is not the
// world's business. The pressure lands either way, which is the half the spotlight is actually about.
```

### `boothMentionDue` – What the booth may touch at week, or null

```ts
/** ⭐⭐ WHAT THE BOOTH MAY TOUCH AT `week`, or null – the LICENCE, and a null here means the section
 *  writes nothing at all.
 *
 *  ⚠⚠ ITS OWN PREDICATE FOR `leakEligible`'s STATED REASON: a reader has to be able to see the whole
 *  of «may it speak» in one place, before anything is written. Pure, zero draws, no writes.
 *
 *  THE FOUR CLAUSES, and every one of them is a fact the world already recorded:
 *
 *  1. THE WORLD KNOWS – `publicWeek !== null`. §0's delta 3 in its own words: «a fact only the
 *     family holds is never voiced, at any fame». This is the honesty boundary of the whole channel
 *     and it is one comparison; there is deliberately no fame, no bond and no wall clause beside it
 *     that could ever be read as «famous enough to be worth breaking».
 *  2. IT HAS NOT AIRED – the two `aired*` stamps ARE the once-ness (`LoveEpisode`'s own note), so a
 *     fact that has been voiced is over with, for ever, and no second rule is needed to say so.
 *  3. IT IS STILL NEWS – the fact's own age against `ECONOMY.spotlight.newsWindowWeeks`, measured
 *     from the week the FACT became public (`publicWeek` for «someone is there») or true
 *     (`endedWeek` for «it is over»). ⚠ A NEGATIVE AGE IS OUT TOO: a stamp in the future cannot be
 *     aired today, and on a crafted or migrated row that is the difference between silence and a
 *     booth announcing next season's break-up.
 *  4. AND THE ENDING NEEDS THE WORLD TO KNOW OF THEM AT ALL – `publicWeek !== null` gates BOTH
 *     facts, which is the brief's own spelling of the second licence (`endedWeek !== null &&
 *     publicWeek !== null`). A relationship the world never learned of does not get an obituary.
 *
 *  ⚠ MET BEFORE ENDED, AND IT IS TWO PASSES RATHER THAN ONE – the brief's «met before ended if both
 *  are due», which cannot be spelled as a single walk that returns the first due fact of the first
 *  due row: on two episodes where the OLDER has a due ending and the NEWER a due «met», a single
 *  walk would voice the ending first. Two passes say what the sentence says.
 *
 *  ⚠ THE EPISODE ORDER IS THE LIST'S OWN – appended in calendar order and never pruned
 *  (`loveEpisodesOf`), so «the first due row» is the oldest one, deterministically, and two runs of
 *  the same world can never disagree. */
```

### `airBoothMention` – The weekly booth mention – the one writer of airedMetWeek

```ts
/** ⭐⭐⭐ THE WEEKLY BOOTH MENTION, and the ONE writer of `airedMetWeek` and `airedEndedWeek` in the
 *  engine. Called from `playHerWeek`'s play arm – see the §10 banner for why that step and not the
 *  life block's.
 *
 *  ⚠⚠ `tier` IS THE EVENT SHE IS ABOUT TO PLAY, HANDED DOWN, AND IT IS WHAT MAKES THE STEP HONEST.
 *  The caller holds it (the arm where she has boarded and the shadow run is stashed); this function
 *  therefore cannot be called from a phase where the match is unknown, because there would be
 *  nothing to pass – §0.1's dependency inversion used as a STRUCTURAL guard rather than as a
 *  convenience. ⚠ REQUIRED AND NOT DEFAULTED: a default would let a caller in a matchless phase
 *  compile, which is the one mistake this parameter exists to make impossible.
 *
 *  ⚠⚠ AND THE NEWS GATE DESCRIBES THE **LAST CLOSED WEEK** – `newsStandingOf`'s cached rank,
 *  the same spelling `leakEligible` uses one section up and the same horizon T3's pressure and T4's
 *  habituation read. ONE horizon per wave (ruling P); the gate asks about the week that produced the
 *  lenses and the stamp records the week they aired, which is §9's own sentence about `publicWeek`.
 *
 *  ⚠ AT MOST ONE FACT A WEEK, BY CONSTRUCTION RATHER THAN BY A COUNTER: `boothMentionDue` returns
 *  one, and the stamp it writes closes that fact for ever. A week that had two due facts voices the
 *  `'met'` and leaves the ending for a later match – which is also why the window is a window on the
 *  FACT and not a cooldown on the booth. */
```

### `airBoothMention` – The stamp is the once-ness – one assignment

```ts
  // ⭐⭐⭐ THE STAMP IS THE ONCE-NESS – one assignment, and the fact can never be voiced again. There
  // is no boolean beside it and no «aired count»: a nullable week says both «has it aired» and
  // «when», so the two can never disagree (`LoveEpisode`'s own note). T2's `'aired'` exposure kind
  // reads exactly this field, so the mention IS the exposure event with nothing in between.
  // ⚠ v88 (wave 12 – T5): `'divorced'` STAMPS `airedEndedWeek`, THE SAME FIELD, and that is right
  // rather than a shortcut. There is one «it is over» fact per episode and one stamp for it; what
  // the latch changes is what the booth CALLS it, never how many times it may be said. A second
  // field would let one ending air twice.
```
