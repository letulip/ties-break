---
type: spec
status: reference
area: economy-and-progression
canonical: false
last-reviewed: 2026-09-15
---

# The local sponsor's cadence – a cooldown and a season cap

**Round 42 #5. 15.09.2026. PROPOSAL: both numbers are the owner's to confirm off the table below.**

The owner, playing: «Спонсор деньгами реально засыпает рабочую раз в 3-4 недели».

---

## 1. What he was actually seeing

He was right about the feel and the cause is arithmetic, not a bug.

The local-sponsor cameo (`world/phaseFinance.ts`, `ECONOMY.sponsor`) was a **memoryless weekly
Bernoulli**: `rollChance` 0.06, $500–1500, and the block carried **no cooldown and no per-season cap
of any kind**. Two consequences follow without any luck being involved:

* P(next cheque within 4 weeks) = 1 − 0.94⁴ ≈ **22%**, so roughly one cheque in five arrives inside
  the window he named, and runs of three inside ten weeks are ordinary;
* the runway gate has **zero hysteresis** – it asks one question a week and nothing latches – so for a
  working family it stands open essentially every week of the junior years, and the cameo pays at its
  full unconditional rate: ≈ 2.9 cheques ≈ $2,940 a season.

So there was nothing between the family and the die. That is the item.

## 2. The change

Two named constants on `ECONOMY.sponsor`, and one predicate beside `sponsorNeedMet`:

| constant | value | what it says |
| --- | --- | --- |
| `cooldownWeeks` | **6** | no second cheque inside six weeks of the last one |
| `seasonCap` | **3** | and never more than three in one season |

`sponsorCameoWilling(seed, week)` (world/sponsors.ts) is the cadence half of the gate;
`sponsorNeedMet` is the need half and is **untouched** – `runwayWeeks` 62, the court denominator, the
rung cut and the amounts are all exactly what `need-not-background-2026-08.md` measured. Two
predicates rather than one, deliberately: one is about the shop, one about the family, and a single
merged test would hide which of them refused.

### 2.1 Why the cooldown is DERIVED and not remembered

A cooldown needs a memory and this career has nowhere to put one.

* **Persisting the last cameo week** is a save-schema move (invariant 3: bump, append-only migration,
  golden fixture). The item was told not to make one.
* **Reading it back off the record** does not work. `world.events` is capped at 400 rows and pruned
  oldest-first – `diary/travelHome.ts` already writes down that the feed «alone cannot answer this» –
  and `financeWeeks.byCategory.sponsor` cannot tell a cameo from a retainer or an ad cheque, because
  **five** call sites book that category.
* **Deriving it** works, because a season's willing weeks are a pure function of `(seed, season)`:
  one purpose-scoped sub-stream per season, drawn once per week in order, walked with the cooldown
  and the cap applied. Nothing is persisted and nothing can drift.

⚠ **The price is paid in the MAIN stream and it is written down rather than hidden.** The hit test
used to *be* the weekly MAIN draw, and a MAIN draw taken in week 340 cannot be re-derived in week 346
– the persisted position is a position, not a replay. So the test and the amount moved onto
`seed:sponsor:cameo:<season>` / `seed:sponsor:cameo:gift:<week>`, and **the two MAIN draws stay
exactly where they were, unread**. That keeps the per-week MAIN count and the frozen capture
(41550 / `e6b0c709`) byte-identical, which is what round 42 #5 required. One wasted draw a week is
the whole cost.

⚠ **The cross-season carry is exact to one season and not to the whole career.** The cooldown must
survive the wrap (a cheque in week 51 silences week 2), so the previous season is walked first and
its last willing week is carried in – but that season is walked with no carry of its own. The case
where it matters is third-order and named rather than papered over; walking from week 0 would make
every week O(week) for a guarantee nobody can observe.

---

## 3. ⚠ THE PREDICTION, WRITTEN BEFORE THE ARM WAS RUN (invariant 5)

