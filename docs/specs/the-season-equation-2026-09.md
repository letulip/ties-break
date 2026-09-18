---
type: spec
status: reference
area: simulation-and-balance
canonical: false
last-reviewed: 2026-09-18
---

# The season equation (18.09.2026) – a breakout year, the fall after it, and what the two fatigue dials are worth

## 0. What he saw

His career, played across the round-44 merge:

> «Был неудачный сезон на 56 или 59 месте, после этого пришла волна наших правок, случился новый
> безумный сезон, который она закончила на 17 месте, а потом полный провал обратно на 82 месте в
> рейтинге. это надо исследовать под номером 1.»

And separately, about the body:

> «мне кажется нам надо немного увеличить восстановление в неделю. Получается, что я езжу в отпуск
> 1-2 раза в месяц, хотя вроде бы надо тренироваться» … «может быть мы сильно много снимаем за турнир
> всё-таки, я вот думаю? Это тоже можно исследовать как рычаг»

His own figures from play: about 25 condition for an ordinary tournament, 33–34 at a Slam, and 9–10
recovery a week – pro phase, masseur daily, plan set to 80 training.

**This is an investigation, not a tuning pass. No constant moved.** Everything below is measured with
the shipped values in place; every alternative is a dial patched on the live `ECONOMY` object for the
length of one run and put back afterwards, in this same tree, on this same commit. §8 names a number
for him to pick, and leaves it unpicked.

**The short answer, before the working:**

1. **The collapse is not the body.** It is 99% a shortfall in what she earned, 1% the table moving,
   and her condition in the collapse season is identical to the breakout season. Switching fatigue off
   entirely does not reduce how often the shape happens.
2. **His fatigue complaint is right, and his own numbers are right.** A tournament week really does
   cost 25 when she reaches a final – and the mean is 15 because half her weeks are early exits.
3. **But the dial he named first is the weaker of his two by a factor of eight.** The family week,
   not the weekly recovery, is carrying 78% of everything she gets back.

---

## 1. The model, in prose

The season equation is his, and it was written down in `fatigue-reprice-2026-08.md` §1:

> «Если нам надо сыграть 20 чемпионатов в год, то это 60-100 матчей примерно. При этом это КАЖДАЯ
> ВТОРАЯ НЕДЕЛЯ в году БЕЗ ПРОПУСКОВ ВООБЩЕ. Т.е. нам надо, чтобы состояние усталости накапливалось -
> это верно, но к концу сезона мы бы привозили то, что за off-season РЕАЛЬНО восстановить с 1 большим
> или парой небольших отпусков.»

Three clauses, and they become arithmetic directly. Twenty events on every second week. Fatigue that
accumulates, so each play-and-rest pair costs something. And a season-end deficit small enough that
the off-season plus **one big holiday, or a couple of small ones**, really clears it – which was read
as arriving at the off-season door around 45–50, so each pair costs about −2.75.

That arithmetic balanced when it was written: an average professional event cost about 12.5, and a
rest week returned `recoveryBase` 8 plus the slider's 2, so the pair came to about −2.5.

**Two things happened afterwards and neither of them re-derived it.**

**(1) The professional rest week stopped returning ten.** On 22.08 `proPhaseRecoveryBase` went 8 → 5
– his own variant C, made so the masseur would have something left to add («тогда массажист как раз
будет еще немного накидывать»). A professional rest week now returns 5 + the slider, and the masseur's
top rung puts 3 of it back, but only on the weeks she does not play.

**(2) The average was never what a season is made of.** The drain is charged PER MATCH:
`matchDrain` = scoreline (2 straight sets, 3 hard, +1 for a three-tiebreak epic) + the rung's own
surcharge, plus a cumulative ladder. So a first-round exit and a title are two entirely different
weeks wearing one name, and the deeper she goes the more the week costs. A breakout season is made of
deep runs – so the very success being measured moves the cost.

The hypothesis under test was therefore: **success is self-limiting** – a season that balances for a
mediocre year does not balance for a great one, so his 17th place mechanically produces the fall
after it. §3 finds the first half of that true. §5 finds the second half false.

---

