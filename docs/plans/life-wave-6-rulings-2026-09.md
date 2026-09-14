---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-14
---

# Wave 6 – the architect's rulings, measured before the tasks that need them

The wave-5 shape, kept because it paid: the architect measures the hard corners BEFORE the builder
reaches them, and each ruling carries the measurement that produced it. A ruling without a number
under it is an opinion, and this file does not hold opinions.

Read order: the builder reads the ruling named in its task, and the whole file before T1.

---

## A – T3's three pins are known, and all three RE-AIM rather than weaken

`accrueSpirit` gains a third parameter this wave. Three pins in the tree read its signature or the
exact text of its call site, and every one of them goes red. That is the tree working; none of them
is deleted, weakened or renumbered (CLAUDE.md's standing law).

**Measured, 14.09:**

| pin | file | what goes red |
| --- | --- | --- |
| the arity | `tests/spirit.test.ts:941` | `expect(accrueSpirit.length).toBe(2)` |
| the call text | `tests/wave4-ended-beat.test.ts:264` | `indexOf('accrueSpirit(world, psychologistWorksThisWeek(world))')` → −1 |
| the call text | `tests/wave4-ends.test.ts:616` | the same `indexOf`, in a second file |

Both text pins were re-aimed once already, on 13.09, by wave 5's T4b. This is their second re-aim,
and the note each one carries must say so.

**⚠⚠ THE THIRD PARAMETER IS REQUIRED, NEVER DEFAULTED, AND THIS IS THE RULING.** `Function.length`
counts the parameters BEFORE the first one with a default. Ship `exposure: readonly ExposureEvent[]
= []` and the arity pin still reads 2 – it stays GREEN through the exact change it exists to
notice, and the next wave inherits a counter that has quietly stopped counting. That is the
«unable to fail» family in its eleventh costume, and this wave is not adding a twelfth for
convenience. Required also makes every call site state «no exposure this week» out loud, which is
the honest spelling.

**⚠ AND THE SIGNATURE STAYS ON ONE LINE.** The same pin reads the declaration as TEXT
(`lineAt(src, 'export function accrueSpirit(')`) and asserts `.toContain('{')` precisely so it can
prove it is not reading a wrapped fragment – a signature broken across lines makes its sibling
assertion («must take no Rng, whatever else it takes») pass on an empty string. Measured: the
current line is 83 characters, the repository carries no prettier or eslint width config, and
`src/engine/spirit.ts` already holds lines of 163 characters – so a three-parameter signature fits
and nothing in the toolchain will wrap it. The re-aim adds the new parameter to the same pin's
`toContain` list beside `psychologistWorks: boolean`.

## B – the golden save corpus has ZERO love episodes, so T1's back-fill walk is unwitnessed

T1's migration walks `world.loveEpisodes` and back-fills four fields on EVERY entry. The brief says
«the corpus has careers with episodes». **It does not.**

**Measured, 14.09, all 77 golden saves in `tests/fixtures/saves/`:** every fixture from v0 to v73
predates the field entirely; **v74, v75 and v76 each carry `loveEpisodes: []`** – an empty array,
three times. No golden save has ever held one entry.

**The ruling:** T1's migration test CRAFTS a v76 world carrying at least two episodes – one live
(`endedWeek === null`), one ended – and asserts the four fields arrive on BOTH. A back-fill loop
proven only by the goldens is a loop that has never executed, and a v77 fixture regenerating green
would be the receipt for work nothing did.

## C – the frozen corpus holds exactly ONE episode, and it is on the cell that has been missed before

T10's nested peel needs a witness, and there is exactly one.

**Measured, 14.09, all five frozen cells walked 156 weeks:**

| cell | preset/policy | `loveEpisodes` |
| --- | --- | --- |
| `FROZEN.middleGrinder` | 5/0 | 0 |
| **`FROZEN.eliteGrinder`** | **8/0** | **1** – `{id:'p:137', sinceWeek:137, endedWeek:null, knownWeek:137, wants:'open'}` |
| `FROZEN.selfTravelling` | 0/1 | 0 |
| `PRE_R28B.highPlayer` | 6/1 | 0 |
| `PRE_R28B.middlePlayer` | 5/1 | 0 |

So the nested peel is NOT a no-op – one cell of five exercises it, and four do not.

**⚠⚠ AND IT IS THE CELL THE FILE HAS ALREADY LOST ONCE.** `tests/coachTravelEdgeFixtures.ts:309`
records it in its own words: «ONE LIVE CELL WAS MISSED BY THE POSITIONAL PASS AND IT WENT RED:
`FROZEN.eliteGrinder`» – because it has been THE SAME STRING as `PRE_R28B.eliteGrinder` since v73,
so a re-stamp applied by position or by string replacement touches one of the two and not the
other. **T10 re-stamps that cell BY NAME.** The one cell the nested peel can be measured on is the
one cell the mechanical pass drops.

## D – ⚠⚠ wave 6 is INERT on the frozen corpus, and a stamped diff there is a STOP, not an expectation

Every mechanic this wave ships is gated on `sheIsNewsAt`: the five exposure kinds, the pressure
term, habituation's growth, both leak streams and the booth's stamp. So the frozen corpus can only
move if a frozen career is ever news.

**Measured, 14.09, peak `fameAt` across 156 weeks, against a proposed bar of 30:**

| cell | peak fame | weeks ≥ 30 | fame events | shoots |
| --- | --- | --- | --- | --- |
| `FROZEN.middleGrinder` | **0.00** | 0 | 0 | 0 |
| `FROZEN.eliteGrinder` | **0.00** | 0 | 0 | 0 |
| `FROZEN.selfTravelling` | **3.43** | 0 | 12 | 0 |
| `PRE_R28B.highPlayer` | **1.85** | 0 | 8 | 0 |
| `PRE_R28B.middlePlayer` | **3.25** | 0 | 12 | 0 |

Not one cell reaches a tenth of the bar. The corpus is not near the boundary – it is an order of
magnitude away from it, on every career, at every week.

**The ruling, and it OVERTURNS a line of the brief.** T10's brief says «Leak draws in re-walked
fixtures are the wave's own expected diff, stamped with their record». Measured, that licence
cannot be exercised: the expected diff on the frozen corpus is **`schemaVersion` plus the nested
peel's four episode fields on `FROZEN.eliteGrinder`, and NOTHING ELSE**. A hash that moves for any
other reason is a real behavioural change wearing a pre-signed licence, which is the exact defect
the file exists to catch, in its own phrasing. **`rngMain` byte-identical stays the STOP condition,
and so does every non-schema key.**

**⚠ And the second half of this ruling is about what the corpus CANNOT do.** Wave 5's rulings K and
R said the frozen corpus is a coupling detector rather than a measurement; here it is weaker still,
because it cannot even REACH the states this wave adds. No behavioural claim in wave 6 may cite a
frozen constant as its evidence. Crafted worlds prove the mechanics; the benches price them.

## E – ⚠⚠ `newsFameMin 30` is anchored on a constant that means something else, and at 30 the wave is dead for most of the game

This is the wave's load-bearing number: every mechanic is behind it. It deserves the measurement it
has not had.

**The anchor is a misread.** The brief anchors the bar on `ECONOMY.fame.contracts.fameCap` (30),
called «the ad market's own famous bar». That constant is the CONTRACTS TERM's own ceiling – the
code's comment reads «the most the whole term may ever add», and «a top-10 shelf … saturates this
term nearly twenty times over». It is the top of ONE contributor, not a band on the total. The
scale's own ceiling is `ECONOMY.fame.cap = 100`, and `fameAt` is continuous between them.

**Measured, 14.09, 33 personal saves read through the game's own import door, 15 408 career
weeks** (the r38 stance: nothing committed, only the aggregate leaves):

| bar | share of ALL career weeks | saves that ever reach it |
| --- | --- | --- |
| ≥ 5 | 48.6% | – |
| ≥ 10 | 29.2% | – |
| ≥ 15 | 12.1% | – |
| ≥ 20 | 10.9% | – |
| ≥ 25 | 8.5% | – |
| **≥ 30 (proposed)** | **6.9%** | **8 of 33** |
| ≥ 40 | 4.6% | – |

Per career, the peak fame ever reached: `naomi` 15.4 · `vera` 13.8 · `olivia` 11.1 · `zoe` 4.9 ·
`academy-demo` 0.0 – **five of the eight careers in that corpus never reach 30 at any week of their
lives.** The three that do are `alice-cfbv` (from week ~880), `alice_prologue` and `ines-xgv7`.

**The ruling.** The bar ships as `ECONOMY.spotlight.newsFameMin`, ONE constant behind ONE predicate
(`sheIsNewsAt`), exactly as the brief has it – the shape is right and does not move. What changes is
the evidence it carries: the anchor sentence is struck, the measured table above goes in its place,
and **T9's `bench:spotlight` sweeps the bar at 10 / 15 / 20 / 25 / 30 and prints coverage per
arm**, so the owner rules on a table rather than on a neighbouring constant's ceiling. The value
stays 30 in the tree until he rules, because shipping a guess in the other direction is the same
error mirrored.

**⚠ And the builder is warned about what this does to its own instruments.** At a bar of 30 most
bench arms actuate on a small minority of weeks. The wave-5 instrument law stands – actuation is
printed per temperament and `–` is never written as `0.0%` – and a bench that reports near-zero
actuation at 30 and healthy actuation at 15 has not failed; it has produced this wave's most
useful number.

## F – `stageTierMin` is not a number, the ladder is a LIST, and a hand-written set has burned this repo before

The brief proposes `stageTierMin 500`. **There is no numeric tier scale to compare that against.**

**Measured, 14.09:** `TierId` (`src/engine/season/types.ts:19`) is a string union of sixteen names –
`local · regional · national · j30 · j60 · j300 · w15 · w35 · w50 · w75 · w100 · wta125 · wta250 ·
wta500 · wta1000 · slam`. Nothing anywhere maps them to numbers, and `wta125` would break such a
map if anything tried.

The canonical ordering exists and is exported: **`TIER_LADDER`** (`src/engine/season/calendar.ts:1564`),
written for exactly this use – its own comment says the arithmetic «moves with the list rather than
with a number anybody edited», and records a sixteen-rung widening that cost «adding four names to
this array and nothing else».

**⚠ And the alternative's failure is recorded in this repo, in its own words.** `src/art/venues.ts:150`:
a hand-written tier array whose `indexOf(t)` «was −1 for every one of them, the lower-tier walk
never» ran – silent, because `indexOf` does not throw. A hand-written `['wta500','wta1000','slam']`
in `spotlight.ts` is that defect pre-booked: the week a rung joins `TIER_LADDER` the spotlight
quietly stops seeing it.

**The ruling.** `ECONOMY.spotlight.stageTierMin` is a **`TierId`** – `'wta500'` – and the test is
`TIER_LADDER.indexOf(tier) >= TIER_LADDER.indexOf(ECONOMY.spotlight.stageTierMin)`. Never a number,
never a hand-written set of names. A unit test asserts the bar resolves to an index `> -1`, so a
renamed rung goes red with a sentence instead of turning the spotlight off.

## G – ⚠ `'publicLoss'` is the one exposure kind NOT licensed by a permanent fact, and its horizon is 52 weeks

The brief says the five kinds are «each licensed by facts the world already records». Four are. The
fifth is recorded on a list that is pruned.

**Measured, 14.09, at tournament finalize (`src/engine/world.ts:636–668`)** exactly two things are
week-stamped: `trophiesByTier[tier].titles` (`kidFinish === 0`) and `.finals` (`kidFinish === 1`).
`bestFinishByTier` is a HIGH-WATER MARK and carries no week at all – the file says so. **An early
exit is stamped nowhere permanent.** Its only record is `world.results`, and that array **prunes at
52 weeks** – stated twice in the engine's own comments (`world.ts:646`: «`results` prunes at 52
weeks, `events` at 400»; `world.ts:1087`, in the fame context, again).

