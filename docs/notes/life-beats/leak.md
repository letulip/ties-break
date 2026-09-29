---
type: reference
status: current
area: engine
last-reviewed: 2026-09-29
---

# Life beat – leak

The comment chronicles that stood in `leak.ts` under `src/engine/world/lifeBeat/`, moved here verbatim (T7.4 of the principles fix). The source keeps each site's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to the site's heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## Hazard module – `leak.ts`

### `leak.ts` header

```ts
// A-06 / T6.8 – `world/lifeBeat.ts` §9 MOVED HERE VERBATIM, span for span, comments and all.
//
// The rule this file is the first instance of (CLAUDE.md, the life-beat line): **a beat kind is its
// own module.** `lifeBeat.ts` keeps the hub – the queue, raising and answering, prompt assembly and
// the shared presence law – and re-exports the four names below under their historical spelling, so
// `world.ts`'s barrel and `world/phaseHerWeek.ts`'s call site did not move.
//
// ⚠ WHY THE LEAK WENT FIRST. A-06 named it the pilot for one measured reason: §9 referenced NOTHING
// else in the file and nothing in the file referenced it (0 outbound / 0 inbound in
// `docs/review-principles-2026-09-26/probes/a-lifebeat-sections.mjs`). So the arrow runs one way –
// the hub re-exports this module and this module never imports the hub – which is the direction
// `tests/import-cycles.test.ts` judges and `tests/principles-a06-life-beat-direction.test.ts` states
// per module. `WorldState` comes in as `import type`, erased at compile time, exactly as every
// `world/*` module takes it (CLAUDE.md's P4 rules).
//
// ⚠ AND IT SITS FLAT IN `world/lifeBeat/`, WHICH IS NOT A PREFERENCE. `tests/worldSource.ts`'
// `engineModuleSource` globs `<name>/*.ts` WITHOUT recursing, and T3.9's sub-stream key inventory
// (`tests/life-beat-keys.test.ts`) reads this module set through it. A kind parked one directory
// deeper would take its `rngFromSeed` keys out of that inventory's sight while the inventory stayed
// green – CLAUDE.md invariant 2's silent re-deal, arriving as a directory layout.
```

### `leak.ts` §9 – the leak

```ts
// =================================================================================================
// 9. THE LEAK – ⚠⚠ THE WEEK THE **WORLD** FINDS OUT (the spotlight, wave 6: T6)
// =================================================================================================
//
// `docs/specs/who-she-is-2026-09.md` §3c-bis, `docs/plans/life-wave-6-builder-2026-09.md` §2 T6,
// constants in `ECONOMY.spotlight`. Sections 5 to 8 above are one attachment's arc as the FAMILY
// lives it; this is the only place a third party ever enters it.
//
// THE OWNER, 10.09: «слава + комментаторы + пресса + давление + темпераменты – мне кажется у нас
// как-то тоже можно понимать сколько вообще какой личной информации и куда просачивается у разных
// характеров… можем какую-то логику запланировать?»
//
// ⚠⚠ THE TWO STREAMS OF THIS WAVE, AND THEY ARE THE ONLY TWO IT HAS:
//
//     seed:life:leak:<episodeId>:<week>         does this episode get out, this week
//     seed:life:leak:story:<episodeId>:<week>   ...and did the story land WRONG, at the leak week
//
// (seed, calendar)-keyed like the other four life streams, never a choice, so a player cannot
// manufacture a headline by playing the week differently. ⚠ THE SECOND IS DERIVED ONLY ON THE WEEK
// THE FIRST FIRES – `rollEnds`' own discipline for `:react`, and the reason it is a second KEY
// rather than a second read of the first is §1f's one-value-per-key law.
//
// ⚠⚠ ZERO DRAWS ON MAIN AND ZERO DRAWS ON AN INELIGIBLE WEEK. The first is structural (nothing here
// takes an `Rng`, so the frozen capture 41550 / e6b0c709 cannot see this section). The second is the
// wave's load-bearing rule inherited whole from §5, §7 and §8: `leakEligible` decides EVERYTHING and
// `rollLeak` returns on it BEFORE either stream is derived. ⚠ AND THE TEST FOR IT IS A KEY COUNT
// WITH A VALUE CHECK BESIDE IT – the architect's ruling L: a key counter sees KEYS and never
// CONSUMED VALUES, so it proves a stream was not REACHED and cannot prove it was not ADVANCED.
// `tests/wave6-spotlight-leak.test.ts` §B counts the keys the gate reached, in an array the code
// under test cannot see; §C asserts the exact fire set against uniforms drawn in the test from the
// real `rngFromSeed`, which is an expectation that never calls `rollLeak`.
//
// ⚠⚠ THE GATE ASKS ABOUT THE **LAST CLOSED WEEK**, WHICH IS THE ARCHITECT'S RULING P APPLIED TO THIS
// CHANNEL AND NOT A SECOND CLOCK. The pressure reads `exposureEventsOf(world, world.week − 1)` and
// habituation read the same gate; so did this. ⭐ D1 (14.09) moved the gate to the STANDING, which
// is present-tense by its own contract (the cached rank already describes the last closed fold),
// so the one-horizon law below is kept by construction now. Three reasons, and the first
// is the ruling's own:
//
//   1. ONE HORIZON PER WAVE. A leak gated at `world.week` whose own consequence – the `'wrongStory'`
//      exposure event – is priced at `world.week − 1` would put two clocks inside one mechanism, and
//      ruling P refused a split horizon in the ledger for exactly that reason.
//   2. THE WEEK BEING LIVED HAS NOT HAPPENED YET AT THIS POINT IN THE TICK. `resolveBodyAndPlanner`
//      is step 4 and `playHerWeek` is step 6, so at this line `world.week` holds no result, no
//      trophy and no match – asking «is she news THIS week» here is the very shape ruling P found
//      starving `'stage'` and `'publicLoss'`.
//   3. AND IT IS THE TRUER READING, in ruling P's own words: the cameras were on her at the weekend
//      and the story runs the week after. ⚠ THE STAMP STILL NAMES **THIS** WEEK – `publicWeek =
//      world.week` – because the week the world learned is the week the story ran, and the feed row
//      is dated by when the parent reads it. The gate asks about the week that produced the lenses;
//      the stamp records the week they printed.
//
// ⚠ SO T3's PASS SEES THE `'wrongStory'` EVENT ONE TICK LATER, and that is the wave's one clock
// working rather than a lag anybody added: `exposureEventsOf` matches `publicWeek === week`, the
// pass asks about `world.week − 1`, and the pressure therefore lands in the tick after the headline.
//
// ⚠⚠ IT RUNS ON THE **ACTIVE** EPISODE, WHICH IS A NARROWING OF THE BRIEF AND IS STATED RATHER THAN
// SLIPPED IN. The brief says «per episode-week, while `publicWeek === null` and she is news», which
// read literally puts every never-public row a career ever lived – four to six of them by §4's own
// biography table – into the draw every week for ever. Three measured consequences decided it:
//
//   * THE BOOTH WOULD BE HANDED A DISHONEST LICENCE. T7 airs `'met'` on `publicWeek !== null &&
//     airedMetWeek === null`, so a row that went public three years after it ended would put «a face
//     in the players' box» on air about somebody long gone. The stamp is read, never re-judged
//     (`world/spotlight.ts`'s own doctrine), so the honesty has to live at the WRITE.
//   * IT WOULD MOVE WAVE 4's TOLD-LATE SCENE. The overtake below pulls `knownWeek` forward; on an
//     ended-and-never-told row that is precisely the episode `deliverKnownPartner` is holding for
//     its one honest late card, and nothing in this wave was asked to re-time it.
//   * AND §3c-bis's OWN MECHANISM IS A LIVE ONE: «an open girl is simply seen (dinner, a hand held
//     at an airport)». A lens catches a relationship that is happening.
//
// The brief's own sentence agrees from the other side – «an episode that ENDS while public needs no
// second hazard: the world that knows of them learns of the end with the ending» – which presumes
// publicity attaches while the row is open. ⚠ AND «PER EPISODE-WEEK» IS UNTOUCHED BY THE NARROWING:
// at most one row can be active (`activeEpisode`'s own tail rule), so per-episode and per-week
// coincide, and the KEY still carries the episode id so two attachments can never share a value.
//
// ⚠⚠ AND `knownWeek === null` IS NOT REACHABLE, WHICH MOVES THE OVERTAKE'S CONDITION. The brief and
// the `publicWeek` field's own note both spell the founding scene as «`publicWeek` set while
// `knownWeek` is still null». Measured 14.09 at the ONE writer of that field: `rollArrival` (§5)
// sets `knownWeek = sinceWeek + shaveLag(raw, band)`, and `shaveLag` returns a number for every
// input, so an engine-born row NEVER has a null there – the type allows it, the sim cannot produce
// it, and a condition written on it would be this wave's next «unable to fire». What the SPEC says
// is the reachable thing and it is what ships: «for a private girl at high fame, `publicWeek` can
// land BEFORE `knownWeek` – the parent learns about the boyfriend FROM A HEADLINE». So the
// discriminator is «has he been told yet», `knownWeek === null || knownWeek > world.week`, which
// covers the brief's spelling as a sub-case and fires on the case that exists.
//
// ⚠ IT WRITES THE TWO PUBLICITY STAMPS, ONE KEPT FEED ROW AND – ON THE OVERTAKE – ONE DATE THAT WAS
// ALREADY THE ROW'S. `world.spirit` is not touched (the `'wrongStory'` pressure is T3's term inside
// `accrueSpirit`, and that pass is the one writer of it); no beat is raised here, because the
// overtake delivers through `deliverKnownPartner` four lines later in the same tick and NO new
// delivery path exists; `airedMetWeek` / `airedEndedWeek` stay null, because the booth is T7's.
```

### `LEAK_EVENT` – The world's own version, as the parent reads it

```ts
/** ⭐ THE WORLD'S OWN VERSION, AS THE PARENT READS IT – two of them, and which one prints is the
 *  `story` stream's answer and not a reading of anything the family knows.
 *
 *  ⚠ NO `amountCents` AND NO PRICE IN ANY WORD OF IT (rule 4 at the top of this file), and no fact
 *  about the partner in the TRUE row: the sim holds none, and `LoveEpisode`'s own note says why no
 *  name and no gender is persisted. ⚠ THE WRONG ROW IS THE ONE PLACE A FIGURE MAY APPEAR AT ALL, and
 *  that is the point rather than an exception – «a mystery man» is the tabloid's INVENTION (§3c-bis
 *  names it in those words), so it asserts nothing about who she is actually with. A true story that
 *  named a man would be the schema breach; a false one that does is the mechanic.
 *
 *  ⚠ BOTH ARE DRAFTS AND DELIBERATELY NOT POLISHED – T8's вычитка and the owner's playtest are the
 *  gate (invariant 4, the wave's §5). */
