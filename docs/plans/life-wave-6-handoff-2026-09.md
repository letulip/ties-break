---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-14
---

# Wave 6 handoff – «the spotlight» (`life/wave-6`, v77): the builder's record

The branch as it is handed back. Twelve tasks plus two corrections, one builder, `c3c63ddd..HEAD`.
This is the BUILDER's record and nothing else: what shipped, what the gate said out of its own log
files, what the benches measured against the numbers they were asked to price, what the wave
deliberately did not do, and what it leaves behind with the measurement that says why.

**The questions for the owner are the architect's and they are already written** –
[life-wave-6-questions-2026-09](life-wave-6-questions-2026-09.md), sixteen of them, the first two
one decision in two halves. Nothing in this file duplicates them; where a number wants a ruling it
is reported here with its measurement and pointed at its question.

Read beside [the builder brief](life-wave-6-builder-2026-09.md), [the rulings
A–X](life-wave-6-rulings-2026-09.md) and [the strings table](life-wave-6-strings-2026-09.md). On any
drift the spec wins: [who-she-is §3c and §3c-bis](../specs/who-she-is-2026-09.md) for the spotlight,
[the-way-she-sounds C4](the-way-she-sounds-2026-09.md) for the booth, [the psychologist's
year](../specs/the-psychologists-year-2026-09.md) O7 for the fifth focus.

---

## 1. What shipped, task by task

