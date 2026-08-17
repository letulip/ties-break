---
type: spec
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-17
---

# The talent breakdown – college against the tour, per band, and whether college needs slowing

**The owner, 17.08, verbatim:**

> «вот это мощный темп, конечно, но мне кажется малореалистичный. А еще мне интересно посмотреть на
> разбивку по бесталанная, средняя, талантливая и одаренная по этому показателю. Кто на каком месте в
> колледж заходил, на какой позиции из колледжа выходил (и есть ли примеры из жизни куда они
> возвращаются, кстати?) и за какой срок каких результатов добивались. 22 года - это у нас вроде
> где-то на финальной части пути до максимума, верно? Может быть тогда мы проанализируем и примем
> решение, нужно ли притормозить развитие в колледже и если да, то на сколько.»

**⚠⚠ THIS SPEC SHIPS NOTHING.** It brings the numbers and the option sizes. Whether college
development is slowed, and by how much, is his ruling and is deliberately not taken here.

---

## 0. THE ONE THING TO READ FIRST: HIS PREMISE ABOUT 22 IS RIGHT, AND IT IS WHY THE TWO QUESTIONS ARE ONE

> «22 года - это у нас вроде где-то на финальной части пути до максимума, верно?»

**Yes, and it is stronger than "somewhere near".** `ECONOMY.development.ageCurve`:

| knob | value | what it means |
| --- | --- | --- |
| `growthStart` | 13 | the steep years begin |
| `growthEnd` | 18 | ...and ease off – `growthEase: 0.5`, i.e. half the rate at 18 that she had at 13 |
| `plateauStart` | 23 | from here she maintains rather than climbs (`plateauRate` 0.0009 against `peakRate` 0.0062) |
| `declineStart` | 29 | and from here she loses |

**College is 19 to 23** (`ENDINGS.collegeYears` = 4, asked on the nineteenth birthday). So the
scholarship occupies **the last four years in which she can still grow at all** – it ends the week
the plateau starts. That is not a coincidence of two constants; it is the reason "is the pace
realistic" and "should college be slowed" are the same question, and it is why a change to college
development is a change to the last growth she will ever get rather than to a middle stretch.

---

## 1. ⚠⚠ THE GAME HAS NO TALENT BANDS. HIS FOUR WORDS HAVE NO CODE TO ATTACH TO.

Checked before anything was measured, because inventing his words into the engine would be the exact
failure `docs/research/college-and-the-junior-exit.md` §0 was written against.

* **`rollPotential`** (`src/engine/development.ts`) draws a **continuous** per-attribute headroom out
  of `ECONOMY.development.potentialBand` = **[4, 26]** and adds it to the birth build. There is no
  slice, no tier, no name.
* **The ceiling is deliberately never displayed** – `docs/decisions.md` #11.
* **The ONE constant in this codebase that bands a ceiling** is `ECONOMY.academy.ceilingBand` =
  **[56, 70]**, the scout's 0..1 ruler in `academy.ts`, whose own comment records the population it
  was fitted to: *«measured: p10 56, p50 62, p90 69»*. It is a ruler, not a set of bands.
* The only per-career talent SCALAR the engine computes is **`ceilingOf(potential)`**
  (`src/engine/academy.ts`) – the mean of her five attribute ceilings, which is what the scout reads.
* Everything else that greps as "talent" is prose, or `HomeScreen.vue`'s **condition** bands, which
  are about her body this week and not about her.

**So the four bands in every table below are MINE**: quartiles of `ceilingOf(potential)`. His four
words are a **reading** of those quartiles and are written into no source file. The instrument is
`tools/college-talent-bands.ts` and its header says the same thing in the same words.

**⚠ AND THE CUT IS TAKEN AT WEEK 0, BEFORE ANY CAREER IS WALKED.** The obvious way – quartiles of the
careers that survived to nineteen – is wrong for a two-arm comparison and quietly so: which careers
end before the fork depends on the field, i.e. on the very commit the control arm reverts, so the two
arms would be cut differently and every per-band difference would be part talent and part *"these are
not the same girls"*. `ceilingOf(rollPotential(...))` reads `seed:potential`, the birth build and
`potentialBand` and nothing else, so a cut taken at week 0 over all seeds is identical on every arm by
construction. §5 of the tool asserts it rather than claiming it.

