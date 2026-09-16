---
type: spec
status: reference
area: economy-and-progression
canonical: false
last-reviewed: 2026-09-15
---

# The coach takes 10% of every cheque

**Round 42 #41. 15.09.2026. RULED – the every-cheque arm ships; the numbers below are the measurement
that had to come with it (invariant 5).**

The owner: «я вообще не понял почему мы снова обсуждаем разные проценты, если уже есть исследование
на 10% безусловных отчислений с любых призовых, независимо от глубины прохода. И мы говорили, что это
будет сделано».

---

## 1. Why he is right, and the receipt is his own

[team-economics-2026-09](../research/team-economics-2026-09.md) §2, from his sources: a head coach is
paid a fixed retainer **plus a share of prize money, 7–15%, most commonly 10%, of EVERY cheque**
(Rublev pays Vicente fixed + 10% per tournament; Kasatkina «10% от любого заработка на корте»). The
audit row on our own constant said so in the same table: «⚠ half-matches: our 10% exists but only at
finishIdx 0/1; reality cuts 10% of EVERY cheque». Finding 3.1 parked it; his 15.09 word un-parks it.

Round 24 built the sharper shape on his own words of the time – «за победы или 2е места… за 2е только
по-меньше» – and that is what is being replaced, deliberately and by him.

## 2. The change

One object, three numbers per seat:

| seat | before | after |
| --- | --- | --- |
| coach | `{ titleBps: 1000, finalBps: 500 }`, and the function returned **0** below a final | `{ titleBps: 1000, finalBps: 1000, everyBps: 1000 }` |
| masseur | `{ titleBps: 300, finalBps: 150 }` | `{ titleBps: 300, finalBps: 150, everyBps: 0 }` – **unchanged behaviour**, see §5 |

`staffResultShareBps` stops hard-coding the tail (`… : 0`) and reads `everyBps` instead. That is the
whole engine change: the third rung became **data** rather than a branch, so the masseur's open
question and any future retune are one number on `ECONOMY` and not an edit to the function.

⚠ **Nothing else about the mechanism moved.** `finalizeTournament`'s split is untouched line for
line – both staff shares still come off the **GROSS** cheque, each still rounds **once**, the family
still keeps the remainder by subtraction, the seat must still be FILLED and the track must still be
`wta`. The order is untouched and still cannot matter: her share comes off the same gross, so no hand
shrinks another's base, which is round 41 A1's pinned property.

⚠ **`finalBps` moved 500 → 1000 with the rest.** «За 2е только по-меньше» was a statement about
DEPTH, and his 15.09 ruling removes depth from the coach's line entirely. A lost final paying less
than a first-round exit's rate would be the old shape wearing the new one.

⚠ **No schema move, no MAIN draw.** This is integer arithmetic at finalize on a cheque already
decided; `tests/condition.test.ts`'s frozen capture cannot see it.

---

## 3. ⚠ THE PREDICTION, WRITTEN BEFORE THE BENCH WAS RUN (invariant 5)

Model. Write the career's gross pro prize money as `P`, split into titles `P0`, lost finals `P1` and
everything else. The coach took `0.10·P0 + 0.05·P1`; he now takes `0.10·P`. If titles and finals are
25–40% of a career's prize money – the guess this prediction rests on, and the first thing the bench
can falsify – the old take was **3.0–4.5% of gross** and the new one is 10%, so the family pays a
further **5.5–7.0 pp of every prize dollar** and his own take multiplies by **2.2–3.3×**.

