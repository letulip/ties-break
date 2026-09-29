---
type: reference
status: current
area: engine
last-reviewed: 2026-09-29
---

# Life beat – hub

The comment chronicles that stood in `lifeBeat.ts` – the hub of `src/engine/world/lifeBeat/` – moved here verbatim (T7.4b of the principles fix). The source keeps each site's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to the site's heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## Hub – `lifeBeat.ts`

### `lifeBeat.ts` header

```ts
// THE LIFE BEAT – the week the game stops because SHE said something (the private life, wave 2).
//
// The birthday is the precedent this generalises (`world/birthday.ts`), and the two share a law:
// the ONLY way time moves again is an answer, and the engine re-validates it. What is NEW here, and
// what the birthday could never be, is that the beat is HER SPEAKING – so the dialog has no X, and
// walking away is not among the things a player can do with it.
//
// =================================================================================================
// THE FIVE RULES THIS FILE IS (wave-2 runbook §2), and where each one lives below
// =================================================================================================
//
// 1. THE BLOCK CONTRACT. `'life'` is a refusal at the top of `advanceWeeks` (`advanceRefusal`,
//    world/multiWeek.ts) AND a reason collected inside its loop – a beat may share a week with a
//    tournament, an injury or the fork, and R11-1's rule is that a week which is several things
//    reports all of them. The two halves are in world/multiWeek.ts and world.ts respectively; the
//    predicate both of them ask is `pendingLifeBeat` below.
//
//    ⭐⭐ v74 T15 – AND THE CONTRACT IS **PER KIND** SINCE 11.09: `LIFE_BEAT_BLOCKING` declares, for
//    every kind and by type, whether it stops the week, and `pendingLifeBeat` narrows to the rows
//    that do. Tier 2's two block exactly as they always did; tier-1 small talk does not – it is
//    «soft – answerable, never lost» (who-she-is §5b), so it is answered from a Home card inside a
//    three-week window and the week never waits for it. NOTHING ELSE about rules 2–5 changes for it:
//    the same record, the same re-validation, the same prompt, the same dialog.
//
// 2. ⭐ THE RECORD IS THE QUEUE. A row whose `answer` is null is waiting; several beats in one week
//    are answered one dialog at a time, in `lifeLog` order. There is deliberately no second boolean –
//    a `pending` flag beside the answer is one fact with two sources of truth, and they desync.
//
// 3. ENGINE-SIDE RE-VALIDATION (CLAUDE.md invariant 1). `answerLifeBeat` re-derives the prompt and
//    checks the option id against the list the engine itself offered, exactly as `chooseGift`
//    re-derives the birthday's four. A stale dialog cannot record an answer this beat never made.
//
// 4. ⚠⚠ THE NO-CENTS RULE. An answer is NEVER a purchase: `addEvent` is called with no
//    `amountCents`, so nothing folds into `accrueFinance` or `careerTotals` (ledger.ts gates the
//    accrual on the field being present and non-zero), and there is no price in any of its words.
//    There is no cents value anywhere in this file, which is what stops "just add a small cost"
//    being a one-line edit – it would be a schema change first.
//
// 5. `buildLifeBeatPrompt` ASSEMBLES THE COPY ENGINE-SIDE from the pools below, so the dialog
//    renders what it is handed, verbatim, and owns no sentence of its own – `buildBirthdayPrompt`'s
//    own contract, and the only shape under which her voice can be tested at all.
//
// =================================================================================================
// ⚠⚠ THE FENCE – TEMPERAMENT COLOURS THE WORDING AND NOTHING ELSE (who-she-is §3, verbatim)
// =================================================================================================
//
//   «No fork want. Her college/tour want at the fork stays on its own draw – temperament colours
//    HOW she says it, never WHAT she wants. Otherwise temperament becomes a career script.»
//
// So this file has TWO halves and the wall between them is load-bearing:
//
//   * `drawForkWant` / `forkWantWeights` take `standing`, `spirit` and `bond` and NOTHING ELSE.
//     There is no `Temperament` parameter on either of them, which is the strongest form the fence
//     can take – a temperament term cannot be added to the maths without changing a signature.
//   * `HER_LINE` is indexed BY temperament, and it is the only thing in this file that is.
//
// ⭐⭐⭐ v74 T17 ADDS A SECOND WALL OF THE SAME KIND, ONE LEVEL IN. The `stop` want now has ROOTS
// (`ECONOMY.life.forkStop`) and a DRIVER worded from them – and the driver is spent on wording and
// nothing else: `forkWantWeights` never calls `forkStopDriverOf`, so the same three inputs produce
// the identical three weights whether or not anything ever reads a driver. A reading that explains a
// draw must not be able to become a term in it, which is who-she-is §3's own argument applied to the
// thing §3 was written about.
//
// ⚠ AND SPIRIT IS READ, NEVER WRITTEN. Nothing in this file touches `world.spirit`: the want-draw
// reads it, the parent's answer moves `bond` alone (§4a.2's law – life moves spirit, his words move
// the standing). `applyBondDelta` is the only writer this file calls.
```

### expressedTemperamentOf joins the line in v76 T7 (ruling A)

```ts
// ⚠⚠ `expressedTemperamentOf` JOINS THE LINE IN v76's T7, AND IT DOES NOT REPLACE `temperamentFor`
// OR THE PRIVATE `temperamentOf` BELOW – the architect's RULING A. Three of this file's five
// temperament reads are MECHANICS and move to expression; two are RE-DERIVATIONS of a persisted
// price and must stay on BIRTH. Each of the five carries its own ⚠ comment naming the ruling, and
// `temperamentOf`'s own body is untouched precisely so the split is visible per CALL SITE.
// ⭐ v83 T5 – `seasonWrapsWithNoVacation` JOINS A LINE THAT ALREADY EXISTS AT RUNTIME, so no arrow
// moves: it is the season-boundary zero-vacations predicate ITSELF (the −3/−3 block's one spelling),
// read by the `'no-vacation'` occasion rather than re-derived – the brief's own instruction («the
// same fact spirit.ts's season-boundary block reads»).
```

### The ./loveEpisodes import – a cycle fix, not a preference

```ts
// ⚠ FROM ./loveEpisodes, AND IT IS A CYCLE FIX RATHER THAN A PREFERENCE – the second one this file
// records, on `guardNotEndedForGood`'s own precedent just below. Both selectors were DECLARED
// here by T1; T4 gave `engine/spirit.ts` a reader for `activeEpisode` (the effective baseline), and
// this module imports `../spirit` at runtime, so leaving them here would have closed a value loop.
// They moved verbatim to the leaf and nothing about either of them changed.
// ⭐ v74 T6 ADDED `knownPartner` TO THE SAME IMPORT – «does he KNOW», the second question that leaf
// asks of the list, and the one the delivery fired on.
// ⚠⚠ AND v75 T4 TOOK IT BACK OFF THIS LINE, WHICH IS RECORDED RATHER THAN QUIETLY DELETED (ruling B).
// `knownPartner` answers «is someone there now AND has he been told», and the second half of that is
// exactly what a told-late ending cannot satisfy – it returned null for precisely the episodes the
// scene is about. §6 walks `loveEpisodesOf` itself now. The SELECTOR is untouched and still exported
// from the leaf: `DiaryFacts.partnerKnown` reads it through `world/snapshot.ts`, which is the reading
// it was written for, and nothing about it changed.
// ⭐⭐ v75 T2 ADDS `endEpisode`, THE LEAF'S FIRST WRITER – the ONE line in the engine that sets
// `endedWeek`. §8 below owns the hazard that decides WHETHER it is called; the leaf owns what an
// ending IS, beside the selector that stops reporting her as attached the moment it is written.
```

### The ./constants import – a cycle fix, not a preference

```ts
// ⚠ FROM ./constants, NOT ./endings, AND IT IS A CYCLE FIX RATHER THAN A PREFERENCE – the same swap
// `world/entries.ts` records at its own import. `endings.ts` imports THIS module (it raises the
// fork-opinion row and asks `pendingLifeBeat` before it will answer the fork), so an import back
// into `endings.ts` would close a runtime loop. `constants.ts` is the bottom of the package's graph
// and `endings.ts` re-exports the guard from there anyway, so nothing about the semantics moves.
// ⚠ `knockRunning` IS TAKEN FROM THE LEAF AND NOT FROM `world/knock.ts`, WHICH IS WHERE IT READS AS
// LIVING (that file re-exports it beside `pendingKnock`). A value import of `./knock` from here would
// close a three-module loop – `world/knock.ts -> world/endings.ts -> world/lifeBeat.ts` is live on
// the value-import graph today, measured rather than assumed – and `guardNotEndedForGood` on this
// same line is in the leaf for exactly that reason, with the whole argument at its definition.
```

### Round 42 #15/#24 – the three reads the factual boundary needs

```ts
// ⭐⭐⭐ ROUND 42 #15/#24 – THE THREE READS THE FACTUAL BOUNDARY NEEDS (§8d.5), and all three are
// leaves or near-leaves that do not import back here (checked module by module before they were
// added). `weekMonth` is `shared/dates.ts`' week → real-month mapping and that file imports NOTHING
// at all; `entryStatus` is `world/medical.ts`' own «pure state, ZERO RNG draws» verdict, and it is
// the ONE spelling of «could she still enter this» – a second reading of that rule here would be the
// tierState defect this repo has already paid for four times. `KID_ID` above is what tells her
// matches from the field's in the event feed.
// ⚠ NOT `multiWeek.ts`' `eventIsHers`, NOT `knock.ts`' `ordinaryTrainingWeek`, NOT `coachMarket.ts`:
// every one of those imports this file back, directly or through `endings.ts`. The clauses they
// would have supplied are field reads (`world.entries.includes`, `world.coachId !== null`) and are
// spelled inline for that reason and no other.
```

### C-07 (26.09) – the fourth read the factual boundary needs

```ts
// ⭐ C-07 (the owner's ruling 3(a), 26.09) – THE FOURTH READ §8d.5's FACTUAL BOUNDARY NEEDS, and it
// passes the same test the three above did before it was added. `world/college.ts` imports assets,
// rng, coach, development, ending, calendar, economy, nationalTeam, collegeLeague, match/engine,
// tournament, player, constants, format, collegeOffer, offers, ledger, age and ladder – a 51-module
// value closure that does not contain this file – so the edge lifeBeat -> college is one-way. It is
// also the edge nine other `world/*` modules already take for THIS predicate, counted rather than
// quoted (`birthday.ts`, `endings.ts`, `masseur.ts`, `phaseFinance.ts`, `phaseGrowth.ts`,
// `phaseHerWeek.ts`, `phaseObligations.ts`, `psychologist.ts`, `sparring.ts`), so this is the house
// spelling and not a new one.
```

### v83 T3 – the milestone channel, markSchoolEnd's two surfaces

```ts
// ⭐ v83 (the wedding, wave 7 – T3) – THE MILESTONE CHANNEL, `markSchoolEnd`'s own two surfaces:
// the kept feed line and the scroll's row, both idempotent by key. ⚠ ONE-WAY ARROW, MEASURED THE
// HOUSE WAY before it was believed: `world/milestones.ts` imports the calendar, dates, money, the
// diary barrel, kidLife, ledger, constants, labels, ladder and a TYPE-ONLY `WorldState` – and this
// module is imported only by world.ts, endings.ts, multiWeek.ts, phaseHerWeek.ts, snapshot.ts and
// the corpus's type-only edge, none of which sits in that closure. No runtime loop.
//
// ⚠⚠ THE IMPORT ITSELF LEFT THIS FILE ON 28.09 (A-06 / T6.10) AND THE ARROW IS UNCHANGED. Every caller
// was in a hazard section – §8 the end, §11 the wedding, §14 the pregnancy – so the edge is now
// `world/lifeBeat/ended.ts`, `…/wedding.ts` and `…/pregnancy.ts` → `world/milestones.ts`, three files
// one directory deeper, and `milestones.ts` still imports none of them. The measurement above is kept
// because it is the argument, not the line.
//
// ⚠ AND THE SENTENCE ABOVE ABOUT WHO IMPORTS THIS FILE IS NOW SHORT BY THE PACKAGE: nine kind modules
// under `world/lifeBeat/` import this hub at runtime, by design – a hazard needs the queue, raising and
// answering. None of them is in `milestones.ts`' closure either, so the conclusion holds. ⚠ The reason
// that list was ever believed complete is worth keeping: `git grep -ln "world/lifeBeat'" -- src` names
// ONE file, because a sibling's specifier contains neither the package name nor the path. An importer
// census needs `git grep -n "from '\./lifeBeat'" -- src` too, or a resolver.
```

### v76 T6 – the seat, asked directly

```ts
// ⭐⭐⭐ v76 T6 – THE SEAT, ASKED DIRECTLY, WHICH IS THE MASSEUR'S OWN WAY (`world/medical.ts:62`
// spends `masseurWorksThisWeek` inside `accrueCondition` exactly like this). `psychologistWorkingRung`
// answers three questions in one – not hired · hired for a different year · stood down by a college
// freeze or a booked family week – and the working week IS the billing week (ruling J).
// ⚠ NO PARAMETER AND NO INVERSION, AND IT IS MEASURED RATHER THAN ASSUMED. `accrueSpirit` has to be
// HANDED the fact because `spirit.ts` sits under `world/college.ts` in the value-import graph and the
// import would close a live cycle; this module does not. Walked over the tree's own value imports
// (`import type` and all-`type` named clauses excluded), `world/psychologist.ts` reaches THIS file by
// **ZERO** paths – the same walk that returns seven to `engine/development.ts`, which is why T5's
// site could not ask either. The rule is the college arrow, not «`spirit.ts` is special».
// ⭐⭐⭐ v76 T8 ADDS `psychologistWorksThisWeek` TO THE SAME LINE, AND IT IS A NAME ON AN ARROW THAT
// ALREADY EXISTS rather than a new edge – T6 opened this import one task ago and the walk above is
// the measurement for both. RE-RUN AT T8 rather than inherited (the brief's own ⚠), on the tree's own
// value imports with `import type` and all-`type` named clauses excluded and `export … from` counted:
// `world/psychologist.ts` reaches THIS file by **ZERO** paths, `engine/development.ts` by SEVEN and
// `engine/spirit.ts` by TWO – the same three numbers T4b and T6 measured, so nothing about the graph
// has moved under them. ⚠ THE TWO PREDICATES ANSWER DIFFERENT QUESTIONS and both are wanted here:
// `psychologistWorkingRung(world, 'listen')` is «is he working THIS focus, and at what rung», which is
// a focus pass's question; `psychologistWorksThisWeek` is «is anybody being paid to be there at all»,
// which is the SEAT's, and the counsel fork is the seat's rather than any focus's.
```

### v77 T6 – the spotlight's one gate and the stock behind it

```ts
// ⭐⭐⭐ v77 T6 – THE SPOTLIGHT'S ONE GATE AND THE STOCK BEHIND IT, both READ and neither written
// (the wave's §8: this wave only reads `fameAt`, and `ECONOMY.fame` is fame-presence's ground).
// §9 below is the whole of what uses them: `newsStandingOf` (D1, 14.09) decides whether the world is looking at all
// and `fameAt` is ruling I's third factor in the hazard's product.
// ⚠ NO CYCLE, AND IT IS MEASURED RATHER THAN ASSUMED – the walk `psychologistWorkingRung`'s own note
// above describes, re-run at T6 over the tree's value imports with `import type` and all-`type` named
// clauses excluded: `world/spotlight.ts` reaches THIS file by **ZERO** paths (11 modules walked) and
// `world/fame.ts` by **ZERO** (9 walked). Both are leaves of the same kind `world/loveEpisodes.ts`
// is – they read the world and write nothing – which is what makes the arrow one-directional by
// construction rather than by luck.
// ⚠ AND `fameAt` LEFT WITH §9 ON 28.09 (A-06 / T6.8): the import above now lives in
// `world/lifeBeat/leak.ts`, which is the only thing that ever read it. The walk this note records is
// unchanged by the move – `world/fame.ts` reaches the kind module by the same zero paths it reached
// this file by, and the module takes `WorldState` as `import type` like every other `world/*` part.
// ⭐⭐⭐ v77 T7 TAKES A SECOND NAME OFF THE SAME LEAF, AND FOR THE «ASK THE ONE COPY» REASON: the
// booth's licence has to know what a BIG STAGE is, and `atOrAboveStageBar` is already the answer
// `'stage'` and `'publicLoss'` are built on. A second spelling here would drift from
// `ECONOMY.spotlight.stageTierMin` the first time the bar moved – see that function's own note. The
// walk above is unchanged by it: still zero paths back from `world/spotlight.ts` to this file.
// ⚠ AND THE WHOLE `./spotlight` IMPORT LEFT WITH §9 AND §10 ON 28.09 (A-06 / T6.8). `newsStandingOf`
// went to `world/lifeBeat/leak.ts` and to `world/lifeBeat/booth.ts`; `atOrAboveStageBar` and
// `boothPrivateLifeAt` went to the booth alone. Both chronicles above are carried unedited because
// both walks still hold, one door along: `world/spotlight.ts` reaches the two kind modules by the
// same zero paths it reached this file by, and neither module imports the hub back.
// ⭐⭐ THE PRESENCE AXIS' TWO IMPORTS (11.09, the вычитка fold) – and both of them are «ask the one
// copy» rather than «re-type the rule». `awayVoice` is R2-18 / ARCH-07's single spelling of «she
// lives elsewhere and the parent HEARS about the week»; `diaryLifeStageFor` is the single spelling
// of which stage a girl of this age on this week is in. Both leaves are type-and-calendar only (no
// world state, no RNG, no import back into `world/`), so neither closes a cycle.
```

### `lifeLogOf` – The record is the queue

```ts
/** ⭐ THE RECORD IS THE QUEUE. A row whose `answer` is null is waiting; several beats in one week
 *  are answered one dialog at a time, in `lifeLog` order. There is deliberately no second boolean –
 *  a `pending` flag beside the answer is one fact with two sources of truth, and they desync.
 *
 *  ⚠ ABSENT `lifeLog` READS AS AN EMPTY LIFE, NOT AS AN ERROR. v73 makes the field required and
 *  back-fills `[]`, so no save reaching this line can be missing it – the `?? []` is the same
 *  courtesy `birthdayHistory` extends to probe worlds hand-built in tests, which predate the field
 *  and have no business crashing a read. */
```

### `LIFE_BEAT_BLOCKING` – v74 T15 – which kinds stop the week, declared per kind

```ts
/** ⭐⭐⭐ v74 T15 – WHICH KINDS STOP THE WEEK, DECLARED PER KIND AND **TOTAL BY TYPE**
 *  (who-she-is §5b's «SOFT BLOCK CONCRETIZED» amendment, 11.09: «the beat-kind registry declares
 *  `blocking` per kind – total by type, so every future kind must choose»).
 *
 *  ⚠⚠ A `Record<LifeBeatKind, boolean>` AND NEVER A LIST OF THE BLOCKING ONES, which is the same
 *  argument `LIFE_BEAT_OPTIONS`, `ANSWER_EVENT` and `HER_LINE` all make in this file: a list makes
 *  silence the default, and the next kind ships soft by FORGETTING. The total record makes a missing
 *  kind a COMPILE error, so «does this stop the week» is a sentence somebody had to type.
 *
 *  ⚠ AND IT IS A PROPERTY OF THE TIER, which is why it belongs beside the kinds rather than at the
 *  two stop sites. §5b prices tier 2 «blocks the week: yes» and tier 1 «soft – answerable, never
 *  lost»: the fork's opinion and the news that someone exists are both the week she said something
 *  the parent must answer before time may move (rule 1 at the head of this file). `'small-talk'` is
 *  FALSE – it is texture, it is answered from a Home card inside a three-week window, and the week
 *  never waits for it. */
```

### `LIFE_BEAT_BLOCKING` – v88 (the parting, wave 12 – T1) – true

```ts
  // ⭐⭐⭐ v88 (the parting, wave 12 – T1) – TRUE, AND IT IS `'ended'`'s ONE WORD INHERITED RATHER
  // THAN A SECOND DECISION. This is the same beat one rung up: §5b priced «the news that someone
  // exists» as a week the parent must answer before time may move, the week it is over is that beat
  // from the other end, and the week a MARRIAGE is over is that one again with a wedding behind it.
  // A career that could tick past it would answer her by walking away.
  // ⚠ NO REGISTER CLAUSE HERE, unlike `'ended'`'s: this kind has one register. A latched row always
  // holds the `'met'` receipt (the latch needs an answered `'engaged'` beat, which needs the
  // delivered episode), so there is no told-late divorce for a second sentence to be about.
```

### `LIFE_BEAT_BLOCKING` – v85 (the return, wave 8 – T6) – true

```ts
  // ⭐⭐⭐ v85 (the return, wave 8 – T6) – TRUE, AND IT IS THE ONE WORD THE WHOLE RAMP RUNS ON. The
  // week she comes back is the week the calendar re-opens after 51 weeks of refusals, and the desk
  // needs an answer before a single entry can be booked – so a career that could tick past this card
  // would spend its first weeks back with no plan at all and the beat would price nothing. ⚠ IT IS
  // ALSO THE ONLY BEAT IN THIS TABLE THAT IS NOT ABOUT HER LIFE: §4a's law is that SHE decides and the
  // parent REACTS, and it holds – she has already decided, and T5's coin is where. What blocks here is
  // the SCHEDULING, which is the parent's job (the college fork's mechanical questions are the
  // precedent), so blocking is tier 2's price asked for the one question this layer really does put to
  // him.
```

### `pendingLifeBeat` – The beat waiting to be answered, or null

```ts
/** The beat waiting to be answered, or null. The FIRST unanswered row in `lifeLog` order – so a week
 *  that raised two of them asks about them one at a time and never loses the second.
 *
 *  ⭐⭐ v74 T15 – AND «WAITING» NOW MEANS **BLOCKING** AND UNANSWERED. This predicate is what both
 *  halves of the block contract ask (rule 1), so narrowing it here is what makes a soft row stop
 *  being a stop: `advanceRefusal` and the `'life'` StopReason read this function and nothing else,
 *  and `LIFE_BEAT_BLOCKING` is the one place the answer lives. A soft row and a blocking beat
 *  coexist untouched – the soft one is found by `liveSoftBeat` below, on its own window.
 *
 *  ⚠⚠ AND THE NARROWING IS ALSO WHAT KEEPS AN EXPIRED ROW HARMLESS. A soft row that was never
 *  answered keeps `answer: null` FOREVER (that is «never lost = the ROW, not the chance»), so an
 *  un-narrowed predicate would have parked every career behind a conversation whose moment passed
 *  three weeks ago and which nothing on any screen can answer. */
```

### `liveSoftBeat` – v74 T15 – the soft row that is still answerable

```ts
/** ⭐⭐⭐ v74 T15 – THE SOFT ROW THAT IS STILL ANSWERABLE, or null. The Home card's whole existence
 *  condition, and the second half of what the queue means now.
 *
 *  ⚠⚠ THE WINDOW IS DERIVED AND NEVER STORED (`ECONOMY.life.smallTalkTtlWeeks`, 3 = the raise week
 *  and the two after it). `week − row.week` is the whole of the arithmetic – there is no `expired`
 *  flag, no TTL field and no new persisted state anywhere in this step, which is `activeEpisode`'s
 *  own discipline and the queue's own reason for having no `pending` boolean.
 *
 *  ⚠ `>= 0` REFUSES A ROW FROM THE FUTURE rather than reading it as live. No state the sim produces
 *  can hold one (`raiseLifeBeat` stamps `world.week`), so this is for the probe worlds hand-built in
 *  tests and benches – and a negative age answering «live» would be a window nobody could close.
 *
 *  ⚠ THE **FIRST** LIVE ONE, IN LOG ORDER, which is `pendingLifeBeat`'s own rule: the raise gate
 *  allows only one live soft row at a time, so on every state the sim produces there is at most one –
 *  and where a hand-built world holds two, the older is the one that is about to expire and is
 *  therefore the one to ask about first. */
```

### `stopRootsOf` – v74 T17 – the two roots of a stop, read once

```ts
/** ⭐⭐⭐ v74 T17 – THE TWO ROOTS OF A `stop`, READ ONCE. How far she is BELOW spirit's baseline and
 *  how far the home is BELOW bond's start, each as a 0..1 share.
 *
 *  ⚠⚠ ONE READING, TWO CONSUMERS, AND THAT IS THE WHOLE REASON THIS IS A FUNCTION. The weight
 *  (`forkWantWeights`) and the wording (`forkStopDriverOf`) must be talking about the SAME girl: two
 *  copies of «how worn is she» would be two sources of truth for one fact, and rule 3 at the head of
 *  this file exists because those disagree the first time somebody edits one of them. `close` stays
 *  inline in the weights because nothing else reads it.
 *
 *  ⚠ `strained` IS THE MIRROR OF `close`, measured off `bond.start` in the other direction, so 70
 *  reads as neutral from both sides and a neutral home leans nothing either way. */
```

### `forkWantWeights` – what she wants, as three weights

```ts
/** ⭐⭐ WHAT SHE WANTS, AS THREE WEIGHTS – the whole of the ruling of 09.09, and the whole of the
 *  fence with it.
 *
 *  ⚠⚠ THREE INPUTS AND THERE IS NO FOURTH. `standing` is where she got to on the ladder (0..1 – see
 *  `forkStandingOf`), `spirit` is how she IS this week and `bond` is what the parent has built with
 *  her. Temperament is not a parameter of this function and must never become one: who-she-is §3's
 *  fence gives it the WORDING and nothing else, and «otherwise temperament becomes a career script».
 *  The wall is a signature rather than a comment precisely so that it cannot be crossed quietly.
 *
 *  The three leans, each with its own reason:
 *
 *    * HER STANDING pulls `tour` up and `college` down, and both halves are one fact read twice: a
 *      girl who climbed wants the thing she climbed toward, and a girl who did not is the one for
 *      whom a place at a university is worth having. Nothing here pulls `stop`, because failing to
 *      climb is not the same as being finished.
 *    * BEING WORN DOWN pulls `stop` up – «a worn-down girl leans `stop`» (ruled 09.09). Measured off
 *      the distance BELOW spirit's baseline, so a girl at or above 70 has no such lean at all.
 *    * A CLOSE HOME pulls `tour` up – «a close one dares more». Measured off the distance ABOVE
 *      bond's start, for the same reason: 70 is the neutral reading and neutral must mean neutral.
 *    * ⭐⭐⭐ v74 T17 – AND A STRAINED HOME PULLS `stop` UP, which is `close` READ THE OTHER WAY: the
 *      distance BELOW bond's start, mirror for mirror, so one number cannot mean «neutral» on one
 *      side of 70 and «a little cold» on the other.
 *
 *  ⚠⚠ THE `stop` WEIGHT IS NO LONGER A LEAN, AND THIS IS THE OWNER'S RULING OF 11.09 MADE ARITHMETIC.
 *  It read `lean(worn)`, which bottoms out at 1.0 like every other lean – so the FLOOR of P(stop) was
 *  ~22% at top standing in a close home and ~24% at zero standing, whatever the girl. He met it in
 *  play at eighteen («моей 18, я ещё игры не видел») on a healthy girl in a close home, and a quarter
 *  of all players would have met it at the biggest moment of the career with no root they could read.
 *  It is now `floor + gainWorn × worn + gainStrained × strained` (`ECONOMY.life.forkStop`), so the
 *  want has ROOTS: unsupported it reads ~3–4% at every standing, a post-shock girl in a strained home
 *  reads it as a real lean, and a drained girl in a cold home reads it dominant.
 *
 *  ⚠⚠ AND THE OLD «EVERY WEIGHT IS >= 1» CLAIM IS REPLACED BY AN HONEST ONE: **the floor is ε > 0 and
 *  never zero.** `college` and `tour` are untouched and still sit in [1.0, 2.56]; `stop` can go as low
 *  as `forkStop.floor` and no lower. Nothing may ever drive a want to zero – any girl MAY still want
 *  any of the three at any standing, in any mood, in any home, and the Barty tail (whole, winning,
 *  finished) stays a feature. What changed is its PRICE: it is an eighteen-year-old's rarity now
 *  instead of a coin-flip's neighbour.
 *
 *  ⚠ BOTH ROOTS ARE CLAMPED TO 0..1, which `lean` used to do for `worn` on its way past. A spirit
 *  above baseline is not «negative wear» that could refund the floor, and a poked save below
 *  `spirit.min` is not a girl who wants to stop twice over. */
```

### `ForkStopDriver` – v74 T17 – which root her stop is worded from

```ts
/** ⭐⭐⭐ v74 T17 – WHICH ROOT HER `stop` IS WORDED FROM, and it is spent on WORDING AND NOTHING ELSE.
 *
 *  ⚠⚠ THE DRIVER NEVER RE-WEIGHTS THE DRAW IT EXPLAINS. `forkWantWeights` above does not call this
 *  function and does not read `forkStopDriverFrom`; the same (standing, spirit, bond) produces the
 *  identical three weights whether or not anything ever asks for a driver. That is the fence of §3
 *  applied one level in: a reading that colours the words must not be able to become a term in the
 *  maths, or «readable roots» becomes a fourth input by the back door.
 *
 *  ⚠ WORN WINS A TIE ON PURPOSE. A girl who is both worn down and far from home is stopping because
 *  of the season first – the tiredness is what she would be putting down, and the distance is what
 *  made it lonely. The order is the wording's, not a claim about the arithmetic, where both terms are
 *  simply added.
 *
 *  ⚠ THE THRESHOLD IS **STRICTLY GREATER**, so a girl at exactly the line is still `'own'`: the
 *  register that claims a cause is the one that has to earn it. */
