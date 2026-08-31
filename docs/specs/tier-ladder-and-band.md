---
type: spec
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-31
---

# The tier ladder and the field-strength band – measured (31.08.2026, round 31 #3)

Two defects the owner reported on the same card, filed as one task because they turned out to have
one cause. `docs/rounds/round-31.md` #3 states them:

> **(a)** Measured on his w896 save, a Local Open reads a **43%** first round and a World Tour 1000
> a **69%** one. «A neighbourhood tournament should be the easiest thing on her calendar and is
> instead the hardest.»
>
> **(b)** `strengthOf` counts the share of the drawn field ranked above her. On w933 she sits **199
> of 200** in the ITF table, so every junior and domestic card reads `strong` and the promise probe
> reports `DEGENERATE: only one band occurs in these careers`.

⚠ The round filed two candidate causes for (a) and said neither was established: *the local pool is
not strength-capped to its tier*, and *seeding protection may fail on small draws*. **Both are
refuted below.** The real cause is a third thing, it is the cause of (b) as well, and it is not a
constant that needed retuning.

⭐ **§4 is a fix that was predicted, shipped in a branch, and MEASURED TO DO NOTHING for defect (b).**
It is kept here for the same reason `rank-plateau.md` keeps its own: the prediction was falsifiable
and got falsified, and the second answer only became visible because the first one was measured
instead of assumed.

