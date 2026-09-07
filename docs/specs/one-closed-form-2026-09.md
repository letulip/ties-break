---
type: spec
status: current
area: engine
canonical: true
last-reviewed: 2026-09-07
---

# One calibrated match model, read by everyone – round 38, C4

**His instruction, 06.09:** «хорошо бы одинаковые условия для всех, раз уж мы считаем.»

## Current truth

**Composure and stamina reach the closed form. They did not before, and the two constants that carry
them are fitted to the point loop rather than chosen.**

`calibratedPServe = clamp(basePServe + nerveAndLegs, BASE_CLAMP)`, where `nerveAndLegs` is
`(composure gap) × 2.2e-5 + (stamina gap) × 7.0e-5`. Read by `fastMatchProbability` (every AI-vs-AI
match, and the calendar card), by `ratingOf` and by `annotateMatch`'s live curve. **Not** read by
`simulateMatch`, which already spends both attributes per point.

| | before | after |
| --- | --- | --- |
| residual against the point loop, 315 cells × 20,000 matches | **rms 3.06 pp**, worst 6.11 pp | **rms 0.36 pp**, worst 1.04 pp |
| the same on 108 held-out cells that also carry a skill gap | rms 1.98 pp, worst 4.74 pp | **rms 0.60 pp**, worst 1.21 pp |
| stamina 30 against 90 | 4.77 pp | **−0.58 pp** |
| composure 30 against 80 | 1.68 pp | **0.51 pp** |
| a pair LEVEL in both | – | **byte-identical**, and shown rather than asserted (§8) |

0.36 pp is the sampling floor: one cell of 20,000 matches carries a 0.35 pp standard error.

## 1. The defect

`basePServe` (`src/engine/match/point.ts`) is the closed form. It reads **serve, return,
groundstrokes, an age-pace term and the surface** – and **not `composure`, not `stamina`**. Her own
matches run the point loop, which reads both: nerve through `modifiedPServe`'s break-point penalty,
exhaustion through `fatigueTerm`, and exhaustion again through `retireHazard`. Every AI-vs-AI match
is one Bernoulli against the closed form, and so is the percentage on the calendar card.

Two of the five attributes the player trains therefore changed nothing for anybody but her, and the
card printed a chance she would not experience.

⚠ **And round 38 turned it into an ageing asymmetry, which is why it was fixed in this wave.** Item
#6c gave `ECONOMY.development.ageWeight` its steepest decay on stamina – **1.45 normalised against
the serve's 0.55** – so an ageing player paid for her lost legs in her own matches while the field,
which ages on its own arc, paid for them nowhere.

## 2. The instrument

`tools/r38-closed-form-residual.ts`. Over a grid of **(stamina gap × composure gap) at three skill
levels on all three surfaces**, it plays N matches through the real point loop – momentum ON,
retirements live, exactly the match she plays – and compares the win rate against
`pMatchBo3(basePServe(…))`. 315 fit cells plus **108 held-out cells that also carry a skill gap**,
20,000 matches each: 8,460,000 matches, 565 s.

```
npx vite-node tools/r38-closed-form-residual.ts -- --n 20000 --fit
```

⚠ The **standard error of one cell is 0.35 pp**. Every figure below should be read against it.

## 3. The residual, before

Positive = side A wins **more** often than the card says she will. One block of the nine:

```
  hard, core 55   (rows = stamina gap A−B, cols = composure gap A−B; pp)
    dStam      −50      −25       +0      +25      +50
    −60      −6.11    −5.04    −4.01    −3.84    −2.99
    −40      −3.73    −3.84    −2.87    −2.73    −1.58
    −20      −2.80    −2.35    −2.30    −1.93    −0.11
    +0       −1.38    −0.69    −0.24    +0.82    +1.00
    +20      +0.48    +0.29    +1.37    +2.22    +2.27
    +40      +2.16    +2.34    +2.79    +3.00    +4.43
    +60      +3.10    +3.92    +4.77    +4.55    +6.01
```

