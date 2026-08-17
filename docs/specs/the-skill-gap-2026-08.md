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
whole measurement is a read of the code as it stands. The bench is `tools/skill-gap-odds.ts`, first run
at commit **`5ad87f1`** and **re-run at `82b16b8`** on `wave/round21` – the two runs are
**byte-identical**, which is what makes the second commit's dead-code removal provably invisible to
the numbers. Both commits are this agent's own, with the other agent's college work already in the
tree and untouched by either. The proposal in §5 is computed **inside
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

## 5f. ⚠ HE RULED: SHIP IT. His words, and the two things they change about this document

> «я хочу, чтобы "верх таблицы перестаёт быть лотереей" произошло… у игрока с силой 16 и броском 20
> есть шансы против игрока с силой 25 и таким же дайсом д20 в руках. У нас тоже есть сила, тренер,
> выезд тренера и прочее. И в данный момент складывается ощущение, что рейтинг в статистике и таблице
> ничего не значит, а хотелось бы, чтобы значил. Сделай как считаешь нужным пожалуйста, **шансы
> выиграть должны быть у всех, но не у всех одинаковые**.»

**Shipped: `gain ×1.5`, `s = 4.10`, `C0 = 76.4`.** The pair is chosen because it is the
minimum-disruption one by summed core movement (54.7 against 99.8 at ×1.0 and 71.9 at ×2.0), not
because it reads best – §5c is the arithmetic. He accepted the upset tripling to 12.9% with his eyes
open.

**⚠ THE FIRST HONEST COST: A CONSTANT SLOPE CANNOT REPRODUCE THE REAL TOP TEN, AND WE ARE TAKING THE
LAW ANYWAY.** The live Elo list says #1 against #10 is nearly even (Route B: 41.6% upset); the
124-per-doubling law says 8.5%; we ship 7.3%. **So the top of our table becomes STEEPER than the
modern sport's, not merely less flat than ours was.** That is the price of a rule a player can
compute, and it is deliberate: a slope that bends to match the real top-ten compression is a slope
nobody can hold in their head, which is the request. Stated here so it is never discovered later and
called a regression. It also means the sport's own #1-vs-#10 is the one cell where we are knowingly
wrong, and the direction is "the champion is too good".

**THE SECOND: HIS d20 IS THE ACCEPTANCE TEST.** Strength 16 against strength 25 must still win
sometimes, and the chance must be **readable before the roll**. Delivering the maths without the
screen is delivering half the request – §7 is that half.

---

## 6. THE SHIPPING PREDICTIONS, WRITTEN BEFORE THE IMPLEMENTATION

Committed before a line of `src/` moved. **The change is smaller than §5d feared, and S1 is why.**

**S1 – ⚠ THE RANKING TABLE DOES NOT MOVE AT ALL.** A pro's points come from `pointsForCore`, which
reduces to `pLo + (pHi−pLo)·u^gamma` where `u` is her one uniform band draw – **the core VALUE never
enters it**. So if the draw is kept and only the core value is replaced, every pro's `wtaPoints` is
byte-identical, `mergedWtaRanking` is byte-identical, and **every acceptance cut admits exactly the
same population**. Predicted: identical points at #1…#1600, identical ranks, identical cuts. If this
fails, the implementation is wrong, not the theory.

**S2 – the frozen MAIN capture does not move.** `fieldPros.ts` takes no MAIN draw and the change adds
none; the gain constants are pure arithmetic inside `basePServe`. Predicted 41550 / `e6b0c709`
unchanged. **Checked, not assumed.**

**S3 – the upset table lands on §5b.** #1 v #10 → 7.3% ±1.5 · #50 v #100 → 33% ±2 · #50 v #200 →
19% ±2 · **#50 v #300 → 12.9% ±1.5** · #200 v #300 → 40% ±2.

**S4 – no clamp binds, still.** The widest gap the new curve can produce is #1 (76.4) against #1600
(32.7) = 43.7 core × 0.00405 = 0.177 of p, so `pA = 0.747`, inside `BASE_CLAMP`'s 0.82. Predicted 0
incidence again.