```

### `leakEligible` – The gate – one function, and a false here means zero

```ts
/** ⭐⭐ THE GATE – ONE FUNCTION, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ A PREDICATE OF ITS OWN FOR `arrivalEligible`'s, `smallTalkEligible`'s AND `endsEligible`'s
 *  STATED REASON: a reader has to be able to see, in one place, that the whole of eligibility is
 *  decided before any stream exists. Pure, zero draws, no writes.
 *
 *  THE THREE CLAUSES, each with its own argument in the §9 banner above:
 *
 *  1. SOMEBODY IS THERE NOW – `activeEpisode`, the same spelling `endsEligible` uses, so «is there
 *     an attachment» has ONE reading in this file. This is the narrowing of the brief.
 *  2. THE WORLD DOES NOT ALREADY KNOW. `publicWeek` is a once-ever stamp like `endedWeek`; a story
 *     that has run cannot break again, and the booth's second fact (the ending) needs no hazard of
 *     its own because the world that knows of them learns of the end with the ending.
 *  3. AND SHE IS NEWS AT THE **LAST CLOSED WEEK** – one horizon per wave, ruling P. See the banner
 *     for why the closed week and not the one being lived. */
```

### `leakHazardFor` – The weekly leak hazard, as one probability

```ts
/** ⭐⭐⭐ THE WEEKLY LEAK HAZARD, as one probability – who-she-is §3c-bis's own formula, restored in
 *  full by the architect's RULING I:
 *
 *      leakBasePerWeek × leakOpennessMult[openness] × (fame / ECONOMY.fame.cap)
 *
 *  ⚠⚠ THE FAME FACTOR IS THE RULING AND IT IS WHAT THE BRIEF DROPPED. «More lenses on a bigger star»
 *  is a term of the spec's sentence, not a restatement of the news gate: inside the bands the
 *  scale runs 30 → 100, so a spelling without this factor has a girl at 100 leaking at exactly the
 *  rate of a girl at 30. See `ECONOMY.spotlight.leakBasePerWeek`'s own note for the measurement, and
 *  the leak suite's §D for the pin – twin careers at equal openness and different fame, where the
 *  brief's spelling produces two IDENTICAL fire sets and this one produces a strict superset.
 *
 *  ⚠ IT TAKES THE PRIMITIVES AND NOT THE WORLD – `arrivalHazardFor`'s and `endsHazardFor`'s own
 *  doctrine – so T9's bench and a corridor test can sweep the table directly instead of posing a
 *  world per cell. The caller reads `fameAt` at the horizon it has decided on, once.
 *
 *  ⚠ NO CLAMP AND NONE NEEDED: `fameAt` is `Math.min(ECONOMY.fame.cap, …)` of a sum of non-negative
 *  decayed steps, so the third factor is total on [0, 1] by the reader's own construction. A clamp
 *  here would be a second guard nobody could ever see fire, and it would hide a real defect if
 *  `fameAt` ever stopped capping. */
