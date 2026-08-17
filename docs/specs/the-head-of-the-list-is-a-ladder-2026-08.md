# A proportional ladder of exclusion – measured, not proposed

**Round 21, 17.08.2026.** The owner, verbatim:

> «в моем понимании на 250й серии верхушки (топ 100) особо быть не должно, т.к. они все заняты на
> 1000+ и еще несколько 500 в год, и на 500, соответственно, должно быть тоже возможно выжить…
> Причем пропорционально.»

**Nothing is proposed here and no constant ships with this document.** He asked for a ladder with its
numbers; this is the ladder with its numbers, and the row is his to pick.

> ## ⭐⭐ HE PICKED — «давай 50», 17.08
>
> **`wta500.acceptsFromRank = 50` shipped**, beside the `wta250.acceptsFromRank = 64` already in.
> The ⭐⭐ row of §2: the 500 goes **43.2% → 55.1%** for a fixed #86, its field core 69.4 → 64.4, and
> the share of the draw stronger than her **67% → 42%**. The ladder is in the right order for the
> first time — 125 easiest, then 250, 500, Slam, with the 1000 hardest.
>
> **The cost, which he was told before he chose:** the WTA 1000 drops 44.9% → 40.9%.
>
> ⚠ **And one consequence that was NOT in the table below, found by a guard rather than by the
> sweep.** With a head at 50 the 500's window runs #50–120 while the 250's runs #64–200, so the two
> rungs now overlap across #64–120 and share **18 of 32** entrants where they shared under half
> before. `tests/season/tournament.test.ts` caught it as a red arm. It is not the old defect
> returning — that was fields of the same *strength* (core 68.4 / 68.9 / 68.4), and these are 60.5
> against 64.4, correctly ordered — so the personnel-count assertion was replaced by the two
> properties it had been standing in for: the higher rung draws the higher-ranked field, and each
> rung keeps a band the other cannot reach. Recorded here because a shared field is a thing he can
> see on screen, and he should not meet it as a surprise.

