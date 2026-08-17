---
type: spec
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-17
---

# Does skill decide a match? – the owner's oldest complaint, measured against the sport

**The owner, more than once, most recently in round 21:**

> «есть впечатление, что скилл особо ни на что не влияет или если и влияет, то очень незначительно.
> Мне бы хотелось, чтобы корреляция стала более явной. Понятно, что в топ-50 разброс по скиллам
> будет не очень заметен, но когда играют топ-50 против топ-200 или топ-300 – это совсем другое
> дело… Есть DnD система, она учитывает результаты не только брошенных кубиков, но и скиллы
> персонажей и мультипликаторы. Я бы хотел, чтобы у нас тоже появились четкие формулы, по которым
> более менее точно можно предсказывать и нам самим и игрокам не биться головой в бетон.»

And, refining it:

> «Я допускаю, что 300 вполне может обыграть 50, это спорт, всякое случается, но вероятность такого
> довольно мала, как мне кажется. Можно поискать статистику.»

**Three parts, in order: what the real number is, what ours is, and what the smallest change would
be.** Nothing here ships. A match-model constant moves every rung, every ranking and every career,
so the proposal arrives with its curve, its cost and its blast radius, and the owner rules.

---

## 1. THE PREDICTIONS, WRITTEN BEFORE THE RUNS

Recorded here first, per CLAUDE.md invariant 4. Commit of this file is the timestamp; the
measurement tool (`tools/skill-gap-odds.ts`) is committed after it.

**P1 – the point→match compounding is CORRECT and is not the defect.** `pMatchBo3` is the standard
iid Markov closed form and should reproduce `docs/research/03-match-engine-math.md`'s own quoted
values to within a point: p .63/.62 → ~55%, .65/.62 → ~65%, .67/.62 → ~73%, .70/.60 → ~89%.

**P2 – neither clamp binds anywhere in the reachable world.** `BASE_CLAMP [0.42, 0.82]` needs
(0.82−0.57)/0.0027 ≈ **93 core points** of gap to reach its ceiling from the WTA base. The widest gap
the population can produce is `tourElite` top 77 against `newcomer` floor 18 = **59**. Predicted
incidence at every rank pair: **0%**. Same for `FINAL_CLAMP [0.3, 0.9]`, which sits further out
still and can only be reached by adding momentum (±0.015) and fatigue (±0.03) to a base that never
got near it.

**P3 – at LARGE rank gaps our model is not flat, it is STEEP.** Our population's core bands are
`tourElite` 67–77 / `contender` 43–53 / `journeyman` 38–48, so #50 vs #300 is roughly core 72 vs 43 =
**29 points** = 0.0783 of p each way. Predicted P(favourite) at #50 vs #300: **≥ 95%**, i.e. an upset
rate **under 5%** – which I predict is *below* the real sport's.

**P4 – the flatness the owner sees is a SMALL-gap phenomenon, and its size is fixed by
`SKILL_K + RALLY_K = 0.0027`.** One core point is worth 0.0054 of combined p gap. Predicted: near
even, **one core point ≈ 2 percentage points of match probability**, so Ines's measured +6.7 core
over her band mean should be worth **~+13 points, i.e. ~63%** against the band. If her measured
record is ~50%, the flattener is *not* inside `src/engine/match/` and the audit has to look at what
sits between a rank and a core.

**P5 – the player's own throttle is the smallest quantity in the system.** The world spans 59 core
points; round 21 measured four years of a college squad's match play at **+0.06 of one core point**
and P5 measured the whole coached/un-coached gap at **0.12**. Predicted: every lever the player can
pull is worth **under one percentage point** of match probability, against a world axis worth ~120.

**P6 – the proposal will be a GAIN and a FLOOR, not a new curve.** Predicted shape: raise the skill
gain so a real rank gap reads like the sport's, and add an explicit noise floor so the upset never
disappears. Predicted cost: the ladder gets harder to climb, because the same steepening that makes
her beat #300 makes #50 beat her.

---

## 2. PROVENANCE OF THE ARMS