**Instruments.** `tools/r31-tier-ladder.ts` (new – the decomposition), `tools/r31-draw-stability.ts`
(round 31 #4's acceptance harness, re-run here), the owner's 25 personal saves read **read-only**,
and `tests/tier-ladder-and-band.test.ts` (the mechanical net, mutation-verified against
`origin/main`).

---

## 1. The inversion reproduces, and it is not small-sample noise

`tools/r31-tier-ladder.ts` reads every upcoming card through `upcomingEvents` – the same call the
Season screen makes – and reproduces the round's table on the w896 save exactly: Local 1865/43%,
Regional 1783/54%, National 1504/86%, J30 1610/75%, W15 1315/95%, W500 1744/61%, W1000 1676/69%.

Pooled over **six fresh careers ticked to week 950**, sampling every card every eighth week from
week 500 (9,826 cards), the domestic ladder on the shipped engine runs

| rung | mean first-round chance |
| --- | --- |
| Local Open | **66%** |
| Regional Championship | **71%** |
| National Series | **82%** |

⚠ **Upside down over 2,255 cards.** It is a property of the world, not of one save.

⭐ **AND IT IS INVISIBLE AT WEEK ZERO, WHICH IS WHY THE SUITE NEVER CAUGHT IT.** The same sweep over
**8 careers × 120 weeks** reports **0 inversions** in both the domestic and the ITF family. Two
tests in `tests/preview.test.ts` have asserted the ladder's shape since wave 2 (*"a stronger tier is
a harder field: J30 reads worse than Local"*) and both are green and both are true – at week zero.
The defect needs about **400 weeks**.

---

## 2. Why it needs 400 weeks: the conveyor is doing its job

`season/conveyor.ts` replaces every departure with a fresh thirteen-year-old and keeps a
professional alive for *"~9 seasons of mean career, **which is what makes half the field adults in
the steady state**"*. That is a design decision, not a defect, and the owner's w933 cohort is
exactly it:

    COHORT AGE, w933   13:17  14:34  15:25  16:15  17:12  18:17  19:8  20:7  21:16
                       22:10  23:4   24:8   25:5   26:2   27:7   28:1  29:3  30:6  31:2

Now read the junior standings against that population, on the same save:

| age band | mean ITF percentile | mean rating |
| --- | --- | --- |
| 13-14 | 0.72 | 1597 |
| 15-16 | 0.28 | 1623 |
| 17-18 | **0.16** | 1700 |
| 19-20 | **0.76** | **1825** |
| 21-22 | 0.65 | 1779 |
| 23-24 | 0.56 | **1827** |
| 29-30 | 0.43 | **1856** |

⭐⭐ **THE BOTTOM OF THE JUNIOR TABLE IS WHERE THE STRONGEST PLAYERS IN THE WORLD LIVE.** The J rungs
are U18 (`TierDef.maxAgeYears`, §4.1), so a player who ages out stops earning ITF points and her
existing ones expire out of the 52-week window – while her rating keeps climbing to a peak at 28.
An adult in this world is a strong player with no junior ranking.

**So a percentile window on that table cannot cap strength.** Measured as a Spearman between a
player's standings POSITION and her actual `ratingOf`, over the cohort on w933:

| table | ρ(position, rating) |
| --- | --- |
| **ITF – what the preview was using** | **0.106** |
| `aiSelectionRanking` – what the BRACKET uses | 0.533 |
| domestic | 0.591 |
| WTA (merged) | 0.635 |
| (a table sorted by `power` itself, for scale) | 0.856 |

And the six junior/domestic entrant pools, which are supposed to be a ladder, measured **1683 /
1734 / 1703 / 1689 / 1640 / 1727** – an 87-point spread with no order in it.

### Both of the round's candidate causes are refuted by the same run

- **"the local pool is not strength-capped to its tier"** – half right, and not for the reason
  guessed. The pool *is* windowed to the bottom 45% of the standings, exactly as `local`'s comment
  says. The window simply selects a slab of a table that does not sort, and `selectEntrants` then
  fills the draw from the **top of that window by position** – which, at percentiles 0.56-0.65, is
  precisely the adult block rather than the children at 0.72+. Hence a Local Open drawn at **mean
  age 23.5 and mean rating 1816** at a rung whose own comment calls it *"the draw a kid can
  genuinely win her first title in"*.
- **"seeding protection may fail on small draws"** – **refuted.** `seedsFor` is `drawSize / 4` and
  each seed's round-one neighbour is exactly one unseeded slot, so the share of first-round
  opponents who are seeds is `seeds / (drawSize − seeds)` = **1/3 at a draw of 8, 16, 32 and 64
  alike**. The measured `seedOpp` column varies only with sample size. Small draws are not the
  mechanism.

⚠ **AND THE FIX IS NOT AN AGE CEILING ON THE DOMESTIC RUNGS,** which is where this investigation
went first. `calendar.ts` already answers it, in the note that carries `j30.maxAgeYears`: *"The
number lives on all three J rungs and nowhere else – the domestic ladder is OURS, not the ITF's, and
**stays open at every age because it is where an adult who is not good enough still plays** (owner's
call 2, §6)."* The adults belong in a Local Open. What does not belong is a Local Open being filled
with the best of them.

---

## 3. The cause: the card and its own bracket were reading different tables

`world/phaseHerWeek.ts`'s `computeShadowTournament` – the code that plays the tournament – has taken
**two** ranking tables since round 21 #4, and its own comment says why:

> *"Who TURNS UP must not depend on her … Where SHE STANDS among them must depend on her and on
> nothing else – it is the acceptance list's own question, and `rankingFor` is the table every other
> surface answers it with, so the draw now agrees with the Season card instead of contradicting it."*

So the bracket selects candidates on `aiRanking` (ρ 0.53) and seeds her on
`rankingFor(world, TIERS[event.tier].track)`. **`previewEvent` was handed ONE table for both roles,
and for every non-W card that table was `fullRanking` – the ITF one, ρ 0.11.** The card was
previewing a Local Open field of mean rating 1829 that the tournament was never going to field.

### What changed

- `world/weekField.ts` exports **`aiSelectionRanking`**, lifted out of `deriveWeekField`
  byte-for-byte, so the screen and the bracket read one fold rather than two that agree.
- `world/snapshot.ts`'s `upcomingEvents` hands `previewEvent` that table for WHO TURNS UP, and
  `rankingFor(world, TIERS[e.tier].track)` – memoised, at most three folds – for WHERE SHE STANDS.
- `previewEvent` takes `standing` as an optional sixth parameter, `?? ranking`, so every other
  caller (benches, older tests) is byte-identical. `kidSeedIndexIn` and `opponentRank` read it.
- ⚠ **The W branch is byte-identical by construction**: `standing` there resolves to the very table
  the W cards were already passed.

**Nothing persisted, no constant moved, no stream touched.** `previewEvent` is read-only, so no
career hash and no MAIN draw can move – proven, not asserted, in §6.

### Result (a): the ladder sorts

Same sweep, 6 careers × 950 weeks, 9,826 cards, before and after:

| rung | before | after |
| --- | --- | --- |
| Local Open | 66% | **80%** |
| Regional Championship | 71% | **76%** |
| National Series | 82% | **72%** |
| Junior Tour 30 | 82% | 79% |
| Junior Tour 60 | 81% | 78% |
| Junior Tour 300 | 78% | 79% |

**Domestic inversions 2 → 0.** On the owner's w896 save the Local Open goes **43% → 75%**, and on
w933 **46% → 69%**. Across all 25 of his saves the domestic family goes from 1 inversion to 0.

The entrant POOLS become a ladder for the first time: **1620 / 1665 / 1695 / 1732 / 1761 / 1805**
across local → j300, monotone, against the 87-point scatter in §2. And a Local Open is drawn at mean
age **17.9** instead of 23.5.

---

## 4. ⚠ THE PREDICTION FOR DEFECT (b) THAT WAS MEASURED DOING NOTHING

**Predicted:** the band reads `strong` on every junior card because it counts her place in the ITF
table, where she is 199 of 200. Give it the tier's own track's table – the one the bracket seeds her
off, which for a DOMESTIC event is the domestic table – and the band discriminates again.

**Measured, w933, after the §3 change and with the band still reading a standings table:**

    local  s100%   regional s100%   national s100%   j30 s100%   j60 s100%   j300 s100%

**No movement at all.** The prediction was wrong for a reason the first look had not checked:

    itf       position 199 of 200   rank 80
    domestic  position 199 of 200   rank 200
    wta       position  68 of 1800  rank 69

She is at the bottom of the **domestic** table as well. At 31 she has left both junior ladders, and
**a card cannot read her place in a table she is no longer in.** The §3 change is right and it fixed
the SEEDING – it is simply not this defect's fix.

### The actual answer: count who is better, not who is ranked higher

`strengthOf` now counts the share of the drawn field whose **`ratingOf` on this event's surface**
exceeds hers. The thresholds `0.75` / `0.35` **did not move one point.**

⚠⚠ **This is not the threshold re-scale the round forbade, and the difference is the whole of §2.**
The bands were never mis-cut; they were applied to a quantity that does not measure the thing – no
table in the game scores above ρ 0.64 against actual strength, and a wider threshold on a bad proxy
only spreads the labels out over noise. `ratingOf` is not a proxy: it is what `fastMatchProbability`
plays the match with and what `kidRating` / `opponentRating` already quote on the same card. The
file's own rule was *"one source, two readings, so the card can never quote a rating that disagrees
with the ring beside it"*; the band is now the third reading of that one source.

---

## 5. Band versus ring – the claim, and it is the one that had to be checked

⚠ The round's warning: *"a card that says `favourite` and then shows a 24% first-match chance is a
new defect."* Measured across **all 25 of the owner's saves, 618 cards**, on both arms:

| band | before: n / mean ring / contradicts | after: n / mean ring / contradicts |
| --- | --- | --- |
| `favourite` | 276 / 84.9% / **4.3%** | 595 / 80.3% / **4.4%** |
| `even` | 16 / 72.8% / 0% | 22 / **49.8%** / 0% |
| `strong` | 326 / **73.2%** / **89.6%** | 1 / **32.9%** / **0%** |
| ordering `favourite ≥ even ≥ strong` | **FAILS** | **HOLDS** |

⭐⭐ **The shipped card contradicted its own ring on 89.6% of the cards that said `strong`** – it
said *most of this field is ranked above her* beside a percentage saying she wins, on nine cards in
ten. After the change that is **0%**, and the residual 4.4% on `favourite` is the honest one: the
band is a statement about the FIELD and the ring is about the one girl she drew out of it, so a
favourite can draw the strong one. The three bands now read 80% / 50% / 33% – a 47-point spread.

### Band distribution, and what it does and does not show

| population | before | after |
| --- | --- | --- |
| 9,826 cards, 6 careers × 950 weeks | strong **100%** | favourite 96.6% · even 3.2% · strong 0.2% – **all three occur** |
| 618 cards, the owner's 25 saves | favourite 44.7% · even 2.6% · strong 52.8% | favourite 96.3% · even 3.6% · strong 0.2% – **all three occur** |
| his 177 cards that are ENTERABLE | favourite 66.1% · even 7.3% · strong 26.6% | favourite 94.9% · even 5.1% · **strong 0%** |

⚠ **STATED PLAINLY BECAUSE IT IS THE ONE ROW THAT DID NOT IMPROVE: `strong` does not occur on an
enterable card in any of the owner's saves.** Two things about it, and neither is a reason to move a
threshold:

1. **The `strong` it replaced was not information.** 89.6% of those cards contradicted their own
   ring (the table above). A band that fires on the right proportion of cards for the wrong reason
   is worse than one that fires rarely for the right one.
2. **His careers are of a very strong player.** Her rating across those 25 saves is 1882-1925
   against fields of 1377-1857; on 96% of cards she genuinely is the favourite, and the ring agrees
   at a mean of 80%. `strong` requires a field that outrates her, which for him happens at a WTA
   1000 (the one `strong` card, ring 32.9%).

`tests/tier-ladder-and-band.test.ts` therefore reads the world from **two vantage points** – the
girl a career actually grew, and the same five skills scaled to 0.72 – so both ends of the band are
exercised and the ordering claim has content from both.

### ⚠ What is NOT fixed, and is filed rather than asserted

**The ITF family still inverts at its top: a J300 reads 62% against a J60's 57%** (n=40, persistent
across sample sizes, so not noise). The cause is a different one and this wave does not touch it:
`ECONOMY.availability.minConditionToEnter.j300` is the highest floor in the game and the top quarter
of the field is the most exhausted, so only **36-82%** of a J300's own entrant window is fit in a
given week and `selectEntrants`' backfill fills the rest from BELOW – **66% of a J300 draw on the
owner's w896 save**. That is the *"a wrecked elite hands its slots to the tier below"* path working
exactly as its own comment describes. Unwinding it is a balance change needing its own bench and its
own owner call, so `tests/tier-ladder-and-band.test.ts` claims monotonicity for the **domestic**
family only and says so in as many words.

