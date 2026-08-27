---
type: spec
status: draft
area: engine/balance
canonical: false
last-reviewed: 2026-08-27
---

# The potential band, swept – what the ceiling knob can and cannot buy (27.08.2026)

**Status: MEASUREMENT. Nothing shipped.** No engine constant moved – `git status --porcelain -- src`
is empty on this branch, in every arm – and no test bound moved. What this branch adds is a
measurement-only override on `tools/growth-pace-probe.ts`, a new arithmetic probe
(`tools/band-vs-field.ts`), a re-pointing of a stale guard window inside
`tools/potential-band-sweep.ts`, and this page. **It recommends; CLAUDE.md invariant 4 owns the
decision.**

The owner, on the 93.3% top-100 reach that
[how-fast-she-grows-2026-08.md](how-fast-she-grows-2026-08.md) §4a measured against a 3-6% target:

> «может не до 3-6% довести, но как-то все-таки и не так 90+%»

Four levers were ranked for him. This page prices the one ranked most direct:
**`ECONOMY.development.potentialBand = [4, 26]`** (`src/engine/economy.ts:1465`) – how many points
above her starting build a career's ceiling can roll.

### ⚠⚠ The tree every arm was measured at, and it is not the tree `wave/the-shop` now has

Every arm below ran at **`bd02c20`**, which was `wave/the-shop`'s tip when this worktree was cut.
**The branch was REWRITTEN while the sweep was running**: its tip is now `5ee2a8a`, `bd02c20` is no
longer an ancestor of it, and the commit that was dropped is **`23eff19`** («fix(retirement): the
hazard finally knows how fresh she arrived»), which carries `retireDurability` in
`src/engine/match/point.ts` – 4 hits at `bd02c20`, **0** at today's tip.

**What that costs, exactly, and it is two careers.** `how-fast-she-grows` §2d measured the same
corpus with and without precisely this change and reported top-100 reach **93.3%** without it and
**95.6%** with it, on identical seeds, with *no distribution moving between them* – «median age at
first top-100 18.93 / 18.97, median career-best rank #9 / #9, median age at 90% of ceiling 16.4 /
16.4, ceiling spent at 18 92.8% / 92.8%». This page's shipped-band arm reads **95.6%**, i.e. it
reproduces the arm that carries the fix. **So every row of §3 is high by about two careers in ninety
against today's `wave/the-shop`, uniformly, and no comparison on this page is affected** – the sweep
is paired, every arm carries the same tree, and the CURVE rather than any single level is the finding.

⚠ **It is named rather than quietly corrected** because a reader who re-runs `TB_POTENTIAL_BAND="4,26"`
on today's branch will get 93.3%, not 95.6%, and would otherwise have to discover why.

---

## 0. The one-page answer

1. **⭐⭐ ON TODAY'S PARENT THE AXIS IS THE BAND'S MIDPOINT, AND NEITHER ITS WIDTH NOR ITS TOP DOES
   ANY WORK.** Cutting the width by 82% at a fixed midpoint – `[4, 26]` → `[10, 20]` → `[13, 17]`,
   widths 22 → 10 → 4 – moves top-100 reach **95.6% → 95.6% → 95.5%** and leaves the median
   career-best rank at **#9** in all three. Lowering the midpoint by 4 with the width **untouched** –
   `[4, 26]` → `[0, 22]` – moves it **95.6% → 80.5%**. And two bands with the same midpoint and
   different widths (`[2, 18]` w16 and `[4, 16]` w12) return the **same 72.7%, on the same 64
   careers**. §2. ⚠ **The width null is a property of a reach near 100%, not of the model**: on the
   12.08 manager, where reach is 8.8%, the same mean-preserving narrowing costs five companions
   together. §6b.
2. **⚠⚠ THE LEVER CANNOT REACH 3-6%, AND ITS FLOOR IS ARITHMETIC.** At `potentialBand = [0, 0]` – she
   gains **not one skill point in her entire life** – top-100 reach is still **8.1%** of horizon.
   ⚠ That figure's own interval at 90 careers is [4.0-15.9] and overlaps the target, so the claim
   does not rest on it: at `[0, 0]` her ceiling IS her birth build, and **9.0%** of birth builds are
   above the world #100's core over **100,000 rolls** – no seed, no sample. **A band that only adds
   cannot put the ceiling distribution below the birth distribution.** §3a says what career sample
   would be needed (n ≈ 900-1,000) and why it was not bought.
3. **⭐⭐ AND THE REASON IS THAT THE BAND CANNOT SUBTRACT.** After the 17.08 fit (`a412162`) the
   world's hundredth-best professional has a core of **51.92**. The median fourteen-year-old is BORN
   at **48.40** – the strength of the world's **#136** – and **9.0%** of them are born already
   stronger than the world #100. `potentialBand` only ever adds to that. §5.
4. **THE MEDIAN CAREER PAYS FOR EVERY POINT OF IT, AND FASTER THAN THE HEADLINE DOES.** Going from
   the shipped band to `[0, 12]` takes top-100 reach 95.6% → 57.3% (a factor of 1.7) and the median
   career's LIFETIME prize money $13.4m → $1.5m (a factor of 8.8), the share of careers ever paid a
   professional cheque 96.7% → 66.7%, and the share of nineteen-year-olds above the College League's
   centre 83.3% → 9.0%. §4.
5. **TWO SHIPPED GUARD WINDOWS GO RED BEFORE THE LADDER GETS ANYWHERE NEAR THE TARGET**, and one of
   them fails on an assertion no re-pin is allowed to move. The last band that keeps both green is a
   midpoint of **8**, which reads **65.6%**. §4c.
6. **⚠ THE MIDPOINT RESPONSE IS THE SAME ON BOTH MANAGERS; THE WIDTH RESPONSE INVERTS.** The arm
   reported throughout is today's **`player`** – the one the owner's 93.3% came from. It reproduces
   both published arms exactly (§6a: `july` 8.8% / horizon 75.6% / 22 bankruptcies / median #191, all
   to the digit). On `july`, the band is still monotone in the midpoint, but the mean-preserving
   narrowing that is free on `player` costs **top-250 64.7% → 48.4%** and **median lifetime prize
   $169,685 → $46,575**. §6b, with the mechanism.
