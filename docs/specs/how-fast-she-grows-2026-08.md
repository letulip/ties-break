---
type: spec
status: draft
area: engine/balance
canonical: false
last-reviewed: 2026-08-27
---

# How fast she grows – the pace, measured against the model's own anchor (27.08.2026)

Captured verbatim, because the question is his and this is the third time he has raised it:

> «а не слишком ли быстро растут наши спортсменки? я его уже задавал, кажется. Alice на момент
> поступления в колледж играла уже на 500 и шлемах и имела на счету 600к+ в 18-19 лет. Т.е. все наши
> юношеские были где-то сильно раньше и всего 1 или 2 сезона, т.е. задолго до открытия окна с
> колледжем вообще.»

⚠ **He is right that he has asked before, and he is right that it was never answered.** On 14.08 he
said «я и чувствую, что у нас как-то слишком быстро всё происходит», and
[where-the-points-come-from-2026-08.md](where-the-points-come-from-2026-08.md) answered it – **on the
points axis**. Two constants shipped that day (`slam.points` and `wta1000.points` last element → 10)
and the money moved where he wanted it. **The AGE axis was never measured at all**, by that page or
any other. This page measures it.

**Why the name.** `where-the-points-come-from` is this page's direct ancestor – same owner, same
complaint, other axis – so `how-fast-she-grows` is deliberately its sibling. It names the QUESTION
rather than the finding, because a filename carrying a number ("three-years-early") becomes a lie the
first time the curve is re-tuned, and this file's number is the thing most likely to move.

**The instrument:** `tools/growth-pace-probe.ts`. Measurement only – it patches no constant, not even
temporarily, and every career is advanced through the same public commands the UI drives.

---

## 0. The one-page answer

**Yes, and by about three years – but the pace and the OUTCOME are two different defects and only one
of them is the growth curve.**

1. **THE PACE, against the model's own anchor: ~3 years early.** Median age at a first top-100 is
   **18.9** against the anchor's **~22** – **3.07 years early**. The mechanism is upstream of every
   ladder: **90% of her rolled ceiling is spent by age 16.4 and 92.8% by 18**, so the anchor's «top-100
   about 4.5 years after first points» is asking for a climb from a tank that is already empty. ⭐ This
   figure is **invariant across every manager measured** – 16.4 / 16.2 / 16.1 for the player, the July
   player and the grinder – so it is the curve, not the money and not the parent.
2. **THE OUTCOME, against the 26.07 targets: outside them, and not by a little.** Top-100 analog
   measures **93.3%** against a **3-6%** target. But ⚠ **this half is almost entirely the BENCH'S
   MANAGER, not the engine**: the same engine with the `player` policy as it stood on 12.08 reads
   **8.8%** – inside sight of the band. §4a.
3. **Every one of his four observations is the MEDIAN case, not a tail.** «на 500 и шлемах» – first
   W500 main draw at a median of **18.9**, first Slam at **19.0**. «600к+ в 18-19» – **30%** of careers
   hold ≥$600,000 of career prize money at 19 and the 75th percentile is **$799,518**. «юношеские…
   всего 1 или 2 сезона» – the median career gets **1** junior-majority season and the interquartile
   range is **1 to 2**. He described the middle of the distribution from one career.
4. **⚠⚠ WHICH IS THE DEFECT – the pace, or the college field?** **The pace.**
   [college-the-last-mile-2026-08.md](college-the-last-mile-2026-08.md) §3 should be **held**: its
   direction is right and in fact understated (§9b), but the field number is a DIFFERENCE against the
   freshman it faces, and that freshman is three years over-developed. Choosing it now means choosing
   it twice – which is §3's own ⭐ argument about §1, one level up.

---

## 1. The two anchors, quoted rather than summarised

They are DIFFERENT CLAIMS and they fail differently, which is why both are measured.

### 1a. THE PACE ANCHOR – the development model's own calibration

`src/engine/development.ts:10-11`, quoting `docs/plan.md:97` (Phase 4) verbatim:

> "potential + age curves (calibrate to real milestones: **points ~17-18, top-100 ~4.5 yrs later,
> peak 23-28, decline ~29+**), weekly training allocation, coach quality"

**First points at 17-18 plus 4.5 years puts the model's own target for a first top-100 at ~21.5-22.5.**
That is not this page's inference: `src/engine/economy.ts:1383` reads the same anchor the same way, in
as many words – «`development.ageCurve` is calibrated «first points 17-18, top-100 about 4.5 years
later» – a top-100 bar would first clear at ~22» – and a shipped constant (`ads.maxWtaRank: 200`) was
sized on it. **Two shipped files agree on ~22.** That is the bar.

The constants that produce it (`src/engine/economy.ts:1468-1486`):

| constant | value | what it says |
| --- | --- | --- |
| `growthStart` / `growthEnd` | 13 / 18 | the steep years |
| `peakRate` | 0.0062 | share of REMAINING headroom taken per week at the steepest age |
| `growthEase` | 0.5 | half that rate by 18 |
| `plateauStart` | 23 | «by the plan's calibration: first points 17-18, top-100 about 4.5 years later» |
| `declineStart` | 29 | peak 23-28 |

⚠ **The growth is ASYMPTOTIC, and that is what makes the anchor hard to hit.** `growWeek` takes a
share of the headroom she still has, so the early years are worth many points and the late ones very
few. A curve whose steep window closes at 18 cannot also deliver its headline milestone at 22 unless
the last 4 years still carry real headroom. §9a measures whether they do.

