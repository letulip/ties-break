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

## L – T3's term is a FOURTH SUMMAND, it scales by intensity exactly once, and it reads the head's expression

Three parts, all of them measured off `accrueSpirit`'s own body and its own recorded history.

**The shape, measured** (`src/engine/spirit.ts`, the pass's arithmetic):

```ts
const moved =
  returned + weekPerturbation(world, wrapWithNoVacation) * s.perturbationScale[intensity] + shocked
world.spirit = roundTenth(clamp(moved, s.min, s.max))
```

**1. It goes in as its own summand, NEVER as a row inside `weekPerturbation` – and the file records
why in the voice of an incident.** The shock is added outside that multiplication because its
constants are already intensity-scaled, and the note says what the alternative did: «one base of
about −27.5 seen through the two `perturbationScale` values (−27.5 × 0.8 = −22.0, −27.5 × 1.25 =
−34.4) – so **a row inside `weekPerturbation` would scale them a SECOND time**, to −17.6 / −42.5».
The spotlight's bases are drafted «−2..−4 **before scaling**», so they take `perturbationScale`
exactly once, in their own summand, and a row inside `weekPerturbation` would repeat the recorded
defect on new numbers.

**2. It does not round itself.** There is ONE `roundTenth` and one `clamp` in the pass, at the end,
on the sum. A term that rounds its own tenths quantises the small values first – and a single
exposure at ×0.75 × a deep habituation discount is exactly where small values live.

**3. It reads the expression the HEAD already read, and never calls for it again.** The pass takes
`expressedTemperamentOf(world)` once, at the top, and the file's ⚠⚠ is explicit: «IT IS READ EXACTLY
ONCE, HERE AT THE HEAD, WHICH IS RULING F … Do not re-read it after this line, and never thread a
new value into the same tick.» T3 needs BOTH axes, so it hoists the expressed temperament into one
local and derives `temperamentIntensity` and `temperamentOpenness` from that one value. A second
`expressedTemperamentOf(world)` call is a second read, and wave 5 ruled that the girl who
experienced the week is one girl.

## M – the ORDER is a ruling, not an accident: everything that stamps an exposure runs BEFORE `accrueSpirit`

`'aired'` (T7) and `'wrongStory'` (T6) are exposure events of the week they land in. They are only
visible to T3's term if their stamps are already written when `accrueSpirit` runs.

**Measured** – the tick's own order is pinned by two tests (`wave4-ended-beat.test.ts:264`,
`wave4-ends.test.ts:616`): the private life's calls sit **between** `accrueCondition` and
`accrueSpirit`, in the order `rollEnds → rollArrival → deliverKnownPartner → rollSmallTalk`. So the
life block already runs before the spirit pass, by a property two pins defend.