7. **⭐ THE RECOMMENDATION IS THAT THE TARGET MOVES AND THE BAND MOVES A LITTLE.** The 3-6% row was
   agreed 26.07, three weeks before the field was fitted to real 2026 WTA Elo, and it describes a
   game whose starting build has never been calibrated against a real ladder. §7 argues it with
   numbers and names what to do instead.

---

## 1. The instrument, and how it was kept off its own subject

### 1a. The override – an env var, one band per PROCESS

`tools/growth-pace-probe.ts` gained `--band lo,hi` / `TB_POTENTIAL_BAND="lo,hi"`. It patches the live
`ECONOMY.development.potentialBand` **once, at module load, before a single career exists**, and
prints the band it is running with in its own header beside the shipped value. **`src/` is
byte-identical to `bd02c20` in every arm** – `git status --porcelain -- src` was empty before the
first run and after the last.

⚠⚠ **AND IT IS ONE BAND PER PROCESS RATHER THAN A LOOP, WHICH IS NOT A STYLE CHOICE.**
`tools/potential-band-sweep.ts` wraps each arm in `withBand(...)` inside ONE process – correct for
pure arithmetic, and exactly the hazard `growth-pace-probe`'s own header records for a career corpus:
the engine's per-season memos are **process-global**, and that page measured `--proveArm` moving the
median career-best rank #13 → #14 by doing nothing but opening one extra world first. A band swept
in-process would carry that contamination into every arm after the first and it would look precisely
like a band effect. Separate processes cannot.

⚠ **What the patch does not reach, stated because it is real.** `SKILL_CEILING_MAX`
(`development.ts:150`) is computed at MODULE LOAD from `potentialBand[1]`, so it holds its shipped 86
in every arm here. Nothing in the simulation reads it – it is the skills-rose axis and two tests – so
no number on this page moves with it. **A shipped band change WOULD move it**, and §4d prices that.

⚠ `COHORT.potentialBand` `[1, 22]` is a different constant and is untouched: the 199 rivals and the
1,600 professionals keep their shipped ceilings in every arm, which is what makes this a difficulty
knob against a fixed field rather than a world parameter (`potential-band-2026-08.md` §1, verified
there by three hash arms and not re-verified here).

### 1b. The reader is present – the absurd-value check, run rather than asserted

CLAUDE.md: «the cheapest sanity check is to set the constant to an absurd value and watch the output
move; if it does not, the arm is wrong before the hypothesis is.» `[0, 0]` is that arm and it is also
a load-bearing measurement in its own right (§3):

| | shipped `[4, 26]` | `[0, 0]` |
| --- | --- | --- |
| her rolled ceiling at 19, median | **63.05** | **48.00** (= her birth build, to the digit) |
| share of her ceiling spent at 18 | 92.8% | 100.2% |
| top-100 reach, of horizon | 95.6% | **8.1%** |

⚠ **The 100.2% is not a bug and it is the arithmetic trap `potential-band-2026-08.md` §4 names.** Her
ceiling is rolled off her BIRTH build and her live skills carry `relativeAgeHeadStart(birthMonth)` on
top, so `power() / potentialMean` can sit a fraction over 1 when the band is zero. It confirms the
override reaches `rollPotential` and nothing else.

### 1c. Byte-reproducible, checked before any number was believed

The shipped band was run **twice, in two processes, at the same seeds**. The two `RESULT` rows are
identical on all 28 fields including every median and every share. Two clean runs, one diff, no
difference.

### 1d. Exit codes came out of files, and it caught two

Every arm's runner appends `RUN_EXIT=` to its own log; **no exit status on this page was read from a
pipe or from a background-task notification.** **16 career arms, the guard reproduction and the
arithmetic scan exited 0.** Two runs carry **no `RUN_EXIT=` line at all** – the 450-career floor
re-run (§3a) and a `[8, 30]` arm (§3b) – because both were killed mid-flight, and the missing line is
the only thing that says so. Neither is quoted anywhere on this page and no partial output was read.

Reproduce any row:

```bash
TB_POTENTIAL_BAND="0,16" npx vite-node tools/growth-pace-probe.ts -- --seeds 10 --policy player
npx vite-node tools/band-vs-field.ts                                    # §5, ~20 s, no careers
TB_BANDS="4,26;0,16;0,12" npx vite-node tools/potential-band-sweep.ts -- --only 5   # §4c
```

### 1e. The corpus, and what 90 careers can and cannot say

**90 full careers per arm** – 9 `econ-bench` presets x 10 seeds, 14 → 44 (`FULL_CAREER_WEEKS`, 1612
weeks), fork answered `continue`, every retirement offer refused, bankruptcy NOT defused. **The same
seeds in every arm**, so every comparison here is paired. This is `how-fast-she-grows`'s own corpus
shape, deliberately, so its 93.3% and this page's rows are the same measurement.

⚠ **90 careers is thin near 3-6% and this page does not pretend otherwise.** At p ≈ 0.045 a 90-career
Wilson interval is about ±4 points, so a measured 4% and a measured 8% do not separate. Every share
below carries its interval. **The one arm that lands anywhere near the band was re-run at 450
careers** (§3a); to quote a point estimate against the band to ±1.5 points would need **n ≈ 750**,
which is ~80 minutes of one core per arm and was not bought for the arms that are nowhere near it.

---

## 2. ⭐⭐ WHICH AXIS DOES THE WORK – width, top, or midpoint

### 2a. The two axes are not the two ends

A band `[lo, hi]` has two free parameters and the useful pair is not `lo` and `hi`:

- **MIDPOINT** m = (lo+hi)/2 – how much better than her birth build the AVERAGE career can become;
- **WIDTH** w = hi−lo – how unequal two careers' ceilings are.

«The TOP» is not a third axis: hi = m + w/2. **Every one of the requested variants except `[0, 22]`
moves both at once**, which is why this page adds two that do not:

| variant | midpoint | width | what it is |
| --- | --- | --- | --- |
| `[4, 26]` | 15 | 22 | **as shipped** |
| `[4, 20]` | 12 | 16 | requested – **confounded** (−3 midpoint, −6 width) |
| `[4, 16]` | 10 | 12 | requested – **confounded** (−5, −10) |
| `[2, 18]` | 10 | 16 | requested – **confounded** (−5, −6) |
| **`[0, 22]`** | **11** | **22** | requested – **PURE LOWERING**, width held |
| **`[10, 20]`** | **15** | **10** | added – **PURE NARROWING**, midpoint held |
| **`[13, 17]`** | **15** | **4** | added – **PURE NARROWING**, extreme |