### 1b. THE OUTCOME ANCHOR – the targets agreed 26.07

`docs/specs/career-outcome-targets.md`, agreed with the owner, of runs **reaching the horizon** (the
family did not go bankrupt and she did not quit):

| Outcome | Target |
| --- | --- |
| Saw the pro contour ($15k-analog events) | **50-65%** |
| Lives from tennis (~top-250 analog) | **15-25%** |
| Top-100 analog – a real star | **3-6%** |
| Slam-level | **<1%** |

That page also demands every reach figure in BOTH bases – conditional, and of all starts – «the two
were confused once already in discussion, and the multiplication is where the design lives». §4
prints both.

⚠ **"Slam-level" is still undefined**, as `ladder-vs-targets-2026-08.md` §2a records: the string
appears once in that document and nowhere else in `docs/`. Two readings are printed separately below
and the owner still has to pick one.

---

## 2. How it was measured, and how the instrument was proved

### 2a. The corpus, and the four arms

**Full careers, 14 → 44** (`FULL_CAREER_WEEKS`, 1612 weeks – the horizon moved from 38 with
[the-long-goodbye-2026-08.md](the-long-goodbye-2026-08.md)), stopping at whatever ending arrives.
Bankruptcy is **not** defused, because the targets page's own first row IS the bankruptcy rate. The
fork at nineteen is answered `continue` and every retirement offer refused until the game stops
asking, so what is measured is the TENNIS filter with the player's own exit choices held out.

| arm | tree | manager | careers | why it is here |
| --- | --- | --- | --- | --- |
| **MAIN** | **`83b8280`, committed HEAD, clean worktree** | `player` | **90** | the headline – measured on committed code with no other wave's work in the tree |
| WORKING | working tree, 27.08 | `player` | 90 | §2d: does the other agents' uncommitted engine work move any of this? |
| JULY | working tree, 27.08 | `july` (the 12.08 `player` literal) | 90 | §4b's attribution: engine or manager? |
| GRINDER | working tree, 27.08 | `grinder` | 90 | is any of this the bench's manager rather than the model? |

⚠ **Nine presets, 10 seeds each, in every arm** – the same seeds throughout, so every comparison
below is paired.

**Why this many, and the honest version of the sizing argument.** The tightest row on the outcome
anchor is «top-100 analog 3-6%», and at p = 0.045 a Wilson interval narrower than about ±1.5 points
needs n in the high hundreds. **90 does not buy that**, and this page says so rather than implying
otherwise: on 90 careers the interval near the band is roughly ±4 points. **It did not need to be
bought.** The measured value is 93.3% with a Wilson lower bound of 86.2%, and the JULY arm's 8.8% has
an interval of 4.1-17.9% – so the band is excluded absolutely in one arm and bracketed in the other,
and no additional seeds change either verdict. ⭐ **The figure that WOULD have needed the bigger
corpus is a reach measured near 3-6%, and if a future wave lands the ladder in that region it must
re-run this probe at `--seeds 50` or more before quoting a number against the band.** Every share
below prints its interval so a reader can check that claim rather than take it.

⚠ **A 450-career run of the MAIN configuration was started on the working tree and was STOPPED
before it finished**, to give three concurrent agents their cores back (machine load reached 22).
Nothing on this page depends on it and no partial output was read; it is named here so that nobody
later mistakes its absence for a result.

⚠ **Nine presets, not four.** `ladder-vs-targets-2026-08.md` runs four background/coach cells; this
runs all nine of `econ-bench`'s, so §7 can say whether the pace is a wealth artefact. It is not.

### 2b. Three arms, because this file's whole subject is written at tournament finalize

`tools/pro-season-probe.ts:388-398` records the defect this instrument could most easily repeat: for
three waves that bench read the body BEFORE the reveal was finished, `retirementInjury` is opened by
`finalizeTournament` – which is reached only through `skipTournament` – and **57% of the pro era's
injury onsets were never counted at all**. A second live leak of the same class was found the day
before this page was written.

Everything §6 and §8 measure is written at exactly that moment (`world.ts:476-477`,
`bestFinishByTier` at finalize). So:

- **ARM 1 – `assertResolved` after every single week.** `stepCareerWeek` ticks, then `skipTournament`s
  (which runs `finalizeTournament`) and `closeTournament`s, so a resolved world has
  `pendingTournament === null`. Every read in the probe happens after a call to this. If a future
  `stepCareerWeek` stops closing the reveal, every career throws on its first tournament instead of
  quietly reporting milestone ages one event late.
- **ARM 2 – no tier may be PLAYED that was never ENTERED.** The play ledger (`bestFinishByTier`, written
  at finalize) is cross-checked against the entry ledger (`stepCareerWeek`'s own return, captured at
  commit). A tier appearing in one and never the other means the two sides are reading different
  worlds, and it throws.
- **ARM 3 – `--proveArm` rebuilds the round-26 defect on purpose and requires ARM 1 to fire on it.** A
  hand-rolled loop ticks and reads BEFORE `skipTournament`. It prints the stale ledger beside the live
  result and exits 1 if the guard does not trip. Run 27.08:

      the leaky read, week 3: pendingTournament=0-w3-local (finished=false, tier=local) but
        bestFinishByTier[local] = undefined – the play ledger has not been written yet.
      ARM 1 FIRED: growth-pace-probe: READ BEFORE RESOLUTION
      ARM 3 passed: the guard catches the broken read order.

  CLAUDE.md's own rule for the too-tall dialog, applied to a bench: **a test that cannot fail on the
  broken version is not this test.**

