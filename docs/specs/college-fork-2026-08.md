---
type: spec
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-15
---

# The college fork, measured – and the threshold that has nothing to separate

**The owner, 14.08, verbatim:**

> «да, по колледжу надо комбо и понять устройство этого механизма и допуска в реальности. Сколько
> игроков из волны растущих реально идут в колледж, сколько реально доходят до w75 до этого момента,
> насколько корректна наша лестница в текущий момент вообще?»

Four questions. **This file answers only the fourth** – *насколько корректна наша лестница* – because
it is the only one our own engine can answer, and it costs nothing but machine time. The other three
are external evidence and live in `docs/research/college-and-the-junior-exit.md`. The two documents are
deliberately kept apart: nothing measured here is offered as evidence about the sport, and nothing
sourced there is offered as a fact about our build.

**NO ENGINE CONSTANT MOVES.** `ENDINGS.collegeClosedFromTier` carries an owner ruling in its own
comment. Every candidate threshold below is scored as a **predicate over measured rows**, never by
re-running the engine under a changed rule – so nothing here can be mistaken for shipped behaviour,
and the rows stay valid whichever numbers he picks.

---

## ⚠⚠ SUPERSEDED ON BOTH OF ITS SUBJECTS, ON 16.08 – READ THIS BEFORE THE REST

**Two constants this file measures no longer exist, and the measurements are kept because they are
what made both removals decidable.**

1. **`ENDINGS.collegeClosedFromTier` is GONE.** «Колледж – это независимая ветка карьеры с отдельным
   функционалом и турнирами, альтернативная.» Nothing closes the college answer; it is on the fork
   card in 100% of careers by construction. Everything below about *where to put the threshold* is a
   question that was answered by deleting the threshold – which is what §0's finding argued for.
   Current spec: [`college-is-its-own-branch-2026-08.md`](college-is-its-own-branch-2026-08.md).
2. **`w75.minAgeYears` is 14, not 17.** So these three claims below are FALSE as statements about the
   shipped game, and true as the record of the build they were measured on:
   * *"W75's cut is cleared at 16.6 against a doorway of 17 … `minAgeYears` is the whole gate at that
     rung"* (§3) – the doorway is gone; the cut is the whole gate now, which is what §3 predicted
     would remain.
   * *"not one career loses the door before 17.0. That is `w75.minAgeYears` and nothing else"* (§4) –
     the eleven-month window it describes cannot exist any more, and neither can the door.
   * *"the levers are … `w75.minAgeYears` **17**, which is what puts 92% of closures in one
     eleven-month window"* (§6) – **both halves of that lever were removed within 24 hours.**