Two smaller ones, both pre-existing and both unchanged by this wave: `slam` reads easier than
`wta1000` (65% vs 61%), and `w15` reads far easier than `j300` – the latter is the cross-family step
`CROWD_BANDS` is banded on and is intended.

---

## 6. Invariant 2 – nothing moved that must not move

- **The frozen capture (41550 draws / hash `e6b0c709`)** – re-derived green in
  `tests/condition.test.ts`. Untouched **by construction**: `previewEvent` and `strengthOf` are pure
  reads and the only stream in this file is `seed:kidtour:<eventId>`, consumed in the same order and
  to the same depth it always was. `aiSelectionRanking` is a fold over the ledger with zero draws.
- **Every career hash** – `tests/coach-travel-edge.test.ts` and its `-older-schemas` sibling green,
  all eighteen constants unmoved. Also by construction: `upcomingEvents` is a SNAPSHOT reader,
  asserted mutation-free by `tests/preview.test.ts`'s *"computing it does not advance the career"*,
  so a change confined to the preview cannot reach `walkFrozenCareer`'s world at all.
- **No schema move.** `SAVE_SCHEMA_VERSION` stays at 67; nothing is persisted.
- **Round 31 #4's acceptance harness** – `tools/r31-draw-stability.ts`, re-run against this change
  merged onto `r31b/draw-reveal`: still **0 of 24** tournaments change their round-one opponent.
  ⚠ The band is **3 of 24**, not 0 – §7.

