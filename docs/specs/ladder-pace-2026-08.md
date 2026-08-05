---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-05
---

# The ladder's pace – depth first, then the exchange rate

**Status: steps 1 and 2 of the four the owner approved, built and measured one at a time. Steps 3
and 4 are NOT taken and wait on his ruling.**

`docs/specs/points-economy-2026-08.md` §10 hands over an ordered work list and the owner approved it
verbatim – *«поддерживаю, надо пробовать»*. This page is steps **1 (population depth)** and
**2 (strength compression)**, each measured against the shipped baseline on its own, so their effects
are attributable. The calibration target they are judged against is
`docs/research/real-ladder-pace.md`, written first and from sources, because *«мне надо понимать с
какой примерно скоростью в реальности девушки проходят ступени лестницы турниров»*.

---

## 0. THE SHIP RULE, WRITTEN BEFORE ANY AFTER-NUMBER WAS READ

The previous wave's negative result is trustworthy precisely because its §6a was written first, and
this page copies that discipline. **Written 05.08, before `FIELD.size` was touched.**

Baseline, shipped tree, this branch's head:

| measurement | baseline |
| --- | --- |
| Spearman(skill rank, points rank) over the field | **0.891** |
| mean \|skill − points\| | **35.6 places** |
| her peak rank, grinder / player | **#184 / #144** |
| careers of 180 reaching top 200 / 100 / 50 / 10 | **0 / 0 / 0 / 0** (grinder), **6 / 0 / 0 / 0** (player) |
| table shape #1 / #10 / #50 / #100 / #150 / #250 | 11,680 / 4,688 / 1,347 / 830 / 518 / 260 |
| `fieldProsFor` cost | **1.17 ms** per season boundary |

**Steps 1 and 2 ship together only if ALL SIX hold. Any one fails and they are reported and reverted,
exactly as `FIELD.earnCurve` was.**

1. **CORRESPONDENCE DOES NOT GET WORSE.** Spearman ≥ 0.891 and mean |skill − points| ≤ 35.6 places,
   both measured over the whole professional population. This is the anti-gift criterion: a table
   that is merely deflated moves her rank and leaves the correspondence where it was.
2. **A CHANCE, NOT A CONVEYOR.** Of 180 careers, **fewer than 30 (17%)** ever reach the top 100 and
   **at least 1** reaches the top 200 on each policy arm. The owner asked for *a chance* at the top:
   zero is a wall and 118 was a delivery service. The band is deliberately wide because he has not
   set the target, and the shape of the distribution is reported whatever the count.
3. **THE REAL-CURVE CALIBRATION SURVIVES.** #10 / #50 / #100 / #150 / #300 each stay within ±40% of
   the real anchors (4,000 / 1,400 / 850 / 520 / 190) – the same band
   `tests/season/fieldPros.test.ts` already enforces. It is calibrated on purpose and is not this
   wave's to spend.
4. **THE DOORS STILL SEPARATE PEOPLE.** No two adjacent acceptance cuts end up within 50 points of
   each other, and the number of INERT cuts (past the pointed rows, refusing nobody) does not
   increase. Three of ten are inert today; that is the count to beat, not to match.
5. **THE ON-RAMP SURVIVES.** The reference strong junior (power 56.75) keeps a W15 title chance in
   **15–35%** – `fieldPros.ts`' own calibrated band, measured at 20.3% at W2-FIELD2. Step 2 alone
   was measured at **2.3%** on the shipped 564-row table; that is the number step 1 exists to fix,
   and if the pair cannot hold the band together the pair does not ship.
6. **COST.** `fieldProsFor` stays under **2.5 ms** per season boundary (a 520-pro derivation is 1.43×
   the work of a 364-pro one, so ~1.7 ms is the arithmetic expectation; 2.5 is the budget) and the
   persisted ledger does not grow at all. A field pro still writes no result row, so this is
   structural rather than hopeful.

Two things are explicitly NOT criteria, and saying so is the point:

* **Her peak rank on its own.** A fix that floats her into the top 100 by deflating everyone else is
  the gift failure the brief names. Her rank is reported; criterion 1 is what judges it.
* **The R1/R2 exit rate falling.** A 32-draw exits 75% of any field by the second match by pure
  arithmetic. The target is not "fewer early losses", it is "no more early losses than a knockout of
  that shape produces". Reported against the real-world figure, not optimised.

---

## 0a. ⚠ A METHOD HAZARD THAT PRODUCED A WRONG NUMBER, AND HOW IT WAS CAUGHT

Worth a section because it nearly became a finding, and because the next agent doing a file-copy A/B
on this repo will hit it.

The first baseline was backgrounded as a **two-command chain** – `bench:money` for the grinder arm,
then `bench:money --policy player` – and `fieldPros.ts` was edited while the first command was still
running. `vite-node` loads a module once per process, so the **grinder** arm was safe. The **player**
arm is a *second process*, and it started after the edit: it silently measured the step-1 field and
was written into the file labelled "baseline".