```

### `forkStandingOf` – her ladder standing as one 0..1 number

```ts
/** ⭐ HER LADDER STANDING AS ONE 0..1 NUMBER – how high she actually got, normalised.
 *
 *  ⚠ IT TAKES THE SCORE RATHER THAN THE WORLD, which keeps this module free of `world/college.ts`
 *  (a heavy leaf that pulls the match engine in) and, more importantly, keeps the want-draw a pure
 *  function of primitives – `spanWorthOffering`'s own doctrine in world/multiWeek.ts: «the predicate
 *  takes PRIMITIVES ... they agree BY CONSTRUCTION rather than by inspection».
 *
 *  ⚠ AND THE SCORE IT EXPECTS IS `juniorRecordScore`, WHICH IS THE FORK'S OWN MEASURE. The same
 *  number the college offer she is looking at was written from (`measureCollegeOffer`, one line
 *  above the call site in `resolveEndings`), so her want and her options are read off one reading of
 *  one career rather than two readings that could disagree. `COLLEGE_OFFER.maxJuniorScore` is the
 *  ceiling that makes it a share; the clamp is for a poked save, not for the engine. */
```

### `lifeBeat.ts` §3 – the beat's copy

```ts
// =================================================================================================
// 3. THE BEAT'S COPY – ⚠⚠ EVERY WORD BELOW IS A DRAFT FOR THE OWNER (CLAUDE.md invariant 4)
// =================================================================================================
//
// Written against `docs/specs/voice-bibles-2026-09.md` §A (the four bibles) and §B (the flat pool),
// and every line obeys the TWO SHAPE RULES the week-note pins already enforce for the whole corpus:
//
//   1. AT MOST ONE QUOTED SPAN PER LINE – a greedy strip over two spans swallows the narration
//      between them, so a two-span line can hide a first-person narrator from the check.
//   2. THE NARRATION OUTSIDE THE QUOTATION CONTAINS `she` – a paired strip cannot tell HER quotation
//      from anybody else's, so the `she` is what names the speaker as her.
//
// ⭐ THE COMPOSITION RULE (who-she-is §5b), and why this is 27 lines rather than 4x5x4:
//
//   temperament owns the SHAPE          – four voices, one line each per want
//   spirit owns the REGISTER            – collapsed to `low` vs not-low, which is §5b's own
//                                         «most moments only split low vs not-low»
//   bond owns the CHANNEL               – `close`/`steady` let her speak; `strained`/`cold` collapse
//                                         the four voices into ONE shared flat pool, because losing
//                                         her voice is the point
//
// 3 wants x 4 temperaments x 2 registers = 24 of her own, + 12 listen-continuations (10.09),
// + 3 flat, + 3 headings.
//
// =================================================================================================
// ⭐⭐⭐ THE PRESENCE LAW – THE FOURTH AXIS, AND IT IS THE ONE THE SCENE IS MADE OF
// (`docs/specs/voice-bibles-2026-09.md`, «The presence law (MUST; 11.09)», folded 11.09 after the
//  owner's own вычитка of the away frames)
// =================================================================================================
//
// «At the two roof stages cohabitation licenses household observation. At `college` and
//  `independent` the stage only restricts the available frames: every away line carries its own
//  delivery frame – a call, a text, a forwarded plan, a named visit – because distance makes
//  observation something the line has to earn, not assume.»
//
// ⚠⚠ THE DEFECT IT CLOSES IS A LICENCE DEFECT, NOT A TASTE ONE. «She was talking before her bag
// was down» and «She put the kettle on and mentioned it while it filled» are the parent watching
// her cross a room – a claim a parent four hundred miles away cannot make. Wave 3 shipped both
// pools with one column, so a twenty-six-year-old in her own flat came through the door of a house
// she moved out of six years earlier.
//
// ⚠ IT IS DERIVED FROM `DiaryLifeStage` AND FROM NOTHING ELSE, and it asks the question through
// `awayVoice` rather than re-typing it. R2-18 / ARCH-07's whole finding was that this one rule had
// been written out three times and the copies would part the day the rule gained a stage; there is
// ONE copy, it lives in `diary/words.ts`, and this pool now asks it too.
```

### `PresenceCell` – one cell of a voiced pool, in both presence registers

```ts
/** One cell of a voiced pool, in both presence registers. ⚠⚠ `away` IS OPTIONAL AND THE `?` IS A
 *  RULING RATHER THAN A CONVENIENCE: the owner wrote 19 away frames for 20 cells and named the
 *  twentieth himself – `sunny`/`joy`'s «She said it before anyone had asked how the week went.» is
 *  channel-neutral and stays SHARED, so that one cell reads its roof line at both distances. The
 *  totality this file otherwise insists on is asserted by a PIN instead of by the type
 *  (`tests/wave3-presence.test.ts` §C), because the pin can say «exactly one cell falls back» and a
 *  required field can only say «none does».
 *
 *  ⚠ AND THE QUOTED SPAN IS SHARED BY LAW, not by habit (the owner, 11.09: «цитаты уже с
 *  контракциями по P2, они общие с домашними рамками»). What presence changes is the FRAME – the
 *  scene the parent is standing in – never the sentence she says inside the quotation marks. §D of
 *  the same pin file extracts both spans and asserts they are identical, which is what makes that a
 *  property instead of a convention the next editor never hears about. */
// ⚠ `export` SINCE 28.09 (A-06 / T6.8) AND FOR ONE REASON ONLY: the per-kind copy modules under
// `world/lifeBeat/` type their own `PresenceCell` pools, and they take it as `import type`, which
// TypeScript erases – so nothing about the runtime graph changes and `tests/import-cycles.test.ts` does
// not count the arrow. It is NOT on the barrel: `world.ts` names its imports one by one.
```

### `HER_LINE` – Her line, by voice, by want, by register – 24 drafts

```ts
/** ⭐⭐ HER LINE, BY VOICE, BY WANT, BY REGISTER – 24 drafts.
 *
 *  ⚠ THIS TABLE IS THE ONLY THING IN THIS FILE INDEXED BY TEMPERAMENT, and that is the fence made
 *  structural: the wording knows who she is, the want does not.
 *
 *  ⚠ THE BIBLE EACH VOICE IS WRITTEN TO, in one line each, so a later writer does not have to
 *  reconstruct it: `sunny` says the whole thing evenly and will name a feeling plainly; `fiery`
 *  gives the verdict first, at speed, in absolutes, and has not had the second thought yet; `quiet`
 *  says the practical surface and leaves herself out, so the parent reads the week off what she
 *  talked about INSTEAD; `deep` says one true thing, late, stripped of its size, in full stops.
 *
 *  ⚠ AND THE `quiet` ROWS ARE THE LICENSED EXCEPTION THE BIBLE ITSELF NAMES. §A3: «A `quiet` line
 *  that states a feeling directly is a broken line ... A tier-2 life beat in waves 2-4 may earn the
 *  exception – a feeling from her would be worth more than a paragraph from anyone else, precisely
 *  because tier 0 spent none.» This is that tier-2 beat, it fires once in a career, and even here
 *  she answers with a fact and a schedule wherever a fact will carry it. */
// ⭐⭐ RE-CUT 10.09 TO THE OWNER'S EDITORIAL REVIEW – his вычитка of this pool, applied as ruled
// («давай осмысленно теперь применим и интегрируем»). The rules the re-cut follows, from the review:
// temperament shows in WHAT SHE NOTICES, WHAT SHE OMITS AND HOW SHE STRUCTURES A THOUGHT – never in
// a narrator's adverb; the narration outside her quotation carries FACTS AND OBJECTS the parent saw
// (a prospectus, a blanket, unsigned forms), never an interpretation («which is how she says it»,
// «at volume», «like a result» – all deleted); a `low` week DISTURBS her normal voice rather than
// swapping in a stock sad one. Lines the review's own craft already matched are kept byte-identical.
```

### `HER_STOP_LINE` – v74 T17 – her stop line, by voice, by the root of the want

```ts
/** ⭐⭐⭐ v74 T17 – HER `stop` LINE, BY VOICE, BY THE ROOT THE WANT ACTUALLY HAS – 8 drafts, and the
 *  `'own'` column is the EIGHT LINES ABOVE, untouched.
 *
 *  ⚠⚠ WHY THIS POOL EXISTS AT ALL. Until T17 `stop` had a floor of 1.0 like every other want, so a
 *  quarter of all players met «I want to stop» at the biggest moment of the career with no root they
 *  could read – the owner met it himself, at eighteen, on a healthy girl in a close home. T17 prices
 *  the tail (`ECONOMY.life.forkStop`) AND gives it words: «always with readable roots» is a copy
 *  requirement as much as an arithmetic one, and this is the copy half.
 *
 *  ⚠⚠ THE DRIVER IS WORDING AND NEVER WEIGHT. `forkStopDriverOf` (§2) reads the same two roots the
 *  weight is built from and decides nothing about the draw; the fence of §3 applied one level in.
 *
 *  ⚠⚠ AND THE REGISTER SPLIT IS ABSENT HERE **BY DERIVATION, NOT BY ECONOMY** – this is the half
 *  worth reading twice, because it looks like a shortcut and is not. `worn > 0.15` means
 *  `spirit < 59.5`, and the `low` register is `spirit < 67.5` (`ECONOMY.spirit.mood.dimmedBelow`):
 *  the `worn` column is a STRICT SUBSET of the low register, so a second «low» variant of a worn
 *  line would be a variant of a line that can only ever fire low. `'own'` is the column that spans
 *  both – she can be sure in a bright week and sure in a flat one – and `'own'` is exactly where the
 *  shipped `up`/`low` pair stayed. `strained` fires with her spirit at or near baseline by
 *  construction (`worn <= 0.15`), so its line is written register-neutral and claims no week.
 *
 *  ⚠ NO PRESENCE AXIS, AND IT IS THE SAME SCOPE STATEMENT `HER_LINE` MAKES. The fork opens on the
 *  week school ends, which is a roof stage by construction, so there is no away frame to write. 12
 *  readings (4 voices x 3 drivers), all of them roof.
 *
 *  ⚠ A `strained` LINE IS ONLY REACHABLE IN HER OWN VOICE INSIDE A NARROW WINDOW, and the design
 *  answer is the counsel beat rather than a wider pool: `speaksInHerOwnVoice` is false below bond 55,
 *  and the `strained` driver starts below bond 59.5, so she says one of these only in the bottom of
 *  the `steady` band. Below that the flat pool speaks – and the ROOT still reaches the player, from
 *  the coach, because `'fork-counsel'` is keyed on the same driver at every band. A cold home hears
 *  why from the one person still talking, which is the layer's whole subject.
 *
 *  ⚠ THE BIBLE EACH VOICE IS WRITTEN TO is `HER_LINE`'s own line above, unchanged, plus the
 *  §Contractions law the owner's вычитка applied to the wave-3 pools: `sunny` and `fiery` contract
 *  throughout, `quiet` mostly, `deep` LIGHTLY – lightly and not never, which is the correction of
 *  11.09. ⚠ The shipped `'own'` lines above are uncontracted (wave 2, pre-вычитка) and are NOT
 *  touched here: invariant 4 makes that the owner's call, and it is flagged in the вычитка package
 *  rather than fixed by an agent. */
```

### `FLAT_LINE` – the flat pool – what a strained or cold home sounds like

```ts
/** ⭐⭐ THE FLAT POOL – what a `strained` or `cold` home sounds like on the biggest question of her
 *  life (voice bibles §B). One to four words, the parent's own sentence carrying the rest, and no
 *  feature of any of the four voices surviving.
 *
 *  ⚠ SHE ANSWERS; SHE NEVER OFFERS – so every frame here contains the question the parent had to
 *  ask. That is the whole loss the pool exists to make audible: on the one week she should have come
 *  to him, he had to go and ask, and she said the word and nothing else.
 *
 *  ⚠ AND SHE IS NEVER RUDE. Hostility would be a scene, and a scene is a relationship. */
```

### `lifeBeat.ts` §3f – 'fork-psy' – the copy moved

```ts
// =================================================================================================
// 3f. `'fork-psy'` – THE COPY MOVED TO `world/lifeBeat/forkPsyCopy.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// A pure leaf: only the dispatcher hub below read it, so it left whole – banner, the 09.09 ruling and
// all the chronicles included – and the hub imports the three it reads back. ⚠ The OTHER section this
// file numbered «3f» («learning to listen», `drawListenHeard` / `listenHeardNow`) is NOT this one and
// stays here: it reads §3b's and §3e's pools and is read by §6 and §8, so it is not a leaf.
```

### `lifeBeat.ts` §3b – 'met' – the copy moved

```ts
// =================================================================================================
// 3b. `'met'` – THE COPY MOVED TO `world/lifeBeat/metCopy.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// A pure leaf, and the bond band's register predicate went with the pools it picks between – cutting by
// KIND rather than by shape is what puts `metRegisterOf` beside the four things it chooses from. It
// left whole, banner, the 11.09 architect ruling and all the chronicles included; the hub imports the
// six names it reads back (the dispatcher, «learning to listen»'s `metHeadingFor`, §6's `metKeptRow`
// and `MET_EVENT`).
```

### `lifeBeat.ts` §3c – 'small-talk' – the copy moved

```ts
// =================================================================================================
// 3c. `'small-talk'` – THE COPY MOVED TO `world/lifeBeat/smallTalkCopy.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// A pure leaf – the dispatcher below and §7's roll are its only readers – so it left whole, banner,
// who-she-is §5b's quotation and every chronicle included, with the two subject rosters and their two
// types. The hub imports the seven it uses and re-exports the five `world.ts` names under their
// historical spelling (the types through `export type`, which P4's field notes make mandatory).
//
// ⚠⚠ §3c-2, THE SITUATION LAYER, STAYS HERE, and it is the one place in T6.8 where a COPY section
// could not move: `recentFrames` and `withoutRecentSituations` read §1's queue (`lifeLogOf`), and the
// queue stays with the hub because 21 things reference it – so a §3c-2 module would import the hub and
// be imported by it at once. A-06's proposal has the fix for a later wave (move the queue out first);
// it is not this task's to take. §7, the small-talk HAZARD, stays for the ordinary reason.
```

### `lifeBeat.ts` §3c-2 – round 42 #15/#24 – the situation, and the beat becomes an exchange

```ts
// =================================================================================================
// 3c-2. ⭐⭐⭐ ROUND 42 #15/#24 – THE SITUATION, AND THE BEAT BECOMES AN EXCHANGE
// =================================================================================================
//
// `docs/specs/the-small-talk-exchange-2026-09.md`, and the copy in this section is HIS – §8a–§8c are
// eight exchanges he read line by line and revised on 15.09. What is drafted rather than his is
// flagged where it stands, and only there.
//
// THE TWO COMPLAINTS THIS ANSWERS, in his own words:
//
//   #15 «выбрал пункт, чтобы она сказала больше, а попап закрылся… Сейчас выглядит как "сказала А,
//        но никогда не сказала Б".»
//   #24 «Один и тот же диалог из раза в раз "I want to ask you something"… да, надо больше
//        разнообразия, это же наша главная фича.»
//
// THE SHAPE (spec §1): she opens with a CONCRETE subject; the parent invites more, responds, or
// gives space; she answers. Invite earns a CONTINUATION, respond and give-space earn a REACTION. The
// economy does not move – bond-neutral, non-blocking, missable, four a season – and none of the
// three is marked correct.
//
// ⚠⚠ §8d's FIVE FINDINGS, WHICH ARE DESIGN AND OUTRANK THE LINE EDITS. Each one is load-bearing here
// and each one is pinned:
//
//  1. A `respond` BRANCH MUST NAME THE PARENT'S ACTUAL OPINION. «Say how we see it» promises a view
//     and then she answers an opinion the player never heard. So the `respond` label is per
//     SITUATION, not per subject – «Say the travelling matters too», «Say a good coach explains what
//     they're changing», «Ask whether she's been eating properly». More copy is the price and it is
//     the point: a promise of content the game has not written is the defect this item exists to
//     remove. (⚠ ONE EXCEPTION STANDS AND IS REPORTED RATHER THAN EDITED – see `line-call`.)
//  2. A `story` IS TWO BEATS. The incident is a SHARED continuation every route hears; the branch is
//     the aftermath; EVERY route finishes the story. `shared` below is that paragraph, and it is
//     prepended to all three replies in `smallTalkFollowUps` – so a branch that left the player
//     waiting for B cannot be assembled.
//  3. THE VOICE TEST IS HIS, AND THE OBVIOUS ONE IS WRONG. «The same subject in two voices shares no
//     sentence» proves nothing: different SITUATIONS produce different words by themselves. His
//     test: **same event, same facts, same age, same parental choice → four different ways of
//     noticing, disclosing and responding.** `court-four` is written in all four voices for exactly
//     that test (`tests/round42-small-talk-exchange.test.ts` §E). ⭐ And «no shared phrase» is NOT a
//     target – real people all say «Okay».
//  4. UNGRADED ≠ EMOTIONALLY INTERCHANGEABLE. No bond, no score, no recommended branch – but the
//     three branches may honestly produce relief, mild resistance, amusement, uncertainty, a
//     boundary or a changed thought. What is forbidden is scoring, a recommendation cue and a
//     consistently superior branch, not difference in feel.
//  5. ⚠⚠ THE FACTUAL BOUNDARY, AND IT IS A LAW. Invented DOMESTIC detail is hers and must stay
//     stable across an exchange (the flat, the coffee, the dad who put the lid back on). A
//     COMPETITIVE claim – entering a tournament, a decision deadline, beating an opponent, four
//     previous losses – NEEDS A REAL FACT IN THE SAVE BEHIND IT. She may interpret an outcome
//     however she likes; she may not invent one. `fact` below is that line, and `SMALL_TALK_FACT`
//     is where each claim is checked against the career.
//
// ⚠ TEXTURE ONLY, THE FOG LAW UNCHANGED (spec §11): nothing here writes a consequential fact. A
// practice that felt easy is a mood, never a training gain; a name mentioned is a name, never a
// relationship the rest of the engine has to honour.
```

### `SMALL_TALK_STANCES` – the three stances (spec §3)

```ts
/** ⭐⭐ THE THREE STANCES (spec §3), AND THEY ARE ALWAYS THE SAME THREE SHAPES. Never one of them is
 *  the right one. Named for what the parent DOES, because the words they wear are the situation's.
 *
 *  ⚠⚠ AND EACH ONE KEEPS ITS SHIPPED OPTION ID (`more` / `view` / `easy`, `LIFE_BEAT_OPTIONS`
 *  below), which is a save-compat requirement rather than thrift: an option id is PERSISTED in
 *  `LifeBeatRecord.answer`, so a new vocabulary on these three would make every answered small-talk
 *  row in every shipped save unreadable and would owe a migration. The words on the buttons change;
 *  the ids the world records do not. */
```

### `kidMatchRows` – Her competitive matches as the feed retains them

```ts
/** Her competitive matches as the feed retains them, oldest first: week, opponent, and whether she
 *  won. ⚠ FRIENDLIES EXCLUDED (`!e.friendly`) – a practice set is not a result she may claim.
 *
 *  ⚠⚠ AND IT IS A ROLLING WINDOW, NOT A CAREER. `world.events` is capped at `EVENTS_CAP` and
 *  `pruneEvents` sacrifices her oldest match rows last but does sacrifice them – roughly the last
 *  20–40 competitive matches on a busy career. That makes every count below a LOWER bound, which is
 *  the safe direction for `beat-her-conqueror`: a gate that can only under-count can only refuse a
 *  situation it should have offered, never offer one it should have refused. `coachMarket.ts`'
 *  `matchesEverPlayed` records the same caveat for the same feed. */
```

### `nextWeekIsClear` – §8d.5's fifth read

```ts
/** ⭐ §8d.5's FIFTH READ (his 17.09: «пиши гейт по R17, давай сделаем»). A clear week ahead is a
 *  CALENDAR fact and no other claim carried one: `march-entry-open` asks whether a door is still
 *  open, this asks whether the week behind it is empty.
 *
 *  ⚠⚠ TWO CLAUSES AND NOT ONE, AND THE SECOND IS THE HONEST HALF. The proposed gate was «the season
 *  holds no event she is entered in next week», and that sentence is TRUE ALL WINTER – in the
 *  off-season and inside the college freeze every week is empty, so «I've got a completely empty week
 *  and I don't know what to do with myself» would stop being a worry and become a description of
 *  February. The row's own kernel is «she has not decided whether that is rest or an ABSENCE», and an
 *  absence needs something to be absent FROM. So the week must also HOLD an event she could have
 *  been at; a calendar with nothing in it is not a gap in her season.
 *
 *  ⚠ `enteredScheduledThisWeek` (world/injury.ts) one week forward, on the same two fields, negated.
 *  Pure and zero-draw like its four siblings, and asked BEFORE the situation is drawn. */
```

### `SMALL_TALK_FACT` – §8d.5's five reads, and every one of them is pure

```ts
/** ⭐⭐⭐ §8d.5's FIVE READS, AND EVERY ONE OF THEM IS PURE AND ZERO-DRAW. They are asked BEFORE the
 *  situation is drawn (`reachableSituations`), never after, so a false fact removes the situation
 *  from the pool instead of being papered over in the copy.
 *
 *  ⚠ `march-entry-open` CARRIES THE DEADLINE CLAUSE HIS REVIEW ADDED IN THE GATE, not in the option
 *  list. «Say there's time to decide – *only when the deadline actually permits it*» (§8c). Written
 *  as a conditional OPTION it would have made the card sometimes show two stances and sometimes
 *  three; written as part of the gate, the situation simply does not arise on a week where that
 *  sentence would be false, and all three stances stay honest by construction.
 *  ⚠ `world.week < e.deadlineWeek` AND NOT `<=`: the deadline is the END of that week, so equality
 *  means «decide now», which is precisely when «there's time to decide» stops being true.
 *
 *  ⚠⚠ AND IT CARRIES `!inCollege(world)` SINCE C-07 (the owner's ruling 3(a), 26.09). The three
 *  clauses above ask the CALENDAR whether a March door is open; none of them asks the freeze, and
 *  neither does `entryStatus` → `entryVerdict`. The door is shut somewhere else entirely: `enterEvent`
 *  opens with `guardNotEnded`, which throws `COLLEGE_FREEZE_REFUSAL` under the college latch. So the
 *  fact was true on 24 of 95 college pause-weeks the review sampled and the engine refused the entry
 *  on all 24 – a card asking the parent about an entry nobody could make, which is exactly what the
 *  contract three paragraphs up forbids.
 *
 *  ⚠⚠ `world.college` AND NEVER `world.ending`, and this is the one clause where the difference is
 *  the whole fix. The small-talk roll runs INSIDE `resumeFromCollege`'s loop, which sets
 *  `world.ending = null` before it ticks – so an ending test would read false on precisely the weeks
 *  the gate has to be false on. `inCollege` is derived from the span (`world.college.untilWeek`), so
 *  it answers the same on a save taken mid-freeze.
 *
 *  ⚠ WHAT IT COSTS, PRICED AND NOT ASSUMED: R8 `alone-or-with-them` and R20
 *  `the-money-she-did-not-ask-about` are the two rows on this gate and both declare `college`, so
 *  both college cells go silent together (K5b: 24.6 % of college pause-weeks → 0, the independent
 *  column untouched at 66.1 %). Their `independent` column is the whole of their life now. Nothing is
 *  reworded and no row is removed – the situations simply stop being reachable at one stage.
 *
 *  ⚠ `tests/principles-c07-march-entry.test.ts` is the net, and it asks the ENGINE rather than this
 *  clause: no week may have both the gate true and `enterEvent` refusing with the freeze sentence. */
```

### `SmallTalkVoiceEntry` – Round 44 – one situation in one voice

```ts
/** ⭐⭐⭐ ROUND 44 – ONE SITUATION **IN ONE VOICE**, and the unit is now a column of a row rather
 *  than a row of its own. The corpus's §2 is the whole of the change: a situation carries the event,
 *  the stages and the fact; the OPENER and the three branches are written PER VOICE, so the same
 *  evening can be told four ways instead of being locked to one girl in four.
 *
 *  ⚠⚠ `opener` IS ONE SPOKEN PAYLOAD AND CARRIES NO FRAME. Until this round it held the frame and
 *  the quotation glued into one string per presence («She put the kettle on. "Practice finally felt
 *  easy today."»), which is why a transcription from the corpus document was impossible: the document
 *  holds ONLY the quotation, because round 43 lifted the frame into its own layer. A frame now comes
 *  from `SMALL_TALK_FRAMES` and `smallTalkOpener` joins the two.
 *
 *  ⭐ AND THE LAW ROUND 43 PINNED BECOMES TRUE BY CONSTRUCTION. «The quoted span is IDENTICAL at both
 *  distances» (`tests/wave3-presence.test.ts` §D) was a convention two strings had to keep; with one
 *  payload behind both presences there is no second string that could differ. The pin stays – it is
 *  now asserting a property rather than policing a habit. */
```

### `SmallTalkSituation` – One situation, in up to four voices

```ts
/** ⭐⭐⭐ ONE SITUATION, IN UP TO FOUR VOICES. `voices` is `Partial` and the gap is the design rather
 *  than a hole: a voice nobody has written for this row simply cannot reach it, and the row is not in
 *  that girl's pool at all – which is the same completeness law the per-row `voice` field carried,
 *  said one level up. `reachableSituations` asks «does this row have HER column» where it used to ask
 *  «is this row hers».
 *
 *  ⚠ `id` IS PERSISTED (it is half of the row's `detail`), so the ids here are APPEND-ONLY: renaming
 *  one makes a live soft row in a shipped save unrenderable. Adding a voice column to an existing id
 *  is free; changing the id is a migration nobody wants to owe. */
```

### `SMALL_TALK_SITUATIONS` – The catalogue, as the engine sees it – all fifty-one

```ts
/** ⭐⭐⭐ THE CATALOGUE, AS THE ENGINE SEES IT – **ALL FIFTY-ONE SITUATIONS, OUT OF ONE DOCUMENT.**
 *
 *  ⚠⚠ THIS FILE NO LONGER HOLDS A CATALOGUE OF ITS OWN, AND THAT IS ROUND 44's ARCHITECTURAL MOVE.
 *  `SMALL_TALK_SHIPPED` – the eight situations hand-written here since wave 2 – is DELETED, and those
 *  eight are rows `R45`–`R52` of `docs/specs/small-talk-corpus-2026-09.md`, brought up to four voices
 *  each. The reason is not tidiness. With a hand-written half and a generated half the catalogue had
 *  TWO SOURCES OF TRUTH IN TWO FORMATS, «fixed in the code, the document drifted» was one careless
 *  edit away permanently, and the round-trip pin could only cover the half it could parse. It covers
 *  all 51 now.
 *
 *  ⚠⚠ GENERATED AND NEVER HAND-EDITED. `world/smallTalkCorpus.ts` is written by
 *  `tools/small-talk-corpus-emit.ts` out of the document, and `tests/round44-corpus-roundtrip.test.ts`
 *  re-parses the document on every run and compares the committed module to it STRING FOR STRING.
 *  Authored strings retyped by an agent produce typos no test can catch, because the test compares
 *  against what was typed; generated, the document is the source of truth and a divergence is
 *  impossible rather than merely unlikely.
 *
 *  ⚠ THE EIGHT COME FIRST IN THE DOCUMENT AND IT IS NOT COSMETIC. `drawSmallTalkSubject` walks
 *  `SMALL_TALK_SUBJECTS`' own order rather than this array's, so the SUBJECT is stable under a
 *  re-ordering – but the situation draw is `pickInt` over the filtered pool, and that one reads
 *  POSITION. Leaving the eight where they already were leaves every existing career's situation draw
 *  where it already was, for the rows that were already there ahead of the corpus. Their document
 *  refs run last (`R45`–`R52`) precisely because renumbering `R1`–`R44` to make refs and position
 *  agree would move his own review's references to buy nothing.
 *
 *  ⚠ IDS ARE APPEND-ONLY and are asserted unique – the id is persisted as half of a `lifeLog` row's
 *  `detail`, so a renamed key orphans an old career's record of a conversation that really happened.
 *  The eight kept theirs verbatim through the move: `practice-clicked`, `line-call`, `march-entry`,
 *  `coach-real`, `watching-players`, `court-four`, `new-place`, `beat-her-conqueror`.
 *
 *  ⚠⚠ AND THE RULINGS THEIR BANNER COMMENTS CARRIED WENT WITH THEM, into each row's own prose in the
 *  document rather than into a changelog: `court-four`'s four-voice test and its named masculine
 *  exception, `practice-clicked`'s «a practice that felt easy is a MOOD, never a training gain»,
 *  `line-call`'s UNREPAIRED §8d.1 label collision («Tell her what worries us» is his most recent word
 *  and is not an agent's to edit), `new-place`'s lead-in that round 44 dropped with every other
 *  per-row lead-in, and `beat-her-conqueror`'s «temperament shapes the pattern, not the punctuation».
 *  A ruling deleted in a refactor is a ruling nobody can obey.
 *
 *  ⚠ SPEC §10's DELIVERY ORDER WAS HIS AND IS NOW SPENT: «Expand the situation catalogue only after
 *  the small set works.» The small set worked for two waves, so this is the expansion it licensed –
 *  recorded rather than dropped, because the sentence explains why the catalogue was thin and the
 *  answer to «why is it not thin any more» is that its own condition was met. */