**The grid is stated once and not here:**
[`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

---

## 0. THE FINDING, IN ONE BOX

> ### THE COMBO AS SPECIFIED CANNOT BE SIZED, BECAUSE AT NINETEEN THERE ARE NO TWO POPULATIONS TO SEPARATE.
>
> A **flat cumulative** money line and a rank line were swept across eight values each and crossed into
> seven combos. **Every single one leaves the college door open in 6–8 careers of 90. The shipped rule
> leaves it open in 7.** Not one candidate beats the constant it was meant to replace.
>
> The reason is not the threshold, it is the cohort. By nineteen our median career is **WTA #183 with
> $129,190 of prize money banked**, and the middle half of *every* career – strongest third and
> weakest third alike – sits between **$103,803 and $154,978**. The weak third's median is $114,260;
> the strong third's is $155,865. **Those are the same career with different luck**, and no line drawn
> through one number can cut a distribution that has no gap in it.
>
> ### AND THE SEVEN THAT KEEP THE ANSWER ARE NOT A POPULATION EITHER.
> Four of them never played a professional event at all – unranked at nineteen, $0–$3,230 banked, best
> result a J300. **The other three keep it by one week of arithmetic**: they lose the door at 19.08,
> 19.17 and 19.33, i.e. *after* the fork is raised at week 281. So the genuine "college is a real
> option" story exists in **4 careers of 90**, and the reported 8% is 4% plus a race condition.
>
> ### ⭐ BUT ONE MONEY RULE DOES WORK, AND IT IS THE SPORT'S OWN – BECAUSE IT IS ANNUAL AND NET.
> The finding above kills a **flat cumulative dollar line**, which is the shape the combo assumed and
> the shape I swept first. It does **not** kill the shape the NCAA actually used: **$10,000 per
> calendar year, plus actual and necessary expenses above that** (sourced in
> `docs/research/college-and-the-junior-exit.md` §1b). Applied as written to the same 90 careers (§4f):
>
> | rule | fires in | at median age |
> | --- | --- | --- |
> | **ours** – a won match at W75+ | **86 / 90** | **17.1** |
> | $10,000 in a season, bare | 83 / 90 | 17.0 |
> | **$10,000 + that season's travel & entry – the cap AS WRITTEN** | **65 / 90** | **19.0** |
>
> **The sport's own rule leaves the door open in 25 careers of 90 instead of 4, and where it does shut
> it, it shuts it at the fork rather than two years before it.** Both differences come from the two
> features a flat line throws away: it is per **year**, and it forgives the **cost of competing**.

---

## 1. HOW TO READ THE EVIDENCE

* **n = 90.** `tools/college-fork.ts`, 9 presets × 10 seeds, 312 weeks (14→20), **`POLICIES[1]`** – the
  rebuilt bench's *model of a reasonable parent*. Shipped constants throughout; nothing is patched, not
  even in memory, which is the one thing this tool does differently from `tools/acceptance-cuts.ts`.
* **A contrast arm, n = 90**, identical in every respect except `POLICIES[0]` (the grinder, which never
  plays the paid rungs). It is here because *"the door is shut"* and *"the parent entered professional
  events"* are two different claims and only a second arm can tell them apart.
* **Strength is read AFTER the fork, never at it.** Careers are split into terciles by **end rank at 20**
  – the future the fork cannot see. Splitting by rank at 19 and then testing a rank line at 19 would be
  a tautology with a table around it.
* ⚠ **`#1601+` MEANS UNRANKED.** The merged W table is 1,800 rows of which 1,600 hold points
  (`acceptance-cuts-2026-08.md` §2), so a career printed at #1619–#1625 has **zero points**, not a bad
  ranking. Every such row in the tables below is a career whose tennis never started.
* ⚠ **This builds on `docs/specs/acceptance-cuts-2026-08.md` §5 rather than re-deriving it.** That spec
  (15.08, n = 54) measured the closure itself – 50 of 54 careers, mean age 17.2, W75 causing 76%. §2
  below reproduces it at n = 90 so the *new* columns have a baseline in the same run. **It is a
  replication, not an independent finding**, and it agrees to within a point.

---

## 2. QUESTION 4a – AT WHAT AGE AND RANK DOES EACH RUNG FIRST ADMIT HER

n = 90, `player`. *cut cleared* = her age the first week the acceptance cut alone stopped refusing her
(`tierFloorOpen`, age gate not consulted). *rank then* = her WTA rank the week of her first entry.

| rung | minAge | cut | ever entered | cut cleared | 1st entry | rank then | 1st counting finish |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Local | – | – | 90/90 | – | 13.6 | unranked | 13.6 |
| Regional | – | – | 90/90 | – | 13.8 | unranked | 14.0 |
| National | – | – | 86/90 | – | 14.3 | unranked | 14.4 |
| J30 | 13 | – | 90/90 | – | 14.7 | unranked | 14.8 |
| J60 | 13 | 0.50 | 90/90 | 14.8 | 14.8 | unranked | 15.0 |
| J300 | 13 | 0.40 | 88/90 | 14.9 | 15.2 | unranked | 15.5 |
| W15 | 16 | – | 87/90 | – | 16.2 | unranked | 16.2 |
| W35 | 16 | #700 | 86/90 | 16.5 | 16.5 | **#607** | 16.6 |
| W50 | 16 | #550 | 86/90 | 16.5 | 16.6 | **#462** | 16.8 |
| **W75** | **17** | **#450** | **84/90** | **16.6** | **17.2** | **#279** | **17.4** ⚠ shuts college |
| W100 | 17 | #350 | 86/90 | 16.9 | 17.5 | #259 | 17.8 ⚠ |
| WTA 125 | 17 | #250 | 85/90 | 17.4 | 17.8 | #218 | 18.1 ⚠ |
| WTA 250 | 17 | #200 | 83/90 | 17.8 | 18.0 | #188 | 18.2 ⚠ |
| WTA 500 | 17 | #120 | 11/90 | 18.8 | 18.8 | #114 | 19.0 ⚠ |
| WTA 1000 | 17 | #65 | 1/90 | 19.3 | 19.1 | #17 | – ⚠ |
| Slam | 17 | #104 | 5/90 | 19.0 | 19.1 | #95 | 19.1 ⚠ |

**⚠ THE LADDER IS NOT WRONG AT THE DOOR. IT IS WRONG AT THE OTHER END.** The *sequence* is orderly –
each rung admits her later and at a better rank than the one below, the ranks at entry track the cuts,
and W75's cut is cleared at 16.6 against a doorway of 17, reproducing `acceptance-cuts-2026-08.md`
§3a's finding that **`minAgeYears` is the whole gate at that rung**. What is wrong is that **83–86 of
90 careers walk through every rung up to WTA 250**. A ladder that 92% of a cohort climbs to its fourth
professional rung by eighteen is not sorting anybody.

---

## 3. QUESTION 4b/4c – HOW MANY REACH W75, AND HOW MANY KEEP THE ANSWER

| | `player` (n 90) | `grinder` (n 90) |
| --- | --- | --- |
| ever entered a W75 | **84 / 90 · 93%**, first at mean age **17.2** | 7 / 90 · 8%, at 18.9 |
| ever **won a match** at W75 | **84 / 90 · 93%**, first counting finish at **17.4** | 3 / 90 · 3%, at 19.2 |
| ever entered any rung W75 or above | 86 / 90 · 96% | 7 / 90 · 8% |
| **college door shut** | **86 / 90 · 96%**, mean age **17.3**, median 17.1 | 3 / 90 · 3%, mean 19.2 |
| **still open at the fork (19)** | **7 / 90 · 8%** | **89 / 90 · 99%** |

**Which rung shut it** (`player`): **W75 76%** · W100 12% · WTA 250 8% · WTA 125 5%.

**The age the door shuts** (86 closures): under 17 **0%** · 17–17.9 **92%** · 18–18.9 5% · 19+ 3%.
min 17.0 · p25 17.1 · **median 17.1** · p75 17.3 · p90 17.8 · max 19.3.

> ⚠⚠ **THE CLOSURE IS NOT A DISTRIBUTION, IT IS AN EVENT.** 92% of all closures land inside a single
> eleven-month window that opens on her seventeenth birthday, and **not one career loses the door
> before 17.0**. That is `w75.minAgeYears` and nothing else: the cut is already cleared at 16.6, so the
> door shuts on the first W75 she is *allowed* to enter, not on the first one she is *good enough* for.
> The college ending does not decay – it is switched off, on a birthday, in nine careers out of ten.

⚠ **AND THE 99% CONTRAST IS THE REAL LESSON.** The same ladder, the same seeds, the same constants, one
different parent: the door survives in **89 of 90** careers. `collegeClosedFromTier` is therefore not
measuring the *player's talent* at all – it is measuring **whether the parent bought entries to
professional events**, which is a spending decision made two seasons earlier. This reproduces
`endings-and-the-album.md`'s grinder figure (98.6%, later 100%) on the rebuilt policy.

⚠ **THREE MEASUREMENTS OF THE SAME QUANTITY NOW EXIST AND THEY DISAGREE**, so the next reader does not
have to rediscover why: **50%** (`endings-and-the-album.md`, `player` arm, full-life horizon, *policy
predating the task-#89 rebuild*), **0 of 26** (round-21 #8, 3 seeds), **9%** (`acceptance-cuts-2026-08.md`,
n 54), **8%** (here, n 90). The last three agree; the 50% is the old policy and should not be quoted
against the current build.

### 3a. The seven that keep it, career by career – and only four are real

| career | rank @19 | prize @19 | best rung | what happened |
| --- | --- | --- | --- | --- |
| working · budget | unranked | $0 | J300 | never played a professional event |
| working · middle | unranked | $0 | J300 | never played a professional event |
| working · middle | unranked | $0 | J60 | never got past the junior tour |
| middle · self-coached | unranked | $3,230 | W15 | three years on the junior ladder, one W15 |
| middle · middle coach | #419 | $15,250 | W50 | ⚠ **shuts at 19.17** – kept it by one week |
| wealthy · high coach | #651 | $6,430 | W15 | ⚠ **shuts at 19.33** – kept it by two weeks |
| wealthy · elite coach | #310 | $26,890 | W50 | ⚠ **shuts at 19.08** – kept it by four days |

The fork is raised at **week 281** in all ninety careers. Three of the seven lose the door within a
month of it. **So the answer to "how many arrive at the fork with college genuinely open" is 4 of 90 –
4.4% – and all four are careers in which the tennis never started at all.**

---

## 4. QUESTION 4d – THE TWO THRESHOLD NUMBERS, WITH THEIR DISTRIBUTIONS

### 4a. THE MONEY: what a WEAK career banks by nineteen

Terciles by end rank at 20. Cumulative prize money booked from week 0 to the fork.

| band | n | end rank | rank @19 | min | p10 | p25 | **median** | p75 | p90 | max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| top | 30 | #161 | #151 | $26,890 | $119,363 | $133,273 | **$155,865** | $188,915 | $274,645 | $389,970 |
| mid | 30 | #195 | #211 | $15,250 | $63,782 | $80,278 | **$113,535** | $131,950 | $161,070 | $189,970 |
| **weak** | **30** | **#253** | **#205** | **$0** | **$2,907** | **$88,275** | **$114,260** | **$143,278** | **$152,464** | **$174,650** |
| ALL | 90 | – | #183 | $0 | $63,782 | $103,803 | **$129,190** | $154,978 | $182,014 | $389,970 |

> ### ⭐ **THE ANSWER TO "how much does a WEAK career bank by 19" IS $114,260 – AND THAT IS THE PROBLEM.**
> It is **73% of what the strongest third banks** ($155,865). The weak band's p75 ($143,278) is above the
> top band's p25 ($133,273): **the two distributions do not merely overlap, they interleave.** There is
> no dollar figure anywhere on the real line that puts the strong careers on one side and the weak on
> the other, because sorted by money the cohort does not come apart.

**The histogram says the same thing in one picture** – 60% of all ninety careers sit in one bucket:

| prize banked at 19 | careers | | of which top / mid / weak |
| --- | --- | --- | --- |
| $0 – $5,000 | 4 | 4% | 0 / 0 / **4** |
| $5,000 – $10,000 | 1 | 1% | 0 / 0 / 1 |
| $10,000 – $20,000 | 1 | 1% | 0 / 1 / 0 |
| $20,000 – $40,000 | 1 | 1% | 1 / 0 / 0 |
| $40,000 – $80,000 | 9 | 10% | 0 / 7 / 2 |
| **$80,000 – $160,000** | **54** | **60%** | 15 / 18 / 21 |
| $160,000+ | 20 | 22% | 14 / 4 / 2 |

The only clean signal in the whole table is the **left tail**: the four careers under $5,000 are all
weak, and they are the same four that never played professionally. That is a real separator and it
separates "played" from "did not play" – which is what `collegeClosedFromTier` already does.

**As a last-twelve-months figure** (the shape a real eligibility cap has – per year, not per life):
top median **$78,200**, mid **$48,375**, weak **$45,700**, all **$57,000**. Same interleaving.

### 4b. ⚠ AND ONE MEASUREMENT THAT DOES CUT – "prize above the cost of competing"

The historical NCAA shape is a cap on prize money **above actual and necessary expenses**, which counts
travel and entry and nothing else. Measured that way:

| band | travel + entry by 19 | prize by 19 | net | **prize exceeds costs** |
| --- | --- | --- | --- | --- |
| top | $162,605 | $155,865 | **–$6,740** | 13 / 30 |
| mid | $148,781 | $113,535 | **–$35,246** | 6 / 30 |
| weak | $95,190 | $114,260 | **+$19,070** | 12 / 30 |
| **ALL** | **$147,666** | **$129,190** | **–$18,476** | **31 / 90** |

**In 59 of 90 careers the prize money does not cover the plane tickets and the entry fees.** A rule
shaped like the real one would leave the door open in **66%** of careers instead of 8%.

⚠ **BUT IT SORTS THE WRONG WAY, AND THAT IS WHY IT IS A FINDING AND NOT A RECOMMENDATION.** The band
that most often clears its own costs is the **weak** one (12/30, 40%) and the band that least often
does is the **mid** one (6/30, 20%). A weak career is cheap because it stopped travelling; a strong one
is expensive because it chased WTA 125s across continents. So "the tennis pays for itself" in our
engine is a proxy for *how much she travelled*, not for *how good she is*. It restores the ending
generously and it grades nobody – which may be exactly what the owner wants, or exactly what he does
not, but he should know which of the two he is buying.

### 4c. THE RANK: where "the tour is not working out" sits

| band | n | best | p10 | p25 | **median** | p75 | p90 | worst | pts @19 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| top | 30 | #88 | #113 | #128 | **#151** | #179 | #184 | #310 | 527 |
| mid | 30 | #143 | #148 | #169 | **#211** | #255 | #268 | #419 | 332 |
| weak | 30 | #145 | #154 | #169 | **#205** | #256 | *unranked* | *unranked* | 342 |
| ALL | 90 | #88 | #134 | #151 | **#183** | #235 | #279 | *unranked* | 390 |

⚠ **THE WEAK BAND IS NOT WORSE THAN THE MIDDLE ONE AT NINETEEN** – #205 against #211 – and its best
career is ranked #145. The ordering the terciles impose at *twenty* is simply not visible at
*nineteen*. Sweeping every candidate line R (open = ranked worse than R at 19):

| R | open, all | of the top band | of the weak band | separation |
| --- | --- | --- | --- | --- |
| #150 | 70 (78%) | 17 (57%) | 28 (93%) | 37 pts |
| **#200** | **32 (36%)** | **1 (3%)** | **15 (50%)** | **47 pts** ← best |
| #250 | 17 (19%) | 1 (3%) | 8 (27%) | 23 pts |
| #300 | 8 (9%) | 1 (3%) | 5 (17%) | 13 pts |
| #400 | 6 (7%) | 0 (0%) | 5 (17%) | 17 pts |
| #500 | 5 (6%) | 0 (0%) | 5 (17%) | 17 pts |

> ⭐ **IF ONE NUMBER HAS TO BE NAMED, IT IS #200 – and it is the engine's own line, not a fitted one.**
> `TIERS.wta250.acceptsRank` is 200: it is already where the game says the main tour starts admitting
> her. It is the best separator on the sweep (47 points), it opens the door for **36%** of careers, and
> it excludes the strong third almost perfectly (1 of 30). **It is still not a clean cut** – it leaves
> half the weak band closed – but it is the only line measured here that is both defensible from the
> engine's own constants and better than a coin flip.

### 4d. ⭐ WHEN WOULD EACH LINE ACTUALLY FIRE?

The first question about a threshold, not the last: a line that shuts the door at the same age the rung
does has replaced one constant with another. **Shipped: mean age 17.3, in 86 of 90 careers.**

| money line M | ever crossed | age at crossing | | rank line R | ever better | age first better |
| --- | --- | --- | --- | --- | --- | --- |
| $5,000 | 86/90 | 16.4 | | #150 | 42/90 | 18.3 |
| $10,000 | 86/90 | 16.6 | | #200 | 83/90 | 17.8 |
| $20,000 | 86/90 | 16.8 | | #250 | 85/90 | 17.4 |
| $30,000 | 86/90 | **17.1** | | #300 | 86/90 | 17.0 |
| $50,000 | 85/90 | 17.6 | | #400 | 86/90 | 16.7 |
| **$75,000** | 84/90 | **18.1** | | #500 | 86/90 | 16.6 |
| **$100,000** | 78/90 | **18.4** | | #1000 | 87/90 | 16.3 |

**Every money line under $30,000 is fired BEFORE the rung fires**, so it would shut the door *earlier*
than today, not later. Only $75,000–$100,000 buys real time – about **a year** – and even then it still
shuts in 78–84 of 90. **A money threshold in this engine does not restore the college ending. It
postpones it.**

### 4e. THE COMBO, SCORED

Open at the fork iff `prize < M` **OR** `rank at 19 worse than R`:

| M | R | door open | of top band | of weak band |
| --- | --- | --- | --- | --- |
| $10,000 | #400 | 6 (7%) | 0 (0%) | 5 (17%) |
| $20,000 | #400 | 6 (7%) | 0 (0%) | 5 (17%) |
| $20,000 | #300 | 8 (9%) | 1 (3%) | 5 (17%) |
| $30,000 | #300 | 8 (9%) | 1 (3%) | 5 (17%) |
| $50,000 | #300 | 8 (9%) | 1 (3%) | 5 (17%) |
| **SHIPPED (W75+)** | | **7 (8%)** | **1 (3%)** | **5 (17%)** |

**Seven candidate combos, a spread of two careers, and the shipped rung sits in the middle of them.**
The combo **as specified – a flat cumulative dollar line** – is not a fix; it is the same answer
written three different ways. ⚠ **§4f is the same question asked with the sport's own rule shape and it
does not come out the same way**, which is why the sweep above is a refutation of one *shape* and not
of the money arm as an idea.

### 4f. ⭐ THE RULE THE SPORT ITSELF USED – annual, and net of the cost of competing

NCAA Bylaw 12.1.2.4.2, before its repeal, let a prospective college tennis player keep prize money up
to **$10,000 per calendar year** before full-time enrolment, and above that line, per-event amounts not
exceeding her **actual and necessary expenses** (`docs/research/college-and-the-junior-exit.md` §1b).
Our analogue of "actual and necessary expenses" is the travel + entry line.

⚠ **SEASONS, NOT CALENDAR YEARS.** The engine has no calendar-year fold, so these are 52-week blocks
from week 0. Named honestly rather than relabelled.

| season | age | median prize | p75 | max | clears **$10k** | clears **$10k + that season's costs** |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 14→15 | $0 | $0 | $0 | 0/90 | 0/90 |
| 1 | 15→16 | $0 | $0 | $0 | 0/90 | 0/90 |
| 2 | 16→17 | $13,270 | $17,993 | $38,150 | **56/90** | **3/90** |
| 3 | 17→18 | $30,975 | $39,923 | $80,180 | **79/90** | **18/90** |
| 4 | 18→19 | $58,150 | $75,313 | $118,700 | **83/90** | **64/90** |

**When each rule would have fired:**

| rule | fires in | mean age | median age |
| --- | --- | --- | --- |
| $10,000 in a season (bare cap) | 83 / 90 | 17.4 | **17.0** |
| **$10,000 + that season's travel & entry (the cap AS WRITTEN)** | **65 / 90** | **18.7** | **19.0** |
| **OURS – a won match at W75 or above** | 86 / 90 | 17.3 | **17.1** |

> ⭐ **THE EXPENSES ALLOWANCE IS THE WHOLE DIFFERENCE, AND IT IS NOT A ROUNDING DETAIL.** In her
> 16→17 season **56 of 90** careers clear a bare $10,000 but only **3** clear $10,000 net of what the
> travelling cost. The rule only starts biting in the **18→19** season (64/90) – the season immediately
> before the decision. **That is the correct shape for a threshold attached to a question asked at
> nineteen**, and our rung has the opposite shape: it fires at 17.1, in the first season the rung is
> even open to her.

⚠ **AND THE RULE IN FORCE TODAY IS MORE PERMISSIVE STILL.** The Brantmeier/Joint settlement filed
28.04.2026 removes pre-enrolment prize-money limits entirely. Under that rule **90 of 90** careers keep
the door and the only remaining gate is whether a roster place is offered – **which this engine does
not model at all**. Research §1b and §5a.

**⚠ PREDICTED vs MEASURED**, registered before the sweep was run:

| prediction | outcome |
| --- | --- |
| a money line separates better than a rung | ❌ **wrong** – best money separation 20 pts, best rank separation 47 pts, shipped rung 14 pts |
| the rank arm reopens the door for the weak band | ❌ **wrong at any R he would plausibly pick** – #300 reopens 5 of 30; only #200 reaches 15 of 30, and it opens it for 36% of *everybody* |
| the combo beats the rung | ❌ **wrong** – 6–8 open against the rung's 7 |
| the two thresholds separate the populations | ❌ **wrong, and it is the finding** – the populations are not separated at nineteen by *anything* measured here |
| **a flat money line is the right shape for the money arm** | ❌ **wrong, and I only found out by measuring the sport's own shape instead** (§4f). Annual-and-net leaves 25 of 90 open at median age 19.0; flat-and-cumulative leaves 4 and fires at 17.0. **Same arm, same money, opposite verdict** – the shape was carrying the result, not the number. |

---

## 5. SO WHAT IS ACTUALLY WRONG – AN ANSWER TO «насколько корректна наша лестница»

1. **The rungs' doors are approximately right and the ORDER is right.** Ages at first entry rise
   monotonically, ranks at entry track the cuts, and W75 admits her at #279 against a cut of #450.
2. **The OUTCOMES are degenerate.** 93% enter a W75, 93% win a match there, 92% enter a WTA 125, and at
   nineteen the interquartile range of the whole cohort is **#151 to #235** and **$103,803 to
   $154,978**. Nine careers in ten converge on one result.
3. **The college door is not measuring talent.** It fires on a birthday (92% of closures in the 17–17.9
   band, none before 17.0) and it is entirely determined by the parent's spending policy (8% open under
   `player`, 99% under `grinder`).
