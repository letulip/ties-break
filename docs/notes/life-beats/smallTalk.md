---
type: reference
status: current
area: engine
last-reviewed: 2026-09-29
---

# Life beat – smallTalk

The comment chronicles that stood in `smallTalk.ts` and `smallTalkCopy.ts` under `src/engine/world/lifeBeat/`, moved here verbatim (T7.4 of the principles fix). The source keeps each site's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to the site's heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## Hazard module – `smallTalk.ts`

### `smallTalk.ts` header

```ts
// A-06 / T6.10 – `world/lifeBeat.ts` §7 MOVED HERE VERBATIM, span for span, comments and all.
//
// ⚠⚠ THE MOST COUPLED OF THE SEVEN, AND IT MOVED LAST FOR THAT REASON. §7 reaches TWELVE names in the
// hub – four of them in §3c-2, round 42's situation layer – which is why it is imported from here as a
// list rather than one or two helpers. Every one of those names stays in the hub on P4's own rule: the
// hub still CALLS §3c-2 (§3k's `buildLifeBeatPrompt` reads it eight times), so §3c-2 is the hub's, and
// a section the hub calls is not ready to move.
//
// ⚠ THE HAZARD DIRECTION, as `world/lifeBeat/bereavement.ts`'s header sets it out: this module imports
// the hub, so the hub re-exports NOTHING of it. `src/engine/world.ts` takes the four names off
// `./world/lifeBeat/smallTalk` and re-exports them on its existing export statement, so the barrel's
// frozen name set (T6.6) does not move a specifier; `world/phaseHerWeek.ts` asks this module for
// `rollSmallTalk`. The edge runs world.ts → smallTalk → lifeBeat, and the hub reaches `world.ts` only as
// `import type`, erased.
//
// ⚠ THE COPY IS A SEPARATE MODULE, `world/lifeBeat/smallTalkCopy.ts` (T6.8), and this file reads it as a
// SIBLING – the subjects, the subject picker and the `SmallTalkSubject` type. The hub reads it too,
// because the prompt is assembled hub-side. A copy leaf may be read by the hub and by a hazard alike;
// what it may never do is import one back. That is CLAUDE.md's life-beat rule and the reason a kind is
// never one file with both halves.
//
// ⚠ FOUR SUB-STREAMS LIVE HERE NOW – `seed:life:small-talk:<season>`, `:small-talk-week:<season>`,
// `:small-talk-subject:<week>` and `:small-talk-situation:<week>` – and they stay in T3.9's inventory
// (`tests/life-beat-keys.test.ts`, 26 keys, set equality) because the file is FLAT in `world/lifeBeat/`,
// which is what `engineModuleSource` reads. A key that left that inventory would re-deal every career's
// small talk with nothing going red.
//
// `WorldState` comes from `../state`, the module that declares it (CLAUDE.md's P4 rule).
```

### `smallTalk.ts` §7 – tier-1 small talk

```ts
// =================================================================================================
// 7. TIER-1 SMALL TALK – ⚠⚠ THE WEEK SHE COMES WITH SOMETHING SMALL (the private life, wave 3: T8)
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T8, constants in `ECONOMY.life` (§4's last row).
// Sections 5 and 6 above are ONE attachment's whole arc; this is the layer's other half – the
// ordinary week in which nothing happened except that she talked to her parent.
//
// ⚠⚠ THE FOURTH AND LAST STREAM OF THE WAVE, and it is the one this file has been reserving:
//
//     seed:life:smalltalk:<week>           does she come with something small, this week
//
// (seed, calendar)-keyed like the other three, so a player cannot manufacture a conversation by
// playing the week differently. `seed:life:ends:*` is WAVE 4's and does not exist on this tree.
// ⚠ RE-AIMED 12.09 BY WAVE 4's T2: `seed:life:ends:<week>` now DOES exist, in §8 below, and this
// section still does not derive it – which is the claim the sentence was making and the one the
// count-keys pin in tests/wave3-small-talk.test.ts §B holds `rollSmallTalk` to. ⚠ RE-AIMED AGAIN BY
// T4: `:ends:<week>:react` exists now too (§3e, `drawEndsRead`), and this section still derives
// neither of them – which is, again, the whole of the claim.
//
// ⚠⚠ ZERO DRAWS ON MAIN AND ZERO DRAWS ON AN INELIGIBLE WEEK. The first is structural (nothing here
// takes an `Rng`, so the frozen capture 41550 / e6b0c709 cannot see this file). The second is T3's
// load-bearing rule inherited whole: `smallTalkEligible` decides EVERYTHING – the pending queue, the
// season cap and the two bands priced at zero – and `rollSmallTalk` returns on it BEFORE the stream
// is derived. A `strained` or `cold` home takes no draw at all; it never compares one against 0.
//
// ⚠ AND THE TEST FOR THAT IS A KEY COUNT, NOT AN ALIGNMENT COMPARISON – the finding T3 recorded and
// this step inherits verbatim. Every key here carries its own week, so a discarded draw shifts no
// other week's value and «two worlds produce identical later verdicts» stays green under the very
// draw-and-discard mutation it would be written to catch. `tests/wave3-small-talk.test.ts` §B counts
// the keys the gate reached, in an array the code under test cannot see, with a positive control.
//
// ⚠ IT RAISES A BEAT AND WRITES NO FEED ROW – not here and not on the answer (see `ANSWER_EVENT`).
```

