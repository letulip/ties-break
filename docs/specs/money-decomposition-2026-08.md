# The money decomposition – why the tennis pays back a tenth of what it costs

**Status: measurement, not a change.** No engine constant moved, no guard test was edited. What
shipped is one new tool (`tools/money-decomposition.ts`, `npm run bench:money`) and this page.

Bench: `npm run bench:money`. Figures are 9 presets x 10 seeds x 2 retirement arms = **180 careers**,
grinder policy, fork answered "continue", fourteen to thirty-eight – the same population
`docs/specs/endings-and-the-album.md` section 6 reports, re-played at this branch's head.

---

## 0. The question

The owner read section 6 of the endings spec – the cumulative break-even fires **0 of 180**, prize
over spend at career end **median 8.0%** – and asked how that is even possible, given that the prize
money is huge and grows the further up the ladder you go.

He is right about the table. The winner's cheque by rung is w15 $2,200 · w35 $5,000 · w50 $6,000 ·
w75 $9,000 · w100 $14,500 · WTA 125 $20,000 · WTA 250 $40,000 · WTA 500 $140,000 · WTA 1000 $500,000
· Grand Slam $3,000,000. Losing the first round of our Slam pays **$190,000**.

## 1. The answer, in one sentence

**She never gets anywhere near the money.** The best professional rank reached by any of the 180
careers is **#237**; a WTA 125 accepts to #250, a WTA 250 to #200, a WTA 500 to #120, a Slam to #104
and a WTA 1000 to #65. So **0 of 180 careers ever enter a WTA 250, a WTA 500, a WTA 1000 or a Grand
Slam**, 2 of 180 ever enter a WTA 125, and **97.9% of every dollar of prize money in the population
comes from w35, w50 and w75** – three rungs whose titles are $5,000, $6,000 and $9,000. The huge
numbers are real, they are correctly tabled, and they are behind a door the shipped ladder does not
open. Everything else in this document is that sentence, itemised.

And the corollary, because it is the actionable half: **the door is not bolted, it is a rank gate,
and rank responds to how the calendar is played.** Re-running the identical 180 careers under the
bench's own "player" policy – a $5,000 reserve and a refusal to enter below condition 70, no engine
constant touched – takes the best peak rank from #237 to **#130**, puts 24 careers into a WTA 125 and
3 into a WTA 250, and produces **the first cash-positive tennis seasons this game has ever measured**
(6 of 2,821, against 0 of 2,422). Section 6a.

---

## 2. What was measured, and the receipt that it is the same game

`tools/money-decomposition.ts` re-plays the endings bench's own careers: `openCareer` and
`stepCareerWeek` from `tools/econ-bench.ts`, the same grinder policy, the same seeds
(`bench-<background>-<i>`), the fork answered "continue", and both retirement arms – which is exactly
how `runToEnding` builds the `turnRows` section 6 divides.

Because the loop is re-implemented (to instrument it), the tool proves rather than asserts the
equivalence. `--verify` re-runs `runToEnding` on every cell and compares four facts:

> **CROSS-CHECK vs `tools/endings-bench.ts` `runToEnding`: 180/180 careers identical on (ending,
> ended week, prize, spend).**

Both files then divide the same two numbers, so any ratio below is a statement about the endings
bench and not only about this tool.

### 2a. ⚠ The published 8.0% is stale, and this is the first thing to say

Re-measured at this branch's head, the same 180 careers give:

| | endings spec section 6 (commit `1c76403`) | this branch's head (`54c6084`) |
| --- | --- | --- |
| prize/spend at career end, median | 8.0% | **12.4%** |
| mean | 7.6% | **12.1%** |
| best | 22.9% | **37.4%** |
| ever paid a cheque | 136/180 | **122/180** |
| a WEEK that paid for itself | 84/180 = 46.7%, median week 187 | **104/180 = 57.8%, median week 190** |
| the CUMULATIVE crossing | **0/180 = 0.0%** | **0/180 = 0.0%** |

This is not an inference from the cross-check. `npm run bench:endings -- --seeds 10` was re-run on
this branch and its own slot-6 block prints, verbatim:

```
  a WEEK that paid for itself    : 104/180 = 57.8%   median week 190 (age 17)
  the CUMULATIVE crossing (§9.2) : 0/180 = 0.0%   median week – (age –)

  prize / spend at the end: median 12.4% · mean 12.1% · best 37.4%
  careers that were EVER paid a cheque: 122/180
```

`1c76403` is an ancestor of the `feat/field-in-brackets` merge (`03cbb92`), which changed
`season/fieldPros.ts`, `season/tournament.ts`, `season/calendar.ts` and `world.ts` – "the canonical W
brackets are played by professionals". Who she meets in a W draw changed, so what she wins changed.

The two figures moved in opposite directions – **fourteen fewer careers are ever paid at all, and the
ratio rose by half** – which is a real pair of facts and not an obviously coherent story. This probe
does not establish the mechanism: doing that would mean re-running the same 180 careers either side
of `03cbb92`, which is a separate measurement and was not in scope. Flagged rather than explained.

**Nothing in the conclusion moves.** The crossing is still 0 of 180, and 12.4% is the same answer to
the owner's question as 8.0% was. The week crossing moving 46.7% to 57.8% strengthens the album's own
copy rather than weakening it. The endings spec's section 6 table should be re-stamped with these
figures; that is a docs edit for whoever owns that page, not a change this probe makes.

Every other number on this page is measured at the head.

---

## 3. Predicted, then measured (invariant 4)

Written from the code and a 6-career smoke, before the 180-career output was read.

| # | predicted | measured | verdict |
| --- | --- | --- | --- |
| P0 | reproduces 8.0% / 7.6% / 22.9%, 136/180 paid | 12.4% / 12.1% / 37.4%, 122/180 | **wrong – and that is finding 2a** |
| P1 | first cheque median age 17; 10-15% of the denominator spent by then | age **16**, median share **12.7%** | age wrong, share right |
| P2 | ~44/180 never paid | **58/180** | low by 14 |
| P3 | bankruptcy ~0%, survivors 20-30%, the median dragged down by zero-numerator careers | bankruptcy **0.4%**, survivors **18.8-22.1%** | right |
| P4 | no peak rank better than ~#250; bands above #200 empty | best **#237**; all four bands above #200 empty | right |
| P5 | zero entries at wta125 / 250 / 500 / 1000 / slam | wta125 **2/180**, the other four **0/180** | right but for wta125 |
| P6 | travel largest (55-65%), entry ~20%, coaching 10-20% | travel **59.0%**, entry **14.4%**, coaching **16.1%** | right |
| P7 | income/spend median 90-105%, family ahead at end 20-40% | **97.8%**, **37.8%** | right |
| P8 | peak-season prize $15-25k against a real #45's $700k+, a 30-50x gap | peak-season prize **$13,885**; best season anywhere **$33,840** | gap is larger |
| P9 | working presets 20-25%, wealthy/elite 3-6%, and that spread makes the median | working **30-34%**, elite **3.6%** – but the mechanism is **bankruptcy**, not spending | **wrong mechanism** |
| P10 | *not predicted.* The lever arm was added after the smoke, on reading `rank-plateau.md` section 5 | the player policy moves the best peak rank **107 places** and makes a peak season cash-positive | **unpredicted, and it is the finding that matters most** |

P9 is the instructive miss. The expensive-coach presets do not have a low ratio because they spend
more per unit of tennis. They have a low ratio because **they die before the tennis starts** – see
section 4.2.

---

## 4. The decomposition

### 4.1 The numerator starts late, but that is not the main story

| | |
| --- | --- |
| careers ever paid a cheque | **122/180** (58 have a numerator of exactly zero) |
| first cheque | median **week 130, age 16** · earliest week 104 (age 16) · latest week 260 (age 19) |
| spend already booked by then | median **$73,727** · mean $99,463 |
| = share of the whole-career denominator spent before the first cheque | median **12.7%** · mean 22.8% |
| spend at ages 14-15 alone, when no rung she can enter pays a cent | median **$56,776** = **11.2%** of the denominator |

The junior sink is real and it is smaller than it looks: a career that runs to thirty-eight spends
over a million dollars, so the first two unpaid seasons are a tenth of it. **The dead weight is not
the two years before sixteen – it is the twenty years after it**, in which she keeps entering rungs
that pay nothing (section 4.5) and rungs that pay $5,000.

