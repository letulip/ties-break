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
| R1 the coach's cut per career, mean | **×2.2 to ×3.3** | | |
| R2 his cut as a share of gross prize, after | **8.5–10.0%** (under 10 only by uncoached/junior weeks in the denominator) | | |
| R3 family wallet at week 400, mean | **−7% to −14%** | | |
| R4 family wallet at week 600, mean | **−10% to −18%** | | |
| R5 careers ever under water at 400 | **unchanged, or +1 to +3 of 36** | | |
| R6 careers that ended before the horizon | **unchanged (±1)** | | |
| R7 prize weeks that pay him at all (item 11's memo) | **from ~15–25% to ~60–90%** – the denominator holds junior and self-coached weeks | | |
| R8 poorest quartile vs richest | poorest loses **less in dollars, more as a share of its own wallet** | | |
| R9 family prize BANKED, mean | **moves under 2%** – the cut is an expense row, not a smaller prize row; a bigger move means ENTRY DECISIONS changed | | |
| R10 masseur on the same road (§5) | a further **−2% to −5%** of wallet against the coach-only arm | | |

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