**There is only one arm and it is the shipped engine**, because nothing in `src/` was changed: the
whole measurement is a read of the code as it stands. The bench is `tools/skill-gap-odds.ts`, built
and run at commit **`5ad87f1`** on `wave/round21`, which is this agent's own commit with the other
agent's college work already in the tree and untouched by it. The proposal in §5 is computed **inside
the bench**, from constants measured out of the shipped engine at run time – so there is no A/B pair
to confound, and the CLAUDE.md hazard the shared checkout keeps producing (a control built at the
wrong commit, or restored with `git checkout -- src`) cannot arise here.

The reader-present check the same gotcha demands, run on the tree the numbers came from:
`git grep SKILL_K -- src/` returns `src/engine/match/point.ts` and `src/engine/match/style.ts`;
`git grep -c "core:" src/engine/season/fieldPros.ts` returns the eight storey bands. Both constants
this document is about are present and read by the code that was measured.

Run: 40 worlds × 25 simulated matches per rank pair = **17,000 played matches** plus 2.4 M logged
points, and every closed-form cell is the mean over 40 independently seeded populations.

---

## 3. MEASURED – the two things the brief asked to check first

### 3a. (a) Does a per-point edge compound into a match edge? **YES, EXACTLY. P1 HOLDS.**

`pMatchBo3` against the literature values `docs/research/03-match-engine-math.md` quotes:

| p(A) | p(B) | ours | published |
|------|------|------|-----------|
| .630 | .620 | **55.0%** | 55% |
| .650 | .620 | **64.7%** | ~65% |
| .670 | .620 | **73.2%** | 73% |
| .700 | .600 | **89.1%** | 89% |

Four for four. And the amplification is real and large: when both sides move by ±0.01 of p – the
honest shape of a skill gap, since she gains what he loses – the match probability goes to **60.4%**;
±0.03 gives **78.5%**; ±0.05 gives **90.6%**. **A small point advantage does become a large match
advantage in this engine.** The compounding is not the defect and it never was.

### 3b. (b) Does anything clamp or compress the gap? **NO. P2 HOLDS, AND THE INCIDENCE IS ZERO.**

| clamp | where | binds in play? |
|-------|-------|----------------|
| `BASE_CLAMP [0.42, 0.82]` | `point.ts basePServe` | **0 of 40 worlds, at every one of 17 rank pairs** |
| `FINAL_CLAMP [0.3, 0.9]` | `point.ts modifiedPServe` | **0 of 2,404,297 logged points** |

Reachability probed rather than assumed: core 100 against core 0 does produce exactly
`pA = 0.820 / pB = 0.420`, so the clamp code is live – it is simply parked far outside the world. The
**widest gap the shipped population can produce** (tourElite ceiling 77 against newcomer floor 18, 59
core points) reaches `pA = 0.729`, comfortably inside. **There is no corridor, no cap and no floor in
`src/engine/match/`.** The `FINAL_CLAMP` result also disposes of momentum and fatigue as suspects:
2.4 M points and not one of them was pushed to a bound.

**⚠ There IS a compressor and a corridor in the game, but neither is in `match/` and neither
flattens skill.** `conditionMatchFactor` scales every attribute by as little as 0.55 – but it scales
*both* players and shrinks the gap only in proportion. `entrantPctBand` decides *who meets whom*,
which changes the distribution of gaps she is dealt, not the odds at a given gap. Both are named here
so the next reader does not have to re-find them.

### 3c. The two shipped arms agree, which had to be checked

An AI-vs-AI match is one draw against `fastMatchProbability`; the kid's own matches are
`simulateMatch`, point by point, momentum on. Across all 17 pairs the simulated upset rate tracks the
closed form to within 1.7 points (usually under 1): **21.1 / 19.4 · 7.3 / 7.7 · 4.3 / 4.3 · 38.9 /
38.1**. The world and the player are being decided by the same physics.

---

## 4. MEASURED – OURS BESIDE REALITY

