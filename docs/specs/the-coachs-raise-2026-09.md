---
type: spec
status: current
area: engine/coach
canonical: false
last-reviewed: 2026-09-17
---

# The coach's fee is fixed at hire, and he asks – round 42 #51

The hired coach's weekly figure stopped floating on 17.09.2026. It is now the price the family and
the man agreed when they shook hands, and he asks for more once a year for as long as he works for
them.

## 1. What was wrong, in his words and in the code

He chose a coach at 2.2k a week, had a good season, and found the price had fallen to 1.8k without
anybody asking him anything:

> «я выбрал тренера за 2.2к в новом сезоне, сезон прошел хорошо, но во-первых, его цена в неделю
> упала до 1.8к, а во-вторых он не приходил за добавкой.»

> «мне кажется это не корректно»

And on the fix:

> «"зафиксировать при найме и пусть просит, как массажист" – верно»

**The figure was stored nowhere.** It was re-derived every week:

```
rate = facilityRateCents(her age, tier) + round(max(0, coach.rateCents - court) * coachRetainerBand(her WTA rank))
```

Three of those terms move on their own. `coach.rateCents` is re-drawn from a dearer row when she
crosses an age band; `facilityRateCents` steps with the same bands; and `coachRetainerBand` is a step
function on her **live** ranking, which goes down as well as up. So the family's payroll moved with
her results and her birthdays, and it could fall – the half no real coach would accept.

## 2. The fix is a partition, and it is the one the game already prints in two lines

`bandedRateCents` was always `court + labour`, and the two halves are two different kinds of fact:

* the **court** is a club's rent. A contract with a coach has never fixed what a venue charges, and
  the family already sees it as its own line («нам нужно отдельной строчкой списывать тренера, а
  отдельной рент залов и прочего», 08.08, `docs/specs/split-the-bill-2026-08.md`).
* the **labour** is the man's retainer. That is what two parties shake hands on.

So the labour half is written down at the hire and stops floating; the court half goes on floating.

```
billed rate = facilityRateCents(age now, tier) + min(agreed labour, market labour at her standing now)
```

`WorldState.coachDeal` (v82) holds the agreed figure, the week it was agreed, the four marks the next
ask is judged against and the residual banked since.

### ⭐ Two properties fall straight out of the shape, and both are measured rather than argued

**The fall is unreachable.** `ECONOMY.coach.hourlyRateCents` ascends down every column and
`courtTierFactor` is fixed per rung, so once the labour is pinned the billed rate is **monotone
non-decreasing** for the life of the arrangement. Swept over 5,508 (rung, age, rank-at-hire,
position-in-band) cells: **zero violations, worst step ×1.0000** (`npm run bench:coachraise` §C2,
and `tests/round42-coach-raise.test.ts` §A holds the same sweep).

**It can only ever cost the family less.** The billed rate is clamped at the market's own quote for
the same man, so it can never exceed what the shipped till was already charging. Measured over
careers, the family pays **95.4%–98.9%** of the floating fee (§C4 below). That is what makes the
change safe on a live save: the migration cannot raise anybody's bill.

## 3. The ceiling is the rank band, which is the scene round 42 #19 deferred in writing

His own line was «ceiling = the rank band». `ECONOMY.coach.retainerBandByRank` shipped in round 42
#19 as an arithmetic re-price, and its own comment said what it was leaving open:

> «3.1 asks for "renegotiation as a scene, not a slider" – a step is the thing a scene can be hung on
> later. What ships here is the arithmetic; **the scene is its own item**.»

This is that item. The band no longer moves a fee that is already agreed; it says how far an agreed
fee may be **asked** upward. Three things open room, and nothing else does:

| what opens room | how much |
| --- | --- |
| her ranking crossing a band (`≤ 100` → ×2.0, `≤ 10` → ×4.5) | ×2.00 / ×2.25 |
| her age crossing `coachAgeBand`'s first step (16 → 17) | ×1.17–1.33 by rung |
| her age crossing the second (22 → 23) | ×1.08–1.25 by rung |

⚠ **And the other reading of his sentence is flagged rather than silently refused.** «Ceiling = the
rank band» could also mean «the band caps how high in the 5–15% corridor he may ask this year». That
reading does not bound the compounding, which is the thing a ceiling is for – 15% a year for sixteen
years is ×9.36 (`docs/specs/the-masseurs-ask-2026-09.md` §3) – so the cumulative reading shipped. It
is his sentence and the alternative is a retune, not a rebuild.

## 4. Predicted vs measured – the corridor

**Predicted.** The corridor 5–15% is his, and the position inside it is the progress score. The
prediction before the bench: most asks would sit in the lower half, because the score is a weighted
mean of four components and a year that is outstanding on all four is rare.