### `smallTalkThisSeason` – How many small-talk rows this season already holds

```ts
/** ⭐⭐ HOW MANY SMALL-TALK ROWS THIS SEASON ALREADY HOLDS – **THE LOG IS THE COUNTER**, and there is
 *  no new state anywhere in this step (who-she-is §5b line item 6).
 *
 *  ⚠⚠ TWO FILTERS AND BOTH ARE LOAD-BEARING, which is why this is a function rather than a `length`.
 *  `lifeLog` is the whole life: it also holds `'fork-opinion'` (once a career) and `'met'` (once an
 *  attachment), and it is never pruned. A count that read the log's LENGTH would cap her small talk
 *  on the week she was told there is someone, and a count that forgot the season would cap it for
 *  the rest of her life at four conversations. `seasonIndexOf` is the engine's ONE definition of
 *  «this season» (world/ledger.ts) – the same one the Money screen's window and the season wrap-up
 *  read, so a season can never mean two spans on two surfaces. */
```

### `smallTalkEligible` – The gate – all three, and a false here means zero

```ts
/** ⭐⭐ THE GATE – ALL THREE, AND A FALSE HERE MEANS **ZERO DRAWS**, not a discarded one.
 *
 *  ⚠⚠ A PREDICATE OF ITS OWN FOR `arrivalEligible`'s OWN REASON: a reader has to be able to see, in
 *  one place, that the whole of eligibility is decided before any stream exists. Pure, zero draws,
 *  no writes.
 *
 *  1. NOTHING BLOCKING IS ALREADY WAITING (the brief's «fires only when no beat is already pending
 *     that week»). The queue is answered one card at a time and the week is already stopped; adding a
 *     small thing behind the biggest news of her life would make the parent answer them in the wrong
 *     order for the rest of the week. ⚠ v74 T15 – `pendingLifeBeat` reads BLOCKING rows now, so this
 *     clause says exactly what it always meant: she does not come with something small on the week
 *     she has been asked the biggest question of her life.
 *  2. ⭐⭐ v74 T15 – AND NOT WHILE SHE IS STILL WAITING TO BE HEARD ON THE LAST ONE («one at a time»,
 *     who-she-is §5b's amendment). A live unanswered soft row already has a card on the hub; a second
 *     would either queue behind it invisibly or replace it, and replacing it is how «never lost»
 *     stops being true. ⚠ AND IT IS THE **LIVE** ONE AND NOT ANY UNANSWERED ONE: an expired row is
 *     the record of a moment that passed, and a career that fell silent for ever because one
 *     conversation went unanswered in week 9 would be the deferral's own bug wearing a TTL.
 *  3. THE SEASON CAP – four, off the log itself. ⚠ IT COUNTS RAISED ROWS, ANSWERED OR NOT (§5b's
 *     amendment: «the season cap counts raised rows whether answered or not»), which is what
 *     `smallTalkThisSeason` has always done: the row is the counter and the answer is not part of it.
 *  4. THE BAND'S OWN CHANCE IS ABOVE ZERO. ⚠⚠ THIS CLAUSE IS THE SHORT-CIRCUIT AND NOT AN
 *     OPTIMISATION: `strained` and `cold` are priced at 0, and a 0 compared against a DRAWN uniform
 *     would take a draw on a week the design says is silent. `>` and not `>=` for `rollArrival`'s
 *     own reason in reverse – a chance of zero must be impossible rather than merely unlikely.
 *     ⚠ IT IS ALSO WHY THE CARD CANNOT EXIST AT `cold`: nothing raises a row there, so nothing is
 *     ever live there – «the silence is still the line». */
```

