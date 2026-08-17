---
type: spec
status: draft
area: engine/balance
canonical: false
last-reviewed: 2026-08-17
---

# Round 21, the measured half – seven owner questions, answered with numbers (17.08.2026)

**NOTHING HERE IS SHIPPED AND NO BALANCE CONSTANT MOVED.** This is an audit. Every finding below is a
measurement; where one is a defect the knob is named and sized and left alone, which is the brief's
own instruction. Five tools ship (§8); the engine is untouched.

⚠ **The owner's save was read locally and is neither committed nor turned into a fixture**, the same
rule `tools/round17-read.ts` and `tools/round18-read.ts` carry.

---

## 0. THE ANSWERS, IN ONE BOX

| # | his question | verdict | the number |
| --- | --- | --- | --- |
| **3** | Ines' last two seasons – is this right for her level? | **not a defect, and she is UNDER-ranked** | her core **57.1** against a mean **50.4** for the band #101-#150 she stands in |
| **3'** | no QF at a big event in two seasons – ok for her build? | **not a defect – the unlucky fifth of a fair distribution** | the model gives her **15.0%** per WTA 250 and **13.0%** per WTA 500; over her 14 big events **P(no QF) = 20.5%** |
| **3''** | ⚠ *asked for, and found*: a field-strength asymmetry at the big rungs | **real, and it is NOT the seeding** | the WTA **250, 500 and 1000 draw fields of the same strength** (core 68.4 / 68.9 / 68.4), so a 250 pays her **20.1** expected points – the worst rung in the game |
| **4** | an 18-year-old at #2 – how is that possible? | **not a defect – the head is OLDER than the field, not younger** | teens are **11.38%** of the field but **5.35%** of the top 50 and **1.25%** of #1s; a top-3 eighteen-year-old happens in **8.13%** of world-seasons |
| **7** | barred from the Slam at #116 – normal? | **the arithmetic is exact; the cost is a speed bump, not a wall** | 12 of 14 careers pass through #105-#128 and **12 of 12 cross #104** – median **19 weeks**; **0 of 14 stall** |
| **7'** | his proposal: fold the 16 qualifiers in, 104 → 120 | **it works, and it drags one number with it** | refusal falls **23.5 → 9 weeks**; but at 120 a Slam shares a door with the WTA 500 (`acceptsRank` already 120) |
| **8** | "college beats the tour" – but the tour can make 1-2M | **he is right and the failing was mine** | the tour passes college at the **74th percentile**; **30%** of careers do better on tour; tour max **$5,573,608** against college max **$260,410** |
| **8'** | ...and what a non-American pays | ⭐ **"college beats the tour" is an AMERICAN sentence** | **$80,090** over four years against $25,592, 0 free rides of 53 – and the paired median **flips to −$8,070**, with **51%** better off on tour |
| **9** | is a 1,600 world big enough? | **the table is the right size; the CHAIRS are not** | 1,600 pointed rows against a real list of ~1,550 – but **2.12** W main-draw chairs per professional per season against a real ~20 events a year |

⭐⭐ **AND ONE DEFECT FOUND THAT HE DID NOT ASK ABOUT, which is probably the source of "что-то не то":
the season-history rank he has been reading is not a ranking.** His 87 → 79 → 81 is the head of the
junior zero-tie; her real professional line is **#91 → #151 → #86 → #86 → #121** – and it is already
in the save. **A reader bug, not a schema one.** §2.

---

## 1. ⭐ Q3 – WHERE HER WINS COME FROM

`npx vite-node tools/two-seasons-read.ts -- --save <his>.tsave`

### 1a. The build, and the band she stands in

| | serve | ret | composure | stamina | groundstrokes |
| --- | --- | --- | --- | --- | --- |
| now | 52.6 | 67.4 | 49.7 | 59.0 | 69.6 |
| potential | 53.4 | 69.8 | 50.8 | 59.9 | 71.3 |
| headroom | 0.8 | 2.5 | 1.2 | 0.9 | 1.7 |

Her **core** – the mean of the four the field's storeys are drawn in – is **57.1**, and at full
potential it would be 58.5. She is finished growing, which he had already read correctly.

**The table she is standing in, re-derived exactly** (the field is a pure function of seed and season,
so this is her world and not a model of it):

| band | n | mean core | mean age | mean points |
| --- | --- | --- | --- | --- |
| #1-#50 | 50 | 72.0 | 24.9 | 2455 |
| #51-#100 | 50 | 62.3 | 22.0 | 1089 |
| **#101-#150 (hers)** | 49 | **50.4** | 23.3 | 659 |
| #151-#250 | 100 | 45.7 | 23.2 | 361 |

⭐ **She out-cores her own band by 6.7 points and is closer to the #51-#100 band's floor.** Whatever
is happening, she is not over-ranked. The direction of his worry is inverted.

### 1b. The rungs her rank opens – and the one place she misses by one

At **WTA #121** every rung up to and including the WTA 250 is open. Above that:

| rung | accepts | verdict |
| --- | --- | --- |
| WTA 500 | top 120 | **shut – by ONE place** |
| WTA 1000 | top 65 | shut by 56 |
| Grand Slam | top 104 | shut by 17 |

### 1c. Season 8, per rung – and it is the opposite shape from the one he feared

"Won a lot, ranked lower" is the shape of winning at rungs that pay nothing. **It is not what
happened.** She is being beaten at rungs far above her, not farming ones beneath her:

| rung | events | W | L | win% | points | titles | pts/event |
| --- | --- | --- | --- | --- | --- | --- | --- |
| w50 | 4 | 17 | 1 | **94%** | 161 | 3 | 40.3 |
| w75 | 3 | 7 | 2 | 78% | 93 | 1 | 31.0 |
| w100 | 2 | 5 | 2 | 71% | 65 | 0 | 32.5 |
| wta125 | 2 | 5 | 2 | 71% | 96 | 0 | 48.0 |
| wta250 | 1 | 0 | 1 | 0% | 1 | 0 | 1.0 |
| **wta500** | **10** | **3** | **10** | **23%** | 187 | 0 | 18.7 |
| slam | 3 | 1 | 3 | 25% | 90 | 0 | 30.0 |
| **TOTAL** | **25** | **38** | **21** | **64%** | **693** | | |

⚠ The ledger is pruned to a rolling 52 weeks, so season 7 does not survive in this form and the table
above reaches back only to week 418. The derivation cross-checks against `seasonHistory` at 38-21
against 38-22 banked – one event fell outside the window, which is the prune and not an error.

⭐ **Thirteen of her twenty-five events – 52% of her calendar – were WTA 500s and Slams, where she
went 4-13.** Her ranking did not fall because she won cheap matches. It fell because she spent half a
season entering draws she loses, and a rolling best-18 window forgets what she banked the year before.

---

## 2. ⭐⭐ THE DEFECT HE DID NOT ASK ABOUT – the season rank he has been reading is not a ranking

He quoted his seasons to me as **"endRank 87 → 79 → 81"** and read them as a career holding station
near #80 while something invisible went wrong. **Those three numbers are not her ranking.**

| table | her points | the raw rank field | is it a rank? |
| --- | --- | --- | --- |
| domestic | 0 | #88 | **NO – the zero-tie's place** |
| **itf** | **0** | **#81** | **NO – the zero-tie's place** |
| wta | 686 | #121 | yes |

`SeasonHistoryEntry.endRank` is written from `world.kidRank`, which is the **ITF** fold –
`protocol.ts` says so in its own comment. Her per-track rows show **itf 0 points, 0-0** for seasons
6, 7 and 8: she has not played a junior event since season 5. A dense rank over a table whose whole
tail ties on zero hands every member of that tie the head of the tie's place, which is exactly the
failure `kidLadderRank` carries a guard against – *"UNRANKED IS NOT A NUMBER"* – and the raw
`world.kidRank*` fields do not.

**So seasons 6, 7 and 8 report the position of the head of the junior zero-tie.**

### 2a. ⭐⭐ AND THE GOOD NEWS: THE RIGHT NUMBER IS ALREADY STORED – THIS IS NOT A SCHEMA BUG

`byTrack` has carried a per-track rank since **v46**, and it *already* obeys the "absent means NOT
RECORDED" rule – the ITF cell for seasons 6-8 is correctly empty. Her save, read straight:

| season | legacy `endRank` | domestic | itf | **wta (the real one)** |
| --- | --- | --- | --- | --- |
| 4 | #70 | – | #70 | **#91** |
| 5 | #63 | – | #63 | **#151** |
| **6** | **#87** | – | **– (no points)** | **#86** |
| **7** | **#79** | – | **– (no points)** | **#86** |
| **8** | **#81** | – | **– (no points)** | **#121** |

⭐ **Her real professional line is #91 → #151 → #86 → #86 → #121, and it is in the save already.**

⚠ **It reaches a second surface, and that is where it bites.** `StatsScreen.vue` folds career-best
year-end rank out of the **legacy** field (`seasonHistory.map(h => h.endRank).filter(r => r > 0)`).
Measured on his save, the two folds disagree:

| career best, folded from | result |
| --- | --- |
| `byTrack.wta.endRank` (correct) | **#86**, over 5 recorded seasons |
| the legacy `endRank` (what Stats shows today) | **#5** – a junior ranking from season 1 |

**THE KNOB, NAMED AND NOT PULLED – and it is smaller than I first wrote.** No schema bump, no
migration, no golden fixture: **the data exists.** The fix is a reader change:

1. **`StatsScreen.vue`'s career-best fold** should prefer `byTrack[track].endRank` and fall back to
   the legacy `endRank` only for pre-v46 rows (seasons 0-3 here), which is exactly the shape
   `SeasonHistoryTable.vue` already uses.
2. **Optionally**, stop writing the legacy field when no points stand behind it. ⚠ *That* half would
   be schema-visible and is the only part that owes the three-part move – and it is not needed to fix
   what he is seeing.

⚠ **A pre-v46 row cannot be repaired either way**: `pruneResults` deleted the results those seasons
were folded from years ago, so seasons 0-3 keep whatever they were written with.

---

## 3. ⭐⭐ Q3' – W100 AND ABOVE, AND THE QF DROUGHT

**Verbatim:** «она за 2 последних сезона даже до QF нигде на больших турнирах ни разу не дошла.»

`npx vite-node tools/big-rung-odds.ts -- --save <his>.tsave --runs 300 --band 12`

### 3a. ⚠ The seeding input was checked FIRST, because round-21 #4 was exactly this shape

`b790ea0` (15.08) fixed a bug in which she entered every draw as the lowest-ranked player, because
`kidSeedIndexIn` was handed a table she is deliberately folded out of. ⚠ **The fix is on this wave
branch and has NOT merged to `main`**, so unless he is playing a build cut from this branch his two
seasons carry the bug – which makes the contamination question load-bearing rather than academic.
**The measurement below settles it either way**, which is why it is asked before anything else.

