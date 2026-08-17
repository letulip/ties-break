---
type: spec
status: current
area: engine/balance
canonical: false
last-reviewed: 2026-08-17
---

# The college tariff – legible rungs, an annual drawdown, and a bill priced on what the family has (17.08.2026)

**A tenth phase on `wave/round21`, the day after the college place got a price.**
[`what-the-college-place-costs-2026-08.md`](what-the-college-place-costs-2026-08.md) built the offer,
the two layers and the ceiling. This phase makes the result legible, makes the money visibly leave,
and stops the means test reading a label.

> **The owner, 17.08, verbatim:**
> «По колледжу надо собрать понятные ступени с прозрачной оплатой и годовым списанием с учетом
> доходов семьи на момент поступления и прочего. Копят деньги и оплачивают. Какая дельта? Может она
> околонулевая будет или всё-таки расходы перевесят. Надо понять как тарифицировать грамотно для всех
> 3х слоёв.»
> And, confirming: «Колледж с годовым списанием – тоже надо сделать, да.»

⚠ **The age grid is not restated here.** It is written out once, in
[`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

---

## 0. THE FIVE ANSWERS, IN ONE BOX

> ### 1. ⭐⭐ THE ANNUAL DRAWDOWN ALREADY EXISTED. WHAT DID NOT EXIST WAS ANY SIGN OF IT.
> `resolveCollegeBill` has debited `familyPerYearCents / 52` from the family every week she is
> enrolled since v51, and written a `tuition` ledger row each time. **Nothing about the flow needed
> building.** What was missing was every surface that should have shown it – and **three shipped lines
> asserted the opposite**, on the two screens the player actually lives the four years on. §1.
>
> ### 2. ⭐⭐ THE DELTA IS NOT NEAR ZERO AND IT IS NOT NEGATIVE. IT IS BOTH, AND THE MEDIAN IS THE ONE STATISTIC THAT HIDES THAT.
> Median paired delta over 53 careers: **+$4,114** – about as near zero as a number gets. And the same
> 53 careers run from **−$1,073,962 at p10 to +$172,950 at p90**, with **25 of 53 (47%) better off on
> tour.** «Околонулевая» is true of the middle career and false of almost every individual one. §3f.
>
> ### 3. ⚠⚠ AND THE TARIFF IS NOT WHAT MOVED IT. THE WILD CARDS WERE.
> Three arms, each named by commit. Between the pre-wild-card baseline and this phase's own baseline
> the median delta fell **+$26,152 → +$4,114** and better-on-tour rose **43% → 47%** – and the only
> engine change between those two arms is another agent's wild-card commit. **This phase's own tariff
> then moved the median delta by $0 and the better-on-tour share by 0 careers.** §3d.
>
> ### 4. ⭐ THE NEED LAYER NOW READS THE FAMILY, NOT ITS LABEL – AND THE LABEL WAS MEASURABLY WRONG.
> At the fork a **working** family has saved **$57,555 at p75** while a **wealthy** one has saved
> **$21,297** – the wealthy career burned its capital on the tennis. The old table paid that working
> family the full 45% because a field set at onboarding said "working". §2.
>
> ### 5. ⚠⚠ THE MERIT-ONLY PROPERTY SURVIVED THE CHANGE, AND IT IS NOW MEASURED AND NOT ONLY TESTED.
> Athletic share by background, arm A′ vs arm B: **53.2 / 59.0 / 67.4** against **53.2 / 59.0 / 67.4**.
> Identical to the decimal on all three, with the programme split identical too. The award did not
> notice that a means test changed underneath it. §3c.

---

## 1. THE DRAWDOWN – IT WAS ALREADY THERE, AND THE GAME SAID IT WAS NOT

### 1a. ⚠⚠ THE FIRST THING THIS PHASE DID WAS READ THE CODE INSTEAD OF REWRITING IT

The brief was «годовым списанием» and the obvious reading is "build a yearly charge". The engine
already had one, and it is better shaped than a yearly charge would be:

```ts
export function resolveCollegeBill(world: WorldState): void {
  if (!inCollege(world)) return
  const offer = world.fork?.offer
  if (!offer || offer.familyPerYearCents <= 0) return
  const weekly = Math.round(offer.familyPerYearCents / WEEKS_PER_YEAR)
  ...
}
```

Its own comment gives the argument, and the argument is right: *"The family's balance is read every
week by the debt spell and by bankruptcy, and a $30,990 hole punched once a year would have made the
college branch a series of four cliffs rather than a cost of living."* **So the bill is an ANNUAL
price drawn down weekly** – which is exactly what the tour's costs are, and exactly what the owner
described («копят деньги и оплачивают»). It was not rebuilt.

### 1b. ⭐⭐ WHAT WAS ACTUALLY MISSING: FOUR SURFACES, THREE OF THEM SAYING THE OPPOSITE

| surface | what it said before | what it says now |
| --- | --- | --- |
| `MoneyScreen` category list | **nothing** – `tuition` was not in `EXPENSE_META`, so the money fell into **Other** | its own row, its own donut slice, its own hue |
| `ending.ts` ending detail | *"the family stops paying"* | *"the family pays its share of each year"* |
| `EndingScreen` college lead | *"the family stops paying"* | *"the family pays whatever the award does not"* |
| `EndingScreen` "Another year" button | *"and the family still pays nothing"* | the year's bill, with *"charged weekly"* |
| `ForkDialog` (the one that was fixed at v51) | the year's bill | + the funding band, + the four-year total |

> ⚠⚠ **THE FAILURE MODE IS WORTH NAMING BECAUSE IT IS NOT A TYPO.** When v51 gave college a price it
> fixed the ONE copy of "college is free" that sat on the card it was editing, and left the other
> three. The three it left are the ones the player meets *during* the four years – including the
> button that commits her to another year of a bill nothing on the screen named. **The screen built to
> answer "where did the money go" put the largest single outgoing of those four years into `Other`.**

### 1c. THE MONEY SCREEN, AND WHY `tuition` GOT ITS OWN HUE

`WorldEventCategory`'s own note calls it *"the first cost in the game that is not tennis"*, and the
colour follows the category: a deep academic red (`--cat-tuition: #c0453f`) against a table of limes,
blues and teals. It has to be able to be the largest slice on the ring for four years running without
reading as an alarm, and its nearest neighbour in hue (`gear`, #d97f52 at 20°) is far enough away that
the donut cannot confuse them.

---

## 2. ⭐⭐ THE OWNER'S SENTENCE – «с учётом доходов семьи на момент поступления»

### 2a. What the layer read before, and why that is not what he asked for

```ts
needShareByBackground: { working: 0.45, middle: 0.1, wealthy: 0 }
```

Three constants keyed on `profile.background` – **a value the player picks at onboarding, five seasons
before she enrols.** It is not her family's position at the moment of enrolment; it is the family they
started as. The previous spec's §2b already flagged `middle: 0.10` as *"the row most worth arguing
with"*.

### 2b. ⚠⚠ AND THE LABEL IS MEASURABLY WRONG ABOUT REAL FAMILIES

Measured at the fork, n = 53 (`college-price-probe --seeds 6 --all`):

| background | n | income p25 | income median | income p75 | savings p25 | savings median | **savings p75** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| working | 18 | $17,621 | $18,255 | $18,862 | $12,203 | $19,650 | **$57,555** |
| middle | 23 | $31,277 | $31,531 | $32,751 | $10,450 | $26,414 | **$53,415** |
| wealthy | 12 | $54,035 | $55,153 | $56,919 | $9,800 | **$15,518** | **$21,297** |

> ⭐⭐ **THE WEALTHY FAMILY HAS THE LEAST MONEY IN THE BANK WHEN SHE ENROLS.** Median savings
> $15,518 against the working family's $19,650, and the working family's p75 is nearly three times
> the wealthy family's. The reason is not subtle: a wealthy career spends its $120,000 of starting
> capital on an expensive junior apprenticeship, and a working one never had it to spend.
> **The label and the position disagree about the same family, and the bill was reading the label.**

### 2c. What it reads now

```ts
position = familyIncomeCents + max(0, familyAssetsCents − assetShieldCents) / assetSpreadYears
needShare = maxNeedShare × clamp01((noNeedAbove − position) / (noNeedAbove − fullNeedBelow))
```

| knot | value | provenance |
| --- | --- | --- |
| `maxNeedShare` | **0.45** | **unchanged.** Max Pell $7,395 = 23.9% of the $30,990 sticker `[S]`/`[I]`, plus the institutional grant on top. One thing at a time: this phase changes *who reaches the ceiling*, not where it is |
| the SHAPE (floor band → taper → cut) | – | **sourced.** Federal need aid has exactly this shape, and *Trends 2025* names both inputs in one clause: most Pell recipients get less than the maximum because *"their family incomes and assets reduce their aid eligibility"* `[S]` |
| `fullNeedBelowCents` | **$20,000** | ⚠ **ours** – the top of the measured **working** income band ($18,862 at p75), rounded out |
| `noNeedAboveCents` | **$35,000** | ⚠ **ours** – the top of the measured **middle** income band ($32,751 at p75), rounded out |
| `assetShieldCents` | **$25,000** | ⚠ **ours** – the middle preset's own starting capital: an ordinary family's whole cushion, taken from the game rather than from a formula |
| `assetSpreadYears` | **4** | the years she will be enrolled. Savings enter as *"how many years of this could you pay for"*, which is the arithmetic a parent does and is in the same unit as the bill |

### 2d. ⚠⚠ WHERE I FELL BACK, SAID PLAINLY – THE DOLLARS ARE NOT FEDERAL DOLLARS

**`familyIncomeCents` is `parentIncomeForWeekCents × 52` – the parents' contribution TO THE TENNIS, not
a household income.** It measures **$18k / $31k / $55k** at the fork against a US median family income
of **$105,800** `[S]`. Laying a real federal threshold over that axis would put every family in this
game inside Pell's floor band and hand all three of them the full 45% – **which deletes the owner's
question instead of answering it**, the identical failure `needShareByBackground.middle` was written to
avoid. So:

* **the shape is sourced, the two knots are ours**, calibrated on the game's own measured bands;
* **the asset rate is ours and deliberately not the federal one.** The real formula converts parental
  assets at a few per cent; measured on our scale that term is worth **$688 a year to the median
  family** – invisible beside an $18,000 income axis. Importing the rate would import the word
  "assets" without the effect, and «копят деньги» is the owner's own verb for the thing being modelled.

**And the background label is still on the recruit view** – but it no longer prices anything. It is
*upstream* of the income (`parentIncomeForWeekCents` is seeded from it) rather than the means test
itself. **There is no path where the share falls back to the label**: a career that reached the fork
before v51 carries a null offer and is charged nothing at all, which is a different thing.

### 2e. ⚠ THE ATHLETIC AWARD IS IN NONE OF THIS, AND THE GUARD GOT STRONGER

`athleticShareOf(programme, juniorScore, rng)` – unchanged signature, still cannot be handed a family.
The merit-only sweep in `tests/college-offer.test.ts` block A **gained two axes** rather than losing
one: 3 backgrounds × 3 nationalities × **4 incomes** × **4 savings**, one value expected. The extremes
are real ($335,586 is the largest savings balance measured at the fork; a negative balance is a family
that arrived in debt). **Mutation-proved**: scaling the award by `familyIncomeCents` turns it red.

---

## 3. MEASURED

### 3a. ⚠⚠ THE PREDICTIONS, WRITTEN BEFORE THE RUN – AND THEY ARE IN A COMMIT, NOT IN THIS FILE

CLAUDE.md invariant 4 wants predictions before the measurement. These were written into
`src/engine/collegeOffer.ts` and `tests/college-offer.test.ts` and committed as **`cee7412`**, which is
timestamped **before** arm B ran. They are quoted here rather than re-stated, so the ordering is
checkable rather than asserted.

<!-- PREDICTIONS-ABOVE-MEASURED-BELOW -->

| | predicted, at `cee7412` |
| --- | --- |
| **A. the athletic column, arm to arm** | **identical.** The award is merit-only, the sweep is mutation-proved, and nothing in this phase is handed to it. Any movement is a leak or a contaminated arm, not a balance finding |
| **B. need share by background** | working ≈ **0.45**, middle ≈ **0.10**, wealthy **0.00** – the knots were solved to reproduce the shipped medians |
| **C. the funding bands** | **four live bands**, none holding the population. Calibrated on `covered`: min 41.0% · p25 62.6% · median 79.4% · p75 99.9% |
| **D. the delta** | ⚠ **not predicted, and deliberately not.** This is the question being asked, not a knob being checked |

### 3b. ⭐⭐⭐ THE ARMS, AND EACH ONE IS NAMED BY THE COMMIT IT WAS BUILT AT

⚠⚠ **THE FIRST PAIR OF ARMS WAS CONTAMINATED AND THE CONTAMINATION IS THE FINDING WORTH RECORDING.**
CLAUDE.md's newest entry is about null results that are really broken arms – a constant without its
reader, and two arms against the same tree. **This is a third way to get it wrong, and it arrived
without anybody doing anything careless:** arm A was built at `6575a35` and arm B at `cee7412`, and
between them another agent had landed `fd66d52` (the wild cards). The two arms therefore differed in
**my change plus somebody else's**, and it showed up immediately as a merit-only award appearing to
move with family wealth – the programme split went 12/28/12/1 to 11/22/20/0, on a junior record my
change cannot touch.

**In a shared checkout, "the commit before mine" is not the same tree as "my commit minus my change".**
The arms were rebuilt as the latter:

| arm | built at | how | reader check |
| --- | --- | --- | --- |
| **A** (superseded) | `6575a35` | the tool commit | `needShareByBackground` present |
| **A′** (the control) | `cee7412`, with `collegeOffer.ts` + `world/college.ts` checked out from `6575a35` | **my change and only my change reverted** | `needTest` **absent (0)**, `needShareByBackground` **present**, wild cards **present** |
| **B** (the change) | `cee7412` | as committed | `needTest` **present (6)**, `familyIncomeCents` present in `world/college.ts` |

Both A′ and B carry the wild cards, so the pair isolates the tariff. `npx vite-node
tools/college-price-probe.ts -- --seeds 6 --all`, n = 53, in both.

### 3c. ✅ PREDICTION A, EXACTLY RIGHT – AND IT IS THE OWNER'S RULING HOLDING UNDER MEASUREMENT

| | **arm A′** | **arm B** | |
| --- | --- | --- | --- |
| programme split (strong / solid / small) | 11 / 22 / 20 | **11 / 22 / 20** | ✅ |
| athletic %, strong / solid / small | 89.3 / 62.2 / 38.7 | **89.3 / 62.2 / 38.7** | ✅ |
| **athletic % – working / middle / wealthy** | **53.2 / 59.0 / 67.4** | **53.2 / 59.0 / 67.4** | ✅✅ **identical to the decimal** |

⭐ **The award did not notice that the means test beside it was replaced.** The unit test proves the
function cannot read a family; this proves the shipped population does not either. ⚠ **And the 12.3
point wealth gradient the previous spec found is still there (53.2 → 67.4, 14.2 points here).** It is
unchanged and unchallenged by this phase: the award does not read wealth, wealth buys the record the
award reads.

### 3d. ⚠⚠ PREDICTION B – MEASURED LOWER THAN PREDICTED, AND THE REASON IS THE HALF I WANTED

| by background, n = 53 | **A′ (label)** | **B (position)** | move |
| --- | --- | --- | --- |
| working – need % | 38.4 | **33.2** | −5.2 |
| working – bill / year | $1,188 | **$3,858** | +$2,670 |
| working – **over 4 years** | **$4,751** | **$15,431** | **+$10,680** |
| middle – need % | 9.7 | **4.6** | −5.1 |
| middle – bill / year | $9,050 | **$11,890** | +$2,840 |
| middle – **over 4 years** | **$36,201** | **$47,558** | **+$11,357** |
| wealthy – need % | 0.0 | **0.0** | – |
| wealthy – **over 4 years** | **$41,017** | **$41,017** | **$0** |

**Predicted working ≈ 0.45 and middle ≈ 0.10; measured 0.332 and 0.046.** Two things account for the
gap and neither is a bug:

1. **The prediction was about MEDIANS and the table reports MEANS**, and the two differ here because
   the Bylaw 15.1 ceiling trims the need layer for strongly-funded girls. Arm A′'s own means are 38.4
   and 9.7 rather than 45 and 10, on the unchanged table – so the honest comparison is A′ → B, not
   prediction → B.
2. **The rest is the asset term doing its job.** Savings above $25,000 now price her, and the savings
   distribution has a long tail (max $335,586). Families that banked heavily get less, which is the
   whole point.

⚠ **SO THE TARIFF IS DEARER THAN THE ONE IT REPLACES: +$10,680 over four years for a working family
and +$11,357 for a middle one, wealthy unchanged.** That is a real balance move, it is reported rather
than tuned away, and §4.1 puts the knob to the owner.

⭐ **And the direction the previous phase cared about is intact**: college still tips towards the
poorer family on the bill, **$15,431 against $41,017** over four years, a factor of 2.7 (it was 8.6).

### 3e. ✅ PREDICTION C, RIGHT – FOUR LIVE BANDS

`covered = min(1, athletic + need)`, arm B, n = 53: min 33.5% · p10 42.5% · p25 60.7% · **median
74.6%** · p75 90.7% · p90 97.0% · max 100%.

| band | what the card says | careers |
| --- | --- | --- |
| `full` (= 100%) | **A full ride** | 4 |
| `most` (≥ 80%) | **Most of the bill** | 15 |
| `half` (≥ 55%) | **About half the bill** | 22 |
| `part` (> 0) | **Part of the bill** | 12 |
| `none` (= 0) | **Nothing at all** | 0 – reachable only for a non-American walk-on |

⚠ **The lesson of the programme bands, applied before shipping rather than after.** The first set of
programme thresholds put 88 of 90 careers in one band and measured college as free; these were
calibrated on the axis first, and the widest band holds 42% rather than 98%.

⚠ **The free-ride count fell 13 → 4** between the arms – a direct consequence of §3d, and the single
most visible change a player would notice.

### 3f. ⭐⭐⭐ THE DELIVERABLE – THE DELTA, ALL THREE BACKGROUNDS, AS A DISTRIBUTION

**Paired `college_i − tour_i` over four years, n = 53, arm B (`cee7412`).** The two arms fork from one
world at one week and are byte-identical up to it, so the per-career difference is the honest unit.

| background | n | p10 | p25 | **MEDIAN** | p75 | p90 | **better off ON TOUR** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **working** | 18 | −$4,565,643 | −$409,680 | **−$94,537** | +$34,929 | +$73,595 | **11 / 18 (61%)** |
| **middle** | 23 | −$1,087,102 | −$452,434 | **+$15,304** | +$96,163 | +$101,454 | **11 / 23 (48%)** |
| **wealthy** | 12 | −$160,994 | −$126,114 | **+$29,108** | +$193,309 | +$211,025 | **3 / 12 (25%)** |
| **ALL** | 53 | −$1,087,102 | −$210,821 | **+$4,114** | +$91,707 | +$172,950 | **25 / 53 (47%)** |

> ⭐⭐⭐ **THE ANSWER TO «КАКАЯ ДЕЛЬТА? МОЖЕТ ОНА ОКОЛОНУЛЕВАЯ БУДЕТ?» IS: THE MEDIAN IS +$4,114, WHICH
> IS AS NEAR ZERO AS A NUMBER GETS – AND THAT IS THE LEAST INFORMATIVE TRUE THING ABOUT IT.** The same
> 53 careers run from **−$1.09M at p10** to **+$172,950 at p90**. Half of them are a coin flip: **47%
> bank more by staying on tour.** The near-zero median is not a small effect, it is a **large,
> two-sided effect whose middle happens to sit near zero.**

**AND THE COST SIDE IS NOT WHAT DRIVES IT.** The whole four-year tuition bill is **$15,431–$47,558**
against a delta that spreads over **±$1,000,000**. «Расходы перевесят» is true for **61% of working
careers** – but the thing outweighing college is **what the tour would have paid her**, not what the
degree cost.

### 3g. ⚠⚠ AND THE TARIFF IS NOT WHAT MOVED THIS – THE WILD CARDS WERE

Three arms, all label-priced except the last, all n = 53:

| arm | commit | ALL median delta | better off on tour |
| --- | --- | --- | --- |
| pre-wild-card, label-priced | `6575a35` | **+$26,152** | 23 / 53 (43%) |
| wild cards, label-priced | `cee7412` − my change | **+$4,114** | 25 / 53 (47%) |
| wild cards, position-priced | `cee7412` | **+$4,114** | 25 / 53 (47%) |

⭐ **The wild cards cost the college arm $22,038 of median advantage and moved two careers onto the
tour side. This phase's tariff moved the median by $0 and moved nobody.** The bill is real and the
family feels it year by year; at the scale of a four-year career comparison it is inside the noise.
⚠ **This is another agent's change, measured in passing and handed over, not a claim about their
work being wrong** – it is the reason the figures below differ from the ones quoted before 17.08.

### 3h. ⚠⚠ THE NON-AMERICAN, NAMED RATHER THAN BURIED

Same paired statistic, out-of-state sticker and **no need layer at all** – 34 CFR §668.33, primary law,
not a balance choice.

| background | n | p10 | p25 | **MEDIAN** | p75 | p90 | **better off ON TOUR** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **working** | 18 | −$4,643,423 | −$517,678 | **−$189,249** | −$49,886 | −$21,011 | **17 / 18 (94%)** |
| **middle** | 23 | −$1,111,165 | −$465,576 | **−$29,115** | +$41,028 | +$52,824 | **14 / 23 (61%)** |
| **wealthy** | 12 | −$163,693 | −$155,684 | **−$2,238** | +$155,614 | +$185,266 | **6 / 12 (50%)** |
| **ALL** | 53 | −$1,109,596 | −$257,068 | **−$52,007** | +$25,831 | +$130,402 | **37 / 53 (70%)** |

> ⚠⚠ **FOR A NON-AMERICAN THE MEDIAN IS NEGATIVE IN EVERY BACKGROUND AND 70% DO BETTER ON TOUR.** For a
> non-American **working** family every quantile from p10 to p90 is negative and **17 of 18 careers do
> better on tour** – college is not merely dear, it is the wrong answer 94% of the time. Neither half
> of that is a judgement about her family: **it is that the mechanism which would have judged it is not
> open to her.** Flagged, not tuned – §4.2.

### 3i. ⚠ THE STATE §2e NAMED AND NEVER MEASURED: SHE DID NOT RUN OUT

| | arm A′ | arm B |
| --- | --- | --- |
| under water after four years, college | **0 / 53** | **0 / 53** |
| careers ENDED inside the four years | 0 / 53 | 0 / 53 |
| funds after, median – working / middle / wealthy | $106,901 / $134,554 / $244,385 | **$104,026 / $130,874 / $244,385** |

**Bankruptcy at college is reachable and does not fire in this population.** A career that reaches the
fork arrives with six figures, and even the dearest bill measured here ($47,558 over four years) does
not exhaust it. ⚠ **Reported as a null result with its arms named**, which is what CLAUDE.md now
requires of one: both arms contain `resolveCollegeBill` and both contain a reader for it, and the
bills genuinely differ between them (§3d), so the zero is a measurement and not a broken arm.

---

## 4. ⚠ FOR THE OWNER – two decisions and one thing that is not mine to fix

### 4.1 ⭐⭐ THE TARIFF IS DEARER THAN THE ONE IT REPLACES, AND THE KNOB IS NAMED

Four years now cost a working family **$15,431** where the label-priced table charged **$4,751**, and a
middle family **$47,558** against **$36,201**. Wealthy is unchanged. The cause is the asset term:
savings above **$25,000** price her, and families that banked heavily on the junior tour lose the layer.

⚠ **THE DECISION IS WHETHER SAVINGS SHOULD COUNT THAT HARD.** Two knobs, both one line:
`assetShieldCents` (raise it and only genuinely wealthy balances price her) and `noNeedAboveCents`
(raise it and the taper reaches further up the income axis). **Nothing measured refutes the current
values** – they were calibrated on the measured bands – so they ship, and this is a knob offered rather
than a defect reported.

### 4.2 A NON-AMERICAN WORKING FAMILY SHOULD NOT TAKE THE COLLEGE PLACE, 94% OF THE TIME

§3h. Both halves are primary-sourced (the out-of-state sticker; 34 CFR §668.33) and neither is ours to
tune. What IS ours is that **the card does not say it and must not** – ruling 4 of 30.07, the card may
not recommend. So the figures are on the card and the comparison is the player's. ⚠ **If this should
change, the lever is not the college bill – it is that the athletics award is the only money that
reaches her, and its bases (0.85 / 0.55 / 0.30) are two-thirds ours.**

### 4.3 ⚠ THE THREE TESTS THIS PHASE DID NOT MAKE GREEN, AND WHY

* **`tests/coach-travel-edge.test.ts` – 3 cases red.** The three frozen career hashes moved. ⚠ **This
  is NOT this phase**: verified by running that file at **`fd66d52`**, the wild-card commit, in a clean
  worktree **before any of my commits existed** – it is already red there, identically. It belongs to
  the wild-card wave and needs its re-pin.
* **`tests/season/wildCard.test.ts` – 2 type errors.** The other agent's file, mid-flight. Untouched.
* **`tests/e2e-fixtures.test.ts`** remains red from v51 and is still the owner's to regenerate. ⚠ **This
  phase adds NO schema change** – the funding band is derived and `billPerYearCents` is a wire field –
  so it neither helps nor worsens that.

---

## 5. FILES

| file | what changed |
| --- | --- |
| `src/engine/collegeOffer.ts` | `CollegeFundingBand`, `fundingBandOf`, `coveredShareOf`, `familyPositionCents`; `needShareOf` re-signed onto the family position; `needShareByBackground` → `needTest`; `fundingBands` |
| `src/engine/world/college.ts` | `collegeRecruitViewOf` reads income and savings at the fork; `collegeProgressOf` carries `billPerYearCents` |
| `src/engine/ending.ts` | the ending detail no longer says the family stops paying |
| `src/shared/protocol.ts` | `CollegeProgressView.billPerYearCents` – **a wire field, not a save field** |
| `src/components/ForkDialog.vue` | the named band, the two layers under it, the four-year total, "charged weekly" |
| `src/components/EndingScreen.vue` | the lead and the "Another year" button tell the truth; a Tuition row on the year card |
| `src/components/screens/MoneyScreen.vue` | `tuition` is a real expense row, with a glyph and a hue |
| `src/style.css` | `--cat-tuition` |
| `tests/college-offer.test.ts` | block A's sweep widened to income and savings; the key pin re-aimed and given a property assertion; the means-test case re-aimed from three lookups to a monotone sweep; **block D, new** – the funding band |
| `tests/component/college-offer-card.test.ts` | four new mounted cases: the band, the full ride, the four-year total, the no-bill case |
| `tools/college-price-probe.ts` | the family at enrolment; `covered`'s distribution; the delta by background as a distribution; the non-American version of it; the ran-out-mid-degree block |

**No `SAVE_SCHEMA_VERSION` bump, no migration, no new fixture.** The band is derived from two fields
`CollegeOffer` already carries and `billPerYearCents` is read off the persisted `fork.offer` at
snapshot time, so a career mid-course keeps exactly the contract it agreed to at nineteen.

**Reproduce:**

```bash
npx vite-node tools/college-price-probe.ts -- --seeds 6 --all     # §2b, §3c-§3i, n 53
npx vitest run --project unit tests/college-offer.test.ts --no-file-parallelism
npx vitest run --project component --no-file-parallelism
```

⚠ **`--no-file-parallelism` is not optional on this machine.** A parallel `npm run check` here comes
back at ~1870 s with files timing out and **zero assertion failures**; the same work serialised is
~260 s and green. CLAUDE.md's gotcha on it is the reference.
