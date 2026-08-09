---
type: spec
status: current
area: triage
canonical: false
last-reviewed: 2026-08-09
---

# Round 15 – nineteen items, triaged against two saves and a 200-career bench

The owner's playtest list of 09.08, with `tennis-sim_ines-xgv7_w208.tsave` (25k, middle coach, week
208) and `tennis-sim_olivia-o1p7_w104.tsave` (8k, self-coached, week 104) attached. Everything below
that claims a number was measured before any work was dispatched:

* the two saves, read through the game's own import door (`tools/round15-read.ts`);
* a 2x2 bench modelled on their SETTINGS – background x coach, 50 careers each, four seasons
  (`tools/two-cells.ts`). Nothing is copied out of a save and no fixture is derived from one.

⚠ The saves are his own careers. Read locally, **never committed**, never a fixture.

## The headline: the coach is a net negative, measured, at both backgrounds

He asked (item 2) whether the balance had slipped – «по ощущениям за 8к проще играть, чем за 25к».
It has, and the cause is not the background. It is the coach.

`tools/two-cells.ts`, 50 careers per cell, `player` policy, four seasons, medians:

| | self-coached | middle coach | what the coach buys |
|---|---|---|---|
| **8k / working** | **$19,522** · prize 33/50 · ITF #48 · 101 entries | $5,453 · prize 10/50 · ITF #56 · 85 entries | **-$14,069, -23 prize careers, -8 places** |
| **25k / middle** | **$22,712** · prize 42/50 · ITF #44 · 101 entries | $5,998 · prize 22/50 · ITF #57 · 97 entries | **-$16,714, -20 prize careers, -13 places** |

**Hiring a coach makes the career worse on every axis that is measured, at both backgrounds.** Not
merely costlier – worse ranked, less prize money, and two to three times fewer careers that earn a
single cent. The 8k coached cell is the only one of the four that ever goes bankrupt (1/50).

Titles go the other way (14 → 19 and 13 → 18), and that is the trap: the extra titles are Regional
and J30 – `best tier ever won` shifts from `w15=16 w50=9 w75=5` (self-coached 25k) to
`regional=11 j30=9` (coached 25k). **He buys her more trophies at rungs that pay nothing, and the
money that bought them was the entry money for the rungs that pay.**

The mechanism is entries: 101 → 85 at 8k. Every dollar of retainer is a dollar not spent on a draw,
and fewer draws is fewer results is a worse ranking. The skill the coach buys does not repay it
inside four seasons.

⚠ WHAT THIS DOES AND DOES NOT SAY. The bench hires at week 0, never upgrades, and **never takes his
advice** – there is no entry veto on these arms. So this measures the coach as
`what-a-coach-is-for.md` admits he currently is: **a growth multiplier and a bill.** Pillars 2–4
(load, the opponent, the person) are what would make him pay, and they are unbuilt. The finding is
not "the coach is a bad idea"; it is **"the coach as shipped has a negative expected value, and the
spec's own §4 'what is still open' is the reason".** That spec's §1 measured his fade honestly and
never asked whether the level was positive.

⚠ AND ONE ARM IS MISSING, deliberately: the owner's own tactic. `human-arm-forward-2026-08.md`
already measured that on the coached tree (+$723/season, and the tennis stopped). Whether a
scheduling-literate parent flips the sign is the one open question this table cannot answer, and it
needs `coachEntryLine` wired as a veto on both cells.

## The second headline: the 8k family holds a subsidy the 25k family cannot have

`ECONOMY.sponsor`: **6% a week, $500–$1,500, `eligible: ['working']`**. Over four seasons that is a
median of **$12,866 – 22.6% of the parent income – fired for 50/50 careers**, against **$0 for
`middle`, 0/50**.

Parent income is $245/wk (working) against $425/wk (middle): a 1.73x gap on paper. The cameo closes
it to 1.39x – **it silently repays 44% of the difference between the two difficulty settings**, with
no cause, no relationship and no player agency. One hit is two to six weeks of an 8k family's income
arriving because a die came up.

