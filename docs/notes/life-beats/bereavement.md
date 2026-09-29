---
type: reference
status: current
area: engine
last-reviewed: 2026-09-29
---

# Life beat – bereavement

The comment chronicles that stood in `bereavement.ts` and `bereavementCopy.ts` under `src/engine/world/lifeBeat/`, moved here verbatim (T7.4 of the principles fix). The source keeps each site's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to the site's heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## Hazard module – `bereavement.ts`

### `bereavement.ts` header

```ts
// A-06 / T6.10 – `world/lifeBeat.ts` §16 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ THE FIRST HAZARD MODULE THAT NEEDS THE HUB, AND THAT IS WHY IT COULD NOT MOVE IN T6.8. The two
// sections T6.8 did move (§9 the leak, §10 the booth) reference nothing in the hub, so the hub could
// keep re-exporting their names for the barrel's sake. §16 calls `raiseLifeBeat` and `kidAgeNow`, so
// it imports the hub – and a hub re-export on top of that is an edge hub → kind against the edge
// kind → hub, which `tests/import-cycles.test.ts` refuses. T6.8 measured the pair with a real arm:
//
//     cycle over 2 modules:
//         src/engine/world/lifeBeat.ts       -> src/engine/world/lifeBeat/_arm.ts  { armRollBereavement }
//         src/engine/world/lifeBeat/_arm.ts  -> src/engine/world/lifeBeat.ts       { raiseLifeBeat }
//
// ⭐ SO THE BARREL TAKES THESE THREE NAMES FROM HERE, NOT FROM THE HUB (CLAUDE.md, the life-beat
// rule): `src/engine/world.ts` imports them off `./world/lifeBeat/bereavement` and re-exports them on
// the SAME export statement as before, so the barrel's frozen name set (T6.6's
// `tests/principles-a03-barrel-surface.test.ts`) does not move a single specifier of its own.
// `world/phaseHerWeek.ts` – the only other caller – asks this module for `rollBereavement` directly.
// The edge is now world.ts → bereavement → lifeBeat, and the hub reaches `world.ts` only through
// `import type`, which TypeScript erases. No cycle.
//
// ⚠ `WorldState` COMES FROM `../state`, THE MODULE THAT DECLARES IT, and never from the barrel:
// `tests/principles-a03-type-import-ratchet.test.ts` grandfathers the `world/*` files that predate
// that rule and fails a NEW one, so this file gets it right on arrival.
//
// ⚠ AND IT SITS FLAT IN `world/lifeBeat/`, which is A-06's own shape and the premise the hub's line
// ceiling is written on – a new beat KIND is a new module here, not a directory deeper.
```

### `bereavement.ts` §16 – a death in the family

```ts
// =================================================================================================
// 16. A DEATH IN THE FAMILY – ⚠⚠ THE WORLD'S DICE, NEVER HER PERSONALITY'S (the weight, wave 11: T5)
// =================================================================================================
//
// `docs/specs/the-weight-2026-09.md` §4, his 23.08 «вплести похороны» and the numbers he drafted on
// 11.09, RULED as drafted constants on 22.09 (question 3). It is §16 for §14's and §15's own stated
// reason: appended rather than renumbered.
//
// ⚠⚠ THE WAVE'S SECOND STREAM, RESERVED IN WRITING ON 11.09 AND CREATED HERE:
//
//     seed:life:loss:<week>                 does somebody die, this week
//
// ⚠ IT IS THE KEY HE NAMED THAT DAY and it is deliberately NOT the pregnancy loss's
// `seed:life:pregnancy-loss:<conceivedWeek>:<week>` (§15). Two different facts may never share a
// key, and these two live in the same file under nearly the same word.
//
// ⚠⚠ THE HAZARD IS TEMPERAMENT-FREE AND THAT IS A DESIGN LAW WITH A PIN. A death is the world's
// dice; only the RESPONSE is hers – intensity prices depth (and therefore duration, under the
// one-rate law), openness prices expression. `bereavementChanceAt` takes NO ARGUMENTS AT ALL, which
// is the read-set fence pushed as far as it goes, and `tests/wave11-bereavement.test.ts` §B sweeps
// all four temperaments on shared seeds and asserts the realised weeks are identical.
```

### `bereavementEligible` – The gate – four clauses, and a false here means zero

```ts
/** ⭐⭐ THE GATE – FOUR CLAUSES, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  1. ⭐⭐⭐ **THE SWITCH.** `world.weightEnabled`, RULED 22.09. Off means no draw at all.
 *  2. ⭐⭐ **THE ADULT RUNG** – `kidAgeExact >= ECONOMY.weight.bereavement.fromAgeYears` (23), his
 *     23.08 «начиная со ступени adult». ⚠ THE ASSET ENFORCES WHAT THE GATE PROMISES:
 *     `fem-euro-brunnet-adult-funeral.webp` exists at the `adult` band and nowhere else, so a
 *     bereavement below the rung would have no picture to wear. The 11.09 log says exactly that.
 *  3. ⭐⭐ **THE CAP** – `bereavementWeeks.length < capPerCareer` (2). A hard cap and not a shaped
 *     decay: past two the arc stops being a life and starts being a theme.
 *  4. ⭐⭐ **THE SPACING** – at least `spacingWeeks` (156) since the last one. Two deaths inside a
 *     season would read as a mechanic rather than as a life.
 *
 *  ⚠⚠ CLAUSES 3 AND 4 READ `world.bereavementWeeks` AND NEVER A DERIVED GUESS, which is the whole
 *  reason that list is persisted: a death writes no record of its own, and `spiritShock` holds ONE
 *  mark that clears itself when she recovers.
 *
 *  ⚠ AND NOTHING ABOUT HER TEMPERAMENT, HER SPIRIT, HER BOND, HER MARRIAGE OR HER SEASON IS IN HERE.
 *  That is the design law, and this gate is the half of the fence `bereavementChanceAt`'s empty
 *  signature cannot build on its own. */
