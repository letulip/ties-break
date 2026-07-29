# Why her rank is pinned near #90 — diagnosis (29.07.2026)

Her dense rank has sat between #80 and #101 at every age, at every power level, before and after the
conveyor, in every preset. This is what is actually causing it. **Nothing here is implemented** — the
fix in §5 re-rolls every tournament result in the game and wants the owner's word first.

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

## 4. The prediction the fix has to satisfy

If §2a is the dominant cause, then seeding only the top 8 and placing everyone else at random will
**not move her points much** — it will lower the mid-table's, because those players lose the
protection they should never have had. Her rank should improve while her point total stays roughly
flat. That is a falsifiable prediction and the measurement should be run against it.

---

## 5. The proposed fix, in order

1. **Seed like a real draw.** `standardSeedOrder` places the top `drawSize / 4` (8 of 32, 4 of 16,
   2 of 8 — the ITF shape); everyone else, kid included, is shuffled into the remaining slots on the
   event's own stream. She is seeded when her standing earns it and unseeded when it does not, on the
   same terms as everybody else. `drawKidInto` is absorbed by this and its guard tests get re-aimed,
   not deleted.
   **This re-rolls every tournament result in the game** — event-scoped streams only, so the frozen
   MAIN capture cannot move, but every existing seed produces a different world. Wants a full
   econ-bench pass at 120 seeds and the owner's word before it lands.
2. **One entry rule.** Her eligibility should read the same signal the AI's entry list reads: in the
   band by standing OR over the points threshold. And j300's band should be widened (or its draw
   reduced) so its field is what the rule claims it is instead of being backfilled to #140 every time.
3. **Make playing down worth something**, so 2c is a choice rather than a trap. Out of scope until
   1 and 2 are measured — they may change the arithmetic on their own.