That is item 16 (it paid Olivia in week 2, before a ball was struck) and half of item 2. It is not a
bug – it is a mechanic doing exactly what it was written to do, and the owner is right that its shape
is wrong.

## The third headline: two age clocks, and only one of them is hers

Item 1, and it is systematic rather than cosmetic. `engine/world/age.ts` deliberately keeps two
functions – `ageAtWeek` (THE BAND, birth-month-free, because `coachById` derives the roster from it)
and `kidAgeExact` (THE GIRL, off the real calendar). Both are right. **What is wrong is which one
every surface reads.**

Measured on his own save (born 21 December):

```
season 0 (2031) w0:   band 14 · girl 13   birthday week 49 (Dec 2031)
season 1 (2032) w52:  band 15 · girl 14   birthday week 102
season 2 (2033) w104: band 16 · girl 15   birthday week 154
season 3 (2034) w156: band 17 · girl 16   birthday week 206
season 4 (2035) w208: band 18 · girl 17   birthday week 258
```

**The band and the girl disagree by a full year for the entire career**, and the disagreement is
worst for exactly the birthday the onboarding invited him to pick. `growWeek` reads the girl
(`world.ts:2688`, and its comment says so). **Everything else reads the band**:
`entryCaps.ts:45/74`, `medical.ts:279`, `ladder.ts:441`, `mandatory.ts:93/217`, and
`snapshot`'s `ageYears` – which is what Home, Kid, Stats, Money and Season all print.

Three consequences, all of them his sightings:

1. She is **14 on screen at week 0** when a December girl is 13.
2. The Home screen says **16 from week 104**; the birthday note says **"She is sixteen this week"**
   fifty weeks later, at week 154. Two numbers, both from the engine, a year out of step.
3. **Item 19a is the same defect.** Olivia (born 15 March) is offered and enters **W15 at week 104**,
   band 16 / girl 15.83 – `TIERS.w15.minAgeYears = 16` is being asked of the band. The pro AER
   allowance has the same shape: `annualProEntryLimit(ageAtWeek(week))`, and `proPerYearByAge` has
   **no row for 15** precisely because economy.ts's own comment argues "the age gate refuses first".
   It does not, for a girl born after June.

## Everything else, by group

### Group A – the two age clocks *(1, 19a)*
Above. One decision decides the whole group and it is the owner's (Q1 below): does eligibility
follow the BAND (tennis's calendar-year rule, and the coach roster's requirement) or the GIRL?

### Group B – the money model *(2, 16, 5, 8, 4)*
* **The cameo** (16): shape, size and eligibility all need a ruling. Q2.
* **Contract length is nowhere on screen** (5). `Offer.untilWeek` and `terms.seasons` both exist and
  are persisted – Ines's global deal runs `from w102 until w257`, three seasons – and no surface
  prints either. Pure surfacing.
* **The kit quota** (8). He diagnosed this himself and he is right: the allowance is a per-season pot
  (`kitAllowanceCents`, $2,000 local / $5,000 global), `kit.ts:177` computes what is left, the
  purchase dialog quotes it – and **the Bills page never shows the remaining balance**, so kit that
  was free last week is charged this week with no warning and the "free" badges vanish. The price
  difference he noticed is the same fact: Bills prints the sticker, the till charges the remainder.
* **Academy support is invisible** (part of 2). It pays as a discount on travel, never as a line:
  the bench folds **$948 of `academy` income over four seasons** while the scholarship is held by
  50/50 careers. This is backlog #90 and it is now measured.
* **Wins and titles** (4). Both saves and the bench agree the count is high: Ines has **15 titles and
  8 lost finals by 17**, the bench median is 13–19 over four seasons. But the shape is the tell –
  Ines's career prize is **$81,510** while Olivia's is **$0 after two seasons and ten titles**,
  because every title she has is at a rung that pays nothing. The number to fix is not the titles;
  it is that the junior ladder is a trophy cabinet with no cash register. Q3.