### `rollSmallTalk` – The weekly roll – the one writer of a 'small-talk' row

```ts
/** ⭐⭐⭐ THE WEEKLY ROLL, and the ONE writer of a `'small-talk'` row.
 *
 *  ⭐⭐ IT IS CALLED AGAIN SINCE v74 T15 (11.09.2026), THROUGH THE SOFT PATH. The history is kept
 *  because it is the reason this section is shaped the way it is: T8 shipped the raise through tier
 *  2's HARD pause, §5b prices tier 1 «soft – answerable, never lost», and the owner ruled the raise
 *  off («вариант 3»: raise reverted, engine kept) for exactly as long as it took to specify the
 *  surface. T15 built it – `LIFE_BEAT_BLOCKING` declares the kind non-blocking, `pendingLifeBeat`
 *  narrows to blocking rows, `liveSoftBeat` holds the three-week window and a Home card opens the
 *  same dialog – so `world/phaseHerWeek.ts` calls this again, in the position the deferral's note
 *  reserved for it, and a raised row now stops nothing.
 *  ⚠ AND THE SECOND RULING, HONOURED HERE: NO AGE GATE. She talks at any age – a child bringing a
 *  parent a worry, a joy or a question is natural at any age, and tier 1 is texture rather than part
 *  of the romance layer – so `smallTalkEligible` does NOT inherit `arrivalEligible`'s
 *  sixteenth-birthday gate, and must not acquire one.
 *
 *  ⚠⚠ THE GATE RUNS FIRST AND RETURNS BEFORE ANY STREAM IS DERIVED. The line order IS the rule;
 *  moving the roll above the gate would break it silently, because every key here carries its own
 *  week and a discarded draw changes no other week's value.
 *
 *  ⚠ THE BOND AND THE SPIRIT IT READS ARE LAST WEEK'S SETTLED VALUES, because it is written to run
 *  before `accrueSpirit` – `rollArrival`'s own argument one section up, and for the same reason:
 *  what she brings to the table is about the week that has just been lived, not about what this same
 *  tick is on its way to doing to her. (T15 restored the call site to exactly that position, which is
 *  the one the deferral's note reserved.)
 *
 *  ⚠ THE SUBJECT IS DERIVED AND NEVER DRAWN (`smallTalkSubjectFor`) – the wave owns four stream keys
 *  and this one answers a single question. */
```

### `rollSmallTalk` – Round 42 #24 – what she comes with, drawn rather than derived

```ts
  // ⭐⭐⭐ ROUND 42 #24 – WHAT SHE COMES WITH, DRAWN RATHER THAN DERIVED (spec §2), and it happens in
  // THIS order for a reason: the situations she could honestly bring are found FIRST, and the subject
  // is drawn over the subjects that survived. Drawing the subject first and then discovering it has
  // no situation would leave the beat with a choice between a re-roll (a second read off one key) and
  // a silent fall-through (a heading about a worry over an opener about a coach).
  // ⭐⭐⭐ ROUND 43 #8(a) – AND WHAT SHE SAID LAST TIME IS TAKEN OFF THE TABLE FIRST. The owner got
  // `watching-players` twice running («они точно не должны так часто повторяться, иначе в чём
  // смысл»), and that was a GUARANTEE rather than bad luck: the draw excluded nothing said before,
  // so a subject holding one situation repeated VERBATIM the moment the weights picked it twice.
  // ⚠ IT NARROWS THE POOL BEFORE THE SUBJECT IS DRAWN, NOT AFTER. Drawing the subject over the full
  // reachable set and then excluding inside it is the same defect `reachable` itself was built to
  // avoid one paragraph up – a single-situation subject would win the weights and then have nothing
  // left to offer, and the beat would owe a re-roll or a fall-through.
```

