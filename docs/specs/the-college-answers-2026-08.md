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

## 5. ⭐⭐ THE COLLEGE SEASON – shrunk to the shortcut he designed, and here is what each way costs

> «13 недель – это в половину меньше, чем у нас в регулярном сезоне примерно, но может быть мы можем
> еще ужать, не уверен, что столько нужно, но готов услышать аргументы.»
>
> «1-2 национальных выезда в год и перелистывание 1 года за клик» · «родители не будут посещать все
> игры в колледже»

**The second quote is the objection, and it is decisive.** Thirteen weeks at one to three matches a
week is **thirty-nine simulated matches a year** – a playable season, inside the one branch of this
game that exists to be a page-turn. The player of this game is the parent, and the parent is not at
those matches; there is nothing for him to decide in any of the thirteen weeks and no surface that
shows him one. **A second season inside the shortcut is the thing the shortcut exists to skip.**

**So it is shrunk to his own number: `COLLEGE_TRIP_WEEKS = [8, 20]`** – two national trips a year, at
the tier's own 1 / 2 / 3 matches. ⚠ Neither is the national-team week (14): three separate weeks of
tennis in a year read as three beats, and a trip landing on the call-up week would silently be one.

### 5a. ⚠⚠ THE ARMS, AND THE COMMIT EACH WAS BUILT AT

| arm | what it is | commit | provenance check |
| --- | --- | --- | --- |
| **A – the thirteen-week season** | `82eb452` with **`79ef9ce` reverted** (`git revert --no-commit`) in a dedicated worktree `../tb-college-season-A` | `82eb452` − `79ef9ce` | `COLLEGE_MATCH_SEASON` present with its reader in `world/college.ts` |
| **B – the two trips** | `82eb452` | `82eb452` | `COLLEGE_TRIP_WEEKS` present with its reader |

⚠ **The control is MY commit reverted, not the previous commit** – another agent is committing on this
branch and "the head before mine" would measure both waves. **And arm A reproduces the previous
phase's published figures exactly (+1.11 / +1.14 / +1.17, +0.03 / +0.06), which is the strongest
provenance evidence available**: the A tree is demonstrably the tree that measurement came from.
Instrument, population, policy and seeds identical: `tools/college-choice-probe.ts --seeds 6`, n = 53.

### 5b. THE COST OF EACH WAY, MEASURED

| | **A: 13 weeks, 39 matches a year** | **B: 2 trips, 2–6 matches a year** | what the shrink costs |
| --- | --- | --- | --- |
| four-year skill gain, at home | **+1.11** | **+1.08** | −0.03 |
| out of state | **+1.14** | **+1.07** | −0.07 |
| private | **+1.17** | **+1.07** | −0.10 |
| **the tier's development dimension** | **+0.06** cheapest→dearest | **+0.00** (−0.01 / −0.00) | **the dimension, entirely** |

**Everything else is byte-identical** – the same medians for the award, the bill, affordability,
take-up and the six bankruptcies, because none of them reads the season.

### 5c. ⭐⭐ THE CHOICE, PUT PLAINLY

* **Keeping 13 weeks buys +0.06 of one skill point between the cheapest place and the dearest, over
  four years.** That is the entire payoff of the playable season, it was measured at the previous
  phase and reported then as invisible, and it costs 39 unattended matches a year inside a page-turn.
  **I could not write the paragraph arguing for it on the strength of what it buys the player, because
  0.06 of a skill point is not something a player can be shown.**
* **Shrinking costs a tenth of one skill point over four years at the dear place** (and three
  hundredths at the cheap one), and it costs the tier its development dimension outright – so the
  place a player picks now differs in **price and in nothing else that touches her tennis**.
* **⚠ Neither is visible in the odds.** The top-100 column moved by up to six points between two runs
  whose only difference was this constant, on the same seeds – i.e. a 0.03–0.10 skill-point change
  reshuffles *which* careers cross the line without moving the population's capability. **At n = 53
  that column cannot resolve the season length at all**, which is also the reason 38 / 40 / 34 must not
  be read as a ranking of the three places.

