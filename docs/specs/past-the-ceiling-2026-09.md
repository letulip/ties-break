---
type: spec
status: reference
area: simulation-and-balance
canonical: false
last-reviewed: 2026-09-16
---

# Past the ceiling – what the psychologist can add to her nerve

Round 42 #35, shipped on schema v78. This records what was built, what it was predicted to do, and
what it measured – which is the house rule for anything that moves a number (CLAUDE.md invariant 5).

## What he asked for

> «может быть даже сделать какую-то возможность превосходить заложенную с сидом выдержку с помощью
> психолога. Пусть и не сильно, но тем не менее» (15.09)

and the three numbers, the same day:

> «+5 потолок, по очку за сезон, постоянный (здесь не уверен, можно всё таки небольшой откат сделать
> мне кажется, например 0.2пп за сезон без этой тренировки, мне кажется это вполне ок)»

and the clarification that decides the whole shape:

> «смотри, чтобы у нас обычный естественный прирост тоже работал, т.е. пока она растёт и без
> психолога у неё всё равно этот навык может тренироваться в зависимости от сида. Т.е. наши "0.2
> очка выдержки за простойный сезон" это уже что-то вроде тех сезонов, где она выше своего потолка
> прыгнула по результатам работы с психологом.»

## What was built

Every career now carries one more number, `composureBonus`, and it means *how far above her rolled
ceiling the psychologist's years have carried her*. It is **headroom, not points**. The ceiling
composure is allowed to climb to becomes `potential.composure + composureBonus`, and ordinary
development does the climbing on its own rate, its own luck and its own aim.

That is the part worth saying twice, because the alternative is one line shorter. Adding the bonus
onto her composure value directly would make the wing jump on a week she did nothing, which is the
thing a ceiling exists to prevent. Under the shape that shipped, a bonus point is earned twice – the
seat buys the room and the training fills it – and nothing in the engine writes to her build behind
`growWeek`'s back.

The numbers are his, spent per week off per-season constants (`ECONOMY.psychologist`):

| | |
| --- | --- |
| cap | **+5** points of headroom above the rolled ceiling |
| earned | **+1 per season** of work on the nerve focus, i.e. 1/52 a week while the seat works it |
| lost | **−0.2 per idle season**, i.e. 0.2/52 a week while it does not, floored at 0 |

A part season is proportional rather than needing a threshold for what "continuous" means. That
matters more than it looks: the seat stands down by design on a college freeze and on a booked family
week, so a season-boundary rule would have had to decide whether a family holiday voids the year.

Below her rolled ceiling nothing here is reachable at all. The bonus is 0, the effective ceiling is
the number the seed dealt, and the week's arithmetic is the same arithmetic it has been since v25.

## The decay, and why it had to be built rather than reused

The proposal in the round ledger said the effective ceiling would fall and "the age-creep clamp that
already exists" would ease her value down with it.

**There is no such clamp.** Composure's loss term is zero by `isPhysicalSkill`; `gain`,
`veteranPoise` and the psychologist's own term are all non-negative; and the floor at the end of the
loop is a floor. Composure cannot fall anywhere in `development.ts`, and the file says so itself in
`coolheadCrossedAPoint`'s note. Left alone, a falling effective ceiling would simply freeze her: the
headroom clamps to zero and the points the bonus bought stay in her build for ever, so the rollback
he asked for would have been a number in the save that never reached the screen.

So the easing is built, and it is built narrow. Each week it takes the smaller of two things:

* **this week's fall in the bonus**, and
* **how far she is above the NEW effective ceiling**.

The second bound is what keeps it off ordinary development. A family that bought the room and never
climbed into it – the seat hired, the training pointed elsewhere – sits below the new ceiling, so
nothing is taken. There is no banked point to slip back from, which is "earned twice" running in
reverse.

The first bound is what protects `veteranPoise`. Past twenty-nine, composure legitimately parks above
its ceiling and nothing clamps it. Without the fall bound, a decaying career would be pressed flat
onto the effective ceiling and a veteran's poise would be swallowed whole by a mechanic that has
nothing to do with it. With it, the most a week can take is that week's own decay, and the two
mechanics simply sum: an idling veteran loses 0.2 a season here and gains 0.208 from poise, so her
number barely moves while her bonus unwinds.

## Predicted, and measured

`tools/r42-composure-bonus.ts`, 24 careers (12 seeds x `25k · middle coach` and
`120k · elite coach`), `player` policy, ten seasons from week 364, top rung. Three arms off one code
path: never hired, worked throughout, and worked five seasons then stopped.

| | predicted | measured |
| --- | --- | --- |
| P1 reaches the cap | five seasons of work, then nothing more | **23 of 24** reach +5, mean bonus **4.96** – but the first season on the cap is **7.35** (6–8), not 5 |
| P2 ends above her rolled ceiling | by very nearly the whole bonus | **+5.19** on the worked arm against **−0.04** on the control |
| P3 the size of it | small: +5 against a ceiling band of +4..+26 | **+5.24** points of composure (4.46 – 5.68) |
| P4 a band crosses | some careers, not most | **9 of 24** – one `Hot-headed → Impatient`, eight `Impatient → Patient` |
| P5 the idle arm | unwinds slowly and keeps almost all of it | five idle seasons leave **2.73** of bonus and **+3.07** of composure |

Three of the five landed where they were predicted. The two that did not are the findings.

**P1 missed, and the reason is the stand-down.** Five *worked* seasons do buy the cap exactly – that
arithmetic is exact and pinned. Five *calendar* seasons do not, because the seat is stood down on
booked family weeks and those weeks neither earn nor cost anything but time. Across the corpus the
seat worked **397.6 of 520** weeks, so ten calendar seasons are about seven and a half worked ones
and the cap arrives in season six to eight. Nothing is wrong with the model; the sentence "a
five-season project" is a sentence about worked seasons. **If the owner wants a family holiday to
count toward the year anyway, that is a one-line change and it is his call, not ours.**

**P2 came in 0.19 above the cap and that is a residual, not a leak.** The bonus itself is exactly
5.00. Her composure ends 5.19 above the rolled ceiling because of an overshoot the engine has carried
and documented since v76: on a week where the psychologist's term exactly fills the remaining
headroom, training's own gain lands on top of a gap that is already closed. One week of it is under
0.007 of a point. What the bonus adds is that the gap re-opens every week the ceiling rises, and
again after every stand-down week, so ten seasons of it accumulate to about a fifth of a point – four
per cent of the mechanic. It is bounded (it can only accrue while headroom is being re-opened) and it
is always upward. Removing it would mean changing v76's shipped arithmetic, which this item did not
ask for.

## What it pays for

Round 42 #37's personality tile reads composure bands, so this is the first thing in the game that
can change the first word of who she is by something the parent *did* rather than something the seed
dealt. Measured, it moves that word on **9 of 24** careers – and the shape is right: it matters to a
girl sitting a few points under a cut and does nothing for a girl in the middle of a band. Round 42
#34's re-pricing of nerve is what will decide whether those points are also worth something in a
match.

## What did not move

No new randomness: the bonus is a constant, a clamp and a compare, so the frozen MAIN capture
(41550 draws / hash `e6b0c709`) is untouched by construction. No career without a psychologist
changes by a bit – the per-key control over the five frozen careers found `skills`, `rngMain`,
`potential` and the wallet byte-identical, with only the three new keys appearing and
`schemaVersion` moving.