| rung | seeds | her seed index (fixed) | seeded? | pre-fix index | pre-fix seeded? |
| --- | --- | --- | --- | --- | --- |
| w50 | 8 | 0 | **YES** | 32 | no |
| w75 | 8 | 0 | **YES** | 32 | no |
| w100 | 8 | 4 | **YES** | 32 | no |
| wta125 | 8 | 32 | no | 32 | no |
| wta250 | 8 | 32 | no | 32 | no |
| wta500 | 8 | 32 | no | 32 | no |
| wta1000 | 16 | 64 | no | 64 | no |
| slam | 32 | 104 | no | 128 | no |

⭐⭐ **The bug cost her seeding at W50, W75 and W100 and NOWHERE ELSE.** At WTA 125 and above she is
unseeded either way, because at #121 she genuinely is. **So the record he is asking about – the big
rungs – is clean evidence, and the two rungs the bug hurt are the two she already dominates.**

### 3b. What the model itself predicts for her build

300 bracket replays per rung, her real build in the real field the engine draws, on scratch
sub-streams:

| rung | P(QF+) | P(SF+) | P(title) | expected pts | modal finish | field core | % of field stronger |
| --- | --- | --- | --- | --- | --- | --- | --- |
| w50 | 80.7% | 69.0% | 40.0% | 29.7 | CHAMPION | 44.6 | 5% |
| w75 | 81.7% | 68.3% | 33.7% | 42.5 | CHAMPION | 46.5 | 7% |
| **w100** | **78.0%** | 64.7% | 39.3% | **57.7** | CHAMPION | 50.1 | 2% |
| wta125 | 49.0% | 33.3% | 10.3% | 35.5 | R16 | 55.0 | 32% |
| **wta250** | **15.0%** | 4.7% | 0.7% | **20.1** | R32 | 68.4 | **97%** |
| **wta500** | **13.0%** | 4.3% | 1.0% | 37.8 | R32 | 68.9 | **97%** |
| wta1000 | 5.0% | 1.3% | 0.3% | 47.9 | R64 | 68.4 | 94% |
| slam | 1.0% | 0.3% | 0.0% | 55.9 | R128 | 63.2 | 68% |

⭐ **The model says a build like hers should lose in round two at a 250 or a 500 – 97% of that field
is stronger than she is.** A quarter-final there is a 13-15% event, not an expectation.

### 3c. So is the drought fair? – yes, and it is a one-in-five

Her big events over the two seasons: **10 WTA 500 + 3 Slam + 1 WTA 250 = 14**.

> P(no QF) = 0.870¹⁰ × 0.990³ × 0.850 = **20.5%**

⭐ **A player with her build entering that schedule reaches no quarter-final in roughly one run in
five.** That is an unlucky season, not a broken probability. ⚠ **And it would have been a defect if
the answer had come out the other way** – the same table says she should reach a W100 quarter-final
78% of the time, and she did (a W75 title, a WTA 125 final, a W100 semi, all inside season 8).

### 3d. Is she alone? – no: she is five to eight times better than her band

The same replay, run for twelve professionals actually standing at #96-#146:

| | mean core | P(QF+) w100 | P(QF+) wta125 | P(QF+) wta250 | P(QF+) wta500 |
| --- | --- | --- | --- | --- | --- |
| **band mean (n=12)** | 52.9 | 32.8% | 26.8% | **2.6%** | **1.7%** |
| **Ines** | **57.1** | **78.0%** | 49.0% | **15.0%** | **13.0%** |

⭐⭐ **She is 5.8× the band at a WTA 250 and 7.6× at a WTA 500.** The distribution is the answer, and
she is at the good end of it. **Not a defect, and no probability is wrong.**

### 3e. ⚠ THE ONE THING WORTH TELLING HIM ANYWAY – his schedule is upside down

Expected points per event, read straight off §3b, for the rungs he can enter:

| w50 | w75 | **w100** | wta125 | **wta250** | wta500 | wta1000 | slam |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 29.7 | 42.5 | **57.7** | 35.5 | **20.1** | 37.8 | 47.9 | 55.9 |

⭐ **The W100 is her best rung in the game at 57.7 points an event, and she played TWO of them
against ten WTA 500s at 37.8.** ⚠ **And the WTA 250 is the worst thing she can enter at 20.1 – below
even a W50** – because its board pays 1 for a first-round loss and she takes one 60% of the time.
**That is a player-facing insight and not an engine change**: nothing here is mispriced, but the
Season screen has no surface that says it.

### 3f. ⚠⚠ THE STRUCTURAL ASYMMETRY I WAS ASKED TO WATCH FOR – IT IS REAL, AND IT IS NOT THE SEEDING

The instruction was to check for *"a seeding or field-strength asymmetry at the big rungs"*. The
seeding half is clean (§3a). **The field-strength half is not**, and §3b's own two right-hand columns
are the evidence:

| rung | field core | % of field stronger than her | band opens at | title pays |
| --- | --- | --- | --- | --- |
| wta125 | 55.0 | 32% | #79 | 125 |
| **wta250** | **68.4** | **97%** | **#32** | 250 |
| **wta500** | **68.9** | **97%** | #22 | 500 |
| **wta1000** | **68.4** | **94%** | #11 | 1000 |
| slam | 63.2 | 68% | #1 | 2000 |

⚠ **"% stronger" is a core-of-FOUR comparison and slightly overstates her disadvantage**, because
`core` excludes groundstrokes and hers (69.6) is far above her own core while a pro's tracks hers by
construction (`rivalGroundstrokes` derives it from serve and return). **It is a descriptive column
only** – the P(QF+) numbers beside it come from the real match engine on her real five-attribute
build, so the outcome figures are unaffected.

