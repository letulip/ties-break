# The holidays end in September, not on week 33 – round-16 #16, 11.08.2026

The owner, from his fourth Olivia season:

> school is shown in the calendar in August

and the rule he is measuring it against, which is his own from W3-SUMMER and W4-SCHOOL:

> after the exams there are holidays and doubled training until September

`src/engine/world/summer.ts` opens by saying its predicate stopped being about the summer and
started being about **school**. The arithmetic underneath it was about neither: it was about a
364-day year.

## 1. What was measured, before anything was changed

`SUMMER_WEEKS = [25, 33]` are **season-week offsets**. A season is 52 × 7 = **364 days**; the
calendar the screen prints is Gregorian, **365.2425 days**. So the window walks about **1.25 days
earlier against the real dates, every season, for ever**, while the exam fortnight it is anchored to
walks with it.

Measured on the owner's own save through the engine's own import door (`tools/round16-read.ts`,
`--save` a personal file that is never committed and from which nothing is derived beyond the four
dates below). Season-week offset 34 – the first week **outside** the old window, and therefore the
first week the calendar draws as school:

| season | week | Monday | verdict under the old ceiling |
|---|---|---|---|
| 0 | w34 | 1 September 2031 | September – correct |
| 1 | w86 | 30 August 2032 | **August, drawn as school** |
| 2 | w138 | 29 August 2033 | **August** |
| 3 | w190 | 28 August 2034 | **August** |

His save is at week 195. **w190 is five weeks before he reported it**, which is the week he saw.

So: exactly one week a season, from season 1 onward, was a school week in August – and it was a
school week in the engine too, not only on the screen. She lost the training block that week.

## 2. The fix, and why it is the predicate rather than the surface

The triage's question was *"either the predicate or the surface disagrees with it – find which"*.
It is the **predicate**, and it disagrees with **itself**: the file states a rule about school and
implements a rule about a season index.

`isSummerWeek` now takes its **floor from the season** and its **ceiling from the calendar**:

```ts
if (offset < SUMMER_WEEKS[0]) return false
return offset <= SUMMER_WEEKS[1] || weekMonth(week) === 8
```

* the floor stays the season's, because the holidays open the week after the last exam paper and the
  exam fortnight is season-week arithmetic too – so drift can never open the window **early**;
* the ceiling is August's last Monday, so the block can never run **into** September either.

It is an `||` rather than a replacement precisely so both bounds stay pinned. Nothing anywhere reads
a second copy of the rule: the engine's development bonus, its condition cost, the plan tab's
session capacity and the calendar grid's school furniture all flow through this one function, which
is what W3-SUMMER's "one predicate, one set of refusals" was for.

## 3. Predicted, then measured

**Predicted:** one extra school-free training week per season from season 1, none in season 0, and
nothing ever taken away.

**Measured** (`isSummerWeek` walked over eight seasons, old predicate against new):

| season | old | new | added |
|---|---|---|---|
| 0 | 9 | 9 | – |
| 1–5 | 9 | 10 | one August week each |
| 6–7 | 9 | 11 | two August weeks each |

**72 → 81 school-free weeks over eight seasons (+9, +2.16% of all weeks). Weeks the change took
away: 0.** A career runs from 14 to about 19–20, i.e. five or six seasons, so the real figure is
**+1 week a season, +2 in the last one**.

The prediction was right about the direction, the magnitude and the shape, and wrong about nothing
except seasons 6–7, where the drift has grown past a second week. That growth is bounded by
construction: the extension can never reach past 31 August and the floor can never move, so the
widest the block can ever be is its nine weeks plus whatever of August the drift has pushed out of
them.

## 4. What it costs, in the engine

Only what the block already costs: the extra week develops at `summerLoadFactor` and charges
`summerConditionCost`, both of which have followed `doublingShare` since v47. **A week she does not
double is 1.0 and 0**, so a migrated career – whose v46 → v47 migration lays one session a day and
never two – sees no change at all until the player ticks a second session onto a day. That is the
same scoping the school-ends sweep already recorded.

**RNG: untouched.** `weekMonth` is arithmetic over a fixed epoch and nothing in `summer.ts` draws on
any stream, so the frozen MAIN capture (41550 / `e6b0c709`) cannot see this change.

**Schema: untouched.** No persisted field, no migration, no golden fixture.

## 5. The guard

`tests/condition.test.ts` carried a walk over weeks 0–51 asserting `offset >= 25 && offset <= 33`
and calling it *"the window is the calendar's"*. It was true of season 0 and of no other season, and
it is the reason a whole-career defect had a green test over it. It is **re-aimed rather than
replaced**: the season-0 walk stays (the fix is a no-op there, which is worth pinning), it now says
in a ⚠ note that it can only ever see season 0, and a second `it` pins the September rule on the
three drifted seasons plus the floor on four. Mutation-verified: restoring the old ceiling turns the
new test red.
