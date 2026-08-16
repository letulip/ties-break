---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-05
---

# Points by the book – three sourced corrections, measured one at a time

**Status: all three corrections built and measured separately. The owner approved all three before a
line was written** – *«с очками надо разобраться точно совершенно»*, *«надо сделать как в
реальности»*, *«значит делаем по точно такой же логике»*.

`docs/research/real-ladder-pace.md` §"THREE CORRECTIONS" found three places where our ranking
arithmetic disagrees with the sport's own rulebook, and `docs/specs/ladder-pace-2026-08.md` §6B
handed two of them forward as step 4. This page is that step. Each correction is a separate arm of a
five-arm A/B, so what each one is worth is attributable rather than inferred.

> **THIS IS NOT A TUNING WAVE.** Every number changed here is a number the 2026 WTA Rulebook or the
> 2026 WTA points chart states outright; none of them is ours to choose. That is why the ship rule
> below is written as *"what would have to break for a correction to be worth reverting"* rather than
> as *"what improvement buys it a place"*. A correction that makes her rank worse is still correct.

---

## 0. THE SHIP RULE, WRITTEN BEFORE ANY AFTER-NUMBER WAS READ

Written 05.08 after the baseline runs and **before the first arm was built**. The previous two waves'
negative results are trustworthy precisely because they did this, and this page keeps the discipline.

**Baseline: the shipped tree at this branch's base (`wave/endings-and-debts`, after ladder-pace step
1 merged), re-measured here rather than quoted.**

| measurement | baseline, this head | for reference: pre-step-1 |
| --- | --- | --- |
| Spearman(skill rank, points rank) over the field | **0.888** | 0.891 |
| mean \|skill − points\| | **52.7 places** | 35.6 |
| her peak rank, grinder / player | **#206 / #160** | #184 / #144 |
| grinder p10 / median / worst | #300 / #428 / #532 | #275 / #358 / #383 |
| player p10 / median / worst | #181 / #234 / #526 | #222 / #296 / #373 |
| careers of 180 reaching top 200 / 100 / 50 / 10 | **0 / 0 / 0 / 0** grinder · **35 / 0 / 0 / 0** player | 0/0/0/0 · 6/0/0/0 |
| ever ranked | 128/180 grinder · 138/180 player | – |
| table shape #1 / #10 / #50 / #100 / #150 / #250 | 11,680 / 4,688 / 1,347 / 830 / 518 / 260 | – |
| rows holding any points, merged probe table | **520 of 719** | – |
| inert acceptance cuts | **2** (w35, w50) | 3 |
| `fieldProsFor` cost | **1.54 ms** per season boundary | 1.17 |
| career bench wall time | **264 s** grinder · **394 s** player | – |

⚠ The brief's baseline (#184 / #144, Spearman 0.891 / 35.6) is the **pre-step-1** one, taken before
`FIELD.size` went 364 → 520. Both columns are printed so nobody has to guess which tree a number came
off. Every arm below is measured against the left-hand column, same command, same tree, same machine.

### The six criteria

**All three corrections ship unless one of these fails. A failure is reported and that correction
alone is reverted**, exactly as `FIELD.earnCurve` and `FIELD.strengthCurve` were.

1. **CORRESPONDENCE DOES NOT GET WORSE.** Spearman ≥ **0.888** and mean |skill − points| ≤ **52.7**
   over the whole professional population.
   ⚠ **And I predict this criterion cannot move, which is the reason it is stated first rather than
   last.** All three corrections change how a ledger is FOLDED or what a rung PAYS; the 520 derived
   professionals are *issued* their books by `fieldPros.ts` and fold nothing. So this is a
   **tripwire, not a test**: if it moves at all, a correction reached somewhere nobody intended it
   to, and that is a finding whatever direction it moved in. The real anti-gift test is 2b.
2. **A CHANCE, NOT A CONVEYOR – AND NOT A GIFT.** Two limbs, and the second is the one that guards
   the failure mode the brief names.
   * **(a)** Of 180 careers, **fewer than 30 (17%)** ever reach the top 100 on either policy arm.
     Zero is a wall and 118 was a delivery service; the band is wide because the owner has not set
     the target, and the shape of the distribution is reported whatever the count.
   * **(b) THE GIFT GUARD.** Her rank is not evidence on its own: re-pricing the two entry rungs
     lifts every book **earned** in the world, and the whole live cohort earns on the same table she
     does. So the merged professional top 200 must **stay a professionals' table**: the median count
     of LIVE girls inside it at career end must remain **under 40 of 200 (20%)**, and it is reported
     beside her peak rank on every arm. Her rank improving while this holds is a climb; both rising
     together is a deflation, and a deflation is not worth shipping whatever it does to her.