```

### Round 44 – the frame pool, the scene she says it in

```ts
// =================================================================================================
// ⭐⭐⭐ ROUND 44 – THE FRAME POOL: THE SCENE SHE SAYS IT IN, WHICH IS NOT THE THING SHE SAYS
// =================================================================================================
//
// `docs/specs/the-frame-pool-2026-09.md`. The eighteen lines are the owner's, delivered 17.09
// against the brief in that file; four of them are marked DRAFT there and are his to rule on.
//
// ⚠⚠ WHY A POOL AND NOT A FRAME PER ROW. A situation owes ONE spoken line per voice, because
// presence changes «the scene the parent is standing in – never the sentence she says inside the
// quotation marks» (`PresenceCell`'s own note, and §D of the wave-3 presence pin asserts it). A
// frame written per row would be 43 × 2 frames nobody needs and would re-open the very law the pin
// holds; drawn from a pool keyed on PRESENCE ALONE, the quoted span is identical at both distances
// by construction.
//
// ⚠⚠ AND THE POOL IS KEYED ON PRESENCE ALONE – NEVER ON THE VOICE AND NEVER ON THE SUBJECT. His own
// ruling closed `bag-down`'s urgency question on exactly that condition: «these frames may never be
// bound to a voice», so the human variation stays variation instead of re-encoding `sunny` and
// `quiet` a second time. Subject-keying was tested and refused in the spec – he posed the most
// dangerous frame (`whole-message`) against a piece of good news, a worry and an observation and it
// carried all three – so a subject matrix would be premature complication.
//
// ⚠ AN `away` FRAME MAY NOT MENTION A ROOM, A FLATMATE, A LECTURE, A HOTEL OR A TOURNAMENT, because
// `away` is a LIFE STAGE and not a travel week: the same line has to work for a nineteen-year-old in
// a dorm and a twenty-eight-year-old in her own flat. What it may name is the channel and the
// distance. A `roof` frame may assume no time of day or meal that fails in some weeks.
```

### `SMALL_TALK_FRAMES` – Nine per presence, his, 17.09

```ts
/** ⭐⭐⭐ NINE PER PRESENCE, HIS, 17.09 («бери обе» – he took both ninths).
 *
 *  ⚠⚠ THE IDS ARE PERSISTED AND THEREFORE APPEND-ONLY, and the two pools' ids must stay DISJOINT –
 *  which is not decoration. `recentFrames` reads the pool a stored id belongs to in order to honour
 *  «roof remembers roof, away remembers away» off a `lifeLog` that stores no presence; an id in both
 *  pools would make one row count as two different memories. The completeness pin asserts it.
 *
 *  ⭐ INDEX 0 OF EACH POOL IS THE FALLBACK FOR A ROW WRITTEN BEFORE v81, and the two were chosen
 *  rather than defaulted: `kettle` and `call-middle` are exactly the two frames `practice-clicked`
 *  shipped with, so a small-talk row already in a save renders BYTE-IDENTICALLY to what the owner
 *  saw. See `smallTalkFrameOf`.
 *
 *  ⚠ THE FIRST FIVE `roof` LINES AND THE FIRST `away` LINE ARE THE ONES THAT WERE INLINE IN
 *  `SMALL_TALK_SITUATIONS` UNTIL THIS ROUND – his words, moved and not edited – with ONE correction
 *  that is his own: `shoes` read «She was halfway out of her shoes and **already telling it**», and
 *  his note was «по-английски рассказывают `a story` или `someone something`, но не универсальное
 *  `it`». That correction is the reason this round carries a frozen-career re-stamp with it. */
```

### `recentFrames` – the frames she has just been given, in this presence

```ts
/** ⭐⭐⭐ THE FRAMES SHE HAS JUST BEEN GIVEN, IN **THIS** PRESENCE, newest first.
 *
 *  ⚠⚠ THE PRESENCE IS READ OFF THE FRAME ID AND NOT OFF THE ROW, because a `lifeLog` row stores no
 *  stage and no presence – only the week, the kind, the detail and (since v81) the frame. The two
 *  pools' ids are DISJOINT, so «which pool did this row draw from» is a property of the id itself.
 *  That is the whole reason the ids are asserted disjoint: an id in both pools would make one stored
 *  row count as a memory of both distances.
 *
 *  ⚠ A ROW WITH NO `frame` IS NOT A MEMORY. It predates the pool, so nothing was drawn and there is
 *  nothing to avoid repeating – it is skipped rather than counted, exactly as a legacy small-talk row
 *  is skipped by `withoutRecentSituations`.
 *
 *  ⚠ PURE AND ZERO-DRAW. */
```

### `drawSmallTalkFrame` – which frame, this week, at this distance – drawn once, at the raise

```ts
/** ⭐⭐⭐ WHICH FRAME, THIS WEEK, AT THIS DISTANCE – drawn ONCE, at the raise, and then PERSISTED.
 *
 *  ⚠⚠ THE STREAM IS PURPOSE-SCOPED AND IS NEVER MAIN (invariant 2). `rngFromSeed` is re-derived at
 *  this call site and persists nothing, so the frozen MAIN capture (41550 draws / `e6b0c709`,
 *  tests/condition.test.ts) cannot see this function and does not move.
 *
 *  ⚠⚠ AND THE RESULT IS STORED RATHER THAN RE-DERIVED, WHICH IS THE WHOLE OF THE SCHEMA MOVE. His
 *  ruling: a frame may not change after a save, a reload, **or the pool growing**. A derived frame
 *  survives the first two perfectly – the key carries the week – and fails the third: a pool that
 *  grows from nine to ten re-derives a different member for a beat already on screen. So `v81` puts
 *  the chosen id on the row. ⚠ The same reasoning applies to the EXCLUSION: it is read at the draw
 *  and never afterwards, so a later row cannot re-word an earlier card.
 *
 *  ⚠ THE POOL IS NEVER EMPTIED. Nine frames against an exclusion of two leaves seven, so the filter
 *  cannot starve – but the `length === 0` guard is kept anyway, because a pool shrunk by a future
 *  edit must degrade to «repeat a frame» rather than to `undefined`.
 *
 *  ⚠ EXPORTED 28.09 BY T6.10 for `world/lifeBeat/smallTalk.ts`, its only caller. It stays HERE rather
 *  than travelling with §7 because it reads `recentFrames`, which reads §1's queue – §3c-2 is the one
 *  section of the situation layer the hub still calls, so it is the hub's (P4's own rule). Not on the
 *  barrel. */
```

### `smallTalkFrameOf` – The frame a row was given, for rendering

```ts
/** ⭐⭐ THE FRAME A ROW WAS GIVEN, FOR RENDERING. `null` is a row written before v81, and the answer
 *  for one is the FIRST line of the presence's pool – which is a chosen fallback and not a neutral
 *  stand-in: `kettle` and `call-middle` are exactly the two frames the shipped catalogue wrapped
 *  `practice-clicked` in, so every small-talk row already sitting in a save renders byte-identically
 *  to what the owner read on the week it was raised.
 *
 *  ⚠ A FRAME ID THAT NAMES NOTHING THROWS, like every other unreadable detail in this file – the ids
 *  are append-only for the same reason the situation ids are. */
```

### `SMALL_TALK_SUBJECT_WEIGHT` – the mood weights (spec §2)

```ts
/** ⭐⭐ THE MOOD WEIGHTS (spec §2), AND THEY ARE WEIGHTS RATHER THAN A MAPPING – which is the whole
 *  mechanical change of that section. «A heavy week leans toward `worry` but can still produce a
 *  tired `observation` or a small `decision`; a bright week leans toward `good-news` or `story`; an
 *  ordinary week leans toward `curiosity`, `decision` or `observation`.»
 *
 *  ⚠⚠ THE NUMBERS ARE A **DRAFT** AND SPEC §12.1 NAMES THEM AS NEEDING HIS WORD («the subject
 *  taxonomy and the mood weights – the one mechanical choice»). The shape is his; the integers are
 *  the build's, chosen to say exactly the three sentences above and nothing more. They are in this
 *  file and not in `ECONOMY` on purpose: `ECONOMY` is the balance surface and invariant 5 governs it,
 *  and this is narrative texture that moves no number a bench can measure.
 *
 *  ⚠ NO ZERO ANYWHERE, and that is the design rather than caution: a zero would be the hard mapping
 *  back in one cell, and «can still produce» is what §2 asks for. */
/* ⚠ EXPORTED FOR THE CORPUS BENCH AND FOR NOTHING ELSE (round 43 #8(a), the corpus spec's §P2.6:
 *  «reads the catalogue and the selection weights»). K1 reports a WEIGHTED pool size per cell, which
 *  is a property of these integers and of the catalogue together – a bench that re-typed them would
 *  be measuring its own copy, which is the one way that number can be confidently wrong. Nothing in
 *  `src/` reads it but the draw below. */
```

### `reachableSituations` – which situations this girl could actually bring

```ts
/** ⭐⭐⭐ WHICH SITUATIONS THIS GIRL, AT THIS STAGE, ON THIS CAREER, COULD ACTUALLY BRING. The one
 *  place the three gates meet, and the one road to a drawable situation.
 *
 *  ⚠⚠ THE FACT IS ASKED HERE AND NOWHERE ELSE, WHICH IS WHAT MAKES §8d.5 A PROPERTY. A situation
 *  whose competitive claim is false is not in the returned list, so it cannot be drawn, so no code
 *  path can render it – rather than being filtered at the draw and left renderable by a second
 *  caller. `tests/round42-small-talk-exchange.test.ts` §D is the pin, and it mutates the gate away to
 *  prove the pin bites.
 *
 *  ⚠ PURE AND ZERO-DRAW. Nothing here takes an `Rng`, so the frozen MAIN capture cannot see it. */
```

### `SMALL_TALK_EXCLUDE_LAST` – Round 43 #8(a) – how many of her last conversations are off the table

```ts
/** ⭐⭐ ROUND 43 #8(a) – HOW MANY OF HER LAST CONVERSATIONS ARE OFF THE TABLE. Two, and the number is
 *  the corpus spec's own (`docs/specs/small-talk-corpus-2026-09.md` §P2.5, «last-two exclusion when
 *  ≥3 reachable»): it is what makes «the same line twice running» impossible AND makes a repeat
 *  inside the last three impossible, which is the pair the bench's K2 and K3 measure.
 *
 *  ⚠ IT IS A COUNT OF ROWS AND NOT A WINDOW OF WEEKS, deliberately. `smallTalkPerWeek` is 0.08 at a
 *  close bond under a cap of four a season, so two conversations can sit a season apart – a window
 *  wide enough to hold them would have to be a season wide, and a window that wide is just «the last
 *  two» with an extra number in it that can rot. */
```

### `withoutRecentSituations` – Round 43 #8(a) – the situations she has just brought, out of the pool

```ts
/** ⭐⭐⭐ ROUND 43 #8(a) – THE SITUATIONS SHE HAS JUST BROUGHT, TAKEN OUT OF THE POOL, AND **THE POOL
 *  IS NEVER EMPTIED**.
 *
 *  ⚠⚠ THE DEGRADATION IS THE WHOLE OF THE CARE HERE, and it runs OLDEST-FIRST. `reachableSituations`
 *  narrows by her VOICE and her STAGE and a career has one voice for life, so what a single girl can
 *  reach is one row of a 4×4 grid – `deep` at college holds TWO situations against four conversations
 *  a season. Excluding two of two would leave nothing, `rollSmallTalk` would fall through to the
 *  legacy generic opener, and the fix would have made the card WORSE than the repeat it was written
 *  to stop. So the exclusions are given up one at a time, the oldest going first, and the most recent
 *  one – the one his complaint is actually about – is the last to be surrendered and is surrendered
 *  only when it is the only thing she can reach at all.
 *
 *  ⚠ IT READS THE LOG AND WRITES NOTHING. `raiseLifeBeat` already stores `{ week, kind, detail }` and
 *  the log is append-only and never pruned, so the history this needs is ALREADY IN EVERY SAVE: no
 *  schema bump, no migration, no golden fixture, no new field. `coachSinceWeek`'s own doctrine
 *  (world/coachMarket.ts), asked of a different question.
 *
 *  ⚠ THE MATCH IS ON THE STORED `detail` STRING, not on the id alone. `detail` is exactly what the
 *  row holds (`smallTalkDetailFor` – `'<subject>:<id>'`), so nothing here re-derives a fact that
 *  could have moved, and a LEGACY row (a bare subject, no colon) matches no situation and is simply
 *  not an exclusion – which is right: it named no situation to repeat.
 *
 *  ⚠ PURE AND ZERO-DRAW. Nothing here takes an `Rng`, and it adds no stream key: the two keys
 *  `rollSmallTalk` derives are unchanged in name, in number and in order. */
```

### `smallTalkDetailFor` – The row's own detail, and it is two fields

```ts
/** THE ROW'S OWN DETAIL, AND IT IS TWO FIELDS – `'fork-psy'`'s shape («`'<register>:<driver>'`») for
 *  `'fork-psy'`'s reason: the row must stay reconstructible for the life of the career, and a
 *  re-derivation from a later world could hand the parent a different small thing from the one she
 *  came with. The subject half is what the card's frame reads; the situation half is the copy.
 *
 *  ⚠ EXPORTED 28.09 BY T6.10 for `world/lifeBeat/smallTalk.ts`. The detail's SHAPE is the thing that
 *  must not be spelled twice – a second `${subject}:${id}` in another file is exactly the
 *  re-derivation this comment refuses. Not on the barrel. */
```

### `smallTalkVoiceOf` – Reading it back

```ts
/** ⭐⭐ READING IT BACK. `null` is a LEGACY row – one of the three shipped subjects, no colon, no
 *  situation – and the legacy pool is what renders it. That is the whole of the save-compat story:
 *  no migration, no schema bump, the SHAPE of the string is the discriminator.
 *
 *  ⚠ IT TAKES THE VOICE BECAUSE A SITUATION IS PER-VOICE. The row records the subject and the id;
 *  which of the (up to four) columns of that id is hers is her birth temperament, which is a fact of
 *  the world and never of the row – exactly as `lifeBeatSaid` has always read the voice.
 *
 *  ⚠ A ROW NAMING A SITUATION THAT NO LONGER EXISTS THROWS, like every other unreadable detail in
 *  this file. That is why the ids are append-only: see `SmallTalkSituation.id`. */
```

### `smallTalkOpener` – Round 44 – her opener, a pool frame joined to one spoken payload

```ts
/** ⭐⭐⭐ ROUND 44 – HER OPENER, WHICH IS A **POOL FRAME JOINED TO ONE SPOKEN PAYLOAD**.
 *
 *  ⚠⚠ IT NO LONGER THROWS FOR A MISSING FRAME, AND THAT IS THE SHAPE CHANGE RATHER THAN A LOOSENING.
 *  Until this round a situation carried the frame and the quotation glued into one string per
 *  presence, so a cell nobody had written was a hole the renderer had to refuse; now the payload is
 *  one string that serves both distances and the scene comes from a pool that is total over
 *  presence. There is no cell left to be missing. `stages` still gates which situations she can
 *  reach at all – that clause did not move.
 *
 *  ⭐ AND THE LAW IS NOW A PROPERTY: the quoted span is identical at `roof` and at `away` because
 *  there is only one of it (`tests/wave3-presence.test.ts` §D). */
```

### `lifeBeat.ts` §3e – 'ended' – the copy moved

```ts
// =================================================================================================
// 3e. `'ended'` – THE COPY MOVED TO `world/lifeBeat/endedCopy.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// A pure leaf, and the two types and two rosters of this beat's own shape went with it. The hub reads
// the three pools and re-exports the four public names under their historical spelling – the values
// with `export { … } from`, the TYPES with `export type { … } from`, which P4's field notes say is not
// optional. ⚠ §8, the end's HAZARD half, is still here: it calls back into the hub and its three names
// reach `world.ts` through the hub's re-export, so it is the «both directions are true» case P4
// refuses.
```

### `lifeBeat.ts` §3f – «learning to listen»

```ts
// =================================================================================================
// 3f. «LEARNING TO LISTEN» – ⚠⚠ THE SAME NEWS, READ PLAINLY (wave 5, T6). EVERY WORD BELOW IS A DRAFT.
// =================================================================================================
//
// `docs/specs/the-psychologists-year-2026-09.md` §2, the «Learning to listen» row: on a week the
// family is paying a psychologist whose chosen year is `'listen'`, one uniform per read-bearing beat
// against `ECONOMY.psychologist.listenClarity[rung]` decides whether the card's HEADING and the KEPT
// FEED ROW say plainly what she wants. Success is the LEGIBLE wording below; failure is the standing
// wording, byte for byte, which is why not one shipped string moved for this step.
//
// ⚠⚠⚠ HE COACHES THE PARENT AND NEVER REPORTS HER SESSIONS – the owner's re-cut of 09.09, and the
// gravest wording failure this section can produce. Every legible line below is written as the
// PARENT'S OWN TRAINED READING of his daughter. A line of the form «the psychologist says she wants…»
// would be a confidentiality leak AND a category error: what the seat sells is an ear, not a report,
// and the spec's own sentence for the focus is «He is teaching you to hear what she does not say».
// Not one string in this file may name him, quote him or attribute a reading to him.
//
// ⚠⚠ AND THE BOND ARITHMETIC IS UNTOUCHED ON BOTH SIDES OF THE COIN. The deltas, her drawn `wants`,
// the space-vs-company read and the priced option set are the same bytes with the focus on or off –
// `lifeBeatOptionsFor` never sees this value and has no parameter that could carry it. That is what
// makes the focus a communication coach rather than a purchase (the spec: «never a purchase and
// never a leak of her sessions (`bond` untouched)»), and it is pinned by deep-equalling the priced
// sets across the toggle rather than by reading this comment.
//
// ⚠⚠ THE LEGIBLE POOLS ARE THE FIRST PARENT'S-FRAME COPY IN THIS FILE INDEXED BY TEMPERAMENT, and
// the fence it extends is named here rather than quietly crossed. `MET_MENTION`'s note states the
// standing rule – «It is the PARENT'S narration and the fence keeps temperament out of that –
// `HER_LINE` and `MET_HER_LINE` are the only pools in this file a girl's voice indexes» (with
// `ENDED_HER_LINE` the third since wave 4). What is being bought HERE is a reading of THIS daughter:
// the legible half of the card is the parent saying what he has learned about how she asks for
// things, and a reading that did not know which girl it was about would be exactly the generic
// wording the focus exists to replace. The AMBIGUOUS pools are untouched and the fence still holds
// over every one of them.
//
// ⚠ SO EVERY LEGIBLE CELL IS A RULE ABOUT HER, NEVER A CLAIM ABOUT THIS WEEK'S TELLING. The heading
// is carried at EVERY bond band (the §3e banner), and on the dry rung she said nothing at all – the
// house found out. A legible frame that read «she closed the subject fast» would therefore be FALSE
// on a third of the ladder while looking careful. What the frames name instead is her standing habit
// (`world.temperament` is a persisted fact of the world) and her drawn read (a persisted draw), and
// both are true whether or not she opened her mouth this week.
//
// ⚠⚠ AND THAT RULE IS A LINT RATHER THAN THIS SENTENCE, because the first draft broke it in SIX
// places while this comment claimed it did not – four headings and two rows, «the easy telling is
// the whole of it», «it was given to us to keep», «we heard it the way she meant it». A note that
// claims more than the copy delivers is the shape ruling C rejected, one layer over. The sweep is in
// `tests/wave5-psychologist-listen.test.ts` §B beside the confidentiality one, in the `BANNED_TAILS`
// style: a list, all FORTY cells, and a positive control first. ⚠ Forty and not forty-eight since
// T6b: ruling O took the legible told-now kept row out (`ENDED_EVENT_HEARD`, 16 → 8).
//
// ⚠ AND NOT ONE OF THEM NAMES AN ANSWER, which is `ENDED_HEADING`'s own rule inherited whole: «what
// she wants» is what the parent can see; which of the four things to say about it is his, and a
// heading that recommended one would be the meter this layer refuses to build, spelled in words.
```

### `drawListenHeard` – the coin – did the parent read her plainly, this beat

```ts
/** ⭐⭐⭐ THE COIN – DID THE PARENT READ HER PLAINLY, THIS BEAT. One uniform on
 *  `seed:psy:listen:<kind>:<week>` against `ECONOMY.psychologist.listenClarity[rung]` (the spec §2's
 *  ruled 0.6 / 0.8 / 0.95).
 *
 *  ⚠⚠ THE KIND IS IN THE KEY, which is §1f's one-value-per-key law satisfied by construction rather
 *  than by luck: two read-bearing beats CAN share a week – an ending raised in §8 and a delivery
 *  raised in §6 of the same tick – and a key without the kind in it would hand them one value and one
 *  outcome for two unrelated pieces of news.
 *
 *  ⚠ THE WEEK IS THE RAISE WEEK, never an episode's date and never a later `world.week`: the row
 *  carries its own `week` (`LifeBeatRecord`), so the value is reconstructible for the life of the
 *  career even though nothing ever re-derives it (the stamp is written once – ruling E).
 *
 *  ⚠ (seed, calendar, kind)-KEYED AND NEVER (seed, choice)-KEYED, like every stream in this file.
 *  MAIN is not reached, so the frozen capture cannot see this. ⚠ THE RUNG IS A PARAMETER,
 *  `drawEndsRead`'s own primitives doctrine – a census can sweep the ladder without posing a world. */
```

### `listenHeardNow` – The seat's answer for this week's raise, or null

```ts
/** ⭐⭐ THE SEAT'S ANSWER FOR THIS WEEK'S RAISE, or `null` when nobody is teaching him to listen.
 *
 *  ⚠⚠ A `null` HERE IS **ZERO DRAWS**, not a discarded one – `arrivalEligible`'s own law, and the
 *  count-keys net is what holds it. `psychologistWorkingRung` short-circuits on three questions in
 *  one (not hired · hired for a different year · stood down by a college freeze or a booked family
 *  week), and the stream is not derived until all three have been answered.
 *
 *  ⚠⚠ IT ASKS THE BILLING PREDICATE THROUGH THAT HELPER, which is ruling J: the working week IS the
 *  billing week, so a college freeze and a booked family week stand this down exactly as they stand
 *  the invoice down. Pay nothing, receive nothing.
 *
 *  ⚠ AND IT IMPORTS THE SEAT DIRECTLY, the masseur's own way (`world/medical.ts`), rather than taking
 *  the fact as a parameter the way `accrueSpirit` must. Measured rather than assumed, on the tree's
 *  own value-import graph: `world/psychologist.ts` reaches THIS module by **ZERO** paths (the same
 *  walk that finds seven from it to `engine/development.ts`, which is why T5's site could not ask).
 *  The rule is the college arrow, not «`spirit.ts` is special» – the wave-5 rulings, J as corrected
 *  by T4b.
 *
 *  ⚠ EXPORTED 28.09 BY T6.10: `world/lifeBeat/ended.ts` asks it, and asking it is the whole point –
 *  the alternative is a second derivation of `seed:life:listen:<kind>:<week>` in a second file, which
 *  is the count-keys net's own failure mode. Not on the barrel (T6.6's frozen name set). */
```

### `HeardRead` – whose reading this is

```ts
/** ⭐ WHOSE READING THIS IS – the two facts a legible frame cannot be assembled without.
 *
 *  ⚠⚠ ONE PARAMETER RATHER THAN THREE DEFAULTED ONES, AND THAT IS THE COMPLETENESS LAW PAYING FOR
 *  ITSELF. `lifeBeatSaid`'s later axes are positional with shipped defaults, and that idiom is right
 *  where the default is a real reading (`'told-now'`, `'space'`, `'open'`). Here it would be a trap:
 *  a defaulted `voice` would let a caller ask for the legible frame without saying which girl it is
 *  about, and silently hand a `deep` girl a `sunny` girl's reading – the exact silent-fallback defect
 *  §5b's completeness pin exists to make impossible. `null` is the standing ambiguous frame; anything
 *  else must name the voice, so there is no cell a caller can reach by forgetting. */
```

### `MET_HEADING_HEARD` – 'met' read plainly, by voice, by what she asked for

```ts
/** ⭐⭐ `'met'` READ PLAINLY, BY VOICE, BY WHAT SHE ASKED FOR – 8 drafts.
 *
 *  ⚠ THE STANDING HEADING CARRIES NO READ AT ALL (`MET_HEADING`: three frames on the bond ladder,
 *  and not one of them says what she wants done with the news). The `wants` axis reaches the standing
 *  card through her LINE and through the kept row; a parent who was not listening pays for it over
 *  months. These eight are what a parent who was taught to listen hears instead: the same news, with
 *  the ask said out loud.
 *
 *  ⚠ NO BOND COLUMN, DELIBERATELY, and the standing pool's own argument is the reason. The read is
 *  drawn at every band and the flip prices a cold home's four answers exactly as it prices a close
 *  home's, so a legible frame only half the ladder could read would be the hidden number `MET_DRY`
 *  refuses to be. What the band governs is HOW the news arrived, and that is carried by the line
 *  under this frame, which does still move with it.
 *
 *  The bible each voice is read through, in a phrase: `sunny` gives context unasked, so the ask lives
 *  in what she left out; `fiery` reaches the verdict first, so the ask is where she drew the line;
 *  `quiet` puts a thing down beside something ordinary, so the ask is in the placing; `deep` gives a
 *  thing its exact size, so the ask is in what she did not add. */
```

### `ENDED_HEADING_HEARD` – 'ended' read plainly, by voice, by register

```ts
/** ⭐⭐ `'ended'` READ PLAINLY, BY VOICE, BY REGISTER, BY HER READ – 16 drafts, and the shape is
 *  `ENDED_HER_LINE`'s (voice × register × a two-member leaf) rather than a new one.
 *
 *  ⚠⚠ THE STANDING HEADING ALREADY NAMES THE READ, so what legibility adds here is NOT the fact – it
 *  is the RULE that stops the fact being disbelieved. Her line and her read point opposite ways often
 *  enough that wave 4 had to lint her pool read-NEUTRAL (the wave-4 rulings, J): «No, I don't want to
 *  go through it» is about RECOUNTING and says nothing about PRESENCE, and a parent who has not been
 *  taught the difference hears a door closing. Each cell below names the surface that misleads and
 *  then the read, so the card stops arguing with itself for a parent who was coached.
 *
 *  ⚠ THE TAIL OF EVERY CELL IS THE STANDING POOL'S OWN WORDING OF THE READ, kept deliberately: the
 *  fact is the same fact, and inventing a second way to say «she wants the room to herself» would put
 *  two sentences into the album for one draw. What is new is the clause in front of it.
 *
 *  ⚠ AND NOT ONE OF THE SIXTEEN CLAIMS SHE SPOKE THIS WEEK – see the §3f banner. On the dry rung
 *  nobody was told; the rule named in each clause is a standing fact about her, and it is as true of
 *  a week she said nothing as of a week she said everything. */
```

### `metHeadingFor` – The frame, one function

```ts
/** ⭐ THE FRAME, ONE FUNCTION, so «which heading does a card wear» has exactly one spelling and the
 *  ambiguous arm can be proven byte-identical to what shipped. `null` is the standing frame.
 *
 *  ⭐⭐⭐ v77 T6 – AND THE THIRD ARGUMENT IS THE OVERTAKE, ON THE **STANDING** ARM AND NOWHERE ELSE.
 *  `heard` is tested FIRST and that branch order is the ruling rather than a style: the legible pool
 *  is what a parent PAID a psychologist to hear, and a headline frame placed in front of it would
 *  take back, on exactly the weeks the overtake fires, the read he bought (ruling O's own shape at
 *  `endedKeptRow`, one scene over, argued the same way). So the coached card is byte-identical to
 *  what shipped, and the new line is what the STANDING card says – which is also the brief's literal
 *  boundary, «a headline-register intro variant on the standing prompt».
 *
 *  ⚠ THE DEFAULT IS `false`, WHICH IS THE SHIPPED READING AND NOT A NEUTRAL STAND-IN: every caller
 *  that passes nothing gets exactly the frame this function returned before the overtake existed.
 *  `lifeBeatHeading`'s own later parameters are defaulted for that reason and this is the fourth. */