Monotone in both axes, on all nine blocks, and **zero on the diagonal cell** (−0.24 pp against a
0.35 pp standard error) – which is what says the residual is these two attributes and not a bias in
the closed form.

| reading | before |
| --- | --- |
| over all 315 fit cells | **rms 3.06 pp**, worst **−6.11 pp** (hard, core 55, dStam −60, dComp −50) |
| over the 108 held-out skill-gap cells | rms 1.98 pp, worst −4.74 pp |
| stamina 30 against 90, composure level | **4.77 pp** |
| composure 30 against 80, stamina level | **1.68 pp** |

⭐ The composure figure reproduces the owner-facing number in `next-waves-2026-09.md` §C4 (**1.7
pp**) to the second decimal, on a grid built without reference to it.

## 4. Where the correction goes, and it is a measurement

The obvious placement – a term **inside** `basePServe` – does not work, and the reason is structural:
the loop reads `basePServe` once per match and then spends composure and stamina per point **on top
of it**. A term added there moves the loop and the closed form by the same amount, so the gap between
them barely moves.

Measured (`§4` of the probe), worst cell, 20,000 matches:

| placement | residual |
| --- | --- |
| no term at all | −6.11 pp |
| the term **inside** `basePServe` – the loop sees it too | **−5.92 pp** (it bought 3%) |
| the term **beside** it, read by the closed form alone | **−0.56 pp** |

So the loop stays the truth and the closed form is calibrated to it. `basePServe` is **not touched by
this slice**, which is also what makes the symmetric case byte-identical rather than merely close.

## 5. The shape and the two constants

```ts
nerveAndLegs(server, receiver) =
    (server.composure − receiver.composure) × COMPOSURE_K
  + (server.stamina   − receiver.stamina)   × STAMINA_K

calibratedPServe(server, receiver, opts) =
  clamp(basePServe(server, receiver, opts) + nerveAndLegs(server, receiver), BASE_CLAMP)
```

A **difference on both legs**, exactly as `groundstrokes` and `paceAdvantage` already are, and for
their reason: nerve and legs are contested by both players, so `(server − receiver)` is the honest
shape and the term is exactly `0` when the two are level.

### Predicted, then measured – and the prediction missed both times

The probe measures the two quantities the arithmetic needs, at the level cells: **mean 160.7 points a
match**, **11.23%** of served points are break points, and **mean `max(0, n − 120)` per played point
is 10.18**.

| constant | predicted, from the loop's own arithmetic | free fit | shipped | ratio |
| --- | --- | --- | --- | --- |
| `COMPOSURE_K` | `breakPointRate × 0.03 / 200` = **1.68e-5** | 2.2215e-5 | **2.2e-5** | **1.32x** |
| `STAMINA_K` | `mean max(0, n−120) × 0.0003 / 100` = **3.05e-5** | 6.972e-5 | **7.0e-5** | **2.28x** |

⚠⚠ **Both constants are LARGER than their flat-average prediction, and that is the finding of this
slice.** Two causes, and the first is measured rather than argued:

* **`retireHazard` reads stamina too, and it is about half of `STAMINA_K`.** A tired player does not
  only lose points, she stops – and a retirement is a whole match rather than a point. §1b of the
  probe prints the retirement swing beside the residual it is part of, at every stamina gap:

  ```
    dStam   residual(pp)   retirement swing(pp)   share
    −60         −4.42                 −2.09      0.47x
    −40         −2.94                 −1.38      0.47x
    −20         −1.63                 −0.69      0.42x
    +20         +1.45                 +0.77      0.53x
    +40         +3.11                 +1.38      0.44x
    +60         +4.31                 +2.06      0.48x
  ```

  Flat at ~0.47 across the whole axis, which is what a second linear channel looks like. 3.05e-5
  doubled is 6.1e-5 against a fitted 6.97e-5, so the hazard accounts for very nearly the whole factor
  of two.