### 4.2 The same tennis, nine denominators – and the coach kills the career, not the ratio

The cheque does not scale with the wealth corridor; `finalizeTournament` says so in as many words.
Every bill does.

| preset | n | prize | spend | ratio | coaching | peak WTA |
| --- | --- | --- | --- | --- | --- | --- |
| 8k · working · self-coached | 20 | $112,835 | $372,927 | **30.3%** | $31,828 | #357 |
| 8k · working · budget coach | 20 | $133,295 | $397,922 | **33.5%** | $46,740 | #348 |
| 8k · working · middle coach | 20 | $9,475 | $149,293 | 6.3% | $43,999 | #345 |
| 25k · middle · self-coached | 20 | $90,435 | $467,498 | 19.3% | $42,964 | #363 |
| 25k · middle · budget coach | 20 | $133,565 | $542,984 | 24.6% | $74,011 | #323 |
| 25k · middle · middle coach | 20 | $22,675 | $536,155 | 4.2% | $119,376 | #357 |
| 25k · middle · high coach | 20 | **$0** | $81,582 | **0.0%** | $30,873 | #365 |
| 120k · wealthy · high coach | 20 | $146,265 | $1,114,956 | 13.1% | $208,860 | #334 |
| 120k · wealthy · elite coach | 20 | $11,385 | $320,119 | 3.6% | $92,000 | #365 |

Read the `spend` column, not the ratio. A `25k middle high coach` career spends a **median $81,582**
over its whole life – less than a fifth of what the same family self-coached spends – because it goes
bankrupt inside two seasons. Its ratio is 0.0% for the same reason its spend is small: there was
never a career. The wealth corridor does not compress the ratio by inflating the denominator; the
coach ladder truncates the career by emptying the numerator.

### 4.3 By ending – the population is bimodal, and 12.4% is the gap between the two modes

| ending | n | prize | spend | ratio | peak WTA | seasons | end age |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bankruptcy | **62** (34.4%) | $380 | $93,504 | **0.4%** | #365 | 4 | **16** |
| injury | 10 (5.6%) | $188,205 | $1,001,506 | 18.8% | #338 | 19 | 31 |
| natural | 51 (28.3%) | $257,450 | $1,187,678 | **21.7%** | #343 | 26 | **38** |
| plateau | 57 (31.7%) | $94,620 | $428,759 | **22.1%** | #345 | 12 | 24 |

Medians within the group; the ratio column is median prize over median spend.

**Nobody sits at 12.4%.** A third of the population ends at sixteen having been paid $380, and the
two-thirds who get a career run at 19-22%. The published headline is the midpoint of a hole. Any
statement of the form "the tennis pays back 12% of what it costs" is true of no career in the sample;
the honest pair of sentences is *one career in three never earns anything at all*, and *a career that
survives repays about a fifth*.

### 4.4 By peak rank – the key row does not exist

| peak band | n | career ratio | peak season | prize | spend | ratio | prize-positive seasons |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #1-20 | **0** | – | – | – | – | – | – |
| #21-50 | **0** | – | – | – | – | – | – |
| #51-100 | **0** | – | – | – | – | – | – |
| #101-200 | **0** | – | – | – | – | – | – |
| #201-500 | 122 | 26.2% | age 19 | $13,885 | $52,813 | **26.3%** | **0 / 1799** |
| #501+ | 0 | – | – | – | – | – | – |
| never held a W ranking | 58 | 0.0% | – | $0 | $23,060 | 0.0% | 0 / 623 |

> **The key row the owner asked for – a career peaking around real #45 – has n = 0.** Nothing in the
> sample gets within four bands of it.

And the row underneath it is the one to keep: **0 of 2,422 career-seasons in the whole population had
prize money beat that season's spend.** Not one season, at any age, in any preset, under either
retirement answer. The "does a peak season run cash-positive" question does not need a threshold –
the answer is that no season of any kind ever does.

`peakWtaRank` is tracked only from her first cheque, because `kidRankWta` is defined for a
fourteen-year-old who has never seen a W rung (she ties on zero points with everyone else who has
none, which reads as a rank in the mid-hundreds). Banding that naively would have put 58 careers that
never played a professional main draw into "#201-500" beside 122 that did.

