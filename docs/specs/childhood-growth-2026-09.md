---
type: spec
status: draft
area: simulation-and-balance
canonical: false
last-reviewed: 2026-09-01
---

# The childhood, 5 → 14 – phase 1 of the prologue (01.09.2026)

Phase 1 of `childhood-prologue-build-2026-09.md` §7: **the growth model below 13, and it is the gate
on everything else.** Nothing else in that document is built here – no cards, no screens, no
tournament pool, no handover. Those are phases 2–5 and every one of them was blocked on this number.

`npm run bench:childhood` · `tests/childhood.test.ts` · `src/engine/childhood.ts`

---

## 1. The control, reproduced before anything was written

The build spec's §1a, re-measured on this branch by `bench:childhood` part A:

    age              6       8      10      12      13      14      16      18
    ageFactor  0.00620 0.00620 0.00620 0.00620 0.00620 0.00558 0.00434 0.00310

    prologue 6 -> 14    2.56  over 416 weeks
    prologue 5 -> 14    2.89  over 468 weeks     <- his ruling is 5, so the real number is worse
    the game 14 -> 18   0.90  over 208 weeks
    the game 14 -> 23   1.43  over 468 weeks

    6->14 = 2.84x the 14->18 window, 180% of 14->23
    5->14 = 3.19x the 14->18 window, 203% of 14->23

⭐ **AND THE SAME BLOW-OUT MADE PHYSICAL, which the spec did not have.** 2000 careers walked from
age 5 through the real `growWeek` on the CHEAPEST week the engine can describe – balanced plan, no
coach, no matches, the least a prologue could possibly grant:

| | |
| --- | --- |
| headroom consumed before week 0 | **91.8%** |
| her mean attribute at fourteen | 62.11 |
| a fresh fourteen-year-old today | 48.45 |
| what the prologue would hand her | **+13.66 points of every attribute** |

She would arrive having eaten nine tenths of the distance to her own ceiling, more than five
`STARTING_SKILL_BAND` widths above where the game expects her, on the laziest childhood available.
There is no tuning of `growWeek` that survives this: the clamp is the model, not a parameter.

---

## 2. What was built, and where it lives

**`src/engine/childhood.ts` – a leaf module beside `development.ts`, not a branch inside it.**
Four reasons, and only the first is about design:

1. **It is a different process, which is the design.** The 30.07 note: «"Development" at seven is not
   the same thing it is at seventeen: it is coordination, habit and whether she likes it, not
   headroom against a ceiling.» Nothing in the module reads `potential`; there is no rate, no
   headroom, and no week.
2. **Unreachability becomes mechanical.** A branch inside `growWeek` is reachable by any caller that
   hands it an `ageYears` under 13, and `ageYears` is computed from world state. A module that
   nothing on the tick path imports cannot be reached by an ordinary in-game week at all – and
   `tests/childhood.test.ts` pins the importer set as **empty**, so phase 1 wires nothing into the
   app. Phase 4 moves that expectation to exactly `['engine/world.ts']`, which is a one-line reviewed
   change rather than a silent widening.
3. **`development.ts` is not edited**, so the frozen capture and every career hash cannot move. Not
   "were checked and did not move" – cannot. See §6.
4. **`growthStart = 13` keeps meaning what it says.** Dragging it down to 5 is exactly the shape that
   produces §1, and a reader who found a 5 there would have no way to know that. The control above is
   pinned as a test for the same reason: that repair now fails loudly.

---

## 3. The model – three terms, and the spec named all three

For each of the nine years (5…13), from `{ age, practice, teaching, focus }`:

| term | what it is | why it is not a curve |
| --- | --- | --- |
| **coordination** | `min(practice, appetiteAt(age)) / appetiteAt(age)` | it saturates at what a CHILD THAT AGE can absorb. The cap is her capacity this year; nothing here knows her ceiling exists |
| **habit** | what she carried in from the years before, an EWMA at `habitCarry` | a light year at nine is still costing her at twelve, which is the consequence the prologue exists to make legible |
| **joy** | `1 − strainCost · burn`, where `burn` accumulates practice past her appetite and decays at `burnCarry` | pushing a six-year-old does not merely fail to help. It costs, and it keeps costing |

`quality = joy · (0.6 · coordination · taught + 0.4 · habit)`, weighted across the nine years by
`weightAt(age)` – **which IS `appetiteAt` normalised, so there is no second table to drift.** A year
is worth what a child that age can take, and that reproduces §3's shape (three quiet years while she
is small, the real years from eight) rather than asserting it.

Two output channels, deliberately separate:

- **level** – points added to every attribute, normalised so a **median childhood is exactly 0** and
  a **devoted one is exactly `swingPoints`**.
- **shape** – points moved BETWEEN attributes, summing to zero. Driven by the year's `focus` through
  `aimWeights` / `SESSION_AIM`, the engine's own map from sessions to skills, so there is no second
  map from activities to attributes either. This is where phase 4 will read `playStyle`.

**`swingPoints = SKILL_POINTS_PER_YEAR` (2.4), derived and not picked.** That constant is the game's
own measured price of a junior year. So nine years of the best decisions a parent can make are worth
**one extra year of junior development**, against a control that grants 2.84 of the whole 14→18
window. `shapeSwingPoints` is half a year.

### 3a. The grinder must lose, and this is where that is enforced

knock.ts's standing rule is that a branch which always ends better is not a decision. Maximum
practice at every age from five is the branch a player reaches for first. Because `practice` is
ABSOLUTE and `appetiteAt` rises with age, that branch buys strain rather than progress in the early
years and the joy term carries the bill forward. Measured: it lands **below a median childhood**.

---

## 4. Predicted vs measured (invariant 5)

`npm run bench:childhood`, 20,000 seeds per row, mean attribute at fourteen after `withHeadStart`.

| claim | predicted | measured |
| --- | --- | --- |
| a median childhood is a no-op | +0.00 | **+0.000**, and the whole distribution is byte-identical to today's (min 40.10 / p05 44.30 / p50 48.50 / p95 52.70 / max 57.30) |
| a devoted childhood | +2.40 | **+2.188** – the band guard shaves 9% |
| a neglected childhood | (unanchored) | **−2.093** |
| ⚠ the grinder | below devoted | **−0.825, i.e. below MEDIAN** – it loses to doing nothing special |
| a lopsided childhood moves one wing | +1.20 / −0.30 | rally: groundstrokes **+0.98**, the other four **−0.22…−0.26**; serve: serve **+0.38** and ret **+0.38** (the block is two skills), the rest −0.22 |
| a realistic mixed path | – | **+0.838** |

### 4a. ⭐⭐ The acceptance criterion: both distributions, and the overlap

    MEAN ATTRIBUTE AT FOURTEEN (20000 seeds each)
                min     p05     p50     p95     max    mean
    TODAY     40.10   44.30   48.50   52.70   57.30   48.50
    neglected 39.10   42.41   46.41   50.47   55.01   46.40
    median    40.10   44.30   48.50   52.70   57.30   48.50
    devoted   42.50   46.62   50.70   54.74   57.90   50.68
    grinder   39.58   43.43   47.63   51.83   56.43   47.67
    mixed     40.99   45.19   49.39   53.59   57.77   49.33

**Containment is structural.** `childhoodArrival` clamps into `STARTING_SKILL_BAND` – the exact range
`startingSkills` draws from – so the SET of fourteen-year-olds a prologue can hand over is the same
set, not an overlapping one. Per attribute, over every seed and every path:

    serve         today [40.10, 58.10]   prologue [40.10, 58.10]   INSIDE
    ret           today [40.10, 58.10]   prologue [40.10, 58.10]   INSIDE
    composure     today [35.10, 55.10]   prologue [35.10, 55.10]   INSIDE
    stamina       today [40.10, 60.10]   prologue [40.10, 60.10]   INSIDE
    groundstrokes today [40.10, 58.10]   prologue [40.10, 58.10]   INSIDE