Model: a renewal process with mean gap `1/p + cooldownWeeks` = 16.7 + 6 = 22.7 weeks, so
52 / 22.7 ≈ 2.3 cheques a season; the cap at 3 should bind on a minority of seasons only. Mean gift
$1,000.

| | predicted | measured | |
| --- | --- | --- | --- |
| P1 mean gap between cheques, working family | ≈ 23 weeks (from ≈ 17) | **20.0 weeks, from 12.4** | ~ |
| P2 P(gap ≤ 4 weeks) | **0%** – structurally impossible at `cooldownWeeks` 6 | **0.0%, from 24.7%** | ✓ |
| P3 cheques a season, working family | ≈ 2.3 (from ≈ 2.9) | **0.83, from 1.54** | ✗ |
| P4 dollars a season, working family | ≈ $2,400 (from ≈ $2,900) | **$842, from $1,615** | ✗ |
| P5 seasons at the cap of 3 | a minority – under 40% | **18%** | ✓ |

⚠ **P2 is the only one that is a claim about the CODE rather than about the numbers**, and it is the
one worth watching: a measured gap of 5 anywhere means the derivation has a hole in it, not that the
model was tuned wrong. It measures **0.0%** with a smallest observed gap of exactly 6, on 54 careers
a season – the floor is reached and never crossed. The cap likewise: no season took more than 3.

### ⚠⚠ P3 AND P4 MISSED, AND THE MISS IS INFORMATIVE RATHER THAN A TUNING ERROR

**Both levels are about 45% below the prediction, and the prediction was wrong about the WORLD, not
about the dial.** The ≈2.9 cheques a season in the round-42 ledger is the *unconditional* rate –
0.06 × 52 – which assumes the need gate stands open every week. Measured on real walked careers over
their first four seasons, a working family's gate is open **about half** the time, so the pre-wave
baseline is 1.54 cheques and $1,615, not 2.9 and $2,940. Every column in the bench is on that honest
baseline, and the delta is what matters.

**The cooldown landed exactly where the renewal model said it would.** Measured with the cap removed:
1.11 cheques a season against 1.54, **−28%** – against the model's 16.7/22.7 = −26%. That number is a
hit.

**What was not predicted is how hard the CAP bites**, and it is the finding worth his eye:

| arm | cheques/season | $/season | vs before | P(gap ≤ 4) | min gap |
| --- | ---: | ---: | ---: | ---: | ---: |
| A · BEFORE, no cooldown, no cap | 1.54 | $1,615 | – | 24.7% | 1 |
| **B · cooldown 6, cap 3 (shipped)** | **0.83** | **$842** | **−48%** | **0.0%** | **6** |
| cooldown 4, cap 3 | 0.94 | $962 | −40% | 1.8% | 4 |
| cooldown 8, cap 3 | 0.78 | $837 | −48% | 0.0% | 9 |
| cooldown 6, cap 2 | 0.53 | $549 | −66% | 0.0% | 6 |
| cooldown 6, **no cap** | 1.11 | $1,156 | −28% | 0.0% | 6 |

*(working-background careers, 18 per arm × 4 seasons; the whole-corpus table is in the run.)*

The cap binds on only **18% of seasons** – P5 was right – but those are exactly the crowded ones, the
seasons where his family's gate stood open all year and the shop fired three or four times. So a wall
that touches a fifth of seasons removes a further fifth of the money. **That is the dial he is
actually choosing on**, and it is one word either way: `seasonCap` off returns the cut to −28%,
`cooldownWeeks: 4` puts it at −40% but lets 1.8% of gaps back under five weeks.

⚠ **AND ONE BEHAVIOURAL CONSEQUENCE OF THE DERIVED ROAD, NAMED RATHER THAN BURIED:** the cooldown and
the cap count the **shop's willingness**, not the cheque. A week where the shop was willing and the
family did not need it still spends a cooldown and a cap slot. That is forced – the payment history
is the un-derivable thing – and it is defensible as fiction (the shop offered; nobody needed it), but
it is why the cut is larger than a pure payment-keyed cooldown would give. A payment-keyed version
needs a persisted `lastCameoWeek` and therefore a save-schema move.

