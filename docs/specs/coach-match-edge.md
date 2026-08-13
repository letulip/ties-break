---
type: spec
status: draft
area: engine/coach
canonical: false
last-reviewed: 2026-08-13
---

<!-- ⚠ `status: building` / `canonical: true` when this file was created (4654f80) – neither is a
     thing. `building` is not one of the six statuses `scripts/context-audit.mjs` accepts, and
     `canonical: true` additionally demands `status: current` plus a `## Current truth` section. The
     audit is the FIRST step of `npm run check`, so from that commit the whole gate stopped at step
     one and nothing behind it ran.

     DRAFT IS THE HONEST STATE, not a workaround: §7's reformulation is not built, §8's measurement
     has not run, and §6's registered prediction is unresolved. A canonical document asserting
     current truth while its own prediction is open would be a worse error than the one it replaced.

     ⚠ IT FLIPS AT THE END OF THIS WAVE, and these are the conditions – whoever closes the wave owes
     this: §6's re-measure recorded against its prediction, §7 shipped, §8 either shipped or ruled
     out by its own numbers. Then `status: current`, `canonical: true`, and a `## Current truth`
     section. This note exists because "flip the frontmatter later" is exactly the shape of the nine
     items the 13.08 audit found silently dropped. -->


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

### 4a. What shipped, and where

**The plaque is the hired coach's own card in the market list (`.cm-row.current`), not Home's coach
note.** Both were real candidates. Home's note is a QUOTE – a portrait, one line of his read on her,
a handwritten sign-off – it is 166px wide at 375px, and it is the surface already fought over twice
for text sitting on the portrait (round-17 #14, round-18 #1); it has no room to spend. The market
row is where the corridor is being read, so the rung's band and the realised number land two lines
apart on the same card. A number shown anywhere else would be a fact with nothing to compare it to.

The three states, verbatim:

| state | copy |
| --- | --- |
| any card, hired or not | `+0.5-0.9% per match`, beside `+1.7-3.5% a season` on one wrapping line |
| hers, before the reveal | `Too early to tell where in that band – 4 weeks of 52.` |
| hers, after it | `A season together – the number is +0.62% per match.` |

Corridors print to one decimal (a bracket is a design constant); the realised value prints to two (it
is a measurement of one person). Neither sentence judges the man – a revealed 0.21 is reported in the
same words and the same colour as a 0.68 – and neither mentions her skills, because the whole
corridor is under half a skill point against a visibility floor of 3 (§3).

**Measured** (headless Chromium, real webfonts, real 162x264 portraits, DPR 2 – the numbers and the
mutation ledger are in `tests/component/coach-edge-card.test.ts`): first ink at 75.00px against a
62px strip = **12.00px of clearance on every card at 320px and 375px**, unchanged from before the
slice. Row height at 320px: ordinary card 109.3 -> 122.3 (+13.0, one wrapped line), the hired card
123.5 -> 168.9, and identical before and after the reveal, so the card does not jump when the number
lands. That the clearance held is a debt round-18 #2 paid: before the strip had a width, a taller row
made the portrait WIDER, and two added lines would have eaten the gap.

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

## 7. The reveal says a PLACE, not a number (owner, 13.08)

Shipped copy said «A season together – the number is +0.74% per match.» He caught it: «как это
вообще измеримо, если абстрагироваться от нашей механики?»

**He is right, and the objection is stronger than the fourth wall.** The value is not observable in
principle. At ~0.7 pp over a fifty-match season it is buried orders of magnitude under the variance
of her own results; separating a 0.62 coach from a 0.74 one would take thousands of matches. A
sentence that states it to two decimals claims a precision nothing in the world could produce.

**The corridor on the card is NOT the same error, and the distinction is what saves it.**
`+0.5-0.9% per match` is a CLAIM A MARKET MAKES ABOUT A PRICE BRACKET – like the range in a job
advert. A claim need not be observable. «His number is 0.74» is offered as A MEASUREMENT OF ONE
PERSON, and a measurement must be. So the bracket stays (it is his own phrasing) and the reveal
changes.

**The reveal names his PLACE IN HIS OWN BRACKET**, which is exactly the thing a family really does
learn – by working with him for a year and by talking to the other parents. That is also why it
honestly takes a season: you have to be inside the circle to hear it.

| where he fell in his corridor | the sentence |
| --- | --- |
| upper third | *the other parents were right: he is better than his price* |
| middle | *he is exactly what his price says* |
| lower third | *he sits at the lower end of his bracket* |

None of the three praises or blames – a low draw is reported in the same words and the same colour
as a high one. The design survives intact: a lucky `budget` coach still reads as a find (the top of
his bracket IS a typical `high`), and it still cannot be shopped for.

## 8. Time together – approved for measurement, 13.08

«Да, заводи второй вариант с замером.» Two different things grow with tenure and only one of them is
a balance change:

**8a. The CONFIDENCE of the sentence – free, and true.** One season is a small sample and the copy
should hedge accordingly («it looks like…»); by the third the hedge goes. This is the radar's own
fog applied to a person – confidence grows with observation – and it costs nothing, changes no
number, and makes a long relationship worth something on screen by itself. Ships with §7.

**8b. The EDGE ITSELF grows – the balance change, and what the measurement is for.** A coach who has
had her for years knows her serve, her temper and her calendar. This is the only mechanic that
argues against churning coaches, and churn is what the owner's whole «всю карьеру занимаются с
тренерами» is aimed at.

Shape, to be swept rather than assumed:

* **A multiplier on HIS OWN drawn value**, `pp × (1 + g(seasons))`, not a drift toward the top of
  the corridor. A drift would erase the lottery – every coach would end up at his ceiling and the
  draw would stop meaning anything. A multiplier keeps the ordering exactly: a good coach stays
  better than a poor one, and both are worth more for having stayed.
* **`g` saturates.** The knowledge of a person is mostly acquired early; a curve that keeps paying
  at season eight would make a coach an annuity.
* **Sweep the dose**: `g(3) ∈ {0.2, 0.5, 1.0}` – +20%, +50%, +100% by the third season.

**Two open questions, with recommendations:**

1. *Does firing and re-hiring the same man reset the clock?* Recommend YES for tenure (the working
   relationship restarts) while his DRAWN VALUE stays what it always was – the man is unchanged, the
   partnership is not. It also keeps the fire-rehire path from being a way to bank tenure cheaply.
2. *Does the reveal move when tenure moves it?* Recommend NO – the sentence is about who he IS, and
   §7's placement is drawn from his base value, not from what tenure has added.

⚠ **Registered prediction, before the sweep, and it is deliberately unflattering to the idea:** at
`g(3) = 0.2` this will be **invisible in outcomes** – the whole edge is worth ~$40-50k over a career
and does not touch the wall, so a fifth of it is nothing. I expect it to stay invisible at 0.5 and to
become marginally visible only around 1.0, which is where a `budget` coach of six years would be
worth a typical `elite` one and the ladder starts to blur. If that is how it measures, the honest
conclusion is that 8b's product is NARRATIVE – a reason to keep a man, not a number that changes
her career – and it should ship small and be described as what it is, or not ship at all. The
measurement decides, not this paragraph.

⚠ **And the framing is fixed regardless of the number.** «Мы ни за что не наказываем»: this is a
reward for staying, never a penalty for leaving. No screen may say what she lost by changing coach.