---

## 2. PREDICTIONS – WRITTEN BEFORE THE FULL RUNS, AND THE PROVENANCE OF THAT CLAIM

⚠ **Honest disclosure, because "predicted before measured" is worth nothing if it is not true.** These
were written after a **9-career smoke run** (`--seeds 1`) that existed only to catch API errors – and
it did catch one, see §3 – and **before** the 108-career arms. So P1, P5 and P6 had a nine-row
preview; P4 and P7 did not, and they are the two the owner's decision actually rests on.

| # | prediction |
| --- | --- |
| **P1** | The game has no talent bands and `ECONOMY.academy.ceilingBand` is the only banding constant. The four bands will have to be mine. |
| **P2** | The ceiling quartile edges land near **60.9 / 63.4 / 65.9** (analytic: mean five birth ranges 48.4 plus mean headroom 15 = 63.4, combined SD 3.74, quartiles at ±0.674σ). |
| **P3** | Rank at the fork is far WORSE than the career high in every band and both arms – at nineteen she has too few counting results to be on the list at all (`RANKABLE_MIN`); `college-as-a-second-act-2026-08.md` §2c measured #290 at the fork. |
| **P4** | ⭐ **The college-vs-tour gap is LARGEST in the top band and smallest in the bottom band.** An untalented girl is capped by her ceiling wherever she spends 19-23, so four years off tour costs her little; the gifted girl is the one for whom four years of un-accumulated ranking is expensive. **This is the prediction the owner's question rests on.** |
| **P5** | Age at career high is LATER on the college arm in every band, by something under the four years she was away, and capped by the decline at 29. Tour ≈ 25-27, college ≈ 26-28. |
| **P6** | The tour arm peaks BETTER (lower rank) than college in the top two bands and roughly level in the bottom two. |
| **P7** | ⭐ **On the control arm the LEVEL collapses in both arms – career highs several times worse – while the college↔tour DIFFERENCE in places stays roughly what it is on HEAD.** i.e. the eye-catching pace is the skill wave and the college↔tour trade is college's. |
| **P8** | Weeks from graduation to being ranked again is short and roughly band-independent, because `RANKABLE_MIN` is a count of tournaments, not a quality bar. |

---

## 3. METHOD, AND THE ARM PROVENANCE

**The instrument:** `tools/college-talent-bands.ts`. Measurement only – patches nothing, writes no
engine constant, exports no career.

**The population:** `tools/econ-bench.ts`'s **9 presets × 12 seeds = 108 careers**, `POLICIES[1]` (the
model of a reasonable parent), walked **fourteen to thirty-two**.

**The two arms of the college question**, sharing the same seeds and the same world up to the fork:

| arm | after the fork at nineteen |
| --- | --- |
| **COLLEGE** | `answerFork(world, 'college')` – **no tier**, so the engine's own default takes the cheapest open place. Its comment: a call with no tier is a caller that never asked the player, and the cheapest open place *«is the only default that cannot be read as advice»*. The tier spread is not this file's question; it was measured separately (`decisions.md` 17.08: the coaching is worth **+0 / +8 / +2** on the top-100 row). |
| **TOUR** | `answerFork(world, 'continue')` and the same policy for the same weeks |

**⚠ The arms are re-walked from week 0, not cloned** – `rng` is a stateful closure with no honest deep
copy, which is why `tools/college-return-probe.ts` re-walks too.

### 3a. ⚠⚠ THE ARM PROVENANCE FOR "HOW MUCH OF THIS IS THE SKILL WAVE"

The owner is being asked whether to slow **college**. Answering with a number that is mostly the skill
wave's rank-to-core re-deal would send him at the wrong lever, so the attribution is measured rather
than argued:

| arm | commit | built where |
| --- | --- | --- |
| **B** | `7c0d1f1` (branch HEAD, the skill wave IN) | the shared checkout |
| **A** | `7c0d1f1` with **`a412162` reverted** (`git revert --no-commit`) | `../tb-talent-A`, a dedicated worktree |

`a412162` is *"the law is the live 2026 curve"* – it replaced each field professional's uniform
in-band `core` draw with `coreForStanding(rank)`, which is the re-deal that moved the top-100 row
**38 / 40 / 34 → 85 / 93 / 74** in three hours.

**⚠ THE CONTROL IS MY OWN TREE WITH THE CHANGE REVERTED, NOT AN OLDER COMMIT** – CLAUDE.md's rule, and
here it matters more than usual because four other commits landed on this branch after `a412162`.
`src/engine/season/fieldPros.ts` was **not touched by any of them**, so the revert applies clean.

**⚠ AND THE READER WAS CHECKED, NOT ASSUMED.** `git grep` for `SKILL_LAW` / `coreForStanding` on the A
tree returns exactly one hit outside `fieldPros.ts` itself – a **comment** in `match/rating.ts`. No
live import survives the revert, so the A arm is self-consistent rather than a tree where a constant
sits with no code reading it.

### 3b. ⚠ THE INSTRUMENT BUG THIS FILE FOUND IN ITSELF, RECORDED BECAUSE IT IS THE FAILURE MODE CLAUDE.md WARNS ABOUT

The first smoke run reported **"never ranked 18/18"** with every career **"still going"** – a clean,
convincing null. It was not one. `kidAgeExact` takes **`(week, birthMonth)`**, not a world; the world
argument made it `NaN`, `NaN < TO_AGE` is `false`, and **the entire post-fork walk was skipped in
silence**. The tell was the clock: **21 seconds** for eighteen careers that should each have walked
830 weeks. Fixed, and the fix is commented at the call site so the next reader does not have to
rediscover it.

⚠⚠ **AND THE CHEAPEST GUARD ALREADY EXISTED AND I SKIPPED IT.** `tsconfig.app.json`'s `include` is
`["src/**/*.ts", "src/**/*.vue", "tests/**/*.ts", **"tools/**/*.ts"**]` – **benches are type-checked**.
Confirmed rather than assumed: the same call in a throwaway file gives
**`error TS2554: Expected 2 arguments, but got 1`**. So **`npx vue-tsc -b --force` would have caught
this before a single career was walked**, and I ran the bench first. **The rule this earns: type-check
a new bench before running it, not after** – the run costs fourteen minutes and the check costs
seconds, and a bench is exactly where a silent `NaN` is most expensive because its output is a
plausible-looking table.

---

## 4. ⚠⚠ READ THIS BEFORE ANY TABLE: COLLEGE IS NOT THE LEVER HE IS REACHING FOR

**The complaint is about the pace** – «мощный темп … малореалистичный», a career reaching about **#12**
where it used to reach **#97**. **The lever he is asking about is college development.** These are not
the same object, and the gap between them can be sized off the shipped constants alone, without a
simulation, which is why it comes first.

### 4a. What the college development dimension actually spans

`COLLEGE_TIERS` names a rung of `ECONOMY.coach.developmentFactor` per place – no magnitude invented:

| place | rung | factor | was, before `3b6d92e` |
| --- | --- | --- | --- |
| `state` | `budget` | **0.95** | `coach: null` → **`self` 0.82** |
| `national` | `middle` | **1.04** | same |
| `private` | `high` | **1.11** | same |

Measured four-year skill gain (`decisions.md`, 17.08): **+1.21 / +1.30 / +1.37** against the reverted
arm's **+1.07 / +1.06 / +1.07**. So **the whole dimension, cheapest place to dearest, spans about
0.30 skill points** – and even that overstates it, because the honest counterfactual for "slow it" is
against the shipped `state` place, not against `self`.

### 4b. ⭐⭐ AND 0.30 SKILL POINTS IS WORTH SINGLE-DIGIT RANK PLACES

Measured off the shipped rank-to-core law itself (`coreForStanding`, `SKILL_LAW.eloPerCore = 20.2`):