⚠ **AND THE SUPPORT IS THE RIGHT COMPARISON, NOT THE OBSERVED MINIMUM.** `neglected` reaches a mean of
39.10, below today's observed 40.10 – and 39.10 IS in today's support: it needs all five attributes
drawn at the bottom of their bands at once, 1 in 3.0M, which 20,000 seeds never shows. Comparing
observed minima would have called an in-band arrival an escape.

**And the overlap, since containment alone is a property of the clamp:**

| path | inside today's central 90% | inside today's observed range |
| --- | --- | --- |
| neglected | 79.3% | 99.8% |
| median | 90.4% | 100.0% |
| devoted | 78.6% | 99.9% |
| grinder | 88.0% | 100.0% |
| mixed | 88.1% | 100.0% |

⚠⚠ **AND THE GUARD MUST NOT BE THE MECHANISM, which is a separate claim and has its own test.** The
band clamp cannot fail however large the dial gets, so "she is inside the band" on its own proves
only that the clamp is applied. What makes it honest is the rate at which it binds: **0.0% on a
median childhood, 6.0% on the realistic mixed path, 15.1–16.2% at the extremes.** A devoted childhood
still delivers 91% of its nominal 2.4 points. `tests/childhood.test.ts` asserts both bounds, and
`swingPoints = 12` reddens it.

⚠ **A measurement bug was caught and is recorded rather than quietly fixed.** The first overlap
metric binned both distributions at 0.1 points and reported **the grinder at 0.0% overlap with
today** – while its range, [39.58, 56.43], covers almost the whole of today's [40.10, 57.30]. A mean
of five integers lives on a 0.2 lattice, and a path whose level is not a multiple of 0.2 shifts its
lattice off today's, so the bins never collided: the number was measuring lattice alignment. Replaced
with the lattice-free quantile membership above.

---

## 5. Invariant 2 – the RNG answer is that there is no RNG

**No draw of any kind, and the module never sees a seed.** Not a purpose-scoped sub-stream – none.

1. **Every source of spread the arrival needs is already drawn.** `startingSkills` (`seed:kid`) gives
   her the build and `rollPotential` (`seed:potential`) her ceiling. The childhood's job is to move
   her inside a band that is already random, not to add a third source of noise.
2. **His own ruling forbids the alternative in spirit.** Build spec §2.5: the age-12 fork is DERIVED
   from what the player did, because there are no dice in a derived reading and the trap he named –
   «на новом заходе она точно должна хотеть» – cannot arise if there is nothing to roll badly. A
   childhood that rolls its own luck re-opens exactly that trap one layer down.
3. **It is the strongest possible answer to the capture requirement.** A function that takes no seed
   and imports no generator cannot move a stream by construction.

Pinned in `tests/childhood.test.ts`: the module's code contains no `rngFromSeed`, no `Math.random`,
no `pickInt`, no import of `./rng` and no `seed:` parameter. ⚠ The pin reads the CODE, not the prose –
the module's header names `rollPotential` and `seed:kid` precisely in order to explain why it touches
neither, and a pin over the raw file would have asked the file to stop explaining itself.

---

## 6. `potential` may not move, and the frozen capture may not move

**`potential`.** Build spec §4, and the same rule the coach spec's §6 and task 55 keep: a timing or
effort effect must never become a talent effect. The module never imports `rollPotential`, never
takes a ceiling and never returns one; `childhoodArrival` returns exactly the five `SKILL_KEYS` and
nothing else. When phase 4 wires it in, `createWorld` must keep feeding `rollPotential` the BIRTH
build – the identical argument world.ts already makes for the relative-age head start.