```

### `lifeBeat.ts` §3g – 'engaged' – the copy moved

```ts
// =================================================================================================
// 3g. `'engaged'` – THE COPY MOVED TO `world/lifeBeat/weddingCopy.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// A pure leaf: §3g referenced nothing and only the dispatcher hub below read it, so it left whole –
// banner, rulings and chronicles included – and the hub imports the three pools back. ⚠ §11, the
// wedding's HAZARD half, is still in this file: it calls back into the hub and its names reach
// `world.ts` through the hub's re-export, so it is the «both directions are true» case P4 refuses.
```

### `lifeBeat.ts` §3h – 'spouse-view' – the copy moved

```ts
// =================================================================================================
// 3h. `'spouse-view'` – THE COPY MOVED TO `world/lifeBeat/spouseViewCopy.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// A pure leaf: only the dispatcher hub below read it, so it left whole and the hub imports the three
// strings back. ⚠⚠ §12, the opinion SURFACE, stays here for a stronger reason than the other hazards:
// it has three inbound references IN THIS FILE (the dispatcher and §14's pregnancy) and it reaches
// back into §1 and §4, so it is imported by what stays and imports what stays. That is the case P4's
// last rule names – it needs dependency inversion, not a span-move.
```

### `lifeBeat.ts` §3i – 'own-key' – the copy moved

```ts
// =================================================================================================
// 3i. `'own-key'` – THE COPY MOVED TO `world/lifeBeat/ownKeyCopy.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// A pure leaf – it referenced nothing at all – so it left whole, banner and chronicles included, and
// the hub imports the four strings back: the dispatcher reads three and §13's `deliverOwnKey` reads
// `OWN_KEY_ROW`. ⚠ §13 itself is still in this file: it calls back into the hub and its names reach
// `world.ts` through the hub's re-export, so it is the «both directions are true» case P4 refuses.
```

### `lifeBeat.ts` §3j – 'expecting' – the copy moved

```ts
// =================================================================================================
// 3j. `'expecting'` – THE COPY MOVED TO `world/lifeBeat/pregnancyCopy.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// A pure leaf: only the dispatcher hub below read it, so it left whole – banner, rulings and
// chronicles included – and the hub imports the three pools back. ⚠ §14, the pregnancy's HAZARD half,
// is still in this file: it calls back into the hub and its names reach `world.ts` through the hub's
// re-export, so it is the «both directions are true» case P4 refuses.
```

### `lifeBeat.ts` §3l – 'bereavement' – the copy moved

```ts
// =================================================================================================
// 3l. `'bereavement'` – THE COPY MOVED TO `world/lifeBeat/bereavementCopy.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// A pure leaf: only the dispatcher hub below read it, so it left whole – banner and chronicles
// included – and the hub imports the three pools back. ⚠ §16, the death's HAZARD half, is still in
// this file, with its `life:loss` draw: it calls back into the hub and its names reach `world.ts`
// through the hub's re-export, so it is the «both directions are true» case P4 refuses.
```

### `lifeBeat.ts` §3m – 'divorced' – the copy moved

```ts
// =================================================================================================
// 3m. `'divorced'` – THE COPY MOVED TO `world/lifeBeat/divorcedCopy.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// A pure leaf: its readers are the dispatcher below and §8's latched branch, which writes
// `divorcedKeptRow()` into the feed. It left whole, banner and chronicles included, and the hub imports
// the four it reads back. The row function keeps its historical name and is not on the barrel –
// nothing outside this module set ever called it.
```

### `lifeBeat.ts` §3k – 'return-plan' – the week she is back

```ts
// =================================================================================================
// 3k. `'return-plan'` – THE WEEK SHE IS BACK, AND THE QUESTION IS HOW (the return, wave 8: T6).
//     ⚠ ⚠ DRAFT – EVERY WORD BELOW IS THE BUILDER'S DRAFT FOR THE OWNER (invariant 4; T8's table).
// =================================================================================================
//
// ⭐⭐⭐ THIS ONE IS THE PARENT'S, AND THAT IS §4a READ EXACTLY RATHER THAN BENT. «SHE decides, the
// parent REACTS» is a law about HER LIFE – whether there is someone, whether she marries, whether
// she has a child, whether she goes back – and every one of those is drawn or hers. This is the
// SCHEDULING, which is what the parent has always decided: the college fork's mechanical questions
// are the precedent, and `answerFork` is a command rather than a beat for the same reason. She has
// already said she is going back (T5's coin); what a season is built out of is the job.
//
// ONE CARD, TOLD ONCE, IN THE PARENT'S OWN NARRATION – `'own-key'`'s one-cell pool and its whole
// argument, which transfers word for word: the completeness rule («a `quiet` girl can never silently
// receive a `fiery` girl's line») binds pools that QUOTE her, and this card quotes nobody. Giving the
// scene a voiced line of hers is a wording decision the owner may take at T8's table; a draft that
// jumped ahead of it would be choosing for him.
//
// ⚠ BOTH ANSWERS ARE PRICED AT **0 BOND**, AND THE ZERO IS THE DESIGN RATHER THAN A DEFAULT. Two
// reasons, and the second is the one that matters. (a) §4a.2's law is that HIS WORDS move `bond`;
// this answer is not a word to her, it is a calendar. `'own-key'`'s ruled zero and the counsel's
// («counsel is information, not a test») are the same shape. (b) ⚠⚠ THE PRICE OF THIS ANSWER IS PAID
// IN TENNIS AND MUST NOT ALSO BE PAID IN BOND: the wrong ramp spends her twelve protected entries
// inside the deepest rung of the staged factor and loses them, and a bond delta on top would make one
// answer «the nice one» on a card whose whole purpose is that the cost is mechanical and emergent.
// It is the one beat in this file whose cost is not in this file.
//
// ⚠ NO DATE AND NO NUMBER IN EITHER LABEL (rule 4), and neither of them names the freeze: how many
// entries a protected ranking buys is a rule the card may not turn into a promise, and T9 is what
// measures whether either answer was right.
```

### `RETURN_PLAN_CHOICE` – the answer's other consequence – which booking preference each id records

```ts
/** ⭐⭐⭐ THE ANSWER'S OTHER CONSEQUENCE: which booking preference each id records, `EXPECTING_SUPPORT`'s
 *  own shape one section up and its own law – «one answer, two consequences, zero new meters».
 *
 *  ⚠ THE PLAN IS THE ANSWER'S OWN NAME AND THERE IS NOTHING TUNABLE HERE. Both ids are priced at 0
 *  bond (§3k's banner), so unlike the pregnancy's grades this table cannot drift away from a retune –
 *  there is no number to retune. It exists so the ID the card carries and the STATE the seam reads
 *  have exactly one spelling in the engine.
 *
 *  ⚠ TOTAL OVER THE KIND'S OPTION IDS, and `tests/wave8-return-ramp.test.ts` is what says so – the
 *  ids are strings rather than a union, so the type cannot carry that claim and a test has to.
 *  `answerLifeBeat` throws BY NAME on a miss rather than writing `undefined` onto the field. */
```

### `LifeBeatAnswer` – one answer on a life-beat card

```ts
/** One answer on a life-beat card: the id the command carries, the sentence the button shows, and
 *  what saying it costs. ⚠ NAMED IN v74 T7 so `lifeBeatOptionsFor`'s signature can say what it hands
 *  back; the shape is the one `LIFE_BEAT_OPTIONS` has always had, spelled out rather than changed.
 *
 *  ⚠⚠ `LifeBeatAnswer` AND NOT `LifeBeatOption`, WHICH IS TAKEN AND IS A DIFFERENT THING.
 *  `shared/protocol/narrative.ts` already exports `LifeBeatOption` – the WIRE shape, `{id, label}`,
 *  what `LifeBeatPrompt.options` carries to the dialog and DELIBERATELY has no `bond` on it. Two
 *  types of the same name on two barrels, one with a price and one without, is the duplicate-
 *  identifier confusion at its most expensive: the safer one silently accepting the costed one.
 *  ⭐ AND THE SPLIT IS THE FENCE ITSELF – the engine's answer knows what it costs, the screen's
 *  cannot, and that is why the flip can never leak onto a button. */
```

### `LIFE_BEAT_OPTIONS` – What the parent may say back, per beat kind

```ts
/** ⭐⭐ WHAT THE PARENT MAY SAY BACK, PER BEAT KIND – and not one option in either list is HER choice.
 *
 *  ⚠⚠ THIS IS THE TABLE AS AN **`open`** GIRL PRICES IT (v74 T7). It is still the one place the
 *  labels and the base numbers live, and `lifeBeatOptionsFor` below is the ONLY road to the priced
 *  set a given row is answered against – read this record directly and you have read one of the two
 *  readings. It stays the default because `'open'` is the reading with no request attached.
 *
 *  ⚠⚠ RESTRUCTURED FROM A FLAT LIST IN v74 (wave 3, T6), and the reason is the type rather than
 *  tidiness: a `'met'` answer set is not a fork-opinion answer set. «Tell her we are behind her» is
 *  a sentence about a decision she asked him to weigh in on; there is no decision here and nothing
 *  was asked of him. Keying the table on `LifeBeatKind` makes a missing set a COMPILE error, which
 *  is the same guarantee `HER_LINE`'s total record gives her voice.
 *
 *  ⚠ NO NUMBER, NO PRICE, NO METER in any label – the dialog never exposes one (the fence).
 *
 *  ⚠ THE `'met'` LABELS NAME NO GENDER, and that is the schema being obeyed rather than a style
 *  choice: `LoveEpisode` persists no name and no gender on purpose («the schema must not hardwire
 *  boyfriend -> husband»), so a button reading «ask to meet HIM» would put on screen a fact the world
 *  does not hold. The wave-3 brief's own draft of the intrusive label says «him»; this is the same
 *  option with the fact taken out, and the wording is the owner's to settle either way (§5). */
```

### `LIFE_BEAT_OPTIONS` – tier 1's three, and every one of them is a literal zero

```ts
  /** ⭐⭐ TIER 1's THREE, AND EVERY ONE OF THEM IS A LITERAL ZERO (v74 T8, ruling V2 – «tier-1
   *  replies move nothing»). §5b asks for «2–3 reply options»; these are three parent moves that fit
   *  a worry, a joy or a question alike, because the answer set is keyed on the KIND and her subject
   *  is a fact on the row rather than a second table.
   *
   *  ⚠⚠ THE ZERO IS WRITTEN OUT AND NOT SOURCED TO `ECONOMY.bond.delta`, and that is the ruling made
   *  structural: there is no tier-1 row in the delta table because tier 1 has no economy («the delta
   *  table stays the big beats'»). A named constant here would be the first step toward a tunable
   *  nobody ruled, and the day somebody tuned it every one of these four-a-season conversations would
   *  start paying. ⚠ `tests/wave3-small-talk.test.ts` §C is the pin that goes red if one of them
   *  stops being zero. */
```

### `LIFE_BEAT_OPTIONS` – v74 T17 – two acknowledgments, both priced zero

```ts
  /** ⭐⭐⭐ v74 T17 – TWO ACKNOWLEDGMENTS, BOTH PRICED ZERO, AND THE ZERO IS A RULING RATHER THAN A
   *  DEFAULT. «Counsel is information, not a test» – V2's own law read one tier up: the coach is not
   *  a person the parent can answer WRONGLY, and a priced reply would turn a phone call about his
   *  daughter into a thing to be played correctly. There is no third option and no `listen` detour:
   *  he has said his piece, and a panel promising more of him would be the fictional dishonesty the
   *  10.09 ruling took out of the fork.
   *
   *  ⚠⚠ AND THE PAIR OF ZEROES IS ALSO A HARD REQUIREMENT, not just a design one:
   *  `tools/_lifeBeats.ts`' `drainLifeBeats` picks the bond-neutral option and THROWS if a kind has
   *  none – forty tools, `npm run e2e:fixtures` and every walked test depend on it, and `npm run
   *  check` would stay green while all of them broke. `tests/wave3-reaction.test.ts` §D is the sweep
   *  that says every kind has one.
   *
   *  ⚠ NEITHER LABEL PROMISES AN OUTCOME. What the parent does about it is the fork, one card later,
   *  and a button here reading «tell the coach she is playing» would be a second, unpriced fork.
   *
   *  ⚠⚠ AND NO PRONOUN FOR THE COACH, IN THESE LABELS OR IN THE FEED ROWS BELOW – R15-7's rule, which
   *  `tests/coach-voice.test.ts` sweeps over every literal in this file: the sim holds no gender for a
   *  coach, so «thank him» is a fact the world does not have. The first draft of this pool said it and
   *  the sweep caught it, which is what that guard is for. */
```

### `LIFE_BEAT_OPTIONS` – v76 T8 – two acknowledgments, both priced zero

```ts
  /** ⭐⭐⭐ v76 T8 – TWO ACKNOWLEDGMENTS, BOTH PRICED ZERO, AND THE PAIR ABOVE'S RULING REPEATED
   *  RATHER THAN RE-ARGUED: «counsel is information, not a test». The psychologist is not a person the
   *  parent can answer wrongly either, and a priced reply would make a second phone call about his
   *  daughter into a thing to be played correctly. No third option and no `listen` detour.
   *
   *  ⚠⚠ AND THE ZEROES ARE WHAT KEEP HIS READ A WORDING REGISTER. He reads `spiritShock` for the
   *  column of `PSY_COUNSEL` and nothing else (§3f) – so this list is the SAME two rows, the same two
   *  ids and the same two zeroes with a shock live and with none. There is no overlay for this kind in
   *  `lifeBeatOptionsFor`, which is the strongest form that statement can take: the priced set is not
   *  «equal in both registers», it is the same object.
   *
   *  ⚠ NEITHER LABEL PROMISES AN OUTCOME – the fork is one card later, and a button reading «tell the
   *  psychologist she will keep playing» would be a second, unpriced fork.
   *
   *  ⚠⚠ AND NO PRONOUN FOR THE PSYCHOLOGIST, here or in the feed rows below. R15-7's rule, swept over
   *  every literal in `src/` by `tests/coach-voice.test.ts`: the sim holds no gender for a member of
   *  staff, so «thank him» is a fact the world does not have. The coach's pool records the same guard
   *  catching the same mistake on its first draft. */
```

### `LIFE_BEAT_OPTIONS` – v75 T4 – the four the ending offers

```ts
  /** ⭐⭐⭐ v75 T4 – THE FOUR THE ENDING OFFERS (build plan §5's shape, ruling G's prices). ⚠ THIS IS
   *  THE LIST AS A GIRL WHO WANTS **SPACE** PRICES IT, which is `LIFE_BEAT_OPTIONS`' own doctrine
   *  applied to the second read in this file: the base column here is `'space'` exactly as it is
   *  `'open'` for `'met'`, and `ENDED_BOND_COMPANY` is the overlay. `lifeBeatOptionsFor` is the only
   *  road to the priced set either way.
   *
   *  ⚠⚠ THE FIRST KIND WITH NO FREE ANSWER, and that is the whole of the 12.09 drain amendment's
   *  reason for existing (wave-4 brief §0.2). Nothing here costs zero under any reading. What keeps
   *  a harness safe instead is that `fix-it` and `blame` are READ-INDEPENDENT – the overlay below
   *  names neither – so `DRAIN_ANSWER['ended'] = 'fix-it'` charges −1 whatever she wanted, which is
   *  an arithmetic a bench can print (`tools/_lifeBeats.ts`, `drainSkewLine`).
   *
   *  ⚠ THE LABELS NAME NO GENDER AND NO PERSON, the schema being obeyed rather than a style choice:
   *  `LoveEpisode` persists no name and no gender, so «them» is the only honest word for whoever is
   *  gone. ⚠ AND NO NUMBER, NO PRICE, NO METER in any of them (the fence) – and, per ruling G, the
   *  LABELS ARE UNTOUCHED BY THE FLIP: same four sentences, same order, same ids, both readings. A
   *  button that changed its words with its price would be the meter one step removed.
   *
   *  ⭐ T6 READ ALL FOUR AND KEPT THEM BYTE-IDENTICAL, WHICH IS A DECISION AND NOT AN OMISSION. They
   *  are gender-free by «them» (the schema persists no name and no gender), carry no number, no price
   *  and no meter, and – the test a label has to pass that a sentence does not – EACH ONE READS AS A
   *  PLAUSIBLE PARENT IN BOTH READINGS, because the flip moves the price and never the words. «Give
   *  her room, and say we are here» is the kind answer when she wants space and a distant one when she
   *  wants company; «Keep her company, and stay close this week» is warmth one way and crowding the
   *  other. A label that only worked under one read would be the read leaking onto the button. */
```

### `LIFE_BEAT_OPTIONS` – v88 (the parting, wave 12 – T1/T2) – the four the marriage's ending offers

```ts
  /** ⭐⭐⭐ v88 (the parting, wave 12 – T1/T2) – THE FOUR THE MARRIAGE'S ENDING OFFERS (spec §4's
   *  shape: give her room / stay close / offer to help sort it / dismiss him). ⚠ THIS IS THE LIST AS
   *  A GIRL WHO WANTS **SPACE** PRICES IT, `'ended'`'s own doctrine at the same axis: the base column
   *  is `'space'` and `DIVORCED_BOND_COMPANY` is the overlay. `lifeBeatOptionsFor` is the only road
   *  to the priced set either way.
   *
   *  ⚠ ⚠ DRAFT – every label below is the builder's draft for the owner's pass (invariant 4; the
   *  wave's T8 strings table is where he reads them), and the four PRICES are drafts too: the spec
   *  asked for the `'ended'` deltas MIRRORED rather than for a spread the builder invented
   *  (`ECONOMY.divorce`'s own block argues it).
   *
   *  ⚠⚠ THE FOURTH KIND WITH NO FREE ANSWER, and unlike `'ended'` it is read-INDEPENDENT BY
   *  CONSTRUCTION rather than by two absences: the overlay below names `space` and `company` only,
   *  and `DRAIN_ANSWER['divorced']` = `sort` costs −1 under every reading – an arithmetic a bench can
   *  print (`tools/_lifeBeats.ts`, `drainSkewLine`).
   *
   *  ⚠⚠ AND THE THIRD LABEL IS WHERE THIS POOL PARTS FROM THE ENDING'S, WHICH IS THE ONE WORDING
   *  DECISION IN IT. The break-up offers «Offer to help put it right» – a parent trying to MEND the
   *  relationship. That answer is not available here: a marriage this card is raised about is already
   *  over (`endEpisode` ran four lines above the raise), and a parent offering to fix it would be
   *  offered a power the game does not hold. What a parent CAN do is help with the practical wreckage,
   *  which is what the label says and is the same instinct landing somewhere true.
   *
   *  ⚠⚠ THE FOURTH SAYS «THEM» AND NOT «HIM», AND THE FIRST DRAFT GOT THAT WRONG. It read «better
   *  off without him», on the reasoning that a marriage licenses the pronoun – and
   *  `tests/coach-voice.test.ts`'s R15-7 sweep refused it, correctly: `LoveEpisode` PERSISTS NO
   *  GENDER, from the arrival through the wedding to this card, so «him» is a fact the world does
   *  not hold however obvious it feels. The `'ended'` pool's own note says the same thing three
   *  sections up – «them is the only honest word for whoever is gone» – and this label is that rule
   *  inherited rather than re-argued. ⚠ The NAME is refused too, for a different reason: the schema
   *  has carried one since v83, but which surfaces speak it is the owner's question and a button
   *  that spoke it would settle it by default. ⚠ AND
   *  NO NUMBER, NO PRICE, NO METER in any of them, and the LABELS ARE UNTOUCHED BY THE FLIP – same
   *  four sentences, same order, same ids, both readings. A button that changed its words with its
   *  price would be the meter one step removed. */
```

### `LIFE_BEAT_OPTIONS` – v83 (the wedding, wave 7 – T2) – the three

```ts
  /** ⭐⭐⭐ v83 (the wedding, wave 7 – T2) – THE THREE THE ANNOUNCEMENT OFFERS: the research digest's
   *  own triple, bless / keep distance / oppose, priced in `ECONOMY.wedding` (drafted +2.5 / −1 /
   *  −4, benched in T8, his word after the numbers).
   *
   *  ⚠ ⚠ DRAFT – every label below is the builder's draft for the owner's pass (invariant 4; the
   *  wave's T7 strings table is where he reads them).
   *
   *  ⚠⚠ THE SECOND KIND WITH NO FREE ANSWER, and unlike `'ended'` it is read-independent BY
   *  CONSTRUCTION rather than by two absences: no overlay in `lifeBeatOptionsFor` names this kind,
   *  so the priced set is the same object under every `wants` and every ends-read, and
   *  `DRAIN_ANSWER['engaged']` = `distance` drains at the one −1 a harness can state.
   *
   *  ⚠ THE LABELS NAME NO GENDER (them, it – the schema persists a NAME from this beat on, never a
   *  gender), NO NUMBER, NO PRICE AND NO METER (the fence). And none of them promises to stop
   *  anything: the wedding lands whatever is said (T3), so a button reading «forbid it» would be a
   *  power the game does not hold – opposing is a thing said to her, not a veto. */
```

### `LIFE_BEAT_OPTIONS` – v83 (wave 7 – T5) – the three the spouse's word

```ts
  /** ⭐⭐ v83 (wave 7 – T5) – THE THREE THE SPOUSE'S WORD OFFERS, and they are ONE set for all four
   *  occasions, which is tier 1's own precedent quoted at its table above: «three parent moves that
   *  fit a worry, a joy or a question alike, because the answer set is keyed on the KIND and her
   *  subject is a fact on the row». The occasion is the row's `detail`; the parent's three moves –
   *  hear it out, hold the season's line, wave it off – fit each of the four. ⚠ Per-occasion WORDS,
   *  if the owner wants them, are one label overlay away (round 42 #15's own machinery, the fourth
   *  parameter of `lifeBeatOptionsFor`) and are flagged as a question in T7's table, not taken.
   *
   *  ⚠ ⚠ DRAFT – every label below is the builder's draft for the owner's pass (invariant 4).
   *
   *  ⚠⚠ THE THIRD KIND WITH NO FREE ANSWER, priced SMALL by design (the brief's ±0.5..±1.5): a word
   *  about her marriage is never free, and never large – the marriage's standing is texture, not
   *  economy. Read-independent BY CONSTRUCTION (`'engaged'`'s own shape): no overlay names this
   *  kind, so the priced set is the same object under every reading and
   *  `DRAIN_ANSWER['spouse-view']` = `level` drains at the one −0.5 a harness can state.
   *
   *  ⚠ THE LABELS NAME NO GENDER (the §3h banner's law), NO NUMBER, NO PRICE AND NO METER (the
   *  fence). And none of them promises an outcome – what the family DOES about a season is the
   *  planner's, and a button reading «skip the trip» would be a second, unpriced planner. */
```

### `LIFE_BEAT_OPTIONS` – v85 (the pregnancy, wave 8 – T2) – the three

```ts
  /** ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – THE THREE THE ANNOUNCEMENT OFFERS, and they are the
   *  RESEARCH's own finding made mechanical rather than a triple somebody liked the sound of. The
   *  digest's row is «First pregnancy … support only – reaction sets recovery trajectory»: the parent
   *  has no lever over the pregnancy, and what he DOES have is the reaction, which is why these three
   *  are graded joy / worry / the career first and why the grade is PERSISTED (`support` on
   *  `world.pregnancy`) instead of evaporating with the card. Priced in `ECONOMY.motherhood` (drafted
   *  +2.5 / −0.5 / −4, the brief's own figures, benched in T9, his word after the numbers).
   *
   *  ⚠ ⚠ DRAFT – every label below is the builder's draft for the owner's pass (invariant 4; T8's
   *  strings table is where he reads them).
   *
   *  ⚠⚠ THE THIRD KIND WITH NO FREE ANSWER, after `'ended'` and `'engaged'`, and deliberately: an
   *  announcement like this is not a card a parent can answer without it meaning something. Like
   *  `'engaged'` it is read-independent BY CONSTRUCTION rather than by two absences – no overlay in
   *  `lifeBeatOptionsFor` names this kind, so the priced set is the same object under every `wants`
   *  and every ends-read, and `DRAIN_ANSWER['expecting']` = `worry` drains at the one −0.5 a harness
   *  can state (`'spouse-view'`'s precedent: the registry names the MILDEST of a kind with no zero).
   *
   *  ⚠ NONE OF THEM STOPS ANYTHING, and that is stronger here than at the wedding. The record is
   *  written at the RAISE, so the world is already carrying the pregnancy while this card stands; a
   *  button reading «tell her it is a mistake» would be offering a power the game does not hold and
   *  never will. ⚠ THE LABELS NAME NO GENDER (hers, his, or the child's – §3j's two laws), NO NUMBER,
   *  NO PRICE AND NO METER (the fence). */
```

### `LIFE_BEAT_OPTIONS` – v87 T3 – the reasonable position, not a villain's line

```ts
    // ⭐⭐⭐ v87 T3 – **THE REASONABLE POSITION, NOT A VILLAIN'S LINE**, and it is the design's own
    // §5 asking for it: «the third answer's words are today the career-first one, and they should be
    // allowed to be *reasonable* – «not now, look where you are» is a position, not a villain's line».
    // The words he gave the case are the ones a real parent uses: «рано, у тебя карьера в апогее».
    //
    // ⚠⚠ THE GRADE DID NOT MOVE AND MUST NOT – wave 8b's C3 correction, one row up, read forward.
    // This answer still persists `support: 'cold'` and still costs −4, because the research's row is
    // about PRESSURE and a parent who answers a pregnancy by pricing her ranking is the parent that
    // row means. What changed is that he now says a thing a reader can DISAGREE with rather than a
    // thing a reader can only dislike: §5's other half is that the game must not settle who was
    // right, and a villain's line settles it before the album gets the chance not to.
    //
    // ⚠ THE OLD LABEL WAS «Ask her what this does to the tennis» and is quoted verbatim in the
    // wave's report beside this one (invariant 4's corollary: the owner reads the replacement beside
    // what it replaced). ⚠ DRAFT, like the row above it.
```

### `LIFE_BEAT_OPTIONS` – v85 (the return, wave 8 – T6) – the ramp's two

```ts
  /** ⭐⭐⭐ v85 (the return, wave 8 – T6) – THE RAMP'S TWO, AND THE ONLY CARD IN THIS TABLE THAT IS A
   *  SCHEDULING DECISION RATHER THAN A REACTION (§3k's banner carries the §4a argument in full: she has
   *  already decided to go back; what a season is built out of is the parent's job, on the college
   *  fork's own precedent).
   *
   *  ⚠⚠ BOTH AT **0 BOND**, AND THE ZERO IS THE DESIGN RATHER THAN A DEFAULT – see §3k. In one line:
   *  §4a.2's law is that HIS WORDS move `bond`, and this answer is a calendar rather than a word to her;
   *  and the price of it is paid IN TENNIS, so a delta on top would make one answer «the nice one» on
   *  the one card whose whole purpose is that its cost is mechanical and emergent.
   *  ⚠ NO NUMBER, NO DATE AND NO PROMISE IN EITHER LABEL (rule 4), and neither names the freeze: how
   *  many entries a protected ranking buys is a rule the card may not turn into a guarantee. */
  /** ⭐⭐⭐ v87 (the weight, wave 11 – T5) – **ONE ANSWER, AT 0 BOND, AND BOTH HALVES OF THAT ARE
   *  DECISIONS.** `'own-key'`'s one-cell pool is the precedent and its argument transfers whole.
   *
   *  ⚠⚠ ONE ANSWER, BECAUSE THE SPEC DRAFTS NO PRICES AND INVENTING THREE WOULD BE A DESIGN
   *  DECISION WEARING A CONSTANT. Every other costed card in this table has its numbers in
   *  `ECONOMY` with an argument beside them (`wedding`'s +2.5/−1/−4, `motherhood`'s
   *  +2.5/−0.5/−4); §4 of the weight spec drafts none for this kind, and invariant 5 is why a
   *  builder does not supply them. What the spec DOES say is that the death «may reach the parent in
   *  WORDS only», which is exactly a card that tells him and takes one answer.
   *
   *  ⚠⚠ AND 0 BECAUSE §4a's LAW SAYS HIS WORDS MOVE `bond` AND THIS IS NOT A WORD TO HER, IT IS AN
   *  UNDERTAKING. `'return-plan'`'s pair is the nearest shape and its zero is argued the same way. A
   *  delta here would make going to a funeral a thing the game scores, which is the one reading of
   *  §4 that is wrong.
   *  ⚠ IT NAMES NO RELATIVE (RULED 22.09, question 4 – the deceased is UNNAMED in mechanics AND in
   *  copy), no date, no number and no meter. ⚠ DRAFT. */
```

### `MET_BOND_PRIVATE` – v74 T7 – the wants flip, as an overlay and never as a second table

```ts
/** ⭐⭐⭐ v74 T7 – THE WANTS FLIP, AS AN OVERLAY AND NEVER AS A SECOND TABLE. A girl whose drawn
 *  `wants` is `'private'` reads silence as the kindness and warmth as the thing that puts it in the
 *  room; the other two answers are the same act whatever she asked for, so they are ABSENT here.
 *
 *  ⚠⚠ THE ABSENCE IS THE LOAD-BEARING HALF AND IT IS WHY THIS IS AN OVERLAY. `'met'` must keep
 *  exactly one BOND-NEUTRAL answer under BOTH readings: `tools/_lifeBeats.ts`' `drainLifeBeats` is
 *  how forty tools, `npm run e2e:fixtures` and `tests/helpers/career.ts` walk careers past a beat
 *  they never meant to price, it takes the option whose delta is zero, and it THROWS rather than
 *  pick a costed one. A flip written as a COPY of the four rows could drift `wary` off zero in one
 *  careless edit and move every bond number those benches measure – `npm run check` staying green
 *  the whole way, because all of it typechecks. Overlaying two rows makes the zero literally the
 *  same zero. `tests/wave3-reaction.test.ts` §D pins it over every kind x every `wants`.
 *
 *  ⚠ AND NOTHING PRINTS EITHER NUMBER: the read reaches the player through `MET_HER_LINE`,
 *  `MET_MENTION`, `MET_DRY` and `MET_EVENT` – wording, never a mark. */
```

### `ENDED_BOND_COMPANY` – v75 T4 – the ending's flip

```ts
/** ⭐⭐⭐ v75 T4 – THE ENDING'S FLIP, AND IT IS `MET_BOND_PRIVATE`'s SHAPE DELIBERATELY, DOWN TO THE
 *  ARGUMENT FOR THE ABSENCES. A girl whose drawn read is `'company'` wants her parent near her; the
 *  base list is the other read, so the only two rows that move are the two the read is ABOUT.
 *
 *  ⚠⚠ THE ABSENCE OF `fix-it` AND `blame` IS THE LOAD-BEARING HALF, exactly as `wary`'s and `meet`'s
 *  is one table up. Overlaying two rows makes «−1 always» literally the same −1 in both readings
 *  rather than two numbers that happen to agree – and `tools/_lifeBeats.ts` drains this kind through
 *  that −1, with `drainCostOf` refusing outright if the two readings ever disagree. A flip written as
 *  a COPY of the four rows could drift `fix-it` off −1 in one careless edit and move every bond
 *  number forty benches measure, with `npm run check` green the whole way, because all of it
 *  typechecks. `blame` is absent for the ruling's own reason as well: «some things are wrong
 *  regardless of what she wanted».
 *
 *  ⚠ AND NOTHING PRINTS EITHER NUMBER: the read reaches the player through `ENDED_HEADING` and
 *  `ENDED_LATE_EVENT` – wording, never a mark. */
```

### `DIVORCED_BOND_COMPANY` – v88 (the parting, wave 12) – the same flip one rung up

```ts
/** ⭐⭐ v88 (the parting, wave 12) – THE SAME FLIP ONE RUNG UP, and it is a SECOND RECORD rather than
 *  a reuse of the one above although the two hold equal numbers today. The reason is the one
 *  `ENDED_BOND_COMPANY`'s own note gives for not being a copy of the base list: these are
 *  `ECONOMY.divorce`'s rows and those are `ECONOMY.bond.delta`'s, they are drafted to MIRROR and the
 *  owner may un-mirror either at review, and a shared record would silently re-price whichever card
 *  he did not mean to touch. ⚠ `sort` AND `dismiss` ARE ABSENT ON PURPOSE and the absence is
 *  load-bearing: it is what keeps `DRAIN_ANSWER['divorced']` = `sort` at one statable −1 under every
 *  reading, with `drainCostOf` refusing outright if the two readings ever disagree. */