Share of matches the **lower-ranked** player wins. Reality's columns and their provenance:
`docs/research/the-upset-rate.md` §3 – both are `[I]`, model output rather than frequency counts,
because **no empirical WTA table by rank gap has ever been published**.

| favourite | underdog | K&M `[I]` | Elo `[I]` | **OURS** | ours / reality |
|-----------|----------|-----------|-----------|----------|----------------|
| #1 | #10 | 8.5% | 41.6% | **47.4%** | routes disagree; ours is at or beyond the loose end |
| #1 | #50 | 1.7% | 17.3% | **28.1%** | routes disagree; ours is beyond both |
| #1 | #100 | 0.9% | 11.8% | **7.8%** | ×1.2 |
| #10 | #50 | 16.0% | 22.7% | **29.4%** | ×1.5 |
| #10 | #100 | 8.5% | 15.9% | **8.9%** | ×0.7 |
| **#50** | **#100** | **32.8%** | **39.1%** | **21.1%** | **×0.59** |
| #50 | #150 | 24.4% | 27.4% | **13.0%** | ×0.50 |
| **#50** | **#200** | **19.3%** | **20.4%** | **7.3%** | **×0.37** |
| **#50** | **#300** | **13.6%** | **11.4%** | **4.3%** | **×0.34** |
| #50 | #500 | 8.5% | – | **1.9%** | ×0.22 |
| #100 | #200 | 32.8% | 28.6% | **27.1%** | ×0.88 |
| #100 | #300 | 24.4% | 16.6% | **18.3%** | ×0.89 |
| #200 | #300 | 39.7% | 33.3% | **38.9%** | ×1.07 |
| #200 | #500 | 28.0% | – | **26.6%** | ×0.95 |
| #300 | #600 | 32.8% | – | **36.9%** | ×1.12 |
| #500 | #1000 | 32.8% | – | **30.9%** | ×0.94 |

### 4a. ⚠⚠ THE ANSWER TO THE OWNER'S QUESTION IS THE OPPOSITE OF WHAT HE EXPECTED, AND IT IS NOT CLOSE

**At the gap he named, skill already decides more in our game than it does in the sport.**
A #300 beats a #50 in the real women's game about **one time in eight (11–14%)**. In ours it is
**one time in twenty-three (4.3%)**. At #50 against #200 the sport says ~19–20%; we say 7.3%.
**We are not flat there. We are three times too decisive.** P3 predicted this and it held.

### 4b. …AND HE IS RIGHT ANYWAY, AT THE PLACE HE ACTUALLY PLAYS

**Between #1 and #50 our world is a coin flip.** #1 against #10 is a **47.4% upset** – the world
number one is barely favoured against the world number ten. That is the flatness he can feel, and it
sits exactly where a career that has arrived spends the rest of its life. Both his sentences are
true at once, of different parts of the table, which is why one number could never have settled it.

### 4c. THE MECHANISM, NAMED AND LOCATED: **`FIELD.tiers` in `src/engine/season/fieldPros.ts`**

It is not in `src/engine/match/`. The match model prices a **core gap** cleanly and almost perfectly
logistically – measured, **1 core point = 0.0027 of p per side = 20.2 Elo**, near-constant across the
range. What a *rank* gap is worth is therefore decided entirely by **how much core the population puts
between two ranks**, and that is the eight-storey table in `fieldPros.ts`, where core is drawn
**uniformly inside a storey**. Inside a storey, rank carries no skill information at all; all of it
is concentrated at the seams.

Measured, per segment, against the sport's own **124.2 Elo per doubling of rank**:

| from | to | doublings | core drop | core/doubling | Elo/doubling | vs the sport |
|------|----|-----------|-----------|---------------|--------------|--------------|
| #1 | #10 | 3.32 | 1.2 | 0.36 | **7** | **×0.06** |
| #10 | #50 | 2.32 | 7.7 | 3.33 | 67 | ×0.54 |
| #50 | #100 | 1.00 | 13.3 | 13.31 | **269** | **×2.16** |
| #100 | #200 | 1.00 | 9.1 | 9.07 | 183 | ×1.47 |
| #200 | #300 | 0.58 | 3.4 | 5.73 | 116 | ×0.93 |
| #300 | #500 | 0.74 | 6.0 | 8.17 | 165 | ×1.33 |
| #500 | #1000 | 1.00 | 6.7 | 6.70 | 135 | ×1.09 |
| **#1** | **#1000** | **9.97** | **47.4** | **4.75** | **96** | **×0.77** |