### 2b. The measurement, and it is not close

**Mean-preserving narrowing – midpoint 15 throughout, width 22 → 10 → 4:**

| band | width | **top-100, of horizon** | 95% interval | top-250 | med best rank | med power at 19 |
| --- | --- | --- | --- | --- | --- | --- |
| `[4, 26]` | 22 | **95.6%** | 89.1-98.3 | 96.7% | **#9** | 59.23 |
| `[10, 20]` | 10 | **95.6%** | 89.1-98.3 | 95.6% | **#9** | 59.17 |
| `[13, 17]` | 4 | **95.5%** | 89.0-98.2 | 96.6% | **#9** | 59.24 |

**Cutting the band's width by 82% moves top-100 reach by 0.1 points.**

**Width-preserving lowering – width 22 throughout, midpoint 15 → 11:**

| band | midpoint | **top-100, of horizon** | 95% interval | top-250 | med best rank | med power at 19 |
| --- | --- | --- | --- | --- | --- | --- |
| `[4, 26]` | 15 | **95.6%** | 89.1-98.3 | 96.7% | #9 | 59.23 |
| `[0, 22]` | 11 | **80.5%** | 70.9-87.4 | 87.4% | #14 | 56.24 |

**And the within-sweep control at a second midpoint** – two requested variants that happen to share a
midpoint and differ in width by a third:

| band | midpoint | width | **top-100, of horizon** | n |
| --- | --- | --- | --- | --- |
| `[2, 18]` | 10 | 16 | **72.7%** | 64/88 |
| `[4, 16]` | 10 | 12 | **72.7%** | 64/88 |

Same share, same numerator, same denominator.

### 2c. ⭐ The mechanism, so this is a claim about the model and not a coincidence

`power()` is the **mean of five** attributes and `rollPotential` draws them independently. That is a
central-limit machine, and it has two consequences that decide this section:

1. **The band's TOP is a supremum nobody approaches.** Reaching `start + hi` needs all five draws at
   `hi`. Measured over 100,000 careers at the shipped band, the best mean-of-five ceiling is **80.4**
   against a per-attribute maximum of 60 + 26 = **86**, and p99 is **72.2**. Moving `hi` moves a
   number the distribution does not visit.