---

## 7. ⚠ THE ONE NUMBER THAT GOT WORSE, AND WHY IT IS THE PRICE RATHER THAN A DEFECT

`tools/r31-draw-stability.ts` watches the owner's w933 save for six weeks and asks whether a
tournament ever showed two different bands. Merged onto `r31b/draw-reveal`:

| | opponent changes | band changes |
| --- | --- | --- |
| `r31b` alone | 0 of 24 | **0 of 24** |
| `r31b` + this wave | 0 of 24 | **3 of 24** |

**Stated plainly: this wave moves that number from 0 to 3, and the acceptance criterion asked for 0.**
The three are `wk937 Regional`, `wk939 World Tour 250` and `wk940 Junior Tour 300`, each flipping
once or twice between the ADJACENT bands `favourite` and `even` – about **5 changes in ~120
week-to-week steps, 4.2%**. Nothing ever crosses from `favourite` to `strong`.

⚠⚠ **THE 0 IT REPLACES WAS BOUGHT WITH THE DEGENERACY THIS WAVE EXISTS TO FIX.** On the shipped
engine every junior and domestic card reads `strong` – 9,826 of 9,826 in the deep sweep – and a
constant is trivially stable. r31b's §6 says as much about its own synthetic arm: *"A value that only
ever takes one value cannot be observed to move."* The same sentence applies to the save arm on the
six rungs that carry the complaint.