```

### `EXPECTING_SUPPORT` – v85 (the pregnancy, wave 8 – T2) – what each answer is worth months later

```ts
/** ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – WHAT EACH ANSWER IS WORTH **MONTHS LATER**: the parent's
 *  word at the `'expecting'` card, graded onto `world.pregnancy.support` by `answerLifeBeat`. The two
 *  overlays above are the same SHAPE and a different job – they re-price an answer, this one records
 *  what the answer WAS – and it sits beside them because both are records keyed by option id, which
 *  is the one thing that must never drift from `LIFE_BEAT_OPTIONS`.
 *
 *  ⚠⚠ IT IS A SECOND CONSEQUENCE AND NOT A SECOND METER, which is the brief's own fence («one
 *  answer, two consequences, zero new meters»). Nothing here is tunable and nothing is summed: the
 *  three grades are the three answers with the bond delta taken off, so a future retune of
 *  `ECONOMY.motherhood.joyBond` cannot silently re-grade a pregnancy, and a re-grade cannot silently
 *  re-price a card.
 *
 *  ⚠ THE GRADE IS THE ANSWER'S OWN NAME AND NOT ITS SIGN. `worry` is `'measured'` rather than
 *  `'cold'` although it is priced negative, because the research's row is about the RECOVERY
 *  trajectory and a parent who says «we are glad, and we will worry» is not the parent the row means
 *  by pressure. The one that is is `career-first`, which answers a pregnancy by asking about the
 *  ranking – «support speeds recovery; pressure → depression risk ↑», the digest's own next line.
 *
 *  ⚠ TOTAL OVER THE KIND'S OPTION IDS, and `tests/wave8-pregnancy.test.ts` §D is what says so – the
 *  ids are strings rather than a union, so the type cannot carry that claim and a test has to.
 *  `answerLifeBeat` throws BY NAME on a miss rather than writing `undefined` onto the field. */
```

### `lifeBeatOptionsFor` – v74 T7 – the answer set as this girl prices it

```ts
/** ⭐⭐⭐ v74 T7 – THE ANSWER SET **AS THIS GIRL PRICES IT**, and the one road to it. Every reader of
 *  a beat's answers goes through here: `buildLifeBeatPrompt` to render the card, `answerLifeBeat` to
 *  charge it, `pendingLifeBeatOptions` for everything outside the engine. Two readings of one price
 *  list is exactly the disagreement rule 3 exists to prevent, so there is one function.
 *
 *  ⚠ `'fork-opinion'` IGNORES `wants` ENTIRELY and that is not an oversight: her attachment has a
 *  `wants` and her college answer does not, and the parameter is meaningless on that kind rather
 *  than merely unused. Only `'met'` flips.
 *
 *  ⚠ THE LABELS ARE UNTOUCHED BY THE FLIP – same four sentences, same order, same ids, in both
 *  readings. A button that changed its words with the price would be the meter this wave refuses to
 *  build, one step removed.
 *
 *  ⭐⭐⭐ v75 T4 – THE THIRD PARAMETER IS THE ENDING'S READ, AND THE FUNCTION GREW RATHER THAN GAINING
 *  A SIBLING (ruling G.3, in its own words: «`lifeBeatOptionsFor` stays the ONE road to a priced
 *  answer set. It grows the kind; it does not grow a sibling»). `pendingLifeBeatOptions`,
 *  `buildLifeBeatPrompt`, `answerLifeBeat` and `tools/_lifeBeats.ts` all keep reaching prices through
 *  here, so «what would this answer cost» has exactly one reading no matter which kind is asking.
 *
 *  ⚠ IT DEFAULTS TO `'space'` FOR `wants`' OWN REASON, and the default is a SHIPPED reading rather
 *  than a neutral stand-in: `LIFE_BEAT_OPTIONS.ended` is the `'space'` column, so a caller that has
 *  no read to hand gets the base table and never a price nobody chose. Every real call comes through
 *  `beatEndsRead`, which derives it from the episode's own `endedWeek`.
 *
 *  ⚠⚠ THE TWO AXES ARE INDEPENDENT AND EACH REACHES ONE KIND. `wants` is meaningless on `'ended'`
 *  (her attachment's disclosure preference is not what she needs the week after it stops) and the
 *  read is meaningless on `'met'`; neither is merely unused on the other, and pretending one axis
 *  could serve both would be the `endsMult`/`temperamentMult` collapse (ruling E) in the copy layer. */
```

### `lifeBeatOptionsFor` – Round 42 #15 – the fourth is a label overlay

```ts
  // ⭐⭐⭐ ROUND 42 #15 – THE FOURTH IS A **LABEL** OVERLAY, AND IT IS THE THIRD'S OWN SHAPE POINTED AT
  // THE OTHER HALF OF AN ANSWER. `MET_BOND_PRIVATE` and `ENDED_BOND_COMPANY` overlay the PRICE by
  // option id; this overlays the WORDS by option id, and the function still grows rather than gaining
  // a sibling (ruling G.3), so «what does this beat offer» keeps one reading.
  //
  // ⚠⚠ IT EXISTS FOR §8d.1 AND FOR NOTHING ELSE: «a `respond` branch must name the parent's actual
  // opinion», which makes the words per SITUATION where the price stays per kind. `'small-talk'`'s
  // three prices are literal zeroes under every overlay, so nothing here can move a number – the
  // labels and the ledger are on opposite sides of the fence and this parameter is on the label side.
  //
  // ⚠ UNDEFINED IS THE BASE TABLE, which is the shipped reading and not a neutral stand-in: a legacy
  // row (and every other kind) reads `LIFE_BEAT_OPTIONS` exactly as it always has. ⚠ AND AN ID THE
  // OVERLAY DOES NOT NAME KEEPS ITS OWN LABEL, the price overlay's own `undefined` rule.
```

### `ANSWER_EVENT` – The feed line each answer writes, per kind

```ts
/** The feed line each answer writes, per kind. ⚠ NO `amountCents` AND NO PRICE IN ANY WORD OF IT
 *  (rule 4). ⚠ Keyed by kind for `LIFE_BEAT_OPTIONS`' own reason: two beats can share an option id
 *  no more than they share an answer set.
 *
 *  ⭐⭐ v74 T8 – AND `null` IS A KIND THAT WRITES NO ROW AT ALL, WHICH IS A DECISION RATHER THAN A
 *  GAP. `'small-talk'` fires up to four times a season and its whole point is texture; a feed row
 *  per answer would bury the private-life thread T9's glyph column exists to make findable under the
 *  parent's own replies to it. The `lifeLog` row is the record, and it is also the counter.
 *
 *  ⚠ THE RECORD STAYS **TOTAL** ON PURPOSE. `Partial<Record<…>>` would have let the next kind ship
 *  with no line by forgetting one; a `| null` makes «this kind writes nothing» a sentence somebody
 *  had to type, and a missing kind is still a compile error. */
```

### `ANSWER_EVENT` – v76 T8 – and his call writes one too

```ts
  // ⭐⭐⭐ v76 T8 – AND HIS CALL WRITES ONE TOO, for `'fork-counsel'`'s reason exactly: this fires at
  // most once in a career, on the biggest week of it, and a stop the seat had a view about and a stop
  // it was never asked about are two different biographies that only the row can tell apart later.
  // ⚠ IT IS AN `'info'` ROW AND CARRIES NO `lifeKind`, WHICH IS NOT A CHOICE THIS POOL MAKES – every
  // kind's answer line goes through the ONE `addEvent` at the foot of `answerLifeBeat`, typed `'info'`
  // since wave 2, and `tests/wave4-life-row-stamp.test.ts` §A pins that the answer row is deliberately
  // not a life row. So this kind adds NO `type: 'life'` write site, the glyph column is not asked a
  // question it cannot answer, and `LIFE_BEAT_ROW_KINDS` does not grow. Measured, not assumed.
  // ⚠ NO `amountCents` AND NO PRICE IN EITHER LINE (rule 4), and neither names what the read was –
  // the read was the card's, and the feed records that the call happened and what the parent did.
  // ⚠ AND NEITHER NAMES THE SHOCK. The register that worded the card does not reach the feed at all:
  // a kept row saying «after the break-up» would outlive the card and tell a parent who was never told
  // there was anybody a thing the game has not told him.
```

### `ANSWER_EVENT` – v75 T4 – and the ending writes one

```ts
  /** ⭐⭐⭐ v75 T4 – AND THE ENDING WRITES ONE, for `'fork-counsel'`'s reason rather than tier 1's:
   *  a break-up the parent met well and one he met badly are two different biographies, and only the
   *  row can tell them apart seasons later when the feed is what the career is read back through.
   *
   *  ⚠ FOUR LINES, ONE PER ANSWER, AND NO READ AXIS. What the ROW records is what the parent DID,
   *  which is the same act whichever way her read came out; whether it was the thing she wanted is
   *  the card's own surface (`ENDED_HEADING`) and the told-late delivery row's. A feed line that
   *  scored the answer would be the meter, written down. ⚠ T6 owns the full matrix and may split it.
   *
   *  ⚠ NO `amountCents` AND NO PRICE IN ANY WORD (rule 4), no name, no gender, no fault and no
   *  reason – the two-tier honesty law, which binds this pool exactly as hard as the card's.
   *
   *  ⭐ T6 READ ALL FOUR AND KEPT THEM BYTE-IDENTICAL, AND THE ONE THING IT WOULD HAVE CHANGED IS ON
   *  THE OWNER'S DESK INSTEAD. All four open on the same clause, and the kept `'ended'` row directly
   *  above them in the feed has just given the same news – so within the sixty weeks before
   *  `pruneEvents` takes the answer row, the pair reads as a restatement. ⚠ IT IS KEPT BECAUSE THE
   *  SHIPPED `met` FOUR DO EXACTLY THE SAME THING («There is someone in her life. We …»), so the
   *  repeated subject clause is this pool's established shape rather than this draft's slip, and
   *  breaking the parallel on one kind is a wording decision about a SHIPPED pool. Flagged in T6's
   *  package as a question; invariant 4 makes the answer his.
   *
   *  ⚠ AND THERE IS STILL NO READ AXIS HERE, which T6 re-confirmed against a contradiction rather than
   *  inheriting. The wave-4 brief's §2 T6 line reads «ANSWER_EVENT feed lines x4 (the read surfaces
   *  here in wording ONLY)»; ruling I (12.09, later) puts the read on «the HEADING and the told-late
   *  feed row» and enumerates its surfaces as «4 heading cells plus 2 feed rows», which is this pool
   *  excluded by count. The ruling wins on date and on arithmetic, and the row's own argument stands:
   *  what it records is what the parent DID, which is the same act whichever way her read came out. */
```

### `ANSWER_EVENT` – v88 (the parting, wave 12 – T1/T2)

```ts
  /** ⭐⭐⭐ v88 (the parting, wave 12 – T1/T2) – AND THE MARRIAGE'S ENDING WRITES ONE, for `'ended'`'s
   *  reason exactly: a divorce the parent gave room to and one he used to say what he had always
   *  thought are two different biographies, and only the row can tell them apart seasons later.
   *  Four lines, one per answer, opening on the same clause – the established parallel shape.
   *  ⚠ ⚠ DRAFT – every line below is the builder's draft (invariant 4, T8's table). ⚠ NO
   *  `amountCents` AND NO PRICE IN ANY WORD (rule 4): there is no money in this wave at all. ⚠ AND
   *  NO NAME – the episode has carried one since v83 and which surfaces speak it is the owner's
   *  question, so a feed row that jumped ahead of that ruling would be a wording decision taken for
   *  him. ⚠ AND NO GENDER EITHER – «them», not «him», which the R15-7 sweep caught this pool getting
   *  wrong on its first draft: `LoveEpisode` persists no gender for a partner at any point in the
   *  arc, so the pronoun is a guess however married the two of them are. The option pool's own note
   *  carries the full argument. */
```

### `ANSWER_EVENT` – v83 (the wedding, wave 7 – T2)

```ts
  /** ⭐⭐⭐ v83 (the wedding, wave 7 – T2) – AND THE ANNOUNCEMENT WRITES ONE, for `'ended'`'s reason
   *  exactly: an engagement the parent blessed and one he opposed are two different biographies, and
   *  only the row can tell them apart seasons later. Three lines, one per answer, opening on the
   *  same clause – the `met`/`ended` pools' established parallel shape, kept deliberately.
   *  ⚠ ⚠ DRAFT – every line below is the builder's draft for the owner's pass (invariant 4, T7's
   *  table). ⚠ NO `amountCents` AND NO PRICE IN ANY WORD (rule 4) – the wedding's COST is T3's own
   *  ledger event on the wedding week, never this row's; no name and no gender either, because at
   *  the ANSWER the name is on the episode but which surfaces speak it is T5+/T7's question, and a
   *  feed row that jumped ahead of that ruling would be a wording decision taken for him. */
```

### `ANSWER_EVENT` – v85 (the pregnancy, wave 8 – T2)

```ts
  /** ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – AND THE ANNOUNCEMENT WRITES ONE, for `'engaged'`'s
   *  reason at a bigger moment: a pregnancy the parent met with joy and one he met by asking about
   *  the ranking are two different biographies, and only the row can tell them apart seasons later
   *  when the feed is what the career is read back through. It is also the one surface that records
   *  the answer at all inside the sixty-week prune window – the `support` grade is on the pregnancy
   *  and dies with it, and the `lifeLog` row holds the id and not the sentence.
   *  ⚠ ⚠ DRAFT – every line below is the builder's draft for the owner's pass (invariant 4, T8's
   *  table). Three lines, one per answer, opening on the same clause: the `met` / `ended` / `engaged`
   *  pools' established parallel, kept deliberately rather than broken on one kind.
   *  ⚠ NO `amountCents` AND NO PRICE IN ANY WORD (rule 4) – there is no birth fee and no wedding bill
   *  here to name (§2 T4's own «NO COST EVENT»). ⚠ NO NAME, NO GENDER AND NO DUE DATE, §3j's laws. */
  /** ⭐⭐⭐ v87 T5 – ONE LINE FOR ONE ANSWER. ⚠ ⠀DRAFT. ⚠ IT NAMES NOBODY (RULED 22.09, question 4),
   *  no date and no number, and it says what the parent DID rather than what it meant. */
```

### `lifeStageOf` – Where she is living this week, for the wording alone

```ts
/** ⭐⭐ WHERE SHE IS LIVING THIS WEEK, for the WORDING alone – the presence law's one input, read off
 *  the world through the diary's own single derivation (`diaryLifeStageFor`) so a life beat and the
 *  week note under the same painting can never disagree about which stage she is in.
 *
 *  ⚠ THE `inCollege` TEST IS STRUCTURAL RATHER THAN THE FUNCTION, and it is `world/snapshot.ts`'
 *  OWN precedent copied with its reason: `world/college.ts` is the heavy middle of the package and
 *  this file is imported BY `endings.ts`, which imports college in turn – so the import would be a
 *  new arrow into a module that already has one pointing here. The comparison is two lines and has
 *  an inlined twin in `world/medical.ts` for the same kind of reason. ⚠ It is NOT a second reading
 *  of the STAGE, which is the fact that matters: `diaryLifeStageFor` is still the one place the
 *  four stages are cut.
 *
 *  ⚠ EXPORTED 28.09 BY T6.10 for `world/lifeBeat/smallTalk.ts` (and `…/ownKey.ts` when §13 can move).
 *  The sentence above is why it is shared and not copied: `diaryLifeStageFor` stays the ONE place the
 *  four stages are cut, and a kind module re-cutting them would be a second reading of the stage. Not
 *  on the barrel. */
```

### `lifeStageAt` – Round 42 #15 – the same read, at an arbitrary week

```ts
/** ⭐⭐⭐ ROUND 42 #15 – THE SAME READ, AT AN ARBITRARY WEEK, AND IT IS A CRASH FIX RATHER THAN A
 *  generalisation for its own sake.
 *
 *  ⚠⚠ THE BUG IT CLOSES, written down because it is subtle and it BRICKS A CAREER. A tier-1 row is
 *  SOFT: it lives for three weeks and the card is re-assembled on every `toSnapshot` in that window.
 *  The situation it names declares the stages it may be drawn at, and a roof-only scene («She was
 *  straight into it before her bag was down») has no call frame at all. So a row raised in the last
 *  weeks of school, left unanswered across the week `schoolIsOver` flips – or across the week college
 *  opens – would be re-worded at a stage its own copy has no line for, and `smallTalkOpener` throws
 *  inside the snapshot the whole app renders from. Rare, silent to write, and fatal to the save.
 *
 *  ⭐ AND THE FIX IS ALSO THE HONEST READING, which is what makes it the right one rather than a
 *  guard. The beat is a SCENE, and the scene happened on the row's own week: a conversation that has
 *  been waiting two weeks to be heard did not move house while it waited. `lifeBeatPromptFor` hands
 *  in `row.week` for that reason, which is `'fork-counsel'`'s «stamped, never re-derived» argument
 *  applied to the one fact that was still being re-derived.
 *
 *  ⚠ IT IS BEHAVIOUR-IDENTICAL FOR EVERY BLOCKING KIND, and that is checkable rather than hoped: a
 *  blocking row stops the week (`advanceWeeks` and `answerFork` both refuse while one is unanswered),
 *  so `row.week === world.week` on every one of them and this returns exactly what it always did.
 *  ⚠ AND IT HAS ONE FEWER EXCEPTION SINCE 26.09 (B-P3-07, re-aimed on B-01's ruling 2(a)): the claim
 *  above USED TO BE FALSE INSIDE `resumeFromCollege`, which ticked a whole year past an unanswered
 *  blocking row – 23 of 217 year-calls did – so a beat raised in April was worded in December and
 *  this function's `week` argument was the only thing keeping that row in its own room. The loop now
 *  pauses on `'life'` (`COLLEGE_PAUSES`, world/multiWeek.ts), so the sentence holds everywhere; the
 *  `week` argument stays, because a SOFT row still waits three weeks and that was always its reason.
 *
 *  ⚠ `fromWeek` JOINS THE COLLEGE TEST HERE and does not change today's answer either: at
 *  `world.week` a live college freeze always satisfies it. It is needed because an EARLIER week may
 *  be before the freeze began, and without it a row raised at `after-school` would read `college`. */
```

### `lifeBeatSaid` – The line she says, assembled

```ts
/** ⭐⭐ THE LINE SHE SAYS, ASSEMBLED. Exported so the completeness pin can walk kind x temperament x
 *  register x want without mounting a world – §5b's line item 3: «a test walking beatKind x
 *  temperament x register that FAILS on a missing variant, so a `quiet` girl can never silently
 *  receive a `fiery` girl's line as a fallback. (The flat pool is the one legal shared fallback, and
 *  only at strained/cold.)»
 *
 *  ⭐ v74 T7 – `wants` IS THE LAST PARAMETER AND IT DEFAULTS TO `'open'`, which is a statement about
 *  the two kinds and not a convenience. `'fork-opinion'` has no `wants` at all – her college answer
 *  is not an attachment – so a default lets wave 2's whole pin sweep keep calling this with five
 *  arguments and keep asserting, byte for byte, the lines it was written against. `'met'` is always
 *  called with the episode's own reading (`buildLifeBeatPrompt` -> `beatWants`), and the default
 *  `'open'` is T6's shipped reading rather than a neutral stand-in.
 *
 *  ⭐ 11.09 – `stage` IS THE SEVENTH AND IT IS THREADED EXACTLY AS `wants` WAS, for exactly the same
 *  reason: an added parameter with a safe default, so wave 2's whole pin sweep keeps calling this
 *  with five arguments and keeps asserting the lines it was written against. The default is
 *  `'school'`, which is a ROOF stage – T6's and T8's shipped reading, not a neutral stand-in – and
 *  every real call comes through `lifeBeatPromptFor`, which derives the stage from the world.
 *
 *  ⚠ IT TAKES THE STAGE AND NOT A `BeatPresence`, so the ONE place the roof/away cut is made is
 *  `presenceOf` above (which asks `awayVoice`, which is the single copy of the rule). A caller that
 *  could hand in a presence directly would be a second reading of «is she under this roof».
 *
 *  ⭐ ROUND 44 – `frame` IS THE TENTH AND IT IS THREADED EXACTLY AS `wants`, `stage`, `driver` AND
 *  `endsRegister` WERE: a parameter with a safe default, so every pin waves 2 to 6 wrote keeps
 *  calling this with five to nine arguments and keeps asserting the lines it was written against.
 *  ⚠ THE DEFAULT IS `undefined` AND IT IS THE PRE-v81 READING RATHER THAN A NEUTRAL STAND-IN: the
 *  first line of the presence's pool is exactly what the shipped catalogue wrapped `practice-clicked`
 *  in, so an un-stamped call renders the sentence the owner already read. See `smallTalkFrameOf`. */
```

### `lifeBeatSaid` – v74 T8 – the third kind

```ts
    // ⭐ v74 T8 – THE THIRD KIND. ⚠ IT READS THE ROW'S OWN `detail` AND NOT THIS WEEK'S REGISTER,
    // which is `'fork-opinion'`'s shape and is the honest one: the subject she came with is a fact
    // the row recorded when it was raised, so a re-derivation cannot hand a girl who came with a
    // worry the line she would have said in a brighter week. ⚠ AND IT READS NO `bond`: the band
    // decides whether this beat exists at all (0 at strained/cold) and never how it sounds, so there
    // is no flat pool to select – see the §3c banner.
    // ⭐⭐⭐ ROUND 42 #15/#24 – TWO ROADS, AND THE SHAPE OF THE DETAIL IS WHICH. A row raised since
    // this round carries `'<subject>:<situation>'` and opens with the situation's own line; a row
    // raised before it carries one of the three legacy subjects and opens with the pool that shipped.
    // ⚠ THE LEGACY BRANCH IS NOT DEAD CODE AND IS NOT ONLY FOR OLD SAVES: `rollSmallTalk` still
    // raises a legacy row on any week no situation is reachable for this girl at this stage, which
    // is the catalogue being thin on purpose (spec §10).
```

### `lifeBeatSaid` – v76 T8 – the sixth kind, and it reads its own detail

```ts
    // ⭐⭐⭐ v76 T8 – THE SIXTH KIND, AND IT READS ITS OWN `detail` EXACTLY AS THE COACH DOES. Two
    // fields rather than one, `'<register>:<driver>'`: the driver half is the same reading her own
    // line was worded from, and the register half is the shock that was live at the raise. ⚠ BOTH ARE
    // STAMPED AND NEITHER IS RE-DERIVED, which is `'fork-counsel'`'s own argument and not a new one –
    // this function is called on EVERY snapshot, so a re-derived register would re-decide the card's
    // wording after every command, and the row must stay reconstructible for the life of the career.
    // ⚠ IT READS NO `voice`, NO `bond` AND NO `register`: he is not her, he is not the relationship,
    // and the week is hers – see the §3f banner.
```

### `lifeBeatSaid` – v85 T1 – a register may exist without its column

```ts
      // ⭐ v85 T1 – A REGISTER MAY EXIST WITHOUT ITS COLUMN (see `PSY_COUNSEL`'s `postpartum` cell:
      // the kind widened before its copy was drafted, and copy is T8's). ⚠ IT THROWS BY NAME rather
      // than indexing `null`, so the day a kind ships ahead of its column the message says which
      // column is owed – the same courtesy the line above pays a malformed detail.
      // ⚠⚠ AND THIS IS A GUARD FOR A FUTURE WAVE, NOT FOR T4. `PSY_COUNSEL`'s own `postpartum` block
      // proves the two windows cannot overlap – the fork is answered at 18.0–18.9 and BLOCKS until it
      // is, and a postpartum shock cannot exist before ~24 – so nothing T4 ships can reach this line.
      // It fires the day somebody raises `'fork-psy'` from outside the fork, which is exactly when a
      // silent `undefined[driver]` would be hardest to trace.
```

### `lifeBeatSaid` – v75 T4 – the fifth kind

```ts
    // ⭐⭐⭐ v75 T4 – THE FIFTH KIND. ⚠ IT READS NO `detail` AND NO `register`, for `'met'`'s own two
    // reasons: its detail is an episode id (a machine value, never a rendered word) and the Mood
    // ladder is not this card's axis. What it reads instead is the TOLD-NOW / TOLD-LATE register,
    // which is derived from the `'met'` receipt one layer up (`beatEndsRegister`) and handed in – the
    // same shape `driver` arrives in, and for the same reason: this function is pure so the
    // completeness pin can walk every cell without posing a world.
    // ⚠⚠ AND IT READS NO `EndsRead`. The read moves the PRICE and the HEADING, never her line – see
    // the §3e banner, where that decision and its two grounds are written out.
```

### `lifeBeatSaid` – v83 (the wedding, wave 7 – T2) – the seventh kind

```ts
    // ⭐⭐⭐ v83 (the wedding, wave 7 – T2) – THE SEVENTH KIND. ⚠ IT READS NO `detail` AND NO
    // `register`, for `'met'`'s own two reasons: its detail is an episode id (a machine value, never
    // a rendered word) and the Mood ladder is not this card's axis – the announcement is her week's
    // biggest fact whatever the weather. ⚠ AND NO REGISTER AXIS OF ITS OWN, unlike `'ended'`: there
    // is no told-late wedding, because `rollWedding` raises the card on the week she decides and
    // nothing about it can be learned late. What it reads is the bond's two-rung channel – her own
    // voice against the dry card – which is `'ended'`'s shape one axis smaller.
    // ⚠⚠ AND NO `presence` SINCE 26.09 (ruling 19 on B-08), which is `'divorced'`'s reading arriving
    // here: this card fires at 23 or over and no stage at 23 is a roof stage, so the roof column was
    // four lines no career could show. `tests/principles-b08-presence-reach.test.ts` is the guard – a
    // `presenceLine(…)` read put back on this arm goes red there by name.
```

### `lifeBeatSaid` – v85 (the pregnancy, wave 8 – T2) – the tenth kind

```ts
    // ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – THE TENTH KIND, AND IT IS `'engaged'`'s READING LINE
    // FOR LINE, which is the point rather than a shortcut: the two are one scene at two moments. ⚠ IT
    // READS NO `detail` AND NO `register`, for `'met'`'s own two reasons – its detail is an episode
    // id (a machine value, never a rendered word) and the Mood ladder is not this card's axis, since
    // the announcement is her week's biggest fact whatever the weather. ⚠ AND NO REGISTER AXIS OF ITS
    // OWN: there is no told-late pregnancy, because `rollPregnancy` raises the card on the week the
    // hazard lands. What it reads is the bond's two-rung channel – her own voice against the dry
    // card. ⚠⚠ AND IT READS NOTHING ABOUT THE MARRIAGE, WHICH IS THE DECOUPLING LAW ARRIVING AT THE
    // WORDING (§14): the card is assembled from her voice and the house's distance, so a card
    // re-rendered in a week the carrying episode has since ended says exactly what it said before.
    // ⚠⚠ AND NO `presence` SINCE 26.09 (ruling 19 on B-08) – §3g's note, inherited: the latch this
    // card stands behind cannot be written before 23, and no stage at 23 is a roof stage. «The house's
    // distance» above is now the BOND's distance and not the stage's, which is what it always priced.
```

### `lifeBeatSaid` – v87 (the weight, wave 11 – T5) – the twelfth kind

```ts
    // ⭐⭐⭐ v87 (the weight, wave 11 – T5) – THE TWELFTH KIND, AND IT IS `'expecting'`'s READING
    // LINE FOR LINE: her voice against the dry card, on the bond's two-rung channel, and no register
    // axis of its own. ⚠ IT READS NO `detail` (the detail is the week, a machine value) AND NO
    // REGISTER: this is her week's biggest fact whatever the weather. ⚠⚠ AND OPENNESS REACHES IT
    // THROUGH THE VOICE CELLS THEMSELVES rather than through a second axis – §4's «private grieves
    // almost silently» is `quiet` and `deep` having less to say, which is what the four cells are.
    // ⚠⚠ AND NO `presence` SINCE 26.09 (ruling 19 on B-08) – §3g's note, inherited: the rung nothing
    // fires below is 23 and no stage at 23 is a roof stage.
```

### `lifeBeatSaid` – v88 (the parting, wave 12 – T1) – the thirteenth

```ts
    // ⭐⭐⭐ v88 (the parting, wave 12 – T1) – THE THIRTEENTH KIND, AND IT IS `'ended'`'s READING
    // WITH ONE AXIS TAKEN OUT. Her own voice against the dry card on the bond's two-rung channel,
    // exactly as the ending has since v75 – and NO `EndsRegister`, because a latched row always
    // holds the `'met'` receipt and there is no told-late divorce to select. ⚠ IT READS NO `detail`
    // (an episode id, a machine value) AND NO MOOD `register`: this is her week's biggest fact
    // whatever the weather, `'expecting'`'s and `'engaged'`'s own call.
    // ⚠⚠ AND IT READS NO `EndsRead` EITHER, which is `'ended'`'s §3e decision inherited whole: the
    // read moves the PRICE and the HEADING, never her line.
```

### `lifeBeatHeading` – v77 T6 – the seventh is the overtake, and false

```ts
  // ⭐⭐⭐ v77 T6 – THE SEVENTH IS THE OVERTAKE, and `false` – the default – is the STANDING frame,
  // byte for byte what shipped. It is defaulted exactly as the fourth, fifth and sixth are, so every
  // pin waves 2 to 5 wrote keeps calling this with three arguments and keeps asserting the frames it
  // was written against. ⚠ NO ARITY PIN COUNTS THIS FUNCTION'S PARAMETERS – measured 14.09 (the only
  // readers are `lifeBeatPromptFor` and six test files, none of which reads `.length`), so ruling A's
  // «a default must not walk past a pin that counts» does not reach here and ruling J's precedent
  // (`buildCommentary`'s two optional trailing parameters) is the one that does.
  // ⚠ `'met'` IS THE ONLY KIND THAT LOOKS AT IT: a fork, a small talk, a counsel and an ending have
  // no headline to have been read in, so a `true` here is simply not consulted.