**Read the last row against the first two.** Over the whole table our skill span is only **23% short**
of the sport's. It is laid on the rank axis as a **staircase**: a 64-wide flat top where the sport has
412 Elo of gradient, then a cliff at the `tourElite`/`contender` seam worth 269 Elo per doubling where
the sport has 124. **The correlation the owner is asking for is not missing – it is in the wrong
place.** The `FIELD.tiers` literal says so itself, twice, and never got to it: *"Step 2 re-deals every
core in this table off the real Elo curve and is where the spread is fixed. Read the two together,
never this one alone."* Step 1 (depth) shipped; **step 2 (compression) never did.**

### 4d. WHY MOVING THE FIELD MOVED THE WIN RATES AND MOVING HER DID NOT

Both measured here, and there is no contradiction between them:

| lever | size | worth in match probability |
|-------|------|---------------------------|
| four years of the dear college squad (round 21) | +0.06 core | **+0.17 pts** |
| the whole coached / un-coached gap (P5) | +0.12 core | **+0.34 pts** |
| one core point | +1 | +2.84 pts |
| one year of junior development | +2.4 | +6.79 pts |
| **Ines's edge over her rank band** | **+6.7** | **+18.3 pts** |
| moving the field at a WTA 250 | 10–20 core | **20–50 pts** |

**The engine's response to skill is steep – 2.84 points of match probability per core point. What is
flat is the player's ACCESS to skill.** Her decisions move her by hundredths of a point against a
world axis of 59. P4 and P5 both held: Ines's +6.7 is worth +18.3 points against a like opponent, so
if her record looks like her band's, the reason is not the match model – it is that at a WTA 250 she
is not playing her band, she is playing the flat top of the table where nothing predicts anything.

---

## 5. THE PROPOSAL – ONE LAW, AND IT IS ALREADY LEGIBLE

**⚠ NOT SHIPPED. Not a line of `src/` is changed by this wave.** What follows is the curve, the
constant, and the bill.

### 5a. The formula, in the form he asked for

He asked for DnD: dice, plus skill, plus modifiers, and a player who can reason before rolling. **The
engine already has that shape and it is one line.** Measured, not designed:

```
P(she wins) = 1 / (1 + 10^(−ΔElo / 400))          ΔElo = 20.2 × (her core − his core)
```

Our match model reproduces that to within a point across the whole range – it is a clean logistic in
the core gap. **So the formula the owner wants can be printed on the screen tomorrow without changing
anything.** What is missing is the second half, which is what makes it *predictable from a ranking*:

```
her core ≈ C0 − s · log2(her rank)
```

Today `s` is not a constant – it is 0.36 at the head and 13.3 at #50/#100. **The proposal is to make
it one.** The sport pins the product:

```
20.2 Elo per core point  ×  s core per doubling  =  124.2 Elo per doubling   →   s = 6.15
```

where **124.2 = 400 · λ / ln 10** with λ = 0.7150, Klaassen & Magnus's own women's coefficient, and
independently corroborated at 116–138 by a straight-line fit to the live WTA Elo list
(`docs/research/the-upset-rate.md` §2c). **Two sourced instruments, thirty years apart, agree on one
constant.** That is what makes this a calibration and not a preference.

The change is therefore **in `src/engine/season/fieldPros.ts`, not in `src/engine/match/`**: replace
the eight uniform `core` bands with `core(rank) = C0 − s·log2(rank)` plus the existing `attrSpread`.
`match/` is left exactly as it is, because §3a and §3b say it is right.

### 5b. What that curve produces, against both tables

