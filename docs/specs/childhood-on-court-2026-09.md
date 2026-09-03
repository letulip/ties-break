---
type: spec
status: draft
area: simulation-and-balance
canonical: false
last-reviewed: 2026-09-02
---

# The childhood on the court – the years show at a Local Open (phase 12)

Phase 12 of `childhood-prologue-build-2026-09.md`, and it closes the gap phase 11 left open in that
document's own words. Invariant 5: a balance change ships with a bench run and a spec recording
**predicted vs measured**. The bench is `npm run bench:court`
(`tools/prologue-court-bench.ts`, `SEEDS=20000`) and every number below is its output.

**Status: DRAFT.** No copy changes, no screen changes, no new question on any card. The only thing a
player can see is that a girl whose parent paid for the club, the one-to-one hours and the sports
school now plays like one.

---

## 1. The defect

The owner, on phase 11:

> the prologue's whole point is that the years show. They do not: at a Local Open she is drawn as a
> ninth child out of `STARTING_SKILL_BAND`, with no connection to the childhood. A player who paid
> for the club, one-to-one hours and the sports school watches her play exactly like a neglected
> girl.

And his ask: «давай подумаем как малой кровью можно починить? у нас вроде есть формула для рассчета
кто победил, почему бы нам ее не использовать здесь тоже? Или у нас нет характеристик у детей?»

⭐ **The children DO have attributes and the match engine IS the real one.** `playLocalOpen` has
handed the pool to the shipped `runTournament` since phase 3, and the eight opponents carry five
attributes each. The only thing missing was HER: `prologueEntrant` drew a build and stopped.

### 1a. Why phase 11 refused, and why the refusal does not survive contact with the arithmetic

Phase 11 wrote down two reasons, and both were real:

1. `engine/childhood.ts`'s importer set was pinned as exactly `['engine/world.ts']`, so the pool
   could not reach `childhoodArrival`; and
2. a partial walk **would not have meant what it said even if it had been reachable** – it «would
   read as far below median simply for being short».

⭐⭐ **The second reason is a bug report, not an argument, and it names the line.** `childhoodWalk`
computed

    level = swingPoints x (quality - qMedian) / (qDevoted - qMedian)

and folded **both** anchors over all nine years whatever it was handed. Feed it five lived years and
the numerator is a five-year sum measured against a nine-year median – so the fault was in the
DENOMINATOR, and it made every short childhood read as a poor one. Measured, before the fix:

| years lived | age | neglected | median | devoted |
| --- | --- | --- | --- | --- |
| 1 | 5 | -4.08 | -4.02 | -3.94 |
| 5 | 9 | -3.49 | -2.68 | **-1.81** |
| 6 | 10 | -3.24 | -2.13 | **-0.94** |
| 9 | 13 | -2.29 | 0.00 | +2.40 |

Five years of the best decisions a parent can make read **-1.81** on a swing of 2.40. That is the
«below median for being short» phase 11 named, and it is the whole of what phase 12 repairs.

---

## 2. The fix as shipped – one anchor, matched to the years lived

```
level(lived) = swingPoints x (quality_so_far - qMedian_SO_FAR) / (qDevoted_FULL - qMedian_FULL)
```

`src/engine/childhood.ts`, `childhoodWalk`:

```ts
const median = medianChildhood()
const lived = new Set(years.map((y) => y.age))
const qMedianSoFar = foldYears(median.filter((y) => lived.has(y.age))).quality
const qMedianFull = foldYears(median).quality
const qDevotedFull = foldYears(devotedChildhood()).quality
const level = CHILDHOOD.swingPoints * ((quality - qMedianSoFar) / (qDevotedFull - qMedianFull))
```

Three things follow, and each answers one of phase 11's objections:

- **The NUMERATOR compares like with like.** «How far off ordinary are the years she has actually
  lived?» is a question about those years, so the median it is measured against is a sum over the
  same ages. An ordinary childhood is now exactly zero at every length, which is what «matched»
  means; before the fix it was zero at exactly one length out of nine.
- **The DENOMINATOR stays the full childhood, deliberately.** It is the unit the dial is written in –
  `swingPoints` is «what nine years of the best decisions a parent can make are worth» – so dividing
  by a six-year span would re-scale a ten-year-old up to the full swing and the years would stop
  showing at all.
- ⚠ **It is the same function with matched anchors, not a second strength model.** `foldYears` is
  still the one loop everything goes through. Phase 11's duplication objection was to a second model
  in `src/prologue`; this is the first one, answering a shorter question.

### 2a. What reads it

