# The body, audited – fatigue and injury on the re-priced week

Written 04.08.2026 on the owner's instruction, after he read the endings report and found the
career-ending injury rule had shipped against a predicate that could never fire:

> «надо чинить, и вообще снова посмотреть на нашу усталость и травмы на данный момент. Хороший
> повод для анализа и калибровки.»

So this is not a spot fix. It is the whole fatigue-and-injury system re-measured from scratch on the
week the W2-FATIGUE re-price left behind, plus the owner's own round-2 list (#83), plus a defence of
the career-ending threshold against a stated target.

**The ruling that governs every number below:** «Мы ни за что не наказываем» – the tour punishes,
the game never does. A model that makes the player feel taxed for playing is wrong; one that makes a
hard season have a real physical cost is right. Two proposals in this document were rejected on that
sentence alone, and both are recorded with the arithmetic that made them tempting.

---

## 1. The instruments

| tool | what it answers | run |
| --- | --- | --- |
| `tools/pro-season-probe.ts` | ONE professional season, from a clean body – the re-price's own acceptance harness | `npx vite-node tools/pro-season-probe.ts --seeds 24 --seasons 4` |
| **`tools/injury-audit.ts`** (new) | the DISTRIBUTION of injury over a whole playing life: severity, age band, weeks lost, the tail, the attribution, and the career-ending sweep | `npx vite-node tools/injury-audit.ts --seeds 10` |
| `tools/endings-bench.ts` | how careers end – the canonical instrument for #4's rate | `npm run bench:endings` |

`pro-season-probe` gained three CLI knobs for this wave (`--recovery`, `--vacScale`, `--noStack`),
because «measure each in isolation» is not answerable without being able to move exactly one dial at
a time. All three patch the live `ECONOMY` object, the fatigue bench's own `withScenario` idiom, and
nothing is written back to any file.

⚠ **The two tools measure two different girls, on purpose, and both numbers are true.**
`pro-season-probe` stamps her to the head of the merged table and tops up her funds, so nothing but
her BODY can refuse her – it is the owner's designed season, played by somebody who can always get
in. `injury-audit` walks nine real family presets from fourteen to thirty-eight under the econ
bench's own entry policy, so money, rank and the calendar all bind. Where they disagree the
disagreement is the finding, and §3 is exactly such a place.

---

## 2. Current state – the season, and how far it has drifted

`pro-season-probe --seeds 24 --seasons 4`, plan light 60/40, elite off-season week, physio off – the
re-price's own reference player.

| acceptance number (fatigue-reprice-2026-08.md §6) | target | measured at the re-price, 03.08 | **measured now** |
| --- | --- | --- | --- |
| 1. PLAYED per season | 20–30 | 21.4 | **18.6** |
| 2a. condition at the off-season door (wk 49) | 45–50 | ~47 | **73** |
| 2b. opens the next season at | ≥ 90 | ≥ 90 | **89** |
| 3. home from a W35 title | 70–78% | 74% | **74%** ✓ |
| 4. season injury prevalence | 46–54% | 51% | **38%** |

Per season, and the column that explains all of it:

| season | age | played | matches | **matches / event** | mean cond | wk49 door | wk51 | opens next | onsets | wks out | trough |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 16 | 18.1 | 47.4 | **2.62** | 72 | 54 | 100 | 84 | 0.58 | 2.0 | 18 |
| 1 | 17 | 19.0 | 33.1 | **1.74** | 89 | 64 | 100 | 74 | 0.33 | 0.7 | 42 |
| 2 | 18 | 18.9 | 30.3 | **1.60** | 88 | 90 | 100 | 100 | 0.46 | 1.2 | 58 |
| 3 | 19 | 18.3 | 29.5 | **1.61** | 85 | 84 | 100 | 97 | 0.33 | 1.5 | 53 |

**Nothing in the fatigue model moved. The LADDER underneath it did.** The re-price's §3 arithmetic
was built on an average event of 2.35 matches (its own weighted mix: 30% first-round exits, 25% two
matches, 20% three, 15% four, 10% titles), which is what a W35 field costs a player who belongs
there. W3-ACT2 then opened ten professional rungs above it, and the probe's own policy takes the
strongest rung the engine will accept her into – so from seventeen on she is playing WTA 500s,
1000s and Slams (12.7 of her 18.6 events) and losing in the first round of most of them.

