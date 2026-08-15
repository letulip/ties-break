---
type: specification
status: draft
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-15
---

# The Play Down rules – a rung she has outgrown stops being hers

**P1 step 2 of `docs/plans/college-and-the-junior-ladder.md`, on the owner's ruling of 15.08:
«да, делаем тоже». Step 1 (the Junior Accelerator) is the same files and a separate commit with a
separate measurement – `docs/specs/junior-access-2026-08.md`.**

> **THE STEP IN FIVE LINES.** Reality bars a **WTA top-50 from every W event** and a **top-150 from
> W15 and W35**. It is the ONLY change in the whole plan that pushes her UP, which is exactly why its
> number must not be added to step 1's. **It is a rank READ, not a latch: it self-reverses the week
> she drops back**, asserted in both directions in one test plus a byte-identical world.
> **Measured: it fires in 59% of careers and moves almost nothing (+1.8% prize, two more majors),
> because after step 1 nobody reaches the top 150 before age 20.3 on a horizon that ends at 22.**
> It left **zero** weeks with nothing to play. Zero schema.

---

## 0. THE PREDICTIONS, WRITTEN BEFORE THE ARM WAS RUN

Invariant 4. Same tool, same seeds, same horizon as step 1 – `tools/junior-access.ts`, n = 54, 416
weeks, policy 1. The arm is measured against **step 1's tree**, not against the frozen baseline, so
the number is this rule's own.

| # | claim | predicted |
| --- | --- | --- |
| Q1 | W15 + W35 entries per career, late years | fall once she is inside #150 |
| Q2 | W50 / W75 / W100 / WTA 125 entries | rise by roughly what W15+W35 lose |
| Q3 | rank at 21 | improves (a lower number) by 10-40 places |
| Q4 | prize banked to the horizon | up – the rungs it forces her onto are the ones that pay |
| Q5 | careers ever entering a W75 | unchanged or slightly up |
| Q6 | the college door | broadly unchanged: it is shut by a W75 counting result, and this rule does not gate W75 |
| Q7 | survival | unchanged. ⚠ THE RISK IT CARRIES is a junior who is inside #150 – W15 and W35 shut by this rule, W50+ shut by the Accelerator – so the W table could go dark for her. She keeps her junior calendar and the domestic ladder, and the prediction is that this is rare; it is measured rather than assumed. |

---

## 1. WHAT THE SPORT SAYS

`docs/research/ranking-points-by-tier.md` §4c C, quoting the 2026 WTT Regulations' "WTA Play Down
Rules" verbatim: players ranked **1-50** in singles cannot enter, accept a wild card into, or compete
in these events. `docs/research/real-ladder-pace.md` §4 records the second limb: **a player ranked
WTA #1-150 may not enter W15 or W35 at all**, and names it *"the real `tierOutgrown` … a hard rank
cut at #150, not a sliding window"*.

---

## 2. WHAT SHIPPED

`PLAY_DOWN` and `playDownBars` in `src/engine/world/ladder.ts`, read by `tierFloorOpen`'s W arm (the
calendar) and by `entryVerdict`'s W arm (the turnstile) – **one predicate at both surfaces**, which is
the whole of what keeps R10-5 true.

**Placed ABOVE the on-ramp branch, deliberately.** W15 returns out of `accepts === undefined`, so a
check placed after it would never be asked about the one rung the #150 limb is mostly about.

⚠ **SCOPE IS THE W SERIES, NOT THE W TABLE** (`isWSeriesTier`, `W_SERIES` in season/calendar.ts – the
same list step 1 uses). A WTA 125 and the majors are never barred: the rule is the ITF World Tennis
Tour's, about its own events, and barring a top-50 from the rungs she is top-50 *because of* would be
the opposite of the regulation.

⚠ **"UNRANKED IS NOT A RANK", one last time.** A girl with no W points holds no W ranking and cannot
be barred by one; without the guard the missing-cache sentinel is a perfectly good-looking integer.

### 2a. ⚠⚠ THE PROPERTY THE OWNER NAMED IS THE TEST

> «когда она вывалится из топ-50 и топ-150 оно само откроется обратно»

Exactly – it is a rank READ, not a latch. `tests/play-down.test.ts` §1 walks the line in **both
directions in one case**: at #300 the whole W series is hers, at #120 the bottom two go, at #40 all
five go, and at #300 again **all five come back** – and then asserts that
`JSON.stringify(world)` is byte-identical across the round trip. A latch, a flag, a spent counter or
a remembered week would each show up there as a difference. A test that only walked one way would
pass just as happily on a latch, and a latch is the one thing this must not be.

### 2b. ⚠⚠ A THIRD CEILING, AND `hasOutgrown` HAD TO LEARN ABOUT IT

**A rung this rule bars is a rung she has OUTGROWN** – that is the whole content of "a WTA top-50 may
not enter a W event" – so `hasOutgrown` folds it beside the domestic band's ceiling and the sliding
window's. It is a correction, not a convenience, and `tests/ladder-floor.test.ts` is what found it:
without the term, `tierOutgrown('w15')` asks whether W75 is open, this rule has just shut W75 as
well, and the answer comes out **backwards** – the world number forty is told she has not passed the
bottom rung of the ladder, and the coach's arithmetic argument goes quiet on exactly that career.

⚠ **AND IT COULD NOT HAVE BEEN PUT IN `tierOutgrown` INSTEAD.** `Snapshot.tierOutgrown` is built from
`hasOutgrown` (world/snapshot.ts), which is the single answer world.ts demands both ceilings have;
splitting the third one across two functions is the drift that rule exists to forbid.