3. **THE REAL-CURVE CALIBRATION SURVIVES.** #10 / #50 / #100 / #150 / #300 each stay within ±40% of
   the real anchors (4,000 / 1,400 / 850 / 520 / 190) – the band `tests/season/fieldPros.test.ts`
   already enforces. `act2-pro-tour.md` §11 calls this fit a deliberate achievement and it is not
   this wave's to spend.
4. **THE DOORS STILL SEPARATE PEOPLE.** The number of INERT acceptance cuts (past the pointed rows,
   refusing nobody) does not increase. **Two today** – w35 and w50 – and that is the count to beat,
   not to match. ⚠ Correction 3 raises the bar for holding a book at all, so this is the criterion
   it is most likely to fail, and it is measured on a live world and not only on the probe table.
5. **THE LADDER NEVER GOES DARK, AND THE FIRST RANKING STILL ARRIVES.** Correction 3 delays the week
   she first appears on the list, so: the entry rung stays open at the moment she first has a
   professional result (pinned as a test, not a bench line); the **median age at first ranking stays
   at or below 17.5**; and the share of careers that ever hold a professional ranking falls by no
   more than **10 percentage points** on either arm. The real target is **15.9–16.2**
   (`real-ladder-pace.md` §6) and ours cannot beat 16.0 by construction – every W rung is
   `minAgeYears` 16 – so the band is one-sided on purpose.
   ⚠ **THE CONSTRUCTION ARGUMENT EXPIRED ON 16.08 AND THE CRITERION DID NOT.** Every W rung opens at
   **14** now, on the owner's ruling that the floors are the sport's own, so nothing constructionally
   stops a career beating 16.0 – but measured on that same ruling W35's median first entry moved only
   16.3 → 16.1, because the acceptance cut was always the binding gate and the floor sat behind it.
   **The band stays one-sided, by measurement instead of by construction.** Grid, stated once:
   [`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).
6. **COST.** `fieldProsFor` stays under **2.5 ms** per season boundary, the career bench's wall time
   rises by no more than **25%** (264 s / 394 s → 330 s / 493 s), and the persisted ledger does not
   grow at all.

Two things are explicitly **not** criteria, and saying so is the point:

* **Her peak rank on its own.** It is reported on every arm and criterion 2 is what judges it.
* **The R1/R2 exit rate falling.** A 32-draw exits 75% of any field by the second match by
  arithmetic. Reported against the real-world figure, never optimised.

---

## 1. THE THREE CORRECTIONS, AS BUILT

### 1.1 Correction 1 – the counting window is EIGHTEEN, and eleven of them are reserved

`BEST_N_BY_TRACK.wta` **16 → 18**, plus `MANDATORY_SLOTS` and `windowSlots` in
`src/engine/season/ranking.ts`. 2026 WTA Rulebook §VIII.A.4.a.i, verbatim: a ranking is her total
points *"including any applicable zero (0) ranking point results ... from eighteen (18) Tournament
results during a rolling, 52-week period, which must include: four (4) Grand Slams; six (6) WTA 1000
Mandatory combined/virtually combined Tournaments; one (1) WTA 1000 Mandatory Tournament (WTA only);
best seven (7) results from all WTA 1000 Mandatory, WTA 500, WTA 250, WTA 125 and ITF W15+ events"* –
and, immediately after, *"for each Grand Slam or WTA 1000 Mandatory Tournament that a player is not
required to count ..., the number of results from all other Tournaments that count on her ranking is
increased by one (1)."*

**It is the logic and not only the number, which is the owner's ruling.** The fold reserves 4 slots
for Slams and 7 for 1000s; a reservation she cannot fill converts to an open slot, so the total is
always eighteen and only the freedom changes. A player never accepted into either family – nearly
every career in this game – has all eleven convert, and her ranking is simply her best eighteen.

**Where our regime and the rulebook disagree, ours governs, and here is where:**

| the rulebook | ours | why ours stands |
| --- | --- | --- |
| 4 Slams + 6 combined 1000s + 1 WTA-only 1000 = 11 reserved | 4 Slams + **7** of our **8** 1000s = 11 reserved | our grid carries eight 1000s (`TIERS.wta1000.anchorWeeks`) against the real eleven mandatories. Reserving the rulebook's own 4 and 7 keeps the count and lets her eighth 1000 fall into the open pool – which is the real rule's own behaviour, since the "best seven from all other tournaments" list explicitly re-includes WTA 1000 Mandatory events. |
| obligations follow acceptance | obligations bind the **top 50** only (`ECONOMY.mandatory.maxRank`) | act2-pro-tour.md §6, the owner's spec. Unchanged by this wave. |
| six 500s are committed to | our 500s are a **quota of six from ten**, checked at the season boundary, and are **not** reserved in the window | the tour lets a top-50 player pick which six. A reserved slot would take that choice away, and the quota already has its own enforcement. |
| a mandatory missed is a zero, full stop | a mandatory missed is a zero **only if she could have met it** (`mandatoryBinds`: not injured, not suspended, not refused by the list, not too young, not already committed) | «мы ни за что не наказываем» is a standing ruling. It means a reserved slot in this game can only ever hold a zero she **chose**. |

⚠ **And the reservation makes the existing `mandatoryMiss` zero strictly crueller, which is the
owner's own spec arriving from the rulebook.** Under best-16 a zero sorted last and was dropped by
anyone holding sixteen better results – it cost her nothing exactly when she was playing well. Under
the reserved structure it occupies one of the eleven **whatever else she has**. `ranking.ts`' own
note already said the tour *"does not take points away, it takes a SLOT"*; now it does.

### 1.2 Correction 2 – the two entry rungs are re-priced to the chart they are named after

`TIERS.w15.points` **[10, 6, 3, 2, 1, 0] → [15, 10, 6, 3, 1, 0]** and `TIERS.w35.points`
**[20, 13, 8, 4, 2, 0] → [35, 23, 14, 8, 4, 0]** – the 2026 WTA chart's own rows, whole array. The
naming rule is the sport's: the 2024 restructure renamed W25/W40/W60 to W35/W50/W75 explicitly *"to
align the tournament naming with the points awarded to the Winner"*, so a rung called "World Tour 35"
paying 20 was our table contradicting our own research.

**Two shapes come back with the rows, and neither is index 0.** (a) W15's title ÷ one-match-won ratio
becomes the real **15.0×** – it was 10.0×, i.e. we had made the entry rung less winner-take-most than
the sport makes it. (b) The seam **W35 → W50 falls from ×2.5 to the real ×1.43**, which is the one
debt `calendar.ts`' own note had explicitly booked as "the compressed-canon-meets-real-chart cost".

**And the whole array of every rung was audited, not just these two** – see
`docs/research/ranking-points-by-tier.md` **§4a**, generated from the shipped file rather than
transcribed. Result: **every rung with a real analogue is now cell-for-cell exact except `w100`**,
which is short in three of six cells (semi-final 40 v 39, quarter-final 25 v 21, opening loss 0 v 1).
W100 is the last survivor of the trio `act2-pro-tour.md` §2 ruled "canon as-is" before the research
existed – w15, w35, w100 – and it is **reported and deliberately not fixed**: the owner approved
three corrections and a fourth re-pricing nobody asked for is scope creep. It needs its own measured
arm. `tests/wave-b-points.test.ts` already anticipates it in a comment.

### 1.3 Correction 3 – a minimum rankable total

`RANKABLE_MIN = { tournaments: 3, points: 10 }` and `rankableTotal` in `ranking.ts`. §VIII.A.2.b:
*"Players must earn (i) ranking points in at least three (3) valid Tournaments, or (ii) a minimum of
ten (10) singles ranking points ... in order to appear on the WTA Rankings."*

It governs **the professional table and only it**, decided by the rows rather than by a parameter
every caller would have to remember: a fold whose every row is on the `wta` track is the WTA ranking;
anything else is not. The ITF junior ranking has its own, harsher eligibility rule (Juniors Reg 14)
which we do not model, and our domestic ladder is invented outright – importing the WTA's threshold
into either would un-rank a thirteen-year-old on her first two J30 wins.

Two deliberate non-decisions, both stated because they are the kind of thing that becomes a bug:

* **`recency` is untouched.** A player below the minimum reads 0 points and therefore shares the
  pointless tail's single competition rank, which is the whole of what "does not appear" means here.
  Her ORDER inside that tail is our own bookkeeping (`selectEntrants` walks it) and zeroing it too
  would be inventing a second rule on top of the one the book states.
* **`kidLadderRank` now asks `kidPoints > 0` instead of `countingResults.length > 0`.** Those were
  the same question while every counting row paid something. A `mandatoryMiss` zero and a
  below-minimum book both break that, and under either she would have read as a RANK on a total of
  zero – the "unranked is not a number" bug that function exists to prevent, arriving from the other
  side. Behaviour-identical on the domestic and ITF tables.

---

## 2. WHAT WAS PREDICTED, AND BY WHOM

Provenance is marked, because a prediction invented after the fact is worth nothing.

| # | prediction | source | measured | verdict |
| --- | --- | --- | --- | --- |
| P1 | criterion 1 (Spearman / mean \|skill − points\|) **cannot move** – all three corrections change how a ledger is folded or what a rung pays, and the 520 derived professionals are *issued* their books and fold nothing. A tripwire, not a test. | §0, committed in `f4c7db9` **before any arm was built** | **0.888 / 52.7 on all five arms, byte-identical** | **right, exactly** |
| P2 | correction 3 is the correction **most likely to fail criterion 4** (the doors), because it raises the bar for holding a book at all | §0, same commit | inert cuts **2 on every arm**; the live-world pin still reads exactly `['w35','w50']` | **wrong** – it never moved |
| P3 | widening past 16 is worth **exactly nothing** to a perfect player, so expect correction 1 to be nearly free at the top and **to matter in the middle** | `tools/ceiling-walk.ts` §6 / `ranking-ceiling-2026-08.md` row 8, measured before this wave | free at the top (prodigy #18 → **#16**) **and free in the middle** – the career bench moves the grinder median 5 places and the player arm not at all | **half right**: the "nothing" held; the "matters in the middle" did not |
| P4 | the minimum rankable total is **"cosmetic"** | `real-ladder-pace.md` §4, correction 3 | it is the **single biggest mover of her best career** (grinder #206 → **#162**) and it removes **43% of the live cohort's ranked rows** (21 → 12) | **wrong, and it is this wave's main finding** |
| P5 | the two under-priced entry rungs are "a second, independent cause of the discontinuity the owner feels at the bottom of the ladder", and cheap to fix | `real-ladder-pace.md` §4, correction 2 | biggest mover of the **median** career (grinder #428 → **#347**), and it doubles her W75 exposure (71 → 105 of 180 careers) | **right** |
| P6 | the **gift guard** (2b) would be the binding constraint on correction 2 | §0, same commit | live girls inside the merged top 200 stayed at a **median of 0.0 on every arm, including the baseline** | **wrong** – and the guard turned out to have no dynamic range, see §4 |

---

## 3. THE THREE ARMS, MEASURED SEPARATELY

Five arms, one script, every tree built **before the first run started** – `scratchpad/sweep.sh`,
because `ladder-pace-2026-08.md` §0a's hazard is that `vite-node` loads a module once per process and
an edit landing between two backgrounded commands silently re-labels an arm. `base2` is the control
(all three corrections turned off in the same tree the others are built from) and it reproduces the
shipped baseline **to the digit**, which is the receipt that the arms differ only in what they claim
to differ in.

### 3.1 The table half – identical on all five arms, which is the point

| | base2 | c1 | c2 | c3 | all |
| --- | --- | --- | --- | --- | --- |
| Spearman(skill, points) | 0.888 | 0.888 | 0.888 | 0.888 | 0.888 |
| mean \|skill − points\| | 52.7 | 52.7 | 52.7 | 52.7 | 52.7 |
| #1 / #10 / #50 / #100 / #150 / #250 / #300 | 11,680 / 4,688 / 1,347 / 830 / 518 / 260 / 195 | *identical* | *identical* | *identical* | *identical* |
| rows holding any points (merged probe table) | 520 of 719 | 520 | 520 | 520 | 520 |
| inert acceptance cuts | 2 (w35, w50) | 2 | 2 | 2 | 2 |
| `fieldProsFor` | 1.74 ms | 1.46 | 1.59 | 1.38 | 1.58 |

**Real anchors for row 3**: 10,500 / 4,000 / – / 1,400 / 850 / 520 / 190. Worst error **+17.2% at
#10**, everything else inside ±4%. The calibration `act2-pro-tour.md` §11 calls a deliberate
achievement is exactly where it was.

⚠ **"Rows holding any points" did not move under correction 3, and that is a property of the probe
and not of the game.** This line counts the merged table of 520 *derived* professionals plus a live
cohort the probe hands in on zero points, so no threshold can touch it. The measurement that does
have range is the live one in §3.2 – **21 → 12** – and it is the one that carries correction 3's
effect on the size of the ranking list.

### 3.2 The career half – 180 careers per arm per policy

**Grinder policy** (`bench:money --no-verify`):

| arm | best | p10 | median | worst | top 10 / 50 / 100 / 200 | holds a ranking | LIVE girls ranked at career end | age at 1st ranking | W draws it cost | ranking lags 1st cheque |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **base2** | #206 | #300 | #428 | #532 | 0 / 0 / 0 / **0** | 128/180 (71.1%) | **21** | 16.60 | 3.0 | 0 wk |
| **c1** window | #206 | #300 | **#423** | #532 | 0 / 0 / 0 / 0 | 128/180 (71.1%) | 22 | 16.60 | 3.0 | 0 wk |
| **c2** re-pricing | **#181** | **#244** | **#347** | #542 | 0 / 0 / 0 / **4** | **142/180 (78.9%)** | 22 | 16.65 | 3.0 | 0 wk |
| **c3** minimum | **#162** | **#250** | #439 | #530 | 0 / 0 / 0 / **3** | 128/180 (71.1%) | **12** | 16.53 | **7.0** | **9 wk** |
| **all three** | #184 | **#235** | **#360** | #533 | 0 / 0 / 0 / **4** | 130/180 (72.2%) | **14** | 16.60 | 6.0 | 9 wk |

**Player policy** (`--policy player`):

| arm | best | p10 | median | worst | top 10 / 50 / 100 / 200 | holds a ranking | LIVE girls ranked | age at 1st ranking | W draws it cost | lag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **base2** | #160 | #181 | #234 | #526 | 0 / 0 / 0 / **35** | 138/180 (76.7%) | **21** | 16.42 | 3.0 | 0 wk |
| **c1** window | #160 | #181 | #234 | #526 | 0 / 0 / 0 / 35 | 138/180 (76.7%) | 22 | 16.42 | 3.0 | 0 wk |
| **c2** re-pricing | **#137** | #181 | #230 | #533 | 0 / 0 / 0 / 34 | **146/180 (81.1%)** | 22 | **16.27** | 3.0 | 0 wk |
| **c3** minimum | **#152** | #189 | #233 | #529 | 0 / 0 / 0 / **27** | **146/180 (81.1%)** | **13** | 16.54 | 4.0 | **6 wk** |
| **all three** | **#141** | #185 | #235 | #532 | 0 / 0 / 0 / 32 | **148/180 (82.2%)** | **14** | 16.33 | 4.0 | 4 wk |

**Read arm by arm:**

**C1 – the eighteen-slot window is free, and freer than predicted.** The player arm is
*byte-identical* to the control in every printed figure; the grinder median moves five places. The
mechanism is `ceiling-walk`'s own: **she cannot fill sixteen slots, so two more are two more empty
ones.** The one place it shows is the closed-form prodigy, whose book goes 2,791 → 2,929 and whose
place goes #18 → #16 – two places for a player good enough to fill the window. The **reserved-slot**
half of the correction is inert in every career measured here for a reason that is structural rather
than lucky: reservations only bind a player who is in Slam and 1000 draws, and no career in this
bench reaches the top 50 that binds them. **It is built and pinned by test, and it will first be
measurable the season a career does.**

**C2 – the re-pricing is the biggest single mover, and it moves the middle.** Grinder median **#428 →
#347** (81 places), p10 #300 → #244, best #206 → #181; the share of careers that ever hold a
professional ranking rises 71.1% → 78.9%. On the player arm the best career goes #160 → #137 and the
first ranking arrives **two weeks earlier in age terms** (16.42 → 16.27). The mechanism is visible in
`bench:money` §8: her **W75 draws go 1,119 → 2,618 and the careers that ever enter one go 71 → 105 of
180** – a fairer entry rung means she climbs, rather than that she is handed points where she stands.

**C3 – the minimum is not cosmetic, and it is the interesting one.** Two opposite effects at once,
and both were predicted by nothing:
* **It lifts the best careers sharply** – grinder best **#206 → #162**, 44 places, the largest single
  movement anywhere in this wave – while leaving the median slightly worse (#428 → #439). The
  mechanism is the ladder, not the table: `tierOutgrown` closes a rung when the rung three above it
  opens, and `tierFloorOpen` needs `kidPoints > 0`. Deleting the "ranked on one point" state keeps
  the rungs she can actually win open for longer, and the careers that benefit are the ones that were
  being promoted out of a winnable band before they had a book.
* **It shrinks the ranking list by 43%** – live girls holding a professional ranking at career end
  **21 → 12** (grinder) and **21 → 13** (player). That is the correction doing exactly what the
  rulebook says: a real list holds no rows on one or two points, and ours held nine of them.
* **The cost is paid in draws, not in years.** A first ranking now takes a median of **7 W main draws
  instead of 3** on the grinder arm, and arrives a median of **9 weeks after her first cheque** where
  the two used to be the same week. The AGE barely moves (16.60 → 16.53), because the entry rung
  comes round every two weeks.

**All three together are NOT the sum of the parts.** Grinder best is #184 where c2 alone gives #181
and c3 alone #162; the median lands at #360 between c2's #347 and c3's #439. The system is a fixed
point – a book buys a rank, a rank opens a window, a window earns a book – so arms compose by
interference and not by addition. **This is why they were measured separately**, and it is the reason
a combined-only before/after would have credited the whole movement to whichever correction was
mentioned first.

### 3.3 Two things reported, never optimised

**The R1/R2 exit rate**, against the 75.0% arithmetic floor of any 32-draw (grinder arm, excess over
the floor):

| arm | W15 | W35 | W50 | W75 | **ALL W** |
| --- | --- | --- | --- | --- | --- |
| base2 | −1.1pp | +6.8 | +11.6 | +12.8 | **+5.5pp** |
| c2 | +1.6 | +6.5 | +9.3 | +11.8 | +6.6pp |
| c3 | −0.2 | +6.1 | +11.6 | +10.9 | +5.5pp |
| **all three** | **−0.2** | **+4.2** | **+7.9** | **+10.2** | **+5.0pp** |

The combined arm improves the excess on **every rung** and takes the overall figure from +5.5pp to
+5.0pp over a floor no design can beat. `real-ladder-pace.md` §7's ruling stands – this was not
chased, and a real world #47 on the main tour sits at +1.5pp over the same floor – but it is worth
recording that correcting the arithmetic moved it the right way without being asked to.

**The money.** Career prize/spend is unmoved: median 95.4% → 95.3% (grinder), 116.7% → 115.4%
(player). No economic shock hides in a points correction, which is the thing that had to be checked
rather than assumed.

---

## 4. THE SHIP RULE, JUDGED

| # | criterion | bar | measured | |
| --- | --- | --- | --- | --- |
| 1 | correspondence does not get worse | ≥ 0.888 and ≤ 52.7 | **0.888 / 52.7** on all five arms | **PASS** |
| 2a | a chance, not a conveyor | < 30 of 180 reach the top 100 | **0** on every arm and both policies | **PASS** |
| 2b | the gift guard | median LIVE girls in the merged top 200 < 40 | **0.0 on every arm** | **PASS** |
| 3 | the real curve survives | #10/#50/#100/#150/#300 within ±40% | +17.2% / −3.8% / −2.4% / −0.4% / +2.6%, identical on every arm | **PASS** |
| 4 | the doors still separate people | inert cuts do not exceed 2 | **2** on every arm; the live-world pin still reads exactly `['w35','w50']` | **PASS** |
| 5 | the ladder never goes dark | W15 open at her first result · median age at 1st ranking ≤ 17.5 · ranked share falls ≤ 10pp | pinned by test · **16.60 / 16.33** · share **rises** 71.1 → 72.2 and 76.7 → 82.2 | **PASS** |
| 6 | cost | `fieldProsFor` < 2.5 ms · career bench + ≤ 25% · ledger does not grow | **1.58 ms** · see below · no persisted field changed | **PASS** |

**All six pass. All three corrections ship.**

⚠⚠ **AND CRITERION 2b PASSED WITHOUT EVER BEING IN DANGER, WHICH IS A WEAKNESS IN THE RULE AND NOT A
STRENGTH IN THE RESULT.** The measurement reads 0.0 on the **baseline** too – no live girl has ever
been inside the merged top 200 in this bench, so the guard has no dynamic range and could not have
detected a gift of any size. The number that carried the anti-gift verdict in practice is its
companion, **live girls holding a professional ranking at career end**, which does have range: it
goes 21 → 22 under the re-pricing (one girl) while her own median improves 81 places, and 21 → 12
under the minimum. **The table did not float up; if anything the minimum thinned it.** A future wave
re-using this rule should denominate 2b in that number, or in the merged top **500**, and the reason
is written here rather than left for someone to rediscover.

⚠ **Criterion 6's wall-time limb is not measurable to 25% on a shared machine.** The same tree and
the same command came back **263.9 s and 339.8 s** in two runs an hour apart, purely from what else
was running. The arms' spread (262.9–404.2 s) brackets the control's own. It was therefore re-taken
back-to-back, alternating control and shipped arm, at `--seeds 4`:

| pass | control (`base2`) | all three | |
| --- | --- | --- | --- |
| 1 | 159.6 s | **126.9 s** | −20.5% |
| 2 | 170.1 s | **119.1 s** | −30.0% |

**The shipped arm is not slower; it is a fifth to a third faster, twice, alternating.** ⚠ And the
cause is NOT that the fold got cheaper – it is that **the careers themselves are different**. The
combined arm plays **27,177 W main draws to the control's 29,346** over the 180-career run, because a
correctly-priced ladder promotes her differently and a minimum delays her first ranking. So the
honest reading of criterion 6 is: **the fold's own cost is below the resolution of any instrument
here**, and the wall clock is measuring the game and not the arithmetic.

The structural argument is the one to trust anyway: `windowSlots` returns the input array untouched
whenever a player has no more results than the window is wide – which is almost every player, almost
every week – and allocates nothing at all in that case. The reserved-slot loop runs only for a player
who is both over-full **and** carries a Slam or 1000 row.

---

## 5. WHAT MOVED IN THE GUARDS

Nothing deleted, nothing weakened. Four re-aims and one new pin, each with its reason in the file.

| guard | was | now | why |
| --- | --- | --- | --- |
| `tests/condition.test.ts` · `injuries.test.ts` · `planner.test.ts` – `REF.kidRank` | **90** | **91** | **fourth time, same second-order mechanism.** Correction 2 re-prices W15/W35, so every LIVE girl's professional book changes, so her row moves in the merged W table, so `selectEntrants`' percentile bands land on different people, so which juniors a W week books changes, so the J draws they were no longer free for change. This constant folds the **ITF** table, which no correction touches. ⚠ The MAIN capture (41550 / `e6b0c709`) and the planner A/B hashes are asserted BEFORE this line and all still pass – **input-independence is untouched**, and no correction draws on any stream at all |
| `tests/unranked-sentinel.test.ts` – "the entry rung survives her first W point" | probe book **1 point**, `open === ['w15','w35','w50']` | probe book **10 points**, same three stages asserted by name | its own subject – «her first W point» – is a state the sport does not have any more. The 1 would have made the assertion **vacuous** rather than false, so the probe moves to the smallest book §VIII.A.2.b actually admits. Both the earlier stage and the "climbed" stage are untouched |
| `tests/wave-b-points.test.ts` – the participation-floor bound | `windowedBestSum(..., 16) < w50.points[2]` | `windowedBestSum(..., BEST_N_BY_TRACK.wta)`, **plus a new assertion that the sum is exactly the window width** | the literal 16 stopped naming the rule the paragraph is about. The bound still holds at eighteen (18 × 1 < 20) and is now **within two points of failing**, which is the kind of margin a guard should state rather than leave for the next widening to find |

**A new guard is added**, not just re-aimed: `unranked-sentinel.test.ts` gains
**"§VIII.A.2.b – one W point is not a ranking, and either limb of the minimum is"**, which pins both
limbs in both directions (one point → off the list and W35 shut, but W15 still open; ten points in
one event → on it; three one-point events → on it; two → still off). Written as behaviour, so it
survives a re-tune of the threshold itself.

**Two tools were broken by correction 3 and are fixed, which is worth recording because one of them
would have failed silently-ish:**

* `tools/ceiling-walk.ts` seeded its synthetic career with a **one-point** W row – the smallest book
  that used to satisfy `kidPoints > 0`. Under the minimum that book is no book, every acceptance gate
  answers false, and the whole ceiling walk would have reported that nothing is ever open. It now
  seeds `RANKABLE_MIN.points`, read from the constant so it re-fits if the threshold moves.
* `tools/skill-ceiling.ts` carried its **own transcription** of all six W points arrays, which went
  stale the moment W15 and W35 were corrected – and stale silently, because a hand-copied array still
  adds up. It reads `TIERS` now. `tools/world-turnover.ts` and `tools/best16-bench.ts` had the same
  problem with the literal `16` and read `BEST_N_BY_TRACK.wta`.

**Schema:** no persisted field changed. `SAVE_SCHEMA_VERSION` stays at **v40**, no migration, no new
golden fixture. Three constants and a fold; the ledger is byte-identical.

**One player-facing sentence changed, and it is correction 3's doing.** `rankingDeltaSuffix` gains a
third case. A girl who has scored but is not yet on the list has `after === 0` with `points > 0`, and
the old two-case sentence told her the result *"does not improve best 18"* – true of the arithmetic
and nonsense to read, because the reason is not that her window was full, it is that she has no
window yet. It now names the rule that is holding her: *"(+6 banked – a ranking needs 3 events with
points, or 10)"*, read off `RANKABLE_MIN` so it cannot drift from the rule it quotes.

**Gates:** `vue-tsc -b --force` clean · `npm run test:quiet` **112 files / 2,376 tests green** ·
`npm run test:component` **8 / 88 green** · `npm run test:sim:quiet` **8 files / 80 tests green**.
⚠ The sim run exits **1** on a `Timeout calling "onTaskUpdate"` with **zero assertion failures** –
CLAUDE.md's own documented false RED (birpc's hard-coded 60 s RPC timeout against a minutes-long
synchronous Monte-Carlo file). It took 280 s against a documented ~70 s because another agent is
active on this machine, which is the same reason a full `npm run check` was deliberately not run.

---

## 6. WHAT THIS LEAVES FOR THE POPULATION WAVE

A follow-up wave takes `FIELD.size` to ~1,600 and re-calibrates the storeys, bands and acceptance
cuts against a tapering title-chance ladder. **Nothing here touches the population or the cuts.**
These numbers will need re-measuring when it lands, and these will not:

**Re-measure – every one of these is denominated in the size or shape of the table:**

* **Every rank in §3.2.** A book that buys #347 among 719 rows buys a different number among ~1,800.
  Both policy arms, both tails.
* **"LIVE girls ranked at career end" (21 → 12 → 14)** and with it criterion **2b** – and 2b should
  be re-denominated when it is re-taken, for the reason in §4.
* **The share of careers that ever hold a ranking** (71–82%). Correction 3's threshold is absolute
  (three events or ten points) while the field it competes against grows, so this figure is a
  function of both.
* **The inert-cut count (2)** and the live-world pin in `unranked-sentinel.test.ts`. Deeper
  population = more pointed rows = cuts that bite where they did not. That test's own comment already
  records this as the licensed direction of travel.
* **The exit-rate excess table.** It is a readout of how over- or under-qualified she is for the draws
  she gets, and the population wave changes exactly that.

**Do NOT re-measure – these are facts about the rules and not about the world:**

* The eighteen slots, the eleven reservations and the conversion rule. §VIII.A.4.a.i does not depend
  on how many players exist.
* The W15 and W35 rows, and the §4a audit that found `w100`.
* The three-tournaments-or-ten-points minimum itself.
* **Criterion 1's insensitivity** (P1). It is structural: the derived field is issued its books and
  folds nothing, so no folding rule can move the field's own correspondence – at any population.

**And one thing to carry forward rather than re-measure: `w100` is still wrong**, by three cells,
against its own published row. It is the only rung in the game that is. See
`ranking-points-by-tier.md` §4a for the diff and the reason it was not taken here.
