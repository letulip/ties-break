---
type: spec
status: draft
area: engine/development
canonical: false
last-reviewed: 2026-08-11
---

# The potential band – how much is there to play for, and what would moving it cost

**Status: MEASUREMENT. Nothing shipped.** No constant moved, no test bound moved, no engine
behaviour moved. What this branch adds is `tools/potential-band-sweep.ts` and this page. Every arm
patches `ECONOMY.development.potentialBand` in place and restores it in a `finally`, and the tool
fails loudly on exit if the band is not back where it started.

The owner, 11.08: **«по полосе неси числа пожалуйста»** – numbers before a decision.

**Measured on `wave/flags-grant` head `3e3ba4e`.** The growth model itself (`engine/development.ts`,
`ECONOMY.development`, `startingSkills`) is byte-identical between that head and `main` `a33fb8f`, so
the pure-arithmetic sections (§2, §4, §5) reproduce to the digit on either – verified, not assumed.
The sections that drive the real engine (§1, §3, §6a) were re-run on this head after an earlier pass
on `main`, because `wave/flags-grant` moves `world.ts`, the calendar and the injury model, and a
career number measured against a different tick is not the same number.

Reproduce (the tool's own section numbers, which are one behind this page's):

```bash
npx vite-node tools/potential-band-sweep.ts -- --only 0,1,3      # this page's §1, §2, §5 – ~2 min
npx vite-node tools/potential-band-sweep.ts -- --only 5          # this page's §6a – ~12 min
npx vite-node tools/potential-band-sweep.ts -- --only 2 --seeds 12   # this page's §3 – ~50 min
npx vite-node tools/potential-band-sweep.ts -- --only 4 --save <a .tsave>   # §4, local only
```

---

## 0. The one-page answer

| question | answer |
| --- | --- |
| Does the FIELD use the same band? | **No.** The kid's band is hers alone. Verified by construction three ways (§1). |
| So how big is the blast radius? | **Small at runtime, real on paper.** No rival and no professional changes. One DESIGN-TIME derivation in `season/fieldPros.ts` is argued FROM this band and would have to be re-argued (§5). |
| What is actually wrong at the bottom? | **Dead wings, not low totals.** 63.4% of careers have at least one skill that can gain under 8 points in a lifetime; 21.2% have one under 5 (§2). |
| Does raising the CEILING fix that? | **No.** `[4, 40]` still leaves 44.9% of careers with a wing under 8, and it moved the owner's own dead serve from 4.1 to **4.2** (§2, §4). |
| Does raising the FLOOR fix it? | **Yes, completely.** `[10, 26]` puts every wing at 10+ by construction (§2), and it is the only variant where all 12 bench careers in both cells earn a professional cheque (§3). |
| What would it cost? | **Nothing on paper and no re-pinning.** `fieldPros`'s storey midpoint lands at 77.4 against the shipped 77, and both pinned guard windows stay green (§5, §6). |
| Recommendation | **Raise the floor, leave the top alone: `[10, 26]`.** Reason in §7. Do NOT ship `[4, 40]` – it fails the guard AND does not fix the complaint. |

---

## 1. ⚠ THE FIELD DOES NOT SHARE THE BAND – established first, because it prices everything else

There are three populations in the game and they have three different ceiling models. Only one of
them reads `ECONOMY.development.potentialBand`.

| population | ceiling model | reads `ECONOMY.development.potentialBand`? |
| --- | --- | --- |
| **the kid** | `rollPotential()`: `start + U(4, 26)` per attribute, once at birth, never moved | **YES – the only reader in `src/`** |
| **the junior cohort** (199 rivals) | `makeJunior()`: `start + U(1, 22)` per attribute, times a hidden `growth` multiplier 0.5–1.5, on `COHORT.ageCurve` | NO – its own `COHORT.potentialBand`, `src/engine/season/cohort.ts` |
| **the professionals** (1,600 chairs) | `fieldProsFor()`: `growth: 1`, `potential = where she stands`. Inert. Her strength is a percentile draw from `FIELD.tiers[].core` and her arc is a POINTS arc, not a skill arc | NO |

