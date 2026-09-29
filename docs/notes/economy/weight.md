---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The weight block

The comment essays that stood above the `weight` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `weight.lossPerWeekByAge`

```ts
    /** ⭐⭐⭐ **THE WEEKLY LOSS HAZARD, BY AGE** – per-week rates that integrate to the research's
     *  J-curve over the window the research itself defines. DRAFTED; T6's bench confirms the
     *  integral, and his word finalises.
     *
     *  ⚠⚠ THE TOTALS ARE THE PRIMARY SOURCE'S, QUOTED AS THE NUMERATORS THEY ARE rather than
     *  transcribed into decimals with their provenance thrown away (`motherhood.perWeekByAge`'s own
     *  20.09 lesson): Magnus MC et al., BMJ 2019, **421,201 Norwegian pregnancies** – **9.8%** at
     *  25–29, **10.8%** at 30–34, **16.7%** at 35–39. Our window is 24–38, so it sits across the
     *  FLOOR and the CLIMB, and a flat rate would be wrong at both ends.
     *
     *  ⚠⚠ **THE INTEGRAL RUNS OVER 14 WEEKS AND NOT OVER THE 39-WEEK TERM, AND THAT IS THE
     *  RESEARCH'S OWN DENOMINATOR RATHER THAN THIS BUILDER'S CHOICE.** The study counts RECOGNISED
     *  pregnancies, «fetal death before 20 gestational weeks … identified between 6 and 20 weeks»;
     *  gestational weeks are counted from the last period, about two ahead of conception, so the
     *  study's own window is conception weeks 4 to 18. `lossFromWeek` and `lossUntilWeek` below are
     *  that window, and these rates are `1 - (1 - total)^(1/14)`.
     *  ⚠ SPREADING THE SAME TOTAL OVER ALL 39 WEEKS WOULD SHIP A DIFFERENT EVENT, which is the
     *  reason this is a deviation worth the paragraph: a loss drawn at week 36 is two weeks from the
     *  due date, is clinically a stillbirth rather than a miscarriage, and is far heavier content
     *  than the design asked for. The plan drafts «integrating to the J-curve over the term» and
     *  leaves the term's meaning to the builder; this is the reading that ships the modelled event.
     *
     *  ⚠ READ AS RUNGS, `motherhood.perWeekByAge`'s own law: the LAST rung whose `fromAge` she has
     *  reached wins, and an age under the first rung takes 0. ASCENDING AND APPEND-ONLY-IN-SPIRIT –
     *  the read depends on the order, and `tests/wave11-loss.test.ts` §A pins that it is sorted.
     *  ⚠ 24 TAKES THE 25–29 RATE because the study's floor band is the lowest it publishes inside
     *  our window, and a 24-year-old is not a lower-risk animal than a 25-year-old – the band below
     *  it (20–24, 11.3%) is HIGHER, so borrowing the floor is the conservative read rather than a
     *  flattering one. ⚠ NO RUNG ABOVE 35: the game's window closes at 38 and the study's 35–39 band
     *  covers all of it; 40–44's 32.2% is a cliff no career here can reach. */
```

## `weight.lossCooldownWeeks`

```ts
    /** ⭐⭐ HOW SOON AFTER A LOSS THE PREGNANCY HAZARD MAY FIRE AGAIN – DRAFTED 26, against the
     *  BIRTH's 52 (`motherhood.repeatCooldownWeeks`). The spec's §3: «a loss re-arms the pregnancy
     *  hazard behind a gentler cooldown, reading the same eligibility machinery wave 9 built».
     *
     *  ⚠ GENTLER FOR A MECHANICAL REASON AND NOT A KIND ONE, which is worth writing down because the
     *  kind reason would be the wrong kind of reason to put in a constant: the birth's 52 protects
     *  the COMEBACK – `world.comeback` holds a freeze she is in the middle of spending, and a second
     *  pregnancy overwrites that record. A loss creates no comeback and no freeze, so there is
     *  nothing to protect and the only thing the number is for is that the same week should not
     *  re-arm the hazard it just discharged. */
```

## `weight.bereavement`

```ts
    /** ⭐⭐⭐ **A DEATH IN THE FAMILY** (the spec's §4; his 23.08 «вплести похороны» and the
     *  numbers he drafted on 11.09). ⭐ RULED 22.09 (question 3): **his 11.09 figures enter as
     *  DRAFTED CONSTANTS** – the bench confirms the corridor, his word finalises.
     *
     *  ⚠⚠ **THE HAZARD IS TEMPERAMENT-FREE AND THAT IS A DESIGN LAW WITH A PIN**: a death is the
     *  world's dice, never her personality's. Only the RESPONSE is hers – intensity prices depth (and
     *  therefore duration, under the one-rate law), openness prices expression. `bereavementChanceAt`
     *  takes no arguments at all, which is the same fence `pregnancyLossChanceAt`'s signature builds
     *  one field up, pushed as far as it goes.
     *
     *  ⚠ THE ARITHMETIC, IN FULL, because his own words on 11.09 are the corridor T6 measures
     *  against rather than a number to re-derive: 0.08%/week is ≈**4.1%/season** (`1 - 0.9992^52`),
     *  E ≈ **0.50** over the 23→35 tail (624 weeks), ≈**39%** of careers meet one and ≈**9%** a
     *  second before the spacing and the cap bite. The spec's §8 row 1 predicts «~40% / ~8%», which
     *  is what the unconstrained arithmetic says and what the two clauses below then trim. */
```