4. **No threshold read at nineteen can SORT this cohort**, because the thing a sorting threshold needs –
   two populations with a gap between them – does not exist here. **Whatever the owner decides about
   `collegeClosedFromTier`, it will not be what makes college a discriminating choice. The compression
   of the outcome distribution is the prior defect**, and it is the same defect
   `acceptance-cuts-2026-08.md` §4b ran into from the other side when correcting the ladder made the
   player *better off on every metric*.
5. ⚠ **But "cannot sort" is not "cannot help", and §4f is the distinction.** A rule shaped like the
   sport's own – annual, net of the cost of competing – does not sort the strong from the weak either,
   and it still **quadruples** the number of careers that keep the answer (25 of 90 against 4) and moves
   the closure from 17.1 to **19.0**, i.e. from "a birthday two years before the question" to "the
   season the question is about". **If the goal is that the third answer exists often enough to be a
   real choice, that is achievable. If the goal is that it exists for the girls it should exist for,
   nothing measured here achieves it.** Those are different goals and the owner has not yet had to
   separate them.

⚠ **AND THE ONE NUMBER THAT SHOULD BE CHECKED AGAINST REALITY IS $129,190.** That is what our median
career has banked in prize money by her nineteenth birthday, ranked #183. Whether a real WTA #183
nineteen-year-old has banked anything like it is an external question, and it is asked in
`docs/research/college-and-the-junior-exit.md`. If she has not, the compression above is a *payout*
problem before it is a *ladder* problem.