### 2c. ⚠⚠ And the instrument was caught moving its own subject – twice, before any number here was believed

Both were found by the cheapest control there is – run the same command twice and diff the output –
and both are recorded in the tool at the line that fixes them.

Both comparisons below are SINGLE-VARIABLE, same 9 seeds, same tree, one flag or one line of code
apart – which matters, because the two effects turn out to CANCEL when both are present and that is
how the second one was found.

1. **`--proveArm` sharing a process with the corpus.** The proof opens `bench-wealthy-0`, a career the
   corpus then opens again, and the engine's per-season memos are process-global. With the flag and
   without it, everything else identical: median career-best rank **#13 → #14**, mean age at first
   top-100 **19.9 → 19.5**, max **23.4 → 22.3**. `--proveArm` now runs the proof and RETURNS; the
   corpus is never run in the same process.
2. **A once-a-week `tableSize(world, 'wta')` call, added only to print a denominator.** With the call
   and without it, everything else identical: max age at first top-100 **22.7 → 22.3**, mean **19.6 →
   19.5**, mean age at her career-best rank **25.7 → 25.2**. `tableSize`'s own doc comment says it is
   a pure derivation with «ZERO draws on any stream the tick walks», and that is true – but it reaches
   `fieldProsOf`, which is MEMOISED, and a memo read at a week the engine would not have made it is
   not free. The tool now computes the same number arithmetically (`world.cohort.length + 1 +
   FIELD.size`, verified equal to the live call at 1,800) with no engine call in the loop at all.

⚠ **And the reason both had to be found rather than one:** a run carrying BOTH the extra call and the
in-process proof is byte-identical to a run carrying neither. Two perturbations that cancel look
exactly like no perturbation, which is why the diff was taken against a single-variable control each
time rather than against the first version.

⚠ **Neither is an engine defect and neither writes anything.** They are recorded because the class –
*an instrument that perturbs what it measures* – is not on CLAUDE.md's hazard list yet and cost this
page two re-runs. With both removed the probe is byte-reproducible: two clean runs at `--seeds 1`
diff to nothing but the exit-code line.

---

### 2d. ⚠ The working tree was dirty, and the control says it does not matter

Three other agents were mid-wave in this checkout while the corpus ran. `git status` showed eleven
modified engine files, and one of them is live code rather than prose: `match/point.ts` gains
`retireDurability(condition)` and `retireHazard` gains a third factor. A mid-match retirement is a
loss, so it can move ranks.

**So the main arm was re-run at committed HEAD in a detached worktree**, with the reader-presence
check CLAUDE.md asks for – `grep retireDurability src/engine/match/point.ts` returns 4 hits on the
working tree and 0 on the clean one, and `git status --porcelain -- src` is empty there. Result:

**it does not matter.** 90 careers each, same seeds, same policy:

| | CLEAN (`83b8280`) | working tree |
| --- | --- | --- |
| median age at first top-100 | **18.93** | **18.97** |
| median career-best rank | #9 | #9 |
| median age at 90% of ceiling | 16.4 | 16.4 |
| ceiling spent at 18, mean | 92.8% | 92.8% |
| top-100 reach, of horizon | 93.3% | 95.6% |
| endings | natural 80 · injury 10 | natural 83 · injury 7 |

Individual careers do move – the endings split differs, which is exactly what a live change to
`retireHazard` should do – and **no distribution this page reports moves with them**. ⭐ **The MAIN
arm quoted everywhere below is the CLEAN one**, so every headline number in this document was
measured on committed code with no other wave's work in the tree.

## 3. THE PACE – age at first top-100, against the anchor's ~22

**Median first top-100: 18.93. The anchor is ~22.0. The pace is 3.07 years early.** (n = 84 of 90 –
the six who never get there are counted in §4, not here.)

| | n | min | p25 | **med** | p75 | p90 | max | mean |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| age at first **top-100** | 84 | 16.7 | 18.3 | **18.9** | 20.4 | 22.1 | 27.0 | 19.6 |
| age at first **top-250** | 84 | 15.2 | 16.4 | **17.2** | 18.1 | 18.7 | 20.1 | 17.3 |
| age at her career-best rank | 84 | 19.2 | 23.1 | 25.7 | 27.7 | 29.6 | 31.3 | 25.6 |
| career-best rank | 84 | #1 | #5 | **#9** | #14 | #16 | #94 | #11 |

    histogram, age at first top-100  (n = 84)
      16  # 1
      17  ######## 11
      18  ####################### 32
      19  ######### 13
      20  ######### 12
      21  #### 5
      22  ##### 7          <- the anchor's own year
      23  # 1
      26  # 2

**Fifty-six of eighty-four are already there before nineteen.** The anchor's year, 22, is the
NINETIETH percentile of this distribution: p90 is 22.1. ⚠ And read the top-250 row beside it – the
anchor's «first points ~17-18» is roughly right (§6's first W15 lands at a median of 15.9 and the
first paid rank follows), so the model hits the START of its own milestone pair and misses the END.
It is not a curve that is uniformly fast; **it is a curve with no late half.**

---

