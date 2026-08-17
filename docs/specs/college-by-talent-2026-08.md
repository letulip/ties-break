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

---

## 4. THE MEASUREMENT

*(filled in from the two runs – see the sections below)*

---

## 5. THE RESEARCH HALF

> «(и есть ли примеры из жизни куда они возвращаются, кстати?)»

See `docs/research/college-and-the-junior-exit.md` §3a. **⚠ Nothing measured in this repository appears
there as external evidence**, per that document's §0 sourcing rule.

---

## 6. ⚠⚠ FOR THE OWNER – the options, unshipped

*(filled in below)*