## 2. What was predicted, before any of it was run

Written down before the bench existed in runnable form, so the measurement could refute it.

**P1 – what an event costs.** PREDICTED: the mean committed professional event is 13–20, not 25, and
his 25 and 33–34 are DEEP RUNS – he is quoting the tail he lives in because he is winning.
**MEASURED: mean 15.4, and a five-match week costs 26.1. Held.**

**P2 – the pair no longer balances.** PREDICTED: the pair is 1.5–2.5x worse than the equation it was
calibrated on, the career closes the gap with vacations, and the measured count is ≥ 4 a season.
**MEASURED: 7.5–8.3 family weeks a season. Held, and understated.**

**P3 – the collapse.** PREDICTED: the fall is dominated by points defence and regression, with
fatigue 15–30% and injuries 10–20%. **MEASURED: points defence 1%, fatigue 0, injuries 0 in the
sample large enough to see them. Half right, and the half about the body is REFUTED – see §5.**

**P4 – the two dials.** PREDICTED: the surcharge is the stronger lever per unit, by roughly 1.6x.
**MEASURED: by about 8x. Right in direction, badly wrong in size, and the reason is the ceiling.**

**P5 – the masseur.** PREDICTED: the staffed/unstaffed gap is ~90 condition a season, so the 22.08
premise holds. **MEASURED: the gap is real but much smaller than that (0.9 family weeks), and the
premise holds for a different reason – §7.**

---

## 3. What a week actually costs, and what it gives back

`npm run bench:season-eq -- --seeds 16 --toAge 28` – 32 careers, every professional season pooled.

**His «~25 за турнир» is right, and the mean is 15.4.** Both are true, because a tournament week is
not one thing. The drain is charged per match, so what a week costs is a function of how far she got:

| matches that week | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| condition it took | 5.5 | 10.8 | 16.3 | 21.9 | **26.1** | **31.7** | **37.2** |
| how often (weeks measured) | 2,992 | 2,040 | 1,654 | 1,247 | 2,256 | 267 | 47 |

A first-round exit costs 5.5. A final or a title at a 32-draw costs 26. A deep run at a Slam costs 31
to 37. **His 25 is a five-match week and his 33–34 is a six- or seven-match week – he is quoting the
weeks he has, because he is winning, and they are priced exactly as the table says.** The mean of
15.4 is a number nobody ever sees on a screen: it is the average of her exits and her titles together.

The per-rung figures are nearly flat (w15 15.1 · w35 14.9 · wta250 16.4 · wta1000 13.6 · slam 14.3)
for the same reason – the rung sets the price of a match, and the depth sets how many she plays.