**The ruling, in three parts:**

1. `'stage'` reads `trophiesByTier` – permanent, exact, and it is `titles ∪ finals` at or above the
   bar, which is precisely «a title or final at a big stage this week».
2. `'publicLoss'` reads `world.results` – and `exposureEventsOf` is therefore **honest only inside
   a 52-week horizon**. That asymmetry is written into the function's own comment and **pinned by a
   test**: craft a world whose big-stage early exit is 60 weeks old, assert the kind is absent, and
   name the prune as the reason. An asymmetry nobody wrote down is an asymmetry the next wave
   discovers as a bug.
3. The weekly tick asks in-week by construction, so T3 is unaffected. **T9's benches must ask
   in-week too** – a bench that walks a career and asks `exposureEventsOf(world, oldWeek)`
   retrospectively will see every `'stage'` and no `'publicLoss'`, and will report a shape that is
   an artefact of the prune rather than a fact about her life.

## H – walls freeze habituation on EITHER axis, and the flag is `wallsFlipped` – settled, not a builder question

The brief leaves this open («if the builder reads §2a differently, that is a question to the
architect»). It is answerable from the spec, so it is answered here and T4 does not spend a round
trip on it.

**The spec's own sentence** (who-she-is §3c): «sustained fame slowly shrinks her own pressure scale
(she learns to live known) – **unless walls are up: walls freeze habituation**. A veteran star from
a good home shrugs at cameras that once cost her sleep.»