| favourite | underdog | ours today | **proposed** | K&M `[I]` |
|-----------|----------|-----------|--------------|-----------|
| #1 | #10 | 47.4% | **7.3%** | 8.5% |
| #1 | #100 | 7.8% | **0.2%** | 0.9% |
| #10 | #50 | 29.4% | **15.5%** | 16.0% |
| **#50** | **#100** | 21.1% | **33.1%** | 32.8% |
| **#50** | **#200** | 7.3% | **19.1%** | 19.3% |
| **#50** | **#300** | 4.3% | **12.9%** | 13.6% |
| #50 | #500 | 1.9% | **7.3%** | 8.5% |
| #100 | #300 | 18.3% | **24.4%** | 24.4% |
| #200 | #300 | 38.9% | **39.9%** | 39.7% |
| #500 | #1000 | 30.9% | **33.1%** | 32.8% |

### 5c. ⚠ THE ODDS ARE THE SAME FOR EVERY GAIN, AND THAT IS THE STRUCTURAL RESULT

Raising `SKILL_K`/`RALLY_K` and flattening the world's core curve are **the same move seen twice**:
the product is pinned, so the pair has exactly **one free parameter, and it is not the odds** – it is
where the core scale sits. Which means **the owner cannot be given "more skill influence" as a
number.** He can only be given a *shape*, and then choose where the scale lives:

| gain | 1 core = | s | #1 | #10 | #50 | #100 | #300 | #1000 | #1600 | +1 core is worth |
|------|----------|---|----|-----|-----|------|------|-------|-------|------------------|
| shipped | 20.2 Elo | *staircase* | 76.4 | 75.2 | 67.5 | 54.2 | 41.7 | 29.0 | 17.2 | 52.8% |
| ×1.0 | 20.2 Elo | 6.15 | 76.4 | 56.0 | 41.7 | 35.5 | 25.8 | 15.1 | 10.9 | 52.8% |
| **×1.5** | **30.3 Elo** | **4.10** | **76.4** | **62.8** | **53.2** | **49.1** | **42.6** | **35.5** | **32.7** | **54.3%** |
| ×2.0 | 40.4 Elo | 3.08 | 76.4 | 66.2 | 59.0 | 56.0 | 51.1 | 45.7 | 43.7 | 55.7% |
| ×3.0 | 60.6 Elo | 2.05 | 76.4 | 69.6 | 64.8 | 62.8 | 59.5 | 56.0 | 54.6 | 58.5% |

**`gain ×1.5` is the minimum-disruption row** and it is arithmetic, not taste: summed absolute core
movement across those seven ranks is 99.8 at ×1.0, **54.7 at ×1.5**, 71.9 at ×2.0. It leaves #300
almost exactly where it stands (41.7 → 42.6) – the ITF band the game actually plays in – and pays for
the head's new gradient by lowering the top 50 and lifting the bottom of the table.

**⚠ AND THE ANCHOR IS NOT FREE EITHER, WHICH IS WHY THE MIDDLE HAS TO MOVE.** `C0` is capped near 80
by `rollPotential`'s own maximum (p99 73.2, max 80.8 – `fieldPros.ts` argues at length that a world #1
above the achievable maximum is a backdrop nobody can climb). Today #1 = 76.4 and #50 = 67.5: 8.9 core
points across 5.64 doublings, where the sport wants 700 Elo and we have 180. **To buy the missing 520
Elo you must either raise the gain, which lifts the tail into her way, or lower the top 50, which is a
buff to her. There is no third option**, because the ceiling is already at the top of what a career
can become.

### 5d. THE BLAST RADIUS – the whole game, stated plainly

A match-model or population change moves every rung, every ranking and every career. Named, not
hedged:

1. **Every acceptance cut re-bites.** `enterPct` is a share of the merged table, and the table's
   points come off core through the storey lerp. `docs/specs/acceptance-cuts-2026-08.md` and
   `acceptance-cuts-corrected-2026-08.md` both have to be re-measured.