⚠ **IT CANNOT MOVE A MEASURED NUMBER, and the reason is structural rather than lucky.** The bench
policy's entry loop asks `tierOpenFor` – which already contains this rule – several lines BEFORE it
asks `hasOutgrown`, so the term only ever fires on a rung the loop has already skipped. Every entry
this wave measured is unchanged by it, which is why §3's figures stand as taken.

⚠ **AND THE COMPARISON WITH `tierOutgrown` IS WORTH GETTING RIGHT, because it is easy to state
backwards.** `tierOutgrown`'s own note calls it *"a ROLLING TEST, NOT A LATCH"*, and on a W rung it
is one: it asks `tierFloorOpen` of the rung three above, whose W arm is a live rank read. On a JUNIOR
rung it is **not** – there the rung three above is W15, and W15's door is `onRampOpen`, a latch set
once and never cleared. So "the window slides back down with her" is true of the professional ladder
and false of the junior one. This rule is a live read on every rung it touches.

---

## 3. MEASURED

`npx vite-node tools/junior-access.ts -- --seeds 6 --weeks 416`, n = 54, identical seeds, **measured
against step 1's tree** so the number is this rule's own and not step 1's.

### 3a. ⚠⚠ THE HEADLINE IS THAT IT BARELY MOVES ANYTHING – AND THAT IS THE FINDING

| | step 1 | step 1 + step 2 |
| --- | --- | --- |
| W15 entries per career | 54.6 | 54.4 |
| W35 / W50 / W75 / W100 / WTA 125 entries | 2.1 / 4.8 / 7.1 / 6.7 / 7.2 | 2.1 / 4.8 / 7.1 / 6.7 / 7.2 |
| WTA 500 entries · share ever | 1.5 · 26% | **1.6 · 28%** |
| Slam entries · share ever | 0.3 · 11% | **0.4 · 13%** |
| median W rank at 19 / 20 / 21 | 279 / 168 / 178 | 279 / 168 / 178 |
| mean career-high W rank | 135 | **133** |
| prize to the horizon (mean) | $305,613 | **$311,160** (+1.8%) |
| prize by 19 | $80,146 | $80,252 |
| college closure rate / age | 96% / 18.9 | 96% / 18.9 |
| careers ending early | 0 of 54 | 0 of 54 |

**Every movement is in the predicted direction and every one is small.** Two more careers reach a
WTA 500, two more reach a major, the career high improves by two places and the money is up 1.8%.
Nothing regressed anywhere, on any column.

### 3b. WHY IT IS SMALL, WHICH IS A FACT ABOUT STEP 1 RATHER THAN ABOUT THIS RULE

The rule can only bite a player who is INSIDE the top 150, and after step 1 a career does not get
there until the very end of this horizon: median W rank is 279 at nineteen, 168 at twenty and 178 at
twenty-one. So on a 14→22 run the rule has roughly one season in which it has anything to say. **The
+1.8% is what one season of it is worth; it is not a measurement of the rule at maturity.**

⚠ **THIS IS THE ONE NUMBER P6 SHOULD RE-TAKE ON A LONGER HORIZON.** The plan's own re-measure phase
runs P0's battery again; this rule is the argument for extending it past twenty-two, because a career
that spends five years inside the top 150 meets it every week of them and this run sees one.

### 3c. Predicted vs measured, scored

| # | predicted | measured | |
| --- | --- | --- | --- |
| Q1 | W15+W35 entries fall late | 54.6 → 54.4, W35 flat | ✓ direction, tiny |
| Q2 | W50-WTA125 rise by what the bottom loses | flat; the gain lands at WTA 500 and the majors instead | ~ |
| Q3 | rank at 21 better by 10-40 | 178 → 178 (median); mean 198 → 197 | ✗ – no room on this horizon |
| Q4 | prize up | +$5,547 (+1.8%) | ✓ |
| Q5 | ever-W75 unchanged or up | 94% → 94% | ✓ |
| Q6 | college door unchanged | identical on every column | ✓ |
| Q7 | survival unchanged, and no week left empty | 0 careers ended; see §3d | ✓ |

### 3d. ⚠ THE RISK IT CARRIES, MEASURED RATHER THAN ASSERTED

`tools/play-down-probe.ts` exists for exactly one reason: **"+1.8%" and "it never fired" are the same
number to the naked eye and completely different findings.** It counts the refusals themselves, and
the weeks in which the whole ladder had nothing open – the boredom failure the owner has ruled
against twice, which is the shape this rule could take if a girl inside #150 lost W15 and W35 to it
while the Accelerator held everything above them shut.

`npx vite-node tools/play-down-probe.ts -- --seeds 3 --weeks 416`, n = 27, same policy and horizon:

| | |
| --- | --- |
| careers that ever reach WTA top 150 | **16 of 27 (59%)**, first at mean age **20.3** (earliest 19.2) |
| careers that ever reach WTA top 50 | **0 of 27** |
| **careers the rule ever refused** | **16 of 27 (59%)** |
| weeks per career it was refusing | mean 13.6, median 8, max 59 |
| refusals by rung | **W15 368 · W35 368 · W50/W75/W100 0** |
| **⚠ weeks with NOTHING open on the whole ladder** | **0**, across all 27 careers |
| careers with any such week | **0 of 27** |

**So it fires, in three careers of five, and it never left a week empty.** The #150 limb does all the
work; the #50 limb is exercised by `tests/play-down.test.ts` and by no career on this horizon, because
**no career reaches the world's top 50 before twenty-two**. That is a fact about how far up this
ladder goes in eight years, recorded here because it is the reason the second limb has no measured
consequence yet – not evidence that it is wrong.

⚠ **AND IT CONFIRMS §3b's DIAGNOSIS RATHER THAN RESTING ON IT.** First entry into the top 150 is at
mean age 20.3 against a horizon that ends at 22: the rule gets a season and a half of a career, and
is worth +1.8% of prize money in it.