**Either axis, because «up» is the spec's word for the FLIPPED state and both axes are walls.** §2a
gives kicks that «raise walls» on two axes – the openness wall makes her expressed-closed, the
regulation wall makes her dysregulated – and both are «behind walls» in the spec's vocabulary.
Confirming it mechanically: the pressure ALREADY reads both axes (openness through the ×0.75/×1.5
scale, intensity through the standing `perturbationScale`), so a habituation that froze on one axis
only would be acclimating a girl the same pass has just charged double.

**The ruling.** `×0` while `wallsFlipped.open || wallsFlipped.reg`. **The FLAG, never the lean** –
`wallsLean` is a continuous leaning and a girl leaning toward walls has not raised them; the spec
says «up», and `wallsFlipped` is the state that means up. T4's pin grows a walled and an unwalled
twin at equal fame and moves only one.

## I – ⚠ the leak hazard keeps its FAME factor: the spec names it, and a gate cannot express it

**The drift.** who-she-is §3c-bis: «**The leak hazard** (sub-stream per episode, zero MAIN) **scales
by fame × EXPRESSED openness** – more lenses on a bigger star, and an open girl is simply seen».
The brief's T6 drops the fame term – `leakBasePerWeek × leakOpennessMult(expressed openness)` – and
justifies it as «more lenses on a bigger star is already priced by the news gate».

