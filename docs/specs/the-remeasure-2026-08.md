---
type: spec
status: draft
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-16
---

# P6 – the re-measure: what five phases of real rules did to a career, and what it would cost to undo

**P6 of `docs/plans/college-and-the-junior-ladder.md`, on `wave/round21`, after P1–P5.**

> **THE PHASE IN FIVE LINES.** The owner predicted the slowdown before the plan was written
> (*«скорость и продвижение точно упадут»*). This page is the invoice. P0's frozen battery is re-run
> unchanged on the finished chain and put beside the frozen baseline column for column, the six
> questions the chain left open are each answered with a number, and the one retune worth naming is
> named – **and deliberately not pulled.** **No engine constant moves in this phase.**

---

## 0. THE PREDICTIONS, WRITTEN BEFORE ANYTHING WAS RUN

Invariant 4, and the rule this whole plan is built on. Every number below was registered before the
battery returned. The ruler is `docs/specs/ladder-baseline-2026-08.md`; the arm is
`tools/ladder-baseline.ts` unchanged, n = 90 (9 presets × 10 seeds), 676 weeks (13.6 → 26.6),
`POLICIES[1]`, on `3e1bb6b`.

| # | claim | predicted |
| --- | --- | --- |
| Q1 | the battery reproduces P5's arm | **identical on every column** – the only engine commit since is `college.ts`, and the battery never answers the fork |
| Q2 | rank at 17 vs P0's #246 | ~#420–430. The cost is real and this is where it lands |
| Q3 | rank at 19 vs P0's #177 | ~#270. **NOT unwound against P0** – P2's "unwound by 19" was against P1's own before-arm, not against the baseline |
| Q4 | rank at 21 / 25 vs P0's #185 / #172 | **better on both**: ~#174 / ~#158 |
| Q5 | careers that ever earn a domestic ranking | ≥ 85/90, first at median age ~13.7–14.0. The corpus's 46/120 is about **holding** on a 52-week window, not about **earning** |
| Q6 | domestic points still held at week 120 | 35–50% – reproduces the corpus finding on the battery's own seeds |
| Q7 | counting book full (18 slots) at 21 | 40–44/90 against P0's 17/90 |
| Q8 | prize banked by 19 | ~$70k against P0's $125,855 – "more careers arrive at 19 with less banked" holds, ≈ −44% |
| Q9 | the bankruptcy at 14.8 | **0/90** – P3's cuts took it away. But the mechanism survives, so it is a fragile zero, not a fix |
| Q10 | college door open at the fork | ~96% against P0's 8% |
| Q11 | survival | 1/90 ending early, 88–89/90 still running at 26.6 |
| Q12 | the strong-out rules on the full horizon | they finally bite: ≥ 70% of careers reach the top 150, and the top-50 limb – **0 of 27 on P1's 416-week horizon** – fires for the first time |
| Q13 | the third answer's price | unchanged from P5's $152,243 / $45,544, because no engine constant has moved since it was measured |

⚠ **AND THE PREDICTION THAT MATTERS MOST IS Q3 AGAINST Q4.** If the chain's cost has unwound by 19 it
is a delay; if it has unwound by 21 but not by 19 it is a *longer* delay than any single phase
measured, because each phase compared itself with the phase before it and never with P0. The chain has
never been added up. That is what this page is.

**Scored: twelve of thirteen, and the miss is the phase's best finding.** Q1–Q4 and Q7–Q11 landed on
the number, several of them exactly (#423 against ~#420–430; #174 / #158 against ~#174 / ~#158;
$69,780 against ~$70k; 42/90 against 40–44). Q12 was right and larger than predicted. **Q5/Q6 were
half wrong in a way that overturns a shipped comment** – §3.2. Q13 held, and its decomposition is new.

---

## ⭐ 1. THE ONE BOX

> ### THE CAREER AFTER FIVE PHASES OF REAL RULES, BESIDE THE ONE BEFORE THEM (n = 90, ages 13.6 → 26.6)
>
> She enters her first W75 at **19.0** ranked **#261** – P0 had her there at **17.0** ranked #272. At
> seventeen she is **#423** against P0's **#246**; at nineteen **#270** against **#177**; and then the
> curves cross. At **twenty-one she is #174 against #185**, at twenty-five **#158 against #172**, and
> the career finishes on **$646,795 against $654,430 – a difference of one per cent.**
>
> ### ⭐ THE SLOWDOWN IS REAL, IT IS BIG, IT IS OVER BY TWENTY-ONE, AND IT IS NOT WHAT ANYONE THOUGHT IT WAS.
> **She does not play less. She plays MORE** – 265 entries a career against 239 – and the reason her
> rank falls is that from fifteen to eighteen the only professional rung open to her is the bottom
> one. **At eighteen, 20.6 of her 23.9 entries are W15s: 86% of a season on the lowest rung in the
> game.** Then the whole ladder opens on one birthday – W35, W50 and W75 all admit her for the first
> time at a median of exactly **19.0**.
>
> ### ⚠ AND THE COUNTING BOOK IS NOT THINNER. IT IS FULLER AND CHEAPER.
> The plan predicted the book would thin. At nineteen **74 careers of 90 hold all eighteen slots
> against P0's 20** – and each slot is worth **13.4 points against ~26**. By twenty-one the slot is
> worth **27.2** again. The thinning column measured the opposite sign and the shape underneath it is
> the whole finding: *the delay is in the QUALITY of what fills the book, not the quantity.*
>
> ### ⭐ AND EVERY SURVIVAL COLUMN IMPROVED.
> Bankruptcies **1 → 0**. The earliest career-ending event moves from **15.3 to 24.9**. The worst
> career high in ninety goes **#870 → #176**. The median first red week moves **121 → 156**. The
> slowdown did not become a cull; it became a floor.