| # | commit | what it ships, in one line |
| --- | --- | --- |
| T1 | `3a425fe0` | **schema v77** – `spotlightHabituation` on `WorldState` and FOUR fields on `LoveEpisode` (`publicWeek`, `publicWrong`, `airedMetWeek`, `airedEndedWeek`), the append-only migration that walks the LIST, the golden `v77.json`, the e2e corpus regenerated, eleven frozen constants re-stamped BY NAME, and **the frozen protocol's first NESTED peel** – the first schema move in seventy-seven versions that widens a row inside a list rather than the world |
| – | `b1d0483b` | ruling D-bis recorded and a stale v74 row ANNOTATED rather than rewritten (`knownWeek: 139` against a live 137 – a record of a measurement, so it is annotated; compare §4 below, where an assertion about the present is corrected) |
| T2 | `8eaee060` | **the exposure ledger** – `src/engine/world/spotlight.ts`: `sheIsNewsAt`, `exposureEventsOf`, the five kinds, the `TIER_LADDER` bar (ruling F). ⚠ It found the brief's `'shoot'` spelling **unable to fire at any week of any world** and corrected it |
| T3 | `b353b59c` | **the pressure** – the fourth summand inside `accrueSpirit`'s own pass (ruling L), expression scaling on both axes off ONE read, the plain feed row `EXPOSURE_ROW`, and the finding that the tick's order left `'stage'` and `'publicLoss'` unable to fire |
| T3b | `5b0b1b15` | ruling P applied: **one horizon, the LAST CLOSED WEEK** (`world.week − 1`) for all five kinds, the two starved kinds proved firing by a pair of cases the fix INVERTS, and the `world.week += 1` increment's position pinned because it is the one thing between the new horizon and a negative first tick |
| T4 | `c65d81ab` | **habituation** – `growHabituation` as a sibling of `accrueSpirit` and **above `driftWalls`** (ruling R: one girl for the whole week), the slow shrink toward the floor, the walls freeze on either axis, the cap, and the byte-identity pin that says habituation 0 scales to exactly 1.0 |
| T5 | `4c9f9cf6` | **the fifth focus** – `'publicLife'` joins `PsyFocus`, `PSY_FOCUSES` and both Records; shrink by rung, acceleration by rung; ruling O's membership oracle re-aimed; and the refusal that `psychologistWorkingRung` cannot be called from `spirit.ts` (wave 5's ruling J), pinned against the real function across the whole grid instead |
| T6 | `33311774` | **the leak** – the per-episode hazard with ruling I's fame factor restored, accuracy by openness, the overtake, the kept `LEAK_EVENT` row. ⚠ It found the brief's overtake condition (`knownWeek === null`) **unreachable in play** and shipped the spec's sentence, which contains it as a sub-case |
| T7 | `e1c31c1e` | **the booth channel** – the engine stamp written in the life block (ruling M), the snapshot packet, one beat in `buildCommentary` as a sixth optional parameter on `coach`'s precedent (ruling J), variety through `variant()` and **zero draws in `src/viz`**; plus the measurement that corrected ruling P's mechanism (the results are written outside the tick entirely) |
| T8 | `302095fa` | **the strings** – the вычитка table, all 14 added literals and 30 drafted-but-homeless ones, ruling S's correction landed (`PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL`'s count REMOVED rather than bumped), and the splice pin measured unable to fail on the case it exists for |
| T11 | `9dfb3236` | **the dice come back to her name** (the owner's 14.09 microfix) – two reroll buttons on the prologue identity card, one pool, the default unchanged |
| T12 | `6febf945` | **need reads the money she can REACH** (the owner's 14.09 exploit report) – `reachableFundsCents`, the cameo gate moved onto it, the sweep of every other wallet-only need verdict, the bar itself untouched. ⚠ Its four findings are ruling X, and one of them is older and larger than the wave |
| T9 | `feaebe5e` | **the benches** – `tools/_spotlight.ts` (one spelling of the product), `bench:spotlight` (ruling E's bar sweep, ruling N's Mood column, the fairness corridor, the habituation curve, the walls loop), the psy grid's fifth column paired rather than pooled, and the census's leak prints with ruling I's fame factor made visible |
| T10 | this commit | **the four debts, e2e, the frozen corpus, the `.tsave` corpus, the gate, this document** |

⚠ **The order in the table is the COMMIT order and T9 really does sit after T11 and T12** – the two
microfixes were added mid-wave at the owner's word and ran before the benches, exactly as the brief's
§1 licensed («they run any time before T10 – their tests ride T10's gate – and nothing above
renumbers»).

⚠ **Twenty-six rulings, A–X with two -bis, across 27 documentation commits of the 39 that precede
this one.** Two commits in three on this branch carry no code at all. That is not overhead, it is the wave's own shape:
**every task found something its brief or a ruling had wrong, and each was ruled before the next task
started** – rulings D-bis, E-bis, P, R, S, T, U, V, W and X are all corrections of earlier rulings or
of the brief, four of them corrections the architect made to himself.

## 2. The gate

Wave-3 §6's standard, run once, on a quiet machine, **every verdict read out of a log file the
command itself appended, with a unique log path per run** – never a pipe, never a background
notification.

> ⚠⚠ **THE NOTIFICATION HAS LIED EIGHT TIMES IN THIS WAVE**, «exit code 0» over logs reading
> `CHECK_EXIT=1` and `CHECK_EXIT=2`. ⭐ **In THIS task it told the truth all four times** – and that
> is exactly why none of it was believed: a liar that happens to be right is still not a source.
> Every line below is `grep`ped out of a file the command itself wrote, at a path no other run in
> this session writes to.
>
> ⚠ **And the same hazard appeared in a NEW costume here, in my own shell.** An early e2e run was
> logged as `(npm run … > LOG; L=$(ls -t …); echo "EXIT=$?" >> "$L")` – and `$?` there is the exit
> of the `ls` ASSIGNMENT, not of `npm`. It printed `E2E_CTRL_EXIT=0` over a run that happened to be
> green, which is the worst possible outcome for a bad instrument. Every command below writes its
> log path BEFORE it runs and appends `echo "…_EXIT=$?"` on the line immediately after it.

Run in this order, one at a time, nothing else running. `ps -Ao pid,command | grep -E "node .*(vitest|vite-node tools/)"` empty before the first, `uptime` **load 4.04 / 4.50 / 4.60** – and the top of `ps -r` is `WindowServer` at 52 % and the desktop app at 41 %, not a test runner. ⚠ **`pgrep -f` is NOT how that was checked**: its pattern matches the checking command's own line, which cost two builders an hour in this wave.

| what | log file | the verdict, quoted |
| --- | --- | --- |
| `npm run check` | `/tmp/tb-gate-check-1789387209.log` (start stamp `12:00:09Z` written into the log; mtime **1789387597**, 388 s later) | **`CHECK_EXIT=0`** · `result: ok` (context audit) · `doc facts: ok – schema v77, live wave round 41` · `engine purity: ok` · `Source-pin ratchet … result: ok` (3 raw slices, baseline 3) · `decision index: ok – 112 entries, 17 areas` · `world map: … is current (498 symbols)` · `tools registry: ok – 38 live, 185 archival` · **`unit: green in 315s`** (`unit bulk … ok (157s, 5549 tests)`) · component `Test Files 180 passed (180) / Tests 1923 passed (1923)` |
| the frozen careers, inside it | same log | `unit coach-travel-edge … ok (25s, 12 tests)` · `coach-travel-edge-mid-schemas … ok (18s, 8 tests)` · `coach-travel-edge-older-schemas … ok (24s, 10 tests)` – **every frozen constant reproduces at head, with no re-stamp** |
| fixture freshness vs head, inside it | same log | `tests/e2e-fixtures.test.ts` runs in `bulk`; re-run alone at head after the regeneration, **63 passed** |
| the build line | same log | `✓ 403 modules transformed … ✓ built in 1.95s` · `precache 372 entries (16126.72 KiB)` · `install size: ok – 16127 KiB in 366 precache entries, 257 KiB under the 16384 KiB ceiling` |
| `npm run test:sim` | `/tmp/tb-gate-sim-1789387626.log` (start `12:07:06Z`; mtime **1789388404**, 778 s later) | **`SIM_EXIT=0`** · `sim: 13 files green in 774s` |
| `npm run test:e2e` (the whole suite) | `/tmp/tb-gate-e2e-1789388419.log` (start `12:20:19Z`; mtime **1789388456**, 37 s later) | **`E2E_EXIT=0`** · `121 passed (36.8s)` · `e2e: green in 37s`, **0** failure lines |
| the wave's own e2e case, inside it | same log | `✓ 111 [chromium] › e2e/spotlight.spec.ts:143:3 › the spotlight reaches the player › ⭐⭐⭐ pro: the cameras were on her last week, the feed says so, and a year of work is bought against them (747ms)` |
| **the responsive parity harness at 375 / 768 / 900 / 1280** | same log | **29** `parity.spec.ts` lines, every one `✓`, including `every screen in src/components/screens/ has a station in this file` and one `… carries the same controls at every width` per screen |
| the capture | `/tmp/tb-gate-capture-1789388465.log` (start `12:21:05Z`; mtime **1789388475**) | **`CAPTURE_EXIT=0`** · `Test Files 1 passed (1) / Tests 51 passed (51)` – the MAIN capture stands at **41550 / `e6b0c709`**, and §5b is the stronger statement about it |
| the wave's own eight suites, named | `/tmp/tb-gate-wave6pins-1789388481.log` | **`WAVE6PINS_EXIT=0`** · `Test Files 8 passed (8) / Tests 234 passed (234)` |

**Every log's mtime is newer than the start stamp written into that same log**, and every exit code was appended by the command itself. The four numbers, in order: `1789387597 > 1789387209` · `1789388404 > 1789387626` · `1789388456 > 1789388419` · `1789388475 > 1789388465`.

### 2a. This wave's own §6, pin by pin

| §6 asks for | where it is | verdict |
| --- | --- | --- |
| T1's zero-diff pin green at head | `wave6-spotlight-schema.test.ts` §D | ✓ `156 weeks with spotlightHabituation and 156 weeks WITHOUT it produce the same world, key for key (1395ms)` · ✓ `and a career CARRYING ATTACHMENTS walks the same weeks with the four row fields and without them` |
| T3's no-exposure byte-identity pin against a **FAMOUS** world | `wave6-spotlight-pressure.test.ts` §B | ✓ `52 weeks of a famous career and of her unknown twin move spirit identically` · ✓ `...and the WHOLE WORLD is byte-identical afterwards, cabinet aside` · ✓ the non-vacuity case: `one twin IS news at this week and the other is not` |
| the ×2 openness ratio pin | `wave6-spotlight-pressure.test.ts` §A, §D | ✓ `the openness scale is the SPEC'S OWN ×0.75 / ×1.5, and its ratio is exactly 2` · ✓ `the same event costs an expressed-PRIVATE girl exactly twice an expressed-OPEN one` · ✓ `...and it holds for every kind, because it is one factor and not five` |
| the walls-freeze pin | `wave6-spotlight-habituation.test.ts` §D | ✓ `the OPENNESS wall freezes her while her twin at equal fame grows` · ✓ `the REGULATION wall does it on its own – ruling H's either-axis half` · ✓ `the LEAN is not the flag` · ✓ the non-vacuity case: `BOTH twins are news at the week the pass asks about` |
| the fairness corridor's high-fame column, ±1.5 pp | `bench:spotlight` §3, ruling W | **HIT – worst pair 0.188 pp**, eight times inside, non-vacuous (34 of 48 pairs diverged). ⚠ Not a gate: no bench runs inside `npm run check` |
| the census leak prints | `tools/life-arrival.ts` §6d, who-she-is §4a, ruling W | open 25.5 % / median lag 24 / 11.3 % wrong; private 15.9 % / 102 / 68.2 % wrong; ruling I's fame factor visible as a realised rate 0.00611 at fame 30–44 → **0.01186 at 80+** |
| `grep -rn "rng\|Math.random" src/viz/commentary.ts` clean of draws | §5e | **no match, rc=1**; the only hit in all of `src/viz` is a comment in a different file, six weeks older than this wave |
| `ECONOMY.fame` provably untouched | §5d | the block cut by brace-walk and hashed on both trees: **`5f72fff92232`, 19 609 chars, identical**; `git diff --stat … src/engine/world/fame.ts` empty |

## 3. The four debts the architect recorded against this task

Each one is a ruling, each one is now in the tree, and each one is reported with what it cost to
prove rather than with the edit alone.

### 3a. Ruling T – a law that could not look, widened to the LAYER, with its one new exception named

`tests/wave4-life-row-stamp.test.ts`'s law is «no `type: 'life'` feed row leaves the engine without a
`lifeKind`». It swept `worldSource()` – `world.ts` plus `world/*.ts` – **which is the scope of a
MODULE while the sentence is about a LAYER.** T3's `EXPOSURE_ROW` lives in `src/engine/spirit.ts`,
one directory over, and the pin had never been able to see it. Not «did not»: the corpus it read did
not contain the file.

**What shipped, in four parts, three of them larger than the brief asked for:**

1. **`engineSource()`** – a new helper in `tests/worldSource.ts`: every `.ts` under `src/engine/`,
   recursively, sorted, with a marker before each file. **The whole directory and not a named list
   of two**, because a list rots exactly the way the old scope rotted – the third module to write a
   life row would be invisible again and nothing would say so.
2. **The extractor now WALKS braces.** ⚠⚠ This was not optional, and it is the finding inside the
   debt. The old cut was `/\{[^{}]*type:\s*'life'[^{}]*\}/` and **its own note had predicted its
   death**: «a future write site that happened to carry a NESTED object would not match the pattern
   at all». T3's row IS that site – it spreads `...(firstOfSeason ? { keep: true } : {})`. So simply
   widening the scope made the pin red on its count-equality line («captured 4 of 5»), which is that
   line working; but a law that can only say «I cannot see one of them» has stopped being a law.
   `rowLiteralAt` walks out to the enclosing brace and back to its match, and **throws** on an absent
   one – `tests/helpers/source.ts`'s own rule, never a short string.
3. **TWO named exceptions with custody**, on the tail-lint's `KNOWN_VIOLATIONS` precedent rather than
   a relaxed regex: `LEAK_EVENT[` (T6) and `EXPOSURE_ROW` (T3). Each is asserted to be **exactly
   one**, so a second unstamped row cannot hide behind either. The reason is carried in the note –
   §8 forbids a new `LifeBeatKind` member, so the only choices were an honest absence or somebody
   else's mark – and so is **the owner's still-open question** (questions §5: does the spotlight
   deserve a mark of its own?). The day he answers, one name leaves the list and a `lifeKind` arrives
   in its place, which is the whole reason they are NAMED rather than the regex loosened.
4. **The instrument is armed on a fixture**, in its own case: the crafted nested literal that the
   pre-T10 pattern cannot see at all, the flat literal that is unchanged by the new reach, and the
   absent-brace case that throws. ARM 10b's property moved from a COUNT to a direct measurement,
   because by the time a count fires the law has already gone blind.

**Two arms run, both reverted by hand with the files' md5 checked back to pristine.**

| arm | mutation | measured |
| --- | --- | ---: |
| 11 | `engineSource()` narrowed back to `worldSource()` | **1 RED** |
| 12 | T5's told-now `lifeKind: 'ended'` stamp dropped, with the NEW scope in place | **4 RED** |

⚠ **ARM 11's red is not the one predicted, and the difference is the measurement.** It reddens on
«⚠ exactly one row is licensed to be unstamped as `EXPOSURE_ROW`: expected [] to have a length of 1
but got +0» – **a declared exception is also a POSITIVE CONTROL on the corpus.** It cannot be
satisfied by a file the sweep is not reading, so naming T3's row is what makes the widened scope
self-proving. ⚠ And the count is 1 rather than the 2 I first wrote in the ledger, because a vitest
CASE stops at its first failed assertion: a census of assertions is not a census of reds, which is
T3b's lesson one level down.

⚠ **ARM 12 is the regression control the widening needed** – a wider corpus that had quietly stopped
parsing would go green on everything. It reddens the same four cases ARM 3 measured before the
widening, the SOURCE sweep among them. **The law lost nothing by getting bigger.**

⚠ **And one net went red on its own first run, which is the argument for running every one of them.**
The «`spirit.ts` is INSIDE the sweep» assertion was first written against the STRIPPED string – and
`engineSource()`'s per-file markers are `//` comments, which `codeOf` is precisely the thing that
removes. A pin that could never pass: the «unable to fail» family's mirror image, caught in eight
seconds by running it.

### 3b. Ruling U – the fog rule aligned with its own two neighbours

`tests/spirit.test.ts`'s rule («`accrueSpirit|spiritMatchFactor|applyBondDelta` must not appear
outside `engine/`») was TEXT-based, sitting one screen above two neighbours that strip comments first
with `codeOnly` and say why in the same words. It reddened on an **English prose mention** in a
`src/viz/commentary.ts` comment – a file that calls nothing.

**It now reads `codeOnly(text)`, and this is not a weakening: the rule's CLAIM is «no code outside
`engine/` calls these», and the old form was a proxy that also fired on English.** A proxy that fires
on the documentation is repaired by deleting documentation, which is the wrong repair.

**Three arms, `src/viz/commentary.ts`'s md5 checked back to `aec08ecf…` after each:**

| arm | mutation | measured |
| --- | --- | ---: |
| U-a | an English prose mention of `accrueSpirit` appended as a `//` comment | **0 RED** – the claim |
| U-a′ | the same prose, with the rule reverted to `.test(text)` | **1 RED** – «expected [ 'viz/commentary.ts' ] to deeply equal []» |
| U-b | a real CODE occurrence – `const ARM_U_B = { spiritMatchFactor: 1 }`, no comment near it | **1 RED**, the same sentence |

⚠ **U-a′ is what makes U-a mean anything.** Without it, «0 RED» is equally consistent with a rule
that has stopped looking. Measured, the old form really did fire on English and the new one really
does still bite on code.

⭐ **And the alignment ships with a positive control the old rule never had**: `codeOnly` on a corpus
it happened to blank would make the sweep pass for ever, so the same case now asserts that INSIDE
`engine/` those three names are still found, after the same strip, in more than one file.

### 3c. Ruling V – the splice pin re-noted to claim only what it can prove

`tests/wave6-spotlight-focus.test.ts` §B was written claiming the focus line «reads naturally in both
frames». **It cannot tell you that**, and T8 measured the counter-example rather than arguing it: a
line opening on a PROPER NOUN splices to «On retainer – fleet Street …» and every structural clause
still holds – no doubled space, no doubled dash, the tail byte-identical – **because the lowering is
exactly what removes the stray capital.**

**The structural claim is kept and the wording moved from «reads» to «SPLICES»** – the section
banner, the case title and the in-case comment. The note now says out loud that naturalness is not in
this instrument's reach and **names who holds that gate**: §5's ladder, builder drafts → the
architect's вычитка (the delivery gate) → the owner's playtest (final).

⚠ **Two fixes were refused, each for its own reason** (ruling V): a mechanical proper-noun detector
needs a dictionary and would still be wrong on the words this game invents; inverting the constant to
store the lowercase form changes wave-5 machinery for a test's convenience. **No assertion was
removed and none was added** – this debt is entirely a claim being brought back inside what the
measurement supports, which is ruling U's move a second time.

### 3d. Ruling T's second half – a field comment that was false for every engine-born row

`LoveEpisode.knownWeek` said «or null while he has not been told». **No engine-born row has ever held
a null there.** Measured at the one writer: `rollArrival` sets `knownWeek = sinceWeek +
shaveLag(raw, band)` and `shaveLag` is TOTAL; the second writer (T6's overtake) writes `world.week`.
Asked of the real `rollArrival` over 60 careers and 20+ rows, none was null.

**The false half was load-bearing, not decorative.** The brief spelled §3c-bis's founding scene – «a
parent reading a headline about a daughter who never told him» – as `knownWeek === null`, and that
branch could never have been entered: the sixteenth «unable to fire» of this pair of waves. What
ships is «has he been told YET», `knownWeek === null || knownWeek > world.week`.

**Corrected, not annotated, by ruling S** – an assertion about the present is fixed; a record of a
measurement is annotated (T1's `knownWeek: 139` row is the other side of that rule and was left
standing with its cause named). The new comment carries the measurement, the ruling and **what
`null` still means**: a MIGRATED or CRAFTED row – a hand-edited or imported world, and the test
fixtures that build an episode by hand. The sim cannot produce it, the type allows it, so every
reader still gates on it and none may treat it as unreachable.

⚠ **AND THE SAME FALSE SENTENCE WAS IN A SECOND PLACE, WHICH THE DEBT DID NOT NAME.**
`LoveEpisode.publicWeek`'s own note spelled the founding scene the same way – `lifeBeat.ts`'s §9
banner names it as one of the two sites carrying the dead spelling. It is corrected on the same
rule, with the old sentence kept as the record of what it said and why it was wrong. A correction
that fixed one of two copies would have left the next reader the version that is still false.

## 4. Three more records the task was asked to carry

### 4a. The prologue ceiling had 5px of headroom, not the ~50 its comment claims

T11 measured it; T10 re-measured it independently by arming the assertion itself.

**`tests/component/prologue-walk.test.ts`'s age-5 card measures `2094.725px` against a ceiling of
2100** – armed to 2094, the failure prints the number. **5.275px of headroom**, and the comment says
~50. ⚠ **The dice cost zero**: T11's control run with the dice-less card measures 2095 too, so the
room was already gone before the wave's microfix arrived.

**The comment is ANNOTATED and the ceiling is NOT raised.** The «~50px» sentence is a record of what
was true when round 35 wrote it, so it stands with the measurement beside it. Round 35 lowered that
ceiling deliberately («leaving 2200 standing would have left 150px of new copy able to arrive with
nothing objecting»), and an agent quietly restoring the slack would be doing that same thing in the
other direction. **The next honest sentence added to that card reddens the gate**, which is the
instrument working – but it will land on whoever writes the sentence, not on whoever spent the room,
and the note now says so.

### 4b. The e2e corpus's known LEAK crossing, recorded rather than discovered

Entered in `docs/plans/e2e-fixtures.md`'s own «Current truth», where the corpus's standing hazards
live. Of the ten fixtures only `pro` is NEWS (fame **59.20** at its own week, against a bar of 30)
and it is the only one holding a live episode the world has not learned of. **Its first leak week is
435; the fixture sits at 412 – 23 weeks of headroom**, and every `publicWeek` in the corpus is
`null`. No spec advances a career that far today. **A future `npm run e2e:fixtures` whose `pro`
target week walks past 435 WILL produce a leak** – a `publicWeek`, possibly a `publicWrong`, a kept
`LEAK_EVENT` row and, one tick later, an exposure charge. ⚠ The 435 is a property of THIS seed;
change `pro`'s seed or policy and it is not the number any more.

### 4c. ⚠ `npm run check` DOES run the unit project

Restated here because a builder claimed otherwise in this wave and ruling X had to correct it.
`npm run check` contains `node scripts/units.mjs`, whose banner reads «THE UNIT SUITE: the light 252
in one pool, the heavy 20 a process each». **This wave's gates are exactly as strong as they read.**

⚠ **What `npm run check` genuinely does NOT run is e2e** – three builders were bitten by that in one
day (hard-coded counts, a label list, a stale ceiling). T10 swept by hand for anything an e2e spec
asserts: the coverage map's JOURNEYS table (a new spec file is machine-enforced there and the row is
in this commit), the fixture manifest's facts, and the `§13 Metrics` table – which is an explicitly
DATED reading carrying its own «do not cite it as today», so it is left alone rather than refreshed.

## 5. The corpora – what moved, measured

### 5a. The frozen careers: `rngMain` byte-identical on all five, and the STOP never approached

Measured **base → head with `tools/frozen-key-diff.ts` on all five preset/policy pairs** – the whole
wave in one reading rather than one task at a time. Base is the branch point `c3c63ddd` in a
dedicated worktree; head is this tree.

| cell | preset/policy | keys base → head | MOVED (shared) | NEW | other keys identical | `rngMain` |
| --- | --- | ---: | --- | ---: | ---: | --- |
| `FROZEN.middleGrinder` | 5/0 | 86 → 87 | `schemaVersion` | 1 | **85** | `1dbff28caca2` → `1dbff28caca2` |
| **`FROZEN.eliteGrinder`** | 8/0 | 85 → 86 | `schemaVersion`, **`loveEpisodes`** | 1 | **83** | `aebc8101d6df` → `aebc8101d6df` |
| `FROZEN.selfTravelling` | 0/1 | 87 → 88 | `schemaVersion` | 1 | **86** | `d84bcbf0c481` → `d84bcbf0c481` |
| `PRE_R28B.highPlayer` | 6/1 | 85 → 86 | `schemaVersion` | 1 | **84** | `1dbff28caca2` → `1dbff28caca2` |
| `PRE_R28B.middlePlayer` | 5/1 | 86 → 87 | `schemaVersion` | 1 | **85** | `1dbff28caca2` → `1dbff28caca2` |

* the one NEW key is `spotlightHabituation` on every cell, and its value is **`5feceb66ffc8` – the
  sha256 of `JSON.stringify(0)` – on all five**, which is ruling D from the other side: not one of
  these careers ever reaches the news bar, so the counter never grows;
* `schemaVersion` moves `f74efabef12e` → `a88a7902cb4e` (76 → 77) on all five;
* `loveEpisodes` moves `d447eb28e502` → `8c5884c15bcd` **on `eliteGrinder` alone**, as her one row
  gains T1's four fields. She is the only cell in the file that holds an episode, and she is the cell
  this file has already lost once to a positional pass – which is why T1 re-stamped BY NAME;
* **no key disappeared anywhere**, and `results`, `events`, `nextEventId`, `spirit`, `bond`,
  `temperament`, `lifeLog`, `spiritShock` and the walls pair are byte-identical on every cell.

**VERDICT, key by key: exactly what ruling D-bis predicted and nothing else.** Four cells move 2
lines, `eliteGrinder` moves 3, 85 / 83 / 86 / 84 / 85 other keys byte-identical, `rngMain` among
them. **The STOP condition never came near firing across twelve tasks and 39 commits** – so T10
re-stamps NOTHING: the constants at head are T1's and they still reproduce.

⚠⚠ **AND THE FIRST RUN OF THIS MEASUREMENT WAS WRONG, WHICH IS RECORDED BECAUSE IT ALMOST WAS NOT.**
The first sweep looped `for pair in "5 0" "8 0" …; do set -- $pair; … --preset $1 --policy $2`. **zsh
does not word-split an unquoted parameter**, so `$1` was the whole string `"5 0"` and `$2` was empty;
`argOf` fell back to its defaults on both, and **all ten runs measured preset 0 / policy 1 – one
cell, five times, on each tree.** The output looked perfect: five neat diffs, all agreeing, `rngMain`
identical everywhere. It was caught by reading the echoed header (`# preset 5 0 / policy`) rather
than the diff. **A null result is a claim and needs its arm proved** – CLAUDE.md's own law, met here
in a new costume: not a missing reader this time, but an instrument silently answering about a
different subject. The table above is the re-run with explicit variables, and every row's header
line names the preset and policy it actually walked.

### 5b. The MAIN capture has not moved, and the proof is a `git log` over the path

```
$ git log c3c63ddd..HEAD --oneline -- tests/condition.test.ts
$
```

**Empty.** Nothing in twelve tasks touched the file that pins the capture – a stronger statement than
a diff, because a diff cannot see a move-and-move-back. The pin stands at **41550 draws / hash
`e6b0c709`**, and §5a says the same thing from the other side: `rngMain` byte-identical on every
frozen career. That is structural rather than lucky: **both of this wave's streams are sub-streams**
(`seed:life:leak:<episodeId>:<week>` and `seed:life:leak:story:<episodeId>:<week>`), re-derived at
the call site, and everything else the wave added is arithmetic.

### 5c. The `.tsave` corpus: regenerated at head, and `pro` MOVED – which is the wave working

`npm run e2e:fixtures` re-ran all ten at head, from `/tmp/tb-e2efix-1789385420.log`, ending
**`FIX_EXIT=0`** after **1 349 s** – of which `belated`'s seed search alone is 1 349 s (672 seeds,
landing on `e2e-belated-671`, the same seed as before). ⚠ The background notification said «exit code
0»; the number quoted here is the one the command itself wrote to a marker file.