| at rank | +1.00 core is worth | **+0.30 core – the whole college dimension – is worth** |
| --- | --- | --- |
| #10 | 2 places | **1 place** |
| #20 | 7 places | **3 places** |
| #50 | 13 places | **5 places** |
| #100 | 10 places | **3 places** |
| #200 | 15 places | **5 places** |

⭐⭐ **SO SLOWING COLLEGE CANNOT MOVE THE PACE, AND THE ARITHMETIC IS NOT CLOSE.** Deleting the college
coaching outright – putting all three places back on `self`, which is the largest change anyone could
ask for – **buys back at most about five rank places.** The acceleration he is objecting to is **#97 →
#12, eighty-five places.** College is **on the order of 5% of it**, and the other 95% is `a412162`,
the skill wave's re-deal of the field's rank-to-core law.

This is the same finding the paired arms already reported from the other direction – the coaching is
worth **+0 / +8 / +2** on the top-100 row while the row itself moved **38 / 40 / 34 → 85 / 93 / 74** –
and it is now sized in the currency he asked the question in.

**⚠ If the tables below show college careers peaking high, that height is the world's new rank scale,
not the four years.** The college↔tour columns are the only place college's own contribution is
visible, and it is the DIFFERENCE between those two columns – never the level of either.

---

## 5. THE MEASUREMENT

**A = `7c0d1f1` with `a412162` reverted, in `../tb-talent-A`, 828s, 105 careers × 2 arms.
B = `7c0d1f1`, the shared checkout, 849s, 107 careers × 2 arms.** Fourteen to thirty-two.

### 5a. ⚠ THE PROVENANCE CHECKS, FIRST, BECAUSE A TABLE THAT FAILS THEM IS NOT EVIDENCE

| check | result |
| --- | --- |
| the two arms are not the same run | **112 differing lines.** Not a byte-identical diff |
| the cut is identical on both arms | **60.331 / 62.722 / 64.877 on BOTH** – the week-0 cut did its job |
| every career has one ceiling on both arms | **0 of 105 / 0 of 107 mismatched** |
| the horizon outlives the peak | **saturation 3% (A) / 2% (B)** set their high in the last season. The age curve stopped the climb, not the cap |
| careers that never ranked at all | 4% (A) / 2% (B) |
| careers ended inside the four years | **0%** on both – no survivorship gap in the return columns |

### 5b. ⚠⚠ THE ONE LIMITATION THAT GOVERNS EVERY PER-BAND NUMBER: EACH BAND IS **NINE GIRLS**

`econ-bench`'s seed is `bench-${background}-${index}` – **the coach rung is not in it.** Nine presets
across three backgrounds × 12 indices = **36 distinct girls**, each walked at 2–4 coach rungs. Measured
directly rather than reasoned about: **36 distinct seeds, 9 per band, one ceiling each.**

**So a band's `n = 26` is 26 career ROWS and about 9 independent girls**, and the backgrounds are not
even: working appears 3×, middle 4×, wealthy 2×. This is the same trap `tools/college-fork.ts`'s own
header records ("keying a band on the seed string silently folds three rows into one").

**What survives this and what does not:**

| claim | status |
| --- | --- |
| **college vs tour, within a band** | ⭐ **SOLID** – it is PAIRED: the same girl, the same rung, the same world to the fork, differing only in the answer |
| **A vs B on the whole population** | ⭐ **SOLID** – 36 girls, all rows |
| **the ORDERING between bands** | ⚠ **NINE GIRLS PER CELL. Directional only.** Do not act on it without a re-run |

### 5c. ⭐⭐ WHAT THE SKILL WAVE DID – and it is not only the pace

**Whole population, career-high band reached, college / tour:**

| | top 500 | top 200 | top 100 | top 50 | **top 10** |
| --- | --- | --- | --- | --- | --- |
| **A** (wave OUT), n=105 | 96% / 96% | 96% / 96% | 50% / 54% | 30% / 30% | **2% / 5%** |
| **B** (wave IN), n=107 | 98% / 98% | 98% / 98% | 90% / 93% | 87% / 88% | **46% / 50%** |

