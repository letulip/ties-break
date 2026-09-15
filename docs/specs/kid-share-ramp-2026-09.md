---
type: spec
status: reference
area: economy-and-progression
canonical: false
last-reviewed: 2026-09-15
---

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

| | predicted | measured | |
| --- | --- | --- | --- |
| P1 her account at week 400 (age ~21.7), mean | **+70% to +110%** over before | **+41.9%** ($834k → $1.18M) | ✗ |
| P2 her account at week 600 (age ~25.5), mean | **+30% to +50%** over before | **+55.2%** ($3.19M → $4.95M) | ~ |
| P3 family wallet at week 600, mean | **−10% to −25%** | **−24.0%** ($7.24M → $5.50M) | ✓ |
| P4 family prize BANKED at week 600, mean | **−15% to −25%** | **−20.3%** ($8.60M → $6.85M) | ✓ |
| P5 careers ever under water, week 600 | up by a few points, not by a class | **16 of 36 in BOTH arms – unchanged** | ✓ |
| P6 the college arm: her rate on the week she returns | **20%** at 23 (one tour birthday since 18) | **20.0%** on 25 of 25 careers, against **58.0%** with no pause | ✓ |
| P7 the college arm: her account at week 600 | **below** the no-pause arm, by the paused steps | **NOT MEASURED** – see §5 | – |

### ⭐ THE TABLE HE READS – the family corridor at his two weeks

|  | BEFORE 5pp/50@26 | AFTER 10pp/60@23 | delta |
| --- | ---: | ---: | ---: |
| **WEEK 400** (she is ~21.7) | | | |
| family wallet – mean | $3,431,131 | $3,082,005 | **−$349,126 · −10.2%** |
| family wallet – median | $2,692,237 | $2,360,897 | −$331,340 · −12.3% |
| family prize banked – mean | $4,009,171 | $3,659,204 | −$349,966 · −8.7% |
| her account – mean | $834,167 | $1,183,911 | **+$349,744 · +41.9%** |
| her account – median | $704,414 | $1,006,591 | +$302,178 · +42.9% |
| *what it buys* – wallet in weeks of its own burn | 490.3 wks | 423.4 wks | |
| careers ever under water | 16 of 36 | 16 of 36 | |
| **WEEK 600** (she is ~25.5) | | | |
| family wallet – mean | $7,235,035 | $5,496,660 | **−$1,738,375 · −24.0%** |
| family wallet – median | $5,945,480 | $4,382,079 | −$1,563,401 · −26.3% |
| family prize banked – mean | $8,602,586 | $6,854,384 | **−$1,748,203 · −20.3%** |
| her account – mean | $3,187,826 | $4,947,996 | **+$1,760,171 · +55.2%** |
| her account – median | $2,926,212 | $4,586,581 | +$1,660,369 · +56.7% |
| *what it buys* – wallet in weeks of its own burn | 932.7 wks | 701.0 wks | |
| careers ever under water | 16 of 36 | 16 of 36 | |

*36 careers per arm (9 presets × 4 seeds), the 'player' policy, identical seeds; 34 of 36 pairs
played the same tournaments, which is the comparability guard passing before the difference is read.*

**The money moves across, it does not evaporate.** At week 600 the family loses $1,738,375 of wallet
and she gains $1,760,171 – the same cents, to within the entry decisions the lighter wallet took
differently. And the two arms bankrupt the same 16 careers: **the change moves who holds the money,
not whether the career survives.** That is what «what it buys» is there to say out loud – a family
with 701 weeks of its own burn in the bank is not a family the change has put under pressure.

### §3.1 ⚠ WHICH BIRTHDAYS COLLEGE EATS – the boundary, stated once

`inCollege` is `week < untilWeek`, so the week she ARRIVES and the week she is BACK are both tour
weeks. The birthdays that are eaten are the ones strictly inside the span.

* **On the real fork** the answer lands at school's end (~18.8) and she departs that September, so
  she is inside the freeze for her nineteenth, twentieth, twenty-first and twenty-second: **four
  steps eaten**, and she comes home on **20%** at twenty-three. That is the measured population,
  25 of 25 careers, and it is P6.