**Measured, it is not priced by the gate.** Above the proposed bar the fame range is **30 → 100**,
and the personal-save corpus spends 4.6% of all weeks above 40 against 6.9% above 30 – so the band
above the bar is wide and real. Under the brief's model a girl at fame 100 leaks at **exactly** the
rate of a girl at 30. That is not a smaller version of the spec's claim; it is a different claim,
and the brief's own single-source rule settles which one ships: «The wave builds against who-she-is
§3c and §3c-bis – THE spec, and on any drift IT wins».

**The ruling.** The hazard is

```
leakBasePerWeek × leakOpennessMult(expressed openness) × (fameAt(world, week) / ECONOMY.fame.cap)
```

It **adds no new tunable** – `ECONOMY.fame.cap` is 100 and is read, never written (§8 stands) – it
is monotone in fame, and it restores the sentence the spec wrote. The factor spans 0.30–1.00 above
the proposed bar, so `leakBasePerWeek` re-prices by roughly 2× at the median; that re-pricing is
T9's to measure and the owner's to rule, exactly like every other §4 number.

**⚠ The draw count does not move.** Still one uniform per episode-week while eligible, on the same
key. The count-keys net is unaffected, and so is MAIN.

## J – the defaulted trailing parameter is CORRECT in `buildCommentary`, and ruling A does not reach it