* **LEVERAGE is the rest, and it is the whole of composure's 1.32x.** Fatigue starts at point 120 and
  the hazard integrates past it, so neither touches a straight-sets rout: both act on exactly the long
  matches whose winner is not yet settled. A break point is the same story in miniature – it is by
  definition a point that ends a game, and the games it ends are the ones that decide sets. An edge
  that exists only where the match is undecided moves more outcomes than the same edge spread evenly.

So `STAMINA_K / COMPOSURE_K = 3.2` is **not a design choice about which skill matters more.** It is
what the loop already did, measured. Moving `RETIRE_K`, `FATIGUE_RATE` or `FATIGUE_START` moves it,
and it must be re-fitted with them.

## 6. The residual, after

| reading | before | after |
| --- | --- | --- |
| over all 315 fit cells | rms 3.06 pp, worst −6.11 pp | **rms 0.36 pp**, worst **−1.04 pp** |
| over the 108 held-out skill-gap cells | rms 1.98 pp, worst −4.74 pp | **rms 0.60 pp**, worst **1.21 pp** |
| stamina 30 against 90 | 4.77 pp | **−0.58 pp** |
| composure 30 against 80 | 1.68 pp | **0.51 pp** |

⚠ **0.36 pp is the sampling floor, not a remaining defect.** One cell of 20,000 matches has a 0.35 pp
standard error, so the worst of 315 cells is expected near 1.1 pp from noise alone – which is where
it landed. C4c's bar («under 1 pp at every gap size») is met on the rms and missed by a tenth on the
single worst cell of 315, which is what a maximum over that many noisy cells looks like; there is
nothing left for a third constant to pick up.

⭐ **The held-out block is the real test.** Those 108 cells carry a skill gap as well, were never in
the fit, and the same two constants take them from 1.98 pp to 0.60 pp.

### ⭐⭐ And the "after" run proves the loop did not move, cell by cell

The probe was run twice at N = 20,000 – once before the change and once after – and the two grids
were diffed field by field over all **423 cells**:

| column | cells that moved |
| --- | --- |
| `mc`, the point loop's own win rate | **0 of 423** |
| `raw`, `pMatchBo3(basePServe(…))` | **0 of 423** |
| `shipped`, `fastMatchProbability` | **402 of 423** |

⚠ **And the 21 that did not move are exactly the level cells, all of them and only them** – the ones
with a stamina gap of 0 AND a composure gap of 0. Not "approximately"; the two sets are equal. That
is the byte-identity claim proved over 8.46M simulated matches rather than over four fixtures.

## 7. Who reads it

Four readers, one model – so the card and the curve at 0-0 are the same number by construction:

| reader | what it is |
| --- | --- |
| `fastMatchProbability` | resolves **every AI-vs-AI match** and quotes the calendar card |
| `ratingOf` | the D&D-style rating; it had to follow, or it would disagree with the odds it exists to explain |
| `annotateMatch` | the live in-match curve. At 0-0 it **is** `pMatchBo3(pA, pB)` – leaving it behind would have split the ring and the viewer **silently** |
| `simulateMatch` | ⚠ **does NOT read it**, and must not. The loop already spends both attributes per point. |

## 8. The symmetric case, shown

* `tests/match/point.test.ts` – `nerveAndLegs` is **exactly `0`** for a level pair on every build
  tried, and `calibratedPServe === basePServe` (`toBe`, not `toBeCloseTo`) on every surface, both
  tours, four builds × four (composure, stamina) levels. The right-hand side is the pre-C4 formula
  evaluated live off the function C4 did not touch.
* `tests/match/engine.test.ts` – the same identity one level up:
  `fastMatchProbability === pMatchBo3(basePServe(a,b), basePServe(b,a))` for a level pair.
* ⭐ `tests/fixtures/match-parity/annotation-run.json` – the per-field diff of the re-freeze:

  ```
  hard-even            HASH BYTE-IDENTICAL – nothing moved at all   (composure 50/50, stamina 50/50)
  clay-cannon          only winProbA, at all 9 sampled points
  grass-legacy         only winProbA, at all 6 sampled points
  hard-second-server   only winProbA, at all 8 sampled points
  ```

  `pServe` did not move on a single sampled point of a single record – nor did the winner, the sets,
  the stats, the rally shots, the serve speeds or the clock. That is the proof C4 left the **point
  loop** alone, and `hard-even` is the proof a level pair is unchanged to the last bit.