**The cause is the preview, not the band.** `drawnField` rebuilds the field on every read from
today's standings and today's availability, which `preview.ts` has documented since wave 2 and which
round 31 #4 deliberately did not change. A share counted over 31 entrants has a granularity of
1/31 = 3.2%, so a field sitting within one player of the 0.35 threshold flips when the weekly redraw
swaps one entrant. Two candidate fixes were measured and both are recorded rather than shipped:

- **read her rested rather than at today's condition** – shipped for a different and separately
  proven reason (below), and it moved this number by exactly **zero cards**: `matchStrengthKnee` is
  70 and she is at 87 on that save, so the rested composition is the same player. A null arm, caught
  by checking the reader rather than by trusting the result.
- **count the share over the UN-GATED field**, removing the weekly fatigue churn – measured **worse,
  4 of 24**. The churn is the standings, not the availability gate.

Making it 0 from here means either widening the thresholds until nothing can cross them – the repaint
the round explicitly forbade, and it would take the discrimination with it – or freezing the field
itself, which is round 31 #4's own filed-not-fixed question (*"either previewing the field at the
EVENT's week or settling the draw into the save, and both move brackets that the career hashes
pin"*). **Both are the owner's call, not an agent's.** What is shipped is the honest trade: a band
that flips between two neighbouring values on one card in eight, against one that said the same word
on every card it was the only information on.

### The rested reading, which is kept on its own evidence

She is composed at `ECONOMY.condition.max` for the band and at her real condition for the ring. The
header of `season/preview.ts` has argued the field's half since wave 2 – *"Their exhaustion today
says nothing about their condition on a week that has not happened; quoting it turns a transient into
a promise"* – and the same sentence is true of her, now that the band is the whole of a pre-draw
card. ⚠ It is pinned by a test that puts BOTH arms under the knee (conditions 30 and 65, where
`conditionMatchFactor` actually bites), asserts the two worlds compose different players, and then
asserts the band is identical across them. Mutation-verified: dropping `kidAtRest` reddens it.

---

## 8. ⭐⭐⭐ THE RECONCILIATION (round 31, #3 merged with #4) – §7's price was not payable, so the band changed question

§7 above shipped a band that moved on **3 of 24** tournaments and said, in as many words, *"the
acceptance criterion asked for 0"*. It also named the two ways out it would not take on its own –
widening the thresholds until nothing can cross them, and freezing the field – and left the call to
the owner. This section is the third way, found by merging r31b and r31c and gating the pair.

⚠ **Nothing in §1–§6 is revised.** The ladder fix is a fix to the RING and it is untouched: §8.4
restates every rung's number from a repositioned measurement and it is identical to r31c's. What
moves here is the BAND, which §7 already identified as the thing that had got worse.

### 8.1 Two branches, each green alone, red together

`npm run check` on the merge: `Tests 4 failed | 3798 passed`.

| # | failure | cause |
| --- | --- | --- |
| A | `tier-ladder-and-band` – three arms, the first being its own vacuity guard (`expected 134 to be greater than 400`) | r31c's fixture walks upcoming cards every EIGHTH week and reads the first-round opponent; r31b hides that opponent past `DRAW_LEAD_WEEKS`, so the walk caught one event in eight |
| B | `preview` – *"the BAND is the same at every week the card is on screen"* | r31c's `strengthOf` counts the drawn field, and `drawnField` rebuilds weekly |

### 8.2 Failure A – the measurement moved to the week the draw exists

⭐ **The guard did exactly what it was built for and was not weakened.** The 400 stands, the two
claims stand. What moved is where the file looks: it observes the last **110** weeks EVERY week and
keeps only the cards that carry a ring, which is one reading per event **at the week its own draw is
made** – instead of eight readings per sampled week, seven of which no longer exist. Sample 134 →
**1,588 cards**, 212 of them enterable. Cost 4.7 s → 13.7 s.

⚠ Mutation-verified: `OBSERVE_WEEKS` 110 → 14 reddens the vacuity guard (214 cards) and the
enterable-card guard (28), which is the same red the merge produced.

### 8.3 Failure B – the band is now a reading of the RUNG

Three changes, and each one is answering the same question: *what can a card say about a field that
does not exist yet, that will still be true next week?*