---

## 2. THE WHOLE BATTERY, COLUMN FOR COLUMN AGAINST P0

`npx vite-node tools/ladder-baseline.ts`, **unchanged** – the property P0 was built for. n = 90
(9 presets × 10 seeds), 676 weeks, `POLICIES[1]`, identical seeds, on `3e1bb6b`. 90 careers in 211s.
**P0** is `docs/specs/ladder-baseline-2026-08.md` verbatim.

⚠ **THIS IS THE FIRST TIME THE CHAIN HAS BEEN ADDED UP.** Each of P1–P5 measured itself against the
phase before it. Nobody has put P0 beside the finished build until now, and three of the numbers below
are larger than any single phase reported, because five phases of *"a small delay"* compose.

### 2a. The ladder, as it admits her

| rung | cut P0 → now | reach P0 → now | first entry (median) | rank then |
| --- | --- | --- | --- | --- |
| Local | – | 90/90 → **90/90** | 13.6 → **13.6** | unranked |
| Regional | – | 90/90 → **90/90** | 13.8 → **13.8** | unranked |
| National | – | 88/90 → **85/90** | 14.3 → **14.3** | unranked |
| J30 | – | 90/90 → **90/90** | 14.7 → **14.7** | unranked |
| J60 | 0.50 | 90/90 → **90/90** | 14.8 → **14.8** | unranked |
| J300 | 0.40 → **0.20** | 89/90 → **71/90** | 15.0 → **15.8** | #217 → **#378** |
| W15 | minAge **16 → 14** | 87/90 → **83/90** | 15.9 → **15.9** | unranked |
| **W35** | #700 | 86/90 → **82/90** | **16.3 → 19.0** | #604 → **#315** |
| **W50** | #550 → **#330** | 86/90 → **83/90** | **16.5 → 19.0** | #476 → **#293** |
| **W75** | #450 → **#300** | 84/90 → **82/90** | **17.0 → 19.0** | #272 → **#261** |
| W100 | #350 → **#240** | 86/90 → **83/90** | 17.5 → **19.3** | #260 → **#209** |
| WTA 125 | #250 → **#180** | 86/90 → **82/90** | 17.8 → **19.6** | #217 → **#168** |
| WTA 250 | #200 | 86/90 → **83/90** | 18.2 → **19.3** | #188 → **#184** |
| WTA 500 | #120 | 51/90 → **47/90** | 21.5 → **21.3** | #115 → **#115** |
| WTA 1000 | #65 | 13/90 → **19/90** | 22.3 → **22.2** | #56 → **#56** |
| Slam | #104 | 35/90 → **34/90** | 22.0 → **22.4** | #101 → **#100** |