## 4. THE OUTCOME – the ladder against the 26.07 targets

### 4a. The ladder, MAIN arm (90 careers, all 90 reached the horizon)

| outcome | **26.07 target** | measured, of horizon | 95% interval | n |
| --- | --- | --- | --- | --- |
| saw the pro contour (any W event) | **50-65%** | **93.3%** | 86.2-96.9% | 84/90 |
| lives from tennis (top-250) | **15-25%** | **93.3%** | 86.2-96.9% | 84/90 |
| **a real star (top-100)** | **3-6%** | **93.3%** | **86.2-96.9%** | **84/90** |
| Slam-level A – PLAYED a Slam main draw | **<1%** | **93.3%** | 86.2-96.9% | 84/90 |
| Slam-level B – played one AND reached top-50 | **<1%** | **92.2%** | 84.8-96.2% | 83/90 |
| bankrupt inside 14→18 | (60-80% solvent) | **0.0%** | – | 0/90 |

Both bases are identical here because nothing failed: **90 of 90 reached the horizon.** ⚠ The two
bases the targets page insists on only separate when careers die, and in this arm none do – which is
itself a reading of the first row.

**The top-100 row misses its band by a factor of ~19 at the midpoint, and the interval excludes it
absolutely**: the Wilson lower bound is 86.2% against a ceiling of 6%. No sample size argument
rescues this: at the target's own 4.5% midpoint, 4 of 90 careers would reach the top hundred. 84 do.

### 4b. ⚠⚠ …and the drift is fifteen days old, but the ATTRIBUTION is the bench's manager

Two controls, and they point at different things.

**Control one – the same tool at the 12.08 tree.** `tools/ladder-vs-targets.ts`, `--only 2 --seeds 4`,
run unchanged at commit `51a8360` (whose own message is «the Slam's door is #104 of 1800, and **nobody
in 160 careers reaches it**») and at today's:

| pooled, 16 careers, `player` | **12.08** (`51a8360`) | **27.08** (working tree) |
| --- | --- | --- |
| best WTA rank, median | **#174** | **#12** |
| best of the sixteen | #130 | #2 |
| reached top-100 | **0 / 16** | **16 / 16** |
| entered a Slam | 0 / 16 | 16 / 16 |
| Slam CHAMPION | 0 | **3 / 16 (18.8%)** |
| median career prize | **$456,990** | **$15,393,175** |
| bankruptcies | 4 / 16 | 0 / 16 |

⚠ **And the acceptance doors got HARDER over the same fifteen days** – w50 #550→#330, w75 #450→#300,
w100 #350→#240, wta125 #250→#210 – so the doors are not the cause. Something made her much richer and
much stronger against a table that was refusing more people.

**Control two – and it is the one that names the cause.** That comparison is CONFOUNDED, because
`econ-bench`'s `player` policy changed between those dates too: on 12.08 it was three fields
(`reserveCents: 5_000_00, restFloor: 70, coachOnEventWeeks: true`) and today it is thirteen, including
a season coach review that HIRES a better coach, entry discipline (`onlyHerTable`, `skipOutgrown`),
and the removal of the $5,000 absolute reserve that [the-wall-2026-08.md](the-wall-2026-08.md) §6a
calls a poverty trap. Comparing the two trees compares the engine AND the manager.

So `--policy july` puts the **12.08 manager on TODAY's engine** – every field added since carries the
value `econ-bench` itself documents as historical:

| 90 careers, today's engine | `grinder` | **`july` player** | `player` (today) |
| --- | --- | --- | --- |
| reached the horizon | 50.0% | 75.6% | 100% |
| bankruptcies | 45 | 22 | 0 |
| **top-100, of horizon** (target 3-6%) | **0.0%** | **8.8%** | **93.3%** |
| top-250, of horizon (target 15-25%) | 6.7% | 64.7% | 93.3% |
| Slam played, of horizon (target <1%) | 11.1% | 38.2% | 93.3% |
| career-best rank, median | #285 | #191 | #9 |
| median first top-100 | – (n=0) | 28.8 (n=6) | 18.9 (n=84) |

⭐⭐ **So the outcome distribution is the BENCH'S MANAGER far more than it is the engine.** The same
code, on the same seeds, moves from 0% to 8.8% to 93.3% on the parent's spending and entry rules
alone. **The 3-6% band is bracketed by the managers, not by the model** – and none of the three is
inside it.

⚠⚠ **This is a genuine finding and also a warning about every number on this page's §4.** «Is the
reach inside the targets?» is not a question the engine answers by itself today; it is a question
about a parent. The targets page was written before that was true and does not name a manager.

⭐ **And note what does NOT move across those three columns: the growth.** §9a.

---

## 5. The number he is looking at – her world rank at 18 and 19

**She is alive at 18 in all 90 careers.** 78 of them (86.7%) hold a paid professional rank by then;
83 (92.2%) by 19.

| | n | min | p25 | **med** | p75 | p90 | max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **world rank at exactly 18** | 78 | #15 | #144 | **#193** | #239 | #331 | #1622 |
| **world rank at exactly 19** | 83 | #4 | #33 | **#96** | #155 | #188 | #1619 |

Of the 90 alive at each age (so an unranked career counts against her, not out of the sample):

| | top-100 | top-250 | top-500 |
| --- | --- | --- | --- |
| at 18 | 13.3% | 66.7% | 81.1% |
| at 19 | **47.8%** | **88.9%** | 90.0% |