**Career-high MEDIAN by band (college / tour), with p10/p90 in §5d:**

| band | **A** – wave out | **B** – wave in |
| --- | --- | --- |
| untalented (9 girls) | #121 / #127 | **#11 / #12** |
| average (9) | #104 / #106 | **#15 / #13** |
| talented (9) | #89 / #78 | **#12 / #12** |
| gifted (9) | #33 / #27 | **#7 / #6** |

⭐⭐ **THE SPREAD ACROSS TALENT COLLAPSES FROM ~100 PLACES TO ~6.** On A a career high runs #127 for the
untalented girl down to #27 for the gifted one. On B every band lands between **#6 and #15**.

⚠⚠ **AND THE ORDERING BREAKS.** Top-100 rate by band, A: **4% → 50% → 54% → 88%** (college), a clean
monotone gradient in talent. B: **77% → 93% → 89% → 100%** – saturated. And the top-10 row on B is
**non-monotone**: untalented **50%** (13/26) against average **18%** (5/28) and talented **33%** (9/27).
⚠ **On nine girls a cell, treat this as a flag and not a finding** – but it is the flag worth raising,
because *"the untalented girl reaches the top ten more often than the average one"* is not a
difficulty complaint, it is a **validity** complaint, and it is a different question from his.

### 5d. ⭐⭐ WHERE SHE STOOD GOING IN, AND WHAT COLLEGE ACTUALLY COSTS HER

**Rank at nineteen, the week the fork is asked** (identical on both answers by construction – p10/p25/median/p75/p90):

| band | **A** | **B** |
| --- | --- | --- |
| untalented | #151/#168/**#176**/#220/#280 (24/25) | #120/#126/**#138**/#178/#216 (26/26) |
| average | #143/#165/**#188**/#253/#302 (28/28) | #39/#75/**#137**/#162/#177 (27/28) |
| talented | #140/#148/**#174**/#232/#252 (23/26) | #23/#96/**#125**/#184/#230 (26/27) |
| gifted | #123/#135/**#149**/#173/#183 (26/26) | #7/#13/**#55**/#117/#148 (26/26) |

**Rank at twenty-three.** ⚠ **The college column can only print "–"**: graduation week is the one week
of a career when the 52-week window is empty by construction. The honest column is the tour arm's:

| band | **A** tour at 23 | **B** tour at 23 |
| --- | --- | --- |
| untalented | #132/#168/**#187**/#223/#238 (24/25) | #12/#14/**#24**/#186/#219 (26/26) |
| average | #115/#128/**#156**/#182/#209 (28/28) | #11/#15/**#17**/#67/#157 (27/28) |
| talented | #104/#110/**#142**/#183/#201 (23/26) | #12/#15/**#18**/#25/#173 (25/27) |
| gifted | #15/#30/**#92**/#148/#172 (26/26) | #5/#6/**#12**/#16/#19 (26/26) |

⭐⭐ **THE PRICE OF COLLEGE IS NOT THE CEILING – IT IS FOUR YEARS OF HER PEAK.** Career-high difference
(college − tour, in places; negative = college worse):

| band | **A** | **B** |
| --- | --- | --- |
| untalented | **+6** | **+1** |
| average | **+2** | **−2** |
| talented | **−11** | **0** |
| gifted | **−6** | **−1** |

**Age at that career high** (median, college vs tour) – this is where the four years show:

| band | **A** college / tour | gap | **B** college / tour | gap |
| --- | --- | --- | --- | --- |
| untalented | 27.1 / 24.9 | **+2.2 yr** | 29.3 / 27.7 | **+1.6 yr** |
| average | 26.3 / 25.9 | +0.4 | 27.6 / 26.2 | +1.4 |
| talented | 27.3 / 26.2 | +1.1 | 27.6 / 25.8 | +1.8 |
| **gifted** | 27.3 / 24.0 | **+3.3 yr** | 26.9 / 22.7 | **+4.2 yr** |