| fixture | seed the search landed on | seeds tried | week | moved? |
| --- | --- | ---: | ---: | --- |
| `fresh` | `e2e-fresh-0` | 1 | 0 | no |
| `junior` | `e2e-junior-19` | 20 | 120 | no |
| **`pro`** | `e2e-pro-0` | 1 | 412 | **YES – bytes 81 873 → 81 648, sha `b9c9b8d9…` → `0cd52551…`** |
| `sinking` | `e2e-sinking-0` | 1 | 96 | no |
| `broke` | `e2e-broke-0` | 1 | 94 | no |
| `ending` | `e2e-ending-0` | 1 | 242 | no |
| `unheard` | `e2e-unheard-1` | 2 | 242 | no |
| `soft` | `e2e-soft-1` | 2 | 9 | no |
| `breakup` | `e2e-breakup-0` | 1 | 157 | no |
| `belated` | `e2e-belated-671` | **672** | 246 | no |

**Nine of ten byte-identical, seed for seed. `pro` moved, and EVERY MANIFEST FACT IS UNCHANGED** –
`rngMain` `{s: -402734289, n: 329216}` on both sides, `feedEvents` 400 on both, week, rank, points,
funds, ladder flags all identical. The only manifest lines that moved are `bytes`, `payloadBytes` and
`sha256`. The rot alarm (`tests/e2e-fixtures.test.ts`, 63 cases) is green against the new pair.