**The frozen capture (41550 / `e6b0c709`) and every career hash.** `src/engine/childhood.ts` is a NEW
file that no file in `src/` imports. No existing engine module was edited by this branch – the whole
`src/` diff is one added file – so no stream's draw count, key or order can have changed. Verified
rather than argued: the full `npm run check` (which runs `tests/condition.test.ts`, holder of the
capture, plus every other hash pin), `npm run test:e2e` and `npm run test:sim` all green. **Nothing
moved, and there was no pin to re-pin.**

**Schema: no move.** Phase 1 persists nothing. `SAVE_SCHEMA_VERSION` is untouched, no migration was
added and no fixture was needed. The arrival is post-draw arithmetic at `createWorld` time – exactly
the shipped `relativeAgeHeadStart` pattern – so phase 4 does not need one either.

---

## 7. What phase 1 deliberately did NOT do

- **No cards, no screen, no `.vue` file touched.** Phase 2.
- **No tournament pool, no handover, no tour repair.** Phases 3–5.
- **No wiring.** `createWorld` does not call this; the importer set is pinned empty. The prologue
  cannot be played, because there is nothing to play yet – there is a model that can be measured.
- **No `growthStart` change, no `ageCurve` change, no `ECONOMY` change at all.**
- **No motivation number, no morale state, no new save field.** The 30.07 note's §6 proposes one
  durable number; the build spec's §2.5 replaces it with a derived reading and its §7 names the
  motivation system as NOT IN v1 and his to rule on.
- **No presentational walk.** `childhoodWalk` returns the per-year arithmetic (coordination, habit,
  joy, quality, weight) but does NOT claim what a seven-year-old's serve number is on screen. That is
  a design question the spec has not answered, and inventing a constant for it here would have been
  phase 2 arriving early through the back door.

## 8. The two dials the owner may want to move

Both are one line, both are measured above, and neither needs new code:

- **`CHILDHOOD.swingPoints` (2.4)** – how much the nine years are worth. Currently one junior year;
  best-to-worst is 4.3 points, about half of what 14→18 grants. Raising it raises the guard's bite
  rate, which the bench prints.
- **`CHILDHOOD.shapeSwingPoints` (1.2)** – how lopsided a specialised childhood can make her.

⚠ The three reference childhoods (`neglectedChildhood` / `medianChildhood` / `devotedChildhood`) are
NOT fixtures: two of them are the anchors the level is normalised against, so editing one is a
balance change and belongs back in this document with a bench run.

---

## 9. Round 40 #6, measured – «Вариант B: compound, not sum», and NOTHING MOVED

Owner, 08.09: «по п. 2 давай Вариант B попробуем» – the childhood's choices should COMPOUND rather
than merely add, «so that the club year, the private hour and the sports school reinforce one
another: three years of private coaching after a club year are worth more than the three years
apart». `tools/r40-childhood-compounding.ts` (32 reachable runs x 4,000 seeds) and
`tools/r40-childhood-career-blast.ts` (careers walked to thirty). **No dial moved, and this section is
why.** ⚠ The item's own pointer was rotted: §8c is in `childhood-prologue-build-2026-09.md`, not here.

### 9a. The channel exists, it carries, and it is LINEAR – which is the whole answer

`foldYears` already has the channel the item is about: `carry` survives between years and 40% of a
year's quality is that accumulated habit. So the first thing to establish is not whether it is there
but what it does. It **carries a year forward; it does not multiply two years together**:

| claim | measured |
| --- | --- |
| the model's one nonlinearity is the strain term (`joy = 1 − strainCost·burn`) | **joy is exactly 1 on every year of all 32 reachable runs** – no arm of any card sells more practice than a child that age can take, so the fold is linear over the whole shipped table |
| every road is its own single-decision deltas added up | **worst residual 2.15e-15 points** over 32 masks (the twelfth held to one face) |
| ...over the shipped table, where the twelfth's face is derived | 0.769 points – ⚠ **and that is the FORK, not compounding**: which face a run meets is derived from years 5..11 and the two faces sell different years (tired on 22 of the 32 runs, wants-more on 10) |

