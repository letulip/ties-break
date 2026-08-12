---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-08
---

# The ladder floor – the lower bound stops being a wall

**Status: SHIPPED. §0 (the ship rule) was written before any engine line was touched, against
baselines measured on this branch's head (`34e75a9`, i.e. `main` + the round-14 triage). Everything
below §0 is measured.**

> **THE WAVE IN FIVE LINES.** The window's lower bound stops refusing and becomes a label. On the
> owner's own save the weeks with nothing enterable go **27 of 46 → 6**, with the acceptance cuts
> untouched to the event (`locked` reads 53 either side). It cost the climb – careers that ever hold
> a professional ranking fell 134 → 94 of 180 on the grinder arm – and **the owner ruled that the
> cost is not a cost**: having somewhere to play is the correct state of the world, and what she does
> with the week is the player's decision. The answer to THAT is the **coach as scheduler**, the first
> pillar of his designed role: he now has an opinion about WHICH event, graded by his own rung, and
> a parent who takes it recovers about half the climb (grinder ever-ranked 24 → 32 of 54) **while
> playable weeks go UP**. Zero schema: v44 unmoved, no migration, no fixture.

Backlog #84, round-14 items 7 / 15 / 18, and the owner's ruling of 06.08:

> «Точно надо выровнять наши окна, а лучше как ты говорил, не делать нижний порог вообще, пусть
> играет, просто по приоритету более актуальный турнир показывать, если есть.»

**The lower bound stops being a wall and becomes a sorting key.** A rung she has outgrown is
enterable; it simply loses the card to anything better that week. **The upper bound stays** – an
acceptance cut is the tour's own rule and is not ours to waive.

---

## 0. THE SHIP RULE, WRITTEN BEFORE ANY CODE WAS TOUCHED

### 0a. The baselines, re-measured on this head rather than quoted

**SAVE ARM** – the owner's own career at week 255 (age 18, domestic #106 / ITF #65 / WTA #260),
every future event on the persisted season blocks through the real `entryStatus`
(`npx vite-node tools/ladder-floor.ts -- --save <path>`). ⚠ Read locally, never committed, never a
fixture.

| | baseline |
| --- | --- |
| future events, blocked · enterable | **165 · 24** (12.7% enterable) |
| weeks that carry an event | 46 of 52 remaining |
| **weeks where NOTHING is enterable** | **27 of 46 (58.7%)** |
| why the blocked ones refuse | **outgrown 112** · locked 53 |
| of the 27 dead weeks, how many carry an outgrown event | **25** (2 are locked-only) |
| the card the feed shows | 19 of 46 weeks actionable · **0** dead-with-an-alternative |
| the engine opens | W50, W75, W100 – three rungs, and nothing else in the game |

**CAREER ARM** – the econ bench's own presets and policies, ticked for real, 9 presets x 6 seeds x
2 policies x 520 weeks (`npm run bench:floor -- --seeds 6 --weeks 520`).

| | baseline, grinder | baseline, player |
| --- | --- | --- |
| playable weeks / season (>=1 enterable event) | **27.2** of 47.8 that carry one | **24.0** of 47.8 |
| ...as a share of the weeks that carry an event | **57.0%** | **50.3%** |
| entries / season | 26.7 | 17.2 |
| her peak W rank – best / p10 / median / worst | **#120 / #176 / #257 / #612** | **#98 / #127 / #162 / #706** |
| careers that ever held a professional ranking | 40/54 | 42/54 |
| her W book at career end (median) | 114 pts | 261 pts |
| the card pick's DISPLAY column | **0** of 2,011 dead cards | **0** of 1,339 |

**HEAD ARM** – 180 careers to the ending horizon, both policy arms
(`npm run bench:money -- --no-verify --policy <arm>`), which is where the project's published
peak-rank figures come from (`docs/specs/population-1600-2026-08.md` §4). Re-measured here, not
quoted:

| 180 careers | baseline, grinder | baseline, player |
| --- | --- | --- |
| peak rank – best / p10 / median / worst | **#110 / #154 / #235 / #1,611** | **#11 / #118 / #152 / #706** |
| reaching the top 100 / 200 | 0 / **53** of 180 | 4 / **118** of 180 |
| ever held a professional ranking | **134/180** | **138/180** |

⚠ The brief carried **grinder best #98 / median #228, player best #22 / median #155** from
`population-1600-2026-08.md` §4. This head re-measures the same command at **#110 / #235** and
**#11 / #152** – a wave boundary and a different machine, not an error, and every before/after pair
below is same-command, same-tree, same machine.

### 0b. The six criteria

**The wave ships only if all six hold.** Any one fails and the finding is reported rather than
argued around. Each bar names the direction that would make the change a balance change instead of
a defect fix.

1. **THE GAIN – the headline, and it is a supply number.** On the owner's own save, weeks where
   NOTHING is enterable falls from **27 of 46 to at most 6**; and on the career arm, playable weeks
   as a share of the weeks that carry an event reaches **>= 85% on both policy arms** (baseline
   grinder 57.0%). ⚠ 100% is not reachable and must not be aimed at: a week carrying only a Slam is
   legitimately dead, and the save has 2 such weeks.

2. **THE TWO CEILINGS AGREE, MECHANICALLY.** `outgrewTier` (the domestic point band) and
   `tierOutgrown` (the sliding window) must have **the same consequence** – the rule a previous wave
   established and wrote into `world.ts`: *"they are the same event for the player and must have the
   same consequence"*. Pinned by a test that drives a career past each ceiling and asserts the same
   `EntryStatus` shape from both, not by a comment. Binary.

