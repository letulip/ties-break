---
type: spec
status: draft
area: economy-and-progression
canonical: false
last-reviewed: 2026-09-16
corrects: docs/specs/cameo-gap-closer-2026-09.md
---

# The cameo, corrected (round 42 #47, second reading)

**This document exists because the first one read his ruling wrong**, and the repo's own convention is
that a corrected spec is a sibling rather than an edit
([junior-access-corrected](junior-access-2026-08.md), [acceptance-cuts-corrected](acceptance-cuts-2026-08.md)).

## 1. The misreading, in one line

> «фраза про закрытие 80% была **не про сумму**, а про то, что помощь должна **срабатывать в 80%
> случаев** примерно» (16.09)

**«60-80% закрытия» is a FREQUENCY.** The first spec read it as the size of the cheque and built
`shortfall × U(0.60, 0.80)`. Those are different mechanics, and the measured distance is not subtle:
help arrives in roughly **4%** of need cases against the **60–80%** he asked for.

## 2. And the size was never the broken part

> «У нас был механизм, который нормально давал денег, нормальными суммами, просто делал это без
> оглядки на общий бюджет семьи, а смотрел только на кошелек. **Это надо было исправить.**»

One defect, named precisely: the need test read the WALLET and not the family's whole budget.
Everything else about the mechanism was working.

**What «нормальные суммы» means, measured** (`TIERS`, `src/engine/season/calendar.ts`) – and this is
also the answer to his «для семьи 8к самый сложный период это J серия, а там стоимость радикально другая»:

| rung | entry | travel | **one trip** |
| --- | ---: | ---: | ---: |
| `j30` | $200 | $900–2,000 | **$1,100–2,200** |
| `j60` | $250 | $1,100–2,400 | **$1,350–2,650** |
| `j300` | $400 | $1,600–3,200 | **$2,000–3,600** |

…before the coach's and the masseur's fares, which a travelling team adds on top.

* **#43's flat $500–1,500 draw covered a third to a half of one J trip.** That is a normal amount.
* **The gap fraction pays a median $129** – 4–12% of a single trip.

⭐ **So the correction is SMALLER than what shipped**, which is the tell that the first reading was
wrong: a ruling that makes a mechanic simpler is usually the ruling, and one that makes it cleverer
is usually me.

## 3. What is built, then

1. **The flat draw returns.** `shortfall × U(0.60, 0.80)` is **deleted**, not retuned. The cheque is
   a normal amount again, sized against a J trip rather than against a residual.
2. **The need test keeps its fix, because that WAS the bug.** `reachableFundsCents` and the trip
   probe read what the family can actually reach; the wallet alone is never the gate again.
3. **The COOLDOWN is re-derived from a coverage target, not left as the binding constraint.** This is
   the whole of his ruling and it is the one number the wave has to find: at **60–80% of need cases
   receiving help**, how often may the shop be willing? Today the answer is «about once a season»,
   which holds coverage near 4%.

⚠ **`unpayableTrip` stays as the TRIGGER** – «в край нужды для закрытия поездок» is his, and the probe is
the honest whole-budget read the first wave got right. Only the SIZING and the CADENCE change.

⚠ **And the probe should stop hunting the cheapest nearby entry.** It names the soonest unpayable
trip, ties to the cheapest, which is why it finds a $281 median gap; his «самые большие расходы»
points at the strongest rung she could enter. Q1 below.

## 4. What this correction dissolves

**The narrowed-promise question is gone.** The first spec asked whether #47 came apart from wave-6
T12's «когда вообще уже край» at the bottom of the ladder. It did – but only because the gate had
become rare. A mechanic that fires in 60–80% of need cases does not have that failure mode, and the
question retires with the misreading that produced it.

## 5. Predicted, before the run

| # | claim | predicted |
| --- | --- | --- |
| P1 | coverage – share of need cases receiving help | tunable to **60–80%**; the cooldown lands near **6–10 weeks** rather than a season |
| P2 | the cheque | **median $700–1,000**, i.e. #43's draw unchanged in shape |
| P3 | dollars a season | **$900–1,600**, within about a third of #43's $1,125 |
| P4 | the J-series share | **≥ 70% of cheques** land in seasons 0–3, as the first wave already measured |
| P5 | an 8k family's J season | the cameo covers **a quarter to a half of one trip's bill**, once or twice a season |

⚠ **P1 is the acceptance test.** The others are guards on «did the size stay normal».

## 6. Open questions

| # | question | recommendation |
| --- | --- | --- |
| **Q1** | which trip does the probe name – soonest-and-cheapest, or the strongest rung she could enter? | **the strongest she could enter**, which is where «самые большие расходы» points and what makes the help feel like help |
| **Q2** | is coverage measured per NEED WEEK or per NEEDED TRIP? | **per trip** – a trip she could not pay for and then missed is the thing he is protecting against, and a week is an artefact of the calendar |
| **Q3** | may a willing week with no unpayable trip still write a small cheque? | **no** – with coverage at 60–80% the mechanic no longer needs a filler, and «help every week» was his original complaint |

**Done when:** Q1–Q3 are ruled and P1's coverage corridor is measured and accepted.