**What moved inside `pro`, measured:** `spirit` 81.3 → 80.1, `spotlightHabituation` **0 → 98**, and
**six `EXPOSURE_ROW` rows now stand in its feed** – two kept (w315, w369) and four ordinary (w404,
w408, w410, w412). The old bytes had none of that: they were generated by T1, before T3 wrote the
row and before T4 wrote the counter.

⚠ **So the corpus WAS behaviourally stale, and the wave-5 record is what explains the difference.**
Wave 5's regeneration moved nothing, and T11 wrote down the structural reason: every wave-5 mechanic
is gated on a HIRE, and `tools/e2e-fixtures.ts` never hires anybody. **Wave 6's mechanics are gated
on FAME, which the generator walks into by itself.** Same instrument, same command, opposite answer –
which is what an instrument that works looks like.

⚠ **And `rngMain` byte-identical here is the third independent statement of §5b.** The leak's two
streams are sub-streams; nothing this wave added touches MAIN, on a corpus that walks 412 weeks.

### 5d. `ECONOMY.fame` is untouched, and the proof is stronger than the grep the gate asks for

The gate asks for a grep. A grep over the diff is noisy here, because the wave's own new block
(`ECONOMY.spotlight.newsFameMin`) contains the word. So the block itself was cut by brace-walk out of
both trees and hashed:

```
5f72fff92232  19609 chars  src/engine/economy.ts        (head)
5f72fff92232  19609 chars  src/engine/economy.ts        (base c3c63ddd)
```

**Byte-identical, 19,609 characters.** And `git diff --stat c3c63ddd..HEAD -- src/engine/world/fame.ts`
is empty: the module that owns `fameAt` was never opened. The wave only ever READ fame, which is §8.

### 5e. `src/viz` takes no draw – the wave's gravest possible finding, absent

```
$ grep -rn "rng\|Math.random" src/viz/commentary.ts
$                                            (no match, rc=1)
$ grep -rn "rng\|Math.random" src/viz/
src/viz/match/matchStats.ts:60:// ⚠ AND SO DOES THE SEEDING NOW (31.07). One rng per point, …
```

The one hit in the whole directory is a COMMENT in a different file, predating this wave by six
weeks. `buildCommentary` gains its variety from `variant(pointIndex, n)` – an integer hash of the
point index, no RNG – exactly as ruling J specified.

## 6. The e2e case

**One walk, `e2e/spotlight.spec.ts`, on the 29.08 rule (one e2e case per shipped mechanic), and the
booth beat is deliberately NOT in it** – that is the component test's job and the brief says so.

> `pro`: the cameras were on her last week, the feed says so, and a year of work is bought against
> them.