3. **THE GIFT GUARD – a change that makes her rank climb because the world got easier is the
   failure mode, not the goal.** Her **median** peak W rank may improve by at most **25%** on each
   arm, and careers of 180 reaching the **top 100** must stay **under 30** on each arm (the
   conveyor bar `population-1600-2026-08.md` §0 set and this wave inherits). ⚠ The rung she is
   outgrowing pays little by construction, but "little x many" is exactly how a ladder gets gamed,
   so the bar is on the MEDIAN career and not on the best one.

4. **THE CLIMB SURVIVES – she must not stall on easy rungs.** W-track entries per season must
   **not fall** on either arm, and the share of careers that ever hold a professional ranking must
   not fall by more than **5 percentage points**. ⚠ The mechanism to fear is fatigue, not taste: the
   entry policy already takes the strongest rung on a week, so she only takes a Local when nothing
   better is there – but every extra event costs condition, and a body spent on W15s is a body that
   arrives at the W75 worn out. `tools/boredom-guard.ts` must still exit 0.

5. **THE DISPLAY DOES NOT REGRESS.** "Enterable" is about to mean something much wider and the card
   pick (`preferredWeekEvent`: entered -> enterable -> tallest) was measured to a **zero** display
   column on 05.08. It must stay zero on the owner's save and must not rise on the career arm. ⚠ And
   the ORDERING is judged as well as the column: the card must not put a Local in front of a W75 she
   can also enter that week.

6. **COST AND THE LEDGER.** Tick cost within **10%** of baseline (`npm run bench:load`); **no
   persisted field changes**, so no `SAVE_SCHEMA_VERSION` bump and no golden fixture; `npm run
   test:quiet` green with every re-aimed guard carrying a `⚠` and its reason.

### 0c. What I expect to happen, written down so it can be wrong

* **Criterion 1 passes with room.** 25 of the 27 dead weeks on his save carry an outgrown event, so
  the dead-week count should land at **2**, not 6.
* **Criterion 3 is the one at risk.** Her best-18 professional window is not full in the middle
  game, so cheap points do not displace – they ADD. I expect the median peak W rank to improve, and
  the question is by how much.
* **Criterion 4 is the second risk, through fatigue rather than through taste.**
* **Criterion 5 I expect to hold by construction and I do not trust that**, which is why it is
  measured: an outgrown rung is by definition BELOW her working rung on `TIER_LADDER`, so the
  existing "tallest" tiebreak should already express «по приоритету более актуальный». The case that
  changes is a week whose tall card is LOCKED and whose short card is now enterable – there the
  middle tiebreak will now show the short one, which is the 05.08 rule doing its job and is a
  visible change to his feed.

---

## 1. The defect, what shipped, and what the domestic gap turned out to be

### 1a. What was actually on his screen

⚠ **The triage's phrase "the screen is full of tournaments explaining why not" is not quite what he
sees, and the difference matters.** The feed only renders the rungs the engine holds open
(`feedShows`), and on his save the engine held three – so on 27 of his 46 event weeks nothing was
open, nothing rendered, and **the calendar looked EMPTY**. That is why he reported "four empty weeks
at seventeen" as one item and "cards I cannot enter" as another: they are one defect seen from the
two sides of the feed's own filter. The measurement is in the same table either way.

### 1b. What changed

* `tierOpenFor` is **`tierFloorOpen` alone**. The ceiling is still computed, still named, still
  shown – it no longer refuses.