| | predicted | measured | |
| --- | --- | --- | --- |
| R1 the coach's cut per career, mean | **×2.2 to ×3.3** | **×4.5** at week 400 ($41,207 → $185,580); ×3.5 at 600 | ✗ (bigger) |
| R2 his cut as a share of gross prize, after | **8.5–10.0%** (under 10 only by uncoached/junior weeks in the denominator) | **8.48%** at 400, **8.57%** at 600 (from 2.03% / 2.64%) | ✓ |
| R3 family wallet at week 400, mean | **−7% to −14%** | **−4.0%** (median **+6.0%**) | ✗ (smaller) |
| R4 family wallet at week 600, mean | **−10% to −18%** | **−8.6%** (median **+2.1%**) | ✗ (smaller) |
| R5 careers ever under water at 400 | **unchanged, or +1 to +3 of 36** | **15 of 36 in BOTH arms – unchanged** | ✓ |
| R6 careers that ended before the horizon | **unchanged (±1)** | **1 of 36 in BOTH arms – unchanged** | ✓ |
| R7 prize weeks that pay him at all (item 11's memo) | **from ~15–25% to ~60–90%** | **11.0% → 77.5%** at 400; 13.9% → 80.8% at 600 | ✓ |
| R8 poorest quartile vs richest | poorest loses **less in dollars, more as a share of its own wallet** | ✗ **poorest loses less on BOTH** – see 3.2 | ✗ |
| R9 family prize BANKED, mean | **moves under 2%** – a bigger move means ENTRY DECISIONS changed | **+5.0%** at 400, +4.1% at 600 | ✗ – and it is the reading key: see 3.1 |
| R10 masseur on the same road (§5) | a further **−2% to −5%** of wallet against the coach-only arm | **not measurable at this corpus** – the direct cost is +$15,792/career; see §5 | – |

*36 careers per arm (9 presets × 4 seeds), the `player` policy, identical seeds. 34 of 36 pairs played
the same tournaments at week 400, 32 of 36 at week 600 – the comparability guard, read BEFORE the
difference. Actuation proven per run: at 50% of every cheque his cut goes $107,221 → $370,543 and the
family's wallet $1,159,943 → $341,391.*

### 3.1 ⚠⚠ R9 IS THE READING KEY AND IT MISSED, SO THE CORRIDOR ROWS ARE READ THROUGH IT

R9 was the only claim about the CODE, and its own note said what a miss would mean: «if prize banked
moves more than the entry-policy noise, the wallet is feeding back into what she enters». It moved
**+5.0%**, and three other rows moved with it in the same impossible direction – gross prize +7.9%,
her account +4.9%, and the wallet's **median UP 6.0% while its mean is DOWN 4.0%**.

**A cut cannot make a family richer.** What happened is that 2 of 36 pairs played different
tournaments, and prize money is heavy-tailed enough that two careers dominate a 36-career mean. So:

* **the DIRECT cost is exact and is R1/R2**: the coach's take rises ×4.5 and goes from 2.03% to
  **8.48% of gross prize money** – the family pays a further **6.45 pp of every prize dollar**;
* **the corridor deltas at n=36 are not resolvable against entry feedback**, and the report says so
  rather than quoting −4.0% as the answer. A corpus large enough to resolve a ~6% wallet effect
  against this variance is the honest next instrument, and it was not run here.

⭐ **What IS resolvable, and is the answer the item actually needed, is §3's census** – survival is
measured per career and per pair, where two outlying careers cannot hide anything.

### 3.2 ⭐⭐ THE QUESTION THAT PARKED THE ITEM: THE FAMILY ALREADY NEAR THE EDGE

Cohorts cut on the **BEFORE** arm, the same seeds read in both columns (cutting on the after arm
would select the families the change itself pushed down). Week 400.

| cohort (cut on the BEFORE arm) | wallet BEFORE | wallet AFTER | under water | wks under | ended | coached | his cut AFTER | n |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| working | $2,210,026 | $2,087,604 · **−5.5%** | 6→6 | 1.8→1.8 | 0→0 | 8/12 | $206,903 | 12 |
| middle | $1,533,217 | $1,527,903 · −0.3% | 7→7 | 2.2→2.3 | 1→1 | 12/16 | $143,236 | 16 |
| wealthy | $3,489,106 | $3,476,695 · −0.4% | 2→2 | 0.6→1.0 | 0→0 | 7/8 | $238,285 | 8 |
| ⭐ **ever under water BEFORE** | $1,500,971 | $1,278,215 · **−14.8%** | **15→15** | **4.1→4.4** | 0→0 | 13/15 | $149,677 | 15 |
| never under water BEFORE | $3,461,965 | $3,442,689 · −0.6% | 0→0 | 0.0→0.0 | 1→1 | 14/21 | $211,225 | 21 |
| ⭐ poorest quartile BEFORE | $58,021 | $58,021 · +0.0% | 4→4 | 1.7→1.7 | 1→1 | **5/9** | $40,793 | 9 |
| richest quartile BEFORE | $7,717,214 | $7,338,782 · −4.9% | 2→2 | 1.1→1.2 | 0→0 | 7/9 | $316,589 | 9 |

**SURVIVAL, CAREER BY CAREER (n = 36): ZERO changed state, in either direction.**

* went under water only in the AFTER arm: **0**
* went under water only in the BEFORE arm: **0**
* ended early only in the AFTER arm: **0**
* ended early only in the BEFORE arm: **0**

**So the answer to «does a family already near the edge go under» is NO, on this corpus, with no
career changing state at all.** The families that were already struggling pay the most in
proportional terms – the ever-under-water cohort loses **14.8% of its median wallet** and spends
**4.1 → 4.4 weeks** under water on average – but not one of the fifteen crosses a line it was not
already on.

⚠ **R8 inverted, and the reason is the coach and not the balance.** The poorest quartile moves by
**$0** because only **5 of its 9 careers have a coach at all** – a self-coached family owes no coach
share, and self-coaching is exactly what a family at the bottom does. Its median landed on an
untouched career, which is why the figure is identical to the cent rather than merely small. The
change's weight therefore falls on the **coached mid-career**, which is the cohort the item named.

⚠ **THE «WHAT IT BUYS» ROW FELL 47% AND IT IS NOT A SAFETY READING.** Wallet-in-weeks-of-own-burn
goes 521.1 → 275.9 at week 400. That is mostly the DENOMINATOR: the burn is the last twelve retained
weeks of spending, and the coach's cut is now a spending row on every prize week, so a window holding
two big cheques books ~10% of them as burn. A family with 275 weeks of its own burn banked is not a
family under pressure – the survival census is the safety reading, and it is unchanged.

⚠ **R9 is the only one that is a claim about the CODE rather than about the numbers.** The coach's
share lands as a `coaching` EXPENSE row and `careerTotals.prizeCents` is the family's part of the
cheque – so if prize banked moves more than the entry-policy noise, the wallet is feeding back into
what she enters, and every other row has to be read as a different career rather than a different
setting.

---

## 4. The instrument

`tools/r42-coach-every-cheque.ts`. Real careers through the shipped engine, 9 presets × 4 seeds on
the `player` policy, at item 25's own two horizons – **and the corridor print is item 25's own**
(`tools/_corridor.ts`, extracted verbatim from `tools/r42-kid-share-ramp.ts` so the two specs' tables
are row-for-row comparable). Four arms on identical seeds: BEFORE `10/5/0`, AFTER `10/10/10`, the
masseur variant, and an ACTUATION arm at 50% of every cheque.

The coach's cut is folded off `FinanceWeek.coachCut.cents` – the durable memo the wallet was actually
debited by – and not re-derived from the finishes, so it is what happened and not a second opinion
about it. ⚠ That ledger prunes on a 60-week window, so §2's cut and gross are **the retained window**
and not career totals; both arms are read identically, so the comparison is sound and the absolute
figure is not a career total.

---

## 5. ⚠⚠ THE OPEN QUESTION: DOES THE MASSEUR FOLLOW?

Item 41 names it as the thing the bench must answer and the owner must rule. **Nothing about the
masseur has been changed** – `everyBps: 0` is round 24's exact behaviour written as a rate – and §4
of the bench prices the alternative (`everyBps: 300`, his own third-of-the-coach sizing carried onto
the tail) so the ruling costs one word and no new measurement.

The case each way, before the numbers:

* **He follows.** «One mechanism, two takers» is the constant's own design, and a bonus that fires
  twice a career next to a cut that fires forty times is two different kinds of thing sharing an
  object.
* **He stays.** The research is explicit that the rest of the team is **salaried, rarely on a share**
  («small title bonuses happen») – the audit's own ✅ row. A masseur on every cheque would be the one
  place this wave moved *away* from the document it is built on.

### 5.1 ⚠ THE FIRST RUN OF THIS SECTION WAS A NULL ARM, AND IT IS RECORDED RATHER THAN ERASED

It compared two arms **neither of which ever hired a masseur** – `econ-bench`'s walk fills no support
seat – and printed **$0 against $0 on 0 of 36 careers**, with the wallet identical to the cent. The
bench said so out loud («NULL ARM: the seat is never filled on this corpus and §4 proves nothing»)
rather than reporting a null result, which is what the house rule («a null result is a claim») is for.
The repaired arms hire him the week his seat unlocks, **in both columns**, so the only difference
between them is `everyBps`. **31 of 36 careers now pay him a share at all.**

### 5.2 What it costs, measured

| week 400, both arms carry the coach on every cheque and both hire the masseur | masseur 3 / 1.5 / **0** | masseur 3 / 1.5 / **3** |
| --- | ---: | ---: |
| the MASSEUR's cut, mean per career | $1,754 | **$17,546 · ×10** |
| careers whose masseur was paid a share at all | – | **31 of 36** |
| family wallet – mean | $1,845,045 | $2,162,544 · *+17.2%* |
| family wallet – median | $901,695 | $1,271,198 · *+41.0%* |
| careers ever under water | 25 of 36 | 24 of 36 |
| careers that ended before the horizon | 8 of 36 | 6 of 36 |

⚠⚠ **THE WALLET COLUMNS ARE NOT READABLE AND THE ITALICS SAY SO.** They move the wrong way – the arm
that pays the masseur MORE ends richer, by 17% on the mean and 41% on the median – which is
arithmetically impossible as a direct effect and is therefore §3.1's entry feedback again, an order of
magnitude louder here. It is louder because **hiring the masseur at all is the expensive decision**:
both §5 arms have 25 of 36 careers under water and 6–8 ended early, against 15 and 1 in §1's arms that
never hire him. A ±$300k swing cannot resolve a $15,792 signal.

**So one number here is measurement and the rest is noise: his cut goes ×10, +$15,792 per career.**

### 5.3 ⭐ THE RECOMMENDATION – **the masseur STAYS a title-and-final bonus** (his to overrule)

Four reasons, in the order they weigh:

1. **His own research says so, and item 41 exists because his research said so.** §2 of
   team-economics-2026-09 is explicit that the rest of the team is *salaried, rarely on a share*, and
   the audit marked our masseur ✅ «ours is a designed line – keep». Moving the coach onto every cheque
   moves the game TOWARD that document; moving the masseur would be the one step AWAY from it, taken
   in the same commit, on no citation.
2. **It buys very little pressure.** +$15,792 per career against the coach change's +$144,373 –
   **11% as much money for a second departure from the research.**
3. **It cannot be justified by the corridor, in either direction.** The arms that would have shown it
   are unreadable at this corpus, and a change that cannot be measured against the thing it is meant
   to affect should not ship on a hunch. That is invariant 5 applied to a change nobody asked for.
4. **His pressure is already on the payroll, where it is legible.** Round 42 #42's bench measures the
   masseur's SALARY at a median of **$500/wk – 46% of the family's whole weekly income**, the largest
   single non-coach line. He is already the expensive seat; a share of every cheque would move his cost
   off the tile a parent reads and into the one place he cannot plan for.

⚠ **If the owner wants him to follow anyway, it is one number** – `ECONOMY.staffShare.masseur.everyBps`
from 0 to 300 – and nothing else in the engine, the tests or this spec needs to move.