**It is one constant to put back.** `COLLEGE_TRIP_WEEKS` in `src/engine/world/college.ts`; restoring
`{ fromSeasonWeek: 4, toSeasonWeek: 17 }` and the range test returns arm A exactly.

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

---

## 7. ⭐⭐ THE PREDICTIONS, JUDGED

| # | prediction | verdict |
| --- | --- | --- |
| **R1** | ≥80% ranked within one season | ✅ **HELD, and by a distance.** 96% / 98% / 96%, at a median of **three weeks**, not one season. |
| **R2** | median rank one year out within 60 places of her rank at the fork | ✅ **held.** #157 / #157 / #156 against a fork population whose diagnostic seeds ran #140–#259. |
| **R3** | the top-200 odds sit inside a 25-point spread, bounded away from 0 and 100 | ⚠ **HALF WRONG, AND THE WRONG HALF MATTERS.** The spread is 13 points (96 / 96 / 83) but **top-200 is not bounded away from 100** – 96% is 51 of 53, a ceiling. So the band that got printed is **top 100**, where the population actually spreads. Predicting the band before measuring it was the error. |
| **R4** | the tier moves the odds through money, and the gap is accounted for by careers that ended | ✅ **HELD, and it is the finding.** Among survivors: 38 / 40 / 38 top-100 and 96 / 98 / 94 top-200. The dear place's deficit is six bankruptcies, not six weaker players. |
| **R5** | the bankruptcies are real arithmetic, a slow drawdown and not a cliff | ✅ **held.** $370 a week in, $630 out, eighteen weeks from $3,161 to zero, everything-else at $0 throughout. §6b. |
| **R6** | under dearest-**affordable** the count is 2 or fewer | ✅ **HELD, at ZERO.** 0 / 53 under both readable models; 6 / 53 only under «dearest always», which forces the place on the 15 careers the card has already refused. |
| **R7** | shrinking the season costs under 0.5 of a skill point at every tier | ✅ **held by a factor of five.** −0.03 / −0.07 / −0.10. ⚠ But it costs the tier's development dimension **entirely** (+0.06 → +0.00), which the prediction did not name and which is the part he has to rule on. |

---

## 8. WHAT IS THE OWNER'S TO DECIDE

1. **⭐ The season length.** Shipped at two trips (§5). One constant returns the thirteen weeks; the
   measured price of each way is in §5b and I could not make the argument for keeping it.
2. **The three places now differ in PRICE and in nothing else that reaches her tennis.** That is the
   consequence of #1 plus the 0.06 finding it inherited. If the tier should be legible through her
   game, the build that does it is **college match RESULTS** feeding the ladder – named in
   `the-college-choice-2026-08.md` §4b, still not built, and the honest cost of calibrating `squad`.
3. **The cheap place funds the median junior COMPLETELY** (100% covered, 29 of 53 full rides), and the
   only sourced arithmetic that exists bounds a fully funded programme's mean award at **80–85%** of a
   full ride. The state tier is the rung most worth arguing with, and `fullAwardScore: 11` is the
   number to move. §3b.
4. **The bankruptcies stay.** 0 of 53 under any model that reads the card; 6 of 53 only when a family
   takes a place the row already told it it cannot afford. The three levers from the previous spec are
   unpulled and unchanged.

---

## 10. ⭐⭐⭐ THE OWNER PUT THE DEVELOPMENT DIMENSION BACK, AND NOT THROUGH THE MATCHES (17.08, later)

> «"развитие как отличие тиров обнулилось совсем (+0.06 → +0.00). Возвращается одной константой, если
> захотите." – да, **она училась и работала**, мы точно знаем на сколько за каждый год в колледже надо
> прибавить, мне кажется это вполне нормально.»