* **`hasOutgrown` folds BOTH ceilings into one answer.** `outgrewTier` (a domestic band's ceiling)
  and `tierOutgrown` (the sliding window's) had been kept in step by hand at three call sites and by
  a comment in `world.ts` demanding they *"have the same consequence"*. They are one function now, so
  the drift is unrepresentable rather than remembered, and the answer is read in the band's **own
  currency** (a W rung's band is ITF junior points, everything else's is domestic).
* ⚠ **`tierFloorOpen`'s domestic arm had the ceiling inside it** – it read the whole band through
  `isTierEligible`. Taking the ceiling out of `tierOpenFor` alone would have shut Local on the
  calendar at 86 domestic points while `entryStatus`, which only ever tested the floor, admitted her:
  the R10-5 desync from the opposite side. It reads `enterPointBand[0]` now, and the sweep in
  `tests/ladder-floor.test.ts` is what fails if it ever creeps back.
* The fact reaches the screen as a **label**: `EntryStatus.outgrown`, `UpcomingEvent.outgrown`,
  `Snapshot.tierOutgrown`. `'outgrown'` left the `ineligibleReason` union so the **compiler** refuses
  the old reading.
* `feedContext` splits **`rungs`** (what may be offered – now including the rungs beneath her, which
  is the whole point) from **`working`** (the rungs her career is about). The Season feed reads the
  first; the Home strip's collapse reads the second, or removing the wall would have put the owner's
  twelve chips over three lines straight back.

**No persisted field changed.** Every new field is derived at snapshot time, so `SAVE_SCHEMA_VERSION`
stays at **v44**, with no migration and no golden fixture.

### 1c. The domestic gap – SAME DEFECT, and it was a closed loop

The brief asked whether `regional(locked)` / `national(locked)` at domestic #106 is this defect or a
separate band error. **It is this defect, and the wall was the thing holding it shut.**

Her domestic book is **0**. It is not a band error: the domestic bands are Local `[0, 85]`, Regional
`[65, 250]`, National `[150, MAX]` and they overlap correctly. What happened is that domestic results
age out of the 52-week window, she has been on the W tour for years, and the book decayed to nothing.
Regional and National then refuse her on their **floors** – 65 and 150 points she does not have.

The loop closed because the only rung that could pay those points was **Local, and Local was
`outgrown`**. No domestic entry was possible, so no domestic point could be earned, so the floors
could never be cleared, for the rest of the career.

With the floor gone, **Local is enterable again** (a title pays 30), so three Local titles re-open
Regional and five re-open National. The gap stops being a trapdoor and becomes a climb.
⚠ **The two locks themselves are correct and are NOT touched** – they are the upper bound, and the
ruling keeps it.

---

## 2. Measured

### 2a. The save arm – his own career, every future event

| | baseline | **shipped** |
| --- | --- | --- |
| future events, blocked · enterable | 165 · 24 (**12.7%**) | 98 · 91 (**48.1%**) |
| **weeks where NOTHING is enterable** | **27 of 46 (58.7%)** | **6 of 46 (13.0%)** |
| why the blocked ones refuse | **outgrown 112** · locked 53 | locked **53** · unavailable 45 |
| the card the feed shows | 19 of 46 actionable | **40 of 46** actionable |
| the card pick's DISPLAY column | 0 | **0** |
| the rungs the engine opens | W50, W75, W100 | Local, J30, J60, J300, W15, W35, W50, W75, W100 |

⚠ **`locked` is 53 either side, to the event.** The upper bound did not move, which is the half of
the ruling that had to be provable rather than asserted.

⚠ **`unavailable 45` is not new blocking, it is newly VISIBLE.** Those events were reported
`outgrown` before because the ceiling was asked first; they are off-season, exam and vacation weeks
and were unenterable for a week-level reason all along.

**The six weeks that stay dead are legitimately dead**, which is why criterion 1 could not aim at
zero: four are off-season / exam / vacation weeks (`unavailable`), and two carry only events above
her acceptance cut – one week with a WTA 500, one with a Slam, a WTA 125 and the Regional she has no
domestic points for.

### 2b. The career arm – the bench presets, ticked for real

9 presets x 6 seeds x 2 policies x 520 weeks, same command, same machine, baseline measured in a
detached worktree at `3eb0a15` so no edit of this branch could reach it.

| | grinder base | **grinder shipped** | player base | **player shipped** |
| --- | --- | --- | --- | --- |
| **playable weeks / season** | 27.2 | **34.2** | 24.0 | **38.0** |
| ...as a share of event-carrying weeks | 57.0% | **71.6%** | 50.3% | **79.6%** |
| entries / season | 26.7 | **34.9** | 17.2 | **22.7** |
| domestic entries / season | 8.5 | **21.4** | 6.5 | **11.0** |
| **W-track entries / season** | **10.0** | **7.5** | **7.7** | **8.6** |
| ...of those, W75 and above | 3.2 | **0.6** | 5.0 | **2.4** |
| her peak W rank – best / p10 / median | #120 / #176 / #257 | **#212 / #234 / #333** | #98 / #127 / #162 | **#143 / #157 / #173** |
| ever held a professional ranking | 40/54 | **24/54** | 42/54 | **37/54** |
| her W book at career end (median) | 114 | **0** | 261 | **258** |
| the card pick's DISPLAY column | 0 of 2,011 | **0 of 2,397** | 0 of 1,339 | **0 of 1,798** |

⚠⚠ **THE HEADLINE AND THE DAMAGE ARE IN THE SAME TABLE, and the damage is the bigger number.**
Playable weeks rise by a quarter on the grinder arm and by more than half on the player arm – the
defect is fixed. And the grinder's professional career collapses: entries above W75 fall **3.2 → 0.6
a season**, careers that ever hold a professional ranking fall **40 → 24 of 54**, and the median peak
rank goes **#257 → #333**.

### 2c. The mechanism, traced on one career

Reproduced end to end on seed `ace-parent-1`, which is the career `tests/travel-home.test.ts` walks,
measured either side of the change with an identical loop:

| | baseline | shipped |
| --- | --- | --- |
| Local entries in 130 weeks | 24 | **57** |
| Regional / National entries | 25 / 13 | 25 / 13 |
| J30 entries | 19 | **7** |
| **her peak domestic best-6** | **491** | **298** |
| the week the ITF on-ramp latches (J30 wants 250 domestic) | **90** | **104** |

**It is not that the Local steals the week from the J30** – every real entry path takes the strongest
rung on a week, and the two are rarely on the same one. **It is that the Local steals the BODY.**
Thirty-three extra draws a career leave her arriving at the rungs that actually pay worn out, so the
same 25 Regionals and 13 Nationals produce a peak book of 298 instead of 491, the ITF door opens
fourteen weeks later, and the international career that follows is a third of the size.

⚠ **The game's only defence against over-entry is the fatigue caution, and it is a caution.** The
grinder arm ignores it by definition (`restFloor: 0`), which is exactly why the two arms separate:
the player arm (`restFloor: 70`) keeps its W-track entry count and loses "only" the top of the ladder.

### 2d. The card pick, re-measured under the wider meaning of "enterable"

The brief's warning – that the ordering might now put a Local in front of a W75 – **does not
happen**, and the reason is worth writing down because it is why no fourth tiebreak was added.

* The DISPLAY column stays at **0** everywhere: on the owner's save, and on 4,195 dead cards across
  108 bench careers. The pick never shows a card she cannot act on while an enterable event sits on
  the same week.
* The card is **actionable on 40 of his 46 event weeks**, up from 19.
* An outgrown rung is **below her working rung on `TIER_LADDER` by construction** (`tierOutgrown(t)`
  is true only when the floor of `t+3` is open), so the existing "tallest" tiebreak already expresses
  «lead with the more relevant tournament».
* ⚠ **A "prefer the rung she has not outgrown" clause would have been WRONG.** At nineteen the junior
  rungs are age-shut, so the ceiling's age clause leaves **Local not outgrown while W15 is** – and
  that clause would have led with the club draw over the professional event. Height IS relevance on
  this ladder; outgrown-ness is only correlated with it.

The one thing that genuinely changes on his feed: a week whose tall card is LOCKED and whose short
card is now enterable used to show the tall one and now shows the short one. That is the 05.08
"actionable over aspiration" rule doing its job on a much wider set of weeks, and it is the visible
shape of the fix.

### 2e. The head arm – 180 careers, both policy arms, her peak rank

`npm run bench:money -- --no-verify --policy <arm>`, the command the project's published rank figures
come from, baseline in the detached worktree at `3eb0a15`.

| 180 careers | grinder base | **grinder shipped** | player base | **player shipped** |
| --- | --- | --- | --- | --- |
| best | #110 | **#181** | #11 | **#118** |
| p10 | #154 | **#217** | #118 | **#139** |
| **median** | **#235** | **#285** | **#152** | **#169** |
| worst | #1,611 | #1,616 | #706 | #733 |
| reaching the **top 100** | 0 | **0** | 4 | **0** |
| reaching the **top 200** | **53** | **4** | **118** | **96** |
| ever held a professional ranking | 134 | **94** | 138 | **124** |

⚠ **This is the gift guard reading in reverse and it is the whole finding.** Nothing climbs: the top
100 empties on the player arm and the top 200 falls from 53 careers to 4 on the grinder arm. A change
that was watched for inflating her rank deflated it instead, and by more than any bar in §0 was
sized to catch in that direction.

### 2f. Cost, and the one guard that went red

**TICK COST**, two runs of 5 careers x 400 weeks in each tree, medians:

| | baseline | shipped | |
| --- | --- | --- | --- |
| `tickWeek` | 3.42 / 3.30 ms/week | 3.46 / 3.37 | **+1.5%** |
| `toSnapshot` | 24.20 / 23.75 ms/week | 25.30 / 24.37 | **+3.6%** |

The snapshot pays for a 16-rung `hasOutgrown` map plus one read per upcoming event; `tickWeek` pays
nothing it did not already pay, because `entryStatus` called `tierOutgrown` before this wave too.
⚠ Wall-clock on a machine with four other agents on it – read as "a few per cent", not to a decimal.

⚠⚠ **AND THE SIM PROJECT IS RED, ON A REAL ASSERTION.** `tests/econ-reach.test.ts` – the reach
tracker – fails its 14->16 case: *"14->16 collapsed to never: expected 0 to be greater than 0"*. Of
30 working-preset careers, **not one now clears the domestic milestone by sixteen** where the bar is
`0 < n < 30`. Verified against the baseline in the detached worktree at `3eb0a15` on the same
command: **10 of 10 pass there, 9 of 10 here.** It is not a flake and it is not contention.

**It is criterion 4 measured by a guard that already existed**, and it is the same number §2c traces:
her peak domestic best-6 falls because the weeks that used to be rest are now Local draws. The test
is left RED. Re-aiming it would be re-aiming the evidence.

⚠ The other sim red (`tests/econ-bench.test.ts`) IS contention – 13 of 13 tests pass and the file
"fails" on an `onTaskUpdate` RPC timeout, identically on the baseline.

---

## 3. The ship rule, judged

Judged against §0, written before any engine line was touched, and **not revised after the numbers**.

| # | criterion | bar | measured | |
| --- | --- | --- | --- | --- |
| 1 | **the gain** | his save: dead weeks <= 6 of 46 · career arm: >= 85% of event-carrying weeks playable, both arms | **6 of 46** ✓ · **71.6% grinder · 79.6% player** ✗ | ⚠ **HALF** |
| 2 | the two ceilings agree | one consequence, pinned by a test | `hasOutgrown` is the one answer; `tests/ladder-floor.test.ts` asserts the equivalence over 5 worlds x 16 rungs, mutation-verified | ✅ PASS |
| 3 | **the gift guard** | median peak W rank improves by <= 25% · top-100 < 30 of 180, each arm | her median got **worse** on both arms (#235 -> #285, #152 -> #169) · top 100 **0 and 0 of 180** | ✅ PASS, from the wrong side |
| 4 | **the climb survives** | W-track entries/season do not fall · ever-ranked share falls <= 5pp · boredom guard exits 0 | grinder W entries **10.0 -> 7.5** ✗ · ever-ranked, 180 careers, **134 -> 94** grinder and **138 -> 124** player (−22pp, −8pp) ✗ · top 200 **53 -> 4** grinder · boredom guard **improves, 56 -> 32 stranded weeks**, its bar unmeetable (see 3a) | ❌ **FAIL** |
| 5 | the display does not regress | DISPLAY column 0 on the save, no rise on the career arm; no Local in front of an enterable W75 | **0** everywhere (save, and 4,195 dead cards over 108 careers); the ladder tiebreak orders it | ✅ PASS |
| 6 | cost and the ledger | tick within 10% · no persisted field · suite green | tick **+1.5%**, snapshot **+3.6%** ✓ · no persisted field changed (**v44 unmoved**, no migration, no fixture) ✓ · unit **114 files / 2,444 tests green** ✓ · **sim project RED**: `tests/econ-reach.test.ts` fails a real assertion, and it is criterion 4's evidence not a flake (see 3a) ✗ | ❌ **FAIL** |

**CRITERIA 4 AND 6 FAIL AND CRITERION 1 IS HALF MET. BY THE RULE AS WRITTEN, THIS DOES NOT SHIP AS A
SILENT FIX.** What follows is the judgement, labelled as one.

### 3a. What the failure actually is, and what it is not

**It is not the gift the brief warned about.** Cheap points at outgrown rungs do not inflate her rank:
nothing reaches the top 100 on either arm, the best-18 window does not fill with junk, and her median
peak rank moves the OTHER way. The failure is the mirror image – **the world did not get easier, her
career got busier, and the busyness costs her the climb.**

**The mechanism is fatigue, and it is measured in §2c.** The removed floor converts REST weeks into
Local weeks. On the grinder arm domestic entries go 8.5 -> 21.4 a season, and the same girl playing
the same 25 Regionals and 13 Nationals earns a peak domestic book of 298 instead of 491, because she
arrives at them worn out. The ITF door then opens fourteen weeks later and the professional career
that follows is a third of the size.

⚠ **THE HONEST READING, LABELLED AS A READING RATHER THAN A NUMBER.** The change moves a decision
**from the engine to the player**. Before it, the ladder made the "do not waste a week on a draw
beneath you" decision for him by refusing; now he makes it, and he can get it wrong. The bench's
`grinder` arm is by construction the player who never makes that decision (`restFloor: 0`, enter
everything affordable), and it is the arm that collapses. The `player` arm (`restFloor: 70`) keeps
its W-track entry count and loses the TOP of the ladder instead – W75-and-above entries 5.0 -> 2.4.
So the cost is real on both arms and much larger on the one with no judgement in it.

**The game's only brake on over-entry is the fatigue CAUTION, and a caution is not a brake.** That is
the design fact this wave surfaces and does not decide.

⚠ **THE CLEANEST EVIDENCE IS A GUARD I DID NOT WRITE.** `tests/econ-reach.test.ts` has asserted since
long before this wave that between 1 and 29 of 30 working-preset careers reach the 14->16 domestic
milestone – a bar with room on both sides, so that neither "nobody ever" nor "everybody always" can
pass. It reads **0** here and 1-29 on the baseline (§2f). An independent, pre-existing net caught the
same thing the bench measured, which is as close to confirmation as this project gets.

⚠ **AND THE THIRD LIMB OF CRITERION 4 WAS MIS-SPECIFIED BY ME, WHICH IS REPORTED RATHER THAN
QUIETLY DROPPED.** "`tools/boredom-guard.ts` must still exit 0" assumed it exits 0 today. It does
not, and its own header says why: the stranded weeks are a **calendar-coverage gap** (season offsets
that carry W events and no non-W event at all), which no ladder rule can close. Measured on the same
command, 8 careers x 260 weeks: weeks where the pro cap refuses her and NOTHING else is playable go
**56 -> 32**, and the domestic fallback family covers 12 weeks before and **50 after**. The limb as
written is unmeetable; the direction it was reaching for is the wave's strongest single result.

### 3b. The owner's other option, measured – it is not the answer either

His ruling named two: *"align our windows, or better, do not have a lower bound at all"*. The first
option is measured here on the same command, as a labelled arm that is **not in the tree** – a
detached worktree at this branch's head with the wall restored in `tierOpenFor` and `WINDOW_RUNGS`
3 -> 6, `TERMINAL_RUNGS` 4 -> 6.

⚠ **READ ONLY THE ENTRY ROWS OF THIS ARM.** The patch restores the wall in `tierOpenFor` and not in
`entryStatus`, so the arm's *supply* figures (playable weeks, blocked/enterable, the display column)
measure a deliberately desynced pair of gates and are void – exactly the R10-5 disagreement §1b
describes, reproduced by accident and worth recording as such. What IS clean is everything driven by
what she ENTERS: the bench's entry policy gates on `tierOpenFor`, so it really did meet the widened
wall.

| grinder arm, entries only | baseline | **floor removed (shipped)** | wall kept, window 6 |
| --- | --- | --- | --- |
| entries / season | 26.7 | 34.9 | 32.7 |
| domestic entries / season | 8.5 | 21.4 | 18.6 |
| W-track entries / season | 10.0 | 7.5 | 8.0 |
| ...of those, W75 and above | 3.2 | 0.6 | 1.2 |
| median peak W rank | #257 | #333 | **#250** |
| **ever held a professional ranking** | **40/54** | **24/54** | **24/54** |

| player arm, entries only | baseline | **floor removed (shipped)** | wall kept, window 6 |
| --- | --- | --- | --- |
| W-track entries / season | 7.7 | 8.6 | 9.3 |
| ...of those, W75 and above | 5.0 | 2.4 | 3.2 |
| median peak W rank | #162 | #173 | #156 |
| ever held a professional ranking | 42/54 | 37/54 | 37/54 |

**Widening the window recovers about half the rank damage and NONE of the participation damage.** The
share of careers that ever reach the professional table is **24 of 54 on both variants** against 40
in the baseline, on the grinder arm, and 37 on both against 42 on the player arm. That is the useful
finding, and it is the one that decides how to read criterion 4: **the cost is not a property of
which variant is chosen. It is the cost of letting a maximal-appetite career fill every week of its
calendar**, which both variants do.

### 3c. THE OWNER RULED, 08.08 – AND HE REJECTED THE FRAMING, NOT JUST THE TRADE

Quoted verbatim, because the framing is the ruling:

> «нет, теперь ей есть где играть ЕСЛИ игрок этого хочет. Турниры в реальности идут постоянно. И не
> на всех она нормально выступает, если я съездил на турнир и вылетел в первом раунде, а потом 6-7
> недель нет вообще игр – это не правильно.»

**Tournaments run continuously in reality, and a first-round exit followed by six empty weeks is
simply wrong.** Having somewhere to play is not a cost to be traded against rank – it is the correct
state of the world. What she does with those weeks is the player's decision, and a player who wastes
them is a player making a bad decision, which is a legitimate thing for a game to allow.

⚠ **That resolves criteria 4 and 6, and it does so by rejecting what they measured.** Both were
measuring the consequence of moving a decision from the engine to the player, and the ruling is that
the decision belongs to the player. **The participation fix ships as it stands** – no softening, no
partial wall.

⚠ **I am leaving §3a and §3b exactly as written.** They were the honest reading available before the
ruling and they are the evidence it was made against; rewriting them into agreement would delete the
record of what the change costs. §4 is what was built in answer.

### 3c-old. What I recommended, and what turned out to be the owner's to rule

**Do not merge this alone.** By its own rule the wave is a supply fix with a balance cost attached,
and `tests/econ-reach.test.ts` is red on the branch as the standing evidence of it. What ships is the
pair – the fix and a ruling on the cost – or nothing.

**The fix half is right and should survive whatever he rules.** It is the defect he reported, it does
exactly what he asked, and on his own save it turns 27 dead weeks into 6 with the acceptance cuts
untouched to the event.

**The cost half is his call and not mine:**

1. **Do nothing.** The parent now has a real way to waste a season, and learning not to is the game.
   ⚠ Against it: the grinder arm says an unadvised parent loses two thirds of his professional
   careers, and the game currently warns about that with one soft caution line.
2. **Give the brake teeth.** Price fatigue at a rung she has outgrown higher than at her working one,
   or let the hired coach speak against it (`coachCaution` already exists on the card and is already
   suppressed on blocked ones). Cheap, measurable, and does not touch the ruling.
3. **A softer floor rather than none.** Keep the rungs open but stop the CALENDAR offering as many of
   them – the density knob, not the gate. Untested here; it is a calendar change, not a ladder one.

None of the three is taken in this wave. The engine change is on the branch, measured, guarded and
reversible in one line (`tierOpenFor`) – and option 2 is the one I would measure first, because it
costs nothing the ruling cares about: it leaves every rung open and only makes the game say, louder
and earlier, what a week spent on a draw beneath her is worth.

### 3d. Where §0's predictions were wrong

* **"Criterion 1 passes with room; the dead-week count should land at 2, not 6."** Wrong, and
  usefully so: 25 of his 27 dead weeks carry an outgrown event, but four of those weeks are also
  off-season / exam / vacation weeks, so the ceiling was hiding an availability block underneath it.
  The measured number is exactly the bar.
* **"Criterion 3 is the one at risk."** Wrong. It passes comfortably, and from the opposite side.
* **"Criterion 4 is the second risk, through fatigue rather than through taste."** Right, and it is
  the one that fails.
* **"Criterion 5 I expect to hold by construction and I do not trust that."** It held, and the
  distrust paid for itself: measuring it is what produced §2d's reason for adding no fourth tiebreak.

---

## 4. THE COACH AS SCHEDULER – what was built in answer

> «дать голос тренеру – тоже хорошая идея, надо попробовать, он и так уже что-то пишет на карточках,
> можно это использовать как раз.» … «да, идём этим путём, начинай с расписания.»

⚠ **AND THE FRAME IS BIGGER THAN A BRAKE.** The coach was a skill-growth multiplier and nothing else,
and growth is a share of REMAINING headroom – so past ~90% realisation he buys nothing measurable
(budget and elite were measured printing the SAME number at 93.4% realised, while an elite one still
bills $312 a week). **The role did not degrade gracefully; it ran out of a job.** The arc the owner
approved is: early years he buys growth, later he buys **scheduling**, load, opponent preparation and
the emotional part. Scheduling is the first pillar, and it arrives here because the ladder floor is
what created the decision it is about.

It **invents no mechanic**, which is `coach-as-load-manager.md`'s own standing rule for this family –
*"what moves is WHO DECIDES"*. `coachCaution` already renders on the event row in both feeds and is
already folded into the enter-confirm. What is added is one thing he has an opinion about: today he
only ever talks about her CONDITION and has no view on WHICH event.

### 4a. What he says, and when

| | he says | at which rungs |
| --- | --- | --- |
| **this week's choice** | *"the W50 is the week – "* + whichever claim is TRUE (see 12.08 note) | every hired rung |
| ↳ wrong table | *"…this pays national points, not the table she is climbing"* | every hired rung |
| ↳ shut book | *"…this one will not move anything"* | middle, high, elite |
| ↳ otherwise | *"…she has outgrown this one"* | every hired rung |
| **the book** | *"even a title here would not move her ranking"* | middle, high, elite |
| **the block ahead** | *"would save her for the W50 in 3 weeks"* | inside his own horizon |

⚠ **RE-LICENSED 12.08 – the claim, not the wording** (the owner, on his own entry confirm: «the
National Series is the week – this one will not move anything. Enter World Tour 35?» ... «если
знаешь что и зачем чинить – чини»). The strongest sentence in the voice was made by the branch that
did the least work: it asked `hasOutgrown` plus a same-week rung and NEVER asked `bookClosedTo`, and
its `better()` never compared tracks – so it dismissed cards whose own best-N book had room, and
held up domestic rungs against her professional card. Measured on `tools/coach-ladder-claim-probe.ts`
(24 seeds × 260 weeks, middle rung): **fired on 2,658 cards, 87.1% of them with ROOM in the card's
own book – the sentence was false – and 84.5% with the alternative on another table.** After the fix
the strong claim fires on 137 cards, **0 with room (0.0%), 0 with the alternative off her climbing
tables or below the card's own** (the owner's shape); the control clause stays 0 of 239. The
alternative picker now only offers rungs on a table she is climbing (`activeLadderOf` and up – the
one-way door read as coaching), and a card paying into a table she has left is told THAT, by name,
because it is the useful sentence and it stays true whether or not the dead table's window happens
to be full. The probe cross-checks the shipped `coachLadderNote` against its replica per card
(0 disagreements) and reports where the old firing set went: 2,015 wrong-table, 430 outgrown, 137
true strong claims, 72 horizon, 2 book, 2 silence.

**He only ever talks about a rung she has WALKED PAST.** That single gate is what bounds the rate: her
working rung is where he wants her and he has nothing to add there, and a genuine choice *inside* her
window is the player's taste rather than his business.

**And he speaks only with an argument.** A rung she has outgrown, on a week with nothing better and
nothing to say about her book, gets **silence** – because there she should play, which is exactly
what the ruling says.

⚠ **HIS OWN RUNG DECIDES HOW FAR HE SEES**, which is what makes paying for him a decision again:
`COACH_HORIZON_WEEKS` = budget **0** · middle **2** · high **4** · elite **6**, and self is nobody at
all. A budget coach is on the court with her, so he can tell you the W50 on Tuesday is the better
draw than the club event on the SAME Tuesday – both are in front of him. He is not sitting with a
calendar three weeks out, and he is not keeping her best-N book either (`coachReadsTheBook`).

⚠ **ONE COPY CHANGE, AND IT IS THE VERB.** "Push through" is a body word – it is what you do to
tiredness – and there is nothing to push through about a club draw in a week when the W50 is the
better tournament. A scheduling caution turns the button into **"Enter anyway"**. Both keep the
affordance the load slice built: the button stops saying "Enter", so the player notices he is
overruling somebody.

### 4b. How often he speaks – the wallpaper test

| | rendered cards | every enterable card |
| --- | --- | --- |
| **grinder, the voice shipped** | **22.0%** | 31.1% |
| **player, the voice shipped** | **26.1%** | 36.5% |
| grinder, a parent who listens | **14.5%** | – |

⚠ **THE RENDERED RATE IS THE ONLY ONE A PLAYER CAN EXPERIENCE**, and the gap between the columns is
not a rounding difference: both feeds collapse a stacked week through `preferredWeekEvent`, so on a
week where the better event exists it is the better event that renders and he says nothing. **About
one week in five carries a line from him.** On the listening arm it falls to one in seven, because
the weeks he would have commented on are the weeks that parent no longer enters.

**By his own rung**, over every enterable card – grinder: self **0.0%** · budget **26.3%** · middle
**47.5%** · high **48.0%** · elite **47.7%**. Player: **0.0 / 36.6 / 56.9 / 54.5 / 54.8**.

**Which argument he uses**, grinder: this week **5,872** · the block ahead **1,745** · the book
**369**. ⚠ The book line is the rarest by an order of magnitude and it is the one only middle-and-up
can make, which is the tier read doing exactly what it was built for: the expensive coach is not
louder, he is the one who can tell you a week is arithmetically worthless.

⚠ **THE RATE SEPARATES THE FIRST THREE RUNGS AND THEN SATURATES, and that is a finding rather than a
target.** Nobody / the obvious / the book is a real ladder; above middle what changes is WHICH
argument he makes and how far ahead it reaches, not how often he opens his mouth. If the owner wants
the top rungs to feel different in FREQUENCY as well as in content, that is a second knob and it is
not in this wave.

### 4c. Does the voice recover the climb? Partly – and the silent cost makes it worse

Four arms, same command, same machine, 9 presets x 6 seeds x 520 weeks. **"+ listens" is a PLAYER,
not a rule**: the engine refuses nothing, `stepCareerWeek` takes an optional veto and the parent does
what his coach tells him. ⚠ 12 of the 54 careers in each arm are self-coached and have nobody to
listen to, so the listening arm is "the parents who have a coach take his advice", diluted by a fifth.

**GRINDER**

| | baseline | floor removed | **+ the voice, and he listens** | fatigue price (arm only) |
| --- | --- | --- | --- | --- |
| playable weeks, share | 57.0% | 71.6% | **74.2%** | 62.5% |
| entries / season | 26.7 | 34.9 | 30.1 | 32.0 |
| domestic entries / season | 8.5 | 21.4 | **14.7** | 27.9 |
| **W-track entries / season** | **10.0** | **7.5** | **9.2** | **2.5** |
| ...of those, W75 and above | 3.2 | 0.6 | **1.5** | 0.2 |
| peak W – best / p10 / median | #120 / #176 / #257 | #212 / #234 / #333 | **#178 / #194 / #311** | #235 / #235 / #331 |
| **ever held a professional ranking** | **40/54** | **24/54** | **32/54** | **9/54** |
| her W book at career end (median) | 114 | 0 | **54** | 0 |

**PLAYER**

| | baseline | floor removed | **+ the voice, and he listens** | fatigue price (arm only) |
| --- | --- | --- | --- | --- |
| playable weeks, share | 50.3% | 79.6% | **80.8%** | 77.3% |
| W-track entries / season | 7.7 | 8.6 | 8.3 | 8.9 |
| ...of those, W75 and above | 5.0 | 2.4 | **3.3** | 2.5 |
| peak W – best / p10 / median | #98 / #127 / #162 | #143 / #157 / #173 | **#113 / #127 / #171** | #133 / #143 / #179 |
| ever held a professional ranking | 42/54 | 37/54 | **40/54** | 39/54 |

**THE VOICE RECOVERS ROUGHLY HALF, AND IT DOES NOT COST PARTICIPATION.** On the grinder arm, careers
that ever reach the professional table go **24 -> 32 of 54** against a baseline of 40; W-track entries
**7.5 -> 9.2** against 10.0; p10 peak rank **#234 -> #194** against #176. And playable weeks go UP
rather than down – **71.6% -> 74.2%** – because a parent who skips the week his coach argues against
arrives at the next one fit enough to enter it. **Nothing about the participation fix is traded away
to get this**, which is the thing the ruling required.

⚠ **THE MEDIAN BARELY MOVES (#333 -> #311) AND THE BEST MOVES A LOT (#212 -> #178).** Advice is worth
most to a career that had somewhere to climb to. That is an honest shape for a coach and it is
reported rather than smoothed.

⚠⚠ **THE SILENT COST IS WORSE THAN DOING NOTHING, AND IT CANNOT BE FIXED BY TUNING.** The
fatigue-pricing arm – the domestic and junior rungs priced at the level a W-era player has walked
past – takes careers that ever hold a professional ranking to **9 of 54**, a THIRD of what the
unbraked floor removal leaves. It also drives Local entries UP (21.4 -> 27.9), because a girl whose
results have been wrecked by fatigue never climbs out of the rungs that pay least.

**And the reason is structural rather than a bad setting: a fatigue price cannot be AIMED.**
`matchDrain(tier, score)` is world-free by design, so a price can only be per-RUNG and never
per-SITUATION – it charges a fourteen-year-old for her own Local at the same rate it charges a
twenty-two-year-old for a club draw beneath her. **The coach's voice is aimed by construction**: he
speaks about a rung SHE has walked past, which is a fact about her and not about the rung.

**The price change is not shipped.** The arm is recorded here and is not in the tree.
### 4d. `tests/econ-reach.test.ts` – decided, and re-aimed by the file's own procedure

It was left RED while the change was unruled, which was right: re-aiming the evidence before the
verdict is how a measurement stops being one. **It is ruled now, and the guard is re-aimed rather
than deleted or weakened.**

**What it measures:** of 30 working-preset careers, how many reach a domestic-points milestone by
sixteen. It has fired seven times before, always on a world change, and its own note prescribes what
to do on the eighth: *"re-run `tools/reach-sweep.ts`, read the plateau column, and re-base to the
next milestone the domestic table NAMES rather than to the number that restores 11."*

**Why it fired, and it is the ruling arriving rather than a side effect:** the domestic ladder used
to PUSH her up itself, by closing Local behind her. It no longer does. A bench policy that enters
everything therefore spends its early weeks on club draws, and the incumbent target of 320 – *"she is
WINNING at the top of the domestic ladder by sixteen"* – went to **0 of 30**. A proxy nobody meets is
the same non-measurement 150 was from the other end.

**The sweep, run on this tree** (careers of 30 clearing each candidate, the working preset the band
is asserted against; median peak 224):

| target | 150 | 200 | **250** | 270 | 280 | 290 | 300 | 320 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| working · self-coached | 29 | 20 | **9** | 6 | 3 | 1 | 1 | **0** |

**Re-based 320 → 250.** It is the most-named number in the domestic table – Regional's
`enterPointBand` ceiling **and** J30's floor, which `act2-pro-tour.md` §12.2 records as *one
decision that must move together* – so the proxy becomes **"by sixteen she has crossed the
international door"**, a milestone the game is built around rather than a threshold picked to make a
test interesting. It reads **9 of 30** against the pinned band of `[4, 20]`, with room on both sides,
and both case branches (`0 < n < 30`) still fire.

⚠ **Nothing in the test was weakened**: the case assertions and the band are the ones that were there
yesterday, to the digit. What moved is the constant they ask about. The ruling is quoted verbatim in
the ⚠ comment, which is what makes the re-base checkable rather than convenient.

### 4e. The seam left open, named

**Tier changes WHAT he says and how far he sees; it does not yet change how OFTEN.** The rate
saturates above middle (47.5 / 48.0 / 47.7). If the owner wants the top rungs to feel different in
frequency as well as in content, that is a second knob – it belongs with the rest of the arc
(load, opponent preparation, the emotional part) and is not in this wave.
