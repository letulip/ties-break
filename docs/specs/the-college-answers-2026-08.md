---
type: spec
status: current
area: engine/balance
canonical: false
last-reviewed: 2026-08-17
---

# The six answers – the road back, the odds, the names, the season and the bankruptcies (17.08.2026)

**A twelfth phase on `wave/round21`.** The owner read
[`the-college-choice-2026-08.md`](the-college-choice-2026-08.md) and pushed back on six things. This
spec is the record of what each one turned out to be – **it does not restate the tier model**, which
is written once in that document, or the age grid, which is written once in
[`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

⚠ **No tour comparison anywhere in here** (owner's standing instruction). Every arm below is a
college arm, and the three are compared with each other and with a rank band – never with a career
that answered «continue» at the fork.

---

## 0. THE SIX, IN HIS OWN WORDS

| # | his sentence | what it turned out to be |
| --- | --- | --- |
| **1** | «обратной дороги в тур по сути нет – почему, куда она делась… Откуда взялась эта статистика вообще?» | *§1* |
| **2** | «"шанс выйти в топ-200"… это измеримо как мне кажется» | *§2* |
| **3** | «мы уже обсуждали стипендию, надо понять что и откуда или это тоже рандомная цифра?» | *§3* |
| **4** | «"Штатное / национальное / частное" – окей, но надо переформулировать точно» | *§4* |
| **5** | «13 недель – это в половину меньше, чем у нас в регулярном сезоне… готов услышать аргументы» | *§5* |
| **6** | «я не верю, что это возможно с твоими ценами выше, доходом родителей 600+» | *§6* |

---

## 1. ⭐⭐ PREDICTIONS – WRITTEN BEFORE THE POPULATION ARM WAS RUN

Recorded first, per CLAUDE.md invariant 4. §7 marks each held or wrong.

⚠ **One diagnostic ran before these were written and it is declared rather than hidden**: six careers
walked past graduation on `state`, to find out whether the road back exists at all before deciding
what to measure. It is quoted in §1a. Everything below is a claim about the POPULATION, and none of
it was known when this table was committed.

| # | prediction | verdict |
| --- | --- | --- |
| **R1** | **The road back exists and the reported 0 / 53 is an instrument artefact.** Over the population, **at least 80%** of careers that finish four years hold a WTA rank **within one season** of graduating. | |
| **R2** | **The rank she comes back to is close to the rank she left.** Median rank one year after graduating is **within 60 places** of her rank at the fork. | |
| **R3** | **The top-200 odds are measurable and STABLE enough to print** – the three tiers' four-year top-200 shares sit inside a 25-point spread and each is bounded away from 0 and 100. | |
| **R4** | ⚠⚠ **AND THE TIER MOVES THE ODDS THROUGH MONEY, NOT THROUGH HER GAME.** The dear place's top-200 share is **LOWER** than the cheap place's, and the whole of the gap is accounted for by careers that ended (bankruptcy) rather than by careers that played and fell short. **If the gap is not accounted for that way I have to say so and not print the number.** | |
| **R5** | **The bankruptcies are real arithmetic and not a missing income line.** Parent income arrives every week of the freeze, savings and banked prize money are in the balance the bill is drawn against, and a week-by-week ledger of a bankrupt career shows a slow drawdown over more than a season – **not a cliff**. | |
| **R6** | **They are also an artefact of the model of a player.** The 6 / 53 was measured with **every** career forced into the dear place, including the 15 for whom the card already says «Beyond what the family has». Under the dearest-**affordable** rule the count is **2 or fewer**. | |
| **R7** | **Shrinking the dual-match season to the shortcut costs almost nothing measurable.** Cutting 13 weeks to 2 moves the four-year skill gain by **under 0.5 of one skill point** at every tier, because the whole 13-week season is worth 0.06 between cheapest and dearest today. | |

---

## 1a. THE DIAGNOSTIC THAT CAME FIRST

Six careers, `state` tier, walked four years past graduation:

```
fork w281 rank #140 | grad w489 rank – | +1y #138  +2y #67   +3y #130  +4y #110
fork w281 rank #259 | grad w489 rank – | +1y #144  +2y #228  +3y #140  +4y #142
fork w281 rank #143 | grad w489 rank – | +1y #132  +2y #85   +3y #20   +4y #88
fork w281 rank #239 | grad w489 rank – | +1y #140  +2y #159  +3y #154  +4y #128
fork w281 rank #141 | grad w489 rank – | +1y #155  +2y #94   +3y #181  +4y #107
fork w281 rank #251 | grad w489 rank – | +1y #277  +2y #142  +3y #129  +4y #138
```

Six of six come back, all inside one season, and three reach the top 100.

---

## 1b. ⭐⭐⭐ WHY SHE COULD NOT COME BACK: SHE ALWAYS COULD. THE INSTRUMENT STOPPED WALKING.

> «обратной дороги в тур по сути нет – почему, куда она делась… Откуда взялась эта статистика вообще?»

**The statistic came from `tools/college-choice-probe.ts`, and it is an instrument bug rather than an
engine one.** Its column read:

```ts
for (let y = 0; y < YEARS && at.world.ending?.type === 'college'; y++) resumeFromCollege(...)
...
rankAfter: kidLadderRank(at.world, 'wta')
```

The loop exits the moment `finishCollege` clears the college latch – **on the graduation week** – and
nothing after it advances a single week. So `rankAfter` was sampled on **the one week of the entire
career when her 52-week ranking window is empty by construction**: college awards no ranking points,
she has entered nothing for four years, and everything she held has aged out. **That column could only
ever have printed zero.** It is not a measurement of the road back; it is a measurement of the
graduation ceremony.

### 1c. Each of the four candidates, checked rather than assumed

| candidate | verdict |
| --- | --- |
| **Does the career simply END at the fork?** | **No.** `finishCollege` and `endCollegeEarly` both call `leaveCollege`, which moves `untilWeek` back to the current week, and `world.ending` is already `null` – the world ticks straight on. |
| **Does `leaveCollege` exist but never fire?** | **It fires, on both routes.** The full course ends through `finishCollege`; the early exit is «Back on tour now» on the epilogue screen, live from the end of year 1, engine-re-validated in `endCollegeEarly`. |
| **Does she come back with no route, so the ladder refuses her?** | **No, and this was the one worth checking.** W15's floor is `onRampOpen(world, 'wta')` – a **LATCH** (`onRampCleared`), not a rolling window – so the rung she cleared as a junior is still open to her at 23 with no points at all. Its own comment says why: *"the J rungs shut at eighteen on age, so a W15 on-ramp read against a rolling junior window would close on its own a year later with nothing she could do about it."* The rungs above it read an acceptance cut she does not meet, which is correct and is what «starts again from qualifying» means. |
| **Is the horizon over by then?** | **Only the probe's.** She graduates at 23 in week ~489; the retirement question is not final until 38. |

### 1d. ⭐⭐ SO WHAT ACTUALLY HAPPENS – `tools/college-return-probe.ts`, n = 53 per place

| place | ranked ON the graduation week (the old column) | finished the four years | **ranked again within one season** | median weeks to a rank | median rank one year out |
| --- | --- | --- | --- | --- | --- |
| the university at home | 0 / 53 | 53 / 53 | **51 / 53 – 96%** | **3** | **#157** |
| a university out of state | 0 / 53 | 52 / 53 | **51 / 52 – 98%** | **3** | **#157** |
| a private university | 1 / 53 | 47 / 53 | **45 / 47 – 96%** | 4 | **#156** |

**She is back on a ranking list in about three weeks and inside the top 200 within a season**, at
every place. The two or three per place who are not are careers something else ended.

**⚠ Nothing was unblocked, because nothing was blocked.** No engine change was needed for #1 and none
was made: the fix is the instrument, and the old probe's column is now reported beside the real one so
the two can never be confused again.

---

## 2. ⭐⭐ THE ODDS – measured per place, and `Squad 55` is off the card

> «"команда средней силы, стипендия закрыла 72% цены" – это лучше звучит, но еще лучше будет что-то
> вроде "шанс выйти в топ-200"… это измеримо как мне кажется, но может быть я не прав, что думаешь?»

**He is right, and the thing he is right about is that `squad` was not comparable to anything.** 55 /
65 / 75 was ours, on our own 0-100 skill scale, and the card never printed her daughter's number on
that scale – so the only fact `Squad 55` conveyed was that 75 is bigger. A stated chance of reaching a
rank band is a measurement of this build that a player can hold against her own ambition.

### 2a. ⚠⚠ THE RUN, AND THE PROVENANCE HAZARD THAT NEARLY GOT A WRONG NUMBER ONTO THE CARD

`tools/college-return-probe.ts --seeds 6`, at commit **`82eb452`**, `POLICIES[1]`, n = 53 careers
walked to the fork and re-walked once per place: four years enrolled, then **four years back on
tour**, counting every career that touches the band at any week of the return.

⚠ **An earlier run of the same probe survived the `pkill` meant to stop it**, finished against the
**thirteen-week** season, and wrote its output over the same path. For several minutes a complete,
entirely plausible table (42 / 38 / 38) sat in that file describing a tree that no longer existed, and
it was already written into `COLLEGE_TIER_ODDS` before it was caught. The tell was the elapsed-seconds
line changing between two reads of a file that should have been written once. **A measurement is not
identified by its filename** – the authoritative arm is kept as
`return-B-82eb452-AUTHORITATIVE.txt` and the figures below are that file's.

### 2b. What each place is actually worth

| place | **top 100** *(on the card)* | top 200 | top 50 | median best rank | careers ended |
| --- | --- | --- | --- | --- | --- |
| the university at home | **38 / 100** | 96% | 26% | #114 | 0 / 53 |
| a university out of state | **40 / 100** | 96% | 26% | #107 | 1 / 53 |
| a private university | **34 / 100** | 83% | 23% | #112 | 9 / 53 |

**⚠⚠ AND THE HONEST HALF, WHICH THE CARD IS NOT ALLOWED TO HIDE: THE PLACE BARELY MOVES THE ODDS.**
38 / 40 / 34 is flat, and the *middle* place being nominally the best of the three is noise at n = 53,
not a finding. Restrict to the careers the bill did not end and it is flatter still:

| place | survived | top 200 | top 100 | top 50 |
| --- | --- | --- | --- | --- |
| the university at home | 53 | 96% | 38% | 26% |
| a university out of state | 52 | 98% | 40% | 27% |
| a private university | 47 | 94% | **38%** | 26% |

**So the dear place's lower numbers are not a weaker programme – they are six families going bankrupt
paying for it.** That is a true and useful thing for a card to carry, and it is the same finding §3f
of [`the-college-choice-2026-08.md`](the-college-choice-2026-08.md) reached from the other side: **the
tier's currency is money, not her game.**

### 2c. What is on the card, and what would make the three numbers differ

The row now reads `Top 100 for 38 in 100 · A full ride (100%)`, with the window named once under the
list: *«Four years after she leaves, over 53 careers.»* **A share with no span under it is not a
measurement**, which is why the caption is not optional.

**What would make the three genuinely differ is college MATCH RESULTS feeding the ladder** –
`the-college-choice-2026-08.md` §4b item 1, named there and deliberately not built. Today a college
match is a count fed to `growWeek` and nothing else, so a stronger squad can only reach her ranking
through her skill, and §5 measures how little of that there is.

⚠ **The odds cannot go stale quietly.** `COLLEGE_ODDS_MEASURED_AT` pins a fingerprint of every input
they were measured against – the three prices, the three recruiting bars, the three match counts and
the trip weeks – and `tests/college-offer.test.ts` block F recomputes it. Move any of them and a test
goes red naming the probe to re-run. It is mutation-proved in the same block.

⚠ **`squad` itself is NOT deleted.** It no longer reaches any surface, but it is the model's own
statement of why `fullAwardScore` and `matchesPerWeek` climb together, and removing it would leave
those two climbing for no stated reason.

---

## 3. ⭐⭐ WHERE 72% COMES FROM – the plain answer, at the top and not in a footnote

> «мы уже обсуждали стипендию, надо понять что и откуда или это тоже рандомная цифра?»

**First: the three numbers you are quoting no longer exist.** `strong 0.85 / solid 0.55 / small 0.30
±0.10` were the funding bands of the model
[`the-college-choice-2026-08.md`](the-college-choice-2026-08.md) REPLACED on 17.08 – they were shares
assigned by her junior record, laid over a price that was the same at all three. They are gone. What
replaced them is arithmetic the player can watch happen on the card:

```
    the family pays  =  the sticker of the place SHE picked   x  (1 - covered)
    covered          =  min(1, athletic + need)                            <- Bylaw 15.1, sourced
    athletic         =  her junior score / the place's recruiting bar  ± 0.10
    need             =  a taper on the family's own position, 0 for a non-American
```

**72% is one number out of that: `athletic` at the middle place.** Her median junior score is **11**,
the middle place's recruiting bar is **18**, 11/18 = **61%**, the programme's own funding moves it up
or down by up to ten points, and at the median career the need layer pays nothing – so the covered
share lands at **72%** and the family pays the other 28%.

### 3a. Which half of that is sourced and which half is ours

**⚠ The recruiting bar is OURS. It is the number 72% is most sensitive to, and it is an invention with
a measurement under it, not a source.**

| the input | ours or sourced | what stands behind it |
| --- | --- | --- |
| the three stickers $30,990 / $50,920 / $65,470 | **`[S]`** | College Board, Trends 2025, Fig CP-1 |
| an award may not exceed the price | **`[S]`** | NCAA Bylaw 15.1, and the trim falls on the NEED layer (15.1.3) – never on the merit one |
| **most awards are partial** | **`[S]`** | NCAA's own page: *"Most scholarships are partial"* |
| **tennis is an equivalency sport** – the pot is divisible, so a part-share is the normal unit | **`[S]`** | 8 scholarships against an average roster of 9.4; under House, a roster limit of 10 with no cap on the number of awards inside it (16.13.1.5) |
| the in-state price needs residence | **`[S]`** | it IS residence |
| the need layer is shut to a non-American | **`[S]`** | 34 CFR §668.33 |
| max Pell = **23.9%** of the in-state sticker | **`[S]` + `[I]`** | $7,395 in 2025-26 over $30,990 |
| **the recruiting bar 11 / 18 / 23** | **OURS** | the measured median / p75 / p90 of *our own* junior score over 44 careers walked to the fork |
| **the ±0.10 programme spread** | **mechanism `[S]`, size OURS** | since House the constraint on funding a place is a school's BUDGET rather than a bylaw, so two programmes really do offer the same girl different money. Ten points is ours |
| **the need knots ($20,000 / $35,000), the $25,000 shield, the 4-year spread, the 45% ceiling** | **OURS** | set on the game's own measured income distribution. The SHAPE (floor, taper, cut) is the federal one; the dollars cannot be borrowed, because our income axis is what the parents put INTO the tennis and not a household income |
| **the junior score itself** (prestige rung x 5, plus title volume) | **OURS** | measured – the easy rungs saturate at 0 and carry no information, so the score is the J300 finish plus a capped title count |

### 3b. ⚠ The one sourced bound our ladder can be checked against – and it straddles it

There is exactly one published arithmetic for what a women's tennis award is worth, and the research
file tags it `[I]` and `[GAP]` rather than `[S]` because it assumes a programme funds to its limit:
**8 scholarships ÷ 9.4 average roster ≈ 85%** of a full ride at a fully funded programme; **80%**
against the new roster of 10. **What share of programmes fund to their limit is searched-and-not-found.**

Our measured median covered share is **100% / 72% / 65%**. So the middle and dear places sit *below*
that bound and the cheap place sits *above* it – the ladder straddles the only anchor that exists.
**That is a finding rather than a defence**: it says the cheap place funding the median junior
completely is the most generous rung we have, and it is the one worth arguing with first.

### 3c. What evidence would retire the invented half

A **per-sport award distribution** would replace the recruiting bar outright. Items 15 and 16 of
[`college-and-the-junior-exit.md`](../research/college-and-the-junior-exit.md) are explicit that
none exists: no NCAA, ITA or federal per-sport table was found, and the federal EADA disclosure
reports athletically-related aid **by gender, not by sport**. Until one does, 11 / 18 / 23 are the
measured quantiles of our own score and there is nothing better to put there.

---

## 4. THE NAMES

> «"Штатное / национальное / частное" – окей, но надо переформулировать точно.»

They were the College Board's own three column headings – US administrative categories nobody in this
game chose – and «national» in particular reads as a RANK in a game whose every other ladder is one.

| id (persisted, unchanged) | was | **is** | the sourced price it keeps |
| --- | --- | --- | --- |
| `state` | A state programme | **The university at home** | $30,990 a year `[S]` |
| `national` | A national programme | **A university out of state** | $50,920 a year `[S]` |
| `private` | A private programme | **A private university** | $65,470 a year `[S]` |

* **The name says where the place IS**, which is the only thing that separates the three in the
  fiction, and «out of state» is not jargon here – it is the sourced *reason* the second price is
  higher than the first. The row still carries «In-state, and she is not a resident» where residence
  shuts the cheap place.
* **⚠ The ids are untouched.** `CollegeTier` is a persisted save field since v52; renaming it to fix a
  caption would be a schema change. The caption and the save key are now different things in different
  files.
* **⚠ And there is one copy of the names instead of two.** `ForkDialog.vue` and `EndingScreen.vue` each
  carried an identical map, the second with a comment promising it matched the first. Both now import
  `COLLEGE_TIER_NAME` from the engine – the same two-copies shape that produced the «the family stops
  paying» line surviving a wave after the bill landed.

---

## 6. ⭐⭐ THE BANKRUPTCIES – real arithmetic, and an artefact of the model of a player

> «я не верю, что это возможно с твоими ценами выше, доходом родителей 600+ даже на бюджетном тире и
> возможными призовыми на счету перед началом колледжа.»

**Both halves of his instinct are right, and they point in opposite directions.** The arithmetic is
sound – nothing is missing from the ledger – and the headline number is nonetheless an artefact of the
rule the bench used to pick a place.

### 6a. The three things he asked to have checked

| his question | answer | where |
| --- | --- | --- |
| **does family INCOME keep arriving during the four years?** | **YES, every week.** `resolveParentIncome` has no `inCollege` guard – it runs at step 1 of every tick, before costs, and the ledger below shows **$370–$371 arriving in each of 25 consecutive college weeks** | `world.ts` |
| **are savings counted at all?** | **YES.** The bill is a weekly debit against `world.fundsCents`, which IS the savings – the family spends its balance down. The card's `canAfford` counts them too (`income + savings / 4`, no shield: «есть деньги на счете и семья хочет выбрать колледж дороже») | `resolveCollegeBill`, `familyCanPayPerYearCents` |
| **is prize money banked before the fork in that balance?** | **YES.** `fundsCents` is one balance for the whole career; there is no separate purse. The traced career walked in with **$3,161**, which is what that career actually had | the ledger below |

**⚠ Nothing is wrong with the arithmetic and nothing was fixed.** What the ledger shows instead is a
subtraction anyone can check.

### 6b. ⭐⭐ ONE BANKRUPT CAREER, WEEK BY WEEK

`8k · working · budget coach`, seed 4, at **a private university** – `--ledger`:

```
  she enrolled with $3,161 in the bank, at $32,735 a year
    week   parents in    tuition   everything else      balance
  -------------------------------------------------------------
     281       $1,349         $0              $-77       $4,433   <- the fork week
     282         $371      $-630                $0       $4,175
     285         $371      $-630                $0       $3,400
     290         $370      $-630                $0       $2,105
     295         $370      $-630                $0         $806
     298         $370      $-630                $0          $26
     299         $370      $-630                $0        $-234   <- under water, week 18
     305         $370      $-630                $0      $-1,793
  -------------------------------------------------------------
  over 25 weeks: parents in $10,232 · tuition $-15,108 · everything else $-77
```

**Read the third column: `everything else` is $0 in every week but the first.** No coach
(`coachWorksThisWeek` returns false at college), no travel, no entry fees, no gear. **The tuition is
the only outflow there is**, and the whole story is:

> **$370 a week in. $630 a week out. $260 a week down, and $3,161 in the bank – so eighteen weeks.**
> Twelve more weeks below zero and the bankruptcy spell latches.

**⚠ His «доходом родителей 600+» is the middle preset, and this is not that family.** This is the
`working` preset: **$370 a week**, $19,240 a year, against a $65,470 sticker at a place that funded
her half. There is no arithmetic under which that family pays for it – which is precisely what the
card already tells her, on that row, before she picks it: **«Beyond what the family has»**.

### 6c. ⚠⚠ AND THE 6 / 53 IS A MEASUREMENT OF A MODEL OF A PLAYER, NOT OF A PLAYER

The «dearest always» rule forces the private place on **every** career, including the **15 of 53** the
card has already refused to call affordable. Ask the same population under a rule a reader of that
card would actually follow:

| model of a player | careers ended inside the four years | **of which bankruptcy** | reached the top 200 |
| --- | --- | --- | --- |
| cheapest always | 0 / 53 | **0 / 53 – 0%** | 51 / 53 – 96% |
| **dearest AFFORDABLE** | 0 / 53 | **0 / 53 – 0%** | 51 / 53 – 96% |
| dearest always | 6 / 53 | 6 / 53 – 11% | 44 / 53 – 83% |

**Under the only model that reads the card, nobody goes bankrupt.** The 6 / 53 is what happens when
a family ignores the row that says it cannot afford the place – which is a thing the owner's ruling of
16.08 deliberately allows («a family that cannot pay goes into debt, not away»), and which the game
now warns about twice: on the row, and in the drawdown on the Money screen.

**⚠ VERDICT: it is real, it is correctly modelled, and it is not the headline it looked like.** No
lever was pulled. §8 restates the three that exist if he still wants it softer.