```

### `rollLeak` – The weekly roll, and the one writer of publicWeek

```ts
/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE writer of `publicWeek` and `publicWrong` in the engine.
 *
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED – §5, §7 and §8's rule word for
 *  word. The line order below IS the rule; moving a roll above the gate would break it silently,
 *  because every key here carries its own week and a discarded draw changes no other week's value.
 *
 *  ⚠ `<` AND NOT `<=`, `rollArrival`'s and `rollEnds`' own note: `rngFromSeed` can return exactly 0,
 *  and a hazard of 0 must be impossible rather than merely unlikely. It is REACHABLE here in a way
 *  it is not in the other two sections – the fame factor is genuinely 0 below every stamp's reach –
 *  so this comparison is a short-circuit and not only a belt.
 *
 *  ⚠⚠ EXPRESSION, NOT BIRTH, AND ONE READ FEEDS BOTH DRAWS – v76's ruling A. The hazard is EVALUATED
 *  now and the accuracy is EVALUATED now; what is PERSISTED is two weeks and a boolean, stamped at
 *  the week they were true. A girl behind walls is seen less and misreported more, which is §2a's
 *  walls doing exactly what §3c-bis says openness does.
 *
 *  ⚠⚠ AND THE OVERTAKE RAISES NOTHING ITSELF. It writes `knownWeek` and stops; `deliverKnownPartner`
 *  (§6), four calls later in this same tick, finds the row due on `knownWeek <= world.week`, writes
 *  the `'met'` kept row and raises the `'met'` card through the machinery that has raised every one
 *  of them since wave 3. NO new `LifeBeatKind`, NO second delivery path, and the card a headline
 *  raises deep-equals an ordinary one except for the frame `beatFromHeadline` picks. */