```

### `LISTEN_FOLLOW_UP` – v85 T2 half (piece 2) – which kinds offer a listening detour

```ts
/** ⭐⭐⭐ v85 T2½ (piece 2) – WHICH KINDS OFFER A LISTENING DETOUR, DECLARED PER KIND AND **TOTAL BY
 *  TYPE**. `LIFE_BEAT_BLOCKING`'s own shape and its own argument, applied at the one place in this
 *  file that was not following it: «A `Record<LifeBeatKind, …>` AND NEVER A LIST … a list makes
 *  silence the default, and the next kind ships soft by FORGETTING. The total record makes a missing
 *  kind a COMPILE error, so «does this stop the week» is a sentence somebody had to type.»
 *
 *  ⚠⚠⚠ AND THE STAKE HERE IS HIGHER THAN THERE, WHICH IS WHY THE CHAIN THIS REPLACED WAS THE ONE
 *  PLACE A NEW KIND WENT WRONG IN **SILENCE**. Kept verbatim from the chain's own note, because it is
 *  the record of why this record exists: «The eight records this union keys are TOTAL and a tenth
 *  member reddens them on sight; this predicate is an `if`-chain with a `'fork-opinion'` TAIL, so a
 *  kind left out of it does not fail to compile – it falls through to `FORK_WANTS.find(...)`, finds
 *  no want on a detail that is an episode id, and THROWS from inside `lifeBeatPromptFor`, which is
 *  inside `toSnapshot`, which is what the whole app renders from. Round 42 #15 is the recorded
 *  instance of exactly this shape bricking a save, and its note two functions up says so.» Forgetting
 *  at `LIFE_BEAT_BLOCKING` ships a beat soft; forgetting HERE bricks a career.
 *
 *  ⚠⚠ THE CHAIN'S LAST SENTENCE IS SUPERSEDED AND IS QUOTED RATHER THAN DELETED, so the decision can
 *  be read in the order it was made. T2 wrote: «A total record here would be the structural fix and
 *  is NOT taken in this task – it would re-shape a wave-2 function eight kinds wide for a reason no
 *  brief asked for – but it is carried as a finding in T2's hand-back so the next union member is not
 *  left to luck.» The architect gated T2, read the finding, and took it as T2½ piece 2 – on the
 *  deciding argument that THIS WAVE ADDS ANOTHER KIND (T6's `'return-plan'`), so the wave's own last
 *  engine task was one forgotten clause away from the defect.
 *
 *  ⚠ `null` MEANS «NO DETOUR, AND HERE IS WHY» AND NEVER «NOT DECIDED YET» – `PSY_COUNSEL`'s cell
 *  shape with the opposite meaning, which is worth saying out loud one function apart: there a `null`
 *  is a column somebody still OWES, here it is the answer itself. Every cell below carries the reason
 *  its kind was given, in the words the kind was given it in, and a new kind cannot be added without
 *  writing one.
 *
 *  ⚠ BEHAVIOUR DID NOT MOVE BY ONE BYTE, and that is measured rather than asserted:
 *  tests/wave8-listen-follow-up.test.ts hashes this function's answer over all ten kinds x six
 *  details x four voices x four bond bands, and the digest was taken on the `if`-chain FIRST. */
```

### `LISTEN_FOLLOW_UP` – 'small-talk' returns null here, and that is no longer the whole story

```ts
  // ⚠⚠ `'small-talk'` RETURNS NULL HERE AND THAT IS NO LONGER THE WHOLE STORY – RE-AIMED BY ROUND 42
  // #15, and the note is kept rather than deleted because a reader has to be able to tell which half
  // expired. WHAT THIS FUNCTION SAYS IS STILL TRUE: tier 1 has no `listen` DETOUR, because it has no
  // `listen` answer – the fork's «say nothing, and let her talk» is not one of its three. WHAT
  // EXPIRED IS THE REASON v74 T8 GAVE FOR IT: «she came with something SMALL and has said it… a
  // second panel promising more of her would be the same fictional dishonesty the 10.09 ruling
  // removed from the fork.» The owner read that panel's ABSENCE as exactly that dishonesty from the
  // other side – «выбрал пункт, чтобы она сказала больше, а попап закрылся» – so tier 1 now answers
  // EVERY stance with a second line of hers. It is assembled in `lifeBeatFollowUps` below, off the
  // situation, and this function is not on that path at all.
```

### `LISTEN_FOLLOW_UP` – and 'return-plan' has none (v85, wave 8 T6)

```ts
  // ⭐⭐⭐ AND `'return-plan'` HAS NONE (v85, wave 8 T6) – AND THIS CELL IS THE ONE T2½ PIECE 2 WAS
  // BOUGHT FOR. On the `if`-chain this record replaced, a kind left out did not fail to compile: it
  // fell through to `FORK_WANTS.find(...)`, found no want on a detail that is not one, and THREW from
  // inside `toSnapshot` – round 42 #15's recorded save-bricking shape. The cell below is a compile
  // error when it is missing, which is why this wave's last engine task could be written at all.
  // ⚠ THE REASON IT IS `null` IS THE PLAINEST IN THIS RECORD, `'own-key'`'s word for word: THE CARD
  // QUOTES NOBODY, so there is nobody a silence could buy more of. It is also not a beat that could
  // have a `listen` answer – its two are a scheduling fork, and «say nothing, and let her talk» is not
  // a way of answering a question about which tournaments to enter.
```

### `lifeBeatListenFollowUp` – Her continuation when the parent only listens – null

```ts
/** ⭐ HER CONTINUATION when the parent only listens – null exactly where the flat pool speaks,
 *  because a girl who answered in one word has nothing more to give a silence (the 10.09 ruling's
 *  own boundary). Exported beside `lifeBeatSaid` so the completeness pin walks this pool the same
 *  way: kind x temperament x want, no silent fallback between voices.
 *
 *  ⚠ THE DECISION PER KIND LIVES IN `LISTEN_FOLLOW_UP` ABOVE, TOTAL BY TYPE (v85 T2½ piece 2) – this
 *  function is now the lookup and nothing else, which is what makes «a forgotten kind» a compile
 *  error instead of a save-bricking throw. Its ANSWER is unchanged: the digest in
 *  tests/wave8-listen-follow-up.test.ts was taken on the `if`-chain this replaced. */
```

### `lifeBeatFollowUps` – Round 42 #15 – what she says back to each answer

```ts
/** ⭐⭐⭐ ROUND 42 #15 – WHAT SHE SAYS BACK TO EACH ANSWER, AS ONE LIST. The owner: «выбрал пункт,
 *  чтобы она сказала больше, а попап закрылся… Сейчас выглядит как "сказала А, но никогда не сказала
 *  Б"». That is exactly what tier 1 did: all three replies were bond-0 no-ops, `ANSWER_EVENT` wrote
 *  nothing, and the card closed on the press.
 *
 *  ⚠⚠ IT IS THE `listen` DETOUR GENERALISED AND NOT A SECOND MECHANISM. The dialog already knew how
 *  to hold an answer open, show a line of hers and record on a second control (10.09's ruling); the
 *  only thing that was special about `listen` was that it was the only entry. So the fork keeps its
 *  ONE entry, worded by the ONE function that has always worded it (`lifeBeatListenFollowUp` above –
 *  not re-derived here), and tier 1 gets three.
 *
 *  ⚠ EVERY OTHER KIND RETURNS AN EMPTY LIST, and each one has its own reason written out on
 *  `lifeBeatListenFollowUp`. Those reasons did not change: `'met'` is news and one of its four
 *  answers IS saying nothing; the counsel and the psychologist have given a professional read with no
 *  second half being withheld; an `'ended'` card already offers giving her room as an answer.
 *
 *  ⭐ §8d.2 – AND A `story` IS TWO PARAGRAPHS ON EVERY ROUTE. `shared` goes in front of all three
 *  branches, so «every route delivers a complete little story» is a property of what is assembled
 *  rather than a rule an editor has to remember.
 *
 *  ⚠ THE `done` LABELS ARE THE ENGINE'S TWO SHIPPED WORDS AND NOT NEW COPY (invariant 4): the
 *  continuation closes on `LISTEN_DONE_LABEL` – the same control, the same meaning, the shape 10.09
 *  shipped – and a reaction closes on `CONFIRM_LABEL`, the prologue's own way-on word that round 42
 *  #8 already put on this card. Nothing was coined for this.
 *
 *  ⚠ PURE AND ZERO-DRAW, exactly like the two pool readers above it. */
```

### `beatWants` – v74 T7 – what she asked for, for the row in hand

```ts
/** ⭐⭐ v74 T7 – WHAT SHE ASKED FOR, FOR THE ROW IN HAND. `'met'`'s `detail` is the episode id, so the
 *  row itself names the attachment whose `wants` prices its answers and colours its line.
 *
 *  ⚠ `'open'` IS THE ANSWER FOR EVERY OTHER KIND, AND IT IS THE BASE READING RATHER THAN A NEUTRAL
 *  STAND-IN: `'fork-opinion'` has no attachment, so there is nothing to read, and the base table is
 *  exactly what such a row has always been answered against.
 *
 *  ⚠ AND `'open'` AGAIN WHEN THE EPISODE IS GONE. A `'met'` row whose episode no longer exists is
 *  unreachable on any state the sim produces (episodes are append-only and never pruned – the
 *  `LoveEpisode` banner), so this branch is for probe worlds hand-built in tests and benches. It
 *  fails onto T6's shipped reading, never onto a price nobody chose. */
```

### `beatFromHeadline` – v77 T6 – did the parent learn it from a headline

```ts
/** ⭐⭐⭐ v77 T6 – DID THE PARENT LEARN IT FROM A HEADLINE? `beatWants`' own shape, asking the row's
 *  episode a second question, and it is DERIVED rather than stamped for `beatEndsRegister`'s stated
 *  reason: both dates are on the row for the life of the career, so the answer this gives on the
 *  raise week is the answer it gives twenty seasons later and the album can re-word an old card.
 *
 *  ⚠⚠ THE DISCRIMINATOR IS `publicWeek === knownWeek`, AND IT IS THE OVERTAKE'S OWN SIGNATURE. §9's
 *  leak is the only writer that can make the two equal: it stamps `publicWeek = world.week` and,
 *  when the parent has not been told yet, pulls `knownWeek` onto the same week so the STANDING
 *  delivery raises the card in that very tick. An ordinary delivery leaves `publicWeek` null (never
 *  equal) or holds a leak week that is strictly LATER than the week he was told – he already knew,
 *  and the papers caught up. The one overlap is a leak landing on the very week the lag had already
 *  run out, and «the story broke the week he was told» is honestly a headline week too.
 *
 *  ⚠ ANY OTHER KIND IS `false`, which is the standing frame and not a neutral stand-in – `beatWants`'
 *  own idiom, and nothing but a `'met'` row ever asks. */
```

### `hasBeatFor` – v75 T4 – has this episode been delivered yet, asked of the lifeLog

```ts
/** ⭐⭐⭐ v75 T4 – HAS THIS EPISODE BEEN DELIVERED YET, asked of the `lifeLog` and of nothing else.
 *
 *  ⚠⚠ THE RECEIPT IS THE RECORD (rule 2 at the head of this file, and `deliverKnownPartner`'s own
 *  doctrine): there is no `told: true` flag on the episode, because a second boolean beside a record
 *  that already answers the question is one fact with two sources of truth and they desync. Wave 3
 *  read this same predicate inline for `'met'` alone; wave 4 needs it in three places – the delivery
 *  scan, the told-now raise in §8, and the register a card is worded from – so it is named once here
 *  rather than spelled three ways.
 *
 *  ⚠ `kinds` IS A PARAMETER BECAUSE THE THREE CALLERS ASK DIFFERENT QUESTIONS. §8 asks «was he ever
 *  told there was somebody» (`'met'` alone, ruling A's discriminator); the delivery scan asks «has
 *  this row produced ANY beat yet» (either kind), because a told-late row that has already surfaced
 *  must not surface again. Folding them into one predicate would make one of the two wrong.
 *
 *  ⚠ EXPORTED 28.09 BY T6.10 BECAUSE TWO OF THE THREE CALLERS NOW LIVE IN KIND MODULES –
 *  `world/lifeBeat/wedding.ts` and `world/lifeBeat/ended.ts`. That is the same argument the paragraph
 *  above makes: named once, not spelled three ways, and a module boundary is no reason to spell it a
 *  fourth. NOT on the barrel – `src/engine/world.ts`'s name set is frozen (T6.6) and this is not in it. */
```

### `beatEndsRegister` – v75 T4, ruling A – which scene an 'ended' card is

```ts
/** ⭐⭐⭐ v75 T4, RULING A – WHICH SCENE AN `'ended'` CARD IS, DERIVED FROM THE `'met'` RECEIPT.
 *
 *  ⚠⚠ THIS IS THE RULING'S DEPARTURE FROM THE BRIEF, IN ONE LINE OF CODE. The brief said told-late
 *  when `endedWeek < knownWeek`; that reading calls `endedWeek === knownWeek` *known* and therefore
 *  raises `'ended'` and `'met'` in the same tick – two contradictory beats about one girl, which the
 *  brief itself forbids two lines earlier. The receipt has neither problem: it is a fact about what
 *  the parent HAS ACTUALLY BEEN SHOWN, which is the thing «told» was always trying to mean.
 *
 *  ⚠ IT STAYS RE-DERIVABLE FOR THE LIFE OF THE CAREER, which is what lets it be derived rather than
 *  stored. A `'met'` row can never be appended AFTER an `'ended'` row for one episode: the told-late
 *  path in §6 raises no `'met'`, ever, and §6 delivers each episode exactly once. So the answer this
 *  gives on the raise week is the answer it gives twenty seasons later, and the album can re-word an
 *  old card without the row having carried a register it might have disagreed with.
 *
 *  ⚠ ANY OTHER KIND READS `'told-now'`, which is the base register and not a neutral stand-in –
 *  `beatWants`' own shape, and nothing but an `'ended'` row ever asks. */
```

### `drawEndsRead` – v75 T4 – what she wants from him after it stops

```ts
/** ⭐⭐⭐ v75 T4 – WHAT SHE WANTS FROM HIM AFTER IT STOPS, on `seed:life:ends:<endedWeek>:react`.
 *
 *  ⚠⚠ THE WEIGHTS ARE `drawPartnerWants`' OWN AND THE SPEC SAYS SO IN ONE SENTENCE (who-she-is §4,
 *  «Wants weights», verbatim): «open girls draw `'open'` / `'company'` at ~70%; private girls
 *  `'private'` / `'space'` at ~70%». One row, two draws – so this is NOT a coin flip, and a 50/50
 *  here would have been a silent tuning change dressed as an absent constant. The own-register share
 *  is `ECONOMY.life.wantsOwnRegister`, the same 0.70 the disclosure draw reads, because §4 gives them
 *  one number and two numbers would be two facts sharing a sentence.
 *
 *  ⚠ (seed, calendar)-KEYED, NEVER (seed, choice)-KEYED, and the calendar week is the ENDING's
 *  (ruling G.1). On a told-late episode the card is raised seasons after the ending; the key stays
 *  `endedWeek`, because `seed:life:ends:<week>` and `seed:life:ends:<week>:react` are siblings and a
 *  pair keyed on two different weeks is two facts sharing a name. MAIN is not reached.
 *
 *  ⚠ THE TEMPERAMENT IS A PARAMETER, `endsHazardFor`'s own primitives doctrine – so a census can
 *  sweep the table without posing a world per cell. */
```

### `beatEndsRead` – v75 T4, ruling G.2 – the read for the row in hand

```ts
/** ⭐⭐⭐ v75 T4, RULING G.2 – THE READ FOR THE ROW IN HAND, `beatWants`' TWIN. Find the episode by
 *  `row.detail`, take its `endedWeek`, derive the stream.
 *
 *  ⚠⚠ RE-DERIVED AND NEVER STORED, which is a correctness requirement and not a preference.
 *  `answerLifeBeat` re-validates the chosen option against the priced set (rule 3 at the head of this
 *  file), so the price has to be RECONSTRUCTIBLE at answer time from facts the world holds – and the
 *  facts it holds are the episode's dates and the seed. A read stamped onto the row at raise time
 *  would be a second source of truth for one draw, and the two would part the first time a migration
 *  or a command touched one of them.
 *
 *  ⚠ `'space'` WHEN THERE IS NOTHING TO READ – a row whose episode is gone, or an episode with no
 *  `endedWeek`. Neither is reachable on any state the sim produces (episodes are append-only and
 *  never pruned, and an `'ended'` row is only ever raised beside a written date), so this is for the
 *  probe worlds hand-built in tests and benches. It fails onto the BASE table, never onto a price
 *  nobody chose – `beatWants`' own `'open'` fallback, for its own reason. */
```

### `beatEndsRead` – birth, and it must not move to expressedTemperamentOf

```ts
  // ⚠⚠ BIRTH, AND IT MUST NOT MOVE TO `expressedTemperamentOf` – v76's T7, THE ARCHITECT'S RULING A,
  // which is the ⚠⚠ block above this function restated in the walls' own terms. The read is
  // RE-DERIVED at answer time from the episode's dates and the seed, and it PRICES the option set
  // (`'ended'`'s space/company delta is +3 or −3 BY IT). Expression is a fact about the world's
  // CURRENT week, not about the episode, so a read that consulted it would be reconstructed against
  // a different girl the moment a flip landed – and `answerLifeBeat` would then charge the opposite
  // sign of what the player chose. ⚠ The limit of the hazard, stated honestly: it is LATENT, not
  // live, because `LIFE_BEAT_BLOCKING.ended === true` stops the week between the raise and the
  // answer and no leaning pass can run in the gap. The trap is for the album (step 6+), which is
  // promised a read of the arc «later». ⚠ THIS SITE AND THE TOLD-LATE ROW IN §6 ARE TWINS BY DESIGN
  // – «the row and the card the same tick raises cannot disagree» – so they move together or not at
  // all, and ruling A says not at all.
```

### `pendingLifeBeatOptions` – v74 T7 – the priced answer set for whatever is pending

```ts
/** ⭐⭐ v74 T7 – THE PRICED ANSWER SET FOR WHATEVER IS PENDING, or null when nothing is. The one
 *  reading of «what would this answer cost» available OUTSIDE the engine, and it exists because
 *  `LIFE_BEAT_OPTIONS` alone is no longer that reading: a caller that reads the base record and
 *  answers from it is asking one question and paying for another.
 *
 *  ⚠ ITS FIRST CALLER IS `tools/_lifeBeats.ts`' `drainLifeBeats`, which picks the bond-NEUTRAL answer
 *  so a harness that never meant to price a beat cannot move the number it is measuring. Under
 *  today's table that is `wary` either way, so nothing a bench measures moves; under a future flip
 *  it is still whatever is genuinely zero FOR THIS ROW, which the base record could not have said. */
```

### `buildLifeBeatPrompt` – the prompt the Snapshot carries, assembled engine-side

```ts
/** The prompt the Snapshot carries, assembled ENGINE-side so the dialog renders what it is handed
 *  and owns no sentence of its own – `buildBirthdayPrompt`'s own contract.
 *
 *  ⚠ NULL WHILE NOTHING IS PENDING, which is every week of nearly every career: this is called on
 *  every `toSnapshot`, so it is a `find` over a handful of rows and no more.
 *
 *  ⚠ ZERO DRAWS ON MAIN, AND THE PROMPT IS STILL A PURE FUNCTION OF THE WORLD. ⭐⭐ RE-AIMED BY v75
 *  T4 AND NOT RELAXED: this read «ZERO DRAWS. Every word of it is selected by (want, voice, register,
 *  bond band, wants, stage) – six facts the world already holds». An `'ended'` row adds a seventh
 *  that is a DERIVED STREAM rather than a stored field – `beatEndsRead`, one uniform on
 *  `seed:life:ends:<endedWeek>:react`, re-derived at the call site and persisting nothing (CLAUDE.md
 *  invariant 2's sub-stream rule). What the sentence was written to guarantee is untouched and is the
 *  half that matters: MAIN is never reached, so the frozen capture cannot see this function; the
 *  result is a function of (seed, endedWeek, temperament) alone, so re-assembling the prompt on every
 *  `toSnapshot` yields the identical card; and `answerLifeBeat` re-derives the whole thing to
 *  re-validate the option id (rule 3) without the two readings ever being able to disagree. ⚠ WHAT
 *  DID CHANGE: the count is no longer zero on `seed:life:ends:*`, so a net that asserted «assembling
 *  a prompt derives no key at all» is measuring something this wave deliberately moved.
 *
 *  ⚠⚠ AND THE FLIP REACHES THE SCREEN THROUGH `said` ALONE (v74 T7). `options` carries ids and
 *  LABELS and has never carried a `bond`, so the re-priced number cannot leak onto a button even by
 *  accident – the type is the fence. What the player has to go on is her line, which is the whole
 *  design: never marked, never labelled, no meter. */
```

### `lifeBeatPromptFor` – v76 T6 – the seventh is read off the row, never re-derived

```ts
  // ⭐⭐⭐ v76 T6 – AND THE SEVENTH IS **READ OFF THE ROW**, never re-derived here, which is the whole
  // of ruling E. This function is called on EVERY `toSnapshot`, and hire, release and the rung dial
  // are all commands that produce one – so a re-derived legibility would be re-decided after every
  // command, and firing him with a beat pending would flip this heading from legible to ambiguous
  // under the player's eyes while the kept feed row, whose text was persisted at the raise, still
  // said the other thing. The stamp is written once, by `raiseLifeBeat`, on the week it was true.
  // ⚠ `=== true` AND NOT A TRUTHY READ: absent means «nobody was teaching him to listen» and false
  // means «he was, and this one got past him», and both wear the standing wording (see the field's
  // own note in `shared/protocol/narrative.ts`).
  // ⚠ THE VOICE IS BIRTH – `voiceOf` above, «who she is, for the WORDING alone» (§0.2's fence): the
  // voices read `world.temperament` and never the expressed reading T7 builds.
```

### `lifeBeatPromptFor` – Round 42 #15 – the row's own week and not this one

```ts
      // ⭐⭐⭐ ROUND 42 #15 – THE ROW'S OWN WEEK AND NOT THIS ONE. See `lifeStageAt`: a soft row lives
      // three weeks, and re-deriving the stage from the CURRENT week would re-word a waiting
      // conversation into a room it was never in – and, for a situation with only one frame, into a
      // room it has no line for at all, which throws inside `toSnapshot`. Byte-identical for every
      // blocking kind, because a blocking row stops the week.
      // ⚠ RE-AIMED 26.09 (B-P3-07): «stops the week» was false inside `resumeFromCollege` until
      // B-01's ruling 2(a) made that loop pause on `'life'`. See `lifeStageAt`'s own note for the
      // measurement; the argument is unchanged, it is the exception that closed.
```

### `SOFT_BEAT_CARD` – v74 T15 – the soft surface, as one snapshot fact

```ts
/** ⭐⭐⭐ v74 T15 – THE SOFT SURFACE, AS ONE SNAPSHOT FACT: the Home card's line and the dialog it
 *  opens, or null when nothing of hers is waiting to be heard (who-she-is §5b's amendment).
 *
 *  ⚠⚠ ONE FIELD AND NOT TWO. The card and the prompt are one state – she came by, and this is what
 *  she came with – so a surface cannot draw the invitation while the conversation behind it is
 *  missing, and a screen cannot open a dialog for a row whose window has closed. Both are decided
 *  HERE, by `liveSoftBeat`, which is the same derivation the raise gate asks.
 *
 *  ⚠ `prompt` IS A `LifeBeatPrompt` AND NOT A NEW SHAPE. «Tapping it opens the SAME `LifeBeatDialog`
 *  on the same prompt contract» is the ruling, so the type is the contract and no new dialog exists
 *  anywhere: the component renders whichever of the two prompts it is pointed at.
 *
 *  ⚠ ZERO DRAWS, like every other prompt in this file – it is a `find` over a handful of rows and a
 *  re-assembly from facts the world already holds. */
/** ⭐ v83 (wave 7 – T5) – THE INVITATION LINE, PER KIND, and the record is TOTAL for
 *  `LIFE_BEAT_BLOCKING`'s own reason: a list would let the next soft kind ship wearing tier 1's
 *  sentence by FORGETTING, and «what does the Home card say for this kind» must be a line somebody
 *  typed. ⚠ `null` on every BLOCKING kind – those rows stop the week and never reach the soft
 *  surface, so a card line for them would be dead copy pretending to be reachable.
 *  ⚠ THE `'small-talk'` CELL IS THE SHIPPED CONSTANT, REFERENCED AND NOT RE-TYPED (invariant 4):
 *  tier 1's card is byte-identical to what it has always been. */
```

### `raiseLifeBeat` – v76 T6 – the stamp, written only when somebody was teaching him to listen

```ts
  // ⭐⭐⭐ v76 T6 – THE STAMP, AND THE KEY IS WRITTEN ONLY WHEN SOMEBODY WAS ACTUALLY TEACHING HIM TO
  // LISTEN (ruling E). `undefined` leaves the row the exact four-field object every row before this
  // commit was, so a career with no psychologist in it produces byte-identical `lifeLog` rows – which
  // is half of why no schema bump is owed and why the frozen corpus cannot see this step.
  // ⚠ THE VALUE IS DECIDED BY THE CALLER, ON THE SAME LINE-RUN AS THE FEED ROW IT SHARES A COIN WITH.
  // One uniform per raise, two consumers: the kept row's TEXT (persisted here and now) and this stamp
  // (read back by every later prompt). A second draw for the second consumer would be one fact with
  // two sources of truth, and they would part the first week a rung changed.
```

### `raiseLifeBeat` – Round 44 / v81 – the frame, stamped once and never re-derived

```ts
  // ⭐⭐⭐ ROUND 44 / v81 – THE FRAME, STAMPED ONCE AND NEVER RE-DERIVED. `undefined` leaves the row
  // the exact object every row before this commit was, which is what makes the migration trivial: a
  // beat of any other kind takes no frame at all, and an old small-talk row falls back to the first
  // line of its presence's pool – the sentence it has already shown him.
  // ⚠⚠ AND IT IS PERSISTED RATHER THAN DERIVED FOR ONE REASON ONLY, HIS: «the frame must not change
  // after a save, a reload, OR THE ARRAY GROWING». The first two a purpose-scoped stream keyed on the
  // week survives perfectly; the third it cannot, because a pool of ten re-derives a different member
  // for a beat already on screen.
```

### `answerLifeBeat` – the only way a pending row clears

```ts
/** ⚠ THE ONLY WAY A PENDING ROW CLEARS, and until it runs `advanceWeeks` refuses to tick – the
 *  birthday's law, for a stronger reason: the beat is her speaking, and a week a player could tick
 *  past would answer her by walking away.
 *
 *  ⭐⭐⭐ `guardNotEndedForGood`, NOT `guardNotEnded`, on `chooseGift`'s own argument and it is the
 *  fourth member of that deliberately short list (constants.ts). A beat is about the FAMILY'S OWN
 *  calendar, which being at a university plainly does not stop – and a guard that refused the
 *  college freeze would refuse the one command that lets time move again inside it. A terminal latch
 *  still refuses with the ended sentence.
 *
 *  ⚠ RE-VALIDATED ENGINE-SIDE (invariant 1): the prompt is re-derived here and the id checked
 *  against the list the ENGINE offered, so a stale dialog cannot record an option this beat never
 *  made. ⚠ AND NEVER A PURCHASE – no `amountCents`, no price in any of its words. */
```

### `answerLifeBeat` – The index and not the row the selectors hand back

```ts
  // ⚠ THE INDEX AND NOT THE ROW THE SELECTORS HAND BACK: `lifeLogOf` returns a readonly view on
  // purpose, and the queue's order is what decides WHICH row this answers – exactly the row the
  // prompt was built from.
  //
  // ⭐⭐⭐ v74 T15 – AND «WHICH ROW» IS NOW TWO QUESTIONS IN ONE ORDER: the blocking beat first, and
  // the live soft row only when nothing is blocking. ⚠⚠ IT IS NOT A `findIndex(answer === null)`
  // ANY MORE, AND THE CHANGE IS LOAD-BEARING RATHER THAN TIDY: a soft row whose window closed keeps
  // `answer: null` for the rest of the career (the honest record that she came and it went unasked),
  // so the naive scan would hand every later answer – a fork, a «there is someone» – to a
  // conversation three weeks dead, and record the parent's word about her attachment against it.
  // ⚠ THE ORDER IS THE STOP CONTRACT READ THE OTHER WAY ROUND: while a blocking beat is up the week
  // is stopped and the card cannot be reached, so the blocking row is what the player is answering.
```

### `answerLifeBeat` – the row's own kind, not a flat search over every kind's options

```ts
  // ⚠ THE ROW'S OWN KIND, AND NOT A FLAT SEARCH OVER EVERY KIND'S OPTIONS (v74). Reading the whole
  // table here would let a `'met'` row be answered with the fork's `back` – the prompt would refuse
  // it, but the refusal would then be the ONLY thing standing between two beats' answer sets, and
  // rule 3 exists precisely so that two readings of the same fact cannot disagree.
  // ⚠⚠ AND THE ROW'S OWN `wants` PICKS THE PRICE (v74 T7), through the SAME function the prompt one
  // line up was built from. What she asked for is a fact on the episode, so the charge is re-derived
  // here from the world and never carried in from the screen – a dialog cannot choose its own price
  // any more than it can choose its own option set.
  // ⭐⭐⭐ v75 T4 – AND THE ENDING'S READ IS RE-DERIVED ON THIS LINE, WHICH IS RULING G.2's WHOLE
  // REASON FOR REFUSING TO STORE IT. The price of «give her room» depends on a draw taken on the week
  // the attachment ended, which may be seasons behind this tick; `beatEndsRead` reconstructs it from
  // the episode's own date, so the charge below is the charge the card was built with even on a
  // told-late row answered a year later. A read stamped onto the row would have been a second source
  // of truth for one draw – and the prompt one line up is re-derived too, so the two would part
  // silently the first time anything touched one of them.