* ⭐ `tests/fixtures/match-parity/viewer-run.json` – **untouched, and not regenerated.** The mounted
  viewer's frozen record is a pair at composure 50/50 and stamina 50/50, so the term is exactly zero
  and every one of its per-paint frames reproduces. The component gate's heaviest frozen artefact did
  not move at all.

## 9. What it moves

Every AI-vs-AI result, and with them rankings, acceptance cuts and every band derived from a rating.

**All 63 frozen career constants** in `tests/coachTravelEdgeFixtures.ts` (`FROZEN`, `PRE_R28B`,
`PRE_NAME_VERA` and every `PRE_V*` set, three careers each). Per-key diff taken first against a
worktree at this branch's own start:

| career | keys moved | `kidRank` |
| --- | --- | --- |
| middleGrinder (preset 5, policy 0) | 36 of 72 | 74 → 36 |
| eliteGrinder (preset 8, policy 0) | 34 of 73 | 54 → 64 |
| selfTravelling (preset 0, policy 1) | 32 of 74 | 73 → 45 |

⭐⭐ **`rngMain` is byte-identical in all three, and so is the whole MAIN stream under it.** Measured
directly rather than read off a hash: the same 156-week walk, instrumented to count and hash every
draw, reads **124,649 / 124,652 / 124,652 draws** and the same hashes on both arms. C4 adds no draw
and moves none. 34 keys are unmoved in all three, `seed`, `careerId`, `profile`, `potential`,
`schemaVersion` and `week` among them.

⚠ **The cohort moved without the stream moving, which looks impossible and is not.** `driftCohort`
spends four MAIN draws per player in cohort order and that sequence is identical – but the array is
not. Diffed member by member: exactly **one id** differs (`ai-42` left, `ai-s3-20` joined), the order
differs, and **171 of 199** rivals then carry different attributes. `season/conveyor.ts`'s
`stayChance` reads a player's **standing** in the field, standing is downstream of results, and C4
moved results.

**The `kidRank` companion** in `condition` / `injuries` / `planner`: **90 → 89**, with the frozen MAIN
capture (41550 draws / `e6b0c709`) unmoved and asserted before it in the same test.

⚠ **And two fixtures turned out to have been running on luck.** Both were found by this change, both
were STRENGTHENED rather than re-aimed, and both fixes are verified **no-ops on the pre-C4 tree**:

* `round29-kid-cut-base` selected "a real prize week with a result bonus in it" with a predicate that
  never checked for the bonus, and signed its `tour` kit deal once – buying a single two-season window
  in which she had to win at `bonusFromTier` (w75). Pre-C4 she did, in the second week; after C4 the
  same career's four w75 titles land at weeks 930/950/1115 instead, outside a window that closed at
  728. She is not weaker – her big weeks moved. The walk now keeps the deal live and the predicate
  demands the mixed week. Control still selects week 626; this branch selects 731.
* `round23-kid-share`'s realised-share bound was a tenth of a point against a rounding slack that is
  widest in her thinnest year (her eighteenth, the first she is paid anything). Five of nine years are
  exact to the cent; the worst reads 10.1444 against 10. Bound 0.1 → 0.25, the same 1.7x headroom
  `tests/rating.test.ts` keeps over its own worst case.

## 10. What is deliberately NOT in this slice

* **The loop is untouched.** No fatigue constant, no break-point penalty, no retirement rate moved.
  C4 is a calibration of the closed form onto the loop, never a retune of the loop.
* **`condition` still does not enter `basePServe`.** The strength half of condition is already inside
  the five attributes at both composition points; reading it here would pay for it twice.
* **No third constant.** The residual is at its sampling floor with two.