```

### `rollBereavement` – The weekly roll – where spiritShock.kind becomes 'bereavement'

```ts
/** ⭐⭐⭐ THE WEEKLY ROLL, AND THE ONE PLACE `spiritShock.kind` BECOMES `'bereavement'`.
 *
 *  ⚠⚠ THE LINE ORDER IS THE RULE, `rollPregnancy`'s four steps inherited for the third time: the
 *  gate returns first, the CHANCE is computed second and returns if it is 0, and only then is the
 *  stream derived. Never draw-and-discard.
 *
 *  WHAT IT DOES, and the list is §4 in order:
 *    · the week joins `bereavementWeeks`, which the cap and the spacing then read;
 *    · `spiritShock` lands as `'bereavement'` – the depth is `ECONOMY.spirit.shock.bereavement`,
 *      intensity-scaled, and there is NO second recovery rate, no taper and no flag behind it
 *      (§5's one-rate law, refused in writing in `engine/spirit.ts` long before this kind existed);
 *    · the blocking card is raised, in her voice, with the funeral painting on it.
 *
 *  ⚠ THE DETAIL IS THE WEEK, as a string – machine-readable and never a rendered sentence (§G.2's
 *  law). It is the only fact the beat has, because the deceased is UNNAMED (RULED 22.09), and it is
 *  what makes two bereavements in one career distinguishable rows in `lifeLog`.
 *
 *  ⚠⚠ IT IS **NOT** ON THE ATTACHMENT MACHINERY (the design's §3e): its own shock kind, it can reach
 *  the parent in words and never in a number, and the psychologist reads the kind for free exactly
 *  as step 5 built him to. `tests/wave11-bereavement.test.ts` §D is the pin that he needed nothing.
 *
 *  ⚠ ZERO MAIN DRAWS: it takes no `Rng` and pulls only from `seed:life:loss:<week>`, so the frozen
 *  capture (41550 / e6b0c709) cannot see it. */
