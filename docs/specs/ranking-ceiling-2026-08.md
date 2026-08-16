---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-04
---

# The ranking ceiling – is the top of the world arithmetically out of reach?

**Status: measurement, not a change.** No engine constant moved, no guard test was edited, no
balance change shipped. What exists is one new tool (`tools/ceiling-walk.ts`) and this page. The
target – whether the top 10 should be reachable, or the top 50, and how often – is the owner's
ruling and he has not made it.

Tool: `npx vite-node tools/ceiling-walk.ts [--seeds N] [--age N] [--from R] [--live N]`. Figures
below are `--seeds 24 --live 4`, age 19, runtime ~6 s.

---

## 0. The question, and why it had to be asked first

`docs/specs/money-decomposition-2026-08.md` measured 180 careers and found the best professional rank
any of them ever reached is **#237**, with all four rungs above #200 empty in the whole population.
`ECONOMY.development.ageCurve` states the design target in writing – *"by the plan's calibration:
first points 17-18, top-100 about 4.5 years later"* – so the shipped game misses its own written
target by a wide margin. The owner: «это у нас с механикой прокачки уровней скиллов значит что-то не
то. Надо проверять и исправлять, как так? ради этого вся игра, можно сказать.»

Three hypotheses were opened at once. This one is the arithmetic one and it runs first in logic,
because if it is true the other two are irrelevant:

> **THE CEILING IS ARITHMETIC.** No amount of skill can lift her past ~#200, because the rungs she is
> PERMITTED to enter cannot produce a best-16 book big enough to rank her any higher.

## 1. The answer, in one sentence

**It is false, and not marginally.** A player who wins every match she is allowed to play, on the
real calendar, under the real doors, the real sliding window, the real one-entry-a-week rule, the
real age allowance and the real mandatory regime, reaches **world #1 in two seasons** from the rank
the shipped game actually delivers. The fixed point of the iteration is **#1**.

| | |
| --- | --- |
| **THE FIXED-POINT RANK** | **#1** (from #237: one perfect season → **#48**, a second → **#1**) |
| the shipped game's best measured career | #237, ≈ **278 W points** |
| what her own window offered her that season | **1,325 points**, 14 events |
| so she banked | **21% of the book the rules put in front of her** |

**The doors and the window would permit a top-50 book from #237 in a single season.** So the question
belongs to the other two probes: what is holding careers at #237 is not the ladder's arithmetic.

⚠ **AND THE UPPER-BOUND SHAPE IS THE WHOLE ARGUMENT.** Three simplifications are baked in – she never
loses a match, her body never refuses a trip, and the LIVE cohort holds no professional points to
stand in front of her – and **every one of them can only make the computed ceiling higher than a real
career's**. "The ceiling is low" would therefore have been proof; "the ceiling is high" is proof of
exactly the converse. Section 7 prices the third one and finds it worth zero places.

---

## 2. What was measured, and the receipt that it is the same ladder

The tool simulates **not one match**. It is a points-and-doors calculation:

1. **The doors** come from `acceptanceRank(world, tier)` – the engine's own resolver, not a doc.
2. **The window** is `tierFloorOpen` / `tierOutgrown` (WINDOW_RUNGS 3, TERMINAL_RUNGS 4), asked of a
   world pinned at an exact merged-W rank.
3. **The season** is `buildSeason` for real, per world, with one entry a week (`enterEvent` refuses a
   second – she has one body) and the AER allowance applied.
4. **The book** is folded by `recomputeKidRank` – the game's one writer – over the real merged table
   (364 derived pros carrying the real points-to-rank curve).

Because the sweep arms need to move parameters the engine holds as module constants, the window is
also expressed as a small parametric model. **It is checked against the engine rather than trusted:**

> **THE WINDOW MODEL vs THE ENGINE – 4,500 (rank, age) pairs checked against `tierOpenFor`:
> IDENTICAL.**

⚠ One finding fell out of writing that check: `tierOpenFor` carries **no age clause of its own** – it
is the ladder's verdict (floor reached, not outgrown) and `entryStatus` applies `isTierAgeOpen`
beside it through `availabilityStatus`. Asking only the first reports a Grand Slam open to a
sixteen-year-old. Not a bug (no caller asks it alone), but it is a trap for the next tool.

### 2a. Greedy is optimal, and that is a fact about the problem

"At most one event per week" is a **partition matroid**, so taking events in descending title value
and keeping any whose week is still free maximises the chosen set's weight – and because the greedy
takes the biggest values first, the top sixteen of its set is also the best sixteen available.
Nothing smarter can beat it, which is what a ceiling needs.