⚠ **The table she is ranked in holds 1,800 rows** (199 cohort + her + `FIELD.size` 1,600), so #193 is
the top 11% of the world and #96 is the top 5.4%. **Nearly half of all careers are inside the world's
top hundred on their nineteenth birthday** – which is the week the college fork asks its question.

**She moves ~97 places in the twelve months from 18 to 19** at the median. That single year is where
the anchor's whole 4.5-year climb is spent.

---

## 6. What she was entering – «играла уже на 500 и шлемах»

The play ledger – the week `bestFinishByTier` gained the key, i.e. the week a main draw at that rung
actually finished. Ages, MAIN arm, 90 careers:

| rung | ever played | min | p25 | **med** | p75 | p90 | max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| local | 100% | 13.6 | 13.6 | 13.6 | 13.6 | 13.6 | 13.6 |
| regional | 100% | 13.7 | 13.8 | 13.9 | 14.1 | 14.1 | 14.3 |
| national | 98.9% | 13.9 | 14.1 | 14.3 | 14.6 | 15.1 | 16.3 |
| j30 | 100% | 13.9 | 14.4 | **15.1** | 15.4 | 16.1 | 17.5 |
| j60 | 100% | 14.3 | 14.6 | 15.2 | 15.6 | 16.3 | 17.7 |
| j300 | 95.6% | 14.7 | 15.4 | 15.8 | 16.7 | 17.2 | 18.7 |
| **w15** | 93.3% | 14.7 | 15.6 | **15.9** | 16.8 | 17.9 | 19.1 |
| w35 | 93.3% | 14.9 | 15.8 | 16.2 | 17.0 | 18.2 | 19.4 |
| w50 | 93.3% | 15.2 | 16.4 | 17.1 | 17.6 | 18.6 | 19.8 |
| w75 | 93.3% | 15.2 | 16.5 | 17.3 | 18.1 | 18.7 | 20.0 |
| w100 | 93.3% | 15.4 | 17.4 | 18.1 | 18.4 | 19.1 | 34.7 |
| wta125 | 93.3% | 16.4 | 17.4 | 18.2 | 18.7 | 19.1 | 20.3 |
| wta250 | 93.3% | 16.2 | 17.4 | 18.1 | 18.6 | 19.0 | 20.2 |
| **wta500** | **93.3%** | 16.5 | 18.3 | **18.9** | 20.1 | 22.1 | 26.8 |
| wta1000 | 91.1% | 17.1 | 18.9 | 19.3 | 21.1 | 22.6 | 27.6 |
| **slam** | **93.3%** | 16.1 | 18.2 | **19.0** | 19.6 | 20.9 | 26.6 |

**Age at her first W500-or-above main draw: median 18.9** (p25 18.2, p90 20.3); **93.3% get there at
all**, and **61.9% of those are under nineteen when it happens.** First Slam main draw: **median 19.0**.

⭐ **His observation is the median career, and it is corroborated on his own save.**
[the-injury-landscape-2026-08.md](the-injury-landscape-2026-08.md), measuring Alice's half-season
before college from his w502 export on 26.08, lists her calendar for weeks 269-293 as
`wta125 · wta500 · w50 · wta250 · wta125 · wta500 · slam · w75 · slam · w75 · wta500 · w50 · w100 ·
wta500` – a WT500 quarter-final at w279 and a Slam R32 at w286, which is season 5 and age ~19.4.
**«на 500 и шлемах» is not a lucky career. It is the fiftieth percentile.**

---

## 7. The money – «имела на счету 600к+ в 18-19 лет»

Three ledgers, because «на счету» could mean any of them and they answer differently. MAIN arm,
all 90 careers alive at both ages.

**At 18**

| | min | p25 | **med** | p75 | p90 | max |
| --- | --- | --- | --- | --- | --- | --- |
| family balance | $1,395 | $8,101 | **$20,058** | $42,393 | $130,296 | $2,923,538 |
| her own account | $0 | $0 | $0 | $0 | $0 | $0 |
| **career prize money** | $0 | $36,868 | **$73,040** | $109,035 | $220,533 | $3,221,800 |

at or over $600,000: family **1.1%** · hers **0.0%** · prize **1.1%**

**At 19**

| | min | p25 | **med** | p75 | p90 | max |
| --- | --- | --- | --- | --- | --- | --- |
| family balance | $1,534 | $27,575 | **$145,206** | **$680,899** | $1,450,049 | $4,669,801 |
| her own account | $0 | $6,411 | $20,341 | $69,378 | $184,501 | $538,040 |
| **career prize money** | $0 | $115,584 | **$269,648** | **$799,518** | $1,786,351 | $5,064,720 |

at or over $600,000: family **26.7%** · hers 0.0% · **prize 30.0%**

⭐ **«600к+ в 18-19» is the third quartile, not a tail.** Nothing is at $600,000 at eighteen (1.1%);
one career in four crosses it during the following twelve months. ⚠ **And the year 18→19 is where
the money is made** – the median family balance goes $20,058 → $145,206 (×7.2) and the median career
prize $73,040 → $269,648 (×3.7) in one season. That is the same twelve months §5's rank moves 97
places in, and it is the season the college fork interrupts.

---

## 8. «всего 1 или 2 сезона» – how many junior seasons a career actually gets