> ⭐ **THE LADDER SORTS NOW, AND IT DOES IT AT THE BOTTOM RATHER THAN AT WTA 500.** P0's finding was
> that *"82–90 careers of 90 walk through every rung up to WTA 250; the first door that refuses
> anybody is WTA 500"* – a corridor, not a ladder. **J300 now refuses 19 careers of 90** (89/90 →
> 71/90) and its first entrant is ranked **#378 against #217**. That is the one rung in the chain that
> started saying no to somebody early, and it is P3's `j300` 0.40 → 0.20 doing it.
>
> ⚠ **AND ABOVE W15 THE LADDER STOPPED SORTING ALTOGETHER – IT NOW SORTS ON A BIRTHDAY INSTEAD.**
> W35, W50 and W75 all have a median first entry of **exactly 19.0** and reach of 82–83 of 90. Before
> the chain those three doors opened at 16.3, 16.5 and 17.0 and admitted her at #604, #476 and #272 –
> **a genuine gradient.** Now the three cuts (#700 / #330 / #300) are all cleared on the same day, so
> the rungs are no longer three decisions. §5.1 is what that costs.

### 2b. Rank at the four frozen ages, and the career high

| at age | ranked P0 → now | p25 | **median** | p75 | worst |
| --- | --- | --- | --- | --- | --- |
| **17** | 78/90 → **68/90** | #206 → **#369** | **#246 → #423** | #294 → **#524** | #984 → #1017 |
| **19** | 84/90 → **82/90** | #151 → **#246** | **#177 → #270** | #201 → **#303** | #1027 → **#393** |
| **21** | 86/90 → **83/90** | #160 → **#143** | **#185 → #174** ⭐ | #249 → **#203** | #361 → **#437** |
| **25** | 86/90 → **83/90** | #132 → **#125** | **#172 → #158** ⭐ | #205 → **#181** | #314 → **#250** |

**Career high:** 87/90 → **83/90** ever ranked · best #7 → **#7** · p25 #89 → **#67** ·
median #111 → **#115** · p75 #142 → **#134** · **worst #870 → #176**.
**The age it fell:** min 16.3 → **19.7** · p25 21.4 → 21.8 · median 23.4 → **23.4** · p75 24.9 → 25.2.

> ⭐⭐ **THE CURVES CROSS BETWEEN NINETEEN AND TWENTY-ONE, AND THAT IS THE WHOLE ANSWER TO THE OWNER'S
> PREDICTION.** He said *«скорость и продвижение точно упадут»* and he was right for the first six
> years and wrong for the rest. **+177 places at seventeen, +93 at nineteen, −11 at twenty-one, −14 at
> twenty-five.**
>
> ⭐ **AND THE DISTRIBUTION TIGHTENED FAR MORE THAN THE MEDIAN MOVED.** The worst career high in ninety
> goes **#870 → #176** and the worst rank at nineteen **#1027 → #393**. P0's p25 career high was #89;
> now it is **#67**. The chain did not lower the ceiling – it **raised the floor**, and it did that at
> every age. That is a different and better thing than the median says on its own, and it is invisible
> in any column that reports only a median.

### 2c. Entries – and this is where the chain surprised everybody

Mean entries in that year of her life, over all 90 careers.

| age | total P0 → now | W15 | W35 | W50 | W75 | W100 | W125 | W250 | J30 | J60 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 13 ⚠part | 11.0 → **11.0** | – | – | – | – | – | – | – | – | – |
| 14 | 20.1 → **18.5** | 0.0 → **0.3** | – | – | – | – | – | – | 6.1 → 5.3 | 3.0 → 2.7 |
| 15 | 19.4 → **22.7** | 0.8 → **4.4** | – | – | – | – | – | – | 8.8 → 8.4 | 6.4 → 6.5 |
| 16 | 25.7 → **24.7** | 10.1 → **7.8** | 4.8 → **0.4** | 3.4 → **0.0** | 0.4 → **0.0** | – | – | – | 2.9 → 7.6 | 2.6 → 6.5 |
| 17 | 23.6 → **25.6** | 0.7 → **13.3** | 1.0 → **0.4** | 3.2 → **0.1** | 3.1 → **0.0** | 1.8 → **0.0** | 0.9 → **0.0** | 0.6 → **0.0** | 5.2 → 5.3 | 4.2 → 4.5 |
| **18** | 16.1 → **23.9** | **0.3 → 20.6** ⚠ | 0.3 → **1.1** | 1.6 → **0.3** | 2.8 → **0.0** | 2.7 → **0.0** | 2.8 → **0.0** | 4.4 → **0.1** | – | – |
| **19** | 15.3 → **18.7** | 0.4 → **0.8** | 0.2 → **2.4** | 1.6 → **4.7** | 2.6 → **2.8** | 2.4 → **2.0** | 2.8 → **1.3** | 4.4 → **3.9** | – | – |
| 20 | 15.6 → **18.5** | 0.1 → 0.3 | 0.3 → 0.8 | 1.2 → 3.3 | 2.4 → 1.2 | 2.4 → 2.0 | 2.6 → 1.6 | 4.9 → 5.4 | – | – |
| 21 | 16.4 → **18.0** | – → 0.2 | 0.1 → 0.9 | 1.4 → 3.0 | 2.6 → 1.4 | 2.5 → 2.1 | 3.0 → 2.0 | 4.5 → 5.1 | – | – |
| 25 | 16.5 → **18.5** | – → 0.1 | 0.1 → 0.5 | 1.3 → 2.5 | 2.1 → 1.1 | 2.3 → 2.1 | 2.6 → 2.0 | 4.7 → 5.4 | – | – |

**Whole horizon:** p25 231 → **256** · median **239 → 265** · p75 246 → **279** entries per career.
**Per career, W15 is now her most-played rung of all sixteen: median 53 entries**, against W50's 24,
J30's 27 and W75's 9.

> ### ⚠⚠ 2c-bis. THE EIGHTEENTH YEAR IS THE ONE THAT SHOULD BE LOOKED AT
>
> **P0's eighteen-year-old** played 16.1 events spread across W50 (1.6), W75 (2.8), W100 (2.7), WTA
> 125 (2.8) and WTA 250 (4.4) – a professional season on five rungs.
> **This build's eighteen-year-old** plays 23.9 events of which **20.6 are W15s (86%)** and 1.1 are
> W35s. She plays *half again as much tennis* and almost all of it is on the game's bottom rung.
>
> **The mechanism is exact and it is not a bug in any one phase.** At eighteen the WTA age rule's row
> is *unlimited*, so nothing caps her professional entries any more; `isJuniorAge` is `age <= 18`
> (derived from the J rungs' own U18 ceiling), so the **Accelerator still governs every W rung above
> W15**; and W15 is the one rung the Accelerator is deliberately never asked about. The entry policy
> walks strongest-tier-first, W15 outranks every junior event, and so it takes W15 every single week.
> **Three correct rules compose into a rung she cannot leave.**

### 2d. Prize money banked

| by | p25 | **median** | p75 | |
| --- | --- | --- | --- | --- |
| **age 19** | $103,840 → **$49,565** | **$125,855 → $69,780** | $152,288 → **$91,945** | ⚠ **−45%** |
| age 21 | $203,868 → **$174,638** | **$251,215 → $211,715** | $314,728 → **$250,628** | −16% |
| **career** | $513,530 → **$504,998** | **$654,430 → $646,795** | $1,151,755 → **$1,341,465** | **−1%** |

⭐ **THE MONEY REPAYS ITSELF ALMOST EXACTLY.** −45% by nineteen, −16% by twenty-one, **−1% over the
career** – and the p75 career figure is *up* $189,710. The chain moved when she earns, not how much.

### 2e. The counting book, of 18 slots

| at age | points p25 / **median** / p75 | slots median | **book full** | **points per filled slot** |
| --- | --- | --- | --- | --- |
| **19** | 323/**391**/516 → 172/**226**/270 | 15 → **18** | **20/90 → 74/90** ⭐ | ~26 → **13.4** ⚠ |
| **21** | 262/**381**/478 → 339/**421**/549 | 15 → **17** | **17/90 → 42/90** ⭐ | ~25 → **27.2** |

> ### ⭐⭐ THE EARLY-WARNING COLUMN FIRED IN THE OPPOSITE DIRECTION, AND IT IS THE MOST USEFUL THING
> ### IN THIS PAGE.
> P0 called the book *"the thinning test… this moves BEFORE rank does"*, and the plan predicted it
> would thin. **It did not thin. It filled.** 74 careers of 90 now hold every one of eighteen slots at
> nineteen, against 20 before.
>
> **What actually happened is that the slot got cheap.** 226 points across 18 slots is **13.4 a slot**
> against P0's ~26 across 15 – she has twice as many results worth half as much, because they are W15
> results. By twenty-one the slot is back to **27.2** and the book is worth **421 against 381**.
>
> ⚠ **So "fewer entries thin the book" was the wrong model of the risk.** Entries went *up*. The
> quantity column is fine at every age; the thing that moved is **price per result**, and no column in
> P0's battery was watching it. `points per filled slot` is the column P0 should have had, and it is
> the one a later phase should carry.

### 2f. The college door

| | P0 | now |
| --- | --- | --- |
| door **shut** | 86/90 · 96% – mean **17.3**, median 17.1 | **83/90 · 92% – mean 19.2, median 19.1** |
| still **open at the fork** | **7/90 · 8%** | **86/90 · 96%** |
| ⭐ still open a **full season later** | **4/90 · 4%** | **7/90 · 8%** |
| which rung shut it | W75 62 (72%) · W100 12 · W125 6 · W250 6 | **W75 76 (92%)** · W100 5 · W250 2 |
| closures under 17 / 17–17.9 | 0% / **78 (91%)** | 0% / **1 (1%)** |
| closures 19+ | 3 (3%) | **80 (96%)** |

**The door now shuts at nineteen instead of seventeen, and it shuts a fortnight AFTER the question is
asked.** Her first counting W75 result is at median 19.2; the fork is at 19.0. P4 recorded that the
answer survives the fork *by accident* and that nothing holds it there – that is still true.

### 2g. Survival

| | P0 | now |
| --- | --- | --- |
| still running at 26.6 | 88 · 98% | **89 · 99%** |
| **bankruptcy** | **1 · at 15.3** | **0** ⭐ |
| injury (career-ending) | 1 · at 16.2 | 1 · **at 24.9** |
| ever in debt | 39/90 · 43%, median first red **week 121** | 40/90 · 44%, median **week 156** ⭐ |
| retirement question raised | 12/90 · 13%, mean 25.6 | 13/90 · 14%, mean 25.3 |
| **shortest career** | **15.3** | **24.9** ⭐ |

⭐ **EVERY SURVIVAL COLUMN IMPROVED OR HELD.** P0 warned this row *"has nowhere to go but down"* if
the chain pushed entries and money down. It went up instead – and the reason is visible in §2c: the
chain did not take her tennis away, it moved her onto cheaper tennis, which costs the family less at
exactly the ages it was poorest.

---

## 3. THE SIX QUESTIONS THE CHAIN LEFT OPEN – each answered with a number

### 3.1 Did the slowdown overshoot? **Not over the career. Yes over the years 17–19 – and P2's "it unwound by 19" does not survive being measured against P0.**

P2 measured rank at 17 going **#300 → #426** and reported the cost *"gone by nineteen"*. Both halves
need correcting, and only the second one is wrong.

| | P0 | P1+P2 | P3 | **now (P1–P5)** | P0 → now |
| --- | --- | --- | --- | --- | --- |
| rank at 17 | #246 | #426 | #423 | **#423** | **+177** |
| rank at 19 | #177 | #272 | #270 | **#270** | **+93** |
| rank at 21 | #185 | #199 | #174 | **#174** | **−11** ⭐ |
| rank at 25 | #172 | #176 | #158 | **#158** | **−14** ⭐ |

⚠ **P2's "#300 → #426" WAS MEASURED AGAINST P1's OWN ARM, NOT AGAINST THE BASELINE.** P0's rank at
seventeen is **#246**, not #300 – #300 was already P1's number. So the chain's real cost at seventeen
is **+177 places, not +126**, and *the phase that reported it could not have known*, because each
phase's before-column was the phase before it. **That is the specific reason this page exists.**

⚠ **AND "UNWOUND BY 19" IS FALSE AGAINST P0.** At nineteen she is **#270 against #177 – still 93
places behind**, and she is behind on money by 45%. The convergence P2 saw was against P1's arm.
Against the baseline the cost persists through the fork and unwinds **between 19 and 21**.

> **THE VERDICT.** It did not overshoot the career: by twenty-one she is ahead on rank, by twenty-five
> further ahead, the career prize is level to 1%, the ceiling is unchanged and every survival column
> improved. **What it overshot is one specific year – eighteen – where 86% of her season is on the
> bottom rung (§2c-bis), and that is a structural artefact of three correct rules composing rather
> than a number anybody chose.** §5.1.

### 3.2 Is the domestic ladder being bypassed? **No – 90 of 90 earn a domestic ranking, all of them at 13.6, and it is her FIRST ranking in 90 careers of 90. The corpus comment is wrong.**

Measured with `tools/first-ranking-probe.ts`, **new in this phase** – written because
`tools/e2e-fixtures.ts` says so itself: *"P6 should measure it rather than let a fixture recipe be the
only place it is written down."* n = 90, 676 weeks, same seeds and policy as the battery.

| track | **ever** earned a ranking | first at age p25/**median**/p75 |
| --- | --- | --- |
| **domestic** | **90/90 · 100%** | 13.6 / **13.6** / 13.6 |
| itf | **90/90 · 100%** | 14.4 / **14.8** / 15.2 |
| wta | 83/90 · 92% | 15.4 / **16.1** / 16.8 |

**Which table carried her first ranking of any kind: domestic 90/90. ITF 0/90. WTA 0/90.**

And the column the corpus actually measured – **holding** points, which is a read of a 52-week window:

| week | age | domestic | itf | wta |
| --- | --- | --- | --- | --- |
| 52 | 14.6 | **90/90 · 100%** | 38/90 · 42% | 0/90 |
| **120** | **15.8** | **45/90 · 50%** | **87/90 · 97%** | 34/90 · 38% |
| 208 | 17.6 | 42/90 · 47% | 86/90 · 96% | 73/90 · 81% |
| 312 | 19.6 | 0/90 · 0% | 8/90 · 9% | 83/90 · 92% |
| 416 | 21.6 | 7/90 · 8% | 0/90 | 83/90 · 92% |

> ### ⚠⚠ THE SHIPPED COMMENT SAYS SOMETHING THAT IS NOT TRUE, AND THIS IS THE CORRECTION.
> `tools/e2e-fixtures.ts` reads: *"at week 120 only 46 of 120 careers hold domestic points, while 114
> of 120 hold ITF ones. **Her first ranking is now the ITF one.**"* The first sentence reproduces on
> the battery's own seeds (**50% and 97%**, against the corpus's 38% and 95% – same shape, different
> seed set). **The second sentence does not.** Her first ranking is the domestic one, in **90 careers
> of 90**, at **13.6** – nine months before the ITF one and two and a half years before the WTA one.
>
> **EVER minus HELD is a decay, not a bypass.** She wins her domestic ranking at 13.6, holds it in
> 100% of careers at 14.6, and by 15.8 half the cohort has let it lapse because the 52-week window
> emptied while she was at junior events. **Nothing bypassed the domestic ladder. She climbed it,
> then left it** – which is what a junior does, and is P1 working rather than P1 misfiring.

### 3.3 Is the counting book thinner? **No. It is fuller and cheaper – 74/90 hold all 18 slots at 19 against P0's 20/90, and P3's 42/90 at 21 reproduces exactly.**

§2e. P3's headline – *42 of 90 careers holding a full 18 counting slots at 21 against 9 before* – was
measured against P1+P2's arm. **Against P0 it is 42 against 17**, and it holds on the full chain: this
run measures **42/90**.

The finding P3 could not see is at nineteen, where the column moves the *other* way: **20/90 → 74/90
full**, at **13.4 points a slot against ~26**. **Fullness is not a proxy for strength once the price
of a result can change**, and this build is the case that separates them.

### 3.4 Has the population at the fork changed shape? **Yes, exactly as the plan predicted, and by 45%.**

| at the fork (19) | P0 | now |
| --- | --- | --- |
| prize banked, median | **$125,855** | **$69,780** (−45%) |
| ...p25 | $103,840 | **$49,565** (−52%) |
| rank, median | #177 | **#270** |
| holding any professional ranking | 84/90 | 82/90 |
| counting book, median points | 391 | **226** (−42%) |
| ...slots filled | 15 | **18** |
| **college answer still on the card** | **7/90 · 8%** | **86/90 · 96%** |

> **"More careers arrive at 19 with less banked" is confirmed on every column at once** – 12× more of
> them arrive with the third answer available, and they arrive with 45% less money, 93 rank places
> worse and a book worth 42% less. **The fork went from a formality to a real question**, which is the
> plan's own stated intent, and the population standing at it is materially poorer.

### 3.5 ⚠ The one bankruptcy at 14.8 – **it is 0 of 90, and that is a side effect rather than a fix. The failure mode is intact.**

| | P0 | P1+P2 | P3 | **now** |
| --- | --- | --- | --- | --- |
| bankruptcies | 1 · at **15.3** | **1 · at 14.8** ⚠ | 0 | **0 / 90** |
| earliest career-ending event of any kind | 15.3 | – | 24.9 | **24.9** |
| ever in debt | 39/90 · median week 121 | 40/90 | – | **40/90 · median week 156** |

**The answer to "is it still 1?" is no – it is zero.** But it must not be read as closed:

⚠ **NOTHING WAS FIXED. THE RULING THAT CREATED IT IS STILL SHIPPED.** `w15.minAgeYears` is still 14
(the owner's ruling of 16.08), a fourteen-year-old still enters W15s (**0.3 a year at 14, 4.4 at 15**),
and a W15 still costs a $300 entry plus $1,000–2,200 of travel against a family at its poorest. **What
removed the bankruptcy was P3's acceptance cuts changing which events she could afford to reach** –
J300's 0.40 → 0.20 alone took 19 careers of 90 off that rung. The mechanism is untouched.

⭐ **The surrounding evidence is genuinely good, though, and it is why this is a note rather than a
warning.** The median first red week moves **121 → 156** (five weeks of her life later), the earliest
career-ending event of any kind moves **15.3 → 24.9**, and the debt rate is flat at 44%. **A career can
no longer die before twenty-five in this build.** The 14.8 bankruptcy was the only counter-example and
it is gone; if a later phase moves the junior economy again, this is the row to re-read first.

### 3.6 ⚠ The third answer's price – **replicated, and the decomposition inverts what it is a finding about**

`tools/college-price-probe.ts`, **new in this phase**, because P5's probe was scratch and P6 owns the
question. Same construction, same n: **52 careers reach the fork with the answer still on the card.**

| over four years, median | **COLLEGE** | **ON TOUR** | difference |
| --- | --- | --- | --- |
| funds delta | **+$151,527** | **+$44,974** | **college banks $106,553 more** |
| *P5's figures, for the check* | *+$152,243* | *+$45,544* | *$106,699* |
| ...of which **earned** | $155,066 | **$422,351** | the tour earns **$267,285 more** |
| ...of which **spent** | **$4,830** | **$380,436** | college avoids **$375,606** |
| ...prize inside that | $0 | $265,320 | – |
| professional rank after | unranked (0/52) | **#165** (48/52) | |
| careers that ended | 0/52 | 0/52 | neither arm kills anybody |

**P5 replicates to within $716 on a four-year figure**, which is the receipt that no engine constant
has moved since (the only engine commit after that measurement, `cfbdd76`, changed the epilogue's
wording and nothing else). §5.2 is the lever.

> ### ⭐⭐ AND THE DECOMPOSITION SAYS THIS IS NOT A FINDING ABOUT COLLEGE.
> **The scholarship pays her nothing** – college's prize over four years is **$0**, and its $155,066
> of "earned" is the family's own income, which is **$157,031 in the tour arm too**. The two arms earn
> the same living. **100% of college's advantage is avoided spend.**
>
> Netting the tennis out of both arms:
>
> | four years, 19 → 23 | tennis in | tennis out | **net** |
> | --- | --- | --- | --- |
> | ON TOUR | $265,320 prize | $380,436 cost | **−$115,116** |
> | COLLEGE | $0 | $4,830 | **−$4,830** |
>
> **The professional tour loses this family $115,116 between nineteen and twenty-three.** College is
> not paying her; **the tour is charging her**, and college is where the charging stops. The
> $106,553 is the tour's operating loss with a different sign on it.

---

## ⭐ 4. THE HORIZON – the debt P1 booked, and it is paid

`docs/specs/play-down-2026-08.md` §3d recorded the one measurement it could not take:

> *"**THIS IS THE ONE NUMBER P6 SHOULD RE-TAKE ON A LONGER HORIZON.** …a career that spends five years
> inside the top 150 meets it every week of them and this run sees one."*

Its horizon was 416 weeks and ended at twenty-two, so **the top-50 limb of the strong-out rules – WTA
top 50 barred from every W event – had literally never fired.** P0's battery runs 676 weeks to 26.6,
which is the horizon that can exercise it. `npx vite-node tools/play-down-probe.ts -- --seeds 10
--weeks 676`, n = 90, same policy:

| | P1 (416 weeks, n 27) | **P6 (676 weeks, n 90)** |
| --- | --- | --- |
| careers that ever reach WTA top **150** | 16/27 · 59%, mean age 20.3 | **76/90 · 84%, mean 20.6, median 19.8** |
| **careers that ever reach WTA top 50** | **0 / 27 – never fired** | **14/90 · 16%, mean 22.5, earliest 20.0** ⭐ |
| careers the rule ever refused | 16/27 · 59% | **76/90 · 84%** |
| weeks per career it was refusing | mean 13.6, median 8, max 59 | **mean 123.1, median 90, max 387** |
| refusals at W15 / W35 | 368 / 368 | **11,081 / 11,081** |
| **refusals at W50 / W75 / W100** | **0 / 0 / 0** | **2,032 / 2,032 / 2,032** ⭐ |
| ⚠ weeks with NOTHING open on the ladder | **0** | **0** |
| careers with any such week | 0/27 | **0/90** |

> ### ⭐ BOTH LIMBS ARE NOW EXERCISED BY REAL CAREERS, AND THE RULE IS ~9× MORE ACTIVE THAN P1 COULD SEE.
> The **top-50 limb fires for the first time**: 14 careers of 90 reach it, and the 2,032 career-weeks
> of W50/W75/W100 refusals are its signature – no other clause can shut those three rungs. P1 said its
> +1.8% *"is not a measurement of the rule at maturity"*; at maturity it is refusing something in 84%
> of careers for a median of 90 weeks each.
>
> ⭐ **AND THE RISK IT CARRIES STILL DOES NOT MATERIALISE.** The boredom failure the owner has ruled
> against twice – a girl inside #150 losing W15 and W35 while the Accelerator holds everything above
> them shut – produces **zero empty weeks across all ninety careers on the full horizon**, up from
> zero across twenty-seven on the short one. That is the strongest form the check has ever been run in.

⚠ **THE HORIZON IS CONFIRMED RATHER THAN ASSUMED.** `SEASONS = 13` × `WEEKS_PER_YEAR` = 676; the tool
prints its own age range (13.6 → 26.6) and §2b's career-high ages run to 26.6. The brief's requirement
that the horizon reach past 22 is met with four and a half seasons to spare.

---

## ⚠⚠ 5. FOR THE OWNER – WHAT I WOULD RETUNE, BY HOW MUCH, AND WHY. NOTHING HERE WAS PULLED.

**No balance constant moved in this phase.** The plan's instruction was explicit – *"DO NOT
pre-emptively compensate… If a compensation is needed, the honest lever is the points table or the
calendar's density, not quietly loosening the rules we just added"* – and it is followed to the letter.
What follows is a recommendation with sizes, for him to decide.

### 5.0 First, the two levers the plan named, and why I recommend NEITHER

* **The calendar's density is already up.** She plays **265 entries a career against 239**, and *more*
  in every single year from fifteen on. There is no thinness to compensate. Pulling this lever would
  make a real problem worse.
* **The points table would fix the symptom at the wrong age and undo P3.** The book at nineteen is
  worth 226 against 391 – restoring it means **+73% on what fills it, which is W15**. But by
  twenty-one the book is already **421 against 381** and the rank is already **better**. A +73% move
  would inflate every rank in the world from twenty-one on, and the columns P3 bought (#174 at 21,
  #158 at 25, +$57k career) are exactly what it would spend.

**So the plan's own two candidate levers are both wrong for what was actually measured, and that is a
finding rather than an evasion.** The cost is not thin tennis and it is not cheap points in general –
it is **one rung, at one age.**

### 5.1 ⭐⭐ THE ONE I WOULD RETUNE: the Accelerator is coded as a CEILING, and P1's own spec says it should not be

**What it is.** `juniorAccessOpen` (`src/engine/world/ladder.ts`) refuses a junior every W rung above
W15 unless the Accelerator's year-end junior table admits her – **regardless of the professional
ranking she actually holds.** `isJuniorAge` is `age <= 18`, so this governs her entire eighteenth year.

**Why it is worth his attention.** P1's own comment states the opposite intent, twice:

> *"**It is not asked of an adult.** …The Accelerator is a junior's route, not a ceiling on a
> professional – and the day it started capping professionals it would be modelling a rule that does
> not exist."*

And the regulation P1 quotes describes both mechanisms as **reserved access**, i.e. an *additional*
route for a junior who could not get in any other way – not a bar on one who could.

**How big it is – measured, not guessed:**

| | n = 90 |
| --- | --- |
| careers holding a WTA rank at 17 inside **W35's own #700 cut** | **62 / 90 · 69%** |
| ...and refused entry anyway, by age rather than by merit | **all 62** |
| careers at 17 inside W50's #330 | 7/90 · 8% |
| careers at 17 inside W75's #300 | 3/90 · 3% |
| W15 share of her eighteenth season | **20.6 of 23.9 entries · 86%** |
| median first entry, W35 / W50 / W75 | **19.0 / 19.0 / 19.0** – one birthday, three doors |

> **The bar that bites is W35's and only W35's.** At W50 and W75 the acceptance cuts refuse her
> anyway (only 7 and 3 careers of 90 clear them at seventeen), so removing the age bar there changes
> almost nothing. **At W35 it would change everything: 62 careers of 90 already clear the rung's own
> cut and are held out by their birthday.**

**THE PROPOSAL, STATED SO HE CAN SAY NO TO IT PRECISELY:** make the Accelerator **additive rather than
exclusive** – a junior enters a W35+ if the Accelerator admits her **OR** her professional ranking
clears that rung's own acceptance cut. One clause, in one function.

⚠⚠ **AND I MUST BE HONEST THAT THIS IS EXACTLY WHAT THE PLAN WARNED ABOUT.** In effect it *loosens a
rule we just added*, which the plan calls the dishonest lever. My argument that it is nonetheless the
right one is that it is a **correctness** claim rather than a balance one – P1's own comment and P1's
own sourced regulation both describe an additive route, and the code implements a ceiling. **But that
is an argument, not a ruling, and the ruling is his.**

⚠ **THE SIZE IS BOUNDED, NOT MEASURED, AND SAYING SO IS THE POINT.** P0's world (no age bar at all,
looser cuts) put her at **#246 at seventeen**; this build puts her at **#423**. A change that opens
W35 alone to 69% of seventeen-year-olds lands somewhere inside that band and nowhere outside it.
**Measuring it is a phase, not a paragraph** – it is a re-run of this battery on one changed clause,
and it should be its own arm with its own predictions, exactly like every phase before it.

### 5.2 The third answer's price – **I recommend pulling NOTHING, and here is the size if he disagrees**

§3.6 changes what the question is. The scholarship pays **$0**; both arms earn the same family income;
**100% of college's $106,553 advantage is spend the tour would have charged her.**

**So there is no college knob to turn.** The candidate levers, sized:

| lever | what it would have to be | why I advise against it |
| --- | --- | --- |
| make a college year cost the family | **$26,638 / year** (to close $106,553 over four) | invents a cost the sport does not have – a full scholarship covers attendance – and makes the third answer strictly dominated: 121 places worse *and* no money |
| raise what the tour pays | **prize +40%** on $265,320 over four years | global; would move every money column in §2d and every sponsor gate keyed to them |
| cut what the tour costs | **−28%** on $380,436 | same objection, and it is the same lever `compound-cost-2026-08.md` already tuned deliberately |

> ⭐ **AND THE MODEL IS PROBABLY RIGHT.** A player around **#165** losing money on tour is not a bug in
> this game; it is the sport. The trade P5 shipped – **121 ranking places for $106,553** – is a real
> trade, it is the *"invest without knowing the return"* question the design is about, and the card
> already states both halves. **My recommendation is to leave it and let the player meet it.**
>
> ⚠ **The one thing I would NOT leave is the sentence.** P5's epilogue and card describe the money
> honestly, but nothing anywhere tells the player that **the tour itself is loss-making at her rank**.
> That is a copy question, not a balance one, and it is the cheapest thing on this page.

### 5.3 Three smaller things this page found that nobody asked for

1. **⚠ A shipped comment is wrong.** `tools/e2e-fixtures.ts` says *"her first ranking is now the ITF
   one"*. It is the **domestic** one, in 90 careers of 90 (§3.2). The fixture recipe's *behaviour* is
   correct – it accepts a ranking on any table – only its explanation is wrong. Fixing the comment is
   free and this phase deliberately did not do it, because the corpus is the wave owner's and a
   one-word edit to a file that regenerates binaries is not a measurement phase's to make.
2. **P0's battery is missing the column that mattered.** `points per filled slot` is what moved
   (13.4 → 27.2 between 19 and 21) while both of the columns P0 froze – points, and slots – pointed
   the wrong way on their own. A later phase should carry it.
3. **The ladder sorts on a birthday between W35 and W75.** All three medians are 19.0 (§2a). Whatever
   is decided about §5.1, three doors that open on the same day are one door.

---

## 6. WHAT THIS WAVE EDITS

| file | change | risk |
| --- | --- | --- |
| `docs/specs/the-remeasure-2026-08.md` | this file | none |
| `tools/first-ranking-probe.ts` | **new.** Measurement only – §3.2, the debt `tools/e2e-fixtures.ts` booked | none |
| `tools/college-price-probe.ts` | **new.** Measurement only – §3.6, replaces P5's uncommitted scratch probe | none |

**NO ENGINE FILE IS TOUCHED. NO BALANCE CONSTANT MOVES. NO TEST MOVES. Nothing under `src/` changed.**

**Reproduce:**

```bash
npx vite-node tools/ladder-baseline.ts                          # §2 – P0's frozen battery, unchanged
npx vite-node tools/play-down-probe.ts -- --seeds 10 --weeks 676  # §4 – the strong-out rules at maturity
npx vite-node tools/first-ranking-probe.ts -- --seeds 10 --weeks 676  # §3.2
npx vite-node tools/college-price-probe.ts -- --seeds 6         # §3.6
```

---

## 7. WHAT THE NEXT PHASE MUST NOT READ OFF THIS

* **Every "before" number in P1–P5's specs is against the phase before it, not against P0.** §3.1 is
  the worked example: P2's "+126 places at seventeen" is really **+177**, and P2 was not wrong – it was
  measuring a different subtraction. **Quote P0's column or say which arm you mean.**
* **"The book thinned" is now a retired hypothesis.** It filled and got cheap (§2e). A phase that cuts
  entries should watch **points per slot**, not slots.
* **§5.1's size is a BOUND (#246 … #423), not a measurement.** Nobody has run the counterfactual. Do
  not quote the bound as the answer.
* **The 14.8 bankruptcy is at zero for a reason unrelated to it (§3.5).** The ruling that created the
  failure mode still ships. Re-read this row after any change to the junior economy.
* **The retirement question is still never answered and the fork is still never answered** – both are
  stable properties of the battery, inherited from P0, and they are what make this diff comparable.
* **Right-censoring.** 89 of 90 careers are still running at 26.6. Career high, career prize and career
  length are *"by 26.6"*, never lifetime.