1. **The population is the TIER's expected field, not this week's draw** (`tierExpectedField`). It is
   built from the tier's own definition, in `selectEntrants`' own order – `isTierAgeOpen`, then
   `entrantPctBand` read off a table sorted by **strength** rather than by a standings table (§4's
   substitution carried one storey up), then the head of that window the entry jitter can reach.
   Neither the standings, nor the availability gate, nor the per-event die is in it.
2. **The head is `2 × drawSize`, which is the jitter's own reach.** `selectEntrants` keys candidates
   on `position + rng() × drawSize` and takes the lowest `drawSize`, so a candidate can enter from up
   to `drawSize` places below the cut: the reachable population is twice the draw, and the
   availability backfill reaches further down still. Slicing exactly `drawSize` models the draw's
   MODE; twice it models the EXPECTATION. It is also the smoother of the two – see 8.5.
3. **The reading is an expected CHANCE, not a headcount.** A rung's expected field is ~90 rating
   points wide across 32 players, so one player is 3.1% of a share and under three rating points; the
   conveyor's annual turnover moves the domestic slab **13 points** and a headcount inside it turned
   that into a share swing of 0.813 → 0.500. `strengthOf` now takes her mean `chanceFromRatings`
   against the field, which is the formula the ring already satisfies to inside a point, and the same
   13 points move it by 0.03.

⚠ **And she is read at her BEST, which is the rested rule one seam along.** `kidAtRest` already put
her at `ECONOMY.condition.max`; it now also puts her in `FRESH_KIT`. Equipment wear is the same class
of weekly transient as condition and it is much the larger of the two here: measured on w933 her
rested rating ran a saw-tooth of **7 points a week** on a build whose five skills moved by one.
`kidMatchPlayerFor` gained an optional `kitWear` override for it – absent ⇒ the clock is read, so
every other caller composes byte-identically, and the RING still plays her in the racket she owns.

### 8.4 The tier table, restated from the repositioned measurement

Two careers × 450 weeks, the last 110 weeks observed every week, two vantage points (the girl the
career grew and the same five skills at 0.72), **1,588 cards**. Three arms, each measured with the
SAME repositioned reader: **A** = the merge before r31c (`fb6825ee`), **B0** = r31c as merged
(`71b243ab`), **C** = this branch.

| rung | n | A: pre-r31c | B0: r31c | C: here |
| --- | --- | --- | --- | --- |
| Local Open | 212 | **51%** | 59% | **59%** |
| Regional Championship | 104 | 57% | 56% | **56%** |
| National Series | 50 | 60% | 55% | **55%** |
| Junior Tour 30 | 212 | 65% | 59% | **59%** |
| Junior Tour 60 | 132 | 61% | 59% | **59%** |
| Junior Tour 300 | 34 | 59% | 63% | **63%** |
| World Tour 15 | 212 | 85% | 85% | **85%** |
| World Tour 35 | 136 | 83% | 83% | **83%** |
| World Tour 50 | 102 | 80% | 80% | **80%** |
| World Tour 75 | 66 | 71% | 71% | **71%** |
| World Tour 100 | 34 | 60% | 60% | **60%** |
| World Tour 125 | 36 | 53% | 53% | **53%** |
| World Tour 250 | 70 | 54% | 54% | **54%** |
| World Tour 500 | 84 | 47% | 47% | **47%** |
| World Tour 1000 | 68 | 37% | 37% | **37%** |
| Grand Slam | 36 | 46% | 46% | **46%** |
| **domestic inversions** | | **2** | **0** | **0** |
| **hardest domestic rung** | | **Local Open, 51%** | National, 55% | **National, 55%** |