**S5 – the ladder tilts: the head gets much easier, the on-ramp slightly harder.** The top 50 lose
14 core points and #100 loses 5, while everything past #365 – which is where W15 draws from – **gains**
3 to 4. Predicted: the reference build's **W15 title probability FALLS** from ~20% to 12–17%, and her
finishes at W100/WTA 125 **improve sharply**.

**S6 – careers accelerate through the middle and the top.** Predicted: median peak rank improves by
**at least 40 places**, and the improvement is bigger the further up the career already went, because
the core the table demands at #50 falls from 67.5 to 53.2.

**S7 – the three frozen careers move, on match-outcome keys only.** No schema key, no `rngMain` key.

## 6a. ⚠⚠ AND THEN THE OWNER OVERRULED THE REFERENCE, AND THE DIAGNOSIS REVERSED

**Before a line of §6's plan was measured, he ruled again:**

> «"расчёт по живому рейтингу Elo на август этого года" – вот это же супер-ценная и актуальная
> информация, **нам не нужно доминирования, как в 90х**.»

**He is right and the plan in §5f was wrong.** `gain ×1.5, s = 4.10` was calibrated to Klaassen &
Magnus's 124.2 Elo per doubling – a coefficient fitted on **Wimbledon 1992–95**, the most top-heavy
window the women's game has had. Measured against the live 2026 list it would have fixed #1 v #10 and
made **every other row worse**. That is 1990s dominance, and it is what he had just refused.

**⚠ AND THE ERROR RAN DEEPER THAN THE CHOICE OF INSTRUMENT: OUR OWN LIVE-ELO COLUMN WAS WRONG.**
§2c's first cut read the report by hand, as "the median Elo within ±12 ranks" – a window that averages
the world #1 with #2–#13. It printed **#1 = 2058**; the actual figure is **2194.6**, and the headline
row halved as a result:

| | first cut (±12 by hand) | corrected (547 pairs parsed) |
|---|---|---|
| #1 vs #10 upset | 41.6% | **23.9%** |
| #1 vs #50 upset | 17.3% | **9.0%** |

So the re-aim came with a re-parse: the whole report is now in
`docs/research/raw/2026-08-17-wta-elo-by-rank.json` – **547 (rank, Elo) pairs, no player names**
(CLAUDE.md forbids making real surnames constructible) – and `tools/skill-gap-odds.ts` re-derives the
reference from that file rather than importing our own constant, so an edit to the engine's anchors
cannot silently move the target.

### ⚠⚠ WHAT FITTING THE LIVE CURVE DID TO THE CHANGE: IT MADE IT SMALLER, AND IT KILLED THE GAIN LIFT

Priced at the **shipped** gain (20.2 Elo per core point), our table's Elo profile relative to #1
already tracked the live list from #100 down – −633 against −665 at #200, −701/−755 at #300,
−823/−875 at #500, −958/−995 at #1000. **From #100 to the bottom we were already right, and `×1.5`
would have broken the only part that was.** The whole defect is #1–#100: too flat from #1 to #50
(180 Elo where the live list has 403) and a cliff from #50 to #100 (269 where the live list has 91).

**So `SKILL_K`, `RALLY_K` and `PACE_K` are UNTOUCHED and `src/engine/match/` does not change at all.**

### WHAT SHIPPED

`SKILL_LAW` in `src/engine/season/fieldPros.ts`: the live list's own binned-median curve, interpolated
in log2(rank), with `core(rank) = 76.4 + (Elo(rank) − 2195) / 20.2`.

| rank | #1 | #10 | #25 | #50 | #100 | #200 | #300 | #500 | #1000 | #1600 |
|------|----|----|----|----|------|------|------|------|-------|-------|
| **shipped** | 76.4 | 65.5 | 61.0 | 56.4 | 51.9 | 43.6 | 38.4 | 33.4 | 27.5 | 22.7 |
| was | 76.4 | 75.2 | 70.9 | 67.5 | 54.2 | 45.1 | 41.7 | 35.7 | 29.0 | 17.2 |