⭐ **So «three years of private coaching after a club year» are worth exactly «three years of private
coaching» plus «a club year», and no setting of `coordinationShare` or `habitCarry` can change that.**
Compounding is not a strength this model has at a low setting; it is a term the arithmetic does not
contain. Building it would be a NEW mechanism – see 9e, which names it rather than making it.

⚠ **But the channel is not weak, and that matters for what follows.** The share of a decision that is
paid in the years AFTER it, closed-form and checked against `childhoodWalk().quality` to 1e-16:

    echo, as a share of what the decision is worth          age 8   age 9  age 10  age 11  age 12
    as shipped (coordinationShare 0.6, habitCarry 0.6)      38.9%   32.6%   42.8%   28.8%   12.8%

The eighth year is over a third paid later; the twelfth is an eighth, because there is almost nowhere
left for it to echo into.

### 9b. The consistency premium is zero – the spread is POSITIONAL

Every run grouped by how many dear arms it took (levels, pre-clamp):

    k dear   runs      min      max     span     mean
       0        1   -1.284   -1.284    0.000   -1.284
       1        5   -1.205   -0.354    0.851   -0.865
       2       10   -0.938    0.168    1.106   -0.445
       3       10   -0.007    0.572    0.579    0.282
       4        5    0.652    1.179    0.527    0.904
       5        1    1.259    1.259    0.000    1.259

The spread inside a count is real – and it is entirely WHICH years were dear, not whether they were
adjacent. Nine synthetic years, one multiset of five dear years arranged three ways: **late block
+0.743 · alternating +0.477 · early block +0.052**, and the difference is reproduced exactly by
adding up the years that moved (no interaction term).

### 9c. The sweep, and the finding that decides the item

Both dials, 4,000 seeds, the 32 reachable runs. ⚠ The two anchors are **normalisation-invariant**: a
median childhood reads exactly 0.000 and a devoted one exactly 2.400 at every one of the 30 settings,
because `childhoodWalk` divides by the two references themselves. No candidate was ever disqualified
by the anchor, so the anchor is not the constraint here – the span is.

| coordinationShare | habitCarry | card span (points) | model span | cards reach | neglected level |
| --- | --- | --- | --- | --- | --- |
| 0.40 | 0.75 | **2.170** | 4.367 | **49.7%** | −2.391 |
| 0.40 | 0.60 | 2.230 | 4.392 | 50.8% | −2.423 |
| 0.50 | 0.60 | 2.308 | 4.333 | 53.3% | −2.351 |
| **0.60** | **0.60** | **2.383** | **4.282** | **55.7%** | −2.285 · **SHIPPED** |
| 0.70 | 0.60 | 2.459 | 4.231 | 58.1% | −2.226 |
| 0.80 | 0.60 | 2.515 | 4.180 | 60.2% | −2.171 |
| 1.00 | any | 2.632 | 4.095 | 64.3% | −2.074 · the habit switched off entirely |

⭐⭐ **THE DIRECTION THE ITEM ASKS FOR MAKES THE CARDS REACH LESS.** Strengthening the habit channel –
a lower `coordinationShare` – takes the table from 55.7% of the model down to 49.7%. The reason is
mechanical and was checked rather than told: **the years the habit carries include the three the
player never chooses.** The share of the whole childhood owned by ages 5, 6 and 7 (their own work plus
their echo, closed-form, reconstruction error 1e-16):

    coordinationShare  0.40    0.60 (shipped)    0.80    1.00
    the unchosen years 28.0%   24.8%             21.5%   18.3%