---

## 3. The ladder, as the engine resolves it

| rung | accepts to | closes at | title | events/season | a season of nothing but this rung |
| --- | --- | --- | --- | --- | --- |
| W15 | on-ramp | #450 | 10 | 25 | 160 |
| W35 | #700 | #350 | 20 | 16 | 320 |
| W50 | #550 | #250 | 50 | 12 | 600 |
| W75 | #450 | #200 | 75 | 8 | 600 |
| W100 | #350 | #120 | 100 | 4 | 400 |
| WTA 125 | #250 | #65 | 125 | 4 | 500 |
| WTA 250 | #200 | never | 250 | 8 | 2,000 |
| WTA 500 | #120 | never | 500 | 10 | 5,000 |
| WTA 1000 | #65 | never | 1,000 | 8 | 8,000 |
| Grand Slam | #104 | never | 2,000 | 4 | 8,000 |

The brief's quoted cuts are confirmed from code: WTA 125 to #250, 250 to #200, 500 to #120, Slam to
#104, 1000 to #65.

## 4. What each rank band is offered, and what a perfect season of it pays

| at rank | rungs open | supply | entered | week clashes | slots of 16 | best-16 book | → rank |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #800 | W15 | 25.0 | 25.0 | 0.0 | 16.0 | 160 | #328 |
| #700 | W15, W35 | 41.0 | 33.0 | 8.0 | 16.0 | 320 | #214 |
| #550 | W15, W35, W50 | 53.0 | 36.7 | 16.3 | 16.0 | 680 | #125 |
| #450 | W35, W50, W75 | 36.0 | 28.2 | 7.8 | 16.0 | 1,000 | #83 |
| #350 | W50, W75, W100 | 24.0 | 21.0 | 3.0 | 16.0 | 1,188 | #66 |
| **#237** | **W75, W100, WTA 125** | **16.0** | **14.0** | **2.0** | **14.0** | **1,325** | **#48** |
| #200 | W100, WTA 125, WTA 250 | 16.0 | 14.2 | 1.8 | 14.2 | 2,738 | #17 |
| #120 | WTA 125, 250, 500 | 22.0 | 18.6 | 3.4 | 16.0 | 6,500 | #7 |
| #104 | WTA 125, 250, 500, Slam | 26.0 | 21.5 | 4.5 | 16.0 | 13,500 | #1 |
| #65 and better | WTA 250, 500, 1000, Slam | 30.0 | 26.3 | 3.7 | 16.0 | 18,000 | #1 |

Two things to note in that table before the verdict:

* **The window at #200–250 is the thinnest rung of the whole ladder** – exactly 16 events for 16
  counted slots, and two of them collide on the same week, so a *perfect* season there fills only
  **14 of 16**. It is the one place in the game where the calendar itself, not her tennis, costs her
  points. It is worth **175 points (1,325 against 1,500)** and moves the resulting rank from #32 to
  #48. Real, small, and nowhere near the size of the problem.