> ⚠ **"FROM SEVENTEEN" WAS THE AGE GATE AND THE AGE GATE MOVED (16.08): the WTA rungs open at 15 and
> the Slam at 14.** The mechanism this section names is unchanged – a strongest-rung policy meeting a
> ladder ten rungs taller than the arithmetic was built for – but it can now start two years earlier,
> so a re-run must not be compared row-for-row against the table above. What still stops her in
> practice is the acceptance cut, not the birthday. Grid, stated once:
> [`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

A first-round exit at a WTA 500 costs surcharge 4 + scoreline 2–3 ≈ 6.5, and the rest week beside it
returns 10. **The pair is net POSITIVE.** The season only declines when she WINS matches, which is
why season 0 (46 matches at the W rungs she can beat) arrives at 54 and season 2 (30 matches at the
top) arrives at 90.

⚠ **THE OBVIOUS FIX IS THE ONE THE RULING FORBIDS.** Raising the per-match surcharge on the top
rungs would restore the 45–50 door immediately – and it would charge her body MORE for losing in the
first round of a Slam than for reaching the quarters of a W35. A first-round exit already costs her
the trip, the entry, the week and the ranking points; a tuning number that also taxes the body for it
is the game punishing, and «мы ни за что не наказываем» governs. **The surcharges do not move.**
See §8 for what this means for acceptance criterion 2a, which is re-aimed rather than chased.

---

## 3. Current state – injury over a whole playing life

`injury-audit --seeds 10`: 9 presets × 10 seeds = **90 careers**, fourteen to thirty-eight, grinder
entry policy, maximum-exposure arm (turns professional at the fork, refuses every retirement offer,
money never latches the career shut – the denominator endings-and-the-album.md §2 argues for).
**2,156 full seasons lived, 1,087 onsets, mean 24.1 seasons per career.**

### 3.1 Per season

| | measured | anchor (docs/research/injury-stats-by-age.md §1) |
| --- | --- | --- |
| seasons carrying ≥ 1 onset | **39.5%** | juniors 46–54%, pros 30–54% |
| onsets per season | 0.50 | ~0.5–0.8/yr |
| weeks lost per season | 1.4 | – |
| mean condition | 61 | – |

| severity | onsets/season | seasons carrying ≥1 | mean weeks out | band |
| --- | --- | --- | --- | --- |
| minor | 0.316 | 27.1% | 1.4 | 1–2w |
| moderate | 0.148 | 14.0% | 4.0 | 3–6w |
| major | 0.030 | 2.9% | 10.5 | 8–14w |
| severe | 0.003 | 0.3% | 16.8 | 16–22w |

### 3.2 By age band – and the age curve is not doing what the table says it does

| band | seasons | **events/season** | onsets/season | prevalence | wks lost/season | mean cond | `ageInjuryFactor` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 13–15 | 270 | **22.5** | 0.37 | 31.5% | 0.9 | 69 | 0.85 / 0.9 / 1.05 |
| 16–18 | 270 | 19.1 | 0.39 | 34.1% | 1.1 | 71 | **1.2** / 1.05 / 0.95 |
| 19–22 | 360 | 18.5 | 0.41 | 34.4% | 1.3 | 73 | 0.85 |
| 23–28 | 534 | 25.5 | 0.55 | 43.3% | 1.6 | 57 | 0.85 |
| 29+ | 722 | **31.1** | 0.58 | 44.2% | 1.7 | 52 | 0.85 |

**The curve peaks at sixteen and the OUTCOME peaks at twenty-nine-plus**, because condition falls
faster with age than the age factor rises. The girl-injury-age research (peak at 16) is a real
finding about real bodies and it is faithfully in the table; it is simply the smaller of two forces
in this engine. §4 measures exactly how much smaller.

⚠ **`events/season` IS THE CONTROL COLUMN AND IT KILLS THE EASY EXPLANATION.** The research band
this table is graded against is a prevalence per SEASON PLAYED, so a low junior rate would be
uninteresting if the junior simply did not play much. She plays **22.5 events at thirteen to
fifteen** – more than she plays at nineteen to twenty-two – and is still hurt in only 31.5% of
seasons, because at `recoveryBase` 8 the cheap domestic and J rungs cannot hold her below 69. **The
junior era is safe because the junior body is FRESH, not because its calendar is light.** §8 is
where that leads.

### 3.3 Weeks lost, and the tail

| | mean | median | p75 | p90 | p99 | max |
| --- | --- | --- | --- | --- | --- | --- |
| per season | 1.4 | 0 | 2 | 5 | 12 | 22 |
| per career (24 seasons) | 34.4 | 31 | – | 62 | – | 86 |

Season histogram: **0w 60%** · 1–2w 20% · 3–5w 13% · 6–9w 4% · 10–15w 2% · 16w+ 0%.

Three in five seasons cost her nothing at all, and one in fifty costs a quarter of the year. That
is the shape a body should have: mostly fine, occasionally ruinous, never a steady tax.

### 3.4 The top end – `severe` is reachable, and it is not mis-scaled

The endings wave's finding was that a rule keyed on TWO `severe`/`major` layoffs could never fire.
The owner asked whether `severe` itself is simply mis-scaled. It is not:

| | measured |
| --- | --- |
| careers that ever saw a fresh `severe` | **21.1%** |
| careers that ever saw `major`-or-worse | 61.1% |
| `major`+ layoffs per career | mean 0.93, max 4 |
| `severe`s per career | mean 0.21, **max 1** |

| severity | observed share of onsets | designed band |
| --- | --- | --- |
| minor | 62.8% | 60.0% |
| moderate | 29.4% | 30.0% |
| major | 6.0% | 7.5% |
| severe | **1.7%** | **2.5%** |

The draw is faithful to the table inside Monte-Carlo error (18 severes observed against 27 expected
on n = 1,087; σ ≈ 5). **One in five careers is ended-or-nearly-ended by a tear, and no career in 90
saw two.** That is precisely why P1's «two priors» rule was unreachable – not because `severe` is
too rare, but because `max = 1` is a fact about a 24-season career at a 2.5% band. The ladder's top
end works; the rule keyed on it did not.

### 3.5 What an injury lands on

| condition band the week the roll went against her | share of onsets |
| --- | --- |
| 90–100 | 8.6% |
| 70–89 | 7.6% |
| 50–69 | 13.2% |
| 30–49 | 28.4% |
| **0–29** | **42.0%** |

Mean 41, median 35, against a mean season condition of 61. **Seven injuries in ten land on a body
below 50.** The coupling the whole slice is named after is alive and it is where the injuries are.

### 3.6 ⚠ And the parent moves all of it – the same 90 careers under the careful policy

Everything above is the **grinder**: econ-bench's naive parent, who enters every event he can
afford. Re-run under the **player** policy – a season's runway kept in reserve, no racing below a
rest floor of 70, the coach taken to tournaments:

| | grinder | player (careful) |
| --- | --- | --- |
| season prevalence | 39.5% | **29.2%** |
| onsets per season | 0.50 | 0.33 |
| weeks lost per season | 1.4 | 1.0 |
| weeks lost per career | 34.4 | 24.1 |
| mean condition, 23–28 / 29+ | 57 / 52 | **77 / 77** |
| careers that ever saw a `severe` | 21.1% | 8.9% |
| careers ended by injury | 13.3% | **3.3%** |

**A careful parent's daughter is hurt a quarter less often and ends on her body a quarter as often –
and she plays MORE events, not fewer** (24.8 a season past 29 against the grinder's schedule, at
condition 77 instead of 52). That is the whole thesis of the fatigue system in one table: managing
the load is not a tax on ambition, it is what buys the ambition. Nothing here is a difficulty
setting; the difference is entirely emergent from how the weeks are spent.

---

## 4. Attribution – fatigue, age, load

Measured by **counterfactual arms**, not by decomposing the threshold: `injuryTau` is a product, so
an algebraic split answers "what fraction of the threshold does each factor contribute on the weeks
she actually lived", which silently conditions on a career those very factors shaped. Re-running the
whole life with ONE axis neutralised answers the question the owner asked.

| arm | onsets/season | season prevalence | Δ vs shipped |
| --- | --- | --- | --- |
| **shipped** | 0.50 | 39.5% | – |
| `injuryFatigueSlope = 0` (no fatigue coupling at all) | 0.16 | 15.5% | **−68%** |
| `ageInjuryFactor` flat at 1.0 | 0.56 | 42.6% | **+12%** |
| `consecutivePlayFactor` flat + `injuryPlayingMultiplier = 1` | 0.36 | 31.0% | **−28%** |

**Fatigue causes about two thirds of all injuries in this game. Load causes a bit over a quarter.
The age curve NET REDUCES them by a tenth.**

⚠ The deltas do not sum to 100% and are not meant to: each arm carries a feedback term (fewer
injuries → more weeks played → more fatigue), so these are rate differences, not a partition.

⚠ **The age result is the surprising one and it is worth stating plainly.** `ageInjuryFactor`'s
headline is a peak at 16 (1.2), but its dominant value is `default: 0.85`, which covers ages 19
through 38 – most of a playing life. As a whole the table is a **discount**, not a risk factor.
Flattening it moves the junior bands by 1–2 points (13–15: 31.5% → 30.4%; 16–18: 34.1% → 35.9%) and
the veteran band by five (44.2% → 49.2%). **So the age curve cannot be the lever for anything about
the junior era** – which closes off the fix §8 was otherwise going to propose.

---

## 5. #83 Fatigue round 2 – the owner's own three, each measured alone

His list, from the last playtest: (a) recovery rate 7, (b) the vacation values may now be too
generous, (c) vacation recovery and weekly recovery may be stacking. **Which of the three actually
moves the season? Only (a), by a factor of six – and (a) has already been moved, past his own
number, by the re-price itself. The other two are worth 3 points and 1 point.**

### (a) The recovery rate – ⚠ HE ASKED FOR 7 AND THE RE-PRICE SHIPPED 8

`ECONOMY.condition.recoveryBase` is **8**. His note asked for 7, and it was written when the value
was **1**: the W2-FATIGUE re-price took it 1 → 8 the same week, past his own figure. Item (a) is
satisfied and exceeded, so the measured answer is **no change** – and the sweep is here so he can
overrule it with one line if he wants his number exactly:

| `recoveryBase` | mean condition | wk49 door | opens next season | prevalence | played |
| --- | --- | --- | --- | --- | --- |
| 10 | 87 | 82 | 90 | 35% | 18.7 |
| **8 (shipped)** | **84** | **73** | **89** | **38%** | **18.6** |
| 7 (his figure) | 80 | 67 | 89 | 39% | 18.5 |
| 6 | 78 | 63 | 90 | 38% | 18.4 |
| 5 | 74 | 56 | 89 | 40% | 18.3 |

Each point of `recoveryBase` is worth **5–6 points at the off-season door** and essentially nothing
else: played, the W35 title and the next season's opening are flat across the whole sweep.

⚠ **AND THE SWEEP RETIRES AN IDEA BEFORE IT COULD BE PROPOSED.** Reaching §6.2's 45–50 door through
this dial alone needs `recoveryBase` ≈ 4 – a halving, applied GLOBALLY (it is the same number every
one of the 199 rivals recovers on, and the junior era's too). That would buy an acceptance number
whose own premise §2 shows is dead, by making every body in the world recover half as fast, in the
week the owner asked for MORE recovery. Declined, measured, recorded.

### (b) The vacation table – worth ten points, and mildly over-scaled

| arm | opens the next season at | Δ |
| --- | --- | --- |
| **elite package (shipped)** | **89** | – |
| every package's gain × 0.5 | 86 | −3 |
| every package's gain × 0 | 79 | −10 |
| no booking at all | 79 | −10 |
| two staycations instead of one elite | 88 | −1 |

The table is **not** a gift: without it she opens the next season at 79 and misses §6.2's ≥ 90 badly.
Halving the whole ladder costs only 3 points, so there is roughly 3 points of slack in it – the
elite package's 48 arrives at a body already at 73 with three blackout weeks (+11 each) still to
come, and the clamp at 100 eats most of it.

**Verdict: no change.** The "too generous" feeling is real and it is not the table's fault – it is
§2's door at 73. Cutting the packages would fix the symptom at the price of the mid-season tool the
re-price built them for («в течение сезона она сможет брать мини отпуска на неделю иногда»), where
the free staycation is worth 2.2 rest weeks and nothing is clamped away.

### (c) The stacking – real, decided by the clamp, worth ONE POINT

A booked family week today banks **both** the weekly ladder (`accrueCondition`: base 8 + slider 2,
+1 on a blackout week) **and** the package's `conditionGain` (`resolveVacation`, applied straight
after). Nobody ever decided that; it is what falls out of the two functions running in sequence.

The `--noStack` arm suppresses the weekly ladder for the duration of a booked week – by zeroing the
three recovery knobs across that one tick rather than subtracting afterwards, because
`accrueCondition` clamps at 100 and "add then take back" is not the same world as "never add":

| arm | opens the next season at |
| --- | --- |
| shipped (they stack) | 89 |
| `--noStack` (a family week forfeits the weekly ladder) | **88** |

**One point.** The vacation weeks that matter are inside the off-season, where the body is already
being carried to the ceiling by the blackout weeks, so the second helping is thrown away before it
is banked. **Verdict: no change** – and the question is now answered rather than open, which is what
"nobody decided this" deserved.

---

## 6. ⚠ THE ONE REAL DEFECT – the career-ending rule was reading a pruned list

`weeksLostSoFar` summed `world.injuryHistory`. `rollInjury` **prunes that list to its last twenty
entries**. So the accumulator behind ending #4 was going short on exactly the bodies the rule is
about, and the rule got *harder* the more layoffs a career collected – which is backwards.

Measured over the 90 careers: **13 reached the 20-entry cap**, and **1.4% of all onsets were judged
against a total a mean of 6.1 weeks short of the truth.**

**Fixed, and it is the three-part move.** Schema **v40**: `careerTotals.weeksLostToInjury`, a
monotone counter written in the same branch that pushes the history row (so the two can never
disagree about what "recovered" means), an append-only migration that back-fills from whatever the
pruned list still holds, and `tests/fixtures/saves/v40.json`.

- **`weeksLostSoFar` takes the LARGER of the counter and the surviving history.** Not "prefer the
  counter": a hand-built view (every test in `ending.test.ts`, and the bench's own probes) carries a
  history and no counter, and a migrated save carries a counter back-filled from the same pruned
  list. Whichever is bigger is always the more honest number, and neither can fire the ending on
  weeks she did not lose.
- **The back-fill is exact under twenty layoffs and an honest undercount above it, and there is no
  third option.** The pruned rows are gone from the save and nothing else records them: `events`
  prunes at 400, `milestones` keeps only the FIRST injury, `seasonHistory` has no medical column.
- **Zero draws, on any stream.** Post-draw state end to end; the frozen MAIN capture (41550 /
  `e6b0c709`) cannot see it.
- `tools/endings-bench.ts` now reads the rate through `weeksLostSoFar(autoEndingViewOf(world))`
  instead of its own hand-rolled sum, so the bench and the rule can no longer disagree.

---

## 7. The career-ending threshold, swept and defended

The endings wave re-aimed #4 to «a fresh `severe` on a body that has already lost ≥ 20 weeks» and
measured 7.8%. The owner asked whether that is the right number or an overshoot. Swept the way
bankruptcy's N was – one pass, latch instrumented rather than re-run, exact for "would N have fired":

| N | careers where it would fire | as a share of careers that ever saw a `severe` | median age |
| --- | --- | --- | --- |
| 0 | 21.1% | 100% | 30 |
| 8 | 20.0% | 95% | 30.5 |
| 12 | 16.7% | 79% | 31 |
| 16 | 14.4% | 68% | 31 |
| **20 (shipped)** | **13.3%** | **63%** | **31** |
| 24 | 11.1% | 53% | 31 |
| 30 | 7.8% | 37% | 31 |
| 40 | 3.3% | 16% | 31 |
| 52 | 1.1% | 5% | 37 |
| 78 | 0.0% | 0% | – |

At a fresh `severe` a body has already lost **mean 26.1w, median 25w, max 71w**; the severes
themselves land at **median age 30, range 20–37**.

⚠ **AND THE DENOMINATOR IS THE WHOLE ARGUMENT, so here is the same sweep on the shipped game** –
every latch live, she takes the plateau offer when it comes, careers live 8.5 seasons because the
money or the reading gets there first:

| | maximum exposure (plays to 38) | **the shipped game (all 90 careers)** |
| --- | --- | --- |
| seasons lived per career | 24.0 | 8.5 |
| ever saw a fresh `severe` | 21.1% | 3.3% |
| **ended by injury at N = 20** | **13.3%** | **1.1%** |
| the other endings | natural 86.7% | plateau 63.3%, bankruptcy 34.4%, natural 1.1% |

**1.1% of all careers is precisely P1's original «bench verifies ~1–2% of careers».** The prediction
was right all along; what was wrong was the predicate it was attached to, and the endings wave's
7.8% is the same event counted over the careers that live long enough to have one. Both numbers are
true and they answer different questions – this table exists so nobody has to guess which one a
future reader is holding.

**N stays at 20, and three things hold it there.**

1. **It is the game's own number, not a picked one.** 20 weeks is inside the `severe` band itself
   (16–22w, measured mean 16.8). The rule therefore reads as one sentence a player can check: *she
   has already lost as much time as a torn body costs, and now she has torn something again.* That
   is why it is not 12 (a moderate) and not 40 (two severes plus a spare).
2. **It is not on a cliff.** 16 → 24 spans 14.4% → 11.1%; three candidates either side of the
   shipped value move the rate by three points. A knob this insensitive cannot be picked by
   measurement, so moving it would be taste dressed as calibration.
3. **On the shipped game it lands exactly where P1 predicted.** 1.1% of all careers, against P1's
   «~1–2% of careers» – a target written for a different predicate that turned out to be
   unreachable, and which this one hits without having been aimed at it. On the maximum-exposure arm
   it is still the rarest automatic ending and a late-career event exactly as designed (median age
   31).

⚠ **What would change it, stated so the owner can overrule with one line:** N = 30 takes it to 7.8%
on the maximum-exposure arm (0.0% on the shipped game, i.e. back to a rule almost nobody meets) and
makes the accumulation clause reject two thirds of severes instead of one third. That is the only
other candidate with an argument behind it, and the shipped-game column is the reason it is not
taken: the endings wave has just finished digging this ending out of unreachability.

⚠ **And the fix in §6 nudges this UP, slightly and correctly.** A body past twenty layoffs now
carries its whole history into the predicate, so the ~1.4% of onsets that were being judged short
are judged honestly. The direction is right: the rule should be easiest for the most broken body,
never hardest.

⚠ **ONE SENTENCE IN endings-and-the-album.md §5 NEEDS CORRECTING, and the correction is good news.**
It reads «Nothing the player chooses moves it, so it is a story and never a difficulty setting». The
first clause is measurably false: the same 90 careers end on injury **13.3% under the grinder policy
and 3.3% under the careful one** (§3.6) – a four-fold swing driven entirely by how the parent spends
her weeks. What the sentence was defending is still true and is what matters: **no knob the player
picks changes the threshold**, so it is not a difficulty setting. But the rate is earned rather than
dealt, which is a better property than the one the spec claimed for it.

---

## 8. Acceptance criterion 4 was the junior band applied to a professional season

The re-price graded itself on «season injury prevalence 46–54%», and today's professional season
measures 38%. Before moving a knob, the anchor was re-read.

`docs/research/injury-stats-by-age.md` §1: *«Per season: juniors **46–54%** injured, pros
**30–54%**.»* Two bands. The re-price applied the **junior** band to a schedule its own §1 describes
as twenty professional events a year – and the girl it measures is a sixteen-to-nineteen-year-old
playing WTA 500s. **The measured 38% is inside the professional band with room either side, and the
whole-life figure of 39.5% is too.**

The age-band table in §3.2 says the same thing from the other end: 23–28 at 43.3% and 29+ at 44.2%
are comfortably inside 30–54%. The junior bands (31–34%) DO sit below their own 46–54%, and that gap
is real – §3.2's control column rules out the easy excuse, since she plays 22.5 events a season at
thirteen to fifteen. Three candidate levers were measured and all three were refused:

* **the age curve** – §4 proves it cannot do it. Flattening it entirely moves the junior bands by a
  single point, because its junior peak is a bump on a table whose dominant value is a discount.
  Taking the 13–18 rows to where they would need to be is roughly ×1.6 to ×2.0, which stops being a
  modulation and starts being the base wearing a different hat.
* **the base** – it is global. Lifting it enough for the junior era takes the veteran band past 54%,
  i.e. out the top of its own band, to fix the bottom of another.
* **recovery in the junior era** – which is the honest cause. The re-price's `recoveryBase` 1 → 8
  was global by design, so the junior body now recovers eight times faster than it used to; it is
  fresher, so §3.5's coupling fires less, so it is hurt less. **Undoing that for thirteen-year-olds
  would reverse, by a different door, precisely the thing the owner asked for** – and it would do it
  by making a child's body recover more slowly, which is the exact shape «мы ни за что не
  наказываем» rules out.

Declined, all three, and the gap is left on the record instead: **the junior era of this game is
kinder to a body than the junior era of the research, and that was a deliberate consequence of the
04.08 recovery lift rather than an accident.** If the owner wants it back, the lever is a junior-era
`recoveryBase`, which is a new knob and his decision.

**So criterion 4 is re-aimed to 30–54% for a professional season, against the research's own
professional band, and no injury knob moves.** `injuryBaseChance` (0.003), `injuryFatigueSlope`
(0.00015), `injuryPlayingMultiplier` (1.4), `ageInjuryFactor`, `consecutivePlayFactor` and
`severityBands` are all left exactly as W2-FATIGUE calibrated them.

Criterion 2a (the 45–50 door) is re-aimed for the reason in §2: its derivation assumes an average
event of 2.35 matches and the act-3 ladder delivers 1.6, so the target describes a schedule the game
no longer offers. It is **not** replaced with a new number here – that is the owner's call, because
what a professional week should cost is his ruling and not a knob to turn in passing
(fatigue-reprice-2026-08.md §7 says so in as many words). What this document can say is that the
season the game currently produces satisfies his own frame – «каждая вторая неделя» (18.6 events,
one played week and one rest week) and «то, что за off-season РЕАЛЬНО восстановить» (opens the next
season at 89) – and fails only the arithmetic written for a ladder that has since changed.

---

## 9. What moved, what did not

| | verdict |
| --- | --- |
| `careerTotals.weeksLostToInjury` + v40 migration + fixture | **SHIPPED** – §6, the one real defect |
| `endings-bench` reads the ending's own accumulator | **SHIPPED** – §6 |
| `tools/injury-audit.ts`, `pro-season-probe` isolation knobs | **SHIPPED** – §1 |
| `ECONOMY.condition.recoveryBase` (8) | no change – §5a, already past the owner's own 7 |
| the vacation table (18/22/26/32/40/48) | no change – §5b, worth 10 points, 3 of slack |
| vacation ↔ weekly recovery stacking | no change – §5c, worth 1 point |
| `ENDINGS.injuryPriorWeeksOut` (20) | no change – §7, swept and defended |
| `injuryBaseChance` / `injuryFatigueSlope` / `injuryPlayingMultiplier` | no change – §8 |
| `ageInjuryFactor` / `consecutivePlayFactor` / `severityBands` | no change – §4, §8 |
| the W per-match surcharges | no change – §2, the ruling forbids the obvious fix |

Two guard tests were **added**, none weakened: `injuries.test.ts` proves the counter survives the
prune the test above it proves is lossy, and `ending.test.ts` proves the predicate reads the counter
when the history has forgotten half the body.

**Final measured state.** A season is 18.6 events, one played week and one rest week, arriving at
the off-season around 73 and opening the next year at 89. Over a whole playing life 39.5% of seasons
carry an injury and 60% cost no weeks at all; a career loses 34 weeks in total, 21% of careers are
visited by a tear, and 13.3% of the careers that play to the end are ended by one – **1.1% of all
careers in the shipped game**, which is exactly where P1 aimed. Two thirds of those injuries are
caused by fatigue, and a careful parent's daughter is hurt a quarter less often while playing MORE
events. Nothing in the model punishes her for turning up; what it charges for is winning matches and
racing tired, which is the design.

⚠ **One confirmation run is still outstanding and is named here rather than quietly omitted.**
`npm run bench:endings` is the canonical instrument for #4's rate, and this branch changed what it
reads (§6). It was started twice on a machine carrying three other agents' benches at load 11–14 and
did not finish inside the wave. Nothing above depends on it: `injury-audit`'s own sweep measures the
same predicate on both denominators through the engine's own `weeksLostSoFar`, which is what the
bench now calls too. Re-run it when the machine is quiet – the number to expect is the shipped-game
column, 1.1%, and the plays-on arm's 7.8% moving up by roughly the 1.4% of onsets §6 un-shortened.