⚠ **#365 is a number worth reading twice.** The merged W table is 199 cohort juniors + the kid + 364
derived field professionals. A peak of #365 means she finished one place behind **every single
derived professional in the world**. That is where the median career tops out.

### 4.5 Where the money is not

Every column is a per-career mean over the 180. `entry+travel` is exact rather than apportioned: the
entry fee is a flat per-tier constant charged by `enterEvent`, and `chargeTravel` bills the trip in
the event's own week, of which the engine allows exactly one.

| rung | winner | R1 loss | entries | careers ever | at peak | prize | % of all prize | entry+travel | NET | prize covers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| local | – | – | 47.5 | 180/180 | 5.8 | $0 | 0.0% | $5,357 | -$5,357 | 0% |
| regional | – | – | 48.7 | 180/180 | 3.7 | $0 | 0.0% | $15,370 | -$15,370 | 0% |
| national | – | – | 21.3 | 180/180 | 1.2 | $0 | 0.0% | $15,307 | -$15,307 | 0% |
| j30 | – | – | 26.0 | 180/180 | 2.4 | $0 | 0.0% | $29,542 | -$29,542 | 0% |
| j60 | – | – | 18.8 | 180/180 | 1.8 | $0 | 0.0% | $25,797 | -$25,797 | 0% |
| j300 | – | – | 4.6 | 176/180 | 0.4 | $0 | 0.0% | $8,620 | -$8,620 | 0% |
| w15 | $2,200 | $130 | 4.0 | 122/180 | 1.3 | $1,142 | 1.2% | $5,349 | -$4,206 | 21% |
| **w35** | $5,000 | $290 | **59.4** | 118/180 | 3.3 | **$43,142** | **43.6%** | $121,642 | -$78,500 | **35%** |
| **w50** | $6,000 | $350 | **53.0** | 118/180 | 3.7 | $27,727 | 28.0% | $122,691 | -$94,963 | 23% |
| **w75** | $9,000 | $550 | **38.3** | 116/180 | 2.5 | $26,009 | 26.3% | $98,818 | -$72,808 | 26% |
| w100 | $14,500 | $900 | 0.9 | 43/180 | 0.4 | $876 | 0.9% | $2,892 | -$2,017 | 30% |
| wta125 | $20,000 | $1,300 | 0.03 | **2/180** | 0.0 | $29 | 0.0% | $63 | -$35 | – |
| wta250 | $40,000 | $2,500 | **0.0** | **0/180** | 0.0 | $0 | 0.0% | $0 | $0 | – |
| wta500 | $140,000 | $8,500 | **0.0** | **0/180** | 0.0 | $0 | 0.0% | $0 | $0 | – |
| wta1000 | $500,000 | $31,000 | **0.0** | **0/180** | 0.0 | $0 | 0.0% | $0 | $0 | – |
| slam | $3,000,000 | $190,000 | **0.0** | **0/180** | 0.0 | $0 | 0.0% | $0 | $0 | – |

**Three facts, and they are the whole answer.**

1. **The top four rungs are never entered. Not rarely – never.** 0 of 180 careers enter a WTA 250, a
   WTA 500, a WTA 1000 or a Grand Slam, and 2 of 180 ever enter a WTA 125. **97.9% of all prize money
   in the population comes from w35, w50 and w75**, whose titles are $5,000, $6,000 and $9,000.
2. **Every rung is net-negative, including at her peak.** The best-performing rung in the game for
   this population is w35, where her prize money covers **35%** of the entry fees and trips it took to
   get there – before a dollar of coaching, gear, stringing or physio. There is no rung she can reach
   at which showing up pays for showing up.
3. **Over half of everything she enters pays nothing by design.** 166.9 of 322.5 entries per career
   = **51.8%**, costing **$99,994** per career in entry fees and trips, or 16.3% of the whole
   denominator. The junior and domestic ladders pay zero and always will ("juniors pay to play" – it
   is the thesis, not a gap), but the domestic rungs also **re-open permanently at eighteen**: their
   ceiling is `tierFloorOpen` of the rung three above, which for local/regional/national is a J rung
   whose age gate has shut, so `tierOutgrown` returns false for ever after. A twenty-nine-year-old
   professional is still entering Local Opens. That is the "she must always have tennis" rule
   (`WINDOW_RUNGS` / ruling 2) working as specified, and its cost is now measured.