**What comes back.** A rest week returns 4.7 on average – but that average is measuring the CEILING,
not the dial: she spends most weeks near 100, where a +10 week banks +3. On the weeks the ceiling
cannot swallow it, a rest week returns **10.1**, which is his 9–10 exactly (pro base 5 + the balanced
plan's slider 1 + masseur 3, and +1 more in a blackout week).

**And the season adds up like this** (per professional season, pooled over 32 careers):

| | condition |
| --- | --- |
| what the tennis takes | **−379** |
| what ordinary weeks give back | **+80** |
| what booked family weeks give back | **+291** |

**The family weeks are 78% of all the recovery she gets.** That is the finding under his complaint,
and it is not a defect in any one dial: at ~25 events a season she has only ~26 non-playing weeks for
the weekly dial to pay on, each payment capped by the ceiling, against ~70 matches for the drain to
charge. The vacation table is not a luxury here. It is the load-bearing wall.

His own sentence for the vacation was «то, что за off-season РЕАЛЬНО восстановить с 1 большим или
парой небольших отпусков» – one big holiday, or a couple of small ones, in the OFF-SEASON. The
measured career takes **7.5–8.3 family weeks a season, in season**, which is his «1-2 раза в месяц»
reproduced to the number. The rescue is no longer the off-season reset; it is a fortnightly
maintenance item.

⚠ One number that looks wrong and is not: she arrives at the off-season door at **100**, against the
45–50 the re-price spec set as its target. She arrives fresh precisely BECAUSE of those eight family
weeks – the acceptance band was measured on a probe that took no mid-season vacation at all
(`tools/pro-season-probe.ts`). The deficit did not go away. It was paid for.

**And what the holidays are buying is not small.** §5's 64 careers walked again with the mid-season
rescue removed and only the off-season week kept – a POLICY arm, not a dial, and no constant moved:

| | with the rescue | without it |
| --- | --- | --- |
| median condition | 92 | **67** |
| weeks under 50 a season | 2.8 | **12.4** |
| injury onsets a season | 0.65 | **0.90** |
| professional events entered | 21.7 | 19.5 |
| best professional place reached | #9 | **#14** |

Without the eight holidays she lives below the strength knee (70) for most of the year, is hurt 38%
more often, and her career ceiling falls five places. The vacation table is not decoration and it is
not optional – which is exactly why it is worth knowing that it has become compulsory.

---

## 4. The trajectory, season by season

32 careers (16 seeds x the wealthy·elite and middle·high presets), walked to 28 on the `player`
policy. Per season, averaged across careers:

| age | pro events | matches | depth | cond median | cond min | wks < 50 | family weeks | knocks | onsets (weekly / mid-match) | door | WTA place |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 18 | 22.9 | 62.7 | 2.71 | 94 | 45 | 1.4 | 7.5 | 1.4 | 0.16 / 0.41 | 100 | 53 |
| 19 | 24.1 | 66.4 | 2.74 | 93 | 47 | 1.7 | 7.6 | 1.2 | 0.03 / 0.56 | 100 | 30 |
| 20 | 25.0 | 67.5 | 2.68 | 93 | 43 | 2.1 | 7.6 | 1.1 | 0.03 / 0.56 | 100 | 25 |
| 21 | 25.3 | 73.5 | 2.90 | 92 | 41 | 2.3 | 8.2 | 1.1 | 0.06 / 0.53 | 100 | 18 |
| 22 | 25.1 | 72.5 | 2.87 | 93 | 41 | 2.3 | 8.3 | 1.2 | 0.06 / 0.69 | 100 | 21 |
| 23 | 25.3 | 71.9 | 2.83 | 92 | 39 | 2.1 | 8.3 | 1.4 | 0.16 / 0.66 | 100 | 26 |
| 24 | 24.6 | 72.1 | 2.92 | 93 | 40 | 2.2 | 8.3 | 1.3 | 0.03 / 0.50 | 100 | 23 |
| 25 | 25.4 | 71.3 | 2.80 | 92 | 42 | 1.8 | 8.1 | 1.0 | 0.03 / 0.56 | 100 | 20 |

Two things to read off it. **She is not tired** – the median week sits at 92, weeks under 50 are two a
season out of 52, and she reaches the off-season door full. **And she is on holiday eight times a year
to stay that way.** The equilibrium is real, it is stable, and it is bought.

⚠ The event count is worth a second look: **~25 events and ~70 matches a season is his design almost
exactly** («20 чемпионатов … 60-100 матчей»), with a mean depth of 2.8 matches per event.

⚠ And the injury columns say something the rest of this document leans on: **most professional onsets
come off a court, not off the weekly roll** – 0.03–0.16 a season through the weekly door against
0.41–0.69 through the mid-match retirement door.

**His zig-zag is real.** A mean over careers flattens it away, so the bench prints each career's own
places. Six rows, ages 19 to 27:

```
bench-wealthy-0     64   28   31   37  124   29   21   24   32
bench-wealthy-5     34   28   25   72  114  134   19   97   96
bench-wealthy-7     21   51    9   23   12   16   73   26   19
bench-wealthy-13    18   19   17   15   20   19    9   65   82
bench-middle-8      52   67   21   17   29   24   24   19   23
bench-middle-9     128   43  124  159  143  142   96   68   21
```

`bench-wealthy-13` finishes one season 9th, the next 65th and the one after **82nd**. That is his
career in a different seed, and it is not rare.

---

## 5. The attribution – what the fall is actually made of

### 5a. How the fall is split, and why the split is exact

Her place on the professional table is a rolling 52-week fold of her best eighteen results
(`BEST_N_BY_TRACK.wta`, `WINDOW_BY_TRACK.wta`), so a season's place is bought by that season's points
and nothing else. The bench therefore asks, at the wrap of the season after a breakout, one
counterfactual question: **where would she stand right now had she re-played last year's card exactly
– the same results, the same weeks, one year later?**

That one number splits the fall into two terms which add to it exactly:

- **the drift** – where perfect defence lands her. Everything in it is the table moving underneath
  her: the field's own year, and the window rolling. This is POINTS DEFENCE, priced in places.
- **the shortfall** – the rest. She did not re-play the card.

### 5b. The measurement (64 careers, 775 professional season pairs)

88 of those pairs follow a breakout – a season gaining at least 15 places and finishing inside the top
60, which is his own 56/59 → 17. **Seven of the 88 then collapse by 20 places or more: 8%.** His
sequence is real, it is reproducible, and it is a tail rather than the rule.

Because seven cases cannot carry an attribution on their own, the same split is taken over **every**
fall of 20+ places out of a top-60 season, breakout or not – 24 cases, ten times the sample, the same
phenomenon with the breakout condition dropped. The two rows agree:

| | his shape (n=7) | every fall (n=24) |
| --- | --- | --- |
| the fall, in places | 60.7 ± 9.3 | 49.0 ± 4.4 |
| …(b) POINTS DEFENCE, the drift | **−0.6 (−1%)** | **0.5 (1%)** |
| …everything else, the shortfall | **61.3 (101%)** | **48.4 (99%)** |
| median condition, before → after | 94 → 94 | 93 → **94** |
| weeks under 50, before → after | 1.1 → **0.0** | 1.3 → **0.0** |
| professional events entered | 23.4 → **25.4** | 25.3 → 24.8 |
| injury onsets | 0.29 → 0.86 | 0.63 → **0.58** |
| weeks out injured | 0.3 → 1.6 | 1.4 → 1.5 |
| matches played | 54.6 → 42.4 | 59.1 → 44.8 |
| **win rate** | **0.603 → 0.403** | **0.589 → 0.453** |
| points per event | 79 → 41 | 94 → 51 |

**Read the condition rows before anything else.** She was not tired in the collapse season. Her median
condition is identical and her weeks under 50 go to zero. She entered the same number of events, or
more. What halved is what she got out of them: the win rate falls, points per event halve, and the
place follows.

### 5c. Each parent, priced

**(b) POINTS DEFENCE – 1% of the fall, which refutes the parent rather than confirming it.**
Defending costs almost nothing in this game: across all 775 pairs the drift is +0.1 ± 0.2 places.
Re-playing last year's card leaves her within a place or two of last year's place, because the
professional field's own points are stable season to season. In a real tour defence is hard because
repeating is hard; here, repeating exactly is worth exactly your old place. **The fall is not the
window rolling. It is her.**

**(a) CONDITION – zero, measured twice.** Identical median condition, fewer weeks under 50, in both
samples. And the ablation says the same thing from the other side: switching the whole drain off –
`matchFatigue`, every `tierMatchFatigue`, all three run ladders zeroed, so condition sits at 100 all
year and weeks under 50 are exactly 0 – leaves the collapse rate at **10% against the control's 8%**.
If fatigue were the parent of his shape, removing fatigue entirely would have removed the shape.

| arm (64 careers each) | breakouts | collapse rate | cond median | weeks < 50 | onsets | family weeks | best place |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **control (shipped)** | 88 | **8%** | 92 | 2.8 | 0.65 | 7.9 | 9 |
| fatigue off (no drain at all) | 100 | 10% | 100 | 0.0 | 0.42 | 1.0 | 11 |
| injuries off (weekly roll) | 87 | 8% | 92 | 2.9 | 0.57 | 8.0 | 10 |
| both off | 109 | 11% | 100 | 0.0 | 0.34 | 1.0 | 10 |
| no mid-season rescue (policy) | 102 | 12% | 67 | 12.4 | 0.90 | 1.0 | 14 |

**(c) AGE – structurally zero, and this is a bound rather than a measurement.** Every breakout in the
sample is between 15 and 26, and `ageCurve.declineStart` is 29. Not one of the 88 collapse seasons is
inside the decline at all, so age cannot have contributed to any of them.

**(d) INJURY – no.** The seven-case row shows onsets going 0.29 → 0.86, and that was the one reading
that looked like a cause. It does not survive the bigger sample: over all 24 falls, onsets go 0.63 →
**0.58** and weeks out are flat. Switching the weekly injury roll off leaves the collapse rate at 8%,
identical to control. ⚠ One honest limit: the weekly roll is only ~15% of professional onsets – the
rest come through the mid-match retirement door, whose `RETIRE_K` is a module constant this bench
cannot patch, so that half is measured but not separately ablatable. What can be said is that it does
not move with the collapse either (weeks out 1.4 → 1.5).

**(e) THE TWO NEW RETIREMENT DOORS – not involved.** 109 offers were raised across 64 careers walked
to 28.4; 61 of the 64 were still playing at the end, and the three that ended, ended by injury. No
collapse in the sample is a career-ending door firing.

### 5d. So what IS it? Promotion, and variance on top of it

Two things, and the bench can separate them.

**The structural half: she is promoted into bigger draws.** After a breakout her share of entries at a
1000 or a Slam goes **0.33 → 0.47**, and her mean rung moves up the ladder. That is the acceptance
system working: a top-20 finish opens the biggest fields in the game. It costs the average breakout
player 4 points of win rate (0.660 → 0.619) – and the average breakout player still holds her place
(mean fall +1.1). Ordinary season pairs, by contrast, hold their win rate to within a point
(0.687 → 0.680).

**The variable half: a bad year of draws on top of it.** In the seven that collapsed, the win rate
fell not by 4 points but by **20** (0.603 → 0.403), and their promotion was the steepest of all
(0.26 → 0.40 of entries at a 1000 or Slam). Same body, same calendar, better tournaments, and the
dice went the other way.

**And the table amplifies it.** Near #20, points are dense: halving your points costs sixty places.
Near #200 the same halving costs almost none. So the identical bad year reads as a catastrophe at the
top and as nothing at the bottom – which is the real tour's arithmetic too, and it is why his fall
from 17th to 82nd felt like the floor giving way.

**Verdict: nothing is broken.** A great season followed by a bad one is the game working, and the
architect's hypothesis – that success drains her and the drain produces the fall – is refuted: her
condition in the collapse season is the same as in the breakout season, and removing fatigue entirely
does not remove the shape.

---

## 6. The two dials, as a grid

`npm run bench:season-eq -- --grid --seeds 10 --toAge 28` – 20 careers per cell, nine cells, and the
shipped values are one of them. Every cell is this tree with the dial patched on the live `ECONOMY`
object and put back afterwards; no cell is a different commit or a different worktree. The surcharge
column moves every professional rung together (`w15…slam`) and only those – the junior and domestic
families are a separate calibration with their own guards.

| surcharge | proRecovery | door | family weeks | injury prevalence | onsets | knocks | cond median | weeks < 50 | events | per-event cost | best place |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| −1 | 4 | 99 | 7.0 | 44% | 0.65 | 1.2 | 92 | 1.9 | 21.4 | 12.8 | 12 |
| −1 | 5 | 99 | **6.9** | 46% | 0.68 | 1.2 | 93 | 1.8 | 21.4 | 12.8 | 10 |
| −1 | 7 | 99 | 6.7 | 47% | 0.66 | 1.3 | 94 | 1.8 | 21.4 | 13.0 | 11 |
| 0 | 4 | 99 | 8.1 | 50% | 0.67 | 1.1 | 91 | 2.9 | 21.5 | 15.2 | 11 |
| **0** | **5** | **99** | **8.0** | **49%** | **0.70** | **1.1** | **92** | **2.7** | **21.8** | **15.3** | **12** |
| 0 | 7 | 99 | **7.7** | 45% | 0.61 | 1.1 | 93 | 2.6 | 21.9 | 15.3 | 12 |
| +1 | 4 | 99 | 8.8 | 49% | 0.72 | 1.1 | 90 | 4.3 | 21.6 | 17.7 | 12 |
| +1 | 5 | 99 | 8.7 | 48% | 0.70 | 1.1 | 91 | 4.1 | 21.7 | 17.7 | 12 |
| +1 | 7 | 99 | 8.4 | 47% | 0.70 | 1.1 | 92 | 3.9 | 21.6 | 17.8 | 12 |

The shipped row is the middle one. The bench also prints a collapse rate and a mean fall per cell;
they are left out of this table because at ~28 breakouts a cell they run 0–13% with no pattern, which
is three cases of noise and not a reading.

**The two dials are not the same size.**

- **One point of per-match surcharge is worth 1.1 family weeks a season** (8.0 → 6.9) and 0.9 fewer
  weeks under 50. It moves the per-event cost by 2.5, which is the ~2.8 matches she plays per event.
- **One point of `proPhaseRecoveryBase` is worth 0.13 family weeks** (8.1 → 7.7 across the three
  points from 4 to 7). **The surcharge is about eight times the lever the recovery base is.**

The reason is arithmetic, and it is why his first instinct is the weaker of his two: at ~25 events a
season she has ~26 non-playing weeks for the weekly dial to pay on, against ~70 matches for the
surcharge to charge – and the weekly payment is clamped at 100, which is where a family week has just
put her. Measured: ordinary weeks return 80 a season, against 10.1 a week when the bar has room.

**Two things the grid says are NOT costs of moving the surcharge down:**

- **Injuries do not rise; they fall slightly** (prevalence 49% → 46%, onsets 0.70 → 0.68). The fear
  that a cheaper week means more tennis and so more injury does not appear at ±1.
- **The ceiling does not move.** Her best professional place is 10–12 in every one of the nine cells.
  A cheaper week is not a stronger player; it is a less interrupted one.

**What the grid cannot deliver is his design.** His own sentence is one big holiday or a couple of
small ones. Eight family weeks down to two or three would take about −4 on the surcharge, and the
whole professional family is priced at 2–5. **Neither dial reaches his number, and that is the honest
headline of this section.**

---

## 7. The masseur's premise, re-checked against today's game

`npm run bench:season-eq -- --staffing --seeds 10 --toAge 28` – 20 careers each.

On 22.08 `proPhaseRecoveryBase` went 8 → 5 on his own variant C, and the reason was the masseur:
«может быть нам тогда стоит дефолтное восстановление с 10 в неделю на 7 опустить? тогда массажист как
раз будет еще немного накидывать». The premise is worth re-checking because a month of waves has
landed on top of it.

| arm | door | family weeks | injury prevalence | onsets | cond median | weeks < 50 | rest gain | matches won |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| masseur DAILY (shipped) | 99 | **8.0** | 49% | 0.70 | 92 | 2.7 | 4.7 | 49.2 |
| masseur ABSENT | 99 | **8.9** | 48% | 0.66 | 91 | 4.4 | 3.6 | 46.9 |
| base 8, masseur DAILY | 99 | **7.7** | 45% | 0.61 | 94 | 2.6 | 4.8 | 49.8 |
| base 8, masseur ABSENT | 99 | **8.5** | 47% | 0.66 | 93 | 4.1 | 3.9 | 47.5 |

**The ruling holds, and for a better reason than it was made for.** The masseur is worth 0.9 family
weeks a season, 1.7 fewer weeks under 50 and 2.3 more match wins. Putting the base back to the junior
8 – undoing the whole 22.08 decision – is worth **0.3 family weeks**. The seat he was traded against
is worth three times the dial he was traded for.

The gap is not a paradox: both are +3 a week on the weeks she does not play, but the masseur also
works on the weeks she does. `masseurTourRelief` takes part of the run's strain back per night between
rounds when he travels, and the return session pays on the week she comes home – so his +3 is only the
half of him that a base could ever match.

⚠ And the row that matters most for §8: **all four arms arrive at the off-season door at 99 and take
eight family weeks to get there.** Staffing moves who pays and by how much. It does not move the shape.

---

## 8. Recommendation

### 8a. On his item #1 – the collapse – move nothing

The measurement says his 17th-place season did not cause the 82nd-place one. The fall is 99% a
shortfall in what she earned and 1% the table moving; her condition in the collapse season is
identical to the breakout season; her weeks under 50 go DOWN; she enters the same number of events;
injuries do not move in the sample big enough to see them; age cannot bite for another three years;
no career-ending door is involved; and switching fatigue off entirely leaves the shape at the same
frequency it has with fatigue on.

**A great season followed by a bad one is the game working, and a game where it could not happen is a
game where the great season meant nothing.** The one thing worth considering is not a constant at all:
the fall looks larger than it is because the top of the table is steep and because the breakout year
buys her entry into bigger draws (0.33 → 0.47 of her entries at a 1000 or a Slam), where the same
player wins less. If he wants the fall to feel like a story rather than a punishment, the lever is
what the game SAYS about it – a season wrap that names the promotion and the points that expired –
and not what a week costs her body. **That is a proposal, not a change: it is wording and a screen,
and both are his.**

### 8b. On the holidays – one dial, and it is the one he named second

If he wants to act on «я езжу в отпуск 1-2 раза в месяц», the cell is:

> **per-match tier surcharge −1 on the professional rungs, `proPhaseRecoveryBase` left at 5.**
> (`w15/w35/w50` 2 → 1, `w75/w100/wta125` 3 → 2, `wta250/500` 4 → 3, `wta1000/slam` 5 → 4.)

What that cell buys, measured (§6, 20 careers per cell):

| | shipped | −1 surcharge | change |
| --- | --- | --- | --- |
| family weeks a season | 8.0 | **6.9** | −1.1 |
| weeks under 50 | 2.7 | 1.8 | −0.9 |
| what an event costs | 15.3 | 12.8 | −2.5 |
| injury prevalence | 49% | 46% | −3 points |
| onsets a season | 0.70 | 0.68 | – |
| knocks a season | 1.1 | 1.2 | – |
| events entered | 21.8 | 21.4 | – |
| best professional place | 12 | 10 | – |
| condition at the off-season door | 99 | 99 | – |

**What it costs elsewhere – the honest list:**

- **The game does not get easier.** Her best place is 10–12 in all nine cells. The ceiling is set by
  the field and her skills, not by her legs.
- **Injuries do not rise.** They fall slightly, because condition is the input the weekly roll reads.
- **The masseur is untouched and his value is unchanged** – 0.9 family weeks against the base's 0.13
  a point, because half his work lands on tournament weeks where no base can reach. The 22.08 ruling
  survives this change intact.
- **The vacation stays a decision, and stays too frequent to be his design.** 6.9 a season is a
  fortnightly habit becoming a monthly one, not «one big or a couple of small». This dial improves the
  number; it does not reach it.
- **It re-prices the professional family a second time in two months** (R15-6, then W2-FATIGUE), and
  `tests/fatigueReference.test.ts` pins the whole-run tables that would move. That is real guard
  churn, and it is one of the reasons this is a recommendation and not a change.

### 8c. Do NOT raise `proPhaseRecoveryBase`, and here is the arithmetic

His first instinct – «немного увеличить восстановление в неделю» – is the weaker of his two by a
factor of eight:

- 5 → 7 buys **0.4 family weeks a season**. Undoing the 22.08 ruling entirely (5 → 8, masseur daily)
  buys **0.3**. Driving it to an absurd 20 buys **1.8** (§0's actuation arm).
- The reason is the ceiling. A professional rest week is worth 10.1 when the bar has room for it, and
  she banks **4.7** – more than half of every weekly point is thrown away at 100, because a family
  week has just put her there. Raising a number that is already being discarded discards more of it.
- And it would cost the masseur the reason he exists, which his own 22.08 ruling bought deliberately.

### 8d. The thing neither of his dials touches, named for him to rule on

The season is not short of recovery. It is short of recovery IN THE WEEKS THAT CAN USE IT. The engine
charges ~379 a season in tennis and returns 80 through ordinary weeks and 291 through family weeks, so
the loop is: a deep run takes a quarter of the bar, the rescue card offers a holiday at condition 80,
the parent takes it, she returns to 100, and the next four rest weeks bank nothing.

Two dials that are NOT the two he named sit on that loop:

- **`ECONOMY.practice.rescueCondition` (80)** – the condition at which the GAME ITSELF offers the
  holiday. Eight holidays a season is the measured count of times she crosses it. A lower prompt means
  fewer holidays and more weeks spent nearer the strength knee (70), which is a trade and not a free
  win.
- **The number of events a season** – ~25 measured against the 20 his own design names. At 20 the
  arithmetic very nearly closes on the weekly dial alone.

**Neither is in scope here, neither is measured in this document, and both are his to rule on before
anybody measures them.**

---

## 9. How this was measured

`tools/season-equation.ts`, `npm run bench:season-eq`. Careers are walked through the SHIPPED tick,
week by week, with `stepCareerWeek` (tools/econ-bench.ts) on its `player` policy – the parent who
keeps a reserve, refuses to enter her below a rest floor that slides down the ladder, books the
off-season family week, and takes the game's own rescue when she falls below
`ECONOMY.practice.rescueCondition` (80). Every pending decision is answered by the standing drain
recipe (`_lifeBeats`, `_birthday`, the fork answered «continue», a retirement offer accepted only when
final), because a career does not advance on `tickWeek` alone.

Two bench devices, both stated rather than hidden:

- **The family is held above a cash floor every week** ($5m, the same instrument
  `tools/r44-decline-seats.ts` uses). Without it, both of the first two careers this file ever walked
  went bankrupt at sixteen and never entered a professional event – which measures a wallet, not a
  season. Money has its own bench.
- **The masseur is hired at his top rung the week the gate opens**, through the real commands, so the
  default arm is the staffing he actually plays with.

**The control discipline.** Every alternative cell is THIS tree with ONE dial patched on the live
`ECONOMY` object and restored in a `finally` – never a different commit, never a different worktree,
never a rebuilt arm. The shipped values are one cell of every sweep and they are the cell everything
else is read against.

**The arms were proved to be wired before anything was read off them** (`--actuate`): each dial driven
to an absurd value in both directions, with the headline figures printed.

| cell | cond median | per-event cost | rest gain (unclamped) | family weeks | onsets |
| --- | --- | --- | --- | --- | --- |
| surcharge −3 | 96.0 | 8.6 | 10.1 | 3.4 | 0.71 |
| **shipped** | **92.6** | **15.0** | **10.1** | **7.9** | **0.57** |
| surcharge +6 | 84.8 | 27.0 | 10.3 | 10.9 | 0.62 |
| proRecovery 0 | 89.0 | 14.7 | 5.2 | 8.9 | 0.48 |
| proRecovery 20 | 97.3 | 14.9 | 15.9 | 7.1 | 0.43 |
| no drain | 100.0 | 0.0 | 0.0 | 1.0 | 0.32 |
| no injury roll | 92.1 | 15.0 | 10.1 | 8.0 | 0.41 |

Each dial moves the figure it is supposed to move and leaves the others alone: the surcharge moves the
per-event cost and not the rest gain, the recovery base moves the rest gain and not the per-event
cost. A null result from an arm that cannot move is a null ARM, not a null result.

**One measurement bug is on the record because it changed an answer.** The first draft read "did she
play this week" off `world.results`, and got it wrong twice over: the ledger is PRUNED every tick, so
a count taken before the step does not index the same array afterwards; and `finalizeTournament`
pushes a row only `if (points > 0)`, so a first-round exit that pays nothing scores no row at all.
Together they filed whole tournament weeks as rest weeks, and the mean "rest week" came out NEGATIVE
(−1.8). The walk now reads her match counters (`seasonWins + seasonLosses`), which survive pruning and
count the scoreless exits – which are exactly the weeks a tired player has.

**Sample sizes.** §3 and §4: 32 careers to age 28 (§3's no-rescue table is §5's 64). §5: 64 careers, 775 professional season pairs, 88
breakouts, 7 collapses, 24 falls of 20+ places out of a top-60 season; each ablation arm is the same
64 careers re-walked. §6: 20 careers per cell, nine cells. §7: 20 careers per arm, four arms. The
runs took 10, 24, 14 and 6 minutes respectively.
