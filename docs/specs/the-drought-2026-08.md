---
type: spec
status: draft
area: engine/balance
canonical: false
last-reviewed: 2026-08-28
---

# The drought – how long she really goes without winning anything (28.08.2026)

Captured verbatim, because the claim is his and this page exists to check it rather than to agree
with it. He has just amended the sliding-window ruling on the strength of a feeling:

> «когда она только в своем коридоре, то вполне может случиться так, что она за год ни одного кубка
> не увидит, так что может быть всё-таки какие-то близкие outgrown и стоит оставить, чтобы можно
> было хотя бы где-то что-то выиграть. Иначе это вообще боль по ощущениям.»

**The instrument:** `tools/drought-probe.ts`. Measurement only – no engine constant is patched,
shadowed or temporarily written, and every career is advanced through `stepCareerWeek`, the public
path `growth-pace-probe` and `ladder-vs-targets` already drive. The one thing this page adds is a
BENCH MANAGER (`KEEP_OUTGROWN`) – `econ-bench`'s `player` policy with a single field flipped – so his
amendment can be priced without touching the ladder.

**Its ancestors.** [how-fast-she-grows-2026-08.md](how-fast-she-grows-2026-08.md) measured the PACE
of the same careers and this file borrows its corpus shape, its ARM 1 resolution guard and its
warning about instruments that move their own subject.
[ladder-floor-2026-08.md](ladder-floor-2026-08.md) is the ruling being amended.
Round 28 items **12** and **16** are the same complaint arriving from the feed and from the trophy
cabinet.

---

## 0. The one-page answer

**90 careers × 4 arms, 9 econ-bench presets × 10 seeds, the same seeds in every arm. Every share
carries a Wilson 95% interval.**