**He ruled on §8 item 1 and the answer is: restore it.** ⚠ **But not by putting the matches back.** He
killed the thirteen-week season on a lore argument he was right about, and rebuilding the gain out of
match count would smuggle it back through the side door and make its size hostage to a trip count he
has already ruled on. **The gain comes from the PROGRAMME'S COACHING instead** – a university squad has
coaches, a training week and a strength programme, that happens whether anybody is in the stands, it is
what «училась и работала» actually describes, and it makes the dimension **independent of the
calendar**, so a future change to the trips cannot silently zero it again.

### 10a. ⚠⚠ THE SHAPE, AND WHY IT INVENTS NO MAGNITUDES

`growWeek`'s rate already carries `coachFactor(tierOf(coach), fit)`, and at college `coach` is `null`,
so for 208 weeks she developed at **`self` = 0.82** – the parent-on-the-court rate, for a girl who is
not with her parent and is at a university. **That is the actual defect**, and it is older than the
season this phase shrank.

So each place now names **a rung of the coach ladder the game already has**:

| place | coaches her at | the factor that rung is worth | ours or the game's |
| --- | --- | --- | --- |
| the university at home | **`budget`** | 0.95 | the ASSIGNMENT is ours; **the number is `ECONOMY.coach.developmentFactor`'s own** |
| a university out of state | **`middle`** | 1.04 | same |
| a private university | **`high`** | 1.11 | same |
| *(what she had before)* | *`self`* | *0.82* | – |

* **⚠ No new magnitude is invented.** The three are existing, tuned rungs, referenced by NAME rather
  than copied as numbers – so a future re-tune of the coach ladder moves the college places with it and
  the two can never drift.
* **⚠ THE TOP RUNG IS DELIBERATELY NOT REACHED.** `elite` (1.15) stays something only money on tour
  buys; a university programme is not better than the best coach in the world.
* **⚠ AND THE FAMILY IS STILL NOT BILLED FOR ANY OF IT.** `coachWorksThisWeek` is unchanged and still
  false at college – its own comment says one clause moves the bill and the rate together, so the rate
  is moved by a SEPARATE, explicitly-optional argument that no billing code reads.

⚠⚠ **«МЫ ТОЧНО ЗНАЕМ НА СКОЛЬКО» – WE DO NOT, AND THIS SPEC WILL NOT PRETEND WE DO.** What exists is
P5's measurement that four college years cost ~90% of what a coached year develops, and this phase's
own −0.03 / −0.07 / −0.10 from shrinking the season. **The SHAPE is defensible** – a programme coaches
her, a dearer programme coaches her better, and the ladder it is expressed on is the game's own.
**The ASSIGNMENT of budget / middle / high to the three places is OURS**, labelled ours in
`COLLEGE_TIERS` in exactly the words the recruiting bars carry, and §10d says what would replace it.

### 10b. ⭐⭐ PREDICTIONS – WRITTEN BEFORE EITHER ARM WAS BUILT

| # | prediction | verdict |
| --- | --- | --- |
| **D1** | **The dimension comes back and is bigger than the season ever made it.** The four-year skill gain climbs monotonically with the place and the cheapest→dearest spread is **at least 0.15 of one skill point** – against +0.00 today and +0.06 under the thirteen-week season. | |
| **D2** | **Even the cheap place develops her more than today**, because 0.95 > 0.82: its four-year gain beats the current +1.08. | |
| **D3** | **The dear place stops being a loss against a coached year.** Measured against the `middle` rung (1.04) as "a coached year", the three land at roughly **91% / 100% / 107%** of it. | |
| **D4** | ⚠⚠ **THE STALENESS FINGERPRINT DOES NOT TRIP, AND THAT IS A DEFECT I EXPECT TO FIND.** It lists three named fields; a NEW field is invisible to it. **If it stays green when a place's coaching moves, the test is not doing its job** and the fix is to fingerprint the whole tier object rather than three of its properties. | |
| **D5** | **Nothing else moves.** The award, the bill, affordability, take-up and the six bankruptcies do not read development, so every one of those columns is unchanged between the arms. | |
| **D6** | **The frozen MAIN capture does not move.** The override is a multiplier on a rate; it draws nothing. | |
| **D7** | **The odds on the card move by more than the underlying change justifies.** §5c measured the top-100 column shifting up to six points on a 0.03–0.10 skill-point change, so a change several times larger will move it – and the direction may still not be monotone at n = 53. | |

