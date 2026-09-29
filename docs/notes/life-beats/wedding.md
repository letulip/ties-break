---
type: reference
status: current
area: engine
last-reviewed: 2026-09-29
---

# Life beat – wedding

The comment chronicles that stood in `wedding.ts` and `weddingCopy.ts` under `src/engine/world/lifeBeat/`, moved here verbatim (T7.4 of the principles fix). The source keeps each site's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to the site's heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## Hazard module – `wedding.ts`

### `wedding.ts` header

```ts
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
```

### `wedding.ts` §11 – the wedding

```ts
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
```

### `weddingEligible` – The gate – all four, and a false here means zero

```ts
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
```

### `rollWedding` – The weekly roll – the one raise site of 'engaged'

```ts
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
```

### `PARTNER_NAME_POOL` – Draft – the pool, ≥ 24 fictional first names

```ts
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
```

### `partnerNameFor` – v83 T6's one derivation function, landed with T3

```ts
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
```

### `landWedding` – v83 T3 – the wedding lands

```ts
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
```

## Copy leaf – `weddingCopy.ts`

### `weddingCopy.ts` header

```ts
// A-06 / T6.8 – `world/lifeBeat.ts` §3g MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is the WEDDING's copy half: a
// pure leaf, which the review measured rather than guessed – §3g referenced nothing else in the old
// file, and the only thing that read it was the dispatcher hub (`lifeBeatSaid`, `lifeBeatHeading`).
// So the arrow runs hub -> here and never back, which is the direction `tests/import-cycles.test.ts`
// judges and `tests/principles-a06-life-beat-direction.test.ts` states per module.
//
// ⚠ THE THREE NAMES ARE `export`ed HERE AND NOT RE-EXPORTED BY THE HUB, on purpose: they were
// module-private before and nothing outside `lifeBeat.ts` ever read them, so the barrel's public
// surface is unchanged. `world.ts`'s import list did not move.
//
// ⚠ THE WEDDING'S OTHER HALF – §11, the hazard that decides whether an episode becomes a marriage –
// is STILL IN THE HUB, and that is P4's rule rather than an unfinished job: it calls back into the
// hub (`kidAgeNow`, `hasBeatFor`, `raiseLifeBeat`, `lifeLogOf`) AND its five names have to reach
// `world.ts` through the hub's re-export, so the hub would both import it and be imported by it.
// «If both are true it is not ready to move» – see the wave's report for the measured arm.
```

### `weddingCopy.ts` §3g – 'engaged' – the week she says she is getting married

```ts
// =================================================================================================
// 3g. `'engaged'` – THE WEEK SHE SAYS SHE IS GETTING MARRIED (the wedding, wave 7: T2).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T7's table).
// =================================================================================================
//
// SHE ANNOUNCES – §4a's law at the layer's biggest ask so far: no parent menu opened her decision,
// and what the parent holds is a reaction. The pool is `ENDED_HER_LINE`'s shape one register
// smaller: one cell per voice (no register axis – the announcement is one scene, and unlike an
// ending it carries no told-now/told-late split, because `rollWedding` raises it the week she
// decides and there is nothing to hear about late), plus the dry card for a `strained`/`cold` home
// and one heading.
//
// ⚠⚠ RE-AIMED 26.09 (the owner's ruling 19 on B-08): «in both presences» above WAS TRUE OF THE POOL
// AND FALSE OF THE GAME, and the four roof cells have gone. `weddingEligible` refuses below
// `ECONOMY.wedding.ageGate` (23) and no career can be under a roof at 23 – school is over by 18.92
// for every girl the game can generate and `diaryLifeStageFor` sends everyone past 22 to
// `independent`, with `college` away too – so the roof column was four lines the owner had read and
// no player could reach. `DIVORCED_HER_LINE`'s collapse of 23.09 is the precedent, argued the same
// way; the measurement is `tests/principles-b08-presence-reach.test.ts` §A, which sweeps every
// profile the clamp can hold against every week a career can reach. ⚠ NOT ONE SURVIVING BYTE MOVED
// (invariant 4): the `away` cells are the values below, verbatim.
//
// ⚠ NO NAME AND NO GENDER in any line – the name is WRITTEN at this beat (T3's `partnerNameFor`) but
// which surfaces SPEAK it is a later task's question, and a pool that jumped ahead of that ruling
// would be taking a wording decision that is his.
```

### `ENGAGED_HER_LINE` – Draft – her announcement, by voice, one channel

```ts
/** ⚠ ⚠ DRAFT – HER ANNOUNCEMENT, BY VOICE, ONE CHANNEL. The voice bibles govern: `sunny` says
 *  it evenly and names the feeling; `fiery` gives the verdict first, at speed, in absolutes;
 *  `quiet` says the practical surface and leaves herself out; `deep` says one true thing, late,
 *  stripped of its size, in full stops.
 *
 *  ⚠⚠ THE PRESENCE AXIS IS GONE, AND ITS ABSENCE IS A MEASURED FACT RATHER THAN A SIMPLIFICATION
 *  (26.09, ruling 19 on B-08 – `DIVORCED_HER_LINE`'s own sentence one wave back). An engagement
 *  under a roof cannot happen: the gate is 23 and every stage at 23 is away. The
 *  `Record<Temperament, string>` says so in the type, so a roof line cannot be written back in
 *  without the type refusing it first. Each cell below is the `away` frame that shipped. */
```