⭐⭐ **Column C is column B0 to the percentage point, on all sixteen rungs.** That is the proof that
this wave moved the BAND and nothing else: the ring is `firstMatchChance` and no line of this change
touches it. §3's two claims are re-established at the repositioned reading – **domestic inversions 0,
and the Local Open is no longer the hardest rung on her domestic ladder** (it is the easiest of the
three, at 59% against National's 55%).

And the band, over the same 1,588 cards:

| | A: pre-r31c | B0: r31c | C: here |
| --- | --- | --- | --- |
| `favourite` / `even` / `strong` | 0 / 0 / **1,588** | 1,039 / 161 / 388 | 791 / 323 / 474 |
| `strong` contradicts its own ring | **69.8%** | 6.2% | **12.7%** |
| bands occurring on an ENTERABLE card | `strong` only | all three | **all three** |

⚠ **`strong`'s contradiction rate is 12.7% here against r31c's 6.2%, and that is the trade being
made rather than a regression that slipped through.** A band about the RUNG cannot know which girl
this week's draw hands her, so a strong rung will sometimes produce a soft opener; a band about the
DRAW knows, and pays for it by moving every week. The claim r31c bought – that the pair cannot point
opposite ways – survives with room: `tests/tier-ladder-and-band.test.ts` bounds it at 0.35 and it is
mutation-verified. Against the 69.8% the shipped engine ran, both are the same fix.

### 8.5 Acceptance – and the residue, stated rather than hidden

`npx vite-node tools/r31-draw-stability.ts -- --save <the owner's w933 save>`:

| | opponent changes | band changes |
| --- | --- | --- |
| `r31b` alone | 0 of 24 | 0 of 24 – but every junior/domestic card said `strong`, so nothing COULD move |
| `r31b` + r31c (§7) | 0 of 24 | **3 of 24** |
| here | **0 of 24** | **0 of 24**, with all three bands on screen (72 `favourite`, 32 `even`, 6 `strong`) |

⚠ **The dead zone's width is the one free number, so it was swept rather than picked** (invariant 5).
±0.125 is ±88 Elo, just inside the 100-point class `chanceFromRatings` quotes from its own source.
The sweep behind that anchor: eight careers (w933 and seven fresh), seven weeks each, **382
card-observations**, every width from ±0.09 to ±0.17 in steps of 0.005.

- Between ±0.11 and ±0.13 the band's composition barely moves – a plateau, meaning no cluster of
  cards lives there – and ±0.125's cuts sit furthest from the nearest card on both acceptance
  fixtures (margin 0.0029 against a median of 0.0004 across the other widths).
- Wider is not safer, only quieter: by ±0.17 `even` has swallowed three cards in five, which is the
  degeneracy this whole wave exists to undo.

⚠⚠ **AND THE SWEEP'S OTHER FINDING, WHICH IS THE HONEST ONE: NO WIDTH MAKES THE RESIDUE ZERO.** At
every one of the seventeen widths some card in the 382 sits within 0.0005 of a cut, and 3 to 12
observations step. The cause is not the preview: it is that a card sits on screen for eight weeks and
in that time she genuinely outgrows a rung by about **5 rating points** (measured at 13: +9 for her,
+4 for the field, over six weeks), and a three-valued readout of a moving quantity crosses a cut that
lies inside those 5 points. So roughly one card in a hundred steps ONCE, monotonically, in the
direction she is actually going. That is news and not flicker – **nothing left in this design can
move because the preview was re-read**, which is the whole of what the owner asked for. The two
acceptance fixtures are clean at ±0.125; a different save may show one such step, and it will be a
single step in her favour rather than a word that changes back.

### 8.6 Invariant 2, again – nothing moved that must not move

Same argument as §6 and it is still by construction: `previewEvent`, `ratedField` and
`tierExpectedField` are pure reads with zero draws, `upcomingEvents` is a snapshot reader asserted
mutation-free, and `kidMatchPlayerFor`'s new `kitWear` is an override on an argument, not a term.
The frozen capture (41550 / `e6b0c709`) and all eighteen career hashes re-derive green in
`tests/condition.test.ts` and `tests/coach-travel-edge.test.ts` – **run, not asserted**.
`SAVE_SCHEMA_VERSION` is unmoved and nothing is persisted.

### 8.7 What is NOT resolved

- **The ITF family still inverts at its top** (§5's filed-not-fixed item): the cause is
  `minConditionToEnter.j300` and the backfill, and this wave does not touch it. The domestic-only
  claim in `tests/tier-ladder-and-band.test.ts` is unchanged.
- **The week − 1 name still disagrees with the bracket's on 59.2% of draw-week cards**
  (`tools/r31-draw-promise.ts`, recorded by r31b). Closing it moves brackets and is the owner's call.
- **`strong` on an enterable card in the owner's own saves** is rarer than the deep fixture's –
  6 of 110 observations on w933. §5's reading of that still holds: his careers are of a very strong
  player, and `strong` requires a rung that genuinely outrates her.