1. **⚠⚠ HIS HYPOTHESIS ABOUT THE GATE IS WRONG, AND IT IS WRONG FIRST BECAUSE THE RULE HE IS
   AMENDING NO LONGER EXISTS.** Since his own 06.08 ruling `tierOpenFor` is `tierFloorOpen` and
   nothing else: **every rung she has ever reached stays enterable for ever.** "Keep some close
   outgrown rungs" is already shipped in its maximal form. What still keeps her off a lower rung is
   one refusal (`PLAY_DOWN`, the tour's own rank cut) and two DISPLAYS – the Home strip's `working`
   set and the week card's preference for the taller rung. §1.
2. **⚠ AND THERE IS NO 52-WEEK LAG ANYWHERE ON THE GATE.** Nothing on the path latches; it re-reads
   `kidRankWta` every week and persists nothing (asserted byte-for-byte in
   `tests/play-down.test.ts`). The lag lives in the RANKING, which is a best-18-of-rolling-52 fold:
   after a season that made her rank 50% worse it takes a **median 45 weeks** to recover, and a rung
   sits out of her corridor a **median 29.5 weeks (p75 51)**. «About a year» is the p75 of the
   corridor's own churn, not its median. §6a.
3. **⭐ THE DROUGHT IS REAL AND COMMON.** **23.9%** [22.2–25.7] of complete seasons carry no title at
   any rung; **85.6%** of careers run a two-season drought and **53.3%** a three-season one. On the
   BIG rungs it is twice as long: the median career goes **6 seasons** without a w75-or-above title,
   p90 nine – which is round 28 #16's «с тех пор… в 500 вообще пусто», at the median. §3.
4. **⭐⭐ BUT NOT TO THE PLAYER HE THINKS.** The weak-for-rank hypothesis is not merely unsupported –
   its sign is inverted. Among 20+ professionals the WEAKEST-for-rank quartile has the LOWEST drought
   rate (15.1% vs 40.9% two quartiles up), and `strength` carries no information the rank does not:
   her core is frozen after 16.4, so it is `coreForStanding(rank)` wearing another name. §4a-b.
5. **⭐⭐⭐ WHAT DOES PREDICT IT IS A NARROW RANK BAND, AND IT IS THE ONE HE IS IN.** At **#81-120,
   two seasons in three carry no silverware at all** (66.1%, vs 15.3% inside the top 50) while she is
   still entering 23 events. **81 of 90 careers pass through #51-120.** It is exactly the band where
   §1a's arithmetic says her corridor is `wta125 · wta250 · wta500 · slam` and nothing below – W50,
   W75 and W100 all marked passed, W15/W35 barred outright. Fall out of the top 120 and the title
   rate **triples**. §4c.
6. **⭐⭐ TITLES COME FROM THE BOTTOM, OVERWHELMINGLY.** For an adult, **81.8%** [80.3–83.1] of titles
   are won at the bottom TWO rungs of what she plays that season and **2.2%** at the top. His own
   test for the amendment is met, and not narrowly. §5.
7. **⭐ THE AMENDMENT WORKS.** One field of the manager (`skipOutgrown` true → false) halves the
   drought – **23.9% → 11.4%**, longest run median 3 → 1 seasons, careers ever running three
   title-less seasons 53.3% → 5.6%, shorter in **71 of 90 paired careers** – and it removes the
   #81-120 wall outright (66.1% → 17.1%). §7a.
8. **⚠⚠ AND IT IS NOT FREE, WHICH IS WHY *TWO* RUNGS IS THE RIGHT ANSWER AND *ALL* IS NOT.** The
   maximal version costs +5 events a season, **career-ending injuries 7 → 21 of 90** (intervals do
   not overlap), 2.2 seasons of career length, and −158 WT500 / −102 WT250 titles. And **73.8% of the
   silverware it adds is W50 and below** – 286 W15 titles and 180 **Local Opens won by an adult
   professional**, which is the junk `act2-pro-tour.md` §11 built the ceiling to remove. Only 26.2%
   is at `w75`/`w100`/`wta125`, the rungs actually adjacent to her. §7b-c.

> ### ⭐ THE RECOMMENDATION
> **(a), as he ruled – keep the two rungs immediately below the corridor – and the measurement says
> why: it captures the quarter of the gain that is real silverware at her own level and leaves out
> the three-quarters that is padding.** NOT (b): there is no hysteresis to add, because there is no
> latch to add it to, and the 52-week fold in the ranking already is one. NOT (c): the drought is
> not rare, and at #81-120 it is the normal case.
>
> ⚠ **But the FIRST thing to fix is not the ladder.** The engine already lets her enter those rungs
> and she is already winning on them – **a sixth of her silverware comes from rungs the game calls
> passed, under a manager that is declining them** (§5). What tells her they are behind her is the
> Home strip and the week card. This is round 21 #2 and round 28 #12 for the third time: **the
> calendar meets its rule and the screen does not.**

⚠ **And one defect found while measuring, reported and not fixed:** from her nineteenth birthday
`tierOutgrown` can never again return true for `local`, `regional` or `national`, for any player at
any ranking – the rung three above each of them is a JUNIOR rung with `maxAgeYears: 18`, so the age
clause returns `false` before the band is read. This is round 28 #12 defect 1 with a second cause
that item did not name, and it means the `working` set an amendment would be built on is three rungs
wider than the design says. §6b.

---

## 1. The mechanism, before any number – because the amendment names a rule that no longer exists

⚠⚠ **THE ENGINE ALREADY KEEPS EVERY OUTGROWN RUNG, AND HAS SINCE 06.08.** `tierOpenFor` is
`tierFloorOpen` and nothing else (`src/engine/world/ladder.ts:422-424`), which is the whole content
of his own earlier ruling, quoted in `ladder-floor-2026-08.md`:

> «Точно надо выровнять наши окна, а лучше как ты говорил, не делать нижний порог вообще, пусть
> играет, просто по приоритету более актуальный турнир показывать, если есть.»

So a rung she has ever reached never shuts again on the floor test, and `hasOutgrown` survives as a
LABEL and a sorting key. **"Keep some close outgrown rungs" is already shipped, in the strongest
possible form: all of them.** What can still stop her entering a lower rung is exactly three things,
and only the first is a refusal:

| | what it is | where | is it a refusal? |
| --- | --- | --- | --- |
| **1. `PLAY_DOWN`** | WTA #1-50 barred from every W-series event; #1-150 barred from W15/W35 | `ladder.ts:532-567` | **YES** – the only one |
| **2. the Home strip** | shows `working` (open MINUS `hasOutgrown`), then keeps the TOP FOUR | `HomeScreen.vue:765`, `STRIP_MAX_RUNGS = 4` at `:818`, trimmed from the bottom at `:882` | no – display |
| **3. the week's card** | `preferredWeekEvent` prefers entered → eligible → **the taller rung** | `composables/tierState.ts:301-324` | no – display |

⚠ **And the SEASON FEED is not on that list.** `feedShows` tests `ctx.rungs`, not `ctx.working`
(`tierState.ts:262-264`) – the open set with the outgrown rungs still in it, minus only the rungs she
has AGED out of and the rungs more than `FEED_TABLE_SLACK = 1` tables below her active table. **The
feed already offers her the rungs he wants kept.** Round 28 #12 measured his own save and named her
playable set as `w50 w75 w100 wta125 wta250 wta500 slam` – w50/w75/w100 are in it, and every one of
those three is `hasOutgrown` at #110.

### 1a. What the corridor actually is at a given rank – arithmetic, not a measurement

`tierOutgrown(t)` is true when the rung **three above** `t` is open to her (`WINDOW_RUNGS = 3`), and
the last four rungs never close (`TERMINAL_RUNGS = 4`). Every W cut is an absolute rank
(`calendar.ts`: w35 700, w50 330, w75 300, w100 240, wta125 210, wta250 200, wta500 120, wta1000 65,
slam 112), so the working corridor is a pure function of her WTA rank. Walked out:

| her rank | the working corridor (open AND not `hasOutgrown`) |
| --- | --- |
| ≤ 50 | wta250 · wta500 · wta1000 · slam |
| 51-65 | wta250 · wta500 · wta1000 · slam |
| 66-112 | **wta125 · wta250 · wta500 · slam** |
| 113-120 | wta125 · wta250 · wta500 |
| 121-200 | w100 · wta125 · wta250 |
| 201-210 | w75 · w100 · wta125 |
| 211-240 | w50 · w75 · w100 |
| 241-300 | w35 · w50 · w75 |
| 301-330 | w15 · w35 · w50 |
| > 330 | w15 · w35 |

⭐⭐ **The 66-112 row IS round 28 #16.** «250 и 500 всё ещё выглядят почти как стена… А в 500 вообще
пусто. При этом она около топ-100.» At #110 her corridor is WT125, WT250, WT500 and the Slams and
**nothing else** – W50, W75 and W100 are all marked passed because WT125, WT250 and WT500 are open to
her, and W15/W35 are barred outright by `PLAY_DOWN`. She is told she has outgrown every rung she
could win and is left with three she cannot.

⚠ **Two honest caveats on the table.** The Slam row can also open on the home wild card
(`homeWildCardPlace`, Slam-only), so a home major can appear below the #112 cut; and the alternates
door widens a cut by up to `ALTERNATES.places` (4, `season/tournament.ts:269`) but only when an
EVENT is named, which
`tierOutgrown` never does – so it cannot move a single row above. §6's measured corridor widths are
the check on the arithmetic, and they agree.

⚠ **The corridor is pinned to the FRONTIER of her ranking by construction.** Its bottom rung is
always one whose next-but-two is only just shut to her. It can therefore never contain a rung she has
comfortably mastered – that is not a bug in the numbers, it is what «окно» means as currently
written.

---

## 2. How it was measured

### 2a. The corpus and the arms

Full careers, **14 → the horizon** (`FULL_CAREER_WEEKS`, 1612 weeks), stopping at whatever ending
arrives, bankruptcy not defused. The fork at nineteen is answered `continue` and every retirement
offer is refused until the game stops asking, so what is measured is the TENNIS filter with the
player's own exit choices held out – `ladder-vs-targets` and `growth-pace-probe`'s convention, kept
so the three corpora are comparable.

| arm | manager | careers | what it is for |
| --- | --- | --- | --- |
| **MAIN** | `player` | **90** (9 presets × 10 seeds) | the headline. `skipOutgrown: true` – the parent declines the rungs she has passed, which is «в своем коридоре» expressed as a manager |
| **CONTROL** | `player`, `--noCorridor` | 90, same seeds | the non-interference receipt, §2c |
| **KEEP** | `player` + `skipOutgrown: false` | 90, same seeds | his amendment, priced. One field, everything else byte-identical |

⚠ **90 careers, and the intervals are printed rather than implied.** Every share below carries a
Wilson 95% interval; a share near 30% on 90 careers is worth about ±10 points and on ~2,000
career-seasons about ±2. Where a claim rests on the smaller base this page says so.

⭐⭐ **WHICH ARM IS "TODAY" IS NOT OBVIOUS, AND GETTING IT BACKWARDS WOULD INVERT THE VERDICT.**
MAIN is his FEAR – a parent who plays only the corridor, which is what `skipOutgrown: true` means.
KEEP is closer to what the game actually permits and to what he actually does: on his own save Alice
took **3 × W75 and 1 × W100 in the last ~1.75 seasons**, and at WTA #110 BOTH of those rungs are
`hasOutgrown` (§1a). **He has already been living off the outgrown rungs.** So the gap between MAIN
and KEEP is not "what his amendment would add" – it is "what he would LOSE if the game ever started
enforcing the corridor it displays."

⚠ **KEEP is the UPPER BOUND of his amendment, not the amendment.** He asked for «какие-то близкие
outgrown» – the two rungs nearest her. KEEP restores all of them. So a null here is a strong null
(even the maximal version does nothing) and a positive here is only a ceiling on what two rungs
could buy.

### 2b. Where a title is read from, and why not from anywhere else

`world.trophiesByTier[tier].titles` – an append-only array of WEEK NUMBERS, pushed inside
`finalizeTournament` (`world.ts:502-504`), never pruned. It is the only structure in the save that
can answer "which YEAR did she last win something": `bestFinishByTier` is a high-water mark with no
week and no count, `results` prunes at 52 weeks, `milestones` keeps firsts only, and
`SeasonHistoryEntry.bestFinish` carries no tier.

⚠ **The SEASON a title belongs to is exact; its corridor reading is within one week.** The season is
`seasonIndexOf` of the cabinet's own stamped week, so nothing about §3 or §4 can drift. The corridor
and `hasOutgrown` readings beside a title are taken at the week the probe SEES the cabinet grow,
which is the finalize week or the one after it – close enough for "which rung of the window", not for
anything finer, and §5 prints the PLAYED reading beside it, which cannot drift at all.

**ARM 1, borrowed from `growth-pace-probe` and not decoration.** Everything read here is written by
`finalizeTournament`, reached only through `skipTournament`. `pro-season-probe.ts:388` records three
waves of a bench reading the body BEFORE the reveal finished and losing 57% of the pro era's injury
onsets to it. `assertResolved` therefore runs after EVERY step and throws on a half-revealed draw.

### 2c. The instrument was assumed to move its subject until it was proved not to

`growth-pace-probe` §2c records a once-a-week `tableSize(world, 'wta')` call – a documented pure
function – MOVING ITS OWN CORPUS, because it reaches the memoised `fieldProsOf` at a week the engine
would not have. The per-week `tierOpenFor`/`hasOutgrown` sampling §5 and §6 need reaches further into
that machinery than `tableSize` does, so it sits behind `--corridor` and the run is diffed against
`--noCorridor` on a printed FINGERPRINT line (titles, seasons, drought seasons, the sum of every
career's longest run, the sum of career-best ranks).

**Run 28.08, 9 careers, the same command one flag apart:**

```
9-CAREER CONTROL (corridor OFF):  FINGERPRINT titles=466 seasons=239 dry=67 longestSum=27 bestSum=128
9-CAREER MAIN    (corridor ON ):  FINGERPRINT titles=466 seasons=239 dry=67 longestSum=27 bestSum=128
NON-INTERFERENCE: IDENTICAL
```

**And repeated at 90:**

```
CONTROL (corridor OFF):  FINGERPRINT titles=5463 seasons=2362 dry=565 longestSum=237 bestSum=1145
MAIN    (corridor ON ):  FINGERPRINT titles=5463 seasons=2362 dry=565 longestSum=237 bestSum=1145
=> IDENTICAL at 90 careers
```

⚠ 9 careers is the size `growth-pace-probe` §2c used for the same control, and it is the size at
which the `tableSize` contamination it caught was VISIBLE – that defect moved the median career-best
rank and three milestone ages on exactly this corpus. Both sizes agree, so §5 and §6 are quoted from
the same corpus as §3 and §4 rather than from a second one.

### 2d. ⚠ And the instrument crashed once, at 90 careers, after the 9-career smoke passed

`dist()` reported `min`/`max` with `Math.min(...xs)`. That passes every element as an ARGUMENT, so
on the per-career-week series §6 prints – 90 × 1,612 ≈ 145,000 numbers – it threw `RangeError:
Maximum call stack size exceeded` **after sixteen minutes of simulation, with nothing written**. At 9
careers the same series is 14,500 arguments and still fits, so the smoke was green and told me
nothing. Both are loops now (`minOf`/`maxOf`), and the lesson is the one this repo keeps relearning:
**a smoke that is 10× smaller than the run does not exercise the run's failure mode.**

---

## 3. The drought distribution

**90 careers, 2,362 complete seasons** (90 partial ones dropped – a season a career ended halfway
through is half a year, not a title-less year, and counting it would manufacture the finding).

| | |
| --- | --- |
| complete seasons with **no title at any rung** | **565 of 2,362 = 23.9%** [22.2–25.7] |
| ...of the 2,091 carrying at least one professional entry | 24.8% [23.0–26.7] |
| titles per complete season | median **2**, p75 3, p90 6, max 14 |
| each career's **longest** title-less run | median **3 seasons**, p90 4, max 6 |
| every title-less run, its length | median 1, p75 2, p90 3 |
| careers that never win a title | **0.0%** [0.0–4.1] |

**Careers that EVER run a title-less streak of at least:**

| 1 season | 2 seasons | 3 seasons | 4 seasons | 5 seasons |
| --- | --- | --- | --- | --- |
| **95.6%** [89.1–98.3] | **85.6%** [76.8–91.4] | **53.3%** [43.1–63.3] | 22.2% [14.9–31.8] | 5.6% [2.4–12.4] |

⭐ **«За год ни одного кубка» is not a tail. It is the median career, twice.** A one-season drought
happens to 96 careers in 100 and a two-season drought to 86.

### 3a. But it is not evenly spread, and the age split is most of it

| her age at the start of the season | n | no title | mean titles |
| --- | --- | --- | --- |
| 14-17 | 360 | **9.2%** [6.6–12.6] | 4.94 |
| 18-21 | 360 | 15.0% [11.7–19.1] | 2.45 |
| 22-25 | 358 | 18.4% [14.8–22.8] | 2.35 |
| 26-29 | 345 | 15.7% [12.2–19.9] | 2.29 |
| **30+** | 849 | **42.0%** [38.8–45.4] | 0.99 |

⚠ **Half the corpus is 30+, and that is the bench's doing, not the game's.** This arm refuses every
retirement offer until the game stops asking, so it walks careers to ~40. The headline should be read
on **18-29: 15-18%**, roughly one dry season in six.

### 3b. ⭐⭐ And the drought he actually filed is a different, much longer number

Round 28 #16: «в 35 году она взяла 2 250 победой, а с тех пор… А в 500 вообще пусто» – a career that
stopped winning at the TOP of the ladder while the rank did not move. Measured as titles at **w75 or
above**:

| | |
| --- | --- |
| longest run with no w75-or-above title | median **6 seasons**, p75 8, p90 9, max 27 |
| seasons carrying a w75+ title | 47.7% |

**His seven years is the median-to-p75 case, not a tail.** On the big rungs the drought is twice as
long as on the ladder as a whole.

---

## 4. Who suffers – and it is NOT the player who is weak for her rank

**The hypothesis under test:** the sufferer is the player who is WEAK for her rank – she climbed on
points, cannot win inside her corridor, and the rungs below are shut by that same rank.
**strength = her `power()` mean − `coreForStanding(her WTA rank)`**; positive means she is stronger
than her rank implies. (`coreForStanding` on this ladder: #1 = 76.4, #26 = 60.6, #50 = 56.4,
#110 = 50.8, #250 = 40.7, #600 = 32.4.)

### 4a. The sign is backwards, and the size is small

| | r | n |
| --- | --- | --- |
| r(strength, titles that season) | +0.25 | 2,087 |
| r(strength, IS a drought season) – all ages | **+0.01** | 2,087 |
| r(strength, IS a drought season) – 20+ pros | **+0.21** | 1,672 |
| r(**\|**strength**\|**, IS a drought season) – 20+ pros | +0.08 | 1,672 |

Drought rate by strength quartile, **20+ professionals only** (age held out):

| strength | n | no title | mean titles |
| --- | --- | --- | --- |
| −inf … −2.4 (**weakest for her rank**) | 418 | **15.1%** [12.0–18.8] | 2.18 |
| −2.4 … 1.4 | 418 | 24.6% [20.8–29.0] | 2.05 |
| 1.4 … 6.6 | 418 | **40.9%** [36.3–45.7] | 1.34 |
| 6.6 … +inf (**strongest for her rank**) | 418 | 38.3% [33.7–43.0] | 1.11 |

⭐ **The player who is weak for her rank has the LOWEST drought rate in the corpus.** The hypothesis
is not merely unsupported – its sign is inverted.

### 4b. ⚠⚠ And the reason is that `strength` carries no information the RANK does not

Her core is effectively frozen after seventeen – `how-fast-she-grows-2026-08.md` §1: **90% of her
rolled ceiling is spent by 16.4**. With the numerator static, `strength` moves almost entirely with
`coreForStanding(rank)`, which is monotone in the rank. So "strong for her rank" is very nearly a
restatement of "ranked worse than she plays", and a title-less season is itself what makes the rank
worse the following year. **It is a mirror, and part of what it reflects is last season's drought.**
The cross-tab makes that mechanical:

| rank band | weak-for-rank seasons | strong-for-rank seasons |
| --- | --- | --- |
| #1-50 | 724 | 249 |
| #51-120 | 40 | 207 |
| #121-250 | 7 | 386 |
| #251+ | 2 | 472 |

Below #120 essentially nobody is "weak for her rank", because `coreForStanding` at those standings is
lower than any core the growth curve produces. **The quartiles of `strength` are the quartiles of the
rank wearing a different name.**

### 4c. ⭐⭐⭐ What DOES identify her: a rank band, and it is narrow

Complete seasons, **20 and over**, by the rank she ends the season on:

| rank band | n | no title | mean titles | mean events entered |
| --- | --- | --- | --- | --- |
| #1-50 | 869 | 15.3% [13.1–17.9] | 2.31 | 25.8 |
| **#51-80** | 86 | **54.7%** [44.2–64.7] | 0.60 | 23.7 |
| **#81-120** | 121 | **66.1%** [57.3–73.9] | **0.47** | 22.8 |
| #121-200 | 145 | 53.8% [45.7–61.7] | 0.96 | 18.9 |
| #201-350 | 315 | 30.2% [25.4–35.4] | 1.36 | 24.3 |
| #351+ | 136 | 47.1% [38.9–55.4] | 0.74 | 31.2 |

⭐⭐ **#81-120 is a wall: two seasons in three carry no silverware at all, while she is still entering
23 events.** She plays a full schedule and wins nothing. **81 of 90 careers pass through #51-120**,
spending 247 seasons there, **53.0% of them title-less.**

⭐ **And it is exactly the band §1a's arithmetic predicts.** At #66-120 the corridor is
`wta125 · wta250 · wta500 · slam` and nothing below – W50, W75 and W100 are all marked passed, and
W15/W35 are barred outright. Drop out of the top 120 and W100 comes back: the title rate **triples**,
0.47 → 0.96 → 1.36. **The rungs that produce her silverware are exactly the ones the window takes
away at #120.**

⚠ #351+ reading 47.1% is the decline tail – 31 events a season and losing them – not the same
mechanism.

---

## 5. Where the titles come from – the bottom, overwhelmingly

**5,463 titles.** By rung: `wta500` 24.4% · `w15` 14.0% · `wta250` 13.8% · `w35` 12.6% · `local` 8.9%
· `w50` 5.9% · `wta1000` 5.3% · `j30` 3.5% · `regional` 2.9% · `w75` 2.1% · `wta125` 1.9% · `w100`
1.8% · `j60` 1.6% · `slam` 0.8% · `national` 0.4% · `j300` 0.1%.

**Position inside the set of rungs she ACTUALLY ENTERED that season** – 0 = the lowest she played.
This is the reading that cannot drift (§2b) and it is the one that answers his question:

| | bottom rung | second from bottom | **bottom TWO** | top rung |
| --- | --- | --- | --- | --- |
| all ages (n=5,463) | 30.0% | 34.6% | **64.6%** [63.3–65.9] | **2.7%** [2.3–3.2] |
| **20 and over** (n=3,036) | 33.0% | 48.8% | **81.8%** [80.3–83.1] | **2.2%** [1.7–2.8] |
| 24 and over (n=2,229) | 34.5% | 48.9% | **83.4%** [81.8–84.9] | 2.2% [1.7–2.9] |

⭐⭐ **This is as one-sided as a measurement of this kind gets. Four titles in five, for an adult, come
from the bottom two rungs of what she plays that season; one in fifty comes from the top.** The
parent's own test – "if titles come overwhelmingly from the bottom rung, that is direct support for
his amendment" – is met, and not narrowly.

**And a sixth of her silverware is already won on rungs the game calls passed:**

| | |
| --- | --- |
| titles at a rung `hasOutgrown` calls PASSED, all ages | **15.3%** [14.4–16.3] |
| ...at 20 and over | 10.1% |

⚠ **under a manager whose `skipOutgrown` is TRUE** – a parent who is *declining* those rungs still
takes a sixth of his trophies there. The rung was not outgrown when he entered it (three weeks
earlier, `ENTRY_LOOKAHEAD`); **she outgrew it by winning it.** That is the owner's own 05.08 case
said forwards: «моя уже 22 летняя выиграла 2 w50 подряд и ее автоматом сняли с 3-го». A parent who
does not decline them (§7) is the arm that prices the rest.

### 5a. ⚠ The corridor-position reading is polluted, and §6 explains why

Read against `hasOutgrown`'s own working set the numbers look flat – bottom 15.1%, middle 18.4%, top
11.6%, and 15.3% outside the corridor entirely, on a corridor whose measured width is **median 6**
rather than the 3-4 §1a predicts. That extra width is a defect, not a nuance: see §6b. The PLAYED
reading above is unaffected by it.

---

## 6. The cliff – the gate has NO lag; the RANK does

### 6a. Stated first, because the hypothesis on the table is wrong

The proposal was: *the gate is a cliff with a 52-week lag – a slump shuts the rungs above instantly
and reopens the rungs below only a year later.* **The second half is wrong at the mechanism level and
the first half is wrong at the arithmetic level.**

**Nothing on this path latches.** `tierOpenFor` → `tierFloorOpen` → `playDownBars` /
`meetsAcceptanceCut`, and every one of them re-reads `world.kidRankWta` on the spot and persists
nothing. `tierOutgrown`'s own comment says it: *"a ROLLING TEST, NOT A LATCH"*, and
`tests/play-down.test.ts:114` asserts `JSON.stringify(world)` is byte-identical across crossing the
line and crossing back – "nothing persists" made mechanical rather than promised. **A rung comes back
the same week the rank does.** There is no hysteresis to remove because there is none to begin with.

**And the rank does not fall off a cliff either** – it is a best-18-of-rolling-52 fold
(`BEST_N_BY_TRACK.wta = 18`, `WINDOW_BY_TRACK.wta = 'rolling52'`), so a bad season leaks out of it
one week at a time. Measured, after a season that made her rank at least 50% worse (n=405):

| | |
| --- | --- |
| weeks until her RANK recovers to the pre-drop mark | median **45**, p75 79, p90 103 (n=98 of 405 recover at all) |
| weeks a rung stayed OUT of the corridor before returning | median **29.5**, p75 51.0, p90 88.5 (n=746) |
| weeks a rung stayed IN before leaving | median 22, p75 37 |

⭐ **So "about a year" is the p75 of the corridor's own churn, not its median, and the lag lives in
the RANKING, not in the gate.** Anything built as hysteresis on the gate would be added on top of a
52-week fold that already is the hysteresis.

**The one thing on the ladder that IS a cliff** is `PLAY_DOWN`, and it is bimodal rather than lagged:

| W15/W35 barred, one spell | median **8 weeks**, p75 54.5, **p90 847.5**, max 1,115 (n=386) |
| --- | --- |

Either she dips across #150 for a couple of months, or she clears it for good and the two bottom
rungs are gone for the next sixteen years. There is no middle. ⚠ And it is the tour's own rule,
quoted verbatim in `docs/research/real-ladder-pace.md` §4 – *"a player ranked WTA #1-150 may not enter
W15 or W35 at all"* – so it is the one refusal on this ladder that is not ours to waive.

### 6b. ⚠⚠ A DEFECT FOUND WHILE MEASURING – REPORTED, NOT FIXED

The corridor's measured width is **median 6** where §1a's arithmetic predicts 3-4, and its floor sits
at `TIER_LADDER` index **0 (`local`) in the median career-week** – which is why "after a rank drop, how
many weeks until a lower rung joins the corridor" comes back n=4 of 405: **the floor is already at the
bottom and has nowhere left to fall.** That is arithmetic, not a null result, and here is the cause.

`tierOutgrown` carries the age clause (`ladder.ts:502`):

```ts
if (!isTierAgeOpen(above, kidAgeAt(world, world.week))) return false
```

written for *"a door she cannot open YET cannot close the one behind her"* – the thirteen-year-old
with a J300 title who would otherwise lose J30 three years before W15's age gate lets her in. **It
also fires for a door she can never open AGAIN.** The rung three above each domestic rung is a JUNIOR
rung, and every J rung carries `maxAgeYears: 18`:

```
tierOutgrown(local   ) asks j30   -> isTierAgeOpen(j30,  25) = false
tierOutgrown(regional) asks j60   -> isTierAgeOpen(j60,  25) = false
tierOutgrown(national) asks j300  -> isTierAgeOpen(j300, 25) = false
```

**So from her nineteenth birthday `tierOutgrown` can never again be true for `local`, `regional` or
`national`, for any player, at any ranking.** `hasOutgrown` ORs three ceilings, and for an adult the
other two are dead too – `playDownBars` is W-series-only, and `outgrewTier` reads DOMESTIC points,
which are season-to-date (`WINDOW_BY_TRACK.domestic = 'seasonToDate'`) and read zero for a player who
stopped entering domestic events. **All three ceilings are inert, so `Snapshot.tierOutgrown.local` is
`false` for a thirty-year-old world #40.**

⭐ **This is round 28 #12 defect 1 – «`Local Open` never closes. At 26, WTA #110, it is open with
`outgrown=n`» – and it has a second cause that item did not name.** Item 12 attributed it to the
domestic points resetting; that is real, but even a player with 500 domestic points banked would keep
`tierOutgrown` false, because the age clause returns before the band is ever consulted. **Fixing the
points half alone would not close the rung.**

⚠ Nothing is broken downstream today: `paysIntoHerTables` (`FEED_TABLE_SLACK = 1`) drops the domestic
rungs from the feed of a W-table player anyway, and `STRIP_MAX_RUNGS` keeps only the top four. So the
consequence is confined to the `working` set being three rungs wider than the design says, which is
exactly the surface any "keep two outgrown rungs" change would be built on. **Anyone implementing his
amendment on top of `tierOutgrown` needs to know this first.**

---

## 7. The amendment, priced – it works, and it is not free

**MAIN vs KEEP: the same 90 careers, the same seeds, ONE field of the policy literal
(`skipOutgrown` true → false).**

### 7a. What it buys

| | MAIN (corridor only) | KEEP (plays the passed rungs) |
| --- | --- | --- |
| complete seasons with no title | **23.9%** [22.2–25.7] | **11.4%** [10.1–12.8] |
| ...ages 18-33 | 21.6% | **8.1%** |
| longest title-less run, median / p90 / max | **3 / 4 / 6** | **1 / 2 / 4** |
| careers ever running 2 title-less seasons | **85.6%** | **27.8%** |
| careers ever running 3 | **53.3%** | **5.6%** |
| titles won | 5,463 | 7,612 |
| ...at a rung `hasOutgrown` calls passed | 15.3% | **47.6%** |

**Paired, career by career: the longest drought is SHORTER in 71 of 90, longer in 7, equal in 12.**
Mean delta −1.41 seasons, median −1. This is not a distributional artefact; it moves the individual
career.

⭐⭐ **And it removes the wall exactly where §4c found it.** Drought rate at 20+, by rank band:

| rank band | MAIN | KEEP |
| --- | --- | --- |
| #1-50 | 15.3% | 9.3% |
| **#51-80** | **54.7%** | **16.5%** |
| **#81-120** | **66.1%** | **17.1%** |
| #121-200 | 53.8% | 11.8% |
| #201-350 | 30.2% | 10.9% |
| #351+ | 47.1% | 40.4% |

Seasons spent ranked #51-120 that carry no title: **53.0% → 14.5%.**

### 7b. ⚠⚠ What it costs, and this is the half a "yes" has to price

| | MAIN | KEEP |
| --- | --- | --- |
| mean events entered per season, 20+ | 24.9 | **29.9** (+20%) |
| **careers ended by injury** | **7 of 90** | **21 of 90** |
| careers reaching the horizon naturally | 83 | 68 (+1 bankruptcy) |
| mean career length | 1,412 weeks | **1,300** (−2.2 seasons) |
| career-best rank, median / mean | #9 / #13.2 | #10 / **#19.3** |

⚠ **A career-ending injury rate of 7.8% [3.8–15.2] becomes 23.3% [15.8–33.1] – intervals that do not
overlap.** The mechanism is not mysterious and it is the engine's own: five more events a season is
five more weeks of match load. It was not isolated with a separate arm and this page does not claim
more than the association.

### 7c. ⭐⭐ AND THE COMPOSITION IS WHY "TWO CLOSE RUNGS" IS THE RIGHT SHAPE, NOT "ALL OF THEM"

Where the extra silverware comes from, **titles won at 20 and over**:

| rung | MAIN | KEEP | Δ |
| --- | --- | --- | --- |
| **w50** | 157 | 701 | **+544** |
| **w15** | 174 | 460 | **+286** |
| **wta125** | 57 | 258 | +201 |
| **local** | 72 | 252 | **+180** |
| **w75** | 45 | 210 | +165 |
| w35 | 294 | 318 | +24 |
| w100 | 43 | 52 | +9 |
| wta250 | 635 | 533 | −102 |
| wta500 | 1,225 | 1,067 | −158 |
| wta1000 | 272 | 228 | −44 |

**Of the +1,430 adult titles gained, only 26.2% are at `w75`/`w100`/`wta125` – the rungs immediately
below her corridor at the wall band. 73.8% are at W50 and below, including 286 W15 titles and 180
LOCAL OPENS won by an adult professional.**

⚠ That is precisely the junk `act2-pro-tour.md` §11 built the ceiling to remove – *"48 of the 64
entries left in his season sat at rungs whose STRONGEST entrant is weaker than she is."* A world #40
collecting Local Opens is a different bad feeling, not the absence of one. And the losses column is
real too: she takes **−102 WT250, −158 WT500 and −44 WT1000** titles, because the weeks went
somewhere else.

⭐ **So the maximal version is the wrong trade and HIS version is the right one.** «Какие-то близкие
outgrown» keeps the quarter of the gain that is silverware at her own level and leaves out the
three-quarters that is padding – and it costs a fraction of the +5 events a season that drives the
injury figure.

---

## 8. What this page does NOT establish

1. **It is not his save.** Round 28 #16 reads his Alice's cabinet; this reads 90 synthetic careers
   under a bench manager. The two agree on shape, not on any single number.
2. **The bench refuses every retirement offer**, so careers run past 40 and the corpus contains
   decline seasons a real player would never sit through. Every table therefore prints the age split
   and the headline is read on **18–33**, the era he plays.
3. **`skipOutgrown: true` is a MANAGER, not the engine.** The engine allows every outgrown rung
   (§1). MAIN measures a parent who declines them; KEEP measures one who does not. Neither measures
   the ladder, because the ladder does not refuse.
4. **The display half of §1 is a code read, not a measurement.** That the Home strip shows `working`
   and the week card prefers the taller rung is read off the source; how much of his felt experience
   that accounts for is not measured here and would need his save or a mounted test.
5. **Nothing here prices the COST of keeping the rungs.** `ranking-ceiling-2026-08.md` §6 already
   did, on the rank axis: `tierOutgrown` OFF takes entries from ~23 to **40.2 a season** for **+100
   points and 8 ranking places**. Doubling her schedule is a fatigue, money and travel change this
   page did not simulate.
6. **Supply is somebody else's measurement.** How many events her band actually carries is
   [the-calendar-she-can-reach-2026-08.md](the-calendar-she-can-reach-2026-08.md), running in
   parallel; this page asks only whether she WINS what she reaches.

---

## 9. Receipts

| | |
| --- | --- |
| branch | `measure/drought-2026-08`, worktree off `origin/round/28-ledger` (`6c5a131`) |
| files changed under `src/` or `tests/` | **0** – `git diff origin/round/28-ledger --name-only -- src tests` is empty |
| **frozen MAIN capture (41550 / `e6b0c709`)** | **UNMOVED.** `tests/condition.test.ts` run alone on an idle machine: **51 passed, 0 failed, 10.3s** |
| ⚠ the same file, run while three 90-career benches were live | 1 failed – **B1c, a 20 s TIMEOUT with zero assertion failures**, in a 120-week `toSnapshot` loop. Contention, per CLAUDE.md's own rule, and it passed clean |
| `npm run check:tools` | 2 errors, both baseline (`birthday-pool.ts`, `his-careers-brackets.ts`). This wave adds **0** |
| `npm run tools:registry:check` | 1 error, the baseline one (`tsconfig.app.json` missing `tools/shop-probe.ts`). **Untouched.** ⚠ `tools/README.md` is REGENERATED, which is the only way to register a new archival tool – it also picks up `growth-pace-probe.ts` and `shop-probe.ts`, both already unregistered at this commit |
| `node scripts/context-audit.mjs --check` · `decision-index.mjs --check` | ok, ok, with this page present |
| `node scripts/doc-facts.mjs` | STALE at baseline (`now-next-later.md` says round 27) – fixed on the branch head, not in this worktree |
| the tool after the lint tidy-up | re-run at `--seeds 2`: `FINGERPRINT titles=948 seasons=482 dry=142 longestSum=51 bestSum=239`, byte-identical to the run the arms were measured on |
| arm runtimes | MAIN 516 s · KEEP 501 s · CONTROL, 90 careers each |