⭐⭐ **The WTA 250, 500 and 1000 draw fields of the SAME strength to within half a core point.** The
Grand Slam draws a *weaker* one, because its band reaches to #333 across a 128-draw. And the step from
the WTA 125 to the WTA 250 is **13.4 core points and 32% → 97%** – by far the biggest cliff on the
ladder, at the rung whose acceptance line (#200) lets her walk in.

⚠ **This is the same defect SHAPE `fieldPros.ts` records for the old top three rungs** – *"The top
THREE rungs draw the SAME field, to one decimal place, because entry is position-biased and all three
windows open at the same head of a table whose head is one thirty-strong storey."* That was fixed by
adding a storey above them; the bands themselves were never re-spaced at the top, and the openings are
now **#32 · #22 · #11** – three windows onto the same head.

**AND THE SPORT RUNS THE OTHER WAY.** `docs/research/ranking-points-by-tier.md` §4c-C reads the WTA's
own published rule: players ranked 1-20 may not play a WTA 125 in most weeks and *"up to 4 players
ranked 21-50 may only play via Wild Card"* (2026 WTA Rulebook III.C.2.b); the ITF's Play Down rules bar
the world top 50 from every W-series event. The research doc's own summary is **"Reality gates the
strong OUT; we gate the weak IN."** We ship half of that: `playDownBars` gates HER out of rungs she
has outgrown (`docs/specs/play-down-2026-08.md`), but **nothing keeps the field's top 40 out of a
WTA 250**, so a #121 player meets a 1000-strength field for 250-level points.

**THE CONSEQUENCE, IN ONE NUMBER:** the WTA 250 is worth **20.1 expected points an event to her – the
worst rung in the game, below a W50's 29.7** – because she is meeting the field of a rung four times
its size.

**THE KNOB, NAMED AND NOT PULLED**, two candidates:

1. **Re-space the top bands.** `wta250.entrantPctBand[0]` is **0.018** against `wta500`'s 0.012 and
   `wta1000`'s 0.006 – the three openings are 21 places apart on a 1,799-row table. Moving the 250's
   opening down is the smallest possible change and needs no new mechanic.
2. **Give the field a play-down ceiling.** The rule already exists for her; extending it to the
   entrant pool is the version reality actually runs, and it is the one the research supports.

⚠ **BOTH ARE BALANCE CHANGES AND NEITHER IS TAKEN HERE.** Option 1 moves who plays every event at three
rungs; option 2 is a new gate on `selectEntrants` and would need its own bench. **This is reported
because the brief asked me to look for it and it is there** – but her own results are still inside
the distribution this world produces (§3c), so it is a WORLD-SHAPE question and not the answer to
"why no quarter-final".

---

## 4. Q4 – AN EIGHTEEN-YEAR-OLD AT #2

`npx vite-node tools/teen-at-the-top.ts -- --seeds 40 --seasons 12 --seed <his> --season 8`

### 4a. She is real, and here is the mechanism on his own world

| rank | id | age | pts | core | arc | **base (pts ÷ arc)** |
| --- | --- | --- | --- | --- | --- | --- |
| #1 | fp-52 | 28 | 9280 | 77.7 | 1.000 | 9280 |
| **#2** | **fp-3 Tara Toma** | **18** | **7684** | 76.3 | **0.767** | **10023** |
| #3 | fp-14 | 34 | 6439 | 78.4 | 0.550 | 11707 |

⭐ **Read the last two columns together and the whole mechanism is there.** Her chair drew a
near-maximum core, so it is a top-3 chair whoever sits in it; the career arc then discounts her to
76.7% because she is 18. **The 34-year-old at #3 is carrying the biggest book in the world (11707)
discounted to 55%.** Age is doing exactly what the model says it does.

### 4b. The rate, over 480 independent world-seasons

| | aged ≤ 18 | aged ≤ 19 |
| --- | --- | --- |
| world-seasons whose **#1** is a teen | **1.25%** | 3.33% |
| ...with a teen in the **top 3** | **8.13%** | 21.67% |
| ...with a teen in the top 10 | 54.79% | 80.00% |
| ...with a teen in the top 50 | 93.54% | 99.58% |

### 4c. ⭐⭐ AND THE BASE RATE THAT SETTLES IT – the head is OLDER than the field

| population | n | mean age | ≤ 18 | ≤ 19 |
| --- | --- | --- | --- | --- |
| the whole field (1,600 chairs) | 768,000 | 23.72 | **11.38%** | 19.05% |
| the top 50 | 24,000 | 24.15 | **5.35%** | 9.83% |
| the top 10 | 4,800 | 23.95 | 7.52% | 14.38% |
| the #1 chair | 480 | 24.40 | **1.25%** | 3.33% |

⭐⭐ **A teenager is 11.4% of the world and 5.4% of the top 50. The career arc is a DISCOUNT and it is
working: youth is punished at the head, not rewarded.** The hypothesis in his question – that the
model over-rewards youth – is refuted by its own base rate.

**Against the sport**: `docs/research/real-ladder-pace.md` §1c records the sourced fast tail –
Andreeva career-high **#5 at 18y76d**, Sharapova **#1 at 18y125d** – and notes that seven of the nine
youngest top-10 entries ever predate the 1995 Age Eligibility Rule, i.e. the young tail was
deliberately truncated and is now rare rather than impossible. A top-3 eighteen-year-old once every
**12.3 seasons** is the same order as the post-AER game. ⚠ **The top-TEN band runs richer than
reality** – an under-19 in the top 10 in 54.8% of our seasons is more often than the modern sport
manages – which is a fat tail rather than broken arithmetic, and §4d prices it.

### 4d. The knob, named and sized – `FIELD.ageRampFloor`

The arc's floor is **0.65**: a debutante does not climb into a chair, she **inherits** it at 65% of
its value. Re-scoring the same 768,000 rows under alternative floors (a predicate over measured rows,
never an engine re-run):

| `ageRampFloor` | arc@16 | arc@18 | teen in top 3 | in top 10 | mean teens in top 50 | **population mean multiplier** | drift |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **0.65 (shipped)** | 0.65 | 0.77 | **8.13%** | 54.79% | 2.68 | 0.9131 | – |
| 0.50 | 0.50 | 0.67 | 4.38% | 45.00% | 2.27 | 0.8883 | **-2.71%** |
| 0.35 | 0.35 | 0.57 | 1.88% | 30.21% | 1.88 | 0.8636 | **-5.43%** |
| 0.20 | 0.20 | 0.47 | 0.42% | 18.33% | 1.44 | 0.8388 | -8.14% |
| 0.00 | 0.00 | 0.33 | 0.00% | 4.58% | 0.80 | 0.8057 | -11.76% |

⚠⚠ **THE FLOOR IS NOT A FREE KNOB, AND THIS IS WHY IT IS REPORTED RATHER THAN PULLED.** `FIELD.career`
records that these numbers were tuned to hold the population's mean multiplier at **0.9067** so that
the merged table's points-to-rank curve – **the one calibrated thing in that file** – does not move.
Halving the teen rate costs 5.43% of the whole tour's book and re-opens every acceptance cut. **A
change here owes a `bench:world --arc-probe` re-run and is a re-balance, not a fix.**

**VERDICT: not a defect.** The shape is the sport's, the rate at the very top matches it, and the one
place ours runs rich is bought at a price the owner should decide on rather than an agent.

---

## 5. Q7 – THE SLAM DOOR AT #104

`npx vite-node tools/slam-door-cost.ts -- --seeds 14 --seasons 12`

### 5a. The arithmetic is exact, and both his numbers are right

`TIERS.slam.acceptsRank` is **104**; `TIERS.slam.drawSize` is **128**. They are not the same number
and neither is wrong. `docs/research/ranking-points-by-tier.md` §4-D reads the 2026 Grand Slam Rule
Book: **128 = 104 direct acceptances + 16 qualifiers + 8 wild cards**, with observed cut-offs at
Australian Open 2026 **#103** and US Open 2026 **#102**. **We model the direct-acceptance line
exactly and model neither of the other two routes**, so ranks **#105-#128 – 24 places – are refused
where reality gives them a way in.**

**What else that band is outside of**: the WTA 500 accepts the top 120, so #105-#120 keep it and
#121-#128 lose that too; the WTA 1000's #65 is shut to the whole band. Everything at WTA 250 and
below stays open.

### 5b. What the missing places cost – measured

⚠ **THE ARM MATTERS AND THE FIRST RUN PROVED IT.** `tools/ladder-walk.ts`'s policy – "the strongest
rung the engine accepts this week" – put **0 of 14 careers inside the band in twelve seasons**, best
rank #199, because the median career won **50-80 Local Opens**: a domestic event burns the week, so
the policy spends the professional calendar on a table that pays into `domestic`. That is the
already-recorded bench/play divergence (`docs/specs/real-vs-bench-2026-08.md` §3.1) arriving as an
instrument artefact, and it is why this tool ships a `--pro-first` arm and reads its numbers from it.

On the professional-calendar arm, 14 careers × 12 seasons:

| | |
| --- | --- |
| careers reaching the band or better | **12 / 14** |
| ...that ever held a rank inside #105-#128 | **12 / 12** |
| ...that later crossed #104 | **12 / 12** |
| ⭐ careers whose **career best** is inside the band (stalled) | **0 / 14** |
| weeks held inside the band | median **23.5**, max 103 |
| weeks from entering the band to crossing #104 | median **19**, max 108 |

⭐ **Nobody stalls behind the door. It costs a median of nineteen weeks.**

⚠⚠ **AND THE HONEST LIMIT OF THAT CLAIM.** This arm is deliberately the strong tail – wealthy family,
elite coach, p99 potential, money that never binds – because a median career never gets near #128 and
measuring a door nobody knocks on reports a zero that means "nobody came". **His own Ines is the
other case**: she is #121 with her growth finished (§1a), so for her the band is where the career
ends – but that is the skill ceiling, not the door. The two careers of the fourteen that never
reached the band never earned a professional point at all.

### 5c. ⭐ HIS PROPOSAL – 104 → 120, evaluated

> «раз у нас нет квалы, может быть просто тогда брать "+16 из таблицы"? а 8 wild card как раз можно
> как-то отмечать тоже и на карточку турнира тогда пометку ставить "wild card"»

**It is defensible on its face and the reasoning is sound**: real qualifiers come overwhelmingly from
just below the cut, so "the top 120 by ranking" is a fair model of *direct + qualified*. It closes
16 of the 24 places and leaves the 8 wild cards genuinely unmodelled, which is honest.

⚠⚠ **THE ONE NUMBER IT DRAGS WITH IT, and it is arithmetic rather than taste: `TIERS.wta500.acceptsRank`
is already 120.** At 120 the ladder's top three cuts read **WTA 1000 #65 · Grand Slam #120 · WTA 500
#120** – the hardest draw in the game sharing a door with the rung two storeys below it. Not a reason
to refuse it; a second decision it forces.

⚠ **The rulebook itself offers a cheaper version of the same idea.** §4-D's table is prefaced
*"Unless otherwise agreed"* and permits **104/108/112** direct acceptances against **16/12/8**
qualifiers. **112 is inside the rulebook** and needs no argument at all; 120 is outside it and is a
modelling decision.

**The sweep, scored as a predicate over the same measured rank series** (nothing re-run under a
changed rule, so the rows survive him picking a different number):

| cut | what it models | careers refused | median weeks refused | max |
| --- | --- | --- | --- | --- |
| **#104** | direct acceptances only – **SHIPPED** | 12 / 14 | **23.5** | 103 |
| #112 | direct 112 / qual 8 – the rulebook's third config | 12 / 14 | **15.5** | 83 |
| **#120** | direct 104 + the 16 qualifiers – **HIS** | **10 / 14** | **9** | 53 |
| #128 | direct + qualifiers + wild cards | **0 / 14** | 0 | 0 |

⭐ **His 120 more than halves the refusal – 23.5 weeks to 9 – and takes two careers out of the band
entirely.** The rulebook-legal 112 buys about a third of that. Neither eliminates it, because the 8
wild cards stay unmodelled by construction: only #128 does, and #128 is "everybody in the draw size
gets in", which is not a door at all.

### 5d. ⭐⭐ AND WHAT THE SAME ARGUMENT IMPLIES FOR EVERY OTHER RUNG – he should be told, not discover it

A Slam is not the only draw with qualifying. Research §4c-B prints the published composition of a
32-draw W event: **direct acceptances 13-17 (W15) / 16-20 (W35-W100), qualifiers 8, wild cards 4**,
plus 3 junior-reserved at W15. **A real W75 admits only 16-20 of its 32 off the acceptance list and
our `selectEntrants` fills all 32 from one pool.**

⚠ **But "+16" does not transfer, because the W rungs have no threshold to add to.** §4-A reads the
2026 ITF WTT Regulations as **one "System of Merit" ordering with no cut anywhere in it** – an
unranked player is not refused a W75, she is placed at the *bottom of the acceptance list*. So at the
W rungs the honest version of his idea is **the soft tail**, which is the design he already deferred
on 16.08 (`docs/specs/the-acceptance-tail-2026-08.md`, «пусть остануться жесткие отсечки»). **The
Slam is the one rung where "+16" is even expressible, because it is the one rung whose regulation
states a count.**

### 5e. ⚠ The wild-card half is a real mechanic and is NOT designed here

It needs three rulings he has not been asked for: **who** gets one (host nation? a name the tour
wants? a returning mother?), **whether she** can ever receive one and on what evidence, and what the
card says. If it rolls at all it needs a purpose-scoped RNG sub-stream and never MAIN – input
independence is permanent law. **Flagged with its cost, not sketched.**

---

## 6. Q8 – COLLEGE VERSUS THE TOUR, WITH THE DISTRIBUTION THIS TIME

**HE IS RIGHT AND THE FAILING WAS MINE.** I reported college beating the tour by a median
($106,995 against $31,959 over four years) with no spread beside it – and a median is the one
statistic deliberately blind to the tail his question is about. His own Ines banks **$1.97M**.

`npx vite-node tools/college-price-probe.ts -- --seeds 6 --all`

### 6a. The distribution, n = 53 paired careers

| funds delta over 4y | min | p10 | p25 | **median** | p75 | p90 | **max** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **COLLEGE** | $45,855 | $74,898 | $87,823 | **$106,995** | $141,234 | $225,811 | **$260,410** |
| **ON TOUR** | -$29,830 | -$3,819 | $4,184 | **$31,959** | $169,294 | **$494,677** | **$5,573,608** |
| paired (col − tour) | -$5,475,503 | -$371,491 | -$13,716 | $72,363 | $106,734 | $208,358 | $275,574 |

⭐⭐ **THE TOUR ARM PASSES THE COLLEGE ARM AT THE 74TH PERCENTILE.** Below it college wins and wins
comfortably; above it the tour wins and then keeps going.

⭐ **30% of careers (16 of 53) banked more by staying on tour** – and that is the paired statistic,
same world, same week, forked.

**His "1-2 million", measured:**

| | over $500,000 | over $1,000,000 | over $2,000,000 |
| --- | --- | --- | --- |
| **on tour** | **5 / 53** | **3 / 53** | **2 / 53** |
| at college | 0 / 53 | 0 / 53 | 0 / 53 |

⭐ **Three careers in fifty-three clear a million in four years and the best banks $5.57M. The college
arm has no tail at all – its maximum is $260,410.** So "college beats the tour" is true of the
typical career and false of the good one, and only the distribution can say that.

⚠ **The row the old report printed was also a difference of MEDIANS, which is not the median of the
difference.** Both are now printed; the arms are paired, so the second is the honest per-career one.

### 6b. The bill – the arithmetic checks out

Quoted at the fork: median **$6,398 a year**, ×4 = **$25,592**, against the in-state sticker of
**$30,990 a year** (`COLLEGE_OFFER.costPerYearInStateCents`, sourced `[S]`, College Board Trends 2025).
So the family pays about **21%** of a four-year sticker of $123,960, and the rest is the athletic
award plus the need layer metered together at Bylaw 15.1's one ceiling. **The two halves he asked
about are exactly those**: merit-only award, means-tested layer, and the layer is US-only law
(34 CFR §668.33).

### 6c. ⭐⭐ AND THE NUMBER THAT WAS BURIED – what a NON-AMERICAN pays

§4.3 of `what-the-college-place-costs-2026-08.md` said "roughly $100,000" and called the bench blind
to it. **It is not blind to it – it is one line of exact arithmetic over rows already measured**, and
it now prints beside the American number instead of three sections below it.

**Why it is exact rather than a model:** `resolveCollegeBill` is `sticker × (1 − min(1, athletic +
need))`. The athletic award is **merit-only and physically cannot read `country`** –
`tests/college-offer.test.ts` block A proves it by sweep and by mutation – so every career's measured
athletic share is *already* the share a non-American gets. Only two inputs change and both are
sourced constants: the sticker moves in-state → out-of-state (a non-resident alien is never in-state
anywhere) and the need layer is zero (34 CFR §668.33).

| | AMERICAN | NON-AMERICAN | × |
| --- | --- | --- | --- |
| family pays / year | $6,398 | **$20,022** | **3.1** |
| **over 4 years** | **$25,592** | **$80,090** | |
| free rides | 11 / 53 | **0 / 53** | |

**Against what the four years actually bank.** ⚠⚠ **The first cut of this block got the arithmetic
wrong and the correction is worth recording**: it printed "college delta *less* the American bill",
which **double-charges** it – `resolveCollegeBill` debits tuition weekly through the tick, so the
measured `fundsDelta` is *already net of it*. The honest counterfactual adds the American bill back
before taking the other one off.

| | four-year funds delta (median) |
| --- | --- |
| college, American (as measured) | **$106,995** ← already net of the bill |
| ...before any tuition at all | $146,060 |
| **college, NON-AMERICAN** | **$67,078** |
| the tour arm's median, for comparison | $31,959 |

⭐⭐ **AND HERE THE TWO STATISTICS DISAGREE IN SIGN, WHICH IS THE WHOLE LESSON OF THIS SECTION:**

| college's advantage over the tour | AMERICAN | NON-AMERICAN |
| --- | --- | --- |
| marginal (difference of medians) | +$75,036 | **+$35,119** |
| **paired (median of the per-career difference)** | +$72,363 | **−$8,070** |
| careers that would do better ON TOUR | 16 / 53 (30%) | **27 / 53 (51%)** |

⭐⭐ **FOR A NON-AMERICAN THE MEDIAN CAREER IS BETTER OFF ON TOUR, and 51% of them are.** The
difference-of-medians still says college wins by $35,119; the paired statistic – the honest one for
two arms forked from one world – says it loses by $8,070. **"College beats the tour" is an American
sentence.**

⚠ **That is not a bug, it is the sourced law showing up in the outcome**: out-of-state tuition plus no
need layer. But it is reachable in ordinary play, because our onboarding lets the player choose a
country, and his own career is `IT`.

**And by background, the four-year bill:**

| background | n | athletic % | AMERICAN | NON-AMERICAN |
| --- | --- | --- | --- | --- |
| working | 18 | 55.4 | **$2,375** | **$95,240** |
| middle | 23 | 60.5 | $33,947 | $76,146 |
| wealthy | 12 | 70.9 | $39,806 | $65,405 |

⭐⭐ **The need layer is the whole of the difference for a working family, and it is US-only law. A
non-American working family pays $95,240 – MORE than a non-American wealthy one ($65,405) – because
merit is all they get and the wealthy family's better junior record earns a bigger award.** That is
the merit channel running unopposed once the need channel is switched off by nationality. Our game is
nation-agnostic with a player-chosen country at onboarding, so this is reachable in ordinary play.

⚠ **Flagged, not tuned.** Both stickers are primary-sourced and so is the absence of the need layer;
nothing here is ours to move without a ruling.

---

## 7. Q9 – IS A 1,600-STRONG WORLD BIG ENOUGH?

`npx vite-node tools/population-depth.ts -- --seeds 6 --season 8`

### 7a. The table is the right size, and that is not what the question is about

| | ours | reality |
| --- | --- | --- |
| professionals holding a ranking | **1,600** | ~1,550, list ends at **#1531** `[S]` |
| merged W table rows | 1,799 (field + 199 juniors) | – |

`docs/research/real-ladder-pace.md` §3b is the source and records that the real denominator has been
flat for over a decade. **1,600 is that number** and `docs/specs/population-1600-2026-08.md` is the
wave that put it there on that evidence.

### 7b. The depth tracks the real curve closely

| place | #1 | #10 | #50 | #100 | #150 | #300 | #500 | #700 | #1000 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **ours** | 10237 | 4311 | 1330 | 873 | 540 | 192 | 69 | 38 | 16 |
| real `[S]` | 10500 | 4000 | 1400 | 850 | 520 | 190 | 75 | 59 | 22 |

⚠ The real row is the anchor set already recorded in `fieldPros.ts`'s calibration box and in
research – quoted, never re-derived from our own runs. The fit is within a few per cent to #500 and
runs mean in the deep tail, which is where research already says our anchors were mean.

### 7c. ⭐ WHERE THE POPULATION RUNS OUT

Every rung's `entrantPctBand` is a share of the merged table, so against 1,799 rows:

| rung | band | opens at | floor at | draw | candidates |
| --- | --- | --- | --- | --- | --- |
| w15 | [0.22, 0.72] | #396 | **#1295** | 32 | 900 |
| w35 | [0.185, 0.62] | #333 | #1115 | 32 | 783 |
| w50 | [0.145, 0.52] | #261 | #936 | 32 | 675 |
| w75 | [0.105, 0.42] | #189 | #756 | 32 | 567 |
| w100 | [0.065, 0.33] | #117 | #594 | 32 | 477 |
| wta125 | [0.044, 0.26] | #79 | #468 | 32 | 389 |
| wta250 | [0.018, 0.24] | #32 | #432 | 32 | 400 |
| wta500 | [0.012, 0.22] | #22 | #396 | 32 | 374 |
| wta1000 | [0.006, 0.2] | #11 | #360 | 64 | 349 |
| slam | [0, 0.185] | #1 | #333 | 128 | 333 |

⭐ **The deepest band floor in the game is #1295 of 1,799, so 504 professionals – 28% of the table –
are in nobody's draw, ever.** That is the shipped design and `fieldPros.ts` states it in as many
words (*"pure TABLE DEPTH … not in anybody's draw"*). Widening the population adds more of them.

### 7d. ⭐⭐ THE ANSWER: THE SHORTAGE IS CHAIRS, NOT PEOPLE

| rung | events/season | draw | chairs/season | candidates | chairs per candidate |
| --- | --- | --- | --- | --- | --- |
| w15 | 25 | 32 | 800 | 900 | 0.89 |
| w35 | 16 | 32 | 512 | 783 | 0.65 |
| w50 | 12 | 32 | 384 | 675 | 0.57 |
| w75 | 8 | 32 | 256 | 567 | 0.45 |
| w100 | 4 | 32 | 128 | 477 | **0.27** |
| wta125 | 4 | 32 | 128 | 389 | 0.33 |
| wta250 | 8 | 32 | 256 | 399 | 0.64 |
| wta500 | 10 | 32 | 320 | 374 | 0.86 |
| wta1000 | 8 | 64 | 512 | 349 | 1.47 |
| slam | 4 | 128 | 512 | 333 | 1.54 |
| **ALL W** | | | **3,808** | **1,799** | **2.12** |

⭐⭐ **2.12 W main-draw chairs per professional per season, against a real professional at this level
playing on the order of twenty events a year.** So the world is not short of *people* – it is short
of *weeks*. **Widening the population makes this ratio WORSE**: the same chairs divided among more
players.

⚠⚠ **THE HONEST CAVEAT, because it changes what the ratio means.** Our calendar is sized for ONE
PLAYER'S season, not for a tour's: `buildSeason` places the events she can enter, and the field's own
results are simulated only where she is. So §7d is a statement about the calendar's size relative to
the population, and it says the population is not the binding constraint.

### 7e. If he wants it wider anyway – the knob and what reads it

`FIELD.size` is a plain constant and the field is derived: **zero persisted bytes, no schema, no
migration, no golden save.** But four things read the size:

* every rung's `entrantPctBand` is a **share**, so a bigger table moves every band's absolute floor –
  that is the whole mechanism of the population-1600 wave;
* the acceptance cuts are **absolute ranks** and do not move, so widening makes each cut bite a
  smaller share of the world while biting the same rank;
* the sponsor derivation reads the field size;
* a new storey needs a points band continuous with the one above it or the curve kinks.

⚠ **And the measured trap from last time**: population-1600's first cut stepped the core bands down
two instead of five and took Spearman(skill, points) from **0.888 to 0.818**. The 50% storey overlap
is what the correspondence between skill order and points order is *made of*.

**RECOMMENDATION: do not widen.** The table matches the sport's own size and depth; §7d says the
missing fullness is in the calendar. If he wants a fuller bottom of the ladder, the lever is more W15
and W35 weeks, not more people.

---

## 8. FILES AND REPRODUCTION

| file | what it is |
| --- | --- |
| `tools/two-seasons-read.ts` | **new** – per-rung derivation of her wins off the ledger, the counting window, the field at her rank, and the zero-tie rank check |
| `tools/big-rung-odds.ts` | **new** – the seeding audit, and Monte-Carlo finish distributions for her build and for her rank band |
| `tools/teen-at-the-top.ts` | **new** – the teen-at-the-head rate over 480 world-seasons, plus the `ageRampFloor` counterfactual |
| `tools/slam-door-cost.ts` | **new** – the band's cost in weeks, and the sweep over candidate acceptance cuts |
| `tools/population-depth.ts` | **new** – table size, curve depth, band floors, and the chairs-per-player arithmetic |
| `tools/college-price-probe.ts` | **extended** – full distribution, the paired difference, the marginal crossing, and the non-American bill computed per career |

⚠ **TWO ARITHMETIC CORRECTIONS WERE MADE TO THIS FILE'S OWN NEW BLOCK DURING THE AUDIT, and both are
the same family of mistake this round is about.** The first printed "college delta *less* the American
bill", double-charging a bill already inside the delta. The second took a median of medians –
`medianDelta + medianUsBill − medianNonBill` – which does not compose; it now computes each career's
counterfactual and takes the median last, exactly as §6a's paired row does. **Recorded rather than
quietly fixed**: I flagged a difference-of-medians in the old report and then wrote one.

```bash
npx vite-node tools/two-seasons-read.ts -- --save <his>.tsave --seasons 2
npx vite-node tools/big-rung-odds.ts -- --save <his>.tsave --runs 300 --band 12
npx vite-node tools/teen-at-the-top.ts -- --seeds 40 --seasons 12
npx vite-node tools/slam-door-cost.ts -- --seeds 14 --seasons 12
npx vite-node tools/population-depth.ts -- --seeds 6 --season 8
npx vite-node tools/college-price-probe.ts -- --seeds 6 --all
```

⚠ **On this machine the vitest pool wedges** – run the unit shard with `--no-file-parallelism`
(CLAUDE.md's own entry). Nothing in this spec touches the suite: no engine file changed.