⭐ **P4 AND P5 BOTH HOLD, AND THEY HOLD ON BOTH ARMS.** The gifted girl is the one college costs, and
what it costs her is **three to four years of arriving**, not rank places. The `weeks exit → career
high` column says the same thing from the other side: on the **tour** arm it goes **negative** for the
gifted band (p10 **−171 weeks** on B, **−59** on A) – she had already peaked before twenty-three – while
on the college arm it is positive in every band, because nothing can rank inside the freeze.

### 5e. THE ROAD BACK – she is ranked again almost immediately (P8 holds)

`weeks from the exit to holding a professional rank again`, median:

| band | **A** college / tour | **B** college / tour |
| --- | --- | --- |
| untalented | 3 / 1 | 5 / 1 |
| average | 5 / 1 | 1 / 1 |
| talented | 5 / 1 | 1 / 1 |
| gifted | 3 / 1 | 1 / 1 |

**One to five weeks, and flat across talent** – `RANKABLE_MIN` is a count of tournaments, not a quality
bar, so the return is a formality. **And by twenty-seven the two answers have converged**: rank four
years after the exit, gifted band, B: **college #12 vs tour #12**; A: **#97 vs #84**.

---

## 6. PREDICTED vs MEASURED

| # | predicted | measured | |
| --- | --- | --- | --- |
| P1 | no talent bands in the game | confirmed – `potentialBand` is continuous, `ceilingBand` is a ruler | ✅ |
| P2 | edges near 60.9 / 63.4 / 65.9 | **60.33 / 62.72 / 64.88** – within 1.0 on all three | ✅ |
| P3 | rank at the fork far worse than the career high | A #176→#121 untalented, #149→#33 gifted; B #138→#11, #55→#7 | ✅ |
| **P4** | ⭐ the college↔tour gap is largest in the top band | **the AGE gap is: +4.2 yr gifted vs +1.4 average on B; +3.3 vs +0.4 on A.** The RANK gap is small in every band | ✅ **on the axis it lands on, which is time, not rank** |
| P5 | age at career high later on the college arm, tour 25-27 / college 26-28 | later in **8 of 8** band-arm pairs. Tour medians 22.7-27.7, college 26.3-29.3 | ✅ |
| P6 | tour peaks better in the top two bands, level in the bottom two | gifted −1 (B) / −6 (A), talented 0 / −11; untalented **+1 / +6** to college | ✅ |
| **P7** | ⭐ the level collapses on A while the college↔tour difference survives | **top 10: 46%/50% → 2%/5%. The college−tour career-high difference stays within ±11 places on BOTH arms.** | ✅ |
| P8 | return to a ranking is fast and band-independent | 1-5 weeks, flat | ✅ |

⚠ **P4 was right about WHICH band and wrong about the CURRENCY** – I predicted the gifted girl would
lose rank places and she does not; she loses **years**. Recorded because the prediction being half
wrong is the part that taught something.

---

## 5. THE RESEARCH HALF

> «(и есть ли примеры из жизни куда они возвращаются, кстати?)»

See `docs/research/college-and-the-junior-exit.md` §3a. **⚠ Nothing measured in this repository appears
there as external evidence**, per that document's §0 sourcing rule.

---

## 7. ⚠⚠ FOR THE OWNER – the options, unshipped

> «Может быть тогда мы проанализируем и примем решение, нужно ли притормозить развитие в колледже и
> если да, то на сколько.»

**⚠ NOTHING BELOW IS BUILT. Every option is priced and none is taken.**

### 7a. ⭐⭐ THE RECOMMENDATION: DO NOT SLOW COLLEGE. IT IS THE WRONG LEVER FOR THIS COMPLAINT.

Not because college is sacred, but because §4b's arithmetic and §5's measurement agree: **the entire
college development dimension is worth about 0.30 skill points, which is one to five rank places** –
and **measured**, the college↔tour career-high difference is **+1 / −2 / 0 / −1 places on HEAD** and
**+6 / +2 / −11 / −6 on the control**. The pace he objects to is **eighty-five places**. Slowing
college would leave the pace exactly where it is, cost him the one part of the college branch that
makes the three places a real choice, and – worst – it would look like the question had been answered.