2. **The on-ramp is the thing most at risk, in both directions.** At ×1.0 the bottom 1,000 pros lose
   6–15 core points and a W15 becomes a walk; at ×2.0 they *gain* 16–27 and the reference junior's
   15–35% W15 title target dies. `tools/field-quality.ts` is the gate and it has to be re-run before
   any of this is believed.
3. **Ladder pace.** `docs/specs/points-economy-2026-08.md` and `ladder-pace-2026-08.md` calibrated
   "the climb takes as long as it does in life" against *this* core curve. At ×1.5 a core-57 build
   sits around #25 instead of ~#150 – a large acceleration through the middle that must be re-priced.
4. **Sponsors, prize money, the wall, the endings.** Everything keyed on rank moves when rank stops
   meaning what it meant.
5. **Saves.** No schema change (field pros are derived, zero persisted bytes – `fieldProsFor` is a
   pure function of seed and season), but **every existing career's world re-deals**, so the three
   frozen careers and the golden fixtures all move. `SAVE_SCHEMA_VERSION` need not bump; the frozen
   MAIN capture 41550 / `e6b0c709` is not touched, since `fieldPros.ts` takes no MAIN draw.

### 5e. ⚠⚠ WHAT IT COSTS THE PLAYER, HONESTLY – AND THE NUMBER HE HAS TO RULE ON

**The upset he says should be "rare but real" becomes three times more common than it is today.**
#300 over #50 goes from **4.3% to 12.9%**. That cuts both ways and the bad way is the one he will
feel: **the #300 who beats his #50 daughter also becomes three times more common.** A run at a W100
that today ends in an orderly seeding-order defeat will sometimes end in round one against nobody.

**The rate being aimed at is 12.9% at #50 vs #300 – about one match in eight – and it is the sport's
own, not a taste.** The alternatives, so the choice is a real one:

* **keep 4.3%** – ours today. Tidier, more predictable, and *less* like tennis than the sport is.
* **12.9%** – the sport's law as measured. What §5b produces.
* **anything in between** – reachable by scaling λ, and it is a legitimate design choice rather than
  a fudge: `[S-1]`'s own 75% base rate is 7–13 points above the modern game's `[S-3]`/`[S-4]`, so even
  the sourced constant carries an era in it.

**What he buys for that price** is the thing he actually asked for: **the top of the table stops being
a lottery.** #1 against #10 goes from a 47.4% coin flip to 7.3%, so arriving in the top ten will mean
something for the first time; a rank will predict a result everywhere on the ladder; and the formula
in §5a can be shown to the player, because it will finally be true.

**What he does NOT buy** – and this must not be oversold – **is any more influence for his own
decisions.** The college squad stays worth +0.17 points of match probability and the coach stays worth
+0.34, because those levers move 0.06 and 0.12 of a core point. At `gain ×1.5` they become +0.26 and
+0.51. **If the complaint is "my choices do not matter", this proposal does not fix it and nothing in
`match/` can** – that number lives in `development.ts`, and it is a different wave.

---

## 6. VERDICT ON THE PREDICTIONS

| | prediction | outcome |
|---|-----------|---------|
| P1 | compounding is correct, reproduces the literature | **HELD** – 4 of 4 to within 0.3 points |
| P2 | no clamp binds; incidence 0% | **HELD** – 0/40 worlds, 0 of 2.4 M points |
| P3 | at large rank gaps we are steeper than reality, upset < 5% at #50 v #300 | **HELD** – 4.3% against the sport's 11–14% |
| P4 | one core point ≈ 2 pts; Ines's +6.7 ≈ +13 pts, ~63% | **HELD, slightly under-predicted** – 2.84 and +18.3 pts (68.3%) |
| P5 | every lever she can pull is worth under one point | **HELD** – +0.17 and +0.34 |
| P6 | the fix is a gain and a floor | **HALF WRONG, and the wrong half is the finding.** It is a gain and a **slope**, and **no floor is needed** – a log law produces "rare but real" by itself. The gain alone cannot do it: the defect is a *shape*, and §5c shows the gain has no effect on the odds at all once the slope is pinned. |
