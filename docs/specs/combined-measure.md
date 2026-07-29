# The combined measurement — both ladders and the coach ladder, on one main

Both slices were designed and measured in isolation, and both move the same joint: how many
tournaments she can afford. This is the run on the merged `main` (`8820613`, schema v24) that
replaces every table in `two-ladders.md` and `coach-tiers.md`. 120 seeds per cell, 14→18, both
policy arms.

**GRINDER** is the old bench policy: enter everything available, spend toward zero.
**PLAYER** keeps a cash reserve, respects a rest floor, and uses the competition-week coach toggle.
Its three levers move together — it is a policy, not a controlled experiment.

| preset | survival G / P | rank at 18, G / P | end funds, G / P |
| --- | --- | --- | --- |
| 8k working · self | 120 / 120 | #77 / **#64** | $45.6k / $48.6k |
| 8k working · budget | 115 / **120** | #62 / **#51** | $21.5k / $22.1k |
| 8k working · middle | 95 / **118** | #62 / **#48** | $10.0k / $8.1k |
| 25k middle · self | 120 / 120 | #79 / **#57** | $74.6k / $78.3k |
| 25k middle · budget | 120 / 120 | #59 / **#51** | $38.8k / $41.3k |
| 25k middle · middle | **120 / 120** | #62 / **#47** | $24.2k / $17.8k |
| 25k middle · high | 71 / 52 | #71 / #115 | $3.3k / −$2.1k |
| 120k wealthy · high | 120 / 120 | #66 / **#48** | $131.8k / $110.0k |
| 120k wealthy · elite | 120 / 117 | #64 / **#46** | $89.9k / $44.6k |

## 1. The bankruptcy problem is gone, and what is left of it is correct

The slice that started all of this was «средняя семья с наёмным тренером разоряется в 120 карьерах
из 120». That cell is now **120/120 on both arms**.

Exactly one cell still breaks: **25k middle · High coach**, at 71/120 and 52/120. That is no longer a
defect. A middle family cannot afford a High coach — it is a true sentence about money, and the rung
below it (Middle coach) survives 120/120 and finishes at #47. The wall moved from "any coach at all"
to "the rung above your means", which is where a wall belongs.

## 2. The coach ladder is no longer inverted — it runs the right way for the first time

Under the player arm, mean rank at eighteen, by rung:

```
8k working    self #64  ->  budget #51  ->  middle #48
25k middle    self #57  ->  budget #51  ->  middle #47  ->  high #115 (broke)
120k wealthy                                high   #48  ->  elite  #46
```

**Monotone. A better coach produces a better player, at every rung a family can actually hold.**
Neither slice did this alone — on the coach branch by itself High and Elite scored *worse* than
Middle for all three families. It took the two ladders (which stopped the calendar being bought with
money) plus the competition-week rule (which stopped her paying a retainer for weeks spent in a
draw) together.

## 3. ⚠ A conclusion of mine that the merge overturned

I reported, from the coach branch alone: *"Elite does not pay off — High beats Elite on every axis."*
On the merged code that is **no longer true**. Elite now finishes ahead: **#46 against High's #48**.

It is a trade rather than a trap: those two places cost **$65k** of end funds ($44.6k against
$110.0k) and three careers in 120 of solvency (117/120 against 120/120). Elite is affordable, it is
slightly better, and it eats the cushion. That is a real decision for a wealthy family to make, which
is what the rung is for.

The owner's «пусть игроки удивятся» is intact and untouched — nothing here was tuned toward it.

## 4. The plateau finding, confirmed on all nine presets

The player arm enters **roughly half** the tournaments of the grinder arm (e.g. 8k working: 79.5
events against 43.1) and finishes **11 to 22 ranking places higher in every single preset**. Grinding
is not merely inefficient in this game; it is actively worse, and now it is worse everywhere rather
than in one measured career.

It costs time rather than results: the working self-coached family reaches the pro-attempt proxy in
85% of careers under the player arm against 66% under the grinder, but the median reach week moves
72 → 108. She gets there, later.

## 5. National held

3.6 to 6.6 entries per four-year career across every preset, against the 0.2–0.6 that the stagger was
written to fix. The rung she climbs through is still a rung she climbs through after the coach ladder
landed on top of it.