---

## 6. WHAT THIS WAVE EDITS

| file | change | risk |
| --- | --- | --- |
| `tools/college-fork.ts` | **new.** Measurement only; patches nothing, in memory or otherwise. | none |
| `docs/specs/college-fork-2026-08.md` | this file | none |
| `docs/research/college-and-the-junior-exit.md` | the sourced half + the combo proposal | none |

**No engine constant moves. No test moves.** `ENDINGS.collegeClosedFromTier` is untouched, and so is
every `TIERS` entry.

⚠ **ONE BUG WORTH RECORDING, because it is a trap the next tool will fall into too.** `openCareer`
builds its seed as `bench-<background>-<index>`, and the nine presets carry only **three**
backgrounds – so `bench-working-0` names three different careers. The first run of this tool keyed its
terciles on the seed string and got bands of **49 / 6 / 35** instead of 30 / 30 / 30. `Row.key` is now
`<presetIndex>:<seedIndex>`. The wrong split is what made it visible; a tool that only printed means
would have shipped the error silently.

---

## 7. FOR THE OWNER – what this measurement puts in front of him

1. **The combo as a flat dollar line does not beat the constant it replaces** (§4e) – seven candidate
   pairs, 6–8 careers open of 90, against the rung's 7.
2. ⭐ **But the sport's own rule shape does** (§4f): **$10,000 a year net of the cost of competing**
   leaves the door open in **25 of 90** and shuts it at median age **19.0** instead of 17.1. If a money
   arm is wanted, **this is its shape**, and the shape matters more than the number.
3. **First decide which goal is the goal.** *"College should be rare and earned"* – the rung already
   does that. *"College should still be there for a normal career at nineteen"* – §4f does that.
   *"College should be there for the girls the tour is failing"* – **nothing measured here does that**,
   because at nineteen our cohort does not separate.
4. **If it is goal three, the levers are not thresholds at all**: the fork **age** (three of the seven
   survivors are inside a month of the fork week) and `w75.minAgeYears` **17**, which is what puts 92%
   of closures in one eleven-month window.
5. **#200 is the one rank line worth naming** (§4c), and it is already in the engine as
   `TIERS.wta250.acceptsRank`.
6. ⚠ **And the rule actually in force in the sport today has no money limit at all** – under it 90 of
   90 keep the door, and the real gate becomes *"was she offered a roster place"*, which this engine
   does not model. Research §1b.