His words: «все наши юношеские были где-то сильно раньше и всего 1 или 2 сезона». Measured as
**seasons whose played matches were majority junior-track** (`itf` = j30/j60/j300, the only rungs the
game closes at eighteen), banked off `seasonHistory.byTrack` at each wrap-up:

| | n | min | p25 | **med** | p75 | p90 | max | mean |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| junior-majority seasons (by **matches**) | 90 | 0 | 1 | **1** | 2 | 3 | 5 | 1.3 |
| junior-majority seasons (by **events**) | 90 | 0 | 1 | **1** | 2 | 3 | 5 | 1.5 |
| non-pro-majority seasons (domestic + junior) | 90 | 1 | 2 | 3 | 4 | 5 | 28 | 4.5 |

    junior-majority seasons, by matches – the whole distribution
      0 season(s)  ############## 21  (23.3%)
      1 season(s)  ######################### 37  (41.1%)
      2 season(s)  ############## 21  (23.3%)
      3 season(s)  ####### 10  (11.1%)
      5 season(s)  # 1  (1.1%)

**Sixty-four percent of careers get one junior season or none.** Two instruments agree (matches and
events), and the second instrument is the one that would have caught a resolution-order defect.

**And «сильно раньше» is right too:**

| | n | min | p25 | **med** | p75 | max |
| --- | --- | --- | --- | --- | --- | --- |
| age at first J-tour entry | 90 | 13.9 | 14.3 | **15.0** | 15.3 | 17.4 |
| age at first W-tour entry | 84 | 14.7 | 15.5 | **15.9** | 16.7 | 19.0 |
| **age when the pro rungs take the majority** | 84 | 14.6 | 15.6 | **15.6** | 16.5 | 18.6 |

**She joins the junior tour at 15.0 and the professional rungs take over the majority of her matches
at 15.6.** The junior tour is nominally open to her until eighteen (`maxAgeYears: 18` on all three J
rungs); she has left it, in practice, at fifteen and a half. Over a whole career she plays a median
of **46.5** junior events against **612.5** professional ones.

⚠ **The junior era is not short because the J rungs close early. It is short because the professional
on-ramp opens while she is still fourteen** (`w15.minAgeYears: 14`) **and she is strong enough to walk
through it at fifteen.** That is a pace finding wearing a calendar's clothes.

---

## 9. ⚠⚠ THE PACE, OR THE COLLEGE FIELD?

[college-the-last-mile-2026-08.md](college-the-last-mile-2026-08.md) §3 answers the owner's «сотая
ракетка мира приезжает в колледж и проигрывает там» by comparing `COLLEGE_LEAGUE.field` against the
professional pyramid and concluding **«the field is too strong»**. The college wave is waiting on that
number. This section is the third term that comparison never had: **how strong our nineteen-year-old
actually is.**

### 9a. The mechanism – her headroom is gone before the anchor's window even opens

**`world.potential` is rolled once per career and never moves**, so `power() / potentialMean` is the
age curve's own progress bar – it says nothing about the ladder, the field, the money or the parent.
MAIN arm, all 90 careers:

| | n | min | p25 | **med** | p75 | p90 | max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **age at 90% of her own ceiling** | 90 | 14.2 | 15.9 | **16.4** | 16.9 | 17.3 | 18.6 |
| age at 95% of her own ceiling | 90 | 16.6 | 19.6 | **20.4** | 21.3 | 23.0 | 28.1 |

**100% of careers reach 90% of their ceiling, and 100% reach 95%.** At the two ages he named:

| | power() mean | share of her ceiling spent | her rolled ceiling |
| --- | --- | --- | --- |
| **at 18** | med **58.4** (p25 56.3, p75 61.1) | med **92.8%**, mean 92.8% | med 63.0 |
| **at 19** | med **59.2** (p25 56.8, p75 61.9) | med **93.9%**, mean 93.9% | med 63.1 |

⭐⭐ **AND THIS IS THE ONE THING THAT DOES NOT MOVE.** Across four arms whose ladder outcomes span 0%
to 95.6% top-100 reach:

| arm | age at 90% of ceiling (med) | ceiling spent at 18 (mean) | power at 19 (med) | top-100, of horizon |
| --- | --- | --- | --- | --- |
| MAIN (`player`, clean HEAD) | **16.4** | **92.8%** | **59.2** | 93.3% |
| WORKING (`player`) | **16.4** | **92.8%** | **59.2** | 95.6% |
| JULY (`july` player) | **16.2** | **93.2%** | **59.8** | 8.8% |
| GRINDER (`grinder`) | **16.1** | **92.9%** | **59.5** | 0.0% |

⚠ **One honest asymmetry in that table.** The MAIN and WORKING rows are all 90 careers; the JULY and
GRINDER rows are conditioned on being ALIVE at nineteen (72 and 45 careers – the rest went bankrupt),
which biases those two columns UPWARD by whatever survivorship is worth. They read 0.3-0.6 power
points HIGHER than MAIN, which is the direction that bias predicts, and it does not change the
reading: **the gap between a manager who bankrupts half his careers and one who never loses one is
smaller than the bias in favour of the survivors.**

**The parent buys rank and money. The parent does not buy skill.** A manager who bankrupts half his
careers and one who never loses a single one produce a nineteen-year-old within 0.6 power points of
each other. Whatever the pace defect is, it is not a consequence of how the career is run.