**Measured** (`npm run bench:coachraise -- --seeds 24`, 168 careers × 780 weeks, 17.09):

| | min | p25 | median | p75 | max | mean |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| the ask that fired | 5.1% | 7.8% | 8.5% | 9.3% | 14.4% | **8.7%** |

* **474 of 474 asks are inside his 5–15% corridor** – 100.0%, on both ends.
* **2.82 asks per career** over fifteen years. He does not come every year, because he only comes
  when the market has left room.
* **12.0% of asks were decided by the ceiling** rather than by the score, so the progress basket is
  doing the work on the other 88%.

### ⚠⚠ THE FIRST MEASUREMENT MISSED HIS CORRIDOR ON THE LOW SIDE, AND THE MODEL CHANGED RATHER THAN THE NUMBER

The first run put **14.4% of asks under 5%**, with a minimum of **0.2%**. The cause was not the
corridor's arithmetic – it was that the corridor was only a clamp on the size of the ask and not a
condition on making one, so when the ceiling left 2% of room he took 2% and the row announced it as a
raise. The fix is a gate: **an ask smaller than his own floor is not an ask**, the room accumulates,
and the next anniversary can buy more. Nothing is lost by waiting, because the ceiling does not fall
back when an ask is skipped.

⚠ And a second, smaller version of the same miss was found by a test rather than by the bench:
`Math.round(labour × 1.05)` is the *nearest* integer to the floor and can sit below it – at
`labour = 1109` it gives 4.9955%. The gate uses `Math.ceil`, so the corridor holds on the cents.

### ⭐ The instrument was wrong before the model was, and it is recorded because it always is

The first run also reported «**decided by the ceiling: 250/250 (100.0%)**», which would have meant
the progress score was doing nothing at all. It was a broken column: it tested «the realised fraction
is below the corridor's top», which is true whenever the score is below 1 and therefore almost
always. A column that can only print one value is a check that always passes – the masseur bench's
own bankruptcy-column lesson, one wave later. Corrected, the figure is 12.0%.

## 5. What the ask reads – the progress basket, and why each component

His objection to the first draft is the whole of this section:

> «может такое быть, что всего с 1 титулом в сезон (например w250/w500) тренер будет требовать 15%?
> Кажется, что самого факта такого единственного титула маловато, нужна какая-то общая оценка
> прогресса»

| component | weight | what it reads | the reference it divides by |
| --- | ---: | --- | --- |
| **residual against expectation** | 0.35 | wave F1's per-match residual against the odds ring, banked since the fee was agreed | `ECONOMY.form.max` |
| **rank movement** | 0.25 | her place in the professional table against where it was at the handshake | halving her ranking number in a year |
| **realised development** | 0.25 | the share of the headroom she had at the handshake that she has since taken | `1 / (declineStart − her age)` – her own remaining years |
| **titles by tier** | 0.15 | every title won since the handshake, weighted by its rung | the top of `TIER_LADDER` |

**Why the residual is heaviest.** #51 calls it «the fourth and best», and gives the reason: «a coach
who got more out of her than the odds said is exactly the one who should ask». It is the only
component that cannot be earned by a season that was always going to happen.

**Why titles are lightest, and his objection made arithmetic.** At weight 0.15 a single title – even
a Slam, which is full marks on that component alone – can move the ask by at most 15% of the
corridor's width, so it buys **6.5%** and never his feared 15%. `tests/round42-coach-raise.test.ts`
§E2 pins exactly that sentence.

**Why realised development is measured against her own clock.** `ageFactor` returns exactly 0 from
`declineStart`, so she has `declineStart − age` years in which her headroom can still be taken; the
share that is *on pace* for one of those years is `1 / yearsLeft`. A career whose decline has begun
scores an exact 0 here, which is honest rather than harsh: there is no development left to have
realised. His own career is the illustration – round 44 §8 measured her growth as having ended at
week 633, with `ageFactor` at 0.00000 and four attributes still below their potential.

### ⭐⭐ Every reference is a figure the game already states out loud

That is a design constraint rather than an accident. A component with a private normaliser is a dial
nobody can argue with, and four of those would have made the score untunable. **The only fitted
numbers in this mechanic are the four weights**; the corridor's two ends are his, and the rank
halving is argued rather than fitted – there is no free parameter in «twice as good».

## 6. He never asks for less

The downward half is deleted rather than lettered, which is his ruling. Three things enforce it and
they are in three different places on purpose:

1. `coachAskFraction` has a **floor** and no negative arm at any score, including a dreadful one.
2. `resolveCoachRaise` writes nothing unless the new figure clears the floor, so a fee cannot move
   down and cannot move by a token amount either.