### 10c. ⚠⚠ THE ARMS, AND THE COMMIT EACH WAS BUILT AT

| arm | what it is | built at | provenance check |
| --- | --- | --- | --- |
| **A** – nobody coaches her | `3b6d92e` with **`3b6d92e` reverted** (`git revert --no-commit`) in `../tb-dev-A` | `3b6d92e` | `git grep coachFactorOverride -- src/` returns **0** in `development.ts` and **0** in `world.ts`, and `coachesAt` **0** in `collegeOffer.ts` – the change and its reader are both absent |
| **B** – the programme coaches her | `3b6d92e` in `../tb-dev-B` | `3b6d92e` | the override present in **both** the definition and its call site, `coachesAt` present 8 times – the reader is there |

⚠⚠ **BOTH ARMS ARE IN WORKTREES AT MY OWN COMMIT, AND THAT IS NOT PEDANTRY THIS TIME.** Another agent
is re-dealing the whole field's skill on this branch, and it shows in the population: the skill mean at
the fork reads **58.71 over 54 careers** here against **58.59 over 53** three hours ago. **So no number
in this section is comparable with §5b's**, and the A/B delta is the only thing that is – which is
exactly what a paired arm at one commit buys.

### 10d. ⭐⭐ MEASURED – the dimension is back, and it is bigger than the season ever made it

`tools/college-choice-probe.ts --seeds 6`, n = 54, `POLICIES[1]`, identical seeds both sides.

| place | **A** – `self`, 0.82 | **B** – the programme | what the coaching buys | **vs the cheap place** |
| --- | --- | --- | --- | --- |
| the university at home | +1.07 | **+1.21** | +0.14 | – |
| a university out of state | +1.06 | **+1.30** | +0.24 | **+0.09** |
| a private university | +1.07 | **+1.37** | +0.30 | **+0.16** |

**The cheapest→dearest spread goes +0.00 → +0.16 of one skill point** – nearly three times what the
thirteen-week dual-match season ever produced (+0.06), on a term that no calendar decision can reach.

⚠⚠ **AND THE PROOF THAT NOTHING ELSE MOVED IS A DIFF, NOT AN ASSURANCE.** `diff` of the two arms'
whole output is **three lines long** – the three skill rows above. The award, the covered share, the
family's bill, affordability, the take-up models, the quote-against-ledger check, the walk-on count and
**all six bankruptcies** are byte-identical, because none of them reads development.

### 10e. In his own frame – what a year at each place costs her against a coached year

The middle place **is** a coached year by construction (`coachesAt: 'middle'`, the same rung a hired
middle coach sits on), so this is a paired ratio inside one run rather than a comparison across two:

| place | four-year gain | **against a coached year** |
| --- | --- | --- |
| the university at home | +1.21 | **93%** |
| a university out of state | +1.30 | **100%** |
| a private university | +1.37 | **105%** |

**So «на сколько за каждый год в колледже надо прибавить» now has an answer with a shape:** the cheap
place costs her about 7% of a coached year, the middle place costs her nothing, and the dear place is
slightly better than hiring a middle coach would have been. ⚠ **Those three percentages are a
consequence of the budget / middle / high assignment, not evidence for it** – they are what we chose,
read back. §10a says so and §10g says what would replace it.

### 10f. THE PREDICTIONS, JUDGED