2. **The width buys only sd, and only a fraction of the sd that is there.** sd of the mean-of-five
   headroom is w/√60 = **w/7.746** – 2.84 at the shipped width. Her BIRTH build contributes its own
   sd of **≈2.49** (the `[0, 0]` row's spread IS the starting spread), which no band can touch. So the
   shipped ceiling sd is √(2.49² + 2.84²) = **3.78** – measured 3.76 – and taking the width to 4
   leaves **2.54**. Two thirds of the variance was never the band's to remove.
3. **And the binding population is the MIDDLE, not a tail.** With 95.6% of careers reaching the top
   hundred, the careers that decide the number are the ones at the median. Width, by construction,
   trades one tail against the other and **leaves the median exactly where it was** – measured
   ceiling median 63.05 / 63.06 / 62.98 across the three widths.

⚠ **So «how unequal careers are» and «how high the best can go» are both real design questions and
neither of them is this one.** The question «who can ever be a star» is answered by where the MIDDLE
of the ceiling distribution sits against the field, and that is the midpoint alone.

⚠⚠ **AND THAT SENTENCE HAS A MANAGER IN IT, WHICH §6b MAKES EXPLICIT.** Point 3 above is conditional:
the binding population is the middle *because* 95.6% of careers reach the top hundred. On the 12.08
parent, where 8.8% do, the binding population IS the upper tail and the same mean-preserving
narrowing costs five companions together. **Width is a tail parameter, and whether the tail is
load-bearing is the parent's doing, not the band's.**

---

## 3. THE CURVE

`player` policy, 90 careers per arm, same seeds, same horizon. Shares are of runs reaching the
horizon; `bankrupt` is a count of all 90. `med best rank` is over careers that ever held a paid rank
and `n ranked` is printed beside it, because a band that pays fewer careers moves both.

| band | mid | width | **top-100** | 95% CI | **top-250** | **med best rank** (n ranked) | **bankrupt** | med first top-100 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **`[4, 26]` shipped** | **15** | **22** | **95.6%** | 89.1-98.3 | 96.7% | **#9** (87) | **0** | 18.97 |
| `[10, 20]` | 15 | 10 | 95.6% | 89.1-98.3 | 95.6% | #9 (86) | 0 | 19.06 |
| `[13, 17]` | 15 | 4 | 95.5% | 89.0-98.2 | 96.6% | #9 (86) | 1 | 19.06 |
| `[4, 20]` | 12 | 16 | 85.4% | 76.6-91.3 | 87.6% | #12.5 (78) | 1 | 19.31 |
| `[0, 22]` | 11 | 22 | 80.5% | 70.9-87.4 | 87.4% | #14 (77) | 3 | 20.42 |
| `[2, 18]` | 10 | 16 | 72.7% | 62.6-80.9 | 81.8% | #15 (73) | 2 | 20.33 |
| `[4, 16]` | 10 | 12 | 72.7% | 62.6-80.9 | 78.4% | #16 (69) | 2 | 20.30 |
| `[0, 16]` | 8 | 16 | 65.6% | 55.3-74.6 | 80.0% | #20 (72) | 0 | 21.09 |
| `[0, 12]` | 6 | 12 | 57.3% | 46.9-67.1 | 67.4% | #25 (60) | 1 | 22.07 |
| `[0, 8]` | 4 | 8 | 30.7% | 22.0-41.0 | 52.3% | #77 (47) | 2 | 21.44 |
| `[0, 4]` | 2 | 4 | 19.3% | 12.4-28.8 | 50.0% | #107.5 (44) | 2 | 22.05 |
| **`[0, 0]` the floor** | **0** | **0** | **8.1%** | **4.0-15.9** | 31.4% | #131 (30) | 4 | 21.92 |

**The target row is 3-6%.** The curve is smooth and monotone in the MIDPOINT and, on this manager,
flat in the width (§2b, and §6b for the arm where it is not). The lowest value this lever can produce
is the last row – a band under which **she gains not one skill point in her entire life**.

⭐ **And there is a legible crossing in it.** At `[0, 8]` her median rolled ceiling is **51.91**
against the world #100's core of **51.92** – the two agree to the second decimal by accident, which
makes that row the cleanest calibration point on the page. **A career whose ceiling sits exactly on
the hundredth-best professional's strength reaches the top hundred 30.7% of the time.** The
conversion is generous, and §5 says why: a rank is a POINTS arc against a table that turns over, so
equal skill converts far more often than a percentile argument predicts.

### 3a. ⚠ THE FLOOR IS THE ONE ROW THIS PAGE MAY NOT QUOTE ON 90 CAREERS – so it does not rest on them

The floor arm reads **8.1% [4.0-15.9]** and that interval **overlaps the target band**. At 90 careers
the corpus cannot tell 8% from 5%, and this page says so instead of implying otherwise.

**A 450-career re-run of this arm was started and was KILLED at 60 minutes**, before it printed
anything; its log carries no `RUN_EXIT=` line, which is the only thing that says so, and no partial
output was read. It is named here so nobody later mistakes its absence for a result.

⭐ **It was not re-started, because the sample it would have bought does not settle the question
either and a cheaper instrument already does.** Two reasons, in order:

1. **Even 450 careers would not separate 8.1% from the band's 6% edge.** Wilson at p̂ = 0.081 and
   n = 450 is **[5.9-11.0]** – the lower bound lands ON the edge. To put the lower bound clear of 6%
   needs **n ≈ 900-1,000**, which at this corpus's measured 648 s per 90 careers is **11-12 core-hours
   for one arm**. That is the sample this row would take, stated rather than quoted.
2. **⭐⭐ AND THE CLAIM DOES NOT NEED IT, because the floor is ARITHMETIC and not a sample.** At
   `[0, 0]` her ceiling IS her birth build, exactly (`medCeiling19` 48.00 = the median start, to the
   digit). §5 measures over **100,000 rolls** that **9.0%** of birth builds are already above the
   world #100's own core – no career simulated, no seed, no interval worth printing. The career
   corpus's 8.1% agrees with that 9.0% to well inside its own noise. **And `potentialBand` cannot put
   the ceiling distribution BELOW the birth distribution at any non-negative value, because it only
   adds.** The floor is a property of `STARTING_SKILL_BAND` against the fitted field, and the band
   cannot reach it.

### 3b. One arm ABOVE the shipped band – started, killed, and not re-run

`[8, 30]` (midpoint 19) was queued to check that the curve saturates rather than turning over. It was
killed with wave 5 and **not re-run**, because §5's arithmetic answers it without a career: 100.0% of
ceilings are already above the world #100's core at the shipped midpoint of 15, so there is nothing
above it for a higher midpoint to add. **Named rather than quietly dropped.**

---

## 4. ⚠ WHAT ELSE EACH SETTING BREAKS

**A setting that hits the headline and guts the median career is not a fix.** The ceiling feeds every
career, and the same 90 careers say what each band costs the other ninety-something percent.

### 4a. The median career, the money, and who is ever paid at all

| band | mid | **med LIFETIME prize** | **ever paid a pro cheque** | med prize at 19 | med family balance at 19 | med rank at 19 |
| --- | --- | --- | --- | --- | --- | --- |
| **`[4, 26]` shipped** | 15 | **$13,408,855** | **96.7%** | $247,278 | $141,833 | #99 |
| `[10, 20]` | 15 | $14,704,768 | 95.6% | $222,608 | $120,384 | #113 |
| `[13, 17]` | 15 | $13,986,852 | 95.6% | $250,240 | $136,925 | #105 |
| `[4, 20]` | 12 | $10,193,614 | 86.7% | $123,275 | $45,102 | #140 |
| `[0, 22]` | 11 | $7,618,200 | 85.6% | $120,286 | $33,969 | #154 |
| `[2, 18]` | 10 | $6,876,643 | 81.1% | $118,513 | $28,422 | #153 |
| `[4, 16]` | 10 | $6,256,572 | 76.7% | $98,458 | $26,545 | #154 |
| `[0, 16]` | 8 | $4,084,178 | 80.0% | $86,485 | $20,762 | #180 |
| `[0, 12]` | 6 | **$1,515,423** | **66.7%** | $65,577 | $18,661 | #191 |
| `[0, 8]` | 4 | $315,397 | 52.2% | $12,933 | $15,284 | #191 |
| `[0, 4]` | 2 | **$0** | **48.9%** | $0 | $10,773 | #251 |
| `[0, 0]` | 0 | **$0** | **33.3%** | $0 | $12,024 | #257 |

⚠ **Below a midpoint of 4 the MEDIAN career earns nothing at all, ever.** `$0` in that column is not
a rounding – it is more than half of all careers never being paid a single professional cheque in
thirty years of play, which is the outcome
[career-outcome-targets.md](career-outcome-targets.md) explicitly refuses: «a 14→18 career is four
seasons of real play, so a 10% success rate means nine players in ten never see the content built for
the pro contour at all. That is not honest difficulty, it is hidden content.»

⭐ **The money falls faster than the headline.** `[4, 26]` → `[0, 12]` divides top-100 reach by 1.7
and the median career's lifetime earnings by **8.8**. `potential-band-2026-08.md` §3 made "is there
enough to play for" measurable as **the share of careers that are ever paid a professional cheque**;
on that reading the shipped band pays 96.7% and a midpoint of 6 pays two thirds.

### 4b. The junior years, the college branch, and the pace

| band | mid | med junior seasons | med age, first W500+ | med age at 90% of ceiling | **above the College field's CENTRE at 19** |
| --- | --- | --- | --- | --- | --- |
| **`[4, 26]` shipped** | 15 | 1 | 18.93 | 16.40 | **83.3%** |
| `[10, 20]` | 15 | 1 | 18.96 | 16.42 | 85.6% |
| `[13, 17]` | 15 | 1 | 18.85 | 16.39 | 85.2% |
| `[4, 20]` | 12 | 1 | 19.02 | 15.74 | 67.4% |
| `[0, 22]` | 11 | 1 | 19.21 | 15.49 | 52.3% |
| `[2, 18]` | 10 | 1 | 19.21 | 15.18 | 36.4% |
| `[4, 16]` | 10 | 1 | 19.21 | 15.20 | 34.5% |
| `[0, 16]` | 8 | 1 | 19.21 | 14.53 | 24.7% |
| `[0, 12]` | 6 | 1 | 19.30 | 13.77 | **9.0%** |
| `[0, 8]` | 4 | 1 | 19.21 | 13.58 | 0.0% |
| `[0, 4]` | 2 | 1 | 20.02 | 13.58 | 0.0% |
| `[0, 0]` | 0 | 1 | 20.06 | 13.58 | **0.0%** |

Three things, and two of them are costs nobody would have predicted from the headline:

1. ⚠⚠ **THE BAND DOES NOT FIX THE PACE – IT MAKES IT WORSE.** `how-fast-she-grows` §9a's whole
   subject is that 90% of her ceiling is spent by **16.4**. Lowering the band moves that age
   **EARLIER, monotonically**: 16.4 → 15.7 → 15.5 → 15.2 → 14.5 → **13.8**. `growWeek` takes a share
   of the REMAINING headroom, so a smaller ceiling is reached sooner. At a midpoint of 6 she has
   spent 90% of everything she will ever be **before her fourteenth season is out**. A band change
   bought to slow the OUTCOME accelerates the PACE, which is the other half of the same owner
   complaint.
2. ⚠ **THE JUNIOR ERA DOES NOT COME BACK.** The median career gets **one** junior-majority season at
   every band on this page, including `[0, 0]`. `how-fast-she-grows` §8 named the cause – the pro
   on-ramp opens at `w15.minAgeYears: 14` – and this sweep confirms it is not a development number.
   The first W500 draw moves by about **one year** across the entire lever (18.93 → 20.06).
3. ⚠⚠ **THE COLLEGE BRANCH IS THE MOST SENSITIVE THING ON THE PAGE.** `COLLEGE_LEAGUE.field` is
   `{standard: 56, spread: 12}` and it is a FIXED number: the share of nineteen-year-olds above its
   centre goes **83.3% → 9.0%** between the shipped band and a midpoint of 6, and **0.0%** at the
   floor. [college-the-last-mile-2026-08.md](college-the-last-mile-2026-08.md) §3 is deciding whether
   that field is too strong; a band change would move the freshman under it by four times as much as
   the field number being argued about. **The ordering `how-fast-she-grows` §9d asks for holds, and
   this page is the reason it is not academic.**

### 4c. ⚠ The shipped guard windows – measured, nothing re-pinned

Reproduced with `tools/potential-band-sweep.ts --only 5` (same preset, same horizon, same 30 indices,
same predicate as `tests/econ-reach.test.ts`; no vitest imported and no test file written).

| band | mid | 14→18 pro proxy, of 30 – window **[3, 18]**, anchor 6 | 14→16 domestic door, of 30 – window **[4, 20]**, anchor 11 |
| --- | --- | --- | --- |
| **`[4, 26]` shipped** | 15 | **6** – on the anchor | 8 – inside |
| `[10, 20]` | 15 | 7 – inside | 8 – inside |
| `[13, 17]` | 15 | **11** – inside | 6 – inside |
| `[4, 20]` | 12 | 5 – inside | 5 – inside |
| `[0, 22]` | 11 | 4 – inside | 7 – inside |
| `[2, 18]` | 10 | 7 – inside | 6 – inside |
| `[4, 16]` | 10 | 7 – inside | 7 – inside |
| **`[0, 16]`** | **8** | **4 – inside** | **4 – inside, ON THE FLOOR** |
| `[0, 12]` | 6 | 3 – inside, on the floor | **1 – ⚠ RED** |
| `[0, 8]` | 4 | **1 – ⚠ RED** | 3 – ⚠ RED |
| `[0, 4]` | 2 | **1 – ⚠ RED** | 3 – ⚠ RED |
| `[0, 0]` | 0 | **1 – ⚠ RED** | 3 – ⚠ RED |

- **The last band that keeps both windows green is a midpoint of 8**, and it keeps the second one
  exactly on its floor. Everything below a midpoint of 8 costs a re-pin, and everything below a
  midpoint of 6 costs two.
- ⚠ **And a re-pin does not buy the bottom of the curve.** Both guards also carry CASE assertions
  the drift window cannot express – `> 0` («collapsed to never») and `< 30` («saturated») – and those
  exist to prove the proxy still SPLITS the field. A midpoint of 4 reads 1 of 30; a midpoint of 0
  reads 1 of 30. That is one seed from an assertion no re-pin is allowed to move.
- ⭐ **Read the `[13, 17]` row.** Mean-preserving NARROWING moves the 14→18 proxy from 6 to **11** –
  nearly double – while moving top-100 reach by 0.1 points. That is §2c's mechanism seen from the
  other end: narrowing removes the unlucky tail, so more careers clear a LOW bar and none clear a new
  high one.

### 4d. The paper anchors, all of which a shipped change would falsify

`potential-band-2026-08.md` §6b's list stands and this page adds one to it. Each is a documented
measurement rather than a test; nothing goes red, and each becomes a lie until re-run:
`src/engine/season/fieldPros.ts`'s top-storey derivation, `tools/world-turnover.ts`'s `ANCHORS`,
`tools/field-quality.ts`'s printed kid-ceiling row, `tools/ladder-walk.ts`'s ceiling, and
`tools/skill-ceiling.ts` §4's baseline.

**And the one it adds: the skills rose.** `SKILL_CEILING_MAX` is `max(STARTING_SKILL_BAND) +
potentialBand[1]` = **86** and it IS the radar's axis (`SkillsRadar.vue:107`, `AXIS_MAX`).
`tests/radar.test.ts:380` asserts the literal number appears in the component. A shipped `[0, 16]`
takes the axis to **76** and every existing career's rose gets visibly bigger overnight –
which is the wiring working as designed (`development.ts:146`: «the day `potentialBand` is widened …
the chart has to follow on its own»), but it is a UI change riding on a balance commit and the radar
tests move with it.

---

## 5. ⚠⚠ THE INTERACTION WITH THE FIELD – and it is the whole story

`fieldPros.SKILL_LAW` was fitted to the live 2026 WTA Elo-by-rank list on 17.08 (`a412162`), and
[the-fortnight-bisected-2026-08.md](the-fortnight-bisected-2026-08.md) §4c isolates that single
commit as the one that took top-100 reach from 1/100 to 15/100 with the manager held fixed. It is a
**shipped, predicted, measured and declared decision** and this page does not reopen it. It does say
what it implies for the band, because top-100 is a position against THAT field.

`coreForStanding(rank)` is pure arithmetic on the fitted anchors (`tools/band-vs-field.ts`):

| the world's | #1 | #10 | #50 | #64 | #94 | **#100** | #150 | **#250** | #500 | #1600 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| core | 76.40 | 65.46 | 56.43 | 55.24 | 52.64 | **51.92** | 47.25 | **40.70** | 33.42 | 22.74 |

Against that ladder, 100,000 rolls of `startingSkills` + `rollPotential`:

| band | mid | her ceiling p5 | **p50** | p95 | max | **share of careers whose CEILING is above the world #100** |
| --- | --- | --- | --- | --- | --- | --- |
| **`[4, 26]` shipped** | 15 | 57.1 | **63.4** | 69.7 | 80.4 | **99.9%** |
| `[10, 20]` | 15 | 58.7 | 63.4 | 68.2 | 75.4 | 100.0% |
| `[13, 17]` | 15 | 59.1 | 63.4 | 67.7 | 73.1 | 100.0% |
| `[0, 22]` | 11 | 53.1 | 59.4 | 65.7 | 76.4 | 97.6% |
| `[0, 16]` | 8 | 51.0 | 56.4 | 61.8 | 70.9 | 91.3% |
| `[0, 12]` | 6 | 49.5 | 54.4 | 59.4 | 67.2 | 79.3% |
| `[0, 0]` | 0 | 44.2 | **48.4** | 52.6 | 57.2 | **9.0%** |

⭐⭐ **THE MEDIAN CAREER IS BORN AT THE WORLD'S #136 AND ROLLS A CEILING AT THE WORLD'S #14.**
48.40 maps to standing #136 on the fitted curve; 63.4 maps to #14 – the `[14, 1932]` anchor, to the
digit. Everything §3 measures follows from those two numbers and the parent's ability to enter her in
enough events to convert the second one.

**So: where would the band have to sit for the top hundred to be as hard as reality makes it?**
Solving the inverse exactly (`band-vs-field.ts`), the band midpoint that puts a given share of
CEILINGS above the world #100's own core:

| share above the world #100 | 50% | 25% | 10% | **6%** | **4.5%** | **3%** |
| --- | --- | --- | --- | --- | --- | --- |
| required midpoint, width 22 | 3.5 | 0.9 | −1.4 | **−2.4** | **−2.9** | **−3.6** |
| required midpoint, width 10 | 3.5 | 1.6 | −0.2 | −1.0 | −1.4 | −1.9 |
| required midpoint, width 0 | 3.5 | 1.7 | 0.1 | −0.5 | −0.9 | −1.3 |

**Every cell in the target's own columns is NEGATIVE**, at every width – a "headroom" band whose
midpoint is below zero means the median career's ceiling is BELOW the build she was born with, i.e.
she gets worse by playing. **The answer to «where would the band have to sit» is: nowhere it can go.**

⚠ **And the honest reading of that is not «the fit is wrong».** It is that the fit put a real Elo
ladder underneath a **starting build that was never calibrated against one**. `STARTING_SKILL_BAND`
(serve 40-58, ret 40-58, composure 35-55, stamina 40-60, groundstrokes 40-58) predates the fit by
months and has not been re-derived since. On the fitted curve a fourteen-year-old beginner is the
world's **#136** and **9.0%** of them out-rank the world #100 on the day they are born. In real
tennis that gap is several hundred Elo, not 71.

⚠ **One caveat on the currency, stated rather than buried.** `coreForStanding` sets a professional's
FOUR drawn attributes and her fifth (`groundstrokes`) is derived as their mean plus a small per-id
offset (`rivalGroundstrokes`), while `power()` is the mean of five. The two scales therefore differ by
one fifth of that offset, which is small and zero-mean; and ~200 live cohort players are interleaved
among the 1,600 field rows, so a merged rank maps onto a standing only approximately. Neither moves
any conclusion here by a rung.

---

## 6. THE OTHER MANAGER – and ⚠ the shape DOES differ, in the one way that matters

**Which arm the curve above is.** `econ-bench`'s **`player`** policy – today's parent, the arm
`how-fast-she-grows`, `ladder-vs-targets` and `the-fortnight-bisected` all headline. It is chosen
because it is the arm the owner's 93.3% came from, so the sweep and the complaint are the same
measurement; and because it is the only one of the three that does not bankrupt a quarter of its
careers, which would put a money filter in front of a tennis question.

`the-fortnight-bisected` §6 established that the manager is a **multiplier** and that 72% of the
12.08→27.08 gap lives in the interaction, so a band curve measured on one parent cannot be assumed to
hold on another. Four arms on `--policy july` (the 12.08 literal on today's engine) say what does and
does not carry over.

### 6a. The instrument reproduces both published arms before anything is read off it

| shipped band, 90 careers | `how-fast-she-grows` §4b | **this page** |
| --- | --- | --- |
| `july`: reached the horizon | 75.6% | **75.6%** |
| `july`: bankruptcies | 22 | **22** |
| `july`: **top-100, of horizon** | **8.8%** | **8.8%** (6/68) |
| `july`: top-250, of horizon | 64.7% | **64.7%** |
| `july`: Slam played, of horizon | 38.2% | **38.2%** |
| `july`: median career-best rank | #191 | **#191** |
| `july`: median first top-100 | 28.8 (n=6) | **28.75 (n=6)** |
| `player`: median career-best rank | #9 | **#9** |
| `player`: median age at 90% of ceiling | 16.4 | **16.40** |
| `player`: ceiling spent at 18 | 92.8% | **92.83%** |
| `player`: **top-100, of horizon** | **93.3%** clean `83b8280` / **95.6%** working tree | **95.6%** |

⚠ **The one row that is not identical is identical to the OTHER published arm, and that is expected.**
This branch is cut at `bd02c20`, which CONTAINS the `match/point.ts` `retireDurability` change that
was uncommitted when `how-fast-she-grows` §2d measured its clean and working arms – and which
`wave/the-shop` has since dropped (see the header note). That page measured the two at **93.3%** and
**95.6%** and found no distribution moved between them; this page reads **95.6%**, i.e. the working
arm, on committed code. Every other figure matches the clean arm to the second decimal.

### 6b. The two arms, side by side

| band | mid | width | `player` top-100 | `july` top-100 | `july` top-250 | `july` med best rank (n) | `july` bankrupt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **`[4, 26]` shipped** | 15 | 22 | **95.6%** [89.1-98.3] | **8.8%** [4.1-17.9] | 64.7% | #191 (59) | 22 |
| `[10, 20]` | 15 | 10 | **95.6%** [89.1-98.3] | **4.7%** [1.6-12.9] | 48.4% | #202 (54) | 26 |
| `[0, 16]` | 8 | 16 | **65.6%** [55.3-74.6] | **1.5%** [0.3-8.0] | 20.9% | #237 (27) | 23 |
| `[0, 0]` | 0 | 0 | **8.1%** [4.0-15.9] | **0.0%** [0.0-5.3] | 0.0% | #343 (11) | 21 |

**What carries over:** the response to the MIDPOINT. Both arms fall monotonically and steeply as the
midpoint drops, and both bottom out at the floor. The band is a genuine, single-signed, monotone
difficulty knob on either parent.

**⚠⚠ WHAT DOES NOT CARRY OVER IS THE WIDTH NULL, AND IT INVERTS.** On `player`, mean-preserving
narrowing `[4, 26]` → `[10, 20]` is **95.6% → 95.6%**, flat to the career. On `july` the same change
is **8.8% → 4.7%** – and the headline's own intervals overlap, so **by this page's own rule that is
suggestive and not established on the headline alone**. It is established by its companions, on
identical seeds, exactly as `the-fortnight-bisected` §4 does it: **top-250 64.7% → 48.4%** (44/68 →
31/64, intervals barely touching), **median career-best rank #191 → #202**, **ever paid 65.6% →
60.0%**, **bankruptcies 22 → 26**, and **median lifetime prize $169,685 → $46,575**, a factor of 3.6
for a change that moves the average career's ceiling by zero. Five door-independent companions moving
together on the same seeds is the evidence; the headline is not.

⭐ **And the mechanism is the same one as §2c, read from the other end.** Width is a TAIL parameter.
It is worth nothing when the reach is decided by the MIDDLE of the ceiling distribution – which is
where a parent who never goes bankrupt puts it, at 95.6% – and it is worth a great deal when the
reach is decided by the upper tail, which is where a parent holding a flat $5,000 and no rules puts
it, at 8.8%. **A poor parent's careers break out on an outlier; narrowing the band takes the outlier
away.**

⚠ **So the ⭐ finding in §2 is stated correctly only WITH its manager attached:** on today's parent
the midpoint does all the work and the width does none. That is the arm the owner's 93.3% came from
and the arm his question is about – but «width is inert» is not a property of the model, it is a
property of the model at a reach near 100%.

---

## 7. ⭐ THE META-QUESTION: does the 3-6% target survive the fitting

**The honest answer is that the ROW survives and its DENOMINATOR does not, and the band is not what
should move first.** Three things, argued with the numbers above.

### 7a. The target was agreed against a game that no longer exists – but not in the way it looks

`career-outcome-targets.md` was agreed **26.07**. Between then and now:

- **14.08 `6c7507b`** took `slam.drawSize` 32 → 128 and `wta1000.drawSize` 32 → 64 – worth
  **+10 careers per hundred** of top-100 reach on today's manager, and **nothing costed the reach**
  (`the-fortnight-bisected` §7);
- **17.08 `a412162`** replaced the storey bands with `SKILL_LAW`, fitted to the live 2026 WTA Elo list.
  With the manager held fixed it moves top-100 reach **1/100 → 15/100** and the corpus's best rank
  **#82 → #5**, on its own. It was predicted, measured, doubted, corroborated and escalated; it is a
  **shipped decision** and this page does not reopen it.

⚠ **What the fitting actually did to the target is subtler than "made it easier".** It replaced a
made-up ladder with a real one, and a real one is much FLATTER at the bottom: the live list's
#100 is 494 Elo behind #1, which at this engine's own exchange rate is **24.5 core points**. The
game's fourteen-year-old beginner sits **3.5 core points** below that #100 (§5). **The target did not
stop describing the game; the fitting revealed that the game's STARTING BUILD was never calibrated
against anything.** `STARTING_SKILL_BAND` has not been re-derived since, and it is the number that
puts 9.0% of newborn careers above the world #100 before a single week of training.

### 7b. ⚠ The target has no manager, and after 17.08 that is not a detail

The same engine, the same seeds, the same shipped band:

| | 12.08 manager (`july`) | today's manager (`player`) |
| --- | --- | --- |
| top-100, of horizon | **8.8%** [4.1-17.9] | **95.6%** [89.1-98.3] |
| bankruptcies of 90 | 22 | 0 |
| median career-best rank | #191 | #9 |

⭐⭐ **The 3-6% target is INSIDE the interval of one manager and excluded absolutely by the other,
with no engine change at all.** `career-outcome-targets.md` names no parent;
`how-fast-she-grows` §4b flagged that and `the-fortnight-bisected` §6 measured that the two factors
are multiplicative with 72% of the effect in their interaction. **A reach target without a named
manager is not a number a bench can be gated against**, and that is a defect in the target page, not
in the engine.

### 7c. So: the target moves, and here is the version this page would defend

**Keep the LADDER and re-base the ROW, and name the parent.** Concretely, and as a proposal rather
than a change:

1. **Name the manager in `career-outcome-targets.md`** – `econ-bench`'s `player`, i.e. a parent who
   holds a reserve, reviews the coach and enters her table. That is the closest thing the repo has to
   "a person actually playing well", and it is the arm every bench already defaults to.
2. **Accept that 3-6% cannot be reached by the development curve and stop asking it to.** The floor
   of this lever is §3a's figure, at a setting nobody would ship. If the owner wants a number
   materially below today's, the reachable region on THIS lever is roughly **55-85%** without a
   re-pin (`[0, 12]` … `[4, 20]`) and it costs the median career between a third and seven eighths of
   its lifetime earnings.
3. **⭐ And if 3-6% is genuinely wanted, the lever is `STARTING_SKILL_BAND` or `SKILL_LAW`, not
   `potentialBand`.** §5's inverse says the ceiling distribution must sit ~13-16 core points lower
   relative to the field than it does. The band cannot subtract; the starting build can, and it is
   the constant the 17.08 fit left un-refitted. **That is the measurement this page recommends
   next**, and it is a bigger job than a knob – every acceptance cut, entrant band and points curve
   was tuned against today's starting build.

⚠ **What this page does NOT argue.** It does not argue that the owner's «не так 90+%» is
unreasonable – it is easily satisfied. It argues that **95.6% → 3-6% and 95.6% → 65% are different
requests**, that only the second is on this lever, and that the second one has a bill (§4).

### 7d. ⭐ THE RECOMMENDATION – and it is a recommendation, not a change

**⚙ For the owner's decision. CLAUDE.md invariant 4 owns every number below.**

1. **DO NOT narrow the band and do not touch its top.** Both are inert on the thing he is looking at
   (§2) and narrowing makes the pace defect worse for free (§4b). If the band is ever narrowed it
   should be for `potential-band-2026-08.md`'s own reason – dead wings – and costed there.
2. **If he wants a number and wants it on THIS lever: `[0, 16]` (midpoint 8).** It is the lowest band
   that keeps both shipped guard windows green, and it reads **65.6% [55.3-74.6]** top-100 against
   today's 95.6%, with **zero bankruptcies** and 80.0% of careers still paid. Its bill: median
   lifetime prize $13.4m → $4.1m, nineteen-year-olds above the College League's centre 83.3% → 24.7%,
   90%-of-ceiling reached at 14.5 instead of 16.4, and the skills rose's axis 86 → 76.
   ⚠ **It is a large change wearing a small diff, and §4b's third row is the part that should stop
   the pen: it moves the college freshman by four times the size of the field number
   `college-the-last-mile-2026-08.md` §3 is currently deciding.**
3. **A gentler version, if 80% is enough of a move: `[0, 22]` (midpoint 11, the shipped width).**
   **80.5%**, both guards comfortably green, median career keeps $7.6m of $13.4m, college share 52.3%.
   It is the only requested variant that is a clean single-axis change.
4. **⭐ AND THE HONEST RECOMMENDATION IS THAT NEITHER SHIPS YET.** Every option above is a difficulty
   change bought against a college fixture that is mid-decision, a pace defect that it makes worse,
   and a target with no manager in it. **The order this page recommends – an order of decisions, not
   of edits:**
   1. **Put a manager in `career-outcome-targets.md`.** One line. Until it is there, «is the reach
      inside the target?» has no answer (§7b).
   2. **Then decide whether the target is 3-6% or something reachable.** §7c gives the numbers for
      both. If it stays 3-6%, this lever is off the table and the next measurement is
      `STARTING_SKILL_BAND` against the fitted curve.
   3. **Then `ageCurve`**, which owns the pace and is the one lever this page shows the band actively
      fights.
   4. **Then the band**, chosen against whatever survives (1)-(3). It is a real knob with a smooth,
      monotone, single-axis response – it is simply not the one that was described to him.

---

## 8. What the specs got wrong

1. **⚠ `potential-band-2026-08.md` §6a quotes a guard window that has been re-pinned.** It prints
   `tests/econ-reach.test.ts`'s 14→18 pro proxy as window **`[7, 21]` anchored at 13**; the shipped
   test asserts `>= 3` and `<= 18` against a measured **6** (the 22.08 re-pin). `tools/potential-band-sweep.ts`
   carried the same stale pair and has been re-pointed on this branch. Its whole §6a verdict column
   is computed against the wrong window – no conclusion changes, because every 11.08 variant was a
   LIFT and lifts fail at the top, but a reader pricing a LOWERING off that table would be told a
   `[0, 12]` was fine when it is red.
2. **⚠ `potential-band-2026-08.md` §5's `[10, 20]` verdict is stale in its constant.** It rejects the
   mean-preserving band because «its MAX talent is 74.9, below the world #1's core of **77**, so
   nobody could ever be world #1». After 17.08 a professional's strength is not `FIELD.tiers[].core`
   at all – it is `coreForStanding`, whose top is **`SKILL_LAW.top` = 76.4**. Measured here, `[10, 20]`'s
   max mean-of-five is **75.4** against 76.4. **The conclusion survives and the argument has to be
   rewritten against a different constant** – and the same is true of `fieldPros.ts:203`'s
   `tourElite.core = [67, 77]` derivation, which is still written as an argument about talent for a
   band that now only shapes POINTS.
3. **⚠ `how-fast-she-grows-2026-08.md` §10's candidate 4 describes the wrong operation.** It prices
   the band as «⚠ wrong direction for §9c … Narrowing the band narrows the spread further; widening
   it is what §9c argues for», and it is right about both. But the operation the owner's «не так
   90+%» asks for is neither: it is **LOWERING**, which that row does not mention, and lowering is the
   only one of the three that moves the ladder at all. Its own ranking of the band as candidate 4 is
   nevertheless vindicated – §7 says the same thing this page's numbers say.
4. **⭐ `how-fast-she-grows-2026-08.md` §9a's «the growth is the one thing that does not move» is
   confirmed and completed.** It measured age-at-90%-of-ceiling as 16.1-16.4 across four arms whose
   ladder outcomes span 0% to 95.6%, and concluded the pace is not the manager's. This sweep adds the
   other half: it is not the band's EITHER, in the direction that would help. Lowering the band moves
   that age **earlier** (16.4 → 13.6), because `growWeek` takes a share of a smaller remainder. **The
   pace defect belongs to `ageCurve`, and nothing else on the lever list can reach it.**
5. **⚠ `career-outcome-targets.md` names no manager** (§7b) and its own «report every reach figure in
   BOTH bases» is now doing less work than it was written to do: on today's `player` arm nothing
   fails, so the two bases are identical and the multiplication the page says «is where the design
   lives» has nowhere to happen.

---

## 9. What this page did NOT do

- **It changed no engine constant and no test bound.** `git status --porcelain -- src` is empty on
  this branch; the band is an environment override read by a probe.
- **It did not re-verify that the field ignores the band.** `potential-band-2026-08.md` §1 established
  that with three hash arms and nothing in this window touches `season/cohort.ts` or `fieldProsFor`'s
  ceiling model; it is cited, not re-run.
- **It did not sweep the other three levers** (`ageCurve.peakRate`, the acceptance doors,
  `FIELD`/`SKILL_LAW`), and §7's recommendation names which of them the evidence now points at.
- **It did not re-measure `COLLEGE_LEAGUE.field`.** §4b prices the freshman that each band produces;
  choosing the field's own number is `college-the-last-mile-2026-08.md`'s decision and it is second
  in line by `how-fast-she-grows` §9d's argument, which this page corroborates.
- **It ran `test:sim` and the full gate never**, because it changed nothing that either could see –
  `tools/` only. §4c's guard numbers are the guards REPRODUCED, not run.