| where | what changed |
| --- | --- |
| `src/prologue/run.ts` | new `yearsLivedBy(run, age)` – `yearsSoFar` cut at the weekend's own age |
| `src/prologue/pool.ts` | `prologueEntrant(seed, id, name, age, years?)` applies `childhoodArrival` |
| `src/components/ChildhoodPrologue.vue` | `kidAt` passes `yearsLivedBy(run, age)` |
| `tests/childhood.test.ts` | the importer set is now exactly two names, and the tick-path claim is asserted directly |

⚠ **`yearsLivedBy` exists because `yearsSoFar` is off by a year, and the off-by-one is the
thirteenth.** That year is `sameAsLastYear` – it is the twelfth again – so the moment the twelfth
card is answered, `yearAt(13)` starts returning a year and `yearsSoFar` reports NINE. A weekend at
twelve would then be played by a girl who has already lived the year after it, and the gradient
would jump from seven years to nine and then stand still.

⚠ **The importer pin was widened from one name to two, and what it buys is unchanged.** It was never
a claim about the count; it is «nothing an in-game week runs». `world.ts` reaches the module from
`createWorld`, which `tickWeek` never calls; `prologue/pool.ts` is walked by two components before a
world exists, and `tests/childhood.test.ts` now also asserts mechanically that no file in the four
framework-free zones imports `src/prologue` at all. `development.ts` is untouched, so the frozen
capture (41550 draws / `e6b0c709`) and every career hash cannot move.

---

## 3. Predicted vs measured

| # | predicted | measured | verdict |
| --- | --- | --- | --- |
| 1 | a devoted childhood reads about **half** the swing at ten and the **full** swing at fourteen | +1.18 of 2.40 at six years lived (49%); exactly 2.40 at nine | ✅ |
| 2 | the full-childhood arrival is **unchanged**, or the balance pass stops being true | byte-identical to the `prologue/p11-tournaments` capture on 4 seeds x 3 roads, and `level` to twelve places | ✅ |
| 3 | the gap **grows with age** – small at ten, visible at thirteen | formula 0.52 -> 2.54; realised, after the band clamp, **0.49 -> 2.38** | ✅ |
| 4 | ⚠ RISK: her build may sit systematically below a field drawn from the fourteen-year-old band, and a ten-year-old's tournament becomes a guaranteed first-round exit | it does not – §4 | ✅ refuted |
| 5 | the two roads differ in her favour, and the difference grows | title 11.0% -> 12.0% at ten (+1.0pp), 9.1% -> 13.9% at thirteen (+4.8pp) | ✅ |

⭐ **The one thing that was NOT predicted, and it is worth writing down.** The roads the card table
can actually produce are far milder than the model's own extremes at ten and converge on them by
thirteen – 0.52 of a possible 2.30 at ten, 2.54 of 4.69 at thirteen. The reason is the table, not
the arithmetic: **by the weekend at ten the player has made only three decisions** (the cards at 8, 9
and 10), and the four before them offer no choice at all. So «the gap is small at ten» is true twice
over, and the second reason is the stronger one.

### 3a. The level, by how many years she has lived

The engine's own three reference childhoods, before -> after:

| years | age | neglected | median | devoted |
| --- | --- | --- | --- | --- |
| 5 | 9 | -3.49 -> -0.81 | -2.68 -> 0.00 | -1.81 -> **+0.87** |
| 6 | 10 | -3.24 -> -1.12 | -2.13 -> 0.00 | -0.94 -> **+1.18** |
| 7 | 11 | -2.96 -> -1.46 | -1.50 -> 0.00 | +0.05 -> +1.55 |
| 8 | 12 | -2.64 -> -1.85 | -0.79 -> 0.00 | +1.16 -> +1.95 |
| 9 | 13 | **-2.29 -> -2.29** | **0.00 -> 0.00** | **+2.40 -> +2.40** |

The last row is the proof of prediction 2 in one line: at nine years lived, before and after are the
same number.

### 3b. Her build at each weekend, on the two roads the cards can produce

Mean of the five attributes, 20000 seeds, the same born girl on both roads:

| age | born | light road | carried road | realised gap | (formula gap) |
| --- | --- | --- | --- | --- | --- |
| 10 | 48.42 | 48.11 | 48.61 | **0.49** | 0.52 |
| 11 | 48.42 | 47.98 | 48.88 | 0.90 | 0.95 |
| 12 | 48.42 | 47.64 | 49.22 | 1.58 | 1.66 |
| 13 | 48.42 | 47.22 | 49.60 | **2.38** | 2.54 |

The realised gap is smaller than the formula's because `childhoodArrival` clamps her to
`STARTING_SKILL_BAND` – a girl already born at the top of an axis cannot be raised past it. That is
the acceptance criterion made structural, not a loss.

---

## 4. ⚠⚠ The control the owner asked for by name