Stated because ruling A says the opposite thing about a different function, and a builder applying
one law in the wrong place is how a wave loses a day.

**Measured, `src/viz/commentary.ts:1310`:** `buildCommentary(match, playerA, playerB, event = null,
coach = null)`. Both trailing parameters are optional and default to `null`, and each carries a note
saying why in the same words: «every caller that passes nothing gets exactly the log this function
returned before he existed. The ladder only ever adds.» **No `.length` pin guards this function** –
what is pinned is the byte-identity of the old log, which the default is what PRESERVES.

`accrueSpirit` is the opposite case: a pin counts its parameters, so a default would hide the change
from the counter (ruling A). **The rule is not «defaults are bad»; it is «a default must not walk
past a pin that counts».** T7's packet joins `buildCommentary` as a sixth optional parameter
defaulting to `null`, on `coach`'s precedent, with `coach`'s own note.

**⚠ And T7's variety comes from `variant`, not a draw.** `commentary.ts` already owns
`variant(pointIndex, n)` – «deterministic phrase variety with no RNG: an integer hash of the point
index, folded to n», Knuth's constant. That is how the booth's beat gets more than one wording
while `src/viz` keeps zero draws, which the brief calls this wave's gravest possible finding.

## E-bis – the bench CAN actuate this wave, and the arm that decides it is the POLICY, not the money

Ruling E warns that at a bar of 30 most arms actuate rarely. T9 needs to know whether they actuate
**at all** before it designs a single cell, so it is measured here rather than discovered there.

**Measured, 14.09, 520-week walks:**

| preset / policy | label | peak fame | weeks ≥ 10 | ≥ 15 | ≥ 20 | ≥ 30 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 8 / 0 | 120k · wealthy · elite coach | **0.0** | 0 | 0 | 0 | 0 |
| **8 / 1** | 120k · wealthy · elite coach | **53.2** | 175 | 124 | 118 | **77** |
| 7 / 1 | 120k · wealthy · high coach | 13.2 | 71 | 0 | 0 | 0 |
| **6 / 1** | 25k · middle · high coach | **47.9** | 227 | 222 | 218 | **56** |

**Three readings, all of them T9's:**

1. **No fame-forcing harness is needed.** Two ordinary bench cells cross the bar for 56–77 weeks of
   a 520-week walk. `bench:spotlight`'s high-fame arms are built from preset/policy pairs, not from
   a patched world – and a patched world would have been the weaker instrument anyway.
2. **⚠ THE POLICY DECIDES, NOT THE MONEY.** Preset 8 reaches **0.0** under policy 0 and **53.2**
   under policy 1 – the same family, the same coach, the same wallet. A T9 arm built on policy 0
   measures nothing at all and would report it as «the spotlight does not move her», which is the
   «unable to fail» family wearing a bench's clothes. It is also why ruling D found five zeros:
   three of the five frozen cells are policy 0.
3. **The window is thin at 30 and comfortable at 15** – 11–15% of a long career against 24–43%.
   That is a second, independent argument for ruling E's bar sweep, arrived at from the bench side
   rather than from the save corpus, and the two agree.