**The ruling.** T6's leak hazard joins that block (it is a life call and belongs among its
siblings), and **T7's booth stamp must also be written before `accrueSpirit`** – it is not free to
sit in the viz, in the snapshot, or in a later phase, because «the mention IS an exposure event»
(§0 delta 2, and the owner's 10.09 ruling that the commentary and the pressure are one system) is
only true if the stamp exists when the pressure is summed. A stamp written after the spirit pass
buys an exposure event that is one week late, silently, for ever.

**⚠ And the caller keeps its double ask.** `phaseHerWeek.ts` asks `psychologistWorksThisWeek(world)`
twice on purpose – once for `accrueSpirit`, once for `driftWalls` – and the file explains that
hoisting it into a local would let a raw flag be handed down in the predicate's place, «ruling J's
own hole». T3 APPENDS its third argument and changes nothing else about that line; the two re-aimed
text pins then read the new call verbatim.

## N – ⚠⚠ at the drafted bases the spotlight is invisible to a whole quadrant of the roster, and it misses by one tenth

Ruling E measured HOW OFTEN the wave fires. This one measures WHAT THE PLAYER SEES when it does,
because «every dip explainable» (§3c's legibility law) is a promise about a screen, not about a
float.

**The scale, measured 14.09:** `ECONOMY.spirit` – baseline **70**, return **5**/wk steady and
**3**/wk intense, `perturbationScale` **0.8 / 1.25**, and the Mood bands are `heavy < 60 · dimmed <
67.5 · steady 67.5–72.5 · bright ≥ 72.5 · glowing ≥ 80`. **Baseline sits in the middle of `steady`,
2.5 points above the `dimmed` boundary.** For scale, the break-up shock is **−22 steady / −34
intense**, already intensity-scaled.

**What one exposure does to a girl at baseline, at the brief's own drafted bases:**

| event | steady·open | steady·private | intense·open | intense·private |
| --- | ---: | ---: | ---: | ---: |
| `'shoot'` −2 | −1.20 → 68.8 **steady** | −2.40 → 67.6 **steady** | −1.88 → 68.1 **steady** | −3.75 → 66.3 dimmed |
| `'stage'` −3 | −1.80 → 68.2 **steady** | −3.60 → 66.4 dimmed | −2.81 → 67.2 dimmed | −5.63 → 64.4 dimmed |
| `'publicLoss'` −4 | **−2.40 → 67.6 steady** | −4.80 → 65.2 dimmed | −3.75 → 66.3 dimmed | −7.50 → 62.5 dimmed |

**An expressed-open steady girl standing at baseline does not leave her Mood band on any single
exposure.** The deepest one the wave has – a heavily public loss at a slam – puts her at **67.6**,
which is **one tenth of a point** above the `dimmed` boundary. The feed will print «the cameras were
everywhere this week» and the Mood word will say exactly what it said the week before.

**⚠ Stated exactly, because the difference decides the question.** The spotlight term's own worst
contribution for that girl is **2.40**, and the distance from baseline to the band edge is **2.50**.
So the spotlight ALONE never crosses it – it crosses only on a week when the ordinary weather
(`weekPerturbation`, the same summand, which is rarely zero) has already carried her to within one
tenth of the edge. **The spotlight is not what she sees; it is what tips a week the rest of her life
had already brought to the boundary.** That may be exactly the design – weather among weather is
the brief's own framing – but it is not «every dip explainable», because the week the band finally
moves, the feed row that explains it names the cameras and the cause was mostly everything else.

**⚠ And every other dial in the wave points the same way.** Habituation multiplies DOWN (1 → the
`habituationFloor` 0.25) and the fifth focus multiplies DOWN again (0.85 → 0.55). A calm, open,
habituated girl with the focus held takes `−4 × 0.8 × 0.75 × 0.25 × 0.55 = −0.33` from the worst
week of her public life – **three tenths**, which `roundTenth` renders as 0.3 and the screen renders
as nothing.

**For scale against the system this one is modelled on:** the spotlight's worst single event is
**7.50** against a break-up's **34** – between one twenty-third and one third of a break-up,
depending on who she is.

**The ruling – and it is NOT a re-tune, because tuning is measured and then RULED, in that order.**

1. **No constant moves in this wave on my word.** §4's numbers are the owner's, and a bar and a base
   changed together by an architect who has measured neither against a played career is the guess
   ruling E refuses in the other direction.
2. **T3 pins the SHAPE, never the size** – the ×2 private/open ratio (1.5 / 0.75), monotonicity in
   habituation, monotonicity in rung. The brief already asks for the ratio pin; this is why it
   matters: every one of these numbers is going to move, and the pins must survive that.
3. **T9 measures what the player SEES, not only what the float does.** The `bench:spotlight` record
   carries, per birth temperament and per arm: the share of exposure weeks that **cross a Mood
   band**, the mean dip depth, and the weeks-to-recover. A wave whose feed line explains a dip the
   Mood word never shows has broken the legibility law while every unit test stays green.
4. **This goes to the owner beside ruling E, as one question with one table** – how often it fires,
   and what it does when it fires, are halves of the same decision and he should not be handed one
   without the other.

## O – the fifth focus is forced into two of its three roster sites and NOT into the third

**Measured, 14.09 – what actually goes red when `PsyFocus` gains a member:**

| site | `psychologist.ts` | type-forced? |
| --- | --- | --- |
| `PSY_FOCUS_LABEL` | 304 | **yes** – `Record<PsyFocus, string>` is total |
| `PSY_FOCUS_LINE` | 318 | **yes** – same |
| `PSY_FOCUSES` | 300 | **NO** – `readonly PsyFocus[]` is an ARRAY, and an array of four is a perfectly valid array of a five-member union |

Everything else that mentions `PsyFocus` – `messages.ts:230`, `snapshot.ts:277/288`, `game.ts:530`,
the `world.ts` barrel – carries it in a POSITION, not in an exhaustive read, and stays green.

**So the one site the compiler will not defend is the one that decides whether the focus is ever
offered at all.** A `PSY_FOCUSES` left at four means the fifth focus exists in the type, has a label
and a line, and is never in the roster the seat iterates, the refusal filter walks, or the string
tests read (`wave5-psychologist-focus.test.ts:353` maps its strings off that very array). Nothing
goes red. That is the «unable to fail» family's thirteenth costume: a type that guards two of three
siblings and leaves the load-bearing one to a human.

**⚠ Wave 5 saw it coming and left the tripwire.** `tests/wave5-psychologist-focus.test.ts:273`:

```ts
expect(PSY_FOCUSES.length, 'four at step 5; the fifth is the spotlight wave`s (O7)').toBe(4)
```

The message names this wave. T5 re-aims it to `5` and rewrites the message – a guard pin re-aimed
with a ⚠ note, never weakened.

**The ruling: the re-aim STRENGTHENS, because a length is not a membership.** An array of five with
a duplicate passes `toBe(5)`. The compiler already holds a complete list of the union – the
type-forced `Record` – so use it as the oracle:

```ts
expect([...PSY_FOCUSES].sort()).toEqual(Object.keys(PSY_FOCUS_LABEL).sort())
```

That is total by construction, it goes red the day a sixth focus is added to the type and forgotten
in the roster, and it costs one line. The length assertion stays beside it: it still names the
number a reader is checking against the spec.

## Corrections from T2 – three of mine, and one of the brief's that could never have fired

**The brief's, and it is the wave's fourteenth «unable to fail».** The brief grounds `'shoot'` on
`completedShootWeeks(world, week)` containing `week`. Measured by T2: that function returns weeks
lived **strictly before** `week` – `(w, 200) = []` and `(w, 201) = [200]` – so the brief's spelling
is **false for every world at every week**. A kind that ships exactly as written never fires once,
and nothing goes red, because there is nothing to be red about. Corrected to `week + 1`, which keeps
`fame.ts`'s single predicate and its college-freeze rule rather than opening a second one. T2's ARM
3 is the literal spelling, and it reddens.

**Ruling E, corrected: the anchor's PATH was wrong, and the correction strengthens the ruling.** I
wrote `ECONOMY.fame.contracts.fameCap`, taking the path from the brief instead of walking it.
Re-derived independently: the 30 lives at **`ECONOMY.business.merch.contracts.fameCap`**. So it is
not merely a contract term's ceiling – it is a ceiling inside the **merch and brand-reach** model,
one system further from «the ad market's famous bar» than I said. Ruling E's argument and every
measured number in it stand unchanged; only the address was wrong, and it was wrong in the
direction that made the anchor look better than it is.

**Ruling F, under-stated.** I wrote the ladder guard as `'stage'`'s. Both `'stage'` and
`'publicLoss'` ask the ladder, so an unresolvable bar turns **both** kinds off at once – T2 predicted
6 red cases from that arm and measured **9**. The guard is worth more than I priced it at.

**Ruling K, resting on a coupling I did not name.** T2 found it: a losing row reaches `world.results`
at all only because `world.ts:1039` pushes `if (points > 0)`, and the big tiers happen to pay
**1 · 1 · 10 · 10** at their first round. **A big tier re-priced to 0 at R1 would stop writing the
row and silence `'publicLoss'` entirely** – the «unable to fire» family one level below the one
ruling K was watching. The coupling is now stated in `spotlight.ts` itself. K's thresholds
re-measured exact: 30 / 60 / 65 / 70.

**⚠ And the background notification lied again, twice, in one task.** T2's first gate read
`CHECK_EXIT=1` from the file – one case of 5 365, T1's reader census, which the re-aim then fixed –
while the notice said «exit code 0». That is CLAUDE.md's hazard (c) reproduced on this branch today,
and it is the reason the exit code is never read from anywhere but the log.

## Corrections from T3 – ruling A undercounted, and the brief PLACED two kinds where they cannot fire

**⚠⚠ The brief's, and it is the wave's fifteenth «unable to fire» – two kinds this time, and the
defect is the PLACEMENT rather than the spelling.** T2 found `'shoot'` written so it could never
fire; T3 finds `'stage'` and `'publicLoss'` **asked at a moment in the tick where their records do
not yet exist**. §0.1 and ruling M both specify the call – `exposureEventsOf(world, world.week)` at
the `phaseHerWeek` caller – and ruling M's own sentence is that a stamp read one week late «buys an
exposure event that is one week late, silently, for ever». Measured 14.09:

| fact | its only writer | the week it stamps | the tick step it runs in |
| --- | --- | --- | --- |
| `'stage'` | `finalizeTournament`, `cabinet.titles/finals.push(world.week)` (`world.ts:673-674`) | `world.week` | **5** (`playHerWeek`) |
| `'publicLoss'` | `finalizeTournament`, `world.results.push({…, week: world.week, …})` (`world.ts:1039`) | `world.week` | **5** (`playHerWeek`) |
| the pressure | `accrueSpirit` | – | **3** (`resolveBodyAndPlanner`) |

`trophiesByTier` has exactly one writer in `src/`. So her week-W silverware is written **after** week
W's spirit pass has closed, and week W+1's pass asks about week W+1. The reveal flow does not rescue
it – the tick refuses to advance past an unrevealed tournament, so a late finalize still stamps week
W. `'shoot'` is unaffected (`shootWeeksLived` reads signed letters and the college window, both
written long before), and `'aired'` / `'wrongStory'` will be fine, because ruling M puts their stamps
in the life block, which really does run before this pass.

**Ruling M measured the LIFE block's position and never the TOURNAMENT's** – that is the hole, and it
is the ruling's own argument turned on the other three kinds. It is not T3's to close: asking
`world.week − 1` makes `'aired'`/`'wrongStory'` one week late (exactly what M forbids), and moving
the call after step 5 is refused by M, by §8 and by the five pins that read its position. So T3 ships
the call as specified, writes the measurement into the call site's own comment, and PINS it
(`tests/wave6-spotlight-pressure.test.ts` §F: the tick's order, the two stamps' week, and a case
proving the LEDGER is innocent so the next reader does not go hunting in `world/spotlight.ts`).
**The decision is the architect's**, and it is the wave's, not this task's.

**⚠⚠ Ruling A, corrected: the table names three pins and the tree has FIVE.** All five are re-aimed,
none deleted, none weakened – and two of them carry a different history from the one the ruling
assumes.

| pin | named by A? | re-aims |
| --- | --- | --- |
| `tests/spirit.test.ts:941` (arity) + `:953` (signature text) | yes | first |
| `tests/spirit.test.ts:1085` – the ordered-list `CALL` text pin | **no** | **second** (wave 5's T4b re-aimed it 13.09) |
| `tests/wave4-ended-beat.test.ts:264` | yes, exact line | second |
| `tests/wave4-ends.test.ts:635` | yes – ⚠ **the ruling gives 616**; it is 635 | second |
| `tests/wave5-psychologist-walls.test.ts:883` | **no** | **FIRST** – the case was BORN in wave 5 carrying the anchor, so «their second» is not true of it |

The ruling's «both text pins were re-aimed once already» is right about the two it names and wrong
about the count: four text pins read that call verbatim today, and the fifth site is the arity pin.
The rest of ruling A stands exactly: the parameter is REQUIRED (ARM 9 ships the defaulted spelling
and the arity pin goes red on it), and the declaration fits on one line – **measured at 119
characters** against the 83 the ruling recorded for the two-parameter form.

**⚠⚠ And a SIXTH pin, which no ruling could have predicted from ruling A because it is ruling L's
consequence rather than A's.** `tests/wave5-psychologist-schema.test.ts:688` – wave 5's own ruling-A
reader census – pins `accrueSpirit`'s expression read by its exact spelling,
`temperamentIntensity(expressedTemperamentOf(world))`. Ruling **L part 3** requires that call to be
HOISTED into a local so both axes come off one read, so the spelling had to move and this went RED at
the gate, one case out of 5 407. Re-aimed and STRENGTHENED: it now asserts the hoist, asserts the
intensity axis is a projection of it, and **counts the read at exactly one** – so ruling L part 3 is
guarded by arithmetic rather than by a substring, and the inline second call that would have kept the
old form green is red (ARM 11, 1 RED). ⚠ The lesson for T4 and T5, who both add factors to this same
product: a ruling that changes a SPELLING inside `accrueSpirit` reaches pins that no census of its
SIGNATURE will find.

**Ruling L, confirmed in all three parts, with one measurement it did not have.** Part 2's «a term
that rounds its own tenths quantises small values first» is exact and cheap to see: three `'stage'`
events for a `'deep'` girl are −16.875, which the pass's single `roundTenth` lands at **53.1** and a
self-rounding term lands at **53.2**. ⚠ **And the same quantisation is a trap for the ratio pins
ruling N asks for.** At ONE event the intensity ratio cannot be read off the written spirit: a
`'fiery'` girl's single `'publicLoss'` is 3.75 points, the write lands at 66.3, the cost reads 3.7,
and the ratio comes out 1.5417 against a true 1.5625. At EIGHT events both arms land on exact tenths
(30.0 / 19.2) and the ratio is exact. The ×2 openness ratio is exact at one event on every kind. A
pin that divided two rounded numbers and called the answer a factor would have been measuring the
rounding.

**⚠ And one surface consequence of the legibility law, carried rather than decided.** The exposure
feed row is `type: 'life'` (the brief's own spelling) and carries no `lifeKind`, because §8 forbids a
new `LifeBeatKind` member. Measured: `lifeRowGlyph(undefined)` resolves through `?? 'met'` to
`LIFE_ROW_EMOJI.life` – the owner's own 11.09 **white heart** – so an exposure row will wear the
ROMANCE thread's mark in the feed's glyph column, beside «they met» and «it ended». who-she-is §5a
forbids an agent picking a glyph unasked, so T3 picked none and pinned the consequence instead
(§H's last case), so it is chosen rather than discovered in a playtest. The fix, whichever it is, is
his.

## P – ⚠⚠ ruling M was measured on the wrong half of the tick, and two of five kinds are dead as shipped

**T3's finding, re-derived independently before it was ruled on.** `tickWeek`'s own statement order
(`src/engine/world.ts:1891`):

| # | step |
| --- | --- |
| 1 | `recordDrawnFirstRounds` |
| 2 | `seasonBoundaryAndObligations` |
| 3 | `weeklyFinance` |
| **4** | **`resolveBodyAndPlanner`** – the life block, then `accrueSpirit` |
| 5 | `deriveWeekField` |
| **6** | **`playHerWeek`** – the week's tournament is played |
| 7 | `growAndLive` |
| 8 | `closeTheWeek` |

`finalizeTournament` is the only writer of `trophiesByTier[t].titles` / `.finals`
(`world.ts:673-674`) and of `world.results` (`world.ts:1039`) – both stamped with `world.week` – and
it is reached from `revealTournamentRound` / `skipTournament`, at or after step 6.

**So when `accrueSpirit` asks `exposureEventsOf(world, world.week)` at step 4, this week's title,
final or early exit has not been written yet.** `'stage'` and `'publicLoss'` return nothing, every
week, for ever – the fifteenth «unable to fail» of this pair of waves, and this one is mine: ruling
M measured the LIFE block's position, correctly, and declared the order settled without ever
measuring the tournament's.

**⚠ And it reaches past those two kinds.** T7's booth mention is about a MATCH, and the match is
played at step 6 – so `'aired'` cannot honestly be stamped before step 4 either. Ruling M asked T7
for something the tick cannot deliver.

**The ruling: ONE horizon, and it is the last CLOSED week.** `exposureEventsOf(world, world.week −
1)` for all five kinds, its pressure applied in the pass that follows.

**Why this and not the alternatives, each refused for its own reason:**

* **Move `accrueSpirit` after `playHerWeek`** – refused. It is the ONE writer of `world.spirit`, the
  life block must sit between `accrueCondition` and it, and six pins defend that position.
* **A split horizon** – tournament kinds at `week − 1`, life kinds at `week` – refused. It makes
  `exposureEventsOf` lie about its own parameter and puts two clocks in one ledger.
* **Carry the week's exposure forward in a field** – refused. That is another schema move, for a
  lag that is free.
* **And the lag is not a compromise, it is the truer reading.** The cameras were on her at the
  weekend; the week she pays for it is the week after. «Мы ни за что не наказываем» is untouched –
  nothing about the SIZE changes, only which pass carries it.

**What this does and does not disturb:** T6's leak and T7's stamp keep their natural homes and are
seen one tick later · ruling G's 52-week horizon is untouched, `week − 1` sits deep inside it · the
no-exposure byte-identity pin and the ×2 openness ratio pin are unaffected · the feed row names the
week that closed rather than «this week», and that row is a DRAFT, so T8 owns the sentence.

**This ships as its own correction task (T3b), not folded into T4** – wave 5's practice, for wave
5's reason: a correction carried inside the next build is a correction nobody can review.

## Corrections from T3

**Ruling A undercounted by three, and mis-stated two facts.** The tree holds **six** sites that read
`accrueSpirit`'s signature or its call text, not three: `spirit.test.ts` carries a third
(`:1085`, the call string) that I never found, `tests/wave5-psychologist-walls.test.ts:883` carries a
fourth – **on its FIRST re-aim, not its second, because it was born in wave 5 already holding the
anchor** – and ruling L forced a sixth in `wave5-psychologist-schema.test.ts`, which now pins that
`expressedTemperamentOf(world)` appears **exactly once** in the pass. `wave4-ends.test.ts`'s pin is
at **635**, not the 616 I quoted. The new signature is **119 characters on one line**, as ruling A
required and measured.

**The ratio pin cannot be read at one event on the INTENSITY axis.** T3 measured it: `roundTenth`
quantises, so a `'fiery'` girl's single `'publicLoss'` reads 3.7 against a true 3.75 and the ratio
comes out 1.5417 instead of 1.5625. **The ×2 OPENNESS ratio is exact at one event on every kind**,
which is the ratio ruling N asked to be pinned – so the pin stands where it was aimed, and the
intensity ratio is read over eight events that land on exact tenths.

**The glyph, restated more precisely than the report put it.** T3 flagged that the exposure row
wears 🤍 «the romance thread's mark». Measured: `LIFE_BEAT_EMOJI['met']` is EMPTY, so
`lifeRowGlyph(undefined)` falls through to `LIFE_ROW_EMOJI.life` – **which is the owner's own 11.09
pick for the `'life'` ROW KIND**, worn by every life row that has no per-kind mark. So the row is
not mistaken for a romance beat; it wears the mark he chose for life rows. **The open question is
narrower and still his**: whether the spotlight deserves a mark of its own. §5a stands – no agent
picks a glyph – so nothing was picked, and it goes to him with the strings.

## Corrections from T3b

**Ruling P holds in every part, and nothing measured contradicts it.** The horizon is one week back,
for all five kinds, and the two starved ones now fire – proved by the pair of cases the fix INVERTS
rather than by a case that could only go green: a big-stage title and a big-stage early exit stamped
in week W are charged in the pass at week **W+1** and NOT in the pass at week W, measured through the
real phase (`resolveBodyAndPlanner`) on twins that differ by one stamp. All six of those assertions
were RED under T3's shipped spelling (ARM 12) and are green after. Three corrections to the TASK's
framing, all measured:

**⚠⚠ THE FIRST TICK ASKS ABOUT WEEK 0, NEVER ABOUT −1.** The correction brief says «`world.week − 1`
is `-1` on the first tick»; it is not. `tickWeek`'s step 0 runs `world.week += 1` **before**
`resolveBodyAndPlanner`, so a career born at week 0 runs its first spirit pass at `world.week === 1`
and the earliest week the call site can ever name is **0** – which holds no trophy, no result row and
no stamp, so the first tick charges nothing. **−1 is reachable only from outside the tick** (a bench,
a test, a later caller), and the ledger now answers it with an empty list by a stated guard at its
head. ⚠ THE GUARD IS A LAW AND NOT A REPAIR, and the distinction is the honest half of the report:
asked about −1 the four readers already answer with nothing, because `decayAt` returns 0 for anything
in the future, so `fameAt(world, −1)` is 0 and the news gate alone closes the door. Deleting the
guard therefore reddens the STATED half of the pin and not the behavioural one (ARM 14) – the
emptiness was a coincidence of three separate rules, any one of which a later wave could retune, and
what T3b buys is that it stops being a coincidence. ⭐ AND THE INCREMENT'S POSITION IS NOW PINNED
(ARM 15): it is the one thing standing between `world.week − 1` and a negative first tick, and it was
load-bearing while nothing read it.

**⚠⚠ THREE OF THE SIX PINS T3 NAMED DO NOT READ THE CALL TEXT, AND DID NOT MOVE.** The correction
brief asks for six re-aims «of the pins that read that call's exact text». Measured: only THREE of
T3's six do – plus a fourth in the wave-5 walls file and the T3 suite's own §F pin. The arity pin
(`accrueSpirit.length`), its signature sibling and the wave-5 schema suite's reader census all read
`engine/spirit.ts`, whose declaration and whose one `expressedTemperamentOf` read T3b does not touch;
they were run and stayed green. **Re-aiming a pin that did not move would have been a diff with no
claim behind it**, so they were left exactly as T3 wrote them. ⚠ AND THE SITE COUNT IS NOT THE RED
COUNT: the four call-text sites redden FIVE cases under ARM 12b, because `wave4-ended-beat.test.ts`
holds its anchor in a helper two of its cases share. A census of the sites is not a census of what
goes red – the same lesson T3 carried about ruling A's table, one level down.

**⚠ THE DRAFT ROW MOVED BECAUSE THE HORIZON MOVED, AND IT IS STILL A DRAFT.** T3's
«People were talking about her **this week**.» was true under ruling M and false the moment ruling P
landed – the row is stamped with the week it PRINTS in, and what it names is the week that closed.
It now reads «…**last week**.» ⚠ DELIBERATELY NOT POLISHED and deliberately NOT PINNED as wording:
T8 and the вычитка own the sentence, and a T3b pin on its words would have taken that away. The only
reader is the §H case that asserts the row carries `EXPOSURE_ROW`, which moves with it.

## Corrections from T3b – and a correction of my own correction brief

**T3b's brief said six pins read the call text. Four do.** I relayed T3's list of six without
separating what each site actually reads. Measured by T3b with a declared-null control (CONTROL 12c:
the horizon mutation run against the schema suite → **0 RED of 20 cases**): the arity pin, its
signature sibling and `wave5-psychologist-schema.test.ts`'s reader census all read
`engine/spirit.ts`, whose declaration and whose single `expressedTemperamentOf` read T3b never
touches. They were left exactly as T3 wrote them – re-aiming them would have been a diff with no
claim behind it. **Ruling P itself is uncontradicted in every part.**

**Week 0 is not the hole it looked like.** `tickWeek` runs `world.week += 1` as **step 0**, before
`resolveBodyAndPlanner` – so a career born at week 0 runs its first spirit pass at `world.week === 1`
and asks the ledger for week **0**, never −1. That increment's position had never been read by
anything; it is now pinned, because it is the one thing standing between the new horizon and a
negative first tick.

⚠ **And the negative guard is honestly labelled a LAW rather than a repair.** `spotlight.ts` answers
`week < 0` with an empty list, but `decayAt` returns 0 for the future, so `fameAt(world, -1)` is 0
and the news gate had already closed that door. Deleting the guard therefore reddens the STATED half
of its pin and not the behavioural one – T3b wrote that limit into the case instead of claiming an
arm it did not have.

**The before/after evidence is the part that matters, and it exists**: six cases run through the real
phase on twins differing by one stamp, both news at the week under test, so the horizon is what is
measured and never the gate. A big-stage title in W is charged at W+1 and **charged at all** – the
assertion that was false – at 3.6 for a steady·private girl; the early exit at 4.8; and neither is
charged at W. **All six were RED under T3's shipped spelling and are green now.**

## Q – habituation is a SIBLING, it runs after the pass, and it reads the wave's one horizon

Three things the brief leaves open at T4, each of which has exactly one right answer once the
question is asked out loud.

**1. The writer is a sibling of `accrueSpirit`, not a block in its tail.** `growHabituation(world, …)`
is called from `world/phaseHerWeek.ts` on the line **immediately after** `accrueSpirit` – wave 5's
ruling P precedent, verbatim, and `driftWalls` already sits on exactly that line. Three reasons, and
the second is the load-bearing one:

* `accrueSpirit` stays the one writer of `world.spirit` and gains no second field to own.
* **The ORDER becomes a property of the call site rather than of a comment.** The scale must be read
  with the habituation she CAME INTO the week holding; a growth that ran first would discount this
  week's own exposure by this week's own growth – an off-by-one that no test would name and that
  reads as «the constants are slightly too weak». Calling it after the pass makes that unspellable.
* A sibling keeps `spirit.ts`'s import list closed, which §0.1 requires.

**2. It reads `world.week − 1`, the same horizon as the pressure.** Ruling P gave this wave one
clock and it stays one clock: a reader that asked `sheIsNewsAt(world, world.week)` while the
pressure asked `world.week − 1` would be a second clock in the same pass, and «which week is this
about» is exactly the question that cost us two dead kinds. ⚠ It also happens to be the same ANSWER
at step 4 – fame is derived from stamps written in earlier weeks – which is why the coherent
spelling is free.

**3. Habituation 0 must scale to exactly 1.0.** `habituationScale = 1 − (1 − habituationFloor) ×
(spotlightHabituation / habituationFullWeeks)` is 1 at 0 by construction, and that is worth a
BYTE-IDENTITY pin and not just an endpoint assertion: every career that has never been news must
play exactly the tennis it played before T4 existed, and the T3 literal `1` this task replaces is
what made that true yesterday. Pin it against a world that HAS been news too – grown habituation,
then walls flipped – so the pin cannot pass by never having grown anything.

## R – the slot ruling Q gave away was held, the reason it must be held is the half I did not state, and the clamp stays out of the read

**Ruling Q, corrected twice by T4, and the second correction is the load-bearing one.**

**1. The line was not free.** I wrote «the line immediately after `accrueSpirit` – wave 5's ruling P
precedent, where `driftWalls` already sits», as if the neighbour were a landmark. It is a **pin**:
`tests/wave5-psychologist-walls.test.ts` §H asserts `expect(j).toBe(i + 1)` and its own comment says
it is «red on any statement sliding between them». Taking that line is a pin move, and T4 made it
one – re-aimed to a **total slice equality** naming the one statement now allowed there, which is
strictly stronger than `toBe(i + 1)`: the old form said nothing about WHAT occupied the next line.

**2. ⚠⚠ It must run BEFORE `driftWalls`, and that is the half ruling Q never gave a reason for.**
`driftWalls` writes `wallsFlipped` and promises that whatever flips there is first read on the NEXT
tick. Put the growth below it and a girl who flips in week W is **charged** as the pre-flip girl and
**frozen** as the post-flip one – wave 5's «one girl for the whole week» broken by a third reader,
in the same week, silently. Ruling Q got the placement right by accident of the neighbour it named;
**the placement's reason is this, and it is now written down.** Two arms redden it.

**3. The T1 zero-diff pin's own prediction was wrong, and T4 measured it instead of inheriting it.**
That pin's note said T4's growth would turn it red. It stayed green – the walked career is never
news (ruling D: peak 3.43 against a bar of 30). **The prose was re-aimed and the assertions were
not touched**, which is the right answer: re-aiming a pin that did not move would be a diff with no
claim behind it.

## The clamp T4 carried to me rather than shipping – ruled: it stays OUT of the read

`habituationScale` ships the ruled formula literally, with no `Math.max(floor, …)`. Its floor is
therefore guaranteed by the WRITER's cap, not by the reader – so a future second writer that pushed
the counter past `habituationFullWeeks` would drive the scale below the floor and eventually
through zero, into a spotlight that PAYS her. T4 named the hole and declined to invent the guard
(§8). Correct call, and here is the ruling it was waiting for.

**The guard stays out, because the house idiom is to clamp where you WRITE and trust where you
READ,** and this pass is the file that demonstrates it twice in four lines:

```ts
world.spirit = roundTenth(clamp(moved, s.min, s.max))
world.bond   = roundHalf(clamp(settled, b.min, b.max))
```

`growHabituation` already clamps at its own write with the `Math.min` at the cap, it is the ONE
writer of the field, and both facts are pinned (§E's cap case, §G's one-writer case). A second
clamp in the reader would be a branch that cannot fire under any reachable state – untestable by
construction, and it would quietly move the invariant from «one writer, capped, both pinned» to «the
reader will cope», which is the weaker of the two and the one nobody maintains.

⚠ **What DOES ship is the sentence**: `habituationScale`'s comment names the writer as the
guarantor, so the next author who reaches for a second writer meets the reason before the bug.

## Two measurements from T4 worth keeping

**T3's entire pressure suite is blind to the habituation factor** – every fixture in it sits at
habituation 0, so flattening the scale leaves it wholly green (ARM 22). That is why T4 needed its
own file rather than extending T3's, and it is a warning for T5: a factor that ships as a literal
`1` has no witnesses until its own task builds them.

**A flipped wall also inverts the EXPRESSED axis**, so a walled girl's spirit cost moves 1.2 → 0.9
for reasons that have nothing to do with habituation. T4's pause case therefore pins the SCALE and
not the cost – a cost-level pin there would have measured two effects and named one.

## S – T5's findings, and the false sentence ruled

**The brief's central T5 instruction could not be obeyed as written, and T5 was right to refuse it.**
It says both effects «ride `psychologistWorkingRung(world, 'publicLife')`». They cannot: both live in
`engine/spirit.ts`, and wave 5's ruling J **measured** that importing `world/psychologist.ts` from
there closes a value cycle on two live back-edges – the psychologist module says so on that very
function. T5 took the house answer (the billing predicate handed down, focus and rung read off the
world) and then **pinned the equivalence against the real `psychologistWorkingRung` across the whole
grid**, with a non-vacuity case proving the oracle returns all three rungs and `undefined`. That is
the correct shape: when you cannot call the authority, you pin yourself against it.

**⚠⚠ Ruling O is narrower than it reads, and T5 has the null to prove it.** Dropping the fifth focus
from `PSY_FOCUSES` (type, label and line intact) reddens 5 unit cases and **0 of 15 against the
mounted card** – because every count in the component test derives from `PSY_FOCUSES` too. **The
component layer is blind to ruling O's hole for exactly the reason the array is.** So the re-aimed
membership oracle is not one net among several; on this tree it is the ONLY one.

**⚠ And the widening reaches a file the gate cannot see.** `e2e/psychologist.spec.ts` carried three
hard-coded `4`s and a hand-typed label list, and **e2e is not part of `npm run check`** – it would
have stayed green and silent until T10's own gate. T5 swept it. **Standing note for any future
roster widening: the compiler forces two sites, the membership oracle forces the third, and the e2e
suite is forced by nobody – sweep it by hand.**

### The sentence that is now false – ruled: T8 fixes it, and that is not an invariant-4 breach

`PSYCHOLOGIST_FOCUS_UNKNOWN_REFUSAL` reads «No such year of work – **there are four**, and that is
not one of them.» There are five. T5 flagged it and did not touch it, which was right.

**Measured before ruling:** it is thrown by `setPsychologistFocus` only when
`!PSY_FOCUSES.includes(focus)`, and the UI offers exactly `psychologistFocusOpen`, which filters that
same roster. **No action the interface permits can produce it** – it guards a programming error or a
malformed worker message, unlike its siblings (`..._SEASON_`, `..._NOT_READY_`), which fire on
legitimate player acts and are genuinely player-facing.

**The ruling.** Invariant 4 protects the player's screen from silent redesign; this sentence cannot
reach that screen, and the task that made it false is this one. Compare the stale `knownWeek: 139`
row of T1: that text was a RECORD of a measurement, so it was annotated; **this text is an ASSERTION
about the present state, so it is corrected.**

**And the count comes OUT rather than being bumped to five**: «No such year of work – that is not one
of them.» A number in that sentence rots on every roster change and has now done so once; removing it
retires the class instead of resetting the clock. It ships **as a draft in T8**, in the wave's draft
set, under the same вычитка and the same playtest as every other string here.

## T – T6's findings: the overtake could never have fired, the narrowing is upheld, and a guard's scope hole goes to T10

**⚠⚠ The overtake's condition, as the brief and the field's own note spell it, is unreachable in
play – the sixteenth «unable to fire» of this pair of waves.** Both say `knownWeek === null`.
Measured at the one writer: `rollArrival` sets `knownWeek = sinceWeek + shaveLag(raw, band)` and
`shaveLag` is TOTAL, so an engine-born row never holds a null there – T6 asked the real `rollArrival`
over 60 careers and 20+ rows and found none. The founding scene would have been spelled into a
branch no played career can enter.

**Upheld: T6 shipped the SPEC's sentence instead**, «`publicWeek` can land BEFORE `knownWeek`»,
spelled «has he been told yet», which contains the brief's wording as a sub-case. ARM 6 reddens four
cases on the brief's version. ⚠ **And the field comment on `knownWeek` («or null while he has not
been told») is itself false for engine-born rows** – `null` survives only for migrated or crafted
ones. That is an ASSERTION about the present, so by ruling S it is corrected rather than annotated;
it joins T10's sweep.

**Upheld, and for a stronger reason than the report gives: the hazard runs on the ACTIVE episode.**
Read literally the brief leaks a romance that ended three years ago – and because T7's licence READS
the stamp and never re-judges it, the booth would then put «a face in the players' box» on air about
somebody long gone. The narrowing is also the brief's own structure: it already says an episode that
ends while PUBLIC needs no second hazard, which only makes sense if ending while PRIVATE simply stays
private. **A relationship the world never learned of is a relationship the world never learned of** –
that is true to the model and true to life, and a retrospective leak is a different beat in a later
wave, not a wider condition in this one.

**The guard's scope hole goes to T10, widened WITH a named exception.**
`tests/wave4-life-row-stamp.test.ts`'s law – every life row stamps a `lifeKind` – reads
`worldSource()`, so `engine/spirit.ts` sits outside it and **T3's `EXPOSURE_ROW` is an unstamped
`type: 'life'` row the pin has never been able to see.** T6 was right not to widen it mid-task.
**T10 widens the scope** (so the next unstamped row IS caught) and names T3's row as the one declared
exception, carrying its reason – §8 forbids a new `LifeBeatKind` – and the owner's still-open
question about whether the spotlight deserves a mark of its own. A law with a written exception is
worth more than a law that silently cannot look.

**Two smaller things worth keeping.** The `'wrongStory'` feed row is the only one that may name «a
mystery man»: the schema deliberately persists no partner gender, so the TRUE row stays gender-free
and **the fabrication is what licenses the phrase** – the wrongness is doing the work, which is
exactly §3c-bis's gem. And the e2e corpus is clean today by **23 weeks**: only the `pro` fixture is
news (fame 59.57) with a live unleaked episode, its first leak lands at week **435**, and the fixture
sits at **412**. ⚠ A future `npm run e2e:fixtures` regeneration that walks past 435 will produce a
leak – T10 records that as the known crossing rather than discovering it.

**⚠ And the background notification lied twice more** – «exit code 0» over logs reading
`CHECK_EXIT=2` and then `=1`, both real failures. Six lies in one wave.