```

### `rollLeak` – And the world's version goes in the album

```ts
  // ⭐⭐ AND THE WORLD'S VERSION GOES IN THE ALBUM. ⚠ KEPT – `pruneEvents` drops ordinary rows at
  // sixty weeks and a career reads its own life back seasons later; the week it stopped being
  // private is not a line the album may be missing (`MET_EVENT`'s own reason, two sections up).
  // ⚠ NO `amountCents` – a headline is never a purchase (rule 4), and the absence of the field is
  // what keeps `accrueFinance` from ever seeing this row.
  // ⚠⚠ AND NO `lifeKind`, WHICH IS T3's FINDING INHERITED RATHER THAN A GAP. The stamp's type is
  // `LifeBeatKind` and the wave's §8 forbids a new member of it, so this row carries none and
  // `lifeRowGlyph(undefined)` resolves through `?? 'met'` to `LIFE_ROW_EMOJI.life` – the owner's own
  // 11.09 pick for life rows. who-she-is §5a forbids an agent picking a glyph unasked, so none was
  // picked; whether the spotlight deserves a mark of its own goes to him with the strings.
  // ⭐ D3 (14.09, his «да» to 📸): the spotlight FAMILY wears its own mark – `lifeKind: 'exposure'`
  // joins this row and the EXPOSURE_ROW alike, and `lifeRowGlyphs` maps it to his camera. The old
  // finding (no lifeKind, 🤍 by fallback) is answered, not deleted – see the note above.
```

### `rollLeak` – The overtake – the founding scene

```ts
  // ⭐⭐⭐ THE OVERTAKE – THE FOUNDING SCENE, AND IT IS ONE ASSIGNMENT. «A parent learning about a
  // boyfriend from a photograph» (the design plan §0) finally given its mechanism, and it is
  // strongest for exactly the girl whose walls kept him out: a private girl's lag is the longest, so
  // she is the one the world can get to first.
  //
  // ⚠⚠ THE CONDITION IS «HAS HE BEEN TOLD YET» AND NOT `knownWeek === null` – see the §9 banner's
  // last ⚠⚠ for the measurement. `rollArrival` is the one writer of that field and it always writes
  // a number, so the brief's spelling could never have fired; this one covers it as a sub-case.
  //
  // ⚠ IT NEVER PUSHES `knownWeek` LATER. The comparison is one-sided on purpose: a parent who
  // already knows is not un-told by a headline, and moving a delivered episode's date would rewrite
  // a `'met'` receipt's own past.
```
