# Her share of the prize money – ten points a birthday, 60% at 23, and college pauses it

**Round 42 #25. Confirmed by the owner 15.09.2026 («подтверждаю связку»). Ships with this print.**

His question, 14.09: «может быть нам с 18 не по 5, а по 10% в год ей добавлять стоит?» – then, the
same pass, «может даже до 60% к 23», and ⭐ the new mechanic: **college years PAUSE the growth**,
«пока она снова в тур не вернется».

The numbers are his. This document is the table he confirms them against, because invariant 5 says a
balance change ships with a measurement and not with an argument.

---

## 1. The change, in four lines

| | before (round 23 #18, round 41 #27) | after |
| --- | --- | --- |
| `startBps` | 1000 – 10% from her first W cheque | **unchanged** |
| `stepBps` | 500 | **1000** |
| `capBps` | 5000 | **6000** |
| cap reached at | 26 | **23** (derived, never written down) |
| a college birthday | counts as a step | **does not count** |

    before   <18 18  19  20  21  22  23  24  25  26+
             10% 10% 15% 20% 25% 30% 35% 40% 45% 50%
    after    <18 18  19  20  21  22  23+
             10% 10% 20% 30% 40% 50% 60%

## 2. The college pause, and why it costs no schema

`kidPrizeShareBps(ageYears, pausedYears)` takes the paused count as an argument; the count itself is
`collegePausedShareYears(world)` in `world/college.ts` and it is derived, not persisted:

* a career has at most ONE college era – `answerFork` is the only writer of `world.college`;
* that object carries the span, `fromWeek` and `untilWeek`, and an early return moves `untilWeek`
  back to the week she actually left, so the span is always the years she really spent there;
* the count is her whole-year age on the last week inside the freeze minus her age on the first,
  floored at the eighteenth – two `kidAgeYears` calls and a subtraction, no loop, no second
  definition of when her birthday is.

Both fields have been on every save since v51. **Nothing is persisted and no migration is needed.**

⚠ **One derivation, five readers.** `finalizeTournament`, the brand's weekly split
(`assetKidShareCents` + the rate printed beside it in `phaseFinance`), and the two surfaces on her
own page (`ownAccountNote`, `ownAccountCard`) all take the count from this one function – the page
via `KidLifeWorldView.kidSharePausedYears`, composed once at snapshot time. Two readings would be two
percentages for one cheque, which is the defect round 30 #21 exists to have ended.

---

## 3. ⚠ THE PREDICTION, WRITTEN BEFORE THE ARM WAS RUN (invariant 5)

Reasoning: from eighteen to twenty-three the new ladder is above the old one at every age
(20 vs 15, 30 vs 20, 40 vs 25, 50 vs 30, 60 vs 35) and it stays 10 points above it from 23 on
(60 vs 50 at 26+). Weighted over the prize a career actually earns – which is concentrated in the
peak years, 22 onward – the family should lose roughly **a fifth of its prize income**, and she
should gain the same cents.

| | predicted | measured |
| --- | --- | --- |
| P1 her account at week 400 (age ~21.7), mean | **+70% to +110%** over before | – |
| P2 her account at week 600 (age ~25.5), mean | **+30% to +50%** over before | – |
| P3 family wallet at week 600, mean | **−10% to −25%** | – |
| P4 family prize BANKED at week 600, mean | **−15% to −25%** | – |
| P5 careers ever under water, week 600 | up by a few points, not by a class | – |
| P6 the college arm: her rate on the week she returns | **20%** at 23 (one tour birthday since 18), against 60% with no pause | – |
| P7 the college arm: her account at week 600 | **below** the no-pause arm, by the four paused steps | – |

⚠ **P3 and P4 are the two he is actually deciding on**, and they are different questions: the wallet
is what is left after everything, the prize banked is the tennis's own contribution to it. A wallet
that barely moves while the prize total drops a fifth means the family's other income is carrying it.

*(Measured column filled in from `npx vite-node tools/r42-kid-share-ramp.ts` – §4.)*

---

## 4. The instrument

`tools/r42-kid-share-ramp.ts`. Real careers through the shipped engine at three settings of
`ECONOMY.kidShare`, on identical seeds and presets:

* **A · BEFORE** – `stepBps 500`, `capBps 5000`: the round-23 ladder exactly.
* **B · AFTER** – `stepBps 1000`, `capBps 6000`: what ships.
* **C · AFTER + the college pause** – the same dials, on careers that actually take the fork at
  nineteen, walk four college years and come back. The pause is not a dial, so **C is a different
  population rather than a different setting**, and the report says so: it is read against its own
  no-pause control on the same seeds, never against A or B.

⚠ Actuation is proven in the run: an absurd arm (`stepBps 0`) must flatten her account to the
`startBps` line. If it does not, the dial is not wired and every row is a null.