Four stations: the fixture's own preconditions read off the MANIFEST · **Home's News carries
«People were talking about her last week.» for week 412**, and it carries no figure · the hire
through the keyed confirm · **the fifth focus offered, picked, and the hired line carrying it**.

**Why those and not others.** The row is written inside `accrueSpirit`, deep in a tick nobody on this
side watches, on a horizon one week behind the week it prints in (ruling P) – and it reaches the
player as a sentence on a screen that knows nothing about fame. Every half is unit- or mount-pinned
already; what only this layer can say is that they compose over a real worker, from bytes.

⚠ **The assertion is SMALL because the fog law makes it small, and that is the design.** There is no
publicity number on any screen to look for – who-she-is §3c: the spotlight is read through the feed's
plain words, the Mood dips, the diary and the booth, never through a meter. So the spec asserts the
sentence arrived, whole, **and that what is painted is that sentence and its glyph with no figure
beside it**. A spec that hunted for a percentage here would be asking the app to break its own law.

**Five arms, each run in a real browser and reverted by hand with the file's md5 checked back:**

| arm | mutation | measured |
| --- | --- | ---: |
| **A** | `EXPOSURE_ROW`'s `addEvent` deleted from `accrueSpirit` – the row never written by this build | **0 RED** ⚠⚠ |
| A2 | `snapshotEvents` drops every `type: 'life'` row – in the world, not on the wire | **1 RED** |
| A3 | Home's `newsGroups` filter drops `type: 'life'` – on the wire, not painted | **1 RED** |
| B | `'publicLife'` dropped from `PSY_FOCUSES` (type, label and line intact) | **1 RED** |
| C | `SupportStaffTab.vue`'s hired line reverted to the plain retainer sentence | **1 RED** |

⚠⚠ **ARM A's GREEN IS THE FINDING OF THIS TASK'S E2E WORK, and the spec's header now carries it.**
Deleting the engine's write of the row left this spec passing **in 539 ms**. The reason is simple
once it is said: **§1 reads a row out of a SEEDED career, and those bytes were written by
`tools/e2e-fixtures.ts` on a different day.** Nothing in the walk ticks a week that could write
another. **An e2e assertion over a fixture cannot test the code that produced the fixture's rows** –
and no note anywhere in `e2e/` said so before today, in a directory whose whole premise is starting
at week 412 instead of clicking through it.

**The claim was re-scoped rather than the green kept.** §1 now says what it can prove – the row
crosses `saveCodec` → IndexedDB → the worker → a structured clone → `snapshotEvents`'s window →
Home's week grouping, and is painted – and its arms (A2, A3) bracket exactly that last mile. The
claim about the tick belongs to `tests/wave6-spotlight-pressure.test.ts`, which owns it and can fail
on it. ⚠ Whether other seeded-fixture specs in this directory carry the same silent limit is a
question this task raises and does not answer.

⚠ **ARM B is the other one worth reading.** Dropping `'publicLife'` from `PSY_FOCUSES` is ruling O's
hole, and ruling S measured the component suite **blind to it – 0 of 15 cases** – because every count
in that suite derives from the same array. The unit membership oracle and this rendered radiogroup
are the two nets there are.

⚠ **And §1's first draft died on a STRICT-MODE VIOLATION naming three cells** – W49, W47 and W45,
i.e. weeks 412, 410 and 408. That is a measurement, not a nuisance: the corpus does not scrape past
this case, it holds four exposure weeks in the visible feed at once. The assertion is now scoped to
`weekLabel(facts.week)` – the app's own formatter, one of the three non-e2e modules
`tsconfig.e2e.json` lets this project import – which makes it the claim the brief asked for: an
EXPOSURE WEEK's line, on the week it belongs to. ⭐ The violation also measured the glyph: the cell
paints **`🤍 People were talking about her last week.`** – `LIFE_ROW_EMOJI.life`, the owner's own
11.09 pick for the `'life'` ROW KIND, through `lifeRowGlyph`'s `?? 'met'` fallback. **Not the
romance thread's mark**; the per-kind table's `'met'` cell is empty. The spec records the character
and pins only «one glyph», because whether the spotlight deserves a mark of its own is his
(questions §5).