### 4.6 What eats it – travel, at every age

Per-career means, booked in the week the money moved.

| category | 14-15 (junior) | share | 16+ (pro-age) | share | whole career | share |
| --- | --- | --- | --- | --- | --- | --- |
| coaching | $17,746 | 28.9% | $81,468 | 14.7% | $99,214 | **16.1%** |
| **travel** | $27,090 | **44.1%** | $336,021 | **60.7%** | **$363,111** | **59.0%** |
| entry | $6,561 | 10.7% | $82,087 | 14.8% | $88,648 | 14.4% |
| gear | $4,048 | 6.6% | $22,239 | 4.0% | $26,288 | 4.3% |
| physio | $4,655 | 7.6% | $24,748 | 4.5% | $29,403 | 4.8% |
| stringing | $1,385 | 2.3% | $7,257 | 1.3% | $8,643 | 1.4% |
| **TOTAL** | **$61,485** | 10.0% | **$553,822** | 90.0% | **$615,307** | |

**Travel is the career.** 59% of every dollar, and 73.4% once the entry fee that rides with it is
added. Coaching – the line the presets are built around and the one the owner has retuned three times
– is 16.1% of a whole career. It is decisive only in the way section 4.2 describes: it decides
whether there is a career, not how much of one costs.

The junior years are not a different economy, only a smaller one: coaching is a bigger share at 14-15
(28.9%) because she is not travelling yet, and once she is, travel takes over and never gives the
line back.

### 4.7 The other ratio – the family is fine, the tennis is not

| income line | 14-15 | 16+ | whole career | share |
| --- | --- | --- | --- | --- |
| prize | $0 | $98,925 | $98,925 | 13.1% |
| `income` | $46,258 | $561,597 | **$607,855** | **80.4%** |
| sponsor | $2,094 | $12,521 | $14,615 | 1.9% |
| academy | $257 | $917 | $1,173 | 0.2% |
| interest | $2,401 | $30,655 | $33,056 | 4.4% |
| **TOTAL INCOME** | | | **$755,625** | |

| | |
| --- | --- |
| income / spend over the career | median **97.8%** · mean 112.6% · best 424.5% |
| family cumulatively ahead **at the end** | **68/180 = 37.8%** (median net over the whole career: **-$8,370**) |
| the TENNIS crossing (album slot 6) | **0/180 = 0.0%** |

⚠ The `income` category is not only the parent's wage: `addEvent` books the parents' contribution,
the kit deal's quarterly retainer, appearance fees, result bonuses and entry refunds under the same
label. The parent wage dominates it ($245/$425/$750 a week by background, compounding 5-10% a season
over up to 24 seasons) but the line cannot be split further from the ledger's own taxonomy, so
"80.4% is the parent" is an upper bound rather than an exact reading.

**This is very probably the intuition behind the owner's question.** The FAMILY is at 97.8% – a
median career ends $8,370 down on a total spend of $615,307, i.e. essentially level – and 37.8% of
families finish ahead. Nobody is ruined. What never happens is the tennis paying for itself: the
sport contributes 13.1% of the household's income over twenty-four years, and the parent contributes
the rest. That is a different sentence from "the family is bankrupt", and it is the one slot 6 is
about.

### 4.8 The #45 check

| | |
| --- | --- |
| careers whose peak professional rank landed in **#30-60** | **0 / 180** |
| best peak rank anywhere | **#237** (`bench-middle-3`, "her words" arm) |
| peak-rank distribution | best #237 · p10 #300 · **median #357** · worst #365 |
| richest single SEASON anywhere | **$33,840** |
| richest whole CAREER anywhere | **$391,700** |

**The reference figure.** `docs/research/02-tennis-economics.md` does not carry a rank-to-money table,
so two anchors, one sourced and one mine:

* **Sourced, and it is enough on its own.** The research doc gives a Grand Slam first-round loser
  **$80-110k** (US Open 2025: $110k) and touring costs of **$53-105k/yr**. A player ranked around #45
  is inside direct acceptance at all four majors. **Losing the first round of all four majors and
  playing nothing else all year pays $320,000-440,000 against a $53,000-105,000 cost base.** By the
  research this repo already holds, a #45 is cash-positive on the majors alone, three to eight times
  over, before a single other tournament.
* **My own reference figure, flagged as not from the repo's corpus:** a WTA player finishing a season
  around #45 earns on the order of **$700k-1M** in prize money in the 2023-2025 era. Basis: the WTA
  season prize-money list, where roughly #50 sits near $800k. Treat it as an order of magnitude.

**The gap.** Our richest SEASON anywhere in 180 careers is **$33,840**, and our richest whole CAREER
is **$391,700**. Against $700k-1M for one season at #45 that is a factor of **21-30 on the season**,
and one real #45 season out-earns our best twenty-four-year career about twice over.

**And the cliff seen from the other side:** one first-round loss at our own Grand Slam pays
**$190,000**, which is 1.9x the mean career prize money in this population and about half the richest
career ever measured in it. One losing week at a rung nobody can enter is worth more than most whole
careers at the rungs everybody plays. The table is not too small. It is unreachable.

**Attribution, against the four candidates the brief names:**

| | candidate | verdict |
| --- | --- | --- |
| (a) | the rungs she enters | **yes, as the mechanism.** 51.8% of entries pay nothing; 97.9% of all prize comes from three rungs whose titles are $5,000-$9,000 |
| (b) | the 32-draw compression at slam/1000 | **no, and it points the other way.** See below |
| (c) | the table itself | **no.** w15's $2,200 title matches the research's "$2-3k"; the tables she plays are calibrated. The tables that are generous are the ones she never sees |
| (d) | she never gets there | **yes – this is the cause.** Best peak #237 against acceptance cuts of #250 / #200 / #120 / #104 / #65. Section 6a is the confirmation from the other direction: change nothing but how the calendar is played, the peak moves to #130, and the money follows it |

⚠ **Two corrections to the framing the brief carried, both verified in code.**

1. **Our Slam's first-round loss pays $190,000, not $31,000.** `$31,000` is `wta1000.prizeCents[5]`.
   On a 32-draw `rounds = log2(32) = 5` and `finishes[loser] = rounds - round`, so index 5 is a
   first-round loss (`finishLabel(5)` = "Round of 32") and index 4 is a round-of-16 exit. Slam pays
   **$190,000** and **$330,000** for those two.
