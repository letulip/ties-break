---
type: spec
status: reference
area: economy-and-progression
canonical: false
last-reviewed: 2026-09-15
---

# The team budget spends against the whole payroll

**Round 42 #42. 15.09.2026. RULED – the committed figure becomes the payroll; the CAP's own number is
the owner's off the table in §4.**

The owner, looking at the tile item 23 shipped: **«committed должен это и показывать»**. It lists
coach, masseur and psychologist – three rows adding to $843 – under a «committed» of $343.

---

## 1. Why this is not a display change

`committedCents` is the figure the meter draws against `capCents`, and `capCents` is
`coachBilling.weeklyIncomeCents` – **the very denominator `coachMarket`'s `overBudgetCents` is cut
from**. Fold the payroll into the tile alone and the meter says the week is full while the card under
it says the rung fits: round-21 #12's defect, in the surface that note was written about.

So both sides moved together, through one function:

* `engine/world/coachMarket.ts` gains `supportPayrollWeeklyCents(world)` – masseur + psychologist,
  gated on the HIRE exactly as `householdWeekly` has always gated them, and `householdWeekly` now
  reads it instead of keeping its own copy;
* `coachMarket` cuts `overBudgetCents` from `familyWeeklyIncomeCents − supportPayrollWeeklyCents`;
* `composables/coachingBudget.ts`'s `committedCents` becomes the sum of `seats` – the tile's own rows,
  so the rows and the meter cannot add up to two different payrolls;
* the coach's own line survives as `coachWeeklyCents`, because the hire confirmation's sentence is
  about the **coaching** bill and would otherwise subtract three salaries from one rung's price.

