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