* **§11.3 of `act2-pro-tour.md` predicted 1,500 for this band** («a perfect, unreachable season of
  every WTA 125, W100 and W75 is 1,500 points ≈ real #45»). Measured against the shipped calendar and
  the shipped table it is **1,325 → #48**. The spec's arithmetic was right to within the week
  collisions it did not model.

### 4a. The iteration, and it is not path-dependent

```
from #237: #237 -> #48 -> #1        FIXED POINT #1
from #900: #900 -> #328 -> #66 -> #1
from #600: #600 -> #214 -> #48 -> #1
from #500: #500 -> #125 -> #17 -> #1
from #400: #400 -> #83  -> #1
from #300: #300 -> #66  -> #1
```

Every start converges to #1, in three perfect seasons at worst. **There is no trap anywhere on the
ladder** – no band where the window slides up into rungs that pay less than the ones it closed. Each
step up is strictly worth more than the step it replaces, which is the property the sliding window
was designed to have, and it holds end to end.

## 5. The two rules a perfect season could still have tripped on

Both are named in the brief and both are checked rather than assumed.

**The mandatory regime never bites her.** A skipped mandatory writes a **zero into one of her sixteen
counted slots** (`SeasonResult.mandatoryMiss`) – the one rule in the game that can make a season worth
less than the events she played. Measured at every standing that binds:

| at rank | skipped obligations | quota shortfall | penalty points | fees + travel | prize money | net |
| --- | --- | --- | --- | --- | --- | --- |
| #237 | 0.0 | 0.0 | 0.0 | $47,670 | $188,021 | +$140,351 |
| #50 / #20 / #1 | 0.0 | 0.0 | 0.0 | $122,537 | $17,571,667 | +$17,449,129 |

The reason is structural rather than lucky: the Slams and the 1000s are the **highest-value events on
the calendar**, they sit on **disjoint anchored weeks** (2/21/26/34 · 5/8/12/18/31/37/41/45 ·
4/10/15/19/24/28/33/39/43/47), and the greedy therefore enters every one of them before it looks at
anything else. The 500s quota of six is satisfied out of ten offered on their own weeks. **A player
who is good enough to be bound by the regime is a player who was going to enter those events
anyway.**

**Money does not bind either.** A perfect season is cash-positive at every band, including the
delivered one.

## 6. What binds it – the ordered list, with a measured value for each

Relaxing one rule at a time cannot rank anything against a fixed point that is already #1, so each
arm is measured where a real career actually meets these rules: **a perfect season at the delivered
rank #237**, shipped book 1,325 → #48.

| # | rule relaxed | entered | book | → rank | worth |
| --- | --- | --- | --- | --- | --- |
| 1 | **acceptsRank removed** – every rung admits anyone | 26.3 | 18,000 | **#1** | **+16,675 pts, 47 places** |
| 2 | **`BEST_N_BY_TRACK.wta` 16 → 8** *(tightening)* | 14.0 | 875 | #98 | **−450 pts, −50 places** |
| 3 | **WINDOW_RUNGS 3 → 2** *(tightening)* | 7.2 | 800 | #108 | **−525 pts, −60 places** |
| 4 | week exclusivity OFF – she may play every open event | – | 1,500 | #32 | +175 pts, 16 places |
| 5 | `tierOutgrown` OFF – nothing ever closes beneath her | 40.2 | 1,425 | #40 | +100 pts, 8 places |
| 5= | WINDOW_RUNGS 3 → 4 | 22.9 | 1,425 | #40 | +100 pts, 8 places |
| 5= | TERMINAL_RUNGS 4 → 8 | 22.9 | 1,425 | #40 | +100 pts, 8 places |
| 8 | `BEST_N_BY_TRACK.wta` 16 → 24 or 32 | 14.0 | 1,325 | #48 | **zero** – she cannot fill 16 |

Read as a ranking of what holds the fixed point down: **only the doors matter, and they hold her down
by nothing, because a single season inside them clears them.** Everything else is worth 8–16 places
at the delivered band and **zero** at the fixed point.

⚠ **Rows 2 and 3 are the ones worth keeping.** Both are *tightenings*, and both cost far more than
any loosening gains – best-8 would cost 50 places and a two-rung window 60. The shipped values are
not merely adequate, they are on the generous side of a knee: widening buys 8 places, narrowing costs
60.

### 6a. The one place the arithmetic genuinely does bind: age 16

| age | allowance | window | entered | capped out | book | → rank | fixed point |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 16 | 12 | W15, W35, W50 | 12.0 | **31.2** | 600 | #139 | **#139** |
| 17 | 16 | W75, W100, WTA 125 | 14.2 | 0.0 | 1,375 | #48 | #1 |
| 18+ | unlimited | W75, W100, WTA 125 | 14.0 | 0.0 | 1,325 | #51 | #1 |

**A sixteen-year-old cannot rank better than about #139 whatever she does**, and that IS arithmetic:
W75 and everything above it open at 17 (`minAgeYears`), so her window is capped at W50's 50-point
titles, and the AER allowance of 12 refuses 31 further entries she was offered. At 17 the allowance
of 16 exactly covers a 16-slot book and stops binding. **This is a designed pace rather than a
defect** – it is the real WTA age-eligibility rule and the ladder's own age gates doing what they
were written to do – and it is reported here so nobody looks for it as a bug later. It cannot explain
#237: the measured careers peak in their twenties.

> ⚠ **HALF THE ARITHMETIC ABOVE WAS REPEALED ON 16.08 AND THE CEILING SURVIVED IT.** The doorway is
> no longer what caps her window: W75/W100 open at **14** and the WTA rungs at **15**, on the owner's
> ruling that the tour's floors are the sport's own. **The two things that still produce the ceiling
> are the AER allowance of 12 and the acceptance cut** – W75's is #300, and a sixteen-year-old does
> not hold that rank – so the number stands and its cause moved one gate along. The paragraph is kept
> because it is the reading the measurement was made under. Grid, stated once:
> [`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

## 7. The last simplification, priced

The books above are built against a merged table whose LIVE cohort holds nothing. Ticked worlds, no
player entries, six seasons:

> live rivals holding at least **278 pts → 0.0** · 532 → 0.0 · 859 → 0.0 · 1,325 → 0.0 · 2,738 → 0.0
> For scale: the **best** live W row is **126 pts** and **20 of 199** rivals hold any at all.

So the cohort is measurably playing and measurably nowhere near her book: the simplification is worth
**zero places** at every level that matters. (The scale line is printed beside the counts on purpose –
a row of zeroes has to read as "the cohort holds nothing" and not as "the measurement is broken".)

## 8. How good she has to be – the handover to the other two probes

The ceiling assumes she wins every match. This table prices the assumption: the same seasons, the
same entries, but **every event ends at one fixed finish**.

| at rank | rungs open | W | F | SF | QF | R16 | R32 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #450 | W35, W50, W75 | #83 | #129 | #183 | #280 | #359 | #365 |
| #350 | W50, W75, W100 | #66 | #111 | #163 | #244 | #347 | #365 |
| **#237** | **W75, W100, WTA 125** | **#48** | **#100** | **#152** | **#226** | **#330** | #365 |
| #200 | W100, WTA 125, WTA 250 | #17 | #25 | #76 | #138 | #211 | #365 |
| #120 | WTA 125, 250, 500 | #7 | #11 | #19 | #43 | #111 | #365 |
| #65 | WTA 250, 500, 1000, Slam | #1 | #1 | #6 | #12 | #21 | #79 |

**The delivered career is performing at "quarter-final in every event".** A #237 player who reached
the quarter-finals of all fourteen events her window offers finishes the season at #226 – she holds
station. That is exactly where the measured population sits, and it says the constraint is **match
outcomes**, not entry rights.

And what the written target costs, in the same currency:

| to reach | needs | as a share of one perfect season at the #237 window (1,325) |
| --- | --- | --- |
| #237 | 278 pts | 21% |
| #200 | 347 | 26% |
| #150 | 532 | 40% |
| **#100** (the `ageCurve` target) | **859** | **65%** |
| #50 | 1,321 | 100% |
| #10 | 4,792 | 362% |

**The top-100 target is 65% of one season's available book at the rung she already stands on.** In
concrete terms: at the {W75, W100, WTA 125} window that is roughly *four WTA 125 titles plus four
W100 titles* out of a fourteen-event season – or the same total spread over more events and lesser
finishes. It is a demanding standard and it is not remotely a closed door.

## 9. The points-to-rank curve, for the record

Median over 24 worlds, the merged table as shipped:

| points | 160 | 250 | 400 | 650 | 1,000 | 1,200 | 1,400 | 1,500 | 2,000 | 2,900 | 4,000 | 6,500 | 10,000 | 18,000 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| rank | #328 | #256 | #180 | #130 | #83 | #63 | #42 | #32 | #22 | #16 | #12 | #7 | #2 | #1 |

Nothing below **100 points is distinguishable from unranked** (#364–365): the merged table's tail is
the 199 live rivals on or near zero, which is `fieldPros.ts`'s own known population limit ("#500 is
the one anchor this table cannot reach"). It does not affect anything in this document – every book
under discussion is far above it – but it is why the first two columns of the curve are flat.

---

## 10. What this hands back

**The ceiling is not arithmetic.** State it plainly: the doors and the window would permit a top-50
book from the delivered rank in a single season, and world #1 in two. No entry rule, no acceptance
cut, no window bound, no best-16 fold, no calendar limit and no mandatory obligation is what holds a
career at #237.

Therefore **no balance change is proposed here, and none should be made on the strength of this
document.** The cheapest change that would move the fixed point into the top 100 is **no change at
all** – it is already there, five times over. The candidates measured above (a wider window, a longer
counting book, relaxed doors) would each move the delivered band by 8–16 places and the *ceiling* by
nothing, so spending any of them on this problem would buy noise and cost the pacing the owner
already ruled on.

The question passes intact to the other two probes: **what stops her winning the matches her own
window puts in front of her.** The two numbers to carry across are

* she banks **21%** of the book her window offers, and
* she is performing at **quarter-final level** where the written target needs **finals-and-titles**
  level.

One further note for whoever picks it up. `money-decomposition-2026-08.md` §6a already measured that
**changing only how the calendar is played** – a rest floor at condition 70 and a $5,000 reserve, no
constant touched – moves the best peak rank from #237 to **#130**. Against this document's curve, #130
is worth about 650 points against #237's 278 – a career playing fresher wins **more of the same
matches**, and more than twice as many of them.
That is consistent with the constraint being match outcomes, and it points the other two probes at
the two things that decide them – **the skills she brings to the court** and **the condition she
brings them in**.
