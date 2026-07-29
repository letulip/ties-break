# The junior conveyor — arrivals and retirements

Somebody is always arriving, and somebody is always finishing.

## Why

v20 gave the field an age and a ceiling, so it stopped running away from her. What it still did not
do is **turn over**. The 199 ids generated at week 0 were the same 199 ids four hundred weeks later,
every one of them exactly as many years older as she was. Measured over ten seasons the mean rival
age walked **16 → 26 and kept going**: one class that enrolled together, graduated together and would
grow old together. Another decade and she is the youngest player in a field of forty-year-olds.

It is not a cosmetic problem. A tour whose population never renews cannot tell the story the game is
about: the girls she came up with are supposed to fall away, most of them before they are twenty, and
a new set of thirteen-year-olds is supposed to arrive underneath her every year. **The attrition is
the drama** — the field she is climbing is made of people who mostly stop.

## The shape

| age | what happens |
| --- | --- |
| 13–18 | **The junior years.** Almost nobody leaves (`juniorStay` 0.97) — a trickle does, because a class that loses nobody for six years is a class, not a tour. |
| 19 | **The crunch.** The junior tour ends and everyone is asked the same question: will anybody pay for the next part? The answer is her results. `crunchStay` [0.25, 0.97] off her standing in the field, so a bottom-quartile nineteen-year-old has ~4-in-10 odds of a twentieth year and a top one has 97. ~40% of each class stops. |
| 20–28 | **The professional years.** `proStay` [0.88, 0.99], same reading — about nine seasons of mean career, which is what makes half the field adults in the steady state. |
| 29–33 | **The end.** The chance fades linearly to zero at `hardRetireAge` 34, whatever her standing. Same bodies as the decline curve in `engine/development.ts`. |

`standingCurve` 1.2 bends the reading so the middle of the field sits nearer the bottom than the top:
being averagely good at nineteen is much closer to stopping than to a career.

Every departure is replaced **the same season** by a fresh thirteen-year-old, so the field is exactly
as big as it always was. Draw sizes, entrant bands, the ranking table and the tick's cost are all
untouched — what changes is the shape of the population inside that fixed number.

## Two rules that are not tuning

**Zero MAIN-stream draws.** Everything runs on `seed:conveyor:<season>`, created at the boundary and
thrown away. The frozen capture (41550 draws / `e6b0c709`) is untouched.

**Identity is never recycled.** A newcomer gets a brand-new id (`ai-s<season>-<n>`), never the id of
the player she replaces. `world.results` keeps result rows for 52 weeks and they are keyed by
playerId: hand a newcomer a departed player's id and she inherits that player's ranking points, her
fatigue reconstruction and her place in the standings. `tests/conveyor.test.ts` walks ten seasons and
asserts no id is ever reused.

## Measured (12 careers, 120k preset, one row per two seasons)

| week | her age | field | mean age | ≤18 | 19+ | 23+ | of the original 199 still playing | best-10 power | best-10 age | her rank |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 14 | 199 | 15.9 | 172 | 27 | 0 | 199 | 57.2 | 15.8 | #194 |
| 104 | 16 | 199 | 17.0 | 144 | 55 | 0 | 164 | 60.0 | 17.8 | #86 |
| 208 | 18 | 199 | 17.9 | 122 | 77 | 20 | 131 | 62.1 | 19.6 | #95 |
| 312 | 20 | 199 | 18.7 | 99 | 100 | 43 | 100 | 63.5 | 21.6 | #86 |
| 416 | 22 | 199 | 19.7 | 92 | 107 | 62 | 90 | 64.4 | 22.8 | #87 |
| 520 | 24 | 199 | 20.3 | 90 | 109 | 77 | 77 | 65.1 | 24.6 | #86 |

**Of the 199 girls she started with, 77 are still playing when she is 24.** Extended to twenty
seasons the population converges rather than drifting — mean age settles near 19, roughly 118 juniors
to 81 adults, and by her 34th year **none** of the original field remains.

The ladder v20 built survives it: best-10 power reaches 65.1 at her 24 against 65.8 before the
conveyor, and 66.0 in the long-run steady state. The top of the field is now made of adults
(mean age 24.6) instead of eighteen-year-olds, which is what it should have been all along.

The economy does not move. 120 seeds per preset, 14→18, against the same branch without the
conveyor: 8k survival 44 → 42, 25k self-coached 114 → 111, reach 82 → 86 and 70 → 73. Every cell is
inside the noise of a 120-seed run.

## What it does NOT fix

**Her rank still sits near #90 whatever her power does** (#86 at 16, #86 at 24). The conveyor was
never going to fix that: rank is points, and points are how much she plays and how far she goes, not
how strong the field's tail is. That is its own investigation — the suspects are the entry policy's
schedule size, the points table across tiers, and the size of the 0-point tie block at the bottom of
a 199-player table.

## A regression it introduced, found 29.07 and not yet fixed

**Retired players stay in the standings for a year, as raw ids.** Seen live on the Stats screen:
row 5 of STANDINGS reads `ai-153`, 1715 pts.

`computeRanking(results, week, roster)` treats `roster` as a **base order, not a filter**
(`season/ranking.ts`): after seeding the order from the roster it adds *anyone with a counting
result in the window*, roster or not. Before the conveyor that was harmless — every id with results
was in the cohort for ever. Now a player who leaves at the crunch keeps counting results for up to
52 weeks, so for a year afterwards she still holds a ranking place. `computeStandings` then falls
back to `{ name: r.playerId }` because her card is gone from `world.cohort`, and prints the id.

Two consequences, and the second is the one that matters: the table shows a non-name, **and every
player below her is pushed down a place, the kid included**. The rank numbers in
`docs/specs/rank-plateau.md` are therefore slightly pessimistic for the year after each turnover.

The fix is to make the roster a filter when one is passed. It moves every rank number in the game,
so it wants a measured run rather than a quiet patch — see task #50, and it may as well ride with
the two-track ranking work.

## Known simplification

A player's starting attributes do not depend on her age at generation: `makeJunior` draws serve 30–60
etc. whether she is 13 or 19. It is the pre-existing behaviour of `generateCohort` and the conveyor
inherits it deliberately — a girl who arrives in season 4 has to be the same kind of object as one
who was there at week 0. The visible effect is only in the opening field, whose youngest members are
a touch strong for their age; every field after that is age-stratified by drift, correctly.