3. `coachRateCents` reads the **agreed** labour, so a fee that is already agreed is not re-derived
   from her ranking at all – which is the term that could actually halve it.

The case that would have bitten him is pinned: a career whose ranking leaves the top hundred between
one anniversary and the next keeps its fee and gets **no letter claiming a raise**
(`tests/round42-coach-raise.test.ts` §D2).

## 7. The market goes on floating, and that is correct

What a **new** coach costs is a fact about the market and her standing, so every row of the coach
market is still `bandedRateCents` at her live rank. What stops floating is the fee of a man already
on the payroll – and his row on that same shelf reads the agreed figure, because a market quoting one
number over the coach she is being billed another for would be the «three different retainers» defect
arriving one card over.

## 8. ⚠ What this does NOT do, said rather than left to be discovered

**«Refusal = he works out the season» is not built.** #51 names three things – the corridor, the
ceiling and the refusal – and the first two ship here. The refusal needs a world-initiated decision
the game has no surface for: a pending offer, two commands, a card, a notice period, and a scheduled
departure. Every one of those is new player-facing copy, and the masseur's own spec is explicit that
its two-branch shape was chosen because «a punishment with no counterplay contradicts the standing
"мы ни за что не наказываем"». The coach's third branch is legitimate – the market exists – but it is
a wave, not the tail of an item. **What ships instead is the masseur's tested shape**: the new fee is
live, the row names it, and the family's answer is the market it already has.

**The 2.2k → 1.8k was not attributed to a term, and his save was not available to this build.** The
enumeration over the shipped formula is what stands in its place (§C1 of the bench), and it is worth
more than one career because it is exhaustive:

| term | direction | measured range | did anybody agree to it? |
| --- | --- | --- | --- |
| his rate, age band 16→17 | up only | ×1.17–1.33 | no |
| his rate, age band 22→23 | up only | ×1.08–1.25 | no |
| the court, same two steps | up only | ×1.20 | no – it is rent |
| **the retainer band (her rank)** | **both** | **×0.48–0.73** | **no ← the only fall** |
| the training dial (hours) | both | ×0.67–1.50 | **yes** – the parent moved it |
| the week's jitter | both | ×0.85–1.17 | it is the week, not a price |

⚠⚠ **And the honest reading of his 0.82× at a high or elite rung is that this item may not be its
cause.** One fee's own week-to-week envelope (corridor × jitter) spans 0.745–0.786 at `budget` and
`middle` – wide enough to contain 0.82 – but only **0.852** at `high` and `elite`, which is not. The
retainer band's fall is ×0.48–0.73, too big. What reaches 0.82 at his rung is **the training dial**:
6→5 sessions is ×0.833 and 5→4 is ×0.80. That is a change the parent makes, and this item does not
and should not touch it. The fix still answers his ruling and still deletes the fall; it is stated
here so nobody credits it with a repair it may not have made.

## 9. The strings – ⚠ ONE, AND IT IS A DRAFT

Invariant 4: new player-facing copy is his. The masseur's ask is the model for the SHAPE – a compact
feed consequence that states the new figure and what it means – and never for its words.

> `{Coach} has asked for more after a year together – $X an hour becomes $Y. The rate stands until the next time it is agreed.`

⚠ It carries no masculine pronoun, which is R15-7's standing order and what `tests/coach-voice.test.ts`
enforces on every engine literal a player can read. ⚠ It names the **hourly** rate rather than a
weekly quote, because the weekly number depends on the training dial and would go stale the moment the
parent moved it. ⚠ It goes through `formatCents` – the one formatter, and the masseur's own 17.09
correction (a hand-rolled `$` prints `$1234` where the rest of the game prints `$1,234`).

## 10. Predicted vs measured – what it costs a family

**Predicted.** Uncertain, and in two directions at once: fixing the fee makes a career *cheaper*
(§2), and the ask makes it *dearer*. The prediction was that the two roughly cancel and that the
mechanic is texture rather than pressure, as the masseur's turned out to be.

**Measured** (24 seeds × 7 coached presets × 780 weeks; **S** = the shipped floating till, **A** = the
fee fixed and nobody asks, **B** = the fee fixed and he asks – all three arms in one tree, with the
reader present in every one):