```

### `answerLifeBeat` – v74 T17 – the counsel arc's one decision

```ts
  // ⭐⭐⭐ v74 T17 – THE COUNSEL ARC'S ONE DECISION, AND IT IS TAKEN **BEFORE** THE BOND DELTA LANDS.
  //
  // ⚠⚠ THE ORDER IS THE WHOLE OF THE CORRECTNESS HERE. The driver is the reading her own line was
  // just worded from, and `applyBondDelta` one line down moves the very number a `'strained'` driver
  // is read off – a −2 for pressing her could turn «she is sure» into «the home is cold» between the
  // card the parent read and the call he gets about it. Derived here, the coach explains the girl she
  // described; derived after, he would sometimes be explaining the parent's answer.
  //
  // ⚠ ONLY ON A `stop`, AND ONLY OFF HER OWN ROW. `college` and `tour` keep today's exact flow: her
  // row is answered, the fork opens, nothing else is raised – which is the ruling's own boundary.
```

### `answerLifeBeat` – v85 (the pregnancy, wave 8 – T2) – the 'expecting' answer outlives the card

```ts
  // ⭐⭐⭐ v85 (the pregnancy, wave 8 – T2) – ...AND THE `'expecting'` ANSWER IS THE ONE BEAT IN THIS
  // FILE WHOSE WORD OUTLIVES THE CARD. One answer, TWO consequences and zero new meters: the delta
  // one line up is the standing machinery, and this writes the same answer as a GRADE on the
  // pregnancy, because T5's return decision and T4's postpartum recovery both read it – the research
  // row's own «support only – reaction sets recovery trajectory», which is a claim about months from
  // now and therefore cannot live on a card that closes this week.
  //
  // ⚠ ABOVE THE `ANSWER_EVENT` EARLY RETURN, on the counsel raise's own argument twenty lines up: a
  // kind that stopped writing a feed row must not silently stop writing the grade, and «the write is
  // below a `return`» is exactly how that would happen.
  //
  // ⚠⚠ GUARDED ON THE RECORD AND NOT ON THE KIND ALONE, and the `null` arm is REAL rather than
  // defensive dressing. `rollPregnancy` writes the record and raises the row in one line-run, so on
  // every state the sim produces a pending `'expecting'` row has a pregnancy under it – but §D of
  // tests/wave3-reaction.test.ts raises a beat of every BLOCKING kind on a hand-built world and
  // drains it, and forty benches do the same shape. Those worlds have no pregnancy, and a throw here
  // would make the drain helper the thing that breaks. The grade is simply not written when there is
  // nothing to write it on, which is the honest reading of that world.
  //
  // ⚠ THE OPTION ID IS ALREADY RE-VALIDATED (`chosen` came from the priced set), so the lookup below
  // can only miss if the two tables part – and then it THROWS BY NAME rather than writing
  // `undefined` onto a field typed three ways. T1's counsel cell made the same call for the same
  // reason: an unreachable branch that fails loudly beats one that writes a lie.
```

### `answerLifeBeat` – v85 (the return, wave 8 – T6) – the ramp's answer outlives the card too

```ts
  // ⭐⭐⭐ v85 (the return, wave 8 – T6) – ...AND THE RAMP'S ANSWER IS THE SECOND BEAT IN THIS FILE
  // WHOSE WORD OUTLIVES THE CARD, on the identical shape one branch up and for the same reason: what
  // a season is BUILT out of is a claim about the months ahead, so it cannot live on a card that
  // closes this week. It is written to `world.comeback`, which is where RULING A (20.09) moved
  // `returnPlan` precisely because `world.pregnancy` is cleared on the week this beat is raised.
  //
  // ⚠ ABOVE THE `ANSWER_EVENT` EARLY RETURN, on the counsel raise's own argument: a kind that stopped
  // writing a feed row must not silently stop writing the plan.
  //
  // ⚠⚠ GUARDED ON THE RECORD AND NOT ON THE KIND ALONE, and the `null` arm is REAL rather than
  // defensive dressing – `'expecting'`'s own argument verbatim: §D of tests/wave3-reaction.test.ts
  // raises a beat of every BLOCKING kind on a hand-built world and drains it, and forty benches do the
  // same shape. Those worlds have no comeback, and a throw here would make the drain helper the thing
  // that breaks. The plan is simply not written when there is nothing to write it on.
  //
  // ⚠ THE OPTION ID IS ALREADY RE-VALIDATED, so the lookup can only miss if the two tables part – and
  // then it THROWS BY NAME rather than writing `undefined` onto a field typed three ways.
```

### `answerLifeBeat` – v74 T17 – and the coach calls

```ts
  // ⭐⭐⭐ v74 T17 – ...AND THE COACH CALLS. One raise, and the whole of layer 2's machinery is this
  // line plus a `true` in `LIFE_BEAT_BLOCKING`: the new row is blocking, `answerFork` already refuses
  // while any blocking row is unanswered, and so the fork stays shut until the parent has heard him.
  // ⚠ ABOVE THE `ANSWER_EVENT` EARLY RETURN on purpose. Her kind writes a feed row today, so the two
  // orders agree – but a kind that stopped writing one must not silently stop raising the counsel,
  // and «the raise is below a `return`» is exactly how that would happen.
  // ⚠⚠ THE PSYCHOLOGIST'S BEAT SLOTS HERE, BESIDE THIS LINE, AND NOWHERE ELSE (wave 5). He is a second
  // `raiseLifeBeat` on the same condition with the same driver; the queue answers them in log order,
  // the fork waits for both, and nothing about this file changes shape to take him.
```

### `answerLifeBeat` – v76 T8 – and the seat calls, one line later

```ts
  // ⭐⭐⭐ v76 T8 – ...AND THE SEAT CALLS, ONE LINE LATER, WHICH IS THE COMMENT ABOVE CASHED IN. The
  // whole of the psy arc is this line plus a `true` in `LIFE_BEAT_BLOCKING` and its rows in the two
  // pools: the queue already answers in `lifeLog` order, `answerFork` already waits for every blocking
  // row, and neither of them changed by a byte.
  //
  // ⚠⚠ `psychologistWorksThisWeek` AND NOT `world.psychologistHired` – the architect's ruling J, which
  // supersedes the wave brief's own wording. `resolvePsychologist` opens with this same predicate, so
  // a seat stood down by a college freeze or a booked family week is not billed that week and must not
  // work that week either: pay nothing, receive nothing (the travelling-team §4 legibility law read
  // the right way round). The flag survives both stand-downs, so the call resumes by itself after.
  // ⚠ NO FOCUS IS ASKED FOR. The fork is the SEAT's, not a year-focus's – the retainer buys the man,
  // and the man has a view about the biggest week of the career whatever he is working on this year.
  //
  // ⚠⚠ AND THE SHOCK IS READ HERE, AT THE RAISE, FOR THE WORDING COLUMN AND NOTHING ELSE (§3f). It
  // goes into the `detail` beside the driver because this row must stay reconstructible for the life
  // of the career – `'fork-counsel'`'s own argument – and because a price is never derived from it:
  // `LIFE_BEAT_OPTIONS['fork-psy']` has no overlay in `lifeBeatOptionsFor`, so the priced set the
  // answer is re-validated against is the same object in both columns.
```

### `lifeBeat.ts` §5 – the arrival

```ts
// =================================================================================================
// 5. THE ARRIVAL – ⚠⚠ WHETHER SOMEONE EXISTS AT ALL (the private life, wave 3: T3 + T5)
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T3 and §2 T5. T3 is the weekly hazard and the row it
// appends; T5 is the two draws that fill the row in. THEY ARE ONE MOMENT IN THE CODE and could not
// honestly be two: the brief's own T3 says the row carries «`knownWeek`/`wants` from T5's draws,
// computed at this moment», so a T3 that shipped alone would have had to write placeholder values –
// knowingly-wrong behaviour standing in the tree waiting for a later commit to correct it.
//
// ⚠⚠ THE THREE STREAMS AND NOTHING ELSE (build plan §1f, and §3 of the brief quotes it verbatim):
//
//     seed:life:arrival:<week>             does someone appear, this week
//     seed:life:partner:<sinceWeek>:wants  what she wants done with the news
//     seed:life:partner:<sinceWeek>:lag    how long the parent waits to hear it, RAW
//
// SPLIT KEYS, ONE VALUE PER KEY (the 09.09 stream law), so a read added to one of them later can
// never shift a neighbour's value. `seed:life:smalltalk:<week>` is T8's and `seed:life:ends:*` is
// WAVE 4's – neither exists on this tree and neither may be created early.
// ⚠ RE-AIMED 12.09 BY WAVE 4's T2, NOT DELETED, because half of that last sentence has come true and
// a reader has to be able to tell WHICH half. `seed:life:smalltalk:<week>` landed in T8 (§7) and
// `seed:life:ends:<week>` lands in §8 below – so both now exist on this tree, on their own keys,
// derived in their own functions. What the sentence was written to forbid is intact and is the part
// that still binds: NO SECTION MAY READ ANOTHER SECTION'S KEY. ⚠ RE-AIMED AGAIN 12.09 BY T4: this
// ended «and `seed:life:ends:<week>:react` (T4) is still unwritten and may not be created early», and
// T4 is the step it was written to be re-read on – the sixth and last key of the private life now
// exists, in `drawEndsRead` (§3e), keyed on the ENDING's week. `rollArrival` below derives the three
// keys named above and no others, which is what its own count-keys pin asserts and which is the claim
// none of these re-aims has touched.
//
// ⚠⚠ ZERO DRAWS ON MAIN, AND ZERO DRAWS ON AN INELIGIBLE WEEK. The first is CLAUDE.md invariant 2
// and is structural: nothing here takes an `Rng`, so the frozen capture (41550 / e6b0c709) cannot
// see this file. The second is the brief's load-bearing rule and is enforced by `rollArrival`'s very
// first line – the gate returns BEFORE the hazard stream is ever derived, never draw-and-discard.
//
// ⚠ AND A MEASURED NOTE ON HOW THAT RULE IS TESTED, because it changes what the test has to be. The
// three keys above carry the WEEK in them, so every week derives a fresh stream from its own key and
// no draw can shift any other week's value: «stream alignment» is true here BY CONSTRUCTION, and a
// two-worlds alignment comparison stays green even under a draw-and-discard mutation. The honest net
// is therefore a COUNT of the keys the gate reaches, and that is what tests/wave3-arrival.test.ts
// asserts (§B) – see its ARM ledger, where the alignment arm is recorded as the one that did NOT go
// red and says so.
```

### `kidAgeNow` – Her age this week, fractional

```ts
/** HER AGE THIS WEEK, fractional. ⚠ `kidAgeExact` TAKES (week, month, day) AND NEVER A WORLD – the
 *  whole engine spells it this way (`world/medical.ts`, `world/coachMarket.ts`, `world/player.ts`),
 *  and it is wrapped here only so the gate and the hazard cannot ask the question two ways.
 *
 *  ⚠ EXPORTED 28.09 BY T6.10 FOR THE KIND MODULES AND FOR NOTHING ELSE. `world/lifeBeat/bereavement`,
 *  `…/weight` and `…/wedding` each need her age this week, and the alternative to one export here is
 *  three copies of the wrapper – the exact two-ways-to-ask this comment refuses. It is NOT on the
 *  barrel: `src/engine/world.ts`'s name set is frozen (T6.6) and this name is not in it. */
```

### `temperamentOf` – Who she is, with accrueSpirit's own courtesy

```ts
/** WHO SHE IS, with `accrueSpirit`'s own courtesy for probe worlds hand-built in tests and benches:
 *  the field is required on every career that was created or migrated, and re-deriving it from the
 *  seed is the SAME function `createWorld` drew it with, so the fallback cannot invent a different
 *  girl from the one the save holds.
 *
 *  ⚠⚠ THIS BODY MUST NEVER BE RE-POINTED AT `expressedTemperamentOf`, AND v76's T7 IS THE WAVE THAT
 *  HAD THE CHANCE TO (the architect's RULING A). Re-pointing here would have been one line instead
 *  of three, and it would have been wrong: of the five call sites this function had, THREE are
 *  mechanics evaluated now and read expression, and TWO re-derive a persisted price and must read
 *  BIRTH. A single body cannot be both. So the swaps are per CALL SITE – `rollArrival`,
 *  `arrivalEligible`'s cooldown and `rollEnds` now call `expressedTemperamentOf` directly; this
 *  function survives as the BIRTH reading and keeps exactly the two callers ruling A left it
 *  (`beatEndsRead` and the told-late row in §6), each carrying its own ⚠⚠ note.
 *
 *  ⚠ IT IS NOT `voiceOf`, WHICH IS ALSO BIRTH AND IS A DIFFERENT LAW. `voiceOf` is «who she is, for
 *  the WORDING alone» – who-she-is §3's fence, «the voice bibles read birth alone». This one is
 *  birth because of ruling A's re-derivation rule. Two reasons, two functions, and merging them
 *  would lose the distinction the next wave needs. */
```

### `lastEndedWeek` – The last week an attachment ended, or null when none

```ts
/** THE LAST WEEK AN ATTACHMENT ENDED, or null when none ever has.
 *
 *  ⚠ THE MAXIMUM AND NOT THE TAIL'S, and the two agree on every state the sim can produce: rows are
 *  appended in calendar order and an ending cannot precede its own beginning. Where they differ is a
 *  poked save, and there the maximum is the safe reading – «the most recent time something ended» is
 *  what a cooldown is about, and reading a stale earlier row would let the next arrival come early.
 *
 *  ⚠ NULL IS «CLEAR», NEVER «BLOCKED» (brief §2 T3: «No ended row yet ⇒ clear»). A career that has
 *  lived nothing is not serving a cooldown for it. */
```

### `arrivalEligible` – the gate – all three, and a false here means zero draws

```ts
/** ⭐⭐ THE GATE – ALL THREE, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ THIS IS THE LOAD-BEARING INVARIANT OF THE STEP and the reason it is a predicate of its own
 *  rather than three `if`s inlined above a roll: a reader has to be able to see, in one place, that
 *  the whole of eligibility is decided before any stream exists. Pure, zero draws, no writes.
 *
 *  1. ⭐ SIXTEEN – RULED 23.08, confirmed for this wave (who-she-is §4, brief §4's first row).
 *  2. `activeEpisode(world) === null` – nobody new appears while someone is already there. This is
 *     also what makes the tail reading of `activeEpisode` safe: only the tail can ever be open,
 *     because this line refuses to append behind an open row.
 *  3. THE COOLDOWN, per temperament (who-she-is §4's `cooldown` column).
 *
 *  ⚠ THE COOLDOWN IS UNREACHABLE ON THIS TREE, AND IT IS HERE ON PURPOSE. Wave 3 ships arrivals
 *  ONLY: nothing writes `endedWeek`, so `lastEndedWeek` is null on every career the engine can
 *  produce and clause 3 is always true in play. It lands now – with its own tests, run against
 *  hand-built worlds that DO carry an ended row – so that wave 4, which writes the endings, changes
 *  nothing in this function and inherits a cooldown that was tested before it had a caller. Deleting
 *  it as dead code would be the defect, not the tidy-up. */
```

### `drawPartnerWants` – Draw 1 of 2 – what she wants done

```ts
/** ⭐ DRAW 1 OF 2 – WHAT SHE WANTS DONE WITH IT, on `seed:life:partner:<sinceWeek>:wants`.
 *
 *  Weighted toward the register she was born with (who-she-is §4: «open girls draw `open` ... at
 *  ~70%») and free to come out the other way, which is the point: a tendency, never a rule, and the
 *  30% is what stops an open girl being a stereotype who never once keeps something to herself.
 *
 *  ⚠ (seed, calendar)-KEYED, NEVER (seed, choice)-KEYED – `drawForkWant`'s own argument above. The
 *  arrival week is calendar, so a player cannot re-roll her preference by playing the week
 *  differently. MAIN is not reached. */
```

### `drawRawLag` – Draw 2 of 2 – how long the parent waits, raw

```ts
/** ⭐ DRAW 2 OF 2 – HOW LONG THE PARENT WAITS, **RAW**, on `seed:life:partner:<sinceWeek>:lag`.
 *
 *  who-she-is §4's «Feed lag» table, verbatim: open – 0 with p 0.70, else uniform 1..4; private –
 *  0 with p 0.10, else uniform 2..12.
 *
 *  ⭐ THE OPEN ROW MOVED 11.09.2026 and this quotation moved with it, because a stale verbatim quote
 *  is drift wearing a citation. §4a's wave-3 census measured the open late-share at 44.0% against
 *  its own ≤ 25% bar, with the RAW draw already 57.4% late before `shaveLag` below could touch it;
 *  the owner moved the table rather than the bar («двигать таблицу – ок»). The DRAW here is
 *  unchanged – one uniform, one key, one threshold read off `ECONOMY.life.lag`. Only the threshold
 *  and the ceiling moved, which is why this step added no stream and took no new draw.
 *
 *  ⚠ IT TAKES THE OPENNESS REGISTER, NOT THE DRAWN `wants`, and the two are independent on purpose:
 *  a private girl who this time decided to say it out loud is still a girl who takes a while to get
 *  round to it. §4's neighbouring rows are what settle the reading – the «Wants weights» row says
 *  «open GIRLS», so «open» in the lag row above it is the same girl and not a drawn value.
 *
 *  ⚠ TWO READS OF ONE PRIVATE STREAM, and that is still ONE VALUE PER KEY: the p-zero test and the
 *  uniform are two halves of a single distribution, and the stream they share is derived here and
 *  discarded here. The split-key law is about two DIFFERENT facts never sharing a key, which is why
 *  `wants` is above with a key of its own. */
```

### `shaveLag` – the bond shave – the raw lag shortened by what the parent has built

```ts
/** ⭐⭐ THE BOND SHAVE – the raw lag shortened by what the parent has actually built with her.
 *
 *  ⚠⚠ AND THIS IS THE INPUT-INDEPENDENCE STORY OF THE WHOLE WAVE, so it is written down here rather
 *  than assumed. CLAUDE.md invariant 2 says a player's choices may never re-roll the world's dice.
 *  They do not:
 *
 *    * THE DRAW is keyed on (seed, calendar) alone – `sinceWeek` is therefore IDENTICAL across a
 *      no-action run and an action-laden run of one seed, and T11's bench asserts exactly that;
 *    * THE SHAVE is a pure function of `bond`, which is the history the player built by showing up.
 *      So `knownWeek` MAY differ between two runs of one seed, DELIBERATELY.
 *
 *  That is a relationship affecting DISCLOSURE, not dice being re-rolled – who-she-is §2a channel 1,
 *  «she trusts THIS parent». It is the one place in this wave where a player choice is allowed to
 *  show, and anything that made `sinceWeek` move with it would be the bug this note exists to name.
 *
 *  ⚠ THE DIVISORS ARE THE ARCHITECT'S CONCRETISATION (brief §4, marked ⚠ there), bench-visible –
 *  and `strained`/`cold` divide by 1, so a distant home hears about it exactly when the dice said. */
```

### `rollArrival` – The weekly roll, and the one writer

```ts
/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE writer of a `loveEpisodes` row.
 *
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED. An ineligible week takes ZERO
 *  draws – never draw-and-discard – which is the brief's own load-bearing rule for the step. The
 *  line order below IS the rule; moving the roll above the gate would break it silently, because
 *  every key here carries its own week and a discarded draw changes no other week's value.
 *
 *  ⚠ THE BOND IT SHAVES WITH IS LAST WEEK'S SETTLED VALUE, because this runs before `accrueSpirit`
 *  (see the call site in `world/phaseHerWeek.ts`) and `accrueSpirit` is what regresses `bond` toward
 *  70 each week. That is the reading the design wants – «the bond band AT the arrival week» is what
 *  the parent had built by the time someone appeared, not what this same tick is about to do to it.
 *
 *  ⚠ IT RAISES NO BEAT AND WRITES NO FEED ROW. Delivery is T6's, on `knownWeek`, and a beat raised
 *  here would tell the parent the moment someone appeared – which is the one thing the lag exists to
 *  prevent. The row is a fact about HER; nobody has been told anything yet.
 *
 *  ⚠ AND `endedWeek` IS ALWAYS NULL – wave 4 writes it, and `activeEpisode`'s tail reading plus the
 *  gate's clause 2 are together why the list can only ever end in at most one open row. */
```

### `rollArrival` – expression, not birth – v76 T7, the architect's ruling A

```ts
  // ⚠⚠ EXPRESSION, NOT BIRTH – v76's T7, THE ARCHITECT'S RULING A, and this is the site the ruling
  // is easiest to get wrong at because ONE read feeds three things. `arrivalHazardFor` is evaluated
  // now; `drawPartnerWants` and `drawRawLag` are STAMPED onto the episode row (`wants`, `knownWeek`)
  // at the week they were true. Ruling A's law: «a draw whose RESULT IS PERSISTED may read
  // EXPRESSION – it is stamped at the week it was true», so all three read the girl she is THIS
  // week. A girl behind walls meets fewer people and tells later; that is the walls doing exactly
  // what §2a says they do. ⚠ The two `drawEndsRead` sites (`beatEndsRead`, and the told-late row in
  // §6) are the other half of the same ruling and stay on BIRTH – see their own notes.
```

### `rollArrival` – the four v77 fields are written here at their birth values

```ts
  // ⚠⚠ THE FOUR v77 FIELDS ARE WRITTEN HERE AT THEIR BIRTH VALUES AND THIS IS NOT A WRITER (the
  // spotlight, wave 6 – T1). `createWorld`'s literal is where a new WORLD key gets its identity
  // value; a `LoveEpisode` has no `createWorld`, and this push is the ONE place a row is ever born
  // («the ONE writer of a `loveEpisodes` row», the block at the head of this section) – so it is the
  // exact counterpart, and the four values are the same four the v76 -> v77 migration back-fills on
  // every historical row. A new attachment starts private to the family and unvoiced: the world has
  // not learned (`publicWeek: null`), so no story has run and none has run wrong
  // (`publicWrong: false`), and the booth has voiced neither fact (`airedMetWeek` / `airedEndedWeek`
  // null). The LEAK that can set `publicWeek` is T6 and the booth stamp is T7; nothing on this tree
  // moves any of the four off these values.
  // ⭐⭐ v83 (the wedding, wave 7 – T1) APPENDS THE LAST TWO AT THEIR BIRTH VALUES, on the v77
  // paragraph's own argument above: this push is the one place a row is born, and the two values are
  // the same two the v82 -> v83 migration back-fills on every historical row. A new attachment is
  // not married (`latchedWeek: null` – the latch is T3's write, weeks after an engagement that
  // cannot fire before 23) and nobody has been named (`partnerName: null` – the name is written ONCE
  // at the engagement beat by `partnerNameFor`, never here and never re-derived).
```

### `lifeBeat.ts` §6 – the delivery

```ts
// =================================================================================================
// 6. THE DELIVERY – ⚠⚠ THE WEEK HE IS TOLD (the private life, wave 3: T6)
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T6. The arrival above wrote a fact about HER and
// told nobody; this is the other end of the lag, and it is the first moment the private life reaches
// a screen at all.
//
// ⚠⚠ IT FIRES ALWAYS, AND THE BOND BAND PICKS ONLY THE REGISTER (architect, 11.09 – the resolution
// of the build plan's §0.1 against its §4, on wave 2's own precedent). See the §3b banner for the
// three registers. The one-line eligibility change that would make `strained`/`cold` feed-only is
// named in the brief's §7 as a FALLBACK the owner may ask for; it is deliberately not pre-built.
//
// ⚠⚠ ZERO DRAWS, AND THE SHAPE IS WHY: this function reads facts the world already holds
// (`loveEpisodes`, `lifeLog`, `week`) and takes no `Rng` and derives no stream. `seed:life:smalltalk:*`
// is T8's and `seed:life:ends:*` is wave 4's; neither exists on this tree.
// ⚠ RE-AIMED 12.09 BY WAVE 4's T2: both of those keys exist now (§7 and §8). ⚠⚠ AND RE-AIMED AGAIN BY
// T4 THE SAME DAY, WHERE THE CLAIM ITSELF MOVED – recorded rather than rewritten, because a reader has
// to be able to tell which half changed. The section said «delivery derives no stream at all, on any
// wave»; ruling B's told-late branch derives ONE, `seed:life:ends:<endedWeek>:react`, to word the row
// it writes. That is a purpose-scoped sub-stream keyed on (seed, calendar) and re-derived at the call
// site – CLAUDE.md invariant 2's own shape – and MAIN is still never reached here, which is the part
// of the sentence that was load-bearing. ⚠ IT IS DERIVED ONLY ON THE BRANCH THAT WRITES A TOLD-LATE
// ROW: an ordinary `'met'` delivery, and a tick with nothing due, still derive nothing at all.
// ⚠ T2's own paragraph, kept because it explains the shape of this section: «T2 deliberately leaves
// that alone – it writes `endedWeek` and nothing else – so on THAT tree an episode that ends before
// its `knownWeek` told the parent nothing at all, which is a gap the next commit closes.» T4 is that
// commit.
//
// ⚠ AND IT DUPLICATES NONE OF THE QUEUE. `raiseLifeBeat` appends the row, `pendingLifeBeat` finds it,
// the `'life'` StopReason stops the week and `answerLifeBeat` re-validates the answer – all four are
// wave-2 property and all four are called, never re-implemented.
```

### `MET_EVENT` – the feed line the news itself writes, before anybody has answered

```ts
/** ⭐ THE FEED LINE THE NEWS ITSELF WRITES, before anybody has answered anything. Two of them, on the
 *  same three-rung ladder as the card: a home that was told, and a home that found out.
 *
 *  ⚠ NO `amountCents` AND NO PRICE IN ANY WORD OF IT (rule 4 at the top of this file). ⚠ AND NO FACT
 *  ABOUT THE PARTNER: the sim holds none, so neither does the row. T10 owns the full matrix (the
 *  brief's «by openness x wants x told-early/told-late»); these four are the draft that renders.
 *
 *  ⭐⭐⭐ v74 T7 – THE `wants` COLUMN IS HALF THE SURFACE THE FLIP HAS, AND IT IS THE DURABLE HALF.
 *  The card is answered once and gone; this row is `keep: true` and a career reads its own life back
 *  seasons later, so the feed is where a player who was not listening the first time can still learn
 *  what she asked for. ⚠ The `open` column is T6's two lines, BYTE-IDENTICAL. */
```

### `MET_EVENT_HEARD` – v76 T6 – the same week, written down by a parent who was taught to read her

```ts
/** ⭐⭐ v76 T6 – THE SAME WEEK, WRITTEN DOWN BY A PARENT WHO WAS TAUGHT TO READ HER – 8 drafts, and
 *  the durable half of the focus. The card is answered once and gone; this row is `keep: true`, so
 *  what a coached parent understood is what the album still says twenty seasons later.
 *
 *  ⚠ NO BOND COLUMN, WHICH IS `ENDED_LATE_EVENT`'s refusal inherited rather than re-decided: that
 *  pool «deliberately did not guess at» the told / found-out column, and the reason holds harder
 *  here. The standing row's two columns record HOW the news surfaced; what these eight record is what
 *  she wanted done with it, which is the same fact on every rung of the ladder.
 *
 *  ⚠⚠ AND NOT ONE OF THEM CLAIMS SHE SPOKE – the §3f banner's rule, and this pool is where it bites
 *  hardest, because the standing row it replaces has a column that says she did NOT
 *  (`'found-out'`). Every clause below is either the drawn read or a standing habit of hers.
 *
 *  ⚠ THE SECOND SENTENCE IS THE PARENT'S OWN, AND IT IS THE WHOLE OF WHAT THE SEAT SOLD HIM. It
 *  records that he heard her – never who taught him, never a session, never a word of hers he was
 *  told second-hand. The focus coaches the parent; her sessions are hers. */
```

### `ENDED_NOW_EVENT` – v75 T5 – the ending's own kept row, on the told-now path

```ts
/** ⭐⭐⭐ v75 T5 – THE ENDING'S OWN KEPT ROW, ON THE TOLD-NOW PATH. The album's other half: wave 3
 *  wrote «there is someone» and this is the week that stops being true, for a parent who already knew
 *  there was somebody.
 *
 *  ⚠⚠ IT IS BUILT HERE RATHER THAN IN T4 BECAUSE THE TREE SAID SO IN NINE PLACES AND THE BRIEF SAID
 *  SO IN ONE. `rollEnds` carried «NO FEED ROW ON THIS PATH (T5's, per the commit order)», and
 *  `loveEpisodes.ts`, `phaseHerWeek.ts`, `tests/spirit.test.ts`, `tests/wave4-ends.test.ts` and
 *  `tests/wave4-ended-beat.test.ts` all said the same thing in their own words. ⚠ THE T5 BRIEF
 *  NEVERTHELESS CALLS THIS ROW «T4's» and asks only for a STAMP on it – that is the one sentence of
 *  the brief this step does not build, because the row it names does not exist. Reported rather than
 *  worked around, which is the wave's standing rule; see the commit message.
 *
 *  ⚠⚠ WITHOUT IT THE COLUMN IS SILENT ON THE LOUDEST SCENE THE LAYER HAS. The told-now ending raised
 *  a card and, once answered, an `'info'` reply row – so the feed said what the PARENT did and never
 *  what happened. A glyph column bought for navigation («met someone · it ended») that cannot mark
 *  «it ended» for the common case is a column that half exists.
 *
 *  ⚠ ONE LINE, NO READ AXIS, NO BOND COLUMN – and both absences are ruled rather than skipped.
 *  Ruling I puts her read on «the HEADING and the told-late feed row» and enumerates its own surfaces
 *  as «4 heading cells plus 2 feed rows»; a read on this row would be a third surface, which is a
 *  ruling change and not a builder's. The bond band is `MET_EVENT`'s column and `ENDED_LATE_EVENT`
 *  refused to guess at it for T6 – this refuses the same way, for the same reason.
 *
 *  ⭐⭐⭐ AND THE REFUSAL WAS TESTED AND UPHELD – wave-5 ruling O (13.09), after T6 built a legible
 *  told-now row behind the listen focus and flagged it. **A focus may change how an existing surface
 *  reads; it may not create a surface.** The prompt goes up on this same tick and its heading already
 *  carries the read, so a row repeating it is one piece of news told twice. This sentence is what the
 *  album keeps for a told-now ending on EVERY career, coached or not – see `endedKeptRow`'s first
 *  line, where that is one branch and one pin.
 *
 *  ⚠ IT STATES WHAT THE WEEK HELD AND NOTHING ELSE: no reason, no fault, no channel the sim does not
 *  hold (the two-tier honesty law), no name, no gender, no `amountCents` and no price in any word of
 *  it (rule 4). ⚠ A DRAFT, AND T6 OWNS THE MATRIX – invariant 4 makes the final wording the owner's.
 *
 *  ⭐⭐⭐ RE-WRITTEN BY T6, AND THE OLD SENTENCE IS NAMED SO THE JUDGMENT CAN BE OVERRULED. It read
 *  «There was someone in her life, and this week there is not.» Two things were wrong with it and
 *  neither is a matter of taste.
 *
 *  1. ⚠⚠ IT INTRODUCED A PERSON THE ALBUM HAD ALREADY INTRODUCED. This row is the TOLD-NOW one, which
 *     fires only behind the `'met'` receipt – so a kept `MET_EVENT` row seasons up the same feed has
 *     already said «there is someone in her life», and both rows are `keep: true`, so they are read
 *     together for the life of the career. A closing row that opens by announcing the person reads as
 *     the album meeting her for a second first time. What this row is FOR is closing the earlier one.
 *  2. ⚠ «and this week there is not» IS A NARRATOR'S FIGURE, not a statement of the week. The antithesis
 *     performs the loss instead of recording it, which is the move the banned-tail list is a sample of
 *     rather than the whole of – and the lint's list is literal, so it would never have caught this.
 *
 *  ⚠ WHAT THE REPLACEMENT ASSERTS, AND ITS LICENCE FOR EACH HALF. «It ended this week» – `endEpisode`
 *  wrote `endedWeek = world.week` four lines above this row's write site. «There is nobody in her life
 *  now» – `activeEpisode` is null by construction once the row is dated, and the cooldown forbids a
 *  re-arrival on the same tick (T2's own pin), so it is the world's state and not a guess. Nothing
 *  else: no reason, no fault, no channel, no name, no gender, no duration, no bond band. */