⚠ **The age grid is not restated here.** It is written out once, in
[`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

---

## 0. ⚠⚠ WHAT THE REAL MECHANISM IS, AND A DOOR IS NOT IT

**In the sport the top are absent from a WTA 250 because they are PLAYING SOMETHING ELSE that week.**
It is calendar occupancy, not an entry rule. A #12 is not refused a 250; she is at a 1000.

We already ship that idea **for her**: `MANDATORY_SLOTS` binds four Slams and seven WTA 1000s into her
counting book, so her calendar really is crowded from the top down. **The field professionals have no
schedule at all** – `fieldProsFor` derives a *population*, never a season – so there is nothing for
them to be busy with, and "who is elsewhere this week" has no representation to read.

⭐ **So `acceptsFromRank` is a PROXY, and this spec says so rather than letting the next reader assume
the model is the mechanism.** The honest version is a field-side calendar: give the professional
population a season, let the big events consume the top's weeks, and the 250's field empties by
itself with no cut anywhere. That is its own wave and a large one. A door is what we can afford now,
and its whole justification is that it produces the same *observable* – a 250 whose field is not the
1000's field – at a fraction of the cost.

⚠ The existing `wta250.acceptsFromRank: 64` already carries this sentence in its own comment: *"the
top fifty are not refused a 250, they are ELSEWHERE that week."* This document is that note extended
to a second rung, with the numbers he asked for.

---

## 1. HOW IT WAS MEASURED

`npx vite-node tools/head-ladder-sweep.ts -- --seeds 4 --weeks 470 --runs 300`, at commit `0101955`.

* **4 worlds × 470 weeks**, so the merged table and the professional population are the real ones.
* **The reference player is the professional actually STANDING at #86** in each world – his «мы
  говорим о 86 ракетке с хорошими статами» – read from the population rather than invented, and
  **held fixed across every row**. ⚠ If the player moved with the setting, a rung looking "easier"
  could just be a weaker entrant, which is the confound `tools/slam-difficulty.ts` exists to settle.
* **300 bracket replays per rung per ladder**, surfaces swept hard/clay/grass so no single court
  favours the build.
* `TierDef.acceptsFromRank` is patched **in memory and restored** – the same A/B idiom
  `tools/big-rung-odds.ts --head-sweep` uses. Nothing under `src/` is touched.

⚠ **The reference is not the same strength in every world** (core 70.8 / 60.3 / 71.0 / …): a #86 in a
weak world is a weaker player. That is why every cell is pooled across worlds and why the columns
should be read as a *shape*, not as absolute odds.

---

## 2. THE LADDER, MEASURED – P(past R1) for a fixed #86 build

| ladder (250 head · 500 head) | 125 | **250** | **500** | 1000 | Slam |
| --- | --- | --- | --- | --- | --- |
| pre-round-21 – both open | 75.5% | 47.6% | 43.0% | 44.6% | 53.0% |
| **SHIPPED TODAY – 64 · open** | 75.8% | **60.9%** | **43.2%** | 44.9% | 51.8% |
| 64 · 24 | 75.0% | 64.1% | 44.0% | 43.9% | 52.4% |
| 64 · 32 | 74.1% | 61.6% | 45.4% | 44.5% | 51.9% |
| ⭐ **64 · 40** | 75.1% | 60.0% | **49.8%** | 40.8% | 52.5% |
| ⭐⭐ **64 · 50** | 75.3% | 60.7% | **55.1%** | 40.9% | 54.3% |
| 64 · 64 | 74.8% | 63.4% | 58.9% | 43.5% | 53.7% |
| 80 · 32 | 76.3% | **74.6%** | 45.8% | 40.7% | 54.5% |
| 100 · 40 | 74.3% | **80.7%** | 49.5% | 41.5% | 53.4% |
| 100 · 50 | 75.3% | **79.3%** | 54.7% | 42.3% | 51.8% |
| 128 · 64 | 74.6% | **84.6%** | 62.8% | 42.0% | 51.7% |

**Field core, and the share of the draw stronger than her** (same rows, the two columns that say
*why*):

| ladder | 125 | 250 | 500 | 1000 | Slam |
| --- | --- | --- | --- | --- | --- |
| **SHIPPED (64 · open)** | 56.1 / 11% | 60.6 / 27% | **69.4 / 67%** | 68.4 / 64% | 63.3 / 45% |
| **64 · 50** | 56.1 / 10% | 60.5 / 27% | **64.4 / 42%** | 68.4 / 65% | 63.3 / 45% |
| 128 · 64 | 56.1 / 11% | **50.0 / 0%** | 60.5 / 27% | 68.4 / 64% | 63.3 / 46% |

---

## 3. WHAT THE TABLE SAYS

### 3a. ⭐ A 500 is NOT survivable today, and a 500 head is what fixes it

At the shipped setting a #86 wins her opening match at a 500 **43.2% of the time** – *worse than at
the WTA 1000 above it* (44.9%) and barely better than a coin flip against a field where **67% of the
draw is stronger than she is**. His «на 500 должно быть возможно выжить» is not met today.

**Raising the 500's head alone moves exactly that number and almost nothing else**: 43.2 → 45.4
(#32) → **49.8 (#40)** → **55.1 (#50)** → 58.9 (#64), with the share of the draw stronger than her
falling 67% → 42% at #50.

### 3b. ⚠⚠ MOVING THE 250'S HEAD WITH IT IS THE TRAP, AND THE FIRST SWEEP FELL IN IT

My first cut moved both heads up together on every row, on a literal reading of «пропорционально» –
and **every ladder that made the 500 survivable had pushed the 250 past #80, where the 250 becomes
EASIER than the WTA 125 below it** (74.6% against the 125's 76.3%, and at #100 it is 80.7% against
74.3%). At 128 · 64 the 250's field core is **50.0 with 0% of the draw stronger than her**: that is
not a tournament, it is a farm – the exact failure the shipped #64 was chosen to avoid.

⭐ **«Пропорционально» constrains only that the higher rung excludes the SMALLER slice. It does not
require the lower head to move at all.** Holding the 250 at the #64 that round 21 #4 already measured
and swept, and raising the 500's head alone, is both proportional (40 or 50 < 64) and the only region
where both of his criteria hold at once.

### 3c. ⚠⚠ AND HIS SECOND CRITERION IS ALREADY VIOLATED, BY A RUNG NO HEAD ON THIS LADDER TOUCHES

> *"the win rates should fall smoothly from 125 up to the Slam rather than dipping in the middle"*

**They do not fall smoothly in any row, and the break is not in the middle – it is at the top.** In
every single ladder, P(past R1) falls 125 → 250 → 500 → 1000 and then **RISES at the Slam**: 51.8%
against the 1000's 44.9%. The Slam's field core is **63.3 against the 1000's 68.4**, and only 45% of
a Slam draw is stronger than a #86 against the 1000's 64%.

⭐ **The cause is draw size and it is structural.** A WTA 1000 is a 64-draw taking the top 64; a Slam
is a **128-draw**, so it reaches roughly to #333 of the merged table and half of it is people a #86
beats. **A Slam is the easiest big rung to survive round one in, and the hardest to go deep in**
(P(QF+) 4.4% against the 1000's 8.8%) – which is exactly right for a 128-draw and exactly wrong for
his "smooth fall".

⚠ **No 250/500 head can fix this**, because neither rung is the one out of order. The candidates, none
of them measured here and none proposed:

1. **Give the Slam a head too** – it is the one rung whose regulation states a composition, so a head
   there is as sourceable as `acceptsRank: 112` was.
2. **Give the WTA 1000 a head** – it is currently the hardest opening round in the game, harder than a
   major, which is the inversion the eye actually notices.
3. **Leave it** – a 128-draw genuinely is easier to survive and harder to win, and the "dip" may be
   the model being right rather than wrong.

**This is a ruling he owes, and it is a different question from the one he asked.** It is here because
his acceptance test cannot be met by the ladder he asked for, and finding that out is what the sweep
was for.

---

## 4. THE ROWS, SCORED AGAINST HIS OWN TWO CRITERIA

Criteria written before the sweep was read: **(A)** a 500 is survivable – P(past R1) at or above
~50%; **(B)** the 250 stays harder than the 125 below it, or it is a farm.

| ladder | (A) 500 survivable | (B) 250 not a farm | verdict |
| --- | --- | --- | --- |
| SHIPPED 64 · open | ✗ 43.2% | ✓ 60.9 < 75.8 | today: the 500 is a wall |
| 64 · 32 | ✗ 45.4% | ✓ | not enough |
| ⭐ **64 · 40** | ~ **49.8%** | ✓ 60.0 < 75.1 | **the conservative pick** |
| ⭐⭐ **64 · 50** | ✓ **55.1%** | ✓ 60.7 < 75.3 | **meets both with room** |
| 64 · 64 | ✓ 58.9% | ✓ | 500 and 250 now equal – the pair stops being a ladder |
| 80 · 32 | ✗ | ✗ 74.6 ≈ 76.3 | 250 becomes a farm |
| 100 · 40 | ~ | ✗ 80.7 > 74.3 | 250 is a farm |
| 100 · 50 | ✓ | ✗ 79.3 > 75.3 | 250 is a farm |
| 128 · 64 | ✓ | ✗ 84.6, 0% stronger | not a tournament |

⭐ **Two rows survive both criteria: `250 #64 · 500 #40` and `250 #64 · 500 #50`.** The second meets
"survivable" with room and still leaves the 500 clearly harder than the 250 (55.1% against 60.7%);
the first is the conservative half-step. **Neither is shipped and neither is recommended here – the
owner picks.**

⚠ **What a 500 head would cost elsewhere, and it is not measured in this document**: `wta500.acceptsRank`
is 120 and the Slam's is 112, so the 500 and the Slam already share almost one door. Adding a head at
#40–#50 makes the 500's entry list `#40…#120` – 80 places of a 32-draw – which is a real narrowing and
wants its own `ladder-baseline` run before anything ships.
