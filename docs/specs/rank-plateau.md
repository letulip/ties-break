# Why her rank is pinned near #90 — diagnosis (29.07.2026)

Her dense rank has sat between #80 and #101 at every age, at every power level, before and after the
conveyor, in every preset.

**§1–§3 are the diagnosis as first written. §4 is the fix that was proposed, shipped and MEASURED TO
DO NOTHING. §5 is the actual answer, found because §4's prediction was falsifiable and got
falsified.** Read to the end before acting on anything above it.

Measured over 6–8 careers of the 120k preset (the least money-starved career we have, so the cause
cannot be "she could not afford to play"), balanced 75/25 plan, entry policy "strongest tier she
qualifies for, one event a week".

---

## 1. She is not under-ranked by a little. She is under-ranked by five points of power.

| week | her rank | her points | peers' points | **her raw power** | **peers' raw power** | field best-10 |
| --- | --- | --- | --- | --- | --- | --- |
| 208 | #93 | 359 | ~350 | 56.2 | 51.0 | 62.0 |
| 312 | #91 | 354 | ~354 | 57.7 | 52.2 | 63.4 |
| 416 | #80 | 476 | ~468 | **58.5** | **53.4** | 64.3 |

"Peers" = the AI players standing within ±10 places of her. She is consistently **five points of raw
power stronger than the players she is tied with on points**. The ranking is not measuring what she
can do.

## 2. The proximate cause: she goes out in round one far more often than they do

Her entries produce a scoring result **27%** of the time (≈6 counting results from ≈22 entries a
season). Her peers score in **47%** of the events they play. A first-round exit pays zero at every
tier (wave B, and it is the real ITF rule), so three quarters of her season is worth nothing.

Three things feed that, and they are separable.

### 2a. THE SEEDING ASYMMETRY — the sharpest of the three, and it applies to exactly one player

`runTournament` builds the bracket like this:

```ts
field = entrants.slice(0, drawSize - 1)   // entrants arrive SORTED BY STANDING
field.push(kid)                            // ...and she is appended LAST = the lowest seed, always
const order = standardSeedOrder(field.length)
let alive = order.map((seed) => field[seed - 1])
if (kid) drawKidInto(alive, kid, rng)      // wave 2: then placed at a uniformly random slot
```

So **the entire AI field is seeded by standing** — `standardSeedOrder` protects every one of the 32,
top to bottom, so a mid-table AI meets the player adjacent to her in the standings — while **she is
seeded last whatever her rank and then thrown into a random slot**.

The random placement is the owner's own instruction and it is right («в настоящем теннисе несеяная
новичок попадает в сетку случайно»). What is wrong is its other half: in a real draw only the **top 8
of 32** are seeded and *everybody else* is placed at random. Here everybody else is seeded and only
she is not. She carries the variance of an unseeded draw against a field that has all been protected
from it.

### 2b. TWO DIFFERENT ENTRY RULES FOR THE SAME EVENT

She qualifies for a tier by an absolute points threshold (`enterPointBand`); the AI qualifies by its
standings percentile (`entrantPctBand`), with the availability gate's backfill reaching outside the
band when the band cannot field a full draw. Those rules do not agree, and at the top of the ladder
they disagree badly:

| tier | band says | the field ACTUALLY reaches (p10 / median / p90 / worst) |
| --- | --- | --- |
| local | #109–#199 | #113 / #121 / #127 / #136 |
| regional | #80–#175 | #84 / #93 / #104 / #124 |
| national | #40–#139 | #46 / #66 / #92 / #128 |
| j30 | #24–#119 | #30 / #57 / #90 / #132 |
| j60 | #10–#80 | #9 / #37 / #88 / #133 |
| **j300** | **#1–#50** | **#6 / #72 / #116 / #140** |

j300 has a 32-player draw, a 50-player band and the highest condition floor in the game, so most of
the band is too tired to play and **over half the field is routinely backfilled from outside it** —
down to #140. Her peers at #80–#95 therefore play about **one j300 a season and take 51–63 points out
of it**. She plays **zero, ever**: her gate is 900 points and her best-6 has never exceeded ~476.

The tier that pays the most (1000 for a title, 175 for a quarter-final) is one her direct rivals
enter through a side door that is closed to her.

### 2c. SHE ALWAYS PLAYS UP

The entry policy takes the strongest tier she qualifies for, every week. Her best-6 at week 416 is
**447 points of j30 and nothing else**; her peers' is spread across national (26), regional (25), j30
(214), j60 (134) and j300 (63). They are favourites somewhere; she never is.

This one is a *policy* artefact rather than an engine fault — but the Season screen offers the same
choice to a real player, so it will play out the same way unless playing down is made attractive.

---

## 3. What is NOT the cause