> «проконтролируй "восемь соперниц берутся из полосы четырнадцатилетних, то есть они «сильные для
> десяти»" вот это пожалуйста»

The eight opponents are drawn from `STARTING_SKILL_BAND`, which is the **fourteen-year-old** band.
Phase 3 justified that: `basePServe` reads only the DIFFERENCE between two players, so the absolute
level cancels. ⚠ **That argument holds only while she is drawn from the same band** – and after phase
12 she is not a bare draw from it any more.

### 4a. Her finish distribution, every age, both roads

20000 seeds a cell. `final` = she lost the final, `semi` = she lost the semi-final, `R1exit` = she
lost her first match. A random one of eight would score title 12.5% and R1exit 50.0%.

| age | road | title | final | semi | R1exit | mean wins |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | neglected | 11.0% | 11.3% | 24.9% | 52.8% | 0.80 |
| 10 | devoted | 12.0% | 11.7% | 24.9% | 51.4% | 0.84 |
| 11 | neglected | 10.6% | 11.8% | 25.2% | 52.4% | 0.81 |
| 11 | devoted | 12.3% | 12.2% | 25.0% | 50.5% | 0.86 |
| 12 | neglected | 10.0% | 11.4% | 25.0% | 53.6% | 0.78 |
| 12 | devoted | 13.4% | 12.4% | 25.0% | 49.1% | 0.90 |
| 13 | neglected | 9.1% | 10.8% | 25.4% | 54.7% | 0.74 |
| 13 | devoted | 13.9% | 12.6% | 25.5% | 48.0% | 0.92 |

**No age is degenerate.** The R1 exit sits between 48.0% and 54.7% in all eight cells and the title
between 9.1% and 13.9%: she is never close to always losing her first match at ten, and never close
to always winning at thirteen. The same table as one number – the share of weekends she wins at
least one match:

| age | neglected | devoted | swing |
| --- | --- | --- | --- |
| 10 | 47.2% | 48.6% | **+1.4pp** |
| 11 | 47.6% | 49.5% | +1.9pp |
| 12 | 46.4% | 50.9% | +4.5pp |
| 13 | 45.3% | 52.0% | **+6.6pp** |

The distributions differ **in her favour** on every row, and the difference grows with age by a
factor of nearly five between ten and thirteen. That is the prologue revealing an upbringing
gradually rather than in a jump.

### 4b. So: does the field need scaling for her age? **No, and here are the numbers**

| age | road | her mean | the eight | the seven who make the cut | her rank in the draw of 8 |
| --- | --- | --- | --- | --- | --- |
| 10 | neglected | 48.11 | 48.40 | 48.92 | 5.11 |
| 10 | devoted | 48.61 | 48.40 | 48.92 | 4.67 |
| 13 | neglected | **47.22** | 48.40 | 48.92 | **5.85** |
| 13 | devoted | 49.60 | 48.40 | 48.92 | 3.88 |

Her BORN mean is 48.42 against the pool's 48.40 – identical, because she is drawn from the same band
by the same `pickInt`, which is exactly what phase 3 relied on. What the childhood adds is at most
±1.2 by thirteen, and the worst cell in the whole table (a neglected road at thirteen) leaves her
1.18 under the field and **5.85th of eight** – mid-field, not out of it. A neutral entrant would rank
4.5.

⭐ **The reason the answer is «no» is structural rather than lucky.** The childhood moves her by up
to 2.4 points; the band she and the eight are drawn from is 18 to 20 points wide on every axis, so
one draw's own spread dominates a full childhood's swing. Retuning `STARTING_SKILL_BAND` – which the
whole game draws from – would be an enormous change bought to fix a problem the measurement says
does not exist.

---

## 5. What this phase did NOT do

- **`potential` is untouched.** Nothing here imports `rollPotential`, and `createWorld` still rolls
  the ceiling off the BIRTH build before the arrival exists. The build spec's §4 rule stands.
- **No copy, no card, no screen control changed.** The rhythm, the asks, the result faces and the
  handover are phase 11's, unaltered.
- **`SAVE_SCHEMA_VERSION` stays 69.** No field is added, nothing is persisted, and no migration is
  owed: a Local Open is still rebuilt from `(seed, age, index)` and thrown away.
- **The shape channel still scales with the years lived and is NOT re-anchored.** It has no median to
  match: `shape` is already relative (`mass[k] - massMean`) and sums to zero, so a short childhood
  simply has less of it. That is honest – fewer years of one-wing focus is less redistribution – and
  a second anchor there would be a change nobody has asked for.
- **The two Local Opens a year `LOCAL_POOL.maxPerYear` still permits are unreached.** Today's table
  asks once a year, so a yes buys one weekend (phase 11's ruling).
