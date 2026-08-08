---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-08
---

# Real vs bench – is the instrument describing a player who exists?

**PROBE, NOT A WAVE (backlog #89). No engine line is touched, no balance constant moves, nothing is
re-based, and `tests/econ-reach.test.ts` is not edited. One tool ships – `tools/real-vs-bench.ts` –
and it imports the engine read-only.**

**⚠ NOTHING DERIVED FROM THE OWNER'S SAVES IS COMMITTED EXCEPT THE STATISTICS ON THIS PAGE.** The two
careers are his. The tool takes a `.tsave` path on the command line and reads it through the game's
own import door; no save, and no fixture built from one, is in this repository or will be.

## Current truth

**The bench was describing a plausible player as recently as three days ago. It is not describing one
now, and the change is not in the bench – it is in the tree.**

Eleven human-played seasons across two complete careers, against 18 bench cells (9 presets x 2
policies) plus 3 derived cells, run to the same seven seasons on the same seeds, compared on the axes
the engine itself writes at every season wrap – and then the whole thing run a second time on
`d9efb4e`, the assembled tree before the ladder floor and the coach retainer.

| | **pre-wave tree** (`d9efb4e`) | **this branch's head** | **the two humans** |
| --- | --- | --- | --- |
| prize / career spend, the nine GRINDER cells | 0.0–40.8% | **0.0% in nine of nine** | **44.9% and 80.2%** |
| median grinder career's best rung | **8 cells of 9 reach a professional rung** (w15 … wta125) | **0 of 9 do** – j300 in eight, j30 in the ninth | **w100 and wta250** |
| cells fully inside the human envelope | **3 of 21** | 2 of 21 | – |
| cells inside on 8 of 9 axes or better | **9 of 21** | 4 of 21 | – |
| `25k middle · middle coach`, week 20 | **$27,558 · 10/10 above the $25,000 start** | $25,037 · 5/10 | **the owner reports ~$28,000** |

**Six findings, in the order they change what the owner has to decide.**

1. **HIS WEEK-20 REPORT IS THE BENCH'S OWN MEDIAN – ON THE TREE HE PLAYED.** He reports a 25k family
   with a middle-tier coach at $201/wk sitting on ~$28,000 at week 20. The pre-wave bench, same
   preset, same plan, grinder policy, reads **median $27,558 with 10 of 10 seeds above the $25,000
   start**. He is not an outlier and the bench never said he was. On the head tree the same cell
   reads $25,037 and 5 of 10 – the two waves took roughly $2,500 out of a family's first twenty
   weeks (§5).

2. **AND THE "30 OF 30 LATCH BANKRUPTCY" FIGURE NAMES A DIFFERENT CELL FROM THE ONE HE IS PLAYING.**
   `compound-cost-2026-08.md` measures `middleHigh` – the tripwire's own fixture – which is
   25k · middle · **HIGH** coach. His $201/wk is the **MIDDLE** rung (the middle corridor bands the
   middle coach at $175–340 at fourteen, and the high coach at $280–544). Measured separately over
   seven seasons on the head tree: **middle coach, player policy – 0 of 10 latch anything and none
   ever ends a season in the red**; high coach, same policy – **8 of 10 go bankrupt**. One rung
   apart, and the rung is the dearest line in the game (§5).

3. **THE GRINDER IS NOT A PLAYER, AND IT IS THE DEFAULT.** On the head tree, over seven seasons to
   age 21, the grinder books a **median of $0 in prize money in every one of the nine presets**, and
   its median career's best rung is **j300 in eight presets and j30 in the ninth – every one of them
   a JUNIOR event**, below w15, the first rung on the ladder that pays. `runCareer`'s default policy is
   `POLICIES[0]`, the grinder, and that is what `tests/econ-reach.test.ts` calls. **Zero of the nine
   grinder cells is inside the human envelope on the head tree** (§4).

4. **THE BRIEF'S PRIOR IS HALF RIGHT, AND THE HALF THAT IS WRONG MATTERS MORE.** The bench does enter
   more, at the start: in the owner's own cell it commits **33.0 entries in season 0 and 30.6 in
   season 1** against a human 14–23, and then collapses to 9–14 when the money runs out. But it does
   **not** overspend – the 8k grinder cells spend **$12,492–$17,112 a season against the humans'
   $17,484–$56,564** – and the dear-coach cells enter *fewer* than a human, because they are already
   dead. **The divergence is not on the cost side. It is the numerator** (§3).

5. **THE BENCH FORGOES EVERY DOLLAR OF SPONSORSHIP IN THE GAME AND NEVER BOOKS THE ONE THING THAT
   STOPS THE RETAINER.** Signing a kit deal needs `signOffer` and a holiday needs a booking; no
   policy in `tools/econ-bench.ts` calls either. Every bench career therefore lets **2.0 to 9.9
   sponsorship offers expire unread**, and books **0.0 holidays** – while `coachWorksThisWeek` names
   a booked family holiday as one of only two weeks in the year the retainer is not owed. Both
   humans signed deals; the owner took a holiday. **Academy support, by contrast, is NOT a
   divergence** – the bench gets a scholarship in 100% of working and middle careers, exactly as both
   humans did (§3.4, and §0d for the reading error that briefly said otherwise).

6. **A `human` POLICY WAS DERIVED, AND ON THE TREE THE BEHAVIOUR WAS OBSERVED ON IT IS THE BEST MATCH
   IN THE FILE.** The one thing no bench cell can express – a parent who starts self-coached and
   climbs the coach ladder as the tennis pays – was read off the saves and run. Pre-wave it is
   **the only 8k cell fully inside the envelope, 9 of 9 axes**, and its climb lands at weeks
   **14 / 94 / 179** against Zoe's actual **38 / 113 / 162**. On the head tree it falls out of the
   envelope along with everything else (§6).

**⚠ THE ONE THING THIS PROBE DOES NOT ESTABLISH** is which tree his 25k career is on. Both saved
careers demonstrably predate both waves (§0c); his week-20 report may or may not. That is a question
for him and it is the single cheapest thing that would settle the rest – **one exported save from the
current build** (§7).

---

## 0. How it was measured, and the four things that make it honest

### 0a. Both sides are read off the SAME engine-written record

`maybeFireSeasonWrapUp` appends one `SeasonHistoryEntry` per season to `world.seasonHistory` –
`endRank`, `points`, `wins`, `losses`, `fundsDeltaCents`, `endFundsCents`, `spentCents`,
`earnedCents` – and it does that for a bench career ticked by `stepCareerWeek` exactly as it does for
a career played by hand on a phone. **So the axes below are not two tools' readings of two things.
They are one writer's rows, compared.**

This is deliberately not true of `financeWeeks`, which the engine prunes to a 60-week trailing
window, so a per-CATEGORY fold of a human season three years old is unrecoverable from a save and
none is attempted here. `spentCents` survives precisely because `SeasonHistoryEntry` banks it at the
wrap, for the reason its own comment gives.

### 0b. The entry estimator, and its receipt – it is the weakest axis in the file

A save cannot report how many tournaments were entered; nothing durable counts them. It can report
losses and titles, and every entry ends in exactly one loss unless she wins the thing, so
`entries = losses + titles`.

⚠ **MEASURED RATHER THAN ASSERTED, AND IT IS ONLY FAIR.** `--verify` runs bench careers where BOTH
numbers are known:

```
630 season rows · exact 181/630 = 28.7% · mean |error| 2.78 entries
                                 on a mean of 21.3 true entries/season
```

**About ±3 entries, or 13%.** The identity is exact for a season played in isolation and leaks
across season boundaries, because `enterEvent` books the commitment up to `ENTRY_LOOKAHEAD` weeks
before the draw – so an entry committed in December is a loss counted in January. **Read the entries
row as a band, never as a count**, and prefer `matches`, which is exact on both sides.

⚠ **AND IT ONLY COVERS THE SEASONS THE TROPHY CABINET COVERS.** `trophiesByTier` arrived at schema
v31 and its migration creates an EMPTY cabinet – it cannot backfill weeks nobody recorded. The
owner's diary names a Local title at week 9 and his cabinet's earliest entry is week 90. The tool
computes the first covered season per save and prints `–` for every earlier one, so the human entry
band rests on five seasons of eleven rather than on eleven quietly-wrong ones.

### 0c. The tree, and why the whole thing is run twice

Both human careers were played on trees that predate the two waves under investigation. This is not
inferred from the saves' timestamps alone – the schema version each was written at pins it:

| | exported | schema | landed |
| --- | --- | --- | --- |
| the owner's career (week 412) | 2026-08-05 07:42 | **40** | v40 landed 08-04 14:29, v41 on 08-05 10:49 |
| Zoe (week 255) | 2026-08-08 13:46 | **43** | v43 landed 08-05 18:56 |
| `fix/ladder-window-floor` | | | merged 2026-08-08 **16:12** |
| the coach retainer (`bf00acb`) | | | merged 2026-08-08 **16:11** |

Zoe's save is three hours older than the waves; the owner's is three days. That is a confound on
every money axis, and it is answered the way `compound-cost-2026-08.md` §0 answers this class of
question – **the arm is the tree**:

```
git worktree add --detach ../tb-arm-prewave d9efb4e
```

Verified in place rather than assumed: in that worktree `tierOpenFor` reads
`tierFloorOpen(...) && !tierOutgrown(...)` and `coachWorksThisWeek` ends
`return world.coachOnEventWeeks || !isCompetitionWeek(world)` – exactly the baseline row of that
document's mechanism matrix. Its schema is 43, so both saves decode there unchanged.

### 0d. The probe's own false finding, caught and corrected

⚠ **THE FIRST VERSION OF THIS FILE REPORTED "ACADEMY: 0% OF BENCH CELLS, 50% OF HUMANS" AND BOTH
HALVES WERE ARTEFACTS.** `ECONOMY.academy.ageBand` is `[13, 18]`, so `world.academy` is null at the
end of ANY seven-season run – she is 21 – whether or not a scholarship ever existed. Read at the end
of the run, the bench looked as though it never got one and the owner looked as though he never had
one. **He did**: his diary still carries the award, `keep: true`, at week 52 – *"An academy has taken
her on – a scholarship covering 31% of her travel"* – and Zoe's says the same week at 61%. The bench
side now ORs the flag every week and the human side reads the kept diary line.

**Corrected, the figure is 100% of every working and middle bench cell against 2 of 2 humans, and the
divergence this probe briefly claimed does not exist** (§3.4). It is recorded here rather than
quietly fixed because a probe that only reports the findings that survived is not a measurement –
and because the failure mode generalises: **a career state read at the end of a run answers "is this
true now", never "was this ever true".**

The same class of error is why `entriesTrue` is carried beside `entriesEst`, and why §0b prints an
error rate instead of a claim.

---

## 1. The human – eleven seasons of ground truth

Two complete careers, both **`working` background – an $8,000 start**. Neither is the 25k family; the
owner's 25k report is a third career, in progress at week 20, and §5 addresses it on its own terms.

### 1a. The owner's career – week 412, seven banked seasons

`working` · started on a **middle** coach · plan 75/25 · composite kit throughout.

| season | rank | pts | W | L | matches | titles | entries | spend | earned | net | end funds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| s0 | #127 | 618 | 28 | 16 | 44 | – | – | – | – | -$666 | $7,334 |
| s1 | #13 | 548 | 46 | 11 | 57 | – | – | $20,872 | $17,463 | -$3,409 | $4,055 |
| s2 | #6 | 497 | 40 | 10 | 50 | 5 | 15 | $17,484 | $18,399 | $915 | $4,914 |
| s3 | #6 | 719 | 51 | 6 | 57 | 8 | 14 | $27,119 | $38,304 | $11,185 | $15,956 |
| s4 | #111 | 115 | 38 | 12 | 50 | 3 | 15 | $32,197 | $47,699 | $15,502 | $31,265 |
| s5 | #102 | 366 | 40 | 17 | 57 | 6 | 23 | $56,564 | $46,334 | -$10,231 | $19,804 |
| s6 | #74 | 460 | 38 | 19 | 57 | 2 | 21 | $52,679 | $43,986 | -$8,693 | $10,754 |

**Career: earned $147,414 · spent $167,802 · prize $75,380 = 44.9% of spend.** Best rung played
**w100**; thirty titles in the cabinet – a floor, not a count, for the reason §0b gives – including
w15, w35, w50 and w75. Two kit deals signed, one
left to expire. **One family holiday.** An academy scholarship from week 52 covering 31% of her
travel. Eight weeks lost to injury across four injuries. **Never ended a season in the red** – his
lowest wrap is $4,055.

### 1b. Zoe – week 255, four banked seasons

`working` · started **self-coached** · plan 75/25 · pro/pro/performance kit bought at w208–214 ·
academy scholarship from week 52 covering 61% of her travel.

| season | rank | pts | W | L | matches | titles | entries | spend | earned | net | end funds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| s0 | #7 | 254 | 20 | 18 | 38 | – | – | – | – | $1,079 | $9,079 |
| s1 | #10 | 546 | 39 | 16 | 55 | – | – | $18,225 | $18,841 | $616 | $9,641 |
| s2 | #36 | 192 | 44 | 20 | 64 | – | – | $27,814 | $28,680 | $865 | $10,844 |
| s3 | #19 | 629 | 48 | 16 | 64 | 5 | 21 | $36,689 | $77,029 | $40,340 | $50,073 |

**Career: earned $201,535 · spent $138,680 · prize $111,250 = 80.2% of spend.** Best rung played
**wta250** – a rung `money-decomposition-2026-08.md` §4.5 measures the bench entering **0 times in
180 careers** – plus a wta125. Titles at w15, w35, w50, w75 and **w100**. One kit deal signed, one
**refused**, one expired. Eleven weeks lost to injury, including a nine-week wrist stress reaction.
Also never red.

**⚠ AND HER COACH IS A LADDER, NOT A SETTING.** Self-coached to week 38, budget to 113, middle to
162, high thereafter. **No bench cell can express that**: a preset picks a rung at birth and holds it
for the whole career. §6 is the attempt to model it, and it works.

### 1c. The envelope

Per-season min–max across both careers' own rows. **It is a wide, generous band and that is
deliberate** – a full min-max over two careers, not a confidence interval – so a cell fails an axis
only by landing outside everything either human ever did in any season. **Failing this test is a
strong statement; passing it is a weak one. Read the misses, not the hits.**

| axis | human band |
| --- | --- |
| matches / season | 38–64 |
| entries / season | 14–23 (five seasons of eleven; ±3, see §0b) |
| win rate | 53%–89% |
| spend / season | $17,484–$56,564 |
| earned / season | $17,463–$77,029 |
| net / season | -$10,231–$40,340 |
| spend / match | $331–$992 |
| **prize / career spend** | **44.9%–80.2%** |
| **top rung played** | **w100–wta250** (index 10–12 of 15) |

⚠ **IT IS AN 8k ENVELOPE.** Both humans are `working`, so the four money axes carry that corridor.
The 25k and 120k cells below are expected to miss on `spend`, `earned` and `$/match` for that reason
alone, and their misses on those three axes are not evidence of anything. `prize/spend`, `topRung`,
`win%` and `matches` are the axes that survive the corridor.

---

## 2. The bench on the same axes, on both trees

Nine presets x two policies, 10 seeds each, seven seasons, seeded identically to `econ-bench`.

### 2a. This branch's head – both waves live

| cell | matches | entries | win% | spend/yr | earn/yr | net/yr | $/match | prize/spend | topRung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **HUMAN** | **53.9** | **18.2** | **73%** | **$27,814** | **$38,304** | **$865** | **$476** | **62.6%** | **wta125** |
| 8k working self · grinder | 46.1 | 27.0 | 46% | $12,492 | $20,275 | $5,868 | $264 | **0.0%** | j300 |
| 8k working self · player | 49.9 | 20.8 | 66% | $19,623 | $22,488 | $7,606 | $409 | 49.3% | w100 |
| 8k working budget · grinder | 38.0 | 20.9 | 50% | $15,282 | $19,839 | $2,458 | $326 | **0.0%** | j300 |
| 8k working budget · player | 55.1 | 22.2 | 68% | $22,570 | $23,969 | $3,563 | $422 | 61.5% | wta250 |
| **8k working middle · grinder** | 30.3 | 16.4 | 53% | $17,112 | $19,408 | $886 | $382 | **0.0%** | j300 |
| **8k working middle · player** | 50.7 | 20.9 | 70% | $19,291 | $19,648 | $208 | $375 | **0.0%** | j300 |
| 25k middle self · grinder | 43.7 | 26.0 | 45% | $17,005 | $28,037 | $7,370 | $370 | **0.0%** | j300 |
| 25k middle self · player | 48.8 | 21.1 | 64% | $32,817 | $31,163 | $9,182 | $725 | 37.9% | w100 |
| 25k middle budget · grinder | 41.5 | 22.8 | 51% | $24,399 | $27,067 | $1,510 | $520 | **0.0%** | j300 |
| 25k middle budget · player | 55.2 | 21.7 | 69% | $38,692 | $34,698 | $2,805 | $714 | 43.0% | wta250 |
| **25k middle middle · grinder** | 29.9 | 16.5 | 51% | $25,107 | $26,632 | -$222 | $534 | **0.0%** | j300 |
| **25k middle middle · player** | 54.5 | 22.5 | 69% | $29,811 | $27,600 | -$236 | $566 | 4.6% | w35 |
| 25k middle high · grinder | 18.3 | 9.7 | 57% | $31,916 | $26,313 | -$3,985 | $659 | **0.0%** | j30 |
| 25k middle high · player | 18.5 | 8.3 | 68% | $31,887 | $26,356 | -$3,270 | $671 | **0.0%** | j300 |
| 120k wealthy high · grinder | 44.3 | 24.9 | 49% | $53,816 | $49,288 | -$3,070 | $1,040 | **0.0%** | j300 |
| 120k wealthy high · player | 56.1 | 22.1 | 69% | $82,025 | $63,364 | -$7,435 | $1,458 | 23.4% | wta125 |
| 120k wealthy elite · grinder | 25.6 | 14.5 | 49% | $65,146 | $46,902 | -$16,945 | $1,432 | **0.0%** | j300 |
| 120k wealthy elite · player | 29.0 | 12.6 | 65% | $66,290 | $51,188 | -$17,062 | $1,624 | 4.1% | w75 |

**⚠ THE `prize/spend` COLUMN IS THE FINDING AND IT IS NOT A ROUNDING.** Nine grinder cells, nine
zeroes: the median grinder career, in every family and at every coach rung, reaches age 21 having
been paid **nothing**. And the median grinder's best rung is **j300 – a JUNIOR tournament**. w15 is
the first professional rung on the ladder and the median grinder career never enters one.

### 2b. The pre-wave tree, `d9efb4e` – same tool, same seeds, same saves

| cell | matches | entries | win% | spend/yr | earn/yr | net/yr | $/match | prize/spend | topRung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **HUMAN** | **53.9** | **18.2** | **73%** | **$27,814** | **$38,304** | **$865** | **$476** | **62.6%** | **wta125** |
| 8k working self · grinder | 40.7 | 21.9 | 50% | $22,810 | $22,261 | $580 | $574 | 28.4% | w75 |
| 8k working self · player | 44.4 | 18.5 | 65% | $24,015 | $40,550 | $10,502 | $546 | 80.4% | wta250 |
| 8k working budget · grinder | 44.6 | 21.7 | 56% | $26,460 | $24,682 | $1,550 | $594 | 40.8% | wta125 |
| 8k working budget · player | 44.5 | 17.7 | 68% | $26,948 | $43,516 | $9,556 | $658 | 90.4% | wta250 |
| **8k working middle · grinder** | 40.3 | 19.6 | 56% | $25,183 | $23,330 | $1,660 | $642 | **39.8%** | wta125 |
| **8k working middle · player** | 36.2 | 14.0 | 69% | $20,028 | $21,090 | $1,425 | $756 | **50.2%** | wta250 |
| 25k middle self · grinder | 42.8 | 22.2 | 52% | $36,989 | $30,418 | -$1,634 | $835 | 16.0% | w75 |
| 25k middle self · player | 44.2 | 18.4 | 65% | $39,222 | $41,660 | $10,632 | $830 | 58.6% | wta250 |
| 25k middle budget · grinder | 45.2 | 21.4 | 58% | $40,605 | $31,461 | -$570 | $858 | 28.7% | wta125 |
| 25k middle budget · player | 44.3 | 17.5 | 68% | $40,808 | $37,739 | $5,409 | $907 | 52.2% | wta250 |
| **25k middle middle · grinder** | 28.2 | 13.5 | 57% | $27,163 | $28,537 | $220 | $964 | 0.2% | w15 |
| **25k middle middle · player** | 34.9 | 13.6 | 69% | $28,885 | $29,220 | $798 | $1,096 | 17.9% | w50 |
| 25k middle high · grinder | 15.1 | 7.5 | 56% | $32,345 | $26,956 | -$2,842 | $903 | 0.0% | j300 |
| 25k middle high · player | 11.4 | 5.0 | 64% | $31,598 | $26,194 | -$3,074 | $997 | 0.0% | j60 |
| 120k wealthy high · grinder | 46.6 | 24.0 | 52% | $76,739 | $55,176 | -$14,642 | $1,593 | 11.0% | w100 |
| 120k wealthy high · player | 48.0 | 19.0 | 68% | $85,841 | $77,220 | -$3,295 | $1,647 | 33.3% | wta250 |
| 120k wealthy elite · grinder | 30.0 | 15.5 | 53% | $68,209 | $51,934 | -$16,338 | $1,732 | 3.4% | w50 |
| 120k wealthy elite · player | 24.8 | 10.2 | 66% | $66,872 | $52,270 | -$16,278 | $1,933 | 4.5% | w75 |

**⚠ THE OWNER'S OWN CELL, EITHER SIDE OF THE TWO WAVES.** He played `8k · working · middle coach`
and finished at **44.9%** prize over spend, best rung **w100**. The pre-wave bench grinder on that
cell reads **39.8% and wta125** – five points and one rung off a human who played it. The head-tree
bench grinder on the same cell reads **0.0% and j300**. Nothing about the instrument changed between
those two rows. The tree did.

---

## 3. Where they diverge, ranked by how much it moves the money

### 3.1 The numerator, and it is not close (head tree)

The grinder's median career earns **$0** in prize money in nine presets of nine. The humans earned
**$75,380** and **$111,250** – 44.9% and 80.2% of everything they spent. On a career spend near
$150,000 that is between $67,000 and $120,000 of income the bench's default policy never books.

Every other divergence below is either a cause of this one or a rounding next to it.

### 3.2 The rung, which is what the numerator is made of

`money-decomposition-2026-08.md` §4.4 established that the prize curve is exponential in rank and the
rank wall is upstream of every money question. This probe supplies the human reading of that wall:
the humans played to **w100** (index 10) and **wta250** (index 12); the head-tree grinder's median
career tops out at **j300** (index 5) – one rung below w15, the first professional event on the
ladder, and five below the lower of the two humans. Zoe entered a WTA 250, a rung that document
measures the bench entering **0 times in 180 careers**.

### 3.3 The win rate, which is what the rung is made of

Human **73%** (53–89% by season) against a head-tree grinder **45–57%** and a player **64–70%**. The
grinder's own tuning note in `econ-bench.ts` says why in as many words – the plateau work measured
its mean condition at **24.4 against the field's 72.3**. **The bench's default policy plays a
permanently exhausted child**, and the two human saves are at condition 54 and 92.

### 3.4 What the bench never does at all – and this is structural, not a tuning gap

| | humans (2 careers) | bench cells (21, both trees) |
| --- | --- | --- |
| academy scholarship | 2 of 2, from week 52 | **100%** of every working and middle cell · 0% wealthy |
| kit deals **signed** | 1.5 per career | **0.0 – none, ever, in any cell** |
| kit offers left to **expire** | 1.0 | **2.0–9.9 per career** |
| family holidays booked | 0.5 | **0.0 – none, ever, in any cell** |

**THE ACADEMY IS NOT A DIVERGENCE, AND THAT IS WORTH SAYING BECAUSE THIS PROBE FIRST CLAIMED IT WAS**
(§0d). Every working and middle bench career picks up a scholarship, on both trees, exactly as both
humans did. The wealthy cells get none and that is `needFactor(background)` doing its job – the
scholarship is need-based by design. When the owner writes «много поддержки от академий», the bench
already models that support in full.

**THE TWO THAT ARE REAL ARE REAL EVERYWHERE.** Signing a kit deal needs `signOffer` and a holiday
needs a booking. **No policy in `tools/econ-bench.ts` calls either**, so every bench career declines
the game's entire sponsorship economy by silence – the kit allowance, the travel share, the
appearance fee and the result bonus – and never books the one week in the year `coachWorksThisWeek`
names as exempt from the retainer. The owner's global kit deal alone carried a $5,000 seasonal
allowance and a **25% travel share** for three seasons, against a career in which
`money-decomposition-2026-08.md` §4.6 measures travel at 59% of every dollar. **Zoe refused one deal
and signed another** – a choice between sponsors, in a population that has never made one.

⚠ **THE LOCAL SPONSOR IS `working`-ONLY, AND IT BEARS DIRECTLY ON HIS 25k CAREER.**
`ECONOMY.sponsor.eligible` is `['working']`: the weekly 6% roll and its $500–1,500 gift happen for
every background so the MAIN stream stays background-independent, but **only a working family banks
it**. Both of his saved careers are working and were collecting roughly $3,000 a season from it. His
25k family collects **nothing**. When he writes «много поддержки от академий и локальных спонсоров»,
half of that support does not exist in the cell he is describing.

### 3.5 Entries – the brief's prior, settled

**Half right.** In his own cell (`25k middle · middle coach`, head tree, grinder) the bench commits
**33.0 entries in season 0 and 30.6 in season 1**, against a human 14–23 – and then **collapses to
14.1, 9.0, 10.0, 9.9** across seasons 3–6, because by then it cannot afford to travel. The bench does
not enter more than a human for a career; **it front-loads two seasons and then stops playing
tennis.** A human enters at a flat 14–23 for seven years.

And on spend the prior is wrong outright: the 8k grinder cells spend **$12,492–$17,112 a season**
against the humans' **$17,484–$56,564**. The bench is not paying for all those entries – it is
buying cheap entries close to home, which is exactly why they pay nothing.

---

## 4. Does any preset produce a career inside the human envelope?

**Head tree: two of eighteen, and both are `player` on the 8k background.**

| of 21 cells | 9 of 9 axes | 8 of 9 | 5–7 of 9 | ≤ 4 of 9 |
| --- | --- | --- | --- | --- |
| **head** | **2** – 8k working self · player, 8k working budget · player | **2** – 25k middle self · player, 25k middle budget · player | 10 | 7 |
| **pre-wave** | **3** – 25k middle self · player, 25k middle budget · player, **8k working climbs · human** | **6** | 6 | 6 |

**Read as a policy question rather than a preset question, it is unambiguous.** On the head tree
**0 of 9 grinder cells** reach 8 of 9 axes and **4 of 9 player cells** do. **All nine grinder cells
miss `prize/spend`, and all nine also miss `topRung`.**

⚠ **AND THE MISSES ARE THE SAME TWO AXES ALMOST EVERYWHERE**, which is what makes this a finding
rather than a scatter: on the head tree `prize/spend` is missed by **19 of 21 cells** and `topRung`
by **15**. The bench's careers look like a human on matches, entries, win rate and cash flow, and
then earn nothing and go nowhere. **That is one failure, reported nine ways.**

**So: the balance conclusions in `compound-cost-2026-08.md` and `econ-reach` are drawn from the
grinder, and on this tree the grinder is outside the only human envelope we have on the two axes the
whole money argument runs on.** That does not make those conclusions wrong – §7 – but it is the
caveat they have been missing.

---

## 5. The 25k middle-coach cell, answered directly

**The claim under test:** the bench says a 25k family with a middle coach goes bankrupt; he is
running that cell and is up ~$3,000 at week 20.

### 5a. Week 20

| tree · policy | median funds at week 20 | seeds above the $25,000 start |
| --- | --- | --- |
| **pre-wave · grinder** | **$27,558** | **10 of 10** |
| pre-wave · player | $25,070 | 5 of 10 |
| head · grinder | $25,037 | 5 of 10 |
| head · player | $25,064 | 5 of 10 |

**He is describing the pre-wave bench's own median, almost exactly.** ~$28,000 against $27,558, with
every seed above the start. There is no disagreement to resolve at week 20 – on the tree his saved
careers came from, the bench agrees with him.

### 5b. Does it go bankrupt, and when?

| tree · policy | bankruptcies | median week | ever ends a season in the red |
| --- | --- | --- | --- |
| pre-wave · grinder | 4 of 10 | 136 | 0 of 10 |
| pre-wave · player | **none** | – | 0 of 10 |
| head · grinder | 7 of 10 | 142 | 4 of 10 |
| **head · player** | **none** | – | **0 of 10** |

**Under a managed calendar the cell does not go bankrupt on either tree – 0 of 10, over seven
seasons, on both.** Under the grinder it goes from 4 of 10 to 7 of 10 across the two waves, at a
median week 136–142 – about season 3, age 16–17. **The bankruptcy is a property of the policy first
and the tree second. It is not a property of the cell.**

### 5c. And the cell the "30 of 30" figure actually names

`compound-cost-2026-08.md` measures `middleHigh` = 25k · middle · **HIGH** coach. Run here beside the
middle rung, head tree, seven seasons:

| | 25k middle · **middle** coach | 25k middle · **high** coach |
| --- | --- | --- |
| the rung's weekly band at fourteen | **$175–340** | **$280–544** |
| week 20, head · grinder | $25,037 · 5 of 10 above start | $21,751 · **0 of 10 above start** |
| week 20, pre-wave · grinder | $27,558 · 10 of 10 | $26,287 · 9 of 10 |
| bankruptcies, head · grinder | 7 of 10, median week 142 | **9 of 10, median week 105** |
| bankruptcies, head · player | **none** | **8 of 10, median week 135** |
| bankruptcies, pre-wave · player | **none** | **8 of 10, median week 172** |
| median season-3 end funds, head · grinder | +$4,073 | **-$9,149** |
| entries by season 3, head · grinder | 14.1 | **0.7** |

**THE PRICE HE QUOTED IS THE DISCRIMINATOR, AND IT IS DECISIVE ON EITHER TREE.** $201/wk sits inside
the middle rung's $175–340 band at fourteen and **below the high rung's floor of $280**. There is no
reading of `coachWeeklyBandCents` on which a $201 coach is a high-tier coach in the middle corridor.

⚠ **HIS WEEK-20 BALANCE, BY CONTRAST, ONLY DISCRIMINATES ON THE HEAD TREE** – and that is worth
saying rather than quietly using the stronger-looking argument. On the current build the high-coach
cell puts **0 of 10 seeds above the $25,000 start** at week 20, so $28,000 rules it out; on the
pre-wave tree it puts **9 of 10** above and rules out nothing. The rung is established by the price,
not by the balance.

**⚠ AND THAT IS THE WHOLE DISAGREEMENT.** The bench never said a 25k family with a MIDDLE coach goes
bankrupt. It said a 25k family with a HIGH coach does, 30 times out of 30, and this probe reproduces
that at 8–9 of 10 on both trees and under both policies. He is one rung below the cell the tripwire
is built on, and one rung is the difference between **0 of 10 and 8 of 10**.

### 5d. What the bench's own version of his cell does differently

Season by season, head tree, grinder, his preset:

| season | s0 | s1 | s2 | s3 | s4 | s5 | s6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| entries | **33.0** | **30.6** | 21.8 | 14.1 | 9.0 | 10.0 | 9.9 |
| matches | 50.5 | 48.4 | 36.7 | 23.9 | 16.0 | 17.4 | 16.4 |
| end funds | $21,399 | $13,785 | **$3,024** | $4,073 | $9,704 | $19,792 | $32,517 |

**It spends its way to the floor in two seasons and then stops being a tennis career.** By season 4 it
enters nine events a year and plays sixteen matches; the balance recovers only because the parent's
wage keeps arriving and there is nothing left to spend it on. The humans enter 14–23 every season for
seven years and their balance never goes below $4,055.

---

## 6. The `human` policy – derived, then measured

### 6a. What was derived, and what was inherited

Stated separately so neither is mistaken for the other.

**DERIVED from the saves:**
* **The coach ladder itself.** Both careers climbed one; no preset can express one. Zoe:
  self → budget (w38) → middle (w113) → high (w162). The owner shopped at week 0 and moved up again
  at w211.
* **The trigger, $10,000.** The balances held at the four observed upgrades are ~$8–9k, ~$9.6k,
  ~$10.8k and ~$16.0k. **$10,000 is the median of those four.**
* **The pacing, one rung per season.** The observed gaps are 38, 75, 49 and 211 weeks. A balance
  trigger alone made a 25k family climb self → budget → middle → high in three consecutive weeks and
  reproduce `25k · middle · high coach · player` to the dollar – the arm was measuring the preset it
  existed to replace. Zoe's first gap of 38 weeks is faster than one-per-season allows; that is
  stated rather than fitted.

**INHERITED unchanged from `POLICIES[1]`:** the $5,000 reserve and the condition-70 rest floor.
Neither is derivable from a save – a save carries no condition history and no per-week cash. What can
be checked is the observable they produce, and `player`'s entries and matches per season already land
inside the human band before this arm adds anything. **That is a validation of the inherited pair,
not a derivation of it.**

### 6b. Measured

| | pre-wave | head |
| --- | --- | --- |
| 8k working climbs · human – axes inside | **9 of 9 – FULLY INSIDE** | 7 of 9 (misses prize/spend, topRung) |
| its prize/spend | **61.8%** (human band 44.9–80.2%) | 8.7% |
| its top rung | **wta250** | w35 |
| climb reached budget / middle / high | **w14 / w94 / w179** | w14 / w72 / w218 |
| Zoe's actual climb | **w38 / w113 / w162** | – |
| careers that ever end a season red | 1 of 10 | 1 of 10 |

⚠ **ON THE TREE THE BEHAVIOUR WAS OBSERVED ON, THE ARM DERIVED FROM IT IS THE BEST-FITTING CELL IN
THE FILE** – the only 8k cell inside on all nine axes, with a climb schedule within 20–25 weeks of
Zoe's on all three rungs, and a prize ratio inside a band whose two plain `player` neighbours
**overshoot** it (80.4% and 90.4% against a human ceiling of 80.2%). That is the derivation
validating itself on data it was not fitted to.

⚠ **AND ON THE HEAD TREE IT FALLS OUT, WHICH IS THE POINT RATHER THAN A DISAPPOINTMENT.** The same
behaviour, unchanged, run against the current game, earns 8.7% instead of 61.8% and stops at w35
instead of wta250. **Nothing about the parent changed. The climb to a `high` coach that Zoe funded
out of prize money and a 61%-of-travel scholarship is, on this tree, a bill she never earns back.**

**NOTHING IS PROPOSED.** `POLICIES` is untouched; the arm lives in `tools/real-vs-bench.ts` and its
`Policy.id` is deliberately not widened, so `econ-bench.ts` – which the sim project reads – is not
edited by this probe at all.

---

## 7. Is the bench fit to rule balance on?

**Yes, as an instrument. No, on the grinder alone, and not until the envelope is re-observed.**

1. **THE INSTRUMENT IS SOUND.** Both sides of every comparison here are the engine's own season rows,
   the pre-wave arm reproduces a human career on his own preset to within five points of prize ratio
   and one rung, and the probe's one false finding (§0d) was caught by its own cross-checks. Nothing
   suggests the bench computes anything incorrectly.

2. **BUT THE GRINDER IS NOT A PLAYER, AND IT IS WHAT `econ-reach` CALLS.** Nine zeroes in the
   `prize/spend` column is not a population a balance question can be asked of, because more than
   half of what the game's economy is *for* never happens in it. **The cheapest correction is not a
   re-base of anything: it is to read the tripwire's arms on `POLICIES[1]` beside `POLICIES[0]`**,
   which costs one parameter at the call site and no constant anywhere.

3. **AND THE ENVELOPE ITSELF IS THREE DAYS STALE.** Everything in §1 was played before the two waves.
   The honest statement of this probe's own limit: it establishes that the pre-wave bench described
   the pre-wave human well, and that the head-tree bench describes that same human badly. It cannot
   distinguish "the waves moved the game away from the player" from "the waves moved the game and the
   player would move with it". **One exported save from the current build settles that**, and it is
   the single cheapest measurement available to this project right now.

**⚠ THIS CHANGES NOTHING ABOUT THE COMPOUND-COST RULING AND IS NOT AN ARGUMENT FOR RE-BASING
`econ-reach`.** That file's §7 says leave it red, and this probe agrees for its own reason: 1 of 30
on the grinder is a **true** reading of a population that stopped earning. What this page adds is
that the red is louder than the two waves alone, because the arm it is read on had already stopped
resembling anybody.

---

## 8. What the gates say, and reproducing it

**The probe adds two files and modifies none.** `git diff HEAD` is empty on this branch; both
`tools/real-vs-bench.ts` and this page are new. In particular `tools/econ-bench.ts` – which the sim
project imports – is untouched, which is why the arm's `Policy.id` was left as the closed union it
is (§6b).

* `npm run context:audit` – **ok**, 161 documents.
* `npx vue-tsc -b --force` – **clean**.
* `npm run test:quiet` – **green in 148s**, 2,508 tests.
* `npm run test:sim` – **8 of 9 files green**; the ninth is `tests/econ-reach.test.ts` failing its
  14→18 arm at **1 of 30 against a floor of 12**. That is the assembled tree's own red, inherited
  unchanged and documented in `compound-cost-2026-08.md` §7, which rules that it stays red. **This
  probe did not touch it and does not propose touching it** – see §7.3.

```bash
npx vite-node tools/real-vs-bench.ts -- --save <a>.tsave --save <b>.tsave \
  --seeds 10 --human --cell --verify

git worktree add --detach ../tb-arm-prewave d9efb4e
ln -s "$PWD/node_modules" ../tb-arm-prewave/node_modules
cp tools/real-vs-bench.ts ../tb-arm-prewave/tools/
(cd ../tb-arm-prewave && npx vite-node tools/real-vs-bench.ts -- --save ... --seeds 10 --human --cell)
```

⚠ Every run prints `RUN real-vs-bench · <cwd>` on its first line. A number whose banner does not name
the worktree it was supposed to come from is not evidence.

⚠ **The `--save` paths are not in this repository and must not be.** The tool refuses to do anything
without them, which is the intended failure: this measurement is only reproducible by someone holding
the owner's own careers.