The two bands were never one number wearing two hats: the cohort's has been `[1, 22]` since v20 and
`season/cohort.ts`'s own header says why ("most juniors never become anything"). **That is a comment,
so the tool verifies it by construction rather than believing it.** Same seed, band `[4, 26]` against
`[10, 40]`, FNV hashes over every number in each population:

| what | `[4, 26]` | `[10, 40]` | verdict |
| --- | --- | --- | --- |
| cohort hash at birth (199 juniors: skills, ceilings, growth, age) | `7b0ae192` | `7b0ae192` | **IDENTICAL** |
| field-pro hash at birth (1,600 pros: five skills, W points, age) | `639a3923` | `639a3923` | **IDENTICAL** |
| cohort hash after **208 no-action weeks** (the world's own clock) | `f8415bb2` | `f8415bb2` | **IDENTICAL** |
| cohort hash after **208 PLAYED weeks** (she enters, wins, moves the standings) | `705ba202` | `705ba202` | **IDENTICAL** |
| her START build | `8a5c96aa` | `8a5c96aa` | IDENTICAL |
| **her CEILING** | `834b0140` | `724a0d0b` | **MOVED** (+9.67 mean-of-five) |
| her ITF rank / career prize on that seed at week 208 | #42 / **$0** | #8 / **$29,960** | she moves |

The third and fourth rows are the load-bearing ones. `driftCohort` is a pure function of the MAIN
weekly stream and the cohort's own state, and the MAIN stream is input-independent by law – so a
career that wins far more money does not make a single rival better at tennis.

**Therefore: the band is a DIFFICULTY KNOB AGAINST A FIXED FIELD, not a world parameter.**

### 1a. The two couplings that do exist, so the hashes are not over-read

1. **The standings move, because she does.** Nobody gets better, but a better career takes places off
   people, and every rung's `entrantPctBand` is a percentile of a table she is in.
2. **⚠ The professional table's top storey is DERIVED from this band, on paper.**
   `season/fieldPros.ts` sets `tourElite.core = [67, 77]` and argues it in as many words:

   > 20,000 rolls … p50 63.2 · p90 68.8 · p99 73.2 · max 80.8. A world #1 above the MAX is a backdrop
   > nobody can ever climb; a world #1 at the p99 is one every good career equals. So the storey's top
   > sits at the midpoint of those two, core 77.

   That is a design-time read of `rollPotential`, not a runtime one. Widening the band moves no pro –
   but it makes that sentence false. §5 is the price list.

---

## 2. The distribution of headroom – deciles, because the complaint is about the bottom

20,000 rolls per variant, **identical seeds across arms**. `rollPotential` is
`start[k] + lo + u_k(hi - lo)` where `u_k` is the k-th draw off `seed:potential`, so a seed's five
`u`s are fixed and every variant is *the same girl's luck priced on a different scale*. No variance is
spent on re-rolling the population between arms.

**TOTAL HEADROOM** = the sum over her five skills of `ceiling - start`: every point she can ever add.

| variant | min | p10 | p20 | p30 | p40 | **p50** | p60 | p70 | p80 | p90 | max | mean |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **baseline `[4, 26]`** | 26.7 | 56.6 | 62.9 | 67.6 | 71.5 | **75.2** | 78.8 | 82.7 | 87.2 | 93.3 | 121.5 | 75.1 |
| floor+3 `[7, 26]` | 40.8 | 66.6 | 72.1 | 76.1 | 79.4 | **82.6** | 85.8 | 89.1 | 93.1 | 98.3 | 122.7 | 82.6 |
| floor+6 `[10, 26]` | 54.9 | 76.6 | 81.2 | 84.6 | 87.4 | **90.1** | 92.8 | 95.6 | 98.9 | 103.3 | 123.8 | 90.0 |
| spread `[10, 20]` | 53.0 | 66.6 | 69.5 | 71.6 | 73.4 | **75.1** | 76.7 | 78.5 | 80.6 | 83.3 | 96.1 | 75.0 |
| top+14 `[4, 40]` | 31.0 | 79.8 | 90.2 | 97.8 | 104.2 | **110.3** | 116.2 | 122.5 | 130.0 | 139.9 | 186.1 | 110.1 |
| both `[10, 40]` | 59.1 | 99.9 | 108.5 | 114.9 | 120.2 | **125.2** | 130.2 | 135.4 | 141.7 | 150.0 | 188.4 | 125.1 |

### 2a. ⚠ THE WORST WING is the unit of the complaint, not the total

A career with 45 points of headroom split 5/5/5/25/5 is not the same career as one split 9/9/9/9/9,
and only the second one has five things to train. **min over the five skills** – this is the "her
serve can gain 1.3 more points in her entire remaining career" number:

| variant | min | p10 | p20 | p30 | p40 | **p50** | p60 | p70 | p80 | p90 | max | mean |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **baseline `[4, 26]`** | 4.0 | 4.5 | 4.9 | 5.5 | 6.1 | **6.8** | 7.7 | 8.7 | 10.0 | 12.1 | 23.3 | 7.7 |
| floor+3 `[7, 26]` | 7.0 | 7.4 | 7.8 | 8.3 | 8.8 | **9.4** | 10.2 | 11.1 | 12.2 | 14.0 | 23.6 | 10.2 |
| floor+6 `[10, 26]` | 10.0 | 10.3 | 10.7 | 11.1 | 11.5 | **12.1** | 12.7 | 13.4 | 14.4 | 15.9 | 24.0 | 12.7 |
| spread `[10, 20]` | 10.0 | 10.2 | 10.4 | 10.7 | 11.0 | **11.3** | 11.7 | 12.1 | 12.7 | 13.7 | 18.8 | 11.7 |
| top+14 `[4, 40]` | 4.0 | 4.8 | 5.5 | 6.4 | 7.5 | **8.6** | 10.0 | 11.7 | 13.8 | 17.2 | 35.5 | 10.0 |
| both `[10, 40]` | 10.0 | 10.6 | 11.3 | 12.0 | 12.9 | **13.8** | 15.0 | 16.4 | 18.2 | 21.0 | 36.3 | 15.0 |

**Read the `[4, 40]` row against the `[10, 26]` row.** `[4, 40]` adds 35 points of expected total
headroom and moves the MEDIAN worst wing from 6.8 to 8.6. `[10, 26]` adds 15 and moves it to 12.1.
The top of the band cannot reach the bottom of the distribution, because a wing that drew `u ≈ 0`
gets `lo` whatever `hi` is.

### 2b. The shares – the shape of the bottom, said as a probability

| variant | total < 30 | total < 40 | total < 50 | **≥1 dead wing** (a skill under 5) | ≥2 dead | ≥3 dead | **worst wing < 8** | ceiling core > 73 | ceiling core > 77 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **baseline `[4, 26]`** | 0.0% | 0.5% | 4.2% | **21.2%** | 1.9% | 0.1% | **63.4%** | 1.0% | 0.1% |
| floor+3 `[7, 26]` | 0.0% | 0.0% | 0.3% | 0.0% | 0.0% | 0.0% | 24.1% | 1.8% | 0.1% |
| floor+6 `[10, 26]` | 0.0% | 0.0% | 0.0% | **0.0%** | 0.0% | 0.0% | **0.0%** | 3.2% | 0.2% |
| spread `[10, 20]` | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.1% | 0.0% |
| top+14 `[4, 40]` | 0.0% | 0.0% | 0.3% | **13.4%** | 0.8% | 0.0% | **44.9%** | 32.6% | 13.0% |
| both `[10, 40]` | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 52.1% | 23.9% |

**`63.4%` is the number the owner is describing.** Nearly two thirds of all careers already ship with
a wing that will gain under eight points in twenty-four years – and since `growWeek` takes a share of
the REMAINING distance, most of those eight arrive before she is eighteen. It is not a tail; it is the
common case.

### 2c. Why `[10, 20]` is on this page although nobody asked for it

Its mean is **15 – exactly the shipped band's** – so it changes the SPREAD and nothing else. Every
other variant confounds "raise the floor" with "raise everyone"; this one separates them. Its median
total headroom is 75.1 against the baseline's 75.2 and its median ceiling core is 63.3 against 63.3.
It kills every dead wing while making the average career *no better at all*.

Its cost is at the other end, and §5 prices it.

---

## 3. What it does to her career

Full careers 14 → 38 (1,300 weeks), 12 seeds per cell per variant, identical seeds across arms,
`player` policy (someone actually managing it), bankruptcy defused every week and every retirement
offer refused until the game stops asking – the same arm shape `tools/skill-ceiling.ts` §4 uses.

**8k · working · self-coached** – the cell the owner's own olivia career is shaped like.

| variant | peak skill | Δ skill | realised | win rate | best W rank | median W rank | ever paid | titles | prize (median) | best rung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **baseline `[4, 26]`** | 61.30 | +0.00 | 86.1% | 65.0% | #131 | #176 | 10/12 | 81.6 | $652,170 | wta250 |
| floor+3 `[7, 26]` | 62.30 | +0.99 | 84.7% | 67.4% | #124 | #167 | 12/12 | 75.3 | $684,160 | wta250 |
| **floor+6 `[10, 26]`** | 63.47 | **+2.17** | 85.6% | 68.8% | #107 | #172 | 12/12 | 90.1 | $726,530 | wta500 |
| spread `[10, 20]` | 60.65 | **−0.65** | 85.6% | 64.2% | #140 | #169 | 9/12 | 72.8 | $559,590 | wta250 |
| top+14 `[4, 40]` | 67.93 | +6.63 | 85.5% | 72.6% | **#43** | #142 | 12/12 | 109.4 | $882,690 | **slam** |
| both `[10, 40]` | 69.99 | +8.69 | 84.8% | 74.3% | #102 | #142 | 12/12 | 115.2 | $995,120 | wta500 |

**25k · middle · middle coach**

| variant | peak skill | Δ skill | realised | win rate | best W rank | median W rank | ever paid | titles | prize (median) | best rung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **baseline `[4, 26]`** | 60.96 | +0.00 | 92.7% | 68.1% | #123 | #155 | 8/12 | 109.8 | $711,330 | wta250 |
| floor+3 `[7, 26]` | 62.46 | +1.50 | 92.6% | 69.3% | #99 | #152 | 9/12 | 117.5 | $709,630 | wta500 |
| **floor+6 `[10, 26]`** | 63.91 | **+2.96** | 91.9% | 72.9% | #87 | #154 | **12/12** | 113.2 | $778,720 | slam |
| spread `[10, 20]` | 61.59 | **+0.63** | 93.0% | 68.2% | #140 | #147 | 9/12 | 116.0 | $730,400 | wta250 |
| top+14 `[4, 40]` | 66.53 | +5.57 | 91.9% | 74.1% | **#41** | #131 | 10/12 | 128.9 | $874,560 | **slam** |
| both `[10, 40]` | 69.44 | +8.48 | 91.3% | 76.8% | **#25** | #136 | 12/12 | 140.1 | $1,052,650 | **slam** |

Five things to read off these, and one warning:

1. **The floor lift is a difficulty change of about +2.2 to +3.0 peak skill and +4 to +5 points of
   win rate.** Real but modest – roughly a year of development, not a different player.
2. **`[10, 20]` is almost invisible in career terms** (−0.65 / +0.63 skill, win rate within a point of
   baseline) while §2 shows it removing every dead wing. That is exactly what a mean-preserving change
   should look like, and it is the strongest single piece of evidence that dead wings are a SPREAD
   problem rather than a level problem.
3. **Only the ceiling variants change what the TOP of a career is.** `[4, 40]` takes the best rank to
   #43/#41 and `[10, 40]` to #25, and both put a slam on the board. That is a different game, not a
   repaired one.
4. **`[10, 26]` is the only variant that gets every career PAID** (12/12 in both cells, against the
   baseline's 10/12 and 8/12). That is the closest thing here to a direct answer to "is there enough
   to play for": under the shipped band a fifth of careers in the middle-class cell never earn a
   professional cheque at all.
5. **`realised` barely moves** (86.1% → 85.6%, 92.7% → 91.9%). The asymptote does not get worse when
   there is more to climb – she simply climbs more. The growth machinery is not the bottleneck.
6. ⚠ **12 seeds is enough for the mean columns and NOT for `best W rank`.** `best W` is a minimum over
   12 careers, so `[10, 26]`'s #107 against `[7, 26]`'s #124 in the first cell is sampling noise. Read
   the MEDIAN column for rank; there the direction is monotone in every arm of both cells.

---

## 4. Four real careers, placed in the distribution

Read locally through the engine's own import door (`decodeExportFile`), exactly as
`tools/round15-read.ts` does. **Nothing is committed from a save** – no fixture, no path, no career;
only the aggregate placement below.

> **⚠ The one arithmetic trap.** Her ceiling is rolled off her BIRTH build, never the head-started
> one (`development.ts`: "Being born in January must not make her able to get BETTER, only to be
> further along right now"). So `potential[k] - startingSkills(...)` is the TRUE roll, and
> `potential[k] - withHeadStart(...)` – the number a screen shows – **understates it by exactly
> `relativeAgeHeadStart(birthMonth)` on every skill.** The measurement that opened this question
> reported the owner's serve at 3.4 points of headroom; the true roll is 4.1.

| career | total headroom | percentile | **worst wing** | worst wing under `[4, 40]` | worst wing under `[10, 26]` |
| --- | --- | --- | --- | --- | --- |
| olivia, w195 | **41.0** | **p0.7** | **4.1** (serve) | **4.2** | 10.1 |
| ines, w208 | 59.2 | p13 | 6.4 (serve) | 7.9 | 11.7 |
| zoe, w255 | 59.7 | p14 | 5.8 (return) | 7.0 | 11.3 |
| naomi, w412 | 75.6 | **p50** | 8.1 (composure) | 10.7 | 13.0 |

Four things this table says and prose cannot:

1. **The career that started the question is a 1-in-150 roll.** Her total headroom is 41.0 against a
   median of 75.2. The percentile is exact rather than sampled: total headroom is `5·lo + (hi-lo)·Σu`,
   so the percentile is the Irwin–Hall CDF of `Σu = 0.956`, i.e. `0.956⁵/120 = 0.67%`. Three of her
   five wings drew `u < 0.03`.
2. **The percentile is band-invariant.** It is identical in every column of the tool's output, because
   every variant is a monotone transform of the same `u`. **No band change makes anyone luckier.** What
   it changes is what a given piece of luck is WORTH.
3. **Even the p50 career has a dead wing.** naomi is the median roll and her composure gains 8.1 points
   in a lifetime. This is §2b's 63.4% seen from the inside.
4. **⚠ `[4, 40]` does nothing for any of them.** olivia 4.1 → 4.2. zoe 5.8 → 7.0. ines 6.4 → 7.9. The
   ceiling lift lands almost entirely on the wing each of them already had (olivia's return goes
   20.1 → 30.3), which is the opposite of the complaint.

---

## 5. The blast radius, priced – the ceiling in the field table's own currency

`season/fieldPros.ts` puts the world #1 at core 77 and derives it from the midpoint of
`rollPotential`'s p99 and its max (§1a). Nothing here moves a professional; what moves is whether that
derivation still holds. **The last column is the price of the variant.**

| variant | p50 | p90 | p99 | max | midpoint(p99, max) | vs the shipped 77 |
| --- | --- | --- | --- | --- | --- | --- |
| **baseline `[4, 26]`** | 63.3 | 68.8 | 73.0 | 79.2 | 76.1 | −0.9 |
| floor+3 `[7, 26]` | 64.8 | 69.9 | 73.8 | 79.6 | 76.7 | −0.3 |
| **floor+6 `[10, 26]`** | 66.3 | 71.0 | 74.7 | 80.0 | **77.4** | **+0.4** |
| spread `[10, 20]` | 63.3 | 67.4 | 70.6 | **74.9** | 72.8 | **−4.2** |
| top+14 `[4, 40]` | 70.3 | 77.9 | 83.6 | 91.6 | 87.6 | **+10.6** |
| both `[10, 40]` | 73.3 | 79.9 | 84.9 | 92.2 | 88.6 | **+11.6** |

- **`[10, 26]` is free.** +0.4 core on a quantity estimated from 20,000 samples is inside the noise of
  the estimate itself. The shipped 77 stays the right number and no pro is re-derived.
- **`[10, 20]` costs at the TOP, and it is a real cost.** Its MAX talent is 74.9 – **below** the world
  #1's core of 77. The other half of `fieldPros`'s argument ("a world #1 above the MAX is a backdrop
  nobody can ever climb") stops holding: under this variant nobody can ever be world #1, so the top
  storey would have to come down with it.
- **`[4, 40]` and `[10, 40]` re-open the whole pro table.** 32.6% / 52.1% of careers would ceiling above
  today's p99, and 13.0% / 23.9% above the world #1 herself. The top storey, the `entrantPctBand`
  windows derived against that table and the points curve all have to be re-measured together.

---

## 6. What breaks

### 6a. Guard tests – reproduced under each band, and NOTHING re-pinned

The two windows below are the only tight NUMERIC windows in the suite that a ceiling change can reach.
`tools/potential-band-sweep.ts` §5 runs the same preset, the same horizon, the same 30 indices and the
same predicate as the test, and prints the result against the test's own pinned band. It imports no
vitest and writes to no test file: the point is to price a re-pin before it is bought.

**`tests/econ-reach.test.ts` · 14→18 pro proxy** (middle·self-coached, top-50 once ranked, of 30).
Pinned window `[7, 21]`, anchored at 13 by the 10.08 re-point.

| variant | measured | vs anchor | verdict |
| --- | --- | --- | --- |
| **baseline `[4, 26]`** | 15 | +2 | inside |
| floor+3 `[7, 26]` | 20 | +7 | inside |
| **floor+6 `[10, 26]`** | **18** | +5 | **inside** |
| spread `[10, 20]` | 16 | +3 | inside |
| top+14 `[4, 40]` | **25** | +12 | **⚠ RED** |
| both `[10, 40]` | **25** | +12 | **⚠ RED** |

**`tests/econ-reach.test.ts` · 14→16 domestic door** (working·self-coached, 250 points, of 30).
Pinned window `[4, 20]`, anchored at 11.

| variant | measured | vs anchor | verdict |
| --- | --- | --- | --- |
| **baseline `[4, 26]`** | 13 | +2 | inside |
| floor+3 `[7, 26]` | 11 | +0 | inside |
| **floor+6 `[10, 26]`** | 11 | +0 | **inside, exactly on the anchor** |
| spread `[10, 20]` | **5** | −6 | inside, **one above the floor** |
| top+14 `[4, 40]` | 17 | +6 | inside |
| both `[10, 40]` | 13 | +2 | inside |

Three things worth naming:

- **`[10, 26]` is the only variant that moves neither guard.** 18 of 30 against `[7, 21]` and 11 of 30
  against `[4, 20]` – the second is exactly the pinned anchor. It costs no re-pinning at all.
- **`[4, 40]` and `[10, 40]` go red on the 14→18 proxy at 25 of 30**, i.e. five clear of the window.
  That is not a re-pin, it is a re-derivation: the guard exists to prove the proxy still SPLITS the
  field, and 25 of 30 is most of the way to the saturation it was written to detect.
- **⚠ `[10, 20]` is the one that flatters nobody: 5 of 30 against a floor of 4.** A mean-preserving
  band still moves this guard by −6, because narrowing the top removes the fast starters the domestic
  door measures. One seed of noise from red is not a margin.

Every other test that names `potential` sets it as a LITERAL fixture (`tests/radar.test.ts`,
`tests/academy.test.ts`, `tests/coachTiers.test.ts`, `tests/match-bonus.test.ts`) and is band-blind by
construction. `tests/relative-age.test.ts`'s `potentialBand` guard is about `COHORT.potentialBand`
`[1, 22]` – the field's band, which no variant here touches.

### 6b. Anchors that are not tests – nothing goes red, but each becomes a lie until re-run

| where | the anchor | moved by |
| --- | --- | --- |
| `src/engine/season/fieldPros.ts` | the top storey's `core: [67, 77]` derivation quotes "p50 63.2 · p90 68.8 · p99 73.2 · max 80.8" | §5, every variant |
| `tools/world-turnover.ts` | `ANCHORS`: p90 career core 68.8 · p99 73.2 · max talent 80.8 | §5, every variant |
| `tools/field-quality.ts` | prints `KID CEILING p50/p90/p99/max` on every run | §5, every variant |
| `tools/ladder-walk.ts` | "rollPotential's own p99 is ~73 mean-of-four" sets the walk's ceiling | §5, every variant |
| `tools/skill-ceiling.ts` §4 | already carries a `potentialBand hi 26 -> 40` dial arm; shipping a change makes its BASELINE row the new one | §3 |
| `docs/specs/skill-model-audit-2026-08.md` | §8's dial ranking and §11 row 1; its P6 finding ("+7.25 skill moved the best rank #203 → #139") is the same arm as `top+14` here | §3 |

⚠ **And one anchor that is arriving on the same wave.** The radar work in flight derives the skills
rose's outer ring as `SKILL_CEILING_MAX = top of the starting band (60) + top of potentialBand (26)
= 86`, imported from the engine rather than written into the Vue file – deliberately, so that
"widening the band moves the picture on the same commit". That is the right wiring, and it means the
band is now a **UI** constant too: `[4, 40]` would take the rose's ring to 100 and visibly shrink
every contour on it, while `[10, 26]` and `[10, 20]` leave the ring at 86 and 80 respectively. Not in
this branch's base, so not measured here – named so the two changes are not merged blind to each
other.

---

## 7. Recommendation

### Ship `[10, 26]`. Do not ship `[4, 40]`. And the measurement does NOT say "leave it alone".

**The case for moving at all is that the constant is not doing what its own comment claims.** The
band's note in `economy.ts` defends the low end as a rare, tellable story:

> A career at the bottom of this band is a girl who was never going to make it, and that has to be a
> career the game can tell – so the low end is deliberately small, not merely "less good".

Measured, it is not the bottom of the band – it is the middle of the game. **63.4% of careers ship
with a wing worth under eight points.** A design meant to make the low end a distinguishable story
has made a dead wing the default, and that is a measured gap between intent and behaviour rather
than a taste.

**Why `[10, 26]` and not one of the others:**

| | it fixes the dead wing | it is free in `fieldPros.ts` | every guard stays green | it leaves the top of the game where it is |
| --- | --- | --- | --- | --- |
| floor+3 `[7, 26]` | partly (24.1% still under 8) | yes (−0.3) | yes | yes |
| **floor+6 `[10, 26]`** | **completely (0.0%)** | **yes (+0.4)** | **yes, both untouched** | **yes** |
| spread `[10, 20]` | completely (0.0%) | **no (−4.2: nobody can be world #1)** | barely (5 of 30 against a floor of 4) | no |
| top+14 `[4, 40]` | **no (44.9% still under 8)** | **no (+10.6)** | **no (25 of 30, window tops at 21)** | no |
| both `[10, 40]` | completely | **no (+11.6)** | **no (25 of 30)** | no |

1. **It is the only variant that reaches the complaint and costs nothing on paper.** Dead wings
   21.2% → 0%, worst-wing p10 4.5 → 10.3, and the `fieldPros` storey midpoint lands at 77.4 against
   the shipped 77 – inside the noise of the 20,000-sample estimate the 77 was derived from. Nothing
   in the professional table has to be re-derived.
2. **On the owner's own career it multiplies the dead wing by 2.5.** Her serve's true roll goes
   4.1 → 10.1. She has realised 68% of it at 17.6, so "1.3 points left in her whole career" becomes
   **3.2 points left** on the same realisation curve – and that is the wing, not the total.
3. **It keeps both shipped guard windows green** (18 of 30 against `[7, 21]`; 11 of 30 against
   `[4, 20]`, which is exactly the pinned anchor), so the change costs no re-pinning – only the six
   documented anchors in §6b, all of which are re-run by one `bench:skill` and one run of this tool.
4. **It is the only variant that gets every bench career paid** – 12/12 in both cells against 10/12
   and 8/12 at baseline (§3). "Enough to play for" has a measurable reading, and this is it.
5. **The price, stated plainly:** +2.2 / +3.0 peak skill and +4 / +5 points of win rate on the median
   career (§3), and the median ceiling core moves 63.3 → 66.3 – i.e. the median career's ceiling
   arrives exactly at the top of the pro table's `elite` storey (`core [56, 66]`) instead of just
   below it. **That is a deliberate difficulty change and should be bought as one**, not as a bug fix.

**Why NOT `[4, 40]`, the ceiling lift:** it costs the most and buys the least of what was asked. It
re-opens the whole professional calibration (+10.6 on the storey midpoint; 13.0% of careers would
ceiling above the world #1 herself), it turns the 14→18 reach guard red at **25 of 30** against a
window that tops out at 21, it puts a slam on the board in both bench cells – and it still leaves
44.9% of careers with a wing under eight points. On the career that started this question it moved
the dead serve from **4.1 to 4.2**. The top of a uniform band cannot reach a wing that drew `u ≈ 0`,
and that is the whole finding in one line.

**The fallback, if the owner does NOT want the median career to get better:** `[10, 20]`. It is
mean-preserving (§2c) and kills dead wings just as completely while moving peak skill by less than a
point. Its cost is at the other end and it is not small:

- its MAX talent is 74.9, **below** the world #1's core of 77, so nobody could ever be world #1 and
  `fieldPros`'s top storey would have to come down with it;
- it lands the 14→16 door guard at **5 of 30 against a floor of 4** – one seed of noise from red.

That is a larger change than the one being bought. Take it only if the answer to "should the median
career get better?" is a firm no, and price the top storey with it.

### ⚠ What the floor does NOT fix, named rather than half-built

**It changes the AMOUNT, not the TIMING.** `growWeek` takes a share of the REMAINING distance, so the
curve is asymptotic whatever the ceiling is: `skill-model-audit-2026-08.md` §2 measures ~58% of
headroom realised by eighteen on a self-coached balanced career. A 10-point wing therefore still
delivers about six of its points before she is eighteen, and the last two never quite arrive.

If the complaint is really **"there is nothing left to play for AT SEVENTEEN"** rather than "there was
never much", the dial is the AGE CURVE – `growthEase`, `plateauStart`, `plateauRate` – and this page
does not measure it. `tools/skill-ceiling.ts` §4 already has arms for all three. That is the next
question, and it is a different one.

---

## 8. What this branch did NOT do

- did not move `ECONOMY.development.potentialBand`, `ECONOMY.development.ageCurve` or any other
  shipped constant;
- did not touch `COHORT.potentialBand` or anything else in `season/cohort.ts`;
- did not re-pin a single test bound;
- did not commit, derive a fixture from, or quote anything from a personal save beyond the aggregate
  placements in §4.