### Group C – the calendar *(3, 6)*
* **W100 and WTA 125 are on a 13-week cadence** (`everyNWeeks`), so 4 events a season each, against
  W15's 25 and W35's 16. The ladder's cadence runs 2 / 3 / 4 / 6 / **13 / 13** for W15..125 – the
  jump from 6 to 13 is exactly where he outgrew W75 and found nothing above it. Both saves show the
  same four-a-season supply.
* **The remaining-events counter is still not on the W cards** (3). Filed in round 14 group A,
  shipped as the ladder floor without the counter; the events stop appearing after week 28 with no
  sentence explaining why. This is backlog #91's other half.

### Group D – surfaces that print the wrong thing *(11, 12, 13, 15, 7, 10, 17, 18)*
* **Season-by-season is one table under three tabs** (11). `StatsScreen.vue:98` folds
  `seasonHistory.endRank`, and `SeasonHistoryEntry` carries **one** rank and **one** points figure –
  the ITF fold. The tabs cannot differ because the record has nothing else in it. **This needs a
  schema change**, not a UI fix: per-track rank and points at the wrap. Round 14 group E, never
  started.
* **Opponent ages** (12) – still unbuilt, round 14 group E.
* **"Training week" over a tournament week** (13). `weekAhead.ts` reads `snapshot.arrival`, and
  `arrivalPreview` returns null unless the entered event is still in `world.season` – which
  `world.ts:791` filters to `e.week >= world.week` on every tick. A repro is needed before a fix;
  the symptom (condition 100 → 34, no tournament screen) says the week resolved as a tournament while
  the button called it training.
* **The dashed line on the radar** (15) is the CEILING edge – where the coach believes her potential
  is – deliberately faint and dashed against the solid contour of what he has actually seen. The
  drawing is right; **there is no legend anywhere that says so.**
* **"He" for every coach** (7). `buildCoachRoster` draws from `COACH_FIRST_M` or `COACH_FIRST_F` by
  `slot.gender`, so women are on the list by construction; the copy is written male throughout. His
  own fix is the right one: drop the pronoun, join the two sentences with a dash.
* **"one match short"** (10) reads as praise for a lost final. Copy.
* **"Club courts – 5 h", every week, forever** (17). `facilityFlavor` is
  `FACILITY_VENUE[background][coachStep]` plus the plan's hours – both constant for a self-coached
  8k family, so the string is deterministic for the whole career on the game's most-read line.
* **"Coach says:" with no coach** (18). `coachSays(e)` reads `e.preview` alone and never asks whether
  anybody is hired, so a family paying nothing gets professional draw analysis for free. It is also
  the answer to «чем этот вариант отличается» – **nothing is withheld from the self-coached family**,
  which is the same finding as the headline from the other side.

### Group E – needs a repro before it is a defect *(9, 19b)*
* **W wins then J trouble** (9) has a plausible mechanism and no measurement yet:
  `entrantPctBand[1]` is the quality ceiling on a field, and it is **0.6 for J30, 0.25 for J300**
  against **0.72 for W15**. A J300 draw is the top quarter of the junior world; a W15 draw is the top
  72% of the professional pool. Winning W15s while losing J300s may be the model being right. Needs
  a probe, not a fix.
* **An exam week at season-week 33** (19b). `ECONOMY.availability.examWeeks = [[23, 24]]` – one
  fortnight, and 33 is not in it. Either a surface is labelling the wrong week or `schoolEndsWeek` is
  reaching a screen that does not use it. Repro first.