⚠ **ONE READING CAVEAT ON THE GAP COLUMNS.** Gaps are pooled over careers, and a career with one
cheque contributes no gap at all – so careers with an always-open gate (and therefore short gaps)
supply most of the sample. That biases both columns the same way and it is why the BEFORE mean gap
reads 12.4 rather than the 16.7 a single always-open career would give. The comparison is sound; the
absolute gap figure is not a per-career expectation.

---

## 4. The instrument

`tools/sponsor-cadence.ts`. Real careers through the shipped engine, the cameo weeks read off the
feed rows the tick actually wrote. The **A arm is the pre-wave rule spelled as a setting of the new
dials** – `cooldownWeeks 0`, `seasonCap` unbounded – which is exactly a memoryless Bernoulli at
`rollChance`, and it is run on the same seeds and presets as every other arm. Further arms sweep both
dials so one word from the owner moves either number without a new measurement.

Actuation is proven per run by an absurd arm (`cooldownWeeks` 40): if its cadence does not collapse,
the dial is not wired and the table is a null.

---

## 5. ⭐⭐⭐ ROUND 42 #43 – HIS RULING OFF THE TABLE ABOVE, AND WHAT IT MEASURES

**15.09.2026. «сними потолок, а кулдаун давай 4».** The cap goes away entirely – the constant and its
one reader in `cameoWillingWeeks` – and `cooldownWeeks` becomes 4. Nothing else on `ECONOMY.sponsor`
moves: `rollChance`, the amounts, `runwayWeeks` 62 and `maxCoachTier` are untouched, and the need
half of the gate is the same predicate it was.

He was choosing off §3's own sweep, which had already priced both halves: `seasonCap` off returned
the cut from −48% to −28%, and `cooldownWeeks: 4` put it at −40% *with* the cap still on.

### 5.1 ⚠ THE PREDICTION, WRITTEN BEFORE THE ARM WAS RUN (invariant 5)

The renewal model that hit on the cooldown in §3 is the model again: mean gap `1/p + cooldownWeeks`
= 16.7 + 4 = **20.7 weeks** against the memoryless 16.7, so the rate ratio is 16.7 / 20.7 = **0.81**,
i.e. **−19%** of the pre-wave money. §3's own cooldown-only arm measured −28% against a model −26%,
so the measurement runs about 1.5 pp below the model and the honest band is **−19% to −22%**.