* **On a synthetic span that starts ON her nineteenth birthday** (`tests/round42-kid-share-ramp.test.ts`
  §3 builds one) only three are inside, and she returns on 30%. Same rule, one week's difference in
  where the span opens – worth knowing before anyone reads the two numbers as a disagreement.

⚠ **P3 and P4 are the two he is actually deciding on**, and they are different questions: the wallet
is what is left after everything, the prize banked is the tennis's own contribution to it. A wallet
that barely moves while the prize total drops a fifth means the family's other income is carrying it.

### §3.2 ⚠ P1 MISSED TOO, AND IT IS THE SAME CLASS OF MISS: THE PREDICTION READ THE LADDER, NOT THE CALENDAR

Her account at week 400 rose 41.9% against a predicted 70-110%. The prediction compared the two
LADDERS pointwise – 20 vs 15, 30 vs 20, 40 vs 25 – which is a ratio near +60% in the middle years,
and then assumed her balance was made of those years. It is not: at 21.7 her account is mostly money
banked at ages 18-20, when the two ladders are 10/10 and 20/15, and the big years are still ahead of
her. By week 600 the peak years are in the balance and the gap widens to +55.2%, which is P2.

⚠ The direction, the sign of every row and the conservation (§3's paragraph above) were all right.
What the prediction got wrong is which years a balance is made of – a fact about the horizon rather
than about the change.

*(Measured column filled in from `npx vite-node tools/r42-kid-share-ramp.ts` – §4.)*

---

## 4. The instrument

`tools/r42-kid-share-ramp.ts`. Real careers through the shipped engine at three settings of
`ECONOMY.kidShare`, on identical seeds and presets:

* **A · BEFORE** – `stepBps 500`, `capBps 5000`: the round-23 ladder exactly.
* **B · AFTER** – `stepBps 1000`, `capBps 6000`: what ships.
* **C · AFTER + the college pause** – the same dials, on careers that actually take the fork,
  walk four college years and come back. The pause is not a dial, so **C is a different population
  rather than a different setting**, and the report says so: it is read against its own no-pause
  control on the same seeds, never against A or B.

⚠ Actuation is proven in the run: an absurd arm (`stepBps 0`) must flatten her account to the
`startBps` line – measured $827 against $1,640 at week 400, so the dial is wired.

---

## 5. ⭐ THE COLLEGE ARM, MEASURED

27 careers walked to the fork and answered `college`. **26 reached the fork, 25 enrolled, 25 spent
at least one year** – 23 graduated the full four, two went bankrupt inside college after two years,
one answered college and never departed, one went bankrupt before the fork.

| | WITH the pause | the same careers, no pause |
| --- | ---: | ---: |
| her share the week she comes back | **20.0%** | **58.0%** |
| her age the week she comes back | 22.8 | 22.8 |
| birthdays the freeze ate | median **4**, max 4 | – |

Every one of the 25 returns on exactly 20%. **A girl who takes the degree comes back on the second
rung of the ladder rather than at the top of it**, and climbs from there – she reaches the 60% cap
at twenty-seven instead of twenty-three. That is «пока она снова в тур не вернется» as a number.

⚠ **P7 IS NOT MEASURED AND THE REPORT SAYS SO RATHER THAN ESTIMATING IT.** «Her account at week 600
against the no-pause arm» needs a second full walk with the mechanic disabled, and the pause is a
MECHANIC and not a dial – there is no constant to turn off. The rate columns above are the honest
comparison: the same careers, the same week, read with and without the paused count. Her account on
the college arm is $517,406 at week 600 and the family's wallet $1,219,798, and neither figure is
comparable with §1/§2 – four years off the tour is a different career, not a different setting.

⚠⚠ **AND THE FIRST RUN OF THIS SECTION WAS A NULL ARM, WHICH IS RECORDED RATHER THAN QUIETLY
FIXED.** It reported «25 careers stopped inside college, 0 years»: a college year pauses on her
birthday, on the student championship AND on the Nations Cup tie, and a press over an open reveal is
a reported no-op – so a driver that answered only the birthday banked nothing for ever. The census
above («reached the fork / enrolled / spent at least one year», with a reason for every career that
did not) exists so the next null explains itself instead of reading as a result.