⚠ **The fixture is the moving part and the spec says so in its own header.** The week-412 row is a
property of `pro`'s seed and target week, not of the harness: `tools/e2e-fixtures.ts` forces no
exposure and could not, since every kind is an engine fact. A regeneration that lands `pro` on a
quiet week reddens §1 of that spec BY NAME, which is the alarm working. The corpus's own record
carries that sentence beside the leak crossing (§4b).

## 7. The benches – the pointer, and the three things a reader deciding what to rule should know

The full records live where they belong: **`tools/spotlight-bench.ts`'s own printout**, the psy grid's
fifth column in [the psychologist's year](../specs/the-psychologists-year-2026-09.md), the leak
census in [who-she-is §4a](../specs/who-she-is-2026-09.md), and the architect's reading of all three
is **ruling W**. Every number is in the questions document beside the decision it belongs to.

**Three shapes, for a reader who is deciding what to rule:**

1. **The wave fires for a minority of careers and decides the Mood word for three quarters of the
   roster when it does.** The bar sweep and the Mood column are questions §1 and §2 – one decision in
   two halves, and the owner should not be handed one without the other.
2. **Every verdict the benches were asked for HIT except the ones the instrument itself was wrong
   about.** The fairness corridor's high-fame column hits at **0.188 pp against ±1.5**, non-vacuous
   (34 of 48 pairs diverged); all three leak verdicts hit; all six acceleration steps hit past 2×SEM;
   the habituation curve hits. The five §1g misses were a **pooled** sample measuring the roster's
   spread instead of the rung's step – per cell the same run is monotone to three decimals at
   ×0.822 / ×0.679 / ×0.581.
3. **Two arms measured nothing and that is itself a finding.** `'shoot'` fired **0 times** across the
   whole grid, because `stepCareerWeek` signs no ad letters – so every event count is a lower bound
   (questions §6). And the walled arm reached **13.5 news weeks and 0 frozen ones**: a parent who
   grinds hard enough to raise her walls destroys the fame that would make her news, so «a veteran
   star behind walls» barely exists in this engine (questions §12).

⚠ **`npm run bench:spotlight` and `npm run bench:psy` are NOT in any gate, by design** – a missed bar
is a ruling request, never a blocked gate. No bench runs inside `npm run check`.

## 8. The strings

All of them, shipped and drafted, are in
[life-wave-6-strings-2026-09](life-wave-6-strings-2026-09.md) – **14 literals added, 13 of them
drafts; 30 more drafted with no home in the tree yet; 2 shipped strings MOVED, each with a written
ruling behind it.** That document is the вычитка's input and this one does not duplicate it.

**What T10 must say about it, because §5 of the brief makes the builder say it:** every one of those
words is a DRAFT. The builder wrote them against the bibles, **the architect's вычитка is the
delivery gate, and the owner's playtest is final** (the 10.09 rule). No existing string was moved
except the two with rulings. ⚠ And the splice pin that was supposed to protect one of those surfaces
has been re-noted down to what it can prove (§3c) – **the surface it cannot hold is held by the
ladder, not by a test**, and the вычитка is now the only thing standing between a proper noun and
«On retainer – fleet Street …».

## 9. What wave 6 did NOT do

Each one is §8 of the brief, held:

* **no booth personas, no duo, no tics, no rotation draw** – C4's own wave owns them; the booth's
  variety here is `variant()`, deterministic;
* **no press-question beat, no correction beat, no new `LifeBeatKind` member** – which is exactly why
  two feed rows ship unstamped under a named exception (§3a), and why the wrong story costs pressure
  before its correction beat exists (questions §8);
* **no publicity meter, no habituation surface, no leaning printout** – the fog law;
* **no standing fame drain and no fame cap change** – §5d proves it byte for byte;
* **no rival spotlight**, no draw and no world import in `src/viz` (§5e), no spirit write outside
  T3's term inside `accrueSpirit`, no new shock kind, no `spiritMatchFactor` change, no walls retune,
  no `ECONOMY.bond` touch, no `Temperament` rewrite;
* **no wording change outside T8's draft set**, and **no consent code** – the fifth focus inherits
  wave 5's year machinery byte-for-byte (T5's §H proves it answers exactly as `coolhead` does in
  every state);
* **no constant moved on any agent's word.** Every §4 number is in the tree at its drafted value and
  unruled, which is the contract and not an omission.

**And three things this task declined, each for a stated reason:**

* **the fifth focus's RECEIPT** – ruling V: a receipt is a feed row on a TRIGGER, and the trigger is
  the design decision. The sentence exists, the surface exists, the trigger proposal is in the
  strings document; **one word from the owner commissions it** (questions §4). Not parked – filed
  with its proposal attached;
* **the prologue ceiling** – annotated, never raised (§4a);
* **the two hardship licences and the broke ending that T12 found** – ruling X put them with the
  owner because all three change which sentence prints or whether a career ENDS, and questions §14
  and §15 carry them with their measurements.

## 10. The debts this wave leaves, each with the measurement that says why

| debt | the measurement | why it was left |
| --- | --- | --- |
| **Every §4 constant is unruled** | questions §9 – the table, with what is measured beside each | the contract: bench-priced proposals, his word after the numbers |
| **⚠⚠ The college NEED layer has returned 0 % for every player since round 21** | `needTest` tapers to zero above $35,000/yr; the LOWEST parent income any family reaches by age 18 over 200 seeds is **$41,282** | **older and larger than this wave** – shipped since round 21, ours to report and not to fix (ruling X (d), questions §16) |
| **A solvent family's career is ENDED** | bankrupt 8 of 8 careers with the deposit still holding $8,106 / $25,332; a working family at REACHABLE **+$1,474** has its career ended | the fix moves a persisted latch AND a rendered warning that is true today – §8 and invariant 4 both (ruling X (a), questions §14) |
| **`'shoot'` cannot be measured by any bench we have** | 0 fires across the whole grid: `stepCareerWeek` signs no ad letters at any preset or policy | pairing `tools/ad-shoot-bench.ts` with the grid is a task, and the bench declined to invent it (questions §6) |
| **The founding scene does not occur in play** | 0 overtakes in 93 leaks across 160 careers | the mechanism is built and correct; what is unruled is the lag table it races against (questions §11) |
| **A famous walled girl barely exists** | the walled arm: 13.5 news weeks, **0** frozen ones | a finding about §3c's premise, not a defect to fix (questions §12) |
| **The `.tsave` corpus still has no gate of its own** | the rot alarm compares each fixture to its own manifest and the two regenerate together | unchanged from wave 5: a real gate means regenerating in CI and diffing. The cheap half is what this wave did – regenerate at the end and attribute the churn (§5c) |
| **The splice pin's judgment half has no instrument** | ruling V: «On retainer – fleet Street …» passes every structural clause | by ruling – a dictionary would still be wrong, and §5's ladder is the right gate (§3c) |
| **The prologue walk has 5px of headroom** | `2094.725` against 2100, dice-free control identical | the ceiling is deliberately tight; raising it is the owner's call, not an agent's (§4a) |

