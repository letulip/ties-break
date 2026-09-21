# The comeback staircase, measured in the game's own Elo – and the A1 inversion's cause

Compiled 21.09.2026, on the owner's ask at the wave-8 hand-back: «сверить наши очки за вылет R1
больших сеток против малого титула с реальной таблицей… меня тоже смущает наша статистика побед,
глубина проходов и вылеты, особенно на одаренных карьерах». Instrument:
`tools/probe-favorite-curve.ts` (committed beside this file; zero MAIN draws – worlds are created
and read, never ticked). Nothing here changes game logic; §5 is a proposal for his word.

## 0. The headline

1. **Our points tables are the real tables.** Not the cause of A1; checked first and eliminated.
2. **The cause is the comeback staircase's units.** `×0.6` on a #31's wings is **−477 Elo at the
   game's own measured rate** – she plays the first three months like **#380**, which is level
   with the W15 field and a 10-points donor at every big draw. The research's «−40%» reads as
   −150…−250 Elo in the same denomination – the shipped first rung is **about twice too deep**.
3. Re-denominate the staircase in **Elo** (the currency `fieldPros.ts` already keeps its whole
   table in) and A1's inversion is predicted to flip with **no design change** – no points floor,
   no body cost, no apology in the copy.

## 1. The points tables, ours against the real ones – identical

`src/engine/season/calendar.ts` (the arrays, W→R1): slam `[2000,1300,780,430,240,130,70,10]`,
1000 `[1000,650,390,215,120,65,10]`, 500/250 with R1 = 1, w100 `[100,…,0]`, w15 `[15,10,6,3,1,0]`.
These are the WTA/ITF tables' own values – the calendar's comment says so and the check holds:
a Slam R1 loser really is paid 10, a W15 R1 loser really is paid 0, a W15 title really is 15.
⭐ So **reality also pays twelve big-draw R1 exits ≈ 120 points ≈ eight W15 titles** – the freeze
spent on big draws is a points-viable strategy in the real sport too (real returning mothers do
enter big events directly on the special ranking). What reality does NOT do is let a returning
#31 stay near-even with a W15 field for three months – that half is ours, and it is §3.

The July precedent stands on the junior side only: `ranking-points-by-tier.md` found the J30 R1
paying 12 where the real table pays 0. The pro rungs never had that defect.

## 2. The favourite's curve, measured

6,125 cohort pairs across five worlds, `fastMatchProbability` (the closed form the cards and
AI-vs-AI brackets both use since round 38 C4):

| attribute gap (overall) | p(win) mean | spread |
| ---: | ---: | --- |
| 0 | 0.518 | 0.149–0.868 |
| 5 | 0.623 | 0.240–0.935 |
| 10 | 0.732 | 0.284–0.944 |
| 15 | 0.833 | 0.509–0.975 |
| 20 | 0.913 | 0.718–0.985 |
| 25 | 0.955 | 0.923–0.986 |

Consistent with `SKILL_LAW.eloPerCore = 20.2` («two flat builds ten core apart win 76.2%»); the
mixed-attribute mean at gap 10 sits lower (0.732) because styles and the composure/stamina terms
scatter honest pairs widely – the spread column is real tennis, not noise. The curve itself is
NOT flat: at the gaps the merged table actually contains it reaches 0.91+.

## 3. The staircase, in the currency the field already keeps

`ECONOMY.motherhood.comebackStages` ships `×0.6 / ×0.8 / ×0.9 / ×1.0` **multiplicative on her
wings**. Priced through `coreForStanding`/`eloForStanding` (the module fitted to the live WTA Elo
list of 2026-08, 547 pairs, `docs/research/raw/2026-08-17-wta-elo-by-rank.json`):

| returner | core / Elo | ×0.6 plays like | ×0.8 | ×0.9 |
| --- | --- | --- | --- | --- |
| #15 | 63.2 / 1928 | −511 Elo → **#312** | −255 → #113 | −128 → #45 |
| #31 | 59.0 / 1843 | −477 Elo → **#380** | −238 → #151 | −119 → #88 |
| #60 | 55.7 / 1776 | −450 Elo → **#502** | −225 → #186 | −112 → #118 |

A «#380 for three months» is level with the W15 band (its entry opens ≈ #396) and beaten by every
main-draw seed at a Slam. **Both measured wave-8 symptoms follow at once**: small-first harvests
55 points a year (she is even with the small fields she was sent to farm), and straight-back
banks 12 × 10 for losing – the A1 inversion, 8/8 and 16/18, is this table and nothing else. The
staged factor «working exactly as designed» was true; the design's first rung is denominated in
the wrong units.

What did the research mean by −40%? In this same currency:

| intended handicap | factor on a #31 |
| ---: | ---: |
| −100 Elo | ×0.916 |
| −150 Elo | ×0.874 |
| −200 Elo | ×0.832 |
| −250 Elo | ×0.790 |

Real comebacks lose early rounds to top-100/300 opponents for a stretch – an effective −150…−250
Elo – and still beat W15 fields nearly always. No reading of «−40% form» supports −477.

## 4. The gifted-careers question – what already answers it, and the arm that remains

The owner's wider unease («глубина проходов и вылеты на одаренных карьерах») is PARTLY the head
of the table working as he himself ruled it: the live-list fit deliberately killed 1990s
dominance (#1 beats #10 only 78% live, not 91.5% – his «нам не нужно доминирования, как в 90х»),
so a gifted career losing real matches at the top is the calibration, not a defect. The remaining
open question is the MIDDLE: does HER measured round depth, by Elo gap, track the logistic curve
the field is built on? That arm needs walked careers and is contaminated today by §3 on any
career touching a comeback – so it is designed here and runs AFTER the staircase lands:
per-match log of (her effective core − opponent core) vs win, binned exactly like §2, one bench
section, ±1.5 pp fairness per temperament.

## 5. The proposal (invariant 5: his word lands on numbers, the bench proves them)

Re-denominate the stages in Elo and derive the factor per player at runtime:
`factor = (core − dElo / 20.2) / core`, stages `dElo = [200, 100, 50, 0]` on the shipped windows.
On a #31 that is ×0.832 / ×0.916 / ×0.958 / 1 – inside the research's own corridor, cheaper for
nobody and denominated where the whole field already is. Predicted and to be measured by the
existing instruments before any merge of the change:

1. `tests/wave8-return-ramp.test.ts` §D goes red exactly as it was built to, then re-pins with
   small-first ahead;
2. T9's ramp arms flip: small-first ≥ straight-back on points at 52 weeks (the trap points the
   right way), straight-back still spends the freeze 12/12 – the half that was always right;
3. the «returned successfully» ladder (motherhood spec §D8 table) moves toward the research's
   ~40% at top-150 rather than 12.5% at top-100;
4. the favourite curve of §2 does not move at all – the change touches no `SKILL_K`/`RALLY_K`.

⚠ Named limit: `eloPerCore = 20.2` was measured on flat builds; a ×-factor build is not flat, so
the per-stage Elo figures above carry ±10% – which changes nothing in §0's conclusion (−477 vs
−250 is not inside any error bar).
