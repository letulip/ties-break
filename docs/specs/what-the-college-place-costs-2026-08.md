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
  background: FamilyBackground   // ⚠ read ONLY by the need layer
  country: string                // ⚠ read ONLY by the need layer and the sticker
}
```

Three fields, and none of them is a professional result. `tests/college-offer.test.ts` block A pins the
key set, so an agent who adds `rank` or `prizeCents` to re-create the rule trips a test before they
trip a review.

**Why a junior CAREER RECORD and not a junior RANK.** `bestFinishByTier` is a high-water mark that
never goes backwards and the junior rungs close at eighteen, so the offer measured on her nineteenth
birthday is the offer any later week would compute. It is also what a coach is actually looking at:
§1c of the research has the commitment made at **sixteen or seventeen**, on a body of junior results.

**The score, and it is ours.** §4 item 3 of the research is explicit that the ranking distribution of
incoming D-I freshmen could not be sourced, so there is no real curve to copy:

| | j300 | j60 | j30 |
| --- | --- | --- | --- |
| rung weight | 3 | 2 | 1 |
| won it (finish 1) | | 4 | |
| final (2) | | 3 | |
| semi (≤4) | | 2 | |
| quarter (≤8) | | 1 | |

`score = Σ weight × round`, max 24. **strong ≥ 12 · solid ≥ 5 · small ≥ 1 · walk-on = 0.**

### 1c. ⚠ A MODEST OFFER IS NOT A REFUSAL, AND A REFUSAL IS NOT A CLOSED DOOR

Two separate things, and the phase turns on keeping them separate:

* **A weak record buys a small share at a small programme.** One junior quarter-final anywhere is
  enough for a place. She is never turned away for having played badly.
* **An EMPTY record – never a quarter-final at any junior rung in a whole junior career – buys no
  athletics money.** ⚠ **And she still enrols.** A roster limit is a ROSTER limit and not a
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