⭐⭐ **AND THE MEASUREMENT FOUND THE THING THAT WOULD ACTUALLY ANSWER HIM.** Whole-population top-10
rate: **2% / 5% with the skill wave reverted, 46% / 50% with it in.** The career-high spread across the
whole talent range collapses from about **100 places to about 6**. That is the pace, in one number
pair, and none of it is college's.

⚠ **AND ONE OPTION IS ACTIVELY BAD RATHER THAN MERELY INEFFECTIVE.** Reverting the coaching entirely
puts all 208 college weeks back on **`self` = 0.82, the parent-on-the-court rate, for a girl at a
university with a squad and a full training week** – which `decisions.md` records as the *older bug*
that the change fixed, not as a balance setting anybody chose. It is a return to "nobody was coaching
her", and it is not a slowdown of a thing, it is the reinstatement of an oversight.

### 7b. THE OPTIONS, SIZED – if he wants college slowed anyway

Every option is a **rung move**, so no magnitude is invented and a re-tune of the coach ladder carries
the college places with it – the property `3b6d92e` was built for.

| # | change | factors (state / national / private) | development cost vs today | worth, in rank places |
| --- | --- | --- | --- | --- |
| **0** | **ship nothing** | 0.95 / 1.04 / 1.11 | – | – |
| **1** | drop the dear place one rung | 0.95 / 1.04 / **1.04** | −6.3% on `private` only | **≈1–2 places** |
| **2** | drop every place one rung | **0.82** / **0.95** / **1.04** | −13.7 / −8.7 / −6.3% | **≈2–3 places** |
| **3** | flatten – every place coaches at `budget` | 0.95 / **0.95** / **0.95** | 0 / −8.7 / −14.4% | **≈2–3 places**, and it deletes the choice between the three places |
| **4** | full revert to `self` | **0.82 / 0.82 / 0.82** | −13.7 / −21.2 / −26.1% | **≈5 places** – ⚠ and this is 7a's bad option, not a setting |

⚠ **NONE OF THESE IS A PACE FIX**, and option 4, the largest, is still seventeen times too small to
account for what he saw.

### 7c. ⭐ THE LEVER THAT WOULD ACTUALLY MOVE THE PACE, named so he can rule on the right thing

The pace is `a412162` – the field's rank-to-core law. `docs/specs/the-skill-gap-2026-08.md` §7d already
puts **three options** in front of him for exactly this, and `decisions.md` records that **the odds are
invariant to the `(SKILL_K, eloPerCore)` dial**, so there is no setting that fixes both ends at once:
re-tune `rollPotential` as its own wave, take `×2.0` and re-derive every `entrantPctBand`, or accept
that careers reach the top ten. **That is the decision his sentence is really asking for**, and it is
already written up and waiting rather than needing new work.

### 7c-bis. ⚠⚠ THE QUESTION HE DID NOT ASK, AND IT MAY MATTER MORE THAN THE ONE HE DID

On the control arm the top-100 rate rises **4% → 50% → 54% → 88%** with talent. On HEAD it reads
**77% → 93% → 89% → 100%**, and the top-10 row is **non-monotone** – the untalented band reaches the
top ten **50%** of the time against the average band's **18%**.

⚠ **NINE GIRLS A CELL (§5b), so this is a flag and not yet a finding.** But if it survives a bigger n,
it says the re-deal did not only make the game faster – **it decoupled the outcome from the talent she
was born with**, which is the one property a career simulation cannot trade away. **Cost to settle it:
re-run `tools/college-talent-bands.ts --seeds 48` on both arms – about an hour a side, no new code.**
Recommended before any ladder decision, because it changes what the ladder decision is FOR.

### 7d. ⚠ WHAT WOULD CHANGE THIS ADVICE

If he wants **the college years to cost her something** – a real trade rather than a small bonus – the
dial is **not the development factor at all**. It is what the four years do to her RANKING: she enters
nothing for 208 weeks, and §5's college↔tour columns are where that price is visible. Making college
**slower** does not make it more of a trade; making the return **harder or later** would. That is a
different build and a different decision, and it is named here rather than half-built.
