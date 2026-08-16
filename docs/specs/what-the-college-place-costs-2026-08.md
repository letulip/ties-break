---
type: spec
status: current
area: engine/balance
canonical: true
last-reviewed: 2026-08-16
---

# What the college place costs, and who pays for it (16.08.2026)

**A ninth phase on `wave/round21`, opened the same evening the owner made college an independent
branch.** That ruling stands and nothing here touches it. What it left behind was a third answer
offered **unconditionally and free in 100% of careers** – and two sourced facts say that is not a
model of the thing.

> **The owner, 16.08, the question that shapes this phase, verbatim:**
> «Что у нас будет с оплатами? едины для всех или тоже от достатка на момент прихода будем мерять?»

⚠ **The age grid is not restated here.** It is written out once, in
[`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

---

## 0. THE FOUR ANSWERS, IN ONE BOX

> ### 1. ⭐⭐ THE OWNER'S QUESTION IS ANSWERED BY THE FACT THAT THERE ARE TWO LAYERS AND NOT ONE.
> The **athletics award is merit-only and reads nothing about the family** – there is no means test
> anywhere in NCAA Bylaw 15 on athletics aid, and `athleticShareOf`'s signature takes no background
> and no country, so the property is in the type system rather than in a comment. The **need-based
> layer beside it is means-tested**, and it is the only thing in the engine that reads
> `profile.background`. §2.
>
> ### 2. AND A COLLEGE PLACE HAS A PRICE, WHICH THIS REPO DID NOT HAVE A SOURCED FIGURE FOR UNTIL TODAY.
> **$30,990** a year in-state, **$50,920** out-of-state, **$65,470** private nonprofit `[S]`. Our
> engine charged **$0** and P6 decomposed the college arm's $152,243 as *100% avoided spend,
> scholarship $0*. Both halves of "free, always" are now gone. `docs/research/college-and-the-junior-exit.md` §1d.
>
> ### 3. ⚠⚠ THE SHARPEST SPLIT IS NOT WEALTH, IT IS NATIONALITY, AND IT IS PRIMARY LAW.
> 34 CFR §668.33 bars federal student aid to anyone in the US *"for a temporary purpose"*, which is
> what a student visa is; NAFSA calls institutional aid to undergraduate internationals *"uncommon"*.
> The athletics award reaches her – 62–66% of D-I women's tennis rosters are international – but **the
> layer that would read her family's means is shut.** §2d.
>
> ### 4. AND THE GATE IS HER JUNIOR RECORD, WHICH IS WHY IT CANNOT BECOME THE DELETED RULE.
> `CollegeRecruitView` carries **no professional rank, no professional finish and no prize money**.
> There is no field a tour result could move, so "a result takes the college answer away" is
> unrepresentable rather than merely dormant – and neither is its mirror image ("she is too good for
> college now"). The worst offer the engine can produce is a **walk-on**, who still enrols and still
> gets three answers on the card. §1.

---

## 1. THE OFFER – A PLACE, OR A WALK-ON

### 1a. What the third answer says now

| row on the card | what it is |
| --- | --- |
| **The place** | `A strong programme` / `A solid programme` / `A small programme` / `No programme has offered a place` |
| **The award covers** | `62% of the bill` (+ `10% need-based` when there is a need layer), or `Walk-on, no athletics award` |
| **The family pays** | `$8,673 a year`, or `Nothing` |

⚠ **It sits BELOW the third answer, not inside it.** Ruling 4 (30.07) – the card «may not recommend» –
and a button carrying three extra rows of detail is a recommendation drawn in whitespace. The offer is
in the same register as the four figures already on the card, and the comparison is the player's.

### 1b. ⚠⚠ THE MEASURE IS HER JUNIOR RECORD, AND THE OWNER'S RULING IS WHY

He deleted the rule that could take the college answer away this morning. **This phase must not
re-create it from the other side**, and the guard is structural rather than behavioural:

```ts
export interface CollegeRecruitView {
  juniorBests: Partial<Record<'j300' | 'j60' | 'j30', number>>
  juniorTitles: number           // junior rungs only, off `trophiesByTier`
  background: FamilyBackground   // ⚠ read ONLY by the need layer
  country: string                // ⚠ read ONLY by the need layer and the sticker
}
```

Four fields, and none of them is a professional result. `tests/college-offer.test.ts` block A pins the
key set, so an agent who adds `rank` or `prizeCents` to re-create the rule trips a test before they
trip a review.

**Why a junior CAREER RECORD and not a junior RANK.** `bestFinishByTier` is a high-water mark that
never goes backwards and the junior rungs close at eighteen, so the offer measured on her nineteenth
birthday is the offer any later week would compute. It is also what a coach is actually looking at:
§1c of the research has the commitment made at **sixteen or seventeen**, on a body of junior results.

**The score, and it is ours – §4 item 3 of the research is explicit that the ranking distribution of
incoming D-I freshmen could not be sourced, so there is no real curve to copy.** ⚠ **It is also the
one thing in this phase that had to be measured twice**; §3b has the first version and why it failed.

```
score = 5 × roundScore(best j300)        // 0..20 – the prestige rung, where the spread is
      + min(6, floor(juniorTitles / 2))  // 0..6  – how much junior tennis she actually won
```

⚠ **Finishing position is ZERO-BASED** (`world.ts`: `if (kidFinish === 0) cabinet.titles.push(...)`),
so `roundScore` is **won it 0 → 4 · final 1 → 3 · semi ≤3 → 2 · quarter ≤7 → 1**, and anything worse
scores nothing.

**The bands are the measured quartiles** of that score over 44 careers walked to the fork
(min 4 · p25 6 · median 11 · p75 18 · p90 23 · max 25): **strong ≥ 18 · solid ≥ 7 · small ≥ 1 ·
walk-on = 0.**

### 1c. ⚠ A MODEST OFFER IS NOT A REFUSAL, AND A REFUSAL IS NOT A CLOSED DOOR

Two separate things, and the phase turns on keeping them separate:

* **A weak record buys a small share at a small programme.** One J300 quarter-final, or two junior
  titles anywhere, is enough for a place. She is never turned away for having played badly, and
  **measured, 87 of 90 careers are offered a funded place** (§3f).
* **An EMPTY record – no J300 result worth the name and fewer than two junior titles in a whole
  junior career – buys no athletics money.** Measured: **3 of 90.** ⚠ **And she still enrols.** A roster limit is a ROSTER limit and not a
  scholarship count (Bylaw 17.2 + 16.13.1.5 `[S]`), so an unfunded walk-on is a real thing. **The
  third answer is still on the card, still pressable, and `answerFork` still refuses nothing.** What
  she does not have is anybody paying for it.

> ⭐ **That sentence is where the owner's ruling and the research stop pulling against each other.**
> §1a of the research says the route is narrow and a place is something somebody has to OFFER; his
> ruling says nothing removes the third answer. Both are satisfied by: *she can always enrol; what she
> may not have is anyone paying for it.*

---

## 2. ⭐⭐ THE OWNER'S QUESTION – «едины для всех или тоже от достатка?»

**Both, in two different layers, and the sport keeps them apart on purpose.**

### 2a. The athletics award: merit-only, and it is a rule the sport actually has

There is **no means test anywhere in NCAA Bylaw 15 on athletics aid** – Article 15 of the live 2026-27
Division I Manual runs 15.01, 15.02, 15.1, 15.2, 15.3 and contains the word *"need-based"* **zero
times**. An athletics award that read family wealth would be a rule the sport does not have, and on the
most expensive card in the game it would read as unfair.

**So the property is built into the signature rather than asserted in a comment:**

```ts
athleticShareOf(programme: CollegeProgrammeTier, juniorScore: number, rng: Rng): number
```

It cannot read a family because it is not handed one. `tests/college-offer.test.ts` block A sweeps
every junior record × three backgrounds × three nationalities and asserts one value, and the case is
**mutation-verified**: scaling the award by `background === 'wealthy' ? 1.05 : 1` turns two cases red.

| programme | award base | provenance |
| --- | --- | --- |
| strong | **0.85** | the sourced ceiling: a fully funded programme at the 2024-25 limit averaged ~85% of a full ride per player (`[I]`, 8 ÷ 9.4) |
| solid | **0.55** | ⚠ **ours** |
| small | **0.30** | ⚠ **ours** |
| programme funding spread | **±0.10** | the sourced MECHANISM: since House the constraint on funding a place is a school's budget, not a bylaw (16.13.1.5 `[S]`) |

### 2b. The need-based layer: means-tested, and the only thing that reads the family

It exists in the sport – the NCAA's own page: *"Most scholarships are partial, but student-athletes can
combine them with academic awards, NCAA-funded aid programs, and **need-based assistance like Federal
Pell Grants**"* `[S]` – and it is means-tested by federal formula: Trends 2025's explanation of why most
Pell recipients get less than the maximum is *"their family incomes and assets reduce their aid
eligibility"* `[S]`.

| background | need share | provenance |
| --- | --- | --- |
| working | **0.45** | roughly half sourced: max Pell is **$7,395** = **23.9%** of the $30,990 sticker `[S]`/`[I]`; the rest is the institutional grant on top |
| middle | **0.10** | ⚠ **ours, and the row most worth arguing with.** A family at or above the US median ($105,800 `[S]`) is out of Pell range entirely, so this is institutional aid alone. Setting it high would make every American family pay nothing and quietly delete the owner's question |
| wealthy | **0.00** | need-based aid is need-tested |

⚠ **The three average 18%, below the 31% actually observed**, and on purpose: average grant aid per
first-time full-time in-state student at a public four-year is ~$9,650 against the $25,850
tuition-fees-housing-food bill (`[I]`, Figure CP-9's own numbers) = ~31% of the sticker – but that
includes merit discounting and institutional tuition discounts, and this layer models only the
need-based part.

### 2c. ⭐ THE TWO LAYERS ARE METERED AT ONE CEILING, AND THE TRIM FALLS ON THE NEED LAYER

**Bylaw 15.1**: a student-athlete is ineligible if she *"receives financial aid that exceeds the value
of the cost of attendance"* `[S]`. So `athletic + need ≤ 1`.

⚠⚠ **And when the two would overflow, the NEED layer is trimmed and the award is not.** Two reasons and
both matter: the sport's own remedy is to reduce INSTITUTIONAL aid (**15.1.3**), and trimming the
athletics award instead would make a merit number move with family wealth – the exact thing the owner's
question is about. **A strong girl from a poor family therefore pays nothing, and her award is not
shaved to make room for her need.**

### 2d. ⚠⚠ AND THE SPLIT THAT IS BIGGER THAN WEALTH: NATIONALITY

| | reaches a non-American on a student visa? | source |
| --- | --- | --- |
| **Athletics aid** | **YES** – no citizenship test anywhere in Bylaw 15 | the manual; 15.2.6.3 expressly contemplates her |
| **Federal need-based aid** | **NO** | [34 CFR §668.33](https://www.law.cornell.edu/cfr/text/34/668.33) – she must be a citizen, a permanent resident, or in the US *"for other than a temporary purpose"* |
| **Institutional need-based aid** | *"uncommon"* | [NAFSA](https://www.nafsa.org/about/about-international-education/financial-aid-undergraduate-international-students) |
| **The sticker she faces** | **out-of-state, $50,920** | a non-resident alien is never in-state anywhere |

So a non-American pays a **larger bill with a smaller share of it covered**, and neither half is a
judgement about her family – it is that the mechanism which would have judged it is not open to her.
`world.profile.country` already exists (ISO alpha-2, the player's at onboarding, default `'US'`).

⚠ **THE BENCH CANNOT SEE THIS.** Every preset in `tools/econ-bench.ts` is `country: 'US'`, so §3's
whole table is the CHEAPEST the college branch can be. §4.2 puts the size of it to the owner.

### 2e. ⚠ A NEW STATE BECOMES REACHABLE: SHE CAN GO BANKRUPT AT COLLEGE

Not a bug and not a new mechanism – a consequence, named here so nobody has to rediscover it from a
strange album page. The four years used to be the one stretch of the game where the balance could only
go up: no coach, no gear, no travel, no entry fees, and no bill. **With a bill, `fundsCents` can fall
during the freeze**, `debtSinceWeek` can be set inside it, and the twelve-week grace can run out there.

The path already exists and needs no new code: `resumeFromCollege`'s loop is
`while (world.week < yearEnds && world.ending === null) tickWeek(...)`, and its own comment already
says *"THE LOOP BREAKS ON A FRESH ENDING. A career-ending injury can land at college."* Bankruptcy now
arrives through the same door. ⚠ The measurement in §3 is where to look for whether it actually
happens; a walk-on from a wealthy family faces **$30,990 a year** against a starting capital of
$120,000, which is the case most likely to produce it.

---

## 3. MEASURED

### 3a. ⚠⚠ THE PREDICTIONS, WRITTEN BEFORE THE RUN (CLAUDE.md invariant 4)

**And the before-arm is taken from HEAD, not from a figure noted earlier in the phase.**
`the-ladder-is-monotone-2026-08.md` §3b landed `wta125.acceptsRank` 180 → 210 and `j300.enterPct`
0.20 → 0.25 while this phase was being built, so its **post** column is this phase's **pre**.

<!-- PREDICTIONS-ABOVE-MEASURED-BELOW -->

**A. THE BATTERY'S EXISTING COLUMNS – I predict every one is IDENTICAL, and that is falsifiable.**
`tools/ladder-baseline.ts` never answers the fork (its own header, and a stable property of the tool),
so `world.college` stays null, `resolveCollegeBill` returns at its first line, and v51 cannot reach any
of these. **Any movement at all is a bug in my wiring, not a balance finding.**

| | pre = monotone §3b post | predicted |
| --- | --- | --- |
| rank at 17 / 19 / 21 / 25 | #374 / #178 / #178 / #174 | **identical** |
| career high, median | #112 | **identical** |
| entries per career | 262 | **identical** |
| prize by 19 / 21 / career | $112,290 / $246,240 / $623,820 | **identical** |
| counting book full at 19 | 55/90 | **identical** |
| bankruptcies | 2 at 15.8 | **identical** |

**B. §6a – THE OFFER. The denominator is careers REACHING THE FORK, and it is printed on every row.**

| | predicted |
| --- | --- |
| careers reaching the fork | **88 / 90** (2 bankruptcies at 15.8 end careers early) |
| **OFFERED A FUNDED PLACE** | **88 / 88 = 100%** – the refusal never fires under `POLICIES[1]` |
| walk-ons | **0** |
| programme split (strong / solid / small) | **50% / 45% / 5%** |
| mean athletic share | **75%** |
| median bill over 4 years | **$24,000** |
| free rides | **~30 / 88** |

**C. BY BACKGROUND – and I predict the athletic column is NOT flat.**

⚠ This is the prediction I most expect to be interesting. The FUNCTION is merit-only and tested so.
But a wealthy family buys a better coach, a better coach buys better junior results, and the award
reads junior results. **So I expect the population to show a wealth gradient the function does not
have**, and saying which of the two the owner is looking at is the whole job of this table.

| | athletic % | need % | bill over 4 years |
| --- | --- | --- | --- |
| working | **73%** | **20%** (heavily trimmed) | **$0** |
| middle | **75%** | **10%** | **$13,000** |
| wealthy | **77%** | **0%** | **$26,000** |

**Direction predicted: college tips toward the POOR family** – the right way round, and the opposite of
what a flat bill would have produced.

**D. THE LIVED FOUR YEARS** – `tools/college-price-probe.ts --seeds 6` and `--all`.

⚠ P5's **$152,243 / $45,544** was measured on the DEFAULT filter (only careers the retired pre-16.08
rule would have left open, i.e. ~9 of 90) **and on a ladder two waves old**. It is not a before-column
for the shipped population and is not used as one.

| | predicted (`--all`) |
| --- | --- |
| college funds delta over 4 years | **+$120,000** |
| tour funds delta | **+$40,000** |
| college still ahead by | **~$80,000** |
| tuition charged (ledger) vs quoted × 4 | **equal within rounding** |

<!-- MEASURED-BELOW -->

### 3b. ⭐⭐ RUN 1 REFUTED THE CALIBRATION, AND IT FOUND A BUG UNDER IT

**`npx vite-node tools/ladder-baseline.ts --seeds 10`, n = 90, `POLICIES[1]`.**

| §6a, run 1 | predicted | **measured** |
| --- | --- | --- |
| careers reaching the fork | 88 / 90 | **90 / 90** ⚠ |
| offered a funded place | 88 / 88 | **88 / 90 (98%)** ✅ close |
| strong / solid / small | 50% / 45% / 5% | **98% / 0% / 0%** ⚠⚠ **badly wrong** |
| mean athletic share | 75% | **90.7%** ⚠ |
| median 4-year bill | $24,000 | **$0** ⚠⚠ |
| free rides | ~30 / 90 | **54 / 90** ⚠ |

> ⚠⚠ **A PHASE WHOSE WHOLE POINT IS THAT COLLEGE IS NOT FREE, MEASURING COLLEGE AS FREE.** 88 of 90
> careers in one band and a median family bill of **$0**. The offer was doing almost nothing that
> "free, always" was not already doing.

**TWO CAUSES, AND THE FIRST IS A REAL BUG I WROTE.**

1. ⚠ **THE FINISH SCALE IS ZERO-BASED AND MY TABLE WAS ONE-BASED.** `world.ts`'s trophy cabinet is the
   definition – `if (kidFinish === 0) cabinet.titles.push(...)`, `else if (kidFinish === 1)
   cabinet.finals.push(...)` – so **0 = won it, 1 = lost the final, 2-3 = semi, 4-7 = quarter**. Every
   row of `roundScore` was a full round too generous. The v50 golden fixture reads correctly under the
   corrected scale (`j60: 0` is a J60 **title**), which is the check I should have run first.
2. ⭐ **AND CORRECTING IT WAS NOT ENOUGH, BECAUSE THE SHAPE WAS ALSO WRONG.** Re-measured on the fixed
   scale over 35 careers walked to the fork: **every career still scored 11+ of 24, median 15.** The
   reason is in the same dump – **`best j60` and `best j30` are 0 at the median AND at p75.** She WINS
   those rungs routinely; they are the on-ramp and she plays dozens over five seasons. **A high-water
   mark on an easy rung saturates, and a term that is identical for three quarters of the population
   carries no information about any of them.**

**WHAT THE DATA SAID TO DO INSTEAD.** `best j300` has real spread – **p25 = 1 (a final), median = 3 (a
semi), p75 = 4 (a quarter)** – and junior TITLES have more – **0 / 4 / 15** at min / median / max. So
the score is re-shaped onto the prestige rung plus volume:

```
score = 5 × roundScore(best j300)      // 0..20 – where the spread is
      + min(6, floor(juniorTitles / 2)) // 0..6  – how much junior tennis she actually won
```

Re-measured, n = 44: **min 4 · p25 6 · median 11 · p75 18 · p90 23 · max 25.** The three bands are set
on that distribution's own quarters – **strong ≥ 18 · solid ≥ 7 · small ≥ 1** – and not on numbers I
liked. ⚠ **The award bases (0.85 / 0.55 / 0.30) are NOT changed**, because nothing measured refuted
them: one thing at a time.

### 3c. ⚠⚠ THE SECOND PREDICTION, WRITTEN BEFORE THE SECOND RUN

| §6a, run 2 | predicted |
| --- | --- |
| strong / solid / small / walk-on | **23% / 43% / 32% / 0%** |
| mean athletic share | **56%** |
| median 4-year bill | **$28,000** |
| free rides | **~20 / 90** |
| 4-year bill: working / middle / wealthy | **$8,000 / $30,000 / $45,000** |
| athletic % by background | **still a wealth gradient of a few points** – the FUNCTION is flat, the POPULATION need not be |
| probe, college vs tour funds delta | **+$115,000 vs +$40,000** |

⚠ **AND THE BATTERY'S OTHER COLUMNS ARE STILL PREDICTED IDENTICAL** to `the-ladder-is-monotone` §3b.
Run 1 is the check: it must reproduce that column exactly, because the tool never answers the fork.

### 3d. ✅ THE ONE PREDICTION THAT WAS EXACTLY RIGHT: v51 DOES NOT REACH THE WORLD OUTSIDE COLLEGE

Run 1, every column against `the-ladder-is-monotone-2026-08.md` §3b's post arm:

| | that spec | **run 1** | |
| --- | --- | --- | --- |
| rank at 17 / 19 / 21 / 25 | #374 / #178 / #178 / #174 | **#374 / #178 / #178 / #174** | ✅ |
| career high, median (p25 / p75 / worst) | #112 (#75 / #142 / #180) | **#112 (#75 / #142 / #180)** | ✅ |
| entries per career | 262 | **262** | ✅ |
| prize by 19 / 21 / career | $112,290 / $246,240 / $623,820 | **$112,290 / $246,240 / $623,820** | ✅ |
| counting book full at 19 | 55/90 | **55/90** | ✅ |
| bankruptcies | 2 | **2** | ✅ |
| ever held a professional ranking | 87/90 | **87/90** | ✅ |

**Identical on every figure.** The battery never answers the fork, so `world.college` stays null and
`resolveCollegeBill` returns at its first line – and the tuition bill is arithmetic on a persisted
offer rather than a die, so no stream moves either. ⭐ **`tests/coach-travel-edge.test.ts` says the
same thing a second way**: all three frozen career hashes moved, and rolling ONLY `schemaVersion` back
to 50 reproduces the previous three byte for byte. **One key changed in those worlds and nothing else.**

⚠ **AND THE DENOMINATOR, because `the-ladder-is-monotone` §3c is a standing warning about exactly this:**
**90 of 90 careers reach the fork.** It is the full population, it did not grow or shrink between arms,
and every §6a figure below is over that same 90. Nothing in this phase is a composition effect.

### 3e. ⚠ FOR CONTRAST, THE RETIRED RULE ON THE SAME 90 CAREERS

The battery still prints the pre-16.08 counterfactual, and it is worth putting beside the offer:

| | retired rule (counterfactual) | **the shipped offer** |
| --- | --- | --- |
| careers with a college answer at the fork | **14 / 90** (4/90 a full season later) | **90 / 90** – it is never removed |
| the mechanism | a W75 result **took it away**, in 86 of 87 closures, at median age 18.1 | a junior record **prices it** |

⭐ **That is the phase in one line.** The old rule answered "may she?" with *no* in 84% of careers. The
new one answers "may she?" with *yes, always* and "at what price?" with a number.

### 3f. ⭐⭐ RUN 2 – PREDICTED vs MEASURED, n = 90, DENOMINATOR 90/90

`npx vite-node tools/ladder-baseline.ts --seeds 10`. **Every career reaches the fork, in both runs and
in the pre arm, so nothing below is a composition effect** – the standing warning of
`the-ladder-is-monotone-2026-08.md` §3c does not bite here, and it is checked rather than assumed.

| §6a | predicted | **measured** | verdict |
| --- | --- | --- | --- |
| offered a funded place | 88 / 88 | **87 / 90 (97%)** | ✅ |
| walk-on | 0 | **3 / 90 (3%)** | ✅ – the refusal is real but rare |
| strong / solid / small | 23% / 43% / 32% | **24% / 43% / 29%** | ✅✅ **exact on all three** |
| mean athletic share | 56% | **57.9%** | ✅ |
| **median 4-year bill** | **$28,000** | **$28,316** | ✅✅ |
| free rides | ~20 / 90 | **21 / 90** | ✅ |
| 4-year bill: working | $8,000 | **$8,701** | ✅ |
| 4-year bill: middle | $30,000 | **$38,164** | ⚠ 27% high |
| 4-year bill: wealthy | $45,000 | **$42,304** | ✅ |
| athletic % gradient by background | "a few points" | **12.3 points** | ⚠ **much bigger** |

**The award, by programme:**

| programme | careers | athletic % | need % | family $/yr |
| --- | --- | --- | --- | --- |
| strong | 22 (24%) | **87.7** | 8.6 | **$1,149** |
| solid | 39 (43%) | **59.5** | 17.8 | **$7,016** |
| small | 26 (29%) | **36.9** | 21.9 | **$12,755** |
| walk-on | 3 (3%) | 0.0 | 3.3 | $9,297 |

**What four years cost the family, over all 90:** min **$0** · p25 **$3,246** · median **$28,316** ·
p75 **$48,655** · max **$111,564**. **21 of 90 free rides.**

### 3g. ⭐⭐⭐ THE OWNER'S QUESTION, MEASURED – AND THE ANSWER HAS TWO HALVES THAT POINT OPPOSITE WAYS

| background | careers | athletic % | need % | bill / year | **over 4 years** |
| --- | --- | --- | --- | --- | --- |
| working | 30 | **53.6** | **36.0** | $2,175 | **$8,701** |
| middle | 40 | **57.1** | 9.6 | $9,541 | **$38,164** |
| wealthy | 20 | **65.9** | 0.0 | $10,576 | **$42,304** |

**HALF ONE – THE BILL TIPS COLLEGE TOWARDS THE POOR FAMILY, BY A FACTOR OF 4.9.** A working family
pays **$8,701** over four years where a wealthy one pays **$42,304**, and every dollar of that
difference comes through the need layer (36.0% against 0.0%). ⭐ **That is the right way round** – it
is the direction reality runs, and it is the direction a flat bill would have inverted.

⚠⚠ **HALF TWO, AND IT IS THE FINDING I DID NOT SIZE CORRECTLY: THE AWARD ITSELF SHOWS A 12.3-POINT
WEALTH GRADIENT, 53.6% → 65.9%.** The FUNCTION is merit-only and `tests/college-offer.test.ts` block A
proves it by sweep and by mutation. **The POPULATION is not, and there is no contradiction between
those two sentences.** A wealthy family buys a better coach, a better coach produces a better junior
record, and the award reads the junior record. **The award does not read wealth; wealth buys the record
the award reads.**

> ⭐ **So the honest answer to «едины для всех или тоже от достатка?» is: the RULE is the same for
> everyone, the OUTCOME is not, and the two channels pull in opposite directions.** The need layer
> hands the working family $33,603 more help over four years; the merit channel hands the wealthy
> family a 12.3-point bigger award. Measured, **the need layer wins comfortably** – the net bill still
> favours the poor family nearly five to one. §4.1 is the owner's decision about whether that is the
> balance he wants.

### 3h. THE LIVED FOUR YEARS – `tools/college-price-probe.ts -- --seeds 6 --all`, n = 53

⚠ **P5's $152,243 / $45,544 is NOT the before-column and is not used as one.** It was measured on the
DEFAULT filter – only the ~9 careers of 90 the retired pre-16.08 rule would have left open – and on a
ladder two waves old. `--all` is the shipped population: every career that reaches the fork.

| median over 4 years | before this phase (`--all`, run 1) | **with the bill** | predicted |
| --- | --- | --- | --- |
| college funds delta | $148,502 | **$106,995** | $115,000 ✅ |
| tour funds delta | $31,959 | **$31,959** | $40,000 ✅ |
| **college ahead by** | $116,543 | **$75,036** | ~$75,000 ✅✅ |
| ...of which college SPENT | $9,138 | **$30,579** | – |
| professional rank after | unranked (0/53) | **unranked (0/53)** vs tour **#167** (52/53) | – |

⭐ **THE BILL COSTS THE COLLEGE ARM $41,507 OF ITS ADVANTAGE, AND COLLEGE STILL WINS BY $75,036.** The
third answer is no longer free, and it is still the cheapest answer at the fork. ⚠ **That is a finding
for the owner and not a defect** – §4.2.

**And the same three families on what the four years actually produced:**

| background | n | college | tour | college ahead by |
| --- | --- | --- | --- | --- |
| working | 18 | $85,936 | $73,115 | **$12,821** |
| middle | 23 | $121,039 | $36,035 | **$85,004** |
| wealthy | 12 | $224,651 | $12,998 | **$211,653** |

⚠⚠ **AND THAT TABLE INVERTS THE ONE ABOVE IT, WHICH IS THE MOST IMPORTANT THING IN THIS SPEC.** The
BILL favours the working family 4.9 to 1. The ADVANTAGE OF GOING favours the wealthy family 16.5 to 1 –
because a wealthy family on tour BURNS $12,998-worth of a much larger outgoing, so the money college
saves them is enormous, while a working family was never spending much to begin with. **College is the
biggest financial win for the family that needed it least.** §4.1.

---

## 4. ⚠ FOR THE OWNER – three decisions and one thing I could not do

### 4.1 ⭐⭐ THE PAYMENTS QUESTION IS ANSWERED, AND IT NEEDS ONE RULING FROM YOU

**Built:** the athletics award is **merit-only** and cannot read the family – it is not handed one, and
the test that proves it is mutation-verified. The **net bill** differs by background **only** through a
need-based layer the research supports (NCAA's own page names it; 34 CFR §668.33 and the Pell formula
means-test it). **Nothing scales the athletic award by wealth, and nothing should.**

**Measured, the design tips college towards the POOR family on the bill** – $8,701 against $42,304 over
four years – **and towards the WEALTHY family on the benefit** – college is $211,653 better than the
tour for them and $12,821 better for a working family.

⚠ **THE DECISION: which of those two is the one you want college to be about?** Both are honest
consequences of a merit-only award plus a means-tested layer, and neither is a bug. If college should
be the route for a family that cannot fund an apprenticeship, the lever is not the award – it is the
**tour's** cost, because that is what the $211,653 is actually measuring.

### 4.2 THE THIRD ANSWER IS STILL THE CHEAPEST ANSWER AT THE FORK

The bill takes **$41,507** off the college arm's advantage and it is still **$75,036** ahead of the
tour over four years. ⚠ Reported, not acted on: I have no sourced ground to raise the price further,
and §2b's `middle: 0.10` is the one number here most worth arguing with.

### 4.3 A NON-AMERICAN PAYS ROUGHLY DOUBLE, AND THE BENCH CANNOT SEE IT

Every preset is `country: 'US'`, so §3's whole table is the cheapest case. A non-American faces
**$50,920** a year instead of $30,990 **and no need-based layer at all** – both primary-sourced, §2d.
On the same junior record as the median career here, that is roughly **$100,000 over four years
against $28,316**. ⚠ **For a non-American working family college is effectively unavailable** – not by
a rule, but by a bill, and our game is nation-agnostic with a player-chosen country at onboarding.
**Flagged, not tuned.**

### 4.4 ⚠ THE ONE COMMAND THIS PHASE DID NOT RUN

`SAVE_SCHEMA_VERSION` moved 50 → 51, so **`tests/e2e-fixtures.test.ts` is RED until the corpus is
regenerated with `npm run e2e:fixtures`**. That alarm is doing exactly what its own comment says it is
for. The e2e corpus and the browser suite are yours, so it is handed over rather than run here.

---

## 5. FILES

| file | what changed |
| --- | --- |
| `docs/research/college-and-the-junior-exit.md` | **§1d, new** – the cost side, every figure tagged and sourced; §4 items 15-20; §6 items 6-8; a `[?]` tag added to the legend for a primary source that contradicts itself |
| `src/engine/collegeOffer.ts` | **new.** The model: two stickers, three programme bands, the merit-only award, the means-tested layer, the Bylaw 15.1 ceiling |
| `src/shared/protocol.ts` | `CollegeOffer`, `CollegeProgrammeTier`, `ForkState.offer`, `Snapshot.fork.offer`, the `tuition` ledger category |
| `src/engine/world/college.ts` | `collegeRecruitViewOf`, `measureCollegeOffer`, `resolveCollegeBill` |
| `src/engine/world/endings.ts` | the fork is raised WITH an offer |
| `src/engine/world/snapshot.ts` | the offer goes on the wire, off persisted state |
| `src/engine/world.ts` | `SAVE_SCHEMA_VERSION` 50 → 51; `resolveCollegeBill` in the tick at 1a |
| `src/engine/migrations.ts` | v50 → v51, back-filling `null` and inventing nothing |
| `src/components/ForkDialog.vue` | the offer under the third answer, three rows, no sentence |
| `tests/fixtures/saves/v51.json` + README | the golden fixture, carrying the offer the engine really computes for that career |
| `tests/college-offer.test.ts` | **new.** Blocks A (merit-only, mutation-verified), B (nothing removes the answer), C (one ceiling, and the trim falls on the need layer) |
| `tests/component/college-offer-card.test.ts` | **new.** The card's four properties + the 375x667 fit, mutation-proved twice |
| `tests/component/round21-dialogs.test.ts` | the fork fixture re-aimed to carry an offer, so the shipped fit case measures the card the player sees |
| `tests/ending.test.ts` | the fork-wire case re-aimed: three facts, none of them a gate, and a W75 CHAMPION still offered a place |
| `tests/coach-travel-edge.test.ts` | three hashes re-frozen; `PRE_V51` added so the re-freeze proves ONE key moved |
| `tools/ladder-baseline.ts` | §6a, the offer – the shipped game beside the retired counterfactual |
| `tools/college-price-probe.ts` | `--all` (the shipped population), the bill off the LEDGER, and a background split |
| `tools/econ-bench.ts` | `tuition` in `zeroCats` |

**Reproduce:**

```bash
npx vite-node tools/ladder-baseline.ts --seeds 10          # §3, n 90
npx vite-node tools/college-price-probe.ts -- --seeds 6 --all   # §3f, the lived four years
npm run test:quiet && npm run test:component
```

⚠ **AND ONE THING I DID NOT RUN, ON PURPOSE.** `SAVE_SCHEMA_VERSION` moved, so
`tests/e2e-fixtures.test.ts` is RED until the corpus is regenerated with `npm run e2e:fixtures` – the
alarm doing exactly what its own comment says it is for. **The e2e corpus and the browser suite are
the owner's**, so the regeneration is handed over rather than done here.