⚠ And `habitCarry` does not mean what its name suggests at the top of its range: `(1 - habitCarry)` is
what a year folds INTO the habit, so **carry 0.90 WEAKENS the channel** (the eighth year's echo falls
from 38.9% to 23.6%). A dial that reads as «more habit» is two dials pulling opposite ways.

### 9d. The blast radius – and the childhood's span is mostly gone by her peak anyway

`tools/r40-childhood-career-blast.ts`: the cheapest and dearest of the 32 runs, walked as real
careers through `openCareer`/`stepCareerWeek` to age thirty, **30 seeds per cell, both arms on the
same seeds** so the difference is paired and carries no seed noise. Arm B is the best candidate the
sweep offers (`coordinationShare` 0.8).

| | at 14 | at 18 | at peak |
| --- | --- | --- | --- |
| **the span a player feels, A (shipped)** | **2.386** | **0.842** | **0.105** |
| the span a player feels, B (0.8) | 2.516 | 0.855 | 0.107 |
| paired B − A, the dearest road | **+0.093 ± 0.003** | −0.002 ± 0.018 | −0.005 ± 0.008 |
| paired B − A, the cheapest road | **−0.037 ± 0.001** | −0.015 ± 0.005 | −0.007 ± 0.004 |

⭐⭐ **THE ARRIVAL SPAN DOES NOT SURVIVE THE CAREER: 2.39 points at fourteen is 0.84 at eighteen and
0.11 at her peak – 96% of it closed by `growWeek`'s own headroom term** (a girl who arrives higher has
less room and grows more slowly). And the candidate's effect, which is 30 standard errors wide at
fourteen, is **inside the noise at eighteen and at her peak**: it buys +0.13 points of span on the
handover screen and nothing a career can feel. ⚠ `tests/prologue-cards.test.ts` carries an older
reading of the same fact – «the game's own growth closes 71% of an arrival gap by her peak (measured
02.09)»; this walk says 96%, and both say the same thing about buying width.

### 9e. What was NOT done, and what is his to rule on

- **Nothing in `src/` was touched.** No dial moved, `swingPoints` was never a candidate (it is derived
  from the game's own price of a junior year and moving it re-prices the childhood against the whole
  career), and no card's arms were widened – that is §8c's finding 1 and still the owner's.
- ⚠ **The item's premise has rotted twice over.** §8c says the cards reach 44% of the model; the
  balance pass already took them to ~56% and this measurement reads **55.7%**, against a structural
  ceiling near 58–64% (`childhood-prologue-balance-2026-09.md` §2 – the `STARTING_SKILL_BAND` clamp
  pins the best run's arrival whatever the table does).
- ⭐ **THE ONE-LINE SHAPE THAT WOULD ACTUALLY COMPOUND, named and not made.** Make the habit MULTIPLY
  the year instead of blending with it – `q = joy · (share·coordination·taught + (1−share)·habit)`
  becoming `q = joy · coordination · taught · (1 + k·habit)`. Measured as a mutation it produces a
  real interaction (the worst road beats its own parts by 0.178 points) – and it is a **model change,
  not a dial**: it re-prices every childhood, moves the neglected anchor, and re-freezes every
  prologue-born career. It is his call, and it should be taken with 9d in front of it, because
  whatever it widens at fourteen is 96% closed by her peak.
- ⚠ **Round 40 #5's corpus carried a flaw that did not change its conclusion.** Its enumeration
  answered the twelfth with a fixed pair of ids from DIFFERENT faces, and `pickAt` returns null for an
  id the drawn face does not carry – so **16 of its 32 rows were seven-year childhoods**. The extremes
  are the same runs either way, so the span is identical (2.383 on both corpora here) and «the 1.87
  has rotted» stands. The figure to quote is **2.38–2.44 depending on the statistic**: 2.383 is the
  mean over seeds of the per-seed span across the 32 reachable runs; #5's 2.44 was the median of a
  corpus with the truncated rows in it.