⚠ **One uniform draw, two jobs, and that is what keeps the blast radius small.** `u` – the shipped
draw, in the shipped position on the shipped stream – still decides her POINTS exactly as before
(`pointsForCore` reduces to `pLo + (pHi−pLo)·u^gamma`, so the core VALUE never entered it). Her
STRENGTH now comes from her implied standing, which is derived from the same `u` rather than drawn
again – if it were a fresh draw the correlation between skill and points would be **zero inside every
storey**, which is the exact defect this wave exists to remove.

## 7. SHIPPED – PROVENANCE, AND WHAT THE ARMS MEASURED

**B arm** = commit `a412162` (the law) as it stands at `b02537c`, in worktree `tb-B`.
**A arm** = the SAME commit `b02537c` with `git revert --no-commit a412162` applied in worktree
`tb-A`, then `tools/` and `docs/` restored from `b02537c` so both arms run the identical bench.
Reader check on A: `grep -c coreForStanding src/engine/season/fieldPros.ts` returns **0**, and the
shipped uniform draw `const core = cLo + rng() * (cHi - cLo)` is present. Reader check on B: the
constant is there and read.

⚠ **NEITHER ARM IS THE SHARED CHECKOUT, and that is not pedantry** – midway through this wave the
other agent's tree went dirty in `development.ts` and `world.ts`, both of which a career bench walks.
The first career run was launched against it and is discarded unread.

### 7a. THE ACCEPTANCE TEST – his five rows, against the live 2026 list

| favourite | underdog | LIVE + spread | **A (before)** | **B (shipped)** |
|-----------|----------|---------------|----------------|-----------------|
| #1 | #10 | 24.7% | 47.4% | **31.3%** |
| #50 | #100 | 38.0% | 21.1% | **39.3%** |
| #50 | #200 | 19.9% | 7.3% | **19.8%** |
| #50 | #300 | 12.5% | 4.3% | **10.1%** |
| #200 | #300 | 37.2% | 38.9% | **33.6%** |
| **mean absolute miss** | | | **12.44 pts** | **2.79 pts** |
| **over all 17 pairs** | | | **7.36 pts** | **2.44 pts** |

**Four of the five land inside 3.6 points. The fifth – #1 v #10 – is the one that is still off, at
+6.6**, and it is off in the direction the owner asked for rather than against it: our champion is
still too beatable, not too dominant. The residual cause is measured: `FIELD.jitter` and `careerArc`
move a chair's POINTS by up to ±10% and by her age, so the player who ends up ranked #1 is not always
the strongest core in the world – the noise that makes an upset possible also blurs the very top.

### 7b. THE MECHANISM, RE-MEASURED – seven of eight segments now inside 6%

Elo per doubling of rank, ours against the live list's own local slope:

| segment | A (before) | **B (shipped)** | LIVE | B vs LIVE |
|---------|-----------|-----------------|------|-----------|
| #1→#10 | 7 | **46** | 60 | ×0.76 |
| #10→#50 | 67 | **83** | 86 | ×0.96 |
| #50→#100 | 269 | **88** | 90 | ×0.98 |
| #100→#200 | 183 | **162** | 171 | ×0.95 |
| #200→#300 | 116 | **190** | 179 | ×1.06 |
| #300→#500 | 165 | **140** | 136 | ×1.03 |
| #500→#1000 | 135 | **118** | 119 | ×0.99 |
| #1→#1000 | 96 | **93** | 99 | ×0.94 |

The staircase is gone: the flat top (×0.06) and the cliff (×2.16) are both within 4% of the sport.

### 7c. ⚠⚠ AND THE THING HE MUST RULE ON: THE CAREER ACCELERATED, HARD

`tools/ladder-baseline.ts --seeds 10`, both arms, same seeds and policy:

| | A (before) | **B (shipped)** |
|---|---|---|
| median WTA rank at 19 | #171 | **#126** |
| median WTA rank at 21 | #163 | **#23** |
| median WTA rank at 25 | #152 | **#18** |
| **median career high** | **#97** | **#12** |
| p25 career high | #58 | **#7** |

**S6 predicted "at least 40 places". It is 85, and that is not a rounding – it is a different game at
the top.** `tools/big-rung-finishes.ts --seeds 6` on the B arm: WTA 250 **title 15.4%, QF+ 46.6%**;
WTA 500 title 9.4%; WTA 1000 title 5.1%.