| preset | asks (B) | first rate | last rate | multiple | **paid vs the floating fee** |
| --- | ---: | ---: | ---: | ---: | ---: |
| 8k · working · budget | 3.0 | $30 | $35 | ×1.15 | 98.6% |
| 8k · working · middle | 0.5 | $50 | $51 | ×1.04 | 98.9% |
| 25k · middle · budget | 5.0 | $30 | $38 | ×1.28 | 98.6% |
| 25k · middle · middle | 1.8 | $51 | $58 | ×1.13 | 98.8% |
| 25k · middle · high | 0.9 | $81 | $86 | ×1.05 | 98.2% |
| 120k · wealthy · high | 6.8 | $77 | $114 | ×1.48 | 96.9% |
| 120k · wealthy · elite | 1.8 | $152 | $174 | ×1.14 | 95.4% |

The prediction held on the direction: **every preset pays less than the floating fee**, and a fifteen
year arrangement reaches ×1.04–×1.48 rather than the ×2.65–×16.37 a naive 5–15% compounding would
give, because the ceiling binds.

### The three arms, side by side

| preset | arm | asks | end rate | end funds | bankrupt of 24 |
| --- | --- | ---: | ---: | ---: | ---: |
| 8k · working · budget | S | – | $35 | $23,583 | 11 |
| | A | 0.0 | $32 | $32,039 | 11 |
| | **B** | 3.0 | $35 | $27,324 | **14** |
| 8k · working · middle | S | – | $53 | $4,555 | 21 |
| | A | 0.0 | $50 | $1,500 | 23 |
| | **B** | 0.5 | $51 | $1,359 | **23** |
| 25k · middle · budget | S | – | $39 | $159,658 | 2 |
| | A | 0.0 | $34 | $176,602 | 1 |
| | **B** | 5.0 | $38 | $121,911 | **3** |
| 25k · middle · middle | S | – | $58 | $38,611 | 15 |
| | A | 0.0 | $53 | $40,679 | 15 |
| | **B** | 1.8 | $58 | $43,681 | **14** |
| 25k · middle · high | S | – | $85 | $3,422 | 22 |
| | A | 0.0 | $82 | $12,871 | 21 |
| | **B** | 0.9 | $86 | $7,300 | **21** |
| 120k · wealthy · high | S | – | $116 | $189,337 | 0 |
| | A | 0.0 | $85 | $243,471 | 0 |
| | **B** | 6.8 | $114 | $195,820 | **0** |
| 120k · wealthy · elite | S | – | $202 | $165 | 23 |
| | A | 0.0 | $157 | $22,711 | 22 |
| | **B** | 1.8 | $174 | $11,041 | **22** |
| **total** | S / A / **B** | | | | **94 / 93 / 97** |

⭐ **The end-rate column is the whole item in one line.** At the top of the market the shipped till
had reached **$202** an hour by the end of a fifteen-year arrangement, with nobody having agreed to
any of it; the agreed fee reaches **$174** – and it got there by asking, twice, on two anniversaries
the family could read.

⚠ **The bankruptcy column is reported as measured and is NOT claimed as a finding.** The totals are
94 / 93 / 97 of 168 careers, so the whole item costs about **three careers in a hundred and
sixty-eight** against the shipped game – and the per-preset signs are inconsistent (two presets are
*better* under B than under S). At n = 24 per preset, where a bankruptcy also truncates the career it
happens in and so moves every other column with it, that is inside the noise. If the seat's effect on
ruin is ever the question it needs its own arm with a far larger n, and this bench is not it.

⚠ **The sanity check CLAUDE.md asks for was run, and its answer is more interesting than a shrug.**
`--floor 0.40 --ceiling 0.40` is an absurd value and the flag exists so that it can be passed. The
columns move a long way and in a direction that reads at first as backwards: asks per career collapse
to **0.0–0.5** and the family pays as little as **83.2%** of the floating fee. That is the gate
behaving exactly as designed – at a 40% floor almost no anniversary has room worth asking for, so the
fee stays where it was struck. The arm is emphatically not a null arm, and the shape of its response
is itself a check on the gate.

## 11. Where it lives

| what | where |
| --- | --- |
| the partition, the corridor's arithmetic, the type | `coachLabourCents`, `coachAskFraction`, `CoachDeal` in `src/engine/coach.ts` |
| the constants and their reasoning | `ECONOMY.coach.raise`, `src/engine/economy.ts` |
| the handshake, the score, the ceiling, the ask | `src/engine/world/coachMarket.ts` |
| the persisted key | `WorldState.coachDeal`, `src/engine/world/state.ts` (v82) |
| the till | `resolveBaseCosts`, `src/engine/world/phaseFinance.ts` |
| the anniversary, and the residual bank | `src/engine/world/phaseHerWeek.ts`, beside the masseur's |
| the pins | `tests/round42-coach-raise.test.ts` (25 cases, six mutation arms) |
| the bench | `npm run bench:coachraise` (`tools/coach-raise-bench.ts`) |