## 11. What T10 found that the brief and the records did not account for

Recorded because twelve tasks have each found something, and the last one is meant to find what the
others walked past.

1. **⚠⚠ THE WIDENING COULD NOT BE DONE WITHOUT REPLACING THE EXTRACTOR, and no ruling saw that.**
   Ruling T asks for a scope change; the scope change alone makes the pin RED, because T3's row
   carries a nested object and the old `[^{}]*` cut cannot span it. The debt as written was one line
   and is four (§3a). ⭐ The pin's own 12.09 note had predicted this exact death and named the exact
   shape – so the tree knew, in writing, three days early, and nobody read it until the widening
   failed.
2. **⚠ A DECLARED EXCEPTION IS A POSITIVE CONTROL ON THE CORPUS, which is a stronger property than
   ruling T claimed for it.** «A law with a written exception is worth more than a law that silently
   cannot look» is true for a second reason the ruling does not give: the exception's own «exactly
   one» assertion cannot be satisfied by a file the sweep is not reading, so naming T3's row is what
   makes the widened scope prove itself (ARM 11, §3a).
3. **⚠⚠ THE FALSE `knownWeek` SENTENCE WAS IN TWO PLACES AND THE DEBT NAMED ONE.** `publicWeek`'s own
   field note spelled the founding scene the same dead way, and `lifeBeat.ts`'s §9 banner names it as
   such. Both are corrected; fixing one copy would have left the next reader the version that is
   still false (§3d).
4. **⚠⚠ A MEASUREMENT LOOP SILENTLY ANSWERED ABOUT A DIFFERENT SUBJECT.** zsh does not word-split
   unquoted parameters, so a five-cell frozen sweep measured one cell five times, on both trees, and
   produced five perfectly consistent diffs (§5a). Caught by reading the tool's own echoed header.
   The lesson is CLAUDE.md's in a costume it does not list: the arm can be wrong not only by missing
   the change or the reader, but by naming the wrong subject while answering fluently.
5. **The `.tsave` corpus WAS behaviourally stale this time, and the wave-5 record explains why the
   answer flipped.** Wave 5's regeneration moved nothing, and T11 wrote down the structural reason:
   every wave-5 mechanic is gated on a HIRE and the generator never hires anybody. **Wave 6's
   mechanics are gated on FAME, which the generator walks into by itself** – so `pro` moved
   (§5c). The two null results and this positive one are the same instrument answering honestly
   about two different waves.
6. **T1's own record was complete and held for twelve more tasks.** The base→head per-key diff
   reproduces ruling D-bis's numbers exactly – 2 lines on four cells, 3 on `eliteGrinder`, 85 / 83 /
   86 / 84 / 85 identical. Nothing between T2 and T12 touched the frozen corpus, so nothing needed
   re-stamping. That is worth saying because the protocol's default assumption is the opposite.
7. **⚠ A net can be «unable to PASS», which is the «unable to fail» family's mirror and is not in any
   of our records.** T10's own first draft of the scope assertion read the comment-stripped string
   for a `//` marker `codeOf` had just removed. It went red on its first run and cost eight seconds –
   but a variant of it that had been written as a NEGATIVE («the old scope is not in use») would have
   passed for ever. Both halves of that family are now in this wave's records.
8. **⚠ The `§13 Metrics` table in `docs/specs/e2e-coverage.md` is stale by five weeks and says so
   itself.** «25 test cases in 12 spec files» dates from 10.08; the suite is much larger. It carries
   its own «do not cite it as today», so it was left alone – but a reader adding a spec meets it
   before they meet that sentence. Named, not edited: it is the document's own dated reading.
9. **⚠⚠ AN e2e ASSERTION OVER A SEEDED FIXTURE CANNOT TEST THE CODE THAT WROTE THE FIXTURE'S ROWS,
   and nothing in `e2e/` says so.** Measured by ARM A (§6): the engine's write of the exposure row
   deleted outright, the spec green in 539 ms. The whole premise of this directory is «a test starts
   at week 412 instead of clicking through 412 weeks», and the cost of that premise is that every
   assertion about SEEDED STATE is an assertion about the codec, the wire and the screen – never
   about the engine. Specs that PRESS (the psychologist's ledger row, the breakup walk) are the ones
   that reach the tick. **This wave's spec was re-scoped and its arms re-aimed; whether the other
   seeded-state assertions in this directory carry the same silent limit is not this task's to
   answer, and it is a real question.**
10. **⚠ A `perl -0pi -e "s|…|…|"` one-liner silently PREPENDED its replacement to the file** instead
    of substituting, leaving `src/engine/world/snapshot.ts` with a statement glued to its own header
    comment – which the browser then reported as a 60-second timeout on «Tap to start», three layers
    from the cause. Caught by reading `grep -n`'s output (`1:` where 989 was expected), repaired BY
    HAND against the recorded md5, never `git checkout`. Every arm after it was applied with a Python
    script that ASSERTS the occurrence count before writing. **A sed/perl one-liner whose delimiter
    collides with its own content is an edit you have not read**, and in a shared checkout the repair
    is the only safe move.

## 12. The decisions-log entry

Added to `docs/decisions.md` under **14.09.2026 – THE SPOTLIGHT SHIPS, AND EVERY NUMBER IN IT IS
STILL A PROPOSAL**, with the index regenerated in the same commit (`npm run decisions`), because
`decisions:check` is a step of `npm run check` and an architect shipped a red gate that way once
already.