### Group F – answered here, no work needed *(14)*
**Vacations do not pause kit wear, and he is right that they should.** Wear is
`week - sinceWeek` (`kit.ts`) and `weeksSinceGear` – pure elapsed calendar weeks, so a fortnight
camping wears her shoes exactly as hard as a fortnight of doubles. One concept, one place: wear
should count weeks she trained or played. It is a real change to the model, not a bug fix, so it
needs the owner's word (Q5).

## What the round-audit found (backlog #88)

The ledger in `docs/rounds/` **stopped being maintained after round 11**, and the open boxes are
mostly lies in the safe direction:

| round | open boxes | genuinely open |
|---|---|---|
| 3 (QA) | 7 | radar shipped, weather (#67) and the prologue (#71) still open |
| 5 | 7 | equipment wear, academy invitation and the scholarship event **all shipped** – boxes never ticked |
| 7 | 1 | per-day calendar screens – still deferred, correctly |
| 8 | 5 | R8-10 shipped as `split-the-bill` (06.08); R8-7b shipped as the ladder floor (08.08); **R8-1 (in-tournament player card) and R8-3 (avatar `norm` variant) are genuinely untouched since 25.07** |
| 12 | 13 | **12 of 17 tags appear in the source**; only R12-17b (the 8k losing streak) has no trace anywhere |

Rounds 14 and 15 have no file in `docs/rounds/` at all – round 14 went to `docs/specs/round14-triage.md`
and this document continues that. **The index and the checkboxes should be retired rather than
repaired**: the specs and `git log` are the record the README itself already names as authoritative.

Still genuinely open and old: **R8-1**, **R8-3**, round-14 groups **C** (cancel a vacation, the mail
client, onboarding width) and **E** (opponent ages, per-track season history), and the art
(`w75-hard`, `wta250` trophy, `wta250-clay`).

## The owner's rulings, 09.08 – all five answered

**1. ONE CLOCK, AND IT IS HERS.** «Есть год рождения и дата. Это всё. Если она родилась в середине
декабря и пошла на теннис, то на начало игры ей всё ещё 13, кстати, так же, как и всем остальным,
кто родился НЕ на 1й неделе января. Дальше когда ДР – тогда и +1 год.»

So `kidAgeExact` is her age everywhere a surface prints one and everywhere a rule asks how old she
is: the printed age, the eligibility gates (`isTierAgeOpen`), the AER allowances, the medical gate,
the academy band. `ageAtWeek` does not disappear – **it stops being an age and becomes what it always
was, a BAND** – and keeps exactly one job: `coachById(seed, ageAtWeek(week), coachId)`, where it is
the market's restocking clock rather than her birthday. That is the split age.ts's own header already
argued for; what was wrong was that nineteen call sites read the band as if it were her.

⚠ TWO CONSEQUENCES THAT ARE THE RULING WORKING, NOT REGRESSIONS. A December girl becomes W15-eligible
eleven months later than a January girl – and keeps eleven months more junior eligibility at the
other end. That is the relative age effect in its primary form, which is the thing this game set out
to model. And `ECONOMY.entryCap.proPerYearByAge` must grow its 14/15 rows: economy.ts's note argues
they are unreachable because "the age gate refuses first", and under the band that was false for
every girl born after June.

**2. THE RUNGS EXIST AND THE FLOOR IS MISSING.** «У нас 3 тира этих спонсоров, а мне достается только
1 самый первый… у нее кончился контракт, а нового не дали.»

Measured through the engine's own predicates on his two saves:

```
olivia w104   standing {national #67, itf #4, wta unranked}
              local  –        national CLEARS   global CLEARS
              rungFor: global      window ladder: global -> national
              offer chance: 0.7 per letter      season spoken for: NO
ines   w208   standing {national #90, itf #23, wta #184}
              local CLEARS   national CLEARS   tour CLEARS
              rungFor: tour        window ladder: tour -> national -> local
```

The ladder climbs (Ines went `local` -> `global` between seasons 0 and 1), so the mechanic is not
stuck at rung one. **What failed is the floor.** Olivia is ITF **#4** – she clears `global` – and her
window carried exactly TWO letters at 70% each, because **`local` REFUSES her**: its gate is
`nationalRank <= 30` and she has slid to #67 domestically by playing abroad. Both dice missed (~9%)
and she opened season 2 with no deal at all.

⚠ AND THE GATE IS INVERTED, WHICH IS THE REAL DEFECT. The better she gets internationally, the more
certainly the shop in her home town refuses her – because the only evidence it will look at is a
domestic ranking she stops defending the moment she leaves. This is the SAME error `ECONOMY.sponsorship`
was rebuilt to fix on 30.07 (a local sponsorship gated on a table she does not hold), with the two
tables swapped. `standingClears`'s local arm already carries `|| standing.wtaRanked` as an escape;
it needs the junior one too, and then the ladder's own promise – «у нее есть спонсоры в том или ином
виде на протяжении всей карьеры» – is true by construction rather than by dice.

**3. JUNIOR TITLES PAY NOTHING – AND THAT WAS NOT THE QUESTION.** «Нет, как в жизни. Я имел в виду,
что самокоуч, по сути, ничем в данный момент не отличается от коуча, кроме того, что ничего не стоит –
вся программа тренировок как была автоматической, так и осталась, мы обсуждали ручки что и в какие
дни тренировать, чтобы игрок имел весь контроль и все последствия.»

**This supersedes the question and it answers #4 as well.** The coach cannot be better than
self-coaching at a thing neither of them does. `world.plan` is one train/rest split and the week
resolves itself; there is no training decision in the game for a coach to be good at. So the order
is: **build the per-day training controls first**, and the coach becomes the person who works them –
his rung deciding how good the plan he proposes is, and self-coaching meaning a blank sheet and the
consequences.

**4. THE COACH DOES NOT GET CHEAPER, HE GETS A JOB.** Same ruling as 3. «Есть мир, там есть тренеры,
они стоят денег и не просто так, вот нам надо как-то показать почему они столько стоят.» The price
stays; what has to change is that something is bought with it. The 2x2 above is the measurement of
what happens while nothing is: at today's prices a family that hires ends four seasons **poorer AND
with a lower-ranked daughter** than one that does not.

**5. A VACATION PAUSES WEAR. AN INJURY IS OPEN.** «Ну да, занятий же нет, по-моему логично… С другой
стороны травмы бывают долгими и рехаб может быть с вещами, я бы тут еще подумал.»

Vacation weeks stop the wear clock. The injury half stays unruled, and the honest shape for it is
probably not binary: a layoff stops racquet and string wear (she is not hitting) and does not stop
shoe wear (rehab is on her feet). Left open.

## The five questions *(answered above, kept for the record)*

1. **Which clock is hers?** Eligibility, the AER allowance and every printed age read the BAND today;
   only development reads the girl. Tennis really does band by year of birth, so the band is
   defensible – but then a December girl must not be told she is 14 when she is 13, and the birthday
   note must not contradict the header for fifty weeks. The alternative is that the GIRL gates
   everything and the coach roster gets its own band input.
2. **What is the local sponsor for?** It is 22.6% of a working family's income, invisible, and
   unavailable to everyone else. Options: keep it and make it legible; gate it on need (a floor on
   funds) rather than on background; convert it to a result bonus; or make an equivalent exist for
   `middle` so the backgrounds differ in size rather than in kind.
3. **Should junior titles pay anything?** Ten titles and $0 is the honest tour. It is also the reason
   the self-coached 8k career is the strongest cell on the board – nothing she wins can be spent, so
   nothing she is denied can be missed.
4. **Does the coach get his pillars, or does he get cheaper?** The measurement says his current level
   is negative. Either pillars 2–4 get built so the price buys something, or the price comes down to
   what a growth multiplier is worth.
5. **Do vacations pause kit wear?** And if they do, does an injury layoff pause it too?
