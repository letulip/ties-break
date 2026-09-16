---
type: spec
status: current
area: engine/staff
canonical: false
last-reviewed: 2026-09-16
---

# The masseur's annual ask – round 43 #4

The masseur's price stopped being a constant on 16.09.2026. It is now the price a family starts at,
and he asks for more once a year for as long as he works for them.

His ruling, whole:

> «Мы начинаем работать с массажистом по нашим текущим ценам, а дальше он приходит и просит прибавку,
> либо (так как альтернативы нет) добавить денег, но убавить количество процедур… может просить
> надбавок за свои часы ежегодно, может быть не так интенсивно как тренер. Психолога не трогаем
> наверное.»

## 1. What was built, and what it deliberately is not

The ask moves `ECONOMY.masseur.perSessionCents` **for that career**, once a year. The family answers
with the sessions-per-week dial that has been on his card since round 24: pay more for the same
hands, or hold the bill and drop a rung. Both branches are his own words and both already existed as
a control – **the feature adds no new dial and no new screen.**

There is **no third branch**. «Альтернативы нет» means a refusal cannot mean «he leaves and you hire
another», and a punishment with no counterplay contradicts the standing «мы ни за что не наказываем».
Two branches, neither of them losing.

The driver is **time served**, never her results. The coach asks against a progress basket because
developing her is his job; the masseur maintains her, and his value is his hours. Letting him read
her titles would make him a second coach and charge her success twice.

**The psychologist is untouched.** His retainer is still a flat rung price at any length of service,
and `tests/round43-masseur-raise.test.ts` §F pins that as a ruling rather than leaving it as an
omission nobody wrote down.

### No schema moved

Nothing is persisted for this. `hireMasseur` has always written one kept, tagged ledger row per
change of the arrangement (`MASSEUR_CHANGE_KEY`, the week in the key) and `pruneEvents` never touches
a kept row, so the employment history is already in every save that has ever had a masseur in it.
`masseurWeeksServedAt` sums the hired spans off those rows. This is `coachSinceWeek`'s own doctrine
one seat over: derived rather than stored, no schema bump, no migration, no golden fixture.

The spans are summed rather than measured from the first hire, and that is not tidiness. If the clock
restarted on a re-hire, a family could fire him for one week and buy the opening price back – a third
branch, free, and strictly better than either of the two he named. Under the span sum a release costs
the weeks it costs and resets nothing.

## 2. The model

```
rate(career) = round( perSessionCents × (1 + raisePerYear) ^ floor(weeksOnPayroll / 52) )
```

rounded to whole dollars from the **unrounded** power, so the card's quote, the ledger's row and the
arithmetic a player does in his head are one number. `raisePerYear` is **0.04**. Everything that
quotes a price – the weekly bill, the per-match tour week, the three rung prices on the card, the
ask's own sentence – reads that one function.

## 3. Predicted vs measured – the intensity

**Predicted.** «Не так интенсивно как тренер» is the whole constraint, so the number had to sit
clearly under the coach's own annual corridor of 5–15% (round 42 #51, specified and unbuilt). 4% was
chosen against that alone, with the prediction that it would be **felt over a career rather than over
a season**: one rung of erosion at a constant spend across a full professional life.

**Measured** (`npm run bench:masseurraise`, M1/M2, 16.09):

| years served | 0 | 1 | 2 | 4 | 8 | 12 | 16 | 20 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| a session | $75 | $78 | $81 | $88 | $103 | $120 | $140 | $164 |
| 2/wk | $150 | $156 | $162 | $176 | $206 | $240 | $280 | $328 |
| 7/wk | $525 | $546 | $567 | $616 | $721 | $840 | $980 | $1,148 |
| multiplier | 1.00 | 1.04 | 1.08 | 1.17 | 1.37 | 1.60 | 1.87 | 2.19 |
| the coach at 5% | 1.00 | 1.05 | 1.10 | 1.22 | 1.48 | 1.80 | 2.18 | 2.65 |
| the coach at 15% | 1.00 | 1.15 | 1.32 | 1.75 | 3.06 | 5.35 | 9.36 | 16.37 |

The prediction held: **under the corridor's floor at every horizon**, and a twenty-year masseur costs
2.19× what he cost at hire against the coach's 2.65×–16.37×.

### ⭐ And the upper bound turned out not to be a matter of taste

The parents' own contribution compounds **5–10% a season** (his round-12 ruling,
`ECONOMY.incomeGrowthBand`). Any masseur drift at or above 5% would therefore climb against the
household's week for ever, and the entry rung would eventually leave a modest family behind. So the
design has a **hard ceiling at 5%/yr that comes from his own earlier ruling**, and the coach's
corridor floor happens to sit on the same number. 4% satisfies both with one value.

## 4. Predicted vs measured – the bottom rung's reach

The round named one thing the bench must check above all: *the drift must never push the BOTTOM rung
out of a modest family's reach, or the poor lose the seat to arithmetic rather than to a decision.*

**Predicted.** Uncertain. The entry rung's bill rises 4%/yr in cash terms, which looks like a
squeeze, and the fear was that a working household would be forced to release him.

**Measured** (M3 – the entry rung as a share of the parents' weekly contribution, averaged over 12
income trajectories, since the ladder is a per-season draw):

| years served | 2/wk bill | working | middle | wealthy |
| --- | ---: | ---: | ---: | ---: |
| 0 | $150 | 61.2% | 35.3% | 20.0% |
| 4 | $176 | 54.1% | 31.2% | 17.7% |
| 8 | $206 | 47.2% | 27.2% | 15.4% |
| 12 | $240 | 40.9% | 23.6% | 13.3% |
| 20 | $328 | 31.4% | 18.1% | 10.2% |