**So the anchor cannot be met by any amount of managing.** «Points ~17-18, top-100 ~4.5 years later»
requires the years 18→22 to carry development. Measured, she gains **0.8 power points** between 18 and
19 and is at 95% of her ceiling by **20.4**. There is no fuel in the anchor's second half.

### 9b. ⚠ And §3's pyramid table quotes a pyramid that was REJECTED

`college-the-last-mile-2026-08.md:179-181` reads:

| population | attribute band |
| --- | --- |
| professionals, elite (~top 30) | 60 – 70 |
| professionals, **middle (~120)** | **52 – 62** |
| professionals, tail (~150) | 45 – 55 |

**Those are not the shipped numbers.** `src/engine/season/fieldPros.ts:129` names them exactly – «with
the **draft** pyramid (elite 60-70 / middle 52-62 / tail 45-55) that meant mean core 56.8» – inside a
block headed «⚠ THE BANDS WERE TUNED **DOWN** FROM THE FIRST DRAFT, WITH THE BENCH IN HAND (01.08)».
§3 quoted the version that was measured and rejected. What ships (`fieldPros.ts:395-412`):

| storey | rows | world | core |
| --- | --- | --- | --- |
| `tourElite` | 64 | #1 – #64 | **67 – 77** |
| `elite` | 30 | #65 – #94 | **56 – 66** |
| `contender` | 120 | #95 – #214 | **43 – 53** |
| `journeyman` | 150 | #215 – #364 | 38 – 48 |
| `circuit` | 156 | #365 – #520 | 33 – 43 |
| `qualifier` / `satellite` / `newcomer` | 360 each | #521 – #1600 | 28-38 / 23-33 / 18-28 |

Two corrections follow, and they point in **opposite** directions:

- ⚠ **§3's conclusion is UNDERSTATED.** It says «the top of a college draw (68) reaches the top of the
  professional ELITE band». Shipped, the elite band tops out at **66**, and 68 is inside `tourElite` –
  **the world's top sixty-four**. And §3's reality check is right: the best NCAA player is roughly WTA
  300-600, which in this pyramid is `circuit` (33-43). The college field is centred where the world's
  **#94** sits.
- ⭐ **And §3's own premise – that our player is a professional MIDDLE and therefore the field's
  equal – is not what shipped either.** Her `power()` is a median of **58.4 at eighteen** and **59.2
  at nineteen**, both inside the `elite` storey's band (56-66), the rows this pyramid places at world
  #65-#94. Her RANK over the same two birthdays is **#193** and **#96**, which the same pyramid places
  in `contender` (43-53). ⚠ The merged professional table interleaves ~200 live players among the
  1,600 field rows, so a merged rank maps onto a storey only approximately – but the direction is not
  in doubt: **she out-skills her own ranking by roughly nine or ten points at both ages.** She does
  not walk into the College League as the professional middle wearing a top-100 label. By SKILL she is
  the professional ELITE, and it is her ranking that is behind.

### 9c. ⚠ And the «spread of freshman strengths» §3 designs for

§3's ⚙ ruling accepts the field as calibrated «against a two-year span of development», with the
argument that «a spread of freshman strengths against a fixed field is what real student tennis looks
like – some arrive able to win it, some do not – and it means the fixture stops having one correct
answer». Its ⭐ note adds that «an eighteen-year-old freshman is a year less developed than a
nineteen-and-a-half-year-old one», so moving §1's entry age «closes part of the gap for free».

**Measured, that year is worth almost nothing.**

**The spread of freshman STRENGTH is real** – power at 19 runs p25 56.8 / med 59.2 / p75 61.9, min
53.6, max 65.2, against a college opponent whose own `power()` is the mean of five integer draws on
44-68, i.e. **≈ N(56, 3.2)**. An interquartile range of 5.1 against a field sd of 3.2 is a genuine
spread, and §3's «some arrive able to win it, some do not» is achievable. **That half of §3 stands.**

**What does not stand is the year of age.** Her median power goes **58.4 at 18 → 59.2 at 19: +0.8
points**, because 92.8% of her headroom is already spent at the first of those birthdays. Against a
field sd of 3.2 **one year of freshman age is a quarter of a standard deviation**, and the full
18→20 band §1a proposes is worth about **1.6 points, or half an sd**. Moving the entry age does not
«close part of the gap for free»; measured, it closes about a sixth of one field-sd per year and
nothing else. ⚠ **§1a's fix is still right for its own reason** – a freshman cohort with no variance
at all is the defect it names – **but it must not be credited with any of §3's work.**

⭐ And one number that decides the direction rather than the size: **83.3% of nineteen-year-olds are
above the college field's CENTRE, and 0.0% are above its TOP.** The fixture is not unwinnable and it
is not a formality – it is a coin-weighted-in-her-favour, for a girl who is by then a world top-100.

### 9d. The answer, in one sentence a person can act on

> **Hold §3: the college field's number is a DIFFERENCE against the freshman it faces, and that
> freshman is three years over-developed – 90% of her ceiling spent at 16.4 and world-top-94 skill at
> 19, against an anchor that puts her first top-100 at ~22 – so decide the growth curve first, or the
> field gets tuned twice.**

The longer form, because the ordering is the actionable part:

- **§3's DIRECTION is right and its number is understated** (§9b). The college field belongs below the
  professional tail on realism grounds alone, and that argument does not depend on anything this page
  measured.