⚠ **«Changes who can be hired» is honestly «changes who is FLAGGED».** `hireCoach` does not consult
the budget at all – `overBudgetCents` colours a card, and the row's `:disabled` is `current ||
lockedPoints`, never the budget. A narrower denominator **warns** and never refuses, which is what
keeps this inside «мы ни за что не наказываем».

⚠ **Round 28 #8's guard said the opposite and was right at the time.** Its §4 pinned «the committed
figure is still the COACH's line and does not silently absorb the masseur», and a bundle-7 arm
reddened it by trying exactly this. It is re-aimed **by this item and by his sentence**, with a ⚠ note
naming round 42 #42 – not by anybody deciding the old guard had been a mistake. The thing §4 was
really protecting – that the meter and the engine never describe two different budgets – is stronger
now than it was, because both sides read one function.

⚠ **No schema move, no MAIN draw.** Both figures are derived at snapshot time.

---

## 2. Why the cap has to be re-measured

A cap sized for **one** seat is not obviously the right cap for **three**. «The week's income, whole»
was a generous-but-sane ceiling for a coach; for a payroll it says *a family may commit every dollar
that arrives to its staff* – and the court, the travel, the entries and the strings are not in that
sentence. `familyWeeklyIncomeCents` deliberately excludes prize money («a weekly retainer underwritten
by prize money is a family one bad draw away from not being able to pay»), so the denominator is
parents + pro-rated kit retainer + merch + academy, and nothing that the tennis won.

---

## 3. ⚠ THE PREDICTION, WRITTEN BEFORE THE BENCH WAS RUN (invariant 5)

| | predicted | measured | |
| --- | --- | --- | --- |
| T1 support payroll (masseur + psych) as a share of the week's income, median, pro era | **15–40%** | **49% at week 416, 73% at 312, 51% at 208**; 46% over all readings | ✗ (far higher) |
| T2 whole payroll (coach + support) as a share of that income, median | **50–90%** | **88% over all readings**; 106–127% in the pro era; **139% on the working background** | ~ (the band holds overall, not in the pro era) |
| T3 the household's whole OUT as a share of that income, median, pro era | **over 100%** – the tennis, not the wage, funds a pro family's week | **104% · 127% · 106%** at weeks 208 / 312 / 416 | ✓ |
| T4 rungs flagged over budget | **roughly doubles** on the pro-era samples | **26.8% → 55.4%** over all readings; 23.3% → 62.1% at week 312 | ✓ |
| T5 ⭐ her OWN coach flagged after the change | **5–20% of readings** – and this is the number the cap is decided on | **1 of 84 → 22 of 84, i.e. 1.2% → 26.2%** | ✗ (above the band) |
| T6 the working background takes the change hardest | yes, in flagged share; the wealthy cells barely move | ✗ **INVERTED**: working 49.5% → 78.8% (+29 pp), wealthy **3.5% → 28.0% (+25 pp)**, middle 25.2% → 55.9% (+31 pp) | ✗ |

*84 market readings – 9 presets × 4 seeds, read at weeks 104 / 208 / 312 / 416, every seat filled the
week it unlocks; `tools/r42-team-budget-cap.ts`. The payroll term is WIRED: 52 of 84 readings carry a
non-zero support payroll and the flagged count moved on all 52 of them.*

### 3.1 ⚠⚠ THE MEASUREMENT SAYS THE CAP IS ALREADY TOO TIGHT, WHICH IS THE OPPOSITE OF WHAT §2 ASKED

§2 asked whether «the week's income, whole» is too GENEROUS a ceiling for three seats. The numbers say
it is too MEAN a ceiling for three seats, and by a wide margin:

* **the payroll alone is 88% of the week's income at the median, and 106–127% in the pro era.** The
  median working-background reading commits **139%** of its weekly income to its team. That is not a
  family overspending; it is `familyWeeklyIncomeCents` deliberately excluding prize money, which is
  what a professional family actually lives on.
* so the household's whole outgoing is **over 100% of that income at every pro-era sample** (T3 hit),
  and a cap defined as 100% of it is a line most pro families are already past.
* which is why **T5 missed high**: after the change, **26% of readings have the family's own standing
  coach flagged «over budget»** – a card telling a parent that the arrangement he is already paying
  for does not fit. Before the change it was 1 reading in 84.

⚠ **T6 inverted and the inversion is the finding.** The change does not fall hardest on the working
family – it falls hardest on the WEALTHY one, in relative terms: 3.5% → 28.0% is an eightfold rise,
because a wealthy family is the one that actually fills all three seats (2.57 of them at the median,
against 1.50 working) and therefore has the most payroll to subtract.

⚠ **And none of it can reach a career.** `hireCoach` never consults the budget, so all of the above is
a count of WARNINGS. No wallet, no ranking and no ending moves because of this item, which is why
this spec carries no corridor table.

---

## 4. ⭐⭐⭐ THE CAP – WHAT THE SWEEP SAYS, AND THE NUMBER THIS BUILDER PROPOSES

| cap (× the week's income) | rungs flagged | her own coach flagged | families over the cap | median free/wk |
| ---: | ---: | ---: | ---: | ---: |
| **1.00 (ships today)** | 744 of 1344 · 55.4% | **22 of 84 · 26.2%** | 36 of 84 · 42.9% | **$98** |
| 0.90 | 811 · 60.3% | 25 · 29.8% | 40 · 47.6% | $18 |
| 0.80 | 906 · 67.4% | 26 · 31.0% | 43 · 51.2% | **−$43** |
| 0.70 | 1006 · 74.9% | 30 · 35.7% | 48 · 57.1% | −$109 |
| 0.60 | 1098 · 81.7% | 31 · 36.9% | 50 · 59.5% | −$205 |
| 0.50 | 1170 · 87.1% | 32 · 38.1% | 55 · 65.5% | −$254 |

**Every candidate below 1.00 is worse on every column, and the sweep has no minimum in it.** That is
the honest shape of this dial: the cap is a ceiling, lowering a ceiling can only flag more, and there
is nothing for a lower number to buy. **The direction with a question in it is UP**, and the sweep
does not reach it because §2 framed the risk backwards.

**PROPOSED, and it is the owner's to take or leave: leave the cap at 1.00 – the week's income,
whole – and ship item 42 as measured.** Three reasons, in the order they weigh:

1. **Round-21 #12's ruling is what 1.00 means**, and it was his: «a reserve pays for one week of
   anything, a weekly bill has to fit the week». A cap of 1.3 × income would say a weekly bill does
   not have to fit the week, which is a different ruling and not a tuning of this one.
2. **Nothing is refused.** 26% of readings gaining an «over» flag costs a career nothing – it is a
   warning on a card, and the hire still goes through. The cost of being wrong here is a red figure a
   parent can ignore; the cost of raising the cap is that the meter stops meaning anything.
3. **The flag is now TRUE where it fires.** A family committing 139% of its weekly income to its team
   really is spending more than the week brings in, and before this item the meter said otherwise.
   The «over budget» that arrived is not noise – it is the thing the tile was hiding.

⚠ **ONE CHANGE THIS BUILDER WOULD RECOMMEND IF HE DISLIKES THE 26%**, priced and not shipped: exempt
the row the family is ALREADY ON from the flag. It is her standing arrangement, not an offer, and the
card already says «Current» rather than a price – so the flag says nothing a parent can act on. That
would take the «own coach flagged» column to 0 at every cap without touching a single hire. It is a
behaviour change and therefore his word, not this bundle's.

⚠ **T5 is the decisive one and the reason the sweep exists.** A family being told the arrangement it
is *already paying for* no longer fits is the one reading that would feel like a punishment, and this
game does not punish. If T5 is large, the cap must rise (or the flag must exempt the current row);
if it is small, 1.00 stands and the tightening is real but bounded.

⚠ **T4 and T5 are counts of WARNINGS.** Nothing in the engine refuses a hire, so no career outcome in
any other bench can move because of this item. That is also why this spec has no corridor table: the
change cannot reach the wallet.

---

## 5. The instrument

`tools/r42-team-budget-cap.ts`. Nine presets × 4 seeds, the `player` policy, the market read at weeks
104 / 208 / 312 / 416 – **every seat filled the week it unlocks**, because a family with one seat
filled cannot answer a question about three. Every figure is asked of the engine's own functions
(`familyWeeklyIncomeCents`, `supportPayrollWeeklyCents`, `coachMarket`, `householdWeekly`), never
re-derived. §3 of the run sweeps the cap fraction 1.00 → 0.50 and prints, for each, how many rungs are
flagged, how often the family's own coach is flagged, and the median free figure the tile would show.

⚠ **Three backgrounds, not four.** The item's brief says «across the four backgrounds»;
`FamilyBackground` is `wealthy | middle | working`. What there are nine of is econ-bench presets
(background × opening rung), and those are the cells.