**The fear was wrong, and it was wrong for a structural reason rather than by luck.** 4% loses to the
5–10% income ladder, so the entry rung gets *cheaper* against the household every single year, on
every background. The poorest family's seat goes from 61% of a week's contribution to 31%. The
constraint is not merely satisfied; it cannot be violated while `raisePerYear < incomeGrowthBand[0]`,
which is the sentence `tests/round43-masseur-raise.test.ts` §B pins.

**Measured on real careers** (M5, 12 seeds × 728 weeks, the entry rung, the two modest presets, the
same seeds with the ask off and on – the A arm is this tree with the constant at zero, so the reader
is present in both):

| preset | arm | weeks served | releases | salary paid | end funds | end rate | bankrupt |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 8k · working · middle coach | A | 419 | 0.17 | $48,325 | $6,371,780 | $75 | 0 |
| | B | 419 | 0.17 | $57,254 | $6,362,851 | $102 | 0 |
| 25k · middle · middle coach | A | 418 | 0.58 | $49,200 | $4,443,920 | $75 | 1 |
| | B | 419 | 0.58 | $58,204 | $4,434,984 | $102 | 1 |

Eight years of service, the rate at $102, **18.5% more salary paid over the career, zero extra
releases and zero extra bankruptcies** – the one career that goes under on the 25k preset goes under
in BOTH arms. The arm is not a null arm: `--raise 0.40` moves these columns a long way (the run is in
the handoff), which is the sanity check CLAUDE.md asks for before a null result is believed.

⚠ **AND THE BANKRUPTCY COLUMN WAS WRONG ON ITS FIRST RUN, which is why it is worth stating that it
is now a measurement.** The bench read `world.ending?.kind` against `'bankrupt'`; the field is `type`
and the value is `'bankruptcy'`, so the column could only ever print 0 – a check that always passes.
`vue-tsc -b --force` inside `npm run check` caught the field name (`tools/` is typechecked); the
VALUE would have survived that, and was found by asking why a column of zeroes never moved even at
`--raise 0.40`. The numbers above are from the corrected run.

## 5. ⚠ A correction to the round-43 ledger's own illustration

The ledger explains the mechanic as:

> «Seven sessions a week bought at 22 are four by 26 on the same money.»

**That is wrong twice, and the second half is the more useful correction.**

1. **The rate it implies is 15%/yr** – 7/4 = 1.75× in four years – which is the *coach's ceiling*,
   not a seat that asks «не так интенсивно как тренер». At the shipped 4% the same sentence takes
   **fifteen years**, not four (M4).
2. **The erosion is never gradual, because the dial is coarse.** It sells 2 / 4 / 7 and nothing
   between, so a constant spend stops covering its rung on the *very first ask*: $525 buys seven
   sessions at hire and seven sessions cost $546 a year later. There is no year in which the money
   quietly buys six.

What the drift actually does is price his two branches against each other, once a year:

| rung | at hire | +1y | +4y | +8y | +12y | dropping a rung saves |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2/wk | $150 | $156 | $176 | $206 | $240 | – the floor |
| 4/wk | $300 | $312 | $352 | $412 | $480 | 50.0% of the bill |
| 7/wk | $525 | $546 | $616 | $721 | $840 | 42.9% of the bill |

Each year the family is asked to find **4% more** or to save **43–50%** by working him less. That is
his «либо добавить денег, либо убавить количество процедур» exactly, and it is a cleaner reading of
the design than the ledger's own sentence.

## 6. ⚠ What this is honestly small at

On a career that reaches the professional tour and stays there, the ask is **texture rather than
pressure**: M5's households end with $4–6M and 18.5% more masseur salary is noise against that. The
reason is the same arithmetic that makes §4 safe – the family's money compounds faster than his rate.
The pressure is real only where money is tight, which is the early professional years, and those are
exactly the years in which he has served least and asks least.

This is recorded rather than tuned around, because tuning around it means going above 5%, and above
5% the bottom rung starts leaving modest families behind. **The gentleness and the reachability
guarantee are the same fact.** If a sharper bite is wanted later, the lever is the *rung ladder*
(a fourth rung, or a wider gap), not the drift.

## 7. The strings – ⚠ DRAFT, his to rule

Two, because a family already on the entry rung has no rung to drop to and a line offering one would
be the screen lying about a choice:

> `The masseur asks for more – $78 a session from this week. The same hands at a higher bill, or the same bill for fewer visits.`

> `The masseur asks for more – $78 a session from this week. There is no shorter week to drop to.`

⚠ **Neither line carries a masculine pronoun, and that is R15-7 rather than style.** The first
draft of the second line read «to drop him to» and `tests/coach-voice.test.ts` went red on it: the
guard bans `he`/`his`/`him` from every engine literal a player can read, and `masseur.ts`'s own «the
pronoun is safe here» note is about the NOUN, not about this.

The figure is live. Nothing else on any screen changed: the seat card's rung prices and its
per-match sentence now read the career's rate instead of the constant, and **not one word moved**.

## 8. Where it lives

| what | where |
| --- | --- |
| the counter, the rate, the ask | `src/engine/world/masseur.ts` |
| the constant and its reasoning | `ECONOMY.masseur.raisePerYear`, `src/engine/economy.ts` |
| the call site | `src/engine/world/phaseHerWeek.ts`, immediately before `resolveMasseur` |
| the card's live rate | `Snapshot.masseurPerSessionCents`, read by `SupportStaffTab.vue` |
| the pins | `tests/round43-masseur-raise.test.ts` (23 cases, five mutation arms) |
| the bench | `npm run bench:masseurraise` (`tools/masseur-raise-bench.ts`) |