- **§3's number cannot be CHOSEN yet.** A fixture's difficulty is the difference between two
  populations, and one of them is currently three years wrong. Set the field against today's
  nineteen-year-old and it will be wrong again the day the curve moves; set it against the anchor's
  nineteen-year-old and the fixture is unwinnable until the curve moves.
- **The owner's «сотая ракетка мира приезжает в колледж и проигрывает» has TWO cures and they are not
  interchangeable.** Lowering the field makes her win; fixing the pace means she is not the world
  #100 at nineteen in the first place. Only the second one also fixes §4's ladder, §6's rungs and
  §7's money, because those have the same cause.
- ⚠ **And it is not "the field is fine".** Both constants are mis-set. The claim is only that they
  must be set **in this order**, because one of them is measured against the other.

---

## 10. Candidates, and what each would cost – named, NOT proposed

⚠ **Nothing here is a recommendation to turn a knob.** `ageCurve`'s constants are calibrated and
CLAUDE.md invariant 4 owns every one of them: «Tuning is measured, not guessed. Balance changes ship
with a bench run and a spec in `docs/specs/` recording predicted vs measured.» What follows is the
list of things that COULD move the measured numbers, what each would break, and the order they should
be considered in.

| # | candidate | what it is | what it costs |
| --- | --- | --- | --- |
| 1 | **explain the drift first** | §4a: the same tool, same policy, same seeds reports a different world at 12.08 and today | nothing – it is a `git bisect` over one 80-second command. **Everything below is tuning against a table that moved for reasons nobody has written down.** |
| 2 | `ageCurve.peakRate` / `growthEase` | the steep window's rate – §9a's actual subject | the widest blast radius in the game: it is the ONE thing that moves her and NOTHING else (`growWeek` has a single engine caller, `world/phaseGrowth.ts:76`; the cohort ages on the conveyor and the field is derived from `FIELD.tiers`), so every acceptance cut, every sponsor window, every ending rate and every econ horizon is downstream. ⭐ Two mercies: it draws off `seed:growth:<week>`, a sub-stream, so the frozen MAIN capture cannot see it; and `skills` are PERSISTED, so no save migrates and no live career is retroactively nerfed – only future growth slows. |
| 3 | `ageCurve.plateauStart` (23) | where the steep years hand over | on its own it moves almost nothing – §9a shows the headroom is already gone before the plateau begins, so raising it hands her more of a share that no longer exists. Cheap and probably inert; worth measuring precisely because it looks like the obvious knob and is not. |
| 4 | `development.potentialBand` `[4, 26]` | the ceiling, per attribute, on top of where she starts | ⚠ **wrong direction for §9c.** Five independent draws averaged into one `power()` is a central-limit machine: the per-attribute band is 22 wide and the resulting career-to-career spread of MEAN headroom is a few points. Narrowing the band narrows the spread further; widening it is what §9c argues for, and that is a different task with `potential-band-2026-08.md` as its owner. |
| 5 | `fieldPros.FIELD.tiers` cores | raise the world instead of slowing her | field pros are never persisted and are re-derived on every read, so this lands on EXISTING saves immediately – which is either the point or the hazard. Every acceptance cut and entrant band was tuned against this table (`world-strength-audit-2026-08.md`, `the-acceptance-tail-2026-08.md`, `ladder-floor-2026-08.md`). |
| 6 | the doors – `wta500.acceptsRank` 120, `wta1000` 65, `slam` 112 | delay «500 и шлемы» without touching development | cheap, and **weak**: §6 measures her clearing #120 at a median age that is already past her development, so a tighter door buys months. It also has history – the doors were tightened between 12.08 and today (w50 #550→#330, w100 #350→#240) and the reach went UP anyway. |
| 7 | `COLLEGE_LEAGUE.field` `{56, 12}` | the college wave's own knob (`college-the-last-mile-2026-08.md` §3) | §9 argues this is second in line, not first, and §9b/§9c say the number it is currently being chosen against is stale and the spread it is being designed for does not exist. |

**The order this page recommends, and it is an order of INVESTIGATION, not of edits:**

1. **Bisect the 12.08 → 27.08 reach drift** (candidate 1). One command per commit, 80 seconds each.
2. **Then price candidate 2 on a sweep**, not a guess – `tools/growth-age-sweep.ts` already exists for
   exactly this and this page's probe gives it a target to hit.
3. **Then, and only then, §3's college field**, chosen against the freshman that curve produces.
4. Candidates 3, 4 and 6 are worth measuring but should not be the first thing turned.

---

## 11. What this page did NOT do

- **It changed nothing.** No engine constant moved, no fix is proposed for `ageCurve`, and CLAUDE.md
  invariant 4 owns every number named in §10.
- **It did not measure "she quit of her own accord" (5-10%).** The fork is answered `continue` and
  every retirement offer refused, so the player's own exit choices are held out of the tennis filter –
  the same choice `ladder-vs-targets-2026-08.md` §2b made, and for the same reason.
- **It signed no offers.** `stepCareerWeek` enters tournaments and nothing else: no kit deal, no
  academy place, no sponsorship. Every figure here is a FLOOR for a played career, not a portrait of
  one – which makes the reach numbers in §4 worse, not better.
- **It did not re-measure the College League's watchable-match count.**
  `college-the-last-mile-2026-08.md` §3 requires that to move in the same pass as the field number.
  This page decides WHICH knob is the defect; it does not turn one.