```

### `ENDED_LATE_EVENT` – v75 T4 – the told-late row, which replaces MET_EVENT on this path

```ts
/** ⭐⭐⭐ v75 T4 – THE TOLD-LATE ROW, AND IT IS THE ROW THAT REPLACES `MET_EVENT` ON THIS PATH rather
 *  than a row added beside it. An episode that was over before its `knownWeek` arrived used to tell
 *  the parent NOTHING at all (wave 3 read the ended row through `knownPartner` and got null); ruling
 *  B turns that gap into the scene the episode schema was re-cut for, and this is the one line of it
 *  the album keeps.
 *
 *  ⚠⚠ ONE ROW AND NEVER TWO. A «she told us there is someone» line followed by «and it is over»
 *  would be the two contradictory records ruling A exists to prevent, written into the feed instead
 *  of into the queue. What happened this week is that he learned BOTH facts at once, and one sentence
 *  is what that is.
 *
 *  ⚠ IT CARRIES HER READ (the brief's «surfaced ... in the feed row's wording»), and this is the
 *  durable half of the two surfaces that do: the card is answered once and gone, and a `keep: true`
 *  row is what a player who was not listening can still read back seasons later. ⚠ T6 owns the full
 *  matrix – the bond-band column `MET_EVENT` carries is deliberately not guessed at here.
 *
 *  ⚠ NO `amountCents`, NO PRICE, NO NAME, NO GENDER, NO REASON AND NO FAULT (rule 4 and the two-tier
 *  honesty law). «There was someone, and it is already over» is the whole of what the world holds. */
```

### `ENDED_LATE_EVENT` – «and she left it there» was this row's first draft

```ts
  // ⚠ «and she left it there» WAS THIS ROW'S FIRST DRAFT AND THE TAIL-LINT CAUGHT IT
  // (tests/wave3-tail-lint.test.ts, `BANNED_TAILS`). It is on the list because the owner replaced
  // the fork's “We listened, and left it there” with a line of his own on 11.09, and the ban is on
  // the NARRATOR summing her up. The replacement states what the week held instead of what it meant.
  // ⭐⭐ RE-CUT BY v75 T6, AND THE TAIL IS WHERE BOTH ROWS FAILED. `company` said «and she has been
  // round more since»: a count of VISITS the sim models nowhere, at a stage where the parent may be
  // four hundred miles away, plus a «since» that is empty in the week the row is written. `space` said
  // «and she has not brought it up since» – the same empty span, and one conjugation from a banned
  // tail besides. ⚠ THE READ ITSELF IS LICENSED and stays: `drawEndsRead` is a persisted draw off her
  // own openness register, so «what she wants» is a fact of the world here and not the narrator
  // guessing at her interior. What the two rows carry now is that fact, in the present, with nothing
  // round it. ⚠ AND «it was over before we heard of it» IS TRUE ON BOTH PATHS: `rollEnds` writes
  // `endedWeek` at §8 and `deliverKnownPartner` reads it at §6 of the same tick, so even ruling A's
  // collision week hears of an attachment that had already ended.
  // ⚠ RE-CUT 12.09 with the heading cells above – the same presence axis, the same ruling.
```

### `ENDED_EVENT_HEARD` – v76 T6 – the ending's kept row as a coached parent writes it

```ts
/** ⭐⭐ v76 T6 – THE ENDING'S KEPT ROW AS A COACHED PARENT WRITES IT – 8 drafts, THE TOLD-LATE ROW
 *  ALONE, keyed voice × her read.
 *
 *  ⚠⚠⚠ RE-CUT BY T6b UNDER RULING O (13.09), AND THE HALF THAT CAME OUT IS RECORDED SO THE JUDGMENT
 *  CAN BE RE-OPENED RATHER THAN RE-DISCOVERED. T6 shipped this pool as voice × REGISTER × read – 16
 *  cells, the told-now half of them putting the space-vs-company read on a row that has never carried
 *  it – and flagged it as the one thing it wanted ruled. The architect ruled it OUT:
 *
 *    **A focus may change how an existing surface reads. It may not create a surface.**
 *
 *  The told-now card's prompt is raised on the SAME TICK as this row, and the heading already tells
 *  the parent what she wants; a row repeating it is one piece of news told twice, and giving it a read
 *  adds information it has never carried – invariant 4's territory and the owner's, not a wave about
 *  a psychologist. So `ENDED_NOW_EVENT`'s own refusal («a third surface, which is a ruling change and
 *  not a builder's») now holds in BOTH arms: heard or not, the told-now row is that one sentence, and
 *  `endedKeptRow` returns it whatever frame it is handed. Wave-4 ruling I's enumeration – «4 heading
 *  cells plus 2 feed rows» – is therefore intact, and what the focus moved on the ending is the
 *  HEADING (`ENDED_HEADING_HEARD`, 16 cells) plus THIS row, which is ruling I's second feed row.
 *
 *  ⚠ THE TOLD-LATE HALF STAYS, and the asymmetry is the ruling's own test rather than an exception to
 *  it. The question is «did this surface already carry the read»: `ENDED_LATE_EVENT` is indexed BY THE
 *  READ and has been since wave 4, so a legible version changes how an existing surface reads and
 *  creates nothing; `ENDED_NOW_EVENT` is one string and never carried it. The same test one pool over:
 *  `MET_EVENT_HEARD` is allowed because the met kept row already carried her `wants`. ⚠ AND WHAT IS
 *  UNIQUE ABOUT THIS ROW IS DURABILITY, NOT EXCLUSIVITY – both registers' HEADINGS carry the read too;
 *  what the told-late row alone is, is the surface that OUTLIVES the card (`keep: true` against a card
 *  answered once and gone), which is `ENDED_LATE_EVENT`'s own stated reason for carrying it.
 *
 *  ⚠ NO BOND COLUMN – `ENDED_LATE_EVENT`'s refusal inherited rather than re-decided.
 *
 *  ⚠ THE READ HALF OF EVERY CELL IS THE STANDING POOL'S OWN WORDING, kept deliberately: «she wants
 *  the room to herself» / «she does not want to be on her own with it» is one fact with one sentence,
 *  and a second way of saying it would put two readings of one draw into the album.
 *
 *  ⚠ AND THE CLAUSE IN FRONT OF IT IS A STANDING HABIT OF HERS, never this week's telling – the §3f
 *  banner's rule. `sunny` puts being alright first and the asking after; `fiery`'s heat is never the
 *  measure of a thing; `quiet` puts the arrangements in front of herself; `deep` gives a thing its
 *  exact size, so few words are never a small thing. */
```

### `metKeptRow` – The kept row, one function per kind

```ts
/** ⭐ THE KEPT ROW, ONE FUNCTION PER KIND, so «which sentence does the album keep» has exactly one
 *  spelling and the ambiguous arm is provably the bytes that shipped. `null` is the standing row.
 *
 *  ⚠ THEY TAKE THE SAME `HeardRead | null` THE HEADING TAKES, because the row and the card raised in
 *  the same tick read ONE coin – the raise site draws it once and hands it to both. Two calls would
 *  be two values on one key's worth of meaning, and the surfaces would disagree.
 *
 *  ⚠ EXPORTED FOR THE COMPLETENESS PIN, `lifeBeatSaid`'s own reason: these pools are module-private
 *  `const`s and the confidentiality lint has to reach EVERY cell of them without posing a world per
 *  cell. The tail-lint reads this file's source for exactly this problem; a pure reader is exact
 *  where a source cut is fragile. */
```

### `endedKeptRow` – ruling O – spelt as the first line of this function

```ts
  // ⭐⭐⭐ RULING O, AND IT IS SPELT AS THE FIRST LINE OF THIS FUNCTION BECAUSE THAT IS WHERE IT CAN BE
  // PINNED. The told-now row is READ-FREE IN BOTH ARMS – one string, whatever frame the raise site
  // hands over – so «is this row legible» has the same answer on a coached week as on any other, and
  // the pin is a byte-identity across the toggle rather than a promise in a comment. See
  // `ENDED_EVENT_HEARD`'s ⚠⚠⚠ note for the ruling and `ENDED_NOW_EVENT`'s for what the sentence
  // asserts. ⚠ THE `read` ARGUMENT IS DELIBERATELY NOT CONSULTED HERE and the register is tested
  // FIRST: a branch order that asked about `heard` first would put the legible arm in front of the
  // ruling, which is precisely the shape that shipped and had to be re-cut.
```

### `deliverKnownPartner` – The delivery, and the one writer of a 'met' row

```ts
/** ⭐⭐⭐ THE DELIVERY, AND THE ONE WRITER OF A `'met'` ROW. ⭐⭐ SINCE v75 T4 IT IS ALSO THE ONE WRITER
 *  OF A **TOLD-LATE** `'ended'` ROW – the same moment, asked of an episode that is already over.
 *
 *  ⚠⚠ EXACTLY ONCE PER EPISODE, AND THE RECEIPT IS THE `lifeLog` ITSELF – a `'met'` or (since T4) an
 *  `'ended'` row whose `detail` is this episode's id. That is `pendingLifeBeat`'s own doctrine read
 *  the other way round
 *  («the record IS the queue», rule 2): there is no `told: true` flag on the episode, because a
 *  second boolean beside a record that already answers the question is one fact with two sources of
 *  truth, and they desync.
 *
 *  ⚠ `<=` AND NOT `===`, DELIBERATELY. The beat is owed on `knownWeek`; the comparison being an
 *  inequality means a week that somehow passed without this running still delivers on the next tick
 *  instead of losing the news for good. The dedupe above is what makes that safe, and the two
 *  together are the property the pin asserts: it fires on `knownWeek`, and it fires once.
 *
 *  ⚠⚠ RE-AIMED BY v75 T4 (ruling B) AND THE OLD SENTENCE IS KEPT SO THE RE-AIM READS AS ONE. It said:
 *  «IT ASKS `activeEpisode` THROUGH `knownPartner`, so "not ended" has ONE spelling in this layer. An
 *  attachment that ended before its `knownWeek` arrived tells the parent nothing here – wave 4's
 *  endings own that late row, and a fact saying "there is someone" about somebody already gone would
 *  be the one dishonest thing this beat could say.» WHAT MOVED: wave 4's endings own that late row
 *  FROM HERE, because there is nowhere else it could be raised – the ending week is the wrong week
 *  for it and §8 has no way to know a future `knownWeek`. WHAT DID NOT: the dishonest sentence is
 *  still refused. An ended episode does not get «there is someone»; it gets a row and a card that say
 *  there WAS, and that it is over, in the one breath the parent heard both.
 *
 *  ⚠ THE ROW IS `keep: true` – the brief's «a KEPT feed row». `pruneEvents` drops ordinary rows at
 *  sixty weeks and a career reads its own life back seasons later; the week someone appeared in it
 *  is not a line the album may be missing. */
```

### `deliverKnownPartner` – v75 T4, ruling b – it scans the list now

```ts
  // ⭐⭐⭐ v75 T4, RULING B – IT SCANS THE LIST NOW, AND THE TAIL READ IS GONE. This was
  // `knownPartner(world, world.week)`, which goes `activeEpisode()` -> the tail row -> **and only if
  // it is still open** – so from the moment endings are real it returns null for exactly the episodes
  // the told-late scene is about.
  //
  // ⚠⚠ WHY A SCAN AND NOT A TAIL READ WITH A GUARD, kept from the ruling because the next reader will
  // want to «simplify» it back. Today's constants do happen to guarantee the undelivered row is the
  // tail – a new row cannot be appended before the old one is delivered unless `cooldown <= lag − 1`,
  // and the tightest pair is fiery's `12 <= 3`, false with nine weeks to spare (sunny `26 <= 3`,
  // quiet `39 <= 11`, deep `52 <= 11`). But that is an accident of two unrelated constant tables,
  // either of which the планка-3 session or step 6 may move. The scan costs one loop and is this
  // layer's own idiom already: `pendingLifeBeat` takes the FIRST unanswered row for the stated reason
  // that «a queue that answered its newest entry first would lose the oldest».
  //
  // ⚠ THE RECEIPT IS BOTH KINDS HERE, and that is the half a reader could get wrong: a row that has
  // already surfaced as a told-late ending must not surface again, so the dedupe asks «has this
  // episode produced ANY beat», while ruling A's register asks the narrower «was he told there was
  // somebody» (`'met'` alone). Two questions, one helper, two argument lists.
```

### `deliverKnownPartner` – The split, and it is the whole of ruling b

```ts
  // ⭐⭐⭐ THE SPLIT, AND IT IS THE WHOLE OF RULING B. An OPEN row takes the `'met'` path below, BYTE
  // UNCHANGED – same row, same text, same beat, same dedupe; an ENDED one takes the told-late path,
  // which raises `'ended'` and **no `'met'`, ever**.
  // ⭐⭐⭐ v76 T6 – ONE COIN PER RAISE, DRAWN HERE AND SPENT TWICE. `seed:psy:listen:<kind>:<week>`
  // decides whether the kept row below and the card raised beside it say plainly what she wants; the
  // row's TEXT is persisted now and the card's heading is re-assembled on every snapshot, so the two
  // must come off ONE value or they will part the first week a rung changes (ruling E). `null` when
  // nobody is teaching him to listen – and it is a null with ZERO DRAWS behind it, not a discarded
  // one. ⚠ THE KIND IS THE ONE BEING RAISED, which is why the two branches ask separately.
```

### `deliverKnownPartner` – no amount (rule 4), and the read comes off the ending's own week

```ts
      // ⚠ NO AMOUNT (rule 4), and the read comes off the ENDING's own week – `beatEndsRead`'s twin
      // through the same derivation, so the row and the card the same tick raises cannot disagree.
      // ⚠⚠ BIRTH, AND IT MUST NOT MOVE TO `expressedTemperamentOf` – v76's T7, THE ARCHITECT'S
      // RULING A. The sentence directly above is the whole argument: this row and `beatEndsRead`'s
      // card are TWINS, the card's read is a PRICE INPUT that `answerLifeBeat` re-derives, and twins
      // that read two different girls would print one wording and charge another. The TEXT here is
      // persisted; the READ behind it is not, and re-derivation against a moved expression would
      // rewrite history. ⚠ THE TEMPERAMENT-INDEXED POOLS BESIDE IT READ BIRTH FOR THE OTHER REASON
      // (§0.2's fence, `voiceOf` above) – two different laws landing on one line, both saying birth.
```

### `lifeBeat.ts` §7 – tier-1 small talk – moved to smallTalk.ts

```ts
// =================================================================================================
// 7. TIER-1 SMALL TALK – MOVED TO `world/lifeBeat/smallTalk.ts` (A-06 / T6.10, 28.09)
// =================================================================================================
//
// The week she comes with something small left whole – banner, chronicles and all – and it was the most
// coupled of the seven: it reaches TWELVE names in this hub, four of them in §3c-2's situation layer.
// All twelve stay here, because the hub still CALLS §3c-2 (§3k reads it eight times) and a section the
// hub calls is not ready to move (P4's rule). Its four names are NOT re-exported here –
// `src/engine/world.ts` takes them off the kind module directly. ⚠ `'small-talk'`'s COPY is §3c above,
// `world/lifeBeat/smallTalkCopy.ts`, which this hub still imports because the prompt is assembled here;
// the kind module reads that copy as a sibling. The two halves of a kind are never one file.
// =================================================================================================
// 8. THE END – MOVED TO `world/lifeBeat/ended.ts` (A-06 / T6.10, 28.09)
// =================================================================================================
//
// The week it is over left whole – banner, chronicles and all – and the section imports `endedKeptRow`,
// `hasBeatFor`, `listenHeardNow`, `raiseLifeBeat` and `voiceOf` back from this hub, which is why its
// three names are NOT re-exported here: `src/engine/world.ts` takes them off the kind module directly.
// ⚠ `divorcedKeptRow` WENT WITH IT rather than staying on this hub's import list: §8 was its only
// caller, and the kind module reads `world/lifeBeat/divorcedCopy.ts` – a copy leaf – itself. `'ended'`'s
// own copy is §3e above, which this hub still imports because the prompt is assembled hub-side.
// =================================================================================================
// 9. THE LEAK – MOVED TO `world/lifeBeat/leak.ts` (A-06 / T6.8, 28.09)
// =================================================================================================
//
// The pilot move of the split: §9 referenced nothing in this file and nothing here referenced it, so
// it left whole – banner, chronicles and all.
//
// ⚠⚠ THE RE-EXPORT THAT USED TO SIT HERE WENT ON 28.09 (T6.10), AND ITS ABSENCE IS THE RULE RATHER THAN
// A TIDY-UP. T6.8 could re-export the leak's four names from this hub because this section references
// nothing – no cycle was possible. But the hub carrying a kind module's names for the barrel's sake is
// the SHAPE that becomes a cycle the moment that kind needs the hub, which is exactly what stopped the
// other seven hazard sections here for a whole task. So the rule is mechanical and has no exceptions:
// `src/engine/world.ts` takes a kind module's names from the KIND MODULE. CLAUDE.md's life-beat line
// says it, and `tests/principles-a06-life-beat-direction.test.ts` refuses a hub re-export per module.
```

### `lifeBeat.ts` §11 – the wedding – moved to wedding.ts

```ts
// =================================================================================================
// 11. THE WEDDING – MOVED TO `world/lifeBeat/wedding.ts` (A-06 / T6.10, 28.09)
// =================================================================================================
//
// The week she decides to marry left whole – banner, chronicles and all – and the section imports
// `hasBeatFor`, `kidAgeNow`, `lifeLogOf` and `raiseLifeBeat` back from this hub, which is why its five
// names are NOT re-exported here: `src/engine/world.ts` takes them off the kind module directly.
// ⚠ `'engaged'`'s COPY is a different module, `world/lifeBeat/weddingCopy.ts`, which this hub DOES
// import – §3g above. The two halves of a kind are never one file; see that file's header for why.
// =================================================================================================
// 12. THE SPOUSE'S OPINION SURFACE – ⚠⚠ THE WEEK THE ONE SHE MARRIED HAS SOMETHING TO SAY
//     (the wedding, wave 7: T5)
// =================================================================================================
//
// `docs/plans/life-wave-7-builder-2026-09.md` §2 T5, constants in `ECONOMY.wedding`. §11 decides
// whether the episode becomes a marriage; this is what the marriage IS at W1–W2 – no `spouseBond`,
// no second tracked number (the 18.09 adoption): the spouse's standing is these beats and the
// diary's texture, and the surface goes quiet the day the latch does.
//
// ⚠⚠ THE WAVE'S THIRD AND LAST STREAM, RESERVED BY THE BRIEF'S §0 AND CREATED HERE:
//
//     seed:life:spouse-view:<week>          which occasion, this week
//
// (seed, calendar)-keyed like every sibling, so a player cannot conjure or dodge the spouse's word
// by playing the week differently. ONE key, ONE value (the 09.09 stream law): the occasion pick is
// the only randomness this section owns – whether the beat fires at all is FACTS (the gate and the
// occasions below), never a hazard, which is the brief's own reading: «triggers READ existing world
// facts», and the draw is only ever asked to choose among the true ones.
//
// ⚠⚠ ZERO DRAWS ON MAIN (structural – nothing here takes an `Rng`), ZERO draws on an ineligible
// week AND on an eligible week with no true occasion – the gate and the filter both return before
// the stream exists, never draw-and-discard. The test is a KEY COUNT with a positive control
// (wave 3's finding, §5's standing law), in tests/wave7-spouse-view.test.ts §B. A frozen career
// (156 weeks, age 16.6) can never hold a latch, so this section is unreachable there by
// construction and the frozen identity stands.
//
// ⚠⚠ EVERY OCCASION IS A READ OF A SEAM THAT ALREADY ANSWERS IT – the brief's own boundary («no
// household ledger, no second wallet, no arithmetic»), and each gate below names its donor at the
// cell. Nothing here derives a new fact about the world; it asks four old ones.
```

### `SPOUSE_VIEW_OCCASION_AT` – the four gates, one per occasion, each a pure zero-draw read

```ts
/** ⭐⭐⭐ THE FOUR GATES, ONE PER OCCASION, EACH A PURE ZERO-DRAW READ OF AN EXISTING SEAM – the
 *  `SMALL_TALK_FACT` table's own shape, asked BEFORE the draw so a false fact removes the occasion
 *  from the pool instead of being papered over in the copy (its own rule, inherited whole).
 *
 *  · `'distant-swing'` – the NEXT entered event crosses a border. The entry fields are
 *    `nextWeekIsClear`'s own two (`world.season` + `world.entries`, spelled inline for its stated
 *    cycle reason), and «crosses a border» is the tier's own `track` – `diary/travelHome.ts:521`
 *    reads `abroad` off exactly this field (`=== 'itf'`, the junior ladder that file is about);
 *    here it is `!== 'domestic'`, the same fact at the ages a marriage exists: her internationals
 *    are the W/WTA rungs by 23, and a gate spelled `'itf'` would have called a Slam a home week.
 *  · `'road-stretch'` – the family has been on the road: travel-billed weeks in the trailing
 *    `FRIENDS_WINDOW` at or past `AWAY_OFTEN`, which is the friends tile's own band («Mostly by
 *    phone») off the same `financeWeeks` read `world/snapshot.ts` assembles for it – «a week in
 *    which a travel bill was actually paid is a week the family was somewhere else».
 *  · `'no-vacation'` – `seasonWrapsWithNoVacation`, spirit.ts's season-boundary block ITSELF: true
 *    on the ONE week a season wraps with no family week in it, false everywhere else – so this
 *    occasion exists exactly where the fact is readable, and the spouse and the −3/−3 block can
 *    never disagree about whether the family had a holiday.
 *  · `'money'` – round 23 #18's split, read and never re-derived: a `financeWeeks` category at or
 *    under −`spouseViewSpendCents` inside the marriage's own trailing window (after the latch, so
 *    the wedding's own bill – paid ON `latchedWeek` – can never be the complaint), while her
 *    account holds more than the family wallet (`kidFundsCents` vs `fundsCents`, two persisted
 *    balances compared and nothing summed – beats about money, never accounting). */
```

### `spouseViewEligible` – The gate – all four, and a false here means zero

```ts
/** ⭐⭐ THE GATE – ALL FOUR, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one. A predicate
 *  of its own for `arrivalEligible`'s stated reason. Pure, zero draws, no writes.
 *
 *  1. A LIVE LATCH – the surface belongs to the marriage and to nothing before or after it: no
 *     latch, no spouse; an ended latch is an ended surface (the divorce door's other half, free).
 *  2. NOTHING BLOCKING IS WAITING – `smallTalkEligible`'s clause 1, same words: the week she has
 *     been asked the biggest question of her life is not the week the spouse queues behind it.
 *  3. NOT WHILE A SOFT ROW IS LIVE – «one at a time», clause 2's own argument: a second live card
 *     would queue invisibly or replace the first, and replacing is how «never lost» stops being
 *     true.
 *  4. THE COOLDOWN, OFF THE LOG ITSELF – the row is the counter (`smallTalkThisSeason`'s doctrine,
 *     no new state): no `'spouse-view'` row inside the trailing `spouseViewCooldownWeeks`. ⚠ It
 *     counts RAISED rows, answered or not – a card the parent ignored still spent the marriage's
 *     turn to speak. */
```

### `rollSpouseView` – The weekly call, and the one raise site

```ts
/** ⭐⭐⭐ THE WEEKLY CALL, and the ONE raise site of a `'spouse-view'` row.
 *
 *  ⚠⚠ THE GATE RUNS FIRST, THE OCCASIONS SECOND, AND THE STREAM IS DERIVED ONLY WHEN BOTH HAVE
 *  PASSED – an ineligible week takes ZERO draws, and so does an eligible week with nothing true to
 *  say (the small-talk reachable-empty discipline, inherited whole; there is no legacy fallback
 *  here because a spouse with no occasion simply says nothing this week).
 *
 *  ⚠ NO HAZARD AND NO CHANCE CONSTANT, WHICH IS THE BRIEF READ LITERALLY: «triggers READ existing
 *  world facts» – the facts fire the beat, the cooldown bounds it, and the one draw picks WHICH
 *  true occasion is spoken (uniform over the true set, `drawPartnerWants`' own pickInt shape). A
 *  per-week chance would be a design decision wearing a constant nobody drafted.
 *
 *  ⚠ THE DETAIL IS THE OCCASION – machine-readable, never a rendered sentence, stamped and never
 *  re-derived (tier 1's own argument: the row is live for three weeks and re-assembled on every
 *  `toSnapshot`, and a re-derivation could hand the parent a complaint about a season that has
 *  since moved on – or one whose fact has gone false). */
```

### `lifeBeat.ts` §13 – the independent life – moved to ownKey.ts

```ts
// =================================================================================================
// 13. THE INDEPENDENT LIFE – MOVED TO `world/lifeBeat/ownKey.ts` (A-06 / T6.10, 28.09)
// =================================================================================================
//
// The week she lives behind her own door left whole – banner, chronicles and all – and it imports five
// names back from this hub, which is why its three names are NOT re-exported here:
// `src/engine/world.ts` takes them off the kind module directly. ⚠ IT WAS ONE OF THE TWO SECTIONS THE
// first pass could not move, because `world/snapshot.ts` reaches `ownKeyThisWeek` through `'./lifeBeat'`
// – a sibling's relative specifier, invisible to an importer census run on the path spelling. That
// import is now split; see the kind module's header for the general form of the blindness.
// ⚠ `'own-key'`'s COPY is §3i above, `world/lifeBeat/ownKeyCopy.ts`, which this hub still imports because
// the prompt is assembled here; the kind module reads `OWN_KEY_ROW` off it as a sibling.
// =================================================================================================
// 14. THE PREGNANCY – MOVED TO `world/lifeBeat/pregnancy.ts` (A-06 / T6.10, 28.09)
// =================================================================================================
//
// The whole arc – the week she says she is having a child, the pause, the birth, the decision week and
// the comeback – left whole, banner and chronicles included. It was the LARGEST of the nine hazard
// sections (792 lines, 13 declarations) and the last to move, because `world/snapshot.ts` and
// `world/endings.ts` both reach into it with a SIBLING's relative specifier (`from './lifeBeat'`), which
// an importer census run on the path spelling cannot see. Both are now split. Its eleven names are NOT
// re-exported here: `src/engine/world.ts` takes them off the kind module directly.
// ⚠ `'expecting'`'s COPY is §3j above, `world/lifeBeat/pregnancyCopy.ts`, which this hub still imports
// because the prompt is assembled here. ⚠ AND THE ARC'S OTHER HALF IS `world/lifeBeat/weight.ts` (§15):
// the loss and the hidden window. Two files, two sets of keys, and the keys must never be confused.
// =================================================================================================
// 15. THE WEIGHT – MOVED TO `world/lifeBeat/weight.ts` (A-06 / T6.10, 28.09)
// =================================================================================================
//
// The switch, the hidden window and the two griefs left whole – banner, chronicles and all – and the
// section imports `kidAgeNow` back from this hub, which is why its four names are NOT re-exported
// here. `src/engine/world.ts` takes them off the kind module directly. ⚠ `LOSS_HER_LINE` and
// `lossLineFor` went with it: they are read by nothing outside the section, which is what made it a
// span-move candidate in the first place (0 inbound in the lane's probe).
// =================================================================================================
// 16. A DEATH IN THE FAMILY – MOVED TO `world/lifeBeat/bereavement.ts` (A-06 / T6.10, 28.09)
// =================================================================================================
//
// The first of the seven hazard sections T6.8 could not move: it left whole – banner, chronicles and
// all – and it imports `kidAgeNow` and `raiseLifeBeat` back from this hub, which is why its three
// names are NOT re-exported here. `src/engine/world.ts` takes them off the kind module directly, so
// the barrel's name set did not move and the arrow runs one way. See that file's header.
```