```

## Copy leaf – `bereavementCopy.ts`

### `bereavementCopy.ts` header

```ts
// A-06 / T6.8 – `world/lifeBeat.ts` §3l MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is the BEREAVEMENT's copy half,
// and a pure leaf by the review's matrix: §3l referenced nothing else in the old file and the only
// thing that read it was the dispatcher hub. Hub -> here, never back.
//
// ⚠ §16, the death's HAZARD half – the world's dice rather than her personality's – is still in the
// hub: it calls back into it (`kidAgeNow`, `raiseLifeBeat`) and its three names reach `world.ts` and
// `world/phaseHerWeek.ts` through the hub's re-export, so the hub would both import it and be
// imported by it. «If both are true, it is not ready to move» (P4's rule).
//
// ⚠ AND THE SUB-STREAM KEY STAYED WITH §16, WHICH IS WHERE IT IS DRAWN: `life:loss`, deliberately not
// `life:bereavement` (§3l's own note, and T3.9's inventory is the pin). Nothing in this file draws.
```

### `bereavementCopy.ts` §3l – 'bereavement' – a death in the family

```ts
// =================================================================================================
// 3l. `'bereavement'` – A DEATH IN THE FAMILY (the weight, wave 11: T5).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4).
// =================================================================================================
//
// ⚠⚠ **THE DECEASED IS UNNAMED, IN MECHANICS AND IN COPY** – RULED 22.09 (question 4), and the
// reason is a collision this game already has: the fridge pool names a grandmother in lines nothing
// licenses, so shipping a NAMED death against an unlicensed «Grandma called» scrap is exactly the
// contradiction the honesty law exists to prevent. «There has been a death in the family» is the
// whole of what any line here may say, and licensing named kin off live-kin facts is its own later
// work. ⚠ That also means no relation word: not a grandmother, not an aunt, not a cousin.
//
// ⚠⚠ OPENNESS OWNS THE EXPRESSION AND INTENSITY OWNS NOTHING HERE – his 11.09 ruling, read exactly:
// «INTENSITY owns depth AND duration … OPENNESS owns expression (private grieves quietly – the feed
// and diary nearly silent, the face and the funeral frame carrying it; open speaks)». So the DEPTH
// is `ECONOMY.spirit.shock.bereavement` seen through `perturbationScale`, which is the intensity
// axis and lives in `engine/spirit.ts`; what this pool carries is how much she SAYS, and the private
// voices say least. Nothing in these words is a second pricing of anything.
//
// ⚠⚠ RE-AIMED 26.09 (the owner's ruling 19 on B-08) – THE SHARED-SPAN RULE STOOD HERE TOO AND HAS
// NOTHING LEFT TO GOVERN: the presence axis is gone and the four roof cells with it.
// `bereavementEligible` refuses below `ECONOMY.weight.bereavement.fromAgeYears` (23), and at 23 every
// stage is away – school is over by 18.92 for every girl the game can generate, `diaryLifeStageFor`
// sends everyone past 22 to `independent`, and `college` is away as well – so the roof column was
// four lines nobody could be shown. §3m's own collapse of 23.09 is the precedent, argued the same
// way; the measurement is `tests/principles-b08-presence-reach.test.ts` §A and §D. ⚠ NOT ONE
// SURVIVING BYTE MOVED (invariant 4): the `away` cells are the values below, verbatim.
//
// ⚠ NO DATE AND NO NUMBER IN ANY LINE (rule 4). The week is on the world and the calendar is where a
// date belongs; a line that named one would also be naming a constant T6 is going to measure.
```

### `BEREAVEMENT_HER_LINE` – Draft – what she says, by voice, one channel

```ts
/** ⚠ ⚠ DRAFT – WHAT SHE SAYS, BY VOICE, ONE CHANNEL. The voice bibles govern: `sunny` says it
 *  plainly and wants him near; `fiery` says it loudly and then will not sit with it; `quiet` says
 *  the practical surface and leaves herself out; `deep` says the one fact and nothing else at all.
 *
 *  ⚠⚠ THE PRESENCE AXIS IS GONE, AND ITS ABSENCE IS A MEASURED FACT RATHER THAN A SIMPLIFICATION
 *  (26.09, ruling 19 on B-08 – `DIVORCED_HER_LINE`'s own sentence one wave back): the rung nothing
 *  fires below is 23, and every stage at 23 is away. The `Record<Temperament, string>` says so in the
 *  type, so a roof line cannot be written back in without the type refusing it first. Each cell below
 *  is the `away` frame that shipped. ⚠ §4's «private grieves almost silently» is untouched by this:
 *  openness reaches the card through the four voice cells themselves, never through the axis removed. */
```
