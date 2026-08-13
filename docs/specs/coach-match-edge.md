---
type: spec
status: building
area: engine/coach
canonical: true
last-reviewed: 2026-08-13
---

# The coach's edge: what you are actually buying, per match

**Owner-approved 13.08, flat variant, corridors below.** This is lever L1 of
`docs/specs/the-wall-2026-08.md`, the only one of the four he chose to build. Its measurement is
that spec's §Measured; nothing here re-argues it.

## 0. What it is, in one sentence

While a coach is paid, every match she plays carries a small edge, drawn once for THAT MAN and
constant for as long as he is hers.

His words, 12.08: «что если мы за каждый тир тренера будем добавлять шанс на победу в турнире?
Крохотный, но шанс … т.е. мы в прямом смысле покупаем что-то ощутимое.» And on the shape, 13.08:
«разброс остается … более мощный тренер может обладать большей уверенностью.»

## 1. The corridors, and the rule that cut them

He asked whether a `budget` coach can come out ahead of a `middle` one – «есть тихие никому не
известные гении?» – and said to re-cut the windows if the answer should be no. It should be yes:
that is a real thing about coaching and it is the reason to hire anyone at the bottom of a market.
But unbounded it dissolves the ladder, so the windows are cut to a stated rule:

> **Each tier's ceiling is the next tier's midpoint. No tier reaches two rungs up.**

| tier | corridor (pp per match) | width | midpoint | its ceiling lands on |
| --- | --- | --- | --- | --- |
| `budget` | **0.2 – 0.7** | 0.5 | 0.45 | `middle`'s midpoint |
| `middle` | **0.5 – 0.9** | 0.4 | 0.70 | just past `high`'s midpoint |
| `high` | **0.7 – 1.0** | 0.3 | 0.85 | `elite`'s midpoint |
| `elite` | **0.9 – 1.1** | 0.2 | 1.00 | – |

Width falls as price rises, which is the whole fiction: **a cheap coach is a lottery you might win;
an expensive one is what you buy when you cannot afford a lottery.** What the rule costs, at a
uniform draw: a `budget` coach beats the `middle` you could have hired instead **10%** of the time,
`middle` beats `high` **17%**, `high` beats `elite` **8%**. One cheap coach in ten is a find.

`self` is 0.0 and is not a corridor. Coaching her yourself buys no edge and never will – the parent
is buying the plan, and «если родитель талантлив и прочитает хорошо – пусть побеждает» stays true
because the plan is where his talent lives.

## 2. Where the number comes from

**One draw per COACH, off his id.** `rngFromSeed(`${seed}:coachedge:${coachId}`)` → one uniform in
his tier's corridor. Never per match (it would average out over ~450 matches and no one could ever
feel it), never per hire (firing and re-hiring the same man would re-roll him, and «этот оказался
находкой» has to be a fact about a person).

This is exact rather than approximate: `buildCoachRoster` sets `id: slot.portrait` from a fixed
roster, so a coach's id is stable for the whole career and across her ageing – the same note that
already explains why «a coach who is dear for his rung at 14 is dear for it at 22».

**Nothing is persisted.** The value is re-derived wherever it is needed, exactly like every other
sub-stream in the engine. No schema move, no migration, no fixture.

## 3. How percent becomes tennis

A Markov engine has no win-chance dial, so the edge is a small additive delta on her five on-court
attributes at the composition point (`kidMatchPlayerFor`), calibrated so her mean match-win
probability against her ACTUAL field moves by the corridor's percentage.

The calibration is measured, not assumed – `the-wall-2026-08.md` §M1, 1512 sampled states over 16
careers, her real field per rung:

| target (pp) | measured delta (skill points, all five wings) |
| --- | --- |
| 0.45 | 0.234 |
| 0.65 | 0.339 |
| 0.85 | 0.444 |
| 1.05 | 0.549 |
| 2.10 | 1.110 |

Linear to the eye: the ratio is 0.520 at 0.45 and 0.523 at 1.05, so **delta = pp × 0.5225** is
accurate to under 1% everywhere inside the shipped corridors. For scale, the visibility floor on
one wing is 3 points (`TRAINING_FOG_FLOOR`) – so no setting here is ever visible on the radar, which
is correct: the coach is worth a point of a match, not a point of her.

## 4. Where it is shown

**On the card, before hiring: the TIER'S CORRIDOR**, e.g. «+0.2-0.7% per match». That is genuinely
all a market can tell you about a price bracket, and it is what he asked for – «может по-проще
"+0.3-0.6% per match" или вроде того».

**His own number is NOT on the card.** A number on an unhired card turns the market into a shop
window with the prices written on the back: hire, read, fire, repeat until the 0.7 budget coach
turns up. Since the value is a property of the man, that search would always succeed.

**It appears on his plaque after a full season with her.** You learn what a coach is worth by
employing him – that is what scouting is – and it arrives far too late to shop with. The reveal is
the payoff of the budget lottery and the reason the corridor is worth reading at all.

## 5. Invariants this must not break

1. **Zero MAIN draws.** The edge is post-draw arithmetic on a purpose-scoped sub-stream. The frozen
   capture (41550 / `e6b0c709`) must re-derive unchanged.
2. **Input-independence.** No player action re-rolls anything: the draw is a pure function of seed
   and coach id.
3. **No schema change.** Nothing new is persisted.
4. **Self-coached careers are byte-identical to today.** `self` = 0, and a zero edge must take the
   same code path it takes now – `tools/wall-freeze-probe.ts` exists for exactly this and must still
   report identical hashes for a self-coached career.

⚠ **Coached careers DO change, and that is the point.** Every existing save with a coach will play
different matches from this commit on. That is a balance change, not a bug – but any golden fixture
or test that pins a coached match outcome will move, and each one must be re-aimed knowingly rather
than re-recorded blindly.

## 6. What must be measured before this is called done

Invariant 4 of `CLAUDE.md`: a balance change ships with predicted vs measured. Re-run the shipped
ladder through the wall bench and record here:

* the July table per tier (top-250 / top-100 / wta500-cleared / Slam), against the baseline;
* net-of-bill per tier per background, against self-coaching – does the market's shape improve;
* the realised-value distribution actually produced by the draw, against the corridors above (it
  must be uniform inside them, and the 10/17/8% overlap odds must come out).

Prediction, registered now: the top rows stay at zero (the wall spec measured that at every dose up
to 2.1 pp), top-250 rises a few points, and `wealthy·high` becomes solvent net of its bill – the one
cell the measurement already showed flipping. If the top rows move, something is wrong with the
implementation, not right with the design.