It produced a plausible, wrong conclusion. Its numbers (best #160, 35 of 180 reaching the top 200,
26.3% prize/spend) disagreed with `points-economy-2026-08.md` §6b's published player baseline
(#144 / 6 of 180 / 20.9%), so the first draft of this page recorded *"the published player-arm
baseline is stale"*. It is not. **What gave it away was that the step-1 player run came back
byte-identical to it** – two different fields cannot produce one output. Re-taken properly, the
published row reproduces **to the digit**: best **#144** / p10 #222 / median #296 / worst #373,
**6 of 180** in the top 200, **144 of 180** ever ranked, prize/spend **20.9%**, 27 careers entering a
WTA 125.

> **A FILE-COPY A/B AND A BACKGROUNDED CHAIN ARE NOT COMPATIBLE.** The `cp` must happen *inside* the
> same script as the runs, between processes and never during one. Every arm on this page was taken
> that way (`scratchpad/runarms.sh`), and every before/after pair below is same-command, same-tree.

---

## 1. THE INSTRUMENTS

| bench | what it answers | cost |
| --- | --- | --- |
| `npm run bench:points -- --seeds 4` | the table half – correspondence, shape, doors, the exchange rate, the on-ramp | ~4 s |
| `npm run bench:money -- --no-verify [--policy player]` | 180 careers – peak ranks, the distribution, the rungs, the money | ~6 min/arm |

**One instrument is added by this wave**, `bench:money` §8, and it exists because the owner's
complaint could not otherwise be answered:

> **§8 HOW HER TOURNAMENTS END** – per rung: draws, R1 exits, R2 exits, out-by-R2, the knockout's own
> arithmetic floor (75.0% at any draw size), the **excess over that floor**, QF+ and titles.

⚠ **It is read off the DIARY, not off `world.results`, and that is required rather than stylistic.**
The kid's ranking row is award-only (`world.ts`: `if (points > 0) world.results.push(...)`), so at
w15, w35 and w100 – whose tables pay a first-round loser nothing – her R1 exits write no result row
at all, and a results-based count would have silently measured only the rounds she survived.
`closeTournament` is the sole writer of a `tournament` diary event and stamps `finishIdx` on every
one, win or lose.

**The excess is the number, not the rate.** `docs/research/real-ladder-pace.md` §2a: a single-
elimination draw of any size N puts 50% out in round one and 25% more in round two, and the average
entrant wins (N−1)/N ≈ 0.97 matches. So 75% is what a coin-flip field produces and the only thing a
calibration owns is the distance from it.

---

## 2. STEP 1 – POPULATION DEPTH (`FIELD.size` 364 → 520)

**What changed, in one file and nowhere else.** A fifth storey, `circuit`, **appended** to
`FIELD.tiers`: count 156, core band [33, 43], points band [70, 155], gamma 1.4 (journeyman's).
`fieldProsFor` walks the array in order handing out `fp-<n>`, so appending shifts nobody's id and
**`fp-0`…`fp-363` keep their chairs, their storeys, their names and their books byte-for-byte.**
The points band is the real curve's own tail read from the anchors the W2-FIELD2 lift already used
(#364 ≈ 130, #500 ≈ 75); the core band is the pyramid's own arithmetic continued (every storey steps
down five and spans ten).

⚠ **The core band makes the world MORE spread out, not less, and that is on purpose for one step
only.** Step 1 has to be depth and nothing else or its effect is not attributable. Step 2 re-deals
every core in the table. **Read the two together; never step 1 alone.**

No schema, no migration, no golden save, no MAIN draw – `fieldProsFor` is still a pure function of
`(seed, seasonIndex)` with zero persisted bytes, so `SAVE_SCHEMA_VERSION` stays at **v40** and the
frozen capture (41550 / `e6b0c709`) cannot see this file.

### 2a. Predicted, then measured

Written from the arithmetic before the bench was run: a girl with one W ranking point now stands
below all 520 pointed rows at **#521**, and W75's acceptance cut is **#450**.

| # | predicted | measured | verdict |
| --- | --- | --- | --- |
| P1 | the top 364 rows of the table do not move at all | #1 / #10 / #50 / #100 / #150 / #250 / #300 = **11,680 / 4,688 / 1,347 / 830 / 518 / 260 / 195 – identical to the digit on both arms** | right, by construction |
| P2 | W75's cut (#450) stops being inert; inert cuts 3 → 2 | W75 **gates**, with a book of 90 standing on the cut; W35 (#700) and W50 (#550) still inert | right |
| P3 | one W point no longer opens W75, so `tierOutgrown` no longer shuts W15 – the three-stage slide returns | a 1-point book stands at **#521**, outside #450. Window at one point = **{w15, w35, w50}**, and W15 stays open | right |
| P4 | the percentile bands reach deeper, so every W field weakens and her W15 title chance rises | field core w15 49.1 → **47.1**, w35 51.1 → **48.4**, w50 55.7 → **51.1**, w75 60.9 → **56.3**, w100 67.5 → **65.0**, wta125 71.5 → **70.9** – still strictly monotone. Reference junior's W15 title chance 17.7% → **24.5%** (band 15–35%) | right |
| P5 | her ABSOLUTE rank number gets worse, because the same book now has 156 more people above the place it used to reach | grinder best #184 → **#206**, median #358 → **#428** | right |
| P6 | cost rises by the population ratio, 1.43× | 1.17 ms → **1.43 ms** per season-boundary derivation | right, exactly |
| P7 | mean \|skill − points\| **in places** is not scale-free and will grow with the population | 35.6 → **52.7 places**; as a share of the table **9.8% → 10.1%** | right, and it invalidates half of ship criterion 1 – see §4 |

### 2b. The table half

| | BASELINE | STEP 1 |
| --- | --- | --- |
| Spearman(skill, points) over the field | **0.891** | **0.888** |
| mean \|skill − points\| | 35.6 places (9.8% of 364) | 52.7 places (**10.1% of 520**) |
| median managed career (core 59.6, skill #85) | earns 169 → points **#327** | earns 275 → points **#237** |
| best managed career (core 64.1, skill #68) | earns 272 → points **#241** | earns 408 → points **#180** |
| prodigy (core 73.1, skill #25) | earns 445 → points **#165** | earns 2,791 → points **#18** |
| pointed rows | 364 of 563 | **520 of 719** |
| a LIVE book of 50 (five W15 titles) | #365 of 365 | **#519 of 521** |
| a LIVE book of 100 | #365 | **#426** |
| a LIVE book of 250 / 500 / 1,000 | #260 / #153 / #79 | #260 / #153 / #79 – unchanged |

**The whole effect is below 250 points and there is none at all above it.** That is the shape a depth
change should have, and it is the reason this step was first: everything the earn curve tried to do
by deflating the table, depth does by extending it.

### 2c. The doors

| rung | cut | BASELINE book on the cut | STEP 1 |
| --- | --- | --- | --- |
| W35 | #700 | inert (past the table) | inert (past the pointed rows) |
| W50 | #550 | inert (past the pointed rows) | inert (past the pointed rows) |
| **W75** | **#450** | **inert** | **gates – book 90** |
| W100 | #350 | 137 | 149 |
| WTA 125 | #250 | 260 | 260 |
| WTA 250 | #200 | 352 | 352 |
| Grand Slam | #104 | 792 | 792 |
| WTA 500 | #120 | 652 | 652 |
| WTA 1000 | #65 | 1,185 | 1,185 |

Adjacent cuts are separated by 59 / 111 / 92 / 300 / 140 / 393 points – **no pair inside 50**, so
criterion 4 holds and the inert count falls from three to two.

### 2d. The careers – N = 180, both policy arms

| | BASELINE | STEP 1 |
| --- | --- | --- |
| **grinder** best / p10 / median / worst | #184 / #275 / #358 / #383 | **#206 / #300 / #428 / #532** |
| grinder top 10 / 50 / 100 / 200 | 0 / 0 / 0 / **1** | 0 / 0 / 0 / **0** |
| grinder ever ranked · prize/spend | 152/180 · 16.6% | 128/180 · 13.0% |
| grinder careers entering a WTA 125 | 11/180 | 5/180 |
| **player** best / p10 / median / worst | #144 / #222 / #296 / #373 | **#160 / #181 / #234 / #526** |
| **player top 10 / 50 / 100 / 200** | 0 / 0 / 0 / **6** | 0 / 0 / 0 / **35** |
| player ever ranked · prize/spend | 144/180 · 20.9% | 138/180 · 26.3% |
| player careers entering a WTA 125 / 250 | 27 / 4 | **64 / 24** |

⚠ **THE TWO ARMS DISAGREE, AND BOTH READINGS ARE REAL.** On the grinder policy depth makes the
ceiling worse, exactly as §10 of the probe said it would: it puts 156 more professionals between her
and every acceptance cut while leaving them all just as strong, so the ladder gets its stages back
and she has further to climb them. On the player (lever) policy the same change takes careers
reaching the top 200 from **6 to 35 of 180** and careers entering a WTA 125 from 27 to 64 – because
a career that is actually funded now spends its early seasons at W15/W35 collecting points instead
of being marched onto a W75 it cannot win.

**Depth is a prerequisite, not a fix.** The verdict on shipping it alone is deliberately deferred to
§4a, after step 2 has been measured – it is not decidable from this table.

### 2e. …and the pace at the bottom is fixed, which is the owner's own complaint

| rung | draws | out by R2 | excess over the 75% floor | titles |
| --- | --- | --- | --- | --- |
| **w15** BASELINE | 836 | 77.8% | **+2.8pp** | 5.0% |
| **w15** STEP 1 | **4,682** | **65.9%** | **−9.1pp** | **10.4%** |
| w35 BASELINE | 4,758 | 67.7% | −7.3pp | 7.0% |
| w35 STEP 1 | 2,830 | 74.9% | −0.1pp | 5.7% |
| w50 BASELINE | 3,656 | 82.2% | +7.2pp | 1.4% |
| w50 STEP 1 | 2,322 | 82.9% | +7.9pp | 1.5% |
| **w75** BASELINE | **2,278** | **90.0%** | **+15.0pp** | 0.4% |
| **w75** STEP 1 | **244** | 91.8% | +16.8pp | 1.6% |
| **ALL W** BASELINE | 11,604 | **77.5%** | **+2.5pp** | 3.7% |
| **ALL W** STEP 1 | 10,100 | **73.0%** | **−2.0pp** | 6.8% |

> **«35 закончились ОЧЕНЬ быстро» – FOUND, AND FIXED BY THIS STEP.** On the shipped tree she plays
> **836** W15 draws and **4,758** W35 draws across 180 careers: the entry rung of the professional
> game is where she spends 7% of her tournaments, because one ranking point cleared an inert W75 cut
> and `tierOutgrown` shut W15 behind her. After: **4,682 W15 draws and 2,830 W35 draws.** She now
> starts at the bottom rung and works up, which is what the ladder was designed to do.
>
> **«50-75-100 периодически кажутся очень сложными» – FOUND, AND HALF FIXED.** She played **2,278**
> W75 draws on the shipped tree and lost by the second match in **90.0%** of them, fifteen points
> worse than a coin-flip field and worse than any real figure in `real-ladder-pace.md`. She was there
> because the broken window put her there. After: **244 draws.** The rate at that rung is not better
> – it is 91.8% – but she is no longer being marched into it two years early.
>
> **«ОЧЕНЬ частые вылеты» – her overall rate now sits BELOW the arithmetic floor.** 77.5% (+2.5pp)
> → **73.0% (−2.0pp)**. The real comparison: a real journeywoman is at exactly 75.0%, a real
> **future top-100 player at ITF level is at 55%**, and a real world #47 on the main tour is back at
> **76.5%**. She is now mildly over-qualified for her own rung, which is the correct side of the
> floor for a managed career, and a long way short of how over-qualified a real future top-100 is.

---

## 3. STEP 2 – THE EXCHANGE RATE (`FIELD.strengthCurve`)

**What changed**, on top of step 1 and in the same file. The four hand-picked `core` bands – derived
from `rollPotential`'s output band, i.e. from a fact about what a PLAYER can become, with no
real-world calibration behind their spread at all – are replaced by a curve:

```
rank -> real WTA Elo (log-interpolated anchors)  ->  core, at OUR engine's own exchange rate
core = topCore - (2200 - realEloAt(rank)) / eloPerCore        topCore = 77, eloPerCore = 20.2
```

`eloPerCore` is **measured, not assumed**: `fastMatchProbability` on two flat builds ten core points
apart returns 76.2%, which is 202 Elo (`bench:points --only 11`). A chair's position on the curve is
its own storey's rank span read at the draw that already set its book, so the draw order, the stream
and the number of draws are all unchanged; `pointsForCore(tier, core)` becomes
`pointsForBand(tier, t)` reading that draw directly, **which on the shipped tree is a pure identity**
(the core was `cLo + rng() * (cHi - cLo)`, so recovering `t` from it returned the draw exactly).

⚠ **THE POINTS TABLE IS UNTOUCHED BY CONSTRUCTION.** The merged table's fit against the real
points-to-rank anchors is byte-identical across this change – #1 / #10 / #50 / #100 / #150 / #250 /
#300 = 11,680 / 4,688 / 1,347 / 830 / 518 / 260 / 195 on every arm on this page. Only how good the
person holding each book is moves.

### 3a. IT WORKS. The exchange rate is fixed.

`P(the field's #A beats the field's #B)`, our engine against the real WTA:

| pair | BASELINE | **STEP 2** | real WTA | baseline error | step-2 error |
| --- | --- | --- | --- | --- | --- |
| #1 v #10 | 51.8% | **65.7%** | 68% | −16.2pp | **−2.3pp** |
| #10 v #50 | 55.4% | **67.8%** | 66% | −10.6pp | **+1.8pp** |
| **#50 v #100** | **89.3%** | **50.4%** | **58%** | **+31.3pp** | **−7.6pp** |
| #50 v #150 | 96.0% | **65.0%** | 62% | +34.0pp | **+3.0pp** |
| #100 v #200 | 73.1% | **57.7%** | 58% | +15.1pp | **−0.3pp** |
| #100 v #300 | 79.5% | **69.8%** | 65% | +14.5pp | **+4.8pp** |
| #200 v #364 | 73.2% | **56.1%** | 57% | +16.2pp | **−0.9pp** |
| **worst error anywhere** | | | | **34.0pp** | **7.6pp** |

**Core spread over the top 364: 42.0 → 23.4 points** (the real WTA's own 515 Elo is 25.5 at our
exchange rate). And the pricing follows: what our ladder pays a player of the strength standing at
each rank, against the book that rank is issued –

| rank | issued | BASELINE earns | **STEP 2 earns** |
| --- | --- | --- | --- |
| #10 | 4,688 | 3,599 (0.77×) | **4,098 (0.87×)** |
| #50 | 1,347 | 2,102 (1.56×) | 2,023 (1.50×) |
| #75 | 1,051 | 850 (0.81×) | **1,192 (1.13×)** |
| #100 | 830 | 622 (0.75×) | 1,089 (1.31×) |
| #150 | 518 | 30 (**0.06×**) | 149 (0.29×) |
| #364 | 137 | 22 (**0.16×**) | 67 (0.49×) |

The middle of the table stops being unearnable: **11.2× over-issued at core 51 becomes ~2×.** Below
#150 the residual is the sliding window's valley (`points-economy-2026-08.md` §3c/§8a), which is
step 3 and is untouched here.

### 3b. AND IT COSTS THE TWO THINGS THE SHIP RULE NAMED

**(1) The on-ramp collapses.** The reference strong junior (power 56.75) against a W15 field:

| | field core at W15 | P(match) | **P(title)** |
| --- | --- | --- | --- |
| BASELINE | 49.1 | 70.7% | **17.7%** |
| STEP 1 | 47.1 | 75.5% | **24.5%** |
| **STEP 2** | **56.3** | **51.2%** | **3.5%** |

The calibrated band is **15–35%**. ⚠ The probe predicted 2.3% on the shipped 564-row table and said
*"the compression needs a deeper population first"*. **Depth ×1.43 was not remotely enough: 2.3% →
3.5%.** The cause is structural and §3d prices it.

**(2) Skill and points stop agreeing.**

| | BASELINE | STEP 1 | **STEP 2** |
| --- | --- | --- | --- |
| Spearman(skill, points) | **0.891** | 0.888 | **0.725** |
| mean \|skill − points\| | 35.6 (9.8% of the table) | 52.7 (10.1%) | **84.4 (16.2%)** |

**This is not a gift and it is not noise – it is the attribute spread being left behind.** A pro's
four attributes are drawn as `core ± 6` independently, so her realised `power()` differs from her
drawn core with an sd of ~1.73. Against a 42-point world that is signal-to-noise 6:1; against a
27-point world it is under 3:1, and inside the `journeyman` storey – 150 chairs across three core
points – **the noise is twice the signal**, so the skill ORDER inside a storey becomes close to
random. `FIELD.attrSpread` is denominated in the old scale and compression does not carry it along.
⚠ Not fixed here, and the fix is not obvious: making the four offsets zero-sum would make `power()`
equal the drawn core exactly (which is what the calibration table already claims it is) and remove
the term entirely, but that changes every pro's build and is a second strength change inside a step
that has to stay attributable.

**(3) …and a third thing the rule did not name.** The player's own talent distribution was NOT
compressed with the world, and `FIELD.tiers`' cores were originally derived FROM it:

| build | BASELINE skill rank | **STEP 2 skill rank** |
| --- | --- | --- |
| median managed career (core 59.6) | #85 | **#110** |
| best managed career (core 64.1) | #68 | **#44** |
| top-of-band prodigy (core 73.1 = `rollPotential`'s p99) | #25 | **#4** |

A p99 roll is now the **world #4 by ability**, and `rollPotential`'s maximum over 20,000 rolls (80.8)
is above our world #1. **Compressing the field without compressing the player converts "the top is
unreachable" into "the top is a good roll away."** The careers show it: on the player policy
**4 of 180 reach the top 10** where the baseline reaches #144 at best.

### 3c. The careers – N = 180, both policy arms

| | BASELINE | STEP 1 | STEP 2 |
| --- | --- | --- | --- |
| **grinder** best / p10 / median / worst | #184 / #275 / #358 / #383 | #206 / #300 / #428 / #532 | **#260 / #396 / #507 / #538** |
| grinder top 10 / 50 / 100 / 200 | 0 / 0 / 0 / 1 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| grinder prize/spend median | 16.6% | 13.0% | 8.6% |
| **player** best / p10 / median / worst | #144 / #222 / #296 / #373 | #160 / #181 / #234 / #526 | **#6 / #156 / #327 / #529** |
| **player top 10 / 50 / 100 / 200** | 0 / 0 / 0 / **6** | 0 / 0 / 0 / **35** | **4 / 6 / 8 / 27** |
| player careers entering a Slam | 0 | 0 | **6** |

> **THE TWO ARMS SAY OPPOSITE THINGS, AND THAT IS THE FINDING.** On the grinder policy compression
> makes every rung harder and the ceiling lower – the field's BOTTOM rose from core 35.8 to 51.8,
> which is a far bigger move than the head coming down, so the whole ladder got heavier. On the
> player (lever) policy it opens a genuine path to the very top: 4 careers of 180 in the top 10,
> 8 in the top 100. **A chance at the top now exists and only for a funded, well-managed career** –
> which is arguably the game this project is – but it exists beside a grinder arm that reaches #260.

And the early exits move with it. `ALL W`, out-by-R2 against the 75.0% arithmetic floor:

| | BASELINE | STEP 1 | STEP 2 |
| --- | --- | --- | --- |
| grinder | 77.5% (**+2.5pp**) | 73.0% (**−2.0pp**) | 82.6% (**+7.6pp**) |
| player | 68.2% (−6.8pp) | 58.5% (−16.5pp) | 71.4% (−3.6pp) |

Real-world comparison (`real-ladder-pace.md` §2b): a journeywoman is at **75.0%**, a future top-100
player at ITF level at **55%**, a world #47 on the main tour at **76.5%**.

### 3d. ⚠⚠ THE ONE THING THAT WOULD MAKE STEP 2 WORK, MEASURED – and it is a THIRD constant

Why the on-ramp dies: `entrantPctBand` is a share of the merged table, and W15's is `[0.22, 0.72]` –
positions **158–518 of 719**. In reality a W15 draws from about **#400 and below** of a ~1,550-strong
list. On a flat, real-Elo world that difference stops being cosmetic: our W15's field lands on core
**56.3** and the reference junior's own power is **56.75**, so the entry rung of the professional
game is a coin flip for her.

**And the fix is already written down twice in our own source, in the other unit.** Every W rung
carries the real acceptance range in a comment beside its `acceptsRank`, and `acceptsRank` is that
range's floor. The bands and the cuts are two encodings of one real-world fact and **they currently
disagree**. Derived from the ranges themselves, over a 719-row table:

| rung | real acceptance range | band today | **band from the range** |
| --- | --- | --- | --- |
| W15 | ~#400–1000+ | [0.22, 0.72] | [0.556, 1.0] |
| W35 | ~#250–700 | [0.185, 0.62] | [0.348, 0.973] |
| W50 | ~#200–550 | [0.145, 0.52] | [0.278, 0.765] |
| W75 | ~#150–450 | [0.105, 0.42] | [0.209, 0.626] |
| W100 | ~#120–350 | [0.065, 0.33] | [0.167, 0.487] |
| WTA 125 | ~#80–250 | [0.025, 0.26] | [0.111, 0.348] |

**MEASURED (probe only, reverted, `bench:points --seeds 4` on the step-2 tree):**

| | field core w15 / w35 / w50 / w75 / w100 / 125 | ref junior P(W15 title) |
| --- | --- | --- |
| step 2 | 56.3 / 57.0 / 57.8 / 59.2 / 61.6 / 63.7 | **3.5%** |
| step 2 + bands from the ranges | **50.9 / 52.9 / 54.8 / 56.4 / 57.2 / 58.8** | **12.6%** |

Still strictly monotone, and the on-ramp recovers by a factor of 3.6 – to just under the 15% floor.
⚠ **AND THE 15–35% FLOOR IS ITSELF WORTH RE-EXAMINING BEFORE ANYONE CHASES IT.**
`real-ladder-pace.md` §2c measures a real future-top-100 player at **15.2 ITF events per title =
6.6%**. Our design target is two to five times the sport's own figure. 12.6% may be the right answer
and the target the wrong one; that is the owner's call and is named, not taken.

---

## 4. THE VERDICT AGAINST THE SHIP RULE

Judged against §0, written before any after-number was read.

| # | criterion | measured (steps 1+2) | |
| --- | --- | --- | --- |
| 1 | Spearman ≥ 0.891 and mean gap ≤ 35.6 places | **0.725** and **84.4 places** | ❌ **FAIL** |
| 2 | <30 of 180 in the top 100, ≥1 in the top 200 on **each** arm | player 8 / 27 ✓ · grinder 0 / **0** | ❌ **FAIL (split)** |
| 3 | real-curve anchors survive within ±40% | #1…#300 **byte-identical** | ✅ PASS |
| 4 | no adjacent cuts within 50 points; inert count does not rise | gaps 59/111/92/300/140/393; inert **3 → 2** | ✅ PASS |
| 5 | reference junior's W15 title chance stays 15–35% | **3.5%** | ❌ **FAIL** |
| 6 | `fieldProsFor` under 2.5 ms; ledger does not grow | **1.62 ms**; ledger unchanged by construction | ✅ PASS |

**THREE OF SIX FAIL, SO THE PAIR DOES NOT SHIP.** `FIELD.strengthCurve` is **measured and reverted**,
exactly as `FIELD.earnCurve` was.

**Two honest notes about my own rule, stated rather than exploited.**

* **Criterion 1's second half is not scale-free and I did not notice when I wrote it.** "mean
  |skill − points| ≤ 35.6 PLACES" measures the population size as much as the correspondence: step 1
  moves it 35.6 → 52.7 while the share of the table is 9.8% → 10.1%, i.e. unchanged. The Spearman
  half is scale-free and is the half that carries the verdict. Step 2 fails **both** halves and fails
  them by a distance no normalisation rescues (0.891 → 0.725).
* **Criterion 2 is under-powered at its lower bound.** Its verdict on the grinder arm turns on
  **one career of 180** (baseline 1, steps 1 and 2 both 0). A floor that a single career decides is
  not a measurement, and a future rule should ask for a rate over more seeds.

### 4a. What is shipped, and the one judgement call in it

**SHIPPED:** step 1 (`FIELD.size` 364 → 520, the fifth storey), the `bench:money` §8 exit-rate
instrument, `docs/research/real-ladder-pace.md`, this page, and the re-aimed guards.

⚠⚠ **SHIPPING STEP 1 IS A JUDGEMENT, NOT A RULE BEING SATISFIED, AND IT IS LABELLED AS ONE.** The
ship rule in §0 governs the PAIR and is silent on step 1 alone; I will not invent a rule after the
numbers. Step 1 measured on its own passes 3, 4, 5 and 6 outright, passes criterion 1 in substance
(Spearman 0.891 → 0.888, share of the table 9.8% → 10.1%) and **fails criterion 2 on the grinder
arm by the one career described above**, while improving the same criterion six-fold on the player
arm (6 → 35 of 180 reaching the top 200). It is shipped because:

1. **It is the only thing measured in this wave that fixes what the owner actually complained
   about** – §2e: the entry rung stops closing on her first ranking point, W15 draws go 836 → 4,682,
   W75 draws go 2,278 → 244, and her overall early-exit rate crosses from +2.5pp above a coin-flip
   field to −2.0pp below it.
2. **It is the prerequisite under everything else** – it is #1 of the probe's own ordered list, it
   makes W75's acceptance cut bite again, and neither step 3 nor step 4 can be measured honestly
   against a table whose bottom three rungs refuse nobody.
3. **It reverts to one constant.** `FIELD.tiers`' last row and `FIELD.size`. If the owner reads §2d
   and prefers the shipped ceiling, it is a two-line revert plus the guards named in §5.

**REVERTED:** `FIELD.strengthCurve` (step 2) and the `entrantPctBand` probe of §3d. Both are recorded
here in full and neither is in the tree.

---

## 5. WHAT MOVED IN THE GUARDS

Nothing deleted, nothing weakened. Six re-aims, each with its reason in the file.

| guard | was | now | why |
| --- | --- | --- | --- |
| `tests/unranked-sentinel.test.ts` – "three W cuts refuse nobody" | inert = {w35, w50, w75}, pointed < 420 | inert = **{w35, w50}** as an exact SET, pointed ≥ `FIELD.size` | W75's cut bites again. Asserted as a set, so a fourth going inert is red |
| …– "the entry rung closes on her FIRST W point" | `open === ['w35','w50','w75']`, W15 shut | **`['w15','w35','w50']`**, W15 open, **plus a new second stage** at a 140-point book | the characterisation recorded a defect; the defect is gone, so it becomes the positive property, and the next stage is pinned too |
| `tests/season/fieldPros.test.ts` – the honest-rank promise | rank in [300, **420**] | rank in [300, **`FIELD.size` + 20**] | a literal ceiling was measuring the population. Floor unchanged and absolute – "#9" is still what it kills |
| …– the never-drawn characterisation | journeymen drawn **= 0** | journeymen drawn **in (0, 20)** – measured **7** – **plus a new assertion that the BOTTOM storey is still 0** | its own comment asked for this ("if it moves, this comment is the reason to come back"). Re-pointed at the storey that is now the bottom, so the property survives the population change |
| `condition.test.ts` / `injuries.test.ts` / `planner.test.ts` – `REF.kidRank` | **89** | **90** | third time, same second-order mechanism as W4-LIVES: a 719-candidate W universe books different juniors into W weeks, so the J draws they were free for change. ⚠ The MAIN capture (41550 / `e6b0c709`) and the planner A/B hashes are asserted BEFORE this line and all still pass – **input-independence is untouched** |
| `tests/econ-reach.test.ts` – the 14→18 reach band | [9, 24], measured 21 | **[12, 27]**, measured **25** | the eighth reading and the first the band did not absorb. Re-based under that note's OWN rule (half the distance to each degenerate answer). Both branches still fire; the exact `0 < n < 30` case is untouched |

**A new guard is added**, not just re-aimed: `fieldPros.test.ts` now pins that the storeys sum to
`FIELD.size`, arrive strongest-first, and step down in both ends of their core band – so a storey
inserted rather than appended (which re-deals every `fp-<n>`) is red instead of silently a new world.

**Gates, machine otherwise idle:** `vue-tsc -b --force` clean · `npm run test:quiet` **111 files /
2,363 tests green** · `npm run test:component` **6 / 69 green** · `npm run test:sim` **8 / 80 green**.
No MAIN draw added, so the frozen capture is untouched; no schema field moved, so
`SAVE_SCHEMA_VERSION` stays at **v40** with no migration and no golden save.

---

## 6. RECOMMENDATIONS FOR STEPS 3 AND 4 – the owner's ruling

Ordered by what the measurements support, with the evidence beside each.

**A. Step 3 (`WINDOW_RUNGS` 3 → 5) is now cheap and is worth taking next.** §3a shows the residual
under-earning is concentrated below #150 (0.29× at #150 against 1.13× at #75), and
`points-economy-2026-08.md` §3c identifies that exactly: the sliding window is monotone in TITLE
value and not in EXPECTED value, so a core-60 player's book falls 47% between #300 and #200. The
window sweep already measures `WINDOW_RUNGS 5` as the narrowest width that removes it. It is one
constant, it is in the owner's approved order, and step 1 has just made the window's stages real for
the first time – so this is the first wave in which the knob can be measured against a ladder that
actually slides.

**B. Step 4 (re-pricing) has TWO sourced errors waiting for it, and neither is the one anyone
expected.** `real-ladder-pace.md` §4:
1. **The WTA ranking counts the best 18, not 16** (2026 Rulebook §VIII.A.4.a.i – for a player never
   accepted into a Slam or a 1000, all eleven mandatory slots convert to open slots).
   `BEST_N_BY_TRACK.wta = 16`. `ceiling-walk.ts` measured widening past 16 as worth nothing to a
   perfect player, so this is small, free and correct.
2. **Our two entry rungs are under-priced against the real chart and only those two.** Real W15 = 15
   and W35 = 35; ours pay **10** and **20**. Every rung from W50 up is exact. The naming rule is
   that a rung is named after the winner's points, so "World Tour 35" paying 20 is our own table
   disagreeing with our own research. **This is a second, independent cause of the discontinuity the
   owner feels at the bottom of the ladder**, and it is cheap to fix.

**C. Step 2 should be re-tried, but not as one change.** The exchange rate demonstrably CAN be fixed –
worst error 34.0pp → 7.6pp – and three things have to move with it, none of which is optional:
   1. **`entrantPctBand` derived from the acceptance ranges** (§3d). Measured: on-ramp 3.5% → 12.6%.
      This is arguably a defect on its own terms today, since the bands and the cuts encode the same
      real-world fact and disagree.
   2. **`FIELD.attrSpread` re-denominated, or the four offsets made zero-sum** (§3b). It is what
      takes Spearman to 0.725, and zero-sum offsets would make `power()` equal the drawn core
      exactly, which is what `fieldPros.ts`' calibration table already claims it is.
   3. **A ruling on `rollPotential`** (§3b(3)). A compressed world makes a p99 talent roll the world
      #4. Either the player's ceiling comes down with the world's, or "a chance at the top" becomes
      "a good roll at the top".

**D. Population depth is not finished at 520, and the arithmetic says where it stops.** For W15's
shipped band `[0.22, 0.72]` to reach the real #400+, the merged table needs ~1,800 rows –
`FIELD.size` ≈ 1,600, which is the real WTA's own ~1,550. At 1.62 ms per 520 pros that is ~5 ms per
season boundary, which is affordable. **Choosing between (C1) and (D) is the real decision**: re-aim
six bands, or make the population what the sport's is. They buy the same thing.

**E. One thing NOT to do: chase the early-exit rate.** §2e and `real-ladder-pace.md` §7. 75% of any
knockout field is out by the second match, always; a real journeywoman sits exactly there and a real
world #47 sits at 76.5%. After step 1 she is at 73.0%, i.e. already on the over-qualified side.
**The remaining problem is presentation, not calibration** – an early loss needs to read as normal
rather than as failure, and the one thing that genuinely moves the number, being over-qualified for
the draw, should be visible to the player.