| # | prediction | verdict |
| --- | --- | --- |
| **D1** | spread ≥ 0.15 of one skill point | ✅ **held, at +0.16** – and only just, which is the honest way to report a threshold I set myself |
| **D2** | even the cheap place beats today's gain | ✅ **held** – +1.21 against the same arm's +1.07 |
| **D3** | roughly 91% / 100% / 107% of a coached year | ✅ **held** – measured **93% / 100% / 105%**, within two points at both ends |
| **D4** | ⚠⚠ the staleness fingerprint does NOT trip, and that is a defect | ✅ **HELD, AND IT WAS EXACTLY THAT.** Moving `private` from `high` to `elite` – a large change to what four years there develop – left block F **green**. It listed three named fields, so a field that did not exist when it was written was invisible to it. **Fixed**: it folds the whole tier object now, keys sorted, and the mutation case asserts every property of every place is inside the fold. It went red on this very change, naming the probe to re-run |
| **D5** | nothing else moves | ✅ **held, provably** – the arms' full outputs differ by three lines |
| **D6** | the frozen MAIN capture does not move | ✅ **held – no re-pin.** The override is a multiplier; it draws nothing |
| **D7** | the odds move by more than the change justifies, and may not be monotone | *§10h* |

### 10g. What would replace the assignment

**Nothing published rates a university programme against a private coach**, and nothing will – it is
the same `[GAP]` `squad` sits in. The honest replacement is not a source but a **calibration**: play
the three places against our own cohort and set each one where its players actually land. That needs
college MATCH RESULTS, which is the same build §8 item 2 already names, and it is the honest cost of
the decision. ⚠ **Until then budget / middle / high is a judgement**, and the owner's «мы точно знаем
на сколько» describes a confidence the evidence does not carry.

⚠ **The card says none of this, and that is a phone constraint rather than a choice.** `.fork-answers`
measures **530.5px against the 536px** a 320x568 screen holds, so there is no room for a fourth line on
a row. The dimension reaches the player through the odds figure it moves, and §10h is that figure.

---

## 9. THE GATE

Run **serialised** – this machine wedges the vitest pool, and a parallel run times out with zero
assertion failures (CLAUDE.md). Exit codes read from each command, never through a pipe.

| step | result |
| --- | --- |
| `npm run context:audit` | **0** |
| `npx vue-tsc -b --force` | **0** (re-run after the comment-only `.vue` edits – **0** again) |
| `npx vitest run --project unit --no-file-parallelism` | **0** – **147 files passed** |
| `npx vitest run --project component` | **0** – **42 files passed** (re-run after the `.vue` edits – **0**) |
| `npx vite build` | **0** |

⚠ **`npm run e2e:fixtures` and `npm run test:e2e` were NOT run** – they belong to another agent on
this branch and this phase was instructed not to touch them.

⚠ **No schema change and no migration.** `COLLEGE_TIER_ODDS`, `COLLEGE_ODDS_MEASURED_AT`,
`COLLEGE_TIER_NAME` and `COLLEGE_TRIP_WEEKS` are constants; nothing new is persisted, `CollegeTier`
and `CollegeOffer` are untouched, and `SAVE_SCHEMA_VERSION` stays at 52.

⚠ **The frozen MAIN capture is not re-pinned.** `collegeMatchesThisWeek` is arithmetic on a persisted
offer and draws nothing; the season shrink removes draws from no stream because it never made any.

### 9a. The commits, in order

| commit | what |
| --- | --- |
| `f663540` | `tools/college-return-probe.ts` – the instrument that walks past graduation |
| `79ef9ce` | **#5** – the thirteen-week season becomes two trips (the constant arm A reverts) |
| `f09991f` | **#4** – the three names, in one copy instead of two |
| `daaa677` | **#2** – the measured odds replace `Squad 55`, with the staleness fingerprint |
| `cc574f1` | **#5** – the shrink's guard, after the first version of it proved vacuous |

⚠ **Every commit is pathspec-form.** Another agent is committing a skill/win-probability audit on this
same branch and `git commit` takes the whole index.