**⚠ IT IS NOT AN ODDS ERROR, AND THE ARITHMETIC PROVES IT RATHER THAN EXCUSING IT.** This file's own
population note records `rollPotential`'s measured output: the mean-of-four a career can reach is
**p50 63.2 · p90 68.8 · p99 73.2 · max 80.8**. Feed those into the shipped law and a **median-talent
career peaks at world #15** – against a measured median career high of **#12**. The Monte-Carlo and
the closed-form agree, so this is exactly what the game's own potential distribution has always
implied. **The old table hid it by making all 64 of the top storey superhuman (core 67–77 drawn
uniformly). Honest strengths did not break the ladder – they exposed that the ladder was calibrated
against an inflated top.**

### 7d. THE DIAL, AND WHY IT IS HIS AND NOT MINE

`(SKILL_K, RALLY_K, PACE_K)` and `SKILL_LAW.eloPerCore` scale **together**, by construction – the
product is what the sport pins, so **the odds in §7a are invariant to this choice**. What it moves is
where her own scale sits against the world:

| k | #1 | #10 | #50 | #100 | #300 | #1000 | #1600 | a median-talent career peaks at |
|---|----|----|----|------|------|-------|-------|--------------------------------|
| **×1.0 (shipped)** | 76.4 | 65.5 | 56.4 | 51.9 | 38.4 | 27.5 | 22.7 | **world #15** |
| ×1.5 | 76.4 | 69.1 | 63.1 | 60.1 | 51.1 | 43.8 | 40.6 | world #48 |
| ×2.0 | 76.4 | 70.9 | 66.4 | 64.2 | 57.4 | 52.0 | 49.6 | world #118 |
| *the old staircase* | 76.4 | 75.2 | 67.5 | 54.2 | 41.7 | 29.0 | 17.2 | *measured #97* |

**⚠ AND THERE IS NO k THAT FIXES IT, WHICH IS WHY IT IS A DECISION AND NOT A TUNING.** `×2.0` would
restore the old ladder pace almost exactly (#118 against a measured #97) – **and it lifts #1600 from
core 17.2 to 49.6**, making the bottom of the table nearly as strong as the old #100 and burying the
W15 on-ramp. The old shape was wrong at *both* ends: the live sport puts **41%** of the #1→#1000 Elo
span above #50 and we put **19%**. Fixing the shape has to move one end or the other.

**The three honest options, in the order I would put them to him:**

1. **Keep `k = 1` and re-tune her development** – `rollPotential`'s bands, so a median career peaks
   around #100 as it used to. This is the option that keeps the world honest and admits the real
   defect is that a median-talent girl was always built to be a top-15 player. **It is a separate
   wave** and it moves every progression number in the game.
2. **`k = 2`** – the old pace back at the top, the on-ramp destroyed. Would need `entrantPctBand`
   re-derived for every W rung.
3. **Ship as is and let the ceiling be low.** Careers reach the top ten. He may simply like that.

**Nothing is tuned away here.** The world's odds are the sport's, and where the player's ladder sits
inside them is a design question with his name on it.

## 8. VERDICT ON THE PREDICTIONS


| | prediction | outcome |
|---|-----------|---------|
| P1 | compounding is correct, reproduces the literature | **HELD** – 4 of 4 to within 0.3 points |
| P2 | no clamp binds; incidence 0% | **HELD** – 0/40 worlds, 0 of 2.4 M points |
| P3 | at large rank gaps we are steeper than reality, upset < 5% at #50 v #300 | **HELD** – 4.3% against the sport's 11–14% |
| P4 | one core point ≈ 2 pts; Ines's +6.7 ≈ +13 pts, ~63% | **HELD, slightly under-predicted** – 2.84 and +18.3 pts (68.3%) |
| P5 | every lever she can pull is worth under one point | **HELD** – +0.17 and +0.34 |
| P6 | the fix is a gain and a floor | **HALF WRONG, and the wrong half is the finding.** It is a gain and a **slope**, and **no floor is needed** – a log law produces "rare but real" by itself. The gain alone cannot do it: the defect is a *shape*, and §5c shows the gain has no effect on the odds at all once the slope is pinned. |