## K – `'publicLoss'` is derived from POINTS, never from a round, and a skipped mandatory is not a loss

Ruling G found that an early exit lives only in `world.results`. This ruling says what can actually
be read off that row, because the brief asks for «round ≤ R2» and the row does not carry a round.

**Measured, 14.09.** `SeasonResult` (`src/engine/season/ranking.ts:31`) is
`{ playerId, week, points, tier?, mandatoryMiss? }` – **no finish index, no round, nothing about
the draw.** `points` is the only signal, and `WINDOW_WEEKS = 52` in the same file is ruling G's
prune.

**And points identify the round exactly, measured on the four tiers this wave can reach:**

| tier | draw | points |
| --- | ---: | --- |
| wta250 | 32 | `[250, 163, 98, 54, 30, 1]` |
| wta500 | 32 | `[500, 325, 195, 108, 60, 1]` |
| wta1000 | 64 | `[1000, 650, 390, 215, 120, 65, 10]` |
| slam | 128 | `[2000, 1300, 780, 430, 240, 130, 70, 10]` |

Each array is strictly decreasing and holds exactly `log2(drawSize) + 1` entries, so the finish
index and the payout are in bijection and **a points threshold is exactly a round threshold**.
«Lost in the first or second round» is index `>= log2(drawSize) − 1`, i.e. `points <=
TIERS[tier].points[log2(drawSize) − 1]` – 60 at wta500, 65 at wta1000, 70 at a slam.

**The ruling, in two parts:**

1. **Read the threshold, never invert the array.** `points.indexOf(row.points)` is exact only while
   every value in every array is distinct – true today, guarded by nothing, and silently wrong
   (`indexOf` returns −1, which compares as «very early exit») the day a tier is re-priced with a
   repeat. The comparison is `<=` against the named slot.
2. **⚠ `mandatoryMiss === true` is NOT a public loss.** That flag marks the scoreless row a SKIPPED
   mandatory writes – the tour takes a slot, not points – and she was never at the tournament. A
   girl who did not play did not lose in front of anyone, and charging her spotlight pressure for
   it would be a success tax on an absence, which §0.4 forbids twice over. The kind's test crafts
   that row and proves it silent.

## D-bis – ruling D was one line short, and T1 measured the missing line

**The architect's correction, recorded because a ruling that is quietly patched stops being a
record.** Ruling D says the expected frozen diff is «`schemaVersion` plus the nested peel's four
episode fields on `FROZEN.eliteGrinder`, and NOTHING ELSE». **It is also `spotlightHabituation`
appearing on all five cells** – `createWorld` writes the new world key, so every career grows it.
That is v76's own «keys APPEARING» shape and I should have named it.

**T1's measurement, which is now the record:** four cells move exactly **2** lines – `schemaVersion`
(`f74efabef12e`→`a88a7902cb4e`) and `spotlightHabituation` arriving at `5feceb66ffc8`.
`eliteGrinder` moves **3**: those two plus `loveEpisodes` (`d447eb28e502`→`8c5884c15bcd`). 85 / 83 /
86 / 84 / 85 other keys byte-identical, `rngMain` included. The bar was never approached, which is
the half of ruling D that matters and which held exactly.

**And ruling C was UNDER-stated.** T1's arm 6 (the nested peel neutered) reddens **three rungs, not
one** – v77, v76 and v75, all through `eliteGrinder`, because every rung from 74 up keeps
`loveEpisodes` in its shape and 73 drops it. The peel has more witnesses than I found; the cell that
carries them is still the one I named.

**The standing rule this produced, placed where its next reader will be standing** (a note at the
v77 step in `src/engine/migrations.ts`, 14.09): the golden save corpus cannot witness a per-row
back-fill – all 77 fixtures carry `loveEpisodes` empty or not at all – so **a step that writes into
a row writes its own witness.** Parking that as «we will remember» is how it gets rediscovered.