| | predicted | measured | |
| --- | --- | --- | --- |
| Q1 cheques a season, working family | ≈ **1.24** (from 1.54 before; 1.11 at cooldown 6) | **1.09**, from a BEFORE of 1.29 | ✗ |
| Q2 dollars a season, working family | ≈ **$1,290**, i.e. −19% to −22% vs BEFORE | **$1,125 · −15%** (from $1,322) | ✗ |
| Q3 mean gap between cheques | ≈ **16–17 weeks** (§3's pooled 12.4 plus the four-week floor) | **16.4 weeks**, from 13.7 | ✓ |
| Q4 **P(gap ≤ 4 weeks)** | **2–4%** – and it is NOT zero: see 5.2 | **6.2%**, from 25.3% | ✗ |
| Q5 smallest measured gap | **exactly 4** – the floor is reached and never crossed | **exactly 4** | ✓ |
| Q6 fullest season any career takes | **4 or more somewhere in the corpus**, or the removed cap was decorative | **5** | ✓ |

*162 careers per arm (9 presets × 18 seeds) × 4 seasons from fourteen, working-background rows;
`tools/sponsor-cadence.ts`.*

### 5.1a ⚠ THE THREE MISSES, AND TWO OF THEM ARE THE SAME MISS

**Q1's absolute number is a miss about the BASELINE, not about the dial.** It was anchored on §3's
1.54, which was measured on 54 careers; at 162 careers the pre-wave baseline is **1.29**. The dial's
own effect is the RELATIVE column, and that is Q2.

**Q2 is the real miss: the cut is shallower than the renewal model says.** −15% measured against a
−19% to −22% band. The model over-predicts here in exactly the direction §3's own numbers should have
warned about: at 162 careers the cooldown-6 arm measures **−23%**, where §3 (54 careers) recorded
−28%. So §3's figure was itself noisy, and the «measurement runs 1.5 pp below the model» correction
this prediction leaned on was fitted to noise. The honest statement is that the renewal model is a
good ordering device (4 → 5 → 6 → 8 is monotone: −15% · −17% · −23% · −32%) and a poor predictor of
the level, because the need gate opens and closes and a willingness spent on a closed gate is lost.

**Q4 missed HIGH, at 6.2% against a 2–4% band, and that is the number he should read.** The
prediction reasoned from the cap-bearing arm's 1.8%; with the cap gone, the clusters the cap used to
truncate come back, and a four-week gap turns out to be **as common as the raw die makes it** –
P(roll hits on the first allowed week) = `rollChance` = 6%, and the measurement is 6.2%. The cap was
doing more of the anti-cluster work than the cooldown was.

### 5.1b The whole sweep, so one more word of his moves the number without a new run

| arm | cheques/season | $/season | vs BEFORE | mean gap | min gap | P(gap ≤ 4) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A · BEFORE, no cooldown, no cap | 1.29 | $1,322 | – | 13.7 | 1 | 24.7% |
| **B · cooldown 4, no cap (his ruling)** | **1.09** | **$1,125** | **−15%** | **16.4** | **4** | **6.2%** |
| cooldown 5, no cap | 1.06 | $1,091 | −17% | 17.2 | 5 | 0.0% |
| cooldown 6, no cap | 0.98 | $1,017 | −23% | 18.4 | 6 | 0.0% |
| cooldown 8, no cap | 0.85 | $895 | −32% | 20.9 | 8 | 0.0% |

⚠ **Five is the one-word change that removes the four-week gap entirely** – 0.0% of gaps, at a cost
of two further points of money (−17% against −15%). It is stated here because it is the cheapest
answer to «still too fast» and it is HIS to take or leave, not a recommendation.

⚠ **The ACTUATION arm's own floor does not hold and the run says so out loud.** At `cooldownWeeks` 40
the smallest measured gap is 4, not 40, because `sponsorCameoWilling` carries the cooldown across the
wrap from ONE previous season only – `world/sponsors.ts` names that approximation and calls it «a
third-order case», which it is at 4 weeks of 52 and is not at 40. The shipped dial is unaffected
(measured floor exactly 4, never below), and the actuation claim it exists to make – the dial moves
the output, 1.29 → 1.09 → 0.38 – is unharmed.

### 5.2 ⚠⚠ THE FOUR-WEEK CADENCE IS STILL LEGAL, AND THAT IS THE HONEST SENTENCE

His original complaint was «раз в 3-4 недели». A cooldown of **4** puts the floor of the gap at
**exactly four weeks**, so:

* one-, two- and three-week gaps are **structurally impossible** – that half of the complaint is gone
  by construction and not by luck;
* a **four-week gap is legal**, and the shop will produce one whenever its own die lands on the first
  week the cooldown allows. At `rollChance` 0.06 that is 6% of willingness gaps by construction, and
  the **measured share of paid gaps is 6.2%** – the prediction that the need gate would thin it was
  wrong (Q4). So: **about one gap in sixteen is a four-week gap**, against about one in four before
  the wave. The cluster is gone; the cadence he named survives at the floor, one time in sixteen.

The instrument prints this as its own column (`P(gap=floor)`) rather than leaving it to be inferred.
If the cadence still reads as too fast in play, `cooldownWeeks` is one constant and nothing else
moves.