- **Not volume.** She enters ~22 events a season; her peers play ~19. She plays more, not less.
- **Not money.** Measured on the wealthy preset, where affordability never binds.
- **Not the conveyor.** The plateau predates it and is unchanged by it (#86 before, #86 after).
- **Not the 0-point tie block.** ~123 of 200 players score in any given window, so she is being
  ranked against real points, not against a tie.

---

## 4. The seeding fix: shipped, measured, and NOT the answer

The prediction was: seed only the top 8 and place everyone else at random, and her POINTS should stay
roughly flat while the mid-table's fall — because those players lose a protection they should never
have had — so her rank improves.

Shipped exactly that (`buildDraw` in `season/tournament.ts`: the top `drawSize/4` take the standard
seed positions, everybody else including the kid is shuffled into the rest; she now enters the field
at her standing rather than at the bottom of it). Measured, 30 careers, like-for-like on the same
seeds:

| week | rank before | rank after | her points before | after | peers' points before | after |
| --- | --- | --- | --- | --- | --- | --- |
| 104 | #83 | #81 | 448 | 473 | 448 | 472 |
| 208 | #94 | #96 | 334 | 334 | 318 | 311 |
| 312 | #88 | #87 | 399 | 413 | 396 | 403 |
| 416 | #80 | #76 | 468 | 550 | 467 | 545 |

**−2, +2, −1, −4. Nothing.** And the shape of the failure is the clue: her points and her peers' move
*together, every time*. The change lifted her and the mid-table by the same amount, which is what it
would do if the two were the same thing — which they are, and that is the thing to explain.

Balance cost of keeping it: none. 120 seeds/preset, 14→18 — survival 68→70, 3→2, 42→39, 111→112;
every cell inside noise. **It stays**, because a bracket that seeded all 32 and singled out one player
for the random slot was wrong on its own terms, not because it fixed anything.

---

## 5. THE ACTUAL ANSWER: she is never fresh, and the model is working perfectly

| | her | the field |
| --- | --- | --- |
| mean condition, any week | **24.4** | 72.3 (her direct rivals: 59.3) |
| mean condition on a week she PLAYS | **18.7** | 72.5 |
| condition match factor | **0.707** | 0.931 |
| raw power | 56.8 | 51.3 |
| **effective power on court** | **40.0** | **45.6** |

She is five points of raw power stronger than her rivals and takes the court **twelve percent
weaker** than they do. That is the whole plateau. Not the draw, not the points table, not the tie
block — she plays every week she can afford, at condition 19, for ever.

And it is not a bug in the fatigue model. It is the fatigue model doing exactly the job it was built
for, against a schedule nobody had measured the consequence of. Add ONE rule to the entry policy — do
not enter below a condition floor — and change nothing else:

| condition floor | entries/season | mean condition | match factor | her points | **her rank** |
| --- | --- | --- | --- | --- | --- |
| 0 (the grind) | 23.5 | 24.4 | 0.707 | 395 | **#89** |
| 35 | 17.2 | 31.8 | 0.754 | 483 | #84 |
| 55 | 13.9 | 43.3 | 0.828 | 668 | #57 |
| 70 | 12.6 | 53.2 | 0.892 | 898 | **#40** |
| 85 | 11.2 | 64.7 | 0.966 | 937 | **#39** |

**Playing half as many tournaments more than doubles her points and moves her fifty places.** Her
ceiling was never the ladder. It was her calendar.

### What this actually means for the game

1. **The ranking is not broken and the ladder does not need rescaling to fix it.** (The points table
   is still wrong on its own evidence — `docs/research/ranking-points-by-tier.md` §6, J300 pays 2.5×
   a J30 where reality says 10× — but that is a separate argument and this is no longer the reason
   to act on it.)
2. **The player is given no way to see the cost.** The Season screen shows a condition ring and a
   'caution' chip when she is under a tier's floor, and then lets her enter anyway with no statement
   of what it costs. Nothing anywhere says "she will play this at 0.71 of herself". The single most
   valuable thing the interface can do is put that number in front of the player at the moment of
   entering — this is a UI slice, and it is worth more than any balance change on this page.
3. **The benches grind by construction** ("enter every eligible event you can afford"), so every
   number they have ever produced describes a wrecked player. Worth a second policy on the econ
   bench — the fatigue bench already has careful/balanced/grinder — so future claims can say which
   player they are about.
4. **Rest has to become a real choice with a visible payoff.** Today the planner's vacation and the
   rest slider are the only levers, and neither is presented as "this is worth fifty ranking places".

### Still open, and still worth doing on its own merits

- **Two entry rules for the same event** (§2b): she qualifies on absolute points, the AI on standing
  plus a backfill that reaches to #140 in a tier whose band ends at #50. Unfair, and unrelated to the
  plateau.
- **She always plays up** (§2c) — which the rest-floor table now reframes: playing up while wrecked
  is the trap, and the fix for both may be the same one.