2. **The 32-draw does not compress the money.** The points row is normalised to 32 main-draw rows
   (the research table's own first line) and the cheques were stepped against those same rows, so our
   "first round" IS a real R32 exit – which the real majors pay roughly $240k for. Our $190,000 sits
   in the right order of magnitude for the round it represents. The 32-draw costs field depth and
   points realism, which `slam.drawSize`'s own note already measures; it does not cost prize money.
   And it is moot here, because 0 of 180 careers enter a Slam at any draw size.

---

## 5. So where is the wall, exactly?

It is an **acceptance-rank** wall, and it is upstream of every money question.

| rung | accepts to | grinder: 43/180 reach w100, best peak #237 | player: best peak #130 |
| --- | --- | --- | --- |
| w100 | #350 | yes – 43/180 careers, 0.9 entries each | yes – 89/180, 6.2 entries |
| wta125 | #250 | barely – **2/180** | yes – **24/180** |
| wta250 | #200 | **never – 0/180** | yes – **3/180**, and net **+$276** |
| wta500 | #120 | **never – 0/180** | **never – 0/180** |
| slam | #104 | **never – 0/180** | **never – 0/180** |
| wta1000 | #65 | **never – 0/180** | **never – 0/180** |

Rank comes from WTA points on a best-16 window, and the rungs she can reach pay 20 / 50 / 75 / 100
points for a title. The merged W table carries the real points-to-rank curve (#10 ≈ 4,000 · #50 ≈
1,400 · #100 ≈ 850 · #300 ≈ 190), so entering a WTA 500 needs roughly 700-800 points held at once –
close to a perfect best-16 of w100 titles, at a rung of which the calendar carries three a season.
`act2-pro-tour.md` already states the arithmetic ceiling of the reachable ladder as **1,500 points ≈
real #45**; what this bench adds is that the ceiling is a perfect season and the **median career
lands at #357**, one place below the entire derived professional field.

The same wall gates sponsorship. The kit ladder is `national` at WTA ≤ 350, `tour` ≤ 200, `premium` ≤
50, `icon` ≤ 10 – so a median career clears only the bottom rung, and the retainer, appearance-fee
and result-bonus income lines that start at `tour` are behind the same door as the prize money.
Sponsor income measures **1.9%** of household income; that is not a tuning of the sponsor table, it
is the rank wall again.

---

## 6. What would have to change for a #45 to be cash-positive

Candidate levers with the measured size of each, largest effect first. **None of these is proposed
here** – this section exists so the owner can choose against numbers instead of intuitions.

⚠ **They do not add up, and L1 is mostly inside L2.** The player policy's $5,000 reserve is itself
what takes bankruptcy from 62/180 to 38/180, so L1's +8.6pp and L2's +7.6pp overlap heavily; L2's
measured 20.0% is the combined effect, not L2 alone on top of L1. Treat the column as "how big is
this handle", never as a sum.

| # | lever | measured size | note |
| --- | --- | --- | --- |
| **L1** | **Survive the early economy.** 62/180 careers end in bankruptcy at sixteen with a 0.4% ratio. Remove them and the headline moves from 12.4% to roughly **21%** – the three surviving ending groups sit at 18.8%, 21.7% and 22.1% | **≈ +8.6pp**, the largest single lever on the published number | Arithmetic from section 4.3's group medians, not a re-measurement. An economy question, not a prize question – and it still does not reach 100% |
| **L2** | **Rest floor / entry policy.** Refuse to enter below condition 70, keep a $5,000 reserve. Measured in section 6a: headline 12.4% to **20.0%**, best peak rank #237 to **#130**, and the first cash-positive tennis seasons the game has ever produced | **+7.6pp, and it is the only lever that moves the RANK** | Changes no constant. This is a player behaviour, so today it is a UI and feedback problem, not a balance one |
| **L3** | **Cut travel.** 59.0% of the denominator. Halving it shrinks every career's spend by 29.5%, so each ratio rises by 1/(1-0.295) = 1.42x: 12.4% to **~17.6%** | **≈ +5.2pp** | Does not touch the numerator or the rank wall |
| **L4** | **Delete the non-paying entries.** 51.8% of entries, $99,994/career = 16.3% of spend, so ratios rise 1.19x: 12.4% to **~14.8%** | **≈ +2.4pp** | Impossible in full – it is the junior ladder and the anti-boredom rule. But the domestic re-opening at eighteen (section 4.5) is a genuine, separable candidate |
| **L5** | **Widen the numerator.** Add sponsor money: it is 14.8% of mean prize, so ratios rise 1.15x: 12.4% to **~14.2%** (on the means, 16.1% to 18.5%) | **≈ +1.8pp** | A definition change to album slot 6, not a balance change – and `milestones.ts` states the reason it is excluded |
| **L6** | **Lower the acceptance cuts on the top four rungs.** To put a MEDIAN career (#357) inside a WTA 500 the cut would have to move #120 to ~#360 | not a tune | That is abolishing the acceptance list, and the cuts are the real tour's own numbers |
| **L7** | **Raise the tables she actually plays.** w35/w50/w75 carry 97.9% of all prize, so tripling those three multiplies the numerator by 2.96x: 12.4% to roughly **37%** | **≈ +24pp** | Would break calibration: the research puts a real W15 title at $2-3k and ours is $2,200. And a 3x on the rungs she plays still leaves her at a third of break-even |
| **L8** | **Let her reach a major.** One first-round loss at a Slam is $190,000 – 1.9x the mean CAREER prize money in this population | one week ≈ two careers | The cliff is the design (`docs/research/02-tennis-economics.md`). Access is the lever, and access is L1+L2 |

**The shape of the answer.** No lever on the money side gets a career past ~37%, and each one costs
calibration the research already fixed. Every lever that matters is on the **rank** side, because the
prize curve is exponential in rank and her rank is flat. **L2 is the proof**: one behaviour change,
no constant edited, moved the best peak rank 107 places and produced the first cash-positive tennis
season this game has ever measured. If the owner wants a #45 to run a cash-positive year, what has to
change is not the prize table – it is the number of careers that get near #45 at all, which under the
grinder is zero of 180 and under a managed calendar is three of 180 at #101-200.

### 6a. L2 measured – the same 180 careers under the "player" policy

`npm run bench:money -- --policy player`. Identical seeds, identical presets, identical retirement
answers; the only difference is `POLICIES[1]` from `tools/econ-bench.ts`: keep a **$5,000 reserve**,
**refuse to enter below condition 70**, and take the coach to tournaments. Nothing in the engine
changed – this is the same game played differently.

| | grinder (the published population) | player | |
| --- | --- | --- | --- |
| prize / spend, median | 12.4% | **20.0%** | +7.6pp |
| mean · best | 12.1% · 37.4% | **18.4% · 50.7%** | |
| ever paid a cheque | 122/180 | **140/180** | +18 careers |
| bankruptcy | 62/180 | **38/180** | -24 careers |
| **best peak rank anywhere** | **#237** | **#130** | **107 places** |
| median peak rank | #357 | **#316** | 41 places |
| careers that enter a WTA 125 | 2/180 | **24/180** | x12 |
| careers that enter a WTA 250 | **0/180** | **3/180** | first ever |
| careers that enter a 500 / 1000 / Slam | 0/180 | **0/180** | still never |
| careers peaking in **#101-200** | **0** | **3** | first ever |
| ...their PEAK SEASON, prize vs spend | – | **$57,550 vs $57,126 = 100.7%** | **cash-positive** |
| career-seasons where prize beat that season's spend | **0 / 2,422** | **6 / 2,821** | first ever |
| richest single season | $33,840 | **$65,350** | x1.9 |
| richest whole career | $391,700 | **$627,650** | x1.6 |
| family ahead at the end | 68/180 = 37.8% | **110/180 = 61.1%** | |
| family's net over the career, median | **-$8,370** | **+$31,236** | |
| the CUMULATIVE tennis crossing | **0/180** | **0/180** | unchanged |

**Four things worth saying about this table.**

1. **The key row the owner asked for exists here.** Three careers peak inside #101-200, and their
   peak season runs **prize $57,550 against spend $57,126 – 100.7%**. A career that gets high enough
   DOES run a cash-positive tennis year, junior debt ignored, exactly as he expected. It is three
   careers of 180, one rank band short of #45, and it required no balance change at all.
2. **The lever works on the NUMERATOR, not the denominator.** Whole-career spend goes UP under the
   player policy ($766,044 against $615,307 mean, because she survives longer and the coach now
   travels). Mean career prize goes from $98,925 to **$167,271, +69%**. Playing less earns more,
   which is `rank-plateau.md` section 5 arriving in the money ledger: fewer entries at higher
   condition means more counting results, more points, a better rank, and a better rank is the only
   key to every gate above w100.
3. **The first net-positive rung this game has ever had.** Under the player policy `wta250` returns
   **+$276 per career** against its own entry fees and trips – every other rung, at both policies, is
   still net-negative. Access to one rung above w100 is the whole difference between a ladder that
   loses money everywhere and a ladder with a top to it.
4. **The cumulative crossing is still 0/180.** Twenty years of junior and professional investment is
   not repayable out of prize money at any policy the bench can express. Album slot 6's empty face
   stays the common case, and its copy does not need revisiting.

⚠ **n = 3 is three careers, not a rate.** The 100.7% row is the strongest single number in this
document and it rests on three seeds. It says the mechanism exists and is reachable; it does not say
how often. Re-running the player arm at `--seeds 30` is what would turn it into a rate, and that is
the natural next measurement if the owner wants to act on it.

---

## 7. What this probe did not do

No engine constant was changed. No guard test was edited. `tools/money-decomposition.ts` and the
`bench:money` script are the only code that shipped, and the tool imports the engine read-only, in
the same way `tools/econ-bench.ts` and `tools/endings-bench.ts` do.