### `rollSmallTalk` – The detail is the subject and the situation

```ts
  // ⚠ THE DETAIL IS THE SUBJECT **AND THE SITUATION** – machine-readable, never a rendered sentence
  // (`LifeBeatRecord`), and it is what `lifeBeatSaid`, the option labels and her replies are all
  // selected with. STAMPED AND NEVER RE-DERIVED, `'fork-counsel'`'s own argument: the row is live for
  // three weeks and is re-assembled on every `toSnapshot`, so a re-derivation could hand the parent a
  // different small thing from the one she came with – and could hand him one whose competitive fact
  // has since gone false.
  // ⭐⭐⭐ ROUND 44 – AND THE SCENE SHE SAYS IT IN IS DRAWN HERE AND STAMPED WITH IT. The frame is the
  // third key of this step and it is the only one that is NOT keyed `:life:` – the frame pool spec
  // names it in full («`rngFromSeed(\`${seed}:smalltalk:frame:${week}\`)` – never MAIN, invariant
  // 2») and the spelling is his document's, carried rather than tidied.
  // ⚠ IT IS DRAWN AFTER THE SITUATION AND THE ORDER IS NOT LOAD-BEARING – each key carries its own
  // week, so neither draw can move the other. What IS load-bearing is that it happens on the RAISE:
  // the exclusion reads the log as it stands now, and a frame derived later would be re-decided on
  // every snapshot.
```

### `drawSmallTalkSubject` – Which small thing, weighted by the week's register

```ts
/** ⭐⭐ WHICH SMALL THING, WEIGHTED BY THE WEEK'S REGISTER AND NARROWED TO WHAT SHE COULD HONESTLY
 *  BRING (spec §2). `drawForkWant`'s own shape – weights, one uniform, a walk down the list – and its
 *  own (seed, calendar) key discipline, so a player cannot manufacture a subject by playing the week
 *  differently.
 *
 *  ⚠ THE ROSTER IT WALKS IS THE REACHABLE ONE, not `SMALL_TALK_SUBJECTS`. A subject with no situation
 *  behind it this week has no mass at all, which is what keeps the two draws independent: the second
 *  one always has something to pick.
 *
 *  ⚠ THE ORDER IS `SMALL_TALK_SUBJECTS`' OWN and not the reachable list's, so the walk is stable
 *  under a re-ordering of the catalogue – the same seed and week give the same subject whatever order
 *  the situations happen to sit in. */
```

## Copy leaf – `smallTalkCopy.ts`

### `smallTalkCopy.ts` header

```ts
// A-06 / T6.8 – `world/lifeBeat.ts` §3c MOVED HERE VERBATIM, span for span, comments and all.
//
// A beat kind is its own module (CLAUDE.md, the life-beat line). This is TIER-1 SMALL TALK's copy half –
// the week she comes with something small – and a pure leaf: §3c referenced nothing else in the old
// file, and its readers are the dispatcher hub and §7's roll. Hub -> here, never back.
//
// ⚠⚠ ONLY §3c. THE SITUATION LAYER (§3c-2, round 42's exchange) STAYS IN THE HUB, and the reason is the
// one rule this whole split turns on: `recentFrames` and `withoutRecentSituations` read §1's QUEUE
// (`lifeLogOf`), and the queue stays with the hub because 21 things reference it. A §3c-2 module would
// therefore import the hub AND be imported by it – «if both are true, it is not ready to move» (P4).
// A-06's own proposal has the answer for a later wave: move the queue to a module of its own first, and
// §3c-2's two references stop being a cycle. Not this task's call to make.
//
// ⚠ THE TWO ROSTERS AND THEIR TWO TYPES COME WITH THE POOLS, because they are this beat's own shape.
// `world.ts` imports `LEGACY_SMALL_TALK_SUBJECTS`, `SMALL_TALK_SUBJECTS`, `smallTalkSubjectFor`,
// `LegacySmallTalkSubject` and `SmallTalkSubject`, so `lifeBeat.ts` re-exports all five under their
// historical names – the values with `export { … }` and the TYPES with `export type { … }`, which P4's
// field notes say is not optional: a type re-exported through a value clause killed the build twice.
//
// ⚠ `PresenceCell` comes back from the hub, `MoodRegister` and `Temperament` from the engine's own
// modules – all three as `import type`, erased at compile time.
```

### `smallTalkCopy.ts` §3c – 'small-talk' – tier 1, the week she comes with something small

```ts
// =================================================================================================
// 3c. `'small-talk'` – TIER 1, THE WEEK SHE COMES WITH SOMETHING SMALL (wave 3, T8). EVERY WORD A DRAFT.
// =================================================================================================
//
// who-she-is §5b's three tiers, the middle one: «small talk – she comes with something small (a
// worry before a big draw, a joy, a question); 2–3 reply options». It rides the beat machinery
// wave 2 built and adds NOTHING to it – the queue, the pause, the engine-side re-validation and the
// dialog's whole contract are called, never re-implemented.
//
// ⭐⭐⭐ ROUND 42 #15/#24 REWROTE WHAT THIS BEAT IS **ABOUT** AND LEFT ITS MACHINERY ALONE. The three
// subjects became six kinds of material (§2 of the spec), the ordinary week stopped resolving to
// «I want to ask you something», and every answer now earns a second line of hers. The SITUATION
// layer that does all of it is §3c-2 below; everything in §3c is the card as it shipped, and it is
// still live – a career with no situation written for it, and every save raised before this round,
// reads exactly these pools. Read §3c-2's banner for the design and for the five findings of the
// owner's own review that bind it.
//
// ⚠⚠ RULED V2 (09.09): «TIER-1 REPLIES MOVE NOTHING – small talk is texture, never economy, and the
// delta table stays the big beats'.» Every reply below is priced ZERO, and that is a design rule
// rather than a coincidence of this draft: this is the FREQUENT beat (up to four a season), so a
// tier that quietly paid would make the common thing the profitable thing and turn a conversation
// into a farm. The value of the beat is the READ – what she came with, and in whose voice – and the
// number is deliberately not part of it.
//
// ⚠ IT ALSO SATISFIES THE T6b PIN BY CONSTRUCTION, which is worth naming because the pin is what
// stops the next wave breaking forty tools: `tools/_lifeBeats.ts`' `drainLifeBeats` answers a beat a
// harness never meant to price with the option whose delta is ZERO and THROWS if a kind has none.
// Here EVERY option is that option.
//
// ⚠⚠ AND THIS IS THE ONE KIND THAT WRITES NO FEED ROW AT ALL – not on delivery and not on the
// answer. The `lifeLog` row IS the record (and, per `smallTalkThisSeason` below, also the COUNTER),
// and the feed is the family's ledger of things that HAPPENED: four «we asked her to say more» rows
// a season would drown the thread T9's glyph column exists to make findable. The brief left the
// question open and this is its stated default; `ANSWER_EVENT`'s `null` is where the decision lives,
// and it is still a TOTAL record, so the next kind has to make the same decision out loud.
```

### `LEGACY_SMALL_TALK_SUBJECTS` – What she came with, as tier 1 shipped

```ts
/** WHAT SHE CAME WITH, AS TIER 1 SHIPPED IT – who-she-is §5b's own triple («a worry ... a joy, a
 *  question»). Machine-readable, never a rendered word, exactly as `'fork-opinion'`'s want is.
 *
 *  ⚠⚠ RENAMED `LEGACY_` BY ROUND 42 #24 AND KEPT WHOLE, WHICH IS A SAVE-COMPAT REQUIREMENT RATHER
 *  THAN NOSTALGIA. A `'small-talk'` row's `detail` is PERSISTED, and a career loaded from a v78 save
 *  can be holding a live soft row raised before this round – `'worry'`, `'joy'` or `'question'`,
 *  with no situation behind it. That row still has to render, so this roster and the pool it keys
 *  (`SMALL_TALK_LINE`) stay exactly where they are and keep serving it. There is NO MIGRATION to
 *  write and no schema bump owed: new rows carry a different SHAPE of detail
 *  (`'<subject>:<situation>'`), and the shape is what tells the two apart – `'fork-psy'`'s own
 *  two-field detail, read the same way.
 *
 *  ⚠ AND THE LEGACY PATH IS STILL REACHABLE ON A NEW CAREER, which is the honest half. When no
 *  situation is available for this girl, at this stage, on this career, `rollSmallTalk` raises a
 *  legacy row and she opens with one of these twelve lines, exactly as she did before this round.
 *  The catalogue below is thin on purpose (spec §10's delivery order: «a small real set first»), so
 *  those cells are named in the handoff rather than hidden. */
```

### `SMALL_TALK_SUBJECTS` – Round 42 #24 – the six kinds of small thing

```ts
/** ⭐⭐⭐ ROUND 42 #24 – THE SIX KINDS OF SMALL THING SHE MIGHT BRING (spec §2), and the taxonomy is
 *  the fix rather than a re-labelling of the old one.
 *
 *  The owner: «Один и тот же диалог из раза в раз "I want to ask you something"… да, надо больше
 *  разнообразия, это же наша главная фича». The spec found the root and it is in the old roster
 *  itself: `worry` and `joy` name emotional MATERIAL, `question` names a SPEECH ACT. Because the
 *  ordinary-mood week always resolved to `question`, the ordinary opener always collapsed to «I want
 *  to ask you something» – and no amount of paraphrase fixes a taxonomy that puts a verb where the
 *  other two put a feeling. So all six name material:
 *
 *      worry        something sitting wrong
 *      good-news    something that went right
 *      decision     a small choice she is turning over
 *      curiosity    a question she actually wants answered
 *      observation  a thing she noticed, no ask attached
 *      story        something that happened, told for its own sake
 *
 *  ⚠ `good-news` AND `curiosity` ARE NOT `joy` AND `question` RENAMED. The legacy roster above is a
 *  different set of three values living in the same field; nothing maps one onto the other, and
 *  `SMALL_TALK_FRAME_REGISTER` – keyed on BOTH rosters – is the only place they meet. */
```

### `smallTalkSubjectFor` – Which of the three legacy subjects

```ts
/** ⭐ WHICH OF THE THREE LEGACY SUBJECTS, READ OFF HER WEEK AND NOT OFF A SECOND DRAW.
 *
 *  ⚠⚠ ROUND 42 #24 LEFT THIS FUNCTION ALONE, BYTE FOR BYTE, AND THE UNTOUCHED-NESS IS THE POINT. It
 *  is no longer the road a situation-backed beat takes – `drawSmallTalkSubject` is – but it is still
 *  the whole of the LEGACY raise, and the legacy card has to stay exactly the card it was. Its own
 *  pin (`tests/wave3-small-talk.test.ts` §G) therefore stays green without a line moving, which is
 *  what tells a reader the old path really is unchanged rather than merely asserted to be.
 *
 *  ⚠⚠ ZERO DRAWS, AND IT IS THE SPLIT-KEY LAW THAT MAKES IT SO RATHER THAN THRIFT. The wave owns
 *  FOUR stream keys (brief §3) and `seed:life:smalltalk:<week>` answers exactly one question –
 *  «does she come with something». A second, DIFFERENT fact read off the same key would be two
 *  facts sharing a key, which is the one thing the 09.09 stream law forbids. So the subject is
 *  DERIVED, and the fact it is derived from is §5b's composition rule read literally: SPIRIT owns
 *  the register of the moment, so the register is what decides which small thing she brings.
 *  ⚠ ROUND 42 #24 DID create two more keys, for the situation layer, and they are their own
 *  sub-streams with their own week – see `rollSmallTalk`. */
```

### `SMALL_TALK_FRAME_REGISTER` – The parent's frame follows the subject, not the week

```ts
/** ⭐⭐ THE PARENT'S FRAME FOLLOWS THE SUBJECT, NOT THE WEEK – round 42 #24's one consequence for a
 *  string nobody rewrote, and it is a correctness fix rather than a preference.
 *
 *  `SMALL_TALK_HEADING` has three rows and they are keyed on the Mood register, which was exactly
 *  right while the subject WAS the register (`smallTalkSubjectFor` above, one-to-one). Spec §2 cuts
 *  that link on purpose – «Mood sets the WEIGHTS, not the subject» – so a bright week can now bring
 *  a worry, and a heading reading «She came to us with something good this week» over «Something's
 *  wrong. I don't know what yet.» would be the card contradicting her in its own first line.
 *
 *  ⚠⚠ SO THE REGISTER THE HEADING READS IS DERIVED FROM THE SUBJECT, AND NOT ONE WORD OF HIS COPY
 *  MOVED (invariant 4). The three shipped frames are exactly the three this returns a key for.
 *
 *  ⚠ AND ON A LEGACY ROW IT IS THE IDENTITY. `worry → low`, `joy → bright`, `question → level` is
 *  `smallTalkSubjectFor` read backwards, so a pre-round-42 row gets back the very register it was
 *  raised on and its card is BYTE-IDENTICAL to the one that shipped. That is the whole reason this
 *  record is keyed on both rosters instead of only the new one. */
```

### `SMALL_TALK_LINE` – Her opener, by voice, by subject – 12 drafts

```ts
/** ⭐⭐ HER OPENER, BY VOICE, BY SUBJECT – 12 drafts, and the THIRD thing in this file indexed by
 *  temperament (the fence's own shape: the wording knows who she is, nothing else does).
 *
 *  The bible each column is written to, in a phrase: `sunny` volunteers it and names the ordinary
 *  feeling; `fiery` is talking before she has put anything down, in absolutes, twice over; `quiet`
 *  says it around a household action and leaves herself out of it; `deep` waits for the room and
 *  gives the conclusion with nothing round it.
 *
 *  ⚠⚠ NO FLAT POOL, AND THE ABSENCE IS THE DESIGN. `strained` and `cold` are priced at ZERO
 *  (`ECONOMY.life.smallTalkPerWeek`), so this beat cannot reach a distant home at all – «none at
 *  cold; the silence is the line» (§5b). The fork needed a flat pool because the fork fires whatever
 *  the home is like; tier 1 simply stops happening, which is a louder thing to notice.
 *
 *  ⚠ THE TWO SHAPE RULES the week-note pins enforce for the whole corpus hold here too: at most ONE
 *  quoted span per line, and the narration outside it names `she`.
 *
 *  ⚠ AND THE TWO-TIER HONESTY LAW. Not one line names a draw, a result, a place, a person, a plan or
 *  a count – the sim holds no such fact about «something small», so neither does the pool. What each
 *  line asserts is her own verdict on her own week, which is the one thing she is the source of.
 *
 *  ⭐⭐⭐ 11.09, THE OWNER'S ВЫЧИТКА – THE PRESENCE COLUMN, ELEVEN OF HIS OWN FRAMES, VERBATIM. The
 *  roof frames are a kitchen: the plates done, the kettle filling, the shelf being stacked, the room
 *  emptying. From `college` on the parent is in none of those rooms, so the away frames carry a
 *  channel instead – she stayed on the line, she rang out of turn, it came at the bottom of an
 *  ordinary message, the voice note skipped hello.
 *
 *  ⚠⚠ ELEVEN AND NOT TWELVE, AND THE MISSING ONE IS HIS OWN RULING RATHER THAN A GAP. `sunny`/`joy`
 *  has NO away frame: «She said it before anyone had asked how the week went.» is channel-neutral –
 *  it describes an ORDER of events and not a room – so it stays SHARED and the away read falls back
 *  to it. That is why the вычитка's set is 19 and not 20, and `tests/wave3-presence.test.ts` §C pins
 *  the fallback from both sides: that cell must read the SAME string at both distances, and every
 *  other cell must read a DIFFERENT one.
 *
 *  ⚠ TWO OF HIS AWAY FRAMES OPEN `Her` RATHER THAN `She` («Her voice note skipped hello entirely.»,
 *  «Her message came and did not ask for a reply.»). The corpus's shape rule 2 is written as «the
 *  narration outside the quotation contains `she`»; both lines still name her in the third person,
 *  which is what the rule is FOR, and they are the owner's words. Flagged to him rather than edited,
 *  and the pin asserts the third person (`she` or `her`) instead of the letter of the older form.
 *
 *  ⚠ THE QUOTED SPAN IS SHARED with the roof column, exactly as `MET_HER_LINE`'s is – see that
 *  pool's note for the contraction fold and for the law home it points at.
 *
 *  ⭐ PROVENANCE OF `sunny`/`joy`'s opener, corrected 11.09: it is THE OWNER'S OWN WORD, carried on
 *  his P2 verdict list. It is absent from the 19-frame delivery for one reason only – that cell's
 *  frame is channel-neutral and SHARED, so there was no away row for it to appear in. The architect
 *  first recorded it as an inference and the owner corrected the record: one source, byte-for-byte
 *  agreement, chain of custody clean.
 *
 *  ⭐⭐⭐ ROUND 42 #24 – NINE QUOTED SENTENCES REWRITTEN, AND ALL NINE ARE HIS OWN (spec §9, «his
 *  proposed rewrites», applied verbatim). They land in six cells because two of the cells hold two
 *  of the nine:
 *
 *      sunny/worry   «I've been worrying at something all week.» → «Something's been on my mind all week.»
 *                    «I'd rather say it than carry it.»          → «I think I need to say it out loud.»
 *      sunny/joy     «Something went well. I'm pleased about it.» → «Something went right this week. I'm still smiling about it.»
 *      fiery/worry   «Something's bothering me. It's been bothering me for days.» → «Something's bothering me, and I can't leave it alone.»
 *      fiery/joy     «Today was a good one. A really good one.»  → «Good day. Really good. I needed one.»
 *      quiet/joy     «The morning went the way I wanted it to.»  → «Today went well.»
 *      deep/worry    «Something is sitting wrong.»               → «Something's wrong. I don't know what yet.»
 *                    «That is all I have.»                       → «That's as far as I've got.»
 *      deep/joy      «Good week. I will take it.»                → «Good week. I needed that.»
 *
 *  ⚠ EACH REWRITE LANDS IN **BOTH** FRAMES OF ITS CELL, because the quoted span is shared by law and
 *  `tests/wave3-presence.test.ts` §D asserts exactly that. The FRAMES – the narration outside the
 *  quotation – were not touched by §9 and are not touched here.
 *
 *  ⚠ THE THREE `question` CELLS ARE UNCHANGED, INCLUDING «I want to ask you something.» – the very
 *  sentence #24 is named after. §9 does not rewrite them, and the reason is the spec's own: the fix
 *  for that cell is not a better paraphrase, it is the SITUATION layer below taking the ordinary
 *  week off `question` altogether. A rewrite nobody asked for would be invariant 4 broken while
 *  obeying it three lines up. */
```

### `SMALL_TALK_HEADING` – The parent's frame over the card

```ts
/** The parent's frame over the card, one per Mood register – the fork's `HEADING` shape and not the
 *  `'met'` card's, deliberately: what this beat is ABOUT is her week, and her week is what the Mood
 *  register reads. The `'met'` card keys on the bond band because its subject is the distance
 *  between them; this one has no distance in it, or it would not have fired.
 *
 *  ⚠ IT AGREES WITH THE SUBJECT BY CONSTRUCTION on the week the row is raised, because both are read
 *  off the same register one line apart (`rollSmallTalk`). The pin in `tests/wave3-small-talk.test.ts`
 *  asserts that correspondence rather than assuming it. */
```

### `SMALL_TALK_CARD` – v74 T15 – the invitation

```ts
/** ⭐⭐⭐ v74 T15 – THE INVITATION, AND IT IS THE ONLY STRING THE SOFT SURFACE ADDS. A DRAFT for the
 *  owner's вычитка like every word in this file (invariant 4).
 *
 *  ⚠⚠ ONE SHORT LINE, AND THE CARD IS **ONLY** THE INVITATION (who-she-is §5b's amendment): it says
 *  she has come by with something, and tapping it opens the SAME `LifeBeatDialog` on the same prompt
 *  contract – modal only because the player chose to listen. So this line may never carry what she
 *  came with: the subject, her opener and the parent's frame are the DIALOG's, assembled from the
 *  pools above, and a card that previewed them would make the conversation answerable from the hub
 *  without her ever having spoken.
 *
 *  ⚠ IT IS ENGINE-SIDE FOR THE REASON EVERY OTHER LINE HERE IS: the surface renders what it is
 *  handed and owns no sentence, so there is exactly one place her voice is edited from and the owner
 *  reads the whole set in one package.
 *
 *  ⚠ AND IT NAMES NO WEEK AND NO COUNT. The row is live for three weeks, so «this week» would be
 *  false on two of them; the two-tier honesty law forbids the rest (no draw, no result, no place, no
 *  person, no plan, no number). What is left is the one thing the world actually holds: she came. */
```
